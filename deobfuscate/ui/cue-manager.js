/**
 * cue-manager.js -- Cue range management, ad layout rendering adapters,
 * slot fulfillment, progress tracking, and player error codes.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines 74001-75579
 *   (skips 74081-74115 cue-range already covered in ui/cue-range.js)
 *
 * Provides:
 *  - Lazy singleton wrapper (or0) with dispose guard
 *  - Command executor delegate (DN) forwarding to layout router
 *  - Listener set manager (ri7) for add/remove listener patterns
 *  - Feature-flag aware adapter config (tO)
 *  - Ad-break request slot adapter (UWK) holding callback/slot/config
 *  - Ad progress marker types (Z6) -- AD_MARKER, CHAPTER_MARKER, TIME_MARKER
 *  - Ad/viewability URL pattern regexes (Jmw, cdw, Rd7, IAK, rd0, Kvw,
 *    kb7, TC0, m1d, IDK, X$x, Ai0) for URL-safety validation
 *  - Ad-break request fulfillment adapter (VpW) with CSI timing
 *  - Throttled ad-break request adapter (BN7) without CSI
 *  - Direct (pre-fulfilled) slot adapter (xWX)
 *  - Fulfillment adapter factory base (qq3) with direct-layout check
 *  - Ad-break request fulfillment factory (Hy)
 *  - Default fulfillment factory (Nh) -- throws on unsupported
 *  - Ad-break response layout rendering adapter (nrW)
 *  - Layout rendering adapter state holder (DW7)
 *  - Layout rendering adapter base (il) with init/release/startRendering
 *  - Ping dispatcher (lf) with progress-ping sorting and event dedup
 *  - Engagement-panel layout adapter (HT3)
 *  - Banner-image layout adapter (NNO, iTw)
 *  - Action-companion layout adapter (yi7, Sq_)
 *  - Image-companion layout adapter (FFX, ZTd)
 *  - Shopping-companion layout adapter (Ery, sJK)
 *  - Ad-video-progress command scheduler (yR) with percent/ms offsets
 *  - Discovery layout rendering adapter (LFX) with cue-range quartile
 *    tracking, active-view, and audio measurement
 *  - Instream ad overlay adapter (uJ0) with ad-showing state
 *  - Top-banner layout adapter (w$7, bTO)
 *  - Display-underlay text-grid adapter (jJ3, grW)
 *  - Ad-action interstitial adapter (S9, PZK)
 *  - Ad-break request layout adapter factory (Fz)
 *  - Engagement-panel adapter (OT7, fDO)
 *  - Top-banner view-model adapter (vrm)
 *  - Desktop above-feed layout adapter factory (aDd)
 *  - Desktop player-underlay adapter factory (G6x)
 *  - Forecasting layout adapter ($WR, ZN)
 *  - Player overlay layout descriptor (Pe_)
 *  - Player-overlay layout adapter ($1W) with skip/mute/info click routing
 *  - Instream-overlay layout adapter (GTm) with legacy player-bytes bridge
 *  - Ad-message layout adapter (lDw, lA7) with stuck-player detection
 *  - Video-interstitial buttoned adapter (ujw, h9x)
 *  - Other-web in-player adapter factory (hxO)
 *  - Shorts playback tracking adapter (zxm) with swipe abandon
 *  - Playback tracking adapter factory (Ced)
 *  - Player error codes (g.rh, MpW) and error message strings (g.Tw)
 *  - iOS version detection (Jx, I1)
 *
 * @module ui/cue-manager
 */

import { executeCommand } from '../ads/ad-scheduling.js';  // was: g.xA
import { routeCommand } from '../data/collection-utils.js';  // was: g.Gr
import { createCueRangeMarker } from '../player/playback-state.js'; // was: Tc
import { disposeApp } from '../player/player-events.js'; // was: WA
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { normalizeAspectRatio } from '../player/playback-state.js'; // was: Mm
import { extractSurveyPlaybackCommands } from '../ads/companion-layout.js'; // was: Wc
import { ObservableTarget } from '../core/event-target.js';
import { dispose } from '../ads/dai-cue-range.js';
import { concat } from '../core/array-utils.js';
import { getUserAgent } from '../core/browser-detection.js';

// TODO: resolve g.get

// ============================================================================
// Lazy Singleton Wrapper  (line 74001)
// ============================================================================

