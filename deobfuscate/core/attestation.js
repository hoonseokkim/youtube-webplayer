import { getConfig } from './composition-helpers.js'; // was: g.v
import { now, getObjectByPath } from './type-helpers.js'; // was: g.d0, g.DR
import { PlayerError } from './errors.js'; // was: g.H8
import { shouldUseDesktopControls } from '../data/bandwidth-tracker.js'; // was: tx
import { listen } from './composition-helpers.js';
import { remove, clear } from './array-utils.js';
import { toString } from './string-utils.js';
import { openDatabase, runTransaction, iterateCursor } from '../data/idb-transactions.js';
// TODO: resolve g.storageManager (storage access singleton, was: g.oC)
// TODO: resolve g.globalThis (global reference)
// TODO: resolve g.setTimeout (setTimeout wrapper, was: g.zn)
// TODO: resolve g.openDatabase (IDB open helper, was: g.m7)
// TODO: resolve g.runTransaction (IDB transaction runner)
// TODO: resolve g.iterateCursor (IDB cursor iterator, was: g.cF)

/**
 * attestation.js -- Storage persistence helpers (localStorage / sessionStorage),
 * display-mode detection, platform enum mapping, experiment flags (bitfield),
 * network connection type detection, datasync ID, scheduler shims,
 * and IDB-backed hot/cold config store operations.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 * Source lines: 12079-12259  (storage, display-mode, flags, network, scheduler)
 *              13055-13099  (IDB hot/cold config store helpers)
 *
 * Skipped range (covered elsewhere):
 *   12260-13055  -> data/idb-transactions.js
 */

// ---------------------------------------------------------------------------
// Batch event listener registration -- Source line 12080-12083
// ---------------------------------------------------------------------------

/**
 * Register the same handler for multiple events on one target.
 * [was: TE]
 * @param {EventTarget} target    [was: Q]
 * @param {*}           emitter   [was: c]
 * @param {string[]}    events    [was: W]
 * @param {Function}    handler   [was: m]
 */
export function listenAll(target, emitter, events, handler) { // was: TE
  for (let i = 0; i < events.length; i++) {
    target.listen(emitter, events[i], handler);
  }
}

// ---------------------------------------------------------------------------
// Local / Session storage persistence -- Source lines 12085-12132
// ---------------------------------------------------------------------------

/**
 * Persist a value to localStorage (or sessionStorage for short TTL).
 * [was: g.rl]
 * @param {string} key     [was: Q]
 * @param {*}      value   [was: c] - Stringified via JSON if not a string.
 * @param {number} [ttlSec] [was: W] - Time-to-live in seconds (0 = session).
 */
export function storageSet(key, value, ttlSec) { // was: g.rl
  let seconds = ttlSec && ttlSec > 0 ? ttlSec : 0;
  const expiresAt = seconds ? Date.now() + seconds * 1000 : 0;
  const storage = seconds ? g.storageManager.persistent() : g.storageManager.session(); // was: g.oC.w8(), g.oC.nN()
  if (storage && window.JSON) {
    if (typeof value !== "string") {
      value = JSON.stringify(value, undefined);
    }
    try {
      storage.set(key, value, expiresAt);
    } catch (_e) {
      storage.remove(key);
    }
  }
}

/**
 * Read a JSON-parsed value from session or persistent storage.
 * [was: g.UM]
 * @param {string} key [was: Q]
 * @returns {*|null}
 */
export function storageGet(key) { // was: g.UM
  const sessionStore = g.storageManager.session();
  const persistStore = g.storageManager.persistent();
  if (!sessionStore && !persistStore || !window.JSON) return null;

  let raw;
  try {
    raw = sessionStore.get(key);
  } catch (_e) { /* ignore */ }
  if (typeof raw !== "string") {
    try {
      raw = persistStore.get(key);
    } catch (_e) { /* ignore */ }
  }
  if (typeof raw !== "string") return null;

  try {
    raw = JSON.parse(raw, undefined);
  } catch (_e) { /* ignore */ }
  return raw;
}

/**
 * Read the creation timestamp of the persisted player quality setting.
 * [was: Xwd]
 * @returns {number|undefined}
 */
