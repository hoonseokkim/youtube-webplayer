import { getConfig, trustedResourceUrlFrom } from '../core/composition-helpers.js';
import { confirmDialogEndpoint, getProperty } from '../core/misc-helpers.js';
import { pubsubUnsubscribe } from '../data/gel-core.js';
import { reportErrorWithLevel, reportWarning } from '../data/gel-params.js';
import { buildFullInnertubeContext } from './innertube-client.js';
import { buildInnertubeApiPath } from './service-endpoints.js';
import { mute } from '../player/player-api.js';
import { shouldUseFirstPartyCookie } from '../core/composition-helpers.js'; // was: j$
import { isPflMode } from '../core/composition-helpers.js'; // was: G0n
import { setConfig } from '../core/composition-helpers.js'; // was: y$
import { SlotIdFulfilledNonEmptyTrigger } from '../ads/ad-trigger-types.js'; // was: FD
import { addJob } from '../core/scheduler.js'; // was: ND
import { getExperimentNumber } from '../data/idb-transactions.js'; // was: Y3
import { getScriptLoader } from '../core/event-registration.js'; // was: TS
import { unwrapSafeScript } from '../core/composition-helpers.js'; // was: Bz
import { EXTENSION_GUARD } from '../proto/messages-core.js'; // was: xJ
import { unwrapTrustedResourceUrl } from '../core/composition-helpers.js'; // was: x3
import { loadScriptFromChallenge } from '../core/event-registration.js'; // was: IK
import { BotGuardInitialiser } from '../data/logger-init.js'; // was: HG
import { fetchAttestationChallenge } from './uri-utils.js'; // was: SK
import { getBufferHealth } from '../media/segment-request.js'; // was: El
import { onInternalAudioFormatChange } from '../player/player-events.js'; // was: mp
import { getResolver } from './innertube-config.js'; // was: Ng
import { pubsubClear } from '../data/gel-core.js'; // was: dq7
import { reportAdsControlFlowError } from '../data/interaction-logging.js'; // was: v1
import { adPingingEndpoint } from '../core/misc-helpers.js'; // was: Vu7
import { recordCurrentMediaTime } from '../media/engine-config.js'; // was: R4
import { publishAdEvent } from '../player/media-state.js'; // was: b1
import { isSlotRegistered } from '../ads/ad-scheduling.js'; // was: h1
import { getSlotState } from '../ads/ad-scheduling.js'; // was: zA
import { isSlotActiveOrEnterRequested } from '../ads/ad-scheduling.js'; // was: Cr
import { requestSlotExit } from '../ads/ad-scheduling.js'; // was: Fu_
import { fireSlotAdEvent } from '../ads/slot-id-generator.js'; // was: Mw
import { httpStatusToGrpcCode } from '../media/bitstream-reader.js'; // was: LO
import { getActiveLayout } from '../ads/ad-scheduling.js'; // was: J1
import { getScreenManagerHelper } from '../ads/ad-async.js'; // was: zH
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { releaseTriggerAdapters } from '../ads/ad-scheduling.js'; // was: Rz
import { getSlotStatesByKey } from '../ads/ad-scheduling.js'; // was: kO
import { processTriggerBatch } from '../ads/ad-scheduling.js'; // was: pr
import { logAdEventWithSlotLayout } from '../ads/ad-telemetry.js'; // was: cR
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { isLayoutRendering } from '../ads/ad-scheduling.js'; // was: WR
import { logIllegalStage } from '../ads/ad-scheduling.js'; // was: md
import { getExperimentBoolean } from '../core/composition-helpers.js';
import { getWithDefault } from '../core/object-utils.js';
import { loadScript } from '../core/event-registration.js';
import { toString } from '../core/string-utils.js';
import { getUid, getObjectByPath } from '../core/type-helpers.js';
import { scheduleJob } from '../core/scheduler.js';
import { dispose } from '../ads/dai-cue-range.js';
import { clamp } from '../core/math-utils.js';
import { sendInnertubeRequest } from './innertube-client.js';
import { PlayerError } from '../ui/cue-manager.js';
import { createElement, appendChild } from '../core/dom-utils.js';
import { getDomain } from '../core/url-utils.js';
import { every } from '../core/array-utils.js';
import { MetadataCollection } from '../ads/ad-triggers.js';
import { globalScheduler } from '../core/scheduler.js'; // was: g.YF

/**
 * URI Utilities — query string parsing, BGE (BotGuard Environment) controls,
 * attestation challenge fetching, ad signal loading, heat-map SVG path generation,
 * settings API, ad click tracking, thumbnail selection, and bot-guard loader.
 *
 * Source: base.js lines 20068–20984
 * [was: Dt, ZOR, t1, HI, sYd, wJw, i1, yJ, bOW, Zt, SK, jYR, guW,
 *  OO7, fEm, vu_, aEO, F$, GQ7, getPlaybackAttestationToken, isAttestationRefreshReady, $A7, hh7, CSn, JzW,
 *  Rh_, zhy, Y_0, pJ7, Wu3, Kun, cJ3, TwX, rJ7, s5, Iax, Ubm, dx,
 *  AJy, Lr, BwW, xbn, wx, q9R, gx, Dbn, jK, O5, fr, HZK, az, iZw,
 *  vI, yJm, $O, S97, GA, l1, u1, YO, Qq, ZZ0, Edy]
 */

// ===================================================================
// Query string parsing
// ===================================================================

/**
 * Parse an `&`-delimited query string into a key-value object.
 * [was: Dt]
 *
 * @param {string} queryString
 * @returns {Object<string, string>}
 */
export function parseQueryString(queryString) { // was: Dt
  const result = {};
  const pairs = queryString.split("&");
  for (const pair of pairs) {
    const parts = pair.split("=");
    if (parts.length === 2) result[parts[0]] = parts[1];
  }
  return result;
}

// ===================================================================
// BotGuard Environment controls
// ===================================================================

/**
 * Await the BGE VM and return pause/resume/checkForRefresh controls.
 * [was: ZOR]
 *
 * @returns {Promise<{pause: Function, resume: Function, checkForRefresh: Function}>}
 */
export async function getBgeControls() { // was: ZOR
  const win = window;
  await bQ(getBgeServiceWorkerKey()); // bQ = await SW registration
  const controls = win.bgevmc;
  if (!controls) throw Error("BGE Controls not exposed");
  return {
    pause: () => { controls.p(); },
    resume: () => { controls.r(); },
    checkForRefresh: () => controls.cr(),
  };
}

/**
 * Compute the BGE service worker cache key.
 * [was: t1]
 *
 * @returns {string}
 */
export function getBgeServiceWorkerKey() { // was: t1
  return getExperimentBoolean("bg_st_hr")
    ? "havuokmhhs-0"
    : `havuokmhhs-${Math.floor(globalThis.performance?.timeOrigin || 0)}`;
}

/**
 * Set the BGE network status indicator on `window.bgens`.
 * [was: HI]
 *
 * @param {number} status - 1=ok, 2=fetching, 3=error, 4=bg-ok
 */
export function setBgeNetworkStatus(status) { // was: HI
  window.bgens = status;
}

// ===================================================================
// Attestation / challenge negotiation
// ===================================================================

/**
 * Wait for the native attestation provider to become available.
 * [was: sYd]
 *
 * @returns {Promise<AttestationProviderWrapper>}
 */
