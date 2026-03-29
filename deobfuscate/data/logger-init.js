/**
 * logger-init.js -- Logger share/callback setup, telemetry sampling
 * configuration, and Promise-based logger completion handling.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~62265-62700
 *
 * Covers:
 *  - LatencyTimer (DB):          start/done pair for timing events
 *  - ShareableLogger (tU):       base class with ref-counting share()
 *  - NoOpLogger (WG):            silent/no-op logger implementation
 *  - LoggerProxy (qA7):          delegates all calls to an inner logger
 *  - FlushTimer (ncn):           periodic flush scheduling
 *  - MetricLogger (D00):         writes events/errors/latencies to metric sinks
 *  - AutoMetricLogger (AAm):     self-configuring MetricLogger with streamz sinks
 *  - createLogger (mu / eR3):    factory for the configured logger instance
 *  - performanceNow (Yu):        high-resolution timestamp helper
 *
 * Also covers the BotGuard / integrity token initialiser (HG) and the
 * challenge-response session manager (F8d), both of which wire a logger
 * via share-and-callback patterns.
 */

import { logError } from '../core/composition-helpers.js';  // was: g.Zp
import { NativeDeferred } from '../core/event-registration.js';  // was: g.id
import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { globalRef } from '../core/polyfills.js';  // was: g.IW
import { SharedDisposable } from './module-init.js'; // was: fNx
import { lookupByTime } from '../ads/ad-cue-delivery.js'; // was: bM
import { getExperimentNumber } from './idb-transactions.js'; // was: Y3
import { repeatedBytesReader } from '../proto/message-setup.js'; // was: M_
import { RpcError } from './event-logging.js'; // was: fZ
import { OnesieRequest } from '../media/onesie-request.js'; // was: j3
import { getBooleanAttr } from '../modules/caption/caption-internals.js'; // was: jO
import { buildLogDispatcher } from '../core/event-registration.js'; // was: IJd
import { FrsStreamzReporter } from './module-init.js'; // was: vvy
import { CecStreamzReporter } from './module-init.js'; // was: Pl7
import { EcStreamzReporter } from './module-init.js'; // was: Go_
import { ElStreamzReporter } from './module-init.js'; // was: $hK
import { WrlStreamzReporter } from './module-init.js'; // was: aN3
import { CscStreamzReporter } from './module-init.js'; // was: lNw
import { CtavStreamzReporter } from './module-init.js'; // was: uzw
import { CwscStreamzReporter } from './module-init.js'; // was: hN7
import { OdPStreamzReporter } from './module-init.js'; // was: zN7
import { OdNStreamzReporter } from './module-init.js'; // was: ClR
import { scheduleThrottledCallback } from '../core/event-registration.js'; // was: XBO
import { EXTENSION_GUARD } from '../proto/messages-core.js'; // was: xJ
import { isVideoVisible } from '../player/playback-state.js'; // was: zx
import { fetchAttestationChallenge } from '../network/uri-utils.js'; // was: SK
import { getActiveLayout } from '../ads/ad-scheduling.js'; // was: J1
import { createFadeTransition } from '../core/bitstream-helpers.js'; // was: iB
import { timedInvoke } from '../core/event-registration.js'; // was: pO
import { polyfillRegistry } from '../core/polyfills.js'; // was: Qn
import { resumeAttestation } from '../core/event-registration.js'; // was: EGW
import { ModuleError } from './module-init.js'; // was: g5
import { appendDisposeCallback } from '../core/event-registration.js'; // was: s_x
import { executeAttestation } from '../core/event-registration.js'; // was: vG
import { signRequest } from '../core/event-registration.js'; // was: $d
import { SessionStorageAdapter } from '../media/grpc-parser.js'; // was: ycx
import { dispose } from '../ads/dai-cue-range.js';
import { Disposable } from '../core/disposable.js';
import { concat, slice } from '../core/array-utils.js';
// TODO: resolve g.iD

// ── imports (from core layer) ────────────────────────────────────────────
// import { Disposable }  from '../core/disposable.js';   // was: g.qK
// import { Deferred }    from '../core/promise.js';       // was: g.id
// import { registerDisposable } from '../core/disposable.js'; // was: g.F

// =========================================================================
// Logger   [was: g.JY]
// =========================================================================

/**
 * Simple tag-based logger. [was: g.JY]
 */
export class Logger {
  constructor(tag) {
    this.tag = tag;
  }
}

/**
 * Log a warning message. [was: g.RX]
 */
export function logWarning(loggerOrTag, code, ...args) {
  const tag = loggerOrTag instanceof Logger ? loggerOrTag.tag : loggerOrTag;
  console.warn(`[${tag}]`, code, ...args);
}

// =========================================================================
// performanceNow   [was: Yu, line 7833]
// =========================================================================

