import { normalizePlaylistParams, publishEvent, publishEventAll } from '../ads/ad-click-tracking.js';
import { getPlayerConfig } from '../core/attestation.js';
import { expandUrlTemplate } from '../core/bitstream-helpers.js';
import { addFinallyHandler, getConfig } from '../core/composition-helpers.js';
import { registerDisposable } from '../core/event-system.js';
import { adInfoDialogEndpoint } from '../core/misc-helpers.js';
import { toString } from '../core/string-utils.js';
import { isEmbedWithAudio, resolveOAuthToken } from '../data/bandwidth-tracker.js';
import { sendPing } from '../data/gel-core.js';
import { reportErrorWithLevel, reportWarning } from '../data/gel-params.js';
import { mute } from './player-api.js';
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { applyVolume } from './playback-state.js'; // was: KH
import { isCompressedDomainComposite } from '../media/audio-normalization.js'; // was: gA
import { isPlaybackStatusOk } from '../media/audio-normalization.js'; // was: AV
import { timedInvoke } from '../core/event-registration.js'; // was: pO
import { cleanupSsdaiAdPlayer } from './player-events.js'; // was: sM
import { replacePlaylist } from './playback-state.js'; // was: oE
import { fetchEmbeddedPlayerResponse } from './video-loader.js'; // was: hzn
import { getFullscreenElement } from '../ui/layout/fullscreen.js'; // was: R2
import { getChromeVersion } from '../core/composition-helpers.js'; // was: Dw
import { getBiscottiId } from '../core/composition-helpers.js'; // was: JCK
import { delayedResolve } from '../core/event-registration.js'; // was: HJ
import { catchCustom } from '../ads/ad-async.js'; // was: fF
import { promiseRace } from '../core/composition-helpers.js'; // was: YyX
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { YGMessage } from '../proto/message-defs.js'; // was: yG
import { shouldLoadAsmjsModule } from './caption-manager.js'; // was: pY
import { rejectedPromise } from '../core/composition-helpers.js'; // was: cJ
import { getUNDelay } from './player-events.js'; // was: UN
import { getLastActivityMs } from '../data/gel-core.js'; // was: YW
import { globalEventBuffer } from '../data/module-init.js'; // was: rM
import { elementsCommandKey } from '../modules/offline/entity-sync.js'; // was: P_H
import { getScreenContextInfo } from '../core/composition-helpers.js'; // was: XWn
import { isYouTubeDomain } from '../data/idb-transactions.js'; // was: Pz
import { appendQueryParamsPreserveExisting } from '../network/service-endpoints.js'; // was: vz
import { isHttps } from '../data/idb-transactions.js'; // was: Gn
import { getNetworkHelper } from '../ads/ad-click-tracking.js'; // was: GL
import { setAuthorizationHeader } from '../ads/ad-click-tracking.js'; // was: $t
import { uint32UnsignedReader } from '../proto/message-setup.js'; // was: Jj
import { buildAdBreakRequest } from '../ads/ad-async.js'; // was: o0y
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { isTvUnplugged } from '../data/performance-profiling.js'; // was: Zm
import { isSameOrigin } from '../network/service-endpoints.js'; // was: ax
import { buildAdSignals } from '../core/composition-helpers.js'; // was: lk
import { onRawStateChange } from './player-events.js'; // was: w_
import { AD_SIGNAL_PARAMS } from '../network/retry-policy.js'; // was: ALW
import { attachThirdPartyContext } from '../ads/ad-async.js'; // was: n0w
import { APP_TO_CLIENT_TYPE } from './bootstrap.js'; // was: ek7
import { FORM_FACTOR_MAP } from '../network/service-endpoints.js'; // was: V1d
import { UrlEndpointHandler } from '../ads/ad-interaction.js'; // was: Htd
import { registerAdapterExtension } from '../network/uri-utils.js'; // was: xbn
import { registerExtension } from '../network/uri-utils.js'; // was: Lr
import { CastController } from '../modules/remote/cast-controls.js'; // was: EG
import { httpStatusToGrpcCode } from '../media/bitstream-reader.js'; // was: LO
import { YouTubeActiveViewManager } from '../data/module-init.js'; // was: y7
import { FrameWalker } from '../data/module-init.js'; // was: aCn
import { createSlotWithFulfillment } from '../ads/slot-id-generator.js'; // was: Nr
import { reportAdsControlFlowError } from '../data/interaction-logging.js'; // was: v1
import { setClickTrackingTarget } from '../core/misc-helpers.js'; // was: sN
import { getQualityLabel } from '../media/codec-helpers.js'; // was: sU
import { logVisualElementClicked } from '../data/visual-element-tracking.js'; // was: Ca
import { getPlayerState } from './playback-bridge.js'; // was: lY
import { toggleAriaHidden } from '../data/interaction-logging.js'; // was: O8
import { appendStatEntry } from '../media/engine-config.js'; // was: MT
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { extractPlacementInfo } from './media-state.js'; // was: CH
import { FulfillmentIndexEntry } from '../ads/ad-trigger-types.js'; // was: Rk3
import { getPresenterVideoData } from './playback-mode.js'; // was: mX
import { AD_MACRO_KEYS } from '../ads/ad-interaction.js'; // was: mz7
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { volumeMutedIcon } from '../ui/svg-icons.js'; // was: S_
import { DoubleFlag } from '../data/session-storage.js'; // was: yW
import { extractPingMap } from '../ads/dai-layout.js'; // was: gP
import { cancelPlayback } from './player-events.js';
import { dispose } from '../ads/dai-cue-range.js';
import { getVideoAspectRatio } from './playback-mode.js';
import { getVisibilityState } from '../core/composition-helpers.js';
import { forEach } from '../core/event-registration.js';
import { sendInnertubeRequest } from '../network/innertube-client.js';
import { getDomain } from '../core/url-utils.js';
import { isEmbedded } from '../data/performance-profiling.js';
import { cueVideoByPlayerVars, getPlayerResponse } from './player-api.js';
import { getCurrentTimeSec } from './playback-bridge.js';
import { isMuted, getVolume, getCurrentTime, sendVideoStatsEngageEvent } from './time-tracking.js';
import { isEmptyObject } from '../core/object-utils.js';
import { logGelEvent } from '../data/gel-params.js';
import { isChrome } from '../core/browser-detection.js';
// TODO: resolve g.h
// TODO: resolve g.xh

/**
 * Media State Machine — playback bridge continuation, media element
 * lifecycle, ad break request construction, ad ping macro system,
 * LIDAR active-view integration, and ad error info suppliers.
 *
 * Source: base.js lines 55014–56004
 * [was: pC7, dW, QhO, sH, cLX, bY, mmd, KzW, Te7, o$d, rLO, Umw,
 *  ICK, cZm, jk, XZw, Qvy, W93, yLR, gW, dQ, E$_, sh3, Zt3, dmK,
 *  OH, b1, qP, sKy, LzX, wZW, btm, aL, Gv, jh_, fH, vi, aE, kY,
 *  pzK, ZI, U$, xe0, tl, Gc, g$m, OtX, fCO, Pi, Gx7, $mR, uY, hw,
 *  PMn, hkx, zkd, zc, CMw, lCd, M17, uby, JLO, j7, go, HG7, Mz,
 *  Jw, Bs, wQ, pZO, $A, CH, QEO, cw3, Wqw]
 */

// ===================================================================
// Media element state helpers
// ===================================================================

/**
 * Configure the media element play/pause state based on inline preview,
 * live DVR reference, and backgrounding flags.
 * [was: pC7]
 *
 * @param {object} app [was: Q] - player application
 */