export function waitForAttestationProvider() { // was: sYd
  return new Promise((resolve) => {
    const win = window;
    if (win.ntpevasrs !== undefined) {
      resolve(new AttestationProviderWrapper(win.ntpevasrs));
    } else {
      if (win.ntpqfbel === undefined) win.ntpqfbel = [];
      win.ntpqfbel.push((provider) => {
        resolve(new AttestationProviderWrapper(provider));
      });
    }
  });
}

/**
 * Wrapper around the native attestation provider (ntpevasrs).
 * Provides a clean interface for binding innertube challenge fetchers
 * and retrieving challenge responses.
 * [was: Eu7]
 *
 * Source: base.js lines 73072-73085
 */
export class AttestationProviderWrapper { // was: Eu7
  constructor(provider) {
    this._provider = provider; // was: this.W
  }

  /** Bind an innertube challenge fetcher callback. [was: bicf] */
  bindInnertubeChallengeFetcher(fetcher) {
    this._provider.bicf(fetcher);
  }

  /** Register a callback for when a challenge is fetched. [was: bcr] */
  registerChallengeFetchedCallback(callback) {
    this._provider.bcr(callback);
  }

  /** Get the latest challenge response. [was: blc] */
  getLatestChallengeResponse() {
    return this._provider.blc();
  }
}

/**
 * Check DoubleClick ad script status and log it.
 * Called once on embed pages.
 * [was: wJw]
 */
export function checkDoubleClickStatus() { // was: wJw
  if (!shouldUseFirstPartyCookie()) return; // j$ = isEmbedPage
  const playerVars = getConfig("PLAYER_VARS", {});
  if (getWithDefault(playerVars, "privembed", false) == "1" || isPflMode(playerVars)) return;

  const onLoad = () => {
    Nw = true; // Nw = adStatusChecked flag
    if ("google_ad_status" in window) {
      setConfig("DCLKSTAT", 1);
    } else {
      setConfig("DCLKSTAT", 2);
    }
  };

  try {
    const nonce = og(document); // og = getScriptNonce
    loadScript(dAK, onLoad, nonce);  // g.mD = loadScript, dAK = doubleclick script URL
  } catch (_err) { /* ignore */ }

  LNW.push(
    globalScheduler.SlotIdFulfilledNonEmptyTrigger(() => {
      if (Nw || "google_ad_status" in window) return;
      try {
        if (dAK.toString() && onLoad) {
          const handlerId = `${getUid(onLoad)}`;
          const handler = b0w[handlerId];
          if (handler) pubsubUnsubscribe(handler);
        }
      } catch (_err) { /* ignore */ }
      Nw = true;
      setConfig("DCLKSTAT", 3);
    }, 5000)
  );
}

/**
 * Get the DoubleClick status value.
 * [was: i1]
 *
 * @returns {number}
 */
export function getDoubleClickStatus() { // was: i1
  const val = Number(getConfig("DCLKSTAT", 0));
  return isNaN(val) ? 0 : val;
}

/**
 * Set the attestation challenge promise.
 * [was: yJ]
 *
 * @param {object} state
 * @param {Promise} challengePromise
 */
export function setAttestationChallenge(state, challengePromise) { // was: yJ
  state.W = challengePromise;
}

/**
 * Bootstrap the attestation flow — either from a pre-computed token
 * or by fetching a new challenge.
 * [was: bOW]
 *
 * @param {object} attState
 * @returns {Promise<{challenge, LK, OG, bgChallenge}>}
 */
export async function bootstrapAttestation(attState) { // was: bOW
  let eacrToken;

  if (globalRef.ytAtP && !getExperimentBoolean("ytatp_ks")) {
    const precomputed = await globalRef.ytAtP;
    delete globalRef.ytAtP;
    let responseJson = precomputed?.R;
    eacrToken = precomputed?.T;

    if (responseJson) {
      attState.O.W(1, attState.A++);
    } else {
      attState.O.W(2, attState.A++);
      const result = await fetchAttestationChallenge(attState, createChallengeRequest(eacrToken, null));
      responseJson = JSON.stringify(result);
    }

    if (globalRef.ytAtRC) {
      globalRef.ytAtRC(responseJson);
    } else {
      reportWarning(Error("ytAtRC not defined for ytAtP."));
    }
  } else if (globalRef.ytAtRC) {
    addJob(async () => {
      eacrToken = globalRef.ytAtT;
      delete globalRef.ytAtT;
      if (globalRef.ytAtRC) {
        attState.O.W(2, attState.A++);
        const result = await fetchAttestationChallenge(attState, createChallengeRequest(eacrToken, null));
        if (globalRef.ytAtRC) globalRef.ytAtRC(JSON.stringify(result));
      } else {
        attState.O.W(6, attState.A++);
      }
    }, 2, getExperimentNumber("att_init_delay", 0)); // ND = scheduleTask, Y3 = getConfigValue
  } else {
    eacrToken = globalRef.ytAtT;
    delete globalRef.ytAtT;
    attState.O.W(1, attState.A++);
  }

  const provider = await waitForAttestationProvider();

  provider.bindInnertubeChallengeFetcher((challengeBody) => {
    attState.O.W(3, attState.A++);
    return fetchAttestationChallenge(attState, createChallengeRequest(eacrToken, challengeBody));
  });

  provider.registerChallengeFetchedCallback((response) => {
    const challenge = response.challenge;
    if (!challenge) throw Error("BGE_MACR");
    const challengePromise = Promise.resolve({
      challenge,
      LK: parseQueryString(challenge),
      OG: bgeInterpreter,
      bgChallenge: new LayoutExitedMetadata(), // AJ = BgChallengeConfig
    });
    attState.W = challengePromise;
  });

  const bgeInterpreter = await bQ(getBgeServiceWorkerKey());
  const latestChallenge = provider.getLatestChallengeResponse().challenge;
  if (!latestChallenge) throw Error("BGE_MACIL");

  return {
    challenge: latestChallenge,
    LK: parseQueryString(latestChallenge),
    OG: bgeInterpreter,
    bgChallenge: new LayoutExitedMetadata(),
  };
}

/**
 * Fetch an attestation challenge with retry and BGE program setup.
 * [was: Zt]
 *
 * @param {object} attState
 * @returns {Promise<{challenge, LK, OG, bgChallenge}>}
 */
