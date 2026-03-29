import { applyAudioTrackPreference } from './video-loader.js'; // was: gU0
import { EventHandler } from '../core/event-handler.js'; // was: g.db
import { insertAtLayer } from '../ads/ad-click-tracking.js';
import { findIndex } from '../core/array-utils.js';
import { disposeAll, registerDisposable } from '../core/event-system.js';
import { isEmbedWithAudio, isUnpluggedPlatform } from '../data/bandwidth-tracker.js';
import { reportErrorWithLevel } from '../data/gel-params.js';
import { isWebExact } from '../data/performance-profiling.js';
import { BX7, VRn, i_7, xom } from '../data/session-storage.js';
import { ensureTransitionPings } from '../media/source-buffer.js';
import { getAnnotationsModule, getCaptionsModule } from './caption-manager.js';
import { createSubtitlesModuleIfNeeded } from './player-api.js';
import { onVideoDataChange } from './player-events.js';
import { createVideoDataForPlaylistItem } from './video-loader.js';
import { syncFullBleedMode } from './video-loader.js'; // was: du
import { setGridState } from './video-loader.js'; // was: wu
import { initGridEventListeners } from './video-loader.js'; // was: g2n
import { addToOverlayPosition } from '../core/bitstream-helpers.js'; // was: Xr
import { QualityDataModule } from '../media/live-state.js'; // was: aSo
import { CompositeVideoOverlayModule } from '../media/live-state.js'; // was: OmW
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { RemoteConnection } from '../modules/remote/remote-player.js'; // was: xq
import { OfflineActionsModule } from '../media/live-state.js'; // was: fSS
import { PictureInPictureModule } from '../media/live-state.js'; // was: lSH
import { MusicBarUiModule } from '../media/live-state.js'; // was: CDZ
import { MediaSessionMetadataModule } from '../media/live-state.js'; // was: gWm
import { D6DE4VideoBindingModule } from '../media/live-state.js'; // was: $91
import { showSampleSubtitles } from '../modules/caption/caption-internals.js'; // was: u9
import { PlayableSequencesModule } from '../media/live-state.js'; // was: ui1
import { YpcClickwrapOverlayModule } from '../media/live-state.js'; // was: vWS
import { getClientName } from '../data/performance-profiling.js'; // was: cU
import { getExperimentFlags } from './time-tracking.js'; // was: Ty()
import { OnlinePlaybackPositionModule } from '../media/live-state.js'; // was: zo4
import { disposeApp } from './player-events.js'; // was: WA
import { getTimeInBuffer } from '../media/source-buffer.js'; // was: Tm
import { parseKeyValueString } from '../data/idb-transactions.js'; // was: Le
import { buildThumbnailUrl } from '../data/bandwidth-tracker.js'; // was: N8
import { updateToggleButtonState } from '../data/collection-utils.js'; // was: L2
import { shouldLoadCaptionsModule } from './caption-manager.js'; // was: kFO
import { createModule } from './caption-manager.js'; // was: Ro
import { parseQueryString } from '../data/idb-transactions.js'; // was: bk
import { unloadModuleDependencies } from './caption-manager.js'; // was: km
import { hasAdPlacements } from './caption-manager.js'; // was: Ym
import { MetricCondition } from '../data/module-init.js'; // was: X_
import { unwrapTrustedResourceUrl } from '../core/composition-helpers.js'; // was: x3
import { destroyVolatileModules } from './caption-manager.js'; // was: Wv
import { getConfig, getExperimentFlag, listen, safeSetTimeout } from '../core/composition-helpers.js';
import { addClass, removeClass, appendChild } from '../core/dom-utils.js';
import { remove, slice, clear } from '../core/array-utils.js';
import { Disposable } from '../core/disposable.js';
import { getWebPlayerContextConfig } from './player-api.js';
import { isWebRemix, isWebUnplugged } from '../data/performance-profiling.js';
import { dispose } from '../ads/dai-cue-range.js';
import { ObservableTarget } from '../core/event-target.js';
import { toString } from '../core/string-utils.js';
import { getThumbnailUrl } from '../data/collection-utils.js';
// TODO: resolve g.NXK
// TODO: resolve g.xh (sendInfoGel)

// Stub: PlaylistId [was: Rs] — {type, id} pair for playlist identification (base.js ~83947).
// toString() returns type + id (e.g. "UUPLAYER_channelId").
const PlaylistId = Rs; // was: Rs

