/**
 * GEL (Google Event Logging) Core — setup, namespace registration, event
 * subscription, callback management, Innertube context/config helpers,
 * networkless logging infrastructure, and config parameter construction.
 *
 * Source: base.js lines 13361–14989
 *
 * Coverage map:
 *   13361-13437  Context-enrichment helpers (ECw, sPx, d60, LKd, w__, bVX)
 *   13438-13528  PubSub2 serialisation / subscription (E3, s3, Lq, Gp7, lZy, P7O, dU)
 *   13529-13604  GEL compression + CSI (jl, gU, JoR, ug_)
 *   13605-13692  Networkless request controller setup (O3, RQd, fq, p_0, kpX, YBX, Q$x)
 *   13693-13815  IndexedDB log-store helpers (au, WEX, mqx, KEK, TGK, olO, rQd, Uqy, cQK)
 *   13816-13937  SW health log + ping transport (Xk7, AQy, eK_, g.GU, qSO, xqy, Vj7, DqW)
 *   13938-13995  Offline error cache, network monitor singletons (uV, tjd, H0y, NGO, i07, Cq, SSK)
 *   13996-14095  Request dispatch helpers (FE3, Me, g.JD)
 *   14097-14165  Legacy pubsub (g.Qp, Ely, g.cm, g.Wm, dq7, g.Ru, s$x)
 *   14166-14238  Script loader, deep equality (g.mD, LE0, j$w, wk7, KL)
 *   14239-14276  Deep merge utilities (rr, o7, glK, Tf, Up)
 *   14277-14390  Touch tracking, random bytes, activity tracker (O0y, Xx, g.Ab, g.fd7, adR, vl0, Vp, eI, YW)
 *   14392-14455  DI container (qg, nL, tb, GO7, Ng, ld7)
 *   14457-14507  Performance tracing (yp, SI, uV0, hK0, Cy3)
 *   14510-14602  Lifecycle / callback scheduling (kOX, Mj3, JQR, RKO, Fx, sp, Zu, Qk7, cF3, Wgx)
 *   14605-14989  GEL batch dispatch, IMS store, payload routing (Op, gr, jI, vm, Ts7, AF3, VbK,
 *                Xhm, I9x, eJK, $1, CL, DNR, Bs7, xN7, qJx)
 *
 * Lines 13292-13360 (ZVy, g.Ne, g.iV) are already covered in
 *   network/innertube-client.js
 *
 * @module data/gel-core
 */

import { getConnectionType, getEffectiveConnectionType, getWebDisplayMode } from '../core/attestation.js';  // was: g.nHw, g.tyx, g.AN
import { isScriptLoaded, listen, markScriptLoaded, resolvedPromise } from '../core/composition-helpers.js';  // was: g.Ygn, g.s7, g.k0n, g.QU
import { forEach } from '../core/event-registration.js';  // was: g.mfm
import { LifecycleStateMachine, safeInvoke } from '../core/scheduler.js';  // was: g.pkK, g.Zu
import { buildAuthHeaders, buildInnertubeContext, getInnertubeConfig } from '../network/innertube-client.js';  // was: g.fZ7, g.iV, g.Ne
import { optional } from '../network/innertube-config.js';  // was: g.qg
import { sendPostRequest, sendXhrRequest } from '../network/request.js';  // was: g.ms, g.Wn
import { appendQueryParams } from '../network/service-endpoints.js';  // was: g.fe
import { win } from '../proto/messages-core.js';  // was: g.bI
import { NetworkStatusManager } from './idb-operations.js';  // was: g.zU
import { createIndex, createObjectStore, deleteDatabase, getExperimentsToken, iterateCursor, openDatabase } from './idb-transactions.js';  // was: g.ks, g.JN, g.WF, g.pe, g.zE, g.zB7
import { shouldUseDesktopControls } from './bandwidth-tracker.js'; // was: tx
import { ReentrantChannel } from './device-tail.js'; // was: tc
import { getSlotState } from '../ads/ad-scheduling.js'; // was: zA
import { FlushTimer } from './logger-init.js'; // was: ncn
import { getSubMessage, setSubMessage, setRepeatedField } from '../proto/wire-format.js';
import { toString, contains, endsWith, hashCode } from '../core/string-utils.js';
import { toArray, clear, filter } from '../core/array-utils.js';
import { handleError } from '../player/context-updates.js';
import { getQueryParam } from '../core/url-utils.js';
import { createElement, getElementsByTagName } from '../core/dom-utils.js';
import { deepClone } from '../core/object-utils.js';

// ===========================================================================
// Context-enrichment helpers (lines 13361-13437)
// ===========================================================================

/**
 * Sets the `mainAppWebInfo.webDisplayMode` field on the Innertube context.
 * Only applies when the client is WEB (1) or MWEB (2).
 * [was: ECw]
 *
 * @param {object} config   - Innertube config [was: Q]
 * @param {object|undefined} protoMsg - Proto message (binary path) [was: c]
 * @param {object} context  - JSON context to populate [was: W]
 */
export function setWebDisplayMode(config, protoMsg, context = {}) { // was: ECw
  const clientName = config.clientName; // was: Q.rT
  if (clientName === 'WEB' || clientName === 'MWEB' || clientName === 1 || clientName === 2) {
    if (protoMsg) {
      // Binary proto path
      let webInfo = getSubMessage(protoMsg, WebInfoProto, 96) || new WebInfoProto(); // was: w_(c, yb, 96)
      const displayMode = getWebDisplayMode(); // was: AN()
      const modeIndex = Object.keys(WEB_DISPLAY_MODE_MAP).indexOf(displayMode); // was: jPW
      const enumValue = modeIndex === -1 ? null : modeIndex;
      if (enumValue !== null) {
        setInt32Field(webInfo, 3, enumValue); // was: H_(W, 3, Q)
      }
      setSubMessage(protoMsg, WebInfoProto, 96, webInfo); // was: ry(c, yb, 96, W)
    } else if (context) {
      context.client.mainAppWebInfo = context.client.mainAppWebInfo ?? {};
      context.client.mainAppWebInfo.webDisplayMode = getWebDisplayMode(); // was: AN()
    }
  }
}

/**
 * Sets the `thirdParty.embedUrl` field when running inside an embed.
 * [was: sPx]
 *
 * @param {object|undefined} protoMsg [was: Q]
 * @param {object} context            [was: c]
 */
export function setEmbedUrl(protoMsg, context) { // was: sPx
  const embedUrl = getGlobal('yt.embedded_player.embed_url'); // was: g.DR(...)
  if (embedUrl) {
    if (protoMsg) {
      const thirdParty = getSubMessage(protoMsg, ThirdPartyProto, 7) || new ThirdPartyProto(); // was: Sl
      setStringField(thirdParty, 4, embedUrl); // was: DZ(c, 4, W)
      setSubMessage(protoMsg, ThirdPartyProto, 7, thirdParty); // was: ry(Q, Sl, 7, c)
    } else if (context) {
      context.thirdParty = { embedUrl };
    }
  }
}

/**
 * Logs total device memory (in KB) to the context if the experiment flag is
 * enabled and the browser exposes `navigator.deviceMemory`.
 * [was: d60]
 *
 * @param {object|undefined} protoMsg [was: Q]
 * @param {object} context            [was: c]
 */
export function setMemoryInfo(protoMsg, context) { // was: d60
  if (getFlag('web_log_memory_total_kbytes') && globalWindow.navigator?.deviceMemory) {
    const memoryGb = globalWindow.navigator.deviceMemory; // was: W
    if (protoMsg) {
      setFixed64Field(protoMsg, 95, toLongString(memoryGb * 1e6)); // was: wD(Q, 95, hC(W * 1E6))
    } else if (context) {
      context.client.memoryTotalKbytes = `${memoryGb * 1e6}`;
    }
  }
}

/**
 * Attaches serialized app-install data (from SERIALIZED_CLIENT_CONFIG_DATA)
 * to the context's `configInfo.appInstallData`.
 * [was: LKd]
 *
 * @param {object} config             [was: Q]
 * @param {object|undefined} protoMsg [was: c]
 * @param {object} context            [was: W]
 */
export function setAppInstallData(config, protoMsg, context) { // was: LKd
  if (config.appInstallData) {
    if (protoMsg) {
      const configInfo = getSubMessage(protoMsg, ConfigInfoProto, 62) ?? new ConfigInfoProto(); // was: FE
      setStringField(configInfo, 6, config.appInstallData); // was: DZ(W, 6, Q.appInstallData)
      setSubMessage(protoMsg, ConfigInfoProto, 62, configInfo);
    } else if (context) {
      context.client.configInfo = context.client.configInfo || {};
      context.client.configInfo.appInstallData = config.appInstallData;
    }
  }
}

/**
 * Sets `connectionType` and (optionally) `effectiveConnectionType` on
 * the context using the Network Information API.
 * [was: w__]
 *
 * @param {object|undefined} protoMsg [was: Q]
 * @param {object} context            [was: c]
 */
export function setConnectionType(protoMsg, context) { // was: w__
  let connType = getConnectionType(); // was: nHw()
  if (connType) {
    if (protoMsg) {
      setInt32Field(protoMsg, 61, CONNECTION_TYPE_ENUM[connType]); // was: gCy[W]
    } else if (context) {
      context.client.connectionType = connType;
    }
  }
  if (getFlag('web_log_effective_connection_type')) {
    const effectiveConn = getEffectiveConnectionType(); // was: tyx()
    if (effectiveConn) {
      if (protoMsg) {
        setInt32Field(protoMsg, 94, EFFECTIVE_CONN_TYPE_ENUM[effectiveConn]); // was: OVw[W]
      } else if (context) {
        context.client.effectiveConnectionType = effectiveConn;
      }
    }
  }
}

/**
 * Attaches GCF (Google Config Framework) cold/hot hash data to the context.
 * Only called when the `start_client_gcf` experiment is active.
 * [was: bVX]
 *
 * @param {object|undefined} protoMsg [was: Q]
 * @param {object} context            [was: c]
 */
export function setGcfHashes(protoMsg, context) { // was: bVX
  const gcfData = getGcfData(); // was: FKW()
  if (gcfData) {
    const { coldConfigData, coldHashData, hotHashData } = gcfData; // was: W.coldConfigData, etc.
    if (protoMsg) {
      const configInfo = getSubMessage(protoMsg, ConfigInfoProto, 62) ?? new ConfigInfoProto();
      const withCold = setStringField(configInfo, 1, coldConfigData); // was: DZ(c, 1, m)
      setStringField(withCold, 3, coldHashData).setRepeatedField(hotHashData); // was: .c7(W)
      setSubMessage(protoMsg, ConfigInfoProto, 62, configInfo);
    } else if (context) {
      context.client.configInfo = context.client.configInfo || {};
      if (coldConfigData) context.client.configInfo.coldConfigData = coldConfigData;
      if (coldHashData)   context.client.configInfo.coldHashData   = coldHashData;
      if (hotHashData)    context.client.configInfo.hotHashData    = hotHashData;
    }
  }
}

// ===========================================================================
// PubSub2 data serialisation (lines 13438-13528)
// ===========================================================================

/**
 * Wraps arguments in a versioned envelope for cross-binary pubsub
 * serialisation.
 * [was: E3]
 *
 * @param {*} args [was: Q]
 */
export class PubSubData { // was: E3
  constructor(args) {
    /** @type {number} */
    this.version = 1;
    /** @type {*} */
    this.args = args;
  }
}

/**
 * Typed topic key used by the PubSub2 system.
 * [was: s3]
 *
 * @param {string} topic        [was: Q]
 * @param {Function} dataClass  [was: c] — constructor for deserialization
 */
export class PubSubTopic { // was: s3
  constructor(topic, dataClass) {
    /** @type {string} */
    this.topic = topic;
    /** @type {Function} */
    this.dataConstructor = dataClass; // was: W
  }
}

/**
 * Publishes a message on the PubSub2 bus.
 * [was: Lq]
 *
 * @param {PubSubTopic|string} topic [was: Q]
 * @param {*} data                   [was: c]
 */
export function pubsub2Publish(topic, data) { // was: Lq
  const instance = getPubsub2Instance(); // was: dU()
  if (instance) {
    instance.publish.call(instance, topic.toString(), topic, data);
  }
}

