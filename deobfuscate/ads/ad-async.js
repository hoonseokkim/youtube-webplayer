/**
 * Ad telemetry continuation, promise/deferred internals, caption initialization,
 * codec helpers tail.
 *
 * Source: base.js lines 28027–29004, 31301–31413
 * [was: E$, IuW, LF, wc, bi, Xm7, Abm, O$, j5, fF, eM0, vq, am, VIn, GH,
 *  qpW, xg3, BrK, Pq, tI7, DgW, HLO, li, ui, zH, Mr, Rm, Jl, iLw, ybO,
 *  FD7, k7, Qa, E1n, Y7, s70, dgO, W2, Spn, ZL0, j7n, g1R, OL7, v1m, fux,
 *  Gfd, $gW, aud, PE7, g.rk, luR, g.Il, g.uxW, zMx, CE_, MIw, XU, AR,
 *  o0y, rZK, UEO, Va, Ifd, B2, Xo7, AZ3, eX3, g.Us, xD, VGK, Bnx, nc,
 *  DV, qEw, n0w, mp, nJ, gh3, NL, iU, yP, OpX, f0_, Fc, Z2, vh7, Ex,
 *  a0O, GrR, sx]
 */

import { storageGet, storageRemove, storageSet } from '../core/attestation.js';  // was: g.UM, g.IC, g.rl
import { buildAdSignals, getConfig } from '../core/composition-helpers.js';  // was: g.lk, g.v
import { forEach } from '../core/event-registration.js';  // was: g.mfm
import { iteratorResult } from '../core/event-system.js';  // was: g.f4
import { getCookie } from '../core/misc-helpers.js';  // was: g.V5
import { scheduleJob } from '../core/scheduler.js';  // was: g.iK
import { attachVisualElement, attachVisualElements, createVeFromTrackingParams, getClientScreenNonce, getRootVisualElement, logGelEvent, reportErrorWithLevel, reportWarning } from '../data/gel-params.js';  // was: g.Po, g.$0, g.Bo, g.Df, g.na, g.eG, g.Zf, g.Ty
import { getExperimentBoolean } from '../data/idb-transactions.js';  // was: g.P
import { qualityLabelToOrdinal } from '../media/codec-tables.js';  // was: g.EU
import { buildFullInnertubeContext } from '../network/innertube-client.js';  // was: g.Oh
import { trunc } from '../proto/messages-core.js';  // was: g.z0
import { removeFromImageCache } from '../modules/offline/download-manager.js'; // was: xL
import { isFunction } from '../proto/messages-core.js'; // was: n13
import { DEFAULT_LANGUAGE, ScreenManagerImpl } from './ad-ping-setup.js'; // was: $7, CF
import { ByteRange } from '../media/format-parser.js'; // was: sI
import { ErrorReporter } from '../proto/message-defs.js'; // was: jBy
import { readStringField } from '../proto/varint-decoder.js'; // was: t0
import { createScreen } from '../data/gel-params.js'; // was: wNx
import { appendErrorArgs } from '../data/gel-params.js'; // was: wn
import { associateScreen } from '../data/gel-params.js'; // was: cfW
import { isKnownScreenNonce } from '../data/gel-params.js'; // was: YJ7
import { logVisualElementHidden } from '../data/visual-element-tracking.js'; // was: jwn
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { reportErrorToGel } from '../data/gel-params.js'; // was: EE
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { getAllClientScreenNonces } from '../data/gel-params.js'; // was: RJW
import { logVisualElementClicked } from '../data/visual-element-tracking.js'; // was: Ca
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { probeNetworkPath } from './ad-click-tracking.js'; // was: rt
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { getRemoteModule } from '../player/caption-manager.js'; // was: w7
import { SLOT_MESSAGE_MARKER } from '../proto/messages-core.js'; // was: Ww
import { copyBytes } from '../data/collection-utils.js'; // was: cl
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { isInAdPlayback } from './dai-cue-range.js'; // was: WB
import { isCompressedDomainComposite } from '../media/audio-normalization.js'; // was: gA
import { unlisten } from '../core/composition-helpers.js'; // was: fW
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { ElementGeometryObserver } from '../data/module-init.js'; // was: et
import { getExperimentsToken } from '../data/idb-transactions.js'; // was: pe
import { computeSurveyDuration } from './companion-layout.js'; // was: cc
import { isHttps } from '../data/idb-transactions.js'; // was: Gn
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { registerAdTimelinePlayback } from './dai-cue-range.js'; // was: Rt
import { clearShoppingOverlayVisibility } from '../ui/progress-bar-impl.js'; // was: Pv
import { getInMemoryStore } from '../data/gel-core.js'; // was: vm
import { setEntity } from '../proto/varint-decoder.js'; // was: g1
import { checkFormatCompatibility } from '../media/gapless-playback.js'; // was: pv
import { getCttAuthForCsn } from '../data/gel-params.js'; // was: tZ
import { dispatchGelPayload } from '../data/gel-params.js'; // was: XY
import { compose } from '../core/composition-helpers.js'; // was: Ix
import { pushCompletedSlice } from '../media/buffer-stats.js'; // was: NJ
import { getPresenterVideoData } from '../player/playback-mode.js'; // was: mX
import { getPlayerQualityTimestamp } from '../core/attestation.js'; // was: Xwd
import { TOKEN_REGEX } from '../player/bootstrap.js'; // was: Jbw
import { ACTION_PROXY_REGEX } from '../player/bootstrap.js'; // was: RM7
import { VIDEO_ID_REGEX } from '../player/bootstrap.js'; // was: kfO
import { INDEX_REGEX } from '../player/bootstrap.js'; // was: YpO
import { MEDIA_POS_REGEX } from '../player/bootstrap.js'; // was: pmK
import { getHostWithPort } from '../data/bandwidth-tracker.js'; // was: eQ
import { populateAdBreakContext } from '../player/media-state.js'; // was: Qvy
import { elementsCommandKey } from '../modules/offline/entity-sync.js'; // was: P_H
import { getMutedAutoplayState } from '../player/media-state.js'; // was: cZm
import { parseRemoteContexts } from '../player/media-state.js'; // was: W93
import { NOCOOKIE_DOMAINS } from '../network/service-endpoints.js'; // was: mEO
import { PLAYER_FLAGS } from '../network/retry-policy.js'; // was: K90
import { VVT_REGEX } from '../player/bootstrap.js'; // was: TnX
import { onRawStateChange } from '../player/player-events.js'; // was: w_
import { linkIcon } from '../ui/svg-icons.js'; // was: x4
import { globalSamplingState } from '../data/module-init.js'; // was: nX
import { isTextTrackMimeType } from '../media/codec-helpers.js'; // was: LM
import { lookupSlotLayout } from './ad-telemetry.js'; // was: E$
import { isTrackTypeUsable } from '../media/track-manager.js'; // was: Sg
import { VideoInfo } from '../media/codec-tables.js'; // was: gh
import { FormatInfo } from '../media/codec-tables.js'; // was: OU
import { trimSegmentsBefore } from '../media/format-setup.js'; // was: lfx
import { createLoggerFromConfig } from '../data/logger-init.js'; // was: mu
import { PlayerError } from '../ui/cue-manager.js';
import { toString, startsWith } from '../core/string-utils.js';
import { clear, slice, filter } from '../core/array-utils.js';
import { appendParamsToUrl } from '../core/url-utils.js';
import { isEmptyObject } from '../core/object-utils.js';
import { getWebPlayerContextConfig } from '../player/player-api.js';
import { getCurrentTime, getDuration } from '../player/time-tracking.js';
import { logVisualElementShown } from '../data/visual-element-tracking.js';
import { botGuardInstance } from '../data/device-platform.js';
// TODO: resolve g.h
// TODO: resolve g.lB
// TODO: resolve g.qa
// TODO: resolve g.xh

// Stub: ProgressiveStream [was: SP] — simple progressive media stream without index range (base.js ~81404).
// Extends BaseMediaStream [was: Ac] (base.js ~81273).  Not yet extracted to its own module.
const ProgressiveStream = SP; // was: SP

// Stub: IndexedMediaStream [was: IM] — media stream with init + index ranges (base.js ~81923).
// Extends BaseMediaStream [was: Ac] (base.js ~81273).  Not yet extracted to its own module.
const IndexedMediaStream = IM; // was: IM

// ---------------------------------------------------------------------------
// Map-based lookup (line 28027)
// ---------------------------------------------------------------------------

/**
 * Look up a value in a map-like store by key.
 * [was: E$]
 * @param {Object} store  [was: Q]  (has .W which is a Map)
 * @param {*} key  [was: c]
 * @returns {*|null}
 */
export function lookupInMap(store, key) { // was: E$
  return store.W.get(key) || null;
}

