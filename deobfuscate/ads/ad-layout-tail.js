/**
 * Ad layout continuation after the main renderer.
 * Source: base.js lines 78123–78499
 *
 * Contains:
 * - SingleMediaLayoutRenderingAdapter (ev7) — active-view tracking for single media ad layouts
 * - PlayerBytesLayoutRenderingAdapterFactory (V60) — builds layout adapters for DAI/composite
 * - PlayerBytesVodOnlyLayoutRenderingAdapterFactory (bl) — VOD-only variant
 * - SurveyInterstitialAdComponent (Bzy) / SurveyInterstitialAdapter (xxn)
 * - InVideoOverlayAdComponent (qGd) / InVideoOverlayAdapter (n_n) / ImageOverlayAdapter (Dxm)
 *
 * [was: ev7, V60, bl, Bzy, xxn, $T, qGd, n_n, Dxm]
 */

import { PlayerState } from '../media/codec-tables.js';  // was: g.In
import { onPlayerStateChange } from '../media/source-buffer.js';  // was: g.vI7
import { PlayerStateChange } from '../player/component-events.js';  // was: g.tS
import { executeCommand } from './ad-scheduling.js';  // was: g.xA
import { DaiLayoutRenderingAdapter } from './ad-layout-renderer.js'; // was: IWR
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { registerLidarLayout } from '../player/media-state.js'; // was: uY
import { unregisterLidarLayout } from '../player/media-state.js'; // was: hw
import { reportAdsControlFlowError } from '../data/interaction-logging.js'; // was: v1
import { dispatchSeek } from '../player/playback-state.js'; // was: Y$
import { logVisualElementClicked } from '../data/visual-element-tracking.js'; // was: Ca
import { getPlayerState } from '../player/playback-bridge.js'; // was: lY
import { getCurrentTimeSec } from '../player/playback-bridge.js'; // was: Qd
import { getAdElapsedTime } from '../player/playback-bridge.js'; // was: cX
import { replacePlaylist } from '../player/playback-state.js'; // was: oE
import { registerProvider } from '../network/innertube-config.js'; // was: nL
import { setupRequestHeaders } from '../network/xhr-handler.js'; // was: vx
import { buildThumbnailUrl } from '../data/bandwidth-tracker.js'; // was: N8
import { CallbackEntry } from '../core/composition-helpers.js'; // was: kR
import { findLastHelper } from '../core/polyfills.js'; // was: xx
import { StreamzBatcher } from '../data/event-logging.js'; // was: cG
import { hasMetadataKey } from '../network/uri-utils.js'; // was: jK
import { PingDispatcher } from '../ui/cue-manager.js'; // was: lf
import { SsdaiSubLayoutMediaAdapter } from './ad-layout-renderer.js'; // was: At_
import { DaiCompositeLayoutAdapter } from './ad-layout-renderer.js'; // was: XHO
import { ComponentDescriptor } from '../data/idb-operations.js'; // was: CP
import { LayoutRenderingAdapter } from '../ui/cue-manager.js'; // was: il
import { XmlHttpFactory } from '../core/event-registration.js'; // was: fO
import { normalizeAspectRatio } from '../player/playback-state.js'; // was: Mm
import { buildVp9MimeType } from '../media/codec-detection.js'; // was: Xc
import { disposeApp } from '../player/player-events.js'; // was: WA
import { getBottomOverlayHeight } from '../player/playback-bridge.js'; // was: oSK
import { DoubleFlag } from '../data/session-storage.js'; // was: yW
import { trunc } from '../proto/messages-core.js'; // was: z0
import { registerErrorInfoSupplier } from '../player/media-state.js'; // was: Mz
import { unregisterErrorInfoSupplier } from '../player/media-state.js'; // was: Jw
import { Size } from '../core/math-utils.js';