/**
 * Subscribes to events on the `vCm` topic (screen-created events).
 * Handles cross-binary deserialization of PubSubData payloads.
 * [was: Gp7]
 *
 * @param {Function} callback [was: Q]
 * @returns {number} Subscription key (0 if pubsub not available)
 */
export function subscribeToScreenCreated(callback) { // was: Gp7
  const topic = screenCreatedTopic; // was: vCm
  const instance = getPubsub2Instance(); // was: dU()
  if (!instance) return 0;

  const subscriptionKey = instance.subscribe(topic.toString(), (publishedTopic, data) => { // was: m
    const skipKey = getGlobal('ytPubsub2Pubsub2SkipSubKey'); // was: g.DR(...)
    if (skipKey && skipKey === subscriptionKey) return;

    const execute = () => {
      if (!activeSubscriptions[subscriptionKey]) return; // was: wU[m]
      try {
        if (data && topic instanceof PubSubTopic && topic !== publishedTopic) {
          // Cross-binary deserialization
          try {
            const dataClass = topic.dataConstructor; // was: c.W -> U
            const serialized = data; // was: T -> I
            if (!serialized.args || !serialized.version) {
              throw Error('yt.pubsub2.Data.deserialize(): serializedData is incomplete.');
            }
            let expectedVersion;
            try {
              if (!dataClass.cachedVersion) { // was: jX
                const tempInstance = new dataClass();
                dataClass.cachedVersion = tempInstance.version;
              }
              expectedVersion = dataClass.cachedVersion;
            } catch (_err) { /* ignore */ }
            if (!expectedVersion || serialized.version !== expectedVersion) {
              throw Error('yt.pubsub2.Data.deserialize(): serializedData version is incompatible.');
            }
            try {
              data = Reflect.construct(dataClass, toArray(serialized.args)); // was: g.Xi(I.args)
            } catch (err) {
              err.message = 'yt.pubsub2.Data.deserialize(): ' + err.message;
              throw err;
            }
          } catch (err) {
            err.message = 'yt.pubsub2.pubsub2 cross-binary conversion error for ' +
              topic.toString() + ': ' + err.message;
            throw err;
          }
        }
        callback.call(window, data);
      } catch (err) {
        reportError(err); // was: g.Zp(X)
      }
    };

    if (asyncTopics[topic.toString()]) { // was: aZw
      if (isDisposed()) { // was: g.Fd()
        scheduler.enqueue(execute); // was: g.YF.FD(r)
      } else {
        setTimeout(execute, 0); // was: g.zn(r, 0)
      }
    } else {
      execute();
    }
  });

  activeSubscriptions[subscriptionKey] = true; // was: wU[m] = !0
  topicSubscriptions[topic.toString()] = topicSubscriptions[topic.toString()] || []; // was: bV
  topicSubscriptions[topic.toString()].push(subscriptionKey);
  return subscriptionKey;
}

/**
 * Subscribes to the `$6K` event (one-shot, unsubscribes after first fire).
 * [was: lZy]
 *
 * @returns {number} Subscription key
 */
export function subscribeOnce() { // was: lZy
  const handler = onScreenCreatedFlush; // was: $6K
  const key = subscribeToScreenCreated(function (data) {
    handler.apply(undefined, arguments);
    unsubscribeKeys(key); // was: P7O(c)
  });
  return key;
}

/**
 * Unsubscribes one or more PubSub2 keys.
 * [was: P7O]
 *
 * @param {number|number[]} keys [was: Q]
 */
export function unsubscribeKeys(keys) { // was: P7O
  const instance = getPubsub2Instance(); // was: dU()
  if (!instance) return;
  if (typeof keys === 'number') keys = [keys];
  forEach(keys, (key) => { // was: g.lw
    instance.unsubscribeByKey(key);
    delete activeSubscriptions[key]; // was: wU[W]
  });
}

/**
 * Returns the global PubSub2 singleton.
 * [was: dU]
 *
 * @returns {object|undefined}
 */
export function getPubsub2Instance() { // was: dU
  return getGlobal('ytPubsub2Pubsub2Instance'); // was: g.DR(...)
}

// ===========================================================================
// GEL compression + CSI metrics (lines 13529-13604)
// ===========================================================================

/**
 * Logs a meta-CSI event for GEL compression timing (sampled).
 * [was: jl]
 *
 * @param {string} timerName    [was: Q]
 * @param {object} timelineData [was: c]
 * @param {object} [options]    [was: W]
 * @param {number} [options.sampleRate=0.1]
 */
export function logMetaCsiEvent(timerName, timelineData, options = { sampleRate: 0.1 }) { // was: jl
  if (Math.random() < Math.min(0.02, options.sampleRate / 100)) {
    pubsub2Publish('meta_logging_csi_event', {
      timerName,
      timelineData,
    });
  }
}

/**
 * Compresses the request body with gzip and dispatches it via the provided
 * send function, adding the `Content-Encoding: gzip` header.
 * [was: gU]
 *
 * @param {string}   url        [was: Q]
 * @param {string}   bodyString [was: c]
 * @param {object}   options    [was: W] — request options (headers, etc.)
 * @param {Function} sendFn     [was: m] — transport function (g.Wn or ms)
 */
export function compressAndSend(url, bodyString, options, sendFn) { // was: gU
  const csiData = {
    startTime: now(), // was: (0, g.h)()
    ticks: {},
    infos: {},
  };
  try {
    const rawSize = measureStringSize(bodyString); // was: ug_(c)
    if (rawSize == null || !(rawSize > COMPRESS_MAX_THRESHOLD || rawSize < COMPRESS_MIN_THRESHOLD)) { // was: hQw, zQm
      const compressed = gzipCompress(utf8Encode(bodyString)); // was: Ui(C7_(c))
      const compressedTime = now();
      csiData.ticks.gelc = compressedTime;
      compressionCounter++; // was: M0R++

      if (!getFlag('gel_compression_csi_killswitch') &&
          (getFlag('log_gel_compression_latency') || getFlag('log_gel_compression_latency_lr'))) {
        logMetaCsiEvent('gel_compression', csiData, { sampleRate: 0.1 });
      }

      options.headers = options.headers || {};
      options.headers['Content-Encoding'] = 'gzip';
      options.postBody = compressed;
      options.postParams = undefined;
    }
    sendFn(url, options);
  } catch (err) {
    logSilent(err); // was: si(r)
    sendFn(url, options);
  }
}

/**
 * Compresses a fetch-style request's body in-place (returns mutated request).
 * [was: JoR]
 *
 * @param {object} request [was: Q] — { body, headers, ... }
 * @returns {object} The (possibly modified) request
 */
export function compressFetchRequest(request) { // was: JoR
  now();
  if (!request.body) return request;
  try {
    const bodyStr = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    let compressed = bodyStr;
    if (typeof bodyStr === 'string') {
      const rawSize = measureStringSize(bodyStr); // was: ug_(c)
      if (rawSize != null && (rawSize > COMPRESS_MAX_THRESHOLD || rawSize < COMPRESS_MIN_THRESHOLD)) {
        return request;
      }
      compressed = gzipCompress(utf8Encode(bodyStr)); // was: Ui(C7_(c))
      now();
    }
    request.headers = {
      'Content-Encoding': 'gzip',
      ...(request.headers || {}),
    };
    request.body = compressed;
    return request;
  } catch (err) {
    logSilent(err);
    return request;
  }
}

/**
 * Measures the byte size of a string via Blob.
 * [was: ug_]
 *
 * @param {string} str [was: Q]
 * @returns {number|null} Size in bytes, or null on error
 */
export function measureStringSize(str) { // was: ug_
  try {
    return (new Blob(str.split(''))).size;
  } catch (err) {
    logSilent(err);
    return null;
  }
}

// ===========================================================================
// Networkless request controller (lines 13605-13692)
// ===========================================================================

/**
 * Returns whether the networkless logging system has a usable database name.
 * [was: O3]
 *
 * @param {object} controller [was: Q]
 * @returns {boolean}
 */
export function isNetworklessSupported(controller) { // was: O3
  return !!controller.databaseName || controller.useMemoryFallback; // was: Q.o8 || Q.UM
}

/**
 * Initialises the networkless request controller: hooks up network-status
 * listeners, starts the flush loop, and registers SW health cleanup.
 * [was: RQd]
 *
 * @param {object} controller [was: Q]
 */
export function initNetworklessController(controller) { // was: RQd
  if (!isNetworklessSupported(controller) || controller.isInitialized) return; // was: Q.DH
  controller.isStarted = true; // was: Q.W = !0

  // SW health log sampling
  if (controller.enableSwHealth && Math.random() <= controller.swHealthSampleRate) { // was: Ru, l6
    controller.idbStore.writeHealthLog(controller.databaseName); // was: Q.LU.xw(Q.o8)
  }

  controller.flushPendingRequests(); // was: Q.x7()

  // Listen for online/offline events
  if (controller.networkStatus.isOnline()) { // was: Q.CU.KU()
    controller.processQueue(); // was: Q.A()
  }
  controller.networkStatus.listen(controller.ONLINE_EVENT, controller.processQueue.bind(controller)); // was: Q.K$
  controller.networkStatus.listen(controller.OFFLINE_EVENT, controller.pauseQueue.bind(controller)); // was: Q.lZ
}

/**
 * Routes an error to the appropriate handler depending on network status.
 * [was: fq]
 *
 * @param {object} controller [was: Q]
 * @param {Error} error       [was: c]
 */
export function handleNetworklessError(controller, error) { // was: fq
  if (controller.offlineHandler && !controller.networkStatus.isOnline()) {
    controller.offlineHandler(error); // was: Q.zL(c)
  } else {
    controller.handleError(error);
  }
}

/**
 * Wraps the success/error handlers of a queued request with IndexedDB
 * persistence logic (retry, delete, compression fallback).
 * [was: p_0]
 *
 * @param {object} controller [was: Q]
 * @param {object} request    [was: c] — queued request descriptor
 * @returns {object} The mutated request
 */
export function updateRequestHandlers(controller, request) { // was: p_0
  if (!isNetworklessSupported(controller)) {
    throw Error('IndexedDB is not supported: updateRequestHandlers');
  }

  const originalOnError = request.options.onError ? request.options.onError : () => {};

  request.options.onError = async (statusCode, response) => {
    const isRetryable = isRetryableErrorCode(response); // was: kpX(T)
    const isCompressionError = isCompressionErrorCode(response); // was: YBX(T)

    if (isCompressionError && controller.flagChecker && controller.flagChecker('web_enable_error_204')) {
      controller.handleError(Error('Request failed due to compression'), request.url, response);
    }

    const shouldRetryByCode = controller.flagChecker && controller.flagChecker('nwl_consider_error_code');

    if ((shouldRetryByCode && isRetryable) ||
        (!shouldRetryByCode && controller.potentialEsfErrorCounter <= controller.maxEsfErrors)) { // was: Nc
      if (controller.networkStatus.refresh) await controller.networkStatus.refresh(); // was: Xy
      if (!controller.networkStatus.isOnline()) {
        originalOnError(statusCode, response);
        if (shouldRetryByCode && request?.id !== undefined) {
          await controller.idbStore.markForRetry(request.id, controller.databaseName, false); // was: Tq
        }
        return;
      }
    }

    if (shouldRetryByCode && !isRetryable && controller.potentialEsfErrorCounter > controller.maxEsfErrors) {
      // Exceeded limit — do nothing extra
    } else {
      controller.potentialEsfErrorCounter++;
      if (request?.id !== undefined) {
        if (request.sendCount < controller.maxRetries) { // was: Jm
          await controller.idbStore.markForRetry(
            request.id, controller.databaseName, true,
            isCompressionError ? false : undefined,
          ); // was: Tq
          controller.scheduler.enqueue(() => { // was: jF.FD
            if (controller.networkStatus.isOnline()) controller.processQueue();
          }, controller.retryDelay); // was: HP
        } else {
          await controller.idbStore.deleteRequest(request.id, controller.databaseName); // was: GJ
        }
      }
      originalOnError(statusCode, response);
    }
  };

  const originalOnSuccess = request.options.onSuccess ? request.options.onSuccess : () => {};
  request.options.onSuccess = async (statusCode, response) => {
    if (request?.id !== undefined) {
      await controller.idbStore.deleteRequest(request.id, controller.databaseName);
    }
    if (controller.networkStatus.reportSuccess && controller.flagChecker &&
        controller.flagChecker('vss_network_hint')) {
      controller.networkStatus.reportSuccess(true); // was: LL
    }
    originalOnSuccess(statusCode, response);
  };

  return request;
}