// ---------------------------------------------------------------------------
// Deferred / Promise internals (lines 28031–28177)
// ---------------------------------------------------------------------------

/**
 * Create a deferred { xL, resolve, reject }.
 * [was: IuW]
 * @returns {{ xL: s$, resolve: Function, reject: Function }}
 */
export function createDeferred() { // was: IuW
  let resolve, reject; // was: Q, c
  return {
    removeFromImageCache: new s$((res, rej) => {
      resolve = res;
      reject = rej;
    }),
    resolve,
    reject,
  };
}

/**
 * Lift a value into a custom promise (s$). If already an s$, returns it;
 * if it is a thenable, wraps it; otherwise resolves immediately.
 * [was: LF]
 * @param {*} value  [was: Q]
 * @returns {s$}
 */
export function liftToPromise(value) { // was: LF
  if (dc(value)) return value;
  if (Ep(value)) {
    return new s$((resolve, reject) => { // was: c, W
      value.then(resolve, reject);
    });
  }
  return new s$((resolve) => { // was: c
    resolve(value);
  });
}

/**
 * Create a rejected custom promise.
 * [was: wc]
 * @param {*} reason  [was: Q]
 * @returns {s$}
 */
export function rejectPromise(reason) { // was: wc
  return new s$((_, reject) => { // was: c, W
    reject(reason);
  });
}

/**
 * Try to invoke a function, returning a rejected promise on throw.
 * [was: bi]
 * @param {Function} fn  [was: Q]
 * @returns {s$}
 */
export function tryAsync(fn) { // was: bi
  try {
    return liftToPromise(fn());
  } catch (err) { // was: c
    return rejectPromise(err);
  }
}

/**
 * Convert a custom promise (s$) to a native Promise.
 * [was: Xm7]
 * @param {s$} customPromise  [was: Q]
 * @returns {Promise}
 */
export function toNativePromise(customPromise) { // was: Xm7
  return new Promise((resolve, reject) => { // was: c, W
    thenCustom(customPromise, resolve, reject); // was: j5
  });
}

/**
 * Async wrapper around toNativePromise.
 * [was: Abm]
 */
export async function awaitCustomPromise(customPromise) { // was: Abm
  return toNativePromise(customPromise);
}

/**
 * Flush pending fulfillment or rejection handlers on a settled promise.
 * [was: O$]
 * @param {s$} promise  [was: Q]
 */
export function flushHandlers(promise) { // was: O$
  if (promise.W === "fulfilled") {
    const handlers = promise.O; // was: c
    promise.O = [];
    promise.A = [];
    for (const handler of handlers) { // was: W
      handler(promise.result);
    }
  } else if (promise.W === "rejected") {
    const handlers = promise.A; // was: W (reused from c)
    promise.O = [];
    promise.A = [];
    for (const handler of handlers) { // was: c
      handler(promise.error);
    }
  }
}

/**
 * Attach fulfillment / rejection callbacks to a custom promise, returning
 * a new chained promise.
 * [was: j5]
 * @param {s$} promise  [was: Q]
 * @param {Function} [onFulfilled]  [was: c]
 * @param {Function} [onRejected]  [was: W]
 * @returns {s$}
 */
export function thenCustom(promise, onFulfilled, onRejected) { // was: j5
  const { removeFromImageCache: chained, resolve, reject } = createDeferred(); // was: m, K, T
  promise.O.push((value) => { // was: r
    if (onFulfilled) {
      try {
        const result = onFulfilled(value); // was: U
        resolve(result);
      } catch (err) { // was: U
        reject(err);
      }
    } else {
      resolve(value);
    }
  });
  promise.A.push((reason) => { // was: r
    if (onRejected) {
      try {
        const result = onRejected(reason); // was: U
        resolve(result);
      } catch (err) { // was: U
        reject(err);
      }
    } else {
      reject(reason);
    }
  });
  flushHandlers(promise); // was: O$(Q)
  return chained;
}

/**
 * Attach only a rejection handler (catch equivalent).
 * [was: fF]
 * @param {s$} promise  [was: Q]
 * @param {Function} onRejected  [was: c]
 * @returns {s$}
 */
export function catchCustom(promise, onRejected) { // was: fF
  return thenCustom(promise, undefined, onRejected); // was: j5(Q, void 0, c)
}

/**
 * Attach a finally-style handler (runs after settle, preserves result).
 * [was: eM0]
 * @param {s$} promise  [was: Q]
 * @param {Function} handler  [was: c]
 */
export function finallyCustom(promise, handler) { // was: eM0
  thenCustom(
    promise,
    (value) => thenCustom(liftToPromise(handler()), () => value), // was: W
    (reason) => thenCustom(liftToPromise(handler()), () => rejectPromise(reason)) // was: W
  );
}

/**
 * Run a generator-based coroutine on `this`.
 * [was: vq]
 */
export function runCoroutineOn(thisArg, generatorFn) { // was: vq
  return runCoroutine(generatorFn.call(thisArg)); // was: VIn(c.call(Q))
}

/**
 * Create a generator wrapper that yields a single lifted value.
 * [was: am]
 */
export function yieldValue(value) { // was: am
  return (function* () {
    return yield { removeFromImageCache: liftToPromise(value) };
  })();
}

/**
 * Run a generator to completion as an async pipeline.
 * [was: VIn]
 */
export function runCoroutine(generator) { // was: VIn
  return tryAsync(() => stepGenerator(generator, generator.next())); // was: bi(() => GH(...))
}

/**
 * Recursive generator stepper.
 * [was: GH]
 */
export function stepGenerator(generator, iteratorResult) { // was: GH
  if (iteratorResult.done) return liftToPromise(iteratorResult.value);
  return catchCustom(
    thenCustom(iteratorResult.value.removeFromImageCache, (val) => stepGenerator(generator, generator.next(val))), // was: W
    (err) => stepGenerator(generator, generator.throw(err)) // was: W
  );
}

/**
 * Settle all promises in an array and return their states.
 * [was: qpW]
 */
export function settleAll(promises) { // was: qpW
  const wrapped = wrapAll(promises); // was: c -> BrK(Q)
  return thenCustom(waitForAll(wrapped), () => wrapped.map((p) => p.state())); // was: xg3, W
}

/**
 * Wait for all promises to settle (fulfill or reject).
 * [was: xg3]
 */
export function waitForAll(promises) { // was: xg3
  if (promises.length === 0) return liftToPromise(NaN);
  const { removeFromImageCache: combined, resolve } = createDeferred(); // was: c, W
  let remaining = promises.length; // was: m
  for (const [index, promise] of promises.entries()) { // was: K, T
    const idx = index; // was: r
    finallyCustom(promise, () => {
      if (combined.W === "pending") {
        if (isFunction(undefined) && (undefined)(idx) && combined.W === "pending") { // was: void 0
          resolve(idx);
        } else {
          --remaining;
          if (remaining === 0) resolve(NaN);
        }
      }
    });
  }
  return combined;
}

/**
 * Wrap all values in the array with liftToPromise.
 * [was: BrK]
 */
export function wrapAll(values) { // was: BrK
  return values.map((v) => liftToPromise(v)); // was: c
}

// ---------------------------------------------------------------------------
// Duration formatting (lines 28179–28225)
// ---------------------------------------------------------------------------

/**
 * Format a duration object { hours, minutes, seconds, ... } into a locale-aware
 * time string (e.g. "1:02:03").
 * [was: Pq]
 * @param {Object} duration  [was: Q]
 * @returns {string}
 */
export function formatDuration(duration) { // was: Pq
  let hours = duration.hours || 0; // was: c
  let minutes = duration.minutes || 0; // was: W
  let seconds = duration.seconds || 0; // was: m
  let totalSeconds = seconds + minutes * 60 + hours * 3600 +
    (duration.days || 0) * 86400 +
    (duration.weeks || 0) * 604800 +
    (duration.months || 0) * 2629800 +
    (duration.years || 0) * 31557600;

  let normalized;
  if (totalSeconds <= 0) {
    normalized = { hours: 0, minutes: 0, seconds: 0 };
  } else {
    hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    minutes = Math.floor(totalSeconds / 60);
    seconds = Math.floor(totalSeconds % 60);
    normalized = { hours, minutes, seconds };
  }

  const { hours: h = 0, minutes: min = 0, seconds: sec = 0 } = normalized; // was: K, T, r
  const hasHours = h > 0; // was: W
  const parts = []; // was: c

  if (hasHours) {
    let hoursStr = new Intl.NumberFormat("en-u-nu-latn").format(h); // was: Q
    const spaceLocales = "af be bg cs et fi fr-CA hu hy ka kk ky lt lv no pl pt-PT ru sk sq sv uk uz".split(" "); // was: inline
    const narrowSpaceLocales = ["fr"]; // was: m
    const dotLocales = "az bs ca da de el es eu gl hr id is it km lo mk nl pt-BR ro sl sr sr-Latn tr vi".split(" ");
    if (spaceLocales.includes(DEFAULT_LANGUAGE)) {
      hoursStr = hoursStr.replace(",", "\u00a0");
    } else if (narrowSpaceLocales.includes(DEFAULT_LANGUAGE)) {
      hoursStr = hoursStr.replace(",", "\u202f");
    } else if (dotLocales.includes(DEFAULT_LANGUAGE)) {
      hoursStr = hoursStr.replace(",", ".");
    }
    parts.push(hoursStr);
  }

  parts.push(formatMinutes(min, hasHours)); // was: DgW
  parts.push(twoDigitFormatter().format(sec)); // was: tI7

  let separator = ":"; // was: W
  if ("da fi id si sr sr-Latn".split(" ").includes(DEFAULT_LANGUAGE)) {
    separator = ".";
  }
  return parts.join(separator);
}