// ---------------------------------------------------------------------------
// SingleMediaLayoutRenderingAdapter  [was: ev7]
// Extends IWR – handles single-media ad layout lifecycle & active-view pings
// ---------------------------------------------------------------------------
export class SingleMediaLayoutRenderingAdapter extends DaiLayoutRenderingAdapter {
  /**
   * @param {Object} callback       [was: Q]
   * @param {Object} slot           [was: c]
   * @param {Object} layout         [was: W]
   * @param {Object} contentAdapter [was: m]
   * @param {Object} qualityProvider [was: K]
   * @param {Object} activeViewService [was: T]  — this.activeViewService
   * @param {Object} adBreakAdapter [was: r]
   * @param {Object} playerState    [was: U]
   * @param {Object} adPlacementInfo [was: I]
   * @param {Object} adComponentRegistry [was: X]
   * @param {Object} overlayAdService [was: A]  — this.overlayAdService
   * @param {Object} pingDispatcher [was: e]
   * @param {Object} activeViewTracker [was: V]  — this.activeViewTracker
   * @param {Object} featureFlags   [was: B]  — this.featureFlags
   */
  constructor(callback, slot, layout, contentAdapter, qualityProvider,
              activeViewService, adBreakAdapter, playerState, adPlacementInfo,
              adComponentRegistry, overlayAdService, pingDispatcher,
              activeViewTracker, featureFlags) {
    super(callback, slot, layout, contentAdapter, qualityProvider,
          adBreakAdapter, playerState, adPlacementInfo, adComponentRegistry, pingDispatcher);
    this.activeViewService = activeViewService; // was: this.s$
    this.overlayAdService = overlayAdService;   // was: this.cG
    this.activeViewTracker = activeViewTracker; // was: this.lX
    this.featureFlags = featureFlags;           // was: this.QC
    this.timelinePlaybackId = null;             // was: this.PJ
    this.renderState = null;                    // was: this.pX
  }

  /** Called when the layout is set up. [was: C4] */
  onLayoutSetup() {
    this.layout.clientMetadata.readTimecodeScale("metadata_type_player_bytes_callback_ref").current = this;

    const enterMs = this.layout.clientMetadata.readTimecodeScale("metadata_type_layout_enter_ms"); // was: Q
    const exitMs = this.layout.clientMetadata.readTimecodeScale("metadata_type_layout_exit_ms");   // was: c

    this.timelinePlaybackId = T_W(
      this.slot, this.layout,
      this.layout.clientMetadata.readTimecodeScale("metadata_type_player_vars"),
      enterMs, exitMs,
      this.layout.clientMetadata.readTimecodeScale("metadata_type_video_length_seconds") * 1000,
      this.G7.get(), this.activeViewService.get(),
      () => ({
        layoutType: "LAYOUT_TYPE_MEDIA",
        enterMs,
        exitMs,
        adPlacementConfig: this.layout.clientMetadata.readTimecodeScale("metadata_type_ad_placement_config"),
      }),
      this.hJ.get()
    );

    const videoLengthSec = this.layout.clientMetadata.readTimecodeScale("metadata_type_video_length_seconds"); // was: W
    const trafficType = this.layout.clientMetadata.readTimecodeScale("metadata_type_active_view_traffic_type"); // was: m

    if (fQ(this.layout.zy)) {
      registerLidarLayout(this.activeViewTracker.get(), this.layout.layoutId, {
        A8: trafficType,
        Oe: videoLengthSec,
        listener: this,
      });
    }
  }

  /** Teardown. [was: jT] */
  onLayoutTeardown() {
    if (fQ(this.layout.zy)) {
      unregisterLidarLayout(this.activeViewTracker.get(), this.layout.layoutId);
    }
  }

