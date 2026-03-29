import { dispose } from '../ads/dai-cue-range.js';
import { ThrottleTimer } from '../core/bitstream-helpers.js';
import { wrapWithErrorReporter } from '../core/dom-listener.js';
import { registerDisposable } from '../core/event-system.js';
import { isEmbedWithAudio } from '../data/bandwidth-tracker.js';
import { requiresNativeControls } from '../data/device-context.js';
import { pubsubSubscribe, pubsubUnsubscribe } from '../data/gel-core.js';
import { attachVisualElement, createVeFromTrackingParams, getClientScreenNonce, getRootVisualElement } from '../data/gel-params.js';
import { sendRequest } from '../data/idb-transactions.js';
import { batchHideVisualElements, batchShowVisualElements, logClick } from '../data/visual-element-tracking.js';
import { setGlobalCrop, setInternalSize } from './player-api.js';
import { getPlayerSize } from './time-tracking.js';
import { isKnownBrowserVersion } from '../core/bitstream-helpers.js'; // was: G5
import { SIGNAL_INTERNAL } from '../data/session-storage.js'; // was: uZ
import { CONSTRUCTOR_GUARD } from '../proto/messages-core.js'; // was: hd
import { BASE64_WEBSAFE_REPLACE } from '../proto/messages-core.js'; // was: J4
import { buildTimeRangeEntryTrigger } from '../ads/slot-id-generator.js'; // was: S5
import { parseInstreamVideoAdRenderer } from '../ads/companion-layout.js'; // was: oL
import { setDatasetVersion } from './playback-mode.js'; // was: e2w
import { updateNextVideoButton } from '../ui/progress-bar-impl.js'; // was: YZ
import { bindTemplateEvents } from './playback-state.js'; // was: Bd7
import { updateVideoControls } from './playback-state.js'; // was: hL
import { globalEventBuffer } from '../data/module-init.js'; // was: rM
import { isAndroidChrome } from '../core/composition-helpers.js'; // was: Nt
import { layoutVideoContainer } from './playback-state.js'; // was: ngK
import { onVideoDataChange } from './player-events.js'; // was: Qq
import { AdVideoClickthroughMetadata } from '../ads/ad-interaction.js'; // was: ux
import { isSafariVersioned } from '../core/composition-helpers.js'; // was: wL
import { androidVersion } from '../data/device-platform.js'; // was: UA
import { parseAspectRatio } from '../core/composition-helpers.js'; // was: a2
import { validateSlotTriggers } from '../ads/ad-scheduling.js'; // was: er
import { getNativeVideoAspectRatio } from './playback-state.js'; // was: qC0
import { computeVideoFitSize } from './playback-state.js'; // was: xc7
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { graftVisualElement } from '../ads/ad-async.js'; // was: k7
import { getClientFacingManager } from '../ads/ad-async.js'; // was: Mr
import { createClientScreen } from '../ads/ad-async.js'; // was: Rm
import { updateVisualElementCSN } from './playback-state.js'; // was: tcy
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { sendWorkerTimingRequest } from './playback-state.js'; // was: ivR
import { SlotIdFulfilledEmptyTrigger } from '../ads/ad-trigger-types.js'; // was: Zg
import { getOrCreateRandomBuffer } from './playback-state.js'; // was: Ndm
import { getBgeServiceWorkerKey } from '../network/uri-utils.js'; // was: t1
import { currentSdkType } from '../data/module-init.js'; // was: t3
import { remove } from '../core/array-utils.js';
import { addClass, removeNode, toggleClass } from '../core/dom-utils.js';
import { isWebEmbeddedPlayer } from '../data/performance-profiling.js';
import { updateVideoData } from '../features/autoplay.js';
import { getVideoAspectRatio } from './playback-mode.js';
import { getExperimentBoolean } from '../core/composition-helpers.js';
import { Size, sizeEquals } from '../core/math-utils.js';
import { logVisualElementShown } from '../data/visual-element-tracking.js';
import { getPlayerKeyword } from './video-data-helpers.js'; // was: g.YQ
// TODO: resolve g.qI
// TODO: resolve g.qa
// TODO: resolve g.zC

