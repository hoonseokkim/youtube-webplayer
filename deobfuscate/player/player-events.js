import { publishEvent, publishEventAll, publishEventWithTransport } from '../ads/ad-click-tracking.js';
import { disposeAll } from '../core/event-system.js';
import { isUnpluggedPlatform } from '../data/bandwidth-tracker.js';
import { createVideoDataForPlaylistItem } from './video-loader.js';
import { miniplayerIcon } from '../ui/svg-icons.js'; // was: D1
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { onVideoDataChange } from './player-events.js'; // was: Qq
import { timedInvoke } from '../core/event-registration.js'; // was: pO
import { unwrapTrustedResourceUrl } from '../core/composition-helpers.js'; // was: x3
import { CssTransitionAnimation } from '../core/bitstream-helpers.js'; // was: NI
import { DefaultXmlHttpFactory } from '../core/event-registration.js'; // was: vJ
import { destroyVolatileModules } from './caption-manager.js'; // was: Wv
import { updateClientParams } from '../data/bandwidth-tracker.js'; // was: nD
import { wrapIdbRequest } from '../data/idb-transactions.js'; // was: hN
import { shouldDeferAdModule } from './caption-manager.js'; // was: Qr
import { configureMediaElementState } from './media-state.js'; // was: pC7
import { showSampleSubtitles } from '../modules/caption/caption-internals.js'; // was: u9
import { getWallClockTime } from './time-tracking.js'; // was: Kk()
import { addToImageCache } from '../modules/offline/download-manager.js'; // was: qU
import { updateVisualElementCSN } from './playback-state.js'; // was: tcy
import { captureBandwidthSnapshot } from '../ads/ad-prebuffer.js'; // was: x$
import { handlePlaybackEnded } from './playback-mode.js'; // was: z2_
import { restoreAudioTrackPreference } from './video-loader.js'; // was: Io
import { createDeferredModules } from './caption-manager.js'; // was: cv
import { DEFAULT_STORE_EXPIRATION_TOKEN } from '../network/innertube-config.js'; // was: BI
import { getPlayerPhase } from '../media/source-buffer.js'; // was: q5
import { publishExternalState } from './playback-state.js'; // was: yw
import { applyVolume } from './playback-state.js'; // was: KH
import { adjustDaiDuration } from './playback-mode.js'; // was: Qw
import { getUNDelay } from './player-events.js'; // was: UN
import { isServerStitchedDai } from './playback-mode.js'; // was: wW
import { isDetailPage } from '../data/performance-profiling.js'; // was: BU
import { getLastActivityMs } from '../data/gel-core.js'; // was: YW
import { clearCsiSessionState } from './video-loader.js'; // was: av3
import { flushLogs } from '../data/gel-core.js'; // was: CL
import { loadPlaylist } from './media-state.js'; // was: cLX
import { startVideoPlayback } from './player-events.js'; // was: SF
import { appendUrlParams } from '../core/misc-helpers.js'; // was: d5
import { getRemoteModule } from './caption-manager.js'; // was: w7
import { isStandardDetailPage } from '../data/bandwidth-tracker.js'; // was: i4
import { getNextPlaylistIndex } from './video-loader.js'; // was: $Jy
import { setPlaylistIndex } from './video-loader.js'; // was: v6
import { getPreviousPlaylistIndex } from './video-loader.js'; // was: Pry
import { extractVideoId } from '../core/composition-helpers.js'; // was: GG
import { buildVideoLoadCacheKey } from './media-state.js'; // was: dW
import { isCompressedDomainComposite } from '../media/audio-normalization.js'; // was: gA
import { isTvUnplugged } from '../data/performance-profiling.js'; // was: Zm
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { generateIntegrityToken } from '../core/event-registration.js'; // was: xd
import { validateGaplessShorts } from '../media/gapless-playback.js'; // was: w67
import { GelPayloadStore } from '../data/idb-operations.js'; // was: fL
import { resetCsiTimer } from './video-loader.js'; // was: jY
import { loadVideoFromData } from './media-state.js'; // was: sH
import { teardownEndscreen } from './playback-mode.js'; // was: tw
import { publishCueRangeEvent } from './playback-state.js'; // was: rW
import { getMetricValues } from '../core/event-system.js'; // was: Ps
import { getAudioTrack, isMutedByMutedAutoplay, loadVideoByPlayerVars, supportsGaplessShorts } from './player-api.js';
import { dispose } from '../ads/dai-cue-range.js';
import { getPlayerState } from './playback-bridge.js';
import { getCurrentTime, getPlaybackRate, setPlaybackRate, getDuration } from './time-tracking.js';
import { CueRange } from '../ui/cue-range.js';
import { getVisibilityState } from '../core/composition-helpers.js';
import { isAutoplayEligible } from '../ads/ad-click-tracking.js';
import { isWebEmbeddedPlayer } from '../data/performance-profiling.js';
import { shallowClone } from '../core/object-utils.js';
import { filter } from '../core/array-utils.js';
import { VideoData } from '../data/device-platform.js';
// TODO: resolve g.h
// TODO: resolve g.rX
// TODO: resolve g.xh

