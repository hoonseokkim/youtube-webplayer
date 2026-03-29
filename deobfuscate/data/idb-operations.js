/**
 * idb-operations.js -- IDB CRUD wrappers, database lifecycle, config
 * persistence, PubSub infrastructure, network status, networkless logging,
 * touch-tap handler, dependency injection, application lifecycle state machine,
 * GEL transport payload store, error fingerprinting, and player constants.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines 67438-69408
 *
 * Provides:
 *  - IDB cursor result wrapper (s6x)
 *  - IDB connection class (uv_) with add/clear/close/count/delete/get/getAll/put
 *  - IDB object-store wrapper (gH7) with index/keyPath/autoIncrement support
 *  - IDB transaction wrapper (wwm) with done-promise & abort handling
 *  - IDB index wrapper (Vx7) with count/delete/get/getAll
 *  - IDB cursor wrapper (lc0) with delete/getValue/update
 *  - Database definition class (Bp7) with open/delete and retry logic
 *  - YtIdbMeta singleton database
 *  - Shared database subclass (ro0) with shared/non-shared routing
 *  - GCF config store (IZ7) with hot/cold timestamp indexes
 *  - GCF config manager (BF) with hot-update callbacks
 *  - TextEncoder wrapper (C7_)
 *  - Service worker request/response state keys (spd/LnX)
 *  - Pub/Sub2 instance and topic registry
 *  - Networkless logging class (Ddm) with write-then-send, send-then-write,
 *    send-and-write patterns, throttle, retry
 *  - Client event types enum (P_y) -- 500+ named event constants
 *  - Service worker logs database (Idx)
 *  - CFR endpoint tracker (hD) for caching first-request results
 *  - Network status manager (zU) with online/offline detection
 *  - Public network status wrapper (g.$p) with rate limiting
 *  - Networkless logging implementation (yQR) with error handling
 *  - Innertube config (g.AZ) readiness check
 *  - Pub/Sub instance and synchronous pub/sub registry
 *  - DOM container helpers (Hx0, lu)
 *  - Touch-tap gesture handler (Npn)
 *  - Dependency injection (InjectionToken, Injector, $qd)
 *  - Application lifecycle state machine (ix0, pkK)
 *  - GEL transport payload store (fL) with smart-extract matching
 *  - Visual element (VE) builder class (VF)
 *  - Screen logging utilities
 *  - Error fingerprinting patterns (qFX)
 *  - Error reporting pipeline (I5x, rfw)
 *  - Parallel/serial/performOnce command tokens
 *  - Screen-created event (vCm)
 *  - Component descriptor class (CP)
 *  - EventTarget-backed W1 pub/sub
 *  - Player aspect ratio & playback rate constants
 *
 * @module data/idb-operations
 */

import { storageGet } from '../core/attestation.js';  // was: g.UM
import { AsyncQueue, expandUrlTemplate } from '../core/bitstream-helpers.js';  // was: g.$K, g.lZ
import { EventTargetBase, getConfig, logError } from '../core/composition-helpers.js';  // was: g.$R, g.v, g.Zp
import { decodeUTF8 } from '../core/utf8.js';  // was: g.o8
import { hasBufferedData } from '../media/codec-helpers.js';  // was: g.Jm
import { logDrmEvent } from '../media/track-manager.js';  // was: g.HP
import { EXTENSION_GUARD } from '../proto/messages-core.js';  // was: g.xJ
import { logSeekEvent } from '../ui/progress-bar-impl.js';  // was: g.Nc
import { getLegacyPubsub } from './gel-core.js';  // was: g.Ru
import { advanceValueCursor, getExperimentBoolean, openIndexCursor, runTransaction } from './idb-transactions.js';  // was: g.Qb, g.P, g.cF, g.MD
import { disposeApp } from '../player/player-events.js'; // was: WA
import { setRoleLink } from '../core/bitstream-helpers.js'; // was: c7
import { adsEngagementPanelRenderer } from '../core/misc-helpers.js'; // was: M5
import { isWebClient } from './performance-profiling.js'; // was: XC
import { SlotIdFulfilledNonEmptyTrigger } from '../ads/ad-trigger-types.js'; // was: FD
import { NetworkMonitor } from './session-storage.js'; // was: pG
import { clear, splice, concat } from '../core/array-utils.js';
import { wrapIdbRequest, openDatabase, createObjectStore, createIndex } from './idb-transactions.js';
import { IdbKnownError, MissingObjectStoresError } from '../core/errors.js';
import { contains, stringToUtf8ByteArray, toString } from '../core/string-utils.js';
import { Disposable } from '../core/disposable.js';
import { getObjectByPath } from '../core/type-helpers.js';
import { listen } from '../core/composition-helpers.js';
import { getLocalStorage } from './storage.js';
import { PlayerError } from '../ui/cue-manager.js';
import { generateComponentId } from './visual-element-tracking.js';
// TODO: resolve g.CU
// TODO: resolve g.DH
// TODO: resolve g.Gk
// TODO: resolve g.K$
// TODO: resolve g.LU
// TODO: resolve g.ML
// TODO: resolve g.SG
// TODO: resolve g.Uq
// TODO: resolve g.Zo
// TODO: resolve g.coldHashData
// TODO: resolve g.h
// TODO: resolve g.handleError
// TODO: resolve g.hotHashData
// TODO: resolve g.hotUpdateCallbacks
// TODO: resolve g.jF
// TODO: resolve g.l6
// TODO: resolve g.xZ

// ============================================================================
// IDB Cursor Result  (line 67438)
// ============================================================================

/**
 * Wraps an IDB request + cursor pair for iteration results.
 *
 * [was: s6x]
 */
export class IdbCursorResult { // was: s6x
  constructor(request, cursor) {
    this.request = request;
    this.cursor = cursor;
  }
}

// ============================================================================
// IDB Connection  (line 67445)
// ============================================================================

/**
 * High-level wrapper around a native `IDBDatabase` connection, providing
 * promise-based CRUD helpers that internally delegate to `runTransaction` (the
 * transaction runner).
 *
 * [was: uv_]
 */
