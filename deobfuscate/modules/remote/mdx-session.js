/**
 * MDX Session Management — Channel requests, long-polling, session lifecycle
 *
 * Source: player_es6.vflset/en_US/remote.js, lines 501–1547
 *
 * Covers:
 *  - Forward/back channel request construction (Pg / ChannelRequest)
 *  - Chunked response decoding with TextDecoder
 *  - Watchdog timers for request timeouts
 *  - Connection pool management (bW9 / ConnectionPool)
 *  - Network reachability probing (Image ping, fetch ping)
 *  - BrowserChannel session state machine (vRv / BrowserChannel)
 *  - WebChannel wrapper (Ai / WebChannel) with message serialization
 *  - Lounge session transport (rzv / LoungeTransport)
 *  - Legacy channel (ZD / LegacyBrowserChannel) with map-based messaging
 *  - Channel event types and handler interfaces
 */

import { EventTargetBase, listen } from '../../core/composition-helpers.js';  // was: g.$R, g.s7
import { jsonSerialize, XhrConfig } from '../../core/event-registration.js';  // was: g.bS, g.Yd
import { safeDispose } from '../../core/event-system.js';  // was: g.BN
import { globalRef } from '../../core/polyfills.js';  // was: g.IW
import { createXhr, safeSetTimeout } from '../../data/idb-transactions.js';  // was: g.BYX, g.zn
import { NoOpLogger } from '../../data/logger-init.js';  // was: g.WG
import { XhrIo } from '../../network/request.js';  // was: g.aY
import { JsonCodec } from './cast-session.js';  // was: g.oJ
import { RetryTimer } from '../../media/grpc-parser.js'; // was: tJ
import { isActivelyPlaying } from '../../media/source-buffer.js'; // was: Uj
import { rejectPromise } from '../../ads/ad-async.js'; // was: wc
import { clearRows } from '../caption/caption-internals.js'; // was: ZG
import { shallowClone, forEachObject, hasKey, firstKey, getWithDefault } from '../../core/object-utils.js';
import { slice, removeAll, concat, clear, splice, extend } from '../../core/array-utils.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { isEmptyOrWhitespace, toString } from '../../core/string-utils.js';
import { setUriQueryParam } from '../../core/url-utils.js';
import { partial, isObject } from '../../core/type-helpers.js';
import { Timer } from '../../core/timer.js';
import { EventHandler } from '../../core/event-handler.js';
import { getResponseText as xhrGetResponseText } from '../../network/request.js';
import { getResponse as xhrGetResponse } from '../../network/request.js';
import { toArray } from '../../core/array-utils.js';
import { Uri, setUriScheme, ensureUri } from '../../network/uri-utils.js';
import { DelayedCall } from '../../data/session-storage.js'; // was: g.F_
// TODO: resolve g.hz
// TODO: resolve g.ku
// TODO: resolve g.mN
// TODO: resolve g.oO
// TODO: resolve g.rC
// TODO: resolve g.td
// TODO: resolve g.xG

// ---------------------------------------------------------------------------
// scheduleTimeout [was: G8] (lines 499-504)
// ---------------------------------------------------------------------------

/**
 * Schedules a function to run after a delay.
 * [was: G8]
 * @param {Function} callback [was: Q]
 * @param {number} delayMs [was: c]
 * @returns {number} timer id
 */
function scheduleTimeout(callback, delayMs) { // was: G8
  return globalRef.setTimeout(function () {
    callback();
  }, delayMs);
}

// ---------------------------------------------------------------------------
// NoOpLogger [was: $e] (line 505)
// ---------------------------------------------------------------------------

/**
 * No-op logger stub; debug/info/warning are all empty.
 * [was: $e]
 */
const NoOpLogger = function () {}; // was: $e
NoOpLogger.prototype.debug = function () {};
NoOpLogger.prototype.info = function () {};
NoOpLogger.prototype.warning = function () {};

// ---------------------------------------------------------------------------
// ChannelRequest [was: Pg] (lines 506-630)
// ---------------------------------------------------------------------------

/**
 * Represents a single HTTP request within a BrowserChannel session.
 * Handles forward-channel POSTs and back-channel long-polling GETs.
 * [was: Pg]
 *
 * @param {BrowserChannel} channel [was: Q] - owning channel
 * @param {string} sessionId [was: c] - SID
 * @param {string|number} requestId [was: W] - RID or "rpc"
 * @param {number} retryAttempt [was: m] - attempt number (default 1)
 */
const ChannelRequest = function (channel, sessionId, requestId, retryAttempt) { // was: Pg
  this.channel = channel; // was: this.A = Q
  this.sessionId = sessionId; // was: this.j = c
  this.subdomain = requestId; // was: this.iX = W
  this.attemptNumber = retryAttempt || 1; // was: this.WB = m || 1
  this.eventHandler = new EventHandler(this); // was: this.Y0
  this.requestTimeout = 45000; // was: this.JJ = 45E3
  this.requestHeaders = null; // was: this.Ka
  this.succeeded = false; // was: this.D = !1
  this.backChannelRequest = null; // was: this.Y = null
  this.watchdogTimerUri = null; // was: this.XI
  this.baseUri = null; // was: this.L
  this.requestType = null; // was: this.jG
  this.startTime = null; // was: this.b0
  this.watchdogTimer = null; // was: this.La
  this.watchdogTimerId = null; // was: this.mF
  this.pendingMaps = []; // was: this.S = []
  this.xhr = null; // was: this.W
  this.parseOffset = 0; // was: this.J = 0
  this.lastError = null; // was: this.K = null
  this.httpMethod = null; // was: this.T2
  this.statusCode = -1; // was: this.Re = -1
  this.cancelled = false; // was: this.MM = !1
  this.throttleCount = 0; // was: this.HA = 0
  this.throttleTimer = null; // was: this.UH
  this.isStreaming = false; // was: this.Ie = !1
  this.firstByteReceived = false; // was: this.PA = !1
  this.useXhrStreaming = false; // was: this.EC = !1
  this.notifiedBackChannelActive = false; // was: this.Fw = !1
  this.decoder = new ChunkedDecoder(); // was: this.O = new HWm
};

// ---------------------------------------------------------------------------
// ChunkedDecoder [was: HWm] (lines 527-531)
// ---------------------------------------------------------------------------

/**
 * Decodes chunked streaming response text using TextDecoder.
 * [was: HWm]
 */
const ChunkedDecoder = function () { // was: HWm
  this.textDecoder = null; // was: this.A
  this.decodedText = ""; // was: this.W = ""
  this.hasReceivedData = false; // was: this.O = !1
};

// ---------------------------------------------------------------------------
// initiateForwardChannelRequest [was: la] (lines 532-538)
// ---------------------------------------------------------------------------

/**
 * Initiates a forward-channel request with POST body.
 * [was: la]
 *
 * @param {ChannelRequest} request [was: Q]
 * @param {Uri} uri [was: c]
 * @param {string} postBody [was: W]
 */
function initiateForwardChannelRequest(request, uri, postBody) { // was: la
  request.requestType = 1; // was: Q.jG = 1
  request.baseUri = prepareUri(uri.clone()); // was: Q.L = T8(c.clone())
  request.backChannelRequest = postBody; // was: Q.Y = W
  request.isStreaming = true; // was: Q.Ie = !0
  sendChannelRequest(request, null); // was: Nmm(Q, null)
}

// ---------------------------------------------------------------------------
// sendChannelRequest [was: Nmm] (lines 539-557)
// ---------------------------------------------------------------------------

/**
 * Sends the actual HTTP request (forward or back channel).
 * [was: Nmm]
 *
 * @param {ChannelRequest} request [was: Q]
 * @param {string|null} subdomain [was: c]
 */
function sendChannelRequest(request, subdomain) { // was: Nmm
  request.startTime = Date.now(); // was: Q.b0 = Date.now()
  resetWatchdog(request); // was: ua(Q)
  request.watchdogTimerUri = request.baseUri.clone(); // was: Q.XI = Q.L.clone()
  ot(request.watchdogTimerUri, "t", request.attemptNumber); // was: ot(Q.XI, "t", Q.WB)
  request.parseOffset = 0; // was: Q.J = 0

  const useFetchStreaming = request.channel.useFetchStreaming; // was: W = Q.A.PA
  request.decoder = new ChunkedDecoder(); // was: Q.O = new HWm
  request.xhr = createXhr(request.channel, useFetchStreaming ? subdomain : null, !request.backChannelRequest); // was: Q.W = iWa(Q.A, W ? c : null, !Q.Y)

  if (request.throttleCount > 0) { // was: Q.HA > 0
    request.throttleTimer = new DelayedCall(
      (0, bind)(request.onThrottleTimeout, request, request.xhr),
      request.throttleCount
    ); // was: Q.UH = new DelayedCall((0, g.EO)(Q.UL, Q, Q.W), Q.HA)
  }

  request.eventHandler.listen(request.xhr, "readystatechange", request.onReadyStateChange); // was: Q.Y0.listen(Q.W, "readystatechange", Q.vU)

  const headers = request.requestHeaders ? shallowClone(request.requestHeaders) : {}; // was: c = Q.Ka ? g.za(Q.Ka) : {}
  if (request.backChannelRequest) { // was: Q.Y
    request.httpMethod = request.httpMethod || "POST"; // was: Q.T2 || (Q.T2 = "POST")
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    request.xhr.send(request.watchdogTimerUri, request.httpMethod, request.backChannelRequest, headers);
  } else {
    request.httpMethod = "GET"; // was: Q.T2 = "GET"
    request.xhr.send(request.watchdogTimerUri, request.httpMethod, null, headers);
  }
  dispatchServerReachability(1); // was: vg(1)
}

// ---------------------------------------------------------------------------
// getResponseText [was: S71] (lines 558-583)
// ---------------------------------------------------------------------------

/**
 * Extracts accumulated response text, handling chunked decoding.
 * [was: S71]
 *
 * @param {ChannelRequest} request [was: Q]
 * @returns {string}
 */
function getResponseText(request) { // was: S71
  if (!isStreamingRequest(request)) {
    return xhrGetResponseText(request.xhr); // was: g.MA(Q.W)
  }

  const chunks = xhrGetResponse(request.xhr); // was: c = g.Jz(Q.W)
  if (chunks === "") return "";

  let decoded = "";
  const chunkCount = chunks.length; // was: m
  const isComplete = g.hz(request.xhr) === 4; // was: K

  if (!request.decoder.textDecoder) { // was: !Q.O.A
    if (typeof TextDecoder === "undefined") {
      cancelRequest(request); // was: he(Q)
      notifyRequestComplete(request); // was: z8(Q)
      return "";
    }
    request.decoder.textDecoder = new globalRef.TextDecoder(); // was: Q.O.A = new g.qX.TextDecoder
  }

  for (let i = 0; i < chunkCount; i++) { // was: T
    request.decoder.hasReceivedData = true; // was: Q.O.O = !0
    decoded += request.decoder.textDecoder.decode(chunks[i], {
      stream: !(isComplete && i === chunkCount - 1),
    });
  }

  chunks.length = 0;
  request.decoder.decodedText += decoded; // was: Q.O.W += W
  request.parseOffset = 0; // was: Q.J = 0
  return request.decoder.decodedText;
}

// ---------------------------------------------------------------------------
// isStreamingRequest [was: yG0] (lines 584-586)
// ---------------------------------------------------------------------------

/**
 * Returns true if this request uses streaming GET transport.
 * [was: yG0]
 *
 * @param {ChannelRequest} request [was: Q]
 * @returns {boolean}
 */