/**
 * Player Container — DOM management for the video player element.
 *
 * Source: player_es6.vflset/en_US/base.js, lines 118000–119000
 *
 * Contains:
 *  - PlayerContainer class (Bj4): video element wrapper, sizing, resize
 *  - Constructor: app config, tag pool (Uu), player style ("gvn")
 *  - Window event listeners: "orientationchange", "resize"
 *  - Video data update: AirPlay, title, poster, controlslist, bgcolor
 *  - Player underlay support (desktop feature for side panels)
 *  - Video aspect ratio and content rect calculations
 *  - VisualElementTracker (xn1): VE tracking for analytics
 *  - WorkerLatencyProbe (qZm): Echo-worker round-trip timing
 *  - App (g.Iy) constructor: full player application bootstrap
 *    (CSI, playlists, modules, experiments, echo worker, etc.)
 *
 * @module player/player-container
 */

// ---------------------------------------------------------------------------
// PlayerContainer — EU / resize / video data  (lines 117916–118106)
// ---------------------------------------------------------------------------

/**
 * Player container managing the root DOM element, video element,
 * and all layout/sizing logic.
 *
 * Key fields:
 *  - `this.app`   — parent App instance [was: app]
 *  - `this.G5`    — video container div (`VIDEO_CONTAINER`) [was: G5]
 *  - `this.x5`    — cached player size rect [was: x5]
 *  - `this.vB`    — the `<video>` element [was: vB]
 *  - `this.Sw`    — cached squeeze-back rect [was: Sw]
 *  - `this.uZ`    — stretch aspect ratio override [was: uZ]
 *  - `this.hd`    — crop aspect ratio override [was: hd]
 *  - `this.mL`    — global crop override [was: mL]
 *  - `this.J4`    — center-crop mode [was: J4]
 *  - `this.Ju`    — player underlay enabled [was: Ju]
 *  - `this.Ta`    — muted autoplay active [was: Ta]
 *  - `this.LQ`    — dom-content-change subscription id [was: LQ]
 *  - `this.S5`    — smart zoom flag [was: S5]
 *  - `this.T4`    — matchMedia cache [was: T4]
 *  - `this.zZ`    — debounced resize timer [was: zZ]
 *  - `this.Nj`    — internal override size (JP) [was: Nj]
 *  - `this.YZ`    — dirty flag [was: YZ]
 *  - `this.XA`    — squeezeback active [was: XA]
 *  - `this.fm`    — force resize flag [was: fm]
 *
 * [was: Bj4 extends g.k]
 *
 * @class PlayerContainer
 */
export class PlayerContainer { // was: Bj4 (line 117916)
  constructor(app) { // was: Q
    // super({ C: "div", yC: ["html5-video-player"], ... })
    this.app = app;

    /**
     * The video container div. [was: G5]
     * Resolved from `.z2(g.qa.VIDEO_CONTAINER)`.
     */
    this.isKnownBrowserVersion = this.z2(g.qa.VIDEO_CONTAINER); // was: G5

    /** Cached player size. [was: x5] */
    this.x5 = new g.zC(0, 0, 0, 0);

    /** The `<video>` element reference. [was: vB] */
    this.vB = null;

    /** Squeeze-back rect. [was: Sw] */
    this.Sw = new g.zC(0, 0, 0, 0);

    this.SIGNAL_INTERNAL = NaN; // was: uZ — stretch aspect ratio
    this.CONSTRUCTOR_GUARD = NaN; // was: hd — crop aspect ratio
    this.mL = NaN; // was: mL — global crop

    this.BASE64_WEBSAFE_REPLACE = false; // was: J4 — center crop
    this.Ju = false; // was: Ju — underlay enabled
    this.vy = false; // was: vy — unknown flag
    this.Ta = false; // was: Ta — muted autoplay overlay

    this.LQ = NaN; // was: LQ — dom event subscription id
    this.buildTimeRangeEntryTrigger = false; // was: S5 — smart zoom

    this.T4 = null; // was: T4 — matchMedia cache

    /** Debounced resize (100ms). [was: zZ] */
    this.zZ = new ThrottleTimer(() => {
      if (this.app.G().X("web_enable_smart_zoom") && this.app.ge.getInternalApi().isAutocropEnabled()) {
        return;
      }
      this.resize();
    }, 100);

    /** Focus handler for video element. [was: oL] */
    this.parseInstreamVideoAdRenderer = () => {
      this.element.focus({ preventScroll: true });
    };

    /** Transition-end handler for underlay. [was: Uy] */
    this.Uy = () => {
      this.app.ge.publish("playerUnderlayVisibilityChange", "visible");
      this.vB.classList.remove(g.qa.VIDEO_CONTAINER_TRANSITIONING);
      this.vB.removeEventListener(Ct, this.Uy); // was: Ct — transitionend event name
      this.vB.removeEventListener("transitioncancel", this.Uy);
    };

    this.fm = false; // was: fm — force resize
    this.XA = false; // was: XA — squeezeback

    // Proxy addEventListener/removeEventListener to the underlying DOM element
    const origAdd = this.element.addEventListener;
    const origRemove = this.element.removeEventListener;

    this.addEventListener = (type, listener, options) => { // was: K, T, r
      origAdd.apply(this.element, [type, listener, options]);
    };
    this.removeEventListener = (type, listener, options) => {
      origRemove.apply(this.element, [type, listener, options]);
    };

    const config = app.G(); // was: m

    // Apply initial CSS classes based on config
    if (config.transparentBackground) this.jf("ytp-transparent");
    if (config.controlsType === "0") this.jf("ytp-hide-controls");

    addClass(this.element, "ytp-exp-bottom-control-flexbox");
    addClass(this.element, "ytp-modern-caption");

    if (config.X("enable_new_paid_product_placement") && !isWebEmbeddedPlayer(config)) {
      addClass(this.element, "ytp-exp-ppp-update");
    }
    addClass(this.element, "ytp-livebadge-color");

    if (config.X("web_player_default_autohide")) {
      addClass(this.element, "ytp-autohide");
    }

    setDatasetVersion(this.element, wCy(app)); // was: e2w, wCy — apply theme styles

    this.updateNextVideoButton = false; // was: YZ
    this.Nj = new Size(NaN, NaN); // was: Nj — internal size override

    bindTemplateEvents(this); // was: Bd7 — init sizing
    this.B(app.ge, "onMutedAutoplayChange", this.onMutedAutoplayChange);
    registerDisposable(this, this.zZ);
  }

