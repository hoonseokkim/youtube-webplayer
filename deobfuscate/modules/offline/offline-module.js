/**
 * Offline Module — Main module class registered via g.GN("offline", ...)
 *
 * Source: player_es6.vflset/en_US/offline.js, lines 4526–4605
 * Deobfuscated from the `(function(g) { ... })(_yt_player)` IIFE.
 *
 * The top-level satellite module that exposes offline download capabilities
 * to the player. Delegates to either SND (main YouTube) or sp4 (YouTube Music)
 * manager implementations based on the client type.
 */

import {
  getEntityStore, // was: g.Iz
  openTransaction, // was: g.Kr
  readEntity, // was: g.Yf
  buildEntityKey, // was: g.bX
  parseEntityKey, // was: g.w1
  logEvent, // was: g.eG
  fireEvent, // was: g.xt
  registerDisposable, // was: g.F
  EventHandler, // was: g.db
  isMainYouTube, // was: g.rT
  isYouTubeMusic, // was: g.uL
  isYouTubeMusicEmbedded, // was: g.EQ
  Bo, // was: g.Bo — parse visual element
  xv, // was: g.xv — smart downloads list entity key
} from '../../core/';

import {
  PlayerModule, // was: g.zj
  registerModule, // was: g.GN
} from '../../player/';

import {
  readEntityByKey,
  logWoffleError,
} from './entity-sync.js';

import { filterAndSortFormats } from '../../data/bandwidth-tracker.js'; // was: as
import { forwardPlayback } from '../../ads/dai-cue-range.js'; // was: Fp
import { readRepeatedMessageField } from '../../proto/varint-decoder.js'; // was: iX
import { shouldUseDesktopControls } from '../../data/bandwidth-tracker.js'; // was: tx
import { getWatchNextResponse } from '../../player/player-api.js';
import { PlayerModule } from '../../player/account-linking.js';
import { EventHandler } from '../../core/event-handler.js';
import { readEntityByKey } from './entity-sync.js';
import { toString } from '../../core/string-utils.js';
import { logWoffleError } from './offline-helpers.js';
import { acquireOrchestrationLock } from './download-manager.js';
import {
  updateDownloadStatusEntity,
  acquireOrchestrationLock,
} from './download-manager.js';

// ──────────────────────────────────────────────────────────────────
// Offline playback telemetry
// ──────────────────────────────────────────────────────────────────

/**
 * Returns the playlist ID from the current video's watch-next endpoint,
 * if available. Used to detect "auto-offline" mode.
 * [was: Ujv]
 * Source lines: 3558–3563
 */
function getWatchNextPlaylistId(videoData) { // was: Ujv
  let playlistId;
  const endpoint = videoData.getWatchNextResponse()?.currentVideoEndpoint;
  // Extract playlist ID from the watch endpoint
  if (endpoint?.playlistId) {
    playlistId = endpoint.playlistId;
  }
  return playlistId;
}

/**
 * Fires the "offlinePlaybackStarted" telemetry event when an offline
 * video begins playing.
 * [was: IxW]
 * Source lines: 3564–3582
 */
async function reportOfflinePlaybackStarted(module, videoData) { // was: IxW
  const cpn = videoData.clientPlaybackNonce;
  const payload = {
    cpn,
    offlineSourceVisualElement: Bo(videoData.S || "").getAsJson(),
    selectedOfflineMode: "OFFLINE_NOW",
    isPartialPlayback: false,
  };

  if (videoData.O) payload.videoFmt = Number(videoData.O.itag);
  if (videoData.j) payload.audioFmt = Number(videoData.j.itag);

  const playlistId = getWatchNextPlaylistId(videoData);
  let isAutoOffline = false;

  if (playlistId && videoData.videoId) {
    const videoId = videoData.videoId;
    // Check if this video is part of the smart-downloads list
    isAutoOffline = await (playlistId !== "PPSV"
      ? Promise.resolve(false)
      : module.offlineManager.isInSmartDownloads(videoId)); // was: module.W.T2(videoId)
  }

  if (isAutoOffline) {
    payload.selectedOfflineMode = "OFFLINE_MODE_TYPE_AUTO_OFFLINE";
  }

  module.lastPlaybackCpn = cpn; // was: module.O
  eG("offlinePlaybackStarted", payload);
}

