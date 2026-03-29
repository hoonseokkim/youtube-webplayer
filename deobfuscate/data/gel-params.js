/**
 * GEL Parameter Construction — query-string building, parameter encoding,
 * protobuf reader internals, error reporting pipeline, and screen-nonce /
 * visual-element lifecycle management.
 *
 * Source: base.js lines 15280–15999
 *
 * Coverage map:
 *   15280-15305  XY — core GEL event dispatch (timestamp, sequence, routing)
 *   15307-15314  uS7, l9X — flush helper, sequence-group index management
 *   15316-15384  g.eG, g.Bo, x0, zJ7, C_R, qE, Mbd, g.na — event API,
 *                visual-element factories, client-screen-nonce store
 *   15368-15398  JF3, RJW, g.Df, YJ7, ph7, tZ — CSN-to-CTT-auth-info map
 *   15404-15448  cfW, Ho, Wb_, mK_ — screen association, session tempdata
 *   15463-15475  T9O, oEy — error fingerprinting (Java, extension, user-script)
 *   15477-15597  i5, UKw, XNy, yF, Afm, SG, FY — error-sampler setup,
 *                protobuf tag/varint reader, error-param serialisation
 *   15598-15875  EE, g.Ty, g.Zf, e6X, DKn — error logging pipeline
 *                (console, GEL clientError, ecatcher /error_204)
 *   15877-15911  wn, gn, SFR, g.OE — command unwrapping / entity helpers
 *   15913-15999  EE3, swX, wNx, g.Po, g.$0, b47 — proto helper, hash,
 *                screen creation, VE attach, element-gestured logging
 *
 * @module data/gel-params
 */

import { getProperty, setCookie } from '../core/misc-helpers.js';  // was: g.l, g.e$
import { sendXhrRequest } from '../network/request.js';  // was: g.Wn
import { flushLogs, getLastActivityMs, processJsonLogEvent, pubsub2Publish } from './gel-core.js';  // was: g.CL, g.YW, g.AF3, g.Lq
import { filter, clear } from '../core/array-utils.js';
import { getDomain, removeQueryParam } from '../core/url-utils.js';
import { startsWith, hashCode, toString } from '../core/string-utils.js';
import { createElement } from '../core/dom-utils.js';

// ===========================================================================
// Core GEL event dispatch (lines 15280-15314)
// ===========================================================================

/**
 * Constructs a GEL log_event payload with timestamp, sequence metadata,
 * and last-activity context, then routes it through the appropriate
 * dispatch path (isolated vs. batched).
 * [was: XY]
 *
 * @param {string}   payloadName [was: Q] — e.g. "screenCreated"
 * @param {object}   payloadData [was: c] — event-specific data
 * @param {Function} [clientCtor] [was: W] — client constructor for batched send
 * @param {object}   [options={}] [was: m]
 * @param {number}   [options.timestamp]
 * @param {string}   [options.sequenceGroup]
 * @param {boolean}  [options.endOfSequence]
 * @param {string}   [options.automatedLogEventSource]
 * @param {boolean}  [options.sendIsolatedPayload]
 * @param {object}   [options.cttAuthInfo]
 * @param {boolean}  [options.dangerousLogToVisitorSession]
 */
export function dispatchGelPayload(payloadName, payloadData, clientCtor, options = {}) { // was: XY
  const envelope = {};
  const eventTimeMs = Math.round(options.timestamp || now()); // was: (0, g.h)()
  envelope.eventTimeMs = eventTimeMs < Number.MAX_SAFE_INTEGER ? eventTimeMs : 0;
  envelope[payloadName] = payloadData;

  // Last-activity context
  const lastActivity = getLastActivityMs(); // was: YW()
  envelope.context = {
    lastActivityMs: String(options.timestamp || !isFinite(lastActivity) ? -1 : lastActivity),
  };

  // Sequence metadata
  if (options.sequenceGroup && !getFlag('web_gel_sequence_info_killswitch')) {
    const seqCtx = envelope.context;
    const group = options.sequenceGroup;
    seqCtx.sequence = {
      index: getAndIncrementSequenceIndex(group), // was: l9X(c)
      groupKey: group,
    };
    if (options.endOfSequence) delete sequenceGroupCounters[options.sequenceGroup]; // was: Iv
  }

  // Automated event source tagging
  if (getFlag('web_tag_automated_log_events')) {
    envelope.context.automatedLogEventSource = options.automatedLogEventSource;
  }

  // Route: isolated (high-priority, bypass batching) vs. standard
  const sendFn = options.sendIsolatedPayload ? sendIsolatedJsonPayload : processJsonLogEvent; // was: I9x : AF3
  sendFn({
    endpoint: 'log_event',
    payload: envelope,
    cttAuthInfo: options.cttAuthInfo,
    dangerousLogToVisitorSession: options.dangerousLogToVisitorSession,
  }, clientCtor);
}

/**
 * Immediately flushes GEL logs for a given code section.
 * [was: uS7]
 *
 * @param {string}  [source='CODE_SECTION_UNSPECIFIED'] [was: Q]
 * @param {boolean} [isJspb=false]                       [was: c]
 */
export function flushLogsForSection(source = 'CODE_SECTION_UNSPECIFIED', isJspb = false) { // was: uS7
  flushLogs(source, undefined, isJspb); // was: CL(Q, void 0, c)
}

/**
 * Returns (and auto-increments) the sequence index for a given group key.
 * [was: l9X]
 *
 * @param {string} groupKey [was: Q]
 * @returns {number}
 */
function getAndIncrementSequenceIndex(groupKey) { // was: l9X
  sequenceGroupCounters[groupKey] = groupKey in sequenceGroupCounters
    ? sequenceGroupCounters[groupKey] + 1
    : 0;
  return sequenceGroupCounters[groupKey];
}

// ===========================================================================
// Public GEL event API (lines 15316-15384)
// ===========================================================================

