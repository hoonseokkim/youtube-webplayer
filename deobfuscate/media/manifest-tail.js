/**
 * Manifest handler tail, segment writer continuation.
 * Source: base.js lines 97106–97147, 98053–98499
 *
 * Contains:
 * - WatchTimeSegment (rh_) — tracks a single playback time segment for watch-time reporting
 * - VideoDataProvider (IT7) — wraps videoData + playerConfig for stats modules
 * - Connection type bandwidth map (oQx)
 * - YwX / Vom / yk — global initialization flags
 * - VideoPlayer (g.Ff) — the master video player controller that owns:
 *   - MediaElement binding
 *   - Loader lifecycle (DASH/SABR/HLS)
 *   - DRM (license sessions, key status)
 *   - Playback state machine (play/pause/buffer/error)
 *   - QoE reporting integration
 *   - Attestation (BotGuard) handling
 *   - Visibility tracking
 *   - DAI (server-stitched ad) integration
 *
 * [was: rh_, IT7, oQx, YwX, Vom, yk, g.Ff]
 */

// ---------------------------------------------------------------------------
// WatchTimeSegment [was: rh_]
// Represents a single playback time segment for watch-time / engagement reporting
// ---------------------------------------------------------------------------

import { cueRangeStartId } from '../ads/ad-scheduling.js'; // was: g.Sr
import { ThrottleTimer } from '../core/bitstream-helpers.js'; // was: g.Uc
import { registerDisposable, safeDispose } from '../core/event-system.js'; // was: g.F, g.BN
import { safeClearInterval } from '../data/idb-transactions.js'; // was: g.Rx
import { isTvHtml5 } from '../data/performance-profiling.js'; // was: g.AI
import { PlayerState } from './codec-tables.js'; // was: g.In
import { PlaybackStateValidator, SeekWatchdog } from './seek-state-machine.js'; // was: g.vL, g.fi
import { getTimeHead } from '../player/time-tracking.js'; // was: TH()
import { supportsDashOpus } from './codec-detection.js'; // was: FG
import { ByteArrayMap } from './drm-manager.js'; // was: OA
import { loadVideoFromData } from '../player/media-state.js'; // was: sH
import { getPlayerState } from '../player/playback-bridge.js'; // was: lY
import { readInt32 } from './format-setup.js'; // was: Gg
import { isMediaSourceOpen } from './codec-helpers.js'; // was: Qv
import { setExperimentFlag } from '../core/attestation.js'; // was: xs
import { markPlayerVisible } from './mse-internals.js'; // was: mLx
import { flushPeriodicStats } from './engine-config.js'; // was: p$
import { applyQualityConstraint } from './quality-constraints.js'; // was: d3
import { handleBackgroundSuspend } from './quality-constraints.js'; // was: w3
import { PlaybackErrorHandler } from './error-handler.js'; // was: eoS
import { unwrapSafeScript } from '../core/composition-helpers.js'; // was: Bz
import { SLOT_ARRAY_STATE } from '../proto/messages-core.js'; // was: Xm
import { installPolyfill } from '../core/polyfills.js'; // was: UO
import { SourceBufferWriter } from './segment-writer.js'; // was: Fao
import { MediaTimeTracker } from './seek-state-machine.js'; // was: Hma
import { ProgressAwareComponent } from '../player/component-events.js'; // was: pP
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { disposeApp } from '../player/player-events.js'; // was: WA
import { getMetricValues } from '../core/event-system.js'; // was: Ps
import { isPlaybackStatusOk } from './audio-normalization.js'; // was: AV
import { adBadgeViewModel } from '../core/misc-helpers.js'; // was: nK
import { enqueueEntry } from '../core/composition-helpers.js'; // was: TQ
import { isTimeInRange } from './codec-helpers.js'; // was: zb
import { closureNamespace } from '../proto/messages-core.js'; // was: uS
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { addStateBits } from './source-buffer.js'; // was: e7
import { InjectionToken } from '../network/innertube-config.js'; // was: uu
import { clearStateBits } from './source-buffer.js'; // was: Vv
import { updateMuxConfig } from './track-manager.js'; // was: ZJX
import { buildNextState } from './source-buffer.js'; // was: XN
import { getQualityLabel } from '../modules/caption/caption-translation.js'; // was: Em
import { getCurrentTime, setLoop, setPlaybackRate, isAtLiveHead } from '../player/time-tracking.js';
import { ObservableTarget } from '../core/event-target.js';
import { getVisibilityState, compose } from '../core/composition-helpers.js';
import { playVideo } from '../player/player-events.js';
import { slice } from '../core/array-utils.js';
import { getPreferredQuality } from '../player/player-api.js';
import { createLogger } from '../data/logger-init.js'; // was: g.JY
import { ERROR_MESSAGES } from '../core/errors.js'; // was: g.Tw
import { globalScheduler } from '../core/scheduler.js'; // was: g.YF
import { DelayedCall } from '../data/session-storage.js'; // was: g.F_
// TODO: resolve g.Od

