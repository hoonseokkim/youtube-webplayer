import { isExperimentEnabled } from '../features/experiment-flags.js'; // was: g.P
import { getConfig } from './composition-helpers.js'; // was: g.v
import { getObjectByPath } from './type-helpers.js'; // was: g.DR
import { clearObject } from './object-utils.js'; // was: g.lD
import { getCookie, setCookie } from './misc-helpers.js'; // was: g.V5, g.e$
import { isAndroid } from '../data/device-platform.js'; // was: w8
import { buildAuthorizationHeader } from './event-system.js'; // was: WO
import { assertWordCharsOnly } from './attestation.js'; // was: ng
import { assertBucketFormat } from './attestation.js'; // was: qD
import { parseFlagBucket } from './attestation.js'; // was: BDn
import { toString } from './string-utils.js';
import { remove, clear } from './array-utils.js';
import { setPrototypeOf } from './polyfills.js';
// TODO: resolve g.kK (StorageWrapper class)
// RESOLVED: g.Ge → globalMessages (exported below)
// TODO: resolve g.oC (storageAccess, defined in this file as storageAccess)

/**
 * promise-internals.js -- Promise implementation internals and error class
 * extensions that bridge the gaps between errors.js and promise.js ranges.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines 67000-67160, 67268-67346
 * (Lines 67161-67267 are covered in errors.js)
 * (Lines 67347-67436 are covered in promise.js)
 *
 * Covers:
 *  - Storage availability (g.oC): sessionStorage & localStorage detection
 *  - Global messages registry (g.Ge)
 *  - InstallPrompt handler (Mvm): PWA install-prompt interception
 *  - Auth session builder (eL): authorization header construction
 *  - Unauthenticated identity default (ZM)
 *  - User preferences (Vyd / B8): PREF cookie parse/dump/save
 *  - Connection type mappings (qV3, gCy, OVw, Dyy)
 *  - IDB error message tables (InW, XgK, Ae7) [overlap with errors.js noted]
 *  - IdbKnownError (g.fg) and related classes
 *  - Closed-DB sentinel messages (NDm)
 */

// =========================================================================
// Storage availability   [was: g.oC, lines 67000-67015]
// =========================================================================

/**
 * Lazy-initialised storage access wrappers.
 *
 * [was: g.oC]
 * @type {{ w8: Function, nN: Function }}
 */
export const storageAccess = { // was: g.oC
  /**
   * Returns a sessionStorage-backed key-value store, or null if unavailable.
   * [was: w8]
   * @returns {?g.kK}
   */
  isAndroid: a_(function () {
    let store; // was: Q
    try {
      const backend = new cY(); // was: c
      store = backend.isAvailable() ? backend : null;
    } catch (_e) {
      return null;
    }
    return store ? new g.kK(store) : null;
  }),

  /**
   * Returns a localStorage-backed key-value store, or null if unavailable.
   * [was: nN]
   * @returns {?g.kK}
   */
  nN: a_(function () {
    const backend = new WY(); // was: Q
    return backend.isAvailable() ? new g.kK(backend) : null;
  }),
};

// =========================================================================
// Global messages registry   [was: g.Ge, lines 67016-67017]
// =========================================================================

/**
 * Global i18n message strings, sourced from `yt.msgs_` or `ytcfg.msgs`.
 * [was: g.Ge]
 * @type {Object<string, string>}
 */
export const globalMessages = (typeof window !== 'undefined')
  ? (window.yt?.msgs_ || window.ytcfg?.msgs || {})
  : {}; // [was: g.Ge]
// Note: original also called setGlobal("yt.msgs_", g.Ge)

// =========================================================================
// InstallPrompt handler   [was: Mvm, lines 67018-67034]
// =========================================================================

/**
 * Intercepts the `beforeinstallprompt` event for PWA install flow
 * management, and tracks whether the app has been installed.
 *
 * [was: Mvm]
 */