/**
 * Returns a high-resolution timestamp in milliseconds.
 * Falls back to `Date.now()` when `performance.now` is unavailable.
 *
 * [was: Yu]
 * @returns {number}
 */
export const performanceNow = () => // was: Yu
  globalThis.performance?.now?.() ?? Date.now();

// =========================================================================
// LatencyTimer   [was: DB, lines 62265-62274]
// =========================================================================

/**
 * Lightweight timer that records the start time on construction and
 * reports elapsed duration to the logger on `.done()`.
 *
 * [was: DB]
 */
export class LatencyTimer { // was: DB
  /**
   * @param {ShareableLogger} logger - logger to report to   [was: Q]
   * @param {string}          event  - event key name         [was: c]
   */
  constructor(logger, event) { // was: constructor(Q, c)
    /** @type {ShareableLogger} [was: this.logger] */
    this.logger = logger; // was: this.logger

    /** @type {string} [was: this.event] */
    this.event = event; // was: this.event

    /** @type {number} [was: this.startTime] */
    this.startTime = performanceNow(); // was: Yu()
  }

  /**
   * Marks the operation as complete, reporting the elapsed time to the
   * logger's latency channel.
   *
   * [was: done]
   */
  done() { // was: done()
    this.logger.A(this.event, performanceNow() - this.startTime); // was: this.logger.A(this.event, Yu() - this.startTime)
  }
}

// =========================================================================
// ShareableLogger (base)   [was: tU, lines 62275-62282]
// =========================================================================

/**
 * Abstract base for loggers that support reference-counted sharing
 * (via `fNx.share()`). Each `.share()` increments a counter; each
 * `.dispose()` decrements it. The logger is actually disposed only
 * when the counter reaches zero.
 *
 * [was: tU extends fNx]
 */
export class ShareableLogger extends SharedDisposable { // was: tU
  constructor() {
    super(...arguments);

    /**
     * Configuration hooks exposed to the telemetry framework.
     * `bM` returns the sorted list of active experiment IDs.
     * @type {{ bM: () => number[] }}
     * [was: this.Rk]
     */
    this.hooks = { // was: this.Rk
      lookupByTime: () => [],
    };
  }
}

// =========================================================================
// NoOpLogger   [was: WG, lines 62283-62297]
// =========================================================================

/**
 * A logger that silently discards every call. Used when logging is
 * disabled or not yet initialised.
 *
 * [was: WG extends tU]
 */
export class NoOpLogger extends ShareableLogger { // was: WG
  /** Log snapshot size.          [was: j] */ logSnapshotSize() {}
  /** Log event count.            [was: W] */ logEvent() {}
  /** Log latency value.          [was: A] */ logLatency() {}
  /** Log error.                  [was: Lw] */ logError() {}
  /** Log payload size.           [was: L] */ logPayloadSize() {}
  /** Log RPC timing.             [was: J] */ logRpcTiming() {}
  /** Flush / finalise.           [was: O] */ flush() {}
  /**
   * Wrap an RPC promise (no-op passthrough).
   * [was: K]
   * @param {*} _svc [was: Q]
   * @param {*} _method [was: c]
   * @param {*} _metric [was: W]
   * @param {Promise} promise [was: m]
   * @returns {Promise}
   */
  wrapRpc(_svc, _method, _metric, promise) { return promise; } // was: K(Q, c, W, m)
  /** Log connection state.       [was: mF] */ logConnectionState() {}
  /** Log availability metric.    [was: D] */ logAvailability() {}
  /** Log write-success metric.   [was: Y] */ logWriteSuccess() {}
}

// =========================================================================
// LoggerProxy   [was: qA7, lines 62298-62345]
// =========================================================================

/**
 * Proxy that delegates all logging calls to an inner `logger` instance.
 * The inner logger can be hot-swapped via `update()`, which disposes the
 * old one and replaces it.
 *
 * Exposes the inner logger through `hooks.f50` so that callers with a
 * reference to the proxy can reach the concrete logger.
 *
 * [was: qA7 extends tU]
 */
export class LoggerProxy extends ShareableLogger { // was: qA7
  /**
   * @param {ShareableLogger} innerLogger - initial concrete logger [was: Q]
   */
  constructor(innerLogger) { // was: constructor(Q)
    super();

    /** @type {ShareableLogger} [was: this.logger] */
    this.logger = innerLogger; // was: this.logger

    this.hooks = { // was: this.Rk
      f50: () => this.logger,
      lookupByTime: () => this.logger.hooks.lookupByTime(), // was: this.logger.Rk.bM()
    };

    this.addOnDisposeCallback(() => void this.logger.dispose());
  }

  /**
   * Hot-swap the inner logger. The old logger is disposed.
   *
   * @param {ShareableLogger} newLogger [was: Q]
   * [was: update]
   */
  update(newLogger) { // was: update(Q)
    this.logger.dispose();
    this.logger = newLogger;
  }

