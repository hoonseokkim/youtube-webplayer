/**
 * Download Manager — Download orchestration, retry scheduling, state tracking
 *
 * Source: player_es6.vflset/en_US/offline.js, lines 460–4170
 * Deobfuscated from the `(function(g) { ... })(_yt_player)` IIFE.
 *
 * Covers: transfer state machine, orchestration action queue, retry backoff,
 * download progress tracking, caption downloading, leader election,
 * entity handler dispatch, and offline state snapshot reporting.
 */

import {
  PromiseAll, // was: g.P8
  openTransaction, // was: g.Kr
  readEntity, // was: g.Yf
  replaceEntity, // was: g.WI
  deleteEntityByKey, // was: g.mh
  persistEntity, // was: g.TA
  readAllEntities, // was: g.rx
  readAllByKeys, // was: g.po
  parseEntityKey, // was: g.w1
  buildEntityKey, // was: g.bX
  lookupExtension, // was: g.l
  setExtension, // was: g.OE
  fireEvent, // was: g.xt
  logEvent, // was: g.eG
  DelayedCallback, // was: g.Uc
  Disposable, // was: g.qK
  registerDisposable, // was: g.F
  NetworkStatus, // was: g.$p
  Deferred, // was: g.id
  generateNonce, // was: g.Ab
  getGlobalVar, // was: g.DR
  setGlobalVar, // was: g.n7
  getDatasyncId, // was: g.Dk
  globalWindow, // was: g.qX
  isEmpty, // was: g.P9
  setTimeout, // was: g.zn
  setInterval, // was: g.Ce
  clearInterval, // was: g.Rx
  addNetworkListener, // was: g.iK
  getServiceWorker, // was: g.SL
  isMainYouTube, // was: g.rT
  isYouTubeMusic, // was: g.uL
  isYouTubeMusicEmbedded, // was: g.EQ
  Um, // was: g.Um — reads experiment value
  EventHandler, // was: g.db
  getFetchClient, // was: g.nr
  getInnertubeContext, // was: g.Oh
  getPlayerContext, // was: g.Bt
  createServicePaths, // was: g.vu
  sendInnertubeRequest, // was: g.$h
  NetworkManagerError, // was: g.A1
  QuotaExceededError, // was: g.fg
  Fh, // was: g.Fh — removes listener
  BO, // was: g.BO — increments backoff
  VideoData, // was: g.Od — VideoData constructor
  Ow, // was: g.Ow — get available formats
  NRR, // was: g.NRR — compute media capabilities
  getMediaStatus, // was: g.mj
  setMediaStatus, // was: g.Kl
  ya, // was: g.ya — create quality settings
  W3, // was: g.W3 — method decorator
  Logger, // was: g.JY — Logger class
  xv, // was: g.xv — smart downloads list entity key
  createPlaybackMode, // was: g.PGw — create offline player
  Bo, // was: g.Bo — parse visual element
  sO, // was: g.sO
  KO, // was: g.KO
  RF, // was: g.RF
  M0, // was: g.M0 — caption track list
  Jc, // was: g.Jc — timedtext caption loader
  getCaptionsLanguagePreference, // was: g.qUw
  H6, // was: g.H6 — get caption tracks
  H2, // was: g.H2 — get caption metadata
  o2, // was: g.o2 — fetch with retries
} from '../../core/';

import { filterAndSortFormats } from '../../data/bandwidth-tracker.js'; // was: as
import { RetryTimer } from '../../media/grpc-parser.js'; // was: tJ
import { shouldUseDesktopControls } from '../../data/bandwidth-tracker.js'; // was: tx
import { audioTrackLabelMap } from '../../player/time-tracking.js'; // was: h5
import { disposeApp } from '../../player/player-events.js'; // was: WA
import { logWoffleError } from './offline-helpers.js';
import { Disposable } from '../../core/disposable.js';
import { Delay } from '../../core/timer.js';
import { deleteMediaAndResetStatus, readEntityByKey } from './entity-sync.js';
import { filter } from '../../core/array-utils.js';
import {
  deleteEntities,
  clearEntityType,
  upsertEntity,
  deleteOrchestrationActions,
  clearAllPlaybackPositions,
  readEntityByKey,
  dispatchAndPersistMutations,
  deleteMediaForVideo,
  reconcileMediaInventory,
  deleteMediaAndResetStatus,
  logWoffleError,
  entityBatchUpdateKey,
  downloadStatusEntityKey,
  mainPlaylistEntityActionMetadataKey,
  mainVideoEntityActionMetadataKey,
  musicPlaylistEntityActionMetadataKey,
  musicTrackEntityActionMetadataKey,
  playbackDataActionMetadataKey,
  transferEntityActionMetadataKey,
  videoPlaybackPositionEntityActionMetadataKey,
  localImageEntityActionMetadataKey,
  MAIN_ENTITY_TYPES,
  MUSIC_ENTITY_TYPES,
} from './entity-sync.js';

// ──────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────

