/**
 * idb-transactions.js -- IndexedDB storage layer, transaction handling,
 * IDB promise wrappers, domain/TLD helpers, HTTP utilities, and AJAX
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~9732-9750 (null window),
 *   11019-11098 (URL/query/domain helpers), 11191-11565 (XHR, AJAX, fetch),
 *   12260-13055 (IDB core: transactions, cursors, open/delete/meta),
 *   67265-67345 (IDB error types & constants),
 *   67346-67437 (IDB micro-promise),
 *   67438-67822 (IDB wrapper classes: cursor, connection, objectStore,
 *     transaction, index, database-definition),
 *   67823-67900+ (GCF config store)
 *
 * Provides:
 *  - Null/closed window stub for popup fallback
 *  - Query-string serialisation & parsing helpers
 *  - TLD parsing, YouTube/Google domain detection
 *  - HTTPS validation
 *  - Same-origin check
 *  - XHR wrapper (`sendXhr` / `cn`) and `fetch`-based AJAX (`fetchRequest`)
 *  - Full-lifecycle AJAX helper (`g.Wn` / `sendRequest`)
 *  - Auth-header injection (`buildRequestHeaders`)
 *  - IndexedDB micro-promise (`IdbPromise` / `g.P8`)
 *  - IDB request/event helpers (`wrapIdbRequest`, `wrapIdbRequestNative`)
 *  - IDB cursor iteration (`iterateCursor`)
 *  - IDB transaction wrapper with retry (`runTransaction` / `g.MD`)
 *  - IDB object-store / index / cursor wrapper classes
 *  - IDB connection class (`IdbConnection` / `uv_`)
 *  - IDB database opening, deletion, and metadata registry
 *  - IDB availability probing (`canUseIdb` / `ksX`)
 *  - IDB token management (`getIdbToken` / `g.AD`)
 *  - User-scoped database helpers
 *  - GCF (Google Config Framework) IDB config store
 *
 * @module data/idb-transactions
 */

import { getDatasyncId } from '../core/attestation.js';  // was: g.Dk
import { getConfig, getTextContent, logError } from '../core/composition-helpers.js';  // was: g.v, g.Z3y, g.Zp
import { globalRef, setPrototypeOf } from '../core/polyfills.js';  // was: g.IW, g.Wmm
import { getConnection } from '../modules/remote/mdx-client.js';  // was: g.o3
import { doc } from '../proto/messages-core.js';  // was: g.cN
import { logWarning } from '../core/composition-helpers.js'; // was: si
import { ErrorReporter } from '../proto/message-defs.js'; // was: jBy
import { createDatabaseDefinition } from './idb-transactions.js'; // was: el
import { audioTrackLabelMap } from '../player/time-tracking.js'; // was: h5
import { IdbPromise } from './idb-transactions.js'; // was: g.P8
import { shouldUseDesktopControls } from './bandwidth-tracker.js'; // was: tx
import { forEachObject, hasKey, extendObject, isEmptyObject } from '../core/object-utils.js';
import { encodeParam, appendParamsToUrl, parseUri, getDomain, buildQueryFromObject } from '../core/url-utils.js';
import { forEach } from '../core/event-registration.js';
import { extend, clear } from '../core/array-utils.js';
import { startsWith, endsWith, contains } from '../core/string-utils.js';
import { getElementsByTagName } from '../core/dom-utils.js';
import { isObject, getObjectByPath } from '../core/type-helpers.js';
import { IdbKnownError } from '../core/errors.js';
// TODO: resolve g.fg
// TODO: resolve g.h
// TODO: resolve g.rU
// TODO: resolve g.v8

// ============================================================================
// Null / Closed Window Stub  (line 9732)
// ============================================================================

/**
 * Creates a stub window object that behaves as if the window is closed.
 * Used as a safe fallback when `window.open()` is blocked or unavailable.
 *
 * [was: Uo]
 * @returns {Object} a duck-typed window-like object
 */
export function createNullWindow() { // was: Uo
  return {
    get opener() {
      return null;
    },
    get closed() {
      return true; // was: !0
    },
    get location() {
      throwSecurityError(); // was: r2()
    },
    get document() {
      throwSecurityError(); // was: r2()
    },
    postMessage() {},
    close() {},
    focus() {},
  };
}

// ============================================================================
// Query-string serialisation helpers  (lines 11019-11066)
// ============================================================================

/**
 * Serialises an object of key-value pairs into a `&`-delimited query string.
 * Array values produce repeated `key=val` entries.
 *
 * [was: w_]
 * @param {Object} params [was: Q]
 * @returns {string}
 */
export function serialiseParams(params) { // was: w_
  const parts = []; // was: c
  forEachObject(params, (value, key) => { // was: (W, m)
    const encodedKey = encodeParam(key); // was: K
    forEach(Array.isArray(value) ? value : [value], (val) => { // was: T
      val == '' ? parts.push(encodedKey) : parts.push(`${encodedKey}=${encodeParam(val)}`);
    });
  });
  return parts.join('&');
}

/**
 * Parses a `&`-delimited query string into an object.
 * Leading `?` is stripped automatically.
 *
 * [was: bk]
 * @param {string} queryString [was: Q]
 * @returns {Object}
 */
export function parseQueryString(queryString) { // was: bk
  queryString.charAt(0) === '?' && (queryString = queryString.substring(1));
  return parseKeyValueString(queryString, '&'); // was: Le(Q, "&")
}

/**
 * Splits a comma-separated list of query strings and parses each one.
 *
 * [was: jD]
 * @param {string} str [was: Q]
 * @returns {Object[]}
 */
export function parseCommaSeparatedQueries(str) { // was: jD
  return str.split(',').map((part) => parseQueryString(part)); // was: c => bk(c)
}

/**
 * Extracts the query-string portion from a full URL and parses it.
 *
 * [was: g.g_]
 * @param {string} url [was: Q]
 * @returns {Object}
 */
export function parseUrlQueryString(url) { // was: g.g_
  return url.indexOf('?') !== -1
    ? ((url = (url || '').split('#')[0]),
      (url = url.split('?', 2)),
      parseQueryString(url.length > 1 ? url[1] : url[0]))
    : {};
}

/**
 * Appends query parameters to a URL, overwriting existing params.
 *
 * [was: fe]
 * @param {string} url    [was: Q]
 * @param {Object} params [was: c]
 * @returns {string}
 */
export function appendQueryParams(url, params) { // was: fe
  return mergeQueryParams(url, params || {}, true); // was: Oi(Q, c || {}, !0)
}

/**
 * Appends query parameters to a URL, preserving existing params.
 *
 * [was: vz]
 * @param {string} url    [was: Q]
 * @param {Object} params [was: c]
 * @returns {string}
 */
export function appendQueryParamsPreserveExisting(url, params) { // was: vz
  return mergeQueryParams(url, params || {}, false); // was: Oi(Q, c || {}, !1)
}

/**
 * Core URL query-parameter merge logic. Splits the URL at `?` and `#`,
 * parses existing query params, merges the new ones, and re-assembles.
 *
 * [was: Oi]
 * @param {string}  url       [was: Q]
 * @param {Object}  params    [was: c]
 * @param {boolean} overwrite [was: W] -- if true, overwrites existing keys
 * @returns {string}
 */
function mergeQueryParams(url, params, overwrite) { // was: Oi
  let hashParts = url.split('#', 2); // was: m
  url = hashParts[0];
  const hash = hashParts.length > 1 ? '#' + hashParts[1] : ''; // was: m
  let queryParts = url.split('?', 2); // was: K
  url = queryParts[0];
  const existing = parseQueryString(queryParts[1] || ''); // was: K = bk(K[1] || "")
  for (const key in params) { // was: T
    if (overwrite || !hasKey(existing, key)) {
      existing[key] = params[key];
    }
  }
  return appendParamsToUrl(url, existing) + hash;
}

/**
 * Parses a key-value string with the given delimiter into an object.
 * Handles URI-decoding of both keys and values, and accumulates
 * duplicate keys into arrays.
 *
 * [was: Le]
 * @param {string} str       [was: Q]
 * @param {string} delimiter [was: c]
 * @returns {Object}
 */
export function parseKeyValueString(str, delimiter) { // was: Le
  const pairs = str.split(delimiter); // was: c = Q.split(c)
  const result = {}; // was: W
  for (let i = 0, len = pairs.length; i < len; i++) { // was: T, r
    const parts = pairs[i].split('='); // was: U
    if ((parts.length === 1 && parts[0]) || parts.length === 2) {
      try {
        const key = safeDecodeURIComponent(parts[0] || ''); // was: I = d_(U[0] || "")
        const value = safeDecodeURIComponent(parts[1] || ''); // was: X = d_(U[1] || "")
        if (key in result) {
          const existing = result[key]; // was: A
          Array.isArray(existing) ? extend(existing, value) : (result[key] = [existing, value]);
        } else {
          result[key] = value;
        }
      } catch (err) { // was: I
        let error = err; // was: m
        const rawKey = parts[0]; // was: K
        const currentStringified = String(parseKeyValueString); // was: X
        error.args = [{
          key: rawKey,
          value: parts[1],
          query: str,
          method: savedLeString === currentStringified ? 'unchanged' : currentStringified, // was: TYy === X ? "unchanged" : X
        }];
        allowedSearchKeys.hasOwnProperty(rawKey) || logWarning(error); // was: oJd.hasOwnProperty(K) || si(m)
      }
    }
  }
  return result;
}

// ============================================================================
// URL-decoding helper  (references line 1361, 66696)
// ============================================================================

/** @type {RegExp} Matches strings consisting only of word chars and dots. [was: USK] */
const SAFE_CHARS_RE = /^[\w.]*$/; // was: USK

/** @type {Object} Query keys that suppress error logging. [was: oJd] */
const allowedSearchKeys = { q: true, search_query: true }; // was: oJd  -- !0 -> true

/** @type {string} Snapshot of Le's toString at init time. [was: TYy] */
const savedLeString = String(parseKeyValueString); // was: TYy = String(Le)

/**
 * Decodes a URI component, falling back to `decodeURIComponent` for
 * plus-sign handling if the string contains non-word chars.
 *
 * [was: d_]
 * @param {string} str [was: Q]
 * @returns {string}
 */
export function safeDecodeURIComponent(str) { // was: d_
  return str && str.match(SAFE_CHARS_RE) ? str : plusDecode(str); // was: Ni(Q)
}

/**
 * Decodes a URI component, converting `+` to space first.
 *
 * [was: Ni]  (line 1361)
 * @param {string} str [was: Q]
 * @returns {string}
 */
export function plusDecode(str) { // was: Ni
  return decodeURIComponent(str.replace(/\+/g, ' '));
}

// ============================================================================
// TLD / Domain helpers  (lines 11079-11098)
// ============================================================================

/**
 * Checks whether the given URL (or `document.location.href` by default)
 * uses the HTTPS scheme.
 *
 * [was: Gn]
 * @param {string} [url] [was: Q]
 * @returns {boolean}
 */
export function isHttps(url) { // was: Gn
  url || (url = document.location.href);
  url = parseUri(url)[1] || null; // was: Q = g.qN(Q)[1] || null
  return url !== null && url === 'https';
}

/**
 * Checks whether the given URL belongs to a YouTube domain
 * (`youtube.com`, `youtubekids.com`, or `youtube-nocookie.com`).
 *
 * [was: Pz]
 * @param {string} url [was: Q]
 * @returns {boolean}
 */
export function isYouTubeDomain(url) { // was: Pz
  url = reverseDomainParts(url); // was: Q = $3(Q)
  return url === null
    ? false // was: !1
    : url[0] === 'com' && url[1].match(/^youtube(?:kids|-nocookie)?$/)
      ? true  // was: !0
      : false; // was: !1
}

/**
 * Checks whether the given URL belongs to a Google domain,
 * including regional variants (`google.com.au`, `google.co.uk`).
 *
 * [was: rCm]
 * @param {string} url [was: Q]
 * @returns {boolean}
 */
export function isGoogleDomain(url) { // was: rCm
  url = reverseDomainParts(url); // was: Q = $3(Q)
  return url === null
    ? false // was: !1
    : url[1] === 'google'
      ? true  // was: !0
      : url[2] === 'google'
        ? (url[0] === 'au' && url[1] === 'com')
          ? true  // was: !0
          : (url[0] === 'uk' && url[1] === 'co')
            ? true  // was: !0
            : false // was: !1
        : false; // was: !1
}

/**
 * Extracts the hostname from a URL, splits it by `.`, and reverses the
 * resulting array so the TLD comes first.
 * Returns `null` if no hostname can be extracted.
 *
 * [was: $3]
 * @param {string} url [was: Q]
 * @returns {string[]|null}
 */
export function reverseDomainParts(url) { // was: $3
  url = getDomain(url); // was: Q = g.D9(Q)
  return url !== null ? url.split('.').reverse() : null;
}

// ============================================================================
// Same-origin check  (line 11068)
// ============================================================================

/**
 * Determines whether the given URL is same-origin with the current page.
 * Compares scheme, hostname and port when available. Relative URLs are
 * always considered same-origin.
 *
 * [was: ax]
 * @param {string} url [was: Q]
 * @returns {boolean}
 */
export function isSameOrigin(url) { // was: ax
  let ref; // was: c  (var c in original, hoisted)
  if (!ref) ref = window.location.href;
  const scheme = parseUri(url)[1] || null; // was: W
  const host = getDomain(url); // was: m
  if (scheme && host) {
    const urlParts = parseUri(url);   // was: Q = g.qN(Q)
    const refParts = parseUri(ref);   // was: c = g.qN(c)
    return urlParts[3] == refParts[3] && urlParts[1] == refParts[1] && urlParts[4] == refParts[4];
  }
  return host
    ? getDomain(ref) === host &&
      (Number(parseUri(ref)[4] || null) || null) === (Number(parseUri(url)[4] || null) || null)
    : true; // was: !0
}

// ============================================================================
// HTTP status helpers  (lines 11198-11216)
// ============================================================================

/**
 * Returns the HTTP status code from an XHR-like object, or -1 if unavailable.
 *
 * [was: uk]
 * @param {Object} xhr [was: Q]
 * @returns {number}
 */
export function getHttpStatus(xhr) { // was: uk
  return xhr && 'status' in xhr ? xhr.status : -1;
}

/**
 * Returns `true` if the HTTP status indicates a successful response
 * (2xx or 304).
 *
 * [was: g.hB]
 * @param {Object} xhr [was: Q]
 * @returns {boolean}
 */