/**
 * Player Events — App-level event handling and playback control.
 *
 * Source: player_es6.vflset/en_US/base.js, lines 119000–120000
 *
 * Contains:
 *  - Video data change events: "videodata", "applicationvideodatachange"
 *  - Audio format change: "internalaudioformatchange"
 *  - Quality change events: "onPlaybackQualityChange"
 *  - SSDAI cleanup: sM (clean ad player slot from state machine)
 *  - SF / nextVideo / previousVideo: video playback control
 *  - cuePlaylist / loadPlaylist / cueVideoByPlayerVars
 *  - Player state handling: uo, dO, w_ (state bit transitions)
 *  - Seeking: seekTo, seekBy, isAtLiveHead, UN delay computation
 *  - Preload management: preloadVideoByPlayerVars, queueNextVideo, T3
 *  - Preload suspension for SSDAI with preroll
 *  - Player state toggling: W(2) ended, W(512) cued state bits
 *  - Fullscreen, PiP, visibility, loop range management
 *
 * @module player/player-events
 */

// ---------------------------------------------------------------------------
// onPlayerRequestSent  (line 119000)
// ---------------------------------------------------------------------------

/**
 * Forward the player request sent event to the external API.
 *
 * [was: onPlayerRequestSent] (line 119000)
 *
 * @param {object} requestData [was: Q]
 */
export function onPlayerRequestSent(app, requestData) { // was: onPlayerRequestSent
  publishEvent(app.ge, "onPlayerRequestSent", requestData);
}

// ---------------------------------------------------------------------------
// Lc — Internal video data change  (lines 119003–119005)
// ---------------------------------------------------------------------------

/**
 * Handle internal video data change and publish to the event bus.
 *
 * On "newdata" change type, also calls `Hi()` to re-initialize the player.
 *
 * [was: Lc] (line 119003)
 *
 * @param {string} changeType [was: Q]
 * @param {object} videoData  [was: c]
 */
export function onInternalVideoDataChange(app, changeType, videoData) { // was: Lc
  if (changeType === "newdata") {
    Hi(app); // was: Hi — re-initialize
  }
  app.ge.publish("applicationvideodatachange", changeType, videoData);
}

// ---------------------------------------------------------------------------
// mp — Internal audio format change  (lines 119007–119011)
// ---------------------------------------------------------------------------

/**
 * Handle internal audio format change.
 *
 * Triggers metadata query (`mq`) and publishes both external and internal
 * audio change events.
 *
 * [was: mp] (line 119007)
 *
 * @param {string} trackId [was: Q] — audio track ID
 * @param {string} mode    [was: c] — change mode
 */
export function onInternalAudioFormatChange(app, trackId, mode) { // was: mp
  mq(app); // was: mq — re-query metadata
  publishEventWithTransport(app.ge, "onPlaybackAudioChange", app.ge.getAudioTrack().miniplayerIcon.name); // was: D1 — track info
  app.ge.publish("internalaudioformatchange", app.ge.getAudioTrack().miniplayerIcon.id, mode);
}

// ---------------------------------------------------------------------------
// hW — Internal video format change  (lines 119012–119015)
// ---------------------------------------------------------------------------

/**
 * Handle video format change and publish quality change event.
 *
 * Only fires when the changed video data matches the presenting player's data.
 *
 * [was: hW] (line 119012)
 *
 * @param {object} changedVideoData [was: Q]
 */
export function onInternalVideoFormatChange(app, changedVideoData) { // was: hW
  const currentVideoData = app.oe().getVideoData(); // was: c
  if (changedVideoData === currentVideoData) {
    publishEventAll(app.ge, "onPlaybackQualityChange", changedVideoData.O.video.quality);
  }
}

// ---------------------------------------------------------------------------
// sM — SSDAI cleanup  (lines 119016–119031)
// ---------------------------------------------------------------------------

/**
 * Clean up SSDAI ad player slot from the player state machine.
 *
 * Removes the ad player (type 2) from `fk.A` and `fk.K`, logging
 * the cleanup via "ssdai" telemetry.
 *
 * [was: sM] (line 119016)
 */
export function cleanupSsdaiAdPlayer(app) { // was: sM
  let adPlayer = app.fk.A[2] || null; // was: Q — ad player in slot 2
  if (!adPlayer) return;

  const adVideoData = adPlayer.getVideoData(); // was: Q (reused)
  app.oe().RetryTimer("ssdai", {
    cleanaply: 1,
    acpn: adVideoData?.clientPlaybackNonce,
    avid: adVideoData.videoId,
    isDai: app.a$().enableServerStitchedDai ? 1 : 0,
  });

  const stateMachine = app.fk; // was: Q (reused)
  const slotPlayer = stateMachine.A[2]; // was: c
  if (slotPlayer) {
    delete stateMachine.K[slotPlayer.Sr()]; // was: Sr — get CPN
    delete stateMachine.A[2];
  }
}

// ---------------------------------------------------------------------------
// rq / Qq — Video data change dispatch  (lines 119032–119090)
// ---------------------------------------------------------------------------

/**
 * Dispatch video data change from the presenting player.
 *
 * [was: rq] (line 119032)
 *
 * @param {string} changeType [was: Q]
 * @param {object} videoData  [was: c]
 */
export function onPresentingVideoDataChange(app, changeType, videoData) { // was: rq
  app.onVideoDataChange(changeType, app.oe(), videoData);
}

