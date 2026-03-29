/**
 * Ad Slot Adapters
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~78500-79540
 *
 * Slot adapters sit between the ad scheduling system and the player,
 * managing CSS class toggling (ytp-ad-showing, ytp-ad-interrupting),
 * player pause/resume around ad breaks, and live-stream seek-back
 * after ad interruptions.
 *
 * Also includes:
 *   - Layout adapter factories for desktop, embedded, remix, and unplugged
 *   - Survey slot/adapter support
 *   - Ad info hover handler (pause-on-hover)
 */

// ---------------------------------------------------------------------------
// Imports (conceptual)
// ---------------------------------------------------------------------------
import { Disposable } from '../core/disposable.js';     // was: g.qK
import { AdError } from '../core/errors.js';              // was: oe / z
import { InvalidStateError } from '../core/errors.js';    // was: z
import { logWarning } from '../core/errors.js';           // was: v1
import { matchesMetadata } from './ad-metadata.js';       // was: MP
import { stringifyMetadata } from './ad-metadata.js';     // was: O5
import { matchesSlot } from './ad-slot-utils.js';         // was: fr
import { ComponentDescriptor } from '../data/idb-operations.js'; // was: CP
import { LayoutRenderingAdapter } from '../ui/cue-manager.js'; // was: il
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { pauseVideo } from '../player/player-events.js';
import { dispose, seekTo } from './dai-cue-range.js';
import { addClass, removeClass } from '../core/dom-utils.js';
import { isAtLiveHead } from '../player/time-tracking.js';
import { getCurrentTimeSec } from '../player/playback-bridge.js';

// ---------------------------------------------------------------------------
// AdInfoHoverHandler [was: j9]  (line 78512)
// ---------------------------------------------------------------------------

/**
 * Pauses the video when the user hovers over the ad-info button and
 * resumes it when they leave. Tracks whether the player was already
 * paused before the hover to avoid double-resuming.
 *
 * [was: j9]
 *
 * @property {boolean} wasAlreadyPaused  True if the player was paused before hover [was: W]
 */
export class AdInfoHoverHandler { // was: j9
  /**
   * @param {Object} playerApi  Lazy reference to the player API [was: Ca]
   */
  constructor(playerApi) {
    this.playerApi = playerApi; // was: this.Ca = Q
    this.wasAlreadyPaused = false; // was: this.W = !1
  }

  /**
   * Called when a component is hovered.
   * If it is the ad-info hover button, pauses the video (unless already paused).
   *
   * [was: Wj]
   *
   * @param {string} componentType  e.g. "ad-info-hover-text-button" [was: Q]
   */
  onComponentHover(componentType) { // was: Wj(Q)
    if (componentType === 'ad-info-hover-text-button') {
      this.wasAlreadyPaused = this.playerApi.get().isPlayerPaused(1); // was: this.Ca.get().Ap(1)
      if (!this.wasAlreadyPaused) {
        this.playerApi.get().pauseVideo();
      }
    }
  }

  /**
   * Called when the hover ends. Resumes the video if it was not
   * already paused before the hover.
   *
   * [was: lB]
   */
  onComponentHoverEnd() { // was: lB
    if (!this.wasAlreadyPaused) {
      this.playerApi.get().resumeVideo(1);
    }
  }
}

// ---------------------------------------------------------------------------
// SurveySlot [was: t6W]  (line 78525)
// ---------------------------------------------------------------------------

/**
 * Dedicated slot for survey-type ads. Extends the base content-protection
 * slot with a fixed "survey" type.
 *
 * [was: t6W]
 */
export class SurveySlot /* extends ContentProtectionSlot (ComponentDescriptor) */ { // was: t6W extends CP
  /**
   * @param {Object} renderer  Survey renderer data [was: Q]
   * @param {string} layoutId  Parent layout ID [was: c (via Q)]
   * @param {Object} metadata  Additional slot metadata [was: W (via Q)]
   */
  constructor(renderer, layoutId, metadata) {
    // super("survey", renderer, {}, layoutId, metadata)
    this.slotType = 'survey';
    this.renderer = renderer;
    this.layoutId = layoutId;
    this.adsClientData = metadata;
  }
}

