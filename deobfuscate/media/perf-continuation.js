/**
 * Performance monitor continuation, DRM heartbeat, retry policy details.
 * Source: base.js lines 94501–95777, 95904–96065
 *
 * Contains:
 * - QoE reporter (g.ji) continuation — stats reporting, DRM logging, playback state tracking
 * - DASH loader (b87) continuation — full loader lifecycle: initialize, seek, resume,
 *   audio track switching, format selection, MediaSource management, DAI integration
 * - DRM heartbeat params (Rbw) — heartbeat URL/interval/retries
 * - License session (AHa / gMw) — DRM license request/response lifecycle
 * - License request wrapper (hbn) — manages individual license request retry
 *
 * [was: g.ji (continuation), b87 (continuation), Rbw, gMw, OJx, hbn, AHa]
 */

// ---------------------------------------------------------------------------
// QoE Reporter – continuation [was: g.ji, lines 94501-94757]
// Handles periodic streaming stats reporting to /api/stats/qoe
// ---------------------------------------------------------------------------

// The g.ji class (QoeReporter) constructor continuation includes:
// - Battery API integration for power monitoring
// - Remote control mode detection (MDX cast/dial/voice)
// - Self-profiling logger initialization
// - Periodic lock detection via setInterval (vmlock events)


import { ThrottleTimer } from '../core/bitstream-helpers.js'; // was: g.Uc
import { resolvedPromise } from '../core/composition-helpers.js'; // was: g.QU
import { ExponentialBackoff, registerDisposable } from '../core/event-system.js'; // was: g.V2, g.F
import { reportErrorWithLevel } from '../data/gel-params.js'; // was: g.Zf
import { resolveLogUrl } from '../core/event-system.js'; // was: nW
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { isCompressedDomainComposite } from './audio-normalization.js'; // was: gA
import { selectInitialFormats } from './quality-manager.js'; // was: BPm
import { TrackState } from './playback-controller.js'; // was: h_D
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { BooleanFlag } from '../data/session-storage.js'; // was: Nu
import { applyQualityConstraint } from './quality-constraints.js'; // was: d3
import { MeasurementSample } from '../proto/message-defs.js'; // was: wM
import { logMetaCsiEvent } from '../data/gel-core.js'; // was: jl
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { wrapIdbRequest } from '../data/idb-transactions.js'; // was: hN
import { preferAudioOnly } from './audio-normalization.js'; // was: bb
import { OnesieRequestHandler } from './onesie-request.js'; // was: cH1
import { buildSegmentResult } from './buffer-stats.js'; // was: tn0
import { updatePresenterState } from '../player/playback-mode.js'; // was: RE
import { cueAdVideo } from '../player/media-state.js'; // was: OH
import { fetchInitSegmentIfNeeded } from './drm-segment.js'; // was: J7
import { catchCustom } from '../ads/ad-async.js'; // was: fF
import { rejectedPromise } from '../core/composition-helpers.js'; // was: cJ
import { evaluateFormatSwitch } from './mse-internals.js'; // was: eg
import { ytIdbMeta } from '../data/idb-operations.js'; // was: Kq
import { getStreamTimeOffsetNQ } from '../player/time-tracking.js'; // was: NQ()
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { rollbackTrack } from './segment-request.js'; // was: vV
import { truncateSegments } from '../ads/ad-async.js'; // was: Z2
import { disposeApp } from '../player/player-events.js'; // was: WA
import { logDrmEvent } from './track-manager.js'; // was: HP
import { setClickTrackingTarget } from '../core/misc-helpers.js'; // was: sN
import { ElementGeometryObserver } from '../data/module-init.js'; // was: et
import { createByteRange } from './format-parser.js'; // was: Lk
import { hasKeyStatusApi } from './track-manager.js'; // was: yO
import { Disposable } from '../core/disposable.js';
import { getCurrentTime } from '../player/time-tracking.js';
import { setAudioTrack } from '../player/player-api.js';
import { FormatChangeResult } from '../player/video-element.js';
import { dispose } from '../ads/dai-cue-range.js';
import { ObservableTarget } from '../core/event-target.js';
import { toString } from '../core/string-utils.js';
import { forEach } from '../core/event-registration.js';
import { isFairplay } from '../player/video-data-helpers.js'; // was: g.RM
// TODO: resolve g.lj

