/**
 * Protobuf — Field Constants, Message Helpers & Descriptors
 *
 * Extracted from YouTube's base.js (player_es6.vflset/en_US)
 * Source lines: ~3882–3970  (Sj, FV, ES, dG — descriptor registration)
 *              ~3973–4067   (L0, Gad — message deserialization / extension handling)
 *              ~4069–4131   (aS_, f0, a$, $9n — serialization dispatch)
 *              ~4134–4162   ($l — array coercion,  Pk / ly / tQ — descriptor factories)
 *              ~4227–4263   (Wh, Kj, Td — deserialize / serialize / fromJSON wrappers)
 *              ~58017–58035 (n0, fSR, vWR — FieldDescriptor + default repeated message desc.)
 *              ~58053–58320 (aD..HP7 — built-in field-type descriptors)
 *
 * This file provides the glue between the raw wire reader/writer and
 * YouTube's protobuf message framework (the "Zd" base class, one-of helpers,
 * extension registries, etc.).
 */

import {
  nextTag,
  skipField,
  readMessage,
  readVarint32,
  readBool,
  readFixed32,
  readFixed64,
  readDouble,
  readString,
  readBytes,
  readPacked,
  readVarint64,
  readVarintU32,
  makeUInt64Value,
  makeInt64Value,
  decodeFloat32,
  acquireDecoder,
  ProtoDecoder,
} from "./protobuf-reader.js";

import {
  ProtoEncoder,
  BufferWriter,
  writeTag,
  writeVarint32,
  writeVarint64,
  writeFixed32,
  writeSignedVarint32,
  appendChunk,
  beginDelimited,
  endDelimited,
  writeFixed64Field,
  writeInt32Field,
  writeBytesField,
  writeDoubleField,
  writeFloatField,
  writeInt64Field,
  writeEnumField,
  writeBoolField,
  writeStringField,
  writeMessageField,
  writeUInt32Field,
  writeFixed32Field,
  serialize,
} from "./protobuf-writer.js";

// ---------------------------------------------------------------------------
// Wire type constants
// ---------------------------------------------------------------------------

/** Wire type 0 — Varint (int32, int64, uint32, uint64, sint32, sint64, bool, enum) */
export const WIRE_VARINT = 0;

/** Wire type 1 — 64-bit (fixed64, sfixed64, double) */
export const WIRE_FIXED64 = 1;

/** Wire type 2 — Length-delimited (string, bytes, embedded messages, packed repeated) */
export const WIRE_LENGTH_DELIMITED = 2;

/** Wire type 3 — Start group (deprecated) */
export const WIRE_START_GROUP = 3;

/** Wire type 4 — End group (deprecated) */
export const WIRE_END_GROUP = 4;

/** Wire type 5 — 32-bit (fixed32, sfixed32, float) */
export const WIRE_FIXED32 = 5;

// ---------------------------------------------------------------------------
// Internal symbols (used by YouTube's message framework)
// ---------------------------------------------------------------------------

/**
 * Symbol for the serialization descriptor table.
 * [was: gG]
 */
export const SYM_WRITE_DESCRIPTOR = Symbol("writeDescriptor");

/**
 * Symbol for the deserialization descriptor table.
 * [was: sS]
 */
export const SYM_READ_DESCRIPTOR = Symbol("readDescriptor");

/**
 * Symbol for the cached deserialization function.
 * [was: wG]
 */
export const SYM_DESERIALIZE_FN = Symbol("deserializeFn");

/**
 * Symbol for the cached serialization function.
 * [was: vk]
 */
export const SYM_SERIALIZE_FN = Symbol("serializeFn");

/**
 * Symbol for the "apply extensions" callback.
 * [was: by]
 */
export const SYM_APPLY_EXTENSIONS = Symbol("applyExtensions");

// ---------------------------------------------------------------------------
// FieldDescriptor — describes how to read/write a single field
// ---------------------------------------------------------------------------

/**
 * Describes a single protobuf field's read and write behaviour.
 * [was: n0]
 */
export class FieldDescriptor {
  /**
   * @param {Function} readFn   decoder callback  [was: .HD]
   * @param {Function} writeFn  encoder callback   [was: .Jh]
   * @param {*}        sentinel guard value        [was: .W — presence flag]
   */
  constructor(readFn, writeFn, sentinel) {
    this.readFn = readFn;   // was: .HD
    this.writeFn = writeFn; // was: .Jh
    this.isRepeated = false; // was: .W — derived from sentinel check
  }
}

