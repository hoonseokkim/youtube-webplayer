/**
 * Offline Helpers — Captions storage, request builders, flow events,
 * video state aggregation, Web Locks, Cache Storage, error logging
 *
 * Source: player_es6.vflset/en_US/offline.js, lines 191–459
 *
 * Bridges entity-sync (lines 4–190) and download-manager (lines 460+).
 * Covers:
 *  - Caption storage (IDB-backed write/read)
 *  - Request payload builders for offline sync
 *  - Flow event construction and logging
 *  - Full offline state aggregation from entity store
 *  - Web Locks API wrapper
 *  - Cache Storage availability detection and access
 *  - Error logging utility ("Woffle" prefix)
 *  - State snapshot dispatcher
 */

import { getDatasyncId } from '../../core/attestation.js';  // was: g.Dk
import { globalRef } from '../../core/polyfills.js';  // was: g.IW
import { generateRandomBase64 } from '../../data/gel-core.js';  // was: g.Ab
import { logGelEvent, reportWarning } from '../../data/gel-params.js';  // was: g.eG, g.Ty
import { createIdbNotSupportedError, getIdbToken, IdbPromise, runTransaction } from '../../data/idb-transactions.js';  // was: g.$s, g.AD, g.P8, g.MD
import { openPlayerIdbTransaction, setLocalVolume } from '../../media/format-mappings.js';  // was: g.T3, g.Kl
import { buildFullInnertubeContext } from '../../network/innertube-client.js';  // was: g.Oh
import { deserializeEntityKey, getEntitiesByType, serializeEntityKey, withEntityTransaction } from '../../proto/varint-decoder.js';  // was: g.w1, g.po, g.bX, g.Kr
import { deleteMediaForVideo } from './entity-sync.js'; // was: UNi
import { filter } from '../../core/array-utils.js';
import { getObjectByPath } from '../../core/type-helpers.js';
import { PlayerError } from '../../ui/cue-manager.js';

// ---------------------------------------------------------------------------
// Media key regex  [was: g.Wdy, line 84063]
// ---------------------------------------------------------------------------

/**
 * Regex for parsing media key strings of the form:
 *   `videoId|itag(;optionalSuffix)?|startByteOffset|endByteOffset`
 *
 * Groups:
 *   1: videoId (word chars, hyphens, underscores)
 *   2: itag (digits)
 *   3: optional suffix (`;suffix`)
 *   4: start byte offset (digits)
 *   5: end byte offset (digits)
 *
 * [was: g.Wdy]
 * @type {RegExp}
 */
export const MEDIA_KEY_REGEX = /^([\w\-_]+)\|(\d+)(;[\w\-_]+)?\|(\d+)\|(\d+)$/; // [was: g.Wdy]

// ---------------------------------------------------------------------------
// writeCaptions [was: Xha] (lines 191–209)
// ---------------------------------------------------------------------------

/**
 * Writes caption data to the "captions" IDB store, keyed by videoId|vss_id.
 * [was: Xha]
 *
 * @param {string} videoId [was: Q] - the video identifier
 * @param {Array<Object>} captions [was: c] - caption objects with metadata.vss_id
 * @returns {Promise<void>}
 */
export async function writeCaptions(videoId, captions) { // was: Xha
  let database = await getIdbToken(); // was: W = await g.AD()
  if (!database) throw createIdbNotSupportedError("wct"); // was: throw g.$s("wct")

  database = await openPlayerIdbTransaction(database); // was: W = await g.T3(W)

  await runTransaction(database, ["captions"], {
    mode: "readwrite",
    g3: true, // was: g3: !0
  }, (transaction) => { // was: m
    const promises = []; // was: K
    const store = transaction.objectStore("captions"); // was: m = m.objectStore("captions")

    for (let i = 0; i < captions.length; i++) { // was: T
      const putRequest = store.put(captions[i], videoId + "|" + captions[i].metadata.vss_id); // was: r
      promises.push(putRequest);
    }

    return IdbPromise.all(promises);
  });
}

