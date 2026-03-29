/**
 * event-logging.js -- DOM event wrapping for logging, event-to-telemetry
 * bridge, and logging integration helpers.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines 61678-62264
 *
 * Covers:
 *  - g.tG.prototype.stopPropagation / preventDefault: base event overrides
 *  - HO (BrowserEvent): normalised cross-browser DOM event wrapper
 *  - Sa (ListenerMap): listener registry indexed by event type
 *  - Event system constants (NH, zAx, bs, aF, O7, G$)
 *  - EventTargetBase (EventTarget): custom listenable event target with bubble chain
 *  - AsyncContext snapshot helper (ls)
 *  - XLm (ObjectPool): fixed-capacity object pool for allocation recycling
 *  - Ac3 (MicrotaskQueue): linked-list queue for microtask scheduling
 *  - eD7 (QueueNode): reusable node in the microtask queue
 *  - g.mN: microtask scheduler (Promise-based)
 *  - kR (PromiseCallbackRecord): reusable callback record for PromiseImpl
 *  - PromiseImpl (ClosurePromise): Closure Library promise with synchronous chaining
 *  - eH (CancelError): promise cancellation error
 *  - g.DE (Timer): EventTarget-based repeating timer with drift correction
 *  - cG (StreamzBatcher): batched streamz metric flusher
 *  - fZ (RpcError): gRPC-style error with numeric code and metadata
 *  - wV (JsonSerializer): JSON serialisation with escape handling
 *  - vJ / BF7 (XhrFactory): XMLHttpRequest factory (singleton)
 *  - XhrIo (XhrIo): full-featured XHR wrapper with events and timeouts
 *  - Pmd (SimpleHttpSender): minimal HTTP sender using XhrIo
 */

import { EventTargetBase, listen, PromiseImpl, resolvedPromise } from '../core/composition-helpers.js';  // was: g.$R, g.s7, g.RF, g.QU
import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { globalRef, setPrototypeOf } from '../core/polyfills.js';  // was: g.IW, g.Wmm
import { XhrIo } from '../network/request.js';  // was: g.aY
import { ListenerMap } from '../core/composition-helpers.js'; // was: Sa
import { findListenerIndex } from '../core/composition-helpers.js'; // was: Z4
import { setConnectData } from '../modules/remote/mdx-client.js'; // was: Wa
import { unlisten } from '../core/composition-helpers.js'; // was: fW
import { createConditionalExtractor } from './metrics-keys.js'; // was: oB
import { dispatchToListeners } from '../core/composition-helpers.js'; // was: PO
import { disposeApp } from '../player/player-events.js'; // was: WA
import { getBufferHealth } from '../media/segment-request.js'; // was: El
import { runPendingTasks } from '../core/composition-helpers.js'; // was: kYn
import { CallbackEntry } from '../core/composition-helpers.js'; // was: kR
import { chainPromise } from '../core/composition-helpers.js'; // was: VU
import { enqueueCallback } from '../core/composition-helpers.js'; // was: oY
import { catchCustom } from '../ads/ad-async.js'; // was: fF
import { CancellationError } from '../core/composition-helpers.js'; // was: eH
import { cancelPromise } from '../core/composition-helpers.js'; // was: U_
import { resolveOrReject } from '../core/composition-helpers.js'; // was: JG
import { dequeueFirst } from '../core/composition-helpers.js'; // was: IY
import { processEntry } from '../core/composition-helpers.js'; // was: Xn
import { adsEngagementPanelLayoutVM } from '../core/misc-helpers.js'; // was: kT
import { clearAllMetrics } from '../core/event-registration.js'; // was: cAd
import { getExperimentNumber } from './idb-transactions.js'; // was: Y3
import { XmlHttpFactory } from '../core/event-registration.js'; // was: fO
import { DefaultXmlHttpFactory } from '../core/event-registration.js'; // was: vJ
import { updateCountdownHeader } from '../modules/endscreen/autoplay-countdown.js'; // was: BK
import { closureNamespace } from '../proto/messages-core.js'; // was: uS
import { bezierX } from '../core/bitstream-helpers.js'; // was: gq