/**
 * Disposable lazy-initialization wrapper: creates the underlying instance
 * on first `.get()` call and nulls it out on dispose.
 *
 * [was: or0 -- partial, constructor end + get()]
 */
// (Continuation from previous range -- constructor tail + get method)

// ============================================================================
// Command Executor Delegate  (line 74025)
// ============================================================================

/**
 * Thin delegate that forwards `executeCommand` calls to the layout
 * command router obtained from a factory function.
 *
 * [was: DN]
 */
export class CommandExecutorDelegate { // was: DN
  constructor(routerFactory) { // was: Q
    this.routerFactory = routerFactory; // was: this.W = Q
  }

  executeCommand(command, layoutId) { // was: Q, c
    routeCommand(this.routerFactory(), command, layoutId); // was: wx(this.W(), Q, c)
  }
}

// ============================================================================
// Listener Set Manager  (line 74034)
// ============================================================================

/**
 * Simple typed listener set with add/remove. Used by layout-rendering
 * adapters to track active observers.
 *
 * [was: ri7]
 */
export class ListenerSet { // was: ri7
  constructor() {
    this.listeners = new Set();
  }

  addListener(listener) { // was: Q
    this.listeners.add(listener);
  }

  removeListener(listener) { // was: Q
    this.listeners.delete(listener);
  }
}

// ============================================================================
// Ad Progress Marker Types  (line 74063)
// ============================================================================

/**
 * CSS-class tokens for different progress-bar marker types.
 * [was: Z6]
 */
export const MARKER_TYPES = { // was: Z6
  AD_MARKER: "ytp-ad-progress",
  CHAPTER_MARKER: "ytp-chapter-marker",
  TIME_MARKER: "ytp-time-marker"
};

// ============================================================================
// Layout Rendering Adapter Base  (line 74279)
// ============================================================================

/**
 * Base class for all layout-rendering adapters. Provides slot/layout
 * accessors, lifecycle hooks (init/release/startRendering/D5), and
 * delegates component creation to the ad-module's component manager.
 *
 * [was: il]
 */
export class LayoutRenderingAdapter extends ObservableTarget { // was: il
  constructor(callback, slot, layout, componentManager) { // was: Q, c, W, m
    super();
    this.callback = callback;
    this.componentManager = componentManager; // was: this.A = m
    this.components = []; // was: this.W = []
    this.stateHolder = new LayoutAdapterState(callback, slot, layout); // was: this.O = new DW7(Q, c, W)
  }

  /** Returns the slot this adapter is bound to. [was: It] */
  getSlot() {
    return this.stateHolder.slot; // was: this.O.slot
  }

  /** Returns the layout this adapter is rendering. [was: fO] */
  getLayout() {
    return this.stateHolder.layout; // was: this.O.layout
  }

  get slot() { return this.stateHolder.slot; }
  get layout() { return this.stateHolder.layout; }

  init() {
    this.componentManager.get().addListener(this);
  }

  release() {
    this.componentManager.get().removeListener(this);
    this.dispose();
  }

  wT() {}
  e5() {}
  createCueRangeMarker() {}
  S4() {}

  startRendering(layout) { // was: Q
    verifyLayout(this.stateHolder, layout, () => this.publishComponents()); // was: wo(this.O, Q, () => void this.NU())
  }

  /**
   * Publishes accumulated component descriptors to the component manager.
   * [was: NU]
   */
  publishComponents() {
    this.componentManager.get().NU(this.components); // was: this.A.get().NU(this.W)
  }

  /**
   * Called when a layout exits rendering.
   * [was: D5]
   */
  onExitRendering(layout, exitReason) { // was: Q, c
    verifyLayout(this.stateHolder, layout, () => {
      const mgr = this.componentManager.get(); // was: W
      removeComponents(mgr, this.components, 3); // was: IXR(W, this.W, 3)
      this.components = [];
      this.callback.onLayoutExited(this.slot, layout, exitReason);
    });
  }

  disposeApp() {
    this.componentManager.u0() || this.componentManager.get().removeListener(this);
    super.disposeApp();
  }
}

// ============================================================================
// Ping Dispatcher  (line 74331)
// ============================================================================

/**
 * Manages dispatching pings for a layout's lifecycle events (impression,
 * start, quartiles, progress, active-view, etc.). Sorts progress pings
 * by offset, de-duplicates events, and supports both milestone and
 * timed-progress ping modes.
 *
 * [was: lf]
 */