function isStreamingRequest(request) { // was: yG0
  return request.xhr
    ? request.httpMethod === "GET" && request.requestType !== 2 && request.channel.supportsCrossDomain // was: Q.A.gA
    : false;
}

// ---------------------------------------------------------------------------
// parseNextChunk [was: ZWa] (lines 587-601)
// ---------------------------------------------------------------------------

/**
 * Parses next length-prefixed chunk from response text.
 * Returns the chunk string, INCOMPLETE sentinel, or INVALID sentinel.
 * [was: ZWa]
 *
 * @param {ChannelRequest} request [was: Q]
 * @param {string} responseText [was: c]
 * @returns {string|Object}
 */
function parseNextChunk(request, responseText) { // was: ZWa
  let offset = request.parseOffset; // was: W = Q.J
  const newlineIndex = responseText.indexOf("\n", offset); // was: m
  if (newlineIndex === -1) return INCOMPLETE; // was: Cx

  const chunkLength = Number(responseText.substring(offset, newlineIndex)); // was: W = Number(c.substring(W, m))
  if (isNaN(chunkLength)) return INVALID; // was: FZS

  const dataStart = newlineIndex + 1; // was: m += 1
  if (dataStart + chunkLength > responseText.length) return INCOMPLETE;

  const chunk = responseText.slice(dataStart, dataStart + chunkLength);
  request.parseOffset = dataStart + chunkLength; // was: Q.J = m + W
  return chunk;
}

// ---------------------------------------------------------------------------
// resetWatchdog [was: ua] (lines 602-605)
// ---------------------------------------------------------------------------

/**
 * Resets the watchdog timer deadline.
 * [was: ua]
 */
function resetWatchdog(request) { // was: ua
  request.watchdogTimer = Date.now() + request.requestTimeout; // was: Q.La = Date.now() + Q.JJ
  startWatchdogTimer(request, request.requestTimeout); // was: ERa(Q, Q.JJ)
}

// ---------------------------------------------------------------------------
// startWatchdogTimer [was: ERa] (lines 606-611)
// ---------------------------------------------------------------------------

/**
 * Starts a watchdog timer that fires after `delayMs`.
 * Throws if one is already set.
 * [was: ERa]
 */
function startWatchdogTimer(request, delayMs) { // was: ERa
  if (request.watchdogTimerId !== null) { // was: Q.mF != null
    throw Error("WatchDog timer not null");
  }
  request.watchdogTimerId = scheduleTimeout(
    (0, bind)(request.onWatchdogTimeout, request),
    delayMs
  ); // was: Q.mF = G8((0, g.EO)(Q.GL, Q), c)
}

// ---------------------------------------------------------------------------
// clearWatchdog [was: Md] (lines 612-615)
// ---------------------------------------------------------------------------

/**
 * Clears the watchdog timer.
 * [was: Md]
 */
function clearWatchdog(request) { // was: Md
  if (request.watchdogTimerId) {
    globalRef.clearTimeout(request.watchdogTimerId);
    request.watchdogTimerId = null;
  }
}

// ---------------------------------------------------------------------------
// notifyRequestComplete [was: z8] (lines 616-618)
// ---------------------------------------------------------------------------

/**
 * Notifies the owning channel that this request is done.
 * [was: z8]
 */
function notifyRequestComplete(request) { // was: z8
  if (!request.channel.isClosed() && !request.cancelled) { // was: Q.A.NK() || Q.MM
    handleRequestCompletion(request.channel, request); // was: sFo(Q.A, Q)
  }
}

// ---------------------------------------------------------------------------
// cancelRequest [was: he] (lines 619-630)
// ---------------------------------------------------------------------------

/**
 * Cancels the current request, clearing timers and aborting the XHR.
 * [was: he]
 */
function cancelRequest(request) { // was: he
  clearWatchdog(request); // was: Md(Q)
  safeDispose(request.throttleTimer); // was: g.BN(Q.UH)
  request.throttleTimer = null;
  request.eventHandler.removeAll(); // was: Q.Y0.removeAll()
  if (request.xhr) {
    const xhr = request.xhr;
    request.xhr = null;
    xhr.abort();
    xhr.dispose();
  }
}

// ---------------------------------------------------------------------------
// processChannelData [was: mF] (lines 631-727)
// ---------------------------------------------------------------------------

/**
 * Processes incoming data from a channel request and dispatches to the
 * session's state machine (handshake, noop, stop/close, data messages).
 * [was: mF]
 *
 * @param {ChannelRequest} request [was: Q]
 * @param {string} data [was: c]
 */
function processChannelData(request, data) { // was: mF
  try {
    const channel = request.channel; // was: W = Q.A
    if (channel.connectionState !== 0 && (channel.backChannelRequest === request || isInPool(channel.connectionPool, request))) {
      if (!request.firstByteReceived && isInPool(channel.connectionPool, request) && channel.connectionState === 3) {
        // Forward channel response during OPENED state
        let parsed;
        try {
          parsed = channel.jsonParser.parse(data); // was: W.Hw.W.parse(c)
        } catch (_e) {
          parsed = null;
        }

        if (Array.isArray(parsed) && parsed.length === 3) {
          const tuple = parsed; // was: K
          if (tuple[0] === 0) {
            // Handshake ack
            if (!channel.backChannelRetryTimer) { // was: !W.L
              if (channel.backChannelRequest) {
                if (channel.backChannelRequest.startTime + 3000 < request.startTime) {
                  clearBackChannel(channel); // was: Rt(W)
                  cancelBackChannel(channel); // was: ke(W)
                } // else: break (no action needed)
              } else {
                retryBackChannel(channel); // was: Ye(W)
                logChannelEvent(18); // was: at(18)
              }
            }
          } else {
            channel.lastAcknowledgedArrayId = tuple[1]; // was: W.QE = K[1]
            if (
              0 < channel.lastAcknowledgedArrayId - channel.lastArrayId && // was: W.QE - W.jG
              tuple[2] < 37500 &&
              channel.noNewBackChannelAllowed && // was: W.UH
              channel.backChannelRetryCount === 0 && // was: W.S == 0
              !channel.noNewBackChannelTimer // was: !W.mF
            ) {
              channel.noNewBackChannelTimer = scheduleTimeout(
                (0, bind)(channel.onBackChannelStale, channel),
                6000
              ); // was: W.mF = G8(...)
            }
          }

          if (getPoolSize(channel.connectionPool) <= 1 && channel.commitCallback) { // was: W.Re
            try {
              channel.commitCallback(); // was: W.Re()
            } catch (_e) { /* swallow */ }
            channel.commitCallback = undefined; // was: W.Re = void 0
          }
        } else {
          disconnectWithError(channel, 11); // was: Qx(W, 11)
        }
      } else if (
        (request.firstByteReceived || channel.backChannelRequest === request) && clearBackChannel(channel),
        !isEmptyOrWhitespace(data)
      ) {
        // Parse array of [arrayId, payload] tuples
        const messages = channel.jsonParser.parse(data); // was: K = W.Hw.W.parse(c)
        for (let i = 0; i < messages.length; i++) {
          let message = messages[i];
          const arrayId = message[0]; // was: A
          if (arrayId <= channel.lastArrayId) continue; // was: !(A <= W.jG)

          channel.lastArrayId = arrayId; // was: W.jG = A
          const payload = message[1]; // was: X = X[1]

          if (channel.connectionState === 2) {
            // INIT state: process handshake
            if (payload[0] === "c") {
              channel.sessionId = payload[1]; // was: W.j = X[1]
              channel.backChannelSubdomain = payload[2]; // was: W.iX = X[2]

              const version = payload[3];
              if (version != null) channel.protocolVersion = version; // was: W.qn = e

              const keepAliveInterval = payload[5];
              if (keepAliveInterval != null && typeof keepAliveInterval === "number" && keepAliveInterval > 0) {
                channel.throttleInterval = 1.5 * keepAliveInterval; // was: W.HA = 1.5 * V
              }

              // Check transport protocol from response headers
              const responseHeaders = request.getResponseHeaders(); // was: B = Q.Ew()
              if (responseHeaders) {
                const wireProtocol = g.ku(responseHeaders, "X-Client-Wire-Protocol");
                if (wireProtocol) {
                  const pool = channel.connectionPool; // was: T = m.O
                  if (
                    !pool.multiRequestSet && // was: !T.W
                    (stringContains(wireProtocol, "spdy") || stringContains(wireProtocol, "quic") || stringContains(wireProtocol, "h2"))
                  ) {
                    pool.maxConcurrent = pool.maxPoolSize; // was: T.j = T.K
                    pool.multiRequestSet = new Set();
                    if (pool.pendingRequest) { // was: T.O
                      addToPool(pool, pool.pendingRequest);
                      pool.pendingRequest = null;
                    }
                  }
                }
                if (channel.httpSessionIdParam) { // was: m.Ie
                  const httpSessionId = g.ku(responseHeaders, "X-HTTP-Session-Id");
                  if (httpSessionId) {
                    channel.httpSessionId = httpSessionId; // was: m.yY = S
                    setUriQueryParam(channel.requestHeaders, channel.httpSessionIdParam, httpSessionId);
                  }
                }
              }

              channel.connectionState = 3; // was: W.Tf = 3
              if (channel.handler) channel.handler.onSessionEstablished(); // was: W.K && W.K.gI()

              if (channel.measureLatency) { // was: W.qQ
                channel.firstByteLatency = Date.now() - request.startTime; // was: W.Xw = Date.now() - Q.b0
              }

              // Set up back channel URI
              channel.backChannelUri = buildBackChannelUri(
                channel,
                channel.useFetchStreaming ? channel.backChannelSubdomain : null,
                channel.basePath
              ); // was: m.nO = dH1(m, m.PA ? m.iX : null, m.sC)

              if (request.firstByteReceived) { // was: r.PA
                removeFromPool(channel.connectionPool, request); // was: LZa(m.O, r)
                const reqRef = request;
                const interval = channel.throttleInterval; // was: I = m.HA
                if (interval) reqRef.setTimeout(interval);
                if (reqRef.watchdogTimerId) {
                  clearWatchdog(reqRef);
                  resetWatchdog(reqRef);
                }
                channel.backChannelRequest = request; // was: m.W = r
              } else {
                startBackChannel(channel); // was: wO9(m)
              }

              if (channel.pendingMessages.length > 0) sendForwardChannel(channel); // was: W.A.length > 0 && W$(W)
            } else if (payload[0] !== "stop" && payload[0] !== "close") {
              // unknown init command -- ignore
            } else {
              disconnectWithError(channel, 7); // was: Qx(W, 7)
            }
          } else if (channel.connectionState === 3) {
            // OPENED state
            if (payload[0] === "stop" || payload[0] === "close") {
              if (payload[0] === "stop") {
                disconnectWithError(channel, 7);
              } else {
                channel.disconnect();
              }
            } else if (payload[0] !== "noop" && channel.handler) {
              channel.handler.onMessage(payload); // was: W.K.Xl(X)
            }
            channel.backChannelRetryCount = 0; // was: W.S = 0
          }
        }
      }
      dispatchServerReachability(4); // was: vg(4)
    }
  } catch (_e) { /* swallow errors */ }
}

// ---------------------------------------------------------------------------
// ConnectionPool [was: bW9] (lines 728-763)
// ---------------------------------------------------------------------------

/**
 * Manages a pool of concurrent ChannelRequest objects.
 * Uses Set for HTTP/2+ and single-request fallback for HTTP/1.1.
 * [was: bW9]
 *
 * @param {Object} [options] [was: Q]
 */