  /**
   * Add CSS class(es) to the root element.
   *
   * [was: jf] (line 117986)
   *
   * @param {...string} classNames [was: Q]
   */
  jf(...classNames) { // was: jf
    g.qI(this.element, classNames); // was: g.qI — add classes
  }

  /**
   * Remove and clean up the video element reference.
   *
   * [was: Ps] (line 117989)
   */
  removeVideoElement() { // was: Ps
    if (!this.vB) return;
    this.vB.removeEventListener("focus", this.parseInstreamVideoAdRenderer);
    removeNode(this.vB); // was: g.FQ — remove from DOM
    this.vB = null;
  }

  /**
   * Initialize the container after DOM attachment.
   *
   * Applies tag pool, house brand, playerStyle "gvn" styles.
   * Subscribes to "orientationchange" and "resize" on window.
   * Optionally subscribes to `yt-dom-content-change` for sC (responsive) mode.
   *
   * [was: EU] (line 117994)
   */
  initialize() { // was: EU
    this.u0(); // was: u0 — internal init
    const config = this.app.G(); // was: Q

    if (!config.IgnoreNavigationMetadata) this.jf("tag-pool-enabled"); // was: Uu — tag pool flag
    if (config.D) this.jf(g.qa.HOUSE_BRAND); // was: D — house brand flag

    if (config.playerStyle === "gvn") { // was: playerStyle
      this.jf("ytp-gvn");
      this.element.style.backgroundColor = "transparent";
    }

    if (config.sC) { // was: sC — responsive resize mode
      this.LQ = pubsubSubscribe("yt-dom-content-change", this.resize, this); // was: g.Qp — subscribe
    }

    this.B(window, "orientationchange", this.resize, this);
    this.B(window, "resize", this.resize, this);
  }

  /**
   * Handle external visibility change (e.g. element hidden/shown).
   *
   * [was: gr] (line 118005)
   *
   * @param {boolean} isVisible [was: Q]
   */
  gr(isVisible) { // was: gr
    requiresNativeControls(this.app.G()); // was: g.Ax — assert config
    this.Ta = !isVisible;
    updateVideoControls(this); // was: hL — update muted autoplay overlay
  }

  /**
   * Recalculate and publish player size if changed.
   *
   * Detects size changes, fullscreen edge cases, and squeeze-back toggles.
   * Publishes "resize" with the new player size.
   *
   * [was: resize] (line 118010)
   */
  resize() {
    if (!this.vB) return;

    let size = this.globalEventBuffer(); // was: Q, rM — get effective video size
    if (size.isEmpty()) return;

    if (this.app.ge.isFullscreen() && isAndroidChrome()) { // was: Nt — is mobile fullscreen
      this.zZ.start();
    }

    const sizeChanged = !sizeEquals(size, this.x5.getSize()); // was: c
    const squeezebackToggled = layoutVideoContainer(this); // was: W, ngK — squeezeback state change

    if (sizeChanged) {
      this.x5.width = size.width;
      this.x5.height = size.height;
    }

    const config = this.app.G(); // was: Q (reused)
    if (squeezebackToggled || sizeChanged || this.fm || config.sC) {
      this.app.ge.publish("resize", this.getPlayerSize());
    }
  }

