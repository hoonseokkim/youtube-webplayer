/**
 * Offline Orchestration — Leadership election, entity handlers,
 * download lifecycle, position sync, stale refresh, cleanup
 *
 * Source: player_es6.vflset/en_US/offline.js, lines 4171–4525
 *
 * Bridges download-manager end and offline-module start.
 * Covers:
 *  - OfflineOrchestrator base (HdD) — leader election, entity factories,
 *    position sync, stale entity refresh, download management
 *  - Entity action handlers for main app (N50, idm, y3Z)
 *  - MainAppOfflineOrchestrator (SND) — extends HdD with main app entities,
 *    playlist refresh, smart downloads, user-deleted cleanup
 *  - Entity action handlers for music app (Fn9, ZdZ, END)
 *  - MusicAppOfflineOrchestrator (sp4) — extends HdD with music entities
 */

import { publishEvent } from '../../ads/ad-click-tracking.js';  // was: g.xt
import { NativeDeferred } from '../../core/event-registration.js';  // was: g.id
import { IdbPromise, safeClearInterval, safeSetInterval } from '../../data/idb-transactions.js';  // was: g.P8, g.Rx, g.Ce
import { deserializeEntityKey, getEntitiesByType, getEntity, getGlobalEntityStore, readEntitiesByType, serializeEntityKey, withEntityTransaction, writeEntity } from '../../proto/varint-decoder.js';  // was: g.w1, g.po, g.Yf, g.Iz, g.rx, g.bX, g.Kr, g.WI
import { isString } from '../../proto/messages-core.js'; // was: df
import { topBannerImageLayoutViewModel } from '../../core/misc-helpers.js'; // was: Rn
import { OrchestrationControl } from './download-manager.js'; // was: e3Z
import { OfflineBroadcastChannels } from './download-manager.js'; // was: A31
import { acquireOrchestrationLock } from './download-manager.js'; // was: Zji
import { logWoffleError } from './offline-helpers.js'; // was: Rj
import { readEntityByKey } from './entity-sync.js'; // was: $a
import { dispose } from '../../ads/dai-cue-range.js';
import { concat } from '../../core/array-utils.js';
// TODO: resolve g.$p
// TODO: resolve g.xv

// ---------------------------------------------------------------------------
// OfflineOrchestrator (base) [was: HdD] (lines 4171–4328)
// ---------------------------------------------------------------------------

/**
 * Base offline orchestrator — handles leader election, entity factory
 * creation, position sync intervals, and stale entity refresh.
 * [was: HdD]
 *
 * @param {Object} featureFlags [was: Q / this.FI]
 * @param {Object} api [was: c / this.api]
 */
export class OfflineOrchestrator { // was: HdD
  constructor(featureFlags, api) {
    this.featureFlags = featureFlags; // was: this.FI = Q
    this.api = api; // was: this.api = c
    this.capabilities = new g.$p(); // was: this.J = new g.$p
    this.leaderDeferred = new NativeDeferred(); // was: this.K = new g.id

    /**
     * Callbacks exposed to other subsystems.
     * [was: this.Rk]
     */
    this.callbacks = {
      L0: () => this.leaderElector.callbacks.L0(), // was: () => this.A.Rk.L0()
      vH: () => this.capabilities, // was: () => this.J
      rFa: () => this.leaderElector, // was: () => this.A
      Jz: () => this.getLeaderPromise(), // was: () => this.Jz()
      isString: () => this.ensureLeader(), // was: () => this.df()
      Gq: () => this.releaseLeadership(), // was: () => this.Gq()
      pm: () => this.awaitProcessing(), // was: () => this.pm()
      W6: () => this.refreshOutdatedStreams(), // was: () => this.W6()
      topBannerImageLayoutViewModel: (interval) => this.syncPositions(interval), // was: (W) => this.Rn(W)
    };

    this.leaderElector = new OrchestrationControl( // was: this.A = new e3Z
      () => qW4(this),
      () => { this.releaseLeadership(); },
      this.api.OV(),
      this.api.X.bind(this.api)
    );

    this.serviceWorker = new OfflineBroadcastChannels(this.api); // was: this.W = new A31(this.api)
    acquireOrchestrationLock(this.leaderElector); // was: Zji(this.A) — initialize leader election
  }