/**
 * Transfer state priority map — lower number = higher download priority.
 * [was: Rr]
 * Source lines: 4167–4170
 */
const TRANSFER_STATE_PRIORITY = { // was: Rr
  TRANSFER_STATE_TRANSFERRING: 1,
  TRANSFER_STATE_TRANSFER_IN_QUEUE: 2,
};

/**
 * Action types that should be filtered during orchestration queue loading.
 * [was: Cn9]
 * Source line: 3752
 */
const SKIPPABLE_ACTION_TYPES = [ // was: Cn9
  "OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD",
  "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH",
];

// ──────────────────────────────────────────────────────────────────
// Transfer status telemetry helpers
// ──────────────────────────────────────────────────────────────────

/**
 * Fires an offline delete event.
 * [was: pB]
 * Source lines: 504–508
 */
function reportDeleteEvent(params) { // was: pB
  params.offlineDeleteReason = params.offlineDeleteReason ?? "OFFLINE_DELETE_REASON_UNKNOWN";
  params.offlineModeType = params.offlineModeType ?? "OFFLINE_NOW";
  eG("offlineDeleteEvent", params);
}

/**
 * Fires an offline transfer status change event.
 * [was: Q8]
 * Source lines: 509–518
 */
function reportTransferStatusChanged(statusPayload, { videoId, o_: transferEntity, offlineModeType }) { // was: Q8
  statusPayload.encryptedVideoId = videoId;
  statusPayload.cotn = transferEntity?.cotn;
  statusPayload.offlineabilityFormatType = transferEntity?.maximumDownloadQuality;
  statusPayload.isRefresh = transferEntity?.isRefresh ?? false;
  statusPayload.softErrorCount = transferEntity?.transferRetryCount ?? 0;
  statusPayload.offlineModeType = offlineModeType ?? "OFFLINE_NOW";
  if (
    (statusPayload.transferStatusType === "TRANSFER_STATUS_TYPE_UNKNOWN" &&
      statusPayload.statusType === "UNKNOWN_STATUS_TYPE") ||
    (!statusPayload.transferStatusType && !statusPayload.statusType)
  ) {
    logWoffleError("Woffle unknown transfer status");
  }
  eG("offlineTransferStatusChanged", statusPayload);
}

/**
 * Reports a "started" transfer status event.
 * [was: Lgv]
 * Source lines: 519–531
 */
function reportTransferStarted(context, bytesDownloaded, totalBytes, isFirstStart) { // was: Lgv
  const payload = {
    transferStatusType: "TRANSFER_STATUS_TYPE_PROCESSING",
    statusType: "OFFLINING_STARTED",
    transferFirstStarted: !!isFirstStart,
  };
  if (bytesDownloaded && totalBytes) {
    const dlKb = Math.floor(bytesDownloaded / 1024).toFixed();
    const totalKb = Math.floor(totalBytes / 1024).toFixed();
    payload.alreadyDownloadedKbytes = dlKb;
    payload.totalFetchedKbytes = dlKb;
    payload.totalContentKbytes = totalKb;
  }
  reportTransferStatusChanged(payload, context);
}

/**
 * Reports a "paused by user" transfer status event.
 * [was: wh4]
 * Source lines: 532–537
 */
function reportTransferPausedByUser(context) { // was: wh4
  reportTransferStatusChanged({
    transferStatusType: "TRANSFER_STATUS_TYPE_DEQUEUED_BY_USER_PAUSE",
    statusType: "SUSPENDED",
  }, context);
}

/**
 * Maps a transfer failure reason to a telemetry failure reason string.
 * [was: bjZ]
 * Source lines: 538–559
 */
function mapTransferFailureReason(reason) { // was: bjZ
  switch (reason) {
    case "TRANSFER_FAILURE_REASON_FILESYSTEM_WRITE":
    case "TRANSFER_FAILURE_REASON_EXTERNAL_FILESYSTEM_WRITE":
      return "OFFLINE_DATABASE_ERROR";
    case "TRANSFER_FAILURE_REASON_PLAYABILITY":
      return "NOT_PLAYABLE";
    case "TRANSFER_FAILURE_REASON_TOO_MANY_RETRIES":
      return "TOO_MANY_RETRIES";
    case "TRANSFER_FAILURE_REASON_INTERNAL":
      return "OFFLINE_DOWNLOAD_CONTROLLER_ERROR";
    case "TRANSFER_FAILURE_REASON_STREAM_MISSING":
      return "STREAM_VERIFICATION_FAILED";
    case "TRANSFER_FAILURE_REASON_SERVER":
    case "TRANSFER_FAILURE_REASON_SERVER_PROPERTY_MISSING":
      return "OFFLINE_REQUEST_FAILURE";
    case "TRANSFER_FAILURE_REASON_NETWORK":
      return "OFFLINE_NETWORK_ERROR";
    default:
      return "UNKNOWN_FAILURE_REASON";
  }
}