import { toString, contains } from '../core/string-utils.js';
import { removeAt, removeAll, remove, filter } from '../core/array-utils.js';
import { someObject, extendObject } from '../core/object-utils.js';
import { DomEvent } from '../core/dom-event.js';
import { Disposable } from '../core/disposable.js';
import { Timer } from '../core/timer.js';
import { grpcStatusName } from '../media/bitstream-reader.js';
import { dispose } from '../ads/dai-cue-range.js';
import { getStatus } from '../core/composition-helpers.js';
import { getResponseText } from '../network/request.js'; // was: g.MA
// TODO: resolve g.DE
// TODO: resolve g.mN
// TODO: resolve g.tG
// TODO: resolve g.y

// =========================================================================
// Base event overrides   [was: g.tG, lines 61679-61685]
// =========================================================================

/**
 * Stop event propagation on the base event class.
 * [was: g.tG.prototype.stopPropagation]
 */
DomEvent.prototype.stopPropagation = function () {
  this.propagationStopped = true; // was: this.O = !0
};

/**
 * Prevent default on the base event class.
 * [was: g.tG.prototype.preventDefault]
 */
DomEvent.prototype.preventDefault = function () {
  this.defaultPrevented = true;
};

// BrowserEvent defined in core/dom-event.js [was: HO]

// =========================================================================
// Listenable marker / ListenerMap   [was: NH, Sa, lines 61729-61791]
// =========================================================================

/**
 * Property key used to mark objects as listenable event targets.
 * [was: NH]
 * @type {string}
 */
export const LISTENABLE_KEY = "closure_listenable_" + ((Math.random() * 1e6) | 0); // was: NH

/**
 * Global listener-key counter.
 * [was: zAx]
 * @type {number}
 */
export let listenerKeyCounter = 0; // was: zAx

/**
 * ListenerMap -- maintains a map of event-type -> array of listener records.
 *
 * [was: Sa]
 */
// Sa.prototype methods:

g.y = ListenerMap.prototype;

/**
 * Add a listener for the given event type.
 * [was: Sa.prototype.add]
 * @param {string|Object} eventType [was: Q]
 * @param {Function} handler [was: c]
 * @param {boolean} isOneShot [was: W]
 * @param {boolean} useCapture [was: m]
 * @param {*} context [was: K]
 * @returns {CmX} The listener record
 */
g.y.add = function (eventType, handler, isOneShot, useCapture, context) { // was: add(Q, c, W, m, K)
  const typeStr = eventType.toString(); // was: T = Q.toString()
  let bucket = this.listeners[typeStr]; // was: Q = this.listeners[T]
  if (!bucket) {
    bucket = this.listeners[typeStr] = [];
    this.typeCount++; // was: this.W++
  }

  const existingIdx = findListenerIndex(bucket, handler, useCapture, context); // was: r
  if (existingIdx > -1) {
    const existing = bucket[existingIdx]; // was: c
    if (!isOneShot) existing.h$ = false; // was: c.h$ = !1
    return existing;
  }

  const record = new CmX(handler, this.src, typeStr, !!useCapture, context); // was: c
  record.h$ = isOneShot;
  bucket.push(record);
  return record;
};

/**
 * Remove a specific listener.
 * [was: Sa.prototype.remove]
 * @param {string|Object} eventType [was: Q]
 * @param {Function} handler [was: c]
 * @param {boolean} useCapture [was: W]
 * @param {*} context [was: m]
 * @returns {boolean}
 */
g.y.remove = function (eventType, handler, useCapture, context) { // was: remove(Q, c, W, m)
  const typeStr = eventType.toString(); // was: Q = Q.toString()
  if (!(typeStr in this.listeners)) return false;

  const bucket = this.listeners[typeStr]; // was: K
  const idx = findListenerIndex(bucket, handler, useCapture, context); // was: c
  if (idx > -1) {
    y2(bucket[idx]);
    removeAt(bucket, idx);
    if (bucket.length === 0) {
      delete this.listeners[typeStr];
      this.typeCount--; // was: this.W--
    }
    return true;
  }
  return false;
};

