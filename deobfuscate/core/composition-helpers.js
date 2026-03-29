import { BrowserEvent } from './dom-event.js'; // was: HO
import { isObject, partial, getObjectByPath } from './type-helpers.js'; // was: g.Sd, g.sO, g.DR
import { Disposable } from './disposable.js'; // was: g.qK
import { getDomain, buildQueryFromObject } from './url-utils.js'; // was: g.D9, g.EJ
import { extendObject } from './object-utils.js'; // was: g.JH
import { getUserAgent } from './browser-detection.js'; // was: g.iC
import { sendXhrRequest } from '../network/request.js'; // was: g.Wn
import { LISTENER_MAP_KEY } from '../data/event-logging.js'; // was: bs
import { globalListenerCount } from '../data/event-logging.js'; // was: O7
import { getBufferHealth } from '../media/segment-request.js'; // was: El
import { setConnectData } from '../modules/remote/mdx-client.js'; // was: Wa
import { activeListeners } from '../data/event-logging.js'; // was: aF
import { createConditionalExtractor } from '../data/metrics-keys.js'; // was: oB
import { globalRef } from '../proto/messages-core.js'; // was: g.qX
import { logError } from './composition-helpers.js'; // was: g.Zp
import { plusDecode } from '../data/idb-transactions.js'; // was: Ni
import { moduleLoadTimestamp } from '../media/grpc-parser.js'; // was: IYy
import { win } from '../proto/messages-core.js'; // was: bI
import { BitField } from '../data/session-storage.js'; // was: e1W
import { bitmaskValue } from './bitstream-helpers.js'; // was: wSd
import { reloadPage } from '../media/format-retry.js'; // was: bc
import { createXhr } from '../network/request.js'; // was: VWw
import { isSameOrigin } from '../network/service-endpoints.js'; // was: ax
import { HEADER_TO_CONFIG_KEY } from '../network/innertube-client.js'; // was: nJy
import { isGoogleDomain } from '../data/idb-transactions.js'; // was: rCm
import { onRawStateChange } from '../player/player-events.js'; // was: w_
import { appendQueryParams } from '../network/service-endpoints.js'; // was: fe
import { parseQueryString } from '../data/idb-transactions.js'; // was: bk
import { appendQueryParamsPreserveExisting } from '../network/service-endpoints.js'; // was: vz
import { SuccessResponse } from '../network/retry-policy.js'; // was: dS7
import { PromiseAjaxError } from '../network/retry-policy.js'; // was: Kh
import { catchCustom } from '../ads/ad-async.js'; // was: fF
import { sendPostRequest } from '../network/request.js'; // was: ms
import { BeforeContentVideoIdStartedTrigger } from '../ads/ad-trigger-types.js'; // was: sz
import { userAgentContains } from './composition-helpers.js'; // was: g.Hn
import { userSkipAd } from '../ads/dai-cue-range.js'; // was: s1
import { hasSapisidCookie } from './event-system.js'; // was: Q2
import { BiscottiMissingError } from '../network/retry-policy.js'; // was: hE
import { BiscottiError } from '../network/retry-policy.js'; // was: MWO
import { remove, concat, slice, splice, extend } from './array-utils.js';
import { toString, startsWith, endsWith } from './string-utils.js';
import { forEach } from './event-registration.js';
import { isEmptyObject, shallowClone, getWithDefault } from './object-utils.js';
import { getElementsByTagName } from './dom-utils.js';
import { isAndroid } from './browser-detection.js'; // was: g.Lh
// TODO: resolve g.Hn (user-agent string contains check)
// TODO: resolve g.mN (microtask / nextTick scheduler)
// TODO: resolve g.vB (sentinel / SKIP symbol for ClosurePromise)
// TODO: resolve g.Zp (error reporter / logger)

/**
 * Composition helpers: event listener cleanup, composition/Redux helpers,
 * HTTP/RPC status mapping, script loading/injection, browser/platform detection.
 *
 * Source: base.js lines 6919–7364, 10768–11018, 11099–11927
 * [was: Sa, Z4, g.s7, LW, MS_, E7, fW, vO, gm, JP_, wm, dm, g.$R, PO,
 *  hG, RAm, kYn, g.RF, kR, pW, g.QU, cJ, g.KO, YyX, oY, g.rV, U_, TQ,
 *  VU, JG, WJ, Q_R, Az, IY, Xn, BJ, pb_, eH, Ix, cCm, WSW, eD, Bz, x3,
 *  ne, g.Dp, q4, tB, Hz, y$, g.v, SD, KSR, g.Ei, g.Zp, si, Le, d_, XWn,
 *  lk, BYX, g.hB, uk, g.zn, g.Ce, M4, g.JB, g.Rx, g.P, Y3, pe, k3, Q5,
 *  cn, qgO, ms, H3W, g.Wn, DSX, tWO, i33, EJ_, yCK, FSx, Z3y, xSd, TG,
 *  g.o2, LSR, wWn, U1, I2, g.e$, g.V5, g.Bn, b3_, jUd, g.l, xn, gJR, qt,
 *  nh, Dw, tE, Nt, g.i0, y5, S$, O3_, g.fYK, FF, Zw, vJW, dL, wL, b0,
 *  g.Hn, j$, gL, O1, fh, vn, a2, GG, G0n, g.l0, $n, P6m, z17, um7, h1w,
 *  C6d, JCK, k0n, Ygn, R13, Q6m, Ch]
 */

// ---------------------------------------------------------------------------
// Event-listener bookkeeping (lines 6919–7087)
// ---------------------------------------------------------------------------

/**
 * Mark a listener record [was: Q] as removed and null out its references.
 * @param {Object} listenerRecord  [was: Q]
 */
export function markListenerRemoved(listenerRecord) { // was: anonymous (lines 6919-6925)
  listenerRecord.removed = true; // was: !0
  listenerRecord.listener = null;
  listenerRecord.proxy = null;
  listenerRecord.src = null;
  listenerRecord.handler = null;
}

/**
 * Event-listener map attached to a source object.
 * [was: Sa]
 */
export class ListenerMap { // was: Sa
  constructor(source) { // was: Q
    this.src = source;
    this.listeners = {};
    this.W = 0;
  }
}

/**
 * Remove a specific listener from the listener map.
 * [was: g.Fh]
 * @param {ListenerMap} listenerMap  [was: Q]
 * @param {Object} listenerRecord  [was: c]
 */
export function removeListenerFromMap(listenerMap, listenerRecord) { // was: g.Fh
  const type = listenerRecord.type; // was: W
  if (type in listenerMap.listeners &&
      remove(listenerMap.listeners[type], listenerRecord)) {
    markListenerRemoved(listenerRecord); // was: y2(c)
    if (listenerMap.listeners[type].length === 0) {
      delete listenerMap.listeners[type];
      listenerMap.W--;
    }
  }
}

/**
 * Find the index of a listener in the array by matching its fields.
 * Returns -1 if not found.
 * [was: Z4]
 * @param {Array} listeners  [was: Q]
 * @param {Function} callback  [was: c]
 * @param {boolean} capture  [was: W]
 * @param {Object} handler  [was: m]
 * @returns {number}
 */
export function findListenerIndex(listeners, callback, capture, handler) { // was: Z4
  for (let i = 0; i < listeners.length; ++i) { // was: K
    const entry = listeners[i]; // was: T
    if (!entry.removed &&
        entry.listener === callback &&
        entry.capture === !!capture &&
        entry.handler === handler) {
      return i;
    }
  }
  return -1;
}

/**
 * Listen for an event on a target. Supports arrays of event types.
 * If options.once is set, delegates to listenOnce.
 * [was: g.s7]
 * @param {EventTarget} target  [was: Q]
 * @param {string|string[]} eventType  [was: c]
 * @param {Function|Object} listener  [was: W]
 * @param {Object|boolean} [options]  [was: m]
 * @param {Object} [handler]  [was: K]
 * @returns {Object|null} listener key
 */
export function listen(target, eventType, listener, options, handler) { // was: g.s7
  if (options && options.once) {
    return listenOnce(target, eventType, listener, options, handler); // was: E7
  }
  if (Array.isArray(eventType)) {
    for (let i = 0; i < eventType.length; i++) { // was: T
      listen(target, eventType[i], listener, options, handler);
    }
    return null;
  }
  listener = ensureListener(listener); // was: dm(W)
  return isListenable(target)
    ? target.listen(eventType, listener, isObject(options) ? !!options.capture : !!options, handler)
    : addNativeListener(target, eventType, listener, false, options, handler); // was: LW
}

/**
 * Add a native event listener with proxy wrapping.
 * [was: LW]
 * @param {EventTarget} target  [was: Q]
 * @param {string} eventType  [was: c]
 * @param {Function} listener  [was: W]
 * @param {boolean} isOnce  [was: m]
 * @param {Object|boolean} [options]  [was: K]
 * @param {Object} [handler]  [was: T]
 * @returns {Object} listener key
 */
export function addNativeListener(target, eventType, listener, isOnce, options, handler) { // was: LW
  if (!eventType) {
    throw Error("Invalid event type");
  }
  const useCapture = isObject(options) ? !!options.capture : !!options; // was: r
  let listenerMap = getListenerMap(target); // was: U -> wm(Q)
  if (!listenerMap) {
    target[LISTENER_MAP_KEY] = listenerMap = new ListenerMap(target);
  }
  listener = listenerMap.add(eventType, listener, isOnce, useCapture, handler); // was: W
  if (listener.proxy) {
    return listener;
  }
  const proxy = createListenerProxy(); // was: m -> MS_()
  listener.proxy = proxy;
  proxy.src = target;
  proxy.listener = listener;
  if (target.addEventListener) {
    if (options === undefined) options = false; // was: void 0
    target.addEventListener(eventType.toString(), proxy, options);
  } else if (target.attachEvent) {
    target.attachEvent(toOnEventName(eventType.toString()), proxy); // was: gm
  } else if (target.addListener && target.removeListener) {
    target.addListener(proxy);
  } else {
    throw Error("addEventListener and attachEvent are unavailable.");
  }
  globalListenerCount++;
  return listener;
}

/**
 * Create a proxy function that delegates to handleBrowserEvent.
 * [was: MS_]
 * @returns {Function}
 */
export function createListenerProxy() { // was: MS_
  function proxy(event) { // was: Q
    return handler.call(proxy.src, proxy.listener, event);
  }
  const handler = handleBrowserEvent; // was: c -> JP_
  return proxy;
}

/**
 * Listen for an event exactly once (auto-unlistens after firing).
 * [was: E7]
 */
export function listenOnce(target, eventType, listener, options, handler) { // was: E7
  if (Array.isArray(eventType)) {
    for (let i = 0; i < eventType.length; i++) { // was: T
      listenOnce(target, eventType[i], listener, options, handler);
    }
    return null;
  }
  listener = ensureListener(listener); // was: dm(W)
  return isListenable(target)
    ? target.getBufferHealth(eventType, listener, isObject(options) ? !!options.capture : !!options, handler)
    : addNativeListener(target, eventType, listener, true, options, handler);
}