  /**
   * Delegate for video data change (called from Qq).
   *
   * [was: Qq] (line 118024)
   *
   * @param {string} changeType [was: Q]
   * @param {object} videoData  [was: c]
   */
  onVideoDataChange(changeType, videoData) { // was: Qq
    this.updateVideoData(videoData);
  }

  /**
   * Update the video element and container from new video data.
   *
   * Sets:
   *  - AirPlay: `x-webkit-airplay="allow"` and title attribute
   *  - `controlslist="nodownload"`
   *  - Poster image (thumbnail or transparent 1px gif for Safari/iOS)
   *  - Background color from `yt:bgcolor` metadata
   *  - Stretch/crop aspect ratios from `yt:stretch` / `yt:crop`
   *  - DNI (do-not-interrupt) class from `videoData.er`
   *
   * [was: updateVideoData] (line 118027)
   *
   * @param {object} videoData [was: Q]
   */
  updateVideoData(videoData) { // was: Q
    if (this.vB) {
      const config = this.app.G(); // was: c

      // AirPlay support (WebKit)
      if (ou) { // was: ou — is WebKit
        this.vB.setAttribute("x-webkit-airplay", "allow");
        if (videoData.title) {
          this.vB.setAttribute("title", videoData.title);
        } else {
          this.vB.removeAttribute("title");
        }
      }

      this.vB.setAttribute("controlslist", "nodownload");

      // Poster image
      if (config.fY && videoData.videoId) { // was: fY — show poster
        this.vB.poster = videoData.AdVideoClickthroughMetadata("default.jpg"); // was: ux — thumbnail URL
      } else if (isSafariVersioned() && (androidVersion ?? 0) >= 10) { // was: wL — is Safari, UA — version
        // Transparent 1px gif for Safari 10+
        this.vB.poster = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      }
    }

    // Background color from video metadata
    const bgcolor = getPlayerKeyword(videoData, "yt:bgcolor"); // was: c (reused), g.YQ — get metadata
    this.isKnownBrowserVersion.style.backgroundColor = bgcolor ? bgcolor : "";

    // Aspect ratio overrides
    this.SIGNAL_INTERNAL = parseAspectRatio(getPlayerKeyword(videoData, "yt:stretch")); // was: a2 — parse float
    this.CONSTRUCTOR_GUARD = parseAspectRatio(getPlayerKeyword(videoData, "yt:crop"), true);

    // DNI class
    toggleClass(this.element, "ytp-dni", videoData.validateSlotTriggers); // was: g.L — toggle class, er — DNI flag

    this.resize();
  }

  /**
   * Set a global crop ratio.
   *
   * [was: setGlobalCrop] (line 118042)
   *
   * @param {string|number} crop [was: Q]
   */
  setGlobalCrop(crop) { // was: Q
    this.mL = parseAspectRatio(crop, true); // was: a2 — parse
    this.resize();
  }

  /**
   * Set center-crop mode.
   *
   * [was: setCenterCrop] (line 118046)
   *
   * @param {boolean} enabled [was: Q]
   */
  setCenterCrop(enabled) { // was: Q
    this.BASE64_WEBSAFE_REPLACE = enabled;
    this.resize();
  }

  /** No-op placeholder. [was: Z0] (line 118050) */
  Z0() {}