export function configureMediaElementState(app) { // was: pC7
  const isYpcDvr = app.getVideoData().yD;          // was: c
  const isLiveDvrReference = app.FI.JJ;             // was: W
  const isInlineNonInteractive = app.isInline() && !app.getVideoData().IX; // was: m
  const mediaElement = app.mediaElement;             // was: K

  if (isYpcDvr || isLiveDvrReference || isInlineNonInteractive) {
    mediaElement.Y0(); // Y0 = setSilentMode
  } else {
    mediaElement.instreamAdPlayerOverlayRenderer(); // Re = setNormalMode
    applyVolume(app, app.nw);  // KH = syncMediaState
  }
}

/**
 * Build a cache key for deduplication of video load requests.
 * [was: dW]
 *
 * @param {string} prefix [was: Q]
 * @param {object} videoData [was: c]
 * @returns {string}
 */
export function buildVideoLoadCacheKey(prefix, videoData) { // was: dW
  return `${prefix}_${videoData.videoId}_${videoData.PJ}_${+videoData.isAutonav}${+videoData.kN}`;
}

/**
 * Check if the player should handle a background/prefetch scenario.
 * If so, starts or schedules the background playback.
 * [was: QhO]
 *
 * @param {object} app [was: Q]
 * @param {boolean} isPrefetch [was: c]
 * @returns {boolean} whether the prefetch path was taken
 */
export function handlePrefetchIfNeeded(app, isPrefetch) { // was: QhO
  if (!isPrefetch || !app.FI.isCompressedDomainComposite || app.getVideoData()?.backgroundable) return false;
  if (app.x_) {
    app.x_.start(); // x_ = background timer
  } else {
    app.DG(); // DG = startBackgroundPlayback
  }
  return true;
}

// ===================================================================
// Video load / cancel
// ===================================================================

/**
 * Start loading a video from video data. Handles error states and
 * player-type-specific teardown.
 * [was: sH]
 *
 * @param {object} app [was: Q]
 * @param {object} videoData [was: c]
 * @param {number} [playerType=1] [was: W]
 */
export function loadVideoFromData(app, videoData, playerType = 1) { // was: sH
  if (videoData.Xq()) { // Xq = hasStreamingData
    const player = Xf(app, playerType, videoData, false); // Xf = createPlayer
    app.cancelPlayback(4, playerType);
    app.LA(player); // LA = setActivePlayer
    player.Y5();    // Y5 = beginPlayback

    if (playerType === 1) {
      app.Eu(1); // Eu = setPlayerPhase
      if (isEmbedWithAudio(app.FI) && !isPlaybackStatusOk(videoData)) { // g.oc = isEmbed, AV = isPlayable
        videoData.dispose();
        app.timedInvoke().dispose(); // pO = getPlayerOverlay
      } else {
        alw(app); // alw = notifyVideoLoaded
      }
    }
  } else {
    videoData.dispose();
    const existingPlayer = Sk(app, { playerType }); // Sk = getPlayerByType
    if (existingPlayer) existingPlayer.dispose();
    if (Xq(app.a$()) && playerType === 2) {
      app.cleanupSsdaiAdPlayer(); // sM = fallbackToMainPlayer
    }
  }
}

/**
 * Load a playlist, handling embed-specific fetch behavior.
 * [was: cLX]
 *
 * @param {object} app [was: Q]
 * @param {*} input [was: c]
 * @param {number} [index] [was: W]
 * @param {number} [startSeconds] [was: m]
 * @param {string} [suggestedQuality] [was: K]
 */
export function loadPlaylist(app, input, index, startSeconds, suggestedQuality) { // was: cLX
  const params = normalizePlaylistParams(input, index, startSeconds, suggestedQuality); // was: dl3
  const isEmbed = isEmbedWithAudio(app.FI) && !app.FI.S;
  if (isEmbed && !app.JI) params.fetch = 0;

  replacePlaylist(app, params); // oE = setPlaylistParams
  if (isEmbedWithAudio(app.FI)) app.KO.tick("ep_a_pr_s");

  if (isEmbed && !app.JI) {
    const playlistMgr = app.a$();
    fetchEmbeddedPlayerResponse(playlistMgr, params).then((data) => {
      app.ub = true;
      Vw(app, data); // Vw = onPlaylistDataReceived
    });
  } else {
    app.playlist.onReady(() => { Bi(app); }); // Bi = beginPlaybackFromPlaylist
  }
  if (isEmbedWithAudio(app.FI)) app.KO.tick("ep_a_pr_r");
}

// ===================================================================
// Focus / element helpers
// ===================================================================

/**
 * Get the currently focused element if it is the player root or media element.
 * [was: bY]
 *
 * @param {object} app [was: Q]
 * @returns {Element|null}
 */
export function getFocusedPlayerElement(app) { // was: bY
  const activeEl = getFullscreenElement(true); // R2 = getActiveElement
  if (activeEl && (activeEl === app.template.element || (app.mediaElement && activeEl === app.mediaElement.Ae()))) {
    return activeEl;
  }
  return null;
}

// ===================================================================
// Screen orientation locking
// ===================================================================

/**
 * Lock or unlock screen orientation for fullscreen.
 * [was: mmd]
 *
 * @param {object} app [was: Q]
 * @param {boolean} lock [was: c] - true to lock, false to unlock
 */
export function manageScreenOrientation(app, lock) { // was: mmd
  const orientation = window.screen?.orientation;
  if (!app.FI.J || !orientation?.lock || (isChrome && Wz7)) return; // isChrome = isIOS, Wz7 = isIPad

  if (lock) {
    const isPortrait = orientation.type.indexOf("portrait") === 0;
    const aspectRatio = app.template.getVideoAspectRatio();
    let shouldBePortrait = isPortrait;
    if (aspectRatio < 1) shouldBePortrait = true;
    else if (aspectRatio > 1) shouldBePortrait = false;

    if (!app.Jb || shouldBePortrait !== isPortrait) {
      const lockPromise = orientation.lock(shouldBePortrait ? "portrait" : "landscape");
      lockPromise?.catch(() => {});
      app.Jb = true; // Jb = isOrientationLocked
    }
  } else if (app.Jb) {
    app.Jb = false;
    orientation.unlock();
  }
}

// ===================================================================
// Element visibility inspection
// ===================================================================

/**
 * Capture computed visibility properties of an element for debugging.
 * [was: KzW]
 *
 * @param {Element} element [was: Q]
 * @param {object} out [was: c] - target object to populate
 */
export function captureVisibilityProperties(element, out) { // was: KzW
  out.bounds = element.getBoundingClientRect();
  const props = ["display", "opacity", "visibility", "zIndex"];
  for (const prop of props) {
    out[prop] = Q6(element, prop); // Q6 = getComputedStyle
  }
  out.hidden = !!element.hidden;
}

// ===================================================================
// CPN-based player lookup
// ===================================================================

/**
 * Find the player instance matching a given CPN (client playback nonce).
 * [was: Te7]
 *
 * @param {object} app [was: Q]
 * @param {string} cpn [was: c]
 * @returns {object|null}
 */
export function findPlayerByCpn(app, cpn) { // was: Te7
  const mainPlayer = Sk(app, { playerType: 1 });
  if (mainPlayer) {
    if (mainPlayer.getVideoData().clientPlaybackNonce === cpn) return mainPlayer;
    const preloadPlayer = app.tj.W; // tj = preload manager
    if (preloadPlayer?.getVideoData().clientPlaybackNonce === cpn) return preloadPlayer;
  }
  return null;
}

// ===================================================================
// Error detection
// ===================================================================

/**
 * Detect a Chrome <= 105 player script TypeError.
 * [was: o$d]
 *
 * @param {Error} err [was: Q]
 * @returns {boolean}
 */
export function isLegacyChromePlayerError(err) { // was: o$d
  return err.name === "TypeError" && err.stack.includes("/s/player/") && getChromeVersion() <= 105; // Dw = getChromeVersion
}

// ===================================================================
// Bid / auction helpers
// ===================================================================

/**
 * Classify a bid fetch error as "NO_BID" (timeout) or "ERR_BID" (other).
 * [was: rLO]
 *
 * @param {object} err [was: Q]
 * @returns {string}
 */
