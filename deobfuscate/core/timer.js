/**
 * Timer — an interval/tick timer that extends EventTarget (g.$R).
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Constructor (g.DE):         line ~7364
 *   g.bw(g.DE, g.$R):          line ~62012
 *   Prototype methods:          lines ~62013-62049
 *     .enabled                  line ~62014
 *     .timerId_ (ot)            line ~62015
 *     .setInterval()            lines ~62016-62020
 *     .tick_ (kT)               lines ~62022-62031
 *     .start()                  lines ~62033-62036
 *     .stop()                   lines ~62039-62043
 *     .disposeInternal (WA)     lines ~62045-62049
 *
 * Also documented: the simpler one-shot timer g.Uc (Delay):
 *   Constructor:                line ~9330
 *   g.bw(g.Uc, g.qK):          line ~64524
 *   Prototype methods:          lines ~64525-64559
 *
 * g.DE fires a "tick" event each interval. It extends g.$R (EventTarget)
 * which itself extends Disposable (g.qK). g.$R provides
 * addEventListener/removeEventListener/dispatchEvent.
 *
 * Since g.$R is not yet fully deobfuscated, Timer extends ObservableTarget
 * (g.W1) — a Disposable with pub/sub — using publish('tick') in place of
 * the original dispatchEvent('tick').
 *
 * g.Uc is a simpler one-shot delayed callback (no events); it extends
 * Disposable (g.qK) directly.
 */

import { Disposable } from './disposable.js';
import { ObservableTarget } from './event-target.js';

/* =========================================================================
 * Timer (interval / repeating)
 * ========================================================================= */

/**
 * A repeating interval timer that publishes "tick" events.
 *
 * Extends ObservableTarget (standing in for g.$R / EventTarget).
 * Consumers listen via timer.subscribe('tick', handler).
 */
/* was: g.DE */
export class Timer extends ObservableTarget {
  /**
   * @param {number}  [interval=1] - Interval in milliseconds between ticks.
   * @param {Window}  [win=globalThis] - The window object used for
   *   setTimeout / clearTimeout.
   */
  constructor(interval, win) {
    super();

    /** @type {number} Interval in ms. */
    this.interval_ = interval || 1; /* was: eW */

    /** @type {Window} */
    this.window_ = win || globalThis; /* was: RW */

    /**
     * Bound reference to the internal tick handler, suitable for
     * passing to setTimeout.
     * @type {Function}
     */
    this.boundTick_ = this.tick_.bind(this); /* was: rZ */

    /**
     * Timestamp (ms) of the last start() call — used by tick_() to
     * compensate for drift.
     * @type {number}
     */
    this.lastStartTime_ = Date.now(); /* was: vu — now() returns Date.now() */
  }

  /**
   * Whether the timer is currently running.
   * @type {boolean}
   */
  enabled = false;

  /**
   * The pending setTimeout id, or null when not scheduled.
   * @type {number|null}
   */
  timerId_ = null; /* was: ot */

  /* ---- Interval ---- */

  /**
   * Change the tick interval. If the timer is running it is restarted
   * with the new interval; if it was only scheduled (not enabled) it
   * is stopped.
   *
   * @param {number} interval - New interval in milliseconds.
   */
  /* was: setInterval (not the global!) */
  setInterval(interval) {
    this.interval_ = interval;
    if (this.timerId_ && this.enabled) {
      this.stop();
      this.start();
    } else if (this.timerId_) {
      this.stop();
    }
  }

  /* ---- Start / Stop ---- */

  /**
   * Start the timer. If already started this is a no-op (the existing
   * schedule is kept).
   */
  start() {
    this.enabled = true;
    if (!this.timerId_) {
      this.timerId_ = this.window_.setTimeout(this.boundTick_, this.interval_);
      this.lastStartTime_ = Date.now();
    }
  }

  /**
   * Stop the timer and cancel any pending tick.
   */
  stop() {
    this.enabled = false;
    if (this.timerId_) {
      this.window_.clearTimeout(this.timerId_);
      this.timerId_ = null;
    }
  }

