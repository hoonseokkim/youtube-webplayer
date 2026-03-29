/**
 * GEL (Google Event Logging) — event construction and dispatch.
 *
 * Source: base.js lines ~14990–15280
 *
 * Responsible for assembling GEL batch payloads, populating device context
 * fields, handling playlist/mix credential-transfer tokens, managing
 * EVENT_ID counters, and routing the final request through the networkless
 * transport layer.
 */

// ---------------------------------------------------------------------------
// Imports (hypothetical — adjust paths to match your project layout)
// ---------------------------------------------------------------------------
import { getFlag as P, getSetting as v, setSetting } from '../core/config.js';
import { now as h } from '../core/timing.js';
import { getVideoId } from '../player/time-tracking.js'; // was: MY()
import { setRepeatedField } from '../proto/wire-format.js';
import { getLastActivityMs } from './gel-core.js';

// ---------------------------------------------------------------------------
// Device context field mapping
// ---------------------------------------------------------------------------

/**
 * Populate device-context fields on a GEL client-info proto [was: inline in
 * the big batch-building loop, ~line 15011-15014].
 *
 * Each DEVICE key maps to a specific proto field number:
 *
 * | Key        | Field | Meaning               |
 * |------------|-------|-----------------------|
 * | cbrand     | 12    | Client brand           |
 * | cmodel     | 13    | Client model           |
 * | cbr        | 87    | Client browser name    |
 * | cbrver     | 88    | Client browser version |
 * | cos        | 18    | Client OS name         |
 * | cosver     | 19    | Client OS version      |
 * | cplatform  | 42    | Client platform (enum) |
 *
 * @param {object} clientInfo  [was: B] — mutable proto object
 * @param {string} deviceJson  [was: n] — serialized DEVICE setting
 */