  /**
   * Returns the promise that resolves when leadership is acquired.
   * [was: HdD.prototype.Jz] (lines 4195-4197)
   */
  getLeaderPromise() { // was: Jz
    return this.leaderDeferred.promise;
  }

  /**
   * Acquires leadership if not already held, then returns the promise.
   * [was: HdD.prototype.df] (lines 4198-4203)
   */
  ensureLeader() { // was: df
    if (this.processor && this.syncRunner) { // was: this.O && this.L
      return this.leaderDeferred.promise;
    }
    tqm(this) // was: tqm(this)
      .then(this.leaderDeferred.resolve)
      .catch(this.leaderDeferred.reject);
    return this.leaderDeferred.promise;
  }

  /**
   * Creates entity handler factories for a given video ID.
   * [was: HdD.prototype.D] (lines 4204-4210)
   *
   * @param {string} videoId [was: Q]
   * @returns {Object} map of entity type to handler instance
   */
  createEntityHandlers(videoId) { // was: D
    return {
      playbackData: new Vvm(videoId, this.featureFlags, this.serviceWorker), // was: new Vvm(Q, this.FI, this.W)
      transfer: new qN9(videoId, this.featureFlags), // was: new qN9(Q, this.FI)
      videoPlaybackPositionEntity: new B5a(videoId, this.featureFlags), // was: new B5a(Q, this.FI)
    };
  }

  /**
   * Waits for the current processing cycle to complete.
   * [was: HdD.prototype.pm] (lines 4211-4213)
   */
  async awaitProcessing() { // was: pm
    if (this.processor) await okW(this.processor); // was: this.O && await okW(this.O)
  }

  /**
   * Releases leadership, disposes resources, and resets state.
   * [was: HdD.prototype.Gq] (lines 4214-4227)
   */
  async releaseLeadership() { // was: Gq
    if (!this.processor && !this.syncRunner) return; // was: if (this.O || this.L)

    await this.getLeaderPromise();

    if (this.positionSyncTimer !== undefined) { // was: this.mF
      safeClearInterval(this.positionSyncTimer);
      this.positionSyncTimer = undefined;
    }
    if (this.positionSyncInterval !== undefined) { // was: this.j
      safeClearInterval(this.positionSyncInterval);
      this.positionSyncInterval = undefined;
    }

    this.processor?.dispose();
    this.processor = undefined; // was: this.O = void 0

    this.syncRunner?.dispose();
    this.syncRunner = undefined; // was: this.L = void 0

    publishEvent(this.api, "onOrchestrationLostLeader"); // was: g.xt(this.api, "onOrchestrationLostLeader")
    this.leaderDeferred = new NativeDeferred(); // was: this.K = new g.id
  }

  /**
   * Returns whether this tab is the orchestration leader.
   * [was: HdD.prototype.isOrchestrationLeader] (lines 4228-4230)
   */
  isOrchestrationLeader() { // was: isOrchestrationLeader
    return this.leaderElector.isLeader; // was: this.A.W
  }

  /**
   * Returns false (no custom T2 logic in base class).
   * [was: HdD.prototype.T2] (lines 4231-4233)
   */
  async isVideoInDownloadsList(_videoId) { // was: T2
    return false;
  }

  /**
   * Publishes a transfer pause/resume event to the service worker.
   * [was: HdD.prototype.uq] (lines 4234-4238)
   *
   * @param {Object} pauseEvent [was: Q]
   */
  publishTransferPause(pauseEvent) { // was: uq
    const sw = this.serviceWorker; // was: c = this.W
    sw.api.publish("offlinetransferpause", pauseEvent);
    sw.broadcastChannel?.postMessage(pauseEvent); // was: c.O?.postMessage(Q)
  }

