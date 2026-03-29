import { remove, clear, slice } from '../core/array-utils.js';
/**
 * storage.js -- localStorage / sessionStorage availability & abstraction
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~9640-9731, 64934-65131
 *
 * Provides:
 *  - Low-level key-value storage wrappers around native Web Storage
 *  - JSON-serialising layer (JsonStorage)
 *  - Expiring-entry layer (ExpiringStorage / ExpiringJsonStorage)
 *  - Storage-availability checking with quota-exceeded handling
 *  - DOM exception mapping for Safari / Firefox / Chrome quota errors
 *  - Iterator-based key enumeration
 *  - Prefixed-key scoping via PrefixedStorage
 *
 * Hierarchy (g.bw = inherits):
 *   StorageMechanism (p6) -> LocalStorage (cY), SessionStorage (WY)
 *   JsonStorageAdapter (g.P7)
 *     -> JsonStorage (z5)
 *       -> ExpiringStorage (Jp)
 *         -> ExpiringJsonStorage (g.kK)
 *   IterableStorageBase (Cjx)
 *     -> IterableStorage (YK)
 *       -> PrefixedStorage (mA)
 *       -> StorageMechanism (p6) [also extends YK]
 *
 * @module data/storage
 */

// ============================================================================
// Helpers
// ============================================================================

/**
 * Ensures that the underlying Storage object is available on `mechanism`.
 * Throws if `mechanism.storage` is nullish or `isAvailable()` returns false.
 *
 * [was: QD]
 * @param {StorageMechanism} mechanism [was: Q]
 */
function assertStorageReady(mechanism) { // was: QD
  if (mechanism.storage == null) { // was: Q.W
    throw Error('Storage mechanism: Storage unavailable');
  }
  mechanism.isAvailable() || throwAsync(Error('Storage mechanism: Storage unavailable'));
}

/**
 * Wraps a value in a StorageValue container if it isn't one already.
 *
 * [was: MI]
 * @param {*} value [was: Q]
 * @returns {StorageValue|undefined}
 */
function ensureStorageValue(value) { // was: MI
  return value === undefined || value instanceof StorageValue ? value : new StorageValue(value);
}

// throwAsync is referenced but lives in core; inline a stub comment for clarity.
// g.qX.setTimeout(() => { throw Q; }, 0)  [was: vS]

// ============================================================================
// StorageValue [was: C6]
// ============================================================================

/**
 * Simple wrapper around an arbitrary data payload persisted in storage.
 * Used by the JSON / expiring storage layers to carry metadata alongside
 * the actual value.
 *
 * [was: C6]
 */
export class StorageValue {
  /**
   * @param {*} data [was: Q]
   */
  constructor(data) { // was: constructor(Q)
    /** @type {*} [was: this.data] */
    this.data = data;
  }
}

// ============================================================================
// JsonStorageAdapter [was: g.P7]
// ============================================================================

/**
 * Adapter that serialises/deserialises values as JSON when delegating
 * to an underlying StorageMechanism (p6 / cY / WY).
 *
 * [was: g.P7]
 */
export class JsonStorageAdapter {
  /**
   * @param {StorageMechanism} mechanism  underlying storage [was: Q]
   */
  constructor(mechanism) { // was: constructor(Q)
    /** @type {StorageMechanism} [was: this.xl] */
    this.mechanism = mechanism; // was: this.xl
  }

  /**
   * Persist `value` as a JSON string.  Passing `undefined` removes the key.
   *
   * [was: g.P7.prototype.set]
   * @param {string} key   [was: Q]
   * @param {*}      value [was: c]
   */
  set(key, value) { // was: set(Q, c)
    value === undefined
      ? this.mechanism.remove(key) // was: this.xl.remove(Q)
      : this.mechanism.set(key, JSON.stringify(value)); // was: g.bS(c)
  }