// ---------------------------------------------------------------------------
// AdvancedLayoutAdapter [was: H1W]  (line 78531)
// ---------------------------------------------------------------------------

/**
 * Survey-related layout rendering adapter.
 *
 * Creates a {@link SurveySlot} on start, delegates ad-info icon clicks to
 * the layout controls callback, and handles resize-based dismiss.
 *
 * [was: H1W extends il]
 *
 * @property {Object}   dismissHandler  Reference to the dismiss/expiry handler [was: j]
 * @property {Object}   playerApi       Lazy player API reference [was: Ca]
 * @property {Object}   experimentConfig  Experiment flags [was: QC]
 */
export class AdvancedLayoutAdapter /* extends InlineLayoutAdapter (LayoutRenderingAdapter) */ { // was: H1W
  constructor(slot, layout, callback, errorCallback, dismissHandler, playerApi, experimentConfig) {
    // super(slot, callback, layout, errorCallback)
    this.slot = slot;                    // was: W
    this.layout = layout;                // was: Q (arg reorder)
    this.callback = callback;            // was: c
    this.errorCallback = errorCallback;  // was: m (jt)
    this.dismissHandler = dismissHandler; // was: K (j)
    this.playerApi = playerApi;           // was: T (Ca)
    this.experimentConfig = experimentConfig; // was: r (QC)
    this.surveySlots = [];               // was: this.W (inherited, used as slot list)
  }

  /**
   * Initialises the adapter and subscribes to player events.
   * [was: init]
   */
  init() {
    // super.init()
    this.playerApi.get().addListener(this);
  }

  /**
   * Starts rendering the survey layout: creates a SurveySlot from the
   * valid instream survey renderer metadata, then delegates to super.
   *
   * [was: startRendering]
   */
  startRendering(layout) { // was: startRendering(Q)
    const surveyRenderer = this.layout.clientMetadata.readTimecodeScale(
      'METADATA_TYPE_VALID_INSTREAM_SURVEY_AD_RENDERER_FOR_VOD',
    );

    this.surveySlots.push(new SurveySlot(surveyRenderer, this.layout.layoutId, {
      adsClientData: this.layout.adClientDataEntry, // was: Je
    }));

    // super.startRendering(layout)
    this.callback.onLayoutEnter(this.slot, layout); // was: this.callback.Mm(this.slot, Q)
  }

  /** No-op (survey does not fire Mm externally). [was: Mm] */
  onLayoutEnter() {}

  /**
   * Handles ad-info icon / dialog close clicks to pause/resume the
   * underlying player-bytes layout.
   *
   * [was: Wj]
   *
   * @param {string} componentType  "ad-info-icon-button" | "ad-info-dialog-close-button" [was: Q]
   * @param {string} layoutId       Layout ID to match [was: c]
   */
  onComponentAction(componentType, layoutId) { // was: Wj(Q, c)
    if (layoutId !== this.layout.layoutId) return;
    if (componentType !== 'ad-info-icon-button' && componentType !== 'ad-info-dialog-close-button') return;

    const controlsCallback = this.layout.clientMetadata
      .readTimecodeScale('metadata_type_player_bytes_layout_controls_callback_ref').current;

    if (!controlsCallback) {
      logWarning('Tried to use LayoutControlsCallback on Survey but it is null', this.slot, this.layout, {
        ComponentType: componentType,
      });
      return;
    }

    if (componentType === 'ad-info-icon-button') {
      controlsCallback.onPause(this.slot, this.layout); // was: c.Tk(this.slot, this.layout)
    } else if (componentType === 'ad-info-dialog-close-button') {
      controlsCallback.onResume(this.slot, this.layout); // was: c.yX(this.slot, this.layout)
    }
  }

  /**
   * On resize: dismiss survey if width < 450px.
   * [was: gM]
   */
  onSizeChanged(dimensions) { // was: gM(Q)
    if (dimensions.width < 450) {
      dismissLayout(this.dismissHandler, this.layout); // was: x7(this.j, this.layout)
    }
  }

  // Stub no-ops [was: onVolumeChange, oR, onFullscreenToggled, Qf, Jy, Wc, HN, sE]
  onVolumeChange() {}
  onContentProgress() {}
  onFullscreenToggled() {}
  onPlayerResize() {}
  onAutonavChange() {}
  ong.tS() {}
  onPlayerUnderlayChange() {}
  onSafeBrowse() {}