/**
 * Logs a GEL event via the global default client.
 * [was: g.eG]
 *
 * @param {string}  payloadName [was: Q]
 * @param {object}  payloadData [was: c]
 * @param {object}  [options={}] [was: W]
 */
export function logGelEvent(payloadName, payloadData, options = {}) { // was: g.eG
  let clientCtor = defaultGelClientCtor; // was: g.AZ
  if (getConfigValue('ytLoggingEventsDefaultDisabled', false) && defaultGelClientCtor === defaultGelClientCtor) {
    clientCtor = null;
  }
  dispatchGelPayload(payloadName, payloadData, clientCtor, options);
}

/**
 * Creates a VisualElement from a tracking-params token.
 * [was: g.Bo]
 *
 * @param {string} trackingParams [was: Q]
 * @returns {VisualElement}
 */
export function createVeFromTrackingParams(trackingParams) { // was: g.Bo
  return new VisualElement({ trackingParams }); // was: VF
}

/**
 * Creates a VisualElement with full type/counter/data.
 * [was: x0]
 *
 * @param {number}  veType            [was: Q]
 * @param {*}       dataElement       [was: c]
 * @param {number}  [elementIndex]    [was: W]
 * @param {*}       [youtubeData]     [was: m]
 * @param {*}       [jspbYoutubeData] [was: K]
 * @param {*}       [loggingDirectives] [was: T]
 * @returns {VisualElement}
 */
export function createVisualElement(veType, dataElement, elementIndex, youtubeData, jspbYoutubeData, loggingDirectives) { // was: x0
  const veCounter = veCounterNext++; // was: hJ7++
  return new VisualElement({
    veType,
    veCounter,
    elementIndex,
    dataElement,
    youtubeData,
    jspbYoutubeData,
    loggingDirectives,
  });
}

// ===========================================================================
// Client-screen-nonce (CSN) store (lines 15341-15384)
// ===========================================================================

/**
 * Retrieves the client screen nonce for a given screen index.
 * [was: zJ7]
 *
 * @param {number} [screenIndex=0] [was: Q]
 * @returns {string|undefined}
 */
export function getClientScreenNonceForIndex(screenIndex = 0) { // was: zJ7
  return getConfigValue('client-screen-nonce-store', {})[screenIndex];
}

/**
 * Stores a client screen nonce for a given screen index.
 * [was: C_R]
 *
 * @param {string} csn          [was: Q]
 * @param {number} [screenIndex=0] [was: c]
 */
export function setClientScreenNonce(csn, screenIndex = 0) { // was: C_R
  let store = getConfigValue('client-screen-nonce-store');
  if (!store) {
    store = {};
    setConfigValue('client-screen-nonce-store', store); // was: y$
  }
  store[screenIndex] = csn;
}

/**
 * Returns the settings key for root VE type at a given screen index.
 * [was: qE]
 *
 * @param {number} [screenIndex=0] [was: Q]
 * @returns {string}
 */
function getRootVeKey(screenIndex = 0) { // was: qE
  return screenIndex === 0 ? 'ROOT_VE_TYPE' : `ROOT_VE_TYPE.${screenIndex}`;
}

/**
 * Gets the root VE type for a given screen index.
 * [was: Mbd]
 *
 * @param {number} [screenIndex=0] [was: Q]
 * @returns {number|undefined}
 */
export function getRootVeType(screenIndex = 0) { // was: Mbd
  return getConfigValue(getRootVeKey(screenIndex));
}

/**
 * Returns a VisualElement for the current root VE, or null.
 * [was: g.na]
 *
 * @param {number} [screenIndex=0] [was: Q]
 * @returns {VisualElement|null}
 */
export function getRootVisualElement(screenIndex = 0) { // was: g.na
  const veType = getRootVeType(screenIndex);
  return veType
    ? new VisualElement({ veType, youtubeData: undefined, jspbYoutubeData: undefined })
    : null;
}

// ===========================================================================
// CSN-to-CTT auth info mapping (lines 15368-15402)
// ===========================================================================

/**
 * Returns (or creates) the CSN-to-CTT auth info map.
 * [was: JF3]
 *
 * @returns {Record<string, object>}
 */
function getCsnToCttMap() { // was: JF3
  let map = getConfigValue('csn-to-ctt-auth-info');
  if (!map) {
    map = {};
    setConfigValue('csn-to-ctt-auth-info', map);
  }
  return map;
}

/**
 * Returns all currently stored client screen nonces (non-undefined).
 * [was: RJW]
 *
 * @returns {string[]}
 */
export function getAllClientScreenNonces() { // was: RJW
  return Object.values(getConfigValue('client-screen-nonce-store', {}))
    .filter((csn) => csn !== undefined);
}

/**
 * Returns the current client screen nonce, with optional fallback.
 * [was: g.Df]
 *
 * @param {number} [screenIndex=0] [was: Q]
 * @returns {string|null}
 */
export function getClientScreenNonce(screenIndex = 0) { // was: g.Df
  let csn = getClientScreenNonceForIndex(screenIndex);
  if (!csn && !getConfigValue('USE_CSN_FALLBACK', true)) return null;
  if (!csn) csn = 'UNDEFINED_CSN';
  return csn || null;
}

/**
 * Checks whether a given CSN is associated with a known screen index.
 * [was: YJ7]
 *
 * @param {string} csn [was: Q]
 * @returns {boolean}
 */
export function isKnownScreenNonce(csn) { // was: YJ7
  for (const screenIndex of Object.values(SCREEN_INDEX_MAP)) { // was: kdd
    if (getClientScreenNonce(screenIndex) === csn) return true;
  }
  return false;
}

/**
 * Updates the CSN-to-CTT mapping when a new screen is created.
 * [was: ph7]
 *
 * @param {string}  newCsn      [was: Q]
 * @param {object}  [cttInfo]   [was: c]
 * @param {number}  [screenIndex] [was: W]
 */
