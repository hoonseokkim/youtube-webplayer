/**
 * Experiment Flag System
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~13100-13280
 *
 * Manages hot and cold experiment/feature-flag configs that are loaded
 * from IndexedDB or from the inline `ytConfig` page data. Supports
 * lazy loading, DB caching with timestamps, and runtime flag evaluation
 * via `g.P()` (boolean check) and `g.X()` (player experiment check).
 */

// ---------------------------------------------------------------------------
// Imports (conceptual)
// ---------------------------------------------------------------------------
import { openDatabase, iterateCursor } from '../core/indexed-db.js'; // was: g.MD, g.cF
import { getGlobalConfig } from '../core/global-config.js';          // was: g.v
import { setGlobalConfig } from '../core/global-config.js';          // was: g.n7
import { getGlobalConfigValue } from '../core/global-config.js';     // was: g.DR
import { isIndexedDbAvailable } from '../core/platform.js';          // was: g.AD
import { scheduleTask } from '../core/scheduler.js';                 // was: g.YF.FD
import { shouldUseDesktopControls } from '../data/bandwidth-tracker.js'; // was: tx
import { deleteDatabase } from '../data/idb-transactions.js'; // was: WF
import { getLatestColdConfig } from '../data/idb-transactions.js'; // was: eQn
import { deleteAllUserDatabases } from '../data/idb-transactions.js'; // was: TyO
import { storeHotConfig } from '../data/idb-transactions.js'; // was: X_m
import { storeColdConfig } from '../data/idb-transactions.js'; // was: Ao7
import { getExperimentNumber } from '../data/idb-transactions.js'; // was: Y3

// ---------------------------------------------------------------------------
// Hot Config Store access  (line ~13100-13112)
// ---------------------------------------------------------------------------

/**
 * Retrieve the most recent hot config entry from IndexedDB.
 *
 * Opens the `hotConfigStore` object store and reads the entry with the
 * highest timestamp via the `hotTimestampIndex` (descending).
 *
 * @param {string} dbToken  Database name/token [was: Q]
 * @returns {Promise<Object|undefined>}  The stored hot config record, or undefined.
 *
 * [was: V0d]
 */
export async function getLatestHotConfig(dbToken) {
  const EventHandler = await openDatabase(dbToken); // was: Vb(Q)
  let result = undefined;

  await EventHandler.transaction(['hotConfigStore'], {
    mode: 'readwrite',
    durability: true, // was: g3: !0
  }, (shouldUseDesktopControls) => {
    const store = shouldUseDesktopControls.objectStore('hotConfigStore');
    const index = store.index('hotTimestampIndex');
    return iterateCursor(index, { direction: 'prev' }, (cursor) => {
      result = cursor.getValue();
    });
  });

  return result;
}

// ---------------------------------------------------------------------------
// Clear GCF config database  (line ~13114)
// ---------------------------------------------------------------------------

/**
 * Delete (clear) the GCF configuration IndexedDB.
 * [was: Byy]
 */
export async function deleteGcfConfigDb() {
  await _g.deleteDatabase('ytGcfConfig'); // was: TyO("ytGcfConfig")
}

// ---------------------------------------------------------------------------
// ConfigService singleton [was: BF]  (line ~13118-13124)
// ---------------------------------------------------------------------------

/**
 * Singleton service that holds hot/cold config groups and hash data.
 * [was: BF via x6O()]
 */
class ConfigService {
  static instance = null;

  constructor() {
    /** @type {Object|null} Hot config group [was: this.O] */
    this.hotConfigGroup = null;

    /** @type {Object|null} Cold config group [was: this.W] */
    this.coldConfigGroup = null;

    /** @type {number} Task handle for deferred config fetch [was: this.j] */
    this._fetchTaskHandle = 0;

    /** @type {boolean} Whether IndexedDB is initialized [was: this.K] */
    this.isDbInitialized = false;

    /** @type {Object|null} Hot hash data [was: this.hotHashData via c7()] */
    this.hotHashData = null;

    /** @type {Object|null} Cold hash data [was: this.coldHashData] */
    this.coldHashData = null;

    /** @type {Object|null} Cold config data [was: this.configData] */
    this.configData = null;

    /** @type {number} Last config-hash send timestamp [was: this.A] */
    this._lastHashSendTime = 0;

    /** @type {Object} Subscribers for hot config updates [was: this.D] */
    this._hotConfigSubscribers = { callbacks: [] }; // was: this.D.W
  }

