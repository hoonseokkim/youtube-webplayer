/**
 * Ad Layout Rendering Lifecycle
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~77000-78122
 *
 * Manages the full lifecycle of ad layout rendering:
 *   - State machine:  "not_rendering" -> "rendering_start_requested" -> "rendering" -> "rendering_stop_requested" -> null
 *   - Impression/quartile tracking via the VC (ViewabilityController)
 *   - Mute/fullscreen command dispatch on layout enter
 *   - Progress quartile callbacks (25% first_quartile, 50% midpoint, 75% third_quartile, 100% complete)
 *   - Layout exit finalization with SSDAI duration calculations
 *   - Error encoding (402 = load_timeout, 400 = other)
 *   - SSDAI cue-range-based completion detection
 *   - Active View measurability / viewability / audibility event forwarding
 *
 * Adapter hierarchy:
 *   Uxn (base) -> $V_ (timer-based VOD) -> l87 (player-bytes media)
 *   kZn (composite VOD) wraps multiple sub-layout adapters
 *   pY3 (single VOD) delegates to a single inner adapter
 *   IWR (DAI base) -> XHO (DAI composite with survey) -> ev7 (DAI single media)
 *   At_ (SSDAI sub-layout media adapter)
 */

// ---------------------------------------------------------------------------
// Imports (conceptual)
// ---------------------------------------------------------------------------
import { Disposable } from '../core/disposable.js';           // was: g.qK
import { Timer } from '../core/timer.js';                     // was: g.DE
import { DeferredCallback } from '../core/promise.js';        // was: g.Uc
import { logWarning } from '../core/errors.js';               // was: v1
import { AdError } from '../core/errors.js';                  // was: oe
import { InvalidStateError } from '../core/errors.js';        // was: z
import { executeCommands } from './ad-command-executor.js';    // was: BR
import { getAdLayoutMetadata } from './ad-metadata.js';        // was: nA
import { reportTelemetry, reportTelemetryBucket } from '../core/telemetry.js'; // was: f2, y$
import { getExperimentBoolean } from '../data/idb-transactions.js'; // was: g.P
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { isMuted, getVolume } from '../player/time-tracking.js';
import { listen, getExperimentFlag } from '../core/composition-helpers.js';
import { dispose, onCueRangeEnter, onCueRangeExit } from './dai-cue-range.js';
import { preloadVideoByPlayerVars, playVideo } from '../player/player-events.js';
import { loadVideoByPlayerVars } from '../player/player-api.js';
import { onSlotFulfilled, notifyLayoutEntered } from './ad-scheduling.js';
import { slice } from '../core/array-utils.js';
import { toString } from '../core/string-utils.js';
import { getCurrentTimeSec } from '../player/playback-bridge.js';

// ---------------------------------------------------------------------------
// BaseLayoutRenderingAdapter [was: Uxn]  (line ~76900, enter at 77000)
// ---------------------------------------------------------------------------

/**
 * Abstract base for all ad-layout rendering adapters.
 *
 * Subclasses override the template-method hooks (`LT`, `Zu`, `lF`, etc.)
 * while the base provides impression tracking, quartile progress, volume /
 * fullscreen change handling, and Active View event forwarding.
 *
 * [was: Uxn]
 *
 * @property {string}  renderState    "not_rendering" | "rendering_start_requested" | "rendering" | "rendering_stop_requested" [was: pX]
 * @property {boolean} wasMutedOnEnter  Whether the player was muted when layout entered [was: W]
 * @property {Object|undefined} errorInfo  Encoded error payload `{ gP, i_, errorMessage }` [was: K]
 */
export class BaseLayoutRenderingAdapter {
  // -----------------------------------------------------------------------
  // onLayoutEnter [was: Mm]  (line 77000)
  // -----------------------------------------------------------------------

  /**
   * Called when the layout enters the "rendering" state.
   *
   * Fires "impression" and "start" events, handles initial mute/fullscreen
   * commands, begins timeline tracking, and dispatches impression commands.
   *
   * [was: Mm]
   *
   * @param {Object} slot    The parent slot [was: Q]
   * @param {Object} layout  The layout being entered [was: c]
   */
  onLayoutEnter(slot, layout) { // was: Mm
    if (layout.layoutId !== this.layout.layoutId) return;

    this.renderState = 'rendering'; // was: this.pX = "rendering"
    this.wasMutedOnEnter = this.playerApi.get().isMuted() || this.playerApi.get().getVolume() === 0; // was: this.W

    this.fireTrackingEvent('impression'); // was: this.Y$("impression")
    this.fireTrackingEvent('start');      // was: this.Y$("start")

    // --- Mute commands ---
    if (this.playerApi.get().isMuted()) { // was: this.Ca.get().isMuted()
      this.fireViewabilityMilestone('mute'); // was: DK(this, "mute")
      const muteCommands = getAdLayoutMetadata(this)?.muteCommands || []; // was: nA(this)?.muteCommands || []
      executeCommands(this.commandExecutor.get(), muteCommands, this.layout.layoutId); // was: BR(this.r3.get(), Q, this.layout.layoutId)
    }

    // --- Fullscreen commands ---
    if (this.playerApi.get().isFullscreen()) { // was: this.Ca.get().isFullscreen()
      this.fireViewabilityEvent('fullscreen'); // was: this.m9("fullscreen")
      const fullscreenCommands = getAdLayoutMetadata(this)?.fullscreenCommands || [];
      executeCommands(this.commandExecutor.get(), fullscreenCommands, this.layout.layoutId);
    }

    // --- Timeline setup ---
    const timelineManager = this.timelineManager.get(); // was: Q = this.D7.get()
    if (timelineManager.isActive && !timelineManager.isStarted) { // was: Q.A && !Q.O
      timelineManager.isCancelled = false; // was: Q.K = !1 -> false
      timelineManager.isStarted = true;    // was: Q.O = !0 -> true
      if (timelineManager.actionType !== 'ad_to_video') {
        reportTelemetry('pbs', undefined, timelineManager.actionType); // was: tr("pbs", void 0, Q.actionType)
        // Feature flag gated finalisation
        if (getExperimentBoolean('finalize_all_timelines')) { // was: g.P("finalize_all_timelines")
          finalizeTimeline(timelineManager.actionType); // was: Zd0(Q.actionType)
        }
      }
    }

    this.setAdActive(1);             // was: this.ow(1)
    this.onRenderingConfirmed(layout); // was: this.Zu(c)

    // --- Impression commands ---
    const impressionCommands = getAdLayoutMetadata(this)?.impressionCommands || [];
    executeCommands(this.commandExecutor.get(), impressionCommands, this.layout.layoutId);
  }

  // -----------------------------------------------------------------------
  // onLayoutError [was: fp]  (line 77021)
  // -----------------------------------------------------------------------

  /**
   * Called on a layout-level error.  Encodes the error code:
   *   - "load_timeout" -> 402
   *   - anything else  -> 400
   *
   * Fires the "error" tracking event and dispatches error commands.
   *
   * [was: fp]
   *
   * @param {string} errorType     "load_timeout" | other  [was: Q]
   * @param {Error}  error         The underlying error     [was: c]
   * @param {string} errorCategory ADS_CLIENT_ERROR_TYPE_*  [was: W]
   */
  onLayoutError(errorType, error, errorCategory) { // was: fp
    this.errorInfo = { // was: this.K
      severityLevel: 3,                                   // was: gP: 3
      NetworkErrorCode: errorType === 'load_timeout' ? 402 : 400, // was: i_: Q === "load_timeout" ? 402 : 400
      errorMessage: error.message,                         // was: errorMessage: c.message
    };

    this.fireTrackingEvent('error'); // was: this.Y$("error")

    const errorCommands = getAdLayoutMetadata(this)?.errorCommands || [];
    executeCommands(this.commandExecutor.get(), errorCommands, this.layout.layoutId);

    this.callback.reportError(this.slot, this.layout, error, errorCategory); // was: this.wR.Gm(...)
  }

  // -----------------------------------------------------------------------
  // onProgress [was: dB]  (line 77032)
  // -----------------------------------------------------------------------

  /**
   * Reports playback progress and fires quartile milestones.
   *
   * Quartile thresholds (of total ad duration):
   *   - 25%  -> "first_quartile"
   *   - 50%  -> "midpoint"
   *   - 75%  -> "third_quartile"
   *   - 100% -> "complete"  (handled elsewhere on layout exit)
   *
   * [was: dB]
   *
   * @param {number}  currentTimeSec  Elapsed time in seconds [was: Q]
   * @param {boolean} forceFlush      Force fire all remaining quartiles [was: c, default false]
   */
  onProgress(currentTimeSec, forceFlush = false) { // was: dB(Q, c=!1)
    if (this.renderState !== 'rendering') return; // was: this.pX === "rendering"

    updateViewabilityProgress(this.viewabilityController, currentTimeSec * 1000, forceFlush); // was: uR(this.VC, Q * 1E3, c)
    updateBulkProgress(this, currentTimeSec * 1000, forceFlush); // was: bun(this, Q * 1E3, c)

    const durationSec = this.getDurationMs(); // was: W = this.Tj()
    if (durationSec) {
      const totalSec = durationSec / 1000; // was: W /= 1E3

      if (currentTimeSec >= totalSec * 0.25 || forceFlush) {
        this.fireTrackingEvent('first_quartile'); // was: this.Y$("first_quartile")
      }
      if (currentTimeSec >= totalSec * 0.50 || forceFlush) {
        this.fireTrackingEvent('midpoint'); // was: this.Y$("midpoint")
      }
      if (currentTimeSec >= totalSec * 0.75 || forceFlush) {
        this.fireTrackingEvent('third_quartile'); // was: this.Y$("third_quartile")
      }

      // Flush progress commands
      const enableFlushOnKabuki = this.experimentConfig.get().U.G().experiments
        .SG('enable_progress_command_flush_on_kabuki'); // was: this.QC.get().U.G().experiments.SG(...)
      if (enableFlushOnKabuki) {
        flushProgressCommands(this.progressCommandHandler, currentTimeSec * 1000, forceFlush); // was: CQ(this.O, Q * 1E3, c)
      } else {
        flushProgressCommands(
          this.progressCommandHandler,
          currentTimeSec * 1000,
          isServerStitched(this) ? forceFlush : false, // was: gIx(this) ? c : !1
        );
      }
    }
  }

