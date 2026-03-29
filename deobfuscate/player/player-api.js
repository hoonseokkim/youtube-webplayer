/**
 * PlayerPublicApi — public API surface of the YouTube web player.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~85970–86539
 *
 * This class exposes every method that external embedders (iframe API,
 * page-level JS, companion apps) may call on the player instance.
 * Internally it delegates almost everything to `this.app` (the core
 * player application) or to the UI layer obtained via `this.l9()`.
 *
 * The class extends an unnamed superclass that already provides
 * `this.app`, `this.state`, `this.publish()`, `this.X()`, etc.
 *
 * Only the public-facing portion (lines 85970-86539) is extracted here;
 * private helpers and the superclass are in separate modules.
 *
 * [was: anonymous class — the player's public API object]
 */
import { MetricCondition } from '../data/module-init.js'; // was: X_
import { timedInvoke } from '../core/event-registration.js'; // was: pO
import { LayoutIdExitedTrigger } from '../ads/ad-trigger-types.js'; // was: Lz
import { getEffectiveBandwidth } from '../media/quality-manager.js'; // was: Ib
import { getSelectableVideoFormats } from './context-updates.js'; // was: SZ()
import { checkAdExperiment } from './media-state.js'; // was: qP
import { shouldLoadAsmjsModule } from './caption-manager.js'; // was: pY
import { FieldDescriptor } from '../proto/message-setup.js'; // was: n0
import { skipAdRenderer } from '../core/misc-helpers.js'; // was: vD
import { reevaluateFormat } from './context-updates.js'; // was: iE()
import { resetPlayer } from '../media/source-buffer.js'; // was: on
import { getStreamTimeOffsetNQ } from './time-tracking.js'; // was: NQ()
import { stepGenerator } from '../ads/ad-async.js'; // was: GH
import { DEFAULT_STORE_EXPIRATION_TOKEN } from '../network/innertube-config.js'; // was: BI
import { signalFZUpdate } from './context-updates.js'; // was: Ig()
import { getFormatQualityConstraint } from './context-updates.js'; // was: G3()
import { getChromeVersion } from '../core/composition-helpers.js'; // was: Dw
import { openGcfConfigDb } from '../data/idb-transactions.js'; // was: Vb
import { writeVarintField } from '../proto/varint-decoder.js'; // was: Zq
import { getCurrentTime } from './time-tracking.js';
import { seekTo } from '../ads/dai-cue-range.js';
import { seekBy } from './player-events.js';
import { getPlayerState } from './playback-bridge.js';

// import { Disposable } from '../core/disposable.js';

// ---------------------------------------------------------------------------
// Player state helpers (lines 85983–85998)
// ---------------------------------------------------------------------------

/**
 * Return a plain-object snapshot of the current player state flags.
 *
 * @param {number} [playerType] — player type enum value
 * @returns {{
 *   isBuffering: boolean,
 *   isCued: boolean,
 *   isDomPaused: boolean,
 *   isEnded: boolean,
 *   isError: boolean,
 *   isOrWillBePlaying: boolean,
 *   isPaused: boolean,
 *   isPlaying: boolean,
 *   isSeeking: boolean,
 *   isUiSeeking: boolean,
 *   isUnstarted: boolean
 * }}
 */
// was: Re(Q)
export function getPlayerStateSnapshot(app, playerType) {
  const state = app.getPlayerStateObject(playerType);
  return {
    isBuffering:        state.W(1),       // was: state.W(1)
    isCued:             state.isCued(),
    isDomPaused:        state.W(1024),    // was: state.W(1024)
    isEnded:            state.W(2),       // was: state.W(2)
    isError:            state.W(128),     // was: state.W(128)
    isOrWillBePlaying:  state.isOrWillBePlaying(),
    isPaused:           state.isPaused(),
    isPlaying:          state.isPlaying(),
    isSeeking:          state.W(16),      // was: state.W(16)
    isUiSeeking:        state.W(32),      // was: state.W(32)
    isUnstarted:        state.W(64),      // was: state.W(64)
  };
}

// ---------------------------------------------------------------------------
// Public API methods — seek / navigation
// ---------------------------------------------------------------------------

/**
 * @mixin PlayerPublicApi
 *
 * Below are the individual method bodies extracted from the player's
 * public API prototype.  In the original source these live on a single
 * class; they are documented individually here for clarity.
 */

/** Create the subtitles module if it has not been created yet. */
// was: (line 85999)
export function createSubtitlesModuleIfNeeded(app) {
  return app.createSubtitlesModuleIfNeeded();
}

/**
 * Mark the start of a seek CSI (client-side instrumentation) action by
 * recording the current high-resolution timestamp.
 *
 * was: startSeekCsiAction (line 86002)
 */
export function startSeekCsiAction(app) {
  app.MetricCondition().j.W = performance.now(); // was: (0, g.h)()
}

/**
 * Get the current playback time for a given player type / CPN.
 *
 * @param {number}  [playerType=1] — player type enum [was: Q]
 * @param {*}       [wj]           — unknown flag     [was: c]
 * @param {string}  [cpn]          — client playback nonce [was: W]
 * @returns {number}
 *
 * was: jG(Q=1, c, W) (line 86006)
 */
export function getCurrentTimeForPlayerType(api, playerType = 1, wj, cpn) {
  return api.getCurrentTime({ playerType, wj, cpn });
}