/**
 * Module initialization, endscreen/suggestion setup, playlist, and feature registration.
 * Source: base.js lines 104001–105499 (skipping 104516–104733, already covered)
 *
 * [was: qs4] FullscreenGridManager — fullscreen grid overlay manager
 * [was: n9v] FreePreviewFeature — free preview heartbeat tracking
 * [was: D$Z] PlayerFeatureBundle — orchestrates all player feature instantiation
 * [was: tf9] TimerPair — simple start/end NaN-resettable pair
 * [was: CG7] PerformanceTimer — CSI-style tick/eX/infoGel timer
 * [was: LMO] PlaylistData — playlist model with shuffle/loop/ordering
 * [was: ao] moduleFileMap — global Map for loaded module files
 * [was: bvn] ModuleManager — lazy-loads JS modules for captions, ads, heartbeat, etc.
 * [was: oow] moduleFileNames — module name → filename mapping
 * [was: Ktw] moduleDependencies — module name → dependency list
 * [was: A8d] allModuleNames — ordered list of all module IDs
 * [was: i9D] IdleTracker — mouse/touch/keyboard idle detection for autohide
 * [was: g.yva] LargePlayButton — the big centered play button overlay
 * [was: g.Ss9] CuedThumbnailOverlay — thumbnail shown in cued state
 * [was: qeX] errorLinkRegex — parses <a href="..."> from error strings
 * [was: g.Fpi] ErrorScreen — error overlay with icon and message
 * [was: Z9a] OverlayPositionedContainer — four-corner overlay container
 * [was: E9a] PaidContentOverlay — "Includes paid promotion" label
 * [was: sc1] SpinnerOverlay — loading spinner with timeout message
 *
 * Class name key:
 *   yT = PlayerFeatureBase — base class for all player features (extends Disposable)
 *   H71 = VisualElementTrackingFeature — VE tracking (createClientVe, logClick, logVisibility)
 *   $vR = AccountLinkingFeature — account linking state and config
 *   BTm = PoTokenFeature — proof-of-origin token management
 *   ry0 = EmbargoFeature — embargo/geo-restriction cue range handling
 *   o91 = StatsForNerdsFeature — video info / stats for nerds
 *   ey1 = PlaybackRateFeature — external playback rate getter/setter
 *   td1 = SphericalPropertiesFeature — 360/VR spherical properties
 *   cy9 = CinematicLightingFeature — ambient/cinematic mode toggle
 *   qO9 = FullerscreenEduFeature — "scroll for details" edu button
 *   DXW = CoursePurchaseOverlayFeature — gated actions overlay for courses
 *   B01 = FreePreviewCountdownFeature — free preview countdown timer display
 *   UX9 = EmbedsConversionTrackingFeature — embeds VE path & conversion tracking
 *   X3a = InnertubeLoggingFeature — innertube CSN/VE interaction logging
 *   IRS = EmbedsShortsFeature — embeds shorts mode API
 *   QWo = AutonavToggleFeature — autoplay/autonav toggle in controls
 *   j0D = ChapterSeekingFeature — chapter seeking with animation, macro markers
 *   m$a = SpeedmasterFeature — long-press speed up (2x) feature
 *   hSR = PmlDebugSignalFeature — PML debug signal reporting
 *   oxi = DrcFeature — dynamic range compression toggle
 *   u9d = LegacyAdTrackingFeature — legacy ad tracking pings (quartiles, engagement)
 *   kaH = ProductOverlayFeature — product overlay display (Roa widget)
 *   Qca = SleepTimerFeature — sleep timer menu
 *   Ay9 = EmbedVisibilityFeature — embed intersection observer setup
 *   Yvm = PlayerSettingsSyncFeature — settings sync (audio format, annotations, etc.)
 */

// === lines 104001–104145: FullscreenGridSuggestionPanel tail (continued from prior file) ===

// lines 104001–104003: tail of prior class method — appending fullscreen grid action button
// (contextual continuation, class boundary already established)

// === lines 104147–104258: FullscreenGridManager [was: qs4] ===

/**
 * Manages the fullscreen grid overlay, including peeking behavior, scroll toggling,
 * quick actions, metadata, and comments/description buttons.
 * [was: qs4]
 */
export class FullscreenGridManager extends PlayerFeatureBase { // was: qs4, yT
  constructor(api) { // was: Q
    super(api);
    this.gridDirection = 0; // was: this.D
    this.currentPanel = 0; // was: this.A
    this.panelWidth = 0; // was: this.W
    this.panelState = null; // was: this.L
    this.scrollTop = 0; // was: this.K
    this.scrollOffset = 0; // was: this.J
    this.isEnded = false; // was: !1
    this.scrollTimeout = null; // was: this.mF
    const events = new EventHandler(api); // was: c
    registerDisposable(this, events);
    this.defaultPeekingPx = getExperimentValue(this.api.getConfig().experiments, "web_player_default_peeking_px"); // was: this.T2
    this.enablePausePeeking = this.api.getExperimentFlag("delhi_modern_player_enable_pause_peeking"); // was: this.Ka
    this.pauseThumbnailPercentage = getExperimentValue(this.api.getConfig().experiments, "delhi_modern_player_pause_thumbnail_percentage"); // was: this.jG
    this.imaxTheaterMode = this.api.getExperimentFlag("web_player_imax_theater_mode"); // was: this.UH
    this.enableFullscreenGrid = this.api.getExperimentFlag("web_player_enable_fullscreen_grid_components"); // was: this.j
    this.enableMoreVideosButton = this.api.getExperimentFlag("web_player_enable_more_videos_button"); // was: this.MM
    this.useExternalGrid = this.api.getExperimentFlag("web_player_use_external_grid_component"); // was: this.Ie
    addClass(this.api.getRootNode(), "ytp-grid-scrollable");

    events.listen(api, "fullscreentoggled", () => {
      syncFullBleedMode(this); // update grid layout
    });
    events.listen(api, "videodatachange", () => {
      if (this.enableFullscreenGrid) {
        const videoData = this.api.getVideoData({ playerType: 1 }); // was: W
        if (this.videoData !== videoData && this.currentPanel === 2) {
          removeClass(this.api.getRootNode(), "ytp-grid-scrolling");
          setGridState(this, 1, "INTERACTION_LOGGING_GESTURE_TYPE_AUTOMATED");
        }
        this.videoData = videoData;
      }
    }, this);
    events.listen(api, "sizestylechange", () => {
      this.enableFullscreenGrid && syncFullBleedMode(this);
    });

    registerApiMethod(this.api, "setFullscreenQuickActions", (actions) => { // was: R()
      this.setFullscreenQuickActions(actions);
    });
    registerApiMethod(this.api, "setPlayerOverlayVideoDetailsRenderer", (renderer) => {
      this.setPlayerOverlayVideoDetailsRenderer(renderer);
    });
    this.useExternalGrid && registerApiMethod(this.api, "setFullscreenGrid", (grid) => {
      this.setFullscreenGrid(grid);
    });
    registerApiMethod(this.api, "setCommentsButton", (btn) => {
      this.setCommentsButton(btn);
    });
    registerApiMethod(this.api, "setDescriptionButton", (btn) => {
      this.setDescriptionButton(btn);
    });
    this.enableFullscreenGrid && initGridEventListeners(this, events, api);
  }

