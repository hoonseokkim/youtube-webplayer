import { extractHostname } from '../ads/ad-scheduling.js';
import { getConfigValue } from '../modules/remote/mdx-session.js';

/**
 * Service Endpoint Definitions
 *
 * URL building, endpoint resolution, interface-specific path selection,
 * same-origin detection, and request-option construction for Innertube
 * service calls.
 *
 * Source: base.js lines 11047-11076, 11674-11702, 18654-18679,
 *         40920, 72091-72160
 *
 * @module network/service-endpoints
 */

// ---------------------------------------------------------------------------
// Interface filter patterns (per-product URL prefixes)
// ---------------------------------------------------------------------------

/**
 * Maps Innertube client names to regex patterns that identify their
 * endpoint-path prefixes. Used by {@link resolveEndpointPath} to pick
 * the correct path when a command offers multiple interface-specific
 * alternatives.
 * [was: ps0]
 *
 * @type {Record<string, string>}
 */
export const INTERFACE_PATH_PATTERNS = { // was: ps0
  WEB_UNPLUGGED:                 '^unplugged/',
  WEB_UNPLUGGED_ONBOARDING:     '^unplugged/',
  WEB_UNPLUGGED_OPS:            '^unplugged/',
  WEB_UNPLUGGED_PUBLIC:         '^unplugged/',
  WEB_CREATOR:                  '^creator/',
  WEB_KIDS:                     '^kids/',
  WEB_EXPERIMENTS:              '^experiments/',
  WEB_MUSIC:                    '^music/',
  WEB_REMIX:                    '^music/',
  WEB_MUSIC_EMBEDDED_PLAYER:    '^main_app/|^sfv/',
};

// ---------------------------------------------------------------------------
// Endpoint path resolution
// ---------------------------------------------------------------------------

/**
 * Given one or more candidate endpoint paths, selects the most appropriate
 * one for the current interface. Prefers the path that matches
 * {@link INTERFACE_PATH_PATTERNS} for `UNKNOWN_INTERFACE`, then falls back
 * to the shortest path that is not matched by any known interface pattern.
 * [was: QFO]
 *
 * @param {string[]} candidates - Array of candidate paths
 * @returns {string} The selected path
 */
export function resolveEndpointPath(candidates) { // was: QFO
  if (candidates.length === 1) return candidates[0];

  // Try the UNKNOWN_INTERFACE pattern first
  const unknownPattern = INTERFACE_PATH_PATTERNS.UNKNOWN_INTERFACE;
  if (unknownPattern) {
    const restartExpiryTimer = new RegExp(unknownPattern);
    for (const path of candidates) {
      if (restartExpiryTimer.exec(path)) return path;
    }
  }

  // Build a combined regex of all known interface patterns
  const knownPatterns = [];
  for (const [key, pattern] of Object.entries(INTERFACE_PATH_PATTERNS)) {
    if (key !== 'UNKNOWN_INTERFACE') knownPatterns.push(pattern);
  }
  const knownRegex = new RegExp(knownPatterns.join('|'));

  // Sort by length (shortest first) and pick the first unmatched path
  candidates.sort((a, b) => a.length - b.length);
  for (const path of candidates) {
    if (!knownRegex.exec(path)) return path;
  }

  return candidates[0];
}

/**
 * Builds the standard Innertube v1 API URL for the given endpoint path(s).
 * [was: buildInnertubeApiPath]
 *
 * @example
 *   buildInnertubeApiPath(['player'])
 *   // => '/youtubei/v1/player'
 *
 * @param {string[]} endpointPaths - One or more candidate paths
 * @returns {string} Full API path starting with /youtubei/v1/
 */
export function buildInnertubeApiPath(endpointPaths) { // was: g.vu
  return `/youtubei/v1/${resolveEndpointPath(endpointPaths)}`;
}

// ---------------------------------------------------------------------------
// Host override
// ---------------------------------------------------------------------------