// ──────────────────────────────────────────────────────────────────
// Orchestration action type checks
// ──────────────────────────────────────────────────────────────────

/** Whether an action has a retry schedule. [was: cQ] */
function hasRetrySchedule(action) { // was: cQ
  return (action.actionMetadata?.retryScheduleIntervalsInSeconds?.length ?? 0) > 0;
}

/** [was: WQ] */
function isAddAction(action) { // was: WQ
  return action.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD" && !!action.entityKey;
}

/** [was: mJ] */
function isRefreshAction(action) { // was: mJ
  return action.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH" && !!action.entityKey;
}

/** [was: K5] */
function isDeleteAction(action) { // was: K5
  return action.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE" && !!action.entityKey;
}

/** [was: jki] */
function isUpdateAction(action) { // was: jki
  return action.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_UPDATE" && !!action.entityKey;
}

/** Checks if two actions target the same entity and type. [was: or] */
function isSameAction(a, b) { // was: or
  return a.actionType === b.actionType && a.entityKey === b.entityKey;
}

// ──────────────────────────────────────────────────────────────────
// OrchestrationAction model
// ──────────────────────────────────────────────────────────────────

/**
 * Represents a single queued orchestration action.
 * [was: es]
 * Source lines: 3753–3768
 */
export class OrchestrationAction { // was: es
  constructor(entityType, actionId, action, parentActionId, rootActionId = actionId,
              childActionIds, prereqActionId, postreqActionIds, retryScheduleIndex,
              hasChildActionFailed, enqueueTimeMs) {
    this.entityType = entityType;
    this.actionId = actionId;
    this.action = action;
    this.parentActionId = parentActionId;
    this.rootActionId = rootActionId;
    this.childActionIds = childActionIds;
    this.prereqActionId = prereqActionId;
    this.postreqActionIds = postreqActionIds;
    this.hasChildActionFailed = hasChildActionFailed;
    this.retryScheduleIndex = retryScheduleIndex || 0;
    /** @type {number} Enqueue timestamp in ms [was: W] */
    this.enqueueTimeMs = enqueueTimeMs || Date.now(); // was: this.W
  }
}

/**
 * Converts a stored action wrapper entity into an OrchestrationAction.
 * [was: V8]
 * Source lines: 655–663
 */
function parseStoredAction(wrapper) { // was: V8
  if (!wrapper.key) throw Error("Entity key is required.");
  if (!wrapper.actionProto) throw Error("OfflineOrchestrationAction is required.");
  const wrapperParsed = w1(wrapper.key);
  const actionParsed = w1(wrapper.actionProto.entityKey);
  return new OrchestrationAction(
    actionParsed.entityType,
    wrapperParsed.entityId,
    wrapper.actionProto,
    wrapper.parentActionId,
    wrapper.rootActionId,
    wrapper.childActionIds,
    wrapper.prereqActionId,
    wrapper.postreqActionIds,
    wrapper.retryScheduleIndex,
    wrapper.hasChildActionFailed,
    Number(wrapper.enqueueTimeSec) * 1000
  );
}

/**
 * Serializes an OrchestrationAction back to a storable wrapper entity.
 * [was: BQ]
 * Source lines: 664–677
 */
function serializeAction(action) { // was: BQ
  return {
    key: bX(action.actionId, "offlineOrchestrationActionWrapperEntity"),
    actionProto: action.action,
    parentActionId: action.parentActionId,
    rootActionId: action.rootActionId,
    childActionIds: action.childActionIds,
    prereqActionId: action.prereqActionId,
    postreqActionIds: action.postreqActionIds,
    retryScheduleIndex: action.retryScheduleIndex,
    hasChildActionFailed: action.hasChildActionFailed,
    enqueueTimeSec: (action.enqueueTimeMs / 1000).toFixed(),
  };
}

// ──────────────────────────────────────────────────────────────────
// OrchestrationResult
// ──────────────────────────────────────────────────────────────────

/**
 * Result object returned by entity handlers after processing an action.
 * [was: OY]
 * Source lines: 3777–3786
 */
export class OrchestrationResult { // was: OY
  /**
   * @param {string} status - SUCCESS or FAILURE
   * @param {boolean} isRetryable [was: W]
   * @param {Object[]} [childActions] [was: j]
   * @param {string} [failureReason] [was: O]
   * @param {string} [orchestrationFailureReason] [was: A]
   * @param {string} [downloadState]
   */
  constructor(status, isRetryable, childActions, failureReason, orchestrationFailureReason, downloadState) {
    this.status = status;
    this.isRetryable = isRetryable; // was: this.W
    this.childActions = childActions; // was: this.j
    this.failureReason = failureReason; // was: this.O
    this.orchestrationFailureReason = orchestrationFailureReason; // was: this.A
    this.downloadState = downloadState;
  }
}

// ──────────────────────────────────────────────────────────────────
// Action priority queue
// ──────────────────────────────────────────────────────────────────