  /** Collapse panel on play area click. [was: PA] */
  onPlayAreaClick() { // was: PA
    this.enableFullscreenGrid && this.currentPanel !== 0 && this.togglePanel("INTERACTION_LOGGING_GESTURE_TYPE_GENERIC_CLICK");
  }

  /** Toggle panel state on scroll/tap. [was: S] */
  togglePanel(gestureType) { // was: S
    if (!this.enableFullscreenGrid) return;
    if (gestureType === "INTERACTION_LOGGING_GESTURE_TYPE_SCROLL_BEGAN_DRAGGING") {
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = window.setTimeout(() => {
        this.scrollTimeout = null;
      }, 1000);
    }
    this.currentPanel === 1 ? setGridState(this, 2, gestureType) : setGridState(this, 1, gestureType);
  }

  setFullscreenGrid(gridElement) { // was: Q
    if (this.useExternalGrid && this.gridPanel) { // was: this.O
      const panel = this.gridPanel; // was: c
      if (panel.useExternalGrid && gridElement !== panel.externalGridElement) { // was: panel.b0, panel.A
        panel.externalGridElement?.remove();
        panel.externalGridElement = gridElement;
        panel.externalGridElement && panel.contentElement.appendChild(panel.externalGridElement);
      }
    }
  }

  setCommentsButton(btn) { // was: Q
    this.gridPanel?.setCommentsButton(btn);
  }

  setDescriptionButton(btn) { // was: Q
    this.gridPanel?.setDescriptionButton(btn);
  }

  setFullscreenQuickActions(actionsEl) { // was: Q
    this.quickActionsElement?.remove(); // was: this.b0
    if (actionsEl) {
      addClass(actionsEl, "ytp-fullscreen-quick-actions");
      if (this.getExperimentFlag("web_player_overlay_positioned_layout")) { // was: this.X()
        actionsEl.setAttribute("data-overlay-order", "13");
        this.api.addToOverlayPosition(actionsEl, 4); // was: this.api.Xr()
      } else {
        addClass(this.api.getRootNode(), "ytp-has-fullscreen-quick-actions");
        insertAtLayer(this.api, actionsEl, 4);
      }
    } else {
      removeClass(this.api.getRootNode(), "ytp-has-fullscreen-quick-actions");
    }
    this.quickActionsElement = actionsEl; // was: this.b0
    syncFullBleedMode(this);
  }

  setPlayerOverlayVideoDetailsRenderer(renderer) { // was: Q
    this.playerOverlayVideoDetailsRenderer?.remove();
    if (renderer) {
      addClass(renderer, "ytp-fullscreen-metadata");
      addClass(this.api.getRootNode(), "ytp-hide-fullscreen-title");
      renderer.setAttribute("data-overlay-order", "1");
      const isBottom = this.api.getExperimentFlag("delhi_modern_web_player_fullscreen_metadata_bottom"); // was: c
      const layer = isBottom ? 3 : 1; // was: W
      const className = isBottom ? "ytp-fullscreen-metadata-bottom" : "ytp-fullscreen-metadata-top"; // was: c reused
      addClass(this.api.getRootNode(), className);
      this.getExperimentFlag("web_player_overlay_positioned_layout") ? this.api.addToOverlayPosition(renderer, layer) : insertAtLayer(this.api, renderer, 4);
    } else {
      removeClass(this.api.getRootNode(), "ytp-hide-fullscreen-title");
      removeClass(this.api.getRootNode(), "ytp-fullscreen-metadata-bottom");
      removeClass(this.api.getRootNode(), "ytp-fullscreen-metadata-top");
    }
    this.playerOverlayVideoDetailsRenderer = renderer;
    syncFullBleedMode(this);
  }
}

// === lines 104260–104285: FreePreviewFeature [was: n9v] ===

/**
 * Tracks free preview watch duration and usage details for heartbeat requests.
 * [was: n9v]
 */
