/**
 * Ad Click Tracking — innertube context construction, player API registration,
 * ad break fetching, ad signal parsing, SSDAI config, ad ping macro expansion,
 * LIDAR active view integration, and ad error info tracking.
 *
 * This is the LARGEST remaining base.js gap.
 *
 * Source: base.js lines 35091–36229
 * [was: (context builder cont.), g.Bt, Ic, SUW, FXx, g.xt, R, q3, n8,
 *  g.Dr, g.tV, g.Ht, ZMn, N3, dl3, sRd, LX0, wTw, g.ip, So, jR3,
 *  gi7, Fq, Gby, $ln, EP, g.sP, PoK, g.d7, g.L8, g.bp, g.jo, g.OP,
 *  g.lFn, g.f8, g.vt, hdR, GL, $t, Pt, Coy, lp, g.up, g.hV, zL,
 *  M3, JV, RZ, YUn, MTw, pTK, g.kt, g.Yt, QnK, cSx, Qh, cp, WBn,
 *  m5n, KB_, TQ_, oTn, rSK, TD, my, Wp, U53, Kb, ob, IKx, XDX,
 *  ASw, V7m, BQO, x50, nTO, D5d, t7m, HA7, iAO, rt, ySK, Ib]
 */

import { storageGet } from '../core/attestation.js';  // was: g.UM
import { AnimationFrameTimer, expandUrlTemplate } from '../core/bitstream-helpers.js';  // was: g.T5, g.lZ
import { getConfig, listen } from '../core/composition-helpers.js';  // was: g.v, g.s7
import { forEach } from '../core/event-registration.js';  // was: g.mfm
import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { getProperty } from '../core/misc-helpers.js';  // was: g.l
import { isEmbedWithAudio, resolveOAuthToken } from '../data/bandwidth-tracker.js';  // was: g.oc, g.OQ
import { sendInnertubeRequest } from '../data/collection-utils.js';  // was: g.$h
import { sendPing } from '../data/gel-core.js';  // was: g.GU
import { reportErrorWithLevel } from '../data/gel-params.js';  // was: g.Zf
import { isPrimaryClick } from '../data/interaction-logging.js';  // was: g.P1
import { getDevicePixelRatio, isEmbedded, isTvHtml5 } from '../data/performance-profiling.js';  // was: g.F7, g.eh, g.AI
import { updateVideoData } from '../features/autoplay.js';  // was: g.Sm
import { canPlayType } from '../media/codec-helpers.js';  // was: g.XL
import { buildFullInnertubeContext } from '../network/innertube-client.js';  // was: g.Oh
import { sendXhrRequest } from '../network/request.js';  // was: g.Wn
import { buildInnertubeApiPath } from '../network/service-endpoints.js';  // was: g.vu
import { getWebglModule } from '../player/caption-manager.js';  // was: g.g7
import { loadPlaylist } from '../player/media-state.js';  // was: g.cLX
import { setAutonavState } from '../player/playback-state.js';  // was: g.dc7
import { cuePlaylist, isAtLiveHead, nextVideo, pauseVideo, playVideo, playVideoAt, preloadVideoByPlayerVars, previousVideo, seekBy, seekTo, stopVideo } from '../player/player-events.js';  // was: g.cuePlaylist, g.isAtLiveHead, g.nextVideo, g.pauseVideo, g.playVideo, g.playVideoAt, g.preloadVideoByPlayerVars, g.previousVideo, g.seekBy, g.seekTo, g.stopVideo
import { PlayerError } from '../ui/cue-manager.js';  // was: g.rh
import { setLoopRange } from '../ui/seek-bar-tail.js';  // was: g.U2X
import { initBotGuardFromExperiments } from './ad-async.js';  // was: g.Il
import { queueNextVideo } from './ad-prebuffer.js';  // was: g.lz7
import { attachThirdPartyContext } from './ad-async.js'; // was: n0w
import { getEventLabel } from '../features/autoplay.js'; // was: TL
import { executeCommand } from './ad-scheduling.js'; // was: xA
import { isInAdPlayback } from './dai-cue-range.js'; // was: WB
import { isCompressedDomainComposite } from '../media/audio-normalization.js'; // was: gA
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { positionMarkerOverlays } from '../ui/progress-bar-impl.js'; // was: UC
import { isCastInstalled } from '../modules/remote/mdx-client.js'; // was: yQ
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { isPlaybackStatusOk } from '../media/audio-normalization.js'; // was: AV
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { SLOT_MESSAGE_MARKER } from '../proto/messages-core.js'; // was: Ww
import { EXP_748402147 } from '../proto/messages-core.js'; // was: Hw
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { unwrapTrustedResourceUrl } from '../core/composition-helpers.js'; // was: x3
import { invokeUnaryRpc } from '../media/bitstream-reader.js'; // was: BG
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { registerAdTimelinePlayback } from './dai-cue-range.js'; // was: Rt
import { resetBufferPosition } from '../modules/caption/caption-internals.js'; // was: Er
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { Base64ProtobufParser } from '../media/bitstream-reader.js'; // was: ZA
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { LayoutIdExitedTrigger } from './ad-trigger-types.js'; // was: Lz
import { getEffectiveBandwidth } from '../media/quality-manager.js'; // was: Ib
import { VisibilityState } from '../features/shorts-player.js'; // was: oGv
import { INCOMPLETE_CHUNK } from '../modules/remote/cast-session.js'; // was: Cx
import { infoCircleIcon } from '../ui/svg-icons.js'; // was: B1
import { getRemoteModule } from '../player/caption-manager.js'; // was: w7
import { validateSlotTriggers } from './ad-scheduling.js'; // was: er
import { getRemainingInRange } from '../media/codec-helpers.js'; // was: RR
import { stepGenerator } from './ad-async.js'; // was: GH
import { getActiveValues } from './ad-prebuffer.js'; // was: uLx
import { fillChapterProgress } from '../ui/seek-bar-tail.js'; // was: Dl
import { StateFlag } from '../player/component-events.js'; // was: mV
import { resolveTrackingAuthHeaders } from './ad-click-tracking.js'; // was: MTw
import { validateUrl } from './ad-scheduling.js'; // was: D6
import { testUrlPattern } from './ad-scheduling.js'; // was: tI
import { isHttps } from '../data/idb-transactions.js'; // was: Gn
import { isYouTubeDomain } from '../data/idb-transactions.js'; // was: Pz
import { createSuccessResult } from '../core/misc-helpers.js'; // was: I2
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { isStandardDetailPage } from '../data/bandwidth-tracker.js'; // was: i4
import { miniplayerIcon } from '../ui/svg-icons.js'; // was: D1
import { FormatInfo } from '../media/codec-tables.js'; // was: OU
import { getVoiceBoostPreference } from './ad-async.js'; // was: VGK
import { getAudioQualitySetting } from './ad-async.js'; // was: Bnx
import { QUALITY_LABELS_DESCENDING } from '../media/codec-tables.js'; // was: ZF
import { formatDuration } from './ad-async.js'; // was: Pq
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { adMessageRenderer } from '../core/misc-helpers.js'; // was: rc
import { probeNetworkPath } from './ad-click-tracking.js'; // was: rt
import { computeBandwidthEstimate } from './ad-prebuffer.js'; // was: U6
import { getWebPlayerContextConfig, enqueueVideoByPlayerVars, getAvailableAudioTracks, getAudioTrack, getUserAudio51Preference, addUtcCueRange } from '../player/player-api.js';
import { isObject } from '../core/type-helpers.js';
import { isHdr, getPlaybackQuality, getPlayerSize } from '../player/time-tracking.js';
import { contains } from '../core/string-utils.js';
import { containsNode } from '../core/dom-utils.js';
import { CueRange } from '../ui/cue-range.js';
import { filter } from '../core/array-utils.js';
import { PlayerComponent } from '../player/component.js';
import { dispose } from './dai-cue-range.js';
import { getDomain } from '../core/url-utils.js';
import { registerTooltip } from '../ui/progress-bar-impl.js';
import { replaceTemplateVars } from '../core/string-utils.js';
import { decorateUrlWithSessionData } from '../data/gel-params.js';
import { safeOpenUrl } from '../data/gel-params.js';
// TODO: resolve g.h

// ===================================================================
// InnerTube context builder (continuation from prior gap)
// ===================================================================

/**
 * Build the full innertube request context from player config.
 * Adds click tracking, client screen, kids/unplugged info,
 * request metadata, user credentials, and active players.
 * (Lines 35091–35158 — continuation of a function started earlier)
 *
 * [was: (anonymous closure, end of buildInnerTubeContext)]
 *
 * @param {object} playerConfig [was: Q]
 * @param {object} context [was: W] - context being built
 * @param {object} embedConfig [was: c]
 * @returns {object} finalized context
 */