  /**
   * @returns {ConfigService}
   * [was: x6O()]
   */
  static getInstance() {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
}

// ---------------------------------------------------------------------------
// Hot / Cold config setters  (lines 13126-13142)
// ---------------------------------------------------------------------------

/**
 * Set the hot config group on the service and mirror it to the global store.
 * @param {ConfigService} service [was: Q]
 * @param {Object|null}   config  [was: c]
 * [was: xw]
 */
export function setHotConfigGroup(service, config) {
  service.hotConfigGroup = config;
  setGlobalConfig('yt.gcf.config.hotConfigGroup', config ?? null);
}

/**
 * Set the cold config group.
 * @param {ConfigService} service [was: Q]
 * @param {Object|null}   config  [was: c]
 * [was: qe]
 */
export function setColdConfigGroup(service, config) {
  service.coldConfigGroup = config;
  setGlobalConfig('yt.gcf.config.coldConfigGroup', config ?? null);
}

/**
 * @returns {Object|null} The current cold config group from global store.
 * [was: nq]
 */
export function getColdConfigGroup() {
  return getGlobalConfigValue('yt.gcf.config.coldConfigGroup');
}

/**
 * @returns {Object|null} The current hot config group from global store.
 * [was: DM]
 */
export function getHotConfigGroup() {
  return getGlobalConfigValue('yt.gcf.config.hotConfigGroup');
}

// ---------------------------------------------------------------------------
// Deferred config fetch  (line ~13144)
// ---------------------------------------------------------------------------

/**
 * Schedule fetching of hot and cold configs if they are not already available.
 * Uses IndexedDB when available; falls back to inline ytConfig data.
 *
 * @param {ConfigService} service [was: Q]
 * [was: D6w]
 */
export function scheduleConfigFetch(service) {
  if (service.hotConfigGroup && service.coldConfigGroup) return;

  service._fetchTaskHandle =
    service._fetchTaskHandle ||
    scheduleTask(async () => {
      try { await fetchHotConfig(service); } catch { /* ignore */ }
      try { await fetchColdConfig(service); } catch { /* ignore */ }
      if (service._fetchTaskHandle) service._fetchTaskHandle = 0;
    }, 100);
}

// ---------------------------------------------------------------------------
// Initialize from ytConfig inline data  (line ~13176, 13211)
// ---------------------------------------------------------------------------

/**
 * Load hot config from the inline page config (`RAW_HOT_CONFIG_GROUP`).
 * [was: HVw]
 */
export function loadHotConfigFromPageData(service) {
  setHotConfigGroup(service, getGlobalConfig('RAW_HOT_CONFIG_GROUP'));
  service.hotHashData = getGlobalConfig('SERIALIZED_HOT_HASH_DATA'); // was: Q.c7(...)
}

/**
 * Load cold config from the inline page config (`RAW_COLD_CONFIG_GROUP`).
 * [was: t0m]
 */
export function loadColdConfigFromPageData(service) {
  setColdConfigGroup(service, getGlobalConfig('RAW_COLD_CONFIG_GROUP'));
  service.coldHashData = getGlobalConfig('SERIALIZED_COLD_HASH_DATA'); // was: tD(Q, ...)
  service.configData = service.coldConfigGroup?.configData;            // was: iVx(Q, ...)
}

// ---------------------------------------------------------------------------
// Fetch hot config (DB-first, fallback to inline)  (line ~13181)
// ---------------------------------------------------------------------------

/**
 * Attempt to load the hot config group:
 *   1. From IndexedDB if available and fresher than page-load time
 *   2. Fallback to inline `RAW_HOT_CONFIG_GROUP`
 *   3. Persist to DB for future loads
 *
 * @param {ConfigService} service [was: Q]
 * @returns {Promise<Object|null>}
 * [was: qBy]
 */
export async function fetchHotConfig(service) {
  if (service.hotConfigGroup) return getHotConfigGroup();

  if (!service.isDbInitialized) {
    return Promise.reject(new Error('getHotConfig IDB not initialized')); // was: g.$s(...)
  }

  const dbToken = _getDbToken();             // was: XE()
  const pageCreateTime = getGlobalConfig('TIME_CREATED_MS'); // was: g.v("TIME_CREATED_MS")

  if (dbToken) {
    const stored = await getLatestHotConfig(dbToken);
    if (stored && stored.timestamp > pageCreateTime) {
      setHotConfigGroup(service, stored.config);
      service.hotHashData = stored.hashData;
      return getHotConfigGroup();
    }
  }

  // Fallback
  loadHotConfigFromPageData(service);

  // Persist to DB for next load
  if (dbToken && service.hotConfigGroup && service.hotHashData) {
    await _persistHotConfig(service.hotConfigGroup, service.hotHashData, dbToken, pageCreateTime);
  }

  return service.hotConfigGroup ? getHotConfigGroup() : Promise.reject(new Error('Config not available in ytConfig'));
}

// ---------------------------------------------------------------------------
// Fetch cold config (DB-first, fallback to inline)  (line ~13217)
// ---------------------------------------------------------------------------

/**
 * Same pattern as `fetchHotConfig` but for the cold config group.
 *
 * @param {ConfigService} service [was: Q]
 * @returns {Promise<Object|null>}
 * [was: nCO]
 */
export async function fetchColdConfig(service) {
  if (service.coldConfigGroup) return getColdConfigGroup();

  if (!service.isDbInitialized) {
    return Promise.reject(new Error('getColdConfig IDB not initialized'));
  }

  const dbToken = _getDbToken();
  const pageCreateTime = getGlobalConfig('TIME_CREATED_MS');

  if (dbToken) {
    const stored = await _g.getLatestColdConfig(dbToken); // was: eQn(c)
    if (stored && stored.timestamp > pageCreateTime) {
      setColdConfigGroup(service, stored.config);
      service.configData = stored.configData;
      service.coldHashData = stored.hashData;
      return getColdConfigGroup();
    }
  }

  loadColdConfigFromPageData(service);

  if (dbToken && service.coldConfigGroup && service.coldHashData && service.configData) {
    await _persistColdConfig(service.coldConfigGroup, service.coldHashData, service.configData, dbToken, pageCreateTime);
  }

  return service.coldConfigGroup ? getColdConfigGroup() : Promise.reject(new Error('Config not available in ytConfig'));
}

// ---------------------------------------------------------------------------
// Startup initialization  (line ~13168)
// ---------------------------------------------------------------------------

/**
 * Initialize the GCF config system on player startup.
 *
 * Checks `start_client_gcf` and `delete_gcf_config_db` experiment flags
 * (via `g.P()`) to decide whether to use IndexedDB or inline configs.
 *
 * @param {ConfigService} service [was: Q]
 * [was: NyR]
 */
export async function initializeConfigSystem(service) {
  const startClientGcf = isExperimentEnabled('start_client_gcf');    // was: g.P("start_client_gcf")
  const deleteDb = isExperimentEnabled('delete_gcf_config_db');       // was: g.P("delete_gcf_config_db")

  if (!startClientGcf && !deleteDb) return;

  if (startClientGcf) {
    if (await isIndexedDbAvailable() && _hasDbToken() && !deleteDb) {
      service.isDbInitialized = true;
      scheduleConfigFetch(service);
    } else {
      loadColdConfigFromPageData(service);
      loadHotConfigFromPageData(service);
    }
  }

  if (deleteDb) {
    await deleteGcfConfigDb();
  }
}

// ---------------------------------------------------------------------------
// Config hash reporting  (line ~13264)
// ---------------------------------------------------------------------------

/**
 * Collect cold config data and hash data for periodic server reporting.
 * Rate-limited by `send_config_hash_timer`.
 *
 * @returns {{ coldConfigData: Object|null, hotHashData: Object|null, coldHashData: Object|null } | undefined}
 * [was: FKW]
 */
export function getConfigHashesForReporting() {
  const service = ConfigService.getInstance();
  const elapsed = Date.now() - service._lastHashSendTime;

  if (service._lastHashSendTime !== 0 && elapsed < _getConfigTimer('send_config_hash_timer')) {
    return undefined;
  }

  const coldConfigData = getGlobalConfigValue('yt.gcf.config.coldConfigData');
  const hotHashData = getGlobalConfigValue('yt.gcf.config.hotHashData');
  const coldHashData = getGlobalConfigValue('yt.gcf.config.coldHashData');

  if (coldConfigData && hotHashData && coldHashData) {
    service._lastHashSendTime = Date.now();
  }

  return { coldConfigData, hotHashData, coldHashData };
}

// ---------------------------------------------------------------------------
// Public API -- experiment flag evaluation
// ---------------------------------------------------------------------------

/**
 * Check whether a boolean experiment flag is enabled.
 * This is the primary entry point used throughout the player codebase.
 *
 * @param {string} flagName
 * @returns {boolean}
 * [was: g.P]
 */
export function isExperimentEnabled(flagName) {
  // Delegates to the global experiment flag store
  // Implementation reads from ytConfig EXPERIMENT_FLAGS
  return !!getGlobalConfig(`EXPERIMENT_FLAGS.${flagName}`);
}

// ---------------------------------------------------------------------------
// Private helpers (stubs)
// ---------------------------------------------------------------------------
function _g.deleteDatabase(_name) { /* was: deleteAllUserDatabases */ }
function _getDbToken() { return null; /* was: XE() */ }
function _hasDbToken() { return false; }
function _persistHotConfig() { /* was: storeHotConfig */ }
function _persistColdConfig() { /* was: storeColdConfig */ }
function _g.getLatestColdConfig() { return null; /* was: getLatestColdConfig */ }
function _getConfigTimer(_name) { return 0; /* was: getExperimentNumber(...) */ }