/**
 * Seek to a specific stream time (absolute wall-clock for live).
 *
 * @param {number}  streamTimeSeconds [was: Q]
 * @param {*}       param2            [was: c]
 * @param {*}       param3            [was: W]
 * @param {*}       param4            [was: m]
 *
 * was: seekToStreamTime (line 86013)
 */
export function seekToStreamTime(app, streamTimeSeconds, param2, param3, param4) {
  // was: ZvK(this.app, Q, c, W, m)
  // ZvK is the internal seek-to-stream-time helper
  app.seekToStreamTime(streamTimeSeconds, param2, param3, param4);
}

/**
 * @returns {number} the offset between stream time and media time
 *
 * was: getStreamTimeOffset (line 86016)
 */
export function getStreamTimeOffset(app) {
  return app.timedInvoke().getStreamTimeOffset(); // was: this.app.pO().getStreamTimeOffset()
}

/**
 * Seek to the live head (Infinity) if the current video is a live playback.
 *
 * @param {*} param1 [was: Q]
 * @param {*} param2 [was: c]
 *
 * was: seekToLiveHead (line 86019)
 */
export function seekToLiveHead(app, param1, param2) {
  const videoData = app.timedInvoke().getVideoData(); // was: W
  if (videoData && videoData.isLivePlayback) {
    // was: Y$(this.app, Infinity, Q, c, 1)
    app.seekTo(Infinity, param1, param2, 1);
  }
}

/**
 * Request a seek to an absolute wall-time in seconds.
 *
 * was: requestSeekToWallTimeSeconds (line 86023)
 */
export function requestSeekToWallTimeSeconds(app, wallTimeSeconds, param2, param3) {
  app.timedInvoke().H7(wallTimeSeconds, param2, param3); // was: H7
}

/**
 * Public seekTo wrapper. Delegates to the internal `seekTo`.
 *
 * @param {number} seconds    [was: Q]
 * @param {*}      param2     [was: c]
 * @param {*}      param3     [was: W]
 * @param {number} [playerType=1] [was: m]
 * @param {*}      [param5]   [was: K]
 *
 * was: qY(Q, c, W, m=1, K) (line 86026)
 */
export function seekToPublic(api, seconds, param2, param3, playerType = 1, param5) {
  api.seekTo(seconds, param2, param3, playerType, param5);
}

/**
 * Public seekBy wrapper. Delegates to the internal `seekBy`.
 *
 * @param {number} deltaSeconds [was: Q]
 * @param {*}      param2       [was: c]
 * @param {*}      param3       [was: W]
 * @param {*}      param4       [was: m]
 *
 * was: FO(Q, c, W, m) (line 86029)
 */
export function seekByPublic(api, deltaSeconds, param2, param3, param4) {
  api.seekBy(deltaSeconds, param2, param3, param4, 1);
}

// ---------------------------------------------------------------------------
// Prefetch methods
// ---------------------------------------------------------------------------

/**
 * Prefetch a key-play (e.g. next video in a playlist).
 *
 * was: prefetchKeyPlay (line 86032)
 */
export function prefetchKeyPlay(app, keyPlayParams, param2) {
  app.timedInvoke().prefetchKeyPlay(keyPlayParams, param2);
}

/**
 * Prefetch a jump-ahead segment.
 *
 * was: prefetchJumpAhead (line 86035)
 */
export function prefetchJumpAhead(app, jumpParams) {
  app.timedInvoke().prefetchJumpAhead(jumpParams);
}

// ---------------------------------------------------------------------------
// Volume methods
// ---------------------------------------------------------------------------

/**
 * Set the player volume.
 *
 * @param {number}  volume     — 0-100
 * @param {boolean} [notify=true] — whether to fire the volume-change event
 *
 * was: setVolume(Q, c=!0) (line 86038)
 */
export function setVolume(api, volume, notify = true) {
  api.LayoutIdExitedTrigger(volume, notify); // was: this.Lz(Q, c)
}

/**
 * Mute the player.
 *
 * @param {boolean} [notify=true]
 * was: mute(Q=!0) (line 86041)
 */
export function mute(api, notify = true) {
  api.bO(notify); // was: this.bO(Q)
}

/**
 * Un-mute the player.
 *
 * @param {boolean} [notify=true]
 * was: unMute(Q=!0) (line 86044)
 */
export function unMute(api, notify = true) {
  api.getEffectiveBandwidth(notify); // was: this.Ib(Q)
}

/**
 * Re-sync the volume state from the underlying media element to the
 * player's volume controller.
 *
 * was: syncVolume (line 86047)
 */
export function syncVolume(app) {
  const volumeState = app.getVolumeState(); // was: Eg7(this.app)
  app.setVolumeState({ volume: volumeState.volume, muted: volumeState.muted }, false);
  // was: KH(this.app, { volume: Q.volume, muted: Q.muted }, !1)
}

// ---------------------------------------------------------------------------
// Quality / label helpers
// ---------------------------------------------------------------------------

/**
 * @returns {string[]} quality labels for all available quality levels
 *
 * was: getAvailableQualityLabels (line 86054)
 */
export function getAvailableQualityLabels(app) {
  return app.timedInvoke().getSelectableVideoFormats.map(q => q.qualityLabel); // was: g.hy(..., Q => Q.qualityLabel)
}

// ---------------------------------------------------------------------------
// Channel subscription signals
// ---------------------------------------------------------------------------

/**
 * Notify the player that the user subscribed to the channel.
 * was: channelSubscribed (line 86057)
 */
