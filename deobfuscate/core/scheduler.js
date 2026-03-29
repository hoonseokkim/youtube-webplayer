import { isExperimentEnabled } from '../features/experiment-flags.js'; // was: g.P
import { getObjectByPath } from './type-helpers.js'; // was: g.DR
import { safeSetTimeout } from '../data/idb-transactions.js'; // was: g.zn
import { getServiceLocator } from './attestation.js'; // was: g.SL
import { NativeDeferred } from './event-registration.js'; // was: g.id
import { safeClearTimeout } from '../data/idb-transactions.js'; // was: g.JB
import { filter, every, splice } from './array-utils.js';
import { forEach } from './event-registration.js';
import { buildListenerExecutor } from '../data/gel-core.js';
import { logStateTransition } from '../data/gel-core.js';
import { cancelAllLifecycleJobs } from '../data/gel-core.js';
// TODO: resolve g.zn (setTimeout wrapper, likely from a timer/scheduling utility)
// TODO: resolve g.SL (getServiceLocator / getScheduler singleton)
// TODO: resolve g.id (Deferred class)
// NOTE: g.YF (globalScheduler) is defined at the bottom of this file

/**
 * Scheduler — state machine, job scheduling, and callback orchestration.
 *
 * Deobfuscated from: player_es6.vflset/en_US/base.js
 *   Performance tracing:
 *     yp        (getTraceBackend)        line ~14457
 *     SI        (traceBegin)             line ~14461
 *     uV0       (traceEnd)              line ~14477
 *   Job queue helpers:
 *     hK0       (reprioritizeJobs)       line ~14496
 *     Cy3       (logTransition)          line ~14504
 *     kOX       (buildPluginHandler)     line ~14510
 *     Mj3       (runHighPriorityAsync)   line ~14523
 *     JQR       (scheduleNormalJobs)     line ~14547
 *     RKO       (runHighPrioritySync)    line ~14560
 *     Fx        (markCallbackStart)      line ~14571
 *     sp        (markCallbackEnd)        line ~14575
 *     Zu        (safeInvoke)             line ~14579
 *   Scheduler singleton:
 *     HUy       (addImmediateJob)        line ~12242
 *     g.SL      (getScheduler)           line ~12247
 *     ND        (addJob)                 line ~12252
 *     g.iK      (scheduleJob)            line ~12238
 *   Module-level variables:
 *     iE        (windowRef)              line ~68999
 *     dr        (isMonitoringEnabled)    line ~69000
 *     zK7       (isLifecycleLogging)     line ~69001
 *   Classes:
 *     YS7       (DeferredJobBatch)       lines ~69002-69029
 *     ix0       (StateMachine)           lines ~69031-69068
 *     pkK       (LifecycleStateMachine)  lines ~69070-69105
 *     yg        (SchedulerProxy)         lines ~67183-67198
 */

// ---------------------------------------------------------------------------
// Performance Tracing
// ---------------------------------------------------------------------------

/**
 * Detect the available tracing backend.
 *
 * @returns {number} 1 = Cobalt (h5vcc), 2 = Performance API, 0 = none
 */
/* was: yp */
export function getTraceBackend() { // was: yp
  if ("h5vcc" in window && window.h5vcc.traceEvent?.traceBegin && window.h5vcc.traceEvent?.traceEnd) {
    return 1;
  }
  if ("performance" in window && window.performance.mark && window.performance.measure) {
    return 2;
  }
  return 0;
}

/**
 * Whether lifecycle monitoring is enabled (set by feature flag + tracing availability).
 * @type {boolean}
 */
/* was: dr */
let isMonitoringEnabled = false; // set at module init; see initMonitoring()

/**
 * Whether lifecycle transition logging is enabled (set by feature flag).
 * @type {boolean}
 */
/* was: zK7 */
let isLifecycleLogging = false; // set at module init; see initMonitoring()

/**
 * Begin a performance trace span for a named section.
 *
 * @param {string} name - Label for the trace span.
 */