/**
 * Remove a listener from a target.
 * [was: fW]
 */
export function unlisten(target, eventType, listener, options, handler) { // was: fW
  if (Array.isArray(eventType)) {
    for (let i = 0; i < eventType.length; i++) { // was: T
      unlisten(target, eventType[i], listener, options, handler);
    }
  } else {
    const useCapture = isObject(options) ? !!options.capture : !!options; // was: m
    listener = ensureListener(listener); // was: dm(W)
    if (isListenable(target)) {
      target.Xd(eventType, listener, useCapture, handler);
    } else if (target) {
      const map = getListenerMap(target); // was: wm(Q)
      if (map) {
        const key = map.setConnectData(eventType, listener, useCapture, handler); // was: c
        if (key) removeListenerKey(key); // was: vO(c)
      }
    }
  }
}

/**
 * Remove a listener by its key, detaching the native listener.
 * [was: vO]
 * @param {Object} listenerKey  [was: Q]
 */
export function removeListenerKey(listenerKey) { // was: vO
  if (typeof listenerKey !== "number" && listenerKey && !listenerKey.removed) {
    let source = listenerKey.src; // was: c
    if (isListenable(source)) {
      removeListenerFromMap(source.W5, listenerKey); // was: g.Fh
    } else {
      const type = listenerKey.type; // was: W
      const proxy = listenerKey.proxy; // was: m
      if (source.removeEventListener) {
        source.removeEventListener(type, proxy, listenerKey.capture);
      } else if (source.detachEvent) {
        source.detachEvent(toOnEventName(type), proxy); // was: gm
      } else if (source.addListener && source.removeListener) {
        source.removeListener(proxy);
      }
      globalListenerCount--;
      const map = getListenerMap(source); // was: wm(c)
      if (map) {
        removeListenerFromMap(map, listenerKey);
        if (map.W === 0) {
          map.src = null;
          source[LISTENER_MAP_KEY] = null;
        }
      } else {
        markListenerRemoved(listenerKey); // was: y2(Q)
      }
    }
  }
}

/**
 * Convert event name to "on" + name form (cached).
 * [was: gm]
 * @param {string} eventName  [was: Q]
 * @returns {string}
 */
export function toOnEventName(eventName) { // was: gm
  return eventName in activeListeners ? activeListeners[eventName] : (activeListeners[eventName] = "on" + eventName);
}

/**
 * Handle a browser event dispatched through a proxy.
 * [was: JP_]
 * @param {Object} listenerRecord  [was: Q]
 * @param {Event} event  [was: c]
 * @returns {*}
 */
export function handleBrowserEvent(listenerRecord, event) { // was: JP_
  if (listenerRecord.removed) {
    return true; // was: !0
  }
  event = new BrowserEvent(event, this); // was: new HO()
  const callback = listenerRecord.listener; // was: W
  const context = listenerRecord.handler || listenerRecord.src; // was: m
  if (listenerRecord.h$) removeListenerKey(listenerRecord); // was: vO(Q)
  return callback.call(context, event);
}

/**
 * Get the ListenerMap from an object, or null.
 * [was: wm]
 * @param {Object} obj  [was: Q]
 * @returns {ListenerMap|null}
 */
export function getListenerMap(obj) { // was: wm
  const map = obj[LISTENER_MAP_KEY];
  return map instanceof ListenerMap ? map : null;
}

/**
 * Normalize a listener to a function. If it is an object with handleEvent,
 * wrap it.
 * [was: dm]
 * @param {Function|Object} listener  [was: Q]
 * @returns {Function}
 */
export function ensureListener(listener) { // was: dm
  if (typeof listener === "function") return listener;
  if (!listener[G$]) {
    listener[G$] = function (event) { // was: c
      return listener.handleEvent(event);
    };
  }
  return listener[G$];
}

/**
 * EventTarget base class with its own ListenerMap.
 * Prototype methods defined in data/event-logging.js.
 * [was: g.$R]
 */
export class EventTargetBase extends Disposable { // was: g.$R
  constructor() {
    super();
    this.W5 = new ListenerMap(this);
    this.createConditionalExtractor = this;
    this.qJ = null;
  }
}

/**
 * Dispatch an event to listeners on a given EventTargetBase.
 * [was: PO]
 * @param {EventTargetBase} target  [was: Q]
 * @param {string} eventType  [was: c]
 * @param {boolean} capture  [was: W]
 * @param {Event} event  [was: m]
 * @returns {boolean}
 */
export function dispatchToListeners(target, eventType, capture, event) { // was: PO
  const listeners = target.W5.listeners[String(eventType)]; // was: c
  if (!listeners) return true; // was: !0
  const copy = listeners.concat(); // defensive copy
  let allAllowed = true; // was: K -> !0
  for (let i = 0; i < copy.length; ++i) { // was: T
    const entry = copy[i]; // was: r
    if (entry && !entry.removed && entry.capture === capture) {
      const callback = entry.listener; // was: U
      const context = entry.handler || entry.src; // was: I
      if (entry.h$) removeListenerFromMap(target.W5, entry); // was: g.Fh
      allAllowed = callback.call(context, event) !== false && allAllowed; // was: !== !1
    }
  }
  return allAllowed && !event.defaultPrevented;
}

// ---------------------------------------------------------------------------
// Microtask / async scheduling (lines 7088–7132)
// ---------------------------------------------------------------------------

/**
 * Schedule a callback via the microtask channel.
 * [was: hG]
 * @param {Function} callback  [was: Q]
 */
export function scheduleMicrotask(callback) { // was: hG
  callback = ls(callback); // was: Q = ls(Q)
  if (!us) us = createMicrotaskScheduler(); // was: RAm()
  us(callback);
}

/**
 * Create a microtask scheduler using MessageChannel if available,
 * falling back to setTimeout(0).
 * [was: RAm]
 * @returns {Function}
 */
export function createMicrotaskScheduler() { // was: RAm
  if (typeof MessageChannel !== "undefined") {
    const channel = new MessageChannel(); // was: Q
    let head = {}; // was: c
    let tail = head; // was: W
    channel.port1.onmessage = function () {
      if (head.next !== undefined) { // was: void 0
        head = head.next;
        const task = head.kQ; // was: m
        head.kQ = null;
        task();
      }
    };
    return function (task) { // was: m
      tail.next = { kQ: task };
      tail = tail.next;
      channel.port2.postMessage(0);
    };
  }
  return function (callback) { // was: Q
    globalRef.setTimeout(callback, 0);
  };
}

/**
 * Run all pending tasks from the async queue.
 * [was: kYn]
 */
export function runPendingTasks() { // was: kYn
  let task; // was: Q
  while ((task = z$.remove())) {
    try {
      task.W.call(task.scope);
    } catch (err) { // was: c
      vS(err);
    }
    CW.put(task);
  }
  MH = false; // was: !1
}

// ---------------------------------------------------------------------------
// Promise implementation (lines 7134–7363)
// ---------------------------------------------------------------------------

/**
 * Custom promise implementation.
 * [was: g.RF]
 * @param {Function} executor  [was: Q]
 */
export function PromiseImpl(executor) { // was: g.RF
  this.W = 0;
  this.J = undefined; // was: void 0
  this.j = this.O = this.A = null;
  this.K = this.D = false; // was: !1
  if (executor !== g.vB) {
    try {
      const self = this; // was: c
      executor.call(undefined, function (value) { // was: void 0
        resolveOrReject(self, 2, value); // was: JG(c, 2, W)
      }, function (reason) { // was: W
        resolveOrReject(self, 3, reason); // was: JG(c, 3, W)
      });
    } catch (err) { // was: c
      resolveOrReject(this, 3, err);
    }
  }
}

/**
 * Chain entry in the promise callback queue.
 * [was: kR]
 */
export function CallbackEntry() { // was: kR
  this.next = this.context = this.O = this.A = this.W = null;
  this.j = false; // was: !1
}

/**
 * Create a CallbackEntry from the pool.
 * [was: pW]
 * @param {Function} onFulfilled  [was: Q]
 * @param {Function} onRejected  [was: c]
 * @param {Object} context  [was: W]
 * @returns {CallbackEntry}
 */
export function createCallbackEntry(onFulfilled, onRejected, context) { // was: pW
  const entry = YR.get(); // was: m
  entry.A = onFulfilled;
  entry.O = onRejected;
  entry.context = context;
  return entry;
}

/**
 * Wrap a value in a resolved promise.
 * [was: g.QU]
 * @param {*} value  [was: Q]
 * @returns {PromiseImpl}
 */
export function resolvedPromise(value) { // was: g.QU
  if (value instanceof PromiseImpl) return value; // was: g.RF
  const p = new PromiseImpl(g.vB); // was: c
  resolveOrReject(p, 2, value); // was: JG(c, 2, Q)
  return p;
}

/**
 * Create a rejected promise.
 * [was: cJ]
 * @param {*} reason  [was: Q]
 * @returns {PromiseImpl}
 */
export function rejectedPromise(reason) { // was: cJ
  return new PromiseImpl(function (resolve, reject) { // was: c, W
    reject(reason);
  });
}

/**
 * Attach fulfillment / rejection handlers to a promise, scheduling
 * notification on the microtask queue.
 * [was: g.KO]
 */
export function attachHandlers(promise, onFulfilled, onRejected) { // was: g.KO
  if (!tryThenableResolve(promise, onFulfilled, onRejected, null)) { // was: WJ
    g.mN(partial(onFulfilled, promise));
  }
}

/**
 * Race an array of promises – resolve/reject with whichever settles first.
 * [was: YyX]
 * @param {Array} promises  [was: Q]
 * @returns {PromiseImpl}
 */
export function promiseRace(promises) { // was: YyX
  return new PromiseImpl(function (resolve, reject) { // was: c, W
    if (promises.length === 0) resolve(undefined); // was: void 0
    let p; // was: m
    for (let i = 0; i < promises.length; i++) { // was: K
      p = promises[i];
      attachHandlers(p, resolve, reject); // was: g.KO
    }
  });
}

/**
 * Enqueue a callback entry onto a promise.
 * [was: oY]
 */
export function enqueueCallback(promise, onFulfilled, onRejected, context) { // was: oY
  enqueueEntry(promise, createCallbackEntry(onFulfilled || g.vB, onRejected || null, context)); // was: TQ(..., pW(...))
}

/**
 * Add a finally-style handler (runs on both fulfillment and rejection).
 * [was: g.rV]
 */
export function addFinallyHandler(promise, handler) { // was: g.rV
  handler = ls(handler); // was: c = ls(c)
  const entry = createCallbackEntry(handler, handler); // was: c = pW(c, c)
  entry.j = true; // was: !0
  enqueueEntry(promise, entry); // was: TQ(Q, c)
  return promise;
}

/**
 * Cancel a pending promise (propagates cancellation up the chain).
 * [was: U_]
 */
