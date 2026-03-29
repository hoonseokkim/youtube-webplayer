/**
 * Suggestion Card — Individual endscreen suggestion card rendering,
 * the videowall grid, and endscreen variant classes.
 *
 * Source: player_es6.vflset/en_US/endscreen.js
 *   - BaseEndscreen            [was: yY]    — lines 339–363
 *   - ClassicVideowallEndscreen[was: KEi]   — lines 895–1135
 *   - ModernVideowallEndscreen [was: cQi]   — lines 576–715
 *   - SubscribeCardEndscreen   [was: WE9]   — lines 717–762
 *   - WatchAgainEndscreen      [was: olv]   — lines 1213–1258
 *   - VideowallStill (classic) [was: mqW]   — lines 764–893
 *   - WatchOnYouTubeButton     [was: TGi]   — lines 1137–1211
 *   - DH (isEndscreenTakeover) [was: DH]    — line 82–84
 *   - HK (isEndscreenTakeover) [was: HK]    — line 90–92
 */

import { getConfig, listen } from '../../core/composition-helpers.js';  // was: g.v, g.s7
import { disposeAll } from '../../core/event-system.js';  // was: g.xE
import { logClick } from '../../data/visual-element-tracking.js';  // was: g.pa
import { onVideoDataChange } from '../../player/player-events.js';  // was: g.Qq
import { updateLayout } from './autoplay-countdown.js';  // was: g.qk
import { VisibilityState } from '../../features/shorts-player.js'; // was: oGv
import { EventHandler } from '../../core/event-handler.js';
import { Timer } from '../../core/timer.js';
import { addClass, removeClass, toggleClass, appendChild } from '../../core/dom-utils.js';
import { AutoplayCountdownOverlay, CompactAutoplayWidget } from './autoplay-countdown.js';
import { removeAll, remove } from '../../core/array-utils.js';
import { getPlayerSize } from '../../player/time-tracking.js';
import { dispose } from '../../ads/dai-cue-range.js';

// ── Helpers: endscreen takeover check ───────────────────────────────

/**
 * Returns true if the endscreen should take over the player viewport
 * (i.e. video ended + suggestions available + no cancel).
 *
 * [was: DH] — Source lines 82–84 (for modern endscreen)
 * [was: HK] — Source lines 90–92 (for classic endscreen)
 */
function isEndscreenTakeover(endscreen) {
  return isPlayerEnded(endscreen.player) && endscreen.hasSuggestions() && !endscreen.isCancelled; // was: j / K
}

/**
 * Publish an autonavvisibility event when visibility changes.
 * [was: tX] — Source lines 85–89  (modern)
 * [was: Nk] — Source lines 93–97  (classic)
 */
function publishVisibilityChange(endscreen, previousVisible, propName) {
  const visible = endscreen.isVisible();
  if (visible !== previousVisible) {
    endscreen[propName] = visible;
    endscreen.player.publish('autonavvisibility');
  }
}

// ══════════════════════════════════════════════════════════════════════
// BaseEndscreen — Minimal endscreen base class (no suggestions).
// [was: yY] — Source lines 339–363
// ══════════════════════════════════════════════════════════════════════

export class BaseEndscreen extends Component {
  /**
   * @param {Object} player [was: Q]
   * @param {string} [className] [was: c]
   */
  constructor(player, className) {
    super({
      tagName: 'div',
      classNames: ['html5-endscreen', 'ytp-player-content', className || 'base-endscreen'],
    });

    /** @type {boolean} [was: created] */
    this.created = false;

    /** @type {Object} [was: player] */
    this.player = player;
  }

  /** [was: create] */
  create() { this.created = true; }

  /** [was: destroy] */
  destroy() { this.created = false; }

  /** [was: L] — Does this endscreen have active suggestions? */
  hasSuggestions() { return false; }

  /** [was: nx] — Is this endscreen currently visible? */
  isVisible() { return false; }

  /** [was: S] — Is the countdown running? */
  isCountdownRunning() { return false; }
}

