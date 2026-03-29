/**
 * Autoplay Countdown — Countdown timer, circle animation, and
 * "Up next in X" display for the endscreen autoplay widget.
 *
 * Source: player_es6.vflset/en_US/endscreen.js
 *   - AutoplayCountdownOverlay  [was: iT]       — lines 136–337
 *   - CompactAutoplayWidget     [was: Q$W]      — lines 365–574
 *   - getCountdownDuration      [was: VY]       — lines 63–66
 *   - updateCountdownHeader     [was: BK]       — lines 44–62
 *   - tickCountdown (overlay)   [was: xa]       — lines 16–23
 *   - tickCountdown (compact)   [was: nB]       — lines 67–77
 *   - getCompactCountdownDur    [was: RQ4]      — lines 78–81
 *   - notifyCountdownStarted    [was: C7o]      — lines 4–6
 *   - updateLayout              [was: qk]       — lines 25–43
 */

import { getConfig, listen } from '../../core/composition-helpers.js';  // was: g.v, g.s7
import { logClick } from '../../data/visual-element-tracking.js';  // was: g.pa
import { nextVideo, onVideoDataChange } from '../../player/player-events.js';  // was: g.nextVideo, g.Qq
import { playIcon } from '../../ui/svg-icons.js'; // was: tK
import { appendChild, createTextNode, createElement, addClass, toggleClass, setStyle, removeClass } from '../../core/dom-utils.js';
import { slice } from '../../core/array-utils.js';
import { getPlayerSize } from '../../player/time-tracking.js';
import { Timer } from '../../core/timer.js';
import { getWatchNextResponse } from '../../player/player-api.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { contains } from '../../core/string-utils.js';

// ── Helper: notify the player that a countdown has started ──────────
// [was: C7o] — Source lines 4–6
function notifyCountdownStarted(playerApi, durationMs) { // was: C7o
  fireEvent(playerApi, 'onAutonavCoundownStarted', durationMs);
}

// ── Helper: check if player is backgrounded and in PiP ──────────────
// [was: M0S] — Source lines 7–9
function isBackgroundPiP(playerOverlay) { // was: M0S
  return playerOverlay.isBackground() && playerOverlay.isPictureInPicture(); // was: Zh
}

// ══════════════════════════════════════════════════════════════════════
// getCountdownDuration — Determine the autoplay countdown length in ms.
// [was: VY] — Source lines 63–66
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {Object} widget [was: Q] — the countdown widget (iT or Q$W)
 * @returns {number} — duration in milliseconds
 */
export function getCountdownDuration(widget) { // was: VY
  if (widget.playerApi.isFullscreen()) {
    const override = widget.playerApi.getVideoData()?.fullscreenAutoplayDuration; // was: I4
    return (override === -1 || override === undefined) ? 8000 : override;
  }
  if (widget.playerApi.getAutoplayCountdown() >= 0) { // was: LY
    return widget.playerApi.getAutoplayCountdown();
  }
  return getExperimentInt(widget.playerApi.getConfig().experiments, 'autoplay_time') || 10000;
}

// ══════════════════════════════════════════════════════════════════════
// updateCountdownHeader — Set the "Up next in X" or "Up next" text.
// [was: BK] — Source lines 44–62
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {Object} widget [was: Q]
 * @param {number} seconds [was: c] — seconds remaining, or -1 for "Up next"
 */
export function updateCountdownHeader(widget, seconds = -1) { // was: BK
  const headerEl = widget.upNextContainer.querySelector('.ytp-autonav-endscreen-upnext-header'); // was: A.z2
  clearChildren(headerEl); // was: g.y0

  if (seconds >= 0) {
    const text = String(seconds);
    const template = 'Up next in $SECONDS';
    const match = template.match(RegExp('\\$SECONDS', 'gi'))[0];
    const insertIdx = template.indexOf(match);

    if (insertIdx >= 0) {
      // Build: "Up next in " + <span class="..countdown-number">X</span> + ""
      headerEl.appendChild(createTextNode(template.slice(0, insertIdx)));
      const numberSpan = createElement('span');
      addClass(numberSpan, 'ytp-autonav-endscreen-upnext-header-countdown-number');
      setText(numberSpan, text);
      headerEl.appendChild(numberSpan);
      headerEl.appendChild(createTextNode(template.slice(insertIdx + match.length)));
      return;
    }
  }

  setText(headerEl, 'Up next');
}