/**
 * Priority queue for orchestration actions, sorted by priority then enqueue time.
 * [was: nNW]
 * Source lines: 3884–3893
 */
class ActionPriorityQueue { // was: nNW
  constructor() {
    /** @type {OrchestrationAction[]} */
    this.actions = [];
  }

  /**
   * Comparator: lower priority number = earlier; tie-break on enqueue time.
   * [was: W]
   */
  compare(a, b) { // was: W
    let diff = a.action.actionMetadata.priority - b.action.actionMetadata.priority;
    if (diff === 0) {
      if (a.enqueueTimeMs < b.enqueueTimeMs) diff = -1;
      else if (a.enqueueTimeMs > b.enqueueTimeMs) diff = 1;
    }
    return diff;
  }
}

// ──────────────────────────────────────────────────────────────────
// Transfer manager (download executor)
// ──────────────────────────────────────────────────────────────────

/**
 * Manages the actual download of a single video at a time:
 * picks the next queued transfer, starts the media player in download
 * mode, tracks progress, handles failures and retries.
 * [was: nkZ]
 * Source lines: 4002–4166
 */
export class TransferManager extends Disposable { // was: nkZ
  constructor(entityStore, playerApi, orchestrationControl, errorChannel) {
    super();

    /** @type {Object} Entity store handle [was: O] */
    this.entityStore = entityStore; // was: this.O

    /** @type {Object} Player API */
    this.api = playerApi;

    /** @type {Object} Orchestration control (leader election) [was: PA] */
    this.orchestrationControl = orchestrationControl; // was: this.PA

    /** @type {Object} Error broadcast channel [was: S] */
    this.errorChannel = errorChannel;

    /** @type {NetworkStatus} [was: D] */
    this.networkStatus = new $p(); // was: this.D

    /** @type {DelayedCallback} Timeout watchdog [was: j] */
    this.timeoutWatchdog = new Delay(() => {
      if (this.currentTransfer?.transferState === "TRANSFER_STATE_TRANSFERRING" && this.networkStatus.KU()) {
        if ((this.currentTransfer.transferRetryCount || 0) < 3) {
          pauseAndStopVideo(this.downloadController, this.playerResponse, false, false);
        } else {
          deleteMediaAndResetStatus(this.downloadController, this.playerResponse.videoDetails.videoId);
        }
        this.handleFailure("TRANSFER_FAILURE_REASON_TIMEOUT_NO_PROGRESS");
      }
    }); // was: this.j

    /** @type {number} Last progress report timestamp [was: Ie] */
    this.lastProgressTimestamp = 0;

    /** @type {number} Last telemetry report timestamp [was: mF] */
    this.lastTelemetryTimestamp = 0;

    /** @type {boolean} Whether first-start has been logged [was: L -> Y in some contexts] */
    this.hasStartedDownload = false; // was: this.L in eC4 context

    /** @type {number} Telemetry interval threshold [was: XI] */
    this.telemetryInterval = Um(this.api.G().experiments, "html5_transfer_processing_logs_interval");

    /** @type {boolean} Whether to reduce telemetry frequency [was: Y] */
    this.reducedTelemetry = this.api.G().X("html5_less_transfer_processing_logs");

    /** @type {Object|undefined} Currently downloading transfer entity [was: W] */
    this.currentTransfer = undefined;

    /** @type {Object|undefined} Player response for current download [was: K] */
    this.playerResponse = undefined;

    /** @type {string|undefined} Download state entity type name [was: A] */
    this.downloadStateEntityType = undefined;

    if (rT(this.api.G())) {
      this.downloadStateEntityType = "mainVideoDownloadStateEntity";
    } else if (uL(this.api.G()) || EQ(this.api.G())) {
      this.downloadStateEntityType = "musicTrackDownloadMetadataEntity";
    }
  }

  /**
   * Handles a transfer failure: retries if under limit, otherwise marks failed.
   * [was: tf]
   * Source lines: 4099–4129
   */
  async handleFailure(failureReason, callback) { // was: tf
    if (this.currentTransfer) {
      const transfer = this.currentTransfer;
      const videoId = transfer.key ? w1(transfer.key).entityId : "";

      // Determine if this failure type is retryable
      let isRetryable;
      switch (failureReason) {
        case "TRANSFER_FAILURE_REASON_FILESYSTEM_WRITE":
        case "TRANSFER_FAILURE_REASON_EXTERNAL_FILESYSTEM_WRITE":
        case "TRANSFER_FAILURE_REASON_PLAYABILITY":
        case "TRANSFER_FAILURE_REASON_TOO_MANY_RETRIES":
          isRetryable = false;
          break;
        default:
          isRetryable = true;
      }

      if (isRetryable && incrementRetryCount(this)) {
        // Re-enqueue for retry
        await saveTransferState(this, "TRANSFER_STATE_TRANSFER_IN_QUEUE");
        const offlineModeType = await getOfflineModeType(this, videoId);
        reportTransferStatusChanged(
          { transferStatusType: "TRANSFER_STATUS_TYPE_REENQUEUED_BY_RETRY" },
          { videoId, o_: transfer, offlineModeType }
        );
        if (videoId && this.downloadStateEntityType) {
          await updateDownloadStatusEntity(videoId, this.downloadStateEntityType, this.entityStore, "DOWNLOAD_STATE_RETRYABLE_FAILURE");
        }
      } else {
        // Permanent failure
        await setTransferToFailed(this, failureReason);
        if (videoId && this.downloadStateEntityType) {
          await updateDownloadStatusEntity(videoId, this.downloadStateEntityType, this.entityStore, "DOWNLOAD_STATE_FAILED");
        }
      }
    } else {
      logMissingTransfer(this, `onTransferFailure: ${failureReason}`);
    }

    clearCurrentTransfer(this);
    const nextPromise = startNextTransfer(this, true);
    if (callback) callback(nextPromise);
  }
}

