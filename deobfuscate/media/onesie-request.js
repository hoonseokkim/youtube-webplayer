/**
 * Onesie streaming request lifecycle management.
 *
 * Extracted from base.js lines ~93377–94207.
 *
 * The Onesie protocol is YouTube's proprietary streaming transport that wraps
 * player requests in an encrypted UMP (Universal Media Protocol) envelope,
 * routed through a dedicated proxy endpoint. This module contains:
 *
 * - `OnesieRequest` [was: j3] — the top-level Onesie fetch/response lifecycle,
 *   including URL resolution, request encryption, XHR dispatch, timeout
 *   handling, and segment demuxing into per-video track queues.
 *
 * - `OnesieRequestHandler` [was: cH1] — the SABR (Server ABR) request
 *   orchestrator that builds the next-request payload, processes server
 *   directives (backoff, seek, context updates, error actions), and bridges
 *   the loader ↔ player interface.
 *
 * @module onesie-request
 */

import { Disposable } from '../core/disposable.js'; // was: g.qK
import { Timer } from '../core/timer.js';           // was: g.Uc
import { Deferred } from '../core/deferred.js';     // was: g8
import { PlayerError } from '../core/errors.js';    // was: g.rh
import { now } from '../core/timing.js';            // was: g.h
import { registerDisposable } from '../core/event-system.js'; // was: g.F
import { resolveOAuthToken } from '../data/bandwidth-tracker.js'; // was: g.OQ
import { serializeMessage } from '../proto/varint-decoder.js'; // was: g.yu
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { scheduleHeartbeat } from '../modules/heartbeat/health-monitor.js'; // was: LB
import { listenAll } from '../core/attestation.js'; // was: TE
import { getTimeInBuffer } from './source-buffer.js'; // was: Tm
import { imageCompanionAdRenderer } from '../core/misc-helpers.js'; // was: CA
import { adMessageRenderer } from '../core/misc-helpers.js'; // was: rc
import { CuePointProcessor } from '../player/bootstrap.js'; // was: iW
import { probeNetworkPath } from '../ads/ad-click-tracking.js'; // was: rt
import { buildNextState } from './source-buffer.js'; // was: XN
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { truncateSegments } from '../ads/ad-async.js'; // was: Z2
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { buildInnertubePlayerRequest } from './drm-signature.js'; // was: da7
import { encryptSignatureCached } from './drm-signature.js'; // was: jl7
import { createSuggestedActionCueRange } from '../ui/progress-bar-impl.js'; // was: uO
import { shouldUseAsyncDecrypt } from './drm-signature.js'; // was: gDw
import { encryptSignatureAsync } from './drm-signature.js'; // was: w2x
import { encryptSignatureSync } from './drm-signature.js'; // was: LGR
import { buildMediaBreakLayout } from '../ads/slot-id-generator.js'; // was: KF
import { setOnesieQueryParams } from './drm-signature.js'; // was: slx
import { createByteRange } from './format-parser.js'; // was: Lk
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { getVideoId } from '../player/time-tracking.js'; // was: MY()
import { isLeanback } from '../data/performance-profiling.js'; // was: y_
import { IMMUTABLE_SENTINEL } from '../proto/messages-core.js'; // was: IU
import { getStreamTimeOffsetNQ } from '../player/time-tracking.js'; // was: NQ()
import { LruRingBuffer } from './grpc-parser.js'; // was: dw
import { playerOverlayLayoutRenderer } from '../core/misc-helpers.js'; // was: kA
import { scheduleMicrotask } from '../core/composition-helpers.js'; // was: hG
import { ensureQueryDataMap } from '../core/bitstream-helpers.js'; // was: Bx
import { getElapsedPlayTime } from '../modules/remote/remote-player.js'; // was: L1
import { ordinalToQualityLabel } from './codec-tables.js'; // was: ZV
import { getAdDIInfo } from '../player/context-updates.js'; // was: DI()
import { chainPromise } from '../core/composition-helpers.js'; // was: VU
import { getNowPlayingPosition } from '../player/time-tracking.js'; // was: Np()
import { miniplayerIcon } from '../ui/svg-icons.js'; // was: D1
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { generateSessionPoToken } from '../player/video-loader.js'; // was: N2
import { recordActivity } from '../data/gel-core.js'; // was: eI
import { getVideoPlaybackResponseParams } from '../ads/dai-cue-range.js'; // was: vg
import { shouldLoadAsmjsModule } from '../player/caption-manager.js'; // was: pY
import { OnesieRequest } from './onesie-request.js'; // was: j3
import { SabrRequest } from './playback-controller.js'; // was: Cb
import { setSliderValue } from '../ui/progress-bar-impl.js'; // was: CI
import { disableSsdai } from '../ads/ad-cue-delivery.js'; // was: pE
import { listenOnce } from '../core/composition-helpers.js'; // was: E7
import { normalizeSabrError } from '../data/bandwidth-tracker.js'; // was: Khx
import { matchEnum } from '../core/composition-helpers.js'; // was: O1
import { routeSeek } from './mse-internals.js'; // was: yh
import { updateDriftParams } from '../ads/ad-async.js'; // was: Ex
import { registerSecondaryPresenter } from '../ads/ad-prebuffer.js'; // was: Ih
import { getCurrentTimeSec } from '../player/playback-bridge.js'; // was: Qd
import { logMetaCsiEvent } from '../data/gel-core.js'; // was: jl
import { clearQueuer } from '../ads/ad-prebuffer.js'; // was: mz
import { handleTrackFormatUpdate } from './segment-request.js'; // was: nYW
import { safeDecodeURIComponent } from '../data/idb-transactions.js'; // was: d_
import { preferAudioOnly } from './audio-normalization.js'; // was: bb
import { getDomain } from '../core/url-utils.js';
import { onPlayerRequestSent } from '../player/player-events.js';
import { getPlayerConfig } from '../core/attestation.js';
import { forEach } from '../core/event-registration.js';
import { dispose } from '../ads/dai-cue-range.js';
import { getCurrentTime } from '../player/time-tracking.js';
import { handleError } from '../player/context-updates.js';
import { createLogger } from '../data/logger-init.js'; // was: g.JY

// ============================================================================
// OnesieRequest  [was: j3]
// ============================================================================

/**
 * Core Onesie streaming request — manages the full fetch lifecycle from URL
 * resolution through encrypted body dispatch and segment delivery.
 *
 * Protocol identifier: {@link OnesieRequest#getProtocol} returns `"ONESIE"`.
 *
 * Error domain strings emitted via {@link OnesieRequest#fail}:
 *   - `"onesie.unavailable.hotconfig"` — no redirector URL resolved
 *   - `"onesie.request"` — generic request-level timeout / failure
 *   - `"onesie.net"` — network error (XHR error text)
 *   - `"onesie.net.badstatus"` — HTTP 4xx / 5xx
 *   - `"onesie.net.connect"` — connection-level failure
 *   - `"onesie.net.nocontent"` — HTTP 204
 *   - `"onesie.response.noplayerresponse"` — body parsed but no player response
 *
 * @extends Disposable
 */
