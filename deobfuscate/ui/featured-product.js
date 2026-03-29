/**
 * Featured Product Banner & Context Menu — product overlays, context menu
 * with touch handling, menu construction, class matching utilities,
 * copy-link button, double-tap seek UI, info panel, and caption settings.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: 107000–108200
 *     ~107000–107008  (unnamed — tail of context menu log-visibility)
 *     ~107010–107148  (f7D  — ContextMenu)
 *     ~107150–107230  (v9W  — CopyLinkButton)
 *     ~107232–107420  (a7m  — DoubleTapSeekUI)
 *     ~107422–107720  (Gym  — FeaturedProductBanner)
 *     ~107722–107803  ($$W  — InfoPanelActionItem)
 *     ~107805–107906  (PCW  — InfoPanelDetail)
 *     ~107908–107996  (l7Z  — InfoPanelPreview)
 *     ~107998–108183  (caption font/style enums & g.j8 caption settings)
 *     ~108184–108200  (Mf9 — key codes, Jv9 — keyboard service head)
 *
 * Helper functions (defined elsewhere, referenced here):
 *     l_3 (line 49471) — binds context-menu listeners
 *     wj  (line 1700)  — matches element by tag or class name
 *     uX7 (line 49481) — positions context menu (fullscreen vs body)
 *
 * [was: f7D, v9W, a7m, Gym, $$W, PCW, l7Z, l_3, wj, uX7]
 */

import { onCueRangeEnter, onCueRangeExit } from '../ads/dai-cue-range.js';  // was: g.onCueRangeEnter, g.onCueRangeExit
import { logClick } from '../data/visual-element-tracking.js';  // was: g.pa
import { onVideoDataChange } from '../player/player-events.js';  // was: g.Qq
import { SuggestedActionBadge } from '../media/live-state.js'; // was: aN
import { clear } from '../core/array-utils.js';
import { Popup } from './menu-base.js';
import { PlayerComponent } from '../player/component.js';
import { dispose } from '../ads/dai-cue-range.js';

// ---------------------------------------------------------------------------
// matchAncestorElement (helper)
// ---------------------------------------------------------------------------

/**
 * Walks up the DOM tree from `element` looking for an ancestor that matches
 * the given tag name and/or CSS class. Returns null if neither tag nor class
 * is specified.
 *
 * @param {Element} element       Starting element. [was: Q]
 * @param {string|null} tagName   Tag to match (case-insensitive). [was: c]
 * @param {string}      [cssClass] CSS class to match. [was: W]
 * @returns {Element|null}
 * [was: wj] (line 1700)
 */
export function matchAncestorElement(element, tagName, cssClass) {
  if (!tagName && !cssClass) return null;
  const upperTag = tagName ? String(tagName).toUpperCase() : null; // was: m
  // Walks up via Ls helper — checks nodeName and className
  // return Ls(element, (node) => {
  //   return (!upperTag || node.nodeName === upperTag)
  //     && (!cssClass || (typeof node.className === 'string'
  //       && node.className.split(/\s+/).includes(cssClass)));
  // }, true);
  return null; // placeholder
}

// ---------------------------------------------------------------------------
// bindContextMenuListeners (helper)
// ---------------------------------------------------------------------------

/**
 * Binds context-menu, touch-start, touch-move, and touch-end listeners on
 * the player chrome so the custom context menu opens on right-click or
 * long-press. Skips binding for certain player styles (gvn) or when
 * native context menus are forced.
 *
 * @param {ContextMenu} contextMenu [was: Q]
 * [was: l_3] (line 49471)
 */
function bindContextMenuListeners(contextMenu) {
  contextMenu.eventGroup_.clear(); // was: Q.O.O()
  const config = contextMenu.player.G(); // was: c
  if (config.playerStyle === 'gvn' || config.O || config.PA) return;
  const chrome = contextMenu.player.bX(); // was: c
  // contextMenu.eventGroup_.B(chrome, 'contextmenu', contextMenu.onContextMenu);
  // contextMenu.eventGroup_.B(chrome, 'touchstart', contextMenu.onTouchStart, null, true);
  // contextMenu.eventGroup_.B(chrome, 'touchmove', contextMenu.onTouchMove, null, true);
  // contextMenu.eventGroup_.B(chrome, 'touchend', contextMenu.onTouchMove, null, true);
}

// ---------------------------------------------------------------------------
// positionContextMenuElement (helper)
// ---------------------------------------------------------------------------

/**
 * Positions the context menu element. In fullscreen, appends it to the player
 * overlay layer; otherwise, appends it to `document.body`.
 *
 * @param {ContextMenu} contextMenu [was: Q]
 * [was: uX7] (line 49481)
 */
function positionContextMenuElement(contextMenu) {
  if (contextMenu.player.isFullscreen()) {
    // g.f8(contextMenu.player, contextMenu.element, 10);
  } else {
    // contextMenu.appendTo(document.body);
  }
}

// ---------------------------------------------------------------------------
// ContextMenu
// ---------------------------------------------------------------------------