/**
 * Remove all listeners, optionally filtered by event type.
 * [was: Sa.prototype.removeAll]
 * @param {string|Object} [eventType] [was: Q]
 * @returns {number} Number of listeners removed
 */
g.y.removeAll = function (eventType) { // was: removeAll(Q)
  const typeFilter = eventType && eventType.toString(); // was: Q = Q && Q.toString()
  let removed = 0; // was: c

  for (const key in this.listeners) { // was: W
    if (!typeFilter || key === typeFilter) {
      const bucket = this.listeners[key]; // was: m
      for (let i = 0; i < bucket.length; i++) { // was: K
        ++removed;
        y2(bucket[i]);
      }
      delete this.listeners[key];
      this.typeCount--; // was: this.W--
    }
  }
  return removed;
};

/**
 * Find a specific listener record.
 * [was: Sa.prototype.Wa]
 */
g.y.setConnectData = function (eventType, handler, useCapture, context) { // was: Wa(Q, c, W, m)
  const bucket = this.listeners[eventType.toString()]; // was: Q
  let idx = -1; // was: K
  if (bucket) idx = findListenerIndex(bucket, handler, useCapture, context);
  return idx > -1 ? bucket[idx] : null;
};

/**
 * Check whether any listeners match the given type and capture flag.
 * [was: Sa.prototype.hasListener]
 */
g.y.hasListener = function (eventType, useCapture) { // was: hasListener(Q, c)
  const hasType = eventType !== undefined; // was: W
  const typeStr = hasType ? eventType.toString() : ""; // was: m
  const hasCapture = useCapture !== undefined; // was: K

  return someObject(this.listeners, function (bucket) { // was: T
    for (let i = 0; i < bucket.length; ++i) { // was: r
      if (!(hasType && bucket[i].type !== typeStr || hasCapture && bucket[i].capture !== useCapture)) {
        return true;
      }
    }
    return false;
  });
};

// =========================================================================
// Event system globals   [was: lines 61792-61795]
// =========================================================================

/** @type {string} Listener-map property key [was: bs] */
export const LISTENER_MAP_KEY = "closure_lm_" + ((Math.random() * 1e6) | 0); // was: bs

/** @type {Object} Active listener registry [was: aF] */
export const activeListeners = {}; // was: aF

/** @type {number} Global listener counter [was: O7] */
export let globalListenerCount = 0; // was: O7

/** @type {string} Closure events function marker [was: G$] */
export const EVENTS_FN_KEY =
  "__closure_events_fn_" + ((Math.random() * 1e9) >>> 0); // was: G$

// =========================================================================
// EventTarget   [was: g.$R, lines 61796-61867]
// =========================================================================

// EventTargetBase class defined in core/composition-helpers.js [was: g.$R]
// Prototype methods added here for the event system.

EventTargetBase.prototype[LISTENABLE_KEY] = true; // was: g.$R.prototype[NH] = !0

/** @see EventTarget.addEventListener [was: addEventListener] */
EventTargetBase.prototype.addEventListener = function (type, handler, useCapture, context) { // was: addEventListener(Q, c, W, m)
  listen(this, type, handler, useCapture, context);
};

/** @see EventTarget.removeEventListener [was: removeEventListener] */
EventTargetBase.prototype.removeEventListener = function (type, handler, useCapture, context) { // was: removeEventListener(Q, c, W, m)
  unlisten(this, type, handler, useCapture, context);
};

/**
 * Dispatch an event through the capture -> target -> bubble chain.
 *
 * [was: EventTargetBase.prototype.dispatchEvent]
 * @param {string|g.tG|Object} event [was: Q]
 * @returns {boolean} false if any handler called preventDefault
 */