// ══════════════════════════════════════════════════════════════════════
// tickCountdown (for AutoplayCountdownOverlay) — Advance the text countdown.
// [was: xa] — Source lines 16–23
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {AutoplayCountdownOverlay} widget [was: Q]
 */
export function tickCountdownOverlay(widget) { // was: xa
  const totalMs = getCountdownDuration(widget);
  const elapsedMs = widget.countdownStartTime ? Date.now() - widget.countdownStartTime : 0;
  const clampedElapsed = Math.min(elapsedMs, totalMs);

  updateCountdownHeader(widget, Math.ceil((totalMs - clampedElapsed) / 1000));

  if (totalMs - clampedElapsed <= 500 && widget.isCountdownActive()) {
    widget.select(true);
  } else if (widget.isCountdownActive()) {
    widget.tickTimer.start(); // was: L
  }
}

// ══════════════════════════════════════════════════════════════════════
// updateLayout — Update the endscreen overlay sizing and visibility.
// [was: qk] — Source lines 25–43
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {AutoplayCountdownOverlay} widget [was: Q]
 */
export function updateLayout(widget) { // was: qk
  const playerSize = widget.playerApi.getPlayerSize(true, widget.playerApi.isFullscreen()); // was: O8

  toggleClass(widget.container.element, 'ytp-autonav-endscreen-small-mode', widget.isSmallMode(playerSize)); // was: dj
  toggleClass(widget.container.element, 'ytp-autonav-endscreen-is-premium', !!widget.suggestion?.isPremium); // was: pC
  toggleClass(widget.playerApi.getRootNode(), 'ytp-autonav-endscreen-cancelled-state', !widget.playerApi.isAutonavActive()); // was: nx
  toggleClass(widget.playerApi.getRootNode(), 'countdown-running', widget.isCountdownActive());
  toggleClass(widget.container.element, 'ytp-player-content', widget.playerApi.isAutonavActive());

  setStyle(widget.overlay.element, { width: `${playerSize.width}px` });

  if (!widget.isCountdownActive()) {
    if (widget.playerApi.isAutonavActive()) {
      updateCountdownHeader(widget, Math.round(getCountdownDuration(widget) / 1000));
    } else {
      updateCountdownHeader(widget);
    }

    const hasAltHeader = !!widget.suggestion?.alternativeHeader; // was: KY
    const showMainHeader = widget.playerApi.isAutonavActive() || !hasAltHeader;
    toggleClass(widget.container.element, 'ytp-autonav-endscreen-upnext-alternative-header-only', !showMainHeader && hasAltHeader);
    toggleClass(widget.container.element, 'ytp-autonav-endscreen-upnext-no-alternative-header', showMainHeader && !hasAltHeader);

    widget.buttonContainer.setVisible(widget.playerApi.isAutonavActive()); // was: D.BB
  }
}

// ══════════════════════════════════════════════════════════════════════
// AutoplayCountdownOverlay — Full-size endscreen countdown panel.
// [was: iT] — Source lines 136–337
// ══════════════════════════════════════════════════════════════════════

