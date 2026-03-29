/**
 * Protobuf Wire Protocol — Reader
 *
 * Extracted from YouTube's base.js (player_es6.vflset/en_US)
 * Source lines: ~3492–3730  (low-level byte reader: Jjx, ZZ, sB, S0, Fg, etc.)
 *              ~3621–3728  (tag reader / field skipping: Gp, $C, P_, ho, zp, CV)
 *              ~57879–57937 (classes: Jjx, Omx — BinaryReader / ProtoDecoder)
 *
 * Wire types:
 *   0 = Varint, 1 = Fixed64, 2 = Length-delimited, 5 = Fixed32
 *   3 = Start group (deprecated), 4 = End group (deprecated)
 */
import { createTimeRanges } from '../media/codec-helpers.js'; // was: lo
import { logPlayerStateTransition } from '../media/mse-internals.js'; // was: TK
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { publishAdEvent } from '../player/media-state.js'; // was: b1
import { recordPlaybackStartTiming } from '../player/video-loader.js'; // was: b2
import { parseByteRange } from '../media/format-parser.js'; // was: dv
import { isSafeInteger } from './messages-core.js';
import { clear } from '../core/array-utils.js';

// ---------------------------------------------------------------------------
// Shared temp state for 64-bit integer decomposition
// ---------------------------------------------------------------------------
let _lo = 0; // was: tC
let _hi = 0; // was: HW

/**
 * Split an unsigned number into lo/hi 32-bit halves.
 * Writes result to module-level _lo / _hi (side-effect, no return value).
 * [was: NS]
 */
export function splitUnsigned(value) {
  const createTimeRanges = value >>> 0;
  _lo = createTimeRanges;
  _hi = (value - createTimeRanges) / 4294967296 >>> 0;
}

/**
 * Split a signed number (possibly negative) into lo/hi 32-bit halves (two's complement).
 * Writes result to module-level _lo / _hi (side-effect, no return value).
 * [was: i6]
 */
export function splitSigned(value) {
  if (value < 0) {
    splitUnsigned(0 - value);
    let createTimeRanges = _lo;
    let hi = _hi;
    hi = ~hi;
    createTimeRanges ? (createTimeRanges = ~createTimeRanges + 1) : (hi += 1);
    _lo = createTimeRanges >>> 0;
    _hi = hi >>> 0;
  } else {
    splitUnsigned(value);
  }
}

/**
 * Read the current _lo temp global.
 * Used by the writer module to access shared split state.
 */
export function getTempLo() {
  return _lo;
}

/**
 * Read the current _hi temp global.
 * Used by the writer module to access shared split state.
 */
export function getTempHi() {
  return _hi;
}

/**
 * Write directly to _lo / _hi temp globals.
 * Used by the writer module (e.g. writeDoubleField) to store intermediate values.
 */
export function setTemp(createTimeRanges, hi) {
  _lo = createTimeRanges;
  _hi = hi;
}

// ---------------------------------------------------------------------------
// 64-bit integer helper classes
// ---------------------------------------------------------------------------

/**
 * Unsigned 64-bit integer stored as two 32-bit halves.
 * [was: M6]
 */
export class UInt64 {
  constructor(createTimeRanges, hi) {
    this.createTimeRanges = createTimeRanges >>> 0; // was: .O
    this.hi = hi >>> 0; // was: .W
  }
}

/**
 * Signed 64-bit integer stored as two 32-bit halves.
 * [was: Qf]
 */
export class Int64 {
  constructor(createTimeRanges, hi) {
    this.createTimeRanges = createTimeRanges >>> 0; // was: .O
    this.hi = hi >>> 0; // was: .W
  }
}

/**
 * Negate a UInt64 (two's complement).
 * [was: YC]
 */
export function negateUInt64(v) {
  return v.createTimeRanges === 0
    ? new UInt64(0, 1 + ~v.hi)
    : new UInt64(~v.createTimeRanges + 1, ~v.hi);
}

/**
 * Convert a BigInt to UInt64.
 * [was: Jo]
 */