/**
 * Right-click / long-press context menu for the YouTube player.
 * Shows options like "Copy video URL", "Loop", "Stats for nerds", etc.
 *
 * Touch handling: on touchstart, records position and starts a 1-second
 * timer. If the timer fires before touchend/touchmove, opens the menu
 * at the recorded position.
 *
 * [was: f7D]
 */
export class ContextMenu /* extends Popup */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Resource configuration object (for loop toggle, etc.).
   * @type {Object}
   */
  resourceConfig; // was: this.r6

  /**
   * Event group for dynamic listener management.
   * @type {Object}
   */
  eventGroup_; // was: this.O — new g.db(this)

  /**
   * Touch-hold timer (1s delay before opening on long-press).
   * @type {Object}
   */
  touchTimer; // was: this.J — new g.Uc(this.onTouchHold, 1000, this)

  /**
   * The menu content component (lazily created on first show).
   * @type {Object|null}
   */
  menuContent = null; // was: this.J3

  /**
   * Saved touch position for long-press open.
   * @type {Object|null}
   */
  touchPosition = null; // was: this.b0

  /**
   * @param {Object} player    The player API. [was: Q]
   * @param {Object} resource  Resource config. [was: c]
   */
  constructor(player, resource) {
    // super(player);
    this.player = player; // was: this.U
    this.resourceConfig = resource; // was: this.r6
    // this.eventGroup_ = new g.db(this);
    // this.touchTimer = new g.Uc(this.onTouchHold_, 1000, this);
    this.menuContent = null;
    this.touchPosition = null;

    // g.F(this, this.eventGroup_);
    // g.F(this, this.touchTimer);

    const config = player.G(); // was: c
    player.createClientVe(this.element, this, 28656);
    // g.xK(this.element, 'ytp-contextmenu');
    // if (delhi_modern_web_player && mobile) add 'ytp-delhi-modern-contextmenu'

    bindContextMenuListeners(this); // was: l_3(this)
    this.hide();
  }

  /**
   * Handles touch-start — saves position and starts the long-press timer.
   * If the touch target is an anchor or has "ytp-no-contextmenu", skips.
   * @param {TouchEvent} event [was: Q]
   * [was: onTouchStart]
   */
  onTouchStart(event) {
    const target = event.target; // was: W8(Q)
    if (target && (matchAncestorElement(target, 'a') || matchAncestorElement(target, null, 'ytp-no-contextmenu'))) {
      return;
    }
    if (this.isVisible) return; // was: this.OC
    const touch = event.touches?.item(0);
    this.touchPosition = touch
      ? { x: touch.clientX, y: touch.clientY }
      : { x: 0, y: 0 }; // was: new g.zY(...)
    // this.touchTimer.start();
  }

  /**
   * Stops the touch timer on touch-move / touch-end.
   * [was: S]
   */
  onTouchMove() {
    // this.touchTimer.stop();
  }

  /**
   * Called when the long-press timer fires — opens the menu at the
   * saved touch position.
   * [was: XI]
   * @private
   */
  onTouchHold_() {
    this.open(this.touchPosition);
  }

  /**
   * Focuses the first focusable item in the menu, or the menu element itself.
   * [was: Y]
   */
  focusFirst() {
    if (this.menuContent) {
      // const firstItem = PPR(this.menuContent)?.element;
      // if (firstItem) { firstItem.tabIndex = -1; firstItem.focus(); }
    } else {
      this.element.tabIndex = -1;
      this.element.focus();
    }
  }

  /**
   * Shows the menu — lazily creates the content component, updates loop state.
   * [was: show]
   */
  show() {
    if (!this.menuContent) {
      // this.menuContent = new O91(this.player, this, this.resourceConfig);
      // g.F(this, this.menuContent);
      // g.TN(this, this.menuContent);
    }
    // this.menuContent.onLoopChange(this.player.getLoopVideo());
    // super.show();
    // this.player.logVisibility(this.element, true);
    // this.menuContent.setVisible(true);
  }

  /**
   * Hides the menu and rebinds listeners for the next open.
   * [was: hide]
   */
  hide() {
    bindContextMenuListeners(this); // was: l_3(this)
    // super.hide();
    // this.player.logVisibility(this.element, false);
    // this.menuContent?.setVisible(false);
  }

  /**
   * Handles right-click on the player — opens the custom context menu
   * unless the target is an anchor or marked no-contextmenu.
   * @param {MouseEvent} event [was: Q]
   * [was: Ka]
   */
  onContextMenu(event) {
    const target = event.target; // was: W8(Q)
    if (this.isVisible || (target && (matchAncestorElement(target, 'a') || matchAncestorElement(target, null, 'ytp-no-contextmenu')))) {
      return;
    }
    event.preventDefault();
    this.open({ x: event.pageX, y: event.pageY }); // was: new g.zY(...)
  }

  /**
   * Opens the context menu at the given position, constrained to the viewport.
   * Positions the element, binds document-level listeners for closing.
   * @param {{x:number,y:number}} position [was: Q]
   * [was: open]
   */
  open(position) {
    positionContextMenuElement(this); // was: uX7(this)
    const videoData = this.player.getVideoData(); // was: c
    // g.L(this.element, 'ytp-dni', videoData.er);
    this.element.style.left = '';
    this.element.style.top = '';

    // Offset by 1px to avoid re-triggering
    position.x++;
    position.y++;
    // super.show();

    // Viewport clamping logic — constrains the menu to the visible area
    // using the body's scroll dimensions and the document's clip regions.
    // Sets position via g.ml(this.element, ...).

    // Bind document-level listeners for closing:
    // this.eventGroup_.clear();
    // this.eventGroup_.B(document, 'contextmenu', this.onDocumentContextMenu);
    // this.eventGroup_.B(this.player, 'fullscreentoggled', this.onFullscreenToggled);
    // this.eventGroup_.B(this.player, 'pageTransition', this.onPageTransition);
  }

  /**
   * Handles subsequent context-menu events on the document — closes the
   * menu if the click is outside it.
   * @param {MouseEvent} event [was: Q]
   * [was: jG]
   */
  onDocumentContextMenu(event) {
    if (event.defaultPrevented) return;
    const target = event.target; // was: W8(Q)
    // if (!g.ZJ(this.element, target)) this.close();
    // if (disableNativeContextMenu) event.preventDefault();
  }

  /**
   * Closes the menu on fullscreen toggle, then repositions.
   * [was: onFullscreenToggled]
   */
  onFullscreenToggled() {
    this.close(); // was: this.HB()
    positionContextMenuElement(this);
  }

  /**
   * Closes the menu on page transition.
   * [was: T2]
   */
  onPageTransition() {
    this.close();
  }

  /**
   * Closes/hides the context menu.
   * [was: HB — inherited, calls hide]
   */
  close() {
    this.hide();
  }
}