EventTargetBase.prototype.dispatchEvent = function (event) { // was: dispatchEvent(Q)
  let ancestor = this.qJ; // was: c
  let ancestors; // was: W

  if (ancestor) {
    ancestors = [];
    for (let depth = 1; ancestor; ancestor = ancestor.qJ) { // was: m
      ancestors.push(ancestor);
      ++depth;
    }
  }

  const target = this.createConditionalExtractor; // was: c (reused)
  const eventType = event.type || event; // was: m

  // Normalise to g.tG
  if (typeof event === "string") {
    event = new DomEvent(event, target);
  } else if (event instanceof DomEvent) {
    event.target = event.target || target;
  } else {
    const raw = event; // was: K
    event = new DomEvent(eventType, target);
    extendObject(event, raw);
  }

  let allHandled = true; // was: K (reused)
  let currentTarget; // was: T
  let i; // was: r

  // Capture phase (ancestors, top-down)
  if (ancestors) {
    for (i = ancestors.length - 1; !event.propagationStopped && i >= 0; i--) {
      currentTarget = event.currentTarget = ancestors[i];
      allHandled = dispatchToListeners(currentTarget, eventType, true, event) && allHandled;
    }
  }

  // Target phase
  if (!event.propagationStopped) {
    currentTarget = event.currentTarget = target;
    allHandled = dispatchToListeners(currentTarget, eventType, true, event) && allHandled;
    if (!event.propagationStopped) {
      allHandled = dispatchToListeners(currentTarget, eventType, false, event) && allHandled;
    }
  }

  // Bubble phase (ancestors, bottom-up)
  if (ancestors) {
    for (i = 0; !event.propagationStopped && i < ancestors.length; i++) {
      currentTarget = event.currentTarget = ancestors[i];
      allHandled = dispatchToListeners(currentTarget, eventType, false, event) && allHandled;
    }
  }

  return allHandled;
};

/**
 * Dispose -- remove all listeners and clear the parent chain.
 * [was: EventTargetBase.prototype.WA]
 */
EventTargetBase.prototype.disposeApp = function () {
  Disposable.prototype.disposeApp.call(this);
  if (this.W5) this.W5.removeAll(undefined); // was: this.W5 && this.W5.removeAll(void 0)
  this.qJ = null;
};

/** @see g.$R.listen [was: listen] */
EventTargetBase.prototype.listen = function (eventType, handler, useCapture, context) {
  return this.W5.add(String(eventType), handler, false, useCapture, context);
};

/** @see g.$R.El (one-shot listen) [was: El] */
EventTargetBase.prototype.getBufferHealth = function (eventType, handler, useCapture, context) {
  return this.W5.add(String(eventType), handler, true, useCapture, context);
};

/** Remove listener [was: Xd] */
EventTargetBase.prototype.Xd = function (eventType, handler, useCapture, context) {
  this.W5.remove(String(eventType), handler, useCapture, context);
};

/** Find listener [was: Wa] */
EventTargetBase.prototype.setConnectData = function (eventType, handler, useCapture, context) {
  return this.W5.setConnectData(String(eventType), handler, useCapture, context);
};

/** Check for listeners [was: hasListener] */
EventTargetBase.prototype.hasListener = function (eventType, useCapture) {
  return this.W5.hasListener(
    eventType !== undefined ? String(eventType) : undefined,
    useCapture
  );
};

// =========================================================================
// AsyncContext snapshot   [was: ls, line 61868]
// =========================================================================

/**
 * Wraps a callback with AsyncContext.Snapshot if available, for
 * correct context propagation across microtask boundaries.
 *
 * [was: ls]
 * @param {?Function} callback [was: Q]
 * @returns {?Function}
 */
export const wrapAsyncContext =
  typeof AsyncContext !== "undefined" && typeof AsyncContext.Snapshot === "function"
    ? (callback) => callback && AsyncContext.Snapshot.wrap(callback)
    : (callback) => callback; // was: ls

// =========================================================================
// ObjectPool   [was: XLm, lines 61869-61890]
// =========================================================================

