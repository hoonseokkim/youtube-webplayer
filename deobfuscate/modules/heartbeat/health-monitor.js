/**
 * Health Monitor — Playback health checks, keep-alive signals, attestation
 *
 * Source: player_es6.vflset/en_US/heartbeat.js, lines 4–982
 * Deobfuscated from the `(function(g) { ... })(_yt_player)` IIFE.
 *
 * Contains helper functions, the offline slate UI, the stream transition
 * indicator (ElH), and date/calendar utilities used by the heartbeat module.
 */

import { filterAndSortFormats } from '../../data/bandwidth-tracker.js'; // was: as
import { StateFlag } from '../../player/component-events.js'; // was: mV
import { getRemainingInRange } from '../../media/codec-helpers.js'; // was: RR
import { checkAdExperiment } from '../../player/media-state.js'; // was: qP
import { isGaplessShortEligible } from '../../media/seek-controller.js'; // was: wA
import { RetryTimer } from '../../media/grpc-parser.js'; // was: tJ
import { isSamsungSmartTV } from '../../core/composition-helpers.js'; // was: b0
import { plusDecode } from '../../data/idb-transactions.js'; // was: Ni
import { hasCaptionTracks } from '../../ui/seek-bar-tail.js'; // was: OC
import { METRIC_RECORD_FIELDS } from '../../proto/messages-media.js'; // was: uQ
import { ProtobufStreamParser } from '../../media/bitstream-reader.js'; // was: SX
import { getExperimentFlags } from '../../player/time-tracking.js'; // was: Ty()
import { parseCommaSeparatedQueries } from '../../data/idb-transactions.js'; // was: jD
import { startVideoPlayback } from '../../player/player-events.js'; // was: SF
import { createVisualElement } from '../../data/gel-params.js'; // was: x0
import { disposeApp } from '../../player/player-events.js'; // was: WA
import { notificationBellIcon } from '../../ui/svg-icons.js';
import { buildVideoDebugString } from '../../ads/ad-async.js';
import { getPlayerResponse, getWatchNextResponse, loadVideoByPlayerVars } from '../../player/player-api.js';
import { isAtLiveHead, getCurrentTime } from '../../player/time-tracking.js';
import { isAttestationRefreshReady, getPlaybackAttestationToken } from '../../network/uri-utils.js';
import { generateRandomHexId } from '../../data/gel-core.js';
import { toString } from '../../core/string-utils.js';
import { Delay } from '../../core/timer.js';
import { dispose } from '../../ads/dai-cue-range.js';
import {
  hasClass, // was: g.B7
  toggleClass, // was: g.L
  Component, // was: g.k
  fireEvent, // was: g.xt
  registerDisposable, // was: g.F
  addToPlayerLayer, // was: g.f8
  Disposable, // was: g.qK
  DelayedCallback, // was: g.Uc
  logError, // was: g.Ty
  logEvent, // was: g.eG
  formatDuration, // was: g.$4
  now, // was: g.d0
  currentTimeMs, // was: g.h
  getRenderedText, // was: g.rK
  lookupExtension, // was: g.l
  ExtensionKey, // was: g.Y
  isObject, // was: g.Sd
  InnertubeService, // was: g.AZ
  sendRequest, // was: g.JD
  getInnertubeContext, // was: g.iV
  getDefaultConfig, // was: g.Ne
  getClientScreenNonce, // was: g.Df
  removeClass, // was: g.n6
  addClass, // was: g.xK
  closeIcon, // was: g.AK
  expandIcon, // was: g.X6
  notificationActiveIcon, // was: g.c_3
  P$W, // attestation wrapper
  botGuardInstance, // was: g.Tg
  buildVideoDebugString, // was: g.uxW
  isLivePlayback, // was: g.Jh
  isLiveFormat, // was: g.B4
  isPlaying, // was: g.pl
  hasAvailableFormats, // was: g.c9
  getDrmInfo, // was: g.RM
  isInnertube, // was: g.AI
  isUnplugged, // was: g.Ie
  isIphoneTv, // was: g.KD
  appendUrlParam, // was: g.sJ
  generateRequestId, // was: g.fd7
  getOAuthToken, // was: g.OQ
  sendXhr, // was: g.Wn
  truncateString, // was: g.uj
  initBotguard, // was: g.Il
  lookupExtension2, // was: g.GW
  ClientDisplayAdSignal, // was: g.CD
  WatchEndpointKey, // was: g.nl
  getKnownPlayerMessages, // was: g.Tw
  addCueRanges, // was: g.mV
  CueRange, // was: g.C8
  cueRangeEnterName, // was: g.Sr
  updateCueRangeSet, // was: g.DT
  ExponentialBackoff, // was: g.V2
  EventHandler, // was: g.db
  isAttestationRefreshReady, // was: g.lE7 — async attestation availability check
  getPlaybackAttestationToken, // was: g.PSx — attestation request
  getPlayerContextParams, // was: g.kW
  ExperimentFlags, // was: g.y27
} from '../../core/';

// ──────────────────────────────────────────────────────────────────
// Utility: zero-padded number formatting
// ──────────────────────────────────────────────────────────────────

/**
 * Zero-pads a number to a given width.
 * [was: S2]
 * Source lines: 4–14
 *
 * @param {number} value
 * @param {number} width - Minimum total digit count
 * @returns {string}
 */
export function zeroPad(value, width) { // was: S2
  if (!Number.isFinite(value)) return String(value);
  let str = String(value);
  let dotIndex = str.indexOf(".");
  if (dotIndex === -1) dotIndex = str.length;
  const sign = str[0] === "-" ? "-" : "";
  if (sign) str = str.substring(1);
  const padding = "0".repeat(Math.max(0, width - dotIndex));
  return sign + padding + str;
}

// ──────────────────────────────────────────────────────────────────
// SimpleDate — basic date wrapper
// ──────────────────────────────────────────────────────────────────

/**
 * Creates a Date clamped to midnight.
 * [was: rQ4]
 * Source lines: 26–30
 */
function createMidnightDate(year, month, day) { // was: rQ4
  const date = new Date(year, month, day);
  if (year >= 0 && year < 100) date.setFullYear(date.getFullYear() - 1900);
  return date;
}

/**
 * Fixes DST-related date shifts.
 * [was: FP]
 * Source lines: 31–33
 */
function fixDstShift(dateObj, expectedDay) { // was: FP
  if (dateObj.getDate() !== expectedDay) {
    dateObj.date.setUTCHours(dateObj.date.getUTCHours() + (dateObj.getDate() < expectedDay ? 1 : -1));
  }
}

/**
 * Simple date class wrapping a JS Date, used for heartbeat UTC offset.
 * [was: ZH]
 * Source lines: 15–757
 */