// ──────────────────────────────────────────────────────────────────
// Transfer state helpers
// ──────────────────────────────────────────────────────────────────

/**
 * Clears the current transfer and stops the watchdog.
 * [was: C5]
 * Source lines: 2336–2340
 */
function clearCurrentTransfer(manager) { // was: C5
  manager.currentTransfer = undefined;
  manager.playerResponse = undefined;
  manager.timeoutWatchdog.stop();
}

/**
 * Picks the next queued transfer and starts downloading.
 * [was: MU]
 * Source lines: 2341–2353
 */
async function startNextTransfer(manager, withDelay = false) { // was: MU
  if (manager.currentTransfer) throw Error("Already downloading a video");
  manager.lastTelemetryTimestamp = 0;
  manager.hasStartedDownload = false;
  const next = await findNextTransfer(manager); // was: IL9
  // Notify orchestration about idle/busy state
  if (next && manager.networkStatus.KU()) {
    if (withDelay) {
      await new Promise((resolve) => { zn(resolve, 1000); });
    }
    await beginTransfer(manager, next); // was: eC4
  } else if (!next && manager.currentTransfer) {
    clearCurrentTransfer(manager);
  }
}

/**
 * Finds the highest-priority queued transfer entity.
 * [was: IL9]
 * Source lines: 2275–2278
 */
async function findNextTransfer(manager) { // was: IL9
  const transfers = (await rx(manager.entityStore, "transfer"))
    .filter((t) => TRANSFER_STATE_PRIORITY[t.transferState] !== undefined)
    .sort((a, b) => {
      const pa = TRANSFER_STATE_PRIORITY[a.transferState];
      const pb = TRANSFER_STATE_PRIORITY[b.transferState];
      return pa !== pb ? pa - pb : Number(a.enqueuedTimestampMs) - Number(b.enqueuedTimestampMs);
    });
  return transfers.length === 0 ? undefined : transfers[0];
}

/**
 * Increments the retry count on the current transfer entity.
 * Returns true if another retry is allowed.
 * [was: BM9]
 * Source lines: 2415–2420
 */
function incrementRetryCount(manager) { // was: BM9
  const canRetry = (manager.currentTransfer.transferRetryCount || 0) < 3;
  if (canRetry) {
    manager.currentTransfer.transferRetryCount = (manager.currentTransfer.transferRetryCount || 0) + 1;
  }
  return canRetry;
}

/**
 * Persists the transfer entity state to the Entity Store.
 * [was: uq]
 * Source lines: 2390–2408
 */
async function saveTransferState(manager, state, streamState, failureReason) { // was: uq
  if (manager.currentTransfer) {
    manager.currentTransfer.transferState = state;
    manager.currentTransfer.failureReason = failureReason;
    // (simplified — full version also updates stream progress states)
  } else {
    logMissingTransfer(manager, `saveTransferState: ${state}`);
  }
}

/**
 * Sets a transfer to failed and fires telemetry.
 * [was: x7m]
 * Source lines: 2421–2444
 */
async function setTransferToFailed(manager, reason = "TRANSFER_FAILURE_REASON_UNKNOWN") { // was: x7m
  if (!manager.currentTransfer) logMissingTransfer(manager, `setTransferToFailed: ${reason}`);
  await saveTransferState(manager, "TRANSFER_STATE_FAILED", "DOWNLOAD_STREAM_STATE_ERROR_STREAMS_MISSING", reason);

  const videoId = manager.currentTransfer ? w1(manager.currentTransfer.key).entityId : "";
  const offlineModeType = await getOfflineModeType(manager, videoId);
  const payload = {
    transferStatusType: "TRANSFER_STATUS_TYPE_TERMINATED_WITH_FAILURE",
    statusType: "FAILED",
  };
  if (reason) {
    payload.transferFailureReason = reason;
    payload.failureReason = mapTransferFailureReason(reason);
  }
  reportTransferStatusChanged(payload, { videoId, o_: manager.currentTransfer, offlineModeType });
}

/**
 * Reads the offline mode type for a given video.
 * [was: ha]
 * Source lines: 2354–2356
 */