export class IdbConnection { // was: uv_
  constructor(database, options) { // was: Q, c
    this.database = database; // was: this.W = Q
    this.options = options;
    this.transactionCount = 0;
    this.openedAt = Math.round((0, g.h)()); // was: this.A
    this.isClosed = false; // was: this.O = !1
  }

  add(storeName, value, key) { // was: Q, c, W
    return runTransaction(this, [storeName], {
      mode: "readwrite",
      g3: true, // was: !0
      commit: shouldAutoCommit() // was: Cg()
    }, (txn) => txn.objectStore(storeName).add(value, key));
  }

  clear(storeName) {
    return runTransaction(this, [storeName], {
      mode: "readwrite",
      g3: true // was: !0
    }, (txn) => txn.objectStore(storeName).clear());
  }

  close() {
    this.database.close(); // was: this.W.close()
    this.options?.closed && this.options.closed();
  }

  count(storeName, query) { // was: Q, c
    return runTransaction(this, [storeName], {
      mode: "readonly",
      g3: true, // was: !0
      commit: shouldAutoCommit() // was: Cg()
    }, (txn) => txn.objectStore(storeName).count(query));
  }

  delete(storeName, key) { // was: Q, c
    return runTransaction(this, [storeName], {
      mode: "readwrite",
      g3: true, // was: !0
      commit: shouldAutoCommit() && !(key instanceof IDBKeyRange) // was: Cg() && !(c instanceof IDBKeyRange)
    }, (txn) => txn.objectStore(storeName).delete(key));
  }

  get(storeName, key) { // was: Q, c
    return runTransaction(this, [storeName], {
      mode: "readonly",
      g3: true, // was: !0
      commit: shouldAutoCommit() // was: Cg()
    }, (txn) => txn.objectStore(storeName).get(key));
  }

  getAll(storeName, query, count) { // was: Q, c, W
    return runTransaction(this, [storeName], {
      mode: "readonly",
      g3: true // was: !0
    }, (txn) => txn.objectStore(storeName).getAll(query, count));
  }

  put(storeName, value, key) { // was: Q, c, W
    return runTransaction(this, [storeName], {
      mode: "readwrite",
      g3: true, // was: !0
      commit: shouldAutoCommit() // was: Cg()
    }, (txn) => txn.objectStore(storeName).put(value, key));
  }

  objectStoreNames() {
    return Array.from(this.database.objectStoreNames); // was: this.W.objectStoreNames
  }

  getName() {
    return this.database.name; // was: this.W.name
  }
}

// ============================================================================
// IDB Object Store Wrapper  (line 67512)
// ============================================================================

/**
 * Promise-based wrapper around a native `IDBObjectStore`.
 *
 * [was: gH7]
 */
export class IdbObjectStoreWrapper { // was: gH7
  constructor(nativeStore) { // was: Q
    this.nativeStore = nativeStore; // was: this.W = Q
  }

  add(value, key) { // was: Q, c
    return wrapIdbRequest(this.nativeStore.add(value, key)); // was: hN(...)
  }

  autoIncrement() {
    return this.nativeStore.autoIncrement;
  }

  clear() {
    return wrapIdbRequest(this.nativeStore.clear()).then(() => {}); // was: hN(...)
  }

  count(query) {
    return wrapIdbRequest(this.nativeStore.count(query));
  }

  delete(key) {
    return key instanceof IDBKeyRange
      ? deleteByKeyRange(this, key) // was: fc7(this, Q)
      : wrapIdbRequest(this.nativeStore.delete(key)); // was: hN(...)
  }

  get(key) {
    return wrapIdbRequest(this.nativeStore.get(key));
  }

  getAll(query, count) { // was: Q, c
    return "getAll" in IDBObjectStore.prototype
      ? wrapIdbRequest(this.nativeStore.getAll(query, count))
      : getAllFallback(this, query, count); // was: vH7(this, Q, c)
  }

  index(name) { // was: Q
    try {
      return new IdbIndexWrapper(this.nativeStore.index(name)); // was: new Vx7(...)
    } catch (error) { // was: c
      if (error instanceof Error && error.name === "NotFoundError")
        throw new IndexNotFoundError(name, this.nativeStore.name); // was: new aC(Q, this.W.name)
      throw error;
    }
  }

  getName() {
    return this.nativeStore.name;
  }

  keyPath() {
    return this.nativeStore.keyPath;
  }

  put(value, key) { // was: Q, c
    return wrapIdbRequest(this.nativeStore.put(value, key));
  }
}

// ============================================================================
// IDB Transaction Wrapper  (line 67557)
// ============================================================================

/**
 * Wraps a native `IDBTransaction`, exposing a `.done` promise that resolves
 * on "complete" and rejects on "error" or "abort".
 *
 * [was: wwm]
 */
export class IdbTransactionWrapper { // was: wwm
  constructor(nativeTransaction) { // was: Q
    this.nativeTransaction = nativeTransaction; // was: this.W = Q
    this.storeCache = new Map(); // was: this.O = new Map
    this.aborted = false; // was: this.aborted = !1
    this.done = new Promise((resolve, reject) => { // was: c, W
      this.nativeTransaction.addEventListener("complete", () => {
        resolve();
      });
      this.nativeTransaction.addEventListener("error", (event) => { // was: m
        event.currentTarget === event.target && reject(this.nativeTransaction.error);
      });
      this.nativeTransaction.addEventListener("abort", () => {
        const txnError = this.nativeTransaction.error; // was: m
        if (txnError) {
          reject(txnError);
        } else if (!this.aborted) {
          const ErrorCtor = IdbKnownError; // was: m = g.fg
          const storeNames = this.nativeTransaction.objectStoreNames; // was: K
          const names = []; // was: T
          for (let i = 0; i < storeNames.length; i++) { // was: r
            const storeName = storeNames.item(i); // was: U
            if (storeName === null)
              throw Error("Invariant: item in DOMStringList is null");
            names.push(storeName);
          }
          const abortError = new ErrorCtor("UNKNOWN_ABORT", { // was: m
            objectStoreNames: names.join(),
            dbName: this.nativeTransaction.EventHandler.name,
            mode: this.nativeTransaction.mode
          });
          reject(abortError);
        }
      });
    });
  }