/* was: SI */
export function traceBegin(name) { // was: SI
  const backend = getTraceBackend(); // was: c → inlined yp()
  switch (backend) {
    case 1:
      window.h5vcc.traceEvent.traceBegin("YTLR", name);
      break;
    case 2:
      window.performance.mark(`${name}-start`);
      break;
    case 0:
      break;
    default:
      throwUnexpected(backend, "unknown trace type"); // was: cb
  }
}

/**
 * End a performance trace span for a named section.
 *
 * @param {string} name - Label for the trace span (must match a prior traceBegin call).
 */
/* was: uV0 */
export function traceEnd(name) { // was: uV0
  const backend = getTraceBackend(); // was: c → inlined yp()
  switch (backend) {
    case 1:
      window.h5vcc.traceEvent.traceEnd("YTLR", name);
      break;
    case 2: {
      const startMark = `${name}-start`; // was: c
      const endMark = `${name}-end`; // was: W
      window.performance.mark(endMark);
      window.performance.measure(name, startMark, endMark);
      break;
    }
    case 0:
      break;
    default:
      throwUnexpected(backend, "unknown trace type"); // was: cb
  }
}

/**
 * Throw an error for exhaustiveness checks in switch statements.
 *
 * @param {*} value
 * @param {string} [message]
 * @throws {Error}
 */
/* was: cb */
function throwUnexpected(value, message = `unexpected value ${value}!`) { // was: cb
  throw Error(message);
}

// ---------------------------------------------------------------------------
// Callback Tracing Helpers
// ---------------------------------------------------------------------------

/**
 * Mark the start of a callback execution (if monitoring enabled).
 *
 * @param {string} name - Callback/handler name for the trace span.
 */
/* was: Fx */
function markCallbackStart(name) { // was: Fx
  if (isMonitoringEnabled && name) {
    traceBegin(name); // was: SI(Q)
  }
}

/**
 * Mark the end of a callback execution (if monitoring enabled).
 *
 * @param {string} name - Callback/handler name for the trace span.
 */
/* was: sp */
function markCallbackEnd(name) { // was: sp
  if (isMonitoringEnabled && name) {
    traceEnd(name); // was: uV0(Q)
  }
}

// ---------------------------------------------------------------------------
// Safe Invocation
// ---------------------------------------------------------------------------

/**
 * Safely invoke a callback, catching errors and forwarding them to `window.onerror`
 * unless the error-handling killswitch is active.
 *
 * @param {Function} fn - Zero-arg callback to invoke.
 * @returns {*} The return value of `fn`, or `undefined` if an error was caught.
 */
/* was: Zu */
export function safeInvoke(fn) { // was: Zu
  if (isExperimentEnabled("web_lifecycle_error_handling_killswitch")) {
    return fn();
  }
  try {
    return fn();
  } catch (err) { // was: c
    window.onerror?.(err.message, "", 0, 0, err);
  }
}

// ---------------------------------------------------------------------------
// Job Scheduling Primitives
// ---------------------------------------------------------------------------

/**
 * Add an immediate job to the scheduler (no delay, highest priority).
 *
 * Falls back to direct invocation if no scheduler instance is registered.
 *
 * @param {Function} fn - The job callback.
 */
/* was: HUy */
export function addImmediateJob(fn) { // was: HUy
  const addImmediate = getObjectByPath("yt.scheduler.instance.addImmediateJob"); // was: c
  if (addImmediate) {
    addImmediate(fn);
  } else {
    fn();
  }
}

/**
 * Add a job to the scheduler with a given priority, optionally delayed.
 *
 * Falls back to direct invocation (priority-0) or `g.zn` (setTimeout wrapper)
 * if no scheduler instance is registered.
 *
 * @param {Function} fn        - The job callback.        [was: Q]
 * @param {number}   priority  - Scheduler priority level. [was: c]
 * @param {number}   [delay]   - Optional delay in ms.     [was: W]
 * @returns {number} A job ID (or NaN if executed immediately).
 */