/**
 * Prepends the INNERTUBE_HOST_OVERRIDE (if configured) to an API path,
 * allowing requests to be routed to an alternate backend.
 * [was: xn]
 *
 * @param {string} apiPath - e.g. "/youtubei/v1/player"
 * @returns {string} Potentially prefixed path
 */
export function applyHostOverride(apiPath) { // was: xn
  const hostOverride = getConfigValue('INNERTUBE_HOST_OVERRIDE'); // was: g.v(...)
  if (hostOverride) {
    apiPath = String(hostOverride) + String(stripLeadingSlash(apiPath)); // was: NN(Q)
  }
  return apiPath;
}

// ---------------------------------------------------------------------------
// Condensed-response parameter
// ---------------------------------------------------------------------------

/**
 * Appends `prettyPrint=false` to an API URL when the
 * `json_condensed_response` experiment flag is active. This instructs the
 * server to omit whitespace from the JSON response body.
 * [was: gJR]
 *
 * @param {string} url
 * @returns {string}
 */
export function appendCondensedParam(url) { // was: gJR
  const params = {};
  if (getExperimentFlag('json_condensed_response')) { // was: g.P(...)
    params.prettyPrint = 'false';
  }
  return appendQueryParamsPreserveExisting(url, params); // was: vz(Q, c)
}

// ---------------------------------------------------------------------------
// Query-parameter helpers
// ---------------------------------------------------------------------------

/**
 * Appends query parameters to a URL, **overwriting** existing params with
 * the same key.
 * [was: fe]
 *
 * @param {string} url
 * @param {Record<string, string>} params
 * @returns {string}
 */
export function appendQueryParams(url, params) { // was: fe
  return mergeQueryParams(url, params || {}, true); // was: Oi(Q, c||{}, true)
}

/**
 * Appends query parameters to a URL, **preserving** existing params.
 * [was: vz]
 *
 * @param {string} url
 * @param {Record<string, string>} params
 * @returns {string}
 */
export function appendQueryParamsPreserveExisting(url, params) { // was: vz
  return mergeQueryParams(url, params || {}, false); // was: Oi(Q, c||{}, false)
}

/**
 * Low-level query-parameter merge. Splits hash, merges into existing params.
 * [was: Oi]
 *
 * @param {string} url
 * @param {Record<string, string>} params
 * @param {boolean} overwrite - true to overwrite existing params
 * @returns {string}
 */
function mergeQueryParams(url, params, overwrite) { // was: Oi
  const hashParts = url.split('#', 2);
  url = hashParts[0];
  const hashFragment = hashParts.length > 1 ? '#' + hashParts[1] : '';

  const queryParts = url.split('?', 2);
  url = queryParts[0];
  const existing = parseQueryString(queryParts[1] || ''); // was: bk(K[1] || "")

  for (const key in params) {
    if (overwrite || !(key in existing)) { // was: !g.fm(K, T)
      existing[key] = params[key];
    }
  }

  return buildQueryString(url, existing) + hashFragment; // was: g.sJ(Q, K)
}

// ---------------------------------------------------------------------------
// Same-origin detection
// ---------------------------------------------------------------------------

/**
 * Determines whether a URL is same-origin relative to the current page.
 * Compares protocol, hostname, and port.
 * [was: ax]
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isSameOrigin(url) { // was: ax
  const currentHref = window.location.href;
  const urlScheme = parseUrlParts(url)[1] || null;   // was: g.qN(Q)[1]
  const urlHost = extractHostname(url);               // was: g.D9(Q)

  if (urlScheme && urlHost) {
    // Both scheme and host present: compare scheme, host, and port
    const urlParts = parseUrlParts(url);
    const currentParts = parseUrlParts(currentHref);
    return urlParts[3] === currentParts[3]   // hostname
        && urlParts[1] === currentParts[1]   // scheme
        && urlParts[4] === currentParts[4];  // port
  }

  if (urlHost) {
    // Host-only: compare hostname and port
    return extractHostname(currentHref) === urlHost
        && (Number(parseUrlParts(currentHref)[4] || null) || null)
           === (Number(parseUrlParts(url)[4] || null) || null);
  }

  // No host means relative URL -> same origin
  return true;
}

// ---------------------------------------------------------------------------
// Fetch-options builder
// ---------------------------------------------------------------------------

/**
 * Builds the `RequestInit`-like options object for a `fetch()` call to the
 * given URL.
 * [was: qt]
 *
 * @param {string} url
 * @param {string} [method='POST']
 * @returns {RequestInit}
 */
