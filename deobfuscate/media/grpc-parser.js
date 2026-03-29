/**
 * grpc-parser.js -- gRPC/progressive response handling, integrity-token
 * acquisition pipeline, Waa service client, fetch-based XHR, URI utilities,
 * and EventHandler lifecycle management.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines 62701-63522
 *
 * Covers:
 *  - Default timing constants (iiw)
 *  - RetryTimer (tJ): pausable timer with retry/cancel semantics
 *  - Math.imul polyfill (L17)
 *  - Hash seed constants (Za)
 *  - LRU ring buffer (dw): fixed-size LRU eviction with integrity check
 *  - SessionStorageAdapter (ycx): sessionStorage read/write with index
 *  - Base52/62 encoder (Osy): compact integer-to-string encoding
 *  - IntegrityTokenSerializer (Hj): base class for token serialisation
 *  - MessageSerializer (aK): message-aware integrity serialiser
 *  - FixedTokenSerializer (PIW): serialiser returning a fixed token
 *  - WasmTokenSerializer ($n7): serialiser that invokes WASM compression
 *  - ErrorTokenSerializer (CI3): serialiser for error-state tokens
 *  - SessionTokenSerializer (ld): serialiser producing session-scoped tokens
 *  - Default timing config (SAR)
 *  - IntegrityTokenPipeline (F8d): end-to-end token acquisition pipeline
 *  - Fwd type guard (Fwd): validates pipeline config shape
 *  - GacStreamzReporter (Ziw): streamz reporter for /youtube/aba/gac
 *  - Waa service proto classes (Ec_, wLd, YZR)
 *  - gRPC method descriptors (d07, Lw3, Nj7)
 *  - Auth hash set (VeO)
 *  - Proto Any accessor (kCw)
 *  - gRPC response stream (qTm): event-emitting response handler
 *  - AsyncStack error (pBw): synthetic error for async stack traces
 *  - FetchXhr (pZ): Fetch-API-backed XMLHttpRequest adapter
 *  - FetchXhrFactory (g.Yd): factory for FetchXhr instances
 *  - URI (g.KG): full URI parser and builder
 *  - QueryData (XJ): query-string parameter map
 *  - EventHandler (g.Hx): lifecycle-managed listener aggregator
 */

// =========================================================================
// Default timing constants   [was: iiw, lines 62704-62718]
// =========================================================================


import { EventTargetBase, listen } from '../core/composition-helpers.js'; // was: g.$R, g.s7
import { NativeDeferred, XhrConfig, incrementCounter, registerCounter } from '../core/event-registration.js'; // was: g.id, g.Yd, g.ZE, g.SH
import { registerDisposable } from '../core/event-system.js'; // was: g.F
import { globalRef } from '../proto/messages-core.js'; // was: g.qX
import { startPausableTimer } from '../core/event-registration.js'; // was: dnm
import { clearPausableTimer } from '../core/event-registration.js'; // was: y3
import { sessionStorageSet } from '../core/event-registration.js'; // was: Su
import { loadSessionIndex } from '../core/event-registration.js'; // was: j_d
import { hexFingerprint } from '../core/event-registration.js'; // was: E9
import { timedInvoke } from '../core/event-registration.js'; // was: pO
import { encryptAndStore } from '../core/event-registration.js'; // was: wBw
import { readAndDecrypt } from '../core/event-registration.js'; // was: bs7
import { setExpiryTimer } from '../core/event-registration.js'; // was: ww
import { ModuleError } from '../data/module-init.js'; // was: g5
import { jenkinsHash } from '../core/event-registration.js'; // was: fJd
import { serializeError } from '../core/event-registration.js'; // was: ju
import { polyfillRegistry } from '../core/polyfills.js'; // was: Qn
import { resumeAttestation } from '../core/event-registration.js'; // was: EGW
import { appendDisposeCallback } from '../core/event-registration.js'; // was: s_x
import { executeAttestation } from '../core/event-registration.js'; // was: vG
import { LatencyTimer } from '../data/logger-init.js'; // was: DB
import { signRequest } from '../core/event-registration.js'; // was: $d
import { getNowPlayingPosition } from '../player/time-tracking.js'; // was: Np()
import { int64FieldDescriptor } from '../core/event-system.js'; // was: ap
import { ProtobufMessage } from '../proto/message-setup.js'; // was: Zd
import { RpcRequest } from '../network/xhr-handler.js'; // was: sN3
import { wireStreamCallbacks } from '../core/event-registration.js'; // was: RR0
import { removeFromArray } from '../core/event-registration.js'; // was: kd
import { XmlHttpFactory } from '../core/event-registration.js'; // was: fO
import { FetchXhr } from '../network/request.js'; // was: pZ
import { RpcError } from '../data/event-logging.js'; // was: fZ
import { getBufferHealth } from './segment-request.js'; // was: El
import { ensureListener } from '../core/composition-helpers.js'; // was: dm
import { setConnectData } from '../modules/remote/mdx-client.js'; // was: Wa
import { getListenerMap } from '../core/composition-helpers.js'; // was: wm
import { removeListenerKey } from '../core/composition-helpers.js'; // was: vO
import { disposeApp } from '../player/player-events.js'; // was: WA
import { serialize } from '../proto/protobuf-writer.js';
import { splice, concat, removeAll } from '../core/array-utils.js';
import { Disposable } from '../core/disposable.js';
import { dispose } from '../ads/dai-cue-range.js';
import { setPrototypeOf, defineProperty } from '../core/polyfills.js';
import { toString } from '../core/string-utils.js';
import { isObject } from '../core/type-helpers.js';
import { forEachObject } from '../core/object-utils.js';
import { EventHandler } from '../core/event-handler.js'; // was: g.Hx
// TODO: resolve g.lj