/**
 * Central video data change handler.
 *
 * For "newdata": resets CSI timing and publishes "videoplayerreset".
 * For "dataloaded": initializes SSDAI if needed, runs ad deferral,
 *   publishes progress bar boundaries, and fires legacy ad tracking.
 *
 * Also manages:
 *  - SSDAI initialization/teardown (`this.NI`)
 *  - OAuth token propagation (`FI.x3`)
 *  - VE tracker CPN update (`RM.T2`)
 *  - Loop range recalculation (`qU`)
 *
 * Publishes: "videodatachange", "onVideoDataChange", "legacyadtrackingpingchange"
 *
 * [was: Qq] (line 119035)
 *
 * @param {string} changeType  [was: Q]
 * @param {object} player      [was: c] — the player instance that changed
 * @param {object} videoData   [was: W]
 */
export function onVideoDataChange(app, changeType, player, videoData) { // was: Qq
  if (app.FI.cB()) { // was: cB — debug mode
    player.RetryTimer("vdc", {
      type: changeType,
      vid: videoData.videoId || "",
      cpn: videoData.clientPlaybackNonce || "",
    });
  }

  // Propagate OAuth token to config
  if (player === app.timedInvoke()) {
    app.FI.unwrapTrustedResourceUrl = videoData.oauthToken; // was: x3 — OAuth token
  }

  // Initialize or teardown SSDAI
  if (player === app.timedInvoke()) {
    if (app.getVideoData().enableServerStitchedDai && !app.CssTransitionAnimation) {
      app.timedInvoke().RetryTimer("sdai", { initSstm: 1 });
      app.CssTransitionAnimation = new g.rX(app.ge, app.FI, app.timedInvoke(), app); // was: g.rX — SSDAI manager
    } else if (!app.getVideoData().enableServerStitchedDai && app.CssTransitionAnimation) {
      app.CssTransitionAnimation.dispose();
      app.CssTransitionAnimation = null;
    }
  }

  if (changeType === "newdata") {
    // Full reset
    destroyVolatileModules(app.DefaultXmlHttpFactory, 2); // was: Wv — reset module manager
    app.ge.publish("videoplayerreset", player);
  } else {
    if (!app.mediaElement) return;

    if (changeType === "dataloaded") {
      if (app.timedInvoke() === app.oe()) {
        updateClientParams(videoData.LayoutExitedMetadata, videoData.wrapIdbRequest); // was: nD — process ad info
        if (!app.timedInvoke().getPlayerState().isError()) {
          const wasLoading = EH(app); // was: m, EH — was in loading state
          app.a$().isLoaded();
          if (wasLoading) app.Eu(6); // was: Eu — set app state
          JgO(app); // was: JgO — process deferred data
          if (!shouldDeferAdModule(app.DefaultXmlHttpFactory)) Nz(app); // was: Qr, Nz — check/start playback
        }
      } else {
        JgO(app);
      }
    }

    // Main player specific processing
    if (player.getPlayerType() === 1) {
      // Preload with SSDAI suspension
      if (app.FI.MM) configureMediaElementState(app); // was: MM, pC7 — preload suspension

      // Unsupported live check
      if (app.getVideoData().isLivePlayback && !app.FI.t8) { // was: t8 — live supported
        app.bl("html5.unsupportedlive", 2, "DEVICE_FALLBACK");
      }

      // Progress bar boundaries
      if (videoData.isLoaded()) {
        if (l6W(videoData) || app.getVideoData().showSampleSubtitles) { // was: l6W, u9 — legacy ad tracking
          app.ge.publish("legacyadtrackingpingchange", app.getVideoData());
        }

        if (videoData.hasProgressBarBoundaries()) {
          const endMs = Number(app.getVideoData().progressBarEndPosition?.utcTimeMillis) / 1000; // was: m
          if (!isNaN(endMs)) {
            let liveEdge = app.getWallClockTime; // was: K
            if (liveEdge) {
              liveEdge -= app.getCurrentTime();
              let boundaryStart = (endMs - liveEdge) * 1000; // was: m (reused)
              const existingBoundary = app.Fy.progressEndBoundary; // was: K (reused)
              if (existingBoundary?.start !== boundaryStart) {
                if (existingBoundary) app.QX([existingBoundary]);
                const cueRange = new CueRange(boundaryStart, 0x7ffffffffffff, {
                  id: "progressEndBoundary",
                  namespace: "appprogressboundary",
                });
                app.timedInvoke().addCueRange(cueRange);
                app.Fy.progressEndBoundary = cueRange;
              }
            }
          }
        }
      }
    }

    // Publish change events
    app.ge.publish("videodatachange", changeType, videoData, player.getPlayerType());
  }

  publishEventAll(app.ge, "onVideoDataChange", {
    type: changeType,
    playertype: player.getPlayerType(),
  });

  // Recalculate loop range
  app.addToImageCache();

  // Update VE tracker
  const masterVe = videoData.MC; // was: Q (reused) — master VE
  if (masterVe) {
    app.RM.T2(masterVe, videoData.clientPlaybackNonce);
  } else {
    updateVisualElementCSN(app.RM); // was: tcy — refresh VE tracker
  }
}

// ---------------------------------------------------------------------------
// uo — Application player state change  (lines 118948–118988)
// ---------------------------------------------------------------------------

/**
 * Handle state changes for the primary (type 1) presenting player.
 *
 * Key state transitions:
 *  - W(1) starting: if live + at live head + rate > 1, reset to 1x
 *  - W(2) ended:
 *    - If loop range extends to end, restart loop
 *    - Otherwise trigger `z2_` (autonav / autoplay next)
 *  - W(128) error: cancel playback, publish onError / onDetailedError;
 *    if player is > 7 days old, request reload
 *  - Playing + not buffering: measure ad_to_video resume timing
 *
 * Publishes: "applicationplayerstatechange"
 *
 * [was: uo] (line 118948)
 *
 * @param {object} stateChange [was: Q] — { state, previousState, Fq() }
 */