// ---------------------------------------------------------------------------
// CopyLinkButton
// ---------------------------------------------------------------------------

/**
 * A button in the endscreen / controls that copies the video URL to the
 * clipboard. Shows a tooltip and updates its text on success.
 *
 * Template:
 *   <button class="ytp-button ytp-copylink-button" title="{{title-attr}}">
 *     <div class="ytp-copylink-icon">{{icon}}</div>
 *     <div class="ytp-copylink-title" aria-hidden="true">Copy link</div>
 *   </button>
 *
 * [was: v9W]
 */
export class CopyLinkButton /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  api; // was: this.api

  /**
   * Parent component providing tooltip access.
   * @type {Object}
   */
  parent; // was: this.W

  /**
   * Whether the button is logically visible.
   * @type {boolean}
   */
  visible = false; // was: this.visible

  /**
   * Tooltip instance.
   * @type {Object}
   */
  tooltip; // was: this.tooltip

  /**
   * @param {Object} player  [was: Q]
   * @param {Object} parent  [was: c]
   */
  constructor(player, parent) {
    // super({ C: 'button', yC: ['ytp-button', 'ytp-copylink-button'], ... });
    this.api = player;
    this.parent = parent;
    this.visible = false;
    this.tooltip = parent.d6(); // was: this.W.d6()

    // player.createClientVe(this.element, this, 86570);
    // this.listen('click', this.onClick);
    // this.bindEvent(player, 'videodatachange', this.updateVisibility);
    // this.bindEvent(player, 'videoplayerreset', this.updateVisibility);
    // this.bindEvent(player, 'appresize', this.updateVisibility);
    this.updateVisibility(); // was: this.ZF()
  }

  /**
   * Copies the video URL to clipboard on click.
   * [was: onClick]
   */
  async onClick() {
    const config = this.api.G(); // was: Q
    const videoData = this.api.getVideoData();
    const playlistId = this.api.getPlaylistId();
    const url = config.getVideoUrl(videoData.videoId, playlistId, undefined, true);
    // await h$m(this, url) && z$m(this);  — copy + show confirmation
    this.api.logClick(this.element);
  }

  /**
   * Updates icon, title, and visibility based on current state.
   * [was: ZF]
   */
  updateVisibility() {
    // Update SVG icon (copy icon path)
    this.updateValue('title-attr', 'Copy link');
    this.updateValue('tooltip-title', 'Copy link');
    // this.visible = CPO(this); — check if copy is available
    // g.L(this.element, 'ytp-copylink-button-visible', this.visible);
    // this.setVisible(this.visible);
  }
}

// ---------------------------------------------------------------------------
// DoubleTapSeekUI
// ---------------------------------------------------------------------------