export class FreePreviewFeature extends PlayerFeatureBase { // was: n9v, yT
  constructor(api) { // was: Q
    super(api);
    this.freePreviewWatchedDuration = null;
    this.freePreviewUsageDetails = [];
    this.events = new EventHandler(api);
    registerDisposable(this, this.events);

    this.events.listen(api, "heartbeatRequest", (request) => { // was: B()
      if (this.freePreviewUsageDetails.length || this.freePreviewWatchedDuration !== null) {
        request.heartbeatRequestParams ||= {};
        request.heartbeatRequestParams.unpluggedParams ||= {};
        if (this.freePreviewUsageDetails.length > 0) {
          request.heartbeatRequestParams.unpluggedParams.freePreviewUsageDetails = this.freePreviewUsageDetails;
        } else {
          request.heartbeatRequestParams.unpluggedParams.freePreviewWatchedDuration = {
            seconds: `${this.freePreviewWatchedDuration}`
          };
        }
      }
    });

    registerApiMethod(api, "setFreePreviewWatchedDuration", (duration) => {
      this.freePreviewWatchedDuration = duration;
    });
    registerApiMethod(api, "setFreePreviewUsageDetails", (details) => {
      this.freePreviewUsageDetails = details;
    });
  }
}

// === lines 104287–104356: PlayerFeatureBundle [was: D$Z] ===

/**
 * Master bundle that instantiates all player features (ads, cinematic, sleep timer,
 * autoplay toggle, speed master, media session, DRC, etc.) based on config flags.
 * [was: D$Z]
 */