export function channelSubscribed(api) {
  // was: g.xt(this, "SUBSCRIBE", this.app.a$().nB)
  api.publish("SUBSCRIBE", api.app.a$().nB);
}

/**
 * Notify the player that the user unsubscribed from the channel.
 * was: channelUnsubscribed (line 86060)
 */
export function channelUnsubscribed(api) {
  api.publish("UNSUBSCRIBE", api.app.a$().nB);
}

// ---------------------------------------------------------------------------
// Screen layer
// ---------------------------------------------------------------------------

/**
 * Set the current screen layer (e.g. for picture-in-picture overlay).
 * was: setScreenLayer (line 86063)
 */
export function setScreenLayer(app, layer) {
  app.setScreenLayer(layer);
}

// ---------------------------------------------------------------------------
// Playlist sequence
// ---------------------------------------------------------------------------

/**
 * @returns {*} the playlist sequence for the current playback time
 * was: getCurrentPlaylistSequence (line 86066)
 */
export function getCurrentPlaylistSequence(app) {
  return app.oe().getPlaylistSequenceForTime(app.getCurrentTime());
}

/**
 * @param {number} time — seconds
 * @returns {*} the playlist sequence for the given time
 * was: getPlaylistSequenceForTime (line 86069)
 */
export function getPlaylistSequenceForTime(app, time) {
  return app.oe().getPlaylistSequenceForTime(time);
}

// ---------------------------------------------------------------------------
// Misc boolean queries
// ---------------------------------------------------------------------------

/**
 * Always returns true — this player supports sending visibility state.
 * was: shouldSendVisibilityState (line 86072)
 */
export function shouldSendVisibilityState() {
  return true; // was: !0
}

// ---------------------------------------------------------------------------
// YPC (YouTube Paid Content) rental
// ---------------------------------------------------------------------------

/**
 * Confirm a YPC rental activation.
 * was: confirmYpcRental (line 86075)
 */
export function confirmYpcRental(app) {
  app.timedInvoke().checkAdExperiment("ypcRentalActivation"); // was: this.app.pO().qP("ypcRentalActivation")
}

// ---------------------------------------------------------------------------
// Living room / home group settings
// ---------------------------------------------------------------------------

/**
 * Set the home group info for the player environment.
 * was: setHomeGroupInfo (line 86078)
 */
export function setHomeGroupInfo(app, homeGroupInfo) {
  app.G().homeGroupInfo = homeGroupInfo;
}

/**
 * was: setConnectedRemoteApps (line 86081)
 */
export function setConnectedRemoteApps(app, remoteApps) {
  app.G().shouldLoadAsmjsModule = remoteApps; // was: this.app.G().pY = Q
}

/**
 * was: setLivingRoomAppMode (line 86084)
 */
export function setLivingRoomAppMode(app, mode) {
  // was: O1("LIVING_ROOM_APP_MODE_UNSPECIFIED", Q, gL3)
  app.G().livingRoomAppMode = mode;
}

/**
 * Enable or disable privacy filter.
 * was: setEnablePrivacyFilter(Q=!1) (line 86087)
 */
export function setEnablePrivacyFilter(app, enable = false) {
  app.G().enablePrivacyFilter = enable;
}

// ---------------------------------------------------------------------------
// Picture-in-Picture
// ---------------------------------------------------------------------------

/**
 * Toggle Picture-in-Picture mode.
 * was: togglePictureInPicture (line 86090)
 */
export function togglePictureInPicture(app) {
  app.togglePictureInPicture();
}

// ---------------------------------------------------------------------------
// UTC cue ranges
// ---------------------------------------------------------------------------

/**
 * Add a UTC-based cue range to the player.
 *
 * was: addUtcCueRange (line 86093)
 */
export function addUtcCueRange(app, id, startUtc, endUtc, param4, param5) {
  // was: si0(this.app, Q, c, W, m, K)
  return app.addUtcCueRange(id, startUtc, endUtc, param4, param5);
}

// ---------------------------------------------------------------------------
// Video info snapshot — sC (line 86096)
// ---------------------------------------------------------------------------

/**
 * Build a rich metadata snapshot of the current video for external consumers.
 * Includes progress bar boundaries, YPC info, premiere state, etc.
 *
 * @param {number} [playerType=1]
 * @returns {Object} metadata object
 *
 * was: sC(Q=1) (line 86096)
 */
export function getVideoInfoSnapshot(api, playerType = 1) {
  const info = api.FieldDescriptor(playerType); // was: this.n0(Q) — base info object
  const videoData = api.app.uX({ playerType }).getVideoData(); // was: Q

  info.hasProgressBarBoundaries  = videoData.hasProgressBarBoundaries();
  info.isPremiere                = videoData.isPremiere;
  info.itct                      = videoData.S;            // was: Q.S — impression tracking token
  info.playerResponseCpn         = videoData.playerResponseCpn;

  info.progressBarStartPositionUtcTimeMillis =
    videoData.hasProgressBarBoundaries() && videoData.progressBarStartPosition?.utcTimeMillis
      ? Number(videoData.progressBarStartPosition.utcTimeMillis) // was: ZQ(...)
      : null;

  info.progressBarEndPositionUtcTimeMillis =
    videoData.hasProgressBarBoundaries() && videoData.progressBarEndPosition?.utcTimeMillis
      ? Number(videoData.progressBarEndPosition.utcTimeMillis)
      : null;

  info.ypcOriginalItct                   = videoData.skipAdRenderer;   // was: Q.vD
  info.ypcPreview                        = videoData.ypcPreview;
  info.paidContentOverlayText            = videoData.paidContentOverlayText;   // was: rm_(Q)
  info.paidContentOverlayDurationMs      = videoData.paidContentOverlayDuration; // was: UlW(Q)

  if (videoData.W && videoData.W.isLocalMedia?.()) {
    info.usingLocalMedia = "true"; // was: sm(Q.W) check
  }

  info.transitionEndpointAtEndOfStream = videoData.transitionEndpointAtEndOfStream;
  info.isSeekable                      = videoData.isSeekable;

  return info;
}

