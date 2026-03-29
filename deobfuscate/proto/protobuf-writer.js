/**
 * Protobuf Wire Protocol — Writer
 *
 * Extracted from YouTube's base.js (player_es6.vflset/en_US)
 * Source lines: ~3757–3855  (Wk, mE, K0, TO, o$, rG, US, I$, AQ, ej, Vf)
 *              ~4164–4225   (JQ, R$, kl, Yl, p0, Qz)
 *              ~57959–57979 (classes: kVK — BufferWriter, YRO — ProtoEncoder)
 *              ~58037–58052 (mg — serialize to Uint8Array)
 *              ~58053–58320 (field-type descriptors: aD, GV, PX, lt, ut, CK, etc.)
 */

import {
  UInt64,
  Int64,
  negateUInt64,
  bigintToUInt64,
  parseUInt64,
  parseInt64,
  splitUnsigned,
  splitSigned,
  getTempLo,
  getTempHi,
} from "./protobuf-reader.js";

/** @type {DataView|undefined} */
let _scratchView; // was: Mq

// ---------------------------------------------------------------------------
// BufferWriter — collects raw bytes into an array
// ---------------------------------------------------------------------------

/**
 * Low-level byte buffer used by the encoder.
 * [was: kVK]
 */
export class BufferWriter {
  constructor() {
    /** @type {number[]} accumulated bytes */
    this.buf = []; // was: .W
  }

  /** Number of bytes buffered so far. [was: length] */
  length() {
    return this.buf.length;
  }

  /**
   * Return the current buffer and start a fresh one.
   * [was: end]
   * @returns {number[]}
   */
  end() {
    const out = this.buf;
    this.buf = [];
    return out;
  }
}

// ---------------------------------------------------------------------------
// ProtoEncoder — top-level encoder
// ---------------------------------------------------------------------------

/**
 * Encodes protobuf fields into a byte stream.
 * [was: YRO]
 */
export class ProtoEncoder {
  constructor() {
    /** @type {Array<number[]|Uint8Array>} completed chunks */
    this.chunks = [];    // was: .A
    /** Total byte count across all chunks */
    this.totalBytes = 0; // was: .O
    /** Active low-level buffer */
    this.writer = new BufferWriter(); // was: .W
  }
}

// ---------------------------------------------------------------------------
// Low-level write primitives
// ---------------------------------------------------------------------------

/**
 * Write a varint (up to 64-bit, given as lo/hi halves).
 * [was: Wk]
 */
export function writeVarint64(writer, createTimeRanges, hi) {
  while (hi > 0 || createTimeRanges > 127) {
    writer.buf.push((createTimeRanges & 127) | 128);
    createTimeRanges = ((createTimeRanges >>> 7) | (hi << 25)) >>> 0;
    hi >>>= 7;
  }
  writer.buf.push(createTimeRanges);
}

/**
 * Write 4 bytes (little-endian 32-bit).
 * [was: mE]
 */
export function writeFixed32(writer, value) {
  writer.buf.push((value >>> 0) & 255);
  writer.buf.push((value >>> 8) & 255);
  writer.buf.push((value >>> 16) & 255);
  writer.buf.push((value >>> 24) & 255);
}

/**
 * Write a 32-bit unsigned varint.
 * [was: K0]
 */
export function writeVarint32(writer, value) {
  while (value > 127) {
    writer.buf.push((value & 127) | 128);
    value >>>= 7;
  }
  writer.buf.push(value);
}

/**
 * Write a signed 32-bit varint (sign-extended to 64-bit for negatives).
 * [was: TO]
 */
export function writeSignedVarint32(writer, value) {
  if (value >= 0) {
    writeVarint32(writer, value);
  } else {
    for (let i = 0; i < 9; i++) {
      writer.buf.push((value & 127) | 128);
      value >>= 7;
    }
    writer.buf.push(1);
  }
}

/**
 * Append a completed chunk (number[] or Uint8Array) to the encoder.
 * [was: o$]
 */
export function appendChunk(encoder, chunk) {
  if (chunk.length !== 0) {
    encoder.chunks.push(chunk);
    encoder.totalBytes += chunk.length;
  }
}