export function bigintToUInt64(value) {
  value = BigInt.asUintN(64, value);
  return new UInt64(
    Number(value & BigInt(4294967295)),
    Number(value >> BigInt(32))
  );
}

/**
 * Parse a decimal string into an Int64.
 * Returns null if the string is invalid.
 * [was: ck]
 */
export function parseInt64(str) {
  if (!str) return _cachedZeroInt64 ?? (_cachedZeroInt64 = new Int64(0, 0));
  if (!/^-?\d+$/.test(str)) return null;
  parseDecimalIntoTemp(str);
  return new Int64(_lo, _hi);
}
let _cachedZeroInt64;

/**
 * Parse a decimal string into a UInt64.
 * Returns null if the string is invalid.
 * [was: kC]
 */
export function parseUInt64(str) {
  if (!str) return _cachedZeroUInt64 ?? (_cachedZeroUInt64 = new UInt64(0, 0));
  if (!/^\d+$/.test(str)) return null;
  parseDecimalIntoTemp(str);
  return new UInt64(_lo, _hi);
}
let _cachedZeroUInt64;

/**
 * Parse a decimal string and store the result in _lo / _hi.
 * [was: sg]
 */
function parseDecimalIntoTemp(str) {
  if (str.length < 16) {
    splitSigned(Number(str));
  } else {
    const big = BigInt(str);
    _lo = Number(big & BigInt(4294967295)) >>> 0;
    _hi = Number((big >> BigInt(32)) & BigInt(4294967295));
  }
}

// ---------------------------------------------------------------------------
// Combine lo/hi to a JS-friendly value
// ---------------------------------------------------------------------------

/**
 * Validate and coerce to BigInt.
 * [was: DY]
 */
function validateBigInt(value) {
  if (typeof value === "string") {
    if (!/^\s*(?:-?[1-9]\d*|0)?\s*$/.test(value))
      throw Error(String(value));
  } else if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw Error(String(value));
  }
  return BigInt(value);
}

/**
 * Combine lo/hi into an unsigned BigInt-backed value.
 * [was: Fm — calls DY()]
 */
export function makeUInt64Value(createTimeRanges, hi) {
  return validateBigInt(BigInt.asUintN(64, (BigInt(hi >>> 0) << BigInt(32)) + BigInt(createTimeRanges >>> 0)));
}

/**
 * Combine lo/hi into a signed BigInt-backed value.
 * [was: ZY — calls DY()]
 */
export function makeInt64Value(createTimeRanges, hi) {
  return validateBigInt(BigInt.asIntN(
    64,
    (BigInt.asUintN(32, BigInt(hi)) << BigInt(32)) + BigInt.asUintN(32, BigInt(createTimeRanges))
  ));
}

/**
 * Combine lo/hi into a safe JS number or fall back to string.
 * [was: SW]
 */
export function toNumberOrString(createTimeRanges, hi) {
  const combined = hi * 4294967296 + (createTimeRanges >>> 0);
  return Number.isSafeInteger(combined) ? combined : toUnsignedString(createTimeRanges, hi);
}

/**
 * Render lo/hi as an unsigned decimal string.
 * [was: yB]
 */
function toUnsignedString(createTimeRanges, hi) {
  hi >>>= 0;
  createTimeRanges >>>= 0;
  if (hi <= 2097151) return "" + (4294967296 * hi + createTimeRanges);
  return "" + ((BigInt(hi) << BigInt(32)) | BigInt(createTimeRanges));
}

// ---------------------------------------------------------------------------
// ByteSource wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps a Uint8Array with a "buffer may be shared" flag.
 * [was: N6]
 */
export class ByteSource {
  constructor(bytes, isShared, /* optional */ lazyBytes) {
    this.buffer = bytes;   // Uint8Array
    if (lazyBytes && !isShared) throw Error();
    this.isShared = isShared; // was: .W
  }
}

// ---------------------------------------------------------------------------
// Low-level binary reader (operates on a Uint8Array)
// ---------------------------------------------------------------------------