// ---------------------------------------------------------------------------
// Ad / error state queries
// ---------------------------------------------------------------------------

/**
 * @returns {*} the current ad state
 * was: getAdState (line 86116)
 */
export function getAdState(app) {
  return app.getAdState();
}

/**
 * Check whether a video is not servable (e.g. error 5).
 *
 * @param {string} videoId
 * @returns {boolean}
 *
 * was: isNotServable(Q) (line 86119)
 */
export function isNotServable(app, videoId) {
  if (videoId !== app.IG.video_id) return false; // was: !1
  const playerState = app.timedInvoke().getPlayerState(); // was: Q
  const errorDetail = playerState ? playerState.Dr : null; // was: c
  return !!(playerState && errorDetail && playerState.W(128) && errorDetail.NetworkErrorCode === 5);
  // was: Gby(c.errorCode) === 5
}

// ---------------------------------------------------------------------------
// Gapless playback
// ---------------------------------------------------------------------------

/**
 * was: supportsGaplessAudio (line 86125)
 */
export function supportsGaplessAudio(app) {
  return app.G().supportsGaplessAudio();
}

/**
 * was: supportsGaplessShorts (line 86128)
 */
export function supportsGaplessShorts(app) {
  return app.G().supportsGaplessShorts();
}

/**
 * was: isGaplessTransitionReady(Q) (line 86131)
 */
export function isGaplessTransitionReady(app, param) {
  return app.Bc(param); // was: this.app.Bc(Q)
}

/**
 * Enqueue a video for gapless transition.
 *
 * was: enqueueVideoByPlayerVars(Q, c, W=Infinity, m="") (line 86134)
 */
export function enqueueVideoByPlayerVars(app, playerVars, param2, startTime = Infinity, param4 = "") {
  app.enqueueVideoByPlayerVars(playerVars, param2, startTime, param4);
}

/**
 * was: clearQueue (line 86137)
 */
export function clearQueue(app) {
  app.clearQueue();
}

// ---------------------------------------------------------------------------
// Abandonment ping
// ---------------------------------------------------------------------------

/**
 * Send an abandonment ping (e.g. when the user leaves the page).
 * was: sendAbandonmentPing (line 86143)
 */
export function sendAbandonmentPing(app) {
  app.oe().sendAbandonmentPing();
}

// ---------------------------------------------------------------------------
// Autonav (autoplay)
// ---------------------------------------------------------------------------

/**
 * Set the autonavigation state. Respects server-provided state when the
 * experiment `web_player_autonav_use_server_provided_state` is enabled.
 *
 * States: 1 = OFF, 2 = ON, 3 = PAUSED (temporary off)
 *
 * @param {number}  state       — autonav state enum [was: Q]
 * @param {boolean} [force=false] — bypass server state [was: c]
 *
 * was: setAutonavState(Q, c=!1) (line 86146)
 */
export function setAutonavState(api, state, force = false) {
  if (api.X("web_player_autonav_use_server_provided_state") && !force) {
    const controller = api.app.a$(); // was: c
    if (controller?.K7()) {
      if (state === 3) {
        if (controller.autonavState !== 3) {
          controller.a4 = controller.autonavState; // was: c.a4 = c.autonavState
        }
      } else if (controller.a4 !== undefined) { // was: void 0
        state = controller.a4;
        controller.a4 = undefined; // was: void 0
      } else {
        return;
      }
    }
  }
  api.app.setAutonavState(state); // was: dc7(this.app, Q)
}

/**
 * Convenience wrapper: set autonav on or off.
 *
 * @param {boolean} enabled
 * @param {boolean} [force=false]
 *
 * was: setAutonav(Q, c=!1) (line 86158)
 */
export function setAutonav(api, enabled, force = false) {
  setAutonavState(api, enabled ? 2 : 1, force);
}

// ---------------------------------------------------------------------------
// Loop range
// ---------------------------------------------------------------------------

/**
 * was: setLoopRange (line 86161)
 */
export function setLoopRange(app, range) {
  app.setLoopRange(range);
}

/**
 * was: getLoopRange (line 86164)
 */
export function getLoopRange(app) {
  return app.getLoopRange();
}

// ---------------------------------------------------------------------------
// Audio track selection
// ---------------------------------------------------------------------------

/**
 * was: hasSupportedAudio51Tracks (line 86167)
 */
export function hasSupportedAudio51Tracks(app) {
  return app.timedInvoke().hasSupportedAudio51Tracks();
}

/**
 * was: setUserAudio51Preference(Q, c=!1) (line 86170)
 */
export function setUserAudio51Preference(app, preference, forceReload = false) {
  app.timedInvoke().setUserAudio51Preference(preference, forceReload);
}

/**
 * was: getUserAudio51Preference (line 86173)
 */
export function getUserAudio51Preference(app) {
  return app.timedInvoke().getUserAudio51Preference();
}

