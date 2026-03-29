/**
 * Entity Sync — Persistent Entity Store integration, entity lifecycle
 *
 * Source: player_es6.vflset/en_US/offline.js, lines 4–190
 * Deobfuscated from the `(function(g) { ... })(_yt_player)` IIFE.
 *
 * Covers entity CRUD against the IndexedDB-backed Entity Store,
 * mutation batching, cache management, and media cleanup.
 */

import { filterAndSortFormats } from '../../data/bandwidth-tracker.js'; // was: as
import { shouldUseDesktopControls } from '../../data/bandwidth-tracker.js'; // was: tx
import { encodeEntity, replaceAssociations } from '../../proto/varint-decoder.js';
import { isDownloadComplete, setLocalVolumeMap } from '../../media/format-mappings.js';
import { openStoreKeyCursor, advanceKeyCursor } from '../../data/idb-transactions.js';
import {
  PromiseAll, // was: g.P8 (custom promise wrapper)
  replaceEntity, // was: g.WI
  deleteEntityByKey, // was: g.mh
  readEntity, // was: g.Yf
  deleteEntityNotifications, // was: g.QJ
  notifyEntityChange, // was: g.cI
  iterateCursor, // was: g.cF
  advanceCursor, // was: g.Qb
  openTransaction, // was: g.Kr
  getEncryptionKey, // was: g.R8
  mergeProto, // was: g.Pu
  encryptEntity, // was: g.MaO
  updateEntityIndices, // was: g.Y7X
  checkFeatureFlag, // was: g.P
  getEntityPayloadType, // was: g.bD
  ExtensionKey, // was: g.Y
  lookupExtension, // was: g.l
  globalEntityBatchDispatch, // was: g.ib
  getEntityStore, // was: g.Iz
  getMediaDatabase, // was: g.AD
  openMediaTransaction, // was: g.T3
  openMultiStoreTransaction, // was: g.MD
  iterateAll, // was: g.pg
  iterateAndCount, // was: g.acW
  advanceCursorAll, // was: g.L43
  parseFormats, // was: g.Y53
  MEDIA_KEY_REGEX, // was: g.Wdy
  getMediaInventory, // was: g.W4
  setMediaInventory, // was: g.MKn
  setMediaStatus, // was: g.Kl
  getAllCaptions, // was: g.pIx
  errorWithCode, // was: g.$s
  logError, // was: g.Ty
  ErrorInfo, // was: g.H8
} from '../../core/';

// ──────────────────────────────────────────────────────────────────
// Entity-level operations
// ──────────────────────────────────────────────────────────────────

/**
 * Deletes multiple entities from the EntityStore by key.
 * [was: aj]
 * Source lines: 4–7
 *
 * @param {IDBTransaction} transaction - The open IDB transaction wrapper
 * @param {string[]} entityKeys - Keys to delete
 * @param {string} entityType - The entity type name
 * @returns {Promise<void[]>}
 */
export function deleteEntities(transaction, entityKeys, entityType) { // was: aj
  const promises = entityKeys.map((key) => WI(transaction, key, entityType)); // was: g.WI used for put; mh for delete. Note: original uses WI here which is actually replaceEntity — the function is used in a delete context by passing keys to the upsert path. See source lines 5-6.
  return P8.all(promises);
}

/**
 * Clears all entities of a given type from the EntityStore.
 * [was: GI]
 * Source lines: 8–16
 *
 * @param {IDBTransaction} transaction
 * @param {string} entityType
 * @returns {Promise<void>}
 */
export function clearEntityType(transaction, entityType) { // was: GI
  return cF(
    transaction.W.objectStore("EntityStore").index("entityType"),
    { query: IDBKeyRange.only(entityType) },
    (cursor) =>
      P8.all([cursor.delete(), QJ(transaction, cursor.cursor.primaryKey)]).then(() => {
        cI(transaction, cursor.cursor.primaryKey, entityType);
        return Qb(cursor);
      })
  );
}

/**
 * Upserts an entity: merges the incoming data with the existing record
 * (if any), encrypts, and writes it back to the store.
 * [was: YSa]
 * Source lines: 17–36
 *
 * @param {IDBTransaction} transaction
 * @param {string} entityKey
 * @param {Object} newData - The partial entity payload to merge
 * @param {string} entityType
 * @returns {Promise<string>} The entity key that was written
 */
export function upsertEntity(transaction, entityKey, newData, entityType) { // was: YSa
  const encryptionKey = R8(transaction.O, 1);
  return Yf(transaction, entityKey, entityType).then((existing) => {
    if (existing || P("web_enable_entity_upsert_on_update")) {
      const merged = Pu(existing || {}, newData);
      const record = {
        key: entityKey,
        entityType,
        data: encodeEntity(encryptionKey, merged, entityKey),
        version: 1,
      };
      return P8.all([
        transaction.W.objectStore("EntityStore").put(record),
        replaceAssociations(transaction, merged, entityType),
      ]);
    }
  }).then(() => {
    cI(transaction, entityKey, entityType);
    return entityKey;
  });
}