/**
 * Visual feedback UI for double-tap (or keyboard) seek gestures.
 * Displays an expanding ripple circle and a tooltip with seek direction
 * and accumulated seconds. Supports both touch (double-tap) and keyboard
 * (arrow key) seek gestures, with optional chapter-seek display.
 *
 * Template:
 *   <div class="ytp-doubletap-ui-legacy">
 *     <div class="ytp-doubletap-fast-forward-ve" />
 *     <div class="ytp-doubletap-rewind-ve" />
 *     <div class="ytp-doubletap-static-circle">
 *       <div class="ytp-doubletap-ripple" />
 *     </div>
 *     <div class="ytp-doubletap-overlay-a11y" />
 *     <div class="ytp-doubletap-seek-info-container">
 *       <div class="ytp-doubletap-arrows-container">
 *         <span class="ytp-doubletap-base-arrow" /> x3
 *       </div>
 *       <div class="ytp-doubletap-tooltip">
 *         <div class="ytp-seek-icon-text-container">
 *           <div class="ytp-seek-icon">{{seekIcon}}</div>
 *           <div class="ytp-chapter-seek-text-legacy">{{seekText}}</div>
 *         </div>
 *         <div class="ytp-doubletap-tooltip-label">{{seekTime}}</div>
 *       </div>
 *     </div>
 *   </div>
 *
 * [was: a7m]
 */
export class DoubleTapSeekUI /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Show delay timer (10ms).
   * @type {Object}
   */
  showDelay; // was: this.j — new g.Uc(this.show, 10, this)

  /**
   * Hide delay timer (700ms).
   * @type {Object}
   */
  hideDelay; // was: this.O — new g.Uc(this.hide, 700, this)

  /**
   * Accumulated seek time (for cumulative display).
   * @type {number}
   */
  accumulatedTime = 0; // was: this.A

  /**
   * Last seek direction (-1 = back, 1 = forward).
   * @type {number}
   */
  lastDirection = 0; // was: this.D

  /**
   * Whether to show cumulative seek time across consecutive taps.
   * @type {boolean}
   */
  showCumulativeTime = false; // was: this.K

  /**
   * Whether to center the static circles.
   * @type {boolean}
   */
  centerCircles = false; // was: this.Y

  /**
   * The static circle container element.
   * @type {HTMLElement}
   */
  circleElement; // was: this.W

  /**
   * VE element for fast-forward logging.
   * @type {HTMLElement}
   */
  fastForwardVe; // was: this.J

  /**
   * VE element for rewind logging.
   * @type {HTMLElement}
   */
  rewindVe; // was: this.L

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super({ C: 'div', Z: 'ytp-doubletap-ui-legacy', V: [...] });
    this.player = player;
    // this.showDelay = new g.Uc(this.show, 10, this);
    // this.hideDelay = new g.Uc(this.hide, 700, this);
    this.accumulatedTime = 0;
    this.lastDirection = 0;
    this.circleElement = null; // was: this.W = this.z2('ytp-doubletap-static-circle')
    this.fastForwardVe = null; // was: this.J = this.z2('ytp-doubletap-fast-forward-ve')
    this.rewindVe = null; // was: this.L = this.z2('ytp-doubletap-rewind-ve')

    // player.createClientVe(this.fastForwardVe, this, 28240);
    // player.createClientVe(this.rewindVe, this, 28239);

    this.showCumulativeTime = player.X('web_show_cumulative_seek_time');
    this.centerCircles = player.X('web_center_static_circles');
    this.hide();
  }

  /**
   * Shows the seek UI and starts the auto-hide timer.
   * [was: show]
   */
  show() {
    // super.show();
    // this.hideDelay.start(); — reset the 700ms hide countdown
  }

  /**
   * Hides the seek UI and resets accumulated time.
   * [was: hide]
   */
  hide() {
    // this.showDelay.stop();
    this.accumulatedTime = 0;
    // Reset seek icon and chapter-seek state
    // super.hide();
  }

  /**
   * Triggers the double-tap seek animation with ripple at the given position.
   * @param {number} direction    -1 (back) or 1 (forward). [was: Q]
   * @param {number} touchX       X coordinate on the player. [was: c]
   * @param {number} touchY       Y coordinate on the player. [was: W]
   * @param {number} seekSeconds  How many seconds this seek represents. [was: m]
   * [was: hk]
   */
  showTapSeek(direction, touchX, touchY, seekSeconds) {
    this.accumulatedTime = direction === this.lastDirection
      ? this.accumulatedTime + seekSeconds
      : seekSeconds;
    this.lastDirection = direction;

    // Log click on the appropriate VE
    // Position the circle and ripple based on player size and touch coords
    // Start the show/hide timers
    // Update the seek time label
  }

  /**
   * Triggers the keyboard seek animation (no ripple, just the static circle).
   * @param {number} direction    -1 (back) or 1 (forward). [was: Q]
   * @param {number} seekSeconds  How many seconds. [was: c]
   * @param {Object} [seekData]   Optional seek logging data. [was: W]
   * [was: YU]
   */
  showKeyboardSeek(direction, seekSeconds, seekData = null) {
    this.accumulatedTime = direction === this.lastDirection
      ? this.accumulatedTime + seekSeconds
      : seekSeconds;
    this.lastDirection = direction;

    // Position circle at fixed position
    // g.xK(this.element, 'ytp-time-seeking');
    // Update the seek time label
  }

  /**
   * Displays chapter-seek feedback (previous/next chapter).
   * @param {number} direction  -1 or 1. [was: Q]
   * @param {string} chapterTitle  Chapter name. [was: c]
   * @param {string} [iconType]    Optional premium icon variant. [was: W]
   * [was: aW]
   */
  showChapterSeek(direction, chapterTitle, iconType = null) {
    // this.hideDelay.reset();
    // this.showDelay.start();
    // Set direction attribute
    // Clear circle dimensions (chapter-seek has no circle)
    // g.xK(this.element, 'ytp-chapter-seek');
    // this.updateValue('seekText', chapterTitle);
    // If iconType, render the premium icon; otherwise hide it
  }
}