// ---------------------------------------------------------------------------
// Proxima (ultra-low-latency) latency preference
// ---------------------------------------------------------------------------

/**
 * was: setProximaLatencyPreference (line 86176)
 */
export function setProximaLatencyPreference(app, preference) {
  app.timedInvoke().setProximaLatencyPreference(preference);
}

/**
 * was: getProximaLatencyPreference (line 86179)
 */
export function getProximaLatencyPreference(app) {
  return app.timedInvoke().getProximaLatencyPreference();
}

/**
 * was: isProximaLatencyEligible (line 86182)
 */
export function isProximaLatencyEligible(app) {
  return app.timedInvoke().isProximaLatencyEligible();
}

// ---------------------------------------------------------------------------
// App state / misc
// ---------------------------------------------------------------------------

/**
 * was: getAppState (line 86185)
 */
export function getAppState(app) {
  return app.getAppState();
}

/**
 * Update the global "last active" timestamp (idle detection).
 * was: updateLastActiveTime (line 86188)
 */
export function updateLastActiveTime() {
  // was: eI() — global idle timer reset
}

/**
 * was: setBlackout (line 86191)
 */
export function setBlackout(app, blackout) {
  app.setBlackout(blackout);
}

/**
 * Update the user-engagement flag and trigger an internal refresh.
 * was: setUserEngagement(Q) (line 86194)
 */
export function setUserEngagement(app, engaged) {
  if (app.G().ObservableTarget !== engaged) { // was: this.app.G().W1 !== Q
    app.G().ObservableTarget = engaged;
    app.timedInvoke().reevaluateFormat; // was: this.app.pO().iE() — internal engagement refresh
  }
}

// ---------------------------------------------------------------------------
// Subtitles / captions
// ---------------------------------------------------------------------------

/**
 * Update the user's subtitle appearance settings.
 * was: updateSubtitlesUserSettings(Q, c=!0) (line 86198)
 */
export function updateSubtitlesUserSettings(app, settings, persist = true) {
  app.CO().getSubtitlesModule().RJ(settings, persist);
  // was: g.hT(this.app.CO()).RJ(Q, c)
}

/**
 * was: getCaptionWindowContainerId (line 86201)
 */
export function getCaptionWindowContainerId(app) {
  const subtitles = app.CO().getSubtitlesModule(); // was: g.hT(this.app.CO())
  return subtitles ? subtitles.getCaptionWindowContainerId() : "";
}

/**
 * Toggle subtitles visibility on/off.
 * was: toggleSubtitlesOn(Q) (line 86205)
 */
export function toggleSubtitlesOn(app, resetPlayer) {
  const subtitles = app.CO().getSubtitlesModule();
  if (subtitles) subtitles.D8(resetPlayer); // was: c.D8(Q)
}

/**
 * @returns {boolean}
 * was: isSubtitlesOn (line 86209)
 */
export function isSubtitlesOn(app) {
  const subtitles = app.CO().getSubtitlesModule();
  return subtitles ? subtitles.isSubtitlesOn() : false; // was: !1
}

// ---------------------------------------------------------------------------
// Response accessors
// ---------------------------------------------------------------------------

/**
 * Get the full playerResponse for a given player type.
 * was: getPlayerResponse(Q) (line 86213)
 */
export function getPlayerResponse(app, playerType) {
  return app.uX({ playerType }).getVideoData().getPlayerResponse();
}

/**
 * Shorthand: get playerResponse for the primary player (type 1).
 * was: Y0() (line 86218)
 */
export function getPrimaryPlayerResponse(app) {
  return getPlayerResponse(app, 1);
}

/**
 * was: getEmbeddedPlayerResponse (line 86221)
 */
export function getEmbeddedPlayerResponse(app) {
  return app.timedInvoke().getVideoData().getEmbeddedPlayerResponse();
}

/**
 * was: getWatchNextResponse(Q) (line 86224)
 */
export function getWatchNextResponse(app, playerType) {
  return app.uX({ playerType }).getVideoData().getWatchNextResponse();
}

/**
 * Shorthand: primary player watch-next response.
 * was: Xw() (line 86229)
 */
export function getPrimaryWatchNextResponse(app) {
  return getWatchNextResponse(app, 1);
}

/**
 * was: getHeartbeatResponse(Q) (line 86232)
 */
export function getHeartbeatResponse(app, playerType) {
  return app.uX({ playerType }).getVideoData().getHeartbeatResponse();
}

/**
 * Shorthand: primary player heartbeat response.
 * was: HA() (line 86237)
 */
export function getPrimaryHeartbeatResponse(app) {
  return getHeartbeatResponse(app, 1);
}

// ---------------------------------------------------------------------------
// Storyboard
// ---------------------------------------------------------------------------

/**
 * Get a specific storyboard sprite-sheet frame for a given time and level.
 *
 * @param {number} time  — seconds
 * @param {number} level — storyboard level index
 * @returns {{ column, columns, height, row, rows, url, width } | null}
 *
 * was: getStoryboardFrame(Q, c) (line 86240)
 */
export function getStoryboardFrame(app, time, level) {
  const storyboard = app.sV(); // was: W
  if (!storyboard) return null;
  const levelData = storyboard.levels[level]; // was: c
  if (!levelData) return null;
  const frame = levelData.getFrame(time); // was: g.XG(c, Q)
  if (!frame) return null;
  return {
    column:  frame.column,
    columns: frame.columns,
    height:  frame.lL,     // was: Q.lL — frame height
    row:     frame.row,
    rows:    frame.rows,
    url:     frame.url,
    width:   frame.Ab,     // was: Q.Ab — frame width
  };
}