export function onApplicationStateChange(app, stateChange) { // was: uo
  if (app.getPresentingPlayerType() !== 1) return;

  // Starting: clamp playback rate for live at live head
  if (stateChange.Fq(1) && !stateChange.state.W(64)) { // was: Fq — state flag changed
    if (
      app.a$().isLivePlayback &&
      app.timedInvoke().isAtLiveHead() &&
      app.ge.getPlaybackRate() > 1
    ) {
      app.setPlaybackRate(1, true);
    }
  }

  // Ended
  if (stateChange.Fq(2)) {
    if (
      app.captureBandwidthSnapshot && // was: x$ — loop range
      app.captureBandwidthSnapshot.endTimeMs >= (app.getDuration() - 1) * 1000
    ) {
      YCO(app); // was: YCO — restart loop
      return;
    }
    handlePlaybackEnded(app); // was: z2_ — autonav / autoplay next
  }

  // Error
  if (stateChange.state.W(128)) {
    const errorState = stateChange.state; // was: c
    app.cancelPlayback(5);
    const errorData = errorState.Dr; // was: c (reused), Dr — error details

    JSON.stringify({ errorData, debugInfo: app.getDebugText(true) });

    publishEventAll(app.ge, "onError", Gby(errorData.NetworkErrorCode)); // was: Gby — map error code
    publishEventWithTransport(app.ge, "onDetailedError", {
      NetworkErrorCode: errorData.NetworkErrorCode,
      errorDetail: errorData.errorDetail,
      message: errorData.errorMessage,
      messageKey: errorData.restoreAudioTrackPreference, // was: Io — i18n key
      cpn: errorData.cpn,
    });

    // Request reload if player is stale (> 7 days)
    if ((0, g.h)() - app.FI.AA > 604800000) { // was: AA — player creation time
      publishEventWithTransport(app.ge, "onReloadRequired");
    }
  }

  // Ad-to-video resume timing
  const timingData = {}; // was: c (reused)
  if (
    stateChange.state.isPlaying() &&
    !stateChange.state.isBuffering() &&
    !np("pbresume", "ad_to_video") && // was: np — check timing mark
    np("_start", "ad_to_video")
  ) {
    const currentVideoData = app.getVideoData(); // was: W
    timingData.clientPlaybackNonce = currentVideoData.clientPlaybackNonce;
    if (currentVideoData.videoId) timingData.videoId = currentVideoData.videoId;
    g.xh(timingData, "ad_to_video"); // was: g.xh — mark timing
    Bu("pbresume", undefined, "ad_to_video"); // was: Bu — set timing mark
    createDeferredModules(app.DefaultXmlHttpFactory); // was: cv — flush stats
  }

  app.ge.publish("applicationplayerstatechange", stateChange);
}

// ---------------------------------------------------------------------------
// dO — Presenting player state change  (line 118989)
// ---------------------------------------------------------------------------

/**
 * Forward presenting player state change (unless blocked by BI).
 *
 * [was: dO] (line 118989)
 *
 * @param {object} stateChange [was: Q]
 */
export function onPresentingPlayerStateChange(app, stateChange) { // was: dO
  if (!app.fk.DEFAULT_STORE_EXPIRATION_TOKEN) { // was: BI — bypass internal state
    app.ge.publish("presentingplayerstatechange", stateChange);
  }
}

// ---------------------------------------------------------------------------
// w_ — Raw state change handler  (lines 118992–118998)
// ---------------------------------------------------------------------------

/**
 * Handle raw player state changes.
 *
 * Maps state to external state code via `q5()`, and if W(1024) (DOM paused)
 * is set during muted autoplay, unmutes and disables muted autoplay.
 *
 * [was: w_] (line 118992)
 *
 * @param {object} stateChange [was: Q]
 */
export function onRawStateChange(app, stateChange) { // was: w_
  publishExternalState(app, getPlayerPhase(stateChange.state)); // was: yw — publish external state, q5 — map state

  if (stateChange.state.W(1024) && app.ge.isMutedByMutedAutoplay()) {
    applyVolume(app, { muted: false, volume: app.nw.volume }, false); // was: KH — set volume
    Wi(app, false); // was: Wi — clear muted autoplay
  }
}

// ---------------------------------------------------------------------------
// isAtLiveHead  (lines 119130–119137)
// ---------------------------------------------------------------------------

/**
 * Check if the player is at the live stream head.
 *
 * For SSDAI, accounts for the mapped time between ad and content players.
 *
 * [was: isAtLiveHead] (line 119130)
 *
 * @param {number}  [playerType] [was: Q]
 * @param {boolean} [useCurrent] [was: c] — use current time for comparison
 * @returns {boolean}
 */
export function isAtLiveHead(app, playerType, useCurrent = false) { // was: isAtLiveHead
  let player = app.uX({ playerType }); // was: W
  const livePlayer = pt(app, player); // was: Q (reused), pt — get live player
  const timePlayer = ZX(app, player); // was: W (reused), ZX — get time-mapped player

  if (livePlayer !== timePlayer) {
    // SSDAI: check live head using mapped time
    return livePlayer.isAtLiveHead(
      adjustDaiDuration(app, timePlayer.getCurrentTime(), timePlayer), // was: Qw — map time
      true,
    );
  }
  return livePlayer.isAtLiveHead(undefined, useCurrent);
}

