/**
 * EventHandler — manages DOM event listener lifecycles with automatic cleanup.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Base class (aB):   lines ~66940-66984
 *   Subclass (g.db):   lines ~75580-75584
 *
 * Usage pattern:
 *   this.events = new EventHandler(this);
 *   this.events.listen(element, 'click', this.onClick);
 *
 * The base class (aB) does the real work — it keeps an array of
 * { target, name, callback } records and removes them on dispose.
 * g.db just re-exports the same interface; the only override is B()
 * which calls super.B().
 *
 * Related helpers (not included):
 *   g.Ei  (line ~10963)  — wraps a callback with yterr error reporting
 *   g.EO  (bind helper)  — binds a function to a context
 *   Qt7   — returns whether passive event listeners are supported
 */

import { Disposable } from './disposable.js';
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { listen, unlisten } from './composition-helpers.js';
import { splice, removeAll } from './array-utils.js';
import { defineProperty } from './polyfills.js';

/**
 * A registered event listener record.
 * @typedef {{target: EventTarget, name: string, callback: Function}} ListenerRecord
 */

/* was: aB */
class EventHandlerBase extends Disposable {
  /**
   * @param {Object} [handler] - The default `this` context for listener
   *   callbacks. Defaults to this EventHandler instance.
   */
  constructor(handler) {
    super();
    /** @type {ListenerRecord[]} */
    this.listeners_ = []; /* was: J */
    /** @type {Object} */
    this.handler_ = handler || this; /* was: readRepeatedMessageField */
  }

  /**
   * Register a DOM event listener.
   *
   * The callback is bound to `handler_` (the object passed to the constructor)
   * via g.EO, then wrapped with g.Ei for error reporting.
   *
   * @param {EventTarget} target   - DOM element or EventTarget to listen on.
   * @param {string}      name     - Event name (e.g. 'click').
   * @param {Function}    callback - Handler function.
   * @param {Object}      [scope]  - Optional `this` for the callback
   *   (defaults to `this.handler_`).
   * @param {boolean}     [passive] - If true and the browser supports it,
   *   registers a { passive: true } listener.
   * @returns {ListenerRecord} The record, usable with `unlisten()`.
   */
  /* was: B */
  listen(target, name, callback, scope, passive) {
    /* g.Ei( g.EO(callback, scope || this.handler_) ) */
    const bound = callback.bind(scope || this.handler_);

    const record = {
      target,
      name,
      callback: bound,
    };

    let options;
    if (passive && supportsPassive()) {
      options = { passive: true };
    }

    target.addEventListener(name, record.callback, options);
    this.listeners_.push(record);
    return record;
  }

  /**
   * Remove a single previously-registered listener.
   *
   * @param {ListenerRecord} record - The record returned by `listen()`.
   */
  /* was: Xd */
  unlisten(record) {
    for (let i = 0; i < this.listeners_.length; i++) {
      if (this.listeners_[i] === record) {
        this.listeners_.splice(i, 1);
        record.target.removeEventListener(record.name, record.callback);
        break;
      }
    }
  }

  /**
   * Remove all registered listeners.
   *
   * @param {boolean} [passive] - If true, passes { passive: true } options
   *   when calling removeEventListener (mirrors the add path).
   */
  /* was: O */
  removeAll(passive) {
    while (this.listeners_.length) {
      const record = this.listeners_.pop();
      let options;
      if (passive && supportsPassive()) {
        options = { passive: true };
      }
      record.target.removeEventListener(record.name, record.callback, options);
    }
  }

  /**
   * Release resources — removes all listeners and calls super.
   * Called by the Disposable framework (not directly).
   */
  /* was: WA */
  disposeInternal() {
    this.removeAll();
    super.disposeInternal();
  }
}

/* was: g.EventHandler */
export class EventHandler extends EventHandlerBase {
  /**
   * Register a DOM event listener (delegates to base class).
   *
   * @param {EventTarget} target
   * @param {string}      name
   * @param {Function}    callback
   * @param {Object}      [scope]
   * @param {boolean}     [passive]
   * @returns {ListenerRecord}
   */
  /* was: B */
  listen(target, name, callback, scope, passive) {
    return super.listen(target, name, callback, scope, passive);
  }
}

/**
 * Check whether the browser supports passive event listener options.
 * (Mirrors the Qt7() helper in base.js.)
 *
 * @returns {boolean}
 */
function supportsPassive() {
  /* Cached result — computed once */
  if (supportsPassive._result !== undefined) {
    return supportsPassive._result;
  }
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive._result = true;
      },
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch {
    supportsPassive._result = false;
  }
  return supportsPassive._result ?? false;
}
