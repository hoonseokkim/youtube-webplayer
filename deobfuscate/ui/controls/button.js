/**
 * Button Components — player UI buttons and ad buttons.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~106328-106510 (notification toggle button, subscribe button)
 *                 ~69667-69743  (ad button renderer — wK)
 *                 ~69767-69814  (ad hover text button — Eey)
 *                 ~110250-110274 (expand/collapse right-bottom section — BOZ)
 *                 ~110321-110370 (fullscreen button constructor is in layout/fullscreen.js)
 *                 ~110470-110549 (jump/seek button — njS)
 *
 * [was: f_w, g.tW, wK, Eey, BOZ, njS]
 */

import { PlayerComponent } from '../../player/component.js';
import { notificationBellIcon } from '../svg-icons.js'; // was: g.c_3
import { AdComponent } from '../../player/component-events.js'; // was: JU
import { listen } from '../../core/composition-helpers.js';
import { logClick } from '../../data/visual-element-tracking.js';
import { ContainerComponent } from '../../player/container-component.js';
import { toString } from '../../core/string-utils.js';
import { clear } from '../../core/array-utils.js';

// ---------------------------------------------------------------------------
// CSS class name constants for notifications button
// ---------------------------------------------------------------------------

/** @enum {string} [was: qY] */
export const NotificationClasses = {
  BUTTON: 'ytp-button',                           // was: qY.BUTTON
  TITLE_NOTIFICATIONS: 'ytp-title-notifications',  // was: qY.TITLE_NOTIFICATIONS
  TITLE_NOTIFICATIONS_ON: 'ytp-title-notifications-on',  // was: qY.TITLE_NOTIFICATIONS_ON
  TITLE_NOTIFICATIONS_OFF: 'ytp-title-notifications-off', // was: qY.TITLE_NOTIFICATIONS_OFF
  NOTIFICATIONS_ENABLED: 'ytp-notifications-enabled',     // was: qY.NOTIFICATIONS_ENABLED
};

// ---------------------------------------------------------------------------
// NotificationToggleButton
// ---------------------------------------------------------------------------

/**
 * A toggle button for channel notification subscriptions.
 * Renders a bell icon that toggles between "on" and "off" states.
 *
 * Template:
 *   <button class="ytp-button ytp-title-notifications"
 *           aria-pressed="{{pressed}}" aria-label="{{label}}">
 *     <div class="ytp-title-notifications-on"> … bell-on SVG … </div>
 *     <div class="ytp-title-notifications-off"> … bell-off SVG … </div>
 *   </button>
 *
 * [was: f_w]
 */
export class NotificationToggleButton extends PlayerComponent {
  /**
   * Whether notifications are currently enabled.
   * @type {boolean}
   */
  isEnabled_ = false; // was: this.W

  /**
   * @param {Object} api  The player API instance.
   */
  constructor(api) {
    super({
      C: 'button',
      yC: [NotificationClasses.BUTTON, NotificationClasses.TITLE_NOTIFICATIONS],
      N: {
        'aria-pressed': '{{pressed}}',
        'aria-label': '{{label}}',
      },
      V: [
        {
          C: 'div',
          Z: NotificationClasses.TITLE_NOTIFICATIONS_ON,
          N: {
            title: 'Stop getting notified about every new video',
            'aria-label': 'Notify subscriptions',
          },
          V: [/* bell-filled SVG via notificationBellIcon() */],
        },
        {
          C: 'div',
          Z: NotificationClasses.TITLE_NOTIFICATIONS_OFF,
          N: {
            title: 'Get notified about every new video',
            'aria-label': 'Notify subscriptions',
          },
          V: [/* bell-outline SVG */],
        },
      ],
    });

    this.api = api; // was: this.api
    this.isEnabled_ = false;

    api.createClientVe(this.element, this, 36927);
    this.listen('click', this.onClick, this);
    this.updateValue('pressed', false);
    this.updateValue('label', 'Get notified about every new video');
  }

  /**
   * Handles click — toggles the notification state and updates ARIA labels.
   */
  onClick() {
    this.api.logClick(this.element);
    const nowEnabled = !this.isEnabled_; // was: Q
    this.updateValue(
      'label',
      nowEnabled
        ? 'Stop getting notified about every new video'
        : 'Get notified about every new video'
    );
    this.updateValue('pressed', nowEnabled);
    this.setNotificationState_(nowEnabled); // was: dTw(this, Q)
  }

