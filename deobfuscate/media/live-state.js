/**
 * Live Playback State, Preload Management & Player Modules
 *
 * Source: player_es6.vflset/en_US/base.js, lines 100500–101449
 *
 * Contains:
 *  - Marker visibility & chapter seeking with animation
 *  - Media session metadata management (gWm)
 *  - Composite video overlay module with embargo cue ranges (OmW)
 *  - Offline actions module (fSS)
 *  - YPC clickwrap rental overlay (vWS)
 *  - Quality data module with paygated quality support (aSo)
 *  - Media integrity error code map (Ga4) and D6DE4 module ($91)
 *  - Picture-in-picture button (PD9) and PiP module (lSH)
 *  - Playable sequences / YTO preroll overlay (ui1)
 *  - Online playback position persistence (hoa / zo4)
 *  - Music bar UI disable module (CDZ)
 *  - Suggested action badge component (aN)
 *
 * Player state bits:
 *  - W(1)   = buffering
 *  - W(2)   = ended
 *  - W(8)   = playing
 *  - W(16)  = seeking
 *  - W(32)  = UI seeking
 *  - W(64)  = unstarted
 *  - W(128) = error
 *  - W(512) = cued
 *  - W(1024) = DOM paused
 *
 * @module media/live-state
 */

// ---------------------------------------------------------------------------
// Marker Visibility Helpers (lines 100500–100577)
// ---------------------------------------------------------------------------


import { hasPlaylist, insertAtLayer } from '../ads/ad-click-tracking.js'; // was: g.bp, g.f8
import { cueRangeEndId, cueRangeStartId } from '../ads/ad-scheduling.js'; // was: g.FC, g.Sr
import { AnimationFrameTimer, ThrottleTimer } from '../core/bitstream-helpers.js'; // was: g.T5, g.Uc
import { registerDisposable } from '../core/event-system.js'; // was: g.F
import { getProperty } from '../core/misc-helpers.js'; // was: g.l
import { logGelEvent, reportWarning } from '../data/gel-params.js'; // was: g.eG, g.Ty
import { isWebExact, isWebRemix, isWebUnplugged } from '../data/performance-profiling.js'; // was: g.rT, g.uL, g.X7
import { buildFormatConfig } from './seek-controller.js'; // was: g.Ow
import { FadeAnimationController } from '../player/component-events.js'; // was: g.QR
import { deleteEntityInTransaction, serializeEntityKey } from '../proto/varint-decoder.js'; // was: g.oz, g.bX
import { SLOT_MESSAGE_MARKER } from '../proto/messages-core.js'; // was: Ww
import { extractPlainText } from '../ads/ad-async.js'; // was: li
import { AdVideoClickthroughMetadata } from '../ads/ad-interaction.js'; // was: ux
import { isLeanback } from '../data/performance-profiling.js'; // was: y_
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { reportErrorToGel } from '../data/gel-params.js'; // was: EE
import { getOfflineModule } from '../player/caption-manager.js'; // was: JT
import { getUserSettings } from '../ads/ad-async.js'; // was: xD
import { checkAdExperiment } from '../player/media-state.js'; // was: qP
import { buildFormatDescriptor } from './codec-helpers.js'; // was: fM
import { qualityOrdinalEnum } from './codec-tables.js'; // was: VEx
import { sortFormats } from './format-setup.js'; // was: jQ
import { onInternalVideoDataChange } from '../player/player-events.js'; // was: Lc
import { getSelectableAudioFormats } from '../player/context-updates.js'; // was: L3()
import { enqueueEntry } from '../core/composition-helpers.js'; // was: TQ
import { startMediaIntegrity } from './media-integrity.js'; // was: UOy
import { isMediaIntegrityAvailable } from './media-integrity.js'; // was: kB
import { requestMediaIntegrityToken } from './media-integrity.js'; // was: Io7
import { listenOnPlayerRoot } from '../ads/ad-click-tracking.js'; // was: EP
import { ContextMenuItem } from '../player/overlay-setup.js'; // was: RN
import { getMiniplayerModule } from '../player/caption-manager.js'; // was: J7X
import { getRemainingInRange } from './codec-helpers.js'; // was: RR
import { loadNextVideoByPlayerVars } from '../player/video-loader.js'; // was: eYX
import { ensurePesInitialized } from '../player/video-loader.js'; // was: xOy
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { savePlaybackPosition } from '../player/video-loader.js'; // was: nUO
import { EXP_748402147 } from '../proto/messages-core.js'; // was: Hw
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { updateBadgeControlsVisibility } from '../player/video-loader.js'; // was: pf
import { updateBadgeExpansion } from '../player/video-loader.js'; // was: Q4
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { applyQualityConstraint } from './quality-constraints.js'; // was: d3
import { isCompressedDomainComposite } from './audio-normalization.js'; // was: gA
import { invokeUnaryRpc } from './bitstream-reader.js'; // was: BG
import { unwrapTrustedResourceUrl } from '../core/composition-helpers.js'; // was: x3
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { forEach } from '../core/event-registration.js';
import { getWatchNextResponse, getPlayerResponse, getAvailableAudioTracks, togglePictureInPicture } from '../player/player-api.js';
import { remove, clear, filter, concat, splice } from '../core/array-utils.js';
import { EventHandler } from '../core/event-handler.js';
import { nextVideo, previousVideo, preloadVideoByPlayerVars } from '../player/player-events.js';
import { dispose, onCueRangeEnter } from '../ads/dai-cue-range.js';
import { removeClass, addClass, toggleClass } from '../core/dom-utils.js';
import { PlayerComponent } from '../player/component.js';
import { toString } from '../core/string-utils.js';
import { logClick } from '../data/visual-element-tracking.js';
// TODO: resolve g.ip
// TODO: resolve g.k

/**
 * Seek to a chapter by its index, with a scrub animation.
 *
 * Looks up the chapter in `videoData.Ww` (chapter list) or falls back
 * to `videoData.vQ` (key moments), then triggers the animated seek.
 *
 * [was: seekToChapterWithAnimation on marker module class]
 *
 * @param {object} self  - Module instance (has `.api`)
 * @param {number} index - Chapter index [was: Q]
 */
export function seekToChapterWithAnimation(self, index) { // was: seekToChapterWithAnimation (line 100506)
  if (!g.ip(self.api) || index < 0) return;

  const videoData = self.api.getVideoData(); // was: c
  const chapters = videoData.SLOT_MESSAGE_MARKER; // was: W — chapter list

  if (chapters && index < chapters.length) {
    for (const chapter of chapters) { // was: m
      if (chapter.index === index) {
        MG(self, chapter.startTime, chapter.title); // was: MG
        return;
      }
    }
  }

  if (self.X("web_key_moments_markers")) {
    const keyMoments = videoData.vQ; // was: c (reused) — key moments
    if (keyMoments && index < keyMoments.length) {
      keyMoments.forEach((moment, i) => { // was: m, K
        if (i === index) {
          MG(self, moment.timeRangeStartMillis, moment.title);
        }
      });
    }
  }
}

/**
 * Set macro markers on the player bar from a multiMarkersPlayerBarRenderer.
 *
 * Wraps `multiMarkersPlayerBarRenderer` in the expected overlay envelope,
 * then injects it via `yK()` and publishes "dataupdated".
 *
 * [was: setMacroMarkers] (line 100525)
 *
 * @param {object} playerApi         - Player API to get video data from [was: Q]
 * @param {object} markersRenderer   - multiMarkersPlayerBarRenderer data [was: c]
 */
export function setMacroMarkers(playerApi, markersRenderer) { // was: setMacroMarkers (line 100525)
  const envelope = { // was: c (reused)
    playerOverlays: {
      playerOverlayRenderer: {
        decoratedPlayerBarRenderer: {
          decoratedPlayerBarRenderer: {
            playerBar: {
              multiMarkersPlayerBarRenderer: markersRenderer,
            },
          },
        },
      },
    },
  };

  const videoData = playerApi.getVideoData(); // was: Q (reused)
  videoData.getWatchNextResponse();
  if (videoData && videoData.getWatchNextResponse() == null) {
    yK(videoData, { raw_watch_next_response: envelope }); // was: yK
    videoData.publish("dataupdated");
  }
}