export class PingDispatcher { // was: lf
  constructor(pingConfig, adStateRef, adPlacementConfig, layoutId, extraConfig = null) {
    // was: Q, c, W, m, K=null
    this.pingConfig = pingConfig; // was: this.A = Q
    this.adStateRef = adStateRef; // was: this.hJ = c
    this.layoutId = layoutId;
    this.progressPingIndex = 0; // was: this.j = 0
    this.lastProgressMs = null; // was: this.D = null
    this.progressPingDurationMs = undefined; // was: this.K = void 0
    this.firedEvents = new Set(); // was: this.W = new Set
    this.sortedProgressPings = Array.from(this.pingConfig.get("progress") || []); // was: this.O
    this.sortedProgressPings.sort((a, b) => (a.offsetMilliseconds || 0) - (b.offsetMilliseconds || 0));
    this.placementInfo = { // was: this.J
      adPlacementConfig: adPlacementConfig,
      j0: extraConfig
    };
  }

  /**
   * Fire a ping event if not already fired, merging aliased events.
   * [was: m9]
   */
  firePing(eventName, includeAlias = false) { // was: Q, c=!1
    const pings = (this.pingConfig.get(eventName) || []).concat();
    if (includeAlias) {
      const alias = getAliasedEventName(eventName); // was: tXd(Q)
      if (alias) {
        const aliasPings = this.pingConfig.get(alias);
        aliasPings && pings.push(...aliasPings);
      }
    }
    dispatchPings(this, eventName, pings); // was: PR(this, Q, W)
    this.firedEvents.add(eventName);
    if (includeAlias && alias) this.firedEvents.add(alias);
  }

  /**
   * Fire a ping event only if it hasn't been fired yet.
   * [was: Y$]
   */
  fireOnce(eventName, includeAlias = false) { // was: Q, c=!1
    if (!this.firedEvents.has(eventName)) {
      let shouldIncludeAlias = false;
      const alias = includeAlias && getAliasedEventName(eventName);
      if (alias) shouldIncludeAlias = !this.firedEvents.has(alias);
      this.firePing(eventName, shouldIncludeAlias);
    }
  }
}

// ============================================================================
// Ad Video Progress Command Scheduler  (line 74596)
// ============================================================================

/**
 * Schedules ad-video progress commands at specific percent or millisecond
 * offsets, executing them as playback advances past their thresholds.
 *
 * [was: yR]
 */
export class AdVideoProgressScheduler { // was: yR
  constructor(commandExecutor, progressCommands, layoutId, getDurationMs) {
    // was: Q, c, W, m
    this.commandExecutor = commandExecutor; // was: this.r3 = Q
    this.layoutId = layoutId;
    this.getDurationMs = getDurationMs; // was: this.K = m
    this.percentCommands = []; // was: this.O = []
    this.millisecondCommands = []; // was: this.W = []
    this.percentIndex = 0; // was: this.A
    this.msIndex = 0; // was: this.j = 0

    for (const cmd of progressCommands) { // was: K of c
      switch (cmd.adVideoOffset?.kind) {
        case "AD_VIDEO_PROGRESS_KIND_PERCENT":
          if (cmd.adVideoOffset?.percent != null) {
            this.percentCommands.push(cmd);
          } else {
            logAdWarning("Invalid AdVideoProgressPercentCommand"); // was: v1(...)
          }
          break;
        case "AD_VIDEO_PROGRESS_KIND_MILLISECONDS":
          if (cmd.adVideoOffset?.milliseconds != null && !isNaN(Number(cmd.adVideoOffset.milliseconds))) {
            this.millisecondCommands.push(cmd);
          } else {
            logAdWarning("Invalid AdVideoProgressMillisecondsCommand");
          }
          break;
        default:
          logAdWarning("Unknown or invalid AdVideoProgressOffSet kind");
      }
    }

    this.percentCommands.sort((a, b) => a.adVideoOffset.percent - b.adVideoOffset.percent);
    this.millisecondCommands.sort((a, b) => Number(a.adVideoOffset.milliseconds) - Number(b.adVideoOffset.milliseconds));
  }
}

// ============================================================================
// Discovery Layout Rendering Adapter  (line 74653)
// ============================================================================