async function getOfflineModeType(manager, videoId) { // was: ha
  return (await readEntityByKey(manager.entityStore, bX(videoId, "videoDownloadContextEntity"), "videoDownloadContextEntity"))?.offlineModeType ?? undefined;
}

/**
 * Begins downloading a specific transfer entity.
 * [was: eC4]
 * Source lines: 2279–2335
 */
async function beginTransfer(manager, transferEntity) { // was: eC4
  if (manager.hasStartedDownload) return;
  manager.hasStartedDownload = true;
  manager.currentTransfer = transferEntity;
  // ... (creates player, starts download, sets up watchdog)
  manager.timeoutWatchdog.start(10800000); // 3 hours
}

/**
 * Reports a log message for a missing current transfer entity.
 * [was: zB]
 * Source lines: 2409–2414
 */
function logMissingTransfer(manager, detail) { // was: zB
  manager.api.RetryTimer("woffle", { mcte: detail });
  logWoffleError("missing current transfer entity.");
}

/**
 * Updates the download status entity for a video.
 * [was: TB]
 * Source lines: 575–600
 */
async function updateDownloadStatusEntity(videoId, entityType, entityStore, newState, forceOverwrite = false) { // was: TB
  const entityKey = bX(videoId, entityType);
  const statusKey = bX(videoId, "downloadStatusEntity");
  const [entity, statusEntity] = await Kr(entityStore, { mode: "readonly", g3: true }, (shouldUseDesktopControls) =>
    P8.all([Yf(shouldUseDesktopControls, entityKey, entityType), Yf(shouldUseDesktopControls, statusKey, "downloadStatusEntity")])
  );
  if (!entity) return;

  let status = statusEntity;
  if (status) {
    if (status.downloadState === "DOWNLOAD_STATE_USER_DELETED" && !forceOverwrite) return;
    status.downloadState = newState;
  } else {
    status = { key: statusKey, downloadState: newState };
  }
  OE(entity, downloadStatusEntityKey, status);
  await Kr(entityStore, { mode: "readwrite", g3: true }, (shouldUseDesktopControls) =>
    P8.all([WI(shouldUseDesktopControls, entity, entityType), WI(shouldUseDesktopControls, status, "downloadStatusEntity")])
  );
}

// ──────────────────────────────────────────────────────────────────
// Leader election
// ──────────────────────────────────────────────────────────────────

/**
 * Attempts to acquire the orchestration leader lock via Web Locks API.
 * Only one tab at a time runs the download orchestration.
 * [was: Zji]
 * Source lines: 463–488
 */
export function acquireOrchestrationLock(control) { // was: Zji
  if (control.isAcquiring || control.isLeader) return; // was: control.A, control.W
  const lockManager = getWebLocksManager();
  if (!lockManager) return;

  control.isAcquiring = true;
  const datasyncId = Dk("OfflineLockManager");
  lockManager.request(`woffle_orchestration_leader:${datasyncId}`, {}, async () => {
    try {
      control.leaderDeferred = new id(); // was: control.O
      control.isLeader = true;
      control.isAcquiring = false;
      await control.onBecameLeader(); // was: control.L()
      await control.leaderDeferred.promise;
    } catch (err) {
      control.onLostLeader(); // was: control.j_()
      if (err instanceof Error) {
        err.args = [{ name: "WoLockManagerError", audioTrackLabelMap: err.name }];
        // log error
      }
    }
  });
}

/**
 * Returns the Web Locks API wrapper (singleton).
 * [was: ij0]
 * Source lines: 407–423
 */
function getWebLocksManager() { // was: ij0
  try {
    let locks = DR("ytglobal.locks_");
    if (locks) return locks;
    if (navigator && "locks" in navigator && !!navigator.locks) {
      // Validate localStorage access (detect security restrictions)
      qX.localStorage?.getItem("noop");
      locks = new WebLocksWrapper(); // was: Nsa
      n7("ytglobal.locks_", locks);
      return locks;
    }
  } catch (_e) { /* swallow security errors */ }
}

/**
 * Minimal wrapper around the Navigator.locks API.
 * [was: Nsa]
 * Source lines: 3649–3656
 */
class WebLocksWrapper { // was: Nsa
  constructor() {
    this.locks = navigator.locks;
  }
  request(name, options = {}, callback) {
    return this.locks.request(name, options, (lock) => callback(lock));
  }
}

// ──────────────────────────────────────────────────────────────────
// Orchestration control
// ──────────────────────────────────────────────────────────────────

/**
 * Manages orchestration leader lifecycle (visibility-aware heartbeat).
 * [was: e3Z]
 * Source lines: 3719–3751
 */