/**
 * Toggle marker visibility for the given types.
 *
 * Supports three restriction modes:
 *  - `"CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_NOT_OVERWRITE_SAME_TYPE"`
 *  - `"CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_NOT_OVERWRITE_ANY_TYPE"`
 *  - default (always add)
 *
 * Publishes "updatemarkervisibility" if any change occurred.
 *
 * [was: changeMarkerVisibility] (line 100546)
 *
 * @param {object}   self            - Module instance
 * @param {boolean}  addMode         - true to add, false to remove [was: Q]
 * @param {string[]} markerTypes     - Types to toggle [was: c]
 * @param {string}   restrictionMode - Restriction mode enum [was: W]
 */
export function changeMarkerVisibility(self, addMode, markerTypes, restrictionMode) { // was: changeMarkerVisibility (line 100546)
  const videoData = self.api.getVideoData(); // was: m
  if (!videoData) return;

  let changed = false; // was: K

  if (addMode) {
    for (const markerType of markerTypes) { // was: T
      const activeKeys = videoData.Ka; // was: Q (reused)
      if (activeKeys && !activeKeys.includes(markerType)) {
        switch (restrictionMode) {
          case "CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_NOT_OVERWRITE_SAME_TYPE":
            if (!YP_(markerType, videoData)) { // was: YP_
              changed = true;
              videoData.Ka?.push(markerType);
            }
            break;
          case "CHANGE_MARKERS_VISIBILITY_RESTRICTION_MODE_NOT_OVERWRITE_ANY_TYPE":
            if (activeKeys.length === 0) {
              changed = true;
              videoData.Ka?.push(markerType);
            }
            break;
          default:
            changed = true;
            videoData.Ka?.push(markerType);
        }
      }
    }
  } else {
    for (const markerType of markerTypes) { // was: T
      if (
        !videoData.visibleOnLoadKeys.includes(markerType) &&
        remove(videoData.Ka, markerType) // was: g.o0 — remove from array
      ) {
        changed = true;
      }
    }
  }

  if (changed) {
    self.api.publish("updatemarkervisibility");
  }
}

/**
 * Check if a marker of the same type is already visible.
 *
 * [was: isSameMarkerTypeVisible] (line 100573)
 *
 * @param {object} self       - Module instance
 * @param {string} markerType - Marker type to check [was: Q]
 * @returns {boolean}
 */
export function isSameMarkerTypeVisible(self, markerType) { // was: isSameMarkerTypeVisible (line 100573)
  const videoData = self.api.getVideoData(); // was: c
  return videoData ? YP_(markerType, videoData) : false;
}

// ---------------------------------------------------------------------------
// MediaSessionMetadataModule  [was: gWm]  (lines 100579–100643)
// ---------------------------------------------------------------------------

/**
 * Module managing the browser's MediaSession API integration.
 *
 * Subscribes to:
 *  - "videodatachange" → updateMetadata
 *  - "presentingplayerstatechange" → ptx (playback state sync)
 *  - "SEEK_COMPLETE" → QbO (position state update)
 *
 * Sets `navigator.mediaSession.metadata` with title, artist, artwork, album.
 * Registers "nexttrack" / "previoustrack" handlers when in playlist context.
 *
 * [was: gWm extends PlayerModule]
 *
 * @class MediaSessionMetadataModule
 */
export class MediaSessionMetadataModule { // was: gWm (line 100579)
  constructor(api) { // was: Q
    // super(api);
    this.events = new EventHandler(api); // was: new g.db(Q)
    registerDisposable(this, this.events);

    this.events.B(api, "videodatachange", () => {
      this.updateMetadata();
    });
    this.events.B(api, "presentingplayerstatechange", () => {
      ptx(this); // was: ptx — sync playback state to MediaSession
    });
    this.events.B(api, "SEEK_COMPLETE", () => {
      QbO(this); // was: QbO — update position state
    });
  }

  /**
   * Refresh MediaSession metadata from current video data.
   *
   * On non-embedded players, extracts thumbnails from the browserMediaSession
   * renderer; otherwise falls back to `mqdefault.jpg`.
   * Also registers next/previous track handlers when in playlist mode.
   *
   * [was: updateMetadata] (line 100597)
   */
  updateMetadata() {
    let videoData = this.api.getVideoData(); // was: Q
    if (!videoData?.Xq()) return; // was: Xq — is loaded/valid

    const config = this.api.G(); // was: c
    let artwork = []; // was: W
    let album = ""; // was: m

    if (!config.S) { // was: S — embedded mode flag
      const browserMediaSession =
        this.api
          .getVideoData()
          .getWatchNextResponse()
          ?.playerOverlays?.playerOverlayRenderer?.browserMediaSession
          ?.browserMediaSessionRenderer; // was: K

      if (isWebRemix(config) && browserMediaSession) { // was: g.uL — is desktop
        artwork = cMR(browserMediaSession.thumbnailDetails); // was: cMR
        if (browserMediaSession.album) {
          album = extractPlainText(browserMediaSession.album); // was: li — extract text
        }
      } else {
        artwork = [
          {
            src: videoData.AdVideoClickthroughMetadata("mqdefault.jpg") || "", // was: ux — thumbnail URL
            sizes: "320x180",
            type: "image/jpeg",
          },
        ];
      }
    }

    if (this.api.getVideoData()?.EM()) { // was: EM — has progress/position
      QbO(this);
    }
    ptx(this);
    Wyn(this); // was: Wyn — set action handlers (play, pause, seekbackward, etc.)

    navigator.mediaSession.metadata = new MediaMetadata({
      title: videoData.title,
      artist: videoData.author,
      artwork,
      album,
    });

    let nextHandler = null; // was: Q (reused)
    let prevHandler = null; // was: c (reused)

    if (hasPlaylist(this.api)) { // was: g.bp — has playlist
      nextHandler = () => {
        this.api.nextVideo();
      };
      prevHandler = () => {
        this.api.previousVideo();
      };
    }

    J5("nexttrack", nextHandler); // was: J5 — setActionHandler
    J5("previoustrack", prevHandler);
  }

  /**
   * Dispose: clear all MediaSession state.
   *
   * [was: WA] (line 100634)
   */
  dispose() { // was: WA
    navigator.mediaSession.playbackState = "none";
    navigator.mediaSession.metadata = null;

    const actions = "nexttrack previoustrack play pause seekbackward seekforward seekto".split(" ");
    for (const action of actions) {
      J5(action, null); // was: J5
    }

    if (this.api.getVideoData()?.EM() && navigator.mediaSession.setPositionState) {
      navigator.mediaSession.setPositionState({});
    }
    // super.WA()
  }
}

// ---------------------------------------------------------------------------
// CompositeVideoOverlayModule  [was: OmW]  (lines 100645–100764)
// ---------------------------------------------------------------------------

/**
 * Manages composite video overlays with embargo cue ranges.
 *
 * - On "modulecreated": adjusts caption safe zone from composite overlay sources
 * - On "videodatachange": clears state, installs embargo cue ranges from
 *   `PLAYER_CUE_RANGE_SET_IDENTIFIER_EMBARGO` or video data cue ranges
 * - On embargo enter: sets `y_` (embargo status token) and triggers FP (refresh)
 * - On embargo exit: clears embargo and triggers FP
 * - On "heartbeatRequest": attaches compositeVideoState
 * - On "internalaudioformatchange": logs track change, updates default audio
 * - On "onPlaybackAudioChange": publishes FP, optionally preloads mosaic audio
 * - Register "setCompositeParam": sets compositeVideoState
 * - Register "setCompositeVideoOverlayRendererComponent": manages overlay DOM
 *
 * [was: OmW extends PlayerModule]
 *
 * @class CompositeVideoOverlayModule
 */
