/**
 * YouTube Player Promise Wrapper
 *
 * A custom Promise-like implementation used for IndexedDB transaction handling.
 * Unlike native Promises, this implementation resolves synchronously when possible,
 * which is critical for IDB transactions that require microtask-level timing.
 *
 * Deobfuscated from base.js
 * Source lines: 67347-67351 (PromiseExecutor), 67353-67436 (PromiseWrapper),
 *              12344-12384 (helper functions: identity, rethrow, handleResolve, handleReject, chainPromise)
 */

/**
 * Identity function -- default onFulfilled handler for .then().
 * [was: ysw]
 *
 * @param {*} value
 * @returns {*} The same value, unchanged
 */
function identity(value) {
  return value;
}

/**
 * Rethrow function -- default onRejected handler for .then().
 * Throws the rejection reason (or a generic Error if falsy).
 * [was: iU7]
 *
 * @param {*} reason
 * @throws {*} Always throws
 */
function rethrow(reason) {
  if (!reason) throw Error();
  throw reason;
}

/**
 * Handle resolution of a fulfilled promise by applying the onFulfilled callback.
 * If the callback returns a PromiseWrapper, chains it; otherwise resolves directly.
 * [was: SVR]
 *
 * @param {PromiseWrapper} promise - The source promise (must be FULFILLED)
 * @param {PromiseWrapper} chainedPromise - The chained promise (for circular detection)
 * @param {Function} onFulfilled - Fulfillment handler
 * @param {Function} resolve - Resolve callback for the new promise
 * @param {Function} reject - Reject callback for the new promise
 */
function handleResolve(promise, chainedPromise, onFulfilled, resolve, reject) {
  try {
    if (promise.state.status !== "FULFILLED") {
      throw Error("calling handleResolve before the promise is fulfilled.");
    }
    const result = onFulfilled(promise.state.value);
    if (result instanceof PromiseWrapper) {
      chainPromise(promise, chainedPromise, result, resolve, reject);
    } else {
      resolve(result);
    }
  } catch (err) {
    reject(err);
  }
}

/**
 * Handle resolution of a rejected promise by applying the onRejected callback.
 * If the callback returns a PromiseWrapper, chains it; otherwise resolves directly.
 * [was: F47]
 *
 * @param {PromiseWrapper} promise - The source promise (must be REJECTED)
 * @param {PromiseWrapper} chainedPromise - The chained promise (for circular detection)
 * @param {Function} onRejected - Rejection handler
 * @param {Function} resolve - Resolve callback for the new promise
 * @param {Function} reject - Reject callback for the new promise
 */
function handleReject(promise, chainedPromise, onRejected, resolve, reject) {
  try {
    if (promise.state.status !== "REJECTED") {
      throw Error("calling handleReject before the promise is rejected.");
    }
    const result = onRejected(promise.state.reason);
    if (result instanceof PromiseWrapper) {
      chainPromise(promise, chainedPromise, result, resolve, reject);
    } else {
      resolve(result);
    }
  } catch (err) {
    reject(err);
  }
}

/**
 * Chain a PromiseWrapper result through to the next resolve/reject pair,
 * detecting circular chains.
 * [was: lK]
 *
 * @param {PromiseWrapper} _originalPromise - The original promise (unused, kept for parity)
 * @param {PromiseWrapper} chainedPromise - The chained promise to check for circularity
 * @param {PromiseWrapper} resultPromise - The promise returned by a handler
 * @param {Function} resolve - Resolve callback
 * @param {Function} reject - Reject callback
 */
function chainPromise(_originalPromise, chainedPromise, resultPromise, resolve, reject) {
  if (chainedPromise === resultPromise) {
    reject(new TypeError("Circular promise chain detected."));
  } else {
    resultPromise.then(
      (value) => {
        if (value instanceof PromiseWrapper) {
          chainPromise(_originalPromise, chainedPromise, value, resolve, reject);
        } else {
          resolve(value);
        }
      },
      (reason) => {
        reject(reason);
      }
    );
  }
}

/**
 * Internal executor wrapper. Holds the executor function so that
 * PromiseWrapper's constructor can unwrap it via `.W`.
 * [was: uK]
 */
export class PromiseExecutor {
  /**
   * @param {function(function(*): void, function(*): void): void} executor
   */
  constructor(executor) {
    /** @type {function(function(*): void, function(*): void): void} */
    this.executor = executor; /* was: this.W */
  }
}

/**
 * A synchronous Promise-like wrapper used primarily for IndexedDB transactions.
 *
 * Unlike native Promises which always resolve asynchronously (microtask),
 * this implementation resolves synchronously when possible. This is important
 * for IDB transactions which can auto-close if there are no pending requests
 * in the same microtask.
 *
 * Usage:
 *   const p = new PromiseWrapper(new PromiseExecutor((resolve, reject) => { ... }));
 *   p.then(value => ...).catch(err => ...);
 *
 * [was: g.P8]
 */