/**
 * Returns whether an HTTP error code is retryable (i.e. NOT a 4xx-5xx).
 * [was: kpX]
 *
 * @param {object} response [was: Q]
 * @returns {boolean}
 */
export function isRetryableErrorCode(response) { // was: kpX
  const code = response?.error?.code;
  return (code && code >= 400 && code <= 599) ? false : true;
}

/**
 * Returns whether an HTTP error is a compression-related failure (400 or 415).
 * [was: YBX]
 *
 * @param {object} response [was: Q]
 * @returns {boolean}
 */
export function isCompressionErrorCode(response) { // was: YBX
  const code = response?.error?.code;
  return !(code !== 400 && code !== 415);
}

/**
 * Opens (or reuses) the IndexedDB "LogsDatabaseV2" for storing queued
 * networkless log requests.
 * [was: Q$x]
 *
 * @returns {Promise<IDBDatabase>}
 */
export function openLogsDatabase() { // was: Q$x
  if (logsDatabasePromise) return logsDatabasePromise(); // was: vF
  logsDatabasePromise = openDatabase('LogsDatabaseV2', { // was: el(...)
    schema: { // was: ML
      LogsRequestsStore: { version: 2 }, // was: d0: 2
    },
    shared: false,
    upgrade(EventHandler, needsVersion, transaction) { // was: Q, c, W
      if (needsVersion(2)) {
        createObjectStore(EventHandler, 'LogsRequestsStore', {
          keyPath: 'id',
          autoIncrement: true,
        }); // was: JN(Q, "LogsRequestsStore", ...)
      }
      needsVersion(3);
      if (needsVersion(5)) {
        const store = transaction.objectStore('LogsRequestsStore');
        if (store.indexNames.contains('newRequest')) {
          store.deleteIndex('newRequest');
        }
        createIndex(store, 'newRequestV2', ['status', 'interface', 'timestamp']); // was: ks
      }
      if (needsVersion(7)) deleteObjectStore(EventHandler, 'sapisid'); // was: RC
      if (needsVersion(9)) deleteObjectStore(EventHandler, 'SWHealthLog');
    },
    version: 9,
  });
  return logsDatabasePromise();
}

// ===========================================================================
// IndexedDB log-store helpers (lines 13693-13815)
// ===========================================================================

/**
 * Acquires a transactional wrapper for the logs database.
 * [was: au]
 *
 * @param {string} dbName [was: Q]
 * @returns {Promise}
 */
export function getLogsTransaction(dbName) { // was: au
  return acquireTransaction(openLogsDatabase(), dbName); // was: g.m7(Q$x(), Q)
}

/**
 * Writes a log request record into IndexedDB.
 * [was: WEX]
 *
 * @param {object} requestRecord [was: Q]
 * @param {string} dbName        [was: c]
 * @returns {Promise<number>} The auto-generated record ID
 */
export async function writeLogRequest(requestRecord, dbName) { // was: WEX
  const csiData = {
    startTime: now(),
    infos: { transactionType: 'YT_IDB_TRANSACTION_TYPE_WRITE' },
    ticks: {},
  };
  const shouldUseDesktopControls = await getLogsTransaction(dbName);
  const record = {
    ...requestRecord,
    options: JSON.parse(JSON.stringify(requestRecord.options)),
    interface: getConfigValue('INNERTUBE_CONTEXT_CLIENT_NAME', 0),
  };
  const id = await shouldUseDesktopControls.put('LogsRequestsStore', record);
  csiData.ticks.ReentrantChannel = now();
  logNetworklessPerformance(csiData); // was: cQK(W)
  return id;
}

/**
 * Reads the most recent log request by status, using the `newRequestV2` index.
 * For NEW requests, atomically sets status to QUEUED.
 * [was: mqx]
 *
 * @param {string} status [was: Q] — "NEW" or "QUEUED"
 * @param {string} dbName [was: c]
 * @returns {Promise<object|undefined>}
 */
export async function getMostRecentByStatus(status, dbName) { // was: mqx
  const csiData = {
    startTime: now(),
    infos: { transactionType: 'YT_IDB_TRANSACTION_TYPE_READ' },
    ticks: {},
  };
  const shouldUseDesktopControls = await getLogsTransaction(dbName);
  const clientName = getConfigValue('INNERTUBE_CONTEXT_CLIENT_NAME', 0);
  const lowerBound = [status, clientName, 0];
  const upperBound = [status, clientName, now()];
  const range = IDBKeyRange.bound(lowerBound, upperBound);
  let direction = 'prev';
  if (getFlag('use_fifo_for_networkless')) direction = 'next';

  let result = undefined;
  const mode = status === 'NEW' ? 'readwrite' : 'readonly';
  const actualMode = getFlag('use_readonly_for_get_most_recent_by_status_killswitch') ? 'readwrite' : mode;

  await runInTransaction(shouldUseDesktopControls, ['LogsRequestsStore'], { mode: actualMode, durability: true }, // was: g3: !0
    (txn) => iterateCursor(txn.objectStore('LogsRequestsStore').index('newRequestV2'), {
      query: range,
      direction,
    }, (cursor) => {
      if (cursor.getValue()) {
        result = cursor.getValue();
        if (status === 'NEW') {
          result.status = 'QUEUED';
          cursor.update(result);
        }
      }
    }),
  );

  csiData.ticks.ReentrantChannel = now();
  logNetworklessPerformance(csiData);
  return result;
}

/**
 * Marks a log request as QUEUED by ID.
 * [was: KEK]
 *
 * @param {number} id     [was: Q]
 * @param {string} dbName [was: c]
 * @returns {Promise<object|undefined>}
 */
export async function markAsQueued(id, dbName) { // was: KEK
  return runInTransaction(await getLogsTransaction(dbName), ['LogsRequestsStore'], {
    mode: 'readwrite',
    durability: true,
  }, (txn) => {
    const store = txn.objectStore('LogsRequestsStore');
    return store.get(id).then((record) => {
      if (record) {
        record.status = 'QUEUED';
        return store.put(record).then(() => record);
      }
    });
  });
}

/**
 * Marks a log request back to NEW for retry, optionally incrementing sendCount.
 * [was: TGK]
 *
 * @param {number}  id              [was: Q]
 * @param {string}  dbName          [was: c]
 * @param {boolean} [incrementSend=true]  [was: W]
 * @param {boolean} [compress]            [was: m] — override compress flag
 * @returns {Promise<object|undefined>}
 */
export async function markForRetry(id, dbName, incrementSend = true, compress) { // was: TGK
  return runInTransaction(await getLogsTransaction(dbName), ['LogsRequestsStore'], {
    mode: 'readwrite',
    durability: true,
  }, (txn) => {
    const store = txn.objectStore('LogsRequestsStore');
    return store.get(id).then((record) => {
      if (!record) return resolvedPromise(undefined); // was: g.P8.resolve(void 0)
      record.status = 'NEW';
      if (incrementSend) record.sendCount += 1;
      if (compress !== undefined) record.options.compress = compress;
      return store.put(record).then(() => record);
    });
  });
}

/**
 * Deletes a log request from IndexedDB.
 * [was: olO]
 *
 * @param {number} id     [was: Q]
 * @param {string} dbName [was: c]
 * @returns {Promise<void>}
 */
export async function deleteLogRequest(id, dbName) { // was: olO
  return (await getLogsTransaction(dbName)).delete('LogsRequestsStore', id);
}

/**
 * Purges log requests older than 30 days (2592e6 ms).
 * [was: rQd]
 *
 * @param {string} dbName [was: Q]
 */
export async function purgeOldLogRequests(dbName) { // was: rQd
  const shouldUseDesktopControls = await getLogsTransaction(dbName);
  const cutoff = now() - 2592e6; // 30 days
  await runInTransaction(shouldUseDesktopControls, ['LogsRequestsStore'], {
    mode: 'readwrite',
    durability: true,
  }, (txn) => iterateAll(txn.objectStore('LogsRequestsStore'), {}, (cursor) => {
    if (cursor.getValue().timestamp <= cutoff) {
      return cursor.delete().then(() => advanceCursor(cursor)); // was: g.Qb(m)
    }
  }));
}

/**
 * Drops the entire "LogsDatabaseV2" IndexedDB database.
 * [was: Uqy]
 */
export async function dropLogsDatabase() { // was: Uqy
  await deleteDatabase('LogsDatabaseV2'); // was: TyO(...)
}

/**
 * Logs a CSI event for networkless performance telemetry.
 * [was: cQK]
 *
 * @param {object} data [was: Q]
 */
export function logNetworklessPerformance(data) { // was: cQK
  if (!getFlag('nwl_csi_killswitch')) {
    logMetaCsiEvent('networkless_performance', data, { sampleRate: 1 });
  }
}

// ===========================================================================
// SW health log + ping transport (lines 13816-13937)
// ===========================================================================

/**
 * Acquires a transaction wrapper for the SW health log database.
 * [was: Xk7]
 *
 * @param {string} dbName [was: Q]
 * @returns {Promise}
 */
export function getSwHealthTransaction(dbName) { // was: Xk7
  return acquireTransaction(openSwHealthDatabase(), dbName); // was: g.m7(Idx(), Q)
}

/**
 * Purges SW health log entries older than 30 days.
 * [was: AQy]
 *
 * @param {string} dbName [was: Q]
 */
export async function purgeOldSwHealthLogs(dbName) { // was: AQy
  const shouldUseDesktopControls = await getSwHealthTransaction(dbName);
  const cutoff = now() - 2592e6;
  await runInTransaction(shouldUseDesktopControls, ['SWHealthLog'], {
    mode: 'readwrite',
    durability: true,
  }, (txn) => iterateAll(txn.objectStore('SWHealthLog'), {}, (cursor) => {
    if (cursor.getValue().timestamp <= cutoff) {
      return cursor.delete().then(() => advanceCursor(cursor));
    }
  }));
}

/**
 * Clears the entire SWHealthLog store.
 * [was: eK_]
 *
 * @param {string} dbName [was: Q]
 */
export async function clearSwHealthLogs(dbName) { // was: eK_
  await (await getSwHealthTransaction(dbName)).clear('SWHealthLog');
}

/**
 * Sends a tracking pixel / beacon / POST ping.
 * Dispatches via sendBeacon, XHR POST, or Image pixel depending on
 * available capabilities and flags.
 * [was: g.GU]
 *
 * @param {string}   url          [was: Q]
 * @param {Function} [callback]   [was: c] — success callback
 * @param {boolean}  [scrubReferrer] [was: W]
 * @param {object}   [extraHeaders]  [was: m]
 * @param {string}   [postBody='']   [was: K]
 * @param {boolean}  [forcePixel=false] [was: T]
 * @param {boolean}  [useNetAjax=false] [was: r]
 */
export function sendPing(url, callback, scrubReferrer, extraHeaders, postBody = '', forcePixel = false, useNetAjax = false) { // was: g.GU
  if (!url) return;

  if (scrubReferrer && !isModernBrowser()) { // was: !g.i0()
    logSilent(new ExtendedError('Legacy referrer-scrubbed ping detected')); // was: g.H8
    if (url) sendImagePing(url, undefined, { scrubReferrer: true }); // was: Vj7
    return;
  }

  if (postBody) {
    sendXhrPing(url, callback, 'POST', postBody, extraHeaders); // was: cn(Q, c, "POST", K, m)
    return;
  }

  if (getConfigValue('USE_NET_AJAX_FOR_PING_TRANSPORT', false) || extraHeaders || useNetAjax) {
    sendXhrPing(url, callback, 'GET', '', extraHeaders, undefined, forcePixel, useNetAjax);
    return;
  }

  // Click-through tracking (aclk) with redirect logic
  let isAclkRedirect = false;
  try {
    const parsed = new ClickTrackingUrl({ url }); // was: BG_
    if (parsed.params.dsh === '1') {
      // Skip
    } else {
      const aeParam = parsed.params.ae;
      if (aeParam === '1') {
        const adUrl = parsed.params.adurl;
        if (adUrl) {
          try {
            /* Redirect format detected */
            isAclkRedirect = true;
          } catch (_err) { /* ignore */ }
        }
      } else if (aeParam === '2') {
        isAclkRedirect = true;
      }
    }

    if (isAclkRedirect) {
      const origin = getUrlOrigin(url); // was: tF(Q)
      isAclkRedirect = !(!origin || !origin.endsWith('/aclk') || getQueryParam(url, 'ri') !== '1');
    }
  } catch (_err) {
    isAclkRedirect = false;
  }

  let sent = false;
  if (isAclkRedirect) {
    if (sendBeaconPing(url)) {
      if (callback) callback();
      sent = true;
    }
  }
  if (!sent) sendImagePing(url, callback); // was: Vj7(Q, c)
}