export class WatchTimeSegment {
  constructor() {
    this.startTime = -1;
    this.endTime = -1;
    this.A = "-";              // format ID
    this.playbackRate = 1;
    this.visibilityState = 0;
    this.audioId = "";
    this.connectionType = 0;   // was: this.O
    this.volume = 0;
    this.muted = false;        // was: !1
    this.clipId = "-";
    this.W = "-";
    this.previouslyEnded = false; // was: this.j
    this.j = false;
  }

  isEmpty() { return this.endTime === this.startTime; }
}

// ---------------------------------------------------------------------------
// VideoDataProvider [was: IT7]
// Wraps videoData + playerConfig for consumption by stats/QoE modules
// ---------------------------------------------------------------------------
export class VideoDataProvider {
  constructor(videoData, playerConfig, playerHost) { // was: Q, c, W
    this.videoData = videoData;
    this.FI = playerConfig;  // player config / experiments
    this.EH = playerHost;    // player host interface
    this.W = undefined;
  }

  /** Check experiment flag. [was: X] */
  X(flag) { return this.FI.X(flag); }

  getCurrentTime() { return this.EH.getCurrentTime(); }
  getTimeHead() { return this.EH.getTimeHead(); }
}

// ---------------------------------------------------------------------------
// Connection type to estimated bandwidth (Mbps) [was: oQx]
// ---------------------------------------------------------------------------
export const CONNECTION_BANDWIDTH_ESTIMATE = {
  other: 1,
  none: 2,
  wifi: 3,
  cellular: 7,
  ethernet: 30,
};

// ---------------------------------------------------------------------------
// Global init flags [was: YwX, Vom, yk]
// ---------------------------------------------------------------------------
let isYwXInitialized = false;  // was: YwX
let isVomInitialized = false;  // was: Vom
let isYkInitialized = false;   // was: yk