/**
 * Deletes orchestration action wrapper entities from the store.
 * [was: pki]
 * Source lines: 37–42
 *
 * @param {Object} entityStore - The Persistent Entity Store handle
 * @param {Object[]} actionWrappers - Array of action wrapper entities to delete
 * @returns {Promise<void[]>}
 */
export function deleteOrchestrationActions(entityStore, actionWrappers) { // was: pki
  return Kr(entityStore, { mode: "readwrite", g3: true }, (shouldUseDesktopControls) =>
    deleteEntities(shouldUseDesktopControls, actionWrappers, "offlineOrchestrationActionWrapperEntity")
  );
}

/**
 * Clears all videoPlaybackPositionEntity records.
 * [was: Qka]
 * Source lines: 43–48
 */
export function clearAllPlaybackPositions(entityStore) { // was: Qka
  return Kr(entityStore, { mode: "readwrite", g3: true }, (shouldUseDesktopControls) =>
    clearEntityType(shouldUseDesktopControls, "videoPlaybackPositionEntity")
  );
}

/**
 * Reads a single entity from the store (read-only transaction).
 * [was: $a]
 * Source lines: 49–54
 */
export function readEntityByKey(entityStore, entityKey, entityType) { // was: $a
  return Kr(entityStore, { mode: "readonly", g3: true }, (shouldUseDesktopControls) =>
    Yf(shouldUseDesktopControls, entityKey, entityType)
  );
}

// ──────────────────────────────────────────────────────────────────
// Entity mutation batching
// ──────────────────────────────────────────────────────────────────

/**
 * Checks if a mutation should be persisted to IndexedDB.
 * [was: KgD]
 * Source lines: 93–96
 */
function shouldPersistMutation(mutation) { // was: KgD
  const opt = mutation.options?.persistenceOption;
  return opt === "ENTITY_PERSISTENCE_OPTION_PERSIST" || opt === "ENTITY_PERSISTENCE_OPTION_INMEMORY_AND_PERSIST";
}

/**
 * Creates a minimal action message for the entity batch dispatcher.
 * [was: mNZ]
 * Source lines: 82–88
 */
function createActionMessage({ type, payload }) { // was: mNZ
  const msg = { type };
  if (payload !== undefined) msg.payload = payload;
  return msg;
}

/**
 * Persists a batch of entity mutations to IndexedDB.
 * Handles REPLACE, DELETE, and UPDATE mutation types.
 * [was: Tsm]
 * Source lines: 97–114
 *
 * @param {Object[]} mutations - Array of entity mutations
 */
export async function persistEntityMutations(mutations) { // was: Tsm
  const entityStore = await Iz();
  if (!entityStore) return;

  await Kr(entityStore, "readwrite", (shouldUseDesktopControls) => {
    const pendingOps = {};
    for (const mutation of mutations) {
      if (!mutation.entityKey || !shouldPersistMutation(mutation)) continue;
      const payloadType = bD(mutation.payload);
      let operation;

      if (mutation.type === "ENTITY_MUTATION_TYPE_REPLACE") {
        operation = () => WI(shouldUseDesktopControls, mutation.payload[payloadType], payloadType);
      }
      if (mutation.type === "ENTITY_MUTATION_TYPE_DELETE") {
        operation = () => mh(shouldUseDesktopControls, mutation.entityKey);
      }
      if (mutation.type === "ENTITY_MUTATION_TYPE_UPDATE") {
        operation = () => upsertEntity(shouldUseDesktopControls, mutation.entityKey, mutation.payload[payloadType], payloadType);
      }

      if (operation) {
        pendingOps[mutation.entityKey] = pendingOps[mutation.entityKey]
          ? pendingOps[mutation.entityKey].then(operation)
          : operation();
      }
    }
    return P8.all(Object.values(pendingOps));
  });
}

/**
 * Dispatches entity mutations to the global store and persists them.
 * Clears the input array after processing.
 * [was: lT]
 * Source lines: 115–122
 *
 * @param {Object} batchUpdate - Object containing `.mutations` array
 */
export async function dispatchAndPersistMutations(batchUpdate) { // was: lT
  const mutations = batchUpdate?.mutations;
  if (!mutations || mutations.length <= 0) return;

  if (ib) {
    ib.dispatch(createActionMessage({ type: "ENTITY_LOADED", payload: mutations }));
  }
  await persistEntityMutations(mutations);
  mutations.length = 0;
}

// ──────────────────────────────────────────────────────────────────
// Media database cleanup
// ──────────────────────────────────────────────────────────────────