export function populateDeviceContext(clientInfo, deviceJson) { // was: inline block
  const entries = parseDeviceString(deviceJson); // was: bk(n)
  for (const [key, value] of Object.entries(entries)) {
    switch (key) {
      case 'cbrand':
        setStringField(clientInfo, 12, value); // was: DZ(e, 12, S)
        break;
      case 'cmodel':
        setStringField(clientInfo, 13, value);
        break;
      case 'cbr':
        setStringField(clientInfo, 87, value);
        break;
      case 'cbrver':
        setStringField(clientInfo, 88, value);
        break;
      case 'cos':
        setStringField(clientInfo, 18, value);
        break;
      case 'cosver':
        setStringField(clientInfo, 19, value);
        break;
      case 'cplatform':
        setEnumField(clientInfo, 42, parsePlatformEnum(value)); // was: H_(e, 42, eB7(S))
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Playlist / Mix credential-transfer token  (CTT)
// ---------------------------------------------------------------------------

/**
 * Attach a credential-transfer token (CTT) to the GEL request when the
 * payload references a playlist or mix [was: block at ~15017-15033].
 *
 * The token object (`jkK`) carries:
 *   - field 1: scope enum (1 = MY, 2 = playlist)
 *   - token string via `setToken()`
 *
 * @param {object} batchRequest  [was: I] — top-level batch proto
 * @param {object} tokenMap      [was: k1] — maps auth keys to playlist info
 * @param {string} authKey       [was: X] — the key to look up
 */
export function attachPlaylistCredentialToken(batchRequest, tokenMap, authKey) { // was: inline block
  const playlistInfo = tokenMap[authKey]; // was: k1[X]
  if (!playlistInfo) return;

  let scope; // was: V
  if (playlistInfo.getVideoId) { // was: B.MY()
    scope = 1;
  } else if (playlistInfo.getPlaylistId()) {
    scope = 2;
  } else {
    return;
  }

  setRepeatedField(batchRequest, 4, playlistInfo); // was: ry(I, n8x, 4, B)

  const clientInfo = getOrCreateSub(batchRequest, 1) || createClientInfo(); // was: W_(I, m9, 1) || new m9
  const userContext = getOrCreateSub(clientInfo, 3) || createUserContext(); // was: W_(B, Ka, 3) || new Ka

  const authToken = new AuthToken(); // was: new jkK
  authToken.setToken(authKey); // was: n.setToken(X)
  setEnumField(authToken, 1, scope); // was: H_(n, 1, V)
  appendRepeatedMessage(userContext, 12, authToken); // was: Xg(e, 12, jkK, n)
  setRepeatedField(clientInfo, 3, userContext); // was: ry(B, Ka, 3, e)

  delete tokenMap[authKey]; // was: delete k1[X]
}

// ---------------------------------------------------------------------------
// EVENT_ID / batch client counter
// ---------------------------------------------------------------------------

/**
 * Increment (and wrap) the per-page batch client counter used alongside
 * EVENT_ID to deduplicate GEL batches [was: g8d, line 15147].
 *
 * Counter lives in the global config key `BATCH_CLIENT_COUNTER`.
 * Range: 1–65535 (wraps around).  Seeded with a random value on first call.
 *
 * @returns {number} The new counter value.
 */
export function nextBatchClientCounter() { // was: g8d
  let counter = v('BATCH_CLIENT_COUNTER') || 0;
  if (!counter) {
    counter = Math.floor(Math.random() * 65535 / 2);
  }
  counter++;
  if (counter > 65535) {
    counter = 1;
  }
  setSetting('BATCH_CLIENT_COUNTER', counter); // was: y$("BATCH_CLIENT_COUNTER", Q)
  return counter;
}

/**
 * Attach the serialized client-event-id to a GEL batch request [was: block
 * at ~15037-15041].
 *
 * Uses `EVENT_ID` (a page-scoped unique id) together with the
 * monotonically-increasing counter from {@link nextBatchClientCounter}.
 *
 * Proto wrapper: `Ojy`
 *   - field 1: EVENT_ID string
 *   - field 2: counter (int)
 *
 * @param {object} batchRequest  [was: I]
 * @param {boolean} skipEventId  [was: X] — true when key is "visitorOnlyApprovedKey"
 */
export function attachEventId(batchRequest, skipEventId) { // was: inline block
  if (skipEventId) return;

  const eventId = v('EVENT_ID'); // was: g.v("EVENT_ID")
  if (!eventId) return;

  const counter = nextBatchClientCounter(); // was: g8d()
  const proto = new EventIdProto(); // was: new Ojy
  setStringField(proto, 1, eventId); // was: DZ(e, 1, V)
  setIntField(proto, 2, counter); // was: nV(e, 2, B)
  setRepeatedField(batchRequest, 5, proto); // was: ry(I, Ojy, 5, e)
}

// ---------------------------------------------------------------------------
// Credential-transfer token for JSON payloads
// ---------------------------------------------------------------------------

/**
 * Populate credential-transfer-token fields on a JSON-format GEL payload
 * [was: Fg7, line 15156].
 *
 * @param {object} payload    [was: Q] — the top-level JSON payload
 * @param {string} token      [was: c] — the CTT string
 * @param {object} targetId   [was: W] — `{ videoId }` or `{ playlistId }`
 */
export function setCredentialTransferToken(payload, token, targetId) { // was: Fg7
  let scope; // was: m
  if (targetId.videoId) {
    scope = 'VIDEO';
  } else if (targetId.playlistId) {
    scope = 'PLAYLIST';
  } else {
    return;
  }

  payload.credentialTransferTokenTargetId = targetId;
  payload.context = payload.context || {};
  payload.context.user = payload.context.user || {};
  payload.context.user.credentialTransferTokens = [{
    token,
    scope,
  }];
}

// ---------------------------------------------------------------------------
// JSON-format event-id helper
// ---------------------------------------------------------------------------

/**
 * Attach `serializedClientEventId` to a JSON-format GEL payload
 * [was: ZjK, line 15137].
 *
 * @param {object} payload             [was: Q]
 * @param {number} requestTimeMs       [was: c]
 * @param {boolean} skipEventId        [was: W]
 */
export function attachJsonEventId(payload, requestTimeMs, skipEventId) { // was: ZjK
  if (!useRequestTimeMsHeader()) { // was: Ti()
    payload.requestTimeMs = String(requestTimeMs);
  }
  if (P('unsplit_gel_payloads_in_logs')) {
    payload.unsplitGelPayloadsInLogs = true; // was: !0
  }
  if (!skipEventId) {
    const eventId = v('EVENT_ID');
    if (eventId) {
      const counter = nextBatchClientCounter();
      payload.serializedClientEventId = {
        serializedEventId: eventId,
        clientCounter: String(counter),
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Transport helpers
// ---------------------------------------------------------------------------

/**
 * Whether to use the `X-Goog-Request-Time` header instead of embedding
 * `requestTimeMs` in the JSON body [was: Ti, line 15198].
 *
 * @returns {boolean}
 */
export function useRequestTimeMsHeader() { // was: Ti
  return P('use_request_time_ms_header') || P('lr_use_request_time_ms_header');
}

/**
 * Resolve the GEL endpoint path, optionally routing through the VSS
 * video-stats endpoint [was: SJ3, line 15276].
 *
 * @param {boolean} [useVSS=false]  [was: Q]
 * @returns {string}
 */
export function resolveGelEndpoint(useVSS = false) { // was: SJ3
  return useVSS && P('vss_through_gel_video_stats')
    ? 'video_stats'
    : 'log_event';
}

/**
 * Build the base request-options object used by `Kgw` [was: co, line 15119].
 *
 * @param {object}  networklessOptions  [was: Q]
 * @param {boolean} dangerousLogToVisitorSession [was: c]
 * @param {Function} onSuccess          [was: W]
 * @param {Function} onError            [was: m]
 * @param {boolean}  isIsolated         [was: K]
 * @returns {object}
 */
export function buildRequestOptions(
  networklessOptions,
  dangerousLogToVisitorSession,
  onSuccess,
  onError,
  isIsolated,
) { // was: co
  const opts = {
    retry: true, // was: !0
    onSuccess,
    onError,
    networklessOptions,
    dangerousLogToVisitorSession,
    ReI: !!isIsolated,
    headers: {},
    postBodyFormat: '',
    postBody: '',
    compress: P('compress_gel') || P('compress_gel_lr'),
  };

  if (useRequestTimeMsHeader()) {
    opts.headers['X-Goog-Request-Time'] = JSON.stringify(Math.round(h()));
  }

  return opts;
}

/**
 * Override `writeThenSend` when the `always_send_and_write` experiment is
 * active [was: E87, line 15115].
 *
 * @param {object} options  [was: Q] — networkless options
 */
export function maybeDisableWriteThenSend(options) { // was: E87
  if (P('always_send_and_write')) {
    options.writeThenSend = false; // was: !1
  }
}

// ---------------------------------------------------------------------------
// Delayed-event tier mapping
// ---------------------------------------------------------------------------

/**
 * Map a delayed-event tier enum string to its numeric priority
 * [was: UNK, line 15255].
 *
 * @param {string} tier
 * @returns {number}
 */
export function delayedEventTierToNumber(tier) { // was: UNK
  switch (tier) {
    case 'DELAYED_EVENT_TIER_UNSPECIFIED': return 0;
    case 'DELAYED_EVENT_TIER_DEFAULT':     return 100;
    case 'DELAYED_EVENT_TIER_DISPATCH_TO_EMPTY': return 200;
    case 'DELAYED_EVENT_TIER_FAST':        return 300;
    case 'DELAYED_EVENT_TIER_IMMEDIATE':   return 400;
    default:                               return 200;
  }
}

/**
 * Check whether a payload name is the internal debugging event
 * [was: lE, line 15272].
 *
 * @param {string} name  [was: Q]
 * @returns {boolean}
 */
export function isDebuggingEvent(name) { // was: lE
  return name === 'gelDebuggingEvent';
}

// ---------------------------------------------------------------------------
// Core dispatch: XY
// ---------------------------------------------------------------------------

/**
 * Build and dispatch a single GEL event payload (JSON path)
 * [was: XY, line 15280].
 *
 * @param {string}  payloadName  [was: Q] — e.g. "screenCreated"
 * @param {object}  payloadData  [was: c]
 * @param {*}       transport    [was: W] — transport client ref
 * @param {object}  [options={}] [was: m]
 */
export function dispatchGelEvent(payloadName, payloadData, transport, options = {}) { // was: XY
  const envelope = {};
  const timestamp = Math.round(options.timestamp || h());
  envelope.eventTimeMs = timestamp < Number.MAX_SAFE_INTEGER ? timestamp : 0;
  envelope[payloadName] = payloadData;

  const lastActivity = getLastActivityMs(); // was: YW()
  envelope.context = {
    lastActivityMs: String(
      options.timestamp || !isFinite(lastActivity) ? -1 : lastActivity,
    ),
  };

  // Sequence info
  if (options.sequenceGroup && !P('web_gel_sequence_info_killswitch')) {
    const group = options.sequenceGroup;
    const seqInfo = {
      index: nextSequenceIndex(group), // was: l9X(c)
      groupKey: group,
    };
    envelope.context.sequence = seqInfo;
    if (options.endOfSequence) {
      delete sequenceCounters[options.sequenceGroup]; // was: delete Iv[m.sequenceGroup]
    }
  }

  if (P('web_tag_automated_log_events')) {
    envelope.context.automatedLogEventSource = options.automatedLogEventSource;
  }

  const submitFn = options.sendIsolatedPayload
    ? submitIsolated   // was: I9x
    : submitBatched;   // was: AF3

  submitFn({
    endpoint: 'log_event',
    payload: envelope,
    cttAuthInfo: options.cttAuthInfo,
    dangerousLogToVisitorSession: options.dangerousLogToVisitorSession,
  }, transport);
}

// ---------------------------------------------------------------------------
// Convenience dispatcher: g.eG
// ---------------------------------------------------------------------------

/**
 * High-level "log an event" entry point — resolves the default transport
 * and delegates to {@link dispatchGelEvent} [was: g.eG, line 15316].
 *
 * @param {string} payloadName  [was: Q]
 * @param {object} payloadData  [was: c]
 * @param {object} [options={}] [was: W]
 */
export function logGelEvent(payloadName, payloadData, options = {}) { // was: g.eG
  let transport = defaultTransport; // was: g.AZ
  if (v('ytLoggingEventsDefaultDisabled', false) && transport === defaultTransport) {
    transport = null;
  }
  dispatchGelEvent(payloadName, payloadData, transport, options);
}

// ---------------------------------------------------------------------------
// Sequence index tracker
// ---------------------------------------------------------------------------

/** @type {Record<string, number>} [was: Iv] */
const sequenceCounters = {};

/**
 * Return the next 0-based index for `groupKey`, creating the entry if needed
 * [was: l9X, line 15311].
 *
 * @param {string} groupKey  [was: Q]
 * @returns {number}
 */
function nextSequenceIndex(groupKey) { // was: l9X
  sequenceCounters[groupKey] =
    groupKey in sequenceCounters ? sequenceCounters[groupKey] + 1 : 0;
  return sequenceCounters[groupKey];
}

// ---------------------------------------------------------------------------
// Scraping / test instrumentation
// ---------------------------------------------------------------------------

/**
 * Capture payloads for test scraping when the IL-payload-scraping experiment
 * is enabled [was: Gf, line 15173].
 *
 * Visual-element event names scraped:
 *   visualElementShown, visualElementHidden, visualElementAttached,
 *   screenCreated, visualElementGestured, visualElementStateChanged
 *
 * @param {object|null} clientEvent  [was: Q]
 * @param {object|null} rawEvent     [was: c]
 */
export function maybeScrapePayload(clientEvent, rawEvent) { // was: Gf
  let enabled = getGlobal('yt.logging.transport.enableScrapingForTest'); // was: g.DR(...)
  const param = getExperimentParam('il_payload_scraping'); // was: k3(...)
  const shouldEnable = (param !== undefined ? String(param) : '') === 'enable_il_payload_scraping';

  if (!enabled) {
    if (shouldEnable) {
      const scrapedPayloads = []; // was: UE
      setGlobal('yt.logging.transport.enableScrapingForTest', true);
      setGlobal('yt.logging.transport.scrapedPayloadsForTesting', scrapedPayloads);
      setGlobal(
        'yt.logging.transport.payloadToScrape',
        [
          'visualElementShown',
          'visualElementHidden',
          'visualElementAttached',
          'screenCreated',
          'visualElementGestured',
          'visualElementStateChanged',
        ],
      );
      setGlobal('yt.logging.transport.getScrapedPayloadFromClientEventsFunction');
      setGlobal('yt.logging.transport.scrapeClientEvent', true);
    } else {
      return;
    }
  }

  const scraped = getGlobal('yt.logging.transport.scrapedPayloadsForTesting');
  const payloadNames = getGlobal('yt.logging.transport.payloadToScrape');

  if (rawEvent) {
    const payload = rawEvent.payload;
    const extractFn = getGlobal('yt.logging.transport.getScrapedPayloadFromClientEventsFunction');
    const extracted = extractFn?.bind(payload)?.();
    if (extracted) scraped.push(extracted);
  }

  const scrapeWholeClientEvent = getGlobal('yt.logging.transport.scrapeClientEvent');
  if (payloadNames?.length >= 1) {
    for (let i = 0; i < payloadNames.length; i++) {
      if (clientEvent?.payload[payloadNames[i]]) {
        scrapeWholeClientEvent
          ? scraped.push(clientEvent.payload)
          : scraped.push(clientEvent.payload[payloadNames[i]]);
      }
    }
  }

  setGlobal('yt.logging.transport.scrapedPayloadsForTesting', scraped);
}

// ---------------------------------------------------------------------------
// Placeholder stubs (implementations live in other modules)
// ---------------------------------------------------------------------------
/* eslint-disable no-unused-vars */

/** @type {*} [was: g.DeferredValue] */
let defaultTransport;

// The following identifiers are referenced but defined elsewhere; they are
// listed here so readers can trace the dependency graph:
//
//   parseDeviceString      [was: bk]
//   setStringField         [was: DZ]
//   setEnumField           [was: H_]
//   setIntField            [was: nV]
//   setRepeatedField       [was: ry]
//   appendRepeatedMessage  [was: Xg]
//   getOrCreateSub         [was: W_]
//   parsePlatformEnum      [was: eB7]
//   createClientInfo       [was: new m9]
//   createUserContext       [was: new Ka]
//   AuthToken              [was: jkK]
//   EventIdProto           [was: Ojy]
//   getLastActivityMs      [was: YW]
//   submitIsolated         [was: I9x]
//   submitBatched          [was: AF3]
//   getGlobal              [was: g.DR]
//   setGlobal              [was: g.n7]
//   getExperimentParam     [was: k3]