export class InstallPromptHandler { // was: Mvm
  /**
   * @param {Window} win [was: Q]
   */
  constructor(win) { // was: constructor(Q)
    /**
     * The deferred install prompt event (or undefined if not triggered).
     * [was: this.O]
     * @type {?BeforeInstallPromptEvent}
     */
    this.deferredPrompt = undefined; // was: this.O = void 0

    /**
     * Whether the app has been installed.
     * [was: this.W]
     * @type {boolean}
     */
    this.isInstalled = false; // was: this.W = !1

    win.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.deferredPrompt = event; // was: this.O = c
    });

    win.addEventListener(
      "appinstalled",
      () => {
        this.isInstalled = true; // was: this.W = !0
      },
      { once: true }
    );
  }
}

// =========================================================================
// Auth session builder   [was: eL, lines 67036-67057]
// =========================================================================

/**
 * Builds authorization headers for YouTube API requests.
 *
 * [was: eL]
 */
export class AuthSessionBuilder { // was: eL
  constructor() {
    /** @type {boolean} Whether credentials are enabled [was: this.KE] */
    this.credentialsEnabled = true; // was: this.KE = !0
  }

  /**
   * Build authorization headers from the current session state.
   *
   * [was: Sl]
   * @param {*} _unused [was: Q]
   * @param {Object} [options] - { sessionIndex } [was: c]
   * @returns {Object<string, string>} Headers map
   */
  buildHeaders(_unused, options) { // was: Sl(Q, c)
    const headers = {}; // was: Q = {}
    let authComponents = []; // was: W = []

    if ("USER_SESSION_ID" in N4) {
      authComponents.push({
        key: "u",
        value: getConfig("USER_SESSION_ID"),
      });
    }

    const authToken = buildAuthorizationHeader(authComponents); // was: W = WO(W)
    if (authToken) {
      headers.Authorization = authToken;

      let sessionIndex = options?.sessionIndex; // was: W = c?.sessionIndex
      if (sessionIndex === undefined) {
        sessionIndex = Number(getConfig("SESSION_INDEX", 0));
        if (isNaN(sessionIndex)) sessionIndex = 0;
      }

      if (!isExperimentEnabled("voice_search_auth_header_removal")) {
        headers["X-Goog-AuthUser"] = sessionIndex.toString();
      }

      if (!("INNERTUBE_HOST_OVERRIDE" in N4)) {
        headers["X-Origin"] = window.location.origin;
      }

      if (options?.sessionIndex === undefined && "DELEGATED_SESSION_ID" in N4) {
        headers["X-Goog-PageId"] = getConfig("DELEGATED_SESSION_ID");
      }
    }

    return headers;
  }
}

// =========================================================================
// Unauthenticated identity   [was: ZM, lines 67059-67061]
// =========================================================================

/**
 * Default identity descriptor for unauthenticated requests.
 * [was: ZM]
 */
export const UNAUTHENTICATED_IDENTITY = { // was: ZM
  identityType: "UNAUTHENTICATED_IDENTITY_TYPE_UNKNOWN",
};

// =========================================================================
// User preferences   [was: B8, Vyd, lines 67062-67115]
// =========================================================================

/**
 * Global user preferences store (parsed from the PREF cookie).
 * [was: B8]
 * @type {Object<string, string>}
 */
export const userPrefs = getObjectByPath("ytglobal.prefsUserPrefsPrefs_") || {}; // was: B8
setGlobal("ytglobal.prefsUserPrefsPrefs_", userPrefs);

/**
 * User preferences manager. Reads/writes preferences from/to the PREF cookie.
 *
 * [was: Vyd]
 */
export class UserPreferences { // was: Vyd
  constructor() {
    /** @type {string} Cookie name [was: this.W] */
    this.cookieName = getConfig("ALT_PREF_COOKIE_NAME", "PREF");

    /** @type {string} Cookie domain [was: this.O] */
    this.cookieDomain = getConfig("ALT_PREF_COOKIE_DOMAIN", "youtube.com");

    const raw = getCookie(this.cookieName); // was: Q
    if (raw) this.parse(raw);
  }