  /** Start rendering the layout. [was: LT] */
  startRendering() {
    if (this.renderState) {
      reportAdsControlFlowError("Expected the layout not to be entered before start rendering", this.slot, this.layout);
    } else {
      this.renderState = { M7: null, KT: false }; // was: {M7: null, KT: !1}
      o37(this.slot, this.layout, this.overlayAdService.get());
      this.VC.dispatchSeek("start");

      if (aE(this.featureFlags.get())) {
        const currentTimeMs = getPlayerState(this.logVisualElementClicked.get()); // was: Q
        const videoLengthSec = this.layout.clientMetadata.readTimecodeScale("metadata_type_video_length_seconds"); // was: c
        const playbackState = getCurrentTimeSec(this.logVisualElementClicked.get(), 2, false); // was: W
        rB0(this.VC, this.renderState.M7, currentTimeMs, videoLengthSec, playbackState,
            () => { D4y(this, "teois"); }, false);
      }
    }
  }

  /** Stop rendering – called on layout exit. [was: D] */
  stopRendering() {
    if (this.renderState) {
      if (aE(this.featureFlags.get())) {
        if (this.timelinePlaybackId === null) {
          reportAdsControlFlowError("Unexpected single media layout exited without a timeline playback ID");
        } else {
          const videoLengthSec = this.layout.clientMetadata.readTimecodeScale("metadata_type_video_length_seconds"); // was: Q
          const currentTimeOffset = getAdElapsedTime(this.logVisualElementClicked.get(), this.timelinePlaybackId); // was: c
          NC7(this.VC, currentTimeOffset);
          Oj(this.VC, null, this.renderState.M7, videoLengthSec, currentTimeOffset, false,
             (state) => { tD_(this, state, "fue"); });
        }
      }
      this.renderState = null;
    } else {
      reportAdsControlFlowError("Expected the layout to be entered before stop rendering", this.slot, this.layout);
    }
  }

  /** Handle player progress tick. [was: K] */
  onProgressTick(currentTime) { // was: Q
    if (this.renderState) {
      if (hI(this.VC, "impression")) {
        const playerTime = getPlayerState(this.logVisualElementClicked.get());         // was: c
        const videoLengthSec = this.layout.clientMetadata.readTimecodeScale("metadata_type_video_length_seconds"); // was: W
        fA(this.VC, playerTime, currentTime, this.renderState.M7, videoLengthSec,
           (state) => { tD_(this, state, "tpaqe"); });
      }
      this.renderState.M7 = currentTime;
    }
  }

  /** Handle player state change. [was: Wc] */
  onPlayerStateChange(stateChange) { // was: Q
    if (this.renderState) {
      if (!aE(this.featureFlags.get()) && !this.renderState.KT) {
        this.renderState.KT = true; // was: !0
        stateChange = new PlayerStateChange(stateChange.state, new PlayerState);
      }
      const videoLengthSec = this.layout.clientMetadata.readTimecodeScale("metadata_type_video_length_seconds"); // was: c
      const playbackState = getCurrentTimeSec(this.logVisualElementClicked.get(), 2, false); // was: W
      gQ(this.VC, this.renderState.M7, stateChange, videoLengthSec, playbackState,
         false, !aE(this.featureFlags.get()),
         () => { D4y(this, "teosc"); });
    }
  }

  onFullscreenToggled(isFullscreen) { U4w(this.VC, isFullscreen); } // was: Q
  MU() { IpW(this.VC); }
  Vm() { XzK(this.VC); }
  replacePlaylist() { AB7(this.VC); }
  registerProvider() { e8O(this.VC); }
  setupRequestHeaders() { VD_(this.VC); }
  buildThumbnailUrl() { B_W(this.VC); }
}

// ---------------------------------------------------------------------------
// PlayerBytesLayoutRenderingAdapterFactory  [was: V60]
// Builds layout rendering adapters for DAI and composite layouts
// ---------------------------------------------------------------------------
export class PlayerBytesLayoutRenderingAdapterFactory {
  constructor(findLastHelper, PG, Pb, cA, G7, logVisualElementClicked, Kr, hJ, s$, ZE, lX, StreamzBatcher, LX, KX, D7, mG, r3, CallbackEntry, QC, W, context) {
    this.findLastHelper = findLastHelper;   this.PG = PG; this.Pb = Pb; this.cA = cA;
    this.G7 = G7;   this.logVisualElementClicked = logVisualElementClicked; this.Kr = Kr; this.hJ = hJ;
    this.s$ = s$;   this.ZE = ZE; this.lX = lX; this.StreamzBatcher = StreamzBatcher;
    this.LX = LX;   this.KX = KX; this.D7 = D7; this.mG = mG;
    this.r3 = r3;   this.CallbackEntry = CallbackEntry; this.QC = QC; this.W = W;
    this.context = context;
  }