  /**
   * Resumes a paused transfer by updating entity state.
   * [was: HdD.prototype.jV] (lines 4239-4265)
   *
   * @param {string} videoId [was: Q]
   */
  async resumeTransfer(videoId) { // was: jV
    const entityStore = await getGlobalEntityStore(); // was: c = await g.Iz()
    if (!entityStore) return;

    const transferKey = serializeEntityKey(videoId, "transfer"); // was: W = g.bX(Q, "transfer")

    await withEntityTransaction(entityStore, {
      mode: "readwrite",
      g3: true,
    }, (transaction) => { // was: m
      const transferPromise = getEntity(transaction, transferKey, "transfer"); // was: K
      const contextPromise = getEntity(
        transaction,
        serializeEntityKey(videoId, "videoDownloadContextEntity"),
        "videoDownloadContextEntity"
      ); // was: T

      return IdbPromise.all([transferPromise, contextPromise]).then(([transfer, context]) => { // was: [r, U]
        if (transfer && transfer.transferState === "TRANSFER_STATE_PAUSED_BY_USER") {
          transfer.transferState = "TRANSFER_STATE_TRANSFER_IN_QUEUE";
          return writeEntity(transaction, transfer, "transfer").then(() => {
            Q8({
              transferStatusType: "TRANSFER_STATUS_TYPE_REENQUEUED_BY_USER_RESUME",
              statusType: "USER_RESUMED",
            }, {
              videoId: videoId,
              o_: transfer,
              offlineModeType: context?.offlineModeType,
            });
            return IdbPromise.resolve(null);
          });
        }
        return IdbPromise.resolve(null);
      });
    });
  }

  /**
   * Refreshes stale entities whose policies have not been updated
   * within the given threshold (default 12 hours = 43200 seconds).
   * [was: HdD.prototype.b0] (lines 4266-4279)
   *
   * @param {number} [staleThresholdSeconds=43200] [was: Q]
   * @returns {Promise<Array>}
   */
  async refreshStaleEntities(staleThresholdSeconds = 43200) { // was: b0
    if (!this.capabilities.KU()) return HXW(); // was: this.J.KU() — check capability

    const entityStore = await getGlobalEntityStore();
    if (!entityStore) return [];

    const now = Date.now() / 1000; // was: W
    const policies = await readEntitiesByType(entityStore, "offlineVideoPolicy"); // was: m
    const staleVideoIds = []; // reuse c

    for (const policy of policies) { // was: K
      if (Number(policy.lastUpdatedTimestampSeconds) + staleThresholdSeconds <= now) {
        const entityId = deserializeEntityKey(policy.key).entityId; // was: m = g.w1(K.key).entityId
        staleVideoIds.push(entityId);
      }
    }

    if (staleVideoIds.length) {
      return kL(this, staleVideoIds, this.entityType, "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH"); // was: kL(this, c, this.S, ...)
    }
    return [];
  }

  /**
   * Deletes all offline entities.
   * [was: HdD.prototype.deleteAll] (lines 4280-4286)
   */
  deleteAll() { // was: deleteAll
    return kL(
      this,
      ["!*$_ALL_ENTITIES_!*$"],
      this.entityType,
      "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE",
      {
        offlineLoggingData: {
          offlineDeleteReason: "OFFLINE_DELETE_REASON_USER_INITIATED",
        },
      }
    );
  }

  /**
   * Public wrapper for refreshStaleEntities.
   * [was: HdD.prototype.refreshAllStaleEntities] (lines 4287-4289)
   *
   * @param {number} [staleThreshold] [was: Q]
   * @returns {Promise<Array>}
   */
  async refreshAllStaleEntities(staleThreshold) { // was: refreshAllStaleEntities
    return await this.refreshStaleEntities(staleThreshold);
  }

  /**
   * Sets up a recurring interval for playback position sync.
   * [was: HdD.prototype.setUpPositionSyncInterval] (lines 4290-4298)
   *
   * @param {number} [intervalMs] [was: Q] - defaults to 86400000 (24 hours)
   */
  setUpPositionSyncInterval(intervalMs) { // was: setUpPositionSyncInterval
    if (this.positionSyncInterval !== undefined) {
      safeClearInterval(this.positionSyncInterval);
      this.positionSyncInterval = undefined;
    }
    const interval = intervalMs ?? 86400000; // was: c = Q ?? 864E5
    this.positionSyncInterval = safeSetInterval(() => {
      this.syncPositions(interval);
    }, interval);
  }