// ──────────────────────────────────────────────────────────────────
// Main YouTube offline manager (extends HdD)
// [was: SND extends HdD]
// Source lines: 4366–4473
// ──────────────────────────────────────────────────────────────────

// (SND and sp4 classes are large — see download-manager.js for their
//  base class HdD and entity handler wiring. They delegate to entity
//  handlers for mainVideoEntity, mainPlaylistEntity, mainDownloadsListEntity,
//  musicTrack, musicPlaylist, musicAlbumRelease respectively.)

// ──────────────────────────────────────────────────────────────────
// Offline Module
// ──────────────────────────────────────────────────────────────────

/**
 * The "offline" satellite module. Top-level entry point for all offline
 * download capabilities. Creates the appropriate manager (SND for YouTube,
 * sp4 for YouTube Music) and wires up player events for:
 *   - Enqueueing downloads via `C9`
 *   - Playback position sync
 *   - Offline playback telemetry
 *   - Download state updates
 *
 * Registered via `g.GN("offline", ...)` at source line 4526.
 *
 * @extends {PlayerModule} [was: g.zj]
 */
export class OfflineModule extends PlayerModule { // was: anonymous class at g.GN("offline", ...)
  constructor() {
    super(...arguments);

    /**
     * Event subscription manager.
     * @type {EventHandler}
     */
    this.events = new EventHandler(this);

    /**
     * Player configuration / experiment flags.
     * [was: FI]
     * @type {Object}
     */
    this.playerConfig = this.player.G(); // was: this.FI

    /**
     * Accessor bag exposed to the player framework.
     * [was: Rk]
     */
    this.Rk = {
      uO0: () => this.offlineManager, // was: this.W
      forwardPlayback: () => this.reportPlaybackIfNeeded(), // was: this.Fp()
      po: (stateEvent) => this.onPlaybackPositionChange(stateEvent), // was: this.po(Q)
    };
  }

  /**
   * Lifecycle: called after construction. Creates the offline manager
   * (SND for YouTube, sp4 for Music) and wires up event listeners.
   *
   * Source lines: 4537–4552
   */
  create() {
    F(this, this.events);

    if (rT(this.playerConfig)) {
      /**
       * The offline manager. For main YouTube: SND; for Music: sp4.
       * [was: W]
       * @type {SND|sp4}
       */
      this.offlineManager = new YouTubeOfflineManager(this.playerConfig, this.player); // was: SND
    } else if (uL(this.playerConfig) || EQ(this.playerConfig)) {
      this.offlineManager = new MusicOfflineManager(this.playerConfig, this.player); // was: sp4
    }

    this.events.B(this.player, "onPlaybackStartExternal", () => {
      this.reportPlaybackIfNeeded();
    });
    this.events.B(this.player, "videodatachange", () => {
      this.reportPlaybackIfNeeded();
    });

    if (this.playerConfig.X("html5_offline_playback_position_sync")) {
      this.events.B(this.player, "presentingplayerstatechange", this.onPlaybackPositionChange);
    }
  }

  /**
   * Whether this module supports a given player type.
   * Always returns false — offline does not gate on player type.
   * [was: GS]
   */
  GS() {
    return false;
  }

  /**
   * Enqueues orchestration actions for the given video/entity IDs.
   * [was: C9]
   * Source lines: 4556–4558
   *
   * @param {string[]} entityIds - Video or entity IDs to process
   * @param {string} entityType - Entity type name
   * @param {string} actionType - Orchestration action type
   * @param {Object} [metadata] - Additional action metadata
   * @returns {Promise<Object[]>}
   */
  async enqueueOrchestrationActions(entityIds, entityType, actionType, metadata) { // was: C9
    if (!this.offlineManager) return Promise.reject();
    return enqueueActions(this.offlineManager, entityIds, entityType, actionType, metadata);
  }

  /**
   * Deletes all offline content.
   * Source lines: 4559–4561
   */
  deleteAll() {
    return this.offlineManager.deleteAll();
  }