export class AutoplayCountdownOverlay extends Component {
  /**
   * @param {Object} playerApi [was: Q]
   */
  constructor(playerApi) {
    super({ tagName: 'div', className: 'ytp-autonav-endscreen-countdown-overlay' });

    /** @type {?Object} [was: S] — navigation endpoint for the play button */
    this.navigationEndpoint = undefined;

    /** @type {?Object} [was: cancelCommand] — cancel autoplay innertube command */
    this.cancelCommand = undefined;

    /** @type {number} [was: J] — timestamp when countdown started (0 = not running) */
    this.countdownStartTime = 0;

    /** @type {Object} [was: container] — wrapper div */
    this.container = new Component({ tagName: 'div', className: 'ytp-autonav-endscreen-countdown-container' });
    disposable(this, this.container);
    this.container.attachTo(this.element); // was: x0

    /** @type {Object} [was: U] — player API */
    this.playerApi = playerApi;

    /** @type {?Object} [was: suggestion] — current suggestion */
    this.suggestion = null;
    this.onVideoDataChange('newdata', this.playerApi.getVideoData());
    this.addEventListener(playerApi, 'videodatachange', this.onVideoDataChange);

    // ── "Up next" info panel ────────────────────────────────────────
    /** @type {Component} [was: A] — up-next info container */
    this.upNextContainer = new Component({
      tagName: 'div',
      className: 'ytp-autonav-endscreen-upnext-container',
      attributes: { 'aria-label': '{{aria_label}}' },
      children: [
        { tagName: 'div', className: 'ytp-autonav-endscreen-upnext-header' },
        { tagName: 'div', className: 'ytp-autonav-endscreen-upnext-alternative-header' },
        { tagName: 'a', className: 'ytp-autonav-endscreen-link-container',
          attributes: { href: '{{url}}' },
          children: [
            { tagName: 'div', className: 'ytp-autonav-endscreen-upnext-thumbnail' },
            { tagName: 'div', className: 'ytp-autonav-endscreen-video-info',
              children: [
                { tagName: 'div', className: 'ytp-autonav-endscreen-upnext-title' },
                { tagName: 'div', className: 'ytp-autonav-endscreen-upnext-author' },
              ],
            },
          ],
        },
      ],
    });
    disposable(this, this.upNextContainer);
    this.upNextContainer.attachTo(this.container.element);

    // ── Full-width overlay div ──────────────────────────────────────
    /** @type {Component} [was: overlay] */
    this.overlay = new Component({ tagName: 'div', className: 'ytp-autonav-overlay' });
    disposable(this, this.overlay);
    this.overlay.attachTo(this.container.element);

    // ── Button container (Cancel + Play Now) ────────────────────────
    /** @type {Component} [was: D] — button container */
    this.buttonContainer = new Component({ tagName: 'div', className: 'ytp-autonav-endscreen-button-container' });
    disposable(this, this.buttonContainer);
    this.buttonContainer.attachTo(this.container.element);

    // Cancel button
    /** @type {Component} [was: cancelButton] */
    this.cancelButton = new Component({
      tagName: 'button',
      classNames: ['ytp-autonav-endscreen-upnext-button', 'ytp-autonav-endscreen-upnext-cancel-button', 'ytp-autonav-endscreen-upnext-button-rounded'],
      attributes: { 'aria-label': 'Cancel autoplay' },
      textContent: 'Cancel',
    });
    disposable(this, this.cancelButton);
    this.cancelButton.attachTo(this.buttonContainer.element);
    this.cancelButton.listen('click', this.onCancelClick, this);

    // Play Now button
    /** @type {Component} [was: playButton] */
    this.playButton = new Component({
      tagName: 'a',
      classNames: ['ytp-autonav-endscreen-upnext-button', 'ytp-autonav-endscreen-upnext-play-button', 'ytp-autonav-endscreen-upnext-button-rounded'],
      attributes: { href: '{{url}}', role: 'button', 'aria-label': 'Play next video' },
      textContent: 'Play Now',
    });
    disposable(this, this.playButton);
    this.playButton.attachTo(this.buttonContainer.element);
    this.playButton.listen('click', this.onPlayClick, this);

    // ── Tick timer (500 ms interval for "Up next in X") ─────────────
    /** @type {Timer} [was: L] */
    this.tickTimer = new Timer(() => tickCountdownOverlay(this), 500);
    disposable(this, this.tickTimer);

    this.updateVisibility(); // was: b0
    this.addEventListener(playerApi, 'autonavvisibility', this.updateVisibility);
  }

  // ── Public API ────────────────────────────────────────────────────

  /**
   * Set the suggestion to display.
   * [was: Y] — Source line 280
   */
  setSuggestion(suggestion) { // was: Y
    if (this.suggestion !== suggestion) {
      this.suggestion = suggestion;
      // Update template bindings (title, author, thumbnail, url, etc.)
      this.playButton.updateValue('url', this.suggestion.getUrl()); // was: L2
      updateLayout(this);
    }
  }

  /**
   * Is the countdown currently running?
   * [was: W] — Source line 286
   * @returns {boolean}
   */
  isCountdownActive() { // was: W
    return this.countdownStartTime > 0;
  }

  /**
   * Start the countdown.
   * [was: K] — Source lines 289–294
   */
  startCountdown() { // was: K
    if (this.isCountdownActive()) return;
    this.countdownStartTime = Date.now();
    tickCountdownOverlay(this);
    notifyCountdownStarted(this.playerApi, getCountdownDuration(this));
    toggleClass(this.playerApi.getRootNode(), 'countdown-running', this.isCountdownActive());
  }