function updateCsnCttMapping(newCsn, cttInfo, screenIndex) { // was: ph7
  const map = getCsnToCttMap();
  const prevCsn = getClientScreenNonce(screenIndex); // was: g.Df(W)
  if (prevCsn) delete map[prevCsn];
  if (cttInfo) map[newCsn] = cttInfo;
}

/**
 * Returns the CTT auth info for a given CSN, or undefined.
 * [was: tZ]
 *
 * @param {string} csn [was: Q]
 * @returns {object|undefined}
 */
export function getCttAuthForCsn(csn) { // was: tZ
  return getCsnToCttMap()[csn];
}

// ===========================================================================
// Screen association + session tempdata (lines 15404-15461)
// ===========================================================================

/**
 * Associates a CSN with a screen index and root VE type, then fires a
 * foreground-heartbeat event.
 * [was: cfW]
 *
 * @param {string} csn          [was: Q]
 * @param {number} rootVeType   [was: c]
 * @param {number} [screenIndex=0] [was: W]
 * @param {object} [cttInfo]    [was: m]
 */
export function associateScreen(csn, rootVeType, screenIndex = 0, cttInfo) { // was: cfW
  if (csn === getClientScreenNonceForIndex(screenIndex) &&
      rootVeType === getConfigValue(getRootVeKey(screenIndex))) {
    return;
  }

  updateCsnCttMapping(csn, cttInfo, screenIndex);
  setClientScreenNonce(csn, screenIndex);
  setConfigValue(getRootVeKey(screenIndex), rootVeType); // was: y$(qE(W), c)

  const fireHeartbeat = () => {
    setTimeout(() => {
      if (csn) {
        logGelEvent('foregroundHeartbeatScreenAssociated', {
          clientDocumentNonce: CLIENT_DOC_NONCE, // was: QwX
          clientScreenNonce: csn,
        });
      }
    }, 0);
  };

  if ('requestAnimationFrame' in window) {
    try {
      window.requestAnimationFrame(fireHeartbeat);
    } catch (_err) {
      fireHeartbeat();
    }
  } else {
    fireHeartbeat();
  }
}

/**
 * Stores session tempdata for a navigation URL, keyed by a hashed URL.
 * [was: Ho]
 *
 * @param {string} url      [was: Q]
 * @param {object} tempData [was: c] — { csn, itct, ved, ... }
 */
export function storeSessionTempData(url, tempData) { // was: Ho
  const validDomains = getConfigValue('VALID_SESSION_TEMPDATA_DOMAINS', []);
  const currentDomain = getDomain(window.location.href); // was: g.D9
  if (currentDomain) validDomains.push(currentDomain);

  const targetDomain = getDomain(url);
  if (!arrayContains(validDomains, targetDomain) && !(targetDomain == null && startsWith(url, '/'))) { // was: g.c9, x9
    return;
  }

  const anchor = document.createElement('a');
  setAnchorHref(anchor, url);
  url = anchor.href;
  if (!url) return;

  url = normalizeUrl(url); // was: NN(Q)
  url = extractPath(url); // was: i_(Q)
  if (!url) return;

  if (!tempData.csn && (tempData.itct || tempData.ved)) {
    tempData = Object.assign({ csn: getClientScreenNonce() }, tempData);
  }

  writeTempData(url, tempData); // was: Wb_(Q, c)
}

/**
 * Writes session tempdata as a cookie keyed by a hashed URL.
 * [was: Wb_]
 *
 * @param {string} path     [was: Q]
 * @param {object} tempData [was: c]
 * @param {number} [ttl=5]  [was: W] — TTL in seconds
 */
function writeTempData(path, tempData, ttl) { // was: Wb_
  const key = hashTempDataKey(path); // was: mK_(Q)
  const serialized = tempData ? serializeParams(tempData) : ''; // was: g.EJ(c)
  ttl = ttl || 5;
  if (isCookieAvailable()) setCookie(key, serialized, ttl); // was: j$(), g.e$
}

/**
 * Hashes a path into a prefixed session-tempdata key.
 * [was: mK_]
 *
 * @param {string} path [was: Q]
 * @returns {string}
 */
function hashTempDataKey(path) { // was: mK_
  for (const stripParam of TEMPDATA_STRIP_PARAMS) { // was: KbO
    path = removeQueryParam(path, stripParam); // was: gs(Q, c)
  }
  return 'ST-' + hashCode(path).toString(36); // was: SS(Q)
}

// ===========================================================================
// Error fingerprinting (lines 15463-15475)
// ===========================================================================

/**
 * Returns true if the error originated from a Java bridge (WebView).
 * [was: T9O]
 *
 * @param {Error} error [was: Q]
 * @returns {boolean}
 */
export function isJavaException(error) { // was: T9O
  if (error.name === 'JavaException') return true;
  const stack = error.stack;
  return stack.includes('chrome://') ||
    stack.includes('-extension://') ||
    stack.includes('webkit-masked-url://');
}

/**
 * Returns true if the error has no usable stack trace (likely user-script
 * or extension noise).
 * [was: oEy]
 *
 * @param {Error} error [was: Q]
 * @returns {boolean}
 */
export function isUserScriptError(error) { // was: oEy
  if (!error.stack) return true;
  const isSingleLine = !error.stack.includes('\n');
  if ((isSingleLine && error.stack.includes('ErrorType: ')) ||
      (isSingleLine && error.stack.includes('Anonymous function (Unknown script'))) {
    return true;
  }
  if (error.stack.toLowerCase() === 'not available') return true;
  if (error.fileName === 'user-script' || error.fileName.startsWith('user-script:')) return true;
  return false;
}

// ===========================================================================
// Error sampler + protobuf varint reader (lines 15477-15597)
// ===========================================================================