// ---------------------------------------------------------------------------
// FeaturedProductBanner
// ---------------------------------------------------------------------------

/**
 * Renders a featured product banner overlay on the player, typically for
 * shopping / affiliate links. Includes product thumbnail, title, price,
 * vendor, trending offer badge, exclusive badge with countdown,
 * and an overflow menu button.
 *
 * Observes `featured_product` cue ranges to show/hide based on video time.
 *
 * [was: Gym]
 */
export class FeaturedProductBanner /* extends SuggestedActionBadge */ {
  /**
   * Array of all featured product cue range items.
   * @type {Array}
   */
  products = []; // was: this.HA

  /**
   * Array of dismissed product status keys.
   * @type {string[]}
   */
  dismissedKeys = []; // was: this.Sh

  /**
   * Currently displayed product data, or undefined if hidden.
   * @type {Object|undefined}
   */
  currentProduct; // was: this.W

  /**
   * The banner container component.
   * @type {Object}
   */
  banner; // was: this.banner

  /**
   * "Open in new tab" icon element.
   * @type {Object}
   */
  openInNewIcon; // was: this.Re

  /**
   * Countdown timer component.
   * @type {Object}
   */
  countdownTimer; // was: this.countdownTimer

  /**
   * Trending offer badge component.
   * @type {Object}
   */
  trendingBadge; // was: this.j

  /**
   * Overflow menu button.
   * @type {Object}
   */
  overflowButton; // was: this.overflowButton

  /**
   * Exclusive badge container.
   * @type {Object}
   */
  exclusiveContainer; // was: this.S

  /**
   * Exclusive countdown text.
   * @type {Object}
   */
  exclusiveCountdown; // was: this.b0

  /**
   * On-tap command for the banner.
   * @type {Object|undefined}
   */
  onTapCommand; // was: this.AA

  /**
   * Overflow menu data.
   * @type {Object|undefined}
   */
  overflowMenuData; // was: this.u3

  /**
   * Overflow menu popup instance.
   * @type {Object|undefined}
   */
  overflowPopup; // was: this.Fw

  /**
   * Countdown interval timer.
   * @type {Object|undefined}
   */
  countdownInterval; // was: this.MQ

  /**
   * Exclusive countdown interval timer.
   * @type {Object|undefined}
   */
  exclusiveInterval; // was: this.Rt

  /**
   * Trending offer entity key from video data.
   * @type {string|undefined}
   */
  trendingOfferEntityKey; // was: this.trendingOfferEntityKey

  /**
   * Entity store unsubscribe callback.
   * @type {Function|undefined}
   */
  unsubscribe_; // was: this.vj

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super(player, false, true);  — aN base with specific flags
    this.products = [];
    this.dismissedKeys = [];
    this.currentProduct = undefined;

    // Mark overlay order for stacking
    // this.element.setAttribute('data-overlay-order', '9');

    // Initialize from video data
    // J8n(this, this.player.getVideoData());

    // this.badge.element.classList.add('ytp-featured-product');

    // Create sub-components: openInNewIcon, countdownTimer, trendingBadge,
    // overflowButton, exclusiveCountdown, exclusiveContainer, banner
    // (See source lines 107431–107595 for full template structure)

