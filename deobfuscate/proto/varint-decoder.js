/**
 * Protobuf Varint / Field Decoder — continuation
 *
 * Varint reading, wire-format field seeking, typed field extraction,
 * protobuf encoder helpers (buffer growth, varint/field/message writing),
 * entity key serialization, entity store (IndexedDB), AES-128 CTR cipher,
 * SHA-256 HMAC, entity persistence, and cinematics / XMLHttpRequest checks.
 *
 * Source: base.js lines 19073–19930
 * [was: Vu, Bl, xf, qB, no, Dq, t0, Hl, NB, iX, Nm7, g.yu, SB, Fu,
 *  Zq, EK, sK, yGW, S7n, d1, Lo, g.w1, g.bX, jB, g1, ERm, sF_, OK,
 *  dHn, LZ7, vl, wO3, zh, bW3, jF_, gR7, OW7, vRO, a4n, $H7, l4n,
 *  uhK, hwO, zw_, CsW, g.MaO, J0, RwX, kf, g.Yf, g.po, g.Y7X, g.cI,
 *  g.WI, QY_, g.mh, g.QJ, czw, k$7, pOX, g.R8, WNd, g.Kr, g.TA,
 *  g.oz, KN7, g.rx, g.Iz, TVK, IE_, XJy]
 */

// TODO: resolve g.rU (isWorker flag — not yet exported from any module)

import { decodeUTF8 } from "../core/utf8.js"; // was: g.o8
import { getExperimentBoolean } from "../core/composition-helpers.js"; // was: g.P
import { firstKey } from "../core/object-utils.js"; // was: g.bD
import { globalRef } from "../core/polyfills.js"; // was: g.qX
import { getPlayerConfig } from "../core/attestation.js"; // was: g.pm
import { reportErrorWithLevel, reportWarning } from "../data/gel-params.js"; // was: g.Zf, g.Ty
import { deepMerge } from "../data/collection-utils.js"; // was: g.Pu
import {
import { createTimeRanges } from '../media/codec-helpers.js'; // was: lo
import { encodeUTF8Into } from '../core/utf8.js'; // was: UK
import { JSON_ESCAPE_MAP } from '../data/event-logging.js'; // was: O_
import { encodeUTF8 } from '../core/utf8.js'; // was: I8
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { createIndex } from '../data/idb-transactions.js'; // was: ks
import { createObjectStore } from '../data/idb-transactions.js'; // was: JN
import { userSkipAd } from '../ads/dai-cue-range.js'; // was: s1
import { PubSubTopic } from '../data/gel-core.js'; // was: s3
import { getBgeServiceWorkerKey } from '../network/uri-utils.js'; // was: t1
import { readStringField } from './varint-decoder.js'; // was: t0
import { hasDatasyncId } from '../core/attestation.js'; // was: tN
import { readByte, copyBytes } from '../data/collection-utils.js';
import { PlayerError } from '../ui/cue-manager.js';
import { openWithToken, runTransaction, getIdbToken } from '../data/idb-transactions.js';
  IdbPromise,
  openWithToken,
  runTransaction,
  getIdbToken,
} from "../data/idb-transactions.js"; // was: g.P8, g.m7, g.MD, g.AD

// ===================================================================
// Varint reading
// ===================================================================

/**
 * Read a varint from the proto cursor.
 * Returns the decoded unsigned integer and advances `cursor.pos`.
 * [was: Vu]
 *
 * @param {object} cursor - Proto cursor with `.W` (byte source) and `.pos`
 * @returns {number}
 */
export function readVarint(cursor) { // was: Vu
  let byte = readByte(cursor.W, cursor.pos); // was: Wl
  ++cursor.pos;
  if (byte < 128) return byte;

  let result = byte & 127; // was: W
  let multiplier = 1;      // was: m
  for (; byte >= 128;) {
    byte = readByte(cursor.W, cursor.pos);
    ++cursor.pos;
    multiplier *= 128;
    result += (byte & 127) * multiplier;
  }
  return result;
}

// ===================================================================
// Field seeking / wire-format parsing
// ===================================================================

/**
 * Seek to a field with the given field number in the proto cursor.
 * Skips fields with smaller numbers; returns `true` if found.
 * [was: Bl]
 *
 * @param {object} cursor - Proto cursor
 * @param {number} fieldNumber [was: c]
 * @returns {boolean}
 */
export function seekToField(cursor, fieldNumber) { // was: Bl
  let tag = cursor.O; // was: W — cached pending tag
  for (cursor.O = -1; cursor.pos + 1 <= cursor.W.totalLength;) {
    if (tag < 0) tag = readVarint(cursor);

    const currentFieldNumber = tag >> 3;  // was: m
    const wireType = tag & 7;             // was: K

    if (currentFieldNumber === fieldNumber) return true;
    if (currentFieldNumber > fieldNumber) {
      cursor.O = tag;
      break;
    }

    tag = -1;
    switch (wireType) {
      case 0: // Varint
        readVarint(cursor);
        break;
      case 1: // Fixed64
        cursor.pos += 8;
        break;
      case 2: // Length-delimited
        {
          const length = readVarint(cursor);
          cursor.pos += length;
        }
        break;
      case 5: // Fixed32
        cursor.pos += 4;
    }
  }
  return false;
}

/**
 * Read a varint field value if the given field number exists.
 * [was: xf]
 *
 * @param {object} cursor
 * @param {number} fieldNumber
 * @returns {number|undefined}
 */
export function readVarintField(cursor, fieldNumber) { // was: xf
  if (seekToField(cursor, fieldNumber)) return readVarint(cursor);
}

/**
 * Read a fixed-64 double field if the given field number exists.
 * [was: qB]
 *
 * @param {object} cursor
 * @param {number} fieldNumber
 * @returns {number|undefined}
 */
export function readDoubleField(cursor, fieldNumber) { // was: qB
  if (seekToField(cursor, fieldNumber)) {
    const bytes = copyBytes(cursor.W, cursor.pos, 8); // was: Cp
    cursor.pos += 8;
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      .getFloat64(0, true);
  }
}

/**
 * Read a boolean field (varint interpreted as bool).
 * [was: no]
 *
 * @param {object} cursor
 * @param {number} fieldNumber
 * @returns {boolean|undefined}
 */
export function readBoolField(cursor, fieldNumber) { // was: no
  if (seekToField(cursor, fieldNumber)) return !!readVarint(cursor);
}

/**
 * Read a length-delimited (bytes) field.
 * [was: Dq]
 *
 * @param {object} cursor
 * @param {number} fieldNumber
 * @returns {Uint8Array|undefined}
 */
export function readBytesField(cursor, fieldNumber) { // was: Dq
  if (seekToField(cursor, fieldNumber)) {
    const length = readVarint(cursor);
    const data = copyBytes(cursor.W, cursor.pos, length); // was: Cp
    cursor.pos += length;
    return data;
  }
}

/**
 * Read a string field (UTF-8 decoded).
 * [was: t0]
 *
 * @param {object} cursor
 * @param {number} fieldNumber
 * @returns {string|undefined}
 */