  /**
   * Build a layout rendering adapter.
   * @param {Object} callback [was: Q]
   * @param {Object} slotAdapter [was: c]
   * @param {Object} slot [was: W]
   * @param {Object} layout [was: m]
   * @returns {Object|null}
   */
  build(callback, slotAdapter, slot, layout) {
    if (hasMetadataKey(slot.clientMetadata, "metadata_type_dai")) {
      let adPlacementConfig = layout.clientMetadata.readTimecodeScale("metadata_type_ad_placement_config"); // was: K

      // Try single-media layout first
      if (
        MP(layout, {
          Qz: "metadata_type_video_length_seconds metadata_type_player_vars metadata_type_layout_enter_ms metadata_type_layout_exit_ms metadata_type_player_bytes_callback_ref metadata_type_content_cpn".split(" "),
          a8: ["LAYOUT_TYPE_MEDIA"],
        }) &&
        adPlacementConfig !== undefined
      ) {
        const pingContext = new PingDispatcher(layout.zy, this.hJ, adPlacementConfig, layout.layoutId, null);
        const adapter = new SingleMediaLayoutRenderingAdapter(
          callback, slot, layout, this.cA, this.G7, this.s$,
          this.ZE, this.logVisualElementClicked, pingContext, this.hJ, this.StreamzBatcher, this.W, this.lX, this.QC
        );
        if (adapter) return adapter;
      }

      // Try composite layout
      const subLayouts = layout.lj ?? layout.clientMetadata.readTimecodeScale("metadata_type_sub_layouts"); // was: T
      const placementConfig = layout.clientMetadata.readTimecodeScale("metadata_type_ad_placement_config"); // was: r
      if (
        MP(layout, {
          Qz: ["metadata_type_layout_enter_ms", "metadata_type_drift_recovery_ms", "metadata_type_layout_exit_ms"],
          a8: ["LAYOUT_TYPE_COMPOSITE_PLAYER_BYTES"],
        }) &&
        subLayouts !== undefined &&
        placementConfig !== undefined
      ) {
        const mediaAdapters = []; // was: K
        for (const sub of subLayouts) {
          const mediaIndex = sub.clientMetadata.readTimecodeScale("metadata_type_media_sub_layout_index");
          if (
            !MP(sub, {
              Qz: "metadata_type_video_length_seconds metadata_type_player_vars metadata_type_layout_enter_ms metadata_type_layout_exit_ms metadata_type_player_bytes_callback_ref metadata_type_content_cpn".split(" "),
              a8: ["LAYOUT_TYPE_MEDIA"],
            }) ||
            mediaIndex === undefined
          ) {
            return null;
          }
          const pingCtx = new PingDispatcher(sub.zy, this.hJ, placementConfig, sub.layoutId, mediaIndex);
          mediaAdapters.push(
            new SsdaiSubLayoutMediaAdapter(slotAdapter, slot, sub, this.G7, pingCtx, this.logVisualElementClicked, this.s$,
                     this.lX, this.StreamzBatcher, this.QC, this.hJ, this.cA, this.KX, this.r3)
          );
        }
        const compositePing = new PingDispatcher(layout.zy, this.hJ, placementConfig, layout.layoutId);
        return new DaiCompositeLayoutAdapter(callback, slot, layout, this.cA, this.G7, this.ZE, this.logVisualElementClicked, compositePing, this.hJ, this.W, mediaAdapters);
      }

      // No DAI match — fall through
    } else {
      // Non-DAI path
      const adapter = Qx_(callback, slotAdapter, slot, layout,
        this.findLastHelper, this.PG, this.Pb, this.hJ, this.lX, this.StreamzBatcher, this.LX,
        this.cA, this.logVisualElementClicked, this.Kr, this.KX, this.D7, this.mG, this.r3, this.CallbackEntry, this.QC, this.G7, this.context);
      if (adapter) return adapter;
    }

    throw new oe(
      `Unsupported layout with type: ${layout.layoutType} and client metadata: ${O5(layout.clientMetadata)} in PlayerBytesLayoutRenderingAdapterFactory.`
    );
  }
}