/**
 * Get the storyboard frame index for a given time and level.
 *
 * @param {number} time  — seconds
 * @param {number} level — storyboard level index
 * @returns {number} frame index, or -1 if not available
 *
 * was: getStoryboardFrameIndex(Q, c) (line 86255)
 */
export function getStoryboardFrameIndex(api, time, level) {
  const storyboard = api.app.sV();
  if (!storyboard) return -1;
  const levelData = storyboard.levels[level];
  if (!levelData) return -1;
  const adjustedTime = time - api.getStreamTimeOffsetNQ; // was: Q -= this.NQ()
  return levelData.j(adjustedTime);
}

/**
 * Get metadata for a storyboard level.
 *
 * @param {number} levelIndex
 * @returns {{ index, intervalMs, maxFrameIndex, minFrameIndex } | null}
 *
 * was: getStoryboardLevel(Q) (line 86265)
 */
export function getStoryboardLevel(app, levelIndex) {
  const storyboard = app.sV();
  if (!storyboard) return null;
  const level = storyboard.levels[levelIndex];
  if (!level) return null;
  return {
    index:         levelIndex,
    intervalMs:    level.W,     // was: c.W
    maxFrameIndex: level.O(),   // was: c.O()
    minFrameIndex: level.D(),   // was: c.D()
  };
}

/**
 * @returns {number} number of storyboard levels available
 * was: getNumberOfStoryboardLevels (line 86274)
 */
export function getNumberOfStoryboardLevels(app) {
  const storyboard = app.sV();
  return storyboard ? storyboard.levels.length : 0;
}

// ---------------------------------------------------------------------------
// Audio track
// ---------------------------------------------------------------------------

/**
 * Get the current audio track for the primary player.
 * was: Ie() (line 86285)
 */
export function getPrimaryAudioTrack(api) {
  return api.getAudioTrack(1);
}

/**
 * Get the current audio track for a given player type.
 * was: getAudioTrack(Q) (line 86288)
 */
export function getAudioTrack(app, playerType) {
  return app.uX({ playerType }).getAudioTrack();
}

/**
 * Set the active audio track.
 *
 * @param {*}      trackId     [was: Q]
 * @param {*}      param2      [was: c]
 * @param {number} [playerType] [was: W]
 * @returns {boolean} whether the track was actually changed
 *
 * was: setAudioTrack(Q, c, W) (line 86298)
 */
export function setAudioTrack(api, trackId, param2, playerType) {
  const menuHandler = api.app.stepGenerator().DEFAULT_STORE_EXPIRATION_TOKEN; // was: m
  if (menuHandler) menuHandler.s2(trackId); // was: m.s2(Q)
  const changed = api.app.uX({ playerType }).s2(trackId, param2);
  if (changed) api.signalFZUpdate; // was: this.Ig() — filter audio features
  return changed;
}

/**
 * Shorthand: set audio track for primary player.
 * was: rX(Q, c) (line 86306)
 */
export function setPrimaryAudioTrack(api, trackId, param2) {
  return setAudioTrack(api, trackId, param2, 1);
}

/**
 * Get available audio tracks for the primary player.
 * was: MM() (line 86309)
 */
export function getPrimaryAvailableAudioTracks(api) {
  return api.getAvailableAudioTracks(1);
}

/**
 * was: getAvailableAudioTracks(Q) (line 86312)
 */
export function getAvailableAudioTracks(app, playerType) {
  return app.uX({ playerType }).getAvailableAudioTracks();
}

// ---------------------------------------------------------------------------
// Playback quality
// ---------------------------------------------------------------------------

/**
 * Get the maximum playback quality string.
 * was: getMaxPlaybackQuality (line 86317)
 */
export function getMaxPlaybackQuality(app) {
  const player = app.timedInvoke();
  return player.getVideoData().O ? player.getFormatQualityConstraint.qualityLabel : "unknown";
  // was: Em(Q.G3()) — quality enum to label
}

/**
 * was: getUserPlaybackQualityPreference (line 86321)
 */
export function getUserPlaybackQualityPreference(app) {
  return app.timedInvoke().getUserPlaybackQualityPreference();
}

/**
 * Set the desired playback quality range.
 *
 * @param {string} minQuality  [was: Q]
 * @param {string} [maxQuality] [was: c] — defaults to minQuality
 * @param {*}      [param3]    [was: W]
 * @param {number} [playerType] [was: m]
 *
 * was: setPlaybackQualityRange(Q, c, W, m) (line 86430)
 */
export function setPlaybackQualityRange(app, minQuality, maxQuality, param3, playerType) {
  app.uX({ playerType }).getChromeVersion(
    { min: minQuality, max: maxQuality || minQuality, user: true, source: "m" },
    // was: g.ya(Q, c || Q, !0, "m")
    true,
    param3
  );
}

/**
 * Shorthand: set quality range for primary player.
 * was: YR(Q, c, W) (line 86435)
 */
export function setPrimaryPlaybackQualityRange(api, minQuality, maxQuality, param3) {
  setPlaybackQualityRange(api.app, minQuality, maxQuality, param3, 1);
}

// ---------------------------------------------------------------------------
// Subtitles user settings
// ---------------------------------------------------------------------------

/**
 * was: getSubtitlesUserSettings (line 86324)
 */