/**
 * Returns the global error-sampling configuration singleton.
 * Clears and re-initialises the filter lists on first access.
 * [was: i5]
 *
 * @returns {object} — { messageSamplers: [], callbackSamplers: [] }
 *                      [was: iS, Hn]
 */
export function getErrorSampler() { // was: i5
  if (!errorSampler) {
    const sampler = errorSampler = new ErrorSamplerConfig(); // was: rfw
    sampler.messageSamplers.length = 0; // was: iS
    sampler.callbackSamplers.length = 0; // was: Hn
    applySamplerPreset(sampler, DEFAULT_SAMPLER_PRESET); // was: UKw(Q, I5x)
  }
  return errorSampler;
}

/**
 * Prepends message- and callback-based samplers from a preset into an
 * existing sampler config.
 * [was: UKw]
 *
 * @param {object} sampler [was: Q]
 * @param {object} preset  [was: c] — { messageSamplers, callbackSamplers }
 */
function applySamplerPreset(sampler, preset) { // was: UKw
  if (preset.messageSamplers) sampler.messageSamplers.unshift.apply(sampler.messageSamplers, preset.messageSamplers);
  if (preset.callbackSamplers) sampler.callbackSamplers.unshift.apply(sampler.callbackSamplers, preset.callbackSamplers);
}

/**
 * Reads a protobuf message and extracts the field-2 value (used for
 * decoding VE type from base64-encoded tracking params).
 * [was: XNy]
 *
 * @param {string} binaryStr [was: Q] — raw binary string
 * @returns {number|string|undefined} — field-2 value (varint or length-delimited)
 */
export function readField2FromProto(binaryStr) { // was: XNy
  const length = binaryStr.length;
  let offset = 0;
  const nextByte = () => binaryStr.charCodeAt(offset++);

  do {
    let tag = readVarint(nextByte); // was: yF(m)
    if (tag === Infinity) break;
    const fieldNumber = tag >> 3;
    switch (tag & 7) {
      case 0: // varint
        tag = readVarint(nextByte);
        if (fieldNumber === 2) return tag;
        break;
      case 1: // 64-bit
        if (fieldNumber === 2) return;
        offset += 8;
        break;
      case 2: // length-delimited
        tag = readVarint(nextByte);
        if (fieldNumber === 2) return binaryStr.substr(offset, tag);
        offset += tag;
        break;
      case 5: // 32-bit
        if (fieldNumber === 2) return;
        offset += 4;
        break;
      default:
        return;
    }
  } while (offset < length);
}

/**
 * Reads a varint from a byte-stream callback. Returns Infinity if the
 * varint exceeds 4 bytes (28 bits).
 * [was: yF]
 *
 * @param {Function} nextByte [was: Q] — returns the next byte
 * @returns {number}
 */
export function readVarint(nextByte) { // was: yF
  let byte = nextByte();
  let value = byte & 127;
  if (byte < 128) return value;
  byte = nextByte();
  value |= (byte & 127) << 7;
  if (byte < 128) return value;
  byte = nextByte();
  value |= (byte & 127) << 14;
  if (byte < 128) return value;
  byte = nextByte();
  return byte < 128 ? value | (byte & 127) << 21 : Infinity;
}

/**
 * Recursively serialises a nested object/array into a flat key-value map
 * for error-parameter logging, with a 500-char budget.
 * [was: Afm]
 *
 * @param {*}      value      [was: Q]
 * @param {string} keyPrefix  [was: c]
 * @param {object} output     [was: W] — accumulator map
 * @param {number} totalBytes [was: m] — current byte count
 * @returns {number} Updated byte count
 */
export function serializeErrorParams(value, keyPrefix, output, totalBytes) { // was: Afm
  if (!value) {
    output[keyPrefix] = truncateValue(value); // was: FY(Q)
    return totalBytes + output[keyPrefix].length;
  }

  if (Array.isArray(value)) {
    let bytes = totalBytes;
    for (let i = 0; i < value.length && !(value[i] && (bytes += serializeSingleParam(i, value[i], keyPrefix, output), bytes > 500)); i++) {
      // accumulate
    }
    return bytes;
  }

  if (typeof value === 'object') {
    for (const key in value) {
      if (!value[key]) continue;

      // Special handling for tracking params (base64-encoded VE)
      let paramSize = 0;
      if (typeof value[key] === 'string' &&
          (key === 'clickTrackingParams' || key === 'trackingParams')) {
        const decoded = readField2FromProto(
          atob(value[key].replace(/-/g, '+').replace(/_/g, '/')),
        ); // was: XNy(atob(...))
        paramSize = decoded
          ? serializeSingleParam(`${key}.ve`, decoded, keyPrefix, output)
          : 0;
      }

      totalBytes += paramSize;
      totalBytes += serializeSingleParam(key, value[key], keyPrefix, output);
      if (totalBytes > 500) break;
    }
    return totalBytes;
  }

  output[keyPrefix] = truncateValue(value);
  return totalBytes + output[keyPrefix].length;
}

/**
 * Serialises a single key/value pair into the flat output map.
 * [was: SG]
 *
 * @param {string|number} key      [was: Q]
 * @param {*}             value    [was: c]
 * @param {string}        prefix   [was: W]
 * @param {object}        output   [was: m]
 * @returns {number} Total chars added (key + value)
 */
function serializeSingleParam(key, value, prefix, output) { // was: SG
  const fullKey = `${prefix}.${key}`;
  const serialized = truncateValue(value); // was: FY(c)
  output[fullKey] = serialized;
  return fullKey.length + serialized.length;
}

/**
 * Converts a value to a truncated string (max 500 chars) suitable for
 * error-parameter logging.
 * [was: FY]
 *
 * @param {*} value [was: Q]
 * @returns {string}
 */
export function truncateValue(value) { // was: FY
  try {
    return (typeof value === 'string' ? value : String(JSON.stringify(value))).substr(0, 500);
  } catch (err) {
    return `unable to serialize ${typeof value} (${err.message})`;
  }
}