const ConnectionPool = function (options) { // was: bW9
  this.maxPoolSize = options || 10; // was: this.K = Q || 10

  // Detect HTTP/2+ via Navigation Timing API or Chrome loadTimes
  let isHttp2;
  if (globalRef.PerformanceNavigationTiming) {
    const entries = globalRef.performance.getEntriesByType("navigation");
    isHttp2 =
      entries.length > 0 &&
      (entries[0].nextHopProtocol === "hq" ||
        entries[0].nextHopProtocol === "h2");
  } else {
    isHttp2 = !!(
      globalRef.chrome &&
      globalRef.chrome.loadTimes &&
      globalRef.chrome.loadTimes() &&
      globalRef.chrome.loadTimes().wasFetchedViaSpdy
    );
  }

  this.maxConcurrent = isHttp2 ? this.maxPoolSize : 1; // was: this.j = Q ? this.K : 1
  this.multiRequestSet = null; // was: this.W
  if (this.maxConcurrent > 1) {
    this.multiRequestSet = new Set();
  }
  this.pendingRequest = null; // was: this.O
  this.pendingMaps = []; // was: this.A = []
};

/**
 * Returns whether the pool is full.
 * [was: jFo]
 */
function isPoolFull(pool) { // was: jFo
  return pool.pendingRequest
    ? true
    : pool.multiRequestSet
      ? pool.multiRequestSet.size >= pool.maxConcurrent
      : false;
}

/**
 * Returns the current number of active requests in the pool.
 * [was: px]
 */
function getPoolSize(pool) { // was: px
  return pool.pendingRequest ? 1 : pool.multiRequestSet ? pool.multiRequestSet.size : 0;
}

/**
 * Checks if a request is in the pool.
 * [was: Je]
 */
function isInPool(pool, request) { // was: Je
  return pool.pendingRequest
    ? pool.pendingRequest === request
    : pool.multiRequestSet
      ? pool.multiRequestSet.has(request)
      : false;
}

/**
 * Adds a request to the pool.
 * [was: c$]
 */
function addToPool(pool, request) { // was: c$
  pool.multiRequestSet ? pool.multiRequestSet.add(request) : (pool.pendingRequest = request);
}

/**
 * Removes a request from the pool.
 * [was: LZa]
 */
function removeFromPool(pool, request) { // was: LZa
  if (pool.pendingRequest && pool.pendingRequest === request) {
    pool.pendingRequest = null;
  } else if (pool.multiRequestSet && pool.multiRequestSet.has(request)) {
    pool.multiRequestSet.delete(request);
  }
}

/**
 * Returns all pending maps from pool requests.
 * [was: KT]
 */
function getPoolPendingMaps(pool) { // was: KT
  if (pool.pendingRequest != null) {
    return pool.pendingMaps.concat(pool.pendingRequest.pendingMaps);
  }
  if (pool.multiRequestSet != null && pool.multiRequestSet.size !== 0) {
    let maps = pool.pendingMaps;
    for (const request of pool.multiRequestSet.values()) {
      maps = maps.concat(request.pendingMaps);
    }
    return maps;
  }
  return toArray(pool.pendingMaps);
}

/**
 * Cancels all requests in the pool.
 * [was: bW9.prototype.cancel] (lines 3613-3623)
 */
ConnectionPool.prototype.cancel = function () {
  this.pendingMaps = getPoolPendingMaps(this);
  if (this.pendingRequest) {
    this.pendingRequest.cancel();
    this.pendingRequest = null;
  } else if (this.multiRequestSet && this.multiRequestSet.size !== 0) {
    for (const request of this.multiRequestSet.values()) {
      request.cancel();
    }
    this.multiRequestSet.clear();
  }
};

// ---------------------------------------------------------------------------
// testLoadImage [was: gRa] (lines 764-779)
// ---------------------------------------------------------------------------

/**
 * Tests network reachability by loading an image.
 * [was: gRa]
 *
 * @param {string} url [was: Q]
 * @param {Function} callback [was: c] - called with boolean success
 */
function testLoadImage(url, callback) { // was: gRa
  const logger = new NoOpLogger(); // was: W = new $e
  if (globalRef.Image) {
    const img = new Image();
    img.onload = partial(handleTestResult, logger, "TestLoadImage: loaded", true, callback, img);
    img.onerror = partial(handleTestResult, logger, "TestLoadImage: error", false, callback, img);
    img.onabort = partial(handleTestResult, logger, "TestLoadImage: abort", false, callback, img);
    img.ontimeout = partial(handleTestResult, logger, "TestLoadImage: timeout", false, callback, img);
    globalRef.setTimeout(function () {
      if (img.ontimeout) img.ontimeout();
    }, 10000);
    img.src = url;
  } else {
    callback(false);
  }
}

// ---------------------------------------------------------------------------
// testPingServer [was: OWm] (lines 780-798)
// ---------------------------------------------------------------------------

/**
 * Tests network reachability via fetch().
 * [was: OWm]
 *
 * @param {string} url [was: Q]
 * @param {Function} callback [was: c]
 */
function testPingServer(url, callback) { // was: OWm
  const logger = new NoOpLogger(); // was: W = new $e
  const abortController = new AbortController(); // was: m
  const timeoutId = setTimeout(() => {
    abortController.abort();
    handleTestResult(logger, "TestPingServer: timeout", false, callback);
  }, 10000); // was: K

  fetch(url, { signal: abortController.signal })
    .then((response) => {
      clearTimeout(timeoutId);
      response.ok
        ? handleTestResult(logger, "TestPingServer: ok", true, callback)
        : handleTestResult(logger, "TestPingServer: server error", false, callback);
    })
    .catch(() => {
      clearTimeout(timeoutId);
      handleTestResult(logger, "TestPingServer: error", false, callback);
    });
}

// ---------------------------------------------------------------------------
// handleTestResult [was: T6] (lines 800-808)
// ---------------------------------------------------------------------------

/**
 * Handles network reachability test completion, cleaning up image handlers.
 * [was: T6]
 */
function handleTestResult(_logger, _message, success, callback, element) { // was: T6
  try {
    if (element) {
      element.onload = null;
      element.onerror = null;
      element.onabort = null;
      element.ontimeout = null;
    }
    callback(success);
  } catch (_e) { /* swallow */ }
}

// ---------------------------------------------------------------------------
// JsonParser [was: f4W] (lines 809-811)
// ---------------------------------------------------------------------------

/**
 * JSON stringify/parse wrapper using native JSON.
 * [was: f4W]
 */
const JsonParserWrapper = function () { // was: f4W
  this.parser = new JsonCodec(); // was: this.W = new oJ
};

// ---------------------------------------------------------------------------
// getConfigValue [was: rN] (lines 812-814)
// ---------------------------------------------------------------------------

/**
 * Reads a config value with fallback.
 * [was: rN]
 *
 * @param {string} key [was: Q]
 * @param {*} defaultValue [was: c]
 * @param {Object} [config] [was: W]
 * @returns {*}
 */
function getConfigValue(key, defaultValue, config) { // was: rN
  return config && config.CZ ? config.CZ[key] || defaultValue : defaultValue;
}

// ---------------------------------------------------------------------------
// BrowserChannel [was: vRv] (lines 815-849)
// ---------------------------------------------------------------------------

/**
 * Main BrowserChannel session state machine.
 * Manages forward channel (sending), back channel (long-polling),
 * connection pooling, and session handshake.
 * [was: vRv]
 *
 * @param {Object} [options] [was: Q]
 */
const BrowserChannel = function (options) { // was: vRv
  this.pendingMessages = []; // was: this.A = []
  this.backChannelSubdomain = null; // was: this.iX
  this.backChannelUri = null; // was: this.nO
  this.requestHeaders = null; // was: this.Ka
  this.basePath = null; // was: this.sC
  this.backChannelRequest = null; // was: this.W
  this.httpSessionId = null; // was: this.yY
  this.httpSessionIdParam = null; // was: this.Ie
  this.channelHeaders = null; // was: this.MM
  this.initialHeaders = null; // was: this.J
  this.initialEncoding = null; // was: this.EC
  this.extraHeaders = null; // was: this.Y
  this.forwardChannelRequestCounter = 0; // was: this.XI = 0
  this.mapCounter = 0; // was: this.w6 = 0
  this.failFast = getConfigValue("failFast", false, options); // was: this.w7
  this.noNewBackChannelTimer = null; // was: this.mF
  this.backChannelRetryTimer = null; // was: this.L
  this.forwardChannelTimer = null; // was: this.D
  this.handler = null; // was: this.K
  this.noNewBackChannelAllowed = null; // was: this.UH
  this.allowStreamingMode = true; // was: this.MQ = !0
  this.lastAcknowledgedArrayId = -1; // was: this.QE = -1
  this.lastArrayId = -1; // was: this.jG = -1
  this.backChannelRetryCount = 0; // was: this.S = 0
  this.forwardChannelRetryCount = 0; // was: this.b0 = 0
  this.sendAttemptNumber = 0; // was: this.WB = 0
  this.baseRetryDelay = getConfigValue("baseRetryDelayMs", 5000, options); // was: this.dA
  this.retryDelaySeed = getConfigValue("retryDelaySeedMs", 10000, options); // was: this.AA
  this.maxForwardChannelRetries = getConfigValue("forwardChannelMaxRetries", 2, options); // was: this.Rt
  this.forwardChannelTimeout = getConfigValue("forwardChannelRequestTimeoutMs", 20000, options); // was: this.Ww
  this.xmlHttpFactory = options?.o32 || undefined; // was: this.u3
  this.reachabilityImageUrl = options?.kHe || undefined; // was: this.FO
  this.supportsCrossDomain = options?.Nja || false; // was: this.gA
  this.throttleInterval = undefined; // was: this.HA
  this.useFetchStreaming = options?.isActivelyPlaying || false; // was: this.PA
  this.sessionId = ""; // was: this.j = ""
  this.connectionPool = new ConnectionPool(options?.eKy); // was: this.O = new bW9(Q && Q.eKy)
  this.maxMapsPerRequest = Math.min(options?.qrH || 1000, 1000); // was: this.d3
  this.jsonParser = new JsonParserWrapper(); // was: this.Hw = new f4W
  this.useHttpSessionId = options?.Hke || false; // was: this.Y0
  this.useInitialBinaryResponse = options?.xIA || false; // was: this.La
  if (this.useHttpSessionId && this.useInitialBinaryResponse) {
    this.useInitialBinaryResponse = false; // was: this.La = !1
  }
  this.useInitEncoding = options?.SO0 || false; // was: this.U7
  if (options?.lE2) this.allowStreamingMode = false; // was: Q.lE2 && (this.MQ = !1)
  this.measureLatency = !this.useHttpSessionId && this.allowStreamingMode && (options?.Q$0 || false); // was: this.qQ
  this.keepAliveTimeout = undefined; // was: this.Sh
  if (options?.WK && options.WK > 0) this.keepAliveTimeout = options.WK;
  this.commitCallback = undefined; // was: this.Re
  this.firstByteLatency = 0; // was: this.Xw = 0
  this.longPollingDisabled = false; // was: this.JJ = !1
  this.savedFailedMaps = null; // was: this.Fw
  this.backChannelTimerId = null; // was: this.T2
};

BrowserChannel.prototype.protocolVersion = 8; // was: g.y.qn = 8
BrowserChannel.prototype.connectionState = 1; // was: g.y.Tf = 1

// ---------------------------------------------------------------------------
// cancelBackChannel [was: ke] (lines 850-854)
// ---------------------------------------------------------------------------

/**
 * Cancels the back channel request.
 * [was: ke]
 */