  /**
   * Refreshes stale offline video policies.
   * [was: b0]
   * Source lines: 4562–4564
   */
  refreshPolicies(maxAgeSec) { // was: b0
    return this.offlineManager.refreshPolicies(maxAgeSec); // was: this.W.b0(Q)
  }

  /**
   * Refreshes all stale entities (policies + playlists + smart downloads).
   * Source lines: 4565–4567
   */
  refreshAllStaleEntities(maxAgeSec) {
    return this.offlineManager.refreshAllStaleEntities(maxAgeSec);
  }

  /**
   * Sets up the periodic position sync interval.
   * Source lines: 4568–4570
   */
  setUpPositionSyncInterval(intervalMs) {
    this.offlineManager.setUpPositionSyncInterval(intervalMs);
  }

  /**
   * Broadcasts a transfer pause command to other tabs.
   * [was: uq]
   * Source lines: 4571–4573
   */
  pauseTransfer(videoId) { // was: uq
    this.offlineManager.pauseTransfer(videoId); // was: this.W.uq(Q)
  }

  /**
   * Resumes a user-paused transfer.
   * [was: jV]
   * Source lines: 4574–4576
   */
  resumeTransfer(videoId) { // was: jV
    return this.offlineManager.resumeTransfer(videoId); // was: this.W.jV(Q)
  }

  /**
   * Reports offline playback telemetry if the current video is offline
   * and this is a new playback session.
   * [was: Fp]
   * Source lines: 4577–4580
   */
  async reportPlaybackIfNeeded() { // was: Fp
    const videoData = this.player.getVideoData();
    if (videoData.MQ() && getWatchNextPlaylistId(videoData) && this.lastPlaybackCpn !== videoData.clientPlaybackNonce) {
      await reportOfflinePlaybackStarted(this, videoData);
    }
  }

  /**
   * Handles player state changes for playback position syncing.
   * Persists the current playback position when the video ends or pauses.
   * [was: po]
   * Source lines: 4581–4591
   */
  async onPlaybackPositionChange(stateEvent) { // was: po
    const videoData = this.player.getVideoData();
    const currentPosition = videoData.readRepeatedMessageField;

    if (stateEvent.Fq(2) || stateEvent.Fq(512)) {
      const entityStore = await Iz();
      if (entityStore) {
        const videoId = videoData.videoId;
        const mainVideoKey = bX(videoId, "mainVideoEntity");
        const exists = await readEntityByKey(entityStore, mainVideoKey, "mainVideoEntity");
        if (exists) {
          await this.enqueueOrchestrationActions(
            [videoId],
            "videoPlaybackPositionEntity",
            "OFFLINE_ORCHESTRATION_ACTION_TYPE_UPDATE",
            {
              videoPlaybackPositionEntityActionMetadata: {
                lastPlaybackPositionSeconds: Math.floor(currentPosition).toString(),
              },
            }
          );
        }
      } else {
        logWoffleError("PES is undefined");
      }
    }
  }

  /**
   * Whether this tab is the orchestration leader.
   * Source lines: 4592–4594
   */
  isOrchestrationLeader() {
    return this.offlineManager.isOrchestrationLeader();
  }

  /**
   * Directly updates the download state for an entity key.
   * [was: updateDownloadState (already readable)]
   * Source lines: 4595–4603
   */
  async updateDownloadState(entityKey, newState) {
    const entityStore = await Iz();
    if (entityStore) {
      const { entityType, entityId } = w1(entityKey);
      await updateDownloadStatusEntity(entityId, entityType, entityStore, newState, true);
    } else {
      logWoffleError("PES is undefined");
    }
  }
}

// ──────────────────────────────────────────────────────────────────
// Manager stubs (full implementations in download-manager.js)
// ──────────────────────────────────────────────────────────────────

// These are placeholders representing the two concrete manager classes.
// The full implementations span ~1500 lines each and are covered in
// download-manager.js.