  /**
   * Syncs playback positions if the last sync was older than the threshold.
   * [was: HdD.prototype.Rn] (lines 4299-4311)
   *
   * @param {number} thresholdMs [was: Q]
   */
  async syncPositions(thresholdMs) { // was: Rn
    try {
      const prefStorage = await f5.getInstance(); // was: c
      if (!prefStorage) throw Error("prefStorage is undefined");

      const lastSync = await prefStorage.get("psi"); // was: W
      const lastSyncTime = lastSync?.IL ? Number(lastSync.IL) / 1000 : 0; // was: m
      const now = Date.now(); // was: K

      if (lastSyncTime + thresholdMs <= now) {
        await kL(
          this,
          ["!*$_ALL_ENTITIES_!*$"],
          "videoPlaybackPositionEntity",
          "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH"
        );
      }
    } catch (error) {
      logWoffleError("Offline manager error", error); // was: Rj("Offline manager error", c)
    }
  }

  /**
   * Refreshes transfers that are waiting for a player response refresh.
   * [was: HdD.prototype.W6] (lines 4312-4322)
   *
   * @returns {Promise<Array>}
   */
  async refreshOutdatedStreams() { // was: W6
    const entityStore = await getGlobalEntityStore();
    if (!entityStore) return [];

    const transfers = await readEntitiesByType(entityStore, "transfer"); // was: c
    const outdatedVideoIds = []; // reuse Q

    for (const transfer of transfers) {
      if (transfer.transferState === "TRANSFER_STATE_WAITING_FOR_PLAYER_RESPONSE_REFRESH" && transfer.key) {
        const entityId = deserializeEntityKey(transfer.key).entityId; // was: c
        outdatedVideoIds.push(entityId);
      }
    }

    return iXa(this, outdatedVideoIds); // was: iXa(this, Q)
  }

  /**
   * Placeholder for getting pending downloads (overridden by subclasses).
   * [was: HdD.prototype.Y] (lines 4323-4325)
   */
  async getPendingUserDeleted() { // was: Y
    return [];
  }

  /**
   * Placeholder for ensuring playback positions exist (overridden by subclasses).
   * [was: HdD.prototype.MM] (lines 4326)
   */
  async ensurePlaybackPositions() {} // was: MM

  /**
   * Placeholder for cleaning up orphaned entities (overridden by subclasses).
   * [was: HdD.prototype.Ie] (lines 4327)
   */
  async cleanupOrphans() {} // was: Ie
}

// ---------------------------------------------------------------------------
// MainPlaylistEntityHandler [was: N50] (lines 4330-4341)
// ---------------------------------------------------------------------------

/**
 * Handles orchestration actions for mainPlaylistEntity.
 * Extends the base action handler (BaseEntityActionHandler).
 * [was: N50]
 *
 * @param {string} entityStoreRef [was: Q]
 * @param {Object} featureFlags [was: c]
 * @param {Object} serviceWorker [was: W / this.A]
 */
export class MainPlaylistEntityHandler extends BaseEntityActionHandler { // was: N50
  constructor(entityStoreRef, featureFlags, serviceWorker) {
    super(entityStoreRef);
    this.entityStoreRef = entityStoreRef; // was: this.W = Q
    this.featureFlags = featureFlags; // was: this.FI = c
    this.serviceWorker = serviceWorker; // was: this.A = W
  }

  /**
   * Dispatches action to the appropriate handler based on type.
   * [was: N50.prototype.O] (lines 4337-4339)
   */
  handleAction(action) { // was: O(Q)
    if (WQ(action)) return SWi(this, action);     // was: WQ(Q) ? SWi(this, Q) — isDownloadAction
    if (mJ(action)) return ZXi(this, action);     // was: mJ(Q) ? ZXi(this, Q) — isDeleteAction
    if (K5(action)) return Ekm(this, action);     // was: K5(Q) ? Ekm(this, Q) — isRefreshAction
    return Promise.reject(Error(`Unsupported action type: ${action.actionType}`));
  }
}