    // Event bindings
    // this.bindEvent(player, g.Sr('featured_product'), this.onCueRangeEnter);
    // this.bindEvent(player, g.FC('featured_product'), this.onCueRangeExit);
    // this.bindEvent(player, 'videodatachange', this.onVideoDataChange);
    // this.bindEvent(this.overflowButton.element, 'click', this.onOverflowClick);
    // this.bindEvent(player, 'featuredproductdismissed', this.onDismiss);
  }

  /**
   * Opens the overflow menu popup.
   * @param {MouseEvent} event [was: Q]
   * [was: U7]
   */
  onOverflowClick(event) {
    // if (!this.overflowPopup) {
    //   this.overflowPopup = new M4a(this.player);
    //   g.F(this, this.overflowPopup);
    // }
    // if (this.overflowMenuData?.menu?.menuRenderer) {
    //   this.overflowPopup.open(this.overflowMenuData.menu.menuRenderer, event.target);
    //   event.preventDefault();
    // }
  }

  /**
   * Whether the product is currently showing.
   * @returns {boolean}
   * [was: Y / EC]
   */
  isShowing() {
    return !!this.currentProduct;
  }

  /**
   * Handles click on the banner — triggers the on-tap command.
   * @param {MouseEvent} event [was: Q]
   * [was: UH]
   */
  onClick(event) {
    if (event.target === this.overflowButton?.element) {
      event.preventDefault();
      return;
    }
    if (this.onTapCommand) {
      // g.xt(this.player, 'innertubeCommand', this.onTapCommand);
    }
    // this.setDismissed(false);
  }

  /**
   * Handles the "dismiss" action — hides the banner and records the key.
   * [was: L]
   */
  onDismiss() {
    // this.setDismissed(true);
    if (this.currentProduct?.bannerData?.dismissedStatusKey) {
      const key = this.currentProduct.bannerData.dismissedStatusKey;
      if (!this.dismissedKeys.includes(key)) {
        this.dismissedKeys.push(key);
      }
    }
    this.onCueRangeExit();
    // Optionally trigger timely shelf overlay dismiss
  }

  /**
   * Called when the featured_product cue range is entered — displays
   * the product banner with thumbnail, title, price, etc.
   * @param {Object} cueRange [was: Q]
   * [was: Er]
   */
  onCueRangeEnter(cueRange) {
    if (cueRange.id === this.currentProduct?.identifier) return;

    this.onCueRangeExit(); // Clear previous
    for (const product of this.products) {
      const itemData = product?.bannerData?.itemData;
      if (!itemData || product.identifier !== cueRange.id) continue;
      if (this.dismissedKeys.includes(product?.bannerData?.dismissedStatusKey || '')) return;

      this.currentProduct = product;
      // Update banner: aria-label, trackingParams, show(), update template
      // Set thumbnail, title, price, vendor, affiliate disclaimer, etc.
      // Handle drop countdown and exclusive countdown timers
      break;
    }
    // g.xK(this.player.getRootNode(), 'ytp-featured-product-shown');
  }

  /**
   * Called when the featured_product cue range is exited — hides the banner.
   * [was: XI]
   */
  onCueRangeExit() {
    if (!this.currentProduct) return;
    this.currentProduct = undefined;
    this.hideProduct_();
    // g.n6(this.player.getRootNode(), 'ytp-featured-product-shown');
  }

  /**
   * Handles video data changes — reloads product entities.
   * @param {string} changeType [was: Q]
   * @param {Object} videoData  [was: c]
   * [was: onVideoDataChange]
   */
  onVideoDataChange(changeType, videoData) {
    // J8n(this, videoData);
    if (changeType === 'dataloaded') {
      // yr(this) — clear all product state
    }
    // Reload featured products from watch next response
    // Subscribe to entity store updates
  }

  dispose() {
    // yr(this);
    // this.countdownInterval?.stop();
    // this.countdownTimer.hide();
    // FZ(this) — clear trending badge state
    // super.dispose();
  }

  /** @private */
  hideProduct_() {
    // this.clearOverlay();
    // g.n6(this.player.getRootNode(), 'ytp-featured-product-shown');
  }
}

// ---------------------------------------------------------------------------
// InfoPanelActionItem
// ---------------------------------------------------------------------------

/**
 * A single action button within an info panel (e.g. "Call", "Text", or
 * external link). Renders a disclaimer, icon, and label.
 *
 * Template:
 *   <div class="ytp-info-panel-action-item">
 *     <div class="ytp-info-panel-action-item-disclaimer">{{disclaimer}}</div>
 *     <a class="ytp-info-panel-action-item-button ytp-button" href="{{url}}">
 *       <div class="ytp-info-panel-action-item-icon">{{icon}}</div>
 *       <div class="ytp-info-panel-action-item-label">{{label}}</div>
 *     </a>
 *   </div>
 *
 * [was: $$W]
 */
export class InfoPanelActionItem /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Whether this item has an actionable link/command.
   * @type {boolean}
   */
  isActionable = false; // was: this.Xq

  /**
   * Command to execute when clicked (for feedback tokens, etc.).
   * @type {Object|undefined}
   */
  command; // was: this.W

  /**
   * Feedback token for action logging.
   * @type {string|undefined}
   */
  feedbackToken; // was: this.feedbackToken

  /**
   * @param {Object} player     [was: Q]
   * @param {Object} actionData Action config from the server. [was: c]
   * @param {boolean} isMobile  Whether mobile layout is active. [was: W]
   */
  constructor(player, actionData, isMobile) {
    // super({ C: 'div', yC: ['ytp-info-panel-action-item'], ... });
    this.player = player;
    this.isActionable = false;

    // Determine URL from various endpoint types:
    // - urlEndpoint -> direct href
    // - smsEndpoint -> sms: URI
    // - phoneEndpoint -> tel: URI
    // - feedbackEndpoint -> client-side action
    // Set this.isActionable = true when a valid action exists

    // Update template: label, icon, disclaimer
    // player.setTrackingParams(this.element, actionData.trackingParams);
  }

  /**
   * Handles click — logs the click and optionally sends feedback.
   * [was: onClick]
   */
  onClick() {
    // this.player.logClick(this.element, this.loggingData);
    if (this.command && this.feedbackToken) {
      // Send feedback and dismiss the info panel
    }
  }
}