export function isSuccessStatus(xhr) { // was: g.hB
  switch (getHttpStatus(xhr)) { // was: uk(Q)
    case 200:
    case 201:
    case 202:
    case 203:
    case 204:
    case 205:
    case 206:
    case 304:
      return true; // was: !0
    default:
      return false; // was: !1
  }
}

// ============================================================================
// Timer helpers  (lines 11218-11253)
// ============================================================================

/**
 * Wrapper around `window.setTimeout` that accepts a raw function and
 * wraps it with `wrapWithErrorReporter` for error-boundary handling.
 *
 * [was: g.zn]
 * @param {Function|*} callback [was: Q]
 * @param {number}     delayMs  [was: c]
 * @returns {number} timer ID
 */
export function safeSetTimeout(callback, delayMs) { // was: g.zn
  typeof callback === 'function' && (callback = wrapWithErrorReporter(callback));
  return window.setTimeout(callback, delayMs);
}

/**
 * Wrapper around `window.setInterval`.
 *
 * [was: g.Ce]
 * @param {Function|*} callback [was: Q]
 * @param {number}     intervalMs [was: c]
 * @returns {number} timer ID
 */
export function safeSetInterval(callback, intervalMs) { // was: g.Ce
  typeof callback === 'function' && (callback = wrapWithErrorReporter(callback));
  return window.setInterval(callback, intervalMs);
}

/**
 * Clears a timeout created with `safeSetTimeout`.
 *
 * [was: g.JB]
 * @param {number} timerId [was: Q]
 */
export function safeClearTimeout(timerId) { // was: g.JB
  window.clearTimeout(timerId);
}

/**
 * Clears an interval created with `safeSetInterval`.
 *
 * [was: g.Rx]
 * @param {number} timerId [was: Q]
 */
export function safeClearInterval(timerId) { // was: g.Rx
  window.clearInterval(timerId);
}

// ============================================================================
// Experiment-flag accessors  (lines 11256-11289)
// ============================================================================

/**
 * Reads an experiment flag and coerces it to boolean.
 * The string `"false"` is treated as `false`.
 *
 * [was: g.P]
 * @param {string} flagName [was: Q]
 * @returns {boolean}
 */
export function getExperimentBoolean(flagName) { // was: g.P
  flagName = getExperimentFlag(flagName); // was: Q = k3(Q)
  return typeof flagName === 'string' && flagName === 'false' ? false : !!flagName; // was: !1 / !!Q
}

/**
 * Reads an experiment flag as a number, with an optional default.
 *
 * [was: Y3]
 * @param {string} flagName     [was: Q]
 * @param {number} [defaultVal] [was: c]
 * @returns {number}
 */
export function getExperimentNumber(flagName, defaultVal) { // was: Y3
  flagName = getExperimentFlag(flagName); // was: Q = k3(Q)
  return flagName === undefined && defaultVal !== undefined ? defaultVal : Number(flagName || 0);
}

/**
 * Returns the experiments token string from `EXPERIMENTS_TOKEN`.
 *
 * [was: pe]
 * @returns {string}
 */
export function getExperimentsToken() { // was: pe
  return getConfig('EXPERIMENTS_TOKEN', '');
}

/**
 * Reads a single experiment flag from `EXPERIMENT_FLAGS`.
 *
 * [was: k3]
 * @param {string} flagName [was: Q]
 * @returns {*}
 */
export function getExperimentFlag(flagName) { // was: k3
  return getConfig('EXPERIMENT_FLAGS', {})[flagName];
}

/**
 * Collects all forced experiment flags (from `EXPERIMENTS_FORCED_FLAGS` and
 * any `force_*` keys in `EXPERIMENT_FLAGS`) into an array of `{key, value}`.
 *
 * [was: Q5]
 * @returns {Array<{key: string, value: string}>}
 */
export function getForcedExperimentFlags() { // was: Q5
  const result = []; // was: Q
  const forced = getConfig('EXPERIMENTS_FORCED_FLAGS', {}); // was: c
  for (let key of Object.keys(forced)) { // was: W
    result.push({ key, value: String(forced[key]) });
  }
  const allFlags = getConfig('EXPERIMENT_FLAGS', {}); // was: W (reused)
  for (const key of Object.keys(allFlags)) { // was: m
    if (key.startsWith('force_') && forced[key] === undefined) {
      result.push({ key, value: String(allFlags[key]) });
    }
  }
  return result;
}

// ============================================================================
// XHR factory & low-level sender  (lines 11191-11327)
// ============================================================================

/**
 * Returns an `XMLHttpRequest` instance if available, or `null`.
 *
 * [was: BYX]
 * @returns {XMLHttpRequest|null}
 */
export function createXhr() { // was: BYX
  if (!xhrFactory) return null; // was: VWw
  const xhr = xhrFactory(); // was: Q = VWw()
  return 'open' in xhr ? xhr : null;
}

/**
 * Opens, configures, and sends an XMLHttpRequest.
 *
 * [was: cn]  (also aliased as NYx)
 * @param {string}   url              [was: Q]
 * @param {Function} callback         [was: c]
 * @param {string}   [method="GET"]   [was: W]
 * @param {string}   [body=""]        [was: m]
 * @param {Object}   [headers]        [was: K]
 * @param {string}   [responseType]   [was: T]
 * @param {boolean}  [withCredentials] [was: r]
 * @param {boolean}  [useAttribution=false] [was: U]
 * @param {Function} [onProgress]     [was: I]
 * @returns {XMLHttpRequest|null}
 */
export function sendXhr( // was: cn
  url,
  callback,
  method = 'GET',
  body = '',
  headers,
  responseType,
  withCredentials,
  useAttribution = false, // was: U=!1
  onProgress,
) {
  const xhr = createXhr(); // was: X = BYX()
  if (!xhr) return null;

  const onLoadEnd = () => { // was: A
    const readyState = xhr && 'readyState' in xhr ? xhr.readyState : 0;
    readyState === 4 && callback && wrapWithErrorReporter(callback)(xhr);
  };

  'onloadend' in xhr
    ? xhr.addEventListener('loadend', onLoadEnd, false) // was: !1
    : (xhr.onreadystatechange = onLoadEnd);

  getExperimentBoolean('debug_forward_web_query_parameters') && (url = forwardQueryParams(url)); // was: g.P(...) && (Q = xSd(Q))

  xhr.open(method, url, true); // was: !0
  responseType && (xhr.responseType = responseType);
  withCredentials && (xhr.withCredentials = true); // was: !0

  let setContentType = method === 'POST' && (window.FormData === undefined || !(body instanceof FormData)); // was: W
  const merged = buildRequestHeaders(url, headers); // was: K = qgO(Q, K)
  if (merged) {
    for (const name in merged) {
      xhr.setRequestHeader(name, merged[name]);
      'content-type' === name.toLowerCase() && (setContentType = false); // was: !1
    }
  }
  setContentType && xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

  onProgress &&
    'onprogress' in xhr &&
    (xhr.onprogress = () => {
      onProgress(xhr.responseText);
    });

  if (useAttribution && 'setAttributionReporting' in XMLHttpRequest.prototype) {
    const config = {
      eventSourceEligible: true,  // was: !0
      triggerEligible: false,     // was: !1
    };
    try {
      xhr.setAttributionReporting(config);
    } catch (err) {
      logWarning(err); // was: si(e)
    }
  }

  xhr.send(body);
  return xhr;
}

// ============================================================================
// Auth-header builder  (lines 11329-11365)
// ============================================================================

/**
 * Builds the set of HTTP headers to attach to an AJAX request.
 * Injects auth tokens, visitor IDs, client identifiers and ad-signal
 * headers based on the current YouTube configuration.
 *
 * [was: qgO]
 * @param {string} url               [was: Q]
 * @param {Object} [existingHeaders]  [was: c]
 * @returns {Object} merged headers
 */