export function finalizeInnerTubeContext(playerConfig, context, embedConfig) {
  const embedUrl = embedConfig.w6; // was: m
  if (isEmbedded(embedConfig)) {
    if (embedUrl) {
      context.thirdParty = { ...context.thirdParty, embedUrl };
    }
    attachThirdPartyContext(context, playerConfig);
  }

  // Click tracking params
  const itct = playerConfig.S; // was: m
  if (itct) {
    context.clickTracking = { clickTrackingParams: itct };
  } else if (isEmbedded(playerConfig.G()) && getConfig("EVENT_ID")) {
    context.clickTracking = { clickTrackingParams: getConfig("EVENT_ID") };
  } else if (embedConfig.X("html5_log_missing_itct")) {
    const warning = new PlayerError("Missing ITCT in InnerTubeContext", {
      isAd: playerConfig.isAd(),
      zK2: embedConfig.getWebPlayerContextConfig()?.contextId,
    });
    reportErrorWithLevel(warning);
  }

  // Client screen detection
  const client = context.client || {};
  let clientScreen = "EMBED"; // was: K
  const pageType = getEventLabel(playerConfig); // was: T — TL = getPageType

  if (pageType === "leanback") {
    clientScreen = "WATCH";
  } else if (embedConfig.X("gvi_channel_client_screen") && pageType === "profilepage") {
    clientScreen = "CHANNEL";
  } else if (playerConfig.executeCommand) {
    clientScreen = "LIVE_MONITOR";
  } else if (pageType === "detailpage") {
    clientScreen = "WATCH_FULL_SCREEN";
  } else if (pageType === "adunit") {
    clientScreen = "ADUNIT";
  } else if (pageType === "sponsorshipsoffer") {
    clientScreen = "UNKNOWN";
  }
  client.clientScreen = clientScreen;

  // Kids / unplugged info
  if (playerConfig.kidsAppInfo) {
    client.kidsAppInfo = JSON.parse(playerConfig.kidsAppInfo);
  }
  if (playerConfig.ef && !playerConfig.kidsAppInfo) {
    client.kidsAppInfo = {
      contentSettings: { ageUpMode: HM7[playerConfig.ef] },
    };
  }
  if (playerConfig.pD) {
    client.unpluggedAppInfo = { enableFilterMode: true };
  }
  if (playerConfig.unpluggedFilterModeType && !playerConfig.pD) {
    client.unpluggedAppInfo = { filterModeType: NhR[playerConfig.unpluggedFilterModeType] };
  }
  if (playerConfig.isInAdPlayback) {
    client.unpluggedLocationInfo = playerConfig.isInAdPlayback;
  }
  context.client = client;

  // Request metadata
  const request = context.request || {};
  if (playerConfig.isCompressedDomainComposite) request.isPrefetch = true;
  if (playerConfig.mdxEnvironment) request.mdxEnvironment = playerConfig.mdxEnvironment;
  if (playerConfig.mdxControlMode) request.mdxControlMode = iMw[playerConfig.mdxControlMode];
  context.request = request;

  // User credentials
  const user = context.user || {};
  if (playerConfig.isSamsungSmartTV) {
    user.credentialTransferTokens = [{ token: playerConfig.isSamsungSmartTV, scope: "VIDEO" }];
  }
  if (playerConfig.Y0) {
    user.delegatePurchases = { oauthToken: playerConfig.Y0 };
    user.kidsParent = { oauthToken: playerConfig.Y0 };
  }
  if (embedConfig.getWebPlayerContextConfig()?.userContentRating) {
    user.serializedUserContentRating = embedConfig.getWebPlayerContextConfig().userContentRating;
  }
  context.user = user;

  // Active players
  if (playerConfig.contextParams) {
    context.activePlayers = [{ playerContextParams: playerConfig.contextParams }];
  }
  if (playerConfig.clientScreenNonce) {
    context.clientScreenNonce = playerConfig.clientScreenNonce;
  }
  return context;
}

// ===================================================================
// Extended innertube context (with experiments / TV info)
// ===================================================================

/**
 * Build extended innertube context with experiment IDs, TV app info, safety mode.
 * [was: g.Bt]
 *
 * @param {object} playerConfig
 * @returns {object} context
 */
export function buildExtendedInnerTubeContext(playerConfig) { // was: g.Bt
  const context = buildFullInnertubeContext(); // g.Oh = getBaseInnertubeContext
  const client = context.client || {};

  if (playerConfig.forcedExperiments) {
    const ids = playerConfig.forcedExperiments.split(",");
    client.experimentIds = ids.map(Number);
  }
  if (playerConfig.homeGroupInfo) client.homeGroupInfo = JSON.parse(playerConfig.homeGroupInfo);
  if (playerConfig.getPlayerType()) client.playerType = playerConfig.getPlayerType();
  if (playerConfig.W.ctheme) client.theme = playerConfig.W.ctheme;
  if (playerConfig.livingRoomAppMode) {
    client.tvAppInfo = { ...client.tvAppInfo, livingRoomAppMode: playerConfig.livingRoomAppMode };
  }
  if (playerConfig.X("html5_propagate_device_year") && playerConfig.deviceYear) {
    client.tvAppInfo = { ...client.tvAppInfo, deviceYear: playerConfig.deviceYear };
  }
  if (playerConfig.livingRoomPoTokenId) {
    client.tvAppInfo = { ...client.tvAppInfo, livingRoomPoTokenId: playerConfig.livingRoomPoTokenId };
  }
  context.client = client;

  const user = context.user || {};
  if (playerConfig.enableSafetyMode) {
    Object.assign(user, { enableSafetyMode: true });
  }
  if (!client.tvAppInfo?.usePageidAsHeader && playerConfig.pageId) {
    Object.assign(user, { onBehalfOfUser: playerConfig.pageId });
  }
  context.user = user;
  return context;
}

// ===================================================================
// Device capability detection
// ===================================================================

/**
 * Detect device capabilities (VP9 encoding, XHR support).
 * [was: Ic]
 *
 * @param {object} [capabilities]
 * @returns {{ supportsVp9Encoding: boolean, supportXhr: boolean }}
 */
export function detectCapabilities(capabilities) { // was: Ic
  const isWebView = !capabilities?.CD() && capabilities?.positionMarkerOverlays() && isSamsungSmartTV();
  return {
    supportsVp9Encoding: !(!capabilities?.isCastInstalled() || isWebView),
    supportXhr: em, // em = supportsXhr global
  };
}

// ===================================================================
// Attestation for playback
// ===================================================================

/**
 * Send a playback attestation request.
 * [was: SUW]
 *
 * @param {object} videoData
 * @param {object} networkClient
 * @returns {Promise<object>}
 */
export async function sendPlaybackAttestationRequest(videoData, networkClient) { // was: SUW
  const requestBody = {
    context: buildExtendedInnerTubeContext(videoData.G()),
    engagementType: "ENGAGEMENT_TYPE_PLAYBACK",
    ids: [{
      playbackId: {
        videoId: videoData.videoId,
        cpn: videoData.clientPlaybackNonce,
      },
    }],
  };
  const endpoint = buildInnertubeApiPath(ymX); // ymX = attestation endpoint key
  return await sendInnertubeRequest(networkClient, requestBody, endpoint);
}

/**
 * Optionally re-initialize BotGuard VM if the threshold has elapsed.
 * [was: FXx]
 *
 * @param {object} videoData
 * @param {object} experiments
 * @param {object} networkClient
 */
export function maybeReinitBotGuard(videoData, experiments, networkClient) { // was: FXx
  const threshold = getExperimentValue(experiments.experiments, "bg_vm_reinit_threshold");
  if (ol && (0, g.h)() - ol <= threshold) return; // ol = lastReinitTimestamp

  sendPlaybackAttestationRequest(videoData, networkClient).then(
    (response) => {
      if (response?.botguardData) initBotGuardFromExperiments(response.botguardData, experiments);
    },
    (err) => {
      if (!videoData.u0()) {
        const wrapped = UU(err); // UU = wrapNetworkError
        videoData.RetryTimer("attf", wrapped.details);
      }
    }
  );
}

// ===================================================================
// Player state/event bus helpers
// ===================================================================

/**
 * Publish an event on the internal (A) and external (O) buses.
 * [was: g.xt]
 *
 * @param {object} player
 * @param {string} event
 * @param {...*} args
 */
export function publishEvent(player, event, ...args) { // was: g.xt
  player.state.A.publish(event, ...args);
  player.state.O.publish(event, ...args);
}

/**
 * Register an internal API method.
 * [was: R]
 *
 * @param {object} apiHost
 * @param {string} name
 * @param {Function} handler
 */
export function registerInternalMethod(apiHost, name, handler) { // was: R
  apiHost.state.W[name] = (...args) => handler.apply(apiHost, args);
}

/**
 * Register a public (external) API method, also mapping it to the internal API.
 * [was: q3]
 *
 * @param {object} apiHost
 * @param {string} name
 * @param {Function} handler
 */
export function registerPublicMethod(apiHost, name, handler) { // was: q3
  if (!apiHost.state.W.hasOwnProperty(name)) registerInternalMethod(apiHost, name, handler);
  apiHost.state.K[name] = (...args) => handler.apply(apiHost, args);
  apiHost.state.J.add(name);
}

/**
 * Register a method only available when the player has leadership (`L` flag).
 * [was: n8]
 *
 * @param {object} apiHost
 * @param {string} name
 * @param {Function} handler
 */