  /** [was: W] */ logEvent(event) { this.logger.W(event); }
  /** [was: A] */ logLatency(event, durationMs) { this.logger.A(event, durationMs); }
  /** [was: Lw] */ logError(code) { this.logger.Lw(code); }
  /** [was: L] */ logPayloadSize(size) { this.logger.L(size); }
  /** [was: J] */ logRpcTiming(size, event) { this.logger.J(size, event); }
  /** [was: O] */ flush() { this.logger.O(); }
  /** [was: K] */ wrapRpc(svc, method, metric, promise) { return this.logger.K(svc, method, metric, promise); }
  /** [was: mF] */ logConnectionState(state) { this.logger.mF(state); }
  /** [was: D] */ logAvailability(value) { this.logger.D(value); }
  /** [was: Y] */ logWriteSuccess(value) { this.logger.Y(value); }
  /** [was: j] */ logSnapshotSize(size) { this.logger.j(size); }
}

// =========================================================================
// FlushTimer   [was: ncn, lines 62346-62354]
// =========================================================================

/**
 * Disposable timer that periodically invokes a flush callback.
 * The internal `W` counter tracks elapsed intervals, starting at
 * `-intervalMs` so the first flush is deferred.
 *
 * [was: ncn extends g.qK]
 */
export class FlushTimer extends Disposable { // was: ncn extends g.qK
  /**
   * @param {Function} callback    - flush function      [was: Q]
   * @param {number}   intervalMs  - interval in ms       [was: c]
   */
  constructor(callback, intervalMs) { // was: constructor(Q, c)
    super();

    /** @type {Function} [was: this.callback] */
    this.callback = callback; // was: this.callback

    /** @type {number} configured interval [was: this.O] */
    this.intervalMs = intervalMs; // was: this.O

    /** @type {number} elapsed accumulator (starts negative) [was: this.W] */
    this.elapsed = -intervalMs; // was: this.W

    this.addOnDisposeCallback(() => void clearTimeout(this.timer));
  }
}

// =========================================================================
// MetricLogger   [was: D00, lines 62355-62400]
// =========================================================================

/**
 * Concrete logger that writes telemetry events to a set of streamz
 * metric sinks. Each logging method forwards to the corresponding
 * streamz counter or distribution.
 *
 * [was: D00 extends tU]
 */
export class MetricLogger extends ShareableLogger { // was: D00
  /**
   * @param {Object} metrics      - collection of streamz sink instances [was: Q]
   * @param {string} metricPrefix - prefix / partition key               [was: c]
   */
  constructor(metrics, metricPrefix) { // was: constructor(Q, c)
    super();

    /** @type {Object} [was: this.metrics] */
    this.metrics = metrics; // was: this.metrics

    /** @type {string} [was: this.MP] */
    this.metricPrefix = metricPrefix; // was: this.MP
  }

  /** Log snapshot size to the M_ (snapshot-size) streamz. [was: j] */
  logSnapshotSize(size) { // was: j(Q)
    this.metrics.repeatedBytesReader.getExperimentNumber(size, this.metricPrefix); // was: this.metrics.M_.Y3(Q, this.MP)
  }

  /** Log an event count. [was: W] */
  logEvent(event) { // was: W(Q)
    this.metrics.eventCount.W(event, this.metricPrefix); // was: this.metrics.eventCount.W(Q, this.MP)
  }

  /** Log a latency value (ms). [was: A] */
  logLatency(event, durationMs) { // was: A(Q, c)
    this.metrics.xG.getExperimentNumber(durationMs, event, this.metricPrefix); // was: this.metrics.xG.Y3(c, Q, this.MP)
  }

  /** Log an error code. [was: Lw] */
  logError(code) { // was: Lw(Q)
    this.metrics.errorCount.W(code, this.metricPrefix); // was: this.metrics.errorCount.W(Q, this.MP)
  }

  /**
   * Wrap an RPC promise to record its latency and status code on
   * completion.
   *
   * [was: K]
   * @param {string}  serviceName - RPC service identifier   [was: Q]
   * @param {string}  methodName  - RPC method identifier    [was: c]
   * @param {string}  metricKey   - telemetry key            [was: W]
   * @param {Promise} promise     - the RPC promise          [was: m]
   * @returns {Promise}
   */
  wrapRpc(serviceName, methodName, metricKey, promise) { // was: K(Q, c, W, m)
    const startTime = performanceNow(); // was: Yu()
    const report = (statusCode) => { // was: T = r => { ... }
      if (!this.isDisposed()) { // was: this.u0()
        const elapsed = performanceNow() - startTime; // was: Yu() - K
        this.metrics.AK.getExperimentNumber(elapsed, serviceName, metricKey, statusCode, methodName, this.metricPrefix);
      }
    };
    promise.then(
      () => void report(0),
      (err) => void report(err instanceof RpcError ? err.code : -1) // was: fZ — RpcError
    );
    return promise;
  }

