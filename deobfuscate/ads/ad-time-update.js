/**
 * Ad Time Update — time update event distribution for ads, ad duration
 * tracking, video data change handling, server-stitched DAI support,
 * player state forwarding, and listener callback management.
 *
 * Source: base.js lines 120500–121000 (DU class), 120680–120807 (t2 class)
 * [was: DU, t2]
 */

import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { getCurrentTimeSec } from '../player/playback-bridge.js';  // was: g.Qd
import { isAtLiveHead, onVideoDataChange, pauseVideo, playVideo } from '../player/player-events.js';  // was: g.isAtLiveHead, g.Qq, g.pauseVideo, g.playVideo
import { cueRangeStartId } from './ad-scheduling.js';  // was: g.Sr
import { lookupSlotLayout } from './ad-telemetry.js';  // was: g.E$
import { getFieldSentinel } from '../core/bitstream-helpers.js'; // was: $F
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { getPresenterVideoData } from '../player/playback-mode.js'; // was: mX
import { InternalApi } from '../data/device-tail.js'; // was: On7
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { updatePresenterState } from '../player/playback-mode.js'; // was: RE
import { reportAdsControlFlowError } from '../data/interaction-logging.js'; // was: v1
import { sha1HexDigest } from '../core/event-system.js'; // was: kN
import { listenOnce } from '../core/composition-helpers.js'; // was: E7
import { serializeMetricSet } from '../core/event-system.js'; // was: Mj
import { positionMarkerOverlays } from '../ui/progress-bar-impl.js'; // was: UC
import { disposeApp } from '../player/player-events.js'; // was: WA
import { checkAdExperiment } from '../player/media-state.js'; // was: qP
import { getAdElapsedTime } from '../player/playback-bridge.js'; // was: cX
import { createEndcapOrInterstitialLayout } from './slot-id-generator.js'; // was: m5
import { extractSurveyPlaybackCommands } from './companion-layout.js'; // was: Wc
import { globalEventBuffer } from '../data/module-init.js'; // was: rM
import { Disposable } from '../core/disposable.js';
import { EventHandler } from '../core/event-handler.js';
import { filter, clear } from '../core/array-utils.js';
import { getCurrentTime, getDuration, getVolume, isMuted } from '../player/time-tracking.js';
import { getPlayerResponse } from '../player/player-api.js';
import { dispose } from './dai-cue-range.js';

/**
 * Manages ad video data lifecycle — listens for video data changes
 * and server-stitched video switches, builds metadata payloads, and
 * notifies downstream listeners.
 * [was: DU]
 */
export class AdVideoDataManager extends Disposable {
  /**
   * @param {object} player [was: Q]
   * @param {object} slotStore [was: c / s$]
   * @param {object} playerContext [was: W / QC]
   */
  constructor(player, slotStore, playerContext) {
    super();
    this.player = player;           // was: U
    this.slotStore = slotStore;     // was: s$
    this.playerContext = playerContext; // was: QC
    this.listeners = [];
    this.currentAdCpn = null;       // was: Xe
    this.adStartTimes = new Map();  // was: zv

    const eventHandler = new EventHandler(this); // was: c (reused)
    registerDisposable(this, eventHandler);
    eventHandler.B(player, "videodatachange", this.onVideoDataChange); // was: Ij
    if (getFieldSentinel(player.G().getExperimentFlags)) {
      eventHandler.B(player, "playbackChange", this.onPlaybackChange); // was: YM
    } else {
      eventHandler.B(player, "serverstitchedvideochange", this.onServerStitchedVideoChange); // was: bR
    }
    this.disposableRef = getPresenterVideoData(this); // was: oY
  }

  /** Returns accumulated watch time from the internal API. */
  getAccumulatedWatchTime() {
    return this.player.getInternalApi().getAccumulatedWatchTime();
  }

  /** Returns the content CPN (client playback nonce). */
  getContentCpn() { // was: hC
    return this.player.getVideoData({ playerType: 1 }).clientPlaybackNonce;
  }

  addListener(listener) { // was: Q
    this.listeners.push(listener);
  }