/**
 * Get a 2-digit number formatter.
 * [was: tI7]
 * @returns {Intl.NumberFormat}
 */
export function twoDigitFormatter() { // was: tI7
  return new Intl.NumberFormat("en-u-nu-latn", { minimumIntegerDigits: 2 });
}

/**
 * Format minutes, optionally zero-padding when hours are present.
 * [was: DgW]
 * @param {number} minutes  [was: Q]
 * @param {boolean} hasHours  [was: c]
 * @returns {string}
 */
export function formatMinutes(minutes, hasHours = false) { // was: DgW
  const zeroPadLocales = ["af", "be", "lt"];
  return (zeroPadLocales.includes(DEFAULT_LANGUAGE) || hasHours) && minutes < 10
    ? twoDigitFormatter().format(minutes)
    : new Intl.NumberFormat("en-u-nu-latn").format(minutes);
}

// ---------------------------------------------------------------------------
// Credential / text helpers (lines 28227–28258)
// ---------------------------------------------------------------------------

/**
 * Extract an authorization token for a given scope from a watch endpoint config.
 * [was: HLO]
 * @param {Object} endpoint  [was: Q]
 * @param {string} scope  [was: c]
 * @returns {string|undefined}
 */
export function getCredentialToken(endpoint, scope) { // was: HLO
  const tokens = endpoint.watchEndpointSupportedAuthorizationTokenConfig
    ?.videoAuthorizationToken?.credentialTransferTokens || [];
  for (let i = 0; i < tokens.length; ++i) { // was: W
    if (tokens[i].scope === scope) return tokens[i].token || undefined; // was: void 0
  }
}

/**
 * Extract plain text from a renderer text object (simpleText or runs).
 * [was: li]
 * @param {Object} textObj  [was: Q]
 * @returns {string}
 */
export function extractPlainText(textObj) { // was: li
  if (textObj && textObj.simpleText) return textObj.simpleText;
  let result = ""; // was: c
  if (textObj && textObj.runs) {
    for (let i = 0; i < textObj.runs.length; i++) { // was: W
      if (textObj.runs[i].text) result += textObj.runs[i].text;
    }
  }
  return result;
}

/**
 * Wrap a function so that errors are caught and reported via reportErrorWithLevel.
 * [was: ui]
 * @param {Function} fn  [was: Q]
 * @returns {Function}
 */
export function wrapSafe(fn) { // was: ui
  if (!fn) return fn;
  return function () {
    try {
      return fn.apply(this, arguments);
    } catch (err) { // was: c
      reportErrorWithLevel(err);
    }
  };
}

// ---------------------------------------------------------------------------
// Singleton managers (lines 28255–28263)
// ---------------------------------------------------------------------------

/**
 * Get the singleton hl (screen-manager helper) instance.
 * [was: zH]
 * @returns {hl}
 */
export function getScreenManagerHelper() { // was: zH
  if (!hl.instance) hl.instance = new hl();
  return hl.instance;
}

/**
 * Get the singleton ScreenManagerImpl instance.
 * [was: Mr]
 * @returns {ScreenManagerImpl}
 */
export function getClientFacingManager() { // was: Mr
  if (!ScreenManagerImpl.instance) ScreenManagerImpl.instance = new ScreenManagerImpl(); // was: new CF()
  return ScreenManagerImpl.instance;
}

// ---------------------------------------------------------------------------
// Screen / VE creation helpers (lines 28265–28610)
// ---------------------------------------------------------------------------

/**
 * Create a client screen with a visual-element root.
 * [was: Rm]
 * @param {Object} screenManager  [was: Q]
 * @param {number} rootVeType  [was: c]
 * @param {*} rootElement  [was: W]
 * @param {Object} options  [was: m]
 */
export function createClientScreen(screenManager, rootVeType, rootElement, options = {}) { // was: Rm
  wrapWithErrorReporter(() => {
    if (!NrK.includes(rootVeType)) {
      reportWarning(new PlayerError("createClientScreen() called with a non-page VE", rootVeType));
      rootVeType = 83769;
    }
    if (!options.isHistoryNavigation) {
      if (getExperimentBoolean("enable_screen_manager_layer_separation")) {
        const layer = options.layer || 0; // was: K
        screenManager.Ie.set(layer, []);
        getLayerStack(screenManager, layer).push({ rootVe: rootVeType, key: options.key || "" });
      } else {
        screenManager.W.push({ rootVe: rootVeType, key: options.key || "" });
      }
    }
    screenManager.Y = [];
    screenManager.mF = [];
    if (options.readStringField) {
      initDelayedScreen(screenManager, rootVeType, rootElement, options); // was: iLw
    } else {
      initImmediateScreen(screenManager, rootVeType, rootElement, options); // was: ybO
    }
  })();
}

/**
 * Get or create the layer stack for a given layer index.
 * [was: Jl]
 */
export function getLayerStack(screenManager, layer) { // was: Jl
  if (!screenManager.J.has(layer)) screenManager.J.set(layer, []);
  return screenManager.J.get(layer);
}

/**
 * Initialize a delayed screen (waits for data promises).
 * [was: iLw]
 */
export function initDelayedScreen(screenManager, rootVeType, rootElement, options = {}) { // was: iLw
  screenManager.O.add(options.layer || 0);
  screenManager.K = () => {
    initImmediateScreen(screenManager, rootVeType, rootElement, options); // was: ybO
    const parentVe = getRootVisualElement(options.layer);
    if (parentVe) {
      for (const entry of screenManager.Y) { // was: T
        graftVisualElement(screenManager, entry[0], entry[1] || parentVe, options.layer); // was: k7
      }
      for (const entry of screenManager.mF) { // was: T
        publishVisualElementState(screenManager, entry[0], entry[1]); // was: Spn
      }
    }
  };
  if (!rootElement && !getClientScreenNonce(options.layer)) screenManager.K();
  if (options.readStringField) {
    for (const dataPromise of options.readStringField) { // was: K
      processDelayedData(screenManager, dataPromise, options.layer); // was: FD7
    }
  } else {
    reportErrorWithLevel(Error("Delayed screen needs a data promise."));
  }
}

/**
 * Initialize a screen immediately (no deferred data).
 * [was: ybO]
 */