export function getPlayerQualityTimestamp() { // was: Xwd
  const storage = g.storageManager.persistent();
  if (storage) {
    const entry = storage.getMetadata("yt-player-quality"); // was: .iM
    if (entry) return entry.creation;
  }
}

/**
 * Remove a key from both session and persistent storage.
 * [was: g.IC]
 * @param {string} key [was: Q]
 */
export function storageRemove(key) { // was: g.IC
  try {
    const session = g.storageManager.session();
    const persist = g.storageManager.persistent();
    if (session) session.remove(key);
    if (persist) persist.remove(key);
  } catch (_e) { /* ignore */ }
}

/**
 * Shorthand: read the remote-session screen id from storage.
 * [was: g.Xd]
 * @returns {*|null}
 */
export function getRemoteSessionScreenId() { // was: g.Xd
  return storageGet("yt-remote-session-screen-id");
}

// ---------------------------------------------------------------------------
// Display-mode detection -- Source lines 12138-12146
// ---------------------------------------------------------------------------

/**
 * Detect the PWA display mode via matchMedia.
 * [was: AN]
 * @returns {string} One of WEB_DISPLAY_MODE_* enum strings.
 */
export function getWebDisplayMode() { // was: AN
  if (!g.globalThis.matchMedia) return "WEB_DISPLAY_MODE_UNKNOWN";
  try {
    if (g.globalThis.matchMedia("(display-mode: standalone)").matches)
      return "WEB_DISPLAY_MODE_STANDALONE";
    if (g.globalThis.matchMedia("(display-mode: minimal-ui)").matches)
      return "WEB_DISPLAY_MODE_MINIMAL_UI";
    if (g.globalThis.matchMedia("(display-mode: fullscreen)").matches)
      return "WEB_DISPLAY_MODE_FULLSCREEN";
    if (g.globalThis.matchMedia("(display-mode: browser)").matches)
      return "WEB_DISPLAY_MODE_BROWSER";
    return "WEB_DISPLAY_MODE_UNKNOWN";
  } catch (_e) {
    return "WEB_DISPLAY_MODE_UNKNOWN";
  }
}

// ---------------------------------------------------------------------------
// Singleton / platform enum -- Source lines 12148-12173
// ---------------------------------------------------------------------------

/**
 * Get or create the config singleton.
 * [was: Asd]
 * @returns {ConfigSingleton} [was: eL]
 */
export function getConfigSingleton() { // was: Asd
  if (!ConfigSingleton.instance) {
    ConfigSingleton.instance = new ConfigSingleton();
  }
  return ConfigSingleton.instance;
}

/**
 * Convert a platform string to its numeric enum value.
 * [was: eB7]
 * @param {string} platform [was: Q]
 * @returns {number|undefined}
 */
export function platformToEnum(platform) { // was: eB7
  switch (platform) {
    case "DESKTOP":         return 1;
    case "UNKNOWN_PLATFORM": return 0;
    case "TV":              return 2;
    case "GAME_CONSOLE":    return 3;
    case "MOBILE":          return 4;
    case "TABLET":          return 5;
  }
}

/**
 * Get the global player config wrapper (singleton).
 * [was: g.pm]
 * @returns {PlayerConfigWrapper} [was: Vyd]
 */
export function getPlayerConfig() { // was: g.pm
  if (!playerConfigInstance) { // was: Vg
    playerConfigInstance = new PlayerConfigWrapper(); // was: Vyd
  }
  return playerConfigInstance;
}

let playerConfigInstance = null; // was: Vg

// ---------------------------------------------------------------------------
// Experiment flags (bitfield) -- Source lines 12175-12197
// ---------------------------------------------------------------------------

/**
 * Set or clear a single experiment-flag bit in a bitfield bucket.
 * [was: xs]
 * @param {number}  flagIndex  [was: Q]
 * @param {boolean} enabled    [was: c]
 */
export function setExperimentFlag(flagIndex, enabled) { // was: xs
  const bucketKey = `f${Math.floor(flagIndex / 31) + 1}`;
  const bitMask = 1 << (flagIndex % 31);
  let current = parseFlagBucket(bucketKey) || 0; // was: BDn
  current = enabled ? current | bitMask : current & ~bitMask;
  if (current === 0) {
    delete flagStorage[bucketKey]; // was: B8
  } else {
    const hex = current.toString(16);
    flagStorage[bucketKey] = hex.toString();
  }
}