/** Retry delay config for mainPlaylistEntity [was: YL] */
const MAIN_PLAYLIST_RETRY_DELAYS = [10]; // was: YL = [10]

// ---------------------------------------------------------------------------
// MainVideoEntityHandler [was: idm] (lines 4342-4353)
// ---------------------------------------------------------------------------

/**
 * Handles orchestration actions for mainVideoEntity.
 * [was: idm]
 */
export class MainVideoEntityHandler extends BaseEntityActionHandler { // was: idm
  constructor(entityStoreRef, featureFlags, serviceWorker) {
    super(entityStoreRef);
    this.entityStoreRef = entityStoreRef; // was: this.W = Q
    this.featureFlags = featureFlags; // was: this.FI = c
    this.serviceWorker = serviceWorker; // was: this.A = W
  }

  handleAction(action) { // was: O(Q)
    if (WQ(action)) return gko(this, action);     // was: gko — download
    if (mJ(action)) return OXW(this, action);     // was: OXW — delete
    if (K5(action)) return fLo(this, action);     // was: fLo — refresh
    return Promise.reject(Error(`Unsupported action type: ${action.actionType}`));
  }
}

/** Retry delay config for mainVideoEntity [was: jS9] */
const MAIN_VIDEO_RETRY_DELAYS = [10]; // was: jS9 = [10]

// ---------------------------------------------------------------------------
// MainDownloadsListEntityHandler [was: y3Z] (lines 4354-4365)
// ---------------------------------------------------------------------------

/**
 * Handles orchestration actions for mainDownloadsListEntity.
 * Only supports delete (sync check) actions.
 * [was: y3Z]
 */
export class MainDownloadsListEntityHandler extends BaseEntityActionHandler { // was: y3Z
  constructor(entityStoreRef, featureFlags, serviceWorker) {
    super(entityStoreRef);
    this.entityStoreRef = entityStoreRef; // was: this.W = Q
    this.featureFlags = featureFlags; // was: this.FI = c
    this.serviceWorker = serviceWorker; // was: this.A = W
  }

  handleAction(action) { // was: O(Q)
    if (mJ(action)) return G9v(this, action); // was: G9v — delete/sync
    return Promise.reject(Error(`Unsupported action type: ${action.actionType}`));
  }
}

// ---------------------------------------------------------------------------
// MainAppOfflineOrchestrator [was: SND] (lines 4366-4473)
// ---------------------------------------------------------------------------

/**
 * Offline orchestrator for the main YouTube app.
 * Extends OfflineOrchestrator with mainVideoEntity, mainPlaylistEntity,
 * and mainDownloadsListEntity handlers. Supports playlist auto-refresh,
 * smart download integration, and orphaned entity cleanup.
 * [was: SND]
 */
export class MainAppOfflineOrchestrator extends OfflineOrchestrator { // was: SND
  constructor(...args) {
    super(...args);
    this.entityType = "mainVideoEntity"; // was: this.S = "mainVideoEntity"
  }

  /**
   * Creates entity handlers including main app-specific ones.
   * [was: SND.prototype.D] (lines 4371-4377)
   *
   * @param {string} videoId [was: Q]
   * @returns {Object}
   */
  createEntityHandlers(videoId) { // was: D
    const handlers = super.createEntityHandlers(videoId);
    handlers.mainVideoEntity = new MainVideoEntityHandler(videoId, this.featureFlags, this.entityStoreRef); // was: new idm(Q, this.FI, this.W)
    handlers.mainPlaylistEntity = new MainPlaylistEntityHandler(videoId, this.featureFlags, this.entityStoreRef); // was: new N50(Q, this.FI, this.W)
    handlers.mainDownloadsListEntity = new MainDownloadsListEntityHandler(videoId, this.featureFlags, this.entityStoreRef); // was: new y3Z(Q, this.FI, this.W)
    return handlers;
  }