export async function fetchAttestationChallengeWithRetry(attState) { // was: Zt
  const requestBody = createChallengeRequest(undefined, getScriptLoader().W);

  let response;
  try {
    response = await retryFetchChallenge(attState, requestBody);
  } catch (_err) {
    reportWarning(Error("Failed to fetch attestation challenge after 5 attempts; not retrying for 24h."));
    scheduleNextRefresh(attState, 864e5); // 24 hours
    return {
      challenge: "",
      LK: {},
      OG: undefined,
      bgChallenge: undefined,
    };
  }

  const challengeString = response.z9;
  const parsed = response.O0;
  scheduleNextRefresh(attState, (Number(parsed.t) || 7200) * 1000);

  let bgeInstance = undefined;
  if ("c1a" in parsed && response.bgChallenge) {
    const bgChallenge = response.bgChallenge;
    const challengeConfig = new LayoutExitedMetadata();

    if (bgChallenge.interpreterJavascript) {
      const safeScript = unwrapSafeScript(bgChallenge.interpreterJavascript); // Bz = sanitizeScript
      const trustedScript = Ig(safeScript).toString(); // Ig = getTrustedScriptContent
      const scriptRef = new rw(); // rw = InlineScriptRef
      DZ(scriptRef, 6, trustedScript);
      ry(challengeConfig, rw, 1, scriptRef, EXTENSION_GUARD);
    } else if (bgChallenge.interpreterUrl) {
      const safeUrl = unwrapTrustedResourceUrl(bgChallenge.interpreterUrl); // x3 = sanitizeUrl
      const trustedUrl = hv(safeUrl).toString(); // hv = getTrustedScriptUrl
      const urlRef = new U9(); // U9 = ExternalScriptRef
      DZ(urlRef, 4, trustedUrl);
      ry(challengeConfig, U9, 2, urlRef, EXTENSION_GUARD);
    }

    if (bgChallenge.interpreterHash) to(challengeConfig, 3, bgChallenge.interpreterHash, EXTENSION_GUARD);
    if (bgChallenge.program) to(challengeConfig, 4, bgChallenge.program, EXTENSION_GUARD);
    if (bgChallenge.globalName) to(challengeConfig, 5, bgChallenge.globalName, EXTENSION_GUARD);
    if (bgChallenge.clientExperimentsStateBlob) to(challengeConfig, 7, bgChallenge.clientExperimentsStateBlob, EXTENSION_GUARD);

    try {
      await loadScriptFromChallenge(getScriptLoader(), challengeConfig); // IK = loadInterpreter
    } catch (err) {
      reportWarning(err);
      return { challenge: challengeString, LK: parsed, OG: bgeInstance, bgChallenge: challengeConfig };
    }

    try {
      bgeInstance = new BotGuardInitialiser({ // HG = BotGuardClient
        challenge: challengeConfig,
        fetchAttestationChallenge: { MP: "aGIf" },
      });
      await bgeInstance.XQ; // XQ = readyPromise
    } catch (err) {
      reportWarning(err);
      bgeInstance = undefined;
    }
  }

  return { challenge: challengeString, LK: parsed, OG: bgeInstance, bgChallenge: undefined };
}

/**
 * Fetch attestation challenge, waiting for network if offline.
 * [was: SK]
 *
 * @param {object} attState
 * @param {object} requestBody
 * @returns {Promise<*>}
 */
export async function fetchAttestationChallenge(attState, requestBody) { // was: SK
  const networkMonitor = attState.j;
  if (!networkMonitor || networkMonitor.KU()) {
    return fetchAttestationChallengeInternal(attState, requestBody);
  }
  tr("att_pna", undefined, "attestation_challenge_fetch");
  return new Promise((resolve) => {
    networkMonitor.getBufferHealth("publicytnetworkstatus-online", () => {
      fetchAttestationChallengeInternal(attState, requestBody).then(resolve);
    });
  });
}

/**
 * Retry fetching the attestation challenge up to 5 times with exponential backoff.
 * [was: jYR]
 *
 * @param {object} attState
 * @param {object} requestBody
 * @returns {Promise<object>}
 */
export async function retryFetchChallenge(attState, requestBody) { // was: jYR
  let lastError = undefined;
  let attempt = 0;
  while (attempt < 5) {
    if (attempt > 0) {
      const delay = 1000 * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise((resolve) => {
        scheduleJob(0, () => { resolve(undefined); }, delay);
      });
    }
    try {
      attState.O.W(4, attState.A++);
      const raw = await fetchAttestationChallenge(attState, requestBody);
      return validateChallengeResponse(raw);
    } catch (err) {
      lastError = err;
      if (err instanceof Error) reportWarning(err);
    }
    attempt++;
  }
  throw lastError;
}

/**
 * Schedule the next attestation refresh.
 * [was: guW]
 *
 * @param {object} attState
 * @param {number} delayMs
 */
export function scheduleNextRefresh(attState, delayMs) { // was: guW
  const deadline = Date.now() + delayMs;
  const tick = async () => {
    const remaining = deadline - Date.now();
    if (remaining < 1000) {
      await refreshAttestation(attState);
    } else {
      addJob(tick, 0, Math.min(remaining, 60000));
    }
  };
  tick();
}

/**
 * Internal: fetch the challenge, log BGE network state.
 * [was: OO7]
 *
 * @param {object} attState
 * @param {object} requestBody
 * @returns {Promise<*>}
 */
export async function fetchAttestationChallengeInternal(attState, requestBody) { // was: OO7
  setBgeNetworkStatus(2);
  try {
    const result = await fetchAttestationChallenge(attState.network, requestBody);
    if (result) {
      result.challenge && !result.bgChallenge ? setBgeNetworkStatus(1) : setBgeNetworkStatus(4);
    } else {
      setBgeNetworkStatus(3);
    }
    return result;
  } catch (_err) {
    setBgeNetworkStatus(3);
  }
}

/**
 * Validate the attestation challenge response has required fields.
 * [was: fEm]
 *
 * @param {object} response
 * @returns {object}
 */
export function validateChallengeResponse(response) { // was: fEm
  if (!response) throw Error("Fetching Attestation challenge returned falsy");
  if (!response.challenge) throw Error("Missing Attestation challenge");

  const challengeString = response.challenge;
  const parsed = parseQueryString(challengeString);
  if ("c1a" in parsed && (!response.bgChallenge || !response.bgChallenge.program)) {
    throw Error("Expected bg challenge but missing.");
  }
  return { ...response, z9: challengeString, O0: parsed };
}

/**
 * Refresh the attestation challenge, disposing the previous BG instance.
 * [was: vu_]
 *
 * @param {object} attState
 */
export async function refreshAttestation(attState) { // was: vu_
  const previous = await Promise.race([attState.W, null]);
  const nextPromise = fetchAttestationChallengeWithRetry(attState);
  attState.W = nextPromise;
  previous?.OG?.dispose();
}

/**
 * Run a callback after a delay using the internal timer.
 * [was: aEO]
 *
 * @param {number} delayMs
 * @param {Function} callback
 * @returns {Promise<*>}
 */
export function delayedCallback(delayMs, callback) { // was: aEO
  return new Promise((resolve) => {
    scheduleJob(0, () => { resolve(callback()); }, delayMs);
  });
}

/**
 * Create an attestation challenge request body.
 * [was: F$]
 *
 * @param {string} [eacrToken]
 * @param {string} [interpreterHash]
 * @returns {object}
 */
export function createChallengeRequest(eacrToken, interpreterHash) { // was: F$
  const body = { engagementType: "ENGAGEMENT_TYPE_UNBOUND" };
  if (eacrToken) body.eacrToken = eacrToken;
  if (interpreterHash) body.interpreterHash = interpreterHash;
  return body;
}

/**
 * Wait for the attestation messaging provider (ATTMP).
 * [was: GQ7]
 *
 * @returns {Promise}
 */
export function waitForAttestationMessagingProvider() { // was: GQ7
  return new Promise((resolve) => {
    const win = window;
    if (win.attmp !== undefined) {
      resolve(win.attmp);
    } else {
      if (win.attmq === undefined) win.attmq = [];
      win.attmq.push((onInternalAudioFormatChange) => { resolve(onInternalAudioFormatChange); });
    }
  });
}