  // -----------------------------------------------------------------------
  // getContentCpn [was: hC]  (line 77044)
  // -----------------------------------------------------------------------

  /**
   * Returns the content CPN (Client Playback Nonce) for the current media.
   *
   * [was: hC]
   * @returns {string}
   */
  getContentCpn() { // was: hC
    return getMediaInfo(this.mediaInfoProvider.get(), 1)?.clientPlaybackNonce || ''; // was: mX(this.cA.get(), 1)?.clientPlaybackNonce || ""
  }

  // -----------------------------------------------------------------------
  // validateLayout [was: Kv]  (line 77047)
  // -----------------------------------------------------------------------

  /**
   * Validates that a layout matches the one this adapter owns.
   * Calls the error callback if it does not match.
   *
   * [was: Kv]
   */
  validateLayout(layout, onValid) { // was: Kv(Q, c)
    if (layout.layoutId !== this.layout.layoutId) {
      this.callback.reportError(
        this.slot,
        layout,
        new AdError(
          `Tried to stop rendering an unknown layout, this adapter requires LayoutId: ${this.layout.layoutId}and LayoutType: ${this.layout.layoutType}`,
          undefined,
          'ADS_CLIENT_ERROR_MESSAGE_UNKNOWN_LAYOUT',
        ),
        'ADS_CLIENT_ERROR_TYPE_EXIT_LAYOUT_FAILED',
      );
    } else {
      onValid();
    }
  }

  // -----------------------------------------------------------------------
  // onLayoutExited [was: onLayoutExited]  (line 77050)
  // -----------------------------------------------------------------------