  /**
   * Refreshes all stale entities including playlists and smart downloads.
   * [was: SND.prototype.refreshAllStaleEntities] (lines 4378-4386)
   *
   * @param {number} staleThreshold [was: Q]
   * @param {*} [extraParam] [was: c]
   * @returns {Promise<Array>}
   */
  async refreshAllStaleEntities(staleThreshold, extraParam) {
    let results = [];

    // Auto-refresh playlists if feature flag enabled
    if (this.featureFlags.X("web_player_offline_playlist_auto_refresh")) {
      results = await $79(this, staleThreshold, extraParam); // was: W = await $79(this, Q, c)
    }

    // Smart download refresh
    const prefStorage = await f5.getInstance(); // was: m
    const sdConfig = await prefStorage?.get("sdois"); // was: K
    const maxQuality = await prefStorage?.get("lmqf"); // was: m (reused)

    if (sdConfig) {
      results = results.concat(
        await P8v(this, sdConfig, maxQuality ?? "SD", staleThreshold === 0) // was: P8v(this, K, m ?? "SD", Q === 0)
      );
    }

    return results.concat(await super.refreshAllStaleEntities(staleThreshold, extraParam));
  }

  /**
   * Checks whether a video is in the main downloads list.
   * [was: SND.prototype.T2] (lines 4387-4399)
   *
   * @param {string} videoId [was: Q]
   * @returns {Promise<boolean>}
   */
  async isVideoInDownloadsList(videoId) { // was: T2
    const entityStore = await getGlobalEntityStore();
    if (!entityStore) return false;

    const downloadsList = await readEntityByKey(entityStore, g.xv, "mainDownloadsListEntity"); // was: c = await $a(c, g.xv, ...)
    if (downloadsList?.downloads?.length) {
      const entityKey = serializeEntityKey(videoId, "mainVideoEntity"); // was: Q = g.bX(Q, "mainVideoEntity")
      for (const download of downloadsList.downloads) {
        if (download.videoItem === entityKey) return true;
      }
    }
    return false;
  }

  /**
   * Returns video IDs that have been user-deleted and should be cleaned up.
   * [was: SND.prototype.Y] (lines 4400-4414)
   *
   * @returns {Promise<Array>}
   */
  async getPendingUserDeleted() { // was: Y
    const entityStore = await getGlobalEntityStore();
    if (!entityStore) return [];

    const statuses = await readEntitiesByType(entityStore, "downloadStatusEntity"); // was: c
    const deletedIds = [];

    for (const status of statuses) {
      if (status.downloadState === "DOWNLOAD_STATE_USER_DELETED" && status.key) {
        const entityId = deserializeEntityKey(status.key).entityId; // was: c = g.w1(W.key).entityId
        deletedIds.push(entityId);
      }
    }

    if (deletedIds.length) {
      return kL(this, deletedIds, "mainVideoEntity", "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE", {
        offlineLoggingData: {
          offlineDeleteReason: "OFFLINE_DELETE_REASON_USER_INITIATED",
        },
      });
    }
    return [];
  }

  /**
   * Ensures all main video entities have associated playback position entities.
   * [was: SND.prototype.Ie] (lines 4415-4440)
   */
  async ensurePlaybackPositions() { // was: Ie
    const entityStore = await getGlobalEntityStore();
    if (!entityStore) return;

    await withEntityTransaction(entityStore, {
      mode: "readwrite",
      g3: true,
    }, (transaction) => { // was: c
      return getEntitiesByType(transaction, "mainVideoEntity").then((entities) => { // was: W
        const promises = [];

        for (const entity of entities) { // was: K
          if (entity.userState?.playbackPosition) continue;

          const entityId = deserializeEntityKey(entity.key).entityId; // was: W = g.w1(K.key).entityId
          const positionEntity = {
            key: serializeEntityKey(entityId, "videoPlaybackPositionEntity"),
            videoId: entityId,
            lastPlaybackPositionSeconds: "0",
          };

          promises.push(writeEntity(transaction, positionEntity, "videoPlaybackPositionEntity"));

          entity.userState = {
            playbackPosition: positionEntity.key,
          };
          promises.push(writeEntity(transaction, entity, "mainVideoEntity"));
        }

        return IdbPromise.all(promises);
      });
    });
  }