// ---------------------------------------------------------------------------
// UN — Delay computation  (lines 119138–119143)
// ---------------------------------------------------------------------------

/**
 * Get the UN (user notification) delay from the live player.
 *
 * Used for computing how far behind the live edge the player is.
 *
 * [was: UN] (line 119138)
 *
 * @returns {number} Delay in seconds
 */
export function getUNDelay(app) { // was: UN
  const player = app.uX({ playerType: undefined }); // was: Q
  return pt(app, player).getUNDelay(); // was: pt — get live player, UN — get delay
}

// ---------------------------------------------------------------------------
// seekTo / seekBy  (lines 119144–119163)
// ---------------------------------------------------------------------------

/**
 * Seek to an absolute time.
 *
 * Dispatches to SSDAI (`NI.seekTo`) or child playback (`Z1.seekTo`)
 * for DAI content, otherwise directly to the player.
 *
 * Logs sabr_csdai_seek if enabled.
 *
 * [was: seekTo] (line 119144)
 *
 * @param {number}  time        [was: Q]
 * @param {boolean} allowSeek   [was: c] — default true
 * @param {number}  seekMode    [was: W] — GM seek mode
 * @param {number}  playerType  [was: m]
 * @param {number}  seekSource  [was: K]
 * @param {string}  tag         [was: T] — log tag
 */
export function seekTo(app, time, allowSeek, seekMode, playerType, seekSource, tag) { // was: seekTo
  allowSeek = allowSeek !== false;

  const player = app.uX({ playerType }); // was: m (reused)

  if (app.appState === 2) qz(app); // was: qz — resume from cued

  if (app.wX(player)) { // was: wX — is SSDAI
    if (isServerStitchedDai(app)) { // was: wW — has NI (SSDAI manager)
      app.CssTransitionAnimation.seekTo(time, { seekSource }, allowSeek, seekMode);
    } else {
      app.Z1.seekTo(time, { seekSource }, allowSeek, seekMode);
    }
  } else {
    if (!app.X("html5_sabr_csdai_seek_log")) tag = ""; // was: tag filter
    player.seekTo(time, {
      b_: !allowSeek, // was: b_ — suppress seek
      GM: seekMode, // was: GM — seek mode
      Z7: "application" + (tag ?? ""), // was: Z7 — seek reason
      seekSource,
    });
  }
}

/**
 * Seek by a relative offset from current time.
 *
 * [was: seekBy] (line 119162)
 *
 * @param {number}  offset     [was: Q]
 * @param {boolean} allowSeek  [was: c]
 * @param {number}  seekMode   [was: W]
 * @param {number}  playerType [was: m]
 */
export function seekBy(app, offset, allowSeek, seekMode, playerType) { // was: seekBy
  app.seekTo(app.getCurrentTime() + offset, allowSeek, seekMode, playerType, undefined, "_by");
}

// ---------------------------------------------------------------------------
// ys — SEEK_TO event  (lines 119174–119180)
// ---------------------------------------------------------------------------

/**
 * Handle a SEEK_TO event from the player.
 *
 * If in app state 1 or 2, sets `startSeconds` on the video data.
 * If in app state 2 and not cued (W(512)), resumes playback.
 *
 * [was: ys] (line 119174)
 *
 * @param {number} seekTime [was: Q]
 */
export function onSeekTo(app, seekTime) { // was: ys
  const player = app.oe(); // was: c
  const videoData = player.getVideoData(); // was: W

  if (app.appState === 1 || app.appState === 2) {
    videoData.startSeconds = seekTime;
  }

  if (app.appState === 2) {
    if (!player.getPlayerState().W(512)) { // W(512) = cued state
      qz(app); // was: qz — resume from cued
    }
  } else {
    publishEventAll(app.ge, "SEEK_TO", seekTime);
  }
}

// ---------------------------------------------------------------------------
// SF — Play video by ID / playlist  (lines 119498–119524)
// ---------------------------------------------------------------------------

/**
 * Start playing a video by ID or playlist, handling embed restrictions.
 *
 * For embedded/restricted contexts, publishes "onPlayVideo" instead of
 * loading directly.
 *
 * [was: SF] (line 119498)
 *
 * @param {string}  videoId       [was: Q]
 * @param {object}  sessionData   [was: c]
 * @param {string}  listId        [was: W]
 * @param {boolean} autoplay      [was: m]
 * @param {*}       _unused       [was: K]
 * @param {object}  watchEndpoint [was: T]
 * @param {string}  oauthToken    [was: r]
 * @returns {boolean} Whether playback started
 */
export function startVideoPlayback(app, videoId, sessionData, listId, autoplay, _unused, watchEndpoint, oauthToken) { // was: SF
  if (!videoId && !listId) {
    throw Error("Playback source is invalid");
  }

  // Embedded / restricted context: delegate to host page
  if (isDetailPage(app.FI) || isUnpluggedPlatform(app.FI)) { // was: BU — is branded, g.Ie — is restricted
    sessionData = sessionData || {};
    sessionData.lact = getLastActivityMs(); // was: YW — last activity time
    sessionData.vis = app.ge.getVisibilityState();
    publishEvent(app.ge, "onPlayVideo", {
      videoId,
      watchEndpoint,
      sessionData,
      listId,
    });
    return false;
  }

  clearCsiSessionState(app.KO); // was: av3 — CSI cleanup
  app.KO.reset();

  const playerVars = { video_id: videoId }; // was: Q (reused)
  if (autoplay) playerVars.autoplay = "1";
  if (autoplay) playerVars.autonav = "1";
  if (watchEndpoint) playerVars.player_params = watchEndpoint.playerParams;
  if (oauthToken) playerVars.oauth_token = oauthToken;

  if (listId) {
    playerVars.list = listId;
    app.loadPlaylist(playerVars);
  } else {
    app.loadVideoByPlayerVars(playerVars, 1);
  }
  return true;
}