// ---------------------------------------------------------------------------
// PlayerBytesVodOnlyLayoutRenderingAdapterFactory  [was: bl]
// ---------------------------------------------------------------------------
export class PlayerBytesVodOnlyLayoutRenderingAdapterFactory {
  constructor(findLastHelper, PG, Pb, hJ, lX, StreamzBatcher, LX, cA, logVisualElementClicked, Kr, KX, D7, mG, r3, CallbackEntry, QC, G7, context) {
    this.findLastHelper = findLastHelper;   this.PG = PG; this.Pb = Pb; this.hJ = hJ;
    this.lX = lX;   this.StreamzBatcher = StreamzBatcher; this.LX = LX; this.cA = cA;
    this.logVisualElementClicked = logVisualElementClicked;   this.Kr = Kr; this.KX = KX; this.D7 = D7;
    this.mG = mG;   this.r3 = r3; this.CallbackEntry = CallbackEntry; this.QC = QC;
    this.G7 = G7;   this.context = context;
  }

  build(callback, slotAdapter, slot, layout) {
    const adapter = Qx_(callback, slotAdapter, slot, layout,
      this.findLastHelper, this.PG, this.Pb, this.hJ, this.lX, this.StreamzBatcher, this.LX,
      this.cA, this.logVisualElementClicked, this.Kr, this.KX, this.D7, this.mG, this.r3, this.CallbackEntry, this.QC, this.G7, this.context);
    if (adapter) return adapter;
    throw new oe(
      `Unsupported layout with type: ${layout.layoutType} and client metadata: ${O5(layout.clientMetadata)} in PlayerBytesVodOnlyLayoutRenderingAdapterFactory.`
    );
  }
}

// ---------------------------------------------------------------------------
// SurveyInterstitialAdComponent [was: Bzy]
// ---------------------------------------------------------------------------
export class SurveyInterstitialAdComponent extends ComponentDescriptor {
  constructor(renderer, pingContext, layoutId, interactionData) {
    super("survey-interstitial", renderer, pingContext, layoutId, interactionData);
  }
}

// ---------------------------------------------------------------------------
// SurveyInterstitialAdapter [was: xxn]
// ---------------------------------------------------------------------------
export class SurveyInterstitialAdapter extends LayoutRenderingAdapter {
  constructor(callback, layout, slot, adComponents, adPingService) {
    super(slot, callback, layout, adComponents);
    this.adPingService = adPingService; // was: this.hJ
    const adPlacementConfig = layout.clientMetadata.readTimecodeScale("metadata_type_ad_placement_config");
    this.pingContext = new PingDispatcher(layout.zy, adPingService, adPlacementConfig, layout.layoutId); // was: this.VC
  }

  startRendering(slotState) { // was: Q
    const pingData = bR(this.pingContext);
    const data = { adsClientData: this.layout.Je };
    this.W.push(new SurveyInterstitialAdComponent(
      this.layout.clientMetadata.readTimecodeScale("metadata_type_valid_survey_text_interstitial_renderer"),
      pingData, this.XmlHttpFactory().layoutId, data
    ));
    super.startRendering(slotState);
    this.callback.normalizeAspectRatio(this.slot, slotState);
  }