export class CompositeVideoOverlayModule { // was: OmW (line 100645)
  constructor(api) { // was: Q
    // super(api);
    this.O = new Map(); // was: O — embargo cue range map
    this.K = undefined; // was: K — last compositeLiveStatusToken
    this.W = undefined; // was: W — current embargo cue range id
    this.compositeVideoState = null; // was: compositeVideoState
    this.A = undefined; // was: A — overlay DOM element
    this.events = new EventHandler(api);
    registerDisposable(this, this.events);

    // On "modulecreated": set caption safe zone from composite overlay
    this.events.B(api, "modulecreated", (moduleName) => { // was: c
      // Find active composite overlay source
      let activeSource; // was: m
      const overlay = this.api
        .getVideoData()
        ?.getPlayerResponse()
        ?.overlay?.playerControlsOverlayRenderer; // was: W
      if (overlay) {
        const compositeOverlay = getProperty(overlay.compositeVideoOverlay, BJ7); // was: W (reused)
        if (compositeOverlay?.sources?.length) {
          for (const source of compositeOverlay.sources) { // was: m (reused)
            if (source.isActive) break;
          }
        }
      }
      if (!activeSource) activeSource = undefined;

      if (
        moduleName === "captions" &&
        activeSource?.topLeftCornerX !== undefined &&
        activeSource?.topLeftCornerY !== undefined &&
        activeSource?.width !== undefined &&
        activeSource?.height !== undefined
      ) {
        this.api.iz({
          top: activeSource.topLeftCornerY,
          right: 1 - activeSource.topLeftCornerX - activeSource.width,
          bottom: 1 - activeSource.topLeftCornerY - activeSource.height,
          left: activeSource.topLeftCornerX,
        });
      }
    });

    // On "videodatachange": clear and rebuild embargo cue ranges
    this.events.B(api, "videodatachange", (changeType) => { // was: c
      const videoData = this.api.getVideoData(); // was: W
      this.W = undefined;
      this.O.clear();
      this.api.qI("compositeembargo", 1);

      const embargoRanges = videoData?.ws.get("PLAYER_CUE_RANGE_SET_IDENTIFIER_EMBARGO"); // was: m
      if (embargoRanges?.length) {
        mO7(this, embargoRanges.filter((range) => range.onEnter?.some(this.j))); // was: mO7, K
      } else if (videoData?.cueRanges) {
        mO7(this, videoData.cueRanges.filter((range) => range.onEnter?.some(this.j)));
      }

      if (changeType === "dataupdated" && videoData?.compositeLiveStatusToken !== this.K) {
        this.K = videoData?.compositeLiveStatusToken;
        this.api.FP(); // was: FP — refresh player
      }
    });

    // On embargo enter: update embargo status
    this.events.B(api, cueRangeStartId("compositeembargo"), (cueRange) => { // was: c
      if (this.W?.id !== cueRange.id && (this.api.F9(true), this.O.has(cueRange.id))) {
        const entries = this.O.get(cueRange.id); // was: W
        const videoData = this.api.getVideoData(); // was: m
        for (const entry of entries) { // was: K
          const token = entry.compositeEmbargo?.embargoStatusToken; // was: W (reused)
          if (videoData.isLeanback !== token) {
            videoData.isLeanback = token;
            this.api.FP();
          }
          Ky0(this, cueRange); // was: Ky0
        }
      }
    });

    // On embargo exit: clear embargo status
    this.events.B(api, cueRangeEndId("compositeembargo"), (cueRange) => { // was: c
      if (this.W?.id === cueRange.id && (this.api.F9(false), this.O.has(cueRange.id))) {
        const videoData = this.api.getVideoData(); // was: c (reused)
        if (videoData) {
          videoData.isLeanback = undefined;
        }
        this.api.FP();
        Ky0(this);
      }
    });

    // On heartbeat: attach composite video state
    this.events.B(api, "heartbeatRequest", (request) => { // was: c
      if (this.compositeVideoState !== null) {
        if (!request.playbackState) request.playbackState = {};
        request.playbackState.compositeVideoState = this.compositeVideoState;
      }
    });

    // On internal audio format change
    this.events.B(api, "internalaudioformatchange", (trackId, mode) => { // was: c, W
      const videoData = this.api.getVideoData({ wj: false }); // was: m
      videoData?.RetryTimer("atrkchg", { id: trackId, m: mode });

      if (videoData && !videoData.T0()) { // was: T0 — is audio-only
        const availableTracks = this.api.getAvailableAudioTracks(); // was: W (reused)
        for (const track of availableTracks) { // was: K
          if (track.getLanguageInfo().getId() === trackId) {
            this.api.G().parseHexColor = trackId; // was: HA — default audio track id
            break;
          }
        }
      }
    });

    // On playback audio change: refresh and optionally preload
    this.events.B(api, "onPlaybackAudioChange", () => {
      this.api.FP();
      if (api.getVideoData()?.G().X("html5_preload_on_mosaic_audio_track_change")) {
        const sourceConfig = this.api.getSourceConfigForActiveAudioTrack(); // was: c
        if (sourceConfig) {
          api.preloadVideoByPlayerVars(
            { videoId: sourceConfig.videoId, live_preload: true },
            1,
          );
        }
      }
    });

    // Register "setCompositeParam"
    R(api, "setCompositeParam", (value) => { // was: c
      this.compositeVideoState = value;
    });

    // Register "setCompositeVideoOverlayRendererComponent" (if multiview enabled)
    if (this.api.X("web_watch_enable_multiview_manager")) {
      R(api, "setCompositeVideoOverlayRendererComponent", (component) => { // was: c
        this.setCompositeVideoOverlayRendererComponent(component);
      });
    }
  }

  /**
   * Replace the composite video overlay DOM element.
   *
   * [was: setCompositeVideoOverlayRendererComponent] (line 100749)
   *
   * @param {Element|null} element [was: Q]
   */
  setCompositeVideoOverlayRendererComponent(element) { // was: Q
    if (this.A) {
      this.A.remove();
      removeClass(this.A, "ytp-composite-video-overlay-renderer"); // was: g.n6 — removeClass
      this.A = undefined;
    }
    if (element) {
      addClass(element, "ytp-composite-video-overlay-renderer"); // was: g.xK — addClass
      insertAtLayer(this.api, element, 4); // was: g.f8 — insert into player at layer 4
      this.A = element;
    }
  }

  /**
   * Predicate: does this cue range entry have a compositeEmbargo?
   *
   * [was: j] (line 100757)
   *
   * @param {object} entry [was: Q]
   * @returns {boolean}
   */
  j(entry) { // was: j
    return entry.compositeEmbargo !== undefined;
  }

  /**
   * Dispose: clear embargo map.
   *
   * [was: WA] (line 100760)
   */
  dispose() { // was: WA
    // super.WA();
    this.O.clear();
  }
}

// ---------------------------------------------------------------------------
// OfflineActionsModule  [was: fSS]  (lines 100766–100823)
// ---------------------------------------------------------------------------

/**
 * Module for offline / download operations.
 *
 * On "applicationInitialized": creates the error/event logger (`v_R`),
 * flushes any queued errors/events from `wl` (pre-init buffer).
 *
 * Registers API methods:
 *  - queueOfflineAction, updateDownloadState, pauseVideoDownload,
 *    resumeVideoDownload, isOrchestrationLeader, refreshAllStaleEntities,
 *    setUpPositionSyncInterval
 *
 * [was: fSS extends PlayerModule]
 *
 * @class OfflineActionsModule
 */