/**
 * Sends a ping via sendBeacon, falling back to g.GU if that fails.
 * [was: qSO]
 *
 * @param {string} url      [was: Q]
 * @param {string} [body=''] [was: c]
 */
export function sendBeaconOrPing(url, body = '') { // was: qSO
  if (!sendBeaconPing(url, body)) {
    sendPing(url, undefined, undefined, undefined, body); // was: g.GU(Q, ...)
  }
}

/**
 * Attempts `navigator.sendBeacon()`.
 * [was: xqy]
 *
 * @param {string} url      [was: Q]
 * @param {string} [body=''] [was: c]
 * @returns {boolean} true if the beacon was queued
 */
export function sendBeaconPing(url, body = '') { // was: xqy
  try {
    if (window.navigator && window.navigator.sendBeacon && window.navigator.sendBeacon(url, body)) {
      return true;
    }
  } catch (_err) { /* ignore */ }
  return false;
}

/**
 * Sends a tracking pixel via an Image element.
 * [was: Vj7]
 *
 * @param {string}   url       [was: Q]
 * @param {Function} [callback] [was: c]
 * @param {object}   [options]  [was: W]
 * @param {boolean}  [options.scrubReferrer]
 */
export function sendImagePing(url, callback, options = {}) { // was: Vj7
  const img = new Image();
  const key = '' + pixelCounter++; // was: nlR++
  activePixels[key] = img; // was: $w[K] = m
  img.onload = img.onerror = () => {
    if (callback && activePixels[key]) callback();
    delete activePixels[key];
  };
  if (options.scrubReferrer) img.referrerPolicy = 'no-referrer';
  img.src = url;
}

/**
 * Appends the attribution-reporting feature-policy signal to a URL.
 * [was: DqW]
 *
 * @param {string} url [was: Q]
 * @returns {string}
 */
export function appendAttributionReportingSignal(url) { // was: DqW
  return document.featurePolicy?.allowedFeatures().includes('attribution-reporting')
    ? url + '&nis=6'
    : url + '&nis=5';
}

// ===========================================================================
// Offline error cache / network monitor (lines 13938-13995)
// ===========================================================================

/**
 * Returns the singleton offline storage adapter.
 * [was: uV]
 *
 * @returns {object}
 */
export function getOfflineStorage() { // was: uV
  if (!offlineStorage) {
    offlineStorage = new NamespacedStorage('yt.offline'); // was: lV
  }
  return offlineStorage;
}

/**
 * Persists an error to offline storage for later reporting.
 * [was: tjd]
 *
 * @param {Error} error [was: Q]
 */
export function cacheOfflineError(error) { // was: tjd
  if (getFlag('offline_error_handling')) {
    const errors = getOfflineStorage().get('errors', true) || {};
    errors[error.message] = {
      name: error.name,
      stack: error.stack,
    };
    if (error.level) errors[error.message].level = error.level;
    getOfflineStorage().set('errors', errors, 2592e3, true); // 30 days TTL
  }
}

/**
 * Returns the singleton network request monitor.
 * [was: H0y]
 *
 * @returns {object}
 */
export function getNetworkRequestMonitor() { // was: H0y
  if (!NetworkRequestMonitor.instance) { // was: hD
    const instance = getGlobal('yt.networkRequestMonitor.instance') || new NetworkRequestMonitor();
    setGlobal('yt.networkRequestMonitor.instance', instance);
    NetworkRequestMonitor.instance = instance;
  }
  return NetworkRequestMonitor.instance;
}

/**
 * Returns the singleton network status manager.
 * [was: NGO]
 *
 * @returns {object}
 */
export function getNetworkStatusManager() { // was: NGO
  if (!NetworkStatusManager.instance) { // was: zU
    const instance = getGlobal('yt.networkStatusManager.instance') || new NetworkStatusManager();
    setGlobal('yt.networkStatusManager.instance', instance);
    NetworkStatusManager.instance = instance;
  }
  return NetworkStatusManager.instance;
}

/**
 * Dispatches a rate-limited network status event.
 * [was: i07]
 *
 * @param {object} manager [was: Q]
 * @param {string} event   [was: c]
 */
export function dispatchRateLimitedEvent(manager, event) { // was: i07
  if (manager.rateLimit) {
    if (manager.lastDispatchTime) { // was: Q.W
      scheduler.cancel(manager.pendingTimerId); // was: g.YF.Q$(Q.j)
      manager.pendingTimerId = scheduler.enqueue(() => {
        if (manager.lastEvent !== event) { // was: Q.A !== c
          manager.dispatchEvent(event);
          manager.lastEvent = event;
          manager.lastDispatchTime = now();
        }
      }, manager.rateLimit - (now() - manager.lastDispatchTime));
    } else {
      manager.dispatchEvent(event);
      manager.lastEvent = event;
      manager.lastDispatchTime = now();
    }
  } else {
    manager.dispatchEvent(event);
  }
}

/**
 * Returns (and lazily initialises) the global networkless request controller.
 * [was: Cq]
 *
 * @returns {object}
 */
export function getNetworklessRequestController() { // was: Cq
  let controller = getGlobal('yt.networklessRequestController.instance');
  if (!controller) {
    controller = new NetworklessRequestController(); // was: yQR
    setGlobal('yt.networklessRequestController.instance', controller);
    if (getFlag('networkless_logging')) {
      getAppDatabaseName().then((dbName) => { // was: g.AD()
        controller.databaseName = dbName; // was: Q.o8 = c
        initNetworklessController(controller);
        controller.readyPromise.resolve(); // was: Q.K.resolve()
        if (controller.enableSwHealth && Math.random() <= controller.swHealthSampleRate && controller.databaseName) {
          purgeOldSwHealthLogs(controller.databaseName);
        }
        if (getFlag('networkless_immediately_drop_sw_health_store')) {
          clearSwHealthLogsForController(controller); // was: SSK(Q)
        }
      });
    }
  }
  return controller;
}

/**
 * Clears the SW health log store for a given controller.
 * [was: SSK]
 *
 * @param {object} controller [was: Q]
 */
export async function clearSwHealthLogsForController(controller) { // was: SSK
  if (!controller.databaseName) {
    throw createError('clearSWHealthLogsDb'); // was: g.$s(...)
  }
  clearSwHealthLogs(controller.databaseName).catch((err) => {
    controller.handleError(err);
  });
}

// ===========================================================================
// Request dispatch helpers (lines 13996-14095)
// ===========================================================================

/**
 * Dispatches a logging request, optionally with gzip compression and
 * request-time stamping.
 * [was: FE3]
 *
 * @param {string} url     [was: Q]
 * @param {object} options [was: c]
 * @param {boolean} isPingOnly [was: W] — if true and options empty, send image ping
 */
export function dispatchLoggingRequest(url, options, isPingOnly) { // was: FE3
  const opts = getFlag('web_fp_via_jspb') ? Object.assign({}, options) : options;

  if (getFlag('use_request_time_ms_header')) {
    if (opts.headers && isInnertubeUrl(url)) { // was: ax(Q)
      opts.headers['X-Goog-Request-Time'] = JSON.stringify(Math.round(now()));
    }
  } else {
    if (opts.postParams?.requestTimeMs) {
      opts.postParams.requestTimeMs = Math.round(now());
    }
  }

  if (isPingOnly && Object.keys(opts).length === 0) {
    sendPing(url); // was: g.GU(Q)
  } else if (opts.compress) {
    if (opts.postBody) {
      if (typeof opts.postBody !== 'string') opts.postBody = JSON.stringify(opts.postBody);
      compressAndSend(url, opts.postBody, opts, sendXhrRequest); // was: gU(Q, ..., g.Wn)
    } else {
      compressAndSend(url, JSON.stringify(opts.postParams), opts, sendPostRequest); // was: gU(Q, ..., ms)
    }
  } else {
    sendXhrRequest(url, opts); // was: g.Wn(Q, c)
  }
}

/**
 * Stamps the event time header on the request options.
 * [was: Me]
 *
 * @param {string} url     [was: Q]
 * @param {object} options [was: c]
 * @returns {object} The mutated options
 */
export function stampEventTime(url, options) { // was: Me
  if (getFlag('use_event_time_ms_header') && isInnertubeUrl(url)) {
    options.headers = options.headers || {};
    options.headers['X-Goog-Event-Time'] = JSON.stringify(Math.round(now()));
  }
  return options;
}

/**
 * Sends an Innertube API request via the GEL logging path — the lower-level
 * function that assembles headers, builds the URL, and dispatches.
 * [was: g.JD]
 *
 * @param {object} client       [was: Q] — client with config_
 * @param {string} endpointPath [was: c] — API method (e.g. "log_event")
 * @param {object} requestBody  [was: W] — JSON request body
 * @param {object} options      [was: m] — callbacks, timeout, compress, etc.
 */
export function sendGelRequest(client, endpointPath, requestBody, options) { // was: g.JD
  if (!getConfigValue('VISITOR_DATA') && endpointPath !== 'visitor_id' && Math.random() < 0.01) {
    logSilent(new ExtendedError('Missing VISITOR_DATA when sending innertube request.',
      endpointPath, requestBody, options));
  }

  if (!client.isReady()) {
    const err = new ExtendedError('innertube xhrclient not ready',
      endpointPath, requestBody, options);
    reportError(err);
    throw err;
  }

  const requestConfig = {
    headers: options.headers || {},
    method: 'POST',
    postParams: requestBody,
    postBody: options.postBody,
    postBodyFormat: options.postBodyFormat || 'JSON',
    onTimeout: () => { options.onTimeout(); },
    onFetchTimeout: options.onTimeout,
    onSuccess: (xhr, response) => { if (options.onSuccess) options.onSuccess(response); },
    onFetchSuccess: (response) => { if (options.onSuccess) options.onSuccess(response); },
    onProgress: (progress) => { if (options.onProgress) options.onProgress(progress); },
    onError: (xhr, response) => { if (options.onError) options.onError(response); },
    onFetchError: (response) => { if (options.onError) options.onError(response); },
    timeout: options.timeout,
    withCredentials: true,
    compress: options.compress,
  };

  if (!requestConfig.headers['Content-Type']) {
    requestConfig.headers['Content-Type'] = 'application/json';
  }

  // Host override
  let baseUrl = '';
  const hostOverride = client.config_.hostOverride; // was: hH
  if (hostOverride) baseUrl = hostOverride;

  const useThirdPartyAuth = client.config_.useThirdPartyAuth || false; // was: Db
  const authHeaders = buildAuthHeaders(useThirdPartyAuth, baseUrl, options); // was: fZ7
  Object.assign(requestConfig.headers, authHeaders);

  if (requestConfig.headers.Authorization && !baseUrl && useThirdPartyAuth) {
    requestConfig.headers['x-origin'] = window.location.origin;
  }

  const url = appendQueryParams(
    `${baseUrl}/youtubei/${client.config_.innertubeApiVersion}/${endpointPath}`,
    { alt: 'json' },
  ); // was: fe(...)

  const executeRequest = (useNetworkless = false) => {
    try {
      if (useNetworkless && options.retry && !options.networklessOptions.bypassNetworkless) {
        requestConfig.method = 'POST';
        if (options.networklessOptions.writeThenSend) {
          getNetworklessRequestController().writeThenSend(url, requestConfig);
        } else {
          getNetworklessRequestController().sendAndWrite(url, requestConfig);
        }
      } else if (options.compress) {
        if (requestConfig.postBody) {
          let body = requestConfig.postBody;
          if (typeof body !== 'string') body = JSON.stringify(requestConfig.postBody);
          compressAndSend(url, body, requestConfig, sendXhrRequest);
        } else {
          compressAndSend(url, JSON.stringify(requestConfig.postParams), requestConfig, sendPostRequest);
        }
      } else {
        sendPostRequest(url, requestConfig); // was: ms(U, K)
      }
    } catch (err) {
      if (err.name === 'InvalidAccessError') {
        logSilent(Error('An extension is blocking network request.'));
      } else {
        throw err;
      }
    }
  };

  const nwlOptions = getGlobal('ytNetworklessLoggingInitializationOptions');
  if (nwlOptions && networklessState.isNwlInitialized) { // was: Z0O
    isNetworklessReady().then((ready) => executeRequest(ready)); // was: YVm()
  } else {
    executeRequest(false);
  }
}