  AdHoverTextButtonMetadata(componentId, layoutId) { // was: Q, c
    if (layoutId !== this.layout.layoutId) return;
    if (componentId !== "survey-interstitial" && componentId !== "button") return;
    const callbackRef = this.layout.clientMetadata.readTimecodeScale("metadata_type_player_bytes_layout_controls_callback_ref").current;
    if (callbackRef) {
      callbackRef.buildVp9MimeType(this.slot, this.layout);
    } else {
      reportAdsControlFlowError("Tried to skip SurveyInterstitial but PlayerBytes callback is null");
    }
  }

  disposeApp() { super.disposeApp(); }
}

// ---------------------------------------------------------------------------
// Default overlay size constant [was: $T]
// ---------------------------------------------------------------------------
export const DEFAULT_OVERLAY_SIZE = new Size(320, 63); // was: $T

// ---------------------------------------------------------------------------
// InVideoOverlayAdComponent [was: qGd]
// ---------------------------------------------------------------------------
export class InVideoOverlayAdComponent extends ComponentDescriptor {
  constructor(renderer, pingContext, layoutId, interactionData) {
    super("invideo-overlay", renderer, pingContext, layoutId, interactionData);
    this.interactionLoggingClientData = interactionData;
  }
}

// ---------------------------------------------------------------------------
// InVideoOverlayAdapter [was: n_n]
// ---------------------------------------------------------------------------
export class InVideoOverlayAdapter extends LayoutRenderingAdapter {
  constructor(callback, layout, adPingService, adComponents, slot, layoutExitService,
              playerStateProvider, commandExecutor, featureFlags, overlayState, interactionHandler) {
    super(slot, callback, layout, adComponents);
    this.adPingService = adPingService;             // was: this.hJ = W
    this.layoutExitService = layoutExitService;     // was: this.j = T
    this.playerStateProvider = playerStateProvider; // was: this.Ca = r
    this.commandExecutor = commandExecutor;         // was: this.r3 = U
    this.featureFlags = featureFlags;               // was: this.QC = I
    this.overlayState = overlayState;               // was: this.D = X
    this.interactionHandler = interactionHandler;   // was: this.K = A
    this.pingContext = Hed(layout, adPingService);   // was: this.VC
  }

  oR() {}
  onPlayerStateChange() {} // was: Wc
  onFullscreenToggled() {}

  Qf(shouldExit) { // was: Q
    if (shouldExit) x7(this.layoutExitService, this.layout);
  }

  Jy() {}

  gM(errorInfo) { // was: Q
    const renderer = uf(this.layout);
    if (this.J = PD(errorInfo, getBottomOverlayHeight(this.playerStateProvider.get()))) {
      if (renderer.onErrorCommand) {
        this.commandExecutor.get().executeCommand(renderer.onErrorCommand, this.layout.layoutId);
      }
      x7(this.layoutExitService, this.layout);
    }
  }

  onVolumeChange() {}
  eE() { return this.XmlHttpFactory().layoutId; }
  DoubleFlag() { return this.J; }

  AdHoverTextButtonMetadata(componentId) { // was: Q
    this.interactionHandler.AdHoverTextButtonMetadata(componentId);
    if (componentId === "in_video_overlay_close_button") {
      x7(this.layoutExitService, this.layout);
    }
  }

  S4(componentId) { // was: Q
    if (componentId === "invideo-overlay") {
      x7(this.layoutExitService, this.layout);
    }
  }

  lB() { this.interactionHandler.lB(); }

  startRendering(slotState) {
    super.startRendering(slotState);
    this.callback.normalizeAspectRatio(this.slot, slotState);
    this.overlayState.trunc = this;
  }

  D5(slot, layout) {
    super.D5(slot, layout);
    HX(this.overlayState, this);
  }

  init() {
    super.init();
    registerErrorInfoSupplier(this.adPingService.get(), this);
    this.playerStateProvider.get().addListener(this);
    this.W.push(new InVideoOverlayAdComponent(
      uf(this.layout), bR(this.pingContext), this.layout.layoutId,
      { adsClientData: this.layout.Je }
    ));
  }