/**
 * Default timing and retry configuration for the integrity pipeline.
 *
 * [was: iiw]
 * @type {Object}
 */
export const DEFAULT_TIMING_CONFIG = { // was: iiw
  /** Max age of cached tokens in ms (12 hours) [was: cR] */
  maxTokenAgeMs: 43200000, // was: cR: 432E5

  /** Base retry interval in ms [was: EB] */
  retryIntervalMs: 300000, // was: EB: 3E5

  /** Max retry exponent [was: uF] */
  maxRetryExponent: 10, // was: uF: 10

  /** Heartbeat interval in ms [was: HW] */
  heartbeatMs: 10000, // was: HW: 1E4

  /** Request timeout in ms [was: hR] */
  requestTimeoutMs: 30000, // was: hR: 3E4

  /** Initial backoff in ms [was: o3] */
  initialBackoffMs: 30000, // was: o3: 3E4

  /** Max backoff cap in ms [was: w$] */
  maxBackoffMs: 60000, // was: w$: 6E4

  /** Min tick interval in ms [was: Mh] */
  minTickMs: 1000, // was: Mh: 1E3

  /** Observation window in ms [was: jA] */
  observationWindowMs: 60000, // was: jA: 6E4

  /** Extended observation window in ms [was: Qe] */
  extendedWindowMs: 600000, // was: Qe: 6E5

  /** Jitter factor [was: K6] */
  jitterFactor: 0.25, // was: K6: .25

  /** Multiplier for backoff [was: AR] */
  backoffMultiplier: 2, // was: AR: 2

  /** Max number of retry attempts [was: maxAttempts] */
  maxAttempts: 10,
};

// =========================================================================
// RetryTimer   [was: tJ, lines 62719-62757]
// =========================================================================

/**
 * A pausable timer that resolves a promise when it expires. Used for
 * retry delays in the integrity-token pipeline.
 *
 * [was: tJ]
 */
export class RetryTimer { // was: tJ
  /**
   * @param {number} durationMs - Initial duration [was: Q]
   * @param {number} tickIntervalMs - Tick check interval [was: c]
   * @param {number} toleranceMs - Tolerance for early expiry [was: W]
   */
  constructor(durationMs, tickIntervalMs, toleranceMs) { // was: constructor(Q, c, W)
    /** @type {number} Absolute end time [was: this.endTimeMs] */
    this.endTimeMs = 0;

    /** @type {?number} setTimeout handle [was: this.W] */
    this.timerHandle = null; // was: this.W = null

    /** @type {boolean} Whether the timer is paused [was: this.isPaused] */
    this.isPaused = false;

    /**
     * Internal tick handler -- checks remaining time.
     * [was: this.tick]
     * @type {Function}
     */
    this.tick = () => {
      if (this.isPaused) return;
      const remaining = this.endTimeMs - Date.now(); // was: m
      if (remaining <= this.toleranceMs) { // was: this.A
        this.timerHandle = null;
        this.resolvePromise(0); // was: this.xC(0)
      } else {
        this.timerHandle = setTimeout(this.tick, Math.min(remaining, this.tickIntervalMs));
      }
    };

    /** @type {number} [was: this.EB] */
    this.tickIntervalMs = tickIntervalMs; // was: this.EB = c

    /** @type {number} [was: this.A] */
    this.toleranceMs = toleranceMs; // was: this.A = W

    /** @type {Promise<number>} Resolves with 0 (expired) or 1 (cancelled) */
    this.promise = new Promise((resolve) => {
      /** @type {Function} [was: this.xC] */
      this.resolvePromise = resolve; // was: this.xC = m
    });

    startPausableTimer(this, durationMs); // Starts the timer
  }

  /**
   * Pause the timer.
   * [was: pause]
   */
  pause() { // was: pause()
    if (this.isPaused) return;
    this.isPaused = true;
    clearPausableTimer(this); // Clears the internal setTimeout
  }