  /**
   * Retrieve and JSON.parse a value.  Returns `undefined` when the key is
   * absent; throws on corrupt data.
   *
   * [was: g.P7.prototype.get]
   * @param {string} key [was: Q]
   * @returns {*}
   */
  get(key) { // was: get(Q)
    let raw; // was: c
    try {
      raw = this.mechanism.get(key); // was: this.xl.get(Q)
    } catch (_err) {
      return;
    }
    if (raw !== null) {
      try {
        return JSON.parse(raw);
      } catch (_err) {
        throw 'Storage: Invalid value was encountered';
      }
    }
  }

  /**
   * Remove a key from storage.
   *
   * [was: g.P7.prototype.remove]
   * @param {string} key [was: Q]
   */
  remove(key) { // was: remove(Q)
    this.mechanism.remove(key); // was: this.xl.remove(Q)
  }
}

// ============================================================================
// JsonStorage [was: z5]  (extends JsonStorageAdapter)
// ============================================================================

/**
 * Like JsonStorageAdapter but wraps every value in a StorageValue container
 * on write, and unwraps on read.
 *
 * [was: z5]
 */
export class JsonStorage extends JsonStorageAdapter {
  /**
   * @param {StorageMechanism} mechanism [was: Q]
   */
  constructor(mechanism) { // was: constructor(Q)
    super(mechanism);
  }

  /**
   * Wrap the value in StorageValue before persisting.
   *
   * [was: z5.prototype.set]
   * @param {string} key   [was: Q]
   * @param {*}      value [was: c]
   */
  set(key, value) { // was: set(Q, c)
    super.set(key, ensureStorageValue(value)); // was: z5.FS.set.call(this, Q, MI(c))
  }

  /**
   * Read and validate a StorageValue from the underlying adapter.
   *
   * [was: z5.prototype.iM]
   * @param {string} key [was: Q]
   * @returns {StorageValue|undefined}
   */
  readRaw(key) { // was: iM(Q)
    const entry = super.get(key); // was: z5.FS.get.call(this, Q)
    if (entry === undefined || entry instanceof Object) {
      return entry;
    }
    throw 'Storage: Invalid value was encountered';
  }

  /**
   * Convenience accessor that extracts the `.data` payload.
   *
   * [was: z5.prototype.get]
   * @param {string} key [was: Q]
   * @returns {*}
   */
  get(key) { // was: get(Q)
    const entry = this.readRaw(key); // was: this.iM(Q)
    if (entry) {
      const value = entry.data; // was: Q.data
      if (value === undefined) {
        throw 'Storage: Invalid value was encountered';
      }
      return value;
    }
    return undefined;
  }
}

// ============================================================================
// ExpiringStorage [was: Jp]  (extends JsonStorage)
// ============================================================================

/**
 * Adds creation/expiration timestamps to stored values.
 * Expired entries are automatically removed upon read.
 *
 * [was: Jp]
 */
export class ExpiringStorage extends JsonStorage {
  /**
   * @param {StorageMechanism} mechanism [was: Q]
   */
  constructor(mechanism) { // was: constructor(Q)
    super(mechanism);
  }

  /**
   * Store `value` with an optional expiration timestamp (ms since epoch).
   * If `expirationMs` is in the past, the key is removed instead.
   *
   * [was: Jp.prototype.set]
   * @param {string}  key           [was: Q]
   * @param {*}       value         [was: c]
   * @param {number}  [expirationMs] - epoch ms [was: W]
   */
  set(key, value, expirationMs) { // was: set(Q, c, W)
    let entry = ensureStorageValue(value); // was: MI(c)
    if (entry) {
      if (expirationMs) {
        if (expirationMs < Date.now()) { // was: g.d0()
          this.remove(key);
          return;
        }
        entry.expiration = expirationMs;
      }
      entry.creation = Date.now(); // was: g.d0()
    }
    super.set(key, entry); // was: Jp.FS.set.call(this, Q, c)
  }