  abort() {
    this.nativeTransaction.abort();
    this.aborted = true; // was: !0
    throw new IdbKnownError("EXPLICIT_ABORT");
  }

  commit() {
    this.aborted || this.nativeTransaction.commit?.();
  }

  objectStore(name) { // was: Q
    const nativeStore = this.nativeTransaction.objectStore(name); // was: Q = this.W.objectStore(Q)
    let wrapper = this.storeCache.get(nativeStore); // was: c
    if (!wrapper) {
      wrapper = new IdbObjectStoreWrapper(nativeStore); // was: c = new gH7(Q)
      this.storeCache.set(nativeStore, wrapper);
    }
    return wrapper;
  }
}

// ============================================================================
// IDB Index Wrapper  (line 67613)
// ============================================================================

/**
 * Promise-based wrapper around `IDBIndex`.
 *
 * [was: Vx7]
 */
export class IdbIndexWrapper { // was: Vx7
  constructor(nativeIndex) { // was: Q
    this.nativeIndex = nativeIndex; // was: this.W = Q
  }

  count(query) {
    return wrapIdbRequest(this.nativeIndex.count(query)); // was: hN(...)
  }

  delete(query) { // was: Q
    return openIndexCursor(this, { query }, (cursor) =>
      cursor.delete().then(() => advanceValueCursor(cursor))
    );
  }

  get(key) {
    return wrapIdbRequest(this.nativeIndex.get(key));
  }

  getAll(query, count) { // was: Q, c
    return "getAll" in IDBIndex.prototype
      ? wrapIdbRequest(this.nativeIndex.getAll(query, count))
      : getAllFromIndexFallback(this, query, count); // was: PFK(this, Q, c)
  }

  keyPath() {
    return this.nativeIndex.keyPath;
  }

  unique() {
    return this.nativeIndex.unique;
  }
}

// ============================================================================
// IDB Cursor Wrapper  (line 67638)
// ============================================================================

/**
 * Promise-based wrapper around an IDB cursor, supporting delete/update.
 *
 * [was: lc0]
 */
export class IdbCursorWrapper { // was: lc0
  constructor(request, cursor) {
    this.request = request;
    this.cursor = cursor;
  }

  delete() {
    return wrapIdbRequest(this.cursor.delete()).then(() => {}); // was: hN(...)
  }

  getValue() {
    return this.cursor.value;
  }

  update(value) { // was: Q
    return wrapIdbRequest(this.cursor.update(value));
  }
}

// ============================================================================
// Database Definition  (line 67655)
// ============================================================================

/**
 * Defines and manages an IndexedDB database: holds name, version, upgrade
 * callback, and handles open-with-retry, version-mismatch recovery, and
 * missing-object-store detection.
 *
 * [was: Bp7]
 */
export class DatabaseDefinition { // was: Bp7
  constructor(name, options) { // was: Q, c
    this.name = name;
    this.options = options;
    this.isActive = true; // was: this.A = !0
    this.remakeRetries = 0; // was: this.K
    this.reopenRetries = 0; // was: this.j = 0
  }

  /**
   * Open the database, optionally with upgrade/version overrides.
   * [was: O]
   */
  openDatabase(name, version, overrides = {}) { // was: O(Q, c, W={})
    return openIdbDatabase(name, version, overrides); // was: zB7(Q, c, W)
  }

  /**
   * Delete the named database.
   * [was: delete]
   */
  delete(options = {}) { // was: Q={}
    return deleteIdbDatabase(this.name, options); // was: WF(this.name, Q)
  }

  /**
   * Opens the database with retry logic for missing object stores and
   * version-error recovery.
   * [was: open]
   */
  open() {
    if (!this.isActive) // was: !this.A
      throw createDatabaseClosedError(this); // was: CF3(this)
    if (this.pendingOpen) // was: this.W
      return this.pendingOpen;

    let openPromise; // was: Q
    const clearPending = () => { // was: c
      this.pendingOpen === openPromise && (this.pendingOpen = undefined); // was: void 0
    };
    const callbacks = { // was: W
      blocking: (conn) => { // was: K
        conn.close();
      },
      closed: clearPending,
      hZ: clearPending,
      upgrade: this.options.upgrade
    };

    const attemptOpen = async () => { // was: m
      const stackTrace = Error().stack ?? ""; // was: K
      try {
        const connection = await this.openDatabase(this.name, this.options.version, callbacks); // was: U
        const EventHandler = connection; // was: T
        const config = this.options; // was: r
        const missingStores = []; // was: I
        for (const storeName of Object.keys(config.ML)) { // was: X
          const { d0: minVersion, fre: maxVersion = Number.MAX_VALUE } = config.ML[storeName]; // was: A, e
          if (!(EventHandler.database.version >= minVersion) || EventHandler.database.version >= maxVersion || EventHandler.database.objectStoreNames.contains(storeName))
            continue;
          missingStores.push(storeName);
        }
        if (missingStores.length !== 0) {
          const expectedStores = Object.keys(this.options.ML); // was: X
          const foundStores = connection.objectStoreNames(); // was: A
          if (this.reopenRetries < getConfigInt("ytidb_reopen_db_retries", 0)) // was: Y3(...)
            return (
              this.reopenRetries++,
              connection.close(),
              reportIdbError(new IdbKnownError("DB_REOPENED_BY_MISSING_OBJECT_STORES", { // was: bK(...)
                dbName: this.name,
                expectedObjectStores: expectedStores,
                foundObjectStores: foundStores
              })),
              attemptOpen()
            );
          if (this.remakeRetries < getConfigInt("ytidb_remake_db_retries", 1))
            return (
              this.remakeRetries++,
              await this.delete(),
              reportIdbError(new IdbKnownError("DB_DELETED_BY_MISSING_OBJECT_STORES", {
                dbName: this.name,
                expectedObjectStores: expectedStores,
                foundObjectStores: foundStores
              })),
              attemptOpen()
            );
          throw new MissingObjectStoresError(foundStores, expectedStores); // was: new eVd(A, X)
        }
        return connection;
      } catch (error) { // was: U
        if (
          error instanceof DOMException ? error.name === "VersionError" :
          "DOMError" in self && error instanceof DOMError ? error.name === "VersionError" :
          error instanceof Object && "message" in error && error.message === "An attempt was made to open a database using a lower version than the existing version."
        ) {
          const fallbackConn = await this.openDatabase(this.name, undefined, { // was: K
            ...callbacks,
            upgrade: undefined // was: void 0
          });
          const detectedVersion = fallbackConn.database.version; // was: T
          if (this.options.version !== undefined && detectedVersion > this.options.version + 1) // was: void 0
            throw (fallbackConn.close(), this.isActive = false, createDatabaseClosedError(this, detectedVersion)); // was: !1
          return fallbackConn;
        }
        clearPending();
        if (error instanceof Error && !getExperimentBoolean("ytidb_async_stack_killswitch"))
          error.stack = `${error.stack}\n${stackTrace.substring(stackTrace.indexOf("\n") + 1)}`;
        throw wrapIdbError(error, this.name, "", this.options.version ?? -1); // was: GE(...)
      }
    };

    return (this.pendingOpen = openPromise = attemptOpen());
  }
}