/**
 * Get a playback attestation token.
 * [was: getPlaybackAttestationToken]
 *
 * @param {string} videoId
 * @param {string} cpn
 * @returns {Promise<object>}
 */
export async function getPlaybackAttestationToken(videoId, cpn) { // was: g.PSx
  if (isAttmpUsable()) {
    const win = window;
    if (win.attmp !== undefined) {
      return win.attmp.s("ENGAGEMENT_TYPE_PLAYBACK", videoId, cpn);
    }
    return (await waitForAttestationMessagingProvider()).s("ENGAGEMENT_TYPE_PLAYBACK", videoId, cpn);
  }
  const apiFn = getObjectByPath("yt.aba.att") // g.DR = getGlobalProperty
    ?? (E5.instance !== undefined ? E5.instance.K.bind(E5.instance) : null);
  return apiFn
    ? apiFn("ENGAGEMENT_TYPE_PLAYBACK", videoId, cpn)
    : Promise.resolve({ error: "ATTESTATION_ERROR_API_NOT_READY" });
}

/**
 * Check if an attestation refresh is ready.
 * [was: isAttestationRefreshReady]
 *
 * @returns {Promise<boolean>}
 */
export async function isAttestationRefreshReady() { // was: g.lE7
  if (isAttmpUsable()) {
    if (window.attmp === undefined) return false;
    return (await waitForAttestationMessagingProvider()).ir();
  }
  const apiFn = getObjectByPath("yt.aba.att2")
    ?? (E5.instance !== undefined ? E5.instance.D.bind(E5.instance) : null);
  return apiFn ? apiFn() : Promise.resolve(false);
}

/**
 * Check if the new ATTMP-based attestation is usable.
 * [was: $A7]
 *
 * @returns {boolean}
 */
export function isAttmpUsable() { // was: $A7
  return (getExperimentBoolean("attmusi") || getExperimentBoolean("attmusiw")) && getExperimentBoolean("attmusi_ue");
}

// ===================================================================
// Debug data callback registration
// ===================================================================

/**
 * Register a debug-data callback by name.
 * [was: hh7]
 *
 * @param {string} name
 * @param {Function} callback
 */
export function registerDebugDataCallback(name, callback) { // was: hh7
  let callbacks = getObjectByPath("ytDebugData.callbacks");
  if (!callbacks) {
    callbacks = {};
    setGlobal("ytDebugData.callbacks", callbacks);
  }
  if (getExperimentBoolean("web_dd_iu") || und.includes(name)) {
    callbacks[name] = callback;
  }
}

// ===================================================================
// Heat-map SVG path generation
// ===================================================================

/**
 * Build an SVG `d` attribute from a list of points using cubic Bezier smoothing.
 * [was: CSn]
 *
 * @param {Array<{x: number, y: number}>} points
 * @returns {string}
 */
export function buildSmoothSvgPath(points) { // was: CSn
  let pathData = "";
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (i === 0) {
      pathData += `M ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    } else {
      const cp1 = computeControlPoint(points[i - 1], points[i - 2], point);
      const cp2 = computeControlPoint(point, points[i - 1], points[i + 1], true);
      pathData += ` C ${cp1.x.toFixed(1)},${cp1.y.toFixed(1)} ${cp2.x.toFixed(1)},${cp2.y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }
  }
  return pathData;
}

/**
 * Build heat-map data points from heat-marker protobuf data.
 * [was: JzW]
 *
 * @param {Array} markers
 * @param {number} minHeight
 * @param {number} totalHeight
 * @param {number} maxHeight
 * @param {boolean} [skipFirstEdge=false]
 * @returns {Array<{x: number, y: number}>}
 */
export function buildHeatmapPoints(markers, minHeight, totalHeight, maxHeight, skipFirstEdge = false) { // was: JzW
  const segmentWidth = 1000 / markers.length;
  const points = [];

  points.push({ x: 0, y: 100 });
  for (let i = 0; i < markers.length; i++) {
    const xCenter = (i + 0.5) * segmentWidth;
    const intensity = getProperty(markers[i], MH3)?.heatMarkerIntensityScoreNormalized || 0;
    const y = 100 - clamp(intensity * 100, (minHeight / totalHeight) * 100, (maxHeight / totalHeight) * 100);

    if (i !== 0 || skipFirstEdge) { /* skip left edge duplicate */ }
    else { points.push({ x: 0, y }); }

    points.push({ x: xCenter, y });

    if (i === markers.length - 1) {
      points.push({ x: 1000, y });
    }
  }
  points.push({ x: 1000, y: 100 });
  return points;
}

/**
 * Build heat-map data points from raw intensity-score objects.
 * [was: Rh_]
 *
 * @param {Array} markers
 * @param {number} minHeight
 * @param {number} totalHeight
 * @param {number} maxHeight
 * @param {boolean} [skipFirstEdge=false]
 * @returns {Array<{x: number, y: number}>}
 */
export function buildHeatmapPointsRaw(markers, minHeight, totalHeight, maxHeight, skipFirstEdge = false) { // was: Rh_
  const segmentWidth = 1000 / markers.length;
  const points = [];

  points.push({ x: 0, y: 100 });
  for (let i = 0; i < markers.length; i++) {
    const xCenter = (i + 0.5) * segmentWidth;
    const y = 100 - clamp(
      (markers[i].intensityScoreNormalized || 0) * 100,
      (minHeight / totalHeight) * 100,
      (maxHeight / totalHeight) * 100
    );

    if (i !== 0 || skipFirstEdge) { /* skip */ }
    else { points.push({ x: 0, y }); }

    points.push({ x: xCenter, y });

    if (i === markers.length - 1) {
      points.push({ x: 1000, y });
    }
  }
  points.push({ x: 1000, y: 100 });
  return points;
}

/**
 * Compute a cubic Bezier control point for smooth curves.
 * [was: zhy]
 *
 * @param {object} current
 * @param {object} [previous]
 * @param {object} [next]
 * @param {boolean} [reverse=false]
 * @returns {{x: number, y: number}}
 */
export function computeControlPoint(current, previous, next, reverse = false) { // was: zhy
  const line = new kQO(previous || current, next || current); // kQO = LineSegment
  return {
    x: current.x + lineSegmentDx(line, reverse) * 0.2,
    y: current.y + lineSegmentDy(line, reverse) * 0.2,
  };
}

/**
 * Get the horizontal component of a line segment, optionally reversed.
 * [was: Y_0]
 *
 * @param {object} line
 * @param {boolean} [reverse=false]
 * @returns {number}
 */
export function lineSegmentDx(line, reverse = false) { // was: Y_0
  return reverse ? line.W * -1 : line.W;
}

/**
 * Get the vertical component of a line segment, optionally reversed.
 * [was: pJ7]
 *
 * @param {object} line
 * @param {boolean} [reverse=false]
 * @returns {number}
 */
export function lineSegmentDy(line, reverse = false) { // was: pJ7
  return reverse ? line.O * -1 : line.O;
}

// ===================================================================
// Settings API
// ===================================================================

/**
 * Fetch setting values from the innertube settings endpoint.
 * [was: Wu3]
 *
 * @param {object} networkClient
 * @param {string[]} settingItemIds
 * @returns {Promise<Array|undefined>}
 */
