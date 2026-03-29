/**
 * Miniplayer Controls — PiP UI controls, expand/collapse
 *
 * Source: player_es6.vflset/en_US/miniplayer.js, lines 4–304
 * Deobfuscated from the `(function(g) { ... })(_yt_player)` IIFE.
 */

import {
  hasClass, // was: g.B7
  toggleClass, // was: g.L
  Component, // was: g.k
  fireEvent, // was: g.xt
  getTooltipLabel, // was: g.sP
  registerDisposable, // was: g.F
  addToPlayerLayer, // was: g.f8
  closeIcon, // was: g.e_
  reg.playIcon, // was: g.NQ
  getElementOffset, // was: g.Ia
  getElementSize, // was: g.A4
  clamp, // was: g.lm
  Tooltip, // was: g.Q_S
  PlayerOverlay, // was: g.Lp1
  ProgressBar, // was: g.ZRD
  NavigationButton, // was: g.pi
  PlayButton, // was: g.yP1
  ThumbnailOverlay, // was: g.MSo
  AnimationFrame, // was: g.T5
  registerElementDisposer, // was: g.Zr
  setProgressBarWidth, // was: g.CA7
  updateProgressBar, // was: g.oi
} from '../../core/';

import { filterAndSortFormats } from '../../data/bandwidth-tracker.js'; // was: as
import { playIcon } from '../../ui/svg-icons.js'; // was: tK
import { resetSpeedmaster } from '../../player/video-loader.js'; // was: B6
import { createVisualElement } from '../../data/gel-params.js'; // was: x0
import { getStreamTimeOffsetNQ } from '../../player/time-tracking.js'; // was: NQ()
import { disposeApp } from '../../player/player-events.js'; // was: WA
import { listen } from '../../core/composition-helpers.js';
import { Tooltip, TimeDisplay } from '../../ui/control-misc.js';
import { ProgressBarContainer } from '../../ui/marker-tail.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { stopVideo, playVideo, pauseVideo } from '../../player/player-events.js';
import { getPlayerSize } from '../../player/time-tracking.js';
import { resizeSeekBar } from '../../ui/seek-bar-tail.js';
import {
  PlayerModule, // was: g.zj
  registerModule, // was: g.GN
  EventHandler, // was: g.db
} from '../../player/';

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Conditionally applies ad-miniplayer rendering fix classes.
 * [was: Mj9]
 * Source lines: 4–9
 *
 * @param {kO9} miniplayerUI - The miniplayer UI instance
 */
function applyAdMiniplayerControlsFix(miniplayerUI) { // was: Mj9
  const isAdShowing = B7(miniplayerUI.player.getRootNode(), "ad-showing");
  L(miniplayerUI.player.getRootNode(), "ytp-exp-fix-ad-miniplayer-controls-rendering", isAdShowing);
  L(miniplayerUI.element, "ytp-exp-fix-ad-miniplayer-controls-rendering", isAdShowing);
  miniplayerUI.topRightButtons && L(miniplayerUI.topRightButtons.element, "ytp-exp-fix-ad-miniplayer-controls-rendering", isAdShowing); // was: zS
}

/**
 * Toggles the "ytp-player-minimized" class on the player root.
 * [was: JQS]
 * Source lines: 10–12
 *
 * @param {kO9} miniplayerUI
 * @param {boolean} isMinimized
 */
function setPlayerMinimizedClass(miniplayerUI, isMinimized) { // was: JQS
  L(miniplayerUI.player.getRootNode(), "ytp-player-minimized", isMinimized);
}

// ── Expand Button ───────────────────────────────────────────────────

/**
 * Button that expands the miniplayer back to the full watch page.
 * [was: RKv]
 * Source lines: 13–82
 */