// ============================================================================
// YtIdbMeta Singleton  (line 67744)
// ============================================================================

/**
 * The meta-database that tracks all user-scoped databases.
 *
 * [was: Kq]
 */
export const ytIdbMeta = new DatabaseDefinition("YtIdbMeta", { // was: Kq
  ML: {
    databases: { d0: 1 }
  },
  upgrade(transaction, versionCheck) { // was: Q, c
    versionCheck(1) && createObjectStore(transaction, "databases", { // was: JN(Q, ...)
      keyPath: "actualName"
    });
  }
});

// ============================================================================
// Shared Database Subclass  (line 67764)
// ============================================================================

/**
 * Extends `DatabaseDefinition` for databases that may be shared across
 * origins; delegates open/delete to shared or non-shared helpers.
 *
 * [was: ro0]
 */
export class SharedDatabaseDefinition extends DatabaseDefinition { // was: ro0
  constructor(name, options) { // was: Q, c
    super(name, options);
    this.options = options;
    registerDatabaseName(name); // was: gl(Q)
  }

  openDatabase(name, version, overrides = {}) { // was: O
    return (this.options.shared ? openSharedIdb : openNonSharedIdb)(name, version, { // was: WKO : co3
      ...overrides
    });
  }

  delete(options = {}) { // was: Q={}
    return (this.options.shared ? deleteSharedIdb : deleteNonSharedIdb)(this.name, options); // was: oCx : m6O
  }
}

// ============================================================================
// GCF Config Store  (line 67780)
// ============================================================================

/**
 * Google Config Framework database: stores hot + cold configs with
 * timestamp-indexed records.
 *
 * [was: IZ7]
 */
export const gcfConfigDb = createDatabase("ytGcfConfig", { // was: el("ytGcfConfig", ...)
  ML: {
    coldConfigStore: { d0: 1 },
    hotConfigStore: { d0: 1 }
  },
  shared: false, // was: !1
  upgrade(transaction, versionCheck) { // was: Q, c
    if (versionCheck(1)) {
      createIndex( // was: ks(JN(...), ...)
        createObjectStore(transaction, "hotConfigStore", {
          keyPath: "key",
          autoIncrement: true // was: !0
        }),
        "hotTimestampIndex",
        "timestamp"
      );
      createIndex(
        createObjectStore(transaction, "coldConfigStore", {
          keyPath: "key",
          autoIncrement: true // was: !0
        }),
        "coldTimestampIndex",
        "timestamp"
      );
    }
  },
  version: 1
});

// ============================================================================
// GCF Config Manager Service  (line 67802)
// ============================================================================

/**
 * Manages hot-update callbacks for the Google Config Framework in-memory
 * config, extending disposable.
 *
 * [was: xdK]
 */
export class GcfConfigCallbackManager extends Disposable { // was: xdK
  constructor() {
    super();
    this.registeredCallbacks = []; // was: this.O = []
    this.globalCallbackList = []; // was: this.W = []
    const existing = getObjectByPath("yt.gcf.config.hotUpdateCallbacks"); // was: Q
    if (existing) {
      this.registeredCallbacks = [...existing];
      this.globalCallbackList = existing;
    } else {
      this.globalCallbackList = [];
      setGlobal("yt.gcf.config.hotUpdateCallbacks", this.globalCallbackList);
    }
  }

  disposeApp() {
    for (const callback of this.registeredCallbacks) { // was: c
      const list = this.globalCallbackList; // was: Q
      const idx = list.indexOf(callback); // was: W
      idx >= 0 && list.splice(idx, 1);
    }
    this.registeredCallbacks.length = 0;
    super.disposeApp();
  }
}

// ============================================================================
// GCF Config Manager  (line 67823)
// ============================================================================

/**
 * Singleton that orchestrates the Google Config Framework: holds cold/hot
 * hash data, exposes an `Rk` service interface for external consumers.
 *
 * [was: BF]
 */