export class OnesieRequest extends Disposable { // was: j3
  /**
   * @param {object} playerInterface    [was: Q] — player bridge (EH)
   * @param {object} playerRequest      [was: c] — innertube player request payload
   * @param {object} networkSession     [was: W] — network / QoS session (Qp)
   */
  constructor(playerInterface, playerRequest, networkSession) {
    super();

    /** @type {object} Player bridge. [was: EH] */
    this.playerInterface = playerInterface; // was: this.EH = Q

    /** @type {object} Innertube player request body. [was: playerRequest] */
    this.playerRequest = playerRequest; // was: this.playerRequest = c

    /** @type {object} Network / QoS session. [was: Qp] */
    this.networkSession = networkSession; // was: this.Qp = W

    /** @private Logger instance. [was: logger] */
    this.logger = createLogger('onesie'); // was: new g.JY("onesie")

    /** @type {Array} Pending context update queue. [was: N9] */
    this.contextUpdates = []; // was: this.N9 = []

    /** @type {Array} Received segment metadata list. [was: xk] */
    this.segmentMetadata = []; // was: this.xk = []

    /** @type {?object} Active XHR transport. [was: xhr] */
    this.xhr = null; // was: this.xhr = null

    /**
     * Request state machine:
     *   1 = INIT, 3 = COMPLETE, 4 = FINISHED_OK, 5 = FAILED, -1 = DISPOSED
     * [was: state]
     */
    this.state = 1; // was: this.state = 1

    /** @type {Deferred} Promise resolved/rejected when the request settles. [was: Wn] */
    this.deferred = new Deferred(); // was: this.Wn = new g8

    /** @type {boolean} Whether a player response has been received. [was: aT] */
    this.hasPlayerResponse = false; // was: this.aT = !1

    /** @type {string} Raw player response body. [was: playerResponse] */
    this.playerResponse = ''; // was: this.playerResponse = ""

    /** @private UMP feed/demux handler. [was: Vq] */
    this.umpFeed = new dF(this); // was: this.Vq = new dF(this)

    /** @private Onesie decryption + segment reassembly pipeline. [was: P5] */
    this.decryptPipeline = new Q0a(this); // was: this.P5 = new Q0a(this)

    /** @type {string} Active video ID for multi-video (mosaic). [was: LI] */
    this.activeVideoId = ''; // was: this.LI = ""

    /** @type {boolean} First 100 KB marker logged. [was: kp] */
    this.logged100K = false; // was: this.kp = !1

    /** @type {boolean} Whether the request has fallen back to a secondary host. [was: j$] */
    this.hasFallenBack = false; // was: this.j$ = !1

    /** @type {string} Serialised request URL. [was: Q9] */
    this.requestUrl = ''; // was: this.Q9 = ""

    /** @type {boolean} Whether mosaic partial-response mode is active. [was: P8] */
    this.isMosaicPartial = false; // was: this.P8 = !1

    /** @type {boolean} Whether the underlying request has been dispatched. [was: rD] */
    this.isDispatched = false; // was: this.rD = !1

    /** @type {boolean} Whether response compression is enabled. [was: enableCompression] */
    this.enableCompression = false; // was: this.enableCompression = !1

    /** @type {Array<object>} Registered subscriber callbacks. [was: oW] */
    this.subscribers = []; // was: this.oW = []

    /** @type {number} Latest segment number. [was: segmentNumber] */
    this.segmentNumber = -1; // was: this.segmentNumber = -1

    /** @type {number} Latest segment start time (ms). [was: segmentStartTimeMs] */
    this.segmentStartTimeMs = -1; // was: this.segmentStartTimeMs = -1

    /** @type {number} Hint for downstream buffering (bytes). [was: hm] */
    this.bufferHint = 0; // was: this.hm = 0

    /** @private Accessor shim exposed to sub-components. [was: Rk] */
    this._accessors = {
      getRequestManager: () => this.requestManager, // was: Nm: () => this.Nm
    };

    // --- Derived references ---------------------------------------------------

    /** @type {object} Player config / experiments facade. [was: FI] */
    this.playerConfig = this.playerInterface.G(); // was: this.FI = this.EH.G()

    /** @type {object} Video metadata. [was: videoData] */
    this.videoData = this.playerInterface.getVideoData(); // was: this.videoData = this.EH.getVideoData()

    /** @type {boolean} Verbose / debug logging enabled. [was: uc] */
    this.verboseLogging = this.playerConfig.cB(); // was: this.uc = this.FI.cB()

    /** @type {object} Global playback config bag. [was: Gv] */
    this.globalConfig = this.playerConfig.skipNextIcon; // was: this.Gv = this.FI.qQ

    /** @private Encryption key resolver. [was: gU] */
    this.keyResolver = new R_o(this.globalConfig.W); // was: this.gU = new R_o(this.Gv.W)

    /** @type {boolean} Whether to use check-timeout mode. [was: fq] */
    this.useCheckTimeout = this.playerConfig.X('html5_onesie_check_timeout'); // was: this.fq

    /** @private Periodic health-check timer (500 ms). [was: kO] */
    this.healthCheckTimer = new Timer(this.onHealthCheck, 500, this); // was: this.kO

    /** @private Hard-timeout timer (10 s). [was: Hq] */
    this.hardTimeoutTimer = new Timer(this.onHardTimeout, 10000, this); // was: this.Hq

    /** @private Soft-timeout timer (1 s fallback). [was: rg] */
    this.softTimeoutTimer = new Timer(() => {
      if (!this.isComplete()) {
        const info = buildDebugInfo(this); // was: L$(this)
        this.fail(new PlayerError('net.timeout', info));
      }
    }, 1000); // was: this.rg

    /** @private Host-probe timer (2 s). [was: oF] */
    this.probeTimer = new Timer(this.probeHosts, 2000, this); // was: this.oF

    /** @type {?object} Path-probe state. [was: jK] */
    this.pathProbe = this.playerInterface.f4(); // was: this.jK = this.EH.f4()

    /** @type {boolean} Wait for media availability before completing. [was: Ov] */
    this.waitForMediaAvailability = this.getExperiment(
      'html5_onesie_wait_for_media_availability',
    ); // was: this.Ov

    // Ownership / disposal chaining
    registerDisposable(this.videoData, this);
    registerDisposable(this, this.healthCheckTimer);
    registerDisposable(this, this.hardTimeoutTimer);
    registerDisposable(this, this.probeTimer);

    // Per-video segment queues (only when UMP multiplexing is available)
    const umpAvailable = mi(); // was: Q = mi()
    if (em && umpAvailable) {
      /** @type {?Map<string, object>} Per-video-ID segment queues. [was: R$] */
      this.segmentQueues = new Map(); // was: this.R$ = new Map
    }

    /** @type {Map} Video-ID → supplementary config. [was: XV] */
    this.supplementaryConfigs = new Map(); // was: this.XV
    /** @type {Map} Video-ID → pre-warm info. [was: X6] */
    this.prewarmMap = new Map(); // was: this.X6
    /** @type {Map} Video-ID → rate-limit/video info. [was: rV] */
    this.videoInfoMap = new Map(); // was: this.rV
    /** @type {Map} Video-ID → debug info. [was: KN] */
    this.debugInfoMap = new Map(); // was: this.KN
  }

  // ---------------------------------------------------------------------------
  // Segment queue accessors
  // ---------------------------------------------------------------------------

  /**
   * Return buffered segment metadata for the given video ID.
   * [was: B4]
   */
  getBufferedSegments(videoId) { // was: B4(Q)
    return this.segmentQueues?.get(videoId)?.B4() || [];
  }

  /**
   * Check whether a format is queued for a given video.
   * [was: uW]
   */
  hasQueuedFormat(formatId, videoId) { // was: uW(Q, c)
    return !!this.segmentQueues?.get(videoId)?.uW(formatId);
  }

  /**
   * Return buffered byte-ranges for `formatId` in the given video track queue.
   * [was: LB]
   */
  getBufferedRanges(formatId, videoId) { // was: LB(Q, c)
    return this.segmentQueues?.get(videoId)?.scheduleHeartbeat(formatId) || [];
  }

  /**
   * Return time-ranges for `formatId` in the given video track queue.
   * [was: TE]
   */
  getTimeRanges(formatId, videoId) { // was: TE(Q, c)
    return this.segmentQueues?.get(videoId)?.listenAll(formatId) || [];
  }

  /**
   * Get the start time (ms) of the most recent segment.
   * [was: Gn]
   */
  getSegmentStartTimeMs() { // was: Gn()
    return this.segmentStartTimeMs;
  }

  // ---------------------------------------------------------------------------
  // State machine
  // ---------------------------------------------------------------------------

  /** @private Transition to a new state and notify subscribers. [was: l3] */
  setState(newState) { // was: l3(Q)
    this.state = newState;
    this.notifySubscribers();
  }

  /** Always returns `false` — Onesie does not support live trick play. [was: tq] */
  supportsTrickPlay() { return false; } // was: tq() { return !1 }

  /** Always returns `false`. [was: qW] */
  hasNextChunk() { return false; } // was: qW() { return !1 }

  /** No-op. [was: Nz] */
  getNextChunkSize() {} // was: Nz() {}

  /** Log a timing mark through the player interface. [was: A3] */
  logTiming(label) { // was: A3(Q)
    this.playerInterface.A3(label);
  }

  /** Forward a timing-mark query. [was: Tm] */
  getTimingMark(label) { // was: Tm(Q)
    return this.playerInterface.getTimeInBuffer(label);
  }