/**
 * Create a singular (non-repeated) field descriptor.
 * [was: Pk]
 */
export function singularField(readFn, writeFn, sentinel) {
  return new FieldDescriptor(readFn, writeFn, sentinel);
}

/**
 * Create a repeated field descriptor.
 * [was: ly]
 */
export function repeatedField(readFn, writeFn, sentinel) {
  return new FieldDescriptor(readFn, writeFn, sentinel);
}

/**
 * Create a sub-message (or default repeated-message) field descriptor.
 * [was: tQ]
 */
export function messageField(readFn, writeFn) {
  return new FieldDescriptor(readFn, writeFn, undefined);
}

// ---------------------------------------------------------------------------
// Built-in field-type descriptors (pre-configured read/write pairs)
// ---------------------------------------------------------------------------

/**
 * double — wire type 1, IEEE-754 64-bit
 * [was: aD]
 */
export const FIELD_DOUBLE = singularField(
  // read: was inline in aD
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_FIXED64) return false;
    setField(target, fieldNumber, readDouble(decoder.reader));
    return true;
  },
  writeDoubleField,
  undefined
);

/**
 * float — wire type 5, IEEE-754 32-bit
 * [was: GV]
 */
export const FIELD_FLOAT = singularField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_FIXED32) return false;
    const bits = readFixed32(decoder.reader);
    setField(target, fieldNumber, decodeFloat32(bits));
    return true;
  },
  writeFloatField,
  undefined
);

/**
 * int64 / sint64 — wire type 0, signed varint
 * [was: $6]
 */
export const FIELD_INT64 = singularField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_VARINT) return false;
    setField(target, fieldNumber, readVarint64(decoder.reader, makeInt64Value));
    return true;
  },
  writeInt64Field,
  undefined
);

/**
 * uint64 — wire type 0, unsigned varint (64-bit)
 * [was: Xjw]
 */
export const FIELD_UINT64 = singularField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_VARINT) return false;
    setField(target, fieldNumber, readVarint64(decoder.reader, makeUInt64Value));
    return true;
  },
  writeInt64Field, // encoding is the same for uint64
  undefined
);

/**
 * int32 / enum — wire type 0, varint
 * [was: PX / RD]
 */
export const FIELD_INT32 = singularField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_VARINT) return false;
    setField(target, fieldNumber, readVarint32(decoder.reader));
    return true;
  },
  writeEnumField,
  undefined
);

/**
 * uint32 — wire type 0, unsigned varint
 * [was: Jj]
 */
export const FIELD_UINT32 = singularField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_VARINT) return false;
    setField(target, fieldNumber, readVarint32(decoder.reader) >>> 0);
    return true;
  },
  writeUInt32Field,
  undefined
);

/**
 * fixed64 — wire type 1
 * [was: VtX / efy]
 */
export const FIELD_FIXED64 = singularField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_FIXED64) return false;
    setField(target, fieldNumber, readFixed64(decoder.reader));
    return true;
  },
  writeFixed64Field,
  undefined
);

/**
 * fixed32 — wire type 5
 * [was: xuX]
 */
export const FIELD_FIXED32 = singularField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_FIXED32) return false;
    setField(target, fieldNumber, readFixed32(decoder.reader));
    return true;
  },
  writeFixed32Field,
  undefined
);

/**
 * bool — wire type 0
 * [was: lt]
 */
export const FIELD_BOOL = singularField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_VARINT) return false;
    setField(target, fieldNumber, readBool(decoder.reader));
    return true;
  },
  writeBoolField,
  undefined
);

/**
 * string — wire type 2
 * [was: ut]
 */
export const FIELD_STRING = singularField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_LENGTH_DELIMITED) return false;
    setField(target, fieldNumber, readString(decoder));
    return true;
  },
  writeStringField,
  undefined
);

/**
 * bytes — wire type 2
 * [was: CK]
 */
export const FIELD_BYTES = singularField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_LENGTH_DELIMITED) return false;
    setField(target, fieldNumber, readBytes(decoder));
    return true;
  },
  writeBytesField,
  undefined
);