// ---------------------------------------------------------------------------
// cuePlaylist / loadPlaylist  (lines 119525–119532)
// ---------------------------------------------------------------------------

/**
 * Cue a playlist (prepare without playing).
 *
 * Sets `this.CL = true` (cue-only mode) and delegates to `cLX`.
 *
 * [was: cuePlaylist] (line 119525)
 *
 * @param {object} listData [was: Q]
 * @param {number} index    [was: c]
 * @param {number} startSec [was: W]
 * @param {*}      extra    [was: m]
 */
export function cuePlaylist(app, listData, index, startSec, extra) { // was: cuePlaylist
  app.flushLogs = true; // was: CL — cue-only flag
  loadPlaylist(app, listData, index, startSec, extra); // was: cLX — internal playlist loader
}

/**
 * Load a playlist (prepare and auto-play).
 *
 * Sets `this.CL = false` (auto-play mode) and delegates to `cLX`.
 *
 * [was: loadPlaylist] (line 119529)
 *
 * @param {object} listData [was: Q]
 * @param {number} index    [was: c]
 * @param {number} startSec [was: W]
 * @param {*}      extra    [was: m]
 */
export function loadPlaylist(app, listData, index, startSec, extra) { // was: loadPlaylist
  app.flushLogs = false;
  loadPlaylist(app, listData, index, startSec, extra);
}

// ---------------------------------------------------------------------------
// nextVideo / previousVideo / playVideoAt  (lines 119536–119550)
// ---------------------------------------------------------------------------

/**
 * Advance to the next video in the playlist.
 *
 * Handles:
 *  - Autoplay next from video data's `mF()` (next video endpoint)
 *  - External list delegation via "onPlaylistNext"
 *  - Remote control via `w7().nextVideo()`
 *  - Direct playlist advancement via `v6` + `$Jy`
 *
 * [was: nextVideo] (line 119536)
 *
 * @param {boolean} [forceNext]    [was: Q]
 * @param {object}  [sessionData]  [was: c]
 */
export function nextVideo(app, forceNext, sessionData) { // was: nextVideo
  const nextEndpoint = app.timedInvoke().getVideoData().mF(); // was: W, mF — next video endpoint

  if (isAutoplayEligible(app.ge) && nextEndpoint) { // was: g.vt — has autoplay capability
    app.startVideoPlayback(
      nextEndpoint.videoId,
      sessionData ? nextEndpoint.appendUrlParams : nextEndpoint.sessionData,
      nextEndpoint.playlistId,
      sessionData,
      undefined,
      nextEndpoint.C5 || undefined, // was: C5 — watch endpoint
    );
  } else if (app.JI) { // was: JI — external list mode
    publishEventWithTransport(app.ge, "onPlaylistNext");
  } else if (app.getPresentingPlayerType() === 3) {
    getRemoteModule(app.DefaultXmlHttpFactory).nextVideo(); // was: w7 — remote control module
  } else if (app.playlist && !(isStandardDetailPage(app.FI) && !app.ge.isFullscreen())) {
    if (app.playlist.hasNext(forceNext)) {
      setPlaylistIndex(app.playlist, getNextPlaylistIndex(app.playlist)); // was: v6 — set index, $Jy — next index
    }
    if (app.playlist.loaded) {
      const isAutonavLog = sessionData && app.FI.X("html5_player_autonav_logging"); // was: Q (reused)
      if (sessionData) app.ge.publish("playlistautonextvideo");
      app.Q0(createVideoDataForPlaylistItem(app.playlist, undefined, sessionData, isAutonavLog), 1); // was: g.fY — get video from playlist
    } else {
      app.flushLogs = false;
    }
  }
}

/**
 * Go to the previous video in the playlist.
 *
 * [was: previousVideo] (line 119543)
 *
 * @param {boolean} [force] [was: Q]
 */
export function previousVideo(app, force) { // was: previousVideo
  if (app.JI) {
    publishEventWithTransport(app.ge, "onPlaylistPrevious");
  } else if (app.getPresentingPlayerType() === 3) {
    getRemoteModule(app.DefaultXmlHttpFactory).Ye(); // was: Ye — previous video
  } else if (app.playlist && !(isStandardDetailPage(app.FI) && !app.ge.isFullscreen())) {
    if (app.playlist.hasPrevious(force)) {
      setPlaylistIndex(app.playlist, getPreviousPlaylistIndex(app.playlist)); // was: Pry — previous index
    }
    if (app.playlist.loaded) {
      app.Q0(createVideoDataForPlaylistItem(app.playlist), 1);
    } else {
      app.flushLogs = false;
    }
  }
}

/**
 * Play a specific video by playlist index.
 *
 * [was: playVideoAt] (line 119547)
 *
 * @param {number} index [was: Q]
 */
