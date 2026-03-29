
/**
 * PlayerComponent — interactive UI component with event listener management.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Class definition: lines ~69484-69543  (g.k)
 *   Extends:          g.Mu (UIComponent)
 *
 * Adds visibility toggling, an interactivity flag, and a managed list of
 * DOM event listeners that are automatically cleaned up on disposal.
 *
 * [was: g.k]
 */

import { UIComponent } from './base-component.js';
import { listen } from '../core/composition-helpers.js';
import { forEach } from '../core/event-registration.js';
import { splice } from '../core/array-utils.js';

export class PlayerComponent extends UIComponent {
  /**
   * Whether the component is currently visible.
   * @type {boolean}
   */
  isVisible_ = true; // was: OC

  /**
   * Whether the component is in an interactive/enabled state.
   * @type {boolean}
   */
  isInteractive = false; // was: mF

  /**
   * Managed event listener records. Each entry is
   * `{ target, type, listener }`.
   * @type {Array<{target: EventTarget, type: string, listener: Function}>}
   */
  listeners = [];

  /**
   * @param {Object} template  A template descriptor (see {@link UIComponent}).
   */
  constructor(template) {
    super(template);
    this.isVisible_ = true;
    this.isInteractive = false;
    this.listeners = [];
  }

  /**
   * Sets text content via a template binding.
   *
   * @param {string} content      The text to inject.
   * @param {string} [binding]    Binding name; defaults to `"content"`.
   */
  setContent(content, binding) {
    this.updateValue(binding || 'content', content);
  }

  /**
   * Shows the component (removes `display: none`).
   */
  show() {
    if (!this.isVisible_) {
      this.element.style.display = ''; // was: g.JA(this.element, "display", "")
      this.isVisible_ = true;
    }
  }

  /**
   * Hides the component (sets `display: none`).
   */
  hide() {
    if (this.isVisible_) {
      this.element.style.display = 'none'; // was: g.JA(this.element, "display", "none")
      this.isVisible_ = false;
    }
  }

  /**
   * Shows or hides the component based on a boolean flag.
   *
   * @param {boolean} visible
   */
  /* was: BB */
  setVisible(visible) {
    visible ? this.show() : this.hide();
  }

  /**
   * Sets the interactive/enabled state.
   *
   * @param {boolean} interactive
   */
  /* was: z7 */
  setInteractive(interactive) {
    this.isInteractive = interactive;
  }

  /**
   * Returns whether the component is currently visible.
   *
   * @returns {boolean}
   */
  /* was: Q1 */
  isShown() {
    return this.isVisible_;
  }

  /**
   * Adds a DOM event listener on this component's own element.
   *
   * The listener is automatically removed on disposal.
   *
   * @param {string}   type       DOM event type (e.g. `"click"`).
   * @param {Function} handler    The callback.
   * @param {Object}   [context]  Optional `this` binding.
   * @returns {{target: EventTarget, type: string, listener: Function}}
   *          A listener record that can be passed to {@link removeListener}.
   */
  listen(type, handler, context) {
    return this.addDomListener(this.element, type, handler, context);
  }

  /**
   * Adds a DOM event listener on an arbitrary target.
   *
   * The listener is automatically removed on disposal.
   *
   * @param {EventTarget} target
   * @param {string}      type
   * @param {Function}    handler
   * @param {Object}      [context]
   * @returns {{target: EventTarget, type: string, listener: Function}}
   */
  /* was: B */
  addDomListener(target, type, handler, context) {
    const bound = handler.bind(context || this); // was: (0, g.EO)(handler, context || this)
    const record = {
      target,
      type,
      listener: bound,
    };
    this.listeners.push(record);
    target.addEventListener(type, bound);
    return record;
  }

  /**
   * Removes a previously registered listener record.
   *
   * @param {Object} record  The record returned by {@link listen} or
   *                         {@link addDomListener}.
   */
  /* was: Xd */
  removeListener(record) {
    this.listeners.forEach((entry, index) => {
      if (entry === record) {
        const removed = this.listeners.splice(index, 1)[0];
        removed.target.removeEventListener(removed.type, removed.listener);
      }
    });
  }

  /**
   * Focuses this component's root element.
   */
  focus() {
    this.element.focus();
  }

  /** @override */
  /* was: WA */
  disposeInternal() {
    while (this.listeners.length) {
      const record = this.listeners.pop();
      if (record) {
        record.target.removeEventListener(record.type, record.listener);
      }
    }
    super.disposeInternal();
  }
}