// ---------------------------------------------------------------------------
// VideoPlayer [was: g.Ff]
// The master video player controller — owns MediaElement, Loader, DRM,
// playback state, QoE, attestation, visibility, and DAI.
// ---------------------------------------------------------------------------
export class VideoPlayer extends ObservableTarget {
  /**
   * @param {Object} playerConfig       [was: Q] — FI
   * @param {number} playerType         [was: c]
   * @param {Object} csiTracker         [was: W] — KO
   * @param {Object} formatGate         [was: m] — FG
   * @param {Function} eventDispatcher  [was: K]
   * @param {Function} getVisibility    [was: T]
   * @param {Object} visibility         [was: r]
   * @param {Object} serviceLocator     [was: U] — sO
   * @param {Object} bandwidthSampler   [was: I] — Qp
   * @param {Object} videoData          [was: X] — defaults to new g.Od
   * @param {boolean} autoLoad          [was: A] — j8, default true
   * @param {Object} ustreamerConfig    [was: e] — uC
   * @param {Object} sabrConfig         [was: V] — Bq
   */
  constructor(playerConfig, playerType, csiTracker, formatGate, eventDispatcher,
              getVisibilityState, visibility, serviceLocator, bandwidthSampler,
              videoData = new VideoData(playerConfig), autoLoad = true, ustreamerConfig, sabrConfig) {
    super();
    this.FI = playerConfig;
    this.playerType = playerType;
    this.KO = csiTracker;
    this.supportsDashOpus = formatGate;
    this.getVisibilityState = getVisibilityState;
    this.visibility = visibility;
    this.sO = serviceLocator;
    this.Qp = bandwidthSampler;
    this.videoData = videoData;
    this.j8 = autoLoad;
    this.uC = ustreamerConfig;
    this.Bq = sabrConfig;

    this.logger = createLogger("VideoPlayer"); // was: new g.JY("VideoPlayer")
    this.Y1 = null;             // attestation result
    this.Mi = new ByteArrayMap();         // media capabilities
    this.Zs = null;             // gapless preload
    this.tH = true;             // first play flag
    this.loadVideoFromData = null;             // MediaSource wrapper
    this.loader = null;         // DASH/SABR loader
    this.qL = [];               // pending async operations
    this.getPlayerState = null;             // format selection promise
    this.z1 = null;             // format filter
    this.dg = null;             // DRM manager
    this.IN = false;            // preload mode
    this.pJ = false;            // preload complete
    this.f9 = false;
    this.playerState = new PlayerState();  // playback state
    this.readInt32 = [];               // state change listeners
    this.mediaElement = null;   // HTMLVideoElement wrapper
    this.Tg = false;
    this.A1 = false;
    this.IV = NaN;              // heartbeat timer
    this.isMediaSourceOpen = false;
    this.loop = false;
    this.playbackRate = 1;
    this.xQ = false;
    this.Z1 = null;             // DAI state machine
    this.FZ = null;

    // Visibility change handler
    this.setExperimentFlag = () => {
      const stats = this.Vp;
      stats.V2();
      if (stats.O) {
        const monitor = stats.O;
        if (monitor.K && monitor.W < 0 && stats.provider.EH.getVisibilityState() !== 3) {
          GzK(monitor);
        }
      }
      if (stats.qoe) {
        const qoe = stats.qoe;
        if (qoe.UH && qoe.j < 0 && stats.provider.FI.dA) markPlayerVisible(qoe);
        if (qoe.K) flushPeriodicStats(qoe);
      }
      if (this.loader) applyQualityConstraint(this);
      handleBackgroundSuspend(this);
    };

    // Initialize QoE and event system
    this.Oh = new PlaybackErrorHandler(this);
    this.SLOT_ARRAY_STATE = new ThrottleTimer(this.unwrapSafeScript, 15000, this);
    this.installPolyfill = new SourceBufferWriter(this);
    this.WV = new ThrottleTimer(this.Ek, 0, this);
    this.hY = new MediaTimeTracker(this.FI);
    this.aR = new V49(this.FI, this.supportsDashOpus, this, this.Qp);

    this.ag = new PlaybackStateValidator(this, (event, data) => {
      if (event !== cueRangeStartId("endcr") || this.playerState.W(32)) return;
      this.Sn();
      eventDispatcher(event, data, this.playerType);
    });
    registerDisposable(this, this.ag);
    registerDisposable(this, this.installPolyfill);

    D3R(this, videoData);
    this.videoData.subscribe("dataupdated", this.ProgressAwareComponent, this);
    this.videoData.subscribe("dataloaded", this.gi, this);
    this.videoData.subscribe("dataloaderror", this.handleError, this);
    this.videoData.subscribe("ctmp", this.RetryTimer, this);

    this.Vp = new SeekWatchdog(new VideoDataProvider(this.videoData, this.FI, this));
    AV7(this.setExperimentFlag);
    this.visibility.subscribe("visibilitystatechange", this.setExperimentFlag);

    this.MW = new ThrottleTimer(this.Dx,
      getExperimentValue(this.FI.experiments, "html5_player_att_initial_delay_ms") || 4500, this);
    this.Q3 = new ThrottleTimer(this.Dx,
      getExperimentValue(this.FI.experiments, "html5_player_att_retry_delay_ms") || 4500, this);
    this.LR = new DelayedCall(this.kt, 350, this);
    registerDisposable(this, this.LR);
  }

  /** Clean up all resources. [was: WA] */
  disposeApp() {
    safeClearInterval(this.Lp);
    ei7(this.setExperimentFlag);
    this.visibility.unsubscribe("visibilitystatechange", this.setExperimentFlag);
    Ahn(this.Vp);
    safeDispose(this.Vp);
    jV(this);
    globalScheduler.cancelJob(this.IV);
    this.getMetricValues();
    this.z1 = null;
    safeDispose(this.videoData);
    safeDispose(this.Oh);
    safeDispose(this.MW);
    safeDispose(this.Q3);
    this.Zs = null;
    super.disposeApp();
  }

  getVideoData() { return this.videoData; }
  G() { return this.FI; }
  getPlayerType() { return this.playerType; }
  getPlayerState() { return this.playerState; }
  isPlaying() { return this.playerState.isPlaying(); }
  Yx() { return this.mediaElement; }
  isFullscreen() { return this.visibility.isFullscreen(); }
  isBackground() { return this.visibility.isBackground(); }

  /** Load and validate video data, then initialize playback. [was: Y5] */
  Y5() {
    if (nAw(this.videoData) || !isPlaybackStatusOk(this.videoData)) {
      const detail = this.videoData.errorDetail;
      this.o$(this.videoData.NetworkErrorCode || "auth", 2,
              unescape(this.videoData.errorReason), detail, detail,
              this.videoData.adBadgeViewModel || undefined);
    }
    this.enqueueEntry();
  }