export function readStringField(cursor, fieldNumber) { // was: t0
  const bytes = readBytesField(cursor, fieldNumber);
  if (bytes) return decodeUTF8(bytes);
}

/**
 * Read a nested message field, decoded via the provided parser function.
 * [was: Hl]
 *
 * @param {object} cursor
 * @param {number} fieldNumber
 * @param {Function} parser - e.g. `(cursor) => parseMyMessage(cursor)`
 * @returns {*|undefined}
 */
export function readMessageField(cursor, fieldNumber, parser) { // was: Hl
  const bytes = readBytesField(cursor, fieldNumber);
  if (bytes) return parser(new SlotSignalMetadata(new ChunkedByteBuffer([bytes]))); // A0 = ProtoCursor, Xu = ByteSource
}

/**
 * Read all repeated varint fields with the given number.
 * [was: NB]
 *
 * @param {object} cursor
 * @param {number} fieldNumber
 * @returns {number[]|undefined}
 */
export function readRepeatedVarintField(cursor, fieldNumber) { // was: NB
  const values = [];
  for (; seekToField(cursor, fieldNumber);) {
    values.push(readVarint(cursor));
  }
  return values.length ? values : undefined;
}

/**
 * Read all repeated message fields, each decoded via `parser`.
 * [was: iX]
 *
 * @param {object} cursor
 * @param {number} fieldNumber
 * @param {Function} parser
 * @returns {Array|undefined}
 */
export function readRepeatedMessageField(cursor, fieldNumber, parser) { // was: iX
  const results = [];
  let bytes;
  for (; (bytes = readBytesField(cursor, fieldNumber));) {
    results.push(parser(new SlotSignalMetadata(new ChunkedByteBuffer([bytes]))));
  }
  return results.length ? results : undefined;
}

// ===================================================================
// Encoder buffer helpers
// ===================================================================

/**
 * Allocate a new Uint8Array of size `size`, optionally pre-filling
 * with the contents of `existing`.
 * [was: Nm7]
 *
 * @param {number} size
 * @param {Uint8Array} [existing]
 * @returns {Uint8Array}
 */
export function allocateBuffer(size, existing) { // was: Nm7
  const buf = new Uint8Array(size);
  if (existing) buf.set(existing);
  return buf;
}

/**
 * Serialize a protobuf message via the given writer callback.
 * Returns a Uint8Array containing the encoded bytes.
 * [was: g.yu]
 *
 * @param {*} message
 * @param {Function} writerCallback - `(encoder, message) => void`
 * @returns {Uint8Array}
 */
export function serializeMessage(message, writerCallback) { // was: g.yu
  const encoder = new iWm(4096); // iWm = ProtoEncoder
  writerCallback(encoder, message);
  return new Uint8Array(encoder.W.buffer, encoder.W.byteOffset, encoder.pos);
}

/**
 * Ensure the encoder buffer can hold `additionalBytes` more bytes.
 * Grows the backing Uint8Array by doubling until sufficient.
 * [was: SB]
 *
 * @param {object} encoder
 * @param {number} additionalBytes
 */
export function ensureCapacity(encoder, additionalBytes) { // was: SB
  const required = encoder.pos + additionalBytes;
  if (encoder.W.length >= required) return;

  let newSize = encoder.W.length * 2;
  while (newSize < required) newSize *= 2;

  encoder.W = allocateBuffer(newSize, encoder.W.subarray(0, encoder.pos));
  encoder.view = new DataView(encoder.W.buffer, encoder.W.byteOffset, encoder.W.byteLength);
}

/**
 * Write a varint to the encoder.
 * [was: Fu]
 *
 * @param {object} encoder
 * @param {number} value
 */
export function writeVarint(encoder, value) { // was: Fu
  if (value > 268435455) {
    ensureCapacity(encoder, 4);
    let createTimeRanges = value & 1073741823;
    for (let i = 0; i < 4; i++) {
      encoder.view.setUint8(encoder.pos, (createTimeRanges & 127) | 128);
      createTimeRanges >>= 7;
      encoder.pos += 1;
    }
    value = Math.floor(value / 268435456);
  }
  for (ensureCapacity(encoder, 4); value > 127;) {
    encoder.view.setUint8(encoder.pos, (value & 127) | 128);
    value >>= 7;
    encoder.pos += 1;
  }
  encoder.view.setUint8(encoder.pos, value);
  encoder.pos += 1;
}

/**
 * Write a varint field (tag + value). Skipped when `value` is `undefined`.
 * [was: Zq]
 *
 * @param {object} encoder
 * @param {number} fieldNumber
 * @param {number|undefined} value
 */
export function writeVarintField(encoder, fieldNumber, value) { // was: Zq
  if (value !== undefined) {
    writeVarint(encoder, fieldNumber * 8);
    writeVarint(encoder, value);
  }
}

/**
 * Write a boolean field. Skipped when `value` is `undefined`.
 * [was: EK]
 *
 * @param {object} encoder
 * @param {number} fieldNumber
 * @param {boolean|undefined} value
 */
export function writeBoolField(encoder, fieldNumber, value) { // was: EK
  if (value !== undefined) writeVarintField(encoder, fieldNumber, value ? 1 : 0);
}

/**
 * Write a bytes/string field (wire type 2). Skipped when `value` is `undefined`.
 * [was: sK]
 *
 * @param {object} encoder
 * @param {number} fieldNumber
 * @param {Uint8Array|undefined} value
 */
export function writeBytesField(encoder, fieldNumber, value) { // was: sK
  if (value !== undefined) {
    writeVarint(encoder, fieldNumber * 8 + 2);
    const length = value.length;
    writeVarint(encoder, length);
    ensureCapacity(encoder, length);
    encoder.W.set(value, encoder.pos);
    encoder.pos += length;
  }
}

/**
 * Begin a length-delimited (sub-message) field. Reserves `reservedBytes`
 * for the length prefix.
 * [was: yGW]
 *
 * @param {object} encoder
 * @param {number} fieldNumber
 * @param {number} [reservedBytes=2]
 */
export function beginLengthDelimited(encoder, fieldNumber, reservedBytes = 2) { // was: yGW
  writeVarint(encoder, fieldNumber * 8 + 2);
  encoder.O.push(encoder.pos);
  encoder.O.push(reservedBytes);
  encoder.pos += reservedBytes;
}

/**
 * End a length-delimited field started by `beginLengthDelimited`.
 * Back-patches the length prefix.
 * [was: S7n]
 *
 * @param {object} encoder
 */
export function endLengthDelimited(encoder) { // was: S7n
  let reservedBytes = encoder.O.pop();
  let startPos = encoder.O.pop();
  let bodyLength = encoder.pos - startPos - reservedBytes;

  for (; reservedBytes--;) {
    const continuationBit = reservedBytes ? 128 : 0;
    encoder.view.setUint8(startPos++, (bodyLength & 127) | continuationBit);
    bodyLength >>= 7;
  }
}

/**
 * Write a string field (UTF-8 encoded). Skipped when `value` is `undefined`.
 * [was: d1]
 *
 * @param {object} encoder
 * @param {number} fieldNumber
 * @param {string|undefined} value
 */