/**
 * Report accumulated streaming stats to the server.
 * Called periodically and on state transitions.
 * [was: reportStats method on g.ji]
 *
 * Key stats collected per ping:
 * - cpn: client playback nonce
 * - fmt/afmt: current video/audio itag
 * - df: dropped frames since last ping
 * - glf: GPU load factor
 * - el: event label (page context)
 * - live: live stream indicator
 * - drm: DRM system in use
 * - dai: DAI mode (ss=server-stitched, cs=client-side, mv=multiview)
 * - seq: ping sequence number
 */

// Player state to QoE state mapping [was: rHH]
export const PLAYER_STATE_TO_QOE = {
  [5]: "N",       // unstarted
  [-1]: "N",      // unstarted
  [3]: "B",       // buffering
  [0]: "EN",      // ended
  [2]: "PA",      // paused
  [1]: "PL",      // playing
  [-1000]: "ER",  // error
  [1000]: "N",    // cued
};

// States that trigger periodic reporting [was: oWW]
export const REPORTABLE_STATES = new Set(["PL", "B", "S"]);

// ---------------------------------------------------------------------------
// DASH Loader – continuation [was: b87, lines 94775-95777]
// The main adaptive streaming loader. Orchestrates:
// - MediaSource lifecycle (attach, detach, endOfStream)
// - Segment fetching and buffering for audio/video tracks
// - Seek operations with gap-crossing and DAI skip
// - ABR (adaptive bitrate) quality switching
// - SABR (server-adaptive bitrate) integration
// - Live stream windowed playback and head tracking
// - Error handling and retry policies
// ---------------------------------------------------------------------------

export class DashLoader extends Disposable {
  /**
   * @param {Object} playerProxy    [was: Q] — EH, the player host interface
   * @param {Object} schedule       [was: c] — bandwidth/stall estimator
   * @param {Object} policy         [was: W] — streaming policy configuration
   * @param {Object} manifest       [was: m] — k0, the manifest model
   * @param {Object} capabilities   [was: K] — format capabilities
   * @param {Object} audioTrackInfo [was: T] — initial audio track selection
   * @param {Object} prefetchData   [was: r] — onesie prefetch cache
   * @param {boolean} isResumed     [was: U] — whether resuming from suspend
   * @param {Object} previousState  [was: I] — mF, previous loader state for gapless
   * @param {Object} retryConfig    [was: X] — Rt, retry timing config
   */
  constructor(playerProxy, schedule, policy, manifest, capabilities, audioTrackInfo, prefetchData, isResumed = false, previousState, retryConfig) {
    super();
    this.EH = playerProxy;
    this.schedule = schedule;
    this.policy = policy;
    this.k0 = manifest;
    this.currentTime = NaN;
    this.J = NaN;                    // duration / live edge
    this.isSuspended = false;
    this.resolveLogUrl = false;                 // preload mode
    this.eb = false;
    this.Y0 = "";
    this.AA = {};                    // request headers
    this.isInAdPlayback = NaN;
    this.timestampOffset = NaN;

    // Create timing tracker
    this.timing = new gxm(retryConfig);

    // Create ABR controller
    this.Y = new N0a(schedule, policy);

    // Create periodic update timers
    this.skipNextIcon = new ThrottleTimer(this.JF, 0, this);
    this.MQ = new ThrottleTimer(this.JF, policy.sC, this);
    this.vY = new ThrottleTimer(this.JF, 1000, this);
    this.isCompressedDomainComposite = new ThrottleTimer(this.JF, undefined, this);
    this.La = new ThrottleTimer(() => { if (!this.isSuspended) this.JF(); }, 10000, this);

    // Create format selector
    this.W = new aRa(this, this.Y, policy, manifest, capabilities, previousState?.B4());
    const formatSelection = selectInitialFormats(this.W, audioTrackInfo, prefetchData?.id);

    // Create audio/video tracks
    this.audioTrack = new TrackState(this, policy, formatSelection.audio, this.timing);
    this.videoTrack = new TrackState(this, policy, formatSelection.video, this.timing);
    this.videoTrack.A.isSamsungSmartTV = this.audioTrack.dn();

    // Create seek handler
    this.Pj = new yyD(this, manifest, this.videoTrack, this.audioTrack, policy);

    // Create DAI controller
    this.j = new O7S(this, manifest, policy, this.videoTrack, this.audioTrack, isResumed);

    // Create bandwidth estimator wrapper
    this.applyQualityConstraint = ZCO({ MeasurementSample: policy.L.MeasurementSample, BooleanFlag: policy.BooleanFlag, A7: policy.A7 });
    this.L = AYw(this, policy, this.applyQualityConstraint, schedule, this.logMetaCsiEvent, (a, e) => rkn(this, a, e));

    // Create SABR controller if needed
    if (policy.W) {
      const vd = this.EH.getVideoData();
      this.RetryTimer("clsdai", { initld: 1, admapsz: vd.a_?.size });
      if (!vd.a_) vd.a_ = new Map();
      this.isSamsungSmartTV = new fRW(policy, (key, val) => { this.RetryTimer(key, val); }, policy.wrapIdbRequest, vd.a_);
    }

    // Create request manager
    const ustreamerConfig = policy.Q7 ? this.EH.getVideoData().Vf : null;
    this.D = new Md1(this, policy, this.videoTrack, this.audioTrack, this.AA, this.j, this.timing, this.Y, schedule, manifest, this.W, this.L, ustreamerConfig);
    registerDisposable(this, this.D);

    // Create format change tracker
    this.K = new Jy9(this, policy, this.videoTrack, this.audioTrack, manifest, capabilities, preferAudioOnly(this.EH.getVideoData()), prefetchData?.id);
    registerDisposable(this, this.K);
    lg7(this.K, audioTrackInfo);

    // Create MediaSource controller
    this.O = new OnesieRequestHandler(this.EH, this, policy, this.audioTrack, this.videoTrack, manifest, schedule, this.W, this.K, this.timing, this.j, this.isSamsungSmartTV);
    registerDisposable(this, this.O);

    // Use preexisting format info from previous loader
    this.A = this.EH.sO.Pk.Fm;
    if (!policy.D) ULx(this);
  }