export class SimpleDate { // was: ZH
  constructor(input) {
    if (typeof input === "number") {
      this.date = createMidnightDate(input, 0, 1);
      fixDstShift(this, 1);
    } else if (Sd(input)) {
      this.date = createMidnightDate(input.getFullYear(), input.getMonth(), input.getDate());
      fixDstShift(this, input.getDate());
    } else {
      this.date = new Date(d0());
      const day = this.date.getDate();
      this.date.setHours(0);
      this.date.setMinutes(0);
      this.date.setSeconds(0);
      this.date.setMilliseconds(0);
      fixDstShift(this, day);
    }
  }

  getDate() { return this.date.getDate(); }
  getTimezoneOffset() { return this.date.getTimezoneOffset(); }
}

// ──────────────────────────────────────────────────────────────────
// Toggle button / reminder helpers (notification bell on offline slate)
// ──────────────────────────────────────────────────────────────────

/**
 * Updates a toggle button's text and icon based on its `isToggled` state.
 * [was: E0]
 * Source lines: 34–52
 */
function updateToggleButtonDisplay(button) { // was: E0
  if (button.toggleButtonRenderer) {
    const renderer = button.toggleButtonRenderer;
    if (renderer.isToggled) {
      const text = renderer.toggledText ? rK(renderer.toggledText) : "";
      button.update({ text, icon: resolveNotificationIcon(renderer.toggledIcon) });
    } else {
      const text = renderer.defaultText ? rK(renderer.defaultText) : "";
      button.update({ text, icon: resolveNotificationIcon(renderer.defaultIcon) });
    }
    button.show();
  } else {
    button.hide();
  }
}

/**
 * Replaces or clears the toggle button renderer.
 * [was: IdW]
 * Source lines: 53–56
 */
function setToggleButtonRenderer(button, data) { // was: IdW
  if (!button.toggleButtonRenderer && data && data.toggleButtonRenderer) {
    button.toggleButtonRenderer = data.toggleButtonRenderer;
  } else if (!data || !data.toggleButtonRenderer) {
    button.toggleButtonRenderer = null;
  }
  updateToggleButtonDisplay(button);
}

/**
 * Maps an iconType string to an SVG descriptor.
 * [was: UqH]
 * Source lines: 57–98
 */