export function buildRequestHeaders(url, existingHeaders = {}) { // was: qgO
  const isCrossOrigin = isSameOrigin(url); // was: W = ax(Q)  -- note: `ax` returns true for same-origin
  const clientName = getConfig('INNERTUBE_CLIENT_NAME'); // was: m
  const ignoreGlobalIfSet = getExperimentBoolean('web_ajax_ignore_global_headers_if_set'); // was: K

  for (const headerName in HEADER_CONFIG_MAP) { // was: U in nJy
    let headerValue = getConfig(HEADER_CONFIG_MAP[headerName]); // was: I
    const isSessionHeader = headerName === 'X-Goog-AuthUser' || headerName === 'X-Goog-PageId'; // was: X

    // Fall back to VISITOR_DATA for the visitor-ID header
    headerName === 'X-Goog-Visitor-Id' && !headerValue && (headerValue = getConfig('VISITOR_DATA'));

    let skip; // was: T
    if (!(skip = !headerValue)) {
      if (!(skip = isCrossOrigin || (getDomain(url) ? false : true))) { // was: !1 / !0
        let isRemarketingException; // was: r
        if (
          (isRemarketingException =
            getExperimentBoolean('add_auth_headers_to_remarketing_google_dot_com_ping') &&
            headerName === 'Authorization' &&
            (clientName === 'TVHTML5' || clientName === 'TVHTML5_UNPLUGGED' || clientName === 'TVHTML5_SIMPLY') &&
            isGoogleDomain(url))
        ) {
          let path = getUrlPath(url) || ''; // was: T = tF(T) || ""
          path = path.split('/');
          path = '/' + (path.length > 1 ? path[1] : '');
          isRemarketingException = path === '/pagead';
        }
        skip = isRemarketingException ? true : false; // was: !0 / !1
      }
      skip = !skip;
    }

    if (skip) continue;
    if (ignoreGlobalIfSet && existingHeaders[headerName] !== undefined) continue;
    if (clientName === 'TVHTML5_UNPLUGGED' && isSessionHeader) continue;

    existingHeaders[headerName] = headerValue;
  }

  // Prefer EOM visitor ID when both are present
  if ('X-Goog-EOM-Visitor-Id' in existingHeaders && 'X-Goog-Visitor-Id' in existingHeaders) {
    delete existingHeaders['X-Goog-Visitor-Id'];
  }

  // Timezone offset
  if (isCrossOrigin || !getDomain(url)) {
    existingHeaders['X-YouTube-Utc-Offset'] = String(-(new Date()).getTimezoneOffset());
  }

  // IANA timezone
  if (isCrossOrigin || !getDomain(url)) {
    let timeZone; // was: U
    try {
      timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {}
    timeZone && (existingHeaders['X-YouTube-Time-Zone'] = timeZone);
  }

  // Ad signals
  document.location.hostname.endsWith('youtubeeducation.com') ||
    (!isCrossOrigin && getDomain(url)) ||
    (existingHeaders['X-YouTube-Ad-Signals'] = serialiseParams(collectAdSignals())); // was: w_(lk())

  return existingHeaders;
}

/**
 * Map of HTTP header names to YouTube config keys from which
 * their values are read at request time.
 *
 * [was: nJy]  (line 66716)
 */
const HEADER_CONFIG_MAP = { // was: nJy
  Authorization: 'AUTHORIZATION',
  'X-Goog-EOM-Visitor-Id': 'EOM_VISITOR_DATA',
  'X-Goog-Visitor-Id': 'SANDBOXED_VISITOR_ID',
  'X-Youtube-Domain-Admin-State': 'DOMAIN_ADMIN_STATE',
  'X-Youtube-Chrome-Connected': 'CHROME_CONNECTED_HEADER',
  'X-YouTube-Client-Name': 'INNERTUBE_CONTEXT_CLIENT_NAME',
  'X-YouTube-Client-Version': 'INNERTUBE_CONTEXT_CLIENT_VERSION',
  'X-YouTube-Delegation-Context': 'INNERTUBE_CONTEXT_SERIALIZED_DELEGATION_CONTEXT',
  'X-YouTube-Device': 'DEVICE',
  'X-Youtube-Identity-Token': 'ID_TOKEN',
  'X-YouTube-Page-CL': 'PAGE_CL',
  'X-YouTube-Page-Label': 'PAGE_BUILD_LABEL',
  'X-Goog-AuthUser': 'SESSION_INDEX',
  'X-Goog-PageId': 'DELEGATED_SESSION_ID',
};

// ============================================================================
// AJAX helpers  (lines 11367-11565)
// ============================================================================

/**
 * Sends a POST request via `sendRequest`.
 *
 * [was: ms]
 * @param {string} url     [was: Q]
 * @param {Object} options [was: c]
 * @returns {XMLHttpRequest}
 */
export function sendPostRequest(url, options) { // was: ms
  options.method = 'POST';
  options.postParams || (options.postParams = {});
  return sendRequest(url, options); // was: g.Wn(Q, c)
}

/**
 * Sends a request using the Fetch API when available, falling back
 * to `sendRequest` for XML-format requests or when `fetch` is missing.
 *
 * [was: H3W]
 * @param {string} url     [was: Q]
 * @param {Object} options [was: c]
 */
export function fetchRequest(url, options) { // was: H3W
  if (window.fetch && options.format !== 'XML') {
    const init = { // was: W
      method: options.method || 'GET',
      credentials: 'same-origin',
    };
    options.headers && (init.headers = options.headers);
    options.priority && (init.priority = options.priority);

    url = buildRequestUrl(url, options); // was: DSX(Q, c)
    const body = buildRequestBody(url, options); // was: m = tWO(Q, c)
    body && (init.body = body);
    options.withCredentials && (init.credentials = 'include');

    const context = options.context || globalRef; // was: K
    let completed = false; // was: T = !1
    let timeoutId; // was: r

    fetch(url, init)
      .then((response) => { // was: U
        if (!completed) {
          completed = true; // was: !0
          timeoutId && safeClearTimeout(timeoutId);

          const isOk = response.ok; // was: I
          const handle = (data) => { // was: X = A => {...}
            data = data || {};
            isOk
              ? options.onSuccess && options.onSuccess.call(context, data, response)
              : options.onError && options.onError.call(context, data, response);
            options.onFinish && options.onFinish.call(context, data, response);
          };

          const fmt = options.format || 'JSON';
          (fmt === 'JSON' && (isOk || (response.status >= 400 && response.status < 500)))
            ? response.json().then(handle, () => handle(null))
            : handle(null);
        }
      })
      .catch(() => {
        options.onError && options.onError.call(context, {}, {});
      });

    const timeout = options.timeout || 0;
    if (options.onFetchTimeout && timeout > 0) {
      timeoutId = safeSetTimeout(() => {
        if (!completed) {
          completed = true; // was: !0
          safeClearTimeout(timeoutId);
          options.onFetchTimeout.call(options.context || globalRef);
        }
      }, timeout);
    }
  } else {
    sendRequest(url, options); // was: g.Wn(Q, c)
  }
}

/**
 * Full-lifecycle AJAX helper using XHR.
 * Handles success/error/timeout callbacks and response parsing.
 *
 * [was: g.Wn]
 * @param {string} url     [was: Q]
 * @param {Object} options [was: c]
 * @returns {XMLHttpRequest}
 */
export function sendRequest(url, options) { // was: g.Wn
  const format = options.format || 'JSON'; // was: W
  url = buildRequestUrl(url, options); // was: DSX(Q, c)
  let body = buildRequestBody(url, options); // was: m = tWO(Q, c)
  let completed = false; // was: K = !1
  let timeoutId; // was: T

  const xhr = sendXhr(url, (response) => { // was: r = NYx(Q, U => {...})
    if (!completed) {
      completed = true; // was: !0
      timeoutId && safeClearTimeout(timeoutId);

      let isOk = isSuccessStatus(response); // was: I = g.hB(U)
      let parsedData = null; // was: X
      const is4xx = 400 <= response.status && response.status < 500; // was: A
      const is5xx = 500 <= response.status && response.status < 600; // was: e

      if (isOk || is4xx || is5xx) {
        parsedData = parseAjaxResponse(url, format, response, options.convertToSafeHtml); // was: i33(Q, W, U, c.convertToSafeHtml)
      }
      isOk && (isOk = validateAjaxResponse(format, response, parsedData)); // was: yCK(W, U, X)
      parsedData = parsedData || {};

      const ctx = options.context || globalRef; // was: A (reused)
      isOk
        ? options.onSuccess && options.onSuccess.call(ctx, response, parsedData)
        : options.onError && options.onError.call(ctx, response, parsedData);
      options.onFinish && options.onFinish.call(ctx, response, parsedData);
    }
  }, options.method, body, options.headers, options.responseType, options.withCredentials, false, options.onProgress); // was: !1

  body = options.timeout || 0;
  if (options.onTimeout && body > 0) {
    const onTimeout = options.onTimeout; // was: U
    timeoutId = safeSetTimeout(() => {
      if (!completed) {
        completed = true; // was: !0
        xhr.abort();
        safeClearTimeout(timeoutId);
        onTimeout.call(options.context || globalRef, xhr);
      }
    }, body);
  }
  return xhr;
}

/**
 * Prepends the full origin to a relative URL and strips the XSRF param
 * from URL params.
 *
 * [was: DSX]
 * @param {string} url     [was: Q]
 * @param {Object} options [was: c]
 * @returns {string}
 */
export function buildRequestUrl(url, options) { // was: DSX
  options.includeDomain &&
    (url =
      document.location.protocol +
      '//' +
      document.location.hostname +
      (document.location.port ? ':' + document.location.port : '') +
      url);

  const xsrfField = getConfig('XSRF_FIELD_NAME'); // was: W
  let params; // was: c (reused)
  if ((params = options.urlParams)) {
    params[xsrfField] && delete params[xsrfField];
    url = appendQueryParams(url, params); // was: fe(Q, c)
  }
  return url;
}

/**
 * Builds the POST body (form-encoded or JSON), injecting the XSRF token
 * when appropriate.
 *
 * [was: tWO]
 * @param {string} url     [was: Q]
 * @param {Object} options [was: c]
 * @returns {string|null}
 */
export function buildRequestBody(url, options) { // was: tWO
  const xsrfField = getConfig('XSRF_FIELD_NAME'); // was: W
  const xsrfToken = getConfig('XSRF_TOKEN'); // was: m
  let body = options.postBody || ''; // was: K
  let postParams = options.postParams; // was: T
  const xsrfFieldName = getConfig('XSRF_FIELD_NAME'); // was: r
  let contentType; // was: U
  options.headers && (contentType = options.headers['Content-Type']);

  if (
    !options.excludeXsrf &&
    !(getDomain(url) && !options.withCredentials && getDomain(url) !== document.location.hostname) &&
    !(options.method !== 'POST') &&
    !(contentType && contentType !== 'application/x-www-form-urlencoded') &&
    !(options.postParams && options.postParams[xsrfFieldName])
  ) {
    postParams || (postParams = {});
    postParams[xsrfField] = xsrfToken;
  }

  if (postParams && typeof body === 'string') {
    body = parseQueryString(body); // was: bk(K)
    extendObject(body, postParams);
    body =
      options.postBodyFormat && options.postBodyFormat === 'JSON'
        ? JSON.stringify(body)
        : buildQueryFromObject(body);
  }

  const hasBody = body || (postParams && !isEmptyObject(postParams)); // was: T (reused)
  if (!postBodyWarningLogged && hasBody && options.method !== 'POST') { // was: !Sgx
    postBodyWarningLogged = true; // was: Sgx = !0
    logError(Error('AJAX request with postData should use POST'));
  }
  return body;
}

/** @type {boolean} One-shot guard for the POST-body warning. [was: Sgx] */
let postBodyWarningLogged = false; // was: Sgx = !1

// ============================================================================
// Response parsing helpers  (lines 11483-11548)
// ============================================================================

/**
 * Parses an AJAX response body according to the expected format.
 *
 * [was: i33]
 * @param {string}           url             [was: Q]
 * @param {string}           format          [was: c]  -- "JSON" | "XML"
 * @param {XMLHttpRequest}   xhr             [was: W]
 * @param {boolean}          [convertToSafe] [was: m]
 * @returns {Object|null}
 */
export function parseAjaxResponse(url, format, xhr, convertToSafe) { // was: i33
  let result = null; // was: K
  switch (format) {
    case 'JSON': {
      let text; // was: T
      try {
        text = xhr.responseText;
      } catch (err) { // was: r
        const wrapped = Error('Error reading responseText'); // was: m (reused)
        wrapped.params = url;
        logWarning(wrapped);
        throw err;
      }
      const contentType = xhr.getResponseHeader('Content-Type') || ''; // was: Q (reused)
      if (text && contentType.indexOf('json') >= 0) {
        text.substring(0, 5) === ")]}'\n" && (text = text.substring(5));
        try {
          result = JSON.parse(text);
        } catch {}
      }
      break;
    }
    case 'XML': {
      const xmlDoc = (xhr.responseXML ? getXmlRoot(xhr.responseXML) : null); // was: Q (reused)
      if (xmlDoc) {
        result = {};
        forEach(xmlDoc.getElementsByTagName('*'), (createDatabaseDefinition) => { // was: r
          result[createDatabaseDefinition.tagName] = getTextContent(createDatabaseDefinition); // was: Z3y(r)
        });
      }
      break;
    }
  }
  convertToSafe && sanitiseHtmlFields(result); // was: EJ_(K)
  return result;
}

/**
 * Recursively marks `*_html` / `html_content` fields as safe HTML.
 *
 * [was: EJ_]
 * @param {*} obj [was: Q]
 */
function sanitiseHtmlFields(obj) { // was: EJ_
  if (isObject(obj)) {
    for (const key in obj) { // was: c
      key === 'html_content' || q$(key, '_html')
        ? (obj[key] = mk(obj[key]))
        : sanitiseHtmlFields(obj[key]);
    }
  }
}

/**
 * Validates an AJAX response based on the expected format.
 * `204 No Content` is always considered valid.
 *
 * [was: yCK]
 * @param {string} format [was: Q]
 * @param {Object} xhr    [was: c]
 * @param {*}      data   [was: W]
 * @returns {boolean}
 */
export function validateAjaxResponse(format, xhr, data) { // was: yCK
  if (xhr && xhr.status === 204) return true; // was: !0
  switch (format) {
    case 'JSON':
      return !!data;
    case 'XML':
      return Number(data && data.return_code) === 0;
    case 'RAW':
      return true; // was: !0
    default:
      return !!data;
  }
}

/**
 * Extracts the `<root>` element from an XML response.
 *
 * [was: FSx]
 * @param {Document|XMLHttpRequest} doc [was: Q]
 * @returns {Element|null}
 */
function getXmlRoot(doc) { // was: FSx
  if (!doc) return null;
  const roots = ('responseXML' in doc ? doc.responseXML : doc).getElementsByTagName('root');
  return roots && roots.length > 0 ? roots[0] : null;
}

/**
 * Concatenates text content of all child nodes.
 *
 * [was: Z3y]
 * @param {Element} el [was: Q]
 * @returns {string}
 */
function getTextContent(createDatabaseDefinition) { // was: Z3y
  let text = ''; // was: c
  forEach(createDatabaseDefinition.childNodes, (node) => { // was: W
    text += node.nodeValue;
  });
  return text;
}

/**
 * Forwards specific debug query parameters from the current page URL
 * into the given request URL, but only for YouTube domains.
 *
 * [was: xSd]
 * @param {string} url [was: Q]
 * @returns {string}
 */
export function forwardQueryParams(url) { // was: xSd
  const search = window.location.search; // was: c
  let host = getDomain(url); // was: W

  getExperimentBoolean('debug_handle_relative_url_for_query_forward_killswitch') ||
    (!host && isSameOrigin(url) && (host = document.location.hostname)); // was: ax(Q)

  let path = getUrlPath(url); // was: m
  const isYouTube = host && (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')); // was: W (reused)
  path = isYouTube && path && path.startsWith('/api/');

  if (!isYouTube || path) return url;

  const currentParams = parseQueryString(search); // was: K = bk(c)
  const toForward = {}; // was: T
  forEach(FORWARDED_QUERY_PARAMS, (param) => { // was: sUm, r
    currentParams[param] && (toForward[param] = currentParams[param]);
  });
  return appendQueryParamsPreserveExisting(url, toForward); // was: vz(Q, T)
}

/**
 * Query parameters forwarded from the page URL to AJAX requests on
 * YouTube domains.
 *
 * [was: sUm]  (line 66732)
 */
const FORWARDED_QUERY_PARAMS = [ // was: sUm
  'app', 'debugcss', 'debugjs', 'expflag', 'force_ad_params',
  'force_ad_encrypted', 'force_viral_ad_response_params',
  'forced_experiments', 'innertube_snapshots', 'innertube_goldens',
  'internalcountrycode', 'internalipoverride', 'absolute_experiments',
  'conditional_experiments', 'sbb', 'sr_bns_address',
  // ...plus the dev-only params from Jay:
  'absolute_experiments', 'client_dev_domain', 'client_dev_expflag',
  'client_dev_regex_map', 'client_dev_root_url', 'client_rollout_override',
  'expflag', 'forcedCapability', 'jsfeat', 'jsmode', 'mods', 'theme',
];

// ============================================================================
// IDB Event Logging & Error Infrastructure  (lines 12260-12345)
// ============================================================================

/**
 * Returns the cached IDB-last-result entry from the expiring storage layer.
 *
 * [was: sM]  (line 12268)
 * @returns {Object|undefined}
 */
function getLastIdbResult() { // was: sM
  return getIdbExpiringStorage()?.get('LAST_RESULT_ENTRY_KEY', true); // was: EM()?.get(..., !0)
}

/**
 * Reports an IDB error to the diagnostic logger, unless a diagnostic
 * operation is currently in progress (`dl === true`).
 *
 * [was: bK]  (line 12272)
 * @param {Error} error [was: Q]
 */
function reportIdbError(error) { // was: bK
  if (diagnosticInProgress) return; // was: dl
  if (idbLogger) { // was: Lg
    idbLogger.Lw(error);
  } else {
    pendingIdbEvents.push({ type: 'ERROR', payload: error }); // was: wl
    pendingIdbEvents.length > 10 && pendingIdbEvents.shift();
  }
}

/**
 * Logs a structured IDB event to the diagnostic logger.
 *
 * [was: jL]  (line 12280)
 * @param {string} eventType [was: Q]
 * @param {Object} payload   [was: c]
 */
function logIdbEvent(eventType, payload) { // was: jL
  if (diagnosticInProgress) return; // was: dl
  if (idbLogger) { // was: Lg
    idbLogger.logEvent(eventType, payload);
  } else {
    pendingIdbEvents.push({ type: 'EVENT', eventType, payload }); // was: wl
    pendingIdbEvents.length > 10 && pendingIdbEvents.shift();
  }
}

/** @type {Array} Buffered IDB events before the logger is wired up. [was: wl] */
let pendingIdbEvents = []; // was: wl = []

/** @type {Object|undefined} The active IDB diagnostic logger. [was: Lg] */
let idbLogger; // was: Lg

/** @type {boolean} True while an IDB diagnostic probe is running. [was: dl] */
let diagnosticInProgress = false; // was: dl = !1

/**
 * Validates that a database name does not contain `:`.
 *
 * [was: gl]  (line 12289)
 * @param {string} name [was: Q]
 */
function validateDbName(name) { // was: gl
  if (name.indexOf(':') >= 0) {
    throw Error("Database name cannot contain ':'");
  }
}

/**
 * Extracts the public name portion of a potentially user-scoped
 * database name (everything before the first `:`).
 *
 * [was: OM]  (line 12294)
 * @param {string} name [was: Q]
 * @returns {string}
 */
function extractPublicDbName(name) { // was: OM
  return name.substr(0, name.indexOf(':')) || name;
}

// ============================================================================
// IDB Error Classification  (lines 12298-12348, 67266-67345)
// ============================================================================

/**
 * Map of IDB error type -> human-readable message.
 *
 * [was: InW]  (line 67267)
 */
const IDB_ERROR_MESSAGES = { // was: InW
  AUTH_INVALID: 'No user identifier specified.',
  EXPLICIT_ABORT: 'Transaction was explicitly aborted.',
  IDB_NOT_SUPPORTED: 'IndexedDB is not supported.',
  MISSING_INDEX: 'Index not created.',
  MISSING_OBJECT_STORES: 'Object stores not created.',
  DB_DELETED_BY_MISSING_OBJECT_STORES: 'Database is deleted because expected object stores were not created.',
  DB_REOPENED_BY_MISSING_OBJECT_STORES: 'Database is reopened because expected object stores were not created.',
  UNKNOWN_ABORT: 'Transaction was aborted for unknown reasons.',
  QUOTA_EXCEEDED: 'The current transaction exceeded its quota limitations.',
  QUOTA_MAYBE_EXCEEDED: 'The current transaction may have failed because of exceeding quota limitations.',
  EXECUTE_TRANSACTION_ON_CLOSED_DB: "Can't start a transaction on a closed database",
  INCOMPATIBLE_DB_VERSION: 'The binary is incompatible with the database version',
};

/**
 * Map of IDB error type -> severity level.
 *
 * [was: XgK]  (line 67281)
 */
const IDB_ERROR_LEVELS = { // was: XgK
  AUTH_INVALID: 'ERROR',
  EXECUTE_TRANSACTION_ON_CLOSED_DB: 'WARNING',
  EXPLICIT_ABORT: 'IGNORED',
  IDB_NOT_SUPPORTED: 'ERROR',
  MISSING_INDEX: 'WARNING',
  MISSING_OBJECT_STORES: 'ERROR',
  DB_DELETED_BY_MISSING_OBJECT_STORES: 'WARNING',
  DB_REOPENED_BY_MISSING_OBJECT_STORES: 'WARNING',
  QUOTA_EXCEEDED: 'WARNING',
  QUOTA_MAYBE_EXCEEDED: 'WARNING',
  UNKNOWN_ABORT: 'WARNING',
  INCOMPATIBLE_DB_VERSION: 'WARNING',
};

/**
 * Map of IDB error type -> whether the error is retryable.
 *
 * [was: Ae7]  (line 67295)
 */
const IDB_ERROR_RETRYABLE = { // was: Ae7
  AUTH_INVALID: false,                             // was: !1
  EXECUTE_TRANSACTION_ON_CLOSED_DB: false,         // was: !1
  EXPLICIT_ABORT: false,                           // was: !1
  IDB_NOT_SUPPORTED: false,                        // was: !1
  MISSING_INDEX: false,                            // was: !1
  MISSING_OBJECT_STORES: false,                    // was: !1
  DB_DELETED_BY_MISSING_OBJECT_STORES: false,      // was: !1
  DB_REOPENED_BY_MISSING_OBJECT_STORES: false,     // was: !1
  QUOTA_EXCEEDED: false,                           // was: !1
  QUOTA_MAYBE_EXCEEDED: true,                      // was: !0
  UNKNOWN_ABORT: true,                             // was: !0
  INCOMPATIBLE_DB_VERSION: false,                  // was: !1
};

/**
 * Error messages that indicate a transaction on a closed database.
 *
 * [was: NDm]  (line 67345)
 */
const CLOSED_DB_MESSAGES = [ // was: NDm
  'The database connection is closing',
  "Can't start a transaction on a closed database",
  'A mutation operation was attempted on a database that createSha1 not allow mutations',
];

/**
 * Classifies a raw IDB error into a typed `IdbKnownError` (`g.fg`).
 * Handles quota exceeded, unknown abort, missing index, and closed-DB
 * scenarios, falling back to a generic warning with debug metadata.
 *
 * [was: GE]  (line 12298)
 * @param {Error}  error             [was: Q]
 * @param {string} dbName            [was: c]
 * @param {string} objectStoreNames  [was: W]
 * @param {number} dbVersion         [was: m]
 * @returns {Error|IdbKnownError}
 */
export function classifyIdbError(error, dbName, objectStoreNames, dbVersion) { // was: GE
  dbName = extractPublicDbName(dbName); // was: c = OM(c)
  let normalised; // was: K
  normalised = error instanceof Error ? error : Error(`Unexpected error: ${error}`);

  if (normalised instanceof IdbKnownError) return normalised;

  const context = { // was: Q (reused)
    objectStoreNames,
    dbName,
    dbVersion,
  };

  if (normalised.name === 'QuotaExceededError') {
    return new IdbKnownError('QUOTA_EXCEEDED', context);
  }
  if (g.v8 && normalised.name === 'UnknownError') {
    return new IdbKnownError('QUOTA_MAYBE_EXCEEDED', context);
  }
  if (normalised instanceof MissingIndexError) { // was: aC
    return new IdbKnownError('MISSING_INDEX', {
      ...context,
      objectStore: normalised.objectStore,
      index: normalised.index,
    });
  }
  if (normalised.name === 'InvalidStateError' && CLOSED_DB_MESSAGES.some((msg) => normalised.message.includes(msg))) {
    return new IdbKnownError('EXECUTE_TRANSACTION_ON_CLOSED_DB', context);
  }
  if (normalised.name === 'AbortError') {
    return new IdbKnownError('UNKNOWN_ABORT', context, normalised.message);
  }

  normalised.args = [{
    ...context,
    name: 'IdbError',
    audioTrackLabelMap: normalised.name, // was: h5
  }];
  normalised.level = 'WARNING';
  return normalised;
}

/**
 * Creates an `IDB_NOT_SUPPORTED` error with diagnostic context.
 *
 * [was: g.$s]  (line 12332)
 * @param {string} caller     [was: Q]
 * @param {string} publicName [was: c]
 * @param {number} [version]  [was: W]
 * @returns {IdbKnownError}
 */
export function createIdbNotSupportedError(caller, publicName, version) { // was: g.$s
  const lastResult = getLastIdbResult(); // was: m = sM()
  return new IdbKnownError('IDB_NOT_SUPPORTED', {
    context: {
      caller,
      publicName,
      version,
      hasSucceededOnce: lastResult?.hasSucceededOnce,
    },
  });
}

// ============================================================================
// IDB Error Classes  (lines 67309-67344)
// ============================================================================

/**
 * Known IDB error -- typed error with structured metadata.
 * Extends `g.H8` (a base error class).
 *
 * [was: g.fg]  (line 67309)
 */
// (class g.fg is defined on the g namespace in the original)
// g.fg = class extends g.H8 { constructor(type, context, message, level, retryable) { ... } }

/**
 * Error thrown when expected object stores are missing after an IDB open.
 *
 * [was: eVd]  (line 67326)
 */
export class MissingObjectStoresError extends IdbKnownError { // was: eVd
  /**
   * @param {string[]} foundStores    [was: Q]
   * @param {string[]} expectedStores [was: c]
   */
  constructor(foundStores, expectedStores) {
    super('MISSING_OBJECT_STORES', {
      expectedObjectStores: expectedStores,
      foundObjectStores: foundStores,
    }, IDB_ERROR_MESSAGES.MISSING_OBJECT_STORES);
    Object.setPrototypeOf(this, MissingObjectStoresError.prototype);
  }
}

/**
 * Error thrown when an index is not found on an object store.
 *
 * [was: aC]  (line 67336)
 */
export class MissingIndexError extends Error { // was: aC
  /**
   * @param {string} indexName       [was: Q]
   * @param {string} objectStoreName [was: c]
   */
  constructor(indexName, objectStoreName) {
    super();
    this.index = indexName;
    this.objectStore = objectStoreName;
    Object.setPrototypeOf(this, MissingIndexError.prototype);
  }
}

// ============================================================================
// IDB Micro-Promise  (lines 12344-12434, 67346-67437)
// ============================================================================

/**
 * Executor wrapper for `IdbPromise`. Simply holds the resolver function.
 *
 * [was: uK]  (line 67346)
 */
class IdbExecutor { // was: uK
  /** @param {Function} fn [was: Q] -- receives (resolve, reject) */
  constructor(fn) {
    this.W = fn; // was: this.W = Q
  }
}

/**
 * Identity passthrough for the "then" chain -- returns the value unchanged.
 *
 * [was: ysw]  (line 12350)
 * @param {*} value [was: Q]
 * @returns {*}
 */
function identity(value) { // was: ysw
  return value;
}

/**
 * Default rejection handler -- re-throws the error.
 *
 * [was: iU7]  (line 12344)
 * @param {Error} error [was: Q]
 */
function rethrow(error) { // was: iU7
  if (!error) throw Error();
  throw error;
}

/**
 * Handles the "resolve" branch in a chained `IdbPromise.then()`.
 *
 * [was: SVR]  (line 12354)
 */
function handleResolve(source, child, handler, resolve, reject) { // was: SVR(Q, c, W, m, K)
  try {
    if (source.state.status !== 'FULFILLED') {
      throw Error('calling handleResolve before the promise is fulfilled.');
    }
    const result = handler(source.state.value); // was: T = W(Q.state.value)
    result instanceof IdbPromise
      ? chainIdbPromise(source, child, result, resolve, reject) // was: lK(Q, c, T, m, K)
      : resolve(result);
  } catch (err) {
    reject(err);
  }
}

/**
 * Handles the "reject" branch in a chained `IdbPromise.then()`.
 *
 * [was: F47]  (line 12365)
 */
function handleReject(source, child, handler, resolve, reject) { // was: F47(Q, c, W, m, K)
  try {
    if (source.state.status !== 'REJECTED') {
      throw Error('calling handleReject before the promise is rejected.');
    }
    const result = handler(source.state.reason); // was: T = W(Q.state.reason)
    result instanceof IdbPromise
      ? chainIdbPromise(source, child, result, resolve, reject) // was: lK(Q, c, T, m, K)
      : resolve(result);
  } catch (err) {
    reject(err);
  }
}

/**
 * Chains an inner `IdbPromise` result into the outer resolve/reject.
 * Detects circular chains and rejects with a TypeError.
 *
 * [was: lK]  (line 12376)
 */
function chainIdbPromise(source, child, inner, resolve, reject) { // was: lK(Q, c, W, m, K)
  if (child === inner) {
    reject(new TypeError('Circular promise chain detected.'));
  } else {
    inner.then(
      (val) => {
        val instanceof IdbPromise
          ? chainIdbPromise(source, child, val, resolve, reject)
          : resolve(val);
      },
      (err) => reject(err),
    );
  }
}

/**
 * A lightweight synchronous Promise implementation used for IDB operations.
 * Unlike native Promises, callbacks fire synchronously when the state is
 * already settled, which avoids IDB transaction-expiry issues caused by
 * microtask-queue delays.
 *
 * [was: g.P8]  (line 67353)
 */
export class IdbPromise { // was: g.P8
  /**
   * @param {IdbExecutor} executor [was: Q]
   */
  constructor(executor) {
    this.state = { status: 'PENDING' };
    this.W = []; // onFulfilled callbacks
    this.O = []; // onRejected callbacks

    const resolverFn = executor.W; // was: Q = Q.W

    const resolve = (value) => { // was: c
      if (this.state.status === 'PENDING') {
        this.state = { status: 'FULFILLED', value };
        for (const cb of this.W) cb();
      }
    };

    const reject = (reason) => { // was: W
      if (this.state.status === 'PENDING') {
        this.state = { status: 'REJECTED', reason };
        for (const cb of this.O) cb();
      }
    };

    try {
      resolverFn(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  /**
   * Combines an array of IdbPromises into one that resolves when all settle.
   *
   * @param {IdbPromise[]} promises [was: Q]
   * @returns {IdbPromise}
   */
  static all(promises) {
    return new IdbPromise(new IdbExecutor((resolve, reject) => {
      const results = []; // was: m
      let remaining = promises.length; // was: K
      remaining === 0 && resolve(results);
      for (let i = 0; i < promises.length; ++i) {
        IdbPromise.resolve(promises[i]).then((val) => {
          results[i] = val;
          remaining--;
          remaining === 0 && resolve(results);
        }).catch((err) => reject(err));
      }
    }));
  }

  /**
   * Wraps a value (or IdbPromise) in a resolved IdbPromise.
   *
   * @param {*} value [was: Q]
   * @returns {IdbPromise}
   */
  static resolve(value) {
    return new IdbPromise(new IdbExecutor((resolve, reject) => {
      value instanceof IdbPromise ? value.then(resolve, reject) : resolve(value);
    }));
  }

  /**
   * Returns a rejected IdbPromise with the given reason.
   *
   * @param {*} reason [was: Q]
   * @returns {IdbPromise}
   */
  static reject(reason) {
    return new IdbPromise(new IdbExecutor((_resolve, reject) => {
      reject(reason);
    }));
  }

  /**
   * Attaches onFulfilled / onRejected handlers.
   *
   * @param {Function} [onFulfilled] [was: Q]
   * @param {Function} [onRejected]  [was: c]
   * @returns {IdbPromise}
   */
  then(onFulfilled, onRejected) {
    const resolveFn = onFulfilled ?? identity;   // was: W = Q ?? ysw
    const rejectFn = onRejected ?? rethrow;      // was: m = c ?? iU7

    return new IdbPromise(new IdbExecutor((resolve, reject) => {
      if (this.state.status === 'PENDING') {
        this.W.push(() => handleResolve(this, this, resolveFn, resolve, reject));
        this.O.push(() => handleReject(this, this, rejectFn, resolve, reject));
      } else if (this.state.status === 'FULFILLED') {
        handleResolve(this, this, resolveFn, resolve, reject);
      } else if (this.state.status === 'REJECTED') {
        handleReject(this, this, rejectFn, resolve, reject);
      }
    }));
  }

  /**
   * Attaches a rejection handler (sugar for `.then(undefined, handler)`).
   *
   * @param {Function} handler [was: Q]
   * @returns {IdbPromise}
   */
  catch(handler) {
    return this.then(undefined, handler); // was: this.then(void 0, Q)
  }
}

// ============================================================================
// IDB Request Helpers  (lines 12386-12434)
// ============================================================================

/**
 * Attaches success/error listeners to an IDB request and calls
 * resolve/reject on the appropriate event.
 *
 * [was: ZU0]  (line 12386)
 * @param {IDBRequest} request [was: Q]
 * @param {Function}   resolve [was: c]
 * @param {Function}   reject  [was: W]
 */
function attachRequestListeners(request, resolve, reject) { // was: ZU0
  const cleanup = () => { // was: m
    try {
      request.removeEventListener('success', onSuccess);
      request.removeEventListener('error', onError);
    } catch {}
  };
  const onSuccess = () => { // was: K
    resolve(request.result);
    cleanup();
  };
  const onError = () => { // was: T
    reject(request.error);
    cleanup();
  };
  request.addEventListener('success', onSuccess);
  request.addEventListener('error', onError);
}

/**
 * Wraps an IDB request in a native `Promise` that resolves with
 * the request result.
 *
 * [was: EHK]  (line 12406)
 * @param {IDBRequest} request [was: Q]
 * @returns {Promise}
 */
export function wrapIdbRequestNative(request) { // was: EHK
  return new Promise((resolve, reject) => {
    attachRequestListeners(request, resolve, reject);
  });
}

/**
 * Wraps an IDB request in an `IdbPromise` (synchronous micro-promise)
 * to prevent IDB transactions from expiring across microtask boundaries.
 *
 * [was: hN]  (line 12413)
 * @param {IDBRequest} request [was: Q]
 * @returns {IdbPromise}
 */
export function wrapIdbRequest(request) { // was: hN
  return new IdbPromise(new IdbExecutor((resolve, reject) => {
    attachRequestListeners(request, resolve, reject);
  }));
}

/**
 * Iterates an IDB cursor by repeatedly calling `callback` until it
 * returns `null` (indicating no more items).
 *
 * [was: zE]  (line 12420)
 * @param {IdbCursorResult|null} cursor   [was: Q]
 * @param {Function}             callback [was: c]
 * @returns {IdbPromise}
 */
export function iterateCursor(cursor, callback) { // was: zE
  return new IdbPromise(new IdbExecutor((resolve, reject) => {
    const step = () => { // was: K
      const result = cursor ? callback(cursor) : null; // was: T
      result
        ? result.then((next) => { cursor = next; step(); }, reject) // was: r
        : resolve();
    };
    step();
  }));
}

// ============================================================================
// IDB Cursor Wrappers  (lines 67438-67653)
// ============================================================================

/**
 * Wraps an IDB key-cursor result (from `openKeyCursor`).
 *
 * [was: s6x]  (line 67438)
 */
export class IdbKeyCursorResult { // was: s6x
  /**
   * @param {IDBRequest} request [was: Q]
   * @param {IDBCursor}  cursor  [was: c]
   */
  constructor(request, cursor) {
    this.request = request;
    this.cursor = cursor;
  }
}

/**
 * Wraps a value-cursor result (from `openCursor`).
 *
 * [was: lc0]  (line 67638)
 */
export class IdbValueCursorResult { // was: lc0
  /**
   * @param {IDBRequest} request [was: Q]
   * @param {IDBCursor}  cursor  [was: c]
   */
  constructor(request, cursor) {
    this.request = request;
    this.cursor = cursor;
  }

  /** Deletes the record at the current cursor position. */
  delete() {
    return wrapIdbRequest(this.cursor.delete()).then(() => {}); // was: hN(this.cursor.delete()).then(...)
  }

  /** Returns the value at the current cursor position. */
  getValue() {
    return this.cursor.value;
  }

  /**
   * Updates the record at the current cursor position.
   * @param {*} value [was: Q]
   * @returns {IdbPromise}
   */
  update(value) {
    return wrapIdbRequest(this.cursor.update(value)); // was: hN(this.cursor.update(Q))
  }
}

// ============================================================================
// IDB Cursor Continuation Helpers  (lines 12574-12713)
// ============================================================================

/**
 * Wraps a cursor request's success into a key-cursor result, or
 * returns `null` if the cursor is exhausted.
 *
 * [was: dyX]  (line 12574)
 * @param {IDBRequest} request [was: Q]
 * @returns {IdbPromise<IdbKeyCursorResult|null>}
 */
function wrapKeyCursorRequest(request) { // was: dyX
  return wrapIdbRequest(request).then((cursor) => cursor ? new IdbKeyCursorResult(request, cursor) : null);
}

/**
 * Advances a key-cursor to the next entry.
 *
 * [was: g.L43]  (line 12578)
 * @param {IdbKeyCursorResult} cursorResult [was: Q]
 * @returns {IdbPromise<IdbKeyCursorResult|null>}
 */
export function advanceKeyCursor(cursorResult) { // was: g.L43
  cursorResult.cursor.continue(undefined); // was: void 0
  return wrapKeyCursorRequest(cursorResult.request);
}

/**
 * Wraps a value-cursor request into an `IdbValueCursorResult`.
 *
 * [was: Ys]  (line 12752)
 * @param {IDBRequest} request [was: Q]
 * @returns {IdbPromise<IdbValueCursorResult|null>}
 */
function wrapValueCursorRequest(request) { // was: Ys
  return wrapIdbRequest(request).then((cursor) => cursor ? new IdbValueCursorResult(request, cursor) : null);
}

/**
 * Advances a value-cursor to the next entry.
 *
 * [was: g.Qb]  (line 12756)
 * @param {IdbValueCursorResult} cursorResult [was: Q]
 * @returns {IdbPromise<IdbValueCursorResult|null>}
 */
export function advanceValueCursor(cursorResult) { // was: g.Qb
  cursorResult.cursor.continue(undefined); // was: void 0
  return wrapValueCursorRequest(cursorResult.request);
}

/**
 * Returns whether immediate-commit mode is enabled.
 *
 * [was: Cg]  (line 12583)
 * @returns {boolean}
 */
function shouldImmediateCommit() { // was: Cg
  return getExperimentBoolean('idb_immediate_commit'); // was: g.P("idb_immediate_commit")
}

// ============================================================================
// IDB Object-Store Wrapper  (lines 67512-67556)
// ============================================================================

/**
 * Wraps an `IDBObjectStore` with promise-returning methods.
 *
 * [was: gH7]  (line 67512)
 */
export class IdbObjectStoreWrapper { // was: gH7
  /** @param {IDBObjectStore} store [was: Q] */
  constructor(store) {
    this.W = store; // was: this.W = Q
  }

  /** @param {*} value [was: Q] @param {*} [key] [was: c] */
  add(value, key) {
    return wrapIdbRequest(this.W.add(value, key)); // was: hN(this.W.add(Q, c))
  }

  /** @returns {boolean} */
  autoIncrement() {
    return this.W.autoIncrement;
  }

  /** @returns {IdbPromise<void>} */
  clear() {
    return wrapIdbRequest(this.W.clear()).then(() => {}); // was: hN(this.W.clear()).then(...)
  }

  /** @param {*} [query] [was: Q] @returns {IdbPromise<number>} */
  count(query) {
    return wrapIdbRequest(this.W.count(query)); // was: hN(this.W.count(Q))
  }

  /**
   * Deletes a record by key, or by key range.
   * IDBKeyRange deletions use a cursor-based fallback.
   * @param {*} key [was: Q]
   * @returns {IdbPromise}
   */
  delete(key) {
    return key instanceof IDBKeyRange
      ? deleteByCursor(this, key) // was: fc7(this, Q)
      : wrapIdbRequest(this.W.delete(key)); // was: hN(this.W.delete(Q))
  }

  /** @param {*} key [was: Q] @returns {IdbPromise} */
  get(key) {
    return wrapIdbRequest(this.W.get(key)); // was: hN(this.W.get(Q))
  }

  /**
   * @param {*} [query] [was: Q]
   * @param {number} [count] [was: c]
   * @returns {IdbPromise<Array>}
   */
  getAll(query, count) {
    return 'getAll' in IDBObjectStore.prototype
      ? wrapIdbRequest(this.W.getAll(query, count)) // was: hN(this.W.getAll(Q, c))
      : getAllViaCursor(this, query, count); // was: vH7(this, Q, c)
  }

  /**
   * Opens a named index on this store.
   * @param {string} indexName [was: Q]
   * @returns {IdbIndexWrapper}
   */
  index(indexName) {
    try {
      return new IdbIndexWrapper(this.W.index(indexName)); // was: new Vx7(this.W.index(Q))
    } catch (err) {
      if (err instanceof Error && err.name === 'NotFoundError') {
        throw new MissingIndexError(indexName, this.W.name); // was: new aC(Q, this.W.name)
      }
      throw err;
    }
  }

  /** @returns {string} */
  getName() {
    return this.W.name;
  }

  /** @returns {string|string[]} */
  keyPath() {
    return this.W.keyPath;
  }

  /** @param {*} value [was: Q] @param {*} [key] [was: c] @returns {IdbPromise} */
  put(value, key) {
    return wrapIdbRequest(this.W.put(value, key)); // was: hN(this.W.put(Q, c))
  }
}

// ============================================================================
// IDB Index Wrapper  (lines 67613-67637)
// ============================================================================

/**
 * Wraps an `IDBIndex` with promise-returning methods.
 *
 * [was: Vx7]  (line 67613)
 */
export class IdbIndexWrapper { // was: Vx7
  /** @param {IDBIndex} index [was: Q] */
  constructor(index) {
    this.W = index; // was: this.W = Q
  }

  /** @param {*} [query] [was: Q] @returns {IdbPromise<number>} */
  count(query) {
    return wrapIdbRequest(this.W.count(query)); // was: hN(this.W.count(Q))
  }

  /**
   * Deletes all records matching a query via cursor iteration.
   * @param {*} query [was: Q]
   * @returns {IdbPromise<void>}
   */
  delete(query) {
    return openIndexCursor(this, { query }, (cursor) => // was: g.cF(this, {query: Q}, c => ...)
      cursor.delete().then(() => advanceValueCursor(cursor)) // was: c.delete().then(() => g.Qb(c))
    );
  }

  /** @param {*} key [was: Q] @returns {IdbPromise} */
  get(key) {
    return wrapIdbRequest(this.W.get(key)); // was: hN(this.W.get(Q))
  }

  /**
   * @param {*} [query] [was: Q]
   * @param {number} [count] [was: c]
   * @returns {IdbPromise<Array>}
   */
  getAll(query, count) {
    return 'getAll' in IDBIndex.prototype
      ? wrapIdbRequest(this.W.getAll(query, count)) // was: hN(this.W.getAll(Q, c))
      : getAllFromIndexViaCursor(this, query, count); // was: PFK(this, Q, c)
  }

  /** @returns {string|string[]} */
  keyPath() {
    return this.W.keyPath;
  }

  /** @returns {boolean} */
  unique() {
    return this.W.unique;
  }
}

// ============================================================================
// IDB Transaction Wrapper  (lines 67557-67612)
// ============================================================================

/**
 * Wraps an `IDBTransaction` with a completion promise (`done`),
 * object-store caching, and abort/commit support.
 *
 * [was: wwm]  (line 67557)
 */
export class IdbTransactionWrapper { // was: wwm
  /** @param {IDBTransaction} transaction [was: Q] */
  constructor(transaction) {
    this.W = transaction; // was: this.W = Q
    this.O = new Map(); // cached object-store wrappers
    this.aborted = false; // was: !1

    /** Promise that settles when the transaction completes or aborts. */
    this.done = new Promise((resolve, reject) => { // was: (c, W)
      this.W.addEventListener('complete', () => resolve());
      this.W.addEventListener('error', (event) => { // was: m
        event.currentTarget === event.target && reject(this.W.error);
      });
      this.W.addEventListener('abort', () => {
        const error = this.W.error; // was: m
        if (error) {
          reject(error);
        } else if (!this.aborted) {
          // Unknown abort -- build diagnostic metadata
          const storeNames = this.W.objectStoreNames; // was: K
          const names = []; // was: T
          for (let i = 0; i < storeNames.length; i++) { // was: r
            const name = storeNames.item(i); // was: U
            if (name === null) throw Error('Invariant: item in DOMStringList is null');
            names.push(name);
          }
          const err = new IdbKnownError('UNKNOWN_ABORT', {
            objectStoreNames: names.join(),
            dbName: this.W.EventHandler.name,
            mode: this.W.mode,
          });
          reject(err);
        }
      });
    });
  }

  /** Aborts the transaction and throws an `EXPLICIT_ABORT` error. */
  abort() {
    this.W.abort();
    this.aborted = true; // was: !0
    throw new IdbKnownError('EXPLICIT_ABORT');
  }

  /** Commits the transaction if supported and not already aborted. */
  commit() {
    this.aborted || this.W.commit?.();
  }

  /**
   * Returns a cached `IdbObjectStoreWrapper` for the named store.
   * @param {string} name [was: Q]
   * @returns {IdbObjectStoreWrapper}
   */
  objectStore(name) {
    const raw = this.W.objectStore(name); // was: Q = this.W.objectStore(Q)
    let wrapper = this.O.get(raw); // was: c
    if (!wrapper) {
      wrapper = new IdbObjectStoreWrapper(raw); // was: c = new gH7(Q)
      this.O.set(raw, wrapper);
    }
    return wrapper;
  }
}

// ============================================================================
// IDB Transaction Execution  (lines 12587-12662, 12716-12732)
// ============================================================================

/**
 * Runs a callback inside an IDB transaction with automatic retry on
 * retryable errors. Logs transaction metrics on completion.
 *
 * [was: g.MD]  (line 12587)
 * @param {IdbConnection} connection  [was: Q]
 * @param {string[]}      storeNames  [was: c]
 * @param {string|Object} modeOrOpts  [was: W]
 * @param {Function}      callback    [was: m]
 * @returns {Promise}
 */
export async function runTransaction(connection, storeNames, modeOrOpts, callback) { // was: g.MD
  const options = { // was: K
    mode: 'readonly',
    g3: false,  // was: !1  -- whether to allow retries
    tag: 'IDB_TRANSACTION_TAG_UNKNOWN',
  };
  typeof modeOrOpts === 'string'
    ? (options.mode = modeOrOpts)
    : Object.assign(options, modeOrOpts);

  connection.transactionCount++;
  const maxAttempts = options.g3 ? 3 : 1; // was: W
  let attempts = 0; // was: T
  let finalError; // was: r

  while (!finalError) {
    attempts++;
    const startTime = Math.round(g.h()); // was: A

    try {
      const rawTx = connection.W.transaction(storeNames, options.mode); // was: U
      const shouldCommit = !!options.commit; // was: X
      const txWrapper = new IdbTransactionWrapper(rawTx); // was: e = new wwm(U)
      const result = await executeTransaction(txWrapper, callback, shouldCommit); // was: V = await bUd(e, I, X)
      const endTime = Math.round(g.h()); // was: B

      logTransactionResult(connection, startTime, endTime, attempts, undefined, storeNames.join(), options); // was: j6w(...)
      return result;
    } catch (err) { // was: e
      const now = Math.round(g.h()); // was: I (reused)
      const classified = classifyIdbError(err, connection.W.name, storeNames.join(), connection.W.version); // was: V = GE(...)

      if ((classified instanceof IdbKnownError && !classified.W) || attempts >= maxAttempts) {
        logTransactionResult(connection, startTime, now, attempts, classified, storeNames.join(), options); // was: j6w(...)
        finalError = classified;
      }
    }
  }
  return Promise.reject(finalError);
}

/**
 * Executes a callback inside a transaction wrapper and awaits both
 * the callback result and the transaction completion.
 *
 * [was: bUd]  (line 12716)
 * @param {IdbTransactionWrapper} txWrapper      [was: Q]
 * @param {Function}              callback       [was: c]
 * @param {boolean}               shouldCommit   [was: W]
 * @returns {Promise}
 */
function executeTransaction(txWrapper, callback, shouldCommit) { // was: bUd
  const callbackPromise = new Promise((resolve, reject) => { // was: m
    try {
      const result = callback(txWrapper); // was: r = c(Q)
      shouldCommit && txWrapper.commit();
      result.then((val) => resolve(val)).catch(reject); // was: r.then(U => K(U)).catch(T)
    } catch (err) {
      reject(err);
      txWrapper.abort();
    }
  });
  return Promise.all([callbackPromise, txWrapper.done]).then(([result]) => result); // was: ([K]) => K
}

/**
 * Logs the outcome of a transaction (success or failure) for diagnostics.
 *
 * [was: j6w]  (line 12632)
 * @param {IdbConnection} connection [was: Q]
 * @param {number}        startTime  [was: c]
 * @param {number}        endTime    [was: W]
 * @param {number}        tryCount   [was: m]
 * @param {Error}         [error]    [was: K]
 * @param {string}        storeNames [was: T]
 * @param {Object}        options    [was: r]
 */
function logTransactionResult(connection, startTime, endTime, tryCount, error, storeNames, options) { // was: j6w
  const duration = endTime - startTime; // was: c = W - c

  if (error) {
    // Quota-exceeded logging
    if (error instanceof IdbKnownError && (error.type === 'QUOTA_EXCEEDED' || error.type === 'QUOTA_MAYBE_EXCEEDED')) {
      logIdbEvent('QUOTA_EXCEEDED', {
        dbName: extractPublicDbName(connection.W.name),
        objectStoreNames: storeNames,
        transactionCount: connection.transactionCount,
        transactionMode: options.mode,
      });
    }

    // Unexpected abort logging
    if (error instanceof IdbKnownError && error.type === 'UNKNOWN_ABORT') {
      let dbDuration = endTime - connection.A; // was: W -= Q.A
      if (dbDuration < 0 && dbDuration >= 2147483648) dbDuration = 0;
      logIdbEvent('TRANSACTION_UNEXPECTEDLY_ABORTED', {
        objectStoreNames: storeNames,
        transactionDuration: duration,
        transactionCount: connection.transactionCount,
        dbDuration,
      });
      connection.O = true; // was: !0
    }

    logTransactionEnded(connection, false, tryCount, storeNames, duration, options.tag); // was: OUK(Q, !1, ...)
    reportIdbError(error); // was: bK(K)
  } else {
    logTransactionEnded(connection, true, tryCount, storeNames, duration, options.tag); // was: OUK(Q, !0, ...)
  }
}

/**
 * Logs a `TRANSACTION_ENDED` event.
 *
 * [was: OUK]  (line 12653)
 */
function logTransactionEnded(connection, isSuccessful, tryCount, storeNames, duration, tag = 'IDB_TRANSACTION_TAG_UNKNOWN') { // was: OUK
  logIdbEvent('TRANSACTION_ENDED', {
    objectStoreNames: storeNames,
    connectionHasUnknownAbortedTransaction: connection.O,
    duration,
    isSuccessful,
    tryCount,
    tag,
  });
}

// ============================================================================
// IDB Store / Schema Helpers  (lines 12623-12680)
// ============================================================================

/**
 * Creates an object store on the database during an upgrade transaction.
 *
 * [was: JN]  (line 12623)
 * @param {IdbConnection}      connection [was: Q]
 * @param {string}             storeName  [was: c]
 * @param {IDBObjectStoreParameters} [options] [was: W]
 * @returns {IdbObjectStoreWrapper}
 */
export function createObjectStore(connection, storeName, options) { // was: JN
  const raw = connection.W.createObjectStore(storeName, options); // was: Q = Q.W.createObjectStore(c, W)
  return new IdbObjectStoreWrapper(raw); // was: new gH7(Q)
}

/**
 * Deletes an object store if it exists.
 *
 * [was: RC]  (line 12628)
 * @param {IdbConnection} connection [was: Q]
 * @param {string}        storeName  [was: c]
 */
export function deleteObjectStoreIfExists(connection, storeName) { // was: RC
  connection.W.objectStoreNames.contains(storeName) && connection.W.deleteObjectStore(storeName);
}

/**
 * Creates a non-unique index on an object-store wrapper.
 *
 * [was: ks]  (line 12664)
 * @param {IdbObjectStoreWrapper} storeWrapper [was: Q]
 * @param {string}                indexName    [was: c]
 * @param {string}                keyPath      [was: W]
 */
export function createIndex(storeWrapper, indexName, keyPath) { // was: ks
  storeWrapper.W.createIndex(indexName, keyPath, { unique: false }); // was: { unique: !1 }
}

// ============================================================================
// Cursor-based Query Helpers  (lines 12670-12750)
// ============================================================================

/**
 * Opens a cursor on an object store and iterates with `callback`.
 *
 * [was: g.pg]  (line 12670)
 * @param {IdbObjectStoreWrapper} store    [was: Q]
 * @param {Object}                options  [was: c] -- { query, direction }
 * @param {Function}              callback [was: W]
 * @returns {IdbPromise}
 */
export function openStoreCursor(store, options, callback) { // was: g.pg
  const request = store.W.openCursor(options.query, options.direction); // was: Q.W.openCursor(c.query, c.direction)
  return wrapValueCursorRequest(request).then((cursor) => iterateCursor(cursor, callback)); // was: Ys(Q).then(m => zE(m, W))
}

/**
 * Deletes all records in a store matching a cursor query.
 *
 * [was: fc7]  (line 12675)
 * @param {IdbObjectStoreWrapper} store [was: Q]
 * @param {*}                     query [was: c]
 * @returns {IdbPromise<void>}
 */
function deleteByCursor(store, query) { // was: fc7
  return openStoreCursor(store, { query }, (cursor) => // was: g.pg(Q, {query: c}, W => ...)
    cursor.delete().then(() => advanceValueCursor(cursor)) // was: W.delete().then(() => g.Qb(W))
  ).then(() => {});
}

/**
 * Collects all values from a store cursor into an array, with an
 * optional maximum count.
 *
 * [was: vH7]  (line 12682)
 * @param {IdbObjectStoreWrapper} store  [was: Q]
 * @param {*}                     query  [was: c]
 * @param {number}                [max]  [was: W]
 * @returns {IdbPromise<Array>}
 */
function getAllViaCursor(store, query, max) { // was: vH7
  const results = []; // was: m
  return openStoreCursor(store, { query }, (cursor) => { // was: g.pg(Q, {query: c}, K => {...})
    if (!(max !== undefined && results.length >= max)) {
      results.push(cursor.getValue());
      return advanceValueCursor(cursor); // was: g.Qb(K)
    }
  }).then(() => results);
}

/**
 * Collects all primary keys from a store using `openKeyCursor`.
 *
 * [was: Gsd]  (line 12694)
 * @param {IdbObjectStoreWrapper} store [was: Q]
 * @returns {IdbPromise<Array>}
 */
function getAllKeysViaCursor(store) { // was: Gsd
  const keys = []; // was: c
  return openStoreKeyCursor(store, { query: undefined }, (cursorResult) => { // was: g.acW(Q, {...}, W => {...})
    keys.push(cursorResult.cursor.primaryKey);
    return advanceKeyCursor(cursorResult); // was: g.L43(W)
  }).then(() => keys);
}

/**
 * Returns all keys from a store, preferring the native `getAllKeys`
 * when available, falling back to cursor iteration.
 *
 * [was: $ym]  (line 12705)
 * @param {IdbObjectStoreWrapper} store [was: Q]
 * @returns {IdbPromise<Array>|Promise<Array>}
 */
export function getAllKeys(store) { // was: $ym
  return 'getAllKeys' in IDBObjectStore.prototype
    ? wrapIdbRequest(store.W.getAllKeys(undefined, undefined)) // was: hN(Q.W.getAllKeys(void 0, void 0))
    : getAllKeysViaCursor(store); // was: Gsd(Q)
}

/**
 * Opens a key cursor on an object store.
 *
 * [was: g.acW]  (line 12709)
 * @param {IdbObjectStoreWrapper} store    [was: Q]
 * @param {Object}                options  [was: c]
 * @param {Function}              callback [was: W]
 * @returns {IdbPromise}
 */
export function openStoreKeyCursor(store, options, callback) { // was: g.acW
  const query = options.query; // was: m
  const direction = options.direction; // was: c (reused)
  const request = 'openKeyCursor' in IDBObjectStore.prototype
    ? store.W.openKeyCursor(query, direction)
    : store.W.openCursor(query, direction);
  return wrapKeyCursorRequest(request).then((cursor) => iterateCursor(cursor, callback));
}

/**
 * Opens a cursor on an index and iterates with `callback`.
 *
 * [was: g.cF]  (line 12734)
 * @param {IdbIndexWrapper} index    [was: Q]
 * @param {Object}          options  [was: c] -- { query, direction }
 * @param {Function}        callback [was: W]
 * @returns {IdbPromise}
 */
export function openIndexCursor(index, options, callback) { // was: g.cF
  const { query = null, direction = 'next' } = options; // was: {query: m=null, direction: K="next"} = c
  const request = index.W.openCursor(query, direction);
  return wrapValueCursorRequest(request).then((cursor) => iterateCursor(cursor, callback));
}

/**
 * Collects all values from an index cursor into an array.
 *
 * [was: PFK]  (line 12740)
 * @param {IdbIndexWrapper} index [was: Q]
 * @param {*}               query [was: c]
 * @param {number}          [max] [was: W]
 * @returns {IdbPromise<Array>}
 */
function getAllFromIndexViaCursor(index, query, max) { // was: PFK
  const results = []; // was: m
  return openIndexCursor(index, { query }, (cursor) => { // was: g.cF(Q, {query: c}, K => {...})
    if (!(max !== undefined && results.length >= max)) {
      results.push(cursor.getValue());
      return advanceValueCursor(cursor); // was: g.Qb(K)
    }
  }).then(() => results);
}

// ============================================================================
// IDB Connection (Database) Class  (lines 67445-67511)
// ============================================================================

/**
 * High-level wrapper around an open `IDBDatabase`, providing
 * convenience methods for CRUD operations that automatically create
 * and manage transactions.
 *
 * [was: uv_]  (line 67445)
 */
export class IdbConnection { // was: uv_
  /**
   * @param {IDBDatabase} db      [was: Q]
   * @param {Object}      options [was: c]
   */
  constructor(EventHandler, options) {
    this.W = EventHandler; // was: this.W = Q
    this.options = options;
    this.transactionCount = 0;
    this.A = Math.round(g.h()); // creation timestamp
    this.O = false; // was: !1  -- has had an unknown-aborted transaction
  }

  /** @param {string} storeName [was: Q] @param {*} value [was: c] @param {*} [key] [was: W] */
  add(storeName, value, key) {
    return runTransaction(this, [storeName], {
      mode: 'readwrite',
      g3: true, // was: !0
      commit: shouldImmediateCommit(),
    }, (shouldUseDesktopControls) => shouldUseDesktopControls.objectStore(storeName).add(value, key)); // was: m => m.objectStore(Q).add(c, W)
  }

  /** @param {string} storeName [was: Q] */
  clear(storeName) {
    return runTransaction(this, [storeName], {
      mode: 'readwrite',
      g3: true, // was: !0
    }, (shouldUseDesktopControls) => shouldUseDesktopControls.objectStore(storeName).clear()); // was: c => c.objectStore(Q).clear()
  }

  /** Closes the underlying database connection. */
  close() {
    this.W.close();
    this.options?.closed && this.options.closed();
  }

  /** @param {string} storeName [was: Q] @param {*} [query] [was: c] */
  count(storeName, query) {
    return runTransaction(this, [storeName], {
      mode: 'readonly',
      g3: true, // was: !0
      commit: shouldImmediateCommit(),
    }, (shouldUseDesktopControls) => shouldUseDesktopControls.objectStore(storeName).count(query)); // was: W => W.objectStore(Q).count(c)
  }

  /** @param {string} storeName [was: Q] @param {*} key [was: c] */
  delete(storeName, key) {
    return runTransaction(this, [storeName], {
      mode: 'readwrite',
      g3: true, // was: !0
      commit: shouldImmediateCommit() && !(key instanceof IDBKeyRange),
    }, (shouldUseDesktopControls) => shouldUseDesktopControls.objectStore(storeName).delete(key)); // was: W => W.objectStore(Q).delete(c)
  }

  /** @param {string} storeName [was: Q] @param {*} key [was: c] */
  get(storeName, key) {
    return runTransaction(this, [storeName], {
      mode: 'readonly',
      g3: true, // was: !0
      commit: shouldImmediateCommit(),
    }, (shouldUseDesktopControls) => shouldUseDesktopControls.objectStore(storeName).get(key)); // was: W => W.objectStore(Q).get(c)
  }

  /** @param {string} storeName [was: Q] @param {*} [query] [was: c] @param {number} [count] [was: W] */
  getAll(storeName, query, count) {
    return runTransaction(this, [storeName], {
      mode: 'readonly',
      g3: true, // was: !0
    }, (shouldUseDesktopControls) => shouldUseDesktopControls.objectStore(storeName).getAll(query, count)); // was: m => m.objectStore(Q).getAll(c, W)
  }

  /** @param {string} storeName [was: Q] @param {*} value [was: c] @param {*} [key] [was: W] */
  put(storeName, value, key) {
    return runTransaction(this, [storeName], {
      mode: 'readwrite',
      g3: true, // was: !0
      commit: shouldImmediateCommit(),
    }, (shouldUseDesktopControls) => shouldUseDesktopControls.objectStore(storeName).put(value, key)); // was: m => m.objectStore(Q).put(c, W)
  }

  /** @returns {string[]} */
  objectStoreNames() {
    return Array.from(this.W.objectStoreNames);
  }

  /** @returns {string} */
  getName() {
    return this.W.name;
  }
}

// ============================================================================
// IDB Open / Delete / Metadata  (lines 12761-13054)
// ============================================================================

/**
 * Opens an IndexedDB database, handling `upgradeneeded`, `blocked`,
 * `versionchange`, and unexpected `close` events.
 *
 * [was: hBm]  (line 12761)
 * @param {string}  name      [was: Q]
 * @param {number}  [version] [was: c]
 * @param {Object}  callbacks [was: W]
 * @returns {Promise<IdbConnection>}
 */
function openIdbDatabase(name, version, callbacks) { // was: hBm
  return new Promise((resolve, reject) => { // was: (m, K)
    let request; // was: T
    request = version !== undefined
      ? self.indexedDB.open(name, version)
      : self.indexedDB.open(name);

    const blockedCb = callbacks.blocked; // was: r
    const blockingCb = callbacks.blocking; // was: U
    const unexpectedCloseCb = callbacks.hZ; // was: I
    const upgradeCb = callbacks.upgrade; // was: X
    const closedCb = callbacks.closed; // was: A

    let connection; // was: e
    const getConnection = () => { // was: V
      if (!connection) {
        connection = new IdbConnection(request.result, { closed: closedCb });
      }
      return connection;
    };

    request.addEventListener('upgradeneeded', (event) => { // was: B
      try {
        if (event.newVersion === null) {
          throw Error('Invariant: newVersion on IDbVersionChangeEvent is null');
        }
        if (request.transaction === null) {
          throw Error('Invariant: transaction on IDbOpenDbRequest is null');
        }
        if (event.dataLoss && event.dataLoss !== 'none') {
          logIdbEvent('IDB_DATA_CORRUPTED', {
            reason: event.dataLossMessage || 'unknown reason',
            dbName: extractPublicDbName(name),
          });
        }
        const conn = getConnection(); // was: n
        const txWrapper = new IdbTransactionWrapper(request.transaction); // was: S
        upgradeCb && upgradeCb(conn, (v) => event.oldVersion < v && event.newVersion >= v, txWrapper); // was: d
        txWrapper.done.catch((err) => reject(err)); // was: d
      } catch (err) { // was: n
        reject(err);
      }
    });

    request.addEventListener('success', () => {
      const EventHandler = request.result; // was: B
      blockingCb && EventHandler.addEventListener('versionchange', () => blockingCb(getConnection()));
      EventHandler.addEventListener('close', () => {
        logIdbEvent('IDB_UNEXPECTEDLY_CLOSED', {
          dbName: extractPublicDbName(name),
          dbVersion: EventHandler.version,
        });
        unexpectedCloseCb && unexpectedCloseCb();
      });
      resolve(getConnection());
    });

    request.addEventListener('error', () => reject(request.error));

    blockedCb && request.addEventListener('blocked', () => blockedCb());
  });
}

/**
 * Convenience wrapper for `openIdbDatabase`.
 *
 * [was: zB7]  (line 12829)
 * @param {string}  name      [was: Q]
 * @param {number}  [version] [was: c]
 * @param {Object}  [callbacks] [was: W]
 * @returns {Promise<IdbConnection>}
 */
export function openDatabase(name, version, callbacks = {}) { // was: zB7
  return openIdbDatabase(name, version, callbacks);
}

/**
 * Deletes an IndexedDB database.
 *
 * [was: WF]  (line 12833)
 * @param {string} name         [was: Q]
 * @param {Object} [options={}] [was: c]
 */
export async function deleteDatabase(name, options = {}) { // was: WF
  try {
    const request = self.indexedDB.deleteDatabase(name); // was: W
    const blockedCb = options.blocked; // was: m
    blockedCb && request.addEventListener('blocked', () => blockedCb());
    await wrapIdbRequestNative(request); // was: EHK(W)
  } catch (err) { // was: W
    throw classifyIdbError(err, name, '', -1); // was: GE(W, Q, "", -1)
  }
}

/**
 * Creates an `INCOMPATIBLE_DB_VERSION` error for a database whose
 * version is newer than what this binary expects.
 *
 * [was: CF3]  (line 12847)
 * @param {DatabaseDefinition} dbDef   [was: Q]
 * @param {number}             [newVersion] [was: c]
 * @returns {IdbKnownError}
 */
function createIncompatibleVersionError(dbDef, newVersion) { // was: CF3
  return new IdbKnownError('INCOMPATIBLE_DB_VERSION', {
    dbName: dbDef.name,
    oldVersion: dbDef.options.version,
    newVersion,
  });
}

/**
 * Opens a database definition, requiring a valid IDB token.
 *
 * [was: g.m7]  (line 12855)
 * @param {DatabaseDefinition} dbDef [was: Q]
 * @param {*}                  token [was: c]
 * @returns {Promise<IdbConnection>}
 */
export function openWithToken(dbDef, token) { // was: g.m7
  if (!token) throw createIdbNotSupportedError('openWithToken', extractPublicDbName(dbDef.name)); // was: g.$s(...)
  return dbDef.open();
}

// ============================================================================
// IDB Metadata Registry  (lines 12861-12946)
// ============================================================================

/**
 * Registers (upserts) a database descriptor in the `YtIdbMeta.databases`
 * object store.
 *
 * [was: Myw]  (line 12861)
 * @param {Object} descriptor [was: Q] -- { actualName, publicName, userIdentifier }
 * @param {*}      token      [was: c]
 */
async function registerDbMetadata(descriptor, token) { // was: Myw
  return runTransaction(await openWithToken(META_DB_DEF, token), ['databases'], {
    g3: true, // was: !0
    mode: 'readwrite',
  }, (shouldUseDesktopControls) => { // was: W
    const store = shouldUseDesktopControls.objectStore('databases'); // was: m
    return store.get(descriptor.actualName).then((existing) => { // was: K
      if (
        existing
          ? descriptor.actualName !== existing.actualName ||
            descriptor.publicName !== existing.publicName ||
            descriptor.userIdentifier !== existing.userIdentifier
          : 1
      ) {
        return store.put(descriptor).then(() => {});
      }
    });
  });
}

/**
 * Removes a database descriptor from the metadata registry.
 *
 * [was: TU]  (line 12877)
 * @param {string} actualName [was: Q]
 * @param {*}      token      [was: c]
 */
async function unregisterDbMetadata(actualName, token) { // was: TU
  return actualName ? (await openWithToken(META_DB_DEF, token)).delete('databases', actualName) : undefined; // was: void 0
}

/**
 * Queries the metadata registry for entries matching a predicate.
 *
 * [was: Jsn]  (line 12881)
 * @param {Function} predicate [was: Q]
 * @param {*}        token     [was: c]
 * @returns {Promise<Array>}
 */
async function queryDbRegistry(predicate, token) { // was: Jsn
  const results = []; // was: W
  const conn = await openWithToken(META_DB_DEF, token); // was: c (reused)
  await runTransaction(conn, ['databases'], {
    g3: true, // was: !0
    mode: 'readonly',
  }, (shouldUseDesktopControls) => { // was: m
    results.length = 0;
    return openStoreCursor(shouldUseDesktopControls.objectStore('databases'), {}, (cursor) => { // was: g.pg(...)
      predicate(cursor.getValue()) && results.push(cursor.getValue());
      return advanceValueCursor(cursor); // was: g.Qb(K)
    });
  });
  return results;
}

/**
 * Finds all database entries with the given public name that have
 * a user identifier.
 *
 * [was: RB7]  (line 12899)
 * @param {string} publicName [was: Q]
 * @param {*}      token      [was: c]
 * @returns {Promise<Array>}
 */
function findUserDatabases(publicName, token) { // was: RB7
  return queryDbRegistry(
    (entry) => entry.publicName === publicName && entry.userIdentifier !== undefined, // was: void 0
    token,
  );
}

// ============================================================================
// IDB Availability Probing  (lines 12903-12959)
// ============================================================================

/**
 * Probes whether IndexedDB is available and functional by attempting
 * a write/delete cycle on a test database.
 *
 * [was: ksX]  (line 12903)
 * @returns {Promise<boolean>}
 */
async function canUseIdb() { // was: ksX
  if (getLastIdbResult()?.hasSucceededOnce) return true; // was: !0

  let unavailable; // was: Q
  if (!(unavailable = isIdbDisabled && isFlexible() && !isZoned() || g.rU)) { // was: ou && FF() && !Zw() || g.rU
    try {
      const self_ = self; // was: Q (reused)
      var hasIdb = !!(self_.indexedDB && self_.IDBIndex && self_.IDBKeyRange && self_.IDBObjectStore); // was: c
    } catch (_) {
      hasIdb = false; // was: !1
    }
    unavailable = !hasIdb;
  }

  if (unavailable || !('IDBTransaction' in self && 'objectStoreNames' in IDBTransaction.prototype)) {
    return false; // was: !1
  }

  try {
    await registerDbMetadata({
      actualName: 'yt-idb-test-do-not-use',
      publicName: 'yt-idb-test-do-not-use',
      userIdentifier: undefined, // was: void 0
    }, IDB_AUTH_TOKEN); // was: U3
    await unregisterDbMetadata('yt-idb-test-do-not-use', IDB_AUTH_TOKEN);
    return true; // was: !0
  } catch (_) {
    return false; // was: !1
  }
}

/**
 * Returns a cached promise for the IDB availability probe, running the
 * probe at most once per page load.
 *
 * [was: YVm]  (line 12931)
 * @returns {Promise<boolean>}
 */
function getIdbAvailability() { // was: YVm
  if (cachedIdbAvailability !== undefined) return cachedIdbAvailability; // was: Iu

  diagnosticInProgress = true; // was: dl = !0
  return (cachedIdbAvailability = canUseIdb().then((available) => { // was: Iu = ksX().then(...)
    diagnosticInProgress = false; // was: dl = !1

    const storage = getIdbExpiringStorage()?.O();
    if (storage) {
      const entry = {
        hasSucceededOnce: getLastIdbResult()?.hasSucceededOnce || available,
      };
      getIdbExpiringStorage()?.set('LAST_RESULT_ENTRY_KEY', entry, 2592000, true); // was: 2592E3, !0
    }
    return available;
  }));
}

/** @type {Promise<boolean>|undefined} Cached IDB availability result. [was: Iu] */
let cachedIdbAvailability; // was: var Iu

/**
 * Returns the current IDB token if already established.
 *
 * [was: XE]  (line 12948)
 * @returns {Object|undefined}
 */
function getStoredIdbToken() { // was: XE
  return getObjectByPath('ytglobal.idbToken_') || undefined; // was: void 0
}

/**
 * Resolves with an IDB token (establishing one via a probe if needed).
 *
 * [was: g.AD]  (line 12952)
 * @returns {Promise<Object|undefined>}
 */
export function getIdbToken() { // was: g.AD
  const existing = getStoredIdbToken(); // was: Q = XE()
  return existing
    ? Promise.resolve(existing)
    : getIdbAvailability().then((available) => { // was: YVm().then(c => {...})
        let token; // was: c (reused)
        if (available) {
          setGlobal('ytglobal.idbToken_', IDB_AUTH_TOKEN); // was: U3
          token = IDB_AUTH_TOKEN;
        } else {
          token = undefined; // was: void 0
        }
        return token;
      });
}

// ============================================================================
// User-scoped Database Helpers  (lines 12962-13054)
// ============================================================================

/**
 * Builds a user-scoped database descriptor with the current user's
 * identifier prepended to the name.
 *
 * [was: pwW]  (line 12962)
 * @param {string} publicName [was: Q]
 * @returns {{ actualName: string, publicName: string, userIdentifier: string }}
 */
function buildUserScopedDescriptor(publicName) { // was: pwW
  if (!isLoggedIn()) { // was: tN()
    const err = new IdbKnownError('AUTH_INVALID', { dbName: publicName });
    reportIdbError(err);
    throw err;
  }
  const userId = getDatasyncId(); // was: c
  return {
    actualName: `${publicName}:${userId}`,
    publicName,
    userIdentifier: userId,
  };
}

/**
 * Core implementation for opening a database -- obtains the IDB token,
 * registers metadata, and opens the database.
 *
 * [was: QPm]  (line 12977)
 * @param {string}  publicName [was: Q]
 * @param {number}  version    [was: c]
 * @param {boolean} shared     [was: W] -- if true, uses public name directly
 * @param {Object}  [callbacks] [was: m]
 * @returns {Promise<IdbConnection>}
 */
async function openDbImpl(publicName, version, shared, callbacks) { // was: QPm
  let stackTrace = Error().stack ?? ''; // was: K
  const token = await getIdbToken(); // was: T = await g.AD()

  if (!token) {
    const err = createIdbNotSupportedError('openDbImpl', publicName, version); // was: c (reused)
    getExperimentBoolean('ytidb_async_stack_killswitch') ||
      (err.stack = `${err.stack}\n${stackTrace.substring(stackTrace.indexOf('\n') + 1)}`);
    reportIdbError(err);
    throw err;
  }

  validateDbName(publicName); // was: gl(Q)

  const descriptor = shared // was: K (reused)
    ? { actualName: publicName, publicName, userIdentifier: undefined } // was: void 0
    : buildUserScopedDescriptor(publicName); // was: pwW(Q)

  try {
    await registerDbMetadata(descriptor, token); // was: Myw(K, T)
    return await openDatabase(descriptor.actualName, version, callbacks); // was: zB7(K.actualName, c, m)
  } catch (err) { // was: r
    try {
      await unregisterDbMetadata(descriptor.actualName, token); // was: TU(K.actualName, T)
    } catch {}
    throw err;
  }
}

/**
 * Opens a user-scoped database.
 *
 * [was: co3]  (line 13002)
 * @param {string} name       [was: Q]
 * @param {number} version    [was: c]
 * @param {Object} [callbacks] [was: W]
 * @returns {Promise<IdbConnection>}
 */
export function openUserDatabase(name, version, callbacks = {}) { // was: co3
  return openDbImpl(name, version, false, callbacks); // was: QPm(Q, c, !1, W)
}

/**
 * Opens a shared (non-user-scoped) database.
 *
 * [was: WKO]  (line 13006)
 * @param {string} name       [was: Q]
 * @param {number} version    [was: c]
 * @param {Object} [callbacks] [was: W]
 * @returns {Promise<IdbConnection>}
 */
export function openSharedDatabase(name, version, callbacks = {}) { // was: WKO
  return openDbImpl(name, version, true, callbacks); // was: QPm(Q, c, !0, W)
}

/**
 * Deletes a user-scoped database and its metadata entry.
 *
 * [was: m6O]  (line 13010)
 * @param {string} name       [was: Q]
 * @param {Object} [options]  [was: c]
 */
export async function deleteUserDatabase(name, options = {}) { // was: m6O
  const token = await getIdbToken(); // was: W = await g.AD()
  if (token) {
    validateDbName(name); // was: gl(Q)
    const descriptor = buildUserScopedDescriptor(name); // was: Q = pwW(Q)
    await deleteDatabase(descriptor.actualName, options); // was: WF(Q.actualName, c)
    await unregisterDbMetadata(descriptor.actualName, token); // was: TU(Q.actualName, W)
  }
}

/**
 * Deletes all databases in a list and their metadata entries.
 *
 * [was: KK7]  (line 13018)
 * @param {Object[]} descriptors [was: Q]
 * @param {Object}   options     [was: c]
 * @param {*}        token       [was: W]
 * @returns {Promise<void>}
 */
function deleteAllDatabases(descriptors, options, token) { // was: KK7
  const tasks = descriptors.map(async (desc) => { // was: m
    await deleteDatabase(desc.actualName, options);
    await unregisterDbMetadata(desc.actualName, token);
  });
  return Promise.all(tasks).then(() => {});
}

/**
 * Deletes all user-scoped databases with the given public name.
 *
 * [was: TyO]  (line 13028)
 * @param {string} publicName [was: Q]
 */
export async function deleteAllUserDatabases(publicName) { // was: TyO
  const options = {}; // was: c
  const token = await getIdbToken(); // was: W = await g.AD()
  if (token) {
    validateDbName(publicName); // was: gl(Q)
    const entries = await findUserDatabases(publicName, token); // was: Q = await RB7(Q, W)
    await deleteAllDatabases(entries, options, token); // was: KK7(Q, c, W)
  }
}

/**
 * Deletes a shared database and its metadata entry.
 *
 * [was: oCx]  (line 13036)
 * @param {string} name       [was: Q]
 * @param {Object} [options]  [was: c]
 */
export async function deleteSharedDatabase(name, options = {}) { // was: oCx
  const token = await getIdbToken(); // was: W = await g.AD()
  if (token) {
    validateDbName(name); // was: gl(Q)
    await deleteDatabase(name, options); // was: WF(Q, c)
    await unregisterDbMetadata(name, token); // was: TU(Q, W)
  }
}

// ============================================================================
// Database Definition Factory  (lines 13043-13057, 67655-67801)
// ============================================================================

/**
 * Creates a lazy singleton factory for a `DatabaseDefinition` (ro0).
 *
 * [was: U6W]  (line 13043)
 * @param {string} name    [was: Q]
 * @param {Object} options [was: c]
 * @returns {Function}
 */
function createDbFactory(name, options) { // was: U6W
  let instance; // was: W
  return () => {
    if (!instance) instance = new UserScopedDatabaseDefinition(name, options); // was: W = new ro0(Q, c)
    return instance;
  };
}

/**
 * Creates a database definition factory (alias for `createDbFactory`).
 *
 * [was: el]  (line 13051)
 * @param {string} name    [was: Q]
 * @param {Object} options [was: c]
 * @returns {Function}
 */
export function createDatabaseDefinition(name, options) { // was: el
  return createDbFactory(name, options);
}

/**
 * Opens the database described by a factory function.
 *
 * [was: Vb]  (line 13055)
 * @param {Function} factoryFn [was: IZ7()]
 * @param {*}        token     [was: Q]
 * @returns {Promise<IdbConnection>}
 */
export function openFromFactory(factoryFn, token) { // was: Vb
  return openWithToken(factoryFn(), token); // was: g.m7(IZ7(), Q)
}

// ============================================================================
// Database Definition Base Class  (lines 67655-67742)
// ============================================================================

/**
 * Base class for declaring an IndexedDB database schema with
 * auto-open, version-error recovery, and missing-store detection.
 *
 * [was: Bp7]  (line 67655)
 */
export class DatabaseDefinition { // was: Bp7
  /**
   * @param {string} name    [was: Q]
   * @param {Object} options [was: c]
   */
  constructor(name, options) {
    this.name = name;
    this.options = options;
    this.A = true;    // was: !0  -- whether compatible
    this.K = 0;       // reopen retry count
    this.j = 0;       // remake retry count
  }

  /**
   * Opens the database (overridden by subclasses for user-scoping).
   * @param {string}  name      [was: Q]
   * @param {number}  version   [was: c]
   * @param {Object}  callbacks [was: W]
   * @returns {Promise<IdbConnection>}
   */
  O(name, version, callbacks = {}) { // was: O(Q, c, W={})
    return openDatabase(name, version, callbacks); // was: zB7(Q, c, W)
  }

  /** @param {Object} [options] [was: Q] */
  delete(options = {}) {
    return deleteDatabase(this.name, options); // was: WF(this.name, Q)
  }

  /**
   * Opens (or returns a cached promise for) this database.
   * Handles VersionError by falling back to the on-disk version,
   * and retries with re-creation if object stores are missing.
   * @returns {Promise<IdbConnection>}
   */
  open() {
    if (!this.A) throw createIncompatibleVersionError(this); // was: CF3(this)
    if (this.W) return this.W;

    let openPromise; // was: Q
    const onClosed = () => {
      this.W === openPromise && (this.W = undefined); // was: void 0
    };

    const callbacks = {
      blocking: (conn) => conn.close(), // was: K => K.close()
      closed: onClosed,
      hZ: onClosed,
      upgrade: this.options.upgrade,
    };

    const doOpen = async () => { // was: m
      let stackTrace = Error().stack ?? ''; // was: K (reused)
      try {
        const conn = await this.O(this.name, this.options.version, callbacks); // was: U
        const opts = this.options; // was: r

        // Check for missing object stores
        const missing = []; // was: I
        for (const storeName of Object.keys(opts.ML)) { // was: X
          const { d0: minVersion, fre: maxVersion = Number.MAX_VALUE } = opts.ML[storeName]; // was: A, e
          if (!(conn.W.version >= minVersion) || conn.W.version >= maxVersion) continue;
          if (!conn.W.objectStoreNames.contains(storeName)) missing.push(storeName);
        }

        if (missing.length !== 0) {
          const expected = Object.keys(this.options.ML); // was: X (reused)
          const found = conn.objectStoreNames(); // was: A (reused)

          if (this.K < getExperimentNumber('ytidb_reopen_db_retries', 0)) {
            this.K++;
            conn.close();
            reportIdbError(new IdbKnownError('DB_REOPENED_BY_MISSING_OBJECT_STORES', {
              dbName: this.name,
              expectedObjectStores: expected,
              foundObjectStores: found,
            }));
            return doOpen();
          }

          if (this.j < getExperimentNumber('ytidb_remake_db_retries', 1)) {
            this.j++;
            await this.delete();
            reportIdbError(new IdbKnownError('DB_DELETED_BY_MISSING_OBJECT_STORES', {
              dbName: this.name,
              expectedObjectStores: expected,
              foundObjectStores: found,
            }));
            return doOpen();
          }

          throw new MissingObjectStoresError(found, expected); // was: new eVd(A, X)
        }

        return conn;
      } catch (err) { // was: U
        // Handle VersionError -- open without specifying version
        if (
          err instanceof DOMException ? err.name === 'VersionError' :
          'DOMError' in self && err instanceof DOMError ? err.name === 'VersionError' :
          err instanceof Object && 'message' in err &&
            err.message === 'An attempt was made to open a database using a lower version than the existing version.'
        ) {
          const fallbackConn = await this.O(this.name, undefined, { // was: K (reused)
            ...callbacks,
            upgrade: undefined, // was: void 0
          });
          const existingVersion = fallbackConn.W.version; // was: T (reused)
          if (this.options.version !== undefined && existingVersion > this.options.version + 1) {
            fallbackConn.close();
            this.A = false; // was: !1
            throw createIncompatibleVersionError(this, existingVersion);
          }
          return fallbackConn;
        }

        onClosed();
        if (err instanceof Error && !getExperimentBoolean('ytidb_async_stack_killswitch')) {
          err.stack = `${err.stack}\n${stackTrace.substring(stackTrace.indexOf('\n') + 1)}`;
        }
        throw classifyIdbError(err, this.name, '', this.options.version ?? -1);
      }
    };

    return (this.W = openPromise = doOpen());
  }
}

// ============================================================================
// Meta Database Definition  (lines 67744-67762)
// ============================================================================

/**
 * The `YtIdbMeta` database stores metadata about all other user-scoped
 * databases. It has a single object store `databases` keyed by `actualName`.
 *
 * [was: Kq]  (line 67744)
 */
const META_DB_DEF = new DatabaseDefinition('YtIdbMeta', { // was: Kq
  ML: {
    databases: { d0: 1 },
  },
  upgrade(connection, versionCheck) { // was: (Q, c)
    versionCheck(1) && createObjectStore(connection, 'databases', { keyPath: 'actualName' });
  },
});

/**
 * Singleton IDB auth token object.
 *
 * [was: U3]  (line 67756)
 */
const IDB_AUTH_TOKEN = new (class { constructor() {} })(new (class { constructor() {} })()); // was: U3

// ============================================================================
// User-scoped Database Definition  (lines 67764-67778)
// ============================================================================

/**
 * A `DatabaseDefinition` that routes open/delete through the user-scoped
 * or shared database helpers depending on `options.shared`.
 *
 * [was: ro0]  (line 67764)
 */
export class UserScopedDatabaseDefinition extends DatabaseDefinition { // was: ro0
  /**
   * @param {string} name    [was: Q]
   * @param {Object} options [was: c]
   */
  constructor(name, options) {
    super(name, options);
    this.options = options;
    validateDbName(name); // was: gl(Q)
  }

  /** @override */
  O(name, version, callbacks = {}) { // was: O(Q, c, W={})
    return (this.options.shared ? openSharedDatabase : openUserDatabase)(name, version, {
      ...callbacks,
    });
  }

  /** @override */
  delete(options = {}) {
    return (this.options.shared ? deleteSharedDatabase : deleteUserDatabase)(this.name, options);
  }
}

// ============================================================================
// GCF Config Store  (lines 67780-67801, 13059-13117)
// ============================================================================

/**
 * Database definition for the GCF (Google Config Framework) config store.
 * Contains `hotConfigStore` and `coldConfigStore` with timestamp indexes.
 *
 * [was: IZ7]  (line 67780)
 */
const GCF_CONFIG_DB = createDatabaseDefinition('ytGcfConfig', { // was: IZ7 = el(...)
  ML: {
    coldConfigStore: { d0: 1 },
    hotConfigStore: { d0: 1 },
  },
  shared: false, // was: !1
  upgrade(connection, versionCheck) { // was: (Q, c)
    if (versionCheck(1)) {
      createIndex(
        createObjectStore(connection, 'hotConfigStore', { keyPath: 'key', autoIncrement: true }), // was: !0
        'hotTimestampIndex',
        'timestamp',
      );
      createIndex(
        createObjectStore(connection, 'coldConfigStore', { keyPath: 'key', autoIncrement: true }), // was: !0
        'coldTimestampIndex',
        'timestamp',
      );
    }
  },
  version: 1,
});

/**
 * Opens the GCF config database.
 *
 * [was: Vb (for GCF)]  (line 13055)
 * @param {*} token [was: Q]
 * @returns {Promise<IdbConnection>}
 */
export function openGcfConfigDb(token) { // was: Vb
  return openWithToken(GCF_CONFIG_DB(), token); // was: g.m7(IZ7(), Q)
}

/**
 * Stores a hot-config entry, clearing the store first.
 *
 * [was: X_m]  (line 13059)
 * @param {*}      config   [was: Q]
 * @param {*}      hashData [was: c]
 * @param {*}      token    [was: W]
 * @param {number} [timestamp] [was: m]
 * @returns {Promise}
 */
export async function storeHotConfig(config, hashData, token, timestamp) { // was: X_m
  const entry = {
    config,
    hashData,
    timestamp: timestamp !== undefined ? timestamp : g.h(), // was: (0, g.h)()
  };
  const conn = await openGcfConfigDb(token); // was: W = await Vb(W)
  await conn.clear('hotConfigStore');
  return await conn.put('hotConfigStore', entry);
}

/**
 * Stores a cold-config entry, clearing the store first.
 *
 * [was: Ao7]  (line 13071)
 * @param {*}      config     [was: Q]
 * @param {*}      hashData   [was: c]
 * @param {*}      configData [was: W]
 * @param {*}      token      [was: m]
 * @param {number} [timestamp] [was: K]
 * @returns {Promise}
 */
export async function storeColdConfig(config, hashData, configData, token, timestamp) { // was: Ao7
  const entry = {
    config,
    hashData,
    configData,
    timestamp: timestamp !== undefined ? timestamp : g.h(), // was: (0, g.h)()
  };
  const conn = await openGcfConfigDb(token); // was: m = await Vb(m)
  await conn.clear('coldConfigStore');
  return await conn.put('coldConfigStore', entry);
}

/**
 * Retrieves the latest cold-config entry by descending timestamp.
 *
 * [was: eQn]  (line 13084)
 * @param {*} token [was: Q]
 * @returns {Promise<Object|undefined>}
 */
export async function getLatestColdConfig(token) { // was: eQn
  const conn = await openGcfConfigDb(token); // was: Q = await Vb(Q)
  let result = undefined; // was: c = void 0
  await runTransaction(conn, ['coldConfigStore'], {
    mode: 'readwrite',
    g3: true, // was: !0
  }, (shouldUseDesktopControls) =>
    openIndexCursor(
      shouldUseDesktopControls.objectStore('coldConfigStore').index('coldTimestampIndex'),
      { direction: 'prev' },
      (cursor) => { result = cursor.getValue(); },
    )
  );
  return result;
}

/**
 * Retrieves the latest hot-config entry by descending timestamp.
 *
 * [was: V0d]  (line 13099)
 * @param {*} token [was: Q]
 * @returns {Promise<Object|undefined>}
 */
export async function getLatestHotConfig(token) { // was: V0d
  const conn = await openGcfConfigDb(token); // was: Q = await Vb(Q)
  let result = undefined; // was: c = void 0
  await runTransaction(conn, ['hotConfigStore'], {
    mode: 'readwrite',
    g3: true, // was: !0
  }, (shouldUseDesktopControls) =>
    openIndexCursor(
      shouldUseDesktopControls.objectStore('hotConfigStore').index('hotTimestampIndex'),
      { direction: 'prev' },
      (cursor) => { result = cursor.getValue(); },
    )
  );
  return result;
}

/**
 * Deletes all user-scoped GCF config databases.
 *
 * [was: Byy]  (line 13114)
 */
export async function deleteGcfConfigDatabases() { // was: Byy
  await deleteAllUserDatabases('ytGcfConfig'); // was: TyO("ytGcfConfig")
}