export function cancelPromise(promise, reason) { // was: U_
  if (promise.W === 0) {
    if (promise.A) {
      const parent = promise.A; // was: W
      if (parent.O) {
        let count = 0; // was: m
        let target = null; // was: K
        let prev = null; // was: T
        for (let entry = parent.O; entry && (entry.j || (count++, entry.W === promise && (target = entry), !(target && count > 1))); entry = entry.next) {
          if (!target) prev = entry;
        }
        if (target) {
          if (parent.W === 0 && count === 1) {
            cancelPromise(parent, reason); // was: U_(W, c)
          } else {
            if (prev) {
              const temp = prev; // was: m
              if (temp.next === parent.j) parent.j = temp;
              temp.next = temp.next.next;
            } else {
              dequeueFirst(parent); // was: IY(W)
            }
            processEntry(parent, target, 3, reason); // was: Xn(W, K, 3, c)
          }
        }
      }
      promise.A = null;
    } else {
      resolveOrReject(promise, 3, reason); // was: JG(Q, 3, c)
    }
  }
}

/**
 * Enqueue a callback entry at the tail of the promise queue.
 * [was: TQ]
 */
export function enqueueEntry(promise, entry) { // was: TQ
  if (!promise.O && (promise.W !== 2 && promise.W !== 3)) {
    // no-op path – ensure notification is scheduled
  }
  if (!promise.O || (promise.W !== 2 && promise.W !== 3)) {
    scheduleNotification(promise); // partial — only when needed
  }
  if (promise.j) {
    promise.j.next = entry;
  } else {
    promise.O = entry;
  }
  promise.j = entry;
}

/**
 * Create a chained (then) promise.
 * [was: VU]
 */
export function chainPromise(promise, onFulfilled, onRejected, context) { // was: VU
  const entry = createCallbackEntry(null, null, null); // was: K -> pW(...)
  entry.W = new PromiseImpl(function (resolve, reject) { // was: T, r
    entry.A = onFulfilled
      ? function (value) { // was: U
          try {
            const result = onFulfilled.call(context, value); // was: I
            resolve(result);
          } catch (err) { // was: I
            reject(err);
          }
        }
      : resolve;
    entry.O = onRejected
      ? function (value) { // was: U
          try {
            const result = onRejected.call(context, value); // was: I
            if (result === undefined && value instanceof CancellationError) { // was: void 0, eH
              reject(value);
            } else {
              resolve(result);
            }
          } catch (err) { // was: I
            reject(err);
          }
        }
      : reject;
  });
  entry.W.A = promise;
  enqueueEntry(promise, entry); // was: TQ(Q, K)
  return entry.W;
}

/**
 * Resolve or reject a promise.
 * [was: JG]
 * @param {PromiseImpl} promise  [was: Q]
 * @param {number} state  [was: c]  (2 = fulfilled, 3 = rejected)
 * @param {*} value  [was: W]
 */
export function resolveOrReject(promise, state, value) { // was: JG
  if (promise.W === 0) {
    if (promise === value) {
      state = 3;
      value = new TypeError("Promise cannot resolve to itself");
    }
    promise.W = 1;
    if (!tryThenableResolve(value, promise.Vn, promise.nC, promise)) { // was: WJ
      promise.J = value;
      promise.W = state;
      promise.A = null;
      scheduleNotification(promise); // was: Az(Q)
      if (state !== 3 || value instanceof CancellationError) { // was: eH
        // rejection not unhandled-CancellationError
      } else {
        markUnhandledRejection(promise, value); // was: pb_(Q, W)
      }
    }
  }
}

/**
 * Try to treat a value as a thenable and hook into it.
 * Returns true if it was thenable.
 * [was: WJ]
 */
export function tryThenableResolve(value, onFulfilled, onRejected, context) { // was: WJ
  if (value instanceof PromiseImpl) {
    enqueueCallback(value, onFulfilled, onRejected, context); // was: oY
    return true; // was: !0
  }
  let isThenable; // was: K
  if (value) {
    try {
      isThenable = !!value.$goog_Thenable;
    } catch (_err) { // was: T
      isThenable = false; // was: !1
    }
  } else {
    isThenable = false;
  }
  if (isThenable) {
    value.then(onFulfilled, onRejected, context);
    return true;
  }
  if (isObject(value)) {
    try {
      const thenMethod = value.then; // was: T
      if (typeof thenMethod === "function") {
        resolveForeignThenable(value, thenMethod, onFulfilled, onRejected, context); // was: Q_R
        return true;
      }
    } catch (err) { // was: T
      onRejected.call(context, err);
      return true;
    }
  }
  return false; // was: !1
}

/**
 * Resolve a foreign thenable (non-goog Promise).
 * [was: Q_R]
 */
export function resolveForeignThenable(thenable, thenMethod, onFulfilled, onRejected, context) { // was: Q_R
  function onReject(val) { // was: T, I
    if (!settled) {
      settled = true; // was: U = !0
      onRejected.call(context, val);
    }
  }
  function onResolve(val) { // was: r, I
    if (!settled) {
      settled = true;
      onFulfilled.call(context, val);
    }
  }
  let settled = false; // was: U
  try {
    thenMethod.call(thenable, onResolve, onReject);
  } catch (err) { // was: I
    onReject(err);
  }
}

/**
 * Schedule notification of promise callbacks.
 * [was: Az]
 */
export function scheduleNotification(promise) { // was: Az
  if (!promise.D) {
    promise.D = true; // was: !0
    g.mN(promise.ye, promise);
  }
}

/**
 * Dequeue the first callback entry from a promise.
 * [was: IY]
 * @param {PromiseImpl} promise  [was: Q]
 * @returns {CallbackEntry|null}
 */
export function dequeueFirst(promise) { // was: IY
  let entry = null; // was: c
  if (promise.O) {
    entry = promise.O;
    promise.O = entry.next;
    entry.next = null;
  }
  if (!promise.O) promise.j = null;
  return entry;
}

/**
 * Process a single callback entry for a promise.
 * [was: Xn]
 */
export function processEntry(promise, entry, state, value) { // was: Xn
  if (state === 3 && entry.O && !entry.j) {
    for (; promise && promise.K; promise = promise.A) {
      promise.K = false; // was: !1
    }
  }
  if (entry.W) {
    entry.W.A = null;
    invokeCallback(entry, state, value); // was: BJ
  } else {
    try {
      if (entry.j) {
        entry.A.call(entry.context);
      } else {
        invokeCallback(entry, state, value);
      }
    } catch (err) { // was: K
      xu.call(null, err);
    }
  }
  YR.put(entry);
}

/**
 * Invoke the appropriate callback on a CallbackEntry.
 * [was: BJ]
 */
export function invokeCallback(entry, state, value) { // was: BJ
  if (state === 2) {
    entry.A.call(entry.context, value);
  } else if (entry.O) {
    entry.O.call(entry.context, value);
  }
}

/**
 * Mark an unhandled rejection for later warning.
 * [was: pb_]
 */
export function markUnhandledRejection(promise, reason) { // was: pb_
  promise.K = true; // was: !0
  g.mN(function () {
    if (promise.K) xu.call(null, reason);
  });
}

/**
 * CancellationError -- thrown when a ClosurePromise is cancelled.
 * [was: eH]
 */