  removeListener(listener) { // was: Q
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /** Called when content video is loaded — resets ad tracking state. */
  onContentVideoLoaded() { // was: V1
    this.adStartTimes.clear();
    this.currentAdCpn = null;
    this.slotStore.get().clear();
  }

  /** No-op for content video abandonment. */
  onContentVideoAbandoned() {} // was: yO

  /**
   * Handles video data changes.
   * @param {string} changeType [was: Q] - e.g. "dataloaded"
   * @param {object} videoData [was: c]
   * @param {number} playerType [was: W]
   * @private
   */
  onVideoDataChange(changeType, videoData, playerType) { // was: Ij
    videoData.videoId === "nPpU29QrbiU" &&
      this.player.RetryTimer("ads_ssm_vdc_s", { pt: playerType, dvt: changeType });
    if (aE(this.playerContext.get()) && changeType !== "dataloaded") return;
    updatePresenterState(this, videoData, playerType);
  }

  /**
   * Handles playback change events for server-stitched DAI.
   * @param {object} changeEvent [was: Q]
   * @private
   */
  onPlaybackChange(changeEvent) { // was: YM
    if (!this.player.getVideoData({ playerType: 1 }).enableServerStitchedDai) return;
    for (const started of changeEvent.started) {
      const startTime = this.player.getStartTime({ cpn: started.cpn }); // was: Q (reused)
      const videoData = this.player.getVideoData({ cpn: started.cpn }); // was: W
      const playerType = this.player.getPlayerType(started.cpn);        // was: m
      let layoutInfo = null; // was: K
      if (playerType === 2) {
        this.currentAdCpn = started.cpn;
        if (startTime === undefined) {
          reportAdsControlFlowError("Expected ad video start time on SS video changed");
        } else {
          this.adStartTimes.set(started.cpn, startTime);
        }
        layoutInfo = lookupSlotLayout(this.slotStore.get(), started.cpn);
      }
      this.player.getVideoData({ playerType: 1 }).RetryTimer("ads_ssvc", {
        pt: playerType,
        cpn: videoData?.clientPlaybackNonce,
        crtt: this.player.getCurrentTime({ playerType, wj: false }),
        atlh: this.player.isAtLiveHead(),
        adstt: startTime,
        pid: started.cpn,
        slid: layoutInfo?.layoutId,
      });
      if (videoData && playerType) {
        updatePresenterState(this, videoData, playerType);
      } else {
        reportAdsControlFlowError("Expected video data on server stitched video changed", undefined, undefined, {
          cpn: this.player.getVideoData({ playerType: 1 }).clientPlaybackNonce,
          timelinePlaybackId: started.cpn,
        });
      }
    }
  }

  /**
   * Handles legacy server-stitched video change events.
   * @param {string|undefined} cpn [was: Q]
   * @param {number|undefined} startTime [was: c]
   * @private
   */
  onServerStitchedVideoChange(cpn, startTime) { // was: bR
    if (cpn !== undefined) {
      this.currentAdCpn = cpn;
      if (startTime === undefined || isNaN(startTime)) {
        reportAdsControlFlowError("Expected ad video start time on SS video changed");
      } else {
        this.adStartTimes.set(cpn, startTime);
      }
    }
    const playerType = this.player.getPresentingPlayerType(true); // was: W
    const videoData = this.player.getVideoData({ playerType });   // was: m
    const layoutInfo = cpn === undefined
      ? null
      : lookupSlotLayout(this.slotStore.get(), cpn);              // was: K

    this.player.getVideoData({ playerType: 1 }).RetryTimer("ads_ssvc", {
      pt: playerType,
      cpn: videoData?.clientPlaybackNonce,
      crtt: this.player.getCurrentTime({ playerType: 1, wj: false }),
      atlh: this.player.isAtLiveHead(),
      adstt: startTime,
      pid: cpn,
      slid: layoutInfo?.layoutId,
    });
    if (videoData) {
      updatePresenterState(this, videoData, playerType);
    } else {
      reportAdsControlFlowError("Expected video data on server stitched video changed", undefined, undefined, {
        cpn: this.player.getVideoData({ playerType: 1 }).clientPlaybackNonce,
        timelinePlaybackId: cpn,
      });
    }
  }

  /**
   * Builds a metadata payload from ad video data for downstream consumers.
   * @param {object} videoData [was: Q]
   * @param {number} playerType [was: c]
   * @returns {object}
   */
  buildMetadataPayload(videoData, playerType) { // was: Pf
    const author = videoData.author;                   // was: W
    const cpn = videoData.clientPlaybackNonce;          // was: m
    const isListed = videoData.isListed;                // was: K
    let timelinePlaybackId = videoData.PJ;              // was: T
    const title = videoData.title;                      // was: r
    const controlParam = videoData.zd;                  // was: U
    const ytrParam = videoData.V$;                      // was: I
    const isMdxPlayback = videoData.isMdxPlayback;      // was: X
    const stageInfo = videoData.s8;                      // was: A
    const mdxEnvironment = videoData.mdxEnvironment;     // was: e
    const isAutonav = videoData.isAutonav;               // was: V
    const keyName = videoData.sha1HexDigest;                        // was: B
    const flagField = videoData.F_;                       // was: n
    const sYField = videoData.sY;                         // was: S
    const videoId = videoData.videoId || "";              // was: d
    const profilePicture = videoData.profilePicture || ""; // was: b
    const nBField = videoData.nB || "";                   // was: w
    const isCI = videoData.cI() || false;                  // was: f
    const isE7 = videoData.listenOnce() || false;                  // was: G
    const mjField = videoData.serializeMetricSet || undefined;             // was: Q (reused)

    timelinePlaybackId = lookupSlotLayout(this.slotStore.get(), timelinePlaybackId) || {
      layoutId: null,
      slotId: null,
    };

    let contentVideoData = this.player.getVideoData({ playerType: 1 }); // was: T7
    const contentUC = contentVideoData.positionMarkerOverlays();              // was: oW
    contentVideoData = contentVideoData.getPlayerResponse(); // was: T7 (reused)
    const adDurationMs = 1e3 * this.player.getDuration({ playerType });          // was: c (reused)
    const contentDurationMs = 1e3 * this.player.getDuration({ playerType: 1 });  // was: G7

    return {
      ...timelinePlaybackId,
      videoId,
      author,
      clientPlaybackNonce: cpn,
      TN: adDurationMs,
      pw: contentDurationMs,
      daiEnabled: contentVideoData?.playerConfig?.daiConfig?.enableDai || false,
      m3: contentVideoData?.playerConfig?.daiConfig?.enablePreroll || false,
      isListed,
      positionMarkerOverlays: contentUC,
      profilePicture,
      title,
      nB: nBField,
      zd: controlParam,
      V$: ytrParam,
      serializeMetricSet: mjField,
      isMdxPlayback,
      s8: stageInfo,
      mdxEnvironment,
      isAutonav,
      sha1HexDigest: keyName,
      F_: flagField,
      sY: sYField,
      cI: isCI,
      listenOnce: isE7,
    };
  }

  /** @override */
  dispose() { // was: WA
    this.listeners.length = 0;
    this.disposableRef = null;
    super.disposeApp();
  }
}

/**
 * Player event adapter — distributes progress-sync, state changes,
 * fullscreen, volume, minimize, overlay visibility, resize, and swipe
 * events to registered ad listeners.
 * [was: t2]
 */
export class PlayerEventAdapter extends Disposable {
  /**
   * @param {object} player [was: Q]
   * @param {object} dataStoreProvider [was: c / cA]
   */
  constructor(player, dataStoreProvider) {
    super();
    this.player = player;                     // was: U
    this.dataStoreProvider = dataStoreProvider; // was: cA
    this.listeners = [];
    this.contentListeners = [];               // was: Ci
    this.unlockPrerollFn = () => {            // was: XZ
      reportAdsControlFlowError("Called 'doUnlockPreroll' before it's initialized.");
    };

    const legacyHandler = new aB(this); // was: c (reused)
    const modernHandler = new EventHandler(this); // was: W
    registerDisposable(this, modernHandler);
    registerDisposable(this, legacyHandler);
    legacyHandler.B(player, "progresssync", this.onProgressSync);          // was: O
    legacyHandler.B(player, "presentingplayerstatechange", this.onStateChange); // was: W
    legacyHandler.B(player, "fullscreentoggled", this.onFullscreenToggled);
    legacyHandler.B(player, "onVolumeChange", this.onVolumeChange);
    legacyHandler.B(player, "minimized", this.onMinimized);           // was: Qf
    legacyHandler.B(player, "overlayvisibilitychange", this.onOverlayVisibilityChange); // was: Jy
    legacyHandler.B(player, "shortsadswipe", this.onShortsAdSwipe);   // was: sE
    legacyHandler.B(player, "resize", this.onResize);                  // was: b3
    modernHandler.B(player, cueRangeStartId("appad"), this.onAppAdCueEnter);      // was: HN
  }