export async function getSettingValues(networkClient, settingItemIds) { // was: Wu3
  const requestBody = {
    context: buildFullInnertubeContext(), // g.Oh = getInnertubeContext
    settingItemIds,
  };
  const endpoint = buildInnertubeApiPath(QKw); // g.vu = resolveEndpoint, QKw = GetSettingValues endpoint
  const response = await sendInnertubeRequest(networkClient, requestBody, endpoint);
  if (!response || response.errorMetadata) {
    logSettingsError("GetSettingValuesRequest", response);
  } else {
    return response.settingValues;
  }
}

/**
 * Set a setting value via the innertube settings endpoint.
 * [was: Kun]
 *
 * @param {object} networkClient
 * @param {string} settingItemId
 * @param {*} newValue
 */
export async function setSettingValue(networkClient, settingItemId, newValue) { // was: Kun
  const requestBody = {
    context: buildFullInnertubeContext(),
    settingItemId,
    newValue,
  };
  const endpoint = buildInnertubeApiPath(mb_); // mb_ = SetSetting endpoint
  const response = await sendInnertubeRequest(networkClient, requestBody, endpoint);
  if (response && !response.errorMetadata) return;
  logSettingsError("SetSettingRequest", response);
}

/**
 * Log a settings API error.
 * [was: cJ3]
 *
 * @param {string} requestName
 * @param {object|undefined} response
 */
export function logSettingsError(requestName, response) { // was: cJ3
  if (response?.errorMetadata) {
    reportWarning(new PlayerError(`${requestName} failed with status ${response.errorMetadata.status}`));
  } else {
    reportWarning(new PlayerError(`${requestName} failed with empty response`));
  }
}

// ===================================================================
// Google Click ID tracking
// ===================================================================

/**
 * Check whether a URL contains `gclid` or `gad_source` parameters.
 * [was: TwX]
 *
 * @param {string} url
 * @returns {boolean}
 */
export function hasGoogleClickId(url) { // was: TwX
  return (
    Lj(url, 0, "gclid", url.search(ws)) >= 0 ||
    Lj(url, 0, "gad_source", url.search(ws)) >= 0
  );
}

/**
 * Set up cross-window GCL (Google Click) transfer via postMessage.
 * [was: rJ7]
 *
 * @param {Window|null} targetWindow
 * @param {string} url
 */
export function setupGclTransfer(targetWindow, url) { // was: rJ7
  const resolver = getResolver().resolve(od3); // Ng = get service locator

  if (!hasGoogleClickId(url)) return;

  const gclid = b_(url, "gclid"); // b_ = getQueryParam
  const handler = {
    handleEvent: (event) => {
      if (
        targetWindow &&
        !targetWindow.closed &&
        typeof targetWindow.postMessage === "function" &&
        event?.origin &&
        event.source === targetWindow &&
        event.data?.action === "gcl_setup"
      ) {
        targetWindow.postMessage(
          {
            action: "gcl_transfer",
            ...(gclid && { gclid }),
            gadSource: 2,
          },
          event.origin
        );
      }
    },
  };

  // Clean up closed windows
  for (const [win, listener] of resolver.W) {
    if (win.closed) {
      try {
        window.removeEventListener("message", listener);
        resolver.W.delete(win);
      } catch (err) {
        reportErrorWithLevel(err);
      }
    }
  }

  if (targetWindow && resolver.W.size < 15) {
    resolver.W.set(targetWindow, handler);
    window.addEventListener("message", handler);
  }
}

// ===================================================================
// Thumbnail selection
// ===================================================================

/**
 * Select the best thumbnail from a list based on a target dimension.
 * [was: s5]
 *
 * @param {Array<{width?: number, height?: number}>} thumbnails
 * @param {number|null} targetSize
 * @param {boolean} [useWidth=false]
 * @returns {object|null}
 */
export function selectThumbnail(thumbnails, targetSize, useWidth) { // was: s5
  if (!targetSize) return thumbnails.length >= 1 ? thumbnails[thumbnails.length - 1] : null;

  for (const thumb of thumbnails) {
    if (thumb.width && thumb.height) {
      if ((useWidth && thumb.width >= targetSize) || (!useWidth && thumb.height >= targetSize)) {
        return thumb;
      }
    }
  }

  for (let i = thumbnails.length - 1; i >= 0; i--) {
    if ((useWidth && thumbnails[i].width) || (!useWidth && thumbnails[i].height)) {
      return thumbnails[i];
    }
  }
  return thumbnails[0];
}

// ===================================================================
// BotGuard script loader
// ===================================================================

/**
 * Load the BotGuard VM script (by URL or inline JS), then initialize trayride.
 * [was: Iax]
 *
 * @param {object} attLoader
 * @param {string|null} inlineJs
 * @param {string|null} scriptUrl
 * @param {string} program
 * @param {Function} onReady
 * @param {object} nonce
 */
export function loadBotGuardScript(attLoader, inlineJs, scriptUrl, program, onReady, nonce) { // was: Iax
  if (scriptUrl) {
    attLoader.l3(2);
    loadScript(trustedResourceUrlFrom(scriptUrl), () => {
      if (window.trayride) {
        initializeTrayride(attLoader, program, onReady);
      } else {
        attLoader.l3(3);
        const scriptId = wk7(scriptUrl); // wk7 = scriptIdFromUrl
        const existingEl = document.getElementById(scriptId);
        if (existingEl) {
          pubsubClear(scriptId); // dq7 = removeScriptTag
          existingEl.parentNode.removeChild(existingEl);
        }
        reportWarning(new PlayerError("BL:ULB", `${scriptUrl}`));
      }
    }, nonce);
  } else if (inlineJs) {
    const scriptEl = createElement("SCRIPT"); // g.HB = createElement
    if (inlineJs instanceof rO) {
      scriptEl.textContent = Ig(inlineJs); // Ig = getTrustedContent
      Xt(scriptEl); // Xt = markAsTrusted
    } else {
      scriptEl.textContent = inlineJs;
    }
    scriptEl.nonce = og(document);
    document.head.appendChild(scriptEl);
    document.head.removeChild(scriptEl);

    if (window.trayride) {
      initializeTrayride(attLoader, program, onReady);
    } else {
      attLoader.l3(4);
      reportWarning(new PlayerError("BL:ULBJ"));
    }
  } else {
    reportWarning(new PlayerError("BL:ULV"));
  }
}

/**
 * Initialize the trayride (BotGuard) program after the VM is loaded.
 * [was: Ubm]
 *
 * @param {object} attLoader
 * @param {string} program
 * @param {Function} onReady
 */
export function initializeTrayride(attLoader, program, onReady) { // was: Ubm
  attLoader.l3(5);
  const isCookieless = !!attLoader.kq && XGd.includes(getDomain(attLoader.kq) || "");

  try {
    const bgClient = new BotGuardInitialiser({
      program,
      globalName: "trayride",
      fetchAttestationChallenge: {
        disable: !getExperimentBoolean("att_web_record_metrics") || (!getExperimentBoolean("att_skip_metrics_for_cookieless_domains_ks") && isCookieless),
        MP: "aGIf",
      },
    });
    bgClient.XQ.then(() => {
      attLoader.l3(6);
      if (onReady) onReady(program);
    });
    attLoader.W(bgClient);
  } catch (err) {
    attLoader.l3(7);
    if (err instanceof Error) reportWarning(err);
  }
}