export class GcfConfigManager { // was: BF
  constructor() {
    this.isInvalidated = false; // was: this.K = !1
    this.coldRetryCount = 0; // was: this.A
    this.hotRetryCount = 0; // was: this.j = 0
    this.callbackManager = new GcfConfigCallbackManager(); // was: this.D = new xdK
    this.serviceInterface = { // was: this.Rk
      ag0: () => { this.isInvalidated = true; }, // was: !0
      mYH: () => this.cachedRawConfig, // was: this.W
      x6H: (config) => { applyHotConfig(this, config); }, // was: xw(this, Q)
      setRoleLink: (hash) => { this.setHotHashData(hash); }, // was: this.c7(Q)
      AEM: (data) => { processConfig(this, data); }, // was: qe(this, Q)
      lD: () => this.coldHashData,
      d4: () => this.hotHashData,
      KVC: () => this.configState, // was: this.O
      pGF: () => getGcfNonce(), // was: nq()
      zJ2: () => getRawHotConfig(), // was: DM()
      ixe: () => getObjectByPath("yt.gcf.config.coldHashData"),
      Ox2: () => getObjectByPath("yt.gcf.config.hotHashData"),
      Lmy: () => { invalidateConfig(this); }, // was: D6w(this)
      WmF: () => {
        this.setHotHashData(undefined); // was: void 0
        teardownConfig(this); // was: tD(this)
        delete GcfConfigManager.instance;
      },
      QgM: (count) => { this.coldRetryCount = count; }, // was: Q
      wGF: () => this.coldRetryCount
    };
  }

  /**
   * Returns the raw hot-config group.
   * [was: wU]
   */
  getRawHotConfigGroup() { // was: wU
    return getRawHotConfig() ?? getConfig("RAW_HOT_CONFIG_GROUP"); // was: DM() ?? g.v(...)
  }

  /**
   * Sets the hot hash data and publishes it globally.
   * [was: c7]
   */
  setHotHashData(hashData) { // was: Q
    this.hotHashData = hashData;
    setGlobal("yt.gcf.config.hotHashData", this.hotHashData || null);
  }
}

// ============================================================================
// TextEncoder Wrapper  (line 67879)
// ============================================================================

/**
 * Cross-browser text-to-bytes encoder. Uses native `TextEncoder` when
 * available, otherwise falls back to manual UTF-8 encoding via `g.Gk`.
 *
 * [was: C7_]
 */
const nativeTextEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null; // was: qLO
export const encodeText = nativeTextEncoder // was: C7_
  ? (text) => nativeTextEncoder.encode(text) // was: Q => qLO.encode(Q)
  : (text) => { // was: Q => { ... }
    const bytes = stringToUtf8ByteArray(text); // was: Q = g.Gk(Q)
    const result = new Uint8Array(bytes.length); // was: c
    for (let i = 0; i < result.length; i++) // was: W
      result[i] = bytes[i];
    return result;
  };

// ============================================================================
// Service Worker Request / Response State Keys  (line 67888)
// ============================================================================

/**
 * Maps endpoint types to storage keys for "sent" (request) state.
 * [was: spd]
 */
export const swRequestStateKeys = { // was: spd
  next: "wn_s",
  browse: "br_s",
  search: "sr_s",
  reel: "r_wrs",
  player: "ps_s"
};

/**
 * Maps endpoint types to storage keys for "received" (response) state.
 * [was: LnX]
 */
export const swResponseStateKeys = { // was: LnX
  next: "wn_r",
  browse: "br_r",
  search: "sr_r",
  reel: "r_wrr",
  player: "ps_r"
};

// ============================================================================
// PubSub2 Instance  (lines 67913-67925)
// ============================================================================

/**
 * Global PubSub2 singleton and topic registries.
 * [was: nem, wU, bV, aZw]
 */
export const pubsub2Instance = getObjectByPath("ytPubsub2Pubsub2Instance") || new AsyncQueue(); // was: nem
AsyncQueue.prototype.subscribe = AsyncQueue.prototype.subscribe;
AsyncQueue.prototype.unsubscribeByKey = AsyncQueue.prototype.bU;
AsyncQueue.prototype.publish = AsyncQueue.prototype.publish;
AsyncQueue.prototype.clear = AsyncQueue.prototype.clear;
setGlobal("ytPubsub2Pubsub2Instance", pubsub2Instance);

export const pubsub2SubscribedKeys = getObjectByPath("ytPubsub2Pubsub2SubscribedKeys") || {}; // was: wU
setGlobal("ytPubsub2Pubsub2SubscribedKeys", pubsub2SubscribedKeys);

export const pubsub2TopicToKeys = getObjectByPath("ytPubsub2Pubsub2TopicToKeys") || {}; // was: bV
setGlobal("ytPubsub2Pubsub2TopicToKeys", pubsub2TopicToKeys);

export const pubsub2IsAsync = getObjectByPath("ytPubsub2Pubsub2IsAsync") || {}; // was: aZw
setGlobal("ytPubsub2Pubsub2IsAsync", pubsub2IsAsync);
setGlobal("ytPubsub2Pubsub2SkipSubKey", null);

// ============================================================================
// Request Compression Config  (line 67926)
// ============================================================================

export const maxBodySizeToCompress = getConfigInt("max_body_size_to_compress", 500000); // was: hQw = Y3(...)
export const minBodySizeToCompress = getConfigInt("min_body_size_to_compress", 500); // was: zQm
let compressionRequestId = 0; // was: M0R

// ============================================================================
// Networkless Logging  (line 67929)
// ============================================================================

/**
 * Core networkless-logging engine: writes requests to IDB for offline
 * delivery and retries them when the network becomes available.
 * Supports three delivery modes: write-then-send, send-then-write,
 * and send-and-write (parallel).
 *
 * [was: Ddm]
 */