export function initImmediateScreen(screenManager, rootVeType, rootElement, options = {}) { // was: ybO
  let parentLayer = undefined; // was: K -> void 0
  if (!options.layer) options.layer = 0;
  parentLayer = options.parentLayer !== undefined ? options.parentLayer : options.layer; // was: void 0
  const parentCsn = getClientScreenNonce(parentLayer); // was: T
  const parentVe = getRootVisualElement(parentLayer); // was: K
  const rootVe = rootElement || parentVe; // was: r
  let parentContext; // was: U
  if (rootVe) {
    if (options.parentCsn !== undefined) { // was: void 0
      parentContext = { clientScreenNonce: options.parentCsn, visualElement: rootVe };
    } else if (parentCsn && parentCsn !== "UNDEFINED_CSN") {
      parentContext = { clientScreenNonce: parentCsn, visualElement: rootVe };
    }
  }
  let servletData; // was: I
  const eventId = getConfig("EVENT_ID"); // was: X
  if (parentCsn === "UNDEFINED_CSN" && eventId) {
    servletData = { servletData: { serializedServletEventId: eventId } };
  }
  if (getExperimentBoolean("combine_ve_grafts") && parentCsn) flushPendingGrafts(screenManager, parentCsn); // was: Y7
  if (getExperimentBoolean("no_client_ve_attach_unless_shown") && rootVe && parentCsn) u5(rootVe, parentCsn);

  let csn; // was: A
  try {
    csn = createScreen(
      screenManager.client, rootVeType, parentContext,
      options.n5, options.cttAuthInfo, servletData,
      options.implicitGestureType, options.loggingExpectations,
      options.automatedLogEventSource
    );
  } catch (err) { // was: V
    appendErrorArgs(err, { MC: rootVeType, rootVe: parentVe, NXI: rootElement, AAF: parentCsn, vRH: parentContext, n5: options.n5 });
    reportErrorWithLevel(err);
    return;
  }
  associateScreen(csn, rootVeType, options.layer, options.cttAuthInfo);
  if (parentCsn && parentCsn !== "UNDEFINED_CSN" && parentVe && !isKnownScreenNonce(parentCsn)) {
    logVisualElementHidden(screenManager.client, parentCsn, parentVe, true); // was: !0
  }
  if (getExperimentBoolean("enable_screen_manager_layer_separation")) {
    const stack = getLayerStack(screenManager, options.layer || 0);
    if (stack.length > 0 && !stack[stack.length - 1].csn) {
      stack[stack.length - 1].csn = csn || "";
    }
  } else if (screenManager.W[screenManager.W.length - 1] &&
             !screenManager.W[screenManager.W.length - 1].csn) {
    screenManager.W[screenManager.W.length - 1].csn = csn || "";
  }
  g.xh({ clientScreenNonce: csn });
  if (!pF.instance) pF.instance = new pF();
  wrapWithErrorReporter(getScreenManagerHelper().W).bind(getScreenManagerHelper())(); // was: zH
  const layerVe = getRootVisualElement(options.layer); // was: e
  if (parentCsn && parentCsn !== "UNDEFINED_CSN" && layerVe && getExperimentBoolean("music_web_mark_root_visible")) {
    logVisualElementShown(csn, layerVe);
  }
  screenManager.O.delete(options.layer || 0);
  screenManager.K = undefined; // was: void 0
  screenManager.MM.get(options.layer)?.forEach((ve, key) => { // was: V, B
    ve ? graftVisualElement(screenManager, key, ve, options.layer) : (layerVe && graftVisualElement(screenManager, key, layerVe, options.layer));
  });
  flushCallbackQueues(screenManager); // was: ZL0
}

/**
 * Process a delayed data promise for a screen.
 * [was: FD7]
 */
export function processDelayedData(screenManager, dataPromise, layer = 0) { // was: FD7
  wrapWithErrorReporter(() => {
    dataPromise.then((data) => { // was: m
      if (screenManager.O.has(layer) && screenManager.K) screenManager.K();
      const csn = getClientScreenNonce(layer); // was: K
      const ve = getRootVisualElement(layer); // was: T
      if (csn && ve) {
        const autoOptions = { automatedLogEventSource: 3 }; // was: r
        if (data?.response?.trackingParams) {
          attachVisualElement(screenManager.client, csn, ve, createVeFromTrackingParams(data.response.trackingParams), false, autoOptions); // was: !1
        }
        if (data?.playerResponse?.trackingParams) {
          attachVisualElement(screenManager.client, csn, ve, createVeFromTrackingParams(data.playerResponse.trackingParams), false, autoOptions);
        }
      }
    });
  })();
}

/**
 * Graft a visual element onto the current screen.
 * [was: k7]
 */
export function graftVisualElement(screenManager, veData, parentVe, layer = 0) { // was: k7
  return wrapWithErrorReporter(() => {
    if (screenManager.O.has(layer)) {
      screenManager.Y.push([veData, parentVe]);
      return true; // was: !0
    }
    const csn = getClientScreenNonce(layer); // was: K
    const root = parentVe || getRootVisualElement(layer); // was: T
    if (csn && root) {
      if (getExperimentBoolean("combine_ve_grafts")) {
        const existing = screenManager.j.get(root.toString()); // was: r
        if (existing) {
          existing.push(veData);
        } else {
          screenManager.L.set(root.toString(), root);
          screenManager.j.set(root.toString(), [veData]);
        }
        if (!screenManager.isSamsungSmartTV) {
          screenManager.isSamsungSmartTV = scheduleJob(0, () => {
            flushPendingGrafts(screenManager, csn); // was: Y7
          }, 1200);
        }
      } else {
        attachVisualElement(screenManager.client, csn, root, veData);
      }
      return true;
    }
    return false; // was: !1
  })();
}

/**
 * Convenience: graft a tracking-params byte string.
 * [was: Qa]
 */
export function graftTrackingParams(trackingParams) { // was: Qa
  const mgr = getClientFacingManager(); // was: c -> Mr()
  wrapWithErrorReporter(() => {
    const veData = createVeFromTrackingParams(trackingParams); // was: W
    graftVisualElement(mgr, veData);
    return veData;
  })();
}

/**
 * Create and graft a client-side visual element (veType 253246).
 * [was: E1n]
 */
export function graftClientVE(screenManager) { // was: E1n
  const config = { veType: 253246 }; // was: c
  return wrapWithErrorReporter(() => {
    if (!config.veType) {
      reportErrorToGel(new PlayerError("Error: Trying to graft a client VE without a veType."));
      return null;
    }
    let visibilityData; // was: W
    if (config.visibilityTypes) {
      const combined = config.visibilityTypes.reduce((acc, v) => acc | v); // was: m, K
      visibilityData = { visibility: { types: String(combined) } };
    }
    const ve = createVisualElement(config.veType, config.visualElement, config.elementIndex, config.clientYouTubeData, undefined, visibilityData); // was: void 0
    return graftVisualElement(screenManager, ve) ? ve : null;
  })();
}

/**
 * Flush pending batched VE grafts for a CSN.
 * [was: Y7]
 */
export function flushPendingGrafts(screenManager, csn) { // was: Y7
  if (csn === undefined) { // was: void 0
    const allCsns = getAllClientScreenNonces(); // was: W
    for (let i = 0; i < allCsns.length; i++) { // was: m
      if (allCsns[i] !== undefined) flushPendingGrafts(screenManager, allCsns[i]);
    }
  } else {
    screenManager.j.forEach((batch, key) => { // was: W, m
      const root = screenManager.L.get(key); // was: m
      if (root) attachVisualElements(screenManager.client, csn, root, batch);
    });
    screenManager.j.clear();
    screenManager.L.clear();
    screenManager.isSamsungSmartTV = undefined; // was: void 0
  }
}

/**
 * Send a visual element interaction on layer 0.
 * [was: s70]
 */
export function sendInteraction(screenManager, veData) { // was: s70
  const csn = getClientScreenNonce(0); // was: W
  if (csn) logVisualElementClicked(screenManager.client, csn, veData, undefined); // was: void 0
}

/**
 * Send a tracking-params interaction.
 * [was: dgO]
 */
export function sendTrackingInteraction(screenManager, trackingParams, extra, layer = 0) { // was: dgO
  if (!trackingParams) return false; // was: !1
  const csn = getClientScreenNonce(layer); // was: m
  if (!csn) return false;
  logVisualElementClicked(screenManager.client, csn, createVeFromTrackingParams(trackingParams), extra);
  return true; // was: !0
}

// ---------------------------------------------------------------------------
// Watchtime / playback-event serialisation (lines 28480–28574)
// ---------------------------------------------------------------------------

/**
 * Build the watchtime / playback-event payload.
 * [was: W2]
 * @param {Object} event  [was: Q]
 * @returns {Object} serialised params
 */