export function writeStringField(encoder, fieldNumber, value) { // was: d1
  if (value !== undefined) {
    beginLengthDelimited(encoder, fieldNumber, Math.ceil(Math.log2(value.length * 4 + 2) / 7));
    ensureCapacity(encoder, value.length * 1.2);
    let written = encodeUTF8Into(value, encoder.W.subarray(encoder.pos)); // UK = utf8Encode
    if (encoder.pos + written > encoder.W.length) {
      ensureCapacity(encoder, written);
      written = encodeUTF8Into(value, encoder.W.subarray(encoder.pos));
    }
    encoder.pos += written;
    endLengthDelimited(encoder);
  }
}

/**
 * Write a sub-message field. Skipped when `message` is falsy.
 * [was: Lo]
 *
 * @param {object} encoder
 * @param {number} fieldNumber
 * @param {*} message
 * @param {Function} writerCallback
 * @param {number} [reservedBytes=3]
 */
export function writeMessageField(encoder, fieldNumber, message, writerCallback, reservedBytes = 3) { // was: Lo
  if (message) {
    beginLengthDelimited(encoder, fieldNumber, reservedBytes);
    writerCallback(encoder, message);
    endLengthDelimited(encoder);
  }
}

// ===================================================================
// Entity key helpers
// ===================================================================

/**
 * Deserialize an entity key from a URI-encoded string.
 * Returns `{ O_: fieldNumber, entityType, entityId }`.
 * [was: g.w1]
 *
 * @param {string} encoded
 * @returns {{ O_: number, entityType: string, entityId: string }}
 */
export function deserializeEntityKey(encoded) { // was: g.w1
  const cursor = new SlotSignalMetadata(new ChunkedByteBuffer([CN(decodeURIComponent(encoded))])); // CN = base64Decode
  const entityId = readStringField(cursor, 2);  // was: t0(c, 2)
  const fieldNumber = readVarintField(cursor, 4); // was: xf(c, 4)
  const entityType = FZR[fieldNumber]; // FZR = field-to-entity-type map

  if (typeof entityType === "undefined") {
    const error = new PlayerError("Failed to recognize field number", { 
      name: "EntityKeyHelperError",
      fieldNumber,
    });
    reportErrorWithLevel(error);
    throw error;
  }

  return {
    JSON_ESCAPE_MAP: fieldNumber,
    entityType,
    entityId,
  };
}

/**
 * Serialize an entity key to a URI-encoded string.
 * [was: g.bX]
 *
 * @param {string} entityId
 * @param {string} entityType
 * @returns {string}
 */
export function serializeEntityKey(entityId, entityType) { // was: g.bX
  const encoder = new iWm(); // iWm = ProtoEncoder
  writeBytesField(encoder, 2, encodeUTF8(entityId)); // I8 = utf8ToBytes

  const fieldNumber = ZWm[entityType]; // ZWm = entity-type-to-field map
  if (typeof fieldNumber === "undefined") {
    const error = new PlayerError("Failed to recognize entity type", { 
      name: "EntityKeyHelperError",
      entityType,
    });
    reportErrorWithLevel(error);
    throw error;
  }

  writeVarintField(encoder, 4, fieldNumber);
  writeVarintField(encoder, 5, 1);
  const bytes = new Uint8Array(encoder.W.buffer, encoder.W.byteOffset, encoder.pos);
  return encodeURIComponent(g.lj(bytes, 0));  (base64Encode)
}

/**
 * Extract entity key from an entity object (`key` or `id`).
 * [was: jB]
 *
 * @param {object} entity
 * @returns {string}
 */
export function getEntityKey(entity) { // was: jB
  const key = entity.key || entity.id;
  if (!key) throw Error("Entity key is missing");
  return key;
}

// ===================================================================
// Entity state management (Redux-like reducers)
// ===================================================================

/**
 * Set or delete an entity in the state map.
 * When `value` is `undefined`, removes the entry at `[bucket][key]`.
 * [was: g1]
 *
 * @param {object} state
 * @param {string} bucket
 * @param {string} key
 * @param {*} [value]
 * @returns {object} new state
 */
export function setEntity(state, bucket, key, value) { // was: g1
  if (value === undefined) {
    const { [key]: _removed, ...rest } = state[bucket] || {};
    return { ...state, [bucket]: rest };
  }
  return {
    ...state,
    [bucket]: {
      ...state[bucket],
      [key]: value,
    },
  };
}

/**
 * Deep-merge an update payload into an existing entity.
 * [was: ERm]
 *
 * @param {object} state
 * @param {string} bucket
 * @param {string} key
 * @param {object} payload
 * @param {string} [mergeOption]
 * @returns {object} new state
 */
export function mergeEntity(state, bucket, key, payload, mergeOption) { // was: ERm
  const bucketData = state[bucket] || {};
  const existing = bucketData[key];
  if (!existing && !getExperimentBoolean("web_enable_entity_upsert_on_update")) return state;

  const merged = deepMerge(
    existing || {},
    payload,
    mergeOption === "REPEATED_FIELDS_MERGE_OPTION_APPEND"
  );
  return {
    ...state,
    [bucket]: {
      ...bucketData,
      [key]: merged,
    },
  };
}

/**
 * Root entity reducer — handles ENTITY_LOADED, REPLACE_ENTITY,
 * REPLACE_ENTITIES, UPDATE_ENTITY actions.
 * [was: sF_]
 *
 * @param {object} [state={}]
 * @param {object} action
 * @returns {object}
 */
export function entityReducer(state = {}, action) { // was: sF_
  switch (action.type) {
    case "ENTITY_LOADED":
      return action.payload.reduce((accum, mutation) => {
        const persistOpt = mutation.options?.persistenceOption;
        if (
          persistOpt &&
          persistOpt !== "ENTITY_PERSISTENCE_OPTION_UNKNOWN" &&
          persistOpt !== "ENTITY_PERSISTENCE_OPTION_INMEMORY_AND_PERSIST"
        )
          return accum;

        if (!mutation.entityKey) {
          reportErrorWithLevel(Error("Missing entity key"));
          return accum;
        }

        if (mutation.type === "ENTITY_MUTATION_TYPE_REPLACE") {
          if (!mutation.payload) {
            const err = new PlayerError("REPLACE entity mutation is missing a payload", { 
              entityKey: mutation.entityKey,
            });
            reportErrorWithLevel(err);
            return accum;
          }
          const bucket = firstKey(mutation.payload);
          return setEntity(accum, bucket, mutation.entityKey, mutation.payload[bucket]);
        }

        if (mutation.type === "ENTITY_MUTATION_TYPE_DELETE") {
          let result;
          try {
            const entityType = deserializeEntityKey(mutation.entityKey).entityType;
            result = setEntity(accum, entityType, mutation.entityKey);
          } catch (err) {
            if (err instanceof Error) {
              const wrapped = new PlayerError("Failed to deserialize entity key", { 
                entityKey: mutation.entityKey,
                originalMessage: err.message,
              });
              reportErrorWithLevel(wrapped);
              result = accum;
            } else {
              throw err;
            }
          }
          return result;
        }

        if (mutation.type === "ENTITY_MUTATION_TYPE_UPDATE") {
          if (!mutation.payload) {
            const err = new PlayerError("UPDATE entity mutation is missing a payload", { 
              entityKey: mutation.entityKey,
            });
            reportErrorWithLevel(err);
            return accum;
          }
          const bucket = firstKey(mutation.payload);
          return mergeEntity(
            accum,
            bucket,
            mutation.entityKey,
            mutation.payload[bucket],
            mutation.fieldMask?.mergeOptions?.repeatedFieldsMergeOption
          );
        }

        return accum;
      }, state);

    case "REPLACE_ENTITY":
      return setEntity(
        state,
        action.payload.entityType,
        action.payload.key,
        action.payload.zn
      );

    case "REPLACE_ENTITIES":
      return Object.keys(action.payload).reduce((accum, entityType) => {
        const entries = action.payload[entityType];
        return Object.keys(entries).reduce(
          (inner, key) => setEntity(inner, entityType, key, entries[key]),
          accum
        );
      }, state);

    case "UPDATE_ENTITY":
      return mergeEntity(
        state,
        action.payload.entityType,
        action.payload.key,
        action.payload.zn,
        action.payload.rQG
      );

    default:
      return state;
  }
}