export function buildFetchOptions(url, method = 'POST') { // was: qt
  const options = {
    method,
    mode:        isSameOrigin(url) ? 'same-origin' : 'cors',
    credentials: isSameOrigin(url) ? 'same-origin' : 'include',
  };

  // Note: the original code builds an empty header map and only adds
  // non-falsy entries. In practice this produces no headers at this stage.
  const headers = {};
  const filteredHeaders = {};
  for (const key of Object.keys(headers)) {
    if (headers[key]) filteredHeaders[key] = headers[key];
  }
  if (Object.keys(filteredHeaders).length > 0) {
    options.headers = filteredHeaders;
  }

  return options;
}

// ---------------------------------------------------------------------------
// Service key builder
// ---------------------------------------------------------------------------

/**
 * Builds a deterministic cache key for a service + params combination.
 * [was: nh]
 *
 * @example
 *   buildServiceKey('player', { videoId: 'abc123' })
 *   // => 'service:player/videoId:abc123'
 *
 * @param {string} serviceName
 * @param {Record<string, string>} [params={}]
 * @returns {string}
 */
export function buildServiceKey(serviceName, params = {}) { // was: nh
  return `service:${serviceName}/${
    Object.keys(params)
      .sort()
      .map((key) => key + ':' + params[key])
      .join('/')
  }`;
}

// ---------------------------------------------------------------------------
// Client-name-to-platform mappings (used by player telemetry)
// ---------------------------------------------------------------------------

/**
 * Maps short client identifiers to canonical Innertube client names.
 * [was: ek7]
 *
 * @type {Record<string, string>}
 */
export const CLIENT_ID_TO_NAME = { // was: ek7
  'android':       'ANDROID',
  'android.k':     'ANDROID_KIDS',
  'android.m':     'ANDROID_MUSIC',
  'android.up':    'ANDROID_UNPLUGGED',
  'youtube':       'WEB',
  'youtube.m':     'WEB_REMIX',
  'youtube.up':    'WEB_UNPLUGGED',
  'ytios':         'IOS',
  'ytios.k':       'IOS_KIDS',
  'ytios.m':       'IOS_MUSIC',
  'ytios.up':      'IOS_UNPLUGGED',
};

/**
 * Maps short form-factor identifiers to canonical form-factor strings.
 * [was: V1d]
 *
 * @type {Record<string, string>}
 */
export const FORM_FACTOR_MAP = { // was: V1d
  desktop: 'DESKTOP',
  phone:   'MOBILE',
  tablet:  'TABLET',
};

// ---------------------------------------------------------------------------
// Nocookie / trusted domains
// ---------------------------------------------------------------------------

/**
 * Domains that are considered trusted-third-party or nocookie variants.
 * Auth headers are not sent to these domains.
 * [was: mEO]
 *
 * @type {string[]}
 */
export const NOCOOKIE_DOMAINS = [ // was: mEO
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com:443',
  'youtube.googleapis.com',
  'www.youtubeedu.com',
  'www.youtubeeducation.com',
  'video.google.com',
  'redirector.gvt1.com',
];

// ---------------------------------------------------------------------------
// Placeholder imports (from ../core/)
// ---------------------------------------------------------------------------

/*
import { getConfigValue, getExperimentFlag, parseQueryString,
import { restartExpiryTimer } from '../ads/ad-prebuffer.js'; // was: re
import { getExperimentFlag, parseQueryString } from '../core/composition-helpers.js';
         buildQueryString, parseUrlParts, extractHostname }
  from '../core/config.js';

// stripLeadingSlash is a trivial helper: (s) => s.replace(/^\//, '')
function stripLeadingSlash(path) {
  return path.replace(/^\//, '');
}
*/