/* was: ND */
export function addJob(fn, priority, delay) { // was: ND
  if (delay !== undefined && Number.isNaN(Number(delay))) {
    delay = undefined;
  }
  const addJobFn = getObjectByPath("yt.scheduler.instance.addJob"); // was: m
  if (addJobFn) {
    return addJobFn(fn, priority, delay);
  }
  if (delay === undefined) {
    fn();
    return NaN;
  }
  return safeSetTimeout(fn, delay || 0);
}

/**
 * Schedule a job at priority 0 with an optional delay.
 *
 * Convenience wrapper around {@link addJob}.
 *
 * @param {*}        _unused  - Ignored first argument (always 0 in source). [was: Q]
 * @param {Function} fn       - The job callback.                             [was: c]
 * @param {number}   [delay]  - Optional delay in ms.                         [was: W]
 * @returns {number} A job ID.
 */
/* was: g.iK */
export function scheduleJob(_unused, fn, delay) { // was: g.iK
  return addJob(fn, 0, delay);
}

// ---------------------------------------------------------------------------
// High-Priority Callback Execution
// ---------------------------------------------------------------------------

/**
 * Run high-priority (priority === 10) callbacks **asynchronously**, one at a time.
 *
 * Each callback is wrapped with tracing (markCallbackStart / markCallbackEnd)
 * and safe invocation. If the callback returns a thenable, it is awaited before
 * proceeding to the next one.
 *
 * @param {Array<{name: string, callback: Function}>} handlers - Ordered list of handlers. [was: Q]
 * @param {...*} args - Arguments forwarded to each callback.                               [was: c]
 */
/* was: Mj3 */
async function runHighPriorityAsync(handlers, ...args) { // was: Mj3
  getServiceLocator(); // ensure scheduler is initialised
  for (const handler of handlers) { // was: W
    let pendingPromise; // was: m
    addImmediateJob(() => { // was: HUy
      markCallbackStart(handler.name); // was: Fx
      const result = safeInvoke(() => handler.callback(...args)); // was: K = Zu(…)
      if (isThenable(result)) { // was: Ep(K)
        pendingPromise = isExperimentEnabled("web_lifecycle_error_handling_killswitch")
          ? result.then(() => {
              markCallbackEnd(handler.name); // was: sp
            })
          : result.then(
              () => {
                markCallbackEnd(handler.name);
              },
              (err) => { // was: T
                window.onerror?.(err.message, "", 0, 0, err);
                markCallbackEnd(handler.name);
              }
            );
      } else {
        markCallbackEnd(handler.name);
      }
    });
    if (pendingPromise) {
      await pendingPromise;
    }
  }
}

/**
 * Run high-priority callbacks **synchronously** (one after another, no awaiting).
 *
 * @param {Array<{name: string, callback: Function}>} handlers - Ordered list of handlers. [was: Q]
 * @param {...*} args - Arguments forwarded to each callback.                               [was: c]
 */
/* was: RKO */
function runHighPrioritySync(handlers, ...args) { // was: RKO
  getServiceLocator(); // ensure scheduler is initialised
  for (const handler of handlers) { // was: W
    addImmediateJob(() => { // was: HUy
      markCallbackStart(handler.name); // was: Fx
      safeInvoke(() => handler.callback(...args)); // was: Zu
      markCallbackEnd(handler.name); // was: sp
    });
  }
}

// ---------------------------------------------------------------------------
// Deferred / Scheduled Job Batching
// ---------------------------------------------------------------------------

/**
 * Schedule normal-priority (priority !== 10) callbacks as deferred jobs via
 * the scheduler. Each callback is wrapped with tracing and safe invocation.
 *
 * The resulting {@link DeferredJobBatch} is stored on the state machine context
 * so it can be cancelled on the next transition.
 *
 * @param {object}                                     context  - State machine instance. [was: Q]
 * @param {Array<{name: string, callback: Function, priority?: number}>} handlers
 *   List of handlers to schedule.                                                        [was: c]
 * @param {...*} args - Arguments forwarded to each callback.                              [was: W]
 */