export class ExpandWatchPageButton extends k { // was: RKv
  /**
   * @param {Object} player - The player API instance
   * @param {Object} parentUI - The parent miniplayer UI providing d6() for tooltip
   */
  constructor(player, parentUI) {
    super({
      C: "button",
      yC: [
        "ytp-miniplayer-expand-watch-page-button",
        "ytp-button",
        "ytp-miniplayer-button-top-left",
      ],
      N: {
        title: "{{title}}",
        "data-tooltip-target-id": "ytp-miniplayer-expand-watch-page-button",
        "aria-keyshortcuts": "i",
        "data-title-no-tooltip": "{{data-title-no-tooltip}}",
      },
      V: [
        player.X("delhi_modern_web_player_icons")
          ? {
              C: "svg",
              N: { height: "24", viewBox: "0 0 24 24", width: "24" },
              V: [
                {
                  C: "path",
                  N: {
                    d: "M21.20 3.01C21.69 3.06 22.15 3.29 22.48 3.65C22.81 4.02 23.00 4.50 23 5V11H21V5H3V19H13V21H3L2.79 20.99C2.33 20.94 1.91 20.73 1.58 20.41C1.26 20.08 1.05 19.66 1.01 19.20L1 19V5C0.99 4.50 1.18 4.02 1.51 3.65C1.84 3.29 2.30 3.06 2.79 3.01L3 3H21L21.20 3.01ZM12.10 6.00L12 6H5L4.89 6.00C4.65 6.03 4.42 6.14 4.25 6.33C4.09 6.51 3.99 6.75 4 7V12L4.00 12.10C4.02 12.33 4.12 12.54 4.29 12.70C4.45 12.86 4.66 12.97 4.89 12.99L5 13H12L12.10 12.99C12.33 12.97 12.54 12.87 12.70 12.70C12.87 12.54 12.97 12.33 12.99 12.10L13 12V7C13.00 6.75 12.90 6.51 12.74 6.32C12.57 6.14 12.34 6.03 12.10 6.00ZM6 11V8H11V11H6ZM21 13H15V19C15 19.26 15.10 19.51 15.29 19.70C15.48 19.89 15.73 20 16 20C16.26 20 16.51 19.89 16.70 19.70C16.89 19.51 17 19.26 17 19V16.41L21.29 20.70C21.38 20.80 21.49 20.87 21.61 20.93C21.73 20.98 21.87 21.01 22.00 21.01C22.13 21.01 22.26 20.98 22.39 20.93C22.51 20.88 22.62 20.81 22.71 20.71C22.81 20.62 22.88 20.51 22.93 20.39C22.98 20.26 23.01 20.13 23.01 20.00C23.01 19.87 22.98 19.73 22.93 19.61C22.87 19.49 22.80 19.38 22.70 19.29L18.41 15H21C21.26 15 21.51 14.89 21.70 14.70C21.89 14.51 22 14.26 22 14C22 13.73 21.89 13.48 21.70 13.29C21.51 13.10 21.26 13 21 13Z",
                    fill: "white",
                  },
                },
              ],
            }
          : {
              C: "svg",
              N: {
                height: "24px",
                version: "1.1",
                viewBox: "0 0 24 24",
                width: "24px",
              },
              V: [
                {
                  C: "g",
                  N: {
                    fill: "none",
                    "fill-rule": "evenodd",
                    stroke: "none",
                    "stroke-width": "1",
                  },
                  V: [
                    {
                      C: "g",
                      N: {
                        transform:
                          "translate(12.000000, 12.000000) scale(-1, 1) translate(-12.000000, -12.000000) ",
                      },
                      V: [
                        {
                          C: "path",
                          N: {
                            d: "M19,19 L5,19 L5,5 L12,5 L12,3 L5,3 C3.89,3 3,3.9 3,5 L3,19 C3,20.1 3.89,21 5,21 L19,21 C20.1,21 21,20.1 21,19 L21,12 L19,12 L19,19 Z M14,3 L14,5 imul.59,5 L7.76,14.83 L9.17,16.24 L19,6.41 L19,10 L21,10 L21,3 L14,3 Z",
                            fill: "#fff",
                            "fill-rule": "nonzero",
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
      ],
    });

    /** @type {Object} The player API [was: U] */
    this.playerApi = player; // was: this.U

    this.listen("click", this.onClick, this);
    this.updateValue("title", sP(player, "Expand", "i"));
    this.update({ "data-title-no-tooltip": "Expand" });
    this.addOnDisposeCallback(Zr(parentUI.d6(), this.element));
  }

  /** Fires the expand-miniplayer event on click. */
  onClick() {
    xt(this.playerApi, "onExpandMiniplayer");
  }
}

// ── Miniplayer UI ───────────────────────────────────────────────────

/**
 * Full miniplayer UI overlay with play/pause, prev/next, progress bar,
 * close, replay, and expand controls.
 * [was: kO9]
 * Source lines: 84–304
 */
export class MiniplayerUI extends k { // was: kO9
  constructor(player) {
    super({ C: "div", Z: "ytp-miniplayer-ui" });

    /** @type {boolean} Whether the document picture-in-picture mode is active [was: D] */
    this.isDocumentPiP = false; // was: this.D

    /** @type {boolean} Whether the UI has been initialized [was: j] */
    this.isInitialized = false; // was: this.j

    /**
     * Accessor bag exposed to child components.
     * [was: Rk]
     */
    this.Rk = {
      zS: () => this.topRightButtons, // was: zS
      resetSpeedmaster: (state) => {
        this.onStateChange(state); // was: B6
      },
      VB: () => this.prevButton, // was: VB
      nextButton: () => this.nextButton,
      Yy: () => this.thumbnailOverlay, // was: Yy
    };

    /** @type {Object} The player API */
    this.player = player;

    this.B(player, "minimized", this.onMinimized); // was: Qf
    this.B(player, "onStateChange", this.onStateChange); // was: B6
    this.B(player, "documentpictureinpicturechange", this.onDocumentPiPChange); // was: S
  }

  /**
   * Shows the miniplayer overlay, creating sub-components on first call.
   * Source lines: 106–218
   */
  show() {
    /** @type {AnimationFrame|undefined} Progress polling frame [was: W] */
    this.progressFrame = new T5(this.onProgressTick, null, this); // was: this.W -> this.L
    this.progressFrame.start();

    if (!this.isInitialized) {
      this.tooltip = new Tooltip(this.player, this);
      F(this, this.tooltip);
      f8(this.player, this.tooltip.element, 4);
      this.tooltip.scale = 0.6;

      /** @type {PlayerOverlay} [was: r6] */
      this.overlay = new Lp1(this.player); // was: this.r6
      F(this, this.overlay);

      /** @type {ProgressBar} */
      this.progressBar = new ProgressBarContainer(this.player, this);
      F(this, this.progressBar);
      f8(this.player, this.progressBar.element, 4);

      /** @type {Component} Scrim overlay [was: O] */
      this.scrim = new k({ C: "div", Z: "ytp-miniplayer-scrim" }); // was: this.O
      F(this, this.scrim);
      this.scrim.createVisualElement(this.element);
      this.B(this.scrim.element, "click", this.onScrimClick); // was: J

      // Close button (on scrim)
      let closeButton = new k({
        C: "button",
        yC: ["ytp-miniplayer-close-button", "ytp-button"],
        N: { "aria-label": "Close" },
        V: [e_()],
      });
      F(this, closeButton);
      closeButton.createVisualElement(this.scrim.element);
      this.B(closeButton.element, "click", this.onClose); // was: K

      // Expand button (on scrim)
      let expandButton = new ExpandWatchPageButton(this.player, this);
      F(this, expandButton);
      expandButton.createVisualElement(this.scrim.element);

      /** @type {Component} Controls container [was: A] */
      this.controlsContainer = new k({ C: "div", Z: "ytp-miniplayer-controls" }); // was: this.A
      F(this, this.controlsContainer);
      this.controlsContainer.createVisualElement(this.scrim.element);
      this.B(this.controlsContainer.element, "click", this.onScrimClick);

      // Prev button container
      const prevContainer = new k({ C: "div", Z: "ytp-miniplayer-button-container" });
      F(this, prevContainer);
      prevContainer.createVisualElement(this.controlsContainer.element);

      // Play button container
      const playContainer = new k({ C: "div", Z: "ytp-miniplayer-play-button-container" });
      F(this, playContainer);
      playContainer.createVisualElement(this.controlsContainer.element);

      // Next button container
      const nextContainer = new k({ C: "div", Z: "ytp-miniplayer-button-container" });
      F(this, nextContainer);
      nextContainer.createVisualElement(this.controlsContainer.element);

      /** @type {NavigationButton} Previous track button [was: VB] */
      this.prevButton = new pi(this.player, this, false); // was: this.VB
      F(this, this.prevButton);
      this.prevButton.createVisualElement(prevContainer.element);

      // Play/pause button
      const playButton = new yP1(this.player, this);
      F(this, playButton);
      playButton.createVisualElement(playContainer.element);

      /** @type {NavigationButton} Next track button */
      this.nextButton = new pi(this.player, this, true);
      F(this, this.nextButton);
      this.nextButton.createVisualElement(nextContainer.element);

      /** @type {ThumbnailOverlay} [was: Yy] */
      this.thumbnailOverlay = new TimeDisplay(this.player, this, 0); // was: this.Yy
      F(this, this.thumbnailOverlay);
      this.thumbnailOverlay.createVisualElement(this.scrim.element);

      /** @type {Component} Top-right button bar [was: zS] */
      this.topRightButtons = new k({ C: "div", Z: "ytp-miniplayer-buttons" }); // was: this.zS
      F(this, this.topRightButtons);
      f8(this.player, this.topRightButtons.element, 4);

      // Close button (top-right)
      closeButton = new k({
        C: "button",
        yC: ["ytp-miniplayer-close-button", "ytp-button"],
        N: { "aria-label": "Close" },
        V: [e_()],
      });
      F(this, closeButton);
      closeButton.createVisualElement(this.topRightButtons.element);
      this.B(closeButton.element, "click", this.onClose);

      // Replay button (top-right)
      const replayButton = new k({
        C: "button",
        yC: ["ytp-miniplayer-replay-button", "ytp-button"],
        N: { "aria-label": "Close" },
        V: [getStreamTimeOffsetNQ],
      });
      F(this, replayButton);
      replayButton.createVisualElement(this.topRightButtons.element);
      this.B(replayButton.element, "click", this.onReplay); // was: b0

      // Expand button (top-right)
      expandButton = new ExpandWatchPageButton(this.player, this);
      F(this, expandButton);
      expandButton.createVisualElement(this.topRightButtons.element);

      this.B(this.player, "presentingplayerstatechange", this.onPresentingStateChange); // was: Y
      this.B(this.player, "appresize", this.onResize); // was: b3
      this.B(this.player, "fullscreentoggled", this.onResize);

      if (this.player.X("fix_ad_miniplayer_controls_rendering")) {
        applyAdMiniplayerControlsFix(this);
      }
      this.onResize();
      this.isInitialized = true;
    }

    if (this.player.getPlayerState() !== 0) {
      super.show();
    }
    this.progressBar.show();
    this.player.unloadModule("annotations_module");
  }

  /** Hides the miniplayer UI. Source lines: 219–225 */
  hide() {
    if (this.progressFrame) {
      this.progressFrame.dispose();
      this.progressFrame = undefined;
    }
    super.hide();
    if (!this.player.isMinimized()) {
      if (this.isInitialized) this.progressBar.hide();
      this.player.loadModule("annotations_module");
    }
  }

  /** Disposes resources. [was: WA] Source lines: 226–230 */
  disposeApp() {
    if (this.progressFrame) {
      this.progressFrame.dispose();
      this.progressFrame = undefined;
    }
    super.disposeApp();
  }

  /** Closes the miniplayer. [was: K] Source lines: 231–234 */
  onClose() {
    if (!this.player.X("kevlar_watch_while_v2")) {
      this.player.stopVideo();
    }
    xt(this.player, "onCloseMiniplayer");
  }

  /** Replays the video. [was: b0] Source line: 236 */
  onReplay() {
    this.player.playVideo();
  }

  /**
   * Toggles play/pause when clicking the scrim or controls background.
   * [was: J]
   * Source lines: 238–241
   */
  onScrimClick(event) {
    if (event.target === this.scrim.element || event.target === this.controlsContainer.element) {
      if (this.player.getPlayerStateObject().isOrWillBePlaying()) {
        this.player.pauseVideo();
      } else {
        this.player.playVideo();
      }
    }
  }

  /** Handles the "minimized" event. [was: Qf] Source lines: 242–244 */
  onMinimized() {
    setPlayerMinimizedClass(this, this.player.isMinimized());
  }

  /** Handles document picture-in-picture changes. [was: S] Source lines: 245–249 */
  onDocumentPiPChange() {
    setPlayerMinimizedClass(this, this.player.Zh());
    L(this.player.getRootNode(), "ytp-player-document-picture-in-picture", this.player.Zh());
    this.isDocumentPiP = this.player.Zh();
  }

  /** Updates progress bar and thumbnail. Source lines: 250–253 */
  onProgress() {
    this.progressBar.kx();
    this.thumbnailOverlay.kx();
  }

  /** Frame callback to poll progress. [was: L] Source lines: 254–257 */
  onProgressTick() {
    this.onProgress();
    if (this.progressFrame) this.progressFrame.start();
  }

  /** Hides tooltip when seeking. [was: Y] Source lines: 258–260 */
  onPresentingStateChange(event) {
    if (event.state.W(32)) this.tooltip.hide();
  }

  /** Resizes progress bar to match player width. [was: b3] Source lines: 261–265 */
  onResize() {
    const width = this.player.bX().getPlayerSize().width;
    resizeSeekBar(this.progressBar, 0, width, false);
    oi(this.progressBar);
  }

  /**
   * Reacts to player state changes — shows/hides based on minimized and PiP state.
   * [was: B6]
   * Source lines: 266–270
   */
  onStateChange(state) {
    if (this.player.X("fix_ad_miniplayer_controls_rendering")) {
      applyAdMiniplayerControlsFix(this);
    }
    if (this.player.isMinimized() || (this.player.X("web_watch_pip") && this.isDocumentPiP)) {
      if (state === 0) this.hide();
      else this.show();
    }
  }

  /** Returns the tooltip component. [was: d6] */
  d6() {
    return this.tooltip;
  }

  /**
   * Positions a tooltip element relative to the miniplayer.
   * [was: wS]
   * Source lines: 274–303
   */
  wS(tooltipEl, triggerEl, cursorX, unused, extraOffsetY) {
    let topOffset = 0;
    let bottomOffset = 0;
    let leftOffset = 0;
    let tooltipSize = A4(tooltipEl);
    const isNavButton = triggerEl && (B7(triggerEl, "ytp-prev-button") || B7(triggerEl, "ytp-next-button"));

    if (triggerEl) {
      const isPlayButton = B7(triggerEl, "ytp-play-button");
      const isExpandButton = B7(triggerEl, "ytp-miniplayer-expand-watch-page-button");

      if (isNavButton) {
        topOffset = leftOffset = 12;
      } else if (isPlayButton) {
        const offset = Ia(triggerEl, this.element);
        leftOffset = offset.x;
        topOffset = offset.y - 12;
      } else if (isExpandButton) {
        const isTopLeft = B7(triggerEl, "ytp-miniplayer-button-top-left");
        const pos = Ia(triggerEl, this.element);
        const triggerSize = A4(triggerEl);
        if (isTopLeft) {
          leftOffset = 8;
          topOffset = pos.y + 40;
        } else {
          leftOffset = pos.x - tooltipSize.width + triggerSize.width;
          topOffset = pos.y - 20;
        }
      }
    } else {
      leftOffset = cursorX - tooltipSize.width / 2;
      bottomOffset = 25 + (extraOffsetY || 0);
    }

    const playerSize = this.player.bX().getPlayerSize();
    const computedTop = topOffset + (extraOffsetY || 0);
    const clampedLeft = lm(leftOffset, 0, playerSize.width - tooltipSize.width - 12);

    if (computedTop) {
      tooltipEl.style.top = `${computedTop}px`;
      tooltipEl.style.bottom = "";
    } else {
      tooltipEl.style.top = "";
      tooltipEl.style.bottom = `${bottomOffset}px`;
    }

    tooltipEl.style.left = `${clampedLeft}px`;
    const isPreview = B7(tooltipEl, "ytp-preview");
    tooltipEl.style.visibility = isNavButton && isPreview && playerSize.height < 225 ? "hidden" : "";
  }
}