  /**
   * Persists the notification preference.
   * @param {boolean} enabled
   * @private
   */
  setNotificationState_(enabled) {
    this.isEnabled_ = enabled;
    // was: dTw(this, Q) — sends the preference to the backend
  }
}

// ---------------------------------------------------------------------------
// ExpandControlsButton
// ---------------------------------------------------------------------------

/**
 * A toggle button that expands or collapses the right-bottom controls
 * section in small/compact player modes (e.g., Delhi modern layout).
 *
 * Template:
 *   <button class="ytp-expand-right-bottom-section-button ytp-button"
 *           title="{{title}}" aria-pressed="{{pressed}}" …>
 *     … expand icon SVG …
 *   </button>
 *
 * [was: BOZ]
 */
export class ExpandControlsButton /* extends ContainerComponent */ {
  /**
   * Whether the right-bottom section is currently expanded.
   * @type {boolean}
   */
  isExpanded_ = false; // was: this.W

  /**
   * @param {Object} api  The player API instance.
   */
  constructor(api) {
    // super({…}) — creates the button element
    this.isExpanded_ = false;
    this.listen('click', this.onClick_);
    api.createClientVe(this.element, this, 276954);
  }

  /**
   * Toggle handler — publishes expand/collapse events.
   * @private
   */
  onClick_() { // was: O()
    this.isExpanded_ = !this.isExpanded_;
    if (this.isExpanded_) {
      this.publish('small-mode-expand-right-bottom-controls');
    } else {
      this.publish('small-mode-collapse-right-bottom-controls');
    }
  }

  /**
   * @returns {boolean} Whether the controls section is expanded.
   */
  isExpanded() {
    return this.isExpanded_;
  }
}

// ---------------------------------------------------------------------------
// JumpButton (Seek Forward / Seek Backward)
// ---------------------------------------------------------------------------

/**
 * A button that seeks the video forward or backward by a fixed number of
 * seconds (typically +10 or -10). Renders a circular arrow icon with the
 * number of seconds overlaid.
 *
 * Template:
 *   <button class="ytp-button ytp-jump-button"
 *           title="{{title}}" aria-keyshortcuts="{{aria-keyshortcuts}}" …>
 *     <svg>…circular-arrow…</svg>
 *     <text class="ytp-jump-button-text">10</text>
 *   </button>
 *
 * [was: njS]
 */
export class JumpButton extends PlayerComponent {
  /**
   * Number of seconds to seek (positive = forward, negative = backward).
   * @type {number}
   */
  seekSeconds; // was: this.W

  /**
   * Spin-animation debounce timer.
   * @type {Object}
   */
  spinTimer_; // was: this.O (g.Uc)

  /**
   * Whether a double-spin is pending.
   * @type {boolean}
   */
  pendingDoubleSpin_ = false; // was: this.A

  /**
   * @param {Object} api          The player API instance.
   * @param {number} seekSeconds  Seconds to seek (e.g. -10 or +10).
   */
  constructor(api, seekSeconds) {
    // super({…}) — creates the SVG button element
    // …template omitted for brevity — see source lines 110471-110526…

    this.api = api; // was: this.U
    this.seekSeconds = seekSeconds; // was: this.W

    this.spinTimer_ = null; // was: new g.Uc(…, 250)
    this.pendingDoubleSpin_ = false;

    const isForward = seekSeconds > 0; // was: c
    api.createClientVe(this.element, this, isForward ? 36843 : 36844);

    const tooltip = `Seek ${isForward ? 'forward' : 'backwards'} ${Math.abs(seekSeconds)} seconds. (${isForward ? '\u2192' : '\u2190'})`;
    this.update({
      title: tooltip,
      'data-title-no-tooltip': tooltip,
      'aria-keyshortcuts': isForward ? '\u2192' : '\u2190',
    });

    // Set the numeric label in the SVG text element
    const textElement = this.element.querySelector('.ytp-jump-button-text'); // was: this.j
    if (textElement) {
      textElement.textContent = Math.abs(seekSeconds).toString();
    }
  }
}

// ---------------------------------------------------------------------------
// AdButtonRenderer
// ---------------------------------------------------------------------------

/**
 * Renders an ad call-to-action button with optional text and icon.
 * Applies style classes based on `ButtonRenderer.style` and dispatches
 * ad-command execution on click.
 *
 * Template:
 *   <span class="ytp-ad-button-text">…</span>
 *   <span class="ytp-ad-button-icon"><svg…/></span>
 *
 * [was: wK]
 */