  /**
   * Get the effective player size, accounting for fullscreen, squeeze-back,
   * and external size overrides.
   *
   * [was: getPlayerSize] (line 118051)
   *
   * @returns {g.JP} Player size (width, height)
   */
  getPlayerSize() { // was: getPlayerSize
    const config = this.app.G(); // was: Q
    const isFullscreen = this.app.ge.isFullscreen(); // was: c
    const isExternalFS = config.externalFullscreen && isEmbedWithAudio(config); // was: W

    if (isFullscreen && isAndroidChrome() && !isExternalFS) { // was: Nt — mobile fullscreen
      return new Size(window.outerWidth, window.outerHeight);
    }

    const hasOverride = !isNaN(this.Nj.width) && !isNaN(this.Nj.height); // was: W (reused)
    const squeezebackFS =
      this.app.G().X("kevlar_player_enable_squeezeback_fullscreen_sizing") ||
      this.app.G().X("web_watch_enable_fs_squeezeback_panels"); // was: m

    if (isFullscreen && !hasOverride && squeezebackFS) {
      return new Size(this.element.clientWidth, this.element.clientHeight);
    }

    if (isFullscreen || config.Oo) { // was: Oo — always-fullscreen mode
      let matches; // was: K
      if (window.matchMedia) {
        const query = "(width: " + window.innerWidth + "px) and (height: " + window.innerHeight + "px)"; // was: Q (reused)
        if (!this.T4 || this.T4.media !== query) {
          this.T4 = window.matchMedia(query);
        }
        matches = this.T4 && this.T4.matches;
      }
      if (matches) {
        return new Size(window.innerWidth, window.innerHeight);
      }
    } else if (hasOverride) {
      return this.Nj.clone();
    }

    return new Size(this.element.clientWidth, this.element.clientHeight);
  }

  /**
   * Get effective video rendering size (may be smaller than player when
   * player underlay is active).
   *
   * [was: rM] (line 118072)
   *
   * @returns {g.JP}
   */
  globalEventBuffer() { // was: rM
    const underlayEnabled = this.app.G().X("enable_desktop_player_underlay"); // was: Q
    const playerSize = this.getPlayerSize(); // was: c
    const minWidth = getExperimentValue(this.app.G().experiments, "player_underlay_min_player_width"); // was: W

    if (underlayEnabled && this.Ju && playerSize.width > minWidth) {
      const fraction = getExperimentValue(this.app.G().experiments, "player_underlay_video_width_fraction"); // was: Q (reused)
      return new Size(
        Math.min(playerSize.height * this.getVideoAspectRatio(), playerSize.width * fraction),
        Math.min(playerSize.height, (playerSize.width * fraction) / this.getVideoAspectRatio()),
      );
    }
    return playerSize;
  }

  /**
   * Get the video aspect ratio (overridden or computed).
   *
   * [was: getVideoAspectRatio] (line 118079)
   *
   * @returns {number}
   */
  getVideoAspectRatio() {
    return isNaN(this.SIGNAL_INTERNAL) ? getNativeVideoAspectRatio(this) : this.SIGNAL_INTERNAL; // was: qC0 — compute from video
  }

  /**
   * Get the video content rectangle within the player area.
   *
   * [was: getVideoContentRect] (line 118082)
   *
   * @param {boolean} [cropEnabled] [was: Q]
   * @returns {g.zC} Rectangle (x, y, width, height)
   */
  getVideoContentRect(cropEnabled) { // was: Q
    const videoSize = this.globalEventBuffer(); // was: c
    const fitSize = computeVideoFitSize(this, videoSize, this.getVideoAspectRatio(), cropEnabled); // was: Q (reused), xc7 — fit to rect
    return new g.zC(
      (videoSize.width - fitSize.width) / 2,
      (videoSize.height - fitSize.height) / 2,
      fitSize.width,
      fitSize.height,
    );
  }

  /**
   * Enable/disable player underlay mode.
   *
   * [was: m5] (line 118087)
   *
   * @param {boolean} enabled [was: Q]
   */
  setUnderlayEnabled(enabled) { // was: m5
    this.Ju = enabled;
    this.resize();
  }

  /**
   * Get the squeezeback visibility state.
   *
   * [was: Js] (line 118091)
   *
   * @returns {boolean}
   */
  Js() { // was: Js
    return this.vy;
  }

  /** Handle muted autoplay state change. [was: onMutedAutoplayChange] (line 118094) */
  onMutedAutoplayChange() {
    updateVideoControls(this); // was: hL — update overlay
  }

  /**
   * Set internal size override for squeeze-back.
   *
   * [was: setInternalSize] (line 118097)
   *
   * @param {g.JP} size [was: Q]
   */
  setInternalSize(size) { // was: Q
    if (!sizeEquals(this.Nj, size)) {
      this.Nj = size;
      this.resize();
    }
  }

  /**
   * Dispose: unsubscribe from DOM events.
   *
   * [was: WA] (line 118101)
   */
  dispose() { // was: WA
    if (this.LQ) pubsubUnsubscribe(this.LQ); // was: g.cm — unsubscribe
    this.removeVideoElement();
    // super.WA()
  }
}

// ---------------------------------------------------------------------------
// VisualElementTracker  [was: xn1]  (lines 118108–118173)
// ---------------------------------------------------------------------------