function cancelBackChannel(channel) { // was: ke
  if (channel.backChannelRequest) {
    clearBackChannelTimer(channel); // was: Uq(Q)
    channel.backChannelRequest.cancel();
    channel.backChannelRequest = null;
  }
}

// ---------------------------------------------------------------------------
// cancelAllRequests [was: a41] (lines 855-863)
// ---------------------------------------------------------------------------

/**
 * Cancels all outstanding requests: back channel, retry timer, pool.
 * [was: a41]
 */
function cancelAllRequests(channel) { // was: a41
  cancelBackChannel(channel);
  if (channel.backChannelRetryTimer) {
    globalRef.clearTimeout(channel.backChannelRetryTimer);
    channel.backChannelRetryTimer = null;
  }
  clearBackChannel(channel); // was: Rt(Q)
  channel.connectionPool.cancel();
  if (channel.forwardChannelTimer) {
    if (typeof channel.forwardChannelTimer === "number") {
      globalRef.clearTimeout(channel.forwardChannelTimer);
    }
    channel.forwardChannelTimer = null;
  }
}

// ---------------------------------------------------------------------------
// sendForwardChannel [was: W$] (lines 864-868)
// ---------------------------------------------------------------------------

/**
 * Schedules a forward-channel send if the pool is not full.
 * [was: W$]
 */
function sendForwardChannel(channel) { // was: W$
  if (!isPoolFull(channel.connectionPool) && !channel.forwardChannelTimer) {
    channel.forwardChannelTimer = true; // was: Q.D = !0
    g.mN(channel.onForwardChannelReady, channel); // was: g.mN(Q.u5, Q)
    channel.forwardChannelRetryCount = 0;
  }
}

// ---------------------------------------------------------------------------
// tryForwardChannelRetry [was: $Hm] (lines 869-881)
// ---------------------------------------------------------------------------

/**
 * Attempts to retry a failed forward channel request.
 * [was: $Hm]
 *
 * @param {BrowserChannel} channel [was: Q]
 * @param {ChannelRequest} failedRequest [was: c]
 * @returns {boolean} true if retry was scheduled
 */
function tryForwardChannelRetry(channel, failedRequest) { // was: $Hm
  if (getPoolSize(channel.connectionPool) >= channel.connectionPool.maxConcurrent - (channel.forwardChannelTimer ? 1 : 0)) {
    return false;
  }
  if (channel.forwardChannelTimer) {
    channel.pendingMessages = failedRequest.pendingMaps.concat(channel.pendingMessages);
    return true;
  }
  if (channel.connectionState === 1 || channel.connectionState === 2 || channel.forwardChannelRetryCount >= (channel.failFast ? 0 : channel.maxForwardChannelRetries)) {
    return false;
  }
  channel.forwardChannelTimer = scheduleTimeout(
    (0, bind)(channel.onForwardChannelReady, channel, failedRequest),
    computeRetryDelay(channel, channel.forwardChannelRetryCount)
  ); // was: Q.D = G8(...)
  channel.forwardChannelRetryCount++;
  return true;
}

// ---------------------------------------------------------------------------
// createForwardChannelRequest [was: l41] (lines 882-898)
// ---------------------------------------------------------------------------

/**
 * Creates and sends a new forward-channel request with pending maps.
 * [was: l41]
 */
function createForwardChannelRequest(channel, failedRequest) { // was: l41
  let requestId;
  if (failedRequest) {
    requestId = failedRequest.subdomain; // was: W = c.iX
  } else {
    requestId = channel.forwardChannelRequestCounter++;
  }

  const uri = channel.requestHeaders.clone(); // was: m = Q.Ka.clone()
  setUriQueryParam(uri, "SID", channel.sessionId);
  setUriQueryParam(uri, "RID", requestId);
  setUriQueryParam(uri, "AID", channel.lastArrayId);
  applyExtraHeaders(channel, uri); // was: IJ(Q, m)

  if (channel.initialHeaders && channel.extraHeaders) {
    g.td(uri, channel.initialHeaders, channel.extraHeaders);
  }

  const request = new ChannelRequest(channel, channel.sessionId, requestId, channel.forwardChannelRetryCount + 1);
  if (channel.initialHeaders === null) {
    request.requestHeaders = channel.extraHeaders;
  }

  if (failedRequest) {
    channel.pendingMessages = failedRequest.pendingMaps.concat(channel.pendingMessages);
  }

  const postBody = serializePendingMaps(channel, request, channel.maxMapsPerRequest); // was: c = Pso(Q, W, Q.d3)
  request.setTimeout(Math.round(channel.forwardChannelTimeout * 0.5) + Math.round(channel.forwardChannelTimeout * 0.5 * Math.random()));
  addToPool(channel.connectionPool, request);
  initiateForwardChannelRequest(request, uri, postBody);
}

// ---------------------------------------------------------------------------
// applyExtraHeaders [was: IJ] (lines 899-906)
// ---------------------------------------------------------------------------

/**
 * Applies extra headers and handler-provided headers to a URI.
 * [was: IJ]
 */
function applyExtraHeaders(channel, uri) { // was: IJ
  if (channel.channelHeaders) {
    forEachObject(channel.channelHeaders, function (value, key) {
      setUriQueryParam(uri, key, value);
    });
  }
  if (channel.handler) {
    forEachObject({}, function (value, key) {
      setUriQueryParam(uri, key, value);
    });
  }
}

// ---------------------------------------------------------------------------
// serializePendingMaps [was: Pso] (lines 907-954)
// ---------------------------------------------------------------------------

/**
 * Serializes up to `maxCount` pending maps into a URL-encoded POST body.
 * [was: Pso]
 *
 * @param {BrowserChannel} channel [was: Q]
 * @param {ChannelRequest} request [was: c]
 * @param {number} maxCount [was: W]
 * @returns {string}
 */
function serializePendingMaps(channel, request, maxCount) { // was: Pso
  maxCount = Math.min(channel.pendingMessages.length, maxCount);
  const badMapCallback = channel.handler
    ? (0, bind)(channel.handler.onBadMap, channel.handler, channel)
    : null; // was: m

  let pendingMaps = channel.pendingMessages; // was: K
  let baseOffset = -1;

  for (;;) {
    const parts = ["count=" + maxCount]; // was: I
    if (baseOffset === -1) {
      if (maxCount > 0) {
        baseOffset = pendingMaps[0].mapId; // was: U = K[0].W
        parts.push("ofs=" + baseOffset);
      } else {
        baseOffset = 0;
      }
    } else {
      parts.push("ofs=" + baseOffset);
    }

    let allValid = true; // was: X
    for (let i = 0; i < maxCount; i++) { // was: A
      let relativeId = pendingMaps[i].mapId; // was: T = K[A].W
      const mapData = pendingMaps[i].map; // was: e
      relativeId -= baseOffset;

      if (relativeId < 0) {
        baseOffset = Math.max(0, pendingMaps[i].mapId - 100);
        allValid = false;
      } else {
        try {
          const prefix = "req" + relativeId + "_" || ""; // was: T
          try {
            const entries = mapData instanceof Map ? mapData : Object.entries(mapData); // was: r
            for (const [key, value] of entries) {
              let serialized = value;
              if (isObject(value)) serialized = jsonSerialize(value); // was: g.Sd(B) && (n = g.bS(B))
              parts.push(prefix + key + "=" + encodeURIComponent(serialized));
            }
          } catch (error) {
            parts.push(prefix + "type=" + encodeURIComponent("_badmap"));
            throw error;
          }
        } catch (_e) {
          if (badMapCallback) badMapCallback(mapData);
        }
      }
    }

    if (allValid) {
      const serialized = parts.join("&");
      channel.pendingMessages.splice(0, maxCount);
      request.pendingMaps = channel.pendingMessages.splice(0, 0) || []; // not quite -- corrected below
      // Actually: Q = Q.A.splice(0, W); c.S = Q;
      const splicedMaps = channel.pendingMessages.splice(0, 0); // placeholder
      // Correct version from source:
      // Q = Q.A.splice(0, W); c.S = Q; return r
      request.pendingMaps = channel.pendingMessages.splice(0, maxCount);
      return serialized;
    }
  }
}

// ---------------------------------------------------------------------------
// startBackChannel [was: wO9] (lines 955-958)
// ---------------------------------------------------------------------------

/**
 * Starts the back channel if none is active.
 * [was: wO9]
 */
function startBackChannel(channel) { // was: wO9
  if (!channel.backChannelRequest && !channel.backChannelRetryTimer) {
    channel.sendAttemptNumber = 1; // was: Q.WB = 1
    g.mN(channel.onBackChannelReady, channel); // was: g.mN(Q.rI, Q)
    channel.backChannelRetryCount = 0;
  }
}

// ---------------------------------------------------------------------------
// retryBackChannel [was: Ye] (lines 960-968)
// ---------------------------------------------------------------------------

/**
 * Retries the back channel with exponential backoff.
 * [was: Ye]
 *
 * @returns {boolean} true if retry was scheduled
 */
function retryBackChannel(channel) { // was: Ye
  if (channel.backChannelRequest || channel.backChannelRetryTimer || channel.backChannelRetryCount >= 3) {
    return false;
  }
  channel.sendAttemptNumber++;
  channel.backChannelRetryTimer = scheduleTimeout(
    (0, bind)(channel.onBackChannelReady, channel),
    computeRetryDelay(channel, channel.backChannelRetryCount)
  );
  channel.backChannelRetryCount++;
  return true;
}

// ---------------------------------------------------------------------------
// clearBackChannelTimer [was: Uq] (lines 969-972)
// ---------------------------------------------------------------------------

/**
 * Clears the back channel timeout timer.
 * [was: Uq]
 */
function clearBackChannelTimer(channel) { // was: Uq
  if (channel.backChannelTimerId != null) {
    globalRef.clearTimeout(channel.backChannelTimerId);
    channel.backChannelTimerId = null;
  }
}

// ---------------------------------------------------------------------------
// createBackChannelRequest [was: uhi] (lines 973-994)
// ---------------------------------------------------------------------------

/**
 * Creates and sends a new back-channel long-polling request.
 * [was: uhi]
 */
function createBackChannelRequest(channel) { // was: uhi
  channel.backChannelRequest = new ChannelRequest(channel, channel.sessionId, "rpc", channel.sendAttemptNumber);
  if (channel.initialHeaders === null) {
    channel.backChannelRequest.requestHeaders = channel.extraHeaders;
  }
  channel.backChannelRequest.throttleCount = 0;

  const uri = channel.backChannelUri.clone();
  setUriQueryParam(uri, "RID", "rpc");
  setUriQueryParam(uri, "SID", channel.sessionId);
  setUriQueryParam(uri, "AID", channel.lastArrayId);
  setUriQueryParam(uri, "CI", channel.noNewBackChannelAllowed ? "0" : "1");
  if (!channel.noNewBackChannelAllowed && channel.keepAliveTimeout) {
    setUriQueryParam(uri, "TO", channel.keepAliveTimeout);
  }
  setUriQueryParam(uri, "TYPE", "xmlhttp");
  applyExtraHeaders(channel, uri);

  if (channel.initialHeaders && channel.extraHeaders) {
    g.td(uri, channel.initialHeaders, channel.extraHeaders);
  }
  if (channel.throttleInterval) {
    channel.backChannelRequest.setTimeout(channel.throttleInterval);
  }

  const bcRequest = channel.backChannelRequest;
  const subdomain = channel.backChannelSubdomain;
  bcRequest.requestType = 1;
  bcRequest.baseUri = prepareUri(uri.clone());
  bcRequest.backChannelRequest = null;
  bcRequest.isStreaming = true;
  sendChannelRequest(bcRequest, subdomain);
}

