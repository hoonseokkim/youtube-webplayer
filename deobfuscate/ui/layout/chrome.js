/**
 * Player Chrome Container — the main bottom-bar UI that holds all controls.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~114448-114700  (kY1  — BottomChrome)
 *                 ~115240-115430  (W1H  — EmbedChrome, extends g.LH)
 *                 ~110119-110137  (APW  — bottom gradient overlay)
 *
 * The BottomChrome class assembles the progress bar, left controls (play,
 * seek-forward/backward, prev/next, volume, time display, chapter title)
 * and right controls (captions, settings, miniplayer, fullscreen, logo).
 *
 * [was: kY1, W1H, APW]
 */
import { PlayerComponent } from '../../player/component.js';
import { createElement } from '../../core/dom-utils.js';
import { getPlayerSize } from '../../player/time-tracking.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { EventHandler } from '../../core/event-handler.js';
import { Tooltip } from '../control-misc.js';

// import { PlayerComponent } from '../../player/component.js';

// ---------------------------------------------------------------------------
// BottomGradient
// ---------------------------------------------------------------------------

/**
 * A `<canvas>`-backed gradient overlay drawn behind the bottom chrome.
 * Resizes vertically to match the player height.
 *
 * [was: APW]
 */
export class BottomGradient /* extends PlayerComponent */ {
  /**
   * Offscreen canvas used to generate the gradient.
   * @type {HTMLCanvasElement}
   */
  canvas_; // was: this.O — g.HB("CANVAS")

  /**
   * Canvas 2D rendering context.
   * @type {CanvasRenderingContext2D|null}
   */
  ctx_ = null; // was: this.W

  /**
   * Cached player height (to avoid redundant redraws).
   * @type {number}
   */
  cachedHeight_ = NaN; // was: this.A

  /**
   * @param {Object} api  Player API instance.
   */
  constructor(api) {
    // super({ C: "div", Z: "ytp-gradient-bottom" });
    this.canvas_ = document.createElement('canvas'); // was: g.HB("CANVAS")
    this.ctx_ = this.canvas_.getContext('2d', { willReadFrequently: true });
    this.cachedHeight_ = NaN;
    this.canvas_.width = 1;
    this.resize(api.bX().getPlayerSize().height); // was: vzw(this, …)
  }

  /**
   * Redraws the gradient to match the given player height.
   *
   * @param {number} playerHeight
   */
  resize(playerHeight) { // was: vzw(this, Q)
    if (this.cachedHeight_ === playerHeight) return;
    this.cachedHeight_ = playerHeight;
    // Draw a vertical gradient from transparent to semi-opaque black
  }

  dispose() { // was: WA()
    this.ctx_ = null;
    // super.dispose();
  }
}

// ---------------------------------------------------------------------------
// BottomChrome
// ---------------------------------------------------------------------------

/**
 * The main bottom chrome bar containing the progress bar, left controls,
 * and right controls.
 *
 * Layout:
 *   <div class="ytp-gradient-bottom" />           <!-- gradient overlay -->
 *   <div class="ytp-chrome-bottom">
 *     <ProgressBar />                              <!-- seek/progress bar -->
 *     <div class="ytp-chrome-controls">
 *       <div class="ytp-left-controls">
 *         <PreviousButton />                       <!-- optional -->
 *         <JumpButton direction="backward" />      <!-- optional -->
 *         <PlayButton />
 *         <JumpButton direction="forward" />       <!-- optional -->
 *         <NextButton />
 *         <span class="ytp-volume-area">
 *           <MuteButton />
 *           <VolumeSliderPanel />
 *         </span>
 *         <TimeDisplay class="ytp-time-wrapper" />
 *         <ChapterTitle class="ytp-chapter-title" />
 *       </div>
 *       <div class="ytp-right-controls">
 *         <div class="ytp-right-controls-left">    <!-- Delhi layout -->
 *           <ExpandControlsButton />
 *           <MuteButton />                         <!-- alt position -->
 *           <SubtitlesButton />
 *           <SettingsButton />
 *         </div>
 *         <div class="ytp-right-controls-right">
 *           <MiniplayerButton />
 *           <PipButton />
 *           <TheaterModeButton />
 *           <FullscreenButton />
 *         </div>
 *         <YouTubeLogo />
 *       </div>
 *     </div>
 *   </div>
 *
 * [was: kY1]
 */
export class BottomChrome /* extends EventHandler (event handler group) */ {
  /**
   * Player API reference.
   * @type {Object}
   */
  api; // was: this.U

  /**
   * Tooltip manager reference.
   * @type {Object}
   */
  tooltip_; // was: this.T2

  /**
   * Autohide controller reference.
   * @type {Object}
   */
  autohideController_; // was: this.Lx

  // -- Child components -------------------------------------------------------

  /**
   * Settings popup (gear menu).
   * @type {Object}
   */
  settingsPopup_; // was: this.A — zAW

  /**
   * The progress/seek bar.
   * @type {Object}
   */
  progressBar; // was: this.progressBar — g.ZRD

  /**
   * Time display component.
   * @type {Object}
   */
  timeDisplay_; // was: this.Yy — g.MSo