  /* ---- Internal ---- */

  /**
   * Internal tick handler called by setTimeout. Compensates for timer
   * drift: if the callback fires too early (< 80 % of interval) it
   * reschedules for the remaining time instead of dispatching.
   * @private
   */
  /* was: kT */
  tick_() {
    if (this.enabled) {
      const elapsed = Date.now() - this.lastStartTime_;
      if (elapsed > 0 && elapsed < this.interval_ * 0.8) {
        /* fired too early — reschedule for the remainder */
        this.timerId_ = this.window_.setTimeout(
          this.boundTick_,
          this.interval_ - elapsed,
        );
      } else {
        if (this.timerId_) {
          this.window_.clearTimeout(this.timerId_);
          this.timerId_ = null;
        }
        this.publish('tick');
        if (this.enabled) {
          this.stop();
          this.start();
        }
      }
    }
  }

  /* ---- Dispose ---- */

  /**
   * Release resources — stop the timer and delete the window reference.
   * Called by the Disposable framework (not directly).
   */
  /* was: WA */
  disposeInternal() {
    super.disposeInternal();
    this.stop();
    delete this.window_;
  }
}

/* =========================================================================
 * Delay (one-shot timer)
 * ========================================================================= */

/**
 * A one-shot delayed callback. Simpler than Timer — no events, just a
 * callback that fires once after a delay.
 *
 * Extends Disposable (g.qK) directly.
 */
/* was: g.Delay */
export class Delay extends Disposable {
  /**
   * @param {Function} callback  - Function to call when the delay expires.
   * @param {number}   [delay=0] - Delay in milliseconds.
   * @param {Object}   [scope]   - `this` context for the callback.
   */
  constructor(callback, delay, scope) {
    super();

    /** @type {Function} The user-supplied callback. */
    this.callback_ = callback; /* was: W */

    /** @type {number} Default delay in ms. */
    this.delay_ = delay || 0; /* was: eW */

    /** @type {Object|undefined} Callback scope. */
    this.scope_ = scope; /* was: O */

    /**
     * Bound internal handler passed to setTimeout.
     * @type {Function}
     */
    this.boundHandler_ = this.onTimer_.bind(this); /* was: A */
  }

  /**
   * Active setTimeout id, or 0 when not scheduled.
   * @type {number}
   */
  timerId_ = 0; /* was: dY */

  /* ---- Public API ---- */

  /**
   * Start (or restart) the timer.
   *
   * @param {number} [delay] - Override delay; uses default if omitted.
   */
  start(delay) {
    this.stop();
    this.timerId_ = setTimeout(this.boundHandler_, delay !== undefined ? delay : this.delay_);
  }

  /**
   * Start only if not already active (no-op when running).
   *
   * @param {number} [delay] - Override delay.
   */
  /* was: cw */
  startIfNotActive(delay) {
    if (!this.isActive()) {
      this.start(delay);
    }
  }

  /**
   * Cancel the pending callback.
   */
  stop() {
    if (this.isActive()) {
      clearTimeout(this.timerId_);
    }
    this.timerId_ = 0;
  }

  /**
   * If active, fire the callback immediately (stop + fire).
   */
  /* was: fB */
  fireIfActive() {
    if (this.isActive()) {
      this.stop();
      this.onTimer_();
    }
  }

  /**
   * Whether a callback is currently pending.
   * @returns {boolean}
   */
  isActive() {
    return this.timerId_ !== 0;
  }

  /* ---- Internal ---- */

  /**
   * Internal handler invoked by setTimeout.
   * @private
   */
  /* was: SS */
  onTimer_() {
    this.timerId_ = 0;
    if (this.callback_) {
      this.callback_.call(this.scope_);
    }
  }

  /**
   * Release resources — stop the timer and delete callback references.
   * Called by the Disposable framework (not directly).
   */
  /* was: WA */
  disposeInternal() {
    super.disposeInternal();
    this.stop();
    delete this.callback_;
    delete this.scope_;
  }
}