export function classifyBidError(err) { // was: rLO
  return err.isTimeout ? "NO_BID" : "ERR_BID";
}

/**
 * Synchronously attempt to get a bid result (null if still pending).
 * [was: Umw]
 *
 * @returns {string|null}
 */
export function tryGetBidSync() { // was: Umw
  let result = null;
  getBiscottiId().then( // JCK = fetchBid
    (bid) => { result = bid; },
    (err) => { result = classifyBidError(err); }
  );
  return result;
}

/**
 * Race the bid fetch against a 1-second timeout.
 * [was: ICK]
 *
 * @returns {Promise<string>}
 */
export function fetchBidWithTimeout() { // was: ICK
  const timeout = delayedResolve(1000, "NO_BID"); // HJ = createTimeoutPromise
  return addFinallyHandler(
    promiseRace([getBiscottiId(), timeout]).catchCustom(classifyBidError), // YyX = racePromises, fF = catchWith
    () => { timeout.cancel(); }
  );
}

// ===================================================================
// Muted-autoplay state
// ===================================================================

/**
 * Get the muted-autoplay state string.
 * [was: cZm]
 *
 * @param {object} config [was: Q]
 * @returns {string} "STATE_ON" | "STATE_OFF" | "STATE_NONE"
 */
export function getMutedAutoplayState(config) { // was: cZm
  if (!config.mainVideoEntityActionMetadataKey) return "STATE_NONE"; // QE = isMutedAutoplayEnabled
  return getPlayerConfig().BA(140) ? "STATE_OFF" : "STATE_ON";
}

// ===================================================================
// Ad break request construction
// ===================================================================

/**
 * Build and send an ad-break request for a video.
 * [was: jk]
 *
 * @param {object} adManager [was: Q]
 * @param {string} baseUrl [was: c]
 * @param {object} [options] - `{ yG, Td, cueProcessedMs }`
 * @param {string} [biscottiId=""]
 * @returns {Promise<object>}
 */
export function sendAdBreakRequest(adManager, baseUrl, { YGMessage: cuepoint, Td: timeRange, cueProcessedMs } = {}, biscottiId = "") { // was: jk
  const videoData = adManager.player.getVideoData({ playerType: 1 });
  const remoteDeviceIds = adManager.player.G().shouldLoadAsmjsModule;

  // Compute ad break length
  let adBreakLength = 0;
  if (cueProcessedMs && timeRange && !cuepoint) {
    const duration = timeRange.end - timeRange.start;
    if (duration > 0) adBreakLength = Math.floor(duration / 1000);
  }
  adBreakLength = cuepoint ? cuepoint.rejectedPromise : adBreakLength;

  const macros = {
    AD_BLOCK: adManager.W++,
    AD_BREAK_LENGTH: adBreakLength,
    AUTONAV_STATE: getMutedAutoplayState(adManager.player.G()),
    CA_TYPE: "image",
    CPN: videoData.clientPlaybackNonce,
    DRIFT_FROM_HEAD_MS: adManager.player.getUNDelay() * 1000, // UN = getDriftFromHead
    LACT: getLastActivityMs(), // YW = getLastActivityTime
    LIVE_INDEX: cuepoint ? adManager.O++ : 1,
    LIVE_TARGETING_CONTEXT: cuepoint?.context || "",
    MIDROLL_POS: timeRange ? Math.round(timeRange.start / 1000) : 0,
    MIDROLL_POS_MS: timeRange ? Math.round(timeRange.start) : 0,
    VIS: adManager.player.getVisibilityState(),
    elementsCommandKey: adManager.player.bX().globalEventBuffer().height,
    P_W: adManager.player.bX().globalEventBuffer().width,
    YT_REMOTE: remoteDeviceIds ? remoteDeviceIds.join(",") : "",
  };

  // Merge global ad config signals
  const globalSignals = getScreenContextInfo(ACd); // XWn = getGlobalAdSignals
  Object.keys(globalSignals).forEach((key) => {
    if (globalSignals[key] != null) macros[key.toUpperCase()] = globalSignals[key].toString();
  });

  if (biscottiId !== "") macros.BISCOTTI_ID = biscottiId;

  const queryOverrides = {};
  if (isYouTubeDomain(baseUrl)) { // Pz = isFirstPartyUrl
    queryOverrides.sts = "20536";
    const forced = adManager.player.G().forcedExperiments;
    if (forced) queryOverrides.forced_experiments = forced;
  }

  const expandedUrl = appendQueryParamsPreserveExisting(expandUrlTemplate(baseUrl, macros), queryOverrides); // vz = appendQueryParams, g.lZ = expandMacros

  if (expandedUrl.split("?").length !== 2) {
    return rejectedPromise(Error("Invalid AdBreakInfo URL")); // cJ = rejectedPromise
  }

  return resolveOAuthToken(adManager.player.G(), videoData?.oauthToken).then((token) => {
    let networkHelper;
    if (token && isHttps()) { // Gn = isFirstPartyContext
      networkHelper = getNetworkHelper(); // GL = getNetworkHelper singleton
      setAuthorizationHeader(networkHelper, token); // $t = setAuthorizationHeader
    }

    const client = adManager.player.uint32UnsignedReader(networkHelper); // Jj = getNetworkClient
    const cuepointId = cuepoint && adManager.player.G().X("html5_send_cuepoint_id_in_ad_break_request")
      ? cuepoint.identifier
      : undefined;

    const requestBody = buildAdBreakRequest(adManager, expandedUrl, macros, videoData.isMdxPlayback, cueProcessedMs, cuepointId); // o0y = buildAdBreakBody
    return sendInnertubeRequest(client, requestBody, "/youtubei/v1/player/ad_break").then((response) => response);
  });
}

// ===================================================================
// Ad signal info for CTV
// ===================================================================

/**
 * Attach CTV advertising ID and signal info to the request.
 * [was: XZw]
 *
 * @param {object} adManager [was: Q]
 * @param {object} requestBody [was: c]
 */
export function attachCtvAdSignals(adManager, requestBody) { // was: XZw
  const config = adManager.player.G();
  if (!isTvHtml5Exact(config) && !isTvUnplugged(config)) return; // Sh/Zm = isTvPlatform checks

  const innertubeCtx = getConfig("INNERTUBE_CONTEXT");
  if (
    innertubeCtx?.adSignalsInfo?.advertisingId &&
    typeof innertubeCtx?.adSignalsInfo?.limitAdTracking !== "undefined"
  ) {
    requestBody.advertisingId = innertubeCtx.adSignalsInfo.advertisingId;
    requestBody.advertisingIdSignalType = "DEVICE_ID_TYPE_CONNECTED_TV_IFA";
    requestBody.limitAdTracking = innertubeCtx.adSignalsInfo.limitAdTracking;
  }
}

/**
 * Populate the innertube context for an ad-break request with device and
 * platform info from the video data and player config.
 * [was: Qvy]
 *
 * @param {object} adManager [was: Q]
 * @param {object} context [was: c]
 * @param {string} url [was: W]
 * @param {string} biscottiId [was: m]
 * @param {object} videoData [was: K]
 * @param {object} playerConfig [was: T]
 */