  /** Called when content video is loaded — sets up preroll unlock function. */
  onContentVideoLoaded() { // was: V1
    this.unlockPrerollFn = GC(() => {
      if (!this.player.u0()) {
        this.player.checkAdExperiment("ad", 1);
      }
    });
  }

  /** No-op for content video abandonment. */
  onContentVideoAbandoned() {} // was: yO

  addListener(listener) { // was: Q
    this.listeners.push(listener);
  }

  removeListener(listener) { // was: Q
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /** No-op stub for content listener progress callback. */
  onContentProgress() {} // was: Gi

  playVideo() {
    this.player.playVideo();
  }

  pauseVideo() {
    this.player.pauseVideo();
  }

  /**
   * Resumes video if currently paused.
   * @param {number} playerType [was: Q]
   */
  resumeVideo(playerType) {
    if (this.isPaused(playerType)) {
      this.player.playVideo();
    }
  }

  /**
   * @param {number} playerType [was: Q]
   * @returns {boolean}
   */
  isPaused(playerType) { // was: Ap
    return this.player.getPlayerState(playerType) === 2;
  }

  /**
   * Gets the current time for a given player type, with special handling
   * for server-stitched ad CPNs.
   * @param {number} playerType [was: Q]
   * @param {boolean} raw [was: c]
   * @returns {number}
   */
  getCurrentTimeSec(playerType, raw) {
    const currentAdCpn = this.dataStoreProvider.get().currentAdCpn; // was: W → Xe
    if (playerType !== 2 || raw || currentAdCpn === null) {
      return this.player.getCurrentTime({ playerType, wj: raw });
    }
    return getAdElapsedTime(this, currentAdCpn);
  }

  getVolume() {
    return this.player.getVolume();
  }

  isMuted() {
    return this.player.isMuted();
  }

  getPresentingPlayerType() {
    return this.player.getPresentingPlayerType(true);
  }

  getPlayerState(playerType) { // was: Q
    return this.player.getPlayerState(playerType);
  }

  getGetAdBreakContext() {
    return this.player.getGetAdBreakContext();
  }

  isFullscreen() {
    return this.player.isFullscreen();
  }

  isAtLiveHead() {
    return this.player.isAtLiveHead();
  }

  /**
   * Enables or disables the underlay shrink mode.
   * @param {boolean} enable [was: Q]
   */
  setUnderlayMode(enable) { // was: m5
    this.player.createEndcapOrInterstitialLayout(enable);
  }

  /**
   * Distributes progress sync events to ad or content listeners.
   * @private
   */
  onProgressSync() { // was: O
    const playerType = this.player.getPresentingPlayerType(true); // was: Q
    const currentTime = this.getCurrentTimeSec(playerType, false); // was: c
    if (playerType === 2) {
      for (const listener of this.listeners) {
        listener.oR(currentTime); // ad time update
      }
    } else if (playerType === 1) {
      for (const listener of this.contentListeners) {
        listener.Gi(currentTime); // content time update
      }
    }
  }

  /**
   * Distributes player state changes.
   * @param {object} state [was: Q]
   * @private
   */
  onStateChange(state) { // was: W
    for (const listener of this.listeners) {
      listener.extractSurveyPlaybackCommands(state, this.getPresentingPlayerType());
    }
  }

  /** @private */
  onFullscreenToggled(isFullscreen) { // was: Q
    for (const listener of this.listeners) {
      listener.onFullscreenToggled(isFullscreen);
    }
  }

  /** @private */
  onVolumeChange() {
    for (const listener of this.listeners) {
      listener.onVolumeChange();
    }
  }

  /** @private */
  onMinimized() { // was: Qf
    const isMinimized = this.player.isMinimized(); // was: Q
    for (const listener of this.listeners) {
      listener.Qf(isMinimized);
    }
  }

  /** @private */
  onOverlayVisibilityChange(visible) { // was: Jy, Q
    for (const listener of this.listeners) {
      listener.Jy(visible);
    }
  }

  /** @private */
  onResize() { // was: b3
    const size = this.player.bX().globalEventBuffer(); // was: Q
    for (const listener of this.listeners) {
      listener.gM(size);
    }
  }

  /** @private */
  onAppAdCueEnter(cueRange) { // was: HN, Q
    for (const listener of this.listeners) {
      listener.HN(cueRange);
    }
  }

  /** @private */
  onShortsAdSwipe() { // was: sE
    for (const listener of this.listeners) {
      listener.sE();
    }
  }
}

// Helper referenced by AdVideoDataManager — imported from ad-telemetry
function lookupSlotLayout(store, key) {
  return store.W.get(key) || null;
}