/**
 * Assert a key matches the bucket format.
 * [was: qD]
 * @param {string} key [was: Q]
 */
export function assertBucketFormat(key) { // was: qD
  if (/^f([1-9][0-9]*)$/.test(key)) {
    throw Error(`ExpectedRegexMatch: ${key}`);
  }
}

/**
 * Assert a key is word-characters only.
 * [was: ng]
 * @param {string} key [was: Q]
 */
export function assertWordCharsOnly(key) { // was: ng
  if (!/^\w+$/.test(key)) {
    throw Error(`ExpectedRegexMismatch: ${key}`);
  }
}

/**
 * Parse a hex flag bucket value to an integer.
 * [was: BDn]
 * @param {string} bucketKey [was: Q]
 * @returns {number|null}
 */
export function parseFlagBucket(bucketKey) { // was: BDn
  const raw = flagStorage[bucketKey] !== undefined
    ? flagStorage[bucketKey].toString()
    : null;
  return raw != null && /^[A-Fa-f0-9]+$/.test(raw) ? parseInt(raw, 16) : null;
}

// ---------------------------------------------------------------------------
// Network connection type -- Source lines 12199-12230
// ---------------------------------------------------------------------------

/**
 * Return the navigator.connection object if available.
 * [was: xyW]
 * @returns {NetworkInformation|undefined}
 */
export function getNetworkInformation() { // was: xyW
  const nav = g.globalThis.navigator;
  return nav ? nav.connection : undefined;
}

/**
 * Determine the connection type string (e.g. "CONN_CELLULAR_4G").
 * [was: nHw]
 * @returns {string|undefined}
 */
export function getConnectionType() { // was: nHw
  const conn = getNetworkInformation();
  if (conn) {
    let connType = connectionTypeMap[conn.type || "unknown"] || "CONN_UNKNOWN"; // was: qV3
    const effectiveType = connectionTypeMap[conn.effectiveType || "unknown"] || "CONN_UNKNOWN";
    if (connType === "CONN_CELLULAR_UNKNOWN" && effectiveType !== "CONN_UNKNOWN") {
      connType = effectiveType;
    }
    if (connType !== "CONN_UNKNOWN") return connType;
    if (effectiveType !== "CONN_UNKNOWN") return effectiveType;
  }
}

/**
 * Get the effective connection type label.
 * [was: tyx]
 * @returns {string|undefined}
 */
export function getEffectiveConnectionType() { // was: tyx
  const conn = getNetworkInformation();
  if (conn?.effectiveType) {
    return effectiveTypeMap.hasOwnProperty(conn.effectiveType) // was: Dyy
      ? effectiveTypeMap[conn.effectiveType]
      : "EFFECTIVE_CONNECTION_TYPE_UNKNOWN";
  }
}

// ---------------------------------------------------------------------------
// Datasync ID -- Source lines 12223-12236
// ---------------------------------------------------------------------------

/**
 * Check whether a datasync ID is available.
 * [was: tN]
 * @returns {boolean}
 */