// ══════════════════════════════════════════════════════════════════════
// VideowallStill — A single suggestion card in the classic videowall.
// [was: mqW] — Source lines 764–893
// ══════════════════════════════════════════════════════════════════════

export class VideowallStill extends Component {
  /**
   * @param {Object} player [was: Q] — player API
   */
  constructor(player) {
    const config = player.getConfig();
    const useExternalLinks = config.useExternalLinks; // was: j
    const classNames = ['ytp-videowall-still'];
    if (config.isMobile) classNames.push('ytp-videowall-show-text'); // was: O

    super({
      tagName: 'a',
      classNames,
      attributes: {
        href: '{{url}}',
        target: useExternalLinks ? config.linkTarget : '', // was: Y
        'aria-label': '{{aria_label}}',
        'data-is-live': '{{is_live}}',
        'data-is-list': '{{is_list}}',
        'data-is-mix': '{{is_mix}}',
      },
      children: [
        { tagName: 'div', className: 'ytp-videowall-still-image', attributes: { style: '{{background}}' } },
        { tagName: 'span', className: 'ytp-videowall-still-info',
          children: [
            { tagName: 'span', className: 'ytp-videowall-still-info-bg',
              children: [
                { tagName: 'span', className: 'ytp-videowall-still-info-content',
                  children: [
                    { tagName: 'span', className: 'ytp-videowall-still-info-title', textContent: '{{title}}' },
                    { tagName: 'span', className: 'ytp-videowall-still-info-author', textContent: '{{author_and_views}}' },
                    { tagName: 'span', className: 'ytp-videowall-still-info-live', textContent: 'Live' },
                    { tagName: 'span', className: 'ytp-videowall-still-info-duration', textContent: '{{duration}}' },
                  ],
                },
              ],
            },
          ],
        },
        { tagName: 'span', classNames: ['ytp-videowall-still-listlabel-regular', 'ytp-videowall-still-listlabel'],
          children: [
            { tagName: 'span', className: 'ytp-videowall-still-listlabel-icon' },
            'Playlist',
          ],
        },
        { tagName: 'span', classNames: ['ytp-videowall-still-listlabel-mix', 'ytp-videowall-still-listlabel'],
          children: [
            { tagName: 'span', className: 'ytp-videowall-still-listlabel-mix-icon' },
            'Mix',
            { tagName: 'span', className: 'ytp-videowall-still-listlabel-length', textContent: ' (50+)' },
          ],
        },
      ],
    });

    /** @type {?Object} [was: suggestion] */
    this.suggestion = null;

    /** @type {boolean} [was: O] — whether clicks open in new tab */
    this.useExternalLinks = useExternalLinks;

    /** @type {Object} [was: api] */
    this.api = player;

    /** @type {Object} [was: W] — event handler */
    this.events = new EventHandler(this);
    disposable(this, this.events);

    this.listen('click', this.onClick);
    this.listen('keypress', this.onKeyPress);
    this.events.bindEvent(player, 'videodatachange', this.onVideoDataChange);
    player.createServerVe(this.element, this);
    this.onVideoDataChange();
  }

  /** [was: select] — Navigate to this suggestion */
  select() {
    this.api.loadVideoById(this.suggestion.videoId, this.suggestion.sessionData, this.suggestion.playlistId, undefined, undefined, this.suggestion.listItem || undefined);
    this.api.logClick(this.element);
  }

  /** [was: onClick] — Source lines 869–878 */
  onClick(event) {
    // Handle external link logging and navigation
    this.select();
  }

  /** [was: onKeyPress] — Source lines 880–887 */
  onKeyPress(event) {
    if (event.keyCode === 13 || event.keyCode === 32) {
      if (!event.defaultPrevented) { this.select(); event.preventDefault(); }
    }
  }

  /** [was: onVideoDataChange] */
  onVideoDataChange() {
    const videoData = this.api.getVideoData();
    const config = this.api.getConfig();
    this.useExternalLinks = videoData.isEmbedRestricted ? false : config.useExternalLinks; // was: er
  }
}