  /** Log connection-state metric. [was: mF] */
  logConnectionState(state) { // was: mF(Q)
    this.metrics.Mk.W(state, this.metricPrefix); // was: this.metrics.Mk.W(Q, this.MP)
  }

  /** Log availability metric. [was: D] */
  logAvailability(value) { // was: D(Q)
    this.metrics.Ao.W(value, this.metricPrefix); // was: this.metrics.Ao.W(Q, this.MP)
  }

  /** Log write-success metric. [was: Y] */
  logWriteSuccess(value) { // was: Y(Q)
    this.metrics.OnesieRequest.W(value, this.metricPrefix); // was: this.metrics.j3.W(Q, this.MP)
  }

  /** Log payload size. [was: L] */
  logPayloadSize(size) { // was: L(Q)
    this.metrics.payloadSize.getExperimentNumber(size, this.metricPrefix); // was: this.metrics.payloadSize.Y3(Q, this.MP)
  }

  /** Log RPC timing. [was: J] */
  logRpcTiming(size, event) { // was: J(Q, c)
    this.metrics.QT.getExperimentNumber(event, size, this.metricPrefix); // was: this.metrics.QT.Y3(c, Q, this.MP)
  }
}

// =========================================================================
// AutoMetricLogger   [was: AAm, lines 62401-62442]
// =========================================================================

/**
 * Self-configuring `MetricLogger` that creates its own streamz service
 * and metric sinks from a configuration object.
 *
 * Configuration shape (fields resolved from `options`):
 *   - `MP`  — metric prefix (default `"_"`)
 *   - `Av`  — base experiment ID list
 *   - `jO`  — flush interval (ms) for the `FlushTimer`
 *   - `Yo`  — streamz destination / exporter
 *   - `Oy`  — error-reporting callback
 *   - `wY`  — optional service factory override
 *
 * [was: AAm extends D00]
 */
export class AutoMetricLogger extends MetricLogger { // was: AAm
  /**
   * @param {Object}   config           - raw configuration object   [was: Q]
   * @param {number[]} [extraExpIds=[]] - additional experiment IDs  [was: c]
   */
  constructor(config, extraExpIds = []) { // was: constructor(Q, c=[])
    /** Resolved options with defaults. [was: W] */
    const options = { // was: W
      MP: config.MP || '_',                                            // was: Q.MP || "_"
      Av: config.Av || [],                                             // was: Q.Av || []
      getBooleanAttr: config.getBooleanAttr | 0,                                              // was: Q.jO | 0
      Yo: config.Yo,                                                   // was: Q.Yo
      Oy: config.Oy || (() => {}),                                     // was: Q.Oy || (() => {})
      wY: config.wY || ((id, ids) => buildLogDispatcher(id, ids, options.Oy, options.Yo)), // was: Q.wY || ((K, T) => IJd(K, T, W.Oy, W.Yo))
    };

    const service = options.wY('53', options.Av.concat(extraExpIds)); // was: W.wY("53", W.Av.concat(c))

    super(
      {
        repeatedBytesReader:         new FrsStreamzReporter(service),    // was: new vvy(m) — snapshot-size streamz
        errorCount: new CecStreamzReporter(service),    // was: new Pl7(m) — cumulative error counter
        eventCount: new EcStreamzReporter(service),    // was: new Go_(m) — event counter
        xG:         new ElStreamzReporter(service),    // was: new $hK(m) — latency distribution
        AK:         new WrlStreamzReporter(service),    // was: new aN3(m) — RPC latency distribution
        Mk:         new CscStreamzReporter(service),    // was: new lNw(m) — connection-state counter
        Ao:         new CtavStreamzReporter(service),    // was: new uzw(m) — availability counter
        OnesieRequest:         new CwscStreamzReporter(service),    // was: new hN7(m) — write-success counter
        payloadSize: new OdPStreamzReporter(service),   // was: new zN7(m) — payload-size distribution
        QT:         new OdNStreamzReporter(service),    // was: new ClR(m) — RPC timing distribution
      },
      options.MP,
    );

    /**
     * Configuration hooks — returns sorted union of base + extra IDs.
     * @type {{ bM: () => number[] }}
     * [was: this.Rk]
     */
    this.hooks = { // was: this.Rk
      lookupByTime: () => this.options.Av.concat(this.extraExpIds).sort((a, b) => a - b),
    };

    /** @type {Object} resolved configuration [was: this.options] */
    this.options = options; // was: this.options

    /** @type {Object} streamz service instance [was: this.service] */
    this.service = service; // was: this.service

    /** @type {boolean} whether we own the service (should dispose it) [was: this.T2] */
    this.ownsService = !config.wY; // was: this.T2 = !Q.wY

    /** @type {FlushTimer} periodic flush timer [was: this.S] */
    this.flushTimer = new FlushTimer( // was: new ncn(...)
      () => void this.service.j(), // was: () => void this.service.j()
      options.getBooleanAttr,
    );

    this.addOnDisposeCallback(() => {
      this.flushTimer.dispose();
      if (this.ownsService) {
        this.service.dispose();
      }
    });

    /**
     * Extra experiment IDs (sorted on use).
     * @type {number[]}
     * [was: this.Ie]
     */
    this.extraExpIds = extraExpIds.slice(); // was: c.slice()
    g.iD(this.extraExpIds); // was: g.iD(this.Ie) — sort in-place
  }