// ---------------------------------------------------------------------------
// Tag writing
// ---------------------------------------------------------------------------

/**
 * Write a protobuf field tag (field number + wire type).
 * Tag = fieldNumber * 8 + wireType
 * [was: rG]
 */
export function writeTag(encoder, fieldNumber, wireType) {
  writeVarint32(encoder.writer, fieldNumber * 8 + wireType);
}

/**
 * Begin a length-delimited field: writes the tag and returns a "bookmark"
 * array that `endDelimited` will patch with the actual length.
 * [was: US]
 */
export function beginDelimited(encoder, fieldNumber) {
  writeTag(encoder, fieldNumber, 2);
  const bookmark = encoder.writer.end();
  appendChunk(encoder, bookmark);
  bookmark.push(encoder.totalBytes);
  return bookmark;
}

/**
 * Finish a length-delimited field: patches the bookmark with the byte-length
 * varint.
 * [was: I$]
 */
export function endDelimited(encoder, bookmark) {
  let remaining = bookmark.pop();
  remaining = encoder.totalBytes + encoder.writer.length() - remaining;
  while (remaining > 127) {
    bookmark.push((remaining & 127) | 128);
    remaining >>>= 7;
    encoder.totalBytes++;
  }
  bookmark.push(remaining);
  encoder.totalBytes++;
}

// ---------------------------------------------------------------------------
// Field-type writers
// ---------------------------------------------------------------------------

/**
 * Write a fixed-64 field (wire type 1) from a value that may be number,
 * bigint, or string.
 * [was: AQ]
 */
export function writeFixed64Field(encoder, fieldNumber, value) {
  if (value == null) return;
  // validation was: XV(value)
  writeTag(encoder, fieldNumber, 1);
  const w = encoder.writer;

  switch (typeof value) {
    case "number": {
      splitUnsigned(value);
      writeFixed32(w, getTempLo());
      writeFixed32(w, getTempHi());
      break;
    }
    case "bigint": {
      const u = bigintToUInt64(value);
      writeFixed32(w, u.createTimeRanges);
      writeFixed32(w, u.hi);
      break;
    }
    default: {
      const u = parseUInt64(value);
      writeFixed32(w, u.createTimeRanges);
      writeFixed32(w, u.hi);
      break;
    }
  }
}

/**
 * Write a signed int32 field (wire type 0).
 * [was: ej]
 */
export function writeInt32Field(encoder, fieldNumber, value) {
  if (value == null) return;
  value = parseInt(value, 10);
  writeTag(encoder, fieldNumber, 0);
  writeSignedVarint32(encoder.writer, value);
}

/**
 * Write a raw bytes field (wire type 2) given a Uint8Array.
 * [was: Vf]
 */
export function writeBytesField(encoder, fieldNumber, bytes) {
  writeTag(encoder, fieldNumber, 2);
  writeVarint32(encoder.writer, bytes.length);
  appendChunk(encoder, encoder.writer.end());
  appendChunk(encoder, bytes);
}

/**
 * Write a double field (wire type 1, IEEE-754 64-bit).
 * [was: JQ]
 */
export function writeDoubleField(encoder, fieldNumber, value) {
  if (value == null) return;
  writeTag(encoder, fieldNumber, 1);
  const w = encoder.writer;
  const parseByteRange = _scratchView ?? (_scratchView = new DataView(new ArrayBuffer(8)));
  parseByteRange.setFloat64(0, +value, true);
  writeFixed32(w, parseByteRange.getUint32(0, true));
  writeFixed32(w, parseByteRange.getUint32(4, true));
}

/**
 * Write a float field (wire type 5, IEEE-754 32-bit).
 * [was: inline in GV writer]
 */
export function writeFloatField(encoder, fieldNumber, value) {
  if (value == null) return;
  writeTag(encoder, fieldNumber, 5);
  const w = encoder.writer;
  const parseByteRange = _scratchView ?? (_scratchView = new DataView(new ArrayBuffer(8)));
  parseByteRange.setFloat32(0, +value, true);
  writeFixed32(w, parseByteRange.getUint32(0, true));
}