/**
 * Look up an entity from state by bucket and key.
 * [was: OK]
 *
 * @param {object} state
 * @param {string} bucket
 * @param {string} key
 * @returns {*|null}
 */
export function lookupEntity(state, bucket, key) { // was: OK
  return state[bucket] ? state[bucket][key] || null : null;
}

// ===================================================================
// Persistent entity store (IndexedDB)
// ===================================================================

/**
 * Open or return the shared PersistentEntityStoreDb.
 * [was: dHn]
 *
 * @returns {Promise}
 */
export function openPersistentEntityStoreDb() { // was: dHn
  if (fo) return fo(); // fo = cached db promise factory
  fo = createDatabaseDefinition("PersistentEntityStoreDb", { // el = openIndexedDB
    ML: {
      EntityStore: { d0: 1 },
      EntityAssociationStore: { d0: 2 },
    },
    shared: false,
    upgrade(EventHandler, versionCheck) { // was: (Q, c)
      if (versionCheck(1)) {
        createIndex(
          createObjectStore(EventHandler, "EntityStore", { keyPath: "key" }), // JN = createObjectStore
          "entityType",
          "entityType"
        ); // ks = createIndex
      }
      if (versionCheck(2)) {
        const assocStore = createObjectStore(EventHandler, "EntityAssociationStore", {
          keyPath: ["parentEntityKey", "childEntityKey"],
        });
        createIndex(assocStore, "byParentEntityKey", "parentEntityKey");
        createIndex(assocStore, "byChildEntityKey", "childEntityKey");
      }
    },
    version: 3,
  });
  return fo();
}

/**
 * Run a transaction on the persistent entity store.
 * [was: LZ7]
 *
 * @param {string} token
 * @returns {Promise}
 */
export function transactEntityStore(token) { // was: LZ7
  return openWithToken(openPersistentEntityStoreDb(), token);
}

// ===================================================================
// Int32Array helper
// ===================================================================

/**
 * Create an Int32Array of the given length, falling back to a plain Array.
 * [was: vl]
 *
 * @param {number} length
 * @returns {Int32Array|Array}
 */
export function createInt32Array(length) { // was: vl
  return window.Int32Array ? new Int32Array(length) : Array(length);
}

// ===================================================================
// AES-128 block cipher (software fallback)
// ===================================================================

/**
 * AES-128 CTR block encryption (software path).
 * Increments the counter and XORs the block into `Q.O`.
 * [was: wO3]
 *
 * @param {object} cipherState - `{ key, counter, O }`
 */
export function aesEncryptBlock(cipherState) { // was: wO3
  const key = cipherState.key;
  let s0 = cipherState.counter[0] ^ key[0];
  let userSkipAd = cipherState.counter[1] ^ key[1];
  let s2 = cipherState.counter[2] ^ key[2];
  let PubSubTopic = cipherState.counter[3] ^ key[3];

  // Increment 128-bit counter (big-endian)
  for (let i = 3; i >= 0 && !(cipherState.counter[i] = -~cipherState.counter[i]); i--);

  let readStringField, getBgeServiceWorkerKey, roundKeyIdx = 4;

  // 9 main rounds (AES-128)
  while (roundKeyIdx < 40) {
    readStringField = a8[s0 >>> 24] ^ Gh[(userSkipAd >> 16) & 255] ^ $f[(s2 >> 8) & 255] ^ Pl[PubSubTopic & 255] ^ key[roundKeyIdx++];
    getBgeServiceWorkerKey = a8[userSkipAd >>> 24] ^ Gh[(s2 >> 16) & 255] ^ $f[(PubSubTopic >> 8) & 255] ^ Pl[s0 & 255] ^ key[roundKeyIdx++];
    const t2 = a8[s2 >>> 24] ^ Gh[(PubSubTopic >> 16) & 255] ^ $f[(s0 >> 8) & 255] ^ Pl[userSkipAd & 255] ^ key[roundKeyIdx++];
    PubSubTopic = a8[PubSubTopic >>> 24] ^ Gh[(s0 >> 16) & 255] ^ $f[(userSkipAd >> 8) & 255] ^ Pl[s2 & 255] ^ key[roundKeyIdx++];
    s0 = readStringField;
    userSkipAd = getBgeServiceWorkerKey;
    s2 = t2;
  }

  // Final round (S-box only, no MixColumns)
  const out = cipherState.O;
  let rk = key[40];
  out[0]  = lX[s0 >>> 24]       ^ (rk >>> 24);
  out[1]  = lX[(userSkipAd >> 16) & 255] ^ ((rk >> 16) & 255);
  out[2]  = lX[(s2 >> 8) & 255]  ^ ((rk >> 8) & 255);
  out[3]  = lX[PubSubTopic & 255]         ^ (rk & 255);

  rk = key[41];
  out[4]  = lX[userSkipAd >>> 24]       ^ (rk >>> 24);
  out[5]  = lX[(s2 >> 16) & 255] ^ ((rk >> 16) & 255);
  out[6]  = lX[(PubSubTopic >> 8) & 255]  ^ ((rk >> 8) & 255);
  out[7]  = lX[s0 & 255]         ^ (rk & 255);

  rk = key[42];
  out[8]  = lX[s2 >>> 24]       ^ (rk >>> 24);
  out[9]  = lX[(PubSubTopic >> 16) & 255] ^ ((rk >> 16) & 255);
  out[10] = lX[(s0 >> 8) & 255]  ^ ((rk >> 8) & 255);
  out[11] = lX[userSkipAd & 255]         ^ (rk & 255);

  rk = key[43];
  out[12] = lX[PubSubTopic >>> 24]       ^ (rk >>> 24);
  out[13] = lX[(s0 >> 16) & 255] ^ ((rk >> 16) & 255);
  out[14] = lX[(userSkipAd >> 8) & 255]  ^ ((rk >> 8) & 255);
  out[15] = lX[s2 & 255]         ^ (rk & 255);
}