  /**
   * Read a raw entry, optionally skipping expiration checks.
   *
   * [was: Jp.prototype.iM]
   * @param {string}  key                [was: Q]
   * @param {boolean} [skipExpiryCheck]  [was: c]
   * @returns {StorageValue|undefined}
   */
  readRaw(key, skipExpiryCheck) { // was: iM(Q, c)
    const entry = super.readRaw(key); // was: Jp.FS.iM.call(this, Q)
    if (entry) {
      if (!skipExpiryCheck && isExpiredOrFuture(entry)) { // was: g.R9(W)
        this.remove(key);
      } else {
        return entry;
      }
    }
  }
}

/**
 * Returns true when the entry is expired or its creation date is in the
 * future (clock-skew protection).
 *
 * [was: g.R9]
 * @param {Object} entry [was: Q]
 * @returns {boolean}
 */
function isExpiredOrFuture(entry) { // was: g.R9
  const creation = entry.creation;
  const expiration = entry.expiration;
  return (!!expiration && expiration < Date.now())
    || (!!creation && creation > Date.now());
}

// ============================================================================
// ExpiringJsonStorage [was: g.kK]  (extends ExpiringStorage)
// ============================================================================

/**
 * Final concrete layer combining JSON serialisation with expiring entries.
 * This is the class most call-sites instantiate (via `g.kK`).
 *
 * [was: g.kK]
 */
export class ExpiringJsonStorage extends ExpiringStorage {
  /**
   * @param {StorageMechanism} mechanism [was: Q]
   */
  constructor(mechanism) { // was: constructor(Q)
    super(mechanism);
  }
}

// ============================================================================
// IterableStorageBase [was: Cjx]
// ============================================================================

/**
 * Empty base for iterable storage classes.  YK inherits from this.
 *
 * [was: Cjx]
 */
export class IterableStorageBase {} // was: Cjx

// ============================================================================
// IterableStorage [was: YK]  (extends IterableStorageBase)
// ============================================================================

/**
 * Provides `Symbol.iterator` and `clear()` over a storage-like object
 * that exposes a `keys(keysOnly)` iterator method.
 *
 * [was: YK]
 */
export class IterableStorage extends IterableStorageBase {
  /**
   * Iterate over all keys in this storage.
   * @returns {Iterator<string>}
   */
  [Symbol.iterator]() {
    return this.keys(true)[Symbol.iterator](); // was: g.bB(this.F7(!0)).W()
  }

  /**
   * Remove every key in storage.
   *
   * [was: YK.prototype.clear]
   */
  clear() {
    const allKeys = Array.from(this);
    for (const key of allKeys) {
      this.remove(key);
    }
  }
}

// ============================================================================
// StorageMechanism [was: p6]  (extends IterableStorage)
// ============================================================================

/**
 * Core Web Storage wrapper.  Wraps `window.localStorage` or
 * `window.sessionStorage` and provides availability detection,
 * quota-exceeded handling, and an iterator interface.
 *
 * [was: p6]
 */
export class StorageMechanism extends IterableStorage {
  /**
   * @param {Storage|null} nativeStorage  the browser Storage object [was: Q]
   */
  constructor(nativeStorage) { // was: constructor(Q)
    super();
    /** @type {Storage|null} -- the native Storage [was: this.W] */
    this.storage = nativeStorage; // was: this.W
    /** @type {boolean|null} -- cached availability result [was: this.O] */
    this._available = null; // was: this.O
  }