export class NetworklessLoggingEngine { // was: Ddm
  constructor(config) { // was: Q
    this.isInitialized = false; // was: this.UM = this.W = !1
    this.isNetworkAvailable = false;
    this.potentialEsfErrorCounter = 0;
    this.throttleTimerId = 0; // was: this.O = 0
    this.handleError = () => {};
    this.onWarning = () => {}; // was: this.zj = () => {}
    this.now = Date.now;
    this.isDedupEnabled = false; // was: this.DH = !1
    this.serviceInterface = { // was: this.Rk
      MQH: (dbName) => { this.currentDbName = dbName; }, // was: this.o8 = c
      BjG: () => { this.throttleSend(); }, // was: this.A()
      adsEngagementPanelRenderer: () => { this.cancelThrottle(); }, // was: this.j()
      isWebClient: async (request) => { await this.immediateSend(request); }, // was: this.XC(c)
      Kz: (request, maxAge) => this.isRequestValid(request, maxAge), // was: this.Kz(c, W)
      x7: () => { this.retryQueuedRequests(); } // was: this.x7()
    };
    this.throttleIntervalMs = config.EXTENSION_GUARD ?? 100;
    this.batchMultiplier = config.hasBufferedData ?? 1;
    this.maxRequestAge = config.Uq ?? 2592000000; // 30 days
    this.queuedRequestMaxAge = config.xZ ?? 120000;
    this.retryDelayMs = config.logDrmEvent ?? 5000;
    this.currentDbName = config.o8 ?? undefined; // was: void 0
    this.enableRetry = !!config.Ru;
    this.esfErrorSampleRate = config.l6 ?? 0.1;
    this.maxEsfErrors = config.logSeekEvent ?? 10;
    config.handleError && (this.handleError = config.handleError);
    config.PlayerModule && (this.onWarning = config.PlayerModule);
    config.DH && (this.isDedupEnabled = config.DH);
    config.UM && (this.isInitialized = config.UM);
    this.featureCheck = config.SG;
    this.timerService = config.jF;
    this.storageService = config.LU;
    this.networkService = config.CU;
    this.sendFunction = config.Zo;
    this.onlineEventName = config.K$;
    this.offlineEventName = config.lZ;
    isIdbSupported(this) && (!this.featureCheck || this.featureCheck("networkless_logging")) && initNetworklessLogging(this); // was: O3(this) && ... && RQd(this)
  }

  writeThenSend(url, options = {}) { // was: Q, c={}
    if (isIdbSupported(this) && this.isNetworkAvailable) { // was: O3(this) && this.W
      const record = { // was: W
        url,
        options,
        timestamp: this.now(),
        status: "NEW",
        sendCount: 0
      };
      this.storageService.set(record, this.currentDbName).then((id) => { // was: m
        record.id = id;
        this.networkService.KU() && this.immediateSend(record); // was: this.XC(W)
      }).catch((error) => { // was: m
        this.immediateSend(record);
        reportNetworklessError(this, error); // was: fq(this, m)
      });
    } else {
      this.sendFunction(url, options); // was: this.Zo(Q, c)
    }
  }

  sendThenWrite(url, options = {}, skipRetry) { // was: Q, c={}, W
    if (isIdbSupported(this) && this.isNetworkAvailable) {
      const record = {
        url,
        options,
        timestamp: this.now(),
        status: "NEW",
        sendCount: 0
      };
      this.featureCheck && this.featureCheck("nwl_skip_retry") && (record.skipRetry = skipRetry);
      if (this.networkService.KU() || (this.featureCheck && this.featureCheck("nwl_aggressive_send_then_write") && !record.skipRetry)) {
        if (!record.skipRetry) {
          const originalOnError = options.onError ? options.onError : () => {};
          options.onError = async (errorType, response) => { // was: T, r
            await this.storageService.set(record, this.currentDbName).catch((err) => { // was: U
              reportNetworklessError(this, err);
            });
            originalOnError(errorType, response);
          };
        }
        this.sendFunction(url, options, record.skipRetry);
      } else {
        this.storageService.set(record, this.currentDbName).catch((error) => { // was: K
          this.sendFunction(url, options, record.skipRetry);
          reportNetworklessError(this, error);
        });
      }
    } else {
      const shouldSkip = this.featureCheck && this.featureCheck("nwl_skip_retry") && skipRetry;
      this.sendFunction(url, options, shouldSkip);
    }
  }

  sendAndWrite(url, options = {}) { // was: Q, c={}
    if (isIdbSupported(this) && this.isNetworkAvailable) {
      const record = {
        url,
        options,
        timestamp: this.now(),
        status: "NEW",
        sendCount: 0
      };
      let hasCompleted = false; // was: m = !1
      const originalOnSuccess = options.onSuccess ? options.onSuccess : () => {};
      record.options.onSuccess = (responseText, response) => { // was: T, r
        record.id !== undefined // was: void 0
          ? this.storageService.GJ(record.id, this.currentDbName)
          : (hasCompleted = true); // was: m = !0
        this.networkService.LL && this.featureCheck && this.featureCheck("vss_network_hint") && this.networkService.LL(true); // was: !0
        originalOnSuccess(responseText, response);
      };
      this.sendFunction(record.url, record.options, undefined, true); // was: void 0, !0
      this.storageService.set(record, this.currentDbName).then((id) => { // was: T
        record.id = id;
        hasCompleted && this.storageService.GJ(record.id, this.currentDbName);
      }).catch((error) => { // was: T
        reportNetworklessError(this, error);
      });
    } else {
      this.sendFunction(url, options, undefined, true); // was: void 0, !0
    }
  }

  /**
   * Begin throttled sending of queued requests.
   * [was: A]
   */
  throttleSend() {
    if (!isIdbSupported(this))
      throw Error("IndexedDB is not supported: throttleSend");
    if (!this.throttleTimerId) {
      this.throttleTimerId = this.timerService.SlotIdFulfilledNonEmptyTrigger(async () => {
        const record = await this.storageService.GK("NEW", this.currentDbName);
        if (record) {
          await this.immediateSend(record);
          this.throttleTimerId && (this.throttleTimerId = 0, this.throttleSend());
        } else {
          this.cancelThrottle();
        }
      }, this.throttleIntervalMs);
    }
  }

  /**
   * Cancel the throttle timer.
   * [was: j]
   */
  cancelThrottle() {
    this.timerService.Q$(this.throttleTimerId);
    this.throttleTimerId = 0;
  }