  /**
   * Trigger a flush of the underlying timer.
   * [was: O]
   */
  flush() { // was: O()
    scheduleThrottledCallback(this.flushTimer); // was: XBO(this.S)
  }
}

// =========================================================================
// createLogger / createLoggerFromConfig   [was: eR3, mu, lines 7829-7849]
// =========================================================================

/**
 * Low-level factory: creates a new `AutoMetricLogger`.
 *
 * [was: eR3]
 * @param {Object}   options    - logger options   [was: Q]
 * @param {number[]} [expIds]   - experiment IDs   [was: c]
 * @returns {AutoMetricLogger}
 */
export const createLogger = (options, expIds = []) => // was: eR3
  new AutoMetricLogger(options, expIds);

/**
 * High-level factory: resolves a telemetry-sampling configuration object
 * into a logger. Returns a `NoOpLogger` when `config.disable` is truthy.
 *
 * Configuration fields consumed:
 *   - `disable` — skip logging entirely
 *   - `MP`      — metric prefix
 *   - `Pg`      — base experiment ID proto field
 *   - `IS`      — flush interval
 *   - `Yo`      — streamz exporter
 *   - `Oy`      — error callback
 *   - `wY`      — optional service factory
 *
 * @param {Object}       config         - sampling / feature-flag config [was: Q]
 * @param {?HiO}         [challengeMsg] - optional challenge proto       [was: c]
 * @returns {NoOpLogger|AutoMetricLogger}
 *
 * [was: mu]
 */
export const createLoggerFromConfig = (config, challengeMsg) => { // was: mu
  if (config.disable) {
    return new NoOpLogger(); // was: new WG
  }
  const expIds = challengeMsg ? fd(challengeMsg) : []; // was: c ? fd(c) : []
  return createLogger(
    {
      MP: config.MP,       // was: Q.MP
      Av: config.Pg,       // was: Q.Pg — "base experiment IDs from proto"
      getBooleanAttr: config.IS,       // was: Q.IS — "flush interval"
      Yo: config.Yo,       // was: Q.Yo
      Oy: config.Oy,       // was: Q.Oy
      wY: config.wY,       // was: Q.wY
    },
    expIds,
  );
};

// =========================================================================
// BotGuard / Integrity-Token Initialiser   [was: HG, lines 62488-62612]
// =========================================================================

/**
 * Manages the initialisation of a BotGuard / integrity-token program.
 *
 * Lifecycle:
 *  1. Constructor receives a challenge config (either a proto message or
 *     a `{ program, globalName }` pair).
 *  2. A shared logger is created via `createLoggerFromConfig`.
 *  3. The BotGuard program is loaded from `globalThis[globalName].a(...)`.
 *  4. On completion, a `Deferred` (`this.readyPromise`) resolves with
 *     `{ TC, zx, jP, mI2 }` — the token-creator, dispose fn, event
 *     callback, and metadata.
 *  5. `snapshot()` waits for readiness, then invokes `TC` to produce
 *     a token.
 *
 * Telemetry sampling:
 *  - Random sampling counter (`this.samplingCounter`) starts at a random
 *    value 0-199.  "k"-type telemetry events are only emitted when the
 *    counter reaches 0, at which point it resets to a new random 0-199.
 *  - "h" (success) and "u" (update) events are always emitted when
 *    `retryCount !== 0`.
 *
 * [was: HG extends g.qK]
 */