export class OrchestrationControl { // was: e3Z
  constructor(onBecameLeader, onLostLeader, visibilityTracker) {
    /** @type {Function} [was: L] */
    this.onBecameLeader = onBecameLeader;

    /** @type {Function} [was: Y] */
    this.onLostLeaderCallback = onLostLeader;

    /** @type {Object} */
    this.visibility = visibilityTracker;

    /** @type {boolean} [was: W] */
    this.isLeader = false;

    /** @type {boolean} [was: A] */
    this.isAcquiring = false;

    /** @type {boolean} Whether downloads are idle [was: D] */
    this.isDownloadsIdle = false;

    /** @type {boolean} Whether connected [was: J] */
    this.isConnected = false;

    /** @type {boolean} Whether orchestration is initialized [was: K] */
    this.isInitialized = false;

    /** @type {DelayedCallback} Background keep-alive timer [was: j] */
    this.keepAliveTimer = new Delay(() => { this.onLostLeader(); });

    /** @type {Deferred|undefined} [was: O] */
    this.leaderDeferred = undefined;

    this.visibility.subscribe("visibilitystatechange", () => { this.onVisibilityChange(); });
  }

  onVisibilityChange() {
    if (this.isLeader) updateKeepAlive(this);
  }

  onLostLeader() {
    if (this.leaderDeferred) this.leaderDeferred.resolve();
    this.isAcquiring = false;
    this.isLeader = false;
    this.onLostLeaderCallback();
  }
}

/**
 * Starts or stops the background keep-alive timer based on visibility.
 * [was: Ya]
 * Source lines: 489–491
 */
function updateKeepAlive(control) { // was: Ya
  if (control.isConnected && control.isDownloadsIdle && control.isInitialized && control.visibility.isBackground()) {
    control.keepAliveTimer.cw(60000);
  } else {
    control.keepAliveTimer.stop();
  }
}

// ──────────────────────────────────────────────────────────────────
// Offline state snapshot (telemetry)
// ──────────────────────────────────────────────────────────────────

/**
 * Fires an `offlineStateSnapshot` event with all current downloads.
 * [was: Fga]
 * Source lines: 455–458
 */
export async function reportOfflineStateSnapshot(entityStore) { // was: Fga
  const snapshot = await buildOfflineStateSnapshot(entityStore); // was: HjH
  eG("offlineStateSnapshot", snapshot);
}

/**
 * Builds the full offline state snapshot from the entity store.
 * Iterates all playbackData entities, joins with transfer, policy,
 * and stream-progress entities, and computes a video state per download.
 * [was: HjH]
 * Source lines: 270–406
 *
 * (Implementation details omitted for brevity — see source for the
 *  full join logic across playbackData, transfer, offlineVideoPolicy,
 *  downloadStatusEntity, and offlineVideoStreams entity types.)
 */
async function buildOfflineStateSnapshot(entityStore) { // was: HjH
  // ... complex join across multiple entity types
  // Returns { offlineVideos: [...], additionalOfflineClientState: {...} }
}

// ──────────────────────────────────────────────────────────────────
// Flow event logging
// ──────────────────────────────────────────────────────────────────

/**
 * Singleton flow-event nonce manager.
 * [was: qJW / n8W / uT]
 * Source lines: 239–242, 3641–3646
 */
let flowEventManager; // was: uT
function getFlowEventManager() { // was: n8W
  if (!flowEventManager) flowEventManager = { nonces: new Map() };
  return flowEventManager;
}

/**
 * Creates a flow event descriptor.
 * [was: DNS]
 * Source lines: 243–254
 */
function createFlowEvent(eventType, metadata) { // was: DNS
  return {
    eventType: {
      flowEventNamespace: "FLOW_EVENT_NAMESPACE_OFFLINE_ORCHESTRATION",
      flowEventType: eventType,
    },
    metadata,
    statusCode: undefined,
    csn: undefined,
    can: undefined,
  };
}

/**
 * Reports a flow event for offline orchestration.
 * [was: tb9]
 * Source lines: 255–269
 */
function reportFlowEvent(manager, event, flowNonce) { // was: tb9
  if (!flowNonce) {
    flowNonce = manager.nonces?.get("FLOW_TYPE_OFFLINE_ORCHESTRATION");
    if (!flowNonce) {
      flowNonce = Ab(16);
      manager.nonces?.set("FLOW_TYPE_OFFLINE_ORCHESTRATION", flowNonce);
    }
  }
  const payload = {
    flowNonce,
    flowType: "FLOW_TYPE_OFFLINE_ORCHESTRATION",
    flowEventType: event.eventType,
  };
  if (event.metadata) payload.flowMetadata = event.metadata;
  if (event.statusCode !== undefined) payload.flowEventStatus = event.statusCode;
  if (event.csn) payload.csn = event.csn;
  if (event.can) payload.can = event.can;
  eG("flowEvent", payload, undefined);
}

// ──────────────────────────────────────────────────────────────────
// Cache API wrapper (thumbnail/image caching)
// ──────────────────────────────────────────────────────────────────

/**
 * Deletes all entries from the player local image cache.
 * [was: OjH]
 * Source lines: 678–681
 */