export class PlayerFeatureBundle extends Disposable { // was: D$Z
  constructor(api) { // was: Q
    super();
    this.features = [];

    // Instantiate each feature conditionally
    const veTrackingFeature = new VisualElementTrackingFeature(api); // was: H71
    const accountLinkingFeature = new AccountLinkingFeature(api); // was: $vR
    const qualityDataFeature = new QualityDataModule(api); // was: aSo
    const poTokenFeature = new PoTokenFeature(api); // was: BTm
    const embargoFeature = isUnpluggedPlatform(api.getConfig()) ? undefined : new EmbargoFeature(api); // was: ry0
    const compositeOverlayFeature = new CompositeVideoOverlayModule(api); // was: OmW
    const statsForNerdsFeature = new StatsForNerdsFeature(api); // was: o91
    const playbackRateFeature = new PlaybackRateFeature(api); // was: ey1
    const sphericalPropsFeature = new SphericalPropertiesFeature(api); // was: td1
    const freePreviewFeature = isUnpluggedPlatform(api.getConfig()) ? new FreePreviewFeature(api) : undefined; // was: n9v
    const cinematicFeature = api.getConfig().getWebPlayerContextConfig()?.cinematicSettingsAvailable ? new CinematicLightingFeature(api) : undefined; // was: cy9
    const fullerscreenEduFeature = new FullerscreenEduFeature(api); // was: qO9
    const coursePurchaseFeature = api.getExperimentFlag("enable_courses_player_overlay_purchase") ? new CoursePurchaseOverlayFeature(api) : undefined; // was: DXW
    const freePreviewCountdownFeature = isWebExact(api.getConfig()) ? new FreePreviewCountdownFeature(api) : undefined; // was: B01
    const embedsConversionFeature = new EmbedsConversionTrackingFeature(api); // was: UX9
    const innertubeLoggingFeature = api.getConfig().j ? new InnertubeLoggingFeature(api) : undefined; // was: X3a
    const embedsShortsFeature = isEmbedWithAudio(api.getConfig()) ? new EmbedsShortsFeature(api) : undefined; // was: IRS
    const autonavToggleFeature = api.getExperimentFlag("web_player_move_autonav_toggle") && api.getConfig().mainVideoEntityActionMetadataKey ? new AutonavToggleFeature(api) : undefined; // was: QWo
    const chapterSeekingFeature = isWebExact(api.getConfig()) ? new ChapterSeekingFeature(api) : undefined; // was: j0D
    const speedmasterFeature = api.getExperimentFlag("web_enable_speedmaster") && isWebExact(api.getConfig()) ? new SpeedmasterFeature(api) : undefined; // was: m$a
    const noRemoteFeature = api.getConfig().RemoteConnection ? undefined : new I7W(api); // was: I7W (non-remote fallback)
    const pmlDebugFeature = api.getExperimentFlag("report_pml_debug_signal") ? new PmlDebugSignalFeature(api) : undefined; // was: hSR
    const offlineActionsFeature = new OfflineActionsModule(api); // was: fSS
    const pipFeature = new PictureInPictureModule(api); // was: lSH
    const musicBarFeature = isWebRemix(api.getConfig()) ? new MusicBarUiModule(api) : undefined; // was: CDZ
    const mediaSessionFeature = navigator.mediaSession && window.MediaMetadata && api.getConfig().OJ ? new MediaSessionMetadataModule(api) : undefined; // was: gWm
    const drcFeature = api.getExperimentFlag("html5_enable_drc") && !api.getConfig().D ? new DrcFeature(api) : undefined; // was: oxi
    const legacyAdTrackingFeature = new LegacyAdTrackingFeature(api); // was: u9d
    const productOverlayFeature = isWebExact(api.getConfig()) ? new ProductOverlayFeature(api) : undefined; // was: kaH
    const videoBindingFeature = new D6DE4VideoBindingModule(api); // was: $91
    const sleepTimerFeature = isWebExact(api.getConfig()) && api.getExperimentFlag("web_sleep_timer") ? new SleepTimerFeature(api) : undefined; // was: Qca
    const embedVisibilityFeature = isEmbedWithAudio(api.getConfig()) ? new EmbedVisibilityFeature(api) : undefined; // was: Ay9
    // api.getExperimentFlag("mweb_debug_sticky_settings"); // flag check only, no feature created
    const settingsSyncFeature = new PlayerSettingsSyncFeature(api); // was: Yvm
    const clipConfigFeature = new Wma(api); // was: Wma (clip config loop range)
    const featureLaD = new LaD(api); // was: LaD
    const sabrSnackbarFeature = api.getExperimentFlag("enable_sabr_snackbar_message") ? new cvi(api) : undefined; // was: cvi
    const timelyActionsFeature = api.getExperimentFlag("web_enable_timely_actions") ? new X0m(api) : undefined; // was: X0m
    const creatorEndscreenFeature = new mXa(api); // was: mXa (creator endscreen visibility)
    const fullscreenGridFeature = api.getConfig()?.getWebPlayerContextConfig()?.enableFullscreenComponentsFeature ? new FullscreenGridManager(api) : undefined; // was: qs4
    const voiceBoostFeature = new VfH(api); // was: VfH (voice boost preference)
    const loopSettingsFeature = api.getExperimentFlag("web_player_loop_settings_menu") && api.getConfig().showSampleSubtitles ? new bmi(api) : undefined; // was: bmi
    const adPlaybackRateFeature = isUnpluggedPlatform(api.getConfig()) ? undefined : new PJ_(api); // was: PJ_ (ad playback rate reset)
    const playableSequencesFeature = new PlayableSequencesModule(api); // was: ui1
    const featureK2O = new k2O(api); // was: k2O
    const ypcClickwrapFeature = new YpcClickwrapOverlayModule(api); // was: vWS
    const featureYkm = new Ykm(api); // was: Ykm
    const delhiModernFeature = (isWebExact(api.getConfig()) || getClientName(api.getConfig()) === "WEB_CREATOR") && api.getConfig().getExperimentFlag("delhi_modern_web_player") ? new KmS(api) : undefined; // was: KmS (Delhi modern UI)
    const featureJ$d = api.getConfig().A ? undefined : new J$d(api); // was: J$d
    const featureKpH = new KpH(api); // was: KpH
    const featuredProductFeature = new e_v(api); // was: e_v (featured product dismiss)

    let experimentFlagsBundle = api.getConfig().getExperimentFlags; // was: GO
    experimentFlagsBundle = experimentFlagsBundle.W.BA(xom) || experimentFlagsBundle.W.BA(BX7) || experimentFlagsBundle.W.BA(VRn) ? new Av1(api) : undefined;

    const onlinePlaybackFeature = api.getConfig().getExperimentFlags.W.BA(g.NXK) ? new OnlinePlaybackPositionModule(api) : undefined; // was: t
    const accumulatedWatchTimeFeature = api.getConfig().experiments.getExperimentFlags.W.BA(i_7) ? new zSx(api) : undefined; // reuses Q

    const allFeatures = [
      veTrackingFeature, accountLinkingFeature, qualityDataFeature, poTokenFeature, embargoFeature, compositeOverlayFeature,
      statsForNerdsFeature, playbackRateFeature, sphericalPropsFeature, freePreviewFeature, cinematicFeature, fullerscreenEduFeature,
      coursePurchaseFeature, freePreviewCountdownFeature, embedsConversionFeature, innertubeLoggingFeature, embedsShortsFeature, autonavToggleFeature,
      chapterSeekingFeature, speedmasterFeature, noRemoteFeature, pmlDebugFeature, offlineActionsFeature, pipFeature,
      musicBarFeature, undefined, mediaSessionFeature, drcFeature, legacyAdTrackingFeature, undefined,
      productOverlayFeature, videoBindingFeature, sleepTimerFeature, embedVisibilityFeature, undefined, settingsSyncFeature,
      clipConfigFeature, featureLaD, undefined, sabrSnackbarFeature, timelyActionsFeature, creatorEndscreenFeature,
      fullscreenGridFeature, voiceBoostFeature, undefined, loopSettingsFeature, undefined, adPlaybackRateFeature,
      playableSequencesFeature, featureK2O, ypcClickwrapFeature, featureYkm, delhiModernFeature, featureJ$d,
      featureKpH, featuredProductFeature, experimentFlagsBundle, undefined, onlinePlaybackFeature, accumulatedWatchTimeFeature,
    ];

    for (const feature of allFeatures) {
      if (feature) this.features.push(feature);
    }
  }

  /** Dispose all features in reverse order. [was: WA] */
  dispose() {
    for (let i = this.features.length - 1; i >= 0; i--) {
      this.features[i].dispose();
    }
    this.features.length = 0;
    super.dispose();
  }
}

// === lines 104358–104365: TimerPair [was: tf9] ===

/** Simple NaN-resettable start/end timer pair. [was: tf9] */
export class TimerPair { // was: tf9
  constructor() {
    this.startTime = NaN; // was: this.O
    this.endTime = NaN; // was: this.W
  }
  reset() {
    this.endTime = this.startTime = NaN;
  }
}

// === lines 104367–104392: PerformanceTimer [was: CG7] ===