export function playVideoAt(app, index) { // was: playVideoAt
  if (app.JI) {
    publishEventWithTransport(app.ge, "onPlaylistIndex", index);
  } else if (app.playlist) {
    if (app.playlist.loaded) {
      app.Q0(createVideoDataForPlaylistItem(app.playlist, index), 1);
    } else {
      app.flushLogs = false;
    }
    setPlaylistIndex(app.playlist, index);
  }
}

// ---------------------------------------------------------------------------
// preloadVideoByPlayerVars  (lines 119386–119404)
// ---------------------------------------------------------------------------

/**
 * Preload a video for potential future playback.
 *
 * Checks the preload cache first; if found, returns the existing player.
 * Otherwise creates a new player in preload mode, stores it in the
 * cache with a TTL, and optionally begins loading.
 *
 * [was: preloadVideoByPlayerVars] (line 119386)
 *
 * @param {object}  playerVars  [was: Q]
 * @param {number}  playerType  [was: c] — default 1
 * @param {number}  ttl         [was: W] — cache TTL in seconds (default NaN → 3600)
 * @param {string}  _unused     [was: m]
 * @param {string}  playbackId  [was: K]
 * @returns {object|null} Preloaded player instance, or null
 */
export function preloadVideoByPlayerVars(app, playerVars, playerType = 1, ttl = NaN, _unused, playbackId = "") { // was: preloadVideoByPlayerVars
  // Build cache key
  const videoId = extractVideoId(playerVars); // was: m (reused), GG — extract video ID
  const cacheKey = `${playerType}_${videoId}_${playbackId}_${+(playerVars.autonav === "1" || playerVars.autonav === true)}${+(playerVars.autoplay === "1" || playerVars.autoplay === true || playerVars.autoplay === 1)}`;

  // Check cache
  let cached = app.fk.D.get(cacheKey) || null; // was: m (reused)
  if (cached) return cached;

  // Create video data and player
  const videoData = new VideoData(app.FI, playerVars); // was: Q (reused)
  if (playbackId) videoData.PJ = playbackId; // was: PJ — playback nonce

  const key = buildVideoLoadCacheKey(playerType, videoData); // was: K (reused), dW — build key
  const currentPlayer = app.oe(); // was: m (reused)
  const currentKey = buildVideoLoadCacheKey(currentPlayer.getPlayerType(), currentPlayer.getVideoData()); // was: T

  if (key === currentKey) {
    // Already playing this video
    currentPlayer.oy(true); // was: oy — mark as preloaded
    videoData.dispose();
    return null;
  }

  // Create preloaded player
  videoData.isCompressedDomainComposite = true; // was: gA — preload flag
  const preloaded = Xf(app, playerType, videoData, true); // was: m (reused), Xf — create player

  // For non-multiview, begin loading
  if (playerType !== 1 || !isTvUnplugged(app.FI) || (app.FI.X("html5_allow_multiview_tile_preload") && videoData.skipNextIcon)) {
    preloaded.oy(true);
  }

  // Store in cache
  app.fk.D.set(key, preloaded, ttl || 3600);
  return preloaded;
}

// ---------------------------------------------------------------------------
// queueNextVideo  (lines 119279–119296)
// ---------------------------------------------------------------------------

/**
 * Queue a video for gapless playback after the current one.
 *
 * Preloads the video, then either sets up gapless transition via
 * `w67` (inline queue) or defers via `xd` (gapless controller).
 *
 * [was: queueNextVideo] (line 119279)
 *
 * @param {object} playerVars   [was: Q]
 * @param {number} playerType   [was: c] — default 1
 * @param {number} ttl          [was: W]
 * @param {string} tag          [was: m]
 * @param {string} playbackId   [was: K]
 */