export function registerLeaderMethod(apiHost, name, handler) { // was: n8
  if (!apiHost.state.W.hasOwnProperty(name)) registerInternalMethod(apiHost, name, handler);
  if (apiHost.app.G().L) {
    apiHost.state.D[name] = (...args) => handler.apply(apiHost, args);
    apiHost.state.J.add(name);
  }
}

/**
 * Invoke an internal API method by name.
 * [was: g.Dr]
 *
 * @param {object} player
 * @param {string} name
 * @param {Array} args
 * @returns {*}
 */
export function callInternalMethod(player, name, args) { // was: g.Dr
  return player.state.W[name](...args);
}

/**
 * Publish on internal, external, and transport buses.
 * [was: g.tV]
 *
 * @param {object} player
 * @param {string} event
 * @param {...*} args
 */
export function publishEventWithTransport(player, event, ...args) { // was: g.tV
  player.state.A.publish(event, ...args);
  player.state.O.publish(event, ...args);
  player.state.j.publish(event, ...args);
}

/**
 * Publish on all four buses (internal, external, transport, leader).
 * [was: g.Ht]
 *
 * @param {object} player
 * @param {string} event
 * @param {...*} args
 */
export function publishEventAll(player, event, ...args) { // was: g.Ht
  player.state.A.publish(event, ...args);
  player.state.O.publish(event, ...args);
  player.state.j.publish(event, ...args);
  player.state.L.publish(event, ...args);
}

// ===================================================================
// Video / playlist parameter normalization
// ===================================================================

/**
 * Normalize a `mediaContentUrl` into a video-by-URL config.
 * [was: ZMn]
 *
 * @param {string|object} input
 * @param {number} [startSeconds]
 * @param {string} [suggestedQuality]
 * @returns {object}
 */