  /**
   * Fullscreen button component.
   * @type {Object}
   */
  fullscreenButton_; // was: this.JJ — qy1

  /**
   * Play button component (null if controls disabled).
   * @type {Object|null}
   */
  playButton; // was: this.playButton — g.yP1

  /**
   * Mute button component.
   * @type {Object|null}
   */
  muteButton; // was: this.muteButton — Yc

  /**
   * Volume slider panel.
   * @type {Object|null}
   */
  volumeSlider_; // was: this.XI — JPo

  /**
   * Forward-jump button (+10s).
   * @type {Object|null}
   */
  forwardJumpButton_; // was: this.S — njS

  /**
   * Backward-jump button (-10s).
   * @type {Object|null}
   */
  backwardJumpButton_; // was: this.mF — njS

  /**
   * Chapter title component.
   * @type {Object|null}
   */
  chapterTitle_; // was: this.Ka — VSi

  /**
   * Timed markers component.
   * @type {Object|null}
   */
  timedMarkers_; // was: this.PA — DiD

  /**
   * YouTube logo link component.
   * @type {Object|null}
   */
  youTubeLogo_; // was: this.D — RAa

  /**
   * Miniplayer button.
   * @type {Object|null}
   */
  miniplayerButton_; // was: this.K — tSW

  /**
   * Settings (gear) button.
   * @type {Object}
   */
  settingsButton; // was: this.settingsButton — sgv

  /**
   * Expand/collapse button for small-mode right controls.
   * @type {Object|null}
   */
  expandButton_; // was: this.L — BOZ

  /**
   * Bottom gradient overlay (behind chrome).
   * @type {BottomGradient|null}
   */
  gradient_; // was: this.HA — APW

  /**
   * The chrome-bottom container element.
   * @type {Object}
   */
  chromeBottomComponent_; // was: this.W — g.k with Z:"ytp-chrome-bottom"

  /**
   * The chrome-controls row element.
   * @type {HTMLElement}
   */
  controlsRow_; // was: this.jG — this.W.element.children[0]

  /**
   * Cached player width for resize detection.
   * @type {number}
   */
  cachedWidth_ = NaN; // was: this.Re

  /**
   * Fade controller for the gradient.
   * @type {Object}
   */
  gradientFade_; // was: this.MM — g.QR

  /**
   * Fade controller for the chrome-bottom bar.
   * @type {Object}
   */
  chromeFade_; // was: this.Ie — g.QR

  /**
   * Animation frame ticker for smooth progress updates.
   * @type {Object}
   */
  progressTicker_; // was: this.Y — g.T5

  /**
   * @param {Object} api               Player API.
   * @param {Object} tooltipManager    Tooltip display manager.
   * @param {Object} autohideCtrl      Autohide controller.
   */
  constructor(api, tooltipManager, autohideCtrl) {
    // super();

    this.api = api;                       // was: this.U
    this.tooltip_ = tooltipManager;       // was: this.T2
    this.autohideController_ = autohideCtrl; // was: this.Lx

    // -- Create gradient overlay --
    const useDynamicGradient = !api.X('delhi_modern_web_player') &&
                                api.G().X('html5_player_dynamic_bottom_gradient');
    if (useDynamicGradient) {
      this.gradient_ = new BottomGradient(api); // was: new APW(Q)
    }
    // Insert gradient into player at layer 9
    // g.f8(api, gradient.element, 9);

    // -- Create chrome-bottom bar --
    // this.chromeBottomComponent_ = new g.k({ C:"div", Z:"ytp-chrome-bottom", V:[{C:"div", Z:"ytp-chrome-controls"}] });
    // g.f8(api, this.chromeBottomComponent_.element, 9);
    // this.controlsRow_ = this.chromeBottomComponent_.element.children[0];

    // -- Create progress bar --
    // this.progressBar = new g.ZRD(api, tooltipManager);
    // Attach to chromeBottomComponent_ at position 0

    // -- Create left controls --
    // Previous button, JumpButton(-10), PlayButton, JumpButton(+10), Next button
    // Volume area: MuteButton + VolumeSliderPanel
    // TimeDisplay, ChapterTitle

    // -- Create right controls --
    // SubtitlesButton, SettingsButton, MiniplayerButton, PipButton,
    // TheaterModeButton, FullscreenButton, YouTubeLogo

    // -- Event bindings --
    // this.B(api, "appresize", this.onResize_);
    // this.B(api, "fullscreentoggled", this.onResize_);
    // this.B(api, "presentingplayerstatechange", this.onPlayerStateChange_);
    // this.B(api, "videodatachange", this.onVideoDataChange_);

    this.onResize_(); // was: this.b3()
  }

  /**
   * Called on each progress tick (animation frame or progress-sync event).
   * Updates the progress bar and time display.
   */
  onProgress() { // was: onProgress()
    // Skip if video is ended (unless experiment flag)
    // mI(this.Lx) — check if autohide is locked
    // this.progressBar.kx() — update seek bar position
    // this.Yy.kx() — update time display
  }