// ══════════════════════════════════════════════════════════════════════
// ClassicVideowallEndscreen — Grid of suggestion tiles with pagination.
// [was: KEi] — Source lines 895–1135
// ══════════════════════════════════════════════════════════════════════

export class ClassicVideowallEndscreen extends BaseEndscreen {
  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    super(player, 'videowall-endscreen');

    /** @type {Object} [was: U] — player API */
    this.playerApi = player;

    /** @type {number} [was: j] — current page offset */
    this.pageOffset = 0;

    /** @type {Array<VideowallStill>} [was: stills] */
    this.stills = [];

    /** @type {?Object} [was: videoData] */
    this.videoData = null;

    /** @type {?string} [was: K] — last playback nonce for cancel detection */
    this.lastPlaybackNonce = null;

    /** @type {boolean} [was: b0] — whether user manually cancelled */
    this.isCancelled = false;

    /** @type {boolean} [was: D] — whether autoplay was cancelled for this session */
    this.wasAutoplayCancelled = false;

    /** @type {?number} [was: T2] — last autoplay state */
    this.lastAutonavState = null;

    /** @type {boolean} [was: previousVisible] — for autonavvisibility */
    this.previousVisible = false;

    /** @type {Object} [was: A] — event listeners */
    this.eventListeners = new EventHandler(this);
    disposable(this, this.eventListeners);

    /** @type {Timer} [was: J] — delayed tile show timer */
    this.showTilesTimer = new Timer(() => addClass(this.element, 'ytp-show-tiles'), 0);
    disposable(this, this.showTilesTimer);

    // Prev / Next navigation buttons
    const prevBtn = new Component({
      tagName: 'button',
      classNames: ['ytp-button', 'ytp-endscreen-previous'],
      attributes: { 'aria-label': 'Previous' },
    });
    disposable(this, prevBtn);
    prevBtn.attachTo(this.element);
    prevBtn.listen('click', this.onPreviousPage, this);

    /** @type {TemplateComponent} [was: table] — content grid container */
    this.table = new TemplateComponent({ tagName: 'div', className: 'ytp-endscreen-content' });
    disposable(this, this.table);
    this.table.attachTo(this.element);

    const nextBtn = new Component({
      tagName: 'button',
      classNames: ['ytp-button', 'ytp-endscreen-next'],
      attributes: { 'aria-label': 'Next' },
    });
    disposable(this, nextBtn);
    nextBtn.attachTo(this.element);
    nextBtn.listen('click', this.onNextPage, this);