export class CancellationError extends Error { // was: eH
  constructor(message) {
    super(message);
    this.name = "cancel";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// Functional composition helpers (lines 10768–10912) — Redux-like store
// ---------------------------------------------------------------------------

/**
 * Compose functions right-to-left.
 * [was: Ix]
 * @param {...Function} fns  [was: Q]
 * @returns {Function}
 */
export function compose(...fns) { // was: Ix
  if (fns.length === 0) return (value) => value; // was: c => c
  if (fns.length === 1) return fns[0];
  return fns.reduce((composed, fn) => (...args) => composed(fn(...args))); // was: c, W, m
}

/**
 * Create a middleware applier (Redux-style).
 * [was: cCm]
 * @returns {Function}
 */
export function createMiddlewareApplier() { // was: cCm
  const middlewares = []; // was: Q
  return (createStore) => (reducer, preloadedState) => { // was: c, W, m
    const store = createStore(reducer, preloadedState); // was: W
    let dispatch = () => { // was: K
      throw Error("Dispatching while constructing your middleware is not allowed. Other middleware would not be applied to this dispatch.");
    };
    const middlewareAPI = { // was: T
      getState: store.getState,
      dispatch: (action, ...rest) => dispatch(action, ...rest), // was: r, U
    };
    const chain = middlewares.map((mw) => mw(middlewareAPI)); // was: m, r
    dispatch = compose(...chain)(store.dispatch); // was: Ix
    return {
      ...store,
      dispatch,
    };
  };
}

/**
 * Validate that every slice reducer returns a defined initial state.
 * [was: WSW]
 * @param {Object} reducers  [was: Q]
 */
export function validateReducers(reducers) { // was: WSW
  Object.keys(reducers).forEach((key) => { // was: c
    const reducer = reducers[key]; // was: W
    if (typeof reducer(undefined, { type: X5 }) === "undefined") { // was: void 0
      throw Error(
        `The slice reducer for key "${key}" returned undefined during initialization. If the state passed to the reducer is undefined, you must explicitly return the initial state. The initial state may not be undefined. If you don't want to set a value for this reducer, you can use null instead of undefined.`
      );
    }
    if (typeof reducer(undefined, { type: `@@redux/PROBE_UNKNOWN_ACTION${AB()}` }) === "undefined") {
      throw Error(
        `The slice reducer for key "${key}" returned undefined when probed with a random type. Don't try to handle '${X5}' or other actions in "redux/*" namespace. They are considered private. Instead, you must return the current state for any unknown actions, unless it is undefined, in which case you must return the initial state, regardless of the action type. The initial state may not be undefined, but can be null.`
      );
    }
  });
}

/**
 * Create a Redux-like store with getState, dispatch, subscribe, replaceReducer.
 * [was: eD]
 * @param {Function} rootReducer  [was: Q]
 * @param {*} [preloadedState]  [was: c]
 * @param {Function} [enhancer]  [was: W]
 * @returns {Object} store
 */
export function createStore(rootReducer, preloadedState, enhancer) { // was: eD
  function getState() { // was: m
    if (isDispatching) { // was: A
      throw Error("You may not call store.getState() while the reducer is executing. The reducer has already received the state as an argument. Pass it down from the top reducer instead of reading it from the store.");
    }
    return currentState; // was: U
  }

  function subscribe(listener) { // was: K, V
    if (typeof listener !== "function") {
      throw Error(`Expected the listener to be a function. Instead, received: '${typeof listener}'`);
    }
    if (isDispatching) {
      throw Error("You may not call store.subscribe() while the reducer is executing. If you would like to be notified after the store has been updated, subscribe from a component and invoke store.getState() in the callback to access the latest state. See https://redux.js.org/api/store#subscribelistener for more details.");
    }
    let isSubscribed = true; // was: B -> !0
    if (nextListeners === currentListeners) { // was: X === I
      nextListeners = currentListeners.slice();
    }
    nextListeners.push(listener);
    return function () {
      if (isSubscribed) {
        if (isDispatching) {
          throw Error("You may not unsubscribe from a store listener while the reducer is executing. See https://redux.js.org/api/store#subscribelistener for more details.");
        }
        isSubscribed = false; // was: !1
        if (nextListeners === currentListeners) {
          nextListeners = currentListeners.slice();
        }
        nextListeners.splice(nextListeners.indexOf(listener), 1);
        currentListeners = null;
      }
    };
  }

  function dispatch(action) { // was: T, V
    let isPlainObject; // was: B
    if (typeof action !== "object" || action === null) {
      isPlainObject = false; // was: !1
    } else {
      let proto = action; // was: B
      while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
      }
      isPlainObject = Object.getPrototypeOf(action) === proto;
    }
    if (!isPlainObject) {
      throw Error(`Actions must be plain objects. Instead, the actual type was: '${typeof action}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`);
    }
    if (typeof action.type === "undefined") { // was: void 0
      throw Error('Actions may not have an undefined "type" property. You may have misspelled an action type string constant.');
    }
    if (isDispatching) {
      throw Error("Reducers may not dispatch actions.");
    }
    try {
      isDispatching = true; // was: !0
      currentState = currentReducer(currentState, action); // was: r(U, V)
    } finally {
      isDispatching = false; // was: !1
    }
    const listeners = (currentListeners = nextListeners); // was: B = I = X
    for (let i = 0; i < listeners.length; i++) { // was: n
      (0, listeners[i])();
    }
    return action;
  }

  if (typeof preloadedState === "function" && typeof enhancer === "function" ||
      typeof enhancer === "function" && typeof arguments[3] === "function") {
    throw Error("It looks like you are passing several store enhancers to createStore(). This is not supported. Instead, compose them together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.");
  }
  if (typeof preloadedState === "function" && typeof enhancer === "undefined") { // was: void 0
    enhancer = preloadedState;
    preloadedState = undefined; // was: void 0
  }
  if (typeof enhancer !== "undefined") { // was: void 0
    if (typeof enhancer !== "function") {
      throw Error(`Expected the enhancer to be a function. Instead, received: '${typeof enhancer}'`);
    }
    return enhancer(createStore)(rootReducer, preloadedState);
  }
  if (typeof rootReducer !== "function") {
    throw Error(`Expected the root reducer to be a function. Instead, received: '${typeof rootReducer}'`);
  }

  let currentReducer = rootReducer; // was: r
  let currentState = preloadedState; // was: U
  let currentListeners = []; // was: I
  let nextListeners = currentListeners; // was: X
  let isDispatching = false; // was: A -> !1

  dispatch({ type: X5 });

  const store = { // was: e
    dispatch,
    subscribe,
    getState,
    replaceReducer: function (nextReducer) { // was: V
      if (typeof nextReducer !== "function") {
        throw Error(`Expected the nextReducer to be a function. Instead, received: '${typeof nextReducer}`);
      }
      currentReducer = nextReducer;
      dispatch({ type: mSX });
      return store;
    },
    [V$]: function () {
      return {
        subscribe(observer) { // was: V
          function observeState() { // was: B
            if (observer.next) observer.next(getState());
          }
          if (typeof observer !== "object" || observer === null) {
            throw new TypeError(`Expected the observer to be an object. Instead, received: '${typeof observer}'`);
          }
          observeState();
          return { unsubscribe: subscribe(observeState) };
        },
        [V$]() {
          return this;
        },
      };
    },
  };
  return store;
}

// ---------------------------------------------------------------------------
// Safe-value unwrapping (lines 10914–10935)
// ---------------------------------------------------------------------------

/**
 * Unwrap a SafeScript-wrapped value.
 * [was: Bz]
 */
export function unwrapSafeScript(wrapped) { // was: Bz
  if (!wrapped) return null;
  const raw = wrapped.privateDoNotAccessOrElseSafeScriptWrappedValue; // was: Q
  return raw ? Uy(raw) : null;
}

/**
 * Unwrap a TrustedResourceUrl-wrapped value.
 * [was: x3]
 */
export function unwrapTrustedResourceUrl(wrapped) { // was: x3
  if (!wrapped) return null;
  const raw = wrapped.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue; // was: Q
  return raw ? uC(raw) : null;
}

/**
 * Create a SafeHtml from a value after null-coalescing.
 * [was: ne]
 */
export function safeHtmlFrom(value) { // was: ne
  const str = nullToString(value); // was: q4(Q)
  return mk(str);
}

/**
 * Create a TrustedResourceUrl from a value after null-coalescing.
 * [was: g.Dp]
 */
export function trustedResourceUrlFrom(value) { // was: g.Dp
  const str = nullToString(value); // was: q4(Q)
  return uC(str);
}

/**
 * Convert null/undefined to the literal strings "null"/"undefined".
 * [was: q4]
 */
export function nullToString(value) { // was: q4
  if (value === null) return "null";
  if (value === undefined) return "undefined"; // was: void 0
  return value;
}

// ---------------------------------------------------------------------------
// Biscotti / config / error logging (lines 10936–11018)
// ---------------------------------------------------------------------------

/**
 * Get the last Biscotti ID.
 * [was: tB]
 * @returns {string}
 */
export function getLastBiscottiId() { // was: tB
  return getObjectByPath("yt.ads.biscotti.lastId_") || "";
}

/**
 * Set the last Biscotti ID.
 * [was: Hz]
 * @param {string} id  [was: Q]
 */
export function setLastBiscottiId(id) { // was: Hz
  setGlobal("yt.ads.biscotti.lastId_", id);
}

/**
 * Set one or many global config key-value pairs.
 * [was: y$]
 * @param {...*} args  [was: Q]
 */
export function setConfig(...args) { // was: y$
  const target = N4; // was: c
  if (args.length > 1) {
    target[args[0]] = args[1];
  } else if (args.length === 1) {
    Object.assign(target, args[0]);
  }
}

/**
 * Read a global config value, with an optional default.
 * [was: g.v]
 * @param {string} key  [was: Q]
 * @param {*} [defaultValue]  [was: c]
 * @returns {*}
 */
export function getConfig(key, defaultValue) { // was: g.v
  return key in N4 ? N4[key] : defaultValue;
}

/**
 * Read a value from EXPERIMENT_FLAGS.
 * [was: SD]
 * @param {string} flag  [was: Q]
 * @returns {*}
 */
export function getExperimentFlag(flag) { // was: SD
  const flags = N4.EXPERIMENT_FLAGS; // was: c
  return flags ? flags[flag] : undefined; // was: void 0
}

/**
 * Invoke all error listeners.
 * [was: KSR]
 * @param {Error} error  [was: Q]
 */
export function notifyErrorListeners(error) { // was: KSR
  F5.forEach((listener) => listener(error)); // was: c
}

/**
 * Wrap a function so that errors are caught and reported via yterr.
 * [was: g.Ei]
 * @param {Function} fn  [was: Q]
 * @returns {Function}
 */
export function wrapWithErrorHandler(fn) { // was: g.Ei
  if (!fn || !window.yterr) return fn;
  return function () {
    try {
      return fn.apply(this, arguments);
    } catch (err) { // was: c
      logError(err);
    }
  };
}

/**
 * Log an error.
 * [was: g.Zp]
 * @param {Error} error  [was: Q]
 */
export function logError(error) { // was: g.Zp
  let logger = getObjectByPath("yt.logging.errors.log"); // was: c
  if (logger) {
    logger(error, "ERROR", undefined, undefined, undefined, undefined, undefined); // was: void 0
  } else {
    const errors = getConfig("ERRORS", []); // was: c -> g.v(...)
    errors.push([error, "ERROR", undefined, undefined, undefined, undefined, undefined]);
    setConfig("ERRORS", errors); // was: y$
  }
  notifyErrorListeners(error); // was: KSR
}

/**
 * Log a warning.
 * [was: si]
 */
export function logWarning(error, context, source, extra, tag) { // was: si
  let logger = getObjectByPath("yt.logging.errors.log"); // was: T
  if (logger) {
    logger(error, "WARNING", context, source, extra, undefined, tag); // was: void 0
  } else {
    const errors = getConfig("ERRORS", []); // was: T -> g.v(...)
    errors.push([error, "WARNING", context, source, extra, undefined, tag]);
    setConfig("ERRORS", errors);
  }
}

/**
 * Parse a query-string-like value into a key-value map.
 * [was: Le]
 * @param {string} queryString  [was: Q]
 * @param {string} delimiter  [was: c]
 * @returns {Object}
 */
export function parseQueryString(queryString, delimiter) { // was: Le
  const parts = queryString.split(delimiter); // was: c
  const result = {}; // was: W
  for (let i = 0, len = parts.length; i < len; i++) { // was: T, r
    const pair = parts[i].split("="); // was: U
    if ((pair.length === 1 && pair[0]) || pair.length === 2) {
      try {
        const key = decodeComponent(pair[0] || ""); // was: I -> d_(...)
        const value = decodeComponent(pair[1] || ""); // was: X
        if (key in result) {
          const existing = result[key]; // was: A
          if (Array.isArray(existing)) {
            extend(existing, value);
          } else {
            result[key] = [existing, value];
          }
        } else {
          result[key] = value;
        }
      } catch (err) { // was: I
        let parseError = err; // was: m
        const rawKey = pair[0]; // was: K
        const fnStr = String(parseQueryString); // was: X
        parseError.args = [
          {
            key: rawKey,
            value: pair[1],
            query: queryString,
            method: TYy === fnStr ? "unchanged" : fnStr,
          },
        ];
        if (!oJd.hasOwnProperty(rawKey)) logWarning(parseError); // was: si
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// URI decoding, screen info, XHR helpers (lines 11099–11665)
// ---------------------------------------------------------------------------

/**
 * Decode a URI component, using a regex fast-path when the value is clean.
 * [was: d_]
 * @param {string} value  [was: Q]
 * @returns {string}
 */
export function decodeComponent(value) { // was: d_
  return value && value.match(USK) ? value : plusDecode(value);
}

/**
 * Gather browser / frame context information for ad requests.
 * [was: XWn]
 * @param {Object} context  [was: Q]
 * @returns {Object}
 */
export function getScreenContextInfo(context) { // was: XWn
  let frameRelation; // inner block label
  try {
    const topHref = context.W.top.location.href; // was: W
    frameRelation = topHref
      ? (topHref === context.O.location.href ? 0 : 1)
      : 2;
  } catch (_err) { // was: m
    frameRelation = 2;
  }
  const info = { // was: Q (reused)
    dt: moduleLoadTimestamp,
    flash: "0",
    frm: frameRelation,
  };
  try {
    info.u_tz = -(new Date()).getTimezoneOffset();
    let historyLength; // was: c
    try {
      historyLength = win.history.length;
    } catch (_err) { // was: W
      historyLength = 0;
    }
    info.u_his = historyLength;
    info.u_h = win.screen?.height;
    info.u_w = win.screen?.width;
    info.u_ah = win.screen?.availHeight;
    info.u_aw = win.screen?.availWidth;
    info.u_cd = win.screen?.colorDepth;
  } catch (_err) {} // was: W
  return info;
}

/**
 * Build the full ad-signals object for a request.
 * [was: lk]
 * @param {string} [biscottiId]
 * @returns {Object}
 */
export function buildAdSignals(biscottiId = getLastBiscottiId()) { // was: lk
  let context = ACd; // was: c
  const merged = Object.assign(
    getScreenContextInfo(context), // was: XWn(c)
    (() => {
      const win = context.W; // was: T
      let screenX, screenY, outerWidth, outerHeight; // was: B, n, S, r
      let innerWidth, innerHeight, screenLeft, screenTop, availWidth, availTop; // was: U, I, X, A, e, V
      try { screenX = win.screenX; screenY = win.screenY; } catch (_err) {} // was: d
      try { outerWidth = win.outerWidth; outerHeight = win.outerHeight; } catch (_err) {}
      try { innerWidth = win.innerWidth; innerHeight = win.innerHeight; } catch (_err) {}
      try { screenLeft = win.screenLeft; screenTop = win.screenTop; } catch (_err) {}
      try { innerWidth = win.innerWidth; innerHeight = win.innerHeight; } catch (_err) {}
      try { availWidth = win.screen.availWidth; availTop = win.screen.availTop; } catch (_err) {}
      const dims = [screenLeft, screenTop, screenX, screenY, availWidth, availTop, outerWidth, outerHeight, innerWidth, innerHeight]; // was: T
      const viewport = Cj(false, context.W.top); // was: B -> Cj(!1, ...)
      const bitset = new BitField(); // was: n
      if ("SVGElement" in globalRef && "createElementNS" in globalRef.document) bitset.set(0);
      const sandbox = eoR(); // was: S
      if (sandbox["allow-top-navigation-by-user-activation"]) bitset.set(1);
      if (sandbox["allow-popups-to-escape-sandbox"]) bitset.set(2);
      if (globalRef.crypto && globalRef.crypto.subtle) bitset.set(3);
      if ("TextDecoder" in globalRef && "TextEncoder" in globalRef) bitset.set(4);
      const reloadPage = bitmaskValue(bitset); // was: n
      return {
        reloadPage,
        bih: viewport.height,
        biw: viewport.width,
        brdim: dims.join(),
        vis: nN(context.O),
        wgl: !!win.WebGLRenderingContext,
      };
    })()
  );
  merged.ca_type = "image";
  if (biscottiId) merged.bid = biscottiId;
  return merged;
}

/**
 * Create an XMLHttpRequest from the factory, returning null if unavailable.
 * [was: BYX]
 * @returns {XMLHttpRequest|null}
 */
export function createXHR() { // was: BYX
  if (!createXhr) return null;
  const xhr = createXhr(); // was: Q
  return "open" in xhr ? xhr : null;
}

/**
 * Check whether an HTTP status is successful.
 * [was: g.hB]
 * @param {Object} response  [was: Q]
 * @returns {boolean}
 */
export function isSuccessStatus(response) { // was: g.hB
  switch (getStatus(response)) { // was: uk(Q)
    case 200:
    case 201:
    case 202:
    case 203:
    case 204:
    case 205:
    case 206:
    case 304:
      return true; // was: !0
    default:
      return false; // was: !1
  }
}

/**
 * Safely extract the status code from a response-like object.
 * [was: uk]
 * @param {Object} response  [was: Q]
 * @returns {number}
 */
export function getStatus(response) { // was: uk
  return response && "status" in response ? response.status : -1;
}

/**
 * setTimeout wrapper that applies error-handler wrapping.
 * [was: g.zn]
 */
export function safeSetTimeout(callback, delay) { // was: g.zn
  if (typeof callback === "function") callback = wrapWithErrorHandler(callback); // was: g.Ei
  return window.setTimeout(callback, delay);
}

/**
 * setInterval wrapper that applies error-handler wrapping.
 * [was: g.Ce]
 */
export function safeSetInterval(callback, delay) { // was: g.Ce
  if (typeof callback === "function") callback = wrapWithErrorHandler(callback);
  return window.setInterval(callback, delay);
}

/**
 * Obfuscated helper (bitwise math + array transforms).
 * [was: M4]
 */
export function M4(q, xorKey, arr, out) { // was: M4(Q, c, W, m)
  let xored = xorKey ^ q; // was: K = c ^ Q
  let result; // was: T
  if (!(q << 2 & 13)) {
    result = arr[x[26]] ? arr[x[26]][x[45]](x[59]) : arr[x[10]] === x[59];
  }
  if ((q + 4 & 8) < 8 && (q | 6) >= -54 && arr[x[26]]) {
    let r = Bs(56, 29, arr); // was: r
  }
  if ((q | 8) === q) {
    let pos = arr[x[xored ^ 8861]](x[xored ^ 8838], xored ^ 8834); // was: r
    const nextPos = arr[x[xored ^ 8861]](x[xored ^ 8838], pos + 1); // was: U
    if (pos > 0 && nextPos > 0) {
      out[x[0]] = arr[x[xored ^ 8858]](0, nextPos);
      arr = arr[x[xored ^ 8858]](nextPos + 1);
    } else {
      out[x[0]] = arr;
      arr = x[2];
    }
    result = [arr];
  }
  if ((q ^ 7) < 35 && (q | 4) >= 22) {
    for (out = (out % arr[x[xored ^ 3411]] + arr[x[xored ^ 3411]]) % arr[x[xored ^ 3411]]; out--; ) {
      arr[x[xored ^ 3451]](arr[x[xored ^ 3340]]());
    }
  }
  return result;
}

/**
 * clearTimeout wrapper.
 * [was: g.JB]
 */
export function safeClearTimeout(timerId) { // was: g.JB
  window.clearTimeout(timerId);
}

/**
 * clearInterval wrapper.
 * [was: g.Rx]
 */
export function safeClearInterval(timerId) { // was: g.Rx
  window.clearInterval(timerId);
}

/**
 * Read an experiment flag as a boolean (string "false" → false).
 * [was: g.P]
 * @param {string} flag  [was: Q]
 * @returns {boolean}
 */
export function getExperimentBoolean(flag) { // was: g.P
  const value = getExperimentFlagValue(flag); // was: k3(Q)
  return typeof value === "string" && value === "false" ? false : !!value; // was: !1, !!Q
}

/**
 * Read an experiment flag as a number, with optional default.
 * [was: Y3]
 */
export function getExperimentNumber(flag, defaultValue) { // was: Y3
  const value = getExperimentFlagValue(flag); // was: k3(Q)
  return value === undefined && defaultValue !== undefined ? defaultValue : Number(value || 0); // was: void 0
}

/**
 * Get the experiments token string.
 * [was: pe]
 * @returns {string}
 */
export function getExperimentsToken() { // was: pe
  return getConfig("EXPERIMENTS_TOKEN", ""); // was: g.v
}

/**
 * Read a raw experiment flag value from EXPERIMENT_FLAGS.
 * [was: k3]
 * @param {string} flag  [was: Q]
 * @returns {*}
 */
export function getExperimentFlagValue(flag) { // was: k3
  return getConfig("EXPERIMENT_FLAGS", {})[flag]; // was: g.v
}

/**
 * Collect forced experiment flags (and force_* flags).
 * [was: Q5]
 * @returns {Array<{key:string,value:string}>}
 */
export function collectForcedFlags() { // was: Q5
  const result = []; // was: Q
  const forced = getConfig("EXPERIMENTS_FORCED_FLAGS", {}); // was: c -> g.v
  for (const key of Object.keys(forced)) { // was: W
    result.push({ key, value: String(forced[key]) });
  }
  const allFlags = getConfig("EXPERIMENT_FLAGS", {}); // was: W
  for (const key of Object.keys(allFlags)) { // was: m
    if (key.startsWith("force_") && forced[key] === undefined) { // was: void 0
      result.push({ key, value: String(allFlags[key]) });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// XHR / Fetch transport (lines 11291–11590)
// ---------------------------------------------------------------------------

/**
 * Make an XHR request.
 * [was: cn]
 */
export function makeXHR(url, callback, method = "GET", body = "", headers, responseType, withCredentials, attributionReporting = false, onProgress) { // was: cn
  const xhr = createXHR(); // was: X -> BYX()
  if (!xhr) return null;

  const onLoadEnd = () => { // was: A
    const readyState = xhr && "readyState" in xhr ? xhr.readyState : 0;
    if (readyState === 4 && callback) {
      wrapWithErrorHandler(callback)(xhr); // was: g.Ei(c)
    }
  };
  if ("onloadend" in xhr) {
    xhr.addEventListener("loadend", onLoadEnd, false); // was: !1
  } else {
    xhr.onreadystatechange = onLoadEnd;
  }

  if (getExperimentBoolean("debug_forward_web_query_parameters")) { // was: g.P(...)
    url = forwardQueryParameters(url); // was: xSd
  }
  xhr.open(method, url, true); // was: !0
  if (responseType) xhr.responseType = responseType;
  if (withCredentials) xhr.withCredentials = true; // was: !0

  let needsContentType = method === "POST" &&
    (window.FormData === undefined || !(body instanceof FormData)); // was: void 0
  const resolvedHeaders = buildRequestHeaders(url, headers); // was: K -> qgO
  if (resolvedHeaders) {
    for (const headerName in resolvedHeaders) { // was: e
      xhr.setRequestHeader(headerName, resolvedHeaders[headerName]);
      if ("content-type" === headerName.toLowerCase()) needsContentType = false; // was: !1
    }
  }
  if (needsContentType) xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  if (onProgress && "onprogress" in xhr) { // was: I
    xhr.onprogress = () => {
      onProgress(xhr.responseText);
    };
  }

  if (attributionReporting && "setAttributionReporting" in XMLHttpRequest.prototype) { // was: U
    const attrConfig = { eventSourceEligible: true, triggerEligible: false }; // was: !0, !1
    try {
      xhr.setAttributionReporting(attrConfig);
    } catch (err) { // was: e
      logWarning(err); // was: si
    }
  }

  xhr.send(body);
  return xhr;
}

/**
 * Build request headers including auth/visitor tokens.
 * [was: qgO]
 */
export function buildRequestHeaders(url, headers = {}) { // was: qgO
  const isFirstParty = isSameOrigin(url); // was: W
  const clientName = getConfig("INNERTUBE_CLIENT_NAME"); // was: m -> g.v
  const ignoreGlobal = getExperimentBoolean("web_ajax_ignore_global_headers_if_set"); // was: K -> g.P
  for (const headerName in HEADER_TO_CONFIG_KEY) { // was: U
    let headerValue = getConfig(HEADER_TO_CONFIG_KEY[headerName]); // was: I -> g.v
    const isAuthOrPage = headerName === "X-Goog-AuthUser" || headerName === "X-Goog-PageId"; // was: X
    if (headerName === "X-Goog-Visitor-Id" && !headerValue) {
      headerValue = getConfig("VISITOR_DATA"); // was: g.v
    }
    let skip; // was: T
    if (!headerValue) {
      skip = true;
    } else if (isFirstParty || (getDomain(url) ? false : true)) { // was: !1, !0
      let allowed; // was: r
      if (getExperimentBoolean("add_auth_headers_to_remarketing_google_dot_com_ping") &&
          headerName === "Authorization" &&
          (clientName === "TVHTML5" || clientName === "TVHTML5_UNPLUGGED" || clientName === "TVHTML5_SIMPLY") &&
          isGoogleDomain(url)) {
        let path = tF(url) || "";
        path = path.split("/");
        path = "/" + (path.length > 1 ? path[1] : "");
        allowed = path === "/pagead";
      } else {
        allowed = false;
      }
      skip = !allowed;
    } else {
      skip = false;
    }
    if (!skip && !(ignoreGlobal && headers[headerName] !== undefined) && // was: void 0
        !(clientName === "TVHTML5_UNPLUGGED" && isAuthOrPage)) {
      headers[headerName] = headerValue;
    }
  }
  if ("X-Goog-EOM-Visitor-Id" in headers && "X-Goog-Visitor-Id" in headers) {
    delete headers["X-Goog-Visitor-Id"];
  }
  if (isFirstParty || !getDomain(url)) {
    headers["X-YouTube-Utc-Offset"] = String(-(new Date()).getTimezoneOffset());
  }
  if (isFirstParty || !getDomain(url)) {
    let tz; // was: U
    try {
      tz = (new Intl.DateTimeFormat()).resolvedOptions().timeZone;
    } catch {}
    if (tz) headers["X-YouTube-Time-Zone"] = tz;
  }
  if (!document.location.hostname.endsWith("youtubeeducation.com") &&
      (isFirstParty || !getDomain(url))) {
    headers["X-YouTube-Ad-Signals"] = onRawStateChange(buildAdSignals()); // was: lk()
  }
  return headers;
}

/**
 * Make a POST request via g.Wn.
 * [was: ms]
 */
export function postRequest(url, options) { // was: ms
  options.method = "POST";
  if (!options.postParams) options.postParams = {};
  return sendXhrRequest(url, options);
}

/**
 * Make a request via fetch API (with fallback to XHR).
 * [was: H3W]
 */
export function fetchRequest(url, options) { // was: H3W
  if (window.fetch && options.format !== "XML") {
    const fetchOptions = { // was: W
      method: options.method || "GET",
      credentials: "same-origin",
    };
    if (options.headers) fetchOptions.headers = options.headers;
    if (options.priority) fetchOptions.priority = options.priority;
    url = buildRequestUrl(url, options); // was: DSX
    const body = buildRequestBody(url, options); // was: m -> tWO
    if (body) fetchOptions.body = body;
    if (options.withCredentials) fetchOptions.credentials = "include";
    const ctx = options.context || globalRef; // was: K
    let completed = false; // was: T -> !1
    let timeoutId; // was: r
    fetch(url, fetchOptions)
      .then((response) => { // was: U
        if (!completed) {
          completed = true;
          if (timeoutId) safeClearTimeout(timeoutId); // was: g.JB
          const ok = response.ok; // was: I
          const handleResult = (data) => { // was: X, A
            data = data || {};
            if (ok) {
              options.onSuccess && options.onSuccess.call(ctx, data, response);
            } else {
              options.onError && options.onError.call(ctx, data, response);
            }
            options.onFinish && options.onFinish.call(ctx, data, response);
          };
          const format = options.format || "JSON";
          if (format === "JSON" && (ok || (response.status >= 400 && response.status < 500))) {
            response.json().then(handleResult, () => handleResult(null));
          } else {
            handleResult(null);
          }
        }
      })
      .catch(() => {
        options.onError && options.onError.call(ctx, {}, {});
      });
    const timeout = options.timeout || 0; // was: Q
    if (options.onFetchTimeout && timeout > 0) {
      timeoutId = safeSetTimeout(() => { // was: r -> g.zn
        if (!completed) {
          completed = true;
          safeClearTimeout(timeoutId);
          options.onFetchTimeout.call(options.context || globalRef);
        }
      }, timeout);
    }
  } else {
    sendXhrRequest(url, options);
  }
}

/**
 * Core XHR-based AJAX transport.
 * [was: g.Wn]
 */
export function xhrRequest(url, options) { // was: g.Wn
  const format = options.format || "JSON"; // was: W
  url = buildRequestUrl(url, options); // was: DSX
  const body = buildRequestBody(url, options); // was: m -> tWO
  let completed = false; // was: K -> !1
  let timeoutId; // was: T
  const xhr = NYx(url, (response) => { // was: r, U
    if (!completed) {
      completed = true;
      if (timeoutId) safeClearTimeout(timeoutId); // was: g.JB(T)
      const ok = isSuccessStatus(response); // was: I -> g.hB
      let parsed = null; // was: X
      const is4xx = response.status >= 400 && response.status < 500; // was: A
      const is5xx = response.status >= 500 && response.status < 600; // was: e
      if (ok || is4xx || is5xx) {
        parsed = parseResponse(url, format, response, options.convertToSafeHtml); // was: i33
      }
      let isSuccess = ok; // was: I
      if (ok) isSuccess = validateResponse(format, response, parsed); // was: yCK
      parsed = parsed || {};
      const ctx = options.context || globalRef; // was: A
      if (isSuccess) {
        options.onSuccess && options.onSuccess.call(ctx, response, parsed);
      } else {
        options.onError && options.onError.call(ctx, response, parsed);
      }
      options.onFinish && options.onFinish.call(ctx, response, parsed);
    }
  }, options.method, body, options.headers, options.responseType, options.withCredentials, false, options.onProgress); // was: !1

  const timeout = options.timeout || 0; // was: m
  if (options.onTimeout && timeout > 0) {
    const onTimeout = options.onTimeout; // was: U
    timeoutId = safeSetTimeout(() => { // was: g.zn
      if (!completed) {
        completed = true;
        xhr.abort();
        safeClearTimeout(timeoutId);
        onTimeout.call(options.context || globalRef, xhr);
      }
    }, timeout);
  }
  return xhr;
}

/**
 * Build the final request URL with XSRF params stripped.
 * [was: DSX]
 */
export function buildRequestUrl(url, options) { // was: DSX
  if (options.includeDomain) {
    url = document.location.protocol + "//" + document.location.hostname +
      (document.location.port ? ":" + document.location.port : "") + url;
  }
  const xsrfField = getConfig("XSRF_FIELD_NAME"); // was: W -> g.v
  const params = options.urlParams; // was: c
  if (params) {
    if (params[xsrfField]) delete params[xsrfField];
    url = appendQueryParams(url, params);
  }
  return url;
}

/**
 * Build the POST body, injecting XSRF token if needed.
 * [was: tWO]
 */
export function buildRequestBody(url, options) { // was: tWO
  const xsrfField = getConfig("XSRF_FIELD_NAME"); // was: W -> g.v
  const xsrfToken = getConfig("XSRF_TOKEN"); // was: m -> g.v
  let body = options.postBody || ""; // was: K
  let postParams = options.postParams; // was: T
  const xsrfFieldName = getConfig("XSRF_FIELD_NAME"); // was: r -> g.v
  let contentType; // was: U
  if (options.headers) contentType = options.headers["Content-Type"];

  if (!options.excludeXsrf &&
      !(getDomain(url) && !options.withCredentials && getDomain(url) !== document.location.hostname) &&
      options.method === "POST" &&
      !(contentType && contentType !== "application/x-www-form-urlencoded") &&
      !(options.postParams && options.postParams[xsrfFieldName])) {
    if (!postParams) postParams = {};
    postParams[xsrfField] = xsrfToken;
  }

  if (postParams && typeof body === "string") {
    body = parseQueryString(body);
    extendObject(body, postParams);
    body = options.postBodyFormat && options.postBodyFormat === "JSON"
      ? JSON.stringify(body)
      : buildQueryFromObject(body);
  }

  const hasBody = body || (postParams && !isEmptyObject(postParams)); // was: T
  if (!Sgx && hasBody && options.method !== "POST") {
    Sgx = true; // was: !0
    logError(Error("AJAX request with postData should use POST")); // was: g.Zp
  }
  return body;
}

/**
 * Parse an XHR response body.
 * [was: i33]
 */
export function parseResponse(url, format, response, convertToSafeHtml) { // was: i33
  let result = null; // was: K
  switch (format) {
    case "JSON": {
      let text; // was: T
      try {
        text = response.responseText;
      } catch (err) { // was: r
        const parseErr = Error("Error reading responseText");
        parseErr.params = url;
        logWarning(parseErr); // was: si
        throw err;
      }
      const contentType = response.getResponseHeader("Content-Type") || ""; // was: Q
      if (text && contentType.indexOf("json") >= 0) {
        if (text.substring(0, 5) === ")]}'\n") text = text.substring(5);
        try {
          result = JSON.parse(text);
        } catch (_err) {} // was: r
      }
      break;
    }
    case "XML": {
      const xmlDoc = (response.responseXML) ? getRootElement(response.responseXML) : null; // was: Q -> FSx
      if (xmlDoc) {
        result = {};
        forEach(xmlDoc.getElementsByTagName("*"), (elem) => { // was: r
          result[elem.tagName] = getTextContent(elem); // was: Z3y
        });
      }
      break;
    }
  }
  if (convertToSafeHtml) sanitizeHtmlFields(result); // was: EJ_
  return result;
}

/**
 * Recursively convert html_content / *_html fields to SafeHtml.
 * [was: EJ_]
 */
export function sanitizeHtmlFields(obj) { // was: EJ_
  if (isObject(obj)) {
    for (const key in obj) { // was: c
      if (key === "html_content" || q$(key, "_html")) {
        obj[key] = mk(obj[key]);
      } else {
        sanitizeHtmlFields(obj[key]);
      }
    }
  }
}

/**
 * Determine whether a response is "successful" given its format.
 * [was: yCK]
 */
export function validateResponse(format, response, parsed) { // was: yCK
  if (response && response.status === 204) return true; // was: !0
  switch (format) {
    case "JSON":
      return !!parsed;
    case "XML":
      return Number(parsed && parsed.return_code) === 0;
    case "RAW":
      return true;
    default:
      return !!parsed;
  }
}

/**
 * Get the <root> element from an XML document or XHR responseXML.
 * [was: FSx]
 */
export function getRootElement(doc) { // was: FSx
  if (!doc) return null;
  const roots = ("responseXML" in doc ? doc.responseXML : doc).getElementsByTagName("root");
  return roots && roots.length > 0 ? roots[0] : null;
}

/**
 * Concatenate text content of child nodes.
 * [was: Z3y]
 */
export function getTextContent(element) { // was: Z3y
  let text = ""; // was: c
  forEach(element.childNodes, (node) => { // was: W
    text += node.nodeValue;
  });
  return text;
}

/**
 * Forward debug query parameters from the current URL.
 * [was: xSd]
 */
export function forwardQueryParameters(url) { // was: xSd
  const search = window.location.search; // was: c
  let hostname = getDomain(url); // was: W
  if (!getExperimentBoolean("debug_handle_relative_url_for_query_forward_killswitch") && !hostname && isSameOrigin(url)) {
    hostname = document.location.hostname;
  }
  const pathname = tF(url); // was: m
  const isYouTube = hostname && (hostname.endsWith("youtube.com") || hostname.endsWith("youtube-nocookie.com")); // was: W
  const isApi = isYouTube && pathname && pathname.startsWith("/api/"); // was: m
  if (!isYouTube || isApi) return url;
  const searchParams = parseQueryString(search); // was: K
  const forwarded = {}; // was: T
  forEach(sUm, (param) => { // was: r
    if (searchParams[param]) forwarded[param] = searchParams[param];
  });
  return appendQueryParamsPreserveExisting(url, forwarded);
}

// ---------------------------------------------------------------------------
// Promise-based request helpers (lines 11567–11633)
// ---------------------------------------------------------------------------

/**
 * Make a promise-based XHR request with cancellation support.
 * [was: TG]
 */
export function promiseRequest(url, options) { // was: TG
  const opts = shallowClone(options); // was: W
  let xhr; // was: m
  return (new PromiseImpl((resolve, reject) => { // was: K, T
    opts.onSuccess = (response) => { // was: r
      if (isSuccessStatus(response)) {
        resolve(new SuccessResponse(response));
      } else {
        reject(new PromiseAjaxError(`Request failed, status=${getStatus(response)}`, "net.badstatus", response));
      }
    };
    opts.onError = (response) => { // was: r
      reject(new PromiseAjaxError("Unknown request error", "net.unknown", response));
    };
    opts.onTimeout = (response) => { // was: r
      reject(new PromiseAjaxError("Request timed out", "net.timeout", response));
    };
    xhr = xhrRequest(url, opts); // was: g.Wn
  })).catchCustom((err) => { // was: K
    if (err instanceof CancellationError && xhr?.abort) xhr.abort(); // was: eH
    return rejectedPromise(err); // was: cJ
  });
}

/**
 * Retry a request with exponential backoff.
 * [was: g.o2]
 */
export function retryRequest(url, options, maxRetries, baseDelay, maxDelay = -1, onRetry) { // was: g.o2
  const wait = (sendPostRequest) => new PromiseImpl((resolve) => { // was: r, I, X
    setTimeout(resolve, sendPostRequest);
  });
  const attempt = (promise, retriesLeft, delay) => promise.catchCustom((err) => { // was: U, I, X, A
    if (retriesLeft <= 0 || getStatus(err.xhr) === 403) {
      return rejectedPromise(new PromiseAjaxError("Request retried too many times", "net.retryexhausted", err.xhr));
    }
    const nextDelay = Math.pow(2, maxRetries - retriesLeft + 1) * delay; // was: V
    const cappedDelay = maxDelay > 0 ? Math.min(maxDelay, nextDelay) : nextDelay; // was: B
    return wait(delay).then(() => {
      if (onRetry) onRetry(err, retriesLeft - 1); // was: T
      return attempt(promiseRequest(url, options), retriesLeft - 1, cappedDelay);
    });
  });
  return attempt(promiseRequest(url, options), maxRetries - 1, baseDelay);
}

// ---------------------------------------------------------------------------
// Result wrappers (lines 11612–11665)
// ---------------------------------------------------------------------------

/**
 * Mark a result as "fulfilled" (state = 2).
 * [was: LSR]
 */
export function markFulfilled(result, value = null) { // was: LSR
  result.A = 2;
  result.O = value;
}

/**
 * Mark a result as "pending success" (state = 1).
 * [was: wWn]
 */
export function markPending(result, value = null) { // was: wWn
  result.A = 1;
  result.O = value;
}

/**
 * Create a fulfilled result wrapper.
 * [was: U1]
 */
export function createFulfilledResult(value = null) { // was: U1
  const r = new rL(); // was: c
  markFulfilled(r, value);
  return r;
}

/**
 * Create a pending-success result wrapper.
 * [was: I2]
 */
export function createPendingResult(value = null) { // was: I2
  const r = new rL(); // was: c
  markPending(r, value);
  return r;
}

/**
 * Set a cookie.
 * [was: g.e$]
 */
export function setCookie(name, value, maxAge, domain = "youtube.com", secure = false) { // was: g.e$, !1
  if (!XF) {
    AE.set("" + name, value, { BeforeContentVideoIdStartedTrigger: maxAge, path: "/", domain, secure });
  }
}

/**
 * Get a cookie value.
 * [was: g.V5]
 */
export function getCookie(name, defaultValue) { // was: g.V5
  if (!XF) return AE.get("" + name, defaultValue);
}

/**
 * Remove a cookie.
 * [was: g.Bn]
 */
export function removeCookie(name, path = "/", domain = "youtube.com") { // was: g.Bn
  if (!XF) AE.remove("" + name, path, domain);
}

/**
 * Test whether cookies are enabled.
 * [was: b3_]
 * @returns {boolean}
 */
export function areCookiesEnabled() { // was: b3_
  if (!AE.isEnabled()) return false; // was: !1
  if (!AE.isEmpty()) return true; // was: !0
  AE.set("TESTCOOKIESENABLED", "1", { BeforeContentVideoIdStartedTrigger: 60 });
  if (AE.get("TESTCOOKIESENABLED") !== "1") return false;
  AE.remove("TESTCOOKIESENABLED");
  return true;
}

// ---------------------------------------------------------------------------
// Misc helpers (lines 11666–11927)
// ---------------------------------------------------------------------------

/* obfuscated call-through — kept opaque */
var jUd = function () { // was: jUd
  return VD[x[13]](this, 17, 1522);
};

/**
 * Read a property by descriptor name from an object.
 * [was: g.l]
 */
export function readProperty(obj, descriptor) { // was: g.l
  if (obj) return obj[descriptor.name];
}

/**
 * Prefix a URL with the Innertube host override if set.
 * [was: xn]
 */
export function applyHostOverride(url) { // was: xn
  const override = getConfig("INNERTUBE_HOST_OVERRIDE"); // was: c -> g.v
  if (override) url = String(override) + String(NN(url));
  return url;
}

/**
 * Append prettyPrint=false when condensed JSON flag is on.
 * [was: gJR]
 */
export function applyCondensedJson(url) { // was: gJR
  const params = {}; // was: c
  if (getExperimentBoolean("json_condensed_response")) params.prettyPrint = "false"; // was: g.P
  return appendQueryParamsPreserveExisting(url, params);
}

/**
 * Build default fetch init options for an Innertube request.
 * [was: qt]
 */
export function buildInnertubeRequestInit(url, method = "POST") { // was: qt
  const init = { // was: Q
    method,
    mode: isSameOrigin(url) ? "same-origin" : "cors",
    credentials: isSameOrigin(url) ? "same-origin" : "include",
  };
  const raw = {}; // was: c
  const filtered = {}; // was: W
  for (const key of Object.keys(raw)) { // was: m
    if (raw[key]) filtered[key] = raw[key];
  }
  if (Object.keys(filtered).length > 0) init.headers = filtered;
  return init;
}

/**
 * Generate a cache-key for a service + params combination.
 * [was: nh]
 */
export function buildServiceCacheKey(service, params = {}) { // was: nh
  return `service:${service}/${Object.keys(params).sort().map((k) => k + ":" + params[k]).join("/")}`;
}

// ---------------------------------------------------------------------------
// Browser / platform detection (lines 11704–11927)
// ---------------------------------------------------------------------------

/**
 * Get the major Chrome version number from the UA string.
 * [was: Dw]
 * @returns {number} NaN if not Chrome
 */
export function getChromeVersion() { // was: Dw
  const match = /Chrome\/(\d+)/.exec(getUserAgent());
  return match ? parseFloat(match[1]) : NaN;
}

/**
 * Get the Cobalt version number from the UA string.
 * [was: tE]
 * @returns {number} NaN if not Cobalt
 */
export function getCobaltVersion() { // was: tE
  let match = /\sCobalt\/(\S+)\s/.exec(getUserAgent()); // was: Q
  if (!match) return NaN;
  const parts = []; // was: c
  for (const segment of match[1].split(".")) { // was: W
    const num = parseInt(segment, 10); // was: Q (reused)
    if (num >= 0) parts.push(num);
  }
  return parseFloat(parts.join("."));
}

/**
 * Check for Android Chrome (not Edge / Trident / Cobalt).
 * [was: Nt]
 * @returns {boolean}
 */
export function isAndroidChrome() { // was: Nt
  return userAgentContains("android") && userAgentContains("chrome") &&
    !(userAgentContains("trident/") || userAgentContains("edge/")) && !userAgentContains("cobalt");
}

/**
 * Check whether the user-agent indicates Cobalt.
 * [was: g.i0]
 * @returns {boolean}
 */
export function isCobalt() { // was: g.i0
  return userAgentContains("cobalt");
}

/**
 * Check for Cobalt on Apple TV.
 * [was: y5]
 * @returns {boolean}
 */
export function isCobaltAppleTV() { // was: y5
  return userAgentContains("cobalt") && userAgentContains("appletv");
}

/**
 * Check for PS3 leanback shell.
 * [was: S$]
 * @returns {boolean}
 */
export function isPS3() { // was: S$
  return userAgentContains("(ps3; leanback shell)") || (userAgentContains("ps3") && isCobalt());
}

/**
 * Check for PS4 leanback shell.
 * [was: O3_]
 * @returns {boolean}
 */
export function isPS4() { // was: O3_
  return userAgentContains("(ps4; leanback shell)") || (userAgentContains("ps4") && isCobalt());
}

/**
 * Check for PS4 VR.
 * [was: g.fYK]
 * @returns {boolean}
 */
export function isPS4VR() { // was: g.fYK
  return isCobalt() && (userAgentContains("ps4 vr") || userAgentContains("ps4 pro vr"));
}

/**
 * Check for a WebKit version >= 600.
 * [was: FF]
 * @returns {boolean}
 */
export function isWebKit600Plus() { // was: FF
  const match = /WebKit\/([0-9]+)/.exec(getUserAgent()); // was: Q
  return !!(match && parseInt(match[1], 10) >= 600);
}

/**
 * Check for a WebKit version >= 602.
 * [was: Zw]
 * @returns {boolean}
 */
export function isWebKit602Plus() { // was: Zw
  const match = /WebKit\/([0-9]+)/.exec(getUserAgent());
  return !!(match && parseInt(match[1], 10) >= 602);
}

/**
 * Check for IE Mobile / Windows Phone + Edge.
 * [was: vJW]
 * @returns {boolean}
 */
export function isWindowsPhoneOrIEMobile() { // was: vJW
  return userAgentContains("iemobile") || (userAgentContains("windows phone") && userAgentContains("edge"));
}

/**
 * Check for an in-app WebView (WebKit, not Safari version).
 * [was: dL]
 * @returns {boolean}
 */
export function isInAppWebView() { // was: dL
  return (E1 || userSkipAd) && userAgentContains("applewebkit") && !userAgentContains("version") &&
    (!userAgentContains("safari") || userAgentContains("gsa/"));
}

/**
 * Check for Safari with an explicit version string.
 * [was: wL]
 * @returns {boolean}
 */
export function isSafariVersioned() { // was: wL
  return isAndroid() && userAgentContains("version/");
}

/**
 * Check for Samsung Smart TV.
 * [was: b0]
 * @returns {boolean}
 */
export function isSamsungSmartTV() { // was: b0
  return userAgentContains("smart-tv") && userAgentContains("samsung");
}

/**
 * Test whether the lowercase user-agent contains a substring.
 * [was: g.Hn]
 * @param {string} substring  [was: Q]
 * @returns {boolean}
 */
export function userAgentContains(substring) { // was: g.Hn
  const ua = getUserAgent(); // was: c
  return ua ? ua.toLowerCase().indexOf(substring) >= 0 : false; // was: !1
}

/**
 * Determine whether the client should use first-party cookie flow.
 * [was: j$]
 * @returns {boolean}
 */
export function shouldUseFirstPartyCookie() { // was: j$
  if (hasSapisidCookie() || isInAppWebView() || isSafariVersioned()) return true; // was: !0
  return getConfig("EOM_VISITOR_DATA") ? false : true; // was: !1, !0
}

/**
 * Coerce a value to a boolean, treating "1" / true / 1 / "True" as true.
 * [was: gL]
 * @param {boolean} defaultValue  [was: Q]
 * @param {*} value  [was: c]
 * @returns {boolean}
 */
export function coerceBoolean(defaultValue, value) { // was: gL
  if (value === undefined || value === null) return defaultValue; // was: void 0
  return value === "1" || value === true || value === 1 || value === "True" ? true : false; // was: !0, !1
}

/**
 * Match a value against an enum-like object, returning defaultValue if no match.
 * [was: O1]
 */
export function matchEnum(defaultValue, value, enumObj) { // was: O1
  for (const key in enumObj) { // was: m
    if (enumObj[key] == value) return enumObj[key];
  }
  return defaultValue;
}

/**
 * Coerce to number with a default.
 * [was: fh]
 */
export function coerceNumber(defaultValue, value) { // was: fh
  return value === undefined || value === null ? defaultValue : Number(value); // was: void 0
}

/**
 * Coerce to string with a default.
 * [was: vn]
 */
export function coerceString(defaultValue, value) { // was: vn
  return value === undefined || value === null ? defaultValue : value.toString(); // was: void 0
}

/**
 * Parse an aspect-ratio string like "16:9" into a numeric ratio.
 * [was: a2]
 */
export function parseAspectRatio(aspectStr, isSpecial) { // was: a2
  if (isSpecial) {
    if (aspectStr === "fullwidth") return Infinity;
    if (aspectStr === "fullheight") return 0;
  }
  if (aspectStr) {
    const match = aspectStr.match(aYw); // was: c
    if (match) {
      const height = Number(match[2]); // was: Q
      const width = Number(match[1]); // was: c
      if (!isNaN(height) && !isNaN(width) && height > 0) return width / height;
    }
  }
  return NaN;
}

/**
 * Extract a video ID from player vars by trying several keys.
 * [was: GG]
 */
export function extractVideoId(vars) { // was: GG
  let id = vars.docid || vars.video_id || vars.videoId || vars.id; // was: c
  if (id) return id;
  let rawResponse = vars.raw_player_response; // was: c
  if (!rawResponse) {
    const responseStr = vars.player_response; // was: Q
    if (responseStr) rawResponse = JSON.parse(responseStr);
  }
  return (rawResponse && rawResponse.videoDetails && rawResponse.videoDetails.videoId) || null;
}

/**
 * Check whether a player-vars object represents PFL mode.
 * [was: G0n]
 */
export function isPflMode(vars) { // was: G0n
  return getEmbeddedPlayerMode(vars, false) === "EMBEDDED_PLAYER_MODE_PFL"; // was: $n(Q, !1)
}

/**
 * Check for a lite playback-limit mode.
 * [was: g.l0]
 */
export function isLitePlaybackLimit(mode) { // was: g.l0
  return mode === "EMBEDDED_PLAYER_LITE_MODE_FIXED_PLAYBACK_LIMIT" ||
         mode === "EMBEDDED_PLAYER_LITE_MODE_DYNAMIC_PLAYBACK_LIMIT";
}

/**
 * Determine the embedded player mode from player vars.
 * [was: $n]
 */
export function getEmbeddedPlayerMode(vars, useDefault = false) { // was: $n
  let fallback = useDefault ? "EMBEDDED_PLAYER_MODE_DEFAULT" : "EMBEDDED_PLAYER_MODE_UNKNOWN"; // was: c
  if (window.location.hostname.includes("youtubeeducation.com")) {
    fallback = "EMBEDDED_PLAYER_MODE_PFL";
  }
  let response = vars.raw_embedded_player_response; // was: W
  if (!response) {
    const serialized = vars.embedded_player_response; // was: Q
    if (serialized) {
      try {
        response = JSON.parse(serialized);
      } catch (_err) { // was: m
        return fallback;
      }
    }
  }
  return response ? matchEnum(fallback, response.embeddedPlayerMode, $SW) : fallback;
}

// ---------------------------------------------------------------------------
// Biscotti ID fetching (lines 11840–11927)
// ---------------------------------------------------------------------------

/**
 * Check preconditions for Biscotti ID fetching.
 * Returns an Error if fetching should not proceed, or undefined if OK.
 * [was: P6m]
 */
export function checkBiscottiFetchPreconditions() { // was: P6m
  if (getExperimentBoolean("disable_biscotti_fetch_entirely_for_all_web_clients")) {
    return Error("Biscotti id fetching has been disabled entirely.");
  }
  if (!shouldUseFirstPartyCookie()) { // was: j$()
    return Error("User has not consented - not fetching biscotti id.");
  }
  const playerVars = getConfig("PLAYER_VARS", {}); // was: Q -> g.v
  if (getWithDefault(playerVars, "privembed", false) == "1") { // was: !1
    return Error("Biscotti ID is not available in private embed mode");
  }
  if (isPflMode(playerVars)) { // was: G0n
    return Error("Biscotti id fetching has been disabled for pfl.");
  }
}

/**
 * Fetch the Biscotti ID (with caching/retry).
 * [was: z17]
 * @returns {PromiseImpl}
 */
export function fetchBiscottiId() { // was: z17
  const preconditionError = checkBiscottiFetchPreconditions(); // was: Q -> P6m()
  if (preconditionError !== undefined) return rejectedPromise(preconditionError); // was: void 0, cJ
  if (!u0) {
    u0 = promiseRequest("//googleads.g.doubleclick.net/pagead/id", lYK) // was: TG
      .then(parseBiscottiResponse) // was: um7
      .catchCustom((err) => handleBiscottiFetchError(2, err)); // was: h1w
  }
  return u0;
}

/**
 * Parse a successful Biscotti response.
 * [was: um7]
 */
export function parseBiscottiResponse(response) { // was: um7
  let text = response.xhr.responseText; // was: Q
  if (!x9(text, ")]}'")) throw new BiscottiMissingError();
  text = JSON.parse(text.substr(4));
  if ((text.type || 1) > 1) throw new BiscottiMissingError();
  const id = text.id; // was: Q
  setLastBiscottiId(id); // was: Hz
  u0 = createPendingResult(id); // was: I2
  scheduleBiscottiRefresh(18e5, 2); // was: C6d
  return id;
}

/**
 * Handle a Biscotti fetch error – clear cached ID, schedule retry.
 * [was: h1w]
 */
export function handleBiscottiFetchError(retriesLeft, error) { // was: h1w
  const wrappedError = new BiscottiError(error); // was: c
  setLastBiscottiId(""); // was: Hz("")
  u0 = createFulfilledResult(wrappedError); // was: U1
  if (retriesLeft > 0) scheduleBiscottiRefresh(12e4, retriesLeft - 1); // was: C6d
  throw wrappedError;
}

/**
 * Schedule a delayed Biscotti ID refresh.
 * [was: C6d]
 */
export function scheduleBiscottiRefresh(delayMs, retriesLeft) { // was: C6d
  safeSetTimeout(function () { // was: g.zn
    promiseRequest("//googleads.g.doubleclick.net/pagead/id", lYK) // was: TG
      .then(parseBiscottiResponse, (err) => handleBiscottiFetchError(retriesLeft, err)) // was: um7, h1w
      .catchCustom(g.vB);
  }, delayMs);
}

/**
 * Public entry for getting the Biscotti ID (tries a cached getter first).
 * [was: JCK]
 */
export function getBiscottiId() { // was: JCK
  try {
    const getter = getObjectByPath("yt.ads.biscotti.getId_"); // was: Q
    return getter ? getter() : fetchBiscottiId(); // was: z17()
  } catch (err) { // was: Q
    return rejectedPromise(err); // was: cJ
  }
}

// ---------------------------------------------------------------------------
// Script loading / dataset helpers (lines 11897–11927)
// ---------------------------------------------------------------------------

/**
 * Mark a script element as loaded via its dataset.
 * [was: k0n]
 */
export function markScriptLoaded(element) { // was: k0n
  if (element) {
    if (element.dataset) {
      element.dataset[getLoadedDataKey()] = "true"; // was: R13()
    } else {
      Lm_(element);
    }
  }
}

/**
 * Check whether a script element has been marked loaded.
 * [was: Ygn]
 * @param {Element} element  [was: Q]
 * @returns {string|null}
 */
export function isScriptLoaded(element) { // was: Ygn
  if (!element) return null;
  return element.dataset
    ? element.dataset[getLoadedDataKey()] // was: R13()
    : element.getAttribute("data-loaded");
}

/**
 * Get the camelCased dataset key for "loaded".
 * [was: R13]
 * @returns {string}
 */
export function getLoadedDataKey() { // was: R13
  return pW_.loaded || (pW_.loaded = "loaded".replace(/\-([a-z])/g, (_match, letter) => letter.toUpperCase()));
}

/**
 * Read the document visibility state (with vendor-prefix fallback).
 * [was: Q6m]
 * @returns {string|undefined}
 */
export function getVisibilityState() { // was: Q6m
  const doc = document; // was: Q
  if ("visibilityState" in doc) return doc.visibilityState;
  const prefixed = zG + "VisibilityState"; // was: c
  if (prefixed in doc) return doc[prefixed];
}

/**
 * Find the first truthy value produced by a callback scanning a mapping.
 * [was: Ch]
 * @param {*} source  [was: Q]
 * @param {Object} mapping  [was: c]
 * @returns {*}
 */
export function findFirstTruthyInMapping(source, mapping) { // was: Ch
  let result; // was: W
  Jy(source, (key) => { // was: m
    result = mapping[key];
    return !!result;
  });
  return result;
}