export function getSubtitlesUserSettings(app) {
  const subtitles = app.CO().getSubtitlesModule();
  return subtitles ? subtitles.oi() : null; // was: Q.oi()
}

/**
 * was: resetSubtitlesUserSettings (line 86328)
 */
export function resetSubtitlesUserSettings(app) {
  app.CO().getSubtitlesModule().openGcfConfigDb(); // was: g.hT(this.app.CO()).Vb()
}

// ---------------------------------------------------------------------------
// UI / display state
// ---------------------------------------------------------------------------

/**
 * was: setMinimized(Q) (line 86331)
 */
export function setMinimized(app, minimized) {
  app.setMinimized(minimized);
}

/**
 * Publish an overlay visibility change event.
 * was: setOverlayVisibility(Q) (line 86334)
 */
export function setOverlayVisibility(api, visible) {
  api.publish("overlayvisibilitychange", visible);
}

/**
 * was: setInlinePreview(Q) (line 86337)
 */
export function setInlinePreview(app, inlinePreview) {
  app.setInlinePreview(inlinePreview);
}

/**
 * was: setSqueezeback(Q) (line 86340)
 */
export function setSqueezeback(app, squeezeback) {
  app.setSqueezeback(squeezeback);
}

/**
 * was: setGlobalCrop(Q) (line 86343)
 */
export function setGlobalCrop(app, crop) {
  app.bX().setGlobalCrop(crop); // was: this.app.bX().setGlobalCrop(Q)
}

/**
 * Set app-fullscreen mode (state 4) or exit (state 0).
 * was: setAppFullscreen(Q) (line 86346)
 */
export function setAppFullscreen(app, fullscreen) {
  app.Z0(fullscreen ? 4 : 0); // was: this.app.Z0(Q ? 4 : 0)
}

/**
 * Get the visibility state manager.
 * was: OV() (line 86349)
 */
export function getVisibilityManager(app) {
  return app.OV();
}

/**
 * Compute the full visibility state from multiple signals.
 * was: getVisibilityState (line 86352)
 */
export function getVisibilityState(api) {
  return api.OV().getVisibilityState(
    api.M6(),
    api.Xg() || api.app.G().isBackgroundable(),
    api.isMinimized(),
    api.isInline(),
    api.app.Zh(),
    api.app.hs(),
    api.app.writeVarintField(),
    api.app.d7()
  );
}

/**
 * was: isMutedByMutedAutoplay (line 86355)
 */
export function isMutedByMutedAutoplay(app) {
  return app.Ec; // was: this.app.Ec
}

/**
 * was: isMutedByEmbedsMutedAutoplay (line 86358)
 */
export function isMutedByEmbedsMutedAutoplay(app) {
  return app.isEmbedsMutedAutoplay(); // was: yS(this.app)
}

/**
 * Set the internal (layout) size of the player.
 * was: setInternalSize(Q, c) (line 86361)
 */
export function setInternalSize(app, width, height) {
  app.bX().setInternalSize({ width, height }); // was: new g.JP(Q,c)
}

// ---------------------------------------------------------------------------
// Playlist management
// ---------------------------------------------------------------------------

/**
 * Update the playlist data.  If `playlistData` is null/undefined, triggers
 * a full playlist refresh.
 *
 * was: updatePlaylist(Q) (line 86387)
 */
export function updatePlaylist(api, playlistData) {
  if (!playlistData) {
    api.app.updatePlaylist();
    return;
  }

  let currentListId = api.getPlaylistId();
  let listChanged = false;
  if (currentListId && currentListId !== playlistData.list) {
    listChanged = true;
  }

  if (playlistData.external_list !== undefined) { // was: void 0
    api.app.JI = playlistData.external_list; // was: gL(!1, Q.external_list)
  }

  const videos = playlistData.video;
  const playlist = api.app.getPlaylist();

  if (playlist && !listChanged) {
    if (api.isFullscreen()) {
      const currentVideo = videos[playlist.index];
      if (!currentVideo || currentVideo.encrypted_id !== playlist.getCurrentVideoId()) {
        // keep current index
      } else {
        playlistData.index = playlist.index;
      }
    }
  } else {
    api.app.initPlaylist({
      list: playlistData.list,
      index: playlistData.index,
      playlist_length: videos.length,
    });
    // was: oE(this.app, {...})
  }

  api.app.getPlaylist().update(playlistData); // was: GFW(...)
  api.publish("onPlaylistUpdate"); // was: g.tV(this, "onPlaylistUpdate")
}

// ---------------------------------------------------------------------------
// Video / environment data updates
// ---------------------------------------------------------------------------

/**
 * Merge partial data into the current video data.
 * was: updateVideoData(Q, c) (line 86404)
 */
export function updateVideoData(app, data, param2) {
  app.timedInvoke().getVideoData().merge(data, param2); // was: g.Sm(...)
}

/**
 * Merge partial data into the environment config.
 * was: updateEnvironmentData(Q) (line 86407)
 */
export function updateEnvironmentData(app, data) {
  app.G().updateEnvironment(data, false); // was: nD(this.app.G(), Q, !1)
}

// ---------------------------------------------------------------------------
// Stats / engagement
// ---------------------------------------------------------------------------

/**
 * Send a video stats engage event.
 * was: Er(Q) (line 86410)
 */
export function sendVideoStatsEngageEvent(api, eventData) {
  api.app.sendVideoStatsEngageEvent(eventData, 1);
}