  /**
   * Get a preference value.
   * [was: get]
   * @param {string} key [was: Q]
   * @param {string} [defaultValue] [was: c]
   * @returns {string}
   */
  get(key, defaultValue) { // was: get(Q, c)
    assertWordCharsOnly(key);
    assertBucketFormat(key);
    const value = userPrefs[key] !== undefined ? userPrefs[key].toString() : null;
    return value != null ? value : defaultValue ? defaultValue : "";
  }

  /**
   * Set a preference value.
   * [was: set]
   * @param {string} key [was: Q]
   * @param {*} value [was: c]
   */
  set(key, value) { // was: set(Q, c)
    assertWordCharsOnly(key);
    assertBucketFormat(key);
    if (value == null) throw Error("ExpectedNotNull");
    userPrefs[key] = value.toString();
  }

  /**
   * Check a bit-field preference flag.
   * [was: BA]
   * @param {number} flagIndex [was: Q]
   * @returns {boolean}
   */
  checkFlag(flagIndex) { // was: BA(Q)
    return !!((parseFlagBucket(`f${Math.floor(flagIndex / 31) + 1}`) || 0) & (1 << (flagIndex % 31)));
  }

  /**
   * Remove a preference.
   * [was: remove]
   * @param {string} key [was: Q]
   */
  remove(key) { // was: remove(Q)
    assertWordCharsOnly(key);
    assertBucketFormat(key);
    delete userPrefs[key];
  }

  /**
   * Save all preferences to the PREF cookie.
   * [was: save]
   */
  save() { // was: save()
    let secure = true;
    if (isExperimentEnabled("web_secure_pref_cookie_killswitch")) secure = false;
    setCookie(this.cookieName, this.dump(), 63072000, this.cookieDomain, secure);
  }

  /**
   * Clear all preferences.
   * [was: clear]
   */
  clear() { // was: clear()
    clearObject(userPrefs);
  }

  /**
   * Serialize all preferences to a query string.
   * [was: dump]
   * @returns {string}
   */
  dump() { // was: dump()
    const parts = []; // was: Q
    for (const key in userPrefs) {
      if (userPrefs.hasOwnProperty(key)) {
        parts.push(`${key}=` + encodeURIComponent(String(userPrefs[key])));
      }
    }
    return parts.join("&");
  }

  /**
   * Parse a preference string (query-string format).
   * [was: parse]
   * @param {string} raw [was: Q]
   */
  parse(raw) { // was: parse(Q)
    const pairs = decodeURIComponent(raw).split("&"); // was: Q
    for (let i = 0; i < pairs.length; i++) { // was: W
      const parts = pairs[i].split("="); // was: c
      const key = parts[0]; // was: m
      const value = parts[1]; // was: c
      if (value) userPrefs[key] = value.toString();
    }
  }
}

/** @type {?UserPreferences} Singleton instance [was: Vg] */
let preferencesInstance; // was: Vg

// =========================================================================
// Connection type mappings   [was: qV3, gCy, OVw, Dyy, lines 67116-67160]
// =========================================================================

/**
 * Maps Network Information API type strings to internal connection-type constants.
 *
 * [was: qV3]
 * @type {Object<string, string>}
 */
export const NETWORK_TYPE_MAP = { // was: qV3
  bluetooth: "CONN_DISCO",
  cellular: "CONN_CELLULAR_UNKNOWN",
  ethernet: "CONN_WIFI",
  none: "CONN_NONE",
  wifi: "CONN_WIFI",
  wimax: "CONN_CELLULAR_4G",
  other: "CONN_UNKNOWN",
  unknown: "CONN_UNKNOWN",
  "slow-2g": "CONN_CELLULAR_2G",
  "2g": "CONN_CELLULAR_2G",
  "3g": "CONN_CELLULAR_3G",
  "4g": "CONN_CELLULAR_4G",
};

/**
 * Internal connection-type enum to numeric ID.
 *
 * [was: gCy]
 * @type {Object<string, number>}
 */