/**
 * Tracks discovery-ad playback via cue-range quartile events
 * (part2viewed, 25%, 50%, 75%, 100%), progress pings, active-view
 * measurability, and audio measurement. Handles the "abandon" signal
 * for prematurely exited layouts.
 *
 * [was: LFX]
 */
export class DiscoveryLayoutAdapter { // was: LFX
  constructor(callback, slot, layout, componentManager, adStateRef, commandExecutor, featureFlags, activeViewService) {
    // was: Q, c, W, m, K, T, r, U, I
    this.callback = callback;
    this.slot = slot;
    this.layout = layout;
    this.componentManager = componentManager; // was: this.Ca = m
    this.adStateRef = adStateRef; // was: this.hJ = K
    this.featureFlags = featureFlags; // was: this.QC = r
    this.activeViewService = activeViewService; // was: this.lX = U
    this.hasAbandoned = false; // was: this.W = !1

    const adPlacementConfig = layout.clientMetadata.readTimecodeScale("metadata_type_ad_placement_config");
    this.pingDispatcher = new PingDispatcher(layout.zy, this.adStateRef, adPlacementConfig, layout.layoutId); // was: this.VC = new lf(...)

    const progressCommands = this.layout.clientMetadata.readTimecodeScale("METADATA_TYPE_INTERACTIONS_AND_PROGRESS_LAYOUT_COMMANDS")?.progressCommands || [];
    const getDuration = layout.clientMetadata.readTimecodeScale("METADATA_TYPE_MEDIA_LAYOUT_DURATION_seconds");
    this.progressScheduler = new AdVideoProgressScheduler(commandExecutor, progressCommands, layout.layoutId, () => getDuration * 1000); // was: this.O = new yR(...)
  }

  /** [was: It] */
  getSlot() { return this.slot; }
  /** [was: fO] */
  getLayout() { return this.layout; }

  init() {
    this.componentManager.get().addListener(this);
    this.componentManager.get().Ci.push(this);
    const videoLengthSec = this.layout.clientMetadata.readTimecodeScale("metadata_type_video_length_seconds");
    const trafficType = this.layout.clientMetadata.readTimecodeScale("metadata_type_active_view_traffic_type");
    if (isActiveViewEnabled(this.layout.zy)) { // was: fQ(...)
      registerActiveView(this.activeViewService.get(), this.layout.layoutId, { // was: uY(...)
        A8: trafficType,
        Oe: videoLengthSec,
        listener: this
      });
    }
  }

  release() {
    this.componentManager.get().removeListener(this);
    removeFromCiList(this.componentManager.get(), this); // was: Kq0(...)
    if (isActiveViewEnabled(this.layout.zy))
      unregisterActiveView(this.activeViewService.get(), this.layout.layoutId); // was: hw(...)
  }

  startRendering(layout) { // was: Q
    this.callback.normalizeAspectRatio(this.slot, layout);
  }

  onExitRendering(layout, exitReason) { // was: D5
    if (isAbandonTrackingEnabled(this.featureFlags.get()) && !this.hasAbandoned) { // was: LzX(...)
      this.pingDispatcher.fireOnce("abandon"); // was: this.VC.Y$("abandon")
      this.hasAbandoned = true; // was: !0
    }
    this.callback.onLayoutExited(this.slot, layout, exitReason);
  }

  /**
   * Handles cue-range events (quartiles, engaged-view, etc.).
   * [was: HN]
   */
  onCueRangeEvent(cueRange) { // was: Q
    switch (cueRange.id) {
      case "part2viewed":
        this.pingDispatcher.fireOnce("start");
        this.pingDispatcher.fireOnce("impression");
        break;
      case "videoplaytime25":
        this.pingDispatcher.fireOnce("first_quartile");
        break;
      case "videoplaytime50":
        this.pingDispatcher.fireOnce("midpoint");
        break;
      case "videoplaytime75":
        this.pingDispatcher.fireOnce("third_quartile");
        break;
      case "videoplaytime100":
        if (isAbandonTrackingEnabled(this.featureFlags.get())) {
          if (!this.hasAbandoned) {
            this.pingDispatcher.fireOnce("complete");
            this.hasAbandoned = true; // was: !0
          }
        } else {
          this.pingDispatcher.fireOnce("complete");
        }
        if (hasProgressPings(this.pingDispatcher)) // was: z1(this.VC)
          fireRemainingProgressPings(this.pingDispatcher, Infinity, true); // was: uR(this.VC, Infinity, !0)
        if (isProgressCommandsEnabled(this.featureFlags.get())) // was: wZW(...)
          executeRemainingProgressCommands(this.progressScheduler, Infinity, true); // was: CQ(this.O, Infinity, !0)
        break;
      case "engagedview":
        if (!hasProgressPings(this.pingDispatcher))
          this.pingDispatcher.fireOnce("progress");
        break;
      case "conversionview":
      case "videoplaybackstart":
      case "videoplayback2s":
      case "videoplayback10s":
        break;
      default:
        logAdWarning("Cue Range ID unknown in DiscoveryLayoutRenderingAdapter", this.slot, this.layout); // was: v1(...)
    }
  }