/* was: JQR */
function scheduleNormalJobs(context, handlers, ...args) { // was: JQR
  const jobs = handlers.map((handler) => ({ // was: c = c.map(m => …)
    task: () => { // was: Fk
      markCallbackStart(handler.name); // was: Fx
      safeInvoke(() => handler.callback(...args)); // was: Zu
      markCallbackEnd(handler.name); // was: sp
    },
    priority: context.priorityOverride ?? handler.priority ?? 0, // was: Q.O ?? m.priority
  }));
  if (jobs.length) {
    context.pendingBatch = new DeferredJobBatch(jobs); // was: Q.A = new YS7(c)
  }
}

// ---------------------------------------------------------------------------
// Plugin Handler Builder
// ---------------------------------------------------------------------------

/**
 * Build a composite handler from plugin hooks for a given state transition.
 *
 * High-priority handlers (priority === 10) are run first (sync or async depending
 * on `context.options.hpF`). Normal-priority handlers are then scheduled as
 * deferred jobs via the scheduler.
 *
 * @param {object} context                           - The state machine instance.         [was: Q]
 * @param {Array<{name: string, callback: Function, priority?: number}>} pluginHandlers
 *   Plugin hooks collected for the target state.                                          [was: c]
 * @returns {Function} A composite handler that accepts arbitrary arguments.
 */
/* was: buildListenerExecutor */
export function buildPluginHandler(context, pluginHandlers) { // was: kOX
  const highPriority = pluginHandlers.filter( // was: W
    (handler) => (context.priorityOverride ?? handler.priority ?? 0) === 10 // was: K
  );
  const normalPriority = pluginHandlers.filter( // was: m
    (handler) => (context.priorityOverride ?? handler.priority ?? 0) !== 10
  );

  if (context.options.hpF) { // was: Q.j.hpF — async handler orchestration enabled
    return async (...args) => { // was: K
      await runHighPriorityAsync(highPriority, ...args); // was: Mj3
      scheduleNormalJobs(context, normalPriority, ...args); // was: JQR
    };
  }

  return (...args) => { // was: K
    runHighPrioritySync(highPriority, ...args); // was: RKO
    scheduleNormalJobs(context, normalPriority, ...args); // was: JQR
  };
}

// ---------------------------------------------------------------------------
// State Transition Logging
// ---------------------------------------------------------------------------

/**
 * Log a state machine transition to the console (when lifecycle monitoring
 * is enabled). Uses `console.groupCollapsed` for clean DevTools output.
 *
 * @param {object} machine  - The state machine instance.           [was: Q]
 * @param {string} toState  - Target state name.                     [was: c]
 * @param {*}      message  - The message/event triggering the move. [was: W]
 */
/* was: logStateTransition */
export function logTransition(machine, toState, message) { // was: Cy3
  if (isLifecycleLogging && console.groupCollapsed && console.groupEnd) {
    console.groupCollapsed(
      `[${machine.constructor.name}] '${machine.state}' to '${toState}'`
    );
    console.log("with message: ", message);
    console.groupEnd();
  }
}

// ---------------------------------------------------------------------------
// Reprioritize (cancel + reschedule at priority 10)
// ---------------------------------------------------------------------------

/**
 * Cancel all pending jobs in a {@link DeferredJobBatch} and re-add them at
 * priority 10 so they run sooner.
 *
 * @param {DeferredJobBatch} batch - The batch whose jobs should be reprioritised. [was: Q]
 */
/* was: cancelAllLifecycleJobs */
export function reprioritizeJobs(batch) { // was: hK0
  const sortedKeys = Array.from(batch.jobs.keys()).sort( // was: c
    (a, b) => (batch.jobs[b].priority ?? 0) - (batch.jobs[a].priority ?? 0) // was: W, m
  );
  for (const key of sortedKeys) { // was: W
    const job = batch.jobs[key]; // was: c (reused)
    if (job.jobId !== undefined && !job.completed) { // was: c.jobId === void 0 || c.RC
      batch.scheduler.cancelJob(job.jobId); // was: Q.scheduler.Q$(c.jobId)
      addJob(job.task, 10); // was: ND(c.Fk, 10)
    }
  }
}