  /**
   * Returns `true` when the underlying Storage object can be read & written.
   * Detects quota-exceeded conditions on Safari, Firefox, and Chrome and
   * still reports `true` when data already exists.
   *
   * DOM exception mapping:
   *  - Safari 14+/Chrome:  `DOMException.name === "QuotaExceededError"`
   *  - Older Chrome:       `DOMException.code === 22`
   *  - Firefox:            `DOMException.code === 1014` or
   *                        `DOMException.name === "NS_ERROR_DOM_QUOTA_REACHED"`
   *
   * [was: p6.prototype.isAvailable]
   * @returns {boolean}
   */
  isAvailable() {
    if (this._available === null) { // was: this.O
      let nativeStore = this.storage; // was: Q = this.W
      if (nativeStore) {
        try {
          nativeStore.setItem('__sak', '1');
          nativeStore.removeItem('__sak');
          var result = true; // was: !0
        } catch (err) { // was: W
          result =
            err instanceof DOMException &&
            (err.name === 'QuotaExceededError' ||
              err.code === 22 ||
              err.code === 1014 ||
              err.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            nativeStore &&
            nativeStore.length !== 0;
        }
      } else {
        result = false; // was: !1
      }
      this._available = result; // was: this.O = c
    }
    return this._available;
  }

  /**
   * Persist a value.  Throws a descriptive string on quota overflow or
   * when storage has been disabled entirely.
   *
   * [was: p6.prototype.set]
   * @param {string} key   [was: Q]
   * @param {string} value [was: c]
   */
  set(key, value) {
    assertStorageReady(this); // was: QD(this)
    try {
      this.storage.setItem(key, value);
    } catch (_err) {
      if (this.storage.length == 0) {
        throw 'Storage mechanism: Storage disabled';
      }
      throw 'Storage mechanism: Quota exceeded';
    }
  }

  /**
   * Retrieve a raw string value.
   *
   * [was: p6.prototype.get]
   * @param {string} key [was: Q]
   * @returns {string|null}
   */
  get(key) {
    assertStorageReady(this);
    const value = this.storage.getItem(key); // was: this.W.getItem(Q)
    if (typeof value !== 'string' && value !== null) {
      throw 'Storage mechanism: Invalid value was encountered';
    }
    return value;
  }

  /**
   * Remove a key.
   *
   * [was: p6.prototype.remove]
   * @param {string} key [was: Q]
   */
  remove(key) {
    assertStorageReady(this);
    this.storage.removeItem(key);
  }

  /**
   * Return an iterator that yields either keys or values.
   *
   * [was: p6.prototype.F7]
   * @param {boolean} keysOnly  when true, yields keys; otherwise values [was: Q]
   * @returns {Iterator}
   */
  keys(keysOnly) { // was: F7(Q)
    assertStorageReady(this);
    let index = 0; // was: c
    const store = this.storage; // was: W
    const iter = { done: false, value: undefined }; // was: new g.OF
    iter.next = function () {
      if (index >= store.length) {
        return { done: true, value: undefined }; // was: g.KP
      }
      const k = store.key(index++); // was: W.key(c++)
      if (keysOnly) {
        return { done: false, value: k }; // was: g.f4(K)
      }
      const v = store.getItem(k);
      if (typeof v !== 'string') {
        throw 'Storage mechanism: Invalid value was encountered';
      }
      return { done: false, value: v };
    };
    return iter;
  }

  /**
   * Clear all entries from the native Storage.
   *
   * [was: p6.prototype.clear]
   */
  clear() {
    assertStorageReady(this);
    this.storage.clear();
  }

  /**
   * Return the key at a given index.
   *
   * [was: p6.prototype.key]
   * @param {number} index [was: Q]
   * @returns {string|null}
   */
  key(index) {
    assertStorageReady(this);
    return this.storage.key(index);
  }
}

// ============================================================================
// LocalStorage [was: cY]  (extends StorageMechanism)
// ============================================================================

/**
 * Wrapper around `window.localStorage`.
 *
 * [was: cY]
 */
export class LocalStorage extends StorageMechanism {
  constructor() {
    let native = null; // was: Q
    try {
      native = globalThis.localStorage || null; // was: g.qX.localStorage
    } catch (_err) {}
    super(native);
  }
}

// ============================================================================
// SessionStorage [was: WY]  (extends StorageMechanism)
// ============================================================================

/**
 * Wrapper around `window.sessionStorage`.
 *
 * [was: WY]
 */
export class SessionStorage extends StorageMechanism {
  constructor() {
    let native = null;
    try {
      native = globalThis.sessionStorage || null; // was: g.qX.sessionStorage
    } catch (_err) {}
    super(native);
  }
}

// ============================================================================
// PrefixedStorage [was: mA]  (extends IterableStorage)
// ============================================================================

/**
 * Scopes all keys under a string prefix (`prefix + "::"`) and delegates
 * to an existing StorageMechanism.
 *
 * [was: mA]
 */
export class PrefixedStorage extends IterableStorage {
  /**
   * @param {StorageMechanism} delegate  the backing storage [was: Q]
   * @param {string}           prefix    namespace prefix   [was: c]
   */
  constructor(delegate, prefix) { // was: constructor(Q, c)
    super();
    /** @type {StorageMechanism} [was: this.O] */
    this.delegate = delegate; // was: this.O
    /** @type {string} [was: this.W] */
    this.prefix = prefix + '::'; // was: this.W = c + "::"
  }