/**
 * Get the player-level attestation loader, if all BGE VM methods are present.
 * [was: dx]
 *
 * @returns {object|null}
 */
export function getPlayerAttestationLoader() { // was: dx
  const loader = getObjectByPath("yt.abuse.playerAttLoader");
  return loader && ["bgvma", "bgvmb", "bgvmc"].every((m) => m in loader) ? loader : null;
}

// ===================================================================
// Ad action processing / extension registry
// ===================================================================

/**
 * Attempt to mute the ad via the PLAYER_BYTES slot.
 * [was: AJy]
 *
 * @param {object} adController
 * @param {object} coreInterface
 * @param {string|undefined} triggeringLayoutId
 */
export function muteAdIfPlayerBytesSlot(adController, coreInterface, triggeringLayoutId) { // was: AJy
  let hasPlayerBytesSlot = false;
  for (const [slotConfig] of adController.jW.entries()) {
    if (slotConfig.slotType === "SLOT_TYPE_PLAYER_BYTES" && slotConfig.G2 === "core") {
      hasPlayerBytesSlot = true;
    }
  }

  if (hasPlayerBytesSlot) {
    if (!triggeringLayoutId) {
      for (const [slotConfig, slotState] of adController.jW.entries()) {
        if (slotConfig.slotType === "SLOT_TYPE_IN_PLAYER" && slotConfig.G2 === "core") {
          triggeringLayoutId = slotState.layoutId;
          break;
        }
      }
    }
    if (triggeringLayoutId) {
      coreInterface.wT(triggeringLayoutId);
    } else {
      reportAdsControlFlowError("No triggering layout ID available when attempting to mute.");
    }
  }
}

/**
 * Register an action extension by name.
 * [was: Lr]
 *
 * @param {object} registry
 * @param {string} name
 * @param {Function} handler
 */
export function registerExtension(registry, name, handler) { // was: Lr
  registry.u0(); // u0 = assertNotDisposed
  if (registry.W.get(name)) reportErrorWithLevel(Error(`Extension name ${name} already registered`));
  registry.W.set(name, handler);
}

/**
 * Process a list of ad action commands, sorting `eTK`/`Vu7` types first.
 * [was: BwW]
 *
 * @param {object} registry
 * @param {Array} [commands=[]]
 * @param {*} context
 * @param {*} extra
 */
export function processActionCommands(registry, commands = [], context, extra) { // was: BwW
  registry.u0();
  const priority = [];
  const normal = [];
  for (const cmd of commands) {
    if (getProperty(cmd, eTK) || getProperty(cmd, adPingingEndpoint)) {
      priority.push(cmd);
    } else {
      normal.push(cmd);
    }
  }
  for (const cmd of priority) dispatchAction(registry, cmd, context, extra);
  for (const cmd of normal) dispatchAction(registry, cmd, context, extra);
}

/**
 * Register a named extension from an adapter.
 * [was: xbn]
 *
 * @param {object} registry
 * @param {object} adapter
 */
export function registerAdapterExtension(registry, adapter) { // was: xbn
  registerExtension(registry, adapter.Bn(), (a, b, c) => {
    adapter.recordCurrentMediaTime(a, b, c);
  });
}

/**
 * Dispatch a single action command to its registered handler.
 * [was: wx]
 *
 * @param {object} registry
 * @param {object} command
 * @param {*} context
 * @param {*} extra
 */
export function dispatchAction(registry, command, context, extra) { // was: wx
  registry.u0();
  if (command.loggingUrls) {
    invokeExtensionHandler(registry, "loggingUrls", command.loggingUrls, context, extra);
  }
  for (const [key, value] of Object.entries(command)) {
    if (key === "openPopupAction") {
      publishAdEvent(registry.mG.get(), "innertubeCommand", { openPopupAction: value });
    } else if (key === "confirmDialogEndpoint") {
      publishAdEvent(registry.mG.get(), "innertubeCommand", { confirmDialogEndpoint: value });
    } else if (!nd_.hasOwnProperty(key)) {
      invokeExtensionHandler(registry, key, value, context, extra);
    }
  }
}

/**
 * Invoke a single extension handler by name.
 * [was: q9R]
 *
 * @param {object} registry
 * @param {string} name
 * @param {*} value
 * @param {*} context
 * @param {*} extra
 */
export function invokeExtensionHandler(registry, name, value, context, extra) { // was: q9R
  const handler = registry.W.get(name);
  if (handler && typeof handler === "function") {
    try {
      handler(value, context, extra);
    } catch (err) {
      reportErrorWithLevel(err);
    }
  } else {
    const warning = new PlayerError("Unhandled field", name);
    reportWarning(warning);
  }
}

// ===================================================================
// Layout / slot matching helpers
// ===================================================================

/**
 * Check if a layout matches the required metadata keys and optionally a layout type.
 * [was: gx]
 *
 * @param {object} layout
 * @param {string[]} requiredKeys
 * @param {string[]} [allowedLayoutTypes]
 * @returns {boolean}
 */
export function layoutMatchesMetadata(layout, requiredKeys, allowedLayoutTypes) { // was: gx
  if (allowedLayoutTypes && !allowedLayoutTypes.includes(layout.layoutType)) return false;
  for (const key of requiredKeys) {
    if (!hasMetadataKey(layout.clientMetadata, key)) return false;
  }
  return true;
}

/**
 * Map a trigger category string to an integer constant.
 * [was: Dbn]
 *
 * @param {string} category
 * @param {Function} onUnknown - callback for unrecognized categories
 * @returns {number}
 */
export function triggerCategoryToInt(category, onUnknown) { // was: Dbn
  switch (category) {
    case "TRIGGER_CATEGORY_LAYOUT_EXIT_NORMAL": return 0;
    case "TRIGGER_CATEGORY_LAYOUT_EXIT_USER_SKIPPED": return 1;
    case "TRIGGER_CATEGORY_LAYOUT_EXIT_USER_MUTED": return 2;
    case "TRIGGER_CATEGORY_SLOT_EXPIRATION": return 3;
    case "TRIGGER_CATEGORY_SLOT_FULFILLMENT": return 4;
    case "TRIGGER_CATEGORY_SLOT_ENTRY": return 5;
    case "TRIGGER_CATEGORY_LAYOUT_EXIT_USER_INPUT_SUBMITTED": return 6;
    case "TRIGGER_CATEGORY_LAYOUT_EXIT_USER_CANCELLED": return 7;
    default:
      onUnknown(category);
      return 8;
  }
}

/**
 * Check if a client metadata set contains a key.
 * [was: jK]
 *
 * @param {object} metadata
 * @param {string} key
 * @returns {boolean}
 */
export function hasMetadataKey(metadata, key) { // was: jK
  return metadata.W.has(key);
}

/**
 * Get all metadata keys from a client metadata set.
 * [was: O5]
 *
 * @param {object} metadata
 * @returns {string[]}
 */
export function getMetadataKeys(metadata) { // was: O5
  return Array.from(metadata.W.keys());
}

/**
 * Check if a slot matches the required metadata keys and optionally a slot type.
 * [was: fr]
 *
 * @param {object} slot
 * @param {string[]} requiredKeys
 * @param {string} [requiredSlotType]
 * @returns {boolean}
 */