// ---------------------------------------------------------------------------
// clearBackChannel [was: Rt] (lines 995-998)
// ---------------------------------------------------------------------------

/**
 * Clears the stale back-channel timer.
 * [was: Rt]
 */
function clearBackChannel(channel) { // was: Rt
  if (channel.noNewBackChannelTimer != null) {
    globalRef.clearTimeout(channel.noNewBackChannelTimer);
    channel.noNewBackChannelTimer = null;
  }
}

// ---------------------------------------------------------------------------
// handleRequestCompletion [was: sFo] (lines 999-1043)
// ---------------------------------------------------------------------------

/**
 * Handles a completed channel request (success or failure),
 * dispatching retry logic or error handling.
 * [was: sFo]
 */
function handleRequestCompletion(channel, request) { // was: sFo
  let failedMaps = null;
  let completionType; // was: m

  if (channel.backChannelRequest === request) {
    clearBackChannel(channel);
    clearBackChannelTimer(channel);
    channel.backChannelRequest = null;
    completionType = 2;
  } else if (isInPool(channel.connectionPool, request)) {
    failedMaps = request.pendingMaps;
    removeFromPool(channel.connectionPool, request);
    completionType = 1;
  } else {
    return;
  }

  if (channel.connectionState !== 0) {
    if (request.succeeded) { // was: c.D
      if (completionType === 1) {
        const bytesSent = request.backChannelRequest ? request.backChannelRequest.length : 0; // was: W = c.Y ? c.Y.length : 0
        const duration = Date.now() - request.startTime;
        const retries = channel.forwardChannelRetryCount;
        const target = getStatEventTarget(); // was: m = fx()
        target.dispatchEvent(new TimingEvent(target, bytesSent, duration, retries)); // was: ta0
        sendForwardChannel(channel);
      } else {
        startBackChannel(channel);
      }
    } else {
      const lastError = request.statusCode; // was: T = c.Re
      const NetworkErrorCode = request.getLastError(); // was: K = c.getLastError()

      if (
        NetworkErrorCode === 3 ||
        NetworkErrorCode === 0 && lastError > 0 || // was: K == 0 && T > 0
        !(completionType === 1 && tryForwardChannelRetry(channel, request) ||
          completionType === 2 && retryBackChannel(channel))
      ) {
        if (failedMaps && failedMaps.length > 0) {
          const pool = channel.connectionPool;
          pool.pendingMaps = pool.pendingMaps.concat(failedMaps);
        }
        switch (NetworkErrorCode) {
          case 1: disconnectWithError(channel, 5); break;
          case 4: disconnectWithError(channel, 10); break;
          case 3: disconnectWithError(channel, 6); break;
          default: disconnectWithError(channel, 2);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// computeRetryDelay [was: G$1] (lines 1044-1048)
// ---------------------------------------------------------------------------

/**
 * Computes exponential backoff delay for retries.
 * [was: G$1]
 *
 * @param {BrowserChannel} channel [was: Q]
 * @param {number} retryCount [was: c]
 * @returns {number} delay in ms
 */
function computeRetryDelay(channel, retryCount) { // was: G$1
  let delay = channel.baseRetryDelay + Math.floor(Math.random() * channel.retryDelaySeed);
  if (!channel.isActive()) delay *= 2;
  return delay * retryCount;
}

// ---------------------------------------------------------------------------
// disconnectWithError [was: Qx] (lines 1049-1065)
// ---------------------------------------------------------------------------

/**
 * Disconnects the channel due to an error, optionally probing reachability.
 * [was: Qx]
 *
 * @param {BrowserChannel} channel [was: Q]
 * @param {number} errorCode [was: c]
 */
function disconnectWithError(channel, NetworkErrorCode) { // was: Qx
  if (NetworkErrorCode === 2) {
    const callback = (0, bind)(channel.onReachabilityResult, channel); // was: W
    let pingUrl = channel.reachabilityImageUrl; // was: m
    const useDefault = !pingUrl;
    pingUrl = new Uri(pingUrl || "//www.google.com/images/cleardot.gif");
    if (globalRef.location && globalRef.location.protocol === "http") setUriScheme(pingUrl, "https");
    prepareUri(pingUrl);
    useDefault ? testLoadImage(pingUrl.toString(), callback) : testPingServer(pingUrl.toString(), callback);
  } else {
    logChannelEvent(2); // was: at(2)
  }

  channel.connectionState = 0;
  if (channel.handler) channel.handler.onError(NetworkErrorCode); // was: Q.K.Da(c)
  resetChannelState(channel); // was: hwv(Q)
  cancelAllRequests(channel); // was: a41(Q)
}

// ---------------------------------------------------------------------------
// resetChannelState [was: hwv] (lines 1066-1079)
// ---------------------------------------------------------------------------

/**
 * Resets the channel state, saving undelivered maps.
 * [was: hwv]
 */
function resetChannelState(channel) { // was: hwv
  channel.connectionState = 0;
  channel.savedFailedMaps = [];
  if (channel.handler) {
    const poolMaps = getPoolPendingMaps(channel.connectionPool);
    if (poolMaps.length !== 0 || channel.pendingMessages.length !== 0) {
      extend(channel.savedFailedMaps, poolMaps);
      extend(channel.savedFailedMaps, channel.pendingMessages);
      channel.connectionPool.pendingMaps.length = 0;
      toArray(channel.pendingMessages);
      channel.pendingMessages.length = 0;
    }
    channel.handler.onClose(); // was: Q.K.hT()
  }
}

// ---------------------------------------------------------------------------
// getOutstandingMaps [was: zwo] (lines 1080-1087)
// ---------------------------------------------------------------------------

/**
 * Returns all outstanding (undelivered) maps.
 * [was: zwo]
 */
function getOutstandingMaps(channel) { // was: zwo
  if (channel.connectionState === 0) return channel.savedFailedMaps;
  let maps = [];
  extend(maps, getPoolPendingMaps(channel.connectionPool));
  extend(maps, channel.pendingMessages);
  return maps;
}

// ---------------------------------------------------------------------------
// buildBackChannelUri [was: dH1] (lines 1088-1099)
// ---------------------------------------------------------------------------

/**
 * Builds the URI for back-channel requests.
 * [was: dH1]
 */
function buildBackChannelUri(channel, subdomain, basePath) { // was: dH1
  let uri = ensureUri(basePath); // was: m = ensureUri(W)
  if (uri.host !== "") { // was: m.W != ""
    if (subdomain) g.oO(uri, subdomain + "." + uri.host);
    g.rC(uri, uri.port);
  } else {
    const loc = globalRef.location;
    uri = vNm(loc.protocol, subdomain ? subdomain + "." + loc.hostname : loc.hostname, +loc.port, basePath);
  }
  const sessionParam = channel.httpSessionIdParam; // was: c = Q.Ie
  const sessionValue = channel.httpSessionId; // was: W = Q.yY
  if (sessionParam && sessionValue) setUriQueryParam(uri, sessionParam, sessionValue);
  setUriQueryParam(uri, "VER", channel.protocolVersion);
  applyExtraHeaders(channel, uri);
  return uri;
}

// ---------------------------------------------------------------------------
// createXhr [was: iWa] (lines 1100-1108)
// ---------------------------------------------------------------------------

/**
 * Creates an XHR wrapper for channel requests.
 * [was: iWa]
 */
function createXhr(channel, subdomain, allowStreaming) { // was: iWa
  if (subdomain && !channel.useFetchStreaming) {
    throw Error("Can't create secondary domain capable XhrIo object.");
  }
  const xhr = channel.supportsCrossDomain && !channel.xmlHttpFactory
    ? new XhrIo(new XhrConfig({ Ac: allowStreaming }))
    : new XhrIo(channel.xmlHttpFactory); // was: new g.aY(Q.u3)
  xhr.J = channel.useFetchStreaming;
  return xhr;
}

// ---------------------------------------------------------------------------
// ChannelHandler (no-op base) [was: Cs0] (line 1109)
// ---------------------------------------------------------------------------

/**
 * Base (no-op) channel handler.
 * [was: Cs0]
 */
const ChannelHandler = function () {}; // was: Cs0
ChannelHandler.prototype.onSessionEstablished = function () {}; // was: gI
ChannelHandler.prototype.onMessage = function () {}; // was: Xl
ChannelHandler.prototype.onError = function () {}; // was: Da
ChannelHandler.prototype.onClose = function () {}; // was: hT
ChannelHandler.prototype.isActive = function () { return true; };
ChannelHandler.prototype.onBadMap = function () {}; // was: oZ

// ---------------------------------------------------------------------------
// ChannelHandlerAdapter (no-op base) [was: Mav] (line 1110)
// ---------------------------------------------------------------------------

/**
 * No-op adapter for channel handlers.
 * [was: Mav]
 */
const ChannelHandlerAdapter = function () {}; // was: Mav

// ---------------------------------------------------------------------------
// WebChannel [was: Ai] (lines 1111-1136)
// ---------------------------------------------------------------------------

/**
 * WebChannel wraps a BrowserChannel with higher-level messaging.
 * [was: Ai]
 *
 * @param {string} pathPrefix [was: Q]
 * @param {Object} [options] [was: c]
 */
const WebChannel = function (pathPrefix, options) { // was: Ai
  EventTargetBase.call(this);
  this.browserChannel = new BrowserChannel(options); // was: this.W = new vRv(c)
  this.pathPrefix = pathPrefix; // was: this.D = Q
  this.queryParams = options?.rejectPromise || null; // was: this.O = c && c.wc || null

  // Set up X-Client-Protocol header if requested
  let headers = options?.Wz || null; // was: Q = c && c.Wz || null
  if (options?.T6F) {
    headers = headers
      ? (headers["X-Client-Protocol"] = "webchannel", headers)
      : { "X-Client-Protocol": "webchannel" };
  }
  this.browserChannel.extraHeaders = headers; // was: this.W.Y = Q

  // Set up content-type and client-profile headers
  let initHeaders = options?.WnH || null;
  if (options?.My) {
    initHeaders = initHeaders
      ? (initHeaders["X-WebChannel-Content-Type"] = options.My, initHeaders)
      : { "X-WebChannel-Content-Type": options.My };
  }
  if (options?.clearRows) {
    initHeaders = initHeaders
      ? (initHeaders["X-WebChannel-Client-Profile"] = options.clearRows, initHeaders)
      : { "X-WebChannel-Client-Profile": options.clearRows };
  }
  this.browserChannel.channelHeaders = initHeaders; // was: this.W.EC = Q

  const encoding = options?.eWH;
  if (encoding && !isEmptyOrWhitespace(encoding)) this.browserChannel.initialHeaders = encoding;
  this.useStreaming = options?.isActivelyPlaying || false; // was: this.J
  this.serializeJson = options?.zpJ || false; // was: this.K

  const sessionIdParam = options?.Ok;
  if (sessionIdParam && !isEmptyOrWhitespace(sessionIdParam)) {
    this.browserChannel.httpSessionIdParam = sessionIdParam;
    if (hasKey(this.queryParams, sessionIdParam)) {
      delete this.queryParams[sessionIdParam];
    }
  }

  this.channelHandlerAdapter = new WebChannelHandler(this); // was: this.A = new Xj(this)
};

// ---------------------------------------------------------------------------
// WebChannelMessage [was: JGD] (lines 1137-1145)
// ---------------------------------------------------------------------------

/**
 * Event fired when a WebChannel message is received.
 * [was: JGD]
 */
const WebChannelMessage = function (data) { // was: JGD
  gp.call(this);
  if (data.__headers__) {
    this.headers = data.__headers__;
    this.statusCode = data.__status__;
    delete data.__headers__;
    delete data.__status__;
  }
  const serviceMessage = data.__sm__;
  if (serviceMessage) {
    this.data = (this.serviceMessageType = firstKey(serviceMessage))
      ? getWithDefault(serviceMessage, this.serviceMessageType) // was: this.W = g.bD(c)
      : serviceMessage;
  } else {
    this.data = data;
  }
};

// ---------------------------------------------------------------------------
// WebChannelError [was: Rw9] (lines 1146-1150)
// ---------------------------------------------------------------------------

/**
 * Event fired when a WebChannel error occurs.
 * [was: Rw9]
 */
const WebChannelError = function (NetworkErrorCode) { // was: Rw9
  OL.call(this);
  this.status = 1;
  this.NetworkErrorCode = NetworkErrorCode;
};

// ---------------------------------------------------------------------------
// WebChannelHandler [was: Xj] (lines 1151-1153)
// ---------------------------------------------------------------------------

/**
 * Adapts BrowserChannel handler events into WebChannel events.
 * [was: Xj]
 */
const WebChannelHandler = function (webChannel) { // was: Xj
  this.webChannel = webChannel; // was: this.W = Q
};

// ---------------------------------------------------------------------------
// ChannelDebugInfo [was: ep] (lines 1154-1157)
// ---------------------------------------------------------------------------

/**
 * Provides debug info about the channel connection.
 * [was: ep]
 */
const ChannelDebugInfo = function (webChannel, browserChannel) { // was: ep
  this.webChannel = webChannel; // was: this.j = Q
  this.browserChannel = browserChannel; // was: this.W = c
};

// ---------------------------------------------------------------------------
// Utility: Vx — setTimeout wrapper (lines 1158-1164)
// ---------------------------------------------------------------------------

/**
 * setTimeout wrapper that throws on non-function.
 * [was: Vx]
 */
function safeSetTimeout(fn, delayMs) { // was: Vx
  if (typeof fn !== "function") {
    throw Error("Fn must not be null and must be a function");
  }
  return globalRef.setTimeout(function () { fn(); }, delayMs);
}

// ---------------------------------------------------------------------------
// dispatchStatEvent [was: xr] (lines 1165-1167)
// ---------------------------------------------------------------------------

/**
 * Dispatches a stat event on the global stat event target.
 * [was: xr]
 */
function dispatchStatEvent() { // was: xr
  statEventTarget.dispatchEvent(new StatEvent()); // was: B$.dispatchEvent(new k$a)
}

// ---------------------------------------------------------------------------
// LegacyChannelRequest [was: qW] (lines 1168-1177)
// ---------------------------------------------------------------------------

/**
 * Legacy channel request (pre-WebChannel), used by ZD.
 * [was: qW]
 *
 * @param {LegacyBrowserChannel} channel [was: Q]
 * @param {string} sessionId [was: c]
 * @param {string|number} requestId [was: W]
 * @param {number} [retryAttempt] [was: m]
 */
const LegacyChannelRequest = function (channel, sessionId, requestId, retryAttempt) { // was: qW
  this.channel = channel; // was: this.W = Q
  this.sessionId = sessionId; // was: this.j = c
  this.requestId = requestId; // was: this.J = W
  this.attemptNumber = retryAttempt || 1; // was: this.D = m || 1
  this.requestTimeout = 45000; // was: this.O = 45E3
  this.eventHandler = new EventHandler(this); // was: this.A
  this.pollingTimer = new Timer(); // was: this.K = new g.DE
  this.pollingTimer.setInterval(250);
};

// Legacy request prototype fields
LegacyChannelRequest.prototype.requestHeaders = null; // was: uG
LegacyChannelRequest.prototype.succeeded = false; // was: W4
LegacyChannelRequest.prototype.watchdogTimerId = null; // was: ST
LegacyChannelRequest.prototype.watchdogDeadline = null; // was: Vx
LegacyChannelRequest.prototype.startTime = null; // was: Jg
LegacyChannelRequest.prototype.requestType = null; // was: kD
LegacyChannelRequest.prototype.requestUri = null; // was: kV
LegacyChannelRequest.prototype.adjustedUri = null; // was: Xh
LegacyChannelRequest.prototype.postBody = null; // was: hD
LegacyChannelRequest.prototype.xhr = null; // was: hI
LegacyChannelRequest.prototype.parseOffset = 0; // was: Hr
LegacyChannelRequest.prototype.responseData = null; // was: Jc
LegacyChannelRequest.prototype.httpMethod = null; // was: gK
LegacyChannelRequest.prototype.lastError = null; // was: YC
LegacyChannelRequest.prototype.statusCode = -1; // was: HQ
LegacyChannelRequest.prototype.keepConnectionOpen = true; // was: L9 = !0
LegacyChannelRequest.prototype.cancelled = false; // was: gY = !1
LegacyChannelRequest.prototype.throttleCount = 0; // was: ob
LegacyChannelRequest.prototype.throttleTimer = null; // was: Dd

// Sentinels for legacy parsing
const LEGACY_INVALID = {}; // was: QYo
const LEGACY_INCOMPLETE = {}; // was: ti

// ---------------------------------------------------------------------------
// initiateLegacyForwardRequest [was: pO9] (lines 1178-1183)
// ---------------------------------------------------------------------------

/**
 * Initiates a legacy forward-channel request (POST).
 * [was: pO9]
 */
function initiateLegacyForwardRequest(request, uri, postBody) { // was: pO9
  request.requestType = 1; // was: Q.kD = 1
  request.requestUri = prepareUri(uri.clone()); // was: Q.kV = T8(c.clone())
  request.postBody = postBody; // was: Q.hD = W
  request.isStreaming = true; // was: Q.Ie = !0
  sendLegacyRequest(request, null); // was: Y79(Q, null)
}

// ---------------------------------------------------------------------------
// initiateLegacyRequest [was: nT] (lines 1185-1191)
// ---------------------------------------------------------------------------

/**
 * Initiates a legacy channel request with optional streaming and keepalive.
 * [was: nT]
 */
function initiateLegacyRequest(request, uri, isStreaming, subdomain, closeConnection) { // was: nT
  request.requestType = 1;
  request.requestUri = prepareUri(uri.clone());
  request.postBody = null;
  request.isStreaming = isStreaming; // was: Q.Ie = W
  if (closeConnection) request.keepConnectionOpen = false; // was: K && (Q.L9 = !1)
  sendLegacyRequest(request, subdomain);
}

// ---------------------------------------------------------------------------
// sendLegacyRequest [was: Y79] (lines 1193-1210)
// ---------------------------------------------------------------------------

/**
 * Sends the actual HTTP request for a legacy channel request.
 * [was: Y79]
 */
function sendLegacyRequest(request, subdomain) { // was: Y79
  request.startTime = Date.now(); // was: Q.Jg = Date.now()
  resetLegacyWatchdog(request); // was: DD(Q)
  request.adjustedUri = request.requestUri.clone(); // was: Q.Xh = Q.kV.clone()
  ot(request.adjustedUri, "t", request.attemptNumber); // was: ot(Q.Xh, "t", Q.D)
  request.parseOffset = 0; // was: Q.Hr = 0

  request.xhr = request.channel.createXhr(request.channel.useSecondaryDomain() ? subdomain : null); // was: Q.hI = Q.W.Yd(Q.W.sF() ? c : null)

  if (request.throttleCount > 0) {
    request.throttleTimer = new DelayedCall(
      (0, bind)(request.onDataReceived, request, request.xhr),
      request.throttleCount
    );
  }

  request.eventHandler.listen(request.xhr, "readystatechange", request.onReadyStateChange); // was: Q.A.listen(Q.hI, "readystatechange", Q.nG)

  const headers = request.requestHeaders ? shallowClone(request.requestHeaders) : {};
  if (request.postBody) {
    request.httpMethod = "POST";
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    request.xhr.send(request.adjustedUri, request.httpMethod, request.postBody, headers);
  } else {
    request.httpMethod = "GET";
    if (request.keepConnectionOpen && !g.xG) {
      headers.Connection = "close";
    }
    request.xhr.send(request.adjustedUri, request.httpMethod, null, headers);
  }
  request.channel.onServerReachability(1); // was: Q.W.jb(1)
}

// ---------------------------------------------------------------------------
// parseLegacyChunk [was: czD] (lines 1211-1225)
// ---------------------------------------------------------------------------

/**
 * Parses a length-prefixed chunk from legacy channel response text.
 * [was: czD]
 */
function parseLegacyChunk(request, responseText) { // was: czD
  let offset = request.parseOffset;
  const newlineIndex = responseText.indexOf("\n", offset);
  if (newlineIndex === -1) return LEGACY_INCOMPLETE; // was: ti

  const chunkLength = Number(responseText.substring(offset, newlineIndex));
  if (isNaN(chunkLength)) return LEGACY_INVALID; // was: QYo

  const dataStart = newlineIndex + 1;
  if (dataStart + chunkLength > responseText.length) return LEGACY_INCOMPLETE;

  const chunk = responseText.slice(dataStart, dataStart + chunkLength);
  request.parseOffset = dataStart + chunkLength;
  return chunk;
}

// ---------------------------------------------------------------------------
// resetLegacyWatchdog [was: DD] (lines 1226-1229)
// ---------------------------------------------------------------------------

function resetLegacyWatchdog(request) { // was: DD
  request.watchdogDeadline = Date.now() + request.requestTimeout; // was: Q.Vx
  startLegacyWatchdog(request, request.requestTimeout);
}

// ---------------------------------------------------------------------------
// startLegacyWatchdog [was: WN4] (lines 1230-1235)
// ---------------------------------------------------------------------------

function startLegacyWatchdog(request, delayMs) { // was: WN4
  if (request.watchdogTimerId != null) throw Error("WatchDog timer not null");
  request.watchdogTimerId = safeSetTimeout(
    (0, bind)(request.onWatchdogTimeout, request),
    delayMs
  );
}

// ---------------------------------------------------------------------------
// clearLegacyWatchdog [was: mAa] (lines 1236-1239)
// ---------------------------------------------------------------------------

function clearLegacyWatchdog(request) { // was: mAa
  if (request.watchdogTimerId) {
    globalRef.clearTimeout(request.watchdogTimerId);
    request.watchdogTimerId = null;
  }
}

// ---------------------------------------------------------------------------
// notifyLegacyComplete [was: H$] (lines 1240-1242)
// ---------------------------------------------------------------------------

function notifyLegacyComplete(request) { // was: H$
  if (!request.channel.isClosed() && !request.cancelled) { // was: Q.W.NK() || Q.gY
    request.channel.onRequestComplete(request); // was: Q.W.Rb(Q)
  }
}

// ---------------------------------------------------------------------------
// cancelLegacyRequest [was: NW] (lines 1243-1256)
// ---------------------------------------------------------------------------

function cancelLegacyRequest(request) { // was: NW
  clearLegacyWatchdog(request);
  safeDispose(request.throttleTimer);
  request.throttleTimer = null;
  request.pollingTimer.stop(); // was: Q.K.stop()
  request.eventHandler.removeAll();
  if (request.xhr) {
    const xhr = request.xhr;
    request.xhr = null;
    xhr.abort();
    xhr.dispose();
  }
  if (request.responseData) request.responseData = null; // was: Q.Jc
}

// ---------------------------------------------------------------------------
// processLegacyData [was: KNm] (lines 1257-1262)
// ---------------------------------------------------------------------------

function processLegacyData(request, data) { // was: KNm
  try {
    request.channel.onDataReceived(request, data); // was: Q.W.JT(Q, c)
    request.channel.onServerReachability(4); // was: Q.W.jb(4)
  } catch (_e) { /* swallow */ }
}

// ---------------------------------------------------------------------------
// retryImagePing [was: ouW] (lines 1263-1275)
// ---------------------------------------------------------------------------

/**
 * Retries a reachability image ping with exponential backoff.
 * [was: ouW]
 */
function retryImagePing(url, timeout, callback, maxRetries, retryDelay) { // was: ouW
  if (maxRetries === 0) {
    callback(false);
  } else {
    const currentDelay = retryDelay || 0;
    maxRetries--;
    loadImageForTest(url, timeout, function (success) { // was: TVi
      if (success) {
        callback(true);
      } else {
        globalRef.setTimeout(function () {
          retryImagePing(url, timeout, callback, maxRetries, currentDelay);
        }, currentDelay);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// loadImageForTest [was: TVi] (lines 1276-1311)
// ---------------------------------------------------------------------------

/**
 * Loads an image to test network reachability.
 * [was: TVi]
 */
function loadImageForTest(url, timeout, callback) { // was: TVi
  const img = new Image();
  img.onload = function () {
    try { clearImageHandlers(img); callback(true); } catch (_e) { /* swallow */ }
  };
  img.onerror = function () {
    try { clearImageHandlers(img); callback(false); } catch (_e) { /* swallow */ }
  };
  img.onabort = function () {
    try { clearImageHandlers(img); callback(false); } catch (_e) { /* swallow */ }
  };
  img.ontimeout = function () {
    try { clearImageHandlers(img); callback(false); } catch (_e) { /* swallow */ }
  };
  globalRef.setTimeout(function () {
    if (img.ontimeout) img.ontimeout();
  }, timeout);
  img.src = url;
}

// ---------------------------------------------------------------------------
// clearImageHandlers [was: ie] (lines 1312-1317)
// ---------------------------------------------------------------------------

function clearImageHandlers(img) { // was: ie
  img.onload = null;
  img.onerror = null;
  img.onabort = null;
  img.ontimeout = null;
}

// ---------------------------------------------------------------------------
// LoungeTransport [was: rzv] (lines 1318-1328)
// ---------------------------------------------------------------------------

/**
 * Transport layer for lounge session establishment.
 * Handles initial test phase, fallback, and connection handshake.
 * [was: rzv]
 *
 * @param {LegacyBrowserChannel} channel [was: Q]
 */
const LoungeTransport = function (channel) { // was: rzv
  this.channel = channel; // was: this.W = Q
  this.jsonCodec = new JsonCodec(); // was: this.O = new oJ
};

LoungeTransport.prototype.requestHeaders = null; // was: SH
LoungeTransport.prototype.testRequest = null; // was: eM
LoungeTransport.prototype.hostPrefixVerified = false; // was: In
LoungeTransport.prototype.testPath = null; // was: Ff
LoungeTransport.prototype.testPhase = null; // was: YA
LoungeTransport.prototype.statusCode = -1; // was: Q_
LoungeTransport.prototype.hostPrefix = null; // was: JN
LoungeTransport.prototype.hostSuffix = null; // was: Tu

// ---------------------------------------------------------------------------
// LoungeTransport connect / lifecycle (lines ~3987-4089)
// ---------------------------------------------------------------------------

LoungeTransport.prototype.connect = function (testPath) { // was: connect
  this.testPath = testPath;
  const uri = buildLegacyUri(this.channel, null, this.testPath); // was: yx(this.W, null, this.Ff)
  dispatchStatEvent();
  Date.now();

  const probeHeaders = this.channel.probeHeaders; // was: c = this.W.Y
  if (probeHeaders != null) {
    this.hostPrefix = probeHeaders[0]; // was: this.JN = c[0]
    this.hostSuffix = probeHeaders[1]; // was: (this.Tu = c[1])
    if (this.hostSuffix) {
      this.testPhase = 1; // was: this.YA = 1
      startImagePingTest(this); // was: UAi(this)
    } else {
      this.testPhase = 2; // was: this.YA = 2
      startBackChannelTest(this); // was: Fj(this)
    }
  } else {
    ot(uri, "MODE", "init");
    this.testRequest = new LegacyChannelRequest(this); // was: this.eM = new qW(this)
    this.testRequest.requestHeaders = this.requestHeaders;
    initiateLegacyRequest(this.testRequest, uri, false, null, true);
    this.testPhase = 0;
  }
};

// ---------------------------------------------------------------------------
// startImagePingTest [was: UAi] (lines 1322-1328)
// ---------------------------------------------------------------------------

function startImagePingTest(transport) { // was: UAi
  const uri = buildLegacyUri(transport.channel, transport.hostSuffix, "/mail/images/cleardot.gif"); // was: yx(Q.W, Q.Tu, ...)
  prepareUri(uri);
  retryImagePing(
    uri.toString(), 5000,
    (0, bind)(transport.onImagePingResult, transport),
    3, 2000
  );
  transport.onServerReachability(1); // was: Q.jb(1)
}

// ---------------------------------------------------------------------------
// startBackChannelTest [was: Fj] (lines 1329-1341)
// ---------------------------------------------------------------------------

function startBackChannelTest(transport) { // was: Fj
  const isBuffering = transport.channel.isBuffering; // was: c = Q.W.D
  if (isBuffering != null) {
    dispatchStatEvent();
    if (isBuffering) {
      dispatchStatEvent();
      initializeChannel(transport.channel, transport, false); // was: Sp(Q.W, Q, !1)
    } else {
      dispatchStatEvent();
      initializeChannel(transport.channel, transport, true);
    }
  } else {
    transport.testRequest = new LegacyChannelRequest(transport);
    transport.testRequest.requestHeaders = transport.requestHeaders;
    const channel = transport.channel;
    const uri = buildLegacyUri(channel, channel.useSecondaryDomain() ? transport.hostPrefix : null, transport.testPath);
    dispatchStatEvent();
    ot(uri, "TYPE", "xmlhttp");
    initiateLegacyRequest(transport.testRequest, uri, false, transport.hostPrefix, false);
  }
}

// ---------------------------------------------------------------------------
// LegacyBrowserChannel [was: ZD] (lines 1342-1350)
// ---------------------------------------------------------------------------

/**
 * Legacy BrowserChannel implementation using map-based messaging.
 * [was: ZD]
 *
 * @param {*} [firstTestResults] [was: Q]
 * @param {*} [secondTestResults] [was: c]
 * @param {boolean} [useConnectionClose] [was: W]
 */
const LegacyBrowserChannel = function (firstTestResults, secondTestResults, useConnectionClose) { // was: ZD
  this.state = 1; // was: this.W = 1
  this.pendingMaps = []; // was: this.O = []
  this.sentMaps = []; // was: this.A = []
  this.jsonCodec = new JsonCodec(); // was: this.K = new oJ
  this.firstTestResults = firstTestResults || null; // was: this.Y = Q || null
  this.secondTestResults = secondTestResults != null ? secondTestResults : null; // was: this.D
  this.useConnectionClose = useConnectionClose || false; // was: this.L = W || !1
};

// ---------------------------------------------------------------------------
// MapEntry [was: IEo] (lines 1351-1355)
// ---------------------------------------------------------------------------

/**
 * An entry in the pending map queue.
 * [was: IEo]
 */
const MapEntry = function (mapId, map) { // was: IEo
  this.mapId = mapId; // was: this.W = Q
  this.map = map; // was: this.map = c
  this.context = null;
};

// ---------------------------------------------------------------------------
// TimingEvent [was: XJH] (lines 1356-1361)
// ---------------------------------------------------------------------------

/**
 * Event dispatched with timing information for a forward channel request.
 * [was: XJH]
 */
const TimingEvent = function (target, size, rtt, retries) { // was: XJH
  DomEvent.call(this, "timingevent", target);
  this.size = size;
  this.rtt = rtt;
  this.retries = retries;
};

// ---------------------------------------------------------------------------
// ServerReachabilityEvent [was: Aza] (lines 1362-1364)
// ---------------------------------------------------------------------------

const ServerReachabilityEvent = function (target) { // was: Aza
  DomEvent.call(this, "serverreachability", target);
};

// ---------------------------------------------------------------------------
// Legacy channel start / connect / disconnect (lines 1365-1547)
// ---------------------------------------------------------------------------

/**
 * Starts the legacy channel (creates transport, initiates connection).
 * [was: eh9]
 */
function startLegacyChannel(channel) { // was: eh9
  channel.validateState(1, 0); // was: Q.YF(1, 0)
  channel.baseUri = buildLegacyUri(channel, null, channel.basePath); // was: Q.l_ = yx(Q, null, Q.m0)
  scheduleLegacyForwardChannel(channel); // was: Eq(Q)
}

/**
 * Cancels all outstanding legacy channel requests.
 * [was: VHD]
 */
function cancelAllLegacyRequests(channel) { // was: VHD
  if (channel.transport) { channel.transport.abort(); channel.transport = null; }
  if (channel.backChannelRequest) { channel.backChannelRequest.cancel(); channel.backChannelRequest = null; }
  if (channel.backChannelRetryTimer) { globalRef.clearTimeout(channel.backChannelRetryTimer); channel.backChannelRetryTimer = null; }
  clearLegacyBackChannel(channel); // was: sq(Q)
  if (channel.forwardChannelRequest) { channel.forwardChannelRequest.cancel(); channel.forwardChannelRequest = null; }
  if (channel.forwardChannelRetryTimer) { globalRef.clearTimeout(channel.forwardChannelRetryTimer); channel.forwardChannelRetryTimer = null; }
}

/**
 * Enqueues a map for sending.
 * [was: dN]
 */
function sendMap(channel, map) { // was: dN
  if (channel.state === 0) throw Error("Invalid operation: sending map when state is closed");
  channel.pendingMaps.push(new MapEntry(channel.mapIdCounter++, map));
  if (channel.state === 2 || channel.state === 3) scheduleLegacyForwardChannel(channel);
}

/**
 * Returns count of active forward+back requests.
 * [was: BV4]
 */
function getActiveRequestCount(channel) { // was: BV4
  let count = 0;
  if (channel.backChannelRequest) count++;
  if (channel.forwardChannelRequest) count++;
  return count;
}

/**
 * Schedules the forward channel send.
 * [was: Eq]
 */
function scheduleLegacyForwardChannel(channel) { // was: Eq
  if (!channel.forwardChannelRequest && !channel.forwardChannelRetryTimer) {
    channel.forwardChannelRetryTimer = safeSetTimeout(
      (0, bind)(channel.onForwardChannelReady, channel),
      0
    );
    channel.forwardChannelRetryCount = 0;
  }
}

/**
 * Processes forward channel — either initial handshake or data send.
 * [was: q_W]
 */
function processForwardChannel(channel, failedRequest) { // was: q_W
  if (channel.state === 1) {
    if (!failedRequest) {
      channel.mapIdCounter = Math.floor(Math.random() * 100000);
      const requestId = channel.mapIdCounter++;
      const request = new LegacyChannelRequest(channel, "", requestId);
      request.requestHeaders = channel.initialHeaders;
      const postBody = serializeLegacyMaps(channel);
      const uri = channel.baseUri.clone();
      setUriQueryParam(uri, "RID", requestId);
      setUriQueryParam(uri, "CVER", "1");
      applyLegacyHeaders(channel, uri);
      initiateLegacyForwardRequest(request, uri, postBody);
      channel.forwardChannelRequest = request;
      channel.state = 2;
    }
  } else if (channel.state === 3) {
    if (failedRequest) {
      sendLegacyForwardRequest(channel, failedRequest);
    } else if (channel.pendingMaps.length === 0 || channel.forwardChannelRequest) {
      // nothing to send or already in flight
    } else {
      sendLegacyForwardRequest(channel);
    }
  }
}

/**
 * Sends a legacy forward channel request with maps.
 * [was: xAH]
 */
function sendLegacyForwardRequest(channel, failedRequest) { // was: xAH
  let requestId, postBody;

  if (failedRequest) {
    if (channel.protocolVersion > 6) {
      channel.pendingMaps = channel.sentMaps.concat(channel.pendingMaps);
      channel.sentMaps.length = 0;
      requestId = channel.mapIdCounter - 1;
      postBody = serializeLegacyMaps(channel);
    } else {
      requestId = failedRequest.requestId; // was: W = c.J
      postBody = failedRequest.postBody;
    }
  } else {
    requestId = channel.mapIdCounter++;
    postBody = serializeLegacyMaps(channel);
  }

  const uri = channel.baseUri.clone();
  setUriQueryParam(uri, "SID", channel.sessionId);
  setUriQueryParam(uri, "RID", requestId);
  setUriQueryParam(uri, "AID", channel.lastAcknowledgedArrayId);
  applyLegacyHeaders(channel, uri);

  const request = new LegacyChannelRequest(channel, channel.sessionId, requestId, channel.forwardChannelRetryCount + 1);
  request.requestHeaders = channel.initialHeaders;
  request.setTimeout(10000 + Math.round(10000 * Math.random()));
  channel.forwardChannelRequest = request;
  initiateLegacyForwardRequest(request, uri, postBody);
}

/**
 * Applies legacy headers to a URI.
 * [was: wN]
 */
function applyLegacyHeaders(channel, uri) { // was: wN
  if (channel.handler) {
    const headers = channel.handler.getHeaders(); // was: Q.Ws.Nn()
    if (headers) {
      forEachObject(headers, function (value, key) {
        setUriQueryParam(uri, key, value);
      });
    }
  }
}

/**
 * Serializes pending maps into URL-encoded string (legacy format).
 * [was: LT]
 */
function serializeLegacyMaps(channel) { // was: LT
  const count = Math.min(channel.pendingMaps.length, 1000);
  const parts = ["count=" + count];
  let baseOffset;

  if (channel.protocolVersion > 6 && count > 0) {
    baseOffset = channel.pendingMaps[0].mapId;
    parts.push("ofs=" + baseOffset);
  } else {
    baseOffset = 0;
  }

  for (let i = 0; i < count; i++) {
    let relativeId = channel.pendingMaps[i].mapId;
    const mapData = channel.pendingMaps[i].map;
    relativeId = channel.protocolVersion <= 6 ? i : relativeId - baseOffset;

    try {
      forEachObject(mapData, function (value, key) {
        parts.push("req" + relativeId + "_" + key + "=" + encodeURIComponent(value));
      });
    } catch (_e) {
      parts.push("req" + relativeId + "_type=" + encodeURIComponent("_badmap"));
    }
  }

  channel.sentMaps = channel.sentMaps.concat(channel.pendingMaps.splice(0, count));
  return parts.join("&");
}

/**
 * Starts the legacy back channel.
 * [was: nuS]
 */
function startLegacyBackChannel(channel) { // was: nuS
  if (!channel.backChannelRequest && !channel.backChannelRetryTimer) {
    channel.attemptNumber = 1; // was: Q.J = 1
    channel.backChannelRetryTimer = safeSetTimeout(
      (0, bind)(channel.onBackChannelReady, channel),
      0
    );
    channel.backChannelRetryCount = 0; // was: Q.RV = 0
  }
}

/**
 * Retries the legacy back channel.
 * [was: be]
 */
function retryLegacyBackChannel(channel) { // was: be
  if (channel.backChannelRequest || channel.backChannelRetryTimer || channel.backChannelRetryCount >= 3) {
    return false;
  }
  channel.attemptNumber++;
  channel.backChannelRetryTimer = safeSetTimeout(
    (0, bind)(channel.onBackChannelReady, channel),
    computeLegacyRetryDelay(channel, channel.backChannelRetryCount)
  );
  channel.backChannelRetryCount++;
  return true;
}

/**
 * Initializes the channel after transport test completes.
 * [was: Sp]
 */
function initializeChannel(channel, transport, isBuffering) { // was: Sp
  channel.useBuffering = channel.isBuffering == null ? isBuffering : !channel.isBuffering; // was: Q.jH = Q.D == null ? W : !Q.D
  channel.serverReachabilityStatus = transport.statusCode; // was: Q.Rp = c.Q_
  if (!channel.useConnectionClose) startLegacyChannel(channel); // was: Q.L || eh9(Q)
}

/**
 * Clears the legacy stale back-channel timer.
 * [was: sq]
 */
function clearLegacyBackChannel(channel) { // was: sq
  if (channel.staleBackChannelTimer != null) {
    globalRef.clearTimeout(channel.staleBackChannelTimer);
    channel.staleBackChannelTimer = null;
  }
}

/**
 * Computes retry delay for legacy channels.
 * [was: DAS]
 */
function computeLegacyRetryDelay(channel, retryCount) { // was: DAS
  let delay = 5000 + Math.floor(Math.random() * 10000);
  if (!channel.isActive()) delay *= 2;
  return delay * retryCount;
}

/**
 * Disconnects the legacy channel with an error.
 * [was: jp]
 */
function disconnectLegacy(channel, NetworkErrorCode) { // was: jp
  if (NetworkErrorCode === 2 || NetworkErrorCode === 9) {
    let pingUrl = null;
    if (channel.handler) pingUrl = null; // was: Q.Ws && (W = null)
    const callback = (0, bind)(channel.onReachabilityResult, channel);
    if (!pingUrl) {
      pingUrl = new Uri("//www.google.com/images/cleardot.gif");
      prepareUri(pingUrl);
    }
    loadImageForTest(pingUrl.toString(), 10000, callback);
  } else {
    dispatchStatEvent();
  }
  resetLegacyState(channel, NetworkErrorCode); // was: tHi(Q, c)
}

/**
 * Resets the legacy channel state after disconnect.
 * [was: tHi]
 */
function resetLegacyState(channel, NetworkErrorCode) { // was: tHi
  channel.state = 0;
  if (channel.handler) channel.handler.onDisconnected(NetworkErrorCode); // was: Q.Ws.LV(c)
  resetLegacyMaps(channel); // was: HOZ(Q)
  cancelAllLegacyRequests(channel);
}

/**
 * Saves undelivered maps and notifies close.
 * [was: HOZ]
 */
function resetLegacyMaps(channel) { // was: HOZ
  channel.state = 0;
  channel.serverReachabilityStatus = -1;
  if (channel.handler) {
    if (channel.sentMaps.length === 0 && channel.pendingMaps.length === 0) {
      channel.handler.onClosed(); // was: Q.Ws.b8()
    } else {
      const sent = toArray(channel.sentMaps);
      const pending = toArray(channel.pendingMaps);
      channel.sentMaps.length = 0;
      channel.pendingMaps.length = 0;
      channel.handler.onClosed(sent, pending);
    }
  }
}

/**
 * Builds a URI for legacy channel communication.
 * [was: yx]
 */
function buildLegacyUri(channel, subdomain, path) { // was: yx
  let uri = ensureUri(path);
  if (uri.host !== "") { // was: m.W != ""
    if (subdomain) g.oO(uri, subdomain + "." + uri.host);
    g.rC(uri, uri.port);
  } else {
    const loc = window.location;
    uri = vNm(loc.protocol, subdomain ? subdomain + "." + loc.hostname : loc.hostname, +loc.port, path);
  }
  if (channel.extraParams) {
    forEachObject(channel.extraParams, function (value, key) {
      setUriQueryParam(uri, key, value);
    });
  }
  setUriQueryParam(uri, "VER", channel.protocolVersion);
  applyLegacyHeaders(channel, uri);
  return uri;
}

// ---------------------------------------------------------------------------
// Sentinel constants
// ---------------------------------------------------------------------------

/** Sentinel: chunk response incomplete [was: Cx] */
const INCOMPLETE = {}; // was: Cx

/** Sentinel: chunk response invalid format [was: FZS] */
const INVALID = {}; // was: FZS

// ---------------------------------------------------------------------------
// JsonCodec [was: oJ] (lines 3468-3475)
// ---------------------------------------------------------------------------

const JsonCodec = class {
  stringify(value) { // was: stringify
    return globalRef.JSON.stringify(value, undefined);
  }
  parse(text) { // was: parse
    return globalRef.JSON.parse(text, undefined);
  }
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  scheduleTimeout,
  NoOpLogger,
  ChannelRequest,
  ChunkedDecoder,
  initiateForwardChannelRequest,
  sendChannelRequest,
  getResponseText,
  isStreamingRequest,
  parseNextChunk,
  resetWatchdog,
  startWatchdogTimer,
  clearWatchdog,
  notifyRequestComplete,
  cancelRequest,
  processChannelData,
  ConnectionPool,
  isPoolFull,
  getPoolSize,
  isInPool,
  addToPool,
  removeFromPool,
  getPoolPendingMaps,
  testLoadImage,
  testPingServer,
  handleTestResult,
  JsonParserWrapper,
  getConfigValue,
  BrowserChannel,
  cancelBackChannel,
  cancelAllRequests,
  sendForwardChannel,
  tryForwardChannelRetry,
  createForwardChannelRequest,
  applyExtraHeaders,
  serializePendingMaps,
  startBackChannel,
  retryBackChannel,
  clearBackChannelTimer,
  createBackChannelRequest,
  clearBackChannel,
  handleRequestCompletion,
  computeRetryDelay,
  disconnectWithError,
  resetChannelState,
  getOutstandingMaps,
  buildBackChannelUri,
  createXhr,
  ChannelHandler,
  ChannelHandlerAdapter,
  WebChannel,
  WebChannelMessage,
  WebChannelError,
  WebChannelHandler,
  ChannelDebugInfo,
  safeSetTimeout,
  dispatchStatEvent,
  LegacyChannelRequest,
  LEGACY_INVALID,
  LEGACY_INCOMPLETE,
  initiateLegacyForwardRequest,
  initiateLegacyRequest,
  sendLegacyRequest,
  parseLegacyChunk,
  resetLegacyWatchdog,
  startLegacyWatchdog,
  clearLegacyWatchdog,
  notifyLegacyComplete,
  cancelLegacyRequest,
  processLegacyData,
  retryImagePing,
  loadImageForTest,
  clearImageHandlers,
  LoungeTransport,
  startImagePingTest,
  startBackChannelTest,
  LegacyBrowserChannel,
  MapEntry,
  TimingEvent,
  ServerReachabilityEvent,
  startLegacyChannel,
  cancelAllLegacyRequests,
  sendMap,
  getActiveRequestCount,
  scheduleLegacyForwardChannel,
  processForwardChannel,
  sendLegacyForwardRequest,
  applyLegacyHeaders,
  serializeLegacyMaps,
  startLegacyBackChannel,
  retryLegacyBackChannel,
  initializeChannel,
  clearLegacyBackChannel,
  computeLegacyRetryDelay,
  disconnectLegacy,
  resetLegacyState,
  resetLegacyMaps,
  buildLegacyUri,
  INCOMPLETE,
  INVALID,
  JsonCodec,
};