/**
 * Fixed-capacity object pool. Recycles up to 100 objects to reduce
 * allocation pressure in hot paths (e.g. microtask queue nodes).
 *
 * [was: XLm]
 */
export class ObjectPool { // was: XLm
  /**
   * @param {Function} createFn - Factory function for new objects [was: Q]
   * @param {Function} resetFn - Reset function for recycled objects [was: c]
   */
  constructor(createFn, resetFn) { // was: constructor(Q, c)
    /** @type {Function} [was: this.A] */
    this.createFn = createFn; // was: this.A = Q

    /** @type {Function} [was: this.j] */
    this.resetFn = resetFn; // was: this.j = c

    /** @type {number} Current pool size [was: this.O] */
    this.poolSize = 0; // was: this.O = 0

    /** @type {?Object} Head of the free-list [was: this.W] */
    this.freeList = null; // was: this.W = null
  }

  /**
   * Acquire an object from the pool (or create a new one).
   * [was: get]
   * @returns {Object}
   */
  get() { // was: get()
    let obj; // was: Q
    if (this.poolSize > 0) {
      this.poolSize--;
      obj = this.freeList;
      this.freeList = obj.next;
      obj.next = null;
    } else {
      obj = this.createFn();
    }
    return obj;
  }

  /**
   * Return an object to the pool (capped at 100).
   * [was: put]
   * @param {Object} obj [was: Q]
   */
  put(obj) { // was: put(Q)
    this.resetFn(obj);
    if (this.poolSize < 100) {
      this.poolSize++;
      obj.next = this.freeList;
      this.freeList = obj;
    }
  }
}

// =========================================================================
// MicrotaskQueue   [was: Ac3 / eD7, lines 61893-61925]
// =========================================================================

/** @type {undefined|*} Async scheduler reference [was: us] */
let asyncSchedulerRef; // was: us

/**
 * Linked-list queue for microtask-scheduled callbacks.
 *
 * [was: Ac3]
 */
export class MicrotaskQueue { // was: Ac3
  constructor() {
    /** @type {?QueueNode} Head of the queue [was: this.W] */
    this.head = null; // was: this.W = null

    /** @type {?QueueNode} Tail of the queue [was: this.O] */
    this.tail = null; // was: this.O = null
  }

  /**
   * Enqueue a callback with optional scope.
   * [was: add]
   * @param {Function} callback [was: Q]
   * @param {*} scope [was: c]
   */
  add(callback, scope) { // was: add(Q, c)
    const node = CW.get(); // was: W
    node.set(callback, scope);
    if (this.tail) {
      this.tail.next = node;
    } else {
      this.head = node;
    }
    this.tail = node;
  }

  /**
   * Dequeue the next node (or null if empty).
   * [was: remove]
   * @returns {?QueueNode}
   */
  remove() { // was: remove()
    let node = null; // was: Q
    if (this.head) {
      node = this.head;
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      node.next = null;
    }
    return node;
  }
}

/**
 * Reusable queue-node pool for the MicrotaskQueue.
 * [was: CW]
 */
const queueNodePool = new ObjectPool(
  () => new QueueNode(),
  (node) => node.reset()
); // was: CW = new XLm(...)

/**
 * Reusable linked-list node for the microtask queue.
 *
 * [was: eD7]
 */
export class QueueNode { // was: eD7
  constructor() {
    /** @type {?QueueNode} Next pointer [was: this.next] */
    this.next = null;

    /** @type {?*} Execution scope [was: this.scope] */
    this.scope = null;

    /** @type {?Function} Callback function [was: this.W] */
    this.callback = null; // was: this.W = null
  }

  /**
   * [was: set]
   * @param {Function} callback [was: Q]
   * @param {*} scope [was: c]
   */
  set(callback, scope) { // was: set(Q, c)
    this.callback = callback; // was: this.W = Q
    this.scope = scope;
    this.next = null;
  }