export class BotGuardInitialiser extends Disposable { // was: HG
  /**
   * @param {Object} config - configuration with `challenge`, `SK`, `mS`,
   *                          or `program`/`globalName` fields [was: Q]
   */
  constructor(config) { // was: constructor(Q)
    super();

    /**
     * Random sampling counter for throttling "k" (keep-alive) telemetry.
     * @type {number}
     * [was: this.O]
     */
    this.samplingCounter = Math.floor(Math.random() * 200); // was: this.O

    /** Challenge-response message (HiO proto). [was: this.W] */
    this.challengeMessage = new HiO(); // was: new HiO

    let program; // was: c
    let globalName; // was: W (re-used below)

    if ('challenge' in config && tim(config.challenge)) {
      program = Ve(config.challenge, 4, undefined, EXTENSION_GUARD);
      globalName = Ve(config.challenge, 5, undefined, EXTENSION_GUARD);
      const configField7 = Ve(config.challenge, 7, undefined, EXTENSION_GUARD);
      if (configField7) {
        this.challengeMessage = NFd(configField7); // was: NFd(Ve(...))
      }
    } else {
      ({ program, globalName } = config);
    }

    this.addOnDisposeCallback(async () => {
      const { isVideoVisible: disposeFn } = await this.readyPromise; // was: A
      disposeFn?.();
    });

    /** @type {LoggerProxy} [was: this.logger] */
    this.logger = createLoggerFromConfig(config.fetchAttestationChallenge || {}, this.challengeMessage); // was: mu(Q.SK || {}, this.W)
    registerDisposable(this, this.logger); // register for cascading disposal

    const deferred = new NativeDeferred(); // was: m
    /** @type {Promise<{TC, zx, jP, mI2}>} [was: this.A] */
    this.readyPromise = deferred.promise; // was: this.A = m.promise

    // -- begin initialisation telemetry --
    this.logger.W('t'); // was: this.logger.W("t")
    const sharedLogger = this.logger.share(); // was: K
    const initTimer = new LatencyTimer(sharedLogger, 't'); // was: T

    /**
     * Sampling callback invoked by the BotGuard runtime on each
     * keep-alive / heartbeat.
     *
     * [was: r]
     * @param {number}  elapsed     [was: A]
     * @param {boolean} isSuccess   [was: e]
     * @param {boolean} isUpdate    [was: V]
     * @param {number}  retryCount  [was: B]
     */
    const onSample = (elapsed, isSuccess, isUpdate, retryCount) => { // was: r
      if (this.logger.isDisposed()) return; // was: this.logger.u0()
      let eventType = 'k'; // was: n
      if (isSuccess) {
        eventType = 'h';
      } else if (isUpdate) {
        eventType = 'u';
      }
      if (eventType !== 'k') {
        if (retryCount !== 0) {
          this.logger.W(eventType);
          this.logger.A(eventType, elapsed);
        }
      } else if (this.samplingCounter <= 0) {
        this.logger.W(eventType);
        this.logger.A(eventType, elapsed);
        this.samplingCounter = Math.floor(Math.random() * 200);
      } else {
        this.samplingCounter--;
      }
    };

    /**
     * Completion callback invoked when the BotGuard program finishes
     * loading. Resolves the deferred with the runtime handles.
     *
     * [was: U]
     * @param {Function} tokenCreator [was: A]
     * @param {Function} disposeFn    [was: e]
     * @param {Function} eventCb      [was: V]
     * @param {*}        metadata     [was: B]
     */
    const onComplete = (tokenCreator, disposeFn, eventCb, metadata) => { // was: U
      Promise.resolve().then(() => {
        initTimer.done();
        sharedLogger.O(); // was: K.O() — flush
        sharedLogger.dispose();
        deferred.resolve({
          TC: tokenCreator,   // was: TC — token-creator function
          isVideoVisible: disposeFn,      // was: zx — cleanup / dispose function
          jP: eventCb,        // was: jP — event callback
          mI2: metadata,      // was: mI2 — metadata / extra info
        });
      });
    };

    /**
     * Logger delegate array passed into the BotGuard runtime.
     * [was: I]
     */
    const loggerDelegates = [ // was: I
      (evt, dur) => { this.logger.A(evt, dur); },  // latency
      (code) => { this.logger.Lw(code); },          // error
      (size) => { this.logger.L(size); },            // payload size
      (size, evt) => { this.logger.J(size, evt); },  // RPC timing
    ];

    // -- load the BotGuard program --
    if (!globalRef[globalName]) { // was: g.qX[W]
      this.logger.Lw(25);
      throw Error('EGOU'); // global object unavailable
    }
    if (!globalRef[globalName].a) {
      this.logger.Lw(26);
      throw Error('ELIU'); // loader interface unavailable
    }

    try {
      const loaderFn = globalRef[globalName].a; // was: A

      // Build challenge data arrays
      const challengeData = []; // was: W (re-used)
      const challengeTypes = []; // was: e
      let protoFields = fd(this.challengeMessage); // was: X = fd(this.W)
      for (let i = 0; i < protoFields.length; i++) {
        challengeData.push(protoFields[i]);
        challengeTypes.push(1);
      }
      const extraFields = Fkn(this.challengeMessage); // was: V = Fkn(this.W)
      for (let i = 0; i < extraFields.length; i++) { // was: X reused as index
        challengeData.push(extraFields[i]);
        challengeTypes.push(2);
      }

      const [runtimeHandle] = loaderFn( // was: [B] = A(...)
        program,
        onComplete,
        true,           // async mode
        config.mS,      // was: Q.mS
        onSample,
        [challengeData, challengeTypes],
        Ve(this.challengeMessage, 5), // was: Ve(this.W, 5)
        false,          // legacy flag
        loggerDelegates,
      );

      /** @type {*} handle to the loaded BotGuard runtime [was: this.j] */
      this.runtimeHandle = runtimeHandle; // was: this.j

      /** @type {Promise<void>} resolves when the init sequence completes [was: this.XQ] */
      this.initComplete = deferred.promise.then(() => {}); // was: this.XQ = m.promise.then(...)
    } catch (err) { // was: A
      this.logger.Lw(28);
      throw err;
    }
  }