function resolveNotificationIcon(iconData) { // was: UqH
  if (!iconData) return null;
  switch (iconData.iconType) {
    case "NOTIFICATIONS":
      return {
        C: "svg",
        N: { fill: "#fff", height: "24px", viewBox: "0 0 24 24", width: "24px" },
        V: [{
          C: "path",
          N: { d: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" }
        }],
      };
    case "NOTIFICATIONS_NONE":
      return {
        C: "svg",
        N: { fill: "#fff", height: "24px", viewBox: "0 0 24 24", width: "24px" },
        V: [{
          C: "path",
          N: { d: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" }
        }],
      };
    case "NOTIFICATIONS_ACTIVE":
      return notificationBellIcon();
    default:
      return null;
  }
}

/** @type {ExtensionKey} [was: Xka] */
const addReminderEndpointKey = new Y("addUpcomingEventReminderEndpoint"); // was: Xka

/** @type {ExtensionKey} [was: AQH] */
const removeReminderEndpointKey = new Y("removeUpcomingEventReminderEndpoint"); // was: AQH

/**
 * Sends an upcoming-event reminder toggle request.
 * [was: Vjm]
 * Source lines: 99–111
 */
function handleReminderToggle(button, serviceEndpoint) { // was: Vjm
  const addEndpoint = l(serviceEndpoint, addReminderEndpointKey);
  const removeEndpoint = l(serviceEndpoint, removeReminderEndpointKey);
  if (serviceEndpoint && (addEndpoint || removeEndpoint)) {
    let endpoint, path;
    if (addEndpoint) {
      endpoint = addEndpoint;
      path = "notification/add_upcoming_event_reminder";
    } else if (removeEndpoint) {
      endpoint = removeEndpoint;
      path = "notification/remove_upcoming_event_reminder";
    }
    if (path && endpoint && endpoint.params) {
      sendReminderRequest(button, path, endpoint.params);
    }
  }
}

/**
 * Sends the reminder API call.
 * [was: eKo]
 * Source lines: 112–129
 */
function sendReminderRequest(button, path, params) { // was: eKo
  if (!button.innertubeService) { // was: button.W
    button.innertubeService = new DeferredValue(button.playerApi.G().UR); // was: button.U
  }
  const body = { context: iV(button.innertubeService.config_ || Ne()) };
  const csn = Df();
  if (csn) body.context.clientScreenNonce = csn;
  body.params = params;
  JD(button.innertubeService, path, body, {
    timeout: 5000,
    onError: () => { revertReminderToggle(button); },
    onTimeout: () => { revertReminderToggle(button); },
  });
}

/**
 * Reverts the toggle button state on failure.
 * [was: BGo]
 * Source lines: 130–133
 */
function revertReminderToggle(button) { // was: BGo
  if (button.toggleButtonRenderer) {
    button.toggleButtonRenderer.isToggled = !button.toggleButtonRenderer.isToggled;
    updateToggleButtonDisplay(button);
  }
}

// ──────────────────────────────────────────────────────────────────
// Offline Slate text helper
// ──────────────────────────────────────────────────────────────────

/**
 * Updates the offline slate main/subtitle text.
 * [was: s0]
 * Source lines: 134–146
 */
function updateSlateText(slateComponent, renderer, overrideMainText) { // was: s0
  if (renderer) {
    const subtitle = renderer.subtitleText != null ? rK(renderer.subtitleText) : "";
    const mainText = overrideMainText ? overrideMainText : (renderer.mainText != null ? rK(renderer.mainText) : "");
    slateComponent.update({
      mainText,
      subtitleText: subtitle,
      label: renderer.mainText?.accessibility?.accessibilityData?.label ?? mainText,
    });
    L(slateComponent.element, "ytp-offline-slate-single-text-line", !subtitle);
    L(slateComponent.slateBar, "ytp-offline-slate-bar-hidden", !mainText && !subtitle); // was: slateComponent.A
  }
}

// ──────────────────────────────────────────────────────────────────
// JSON parse helper
// ──────────────────────────────────────────────────────────────────

/**
 * Safely parses JSON, returning undefined on failure.
 * [was: xqH]
 * Source lines: 147–152
 */
export function safeJsonParse(text) { // was: xqH
  try {
    const result = JSON.parse(text);
    return result != null ? result : undefined;
  } catch (_e) { /* swallow */ }
}

// ──────────────────────────────────────────────────────────────────
// Core heartbeat dispatch logic
// ──────────────────────────────────────────────────────────────────

/**
 * Main heartbeat tick — decides between legacy-URL and innertube heartbeats.
 * [was: H0H]
 * Source lines: 153–158
 */
export async function performHeartbeat(module) { // was: H0H
  const config = module.player.G();
  const videoData = module.getVideoData();
  if (isHeartbeatEnabled(module)) {
    if (usesLegacyHeartbeat(module)) {
      sendLegacyHeartbeat(module, config, videoData);
    } else {
      prepareAttestation(module);
      await sendInnertubeHeartbeat(module, config, videoData);
    }
  }
}

/**
 * Prepares the attestation response promise for non-legacy heartbeats.
 * [was: Dq0]
 * Source lines: 159–188
 */
function prepareAttestation(module) { // was: Dq0
  const videoData = module.getVideoData();
  if (videoData.DL) {
    if (videoData.X("use_rta_for_player")) {
      module.attestationResponse = requestRtaAttestation(module); // was: NGv
    } else {
      const attestationWrapper = new P$W(videoData);
      if (Tg.isInitialized() || module.sequenceNumber >= 3) {
        let result = null;
        if (attestationWrapper.videoData.Ds) {
          const rawParams = buildVideoDebugString(attestationWrapper);
          if (rawParams) {
            result = {};
            const params = {};
            for (const pair of rawParams.split("&")) {
              const parts = pair.split("=");
              if (parts.length === 2) params[parts[0]] = parts[1];
            }
            if (params.r1a) result.webResponse = params.r1a;
            if (params.r1c) result.error = ATTESTATION_ERRORS[Number(params.r1c)];
            result.challenge = attestationWrapper.videoData.Ds;
          }
        }
        module.attestationResponse = Promise.resolve(result || undefined);
      }
    }
  }
}

/**
 * Determines whether the heartbeat feature should be active.
 * [was: FE9]
 * Source lines: 189–206
 */
export function initHeartbeatFeature(module) { // was: FE9
  const videoData = module.getVideoData();
  const config = module.player.G();
  if (videoData.isLivePlayback) {
    if (KD(config.K)) {
      module.isLiveStream = true; // was: module.j
      module.isStreamInitialized = true; // was: module.J
      if (!AI(config) || Ie(config)) {
        module.offlineSlate = new OfflineSlate(module.player);
        F(module, module.offlineSlate);
        f8(module.player, module.offlineSlate.element, 4);
      }
      const playerResponse = videoData.getPlayerResponse();
      if (playerResponse && playerResponse.playabilityStatus) {
        module.lastPlayabilityStatus = playerResponse.playabilityStatus; // was: module.W
      }
      if (module.lastPlayabilityStatus?.status !== "UNPLAYABLE") {
        if (module.lastPlayabilityStatus) {
          const delay = extractPollDelay(undefined, module.lastPlayabilityStatus.liveStreamability?.liveStreamabilityRenderer);
          if (delay) {
            scheduleHeartbeat(module, delay);
          } else {
            scheduleHeartbeat(module, 7500);
          }
        } else {
          scheduleHeartbeat(module, getInitialHeartbeatDelay(module, true));
        }
      }
    } else {
      module.player.o$("html5.unsupportedlive", 2, "HTML5_NO_AVAILABLE_FORMATS_FALLBACK", "nolive.1");
    }
  } else {
    if (c9(videoData.getRemainingInRange, "heartbeat")) {
      module.player.checkAdExperiment("heartbeat", module.getPlayerType());
    }
  }
}

// ──────────────────────────────────────────────────────────────────
// Live stream status processing
// ──────────────────────────────────────────────────────────────────

/**
 * Processes the playability status from a live heartbeat response,
 * handling stream transitions, broadcast ID changes, and end-screens.
 * [was: s$W]
 * Source lines: 207–281
 *
 * @param {Object} module - The heartbeat module instance
 * @param {Object|undefined} fullResponse - The full innertube response
 * @param {Object} playabilityStatus - The playability status object
 * @returns {number} Poll delay override (0 = use default)
 */
export function processLiveStreamStatus(module, fullResponse, playabilityStatus) { // was: s$W
  let liveRenderer = playabilityStatus.liveStreamability?.liveStreamabilityRenderer;
  const shouldTransitionImmediately = !!(liveRenderer && (liveRenderer.switchStreamsImmediately ||
    (liveRenderer.transitionTiming && liveRenderer.transitionTiming === "STREAM_TRANSITION_TIMING_IMMEDIATELY")));
  let pollDelay = extractPollDelay(fullResponse, liveRenderer);
  const videoData = module.getVideoData();
  const playerState = module.player.getPlayerStateObject(module.getPlayerType());
  const isDvr = playerState.isPlaying() && !pl(videoData) && !module.player.isAtLiveHead(module.getPlayerType());

  if (videoData.G().cB()) {
    let qoeData = module.player.Yx()?.isGaplessShortEligible() || {};
    qoeData.status = playabilityStatus.status || "";
    qoeData.dvr = `${+isDvr}`;
    qoeData["switch"] = `${+shouldTransitionImmediately}`;
    qoeData.ended = `${+!(!liveRenderer || !liveRenderer.displayEndscreen)}`;
    module.player.RetryTimer("heartbeat", qoeData);
  }

  const newBroadcastId = liveRenderer?.broadcastId;
  const oldBroadcastId = module.lastPlayabilityStatus?.liveStreamability?.liveStreamabilityRenderer?.broadcastId;
  const broadcastIdChanged = newBroadcastId !== oldBroadcastId && newBroadcastId != null;

  if (broadcastIdChanged) {
    module.player.RetryTimer("lbidh", { broadcastId: newBroadcastId }, true);
  }

  // Handle stream transition endpoints with RELOAD_PLAYER signal
  if (AI(videoData.G()) && liveRenderer?.streamTransitionEndpoint) {
    const commands = l(liveRenderer.streamTransitionEndpoint, GW)?.commands || [];
    for (const cmd of commands) {
      if (l(cmd, CD)?.signal === "RELOAD_PLAYER") {
        module.player.o$("qoe.restart", 0, undefined, "sa.reload", "7");
        break;
      }
    }
  }

  const alwaysCacheRedirect = module.player.X("always_cache_redirect_endpoint");
  if (isDvr && !shouldTransitionImmediately && !alwaysCacheRedirect) return pollDelay;

  const watchEndpoint = liveRenderer?.streamTransitionEndpoint && l(liveRenderer.streamTransitionEndpoint, nl);
  if (liveRenderer?.transitionTiming === "STREAM_TRANSITION_TIMING_AT_STREAM_END") {
    module.getVideoData().transitionEndpointAtEndOfStream = watchEndpoint;
  } else {
    if (watchEndpoint && navigateToTransition(module, watchEndpoint, playabilityStatus)) return pollDelay;
    if (alwaysCacheRedirect && !watchEndpoint && module.getVideoData().transitionEndpointAtEndOfStream) {
      module.getVideoData().transitionEndpointAtEndOfStream = undefined;
    }
  }

  if (isDvr && !shouldTransitionImmediately && alwaysCacheRedirect) return pollDelay;

  if (playabilityStatus.status.toUpperCase() === "OK") {
    if (!B4(videoData) || broadcastIdChanged) {
      const params = { video_id: videoData.videoId };
      if (videoData.t8) params.is_live_destination = "1";
      params.disable_watch_next = true;
      params.raw_watch_next_response = videoData.getWatchNextResponse();
      params.autonav_state = videoData.autonavState;
      params.oauth_token = videoData.oauthToken;
      params.xH = videoData.xH;
      if (videoData.UG) {
        params.vss_credentials_token = videoData.UG;
        params.vss_credentials_token_type = videoData.s8;
      }
      if (videoData.isSamsungSmartTV) params.vvt = videoData.isSamsungSmartTV;

      let transitionInfo;
      if (B4(videoData)) {
        if (broadcastIdChanged) {
          transitionInfo = new HeartbeatTransitionInfo("broadcastIdChanged", `${oldBroadcastId},${newBroadcastId}`);
          module.logHeartbeatAction("HEARTBEAT_ACTION_TRIGGER_IMMEDIATE", "HEARTBEAT_ACTION_TRANSITION_REASON_BROADCAST_ID_CHANGED", playabilityStatus);
        }
      } else {
        if (newBroadcastId) {
          transitionInfo = new HeartbeatTransitionInfo("formatsReceived", `${newBroadcastId}`);
        }
        module.logHeartbeatAction("HEARTBEAT_ACTION_TRIGGER_IMMEDIATE", "HEARTBEAT_ACTION_TRANSITION_REASON_LIVE_STREAM_WENT_ONLINE", playabilityStatus);
      }

      if (broadcastIdChanged) {
        module.player.RetryTimer("lbidr", { broadcastId: newBroadcastId });
      }
      module.player.loadVideoByPlayerVars(params, undefined, undefined, undefined, transitionInfo);
      return pollDelay;
    }
    module.player.checkAdExperiment("heartbeat", module.getPlayerType());
  }

  // Handle end-screen display
  if (liveRenderer?.displayEndscreen) {
    if (module.offlineSlate) {
      module.offlineSlate.showEndscreen = true; // was: D
      if (module.offlineSlate.hasCaptionTracks) module.api.plusDecode();
    } else if (playerState.isBuffering()) {
      const qoeData = module.player.Yx()?.isGaplessShortEligible() || {};
      module.player.RetryTimer("hbse", qoeData, true);
      module.player.plusDecode(true, "h");
      xt(module.player, "onLiveMediaEnded", playabilityStatus);
    }
  }

  return pollDelay;
}

// ──────────────────────────────────────────────────────────────────
// Heartbeat scheduling and delay helpers
// ──────────────────────────────────────────────────────────────────

/**
 * Returns the initial heartbeat delay in milliseconds.
 * [was: wI]
 * Source lines: 282–285
 */
export function getInitialHeartbeatDelay(module, isFirstBeat = false) { // was: wI
  const videoData = module.getVideoData();
  if (videoData.X("html5_use_server_init_heartbeat_delay")) {
    return isNaN(videoData.tG) ? 15000 : videoData.tG;
  }
  return isFirstBeat ? 1000 : 2000;
}

/**
 * Initializes botguard for DRM-protected heartbeats (non-RTA path).
 * [was: dqm]
 * Source lines: 286–289
 */
export function initBotguardForHeartbeat(module) { // was: dqm
  const videoData = module.getVideoData();
  if (!videoData.X("use_rta_for_player") && videoData.DL) {
    const bgData = videoData.botguardData;
    if (bgData) Il(bgData, module.player.G());
  }
}

/**
 * Resets the heartbeat state to idle.
 * [was: bT]
 * Source lines: 290–295
 */
export function resetHeartbeat(module) { // was: bT
  module.errorCount = 0; // was: module.L
  module.heartbeatTimer.stop(); // was: module.O
  module.hasReceivedOk = false; // was: module.K
  module.sequenceNumber = 0;
}

/**
 * Requests an RTA attestation token.
 * [was: NGv]
 * Source lines: 296–307
 */
async function requestRtaAttestation(module) { // was: NGv
  if (await isAttestationRefreshReady()) {
    const videoData = module.getVideoData();
    return getPlaybackAttestationToken({
      cpn: videoData.clientPlaybackNonce,
      encryptedVideoId: videoData.videoId || "",
    }, 1500);
  }
  if (module.sequenceNumber >= 3) {
    return { error: "ATTESTATION_ERROR_VM_INTERNAL_ERROR" };
  }
}

/**
 * Schedules the next heartbeat if the timer is not already running.
 * [was: LB]
 * Source lines: 308–315
 */
export function scheduleHeartbeat(module, delay) { // was: LB
  if (!module.heartbeatTimer.isActive() && module.isStreamInitialized) {
    const videoData = module.getVideoData();
    if (hasHeartbeatConfig(module) || videoData.isLivePlayback) {
      if (delay === undefined) {
        delay = module.hasReceivedOk
          ? (module.isLiveStream
            ? 7500
            : (module.heartbeatParams?.interval ? module.heartbeatParams.interval * 1000 : module.getVideoData().tG || 60000))
          : 1000;
      }
      module.heartbeatTimer.start(delay);
    }
  }
}

// ──────────────────────────────────────────────────────────────────
// Heartbeat eligibility checks
// ──────────────────────────────────────────────────────────────────

/**
 * Whether the current video uses legacy (non-innertube) heartbeat URLs.
 * [was: qSv]
 * Source lines: 316–327
 */
function usesLegacyHeartbeat(module) { // was: qSv
  const videoData = module.getVideoData();
  if (!Jh(module.getVideoData()) || videoData.METRIC_RECORD_FIELDS) return false;
  if (videoData.K) {
    const isPlayready = videoData.K.flavor === "playready";
    const isWidevineInnertube = videoData.K.flavor === "widevine" && videoData.X("html5_innertube_heartbeats_for_widevine");
    const isFairplayInnertube = RM(videoData.K) && videoData.X("html5_innertube_heartbeats_for_fairplay");
    return !(isPlayready || isWidevineInnertube || isFairplayInnertube);
  }
  return true;
}

/**
 * Whether the module has a valid heartbeat configuration.
 * [was: j2]
 * Source lines: 328–333
 */
export function hasHeartbeatConfig(module) { // was: j2
  if (usesLegacyHeartbeat(module)) return !!module.heartbeatParams;
  const videoData = module.getVideoData();
  if (!Jh(module.getVideoData()) || videoData.ProtobufStreamParser || videoData.AD) {
    return !!videoData.heartbeatToken;
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────
// Legacy (URL-based) heartbeat sender
// ──────────────────────────────────────────────────────────────────

/**
 * Sends a legacy heartbeat via GET request to heartbeatParams.url.
 * [was: b0D]
 * Source lines: 334–373
 */
function sendLegacyHeartbeatXhr(module, videoData, url) { // was: b0D
  if (videoData.EJ) {
    url = sJ(url, { internalipoverride: videoData.EJ });
  }
  const params = { cpn: videoData.clientPlaybackNonce };
  if (videoData.contextParams) params.context_params = videoData.contextParams;
  if (videoData.Y0) params.kpt = videoData.Y0;
  url = sJ(url, params);

  Wn(url, {
    format: "RAW",
    method: "GET",
    timeout: 30000,
    onSuccess: (response) => {
      if (!module.heartbeatTimer.isActive() && isHeartbeatEnabled(module)) {
        module.backoff.reset(); // was: module.D
        module.sequenceNumber++;
        const text = response.responseText;
        const json = safeJsonParse(text);
        let statusCode;
        if (json) {
          xt(module.player, "onHeartbeat", json);
          statusCode = json.status === "ok"
            ? (json.stop_heartbeat ? 2 : 0)
            : (json.status === "stop" ? 1 : (json.status === "live_stream_offline" ? 0 : -1));
        } else {
          const match = text.match(LEGACY_HEARTBEAT_REGEX);
          statusCode = match ? (match[1] === "0" ? 0 : 1) : -1;
        }
        processHeartbeatResult(module, undefined, json, text, statusCode);
      }
    },
    onError: (response) => {
      if (isHeartbeatEnabled(module)) handleHeartbeatError(module, true, `net-${response.status}`);
    },
    onTimeout: () => {
      if (isHeartbeatEnabled(module)) handleHeartbeatError(module, true, "timeout");
    },
    withCredentials: true,
  });
}

/**
 * Whether heartbeat polling should be active for the current playback.
 * [was: dI]
 * Source lines: 374–378
 */
function isHeartbeatEnabled(module) { // was: dI
  const videoData = module.getVideoData();
  if (module.player.getPresentingPlayerType() === 3) return false;
  if (!module.player.G().experiments.getExperimentFlags.W.BA(y27) && module.player.getPlayerStateObject(module.getPlayerType()).W(4)) return false;
  if (hasHeartbeatConfig(module) || videoData.isLivePlayback) return true;
  resetHeartbeat(module);
  return false;
}

/**
 * Sends a legacy heartbeat with OAuth token handling.
 * [was: nlS]
 * Source lines: 379–398
 */
function sendLegacyHeartbeat(module, config, videoData) { // was: nlS
  if (module.heartbeatParams?.url) {
    let url = sJ(module.heartbeatParams.url, { request_id: generateRandomHexId() });
    if (videoData.isSamsungSmartTV) {
      url = sJ(url, { vvt: videoData.isSamsungSmartTV });
      if (videoData.mdxEnvironment) {
        url = sJ(url, { mdx_environment: videoData.mdxEnvironment });
      }
    }
    OQ(config, videoData.oauthToken).then((token) => {
      if (token) url = sJ(url, { access_token: token });
      sendLegacyHeartbeatXhr(module, videoData, url);
    });
  }
}

// ──────────────────────────────────────────────────────────────────
// Innertube heartbeat sender
// ──────────────────────────────────────────────────────────────────

/**
 * Sends an innertube heartbeat via the player/heartbeat API.
 * [was: tj4]
 * Source lines: 399–486
 */
async function sendInnertubeHeartbeat(module, config, videoData) { // was: tj4
  const body = {
    videoId: videoData.videoId,
    sequenceNumber: module.sequenceNumber,
    heartbeatServerData: module.heartbeatServerData ?? videoData.heartbeatServerData, // was: module.T2
  };

  module.pendingAttestationResponse = module.attestationResponse; // was: module.Y
  if (videoData.DL) body.attestationResponse = await module.pendingAttestationResponse;

  let clientContext = kW(videoData);
  let clientInfo = clientContext.client ?? {};
  clientInfo.utcOffsetMinutes = module.utcOffsetMinutes;
  body.context = clientContext;
  body.cpn = videoData.clientPlaybackNonce;

  const timeZone = typeof Intl !== "undefined" ? (new Intl.DateTimeFormat()).resolvedOptions().timeZone : null;
  if (timeZone) clientInfo.timeZone = timeZone;

  const requestParams = { heartbeatChecks: [] };
  const playerResponse = videoData.getPlayerResponse();
  if (playerResponse) {
    if (videoData.heartbeatToken) body.heartbeatToken = videoData.heartbeatToken;
    const playability = playerResponse.playabilityStatus;
    if (playability?.liveStreamability?.liveStreamabilityRenderer) {
      requestParams.heartbeatChecks.push("HEARTBEAT_CHECK_TYPE_LIVE_STREAM_STATUS");
    }
  }
  if (videoData.heartbeatToken) requestParams.heartbeatChecks.push("HEARTBEAT_CHECK_TYPE_YPC");

  if (Ie(config)) {
    requestParams.heartbeatChecks.push("HEARTBEAT_CHECK_TYPE_UNPLUGGED");
    const positionMs = getIngestionPositionMs(module);
    const unpluggedParams = {};
    if (positionMs !== null) unpluggedParams.clientPlayerPositionUtcMillis = positionMs;
    const freePreview = module.player.CO()?.Vw()?.cg() || 0;
    if (freePreview > 0) unpluggedParams.freePreviewWatchedDuration = { seconds: `${freePreview}` };
    requestParams.unpluggedParams = unpluggedParams;
  }

  body.heartbeatRequestParams = requestParams;

  // Add playback position
  if (videoData.isLivePlayback) {
    const posMs = getIngestionPositionMs(module);
    if (posMs !== null) {
      body.playbackState = body.playbackState || {};
      body.playbackState.playbackPosition = { utcTimeMillis: posMs };
    }
  } else if (config.X("enable_heartbeat_vod_playback_position")) {
    const streamMs = getStreamPositionMs(module);
    if (streamMs !== null) {
      body.playbackState = body.playbackState || {};
      body.playbackState.playbackPosition = { streamTimeMillis: streamMs };
    }
  }

  module.player.publish("heartbeatRequest", body);

  const requestOptions = {
    timeout: 30000,
    onSuccess: (response) => {
      if (!module.heartbeatTimer.isActive() && isHeartbeatEnabled(module)) {
        const vd = module.getVideoData();
        const missingAttestation = vd.DL && module.pendingAttestationResponse == null;
        vd.DL = !!response.heartbeatAttestationConfig?.requiresAttestation || missingAttestation;

        const playability = response.playabilityStatus;
        const serialized = JSON.stringify(playability) || "{}";
        if (response.authenticationMismatch) module.player.RetryTimer("authshear", {});

        let statusCode = -1;
        if (playability) {
          xt(module.player, "onHeartbeat", playability);
          if (playability.status === "OK") statusCode = response.stopHeartbeat ? 2 : 0;
          else if (playability.status === "UNPLAYABLE") statusCode = 1;
          else if (playability.status === "LIVE_STREAM_OFFLINE") statusCode = 0;
        }

        if (module.sequenceNumber && statusCode === -1) { /* keep backoff */ } else { module.backoff.reset(); }
        module.sequenceNumber++;

        if (response.heartbeatServerData) module.heartbeatServerData = response.heartbeatServerData;
        vd.xo = response;
        if (response.playerCueRangeSet) DT(vd, response.playerCueRangeSet);
        if (response.playerCueRanges?.length > 0) vd.cueRanges = response.playerCueRanges;
        if (response.progressBarConfig?.progressBarStartPosition && response.progressBarConfig?.progressBarEndPosition) {
          vd.progressBarStartPosition = response.progressBarConfig.progressBarStartPosition;
          vd.progressBarEndPosition = response.progressBarConfig.progressBarEndPosition;
        }
        vd.compositeLiveIngestionOffsetToken = response.compositeLiveIngestionOffsetToken;
        if (response.compositeLiveStatusToken !== vd.compositeLiveStatusToken) {
          vd.compositeLiveStatusToken = response.compositeLiveStatusToken;
        }
        vd.heartbeatLoggingToken = response.heartbeatLoggingToken;
        vd.publish("dataupdated");
        processHeartbeatResult(module, response, playability, serialized, statusCode);
      }
    },
    onError: (response) => {
      if (isHeartbeatEnabled(module)) handleHeartbeatError(module, true, `net-${response.status}`);
    },
    onTimeout: () => {
      if (isHeartbeatEnabled(module)) handleHeartbeatError(module, true, "timeout");
    },
  };

  OQ(config, videoData.D()).then((token) => {
    if (token) requestOptions.MX = `Bearer ${token}`;
    JD(module.innertubeService, "player/heartbeat", body, requestOptions); // was: module.b0
  });
}

// ──────────────────────────────────────────────────────────────────
// Playback position helpers
// ──────────────────────────────────────────────────────────────────

/**
 * Returns the ingestion-time position in milliseconds as a string.
 * [was: j$D]
 * Source lines: 487–489
 */
function getIngestionPositionMs(module) { // was: j$D
  const ingestionTime = module.player.getProgressState(module.getPlayerType()).ingestionTime;
  return ingestionTime && isFinite(ingestionTime) ? `${Math.floor(ingestionTime * 1000)}` : null;
}

/**
 * Returns the stream-time position in milliseconds as a string.
 * [was: gli]
 * Source lines: 490–494
 */
function getStreamPositionMs(module) { // was: gli
  const currentTime = module.player.getCurrentTime({ playerType: module.getPlayerType() });
  return currentTime && isFinite(currentTime) ? `${Math.floor(currentTime * 1000)}` : null;
}

// ──────────────────────────────────────────────────────────────────
// Heartbeat result processing
// ──────────────────────────────────────────────────────────────────

/**
 * Routes a heartbeat result: decode error, stop, or continue.
 * [was: wkm]
 * Source lines: 495–513
 */
function processHeartbeatResult(module, fullResponse, playabilityStatus, rawText, statusCode) { // was: wkm
  if (statusCode === -1) {
    const detail = `decode ${uj(rawText, 3)}`;
    handleHeartbeatError(module, false, detail);
  } else if (statusCode === 2) {
    resetHeartbeat(module);
    module.hasReceivedOk = true;
  } else {
    module.errorCount = 0;
    module.heartbeatTimer.stop();
    if (statusCode === 1) {
      module.hasReceivedOk = false;
      if (playabilityStatus?.NetworkErrorCode === "PLAYABILITY_ERROR_CODE_EMBARGOED") {
        module.player.F9(true);
      }
      const detail = `pe.${playabilityStatus?.NetworkErrorCode};ps.${playabilityStatus?.status}`;
      module.player.o$("heartbeat.stop", 2, module.getErrorMessage(rawText), detail); // was: module.eB
      eG("heartbeatActionPlayerHalted", buildHaltPayload(playabilityStatus));
      if (fullResponse?.videoTransitionEndpoint && playabilityStatus) {
        const endpoint = fullResponse.videoTransitionEndpoint;
        const watchEndpoint = l(endpoint, nl);
        if (watchEndpoint) {
          navigateToTransition(module, watchEndpoint, playabilityStatus, { itct: endpoint?.clickTrackingParams });
        }
      }
    } else {
      module.hasReceivedOk = true;
      let pollDelay = 0;
      if (module.isLiveStream && playabilityStatus) {
        pollDelay = processLiveStreamStatus(module, fullResponse, playabilityStatus);
        module.player.publish("livestatedata", playabilityStatus);
      }
      if (pollDelay) scheduleHeartbeat(module, pollDelay);
      else scheduleHeartbeat(module);
    }
  }
}

// ──────────────────────────────────────────────────────────────────
// Error handling
// ──────────────────────────────────────────────────────────────────

/**
 * Handles heartbeat errors with retry backoff or fatal halt.
 * [was: gI]
 * Source lines: 514–533
 */
function handleHeartbeatError(module, isNetworkError, detail) { // was: gI
  if (!module.heartbeatTimer.isActive()) {
    module.heartbeatTimer.stop();
    module.errorCount++;
    const errorType = isNetworkError ? "heartbeat.net" : "heartbeat.servererror";

    let isFatal;
    const videoData = module.getVideoData();
    if (videoData.Mv || (isNetworkError && !Jh(module.getVideoData()) && !hasHeartbeatConfig(module) && videoData.isLivePlayback)) {
      isFatal = false;
    } else {
      const maxRetries = module.heartbeatParams?.retries ?? (videoData.parseCommaSeparatedQueries || 5);
      isFatal = module.errorCount >= maxRetries;
    }

    if (isFatal) {
      eG("heartbeatActionPlayerHalted", isNetworkError ? { enforcedPolicyToHaltOnNetworkFailure: true } : buildHaltPayload());
      const vd = module.getVideoData();
      if (vd?.isLivePlayback) {
        module.player.o$(errorType, 1, "Video playback interrupted. Please try again.", detail);
      } else {
        module.player.o$(errorType, 1, "Sorry, there was an error licensing this video.", detail);
      }
    } else {
      scheduleHeartbeat(module, module.backoff.getValue());
      module.backoff.increment(); // was: g.BO
    }
  }
}

/**
 * Builds the payload for a "heartbeatActionPlayerHalted" event.
 * [was: O0H]
 * Source lines: 534–540
 */
function buildHaltPayload(playabilityStatus) { // was: O0H
  const payload = { enforcedPolicyToHaltOnNetworkFailure: false };
  if (playabilityStatus) payload.serializedServerContext = playabilityStatus.additionalLoggingData;
  return payload;
}

/**
 * Extracts poll delay from a heartbeat response or live-stream renderer.
 * [was: SSi]
 * Source lines: 541–543
 */
function extractPollDelay(fullResponse, liveRenderer) { // was: SSi
  const fromResponse = Number(fullResponse?.pollDelayMs);
  if (fromResponse) return fromResponse;
  const fromRenderer = Number(liveRenderer?.pollDelayMs);
  return fromRenderer || 0;
}

// ──────────────────────────────────────────────────────────────────
// Stream transition navigation
// ──────────────────────────────────────────────────────────────────

/**
 * Navigates to a stream transition endpoint (e.g. next broadcast).
 * [was: Z0v]
 * Source lines: 544–552
 */
function navigateToTransition(module, watchEndpoint, playabilityStatus, extraParams) { // was: Z0v
  const videoId = watchEndpoint?.videoId;
  if (!videoId) return false;
  module.player.startVideoPlayback(videoId, { autonav: "1", ...(extraParams || {}) }, undefined, true, true, watchEndpoint, module.getVideoData().D());
  module.logHeartbeatAction("HEARTBEAT_ACTION_TRIGGER_IMMEDIATE", "HEARTBEAT_ACTION_TRANSITION_REASON_HAS_NEW_STREAM_TRANSITION_ENDPOINT", playabilityStatus);
  return true;
}

// ──────────────────────────────────────────────────────────────────
// Attestation error codes
// ──────────────────────────────────────────────────────────────────

/**
 * Attestation error code list.
 * [was: i0a]
 * Source line: 580
 */
const ATTESTATION_ERRORS = [ // was: i0a
  "ATTESTATION_ERROR_UNKNOWN",
  "ATTESTATION_ERROR_VM_NOT_INITIALIZED",
  "ATTESTATION_ERROR_VM_NO_RESPONSE",
  "ATTESTATION_ERROR_VM_TIMEOUT",
  "ATTESTATION_ERROR_VM_INTERNAL_ERROR",
];

/**
 * Heartbeat error-code-to-label map (legacy responses).
 * [was: vlZ]
 * Source lines: 581–609
 */
export const HEARTBEAT_ERROR_CODES = { // was: vlZ
  300: "STREAMING_DEVICES_QUOTA_PER_24H_EXCEEDED",
  301: "ALREADY_PINNED_ON_A_DEVICE",
  303: "STOPPED_BY_ANOTHER_PLAYBACK",
  304: "TOO_MANY_STREAMS_PER_USER",
  305: "TOO_MANY_STREAMS_PER_ENTITLEMENT",
  400: "VIDEO_NOT_FOUND",
  401: "GEO_FAILURE",
  402: "STREAMING_NOT_ALLOWED",
  403: "UNSUPPORTED_DEVICE",
  405: "VIDEO_FORBIDDEN",
  500: "PURCHASE_NOT_FOUND",
  501: "RENTAL_EXPIRED",
  502: "PURCHASE_REFUNDED",
  5000: "BAD_REQUEST",
  5001: "CGI_PARAMS_MISSING",
  5002: "CGI_PARAMS_MALFORMED",
  5100: "AUTHENTICATION_MISSING",
  5101: "AUTHENTICATION_MALFORMED",
  5102: "AUTHENTICATION_EXPIRED",
  5200: "CAST_TOKEN_MALFORMED",
  5201: "CAST_TOKEN_EXPIRED",
  5202: "CAST_TOKEN_FAILED",
  5203: "CAST_SESSION_VIDEO_MISMATCHED",
  5204: "CAST_SESSION_DEVICE_MISMATCHED",
  6000: "INVALID_DRM_MESSAGE",
  7000: "SERVER_ERROR",
  8000: "RETRYABLE_ERROR",
};

/**
 * Regex for parsing legacy GLS/1.0 heartbeat responses.
 * [was: LEZ]
 * Source line: 984
 */
export const LEGACY_HEARTBEAT_REGEX = /^GLS\/1.0 (\d+) (\w+).*?\r\n\r\n([\S\s]*)$/; // was: LEZ

// ──────────────────────────────────────────────────────────────────
// HeartbeatTransitionInfo — dedup token for stream transitions
// ──────────────────────────────────────────────────────────────────

/**
 * Deduplication token carried across video loads triggered by heartbeat
 * stream transitions.
 * [was: ElH]
 * Source lines: 964–982
 */
export class HeartbeatTransitionInfo { // was: ElH
  /**
   * @param {string} trigger - Transition trigger name
   * @param {string} detail - Additional detail string
   */
  constructor(trigger, detail) {
    /** @type {number} Creation timestamp [was: A] */
    this.createdAt = h(); // was: (0, g.h)()

    /** @type {string} */
    this.trigger = trigger;

    /** @type {string} [was: W] */
    this.detail = detail;
  }

  /**
   * Checks if another transition info matches this one.
   * [was: O]
   */
  matches(other) {
    if (!this.trigger || !other.trigger) return false;
    return this.trigger === other.trigger && this.detail === other.detail;
  }

  /**
   * Whether this token has expired (> 60 seconds old).
   */
  isExpired() {
    return h() - this.createdAt > 60000;
  }

  toString() {
    return `heartbeat:${this.trigger}:${this.detail}`;
  }
}

// ──────────────────────────────────────────────────────────────────
// Offline Slate UI components
// ──────────────────────────────────────────────────────────────────

/**
 * Action button for the offline slate (e.g. event reminder toggle).
 * [was: adS]
 * Source lines: 760–791
 */
export class OfflineSlateActionButton extends k { // was: adS
  constructor(playerApi) {
    super({
      C: "div",
      V: [{
        C: "button",
        yC: ["ytp-offline-slate-button", "ytp-button"],
        V: [
          { C: "div", Z: "ytp-offline-slate-button-icon", eG: "{{icon}}" },
          { C: "div", Z: "ytp-offline-slate-button-text", eG: "{{text}}" },
        ],
      }],
    });

    /** @type {Object} Player API [was: U] */
    this.playerApi = playerApi;

    /** @type {Object|null} [was: W] */
    this.innertubeService = null;

    /** @type {Object|null} */
    this.toggleButtonRenderer = null;

    /** @type {Element|null} [was: O] */
    this.buttonElement = this.z2("ytp-offline-slate-button");
    if (this.buttonElement) this.B(this.buttonElement, "click", this.onClick);

    this.hide();
  }

  /** Handles click — toggles the reminder endpoint. [was: A] */
  onClick() {
    if (this.toggleButtonRenderer) {
      const renderer = this.toggleButtonRenderer;
      if (renderer.isToggled) {
        handleReminderToggle(this, renderer.toggledServiceEndpoint);
      } else {
        handleReminderToggle(this, renderer.defaultServiceEndpoint);
      }
      renderer.isToggled = !renderer.isToggled;
      updateToggleButtonDisplay(this);
    }
  }
}

/**
 * Full offline slate overlay shown when a live stream is not yet available.
 * Handles countdown timers, background thumbnails, and action buttons.
 * [was: yQS]
 * Source lines: 793–962
 */
export class OfflineSlate extends k { // was: yQS
  constructor(playerApi) {
    super({
      C: "div",
      Z: "ytp-offline-slate",
      V: [
        { C: "div", Z: "ytp-offline-slate-background" },
        {
          C: "div", Z: "ytp-offline-slate-bar",
          V: [
            { C: "span", Z: "ytp-offline-slate-icon", V: [/* broadcast SVG icon */] },
            {
              C: "span", Z: "ytp-offline-slate-messages",
              V: [
                { C: "div", Z: "ytp-offline-slate-main-text", N: { "aria-label": "{{label}}" }, eG: "{{mainText}}" },
                { C: "div", Z: "ytp-offline-slate-subtitle-text", eG: "{{subtitleText}}" },
              ],
            },
            { C: "span", Z: "ytp-offline-slate-buttons" },
          ],
        },
        { C: "button", yC: ["ytp-offline-slate-close-button", "ytp-button"], V: [AK()] },
        { C: "button", yC: ["ytp-offline-slate-open-button", "ytp-button"], V: [X6()] },
      ],
    });

    /** @type {Object} Player API */
    this.api = playerApi;

    /** @type {Object|null} Last playability status [was: O] */
    this.lastPlayabilityStatus = null;

    /** @type {OfflineSlateActionButton|null} [was: W] */
    this.actionButton = null;

    /** @type {Element} Background element */
    this.background = this.z2("ytp-offline-slate-background");

    /** @type {Element} Slate bar [was: A] */
    this.slateBar = this.z2("ytp-offline-slate-bar");

    /** @type {DelayedCallback} Bar fade timer [was: K] */
    this.barFadeTimer = new Delay(() => { xK(this.slateBar, "ytp-offline-slate-bar-fade"); }, 15000);

    /** @type {boolean} Whether to display end-screen [was: D] */
    this.showEndscreen = false;

    /** @type {DelayedCallback} Collapse timer [was: j] */
    this.collapseTimer = new Delay(() => { xK(this.element, "ytp-offline-slate-collapsed"); }, 15000);

    F(this, this.collapseTimer);
    F(this, this.barFadeTimer);

    /** @type {DelayedCallback} Countdown timer */
    this.countdownTimer = new Delay(this.updateCountdown, 1000, this);

    this.B(playerApi, "presentingplayerstatechange", this.onPresentingStateChange); // was: L
    this.B(playerApi, "livestatedata", this.onLiveStateData); // was: ZF

    this.B(this.z2("ytp-offline-slate-close-button"), "click", () => { xK(this.element, "ytp-offline-slate-collapsed"); });
    this.B(this.z2("ytp-offline-slate-open-button"), "click", () => { n6(this.element, "ytp-offline-slate-collapsed"); });

    this.hide();

    const videoData = this.getVideoData();
    const playerResponse = videoData.getPlayerResponse();
    if (playerResponse) {
      const playability = playerResponse.playabilityStatus;
      if (playability) this.onLiveStateData(playability);
    }

    const isPremiereTrailer = this.api.getPresentingPlayerType() === 8 && !this.getVideoData().Cf;
    const isPremiere = this.api.getPresentingPlayerType() === 8;
    L(this.element, "ytp-offline-slate-premiere-trailer", isPremiereTrailer);
    L(this.element, "ytp-offline-slate-hide-background", isPremiere);
  }

  getPlayerType() {
    if (this.api.getPresentingPlayerType() === 8) return 1;
  }

  getVideoData() {
    return this.api.getVideoData({ playerType: this.getPlayerType() });
  }

  /**
   * Updates slate content from live-state data.
   * [was: ZF]
   */
  onLiveStateData(playabilityStatus) {
    const slateData = playabilityStatus?.liveStreamability?.liveStreamabilityRenderer?.offlineSlate;
    if (slateData) {
      this.lastPlayabilityStatus = playabilityStatus;
      const renderer = slateData.liveStreamOfflineSlateRenderer;
      if (renderer.canShowCountdown) {
        this.updateCountdown();
      } else {
        updateSlateText(this, renderer);
      }

      // Update background thumbnail
      const thumbData = playabilityStatus?.liveStreamability?.liveStreamabilityRenderer?.offlineSlate?.liveStreamOfflineSlateRenderer?.thumbnail;
      if (thumbData) {
        let maxWidth = 0;
        let bestUrl = null;
        const thumbs = thumbData.thumbnails;
        for (let i = 0; i < thumbs.length; i++) {
          if (thumbs[i].width > maxWidth) {
            maxWidth = thumbs[i].width || 0;
            bestUrl = thumbs[i].url;
          }
        }
        if (bestUrl) this.background.style.backgroundImage = `url(${bestUrl})`;
      } else {
        this.background.style.backgroundImage = "";
      }

      // Action buttons
      if (renderer.actionButtons) {
        if (!this.actionButton) {
          this.actionButton = new OfflineSlateActionButton(this.api);
          this.actionButton.createVisualElement(this.z2("ytp-offline-slate-buttons"));
          F(this, this.actionButton);
        }
        setToggleButtonRenderer(this.actionButton, renderer.actionButtons?.[0]);
      } else if (this.actionButton) {
        setToggleButtonRenderer(this.actionButton, null);
      }

      this.lastPlayabilityStatus = playabilityStatus;
    } else {
      this.lastPlayabilityStatus = null;
    }

    this.onPresentingStateChange();
  }

  /**
   * Shows/hides the slate based on player state.
   * [was: L]
   */
  onPresentingStateChange(stateEvent) {
    let shouldShow;
    if (this.api.getPresentingPlayerType() === 8) {
      shouldShow = true;
    } else {
      const state = this.api.getPlayerStateObject();
      const videoData = this.getVideoData();
      const isLiveBuffering = videoData.isLivePlayback && (state.isBuffering() || state.W(2) || state.W(64));
      const isAutonavEnd = videoData.autonavState === 2 && state.W(2);
      const isDvrBehind = state.isPlaying() && !pl(videoData) && !this.api.isAtLiveHead(undefined, true);
      shouldShow = isLiveBuffering && !isDvrBehind && !isAutonavEnd;
    }

    if (shouldShow && this.lastPlayabilityStatus) {
      if (this.hasCaptionTracks) {
        // Already visible — handle re-appearance after ad
        if (stateEvent?.Fq(2) && !this.getVideoData().Cf) {
          n6(this.element, "ytp-offline-slate-collapsed");
          this.collapseTimer.stop();
          n6(this.slateBar, "ytp-offline-slate-bar-fade");
          this.barFadeTimer.start();
        }
      } else {
        this.show();
        this.collapseTimer.start();
        this.api.publish("offlineslatestatechange");
        if (this.showEndscreen) this.api.plusDecode();
      }
    } else if (this.hasCaptionTracks) {
      this.hide();
      this.api.publish("offlineslatestatechange");
    }
  }

  /**
   * Updates the countdown timer text.
   * [was: J]
   */
  updateCountdown() {
    const renderer = this.lastPlayabilityStatus?.liveStreamability?.liveStreamabilityRenderer?.offlineSlate?.liveStreamOfflineSlateRenderer;
    if (renderer) {
      const nowSec = Math.floor(d0() / 1000);
      const scheduledStart = renderer.canShowCountdown && Number(renderer.scheduledStartTime);
      if (!scheduledStart || scheduledStart <= nowSec) {
        updateSlateText(this, renderer);
        this.countdownTimer.stop();
      } else {
        updateSlateText(this, renderer, $4(scheduledStart - nowSec));
        this.countdownTimer.cw();
      }
    }
  }

  /** Cleanup. [was: WA] */
  disposeApp() {
    this.countdownTimer.dispose();
    this.countdownTimer = null;
    super.disposeApp();
  }
}