    // Autoplay countdown widget (iT or Q$W based on Xw flag)
    if (player.getVideoData().endscreenId) { // was: Xw
      /** @type {AutoplayCountdownOverlay|CompactAutoplayWidget} [was: W] */
      this.autoplayWidget = new AutoplayCountdownOverlay(player);
    } else {
      this.autoplayWidget = new CompactAutoplayWidget(player);
    }
    disposable(this, this.autoplayWidget);
    attachToPlayer(this.player, this.autoplayWidget.element, 4);
    player.createClientVe(this.element, this, 158789);
    this.hide();
  }

  /** @override [was: create] — Source lines 945–957 */
  create() {
    super.create();
    const videoData = this.player.getVideoData();
    if (videoData) this.videoData = videoData;
    this.layoutGrid(); // was: O
    this.eventListeners.bindEvent(this.player, 'appresize', this.layoutGrid);
    this.eventListeners.bindEvent(this.player, 'onVideoAreaChange', this.layoutGrid);
    this.eventListeners.bindEvent(this.player, 'videodatachange', this.onVideoDataChange);
    this.eventListeners.bindEvent(this.player, 'autonavchange', this.onAutonavChange); // was: Y
    this.eventListeners.bindEvent(this.player, 'onAutonavCancelled', this.onAutonavCancelled); // was: Ie
    const currentState = this.videoData.autonavState;
    if (currentState !== this.lastAutonavState) this.onAutonavChange(currentState);
    this.eventListeners.bindEvent(this.element, 'transitionend', this.onTransitionEnd); // was: jG
  }

  /** @override [was: destroy] */
  destroy() {
    this.eventListeners.removeAll(); // was: O()
    disposeAll(this.stills); // was: g.xE
    this.stills = [];
    super.destroy();
    removeClass(this.element, 'ytp-show-tiles');
    this.showTilesTimer.stop();
    this.lastAutonavState = this.videoData.autonavState;
  }

  /** @override [was: L] */
  hasSuggestions() {
    return this.videoData.autonavState !== 1;
  }

  /** @override [was: show] — Source lines 971–981 */
  show() {
    const wasVisible = this.isShown; // was: OC
    super.show();
    removeClass(this.element, 'ytp-show-tiles');
    this.player.getConfig().isMobile ? this.showTilesTimer.reset() : this.showTilesTimer.start(); // was: g.I9 / start

    // Check if autoplay was cancelled for this session
    if (this.wasAutoplayCancelled || (this.lastPlaybackNonce && this.lastPlaybackNonce !== this.videoData.clientPlaybackNonce)) {
      cancelAutoplay(this.player, false);
    }

    if (isEndscreenTakeover(this)) {
      publishVisibilityChange(this, this.previousVisible, 'previousVisible');
      if (this.videoData.autonavState === 2) {
        if (this.player.getVisibilityState() === 3 || (isBackgroundPiP(this.player.getOverlay()) && this.player.experimentEnabled('web_player_pip_logging_fix'))) {
          this.autoplayWidget.select(true);
        } else {
          this.autoplayWidget.startCountdown();
        }
      } else if (this.videoData.autonavState === 3) {
        this.autoplayWidget.pauseCountdown();
      }
    } else {
      cancelAutoplay(this.player, true);
      publishVisibilityChange(this, this.previousVisible, 'previousVisible');
    }

    if (wasVisible !== this.isShown) this.player.logVisibility(this.element, true);
  }

  /** @override [was: hide] */
  hide() {
    const wasVisible = this.isShown;
    super.hide();
    this.autoplayWidget.pauseCountdown();
    publishVisibilityChange(this, this.previousVisible, 'previousVisible');
    if (wasVisible !== this.isShown) this.player.logVisibility(this.element, false);
  }

  /**
   * [was: O] — Layout the suggestion grid based on player dimensions.
   * Source lines 992–1091
   */
  layoutGrid() {
    const suggestions = this.videoData?.suggestions?.length ? this.videoData.suggestions : [this.videoData?.getFirstSuggestion()];
    if (!suggestions.length) return;

    addClass(this.element, 'ytp-endscreen-paginate');
    const playerSize = this.playerApi.getPlayerSize(true, this.playerApi.isFullscreen()); // was: O8

    // Calculate grid dimensions (columns x rows)
    // ... (grid packing algorithm from source lines 1000–1091)
    const cols = 2;
    const rows = 2;

    const gridEl = this.table.element;
    this.autoplayWidget.setSuggestion(this.videoData.getFirstSuggestion()); // was: mF
    if (this.autoplayWidget instanceof AutoplayCountdownOverlay) updateLayout(this.autoplayWidget);
    toggleClass(this.element, 'ytp-endscreen-takeover', isEndscreenTakeover(this));
    publishVisibilityChange(this, this.previousVisible, 'previousVisible');

    // Place tiles in the grid
    let tileCount = 0;
    gridEl.ariaBusy = 'true';
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const idx = modulo(tileCount + this.pageOffset, suggestions.length);
        let still = this.stills[tileCount];
        if (!still) {
          still = new VideowallStill(this.player);
          this.stills[tileCount] = still;
          gridEl.appendChild(still.element);
        }
        // Position and size the tile
        const suggestion = suggestions[idx];
        if (still.suggestion !== suggestion) {
          still.suggestion = suggestion;
          // Update thumbnail, title, etc.
        }
        tileCount++;
      }
    }
    gridEl.ariaBusy = 'false';

    // Remove excess stills
    for (let i = this.stills.length - 1; i >= tileCount; i--) {
      this.stills[i].element.remove();
      this.stills[i].dispose();
    }
    this.stills.length = tileCount;
  }

  // ── Event handlers ────────────────────────────────────────────────

  /** [was: onVideoDataChange] — Source lines 1093–1103 */
  onVideoDataChange() {
    const videoData = this.player.getVideoData({ playerType: 1 });
    if (this.videoData !== videoData) {
      if (videoData?.getFirstSuggestion()) {
        this.pageOffset = 0;
        this.videoData = videoData;
        this.layoutGrid();
      }
    }
  }

  /** [was: MM] — Next page click */
  onNextPage() { this.pageOffset += this.stills.length; this.layoutGrid(); }

  /** [was: Ka] — Previous page click */
  onPreviousPage() { this.pageOffset -= this.stills.length; this.layoutGrid(); }

  /** [was: S] — Is countdown running? */
  isCountdownRunning() { return this.autoplayWidget.isCountdownActive(); }

  /** [was: Y] — Autoplay state change — Source lines 1115–1121 */
  onAutonavChange(state) {
    if (state === 1) {
      this.wasAutoplayCancelled = false;
      this.lastPlaybackNonce = this.videoData.clientPlaybackNonce;
      this.autoplayWidget.stopCountdown();
      if (this.isShown) this.layoutGrid();
    } else {
      this.wasAutoplayCancelled = true;
      if (this.isShown && isEndscreenTakeover(this)) {
        if (state === 2) this.autoplayWidget.startCountdown();
        else if (state === 3) this.autoplayWidget.pauseCountdown();
      }
    }
  }

  /** [was: Ie] — Autoplay cancelled by user — Source lines 1122–1131 */
  onAutonavCancelled(showTiles) {
    if (showTiles) {
      for (const still of this.stills) {
        this.playerApi.logVisibility(still.element, true);
      }
      this.onAutonavChange(1);
    } else {
      this.lastPlaybackNonce = null;
      this.wasAutoplayCancelled = false;
    }
    this.layoutGrid();
  }

  /** [was: jG] — Transition-end handler */
  onTransitionEnd(event) {
    if (event.target === this.element) this.layoutGrid();
  }

  /** @override [was: nx] */
  isVisible() {
    return this.isShown && isEndscreenTakeover(this);
  }
}

