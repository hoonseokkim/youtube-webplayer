/**
 * Fullscreen Management — cross-browser fullscreen API wrapper and button.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~11928-11970  (Mt, kn, cs0, W4d, g.JE, R2 — fullscreen API helpers)
 *                 ~110321-110468 (qy1 — fullscreen button component)
 *
 * Provides normalised enter/exit fullscreen, fullscreen-change event detection,
 * and the FullscreenButton UI component.
 *
 * [was: Mt, kn, cs0, W4d, g.JE, R2, qy1]
 */

import { logClick } from '../../data/visual-element-tracking.js';  // was: g.pa
import { PlayerComponent } from '../../player/component.js';
import { getPlayerSize } from '../../player/time-tracking.js';

// ---------------------------------------------------------------------------
// Fullscreen API helpers
// ---------------------------------------------------------------------------

/**
 * Requests fullscreen on the given element, using whichever vendor-prefixed
 * API is available. Returns a Promise that resolves when fullscreen is entered.
 *
 * @param {HTMLElement} element  The element to make fullscreen.
 * @returns {Promise<void>}
 *
 * [was: Mt]
 */
export function requestFullscreen(element) { // was: Mt = function(Q)
  let result;

  if (element.requestFullscreen) {
    result = element.requestFullscreen(undefined);
  } else if (element.webkitRequestFullscreen) {
    result = element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    result = element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    result = element.msRequestFullscreen();
  } else if (element.webkitEnterFullscreen) {
    // iOS Safari fallback (video element only)
    result = element.webkitEnterFullscreen();
  } else {
    return Promise.reject(new Error('Fullscreen API unavailable'));
  }

  return result instanceof Promise ? result : Promise.resolve();
}

/**
 * Exits fullscreen, using whichever vendor-prefixed API is available.
 * If `element` is provided and is the current fullscreen element (on
 * standards-track browsers), exits fullscreen via `document`.
 *
 * @param {HTMLElement} [element]  Optional element to check against.
 * @returns {Promise<void>}
 *
 * [was: kn]
 */
export function exitFullscreen(element = undefined) { // was: kn = function(Q)
  let target;

  if (isFullscreenEnabled()) { // was: g.JE()
    // Standards-track: exit only if the given element is the fullscreen element
    if (getFullscreenElement() === element) {
      target = document;
    }
  } else {
    target = element;
  }

  if (!target) return Promise.resolve();

  const methods = ['exitFullscreen', 'webkitExitFullscreen', 'mozCancelFullScreen', 'msExitFullscreen'];
  const exitFn = findVendorMethod_(target, methods); // was: Ch([…], c)

  if (!exitFn) return Promise.resolve();

  const result = exitFn.call(target);
  return result instanceof Promise ? result : Promise.resolve();
}

/**
 * Returns the vendor-prefixed name of the `fullscreenchange` event
 * supported by the given element, or `undefined` if none is supported.
 *
 * @param {HTMLElement|Document} target
 * @returns {string|undefined}
 *
 * [was: cs0]
 */
export function getFullscreenChangeEvent(target = document) { // was: cs0 = function(Q)
  const candidates = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange',
  ];
  return candidates.find(name => `on${name.toLowerCase()}` in target);
}

/**
 * Returns the vendor-prefixed name of the `fullscreenerror` event
 * supported by the given element, or `undefined` if none is supported.
 *
 * @param {HTMLElement|Document} [target]
 * @returns {string|undefined}
 *
 * [was: W4d]
 */
export function getFullscreenErrorEvent(target = document) { // was: W4d = function()
  const candidates = [
    'fullscreenerror',
    'webkitfullscreenerror',
    'mozfullscreenerror',
    'MSFullscreenError',
  ];
  return candidates.find(name => `on${name.toLowerCase()}` in target);
}

/**
 * Returns whether the Fullscreen API is enabled in the current browser.
 *
 * @returns {boolean}
 *
 * [was: g.JE]
 */
export function isFullscreenEnabled() { // was: g.JE = function()
  const props = [
    'fullscreenEnabled',
    'webkitFullscreenEnabled',
    'mozFullScreenEnabled',
    'msFullscreenEnabled',
  ];
  return !!findVendorProperty_(document, props);
}