// ---------------------------------------------------------------------------
// DeferredJobBatch
// ---------------------------------------------------------------------------

/**
 * A batch of deferred jobs registered with the scheduler. Each job is
 * individually tracked by ID and marked completed when it finishes.
 * The batch exposes a `promise` (via Deferred / g.id) that resolves once
 * **all** jobs in the batch have completed (or been cancelled).
 *
 * @class
 */
/* was: YS7 */
export class DeferredJobBatch { // was: YS7
  /**
   * @param {Array<{task: Function, priority?: number}>} jobDescriptors
   *   Each descriptor has a `task` (was: Fk) callback and optional `priority`.
   */
  constructor(jobDescriptors) { // was: Q
    /** @type {object} Scheduler singleton reference. */
    this.scheduler = getServiceLocator(); // was: g.SL()

    /** @type {NativeDeferred} Deferred that resolves when all jobs finish. [was: this.O] */
    this.deferred = new NativeDeferred(); // was: this.O = new g.id

    /** @type {Array<object>} Tracked job entries. [was: this.W] */
    this.jobs = jobDescriptors; // was: this.W = Q

    for (let i = 0; i < this.jobs.length; i++) { // was: c
      const descriptor = this.jobs[i]; // was: W

      const wrappedTask = () => { // was: Q (local)
        descriptor.task(); // was: W.Fk()
        this.jobs[i].completed = true; // was: this.W[c].RC = !0
        if (this.jobs.every((j) => j.completed === true)) { // was: K => K.RC === !0
          this.deferred.resolve(); // was: this.O.resolve()
        }
      };

      const jobId = addJob(wrappedTask, descriptor.priority ?? 0); // was: m = ND(Q, W.priority ?? 0)

      this.jobs[i] = {
        ...descriptor,
        task: wrappedTask, // was: Fk: Q
        jobId, // was: jobId: m
      };
    }
  }

  /**
   * Cancel all incomplete jobs and resolve the batch deferred immediately.
   */
  cancel() {
    for (const job of this.jobs) { // was: Q
      if (job.jobId !== undefined && !job.completed) { // was: Q.jobId === void 0 || Q.RC
        this.scheduler.cancelJob(job.jobId); // was: this.scheduler.Q$(Q.jobId)
      }
      job.completed = true; // was: Q.RC = !0
    }
    this.deferred.resolve(); // was: this.O.resolve()
  }
}

// ---------------------------------------------------------------------------
// StateMachine
// ---------------------------------------------------------------------------

/**
 * A generic finite state machine with plugin support.
 *
 * Subclasses define `this.transitions` — an array of `{ from, to, action }`
 * descriptors. Plugins can hook into state entries by exposing methods named
 * after each state.
 *
 * @class
 * @abstract
 */
/* was: ix0 */
export class StateMachine { // was: ix0
  constructor() {
    /**
     * Current state name.
     * @type {string}
     */
    this.state = "none";

    /**
     * Installed plugins. Each plugin is an object whose keys are state names
     * and values are handler functions.
     * @type {Array<object>}
     */
    this.plugins = [];

    /**
     * Priority override: when set, all plugin handlers run at this priority.
     * @type {number|undefined}
     * [was: this.O]
     */
    this.priorityOverride = undefined; // was: this.O

    /**
     * Configuration / options object.
     * @type {object}
     * [was: this.j]
     */
    this.options = {}; // was: this.j

    if (isMonitoringEnabled) {
      traceBegin(this.state); // was: SI(this.state)
    }
  }

  /**
   * Read-only accessor for the current state.
   * @returns {string}
   */
  get currentState() {
    return this.state;
  }

  /**
   * Register a plugin with the state machine.
   *
   * @param {object} plugin - A plugin object with state-name keyed handlers.
   * @returns {this}
   */
  install(plugin) { // was: Q
    this.plugins.push(plugin);
    return this;
  }

  /**
   * Remove one or more plugins.
   *
   * @param {...object} plugins - Plugins to remove.
   */
  uninstall(...plugins) { // was: Q
    plugins.forEach((plugin) => { // was: c
      const index = this.plugins.indexOf(plugin); // was: c (reused)
      if (index > -1) {
        this.plugins.splice(index, 1);
      }
    });
  }