  /** Initialize the loader with a start time. [was: initialize] */
  initialize(startTime, formatUpdate, isSuspended) {
    startTime = startTime || 0;
    if (!this.policy.W) {
      const selection = buildSegmentResult(this.W);
      ri(this.EH, new IgnoreNavigationMetadata(selection.video, selection.reason));
      this.EH.updatePresenterState(new IgnoreNavigationMetadata(selection.audio, selection.reason));
    }
    if (this.policy.W) mt(this);
    if (this.k0.isManifestless) OFW(this.D);
    if (this.L) eFd(this.L, this.videoTrack.cueAdVideo);

    const currentPlayTime = isNaN(this.getCurrentTime()) ? 0 : this.getCurrentTime();
    let hasLoadedSegments = !this.k0.isManifestless;
    if (this.policy.Gs) hasLoadedSegments = hasLoadedSegments || this.k0.DE;

    if (!this.policy.J || this.policy.La) {
      this.currentTime = hasLoadedSegments ? startTime : currentPlayTime;
    }

    if (!isSuspended) {
      const isAtStart = this.getCurrentTime() === 0;
      fetchInitSegmentIfNeeded(this.D, this.videoTrack, this.videoTrack.cueAdVideo, isAtStart);
      fetchInitSegmentIfNeeded(this.D, this.audioTrack, this.audioTrack.cueAdVideo, isAtStart);
      if (!this.policy.isSamsungSmartTV) this.seek(this.getCurrentTime(), {}).catchCustom(() => {});
      this.timing.tick("gv");
    }
  }

  /** Suspend the loader. [was: T2] */
  suspend(preloadMode) {
    this.resolveLogUrl = preloadMode || this.EH.G().X("html5_allow_multiview_tile_preload") && this.EH.getVideoData().skipNextIcon;
    if (!this.policy.MM) {
      this.isSuspended = true;
      if (this.policy.UF) { this.vY.stop(); this.MQ.stop(); this.skipNextIcon.stop(); }
      this.La.stop();
    }
  }

  /** Resume from suspension. [was: resume] */
  resume() {
    if (this.isSuspended || this.eb) {
      this.resolveLogUrl = this.eb = this.isSuspended = false;
      try { this.JF(); } catch (err) { reportErrorWithLevel(err); }
    }
  }

  /** Seek to a time position. [was: seek] */
  seek(targetTime, options) {
    if (this.u0()) return rejectedPromise();
    if (this.Ba()) return rejectedPromise("seeking to head");
    if (this.policy.isSamsungSmartTV && !isFinite(targetTime)) { vT3(this.Pj); return resolvedPromise(Infinity); }
    VO(this);
    sMx(this, targetTime, false, options.seekSource);
    mt(this);
    if (!this.policy.W) evaluateFormatSwitch(this, targetTime);
    const prevTime = this.getCurrentTime();
    const seekedTime = this.Pj.seek(targetTime, options);
    if (!this.policy.J || this.policy.La) this.currentTime = seekedTime;
    YU(this.j, targetTime, prevTime, this.policy.ytIdbMeta && !options.Ui);
    wB(this);
    return resolvedPromise(seekedTime);
  }