/**
 * CSI-style performance timer with tick, getTimeInBuffer, sendTimerEvent, and sendInfoGel methods.
 * [was: CG7]
 */
export class PerformanceTimer { // was: CG7
  constructor(config, parent) { // was: Q, c
    this.FI = config; // was: this.FI = Q
    this.timerName = "";
    this.isStarted = false; // was: this.A = !1
    this.currentTime = NaN; // was: this.O
    this.timerPair = new TimerPair(); // was: new tf9
    this.parentTimer = parent || null; // was: c || null
    this.isStarted = false; // was: !1
  }

  reset() {
    Ar(this.timerName);
  }

  tick(label, value) { // was: Q, c
    Bu(label, value, this.timerName);
  }

  getTimeInBuffer(label) { // was: Q
    return D0(label, undefined, this.timerName); // was: void 0
  }

  sendTimerEvent(label) { // was: eX, Q
    ensureTransitionPings(label, undefined, this.timerName); // was: void 0
  }

  sendInfoGel(payload) { // was: Q
    g.xh(payload, this.timerName);
  }
}

// === lines 104394–104515: PlaylistData [was: LMO] ===

/**
 * Playlist model: manages items, shuffle, loop, index, ordering, and thumbnail URLs.
 * [was: LMO]
 */
export class PlaylistData extends ObservableTarget { // was: LMO
  constructor(config, params) { // was: Q (AJ), c
    super();
    this.playerConfig = config; // was: this.AJ
    this.startSeconds = 0;
    this.shuffle = false; // was: !1
    this.index = 0;
    this.title = "";
    this.length = 0;
    this.items = [];
    this.loaded = false; // was: !1
    this.sessionData = null;
    this.onReadyCallback = null; // was: this.W
    this.dislikes = 0;
    this.likes = 0;
    this.views = 0;
    this.order = [];
    this.author = "";
    this.thumbnailUrls = {}; // was: this.EV
    this.shuffleVersion = 0; // was: this.O

    let sessionParam = params.session_data; // was: Q reuse
    if (sessionParam) this.sessionData = parseKeyValueString(sessionParam, "&");

    this.index = Math.max(0, Number(params.index) || 0);
    this.loop = !!params.loop;
    this.startSeconds = Number(params.startSeconds) || 0;
    this.title = params.playlist_title || "";
    this.description = params.playlist_description || "";
    this.author = params.author || params.playlist_author || "";
    if (params.video_id) this.items[this.index] = params;

    let apiParam = params.api; // was: Q reuse
    if (apiParam) {
      if (typeof apiParam === "string" && apiParam.length === 16) {
        params.list = "PL" + apiParam;
      } else {
        params.playlist = apiParam;
      }
    }

    let listParam = params.list; // was: Q reuse
    if (listParam) {
      switch (params.listType) {
        case "user_uploads":
          this.listId = new PlaylistId("UU", `PLAYER_${listParam}`); // was: new Rs()
          break;
        default: {
          let playlistLength = params.playlist_length; // was: W
          if (playlistLength) this.length = Number(playlistLength) || 0;
          this.listId = k5(listParam);
          const videoList = params.video; // was: W reuse
          if (videoList) {
            this.items = videoList.slice(0);
            this.loaded = true; // was: !0
          }
        }
      }
    } else if (params.playlist) {
      const ids = params.playlist.toString().split(","); // was: Q
      if (this.index > 0) this.items = [];
      for (const id of ids) { // was: W
        if (id) this.items.push({ video_id: id });
      }
      this.length = this.items.length;
      const videoList = params.video; // was: W
      if (videoList) {
        this.items = videoList.slice(0);
        this.loaded = true; // was: !0
      }
    }

    this.setShuffle(!!params.shuffle);
    const suggestedQuality = params.suggestedQuality; // was: W
    if (suggestedQuality) this.quality = suggestedQuality;
    this.thumbnailUrls = PU(params, "playlist_");
    this.thumbnailIds = (params.thumbnail_ids) ? params.thumbnail_ids.split(",") : []; // was: this.A
  }

  hasNext(allowShuffle) { // was: Q
    return this.loop || !!allowShuffle || this.index + 1 < this.length;
  }

  hasPrevious(allowShuffle) { // was: Q
    return this.loop || !!allowShuffle || this.index - 1 >= 0;
  }

  setShuffle(enabled) { // was: Q
    this.shuffle = enabled;
    let currentOrderIndex = this.order && this.order[this.index] != null ? this.order[this.index] : this.index; // was: Q reuse
    this.order = [];
    for (let i = 0; i < this.items.length; i++) { // was: c
      this.order.push(i);
    }
    this.index = currentOrderIndex;
    this.shuffleVersion++;

    if (this.shuffle) {
      const savedIndex = this.order[this.index]; // was: Q
      for (let i = 1; i < this.order.length; i++) { // was: c
        const swapIdx = Math.floor(Math.random() * (i + 1)); // was: W
        const temp = this.order[i]; // was: m
        this.order[i] = this.order[swapIdx];
        this.order[swapIdx] = temp;
      }
      for (let i = 0; i < this.order.length; i++) { // was: c
        if (this.order[i] === savedIndex) this.index = i;
      }
      this.shuffleVersion++;
    }
    this.publish("shuffle");
  }