export function buildWatchtimePayload(event) { // was: W2
  const params = { // was: c
    ns: event.MQ,
    createDatabaseDefinition: event.eventLabel,
    cpn: event.clientPlaybackNonce,
    ver: 2,
    cmt: event.O(event.W),
    fmt: event.mainVideoEntityActionMetadataKey,
    fs: event.readRepeatedMessageField ? "1" : "0",
    probeNetworkPath: event.O(event.applyQualityConstraint),
    adformat: event.adFormat,
    content_v: event.contentVideoId,
    euri: event.getRemoteModule,
    lact: event.SLOT_MESSAGE_MARKER,
    live: event.FO,
    copyBytes: (888952760).toString(),
    mos: event.w6,
    state: event.playerState,
    volume: event.qY,
  };
  if (event.subscribed) params.subscribed = "1";
  Object.assign(params, event.u3);
  if (event.L === "all") {
    Object.assign(params, event.Fw);
  } else if (event.L === "once" && event.A) {
    Object.assign(params, event.Fw);
  }
  if (event.autoplay) params.autoplay = "1";
  if (event.isTvHtml5Exact) params.sautoplay = "1";
  if (event.toggleFineScrub) params.dni = "1";
  if (!event.K && event.jG) params.epm = LD3[event.jG];
  if (event.isFinal) params["final"] = "1";
  if (event.XI) params.splay = "1";
  if (event.A2) params.delay = event.A2;
  if (event.UH) params.hl = event.UH;
  if (event.region) params.cr = event.region;
  if (event.userGenderAge) params.uga = event.userGenderAge;
  if (event.userAge !== undefined && event.La) params.uga = event.La + event.userAge; // was: void 0
  if (event.Ka !== undefined) params.len = event.O(event.Ka);
  if ((!event.K || event.isInAdPlayback) && event.experimentIds.length > 0) {
    params.fexp = event.experimentIds.toString();
  }
  if (event.J !== null) params.rtn = event.O(event.J);
  if (event.fT) params.feature = event.fT;
  if (event.zd) params.ctrl = event.zd;
  if (event.V$) params.ytr = event.V$;
  if (event.Y0) params.afmt = event.Y0;
  if (event.offlineDownloadUserChoice) params.ODUC = event.offlineDownloadUserChoice;
  if (event.mF) params.lio = event.O(event.mF);
  if (event.K) {
    params.idpj = event.yY;
    params.ldpj = event.isCompressedDomainComposite;
    if (event.delayThresholdMet) params.dtm = "1";
    if (event.Y != null) params.rti = event.O(event.Y);
    if (event.unlisten) params.ald = event.unlisten;
    if (event.compositeLiveIngestionOffsetToken) params.clio = event.compositeLiveIngestionOffsetToken;
  } else if (event.adType !== undefined) { // was: void 0
    params.at = event.adType;
  }
  if (event.skipNextIcon && (event.A || event.K)) params.size = event.skipNextIcon;
  if (event.A && event.D.length) params.pbstyle = event.D.join(",");
  if (event.Xw != null && (event.A || event.K)) params.inview = event.O(event.Xw);
  if (event.heartbeatLoggingToken) params.hb_data = event.heartbeatLoggingToken;
  if (event.K) {
    params.volume = c2(event, map(event.segments, (s) => s.volume));
    params.st = c2(event, map(event.segments, (s) => s.startTime));
    params.ElementGeometryObserver = c2(event, map(event.segments, (s) => s.endTime));
    if (Jy(event.segments, (s) => s.playbackRate !== 1)) {
      params.rate = c2(event, map(event.segments, (s) => s.playbackRate));
    }
    if (Jy(event.segments, (s) => s.W !== "-")) {
      params.als = map(event.segments, (s) => s.W).join(",");
    }
    if (Jy(event.segments, (s) => s.previouslyEnded)) {
      params.getExperimentsToken = map(event.segments, (s) => `${+s.previouslyEnded}`).join(",");
    }
  }
  params.muted = c2(event, map(event.segments, (s) => s.muted ? 1 : 0));
  if (Jy(event.segments, (s) => s.visibilityState !== 0)) {
    params.vis = c2(event, map(event.segments, (s) => s.visibilityState));
  }
  if (Jy(event.segments, (s) => s.connectionType !== 0)) {
    params.conn = c2(event, map(event.segments, (s) => s.connectionType));
  }
  if (Jy(event.segments, (s) => s.O !== 0)) {
    params.blo = c2(event, map(event.segments, (s) => s.O));
  }
  if (Jy(event.segments, (s) => !!s.K)) {
    params.blo = map(event.segments, (s) => s.K).join(",");
  }
  if (Jy(event.segments, (s) => !!s.compositeLiveStatusToken)) {
    params.cbs = map(event.segments, (s) => s.compositeLiveStatusToken).join(",");
  }
  if (Jy(event.segments, (s) => s.A !== "-")) {
    params.computeSurveyDuration = map(event.segments, (s) => s.A).join(",");
  }
  if (Jy(event.segments, (s) => s.clipId !== "-")) {
    params.clipid = map(event.segments, (s) => s.clipId).join(",");
  }
  if (Jy(event.segments, (s) => !!s.audioId)) {
    let key = "au";
    if (event.A) key = "au_d";
    params[key] = map(event.segments, (s) => s.audioId).join(",");
  }
  if (isHttps() && event.S) {
    params.ctt = event.S;
    params.cttype = event.instreamAdPlayerOverlayRenderer;
    params.mdx_environment = event.mdxEnvironment;
  }
  if (event.registerAdTimelinePlayback) params.etype = event.isSamsungSmartTV !== undefined ? event.isSamsungSmartTV : 0; // was: void 0
  if (event.JJ) params.uoo = event.JJ;
  if (event.livingRoomAppMode && event.livingRoomAppMode !== "LIVING_ROOM_APP_MODE_UNSPECIFIED") {
    params.clram = wm0[event.livingRoomAppMode] || event.livingRoomAppMode;
  }
  if (event.j) {
    bLm(event, params);
  } else {
    params.docid = event.videoId;
    params.referrer = event.referrer;
    params.ei = event.eventId;
    params.of = event.clearShoppingOverlayVisibility;
    params.osid = event.osid;
    params.getInMemoryStore = event.videoMetadata;
    if (event.adQueryId) params.aqi = event.adQueryId;
    if (event.autonav) params.autonav = "1";
    if (event.playlistId) params.list = event.playlistId;
    if (event.setEntity) params.ssrt = "1";
    if (event.checkFormatCompatibility) params.upt = event.checkFormatCompatibility;
  }
  if (event.A) {
    if (event.embedsRct) params.rct = event.embedsRct;
    if (event.embedsRctn) params.rctn = event.embedsRctn;
    if (event.compositeLiveIngestionOffsetToken) params.clio = event.compositeLiveIngestionOffsetToken;
  }
  if (event.PA) params.host_cpn = event.PA;
  return params;
}

// ---------------------------------------------------------------------------
// Visual-element state publishing / callback queues (lines 28576–28615)
// ---------------------------------------------------------------------------

/**
 * Publish a visual-element state-change event.
 * [was: Spn]
 */
export function publishVisualElementState(screenManager, ve, clientData, layer = 0) { // was: Spn
  const csn = getClientScreenNonce(layer); // was: K
  ve = ve || getRootVisualElement(layer);
  if (csn && ve) {
    const client = screenManager.client; // was: Q
    const loggingOptions = fa({ cttAuthInfo: getCttAuthForCsn(csn) || undefined }, csn); // was: m, void 0
    const payload = { csn, ve: ve.getAsJson(), clientData }; // was: W
    if (csn === "UNDEFINED_CSN") {
      hZ("visualElementStateChanged", loggingOptions, payload);
    } else if (client) {
      dispatchGelPayload("visualElementStateChanged", payload, client, loggingOptions);
    } else {
      logGelEvent("visualElementStateChanged", payload, loggingOptions);
    }
  }
}

/**
 * Flush deferred screen-init callback queues.
 * [was: ZL0]
 */
export function flushCallbackQueues(screenManager) { // was: ZL0
  for (let i = 0; i < screenManager.D.length; i++) { // was: c
    const callback = screenManager.D[i]; // was: W
    try {
      callback();
    } catch (err) { // was: m
      reportErrorWithLevel(err);
    }
  }
  screenManager.D.length = 0;
  for (let i = 0; i < screenManager.S.length; i++) { // was: c
    const callback = screenManager.S[i];
    try {
      callback();
    } catch (err) {
      reportErrorWithLevel(err);
    }
  }
}

/**
 * Get or create the mG singleton.
 * [was: j7n]
 */
export function getModuleManager() { // was: j7n
  if (!mG.instance) mG.instance = new mG();
  return mG.instance;
}

// ---------------------------------------------------------------------------
// XHR factory / storage helpers (lines 28616–28688)
// ---------------------------------------------------------------------------

/**
 * Create an XMLHttpRequest with optional readyState handler.
 * [was: g1R]
 * @param {string} url  [was: Q]
 * @param {Object} options  [was: c]
 * @param {Object} [callbacks]  [was: W]
 * @returns {XMLHttpRequest}
 */
export function createConfiguredXHR(url, options, callbacks) { // was: g1R
  const xhr = new XMLHttpRequest(); // was: m
  if (callbacks?.compose) {
    xhr.onreadystatechange = (evt) => { // was: K
      callbacks.compose(xhr, evt);
    };
  }
  xhr.open(options.method ?? "GET", url, true); // was: !0
  xhr.responseType = "text";
  xhr.withCredentials = true;
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) { // was: K, T
      xhr.setRequestHeader(key, value);
    }
  }
  return xhr;
}

/**
 * Query the webkitTemporaryStorage quota/usage via navigator.
 * [was: OL7]
 * @returns {Promise}
 */
export function queryTemporaryStorageQuota() { // was: OL7
  const nav = navigator; // was: Q
  return new Promise((resolve, reject) => { // was: c, W
    if (nav.webkitTemporaryStorage?.queryUsageAndQuota) {
      nav.webkitTemporaryStorage.queryUsageAndQuota(
        (usage, quota) => resolve({ usage, quota }), // was: m, K
        (err) => reject(err) // was: m
      );
    } else {
      reject(Error("webkitTemporaryStorage is not supported."));
    }
  });
}