/**
 * YouTube main-app offline manager. Handles mainVideoEntity,
 * mainPlaylistEntity, mainDownloadsListEntity, playbackData, transfer,
 * and videoPlaybackPositionEntity entity types.
 * [was: SND extends HdD]
 * Source lines: 4366–4473
 */
class YouTubeOfflineManager { // was: SND
  constructor(config, player) {
    this.config = config;
    this.player = player;
    // ... delegates to HdD constructor (see download-manager.js)
  }
  // See download-manager.js for full method set
  deleteAll() { /* ... */ }
  refreshPolicies(maxAge) { /* ... */ }
  refreshAllStaleEntities(maxAge) { /* ... */ }
  setUpPositionSyncInterval(interval) { /* ... */ }
  pauseTransfer(videoId) { /* ... */ }
  resumeTransfer(videoId) { /* ... */ }
  isOrchestrationLeader() { /* ... */ }
  async isInSmartDownloads(videoId) { return false; }
}

/**
 * YouTube Music offline manager. Handles musicTrack, musicPlaylist,
 * musicAlbumRelease, playbackData, transfer, and
 * videoPlaybackPositionEntity entity types.
 * [was: sp4 extends HdD]
 * Source lines: 4508–4524
 */
class MusicOfflineManager { // was: sp4
  constructor(config, player) {
    this.config = config;
    this.player = player;
  }
  deleteAll() { /* ... */ }
  refreshPolicies(maxAge) { /* ... */ }
  refreshAllStaleEntities(maxAge) { /* ... */ }
  setUpPositionSyncInterval(interval) { /* ... */ }
  pauseTransfer(videoId) { /* ... */ }
  resumeTransfer(videoId) { /* ... */ }
  isOrchestrationLeader() { /* ... */ }
}

// ──────────────────────────────────────────────────────────────────
// Action enqueueing helper
// ──────────────────────────────────────────────────────────────────

/**
 * Enqueues orchestration actions by creating wrapper entities in the
 * entity store and triggering leader election if needed.
 * [was: kL]
 * Source lines: 2500–2522
 *
 * @param {Object} manager - The offline manager instance
 * @param {string[]} entityIds - IDs of entities to act on
 * @param {string} entityType - The entity type
 * @param {string} actionType - The orchestration action type
 * @param {Object} [extraMetadata] - Additional action metadata
 * @returns {Promise<Object[]>}
 */
async function enqueueActions(manager, entityIds, entityType, actionType, extraMetadata) { // was: kL
  const entityStore = await Iz();
  if (!entityStore) return [];

  const wrappers = entityIds.map((id) => {
    const entityKey = bX(id, entityType);
    const actionMetadata = {
      priority: 1,
      retryScheduleIntervalsInSeconds: [1, 2, 4],
      ...extraMetadata,
    };
    if (actionType !== "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH") {
      actionMetadata.priority = 0;
    }
    // Create a serialized action wrapper
    return {
      key: bX(id, "offlineOrchestrationActionWrapperEntity"),
      actionProto: { actionType, entityKey, actionMetadata },
      // ... other fields filled by OrchestrationAction constructor
    };
  });

  const result = await Kr(entityStore, { mode: "readwrite", g3: true }, (shouldUseDesktopControls) => {
    const ops = wrappers.map((w) =>
      shouldUseDesktopControls.W.objectStore("EntityStore").put({
        key: w.key,
        entityType: "offlineOrchestrationActionWrapperEntity",
        data: w,
        version: 1,
      })
    );
    return P8.all(ops);
  });

  // Trigger leader election to process the new actions
  acquireOrchestrationLock(manager.orchestrationControl); // was: Zji(Q.A)

  return result;
}

// ──────────────────────────────────────────────────────────────────
// Player prototype extensions (offline player creation)
// ──────────────────────────────────────────────────────────────────

// Source lines: 3583–3588
// g.N0.prototype.xa = g.W3(42, function(Q) { return this.app.xa(Q) });
// g.Iy.prototype.xa = g.W3(41, function(Q) { return g.PGw(this, 9, Q) });
// These extend the player prototypes to support creating offline playback
// sessions. Preserved as-is since they modify external prototypes.

// Register the module with the player framework
GN("offline", OfflineModule);