// ===========================================================================
// Legacy PubSub (lines 14097-14165)
// ===========================================================================

/**
 * Subscribes to a named event on the legacy PubSub system.
 * [was: g.Qp]
 *
 * @param {string}   topic     [was: Q]
 * @param {Function} callback  [was: c]
 * @param {object}   [context] [was: W] — `this` context for callback
 * @returns {number} Subscription key (0 if PubSub unavailable)
 */
export function pubsubSubscribe(topic, callback, context = null) { // was: g.Qp
  const pubsub = getLegacyPubsub(); // was: g.Ru()
  if (pubsub && callback) {
    const key = pubsub.subscribe(topic, function () {
      const args = arguments;
      const execute = () => {
        if (legacySubscriptions[key] && callback.apply && typeof callback.apply === 'function') {
          callback.apply(context || window, args);
        }
      };
      try {
        if (synchronousTopics[topic]) { // was: g.Yw[Q]
          execute();
        } else {
          setTimeout(execute, 0); // was: g.zn(r, 0)
        }
      } catch (err) {
        reportError(err);
      }
    }, context);
    legacySubscriptions[key] = true; // was: kw[K] = !0
    legacyTopicKeys[topic] = legacyTopicKeys[topic] || []; // was: pq[Q]
    legacyTopicKeys[topic].push(key);
    return key;
  }
  return 0;
}

/**
 * Subscribes once to the "LOGGED_IN" topic, then auto-unsubscribes.
 * [was: Ely]
 *
 * @param {Function} callback [was: Q]
 */
export function onceLoggedIn(callback) { // was: Ely
  const key = pubsubSubscribe('LOGGED_IN', function (isLoggedIn) {
    callback.apply(undefined, arguments);
    pubsubUnsubscribe(key); // was: g.cm(c)
  });
}

/**
 * Unsubscribes one or more legacy PubSub subscription keys.
 * [was: g.cm]
 *
 * @param {number|number[]|string} keys [was: Q]
 */
export function pubsubUnsubscribe(keys) { // was: g.cm
  const pubsub = getLegacyPubsub();
  if (!pubsub) return;
  if (typeof keys === 'number') keys = [keys];
  else if (typeof keys === 'string') keys = [parseInt(keys, 10)];
  forEach(keys, (key) => {
    pubsub.unsubscribeByKey(key);
    delete legacySubscriptions[key];
  });
}

/**
 * Publishes a message on the legacy PubSub system.
 * [was: g.Wm]
 *
 * @param {string} topic [was: Q]
 * @param {...*} args     [was: c]
 * @returns {boolean}
 */
export function pubsubPublish(topic, ...args) { // was: g.Wm
  const pubsub = getLegacyPubsub();
  return pubsub ? pubsub.publish.apply(pubsub, arguments) : false;
}

/**
 * Clears all subscriptions for a topic (or all topics if none given).
 * [was: dq7]
 *
 * @param {string} [topic] [was: Q]
 */
export function pubsubClear(topic) { // was: dq7
  const pubsub = getLegacyPubsub();
  if (!pubsub) return;
  if (pubsub.clear(topic), topic) {
    clearTopicKeys(topic); // was: s$x(Q)
  } else {
    for (const t in legacyTopicKeys) clearTopicKeys(t);
  }
}

/**
 * Returns the global legacy PubSub instance.
 * [was: g.Ru]
 *
 * @returns {object|undefined}
 */
export function getLegacyPubsub() { // was: g.Ru
  return globalWindow.ytPubsubPubsubInstance; // was: g.qX.ytPubsubPubsubInstance
}

/**
 * Clears tracked subscription keys for a given topic.
 * [was: s$x]
 *
 * @param {string} topic [was: Q]
 */
function clearTopicKeys(topic) { // was: s$x
  if (legacyTopicKeys[topic]) {
    const keys = legacyTopicKeys[topic];
    forEach(keys, (key) => {
      if (legacySubscriptions[key]) delete legacySubscriptions[key];
    });
    keys.length = 0;
  }
}

// ===========================================================================
// Script loader + deep equality (lines 14166-14238)
// ===========================================================================

/**
 * Dynamically loads a script by URL; fires a callback once loaded.
 * Deduplicates by URL hash so the same script is loaded at most once.
 * [was: g.mD]
 *
 * @param {string|URL} url       [was: Q]
 * @param {Function}   [callback] [was: c]
 * @param {string}     [nonce]    [was: W]
 */
export function loadScript(url, callback, nonce = null) { // was: g.mD
  loadScriptInternal(url, callback, nonce); // was: LE0(...)
}

/**
 * Internal implementation of script loading with deduplication.
 * [was: LE0]
 *
 * @param {string|URL} url       [was: Q]
 * @param {Function}   [callback] [was: c]
 * @param {string}     [nonce]    [was: W]
 */
function loadScriptInternal(url, callback, nonce = null) { // was: LE0
  const elementId = generateScriptId(typeof url === 'string' ? url : url.toString()); // was: wk7
  let element = document.getElementById(elementId);
  const isLoaded = element && isScriptLoaded(element); // was: Ygn(K)
  const exists = element && !isLoaded;

  if (isLoaded) {
    if (callback) callback();
    return;
  }

  if (callback) {
    const subscriptionKey = pubsubSubscribe(elementId, callback);
    const callbackId = `${getUniqueId(callback)}`; // was: g.ZR(c)
    callbackSubscriptions[callbackId] = subscriptionKey; // was: b0w
  }

  if (!exists) {
    element = createScriptElement(url, elementId, () => {
      if (!isScriptLoaded(element)) {
        markScriptLoaded(element); // was: k0n(K)
        pubsubPublish(elementId);
        setTimeout(() => { pubsubClear(elementId); }, 0);
      }
    }, nonce);
  }
}

/**
 * Creates a <script> element, sets its ID, attaches load handlers, and
 * inserts it into the document head.
 * [was: j$w]
 *
 * @param {string|URL} url      [was: Q]
 * @param {string}     id       [was: c]
 * @param {Function}   onLoad   [was: W]
 * @param {string}     [nonce]  [was: m]
 * @returns {HTMLScriptElement}
 */
function createScriptElement(url, id, onLoad, nonce = null) { // was: j$w
  const script = createElement('SCRIPT'); // was: g.HB("SCRIPT")
  script.id = id;
  script.onload = () => { if (onLoad) setTimeout(onLoad, 0); };
  script.onreadystatechange = () => {
    switch (script.readyState) {
      case 'loaded':
      case 'complete':
        script.onload();
    }
  };
  if (nonce) script.setAttribute('nonce', nonce);
  setSafeScriptSrc(script, typeof url === 'string' ? createTrustedUrl(url) : url); // was: g.eS(K, ...)
  const head = document.getElementsByTagName('head')[0] || document.body;
  head.insertBefore(script, head.firstChild);
  return script;
}

/**
 * Generates a unique element ID for a script URL.
 * [was: wk7]
 *
 * @param {string} url [was: Q]
 * @returns {string}
 */