// ===========================================================================
// Error logging pipeline (lines 15598-15875)
// ===========================================================================

/**
 * Reports an error via the standard GEL pipeline.
 * [was: EE]
 *
 * @param {Error} error [was: Q]
 */
export function reportErrorToGel(error) { // was: EE
  reportErrorWithLevel(error); // was: g.Zf(Q)
}

/**
 * Reports a warning via GEL.
 * [was: g.Ty]
 *
 * @param {Error} error [was: Q]
 */
export function reportWarning(error) { // was: g.Ty
  reportErrorWithLevel(error, 'WARNING');
}

/**
 * Reports an error/warning with client name/version metadata.
 * [was: g.Zf]
 *
 * @param {Error}  error          [was: Q]
 * @param {string} [level='ERROR'] [was: c]
 */
export function reportErrorWithLevel(error, level = 'ERROR') { // was: g.Zf
  const metadata = {};
  metadata.name = getConfigValue('INNERTUBE_CONTEXT_CLIENT_NAME', 1);
  metadata.version = getConfigValue('INNERTUBE_CONTEXT_CLIENT_VERSION');
  processAndDispatchError(error, metadata, level); // was: e6X
}

/**
 * Core error-processing function. Builds the full error report including
 * stack trace, params, sample weight, and dispatches to GEL + /error_204.
 * [was: e6X]
 *
 * @param {Error}  error     [was: Q]
 * @param {object} metadata  [was: c] — { name, version, ... }
 * @param {string} [level='ERROR'] [was: W]
 */
export function processAndDispatchError(error, metadata, level = 'ERROR') { // was: e6X
  if (!error) return;
  if (error.hasOwnProperty('level') && error.level) level = error.level;

  // Console logging (dev/staging environments)
  if (getFlag('console_log_js_exceptions') ||
      ['test', 'dev', 'autopush', 'staging'].includes(getConfigValue('SERVER_VERSION'))) {
    const lines = [];
    lines.push(`Name: ${error.name}`);
    lines.push(`Message: ${error.message}`);
    if (error.hasOwnProperty('params')) lines.push(`Error Params: ${JSON.stringify(error.params)}`);
    if (error.hasOwnProperty('args')) lines.push(`Error args: ${JSON.stringify(error.args)}`);
    lines.push(`File name: ${error.fileName}`);
    lines.push(`Stacktrace: ${error.stack}`);
    window.console.log(lines.join('\n'), error);
  }

  if (reportedErrorCount >= 5) return; // was: VN3

  // Gather extra context providers
  const extraContexts = [];
  for (const provider of contextProviders) { // was: B97
    try { if (provider()) extraContexts.push(provider()); } catch (_err) { /* ignore */ }
  }
  const allContexts = [...staticContextParams, ...extraContexts]; // was: xKR

  // Normalize error
  const normalizedError = normalizeError(error); // was: w3X(Q)
  const message = normalizedError.message || 'Unknown Error';
  const name = normalizedError.name || 'UnknownError';
  let stack = normalizedError.stack || error.originalStack || 'Not available'; // was: Q.O

  // Strip leading "ErrorName: message" from stack
  if (stack.startsWith(`${name}: ${message}`)) {
    const stackLines = stack.split('\n');
    stackLines.shift();
    stack = stackLines.join('\n');
  }

  const lineNumber = normalizedError.lineNumber || 'Not available';
  const fileName = normalizedError.fileName || 'Not available';

  let paramBytes = 0;

  // Serialize error args/params
  if (error.hasOwnProperty('args') && error.args?.length) {
    for (let i = 0; i < error.args.length; i++) {
      paramBytes = serializeErrorParams(error.args[i], `params.${i}`, metadata, paramBytes);
      if (paramBytes >= 500) break;
    }
  } else if (error.hasOwnProperty('params') && error.params) {
    const params = error.params;
    if (typeof error.params === 'object') {
      for (const key in params) {
        if (!params[key]) continue;
        const fullKey = `params.${key}`;
        const val = truncateValue(params[key]);
        metadata[fullKey] = val;
        paramBytes += fullKey.length + val.length;
        if (paramBytes > 500) break;
      }
    } else {
      metadata.params = truncateValue(params);
    }
  }

  // Extra context
  if (allContexts.length) {
    for (let i = 0; i < allContexts.length; i++) {
      paramBytes = serializeErrorParams(allContexts[i], `params.context.${i}`, metadata, paramBytes);
      if (paramBytes >= 500) break;
    }
  }

  // Vendor info
  if (navigator.vendor && !metadata.hasOwnProperty('vendor')) {
    metadata['device.vendor'] = navigator.vendor;
  }

  // Build report object
  const report = {
    message,
    name,
    lineNumber,
    fileName,
    stack,
    params: metadata,
    sampleWeight: 1,
  };

  // Column number
  const colNum = Number(error.columnNumber);
  if (!isNaN(colNum)) report.lineNumber = `${report.lineNumber}:${colNum}`;

  // Determine sample weight
  if (error.level === 'IGNORED') {
    report.sampleWeight = 0;
  } else {
    const sampler = getErrorSampler();
    let weight = 1;
    for (const msgSampler of sampler.messageSamplers) { // was: iS
      if (report.message && report.message.match(msgSampler.pattern)) { // was: J2
        weight = msgSampler.weight;
        break;
      }
    }
    if (weight === 1) {
      for (const cbSampler of sampler.callbackSamplers) { // was: Hn
        if (cbSampler.callback(report)) {
          weight = cbSampler.weight;
          break;
        }
      }
    }
    report.sampleWeight = weight;
  }

  // Apply error normalisers
  for (const normaliser of errorNormalisers) { // was: qFX
    if (!normaliser.patterns[report.name]) continue;
    const patterns = normaliser.patterns[report.name];
    for (const pattern of patterns) {
      const match = report.message.match(pattern.regex); // was: EE
      if (!match) continue;
      report.params['params.error.original'] = match[0];
      const groups = pattern.groups;
      const groupMap = {};
      for (let i = 0; i < groups.length; i++) {
        groupMap[groups[i]] = match[i + 1];
        report.params[`params.error.${groups[i]}`] = match[i + 1];
      }
      report.message = normaliser.format(groupMap); // was: ql
      break;
    }
  }

  // Add diagnostic metadata
  report.params = report.params || {};
  const s = getErrorSampler();
  report.params['params.errorServiceSignature'] = `msg=${s.messageSamplers.length}&cb=${s.callbackSamplers.length}`;
  report.params['params.serviceWorker'] = 'false';
  if (globalWindow.document?.querySelectorAll) {
    report.params['params.fscripts'] = String(document.querySelectorAll('script:not([nonce])').length);
  }
  if ((new ErrorSamplerConfig(SENTINEL_VALUE, 'sample')).constructor !== ErrorSamplerConfig) { // was: sE(dn, "sample")
    report.params['params.fconst'] = 'true';
  }

  // External error callback
  if (window.yterr && typeof window.yterr === 'function') window.yterr(report);

  // Dispatch (skip duplicates and zero-weight)
  if (report.sampleWeight !== 0 && !reportedMessages.has(report.message)) { // was: nEO
    dispatchErrorReport(report, level); // was: DKn
  }
}