/**
 * Deletes all media (index, media, captions) for a given video ID.
 * [was: UNi]
 * Source lines: 138–150
 */
export async function deleteMediaForVideo(videoId) { // was: UNi
  const dbHandle = await AD();
  if (!dbHandle) return undefined;

  const EventHandler = await T3(dbHandle);
  return MD(EventHandler, ["index", "media", "captions"], { mode: "readwrite", g3: true }, (shouldUseDesktopControls) => {
    const range = IDBKeyRange.bound(videoId + "|", videoId + "~");
    const ops = [
      shouldUseDesktopControls.objectStore("index").delete(range),
      shouldUseDesktopControls.objectStore("media").delete(range),
      shouldUseDesktopControls.objectStore("captions").delete(range),
    ];
    return P8.all(ops).then(() => {});
  });
}

/**
 * Validates all stored media against their index entries and cleans up
 * orphaned blobs. Returns the reconciled media inventory map.
 * [was: I9W]
 * Source lines: 151–190
 *
 * @returns {Promise<Object>} Reconciled inventory keyed by video ID
 */
export async function reconcileMediaInventory() { // was: I9W
  const dbHandle = await AD();
  if (!dbHandle) throw $s("rvdfd");

  return MD(await T3(dbHandle), ["index", "media"], { mode: "readwrite", g3: true }, (shouldUseDesktopControls) => {
    const videoIndex = {};

    return pg(shouldUseDesktopControls.objectStore("index"), {}, (cursor) => {
      const match = cursor.cursor.key.match(/^([\w\-_]+)\|(a|v)$/);
      let deletePromise = P8.resolve(undefined);

      if (match) {
        const videoId = match[1];
        const streamType = match[2]; // 'a' = audio, 'v' = video
        videoIndex[videoId] = videoIndex[videoId] || {};
        videoIndex[videoId][streamType] = isDownloadComplete(cursor.getValue()?.fmts);
      } else {
        deletePromise = cursor.delete().then(() => {});
      }

      return P8.all([Qb(cursor), deletePromise]).then(([next]) => next);
    }).then(() => {
      // Build status map: 1 = has both audio+video, 2 = missing one
      const statusMap = {};
      for (const videoId of Object.keys(videoIndex)) {
        const hasVideo = videoIndex[videoId].v;
        statusMap[videoId] = videoIndex[videoId].a && hasVideo ? 1 : 2;
      }

      const reconciledInventory = reconcileInventoryMap(statusMap); // was: rFm

      // Remove orphaned media blobs
      return openStoreKeyCursor(shouldUseDesktopControls.objectStore("media"), {}, (cursor) => {
        const blobMatch = cursor.cursor.key.match(Wdy);
        if (!(blobMatch && statusMap[blobMatch[1]])) {
          shouldUseDesktopControls.objectStore("media").delete(cursor.cursor.key);
        }
        return advanceKeyCursor(cursor);
      }).then(() => reconciledInventory);
    });
  });
}

// ──────────────────────────────────────────────────────────────────
// Inventory reconciliation
// ──────────────────────────────────────────────────────────────────

/**
 * Merges a discovered media status map with the global inventory,
 * marking missing entries and preserving finalized ones.
 * [was: rFm]
 * Source lines: 126–137
 *
 * @param {Object} discoveredStatus - Map of videoId -> status code
 * @returns {Object} Merged inventory
 */
function reconcileInventoryMap(discoveredStatus) { // was: rFm
  let currentInventory = W4();
  currentInventory = Object.assign({}, currentInventory);
  discoveredStatus = Object.assign({}, discoveredStatus);

  for (const key in currentInventory) {
    if (discoveredStatus[key]) {
      if (currentInventory[key] !== 4) {
        currentInventory[key] = discoveredStatus[key];
      }
      delete discoveredStatus[key];
    } else if (currentInventory[key] !== 2) {
      currentInventory[key] = 4; // Mark as missing
    }
  }
  Object.assign(currentInventory, discoveredStatus);
  setLocalVolumeMap(currentInventory);
  JSON.stringify(currentInventory); // side-effect: validates serialization
  return currentInventory;
}

// ──────────────────────────────────────────────────────────────────
// Caption storage
// ──────────────────────────────────────────────────────────────────

/**
 * Writes caption tracks to the captions object store.
 * [was: Xha]
 * Source lines: 191–209
 */
export async function writeCaptions(videoId, captionTracks) { // was: Xha
  const dbHandle = await AD();
  if (!dbHandle) throw $s("wct");

  const EventHandler = await T3(dbHandle);
  await MD(EventHandler, ["captions"], { mode: "readwrite", g3: true }, (shouldUseDesktopControls) => {
    const ops = [];
    const store = shouldUseDesktopControls.objectStore("captions");
    for (let i = 0; i < captionTracks.length; i++) {
      const op = store.put(captionTracks[i], videoId + "|" + captionTracks[i].metadata.vss_id);
      ops.push(op);
    }
    return P8.all(ops);
  });
}