  /**
   * Pause the countdown (reset to "Up next").
   * [was: j] — Source lines 295–300
   */
  pauseCountdown() { // was: j
    this.stopCountdown(); // was: O
    tickCountdownOverlay(this);
    const headerEl = this.upNextContainer.querySelector('.ytp-autonav-endscreen-upnext-header');
    if (headerEl) setText(headerEl, 'Up next');
  }

  /**
   * Stop the countdown timer.
   * [was: O] — Source lines 301–304
   */
  stopCountdown() { // was: O
    if (this.isCountdownActive()) {
      this.tickTimer.stop();
      this.countdownStartTime = 0;
    }
  }

  /**
   * Navigate to the next video.
   * [was: select] — Source lines 305–308
   */
  select(isAutomatic = false) {
    this.playerApi.nextVideo(false, isAutomatic);
    this.stopCountdown();
  }

  /**
   * Determine if the overlay should use small-mode layout.
   * [was: dj] — Source lines 334–336
   * @param {{width: number, height: number}} size
   * @returns {boolean}
   */
  isSmallMode(size) { // was: dj
    return size.width < 400 || size.height < 459;
  }

  // ── Event handlers ────────────────────────────────────────────────

  /** [was: T2] — Play click handler — Source lines 309–315 */
  onPlayClick(event) { // was: T2
    if (this.navigationEndpoint) {
      fireEvent(this.playerApi, 'innertubeCommand', this.navigationEndpoint);
      this.stopCountdown();
    } else {
      this.select();
    }
  }

  /** [was: Ie] — Cancel click handler — Source lines 316–320 */
  onCancelClick() { // was: Ie
    this.playerApi.logClick(this.cancelButton.element);
    cancelAutoplay(this.playerApi, true); // was: g.d7
    if (this.cancelCommand) fireEvent(this.playerApi, 'innertubeCommand', this.cancelCommand);
  }

  /** [was: onVideoDataChange] — Source lines 321–324 */
  onVideoDataChange(reason, videoData) { // was: onVideoDataChange
    // Update navigation endpoint from watch-next response
    const nextBtn = videoData.getWatchNextResponse()?.playerOverlays?.playerOverlayRenderer?.autoplay?.playerOverlayAutoplayRenderer?.nextButton?.buttonRenderer;
    this.navigationEndpoint = nextBtn?.navigationEndpoint;
    this.cancelCommand = videoData.getWatchNextResponse()?.playerOverlays?.playerOverlayRenderer?.autoplay?.playerOverlayAutoplayRenderer?.cancelButton?.buttonRenderer?.command;
  }

  /** [was: b0] — Sync visibility with autonav state — Source lines 325–333 */
  updateVisibility() { // was: b0
    const isVisible = this.playerApi.isAutonavActive(); // was: nx
    if (this.lastVisibility !== isVisible) this.setVisible(isVisible); // was: BB
    updateLayout(this);
    this.playerApi.logVisibility(this.container.element, isVisible);
    this.playerApi.logVisibility(this.cancelButton.element, isVisible);
    this.playerApi.logVisibility(this.playButton.element, isVisible);
  }
}

// ══════════════════════════════════════════════════════════════════════
// CompactAutoplayWidget — Circle-progress / skip-next widget for small viewports.
// [was: Q$W] — Source lines 365–574
// ══════════════════════════════════════════════════════════════════════