/**
 * Final dispatch of an error report to GEL (clientError) and the legacy
 * /error_204 endpoint.
 * [was: DKn]
 *
 * @param {object} report  [was: Q]
 * @param {string} [level='ERROR'] [was: c]
 */
function dispatchErrorReport(report, level = 'ERROR') { // was: DKn
  // GEL error event
  if (level === 'ERROR') {
    errorEventBus.publish('handleError', report); // was: La
    if (getFlag('record_app_crashed_web') && crashReportCount === 0 && report.sampleWeight === 1) { // was: tNn
      crashReportCount++;
      const crashPayload = { appCrashType: 'APP_CRASH_TYPE_BREAKPAD' };
      if (!getFlag('report_client_error_with_app_crash_ks')) {
        crashPayload.systemHealth = {
          crashData: { clientError: { logMessage: { message: report.message } } },
        };
      }
      logGelEvent('appCrashed', crashPayload);
    }
    totalErrorCount++; // was: H47
  } else if (level === 'WARNING') {
    errorEventBus.publish('handleWarning', report);
  }

  // GEL clientError route
  if (getFlag('kevlar_gel_error_routing')) {
    let gelPayload = {};
    // Check non-standard environments
    let isNonStandard = false;
    for (const envPattern of NON_STANDARD_ENVS) { // was: N9W
      if (isInEnvironment(envPattern.toLowerCase())) { // was: g.Hn
        isNonStandard = true;
        break;
      }
    }

    if (isNonStandard) {
      gelPayload = undefined;
    } else {
      const stackInfo = { stackTrace: report.stack };
      if (report.fileName) stackInfo.filename = report.fileName;
      const lineNumberParts = report.lineNumber?.split?.(':') || [];
      if (lineNumberParts.length === 1 && !isNaN(Number(lineNumberParts[0]))) {
        stackInfo.lineNumber = Number(lineNumberParts[0]);
      } else if (lineNumberParts.length === 2 &&
                 !isNaN(Number(lineNumberParts[0])) && !isNaN(Number(lineNumberParts[1]))) {
        stackInfo.lineNumber = Number(lineNumberParts[0]);
        stackInfo.columnNumber = Number(lineNumberParts[1]);
      }

      const logMessage = {
        level: 'ERROR_LEVEL_UNKNOWN',
        message: report.message,
        errorClassName: report.name,
        sampleWeight: report.sampleWeight,
      };
      if (level === 'ERROR') logMessage.level = 'ERROR_LEVEL_ERROR';
      else if (level === 'WARNING') logMessage.level = 'ERROR_LEVEL_WARNNING'; // [sic — matches source typo]

      gelPayload.pageUrl = window.location.href;
      gelPayload.kvPairs = [];
      const fexpIds = getConfigValue('FEXP_EXPERIMENTS');
      if (fexpIds) gelPayload.experimentIds = fexpIds;

      const stp = getConfigValue('LATEST_ECATCHER_SERVICE_TRACKING_PARAMS');
      if (!getDisableFlag('web_disable_gel_stp_ecatcher_killswitch') && stp) {
        for (const key of Object.keys(stp)) {
          gelPayload.kvPairs.push({ key, value: String(stp[key]) });
        }
      }

      if (report.params) {
        for (const key of Object.keys(report.params)) {
          gelPayload.kvPairs.push({ key: `client.${key}`, value: String(report.params[key]) });
        }
      }

      const serverName = getConfigValue('SERVER_NAME');
      const serverVersion = getConfigValue('SERVER_VERSION');
      if (serverName && serverVersion) {
        gelPayload.kvPairs.push({ key: 'server.name', value: serverName });
        gelPayload.kvPairs.push({ key: 'server.version', value: serverVersion });
      }
      const playerVersion = getConfigValue('PLAYER_CLIENT_VERSION');
      if (playerVersion) gelPayload.kvPairs.push({ key: 'client.player.version', value: playerVersion });

      gelPayload = {
        errorMetadata: gelPayload,
        stackTrace: { isObfuscated: true, browserStackInfo: stackInfo },
        logMessage,
      };
    }

    if (gelPayload) {
      logGelEvent('clientError', gelPayload);
      if (level === 'ERROR' || getFlag('errors_flush_gel_always_killswitch')) {
        if (getFlag('web_fp_via_jspb')) {
          const deferred = deferredJspbEvents; // was: i4d
          deferredJspbEvents = [];
          if (deferred) {
            for (const item of deferred) {
              dispatchGelPayload(item.payloadName, item.payload, defaultGelClientCtor, item.options);
            }
          }
          flushLogsForSection(undefined, true);
          if (!getFlag('web_fp_via_jspb_and_json')) return;
        }
        flushLogsForSection();
      }
    }
  }

  // Legacy /error_204 endpoint
  if (!getFlag('suppress_error_204_logging')) {
    const params = report.params || {};
    const errorReport = {
      urlParams: {
        a: 'logerror',
        t: 'jserror',
        type: report.name,
        msg: report.message.substr(0, 250),
        line: report.lineNumber,
        level,
        'client.name': params.name,
      },
      postParams: {
        url: getConfigValue('PAGE_NAME', window.location.href),
        file: report.fileName,
      },
      method: 'POST',
    };
    if (params.version) errorReport['client.version'] = params.version;

    if (errorReport.postParams) {
      if (report.stack) errorReport.postParams.stack = report.stack;
      for (const key of Object.keys(params)) {
        errorReport.postParams[`client.${key}`] = params[key];
      }
      const stp = getConfigValue('LATEST_ECATCHER_SERVICE_TRACKING_PARAMS');
      if (stp) {
        for (const key of Object.keys(stp)) errorReport.postParams[key] = stp[key];
      }
      const lava = getConfigValue('LAVA_VERSION');
      if (lava) errorReport.postParams['lava.version'] = lava;
      const sName = getConfigValue('SERVER_NAME');
      const sVer = getConfigValue('SERVER_VERSION');
      if (sName && sVer) {
        errorReport.postParams['server.name'] = sName;
        errorReport.postParams['server.version'] = sVer;
      }
      const pVer = getConfigValue('PLAYER_CLIENT_VERSION');
      if (pVer) errorReport.postParams['client.player.version'] = pVer;
    }

    sendXhrRequest(
      `${getConfigValue('ECATCHER_REPORT_HOST', '')}/error_204`,
      errorReport,
    ); // was: g.Wn(...)
  }

  try {
    reportedMessages.add(report.message); // was: nEO.add
  } catch (_err) { /* ignore */ }
  reportedErrorCount++;
}