  /**
   * Resume the timer.
   * [was: resume]
   */
  resume() { // was: resume()
    if (!this.isPaused) return;
    this.isPaused = false;
    this.tick();
  }

  /**
   * Cancel the timer (resolves with 1).
   * [was: O]
   */
  cancel() { // was: O()
    clearPausableTimer(this);
    this.endTimeMs = 0;
    this.isPaused = false;
    this.resolvePromise(1); // was: this.xC(1)
  }

  /**
   * Whether the timer has expired.
   * [was: isExpired]
   * @returns {boolean}
   */
  isExpired() { // was: isExpired()
    return Date.now() > this.endTimeMs;
  }
}

// =========================================================================
// Math.imul polyfill / hash seeds   [was: L17, Za, lines 62759-62760]
// =========================================================================

/**
 * Math.imul polyfill for environments that lack it.
 * [was: L17]
 * @type {Function}
 */
export const imul = Math.imul ?? ((a, b) => (a * b) | 0); // was: L17

/**
 * Hash seed array used by the LRU ring buffer integrity check.
 * [was: Za]
 * @type {number[]}
 */
export const HASH_SEEDS = [196, 200, 224, 18]; // was: Za

// =========================================================================
// LRU Ring Buffer   [was: dw, lines 62761-62784]
// =========================================================================

/**
 * Fixed-size LRU ring buffer that evicts the oldest entry when full.
 * On each insert, an integrity check (HMAC-like hash) is performed.
 *
 * [was: dw]
 */
export class LruRingBuffer { // was: dw
  /**
   * @param {number} maxItems - Maximum capacity [was: Q]
   * @param {number} [writeIndex=0] - Current write position [was: c]
   * @param {Array} [items=[]] - Initial items [was: W]
   */
  constructor(maxItems, writeIndex = 0, items = []) { // was: constructor(Q, c=0, W=[])
    /** @type {number} */
    this.maxItems = maxItems;

    /** @type {number} Current write position [was: this.W] */
    this.writeIndex = writeIndex; // was: this.W = c

    /** @type {Array} Ring buffer storage [was: this.O] */
    this.items = items; // was: this.O = W
  }

  /**
   * Serialise the buffer to a string.
   * [was: Eg]
   * @returns {string}
   */
  serialize() { // was: Eg()
    return String(this.writeIndex) + "," + this.items.join();
  }

  /**
   * Insert an item, evicting the oldest if full.
   * Returns the evicted item (or undefined) and validates integrity.
   *
   * [was: ll]
   * @param {*} item [was: Q]
   * @param {Function} onEvict - Called with the evicted item [was: c]
   * @returns {boolean} Integrity check result
   */
  insert(item, onEvict) { // was: ll(Q, c)
    let evicted = undefined; // was: W

    if (this.items[this.writeIndex] !== item) {
      const existingIdx = this.items.indexOf(item); // was: m
      if (existingIdx !== -1) {
        this.items.splice(existingIdx, 1);
        if (existingIdx < this.writeIndex) this.writeIndex--;
        this.items.splice(this.writeIndex, 0, item);
      } else {
        evicted = this.items[this.writeIndex]; // was: W
        this.items[this.writeIndex] = item;
      }
    }

    this.writeIndex = (this.writeIndex + 1) % this.maxItems;

    const isValid = sessionStorageSet("iU5q-!O9@$", this.serialize()); // was: Q = Su(...)
    if (evicted && isValid) onEvict(evicted);
    return isValid;
  }
}

// =========================================================================
// SessionStorageAdapter   [was: ycx, lines 62785-62803]
// =========================================================================

/**
 * Adapter for reading/writing integrity data to sessionStorage.
 * Falls back gracefully when sessionStorage is unavailable.
 *
 * [was: ycx]
 */
export class SessionStorageAdapter { // was: ycx
  /**
   * @param {number} storageKey - Numeric key for the storage slot [was: Q]
   * @param {Object} logger [was: c]
   */
  constructor(storageKey, logger) { // was: constructor(Q, c)
    /** @type {Object} [was: this.logger] */
    this.logger = logger;

    // Check sessionStorage availability
    let isAvailable; // was: W
    try {
      isAvailable =
        globalThis.sessionStorage &&
        !!globalThis.sessionStorage.getItem &&
        !!globalThis.sessionStorage.setItem &&
        !!globalThis.sessionStorage.removeItem;
    } catch (_e) {
      isAvailable = false;
    }

    if (isAvailable) {
      /** @type {*} Storage index [was: this.index] */
      this.index = loadSessionIndex(storageKey); // was: this.index = j_d(Q)
    }
  }