/**
 * Report an IndexedDB quota-exceeded event.
 * [was: v1m]
 */
export function reportIDBQuotaExceeded(reporter, details) { // was: v1m
  Kc.getInstance().estimate().then((estimate) => { // was: W
    reporter.W("idbQuotaExceeded", {
      ...details,
      isSw: self.document === undefined, // was: void 0
      isIframe: self !== self.top,
      deviceStorageUsageMbytes: toMegabytesString(estimate?.usage), // was: fux
      deviceStorageQuotaMbytes: toMegabytesString(estimate?.quota),
    });
  });
}

/**
 * Convert bytes to a megabytes string, or "-1" if undefined.
 * [was: fux]
 * @param {number|undefined} bytes  [was: Q]
 * @returns {string}
 */
export function toMegabytesString(bytes) { // was: fux
  return typeof bytes === "undefined" ? "-1" : String(Math.ceil(bytes / 1048576));
}

// ---------------------------------------------------------------------------
// BotGuard / third-party helpers (lines 28665–28741)
// ---------------------------------------------------------------------------

/**
 * Initialize BotGuard with the given program.
 * [was: Gfd]
 */
export function initBotGuard(program, config) { // was: Gfd
  if (shouldReinitBotGuard(program.program, config.dl)) { // was: aud
    tr("bg_i", undefined, "player_att"); // was: void 0
    botGuardInstance.initialize(program, () => {
      tr("bg_l", undefined, "player_att");
      ol = (0, g.h)();
    }, config.cspNonce, config.kq);
  }
}

/**
 * Invoke BotGuard.
 * [was: $gW]
 */
export function invokeBotGuard(options = {}) { // was: $gW
  return botGuardInstance.invoke(options);
}

/**
 * Check whether BotGuard should be (re-)initialized.
 * [was: aud]
 */
export function shouldReinitBotGuard(program, reinitThreshold) { // was: aud
  if (!program) return false; // was: !1
  let shouldInit;
  if (botGuardInstance.isLoading()) {
    shouldInit = false;
  } else {
    shouldInit = !ol || ((0, g.h)() - ol > reinitThreshold);
  }
  return shouldInit;
}

/**
 * Build a video-info URL for partner namespaces (books, docs, google-live).
 * [was: PE7]
 */
export function getPartnerVideoInfoUrl(config, videoData) { // was: PE7
  if (videoData.partnerId === 38 && config.playerStyle === "books") {
    const colonIdx = videoData.videoId.indexOf(":"); // was: Q
    return appendParamsToUrl(
      `//play.google.com/books/volumes/${videoData.videoId.slice(0, colonIdx)}/content/media`,
      { aid: videoData.videoId.slice(colonIdx + 1), sig: videoData.sB }
    );
  }
  if (videoData.partnerId === 30 && config.playerStyle === "docs") {
    return appendParamsToUrl("https://docs.google.com/get_video_info", {
      docid: videoData.videoId,
      authuser: videoData.pushCompletedSlice,
      authkey: videoData.CV,
      eurl: config.w6,
    });
  }
  if (videoData.partnerId === 33 && config.playerStyle === "google-live") {
    return appendParamsToUrl("//google-liveplayer.appspot.com/get_video_info", { key: videoData.videoId });
  }
  throw Error("getVideoInfoUrl for invalid namespace: " + config.mF);
}

/**
 * Build a timed-text URL.
 * [was: g.rk]
 */
export function getTimedTextUrl(config, videoData) { // was: g.rk
  return config.kq + "timedtext_video?ref=player&v=" + videoData.videoId;
}

/**
 * Extract extension headers (ytrext).
 * [was: luR]
 */
export function extractExtensionHeaders(options) { // was: luR
  const headers = {}; // was: c
  if (options.getPresenterVideoData) headers.ytrext = options.getPresenterVideoData;
  return isEmptyObject(headers) ? undefined : headers; // was: void 0
}

/**
 * Initialize BotGuard from experiment config.
 * [was: g.Il]
 */
export function initBotGuardFromExperiments(program, config) { // was: g.Il
  initBotGuard(program, {
    dl: getExperimentValue(config.experiments, "bg_vm_reinit_threshold"),
    cspNonce: config.cspNonce,
    kq: config.kq || "",
  });
}

/**
 * Build a debug string from video data.
 * [was: g.uxW]
 */
export function buildVideoDebugString(state) { // was: g.uxW
  if (state.videoData && state.videoData.Ds) {
    const parts = [state.videoData.Ds]; // was: c
    for (const key of Object.keys(state.W)) { // was: W
      if (state.LK[key] && state.W[key]) {
        const part = state.W[key](state.LK); // was: m
        if (part) parts.push(part);
      }
    }
    return parts.join("&");
  }
  return null;
}

// ---------------------------------------------------------------------------
// Bandwidth / quality / storage helpers (lines 28742–29004)
// ---------------------------------------------------------------------------

/**
 * Set the bandwidth-cookie max-age.
 * [was: zMx]
 */
export function setBandwidthCookieMaxAge(multiplier) { // was: zMx
  hMX = 2592e3 * (multiplier || 1);
}

/**
 * Persist bandwidth estimate to local storage.
 * [was: CE_]
 */
export function persistBandwidth(value) { // was: CE_
  storageSet("yt-player-bandwidth", value, 2592e3);
}

/* obfuscated call-through — kept opaque */
var MIw = function (a, b, c, d, e, f, h, k) { // was: MIw
  return Bs[x[13]](this, 40, 5676, a, b, c, d, e, f, h, k);
};

/**
 * Read the persisted quality preference (with staleness check).
 * [was: XU]
 */
export function getPersistedQuality(maxAge = hMX) { // was: XU
  if (maxAge > 0 && !(getPlayerQualityTimestamp() > (0, g.h)() - maxAge * 1e3)) return 0;
  const stored = storageGet("yt-player-quality"); // was: Q
  if (typeof stored === "string") {
    const quality = qualityLabelToOrdinal[stored]; // was: Q
    if (quality > 0) return quality;
  } else if (stored instanceof Object) {
    return stored.quality;
  }
  return 0;
}

/**
 * Get the Proxima preference from local storage.
 * [was: AR]
 */
export function getProximaPreference() { // was: AR
  const value = storageGet("yt-player-proxima-pref"); // was: Q
  return value == null ? null : value;
}

/**
 * Build the ad-break request payload.
 * [was: o0y]
 */