  /**
   * Finalization when a layout exits rendering.
   *
   * Dispatches abandon / complete / skip commands depending on exit reason,
   * resets state to "not_rendering".
   *
   * [was: onLayoutExited]
   *
   * @param {Object} slot       [was: Q]
   * @param {Object} layout     [was: c]
   * @param {string} exitReason "abandoned" | "normal" | "skipped" [was: W]
   */
  onLayoutExited(slot, layout, exitReason) { // was: onLayoutExited(Q, c, W)
    if (layout.layoutId !== this.layout.layoutId) return;

    this.renderState = 'not_rendering'; // was: this.pX = "not_rendering"
    this.layoutExitReason = undefined;  // was: this.layoutExitReason = void 0

    // Fire forced quartile on final or non-last position
    const shouldForceQuartile = exitReason !== 'normal' || this.position + 1 === this.totalAdsInPod; // was: Q = W !== "normal" || this.position + 1 === this.j
    if (shouldForceQuartile) {
      this.reportAdBreakProgress(shouldForceQuartile); // was: this.yv(Q)
    }
    this.onExitReasonHandled(exitReason); // was: this.lF(W)
    this.setAdActive(0);                  // was: this.ow(0)

    switch (exitReason) {
      case 'abandoned': {
        if (hasTracked(this.viewabilityController, 'impression')) { // was: hI(this.VC, "impression")
          const abandonCommands = getAdLayoutMetadata(this)?.abandonCommands || [];
          executeCommands(this.commandExecutor.get(), abandonCommands, this.layout.layoutId);
        }
        break;
      }
      case 'normal': {
        const completeCommands = getAdLayoutMetadata(this)?.completeCommands || [];
        executeCommands(this.commandExecutor.get(), completeCommands, this.layout.layoutId);
        break;
      }
      case 'skipped': {
        const skipCommands = getAdLayoutMetadata(this)?.skipCommands || [];
        executeCommands(this.commandExecutor.get(), skipCommands, this.layout.layoutId);
        break;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Accessor helpers
  // -----------------------------------------------------------------------

  /** Returns the layout ID. [was: eE] */
  getLayoutId() { return this.layout.layoutId; } // was: eE

  /** Returns the current error info. [was: yW] */
  getErrorInfo() { return this.errorInfo; } // was: yW

  // -----------------------------------------------------------------------
  // Active View event forwarding  (lines 77077-77110)
  // -----------------------------------------------------------------------

  /** Fires "active_view_measurable" + dispatches commands. [was: Vm] */
  onActiveViewMeasurable() { // was: Vm
    if (this.renderState !== 'rendering') return;
    this.viewabilityController.fireTrackingEvent('active_view_measurable');
    const commands = getAdLayoutMetadata(this)?.activeViewMeasurableCommands || [];
    executeCommands(this.commandExecutor.get(), commands, this.layout.layoutId);
  }

  /** Fires "active_view_fully_viewable_audible_half_duration". [was: oE] */
  onActiveViewFullyViewableAudibleHalfDuration() { // was: oE
    if (this.renderState !== 'rendering') return;
    this.viewabilityController.fireTrackingEvent('active_view_fully_viewable_audible_half_duration');
    const commands = getAdLayoutMetadata(this)?.activeViewFullyViewableAudibleHalfDurationCommands || [];
    executeCommands(this.commandExecutor.get(), commands, this.layout.layoutId);
  }

  /** Fires "active_view_viewable". [was: nL] */
  onActiveViewViewable() { // was: nL
    if (this.renderState !== 'rendering') return;
    this.viewabilityController.fireTrackingEvent('active_view_viewable');
    const commands = getAdLayoutMetadata(this)?.activeViewViewableCommands || [];
    executeCommands(this.commandExecutor.get(), commands, this.layout.layoutId);
  }

  /** Fires "audio_audible". [was: vx] */
  onAudioAudible() { // was: vx
    if (this.renderState !== 'rendering') return;
    this.viewabilityController.fireTrackingEvent('audio_audible');
    const commands = getAdLayoutMetadata(this)?.activeViewAudioAudibleCommands || [];
    executeCommands(this.commandExecutor.get(), commands, this.layout.layoutId);
  }

  /** Fires "audio_measurable". [was: N8] */
  onAudioMeasurable() { // was: N8
    if (this.renderState !== 'rendering') return;
    this.viewabilityController.fireTrackingEvent('audio_measurable');
    const commands = getAdLayoutMetadata(this)?.activeViewAudioMeasurableCommands || [];
    executeCommands(this.commandExecutor.get(), commands, this.layout.layoutId);
  }

  // -----------------------------------------------------------------------
  // reportAdBreakProgress [was: yv]  (line 77112)
  // -----------------------------------------------------------------------

  /**
   * Notifies the timeline manager of ad-break progress for the current
   * placement kind (pre-roll, mid-roll, etc.).
   *
   * [was: yv]
   */
  reportAdBreakProgress(isFinal) { // was: yv(Q)
    this.timelineManager.get().reportAdBreakProgress(
      this.layout.clientMetadata.readTimecodeScale('metadata_type_ad_placement_config').kind,
      isFinal,
      this.position,
      this.totalAdsInPod,
      false, // was: !1
    );
  }

  // -----------------------------------------------------------------------
  // onFullscreenToggled  (line 77115)
  // -----------------------------------------------------------------------

  /**
   * Handles fullscreen enter/exit during rendering and dispatches the
   * corresponding fullscreen or end_fullscreen commands.
   *
   * [was: onFullscreenToggled]
   */
  onFullscreenToggled(isFullscreen) { // was: onFullscreenToggled(Q)
    if (this.renderState !== 'rendering') return;

    if (isFullscreen) {
      this.fireViewabilityEvent('fullscreen'); // was: this.m9("fullscreen")
      const commands = getAdLayoutMetadata(this)?.fullscreenCommands || [];
      executeCommands(this.commandExecutor.get(), commands, this.layout.layoutId);
    } else {
      this.fireViewabilityEvent('end_fullscreen'); // was: this.m9("end_fullscreen")
      const commands = getAdLayoutMetadata(this)?.endFullscreenCommands || [];
      executeCommands(this.commandExecutor.get(), commands, this.layout.layoutId);
    }
  }

  // -----------------------------------------------------------------------
  // onVolumeChange  (line 77122)
  // -----------------------------------------------------------------------

  /**
   * Handles mute/unmute during rendering and dispatches the corresponding
   * mute or unmute commands.
   *
   * [was: onVolumeChange]
   */
  onVolumeChange() { // was: onVolumeChange
    if (this.renderState !== 'rendering') return;

    if (this.playerApi.get().isMuted()) {
      this.fireViewabilityMilestone('mute'); // was: DK(this, "mute")
      const commands = getAdLayoutMetadata(this)?.muteCommands || [];
      executeCommands(this.commandExecutor.get(), commands, this.layout.layoutId);
    } else {
      this.fireViewabilityMilestone('unmute'); // was: DK(this, "unmute")
      const commands = getAdLayoutMetadata(this)?.unmuteCommands || [];
      executeCommands(this.commandExecutor.get(), commands, this.layout.layoutId);
    }
  }

  // Stub callbacks (no-ops in base)  [was: Qf, Jy, gM, HN, sE]
  onPlayerResize() {}       // was: Qf
  onAutonavChange() {}      // was: Jy
  onSizeChanged() {}        // was: gM
  onPlayerUnderlayChange() {} // was: HN
  onSafeBrowse() {}         // was: sE

  // -----------------------------------------------------------------------
  // Internal helpers  (line 77138-77143)
  // -----------------------------------------------------------------------

  /** @private Fires a viewability event. [was: m9] */
  fireViewabilityEvent(eventName) { // was: m9(Q)
    this.viewabilityController.fireViewabilityEvent(eventName, !this.wasMutedOnEnter); // was: this.VC.m9(Q, !this.W)
  }

  /** @private Fires a tracking event. [was: Y$] */
  fireTrackingEvent(eventName) { // was: Y$(Q)
    this.viewabilityController.fireTrackingEvent(eventName, !this.wasMutedOnEnter); // was: this.VC.Y$(Q, !this.W)
  }
}

// ---------------------------------------------------------------------------
// TimerBasedVodLayoutAdapter [was: $V_]  (line 77146)
// ---------------------------------------------------------------------------

/**
 * Timer-driven VOD layout adapter that uses a 200ms polling interval to
 * advance elapsed time and fire progress/quartile events.
 *
 * Extends {@link BaseLayoutRenderingAdapter} with a `g.DE(200)` timer.
 *
 * [was: $V_]
 *
 * @property {number} elapsedMs   Accumulated playback time in ms [was: K2]
 * @property {number} lastTickMs  Timestamp of last timer tick     [was: iZ]
 * @property {boolean} canAutoAdvance  Whether this adapter auto-advances [was: QV]
 */
export class TimerBasedVodLayoutAdapter extends BaseLayoutRenderingAdapter { // was: $V_
  constructor(config) { // was: constructor(Q)
    super(
      config.callback, config.slot, config.layout, config.adBreakCoordinator,
      config.activeViewManager, config.mediaInfoProvider, config.playerApi,
      config.timelineManager, config.commandExecutor, config.setAdActive,
      config.viewabilityControllerFactory, config.adBreakIndex,
      config.experimentConfig, config.progressCommandConfig, config.context,
    );

    this.canAutoAdvance = true;  // was: this.QV = !0
    this.elapsedMs = 0;         // was: this.K2 = 0
    this.lastTickMs = 0;        // was: this.iZ = 0

    /** @private Deferred callback to confirm rendering start. [was: QG] */
    this.confirmRenderingStart = deferOnce(() => { // was: GC(...)
      this.callback.onLayoutEnter(this.slot, this.layout); // was: this.wR.Mm(this.slot, this.layout)
    });

    this.notifyComplete = config.notifyComplete; // was: this.mG
    this.onAdComplete = config.onAdComplete;     // was: this.pL

    /** @private Deferred callback to handle completion / exit. [was: dJ] */
    this.handleCompletion = deferOnce(() => { // was: GC(...)
      if (this.renderState !== 'rendering_stop_requested') { // was: this.pX !== "rendering_stop_requested"
        this.onAdComplete(this);
      }
      this.finalizeExit(); // was: this.LW()
    });

    /** @private 200ms polling timer. [was: timer] */
    this.timer = new Timer(200); // was: new g.DE(200)
    this.timer.listen('tick', () => {
      this.onTick(); // was: this.kx()
    });
    dispose(this, this.timer); // was: g.F(this, this.timer)
  }

  /**
   * Finalize exit: if we have a stored exit reason, fire onLayoutExited;
   * otherwise signal unexpected exit.
   * [was: LW]
   */
  finalizeExit() { // was: LW
    if (this.layoutExitReason) {
      this.callback.onLayoutExited(this.slot, this.layout, this.layoutExitReason);
    } else {
      signalUnexpectedExit(this); // was: dVm(this)
    }
  }

  /** No-op. [was: WL] */
  onAdapterReady() {} // was: WL

  /** Cleanup: detach from coordinator, stop timer. [was: jT] */
  onRelease() { // was: jT
    const coordinator = this.adBreakCoordinator.get(); // was: Q = this.hJ.get()
    if (coordinator.activeAdapter === this) { // was: Q.S_ === this
      coordinator.activeAdapter = null;
    }
    this.timer.stop();
  }

  /** Pause: stop timer, store paused state. [was: Tk] */
  onPause() { // was: Tk
    this.timer.stop();
    savePlaybackState(this); // was: LA3(this)
  }

  /** Resume: restore state, restart. [was: yX] */
  onResume() { // was: yX
    restorePlaybackProgress(this); // was: GZw(this)
    restartTimeline(this);         // was: wY3(this)
  }

  /**
   * Returns the ad duration in milliseconds from metadata.
   * [was: Tj]
   */
  getDurationMs() { // was: Tj
    return this.getLayout().clientMetadata.readTimecodeScale('METADATA_TYPE_MEDIA_BREAK_LAYOUT_DURATION_MILLISECONDS');
  }

  /**
   * Returns elapsed playback time in seconds.
   * [was: Zp]
   */
  getElapsedTimeSec() { // was: Zp
    return this.elapsedMs / 1000;
  }

  // -----------------------------------------------------------------------
  // onLayoutExit [was: D5]  (line 77195)
  // -----------------------------------------------------------------------

  /**
   * Initiates the layout exit sequence: validates the layout, transitions
   * to "rendering_stop_requested", stores exit reason, and stops timer.
   *
   * [was: D5]
   *
   * @param {Object} layout     Layout to exit [was: Q]
   * @param {string} exitReason "normal" | "abandoned" | "skipped" [was: c]
   */
  onLayoutExit(layout, exitReason) { // was: D5(Q, c)
    this.validateLayout(layout, () => {
      if (this.renderState === 'rendering_stop_requested') return;
      this.renderState = 'rendering_stop_requested';
      this.layoutExitReason = exitReason;
      handleExitTransition(this, exitReason); // was: Ou0(this, c)
      this.timer.stop();
    });
  }

  // -----------------------------------------------------------------------
  // onTick [was: kx]  (line 77204)
  // -----------------------------------------------------------------------

  /**
   * Timer tick handler (every 200ms). Accumulates elapsed time, fires
   * progress, and auto-completes when duration is reached.
   *
   * [was: kx]
   */
  onTick() { // was: kx
    const now = Date.now();
    const delta = now - this.lastTickMs;
    this.lastTickMs = now;
    this.elapsedMs += delta;

    if (this.elapsedMs >= this.getDurationMs()) {
      this.elapsedMs = this.getDurationMs();
      this.onProgress(this.elapsedMs / 1000, true);             // was: this.dB(this.K2 / 1E3, !0)
      reportAdBreakDuration(this, this.elapsedMs);               // was: yv(this, this.K2)
      this.handleCompletion();                                   // was: this.dJ()
    } else {
      this.onProgress(this.elapsedMs / 1000);                   // was: this.dB(this.K2 / 1E3)
      reportAdBreakDuration(this, this.elapsedMs);               // was: yv(this, this.K2)
    }
  }

  // -----------------------------------------------------------------------
  // onPlayerStateChange [was: Wc]  (line 77215)
  // -----------------------------------------------------------------------

  /**
   * Reacts to player state changes. If the ad player (type 2) has started
   * playing and we are in "rendering_start_requested", confirms rendering.
   *
   * [was: Wc]
   */
  ong.tS(event) { // was: Wc(Q)
    if (this.renderState === 'not_rendering') return;

    const stateChange = normalizeStateChange(this, event); // was: f8W(this, Q)
    const isAdPlayer = this.playerApi.get().getPresentingPlayerType() === 2; // was: c

    if (this.renderState === 'rendering_start_requested') {
      if (isAdPlayer && isPlaybackStarted(stateChange)) { // was: cT(Q)
        this.confirmRenderingStart();
      }
    } else if (isAdPlayer) {
      if (stateChange.hasFlag(2)) { // was: Q.Fq(2)  -- ended flag
        logWarning('Receive player ended event during MediaBreak', this.getSlot(), this.getLayout());
      } else {
        handleAdPlaybackState(this, stateChange); // was: vI7(this, Q)
      }
    } else {
      this.requestExit(); // was: this.y6()
    }
  }

  // -----------------------------------------------------------------------
  // prepareRendering [was: LT]  (line 77222)
  // -----------------------------------------------------------------------

  /**
   * Prepares the player for ad rendering: pauses content, sets this as
   * the active adapter, marks playback as ad-initiated.
   *
   * [was: LT]
   */
  prepareRendering() { // was: LT
    preparePlayerForAd(this); // was: a8x(this)
    pauseContent(this.playerApi.get()); // was: pH(this.Ca.get())
    this.adBreakCoordinator.get().activeAdapter = this; // was: this.hJ.get().S_ = this

    // Ensure telemetry buckets are initialised
    if (!hasTelemetry('pbp') && !hasTelemetry('pbs')) reportTelemetry('pbp');
    if (!hasTelemetry('pbp', 'watch') && !hasTelemetry('pbs', 'watch')) {
      reportTelemetry('pbp', undefined, 'watch');
    }

    this.confirmRenderingStart();
  }

  // -----------------------------------------------------------------------
  // onRenderingConfirmed [was: Zu]  (line 77230)
  // -----------------------------------------------------------------------

  /**
   * Called after the layout is confirmed as rendering. Determines the
   * ad break type and logs transition metadata.
   *
   * [was: Zu]
   */
  onRenderingConfirmed(layout) { // was: Zu(Q)
    this.timelineManager.get();
    const placementKind = layout.clientMetadata.readTimecodeScale('metadata_type_ad_placement_config').kind; // was: c
    const isFirst = this.position === 0; // was: W
    const linkedLayoutType = layout.clientMetadata.readTimecodeScale('metadata_type_linked_in_player_layout_type');

    const breakInfo = {
      adBreakType: mapPlacementKind(placementKind), // was: HD(c)
      adType: mapLayoutType(linkedLayoutType),       // was: vw_(Q)
    };

    let transitionType = undefined; // was: m = void 0
    if (isFirst) {
      if (placementKind !== 'AD_PLACEMENT_KIND_START') {
        transitionType = 'video_to_ad';
      }
    } else {
      transitionType = 'ad_to_ad';
    }

    reportBucket('ad_mbs', undefined, transitionType); // was: Bu("ad_mbs", void 0, m)
    g.xh(breakInfo, transitionType);
    restorePlaybackProgress(this); // was: GZw(this)
  }

  /** Triggers the completion callback. [was: y6] */
  requestExit() { this.handleCompletion(); } // was: y6

  /** No-op exit reason handler. [was: lF] */
  onExitReasonHandled() {} // was: lF

  /** No-op progress report hook. [was: oR] */
  onContentProgress() {} // was: oR
}

// ---------------------------------------------------------------------------
// PlayerBytesMediaLayoutAdapter [was: l87]  (line 77252)
// ---------------------------------------------------------------------------

/**
 * Media layout adapter that uses the player's own progress events
 * (player bytes) instead of a timer. Handles preloading, load timeout
 * detection, and SSDAI cue-range completion.
 *
 * [was: l87]
 *
 * @property {string}  adCpn           Ad CPN [was: adCpn]
 * @property {number}  startTimeMs     Timestamp when ad started [was: IK]
 * @property {number}  lastReportedSec Last progress report time in sec [was: dh]
 * @property {string|undefined} cueRangeId  Active cue range ID [was: II]
 */
export class PlayerBytesMediaLayoutAdapter extends BaseLayoutRenderingAdapter { // was: l87
  constructor(config) {
    super(
      config.callback, config.slot, config.layout, config.adBreakCoordinator,
      config.activeViewManager, config.mediaInfoProvider, config.playerApi,
      config.timelineManager, config.commandExecutor, config.setAdActive,
      config.viewabilityControllerFactory, config.adBreakIndex,
      config.experimentConfig, config.progressCommandConfig, config.context,
    );

    this.adCpn = '';
    this.startTimeMs = 0;  // was: this.IK = 0
    this.lastReportedSec = 0; // was: this.dh = 0

    this.confirmRenderingStart = deferOnce(() => {
      this.callback.onLayoutEnter(this.slot, this.layout);
    });
    this.handleCompletion = deferOnce(() => {
      this.finalizeExit();
    });

    this.mediaInfoRef = config.mediaInfoProvider;   // was: this.AV
    this.sodarProvider = config.sodarProvider;       // was: this.cG
    this.playerProxy = config.playerProxy;           // was: this.LX
    this.cueRangeManager = config.cueRangeManager;  // was: this.KX
    this.notifyComplete = config.notifyComplete;     // was: this.mG
    this.adInfoProvider = config.adInfoProvider;     // was: this.kR
    this.onAdComplete = config.onAdComplete;         // was: this.pL

    // --- Load timeout watchdog ---
    if (!getExperimentFlag(this.experimentConfig.get(), 'html5_disable_media_load_timeout')) {
      this.loadTimeoutTimer = new DeferredCallback(() => { // was: this.vL = new g.Uc(...)
        this.onLayoutError(
          'load_timeout',
          new AdError('Media layout load timeout.', {}, 'ADS_CLIENT_ERROR_MESSAGE_MEDIA_LAYOUT_LOAD_TIMEOUT', true),
          'ADS_CLIENT_ERROR_TYPE_ENTER_LAYOUT_FAILED',
        );
      }, 10000);
    }

    // --- Preload timer ---
    const enablePreload = isPreloadEnabled(this.experimentConfig.get());
    const enablePreloadGv = isPreloadGvEnabled(this.experimentConfig.get());
    if (enablePreload && enablePreloadGv) {
      this.preloadTimer = new DeferredCallback(() => { // was: this.n4
        const preloadVars = this.layout.clientMetadata.readTimecodeScale('metadata_type_preload_player_vars');
        if (preloadVars) {
          this.playerProxy.get().U.preloadVideoByPlayerVars(preloadVars, 2, 300);
        }
      });
    }
  }

  /** [was: y6] */
  requestExit() { this.handleCompletion(); }

  /** [was: LW] */
  finalizeExit() {
    if (this.renderState !== 'rendering_stop_requested') {
      this.onAdComplete(this);
    }
    if (this.layoutExitReason) {
      this.callback.onLayoutExited(this.slot, this.layout, this.layoutExitReason);
    } else {
      signalUnexpectedExit(this);
    }
  }

  /** Setup callback ref and shrunken config. [was: WL] */
  onAdapterReady() {
    this.getLayout().clientMetadata.readTimecodeScale('metadata_type_player_bytes_callback_ref').current = this;
    this.shrunkenPlayerBytesConfig = this.getLayout().clientMetadata.readTimecodeScale('metadata_type_shrunken_player_bytes_config');
  }

  /** Cleanup: clear callback ref, remove cue range, dispose timers. [was: jT] */
  onRelease() {
    this.getLayout().clientMetadata.readTimecodeScale('metadata_type_player_bytes_callback_ref').current = null;
    if (this.cueRangeId) {
      this.cueRangeManager.get().removeCueRange(this.cueRangeId);
    }
    this.cueRangeId = undefined;
    this.loadTimeoutTimer?.dispose();
    this.preloadTimer?.dispose();
  }

  // -----------------------------------------------------------------------
  // prepareRendering [was: LT]  (line 77308)
  // -----------------------------------------------------------------------

  /**
   * Loads the ad video into the player, starts the load timeout, and
   * optionally triggers preload for upcoming ads.
   *
   * [was: LT]
   */
  prepareRendering(layout) { // was: LT(Q)
    const placementConfig = layout.clientMetadata.readTimecodeScale('metadata_type_ad_placement_config');
    const shouldPreload = isPreloadEnabled(this.experimentConfig.get(), placementConfig);
    const preloadGv = isPreloadGvEnabled(this.experimentConfig.get());

    if (shouldPreload && preloadGv) {
      const preloadVars = layout.clientMetadata.readTimecodeScale('metadata_type_preload_player_vars');
      const waitTimeSecs = getExperimentValue(this.experimentConfig.get(), 'html5_preload_wait_time_secs');
      if (preloadVars && this.preloadTimer) {
        this.preloadTimer.start(waitTimeSecs * 1000);
      }
    }

    // Legacy info card VAST extension
    const adVideoId = layout.clientMetadata.readTimecodeScale('metadata_type_ad_video_id');
    const vastExt = layout.clientMetadata.readTimecodeScale('metadata_type_legacy_info_card_vast_extension');
    if (adVideoId && vastExt) {
      this.adInfoProvider.get().U.G().Ka.add(adVideoId, { vastExtension: vastExt }); // was: J$: m
    }

    // Sodar extension
    const sodarData = layout.clientMetadata.readTimecodeScale('metadata_type_sodar_extension_data');
    if (sodarData) {
      registerSodar(this.sodarProvider.get(), sodarData); // was: RTK(...)
    }

    setAllowSeeking(this.playerApi.get(), false); // was: TWx(this.Ca.get(), !1)
    preparePlayerForAd(this);                       // was: a8x(this)

    // Load the ad video
    if (shouldPreload) {
      const playerVars = layout.clientMetadata.readTimecodeScale('metadata_type_player_vars');
      this.playerProxy.get().U.loadVideoByPlayerVars(playerVars, false, 2);
    } else {
      loadAdVideo(this.playerProxy.get(), layout.clientMetadata.readTimecodeScale('metadata_type_player_vars')); // was: OH(...)
    }

    this.loadTimeoutTimer?.start();

    if (!shouldPreload) {
      this.playerProxy.get().U.playVideo(2);
    }
  }

  // -----------------------------------------------------------------------
  // onRenderingConfirmed [was: Zu]  (line 77332)
  // -----------------------------------------------------------------------

  /**
   * Confirmed rendering: stops load timer, sets up cue range for
   * completion detection, grabs ad CPN.
   *
   * [was: Zu]
   */
  onRenderingConfirmed() { // was: Zu
    this.loadTimeoutTimer?.stop();
    this.setupCompletionCueRange(); // was: this.zi()

    this.adCpn = getMediaInfo(this.mediaInfoProvider.get(), 2)?.clientPlaybackNonce || '';
    if (!this.adCpn) logWarning('Media layout confirmed started, but ad CPN not set.');

    notifyExternalApi(this.notifyComplete.get(), 'onAdStart', this.adCpn); // was: b1(this.mG.get(), "onAdStart", this.adCpn)
    this.startTimeMs = Date.now();
  }

  /** Returns ad media duration in ms. [was: Tj] */
  getDurationMs() {
    return getMediaInfo(this.mediaInfoProvider.get(), 2)?.totalDurationMs; // was: mX(this.cA.get(), 2)?.TN
  }

  /** Fires clickthrough viewability event. [was: MU] */
  onClickthrough() { // was: MU
    this.viewabilityController.fireViewabilityEvent('clickthrough');
  }

  // -----------------------------------------------------------------------
  // onLayoutExit [was: D5]  (line 77345)
  // -----------------------------------------------------------------------

  /**
   * Initiates layout exit: validates, transitions to "rendering_stop_requested",
   * stops timers, re-enables seeking.
   *
   * [was: D5]
   */
  onLayoutExit(layout, exitReason) { // was: D5(Q, c)
    this.validateLayout(layout, () => {
      if (this.renderState === 'rendering_stop_requested') return;
      this.renderState = 'rendering_stop_requested';
      this.layoutExitReason = exitReason;
      handleExitTransition(this, exitReason); // was: Ou0(this, c)
      this.loadTimeoutTimer?.stop();
      this.preloadTimer?.stop();
      setAllowSeeking(this.playerApi.get(), true); // was: TWx(this.Ca.get(), !0)
      if (this.shrunkenPlayerBytesConfig?.shouldRequestShrunkenPlayerBytes) {
        this.playerApi.get().requestShrunkenPlayerBytes(false); // was: this.Ca.get().m5(!1)
      }
    });
  }

  // -----------------------------------------------------------------------
  // onCueRangeEnter  (line 77357)
  // -----------------------------------------------------------------------

  /**
   * SSDAI cue range entry: fires the "complete" quartile when the player
   * reaches the cue-range sentinel near the ad's end.
   *
   * [was: onCueRangeEnter]
   */
  onCueRangeEnter(cueRangeId) { // was: onCueRangeEnter(Q)
    if (cueRangeId !== this.cueRangeId) {
      logWarning('Received CueRangeEnter signal for unknown layout.', this.getSlot(), this.getLayout(), {
        cueRangeId,
      });
      return;
    }

    this.cueRangeManager.get().removeCueRange(this.cueRangeId);
    this.cueRangeId = undefined;

    const videoLengthSec = this.getLayout().clientMetadata.readTimecodeScale('metadata_type_video_length_seconds');
    const accumulatedMs = this.mediaInfoRef.get().getAccumulatedWatchTime()?.accumulatedWatchTimeMillis || -1;
    const isSeekable = this.layout.renderingContent?.isSeekableWithNoAdElements; // was: g.l(this.layout.renderingContent, Tu)?.isSeekableWithNoAdElements

    if (!isSeekable || accumulatedMs >= videoLengthSec * 1000 - 500) {
      this.onProgress(videoLengthSec, true);
    }

    this.fireTrackingEvent('complete');
  }

  // -----------------------------------------------------------------------
  // onExitReasonHandled [was: lF]  (line 77366)
  // -----------------------------------------------------------------------

  /**
   * Post-exit cleanup: notifies external API of ad complete / end.
   * [was: lF]
   */
  onExitReasonHandled(exitReason) { // was: lF(Q)
    if (exitReason !== 'abandoned') {
      notifyExternalApi(this.notifyComplete.get(), 'onAdComplete');
    }
    notifyExternalApi(this.notifyComplete.get(), 'onAdEnd', this.adCpn);
  }

  /**
   * Extended onLayoutExited: resets deferred callbacks for seekable content.
   * [was: onLayoutExited override in l87]
   */
  onLayoutExited(slot, layout, exitReason) { // was: onLayoutExited(Q, c, W)
    if (layout.layoutId !== this.layout.layoutId) return;

    super.onLayoutExited(slot, layout, exitReason);

    if (this.layout.renderingContent?.isSeekableWithNoAdElements) {
      this.confirmRenderingStart = deferOnce(() => {
        this.callback.onLayoutEnter(this.slot, this.layout);
      });
      this.handleCompletion = deferOnce(() => {
        this.finalizeExit();
      });
    }
  }

  /**
   * Registers a cue range sentinel at maxint to detect ad completion.
   * [was: zi]
   */
  setupCompletionCueRange() { // was: zi
    this.cueRangeId = `adcompletioncuerange:${this.getLayout().layoutId}`;
    this.cueRangeManager.get().addCueRange(
      this.cueRangeId,
      0x7FFFFFFFFFFFF,    // start: max safe int
      0x8000000000000,    // end: max safe int + 1
      false,              // was: !1
      this,
      2,
      2,
    );
  }

  /** No-op cue range exit. */
  onCueRangeExit() {}

  // -----------------------------------------------------------------------
  // onContentProgress [was: oR]  (line 77386)
  // -----------------------------------------------------------------------

  /**
   * Progress callback from the content player. Handles shrunken player
   * bytes and SSDAI accumulated-watch-time based progress.
   *
   * [was: oR]
   */
  onContentProgress(currentTimeSec) { // was: oR(Q)
    if (this.renderState !== 'rendering') return;

    // Shrunken player bytes activation
    if (this.shrunkenPlayerBytesConfig?.shouldRequestShrunkenPlayerBytes) {
      if (currentTimeSec >= (this.shrunkenPlayerBytesConfig.playerProgressOffsetSeconds || 0)) {
        this.playerApi.get().requestShrunkenPlayerBytes(true);
      }
    }

    const isSeekable = this.layout.renderingContent?.isSeekableWithNoAdElements;
    if (isSeekable) {
      const accumulatedMs = this.mediaInfoRef.get().getAccumulatedWatchTime()?.accumulatedWatchTimeMillis || -1;
      if (accumulatedMs > 0) {
        this.onProgress(accumulatedMs / 1000);
      }
    } else {
      this.onProgress(currentTimeSec);
    }
  }

  // -----------------------------------------------------------------------
  // onProgress override [was: dB override in l87]  (line 77391)
  // -----------------------------------------------------------------------

  /**
   * Extended progress handler that adds NKD (Network Key Detection) anomaly
   * checking on top of base quartile tracking.
   *
   * Every 5 seconds of ad progress, checks if real elapsed time is
   * suspiciously low compared to reported media time (< 40% ratio),
   * which indicates a timing anomaly.
   *
   * [was: dB override in l87]
   */
  onProgress(currentTimeSec, forceFlush = false) { // was: dB(Q, c=!1)
    super.onProgress(currentTimeSec, forceFlush);

    const wallClockElapsed = Date.now() - this.startTimeMs;  // was: c = Date.now() - this.IK
    const mediaTimeMs = currentTimeSec * 1000;                // was: W = Q * 1E3
    const metadata = {
      contentCpn: this.getContentCpn(),
      adCpn: getMediaInfo(this.mediaInfoProvider.get(), 2)?.clientPlaybackNonce || '',
    };

    if (currentTimeSec - this.lastReportedSec >= 5) { // was: Q - this.dh >= 5
      const anomalyFlag = wallClockElapsed < mediaTimeMs * 0.4 ? 0 : 1; // was: K = c < W * .4 ? 0 : 1
      reportTelemetry(anomalyFlag, 'n.k_', {
        metadata,
        wallClockMs: wallClockElapsed, // was: SU
        mediaSec: Math.floor(mediaTimeMs / 1000), // was: RB
      });
      reportTelemetryBucket('NKDSTAT', anomalyFlag); // was: y$("NKDSTAT", K)

      // Check if abnormality detection should trigger
      let isAbnormal = anomalyFlag === 0;
      if (isAbnormal) {
        const slotMeta = this.getSlot().clientMetadata.readTimecodeScale('metadata_type_player_bytes_slot_metadata');
        if (slotMeta === undefined) {
          logWarning('PlayerBytesSlotMetadata is not filled', this.getSlot(), this.getLayout());
        }
        isAbnormal = slotMeta?.isAbnormalityDetectionEnabled === true; // was: c = c?.pI === !0
      }

      if (isAbnormal) {
        notifyExternalApi(this.notifyComplete.get(), 'onAbnormalityDetected');
      }

      this.lastReportedSec = currentTimeSec;
    }
  }

  /**
   * Internal player state change handler.
   * [was: aq]
   */
  onPlayerStateChangeInternal(event) { // was: aq(Q)
    if (this.renderState === 'not_rendering') return;

    const stateChange = normalizeStateChange(this, event);
    const isAdPlayer = this.playerApi.get().getPresentingPlayerType() === 2;

    if (this.renderState === 'rendering_start_requested') {
      if (isAdPlayer && isPlaybackStarted(stateChange)) {
        this.confirmRenderingStart();
      }
    } else if (!isAdPlayer || stateChange.hasFlag(2)) {
      this.handleCompletion();
    } else {
      handleAdPlaybackState(this, stateChange);
    }
  }
}

// ---------------------------------------------------------------------------
// CompositeVodLayoutRenderingAdapter [was: kZn]  (line 77424)
// ---------------------------------------------------------------------------

/**
 * Composite VOD adapter that manages a pod of sub-layout adapters
 * (e.g. multiple ads in a break). Delegates lifecycle events to the
 * currently-active sub-adapter and handles sequential advancement.
 *
 * [was: kZn]
 *
 * @property {Array}  subAdapters         List of sub-layout adapters [was: v1]
 * @property {number} activeSubIndex      Index of the current sub-adapter (-1 = none) [was: Yi]
 * @property {boolean} isAutoAdvanceEnabled [was: jQ]
 * @property {boolean} isExiting           Whether a composite exit is in progress [was: IE]
 * @property {boolean} canSkip             [was: kK]
 */
export class CompositeVodLayoutRenderingAdapter extends Disposable { // was: kZn
  constructor(callback, mediaInfoProvider, streamDataManager, playerProxy,
              playerApi, cueRangeManager, timelineManager, layoutEventRouter,
              slot, layout, podIndexInfo, skipCallback, activeSlotTracker, experimentConfig) {
    super();
    this.callback = callback;                // was: Q
    this.mediaInfoProvider = mediaInfoProvider; // was: c (cA)
    this.streamDataManager = streamDataManager; // was: W (G7)
    this.playerProxy = playerProxy;           // was: m (LX)
    this.playerApi = playerApi;               // was: K (Ca)
    this.cueRangeManager = cueRangeManager;   // was: T (Kr)
    this.timelineManager = timelineManager;   // was: r (D7)
    this.layoutEventRouter = layoutEventRouter; // was: U (XK)
    this.slot = slot;                          // was: I
    this.layout = layout;                      // was: X
    this.podIndexInfo = podIndexInfo;          // was: A (PG)
    this.skipCallback = skipCallback;          // was: e (Pb)
    this.activeSlotTracker = activeSlotTracker; // was: V (xx)
    this.experimentConfig = experimentConfig;  // was: B (QC)

    this.canAutoAdvance = true;  // was: this.jQ = !0 -> true
    this.isExiting = false;      // was: this.IE = !1 -> false
    this.subAdapters = [];       // was: this.v1 = []
    this.activeSubIndex = -1;    // was: this.Yi = -1
    this.canSkip = false;        // was: this.kK = !1 -> false
  }

  /** Returns the parent slot. [was: It] */
  getSlot() { return this.slot; }

  /** Returns the composite layout. [was: fO] */
  getLayout() { return this.layout; }

  /** No-op. [was: wE] */
  onSlotEvent() {}

  /**
   * Initialises sub-adapters, registers them with the layout event router.
   * [was: init]
   */
  init() {
    const controlsRef = this.getLayout().clientMetadata.readTimecodeScale('metadata_type_player_bytes_layout_controls_callback_ref');
    if (controlsRef) controlsRef.current = this;

    if (this.subAdapters.length < 1) {
      throw new InvalidStateError('Invalid sub layout rendering adapter length when scheduling composite layout.', {
        length: String(this.subAdapters.length),
      });
    }

    const skipTargetRef = this.getLayout().clientMetadata.readTimecodeScale('metadata_type_ad_pod_skip_target_callback_ref');
    if (skipTargetRef) skipTargetRef.current = this;

    for (const adapter of this.subAdapters) {
      adapter.init();
      registerLayoutScheduled(this.layoutEventRouter, this.slot, adapter.getLayout()); // was: LuR(...)
      registerLayoutWatcher(this.layoutEventRouter, this.slot, adapter.getLayout());    // was: wGR(...)
    }
  }

  /**
   * Releases all sub-adapters and clears callback refs.
   * [was: release]
   */
  release() {
    const controlsRef = this.getLayout().clientMetadata.readTimecodeScale('metadata_type_player_bytes_layout_controls_callback_ref');
    if (controlsRef) controlsRef.current = null;

    const skipTargetRef = this.getLayout().clientMetadata.readTimecodeScale('metadata_type_ad_pod_skip_target_callback_ref');
    if (skipTargetRef) skipTargetRef.current = null;

    for (const adapter of this.subAdapters) {
      // Unregister layout watchers
      for (const observer of this.layoutEventRouter.observers) { // was: Q.O
        observer.onLayoutUnscheduled(this.slot, adapter.getLayout()); // was: K.zH(c, W)
      }
      adapter.release();
    }
  }

  // Delegated lifecycle events to active sub-adapter

  /** [was: Mm] */
  onLayoutEnter(slot, layout) { this.getActiveSubAdapter()?.onLayoutEnter(slot, layout); }

  /** [was: onLayoutExited] */
  onLayoutExited(slot, layout, exitReason) {
    if (layout.layoutId === this.getLayout().layoutId) {
      this.isExiting = false;
      removeActiveSlot(this.activeSlotTracker(), this); // was: u1(this.xx(), this)
    }
    this.getActiveSubAdapter()?.onLayoutExited(slot, layout, exitReason);
  }

  /** [was: oR] */
  onContentProgress(currentTimeSec) { this.getActiveSubAdapter()?.onContentProgress(currentTimeSec); }

  /** [was: onFullscreenToggled] */
  onFullscreenToggled(isFullscreen) { this.getActiveSubAdapter()?.onFullscreenToggled(isFullscreen); }

  /** [was: onVolumeChange] */
  onVolumeChange() { this.getActiveSubAdapter()?.onVolumeChange(); }

  // Stub no-ops [was: Jy, Rr, nU, vI, gH, HG, N6, Vh, yh, zH, SB, HN, sE]
  onAutonavChange() {}
  onSlotScheduled() {}
  onSlotUnscheduled() {}
  onSlotFulfilled() {}
  onSlotEntered() {}
  onSlotExited() {}
  onLayoutScheduled() {}
  onLayoutUnscheduled() {}
  onLayoutEnterEvent() {}
  onLayoutExitEvent() {}
  onOpportunity() {}
  onPlayerUnderlayChange() {}
  onSafeBrowse() {}

  /**
   * Returns the currently active sub-adapter, or null.
   * [was: S7(this)]
   * @private
   */
  getActiveSubAdapter() {
    if (this.activeSubIndex >= 0 && this.activeSubIndex < this.subAdapters.length) {
      return this.subAdapters[this.activeSubIndex];
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// SingleVodLayoutRenderingAdapter [was: pY3]  (line 77598)
// ---------------------------------------------------------------------------

/**
 * Single-layout VOD rendering adapter. Wraps a single inner adapter (e.g.
 * TimerBasedVodLayoutAdapter or PlayerBytesMediaLayoutAdapter) and manages
 * player state transitions around it.
 *
 * [was: pY3]
 */
export class SingleVodLayoutRenderingAdapter extends Disposable { // was: pY3
  constructor(callback, playerProxy, playerApi, timelineManager,
              innerAdapter, activeSlotTracker, experimentConfig) {
    super();
    this.callback = callback;                   // was: Q
    this.playerProxy = playerProxy;             // was: c (LX)
    this.playerApi = playerApi;                 // was: W (Ca)
    this.timelineManager = timelineManager;     // was: m (D7)
    this.innerAdapter = innerAdapter;           // was: K (hj)
    this.activeSlotTracker = activeSlotTracker; // was: T (xx)
    this.experimentConfig = experimentConfig;   // was: r (QC)
    this.canAutoAdvance = true;  // was: this.jQ = !0
    this.isExiting = false;      // was: this.IE = !1
  }

  getSlot() { return this.innerAdapter.getSlot(); }   // was: It -> hj.It()
  getLayout() { return this.innerAdapter.getLayout(); } // was: fO -> hj.fO()

  init() {
    const ref = this.getLayout().clientMetadata.readTimecodeScale('metadata_type_player_bytes_layout_controls_callback_ref');
    if (ref) ref.current = this;
    this.innerAdapter.init();
  }

  release() {
    const ref = this.getLayout().clientMetadata.readTimecodeScale('metadata_type_player_bytes_layout_controls_callback_ref');
    if (ref) ref.current = null;
    this.innerAdapter.release();
  }

  onPause() { this.innerAdapter.onPause(); }     // was: Tk -> hj.Tk()
  onResume() { this.innerAdapter.onResume(); }    // was: yX -> hj.yX()

  onSkipRequested(slot, layout) { // was: Xc
    logWarning(
      'Unexpected onSkipRequested from PlayerBytesVodSingleg.il.  Skip should be handled by Triggers',
      this.getSlot(), this.getLayout(),
      { requestingSlot: slot, requestingLayout: layout },
    );
  }

  startRendering(layout) { // was: startRendering(Q)
    if (layout.layoutId !== this.getLayout().layoutId) {
      this.callback.reportError(this.getSlot(), layout,
        new AdError(
          `Tried to start rendering an unknown layout, this adapter requires LayoutId: ${this.getLayout().layoutId}and LayoutType: ${this.getLayout().layoutType}`,
          undefined, 'ADS_CLIENT_ERROR_MESSAGE_UNKNOWN_LAYOUT'),
        'ADS_CLIENT_ERROR_TYPE_ENTER_LAYOUT_FAILED');
      return;
    }

    this.playerApi.get().addListener(this);
    addActiveSlot(this.activeSlotTracker(), this); // was: l1(this.xx(), this)
    initializeTimeline(this.timelineManager.get());  // was: E$_(this.D7.get())
    if (!isJoinMode(this.experimentConfig.get())) {
      pauseContent(this.playerApi.get()); // was: pH(this.Ca.get())
    }
    this.innerAdapter.startRendering(layout);
  }

  /** [was: D5] */
  onLayoutExit(layout, exitReason) {
    this.isExiting = true;
    this.innerAdapter.onLayoutExit(layout, exitReason);
    this.playerApi.get().U.cancelPendingMediaLoads(); // was: Mf()
    loadAdVideo(this.playerProxy.get(), {});           // was: OH(this.LX.get(), {})

    const contentPlayer = getPlayerByType(this.playerApi.get(), 1); // was: lY(this.Ca.get(), 1)
    if (contentPlayer.isPaused() && !contentPlayer.hasFlag(2)) {
      this.playerApi.get().playVideo();
    }
    this.playerApi.get().removeListener(this);
    if (this.isExiting) {
      this.innerAdapter.requestExit(); // was: this.hj.y6()
    }
  }

  onLayoutEnter(slot, layout) { this.innerAdapter.onLayoutEnter(slot, layout); }
  onLayoutExited(slot, layout, exitReason) {
    if (layout.layoutId === this.getLayout().layoutId) {
      this.isExiting = false;
      removeActiveSlot(this.activeSlotTracker(), this);
    }
    this.innerAdapter.onLayoutExited(slot, layout, exitReason);
    if (layout.layoutId === this.getLayout().layoutId) {
      finalizeTimeline(this.timelineManager.get()); // was: dQ(this.D7.get())
    }
  }
  onContentProgress(sec) { this.innerAdapter.onContentProgress(sec); }
  onFullscreenToggled(fs) { this.innerAdapter.onFullscreenToggled(fs); }
  onPlayerResize(size) { this.innerAdapter.onPlayerResize(size); }
  onSizeChanged(size) { this.innerAdapter.onSizeChanged(size); }
  onVolumeChange() { this.innerAdapter.onVolumeChange(); }

  // Player state change
  ong.tS(event) { // was: Wc
    if (event.state.isError()) {
      this.onError(event.state.errorDetails?.NetworkErrorCode,
        new AdError('There was a player error during this media layout.', {
          playerErrorCode: event.state.errorDetails?.NetworkErrorCode,
        }, 'ADS_CLIENT_ERROR_MESSAGE_PLAYER_ERROR'),
        'ADS_CLIENT_ERROR_TYPE_ENTER_LAYOUT_FAILED');
    } else {
      this.innerAdapter.ong.tS(event);
    }
  }

  onError(code, error, category) { this.innerAdapter.onLayoutError(code, error, category); } // was: Wd -> hj.fp

  // Stub no-ops
  onAutonavChange() {}
  onSlotScheduled() {}
  onSlotUnscheduled() {}
  onSlotFulfilled() {}
  onSlotEntered() {}
  onSlotExited() {}
  onLayoutScheduled() {}
  onLayoutUnscheduled() {}
  onLayoutEnterEvent() {}
  onLayoutExitEvent() {}
  onOpportunity() {}
  onPlayerUnderlayChange() {}
  onSafeBrowse() {}
}

// ---------------------------------------------------------------------------
// DaiLayoutRenderingAdapter [was: IWR]  (line 77709)
// ---------------------------------------------------------------------------

/**
 * Base adapter for DAI (Dynamic Ad Insertion) / server-stitched ad layouts.
 *
 * Unlike VOD adapters, DAI layouts are defined by enter/exit timestamps in
 * the content stream, with drift recovery and prefetch metadata support.
 *
 * [was: IWR]
 *
 * @property {number|null} driftRecoveryMs  Drift recovery offset [was: driftRecoveryMs]
 * @property {boolean}     hasPrefetch      Whether prefetch metadata exists [was: j]
 */
export class DaiLayoutRenderingAdapter { // was: IWR
  constructor(callback, slot, layout, mediaInfoProvider, streamDataManager,
              daiManager, playerApi, viewabilityController, adBreakCoordinator, telemetryManager) {
    this.callback = callback;                      // was: Q
    this.slot = slot;                              // was: c
    this.layout = layout;                          // was: W
    this.mediaInfoProvider = mediaInfoProvider;     // was: m (cA)
    this.streamDataManager = streamDataManager;    // was: K (G7)
    this.daiManager = daiManager;                  // was: T (ZE)
    this.playerApi = playerApi;                    // was: r (Ca)
    this.viewabilityController = viewabilityController; // was: U (VC)
    this.adBreakCoordinator = adBreakCoordinator;  // was: I (hJ)
    this.telemetryManager = telemetryManager;      // was: X (J)

    this.driftRecoveryMs = this.layout.clientMetadata.readTimecodeScale('metadata_type_drift_recovery_ms') || null;
    this.hasPrefetch = this.layout.clientMetadata.readTimecodeScale('metadata_type_prefetch_metadata') !== undefined; // was: this.j
  }

  getSlot() { return this.slot; }   // was: It
  getLayout() { return this.layout; } // was: fO

  /**
   * Initialises the DAI adapter: sets up cue ranges and reports filled ad
   * duration via telemetry.
   * [was: init]
   */
  init() {
    this.daiManager.get().addListener(this);
    this.playerApi.get().addListener(this);

    let enterMs = this.layout.clientMetadata.readTimecodeScale('metadata_type_layout_enter_ms');
    let exitMs = this.layout.clientMetadata.readTimecodeScale('metadata_type_layout_exit_ms');

    // Adjust for prefetch segments
    if (this.hasPrefetch) {
      const lastSegment = this.daiManager.get().segments.slice(-1)[0]; // was: pf.slice(-1)[0]
      if (lastSegment !== undefined) {
        enterMs = lastSegment.startSecs * 1000;
        exitMs = (lastSegment.startSecs + lastSegment.durationSec) * 1000; // was: cJ
      }
    }

    this.setupCueRanges(enterMs, exitMs); // was: this.C4(Q, c)

    const contentCpn = this.mediaInfoProvider.get().contentSession?.clientPlaybackNonce; // was: oY?.clientPlaybackNonce
    const adClientData = this.layout.adClientDataEntry; // was: Je.adClientDataEntry

    reportDaiState(this.adBreakCoordinator.get(), {
      daiStateTrigger: {
        filledAdsDurationMs: exitMs - enterMs,
        contentCpn,
        adClientData,
      },
    });

    // Check for shorter cue duration
    const shorterDuration = computeShorterCueDuration(this.daiManager.get().timeline, enterMs, exitMs); // was: cBX(K.A, Q, c)
    if (shorterDuration !== null) {
      reportDaiState(this.adBreakCoordinator.get(), {
        daiStateTrigger: {
          filledAdsDurationMs: shorterDuration - enterMs,
          contentCpn,
          cueDurationChange: 'DAI_CUE_DURATION_CHANGE_SHORTER',
          adClientData,
        },
      });
      this.streamDataManager.get().adjustExitTime(shorterDuration, exitMs); // was: XR(K, c)
    }
  }

  release() {
    this.teardownCueRanges(); // was: this.jT()
    this.daiManager.get().removeListener(this);
    this.playerApi.get().removeListener(this);
  }

  startRendering() {
    this.prepareRendering();                                    // was: this.LT()
    this.callback.onLayoutEnter(this.slot, this.layout); // was: this.callback.Mm(...)
  }

  /**
   * Exit: handles drift recovery logging, then fires onLayoutExited.
   * [was: D5]
   */
  onLayoutExit(layout, exitReason) { // was: D5(Q, c)
    this.onExitCleanup(exitReason); // was: this.D(c)

    if (this.driftRecoveryMs !== null) {
      logDriftRecovery(this, {
        driftRecoveryMs: this.driftRecoveryMs.toString(),
        breakDurationMs: Math.round(getBreakExitMs(this) - this.layout.clientMetadata.readTimecodeScale('metadata_type_layout_enter_ms')).toString(),
        driftFromHeadMs: Math.round(this.playerApi.get().U.getSecondsFromLiveHead() * 1000).toString(), // was: UN()
      });
      this.driftRecoveryMs = null;
    }

    this.callback.onLayoutExited(this.slot, this.layout, exitReason);
  }

  /** Returns false (DAI does not support forced exit). [was: f$] */
  supportsForcedExit() { return false; }

  // Stub no-ops
  onPlayerResize() {}
  onAutonavChange() {}
  onSizeChanged() {}
  onVolumeChange() {}
  onPlayerUnderlayChange() {}
  onSafeBrowse() {}
}

// ---------------------------------------------------------------------------
// DaiCompositeLayoutAdapter [was: XHO]  (line 77832)
// ---------------------------------------------------------------------------

/**
 * DAI composite adapter that manages multiple sub-media-layouts within a
 * server-stitched ad break, including survey overlay tracking.
 *
 * [was: XHO]
 */
export class DaiCompositeLayoutAdapter extends DaiLayoutRenderingAdapter { // was: XHO
  constructor(callback, slot, layout, mediaInfoProvider, streamDataManager,
              daiManager, playerApi, viewabilityController, adBreakCoordinator,
              telemetryManager, subAdapters) {
    super(callback, slot, layout, mediaInfoProvider, streamDataManager,
          daiManager, playerApi, viewabilityController, adBreakCoordinator, telemetryManager);

    this.subAdapters = subAdapters;      // was: this.A
    this.activeSubLayout = null;         // was: this.W
    this.surveyLayoutId = null;          // was: this.O

    for (const adapter of this.subAdapters) {
      if (hasMetadata(adapter.getLayout().clientMetadata, 'metadata_type_survey_overlay')) {
        this.surveyLayoutId = adapter.getLayout().layoutId;
      }
    }
  }

  // ... (delegates to active sub-layout)
}

// ---------------------------------------------------------------------------
// SsdaiSubLayoutMediaAdapter [was: At_]  (line 77899)
// ---------------------------------------------------------------------------

/**
 * SSDAI (Server-Side DAI) sub-layout media adapter that manages individual
 * media sub-layouts within a DAI composite break.
 *
 * Handles timeline playback ID management, Active View registration,
 * SSDAI duration calculation on exit, and cue-range-based completion.
 *
 * [was: At_]
 *
 * @property {Object|null} renderingState  Internal rendering state `{ lastProgressSec, isFirstStateChange }` [was: pX -> { M7, KT }]
 * @property {string|undefined} adCpn      Ad CPN for SSDAI macro data [was: adCpn]
 * @property {boolean} wasSkipped          Whether this sub-layout was skipped [was: W]
 */
export class SsdaiSubLayoutMediaAdapter { // was: At_
  constructor(callback, slot, layout, streamDataManager, viewabilityController,
              playerApi, daiTimelineManager, activeViewManager, sodarProvider,
              experimentConfig, adBreakCoordinator, mediaInfoProvider,
              cueRangeManager, commandExecutor) {
    this.callback = callback;                          // was: Q
    this.slot = slot;                                  // was: c
    this.layout = layout;                              // was: W
    this.streamDataManager = streamDataManager;        // was: m (G7)
    this.viewabilityController = viewabilityController; // was: K (VC)
    this.playerApi = playerApi;                        // was: T (Ca)
    this.daiTimelineManager = daiTimelineManager;      // was: r (s$)
    this.activeViewManager = activeViewManager;        // was: U (lX)
    this.sodarProvider = sodarProvider;                 // was: I (cG)
    this.experimentConfig = experimentConfig;          // was: X (QC)
    this.adBreakCoordinator = adBreakCoordinator;      // was: A (hJ)
    this.mediaInfoProvider = mediaInfoProvider;         // was: e (cA)
    this.cueRangeManager = cueRangeManager;            // was: V (KX)
    this.commandExecutor = commandExecutor;            // was: B (r3)

    this.canAutoAdvance = true;   // was: this.QV = !0
    this.renderingState = null;   // was: this.PJ = this.pX = null
    this.adCpn = undefined;       // was: this.adCpn = void 0
    this.wasSkipped = false;       // was: this.W = !1

    // Progress commands handler
    const progressCommands = this.layout.clientMetadata
      .readTimecodeScale('METADATA_TYPE_INTERACTIONS_AND_PROGRESS_LAYOUT_COMMANDS')?.progressCommands || [];
    this.progressCommandHandler = new ProgressCommandHandler( // was: new yR(...)
      commandExecutor,
      progressCommands,
      layout.layoutId,
      () => this.layout.clientMetadata.readTimecodeScale('metadata_type_video_length_seconds') * 1000,
    );
  }

  getSlot() { return this.slot; }
  getLayout() { return this.layout; }

  /**
   * Starts rendering: fires "start" event, sets up Active View timers,
   * dispatches layout entered commands.
   * [was: startRendering]
   */
  startRendering() {
    if (hasMetadata(this.layout.clientMetadata, 'metadata_type_survey_overlay')) {
      logTelemetry(this.adBreakCoordinator.get(), 'ads_ssmlra_srs', `lid.${this.layout.layoutId}`);
    }

    if (this.renderingState) {
      logWarning('Expected the layout not to be entered before start rendering', this.slot, this.layout);
      return;
    }

    this.renderingState = {
      lastProgressSec: null,      // was: M7: null
      isFirstStateChange: false,  // was: KT: !1
    };
    this.wasSkipped = false;

    // Grab ad CPN for SSDAI if enabled
    if (isSsdaiEnabled(this.experimentConfig.get())) {
      this.adCpn = getMediaInfo(this.mediaInfoProvider.get(), 2)?.clientPlaybackNonce;
    }

    // Sodar registration (unless disabled for TV HTML5)
    if (!this.experimentConfig.get().U.G().experiments.SG('html5_disable_sodar_for_tvhtml5')) {
      registerSodarForLayout(this.slot, this.layout, this.sodarProvider.get()); // was: o37(...)
    }

    // Active View
    if (hasViewability(this.layout.viewabilityConfig)) { // was: fQ(this.layout.zy)
      startActiveViewTracking(this.activeViewManager.get(), this.layout.layoutId); // was: PMn(...)
    }

    this.viewabilityController.fireTrackingEvent('start');

    // Set up Active View timers (if enabled)
    if (isActiveViewEnabled(this.experimentConfig.get())) {
      const contentPlayer = getPlayerByType(this.playerApi.get());
      const videoLengthSec = this.layout.clientMetadata.readTimecodeScale('metadata_type_video_length_seconds');
      const currentSec = getCurrentTimeSec(this.playerApi.get(), 2, false);
      setupActiveViewTimers(
        this.viewabilityController,
        this.renderingState.lastProgressSec,
        contentPlayer,
        videoLengthSec,
        currentSec,
        () => void logSsdaiTelemetry(this, 'teois'),
        getMediaInfo(this.mediaInfoProvider.get(), 1).contentStreamId, // was: E7
      );
    }

    notifyLayoutEntered(this.callback, this.slot, this.layout); // was: bZO(...)

    // Cue range setup for completion detection
    if (isCueRangeCompletionEnabled(this.experimentConfig.get())) {
      if (!this.adCpn) logWarning('Media layout confirmed started, but ad CPN not set.');
      this.setupCompletionCueRange();
    }
  }

  // -----------------------------------------------------------------------
  // onLayoutExit [was: D5]  (line 78008)
  // -----------------------------------------------------------------------

  /**
   * SSDAI sub-layout exit: calculates elapsed duration via timeline
   * playback ID, fires forced quartile if needed, logs SSDAI macro data.
   *
   * [was: D5]
   */
  onLayoutExit(layout, exitReason) { // was: D5(Q, c)
    if (!this.renderingState) {
      logWarning('Expected the layout to be entered before stop rendering', this.slot, this.layout);
      return;
    }

    if (isActiveViewEnabled(this.experimentConfig.get())) {
      if (this.timelinePlaybackId === null) { // was: this.PJ === null
        logWarning('Unexpected media sub layout exited without a timeline playback ID');
      } else {
        const videoLengthSec = this.layout.clientMetadata.readTimecodeScale('metadata_type_video_length_seconds');
        const elapsedSec = getElapsedFromTimeline(this.playerApi.get(), this.timelinePlaybackId); // was: cX(...)

        if (isSsdaiEnabled(this.experimentConfig.get()) && this.adCpn === undefined) {
          logWarning('Expected ad CPN in SSDAI macro data', this.slot, this.layout, {
            contentCpn: this.layout.clientMetadata.readTimecodeScale('metadata_type_content_cpn'),
          });
        }

        setAdCpnMacro(this.viewabilityController, elapsedSec, this.adCpn); // was: NC7(...)
        finalizeActiveView(
          this.viewabilityController,
          null,
          this.renderingState.lastProgressSec,
          videoLengthSec,
          elapsedSec,
          getMediaInfo(this.mediaInfoProvider.get(), 1).contentStreamId,
          (m) => void logSsdaiMacro(this, m, 'fue'),
          isSsdaiEnabled(this.experimentConfig.get()),
          isCueRangeCompletionEnabled(this.experimentConfig.get()),
        );

        // Force final progress flush
        if (isForcedQuartileEnabled(this.experimentConfig.get())) {
          this.onProgress(elapsedSec, true);
        }
      }
    }

    this.renderingState = null;

    // Determine exit reason (override to "skipped" if applicable)
    const effectiveReason = this.wasSkipped &&
      this.experimentConfig.get().U.G().X('dai_layout_log_skip_exit_reason')
      ? 'skipped'
      : exitReason;

    signalSubLayoutExited(this.callback, this.slot, this.layout, effectiveReason); // was: gd7(...)
  }

  // -----------------------------------------------------------------------
  // onCueRangeEnter  (line 78028)
  // -----------------------------------------------------------------------

  /**
   * SSDAI cue range entry: fires "complete" event when the player reaches
   * the end-of-ad sentinel cue range.
   *
   * [was: onCueRangeEnter]
   */
  onCueRangeEnter(cueRangeId) { // was: onCueRangeEnter(Q)
    if (cueRangeId !== this.cueRangeId) {
      logWarning('Received CueRangeEnter signal for unknown layout.', this.getSlot(), this.getLayout(), {
        cueRangeId,
      });
      return;
    }

    if (this.adCpn === undefined) {
      logWarning('Expected ad CPN in SSDAI macro data', this.slot, this.layout, {
        contentCpn: this.layout.clientMetadata.readTimecodeScale('metadata_type_content_cpn'),
      });
    }

    if (hasTracked(this.viewabilityController, 'impression') && isActiveViewEnabled(this.experimentConfig.get())) {
      if (this.timelinePlaybackId === null) {
        logWarning('Unexpected cue range enter without a timeline playback ID');
      } else {
        const elapsedSec = getElapsedFromTimeline(this.playerApi.get(), this.timelinePlaybackId);
        logTelemetry(
          this.adBreakCoordinator.get(),
          'ads_ccre',
          `cpn.${this.layout.clientMetadata.qM('metadata_type_content_cpn')};acpn.${getMediaInfo(this.mediaInfoProvider.get(), 2)?.clientPlaybackNonce};cr.${cueRangeId};cts.${elapsedSec}`,
        );

        this.cueRangeManager.get().removeCueRange(this.cueRangeId);
        this.cueRangeId = undefined;

        if (isForcedQuartileEnabled(this.experimentConfig.get())) {
          this.onProgress(elapsedSec, true);
        }

        this.viewabilityController.fireTrackingEvent('complete');
      }
    }
  }

  onCueRangeExit() {}
  onLayoutError() {} // was: fp
  requestExit() {}   // was: y6

  /**
   * Reports progress for SSDAI sub-layout.
   * [was: onProgress / dB on At_]
   */
  onProgress(currentTimeSec, forceFlush = false) { // was: dB
    if (this.renderingState) {
      flushProgressCommands(this.progressCommandHandler, currentTimeSec * 1000, forceFlush);
    }
  }

  /**
   * Registers a completion cue range for SSDAI.
   * [was: zi]
   */
  setupCompletionCueRange() {
    if (!this.cueRangeId) {
      this.cueRangeId = `adcompletioncuerange:${this.getLayout().layoutId}`;
      this.cueRangeManager.get().addCueRange(
        this.cueRangeId,
        0x7FFFFFFFFFFFF,
        0x8000000000000,
        false,
        this,
        2,
        2,
        this.adCpn,
      );
      logTelemetry(
        this.adBreakCoordinator.get(),
        'ads_ccr',
        `acpn.${getMediaInfo(this.mediaInfoProvider.get(), 2)?.clientPlaybackNonce};cr.${this.cueRangeId}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// AdPodInfo [was: rP]  (line 78689)
// ---------------------------------------------------------------------------

/**
 * Computed information about the current ad's position in a pod (ad break).
 *
 * [was: rP]
 *
 * @property {number} adPodIndex                     0-based index in the pod
 * @property {number} adBreakLengthSeconds            Total pod duration
 * @property {number} adBreakRemainingLengthSeconds   Duration remaining after this ad
 */
export class AdPodInfo { // was: rP
  constructor(adPodIndex, adDurations) { // was: constructor(Q, c)
    this.adPodIndex = adPodIndex;
    this.totalAdsInPod = adDurations.length; // was: this.W = c.length
    this.adBreakLengthSeconds = adDurations.reduce((sum, d) => sum + d, 0);

    let remaining = 0;
    for (let i = adPodIndex + 1; i < adDurations.length; i++) {
      remaining += adDurations[i];
    }
    this.adBreakRemainingLengthSeconds = remaining;
  }
}