  /**
   * Immediately send a single record.
   * [was: XC]
   */
  async immediateSend(record) { // was: Q
    if (!isIdbSupported(this))
      throw Error("IndexedDB is not supported: immediateSend");
    if (record.id !== undefined) { // was: void 0
      const found = await this.storageService.nZ(record.id, this.currentDbName);
      if (!found)
        this.onWarning(Error("The request cannot be found in the database."));
    }
    if (this.isRequestValid(record, this.maxRequestAge)) {
      if (!record.skipRetry)
        record = prepareRetryRecord(this, record); // was: p_0(this, Q)
      if (record) {
        record.skipRetry && record.id !== undefined && await this.storageService.GJ(record.id, this.currentDbName); // was: void 0
        this.sendFunction(record.url, record.options, !!record.skipRetry);
      }
    } else {
      this.onWarning(Error("Networkless Logging: Stored logs request expired age limit"));
      record.id !== undefined && await this.storageService.GJ(record.id, this.currentDbName); // was: void 0
    }
  }

  /**
   * Check whether a request is still within the allowed age.
   * [was: Kz]
   */
  isRequestValid(record, maxAge) { // was: Q, c
    const timestamp = record.timestamp;
    return this.now() - timestamp >= maxAge ? false : true; // was: !1 : !0
  }

  /**
   * Retry queued requests that haven't exceeded the queue-timeout.
   * [was: x7]
   */
  retryQueuedRequests() {
    if (!isIdbSupported(this))
      throw Error("IndexedDB is not supported: retryQueuedRequests");
    this.storageService.GK("QUEUED", this.currentDbName).then((record) => {
      if (record && !this.isRequestValid(record, this.queuedRequestMaxAge)) {
        this.timerService.SlotIdFulfilledNonEmptyTrigger(async () => {
          record.id !== undefined && await this.storageService.Tq(record.id, this.currentDbName); // was: void 0
          this.retryQueuedRequests();
        });
      } else {
        this.networkService.KU() && this.throttleSend();
      }
    });
  }
}

// ============================================================================
// CFR Endpoint Tracker  (line 68664)
// ============================================================================

/**
 * Tracks whether endpoints have returned a "client-facing response" (CFR),
 * used to skip redundant network checks.
 *
 * [was: hD]
 */
export class CfrEndpointTracker { // was: hD
  constructor() {
    this.endpointMap = new Map(); // was: this.W = new Map
    this.hasAnyCfr = false; // was: this.O = !1
  }

  requestComplete(url, isCfr) { // was: Q, c
    if (isCfr)
      this.hasAnyCfr = true; // was: !0
    const stripped = this.removeParams(url); // was: Q
    this.endpointMap.get(stripped) || this.endpointMap.set(stripped, isCfr);
  }

  isEndpointCFR(url) { // was: Q
    const stripped = this.removeParams(url);
    const result = this.endpointMap.get(stripped);
    if (result) return false; // was: !1
    if (result === false && this.hasAnyCfr) return true; // was: !0
    return null;
  }

  removeParams(url) { // was: Q
    return url.split("?")[0];
  }
}

// ============================================================================
// Network Status Manager  (line 68687)
// ============================================================================

/**
 * Manages network status detection, exposing online/offline events and
 * an error-flushing mechanism for queued offline errors.
 *
 * [was: zU]
 */
export class NetworkStatusManager extends EventTargetBase { // was: zU
  constructor() {
    super();
    this.errorFlushingEnabled = false; // was: this.O = !1
    this.networkMonitor = createNetworkMonitor(); // was: this.W = Llx()
    this.networkMonitor.listen("networkstatus-online", () => {
      if (this.errorFlushingEnabled && getExperimentBoolean("offline_error_handling")) {
        const errors = getLocalStorage().get("errors", true); // was: uV().get(...)
        if (errors) {
          for (const key in errors) // was: c
            if (errors[key]) {
              const wrappedError = new PlayerError(key, "sent via offline_errors"); // was: W
              wrappedError.name = errors[key].name;
              wrappedError.stack = errors[key].stack;
              wrappedError.level = errors[key].level;
              logError(wrappedError);
            }
          getLocalStorage().set("errors", {}, 2592000, true); // was: !0
        }
      }
    });
  }

  /** [was: KU] */
  isNetworkAvailable() {
    return this.networkMonitor.KU();
  }

  /** [was: LL] */
  networkStatusHint(isOnline) { // was: Q
    this.networkMonitor.W = isOnline;
  }

  /** [was: YG] */
  getWindowStatus() {
    const onLine = window.navigator.onLine;
    return onLine === undefined ? true : onLine; // was: void 0 ? !0 : Q
  }

  /** [was: Ii] */
  enableErrorFlushing() {
    this.errorFlushingEnabled = true; // was: !0
  }

  listen(eventName, callback) { // was: Q, c
    return this.networkMonitor.listen(eventName, callback);
  }

  /** [was: Xy] */
  sendNetworkCheckRequest(options) { // was: Q
    return sendNetworkCheck(this.networkMonitor, options); // was: QN(this.W, Q)
  }
}

// ============================================================================
// GEL Payload Store  (line 69113)
// ============================================================================

/**
 * Stores GEL (Google Event Logging) payloads keyed by sequence, supporting
 * efficient extraction by key or smart batch extraction with size limits.
 *
 * [was: fL]
 */
export class GelPayloadStore { // was: fL
  constructor() {
    this.store = {};
    this.totalCount = 0; // was: this.W = 0
    this.keyCache = {}; // was: this.O = {}
    this.serviceInterface = { // was: this.Rk
      a5e: () => this.totalCount
    };
  }

  storePayload(key, payload) { // was: Q, c
    const normalizedKey = normalizeGelKey(key); // was: jI(Q)
    if (this.store[normalizedKey]) {
      this.store[normalizedKey].push(payload);
    } else {
      this.keyCache = {};
      this.store[normalizedKey] = [payload];
    }
    this.totalCount++;
    if (getExperimentBoolean("more_accurate_gel_parser")) {
      const event = new CustomEvent("TRANSPORTING_NEW_EVENT");
      window.dispatchEvent(event);
    }
    return normalizedKey;
  }