// ===========================================================================
// Command unwrapping / error args (lines 15877-15911)
// ===========================================================================

/**
 * Appends additional arguments to an error's args array.
 * [was: wn]
 *
 * @param {Error} error  [was: Q]
 * @param {...*}  args   [was: ...c]
 */
export function appendErrorArgs(error, ...args) { // was: wn
  if (!error.args) error.args = [];
  if (Array.isArray(error.args)) error.args.push(...args);
}

/**
 * Extracts a `commandExecutorCommand` (or similar wrapped command) from
 * a response action. Handles multiple wrapper types and deduplicates by
 * identifier.
 * [was: gn]
 *
 * @param {object} action [was: Q]
 * @returns {object|undefined} The unwrapped command
 */
export function unwrapCommand(action) { // was: gn
  let command = getProperty(action, EXECUTOR_COMMAND_KEY); // was: g.l(Q, b5)
  if (command) return command;

  command = getProperty(action, CONDITIONAL_COMMAND_KEY); // was: yf7
  if (command?.commands) return wrapAsExecutorCommand(command.commands); // was: SFR

  command = getProperty(action, SEQUENTIAL_COMMAND_KEY); // was: Fb7
  if (command?.commands) return wrapAsExecutorCommand(command.commands);

  const deduped = getProperty(action, DEDUPED_COMMAND_KEY); // was: Z4w
  if (deduped?.identifier && deduped?.command) {
    if (!processedCommandIds) processedCommandIds = []; // was: jG
    if (!processedCommandIds.includes(deduped.identifier)) {
      processedCommandIds.push(deduped.identifier);
      return getProperty(deduped.command, EXECUTOR_COMMAND_KEY);
    }
  }
}

/**
 * Wraps an array of unwrapped commands into a `commandExecutorCommand`.
 * [was: SFR]
 *
 * @param {object[]} commands [was: Q]
 * @returns {object|undefined}
 */
function wrapAsExecutorCommand(commands) { // was: SFR
  if (commands.length === 0) return;
  const unwrapped = [];
  for (const cmd of commands) {
    const inner = unwrapCommand(cmd);
    if (inner) unwrapped.push(inner);
  }
  return { commandExecutorCommand: { commands: unwrapped } };
}

/**
 * Sets or deletes a named property on an object based on whether the value
 * is defined.
 * [was: g.OE]
 *
 * @param {object} target [was: Q]
 * @param {object} key    [was: c] — { name: string }
 * @param {*}      value  [was: W]
 */
export function setOrDeleteProperty(target, key, value) { // was: g.OE
  if (value === undefined) {
    delete target[key.name];
  } else {
    target[key.name] = value;
  }
}

// ===========================================================================
// Screen creation, VE attach, hash utility (lines 15913-15999)
// ===========================================================================

/**
 * Internal proto helper — delegates to a proto-builder method.
 * [was: EE3]
 *
 * @param {*} value [was: Q]
 * @returns {*}
 */
// var EE3 = function(Q) { return T0[x[13]](this, 2, 8720, Q); };

/**
 * Computes a numeric hash of a string (modulo 1e5), using a polynomial
 * rolling hash with base 31 and an intermediate modulo of 0x800000000000.
 * [was: swX]
 *
 * @param {string} str [was: Q]
 * @returns {number} 0..99999
 */
export function computeStringHash(str) { // was: swX
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = hash * 31 + str.charCodeAt(i);
    if (i < str.length - 1) hash %= 0x800000000000;
  }
  return hash % 1e5;
}