/**
 * Returns the element that is currently in fullscreen, or `null`.
 * If `deep` is true, traverses into shadow roots.
 *
 * @param {boolean} [deep=false]
 * @returns {Element|null}
 *
 * [was: R2]
 */
export function getFullscreenElement(deep = false) { // was: R2 = function(Q=false)
  const props = [
    'fullscreenElement',
    'webkitFullscreenElement',
    'mozFullScreenElement',
    'msFullscreenElement',
  ];
  let element = findVendorProperty_(document, props);

  if (deep) {
    while (element?.shadowRoot) {
      element = element.shadowRoot.fullscreenElement;
    }
  }

  return element ?? null;
}

// ---------------------------------------------------------------------------
// internal helpers
// ---------------------------------------------------------------------------

/**
 * Finds the first vendor-prefixed method that exists on `target`.
 *
 * @param {Object} target
 * @param {string[]} names
 * @returns {Function|undefined}
 * @private
 */
function findVendorMethod_(target, names) { // was: Ch([…], c)
  for (const name of names) {
    if (typeof target[name] === 'function') {
      return target[name];
    }
  }
  return undefined;
}

/**
 * Finds the first vendor-prefixed property that exists on `target` and
 * returns its value.
 *
 * @param {Object} target
 * @param {string[]} names
 * @returns {*}
 * @private
 */