export class CompactAutoplayWidget extends Component {
  /**
   * @param {Object} playerApi [was: Q]
   */
  constructor(playerApi) {
    super({
      tagName: 'div',
      classNames: ['ytp-upnext', 'ytp-player-content'],
      attributes: { 'aria-label': '{{aria_label}}' },
      children: [
        { tagName: 'div', className: 'ytp-cued-thumbnail-overlay-image' },
        { tagName: 'span', className: 'ytp-upnext-top',
          children: [
            { tagName: 'span', className: 'ytp-upnext-header', textContent: 'Up Next' },
            { tagName: 'span', className: 'ytp-upnext-title' },
            { tagName: 'span', className: 'ytp-upnext-author' },
          ],
        },
        { tagName: 'a', className: 'ytp-upnext-autoplay-icon',
          attributes: { role: 'button', href: '{{url}}', 'aria-label': 'Play next video' },
          children: [
            // SVG circle countdown ring
            { tagName: 'svg', attributes: { height: '100%', viewBox: '0 0 72 72', width: '100%' },
              children: [
                { tagName: 'circle', className: 'ytp-svg-autoplay-circle',
                  attributes: { cx: '36', cy: '36', fill: '#fff', 'fill-opacity': '0.3', r: '31.5' } },
                { tagName: 'circle', className: 'ytp-svg-autoplay-ring',
                  attributes: { cx: '-36', cy: '36', 'fill-opacity': '0', r: '33.5',
                    stroke: '#FFFFFF', 'stroke-dasharray': '211', 'stroke-dashoffset': '-211',
                    'stroke-width': '4', transform: 'rotate(-90)' } },
                { tagName: 'path', className: 'ytp-svg-fill',
                  attributes: { d: 'M 24,48 41,36 24,24 V 48 z M 44,24 v 24 h 4 V 24 h -4 z' } },
              ],
            },
          ],
        },
        { tagName: 'span', className: 'ytp-upnext-bottom',
          children: [
            { tagName: 'span', className: 'ytp-upnext-cancel' },
            { tagName: 'span', className: 'ytp-upnext-paused', textContent: 'Autoplay is paused' },
          ],
        },
      ],
    });

    /** @type {Object} [was: api] */
    this.api = playerApi;

    /** @type {?Component} [was: cancelButton] */
    this.cancelButton = null;

    /** @type {SVGElement} [was: MM] — the SVG ring element for dash-offset animation */
    this.ringElement = this.querySelector('.ytp-svg-autoplay-ring'); // was: z2

    /** @type {?Object} [was: suggestion] */
    this.suggestion = null;

    /** @type {?Timer} [was: A] — animation frame timer (25 ms) */
    this.animationTimer = null;

    /** @type {?Object} [was: notification] — browser Notification object */
    this.notification = null;

    /** @type {?Object} [was: L] — notification click listener handle */
    this.notificationClickListener = null;

    /** @type {Timer} [was: S] — notification auto-dismiss timer */
    this.notificationDismissTimer = new Timer(this.dismissNotification, 5000, this);

    /** @type {number} [was: J] — timestamp when countdown started */
    this.countdownStartTime = 0;

    // Set up cancel button
    const cancelContainer = this.querySelector('.ytp-upnext-cancel'); // was: z2
    this.cancelButton = new Component({
      tagName: 'button',
      classNames: ['ytp-upnext-cancel-button', 'ytp-button'],
      attributes: { tabindex: '0', 'aria-label': 'Cancel autoplay' },
      textContent: 'Cancel',
    });
    disposable(this, this.cancelButton);
    this.cancelButton.listen('click', this.onCancelClick, this);
    this.cancelButton.attachTo(cancelContainer);

    disposable(this, this.notificationDismissTimer);

    // Autoplay icon click
    const autog.playIcon = this.querySelector('.ytp-upnext-autoplay-icon');
    this.addEventListener(autog.playIcon, 'click', this.onAutoplayIconClick);

    this.updateVisibility(); // was: b0
    this.addEventListener(playerApi, 'autonavvisibility', this.updateVisibility);
    this.addEventListener(playerApi, 'mdxnowautoplaying', this.onMdxAutoplay); // was: Ka
    this.addEventListener(playerApi, 'mdxautoplaycanceled', this.onMdxCanceled); // was: jG
  }

  // ── Public API ────────────────────────────────────────────────────

  /** [was: Y] */
  setSuggestion(suggestion) { // was: Y
    this.suggestion = suggestion;
    // Update thumbnail, title, etc.
  }

  /**
   * Is the countdown running?
   * [was: W] — Source line 523
   * @returns {boolean}
   */
  isCountdownActive() { // was: W
    return !!this.animationTimer;
  }

  /**
   * Start the ring-progress countdown.
   * [was: K] — Source lines 508–519
   * @param {number} [overrideDurationMs] — optional duration override
   */
  startCountdown(overrideDurationMs) { // was: K
    if (this.isCountdownActive()) return;
    this.countdownStartTime = Date.now(); // was: (0, g.h)()
    this.animationTimer = new Timer(() => this.tickRing(overrideDurationMs), 25); // was: Uc(..., 25)
    this.tickRing(overrideDurationMs); // was: nB
    notifyCountdownStarted(this.api, this.getCountdownDuration(overrideDurationMs)); // was: RQ4
    removeClass(this.element, 'ytp-upnext-autoplay-paused');
  }