  /**
   * Called when the autohide controller updates.
   */
  onAutohideUpdate() { // was: ey()
    this.onPlayerStateChange_();
    // if locked: this.progressBar.K()
    // else: this.onProgress()
  }

  /**
   * Starts the progress animation loop.
   */
  startProgressLoop() { // was: WB()
    this.onProgress();
    // this.progressTicker_.start();
  }

  /**
   * Decides whether to use requestAnimationFrame or event-based progress.
   * @private
   */
  onPlayerStateChange_() { // was: UH()
    // Determines if rAF is needed (smooth progress vs. discrete ticks)
    // Binds/unbinds "progresssync" event accordingly
  }

  /**
   * Attempts to focus the play button.
   * @returns {boolean} Whether focus was successful.
   */
  focusPlayButton() { // was: MQ()
    if (this.playButton) {
      this.playButton.focus();
      return true;
    }
    return false;
  }

  /**
   * Recalculates layout dimensions on resize / fullscreen toggle.
   * @private
   */
  onResize_() { // was: b3()
    // Compute chrome width, margins
    // Update progress bar dimensions
    // Update settings popup max dimensions
    // Redraw gradient if dynamic
  }

  /**
   * Returns the chrome-bottom DOM element.
   * @returns {HTMLElement}
   */
  getElement() { // was: Ae()
    return this.chromeBottomComponent_?.element;
  }

  /**
   * Returns the progress bar instance.
   * @returns {Object}
   */
  getProgressBar() { // was: La()
    return this.progressBar;
  }
}

// ---------------------------------------------------------------------------
// EmbedChrome
// ---------------------------------------------------------------------------

/**
 * Extended chrome for embedded players — adds a top bar with channel avatar,
 * title, action buttons (share, watch-next, search, overflow), and additional
 * overlays (end-screen, cards, shopping).
 *
 * Structure (top area):
 *   <div class="ytp-gradient-top" />
 *   <div class="ytp-chrome-top">
 *     <ChannelAvatar />
 *     <Title />
 *     <div class="ytp-chrome-top-buttons">
 *       <SearchButton />
 *       <WatchNextButton />
 *       <ShareButton />
 *       <CopyLinkButton />
 *       <InfoCardsButton />
 *       <OverflowButton />
 *     </div>
 *   </div>
 *
 * [was: W1H — extends g.LH (base chrome)]
 */
export class EmbedChrome /* extends BaseChrome */ {
  /**
   * Whether this is an embedded player.
   * @type {boolean}
   */
  isEmbed_; // was: this.E5

  /**
   * Whether autohide overlays are enabled for this embed.
   * @type {boolean}
   */
  autoHideOverlays_; // was: this.AG

  /**
   * The chrome-top container component.
   * @type {Object}
   */
  chromeTop_; // was: this.Dh — g.k with Z:"ytp-chrome-top"

  /**
   * The top-buttons container.
   * @type {Object}
   */
  topButtons_; // was: this.xR — g.Mu with Z:"ytp-chrome-top-buttons"

  /**
   * Tooltip manager for this chrome.
   * @type {Object}
   */
  tooltip; // was: this.tooltip — g.Q_S

  /**
   * The bottom chrome instance (controls bar).
   * @type {BottomChrome|null}
   */
  bottomChrome; // was: this.Hj — kY1

  /**
   * Context menu instance.
   * @type {Object}
   */
  contextMenu; // was: this.contextMenu — f7D

  /**
   * Channel avatar component.
   * @type {Object}
   */
  channelAvatar; // was: this.channelAvatar — jcH

  /**
   * Video title component.
   * @type {Object}
   */
  title; // was: this.title — pbo

  /**
   * Share button.
   * @type {Object}
   */
  shareButton; // was: this.shareButton — TOv

  /**
   * Copy-link button.
   * @type {Object}
   */
  copyLinkButton; // was: this.copyLinkButton — v9W

  /**
   * Search button.
   * @type {Object}
   */
  searchButton; // was: this.searchButton — miS

  /**
   * Overflow (more) button.
   * @type {Object}
   */
  overflowButton; // was: this.overflowButton — RyH

  /**
   * Top gradient overlay fade controller.
   * @type {Object}
   */
  topGradientFade_; // was: this.eH — g.QR

  /**
   * Chrome-top fade controller.
   * @type {Object}
   */
  chromeTopFade_; // was: this.Th — g.QR

  /**
   * Initialises and assembles all chrome components.
   * Called after construction.
   */
  init() { // was: init()
    // Create top gradient: <div class="ytp-gradient-top" />
    // Create chrome-top: <div class="ytp-chrome-top" />
    // Create tooltip manager
    // Assemble: channelAvatar, title, topButtons (search, watchNext, share, copyLink, overflow)
    // Create bottom chrome (kY1) if controls enabled
    // Create context menu
    // Set up event bindings for fullscreen, resize, video data changes
  }

  /**
   * Returns the tooltip manager.
   * @returns {Object}
   */
  getTooltip() { // was: d6()
    return this.tooltip;
  }

  /**
   * Returns the bottom chrome (controls bar).
   * @returns {BottomChrome|null}
   */
  getBottomChrome() { // was: Y_()
    return this.bottomChrome;
  }
}