  /**
   * Write a value to session storage.
   * [was: W]
   * @param {*} key [was: Q]
   * @param {Function} evictionCallback [was: c]
   * @param {*} value [was: W]
   * @param {*} extra [was: m]
   */
  write(key, evictionCallback, value, extra) { // was: W(Q, c, W, m)
    const status = this.index
      ? timedInvoke(this.logger, () => encryptAndStore(this.index, hexFingerprint(key), evictionCallback, value, extra), "W")
      : "u"; // was: K
    this.logger.Y(status);
  }

  /**
   * Read a value from session storage.
   * [was: O]
   * @param {*} key [was: Q]
   * @param {*} fallback [was: c]
   * @returns {*}
   */
  read(key, fallback) { // was: O(Q, c)
    const [status, result] = this.index
      ? timedInvoke(this.logger, () => readAndDecrypt(hexFingerprint(key), fallback), "R")
      : ["u"]; // was: [W, m]
    this.logger.D(status);
    return result;
  }
}

// =========================================================================
// Base52/62 encoder   [was: Osy, lines 62806-62817]
// =========================================================================

/**
 * Encodes an integer as a compact base-52/62 string.
 * Used for generating short unique identifiers for streamz labels.
 *
 * [was: Osy]
 */
export const Base52Encoder = { // was: Osy
  /**
   * Convert an integer to a compact string.
   * [was: toString]
   * @param {number} value [was: Q]
   * @returns {string}
   */
  toString: function (value) { // was: toString(Q)
    const chars = []; // was: c
    let pos = 0; // was: W
    value -= -2147483648; // was: Q -= -2147483648
    chars[pos++] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(value % 52);
    for (value = Math.floor(value / 52); value > 0; ) {
      chars[pos++] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(value % 62);
      value = Math.floor(value / 62);
    }
    return chars.join("");
  },
};

// =========================================================================
// IntegrityTokenSerializer hierarchy   [was: Hj, aK, PIW, $n7, CI3, ld, lines 62818-62920]
// =========================================================================

/**
 * Base class for integrity-token serialisers.
 *
 * [was: Hj]
 */
export class IntegrityTokenSerializer extends Disposable { // was: Hj extends g.qK
  /**
   * @param {Object} logger [was: Q]
   */
  constructor(logger) { // was: constructor(Q)
    super();

    /** @type {Object} [was: this.logger] */
    this.logger = logger;

    /** @type {NativeDeferred} Completion deferred [was: this.j] */
    this.completion = new NativeDeferred(); // was: this.j = new g.id()
  }

  /**
   * Serialise and compress the token.
   * [was: Ol]
   * @param {Function} tokenFn [was: Q]
   * @param {Function} [onRaw] - Callback for raw token data [was: c]
   * @returns {Uint8Array}
   */
  serializeCompressed(tokenFn, onRaw) { // was: Ol(Q, c)
    const raw = this.serialize(tokenFn); // was: W = this.A(Q)
    onRaw?.(raw);
    return timedInvoke(this.logger, () => g.lj(raw, 2), this.compressLabel); // was: pO(..., this.O)
  }

  /**
   * Conditionally serialise with compression.
   * [was: S$]
   * @param {Function} tokenFn [was: Q]
   * @param {boolean} compress [was: c]
   * @param {Function} [onRaw] [was: W]
   * @returns {*}
   */
  serializeConditional(tokenFn, compress, onRaw) { // was: S$(Q, c, W)
    return timedInvoke(
      this.logger,
      () => compress ? this.serializeCompressed(tokenFn, onRaw) : this.serialize(tokenFn, onRaw),
      this.serializeLabel // was: this.W
    );
  }
}

/**
 * Message-aware integrity serialiser.
 *
 * [was: aK]
 */
export class MessageSerializer extends IntegrityTokenSerializer { // was: aK extends Hj
  /**
   * @param {Object} logger [was: Q]
   * @param {Function} serializeFn - Message serialisation function [was: c]
   * @param {number} minMessages - Minimum message count before completing [was: W]
   * @param {*} disposeFn [was: m]
   */
  constructor(logger, serializeFn, minMessages, disposeFn) { // was: constructor(Q, c, W, m)
    super(logger);

    /** @type {Function} [was: this.K] */
    this.serializeFn = serializeFn; // was: this.K = c

    /** @type {number} [was: this.J] */
    this.minMessages = minMessages; // was: this.J = W

    /** @type {string} Serialize label [was: this.W] */
    this.serializeLabel = "m"; // was: this.W = "m"

    /** @type {string} Compress label [was: this.O] */
    this.compressLabel = "x"; // was: this.O = "x"

    /** @type {number} Message counter [was: this.D] */
    this.messageCount = 0; // was: this.D = 0

    setExpiryTimer(this, disposeFn);
  }