function generateScriptId(url) { // was: wk7
  const anchor = document.createElement('a');
  setAnchorHref(anchor, url); // was: g.QC(c, Q)
  const normalizedUrl = anchor.href.replace(/^[a-getSlotState-Z]+:\/\//, '//');
  return `js-${hashCode(normalizedUrl)}`; // was: SS(Q)
}

/**
 * Deep-equality comparison for primitives, arrays, and plain objects.
 * [was: KL]
 *
 * @param {*} a [was: Q]
 * @param {*} b [was: c]
 * @returns {boolean}
 */
export function deepEquals(a, b) { // was: KL
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return arraysEqual(a, b, deepEquals); // was: g.y1(Q, c, KL)
  }
  if (isPlainObject(a) && isPlainObject(b)) { // was: g.Sd
    if (Object.keys(a).length !== Object.keys(b).length) return false;
    for (const key in a) {
      if (!deepEquals(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

// ===========================================================================
// Deep merge utilities (lines 14239-14276)
// ===========================================================================

/**
 * Deep-merges one or more source objects into `target`.
 * Throws if any argument is not a plain object.
 * [was: rr]
 *
 * @param {object} target    [was: Q]
 * @param {...object} sources [was: ...c]
 */
export function deepMerge(target, ...sources) { // was: rr
  if (!isObjectNotArray(target) || sources.some((s) => !isObjectNotArray(s))) {
    throw Error('Only objects may be merged.');
  }
  for (const source of sources) {
    mergeRecursive(target, source); // was: o7(Q, W)
  }
}

/**
 * Recursively merges `source` into `target`.
 * [was: o7]
 *
 * @param {object} target [was: Q]
 * @param {object} source [was: c]
 * @returns {object}
 */
function mergeRecursive(target, source) { // was: o7
  for (const key in source) {
    if (isObjectNotArray(source[key])) {
      if (key in target && !isObjectNotArray(target[key])) {
        throw Error('Cannot merge an object into a non-object.');
      }
      if (!(key in target)) target[key] = {};
      mergeRecursive(target[key], source[key]);
    } else if (isArrayType(source[key])) { // was: Up
      if (key in target && !isArrayType(target[key])) {
        throw Error('Cannot merge an array into a non-array.');
      }
      if (!(key in target)) target[key] = [];
      mergeArrayRecursive(target[key], source[key]); // was: glK
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

/**
 * Recursively copies array elements, deep-cloning objects/arrays within.
 * [was: glK]
 *
 * @param {Array} target [was: Q]
 * @param {Array} source [was: c]
 * @returns {Array}
 */
function mergeArrayRecursive(target, source) { // was: glK
  for (const item of source) {
    if (isObjectNotArray(item)) target.push(mergeRecursive({}, item));
    else if (isArrayType(item)) target.push(mergeArrayRecursive([], item));
    else target.push(item);
  }
  return target;
}

/**
 * @param {*} value
 * @returns {boolean} true if value is a non-array object
 * [was: Tf]
 */
function isObjectNotArray(value) { // was: Tf
  return typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {*} value
 * @returns {boolean} true if value is an array
 * [was: Up]
 */
function isArrayType(value) { // was: Up
  return typeof value === 'object' && Array.isArray(value);
}

// ===========================================================================
// Touch tracking, random bytes, activity tracker (lines 14277-14390)
// ===========================================================================

/**
 * Returns whether any touch in the list matches a tracked identifier.
 * [was: O0y]
 *
 * @param {object} tracker   [was: Q]
 * @param {TouchList} touches [was: c]
 * @returns {boolean}
 */
export function isTouchTracked(tracker, touches) { // was: O0y
  if (!touches) return false;
  for (let i = 0; i < touches.length; i++) {
    const touch = touches.item(i);
    if (touch && tracker.trackedIds.includes(touch.identifier)) return true; // was: Q.A.includes
  }
  return false;
}

/**
 * Generates an array of `count` cryptographically-random bytes, with a
 * fallback to Math.random() + Date-based entropy if crypto is unavailable.
 * [was: Xx]
 *
 * @param {number} count [was: Q]
 * @returns {number[]}
 */
export function getRandomBytes(count) { // was: Xx
  if (window.crypto && window.crypto.getRandomValues) {
    try {
      const result = Array(count);
      const buffer = new Uint8Array(count);
      window.crypto.getRandomValues(buffer);
      for (let i = 0; i < result.length; i++) result[i] = buffer[i];
      return result;
    } catch (_err) { /* fall through */ }
  }
  // Fallback
  const result = Array(count);
  for (let i = 0; i < count; i++) {
    const now = Date.now();
    for (let j = 0; j < now % 23; j++) result[i] = Math.random();
    result[i] = Math.floor(Math.random() * 256);
  }
  if (entropyString) { // was: I7
    for (let pos = 1, i = 0; i < entropyString.length; i++) {
      result[pos % count] ^= result[(pos - 1) % count] / 4 ^ entropyString.charCodeAt(i);
      pos++;
    }
  }
  return result;
}

/**
 * Generates a random Base64url-safe string of the given byte length.
 * [was: g.Ab]
 *
 * @param {number} byteCount [was: Q]
 * @returns {string}
 */
export function generateRandomBase64(byteCount) { // was: g.Ab
  const bytes = getRandomBytes(byteCount);
  const chars = [];
  for (let i = 0; i < bytes.length; i++) {
    chars.push('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.charAt(bytes[i] & 63));
  }
  return chars.join('');
}

/**
 * Generates a 32-character hex string (128-bit random ID).
 * [was: g.fd7]
 *
 * @returns {string}
 */
export function generateRandomHexId() { // was: g.fd7
  return map(getRandomBytes(16), (b) => (b & 15).toString(16)).join(''); // was: g.hy
}

/**
 * Initialises the user-activity tracking system.
 * Registers DOM event listeners for keyboard, mouse, touch, resize, scroll,
 * and sets the initial last-active timestamp.
 * [was: adR]
 */
export function initActivityTracker() { // was: adR
  let skipScrollTracking = false; // was: c
  let trackScroll = true; // was: Q
  ({ Yre: skipScrollTracking, CCy: trackScroll } = {}); // destructuring defaults

  if (getGlobal('_lact', window) == null) {
    let initialActivity = parseInt(getConfigValue('LACT'), 10);
    initialActivity = isFinite(initialActivity)
      ? Date.now() - Math.max(initialActivity, 0)
      : -1;
    setGlobal('_lact', initialActivity, window);
    setGlobal('_fact', initialActivity, window);
    if (initialActivity === -1) recordActivity(); // was: eI()
    registerActivityListeners(skipScrollTracking, trackScroll); // was: vl0
    new MouseTracker(() => { throttleActivity('mouse', 100); }); // was: mW -> Vp("mouse", 100)
  }
}

/**
 * Registers DOM activity listeners on the window/document.
 * [was: vl0]
 *
 * @param {boolean} [touchMoveMode=false] [was: Q]
 * @param {boolean} [scrollTracking=true] [was: c]
 */
function registerActivityListeners(touchMoveMode = false, scrollTracking = true) { // was: vl0
  const win = window;
  addEventListener(win.document, 'keydown', recordActivity); // was: g.ph(W.document, ...)
  addEventListener(win.document, 'keyup', recordActivity);
  addEventListener(win.document, 'mousedown', recordActivity);
  addEventListener(win.document, 'mouseup', recordActivity);

  if (touchMoveMode) {
    addEventListener(win, 'touchmove', () => { throttleActivity('touchmove', 200); }, { passive: true });
  } else {
    addEventListener(win, 'resize', () => { throttleActivity('resize', 200); });
    if (scrollTracking) {
      addEventListener(win, 'scroll', () => { throttleActivity('scroll', 200); });
    }
  }
  addEventListener(win.document, 'touchstart', recordActivity, { passive: true });
  addEventListener(win.document, 'touchend', recordActivity, { passive: true });
}

/**
 * Throttles activity recording by event type.
 * [was: Vp]
 *
 * @param {string} eventType [was: Q]
 * @param {number} delayMs   [was: c]
 */
function throttleActivity(eventType, delayMs) { // was: Vp
  if (!activityThrottles[eventType]) { // was: Bm[Q]
    activityThrottles[eventType] = true;
    scheduler.enqueue(() => {
      recordActivity();
      activityThrottles[eventType] = false;
    }, delayMs);
  }
}

/**
 * Records a user-activity event (updates `_lact` and `_fact` globals).
 * [was: eI]
 */
export function recordActivity() { // was: eI
  if (getGlobal('_lact', window) == null) {
    initActivityTracker();
    getGlobal('_lact', window);
  }
  const timestamp = Date.now();
  setGlobal('_lact', timestamp, window);
  if (getGlobal('_fact', window) === -1) setGlobal('_fact', timestamp, window);
  const callback = getGlobal('ytglobal.ytUtilActivityCallback_');
  if (callback) callback();
}

/**
 * Returns milliseconds since last user activity, or -1 if never active.
 * [was: YW]
 *
 * @returns {number}
 */
export function getLastActivityMs() { // was: YW
  const lastActive = getGlobal('_lact', window);
  return lastActive == null ? -1 : Math.max(Date.now() - lastActive, 0);
}

// ===========================================================================
// DI container (lines 14392-14455)
// ===========================================================================

/**
 * Creates an optional injection key wrapper.
 * [was: qg]
 *
 * @param {*} key [was: Q]
 * @returns {object}
 */
export function optionalKey(key) { // was: qg
  return new OptionalKey(key); // was: x1
}

/**
 * Registers a provider in the DI container.
 * [was: nL]
 *
 * @param {object} container [was: Q]
 * @param {object} provider  [was: c] — { key, ... }
 */
export function registerProvider(container, provider) { // was: nL
  container.providers.set(provider.key, provider); // was: Q.O.set(c.NP, c)
  const pending = container.pendingResolves.get(provider.key); // was: Q.A.get(c.NP)
  if (pending) {
    try {
      pending.resolve(container.resolve(provider.key)); // was: W.xC(Q.resolve(c.NP))
    } catch (err) {
      pending.reject(err); // was: W.SR(m)
    }
  }
}

/**
 * Resolves a dependency from the DI container, with cycle detection.
 * [was: tb]
 *
 * @param {object}   container  [was: Q]
 * @param {*}        key        [was: c]
 * @param {Array}    depChain   [was: W] — stack for cycle detection
 * @param {boolean}  [optional=false] [was: m]
 * @returns {*}
 */
export function resolveDependency(container, key, depChain, optional = false) { // was: tb
  if (depChain.indexOf(key) > -1) throw Error(`Deps cycle for: ${key}`);
  if (container.singletonCache.has(key)) return container.singletonCache.get(key); // was: Q.W
  if (!container.providers.has(key)) {
    if (optional) return;
    throw Error(`No provider for: ${key}`);
  }
  const provider = container.providers.get(key);
  depChain.push(key);

  let instance;
  if (provider.value !== undefined) { // was: Wr
    instance = provider.value;
  } else if (provider.factory) { // was: tK
    const deps = provider[DEPS_KEY] ? resolveDependencies(container, provider[DEPS_KEY], depChain) : []; // was: Du
    instance = provider.factory(...deps);
  } else if (provider.constructor_) { // was: Ag
    const Ctor = provider.constructor_;
    const deps = Ctor[DEPS_KEY] ? resolveDependencies(container, Ctor[DEPS_KEY], depChain) : [];
    instance = new Ctor(...deps);
  } else {
    throw Error(`Could not resolve providers for: ${key}`);
  }
  depChain.pop();
  if (!provider.transient) container.singletonCache.set(key, instance); // was: HUJ
  return instance;
}

/**
 * Resolves an array of dependency keys.
 * [was: GO7]
 *
 * @param {object} container [was: Q]
 * @param {Array}  keys      [was: c]
 * @param {Array}  depChain  [was: W]
 * @returns {Array}
 */
function resolveDependencies(container, keys, depChain) { // was: GO7
  return keys
    ? keys.map((k) =>
        k instanceof OptionalKey
          ? resolveDependency(container, k.key, depChain, true)
          : resolveDependency(container, k, depChain))
    : [];
}

/**
 * Returns the global DI container singleton.
 * [was: Ng]
 *
 * @returns {object}
 */
export function getGlobalContainer() { // was: Ng
  if (!globalContainer) globalContainer = new DIContainer(); // was: $qd
  return globalContainer;
}

/**
 * Creates a lazy-initialising factory for a given class in the global
 * DI container.
 * [was: ld7]
 *
 * @returns {Function}
 */
export function createLazyFactory() { // was: ld7
  const key = TargetClass; // was: PyW
  return () => {
    const container = getGlobalContainer();
    if (!container.resolve(optionalKey(key))) {
      registerProvider(container, {
        key,
        constructor_: key,
        [DEPS_KEY]: undefined,
      });
    }
    return container.resolve(key);
  };
}

// ===========================================================================
// Performance tracing (lines 14457-14507)
// ===========================================================================

/**
 * Detects the available tracing backend.
 * [was: yp]
 *
 * @returns {number} 0 = none, 1 = h5vcc (Cobalt), 2 = Performance API
 */
export function getTraceBackend() { // was: yp
  if ('h5vcc' in globalThis && globalThis.h5vcc.traceEvent?.traceBegin && globalThis.h5vcc.traceEvent?.traceEnd) {
    return 1;
  }
  if ('performance' in globalThis && globalThis.performance.mark && globalThis.performance.measure) {
    return 2;
  }
  return 0;
}

/**
 * Marks the start of a traced span.
 * [was: SI]
 *
 * @param {string} label [was: Q]
 */
export function traceBegin(label) { // was: SI
  const backend = getTraceBackend();
  switch (backend) {
    case 1:
      globalThis.h5vcc.traceEvent.traceBegin('YTLR', label);
      break;
    case 2:
      globalThis.performance.mark(`${label}-start`);
      break;
    case 0:
      break;
    default:
      assertExhaustive(backend, 'unknown trace type'); // was: cb
  }
}

/**
 * Marks the end of a traced span.
 * [was: uV0]
 *
 * @param {string} label [was: Q]
 */
export function traceEnd(label) { // was: uV0
  const backend = getTraceBackend();
  switch (backend) {
    case 1:
      globalThis.h5vcc.traceEvent.traceEnd('YTLR', label);
      break;
    case 2: {
      const startMark = `${label}-start`;
      const endMark = `${label}-end`;
      globalThis.performance.mark(endMark);
      globalThis.performance.measure(label, startMark, endMark);
      break;
    }
    case 0:
      break;
    default:
      assertExhaustive(backend, 'unknown trace type');
  }
}

/**
 * Cancels all pending lifecycle jobs in a component's job map.
 * [was: hK0]
 *
 * @param {object} component [was: Q]
 */
export function cancelAllLifecycleJobs(component) { // was: hK0
  const sortedKeys = Array.from(component.jobMap.keys()).sort(
    (a, b) => (component.jobMap[b].priority ?? 0) - (component.jobMap[a].priority ?? 0),
  ); // was: Q.W
  for (const key of sortedKeys) {
    const job = component.jobMap[key];
    if (job.jobId === undefined || job.cancelled) continue; // was: RC
    component.scheduler.cancel(job.jobId);
    resetTimer(job.timer, 10); // was: ND(c.Fk, 10)
  }
}

/**
 * Logs a state-machine transition (debug-only, behind `zK7` flag).
 * [was: Cy3]
 *
 * @param {object} stateMachine [was: Q]
 * @param {string} nextState    [was: c]
 * @param {*}      message      [was: W]
 */
export function logStateTransition(stateMachine, nextState, message) { // was: Cy3
  if (debugLifecycle && console.groupCollapsed && console.groupEnd) { // was: zK7
    console.groupCollapsed(`[${stateMachine.constructor.name}] '${stateMachine.state}' to '${nextState}'`);
    console.log('with message: ', message);
    console.groupEnd();
  }
}

// ===========================================================================
// Lifecycle callback scheduling (lines 14510-14602)
// ===========================================================================

/**
 * Partitions listeners into critical (priority 10) and non-critical, then
 * returns an executor function that runs critical ones first (possibly async)
 * and schedules the rest.
 * [was: kOX]
 *
 * @param {object}   config    [was: Q] — { O: overridePriority, j: { hpF } }
 * @param {object[]} listeners [was: c]
 * @returns {Function}
 */
export function buildListenerExecutor(config, listeners) { // was: kOX
  const critical = listeners.filter((l) => (config.overridePriority ?? l.priority ?? 0) === 10);
  const nonCritical = listeners.filter((l) => (config.overridePriority ?? l.priority ?? 0) !== 10);

  return config.options.allowAsync // was: Q.j.hpF
    ? async (...args) => {
        await executeCriticalAsync(critical, ...args); // was: Mj3
        scheduleNonCritical(config, nonCritical, ...args); // was: JQR
      }
    : (...args) => {
        executeCriticalSync(critical, ...args); // was: RKO
        scheduleNonCritical(config, nonCritical, ...args);
      };
}

/**
 * Executes critical-priority listeners sequentially, awaiting any promises.
 * [was: Mj3]
 *
 * @param {object[]} listeners [was: Q]
 * @param {...*} args          [was: ...c]
 */
async function executeCriticalAsync(listeners, ...args) { // was: Mj3
  enterLifecyclePhase(); // was: g.SL()
  for (const listener of listeners) {
    let pending;
    withErrorBoundary(() => { // was: HUy
      traceBegin(listener.name); // was: Fx
      const result = safeInvoke(() => listener.callback(...args)); // was: Zu
      if (isPromiseLike(result)) { // was: Ep(K)
        pending = getFlag('web_lifecycle_error_handling_killswitch')
          ? result.then(() => { traceEnd(listener.name); })
          : result.then(
              () => { traceEnd(listener.name); },
              (err) => {
                window.onerror?.(err.message, '', 0, 0, err);
                traceEnd(listener.name);
              },
            );
      } else {
        traceEnd(listener.name); // was: sp
      }
    });
    if (pending) await pending;
  }
}

/**
 * Schedules non-critical listeners as low-priority jobs.
 * [was: JQR]
 *
 * @param {object}   config    [was: Q]
 * @param {object[]} listeners [was: c]
 * @param {...*}     args      [was: ...W]
 */
function scheduleNonCritical(config, listeners, ...args) { // was: JQR
  const jobs = listeners.map((listener) => ({
    task: () => { // was: Fk
      traceBegin(listener.name);
      safeInvoke(() => listener.callback(...args));
      traceEnd(listener.name);
    },
    priority: config.overridePriority ?? listener.priority ?? 0,
  }));
  if (jobs.length) {
    config.jobSet = new JobSet(jobs); // was: YS7
  }
}

/**
 * Executes critical-priority listeners synchronously.
 * [was: RKO]
 *
 * @param {object[]} listeners [was: Q]
 * @param {...*} args          [was: ...c]
 */
function executeCriticalSync(listeners, ...args) { // was: RKO
  enterLifecyclePhase();
  for (const listener of listeners) {
    withErrorBoundary(() => {
      traceBegin(listener.name);
      safeInvoke(() => listener.callback(...args));
      traceEnd(listener.name);
    });
  }
}

/**
 * Invokes a function with error handling, reporting to window.onerror.
 * [was: Zu]
 *
 * @param {Function} fn [was: Q]
 * @returns {*}
 */
function safeInvoke(fn) { // was: Zu
  if (getFlag('web_lifecycle_error_handling_killswitch')) return fn();
  try {
    return fn();
  } catch (err) {
    window.onerror?.(err.message, '', 0, 0, err);
  }
}

/**
 * Returns the singleton lifecycle state-machine instance.
 * [was: Qk7]
 *
 * @returns {object}
 */
export function getLifecycleStateMachine() { // was: Qk7
  if (!lifecycleStateMachine) lifecycleStateMachine = new LifecycleStateMachine(); // was: pkK
  return lifecycleStateMachine;
}

/**
 * Returns the serialisation worker URL (if configured).
 * [was: cF3]
 *
 * @returns {string|undefined}
 */
export function getSerializationWorkerUrl() { // was: cF3
  if (!serializationWorkerUrl) {
    serializationWorkerUrl = createTrustedUrl(getConfigValue('WORKER_SERIALIZATION_URL')); // was: x3
  }
  return serializationWorkerUrl || undefined;
}

/**
 * Returns the shared serialisation Web Worker instance.
 * [was: Wgx]
 *
 * @returns {Worker|undefined}
 */
export function getSerializationWorker() { // was: Wgx
  const url = getSerializationWorkerUrl();
  if (!serializationWorker && url !== undefined) {
    serializationWorker = createWorker(url); // was: tP(Q)
  }
  return serializationWorker;
}

// ===========================================================================
// GEL IMS store / payload routing (lines 14605-14989)
// ===========================================================================

/**
 * Returns all store keys matching a filter descriptor.
 * [was: Op]
 *
 * @param {object} store  [was: Q] — the IMS store
 * @param {object} filter [was: c] — { auth, isJspb, cttAuthInfo, tier }
 * @returns {string[]}
 */
export function getMatchingStoreKeys(store, filter) { // was: Op
  const cacheKey = buildFilterKey(filter); // was: jI(c)
  if (store.keyCache[cacheKey]) return store.keyCache[cacheKey]; // was: Q.O[W]

  const allKeys = Object.keys(store.store) || [];
  if (allKeys.length <= 1 && buildFilterKey(filter) === allKeys[0]) return allKeys;

  const matched = [];
  for (let i = 0; i < allKeys.length; i++) {
    const parts = allKeys[i].split('/');
    if (matchesFilterPart(filter.auth, parts[0])) {
      const jspbStr = filter.isJspb === undefined ? 'undefined' : filter.isJspb ? 'true' : 'false';
      if (matchesFilterPart(jspbStr, parts[1]) && matchesFilterPart(filter.cttAuthInfo, parts[2])) {
        const tierStr = filter.tier === undefined ? 'undefined' : JSON.stringify(filter.tier);
        if (matchesFilterPart(tierStr, parts[3])) {
          matched.push(allKeys[i]);
        }
      }
    }
  }
  store.keyCache[cacheKey] = matched;
  return matched;
}

/**
 * Returns true if the filter value is undefined or matches the stored part.
 * [was: gr]
 *
 * @param {*}      filterValue [was: Q]
 * @param {string} storedPart  [was: c]
 * @returns {boolean}
 */
function matchesFilterPart(filterValue, storedPart) { // was: gr
  return filterValue === undefined || filterValue === 'undefined' ? true : filterValue === storedPart;
}

/**
 * Builds a composite cache key from a filter descriptor.
 * [was: jI]
 *
 * @param {object} filter [was: Q]
 * @returns {string}
 */
function buildFilterKey(filter) { // was: jI
  return [
    filter.auth === undefined ? 'undefined' : filter.auth,
    filter.isJspb === undefined ? 'undefined' : filter.isJspb,
    filter.cttAuthInfo === undefined ? 'undefined' : filter.cttAuthInfo,
    filter.tier === undefined ? 'undefined' : filter.tier,
  ].join('/');
}

/**
 * Returns the global IMS (In-Memory Store) singleton for GEL payloads.
 * [was: vm]
 *
 * @returns {object}
 */
export function getInMemoryStore() { // was: vm
  let store = getGlobal('yt.logging.ims');
  if (!store) {
    store = new InMemoryStore(); // was: fL
    setGlobal('yt.logging.ims', store);
  }
  return store;
}

/**
 * Initialises the serialisation worker listener for GEL batch dispatch.
 * [was: Ts7]
 */
export function initSerializationWorkerListener() { // was: Ts7
  if (typeof Worker !== 'function' || !getSerializationWorkerUrl() || workerListenerInitialised) return; // was: mN0
  const onMessage = (event) => {
    const data = event.data;
    if (data.op === 'serializedGelBatch') {
      const pending = pendingWorkerBatches.get(data.key); // was: a7
      if (pending) {
        sendSerializedGelBatch(
          data.serializedBatch, pending.client, pending.resolve,
          pending.networklessOptions, pending.isIsolated,
          pending.useVSSEndpoint, pending.dangerousLogToVisitorSession,
          pending.requestsOutstanding,
        ); // was: Kgw
        pendingWorkerBatches.delete(data.key);
      }
    }
  };
  const worker = getSerializationWorker();
  if (worker) {
    worker.addEventListener('message', onMessage);
    worker.onerror = () => { pendingWorkerBatches.clear(); };
  }
  workerListenerInitialised = true;
}

/**
 * Processes a JSON-format log_event payload, routing it through the IMS
 * and triggering batch flush if needed.
 * [was: AF3]
 *
 * @param {object} event    [was: Q] — { endpoint, payload, cttAuthInfo, ... }
 * @param {Function} clientCtor [was: c] — client constructor
 */
export function processJsonLogEvent(event, clientCtor) { // was: AF3
  if (event.endpoint !== 'log_event') return;
  markPayloadActive(event); // was: Gf(Q)
  const cttKey = extractCttAuthKey(event); // was: $1(Q)
  const payloadName = getPayloadName(event.payload) || ''; // was: o8w
  const policy = getPayloadPolicy(payloadName); // was: rF7(m)
  let tier = 200;

  if (policy) {
    if (policy.enabled === false && !getFlag('web_payload_policy_disabled_killswitch')) return;
    tier = tierToNumber(policy.tier); // was: UNK
    if (tier === 400) {
      sendIsolatedJsonPayload(event, clientCtor); // was: I9x
      return;
    }
  }

  activeCttKeys[cttKey] = true; // was: Pm[W]
  const storeKey = { cttAuthInfo: cttKey, isJspb: false, tier };
  getInMemoryStore().storePayload(storeKey, event.payload);
  scheduleBatchFlush(clientCtor, false, storeKey, isLoggingEnabled(payloadName)); // was: Xhm
}

/**
 * Processes a JSPB-format log_event payload.
 * [was: VbK]
 *
 * @param {string}   payloadName [was: Q]
 * @param {object}   event       [was: c]
 * @param {Function} clientCtor  [was: W]
 */
export function processJspbLogEvent(payloadName, event, clientCtor) { // was: VbK
  if (event.endpoint !== 'log_event') return;
  markPayloadActive(undefined, event); // was: Gf(void 0, c)
  const cttKey = extractCttAuthKey(event, true); // was: $1(c, !0)
  const policy = getPayloadPolicy(payloadName);
  let tier = 200;

  if (policy) {
    if (policy.enabled === false && !getFlag('web_payload_policy_disabled_killswitch')) return;
    tier = tierToNumber(policy.tier);
    if (tier === 400) {
      sendIsolatedJspbPayload(payloadName, event, clientCtor); // was: eJK
      return;
    }
  }

  activeCttKeys[cttKey] = true;
  const storeKey = { cttAuthInfo: cttKey, isJspb: true, tier };
  getInMemoryStore().storePayload(storeKey, serializeProto(event.payload)); // was: xH
  scheduleBatchFlush(clientCtor, true, storeKey, isLoggingEnabled(payloadName));
}

/**
 * Schedules a GEL batch flush, respecting debounce and hard-max limits.
 * [was: Xhm]
 *
 * @param {Function} clientCtor  [was: Q]
 * @param {boolean}  isJspb      [was: c]
 * @param {object}   storeKey    [was: W]
 * @param {boolean}  forceFlush  [was: m]
 */
function scheduleBatchFlush(clientCtor, isJspb = false, storeKey, forceFlush = false) { // was: Xhm
  if (clientCtor) activeClient = new clientCtor(); // was: uE = new Q
  const maxBatch = getNumberSetting('tvhtml5_logging_max_batch_ads_fork') ||
    getNumberSetting('tvhtml5_logging_max_batch') ||
    getNumberSetting('web_logging_max_batch') ||
    100; // was: Y3(...)
  const currentTime = now();
  const timerState = getFlushTimerState(isJspb, storeKey.tier); // was: zf
  const lastFlush = timerState.lastFlushTime; // was: T.j

  if (forceFlush) timerState.hasForcedPayload = true; // was: T.A = !0

  let queueSize = 0;
  if (storeKey) queueSize = getInMemoryStore().getSequenceCount(storeKey);

  if (queueSize >= 1000) {
    flushLogs('CODE_SECTION_FLUSH_LOGS_ON_HARD_MAX_QUEUE_SIZE', { writeThenSend: true }, isJspb, storeKey.tier);
  } else if (queueSize >= maxBatch) {
    if (!pendingFlushTimer) { // was: Mg
      pendingFlushTimer = scheduleTimer(() => {
        flushLogs('CODE_SECTION_FLUSH_LOGS_ON_MAX_QUEUE_SIZE', { writeThenSend: true }, isJspb, storeKey.tier);
        pendingFlushTimer = undefined;
      }, 0); // was: Jb(...)
    }
  } else if (currentTime - lastFlush >= 10) {
    debounceBatchFlush(isJspb, storeKey.tier); // was: Bs7
    timerState.lastFlushTime = currentTime;
  }
}

/**
 * Extracts the CTT auth key from an event descriptor, caching the
 * credential-transfer token data for later request construction.
 * [was: $1]
 *
 * @param {object}  event   [was: Q]
 * @param {boolean} [isJspb=false] [was: c]
 * @returns {string} The CTT auth key (or "visitorOnlyApprovedKey")
 */
function extractCttAuthKey(event, isJspb = false) { // was: $1
  let key = '';
  if (event.dangerousLogToVisitorSession) {
    key = 'visitorOnlyApprovedKey';
  } else if (event.cttAuthInfo) {
    if (isJspb) {
      const token = event.cttAuthInfo.token;
      const info = event.cttAuthInfo;
      const proto = new CttAuthProto(); // was: n8x
      if (info.videoId) {
        proto.setVideoId(info.videoId);
      } else if (info.playlistId) {
        setRepeatedMessage(proto, 2, PlaylistIdProto, createPlaylistId(info.playlistId)); // was: R6
      }
      jspbCttCache[token] = proto; // was: k1[c]
    } else {
      const info = event.cttAuthInfo;
      const jsonInfo = {};
      if (info.videoId) jsonInfo.videoId = info.videoId;
      else if (info.playlistId) jsonInfo.playlistId = info.playlistId;
      jsonCttCache[event.cttAuthInfo.token] = jsonInfo; // was: Y1
    }
    key = event.cttAuthInfo.token;
  }
  return key;
}

/**
 * Top-level GEL flush: extracts queued payloads from the IMS, builds
 * batches, and dispatches them.
 * [was: CL]
 *
 * @param {string}  [source]       [was: Q] — flush reason code
 * @param {object}  [options={}]   [was: c]
 * @param {boolean} [isJspb=false] [was: W]
 * @param {number}  [tier]         [was: m]
 */
export function flushLogs(source, options = {}, isJspb = false, tier) { // was: CL
  if (getFlag('enable_flush_logs_call_source_trace')) {
    let traceSource = source;
    if (source === undefined) {
      traceSource = isFirstFlush
        ? 'CODE_SECTION_FLUSH_LOGS_ON_THE_FIRST_TIME_AFTER_STARTUP'
        : 'CODE_SECTION_UNSPECIFIED';
    }
    activeCttKeys[''] = true;
    getInMemoryStore().storePayload({
      cttAuthInfo: '',
      isJspb: false,
      tier: 200,
    }, {
      eventTimeMs: Math.round(now()),
      context: { lastActivityMs: String(getLastActivityMs()) },
      tvhtml5StabilityTraceEvent: { codeSection: traceSource },
    });
  }

  new Promise((resolve, reject) => { // was: g.RF
    const timerState = getFlushTimerState(isJspb, tier);
    const hadForcedPayload = timerState.hasForcedPayload; // was: r.A -> U
    timerState.hasForcedPayload = false;
    clearTimeout(timerState.capTimer); // was: QF(r.O)
    clearTimeout(timerState.debounceTimer); // was: QF(r.W)
    timerState.debounceTimer = 0;

    if (activeClient && activeClient.isReady()) {
      if (tier === undefined && getFlag('enable_web_tiered_gel')) {
        dispatchGelBatches(resolve, reject, options, isJspb, 300, hadForcedPayload); // was: DNR
      } else {
        dispatchGelBatches(resolve, reject, options, isJspb, tier, hadForcedPayload);
      }
    } else {
      debounceBatchFlush(isJspb, tier); // was: Bs7
      resolve();
    }
  });
}

/**
 * Extracts payloads from the IMS and dispatches GEL batches (JSON or JSPB).
 * [was: DNR]
 *
 * @param {Function} resolve       [was: Q]
 * @param {Function} reject        [was: c]
 * @param {object}   [options={}]  [was: W]
 * @param {boolean}  [isJspb=false] [was: m]
 * @param {number}   [tier=200]    [was: K]
 * @param {boolean}  [hadForced=false] [was: T]
 */
function dispatchGelBatches(resolve, reject, options = {}, isJspb = false, tier = 200, hadForced = false) { // was: DNR
  const client = activeClient;

  if (isJspb) {
    const batchMap = new Map();
    for (const cttKey of Object.keys(activeCttKeys)) {
      const entries = getFlag('enable_web_tiered_gel')
        ? getInMemoryStore().smartExtractMatchingEntries({
            keys: [{ isJspb, cttAuthInfo: undefined, tier }, { isJspb, cttAuthInfo: undefined }],
            sizeLimit: 1000,
          })
        : getInMemoryStore().extractMatchingEntries({ isJspb: true, cttAuthInfo: cttKey });
      if (entries.length > 0) batchMap.set(cttKey, entries);
      if ((getFlag('web_fp_via_jspb_and_json') && options.writeThenSend) ||
          !getFlag('web_fp_via_jspb_and_json')) {
        delete activeCttKeys[cttKey];
      }
    }
    sendJspbGelBatches(batchMap, client, resolve, options, false, hadForced); // was: qJx
  } else {
    let batchMap;
    for (const cttKey of Object.keys(activeCttKeys)) {
      batchMap = getFlag('enable_web_tiered_gel')
        ? getInMemoryStore().smartExtractMatchingEntries({
            keys: [{ isJspb: false, cttAuthInfo: cttKey, tier }, { isJspb: false, cttAuthInfo: cttKey }],
            sizeLimit: 1000,
          })
        : getInMemoryStore().extractMatchingEntries({ isJspb: false, cttAuthInfo: cttKey });
      const map = new Map();
      if (batchMap.length > 0) map.set(cttKey, batchMap);
      if ((getFlag('web_fp_via_jspb_and_json') && options.writeThenSend) ||
          !getFlag('web_fp_via_jspb_and_json')) {
        delete activeCttKeys[cttKey];
      }
      sendJsonGelBatches(map, client, resolve, reject, options, false, hadForced); // was: xN7
    }
  }
}

/**
 * Debounces the next GEL batch flush.
 * [was: Bs7]
 *
 * @param {boolean} [isJspb=false] [was: Q]
 * @param {number}  [tier=200]     [was: c]
 */
function debounceBatchFlush(isJspb = false, tier = 200) { // was: Bs7
  const doFlush = () => {
    flushLogs('CODE_SECTION_FLUSH_LOGS_ON_DEBOUNCE_LOGS_QUEUE', { writeThenSend: true }, isJspb, tier);
  };
  const timerState = getFlushTimerState(isJspb, tier);

  // Cap timer
  let capDelay = (timerState === defaultTimerState || timerState === jspbTimerState) ? 5000 : DEFAULT_DEBOUNCE; // was: tb3, Hjy, Ns7
  if (getFlag('web_gel_timeout_cap') && !timerState.debounceTimer) {
    capDelay = scheduleTimer(() => { doFlush(); }, capDelay);
    timerState.debounceTimer = capDelay;
  }

  // Debounce timer
  clearTimeout(timerState.capTimer);
  let delay = getConfigValue('LOGGING_BATCH_TIMEOUT', getNumberSetting('web_gel_debounce_ms', 10000));
  if (getFlag('shorten_initial_gel_batch_timeout') && isFirstFlush) delay = SHORT_INITIAL_TIMEOUT; // was: ijW
  const timerId = scheduleTimer(() => {
    if (getNumberSetting('gel_min_batch_size') > 0) {
      if (getInMemoryStore().getSequenceCount({ cttAuthInfo: undefined, isJspb, tier }) >= MIN_BATCH_SIZE) { // was: yF3
        doFlush();
      }
    } else {
      doFlush();
    }
  }, delay);
  timerState.capTimer = timerId;
}

/**
 * Dispatches JSON-format GEL batches via Innertube.
 * [was: xN7]
 *
 * @param {Map}      batchMap  [was: Q] — cttKey -> payloads
 * @param {object}   client    [was: c]
 * @param {Function} resolve   [was: W]
 * @param {Function} reject    [was: m]
 * @param {object}   options   [was: K]
 * @param {boolean}  isIsolated [was: T]
 * @param {boolean}  hadForced  [was: r] — had forced-flush payload
 */
function sendJsonGelBatches(batchMap, client, resolve, reject, options = {}, isIsolated, hadForced) { // was: xN7
  const eventTimeMs = Math.round(now());
  let remaining = batchMap.size; // was: I
  const endpoint = getLogEventEndpoint(hadForced); // was: SJ3(r)

  for (const [cttKey, payloads] of batchMap) {
    const body = deepClone({ // was: g.Cm
      context: buildInnertubeContext(client.config_ || getInnertubeConfig()),
    });

    if (!isValidArray(payloads) && !getFlag('throw_err_when_logevent_malformed_killswitch')) {
      resolve();
      break;
    }

    body.events = payloads;
    const cttInfo = jsonCttCache[cttKey]; // was: Y1[Q]
    if (cttInfo) attachCttToBody(body, cttKey, cttInfo); // was: Fg7
    delete jsonCttCache[cttKey];

    const isVisitorOnly = cttKey === 'visitorOnlyApprovedKey'; // was: B
    stampGelBody(body, eventTimeMs, isVisitorOnly); // was: ZjK
    markNetworklessOptions(options); // was: E87

    const onSuccess = (response) => {
      if (getFlag('start_client_gcf')) {
        scheduler.enqueue(async () => { await processGcfResponse(response); }); // was: skO
      }
      remaining--;
      if (!remaining) resolve();
    };

    let retryCount = 0;
    const onError = () => {
      retryCount++;
      if (options.bypassNetworkless && retryCount === 1) {
        try {
          sendGelRequest(client, endpoint, body,
            buildGelRequestOptions({ writeThenSend: true }, isVisitorOnly, onSuccess, onError, isIsolated));
          isFirstFlush = false;
        } catch (err) {
          reportError(err);
          reject();
        }
      }
      remaining--;
      if (!remaining) resolve();
    };

    try {
      sendGelRequest(client, endpoint, body,
        buildGelRequestOptions(options, isVisitorOnly, onSuccess, onError, isIsolated));
      isFirstFlush = false;
    } catch (err) {
      reportError(err);
      reject();
    }
  }
}

/**
 * Dispatches JSPB-format GEL batches via Innertube (binary proto path).
 * [was: qJx]
 *
 * @param {Map}      batchMap  [was: Q]
 * @param {object}   client    [was: c]
 * @param {Function} resolve   [was: W]
 * @param {object}   options   [was: m]
 * @param {boolean}  isIsolated [was: K]
 * @param {boolean}  hadForced  [was: T]
 */
function sendJspbGelBatches(batchMap, client, resolve, options = {}, isIsolated, hadForced) { // was: qJx
  const eventTimeMs = Math.round(now());
  const remaining = { value: batchMap.size };
  const batchCopy = new Map([...batchMap]);

  for (const [cttKey] of batchCopy) {
    const payloads = batchMap.get(cttKey);
    const outerProto = new OuterProto(); // was: g.Wo
    const config = client.config_ || getInnertubeConfig();
    const clientInfoProto = new ClientInfoProto(); // was: m9
    const clientProto = new ClientProto(); // was: dNK

    // Populate client proto fields
    setStringField(clientProto, 1, config.hostLanguage); // was: DT
    setStringField(clientProto, 2, config.geoLocation);  // was: u1
    setInt32Field(clientProto, 16, config.clientNameId);  // was: rh
    setStringField(clientProto, 17, config.innertubeContextClientVersion);

    if (config.clientConfigInfo) {
      const configInfoProto = new ConfigInfoProto();
      if (config.clientConfigInfo.coldConfigData) setStringField(configInfoProto, 1, config.clientConfigInfo.coldConfigData);
      if (config.clientConfigInfo.appInstallData)  setStringField(configInfoProto, 6, config.clientConfigInfo.appInstallData);
      if (config.clientConfigInfo.coldHashData)    setStringField(configInfoProto, 3, config.clientConfigInfo.coldHashData);
      if (config.clientConfigInfo.hotHashData)     configInfoProto.setRepeatedField(config.clientConfigInfo.hotHashData); // was: c7
      setSubMessage(clientProto, ConfigInfoProto, 62, configInfoProto);
    }

    // Screen density
    const dpr = globalWindow.devicePixelRatio;
    if (dpr && dpr !== 1) setFixed64Field(clientProto, 65, toFloat(dpr)); // was: L3(n)

    // Experiments token
    const expToken = getExperimentsToken();
    if (expToken !== '') setStringField(clientProto, 54, expToken);

    // Internal experiment flags
    const flags = getInternalExperimentFlags();
    if (flags.length > 0) {
      const requestProto = new RequestProto(); // was: LgO
      for (let i = 0; i < flags.length; i++) {
        // ... populate internal flags on requestProto (lines 14989+)
      }
    }

    // (Remaining JSPB batch assembly continues beyond line 14989)
  }
}
