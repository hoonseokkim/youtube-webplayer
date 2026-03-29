/**
 * storage-manager.js -- Singleton storage manager & IDB event logger
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~80518-80596, 28631-28664
 *
 * Provides:
 *  - StorageManager singleton (`Kc`) -- coordinates storage quota estimation
 *    using the modern `navigator.storage.estimate()` API with a WebKit
 *    `webkitTemporaryStorage.queryUsageAndQuota` fallback
 *  - IndexedDB event logger (`v_R`) -- reports IDB lifecycle events
 *    (quota exceeded, unexpected close, corruption, transaction end/abort)
 *    and decorates quota-exceeded events with device storage metrics
 *  - IndexedDB database schema declaration for `yt-player-local-media`
 *
 * @module data/storage-manager
 */

import { createObjectStore } from './idb-transactions.js';  // was: g.JN
import { handleError } from '../player/context-updates.js';
import { contains } from '../core/string-utils.js';

// ============================================================================
// WebKit temporary-storage fallback  [was: OL7]
// ============================================================================

/**
 * Returns a Promise that resolves with `{ usage, quota }` from the
 * deprecated `webkitTemporaryStorage` API.  Used on older Safari/WebView
 * builds that lack `navigator.storage.estimate()`.
 *
 * [was: OL7]
 * @returns {Promise<{usage: number, quota: number}>}
 */
function queryWebkitTemporaryStorage() { // was: OL7
  const nav = navigator; // was: Q
  return new Promise((resolve, reject) => { // was: (c, W)
    nav.webkitTemporaryStorage?.queryUsageAndQuota
      ? nav.webkitTemporaryStorage.queryUsageAndQuota(
          (usage, quota) => { // was: (m, K)
            resolve({ usage, quota });
          },
          (err) => { // was: m
            reject(err);
          }
        )
      : reject(Error('webkitTemporaryStorage is not supported.'));
  });
}

// ============================================================================
// StorageManager  [was: Kc]
// ============================================================================

/**
 * Singleton that exposes a unified `estimate()` method combining the
 * standard Storage API with the WebKit fallback.
 *
 * The singleton is registered under the global key `"ytglobal.storage_"`
 * so that multiple player instances share a single object.
 *
 * [was: Kc]
 */
export class StorageManager {
  /**
   * Retrieve (or create) the singleton instance.
   * Stored as `g.DR("ytglobal.storage_")`.
   *
   * [was: Kc.getInstance]
   * @returns {StorageManager}
   */
  static getInstance() {
    // was: let Q = g.DR("ytglobal.storage_");
    //      Q || (Q = new Kc, g.n7("ytglobal.storage_", Q));
    let instance = globalThis.__yt_storage_singleton; // was: g.DR(...)
    if (!instance) {
      instance = new StorageManager();
      globalThis.__yt_storage_singleton = instance; // was: g.n7(...)
    }
    return instance;
  }

  /**
   * Estimate device storage usage and quota.
   *
   * 1. Tries `navigator.storage.estimate()` (returns a Promise).
   * 2. Falls back to `navigator.webkitTemporaryStorage.queryUsageAndQuota`.
   * 3. Returns `undefined` when neither API is available.
   *
   * [was: Kc.prototype.estimate]
   * @returns {Promise<{usage: number, quota: number}>|undefined}
   */
  async estimate() {
    const nav = navigator; // was: Q
    if (nav.storage?.estimate) {
      return nav.storage.estimate();
    }
    if (nav.webkitTemporaryStorage?.queryUsageAndQuota) {
      return queryWebkitTemporaryStorage(); // was: OL7()
    }
  }
}

// Register the class globally so other modules can access the constructor.
// was: g.n7("ytglobal.storageClass_", Kc);

// ============================================================================
// bytesToMegabytesString helper  [was: fux]
// ============================================================================

/**
 * Converts a byte count to a stringified megabyte ceiling, or `"-1"` when
 * the input is undefined (API unsupported).
 *
 * [was: fux]
 * @param {number|undefined} bytes [was: Q]
 * @returns {string}
 */
function bytesToMegabytesString(bytes) { // was: fux
  return typeof bytes === 'undefined'
    ? '-1'
    : String(Math.ceil(bytes / 1048576));
}

// ============================================================================
// reportQuotaExceeded helper  [was: v1m]
// ============================================================================

/**
 * Enriches a QUOTA_EXCEEDED event with device storage metrics obtained
 * from `StorageManager.estimate()`, then forwards the decorated payload
 * to the provided logger callback.
 *
 * [was: v1m]
 * @param {IdbEventLogger} logger [was: Q]
 * @param {Object}         eventData        [was: c]
 */
function reportQuotaExceeded(logger, eventData) { // was: v1m
  StorageManager.getInstance()
    .estimate()
    .then((estimate) => { // was: W
      logger.logCallback('idbQuotaExceeded', { // was: Q.W(...)
        ...eventData,
        isSw: self.document === undefined,
        isIframe: self !== self.top,
        deviceStorageUsageMbytes: bytesToMegabytesString(estimate?.usage),
        deviceStorageQuotaMbytes: bytesToMegabytesString(estimate?.quota),
      });
    });
}

// ============================================================================
// IdbEventLogger  [was: v_R]
// ============================================================================

/**
 * Logs IndexedDB lifecycle events (corruption, unexpected closure,
 * quota exceeded, transaction abort, etc.) to the YouTube telemetry
 * pipeline.
 *
 * A random 20 % sample is selected at construction time; only sampled
 * instances emit `TRANSACTION_ENDED` events (and even then at a further
 * 10 % sub-sample) to avoid overwhelming the logging backend.
 *
 * [was: v_R]
 */