export async function deleteLocalImageCache() { // was: OjH
  const cacheApi = await getPlayerCacheStorage();
  return cacheApi ? cacheApi.delete("yt-player-local-img") : true;
}

/**
 * Removes specific URLs from the image cache.
 * [was: xL]
 * Source lines: 682–690
 */
export async function removeFromImageCache(urls) { // was: xL
  const cacheApi = await getPlayerCacheStorage();
  if (!cacheApi) throw Error("Cache API not supported");
  if (urls.length) {
    const cache = await cacheApi.open("yt-player-local-img");
    await Promise.all(urls.map((url) => cache.delete(url)));
  }
}

/**
 * Adds URLs to the image cache.
 * [was: qU]
 * Source lines: 691–696
 */
export async function addToImageCache(urls) { // was: qU
  const cacheApi = await getPlayerCacheStorage();
  if (!cacheApi) throw Error("Cache API not supported");
  if (urls.length) {
    await (await cacheApi.open("yt-player-local-img")).addAll(urls);
  }
}

/** Lazily gets the Cache Storage wrapper. [was: JX] Source lines: 444–448 */
let cacheStorageSingleton; // was: Mk
async function getPlayerCacheStorage() { // was: JX
  if (await isCacheStorageAvailable()) {
    if (!cacheStorageSingleton) cacheStorageSingleton = new ScopedCacheStorage();
    return cacheStorageSingleton;
  }
}

/** Checks Cache API availability. [was: yF9] Source lines: 429–443 */
let cacheAvailable; // was: zI
async function isCacheStorageAvailable() { // was: yF9
  if (cacheAvailable !== undefined) return cacheAvailable;
  return (cacheAvailable = new Promise(async (resolve) => {
    try {
      await qX.caches.open("test-only");
      await qX.caches.delete("test-only");
    } catch (e) {
      if (e instanceof Error && e.name === "SecurityError") {
        resolve(false);
        return;
      }
    }
    resolve("caches" in window);
  }));
}

/**
 * Scoped cache storage that appends the datasync ID to cache names.
 * [was: SJ9 extends Xs9]
 * Source lines: 3658–3692
 */
class ScopedCacheStorage { // was: SJ9
  open(name) { return qX.caches.open(scopedCacheName(name)); }
  has(name) { return qX.caches.has(scopedCacheName(name)); }
  delete(name) { return qX.caches.delete(scopedCacheName(name)); }
}

function scopedCacheName(name) { // was: hX
  if (name.includes(":")) throw Error(`Invalid user cache name: ${name}`);
  return `${name}:${Dk("CacheStorage get")}`;
}

// ──────────────────────────────────────────────────────────────────
// Default retry schedule
// ──────────────────────────────────────────────────────────────────

/**
 * Returns the default action metadata with retry schedule.
 * [was: Aa]
 * Source lines: 649–654
 */
export function defaultActionMetadata() { // was: Aa
  return {
    priority: 1,
    retryScheduleIntervalsInSeconds: [1, 2, 4],
  };
}

// ──────────────────────────────────────────────────────────────────
// Broadcast channel for cross-tab sync
// ──────────────────────────────────────────────────────────────────

/**
 * BroadcastChannel pair for syncing offline errors and pause commands
 * between tabs sharing the same datasync session.
 * [was: A31]
 * Source lines: 3694–3717
 */
export class OfflineBroadcastChannels extends Disposable { // was: A31
  constructor(playerApi) {
    super();
    this.api = playerApi;

    if (typeof qX.BroadcastChannel !== "undefined") {
      /** @type {BroadcastChannel} Error sync channel [was: W] */
      this.errorChannel = new qX.BroadcastChannel(`PLAYER_OFFLINE_ERROR_SYNC:${Dk()}`);
      this.errorChannel.onmessage = this.onErrorMessage.bind(this);

      /** @type {BroadcastChannel} Pause sync channel [was: O] */
      this.pauseChannel = new qX.BroadcastChannel(`PLAYER_OFFLINE_PAUSE_SYNC:${Dk()}`);
      this.pauseChannel.onmessage = this.onPauseMessage.bind(this);
    }
  }

  /** Relays a cross-tab error event. [was: A] */
  onErrorMessage(event) {
    xt(this.api, "onOfflineOperationFailure", event.data);
  }

  /** Relays a cross-tab pause event. [was: j] */
  onPauseMessage(event) {
    this.api.publish("offlinetransferpause", event.data);
  }

  disposeApp() {
    this.errorChannel?.close();
    this.pauseChannel?.close();
  }
}

// ──────────────────────────────────────────────────────────────────
// Notification helpers
// ──────────────────────────────────────────────────────────────────

/**
 * Fires an offline-operation-failure event and broadcasts it to other tabs.
 * [was: ka]
 * Source lines: 459–462
 */
export function notifyOperationFailure(context, failurePayload) { // was: ka
  xt(context.api, "onOfflineOperationFailure", failurePayload);
  context.errorChannel?.postMessage(failurePayload); // was: context.W
}