/**
 * Creates a new screen (CSN), publishes the screenCreated event, and
 * clears VE caches.
 * [was: wNx]
 *
 * @param {Function} [clientCtor]          [was: Q]
 * @param {number}   veType                [was: c]
 * @param {object}   [parentElement]       [was: W]
 * @param {string}   [cloneCsn]           [was: m]
 * @param {object}   [cttAuthInfo]        [was: K]
 * @param {object}   [youtubeData]        [was: T]
 * @param {string}   [gestureType]        [was: r]
 * @param {object}   [expectations]       [was: U]
 * @param {string}   [automatedSource]    [was: I]
 * @returns {string} The new CSN
 */
export function createScreen(clientCtor, veType, parentElement, cloneCsn, cttAuthInfo, youtubeData, gestureType, expectations, automatedSource) { // was: wNx
  const csn = generateClientScreenNonce(); // was: dK7()
  const pageVe = new VisualElement({
    veType,
    youtubeData,
    jspbYoutubeData: undefined,
  });

  const options = buildEventOptions({ automatedLogEventSource: automatedSource }, csn); // was: fa
  if (cttAuthInfo) options.cttAuthInfo = cttAuthInfo;

  const payload = {
    csn,
    pageVe: pageVe.getAsJson(),
  };

  if (getFlag('expectation_logging') && expectations?.screenCreatedLoggingExpectations) {
    payload.screenCreatedLoggingExpectations = expectations.screenCreatedLoggingExpectations;
  }

  if (parentElement?.visualElement) {
    payload.implicitGesture = {
      parentCsn: parentElement.clientScreenNonce,
      gesturedVe: parentElement.visualElement.getAsJson(),
    };
    if (gestureType) payload.implicitGesture.gestureType = gestureType;
  } else if (parentElement) {
    reportWarning(new ExtendedError('newScreen() parent element does not have a VE - rootVe', veType));
  }

  if (cloneCsn) payload.cloneCsn = cloneCsn;

  if (clientCtor) {
    dispatchGelPayload('screenCreated', payload, clientCtor, options);
  } else {
    logGelEvent('screenCreated', payload, options);
  }

  pubsub2Publish(screenCreatedTopic, new ScreenCreatedData(csn)); // was: Lq(vCm, new LbO(X))
  pendingAttachCache.clear(); // was: vo
  shownElements.clear(); // was: av
  attachedElements.clear(); // was: Gi
  return csn;
}

/**
 * Attaches a single child VE to a parent VE (convenience wrapper).
 * [was: g.Po]
 *
 * @param {Function} [clientCtor]   [was: Q]
 * @param {string}   csn            [was: c]
 * @param {VisualElement} parentVe  [was: W]
 * @param {VisualElement} childVe   [was: m]
 * @param {boolean}  [force=false]  [was: K]
 * @param {object}   [options={}]   [was: T]
 */
export function attachVisualElement(clientCtor, csn, parentVe, childVe, force = false, options = {}) { // was: g.Po
  attachVisualElements(clientCtor, csn, parentVe, [childVe], force, options); // was: g.$0
}

/**
 * Attaches one or more child VEs to a parent VE, logging a
 * `visualElementAttached` event. Respects the
 * `no_client_ve_attach_unless_shown` experiment for deferred-attach logic.
 * [was: g.$0]
 *
 * @param {Function}       [clientCtor]   [was: Q]
 * @param {string}         csn            [was: c]
 * @param {VisualElement}  parentVe       [was: W]
 * @param {VisualElement[]} childVes      [was: m]
 * @param {boolean}        [force=false]  [was: K]
 * @param {object}         [options={}]   [was: T]
 */
export function attachVisualElements(clientCtor, csn, parentVe, childVes, force = false, options = {}) { // was: g.$0
  Object.assign(options, buildEventOptions({
    cttAuthInfo: getCttAuthForCsn(csn) || undefined,
  }, csn));

  for (const childVe of childVes) {
    const json = childVe.getAsJson();
    if (isEmpty(json) || (!json.trackingParams && !json.veType)) {
      reportWarning(Error('Child VE logged with no data'));
    }

    if (getFlag('no_client_ve_attach_unless_shown')) {
      const childKey = computeVeKey(childVe, csn); // was: l5
      if (json.veType && !shownElements.has(childKey) && !attachedElements.has(childKey) && !force) {
        if (!getFlag('il_attach_cache_limit') || pendingAttachCache.size < 1000) {
          pendingAttachCache.set(childKey, [clientCtor, csn, parentVe, childVe]);
          return;
        }
        if (getFlag('il_attach_cache_limit') && pendingAttachCache.size > 1000) {
          reportWarning(new ExtendedError('IL Attach cache exceeded limit'));
        }
      }
      const parentKey = computeVeKey(parentVe, csn);
      if (pendingAttachCache.has(parentKey)) {
        flushPendingAttach(parentVe, csn); // was: u5
      } else {
        attachedElements.set(parentKey, true);
      }
    }
  }

  // Filter to only children that are actually newly associated with this CSN
  const newChildren = childVes.filter((ve) => {
    if (ve.csn !== csn) {
      ve.csn = csn;
      return true;
    }
    return false;
  });

  const payload = {
    csn,
    parentVe: parentVe.getAsJson(),
    childVes: newChildren.map((ve) => ve.getAsJson()), // was: g.hy
  };

  if (csn === 'UNDEFINED_CSN') {
    queueDeferredEvent('visualElementAttached', options, payload); // was: hZ
  } else if (clientCtor) {
    dispatchGelPayload('visualElementAttached', payload, clientCtor, options);
  } else {
    logGelEvent('visualElementAttached', payload, options);
  }
}

// ---------------------------------------------------------------------------
// URL decoration and safe open
// ---------------------------------------------------------------------------

/**
 * Decorate URL with session tracking data. [was: g.SE]
 */
export function decorateUrlWithSessionData(url, params = {}, skipPing = false) {
  // Adds tracking params to URL
}

/**
 * Open URL in new window with tracking. [was: g.Fw]
 */
export function safeOpenUrl(url, attributionSrc, target, features, useAttributionSrc) {
  // Opens URL with session decoration
}