// ===================================================================
// Web Crypto API availability
// ===================================================================

/**
 * Return the WebCrypto SubtleCrypto instance if available, or `undefined`.
 * [was: zh]
 *
 * @returns {SubtleCrypto|undefined}
 */
export function getSubtleCrypto() { // was: zh
  if (!uX && !g.rU) { // uX = subtleCryptoFailed, TODO: resolve g.rU (isWorker)
    if (h0) return h0; // h0 = cached instance
    h0 = window.crypto?.subtle;
    if (h0?.importKey && h0?.sign && h0?.encrypt) return h0;
    h0 = undefined;
  }
}

/**
 * AES-CTR encrypt via WebCrypto.
 * [was: bW3]
 *
 * @param {object} cryptoState
 * @param {Uint8Array} data
 * @param {Uint8Array} counter
 * @returns {Promise<Uint8Array>}
 */
export async function aesCtrEncryptWebCrypto(cryptoState, data, counter) { // was: bW3
  if (!cryptoState.W) {
    cryptoState.W = await cryptoState.subtleCrypto.importKey(
      "raw",
      cryptoState.O,
      { name: "AES-CTR" },
      false,
      ["encrypt"]
    );
  }
  const result = await cryptoState.subtleCrypto.encrypt(
    { name: "AES-CTR", counter, length: 128 },
    cryptoState.W,
    data
  );
  return new Uint8Array(result);
}

// ===================================================================
// SHA-256 (software fallback)
// ===================================================================

/**
 * Reset the SHA-256 hash state to initial values.
 * [was: jF_]
 *
 * @param {object} hashState
 */
export function sha256Reset(hashState) { // was: jF_
  hashState.W = [
    1779033703, 3144134277, 1013904242, 2773480762,
    1359893119, 2600822924, 528734635, 1541459225,
  ];
  hashState.J = [];
  hashState.J.length = 64;
  hashState.j = 0;
  hashState.O = 0;
}

/**
 * Process a single 64-byte block of SHA-256.
 * [was: gR7]
 *
 * @param {object} hashState
 * @param {Uint8Array} data
 * @param {number} offset
 */
export function sha256ProcessBlock(hashState, data, offset) { // was: gR7
  const schedule = hashState.J; // was: m — message schedule
  let a = hashState.W[0], b = hashState.W[1], c = hashState.W[2], d = hashState.W[3];
  let e = hashState.W[4], f = hashState.W[5], g_ = hashState.W[6], h = hashState.W[7];
  let s0, userSkipAd, word;

  for (let i = 0; i < 64;) {
    // Unrolled: 4 rounds per iteration (matching original minified structure)
    if (i < 16) {
      schedule[i] = word = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
      offset += 4;
    } else {
      s0 = schedule[i - 2];
      userSkipAd = schedule[i - 15];
      word = schedule[i - 7] + schedule[i - 16]
        + (((s0 >>> 17) | (s0 << 15)) ^ ((s0 >>> 19) | (s0 << 13)) ^ (s0 >>> 10))
        + (((userSkipAd >>> 7) | (userSkipAd << 25)) ^ ((userSkipAd >>> 18) | (userSkipAd << 14)) ^ (userSkipAd >>> 3));
      schedule[i] = word;
    }

    const temp1 = h + Co[i] + word
      + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7)))
      + ((e & f) ^ (~e & g_));
    const temp2 = (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10)))
      + ((a & b) ^ (a & c) ^ (b & c));
    h = temp1 + temp2;
    d += temp1;
    i++;

    // (Remaining 3 sub-rounds follow the same structure — see original gR7 for the full
    //  4-way unroll. Abbreviated here for clarity; each round rotates a..h identically.)
    // Round 2
    if (i < 16) {
      schedule[i] = word = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
      offset += 4;
    } else {
      s0 = schedule[i - 2]; userSkipAd = schedule[i - 15];
      word = schedule[i - 7] + schedule[i - 16]
        + (((s0 >>> 17) | (s0 << 15)) ^ ((s0 >>> 19) | (s0 << 13)) ^ (s0 >>> 10))
        + (((userSkipAd >>> 7) | (userSkipAd << 25)) ^ ((userSkipAd >>> 18) | (userSkipAd << 14)) ^ (userSkipAd >>> 3));
      schedule[i] = word;
    }
    {
      const getBgeServiceWorkerKey = g_ + Co[i] + word
        + (((d >>> 6) | (d << 26)) ^ ((d >>> 11) | (d << 21)) ^ ((d >>> 25) | (d << 7)))
        + ((d & e) ^ (~d & f));
      const t2 = (((h >>> 2) | (h << 30)) ^ ((h >>> 13) | (h << 19)) ^ ((h >>> 22) | (h << 10)))
        + ((h & a) ^ (h & b) ^ (a & b));
      g_ = getBgeServiceWorkerKey + t2;
      c += getBgeServiceWorkerKey;
    }
    i++;

    // Round 3
    if (i < 16) {
      schedule[i] = word = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
      offset += 4;
    } else {
      s0 = schedule[i - 2]; userSkipAd = schedule[i - 15];
      word = schedule[i - 7] + schedule[i - 16]
        + (((s0 >>> 17) | (s0 << 15)) ^ ((s0 >>> 19) | (s0 << 13)) ^ (s0 >>> 10))
        + (((userSkipAd >>> 7) | (userSkipAd << 25)) ^ ((userSkipAd >>> 18) | (userSkipAd << 14)) ^ (userSkipAd >>> 3));
      schedule[i] = word;
    }
    {
      const getBgeServiceWorkerKey = f + Co[i] + word
        + (((c >>> 6) | (c << 26)) ^ ((c >>> 11) | (c << 21)) ^ ((c >>> 25) | (c << 7)))
        + ((c & d) ^ (~c & e));
      const t2 = (((g_ >>> 2) | (g_ << 30)) ^ ((g_ >>> 13) | (g_ << 19)) ^ ((g_ >>> 22) | (g_ << 10)))
        + ((g_ & h) ^ (g_ & a) ^ (h & a));
      f = getBgeServiceWorkerKey + t2;
      b += getBgeServiceWorkerKey;
    }
    i++;

    // Round 4
    if (i < 16) {
      schedule[i] = word = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
      offset += 4;
    } else {
      s0 = schedule[i - 2]; userSkipAd = schedule[i - 15];
      word = schedule[i - 7] + schedule[i - 16]
        + (((s0 >>> 17) | (s0 << 15)) ^ ((s0 >>> 19) | (s0 << 13)) ^ (s0 >>> 10))
        + (((userSkipAd >>> 7) | (userSkipAd << 25)) ^ ((userSkipAd >>> 18) | (userSkipAd << 14)) ^ (userSkipAd >>> 3));
      schedule[i] = word;
    }
    {
      const getBgeServiceWorkerKey = e + Co[i] + word
        + (((b >>> 6) | (b << 26)) ^ ((b >>> 11) | (b << 21)) ^ ((b >>> 25) | (b << 7)))
        + ((b & c) ^ (~b & d));
      const t2 = (((f >>> 2) | (f << 30)) ^ ((f >>> 13) | (f << 19)) ^ ((f >>> 22) | (f << 10)))
        + ((f & g_) ^ (f & h) ^ (g_ & h));
      const tmpH = h;
      h = d; d = tmpH;
      const tmpG = g_;
      g_ = c; c = tmpG;
      const tmpF = f;
      f = b; b = tmpF;
      e = a + getBgeServiceWorkerKey;
      a = getBgeServiceWorkerKey + t2;
    }
    i++;
  }

  hashState.W[0] = (a + hashState.W[0]) | 0;
  hashState.W[1] = (b + hashState.W[1]) | 0;
  hashState.W[2] = (c + hashState.W[2]) | 0;
  hashState.W[3] = (d + hashState.W[3]) | 0;
  hashState.W[4] = (e + hashState.W[4]) | 0;
  hashState.W[5] = (f + hashState.W[5]) | 0;
  hashState.W[6] = (g_ + hashState.W[6]) | 0;
  hashState.W[7] = (h + hashState.W[7]) | 0;
}