  /**
   * Serialise a message.
   * [was: A]
   * @param {Function} tokenFn [was: Q]
   * @param {Function} [onSerialized] [was: c]
   * @returns {Uint8Array}
   */
  serialize(tokenFn, onSerialized) { // was: A(Q, c)
    this.logger.W(this.serializeLabel);

    if (++this.messageCount >= this.minMessages) {
      this.completion.resolve(); // was: this.j.resolve()
    }

    const message = tokenFn(); // was: W = Q()
    const serialized = timedInvoke(this.logger, () => this.serializeFn(message), "C"); // was: Q

    if (serialized === undefined) throw new ModuleError(17, "YNJ:Undefined");
    if (!(serialized instanceof Uint8Array)) throw new ModuleError(18, "ODM:Invalid");

    onSerialized?.(serialized);
    return serialized;
  }
}

/**
 * Fixed-token serialiser (returns a pre-computed token).
 *
 * [was: PIW]
 */
export class FixedTokenSerializer extends IntegrityTokenSerializer { // was: PIW extends Hj
  /**
   * @param {Object} logger [was: Q]
   * @param {Uint8Array} fixedToken [was: c]
   * @param {*} disposeFn [was: W]
   */
  constructor(logger, fixedToken, disposeFn) { // was: constructor(Q, c, W)
    super(logger);

    /** @type {Uint8Array} [was: this.K] */
    this.fixedToken = fixedToken; // was: this.K = c

    /** @type {string} [was: this.W] */
    this.serializeLabel = "f"; // was: this.W = "f"

    /** @type {string} [was: this.O] */
    this.compressLabel = "z"; // was: this.O = "z"

    setExpiryTimer(this, disposeFn);
  }

  /**
   * Returns the fixed token.
   * [was: A]
   * @returns {Uint8Array}
   */
  serialize() { // was: A()
    return this.fixedToken;
  }
}

/**
 * WASM-backed token serialiser.
 *
 * [was: $n7]
 */
export class WasmTokenSerializer extends IntegrityTokenSerializer { // was: $n7 extends Hj
  /**
   * @param {Object} logger [was: Q]
   * @param {Uint8Array} wasmToken [was: c]
   * @param {*} disposeFn [was: W]
   */
  constructor(logger, wasmToken, disposeFn) { // was: constructor(Q, c, W)
    super(logger);

    /** @type {Uint8Array} [was: this.K] */
    this.wasmToken = wasmToken; // was: this.K = c

    /** @type {string} [was: this.W] */
    this.serializeLabel = "w"; // was: this.W = "w"

    /** @type {string} [was: this.O] */
    this.compressLabel = "z"; // was: this.O = "z"

    setExpiryTimer(this, disposeFn);
  }

  /**
   * Serialise via WASM decompression.
   * [was: A]
   * @returns {Uint8Array}
   */
  serialize() { // was: A()
    return timedInvoke(this.logger, () => CN(this.wasmToken), "d");
  }

  /**
   * Override: returns the raw WASM token without compression.
   * [was: Ol]
   * @returns {Uint8Array}
   */
  serializeCompressed() { // was: Ol()
    return this.wasmToken;
  }
}

/**
 * Error-state token serialiser -- produces a diagnostic token on failure.
 *
 * [was: CI3]
 */
export class ErrorTokenSerializer extends IntegrityTokenSerializer { // was: CI3 extends Hj
  /**
   * @param {Object} logger [was: Q]
   * @param {Error} error [was: c]
   */
  constructor(logger, error) { // was: constructor(Q, c)
    super(logger);

    /** @type {Error} [was: this.error] */
    this.error = error;

    /** @type {string} [was: this.W] */
    this.serializeLabel = "e"; // was: this.W = "e"

    /** @type {string} [was: this.O] */
    this.compressLabel = "y"; // was: this.O = "y"
  }

  /**
   * Serialise the error as a diagnostic token.
   * [was: A]
   * @returns {Uint8Array}
   */
  serialize() { // was: A()
    if (this.cachedToken) return this.cachedToken; // was: this.K

    this.cachedToken = serializeError(this, (encoder) => "_" + jenkinsHash(encoder)); // was: this.K = ju(this, Q => "_" + fJd(Q))
    return serializeError(this, (encoder) => encoder);
  }
}

/**
 * Session-scoped token serialiser -- embeds session metadata.
 *
 * [was: ld]
 */
export class SessionTokenSerializer extends IntegrityTokenSerializer { // was: ld extends Hj
  /**
   * @param {Object} logger [was: Q]
   * @param {number} sessionType [was: c]
   * @param {number} clientState [was: W]
   */
  constructor(logger, sessionType, clientState) { // was: constructor(Q, c, W)
    super(logger);

    /** @type {number} [was: this.K] */
    this.sessionType = sessionType; // was: this.K = c

    /** @type {number} [was: this.clientState] */
    this.clientState = clientState;

    /** @type {string} [was: this.W] */
    this.serializeLabel = "S"; // was: this.W = "S"

    /** @type {string} [was: this.O] */
    this.compressLabel = "q"; // was: this.O = "q"
  }