export function populateAdBreakContext(adManager, context, url, biscottiId, videoData, playerConfig) { // was: Qvy
  if (!context.client) context.client = {};
  if (!adManager.player.G().X("h5_remove_url_for_get_ad_break")) {
    context.client.originalUrl = url;
  }

  const isFirstParty = isSameOrigin(url); // ax = isYouTubeDomain
  let isMissing = !getDomain(url);
  if ((isFirstParty || isMissing) && typeof Intl !== "undefined") {
    context.client.timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  isMissing = !getDomain(url);
  if (isFirstParty || isMissing || biscottiId !== "") {
    const adInfo = {};
    const queryParts = onRawStateChange(buildAdSignals(biscottiId)).split("&"); // w_ = decodeQuery, lk = extractQuery
    const paramMap = new Map();
    queryParts.forEach((part) => {
      const kv = part.split("=");
      if (kv.length > 1) paramMap.set(kv[0].toString(), decodeURIComponent(kv[1].toString()));
    });

    if (paramMap.has("bid")) adInfo.bid = paramMap.get("bid");
    adInfo.params = [];
    AD_SIGNAL_PARAMS.forEach((allowedKey) => { // ALW = allowed ad signal param keys
      if (paramMap.has(allowedKey)) {
        adInfo.params.push({ key: allowedKey, value: paramMap.get(allowedKey) });
      }
    });

    attachCtvAdSignals(adManager, adInfo);
    context.adSignalsInfo = adInfo;
  }

  if (!context.client.unpluggedAppInfo) context.client.unpluggedAppInfo = {};
  context.client.unpluggedAppInfo.enableFilterMode = false;

  // Device/platform overrides from video data
  const cosver = videoData.W.cosver;
  if (cosver != null && cosver !== "cosver") context.client.osVersion = cosver;
  const cplatform = videoData.W.cplatform;
  if (cplatform != null && cplatform !== "cplatform" && cplatform !== "") context.client.platform = cplatform;
  const cmodel = videoData.W.cmodel;
  if (cmodel != null && cmodel !== "cmodel") context.client.deviceModel = cmodel;
  const cplayer = videoData.W.cplayer;
  if (cplayer != null && cplayer !== "cplayer") context.client.playerType = cplayer;
  const cbrand = videoData.W.cbrand;
  if (cbrand != null && cbrand !== "cbrand") context.client.deviceMake = cbrand;

  if (!context.user) context.user = {};
  context.user.lockedSafetyMode = false;

  if (isEmbedded(videoData)) attachThirdPartyContext(context, playerConfig, adManager.player.getPlayerState(1));
  if (videoData.livingRoomPoTokenId) {
    context.client.tvAppInfo = {
      ...context.client.tvAppInfo,
      livingRoomPoTokenId: videoData.livingRoomPoTokenId,
    };
  }
}

/**
 * Parse remote context strings (e.g. "TVHTML5-TV-2.0") into structured objects.
 * [was: W93]
 *
 * @param {object} context [was: Q]
 * @param {string} remoteString [was: c]
 * @returns {boolean} whether any contexts were parsed
 */
export function parseRemoteContexts(context, remoteString) { // was: W93
  let found = false;
  if (remoteString === "") return found;

  remoteString.split(",").forEach((entry) => {
    const remoteClient = {
      clientName: "UNKNOWN_INTERFACE",
      platform: "UNKNOWN_PLATFORM",
      clientVersion: "",
    };
    let appState = "ACTIVE";

    if (entry[0] === "!") {
      entry = entry.substring(1);
      appState = "INACTIVE";
    }

    const parts = entry.split("-");
    if (parts.length < 3) return;

    if (parts[0] in APP_TO_CLIENT_TYPE) remoteClient.clientName = APP_TO_CLIENT_TYPE[parts[0]]; // ek7 = clientNameMap
    if (parts[1] in FORM_FACTOR_MAP) remoteClient.platform = FORM_FACTOR_MAP[parts[1]];   // V1d = platformMap
    remoteClient.applicationState = appState;
    remoteClient.clientVersion = parts.length > 2 ? parts[2] : "";

    const remoteContext = { remoteClient };
    if (context.remoteContexts) {
      context.remoteContexts.push(remoteContext);
    } else {
      context.remoteContexts = [remoteContext];
    }
    found = true;
  });

  return found;
}

// ===================================================================
// Ad action command executor setup
// ===================================================================

/**
 * Create the ad action command executor with all standard extensions.
 * [was: yLR]
 *
 * @param {object} adModule [was: Q]
 * @returns {Bem} command executor
 */
export function createAdCommandExecutor(adModule) { // was: yLR
  const executor = new Bem(adModule.W.mG); // Bem = CommandExecutor
  registerDisposable(adModule, executor);

  const extensions = [
    new xmx(adModule.W.hJ),      // xmx = ClickExtension
    new qDm(adModule.W.U),       // qDm = NavigationExtension
    new n$_(adModule.W.hJ),      // n$_ = LoggingExtension
    new DmW(adModule.W.P1, adModule.W.xN), // DmW = MetricsExtension
    new t1d(),                    // t1d = SurveyExtension
    new UrlEndpointHandler(adModule.W.gs, adModule.W.AdBreakRequestMetadata, adModule.W.hJ), // Htd = TrackingExtension
    new Nex(),                    // Nex = NotificationExtension
    new itw(adModule.W.AdBreakRequestMetadata),      // itw = ErrorReportingExtension
  ];
  for (const ext of extensions) registerAdapterExtension(executor, ext);

  // Register no-op handlers for dialog endpoints
  for (const key of ["adInfoDialogEndpoint", "adFeedbackEndpoint"]) {
    registerExtension(executor, key, () => {});
  }
  return executor;
}

/**
 * Build the ad telemetry logger and context.
 * [was: gW]
 *
 * @param {object} deps [was: Q]
 * @returns {{ LO: Fz0, context: object }}
 */
export function buildAdTelemetryContext(deps) { // was: gW
  const metricsProvider = deps.cA;
  const configProvider = deps.QC;
  const errorGroup = deps.CastController;

  const context = {
    MrM: new SDm(metricsProvider.get(), configProvider), // SDm = AdMetricsManager
    QC: configProvider,
  };

  return {
    httpStatusToGrpcCode: new Fz0(configProvider, errorGroup, metricsProvider), // Fz0 = AdTelemetryLogger
    context,
  };
}

// ===================================================================
// Ad-to-video / video-to-ad transitions
// ===================================================================

/**
 * Transition from ad to content video.
 * [was: dQ]
 *
 * @param {object} transition [was: Q]
 */
export function transitionAdToVideo(transition) { // was: dQ
  transition.O = false;
  const data = {};
  if (transition.W && transition.videoId) {
    data.cttAuthInfo = { token: transition.W, videoId: transition.videoId };
  }
  qp("ad_to_video", data); // qp = logTransition
  logAdTransitionLatency(transition);
}

/**
 * Transition from content video to ad.
 * [was: E$_]
 *
 * @param {object} transition [was: Q]
 */
export function transitionVideoToAd(transition) { // was: E$_
  if (!transition.U.getVideoData({ playerType: 1 })?.L) return;
  transition.O = false;
  const data = {};
  if (transition.W && transition.videoId) {
    data.cttAuthInfo = { token: transition.W, videoId: transition.videoId };
  }
  qp("video_to_ad", data);
}

/**
 * Check if any ad renderer in the list is a monetized in-stream ad.
 * [was: sh3]
 *
 * @param {object} _unused [was: Q]
 * @param {Array} renderers [was: c]
 */
export function detectMonetizedRenderer(_unused, renderers) { // was: sh3
  for (const entry of renderers) {
    const renderer = entry.renderer;
    if (
      renderer &&
      (renderer.instreamVideoAdRenderer ||
        renderer.linearAdSequenceRenderer ||
        renderer.sandwichedLinearAdRenderer ||
        renderer.instreamSurveyAdRenderer)
    ) {
      Bu("ad_i"); // Bu = logAdImpression
      g.xh({ isMonetized: true });
      break;
    }
  }
}

/**
 * Log ad transition latency via CSI.
 * [was: Zt3]
 *
 * @param {object} transition [was: Q]
 */
export function logAdTransitionLatency(transition) { // was: Zt3
  if (!transition.A) return;

  if (transition.j === "AD_PLACEMENT_KIND_START" && transition.actionType === "video_to_ad") {
    Ar("video_to_ad"); // Ar = logCsiAction
    return;
  }

  const csiData = {
    adBreakType: HD(transition.j), // HD = mapPlacementKind
    playerType: "LATENCY_PLAYER_HTML5",
    playerInfo: { preloadType: "LATENCY_PLAYER_PRELOAD_TYPE_PREBUFFER" },
    videoStreamType: transition.videoStreamType,
  };

  if (transition.actionType === "ad_to_video") {
    if (transition.contentCpn) csiData.targetCpn = transition.contentCpn;
    if (transition.videoId) csiData.targetVideoId = transition.videoId;
  } else {
    if (transition.adCpn) csiData.targetCpn = transition.adCpn;
    if (transition.adVideoId) csiData.targetVideoId = transition.adVideoId;
  }

  if (transition.adFormat) csiData.adType = transition.adFormat;
  if (transition.contentCpn) csiData.clientPlaybackNonce = transition.contentCpn;
  if (transition.videoId) csiData.videoId = transition.videoId;
  if (transition.adCpn) csiData.adClientPlaybackNonce = transition.adCpn;
  if (transition.adVideoId) csiData.adVideoId = transition.adVideoId;

  g.xh(csiData, transition.actionType);

  if (transition.U.G().experiments.SG("html5_ads_csi_qoes")) {
    const playerType = transition.actionType === "ad_to_video" ? 1 : 2;
    const currentTime = transition.U.jM(playerType); // jM = getMediaTime
    const elapsed = (0, g.h)() - 1000 * currentTime;
    D0("qoes", elapsed, transition.actionType); // D0 = logCsiTiming
  }
}

/**
 * Reset all ad transition tracking state.
 * [was: dmK]
 *
 * @param {object} transition [was: Q]
 */
export function resetAdTransitionState(transition) { // was: dmK
  transition.contentCpn = null;
  transition.adCpn = null;
  transition.videoId = null;
  transition.adVideoId = null;
  transition.adFormat = null;
  transition.j = "AD_PLACEMENT_KIND_UNKNOWN";
  transition.actionType = "unknown_type";
  transition.A = false;
  transition.O = false;
}

// ===================================================================
// Ad player control
// ===================================================================

/**
 * Cue the ad player with given player vars.
 * [was: OH]
 *
 * @param {object} adModule [was: Q]
 * @param {object} playerVars [was: c]
 */
export function cueAdVideo(adModule, playerVars) { // was: OH
  adModule.U.cueVideoByPlayerVars(playerVars, 2);
}

/**
 * Publish an event on the player bus (special handling for ad start/end).
 * [was: b1]
 *
 * @param {object} adInterface [was: Q]
 * @param {string} event [was: c]
 * @param {...*} args [was: W]
 */
export function publishAdEvent(adInterface, event, ...args) { // was: b1
  if (event === "onAdStart" || event === "onAdEnd") {
    publishEventAll(adInterface.U, event, ...args); // g.Ht = publishEventAll
  } else {
    publishEvent(adInterface.U, event, ...args); // g.xt = publishEvent
  }
}

// ===================================================================
// Experiment flag helpers (ads)
// ===================================================================

/** Check an experiment flag. [was: qP] */
export function checkAdExperiment(adModule, flag) { return adModule.U.G().X(flag); } // was: qP

/** [was: sKy] */
export function isSlotLayoutReceivedLoggingEnabled(adModule) { return adModule.U.G().experiments.SG("enable_on_slot_web_layout_received_logging"); } // was: sKy

/** [was: LzX] */
export function isDiscoveryAbandonPingsEnabled(adModule) { return adModule.U.G().experiments.SG("enable_desktop_discovery_video_abandon_pings") || isTvHtml5Exact(adModule.U.G()); } // was: LzX

/** [was: wZW] */
export function isProgressCommandsLrFeedsEnabled(adModule) { return adModule.U.G().experiments.SG("enable_progres_commands_lr_feeds"); } // was: wZW

/** [was: btm] */
export function isProgressCommandsLrShortsEnabled(adModule) { return adModule.U.G().experiments.SG("enable_progress_commands_lr_shorts"); } // was: btm

/** [was: aL] */
export function shouldLoadAdsInsteadOfCue(adModule, placement) {
  if (adModule.U.G().X("html5_cue_video_for_preroll") && placement?.kind === "AD_PLACEMENT_KIND_START") return false;
  return adModule.U.G().experiments.SG("html5_load_ads_instead_of_cue");
} // was: aL

/** [was: Gv] */
export function isAdPreloadEnabled(adModule) { return adModule.U.G().experiments.SG("html5_preload_ads"); } // was: Gv

/** [was: jh_] */
export function isEmptyPlayerInMediaBreakEnabled(adModule) { return adModule.U.G().experiments.SG("html5_load_empty_player_in_media_break_sub_lra"); } // was: jh_

/** [was: fH] */
export function isSsdaiMediaEndCueRangeEnabled(adModule) { return adModule.U.G().experiments.SG("html5_ssdai_enable_media_end_cue_range"); } // was: fH

/** [was: vi] */
export function isSubstituteAdCpnMacroEnabled(adModule) { return adModule.U.G().X("substitute_ad_cpn_macro_in_ssdai"); } // was: vi

/** [was: aE] */
export function isServerStitchedDaiEnabled(adModule) {
  return adModule.U.getVideoData({ playerType: 1 }).getPlayerResponse()?.playerConfig?.daiConfig?.enableServerStitchedDai || false;
} // was: aE

/** [was: kY] */
export function isProgressCommandsElDaiEnabled(adModule) { return adModule.U.G().experiments.SG("enable_progress_commands_el_dai"); } // was: kY

/** [was: pzK] */
export function shouldPreloadFirstVodAd(adModule) {
  const vd = adModule.U.getVideoData({ playerType: 1 });
  return !!vd && vd.X("html5_preload_first_vod_video_ad") && !vd.isDaiEnabled() && !vd.isLivePlayback;
} // was: pzK

/** [was: ZI] */
export function isDesktopPlayerUnderlayEnabled(adModule) { return adModule.U.G().experiments.SG("enable_desktop_player_underlay"); } // was: ZI

/** [was: U$] */
export function isH5MultiviewDaiEnabled(adModule) { return adModule.U.G().experiments.SG("enable_h5_multiview_dai"); } // was: U$

/** [was: xe0] */
export function isVodSlarWithNotifyPacfEnabled(adModule) { return adModule.U.G().X("html5_enable_vod_slar_with_notify_pacf"); } // was: xe0

/** [was: tl] */
export function isDeterministicIdGenerationEnabled(adModule) { return adModule.U.G().experiments.SG("enable_ads_control_flow_deterministic_id_generation"); } // was: tl

/** [was: Gc] */
export function isCuepointIdentifierLoggingEnabled(adModule) { return adModule.U.G().experiments.SG("html5_cuepoint_identifier_logging"); } // was: Gc

/** [was: g$m] */
export function shouldRecognizePredictStartCuepoint(adModule) { return adModule.U.G().X("html5_recognize_predict_start_cue_point"); } // was: g$m

/** [was: OtX] */
export function shouldIgnoreCuepointsDuringLifaPreroll(adModule) { return adModule.U.G().experiments.SG("should_ignore_cuepoints_during_lifa_preroll"); } // was: OtX

// ===================================================================
// Active View event name mapping
// ===================================================================

/**
 * Map an active-view tracking type to a ping endpoint name.
 * [was: fCO]
 *
 * @param {string} trackingType
 * @returns {string|null}
 */
export function mapActiveViewTrackingType(trackingType) { // was: fCO
  switch (trackingType) {
    case "audio_audible": return "adaudioaudible";
    case "audio_measurable": return "adaudiomeasurable";
    case "fully_viewable_audible_half_duration_impression": return "adfullyviewableaudiblehalfdurationimpression";
    case "measurable_impression": return "adactiveviewmeasurable";
    case "overlay_unmeasurable_impression": return "adoverlaymeasurableimpression";
    case "overlay_unviewable_impression": return "adoverlayunviewableimpression";
    case "overlay_viewable_end_of_session_impression": return "adoverlayviewableendofsessionimpression";
    case "overlay_viewable_immediate_impression": return "adoverlayviewableimmediateimpression";
    case "viewable_impression": return "adviewableimpression";
    default: return null;
  }
}

// ===================================================================
// LIDAR (active view SDK) integration
// ===================================================================

/**
 * Get or create the LIDAR (active view) singleton.
 * [was: Pi]
 *
 * @returns {v$K}
 */
export function getLidarInstance() { // was: Pi
  if ($S === null) {
    $S = new v$K(); // v$K = LidarInstance
    gf(YouTubeActiveViewManager).O = "b";  // gf = getConfig, y7 = configKey
    const config = gf(YouTubeActiveViewManager);
    const isReady = xN(config) == "h" || xN(config) == "b"; // xN = getConfigState
    const isActive = !(rs(), false); // rs = checkActiveViewActive

    if (isReady && isActive) {
      config.Ka = true;
      config.PA = new FrameWalker(); // aCn = ActiveViewReporter
    }
  }
  return $S;
}

/**
 * Store a layout config in the LIDAR instance.
 * [was: Gx7]
 *
 * @param {object} lidar [was: Q]
 * @param {string} layoutId [was: c]
 * @param {object} config [was: W]
 */
export function setLidarLayoutConfig(lidar, layoutId, config) { // was: Gx7
  lidar.W[layoutId] = config;
}

/**
 * Map a VAST/ad tracking event name to a normalized event name.
 * [was: $mR]
 *
 * @param {string} eventName
 * @returns {string|null}
 */
export function mapVastEventName(eventName) { // was: $mR
  switch (eventName) {
    case "abandon": case "unmuted_abandon": return "abandon";
    case "active_view_fully_viewable_audible_half_duration": return "fully_viewable_audible_half_duration_impression";
    case "active_view_measurable": return "measurable_impression";
    case "active_view_viewable": return "viewable_impression";
    case "audio_audible": return "audio_audible";
    case "audio_measurable": return "audio_measurable";
    case "complete": case "unmuted_complete": return "complete";
    case "end_fullscreen": case "unmuted_end_fullscreen": return "exitfullscreen";
    case "first_quartile": case "unmuted_first_quartile": return "firstquartile";
    case "fullscreen": case "unmuted_fullscreen": return "fullscreen";
    case "impression": case "unmuted_impression": return "impression";
    case "midpoint": case "unmuted_midpoint": return "midpoint";
    case "mute": case "unmuted_mute": return "mute";
    case "pause": case "unmuted_pause": return "pause";
    case "progress": case "unmuted_progress": return "progress";
    case "resume": case "unmuted_resume": return "resume";
    case "swipe": case "skip": case "unmuted_skip": return "skip";
    case "start": case "unmuted_start": return "start";
    case "third_quartile": case "unmuted_third_quartile": return "thirdquartile";
    case "unmute": case "unmuted_unmute": return "unmute";
    default: return null;
  }
}

/**
 * Register a layout with the LIDAR active-view system.
 * [was: uY]
 *
 * @param {object} lidarApi [was: Q]
 * @param {string} layoutId [was: c]
 * @param {object} options [was: W] - `{ A8, Oe, listener, Nr }`
 */
export function registerLidarLayout(lidarApi, layoutId, options) { // was: uY
  const { A8: adConfig, Oe: duration, listener, createSlotWithFulfillment: dedupeKey } = options;

  if (lidarApi.W.has(layoutId)) {
    reportAdsControlFlowError("Unexpected registration of layout in LidarApi");
    return;
  }

  if (dedupeKey) {
    if (lidarApi.O.has(dedupeKey)) return;
    lidarApi.O.add(dedupeKey);
  }

  lidarApi.W.set(layoutId, listener);
  ef(rs().yE, "fmd", 1); // ef = incrementCounter
  setClickTrackingTarget(gf(YouTubeActiveViewManager), adConfig);  // sN = configureActiveView

  setLidarLayoutConfig(getLidarInstance(), layoutId, {
    getQualityLabel: () => {
      if (!duration) return {};
      const playerType = lidarApi.U.getPresentingPlayerType(true);
      const videoData = lidarApi.U.getVideoData({ playerType });
      if (!videoData?.isAd()) return {};
      return {
        currentTime: lidarApi.logVisualElementClicked.get().getCurrentTimeSec(playerType, false, undefined),
        duration,
        isPlaying: getPlayerState(lidarApi.logVisualElementClicked.get(), playerType).isPlaying(),
        isVpaid: false,
        isYouTube: true,
        volume: lidarApi.logVisualElementClicked.get().isMuted() ? 0 : lidarApi.logVisualElementClicked.get().getVolume() / 100,
      };
    },
  });
}

/**
 * Unregister a layout from the LIDAR active-view system.
 * [was: hw]
 *
 * @param {object} lidarApi [was: Q]
 * @param {string} layoutId [was: c]
 */
export function unregisterLidarLayout(lidarApi, layoutId) { // was: hw
  if (lidarApi.W.has(layoutId)) {
    lidarApi.W.delete(layoutId);
    delete getLidarInstance().W[layoutId];
  } else {
    reportAdsControlFlowError("Unexpected unregistration of layout in LidarApi");
  }
}

/**
 * Notify LIDAR of ad click geometry for viewability measurement.
 * [was: PMn]
 *
 * @param {object} lidarApi [was: Q]
 * @param {*} event [was: c]
 */
export function notifyLidarAdClick(lidarApi, event) { // was: PMn
  if (!lidarApi.U.isLifaAdPlaying()) return;
  const rect = lidarApi.U.toggleAriaHidden(true, true); // O8 = getVideoRect
  lidarApi.J(
    event,
    rect.width * 0.5 * 1.1,
    rect.height * 0.25 * 1.1,
    rect.width * 0.5 * 0.9,
    rect.height * 0.5 * 0.9
  );
}

// ===================================================================
// Ad ping macro system
// ===================================================================

/**
 * Build the base set of ad tracking macros for ping URLs.
 * [was: hkx]
 *
 * @param {object} player [was: Q]
 * @param {number} [adPlayerType] [was: c]
 * @returns {object}
 */
export function buildAdTrackingMacros(player, adPlayerType) { // was: hkx
  const macros = {};
  addCoreMacros(player, macros, adPlayerType);
  addNetworkMacros(macros);
  macros.LACT = makeLazy(() => getLastActivityMs().toString());
  macros.VIS = makeLazy(() => player.getVisibilityState().toString());
  macros.SDKV = "h.3.0";
  macros.VOL = makeLazy(() => player.isMuted() ? "0" : Math.round(player.getVolume()).toString());
  macros.VED = "";
  return macros;
}

/**
 * Build midroll-position macros from an ad placement config.
 * [was: zkd]
 *
 * @param {object} [placement] [was: Q]
 * @param {boolean} [hasRenderingContent] [was: c]
 * @returns {object}
 */
export function buildMidrollMacros(placement, hasRenderingContent) { // was: zkd
  const macros = {};
  if (hasRenderingContent || !placement?.kind) return macros;

  if (placement.kind === "AD_PLACEMENT_KIND_MILLISECONDS" || placement.kind === "AD_PLACEMENT_KIND_CUE_POINT_TRIGGERED") {
    if (!placement.adTimeOffset?.offsetStartMilliseconds) {
      reportErrorWithLevel(Error("malformed AdPlacementConfig"));
      return macros;
    }
    macros.MIDROLL_POS = makeLazy(fs(Math.round(ZQ(placement.adTimeOffset.offsetStartMilliseconds) / 1000).toString()));
  } else {
    macros.MIDROLL_POS = makeLazy(fs("0"));
  }
  return macros;
}

/**
 * Create a lazy-evaluated string wrapper (defers computation until `.toString()`).
 * [was: zc]
 *
 * @param {Function} factory
 * @returns {{ toString: Function }}
 */
export function makeLazy(factory) { // was: zc
  return { toString() { return factory(); } };
}

/**
 * Merge third-party viewability macros into an existing macro set.
 * [was: CMw]
 *
 * @param {object} baseMacros [was: Q]
 * @param {boolean} shouldEncode [was: c]
 * @param {object} [viewabilityData] [was: W]
 * @returns {object}
 */
export function mergeViewabilityMacros(baseMacros, shouldEncode, viewabilityData) { // was: CMw
  if (!viewabilityData || isEmptyObject(viewabilityData)) return baseMacros; // g.P9 = isEmpty
  const merged = Object.assign({}, baseMacros);
  const encode = shouldEncode ? encodeURIComponent : (v) => v;

  const mapEncoded = (macroKey, dataKey) => {
    const val = viewabilityData[dataKey];
    if (val) merged[macroKey] = encode(val);
  };
  mapEncoded("DV_VIEWABILITY", "doubleVerifyViewability");
  mapEncoded("IAS_VIEWABILITY", "integralAdsViewability");
  mapEncoded("MOAT_INIT", "moatInit");
  mapEncoded("MOAT_VIEWABILITY", "moatViewability");

  const mapDirect = (macroKey, dataKey) => {
    const val = viewabilityData[dataKey];
    if (val) merged[macroKey] = val;
  };
  mapDirect("GOOGLE_VIEWABILITY", "googleViewability");
  mapDirect("VIEWABILITY", "viewability");

  return merged;
}

/**
 * Add core CPN / media-time / player-size macros.
 * [was: lCd]
 *
 * @param {object} player [was: Q]
 * @param {object} macros [was: c]
 * @param {number} [adPlayerType] [was: W]
 */
export function addCoreMacros(player, macros, adPlayerType) { // was: lCd
  macros.CPN = makeLazy(() => {
    const vd = player.getVideoData({ playerType: 1 });
    if (!vd) { reportWarning(Error("Video data is null.")); return null; }
    return vd.clientPlaybackNonce;
  });

  macros.AD_MT = makeLazy(() => {
    let time;
    if (adPlayerType != null) {
      time = adPlayerType;
    } else if (
      player.G().X("enable_h5_shorts_ad_fill_ad_mt_macro") ||
      player.G().X("enable_desktop_discovery_pings_ad_mt_macro") ||
      isTvHtml5Exact(player.G())
    ) {
      const pt = player.getPresentingPlayerType(true);
      time = player.getVideoData({ playerType: pt })?.isAd()
        ? player.getCurrentTime({ playerType: pt, wj: false })
        : 0;
    } else {
      time = player.getCurrentTime({ playerType: 2, wj: false });
    }
    return formatTimeMs(time);
  });

  macros.appendStatEntry = makeLazy(() => formatTimeMs(player.getCurrentTime({ playerType: 1, wj: false })));
  macros.elementsCommandKey = makeLazy(() => player.bX().globalEventBuffer().height.toString());
  macros.P_W = makeLazy(() => player.bX().globalEventBuffer().width.toString());
  macros.PV_H = makeLazy(() => player.bX().getVideoContentRect().height.toString());
  macros.PV_W = makeLazy(() => player.bX().getVideoContentRect().width.toString());
}

/**
 * Format a time value (seconds) as an integer millisecond string.
 * [was: M17]
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatTimeMs(seconds) { // was: M17
  return Math.round(Math.max(0, seconds * 1000)).toString();
}

/**
 * Add network/connection macros.
 * [was: uby]
 *
 * @param {object} macros [was: Q]
 */
export function addNetworkMacros(macros) { // was: uby
  macros.CONN = makeLazy(fs("0")); // fs = constant factory
  macros.WT = makeLazy(() => Date.now().toString());
}

// ===================================================================
// Ad ping sending (with headers)
// ===================================================================

/**
 * Send a tracking ping, resolving async headers first.
 * [was: JLO]
 *
 * @param {object} authProvider [was: Q]
 * @param {object} pingConfig [was: c]
 * @param {object} macros [was: W]
 * @param {object} [viewabilityData] [was: m]
 * @param {string} [attributionSrcMode] [was: K]
 */
export async function sendTrackingPing(authProvider, pingConfig, macros, viewabilityData, attributionSrcMode) { // was: JLO
  const scrubReferrer = !!pingConfig.scrubReferrer;
  const url = expandUrlTemplate(pingConfig.baseUrl, mergeViewabilityMacros(macros, scrubReferrer, viewabilityData));
  const headers = {};

  if (pingConfig.headers) {
    let authToken = authProvider.j();
    authToken = authToken.W ? await authToken.W : authToken.getValue();

    for (const header of pingConfig.headers) {
      switch (header.headerType) {
        case "VISITOR_ID":
          if (getConfig("VISITOR_DATA")) headers["X-Goog-Visitor-Id"] = getConfig("VISITOR_DATA");
          break;
        case "EOM_VISITOR_ID":
          if (getConfig("EOM_VISITOR_DATA")) headers["X-Goog-EOM-Visitor-Id"] = getConfig("EOM_VISITOR_DATA");
          break;
        case "USER_AUTH":
          if (authToken) headers.Authorization = `Bearer ${authToken}`;
          break;
        case "PLUS_PAGE_ID": {
          const pageId = authProvider.K();
          if (pageId) headers["X-Goog-PageId"] = pageId;
          break;
        }
        case "AUTH_USER": {
          const authUser = authProvider.W();
          if (!authToken && authUser) headers["X-Goog-AuthUser"] = authUser;
          break;
        }
        case "DATASYNC_ID": {
          const experiments = authProvider.A();
          if (experiments?.SG("enable_datasync_id_header_in_web_vss_pings")) {
            const syncId = authProvider.O();
            if (isSameOrigin(url) && getConfig("LOGGED_IN") && syncId) {
              headers["X-YouTube-DataSync-Id"] = syncId;
            }
          }
          break;
        }
      }
    }
    // Prefer EOM visitor ID over standard when both present
    if ("X-Goog-EOM-Visitor-Id" in headers && "X-Goog-Visitor-Id" in headers) {
      delete headers["X-Goog-Visitor-Id"];
    }
  }

  sendPing(url, undefined, scrubReferrer, Object.keys(headers).length !== 0 ? headers : undefined, "", true, attributionSrcMode);
}

// ===================================================================
// Ad error info
// ===================================================================

/**
 * Set an ad error stat on the content video data.
 * [was: j7]
 *
 * @param {object} adModule [was: Q]
 * @param {string} key [was: c]
 * @param {string|object} value [was: W]
 */
export function setAdErrorStat(adModule, key, value) { // was: j7
  const videoData = adModule.U.getVideoData({ playerType: 1 });
  if (typeof value === "string") {
    videoData.n$(key, value); // n$ = setStatString
  } else {
    videoData.RetryTimer(key, value); // tJ = setStatObject
  }
}

/**
 * Send a video stats engage event for an ad.
 * [was: go]
 *
 * @param {object} adModule [was: Q]
 * @param {*} eventData [was: c]
 */
export function sendAdEngageEvent(adModule, eventData) { // was: go
  adModule.U.sendVideoStatsEngageEvent(eventData, undefined, 2);
}

// ===================================================================
// Ad ping tracking (layout-aware)
// ===================================================================

/**
 * Fire tracking pings for a layout with resolved macros.
 * [was: HG7]
 *
 * @param {object} tracker [was: Q]
 * @param {string} layoutId [was: c]
 * @param {string} trackingType [was: W]
 * @param {Array} [pings=[]] [was: m]
 * @param {string} [cpnOverride] [was: K]
 * @param {object} [extraMacros] [was: T]
 */
export function fireLayoutTrackingPings(tracker, layoutId, trackingType, pings = [], cpnOverride, extraMacros) { // was: HG7
  const layout = VZ(tracker.O.get(), layoutId); // VZ = getLayoutById
  if (!layout) {
    reportAdsControlFlowError("Trying to track from an unknown layout.", undefined, undefined, { layoutId, trackingType });
    return;
  }

  const overrideKey = tracker.lX.get().m9(layoutId, trackingType);
  const macros = buildFullMacroSet(tracker, extractPlacementInfo(layout), layout, cpnOverride, extraMacros);

  pings.forEach((ping, index) => {
    if (!ping.baseUrl) return;
    tracker.A.send(ping.baseUrl, macros, overrideKey, ping.attributionSrcMode);
    if (ping.serializedAdPingMetadata) {
      tracker.httpStatusToGrpcCode.W(
        "ADS_CLIENT_EVENT_TYPE_PING_DISPATCHED",
        undefined, undefined, undefined, undefined,
        layout, new FulfillmentIndexEntry(ping, index),
        undefined, undefined, layout.adLayoutLoggingData
      );
    }
  });
}

// ===================================================================
// Ad error info supplier registry
// ===================================================================

/**
 * Register an ad-error-info supplier.
 * [was: Mz]
 *
 * @param {object} registry [was: Q]
 * @param {object} supplier [was: c]
 */
export function registerErrorInfoSupplier(registry, supplier) { // was: Mz
  if (registry.W.has(supplier.eE())) {
    reportAdsControlFlowError("Trying to register an existing AdErrorInfoSupplier.");
    return;
  }
  registry.W.set(supplier.eE(), supplier);
}

/**
 * Unregister an ad-error-info supplier.
 * [was: Jw]
 *
 * @param {object} registry [was: Q]
 * @param {object} supplier [was: c]
 */
export function unregisterErrorInfoSupplier(registry, supplier) { // was: Jw
  if (!registry.W.delete(supplier.eE())) {
    reportAdsControlFlowError("Trying to unregister a AdErrorInfoSupplier that has not been registered yet.");
  }
}

// ===================================================================
// Ads client state change notification
// ===================================================================

/**
 * Emit an ads-client-state-change event.
 * [was: wQ]
 *
 * @param {*} _unused [was: Q]
 * @param {object} stateChange [was: c]
 */
export function emitAdsClientStateChange(_unused, stateChange) { // was: wQ
  logGelEvent("adsClientStateChange", stateChange); // g.eG = emit global event
}

// ===================================================================
// Ad ping from layout context
// ===================================================================

/**
 * Send a tracking ping from a specific layout context.
 * [was: pZO]
 *
 * @param {object} tracker [was: Q]
 * @param {object} pingConfig [was: c]
 * @param {string} layoutId [was: W]
 * @param {object} [extraMacros] [was: m]
 * @param {string} [attributionSrcMode] [was: K]
 */
export function sendPingFromLayout(tracker, pingConfig, layoutId, extraMacros, attributionSrcMode) { // was: pZO
  const layout = VZ(tracker.O.get(), layoutId);
  if (!layout) {
    reportAdsControlFlowError("Trying to ping from an unknown layout", undefined, undefined, { layoutId });
    return;
  }
  const macros = buildFullMacroSet(tracker, extractPlacementInfo(layout), layout, undefined, undefined, extraMacros);
  if (pingConfig.hasOwnProperty("baseUrl")) {
    tracker.j.send(pingConfig, macros);
  } else {
    tracker.A.send(pingConfig, macros, {}, attributionSrcMode);
  }
}

// ===================================================================
// Full macro set builder
// ===================================================================

/**
 * Build the complete set of macros for an ad ping, merging core, midroll,
 * survey, error, network, and CPN macros.
 * [was: $A]
 *
 * @param {object} tracker [was: Q]
 * @param {object} placementInfo [was: c]
 * @param {object} [layout] [was: W]
 * @param {string} [cpnOverride] [was: m (K in original)]
 * @param {string} [cpnFallback] [was: K (in original)]
 * @param {object} [extraMacros] [was: T]
 * @returns {object}
 */
export function buildFullMacroSet(tracker, placementInfo, layout, cpnOverride, cpnFallback, extraMacros) { // was: $A
  const surveyMacros = layout ? buildSurveyMacros(tracker) : {};
  const errorMacros = layout ? buildErrorMacros(tracker, layout.layoutId) : {};
  const networkInfoMacros = buildNetworkInfoMacros(tracker);
  const adCpn = cpnFallback ?? getPresenterVideoData(tracker.cA.get(), 2)?.clientPlaybackNonce;

  let baseMacros = {
    ...buildAdTrackingMacros(tracker.U, cpnOverride),
    ...buildMidrollMacros(placementInfo.adPlacementConfig, layout?.renderingContent !== undefined),
    ...errorMacros,
    ...surveyMacros,
    ...networkInfoMacros,
    FINAL: makeLazy(() => "1"),
    AD_CPN: makeLazy(() => adCpn || ""),
  };

  if (layout?.renderingContent === undefined) {
    baseMacros.SLOT_POS = makeLazy(() => (placementInfo.j0 || 0).toString());
  }

  // Resolve all lazy macros to strings
  const resolved = {};
  const allMacros = Object.assign({}, baseMacros, extraMacros);
  for (const key of Object.values(AD_MACRO_KEYS)) { // mz7 = macroKeyEnum
    const val = allMacros[key];
    if (val != null && val.toString() != null) resolved[key] = val.toString();
  }
  return resolved;
}

/**
 * Extract ad-placement config and sub-layout index from a layout.
 * [was: CH]
 *
 * @param {object} layout [was: Q]
 * @returns {{ adPlacementConfig: *, j0: * }}
 */
export function extractPlacementInfo(layout) { // was: CH
  return {
    adPlacementConfig: layout.clientMetadata.readTimecodeScale("metadata_type_ad_placement_config"),
    j0: layout.clientMetadata.readTimecodeScale("metadata_type_media_sub_layout_index"),
  };
}

/**
 * Build survey-related macros (elapsed time, local epoch).
 * [was: QEO]
 *
 * @param {object} tracker [was: Q]
 * @returns {object}
 */
export function buildSurveyMacros(tracker) { // was: QEO
  const macros = {};
  const elapsed = tracker.volumeMutedIcon?.Zp(); // S_ = surveyTracker, Zp = getElapsedSec
  if (elapsed != null) {
    macros.SURVEY_ELAPSED_MS = makeLazy(() => Math.round(elapsed * 1000).toString());
  }
  macros.SURVEY_LOCAL_TIME_EPOCH_S = makeLazy(() => Math.round(Date.now() / 1000).toString());
  return macros;
}

/**
 * Build error-code macros from the ad error info supplier for a layout.
 * [was: cw3]
 *
 * @param {object} tracker [was: Q]
 * @param {string} layoutId [was: c]
 * @returns {object}
 */
export function buildErrorMacros(tracker, layoutId) { // was: cw3
  const supplier = tracker.W.get(layoutId);
  if (!supplier) return {};
  const errorInfo = supplier.DoubleFlag(); // yW = getErrorInfo
  if (!errorInfo) return {};
  return {
    YT_ERROR_CODE: errorInfo.extractPingMap.toString(),
    ERRORCODE: errorInfo.i_.toString(),
    ERROR_MSG: errorInfo.errorMessage,
  };
}

/**
 * Build network/content info macros (ASR, event ID).
 * [was: Wqw]
 *
 * @param {object} tracker [was: Q]
 * @returns {object}
 */
export function buildNetworkInfoMacros(tracker) { // was: Wqw
  const macros = {};
  const videoData = tracker.U.getVideoData({ playerType: 1 });
  macros.ASR = makeLazy(() => videoData?.i6 ?? null);
  macros.EI = makeLazy(() => videoData?.eventId ?? null);
  return macros;
}