export class PromiseWrapper {
  /**
   * @param {PromiseExecutor} executorWrapper - Wrapped executor function
   */
  constructor(executorWrapper) {
    /**
     * Current state of the promise.
     * @type {{ status: "PENDING" } | { status: "FULFILLED", value: * } | { status: "REJECTED", reason: * }}
     */
    this.state = { status: "PENDING" };

    /**
     * Queued fulfillment callbacks.
     * [was: this.W]
     * @type {Array<Function>}
     */
    this.onFulfilledCallbacks = [];

    /**
     * Queued rejection callbacks.
     * [was: this.O]
     * @type {Array<Function>}
     */
    this.onRejectedCallbacks = [];

    const executor = executorWrapper.executor; /* was: Q.W */

    const resolve = (value) => {
      if (this.state.status === "PENDING") {
        this.state = { status: "FULFILLED", value };
        for (const callback of this.onFulfilledCallbacks) {
          callback();
        }
      }
    };

    const reject = (reason) => {
      if (this.state.status === "PENDING") {
        this.state = { status: "REJECTED", reason };
        for (const callback of this.onRejectedCallbacks) {
          callback();
        }
      }
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  /**
   * Resolve all promises in the iterable and return a PromiseWrapper
   * that fulfills with an array of results.
   *
   * @param {Array<PromiseWrapper|*>} promises
   * @returns {PromiseWrapper}
   */
  static all(promises) {
    return new PromiseWrapper(
      new PromiseExecutor((resolve, reject) => {
        const results = [];
        let remaining = promises.length;

        if (remaining === 0) {
          resolve(results);
        }

        for (let i = 0; i < promises.length; ++i) {
          PromiseWrapper.resolve(promises[i])
            .then((value) => {
              results[i] = value;
              remaining--;
              if (remaining === 0) {
                resolve(results);
              }
            })
            .catch((reason) => {
              reject(reason);
            });
        }
      })
    );
  }

  /**
   * Wrap a value or PromiseWrapper in a resolved PromiseWrapper.
   *
   * @param {PromiseWrapper|*} value
   * @returns {PromiseWrapper}
   */
  static resolve(value) {
    return new PromiseWrapper(
      new PromiseExecutor((resolve, reject) => {
        if (value instanceof PromiseWrapper) {
          value.then(resolve, reject);
        } else {
          resolve(value);
        }
      })
    );
  }

  /**
   * Create a PromiseWrapper that is immediately rejected with the given reason.
   *
   * @param {*} reason
   * @returns {PromiseWrapper}
   */
  static reject(reason) {
    return new PromiseWrapper(
      new PromiseExecutor((_resolve, reject) => {
        reject(reason);
      })
    );
  }

  /**
   * Register fulfillment and/or rejection handlers.
   * Returns a new PromiseWrapper for chaining.
   *
   * @param {Function} [onFulfilled] - Called when the promise is fulfilled
   * @param {Function} [onRejected] - Called when the promise is rejected
   * @returns {PromiseWrapper}
   */
  then(onFulfilled, onRejected) {
    const fulfilledHandler = onFulfilled ?? identity;
    const rejectedHandler = onRejected ?? rethrow;

    return new PromiseWrapper(
      new PromiseExecutor((resolve, reject) => {
        if (this.state.status === "PENDING") {
          this.onFulfilledCallbacks.push(() => {
            handleResolve(this, this, fulfilledHandler, resolve, reject);
          });
          this.onRejectedCallbacks.push(() => {
            handleReject(this, this, rejectedHandler, resolve, reject);
          });
        } else if (this.state.status === "FULFILLED") {
          handleResolve(this, this, fulfilledHandler, resolve, reject);
        } else if (this.state.status === "REJECTED") {
          handleReject(this, this, rejectedHandler, resolve, reject);
        }
      })
    );
  }

  /**
   * Register a rejection handler. Shorthand for `.then(undefined, onRejected)`.
   *
   * @param {Function} onRejected - Called when the promise is rejected
   * @returns {PromiseWrapper}
   */
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
}

// ---------------------------------------------------------------------------
// DeferredPromise  [was: g8, lines 76665-76683]
// ---------------------------------------------------------------------------

/**
 * A deferred promise that exposes `resolve()` and `reject()` methods
 * externally. Wraps a PromiseWrapper internally.
 *
 * Usage:
 *   const d = new DeferredPromise();
 *   d.then(value => console.log(value));
 *   d.resolve(42);
 *
 * [was: g8] -- referenced in the codebase as `new g.DeferredPromise()` or `new g8()`
 */
export class DeferredPromise {
  constructor() {
    /** @private */
    this._resolve = DeferredPromise._noop;
    /** @private */
    this._reject = DeferredPromise._noop;
    /** @type {PromiseWrapper} */
    this.promise = new PromiseWrapper(
      new PromiseExecutor((resolve, reject) => {
        this._resolve = resolve;
        this._reject = reject;
      })
    );
  }

  /**
   * Chain a fulfillment/rejection handler.
   * @param {Function} [onFulfilled]
   * @param {Function} [onRejected]
   * @returns {PromiseWrapper}
   */
  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }

  /**
   * Resolve the deferred promise with a value.
   * @param {*} value
   */
  resolve(value) {
    this._resolve(value);
  }

  /**
   * Reject the deferred promise with a reason.
   * @param {*} reason
   */
  reject(reason) {
    this._reject(reason);
  }

  /** @private */
  static _noop() {
    throw new Error("DeferredPromise: resolve/reject called before initialization");
  }
} // [was: g8 / g.DeferredPromise]