  // ---------------------------------------------------------------------------
  // Request body and transport acknowledgement
  // ---------------------------------------------------------------------------

  /** Callback: request body acknowledged, no-op on retransmit. [was: CA] */
  onBodyAcknowledged(q, c, isRetransmit, requestMgr) { // was: CA(Q, c, W, m)
    if (!isRetransmit) this.requestManager.imageCompanionAdRenderer(requestMgr);
    return false;
  }

  // ---------------------------------------------------------------------------
  // Connection probing / path-fallback
  // ---------------------------------------------------------------------------

  /** @private Callback on fallback-host triggered. [was: Nl] */
  onFallback() { // was: Nl()
    this.logTiming('orfb');
    this.hasFallenBack = true;
    if (shouldProbeHosts(this) && this.xhr) {
      const info = {
        adMessageRenderer: this.xhr.status,                          // was: rc
        lb: this.xhr.CuePointProcessor(),                            // was: lb — loaded bytes
        probeNetworkPath: (1000 * zG3(this.requestManager)).toFixed(), // was: rt — round-trip ms
        shost: getDomain(this.requestUrl),                 // was: shost
        trigger: 'o1',                                // was: trigger
      };
      this.logQoe('pathprobe', Tb(info));
    }
  }

  /** Callback: player response header received. [was: Wv] */
  onPlayerResponseReceived() { // was: Wv()
    this.logTiming('opr_r');
    this.hasPlayerResponse = true;
  }

  // ---------------------------------------------------------------------------
  // Segment delivery (from UMP demuxer → per-video queues)
  // ---------------------------------------------------------------------------

  /**
   * Receive a demuxed segment chunk and route it to the correct per-video queue.
   * [was: XN]
   *
   * @param {string} videoId      [was: Q]
   * @param {number} headerId     [was: c]
   * @param {boolean} isEncrypted [was: W]
   * @param {object} segmentInfo  [was: m]
   */
  onSegmentReceived(videoId, headerId, isEncrypted, segmentInfo) { // was: XN(Q, c, W, m)
    this.segmentMetadata.push(segmentInfo);
    if (this.segmentQueues) {
      if (!this.segmentQueues.has(videoId)) {
        const queue = new b79(this); // was: new b79(this)
        this.segmentQueues.set(videoId, queue);
        registerDisposable(this, queue);
      }
      this.segmentQueues.get(videoId)?.buildNextState(headerId, isEncrypted, segmentInfo);
      se(this); // was: se(this) — flush / notify
      if (!isEncrypted) {
        this.segmentNumber = segmentInfo.Rg;       // was: m.Rg
        this.segmentStartTimeMs = segmentInfo.startMs; // was: m.startMs
      }
    } else {
      se(this);
    }
  }

  /** Return the full list of received segment metadata. [was: L6] */
  getReceivedSegments() { // was: L6()
    return this.segmentMetadata;
  }

  /** Clear the received-segment list. [was: Xx] */
  clearReceivedSegments() { // was: Xx()
    this.segmentMetadata = [];
  }

  // ---------------------------------------------------------------------------
  // Config / prewarm updates
  // ---------------------------------------------------------------------------

  /** Apply a server-pushed media config update. [was: QB] */
  applyMediaConfig(config) { // was: QB(Q)
    this.m1 = config; // was: this.m1 = Q
    if (config.HL != null) this.playerInterface.zk(config.HL);
  }

  /** Store next-request policy override. [was: RL] */
  setNextRequestPolicy(policy) { // was: RL(Q)
    this.nextRequestPolicy = policy; // was: this.L4 = Q
  }

  /** Cache a per-video pre-warm descriptor. [was: dW] */
  cachePrewarm(descriptor) { // was: dW(Q)
    if (descriptor.videoId) this.prewarmMap.set(descriptor.videoId, descriptor);
  }

  /** Trigger UMP prewarm connections. [was: Cp] */
  triggerUmpPrewarm(config) { // was: Cp(Q)
    if (config.url) {
      for (const url of config.url) {
        probeNetworkPath(url, 'ump_prewarm');
      }
    }
  }

  /** Flush all per-video segment queues. [was: Ef] */
  flushSegmentQueues() { // was: Ef()
    if (this.segmentQueues) {
      for (const videoId of this.segmentQueues.keys()) {
        this.segmentQueues.get(videoId)?.bu();
      }
    }
  }

  /** Store a seek-point override. [was: Bp] */
  setSeekTarget(target) { // was: Bp(Q)
    this.nR = target; // was: this.nR = Q
  }

  /**
   * Ingest debug info from a server-pushed diagnostic payload.
   * [was: yg]
   */
  ingestDebugInfo(payload) { // was: yg(Q)
    if (payload?.sQ && (payload = payload.sQ.DA)) {
      for (const entry of payload) {
        if (entry.videoId) this.debugInfoMap.set(entry.videoId, entry);
      }
    }
  }

  /** Enqueue a pending context update. [was: Qg] */
  enqueueContextUpdate(update) { // was: Qg(Q)
    this.contextUpdates.push(update);
  }

  /** Forward a QoE log entry. [was: tJ] */
  logQoe(tag, data, flag = false) { // was: tJ(Q, c, W=!1)
    this.playerInterface.RetryTimer(tag, data, flag);
  }

  /** Forward a per-video segment update to a queue. [was: Z2] */
  updateSegmentQueue(videoId, headerId, formatId) { // was: Z2(Q, c, W)
    this.segmentQueues?.get(videoId)?.truncateSegments(headerId, formatId);
  }

  /** Store rate-limit / video info for a video ID. [was: vK] */
  storeVideoInfo(info) { // was: vK(Q)
    this.videoInfoMap.set(info.videoId, info);
  }

  // ---------------------------------------------------------------------------
  // Fetch — the main request lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Initiate the Onesie request: resolve the redirector URL, obtain an OAuth
   * token, encrypt the innertube request body, and dispatch via XHR/fetch.
   *
   * Returns a {@link Deferred} that settles when the full response is received
   * or the request fails.
   *
   * [was: fetch]
   */
  async fetch() {
    this.useCheckTimeout ? this.healthCheckTimer.start() : this.hardTimeoutTimer.start();
    this.logTiming('or_i');

    const shouldLogVerbose =
      this.playerConfig.experiments.SG('html5_onesie_verbose_timing') ||
      this.playerConfig.getExperimentFlags.W.BA(eO0);
    const verboseLog = shouldLogVerbose ? this.logTiming.bind(this) : () => {};

    // --- Resolve redirector URL ------------------------------------------------
    verboseLog('oloc_ss');
    let redirectorUrl = Zc0(this.videoData, this.pathProbe); // was: c = Zc0(...)
    if (!redirectorUrl) {
      verboseLog('oloc_sa');
      const timeoutMs = getExperimentValue(this.playerConfig.experiments, 'html5_onesie_redirector_timeout_ms');
      redirectorUrl = await EDn(this.videoData, this.pathProbe, timeoutMs);
    }

    if (!redirectorUrl) {
      this.fail(new PlayerError('onesie.unavailable.hotconfig', { url: '0' }));
      return this.deferred;
    }

    this.requestEndpoint = uB(28, 7440, redirectorUrl); // was: this.u$
    verboseLog('oloc_e');

    // --- OAuth token -----------------------------------------------------------
    let tokenResult = resolveOAuthToken(this.playerConfig, this.videoData.D()); // was: W
    const isAsync = !!tokenResult.W; // was: m
    const oauthToken = isAsync ? await tokenResult.W : tokenResult.getValue(); // was: W

    if (this.getExperiment('html5_log_onesie_empty_oauth') && !oauthToken) {
      this.logQoe('no_token', { async: isAsync });
    }

    // --- Build encrypted request body -----------------------------------------
    let requestBody = buildInnertubePlayerRequest(
      this.playerRequest, this.playerConfig, this.videoData,
      oauthToken, e3(this.requestEndpoint),
    ); // was: m

    let encryptedPayload; // was: K
    try {
      if (
        !this.playerConfig.La ||
        this.playerConfig.La?.W ||
        requestBody?.DS
      ) {
        // Attempt WebCrypto-based encryption first (fast path).
        verboseLog('orqb_w');  // was: Q("orqb_w")
        const audioSourceVideoId = this.getExperiment(
          'onesie_cdm_mosaic_send_audio_tracks_from_client',
        )
          ? this.playerRequest.playbackContext?.contentPlaybackContext
              ?.compositeVideoContext?.defaultActiveSourceVideoId
          : undefined;

        encryptedPayload = encryptSignatureCached(
          requestBody, this.keyResolver, this.playerConfig,
          this.playerInterface, this.networkSession,
          this.globalConfig.onesieUstreamerConfig,
          this.videoData.createSuggestedActionCueRange?.VL, audioSourceVideoId,
        ); // was: K = jl7(...)

        if (encryptedPayload) {
          this.logQoe('orpqenc', { i: 'w' });
        }
      }

      if (!encryptedPayload) {
        const hasSubtleCrypto = shouldUseAsyncDecrypt(this, requestBody); // was: T = gDw(...)
        const asyncEncryptTimeoutMs = this.playerConfig.getExperimentFlags.W.BA(A20); // was: U
        const useAsyncTimeout = asyncEncryptTimeoutMs > 0; // was: W

        const audioSourceVideoId = this.getExperiment(
          'onesie_cdm_mosaic_send_audio_tracks_from_client',
        )
          ? this.playerRequest.playbackContext?.contentPlaybackContext
              ?.compositeVideoContext?.defaultActiveSourceVideoId
          : undefined;

        if (hasSubtleCrypto) {
          verboseLog('orqb_a');
          let asyncResult = encryptSignatureAsync(
            requestBody, this.keyResolver, this.playerConfig,
            this.playerInterface, this.networkSession,
            this.globalConfig.onesieUstreamerConfig,
            this.videoData.createSuggestedActionCueRange?.VL, audioSourceVideoId,
          ); // was: r = w2x(...)

          if (useAsyncTimeout) {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(`timeout ${asyncEncryptTimeoutMs}ms`), asyncEncryptTimeoutMs);
            });
            asyncResult = Promise.race([asyncResult, timeoutPromise]).catch((err) => {
              this.logQoe('orpqenc', { i: 'a', e: `${err}` });
              verboseLog('orqb_f');
            });
          }

          encryptedPayload = await asyncResult;
          if (encryptedPayload || !useAsyncTimeout) {
            this.logQoe('orpqenc', { i: 'a' });
          }
        }