  /** Cleanup override. [was: WA] */
  dispose() {
    // super.dispose()
  }

  /** Release: remove player listener. [was: release] */
  release() {
    // super.release()
    this.playerApi.get().removeListener(this);
  }
}

// ---------------------------------------------------------------------------
// DesktopInPlayerLayoutAdapterFactory [was: Nz0]  (line 78576)
// ---------------------------------------------------------------------------

/**
 * Factory that creates the appropriate in-player layout rendering adapter
 * for desktop web. Routes to ad-overlay, survey, video-interstitial, or
 * banner adapters based on layout metadata.
 *
 * [was: Nz0]
 */
export class DesktopInPlayerLayoutAdapterFactory { // was: Nz0
  constructor(errorCallback, playerApi, adBreakCoordinator, dismissHandler,
              activeViewManager, layoutRenderer, adInfoRenderer, commandExecutor,
              experimentConfig, daiConfig) {
    this.errorCallback = errorCallback;            // was: jt
    this.playerApi = playerApi;                    // was: Ca
    this.adBreakCoordinator = adBreakCoordinator;  // was: hJ
    this.dismissHandler = dismissHandler;          // was: j
    this.activeViewManager = activeViewManager;    // was: lX
    this.layoutRenderer = layoutRenderer;          // was: O
    this.adInfoRenderer = adInfoRenderer;          // was: A
    this.commandExecutor = commandExecutor;        // was: r3
    this.experimentConfig = experimentConfig;      // was: QC
    this.daiConfig = daiConfig;                    // was: W
  }

  /**
   * Builds the appropriate layout rendering adapter for the given layout.
   *
   * Routing order:
   *   1. Common adapter check (Qc) for shared types
   *   2. ieX() match -> Dxm (ad overlay with hover handler)
   *   3. N_K() match -> n_n (ad overlay without hover handler)
   *   4. Survey renderer -> AdvancedLayoutAdapter
   *   5. Survey text interstitial -> xxn
   *   6. aAO() match -> lA7 (banner layout)
   *
   * [was: build]
   *
   * @throws {AdError} If layout type is unsupported
   */
  build(adapterCallback, _unused, slot, layout) { // was: build(Q, c, W, m)
    // 1. Common adapter
    const common = buildCommonAdapter(adapterCallback, slot, layout, this.errorCallback,
      this.playerApi, this.adBreakCoordinator, this.dismissHandler, this.daiConfig, this.experimentConfig);
    if (common) return common; // was: Qc(...)

    // 2. Ad overlay with ad-info hover
    if (matchesMetadata(layout, getAdOverlayWithInfoMetadata())) { // was: MP(m, ieX())
      return new AdOverlayWithInfoAdapter(
        slot, layout, this.adBreakCoordinator, this.errorCallback, adapterCallback,
        this.layoutRenderer, this.adInfoRenderer, this.playerApi, this.commandExecutor,
        this.experimentConfig, this.daiConfig,
        new AdInfoHoverHandler(this.playerApi), // was: new j9(this.Ca)
      );
    }

    // 3. Ad overlay without hover
    if (matchesMetadata(layout, getAdOverlayMetadata())) { // was: MP(m, N_K())
      return new AdOverlayAdapter(
        slot, layout, this.adBreakCoordinator, this.errorCallback, adapterCallback,
        this.layoutRenderer, this.playerApi, this.commandExecutor,
        this.experimentConfig, this.daiConfig,
        new AdInfoHoverHandler(this.playerApi),
      );
    }

    // 4. Survey
    if (matchesMetadata(layout, {
      requiredMetadata: ['METADATA_TYPE_VALID_INSTREAM_SURVEY_AD_RENDERER_FOR_VOD'], // was: Qz
      requiredLayoutTypes: ['LAYOUT_TYPE_SURVEY'],                                    // was: a8
    })) {
      return new AdvancedLayoutAdapter(
        slot, layout, adapterCallback, this.errorCallback,
        this.layoutRenderer, this.playerApi, this.experimentConfig,
      );
    }

    // 5. Survey text interstitial
    if (matchesMetadata(layout, {
      requiredMetadata: [
        'metadata_type_player_bytes_layout_controls_callback_ref',
        'metadata_type_valid_survey_text_interstitial_renderer',
        'metadata_type_ad_placement_config',
      ],
      requiredLayoutTypes: ['LAYOUT_TYPE_VIDEO_INTERSTITIAL_BUTTONED_LEFT'],
    })) {
      return new SurveyTextInterstitialAdapter(slot, layout, adapterCallback, this.errorCallback, this.adBreakCoordinator); // was: xxn
    }

    // 6. Banner
    if (matchesMetadata(layout, getBannerLayoutMetadata())) { // was: MP(m, aAO())
      return new BannerLayoutAdapter(slot, layout, adapterCallback, this.errorCallback, this.playerApi, this.experimentConfig); // was: lA7
    }

    throw new AdError(
      `Unsupported layout with type: ${layout.layoutType} and client metadata: ${stringifyMetadata(layout.clientMetadata)} in WebDesktopMainInPlayerLayoutRenderingAdapterFactory.`,
    );
  }
}