  /**
   * [was: reset]
   */
  reset() { // was: reset()
    this.next = null;
    this.scope = null;
    this.callback = null; // was: this.W = null
  }
}

// =========================================================================
// Microtask scheduler   [was: g.mN / Vi7, lines 61927-61942]
// =========================================================================

/**
 * Global microtask scheduling variables.
 * [was: nP, MH, z$, Vi7]
 */
let scheduleFlush; // was: nP
let isFlushScheduled = false; // was: MH
const pendingQueue = new MicrotaskQueue(); // was: z$ = new Ac3

/**
 * Schedule a callback to run on the microtask queue.
 *
 * [was: g.mN]
 * @param {Function} callback [was: Q]
 * @param {*} scope [was: c]
 */
g.mN = (callback, scope) => { // was: g.mN = (Q, c) => { ... }
  if (!scheduleFlush) initScheduler(); // was: nP || Vi7()
  if (!isFlushScheduled) {
    scheduleFlush();
    isFlushScheduled = true;
  }
  pendingQueue.add(callback, scope);
};

/**
 * Initialise the microtask scheduler using a resolved Promise.
 * [was: Vi7]
 */
const initScheduler = () => { // was: Vi7
  const resolvedPromise = Promise.resolve(undefined); // was: Q
  scheduleFlush = () => {
    resolvedPromise.then(runPendingTasks);
  };
};

// =========================================================================
// PromiseCallbackRecord   [was: kR / YR, lines 61944-61955]
// =========================================================================

/**
 * Reusable callback record for ClosurePromise chains.
 *
 * [was: kR]
 */
CallbackEntry.prototype.reset = function () { // was: kR.prototype.reset
  this.context = null;
  this.onRejected = null; // was: this.O
  this.onFulfilled = null; // was: this.A
  this.callback = null; // was: this.W
  this.isUnhandled = false; // was: this.j = !1
};

/**
 * Pool for PromiseCallbackRecord instances.
 * [was: YR]
 */
const callbackRecordPool = new ObjectPool(
  function () { return new CallbackEntry(); },
  function (record) { record.reset(); }
); // was: YR = new XLm(...)

// =========================================================================
// ClosurePromise   [was: g.RF, lines 61956-62008]
// =========================================================================

/**
 * Closure Library promise implementation. Supports `.then()`, `.catch()`,
 * `.finally()`, `.cancel()`, and Thenable protocol.
 *
 * [was: PromiseImpl]
 */
PromiseImpl.prototype.then = function (onFulfilled, onRejected, scope) { // was: then(Q, c, W)
  return chainPromise(
    this,
    wrapAsyncContext(typeof onFulfilled === "function" ? onFulfilled : null),
    wrapAsyncContext(typeof onRejected === "function" ? onRejected : null),
    scope
  );
};

PromiseImpl.prototype.$goog_Thenable = true; // was: g.RF.prototype.$goog_Thenable = !0

g.y = PromiseImpl.prototype;

/**
 * Attach a finally handler.
 * [was: PromiseImpl.prototype.finally]
 */
g.y.finally = function (callback) { // was: finally(Q)
  const wrapped = wrapAsyncContext(callback); // was: Q = ls(Q)
  return new PromiseImpl((resolve, reject) => {
    enqueueCallback(
      this,
      (value) => { wrapped(); resolve(value); },
      (reason) => { wrapped(); reject(reason); }
    );
  });
};

/**
 * Attach a rejection handler (alias for `.catch()`).
 * [was: fF]
 */
g.y.catchCustom = function (onRejected, scope) { // was: fF(Q, c)
  return chainPromise(this, null, wrapAsyncContext(onRejected), scope);
};

g.y.catch = PromiseImpl.prototype.catchCustom;

/**
 * Cancel the promise with an optional reason.
 * [was: cancel]
 */
g.y.cancel = function (reason) { // was: cancel(Q)
  if (this.state === 0) { // was: this.W == 0
    const err = new CancellationError(reason);
    g.mN(function () {
      cancelPromise(this, err);
    }, this);
  }
};