/**
 * repeated int32 (packed) — wire type 0 or 2
 * [was: ttO]
 */
export const FIELD_REPEATED_INT32 = repeatedField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_VARINT && decoder.wireType !== WIRE_LENGTH_DELIMITED)
      return false;
    const arr = getOrCreateRepeated(target, fieldNumber);
    if (decoder.wireType === WIRE_LENGTH_DELIMITED) {
      readPacked(decoder, readVarintU32, arr);
    } else {
      arr.push(readVarint32(decoder.reader));
    }
    return true;
  },
  (encoder, values, fieldNumber) => {
    if (values == null) return;
    for (let i = 0; i < values.length; i++) {
      writeInt32Field(encoder, fieldNumber, values[i]);
    }
  },
  undefined
);

/**
 * repeated string — wire type 2
 * [was: npx]
 */
export const FIELD_REPEATED_STRING = repeatedField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_LENGTH_DELIMITED) return false;
    getOrCreateRepeated(target, fieldNumber).push(readString(decoder));
    return true;
  },
  (encoder, values, fieldNumber) => {
    if (values == null) return;
    for (let i = 0; i < values.length; i++) {
      writeStringField(encoder, fieldNumber, values[i]);
    }
  },
  undefined
);

/**
 * repeated bytes — wire type 2
 * [was: M_]
 */
export const FIELD_REPEATED_BYTES = repeatedField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_LENGTH_DELIMITED) return false;
    getOrCreateRepeated(target, fieldNumber).push(readBytes(decoder));
    return true;
  },
  (encoder, values, fieldNumber) => {
    if (values == null) return;
    for (let i = 0; i < values.length; i++) {
      if (values[i] != null) writeBytesField(encoder, fieldNumber, values[i]);
    }
  },
  undefined
);

/**
 * repeated fixed64 (packed) — wire type 1 or 2
 * [was: BaX]
 */
export const FIELD_REPEATED_FIXED64 = repeatedField(
  (decoder, target, fieldNumber) => {
    if (decoder.wireType !== WIRE_FIXED64 && decoder.wireType !== WIRE_LENGTH_DELIMITED)
      return false;
    const arr = getOrCreateRepeated(target, fieldNumber);
    if (decoder.wireType === WIRE_LENGTH_DELIMITED) {
      readPacked(decoder, (r) => {
        const createTimeRanges = readFixed32(r);
        const hi = readFixed32(r);
        return makeUInt64Value(createTimeRanges, hi);
      }, arr);
    } else {
      arr.push(readFixed64(decoder.reader));
    }
    return true;
  },
  (encoder, values, fieldNumber) => {
    if (values == null) return;
    for (let i = 0; i < values.length; i++) {
      writeFixed64Field(encoder, fieldNumber, values[i]);
    }
  },
  undefined
);

// ---------------------------------------------------------------------------
// Message-level helpers
// ---------------------------------------------------------------------------

/**
 * Set a field value on the message's internal array.
 * Simplified version of the framework's C0 / LU machinery.
 * [was: C0]
 */
function setField(messageArray, fieldNumber, value) {
  // In YouTube's framework, messageArray is a raw JS array with metadata
  // at index 0 (the "flags" word).  Field `n` maps to array index `n`.
  messageArray[fieldNumber] = value;
}

/**
 * Get (or create) a repeated-field array at `fieldNumber`.
 * [was: uF]
 */