// ---------------------------------------------------------------------------
// getAllCaptionsForVideo [was: AF9] (lines 210–216)
// ---------------------------------------------------------------------------

/**
 * Reads all captions for a video from the "captions" IDB store.
 * Uses a key range bound of "videoId|" to "videoId~".
 * [was: AF9]
 *
 * @param {string} videoId [was: Q]
 * @returns {Promise<Array<Object>>}
 */
export async function getAllCaptionsForVideo(videoId) { // was: AF9
  const range = IDBKeyRange.bound(videoId + "|", videoId + "~"); // was: Q
  const database = await getIdbToken(); // was: c
  if (!database) throw createIdbNotSupportedError("gactfv");

  return (await openPlayerIdbTransaction(database)).getAll("captions", range);
}

// ---------------------------------------------------------------------------
// getMediaInventoryForVideo [was: eJi] (lines 217–220)
// ---------------------------------------------------------------------------

/**
 * Retrieves the media inventory for a video, resetting its status first.
 * [was: eJi]
 *
 * @param {string} videoId [was: Q]
 * @returns {Promise<Object>}
 */
export async function getMediaInventoryForVideo(videoId) { // was: eJi
  setLocalVolume(videoId, 0); // was: g.Kl(Q, 0) — setMediaStatus(videoId, 0)
  return deleteMediaForVideo(videoId); // was: return UNi(Q) — internal inventory lookup
}

// ---------------------------------------------------------------------------
// buildVideoIdsRequest [was: Vbi] (lines 221–226)
// ---------------------------------------------------------------------------

/**
 * Builds a request payload with video IDs for offline sync endpoints.
 * [was: Vbi]
 *
 * @param {string[]} videoIds [was: Q]
 * @returns {{ context: Object, videoIds: string[] }}
 */
export function buildVideoIdsRequest(videoIds) { // was: Vbi
  return {
    context: buildFullInnertubeContext(), // was: g.Oh() — getInnertubeContext()
    videoIds: videoIds,
  };
}

// ---------------------------------------------------------------------------
// buildPlaylistIdsRequest [was: Bsm] (lines 227–232)
// ---------------------------------------------------------------------------

/**
 * Builds a request payload with playlist IDs for offline sync endpoints.
 * [was: Bsm]
 *
 * @param {string[]} playlistIds [was: Q]
 * @returns {{ context: Object, playlistIds: string[] }}
 */
export function buildPlaylistIdsRequest(playlistIds) { // was: Bsm
  return {
    context: buildFullInnertubeContext(),
    playlistIds: playlistIds,
  };
}

// ---------------------------------------------------------------------------
// buildPlaylistSyncCheckRequest [was: xNm] (lines 233–238)
// ---------------------------------------------------------------------------

/**
 * Builds a request payload for offline playlist sync checks.
 * [was: xNm]
 *
 * @param {Array<Object>} syncChecks [was: Q]
 * @returns {{ context: Object, offlinePlaylistSyncChecks: Array<Object> }}
 */
export function buildPlaylistSyncCheckRequest(syncChecks) { // was: xNm
  return {
    context: buildFullInnertubeContext(),
    offlinePlaylistSyncChecks: syncChecks,
  };
}

// ---------------------------------------------------------------------------
// getOrchestrationManager (singleton) [was: n8W] (lines 239–242)
// ---------------------------------------------------------------------------

/** @type {qJW|undefined} */
let orchestrationManagerInstance; // was: uT

/**
 * Returns the singleton orchestration manager instance.
 * [was: n8W]
 *
 * @returns {qJW}
 */
export function getOrchestrationManager() { // was: n8W
  if (!orchestrationManagerInstance) {
    orchestrationManagerInstance = new qJW(); // was: uT = new qJW
  }
  return orchestrationManagerInstance;
}

// ---------------------------------------------------------------------------
// createFlowEvent [was: DNS] (lines 243–254)
// ---------------------------------------------------------------------------