// ---------------------------------------------------------------------------
// EmbeddedInPlayerLayoutAdapterFactory [was: i1y]  (line 78612)
// ---------------------------------------------------------------------------

/**
 * Factory for embedded player in-player layout adapters.
 * Supports ad overlay types but not survey or banner.
 *
 * [was: i1y]
 */
export class EmbeddedInPlayerLayoutAdapterFactory { // was: i1y
  constructor(errorCallback, playerApi, adBreakCoordinator, dismissHandler,
              activeViewManager, layoutRenderer, adInfoRenderer, commandExecutor,
              experimentConfig, daiConfig) {
    this.errorCallback = errorCallback;
    this.playerApi = playerApi;
    this.adBreakCoordinator = adBreakCoordinator;
    this.dismissHandler = dismissHandler;
    this.activeViewManager = activeViewManager;
    this.layoutRenderer = layoutRenderer;
    this.adInfoRenderer = adInfoRenderer;
    this.commandExecutor = commandExecutor;
    this.experimentConfig = experimentConfig;
    this.daiConfig = daiConfig;
  }

  build(adapterCallback, _unused, slot, layout) { // was: build(Q, c, W, m)
    const common = buildCommonAdapter(adapterCallback, slot, layout, this.errorCallback,
      this.playerApi, this.adBreakCoordinator, this.dismissHandler, this.daiConfig, this.experimentConfig);
    if (common) return common;

    if (matchesMetadata(layout, getAdOverlayWithInfoMetadata())) {
      return new AdOverlayWithInfoAdapter(
        slot, layout, this.adBreakCoordinator, this.errorCallback, adapterCallback,
        this.layoutRenderer, this.adInfoRenderer, this.playerApi, this.commandExecutor,
        this.experimentConfig, this.daiConfig,
        new AdInfoHoverHandler(this.playerApi),
      );
    }

    if (matchesMetadata(layout, getAdOverlayMetadata())) {
      return new AdOverlayAdapter(
        slot, layout, this.adBreakCoordinator, this.errorCallback, adapterCallback,
        this.layoutRenderer, this.playerApi, this.commandExecutor,
        this.experimentConfig, this.daiConfig,
        new AdInfoHoverHandler(this.playerApi),
      );
    }

    throw new AdError(
      `Unsupported layout with type: ${layout.layoutType} and client metadata: ${stringifyMetadata(layout.clientMetadata)} in WebEmbeddedInPlayerLayoutRenderingAdapterFactory.`,
    );
  }
}

// ---------------------------------------------------------------------------
// RemixInPlayerLayoutAdapterFactory [was: SGR]  (line 78652)
// ---------------------------------------------------------------------------

/**
 * Factory for YouTube Music (Remix) player layout adapters.
 * Only supports player-overlay-type layouts.
 *
 * [was: SGR]
 */
export class RemixInPlayerLayoutAdapterFactory { // was: SGR
  constructor(errorCallback, playerApi, adBreakCoordinator, layoutRenderer,
              externalApiProvider, daiConfig, mediaInfoProvider) {
    this.errorCallback = errorCallback;
    this.playerApi = playerApi;
    this.adBreakCoordinator = adBreakCoordinator;
    this.layoutRenderer = layoutRenderer;
    this.externalApiProvider = externalApiProvider; // was: ZU
    this.daiConfig = daiConfig;
    this.mediaInfoProvider = mediaInfoProvider;
  }