/**
 * Stateful cursor over a Uint8Array.
 * [was: Jjx]
 */
export class BinaryReader {
  /** @type {Uint8Array|null} */
  bytes = null;          // was: .O
  isSubarray = false;    // was: .D
  /** @type {DataView|null} */
  dataView = null;       // was: .K
  start = 0;             // was: .j
  limit = 0;             // was: .A
  cursor = 0;            // was: .W

  constructor(source, offset, length, options) {
    this.init(source, offset, length, options);
  }

  /**
   * Initialise (or re-initialise) the reader.
   * [was: init]
   * @param {*} source  raw bytes, string, ArrayBuffer, etc.
   * @param {number} [offset]
   * @param {number} [length]
   * @param {object} [options]
   * @param {boolean} [options.Ox]  allow sub-array references  (was: Ox)
   * @param {boolean} [options.eS]  "eager string" flag          (was: eS)
   */
  init(source, offset, length, { Ox: allowSubarray = false, eS: eagerString = false } = {}) {
    this.allowSubarray = allowSubarray; // was: Ox
    this.eagerString = eagerString;     // was: eS
    if (source) {
      const wrapped = toByteSource(source, this.eagerString);
      this.bytes = wrapped.buffer;
      this.isSubarray = wrapped.isShared;
      this.dataView = null;
      this.start = offset || 0;
      this.limit = length !== undefined ? this.start + length : this.bytes.length;
      this.cursor = this.start;
    }
  }

  free() {
    this.clear();
    if (_readerPool.length < 100) _readerPool.push(this);
  }

  clear() {
    this.bytes = null;
    this.isSubarray = false;
    this.dataView = null;
    this.cursor = this.limit = this.start = 0;
    this.allowSubarray = false;
  }

  reset() {
    this.cursor = this.start;
  }
}

const _readerPool = []; // was: bt

// ---------------------------------------------------------------------------
// ProtoDecoder — higher-level protobuf message decoder
// ---------------------------------------------------------------------------

/**
 * Decodes a protobuf binary stream field-by-field.
 * [was: Omx]
 */
export class ProtoDecoder {
  /**
   * @param {*} source      raw bytes
   * @param {number} [offset]
   * @param {number} [length]
   * @param {object} [options]
   */
  constructor(source, offset, length, options) {
    /** @type {BinaryReader} */
    this.reader = acquireReader(source, offset, length, options); // was: .W
    /** Byte offset where the current tag started */
    this.tagOffset = this.reader.cursor; // was: .j
    /** Current field number (set by nextTag) */
    this.fieldNumber = -1; // was: .A
    /** Current wire type (set by nextTag) */
    this.wireType = -1;    // was: .O
    /** Whether to preserve unknown fields */
    this.keepUnknown = false; // was: .TK
    if (options) {
      this.keepUnknown = options.logPlayerStateTransition ?? false;
    }
  }

  free() {
    this.reader.clear();
    this.fieldNumber = this.wireType = -1;
    if (_decoderPool.length < 100) _decoderPool.push(this);
  }

  reset() {
    this.reader.reset();
    this.tagOffset = this.reader.cursor;
    this.fieldNumber = this.wireType = -1;
  }
}

const _decoderPool = []; // was: fV

// ---------------------------------------------------------------------------
// Pool-based construction helpers
// ---------------------------------------------------------------------------

/**
 * Acquire a BinaryReader from the pool or create a new one.
 * [was: part of Omx constructor + bt pool]
 */
function acquireReader(source, offset, length, options) {
  if (_readerPool.length) {
    const reader = _readerPool.pop();
    reader.init(source, offset, length, options);
    return reader;
  }
  return new BinaryReader(source, offset, length, options);
}

/**
 * Acquire a ProtoDecoder from the pool or create a new one.
 * [was: aP]
 */