  /** Get thumbnail URL for playlist. [was: ux] */
  getThumbnailUrl(filename) { // was: Q
    filename = filename || "hqdefault.jpg";
    const cached = this.thumbnailUrls[filename]; // was: c
    if (cached || this.playerConfig.S || filename === "sddefault.jpg" || filename === "hq720.jpg" || filename === "maxresdefault.jpg") {
      return cached;
    }
    if (this.thumbnailIds.length) {
      return buildThumbnailUrl(this.playerConfig, this.thumbnailIds[0], filename);
    }
  }

  findIndex(videoInfo) { // was: Q
    if (videoInfo) {
      const videoId = videoInfo.videoId; // was: Q reuse
      if (!this.items[this.index] || this.items[this.index].video_id !== videoId) {
        for (let i = 0; i < this.items.length; i++) { // was: c
          if (this.items[i].video_id === videoId) {
            this.index = i;
            break;
          }
        }
      }
    }
  }

  onReady(callback) { // was: Q
    this.onReadyCallback = callback;
    if (this.loaded) safeSetTimeout(this.onReadyCallback, 0);
  }

  getPlaylistId() {
    return this.listId ? this.listId.toString() : null;
  }

  /** Get playlist URL. [was: L2] */
  getPlaylistUrl() { // was: L2
    return this.playerConfig.getVideoUrl(createVideoDataForPlaylistItem(this).videoId, this.getPlaylistId());
  }

  dispose() { // was: WA
    this.onReadyCallback = null;
    disposeAll(this.items);
    super.dispose();
  }
}

// === lines 101871-101919: PlayerSettingsSyncFeature [was: Yvm] ===

/**
 * Syncs player settings (audio track preference, annotation visibility,
 * playback rate, etc.) between the player and persistent storage.
 * On "internalaudioformatchange", calls applyAudioTrackPreference to persist the selection.
 * On "annotationvisibility", persists the annotation toggle state.
 * On "videodatachange" with "dataloaded", restores saved preferences.
 * [was: Yvm]
 *
 * Source: base.js lines 101871-101919
 */
export class PlayerSettingsSyncFeature extends PlayerFeatureBase { // was: Yvm
  constructor(api) { // was: Q
    super(api);
    this._isFirstLoad = true; // was: this.W = !0
    const events = new EventHandler(api); // was: c
    registerDisposable(this, events);

    events.listen(api, "internalaudioformatchange", (trackId, mode) => { // was: W, m
      applyAudioTrackPreference(this, trackId, mode); // was: gU0(this, W, m)
    });

    events.listen(api, "annotationvisibility", (visible) => { // was: W
      if (this.api.getExperimentFlag("web_fix_annotations")) {
        persistSettingToStorage(this, (294).toString(), { boolValue: visible }); // was: jbx(this, ...)
      }
    });

    events.listen(api, "videoplayerreset", () => {
      restoreAudioTrackPreference(this); // was: Io(this)
    });

    events.listen(api, "videodatachange", (changeType, videoData) => { // was: W, m
      this.onVideoDataChange(changeType, videoData);
    });
  }

  onVideoDataChange(changeType, videoData) { // was: Q, c
    if (!videoData.T0()) return; // T0() = hasPlayableContent
    if (changeType === "newdata") {
      restoreAudioTrackPreference(this); // was: Io(this)
    }
    if (this._isFirstLoad && changeType === "dataloaded") {
      this._isFirstLoad = false;
      // Load saved settings from storage and apply
      // was: fF(j5(fD(this.api.G(), this.api.getVideoData()?.D()), W => foy(this, W)), () => { this.W = !0 })
      loadSavedSettings(this);
    }
  }

  /** Get saved settings for the current player config. [was: Jj] */
  getSavedSettings() {
    // was: Jj() — reads from storage via g.AI/g.OQ, returns Promise
    if (isStorageAvailable(this.api.getConfig())) {
      const storageKey = getSettingsStorageKey(this.api.getConfig(), this.api.getVideoData()?.D());
      return resolveSettings(readFromStorage(storageKey), (settings) => {
        const container = createSettingsContainer();
        applySettingsToContainer(container, settings);
        return this.api.getSavedSettings(container);
      });
    }
    return resolveSettings(this.api.getSavedSettings());
  }
}

// Stub helpers for settings persistence (actual implementations in video-loader.js)
// was: Io — restore audio track from storage
function restoreAudioTrackPreference(feature) {
  // Delegates to the full implementation in video-loader.js
  // In original: reads persisted track ID from storage and calls applyAudioTrackPreference
}

// was: jbx — persist a single setting key/value
function persistSettingToStorage(feature, key, value) {
  // Persists setting to IDB/localStorage
}

// was: foy — apply all restored settings
function loadSavedSettings(feature) {
  // Loads and applies saved settings on first dataloaded
}

// was: g.AI — check if storage is available for settings
function isStorageAvailable(config) { return true; }

// was: g.OQ — get storage key for config
function getSettingsStorageKey(config, videoDataKey) { return ''; }

// was: j5 — promise chain helper
function resolveSettings(promise, transform) { return promise; }

// was: LF — wrap in resolved promise
function readFromStorage(key) { return Promise.resolve(null); }

// was: GL — create empty settings container
function createSettingsContainer() { return {}; }

// was: $t — apply settings to container
function applySettingsToContainer(container, settings) {}