  getCurrentTime() {
    if (this.policy.J) {
      const offset = this.getStreamTimeOffsetNQ || 0;
      return this.EH.getCurrentTime(true) - offset;
    }
    return this.currentTime;
  }

  setAudioTrack(track, seekTime, isUserAction = false) {
    if (this.u0()) return;
    const hasSeekTime = !isNaN(seekTime);
    if (isUserAction && hasSeekTime) {
      this.audioTrack.mF = Date.now();
      if (this.policy.yY) this.instreamAdPlayerOverlayRenderer = true;
    }
    if (this.policy.W) {
      const update = this.K.dV(track.id, hasSeekTime);
      this.EH.updatePresenterState(update);
    } else {
      this.W.O = this.W.k0.W[track.id];
      this.W.J = this.W.O;
      const result = new FormatChangeResult(this.W.J, this.W.A, hasSeekTime ? "t" : "m");
      this.EH.updatePresenterState(new IgnoreNavigationMetadata(result.audio, result.reason));
    }
    if (hasSeekTime) {
      this.isInAdPlayback = Date.now();
      const segNum = this.audioTrack.cueAdVideo.index.zf(seekTime);
      this.RetryTimer("setAudio", { id: track.id, cmt: seekTime, sq: segNum });
      if (segNum >= 0) {
        if (this.policy.W) this.Fn(true, "mosaic");
        rollbackTrack(this.audioTrack, segNum, NaN, NaN);
        if (!this.policy.u3 && this.k0.isLive) truncateSegments(this.k0, segNum, false);
      }
    }
  }

  getStreamTimeOffsetNQ { return this.timestampOffset; }
  isSeeking() { return this.Pj.isSeeking(); }

  /** Dispose and clean up. [was: WA] */
  disposeApp() {
    try {
      this.vM();
      qO(this.audioTrack); qO(this.videoTrack);
      lr(this.audioTrack); lr(this.videoTrack);
      this.audioTrack.dispose(); this.videoTrack.dispose();
      super.disposeApp();
    } catch (err) { reportErrorWithLevel(err); }
  }

  RetryTimer(key, data, force = false) { this.EH.RetryTimer(key, data, force); }
}

// ---------------------------------------------------------------------------
// DRM Heartbeat Parameters [was: Rbw]
// ---------------------------------------------------------------------------
export class DrmHeartbeatParams {
  constructor() {
    const { url, interval, retries } = {};
    this.url = url;
    this.interval = interval;
    this.retries = retries;
  }
}

// ---------------------------------------------------------------------------
// License Response [was: gMw]
// Parsed DRM license response with key statuses
// ---------------------------------------------------------------------------
export class LicenseResponse {
  constructor(statusCode, message) { // was: Q, c
    this.statusCode = statusCode;
    this.message = message;
    this.errorMessage = null;
    this.heartbeatParams = null;
    this.A = null;
    this.O = [];             // authorized formats
    this.W = {};             // key ID -> type mapping
    this.nextFairplayKeyId = null;
  }
}

// DRM track type mapping [was: OJx]
export const DRM_TRACK_TYPES = {
  DRM_TRACK_TYPE_AUDIO: "AUDIO",
  DRM_TRACK_TYPE_SD: "SD",
  DRM_TRACK_TYPE_HD: "HD",
  DRM_TRACK_TYPE_UHD1: "UHD1",
};

// ---------------------------------------------------------------------------
// License Request Wrapper [was: hbn]
// Manages a single DRM license request with retry backoff
// ---------------------------------------------------------------------------
export class LicenseRequestWrapper extends Disposable {
  constructor(message, requestNumber, timer = "", isRetry = false) {
    super();
    this.message = message;
    this.requestNumber = requestNumber;
    this.timer = timer;
    this.isRetry = isRetry; // was: this.O
    this.onSuccess = null;
    this.onError = null;
    this.W = new ExponentialBackoff(5000, 20000, 0.2); // retry backoff
  }
}