  build(adapterCallback, _unused, slot, layout) { // was: build(Q, c, W, m)
    if (matchesMetadata(layout, getPlayerOverlayMetadata()) || // was: SiK()
        (layout.layoutType === 'LAYOUT_TYPE_MEDIA_LAYOUT_PLAYER_OVERLAY' &&
         getRendererContent(layout.renderingContent) !== undefined)) { // was: g.l(m.renderingContent, Re)
      return new RemixPlayerOverlayAdapter(
        adapterCallback, slot, layout, this.errorCallback, this.playerApi,
        this.adBreakCoordinator, this.layoutRenderer, this.externalApiProvider,
        this.daiConfig, this.mediaInfoProvider,
      );
    }

    throw new AdError(
      `Unsupported layout with type: ${layout.layoutType} and client metadata: ${stringifyMetadata(layout.clientMetadata)} in WebRemixInPlayerLayoutRenderingAdapterFactory.`,
    );
  }
}

// ---------------------------------------------------------------------------
// UnpluggedInPlayerLayoutAdapterFactory [was: F$w]  (line 78669)
// ---------------------------------------------------------------------------

/**
 * Factory for YouTube TV (Unplugged) player layout adapters.
 * Supports player-overlay and common adapter types.
 *
 * [was: F$w]
 */
export class UnpluggedInPlayerLayoutAdapterFactory { // was: F$w
  constructor(errorCallback, playerApi, adBreakCoordinator, layoutRenderer,
              externalApiProvider, daiConfig, experimentConfig, mediaInfoProvider) {
    this.errorCallback = errorCallback;
    this.playerApi = playerApi;
    this.adBreakCoordinator = adBreakCoordinator;
    this.layoutRenderer = layoutRenderer;
    this.externalApiProvider = externalApiProvider;
    this.daiConfig = daiConfig;
    this.experimentConfig = experimentConfig;
    this.mediaInfoProvider = mediaInfoProvider;
  }

  build(adapterCallback, _unused, slot, layout) { // was: build(Q, c, W, m)
    if (matchesMetadata(layout, getPlayerOverlayMetadata())) {
      return new RemixPlayerOverlayAdapter(
        adapterCallback, slot, layout, this.errorCallback, this.playerApi,
        this.adBreakCoordinator, this.layoutRenderer, this.externalApiProvider,
        this.daiConfig, this.mediaInfoProvider,
      );
    }

    const common = buildCommonAdapter(adapterCallback, slot, layout, this.errorCallback,
      this.playerApi, this.adBreakCoordinator, this.layoutRenderer, this.daiConfig, this.experimentConfig);
    if (common) return common;

    throw new AdError(
      `Unsupported layout with type: ${layout.layoutType} and client metadata: ${stringifyMetadata(layout.clientMetadata)} in WebUnpluggedInPlayerLayoutRenderingAdapterFactory.`,
    );
  }
}

// ---------------------------------------------------------------------------
// SimpleSlotAdapter [was: sV3]  (line 79425)
// ---------------------------------------------------------------------------

/**
 * Simplest slot adapter: fires entered/exited callbacks with no DOM changes.
 *
 * [was: sV3]
 */
export class SimpleSlotAdapter { // was: sV3
  constructor(callback, slot) {
    this.callback = callback;
    this.slot = slot;
  }

  init() {}

  getSlot() { return this.slot; } // was: It

  /**
   * Slot entry: notifies the callback.
   * [was: e4]
   */
  onSlotEnter() { // was: e4
    this.callback.onSlotEntered(this.slot); // was: this.callback.gH(this.slot)
  }

  /**
   * Slot exit: notifies the callback.
   * [was: z3]
   */
  onSlotExit() { // was: z3
    this.callback.onSlotExited(this.slot); // was: this.callback.HG(this.slot)
  }

  release() {}
}

// ---------------------------------------------------------------------------
// SimpleSlotAdapterFactory [was: hO]  (line 79443)
// ---------------------------------------------------------------------------

