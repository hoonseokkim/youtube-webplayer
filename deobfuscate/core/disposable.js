/**
 * Disposable — base class for objects that hold resources requiring cleanup.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Constructor:        line ~4765   (g.qK = function)
 *   Prototype methods:  lines ~59121-59145  (g.qK.prototype.*)
 *
 * Related helpers (not included):
 *   g.BN  (line ~4754) — null-safe dispose caller
 *   g.xE  (line ~4758) — dispose multiple / array
 *   g.F   (line ~4770) — register another disposable for cascading disposal
 */
import { getRemoteModule } from '../player/caption-manager.js'; // was: w7
import { dispose } from '../ads/dai-cue-range.js';

/* was: g.Disposable */
export class Disposable {
  /**
   * Whether this object has already been disposed.
   * @type {boolean}
   */
  isDisposed_ = false; /* was: getRemoteModule */

  /**
   * Callbacks to invoke on disposal.
   * Lazily initialised on first call to {@link addOnDisposeCallback}.
   * @type {Array<Function>|undefined}
   */
  onDisposeCallbacks_ = undefined; /* was: yY */

  constructor() {
    // Original code re-assigned the prototype defaults onto the instance:
    //   this.w7 = this.w7;
    //   this.yY = this.yY;
    // This ensured own-property copies of the prototype values so that
    // later writes would not mutate the prototype.  With class fields
    // the values are already own properties, so no extra work is needed.
  }

  /**
   * Returns whether this object has been disposed.
   * @returns {boolean}
   */
  /* was: u0 */
  isDisposed() {
    return this.isDisposed_;
  }

  /**
   * Disposes of the object, releasing any held resources.
   * Calling dispose() more than once is safe — subsequent calls are no-ops.
   */
  dispose() {
    if (!this.isDisposed_) {
      this.isDisposed_ = true;
      this.disposeInternal();
    }
  }

  /**
   * Implements the TC39 Explicit Resource Management protocol.
   * Allows `using obj = new Disposable();` syntax.
   */
  [Symbol.dispose]() {
    this.dispose();
  }

  /**
   * Registers a callback to be invoked when this object is disposed.
   *
   * If the object has *already* been disposed the callback fires
   * synchronously (immediately).
   *
   * @param {Function} callback   The function to call on disposal.
   * @param {Object}   [context]  Optional `this` binding for the callback.
   */
  /* was: addOnDisposeCallback */
  addOnDisposeCallback(callback, context) {
    if (this.isDisposed_) {
      // Already disposed — fire the callback right away.
      context !== undefined ? callback.call(context) : callback();
    } else {
      if (!this.onDisposeCallbacks_) {
        this.onDisposeCallbacks_ = [];
      }
      if (context) {
        callback = callback.bind(context);
      }
      this.onDisposeCallbacks_.push(callback);
    }
  }

  /**
   * Subclass hook — override to perform custom cleanup.
   *
   * Called exactly once, from {@link dispose}, after the disposed flag has
   * been set.  The default implementation drains the
   * {@link onDisposeCallbacks_} queue.
   *
   * @protected
   */
  /* was: WA */
  disposeInternal() {
    if (this.onDisposeCallbacks_) {
      while (this.onDisposeCallbacks_.length) {
        this.onDisposeCallbacks_.shift()();
      }
    }
  }
}
