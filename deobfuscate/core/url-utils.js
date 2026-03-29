// Source: player_es6.vflset/en_US/base.js, lines ~1357–1466, ~4317–4466, ~8777–8847
// URL parsing and query string manipulation utilities extracted and deobfuscated from YouTube's base.js

/** @type {RegExp} URI splitting pattern per RFC 3986 */
import { slice } from './array-utils.js';
/* was: uin — referenced by g.qN */
const URI_REGEX = /^(?:([^:/?#.]+):)?(?:\/\/(?:([^\\/?#]*)@)?([^\\/?#]*?)(?::([0-9]+))?(?=[\\/?#]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/;

/** @type {RegExp} Matches the query/hash boundary */
/* was: ws */
const HASH_SEARCH_REGEX = /#|$/;

/** @type {RegExp} Cleans up empty param artifacts */
/* was: CD0 */
const TRAILING_PARAM_REGEX = /[?&]($|#)/;

/**
 * Encode a URI component value.
 * @param {*} value
 * @returns {string}
 */
/* was: g.Hb */
export function encodeParam(value) {
  return encodeURIComponent(String(value));
}

/**
 * Decode a URI component, treating `+` as space.
 * @param {string} value
 * @returns {string}
 */
/* was: Ni */
export function decodeParam(value) {
  return decodeURIComponent(value.replace(/\+/g, ' '));
}

/**
 * Split a URI string into its component parts.
 * Returns an array: [full, scheme, userInfo, domain, port, path, query, fragment].
 * @param {string} uri
 * @returns {RegExpMatchArray}
 */
/* was: g.qN */
export function parseUri(uri) {
  return uri.match(URI_REGEX);
}

/**
 * Extract the domain (host) from a URI string.
 * @param {string} uri
 * @returns {string|null}
 */
/* was: g.D9 */
export function getDomain(uri) {
  const part = parseUri(uri)[3] || null;
  return part ? decodeURI(part) : part;
}

/**
 * Extract the path from a URI string.
 * @param {string} uri
 * @returns {string|null}
 */
/* was: tF */
export function getPath(uri) {
  const part = parseUri(uri)[5] || null;
  return part ? decodeURI(part) : part;
}

/**
 * Get the origin portion of a URI (scheme + authority).
 * @param {string} uri
 * @returns {string}
 */
/* was: g.Hh */
export function getOrigin(uri) {
  const parts = parseUri(uri);
  return buildUri(parts[1], parts[2], parts[3], parts[4]);
}

/**
 * Get the relative portion of a URI (path + query + fragment).
 * @param {string} uri
 * @returns {string}
 */
/* was: NN */
export function getRelativeUri(uri) {
  const parts = parseUri(uri);
  return buildUri(null, null, null, null, parts[5], parts[6], parts[7]);
}

/**
 * Assemble a URI string from individual components.
 * @param {string|null} scheme
 * @param {string|null} userInfo
 * @param {string|null} domain
 * @param {string|number|null} port
 * @param {string|null} path
 * @param {string|null} query
 * @param {string|null} fragment
 * @returns {string}
 */
/* was: x8 */
export function buildUri(scheme, userInfo, domain, port, path, query, fragment) {
  let uri = '';
  if (scheme) uri += scheme + ':';
  if (domain) {
    uri += '//';
    if (userInfo) uri += userInfo + '@';
    uri += domain;
    if (port) uri += ':' + port;
  }
  if (path) uri += path;
  if (query) uri += '?' + query;
  if (fragment) uri += '#' + fragment;
  return uri;
}

/**
 * Remove the fragment (hash) portion of a URL.
 * @param {string} url
 * @returns {string}
 */
/* was: i_ */
export function stripFragment(url) {
  const hashIndex = url.indexOf('#');
  return hashIndex < 0 ? url : url.slice(0, hashIndex);
}

/**
 * Iterate over query string parameters, invoking a callback for each key/value pair.
 * @param {string} queryString - Raw query string (without leading '?').
 * @param {(key: string, value: string) => void} callback
 */
/* was: yz */
export function forEachQueryParam(queryString, callback) {
  if (queryString) {
    const pairs = queryString.split('&');
    for (let i = 0; i < pairs.length; i++) {
      const eqIndex = pairs[i].indexOf('=');
      let key, value = null;
      if (eqIndex >= 0) {
        key = pairs[i].substring(0, eqIndex);
        value = pairs[i].substring(eqIndex + 1);
      } else {
        key = pairs[i];
      }
      callback(key, value ? decodeParam(value) : '');
    }
  }
}

/**
 * Append a query string fragment to a URL, handling existing `?` and `#`.
 * @param {string} url
 * @param {string} queryFragment - e.g. "foo=bar"
 * @returns {string}
 */
/* was: Sb */
export function appendQueryString(url, queryFragment) {
  if (!queryFragment) return url;
  let hashIndex = url.indexOf('#');
  if (hashIndex < 0) hashIndex = url.length;

  let qIndex = url.indexOf('?');
  let existingQuery;
  if (qIndex < 0 || qIndex > hashIndex) {
    qIndex = hashIndex;
    existingQuery = '';
  } else {
    existingQuery = url.substring(qIndex + 1, hashIndex);
  }

  const parts = [url.slice(0, qIndex), existingQuery, url.slice(hashIndex)];
  parts[1] = queryFragment ? (parts[1] ? parts[1] + '&' + queryFragment : queryFragment) : parts[1];
  return parts[0] + (parts[1] ? '?' + parts[1] : '') + parts[2];
}

/**
 * Build a query string from key/value pairs (flat array: [k1, v1, k2, v2, ...]).
 * @param {Array} pairs
 * @param {number} [startIndex=0]
 * @returns {string}
 */
/* was: Z9 */
export function buildQueryFromPairs(pairs, startIndex) {
  const result = [];
  for (let i = startIndex || 0; i < pairs.length; i += 2) {
    appendParam(pairs[i], pairs[i + 1], result);
  }
  return result.join('&');
}

/**
 * Build a query string from an object of key/value pairs.
 * @param {Object} params
 * @returns {string}
 */
/* was: g.EJ */
export function buildQueryFromObject(params) {
  const result = [];
  for (const key in params) {
    appendParam(key, params[key], result);
  }
  return result.join('&');
}

/**
 * Append query parameters from an object to a URL.
 * @param {string} url
 * @param {Object} params - Key/value pairs to add.
 * @returns {string}
 */
/* was: g.sJ */
export function appendParamsToUrl(url, params) {
  const queryStr = buildQueryFromObject(params);
  return appendQueryString(url, queryStr);
}

/**
 * Add a single query parameter to a URL.
 * @param {string} url
 * @param {string} key
 * @param {*} [value]
 * @returns {string}
 */
/* was: ds */
export function addQueryParam(url, key, value) {
  const valuePart = value != null ? '=' + encodeParam(value) : '';
  return appendQueryString(url, key + valuePart);
}

/**
 * Get the value of a specific query parameter from a URL.
 * @param {string} url
 * @param {string} paramName
 * @returns {string|null}
 */
/* was: b_ */
export function getQueryParam(url, paramName) {
  const hashBoundary = url.search(HASH_SEARCH_REGEX);
  let pos = findParamPosition(url, 0, paramName, hashBoundary);
  if (pos < 0) return null;

  let endPos = url.indexOf('&', pos);
  if (endPos < 0 || endPos > hashBoundary) endPos = hashBoundary;

  pos += paramName.length + 1;
  return decodeParam(url.slice(pos, endPos !== -1 ? endPos : 0));
}

/**
 * Remove a query parameter from a URL.
 * @param {string} url
 * @param {string} paramName
 * @returns {string}
 */
/* was: gs */
export function removeQueryParam(url, paramName) {
  const hashBoundary = url.search(HASH_SEARCH_REGEX);
  let start = 0;
  let pos;
  const segments = [];

  while ((pos = findParamPosition(url, start, paramName, hashBoundary)) >= 0) {
    segments.push(url.substring(start, pos));
    start = Math.min(url.indexOf('&', pos) + 1 || hashBoundary, hashBoundary);
  }

  segments.push(url.slice(start));
  return segments.join('').replace(TRAILING_PARAM_REGEX, '$1');
}

/**
 * Set (replace or add) a query parameter on a URL.
 * @param {string} url
 * @param {string} key
 * @param {*} value
 * @returns {string}
 */
/* was: M4m */
export function setQueryParam(url, key, value) {
  return addQueryParam(removeQueryParam(url, key), key, value);
}

/**
 * Set a query parameter on a g.KG (Uri) instance.
 * Note: This operates on the internal query-params map of the Uri object.
 * @param {Object} uriInstance - A g.KG Uri object.
 * @param {string} key
 * @param {*} value
 */
/* was: g.eX */
export function setUriQueryParam(uriInstance, key, value) {
  uriInstance.j.set(key, value);
}

// ── Internal helpers ──

/**
 * Append a key/value pair to a query-string parts array.
 * @param {string} key
 * @param {string|string[]} value
 * @param {string[]} parts
 */
/* was: FS */
function appendParam(key, value, parts) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      appendParam(key, String(value[i]), parts);
    }
  } else {
    if (value != null) {
      parts.push(key + (value === '' ? '' : '=' + encodeParam(value)));
    }
  }
}

/**
 * Find the position of a parameter name in a URL query string.
 * @param {string} url
 * @param {number} startPos
 * @param {string} paramName
 * @param {number} hashBoundary
 * @returns {number} Position index or -1 if not found.
 */
/* was: Lj */
function findParamPosition(url, startPos, paramName, hashBoundary) {
  const nameLen = paramName.length;
  let pos;
  while ((pos = url.indexOf(paramName, startPos)) >= 0 && pos < hashBoundary) {
    const preceding = url.charCodeAt(pos - 1);
    if (preceding == 38 /* & */ || preceding == 63 /* ? */) {
      const following = url.charCodeAt(pos + nameLen);
      if (!following || following == 61 /* = */ || following == 38 /* & */ || following == 35 /* # */) {
        return pos;
      }
    }
    startPos = pos + nameLen + 1;
  }
  return -1;
}