  release() {
    super.release();
    this.playerStateProvider.get().removeListener(this);
    unregisterErrorInfoSupplier(this.adPingService.get(), this);
  }

  HN() {}
  sE() {}
}

// ---------------------------------------------------------------------------
// ImageOverlayAdapter [was: Dxm]
// Overlay adapter for image-based in-video overlays
// ---------------------------------------------------------------------------
export class ImageOverlayAdapter extends LayoutRenderingAdapter {
  constructor(callback, layout, adPingService, adComponents, slot, layoutExitService,
              timerService, playerStateProvider, commandExecutor, featureFlags,
              overlayState, interactionHandler) {
    super(slot, callback, layout, adComponents);
    this.adPingService = adPingService;             // was: this.hJ = W
    this.layoutExitService = layoutExitService;     // was: this.j = T
    this.timerService = timerService;               // was: this.L = r
    this.playerStateProvider = playerStateProvider; // was: this.Ca = U
    this.commandExecutor = commandExecutor;         // was: this.r3 = I
    this.featureFlags = featureFlags;               // was: this.QC = X
    this.overlayState = overlayState;               // was: this.D = A
    this.interactionHandler = interactionHandler;   // was: this.K = e
    this.pingContext = Hed(layout, adPingService);   // was: this.VC
  }

  init() {
    super.init();
    registerErrorInfoSupplier(this.adPingService.get(), this);
    this.playerStateProvider.get().addListener(this);
    this.W.push(new InVideoOverlayAdComponent(
      uf(this.layout), bR(this.pingContext), this.layout.layoutId,
      { adsClientData: this.layout.Je }
    ));
  }

  lB() { this.interactionHandler.lB(); }

  startRendering(slotState) {
    super.startRendering(slotState);
    this.callback.normalizeAspectRatio(this.slot, slotState);
    this.overlayState.trunc = this;
  }

  D5(slot, layout) {
    super.D5(slot, layout);
    HX(this.overlayState, this);
  }

  AdHoverTextButtonMetadata(componentId) { // was: Q
    this.interactionHandler.AdHoverTextButtonMetadata(componentId);
    if (componentId === "in_video_overlay_close_button") {
      x7(this.layoutExitService, this.layout);
    }
  }

  /** Pause timers when overlay is hidden. [was: e5] */
  onOverlayHidden(componentId) { // was: Q
    if (componentId === "invideo-overlay") {
      const timers = fMR(this.timerService, this.layout);
      for (const timer of timers) timer.stop();
    }
  }

  S4(componentId) { // was: Q
    if (componentId === "invideo-overlay") {
      x7(this.layoutExitService, this.layout);
    }
  }

  /** Resume timers when overlay is shown. [was: Tc] */
  onOverlayShown(componentId) { // was: Q
    if (componentId === "invideo-overlay") {
      const timers = fMR(this.timerService, this.layout);
      for (const timer of timers) timer.start();
    }
  }

  oR() {}
  onPlayerStateChange() {} // was: Wc
  onFullscreenToggled() {}

  Qf(shouldExit) {
    if (shouldExit) x7(this.layoutExitService, this.layout);
  }

  Jy() {}

  gM(errorInfo) { // was: Q
    const renderer = uf(this.layout);
    const imageRenderer = renderer.contentSupportedRenderer.imageOverlayAdContentRenderer;
    if (this.J = PD(errorInfo, getBottomOverlayHeight(this.playerStateProvider.get()), yBn(imageRenderer.image))) {
      if (renderer.onErrorCommand) {
        this.commandExecutor.get().executeCommand(renderer.onErrorCommand, this.layout.layoutId);
      }
      x7(this.layoutExitService, this.layout);
    }
  }

  onVolumeChange() {}
  eE() { return this.XmlHttpFactory().layoutId; }
}