  smartExtractMatchingEntries(query) { // was: Q
    if (!query.keys.length)
      return [];
    const keysToMatch = expandKeys(this, query.keys.splice(0, 1)[0]); // was: Op(this, ...)
    const results = []; // was: W
    for (let i = 0; i < keysToMatch.length; i++) // was: m
      if (this.store[keysToMatch[i]] && query.sizeLimit) {
        if (this.store[keysToMatch[i]].length <= query.sizeLimit) {
          results.push(...this.store[keysToMatch[i]]);
          delete this.store[keysToMatch[i]];
        } else {
          results.push(...this.store[keysToMatch[i]].splice(0, query.sizeLimit));
        }
      }
    this.totalCount -= results.length;
    if (query?.sizeLimit && results.length < query?.sizeLimit) {
      query.sizeLimit -= results.length;
      results.push(...this.smartExtractMatchingEntries(query));
    }
    return results;
  }

  extractMatchingEntries(key) { // was: Q
    const matchedKeys = expandKeys(this, key); // was: Op(this, Q)
    const results = [];
    for (let i = 0; i < matchedKeys.length; i++) // was: W
      if (this.store[matchedKeys[i]]) {
        results.push(...this.store[matchedKeys[i]]);
        delete this.store[matchedKeys[i]];
      }
    this.totalCount -= results.length;
    return results;
  }

  getSequenceCount(key) { // was: Q
    const matchedKeys = expandKeys(this, key);
    let count = 0;
    for (let i = 0; i < matchedKeys.length; i++) // was: W
      count += this.store[matchedKeys[i]]?.length || 0;
    return count;
  }
}

// ============================================================================
// Visual Element Builder  (line 69213)
// ============================================================================

/**
 * Wraps visual-element (VE) descriptors and serialises them to JSON or JSPB
 * for interaction logging.
 *
 * [was: VF]
 */
export class VisualElementBuilder { // was: VF
  constructor(descriptor) { // was: Q
    this.descriptor = descriptor; // was: this.W = Q
  }

  getAsJson() {
    const json = {};
    if (this.descriptor.trackingParams !== undefined) { // was: void 0
      json.trackingParams = this.descriptor.trackingParams;
    } else {
      json.veType = this.descriptor.veType;
      this.descriptor.veCounter !== undefined && (json.veCounter = this.descriptor.veCounter); // was: void 0
      this.descriptor.elementIndex !== undefined && (json.elementIndex = this.descriptor.elementIndex); // was: void 0
    }
    this.descriptor.dataElement !== undefined && (json.dataElement = this.descriptor.dataElement.getAsJson()); // was: void 0
    this.descriptor.youtubeData !== undefined && (json.youtubeData = this.descriptor.youtubeData); // was: void 0
    this.descriptor.isCounterfactual && (json.isCounterfactual = true); // was: !0
    return json;
  }

  getAsJspb() {
    const jspb = new VisualElementJspb(); // was: iyX
    if (this.descriptor.trackingParams !== undefined) { // was: void 0
      jspb.setTrackingParams(this.descriptor.trackingParams);
    } else {
      this.descriptor.veType !== undefined && setJspbField(jspb, 2, encodeSignedVarint(this.descriptor.veType)); // was: wD, aU
      this.descriptor.veCounter !== undefined && setJspbField(jspb, 6, encodeSignedVarint(this.descriptor.veCounter));
      this.descriptor.elementIndex !== undefined && setJspbField(jspb, 3, encodeSignedVarint(this.descriptor.elementIndex));
      this.descriptor.isCounterfactual && setJspbField(jspb, 5, encodeBool(true)); // was: jW(!0)
    }
    if (this.descriptor.dataElement !== undefined) { // was: void 0
      const child = this.descriptor.dataElement.getAsJspb();
      setJspbSubmessage(jspb, VisualElementJspb, 7, child); // was: ry(Q, iyX, 7, c)
    }
    this.descriptor.youtubeData !== undefined && setJspbSubmessage(jspb, YouTubeDataJspb, 8, this.descriptor.jspbYoutubeData); // was: ry(..., tO3, 8, ...)
    return jspb;
  }

  toString() {
    return JSON.stringify(this.getAsJson());
  }

  isClientVe() {
    return !this.descriptor.trackingParams && !!this.descriptor.veType;
  }

  getLoggingDirectives() {
    return this.descriptor.loggingDirectives;
  }
}

// ============================================================================
// Component Descriptor  (line 69364)
// ============================================================================

/**
 * Describes a player component by type, renderer payload, macro map,
 * layout ID, and interaction-logging metadata.
 *
 * [was: CP]
 */
export class ComponentDescriptor { // was: CP
  constructor(componentType, renderer = null, macros = {}, layoutId, interactionLoggingClientData, existingId) {
    // was: Q, c=null, W={}, m, K, T
    this.componentType = componentType;
    this.renderer = renderer;
    this.macros = macros;
    this.layoutId = layoutId;
    this.interactionLoggingClientData = interactionLoggingClientData;
    this.existingId = existingId; // was: this.W = T
    this.id = generateComponentId(componentType); // was: c1(Q)
  }
}

// ============================================================================
// Player Aspect Ratio & Playback Rate Constants  (line 69404)
// ============================================================================

/**
 * Default widescreen aspect ratio.
 * [was: JL]
 */
export const DEFAULT_ASPECT_RATIO = 16 / 9; // was: JL

/**
 * Standard playback speed options.
 * [was: yey]
 */
export const STANDARD_PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]; // was: yey

/**
 * Extended playback speed options (includes higher speeds).
 * [was: SLn]
 */
export const EXTENDED_PLAYBACK_RATES = STANDARD_PLAYBACK_RATES.concat([3, 4, 5, 6, 7, 8, 9, 10, 15]); // was: SLn

/**
 * Premium playback speed options (fractional intermediate speeds).
 * [was: F23]
 */
export const PREMIUM_PLAYBACK_RATES = STANDARD_PLAYBACK_RATES.concat([2.5, 3, 3.5, 4]); // was: F23