export function hasDatasyncId() { // was: tN
  try {
    getDatasyncId(); // was: g.Dk
    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Return the datasync ID from config, or throw.
 * [was: g.Dk]
 * @param {string} [caller="unknown"] [was: Q]
 * @returns {string}
 */
export function getDatasyncId(caller = "unknown") { // was: g.Dk
  if (getConfig("DATASYNC_ID") !== undefined) { // was: g.v
    return getConfig("DATASYNC_ID");
  }
  throw new PlayerError("Datasync ID not set", caller); // was: g.H8
}

// ---------------------------------------------------------------------------
// Scheduler shims -- Source lines 12238-12257
// ---------------------------------------------------------------------------

/**
 * Schedule a callback through the innertube scheduler (priority 0).
 * [was: g.iK]
 * @param {Function} callback [was: Q]
 * @param {number}   priority [was: c] - Unused; always 0.
 * @param {number}   [delay]   [was: W]
 * @returns {number} Job id.
 */
export function scheduleJob(callback, priority, delay) { // was: g.iK
  return addSchedulerJob(callback, 0, delay); // was: ND
}

/**
 * Add an immediate job if the scheduler is available, else run directly.
 * [was: HUy]
 * @param {Function} callback [was: Q]
 */
export function addImmediateJob(callback) { // was: HUy
  const fn = getObjectByPath("yt.scheduler.instance.addImmediateJob"); // was: g.DR
  if (fn) fn(callback);
  else callback();
}

/**
 * Get or create the singleton ServiceLocator.
 * [was: g.SL]
 * @returns {ServiceLocator} [was: yg]
 */
export function getServiceLocator() { // was: g.SL
  if (!ServiceLocator.instance) { // was: yg
    ServiceLocator.instance = new ServiceLocator();
  }
  return ServiceLocator.instance;
}

/**
 * Add a job to the global scheduler with an optional delay.
 * [was: ND]
 * @param {Function} callback [was: Q]
 * @param {number}   priority [was: c]
 * @param {number}   [delay]   [was: W]
 * @returns {number}
 */
export function addSchedulerJob(callback, priority, delay) { // was: ND
  if (delay !== undefined && Number.isNaN(Number(delay))) {
    delay = undefined;
  }
  const addJob = getObjectByPath("yt.scheduler.instance.addJob"); // was: g.DR
  if (addJob) {
    return addJob(callback, priority, delay);
  }
  if (delay === undefined) {
    callback();
    return NaN;
  }
  return g.setTimeout(callback, delay || 0); // was: g.zn
}

// ---------------------------------------------------------------------------
// IDB hot/cold config store -- Source lines 13055-13099
// ---------------------------------------------------------------------------

/**
 * Open an IDB database by name.
 * [was: Vb]
 * @param {string} dbName [was: Q]
 * @returns {Promise<IDBDatabase>}
 */
export function openConfigDatabase(dbName) { // was: Vb
  return g.openDatabase(getConfigDbFactory(), dbName); // was: g.m7, IZ7
}

/**
 * Write a hot-config snapshot to IDB, clearing old entries first.
 * [was: X_m]
 * @param {Object}  config    [was: Q]
 * @param {*}       hashData  [was: c]
 * @param {string}  dbName    [was: W]
 * @param {number}  [timestamp] [was: m]
 * @returns {Promise}
 */
export async function writeHotConfig(config, hashData, dbName, timestamp) { // was: X_m
  const entry = {
    config,
    hashData,
    timestamp: timestamp !== undefined ? timestamp : now(), // was: g.h
  };
  const EventHandler = await openConfigDatabase(dbName);
  await EventHandler.clear("hotConfigStore");
  return await EventHandler.put("hotConfigStore", entry);
}

/**
 * Write a cold-config snapshot to IDB, clearing old entries first.
 * [was: Ao7]
 * @param {Object}  config     [was: Q]
 * @param {*}       hashData   [was: c]
 * @param {*}       configData [was: W]
 * @param {string}  dbName     [was: m]
 * @param {number}  [timestamp] [was: K]
 * @returns {Promise}
 */
export async function writeColdConfig(config, hashData, configData, dbName, timestamp) { // was: Ao7
  const entry = {
    config,
    hashData,
    configData,
    timestamp: timestamp !== undefined ? timestamp : now(),
  };
  const EventHandler = await openConfigDatabase(dbName);
  await EventHandler.clear("coldConfigStore");
  return await EventHandler.put("coldConfigStore", entry);
}

/**
 * Read the latest cold-config entry from IDB (by descending timestamp).
 * [was: eQn]
 * @param {string} dbName [was: Q]
 * @returns {Promise<*>}
 */
export async function readLatestColdConfig(dbName) { // was: eQn
  const EventHandler = await openConfigDatabase(dbName);
  let result = undefined;
  await g.runTransaction(EventHandler, ["coldConfigStore"], {
    mode: "readwrite",
    durable: true, // was: g3: !0
  }, (shouldUseDesktopControls) =>
    g.iterateCursor( // was: g.cF
      shouldUseDesktopControls.objectStore("coldConfigStore").index("coldTimestampIndex"),
      { direction: "prev" },
      (cursor) => {
        result = cursor.getValue();
      }
    )
  );
  return result;
}