/**
 * Tracks visual elements (VE) for Innertube analytics.
 *
 * Manages a set of registered DOM elements, their visual element payloads,
 * and click/impression tracking through the VE graf system.
 *
 * [was: xn1]
 *
 * @class VisualElementTracker
 */
export class VisualElementTracker { // was: xn1 (line 118108)
  constructor() {
    this.csn = getClientScreenNonce(); // was: csn — client sequence number
    this.clientPlaybackNonce = null;
    this.elements = new Set(); // was: elements — registered elements
    this.A = new Set(); // was: A — already-impressed elements
    this.W = new Set(); // was: W — currently-visible elements
    this.O = new Set(); // was: O — server-side VE elements
  }

  /**
   * Log a click on an element.
   *
   * [was: click] (line 118117)
   *
   * @param {Element} element [was: Q]
   * @param {object}  [extra] [was: c]
   */
  click(element, extra) { // was: Q, c
    this.elements.has(element);
    this.W.has(element);
    const csn = getClientScreenNonce(); // was: W
    if (csn && element.visualElement) {
      logClick(csn, element.visualElement, extra); // was: g.pa — log click
    }
  }

  /**
   * Create a client-side visual element.
   *
   * [was: createClientVe] (line 118123)
   *
   * @param {Element}  element      [was: Q]
   * @param {object}   disposable   [was: c] — component to attach dispose callback
   * @param {object}   veTemplate   [was: W] — VE template data
   * @param {boolean}  [isLazy]     [was: m] — lazy tracking (default false)
   */
  createClientVe(element, disposable, veTemplate, isLazy = false) { // was: Q, c, W, m
    this.elements.has(element);
    this.elements.add(element);

    const ve = createVisualElement(veTemplate); // was: W (reused), x0 — create VE
    element.visualElement = ve;

    const csn = getClientScreenNonce(); // was: K
    const rootVe = getRootVisualElement(); // was: T — root VE
    if (csn && rootVe) {
      if (getExperimentBoolean("combine_ve_grafts")) {
        graftVisualElement(getClientFacingManager(), ve, rootVe); // was: k7, Mr — graft VE
      } else {
        wrapWithErrorReporter(attachVisualElement)(undefined, csn, rootVe, ve); // was: g.Po — attach VE
      }
    }

    disposable.addOnDisposeCallback(() => {
      if (this.elements.has(element)) this.destroyVe(element);
    });

    if (isLazy) this.O.add(element);
  }

  /**
   * Create a server-side visual element (tracking params from server).
   *
   * [was: createServerVe] (line 118137)
   *
   * @param {Element} element    [was: Q]
   * @param {object}  disposable [was: c]
   * @param {boolean} [isLazy]   [was: W]
   */
  createServerVe(element, disposable, isLazy = false) { // was: Q, c, W
    this.elements.has(element);
    this.elements.add(element);

    disposable.addOnDisposeCallback(() => {
      this.destroyVe(element);
    });

    if (isLazy) this.O.add(element);
  }

  /**
   * Remove a visual element from tracking.
   *
   * [was: destroyVe] (line 118146)
   *
   * @param {Element} element [was: Q]
   */
  destroyVe(element) { // was: Q
    this.elements.has(element);
    this.elements.delete(element);
    this.A.delete(element);
    this.W.delete(element);
    this.O.delete(element);
  }

  /**
   * Update the client playback nonce and refresh the VE root.
   *
   * [was: T2] (line 118153)
   *
   * @param {object} ve  [was: Q] — master VE
   * @param {string} cpn [was: c] — client playback nonce
   */
  T2(ve, cpn) { // was: T2
    if (this.clientPlaybackNonce !== cpn) {
      this.clientPlaybackNonce = cpn;
      createClientScreen(getClientFacingManager(), ve); // was: Rm — set root VE
      updateVisualElementCSN(this); // was: tcy — refresh all elements
    }
  }

  /**
   * Set tracking params from server data.
   *
   * [was: setTrackingParams] (line 118158)
   *
   * @param {Element} element       [was: Q]
   * @param {string}  trackingBytes [was: c]
   */
  setTrackingParams(element, trackingBytes) { // was: Q, c
    this.elements.has(element);
    if (trackingBytes) {
      element.visualElement = createVeFromTrackingParams(trackingBytes); // was: g.Bo — decode VE
    }
  }