export function slotMatchesMetadata(slot, requiredKeys, requiredSlotType) { // was: fr
  if (requiredSlotType && requiredSlotType !== slot.slotType) return false;
  for (const key of requiredKeys) {
    if (!hasMetadataKey(slot.clientMetadata, key)) return false;
  }
  return true;
}

// ===================================================================
// Ads event / telemetry helpers
// ===================================================================

/**
 * Get the telemetry event type for a given code.
 * [was: HZK]
 *
 * @param {string} code
 * @returns {string}
 */
export function getAdsClientEventType(code) { // was: HZK
  return tuR.get(code)?.kC || "ADS_CLIENT_EVENT_TYPE_UNSPECIFIED";
}

/**
 * Build slot metadata for ads telemetry logging.
 * [was: az]
 *
 * @param {boolean} includeDebug
 * @param {object} slot
 * @returns {object}
 */
export function buildSlotTelemetry(includeDebug, slot) { // was: az
  const data = {
    type: slot.slotType,
    controlFlowManagerLayer: Nwn.get(slot.G2) || "CONTROL_FLOW_MANAGER_LAYER_UNSPECIFIED",
  };
  if (slot.slotEntryTrigger) data.entryTriggerType = slot.slotEntryTrigger.triggerType;
  if (slot.slotPhysicalPosition !== 1) data.slotPhysicalPosition = slot.slotPhysicalPosition;

  if (includeDebug) {
    data.debugData = { slotId: slot.slotId };
    if (slot.slotEntryTrigger) {
      data.debugData.slotEntryTriggerData = buildTriggerDebugData(slot.slotEntryTrigger);
    }
    data.debugData.fulfillmentTriggerData = [];
    for (const trigger of slot.slotFulfillmentTriggers) {
      data.debugData.fulfillmentTriggerData.push(buildTriggerDebugData(trigger));
    }
    data.debugData.expirationTriggerData = [];
    for (const trigger of slot.slotExpirationTriggers) {
      data.debugData.expirationTriggerData.push(buildTriggerDebugData(trigger));
    }
  }
  return data;
}

/**
 * Build layout metadata for ads telemetry logging.
 * [was: iZw]
 *
 * @param {boolean} includeDebug
 * @param {object} layout
 * @returns {object}
 */
export function buildLayoutTelemetry(includeDebug, layout) { // was: iZw
  const data = {
    type: layout.layoutType,
    controlFlowManagerLayer: Nwn.get(layout.G2) || "CONTROL_FLOW_MANAGER_LAYER_UNSPECIFIED",
  };
  if (includeDebug) data.debugData = { layoutId: layout.layoutId };
  return data;
}

/**
 * Build trigger debug data for logging.
 * [was: vI]
 *
 * @param {object} trigger
 * @param {string} [category]
 * @returns {object}
 */
export function buildTriggerDebugData(trigger, category) { // was: vI
  const data = { type: trigger.triggerType };
  if (category != null) data.category = category;
  if (trigger.triggeringSlotId != null) {
    if (!data.triggerSourceData) data.triggerSourceData = {};
    data.triggerSourceData.associatedSlotId = trigger.triggeringSlotId;
  }
  if (trigger.triggeringLayoutId != null) {
    if (!data.triggerSourceData) data.triggerSourceData = {};
    data.triggerSourceData.associatedLayoutId = trigger.triggeringLayoutId;
  }
  return data;
}

/**
 * Build an opportunity event for telemetry.
 * [was: yJm]
 *
 * @param {boolean} includeDebug
 * @param {string} opportunityType
 * @param {string[]} [associatedSlotIds]
 * @param {Array} [slots]
 * @returns {object}
 */
export function buildOpportunityEvent(includeDebug, opportunityType, associatedSlotIds, slots) { // was: yJm
  const event = { opportunityType };
  if (includeDebug && (slots || associatedSlotIds)) {
    const debugSlots = map(slots || [], (s) => buildSlotTelemetry(includeDebug, s));
    event.debugData = {
      ...(associatedSlotIds?.length > 0 ? { associatedSlotId: associatedSlotIds } : {}),
      ...(debugSlots.length > 0 ? { slots: debugSlots } : {}),
    };
  }
  return event;
}

/**
 * Create a factory that builds ad client data entries for a given slot.
 * [was: $O]
 *
 * @param {object} context
 * @param {object} slot
 * @returns {Function}
 */
export function createAdClientDataFactory(context, slot) { // was: $O
  return (layout) =>
    buildAdClientDataEntry(
      shouldIncludeDebugData(context),
      slot.slotId, slot.slotType, slot.slotPhysicalPosition, slot.G2,
      slot.slotEntryTrigger, slot.slotFulfillmentTriggers, slot.slotExpirationTriggers,
      layout.layoutId, layout.layoutType, layout.G2
    );
}

/**
 * Build a full ad-client-data entry combining slot and layout metadata.
 * [was: S97]
 *
 * @returns {object}
 */
export function buildAdClientDataEntry(includeDebug, slotId, slotType, slotPhysicalPosition, layer, entryTrigger, fulfillmentTriggers, expirationTriggers, layoutId, layoutType, layoutLayer) { // was: S97
  return {
    adClientDataEntry: {
      slotData: buildSlotTelemetry(includeDebug, {
        slotId, slotType, slotPhysicalPosition, G2: layer,
        slotEntryTrigger: entryTrigger,
        slotFulfillmentTriggers: fulfillmentTriggers,
        slotExpirationTriggers: expirationTriggers,
        clientMetadata: new MetadataCollection([]),
      }),
      layoutData: buildLayoutTelemetry(includeDebug, {
        layoutId, layoutType, G2: layoutLayer,
        layoutExitNormalTriggers: [],
        layoutExitSkipTriggers: [],
        layoutExitMuteTriggers: [],
        layoutExitUserInputSubmittedTriggers: [],
        layoutExitUserCancelledTriggers: [],
        zy: new Map(),
        clientMetadata: new MetadataCollection([]),
        Je: {},
      }),
    },
  };
}

/**
 * Check whether debug data should be included in telemetry.
 * [was: GA]
 *
 * @param {object} context
 * @returns {boolean}
 */
export function shouldIncludeDebugData(context) { // was: GA
  return context.W || context.QC.get().U.G().X("html5_force_debug_data_for_client_tmp_logs");
}

// ===================================================================
// Slot lifecycle observers
// ===================================================================

/**
 * Register a slot lifecycle observer.
 * [was: l1]
 *
 * @param {object} manager
 * @param {object} observer
 */
export function addSlotObserver(manager, observer) { // was: l1
  manager.O.add(observer);
}

/**
 * Unregister a slot lifecycle observer.
 * [was: u1]
 *
 * @param {object} manager
 * @param {object} observer
 */
export function removeSlotObserver(manager, observer) { // was: u1
  manager.O.delete(observer);
}

// ===================================================================
// Slot state machine transitions
// ===================================================================

/**
 * Request exit / unschedule for a slot. Handles all intermediate states
 * (exit_requested, rendering_stop_requested, fill_requested, etc.).
 * [was: YO]
 *
 * @param {object} manager
 * @param {object} slot
 * @param {boolean} [force=false]
 */