export function normalizeMediaContentUrl(input, startSeconds, suggestedQuality) { // was: ZMn
  if (typeof input === "string") {
    input = { mediaContentUrl: input, startSeconds, suggestedQuality };
  }
  const match = /\/([ve]|embed)\/([^#?]+)/.exec(input.mediaContentUrl || "");
  input.videoId = match?.[2] ?? null;
  return normalizeVideoParams(input);
}

/**
 * Normalize video parameters, extracting known keys.
 * [was: N3]
 *
 * @param {string|object} input
 * @param {number} [startSeconds]
 * @param {string} [suggestedQuality]
 * @returns {object}
 */
export function normalizeVideoParams(input, startSeconds, suggestedQuality) { // was: N3
  if (typeof input === "string") {
    return { videoId: input, startSeconds, suggestedQuality };
  }
  const params = {};
  for (const key of Ei3) { // Ei3 = known video param keys
    if (input[key]) params[key] = input[key];
  }
  const embedCfg = input.embedConfig || input.embed_config;
  if (embedCfg) params.embed_config = serializeEmbedConfig(embedCfg);
  return params;
}

/**
 * Normalize playlist parameters.
 * [was: dl3]
 *
 * @param {string|object} input
 * @param {number} [index]
 * @param {number} [startSeconds]
 * @param {string} [suggestedQuality]
 * @returns {object}
 */
export function normalizePlaylistParams(input, index, startSeconds, suggestedQuality) { // was: dl3
  if (isObject(input) && !Array.isArray(input)) {
    const keys = "playlist list listType index startSeconds suggestedQuality".split(" ");
    const result = {};
    for (const key of keys) {
      if (input[key]) result[key] = input[key];
    }
    return result;
  }
  const params = { index, startSeconds, suggestedQuality };
  if (typeof input === "string" && input.length === 16) {
    params.list = "PL" + input;
  } else {
    params.playlist = input;
  }
  return params;
}

/**
 * Serialize an embed config to JSON string.
 * [was: sRd]
 *
 * @param {string|object} config
 * @returns {string|undefined}
 */
export function serializeEmbedConfig(config) { // was: sRd
  if (typeof config === "string") return config;
  if (isObject(config)) {
    try {
      return JSON.stringify(config);
    } catch (err) {
      console.error("Invalid embedConfig JSON", err);
    }
  }
}

// ===================================================================
// Video data extraction for external API
// ===================================================================

/**
 * Get a sanitized video data object for the external API.
 * [was: LX0]
 *
 * @param {object} apiHost
 * @param {number} [playerType=1]
 * @returns {object}
 */
export function getExternalVideoData(apiHost, playerType = 1) { // was: LX0
  const result = {};
  const videoData = apiHost.app.uX({ playerType }).getVideoData();
  if (VS(videoData)) return {}; // VS = isVideoDataEmpty

  result.video_id = videoData.videoId;
  result.author = videoData.author;
  result.title = videoData.title;
  result.isPlayable = isPlaybackStatusOk(videoData); // AV = isPlayable
  result.NetworkErrorCode = videoData.NetworkErrorCode;

  if (videoData.O?.video) {
    result.video_quality = videoData.O.video.quality;
    const features = [];
    if (videoData.O.video.O()) features.push("hfr");
    if (videoData.O.video.isHdr()) features.push("hdr");
    if (videoData.O.video.primaries === "bt2020") features.push("wcg");
    result.video_quality_features = features;
  }

  const playlistId = apiHost.getPlaylistId();
  if (playlistId) result.list = playlistId;
  return result;
}

// ===================================================================
// Public API registration (YouTube IFrame API)
// ===================================================================

/**
 * Register all public YouTube IFrame API methods.
 * [was: wTw]
 *
 * @param {object} apiHost
 */
export function registerPublicApi(apiHost) { // was: wTw
  registerPublicMethod(apiHost, "cueVideoById", apiHost.S);
  registerPublicMethod(apiHost, "loadVideoById", apiHost.applyQualityConstraint);
  registerPublicMethod(apiHost, "cueVideoByUrl", apiHost.T2);
  registerPublicMethod(apiHost, "loadVideoByUrl", apiHost.SLOT_MESSAGE_MARKER);
  registerPublicMethod(apiHost, "playVideo", apiHost.EXP_748402147);
  registerPublicMethod(apiHost, "pauseVideo", apiHost.pauseVideo);
  registerPublicMethod(apiHost, "stopVideo", apiHost.xi);
  registerPublicMethod(apiHost, "clearVideo", apiHost.clearVideo);
  registerPublicMethod(apiHost, "getVideoBytesLoaded", apiHost.isInAdPlayback);
  registerPublicMethod(apiHost, "getVideoBytesTotal", apiHost.readRepeatedMessageField);
  registerPublicMethod(apiHost, "getVideoLoadedFraction", apiHost.j);
  registerPublicMethod(apiHost, "getVideoStartBytes", apiHost.MQ);
  registerPublicMethod(apiHost, "cuePlaylist", apiHost.cuePlaylist);
  registerPublicMethod(apiHost, "loadPlaylist", apiHost.isTvHtml5Exact);
  registerPublicMethod(apiHost, "nextVideo", apiHost.u3);
  registerPublicMethod(apiHost, "previousVideo", apiHost.w6);
  registerPublicMethod(apiHost, "playVideoAt", apiHost.isCompressedDomainComposite);
  registerPublicMethod(apiHost, "setShuffle", apiHost.setShuffle);
  registerPublicMethod(apiHost, "setLoop", apiHost.setLoop);
  registerPublicMethod(apiHost, "getPlaylist", apiHost.Fw);
  registerPublicMethod(apiHost, "getPlaylistIndex", apiHost.getPlaylistIndex);
  registerPublicMethod(apiHost, "getPlaylistId", apiHost.getPlaylistId);
  registerPublicMethod(apiHost, "loadModule", apiHost.D);
  registerPublicMethod(apiHost, "unloadModule", apiHost.J);
  registerPublicMethod(apiHost, "setOption", apiHost.O);
  registerPublicMethod(apiHost, "getOption", apiHost.La);
  registerPublicMethod(apiHost, "getOptions", apiHost.W);
  registerPublicMethod(apiHost, "mute", apiHost.mainVideoEntityActionMetadataKey);
  registerPublicMethod(apiHost, "unMute", apiHost.yf);
  registerPublicMethod(apiHost, "isMuted", apiHost.isMuted);
  registerPublicMethod(apiHost, "setVolume", apiHost.unwrapTrustedResourceUrl);
  registerPublicMethod(apiHost, "getVolume", apiHost.getVolume);
  registerPublicMethod(apiHost, "seekTo", apiHost.invokeUnaryRpc);
  registerPublicMethod(apiHost, "getPlayerMode", apiHost.getPlayerMode);
  registerPublicMethod(apiHost, "getPlayerState", apiHost.toggleFineScrub);
  registerPublicMethod(apiHost, "getAvailablePlaybackRates", apiHost.getAvailablePlaybackRates);
  registerPublicMethod(apiHost, "getPlaybackQuality", () => apiHost.getPlaybackQuality(1));
  registerPublicMethod(apiHost, "setPlaybackQuality", apiHost.vj);
  registerPublicMethod(apiHost, "getAvailableQualityLevels", apiHost.Ka);
  registerPublicMethod(apiHost, "getCurrentTime", apiHost.PA);
  registerPublicMethod(apiHost, "getDuration", apiHost.XI);
  registerPublicMethod(apiHost, "addEventListener", apiHost.mF);
  registerPublicMethod(apiHost, "removeEventListener", apiHost.U7);
  registerPublicMethod(apiHost, "getDebugText", apiHost.UH);
  registerPublicMethod(apiHost, "getVideoData", () => getExternalVideoData(apiHost));
  registerPublicMethod(apiHost, "addCueRange", apiHost.L);
  registerPublicMethod(apiHost, "removeCueRange", apiHost.removeCueRange);
  registerPublicMethod(apiHost, "setSize", apiHost.setSize);
  registerPublicMethod(apiHost, "getApiInterface", apiHost.getApiInterface);
  registerPublicMethod(apiHost, "destroy", apiHost.destroy);
  registerPublicMethod(apiHost, "mutedAutoplay", apiHost.mutedAutoplay);

  const config = apiHost.app.G();
  if (!config.D) {
    registerPublicMethod(apiHost, "getVideoEmbedCode", apiHost.getVideoEmbedCode);
    registerPublicMethod(apiHost, "getVideoUrl", apiHost.skipNextIcon);
  }
  registerPublicMethod(apiHost, "getMediaReferenceTime", apiHost.JJ);
  registerPublicMethod(apiHost, "getSize", apiHost.getSize);
  registerPublicMethod(apiHost, "setFauxFullscreen", apiHost.tQ);
  if (config.X("embeds_enable_move_set_center_crop_to_public")) {
    registerPublicMethod(apiHost, "setCenterCrop", apiHost.setCenterCrop);
  }
  if (!config.D) registerPublicMethod(apiHost, "logImaAdEvent", apiHost.logImaAdEvent);
  registerPublicMethod(apiHost, "preloadVideoById", apiHost.dA);
  registerPublicMethod(apiHost, "wakeUpControls", apiHost.wakeUpControls);
}

// ===================================================================
// Internal API registration
// ===================================================================

/**
 * Register all internal (trusted) API methods.
 * [was: $ln]
 *
 * @param {object} apiHost
 */
export function registerInternalApi(apiHost) { // was: $ln
  registerInternalMethod(apiHost, "getInternalApiInterface", apiHost.getInternalApiInterface);
  registerInternalMethod(apiHost, "getTrustedApi", apiHost.getTrustedApi);
  registerInternalMethod(apiHost, "addEventListener", apiHost.Y);
  registerInternalMethod(apiHost, "removeEventListener", apiHost.AA);
  registerInternalMethod(apiHost, "cueVideoByPlayerVars", apiHost.isSamsungSmartTV);
  registerInternalMethod(apiHost, "loadVideoByPlayerVars", apiHost.nO);
  registerInternalMethod(apiHost, "preloadVideoByPlayerVars", apiHost.registerAdTimelinePlayback);
  registerInternalMethod(apiHost, "getAdState", apiHost.getAdState);
  registerInternalMethod(apiHost, "sendAbandonmentPing", apiHost.sendAbandonmentPing);
  registerInternalMethod(apiHost, "setLoopRange", apiHost.setLoopRange);
  registerInternalMethod(apiHost, "getLoopRange", apiHost.getLoopRange);
  registerInternalMethod(apiHost, "setAutonavState", apiHost.setAutonavState);
  registerInternalMethod(apiHost, "seekTo", apiHost.qY);
  registerInternalMethod(apiHost, "seekBy", apiHost.FO);
  registerInternalMethod(apiHost, "seekToLiveHead", apiHost.seekToLiveHead);
  registerInternalMethod(apiHost, "requestSeekToWallTimeSeconds", apiHost.requestSeekToWallTimeSeconds);
  registerInternalMethod(apiHost, "seekToStreamTime", apiHost.seekToStreamTime);
  registerInternalMethod(apiHost, "prefetchKeyPlay", apiHost.prefetchKeyPlay);
  registerInternalMethod(apiHost, "prefetchJumpAhead", apiHost.prefetchJumpAhead);
  registerInternalMethod(apiHost, "startSeekCsiAction", apiHost.startSeekCsiAction);
  registerInternalMethod(apiHost, "getStreamTimeOffset", apiHost.getStreamTimeOffset);
  registerInternalMethod(apiHost, "isOrchestrationLeader", apiHost.isOrchestrationLeader);
  registerInternalMethod(apiHost, "getVideoData", apiHost.sC);
  registerInternalMethod(apiHost, "setInlinePreview", apiHost.setInlinePreview);
  registerInternalMethod(apiHost, "getAppState", apiHost.getAppState);
  registerInternalMethod(apiHost, "updateLastActiveTime", apiHost.updateLastActiveTime);
  registerInternalMethod(apiHost, "setBlackout", apiHost.setBlackout);
  registerInternalMethod(apiHost, "setUserEngagement", apiHost.setUserEngagement);
  registerInternalMethod(apiHost, "updateSubtitlesUserSettings", apiHost.updateSubtitlesUserSettings);
  registerInternalMethod(apiHost, "getPresentingPlayerType", apiHost.A);
  registerInternalMethod(apiHost, "canPlayType", apiHost.canPlayType);
  registerInternalMethod(apiHost, "updatePlaylist", apiHost.updatePlaylist);
  registerInternalMethod(apiHost, "updateVideoData", apiHost.updateVideoData);
  registerInternalMethod(apiHost, "updateEnvironmentData", apiHost.updateEnvironmentData);
  registerInternalMethod(apiHost, "sendVideoStatsEngageEvent", apiHost.resetBufferPosition);
  registerInternalMethod(apiHost, "productsInVideoVisibilityUpdated", apiHost.productsInVideoVisibilityUpdated);
  registerInternalMethod(apiHost, "setSafetyMode", apiHost.setSafetyMode);
  registerInternalMethod(apiHost, "isAtLiveHead", (c) => apiHost.isAtLiveHead(undefined, c));
  registerInternalMethod(apiHost, "getVideoAspectRatio", apiHost.getVideoAspectRatio);
  registerInternalMethod(apiHost, "getPreferredQuality", apiHost.getPreferredQuality);
  registerInternalMethod(apiHost, "getPlaybackQualityLabel", apiHost.getPlaybackQualityLabel);
  registerInternalMethod(apiHost, "setPlaybackQualityRange", apiHost.YR);
  registerInternalMethod(apiHost, "onAdUxClicked", apiHost.onAdUxClicked);
  registerInternalMethod(apiHost, "getFeedbackProductData", apiHost.getFeedbackProductData);
  registerInternalMethod(apiHost, "getStoryboardFrame", apiHost.getStoryboardFrame);
  registerInternalMethod(apiHost, "getStoryboardFrameIndex", apiHost.getStoryboardFrameIndex);
  registerInternalMethod(apiHost, "getStoryboardLevel", apiHost.getStoryboardLevel);
  registerInternalMethod(apiHost, "getNumberOfStoryboardLevels", apiHost.getNumberOfStoryboardLevels);
  registerInternalMethod(apiHost, "getCaptionWindowContainerId", apiHost.getCaptionWindowContainerId);
  registerInternalMethod(apiHost, "getAvailableQualityLabels", apiHost.getAvailableQualityLabels);
  registerInternalMethod(apiHost, "addCueRange", apiHost.addCueRange);
  registerInternalMethod(apiHost, "addUtcCueRange", apiHost.addUtcCueRange);
  registerInternalMethod(apiHost, "showAirplayPicker", apiHost.showAirplayPicker);
  registerInternalMethod(apiHost, "dispatchReduxAction", apiHost.dispatchReduxAction);
  registerInternalMethod(apiHost, "getPlayerResponse", apiHost.Y0);
  registerInternalMethod(apiHost, "getWatchNextResponse", apiHost.Xw);
  registerInternalMethod(apiHost, "getHeartbeatResponse", apiHost.parseHexColor);
  registerInternalMethod(apiHost, "getCurrentTime", apiHost.jG);
  registerInternalMethod(apiHost, "getDuration", apiHost.Base64ProtobufParser);
  registerInternalMethod(apiHost, "getPlayerState", apiHost.getPlayerState);
  registerInternalMethod(apiHost, "getPlayerStateObject", apiHost.instreamAdPlayerOverlayRenderer);
  registerInternalMethod(apiHost, "getVideoLoadedFraction", apiHost.getVideoLoadedFraction);
  registerInternalMethod(apiHost, "getProgressState", apiHost.getProgressState);
  registerInternalMethod(apiHost, "getVolume", apiHost.getVolume);
  registerInternalMethod(apiHost, "setVolume", apiHost.LayoutIdExitedTrigger);
  registerInternalMethod(apiHost, "isMuted", apiHost.isMuted);
  registerInternalMethod(apiHost, "mute", apiHost.bO);
  registerInternalMethod(apiHost, "unMute", apiHost.getEffectiveBandwidth);
  registerInternalMethod(apiHost, "loadModule", apiHost.loadModule);
  registerInternalMethod(apiHost, "unloadModule", apiHost.unloadModule);
  registerInternalMethod(apiHost, "getOption", apiHost.N0);
  registerInternalMethod(apiHost, "getOptions", apiHost.getOptions);
  registerInternalMethod(apiHost, "setOption", apiHost.setOption);
  registerInternalMethod(apiHost, "loadVideoById", apiHost.tV);
  registerInternalMethod(apiHost, "loadVideoByUrl", apiHost.T6);
  registerInternalMethod(apiHost, "playVideo", apiHost.X4);
  registerInternalMethod(apiHost, "loadPlaylist", apiHost.loadPlaylist);
  registerInternalMethod(apiHost, "nextVideo", apiHost.nextVideo);
  registerInternalMethod(apiHost, "previousVideo", apiHost.previousVideo);
  registerInternalMethod(apiHost, "playVideoAt", apiHost.playVideoAt);
  registerInternalMethod(apiHost, "getDebugText", apiHost.getDebugText);
  registerInternalMethod(apiHost, "getWebPlayerContextConfig", apiHost.getWebPlayerContextConfig);
  registerInternalMethod(apiHost, "notifyShortsAdSwipeEvent", apiHost.notifyShortsAdSwipeEvent);
  registerInternalMethod(apiHost, "getVideoContentRect", apiHost.getVideoContentRect);
  registerInternalMethod(apiHost, "setSqueezeback", apiHost.setSqueezeback);
  registerInternalMethod(apiHost, "toggleSubtitlesOn", apiHost.toggleSubtitlesOn);
  registerInternalMethod(apiHost, "isSubtitlesOn", apiHost.isSubtitlesOn);
  registerInternalMethod(apiHost, "getAudioTrack", apiHost.Ie);
  registerInternalMethod(apiHost, "setAudioTrack", apiHost.rX);
  registerInternalMethod(apiHost, "getAvailableAudioTracks", apiHost.MM);
  registerInternalMethod(apiHost, "reportPlaybackIssue", apiHost.reportPlaybackIssue);
  registerInternalMethod(apiHost, "setAutonav", apiHost.setAutonav);
  registerInternalMethod(apiHost, "isNotServable", apiHost.isNotServable);
  registerInternalMethod(apiHost, "channelSubscribed", apiHost.channelSubscribed);
  registerInternalMethod(apiHost, "channelUnsubscribed", apiHost.channelUnsubscribed);
  registerInternalMethod(apiHost, "togglePictureInPicture", apiHost.togglePictureInPicture);
  registerInternalMethod(apiHost, "supportsGaplessAudio", apiHost.supportsGaplessAudio);
  registerInternalMethod(apiHost, "supportsGaplessShorts", apiHost.supportsGaplessShorts);
  registerInternalMethod(apiHost, "isGaplessTransitionReady", apiHost.isGaplessTransitionReady);
  registerInternalMethod(apiHost, "enqueueVideoByPlayerVars", (c) => void apiHost.enqueueVideoByPlayerVars(c));
  registerInternalMethod(apiHost, "clearQueue", apiHost.clearQueue);
  registerInternalMethod(apiHost, "getMaxPlaybackQuality", apiHost.getMaxPlaybackQuality);
  registerInternalMethod(apiHost, "getUserPlaybackQualityPreference", apiHost.getUserPlaybackQualityPreference);
  registerInternalMethod(apiHost, "getSubtitlesUserSettings", apiHost.getSubtitlesUserSettings);
  registerInternalMethod(apiHost, "resetSubtitlesUserSettings", apiHost.resetSubtitlesUserSettings);
  registerInternalMethod(apiHost, "setMinimized", apiHost.setMinimized);
  registerInternalMethod(apiHost, "setOverlayVisibility", apiHost.setOverlayVisibility);
  registerInternalMethod(apiHost, "confirmYpcRental", apiHost.confirmYpcRental);
  registerInternalMethod(apiHost, "queueNextVideo", apiHost.queueNextVideo);
  registerInternalMethod(apiHost, "handleExternalCall", apiHost.handleExternalCall);
  registerInternalMethod(apiHost, "logApiCall", apiHost.logApiCall);
  registerInternalMethod(apiHost, "isExternalMethodAvailable", apiHost.isExternalMethodAvailable);
  registerInternalMethod(apiHost, "setScreenLayer", apiHost.setScreenLayer);
  registerInternalMethod(apiHost, "getCurrentPlaylistSequence", apiHost.getCurrentPlaylistSequence);
  registerInternalMethod(apiHost, "getPlaylistSequenceForTime", apiHost.getPlaylistSequenceForTime);
  registerInternalMethod(apiHost, "shouldSendVisibilityState", apiHost.shouldSendVisibilityState);
  registerInternalMethod(apiHost, "syncVolume", apiHost.syncVolume);
  registerInternalMethod(apiHost, "highlightSettingsMenuItem", apiHost.highlightSettingsMenuItem);
  registerInternalMethod(apiHost, "openSettingsMenuItem", apiHost.openSettingsMenuItem);
  registerInternalMethod(apiHost, "getEmbeddedPlayerResponse", apiHost.getEmbeddedPlayerResponse);
  registerInternalMethod(apiHost, "getVisibilityState", apiHost.getVisibilityState);
  registerInternalMethod(apiHost, "isMutedByMutedAutoplay", apiHost.isMutedByMutedAutoplay);
  registerInternalMethod(apiHost, "isMutedByEmbedsMutedAutoplay", apiHost.isMutedByEmbedsMutedAutoplay);
  registerInternalMethod(apiHost, "setGlobalCrop", apiHost.setGlobalCrop);
  registerInternalMethod(apiHost, "setInternalSize", apiHost.setInternalSize);
  registerInternalMethod(apiHost, "setFauxFullscreen", apiHost.setFauxFullscreen);
  registerInternalMethod(apiHost, "setAppFullscreen", apiHost.setAppFullscreen);
  registerInternalMethod(apiHost, "isKeyboardDisabled", apiHost.isKeyboardDisabled);
}

// ===================================================================
// Player UI helpers
// ===================================================================

/**
 * Listen for an event on the player root element, with optional auto-dispose.
 * [was: EP]
 *
 * @param {object} component
 * @param {string} event
 * @param {object} [disposeWith]
 * @returns {Function|null} unlisten handle
 */
export function listenOnPlayerRoot(component, event, disposeWith) { // was: EP
  const handle = registerTooltip(component.d6(), event);
  if (disposeWith) {
    disposeWith.addOnDisposeCallback(handle);
    return null;
  }
  return handle;
}

/**
 * Format a tooltip string with an optional keyboard shortcut.
 * [was: g.sP]
 *
 * @param {object} apiHost
 * @param {string} description
 * @param {string} shortcut
 * @returns {string}
 */
export function formatTooltip(apiHost, description, shortcut) { // was: g.sP
  return apiHost.app.G().Fw
    ? description
    : replaceTemplateVars("$DESCRIPTION ($SHORTCUT)", { DESCRIPTION: description, SHORTCUT: shortcut });
}

/**
 * Set the player root element to `aria-live="polite"`.
 * [was: PoK]
 *
 * @param {object} component
 */
export function setAriaLivePolite(component) { // was: PoK
  component.d6().element.setAttribute("aria-live", "polite");
}

// ===================================================================
// Player navigation / state queries
// ===================================================================

/**
 * Cancel autonav (auto-play next). Handles MDX (remote playback) separately.
 * [was: g.d7]
 *
 * @param {object} player
 * @param {*} reason
 */
export function cancelAutonav(player, reason) { // was: g.d7
  if (player.getPresentingPlayerType() === 3) {
    player.publish("mdxautoplaycancel");
  } else {
    publishEvent(player, "onAutonavCancelled", reason);
  }
}

/**
 * Check if the endscreen or post-roll overlay is active.
 * [was: g.L8]
 *
 * @param {object} player
 * @returns {boolean}
 */
export function isEndscreenActive(player) { // was: g.L8
  const container = player.CO();
  const endscreen = container.INCOMPLETE_CHUNK.get("endscreen");
  return (endscreen && endscreen.infoCircleIcon()) ? true : container.kh();
}

/**
 * Check if the player has a playlist (or is in MDX mode with prev/next).
 * [was: g.bp]
 *
 * @param {object} player
 * @returns {boolean}
 */
export function hasPlaylist(player) { // was: g.bp
  const playlist = getRemoteModule(player.CO()); // w7 = getPlaylistManager
  return (
    player.app.JI && !player.isFullscreen() ||
    (player.getPresentingPlayerType() === 3 && playlist && playlist.hasNext() && playlist.hasPrevious()) ||
    !!player.getPlaylist()
  );
}

// ===================================================================
// Player data / format helpers
// ===================================================================

/**
 * Add embeds conversion tracking params to the player context.
 * [was: g.jo]
 *
 * @param {object} player
 * @param {object} params
 */
export function addEmbedsConversionParams(player, params) { // was: g.jo
  callInternalMethod(player, "addEmbedsConversionTrackingParams", [params]);
}

/**
 * Get playback metrics from the media element.
 * [was: g.OP]
 *
 * @param {object} player
 * @returns {object}
 */
export function getPlaybackMetrics(player) { // was: g.OP
  const mediaEl = getWebglModule(player.CO()); // g.g7 = getMediaElement
  return mediaEl ? mediaEl.Bm() : {};
}

/**
 * Check if the current video data has both audio and video tracks (non-HLS).
 * [was: g.lFn]
 *
 * @param {object} player
 * @returns {boolean}
 */
export function hasDashAudioAndVideo(player) { // was: g.lFn
  const format = player.getVideoData()?.O;
  return !!format && !(!format.audio || !format.video) && format.mimeType !== "application/x-mpegURL";
}

/**
 * Insert a child element into the player container at the correct layer.
 * [was: g.f8]
 *
 * @param {object} player
 * @param {Element} element
 * @param {number} layerIndex
 */
export function insertAtLayer(player, element, layerIndex) { // was: g.f8
  const container = player.bX().element;
  let insertIdx = N9(container.children, (child) => {
    const childLayer = Number(child.getAttribute("data-layer"));
    return layerIndex - childLayer || 1;
  });
  if (insertIdx < 0) insertIdx = -(insertIdx + 1);
  Sz(container, element, insertIdx); // Sz = insertChildAt
  element.setAttribute("data-layer", String(layerIndex));
}

// ===================================================================
// Autoplay eligibility
// ===================================================================

/**
 * Check if the current video is eligible for the autoplay feature.
 * [was: g.vt]
 *
 * @param {object} player
 * @returns {boolean}
 */
export function isAutoplayEligible(player) { // was: g.vt
  const config = player.G();
  if (!config.mainVideoEntityActionMetadataKey) return false;

  const videoData = player.getVideoData();
  if (!videoData || player.getPresentingPlayerType() === 3) return false;

  let isLiveBlocked = (!videoData.isLiveDefaultBroadcast || config.X("allow_poltergust_autoplay")) && !videoData.Ie();
  isLiveBlocked = videoData.isLivePlayback && (!config.X("allow_live_autoplay") || !isLiveBlocked);

  const allowLiveMweb = videoData.isLivePlayback && config.X("allow_live_autoplay_on_mweb");
  const hasNextInPlaylist = player.getPlaylist()?.hasNext() ?? false;

  let hasOverlayAutoplay = videoData.T2?.playerOverlays || null;
  hasOverlayAutoplay = !!(hasOverlayAutoplay?.playerOverlayRenderer?.autoplay);
  hasOverlayAutoplay = videoData.validateSlotTriggers && hasOverlayAutoplay;

  return (
    !videoData.ypcPreview &&
    (!isLiveBlocked || allowLiveMweb) &&
    !contains(videoData.getRemainingInRange, "ypc") &&
    !hasNextInPlaylist &&
    (!isEmbedWithAudio(config) || hasOverlayAutoplay)
  );
}

// ===================================================================
// Audio track helpers
// ===================================================================

/**
 * Set the audio track across all media sources by language ID.
 * [was: hdR]
 *
 * @param {object} player
 * @param {string} languageId
 */
export function setAudioTrackByLanguage(player, languageId) { // was: hdR
  const sources = getActiveValues(player.app.stepGenerator().D); // uLx = getMediaSources
  for (const source of sources) {
    const tracks = source.getAvailableAudioTracks();
    let match = null;
    for (const track of tracks) {
      if (track.getLanguageInfo().getId() === languageId) {
        match = track;
        break;
      }
    }
    if (match) source.s2(match, true); // s2 = setAudioTrack
  }
}

// ===================================================================
// Network / auth helpers
// ===================================================================

/**
 * Get or create the singleton network request helper.
 * [was: GL]
 *
 * @returns {zdd}
 */
export function getNetworkHelper() { // was: GL
  if (!aZ) aZ = new zdd(); // zdd = NetworkRequestHelper
  return aZ;
}

/**
 * Set or remove the Authorization header on a request object.
 * [was: $t]
 *
 * @param {object} requestConfig
 * @param {string|undefined} token
 */
export function setAuthorizationHeader(requestConfig, token) { // was: $t
  if (token) {
    requestConfig.requestHeaders.Authorization = `Bearer ${token}`;
  } else {
    delete requestConfig.requestHeaders.Authorization;
  }
}

/**
 * Get the document or shadow root for PiP awareness.
 * [was: Pt]
 *
 * @param {object} playerConfig
 * @returns {Document|ShadowRoot}
 */
export function getPipAwareDocument(playerConfig) { // was: Pt
  const root = playerConfig.U.getRootNode();
  return (playerConfig.U.X("web_watch_pip") || playerConfig.U.X("web_shorts_pip"))
    ? isInAdPlayback(root)  // WB = getShadowRootDocument
    : document;
}

// ===================================================================
// Menu / popup helpers
// ===================================================================

/**
 * Close a popup menu, restoring focus to the source element.
 * [was: Coy]
 *
 * @param {object} popup
 */
export function closePopupMenu(popup) { // was: Coy
  if (popup.sourceElement) {
    if (document.activeElement && containsNode(popup.element, document.activeElement)) {
      popup.sourceElement.focus();
    }
    popup.sourceElement.setAttribute("aria-expanded", "false");
    popup.sourceElement = undefined;
  }
  popup.K.O(); // K.O = hide transition
  popup.D = undefined;
}

/**
 * Toggle a popup open or closed.
 * [was: lp]
 *
 * @param {object} popup
 * @param {*} anchor
 * @param {*} options
 */
export function togglePopup(popup, anchor, options) { // was: lp
  if (popup.fillChapterProgress()) { // Dl = isOpen
    popup.HB(); // HB = close
  } else {
    popup.Bw(anchor, options); // Bw = open
  }
}

// ===================================================================
// Menu item template
// ===================================================================

/**
 * Build a menu-item element descriptor.
 * [was: g.up]
 *
 * @param {object} [attrs={}]
 * @param {string[]} [classes=[]]
 * @param {boolean} [isLink=false]
 * @param {boolean} [hasSecondaryIcon=false]
 * @returns {object}
 */
export function buildMenuItemDescriptor(attrs = {}, classes = [], isLink = false, hasSecondaryIcon = false) { // was: g.up
  classes.push("ytp-menuitem");
  if (!("role" in attrs)) attrs.role = "menuitem";
  if (!isLink && !("tabindex" in attrs)) attrs.tabindex = "0";

  const descriptor = {
    C: isLink ? "a" : "div",
    yC: classes,
    N: attrs,
    V: [
      { C: "div", Z: "ytp-menuitem-icon", eG: "{{icon}}" },
      { C: "div", Z: "ytp-menuitem-label", eG: "{{label}}" },
      { C: "div", Z: "ytp-menuitem-content", eG: "{{content}}" },
    ],
  };

  if (hasSecondaryIcon) {
    descriptor.V.push({ C: "div", Z: "ytp-menuitem-secondary-icon", eG: "{{secondaryIcon}}" });
  }
  return descriptor;
}

/**
 * Update the label text of a menu item.
 * [was: g.hV]
 *
 * @param {object} menuItem
 * @param {string} label
 */
export function setMenuItemLabel(menuItem, label) { // was: g.hV
  menuItem.updateValue("label", label);
}

/**
 * Convert an SVG element to markup string, or empty string if falsy.
 * [was: zL]
 *
 * @param {*} svg
 * @returns {string}
 */
export function svgToString(svg) { // was: zL
  return svg ? logQoeEvent(svg) : ""; // g.rK = renderSvgToString
}

// ===================================================================
// QOE / stats ping helpers
// ===================================================================

/**
 * Register a video stats annotation ping.
 * [was: M3]
 *
 * @param {object} pings
 * @param {string} id
 * @param {string} url
 * @param {object} headers
 */
export function registerStatsPing(pings, id, url, headers) { // was: M3
  if (id in pings.W) return;
  const ping = new CueRange(url, headers, { id, priority: 2, namespace: "appad" });
  pings.api.StateFlag([ping], 1);
  pings.W[id] = ping;
}

/**
 * Fire a single tracking URL with optional auth headers.
 * [was: JV]
 *
 * @param {object} pings
 * @param {string} url
 */
export function fireTrackingUrl(pings, url) { // was: JV
  resolveTrackingAuthHeaders(pings, url).then((headers) => {
    sendPing(url, undefined, undefined, headers); // g.GU = sendBeacon
  });
}

/**
 * Fire multiple tracking URLs.
 * [was: RZ]
 *
 * @param {object} pings
 * @param {string[]} urls
 */
export function fireTrackingUrls(pings, urls) { // was: RZ
  urls.forEach((url) => fireTrackingUrl(pings, url));
}

/**
 * Fire tracking URLs found under a named key in an object, with macro expansion.
 * [was: YUn]
 *
 * @param {object} pings
 * @param {object} data
 * @param {string} key
 * @returns {boolean} whether URLs were found
 */
export function fireNamedTrackingUrls(pings, data, key) { // was: YUn
  if (!(key in data)) return false;
  let urls = data[key];
  if (!Array.isArray(urls)) urls = [urls];

  for (const url of urls) {
    const expanded = expandUrlTemplate(url, { CPN: pings.api.getVideoData().clientPlaybackNonce }); // g.lZ = expandMacros
    sendPing(
      expanded,
      undefined,
      validateUrl(testUrlPattern(expanded, Jmw), expanded, false, "Active View 3rd Party Integration URL") ||
        validateUrl(testUrlPattern(expanded, Rd7), expanded, false, "Google/YouTube Brand Lift URL") ||
        validateUrl(testUrlPattern(expanded, kb7), expanded, false, "Nielsen OCR URL")
    );
  }
  return true;
}

/**
 * Resolve auth headers for a tracking URL if needed.
 * [was: MTw]
 *
 * @param {object} pings
 * @param {string} url
 * @returns {Promise<object|undefined>}
 */
export function resolveTrackingAuthHeaders(pings, url) { // was: MTw
  if (isTvHtml5(pings.api.G()) && isYouTubeDomain(url) && isHttps(url)) {
    return resolveOAuthToken(pings.api.G(), pings.api.getVideoData().D()).then(
      (token) => {
        if (token) return { Authorization: `Bearer ${token}` };
      },
      undefined
    );
  }
  return createSuccessResult(); // I2 = Promise.resolve(undefined)
}

// ===================================================================
// Fullscreen / player mode helpers
// ===================================================================

/**
 * Check if the player should show top chrome (controls).
 * [was: pTK]
 *
 * @param {object} player
 * @returns {boolean}
 */
export function shouldShowTopChrome(player) { // was: pTK
  const notMiniplayer = !player.G().Q1 && player.getPresentingPlayerType() !== 3;
  return player.isFullscreen() || notMiniplayer;
}

// ===================================================================
// Click / link handlers
// ===================================================================

/**
 * Handle an ad click that should pause the video and open a link.
 * [was: g.kt]
 *
 * @param {Event} event
 * @param {object} player
 * @param {boolean} [skipPause=false]
 * @param {*} [target]
 * @returns {boolean}
 */
export function handleAdClick(event, player, skipPause = false, target) { // was: g.kt
  const createDatabaseDefinition = event.currentTarget;
  if (!skipPause && isPrimaryClick(event)) { // g.P1 = isPrimaryClick
    event.preventDefault();
    return true;
  }
  player.pauseVideo();
  const href = createDatabaseDefinition.getAttribute("href");
  decorateUrlWithSessionData(href, target, true);
  return false;
}

/**
 * Handle a click on an embeds link, toggling fullscreen if needed.
 * [was: g.Yt]
 *
 * @param {string} url
 * @param {object} player
 * @param {Event} event
 * @returns {boolean}
 */
export function handleEmbedsClick(url, player, event) { // was: g.Yt
  if (isStandardDetailPage(player.G()) && player.getPresentingPlayerType() !== 2) {
    if (isPrimaryClick(event)) {
      if (player.isFullscreen() && !player.G().externalFullscreen) {
        player.toggleFullscreen();
      }
      event.preventDefault();
      return true;
    }
  } else {
    const isPrimary = isPrimaryClick(event);
    if (isPrimary) player.pauseVideo();
    decorateUrlWithSessionData(url, undefined, true);
    if (isPrimary) {
      safeOpenUrl(url);
      event.preventDefault();
    }
  }
  return false;
}

// ===================================================================
// Audio track filtering predicates
// ===================================================================

/**
 * Filter audio tracks by matching language name.
 * [was: WBn]
 *
 * @param {Array} tracks
 * @param {object} player
 * @returns {Array}
 */
export function filterByAudioLanguage(tracks, player) { // was: WBn
  const currentTrack = player.getAudioTrack();
  return currentTrack.id !== "und"
    ? filter(tracks, (t) => t.miniplayerIcon?.name === currentTrack.getLanguageInfo().name)
    : tracks;
}

/**
 * Filter to 5.1 surround tracks if user preference is set.
 * [was: m5n]
 *
 * @param {Array} tracks
 * @param {object} player
 * @returns {Array}
 */
export function filterBySurroundPreference(tracks, player) { // was: m5n
  return player.getUserAudio51Preference() ? filter(tracks, isSurroundTrack) : tracks;
}

/**
 * Convert track objects to HLS-wrapped format.
 * [was: KB_]
 *
 * @param {Array} tracks
 * @returns {Array}
 */
export function wrapTracksAsHls(tracks) { // was: KB_
  return tracks.map(
    (t) => new FormatInfo(t.id, "application/x-mpegURL", { miniplayerIcon: t.miniplayerIcon })
  );
}

/**
 * Filter to DRC (Dynamic Range Compression) tracks if user pref is set.
 * [was: TQ_]
 *
 * @param {Array} tracks
 * @returns {Array}
 */
export function filterByDrcPreference(tracks) { // was: TQ_
  return storageGet("yt-player-drc-pref") ? filter(tracks, isDrcTrack) : tracks;
}

/**
 * Filter to spatial audio tracks if spatial audio mode is active.
 * [was: oTn]
 *
 * @param {Array} tracks
 * @returns {Array}
 */
export function filterBySpatialAudio(tracks) { // was: oTn
  return getVoiceBoostPreference() === 2 ? filter(tracks, isSpatialAudio) : tracks;
}

/**
 * Filter to high-quality non-surround tracks if HQ audio mode is active.
 * [was: rSK]
 *
 * @param {Array} tracks
 * @returns {Array}
 */
export function filterByHighQualityAudio(tracks) { // was: rSK
  return getAudioQualitySetting() === 1 ? filter(tracks, isHighQualityNonSurround) : tracks;
}

/**
 * Predicate: track is high-quality and NOT surround.
 * [was: TD]
 *
 * @param {object} track
 * @returns {boolean}
 */
export function isHighQualityNonSurround(track) { // was: TD
  return track.audio?.audioQuality === "AUDIO_QUALITY_HIGH" && !isSurroundTrack(track);
}

/**
 * Predicate: track uses DRC (Dynamic Range Compression).
 * [was: my]
 *
 * @param {object} track
 * @returns {boolean}
 */
export function isDrcTrack(track) { // was: my
  return track.audio?.W === true;
}

/**
 * Predicate: track is surround (5.1 / multi-channel).
 * [was: Wp]
 *
 * @param {object} track
 * @returns {boolean}
 */
export function isSurroundTrack(track) { // was: Wp
  return track.D();
}

/**
 * Predicate: track has a language descriptor.
 * [was: U53]
 *
 * @param {object} track
 * @returns {boolean}
 */
export function hasLanguageDescriptor(track) { // was: U53
  return track.miniplayerIcon !== undefined;
}

/**
 * Predicate: track is spatial audio.
 * [was: Kb]
 *
 * @param {object} track
 * @returns {boolean}
 */
export function isSpatialAudio(track) { // was: Kb
  return track.audio?.O === true;
}

/**
 * Check if tracks differ by a given property.
 * [was: ob]
 *
 * @param {Array} tracks
 * @param {Function} getter
 * @returns {boolean}
 */
export function tracksHaveDistinctValues(tracks, getter) { // was: ob
  if (tracks.length < 2) return false;
  const first = getter(tracks[0]);
  return tracks.some((t) => getter(t) !== first);
}

/**
 * Check if tracks have at least 2 distinct non-undefined values by a getter.
 * [was: IKx]
 *
 * @param {Array} tracks
 * @param {Function} getter
 * @returns {boolean}
 */
export function tracksHaveMultipleDistinctValues(tracks, getter) { // was: IKx
  const vals = new Set(tracks.map(getter));
  vals.delete(undefined);
  return vals.size >= 2;
}

// ===================================================================
// Autonav / toggle button UI
// ===================================================================

/**
 * Check if server-provided autonav state should be used.
 * [was: XDX]
 *
 * @param {object} component
 * @returns {boolean}
 */
export function useServerAutonavState(component) { // was: XDX
  return component.U.G().X("web_player_autonav_use_server_provided_state") && component.a$().K7();
}

/**
 * Update the autonav toggle button UI state.
 * [was: ASw]
 *
 * @param {object} toggle
 */
export function updateAutonavToggle(toggle) { // was: ASw
  toggle.isChecked = toggle.isChecked;
  toggle.z2("ytp-autonav-toggle-button").setAttribute("aria-checked", String(toggle.isChecked));

  const label = toggle.isChecked ? "Autoplay is on" : "Autoplay is off";
  if (toggle.U.G().X("player_tooltip_data_title_killswitch")) {
    toggle.update({ title: label, label });
  } else {
    toggle.update({ "data-tooltip-title": label, label });
  }
  toggle.U.WI(); // WI = updateTooltips
}

/**
 * Lazily create the autonav menu item.
 * [was: V7m]
 *
 * @param {object} component
 */
export function ensureAutonavMenuItem(component) { // was: V7m
  if (component.menuItem) return;
  component.menuItem = new eGw(component.api); // eGw = AutonavMenuItem
  registerDisposable(component, component.menuItem);
  component.menuItem.QUALITY_LABELS_DESCENDING(component.W);
}

// ===================================================================
// Delhi modern controls responsive layout
// ===================================================================

/**
 * Update compact/big-mode CSS custom properties for Delhi modern controls.
 * [was: BQO]
 *
 * @param {object} component
 */
export function updateDelhiCompactControls(component) { // was: BQO
  const useCompact = component.api.X("delhi_modern_web_player_compact_controls");
  const threshold = getExperimentValue(component.api.G().experiments, "delhi_modern_web_player_responsive_compact_controls_threshold");
  const isCompact = useCompact || (threshold > 0 && component.api.getPlayerSize().width <= threshold);

  const root = component.api.getRootNode();
  root.classList.toggle("ytp-delhi-modern-compact-controls", isCompact);

  const pillHeight       = isCompact ? "40px" : "48px";
  const pillTopHeight    = isCompact ? "8px"  : "12px";
  const bottomHeight     = isCompact ? "56px" : "72px";
  const bottomHeightXs   = isCompact ? "56px" : "64px";
  let bigModePillHeight  = isCompact ? "48px" : "56px";
  let bigModePillTop     = isCompact ? "12px" : "20px";
  let bigModeBottom      = isCompact ? "72px" : "96px";

  if (component.api.X("delhi_modern_web_player_big_mode_consistent_pill_height")) {
    bigModePillHeight = "56px";
    bigModePillTop = "12px";
    bigModeBottom = "80px";
  }

  root.style.setProperty("--yt-delhi-pill-height", pillHeight);
  root.style.setProperty("--yt-delhi-pill-top-height", pillTopHeight);
  root.style.setProperty("--yt-delhi-bottom-controls-height", bottomHeight);
  root.style.setProperty("--yt-delhi-bottom-controls-height-xsmall-width-mode", bottomHeightXs);
  root.style.setProperty("--yt-delhi-big-mode-pill-height", bigModePillHeight);
  root.style.setProperty("--yt-delhi-big-mode-pill-top-height", bigModePillTop);
  root.style.setProperty("--yt-delhi-big-mode-bottom-controls-height", bigModeBottom);
}

// ===================================================================
// Embargo cue ranges
// ===================================================================

/**
 * Register embargo cue ranges from placement data.
 * [was: x50]
 *
 * @param {object} component
 * @param {Array} placements
 */
export function registerEmbargoCueRanges(component, placements) { // was: x50
  for (const placement of placements) {
    const startSec = Number(placement.playbackPosition?.utcTimeMillis) / 1000;
    const rangeId = `embargo_${startSec}`;
    component.api.addUtcCueRange(
      rangeId, startSec, startSec + Number(placement.duration?.seconds), "embargo", false
    );
    if (placement.onEnter) {
      component.W[rangeId] = placement.onEnter.filter(component.O);
    }
  }
}

// ===================================================================
// Intersection observer for embed visibility
// ===================================================================

/**
 * Set up an intersection observer on the player root for embed visibility.
 * [was: nTO]
 *
 * @param {object} component
 */
export function setupEmbedVisibilityObserver(component) { // was: nTO
  let root = component.api.getRootNode();
  root = component.api.getWebPlayerContextConfig().embedsEnableEmc3ds
    ? root.parentElement?.parentElement || root
    : root;

  component.W = new qjK(root, (fraction) => { // qjK = IntersectionObserverWrapper
    if (fraction != null) {
      component.api.G().Eh = fraction;
      component.api.G().mA = "EMBEDDED_PLAYER_VISIBILITY_FRACTION_SOURCE_INTERSECTION_OBSERVER";
    }
  });
  registerDisposable(component, component.W);

  component.events.B(component.api, "videoStatsPingCreated", (ping) => {
    let obs = component.W;
    obs = obs.W == null ? null : Math.round(obs.W * 100) / 100;
    ping.inview = obs != null ? obs : undefined;

    const size = component.api.getPlayerSize();
    if (size.height > 0 && size.width > 0) {
      const parts = [Math.round(size.width), Math.round(size.height)];
      const dpr = getDevicePixelRatio(); // g.F7 = getDevicePixelRatio
      if (dpr > 1) parts.push(dpr);
      ping.size = parts.join(":");
    } else {
      ping.size = undefined;
    }
  });
}

// ===================================================================
// Countdown timer helpers
// ===================================================================

/**
 * Extract a time-counter renderer from message renderers.
 * [was: D5d]
 *
 * @param {object} [data]
 * @returns {object|null}
 */
export function findTimeCounterRenderer(data) { // was: D5d
  return (data?.messageRenderers || [])
    .find((r) => !!r.timeCounterRenderer)
    ?.timeCounterRenderer || null;
}

/**
 * Tick the countdown timer, updating the display.
 * [was: t7m]
 *
 * @param {object} timer
 */
export function tickCountdownTimer(timer) { // was: t7m
  const elapsed = Math.min((0, g.h)() - timer.A, timer.O);
  const remainingSec = Math.round((timer.O - elapsed) / 1000);
  timer.updateValue("duration", formatDuration({ seconds: remainingSec })); // Pq = formatDuration
  if (remainingSec <= 0 && timer.W) {
    timer.stopTimer();
  } else if (timer.W) {
    timer.W.start();
  }
}

/**
 * Start a countdown timer with the given duration.
 * [was: HA7]
 *
 * @param {object} timer
 * @param {number} durationMs
 */
export function startCountdownTimer(timer, durationMs) { // was: HA7
  if (timer.W) return;
  timer.O = durationMs;
  timer.A = (0, g.h)();
  timer.W = new AnimationFrameTimer(() => { tickCountdownTimer(timer); }, null); // g.T5 = RepeatTimer
  tickCountdownTimer(timer);
}

// ===================================================================
// Gated actions overlay
// ===================================================================

/**
 * Render gated-action overlay buttons from a list of actions.
 * [was: iAO]
 *
 * @param {object} overlay
 * @param {Array} actions
 */
export function renderGatedActionButtons(overlay, actions) { // was: iAO
  let idx = 0;
  for (idx = 0; idx < actions.length; idx++) {
    let entry = overlay.W[idx];
    let button = entry?.element;

    if (!button) {
      button = new PlayerComponent({
        C: "button",
        Z: "ytp-gated-actions-overlay-button",
        N: { tabindex: "0" },
        V: [{ C: "div", Z: "ytp-gated-actions-overlay-button-title", eG: "{{buttonText}}" }],
      });
      registerDisposable(overlay, button);
      button.createVisualElement(overlay.O);
      entry = { element: button };
    }

    const renderer = getProperty(actions[idx], NQy); // NQy = GatedActionRenderer
    button.update({ buttonText: renderer?.title || renderer?.titleFormatted?.content || "" });

    if (entry.listener) button.Xd(entry.listener); // Xd = unlisten
    entry.listener = button.listen("click", () => {
      const cmd = getProperty(renderer?.onTap, b5); // b5 = InnertubeCommand
      if (cmd) publishEvent(overlay.api, "innertubeCommand", cmd);
    });

    overlay.W[idx] = entry;
  }

  // Remove extra buttons
  while (idx < overlay.W.length) {
    overlay.W.pop().element.dispose();
  }
}

// ===================================================================
// Network path probing
// ===================================================================

/**
 * Probe a network path (URL) and log timing/success.
 * [was: rt]
 *
 * @param {string} url
 * @param {string} trigger
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 */
export function probeNetworkPath(url, trigger, onSuccess, onError) { // was: rt
  function onFinish(response) { // was: K
    const isSuccess = !(response.status !== 204 && response.status !== 200 && !response.response);
    const metrics = {
      succ: `${+isSuccess}`,
      adMessageRenderer: response.status,
      lb: response.response?.byteLength || 0,
      probeNetworkPath: ((0, g.h)() - startTime).toFixed(),
      shost: getDomain(url), // g.D9 = getHostname
      trigger,
    };
    addPerformanceTiming(metrics, url);
    if (onSuccess) onSuccess(metrics);
    if (onError && !isSuccess) onError(new PlayerError("pathprobe.net", metrics));
  }

  const startTime = (0, g.h)();
  sendXhrRequest(url, { // g.Wn = sendXhr
    format: "RAW",
    responseType: "arraybuffer",
    timeout: 10000,
    onFinish,
    onTimeout: onFinish,
  });
}

/**
 * Add performance resource timing data to a metrics object.
 * [was: ySK]
 *
 * @param {object} metrics
 * @param {string} url
 */
export function addPerformanceTiming(metrics, url) { // was: ySK
  if (!window.performance?.getEntriesByName) return;
  const entries = performance.getEntriesByName(url);
  if (entries?.length) {
    const entry = entries[0];
    metrics.pedns = (entry.domainLookupEnd - entry.startTime).toFixed();
    metrics.pecon = (entry.connectEnd - entry.domainLookupEnd).toFixed();
    metrics.perqs = (entry.requestStart - entry.connectEnd).toFixed();
  }
}

// ===================================================================
// Playback policy
// ===================================================================

/**
 * Compute an initial buffer size from the playback policy.
 * [was: Ib]
 *
 * @param {object} config
 * @returns {number}
 */
export function getInitialBufferSize(config) { // was: Ib
  return computeBandwidthEstimate(config.Qp, !config.policy.Is, config.policy.NT); // U6 = computeBufferSize
}