  /**
   * Asynchronously take a snapshot / generate a token.  Waits for the
   * BotGuard runtime to be ready, then invokes the token-creator with
   * the supplied parameters.
   *
   * @param {Object} params - `{ iB, gf, IZ, J1 }` snapshot parameters [was: Q]
   * @returns {Promise<Uint8Array>} the generated token
   *
   * [was: snapshot]
   */
  async snapshot(params) { // was: snapshot(Q)
    if (this.isDisposed()) throw Error('Already disposed'); // was: this.u0()
    this.logger.W('n');
    const sharedLogger = this.logger.share(); // was: c
    return this.readyPromise.then(({ TC: tokenCreator }) => // was: this.A.then(...)
      new Promise((resolve) => { // was: m
        const timer = new LatencyTimer(sharedLogger, 'n'); // was: K
        tokenCreator((result) => { // was: W(T => { ... })
          timer.done();
          sharedLogger.j(result.length); // was: c.j(T.length) — log snapshot size
          sharedLogger.O();              // was: c.O() — flush
          sharedLogger.dispose();
          resolve(result);
        }, [params.createFadeTransition, params.gf, params.IZ, params.getActiveLayout]);
      }),
    );
  }

  /**
   * Synchronous snapshot — uses the runtime handle directly (no await).
   *
   * @param {Object} params - `{ iB, gf, IZ, J1 }` [was: Q]
   * @returns {Uint8Array}
   *
   * [was: TM]
   */
  snapshotSync(params) { // was: TM(Q)
    if (this.isDisposed()) throw Error('Already disposed');
    this.logger.W('n');
    const result = timedInvoke(
      this.logger,
      () => this.runtimeHandle([params.createFadeTransition, params.gf, params.IZ, params.getActiveLayout]),
      'n',
    ); // was: pO(this.logger, () => this.j([...]), "n")
    this.logger.j(result.length);
    this.logger.O();
    return result;
  }

  /**
   * Forward a DOM event to the BotGuard runtime's event callback.
   *
   * @param {Event} event [was: Q]
   * [was: J5]
   */
  forwardEvent(event) { // was: J5(Q)
    this.readyPromise.then(({ jP: eventCb }) => {
      eventCb?.(event);
    });
  }

  /**
   * Returns a shared reference to the logger for external telemetry.
   *
   * @returns {ShareableLogger}
   * [was: Bt]
   */
  getSharedLogger() { // was: Bt()
    return this.logger.share();
  }
}

// =========================================================================
// Session defaults for challenge-response manager   [was: SAR, lines 62922-62925]
// =========================================================================

/**
 * Default timing configuration for challenge-response sessions.
 *
 * [was: SAR]
 * @type {{ Dp: number, Qn: number }}
 */
export const SESSION_TIMING_DEFAULTS = { // was: SAR
  Dp: 30_000,  // was: 3E4 — max session duration (ms)
  polyfillRegistry: 20_000,  // was: 2E4 — session check interval (ms)
};

// =========================================================================
// Challenge-Response Session Manager   [was: F8d, lines 62926-62999]
// =========================================================================

/**
 * Manages a challenge-response session with the BotGuard runtime. Handles:
 *  - Deferred readiness via a `Deferred` promise (`this.ready`)
 *  - Logger share-and-callback setup with `LatencyTimer`
 *  - Error reporting and disposal cascading
 *  - Session-storage caching via `ycx`
 *
 * [was: F8d extends g.qK]
 */