export class OfflineActionsModule { // was: fSS (line 100766)
  constructor(api) { // was: Q
    // super(api);
    this.events = new EventHandler();
    registerDisposable(this, this.events);

    this.events.B(api, "applicationInitialized", () => {
      let handleError; // was: c
      let logEvent; // was: W
      ({ handleError = reportErrorToGel, logEvent = logGelEvent } = {});

      // Create the logger, flush pre-init queue
      Lg = new v_R(handleError, logEvent); // was: Lg, v_R
      while (wl.length > 0) { // was: wl — pending events queue
        const entry = wl.shift(); // was: W (reused)
        switch (entry.type) {
          case "ERROR":
            Lg.Lw(entry.payload); // was: Lw — handle error
            break;
          case "EVENT":
            Lg.logEvent(entry.eventType, entry.payload);
        }
      }
    });

    R(this.api, "queueOfflineAction", this.queueOfflineAction.bind(this));
    R(this.api, "updateDownloadState", this.updateDownloadState.bind(this));
    R(this.api, "pauseVideoDownload", this.pauseVideoDownload.bind(this));
    R(this.api, "resumeVideoDownload", this.resumeVideoDownload.bind(this));
    R(this.api, "isOrchestrationLeader", this.isOrchestrationLeader.bind(this));
    R(this.api, "refreshAllStaleEntities", this.refreshAllStaleEntities.bind(this));
    R(this.api, "setUpPositionSyncInterval", this.setUpPositionSyncInterval.bind(this));
  }

  async queueOfflineAction(action, param1, param2, param3) { // was: Q, c, W, m
    const offlineManager = getOfflineModule(this.api.CO()); // was: K, JT
    if (offlineManager) {
      const results = await offlineManager.C9([action], param1, param2, param3); // was: Q (reused)
      if (results.length) return results[0];
    }
    return Promise.reject();
  }

  updateDownloadState(videoId, state) { // was: Q, c
    const offlineManager = getOfflineModule(this.api.CO()); // was: W
    return offlineManager ? offlineManager.updateDownloadState(videoId, state) : Promise.reject();
  }

  pauseVideoDownload(videoId) { // was: Q
    const offlineManager = getOfflineModule(this.api.CO()); // was: c
    if (offlineManager) offlineManager.uq(videoId); // was: uq — pause
  }

  async resumeVideoDownload(videoId) { // was: Q
    const offlineManager = getOfflineModule(this.api.CO()); // was: c
    return offlineManager ? offlineManager.jV(videoId) : Promise.reject(); // was: jV — resume
  }

  isOrchestrationLeader() {
    return this.api.isOrchestrationLeader();
  }

  refreshAllStaleEntities(maxAgeSec) { // was: Q
    if (maxAgeSec === undefined) maxAgeSec = 14400;
    const offlineManager = getOfflineModule(this.api.CO()); // was: c
    return offlineManager ? offlineManager.refreshAllStaleEntities(maxAgeSec) : Promise.reject();
  }

  setUpPositionSyncInterval(interval) { // was: Q
    const offlineManager = getOfflineModule(this.api.CO()); // was: c
    if (offlineManager) offlineManager.setUpPositionSyncInterval(interval);
  }
}

// ---------------------------------------------------------------------------
// YpcClickwrapOverlayModule  [was: vWS]  (lines 100825–100900)
// ---------------------------------------------------------------------------

/**
 * "Would you like to start this rental?" clickwrap overlay for YPC content.
 *
 * Loads when `videoData.UY` (has clickwrap) is true and `videoData.u_` (dismissed)
 * is false. Creates a DOM overlay with a confirm button; on confirm, hides the
 * overlay and fires `qP("ypcRentalActivation")`.
 *
 * [was: vWS extends PlayerModule]
 *
 * @class YpcClickwrapOverlayModule
 */
export class YpcClickwrapOverlayModule { // was: vWS (line 100825)
  constructor(api) { // was: Q
    // super(api);
    this.loaded = false; // was: !1
    this.overlay = null;
    this.events = new EventHandler(api);
    registerDisposable(this, this.events);

    this.W = new EventHandler(api); // was: W — secondary event handler group
    registerDisposable(this, this.W);

    this.events.B(api, "modulesCreated", () => {
      if (this.shouldLoad()) this.load(); // was: B1
    });
    this.events.B(api, "modulesDestroyed", (reason) => { // was: c
      let shouldUnload = true; // was: W
      switch (reason) {
        case 2:
        case 3:
          shouldUnload = false;
          break;
        case 4:
          shouldUnload = this.api.getPresentingPlayerType() === 1;
      }
      if (shouldUnload) this.unload();
    });
  }

  /** @returns {boolean} whether the clickwrap should show [was: B1] */
  shouldLoad() { // was: B1 (line 100852)
    const videoData = this.api.getVideoData(); // was: Q
    return videoData.UY && !videoData.u_;
  }

  /** Create and display the rental confirmation overlay. [was: load] (line 100856) */
  load() {
    if (this.loaded || isWebUnplugged(this.api.G())) return; // was: g.X7 — is TV

    this.overlay = new PlayerComponent({
      C: "div",
      yC: ["ytp-ypc-clickwrap-overlay", "ytp-player-content"],
      V: [
        { C: "h2", Z: "ytp-ypc-clickwrap-header", eG: "Would you like to start this rental?" },
        { C: "div", Z: "ytp-ypc-clickwrap-description", eG: this.api.getVideoData().getUserSettings },
        { C: "button", yC: ["ytp-ypc-clickwrap-confirm", "ytp-button"], eG: "Start rental period" },
      ],
    });
    registerDisposable(this, this.overlay);
    insertAtLayer(this.api, this.overlay.element, 4);

    this.overlay.B(this.overlay.z2("ytp-ypc-clickwrap-confirm"), "click", () => {
      this.onConfirm();
    });
    this.loaded = true;
  }

  /** Handle confirm button click. [was: onConfirm] (line 100882) */
  onConfirm() {
    if (this.overlay) this.overlay.hide();
    this.W.B(this.api, "videodatachange", () => {
      this.api.checkAdExperiment("ypcRentalActivation"); // was: qP — fire player event
    });
    this.api.checkAdExperiment("ypcRentalActivation");
  }

  /** Tear down the overlay. [was: unload] (line 100890) */
  unload() {
    if (!this.loaded) return;
    if (this.overlay) {
      this.overlay.dispose();
      this.overlay = null;
    }
    this.W.O(); // was: O — unsubscribe all
    this.loaded = false;
  }

  /** Dispose. [was: WA] (line 100896) */
  dispose() { // was: WA
    this.unload();
    // super.WA()
  }
}

// ---------------------------------------------------------------------------
// QualityDataModule  [was: aSo]  (lines 100902–101001)
// ---------------------------------------------------------------------------

/**
 * Module providing available quality data for the settings menu.
 *
 * Registers:
 *  - getAvailableQualityData → builds list of playable quality entries
 *  - getAvailableQualityDataAndMessaging → quality data + optional messaging
 *  - getPaygatedAudioQualityData → restricted audio quality entries
 *
 * Handles paygated (premium) quality metadata and deduplication of entries.
 * When `web_player_enable_premium_hbr_in_h5_api` is enabled, merges premium
 * and free quality labels with special ordering (paygated first).
 *
 * [was: aSo extends PlayerModule]
 *
 * @class QualityDataModule
 */
export class QualityDataModule { // was: aSo (line 100902)
  constructor(api) { // was: Q
    // super(api);
    R(api, "getAvailableQualityData", () => this.getAvailableQualityData());
    R(api, "getAvailableQualityDataAndMessaging", () => this.getAvailableQualityDataAndMessaging());
    R(api, "getPaygatedAudioQualityData", () => this.getPaygatedAudioQualityData());
  }

  /**
   * Quality data + optional messaging string.
   *
   * [was: getAvailableQualityDataAndMessaging] (line 100909)
   *
   * @returns {{ qualityData: Array, qualityMessagingFormattedString: undefined }}
   */
  getAvailableQualityDataAndMessaging() {
    return {
      qualityData: this.getAvailableQualityData(),
      qualityMessagingFormattedString: undefined,
    };
  }