export class AdButtonRenderer /* extends AdComponent (ad component base) */ {
  /**
   * The resolved aria-label text, if any.
   * @type {string|null}
   */
  ariaLabel_ = null; // was: this.A (via g.KK with ytp-ad-button-text)

  /**
   * Text span component.
   * @type {Object|null}
   */
  textComponent_ = null; // was: this.A (g.KK)

  /**
   * Icon span component.
   * @type {Object|null}
   */
  iconComponent_ = null; // was: this.O (g.KK)

  /**
   * Whether the icon should be placed before the text.
   * @type {boolean}
   */
  iconFirst_ = false; // was: this.K

  /**
   * Initialises the button from a ButtonRenderer response object.
   *
   * @param {string} elementId    Unique element ID.
   * @param {Object} data         ButtonRenderer data from the server.
   * @param {Object} macros       Template macro map.
   */
  init(elementId, data, macros) { // was: init(Q, c, W)
    // super.init(elementId, data, macros);
    // this.rendererData_ = data; // was: this.W

    if (data.text == null && data.icon == null) {
      // Error: "ButtonRenderer did not have text or an icon set."
      return;
    }

    // Apply style class
    let styleClass = null; // was: Q
    switch (data.style || null) {
      case 'STYLE_UNKNOWN':
        styleClass = 'ytp-ad-button-link';
        break;
      default:
        styleClass = null;
    }
    if (styleClass !== null) {
      this.element.classList.add(styleClass); // was: g.xK(this.element, Q)
    }

    // Render text
    if (data.text != null) {
      const text = data.text; // was: g.rK(c.text)
      if (text) {
        this.element.setAttribute('aria-label', text);
        // Create text span: <span class="ytp-ad-button-text">text</span>
      }
    }

    // Accessibility override
    const a11y = data.accessibilityData?.accessibilityData;
    if (a11y?.label) {
      this.element.setAttribute('aria-label', a11y.label);
    }

    // Render icon
    if (data.icon != null) {
      // Create icon span: <span class="ytp-ad-button-icon">…svg…</span>
    }
  }

  /**
   * Hides the button.
   */
  clear() {
    this.hide();
  }

  /**
   * Handles click — executes the ad command attached to the button.
   * @param {Event} event
   */
  onClick(event) { // was: onClick(Q)
    // super.onClick(event);
    // Execute each command in Vq_(this) via this.vA.executeCommand(…)
    // Notify: this.api.onAdUxClicked(this.componentType, this.layoutId)
  }
}

// ---------------------------------------------------------------------------
// AdHoverTextButton
// ---------------------------------------------------------------------------

/**
 * A button that shows hover text (tooltip callout) alongside a nested
 * AdButtonRenderer. Used for ad info/disclosure hover interactions.
 *
 * [was: Eey]
 */
export class AdHoverTextButton /* extends AdComponent */ {
  /**
   * The inner ad button instance.
   * @type {AdButtonRenderer|null}
   */
  innerButton = null; // was: this.button

  /**
   * Hover text container element.
   * @type {Object|null}
   */
  hoverTextContainer_ = null; // was: this.O

  /**
   * Whether to show callout triangle.
   * @type {boolean}
   */
  showCallout_; // was: this.K

  /**
   * Whether "clean player" styling is applied.
   * @type {boolean}
   */
  cleanPlayerMode_; // was: this.A

  /**
   * Initialises from AdHoverTextButtonRenderer response data.
   *
   * @param {string} elementId
   * @param {Object} data       AdHoverTextButtonRenderer data.
   * @param {Object} macros
   */
  init(elementId, data, macros) {
    const hoverText = data.hoverText || null; // was: Q
    const buttonData = data.button || null;   // was: c

    if (buttonData == null) {
      // Error: "AdHoverTextButtonRenderer.button was not set in response."
      return;
    }

    this.innerButton = new AdButtonRenderer(/* … */);
    this.innerButton.init('button', buttonData, macros);

    if (hoverText) {
      this.innerButton.element.setAttribute('aria-label', hoverText);
    }

    this.show();
  }

  hide() {
    if (this.innerButton) this.innerButton.hide();
    if (this.hoverTextContainer_) this.hoverTextContainer_.hide();
    // super.hide();
  }

  show() {
    if (this.innerButton) this.innerButton.show();
    // super.show();
  }
}