  /**
   * Update visibility state for an element.
   *
   * Handles first-impression logging and show/hide tracking.
   *
   * [was: BB] (line 118162)
   *
   * @param {Element} element [was: Q]
   * @param {boolean} visible [was: c]
   * @param {object}  [extra] [was: W]
   */
  BB(element, visible, extra) { // was: Q, c, W
    this.elements.has(element);
    if (visible) {
      this.W.add(element);
    } else {
      this.W.delete(element);
    }

    const csn = getClientScreenNonce(); // was: m
    const ve = element.visualElement; // was: K

    if (this.O.has(element)) {
      // Server-side VE: use batch show/hide
      if (csn && ve) {
        visible ? batchShowVisualElements(csn, [ve]) : batchHideVisualElements(csn, [ve]); // was: g.k0 — show, g.Y0 — hide
      }
    } else if (visible && !this.A.has(element)) {
      // First impression for client-side VE
      if (csn && ve) {
        logVisualElementShown(csn, ve, undefined, extra); // was: g.Rv — log impression
      }
      this.A.add(element);
    }
  }

  /**
   * Check if an element has a visual element registered.
   *
   * [was: hasVe] (line 118170)
   *
   * @param {Element} element [was: Q]
   * @returns {boolean}
   */
  hasVe(element) { // was: Q
    return this.elements.has(element);
  }
}

// ---------------------------------------------------------------------------
// WorkerLatencyProbe  [was: qZm]  (lines 118175–118271)
// ---------------------------------------------------------------------------

/**
 * Probes worker round-trip latency using a shared echo worker.
 *
 * Sends various message types (0–5) at random intervals and measures
 * time deltas between send, worker processing, and receive. Reports
 * results via `tJ("worker", ...)`.
 *
 * [was: qZm extends g.qK]
 *
 * @class WorkerLatencyProbe
 */
export class WorkerLatencyProbe { // was: qZm (line 118175)
  constructor(
    workerUrl,        // was: Q — echo worker URL (S)
    logCallback,      // was: c — tJ callback
    wasmPingInterval, // was: W — WASM ping interval (Y)
    pingPayload,      // was: m — ping payload (D)
    pingPayload2,     // was: K — secondary payload (L)
    intervalMs,       // was: T — base interval
    wasmModuleUrl,    // was: r — WASM module URL (K)
  ) {
    // super();
    this.S = workerUrl;
    this.RetryTimer = logCallback;
    this.Y = wasmPingInterval;
    this.D = pingPayload;
    this.L = pingPayload2;
    this.intervalMs = intervalMs;
    this.K = wasmModuleUrl;

    this.isSamsungSmartTV = tP; // was: b0 — worker blob URL helper (tP)
    this.J = 0; // was: J — response count
    this.A = false; // was: A — initialized
    this.j = false; // was: j — WASM support confirmed
    this.mF = Math.floor(Math.random() * 256); // was: mF — random nonce
  }

  /**
   * Send a random probe message to the worker.
   *
   * Message types:
   *  - 0: payload echo
   *  - 1: timestamp ping
   *  - 2: timestamp + secondary payload
   *  - 3: bare timestamp
   *  - 4: WASM module URL (if available)
   *  - 5: payload + nonce (requires WASM confirmed)
   *
   * [was: sendRequest] (line 118190)
   */
  sendRequest() {
    let types = [0, 1, 2, 3]; // was: Q
    if (this.K) {
      types.push(4);
      if (this.j) types.push(5);
    }

    const chosen = types[Math.floor(Math.random() * types.length)];
    switch (chosen) {
      case 0:
        sendWorkerTimingRequest(this, this.D); // was: ivR — send type-0
        break;
      case 1:
        if (this.SlotIdFulfilledEmptyTrigger) { // was: Zg — worker reference
          const msg = { [0]: 1, [1]: performance.now() }; // was: Q (reused)
          this.request(msg);
        }
        break;
      case 2:
        if (this.SlotIdFulfilledEmptyTrigger) {
          const msg = { [0]: 2, [1]: performance.now(), [3]: this.L }; // was: Q (reused)
          this.request(msg);
        }
        break;
      case 3:
        if (this.SlotIdFulfilledEmptyTrigger) {
          const msg = { [0]: 3, [1]: performance.now() };
          this.request(msg);
        }
        break;
      case 4:
        if (this.K) {
          const msg = { [0]: 4, [1]: performance.now(), [4]: this.K };
          this.request(msg);
        }
        break;
      case 5: {
        const payload = this.D; // was: c
        const nonce = this.mF; // was: Q (reused)
        if (this.SlotIdFulfilledEmptyTrigger) {
          const transformed = getOrCreateRandomBuffer(this, payload); // was: c (reused), Ndm — transform
          const msg = { [0]: 5, [1]: performance.now(), [2]: transformed, [5]: nonce };
          this.request(msg);
        }
        break;
      }
    }
  }