  /**
   * Build available quality list from adaptive formats + paygated metadata.
   *
   * [was: getAvailableQualityData] (line 100915)
   *
   * @returns {Array} Array of quality entry objects
   */
  getAvailableQualityData() {
    const videoData = this.api.getVideoData(); // was: Q
    if (!videoData) return [];

    let combined = []; // was: c
    const paygatedMeta = videoData.getPlayerResponse()?.playabilityStatus?.paygatedQualitiesMetadata; // was: W
    const paygatedDetailsMap = Tty(paygatedMeta); // was: m — itag→details map
    const restrictedFormats = paygatedMeta?.restrictedAdaptiveFormats; // was: K

    if (restrictedFormats) {
      const formats = []; // was: W (reused)
      for (const fmt of restrictedFormats) { // was: T
        // Skip audio tracks when premium audio upsell is enabled
        if (fmt.mimeType?.includes("audio") && this.api.X("enable_lr_upsell_for_premium_high_quality_audio")) {
          continue;
        }
        const format = buildFormatDescriptor(
          fmt.mimeType, fmt.quality, fmt.itag.toString(),
          fmt.width.toString(), fmt.height.toString(),
          fmt.qualityLabel,
          fmt.qualityOrdinal && qualityOrdinalEnum[fmt.qualityOrdinal], // was: VEx — ordinal→value map
        ); // was: K (reused)
        formats.push(format);
      }

      const availableQualities = buildFormatConfig(videoData); // was: Q (reused)
      sortFormats(formats); // was: jQ — sort formats

      const playableFormats = []; // was: T
      for (const fmt of formats) { // was: r
        if (onInternalVideoDataChange(availableQualities, fmt, this.api.G().K) === true) { // was: Lc — check playability
          playableFormats.push(fmt);
        }
      }
      combined = combined.concat(oUn(playableFormats, false, paygatedDetailsMap)); // was: oUn — convert to quality entries
    }

    const currentFormats = this.api.getSelectableAudioFormats; // was: r (reused) — current available formats
    combined = combined.concat(oUn(currentFormats, true, paygatedDetailsMap));

    let deduplicated = []; // was: m (reused)

    if (this.api.X("web_player_enable_premium_hbr_in_h5_api")) {
      // Premium HBR path: merge labels, put paygated first
      const qualitySet = new Set(); // was: c (reused)
      const labelMap = new Map(); // was: m (reused)
      const byLabel = {}; // was: U

      for (const entry of combined) { // was: I
        const quality = entry.quality; // was: r
        const isPlayable = entry.isPlayable; // was: W (reused)
        const label = entry.qualityLabel; // was: Q (reused)
        if (label && quality) {
          if (isPlayable && labelMap.has(quality) && labelMap.get(quality) !== label) {
            qualitySet.add(quality);
          } else if (isPlayable) {
            labelMap.set(quality, label);
          }
          if (!byLabel[label]) byLabel[label] = entry;
        }
      }

      const result = []; // was: I (reused)
      for (const entry of Object.values(byLabel)) { // was: X
        const quality = entry.quality; // was: U (reused)
        if (quality && !qualitySet.has(quality)) {
          entry.formatId = undefined;
        }
        result.push(entry);
      }

      // Move paygated entries to the front
      let insertIdx = 0; // was: I (reused)
      for (let i = 0; i < result.length; i++) { // was: U (reused)
        if (result[i].paygatedQualityDetails) {
          const item = result[i]; // was: m (reused)
          result.splice(i, 1);
          result.splice(insertIdx, 0, item);
          insertIdx++;
        }
      }
      return result;
    }

    // Standard dedup path
    const seen = {}; // was: X
    for (const entry of combined) { // was: U
      const quality = entry.quality; // was: I
      if (!seen[quality]) {
        entry.formatId = undefined;
        deduplicated.push(entry);
        seen[quality] = true;
      }
    }
    return deduplicated;
  }

  /**
   * Build paygated audio quality entries from restricted adaptive formats.
   *
   * [was: getPaygatedAudioQualityData] (line 100974)
   *
   * @returns {Array} Array of audio quality objects
   */
  getPaygatedAudioQualityData() {
    const videoData = this.api.getVideoData(); // was: Q
    if (!videoData) return [];

    const paygatedMeta = videoData.getPlayerResponse()?.playabilityStatus?.paygatedQualitiesMetadata; // was: Q (reused)
    let restrictedFormats = paygatedMeta?.restrictedAdaptiveFormats; // was: c
    if (!restrictedFormats) return [];

    const detailsMap = Tty(paygatedMeta); // was: Q (reused)
    const results = []; // was: W

    for (const fmt of restrictedFormats) { // was: m
      if (!fmt.mimeType?.includes("audio")) continue;

      const entry = { // was: c (reused)
        formatId: fmt.itag?.toString(),
        audioQuality: fmt.audioQuality,
      };
      const details = fmt.itag ? detailsMap[fmt.itag.toString()] : undefined; // was: K
      if (details) {
        entry.paygatedQualityDetails = {
          paygatedIndicatorText: details.paygatedIndicatorText,
          endpoint: details.endpoint,
          trackingParams: details.trackingParams,
        };
      }
      results.push(entry);
    }
    return results;
  }
}

// ---------------------------------------------------------------------------
// Media Integrity Error Codes  [was: Ga4]  (lines 101003–101009)
// ---------------------------------------------------------------------------

/**
 * Maps media integrity error names to numeric codes.
 *
 * [was: Ga4]
 */
export const MEDIA_INTEGRITY_ERROR_CODES = { // was: Ga4 (line 101003)
  "internal-error": -1,
  "non-recoverable-error": -2,
  "api-disabled-by-application": -3,
  "invalid-argument": -4,
  "token-provider-invalid": -5,
};

// ---------------------------------------------------------------------------
// D6DE4VideoBindingModule  [was: $91]  (lines 101010–101066)
// ---------------------------------------------------------------------------

/**
 * Handles D6DE4 (device identity) video binding changes for DRM/integrity.
 *
 * On "d6de4videobindingchange": attaches coldStartInfo or error code to
 * the binding, using a deferred promise chain (`this.W`).
 *
 * On "csiinitialized": calls `UOy` to sync CSI timing.
 *
 * [was: $91 extends PlayerModule]
 *
 * @class D6DE4VideoBindingModule
 */
export class D6DE4VideoBindingModule { // was: $91 (line 101010)
  constructor(api) { // was: Q
    // super(api);
    this.A = 1; // was: A — client state (starts at 1)
    this.KO = null; // was: KO — CSI timer reference
    this.Rk = { // was: Rk — callback interface
      gsF: () => this.A, // was: gsF — getState function
    };
    this.events = new EventHandler(api);
    registerDisposable(this, this.events);

    this.events.B(api, "d6de4videobindingchange", (binding) => { // was: c
      this.enqueueEntry(binding); // was: TQ — process binding
    });
    this.events.B(api, "csiinitialized", () => {
      startMediaIntegrity(this); // was: UOy — CSI init sync
    });
  }

  /**
   * Process a video binding change.
   *
   * If the promise (`this.W`) has resolved (`this.O` truthy), calls `Io7` directly.
   * Otherwise chains onto the promise. If neither promise nor resolved flag, logs
   * flags via `tJ`.
   *
   * [was: TQ] (line 101029)
   *
   * @param {object} binding - Video binding data [was: Q]
   */
  enqueueEntry(binding) { // was: TQ
    if (!isMediaIntegrityAvailable()) return; // was: kB — is D6DE4 enabled

    if (!this.O && this.W) {
      // Promise pending
      binding.iN = { coldStartInfo: { clientState: this.A } };
      try {
        this.W.then(
          () => { requestMediaIntegrityToken(this, binding); }, // was: Io7 — process resolved binding
          (error) => { // was: c
            YB(error, "player_update"); // was: YB — log error
            this.handleError(error, binding);
          },
        );
      } catch (error) { // was: c
        YB(error, "player_update_catch");
        this.handleError(error, binding);
      }
    } else if (this.O) {
      requestMediaIntegrityToken(this, binding);
    } else {
      this.api.RetryTimer("pf", { m: this.O ? 1 : 0, p: this.W ? 1 : 0 });
    }
  }