  onVolumeChange() {}
  gM() {}
  Qf() {}
  Jy() {}
  onFullscreenToggled() {}
  extractSurveyPlaybackCommands() {}
  oR() {}

  /**
   * Called on playback progress updates; dispatches timed progress pings
   * and scheduled progress commands.
   * [was: Gi]
   */
  onPlaybackProgress(currentTimeSec) { // was: Q
    if (isProgressCommandsEnabled(this.featureFlags.get()))
      executeRemainingProgressCommands(this.progressScheduler, currentTimeSec * 1000, false); // was: CQ(this.O, Q * 1E3, !1)
    if (hasProgressPings(this.pingDispatcher))
      fireRemainingProgressPings(this.pingDispatcher, currentTimeSec * 1000, false); // was: uR(this.VC, Q * 1E3, !1)
  }

  sE() {}

  /** Active-view measurable. [was: Vm] */
  onActiveViewMeasurable() {
    this.pingDispatcher.fireOnce("active_view_measurable");
  }

  /** Active-view viewable. [was: nL] */
  onActiveViewViewable() {
    this.pingDispatcher.fireOnce("active_view_viewable");
  }

  /** Active-view fully viewable + audible half duration. [was: oE] */
  onActiveViewFullyViewable() {
    this.pingDispatcher.fireOnce("active_view_fully_viewable_audible_half_duration");
  }

  /** Audio measurable. [was: N8] */
  onAudioMeasurable() {
    this.pingDispatcher.fireOnce("audio_measurable");
  }

  /** Audio audible. [was: vx] */
  onAudioAudible() {
    this.pingDispatcher.fireOnce("audio_audible");
  }
}

// ============================================================================
// Player Error Codes  (line 75474)
// ============================================================================

/**
 * Player error descriptor with error code, details map, and severity level.
 * [was: g.rh]
 */
export class PlayerError { // was: g.rh
  constructor(NetworkErrorCode, details = {}, severity = 0) {
    this.NetworkErrorCode = NetworkErrorCode;
    this.details = details;
    this.severity = severity;
  }
}

/**
 * Enum of all player error code constants.
 * [was: MpW]
 */