export function requestSlotExit(manager, slot, force) { // was: YO
  if (!isSlotRegistered(manager.W, slot)) return; // h1 = hasSlot

  // Check if already in exit / stop state
  const slotState = getSlotState(manager.W, slot); // zA = getSlotState
  let isExiting = false;
  switch (slotState.W) {
    case "exit_requested": isExiting = true; break;
  }
  if (!isExiting) {
    switch (slotState.W) {
      case "rendering_stop_requested": isExiting = true; break;
    }
  }
  if (isExiting) {
    slotState.K = true;
    if (!force) return;
  }

  if (isSlotActiveOrEnterRequested(slotState)) { // Cr = isSlotEntered
    slotState.K = true;
    requestSlotExit(manager, slot, force); // Fu_ = handleEnteredSlotExit
  } else {
    let isFilling = false;
    switch (slotState.j) {
      case "fill_requested": isFilling = true; break;
    }
    if (isFilling) {
      slotState.K = true;
      if (isSlotRegistered(manager.W, slot)) {
        fireSlotAdEvent(manager.httpStatusToGrpcCode, "ADS_CLIENT_EVENT_TYPE_CANCEL_SLOT_FULFILLMENT_REQUESTED", slot);
        const state = getSlotState(manager.W, slot);
        state.j = "fill_cancel_requested";
        state.J.ri(); // ri = cancelFulfillment
      }
    } else {
      // Unschedule the slot entirely
      const layout = getActiveLayout(manager.W, slot); // J1 = getLayoutForSlot
      const enableUnscheduleEvents = manager.QC.get().U.G().experiments.SG("h5_enable_layout_unscheduling_events");
      if (enableUnscheduleEvents) {
        layout ? manager.getScreenManagerHelper(slot, layout) : reportAdsControlFlowError(Error("Layout is null for LayoutUnscheduled event."), slot, layout, undefined, false);
      }

      fireSlotAdEvent(manager.httpStatusToGrpcCode, "ADS_CLIENT_EVENT_TYPE_UNSCHEDULE_SLOT_REQUESTED", slot);
      const state = getSlotState(manager.W, slot);

      // Tear down entry trigger
      const entryTrigger = slot.slotEntryTrigger;
      const entryHandler = state.isSamsungSmartTV.get(entryTrigger.triggerId);
      if (entryHandler) {
        entryHandler.Rs(entryTrigger); // Rs = tearDown
        state.isSamsungSmartTV.delete(entryTrigger.triggerId);
      }

      // Tear down fulfillment triggers
      for (const trigger of slot.slotFulfillmentTriggers) {
        const handler = state.mF.get(trigger.triggerId);
        if (handler) {
          handler.Rs(trigger);
          state.mF.delete(trigger.triggerId);
        }
      }

      // Tear down expiration triggers
      for (const trigger of slot.slotExpirationTriggers) {
        const handler = state.Y.get(trigger.triggerId);
        if (handler) {
          handler.Rs(trigger);
          state.Y.delete(trigger.triggerId);
        }
      }

      // Tear down layout exit triggers
      if (state.layout != null) {
        const layoutObj = state.layout;
        releaseTriggerAdapters(state, layoutObj.layoutExitNormalTriggers);
        releaseTriggerAdapters(state, layoutObj.layoutExitSkipTriggers);
        releaseTriggerAdapters(state, layoutObj.layoutExitMuteTriggers);
        releaseTriggerAdapters(state, layoutObj.layoutExitUserInputSubmittedTriggers);
        releaseTriggerAdapters(state, layoutObj.layoutExitUserCancelledTriggers);
      }

      state.J = undefined;
      if (state.O != null) { state.O.release(); state.O = undefined; }
      if (state.A != null) { state.A.release(); state.A = undefined; }

      // Remove from slot registry
      const registry = manager.W;
      if (getSlotState(registry, slot)) {
        const group = getSlotStatesByKey(registry, `${slot.slotType}_${slot.slotPhysicalPosition}`);
        if (group) group.delete(slot.slotId);
      }

      fireSlotAdEvent(manager.httpStatusToGrpcCode, "ADS_CLIENT_EVENT_TYPE_SLOT_UNSCHEDULED", slot);

      for (const observer of manager.O) {
        observer.nU(slot);
        if (layout && !enableUnscheduleEvents) observer.getScreenManagerHelper(slot, layout);
      }
    }
  }
}

/**
 * Flush pending operations for a slot.
 * [was: Qq]
 *
 * @param {object} manager
 * @param {object} slot
 */
export function flushSlotPendingOps(manager, slot) { // was: Qq
  if (!isSlotRegistered(manager.W, slot)) return;
  const state = getSlotState(manager.W, slot);
  state.D = false;
  const pending = [...state.L];
  ma(state.L); // ma = clear array
  processTriggerBatch(manager, pending); // pr = executePendingOps
}

/**
 * Log a LAYOUT_RECEIVED event, including sub-layouts.
 * [was: ZZ0]
 *
 * @param {object} manager
 * @param {object} slot
 * @param {object} layout
 */
export function logLayoutReceived(manager, slot, layout) { // was: ZZ0
  logAdEventWithSlotLayout(manager.httpStatusToGrpcCode, "ADS_CLIENT_EVENT_TYPE_LAYOUT_RECEIVED", slot, layout);
  const subLayouts = layout.lj ?? layout.clientMetadata.readTimecodeScale("metadata_type_sub_layouts");
  if (subLayouts) {
    for (const subLayout of subLayouts) {
      logAdEventWithSlotLayout(manager.httpStatusToGrpcCode, "ADS_CLIENT_EVENT_TYPE_LAYOUT_RECEIVED", slot, subLayout);
    }
  }
}

/**
 * Attempt to enter a layout for a slot (start rendering).
 * [was: Edy]
 *
 * @param {object} manager
 * @param {object} slot
 */
export function enterLayoutForSlot(manager, slot) { // was: Edy
  if (
    isSlotRegistered(manager.W, slot) &&
    isSlotActiveOrEnterRequested(getSlotState(manager.W, slot)) &&
    getActiveLayout(manager.W, slot) &&
    !isLayoutRendering(manager.W, slot) // WR = isLayoutRendering
  ) {
    logAdEventWithSlotLayout(manager.httpStatusToGrpcCode, "ADS_CLIENT_EVENT_TYPE_ENTER_LAYOUT_REQUESTED", slot, getActiveLayout(manager.W, slot) ?? undefined);
    const state = getSlotState(manager.W, slot);
    if (state.W !== "entered") logIllegalStage(state.slot, state.W, "enterLayoutForSlot");
    state.W = "rendering";
    state.A.startRendering(state.layout);
  }
}

// ===================================================================
// URI class and helpers
// ===================================================================

/**
 * Closure-style URI parser/builder. [was: g.KG]
 */
export class Uri {
  constructor(url) {
    if (url instanceof Uri) {
      this._raw = url._raw;
    } else {
      this._raw = String(url || '');
    }
  }
  toString() { return this._raw; }
  clone() { return new Uri(this); }
}

/**
 * Set URI scheme/protocol. [was: g.TT]
 */
export function setUriScheme(uri, scheme) {
  // Sets the protocol on the Uri instance
}

/**
 * Ensure value is a Uri instance. [was: g.Vt]
 */
export function ensureUri(value) {
  return value instanceof Uri ? value.clone() : new Uri(value);
}