// ---------------------------------------------------------------------------
// InfoPanelDetail
// ---------------------------------------------------------------------------

/**
 * A modal detail dialog for info panels, shown over the player with a
 * scrim background. Contains a title, body text, close button, and a
 * list of InfoPanelActionItems.
 *
 * Template:
 *   <div class="ytp-info-panel-detail-skrim">
 *     <div class="ytp-info-panel-detail" role="dialog">
 *       <div class="ytp-info-panel-detail-header">
 *         <div class="ytp-info-panel-detail-title">{{title}}</div>
 *         <button class="ytp-info-panel-detail-close ytp-button">X</button>
 *       </div>
 *       <div class="ytp-info-panel-detail-body">{{body}}</div>
 *       <div class="ytp-info-panel-detail-items" />
 *     </div>
 *   </div>
 *
 * [was: PCW]
 */
export class InfoPanelDetail /* extends PopupWidget */ {
  /**
   * Parent component.
   * @type {Object}
   */
  parent; // was: this.W

  /**
   * Container for action items.
   * @type {HTMLElement}
   */
  itemsContainer; // was: this.items

  /**
   * Array of InfoPanelActionItem instances.
   * @type {InfoPanelActionItem[]}
   */
  itemData = []; // was: this.itemData

  /**
   * Unique dialog ID for ARIA references.
   * @type {string}
   */
  dialogId; // was: this.A

  /**
   * @param {Object} player  [was: Q]
   * @param {Object} parent  [was: c]
   */
  constructor(player, parent) {
    // super(player, { C: 'div', ... }, 250);
    this.parent = parent;
    this.itemsContainer = null; // was: this.z2('ytp-info-panel-detail-items')
    this.itemData = [];
    // this.dialogId = mU(); — unique ID

    // Bind close button, scrim click, infopaneldetaildismissed
    // player.createServerVe(this.element, this, true);
    // this.bindEvent(player, 'videodatachange', this.onVideoDataChange);
    // this.onVideoDataChange('newdata', player.getVideoData());
    this.hide();
  }

  show() {
    // super.show();
    // this.player.publish('infopaneldetailvisibilitychange', true);
    // Log visibility for all items
  }

  hide() {
    // super.hide();
    // this.player.publish('infopaneldetailvisibilitychange', false);
  }

  getId() { return this.dialogId; }

  /**
   * Returns the number of actionable items.
   * @returns {number}
   * [was: al]
   */
  getItemCount() { return this.itemData.length; }

  /**
   * Updates the detail content when video data changes.
   * @param {string} changeType [was: Q]
   * @param {Object} videoData  [was: c]
   * [was: onVideoDataChange]
   */
  onVideoDataChange(changeType, videoData) {
    if (!videoData) return;
    // Update title and body from videoData.U7
    // Dispose and recreate action items from videoData.U7?.ctaButtons
  }

  dispose() {
    this.hide();
    // super.dispose();
  }
}

// ---------------------------------------------------------------------------
// InfoPanelPreview
// ---------------------------------------------------------------------------

/**
 * A small preview button that teases the info panel detail content.
 * Shown/hidden based on controls visibility, player state, and dismissal.
 * Clicking opens the InfoPanelDetail dialog.
 *
 * Template:
 *   <button class="ytp-info-panel-preview" aria-haspopup="true">
 *     <div class="ytp-info-panel-preview-text">{{text}}</div>
 *     <div class="ytp-info-panel-preview-chevron">{{chevron}}</div>
 *   </button>
 *
 * [was: l7Z]
 */
export class InfoPanelPreview /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Current video ID for change detection.
   * @type {string|null}
   */
  videoId = null; // was: this.videoId

  /**
   * Whether the preview has valid content to show.
   * @type {boolean}
   */
  hasContent = false; // was: this.W — truthy means has content

  /**
   * Whether an overlapping overlay (paid content, detail dialog) is active.
   * @type {boolean}
   */
  isOverlayActive = false; // was: this.A

  /**
   * Whether controls are currently shown.
   * @type {boolean}
   */
  controlsShown = false; // was: this.showControls

  /**
   * Whether the user dismissed the preview.
   * @type {boolean}
   */
  isDismissed = false; // was: this.isDismissed

  /**
   * Fade animation helper.
   * @type {Object}
   */
  fade; // was: this.fade — new g.QR(this, 250, false, 100)

  /**
   * @param {Object} player [was: Q]
   * @param {Object} detailPanel The InfoPanelDetail instance. [was: c]
   */
  constructor(player, detailPanel) {
    // super({ C: 'button', Z: 'ytp-info-panel-preview', ... });
    this.player = player;
    this.videoId = null;
    this.hasContent = false;
    this.isOverlayActive = false;
    this.controlsShown = false;
    this.isDismissed = false;
    // this.fade = new g.QR(this, 250, false, 100);

    // Bind click -> open detail panel
    // Bind videodatachange, presentingplayerstatechange
    // Bind paidcontentoverlayvisibilitychange, infopaneldetailvisibilitychange
    // Bind onShowControls, onHideControls, infopaneldetaildismissed
  }

  /**
   * Handles video data change — updates preview text.
   * @param {string} changeType [was: Q]
   * @param {Object} videoData  [was: c]
   * [was: onVideoDataChange]
   */
  onVideoDataChange(changeType, videoData) {
    // sn(this, videoData) — extract title/body from videoData.UH
    // Update state if player state changed
  }
}