export const PLAYER_ERROR_CODES = { // was: MpW
  ALREADY_PINNED_ON_A_DEVICE: "ALREADY_PINNED_ON_A_DEVICE",
  AUTHENTICATION_EXPIRED: "AUTHENTICATION_EXPIRED",
  AUTHENTICATION_MALFORMED: "AUTHENTICATION_MALFORMED", // was: CM
  AUTHENTICATION_MISSING: "AUTHENTICATION_MISSING", // was: xB
  BAD_REQUEST: "BAD_REQUEST", // was: qO
  CAST_SESSION_DEVICE_MISMATCHED: "CAST_SESSION_DEVICE_MISMATCHED", // was: l2
  CAST_SESSION_VIDEO_MISMATCHED: "CAST_SESSION_VIDEO_MISMATCHED", // was: Zc
  CAST_TOKEN_EXPIRED: "CAST_TOKEN_EXPIRED", // was: cT
  CAST_TOKEN_FAILED: "CAST_TOKEN_FAILED", // was: d2
  CAST_TOKEN_MALFORMED: "CAST_TOKEN_MALFORMED", // was: LM
  CGI_PARAMS_MALFORMED: "CGI_PARAMS_MALFORMED", // was: BT
  CGI_PARAMS_MISSING: "CGI_PARAMS_MISSING", // was: GI
  DEVICE_FALLBACK: "DEVICE_FALLBACK", // was: C_
  GENERIC_WITH_LINK_AND_CPN: "GENERIC_WITH_LINK_AND_CPN", // was: Ng
  ERROR_HDCP: "ERROR_HDCP", // was: oD
  LICENSE: "LICENSE", // was: Va
  VIDEO_UNAVAILABLE: "VIDEO_UNAVAILABLE", // was: YP
  FORMAT_UNAVAILABLE: "FORMAT_UNAVAILABLE", // was: tX
  GEO_FAILURE: "GEO_FAILURE", // was: wF
  HTML5_AUDIO_RENDERER_ERROR: "HTML5_AUDIO_RENDERER_ERROR", // was: ZP
  GENERIC_WITHOUT_LINK: "GENERIC_WITHOUT_LINK", // was: dF
  HTML5_NO_AVAILABLE_FORMATS_FALLBACK: "HTML5_NO_AVAILABLE_FORMATS_FALLBACK", // was: Lb
  HTML5_SPS_UMP_STATUS_REJECTED: "HTML5_SPS_UMP_STATUS_REJECTED", // was: No
  INVALID_DRM_MESSAGE: "INVALID_DRM_MESSAGE", // was: Te
  PURCHASE_NOT_FOUND: "PURCHASE_NOT_FOUND", // was: aF2
  PURCHASE_REFUNDED: "PURCHASE_REFUNDED", // was: IFH
  RENTAL_EXPIRED: "RENTAL_EXPIRED", // was: JJF
  RETRYABLE_ERROR: "RETRYABLE_ERROR", // was: BeF
  SERVER_ERROR: "SERVER_ERROR", // was: SHM
  SIGNATURE_EXPIRED: "SIGNATURE_EXPIRED", // was: WIy
  STOPPED_BY_ANOTHER_PLAYBACK: "STOPPED_BY_ANOTHER_PLAYBACK", // was: Aea
  STREAMING_DEVICES_QUOTA_PER_24H_EXCEEDED: "STREAMING_DEVICES_QUOTA_PER_24H_EXCEEDED", // was: jkI
  STREAMING_NOT_ALLOWED: "STREAMING_NOT_ALLOWED", // was: Mhe
  STREAM_LICENSE_NOT_FOUND: "STREAM_LICENSE_NOT_FOUND", // was: Qk2
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS", // was: uwy
  TOO_MANY_REQUESTS_WITH_LINK: "TOO_MANY_REQUESTS_WITH_LINK", // was: hZe
  TOO_MANY_STREAMS_PER_ENTITLEMENT: "TOO_MANY_STREAMS_PER_ENTITLEMENT", // was: DQy
  TOO_MANY_STREAMS_PER_USER: "TOO_MANY_STREAMS_PER_USER", // was: XBH
  UNSUPPORTED_DEVICE: "UNSUPPORTED_DEVICE",
  VIDEO_FORBIDDEN: "VIDEO_FORBIDDEN", // was: FiC
  VIDEO_NOT_FOUND: "VIDEO_NOT_FOUND", // was: ExJ
  BROWSER_OR_EXTENSION_ERROR: "BROWSER_OR_EXTENSION_ERROR" // was: g2
};

// ============================================================================
// iOS Version Detection  (line 75567)
// ============================================================================

/**
 * Detects the iOS version from the user-agent string.
 * Returns the major.minor version number, 0 if iOS but version unknown,
 * or `undefined` if not iOS at all.
 *
 * [was: EX -> Jx]
 */
let detectedIOSVersion; // was: EX
{
  const userAgent = getUserAgent(); // was: Ji3
  const deviceMatch = userAgent.match(/\((iPad|iPhone|iPod)( Simulator)?;/);
  if (!deviceMatch || deviceMatch.length < 2) {
    detectedIOSVersion = undefined; // was: void 0
  } else {
    const versionMatch = userAgent.match(
      /\((iPad|iPhone|iPod)( Simulator)?; (U; )?CPU (iPhone )?OS (\d+_\d)[_ ]/
    ); // was: sX
    detectedIOSVersion = versionMatch && versionMatch.length === 6
      ? Number(versionMatch[5].replace("_", "."))
      : 0;
  }
}

/**
 * iOS version number, or `undefined` if not iOS.
 * [was: Jx]
 */
export const iosVersion = detectedIOSVersion; // was: Jx

/**
 * Whether the current device is any iOS version.
 * [was: I1]
 */
export const isIOS = iosVersion >= 0; // was: I1