  /**
   * Handle error from D6DE4 binding.
   *
   * Extracts error code from `mediaIntegrityErrorName` or `.code()`.
   *
   * [was: handleError] (line 101056)
   *
   * @param {Error}  error   [was: Q]
   * @param {object} binding [was: c]
   */
  handleError(error, binding) { // was: handleError
    reportWarning(error);
    let code = 0; // was: W
    if (error.mediaIntegrityErrorName) {
      if (!code) code = MEDIA_INTEGRITY_ERROR_CODES[error.mediaIntegrityErrorName];
    } else if (error.code) {
      code = error.code();
    }
    binding.iN = { SurveyTriggerMetadata: { code } };
  }
}

// ---------------------------------------------------------------------------
// PictureInPictureButton  [was: PD9]  (lines 101068–101110)
// ---------------------------------------------------------------------------

/**
 * The PiP toggle button shown in the player controls.
 *
 * Updates its tooltip between "Picture-in-picture" and "Exit picture-in-picture"
 * based on visibility state.
 *
 * [was: PD9 extends g.k]
 *
 * @class PictureInPictureButton
 */
export class PictureInPictureButton { // was: PD9 (line 101068)
  constructor(api) { // was: Q
    // super({ C: "button", ... })
    this.api = api;
    // this.listen("click", this.onClick);

    const visibility = this.api.OV(); // was: c — visibility controller
    const subscriptionId = visibility.subscribe("visibilitystatechange", () => { // was: W
      this.updateLabel(visibility.Zh()); // was: ZF, Zh — is PiP active
    });
    this.addOnDisposeCallback(() => {
      visibility.bU(subscriptionId); // was: bU — unsubscribe
    });

    listenOnPlayerRoot(api, this.element, this); // was: EP — register tooltip
    this.updateLabel(visibility.Zh());
  }

  /**
   * Update button label / tooltip.
   *
   * [was: ZF] (line 101096)
   *
   * @param {boolean} isPipActive [was: Q]
   */
  updateLabel(isPipActive) { // was: ZF
    const label = isPipActive ? "Exit picture-in-picture" : "Picture-in-picture"; // was: Q (reused)
    if (this.api.G().X("player_tooltip_data_title_killswitch")) {
      this.update({ title: label, "data-title-no-tooltip": label });
    } else {
      this.update({ "data-tooltip-title": label, "data-title-no-tooltip": label });
    }
    this.api.WI(); // was: WI — refresh tooltips
  }

  /** Handle click. [was: onClick] (line 101107) */
  onClick() {
    this.api.togglePictureInPicture();
  }
}

// ---------------------------------------------------------------------------
// PictureInPictureModule  [was: lSH]  (lines 101112–101143)
// ---------------------------------------------------------------------------

/**
 * Module that manages the PiP button lifecycle and document PiP integration.
 *
 * [was: lSH extends PlayerModule]
 *
 * @class PictureInPictureModule
 */
export class PictureInPictureModule { // was: lSH (line 101112)
  constructor(api) { // was: Q
    // super(api);
    this.events = new EventHandler(api);
    registerDisposable(this, this.events);

    this.events.B(api, "standardControlsInitialized", () => {
      this.createButton();
    });

    if (
      isWebExact(this.api.G()) && // was: g.rT — is desktop
      (this.X("web_watch_pip") || this.X("web_shorts_pip"))
    ) {
      R(this.api, "setDocumentPictureInPicture", (enable) => { // was: c
        this.setDocumentPictureInPicture(enable);
      });
    }
  }

  /** Create and attach the PiP button. [was: createButton] (line 101126) */
  createButton() {
    this.button = new PictureInPictureButton(this.api); // was: PD9
    registerDisposable(this, this.button);
    this.api.KD(this.button); // was: KD — add control button

    this.events.B(this.api, "videodatachange", () => {
      XpK(this); // was: XpK — update button visibility
    });
    XpK(this);
  }

  /**
   * Toggle document-level PiP mode.
   *
   * [was: setDocumentPictureInPicture] (line 101136)
   *
   * @param {boolean} enable [was: Q]
   */
  setDocumentPictureInPicture(enable) { // was: Q
    this.api.OV().ContextMenuItem(enable); // was: RN — set PiP state
    const isPip = this.api.Zh(); // was: Q (reused), Zh — is PiP active
    const pipModule = getMiniplayerModule(this.api.CO()); // was: c, J7X — get PiP module
    if (pipModule) {
      isPip ? pipModule.load() : pipModule.unload();
    }
    this.api.publish("documentpictureinpicturechange");
  }
}

// ---------------------------------------------------------------------------
// PlayableSequencesModule (YTO)  [was: ui1]  (lines 101145–101252)
// ---------------------------------------------------------------------------

/**
 * Manages playable sequences (YouTube Originals / premium prerolls).
 *
 * Shows a "Video will begin shortly" preroll overlay (class `ytp-yto-overlay`)
 * and manages cue range transitions between preroll (type 5/6/7) and content (type 1).
 *
 * Player state bits used:
 *  - W(1)  = buffering
 *  - W(2)  = ended / paused (triggers advance in preroll)
 *  - W(16) = seeking
 *  - W(32) = UI seeking
 *  - W(128) = error
 *
 * [was: ui1 extends PlayerModule]
 *
 * @class PlayableSequencesModule
 */
export class PlayableSequencesModule { // was: ui1 (line 101145)
  constructor(api) { // was: Q
    // super(api);
    this.loaded = false; // was: !1
    this.L = 0; // was: L — preroll counter
    this.W = false; // was: W — in transition flag
    this.J = {}; // was: J — sequence metadata
    this.A = []; // was: A — queued cue range ids
    this.j = 0; // was: j — current sequence index
    this.D = false; // was: D — ended during preroll flag
    this.events = new EventHandler(api);
    registerDisposable(this, this.events);

    this.O = new EventHandler(api); // was: O — load-phase listeners
    registerDisposable(this, this.O);

    this.events.B(api, "modulesCreated", () => {
      if (this.shouldLoad()) this.load(); // was: B1
    });

    this.events.B(api, "modulesDestroyed", (reason) => { // was: c
      const playerType = this.api.getPresentingPlayerType(); // was: W
      let shouldUnload; // was: c (reused)
      switch (reason) {
        case 2:
        case 3:
          shouldUnload =
            playerType !== 1 && !(playerType === 5 || playerType === 6 || playerType === 7);
          break;
        case 4:
          shouldUnload = !this.W;
          break;
        default:
          shouldUnload = true;
      }
      if (shouldUnload) this.unload();
    });
  }

  /** @returns {boolean} whether playable sequences are configured [was: B1] (line 101180) */
  shouldLoad() { // was: B1
    return this.api.getVideoData().getRemainingInRange.includes("playableSequences"); // was: RR — enabled modules
  }

  /** Initialize the preroll overlay and event listeners. [was: load] (line 101183) */
  load() {
    if (this.loaded) return;

    if (!this.K) {
      this.K = new PlayerComponent({
        C: "div",
        yC: ["ytp-player-content", "ytp-yto-overlay"],
        V: [
          {
            C: "div",
            yC: ["ytp-yto-preroll-message"],
            eG: "Video will begin shortly",
          },
        ],
      });
      registerDisposable(this, this.K);
      AMw(this, false); // was: AMw — set overlay visibility
      insertAtLayer(this.api, this.K.element, 4);
    }

    const currentPlayerType = this.api.getPresentingPlayerType(); // was: Q

    this.O.B(this.api, "playbackChange", () => {
      const isPreroll = this.api.getPresentingPlayerType() === 5; // was: c
      toggleClass(this.api.getRootNode(), "ytp-yto-preroll", isPreroll); // was: g.L — toggle class
      AMw(this, isPreroll);
    });

    this.O.B(this.api, "presentingplayerstatechange", (stateChange) => { // was: c
      this.onStateChange(stateChange);
    });

    this.O.B(this.api, cueRangeStartId("yto"), (cueRange, data) => { // was: c, W
      this.onCueRangeEnter(cueRange, data);
    });

    this.O.B(this.api, "ytoprerollinternstitialnext", () => {
      VFm(this); // was: VFm — advance to next sequence
    });

    BtX(this); // was: BtX — install cue ranges
    this.loaded = true;
    this.api.checkAdExperiment("playableSequences", currentPlayerType); // was: qP — fire module ready
  }