/**
 * Factory that creates {@link SimpleSlotAdapter} instances.
 * [was: hO]
 */
export class SimpleSlotAdapterFactory { // was: hO
  build(callback, slot) {
    return new SimpleSlotAdapter(callback, slot);
  }
}

// ---------------------------------------------------------------------------
// DaiSlotAdapter [was: dxX]  (line 79449)
// ---------------------------------------------------------------------------

/**
 * DAI slot adapter: adds the `ytp-ad-showing` CSS class when the
 * ad slot enters, and removes it on exit.
 *
 * [was: dxX]
 */
export class DaiSlotAdapter { // was: dxX
  constructor(callback, slot, playerApi) {
    this.callback = callback;
    this.slot = slot;
    this.playerApi = playerApi; // was: Ca
  }

  init() {}
  getSlot() { return this.slot; }

  /**
   * Slot entry: adds "ad-showing" CSS class and notifies callback.
   * [was: e4]
   */
  onSlotEnter() { // was: e4
    addClass(this.playerApi.get(), 'ad-showing'); // was: kS(this.Ca.get(), "ad-showing")
    this.callback.onSlotEntered(this.slot);
  }

  /**
   * Slot exit: notifies callback, then removes "ad-showing" CSS class.
   * [was: z3]
   */
  onSlotExit() { // was: z3
    this.callback.onSlotExited(this.slot);
    removeClass(this.playerApi.get(), 'ad-showing'); // was: YS(this.Ca.get(), "ad-showing")
  }

  release() {}
}

// ---------------------------------------------------------------------------
// LiveInfraSlotAdapter [was: L$x]  (line 79470)
// ---------------------------------------------------------------------------

/**
 * Slot adapter for live infrastructure ads. Adds both `ytp-ad-showing`
 * and `ytp-ad-interrupting` CSS classes. On exit, seeks the player back
 * to compensate for the ad break duration (or to live head if applicable).
 *
 * [was: L$x]
 *
 * @property {boolean} wasAtLiveHead  Whether the player was at live head on entry [was: O]
 * @property {number}  entryTimeSec   Unix timestamp (seconds) when ad started [was: W]
 */
export class LiveInfraSlotAdapter { // was: L$x
  constructor(callback, slot, playerApi) {
    this.callback = callback;
    this.slot = slot;
    this.playerApi = playerApi;
    this.wasAtLiveHead = false;  // was: this.O = !1
    this.entryTimeSec = 0;       // was: this.W = 0
  }

  init() {}
  getSlot() { return this.slot; }

  /**
   * Slot entry: adds CSS classes, records live-head state and timestamp.
   * [was: e4]
   */
  onSlotEnter() { // was: e4
    addClass(this.playerApi.get(), 'ad-showing');       // was: kS(this.Ca.get(), "ad-showing")
    addClass(this.playerApi.get(), 'ad-interrupting');   // was: kS(this.Ca.get(), "ad-interrupting")
    this.wasAtLiveHead = this.playerApi.get().isAtLiveHead();
    this.entryTimeSec = Math.ceil(Date.now() / 1000);
    this.callback.onSlotEntered(this.slot);
  }

  /**
   * Slot exit: removes CSS classes, seeks to compensate for ad duration.
   *
   * If the player was at live head before the ad, seeks to Infinity.
   * Otherwise, seeks to (original_position + wall_clock_elapsed).
   *
   * [was: z3]
   */
  onSlotExit() { // was: z3
    removeClass(this.playerApi.get(), 'ad-showing');
    removeClass(this.playerApi.get(), 'ad-interrupting');

    const seekTarget = this.wasAtLiveHead
      ? Infinity
      : getCurrentTimeSec(this.playerApi.get(), 1, true) + Math.floor(Date.now() / 1000) - this.entryTimeSec;
    // was: Qd(this.Ca.get(), 1, !0) + Math.floor(Date.now() / 1E3) - this.W

    this.playerApi.get().U.seekTo(seekTarget, undefined, undefined, 1);
    this.callback.onSlotExited(this.slot);
  }

  release() {}
}

// ---------------------------------------------------------------------------
// GenericPlayerBytesSlotAdapter [was: wHW]  (line 79499)
// ---------------------------------------------------------------------------