/**
 * Creates a flow event descriptor for offline orchestration logging.
 * [was: DNS]
 *
 * @param {string} flowEventType [was: Q]
 * @param {Object} [metadata] [was: c]
 * @returns {Object} flow event descriptor
 */
export function createFlowEvent(flowEventType, metadata) { // was: DNS
  return {
    eventType: {
      flowEventNamespace: "FLOW_EVENT_NAMESPACE_OFFLINE_ORCHESTRATION",
      flowEventType: flowEventType,
    },
    metadata: metadata,
    statusCode: undefined, // was: void 0
    csn: undefined,
    can: undefined,
  };
}

// ---------------------------------------------------------------------------
// logFlowEvent [was: tb9] (lines 255–269)
// ---------------------------------------------------------------------------

/**
 * Logs a flow event for offline orchestration telemetry.
 * Creates a new flow nonce if one does not exist for the current flow type.
 * [was: tb9]
 *
 * @param {Object} manager [was: Q] - orchestration manager with nonce map
 * @param {Object} event [was: c] - the flow event descriptor
 * @param {string} [flowNonce] [was: W] - optional existing nonce
 */
export function logFlowEvent(manager, event, flowNonce) { // was: tb9
  if (!flowNonce) {
    flowNonce = manager.W.get("FLOW_TYPE_OFFLINE_ORCHESTRATION"); // was: W = Q.W.get(...)
    if (!flowNonce) {
      flowNonce = generateRandomBase64(16); // was: W = g.Ab(16) — generate random nonce
      manager.W.set("FLOW_TYPE_OFFLINE_ORCHESTRATION", flowNonce);
    }
  }

  const logPayload = {
    flowNonce: flowNonce,
    flowType: "FLOW_TYPE_OFFLINE_ORCHESTRATION",
    flowEventType: event.eventType,
  };

  if (event.metadata) logPayload.flowMetadata = event.metadata;
  if (event.statusCode !== undefined) logPayload.flowEventStatus = event.statusCode;
  if (event.csn) logPayload.csn = event.csn;
  if (event.can) logPayload.can = event.can;

  logGelEvent("flowEvent", logPayload, undefined); // was: g.eG("flowEvent", Q, void 0)
}

// ---------------------------------------------------------------------------
// aggregateOfflineState [was: HjH] (lines 270–406)
// ---------------------------------------------------------------------------

/**
 * Aggregates the full offline state from the entity store, including
 * playback data, transfer state, video policies, download status,
 * and stream progress. Returns a snapshot of all offline videos
 * with their current states for telemetry.
 * [was: HjH]
 *
 * @param {Object} entityStore [was: Q] - the entity store reference
 * @returns {Promise<Object>} snapshot with offlineVideos and additionalOfflineClientState
 */