export class IdbEventLogger {
  /**
   * @param {Function} errorHandler  global error reporter              [was: Q]
   * @param {Function} logCallback   `(eventName, payload) => void`     [was: c]
   */
  constructor(errorHandler, logCallback) { // was: constructor(Q, c)
    /** @type {Function} [was: this.handleError] */
    this.handleError = errorHandler; // was: this.handleError = Q
    /** @type {Function} [was: this.W] */
    this.logCallback = logCallback; // was: this.W = c
    /** @type {boolean} -- true once `beforeunload` fires [was: this.O] */
    this.hasWindowUnloaded = false; // was: this.O = !1

    if (self.document !== undefined) { // was: self.document === void 0 ||
      self.addEventListener('beforeunload', () => {
        this.hasWindowUnloaded = true; // was: this.O = !0
      });
    }

    /** @type {boolean} -- true for ~20 % of instances [was: this.A] */
    this.isSampled = Math.random() <= 0.2; // was: this.A
  }

  /**
   * Forward a caught error to the global error handler.
   *
   * [was: v_R.prototype.Lw]
   * @param {Error} err [was: Q]
   */
  reportError(err) { // was: Lw(Q)
    this.handleError(err);
  }

  /**
   * Dispatch an IDB event to the appropriate logging channel.
   *
   * Supported event names:
   * | Name                            | Description                              |
   * |---------------------------------|------------------------------------------|
   * | `IDB_DATA_CORRUPTED`            | Data integrity violation                 |
   * | `IDB_UNEXPECTEDLY_CLOSED`       | DB connection dropped                    |
   * | `IS_SUPPORTED_COMPLETED`        | Support-detection finished                |
   * | `QUOTA_EXCEEDED`                | Storage quota hit                        |
   * | `TRANSACTION_ENDED`             | Normal transaction completion (sampled)  |
   * | `TRANSACTION_UNEXPECTEDLY_ABORTED` | Unexpected transaction abort          |
   *
   * [was: v_R.prototype.logEvent]
   * @param {string} eventName [was: Q]
   * @param {Object} payload   [was: c]
   */
  logEvent(eventName, payload) { // was: logEvent(Q, c)
    switch (eventName) {
      case 'IDB_DATA_CORRUPTED':
        // was: g.P("idb_data_corrupted_killswitch") || this.W("idbDataCorrupted", c)
        this.logCallback('idbDataCorrupted', payload);
        break;

      case 'IDB_UNEXPECTEDLY_CLOSED':
        this.logCallback('idbUnexpectedlyClosed', payload);
        break;

      case 'IS_SUPPORTED_COMPLETED':
        // was: g.P("idb_is_supported_completed_killswitch") || this.W(...)
        this.logCallback('idbIsSupportedCompleted', payload);
        break;

      case 'QUOTA_EXCEEDED':
        reportQuotaExceeded(this, payload); // was: v1m(this, c)
        break;

      case 'TRANSACTION_ENDED':
        // Only 20 % of instances log this, and within those a further 10 %.
        if (this.isSampled && Math.random() <= 0.1) {
          this.logCallback('idbTransactionEnded', payload);
        }
        break;

      case 'TRANSACTION_UNEXPECTEDLY_ABORTED':
        this.logCallback('idbTransactionAborted', {
          ...payload,
          hasWindowUnloaded: this.hasWindowUnloaded,
        });
        break;
    }
  }
}

// ============================================================================
// IDB Schema: yt-player-local-media  [was: J13]
// ============================================================================

/**
 * IndexedDB database descriptor for the offline/local-media cache.
 *
 * Object stores:
 *   - `index`    (version 2)
 *   - `media`    (version 2)
 *   - `captions` (version 5)
 *
 * Upgrade path removes legacy stores `metadata` and `playerdata` at v6.
 *
 * [was: J13]
 */
export const playerLocalMediaDbConfig = { // was: J13
  name: 'yt-player-local-media',
  objectStores: {
    index: { version: 2 },    // was: d0: 2
    media: { version: 2 },
    captions: { version: 5 },
  },
  shared: false, // was: !1
  /**
   * Run schema migrations.
   *
   * @param {IDBDatabase} db            [was: Q]
   * @param {Function}    needsUpgrade  returns true if store needs creation [was: c]
   */
  upgrade(EventHandler, needsUpgrade) { // was: upgrade(Q, c)
    if (needsUpgrade(2)) {
      createObjectStore(EventHandler, 'index');   // was: JN(Q, "index")
      createObjectStore(EventHandler, 'media');   // was: JN(Q, "media")
    }
    if (needsUpgrade(5)) {
      createObjectStore(EventHandler, 'captions'); // was: JN(Q, "captions")
    }
    if (needsUpgrade(6)) {
      deleteObjectStore(EventHandler, 'metadata');    // was: RC(Q, "metadata")
      deleteObjectStore(EventHandler, 'playerdata');  // was: RC(Q, "playerdata")
    }
  },
  version: 5,
};

/**
 * Create an object store on the IDB database.
 * [was: JN]
 */
function createObjectStore(EventHandler, name, options) {
  return EventHandler.createObjectStore(name, options);
}

/**
 * Delete an object store if it exists.
 * [was: RC]
 */
function deleteObjectStore(EventHandler, name) {
  if (EventHandler.objectStoreNames.contains(name)) {
    EventHandler.deleteObjectStore(name);
  }
}