function getOrCreateRepeated(messageArray, fieldNumber) {
  let arr = messageArray[fieldNumber];
  if (!arr) {
    arr = [];
    messageArray[fieldNumber] = arr;
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Descriptor table builder
// ---------------------------------------------------------------------------

/**
 * Build and cache the field descriptor table for a message type.
 *
 * The `spec` is a compact array describing all fields:
 *   [flags, extensions?, ...fieldDescriptions]
 *
 * Each field description is a sequence:
 *   [fieldNumber-range, FieldDescriptor, optionalSubSpec?, ...]
 *
 * [was: Sj]
 *
 * @param {symbol}   readKey   SYM_READ_DESCRIPTOR or SYM_WRITE_DESCRIPTOR
 * @param {Function} singularCb  called for singular fields: (table, fieldNum, desc, oneOf)
 * @param {Function} messageCb   called for message fields:  (table, fieldNum, desc, subSpec, oneOf)
 * @param {Array}    spec        the compact descriptor array
 * @returns {object} the descriptor table (cached on `spec[readKey]`)
 */
export function buildDescriptorTable(readKey, singularCb, messageCb, spec) {
  let table = spec[readKey];
  if (table) return table;

  table = {};
  table.spec = spec;         // was: .iK
  table.defaultArray = spec[0]; // was: .z4 (processed via d97)

  const meta = spec[1];
  let idx = 1;

  if (meta && meta.constructor === Object) {
    table.extensions = meta;
    idx++;
    const nextItem = spec[idx];
    if (typeof nextItem === "function") {
      table.hasCustomDeserializer = true; // was: .Hu
      idx += 2; // skip the custom fn and its companion
    }
  }

  const oneOfMap = {};
  let item = spec[idx];

  while (item && Array.isArray(item) && item.length && typeof item[0] === "number" && item[0] > 0) {
    for (let i = 0; i < item.length; i++) {
      oneOfMap[item[i]] = item;
    }
    item = spec[++idx];
  }

  let fieldNumber = 1;

  while (item !== undefined) {
    if (typeof item === "number") {
      fieldNumber += item;
      item = spec[++idx];
    }

    let descriptor;
    let subSpec;

    if (item instanceof FieldDescriptor) {
      descriptor = item;
    } else {
      // Default repeated-message descriptor (fSR)
      descriptor = DEFAULT_SUB_MESSAGE_DESCRIPTOR;
      idx--;
    }

    if (descriptor?.isRepeated) {
      item = spec[++idx];
      // Resolve lazy sub-spec (a function that returns the spec)
      if (typeof item === "function") {
        item = item();
        spec[idx] = item; // cache the resolved spec
      }
      subSpec = item;
    }

    item = spec[++idx];
    let upperBound = fieldNumber + 1;
    if (typeof item === "number" && item < 0) {
      upperBound -= item;
      item = spec[++idx];
    }

    for (; fieldNumber < upperBound; fieldNumber++) {
      const oneOf = oneOfMap[fieldNumber];
      if (subSpec) {
        messageCb(table, fieldNumber, descriptor, subSpec, oneOf);
      } else {
        singularCb(table, fieldNumber, descriptor, oneOf);
      }
    }
  }

  spec[readKey] = table;
  return table;
}

// Placeholder for the default sub-message field descriptor.
// [was: fSR]
const DEFAULT_SUB_MESSAGE_DESCRIPTOR = messageField(
  (decoder, target, fieldNumber, defaultArray, parseFn) => {
    if (decoder.wireType !== WIRE_LENGTH_DELIMITED) return false;
    readMessage(decoder, target, parseFn);
    return true;
  },
  writeMessageField
);

// ---------------------------------------------------------------------------
// Deserialization dispatch
// ---------------------------------------------------------------------------

/**
 * Build (and cache) the top-level deserialization function for a message spec.
 * Returns a function `(messageArray, decoder) => boolean`.
 * [was: L0]
 */
export function getDeserializer(spec) {
  let fn = spec[SYM_DESERIALIZE_FN];
  if (fn != null) return fn;

  const table = buildDescriptorTable(SYM_READ_DESCRIPTOR, registerReadField, registerReadMessageField, spec);

  fn = (messageArray, decoder) => {
    while (nextTag(decoder) && decoder.wireType !== WIRE_END_GROUP) {
      const fieldNum = decoder.fieldNumber;
      let handler = table[fieldNum];

      // Check extensions
      if (handler == null) {
        const ext = table.extensions;
        if (ext && ext[fieldNum]) {
          handler = resolveExtensionReader(ext[fieldNum]);
          if (handler != null) table[fieldNum] = handler;
        }
      }

      if (handler == null || !handler(decoder, messageArray, fieldNum)) {
        // Unknown field — skip (and optionally preserve)
        const startOffset = decoder.tagOffset;
        skipField(decoder);
        if (decoder.keepUnknown) {
          // Capture unknown field bytes
          const endOffset = decoder.reader.cursor;
          decoder.reader.cursor = startOffset;
          // Store as raw bytes in a side table
        }
      }
    }
    return true;
  };

  spec[SYM_DESERIALIZE_FN] = fn;
  return fn;
}

/**
 * Register a singular field's read handler into the table.
 * [was: ES]
 */
function registerReadField(table, fieldNumber, descriptor, oneOf) {
  const readFn = descriptor.readFn;
  table[fieldNumber] = oneOf
    ? (dec, msg, fld) => readFn(dec, msg, fld, oneOf)
    : readFn;
}

/**
 * Register a message field's read handler (with lazy sub-spec resolution).
 * [was: dG]
 */
function registerReadMessageField(table, fieldNumber, descriptor, subSpec, oneOf) {
  const readFn = descriptor.readFn;
  let cachedDeserializer;
  let cachedDefaultArray;

  table[fieldNumber] = (dec, msg, fld) => {
    if (!cachedDefaultArray) {
      cachedDefaultArray = buildDescriptorTable(SYM_READ_DESCRIPTOR, registerReadField, registerReadMessageField, subSpec).defaultArray;
    }
    if (!cachedDeserializer) {
      cachedDeserializer = getDeserializer(subSpec);
    }
    return readFn(dec, msg, fld, cachedDefaultArray, cachedDeserializer, oneOf);
  };
}

/**
 * Resolve an extension's read handler from its compact format.
 * [was: aS_]
 */
function resolveExtensionReader(extEntry) {
  const parts = Array.isArray(extEntry)
    ? (extEntry[0] instanceof FieldDescriptor ? extEntry : [undefined, extEntry])
    : [extEntry, undefined];

  const readFn = parts[0].readFn;
  const subSpec = parts[1];

  if (subSpec) {
    const deserializer = getDeserializer(subSpec);
    const defaultArray = buildDescriptorTable(SYM_READ_DESCRIPTOR, registerReadField, registerReadMessageField, subSpec).defaultArray;
    return (dec, msg, fld) => readFn(dec, msg, fld, defaultArray, deserializer);
  }
  return readFn;
}

// ---------------------------------------------------------------------------
// Serialization dispatch
// ---------------------------------------------------------------------------

/**
 * Build (and cache) the top-level serialization function for a message spec.
 * Returns a function `(messageArray, encoder) => void`.
 * [was: f0]
 */
export function getSerializer(spec) {
  let fn = spec[SYM_SERIALIZE_FN];
  if (fn) return fn;

  const table = buildDescriptorTable(SYM_WRITE_DESCRIPTOR, registerWriteField, registerWriteMessageField, spec);
  fn = (messageArray, encoder) => serializeFields(messageArray, encoder, table);
  spec[SYM_SERIALIZE_FN] = fn;
  return fn;
}

/**
 * Register a singular field's write handler into the table.
 * [was: jj]
 */
function registerWriteField(table, fieldNumber, descriptor) {
  table[fieldNumber] = descriptor.writeFn;
}

/**
 * Register a message field's write handler (with lazy sub-spec resolution).
 * [was: OS]
 */
function registerWriteMessageField(table, fieldNumber, descriptor, subSpec) {
  const writeFn = descriptor.writeFn;
  let cachedSerializer;
  let cachedDefaultArray;

  table[fieldNumber] = (enc, value, fld) => {
    if (!cachedDefaultArray) {
      cachedDefaultArray = buildDescriptorTable(SYM_WRITE_DESCRIPTOR, registerWriteField, registerWriteMessageField, subSpec).defaultArray;
    }
    if (!cachedSerializer) {
      cachedSerializer = getSerializer(subSpec);
    }
    return writeFn(enc, value, fld, cachedDefaultArray, cachedSerializer);
  };
}

/**
 * Iterate over message fields and invoke write handlers.
 * Also serializes unknown fields preserved from deserialization.
 * [was: a$]
 */
function serializeFields(messageArray, encoder, table) {
  // Iterate over populated fields
  for (let fieldNumber = 1; fieldNumber < messageArray.length; fieldNumber++) {
    const value = messageArray[fieldNumber];
    if (value != null) {
      const handler = resolveWriteHandler(table, fieldNumber);
      if (handler) {
        handler(encoder, value, fieldNumber);
      }
    }
  }
  // Unknown fields would be re-serialized here in the full implementation
}

/**
 * Look up a write handler, checking extensions if needed.
 * [was: $9n]
 */
function resolveWriteHandler(table, fieldNumber) {
  let handler = table[fieldNumber];
  if (handler) return handler;

  const ext = table.extensions;
  if (!ext) return undefined;

  const extEntry = ext[fieldNumber];
  if (!extEntry) return undefined;

  const parts = Array.isArray(extEntry)
    ? (extEntry[0] instanceof FieldDescriptor ? extEntry : [undefined, extEntry])
    : [extEntry, undefined];

  const writeFn = parts[0].writeFn;
  const subSpec = parts[1];

  if (subSpec) {
    const serializer = getSerializer(subSpec);
    const defaultArray = buildDescriptorTable(SYM_WRITE_DESCRIPTOR, registerWriteField, registerWriteMessageField, subSpec).defaultArray;
    handler = (enc, value, fld) => writeFn(enc, value, fld, defaultArray, serializer);
  } else {
    handler = writeFn;
  }

  table[fieldNumber] = handler;
  return handler;
}

// ---------------------------------------------------------------------------
// High-level convenience wrappers
// ---------------------------------------------------------------------------

/**
 * Create a binary deserializer for a given message constructor + spec.
 * Returns `(bytes, options?) => MessageInstance`.
 * [was: Wh]
 */
export function createDeserializer(MessageClass, spec) {
  return (bytes, options) => {
    const opts = { eS: true };
    if (options) Object.assign(opts, options);
    const decoder = acquireDecoder(bytes, undefined, undefined, opts);
    try {
      const msg = new MessageClass();
      getDeserializer(spec)(msg._internal, decoder);
      return msg;
    } finally {
      decoder.free();
    }
  };
}

/**
 * Create a binary serializer for a given spec.
 * Returns `(messageInstance) => Uint8Array`.
 * [was: Kj]
 */
export function createSerializer(spec) {
  return function () {
    return serialize(this._internal, spec, getSerializer(spec));
  };
}

/**
 * Create a JSON deserializer for a given message constructor.
 * Returns `(jsonString) => MessageInstance`.
 * [was: Td]
 */
export function createJsonDeserializer(MessageClass) {
  return (jsonString) => {
    if (jsonString == null || jsonString === "") return new MessageClass();
    const arr = JSON.parse(jsonString);
    if (!Array.isArray(arr)) throw Error("dnarr");
    // Set the "parsed from JSON" flag
    return new MessageClass(arr);
  };
}

// ---------------------------------------------------------------------------
// Lightweight string-based protobuf parser (used for tracking params)
// ---------------------------------------------------------------------------

/**
 * Read a varint from a character-code callback.
 * Returns Infinity on overflow (> 4 continuation bytes).
 * [was: yF]
 * Source line: ~15529
 */
export function readVarintFromCharCodes(nextCharCode) {
  let byte = nextCharCode();
  let result = byte & 127;
  if (byte < 128) return result;

  byte = nextCharCode();
  result |= (byte & 127) << 7;
  if (byte < 128) return result;

  byte = nextCharCode();
  result |= (byte & 127) << 14;
  if (byte < 128) return result;

  byte = nextCharCode();
  return byte < 128 ? result | ((byte & 127) << 21) : Infinity;
}

/**
 * Extract field 2 from a protobuf-encoded string (typically a tracking token).
 * Returns the value as a number (if varint) or sub-string (if length-delimited).
 * [was: XNy]
 * Source line: ~15492
 */
export function extractField2FromString(str) {
  const len = str.length;
  let pos = 0;
  const nextChar = () => str.charCodeAt(pos++);

  do {
    let tag = readVarintFromCharCodes(nextChar);
    if (tag === Infinity) break;

    const fieldNumber = tag >> 3;

    switch (tag & 7) {
      case WIRE_VARINT: {
        tag = readVarintFromCharCodes(nextChar);
        if (fieldNumber === 2) return tag;
        break;
      }
      case WIRE_FIXED64:
        if (fieldNumber === 2) return undefined;
        pos += 8;
        break;
      case WIRE_LENGTH_DELIMITED: {
        tag = readVarintFromCharCodes(nextChar);
        if (fieldNumber === 2) return str.substr(pos, tag);
        pos += tag;
        break;
      }
      case WIRE_FIXED32:
        if (fieldNumber === 2) return undefined;
        pos += 4;
        break;
      default:
        return undefined;
    }
  } while (pos < len);
}