/**
 * Generic player-bytes slot adapter for VOD ad breaks. Adds both
 * `ytp-ad-showing` and `ytp-ad-interrupting` CSS classes on entry.
 * On exit, cancels all pending loads and removes classes.
 *
 * [was: wHW]
 */
export class GenericPlayerBytesSlotAdapter { // was: wHW
  constructor(callback, slot, playerApi) {
    this.callback = callback;
    this.slot = slot;
    this.playerApi = playerApi;
  }

  init() {}
  getSlot() { return this.slot; }

  /**
   * Slot entry: adds "ad-showing" and "ad-interrupting" CSS classes.
   * [was: e4]
   */
  onSlotEnter() { // was: e4
    addClass(this.playerApi.get(), 'ad-showing');
    addClass(this.playerApi.get(), 'ad-interrupting');
    this.callback.onSlotEntered(this.slot);
  }

  /**
   * Slot exit: cancels pending loads, removes CSS classes.
   * [was: z3]
   */
  onSlotExit() { // was: z3
    this.playerApi.get().cancelAllPendingLoads(); // was: XZ()
    removeClass(this.playerApi.get(), 'ad-showing');
    removeClass(this.playerApi.get(), 'ad-interrupting');
    this.callback.onSlotExited(this.slot);
  }

  /**
   * Release: also cancels pending loads as a safety measure.
   * [was: release]
   */
  release() {
    this.playerApi.get().cancelAllPendingLoads();
  }
}

// ---------------------------------------------------------------------------
// SlotAdapterFactory [was: zo]  (line 79525)
// ---------------------------------------------------------------------------

/**
 * Routes `SLOT_TYPE_PLAYER_BYTES` slots to the appropriate slot adapter:
 *
 *   1. DAI slots (metadata_type_dai)           -> {@link DaiSlotAdapter}
 *   2. Live infra slots (TRIGGER_TYPE_MEDIA_TIME_RANGE entry +
 *      metadata_type_served_from_live_infra)    -> {@link LiveInfraSlotAdapter}
 *   3. Generic player-bytes slots              -> {@link GenericPlayerBytesSlotAdapter}
 *
 * [was: zo]
 */
export class SlotAdapterFactory { // was: zo
  /**
   * @param {Object} playerApi  Lazy player API reference [was: Ca]
   */
  constructor(playerApi) {
    this.playerApi = playerApi; // was: this.Ca = Q
  }

  /**
   * Builds the appropriate slot adapter.
   *
   * [was: build]
   *
   * @param {Object} callback  Slot lifecycle callback [was: Q]
   * @param {Object} slot      The slot descriptor [was: c]
   * @returns {DaiSlotAdapter|LiveInfraSlotAdapter|GenericPlayerBytesSlotAdapter}
   * @throws {InvalidStateError} If the slot type/metadata combination is unsupported
   */
  build(callback, slot) { // was: build(Q, c)
    // 1. DAI
    if (matchesSlot(slot, ['metadata_type_dai'], 'SLOT_TYPE_PLAYER_BYTES')) { // was: fr(c, ["metadata_type_dai"], "SLOT_TYPE_PLAYER_BYTES")
      return new DaiSlotAdapter(callback, slot, this.playerApi);
    }

    // 2. Live infra (entry trigger is TRIGGER_TYPE_MEDIA_TIME_RANGE)
    if (slot.slotEntryTrigger instanceof TimeRelativeMediaTrigger && // was: instanceof vE
        matchesSlot(slot, ['metadata_type_served_from_live_infra'], 'SLOT_TYPE_PLAYER_BYTES')) {
      return new LiveInfraSlotAdapter(callback, slot, this.playerApi);
    }

    // 3. Generic player bytes
    if (matchesSlot(slot, [], 'SLOT_TYPE_PLAYER_BYTES')) { // was: fr(c, [], "SLOT_TYPE_PLAYER_BYTES")
      return new GenericPlayerBytesSlotAdapter(callback, slot, this.playerApi);
    }

    throw new InvalidStateError(
      `Unsupported slot with type ${slot.slotType} and client metadata: ${stringifyMetadata(slot.clientMetadata)} in PlayerBytesSlotAdapterFactory.`,
    );
  }
}