  /**
   * Transition from the current state to `targetState`.
   *
   * Finds a matching transition descriptor, cancels any pending deferred job
   * batch, logs the transition, invokes the action with a built plugin handler,
   * and updates the current state.
   *
   * @param {string} targetState - The state to transition to.  [was: Q]
   * @param {*}      [message]   - Data associated with the transition. [was: c]
   * @throws {Error} If no valid transition exists from the current state.
   */
  transition(targetState, message) { // was: Q, c
    if (isMonitoringEnabled) {
      traceEnd(this.state); // was: uV0(this.state)
    }

    const descriptor = this.transitions.find((t) => // was: W, m
      Array.isArray(t.from)
        ? t.from.find((fromState) => fromState === this.state && t.to === targetState) // was: K
        : t.from === this.state && t.to === targetState
    );

    if (descriptor) {
      // Cancel any outstanding deferred job batch from the previous transition
      if (this.pendingBatch) { // was: this.A
        reprioritizeJobs(this.pendingBatch); // was: hK0(this.A)
        this.pendingBatch = undefined; // was: this.A = void 0
      }

      logTransition(this, targetState, message); // was: Cy3

      this.state = targetState;

      if (isMonitoringEnabled) {
        traceBegin(this.state); // was: SI(this.state)
      }

      const boundAction = descriptor.action.bind(this); // was: W (reused)
      const pluginHandlers = this.plugins // was: m
        .filter((plugin) => plugin[targetState]) // was: K
        .map((plugin) => plugin[targetState]); // was: K

      boundAction(buildPluginHandler(this, pluginHandlers), message); // was: kOX
    } else {
      throw Error(
        `no transition specified from ${this.state} to ${targetState}`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// LifecycleStateMachine
// ---------------------------------------------------------------------------

/**
 * The player lifecycle state machine. Manages transitions between
 * "none" (idle) and "application_navigating".
 *
 * Uses a timeout to auto-return to "none" if no explicit completion
 * transition occurs within 5 seconds.
 *
 * @class
 * @extends StateMachine
 */
/* was: pkK */
export class LifecycleStateMachine extends StateMachine { // was: pkK
  constructor() {
    super();

    /**
     * Timeout job ID for auto-returning to "none".
     * @type {number|null}
     * [was: this.W]
     */
    this.autoReturnTimerId = null; // was: this.W

    /**
     * Priority override for all plugin handlers.
     * @type {number}
     * [was: this.O]
     */
    this.priorityOverride = 10; // was: this.O = 10

    /**
     * Transition descriptors.
     * @type {Array<{from: string|string[], to: string, action: Function}>}
     */
    this.transitions = [
      {
        from: "none",
        to: "application_navigating",
        action: this.handleNavigating_, // was: this.K
      },
      {
        from: "application_navigating",
        to: "none",
        action: this.handleIdle_, // was: this.D
      },
      {
        from: "application_navigating",
        to: "application_navigating",
        action: () => {},
      },
      {
        from: "none",
        to: "none",
        action: () => {},
      },
    ];
  }

  /**
   * Enter the "application_navigating" state.
   *
   * Starts a 5-second timeout that will auto-transition back to "none"
   * if no explicit transition occurs.
   *
   * @param {Function} pluginHandler - Composite plugin handler.     [was: Q]
   * @param {object}   [eventData]   - The triggering event payload. [was: c]
   * @private
   */
  /* was: K */
  handleNavigating_(pluginHandler, eventData) { // was: K(Q, c)
    this.autoReturnTimerId = scheduleJob(0, () => { // was: this.W = g.iK(0, …, 5E3)
      if (this.currentState === "application_navigating") {
        this.transition("none");
      }
    }, 5000);
    pluginHandler(eventData?.event); // was: Q(c?.event)
  }

  /**
   * Return to the "none" (idle) state.
   *
   * Cancels the auto-return timeout if one is pending.
   *
   * @param {Function} pluginHandler - Composite plugin handler.     [was: Q]
   * @param {object}   [eventData]   - The triggering event payload. [was: c]
   * @private
   */
  /* was: D */
  handleIdle_(pluginHandler, eventData) { // was: D(Q, c)
    if (this.autoReturnTimerId) { // was: this.W
      globalScheduler.cancelJob(this.autoReturnTimerId); // was: g.YF.Q$(this.W)
      this.autoReturnTimerId = null; // was: this.W = null
    }
    pluginHandler(eventData?.event); // was: Q(c?.event)
  }
}

// ---------------------------------------------------------------------------
// Singleton (getLifecycleStateMachine)
// ---------------------------------------------------------------------------

/**
 * Cached singleton instance of the lifecycle state machine.
 * @type {LifecycleStateMachine|undefined}
 */
/* was: LL */
let lifecycleInstance; // was: LL

/**
 * Get (or create) the singleton lifecycle state machine instance.
 *
 * @returns {LifecycleStateMachine}
 */
/* was: Qk7 */
export function getLifecycleStateMachine() { // was: Qk7
  if (!lifecycleInstance) {
    lifecycleInstance = new LifecycleStateMachine(); // was: LL = new pkK
  }
  return lifecycleInstance;
}

// ---------------------------------------------------------------------------
// SchedulerProxy
// ---------------------------------------------------------------------------

/**
 * A thin proxy around the global scheduler instance.
 *
 * Delegates `cancelJob`, `start`, and `pause` to the registered
 * `yt.scheduler.instance.*` callbacks. Extends `UdW` (not yet deobfuscated).
 *
 * The global singleton is `g.YF = g.SL()`.
 *
 * @class
 * @extends UdW
 */
/* was: yg */
export class SchedulerProxy { // was: yg
  /**
   * Cancel a scheduled job by its ID.
   *
   * @param {number} jobId - The job ID returned by {@link addJob}. [was: Q]
   */
  cancelJob(jobId) { // was: Q$
    if (jobId === undefined || !Number.isNaN(Number(jobId))) {
      const cancelFn = getObjectByPath("yt.scheduler.instance.cancelJob"); // was: c
      if (cancelFn) {
        cancelFn(jobId);
      } else {
        safeClearTimeout(jobId); // fallback: clearTimeout
      }
    }
  }

  /**
   * Start the scheduler (enable job processing).
   */
  start() {
    const startFn = getObjectByPath("yt.scheduler.instance.start"); // was: Q
    if (startFn) {
      startFn();
    }
  }

  /**
   * Pause the scheduler (defer job processing).
   */
  pause() {
    const pauseFn = getObjectByPath("yt.scheduler.instance.pause"); // was: Q
    if (pauseFn) {
      pauseFn();
    }
  }
}

// ---------------------------------------------------------------------------
// Thenable Detection (used internally by runHighPriorityAsync)
// ---------------------------------------------------------------------------

/**
 * Check whether a value is a thenable (has a `.then` method).
 *
 * @param {*} value
 * @returns {boolean}
 */
/* was: Ep */
function isThenable(value) { // was: Ep
  return value != null && typeof value === "object" && typeof value.then === "function";
}

// ---------------------------------------------------------------------------
// Module-level Initialisation
// ---------------------------------------------------------------------------

/**
 * Initialise monitoring flags.  In the original source these are set at
 * module evaluation time based on feature flags:
 *
 *   var dr = isExperimentEnabled("web_enable_lifecycle_monitoring") && yp() !== 0;
 *   var zK7 = isExperimentEnabled("web_enable_lifecycle_monitoring");
 *
 * Call this after feature flags are available.
 */
export function initMonitoring() {
  isMonitoringEnabled = isExperimentEnabled("web_enable_lifecycle_monitoring") && getTraceBackend() !== 0; // was: dr
  isLifecycleLogging = isExperimentEnabled("web_enable_lifecycle_monitoring"); // was: zK7
}

/** Global scheduler singleton. [was: g.YF] */
export const globalScheduler = new SchedulerProxy();