function findVendorProperty_(target, names) {
  for (const name of names) {
    if (name in target) {
      return target[name];
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// FullscreenButton
// ---------------------------------------------------------------------------

/**
 * The fullscreen toggle button in the player controls bar.
 *
 * Template:
 *   <button class="ytp-fullscreen-button ytp-button"
 *           title="{{title}}" aria-label="{{aria-label}}"
 *           aria-keyshortcuts="f" data-priority="12"
 *           data-title-no-tooltip="{{data-title-no-tooltip}}">
 *     {{icon}}    <!-- enter/exit fullscreen SVG -->
 *   </button>
 *
 * Listens for:
 *   - click → toggles fullscreen
 *   - fullscreentoggled → updates icon + tooltip
 *   - presentingplayerstatechange / resize → shows/hides when appropriate
 *   - fullscreenchange / fullscreenerror → native fullscreen events
 *
 * [was: qy1]
 */
export class FullscreenButton /* extends PlayerComponent (PlayerComponent) */ {
  /**
   * Player API reference.
   * @type {Object}
   */
  api; // was: this.U

  /**
   * Tooltip manager reference.
   * @type {Object}
   */
  tooltipManager_; // was: this.O

  /**
   * Fullscreen-error popup message component (lazily created).
   * @type {Object|null}
   */
  errorMessage_ = null; // was: this.message

  /**
   * Cleanup callback for tooltip registration.
   * @type {Function|null}
   */
  tooltipCleanup_; // was: this.W — g.Zr(…)

  /**
   * Timer for post-fullscreen-change dimension check (catches partial fullscreen).
   * @type {Object}
   */
  dimensionCheckTimer_; // was: this.A — new g.Uc(this.K, 2000, this)

  /**
   * @param {Object} api              Player API instance.
   * @param {Object} tooltipManager   Tooltip display manager.
   */
  constructor(api, tooltipManager) {
    // super({
    //   C: "button",
    //   yC: ["ytp-fullscreen-button", "ytp-button"],
    //   N: {
    //     title: "{{title}}",
    //     "data-tooltip-title": "{{tooltip-title}}",
    //     "aria-label": "{{aria-label}}",
    //     "aria-keyshortcuts": "f",
    //     "data-priority": "12",
    //     "data-title-no-tooltip": "{{data-title-no-tooltip}}"
    //   },
    //   eG: "{{icon}}"
    // });

    this.api = api;                       // was: this.U
    this.tooltipManager_ = tooltipManager; // was: this.O
    this.errorMessage_ = null;

    // this.tooltipCleanup_ = g.Zr(tooltipManager.d6(), this.element);
    // this.dimensionCheckTimer_ = new g.Uc(this.onDimensionCheck_, 2000, this);

    // Event bindings
    // this.B(api, "fullscreentoggled", this.onFullscreenToggled_);
    // this.B(api, "presentingplayerstatechange", this.updateVisibility_);
    // this.B(api, "resize", this.updateVisibility_);
    // this.listen("click", this.onClick);

    // Native fullscreen events (standards-track browsers)
    // if (g.JE()) {
    //   this.B(api.bX(), W4d(), this.onFullscreenError_);   // was: this.j
    //   this.B(api.bX(), cs0(document), this.onNativeChange_); // was: this.Sj
    // }

    // Disable if fullscreen is not supported
    if (!api.G().Y0 && !api.G().J) {
      this.disable_();
    }

    api.createClientVe(this.element, this, 139117);
    this.updateVisibility_();
    this.onFullscreenToggled_(api.isFullscreen());
  }

  /**
   * Click handler — toggles fullscreen mode.
   */
  onClick() { // was: onClick()
    const config = this.api.G();
    if (config.Y0 || config.J) {
      this.api.logClick(this.element);
      try {
        this.api.toggleFullscreen().catch(err => this.onError_(err));
      } catch (err) {
        this.onError_(err);
      }
    } else {
      // Show error popup if fullscreen is disabled
      // lp(this.errorMessage_, this.element, true);
    }
  }

  /**
   * Handles fullscreen errors.
   * @param {Error} err
   * @private
   */
  onError_(err) { // was: Pa(Q)
    if (String(err).includes('fullscreen error')) {
      // non-fatal: g.Ty(err)
    } else {
      // fatal: g.Zf(err)
    }
    this.disable_();
  }

  /**
   * Native fullscreen-change handler — checks if we unexpectedly left
   * fullscreen (e.g. the user was not actually fullscreen despite expecting it).
   * @private
   */
  onNativeChange_() { // was: Sj()
    if (getFullscreenElement() === this.api.getRootNode()) {
      this.dimensionCheckTimer_.start();
    } else {
      this.dimensionCheckTimer_.stop();
      if (this.errorMessage_) this.errorMessage_.hide();
    }
  }

  /**
   * Delayed dimension check — if the window is smaller than 90% of the
   * screen, the browser may not have truly entered fullscreen.
   * @private
   */
  onDimensionCheck_() { // was: K()
    if (window.screen && window.outerWidth && window.outerHeight) {
      const screenW = window.screen.width * 0.9;
      const screenH = window.screen.height * 0.9;
      let w = Math.max(window.outerWidth, window.innerWidth);
      let h = Math.max(window.outerHeight, window.innerHeight);

      // Swap if orientations differ
      if ((w > h) !== (screenW > screenH)) {
        [w, h] = [h, w];
      }

      if (screenW > w && screenH > h) {
        this.disable_();
      }
    }
  }

  /**
   * Disables the fullscreen button (creates the error message popup).
   * @private
   */
  disable_() { // was: disable()
    if (this.errorMessage_) return;

    // Create the "fullscreen unavailable" popup
    this.element.setAttribute('aria-disabled', 'true');
    this.element.setAttribute('aria-haspopup', 'true');
    // Clean up tooltip registration
  }

  /**
   * Shows or hides the button based on player state and size.
   * @private
   */
  updateVisibility_() { // was: ZF()
    const isSupported = true; // was: pTK(this.U)
    const tooSmall = this.api.G().J && this.api.getPlayerSize().width < 250;
    const visible = isSupported && !tooSmall;
    // this.BB(visible);
    this.api.logVisibility(this.element, visible);
  }

  /**
   * Updates the button icon and tooltip when fullscreen state changes.
   *
   * @param {boolean} isFullscreen  Whether the player is now fullscreen.
   * @private
   */
  onFullscreenToggled_(isFullscreen) { // was: Z0(Q)
    let tooltip;

    if (isFullscreen) {
      tooltip = 'Exit full screen'; // was: g.sP(this.U, "Exit full screen", "f")
      this.update({ 'data-title-no-tooltip': 'Exit full screen' });

      // If PiP is active, exit it
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
    } else {
      tooltip = 'Full screen'; // was: g.sP(this.U, "Full screen", "f")
      this.update({ 'data-title-no-tooltip': 'Full screen' });
    }

    // Update icon SVG based on state
    // const icon = Pc0(this, isFullscreen);

    this.update({
      'tooltip-title': tooltip,
      'aria-label': tooltip,
      // icon: icon,
    });
  }
}