  /**
   * Cleans up orphaned entities not referenced by any downloads list.
   * Removes entities from mainVideoEntity and mainPlaylistEntity
   * that are not in either the manual or auto downloads lists.
   * [was: SND.prototype.MM] (lines 4441-4472)
   */
  async cleanupOrphans() { // was: MM
    const entityStore = await getGlobalEntityStore();
    if (!entityStore) return;

    const manualDownloadsKey = serializeEntityKey(
      "DOWNLOADS_LIST_ENTITY_ID_MANUAL_DOWNLOADS",
      "mainDownloadsListEntity"
    ); // was: c

    const [manualList, autoList, videoEntities, playlistEntities] = await withEntityTransaction(
      entityStore,
      { mode: "readonly", g3: true },
      (transaction) => IdbPromise.all([
        getEntity(transaction, manualDownloadsKey, "mainDownloadsListEntity"), // was: m
        getEntity(transaction, g.xv, "mainDownloadsListEntity"), // was: K
        getEntitiesByType(transaction, "mainVideoEntity"), // was: T
        getEntitiesByType(transaction, "mainPlaylistEntity"), // was: r
      ])
    );

    // Build set of all referenced entity keys
    const referencedKeys = new Set(); // was: W

    if (manualList?.downloads?.length) {
      for (const download of manualList.downloads) { // was: U
        const itemKey = download.videoItem ?? download.playlistItem; // was: I
        if (itemKey) referencedKeys.add(itemKey);
      }
    }

    if (autoList?.downloads?.length) {
      for (const download of autoList.downloads) { // was: X
        if (download.videoItem) referencedKeys.add(download.videoItem);
      }
    }

    // Build set of video IDs referenced by playlists
    const playlistVideoIds = new Set(); // was: U (reused)
    const orphanKeys = []; // was: X (reused)

    for (const playlist of playlistEntities) { // was: A
      if (playlist.videos) {
        for (const videoKey of playlist.videos) { // was: e
          const videoId = JSON.parse(deserializeEntityKey(videoKey).entityId).videoId; // was: I
          if (videoId) playlistVideoIds.add(videoId);
        }
      }
      if (playlist.key && !referencedKeys.has(playlist.key)) {
        orphanKeys.push(playlist.key);
      }
    }

    for (const videoEntity of videoEntities) { // was: e
      if (videoEntity.key && !referencedKeys.has(videoEntity.key)) {
        const entityId = deserializeEntityKey(videoEntity.key).entityId; // was: A
        if (!playlistVideoIds.has(entityId)) {
          orphanKeys.push(videoEntity.key);
        }
      }
    }

    if (orphanKeys.length) {
      await NU(entityStore, orphanKeys); // was: await NU(Q, X) — delete orphaned entities
    }
  }
}

// ---------------------------------------------------------------------------
// MusicAlbumReleaseHandler [was: Fn9] (lines 4475-4485)
// ---------------------------------------------------------------------------

/**
 * Handles orchestration actions for musicAlbumRelease entities.
 * [was: Fn9]
 */
export class MusicAlbumReleaseHandler extends BaseEntityActionHandler { // was: Fn9
  constructor(entityStoreRef, serviceWorker) {
    super(entityStoreRef);
    this.entityStoreRef = entityStoreRef; // was: this.W = Q
    this.serviceWorker = serviceWorker; // was: this.A = c
  }

  handleAction(action) { // was: O(Q)
    if (WQ(action)) return uHo(this, action); // was: uHo — download
    if (mJ(action)) return hCD(this, action); // was: hCD — delete
    if (K5(action)) return zCv(this, action); // was: zCv — refresh
    return Promise.reject(Error(`Unsupported action type: ${action.actionType}`));
  }
}

/** Retry delay config for musicAlbumRelease [was: cg] */
const MUSIC_ALBUM_RETRY_DELAYS = [10]; // was: cg = [10]