  /**
   * Pause the countdown (show "Autoplay is paused").
   * [was: j] — Source lines 526–531
   */
  pauseCountdown() { // was: j
    this.stopCountdown();
    this.countdownStartTime = Date.now();
    this.tickRing();
    addClass(this.element, 'ytp-upnext-autoplay-paused');
  }

  /**
   * Stop the countdown and dispose the animation timer.
   * [was: O] — Source lines 533–536
   */
  stopCountdown() { // was: O
    if (this.isCountdownActive()) {
      this.animationTimer.dispose();
      this.animationTimer = null;
    }
  }

  /**
   * Navigate to the next video (auto or manual).
   * [was: select] — Source lines 537–550
   */
  select(isAutomatic = false) {
    // Optionally show a browser Notification if tab is backgrounded
    this.stopCountdown();
    this.api.nextVideo(false, isAutomatic);
  }

  /** @override */
  dispose() {
    this.stopCountdown();
    this.dismissNotification();
    super.dispose();
  }

  // ── Internal ──────────────────────────────────────────────────────

  /**
   * Tick the SVG ring progress.
   * [was: nB] — Source lines 67–77
   * @param {number} [overrideDurationMs]
   */
  tickRing(overrideDurationMs) { // was: nB
    const totalMs = this.getCountdownDuration(overrideDurationMs);
    const elapsed = Date.now() - this.countdownStartTime; // was: (0, g.h)()
    const clamped = Math.min(elapsed, totalMs);
    const progress = totalMs === 0 ? 1 : Math.min(clamped / totalMs, 1);

    // Update SVG stroke-dashoffset: full circle = 211 units
    this.ringElement.setAttribute('stroke-dashoffset', `${-211 * (progress + 1)}`);

    if (progress >= 1 && this.isCountdownActive() && this.api.getPresentingPlayerType() !== 3) {
      this.select(true);
    } else if (this.isCountdownActive()) {
      this.animationTimer.start(); // was: A.start
    }
  }

  /**
   * Get the effective countdown duration.
   * [was: RQ4] — Source lines 78–81
   */
  getCountdownDuration(overrideMs) { // was: RQ4
    if (overrideMs) return overrideMs;
    if (this.api.isFullscreen()) {
      const fsDuration = this.api.getVideoData()?.fullscreenAutoplayDuration; // was: I4
      return (fsDuration === -1 || fsDuration === undefined) ? 8000 : fsDuration;
    }
    if (this.api.getAutoplayCountdown() >= 0) return this.api.getAutoplayCountdown(); // was: LY
    return getExperimentInt(this.api.getConfig().experiments, 'autoplay_time') || 10000;
  }

  /** [was: D] — Dismiss the browser Notification */
  dismissNotification() { // was: D
    if (this.notification) {
      this.notificationDismissTimer.stop();
      if (this.notificationClickListener) this.removeEventListener(this.notificationClickListener);
      this.notificationClickListener = null;
      this.notification.close();
      this.notification = null;
    }
  }

  // ── Event handlers ────────────────────────────────────────────────

  /** [was: Ie] — Autoplay icon click */
  onAutoplayIconClick(event) { // was: Ie
    if (!this.cancelButton?.element.contains(event.target)) {
      if (this.api.isAutonavActive()) this.api.logClick(this.querySelector('.ytp-upnext-autoplay-icon'));
      this.select();
    }
  }

  /** [was: T2] — Cancel button click */
  onCancelClick() { // was: T2
    if (this.api.isAutonavActive() && this.cancelButton) this.api.logClick(this.cancelButton.element);
    cancelAutoplay(this.api, true);
  }

  /** [was: b0] — Visibility sync */
  updateVisibility() { // was: b0
    this.setVisible(this.api.isAutonavActive()); // was: BB
    this.api.logVisibility(this.element, this.api.isAutonavActive());
    if (this.cancelButton) this.api.logVisibility(this.cancelButton.element, this.api.isAutonavActive());
  }

  /** [was: Ka] — MDX now-autoplaying event */
  onMdxAutoplay(durationMs) { // was: Ka
    this.show();
    this.startCountdown(durationMs);
  }

  /** [was: jG] — MDX autoplay-canceled event */
  onMdxCanceled() { // was: jG
    this.stopCountdown();
    this.hide();
  }
}