/**
 * Reads all caption tracks for a video from the captions store.
 * [was: AF9]
 * Source lines: 210–216
 */
export async function readCaptions(videoId) { // was: AF9
  const range = IDBKeyRange.bound(videoId + "|", videoId + "~");
  const dbHandle = await AD();
  if (!dbHandle) throw $s("gactfv");
  return (await T3(dbHandle)).getAll("captions", range);
}

/**
 * Deletes media and resets the download status for a video.
 * [was: eJi]
 * Source lines: 217–220
 */
export async function deleteMediaAndResetStatus(videoId) { // was: eJi
  Kl(videoId, 0);
  return deleteMediaForVideo(videoId);
}

// ──────────────────────────────────────────────────────────────────
// Extension keys for entity metadata
// ──────────────────────────────────────────────────────────────────

/** @type {ExtensionKey} [was: P_H] */
export const elementsCommandKey = new Y("elementsCommand"); // was: P_H

/** @type {ExtensionKey} [was: HQ] */
export const entityBatchUpdateKey = new Y("entityBatchUpdate"); // was: HQ

/** @type {ExtensionKey} [was: g84] */
export const downloadStatusEntityKey = new Y("downloadStatusEntity"); // was: g84

/** @type {ExtensionKey} [was: F_4] */
export const mainPlaylistEntityActionMetadataKey = new Y("mainPlaylistEntityActionMetadata"); // was: F_4

/** @type {ExtensionKey} [was: QE] */
export const mainVideoEntityActionMetadataKey = new Y("mainVideoEntityActionMetadata"); // was: QE

/** @type {ExtensionKey} [was: YJa] */
export const musicPlaylistEntityActionMetadataKey = new Y("musicPlaylistEntityActionMetadata"); // was: YJa

/** @type {ExtensionKey} [was: m2] */
export const musicTrackEntityActionMetadataKey = new Y("musicTrackEntityActionMetadata"); // was: m2

/** @type {ExtensionKey} [was: l99] */
export const offlineOrchestrationActionCommandKey = new Y("offlineOrchestrationActionCommand"); // was: l99

/** @type {ExtensionKey} [was: aLa] */
export const localImageEntityActionMetadataKey = new Y("localImageEntityActionMetadata"); // was: aLa

/** @type {ExtensionKey} [was: js] */
export const playbackDataActionMetadataKey = new Y("playbackDataActionMetadata"); // was: js

/** @type {ExtensionKey} [was: Lbv] */
export const transferEntityActionMetadataKey = new Y("transferEntityActionMetadata"); // was: Lbv

/** @type {ExtensionKey} [was: H4m] */
export const videoPlaybackPositionEntityActionMetadataKey = new Y("videoPlaybackPositionEntityActionMetadata"); // was: H4m

// ──────────────────────────────────────────────────────────────────
// Entity type lists (used for bulk cleanup)
// ──────────────────────────────────────────────────────────────────

/**
 * All entity types used by the main YouTube offline system.
 * [was: Gd9]
 * Source line: 3770
 */
export const MAIN_ENTITY_TYPES = [ // was: Gd9
  "captionTrack",
  "downloadStatusEntity",
  "ytMainChannelEntity",
  "mainPlaylistEntity",
  "mainPlaylistDownloadStateEntity",
  "mainPlaylistVideoEntity",
  "mainVideoEntity",
  "mainVideoDownloadStateEntity",
  "offlineVideoPolicy",
  "offlineVideoStreams",
  "playbackData",
  "transfer",
  "videoDownloadContextEntity",
  "videoPlaybackPositionEntity",
];

/**
 * All entity types used by the YouTube Music offline system.
 * [was: JF9]
 * Source line: 3771
 */
export const MUSIC_ENTITY_TYPES = [ // was: JF9
  "downloadStatusEntity",
  "musicAlbumRelease",
  "musicDownloadsLibraryEntity",
  "musicPlaylist",
  "musicTrack",
  "musicTrackDownloadMetadataEntity",
  "offlineVideoPolicy",
  "offlineVideoStreams",
  "playbackData",
  "transfer",
  "videoDownloadContextEntity",
];

// ──────────────────────────────────────────────────────────────────
// Logging helper
// ──────────────────────────────────────────────────────────────────

/**
 * Logs a Woffle (offline framework) warning/error.
 * [was: Rj]
 * Source lines: 449–454
 */
export function logWoffleError(message, error, cotn) { // was: Rj
  Ty(new H8(`Woffle: ${message}`, cotn ? { cotn } : ""));
  if (error instanceof Error) Ty(error);
}