export class ChallengeResponseSession extends Disposable { // was: F8d
  /**
   * @param {Object} config - session configuration with fields:
   *   - `OG`      — the parent `BotGuardInitialiser` or provider  [was: OG]
   *   - `Fm`      — fetch / request manager                       [was: Fm]
   *   - `Fh`      — timing overrides                              [was: Fh]
   *   - `onError` — error callback                                [was: onError]
   *   - `Ob`      — optional boolean flag                          [was: Ob]
   *   - `cQI`     — optional direct challenge-query invoker        [was: cQI]
   *
   * [was: constructor(Q)]
   */
  constructor(config) { // was: constructor(Q)
    super();

    /** @type {NativeDeferred} [was: this.j] */
    this.ready = new NativeDeferred(); // was: this.j = new g.id

    /** @type {number} retry counter [was: this.K] */
    this.retryCount = 0; // was: this.K

    /** @type {*} last error encountered [was: this.O] */
    this.lastError = undefined; // was: this.O

    /** @type {number} current state (2 = pending) [was: this.state] */
    this.state = 2; // was: this.state

    /** @type {Object} parent provider [was: this.OG] */
    this.provider = config.OG; // was: this.OG

    /** @type {*} fetch manager [was: this.Fm] */
    this.fetchManager = config.Fm; // was: this.Fm

    /** @type {Object} timing config (merged with defaults) [was: this.Fh] */
    this.timingConfig = { // was: this.Fh
      ...SESSION_TIMING_DEFAULTS,
      ...(config.Fh || {}),
    };

    /** @type {ShareableLogger} [was: this.logger] */
    this.logger = config.OG.Bt(); // was: Q.OG.Bt() — get shared logger

    /** @type {Function} error callback [was: this.onError] */
    this.onError = config.onError ?? (() => {}); // was: Q.onError ?? (()=>{})

    /** @type {boolean} [was: this.Ob] */
    this.observeMode = config.Ob || false; // was: Q.Ob || !1

    // -- wire the challenge-query invoker --
    if (Fwd(config)) { // was: Fwd(Q)
      const provider = this.provider; // was: m
      this.invokeChallenge = () => // was: this.D
        resumeAttestation(provider).catch((err) => { // was: EGW(m).catch(...)
          this.lastError = err = this.reportError(
            new ModuleError(this.tokenHandler ? 20 : 32, 'TRG:Disposed', err), // was: this.W ? 20 : 32
          );
          this.tokenHandler?.dispose(); // was: this.W?.dispose()
          this.tokenHandler = undefined;
          this.ready.reject(err);
        });
      appendDisposeCallback(provider, () => void executeAttestation(this)); // was: s_x(m, () => void vG(this))
      if (provider.L === 2) executeAttestation(this);
    } else {
      this.invokeChallenge = config.cQI; // was: this.D = Q.cQI
      executeAttestation(this);
    }

    // -- logger completion tracking --
    const sharedLogger = this.logger.share(); // was: c
    sharedLogger.W('o'); // was: c.W("o")
    const openTimer = new LatencyTimer(sharedLogger, 'o'); // was: W = new DB(c, "o")

    this.ready.promise.then(
      () => {
        openTimer.done();
        sharedLogger.O(); // flush
        sharedLogger.dispose();
      },
      () => void sharedLogger.dispose(),
    );

    this.addOnDisposeCallback(() => {
      if (this.tokenHandler) { // was: this.W
        this.tokenHandler.dispose();
        this.tokenHandler = undefined;
      } else if (this.lastError) {
        this.logger.O(); // flush
      } else {
        this.lastError = this.reportError(new ModuleError(32, 'TNP:Disposed'));
        this.logger.O();
        this.ready.reject(this.lastError);
      }
    });

    registerDisposable(this, this.logger); // register logger for cascading disposal
  }

  /**
   * Returns a promise that resolves when the session is ready.
   * [was: AC]
   * @returns {Promise}
   */
  whenReady() { // was: AC()
    return this.ready.promise;
  }

  /**
   * Produce a token (full bytes).
   * @param {Object} params [was: Q]
   * @returns {Promise<Uint8Array>}
   * [was: A]
   */
  async generateToken(params) { // was: A(Q)
    return signRequest(this, { ...params }, false); // was: $d(this, {...Q}, !1)
  }

  /**
   * Produce a compressed / wire-format token.
   * @param {Object} params [was: Q]
   * @returns {Promise<Uint8Array>}
   * [was: Ol]
   */
  async generateCompressedToken(params) { // was: Ol(Q)
    return signRequest(this, { ...params }, true); // was: $d(this, {...Q}, !0)
  }

  /**
   * Initialise session-storage cache for token reuse.
   * Ignored for cache sizes > 150.
   *
   * @param {number} maxSize [was: Q]
   * [was: NW]
   */
  initCache(maxSize) { // was: NW(Q)
    if (maxSize > 150) return;
    try {
      this.cache = new SessionStorageAdapter(maxSize, this.logger); // was: new ycx(Q, this.logger)
    } catch (err) {
      this.reportError(new ModuleError(22, 'GBJ:init', err));
    }
  }

  /**
   * Report an error, log it, and forward to the error callback.
   *
   * @param {g5} error [was: Q]
   * @returns {g5}
   * [was: reportError]
   */
  reportError(error) { // was: reportError(Q)
    this.logger.Lw(error.code); // was: this.logger.Lw(Q.code)
    this.onError(error);
    return error;
  }
}