/**
 * Finalize the SHA-256 hash and return the 32-byte digest.
 * [was: OW7]
 *
 * @param {object} hashState
 * @returns {Uint8Array} 32-byte hash
 */
export function sha256Finalize(hashState) { // was: OW7
  const digest = new Uint8Array(32);
  let paddingLength = 64 - hashState.O;
  if (hashState.O > 55) paddingLength += 64;

  const padding = new Uint8Array(paddingLength);
  padding[0] = 128;

  let bitLength = hashState.j * 8;
  for (let i = 1; i < 9; i++) {
    const byte = bitLength % 256;
    padding[paddingLength - i] = byte;
    bitLength = (bitLength - byte) / 256;
  }

  hashState.update(padding);

  for (let i = 0; i < 8; i++) {
    digest[i * 4]     = hashState.W[i] >>> 24;
    digest[i * 4 + 1] = (hashState.W[i] >>> 16) & 255;
    digest[i * 4 + 2] = (hashState.W[i] >>> 8) & 255;
    digest[i * 4 + 3] = hashState.W[i] & 255;
  }

  sha256Reset(hashState);
  return digest;
}

// ===================================================================
// HMAC-SHA256 (software fallback)
// ===================================================================

/**
 * Compute HMAC-SHA256 using the software SHA-256 implementation.
 * [was: vRO]
 *
 * @param {object} hmacState
 * @param {Uint8Array} data
 * @param {Uint8Array} extra
 * @returns {Uint8Array}
 */
export function hmacSha256Software(hmacState, data, extra) { // was: vRO
  const hash = new f4x(hmacState.W); // f4x = SHA256 instance
  hash.update(data);
  hash.update(extra);
  const innerDigest = sha256Finalize(hash);
  hash.update(hash.K); // K = outer key pad
  hash.update(innerDigest);
  const result = sha256Finalize(hash);
  hash.reset();
  return result;
}

/**
 * Compute HMAC-SHA256 via WebCrypto.
 * [was: a4n]
 *
 * @param {object} cryptoState
 * @param {Uint8Array} data
 * @param {Uint8Array} extra
 * @returns {Promise<Uint8Array>}
 */