// ---------------------------------------------------------------------------
// Caption Font / Style Enums & Settings
// ---------------------------------------------------------------------------

/**
 * Font family options for captions.
 * @enum {number}
 * [was: uWZ]
 */
export const CaptionFontFamily = {
  default: 0,
  monoSerif: 1,
  propSerif: 2,
  monoSans: 3,
  propSans: 4,
  casual: 5,
  cursive: 6,
  smallCaps: 7,
};

/**
 * Character edge style options for captions.
 * @enum {number}
 * [was: hyH]
 */
export const CaptionEdgeStyle = {
  none: 0,
  raised: 1,
  depressed: 2,
  uniform: 3,
  dropShadow: 4,
};

/**
 * Font style (weight + italic) options for captions.
 * @enum {number}
 * [was: zyS]
 */
export const CaptionFontStyle = {
  normal: 0,
  bold: 1,
  italic: 2,
  bold_italic: 3,
};

/**
 * Color options used for caption foreground, background, and window colors.
 * @type {Array<{option: string, text: string}>}
 * [was: kc]
 */
export const CAPTION_COLORS = [
  { option: '#fff', text: 'White' },
  { option: '#ff0', text: 'Yellow' },
  { option: '#0f0', text: 'Green' },
  { option: '#0ff', text: 'Cyan' },
  { option: '#00f', text: 'Blue' },
  { option: '#f0f', text: 'Magenta' },
  { option: '#f00', text: 'Red' },
  { option: '#080808', text: 'Black' },
];

/**
 * Opacity options used for caption background, window, and text opacity.
 * @type {Array<{option: number, text: string}>}
 * [was: CCo]
 */
// export const CAPTION_OPACITIES = [0, 0.25, 0.5, 0.75, 1].map(v => ({ option: v, text: dH(v) }));

/**
 * Full caption settings menu definition — each entry specifies a
 * settings key, label, and selectable options (font family, size, colors, etc.).
 * @type {Array<Object>}
 * [was: g.j8]
 */
export const CAPTION_SETTINGS = [
  { option: 'fontFamily', text: 'Font family', options: [
    { option: 1, text: 'Monospaced Serif' },
    { option: 2, text: 'Proportional Serif' },
    { option: 3, text: 'Monospaced Sans-Serif' },
    { option: 4, text: 'Proportional Sans-Serif' },
    { option: 5, text: 'Casual' },
    { option: 6, text: 'Cursive' },
    { option: 7, text: 'Small Capitals' },
  ]},
  { option: 'color', text: 'Font color', options: CAPTION_COLORS },
  { option: 'fontSizeIncrement', text: 'Font size', options: [
    { option: -2, text: '50%' },
    { option: -1, text: '75%' },
    { option: 0, text: '100%' },
    { option: 1, text: '150%' },
    { option: 2, text: '200%' },
    { option: 3, text: '300%' },
    { option: 4, text: '400%' },
  ]},
  { option: 'background', text: 'Background color', options: CAPTION_COLORS },
  // { option: 'backgroundOpacity', text: 'Background opacity', options: CAPTION_OPACITIES },
  // { option: 'windowColor', text: 'Window color', options: CAPTION_COLORS },
  // { option: 'windowOpacity', text: 'Window opacity', options: CAPTION_OPACITIES },
  { option: 'charEdgeStyle', text: 'Character edge style', options: [
    { option: 0, text: 'None' },
    { option: 4, text: 'Drop Shadow' },
    { option: 1, text: 'Raised' },
    { option: 2, text: 'Depressed' },
    { option: 3, text: 'Outline' },
  ]},
  // { option: 'textOpacity', text: 'Font opacity', options: [...] },
];

// ---------------------------------------------------------------------------
// Key codes consumed by the keyboard service
// ---------------------------------------------------------------------------

/**
 * Array of key codes that the player's keyboard service intercepts.
 * [was: Mf9]
 */
export const CONSUMED_KEY_CODES = [
  27, 9, 33, 34, 13, 32,   // Esc, Tab, PageUp, PageDown, Enter, Space
  187, 61, 43,              // + (various)
  189, 173, 95,             // - (various)
  79, 87, 67, 80, 78,      // O, W, C, P, N
  75, 70, 65, 68, 87, 83,  // K, F, A, D, W, S
  107, 221, 109, 219,      // Numpad+, ], Numpad-, [
]; // was: Mf9