  /**
   * Build a session token with random nonce, type, state, and timestamp.
   * [was: A]
   * @returns {Uint8Array}
   */
  serialize() { // was: A()
    const timestamp = Math.floor(Date.now() / 1000); // was: Q
    const nonce = [Math.random() * 255, Math.random() * 255]; // was: c
    const payload = nonce.concat(
      [this.sessionType & 255, this.clientState],
      [(timestamp >> 24) & 255, (timestamp >> 16) & 255, (timestamp >> 8) & 255, timestamp & 255]
    ); // was: W

    const token = new Uint8Array(2 + payload.length); // was: Q (reused)
    token[0] = 34; // TLV tag
    token[1] = payload.length;
    token.set(payload, 2);

    // XOR-obfuscate payload bytes using the nonce
    const body = token.subarray(2); // was: W (reused)
    const nonceLen = nonce.length; // was: c (reused)
    for (let i = nonceLen; i < body.length; ++i) {
      body[i] ^= body[i % nonceLen];
    }

    this.logger.mF(this.clientState);
    return token;
  }
}

// =========================================================================
// Default pipeline timing   [was: SAR, lines 62922-62925]
// =========================================================================

/**
 * Default timing for the integrity-token acquisition pipeline.
 * [was: SAR]
 */
export const PIPELINE_TIMING = { // was: SAR
  /** Default pipeline timeout in ms [was: Dp] */
  Dp: 30000, // was: Dp: 3E4

  /** Default observation interval in ms [was: Qn] */
  polyfillRegistry: 20000, // was: Qn: 2E4
};

// =========================================================================
// IntegrityTokenPipeline   [was: F8d, lines 62926-63001]
// =========================================================================

/**
 * End-to-end integrity-token acquisition pipeline. Manages the lifecycle
 * of token generation, caching via sessionStorage, and error reporting.
 *
 * [was: F8d]
 */
export class IntegrityTokenPipeline extends Disposable { // was: F8d extends g.qK
  /**
   * @param {Object} config - Pipeline configuration [was: Q]
   */
  constructor(config) { // was: constructor(Q)
    super();

    /** @type {NativeDeferred} Completion deferred [was: this.j] */
    this.deferred = new NativeDeferred(); // was: this.j = new g.id()

    /** @type {number} Retry counter [was: this.K] */
    this.retryCount = 0; // was: this.K = 0

    /** @type {undefined|Error} Last error [was: this.O] */
    this.lastError = undefined; // was: this.O = void 0

    /** @type {number} Pipeline state [was: this.state] */
    this.state = 2;

    /** @type {Object} Web Player Container handle [was: this.OG] */
    this.wpcHandle = config.OG;

    /** @type {*} Format reference [was: this.Fm] */
    this.formatRef = config.Fm;

    /**
     * Timing overrides merged with defaults.
     * [was: this.Fh]
     */
    this.timing = {
      ...PIPELINE_TIMING,
      ...(config.Fh || {}),
    };

    /** @type {Object} Logger [was: this.logger] */
    this.logger = config.OG.Bt(); // was: this.logger = Q.OG.Bt()

    /** @type {Function} Error callback [was: this.onError] */
    this.onError = config.onError ?? (() => {});

    /** @type {boolean} Observation mode [was: this.Ob] */
    this.observationMode = config.Ob || false;

    // Wire up the token generator
    if (Fwd(config)) {
      const wpc = this.wpcHandle; // was: m
      this.tokenGenerator = () =>
        resumeAttestation(wpc).catch((err) => {
          this.lastError = err = this.reportError(
            new ModuleError(this.serializer ? 20 : 32, "TRG:Disposed", err)
          );
          this.serializer?.dispose();
          this.serializer = undefined;
          this.deferred.reject(err);
        }); // was: this.D

      appendDisposeCallback(wpc, () => void executeAttestation(this));
      if (wpc.L === 2) executeAttestation(this);
    } else {
      this.tokenGenerator = config.cQI; // was: this.D = Q.cQI
      executeAttestation(this);
    }

    // Wire up lifecycle logging
    const loggerRef = this.logger.share(); // was: c
    loggerRef.W("o");
    const logScope = new LatencyTimer(loggerRef, "o"); // was: W

    this.deferred.promise.then(
      () => { logScope.done(); loggerRef.O(); loggerRef.dispose(); },
      () => void loggerRef.dispose()
    );

    this.addOnDisposeCallback(() => {
      if (this.serializer) {
        this.serializer.dispose();
        this.serializer = undefined;
      } else if (this.lastError) {
        this.logger.O();
      } else {
        this.lastError = this.reportError(new ModuleError(32, "TNP:Disposed"));
        this.logger.O();
        this.deferred.reject(this.lastError);
      }
    });

    registerDisposable(this, this.logger);
  }