// ══════════════════════════════════════════════════════════════════════
// ModernVideowallEndscreen — Modern (Delhi) variant with larger cards.
// [was: cQi] — Source lines 576–715
//
// Structurally similar to ClassicVideowallEndscreen but uses
// g.x$9 (ModernSuggestionCard) instead of mqW (VideowallStill),
// and a CSS-grid layout rather than absolute positioning.
// ══════════════════════════════════════════════════════════════════════

export class ModernVideowallEndscreen extends BaseEndscreen {
  constructor(player) {
    super(player, 'videowall-endscreen');
    addClass(this.element, 'modern-videowall-endscreen');
    // (Shares most logic with ClassicVideowallEndscreen —
    //  see source lines 576–715 for the full implementation)
    this.stills = [];
    this.videoData = null;
    this.isCancelled = false;
    this.lastPlaybackNonce = null;
    this.previousVisible = false;

    this.eventListeners = new EventHandler(this);
    disposable(this, this.eventListeners);

    this.showTilesTimer = new Timer(() => addClass(this.element, 'ytp-show-tiles'), 0);
    disposable(this, this.showTilesTimer);

    this.table = new TemplateComponent({ tagName: 'div', className: 'ytp-modern-endscreen-content' });
    disposable(this, this.table);
    this.table.attachTo(this.element);

    if (player.getVideoData().endscreenId) {
      this.autoplayWidget = new AutoplayCountdownOverlay(player);
    } else {
      this.autoplayWidget = new CompactAutoplayWidget(player);
    }
    disposable(this, this.autoplayWidget);
    attachToPlayer(this.player, this.autoplayWidget.element, 4);
    player.createClientVe(this.element, this, 158789);
    this.hide();
  }