export function buildAdBreakRequest(context, urlString, params, mdxContext, cueProcessedMs, cuepointId) { // was: o0y
  const driftFromHead = params.DRIFT_FROM_HEAD_MS && !Number.isNaN(params.DRIFT_FROM_HEAD_MS)
    ? Math.trunc(params.DRIFT_FROM_HEAD_MS)
    : 0; // was: r
  let adParams = TOKEN_REGEX.exec(urlString); // was: U
  adParams = adParams != null && adParams.length >= 2 ? adParams[1] : "";
  const isProxy = ACTION_PROXY_REGEX.test(urlString); // was: I
  let videoId = VIDEO_ID_REGEX.exec(urlString); // was: X
  videoId = videoId != null && videoId.length >= 2 ? videoId[1] : "";
  let breakIndex = INDEX_REGEX.exec(urlString); // was: A
  breakIndex = breakIndex != null && breakIndex.length >= 2 && !Number.isNaN(Number(breakIndex[1]))
    ? Number(breakIndex[1])
    : 1;
  let breakPosition = MEDIA_POS_REGEX.exec(urlString); // was: e
  breakPosition = breakPosition != null && breakPosition.length >= 2 ? breakPosition[1] : "0";
  const tld = getHostWithPort(context.player.G().kq); // was: V
  const videoData = context.player.getVideoData({ playerType: 1 }); // was: B
  const innertubeContext = buildFullInnertubeContext(videoData.S, true); // was: n, !0
  const biscottiId = "BISCOTTI_ID" in params ? params.BISCOTTI_ID : ""; // was: S

  populateAdBreakContext(context, innertubeContext, urlString, biscottiId.toString(), context.player.G(), videoData);

  const playbackContext = { // was: B
    splay: false, // was: !1
    lactMilliseconds: params.LACT.toString(),
    playerHeightPixels: Math.trunc(params.elementsCommandKey),
    playerWidthPixels: Math.trunc(params.P_W),
    vis: Math.trunc(params.VIS),
    signatureTimestamp: 20536,
    autonavState: getMutedAutoplayState(context.player.G()),
  };
  playbackContext.encryptedHostFlags = context.player.G().getWebPlayerContextConfig()?.encryptedHostFlags;

  if (mdxContext) {
    const mdx = {}; // was: m
    if (parseRemoteContexts(mdx, params.YT_REMOTE)) playbackContext.mdxContext = mdx;
  }

  const prefCookie = NOCOOKIE_DOMAINS.includes(tld) ? undefined : getCookie("PREF"); // was: m, void 0
  if (prefCookie) {
    let parts = prefCookie.split(RegExp("[:&]")); // was: d
    for (let i = 0, len = parts.length; i < len; i++) { // was: w, f
      const kv = parts[i].split("="); // was: b
      if ((kv[0].toUpperCase() === "SML" || kv[0].toUpperCase() === "GSML") &&
          kv.length > 1 && kv[1].toUpperCase() === "TRUE") {
        innertubeContext.user.lockedSafetyMode = true; // was: !0
        break;
      }
    }
    // Check auto-captions flag in PREF cookie
    let autoCaptions = false; // was: m -> !1
    if ("FLAG_AUTO_CAPTIONS_DEFAULT_ON" in PLAYER_FLAGS) {
      const prefParts = prefCookie.split(RegExp("[:&]")); // was: m
      const flagId = PLAYER_FLAGS.FLAG_AUTO_CAPTIONS_DEFAULT_ON; // was: b
      const fieldKey = "f" + (1 + Math.floor(flagId / 31)).toString(); // was: d
      const bitmask = 1 << Math.floor(flagId % 31); // was: b
      for (let i = 0, len = prefParts.length; i < len; i++) { // was: w, f
        const pair = prefParts[i].split("="); // was: G
        if (pair[0] === fieldKey && parseInt("0x" + pair[1], 16) & bitmask) {
          autoCaptions = true; // was: !0
          break;
        }
      }
    }
    playbackContext.autoCaptionsDefaultOn = autoCaptions;
  }

  let cttMatch = VVT_REGEX.exec(urlString); // was: c
  const ctt = cttMatch != null && cttMatch.length >= 2 ? cttMatch[1] : "";
  if (ctt && videoId) {
    innertubeContext.user.credentialTransferTokens = [{ token: ctt, scope: "VIDEO" }];
  }

  const overrideContext = { contentPlaybackContext: playbackContext }; // was: c
  const request = { // was: U
    adBlock: Math.trunc(params.AD_BLOCK),
    params: adParams,
    breakIndex,
    breakPositionMs: breakPosition,
    clientPlaybackNonce: params.CPN,
    topLevelDomain: tld,
    isProxyAdTagRequest: isProxy,
    context: innertubeContext,
    adSignalsInfoString: onRawStateChange(buildAdSignals(biscottiId.toString())), // was: lk
    overridePlaybackContext: overrideContext,
  };
  if (cueProcessedMs !== undefined) request.cueProcessedMs = Math.round(cueProcessedMs).toString(); // was: void 0
  if (cuepointId) request.cuepointId = cuepointId;
  if (videoId) request.videoId = videoId;
  if (params.LIVE_TARGETING_CONTEXT) request.liveTargetingParams = params.LIVE_TARGETING_CONTEXT;
  if (params.AD_BREAK_LENGTH) request.breakLengthMs = Math.trunc(params.AD_BREAK_LENGTH * 1e3).toString();
  if (driftFromHead) request.driftFromHeadMs = driftFromHead.toString();
  request.currentMediaTimeMs = Math.round(context.player.getCurrentTime({ playerType: 1 }) * 1e3);
  const adBreakCtx = context.player.getGetAdBreakContext(); // was: Q
  if (adBreakCtx) request.getAdBreakContext = adBreakCtx;
  return request;
}

/**
 * Determine if quality changed up (1), down (-1), or not (0).
 * [was: rZK]
 * @returns {number}
 */
export function getQualityChangeDirection() { // was: rZK
  const stored = storageGet("yt-player-quality"); // was: Q
  if (stored instanceof Object && stored.quality && stored.previousQuality) {
    if (stored.quality > stored.previousQuality) return 1;
    if (stored.quality < stored.previousQuality) return -1;
  }
  return 0;
}

/**
 * Read persisted player memory state from localStorage.
 * [was: UEO]
 */
export function readPlayerMemory() { // was: UEO
  const result = { values: {}, linkIcon: {} }; // was: Q
  try {
    const parsed = JSON.parse(JSON.parse(window.localStorage["yt-player-memory"]).data); // was: c
    result.values = parsed.values;
    result.halfLives = parsed.halfLives;
  } catch {}
  return result;
}

/**
 * Get persisted performance-cap settings.
 * [was: Va]
 */
export function getPerformanceCap() { // was: Va
  return storageGet("yt-player-performance-cap") || {};
}

/**
 * Clear or prune the performance-cap data.
 * [was: Ifd]
 */
export function clearPerformanceCap(keepCurrent = false) { // was: Ifd, !1
  if (keepCurrent) {
    const caps = getPerformanceCap(); // was: Q -> Va()
    for (const key of Object.keys(caps)) { // was: c
      if (key.indexOf("1") !== 0) delete caps[key];
    }
    storageSet("yt-player-performance-cap", caps, 2592e3);
  } else {
    storageRemove("yt-player-performance-cap");
  }
}

/**
 * Get the active performance-cap set.
 * [was: B2]
 */
export function getActiveCapSet() { // was: B2
  return storageGet("yt-player-performance-cap-active-set") ?? [];
}

/**
 * Reset the active performance-cap set.
 * [was: Xo7]
 */
export function resetActiveCapSet(keepCurrent = false) { // was: Xo7, !1
  if (keepCurrent) {
    const filtered = getActiveCapSet().filter((entry) => entry.startsWith("1")); // was: Q, c
    storageSet("yt-player-performance-cap-active-set", filtered, 2592e3);
  } else {
    storageSet("yt-player-performance-cap-active-set", [], 2592e3);
  }
}

/**
 * Persist a "watch later" pending state.
 * [was: AZ3]
 */
export function persistWatchLaterPending(value) { // was: AZ3
  storageSet("yt-player-watch-later-pending", value);
}

/**
 * Check if headers are readable from storage.
 * [was: eX3]
 * @returns {boolean}
 */
export function areHeadersReadable() { // was: eX3
  return !!storageGet("yt-player-headers-readable");
}

/**
 * Get caption-language preferences from storage.
 * [was: g.Us]
 * @returns {Array}
 */
export function getCaptionLanguagePreferences() { // was: g.Us
  const stored = storageGet("yt-player-caption-language-preferences"); // was: Q
  return stored ? stored : [];
}

/**
 * Get user settings from storage as a Map.
 * [was: xD]
 * @returns {Map}
 */
export function getUserSettings() { // was: xD
  const stored = storageGet("yt-player-user-settings"); // was: Q
  const map = new Map(); // was: c
  if (stored) {
    for (const [key, value] of Object.entries(stored)) { // was: W, m
      map.set(key, value);
    }
  }
  return map;
}

/**
 * Get voice-boost preference.
 * [was: VGK]
 */
export function getVoiceBoostPreference() { // was: VGK
  return storageGet("yt-player-voice-boost") ?? undefined; // was: void 0
}

/**
 * Get audio quality setting (default: 2).
 * [was: Bnx]
 * @returns {number}
 */
export function getAudioQualitySetting() { // was: Bnx
  return storageGet("yt-player-audio-quality-setting") ?? 2;
}

/**
 * Detect the browser autoplay policy.
 * [was: nc]
 * @returns {string}
 */
export function detectAutoplayPolicy() { // was: nc
  try {
    const nav = window.navigator; // was: Q
    if (nav.getAutoplayPolicy && typeof nav.getAutoplayPolicy === "function") {
      const players = document.getElementsByClassName(g.qa.Fo); // was: c
      let policy; // was: W
      policy = players.length > 0 && players[0]
        ? nav.getAutoplayPolicy(players[0])
        : nav.getAutoplayPolicy("mediaelement");
      if (xEO[policy]) return xEO[policy];
    }
  } catch (_err) {} // was: Q
  return "AUTOPLAY_BROWSER_POLICY_UNSPECIFIED";
}

/**
 * Check if any form of autoplay is intended.
 * [was: DV]
 * @param {Object} videoData  [was: Q]
 * @returns {boolean}
 */
export function isAutoplayIntended(videoData) { // was: DV
  return videoData.nO || videoData.F_ || videoData.mutedAutoplay;
}

/**
 * Determine the autoplay status string.
 * [was: qEw]
 */
export function getAutoplayStatus(videoData, state) { // was: qEw
  if (!isAutoplayIntended(videoData)) return "AUTOPLAY_STATUS_NOT_ATTEMPTED";
  if (state !== 1 && state !== 2 && state !== 0) return "AUTOPLAY_STATUS_UNAVAILABLE";
  return videoData.bP ? "AUTOPLAY_STATUS_BLOCKED" : "AUTOPLAY_STATUS_OCCURRED";
}