export const CONNECTION_TYPE_IDS = { // was: gCy
  CONN_DEFAULT: 0,
  CONN_UNKNOWN: 1,
  CONN_NONE: 2,
  CONN_WIFI: 3,
  CONN_CELLULAR_2G: 4,
  CONN_CELLULAR_3G: 5,
  CONN_CELLULAR_4G: 6,
  CONN_CELLULAR_UNKNOWN: 7,
  CONN_DISCO: 8,
  CONN_CELLULAR_5G: 9,
  CONN_WIFI_METERED: 10,
  CONN_CELLULAR_5G_SA: 11,
  CONN_CELLULAR_5G_NSA: 12,
  CONN_WIRED: 30,
  CONN_INVALID: 31,
};

/**
 * Effective connection type enum to numeric ID.
 *
 * [was: OVw]
 * @type {Object<string, number>}
 */
export const EFFECTIVE_CONNECTION_TYPE_IDS = { // was: OVw
  EFFECTIVE_CONNECTION_TYPE_UNKNOWN: 0,
  EFFECTIVE_CONNECTION_TYPE_OFFLINE: 1,
  EFFECTIVE_CONNECTION_TYPE_SLOW_2G: 2,
  EFFECTIVE_CONNECTION_TYPE_2G: 3,
  EFFECTIVE_CONNECTION_TYPE_3G: 4,
  EFFECTIVE_CONNECTION_TYPE_4G: 5,
};

/**
 * Maps effectiveType strings to internal effective-connection-type constants.
 *
 * [was: Dyy]
 * @type {Object<string, string>}
 */
export const EFFECTIVE_TYPE_MAP = { // was: Dyy
  "slow-2g": "EFFECTIVE_CONNECTION_TYPE_SLOW_2G",
  "2g": "EFFECTIVE_CONNECTION_TYPE_2G",
  "3g": "EFFECTIVE_CONNECTION_TYPE_3G",
  "4g": "EFFECTIVE_CONNECTION_TYPE_4G",
};

// ── Lines 67161-67267 are covered in errors.js ──

// =========================================================================
// IDB error tables (overlap reference)   [was: InW, XgK, Ae7, lines 67267-67308]
// =========================================================================

// NOTE: The InW, XgK, and Ae7 tables are fully deobfuscated in
// /deobfuscate/core/errors.js. They are referenced here for completeness
// but not duplicated.

// =========================================================================
// IdbKnownError / MissingObjectStoresError / IndexError
// [was: g.fg, eVd, aC, NDm, lines 67309-67345]
// =========================================================================

// NOTE: These classes are fully deobfuscated in /deobfuscate/core/errors.js.
// The source lines 67309-67345 are covered there. Only the sentinel is noted:

/**
 * IdbKnownError class.
 * See /deobfuscate/core/errors.js for full implementation.
 * [was: g.fg, lines 67309-67323]
 */

/**
 * MissingObjectStoresError class.
 * See /deobfuscate/core/errors.js for full implementation.
 * [was: eVd, lines 67326-67334]
 */

/**
 * IndexError class -- thrown when an IDB index is missing.
 * [was: aC, lines 67336-67343]
 */
export class IndexError extends Error { // was: aC
  /**
   * @param {string} index - The missing index name [was: Q]
   * @param {string} objectStore - The object store name [was: c]
   */
  constructor(index, objectStore) { // was: constructor(Q, c)
    super();

    /** @type {string} [was: this.index] */
    this.index = index;

    /** @type {string} [was: this.objectStore] */
    this.objectStore = objectStore;

    Object.setPrototypeOf(this, IndexError.prototype);
  }
}

/**
 * Known IDB error messages that indicate a closed or read-only database.
 * See also /deobfuscate/core/errors.js -- CLOSED_DB_ERROR_MESSAGES.
 *
 * [was: NDm, line 67345]
 * @type {string[]}
 */
export const CLOSED_DB_MESSAGES = [
  "The database connection is closing",
  "Can't start a transaction on a closed database",
  "A mutation operation was attempted on a database that createSha1 not allow mutations",
];

// ── Lines 67347-67436 are covered in promise.js ──