/** Resolve handler. [was: Vn] */
g.y.Vn = function (value) { // was: Vn(Q)
  this.state = 0; // was: this.W = 0
  resolveOrReject(this, 2, value);
};

/** Reject handler. [was: nC] */
g.y.nC = function (reason) { // was: nC(Q)
  this.state = 0; // was: this.W = 0
  resolveOrReject(this, 3, reason);
};

/**
 * Flush pending callbacks.
 * [was: ye]
 */
g.y.ye = function () {
  let record; // was: Q
  while ((record = dequeueFirst(this))) {
    processEntry(this, record, this.state, this.J); // was: Xn(this, Q, this.W, this.J)
  }
  this.D = false; // was: this.D = !1
};

/**
 * Unhandled-rejection reporter reference.
 * [was: xu]
 */
const unhandledRejectionReporter = vS; // was: xu = vS

// CancellationError class defined in core/composition-helpers.js [was: eH]

// Timer class defined in core/timer.js [was: g.DE]

// =========================================================================
// StreamzBatcher   [was: cG, lines 62051-62080]
// =========================================================================

/**
 * Batches streamz metric submissions and flushes them periodically.
 *
 * [was: cG]
 */
export class StreamzBatcher extends Disposable { // was: cG extends g.qK
  /**
   * @param {Object} transport - Flush transport [was: Q]
   */
  constructor(transport) { // was: constructor(Q)
    super();

    /** @type {Object} [was: this.L] */
    this.transport = transport; // was: this.L = Q

    /** @type {number} Counter [was: this.K] */
    this.counter = 0; // was: this.K = 0

    /** @type {number} Max batch size [was: this.A] */
    this.maxBatchSize = 100; // was: this.A = 100

    /** @type {boolean} Isolated payload mode [was: this.D] */
    this.isolatedMode = false; // was: this.D = !1

    /** @type {Map} Pending metrics [was: this.O] */
    this.pendingMetrics = new Map(); // was: this.O = new Map

    /** @type {Set} Active metric keys [was: this.J] */
    this.activeKeys = new Set(); // was: this.J = new Set

    /** @type {number} Flush interval in ms [was: this.flushInterval] */
    this.flushInterval = 30000; // was: this.flushInterval = 3E4

    /** @type {g.DE} Flush timer [was: this.W] */
    this.flushTimer = new Timer(this.flushInterval); // was: this.W = new g.DE(this.flushInterval)
    this.flushTimer.listen("tick", this.flush_, false, this);
    registerDisposable(this, this.flushTimer);
  }

  /**
   * Enable isolated-payload mode (single-item batches).
   * [was: sendIsolatedPayload]
   * @param {boolean} enabled [was: Q]
   */
  sendIsolatedPayload(enabled) { // was: sendIsolatedPayload(Q)
    this.isolatedMode = enabled; // was: this.D = Q
    this.maxBatchSize = 1;
  }

  /**
   * Flush all pending metrics to the transport.
   * [was: j]
   */
  flush_() { // was: j()
    const batches = [...this.pendingMetrics.values()].filter(
      (batch) => batch.entries.size // was: c.W.size
    );
    if (batches.length) {
      this.transport.flush(batches, this.isolatedMode);
    }
    clearAllMetrics(batches);
    this.counter = 0;
    if (this.flushTimer.enabled) this.flushTimer.stop();
  }

  /**
   * Record a streamz metric.
   * [was: Y3]
   * @param {string} path [was: Q]
   * @param {number} value [was: c]
   * @param {...*} labels [was: W]
   */
  recordMetric(path, value, ...labels) { // was: Y3(Q, c, ...W)
    const metric = s_(this, path); // was: Q = s_(this, Q)
    if (metric && metric instanceof NA) {
      metric.getExperimentNumber(value, labels);
      E_(this);
    }
  }
}

// =========================================================================
// RpcError   [was: fZ, lines 62082-62095]
// =========================================================================