export async function hmacSha256WebCrypto(cryptoState, data, extra) { // was: a4n
  if (!cryptoState.W) {
    cryptoState.W = await cryptoState.subtleCrypto.importKey(
      "raw",
      cryptoState.O,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
  }
  const combined = new Uint8Array(data.length + extra.length);
  combined.set(data);
  combined.set(extra, data.length);
  const result = await cryptoState.subtleCrypto.sign(
    { name: "HMAC", hash: "SHA-256" },
    cryptoState.W,
    combined
  );
  return new Uint8Array(result);
}

/**
 * Compute HMAC-SHA256 via WebCrypto, initializing the state on first call.
 * [was: $H7]
 *
 * @param {object} state
 * @param {Uint8Array} data
 * @param {Uint8Array} extra
 * @param {SubtleCrypto} subtleCrypto
 * @returns {Promise<Uint8Array>}
 */
export async function hmacSha256WebCryptoInit(state, data, extra, subtleCrypto) { // was: $H7
  if (!state.O) state.O = new G$n(state.W, subtleCrypto); // G$n = WebCryptoHmacState
  return hmacSha256WebCrypto(state.O, data, extra);
}

/**
 * Compute HMAC-SHA256 using the software fallback (lazy init).
 * [was: l4n]
 *
 * @param {object} state
 * @param {Uint8Array} data
 * @param {Uint8Array} extra
 * @returns {Uint8Array}
 */
export function hmacSha256SoftwareInit(state, data, extra) { // was: l4n
  if (!state.A) state.A = new Ps_(state.W); // Ps_ = SoftwareHmacState
  return hmacSha256Software(state.A, data, extra);
}

/**
 * Compute HMAC-SHA256, preferring WebCrypto and falling back to software.
 * [was: uhK]
 *
 * @param {object} state
 * @param {Uint8Array} data
 * @param {Uint8Array} extra
 * @returns {Promise<Uint8Array>}
 */
export async function hmacSha256(state, data, extra) { // was: uhK
  const subtle = getSubtleCrypto();
  if (subtle) {
    try {
      return await hmacSha256WebCryptoInit(state, data, extra, subtle);
    } catch (err) {
      reportWarning(err);
      uX = true; // uX = subtleCryptoFailed flag
      return hmacSha256SoftwareInit(state, data, extra);
    }
  } else {
    return hmacSha256SoftwareInit(state, data, extra);
  }
}

// ===================================================================
// Error wrappers for encode/decode
// ===================================================================

/**
 * Wrap an unknown encode error.
 * [was: hwO]
 *
 * @param {*} err
 * @returns {MB} typed error
 */
export function wrapEncodeError(err) { // was: hwO
  return err instanceof Error
    ? new PESEncoderError("UNKNOWN_ENCODE_ERROR", { originalMessage: err.message })
    : new PESEncoderError("UNKNOWN_ENCODE_ERROR");
}

/**
 * Wrap an unknown decode error.
 * [was: zw_]
 *
 * @param {*} err
 * @returns {MB} typed error
 */
export function wrapDecodeError(err) { // was: zw_
  return err instanceof Error
    ? new PESEncoderError("UNKNOWN_DECODE_ERROR", { originalMessage: err.message })
    : new PESEncoderError("UNKNOWN_DECODE_ERROR");
}

/**
 * Report and re-throw a codec error.
 * [was: CsW]
 *
 * @param {*} err
 * @param {Function} wrapFn
 */
export function throwCodecError(err, wrapFn) { // was: CsW
  const wrapped = err instanceof MB ? err : wrapFn(err);
  reportErrorWithLevel(wrapped);
  throw wrapped;
}

/**
 * Encode a message, wrapping any error.
 * [was: g.MaO]
 *
 * @param {object} codec
 * @param {*} message
 * @param {string} key
 * @returns {*}
 */
export function encodeEntity(codec, message, key) { // was: g.MaO
  try {
    return codec.A(message, key);
  } catch (err) {
    throwCodecError(err, wrapEncodeError);
  }
}

/**
 * Derive a 16-byte AES key from a string (truncated/padded).
 * [was: J0]
 *
 * @param {string} str
 * @returns {Uint8Array}
 */
export function deriveAesKey(str) { // was: J0
  const encoded = new TextEncoder().encode(str).subarray(0, 16);
  const key = new Uint8Array(16);
  key.set(encoded);
  return key;
}

// ===================================================================
// Entity model lookup
// ===================================================================

/**
 * Look up the entity model class by entity type.
 * [was: RwX]
 *
 * @param {string} entityType
 * @returns {Function|undefined}
 */
export function getEntityModel(entityType) { // was: RwX
  const model = JGw[entityType]; // JGw = entity model registry
  if (model) return model;
  reportWarning(new PlayerError("Entity model not found.", { entityType })); 
}

/**
 * Decode a stored entity record.
 * [was: kf]
 *
 * @param {object} dbContext
 * @param {object} record
 * @returns {*}
 */
export function decodeEntityRecord(dbContext, record) { // was: kf
  const codec = getCodecVersion(dbContext.O, record.version);
  try {
    return codec.O(record.data, record.key);
  } catch (err) {
    throwCodecError(err, wrapDecodeError);
  }
}

// ===================================================================
// Entity store CRUD (IndexedDB transactions)
// ===================================================================

/**
 * Fetch a single entity from the store by key.
 * [was: g.Yf]
 *
 * @param {object} txn
 * @param {string} key
 * @param {string} [expectedType]
 * @returns {Promise<*|undefined>}
 */
export function getEntity(txn, key, expectedType) { // was: g.Yf
  return txn.W.objectStore("EntityStore").get(key).then((record) => {
    if (record) {
      if (expectedType && record.entityType !== expectedType) {
        throw Error("Incorrect entity type");
      }
      return decodeEntityRecord(txn, record);
    }
  });
}

/**
 * Fetch multiple entities of a given type. If keys are provided,
 * fetch each individually; otherwise fetch all of that type.
 * [was: g.po]
 *
 * @param {object} txn
 * @param {string} entityType
 * @param {string[]} [keys]
 * @returns {Promise<Array>}
 */
export function getEntitiesByType(txn, entityType, keys) { // was: g.po
  if (keys) {
    const promises = keys.map((key) => getEntity(txn, key, entityType));
    return IdbPromise.all(promises);
  }
  return txn.W
    .objectStore("EntityStore")
    .index("entityType")
    .getAll(IDBKeyRange.only(entityType))
    .then((records) => records.map((r) => decodeEntityRecord(txn, r)));
}

/**
 * Delete and re-create associations for an entity.
 * [was: g.Y7X]
 *
 * @param {object} txn
 * @param {object} entity
 * @param {string} entityType
 * @returns {Promise}
 */
export function replaceAssociations(txn, entity, entityType) { // was: g.Y7X
  const key = getEntityKey(entity);
  return deleteAssociations(txn, key).then(() => createAssociations(txn, entity, entityType));
}

/**
 * Register that an entity was changed, tracking by type.
 * [was: g.cI]
 *
 * @param {object} txn
 * @param {string} key
 * @param {string} entityType
 */
export function trackEntityChange(txn, key, entityType) { // was: g.cI
  let set = txn.A[entityType];
  if (!set) {
    set = new Set();
    txn.A[entityType] = set;
  }
  set.add(key);
}

/**
 * Write (upsert) an entity into the store.
 * [was: g.WI]
 *
 * @param {object} txn
 * @param {object} entity
 * @param {string} entityType
 * @returns {Promise<string>} the entity key
 */
export function writeEntity(txn, entity, entityType) { // was: g.WI
  const key = getEntityKey(entity);
  const codec = getCodecVersion(txn.O, 1);
  const entityCopy = { ...entity };

  return txn.W
    .objectStore("EntityStore")
    .get(key)
    .then((existing) => {
      if (existing) {
        if (existing.entityType !== entityType) {
          throw Error("Incorrect entity type");
        }
        if (!entityCopy.entityMetadata) {
          const decoded = decodeEntityRecord(txn, existing);
          entityCopy.entityMetadata = decoded.entityMetadata;
        }
      }
    })
    .then(() => {
      const record = {
        key,
        entityType,
        data: encodeEntity(codec, entityCopy, key),
        version: 1,
      };
      return IdbPromise.all([
        txn.W.objectStore("EntityStore").put(record),
        replaceAssociations(txn, entityCopy, entityType),
      ]);
    })
    .then(() => {
      trackEntityChange(txn, key, entityType);
      return key;
    });
}

/**
 * Recursively collect orphaned children for cascade delete.
 * [was: QY_]
 *
 * @param {object} txn
 * @param {string} key
 * @param {Set<string>} visited
 * @returns {Promise<void>}
 */
export function collectOrphanedChildren(txn, key, visited) { // was: QY_
  if (visited.has(key)) return IdbPromise.resolve(undefined);
  visited.add(key);

  return findOrphanedChildKeys(txn, key)
    .then((childKeys) =>
      txn.W
        .objectStore("EntityAssociationStore")
        .index("byParentEntityKey")
        .delete(IDBKeyRange.only(key))
        .then(() => childKeys)
    )
    .then((childKeys) => {
      let chain = IdbPromise.resolve(undefined);
      for (const childKey of childKeys) {
        chain = chain.then(() => collectOrphanedChildren(txn, childKey, visited));
      }
      return chain;
    })
    .then(() => {});
}

/**
 * Delete an entity (and optionally cascade to orphaned children).
 * [was: g.mh]
 *
 * @param {object} txn
 * @param {string} key
 * @param {object} [options]
 * @returns {Promise<void>}
 */
export function deleteEntity(txn, key, options) { // was: g.mh
  if (options?.dt) {
    const visited = new Set();
    return collectOrphanedChildren(txn, key, visited).then(() => {
      const deletes = [];
      for (const orphanKey of visited) {
        deletes.push(deleteEntity(txn, orphanKey));
      }
      return IdbPromise.all(deletes).then(() => {});
    });
  }

  const entityType = deserializeEntityKey(key).entityType;
  return IdbPromise
    .all([
      txn.W.objectStore("EntityStore").delete(key),
      deleteAssociations(txn, key),
    ])
    .then(() => {
      trackEntityChange(txn, key, entityType);
    });
}

/**
 * Delete all parent associations for a given key.
 * [was: g.QJ]
 *
 * @param {object} txn
 * @param {string} key
 * @returns {Promise}
 */
export function deleteAssociations(txn, key) { // was: g.QJ
  return txn.W
    .objectStore("EntityAssociationStore")
    .index("byParentEntityKey")
    .delete(IDBKeyRange.only(key));
}

/**
 * Delete multiple entities.
 * [was: czw]
 *
 * @param {object} txn
 * @param {string[]} keys
 * @returns {Promise<void>}
 */
export function deleteEntities(txn, keys) { // was: czw
  const promises = keys.map((key) => deleteEntity(txn, key));
  return IdbPromise.all(promises).then(() => {});
}

/**
 * Create child associations for an entity based on its entity model.
 * [was: k$7]
 *
 * @param {object} txn
 * @param {object} entity
 * @param {string} entityType
 * @returns {Promise<Array>}
 */
export function createAssociations(txn, entity, entityType) { // was: k$7
  const key = getEntityKey(entity);
  const ModelClass = getEntityModel(entityType);
  if (!ModelClass) return IdbPromise.resolve([]);

  const model = new ModelClass(entity);
  const store = txn.W.objectStore("EntityAssociationStore");
  const puts = [];
  for (const childKey of model.O()) {
    puts.push(
      store.put({ parentEntityKey: key, childEntityKey: childKey })
    );
  }
  return IdbPromise.all(puts).then((results) => results.map((r) => r[1]));
}

/**
 * Find child keys that are solely parented by the given key (orphan candidates).
 * [was: pOX]
 *
 * @param {object} txn
 * @param {string} parentKey
 * @returns {Promise<string[]>}
 */
export function findOrphanedChildKeys(txn, parentKey) { // was: pOX
  const store = txn.W.objectStore("EntityAssociationStore");
  return store
    .index("byParentEntityKey")
    .getAll(IDBKeyRange.only(parentKey))
    .then((associations) => {
      const lookups = [];
      for (const assoc of associations) {
        lookups.push(store.index("byChildEntityKey").getAll(assoc.childEntityKey));
      }
      return IdbPromise.all(lookups);
    })
    .then((results) => {
      const orphans = [];
      for (const parentList of results) {
        if (parentList.length === 1) orphans.push(parentList[0].childEntityKey);
      }
      return orphans;
    });
}

// ===================================================================
// Codec version lookup
// ===================================================================

/**
 * Get a codec by version number; throws if invalid.
 * [was: g.R8]
 *
 * @param {object} codecMap
 * @param {number} [version=0]
 * @returns {object}
 */
export function getCodecVersion(codecMap, version = 0) { // was: g.R8
  const codec = codecMap.W[version];
  if (!codec) {
    const error = new PESEncoderError("INVALID_ENCODER_VERSION", { zK: version });
    reportErrorWithLevel(error);
    throw error;
  }
  return codec;
}

// ===================================================================
// Observer / broadcast
// ===================================================================

/**
 * Notify all observers of a change set.
 * [was: WNd]
 *
 * @param {object} store
 * @param {object} changeSet
 */
export function notifyObservers(store, changeSet) { // was: WNd
  for (const observer of store.observers) {
    observer(changeSet);
  }
}

// ===================================================================
// High-level entity store operations
// ===================================================================

/**
 * Run a transactional operation on the persistent entity store,
 * broadcasting changes to observers afterward.
 * [was: g.Kr]
 *
 * @param {object} storeHandle
 * @param {object} txnOptions
 * @param {Function} callback
 * @returns {Promise<*>}
 */
export async function withEntityTransaction(storeHandle, txnOptions, callback) { // was: g.Kr
  const dbPromise = await transactEntityStore(storeHandle.token);
  let changeTracker;
  const result = await runTransaction(
    dbPromise,
    ["EntityStore", "EntityAssociationStore"],
    txnOptions,
    (txn) => {
      changeTracker = new mAm(txn, storeHandle.W); // mAm = ChangeTracker
      return callback(changeTracker);
    }
  );
  if (changeTracker) {
    const changes = changeTracker.A;
    if (Object.keys(changes).length > 0) {
      storeHandle.channel.postMessage(changes);
      notifyObservers(storeHandle, changes);
    }
  }
  return result;
}

/**
 * Write an entity in a readwrite transaction.
 * [was: g.TA]
 *
 * @param {object} storeHandle
 * @param {object} entity
 * @param {string} entityType
 * @returns {Promise<string>}
 */
export function writeEntityInTransaction(storeHandle, entity, entityType) { // was: g.TA
  return withEntityTransaction(
    storeHandle,
    { mode: "readwrite", g3: true },
    (txn) => writeEntity(txn, entity, entityType)
  );
}

/**
 * Delete an entity in a readwrite transaction.
 * [was: g.oz]
 *
 * @param {object} storeHandle
 * @param {string} key
 * @returns {Promise<void>}
 */
export function deleteEntityInTransaction(storeHandle, key) { // was: g.oz
  return withEntityTransaction(
    storeHandle,
    { mode: "readwrite", g3: true },
    (txn) => deleteEntity(txn, key)
  );
}

/**
 * Delete multiple entities in a readwrite transaction.
 * [was: KN7]
 *
 * @param {object} storeHandle
 * @param {string[]} keys
 * @returns {Promise<void>}
 */
export function deleteEntitiesInTransaction(storeHandle, keys) { // was: KN7
  return withEntityTransaction(
    storeHandle,
    { mode: "readwrite", g3: true },
    (txn) => deleteEntities(txn, keys)
  );
}

/**
 * Read entities by type in a readonly transaction.
 * [was: g.rx]
 *
 * @param {object} storeHandle
 * @param {string} entityType
 * @param {string[]} [keys]
 * @returns {Promise<Array>}
 */
export function readEntitiesByType(storeHandle, entityType, keys) { // was: g.rx
  return withEntityTransaction(
    storeHandle,
    { mode: "readonly", g3: true },
    (txn) => getEntitiesByType(txn, entityType, keys)
  );
}

// ===================================================================
// Singleton entity store instance
// ===================================================================

/**
 * Get or create the global entity store instance.
 * [was: g.Iz]
 *
 * @returns {Promise}
 */
export function getGlobalEntityStore() { // was: g.Iz
  if (!U5) U5 = initGlobalEntityStore(); // U5 = cached promise
  return U5;
}

/**
 * Initialize the global entity store with BroadcastChannel support.
 * [was: TVK]
 *
 * @returns {Promise<object|undefined>}
 */
export async function initGlobalEntityStore() { // was: TVK
  try {
    const encoderMap = await getIdbToken();
    if (encoderMap && hasDatasyncId() && typeof globalRef.BroadcastChannel !== "undefined") {
      const channel = new oux(); // oux = EntityBroadcastChannel
      return new rzO(encoderMap, channel); // rzO = PersistentEntityStore
    }
  } catch (err) {
    if (err instanceof Error) reportErrorWithLevel(err);
  }
}

// ===================================================================
// Miscellaneous feature checks
// ===================================================================

/**
 * Check if cinematics (ambient mode) should be enabled.
 * [was: IE_]
 *
 * @returns {boolean}
 */
export function isCinematicsEnabled() { // was: IE_
  const settings = getPlayerConfig();
  return settings.BA(192)
    ? settings.BA(190)
    : !(
        getExperimentBoolean("web_watch_cinematics_disabled_by_default") ||
        (getExperimentBoolean("web_watch_cinematics_preferred_reduced_motion_default_disabled") && UAK())
      );
}

/**
 * Check if XMLHttpRequest.prototype.fetch is a 3-argument function
 * (used to detect certain polyfills/overrides).
 * [was: XJy]
 *
 * @returns {boolean}
 */
export function hasXhrFetchOverride() { // was: XJy
  const fetchFn = XMLHttpRequest.prototype.fetch;
  return !!fetchFn && fetchFn.length === 3;
}