// ---------------------------------------------------------------------------
// License Session [was: AHa]
// Full DRM license session lifecycle – request, response, key status tracking
// ---------------------------------------------------------------------------
export class LicenseSession extends ObservableTarget {
  constructor(videoData, playerConfig, licenseContext, sessionId, ustreamerConfig) {
    super();
    this.videoData = videoData;
    this.FI = playerConfig;    // was: c
    this.L = licenseContext;   // was: W — contains initData, contentType, cryptoPeriodIndex
    this.sessionId = sessionId;
    this.uC = ustreamerConfig; // was: K
    this.K = {};               // query params
    this.cryptoPeriodIndex = NaN;
    this.url = "";
    this.requestNumber = 0;
    this.isSamsungSmartTV = false;           // certificate set
    this.S = false;
    this.j = null;             // MediaKeySession
    this.T2 = [];              // requested key IDs
    this.A = [];               // authorization info
    this.authorizedFormats = [];
    this.Y = [];
    this.J = false;
    this.W = {};               // key ID -> {type, status}
    this.status = "";
    this.D = NaN;              // provision start time
    this.O = videoData.K;      // DRM config

    this.cryptoPeriodIndex = licenseContext.cryptoPeriodIndex;

    // Build query params
    const params = {};
    Object.assign(params, this.FI.W);
    params.cpn = this.videoData.clientPlaybackNonce;
    if (this.videoData.isSamsungSmartTV) {
      params.vvt = this.videoData.isSamsungSmartTV;
      if (this.videoData.mdxEnvironment) params.mdx_environment = this.videoData.mdxEnvironment;
    }
    if (!isNaN(this.cryptoPeriodIndex)) params.cpi = this.cryptoPeriodIndex.toString();
    params.session_id = sessionId;
    this.K = params;

    // Widevine HDR flag
    if (this.O.flavor === "widevine") this.K.hdr = "1";
    // PlayReady first play expiration
    if (this.O.flavor === "playready") {
      const fpe = Number(WU(playerConfig.experiments, "playready_first_play_expiration"));
      if (!isNaN(fpe) && fpe >= 0) this.K.mfpe = `${fpe}`;
      this.mF = false;
    } else {
      this.mF = true;
    }

    // Build base URL from init data
    let baseUrl = "";
    if (isFairplay(this.O)) {
      if (this.O.W()) {
        const cpIndex = licenseContext.O;
        if (cpIndex) baseUrl = "https://www.youtube.com/api/drm/fps?ek=" + qvW(cpIndex);
      } else {
        const initChars = licenseContext.initData.subarray(4);
        const chars16 = new Uint16Array(initChars.buffer, initChars.byteOffset, initChars.byteLength / 2);
        baseUrl = String.fromCharCode.apply(null, chars16).replace("skd://", "https://");
      }
    } else {
      baseUrl = this.O.A;
    }
    this.baseUrl = baseUrl;
    this.fairplayKeyId = b_(this.baseUrl, "ek") || "";

    const cpiParam = b_(this.baseUrl, "cpi") || "";
    if (cpiParam) this.cryptoPeriodIndex = Number(cpiParam);

    this.T2 = licenseContext.wH ? [g.lj(licenseContext.initData, 4)] : licenseContext.A;
    logDrmEvent(this, { sessioninit: licenseContext.cryptoPeriodIndex });
    this.status = "in";
  }

  /** Handle key status change from MediaKeySession. [was: sN] */
  setClickTrackingTarget(keyStatuses) {
    if (this.u0() || keyStatuses.size <= 0) return;
    const statusUpdate = {};
    keyStatuses.forEach((status, keyId) => {
      const keyIdHex = g.lj(new Uint8Array(CJ(this.O) ? status : keyId), 4);
      // Track key status by ID
      if (!this.W[keyIdHex]) this.W[keyIdHex] = { type: "", status };
      else this.W[keyIdHex].status = status;
    });
    logDrmEvent(this, { onkeystatuschange: 1 });
    this.status = "kc";
    this.publish("keystatuseschange", this);
  }

  /** Handle license error. [was: error] */
  error(NetworkErrorCode, severity, message, detail) {
    if (!this.u0()) {
      this.publish("licenseerror", NetworkErrorCode, severity, message, detail);
      if (NetworkErrorCode === "drm.provision") {
        const elapsed = (Date.now() - this.D) / 1000;
        this.D = NaN;
        this.publish("ctmp", "provf", { ElementGeometryObserver: elapsed.toFixed(3) });
      }
    }
    if (oR(severity)) this.dispose();
    if (this.uC) { this.uC.dispose(); this.uC = undefined; }
  }

  shouldRetry(hasError, request) {
    return !hasError && this.requestNumber === request.requestNumber;
  }

  disposeApp() { this.W = {}; super.disposeApp(); }
  createByteRange() { return this.url; }

  getInfo() {
    let info = this.A.join();
    if (hasKeyStatusApi(this)) {
      const unusableTypes = new Set();
      for (const keyId in this.W) {
        if (this.W[keyId].status !== "usable") unusableTypes.add(this.W[keyId].type);
      }
      info += `/UKS.${Array.from(unusableTypes)}`;
    }
    return info + `/${this.cryptoPeriodIndex}`;
  }
}