  /** [was: mA.prototype.set] */
  set(key, value) {
    this.delegate.set(this.prefix + key, value);
  }

  /** [was: mA.prototype.get] */
  get(key) {
    return this.delegate.get(this.prefix + key);
  }

  /** [was: mA.prototype.remove] */
  remove(key) {
    this.delegate.remove(this.prefix + key);
  }

  /**
   * Iterator that filters keys to those starting with the prefix.
   *
   * [was: mA.prototype.F7]
   * @param {boolean} keysOnly [was: Q]
   * @returns {Iterator}
   */
  keys(keysOnly) { // was: F7(Q)
    const parentIter = this.delegate[Symbol.iterator](); // was: this.O[Symbol.iterator]()
    const self = this; // was: W
    const iter = { done: false, value: undefined };
    iter.next = function () {
      let result = parentIter.next();
      if (result.done) return result;

      let rawKey = result.value; // was: K.value
      while (rawKey.slice(0, self.prefix.length) != self.prefix) {
        result = parentIter.next();
        if (result.done) return result;
        rawKey = result.value;
      }

      return {
        done: false,
        value: keysOnly
          ? rawKey.slice(self.prefix.length)
          : self.delegate.get(rawKey),
      };
    };
    return iter;
  }
}

// ============================================================================
// HeapEntry [was: TZ]
// ============================================================================

/**
 * A key-value entry used inside the PriorityQueue heap.
 *
 * [was: TZ]
 */
export class HeapEntry {
  /**
   * @param {number} priority [was: Q / this.W]
   * @param {*}      value    [was: c / this.O]
   */
  constructor(priority, value) { // was: constructor(Q, c)
    /** @type {number} [was: this.W] */
    this.priority = priority; // was: this.W
    /** @type {*} [was: this.O] */
    this.value = value; // was: this.O
  }

  /** [was: TZ.prototype.getValue] */
  getValue() {
    return this.value;
  }

  /** [was: TZ.prototype.clone] */
  clone() {
    return new HeapEntry(this.priority, this.value);
  }
}

// ============================================================================
// getLocalStorage helper [was: g.Ku]
// ============================================================================

/**
 * Returns a (possibly prefixed) LocalStorage instance, or null if
 * localStorage is unavailable.
 *
 * [was: g.Ku]
 * @param {string} [prefix] - optional namespace prefix [was: Q]
 * @returns {StorageMechanism|PrefixedStorage|null}
 */
export function getLocalStorage(prefix) { // was: g.Ku
  const ls = new LocalStorage(); // was: new cY
  if (!ls.isAvailable()) return null;
  return prefix ? new PrefixedStorage(ls, prefix) : ls;
}