// ---------------------------------------------------------------------------
// MusicPlaylistHandler [was: ZdZ] (lines 4486-4496)
// ---------------------------------------------------------------------------

/**
 * Handles orchestration actions for musicPlaylist entities.
 * [was: ZdZ]
 */
export class MusicPlaylistHandler extends BaseEntityActionHandler { // was: ZdZ
  constructor(entityStoreRef, serviceWorker) {
    super(entityStoreRef);
    this.entityStoreRef = entityStoreRef; // was: this.W = Q
    this.serviceWorker = serviceWorker; // was: this.A = c
  }

  handleAction(action) { // was: O(Q)
    if (WQ(action)) return J_W(this, action); // was: J_W — download
    if (mJ(action)) return RC4(this, action); // was: RC4 — delete
    if (K5(action)) return k9H(this, action); // was: k9H — refresh
    return Promise.reject(Error(`Unsupported action type: ${action.actionType}`));
  }
}

/** Retry delay config for musicPlaylist [was: Wg] */
const MUSIC_PLAYLIST_RETRY_DELAYS = [10]; // was: Wg = [10]

// ---------------------------------------------------------------------------
// MusicTrackHandler [was: END] (lines 4497-4507)
// ---------------------------------------------------------------------------

/**
 * Handles orchestration actions for musicTrack entities.
 * [was: END]
 */
export class MusicTrackHandler extends BaseEntityActionHandler { // was: END
  constructor(entityStoreRef, serviceWorker) {
    super(entityStoreRef);
    this.entityStoreRef = entityStoreRef; // was: this.W = Q
    this.serviceWorker = serviceWorker; // was: this.A = c
  }

  handleAction(action) { // was: O(Q)
    if (WQ(action)) return Wnv(this, action); // was: Wnv — download
    if (mJ(action)) return mjm(this, action); // was: mjm — delete
    if (K5(action)) return Knm(this, action); // was: Knm — refresh
    return Promise.reject(Error(`Unsupported action type: ${action.actionType}`));
  }
}

/** Retry delay config for musicTrack [was: c3i] */
const MUSIC_TRACK_RETRY_DELAYS = [10]; // was: c3i = [10]

// ---------------------------------------------------------------------------
// MusicAppOfflineOrchestrator [was: sp4] (lines 4508-4525)
// ---------------------------------------------------------------------------

/**
 * Offline orchestrator for YouTube Music.
 * Extends OfflineOrchestrator with musicTrack, musicPlaylist,
 * and musicAlbumRelease entity handlers.
 * [was: sp4]
 */
export class MusicAppOfflineOrchestrator extends OfflineOrchestrator { // was: sp4
  constructor(...args) {
    super(...args);
    this.entityType = "musicTrack"; // was: this.S = "musicTrack"
  }

  /**
   * Creates entity handlers including music app-specific ones.
   * [was: sp4.prototype.D] (lines 4513-4519)
   *
   * @param {string} trackId [was: Q]
   * @returns {Object}
   */
  createEntityHandlers(trackId) { // was: D
    const handlers = super.createEntityHandlers(trackId);
    handlers.musicTrack = new MusicTrackHandler(trackId, this.entityStoreRef); // was: new END(Q, this.W)
    handlers.musicPlaylist = new MusicPlaylistHandler(trackId, this.entityStoreRef); // was: new ZdZ(Q, this.W)
    handlers.musicAlbumRelease = new MusicAlbumReleaseHandler(trackId, this.entityStoreRef); // was: new Fn9(Q, this.W)
    return handlers;
  }

  /**
   * Refreshes all stale entities including music-specific ones.
   * [was: sp4.prototype.refreshAllStaleEntities] (lines 4520-4523)
   *
   * @param {number} staleThreshold [was: Q]
   * @param {*} [extraParam] [was: c]
   * @returns {Promise<Array>}
   */
  async refreshAllStaleEntities(staleThreshold, extraParam) {
    let results = await r39(this, staleThreshold, extraParam); // was: W = await r39(this, Q, c)
    return results.concat(await super.refreshAllStaleEntities(staleThreshold, extraParam));
  }
}