/**
 * Write an int64 field (wire type 0, signed varint).
 * Handles number, bigint, and string values.
 * [was: R$]
 */
export function writeInt64Field(encoder, fieldNumber, value) {
  if (value == null) return;
  // validation: was ck / Bk
  writeTag(encoder, fieldNumber, 0);
  const w = encoder.writer;

  switch (typeof value) {
    case "number": {
      splitSigned(value);
      writeVarint64(w, getTempLo(), getTempHi());
      break;
    }
    case "bigint": {
      const bits = BigInt.asUintN(64, value);
      const qf = new Int64(
        Number(bits & BigInt(4294967295)),
        Number(bits >> BigInt(32))
      );
      writeVarint64(w, qf.createTimeRanges, qf.hi);
      break;
    }
    default: {
      const qf = parseInt64(value);
      writeVarint64(w, qf.createTimeRanges, qf.hi);
      break;
    }
  }
}

/**
 * Write an enum / int32 varint field (wire type 0).
 * [was: kl]
 */
export function writeEnumField(encoder, fieldNumber, value) {
  if (value == null) return;
  writeTag(encoder, fieldNumber, 0);
  writeSignedVarint32(encoder.writer, value);
}

/**
 * Write a bool field (wire type 0).
 * [was: Yl]
 */
export function writeBoolField(encoder, fieldNumber, value) {
  if (value == null) return;
  value = typeof value === "boolean" ? value : typeof value === "number" ? !!value : undefined;
  if (value == null) return;
  writeTag(encoder, fieldNumber, 0);
  encoder.writer.buf.push(value ? 1 : 0);
}

/**
 * Write a string field (wire type 2).
 * [was: p0]
 */
export function writeStringField(encoder, fieldNumber, value) {
  if (value == null) return;
  const encoded = encodeUTF8(value);
  writeBytesField(encoder, fieldNumber, encoded);
}

/**
 * Write a sub-message field (wire type 2).
 * [was: Qz / Nq]
 */
export function writeMessageField(encoder, fieldNumber, messageArray, descriptorArray, serializeFn) {
  if (messageArray == null) return;
  const bookmark = beginDelimited(encoder, fieldNumber);
  serializeFn(messageArray, encoder);
  endDelimited(encoder, bookmark);
}

/**
 * Write a uint32 field (wire type 0).
 * [was: inline in Jj writer]
 */
export function writeUInt32Field(encoder, fieldNumber, value) {
  if (value == null) return;
  writeTag(encoder, fieldNumber, 0);
  writeVarint32(encoder.writer, value);
}

/**
 * Write a fixed32 field (wire type 5).
 * [was: inline in xuX writer]
 */
export function writeFixed32Field(encoder, fieldNumber, value) {
  if (value == null) return;
  writeTag(encoder, fieldNumber, 5);
  writeFixed32(encoder.writer, value);
}

// ---------------------------------------------------------------------------
// Serialization: encode a message to Uint8Array
// ---------------------------------------------------------------------------

/**
 * Serialize a protobuf message (its internal array) to a Uint8Array.
 * [was: mg]
 */
export function serialize(messageArray, descriptorSpec, serializeFn) {
  const encoder = new ProtoEncoder();
  serializeFn(messageArray, encoder);
  appendChunk(encoder, encoder.writer.end());
  const result = new Uint8Array(encoder.totalBytes);
  const chunks = encoder.chunks;
  let offset = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    result.set(chunk, offset);
    offset += chunk.length;
  }
  encoder.chunks = [result];
  return result;
}

// ---------------------------------------------------------------------------
// UTF-8 encoding helper
// ---------------------------------------------------------------------------

/**
 * Encode a string as UTF-8 bytes.
 * [was: fN]
 */
function encodeUTF8(str) {
  return (_utf8Encoder ?? (_utf8Encoder = new TextEncoder())).encode(str);
}

/** @type {TextEncoder|undefined} */
let _utf8Encoder;

// splitUnsigned / splitSigned are imported from protobuf-reader.js and used
// internally.  Re-exported for consumers that need 64-bit splitting without
// pulling the full reader.
export { splitUnsigned, splitSigned };