/**
 * gRPC-style error with numeric status code and metadata.
 *
 * [was: fZ]
 */
export class RpcError extends Error { // was: fZ extends Error
  /**
   * @param {number} code - gRPC status code [was: Q]
   * @param {string} message - Error message [was: c]
   * @param {Object} [metadata={}] - Response metadata [was: W]
   */
  constructor(code, message, metadata = {}) { // was: constructor(Q, c, W={})
    super(message);

    /** @type {number} */
    this.code = code; // was: this.code = Q

    /** @type {Object} */
    this.metadata = metadata; // was: this.metadata = W

    this.name = "RpcError";
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Human-readable representation including status code name.
   * [was: toString]
   * @returns {string}
   */
  toString() { // was: toString()
    let str = `RpcError(${grpcStatusName(this.code) || String(this.code)})`; // was: Q
    if (this.message) str += ": " + this.message;
    return str;
  }
}

// =========================================================================
// JSON serialiser escape table   [was: wV, O_, mnK, lines 62097-62114]
// =========================================================================

/**
 * JSON serialiser's `Eg` method (serialize to string).
 * [was: wV.prototype.Eg]
 */
wV.prototype.Eg = function (value) { // was: Eg(Q)
  const parts = []; // was: c
  jH(this, value, parts);
  return parts.join("");
};

/**
 * JSON character escape map.
 * [was: O_]
 */
export const JSON_ESCAPE_MAP = { // was: O_
  '"': '\\"',
  "\\": "\\\\",
  "/": "\\/",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
  "\v": "\\u000b",
};

/**
 * Regex for characters that need escaping in JSON strings.
 * [was: mnK]
 * @type {RegExp}
 */
export const JSON_ESCAPE_REGEX = /\uffff/.test("\uffff")
  ? /[\\"\x00-\x1f\x7f-\uffff]/g
  : /[\\"\x00-\x1f\x7f-\xff]/g; // was: mnK

// =========================================================================
// XHR factory / XhrIo   [was: vJ, BF7, g.aY, lines 62115-62249]
// =========================================================================

// DefaultXmlHttpFactory class defined in core/event-registration.js [was: vJ]
// XhrIo class defined in network/request.js [was: g.aY]

/** @type {*} [was: BF7] */
let xhrFactorySingleton = new DefaultXmlHttpFactory(); // was: BF7 = new vJ

/** @type {RegExp} Accepted URL schemes [was: oGO] */
const ACCEPTED_SCHEMES = /^https?$/i; // was: oGO

/** @type {string[]} Methods that accept a body [was: x0W] */
const BODY_METHODS = ["POST", "PUT"]; // was: x0W

/** @type {Array} Active XhrIo instances [was: GQ] */
const activeXhrInstances = []; // was: GQ

// =========================================================================
// SimpleHttpSender   [was: Pmd, lines 62250-62264]
// =========================================================================

/**
 * Minimal HTTP sender that wraps XhrIo for simple request/response flows.
 *
 * [was: Pmd]
 */
export class SimpleHttpSender { // was: Pmd
  /**
   * Send an HTTP request.
   *
   * [was: send]
   * @param {Object} request - { url, requestType, body, requestHeaders, timeoutMillis, withCredentials }
   * @param {Function} [onSuccess] - Success callback receiving the parsed response
   * @param {Function} [onError] - Error callback receiving the HTTP status
   */
  send(request, onSuccess = () => {}, onError = () => {}) { // was: send(Q, c, W)
    TjW(
      request.url,
      (event) => { // was: m => { ... }
        const xhr = event.target; // was: m = m.target
        if (zQ(xhr)) {
          onSuccess(getResponseText(xhr));
        } else {
          onError(xhr.getStatus());
        }
      },
      request.requestType,
      request.body,
      request.requestHeaders,
      request.timeoutMillis,
      request.withCredentials
    );
  }

  /**
   * Returns the transport type identifier.
   * [was: oa]
   * @returns {number}
   */
  getTransportType() { // was: oa()
    return 1;
  }
}