  /**
   * Post a message to the echo worker.
   *
   * [was: request] (line 118242)
   *
   * @param {object} msg [was: Q]
   */
  request(msg) { // was: Q
    if (this.SlotIdFulfilledEmptyTrigger) this.SlotIdFulfilledEmptyTrigger.postMessage(msg);
  }

  /**
   * Handle a response from the echo worker.
   *
   * Measures four timing deltas (t1–t4) and reports via `tJ("worker", ...)`.
   * Stops after 5000 responses.
   *
   * [was: receive] (line 118245)
   *
   * @param {MessageEvent} event [was: Q]
   */
  receive(event) { // was: Q
    if (this.J >= 5000) return;

    const receiveTimestamp = event.timeStamp; // was: c
    const now = performance.now(); // was: W
    const data = event.data; // was: Q (reused)

    if (data[0] === 5) this.j = true; // WASM confirmed

    const sendTime = data[1]; // was: m
    this.RetryTimer("worker", {
      type: data[0],
      getBgeServiceWorkerKey: (data[2] - performance.timeOrigin - sendTime).toFixed(3),
      t2: (data[3] - performance.timeOrigin - sendTime).toFixed(3),
      currentSdkType: (receiveTimestamp - sendTime).toFixed(3),
      t4: (now - sendTime).toFixed(3),
    });
    this.J++;
  }

  /**
   * Dispose: stop interval, terminate worker.
   *
   * [was: WA] (line 118262)
   */
  dispose() { // was: WA
    if (this.O !== undefined) {
      clearInterval(this.O);
      this.O = undefined;
    }
    this.SlotIdFulfilledEmptyTrigger?.terminate();
    this.W = undefined;
    this.SlotIdFulfilledEmptyTrigger = undefined;
    this.j = false;
    this.RetryTimer("workerDtor", {});
    // super.WA()
  }
}

// ---------------------------------------------------------------------------
// App Constructor (partial)  [was: g.Iy]  (lines 118273–118500)
// ---------------------------------------------------------------------------

/**
 * The main player application class.
 *
 * The constructor bootstraps the entire player:
 *  1. Creates `FI` (player config / `ZnX`)
 *  2. Initializes Onesie (HTTP/3 streaming), if enabled
 *  3. Creates the Qp (network throttle/idle manager)
 *  4. Sets visibility, events, CSI, template (`Bj4`)
 *  5. Creates the player state machine (`fk` / `g.K_`)
 *  6. Initializes the preload cache (`Bq` / `eR9`)
 *  7. Creates the DAI child-playback manager (`Z1` / `XBv`)
 *  8. Creates the gapless/shorts manager (`tj` / `Tj0`)
 *  9. Wires up all event subscriptions (app-level and player-level)
 * 10. Optionally creates the echo worker probe (`wk` / `qZm`)
 * 11. Publishes "applicationInitialized"
 *
 * Key fields:
 *  - `this.FI`       — player config (ZnX) [was: FI]
 *  - `this.ge`       — internal API / event bus (g.N0) [was: ge]
 *  - `this.template`  — PlayerContainer (Bj4) [was: template]
 *  - `this.fk`       — player state machine (g.K_) [was: fk]
 *  - `this.Bq`       — preload cache (eR9) [was: Bq]
 *  - `this.NI`       — SSDAI cue range manager (g.rX) [was: NI]
 *  - `this.Z1`       — child playback manager (XBv) [was: Z1]
 *  - `this.tj`       — gapless manager (Tj0) [was: tj]
 *  - `this.KO`       — CSI timer (CG7) [was: KO]
 *  - `this.RM`       — VE tracker (xn1) [was: RM]
 *  - `this.vJ`       — module manager [was: vJ]
 *  - `this.playlist`  — playlist controller [was: playlist]
 *  - `this.visibility` — visibility state (oGv) [was: visibility]
 *  - `this.events`   — event handler group (g.db) [was: events]
 *
 * [was: g.Iy extends g.qK]
 *
 * @class App
 */

// The full App constructor is ~230 lines; key excerpts are documented
// in the corresponding module files.  See player-events.js for the
// event wiring that follows the constructor.