export async function aggregateOfflineState(entityStore) { // was: HjH
  // First pass: read playback data and related entities
  let result = await withEntityTransaction(entityStore, {
    mode: "readonly",
    g3: true,
  }, (transaction) => { // was: B
    return getEntitiesByType(transaction, "playbackData").then((playbackEntries) => { // was: n
      const transferKeys = playbackEntries.map((entry) => entry.transfer).filter((t) => !!t); // was: S
      const policyKeys = playbackEntries.map((entry) => entry.offlineVideoPolicy).filter((p) => !!p); // was: d
      const statusKeys = playbackEntries
        .filter((entry) => !!entry.key)
        .map((entry) => serializeEntityKey(deserializeEntityKey(entry.key).entityId, "downloadStatusEntity")); // was: b

      const transferPromise = getEntitiesByType(transaction, "transfer", transferKeys); // was: S
      const policyPromise = getEntitiesByType(transaction, "offlineVideoPolicy", policyKeys); // was: d
      const statusPromise = getEntitiesByType(transaction, "downloadStatusEntity", statusKeys); // was: b

      const streamsPromise = transferPromise.then((transfers) => { // was: w
        const streamKeys = transfers
          .reduce((acc, transfer) => {
            if (transfer?.offlineVideoStreams) acc.push(...transfer.offlineVideoStreams);
            return acc;
          }, [])
          .filter((key) => !!key);
        return getEntitiesByType(transaction, "offlineVideoStreams", streamKeys);
      });

      return IdbPromise.all([transferPromise, policyPromise, streamsPromise, statusPromise])
        .then(([transfers, policies, streams, statuses]) => [
          playbackEntries,
          transfers,
          policies,
          streams,
          statuses,
        ]);
    });
  });

  // Second pass: read the main downloads list
  const downloadsList = await withEntityTransaction(entityStore, {
    mode: "readonly",
    g3: true,
  }, (transaction) => {
    return getEntitiesByType(transaction, "mainDownloadsListEntity")
      .then((entries) => entries[0]?.downloads ?? []);
  });

  const [playbackEntries, transfers, policies, streams, statuses] = result; // was: [W, m, K, T, r]

  // Build lookup maps
  const transferMap = {}; // was: U
  const policyMap = {}; // was: I
  const statusMap = {}; // was: X
  const streamsMap = {}; // was: A
  const downloadsSet = {}; // was: e
  const smartDownloadVideos = []; // was: c

  for (const transfer of transfers) {
    if (transfer) transferMap[transfer.key] = transfer;
  }
  for (const policy of policies) {
    if (policy) policyMap[policy.key] = policy;
  }
  for (const status of statuses) {
    if (status) statusMap[status.key] = status;
  }
  for (const stream of streams) {
    if (stream) streamsMap[stream.key] = stream;
  }

  for (const download of downloadsList) { // was: B
    downloadsSet[download.videoItem ?? ""] = true;
    if (download.videoItem) {
      const externalId = deserializeEntityKey(download.videoItem)?.entityId ?? "";
      smartDownloadVideos.push({ externalVideoId: externalId });
    }
  }

  return {
    offlineVideos: playbackEntries
      .filter((entry) => { // was: B
        if (!entry || !entry.key || !entry.offlineVideoPolicy) return false;
        const entityId = deserializeEntityKey(entry.key).entityId;
        const statusKey = serializeEntityKey(entityId, "downloadStatusEntity");
        return !(statusKey && statusMap[statusKey]?.downloadState === "DOWNLOAD_STATE_USER_DELETED");
      })
      .map((entry) => { // was: B
        const transfer = transferMap[entry.transfer]; // was: n
        const streamEntries = []; // was: S

        if (transfer?.offlineVideoStreams) {
          for (const streamKey of transfer.offlineVideoStreams) { // was: d
            const stream = streamsMap[streamKey]; // was: b
            if (stream) streamEntries.push(stream);
          }
        }

        const policy = policyMap[entry.offlineVideoPolicy]; // was: d
        const playerResponseTimestamp = entry?.playerResponseTimestamp; // was: b
        const videoId = deserializeEntityKey(policy.key).entityId; // was: w
        const mainVideoKey = serializeEntityKey(videoId, "mainVideoEntity"); // was: B

        // Determine video state from policy and transfer
        let videoState; // was: f

        if (policy.action === "OFFLINE_VIDEO_POLICY_ACTION_DISABLE") {
          videoState = "OFFLINE_VIDEO_STATE_DISABLED";
          if (policy.expirationTimestamp && Number(policy.expirationTimestamp) < Date.now() / 1000) {
            videoState = "OFFLINE_VIDEO_STATE_EXPIRED";
          }
        } else if (policy.action === "OFFLINE_VIDEO_POLICY_ACTION_DOWNLOAD_FAILED") {
          videoState = "OFFLINE_VIDEO_STATE_OFFLINE_FAILED";
        } else {
          switch (transfer?.transferState) {
            case "TRANSFER_STATE_TRANSFER_IN_QUEUE":
              videoState = "OFFLINE_VIDEO_STATE_PENDING";
              break;
            case "TRANSFER_STATE_TRANSFERRING":
              videoState = "OFFLINE_VIDEO_STATE_TRANSFERRING";
              break;
            case "TRANSFER_STATE_PAUSED_BY_USER":
              videoState = "OFFLINE_VIDEO_STATE_PAUSED_TRANSFER";
              break;
            case "TRANSFER_STATE_FAILED":
              videoState = "OFFLINE_VIDEO_STATE_OFFLINE_FAILED";
              break;
            case "TRANSFER_STATE_COMPLETE":
              videoState = "OFFLINE_VIDEO_STATE_PLAYABLE";
              break;
            case "TRANSFER_STATE_WAITING_FOR_PLAYER_RESPONSE_REFRESH":
              videoState = "OFFLINE_VIDEO_STATE_STREAMS_OUT_OF_DATE";
              break;
            default:
              videoState = "OFFLINE_VIDEO_STATE_UNKNOWN";
          }

          // Refine failure reasons
          if (videoState === "OFFLINE_VIDEO_STATE_OFFLINE_FAILED") {
            switch (transfer?.failureReason) {
              case "TRANSFER_FAILURE_REASON_EXTERNAL_FILESYSTEM_WRITE":
              case "TRANSFER_FAILURE_REASON_FILESYSTEM_WRITE":
                videoState = "OFFLINE_VIDEO_STATE_OUT_OF_STORAGE_ERROR";
                break;
              case "TRANSFER_FAILURE_REASON_STREAM_MISSING":
                videoState = "OFFLINE_VIDEO_STATE_STREAMS_MISSING";
                break;
              case "TRANSFER_FAILURE_REASON_NETWORK":
              case "TRANSFER_FAILURE_REASON_NETWORK_LOST":
                videoState = "OFFLINE_VIDEO_STATE_NETWORK_ERROR";
                break;
            }
          }
        }

        const videoInfo = {
          id: videoId,
          videoState: videoState,
        }; // was: w

        if (transfer?.cotn) videoInfo.cotn = transfer.cotn;
        if (transfer?.maximumDownloadQuality) videoInfo.selectedVideoQuality = transfer.maximumDownloadQuality;
        if (transfer?.lastProgressTimeMs) videoInfo.lastProgressTimeMs = transfer.lastProgressTimeMs;
        if (playerResponseTimestamp) videoInfo.playerResponseSavedTimeMs = String(Number(playerResponseTimestamp) * 1000);

        // Sum downloaded bytes across all stream progress entries
        let totalBytes = 0; // was: b
        for (const stream of streamEntries) { // was: G
          if (stream.streamsProgress) {
            for (const progress of stream.streamsProgress) { // was: T7
              totalBytes += Number(progress.numBytesDownloaded ?? 0);
            }
          }
        }
        videoInfo.downloadedBytes = String(totalBytes);

        videoInfo.selectedOfflineMode = downloadsSet[mainVideoKey]
          ? "OFFLINE_MODE_TYPE_AUTO_OFFLINE"
          : "OFFLINE_NOW";

        if (policy.action === "OFFLINE_VIDEO_POLICY_ACTION_DISABLE") {
          videoInfo.offlinePlaybackDisabledReason = policy.offlinePlaybackDisabledReason;
        }

        return videoInfo;
      }),
    additionalOfflineClientState: {
      mainAppAdditionalOfflineClientState: {
        smartDownloadVideos: smartDownloadVideos,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// getWebLocks [was: ij0] (lines 407–423)
// ---------------------------------------------------------------------------

/**
 * Returns or initializes the global Web Locks wrapper.
 * Falls back gracefully if navigator.locks is unavailable.
 * [was: ij0]
 *
 * @returns {Nsa|undefined} the locks wrapper, or undefined
 */
export function getWebLocks() { // was: ij0
  try {
    let locks = getObjectByPath("ytglobal.locks_"); // was: W = g.DR("ytglobal.locks_")
    if (locks) return locks;

    let hasLocks;
    if (navigator) {
      const nav = navigator;
      hasLocks = "locks" in nav && !!nav.locks;
    }

    if (hasLocks) {
      // Touch localStorage to detect Security errors early
      if (globalRef.localStorage) globalRef.localStorage.getItem("noop");
      locks = new Nsa(); // was: W = new Nsa
      setGlobal("ytglobal.locks_", locks);
      return locks;
    }
  } catch (_e) {
    // Silently ignore — locks not available
  }
}

// ---------------------------------------------------------------------------
// getUserCacheName [was: hX] (lines 424–428)
// ---------------------------------------------------------------------------

/**
 * Validates and returns a scoped cache name for a user.
 * Throws if the name contains a colon.
 * [was: hX]
 *
 * @param {string} userName [was: Q]
 * @returns {string} scoped cache name
 */
export function getUserCacheName(userName) { // was: hX
  if (userName.includes(":")) {
    throw Error(`Invalid user cache name: ${userName}`);
  }
  return `${userName}:${getDatasyncId("CacheStorage get")}`; // was: g.Dk(...)
}

// ---------------------------------------------------------------------------
// isCacheStorageAvailable [was: yF9] (lines 429–443)
// ---------------------------------------------------------------------------

/** @type {Promise<boolean>|undefined} */
let cacheStorageAvailable; // was: zI

/**
 * Checks whether the CacheStorage API is available and functional.
 * Caches the result after first call.
 * [was: yF9]
 *
 * @returns {Promise<boolean>}
 */
export async function isCacheStorageAvailable() { // was: yF9
  if (cacheStorageAvailable !== undefined) return cacheStorageAvailable;

  return (cacheStorageAvailable = new Promise(async (resolve) => { // was: Q
    try {
      await CB.open("test-only"); // was: CB — the global caches reference
      await CB.delete("test-only");
    } catch (error) {
      if (error instanceof Error && error.name === "SecurityError") {
        resolve(false);
        return;
      }
    }
    resolve("caches" in window);
  }));
}

// ---------------------------------------------------------------------------
// getCacheManager [was: JX] (lines 444–448)
// ---------------------------------------------------------------------------

/** @type {SJ9|undefined} */
let cacheManagerInstance; // was: Mk

/**
 * Returns the singleton CacheManager, or undefined if cache is unavailable.
 * [was: JX]
 *
 * @returns {Promise<SJ9|undefined>}
 */
export async function getCacheManager() { // was: JX
  if (await isCacheStorageAvailable()) {
    if (!cacheManagerInstance) {
      cacheManagerInstance = new SJ9(); // was: Mk = new SJ9
    }
    return cacheManagerInstance;
  }
}

// ---------------------------------------------------------------------------
// logWoffleError [was: Rj] (lines 449–454)
// ---------------------------------------------------------------------------

/**
 * Logs an error with the "Woffle:" prefix for offline-related issues.
 * [was: Rj]
 *
 * @param {string} message [was: Q]
 * @param {Error|*} error [was: c]
 * @param {string} [cotn] [was: W] - optional correlation token
 */
export function logWoffleError(message, error, cotn) { // was: Rj
  reportWarning(new PlayerError(
    `Woffle: ${message}`,
    cotn ? { cotn: cotn } : ""
  ));
  if (error instanceof Error) reportWarning(error);
}

// ---------------------------------------------------------------------------
// dispatchOfflineStateSnapshot [was: Fga] (lines 455–458)
// ---------------------------------------------------------------------------

/**
 * Aggregates and dispatches the full offline state snapshot for telemetry.
 * [was: Fga]
 *
 * @param {Object} entityStore [was: Q]
 * @returns {Promise<void>}
 */
export async function dispatchOfflineStateSnapshot(entityStore) { // was: Fga
  const snapshot = await aggregateOfflineState(entityStore); // was: Q = await HjH(Q)
  logGelEvent("offlineStateSnapshot", snapshot);
}

// ---------------------------------------------------------------------------
// NOTE: line 459 begins `ka = function(Q, c) {` which is the start of
// download-manager.js (covered separately).
// ---------------------------------------------------------------------------