/**
 * Attach third-party embed context to the request.
 * [was: n0w]
 */
export function attachThirdPartyContext(request, app, state) { // was: n0w
  const config = app.G(); // was: m
  if (!request.thirdParty) request.thirdParty = {};
  request.thirdParty = {
    ...request.thirdParty,
    embedUrl: config.loaderUrl,
  };
  if (config.ancestorOrigins) {
    request.thirdParty.embeddedPlayerContext = {
      ...request.thirdParty.embeddedPlayerContext,
      ancestorOrigins: config.ancestorOrigins,
    };
  }
  if (config.Eh != null) {
    request.thirdParty.embeddedPlayerContext = {
      ...request.thirdParty.embeddedPlayerContext,
      visibilityFraction: Number(config.Eh),
    };
  }
  if (config.mA) {
    request.thirdParty.embeddedPlayerContext = {
      ...request.thirdParty.embeddedPlayerContext,
      visibilityFractionSource: config.mA,
    };
  }
  request.thirdParty.embeddedPlayerContext = {
    ...request.thirdParty.embeddedPlayerContext,
    autoplayBrowserPolicy: detectAutoplayPolicy(), // was: nc()
    autoplayIntended: isAutoplayIntended(app), // was: DV
    autoplayStatus: getAutoplayStatus(app, state), // was: qEw
  };
}

/**
 * Parse a comma-separated device-filter string into structured entries.
 * [was: mp]
 * @param {string} filterString  [was: Q]
 * @returns {Array}
 */
export function parseDeviceFilter(filterString) { // was: mp
  const result = []; // was: c
  for (let entry of filterString.split(",")) { // was: W
    if (!entry) continue;
    let isExclusion; // was: Q
    if ((isExclusion = entry.startsWith("!"))) entry = entry.substring(1);
    const parts = entry.split("-"); // was: m
    if (parts.length < 3) continue;
    result.push({
      fE: parts[0],
      platform: parts[1],
      deviceVersion: parts[2],
      xp: isExclusion,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Live / manifest helpers (lines 31301–31413)
// ---------------------------------------------------------------------------

/**
 * Check whether a live manifest needs refreshing.
 * [was: nJ]
 * @param {Object} manifest  [was: Q]
 * @returns {boolean}
 */
export function needsLiveRefresh(manifest) { // was: nJ
  return manifest.isLive && (0, g.h)() - manifest.Ka >= manifest.S;
}

/**
 * Get the number of segments currently available from any loaded index.
 * [was: gh3]
 * @param {Object} manifest  [was: Q]
 * @returns {number}
 */
export function getSegmentCount(manifest) { // was: gh3
  const streams = manifest.W; // was: Q
  for (const key in streams) { // was: c
    const index = streams[key].index; // was: W
    if (index.isLoaded()) return index.globalSamplingState() + 1;
  }
  return 0;
}

/**
 * Get the live-head offset from the Kd field.
 * [was: NL]
 * @param {Object} manifest  [was: Q]
 * @returns {number}
 */
export function getLiveHeadOffset(manifest) { // was: NL
  return manifest.Kd ? manifest.Kd - (manifest.L || manifest.timestampOffset) : 0;
}

/**
 * Get the NF-based offset.
 * [was: iU]
 */
export function getNFOffset(manifest) { // was: iU
  return manifest.NF ? manifest.NF - (manifest.L || manifest.timestampOffset) : 0;
}

/**
 * Compute average segment duration.
 * [was: yP]
 */
export function getAverageSegmentDuration(manifest) { // was: yP
  if (!isNaN(manifest.MM)) return manifest.MM;
  const streams = manifest.W; // was: c
  for (let key in streams) { // was: W
    const index = streams[key].index; // was: m
    if (index.isLoaded() && !isTextTrackMimeType(streams[key].info.mimeType)) {
      let totalDuration = 0; // was: c
      for (let seg = index.lookupSlotLayout(); seg <= index.globalSamplingState(); seg++) { // was: W
        totalDuration += index.getDuration(seg);
      }
      totalDuration /= index.eK();
      totalDuration = Math.round(totalDuration / 0.5) * 0.5;
      if (index.eK() > 10) manifest.MM = totalDuration;
      return totalDuration;
    }
    if (manifest.isLive) {
      const stream = streams[key]; // was: m
      if (stream.isTrackTypeUsable) return stream.isTrackTypeUsable;
    }
  }
  return NaN;
}

/**
 * Get the next segment start time at or after `time`.
 * [was: OpX]
 */
export function getNextSegmentStart(manifest, time) { // was: OpX
  const stream = $W(manifest.W, (s) => s.index.isLoaded()); // was: Q, m
  if (!stream) return NaN;
  const index = stream.index; // was: Q
  const seg = index.zf(time); // was: W
  return index.getStartTime(seg) === time
    ? time
    : seg < index.globalSamplingState()
      ? index.getStartTime(seg + 1)
      : NaN;
}

/**
 * Ensure a fake "0" stream entry exists in the manifest.
 * [was: f0_]
 */
export function ensureFakeStream(manifest, isProgressive) { // was: f0_
  if (!manifest.W["0"]) {
    const fakeInfo = new FormatInfo("0", "fakesb", { video: new VideoInfo(0, 0, 0, undefined, undefined, "auto") }); // was: W, void 0
    manifest.W["0"] = isProgressive
      ? new ProgressiveStream(new g.lB("http://www.youtube.com/videoplayback"), fakeInfo, "fake") // was: new SP()
      : new IndexedMediaStream(new g.lB("http://www.youtube.com/videoplayback"), fakeInfo, new ByteRange(0, 0), new ByteRange(0, 0)); // was: new IM(), new sI()
  }
}

/**
 * Clear all segment data from a manifestless manifest.
 * [was: Fc]
 */
export function clearManifestlessSegments(manifest) { // was: Fc
  if (manifest.isManifestless) {
    for (const key in manifest.W) { // was: c
      manifest.W[key].index.segments = [];
    }
  }
}

/**
 * Truncate segment indexes for a given media type at a given time.
 * [was: Z2]
 */
export function truncateSegments(manifest, time, isAudio) { // was: Z2
  for (const key in manifest.W) { // was: m
    const isMediaMatch = isTextTrackMimeType(manifest.W[key].info.mimeType) || manifest.W[key].info.MK();
    if (isAudio === isMediaMatch) {
      manifest.W[key].index?.mF(time);
    }
  }
}

/**
 * Truncate non-audio streams to Infinity (effectively clearing segments).
 * [was: vh7]
 */
export function truncateVideoStreams(manifest) { // was: vh7
  for (const key in manifest.W) { // was: c
    if (!isTextTrackMimeType(manifest.W[key].info.mimeType)) {
      trimSegmentsBefore(manifest.W[key].index, Infinity);
    }
  }
}

/**
 * Update drift/offset parameters on all streams.
 * [was: Ex]
 */
export function updateDriftParams(manifest, drift, createLoggerFromConfig) { // was: Ex
  for (const key in manifest.W) { // was: r
    const index = manifest.W[key].index; // was: m
    if (index.bB) {
      if (drift) index.D2 = Math.max(index.D2, drift); // was: K
      if (createLoggerFromConfig) index.Mu = Math.max(index.Mu || 0, createLoggerFromConfig); // was: T
    }
  }
  if (createLoggerFromConfig) manifest.isSamsungSmartTV = createLoggerFromConfig / 1e3;
}

/**
 * Add cuepoints to the manifest and publish the event.
 * [was: a0O]
 */
export function addCuepoints(manifest, cpData, cpType, skipDuplicate = false) { // was: a0O, !1
  if (skipDuplicate && cpType === manifest.Y0) return;
  manifest.T2.push(cpData);
  manifest.Y0 = cpType;
  manifest.publish("cuepointsadded", cpType);
}

/**
 * Reset live-head tracking fields.
 * [was: GrR]
 */
export function resetLiveHead(manifest) { // was: GrR
  manifest.NF = 0;
  manifest.Kd = 0;
  manifest.TO = 0;
}

/**
 * Check if the manifest represents a playable live stream.
 * [was: sx]
 */
export function isPlayableLive(manifest) { // was: sx
  return manifest.jG && manifest.isManifestless
    ? manifest.isLiveHeadPlayable
    : manifest.isLive;
}

/**
 * BotGuard attestation singleton. [was: g.Tg]
 */
export const botGuardInstance = {
  initialize(program, callback) { callback(); },
  invoke(options) { return Promise.resolve(); },
  isLoading() { return false; },
};