  /**
   * Returns a promise that resolves when the pipeline completes.
   * [was: AC]
   * @returns {Promise}
   */
  getCompletionPromise() { // was: AC()
    return this.deferred.promise;
  }

  /**
   * Sign a message (uncompressed).
   * [was: A]
   */
  signMessage(options) { // was: A(Q)
    return signRequest(this, { ...options }, false);
  }

  /**
   * Sign a message (compressed).
   * [was: Ol]
   */
  signMessageCompressed(options) { // was: Ol(Q)
    return signRequest(this, { ...options }, true);
  }

  /**
   * Initialise session storage caching.
   * [was: NW]
   * @param {number} storageKey [was: Q]
   */
  initCache(storageKey) { // was: NW(Q)
    if (storageKey > 150) return;
    try {
      this.cache = new SessionStorageAdapter(storageKey, this.logger);
    } catch (err) {
      this.reportError(new ModuleError(22, "GBJ:init", err));
    }
  }

  /**
   * Report and log an error.
   * [was: reportError]
   * @param {g5} error
   * @returns {g5}
   */
  reportError(error) { // was: reportError(Q)
    this.logger.Lw(error.code);
    this.onError(error);
    return error;
  }
}

/**
 * Type guard for pipeline config shape.
 * [was: Fwd]
 */
const isPipelineConfig = Fwd; // exposed for reference

// =========================================================================
// GacStreamzReporter   [was: Ziw, lines 63025-63034]
// =========================================================================

/**
 * Streamz reporter for `/client_streamz/youtube/aba/gac`.
 * [was: Ziw]
 */
export class GacStreamzReporter { // was: Ziw
  constructor() {
    const client = g.getNowPlayingPosition; // was: Q
    this.client = client; // was: this.O = Q
    registerCounter(client, "/client_streamz/youtube/aba/gac", int64FieldDescriptor("type"), int64FieldDescriptor("sequence"));
  }

  increment(type, sequence) { // was: W(Q, c)
    incrementCounter(this.client, "/client_streamz/youtube/aba/gac", type, sequence);
  }
}

/** @type {number} Timestamp at module load [was: IYy] */
export const moduleLoadTimestamp = new Date().getTime(); // was: IYy

// =========================================================================
// Waa service protos   [was: Ec_, wLd, YZR, lines 63037-63114]
// =========================================================================

/**
 * Waa Create response proto.
 * [was: Ec_]
 */
export class WaaCreateResponse extends ProtobufMessage { // was: Ec_ extends Zd
  constructor(data) { super(data); }
}

/**
 * Waa GenerateIT response proto.
 * [was: wLd]
 */
export class WaaGenerateITResponse extends ProtobufMessage { // was: wLd extends Zd
  constructor(data) { super(data); }
}

/** @type {Set<string>} Auth hash algorithm names [was: VeO] */
export const AUTH_HASH_ALGORITHMS = new Set(["SAPISIDHASH", "APISIDHASH"]); // was: VeO

/**
 * Proto Any wrapper.
 * [was: YZR]
 */
export class ProtoAny extends ProtobufMessage { // was: YZR extends Zd
  constructor(data) { super(data); }

  /**
   * Get the binary value of the Any message.
   * [was: getValue]
   * @returns {Uint8Array}
   */
  getValue() { // was: getValue()
    const raw = dD(this, 2); // was: Q
    if (Array.isArray(raw) || raw instanceof ProtobufMessage) {
      throw Error("Cannot access the Any.value field on Any protos encoded using the jspb format, call unpackJspb instead");
    }
    return $H(this, 2);
  }
}

// =========================================================================
// gRPC method descriptors   [was: d07, Lw3, Nj7, lines 63068-63092]
// =========================================================================

/**
 * gRPC unary method descriptor.
 *
 * [was: d07]
 */
export class UnaryMethodDescriptor { // was: d07
  /**
   * @param {string} name - Full method path [was: Q]
   * @param {Function} requestType - Request proto constructor [was: c]
   * @param {Function} responseType - Response proto constructor [was: W]
   * @param {Function} requestSerializer - Request serialiser [was: m]
   * @param {Function} responseDeserializer - Response deserialiser [was: K]
   */
  constructor(name, requestType, responseType, requestSerializer, responseDeserializer) {
    /** @type {string} */
    this.name = name;

    /** @type {string} */
    this.methodType = "unary";

    /** @type {Function} */
    this.requestType = requestType;

    /** @type {Function} */
    this.responseType = responseType;

    /** @type {Function} [was: this.W] */
    this.requestSerializer = requestSerializer; // was: this.W = m

    /** @type {Function} [was: this.O] */
    this.responseDeserializer = responseDeserializer; // was: this.O = K
  }