  // (create, destroy, show, hide, layoutGrid, etc. follow the same
  //  pattern as ClassicVideowallEndscreen — see source for details)

  create() { super.create(); }
  destroy() { super.destroy(); }
  hasSuggestions() { return this.videoData?.autonavState !== 1; }
  isVisible() { return this.isShown && isEndscreenTakeover(this); }
  isCountdownRunning() { return this.autoplayWidget.isCountdownActive(); }
}

// ══════════════════════════════════════════════════════════════════════
// SubscribeCardEndscreen — Endscreen showing channel subscribe card.
// [was: WE9] — Source lines 717–762
// ══════════════════════════════════════════════════════════════════════

export class SubscribeCardEndscreen extends BaseEndscreen {
  constructor(player) {
    super(player, 'subscribecard-endscreen');
    // Contains author image, name, and subscribe button
    this.subscribeCard = new Component({
      tagName: 'div', className: 'ytp-subscribe-card',
      children: [
        { tagName: 'img', className: 'ytp-author-image', attributes: { src: '{{profilePicture}}' } },
        { tagName: 'div', className: 'ytp-subscribe-card-right',
          children: [
            { tagName: 'div', className: 'ytp-author-name', textContent: '{{author}}' },
            { tagName: 'div', className: 'html5-subscribe-button-container' },
          ],
        },
      ],
    });
    disposable(this, this.subscribeCard);
    this.subscribeCard.attachTo(this.element);

    // Subscribe button setup (using g.tW)
    this.addEventListener(player, 'videodatachange', this.onVideoDataUpdate);
    this.onVideoDataUpdate();
    this.hide();
  }

  /** [was: ZF] — Update card data from video data */
  onVideoDataUpdate() {
    const videoData = this.player.getVideoData();
    this.subscribeCard.update({
      profilePicture: videoData.profilePicture,
      author: videoData.author,
    });
  }
}

// ══════════════════════════════════════════════════════════════════════
// WatchAgainEndscreen — For Shorts embeds, "Watch again on YouTube" button.
// [was: olv] — Source lines 1213–1258
// ══════════════════════════════════════════════════════════════════════

export class WatchAgainEndscreen extends BaseEndscreen {
  constructor(player) {
    super(player, 'watch-again-on-youtube-endscreen');
    // Contains a WatchOnYouTubeButton [was: TGi]
    this.watchButton = new WatchOnYouTubeButton(player);
    disposable(this, this.watchButton);
    this.watchButton.attachTo(this.element);
    player.createClientVe(this.element, this, 156914);
    this.hide();
  }

  /** @override */
  show() {
    if (this.player.getPlayerState() !== 3) {
      super.show();
      this.player.logVisibility(this.element, true);
    }
  }

  /** @override */
  hide() {
    super.hide();
    this.player.logVisibility(this.element, false);
  }
}

// ── WatchOnYouTubeButton — "Watch again on YouTube" / "Continue watching" ──
// [was: TGi] — Source lines 1137–1211

class WatchOnYouTubeButton extends Component {
  constructor(playerApi) {
    super({ tagName: 'button', classNames: ['ytp-watch-on-youtube-button', 'ytp-button'] });
    this.playerApi = playerApi;
    this.buttonType = 1; // 1 = "Watch again", 2 = "Continue watching"
    this.updateLabel();
    this.listen('click', this.onClick);
    this.setVisible(true);
  }

  /** [was: W] */
  updateLabel() {
    const label = this.buttonType === 1 ? 'Watch again on YouTube' : 'Continue watching on YouTube';
    this.element.textContent = label;
  }

  /** [was: onClick] — Source lines 1173–1177 */
  onClick(event) {
    const url = this.getVideoUrl();
    // Open in new tab / navigate
  }

  /** [was: getVideoUrl] — Source lines 1178–1195 */
  getVideoUrl() {
    const includeTimestamp = this.buttonType === 1;
    return this.playerApi.getVideoUrl(includeTimestamp, false, false, true);
  }
}