  /** Start video playback. [was: bv] */
  startPlayback() {
    if (this.mediaElement) this.mediaElement.activate();
    this.oy();
    if (this.L7() && !this.playerState.W(128)) {
      if (!this.closureNamespace.isTimeInRange()) {
        this.closureNamespace.start();
        if (this.videoData.instreamAdPlayerOverlayRenderer) {
          this.OO(addStateBits(this.playerState, 4));
        } else {
          this.OO(addStateBits(addStateBits(this.playerState, 8), 1));
        }
      }
      ff(this);
    }
  }

  /** Play the video. [was: playVideo] */
  async playVideo(force = false, fromUser = false) {
    const pendingImages = window.google_image_requests;
    if (pendingImages?.length > 10) {
      window.google_image_requests = pendingImages.slice(-10);
    }
    if (this.playerState.W(128)) return;
    if (this.Oh.Px()) { this.publish("signatureexpired"); return; }
    if (this.mediaElement) J6(this.Vp);
    this.startPlayback();
    if ((this.playerState.W(64) || force)) this.OO(addStateBits(this.playerState, 8));
    if (this.closureNamespace.finished && this.mediaElement) {
      if (!this.z1 && this.getPlayerState) {
        await this.getPlayerState;
        if (this.playerState.W(128)) return;
      }
      if (this.videoData.A) {
        Lf(this, fromUser) ? O8_(this) : uA(this);
      }
    }
  }

  /** Bind a media element. [was: setMediaElement] */
  setMediaElement(element) {
    if (this.mediaElement && element.Ae() === this.mediaElement.Ae() &&
        (element.isView() || this.mediaElement.isView())) {
      if (element.isView() || !this.mediaElement.isView()) {
        this.InjectionToken();
        this.mediaElement = element;
        this.mediaElement.l0 = this;
        gtn(this);
        this.installPolyfill.setMediaElement(this.mediaElement);
      }
    } else {
      if (this.mediaElement) this.getMetricValues();
      if (!this.playerState.isError()) {
        let newState = clearStateBits(this.playerState, 512);
        if (newState.W(8) && !newState.W(2)) newState = addStateBits(newState, 1);
        if (element.isView()) newState = clearStateBits(newState, 64);
        this.OO(newState);
      }
      this.mediaElement = element;
      this.mediaElement.l0 = this;
      if (!isTvHtml5(this.FI)) this.mediaElement.setLoop(this.loop);
      this.mediaElement.setPlaybackRate(this.playbackRate);
      gtn(this);
      this.installPolyfill.setMediaElement(this.mediaElement);
    }
  }

  /** Set DAI state machine. [was: Zx] */
  setDaiStateMachine(daiState) {
    this.Z1 = daiState;
    if (this.loader) {
      updateMuxConfig(this.loader, daiState);
      this.RetryTimer("sdai", { sdsstm: 1 });
    }
  }

  /** Refresh audio format selection. [was: Bb] */
  refreshAudioFormats() {
    g3(this).then(() => Lf(this));
    if (this.playerState.isOrWillBePlaying()) this.playVideo();
  }

  /** Report error to player. [was: o$] */
  reportError(NetworkErrorCode, severity, message, detail, errorDetail, subReason) {
    const errorInfo = {
      NetworkErrorCode,
      errorDetail,
      errorMessage: message || ERROR_MESSAGES[NetworkErrorCode] || "",
      adBadgeViewModel: subReason || "",
      Ia: severity,
      cpn: this.videoData.clientPlaybackNonce,
    };
    this.videoData.NetworkErrorCode = NetworkErrorCode;
    Ob(this, "dataloaderror");
    this.OO(buildNextState(this.playerState, 128, errorInfo));
    globalScheduler.cancelJob(this.IV);
    jV(this);
    this.NE();
  }

  /** Check if loader is at live head. [was: kU] */
  isAtLiveHead() { return this.installPolyfill.kU(); }

  /** Get preferred quality. [was: getPreferredQuality] */
  getPreferredQuality() {
    if (this.z1) {
      const constraint = this.z1.videoData.pB.compose(this.z1.videoData.qT);
      return getQualityLabel(constraint);
    }
    return "auto";
  }

  isGapless() { return !!this.mediaElement && this.mediaElement.isView(); }
  Ir() { return this.videoData.Ir(); }
}