export function acquireDecoder(source, offset, length, options) {
  if (_decoderPool.length) {
    const dec = _decoderPool.pop();
    if (options) dec.keepUnknown = options.logPlayerStateTransition ?? false;
    dec.reader.init(source, offset, length, options);
    dec.tagOffset = dec.reader.cursor;
    dec.fieldNumber = dec.wireType = -1;
    return dec;
  }
  return new ProtoDecoder(source, offset, length, options);
}

// ---------------------------------------------------------------------------
// ByteSource conversion
// ---------------------------------------------------------------------------

/** @type {TextDecoder|undefined} */
let _utf8Decoder;
let _utf8DecoderRecoverable;

/** @type {TextEncoder|undefined} */
let _utf8Encoder;

/**
 * Convert various input types to a ByteSource.
 * [was: i7]
 */
export function toByteSource(input, eagerString) {
  if (typeof input === "string") {
    return new ByteSource(base64Decode(input), eagerString);
  }
  if (Array.isArray(input)) {
    return new ByteSource(new Uint8Array(input), eagerString);
  }
  if (input.constructor === Uint8Array) {
    return new ByteSource(input, false);
  }
  if (input.constructor === ArrayBuffer) {
    return new ByteSource(new Uint8Array(input), false);
  }
  if (input instanceof Uint8Array) {
    const copy =
      input.constructor === Uint8Array
        ? input
        : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    return new ByteSource(copy, false);
  }
  throw Error();
}