        // Fallback: synchronous / JSON-based encryption.
        if (!hasSubtleCrypto || (useAsyncTimeout && !encryptedPayload)) {
          verboseLog('orqb_s');
          encryptedPayload = encryptSignatureSync(
            requestBody, this.keyResolver, this.playerConfig,
            this.playerInterface, this.networkSession,
            this.globalConfig.onesieUstreamerConfig,
            this.videoData.createSuggestedActionCueRange?.VL, audioSourceVideoId,
          );
          this.logQoe('orpqenc', { i: 'j' });
        }
      }
    } catch (err) {
      this.fail(err);
      return this.deferred;
    }

    verboseLog('orqb_e');

    this.enableCompression = encryptedPayload.innertubeRequest.aX;
    this.bufferHint = encryptedPayload?.buildMediaBreakLayout?.vp || 0;

    // --- Dispatch XHR ----------------------------------------------------------
    this.logTiming('osor');
    const xhrHeaders = ZF7(); // was: T = ZF7()
    const fetchOptions = {
      method: 'POST',
      body: serializeMessage(encryptedPayload, kT7),
      headers: {
        'Content-Type': 'text/plain',
        Referer: location.origin,
      },
    };

    const mediaCapabilities = this.getExperiment('html5_onesie_media_capabilities');
    setOnesieQueryParams(redirectorUrl, this.videoData, aV_(this), mediaCapabilities);

    if (this.verboseLogging) this.logQoe('ombrs', '1');

    /** @private UMP request manager. [was: Nm] */
    this.requestManager = new sA(this, {
      Qp: this.networkSession,
      Ft: this.verboseLogging,
      oN: (tag, data) => { this.playerInterface.Tt(tag, data); },
      B5: true, // was: !0
    });

    redirectorUrl.set('rn', `${this.requestManager.requestNumber}`);
    this.requestUrl = redirectorUrl.createByteRange();
    lK0(this.requestManager, this.requestUrl);

    this.logTiming('or_p');
    this.xhr = s6(new y9(redirectorUrl), xhrHeaders, this.requestManager, em, fetchOptions);
    this.probeTimer.start();
    this.playerInterface.onPlayerRequestSent(this.videoData.videoId);

    return this.deferred;
  }

  // ---------------------------------------------------------------------------
  // Transport priority
  // ---------------------------------------------------------------------------

  /** Return transport priority (2 = Onesie). [was: xU] */
  getTransportPriority() { return 2; } // was: xU() { return 2 }

  // ---------------------------------------------------------------------------
  // Response callbacks
  // ---------------------------------------------------------------------------

  /** Callback: response headers received. [was: d9] */
  onResponseHeaders() { // was: d9()
    this.logTiming('orh_r');
  }

  /** Callback: first byte / body start. [was: P7] */
  onFirstByte() { // was: P7()
    if (!this.hasFallenBack && this.xhr.CuePointProcessor()) this.onFallback();
    if (this.isDispatched && !this.useCheckTimeout) this.softTimeoutTimer?.start();
    this.processResponseChunk();
  }

  /**
   * Callback: response complete (or aborted).
   * [was: U$]
   *
   * @param {boolean} [aborted=false] [was: Q] — true if the caller triggered abort
   */
  onResponseComplete(aborted = false) { // was: U$(Q=!1)
    this.processResponseChunk();
    if (this.hasFailed() || this.state >= 4) return;

    const debugInfo = buildDebugInfo(this); // was: c = L$(this)
    const transport = this.xhr; // was: W = this.xhr
    debugInfo.adMessageRenderer = transport.status;
    if (aborted) debugInfo.ab = true; // was: c.ab = !0

    let errorDomain; // was: m
    if (transport.eB()) {
      errorDomain = 'onesie.net';
      debugInfo.msg = transport.eB();
    } else if (transport.status >= 400) {
      errorDomain = 'onesie.net.badstatus';
    } else if (transport.pg()) {
      if (!this.hasPlayerResponse) errorDomain = 'onesie.response.noplayerresponse';
    } else if (transport.status === 204) {
      errorDomain = 'onesie.net.nocontent';
    } else {
      errorDomain = 'onesie.net.connect';
    }

    if (errorDomain) {
      this.fail(new PlayerError(errorDomain, debugInfo));
    } else {
      this.logTiming('or_fs');
      this.requestManager.skipNextIcon(now(), transport.CuePointProcessor(), 0);
      this.setState(4);
      if (this.verboseLogging) this.logQoe('rqs', debugInfo);
    }

    if (this.verboseLogging) this.logQoe('ombre', `ok.${+!errorDomain}`);
    this.waitForMediaAvailability = false; // was: this.Ov = !1
    se(this); // flush
    Ee(this.decryptPipeline); // was: Ee(this.P5)

    if (!this.useCheckTimeout) {
      this.hardTimeoutTimer.stop();
      this.softTimeoutTimer?.stop();
    }

    const probeResults = this.pathProbe?.j(); // was: Q = this.jK?.j()
    if (probeResults) {
      for (let i = 0; i < probeResults.length; i++) {
        this.logQoe('pathprobe', probeResults[i]);
      }
    }
  }

  /**
   * Check whether all segment queues have delivered, and if so abort early.
   * [was: HK]
   */
  checkEarlyAbort() { // was: HK()
    if (this.playerResponse && this.xhr && this.segmentQueues) {
      for (const [, queue] of this.segmentQueues.entries()) {
        if (queue.j) {
          this.xhr.abort();
          this.onResponseComplete(true);
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** Return the player config facade. [was: G] */
  getPlayerConfig() { return this.playerConfig; } // was: G() { return this.FI }

  /** Experiment feature-flag shortcut. [was: X] */
  getExperiment(flag) { return this.playerConfig.X(flag); } // was: X(Q)

  // ---------------------------------------------------------------------------
  // Host probing
  // ---------------------------------------------------------------------------

  /**
   * Probe secondary hosts for connectivity when relevant experiments are active.
   * [was: mT]
   */
  probeHosts() { // was: mT()
    if (!shouldProbeHosts(this) || !this.pathProbe) return;
    if (this.hasFallenBack && !this.getExperiment('html5_onesie_probe_ec_hosts')) return;

    const probe = this.pathProbe; // was: Q = this.jK
    if (probe.FI.experiments.SG('html5_onesie_probe_ec_hosts')) {
      const host3 = probe.W.get(3)?.W();
      if (host3) Be(probe, host3, 'osc', this);
      const host4 = probe.W.get(4)?.W();
      if (host4) Be(probe, host4, 'ocy', this);
    } else {
      const host1 = probe.W.get(1)?.W();
      if (host1) Be(probe, host1, 'o2', this);
      const host2 = probe.W.get(2)?.W();
      if (host2) Be(probe, host2, 'o3', this);
    }
  }

  // ---------------------------------------------------------------------------
  // Timeout / health check
  // ---------------------------------------------------------------------------

  /**
   * Periodic health check — fires every 500 ms when `useCheckTimeout` is set.
   * Detects stalls and triggers timeout if the request manager has not
   * received data for > 1 s (dispatched) or > 10 s (pre-dispatch).
   * [was: C8]
   */
  onHealthCheck() { // was: C8()
    if (this.hasFailed() || this.isComplete()) return;

    if (this.isDispatched) {
      if (now() - this.requestManager.J > 1000) {
        this.requestManager?.toggleFineScrub(now());
        const debugInfo = buildDebugInfo(this);
        if (this.verboseLogging && this.xhr instanceof pDn) {
          const xhrImpl = this.xhr; // was: Q
          debugInfo.xrs = xhrImpl.xhr.readyState;
          debugInfo.xpb = xhrImpl.W.totalLength;
          debugInfo.xdc = xhrImpl.j;
        }
        this.fail(new PlayerError('net.timeout', debugInfo));
      }
    } else {
      const asyncTimeout = this.playerConfig.getExperimentFlags.W.BA(A20);
      if (asyncTimeout > 0 && !this.requestManager) {
        /* pre-dispatch: no-op while async encrypt is pending */
      } else if (now() - this.requestManager.W > 10000) {
        this.requestManager?.toggleFineScrub(now());
        this.onHardTimeout();
      }
    }

    if (!this.isComplete()) this.healthCheckTimer.start();
  }

  /**
   * Hard timeout handler — fail with `"onesie.request"` if no media
   * availability was signalled.
   * [was: zc]
   */
  onHardTimeout() { // was: zc()
    this.waitForMediaAvailability = false; // was: this.Ov = !1
    if (!se(this)) {
      const debugInfo = buildDebugInfo(this);
      debugInfo.timeout = '1';
      this.fail(new PlayerError('onesie.request', debugInfo));
    }
  }

  // ---------------------------------------------------------------------------
  // Failure
  // ---------------------------------------------------------------------------

  /**
   * Transition to the FAILED state, reject the deferred, and clean up timers.
   * [was: fail]
   *
   * @param {Error|PlayerError} error
   */
  fail(error) { // was: fail(Q)
    error = UU(error); // was: Q = UU(Q) — normalise error
    if (this.isDispatched) {
      this.playerInterface.I$(error);
    } else {
      this.deferred.reject(error);
      this.isDispatched = true; // was: this.rD = !0
    }
    Ee(this.decryptPipeline);
    if (!this.useCheckTimeout) this.hardTimeoutTimer.stop();
    this.logTiming('or_fe');
    this.pathProbe?.j()?.forEach((entry) => {
      this.logQoe('pathprobe', entry);
    });
    this.setState(5);
    this.dispose();
  }

  // ---------------------------------------------------------------------------
  // State queries
  // ---------------------------------------------------------------------------

  /** True when state >= 3 (COMPLETE, FINISHED_OK, or FAILED). [was: isComplete] */
  isComplete() { return this.state >= 3; }

  /** True when state === 4 (finished successfully). [was: lQ] */
  isFinishedOk() { return this.state === 4; } // was: lQ()

  /** Check if a given video's queue is complete. [was: iQ] */
  isVideoComplete(videoId) { // was: iQ(Q)
    return this.isComplete() || !!this.segmentQueues?.get(videoId)?.A;
  }

  /** Always `false` — Onesie does not support live rewind gaps. [was: Gc] */
  hasGap() { return false; } // was: Gc()

  /** True when state === 5. [was: CB] */
  hasFailed() { return this.state === 5; } // was: CB()

  /**
   * Notify all registered subscribers, optionally filtered by video ID.
   * [was: notifySubscribers]
   */
  notifySubscribers(videoId) { // was: notifySubscribers(Q)
    for (let i = 0; i < this.subscribers.length; i++) {
      if (!videoId || this.subscribers[i].getVideoId === videoId) {
        gB(this.subscribers[i], this);
      }
    }
  }

  /** Return the buffer hint value. [was: V8] */
  getBufferHint() { return this.bufferHint; } // was: V8()

  // ---------------------------------------------------------------------------
  // Disposal
  // ---------------------------------------------------------------------------

  /** @override Clean up all state and abort any in-flight request. [was: WA] */
  dispose() { // was: WA()
    this.playerResponse = '';
    this.xhr?.abort();
    Ee(this.decryptPipeline);
    this.umpFeed.dispose();
    this.softTimeoutTimer?.dispose();
    this.setState(-1);
    this.subscribers = [];
    this.clearReceivedSegments();
    this.contextUpdates = [];
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Response body processing
  // ---------------------------------------------------------------------------

  /**
   * Pull available bytes from the transport and feed them into the UMP
   * demuxer, then flush per-video segment queues.
   * [was: At]
   */
  processResponseChunk() { // was: At()
    try {
      const transport = this.xhr;
      if (transport.CuePointProcessor() > 102400 && !this.logged100K) {
        this.logTiming('or100k');
        this.logged100K = true; // was: this.kp = !0
      }
      if (transport.Fz()) {
        const responseStream = transport.rS(); // was: c = Q.rS()
        const totalLength = responseStream.totalLength;
        if (this.verboseLogging) this.logQoe('ombrss', `len.${totalLength}`);
        this.umpFeed.feed(responseStream);
      }
      if (this.segmentQueues) {
        for (const videoId of this.segmentQueues.keys()) {
          this.segmentQueues.get(videoId)?.bu();
          this.notifySubscribers(videoId);
        }
      }
    } catch (err) {
      this.fail(err);
    }
  }

  /** Check whether a video's queue has pending data. [was: vO] */
  hasPendingData(videoId) { // was: vO(Q)
    return !!this.segmentQueues?.get(videoId)?.J();
  }

  /** Return the request manager's sequence number. [was: d_] */
  getRequestNumber() { // was: d_()
    return this.requestManager.requestNumber;
  }

  /** Return stored video info by ID. [was: B9] */
  getVideoInfo(videoId) { // was: B9(Q)
    return this.videoInfoMap.get(videoId);
  }

  /** Always `false` — not a zero-latency transport. [was: ZT] */
  isZeroLatency() { return false; } // was: ZT()

  /**
   * Return the protocol identifier string `"ONESIE"`.
   * [was: Gl]
   */
  getProtocol() { // was: Gl()
    return 'ONESIE';
  }
}


// ============================================================================
// OnesieRequestHandler  [was: cH1]
// ============================================================================

/**
 * SABR request orchestrator — builds next-request payloads from buffer state,
 * handles server directives (backoff, seek, error actions, context lifecycle),
 * and bridges the loader ↔ player interface.
 *
 * @extends Disposable
 */
export class OnesieRequestHandler extends Disposable { // was: cH1
  /**
   * @param {object} playerInterface    [was: Q] — player bridge (EH)
   * @param {object} loader             [was: c] — segment loader
   * @param {object} policy             [was: W] — playback policy
   * @param {object} audioTrack         [was: m] — audio track state
   * @param {object} videoTrack         [was: K] — video track state
   * @param {object} networkManager     [was: T] — network/host manager (k0)
   * @param {object} networkSession     [was: r] — QoS session (Qp)
   * @param {object} hostFallback       [was: U] — host-fallback config (Fw)
   * @param {object} formatSelector     [was: I] — format/quality selector (O)
   * @param {object} timingInfo         [was: X] — timing metadata
   * @param {object} bandwidthEstimator [was: A] — bandwidth estimator (b0)
   * @param {object} liveSeekManager    [was: e] — live-seek / schedule (J)
   */
  constructor(
    playerInterface, loader, policy, audioTrack, videoTrack,
    networkManager, networkSession, hostFallback, formatSelector,
    timingInfo, bandwidthEstimator, liveSeekManager,
  ) {
    super();

    /** @type {object} Player bridge. [was: EH] */
    this.playerInterface = playerInterface;
    /** @type {object} Segment loader. [was: loader] */
    this.loader = loader;
    /** @type {object} Playback policy. [was: policy] */
    this.policy = policy;
    /** @type {object} Audio track state. [was: audioTrack] */
    this.audioTrack = audioTrack;
    /** @type {object} Video track state. [was: videoTrack] */
    this.videoTrack = videoTrack;
    /** @type {object} Network / host manager. [was: k0] */
    this.networkManager = networkManager;
    /** @type {object} Network / QoS session. [was: Qp] */
    this.networkSession = networkSession;
    /** @type {object} Host-fallback config. [was: Fw] */
    this.hostFallback = hostFallback;
    /** @type {object} Format / quality selector. [was: O] */
    this.formatSelector = formatSelector;
    /** @type {object} Timing metadata. [was: timing] */
    this.timing = timingInfo;
    /** @type {object} Bandwidth estimator. [was: b0] */
    this.bandwidthEstimator = bandwidthEstimator;
    /** @type {object} Live-seek / SABR schedule manager. [was: J] */
    this.liveSeekManager = liveSeekManager;

    // --- Internal state -------------------------------------------------------

    /** @type {Array} Pending request queue. [was: W] */
    this.pendingRequests = [];
    /** @type {object} Request metadata bag. [was: j] */
    this.requestMeta = {};
    /** @type {boolean} Server requested a reload. [was: EC] */
    this.serverRequestedReload = false;
    /** @type {boolean} Error action "stop" has been seen. [was: UH] */
    this.hasSeenStopAction = false;
    /** @type {number} Queued seek position (ms). [was: Sp] */
    this.queuedSeekMs = 0;
    /** @type {number} Malformed-config retry counter. [was: La] */
    this.malformedConfigRetries = 0;
    /** @type {boolean} Whether next-request is joinable. [was: jj] */
    this.isJoinable = true;
    /** @type {boolean} Whether the stream has started. [was: nI] */
    this.hasStreamStarted = false;
    /** @type {boolean} Whether head-of-line data exists. [was: Y0] */
    this.hasHeadData = false;
    /** @type {number} Context-update checkpoint. [was: mF] */
    this.contextCheckpoint = 0;

    /** @private Audio buffer stats. [was: S] */
    this.audioBufferStats = { requestCount: 0, bytesPending: 0 }; // was: { R9: 0, hp: 0 }
    /** @private Video buffer stats. [was: Re] */
    this.videoBufferStats = { requestCount: 0, bytesPending: 0 }; // was: { R9: 0, hp: 0 }

    /** @type {?object} Bandwidth-adaptive schedule. [was: Z1] */
    this.adaptiveSchedule = null;

    /** @private Audio segment list. [was: Ie] */
    this.audioSegments = { timestamps: [], durations: [] }; // was: { h3: [], kA: [] }
    /** @private Video segment list. [was: MM] */
    this.videoSegments = { timestamps: [], durations: [] }; // was: { h3: [], kA: [] }

    /** @type {?object} Caption / auxiliary data track. [was: D] */
    this.captionData = null;
    /** @type {Array} Caption segment list. [was: K (array)] */
    this.captionSegments = [];
    /** @type {number} Min-estimated-time across tracks. [was: Ka] */
    this.minEstimatedTime = 0;
    /** @type {boolean} Player reload requested. [was: XI] */
    this.reloadRequested = false;

    /**
     * Accessors exposed to the SABR request-body builder.
     * [was: Rk]
     */
    this._accessors = {
      getPendingRequests: () => this.pendingRequests,           // was: dYy
      getRequestMeta: () => this.requestMeta,                   // was: eJI
      clearPendingRequests: () => { this.pendingRequests.length = 0; }, // was: bkJ
      getActiveContextTypes: () => this.videoData.jG,           // was: Cga
      getContextCheckpoint: () => this.contextCheckpoint,       // was: j80
      setContextCheckpoint: (v) => { this.contextCheckpoint = v; }, // was: ClF
      setAudioBytesPending: (v) => { this.audioBufferStats.bytesPending = v; }, // was: rEF
      setCaptionData: (v) => { this.captionData = v; },         // was: Nt
      setCaptionSegments: (v) => { this.captionSegments = v; }, // was: Cm
      buildNextRequest: () => this.buildNextRequest(),          // was: y3
    };

    /** @type {object} Video metadata (derived). [was: videoData] */
    this.videoData = this.playerInterface.getVideoData();

    /**
     * Minimum buffer-ahead target (ms), adjusted for latency class.
     * [was: Y]
     */
    this.minBufferAheadMs =
      this.videoData.latencyClass === 'LOW' ? 50
      : this.videoData.latencyClass === 'ULTRALOW' ? 100
      : this.policy.isLeanback;

    // Optional throttle/prefetch manager
    if (this.policy.tQ) {
      /** @private Prefetch throttle. [was: T2] */
      this.prefetchThrottle = new Cw4(this.loader, this.policy, this.networkSession);
      registerDisposable(this, this.prefetchThrottle);
    }
  }

  // ---------------------------------------------------------------------------
  // Next-request payload builder
  // ---------------------------------------------------------------------------

  /**
   * Build the full next-request descriptor consumed by the SABR transport.
   *
   * Aggregates buffer state from audio + video tracks, current media time,
   * format/quality lists, and policy overrides into a single object.
   *
   * [was: y3]
   *
   * @param {object} [overrides] — optional override hints [was: Q]
   * @returns {object} SABR next-request descriptor
   */
  buildNextRequest(overrides) { // was: y3(Q)
    // Compute current media time in ms
    let currentTimeMs;
    if (
      oA(this.loader) && overrides &&
      overrides.IMMUTABLE_SENTINEL !== undefined && !overrides.MV
    ) {
      currentTimeMs = overrides.IMMUTABLE_SENTINEL * 1000 + (this.loader.getStreamTimeOffsetNQ || 0);
    } else {
      currentTimeMs = f$(this); // was: f$(this)
    }

    // Gather segment lists
    let audioSegList, videoSegList;
    if (this.policy.AA) {
      audioSegList = this.audioSegments;
      videoSegList = this.videoSegments;
    } else {
      audioSegList = a4(this, this.audioTrack);
      videoSegList = a4(this, this.videoTrack);
    }

    const timestamps = [...audioSegList.timestamps, ...videoSegList.timestamps]; // was: h3
    if ($o(this)) timestamps.push(...this.captionSegments);
    const durations = [...audioSegList.durations, ...videoSegList.durations]; // was: kA

    const liveEdgeMs = this.loader.LruRingBuffer(); // was: r

    // Validate currentTimeMs for VOD
    if (this.policy.K7 && !this.videoData.isLivePlayback) {
      const durationMs = this.videoData.lengthSeconds * 1000; // was: U
      if (currentTimeMs >= durationMs) {
        this.loader.RetryTimer('invalidSabrCmt', { cmt: currentTimeMs, vd: durationMs });
      }
    }

    // Determine suspended / BN state
    const suspendedState = overrides?.BN
      ? overrides.BN
      : this.loader.isSuspended ? 4 : undefined;

    // Assemble the descriptor
    const descriptor = {
      Qp: this.networkSession,                // was: Qp
      EH: this.playerInterface,               // was: EH
      k0: this.networkManager,                // was: k0
      h3: timestamps,                         // segment start-times
      playerOverlayLayoutRenderer: durations,                          // segment durations
      vp: currentTimeMs,                      // was: vp — current media position (ms)
      nextRequestPolicy: this.nextRequestPolicy, // was: A (this.A)
      Pd: this.videoData.jG,                  // was: Pd — active context types
      Ck: this.policy,                        // was: Ck
      scheduleMicrotask: this.loader.aL,                     // was: hG
      ensureQueryDataMap: jmK(this.loader) * 1000,           // was: Bx — bandwidth estimate (bps)
      lG: this.jG?.lG,                        // was: lG
      gS: this.jG?.gS,                        // was: gS
      Sp: this.queuedSeekMs,                  // was: Sp
      D_: Number(this.formatSelector.j?.info.itag) || 0, // was: D_ — audio itag
      qV: Number(this.formatSelector.K?.info.itag) || 0, // was: qV — video itag
      getElapsedPlayTime: liveEdgeMs,                         // was: L1
      ordinalToQualityLabel: this.playerInterface.getAdDIInfo,          // was: ZV
      BN: suspendedState,                     // was: BN
      jj: this.isJoinable,                    // was: jj
      Hd: this.hasHeadData,                   // was: Hd
      nI: this.hasStreamStarted,              // was: nI
    };

    // Transport path-probe info
    const pathInfo = this.loader.tp(); // was: K
    const pathMark = Is(pathInfo);     // was: T
    if (pathInfo) descriptor.chainPromise = pathMark;

    // Live playback pointer
    const livePointer =
      oA(this.loader) && overrides?.MV
        ? overrides.IMMUTABLE_SENTINEL
        : this.playerInterface.getNowPlayingPosition;
    if (livePointer) descriptor.X7 = livePointer * 1000;

    // Video format candidates
    const fmtSel = this.formatSelector; // was: Q (reused)
    let hasUsableKey = fmtSel.S;
    if (fmtSel.Ck?.UH() && !hasUsableKey) {
      for (const fmt of fmtSel.A) {
        if (fmt.miniplayerIcon) { hasUsableKey = true; break; }
      }
    }
    const videoFormats = fmtSel.Ck.UH() && !hasUsableKey ? [] : agx(fmtSel, fmtSel.A);
    descriptor.CT = videoFormats;

    // Audio format candidates
    const fmtSel2 = this.formatSelector;
    let audioFormats;
    if (fmtSel2.Ck.UH() && !fmtSel2.isSamsungSmartTV) {
      audioFormats = [];
    } else {
      let candidates = v7d(fmtSel2);
      if (candidates.length === 0) candidates = fmtSel2.D;
      audioFormats = agx(fmtSel2, candidates);
    }
    descriptor.PF = audioFormats;

    // Caption data
    descriptor.yd = $o(this) ? [this.captionData] : undefined;

    // Known format IDs
    descriptor.generateSessionPoToken = Array.from(QI(this.formatSelector.W).keys(), Number);
    descriptor.v7 = this.formatSelector.v7();

    // Byte-range estimates for SABR
    if (this.policy.Xb) {
      descriptor.recordActivity = oMK(this.loader, this.audioTrack);
      descriptor.Wq = oMK(this.loader, this.videoTrack);
    }

    // Min estimated time
    const mediaTime = this.loader.getCurrentTime();
    const audioMinEst = ve(this, audioSegList.timestamps, mediaTime);
    const videoMinEst = ve(this, videoSegList.timestamps, mediaTime);
    this.minEstimatedTime = Math.min(audioMinEst, videoMinEst);

    if (this.policy.O) {
      if ($o(this)) {
        const captionMinEst = ve(this, this.captionSegments, mediaTime);
        if (this.playerInterface.cB() && captionMinEst < this.minEstimatedTime) {
          this.loader.RetryTimer('sabrcfb', {
            met: this.minEstimatedTime,
            cet: captionMinEst,
            cbrl: this.captionSegments.length,
          });
        }
        this.minEstimatedTime = Math.min(this.minEstimatedTime, captionMinEst);
      }
      if (!this.policy.K) {
        const scheduleHint = this.adaptiveSchedule?.getVideoPlaybackResponseParams(this.minEstimatedTime);
        if (scheduleHint) descriptor.Yc = scheduleHint;
      }
    }

    if (this.policy.K) {
      const containerType = this.videoData.shouldLoadAsmjsModule[this.videoData.O?.containerType || 0];
      const seekEstimate =
        this.loader.isSeeking() && !this.loader.W7
          ? this.minEstimatedTime + this.loader.getStreamTimeOffsetNQ
          : NaN;
      descriptor.Yl = this.liveSeekManager?.Y(seekEstimate, containerType);
      this.liveSeekManager?.S();
    }

    if (this.policy.mF && this.pendingRequests.length > 0 && this.pendingRequests[0].qW()) {
      descriptor.E1 = this.pendingRequests[0].Nz();
    }

    return descriptor;
  }

  // ---------------------------------------------------------------------------
  // Request lifecycle callbacks
  // ---------------------------------------------------------------------------

  /**
   * Called when a new SABR request response arrives.
   * Clears any pending backoff and processes the response.
   * [was: Fn]
   */
  onRequestResponse(isComplete, reason) { // was: Fn(Q, c)
    this.nextRequestBackoffTime = undefined; // was: this.L = void 0
    uUX(this); // was: uUX(this)
    QXm(this, isComplete, reason); // was: QXm(this, Q, c)
  }

  /**
   * Check whether the first pending request matches the given time offset.
   * [was: dT]
   */
  matchesPendingTime(timeMs) { // was: dT(Q)
    if (this.pendingRequests.length === 0) return false;
    const first = this.pendingRequests[0]; // was: c
    if (first instanceof OnesieRequest) {
      return timeMs === this.loader.getCurrentTime() * 1000;
    }
    return !(first instanceof SabrRequest && first.info.W?.buildMediaBreakLayout?.X7) &&
      Math.abs(first.V8() - timeMs) < 50;
  }

  // ---------------------------------------------------------------------------
  // Server directives
  // ---------------------------------------------------------------------------

  /**
   * Apply a next-request policy from the server (including backoff).
   * [was: dW]
   */
  applyNextRequestPolicy(nextPolicy, requestNumber) { // was: dW(Q, c)
    this.nextRequestPolicy = nextPolicy; // was: this.A = Q
    if (this.policy.O && !nextPolicy.playbackCookie) {
      this.loader.RetryTimer('sbrnocookie', { rn: requestNumber ?? -1 });
    }
    if (this.policy.S8 && this.liveSeekManager?.L()) {
      this.loader.RetryTimer('clsdai', {
        ignbckoff: requestNumber ?? -1,
        backoff: nextPolicy.backoffTimeMs ?? -1,
      });
    } else {
      this.nextRequestBackoffTime = now() + (nextPolicy.backoffTimeMs || 0); // was: this.L
    }
  }

  /**
   * Process a server error directive and dispatch the appropriate action.
   *
   * Actions:
   *   0 → stop (fatal)
   *   1 → soft-reload
   *   2 → hard error
   *   3 → host fallback
   *
   * [was: qd]
   */
  handleServerErrorDirective(directive, requestNumber) { // was: qd(Q, c)
    if (directive.action === undefined) {
      const livePointer = this.playerInterface.getNowPlayingPosition;
      if (livePointer !== undefined) this.loader.setSliderValue(livePointer);
    } else if (directive.action !== 0 || !this.hasSeenStopAction) {
      if (directive.action === 0 && this.policy.YD) directive.action = 2;

      if (
        directive.e_ === 'sabr.malformed_config' &&
        this.malformedConfigRetries++ < 3
      ) {
        this.loader.handleError('sabr.malformed_config', {
          action: directive.action,
          rn: requestNumber,
          retry: this.malformedConfigRetries,
        }, 0);
      } else {
        const details = {};
        details.reason = directive.e_;
        details.action = directive.action;
        details.rn = requestNumber;

        switch (directive.action) {
          case 1: // soft-reload
            if (this.policy.O && this.adaptiveSchedule) {
              disableSsdai(this.adaptiveSchedule, undefined, undefined, details);
              if (this.policy.mK) this.liveSeekManager?.mF();
            }
            break;

          case 0: // stop (fatal)
            this.hasSeenStopAction = true;
            if (this.videoData.listenOnce() && this.policy.O && this.adaptiveSchedule) {
              disableSsdai(this.adaptiveSchedule, undefined, undefined, details, false);
            }
            this.loader.e9(details);
            break;

          case 2: // hard error
            if (normalizeSabrError(directive.e_) !== 'sabr.config') delete details.reason;
            this.loader.handleError(normalizeSabrError(directive.e_), details, 1);
            break;

          case 3: // host fallback
            if (this.policy.Fw) {
              this.networkManager.Y?.isSamsungSmartTV();
              this.loader.handleError('sabr.hostfallback', details);
            }
            break;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // UMP prewarm & context
  // ---------------------------------------------------------------------------

  /** Trigger UMP prewarm connections for given URLs. [was: Cp] */
  triggerUmpPrewarm(config) { // was: Cp(Q)
    if (config.url) {
      for (const url of config.url) probeNetworkPath(url, 'ump_prewarm');
    }
  }

  /** Handle a SABR context-update notification from the server. [was: E2] */
  handleContextUpdate(update) { // was: E2(Q)
    if (!update) return;
    this.loader.RetryTimer('sabrctxt', {
      onsbrctxt: update.type,
      scp: update.scope,
      dflt: update.sendByDefault,
    });
    if (update.type && update.sendByDefault) {
      this.videoData.jG.add(update.type);
    }
    if (update.scope !== 2) {
      if (update.type) this.videoData.sabrContextUpdates.set(update.type, update);
      this.playerInterface.E2(update);
    }
  }

  /** No-op placeholder. [was: Pq] */
  onPqEvent() {} // was: Pq()

  // ---------------------------------------------------------------------------
  // SABR-initiated seek
  // ---------------------------------------------------------------------------

  /**
   * Handle a SABR-initiated seek directive.
   * [was: Bp]
   */
  handleSabrSeek(seekInfo, requestNumber) { // was: Bp(Q, c)
    if (this.loader.W7) {
      // Already seeking — ignore SABR seek.
      this.loader.RetryTimer('sdai', {
        ignSabrSeek: 1,
        smt: seekInfo?.Um,
        rn: requestNumber,
      });
    } else if (seekInfo.Um !== undefined && seekInfo.matchEnum) {
      const seekTimeSecs = seekInfo.Um / seekInfo.matchEnum; // was: W
      this.audioTrack.D = false;
      this.videoTrack.D = false;
      if (this.policy.isSamsungSmartTV || this.policy.rX || this.policy.uN) {
        this.loader.Pj.W = false;
      }
      if (this.playerInterface.getCurrentTime() !== seekTimeSecs) {
        const seekOptions = {
          Z7: 'sabr_seek',
          Ui: true,   // was: !0
          EZ: true,   // was: !0
        };
        if (seekInfo.seekSource) seekOptions.seekSource = seekInfo.seekSource;
        routeSeek(this.loader, seekTimeSecs + 0.1, seekOptions);
      }
    }
  }

  /** Forward a snackbar message. [was: onSnackbarMessage] */
  onSnackbarMessage(message) { // was: onSnackbarMessage(Q)
    this.playerInterface.publish('onSnackbarMessage', message);
  }

  /** Forward a queued-list update. [was: Qg] */
  onQueuedListUpdate(list, requestNumber) { // was: Qg(Q, c)
    if (this.policy.K) this.loader.Qg(list, requestNumber);
  }

  // ---------------------------------------------------------------------------
  // Media config
  // ---------------------------------------------------------------------------

  /** Apply a server-pushed media config update. [was: QB] */
  applyMediaConfig(config) { // was: QB(Q)
    if (config.r8 && config.Ot) updateDriftParams(this.networkManager, config.r8, config.Ot);
    if (this.policy.registerSecondaryPresenter) {
      if (config.CR && config.x9) this.networkManager.getCurrentTimeSec = config.CR / config.x9;
      if (config.IF && config.pR) this.networkManager.Jk = config.IF / config.pR;
    }
    if (QS(this.videoData) && !this.videoData.Gd && config.Ot) {
      this.loader.h7(config.Ot, 1000);
    }
    if (config.HL != null) this.playerInterface.zk(config.HL);
    if (config.Mn) {
      const elapsedSecs = (now() - config.Mn) / 1000; // was: Q
      this.loader.logMetaCsiEvent.ER(1, elapsedSecs);
    }
  }

  // ---------------------------------------------------------------------------
  // Forwarding helpers
  // ---------------------------------------------------------------------------

  /** Forward missing-segment info. [was: mz] */
  forwardMissingSegment(info) { this.loader.clearQueuer(info); } // was: mz(Q)

  /** Forward segment metadata. [was: XN] */
  forwardSegmentMetadata(info) { this.loader.buildNextState(info); } // was: XN(Q)

  /** Forward a segment join. [was: JB] */
  forwardSegmentJoin(info) { this.loader.JB(info); } // was: JB(Q)

  /** Check if a context type is active. [was: lM] */
  isContextTypeActive(type) { return this.videoData.jG.has(type); } // was: lM(Q)

  // ---------------------------------------------------------------------------
  // Context lifecycle policy
  // ---------------------------------------------------------------------------

  /**
   * Apply a context-lifecycle policy update (start/stop/discard lists).
   * [was: Ul]
   */
  applyContextLifecyclePolicy(startTypes, stopTypes, discardTypes) { // was: Ul(Q, c, W)
    if (this.policy.A) {
      this.loader.RetryTimer('sabrctxtplc', {
        start: startTypes ? startTypes.join('_') : '',
        stop: stopTypes ? stopTypes.join('_') : '',
        discard: discardTypes ? discardTypes.join('_') : '',
      });
    }

    if (startTypes) {
      for (const type of startTypes) this.videoData.jG.add(type);
    }
    if (stopTypes) {
      for (const type of stopTypes) {
        if (this.videoData.jG.has(type)) this.videoData.jG.delete(type);
      }
    }
    if (discardTypes) {
      for (const type of discardTypes) {
        if (this.videoData.sabrContextUpdates.has(type)) {
          this.videoData.sabrContextUpdates.delete(type);
        }
        if (this.policy.mF && this.pendingRequests.length) {
          for (const req of this.pendingRequests) {
            if (!(req instanceof OnesieRequest) && req.ib?.type === type) {
              req.ib = undefined;
            }
          }
        }
      }
    }
  }

  /** No-op placeholder. [was: DC] */
  onDcEvent() {} // was: DC()

  /** Store caption data. [was: Nt] */
  setCaptionData(data) { this.captionData = data; } // was: Nt(Q)

  /** Store caption segments. [was: Cm] */
  setCaptionSegments(segments) { this.captionSegments = segments; } // was: Cm(Q)

  /** Forward a policy update. [was: rU] */
  forwardPolicyUpdate(flag, value) { zF(this.policy, flag, 4, value); } // was: rU(Q, c)

  /**
   * Ingest debug info from a server-pushed diagnostic payload.
   * [was: yg]
   */
  ingestDebugInfo(payload) { // was: yg(Q)
    if (payload?.sQ && (payload = payload.sQ.DA)) {
      for (const entry of payload) {
        if (entry.formatId) {
          const format = this.networkManager.A.get(ZP(entry.formatId));
          if (format?.info) format.info.debugInfo = entry.debugInfo;
        }
      }
    }
  }

  /**
   * Request a player reload via the player interface.
   * [was: yU]
   */
  requestPlayerReload(reason) { // was: yU(Q)
    this.reloadRequested = true;
    this.playerInterface.publish('reloadplayer', reason);
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** Return the current video ID. [was: MY] */
  getVideoId() { return this.playerInterface.getVideoId || ''; } // was: MY()

  /**
   * Return the minimum buffered-ahead time across audio + video.
   * [was: H9]
   */
  getMinBufferedAhead() { // was: H9()
    const { xr: audio, yx: video } = YmW(this);
    return Math.min(audio, video);
  }

  /** Forward a QoE log entry. [was: PB] */
  logQoe(tag, data) { this.loader.RetryTimer(tag, data); } // was: PB(Q, c)

  /** Apply a host-rotation based on the fallback config. [was: RX] */
  applyHostRotation(hostInfo) { // was: RX(Q)
    IA(this.loader, handleTrackFormatUpdate(this.hostFallback, hostInfo));
  }

  /**
   * Return current request number and decoration status.
   * [was: WB]
   */
  getRequestInfo() { // was: WB()
    return {
      requestNumber: this.PA?.safeDecodeURIComponent() || -1,
      isDecorated: this.PA?.info.isDecorated(),
    };
  }

  /** Forward RU event. [was: RU] */
  forwardRuEvent(data) { this.playerInterface.RU(data); } // was: RU(Q)

  /** Reset error counter. [was: bb] */
  resetErrorCounter() { this.loader.preferAudioOnly(); } // was: bb()

  /** Increment error counter. [was: eR] */
  incrementErrorCounter() { this.loader.eR(); } // was: eR()

  // ---------------------------------------------------------------------------
  // Disposal
  // ---------------------------------------------------------------------------

  /** @override [was: WA] */
  dispose() { // was: WA()
    super.dispose();
    this.nextRequestPolicy = undefined;
    QXm(this, true, 'i');
    this.pendingRequests = [];
  }
}