  /**
   * Handle cue range enter during YTO playback.
   *
   * Skips if ended (W(2)) during an active preroll, otherwise queues and
   * triggers sequence transition.
   *
   * [was: onCueRangeEnter] (line 101221)
   *
   * @param {object} cueRange [was: Q]
   */
  onCueRangeEnter(cueRange) { // was: Q
    const id = cueRange.getId(); // was: Q (reused)
    if (this.W) return; // in transition

    if (this.api.getPlayerStateObject(1).W(2)) { // ended state
      if (this.D) return;
    } else {
      this.D = false;
    }

    if (!this.A.includes(id)) this.A.push(id);

    if (this.api.getPresentingPlayerType() === 1) {
      loadNextVideoByPlayerVars(this); // was: eYX — begin sequence transition
    }
  }

  /**
   * Handle presenting player state changes during preroll.
   *
   * If the preroll player (type 5/6/7) ends (W(2)) or errors (W(128)),
   * advances to the next sequence.
   *
   * [was: onStateChange] (line 101233)
   *
   * @param {object} stateChange [was: Q]
   */
  onStateChange(stateChange) { // was: Q
    const playerType = this.api.getPresentingPlayerType(); // was: c
    const state = stateChange.state; // was: Q (reused)

    if (this.W) return;
    if (playerType !== 5 && playerType !== 6 && playerType !== 7) return;
    if (state.W(1) || state.W(16) || state.W(32)) return; // buffering/seeking

    const isError = state.W(128); // was: c (reused)
    if (state.W(2) || isError) { // ended or error
      VFm(this);
    }
  }

  /** Reset all state. [was: unload] (line 101239) */
  unload() {
    if (!this.loaded) return;
    this.L = 0;
    this.D = false;
    this.W = false;
    this.J = {};
    this.j = 0;
    this.A.length = 0;
    this.O.O(); // was: O.O — unsubscribe all
    this.loaded = false;
  }

  /** Dispose. [was: WA] (line 101248) */
  dispose() { // was: WA
    this.unload();
    // super.WA()
  }
}

// ---------------------------------------------------------------------------
// OnlinePlaybackPositionStore  [was: hoa]  (lines 101254–101272)
// ---------------------------------------------------------------------------

/**
 * Batched persistence store for video playback positions using the entity store.
 *
 * Uses a rate-limit delay (default 200ms) before writing.
 *
 * [was: hoa]
 *
 * @class OnlinePlaybackPositionStore
 */
export class OnlinePlaybackPositionStore { // was: hoa (line 101254)
  constructor(batchDelayMs = 200) { // was: Q
    this.A = batchDelayMs; // was: A — batch delay
    this.W = undefined; // was: W — entity store reference
    this.O = undefined; // was: O — last written entity key
  }

  /**
   * Delete a playback position entity.
   *
   * [was: delete] (line 101259)
   *
   * @param {string} entityKey [was: Q]
   */
  async delete(entityKey) { // was: Q
    await ensurePesInitialized(this); // was: xOy — ensure store initialized
    if (!this.W) return;
    try {
      const entityId = serializeEntityKey(entityKey, "videoPlaybackPositionEntity"); // was: c
      await deleteEntityInTransaction(this.W, entityId); // was: g.oz — delete from store
      if (this.O === entityKey) this.O = undefined;
    } catch (error) { // was: c
      throw Error("Failed to delete playback position", { cause: error });
    }
  }
}

// ---------------------------------------------------------------------------
// OnlinePlaybackPositionModule  [was: zo4]  (lines 101274–101282)
// ---------------------------------------------------------------------------

/**
 * Module that wires the playback position store to the player API.
 *
 * Registers:
 *  - addOrUpdateOnlinePlaybackPosition → nUO (upsert)
 *  - deleteOnlinePlaybackPosition → store.delete
 *
 * [was: zo4 extends PlayerModule]
 *
 * @class OnlinePlaybackPositionModule
 */
export class OnlinePlaybackPositionModule { // was: zo4 (line 101274)
  constructor(api) { // was: Q
    // super(api);
    const configValue = api.G().getExperimentFlags.W.BA(tR7); // was: Q (reused) — config param
    const store = new OnlinePlaybackPositionStore(Number(configValue) || undefined); // was: c

    R(this.api, "addOrUpdateOnlinePlaybackPosition", (key, position, extra) => // was: W, m, K
      savePlaybackPosition(store, key, position, extra), // was: nUO
    );
    R(this.api, "deleteOnlinePlaybackPosition", (key) => store.delete(key)); // was: W
  }
}

// ---------------------------------------------------------------------------
// MusicBarUiModule  [was: CDZ]  (lines 101284–101298)
// ---------------------------------------------------------------------------

/**
 * Simple module toggling `ytp-player-in-bar-disable-ui` class on the root node.
 *
 * Registers:
 *  - musicDisableUi  → add class
 *  - musicEnableUi   → remove class
 *
 * [was: CDZ extends PlayerModule]
 *
 * @class MusicBarUiModule
 */
export class MusicBarUiModule { // was: CDZ (line 101284)
  constructor(api) { // was: Q
    // super(api);
    this.events = new EventHandler(api);
    registerDisposable(this, this.events);

    R(this.api, "musicDisableUi", () => {
      addClass(this.api.getRootNode(), "ytp-player-in-bar-disable-ui"); // was: g.xK — addClass
    });
    R(this.api, "musicEnableUi", () => {
      removeClass(this.api.getRootNode(), "ytp-player-in-bar-disable-ui"); // was: g.n6 — removeClass
    });
  }
}

// ---------------------------------------------------------------------------
// SuggestedActionBadge  [was: aN]  (lines 101300–101449)
// ---------------------------------------------------------------------------

/**
 * Base class for suggested action badges (e.g. "Related videos", "Shop", etc.).
 *
 * Manages an expand/collapse animation with timers, tracks control visibility,
 * fullscreen state, card state, annotation visibility, and offline slate.
 *
 * Has an icon container, expanded content label, dismiss button, and a badge
 * wrapper with CSS transitions controlled by `g.QR` (FadeAnimation).
 *
 * [was: aN extends g.k]
 *
 * @class SuggestedActionBadge
 */