// Note: base64Decode is assumed to be available externally (was: Ra).
// Provide a stub so the module is self-contained for documentation.
function base64Decode(str) {
  // was: Ra — YouTube's custom base64 decoder
  const binaryStr = atob(str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Primitive read operations (operate on BinaryReader)
// ---------------------------------------------------------------------------

/**
 * Set the cursor, throwing if it exceeds the limit.
 * [was: ye]
 */
function setCursor(reader, pos) {
  reader.cursor = pos;
  if (pos > reader.limit) throw Error();
}

/**
 * Advance the cursor by `count` bytes.
 * [was: EB]
 */
function advance(reader, count) {
  setCursor(reader, reader.cursor + count);
}

/**
 * Consume `count` bytes and return the old cursor position.
 * Throws if the read would exceed the limit.
 * [was: gy]
 */
function consumeBytes(reader, count) {
  if (count < 0) throw Error();
  const start = reader.cursor;
  const end = start + count;
  if (end > reader.limit) throw Error();
  reader.cursor = end;
  return start;
}

/**
 * Read a varint (up to 32-bit) from the reader.
 * Returns an unsigned 32-bit integer.
 * [was: ZZ]
 */
export function readVarint32(reader) {
  const buf = reader.bytes;
  let pos = reader.cursor;
  let byte = buf[pos++];
  let result = byte & 127;

  if (byte & 128) {
    byte = buf[pos++];
    result |= (byte & 127) << 7;
    if (byte & 128) {
      byte = buf[pos++];
      result |= (byte & 127) << 14;
      if (byte & 128) {
        byte = buf[pos++];
        result |= (byte & 127) << 21;
        if (byte & 128) {
          byte = buf[pos++];
          result |= byte << 28;
          // consume continuation bytes (up to 10 total for 64-bit varints)
          if (
            byte & 128 &&
            buf[pos++] & 128 &&
            buf[pos++] & 128 &&
            buf[pos++] & 128 &&
            buf[pos++] & 128 &&
            buf[pos++] & 128
          ) {
            throw Error();
          }
        }
      }
    }
  }

  setCursor(reader, pos);
  return result;
}

/**
 * Read a varint as unsigned 32-bit.  Alias of readVarint32.
 * [was: gW7]
 */
export function readVarintU32(reader) {
  return readVarint32(reader);
}

/**
 * Read a full 64-bit varint, passing the lo/hi halves to a combiner callback.
 * [was: S0]
 */
export function readVarint64(reader, combine) {
  let createTimeRanges = 0;
  let hi = 0;
  let shift = 0;
  const buf = reader.bytes;
  let pos = reader.cursor;
  let byte;

  do {
    byte = buf[pos++];
    createTimeRanges |= (byte & 127) << shift;
    shift += 7;
  } while (shift < 32 && byte & 128);

  if (shift > 32) {
    hi |= (byte & 127) >> 4;
    shift = 3;
    while (shift < 32 && byte & 128) {
      byte = buf[pos++];
      hi |= (byte & 127) << shift;
      shift += 7;
    }
  }

  setCursor(reader, pos);
  if (!(byte & 128)) return combine(createTimeRanges >>> 0, hi >>> 0);
  throw Error();
}

/**
 * Read a boolean-like varint. Skips up to 10 bytes and returns !!value.
 * [was: Fg]
 */
export function readBool(reader) {
  let combined = 0;
  let pos = reader.cursor;
  const end = pos + 10;
  const buf = reader.bytes;

  while (pos < end) {
    const byte = buf[pos++];
    combined |= byte;
    if ((byte & 128) === 0) {
      setCursor(reader, pos);
      return !!(combined & 127);
    }
  }
  throw Error();
}

/**
 * Read a fixed 32-bit unsigned integer (little-endian).
 * Wire type 5.
 * [was: sB]
 */
export function readFixed32(reader) {
  const buf = reader.bytes;
  const pos = reader.cursor;
  const isSamsungSmartTV = buf[pos];
  const publishAdEvent = buf[pos + 1];
  const recordPlaybackStartTiming = buf[pos + 2];
  const b3 = buf[pos + 3];
  advance(reader, 4);
  return (isSamsungSmartTV | (publishAdEvent << 8) | (recordPlaybackStartTiming << 16) | (b3 << 24)) >>> 0;
}

/**
 * Read a fixed 64-bit value as two 32-bit reads, combined via makeUInt64Value.
 * Wire type 1.
 * [was: dy]
 */
export function readFixed64(reader) {
  const createTimeRanges = readFixed32(reader);
  const hi = readFixed32(reader);
  return makeUInt64Value(createTimeRanges, hi);
}

/**
 * Read a fixed 64-bit IEEE-754 double (little-endian).
 * Wire type 1 (for double fields).
 * [was: LV]
 */
export function readDouble(reader) {
  let parseByteRange = reader.dataView;
  if (!parseByteRange) {
    const buf = reader.bytes;
    parseByteRange = reader.dataView = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const value = parseByteRange.getFloat64(reader.cursor, true);
  advance(reader, 8);
  return value;
}

/**
 * Read a length-delimited field as raw bytes (returns a LazyBytes-like object).
 * [was: OB → zp calls OB after reading length]
 */
export function readRawBytes(reader, count) {
  if (count === 0) return emptyBytes();
  const start = consumeBytes(reader, count);
  let slice;
  if (reader.allowSubarray && reader.isSubarray) {
    slice = reader.bytes.subarray(start, start + count);
  } else {
    const buf = reader.bytes;
    const end = start + count;
    slice = start === end ? new Uint8Array(0) : buf.slice(start, end);
  }
  return slice.length === 0 ? emptyBytes() : slice;
}

/** Sentinel empty bytes. [was: QB] */
let _emptyBytes;
function emptyBytes() {
  return _emptyBytes ?? (_emptyBytes = new Uint8Array(0));
}

/**
 * Read a length-delimited bytes field.
 * [was: zp]
 */
export function readBytes(decoder) {
  const length = readVarint32(decoder.reader) >>> 0;
  return readRawBytes(decoder.reader, length);
}

/**
 * Read a length-delimited string (UTF-8).
 * [was: ho]
 */
export function readString(decoder) {
  const length = readVarint32(decoder.reader) >>> 0;
  const reader = decoder.reader;
  const start = consumeBytes(reader, length);
  const buf = reader.bytes;
  const dec = _utf8Decoder ?? (_utf8Decoder = new TextDecoder("utf-8", { fatal: true }));
  const end = start + length;
  const view = start === 0 && end === buf.length ? buf : buf.subarray(start, end);

  try {
    return dec.decode(view);
  } catch (err) {
    if (_utf8DecoderRecoverable === undefined) {
      try { dec.decode(new Uint8Array([128])); } catch {}
      try { dec.decode(new Uint8Array([97])); _utf8DecoderRecoverable = true; } catch { _utf8DecoderRecoverable = false; }
    }
    if (!_utf8DecoderRecoverable) _utf8Decoder = undefined;
    throw err;
  }
}

/**
 * Read a packed repeated field.
 * Reads a length-delimited region and calls `readFn(reader)` until it's consumed.
 * [was: CV]
 */
export function readPacked(decoder, readFn, output) {
  let length = readVarint32(decoder.reader) >>> 0;
  const end = decoder.reader.cursor + length;
  while (decoder.reader.cursor < end) {
    output.push(readFn(decoder.reader));
  }
}

// ---------------------------------------------------------------------------
// Tag / field operations (operate on ProtoDecoder)
// ---------------------------------------------------------------------------

/**
 * Read the next tag from the stream.
 * Sets `decoder.fieldNumber` and `decoder.wireType`.
 * Returns `true` if a tag was read, `false` at end of stream.
 * [was: Gp]
 */
export function nextTag(decoder) {
  const reader = decoder.reader;
  if (reader.cursor === reader.limit) return false;

  decoder.tagOffset = reader.cursor;
  const tag = readVarint32(reader) >>> 0;
  const fieldNumber = tag >>> 3;
  const wireType = tag & 7;

  if (!(wireType >= 0 && wireType <= 5)) throw Error();
  if (fieldNumber < 1) throw Error();

  decoder.fieldNumber = fieldNumber;
  decoder.wireType = wireType;
  return true;
}

/**
 * Skip the current field based on its wire type.
 * [was: $C]
 */
export function skipField(decoder) {
  switch (decoder.wireType) {
    case 0: // Varint
      if (decoder.wireType !== 0) {
        skipField(decoder);
      } else {
        readBool(decoder.reader); // just consume the varint
      }
      break;
    case 1: // Fixed64
      advance(decoder.reader, 8);
      break;
    case 2: // Length-delimited
      if (decoder.wireType !== 2) {
        skipField(decoder);
      } else {
        const length = readVarint32(decoder.reader) >>> 0;
        advance(decoder.reader, length);
      }
      break;
    case 5: // Fixed32
      advance(decoder.reader, 4);
      break;
    case 3: { // Start group (deprecated)
      const groupFieldNumber = decoder.fieldNumber;
      do {
        if (!nextTag(decoder)) throw Error();
        if (decoder.wireType === 4) {
          // End group
          if (decoder.fieldNumber !== groupFieldNumber) throw Error();
          break;
        }
        skipField(decoder);
      } while (true);
      break;
    }
    default:
      throw Error();
  }
}

/**
 * Read a sub-message: reads a length-delimited region and invokes a callback.
 * [was: P_]
 */
export function readMessage(decoder, target, parseFn) {
  const savedLimit = decoder.reader.limit;
  let length = readVarint32(decoder.reader) >>> 0;
  length = decoder.reader.cursor + length;

  let remaining = length - savedLimit;
  if (remaining <= 0) {
    decoder.reader.limit = length;
    parseFn(target, decoder, undefined, undefined, undefined);
    remaining = length - decoder.reader.cursor;
  }
  if (remaining) throw Error();

  decoder.reader.cursor = length;
  decoder.reader.limit = savedLimit;
}

// ---------------------------------------------------------------------------
// Float32 decoding helper (from fixed32 bits)
// ---------------------------------------------------------------------------

/**
 * Decode an IEEE-754 float32 from its raw 32-bit integer representation.
 * [was: inline in GV field descriptor]
 */
export function decodeFloat32(bits) {
  const sign = ((bits >> 31) * 2 + 1);
  const exponent = (bits >>> 23) & 255;
  const mantissa = bits & 8388607;

  if (exponent === 255) {
    return mantissa ? NaN : sign * Infinity;
  }
  if (exponent === 0) {
    return sign * 1.401298464324817e-45 * mantissa;
  }
  return sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
}