/**
 * was: productsInVideoVisibilityUpdated(Q) (line 86413)
 */
export function productsInVideoVisibilityUpdated(api, visible) {
  api.publish("changeProductsInVideoVisibility", visible);
}

// ---------------------------------------------------------------------------
// Live head / aspect ratio / quality
// ---------------------------------------------------------------------------

/**
 * was: isAtLiveHead(Q, c=!0) (line 86416)
 */
export function isAtLiveHead(app, threshold, useBuffer = true) {
  return app.isAtLiveHead(threshold, useBuffer);
}

/**
 * was: getVideoAspectRatio (line 86419)
 */
export function getVideoAspectRatio(app) {
  return app.bX().getVideoAspectRatio();
}

/**
 * was: getPreferredQuality (line 86422)
 */
export function getPreferredQuality(app) {
  return app.oe().getPreferredQuality();
}

/**
 * Get the quality label string for a given player type.
 * was: getPlaybackQualityLabel(Q) (line 86425)
 */
export function getPlaybackQualityLabel(app, playerType) {
  return app.uX({ playerType }).getVideoData().O?.J()?.qualityLabel || "";
}

// ---------------------------------------------------------------------------
// Redux / settings menu
// ---------------------------------------------------------------------------

/**
 * Dispatch a Redux action to the global store.
 * was: dispatchReduxAction(Q) (line 86444)
 */
export function dispatchReduxAction(action) {
  // was: g.ib.dispatch(Q)
}

/**
 * Highlight a specific settings menu item.
 * was: highlightSettingsMenuItem(Q) (line 86447)
 */
export function highlightSettingsMenuItem(api, menuItem) {
  api.publish("highlightSettingsMenu", menuItem);
}

/**
 * Open a specific settings menu item.
 * was: openSettingsMenuItem(Q) (line 86450)
 */
export function openSettingsMenuItem(api, menuItem) {
  api.publish("openSettingsMenuItem", menuItem);
}

// ---------------------------------------------------------------------------
// State subscription (Redux-like)
// ---------------------------------------------------------------------------

/**
 * Subscribe to a state key.
 * was: Y(Q, c) (line 86453)
 */
export function subscribeToState(api, key, callback) {
  api.state.O.subscribe(key, callback);
}

/**
 * Unsubscribe from a state key.
 * was: AA(Q, c) (line 86456)
 */
export function unsubscribeFromState(api, key, callback) {
  api.state.O.unsubscribe(key, callback);
}

// ---------------------------------------------------------------------------
// Video loading shortcuts
// ---------------------------------------------------------------------------

/**
 * Cue a video by player vars.
 * was: b0(Q, c=1) (line 86459)
 */
export function cueVideoByPlayerVars(api, playerVars, playerType = 1) {
  api.cueVideoByPlayerVars(playerVars, playerType);
}

/**
 * Load a video by player vars.
 * was: nO(Q, c, W=1, m) (line 86462)
 */
export function loadVideoByPlayerVars(api, playerVars, param2, playerType = 1, param4) {
  api.loadVideoByPlayerVars(playerVars, param2, playerType, param4);
}

/**
 * Preload a video by player vars.
 * was: Rt(Q, c=1, W, m) (line 86465)
 */
export function preloadVideoByPlayerVars(api, playerVars, playerType = 1, param3, param4) {
  api.preloadVideoByPlayerVars(playerVars, playerType, param3, param4);
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

/**
 * was: getFeedbackProductData (line 86468)
 */
export function getFeedbackProductData(app) {
  return app.getFeedbackProductData();
}

// ---------------------------------------------------------------------------
// UI layer delegation
// ---------------------------------------------------------------------------

/**
 * Render the chapter-seeking animation on the scrubber.
 *
 * @param {*} chapterData  [was: Q]
 * @param {*} direction    [was: c]
 * @param {*} param3       [was: W]
 *
 * was: renderChapterSeekingAnimation(Q, c, W) (line 86522)
 */
export function renderChapterSeekingAnimation(api, chapterData, direction, param3) {
  api.l9().renderChapterSeekingAnimation(chapterData, direction, param3);
  // was: this.l9().renderChapterSeekingAnimation(Q, c, W)
}

// ---------------------------------------------------------------------------
// Config access
// ---------------------------------------------------------------------------

/**
 * Get the web player context config object.
 *
 * @returns {Object} config
 *
 * was: getWebPlayerContextConfig (line 86528)
 */
export function getWebPlayerContextConfig(app) {
  return app.G().getWebPlayerContextConfig();
}

/**
 * Notify that a Shorts ad swipe occurred.
 * was: notifyShortsAdSwipeEvent (line 86531)
 */
export function notifyShortsAdSwipeEvent(api) {
  api.publish("shortsadswipe");
}

// ---------------------------------------------------------------------------
// Safety mode
// ---------------------------------------------------------------------------

/**
 * was: setSafetyMode(Q) (line 86381)
 */
export function setSafetyMode(app, enabled) {
  app.G().enableSafetyMode = enabled;
}

/**
 * was: canPlayType(Q) (line 86384)
 */
export function canPlayType(app, mimeType) {
  return app.canPlayType(mimeType);
}

/**
 * was: showAirplayPicker (line 86441)
 */
export function showAirplayPicker(app) {
  app.showAirplayPicker();
}

/**
 * was: onAdUxClicked(Q, c) (line 86438)
 */
export function onAdUxClicked(api, eventType, param2) {
  api.publish("aduxclicked", eventType, param2);
}