export class SuggestedActionBadge { // was: aN (line 101300)
  constructor(playerApi, showIcon = true, useDivWrapper = false) { // was: Q, c, W
    // super({ C: "div", Z: "ytp-suggested-action" });
    this.U = playerApi; // was: U — player API
    this.JJ = showIcon; // was: JJ — whether to show icon
    this.Xw = false; // was: Xw
    this.enabled = false;
    this.expanded = false;
    this.T2 = false; // was: T2 — controls auto-hidden
    this.A = false; // was: A — has client VE
    this.MM = false; // was: MM — has dismiss VE
    this.PA = false; // was: PA — controls currently visible
    this.Ka = false; // was: Ka — pinned open
    this.EXP_748402147 = false; // was: Hw — cards open

    /** Debounced width reset [was: Ww] */
    this.SLOT_MESSAGE_MARKER = new ThrottleTimer(() => {
      this.badge.element.style.width = "";
    }, 200, this);

    /** Debounced visibility recalc [was: WB] */
    this.isInAdPlayback = new ThrottleTimer(() => {
      updateBadgeControlsVisibility(this); // was: pf — recalc position
      updateBadgeExpansion(this); // was: Q4 — recalc expand state
    }, 200, this);

    this.readRepeatedMessageField = this.U.X("delhi_modern_web_player") ? 40 : 34; // was: iX — collapsed badge width

    // Dismiss button
    this.dismissButton = new PlayerComponent({
      C: "button",
      yC: ["ytp-suggested-action-badge-dismiss-button-icon", "ytp-button"],
    });
    registerDisposable(this, this.dismissButton);

    // Expanded content container with title label
    this.K = new PlayerComponent({ // was: K
      C: "div",
      Z: "ytp-suggested-action-badge-expanded-content-container",
      V: [
        { C: "label", Z: "ytp-suggested-action-badge-title", eG: "{{badgeLabel}}" },
        this.dismissButton,
      ],
    });
    registerDisposable(this, this.K);

    // Icon element
    this.D = new PlayerComponent({ // was: D
      C: "div",
      Z: "ytp-suggested-action-badge-icon",
      eG: "{{icon}}",
      N: { "aria-hidden": "true" },
    });
    registerDisposable(this, this.D);

    // Icon container
    this.jG = new PlayerComponent({ // was: jG
      C: "div",
      Z: "ytp-suggested-action-badge-icon-container",
    });
    if (showIcon) this.D.createVisualElement(this.jG.element); // was: x0 — append to
    registerDisposable(this, this.jG);

    // Badge wrapper
    this.badge = new PlayerComponent({
      C: useDivWrapper ? "div" : "button",
      yC: ["ytp-button", "ytp-suggested-action-badge", "ytp-suggested-action-badge-with-controls"],
      V: [this.jG, this.K],
    });
    registerDisposable(this, this.badge);
    this.badge.createVisualElement(this.element);

    // Fade animations
    this.Ie = new FadeAnimationController(this.badge, 250, false, 100, () => { // was: Ie
      if (this.U.X("web_player_overlay_positioned_layout")) this.hide();
    });
    registerDisposable(this, this.Ie);

    if (playerApi.X("web_player_overlay_positioned_layout")) this.hide();

    this.nO = new FadeAnimationController(this.K, 250, false, 100); // was: nO — content fade
    registerDisposable(this, this.nO);

    this.mainVideoEntityActionMetadataKey = new AnimationFrameTimer(this.tQ, null, this); // was: QE — expand animation timer
    registerDisposable(this, this.mainVideoEntityActionMetadataKey);

    this.applyQualityConstraint = new AnimationFrameTimer(this.FO, null, this); // was: d3 — width animation timer
    registerDisposable(this, this.applyQualityConstraint);

    registerDisposable(this, this.SLOT_MESSAGE_MARKER);
    registerDisposable(this, this.isInAdPlayback);

    // Register VE tracking
    this.U.createServerVe(this.badge.element, this.badge, true);
    this.U.createServerVe(this.dismissButton.element, this.dismissButton, true);

    // Event listeners
    this.B(this.U, "onHideControls", () => { this.setControlsVisible(false); }); // was: Y0
    this.B(this.U, "onShowControls", () => { this.setControlsVisible(true); });
    this.B(this.badge.element, "click", this.UH); // was: UH — badge click handler (abstract)
    this.B(this.dismissButton.element, "click", this.L); // was: L — dismiss click handler (abstract)
    this.B(this.U, "pageTransition", this.isCompressedDomainComposite); // was: gA — page transition handler
    this.B(this.U, "appresize", this.O); // was: O — resize handler
    this.B(this.U, "fullscreentoggled", this.invokeUnaryRpc); // was: BG — fullscreen toggle
    this.B(this.U, "cardstatechange", this.qY); // was: qY — card state
    this.B(this.U, "annotationvisibility", this.YR, this); // was: YR
    this.B(this.U, "offlineslatestatechange", this.unwrapTrustedResourceUrl, this); // was: x3
  }

  /** Badge click handler (override in subclass). [was: UH] */
  UH() {}

  /** Dismiss click handler (override in subclass). [was: L] */
  L() {}

  /** @returns {boolean} Whether the badge should be shown. [was: Y] (line 101392) */
  Y() {
    return true;
  }

  /**
   * Run expand/collapse animation.
   *
   * Measures the expanded content width, toggles CSS class, sets badge width,
   * and starts the width-tweening timer.
   *
   * [was: tQ] (line 101394)
   */
  tQ() {
    let contentWidth; // was: Q
    if (this.expanded) {
      this.nO.show();
      contentWidth = this.K.element.scrollWidth;
    } else {
      contentWidth = this.K.element.scrollWidth;
      this.nO.hide();
    }
    this.w6 = this.readRepeatedMessageField + contentWidth; // was: w6 — full expanded width
    toggleClass(this.badge.element, "ytp-suggested-action-badge-expanded", this.expanded);
    this.badge.element.style.width = `${this.expanded ? this.iX : this.w6}px`;
    this.applyQualityConstraint.start();
  }

  /**
   * Second phase of width animation (tween to target).
   *
   * [was: FO] (line 101404)
   */
  FO() {
    this.badge.element.style.width = `${this.expanded ? this.w6 : this.iX}px`;
    this.SLOT_MESSAGE_MARKER.start(); // debounced width clear
  }

  /**
   * Log visibility for VE tracking.
   *
   * [was: La] (line 101408)
   */
  La() {
    if (this.A) this.U.logVisibility(this.badge.element, this.Y());
    if (this.MM) this.U.logVisibility(this.dismissButton.element, this.Y() && this.toggleFineScrub());
  }

  /**
   * Update controls-visible state and recalculate.
   *
   * [was: Y0] (line 101412)
   *
   * @param {boolean} visible [was: Q]
   */
  setControlsVisible(visible) { // was: Y0
    this.PA = visible;
    updateBadgeExpansion(this); // was: Q4
    updateBadgeControlsVisibility(this);
    this.O();
  }

  /** Offline slate handler. [was: x3] (line 101418) */
  unwrapTrustedResourceUrl() {
    toggleClass(this.badge.element, "ytp-suggested-action-badge-with-offline-slate", true);
  }

  /**
   * Whether expanded content should be shown.
   *
   * [was: EC] (line 101421)
   *
   * @returns {boolean}
   */
  toggleFineScrub() {
    return this.Ka || this.PA || !this.T2;
  }

  /** Visibility update. [was: O] (line 101424) */
  O() {
    if (this.Y()) {
      this.show();
      this.Ie.show();
    } else {
      this.Ie.hide();
    }
    this.La();
  }

  /** Page transition: disable badge. [was: gA] (line 101429) */
  isCompressedDomainComposite() {
    this.enabled = false;
    this.O();
  }

  /**
   * Log click on badge or dismiss button.
   *
   * [was: J] (line 101433)
   *
   * @param {boolean} isDismiss [was: Q]
   */
  J(isDismiss) { // was: J
    if (isDismiss) {
      if (this.MM) this.U.logClick(this.dismissButton.element);
    } else {
      if (this.A) this.U.logClick(this.badge.element);
    }
  }

  /** Annotation visibility handler. [was: YR] (line 101436) */
  YR() {
    this.O();
  }

  /**
   * Card state change handler.
   *
   * [was: qY] (line 101439)
   *
   * @param {number} cardState [was: Q]
   */
  qY(cardState) { // was: Q
    this.EXP_748402147 = cardState === 1;
    this.O();
    toggleClass(this.badge.element, "ytp-suggested-action-badge-with-offline-slate", false);
  }

  /**
   * Fullscreen toggle handler: add/remove fullscreen class.
   *
   * [was: BG] (line 101444)
   */
  invokeUnaryRpc() {
    toggleClass(this.badge.element, "ytp-suggested-action-badge-fullscreen", this.U.isFullscreen());
    this.O();
  }
}