export function queueNextVideo(app, playerVars, playerType = 1, ttl = NaN, tag = "", playbackId = "") { // was: queueNextVideo
  const preloaded = app.preloadVideoByPlayerVars(playerVars, playerType, ttl, tag, playbackId); // was: Q (reused)
  const currentPlayer = app.oe(); // was: c

  if (!preloaded) return;

  if (app.X("html5_check_queue_on_data_loaded")) {
    // New gapless path
    if (app.G().supportsGaplessShorts() && currentPlayer.getVideoData().J) {
      const gapless = app.generateIntegrityToken; // was: W
      const gaplessConfig = app.tj.K; // was: m
      if (gapless.j !== preloaded) {
        gapless.O = currentPlayer;
        gapless.j = preloaded;
        gapless.A = 1;
        gapless.W = preloaded.getVideoData();
        gapless.K = gaplessConfig;
        if (gapless.W.isLoaded()) {
          gapless.D(); // was: D — process loaded data
        } else {
          gapless.W.subscribe("dataloaded", gapless.D, gapless);
        }
      }
    }
  } else {
    // Legacy gapless path
    const queueResult = validateGaplessShorts(currentPlayer, preloaded, app.tj.K); // was: W (reused), w67
    if (queueResult != null) {
      currentPlayer.RetryTimer("sgap", queueResult);
      if (currentPlayer.getVideoData().J) { // was: J — gapless flag
        currentPlayer.GelPayloadStore(false); // was: fL — finalize
      }
    } else {
      const nextVideoData = preloaded.getVideoData(); // was: Q (reused)
      const gapless = app.generateIntegrityToken; // was: c (reused)
      if (gapless.W !== nextVideoData) {
        gapless.W = nextVideoData;
        gapless.A = 1;
        if (nextVideoData.isLoaded()) {
          gapless.J(); // was: J — process
        } else {
          gapless.W.subscribe("dataloaded", gapless.J, gapless);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Playback control: playVideo, pauseVideo, stopVideo  (lines 119735–119778)
// ---------------------------------------------------------------------------

/**
 * Start or resume video playback.
 *
 * If cued (app state 2), resumes from cue. If ended (W(2)), seeks to 0.
 * Otherwise delegates to the player's `playVideo`.
 *
 * [was: playVideo] (line 119735)
 *
 * @param {number}  [playerType] [was: Q]
 * @param {number}  [seekSource] [was: c]
 */
export function playVideo(app, playerType, seekSource) { // was: playVideo
  const player = app.uX({ playerType }); // was: Q (reused)

  if (app.appState === 2) {
    if (isWebEmbeddedPlayer(app.FI)) resetCsiTimer(app.KO); // was: g.sQ — is Shorts, jY — CSI flush
    qz(app); // was: qz — resume
  } else if (player.getPlayerState().W(2)) { // W(2) = ended
    let source = 36; // was: c (reused)
    if (app.getVideoData().cI()) source = 37; // was: cI — is clip
    app.seekTo(0, undefined, undefined, undefined, source, "_play");
  } else {
    player.playVideo(false, seekSource);
  }
}

/**
 * Pause video playback.
 *
 * [was: pauseVideo] (line 119744)
 *
 * @param {number} [playerType] [was: Q]
 * @param {number} [reason]     [was: c]
 */
export function pauseVideo(app, playerType, reason) { // was: pauseVideo
  app.uX({ playerType }).pauseVideo(reason);
}

/**
 * Stop video and reset to cued state.
 *
 * Creates a new minimal VideoData from the current video's ID and
 * OAuth token, then cues it (entering app state 2).
 *
 * [was: stopVideo] (line 119749)
 *
 * @param {boolean} [markStale] [was: Q] — mark as stale (default false)
 */
export function stopVideo(app, markStale = false) { // was: stopVideo
  const currentData = app.timedInvoke().getVideoData(); // was: c
  const freshData = new VideoData(app.FI, {
    video_id: currentData.Oa || currentData.videoId, // was: Oa — original video ID
    oauth_token: currentData.oauthToken,
  }); // was: W

  freshData.EV = shallowClone(currentData.EV); // was: EV — embed vars, g.za — clone

  if (markStale && !app.webPlayerContextConfig.disableStaleness) {
    freshData.Gs = true; // was: Gs — stale flag
  }

  app.cancelPlayback(6);
  loadVideoFromData(app, freshData, 1); // was: sH — cue video data
}

// ---------------------------------------------------------------------------
// cancelPlayback  (lines 119760–119778)
// ---------------------------------------------------------------------------

/**
 * Cancel current playback for a given reason and optional player type.
 *
 * For SSDAI ad players (type 2) on SSDAI content, logs instead of canceling.
 * Otherwise stops playback, removes cue ranges, and cleans up state.
 *
 * [was: cancelPlayback] (line 119760)
 *
 * @param {number} reason      [was: Q]
 * @param {number} [playerType] [was: c]
 */
export function cancelPlayback(app, reason, playerType) { // was: cancelPlayback
  const player = app.uX({ playerType }); // was: W

  // Skip cancellation for SSDAI ad players
  if (playerType === 2 && player.getPlayerType() === 1 && Xq(app.a$())) { // was: Xq — has SSDAI
    player.RetryTimer("canclpb", { r: "no_adpb_ssdai" });
    return;
  }

  if (app.FI.cB()) { // debug
    player.RetryTimer("canclpb", { r: reason });
  }

  if (app.appState === 1 || app.appState === 2) return;

  if (player === app.oe()) {
    destroyVolatileModules(app.DefaultXmlHttpFactory, reason); // was: Wv — notify modules
  }

  if (playerType === 1) {
    player.stopVideo();
    teardownEndscreen(app); // was: tw — teardown
  }

  player.NE(undefined, true); // was: NE — clear player state
  publishCueRangeEvent(app, "cuerangesremoved", player.gj()); // was: rW, gj — get cue ranges
  player.Dk(); // was: Dk — detach

  if (app.tj && player.isGapless()) {
    player.getMetricValues(true); // was: Ps — remove video element
    player.setMediaElement(app.mediaElement);
  }

  // Track multiview video IDs for re-enter detection
  app.Zb = player
    .getVideoData()
    .Q7() // was: Q7 — get related videos
    .map((v) => v.videoId ?? "")
    .filter((id) => !!id);
}

// ---------------------------------------------------------------------------
// WA — App dispose  (lines 119901–119911)
// ---------------------------------------------------------------------------

/**
 * Dispose the entire player application.
 *
 * Tears down module manager, DAI managers, player state machine,
 * media element, and playlist.
 *
 * [was: WA] (line 119901)
 */
export function disposeApp(app) { // was: WA
  app.DefaultXmlHttpFactory.dispose(); // was: vJ — module manager
  app.uD.dispose(); // was: uD — unknown
  app.Z1.dispose(); // was: Z1 — child playback manager
  if (app.CssTransitionAnimation) app.CssTransitionAnimation.dispose(); // was: NI — SSDAI manager
  app.timedInvoke().dispose();
  app.getMetricValues(); // was: Ps — remove media element
  app.fk.dispose(); // was: fk — state machine
  disposeAll(app.playlist); // was: g.xE — safe dispose
  // super.WA()
}