// === line 104515: Global module file map ===
export const moduleFileMap = new Map(); // was: ao

// === lines 104734–104857: ModuleManager and module tables ===
// (Continuing after already-covered 104516–104733)

// g.Jc.prototype.j = c3(60); — prototype assignment (line 104734)

/**
 * Lazy module loader that manages loading of player sub-modules
 * (captions, ads, heartbeat, annotations, etc.) on demand.
 * [was: bvn]
 */
export class ModuleManager extends Disposable { // was: bvn
  constructor(api, modulePrefix, moduleSuffix = "") { // was: Q, c, W=""
    super();
    this.playerApi = api; // was: this.U
    this.modulePrefix = modulePrefix; // was: this.J = c
    this.moduleSuffix = moduleSuffix; // was: this.j = W
    this.moduleOverrides = {}; // was: this.Bf
    this.moduleParams = {}; // was: this.O
    this.annotationSubscriptions = null; // was: this.A
    this.loadedScripts = new Set(); // was: this.D
    this.eventHandler = new EventHandler(this); // was: this.L
    this.pathAccessors = { // was: this.Rk
      G1F: () => this.modulePrefix,
      Y7M: () => this.moduleSuffix,
    };
    this.deferModules = this.playerApi.getExperimentFlag("web_player_defer_modules"); // was: this.mF
    this.loadedModules = new Map(); // was: this.Cx
    registerDisposable(this, this.eventHandler);
    this.eventHandler.listen(api, "videodatachange", this.onVideoDataChange);
  }

  createSubtitlesModuleIfNeeded() {
    shouldLoadCaptionsModule(this) && createModule(this, "captions");
    return !!getCaptionsModule(this);
  }

  kh() { return this.playerApi.getVideoData().kh(); }
  getQueryString() { return this.playerApi.getVideoData().parseQueryString(); } // was: bk

  /** Load heartbeat module. [was: Y] */
  loadHeartbeatModule() { // was: Y
    const existingHeartbeat = this.loadedModules.get("heartbeat"); // was: Q
    createModule(this, "heartbeat", false, true, this.loadHeartbeatModule); // was: !1, !0
    if (!existingHeartbeat && this.loadedModules.has("heartbeat")) {
      this.playerApi.publish("offlineslatestatechange");
    }
  }

  /** Load annotations module. [was: W] */
  loadAnnotationsModule() { // was: W
    createModule(this, "annotations_module", true, undefined, this.loadAnnotationsModule); // was: !0, void 0
    const annotationsModule = this.loadedModules.get("annotations_module"); // was: Q
    if (annotationsModule) {
      for (const key in this.annotationSubscriptions) {
        if (!this.annotationSubscriptions.hasOwnProperty(key)) continue;
        const eventName = key; // was: W
        annotationsModule.subscribe(eventName, this.annotationSubscriptions[eventName]);
      }
    }
  }

  /** Load ad module. [was: K] */
  loadAdModule() { // was: K
    if (!this.loadedModules.get("ad")) {
      try {
        hasAdPlacements(this) ? createModule(this, "ad", false, true, this.loadAdModule) : unloadModuleDependencies(this, "ad"); // was: !1, !0
      } catch (error) { // was: Q
        unloadModuleDependencies(this, "ad");
        reportErrorWithLevel(error);
      }
    }
  }

  getModuleParams() { return this.moduleParams; } // was: X_

  getSubtitleModuleParams() { // was: N$
    const result = {}; // was: Q
    const captionsModule = getCaptionsModule(this); // was: c
    if (captionsModule) Object.assign(result, captionsModule.getSubtitleModuleParams());
    return result;
  }

  setModuleParams(params, overrides) { // was: Gj, Q, c
    Object.assign(this.moduleParams, params || null);
    Object.assign(this.moduleOverrides, overrides || null);
  }

  getUnpluggedModule() { // was: Vw
    if (isWebUnplugged(this.playerApi.getConfig())) return this.loadedModules.get("unplugged");
  }

  onVideoDataChange() {
    const videoData = this.playerApi.getVideoData(); // was: Q
    if (this.playerApi.getExperimentFlag("enable_wn_infocards") && videoData.unwrapTrustedResourceUrl() && !getAnnotationsModule(this)) {
      this.loadAnnotationsModule();
    }
  }

  dispose() { // was: WA
    super.dispose();
    destroyVolatileModules(this, 1, true); // was: !0
    for (const [moduleName, fileName] of Object.entries(MODULE_FILE_NAMES)) { // was: oow
      const name = moduleName; // was: W
      if (this.loadedScripts.has(fileName)) moduleFileMap.delete(name);
    }
    this.loadedScripts.clear();
  }
}

/** Module name to filename mapping. [was: oow] */
export const MODULE_FILE_NAMES = { // was: oow
  ad: "ad.js",
  annotations_module: "annotations_module.js",
  asmjs: "asmjs.js",
  creatorendscreen: "annotations_module.js",
  embed: "embed.js",
  endscreen: "endscreen.js",
  heartbeat: "heartbeat.js",
  kids: "kids.js",
  remote: "remote.js",
  miniplayer: "miniplayer.js",
  offline: "offline.js",
  captions: "captions.js",
  unplugged: "unplugged.js",
  ux: "ux.js",
  webgl: "webgl.js",
  ypc: "ypc.js",
};