  /**
   * Create a request object for this method.
   * [was: D]
   */
  createRequest(requestData, metadata = {}) { // was: D(Q, c={})
    return new RpcRequest(requestData, this, metadata);
  }

  /**
   * Returns the full method name.
   * [was: getName]
   * @returns {string}
   */
  getName() { return this.name; }
}

/** @type {UnaryMethodDescriptor} Waa/Create method [was: Lw3] */
export const WAA_CREATE_METHOD = new UnaryMethodDescriptor(
  "/google.internal.waa.v1.Waa/Create",
  Xs, WaaCreateResponse,
  (request) => request.Eg(),
  Td(WaaCreateResponse)
); // was: Lw3

/** @type {UnaryMethodDescriptor} Waa/GenerateIT method [was: Nj7] */
export const WAA_GENERATE_IT_METHOD = new UnaryMethodDescriptor(
  "/google.internal.waa.v1.Waa/GenerateIT",
  V3, WaaGenerateITResponse,
  (request) => request.Eg(),
  Td(WaaGenerateITResponse)
); // was: Nj7

// =========================================================================
// gRPC response stream   [was: qTm, lines 63115-63137]
// =========================================================================

/**
 * gRPC response stream with per-channel event listeners.
 * Supports "data", "metadata", "status", "end", and "error" channels.
 *
 * [was: qTm]
 */
export class GrpcResponseStream { // was: qTm
  /**
   * @param {Object} config - { MB, xhr } [was: Q]
   * @param {*} context [was: c]
   */
  constructor(config, context) { // was: constructor(Q, c)
    /** @type {Function[]} Data listeners [was: this.O] */
    this.dataListeners = [];

    /** @type {Function[]} Metadata listeners [was: this.j] */
    this.metadataListeners = [];

    /** @type {Function[]} Status listeners [was: this.K] */
    this.statusListeners = [];

    /** @type {Function[]} End listeners [was: this.A] */
    this.endListeners = [];

    /** @type {Function[]} Error listeners [was: this.W] */
    this.errorListeners = [];

    /** @type {*} Whether streaming mode is enabled [was: this.D] */
    this.isStreaming = config.MB; // was: this.D = Q.MB

    /** @type {*} Context [was: this.J] */
    this.context = context; // was: this.J = c

    /** @type {XMLHttpRequest} XHR handle [was: this.xhr] */
    this.xhr = config.xhr;

    if (this.isStreaming) wireStreamCallbacks(this); // Wire up streaming
  }

  /**
   * Add a listener for the given channel.
   * [was: Dn]
   * @param {string} channel - "data"|"metadata"|"status"|"end"|"error" [was: Q]
   * @param {Function} listener [was: c]
   */
  addListener(channel, listener) { // was: Dn(Q, c)
    if (channel === "data") this.dataListeners.push(listener);
    else if (channel === "metadata") this.metadataListeners.push(listener);
    else if (channel === "status") this.statusListeners.push(listener);
    else if (channel === "end") this.endListeners.push(listener);
    else if (channel === "error") this.errorListeners.push(listener);
  }

  /**
   * Remove a listener from the given channel.
   * [was: removeListener]
   * @param {string} channel [was: Q]
   * @param {Function} listener [was: c]
   * @returns {this}
   */
  removeListener(channel, listener) { // was: removeListener(Q, c)
    if (channel === "data") removeFromArray(this.dataListeners, listener);
    else if (channel === "metadata") removeFromArray(this.metadataListeners, listener);
    else if (channel === "status") removeFromArray(this.statusListeners, listener);
    else if (channel === "end") removeFromArray(this.endListeners, listener);
    else if (channel === "error") removeFromArray(this.errorListeners, listener);
    return this;
  }

  /**
   * Cancel the underlying request.
   * [was: cancel]
   */
  cancel() { // was: cancel()
    this.xhr.abort();
  }
}

/**
 * Synthetic error used to capture the async call stack at the point
 * where a gRPC call was initiated.
 *
 * [was: pBw]
 */
export class AsyncStackError extends Error { // was: pBw extends Error
  constructor() {
    super();
    this.name = "AsyncStack";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// XhrConfig class defined in core/event-registration.js [was: g.Yd]
// FetchXhr class defined in network/request.js [was: pZ]

// =========================================================================
// URI / QueryData   [was: g.KG, XJ, lines 63288-63471]
// =========================================================================

// URI.prototype.toString, .resolve, .clone, and QueryData methods are
// standard Closure Library URI and XJ utilities. They are left with
// their prototype assignments intact rather than converted to classes,
// as they are deeply intertwined with the Closure inheritance chain.

// (See source lines 63288-63471 for the full implementation.)

// EventHandler class defined in core/event-handler.js [was: g.Hx]
