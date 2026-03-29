/**
 * BitStream / ByteStream processing classes for gRPC-Web response parsing.
 *
 * Extracted from base.js lines ~8900–9135 (functions), ~62082–63145 (classes),
 * ~63523–64190 (parser implementations and progressive response handling).
 *
 * Contains:
 * - Streaming parsers for protobuf binary, base64-encoded protobuf, JSON, and
 *   JSON+Protobuf (JSPB) envelope formats
 * - Progressive XHR response chunk accumulation and dispatch
 * - Stream event emitter that bridges XHR readystatechange to Node-style events
 * - gRPC-Web call lifecycle management (unary and server-streaming)
 * - gRPC status code mapping utilities
 * - Content-Type–based parser factory
 *
 * @module bitstream-reader
 */

// ---------------------------------------------------------------------------
// gRPC / XHR error description helpers
// ---------------------------------------------------------------------------


import { listen } from '../core/composition-helpers.js'; // was: g.s7
import { XhrConfig } from '../core/event-registration.js'; // was: g.Yd
import { XhrIo } from '../network/request.js'; // was: g.aY
import { resetPlayer } from './source-buffer.js'; // was: on
import { ProtoAny } from './grpc-parser.js'; // was: YZR
import { RpcError } from '../data/event-logging.js'; // was: fZ
import { SlotIdFulfilledEmptyTrigger } from '../ads/ad-trigger-types.js'; // was: Zg
import { AUTH_HASH_ALGORITHMS } from './grpc-parser.js'; // was: VeO
import { getCastInstance } from '../modules/remote/mdx-client.js'; // was: Nx
import { slice, removeAll, concat, splice, remove } from '../core/array-utils.js';
import { startsWith } from '../core/string-utils.js';
import { dispose } from '../ads/dai-cue-range.js';
import { getStatus } from '../core/composition-helpers.js';
import { forEach } from '../core/event-registration.js';
import { setPrototypeOf } from '../core/polyfills.js';
import { getObjectByPath } from '../core/type-helpers.js';
import { getInt32 } from '../proto/wire-format.js'; // was: g.Ao
import { EventHandler } from '../core/event-handler.js'; // was: g.Hx
// TODO: resolve g.RY
// TODO: resolve g.hz
// TODO: resolve g.ku
// TODO: resolve g.td
// TODO: resolve g.zk

/**
 * Maps an HTTP status code to a gRPC status code.
 * [was: LO]
 *
 * @param {number} httpStatus - HTTP status code [was: Q]
 * @returns {number} gRPC status code
 */
export function httpStatusToGrpcCode(httpStatus) { // was: LO
  switch (httpStatus) {
    case 200:
      return 0;
    case 400:
      return 3;
    case 401:
      return 16;
    case 403:
      return 7;
    case 404:
      return 5;
    case 409:
      return 10;
    case 412:
      return 9;
    case 429:
      return 8;
    case 499:
      return 1;
    case 500:
      return 2;
    case 501:
      return 12;
    case 503:
      return 14;
    case 504:
      return 4;
    default:
      return 2;
  }
}

/**
 * Returns a human-readable name for a gRPC status code.
 * [was: W1y]
 *
 * @param {number} code - gRPC status code [was: Q]
 * @returns {string} Status name (e.g. "OK", "CANCELLED", …) or empty string
 */
export function grpcStatusName(code) { // was: W1y
  switch (code) {
    case 0:
      return "OK";
    case 1:
      return "CANCELLED";
    case 2:
      return "UNKNOWN";
    case 3:
      return "INVALID_ARGUMENT";
    case 4:
      return "DEADLINE_EXCEEDED";
    case 5:
      return "NOT_FOUND";
    case 6:
      return "ALREADY_EXISTS";
    case 7:
      return "PERMISSION_DENIED";
    case 16:
      return "UNAUTHENTICATED";
    case 8:
      return "RESOURCE_EXHAUSTED";
    case 9:
      return "FAILED_PRECONDITION";
    case 10:
      return "ABORTED";
    case 11:
      return "OUT_OF_RANGE";
    case 12:
      return "UNIMPLEMENTED";
    case 13:
      return "INTERNAL";
    case 14:
      return "UNAVAILABLE";
    case 15:
      return "DATA_LOSS";
    default:
      return "";
  }
}

/**
 * Returns a human-readable description for an XHR error code.
 * [was: K1d]
 *
 * @param {number} errorCode - XHR-level error code [was: Q]
 * @returns {string} Error description
 */
export function xhrErrorDescription(NetworkErrorCode) { // was: K1d
  switch (NetworkErrorCode) {
    case 0:
      return "No Error";
    case 1:
      return "Access denied to content document";
    case 2:
      return "File not found";
    case 3:
      return "Firefox silently errored";
    case 4:
      return "Application custom error";
    case 5:
      return "An exception occurred";
    case 6:
      return "Http response at 400 or 500 level";
    case 7:
      return "Request was aborted";
    case 8:
      return "Request timed out";
    case 9:
      return "The resource is not available offline";
    default:
      return "Unrecognized error code";
  }
}

// ---------------------------------------------------------------------------
// Stream error helpers
// ---------------------------------------------------------------------------

/**
 * Breaks a base64 stream parser, recording position and throwing.
 * [was: iZ]
 *
 * @param {Base64StreamDecoder} decoder - Decoder instance [was: Q]
 * @param {string} input - Current input chunk [was: c]
 * @param {string} reason - Error description [was: W]
 * @throws {Error} Always throws with a diagnostic message
 */
function breakBase64Stream(decoder, input, reason) { // was: iZ
  decoder.isValid = false; // was: Q.A = !1
  throw Error(
    "The stream is broken @" + decoder.bytesRead + ". Error: " + reason + ". With input:\n" + input // was: Q.O
  );
}

/**
 * Breaks a protobuf stream parser, recording position and throwing.
 * [was: FJ]
 *
 * @param {ProtobufStreamParser} parser - Parser instance [was: Q]
 * @param {Uint8Array|Array} input - Current input bytes [was: c]
 * @param {number} offset - Current offset [was: W]
 * @param {string} reason - Error description [was: m]
 * @throws {Error} Always throws with a diagnostic message
 */
function breakProtobufStream(parser, input, offset, reason) { // was: FJ
  parser.state = 3; // was: Q.W = 3
  parser.errorMessage = // was: Q.D
    "The stream is broken @" + parser.totalBytesRead + "/" + offset + // was: Q.Y
    ". Error: " + reason + ". With input:\n" + input;
  throw Error(parser.errorMessage);
}

/**
 * Breaks a base64-protobuf composite parser, recording position and throwing.
 * [was: E2]
 *
 * @param {Base64ProtobufParser} parser - Parser instance [was: Q]
 * @param {string} input - Current input [was: c]
 * @param {string} reason - Error description [was: W]
 * @throws {Error} Always throws with a diagnostic message
 */
function breakBase64ProtobufParser(parser, input, reason) { // was: E2
  parser.errorMessage = // was: Q.W
    "The stream is broken @" + parser.bytesRead + ". Error: " + reason + // was: Q.O
    ". With input:\n" + input;
  throw Error(parser.errorMessage);
}

/**
 * Breaks a JSON stream parser, recording position and throwing.
 * [was: LG]
 *
 * @param {JsonStreamParser} parser - Parser instance [was: Q]
 * @param {string} input - Current input [was: c]
 * @param {number} offset - Current offset in input [was: W]
 * @throws {Error} Always throws with a diagnostic message
 */
function breakJsonStream(parser, input, offset) { // was: LG
  parser.streamState = 3; // was: Q.K = 3
  parser.errorMessage = // was: Q.Y
    "The stream is broken @" + parser.charsRead + "/" + offset + ". With input:\n" + input; // was: Q.A
  throw Error(parser.errorMessage);
}

/**
 * Returns true if the character is ASCII whitespace (CR, LF, space, tab).
 * [was: s2]
 *
 * @param {string} ch - Single character [was: Q]
 * @returns {boolean}
 */
function isWhitespace(ch) { // was: s2
  return ch == "\r" || ch == "\n" || ch == " " || ch == "\t";
}

// ---------------------------------------------------------------------------
// Base64 stream decoder state  [was: r4x]
// ---------------------------------------------------------------------------

/**
 * Tracks state for an incremental base64 stream decoder. Accumulates
 * base64-encoded text until full 4-character groups can be decoded.
 * [was: r4x]
 */
export class Base64StreamDecoder { // was: r4x
  constructor() {
    /** @type {boolean} Whether the stream is still valid [was: A] */
    this.isValid = true; // was: !0

    /** @type {number} Number of base64 characters consumed so far [was: O] */
    this.bytesRead = 0;

    /** @type {string} Pending base64 characters (partial group) [was: W] */
    this.pending = "";
  }

  /**
   * Returns whether the base64 stream is still in a valid state.
   * [was: r4x.prototype.isInputValid]
   *
   * @returns {boolean}
   */
  isInputValid() { // was: isInputValid
    return this.isValid; // was: this.A
  }
}

// ---------------------------------------------------------------------------
// Protobuf binary stream parser  [was: SX]
// ---------------------------------------------------------------------------

/**
 * Parses a raw protobuf binary stream incrementally. Expects a sequence of
 * tag-length-value (TLV) records where the wire type is always 2
 * (length-delimited) and the field numbers are 1, 2, or 15.
 *
 * State machine:
 *   0 = waiting for tag byte
 *   1 = reading varint length
 *   2 = reading value bytes
 *   3 = broken / error
 * [was: SX]
 */
export class ProtobufStreamParser { // was: SX
  constructor() {
    /** @type {?string} Error message if stream is broken [was: D] */
    this.errorMessage = null;

    /** @type {Array<Object>} Accumulated parsed records for current parse() call [was: J] */
    this.records = [];

    /**
     * @type {number} Current field number being parsed [was: A]
     * Valid values: 1 (data), 2 (status), 15 (internal)
     */
    this.fieldNumber = 0;

    /**
     * @type {number} Parser state [was: W]
     * 0=waiting-for-tag, 1=reading-length, 2=reading-value, 3=broken
     */
    this.state = 0;

    /** @type {number} Total bytes read across all parse() calls [was: Y] */
    this.totalBytesRead = 0;

    /** @type {number} Number of varint bytes read for current length [was: j] */
    this.varintBytesRead = 0;

    /** @type {?Uint8Array|?Array} Current value buffer [was: K] */
    this.valueBuffer = null;

    /** @type {number} Decoded length of current value [was: O] */
    this.valueLength = 0;

    /** @type {number} Bytes read into current value buffer [was: L] */
    this.valueBytesRead = 0;
  }

  /**
   * Returns whether the stream is still valid (not broken).
   * [was: SX.prototype.isInputValid]
   *
   * @returns {boolean}
   */
  isInputValid() {
    return this.state != 3; // was: this.W != 3
  }

  /**
   * Returns the error message if the stream is broken, or null.
   * [was: SX.prototype.eB]
   *
   * @returns {?string}
   */
  getError() { // was: eB
    return this.errorMessage; // was: this.D
  }

  /**
   * Returns true — this parser handles binary (Uint8Array) input.
   * [was: SX.prototype.Tv]
   *
   * @returns {boolean}
   */
  isBinaryParser() { // was: Tv
    return true; // was: !0
  }

  /**
   * Parses a chunk of protobuf binary data.
   * [was: SX.prototype.parse]
   *
   * @param {Uint8Array|Array<number>} chunk - Raw bytes to parse [was: Q]
   * @returns {?Array<Object>} Array of parsed field objects, or null if none complete
   */
  parse(chunk) { // was: SX.prototype.parse
    /**
     * Reads and validates a tag byte. Must have wire type 2 (length-delimited)
     * and field number 1, 2, or 15.
     * [was: nested c]
     */
    const readTag = (byte) => { // was: c(I)
      byte & 128 && breakProtobufStream(parser, bytes, offset, "invalid tag");
      (byte & 7) != 2 && breakProtobufStream(parser, bytes, offset, "invalid wire type");
      parser.fieldNumber = byte >>> 3; // was: T.A = I >>> 3
      parser.fieldNumber != 1 && parser.fieldNumber != 2 && parser.fieldNumber != 15 &&
        breakProtobufStream(parser, bytes, offset, "unexpected tag");
      parser.state = 1; // was: T.W = 1
      parser.valueLength = 0; // was: T.O = 0
      parser.varintBytesRead = 0; // was: T.j = 0
    };

    /**
     * Reads one byte of the varint-encoded length. When all bytes are consumed,
     * allocates the value buffer and transitions to state 2.
     * [was: nested W]
     */
    const readLengthByte = (byte) => { // was: W(I)
      parser.varintBytesRead++; // was: T.j++
      parser.varintBytesRead == 5 && byte & 240 &&
        breakProtobufStream(parser, bytes, offset, "message length too long");
      parser.valueLength |= (byte & 127) << (parser.varintBytesRead - 1) * 7; // was: T.O |= ...
      if (!(byte & 128)) {
        parser.state = 2; // was: T.W = 2
        parser.valueBytesRead = 0; // was: T.L = 0
        parser.valueBuffer = // was: T.K = ...
          typeof Uint8Array !== "undefined"
            ? new Uint8Array(parser.valueLength)
            : Array(parser.valueLength);
        if (parser.valueLength == 0) {
          finishValue();
        }
      }
    };

    /**
     * Reads one byte into the value buffer. When full, calls finishValue().
     * [was: nested m]
     */
    const readValueByte = (byte) => { // was: m(I)
      parser.valueBuffer[parser.valueBytesRead++] = byte; // was: T.K[T.L++] = I
      if (parser.valueBytesRead == parser.valueLength) { // was: T.L == T.O
        finishValue();
      }
    };

    /**
     * Pushes the completed field record and resets state to 0.
     * Fields with number >= 15 are silently dropped (internal).
     * [was: nested K]
     */
    const finishValue = () => { // was: K()
      if (parser.fieldNumber < 15) { // was: T.A < 15
        const record = {}; // was: I
        record[parser.fieldNumber] = parser.valueBuffer; // was: I[T.A] = T.K
        parser.records.push(record); // was: T.J.push(I)
      }
      parser.state = 0; // was: T.W = 0
    };

    const parser = this; // was: T
    const bytes = chunk instanceof Array ? chunk : new Uint8Array(chunk); // was: r
    let offset = 0; // was: U

    for (; offset < bytes.length;) {
      switch (parser.state) {
        case 3:
          breakProtobufStream(parser, bytes, offset, "stream already broken");
          break;
        case 0:
          readTag(bytes[offset]);
          break;
        case 1:
          readLengthByte(bytes[offset]);
          break;
        case 2:
          readValueByte(bytes[offset]);
          break;
        default:
          throw Error("unexpected parser state: " + parser.state);
      }
      parser.totalBytesRead++; // was: T.Y++
      offset++;
    }

    const results = parser.records; // was: Q = T.J
    parser.records = []; // was: T.J = []
    return results.length > 0 ? results : null;
  }
}

// ---------------------------------------------------------------------------
// Base64-encoded protobuf stream parser  [was: ZA]
// ---------------------------------------------------------------------------

/**
 * Parses a base64-encoded protobuf stream. Accumulates base64 text, decodes
 * complete 4-char groups, and feeds the binary output into a
 * {@link ProtobufStreamParser}.
 * [was: ZA]
 */
export class Base64ProtobufParser { // was: ZA
  constructor() {
    /** @type {?string} Error message, or null if valid [was: W] */
    this.errorMessage = null;

    /** @type {number} Total characters consumed [was: O] */
    this.bytesRead = 0;

    /** @type {Base64StreamDecoder} Base64 incremental decoder [was: A] */
    this.base64Decoder = new Base64StreamDecoder(); // was: new r4x

    /** @type {ProtobufStreamParser} Binary protobuf parser [was: j] */
    this.protobufParser = new ProtobufStreamParser(); // was: new SX
  }

  /**
   * Returns whether the stream is still valid.
   * [was: ZA.prototype.isInputValid]
   *
   * @returns {boolean}
   */
  isInputValid() {
    return this.errorMessage === null; // was: this.W === null
  }

  /**
   * Returns the error message, or null if the stream is valid.
   * [was: ZA.prototype.eB]
   *
   * @returns {?string}
   */
  getError() { // was: eB
    return this.errorMessage; // was: this.W
  }

  /**
   * Returns false — this parser handles text (string) input, not binary.
   * [was: ZA.prototype.Tv]
   *
   * @returns {boolean}
   */
  isBinaryParser() { // was: Tv
    return false; // was: !1
  }

  /**
   * Parses a chunk of base64-encoded protobuf text.
   * [was: ZA.prototype.parse]
   *
   * @param {string} input - Base64-encoded string chunk [was: Q]
   * @returns {?Array<Object>} Parsed records, or null
   */
  parse(input) { // was: ZA.prototype.parse
    this.errorMessage !== null && breakBase64ProtobufParser(this, input, "stream already broken");

    let parsedRecords = null; // was: c
    try {
      {
        const decoder = this.base64Decoder; // was: W = this.A
        decoder.isValid || breakBase64Stream(decoder, input, "stream already broken");
        decoder.pending += input; // was: W.W += Q

        const fullGroupCount = Math.floor(decoder.pending.length / 4); // was: T
        let decodedBytes; // was: m

        if (fullGroupCount == 0) {
          decodedBytes = null;
        } else {
          let binaryData; // was: K
          try {
            binaryData = g.zk(decoder.pending.slice(0, fullGroupCount * 4)); // was: zk(...)
          } catch (err) { // was: r
            breakBase64Stream(decoder, decoder.pending, err.message);
          }
          decoder.bytesRead += fullGroupCount * 4; // was: W.O += T * 4
          decoder.pending = decoder.pending.slice(fullGroupCount * 4); // was: W.W = W.W.slice(T * 4)
          decodedBytes = binaryData;
        }
      // Note: `decodedBytes` is set in the block above; feed into protobuf parser
        parsedRecords = decodedBytes === null ? null : this.protobufParser.parse(decodedBytes);
      }
    } catch (err) { // was: T
      breakBase64ProtobufParser(this, input, err.message);
    }
    this.bytesRead += input.length; // was: this.O += Q.length
    return parsedRecords;
  }
}

// ---------------------------------------------------------------------------
// JSON streaming parser  [was: dC]
// ---------------------------------------------------------------------------

/**
 * Incrementally parses a JSON stream that wraps an array of top-level values.
 * Expects input of the form `[ value, value, … ]` delivered in arbitrary-sized
 * text chunks.
 *
 * State machine (streamState / K):
 *   0 = waiting for opening `[`
 *   1 = inside top-level array, parsing values
 *   2 = done (closing `]` seen)
 *   3 = broken / error
 *
 * Inner value parser states (valueState / W):
 *   0 = expecting `{` or `[`
 *   1 = expecting value
 *   2–8 = object/key/value states
 *   9–15 = literal true/false
 *   16–18 = literal null
 *   19–20 = number
 * [was: dC]
 *
 * @param {Object} [options] - Parser options [was: Q]
 * @param {boolean} [options.Yw] - If true, keep values as raw strings [was: Q.Yw → mF]
 */
export class JsonStreamParser { // was: dC
  constructor(options) { // was: dC(Q)
    /** @type {?string} Error message if broken [was: Y] */
    this.errorMessage = null;

    /** @type {Array} Parsed top-level values accumulated during current parse() [was: D] */
    this.results = [];

    /** @type {string} Leftover text from previous chunk for continuation [was: j] */
    this.leftover = "";

    /** @type {Array<number>} State stack for nested structures [was: S] */
    this.stateStack = [];

    /** @type {number} Characters read across all parse() calls [was: A] */
    this.charsRead = 0;

    /** @type {number} Object nesting depth [was: O] */
    this.depth = 0;

    /** @type {boolean} Escape-in-string flag [was: J] */
    this.inEscape = false; // was: !1

    /** @type {number} Unicode escape counter in string [was: L] */
    this.unicodeEscapeCount = 0;

    /** @type {RegExp} Pattern for backslash / double-quote in string scanning [was: b0] */
    this.escapePattern = /[\\"]/g;

    /**
     * @type {number} Stream-level state [was: K]
     * 0=before-open, 1=in-array, 2=done, 3=broken
     */
    this.streamState = 0;

    /** @type {number} Value-level state [was: W] */
    this.valueState = 0;

    /** @type {boolean} Whether to keep parsed values as raw strings [was: mF] */
    this.keepRawStrings = !(!options || !options.Yw); // was: !(!Q || !Q.Yw)
  }

  /**
   * Returns whether the stream is still valid (not broken).
   * [was: dC.prototype.isInputValid]
   *
   * @returns {boolean}
   */
  isInputValid() {
    return this.streamState != 3; // was: this.K != 3
  }

  /**
   * Returns the error message, or null.
   * [was: dC.prototype.eB]
   *
   * @returns {?string}
   */
  getError() { // was: eB
    return this.errorMessage; // was: this.Y
  }

  /**
   * Returns true if the entire top-level array has been consumed.
   * [was: dC.prototype.done]
   *
   * @returns {boolean}
   */
  done() {
    return this.streamState === 2; // was: this.K === 2
  }

  /**
   * Returns false — this parser handles text input.
   * [was: dC.prototype.Tv]
   *
   * @returns {boolean}
   */
  isBinaryParser() { // was: Tv
    return false; // was: !1
  }

  /**
   * Parses the next chunk of JSON text from the stream.
   * [was: dC.prototype.parse]
   *
   * @param {string} input - Text chunk [was: Q]
   * @returns {?Array} Array of parsed top-level values, or null
   */
  parse(input) { // was: dC.prototype.parse

    /**
     * Skips whitespace starting at current position.
     * Returns true if non-whitespace characters remain.
     * [was: nested c]
     */
    const skipWhitespace = () => {
      for (; cursor < input.length;) {
        if (isWhitespace(input[cursor])) {
          cursor++;
          parser.charsRead++;
        } else {
          break;
        }
      }
      return cursor < inputLength; // was: e < I
    };

    /**
     * Main value-level parser loop. Consumes characters from `input`
     * according to the current valueState and transitions as needed.
     * [was: nested W]
     */
    const parseValues = () => {
      let ch; // was: B
      for (;;) {
        ch = input[cursor++];
        if (!ch) break;
        parser.charsRead++; // was: T.A++

        switch (parser.valueState) { // was: T.W
          case 0:
            ch === "{" ? (parser.valueState = 2) :
            ch === "[" ? (parser.valueState = 4) :
            isWhitespace(ch) || breakJsonStream(parser, input, cursor);
            continue;
          case 7:
          case 2:
            if (isWhitespace(ch)) continue;
            if (parser.valueState === 7) {
              stateStack.push(8);
            } else if (ch === "}") {
              emitValue("{}");
              parser.valueState = popState();
              continue;
            } else {
              stateStack.push(3);
            }
            ch === '"' ? (parser.valueState = 6) : breakJsonStream(parser, input, cursor);
            continue;
          case 8:
          case 3:
            if (isWhitespace(ch)) continue;
            if (ch === ":") {
              if (parser.valueState === 3) {
                stateStack.push(3);
                parser.depth++;
              }
              parser.valueState = 1;
            } else if (ch === "}") {
              parser.depth--;
              emitValue();
              parser.valueState = popState();
            } else if (ch === ",") {
              if (parser.valueState === 3) stateStack.push(3);
              parser.valueState = 7;
            } else {
              breakJsonStream(parser, input, cursor);
            }
            continue;
          case 4:
          case 1:
            if (isWhitespace(ch)) continue;
            if (parser.valueState === 4) {
              parser.depth++;
              parser.valueState = 1;
              if (ch === "]") {
                parser.depth--;
                if (parser.depth === 0) {
                  parser.valueState = 5;
                  return;
                }
                emitValue("[]");
                parser.valueState = popState();
                continue;
              } else {
                stateStack.push(5);
              }
            }
            if (ch === '"') parser.valueState = 6;
            else if (ch === "{") parser.valueState = 2;
            else if (ch === "[") parser.valueState = 4;
            else if (ch === "t") parser.valueState = 9;
            else if (ch === "f") parser.valueState = 12;
            else if (ch === "n") parser.valueState = 16;
            else if (ch !== "-") {
              "0123456789".indexOf(ch) !== -1
                ? (parser.valueState = 20)
                : breakJsonStream(parser, input, cursor);
            }
            continue;
          case 5:
            if (ch === ",") {
              stateStack.push(5);
              parser.valueState = 1;
              if (parser.depth === 1) valueStartPos = cursor; // was: A = e
            } else if (ch === "]") {
              parser.depth--;
              if (parser.depth === 0) return;
              emitValue();
              parser.valueState = popState();
            } else if (isWhitespace(ch)) {
              continue;
            } else {
              breakJsonStream(parser, input, cursor);
            }
            continue;
          case 6: {
            const stringStart = cursor; // was: n
            a: for (;;) {
              for (; parser.unicodeEscapeCount > 0;) {
                ch = input[cursor++];
                if (parser.unicodeEscapeCount === 4) parser.unicodeEscapeCount = 0;
                else parser.unicodeEscapeCount++;
                if (!ch) break a;
              }
              if (ch === '"' && !parser.inEscape) {
                parser.valueState = popState();
                break;
              }
              if (ch === "\\" && !parser.inEscape) {
                parser.inEscape = true;
                ch = input[cursor++];
                if (!ch) break;
              }
              if (parser.inEscape) {
                parser.inEscape = false;
                if (ch === "u") parser.unicodeEscapeCount = 1;
                ch = input[cursor++];
                if (ch) continue;
                else break;
              }
              escapePattern.lastIndex = cursor;
              ch = escapePattern.exec(input);
              if (!ch) {
                cursor = input.length + 1;
                break;
              }
              cursor = ch.index + 1;
              ch = input[ch.index];
              if (!ch) break;
            }
            parser.charsRead += cursor - stringStart; // was: T.A += e - n
            continue;
          }
          // true: t → r → u → e
          case 9:
            if (!ch) continue;
            ch === "r" ? (parser.valueState = 10) : breakJsonStream(parser, input, cursor);
            continue;
          case 10:
            if (!ch) continue;
            ch === "u" ? (parser.valueState = 11) : breakJsonStream(parser, input, cursor);
            continue;
          case 11:
            if (!ch) continue;
            ch === "e" ? (parser.valueState = popState()) : breakJsonStream(parser, input, cursor);
            continue;
          // false: f → a → l → s → e
          case 12:
            if (!ch) continue;
            ch === "a" ? (parser.valueState = 13) : breakJsonStream(parser, input, cursor);
            continue;
          case 13:
            if (!ch) continue;
            ch === "l" ? (parser.valueState = 14) : breakJsonStream(parser, input, cursor);
            continue;
          case 14:
            if (!ch) continue;
            ch === "s" ? (parser.valueState = 15) : breakJsonStream(parser, input, cursor);
            continue;
          case 15:
            if (!ch) continue;
            ch === "e" ? (parser.valueState = popState()) : breakJsonStream(parser, input, cursor);
            continue;
          // null: n → u → l → l
          case 16:
            if (!ch) continue;
            ch === "u" ? (parser.valueState = 17) : breakJsonStream(parser, input, cursor);
            continue;
          case 17:
            if (!ch) continue;
            ch === "l" ? (parser.valueState = 18) : breakJsonStream(parser, input, cursor);
            continue;
          case 18:
            if (!ch) continue;
            ch === "l" ? (parser.valueState = popState()) : breakJsonStream(parser, input, cursor);
            continue;
          // negative number: - → digit
          case 19:
            ch === "." ? (parser.valueState = 20) : breakJsonStream(parser, input, cursor);
            continue;
          // number body
          case 20:
            if ("0123456789.eE+-".indexOf(ch) !== -1) continue;
            else {
              cursor--;
              parser.charsRead--;
              parser.valueState = popState();
            }
            continue;
          default:
            breakJsonStream(parser, input, cursor);
        }
      }
    };

    /**
     * Pops a state from the state stack, defaulting to 1 (expecting value).
     * [was: nested m]
     */
    const popState = () => { // was: m()
      const state = stateStack.pop(); // was: B
      return state != null ? state : 1;
    };

    /**
     * Emits a top-level value. At depth > 1, values are part of nested
     * structures and are not emitted. The raw text or parsed JSON is pushed
     * to results[].
     * [was: nested K]
     *
     * @param {string} [literal] - Optional literal for empty containers [was: B]
     */
    const emitValue = (literal) => { // was: K(B)
      if (parser.depth > 1) return;
      if (!literal) {
        literal = (valueStartPos === -1)
          ? parser.leftover + input.substring(chunkStart, cursor) // was: T.j + Q.substring(X, e)
          : input.substring(valueStartPos, cursor); // was: Q.substring(A, e)
      }
      if (parser.keepRawStrings) { // was: T.mF
        parser.results.push(literal);
      } else {
        parser.results.push(JSON.parse(literal));
      }
      valueStartPos = cursor; // was: A = e
    };

    const parser = this; // was: T
    const stateStack = parser.stateStack; // was: r
    const escapePattern = parser.escapePattern; // was: U
    const inputLength = input.length; // was: I
    let chunkStart = 0; // was: X
    let valueStartPos = -1; // was: A
    let cursor = 0; // was: e

    for (; cursor < inputLength;) {
      switch (parser.streamState) { // was: T.K
        case 3:
          breakJsonStream(parser, input, cursor);
          return null;
        case 2:
          skipWhitespace() && breakJsonStream(parser, input, cursor);
          return null;
        case 0:
          if (skipWhitespace()) {
            const firstChar = input[cursor++]; // was: V
            parser.charsRead++; // was: T.A++
            if (firstChar === "[") {
              parser.streamState = 1; // was: T.K = 1
              chunkStart = cursor; // was: X = e
              parser.valueState = 4; // was: T.W = 4
              continue;
            } else {
              breakJsonStream(parser, input, cursor);
            }
          }
          return null;
        case 1:
          parseValues();
          if (parser.depth === 0 && parser.valueState == 5) {
            parser.streamState = 2; // was: T.K = 2
            parser.leftover = input.substring(cursor); // was: T.j = Q.substring(e)
          } else {
            parser.leftover = (valueStartPos === -1)
              ? parser.leftover + input.substring(chunkStart) // was: T.j + Q.substring(X)
              : input.substring(valueStartPos); // was: Q.substring(A)
          }
          if (parser.results.length > 0) {
            const output = parser.results; // was: V
            parser.results = [];
            return output;
          }
          return null;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// JSON+Protobuf (JSPB) envelope parser  [was: wC]
// ---------------------------------------------------------------------------

/**
 * Parses a gRPC-Web JSON+Protobuf envelope stream. The wire format is:
 *   `[ [data0, data1, …], statusObj ]`
 * where the outer array is streamed incrementally. Uses a nested
 * {@link JsonStreamParser} to consume each sub-array.
 *
 * State machine (outerState / O):
 *   0 = waiting for outer `[`
 *   1 = expecting data sub-array `[`
 *   2 = inside data sub-array
 *   3 = between data and status sub-arrays (expecting `,`)
 *   4 = inside status sub-array
 *   5 = done (outer `]` seen)
 *   6 = broken / error
 * [was: wC]
 */
export class JspbEnvelopeParser { // was: wC
  constructor() {
    /** @type {?string} Error message, or null if valid [was: K] */
    this.errorMessage = null;

    /** @type {?JsonStreamParser} Inner JSON parser for current sub-array [was: A] */
    this.innerParser = null;

    /** @type {number} Outer parser state [was: O] */
    this.outerState = 0;

    /** @type {number} Characters consumed in the outer layer [was: W] */
    this.outerCharsRead = 0;

    /** @type {Array<Object>} Accumulated tagged results [was: j] */
    this.taggedResults = [];

    /** @type {boolean} Whether a status sub-array has been seen [was: D] */
    this.hasStatus = false; // was: !1
  }

  /**
   * Returns whether the stream is still valid.
   * [was: wC.prototype.isInputValid]
   *
   * @returns {boolean}
   */
  isInputValid() {
    return this.errorMessage === null; // was: this.K === null
  }

  /**
   * Returns the error message, or null.
   * [was: wC.prototype.eB]
   *
   * @returns {?string}
   */
  getError() { // was: eB
    return this.errorMessage; // was: this.K
  }

  /**
   * Returns false — this parser handles text input.
   * [was: wC.prototype.Tv]
   *
   * @returns {boolean}
   */
  isBinaryParser() { // was: Tv
    return false; // was: !1
  }

  /**
   * Parses a chunk of the JSPB envelope stream.
   * [was: wC.prototype.parse]
   *
   * @param {string} input - Text chunk [was: Q]
   * @returns {?Array<Object>} Tagged records ({1: dataValue} or {2: statusValue}), or null
   */
  parse(input) { // was: wC.prototype.parse
    const parser = this; // was: T

    /**
     * Breaks the envelope stream with an error.
     * [was: nested c]
     */
    const breakStream = (reason) => { // was: c(I)
      parser.outerState = 6; // was: T.O = 6
      parser.errorMessage =
        "The stream is broken @" + parser.outerCharsRead + "/" + pos + // was: T.W + "/" + r
        ". Error: " + reason + ". With input:\n";
      throw Error(parser.errorMessage);
    };

    /**
     * Creates a fresh inner JsonStreamParser for the next sub-array.
     * [was: nested W]
     */
    const createInnerParser = () => { // was: W()
      parser.innerParser = new JsonStreamParser({ // was: T.A = new dC({...})
        YO0: true, // was: !0
        Yw: true   // was: !0
      });
    };

    /**
     * Wraps parsed data values as tagged records with field key "1".
     * [was: nested m]
     */
    const tagDataResults = (values) => { // was: m(I)
      if (values) {
        for (let i = 0; i < values.length; i++) { // was: X
          const record = {};
          record[1] = values[i]; // was: A[1] = I[X]
          parser.taggedResults.push(record); // was: T.j.push(A)
        }
      }
    };

    /**
     * Wraps parsed status value as a tagged record with field key "2".
     * [was: nested K]
     */
    const tagStatusResult = (values) => { // was: K(I)
      if (values) {
        (parser.hasStatus || values.length > 1) && breakStream("extra status: " + values);
        parser.hasStatus = true; // was: T.D = !0
        const record = {};
        record[2] = values[0]; // was: X[2] = I[0]
        parser.taggedResults.push(record);
      }
    };

    let pos = 0; // was: r

    for (; pos < input.length;) {
      let atNonWhitespace; // was: U

      // Skip whitespace when not in state 2 (inside data sub-array)
      if (atNonWhitespace = parser.outerState !== 2) {
        a: {
          for (; pos < input.length;) {
            if (!isWhitespace(input[pos])) {
              atNonWhitespace = true;
              break a;
            }
            pos++;
            parser.outerCharsRead++;
          }
          atNonWhitespace = false;
        }
        atNonWhitespace = !atNonWhitespace;
      }
      if (atNonWhitespace) return null;

      switch (parser.outerState) {
        case 6:
          breakStream("stream already broken");
          break;
        case 0:
          input[pos] === "["
            ? (parser.outerState = 1, pos++, parser.outerCharsRead++)
            : breakStream("unexpected input token");
          break;
        case 1:
          if (input[pos] === "[") {
            parser.outerState = 2;
            createInnerParser();
          } else if (input[pos] === "," || input.slice(pos, pos + 5) == "null,") {
            parser.outerState = 3;
          } else if (input[pos] === "]") {
            parser.outerState = 5;
            pos++;
            parser.outerCharsRead++;
          } else {
            breakStream("unexpected input token");
          }
          break;
        case 2: {
          const dataValues = parser.innerParser.parse(input.substring(pos)); // was: U = T.A.parse(...)
          tagDataResults(dataValues);
          if (parser.innerParser.done()) {
            parser.outerState = 3;
            const remainder = parser.innerParser.leftover; // was: U = T.A.j
            parser.outerCharsRead += input.length - pos - remainder.length;
            input = remainder; // was: Q = U
            pos = 0;
          } else {
            parser.outerCharsRead += input.length - pos;
            pos = input.length;
          }
          break;
        }
        case 3:
          if (input[pos] === "," || input.slice(pos, pos + 5) == "null,") {
            parser.outerState = 4;
            createInnerParser();
            parser.innerParser.parse("["); // was: T.A.parse("[")
            pos += input[pos] === "," ? 1 : 5;
            parser.outerCharsRead++;
          } else if (input[pos] === "]") {
            parser.outerState = 5;
            pos++;
            parser.outerCharsRead++;
          }
          break;
        case 4: {
          const statusValues = parser.innerParser.parse(input.substring(pos)); // was: U = T.A.parse(...)
          tagStatusResult(statusValues);
          if (parser.innerParser.done()) {
            parser.outerState = 5;
            const remainder = parser.innerParser.leftover; // was: U = T.A.j
            parser.outerCharsRead += input.length - pos - remainder.length;
            input = remainder; // was: Q = U
            pos = 0;
          } else {
            parser.outerCharsRead += input.length - pos;
            pos = input.length;
          }
          break;
        }
        case 5:
          breakStream("extra input after stream end");
      }
    }

    return parser.taggedResults.length > 0
      ? (input = parser.taggedResults, parser.taggedResults = [], input) // was: Q = T.j, T.j = [], Q
      : null;
  }
}

// ---------------------------------------------------------------------------
// Content-Type → parser factory  [was: Uf3]
// ---------------------------------------------------------------------------

/**
 * Creates the appropriate stream parser for the given XHR response based on
 * its Content-Type header.
 * [was: Uf3]
 *
 * @param {Object} xhr - XHR wrapper [was: Q]
 * @returns {?ProtobufStreamParser|?Base64ProtobufParser|?JspbEnvelopeParser|?JsonStreamParser}
 *          A parser instance, or null if the Content-Type is unrecognised
 */
export function createParserForResponse(xhr) { // was: Uf3
  let contentType = g.ku(xhr, "Content-Type"); // was: c
  if (!contentType) return null;
  contentType = contentType.toLowerCase();

  if (contentType.startsWith("application/json")) {
    return contentType.startsWith("application/json+protobuf")
      ? new JspbEnvelopeParser()  // was: new wC
      : new JsonStreamParser();   // was: new dC
  }

  if (contentType.startsWith("application/x-protobuf")) {
    const encoding = g.ku(xhr, "Content-Transfer-Encoding"); // was: Q
    if (encoding) {
      return encoding.toLowerCase() == "base64"
        ? new Base64ProtobufParser() // was: new ZA
        : null;
    }
    return new ProtobufStreamParser(); // was: new SX
  }

  return null;
}

// ---------------------------------------------------------------------------
// Progressive response status helpers  [was: bZ, jX]
// ---------------------------------------------------------------------------

/**
 * Updates the status code on a ProgressiveResponseHandler and notifies
 * its status callback.
 * [was: bZ]
 *
 * @param {ProgressiveResponseHandler} handler - Handler instance [was: Q]
 * @param {number} newStatus - New status code [was: c]
 */
function setResponseStatus(handler, newStatus) { // was: bZ
  if (handler.status != newStatus) { // was: Q.K != c
    handler.status = newStatus; // was: Q.K = c
    handler.statusCallback && handler.statusCallback(); // was: Q.J && Q.J()
  }
}

/**
 * Cleans up a ProgressiveResponseHandler — removes event listeners and
 * aborts/disposes the underlying XHR.
 * [was: jX]
 *
 * @param {ProgressiveResponseHandler} handler - Handler instance [was: Q]
 */
function cleanupResponse(handler) { // was: jX
  handler.eventHandler.removeAll(); // was: Q.L.removeAll()
  if (handler.xhr) { // was: Q.W
    const xhr = handler.xhr; // was: c
    handler.xhr = null; // was: Q.W = null
    xhr.abort();
    xhr.dispose();
  }
}

// ---------------------------------------------------------------------------
// Progressive XHR response handler  [was: Bfx]
// ---------------------------------------------------------------------------

/**
 * Monitors an XHR's readystatechange events and progressively parses its
 * response body using a Content-Type–appropriate parser. Supports both
 * binary (Uint8Array chunks via fetch/ReadableStream) and text (responseText)
 * input paths.
 *
 * Status codes emitted via {@link setResponseStatus}:
 *   1 = readable (data available)
 *   2 = ended (complete, with body)
 *   3 = HTTP error
 *   4 = ended (complete, no body)
 *   5 = parse error / no parser
 *   6 = exception
 *   7 = abort (was timeout)
 *   8 = timeout (was abort)
 * [was: Bfx]
 */
export class ProgressiveResponseHandler { // was: Bfx
  /**
   * @param {Object} xhr - The XHR wrapper to monitor [was: Q]
   */
  constructor(xhr) { // was: Bfx(Q)
    /** @type {Object} The underlying XHR [was: W] */
    this.xhr = xhr;

    /** @type {?Object} Parser created from Content-Type [was: O] */
    this.parser = null;

    /** @type {number} Number of binary chunks already processed [was: A] */
    this.processedChunkCount = 0;

    /** @type {number} Current status code [was: K] (see class doc) */
    this.status = 0;

    /** @type {boolean} Whether binary (Uint8Array) chunks were detected [was: Y] */
    this.isBinaryMode = false; // was: !1

    /** @type {?Function} Data callback — receives parsed results [was: j] */
    this.dataCallback = null;

    /** @type {?Function} Status change callback [was: J] */
    this.statusCallback = null;

    /** @type {?TextDecoder} Lazy-initialised text decoder for binary→text [was: D] */
    this.textDecoder = null;

    /** @type {Object} Event handler subscription manager [was: L] */
    this.eventHandler = new EventHandler(this);
    this.eventHandler.listen(this.xhr, "readystatechange", this.onReadyStateChange); // was: this.L.listen(this.W, "readystatechange", this.mF)
  }

  /**
   * Returns the underlying XHR.
   * [was: Bfx.prototype.Ew]
   *
   * @returns {Object}
   */
  getXhr() { // was: Ew
    return this.xhr; // was: this.W
  }

  /**
   * Returns the current handler status code.
   * [was: Bfx.prototype.getStatus]
   *
   * @returns {number}
   */
  getStatus() {
    return this.status; // was: this.K
  }

  /**
   * Handles readystatechange events from the XHR. Detects binary vs text
   * mode, creates a parser on first headers, and feeds incremental data
   * to the parser.
   * [was: Bfx.prototype.mF]
   *
   * @param {Event} event - The readystatechange event [was: Q]
   */
  onReadyStateChange(event) { // was: mF(Q)
    event = event.target; // was: Q = Q.target
    try {
      if (event == this.xhr) {
        a: {
          const readyState = g.hz(this.xhr); // was: T = g.hz(this.W)
          let xhrError = this.xhr.O; // was: c = this.W.O
          let httpStatus = this.xhr.getStatus(); // was: W = this.W.getStatus()
          const responseText = this.xhr.getResponseText(); // was: g.MA(this.W)
          let binaryChunks = []; // was: Q = []

          // Detect binary Uint8Array chunk array from fetch body
          if (this.xhr.getResponse() instanceof Array) { // was: g.Jz(this.W)
            const chunks = this.xhr.getResponse(); // was: g.Jz(this.W)
            if (chunks.length > 0 && chunks[0] instanceof Uint8Array) {
              this.isBinaryMode = true; // was: this.Y = !0
              binaryChunks = chunks;
            }
          }

          // Ignore readyState < 3 (unless at 3 with data)
          if (readyState < 3 || (readyState == 3 && !responseText && binaryChunks.length == 0)) {
            break a;
          }

          // At readyState 4 (complete), map XHR errors
          httpStatus = httpStatus == 200 || httpStatus == 206;
          if (readyState == 4) {
            if (xhrError == 8) {
              setResponseStatus(this, 7);     // timeout → status 7
            } else if (xhrError == 7) {
              setResponseStatus(this, 8);     // abort → status 8
            } else if (!httpStatus) {
              setResponseStatus(this, 3);     // HTTP error
            }
          }

          // Create parser on first response headers
          if (!this.parser) {
            this.parser = createParserForResponse(this.xhr); // was: Uf3(this.W)
            if (this.parser == null) {
              setResponseStatus(this, 5); // no suitable parser
            }
          }

          if (this.status > 2) {
            cleanupResponse(this);
          } else {
            // Binary path: process new Uint8Array chunks
            if (binaryChunks.length > this.processedChunkCount) {
              const chunkCount = binaryChunks.length; // was: U
              let parsedResults = []; // was: c = []
              try {
                if (this.parser.isBinaryParser()) { // was: this.O.Tv()
                  for (let i = 0; i < chunkCount; i++) { // was: m
                    const parsed = this.parser.parse(Array.from(binaryChunks[i])); // was: K
                    if (parsed) parsedResults = parsedResults.concat(parsed);
                  }
                } else {
                  let textChunk = ""; // was: K
                  if (!this.textDecoder) { // was: this.D
                    if (typeof TextDecoder === "undefined") {
                      throw Error("TextDecoder is not supported by this browser.");
                    }
                    this.textDecoder = new TextDecoder();
                  }
                  for (let i = 0; i < chunkCount; i++) { // was: m
                    textChunk += this.textDecoder.decode(binaryChunks[i], {
                      stream: readyState == 4 && i == chunkCount - 1
                    });
                  }
                  parsedResults = this.parser.parse(textChunk);
                }
                binaryChunks.splice(0, chunkCount);
                parsedResults && this.dataCallback(parsedResults); // was: this.j(c)
              } catch (_err) { // was: I
                setResponseStatus(this, 5);
                cleanupResponse(this);
                break a;
              }
            }
            // Text path: process new responseText since last offset
            else if (responseText.length > this.processedChunkCount) {
              const newText = responseText.slice(this.processedChunkCount); // was: m
              this.processedChunkCount = responseText.length; // was: this.A = r.length
              try {
                const parsed = this.parser.parse(newText); // was: U
                if (parsed != null && this.dataCallback) {
                  this.dataCallback(parsed); // was: this.j && this.j(U)
                }
              } catch (_err) { // was: U
                setResponseStatus(this, 5);
                cleanupResponse(this);
                break a;
              }
            }

            // At readyState 4, emit end status
            if (readyState == 4) {
              responseText.length != 0 || this.isBinaryMode
                ? setResponseStatus(this, 2)  // ended with body
                : setResponseStatus(this, 4); // ended, no body
              cleanupResponse(this);
            } else {
              setResponseStatus(this, 1); // readable
            }
          }
        }
      }
    } catch (_err) { // was: T
      setResponseStatus(this, 6);
      cleanupResponse(this);
    }
  }
}

// ---------------------------------------------------------------------------
// Data dispatch helpers  [was: gC, O2]
// ---------------------------------------------------------------------------

/**
 * Dispatches an array of data items to an array of listener callbacks.
 * [was: gC]
 *
 * @param {Array} items - Data items to dispatch [was: Q]
 * @param {Array<Function>} listeners - Listener callbacks [was: c]
 */
function dispatchDataToListeners(items, listeners) { // was: gC
  for (let i = 0; i < items.length; i++) { // was: W
    const item = items[i]; // was: m
    listeners.forEach(function (callback) { // was: K
      try {
        callback(item);
      } catch (_err) {} // was: T
    });
  }
}

/**
 * Fires persistent and one-shot listeners for the given event name.
 * [was: O2]
 *
 * @param {StreamEventEmitter} emitter - The emitter [was: Q]
 * @param {string} eventName - Event name [was: c]
 */
function fireEvent(emitter, eventName) { // was: O2
  const persistent = emitter.persistentListeners[eventName]; // was: W = Q.O[c]
  persistent && persistent.forEach(function (callback) { // was: m
    try {
      callback();
    } catch (_err) {} // was: K
  });
  const oneShot = emitter.oneShotListeners[eventName]; // was: Q.W[c]
  oneShot && oneShot.forEach(function (callback) { // was: m
    callback();
  });
  emitter.oneShotListeners[eventName] = [];
}

// ---------------------------------------------------------------------------
// Stream event emitter  [was: xfm]
// ---------------------------------------------------------------------------

/**
 * Wraps a {@link ProgressiveResponseHandler} and exposes a Node-style event
 * interface with "data", "readable", "end", "error", and "close" events.
 * [was: xfm]
 */
export class StreamEventEmitter { // was: xfm
  /**
   * @param {ProgressiveResponseHandler} handler - Progressive response handler [was: Q]
   */
  constructor(handler) { // was: xfm(Q)
    /** @type {ProgressiveResponseHandler} [was: A] */
    this.handler = handler; // was: this.A = Q

    // Wire the handler's data callback to this.onData
    let target = handler; // was: Q
    const dataCallback = bind(this.onData, this); // was: c = (0, g.EO)(this.j, this)
    target.dataCallback = dataCallback; // was: Q.j = c

    // Wire the handler's status callback to this.onStatusChange
    target = this.handler; // was: Q = this.A
    const statusCallback = bind(this.onStatusChange, this); // was: c = (0, g.EO)(this.K, this)
    target.statusCallback = statusCallback; // was: Q.J = c

    /** @type {Object<string, Array<Function>>} Persistent listeners [was: O] */
    this.persistentListeners = {};

    /** @type {Object<string, Array<Function>>} One-shot listeners [was: W] */
    this.oneShotListeners = {};
  }

  /**
   * Adds a persistent listener for the given event name.
   * [was: xfm.prototype.Dn]
   *
   * @param {string} eventName - Event name [was: Q]
   * @param {Function} callback - Listener callback [was: c]
   */
  addListener(eventName, callback) { // was: Dn(Q, c)
    let listeners = this.persistentListeners[eventName]; // was: W
    if (!listeners) {
      listeners = [];
      this.persistentListeners[eventName] = listeners;
    }
    listeners.push(callback);
  }

  /**
   * Adds a persistent listener (alias for addListener, returns this).
   * [was: xfm.prototype.addListener]
   *
   * @param {string} eventName [was: Q]
   * @param {Function} callback [was: c]
   * @returns {StreamEventEmitter}
   */
  resetPlayer(eventName, callback) { // was: addListener
    this.addListener(eventName, callback); // was: this.Dn(Q, c)
    return this;
  }

  /**
   * Removes a listener from both persistent and one-shot lists.
   * [was: xfm.prototype.removeListener]
   *
   * @param {string} eventName [was: Q]
   * @param {Function} callback [was: c]
   * @returns {StreamEventEmitter}
   */
  removeListener(eventName, callback) { // was: removeListener(Q, c)
    const persistent = this.persistentListeners[eventName]; // was: W = this.O[Q]
    persistent && remove(persistent, callback);
    const oneShot = this.oneShotListeners[eventName]; // was: Q = this.W[Q]
    oneShot && remove(oneShot, callback);
    return this;
  }

  /**
   * Adds a one-shot listener for the given event name.
   * [was: xfm.prototype.once]
   *
   * @param {string} eventName [was: Q]
   * @param {Function} callback [was: c]
   * @returns {StreamEventEmitter}
   */
  once(eventName, callback) { // was: once(Q, c)
    let listeners = this.oneShotListeners[eventName]; // was: W
    if (!listeners) {
      listeners = [];
      this.oneShotListeners[eventName] = listeners;
    }
    listeners.push(callback);
    return this;
  }

  /**
   * Called when new parsed data arrives from the handler.
   * Dispatches to "data" persistent and one-shot listeners.
   * [was: xfm.prototype.j]
   *
   * @param {Array} dataItems - Parsed data items [was: Q]
   */
  onData(dataItems) { // was: j(Q)
    const persistent = this.persistentListeners.data; // was: c = this.O.data
    persistent && dispatchDataToListeners(dataItems, persistent);
    const oneShot = this.oneShotListeners.data; // was: c = this.W.data
    oneShot && dispatchDataToListeners(dataItems, oneShot);
    this.oneShotListeners.data = [];
  }

  /**
   * Called when the handler status changes. Maps status codes to events.
   * [was: xfm.prototype.K]
   */
  onStatusChange() { // was: K()
    switch (this.handler.getStatus()) { // was: this.A.getStatus()
      case 1:
        fireEvent(this, "readable");
        break;
      case 5:
      case 6:
      case 4:
      case 7:
      case 3:
        fireEvent(this, "error");
        break;
      case 8:
        fireEvent(this, "close");
        break;
      case 2:
        fireEvent(this, "end");
    }
  }
}

// ---------------------------------------------------------------------------
// gRPC-Web call / response lifecycle  [was: qTm, pBw, RR0, hJ, Mb, JJ, zS, CZ, kd, RK, Qaw]
// ---------------------------------------------------------------------------

/**
 * Async stack trace helper — captures a stack at creation time and
 * appends it to RpcError stacks for better debugging.
 * [was: pBw]
 */
export class AsyncStackTrace extends Error { // was: pBw
  constructor() {
    super();
    this.name = "AsyncStack";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Removes a specific item from an array (by identity).
 * [was: kd]
 *
 * @param {Array} arr - The array [was: Q]
 * @param {*} item - Item to remove [was: c]
 */
function removeFromArray(arr, item) { // was: kd
  const index = arr.indexOf(item); // was: c = Q.indexOf(c)
  if (index > -1) arr.splice(index, 1);
}

/**
 * Appends an async stack trace to an RpcError.
 * [was: RK]
 *
 * @param {Error} error - The RPC error [was: Q]
 * @param {AsyncStackTrace} asyncStack - Async stack [was: c]
 * @returns {Error} The error with appended stack
 */
function appendAsyncStack(error, asyncStack) { // was: RK
  if (asyncStack.stack) {
    error.stack += "\n" + asyncStack.stack;
  }
  return error;
}

/**
 * Dispatches an error to all error listeners on a gRPC call.
 * [was: hJ]
 *
 * @param {GrpcWebCall} call - The call [was: Q]
 * @param {Error} error - The error [was: c]
 */
function dispatchError(call, error) { // was: hJ
  for (let i = 0; i < call.errorListeners.length; i++) { // was: W
    call.errorListeners[i](error);
  }
}

/**
 * Dispatches metadata to all metadata listeners on a gRPC call.
 * [was: Mb]
 *
 * @param {GrpcWebCall} call - The call [was: Q]
 * @param {Object} metadata - Response metadata [was: c]
 */
function dispatchMetadata(call, metadata) { // was: Mb
  for (let i = 0; i < call.metadataListeners.length; i++) { // was: W
    call.metadataListeners[i](metadata);
  }
}

/**
 * Extracts response headers from the XHR as a plain object.
 * [was: JJ]
 *
 * @param {GrpcWebCall} call - The call [was: Q]
 * @returns {Object} Header key-value pairs
 */
function extractResponseHeaders(call) { // was: JJ
  const headers = {}; // was: c
  const rawHeaders = g.RY(call.xhr); // was: W = g.RY(Q.xhr)
  Object.keys(rawHeaders).forEach(key => { // was: m
    headers[key] = rawHeaders[key];
  });
  return headers;
}

/**
 * Dispatches a deserialized data message to all data listeners.
 * [was: zS]
 *
 * @param {GrpcWebCall} call - The call [was: Q]
 * @param {*} message - Deserialized response message [was: c]
 */
function dispatchData(call, message) { // was: zS
  for (let i = 0; i < call.dataListeners.length; i++) { // was: W
    call.dataListeners[i](message);
  }
}

/**
 * Parses an RpcStatus from the response body and extracts code, details,
 * and metadata.
 * [was: CZ]
 *
 * @param {GrpcWebCall} call - The call [was: Q]
 * @param {*} statusBody - Raw status payload [was: c]
 * @returns {{code: number, details: string, metadata: Object}}
 */
function parseRpcStatus(call, statusBody) { // was: CZ
  let code = 2; // was: W
  let details; // was: m
  const metadata = {}; // was: K

  try {
    let status; // was: T
    status = kCw(statusBody); // proto deserialise
    code = getInt32(status, 1);
    details = status.getMessage();
    if (Tp(status, ProtoAny, 3).length) {
      metadata["grpc-web-status-details-bin"] = statusBody;
    }
  } catch (err) { // was: T
    if (call.xhr && call.xhr.getStatus() === 404) {
      code = 5;
      details = "Not Found: " + String(call.xhr.L);
    } else {
      code = 14;
      details = `Unable to parse RpcStatus: ${err}`;
    }
  }

  return {
    code: code,
    details: details,
    metadata: metadata,
  };
}

/**
 * Wires up a streaming gRPC-Web call's event emitter to deserialise data,
 * process status, and dispatch end/error events.
 * [was: RR0]
 *
 * @param {GrpcWebCall} call - The gRPC call instance [was: Q]
 */
function wireStreamingCallEvents(call) { // was: RR0
  call.eventEmitter.addListener("data", (record) => { // was: Q.D.Dn("data", c => {...})
    if ("1" in record) {
      const rawData = record["1"]; // was: W = c["1"]
      let message; // was: m
      try {
        message = call.deserializer(rawData); // was: Q.J(W)
      } catch (err) { // was: K
        dispatchError(
          call,
          new RpcError(13, `Error when deserializing response data; error: ${err}, response: ${rawData}`)
        );
      }
      if (message) dispatchData(call, message); // was: m && zS(Q, m)
    }
    if ("2" in record) {
      const status = parseRpcStatus(call, record["2"]); // was: c = CZ(Q, c["2"])
      for (let i = 0; i < call.statusListeners.length; i++) { // was: W
        call.statusListeners[i](status);
      }
    }
  });

  call.eventEmitter.addListener("end", () => { // was: Q.D.Dn("end", ...)
    dispatchMetadata(call, extractResponseHeaders(call)); // was: Mb(Q, JJ(Q))
    for (let i = 0; i < call.endListeners.length; i++) { // was: c
      call.endListeners[i]();
    }
  });

  call.eventEmitter.addListener("error", () => { // was: Q.D.Dn("error", ...)
    if (call.errorListeners.length !== 0) {
      let xhrError = call.xhr.O; // was: c
      if (xhrError !== 0 || zQ(call.xhr) || (xhrError = 6)) {
        // xhrError already set or defaulted to 6
      }
      let httpStatus = -1; // was: W
      let grpcCode; // was: m

      switch (xhrError) {
        case 0:
          grpcCode = 2;
          break;
        case 7:
          grpcCode = 10;
          break;
        case 8:
          grpcCode = 4;
          break;
        case 6:
          httpStatus = call.xhr.getStatus();
          grpcCode = httpStatusToGrpcCode(httpStatus); // was: LO(W)
          break;
        default:
          grpcCode = 14;
      }

      dispatchMetadata(call, extractResponseHeaders(call)); // was: Mb(Q, JJ(Q))
      let errorMessage = xhrErrorDescription(xhrError) + ", error: " + call.xhr.getLastError(); // was: c = K1d(c) + ...
      if (httpStatus !== -1) {
        errorMessage += `, http status code: ${httpStatus}`;
      }
      dispatchError(call, new RpcError(grpcCode, errorMessage)); // was: hJ(Q, new fZ(m, c))
    }
  });
}

/**
 * Sets up a unary gRPC-Web call's completion listener — deserialises the
 * full response body and dispatches data or error.
 * [was: Qaw]
 *
 * @param {GrpcWebCall} call - The gRPC call instance [was: Q]
 * @param {boolean} isBase64 - Whether to base64-decode a text/plain response [was: c]
 */
function wireUnaryCallCompletion(call, isBase64) { // was: Qaw
  const asyncStack = new AsyncStackTrace(); // was: W = new pBw

  listen(call.xhr, "complete", () => { // was: g.s7(Q.xhr, "complete", ...)
    if (zQ(call.xhr)) {
      let responseBody = call.xhr.getResponseText(); // was: g.MA(Q.xhr)

      if (isBase64 && call.xhr.getResponseHeader("Content-Type") === "text/plain") {
        if (!atob) throw Error("Cannot decode Base64 response");
        responseBody = atob(responseBody);
      }

      let deserialized; // was: K
      try {
        deserialized = call.deserializer(responseBody); // was: Q.J(m)
      } catch (err) { // was: r
        dispatchError(
          call,
          appendAsyncStack(
            new RpcError(13, `Error when deserializing response data; error: ${err}, response: ${responseBody}`),
            asyncStack
          )
        );
        return;
      }

      const grpcCode = httpStatusToGrpcCode(call.xhr.getStatus()); // was: m = LO(Q.xhr.getStatus())
      dispatchMetadata(call, extractResponseHeaders(call)); // was: Mb(Q, JJ(Q))

      if (grpcCode === 0) {
        dispatchData(call, deserialized); // was: zS(Q, K)
      } else {
        dispatchError(
          call,
          appendAsyncStack(
            new RpcError(grpcCode, "Xhr succeeded but the status code is not 200"),
            asyncStack
          )
        );
      }
    } else {
      let responseBody = call.xhr.getResponseText(); // was: g.MA(call.xhr)
      let code; // was: r
      let responseHeaders = extractResponseHeaders(call); // was: K = JJ(Q)

      if (responseBody) {
        const status = parseRpcStatus(call, responseBody); // was: T = CZ(Q, m)
        responseBody = status.code; // reuse var as code
        code = status.details;
        const statusMetadata = status.metadata; // was: T
        responseHeaders = statusMetadata; // override with status metadata
      } else {
        responseBody = 2; // was: m = 2
        code = `Rpc failed due to xhr error. uri: ${String(call.xhr.L)}, error code: ${call.xhr.O}, error: ${call.xhr.getLastError()}`;
        // responseHeaders stays as extracted headers
      }

      dispatchMetadata(call, extractResponseHeaders(call)); // was: Mb(Q, K)
      dispatchError(
        call,
        appendAsyncStack(new RpcError(responseBody, code, responseHeaders), asyncStack)
      );
    }
  });
}

// ---------------------------------------------------------------------------
// gRPC-Web call object  [was: qTm]
// ---------------------------------------------------------------------------

/**
 * Represents a single gRPC-Web call (streaming or unary). Collects listener
 * arrays for data, metadata, status, end, and error events.
 * [was: qTm]
 */
export class GrpcWebCall { // was: qTm
  /**
   * @param {Object} config - Configuration object [was: Q]
   * @param {Object} config.xhr - The XHR instance [was: Q.xhr]
   * @param {?StreamEventEmitter} config.MB - Stream event emitter (for streaming) [was: Q.MB]
   * @param {Function} deserializer - Response deserializer [was: c]
   */
  constructor(config, deserializer) { // was: qTm(Q, c)
    /** @type {Array<Function>} Data listeners [was: O] */
    this.dataListeners = [];

    /** @type {Array<Function>} Metadata listeners [was: j] */
    this.metadataListeners = [];

    /** @type {Array<Function>} Status listeners [was: K] */
    this.statusListeners = [];

    /** @type {Array<Function>} End listeners [was: A] */
    this.endListeners = [];

    /** @type {Array<Function>} Error listeners [was: W] */
    this.errorListeners = [];

    /** @type {?StreamEventEmitter} Event emitter (streaming calls only) [was: D] */
    this.eventEmitter = config.MB; // was: Q.MB

    /** @type {Function} Deserializer for response messages [was: J] */
    this.deserializer = deserializer; // was: c

    /** @type {Object} Underlying XHR [was: xhr] */
    this.xhr = config.xhr;

    if (this.eventEmitter) {
      wireStreamingCallEvents(this); // was: RR0(this)
    }
  }

  /**
   * Adds a listener for the given event type.
   * [was: qTm.prototype.Dn]
   *
   * @param {string} eventName - "data"|"metadata"|"status"|"end"|"error" [was: Q]
   * @param {Function} callback - Listener [was: c]
   */
  addListener(eventName, callback) { // was: Dn(Q, c)
    eventName === "data"     ? this.dataListeners.push(callback) :
    eventName === "metadata" ? this.metadataListeners.push(callback) :
    eventName === "status"   ? this.statusListeners.push(callback) :
    eventName === "end"      ? this.endListeners.push(callback) :
    eventName === "error"    && this.errorListeners.push(callback);
  }

  /**
   * Removes a listener for the given event type.
   * [was: qTm.prototype.removeListener]
   *
   * @param {string} eventName [was: Q]
   * @param {Function} callback [was: c]
   * @returns {GrpcWebCall}
   */
  removeListener(eventName, callback) { // was: removeListener(Q, c)
    eventName === "data"     ? removeFromArray(this.dataListeners, callback) :
    eventName === "metadata" ? removeFromArray(this.metadataListeners, callback) :
    eventName === "status"   ? removeFromArray(this.statusListeners, callback) :
    eventName === "end"      ? removeFromArray(this.endListeners, callback) :
    eventName === "error"    && removeFromArray(this.errorListeners, callback);
    return this;
  }

  /**
   * Aborts the underlying XHR.
   * [was: qTm.prototype.cancel]
   */
  cancel() {
    this.xhr.abort();
  }
}

// ---------------------------------------------------------------------------
// Interceptor chain helpers  [was: IOO, XSK]
// ---------------------------------------------------------------------------

/**
 * Composes server-streaming interceptors into a single function.
 * Each interceptor wraps the next handler.
 * [was: IOO]
 *
 * @param {Function} handler - Base handler [was: Q]
 * @param {Array<Object>} interceptors - Interceptor chain [was: c]
 * @returns {Function} Composed handler
 */
export function composeStreamingInterceptors(handler, interceptors) { // was: IOO
  return interceptors.reduce(
    (next, interceptor) => request => interceptor.intercept(request, next), // was: (W, m) => K => m.intercept(K, W)
    handler
  );
}

/**
 * Composes unary interceptors into a single function.
 * [was: XSK]
 *
 * @param {Function} handler - Base handler [was: Q]
 * @param {Array<Object>} interceptors - Interceptor chain [was: c]
 * @returns {Function} Composed handler
 */
export function composeUnaryInterceptors(handler, interceptors) { // was: XSK
  return interceptors.reduce(
    (next, interceptor) => request => interceptor.intercept(request, next), // was: (W, m) => K => m.intercept(K, W)
    handler
  );
}

// ---------------------------------------------------------------------------
// gRPC-Web transport helpers  [was: fG, vx, aO, A4w, eLK, BG, JAO]
// ---------------------------------------------------------------------------

/**
 * Creates an XHR instance, optionally with custom credentials.
 * [was: fG]
 *
 * @param {Object} transport - Transport config [was: Q]
 * @param {boolean} isStreaming - Whether this is a streaming call [was: c]
 * @returns {Object} XHR wrapper instance
 */
export function createXhr(transport, isStreaming) { // was: fG
  const useCredentials = transport.W && !isStreaming; // was: c = Q.W && !c
  return transport.QQ || useCredentials
    ? new XhrIo(new XhrConfig({
        SlotIdFulfilledEmptyTrigger: transport.QQ,   // was: Q.QQ
        Ac: useCredentials   // was: c
      }))
    : new XhrIo;
}

/**
 * Prepares headers and URL for a gRPC-Web request. Sets Content-Type and
 * User-Agent headers, applies credentials and CORS suppression.
 * [was: vx]
 *
 * @param {Object} transport - Transport config [was: Q]
 * @param {Object} headers - Request metadata (headers) [was: c]
 * @param {Object} xhr - XHR wrapper instance [was: W]
 * @param {string} url - Request URL [was: m]
 * @returns {string} Possibly-modified URL
 */
export function prepareGrpcHeaders(transport, headers, xhr, url) { // was: vx
  headers["Content-Type"] = "application/json+protobuf";
  headers["X-User-Agent"] = "grpc-web-javascript/0.1";

  const authorization = headers.Authorization; // was: K
  if ((authorization && AUTH_HASH_ALGORITHMS.has(authorization.split(" ")[0])) || transport.withCredentials) {
    xhr.J = true; // was: W.J = !0
  }

  if (transport.QR) {
    url = g.td(url, "$httpHeaders", headers); // was: m = g.td(m, "$httpHeaders", c)
  } else {
    for (const key of Object.keys(headers)) { // was: T
      xhr.headers.set(key, headers[key]);
    }
  }
  return url;
}

/**
 * Creates a gRPC-Web call object from an XHR. For streaming calls, wraps
 * the XHR in a {@link ProgressiveResponseHandler} and {@link StreamEventEmitter}.
 * [was: aO]
 *
 * @param {Object} xhr - XHR wrapper [was: Q]
 * @param {Function} deserializer - Response deserializer [was: c]
 * @param {boolean} isStreaming - Whether this is a streaming call [was: W]
 * @returns {GrpcWebCall}
 */
export function createGrpcCall(xhr, deserializer, isStreaming) { // was: aO
  let eventEmitter; // was: m
  if (isStreaming) {
    xhr.isActive();
    const handler = new ProgressiveResponseHandler(xhr); // was: W = new Bfx(Q)
    eventEmitter = new StreamEventEmitter(handler); // was: m = new xfm(W)
  }
  return new GrpcWebCall({ xhr: xhr, MB: eventEmitter }, deserializer); // was: new qTm({xhr: Q, MB: m}, c)
}

/**
 * Sends a unary gRPC-Web request and returns a call object.
 * [was: A4w]
 *
 * @param {Object} transport - Transport config [was: Q]
 * @param {Object} rpcRequest - RPC invocation wrapper [was: c]
 * @param {string} baseUrl - Base URL prefix [was: W]
 * @returns {GrpcWebCall}
 */
export function sendUnaryRequest(transport, rpcRequest, baseUrl) { // was: A4w
  const methodDesc = rpcRequest.KR; // was: m
  const metadata = rpcRequest.getMetadata(); // was: K
  const xhr = createXhr(transport, true); // was: T = fG(Q, !0)
  const url = prepareGrpcHeaders(transport, metadata, xhr, baseUrl + methodDesc.getName()); // was: Q = vx(Q, K, T, W + m.getName())
  const call = createGrpcCall(xhr, methodDesc.O, false); // was: W = aO(T, m.O, !1)
  wireUnaryCallCompletion(call, metadata["X-Goog-Encode-Response-If-Executable"] === "base64"); // was: Qaw(W, K[...])
  const body = methodDesc.W(rpcRequest.u7); // was: c = m.W(c.u7)
  xhr.send(url, "POST", body);
  return call;
}

/**
 * Wraps a deserialized response as a gRPC unary response object.
 * [was: JAO]
 *
 * @param {*} data - Deserialized response [was: Q]
 * @param {Object} [metadata={}] - Response metadata [was: c]
 * @returns {GrpcUnaryResponse}
 */
export function createUnaryResponse(data, metadata = {}) { // was: JAO
  return new GrpcUnaryResponse(data, metadata); // was: new Mzy(Q, c)
}

/**
 * Executes a unary gRPC-Web call with abort signal support.
 * [was: eLK]
 *
 * @param {Object} transport - Transport config [was: Q]
 * @param {string} fullUrl - Full service URL [was: c]
 * @param {*} request - Request payload [was: W]
 * @param {Object} metadata - Request metadata [was: m]
 * @param {Object} methodDesc - Method descriptor [was: K]
 * @param {Object} [options={}] - Options including signal [was: T]
 * @returns {Promise<*>} Resolves with the deserialized response
 */
export function executeUnaryCall(transport, fullUrl, request, metadata, methodDesc, options = {}) { // was: eLK
  const baseUrl = fullUrl.substring(0, fullUrl.length - methodDesc.name.length); // was: r
  const signal = options?.signal; // was: U

  return composeUnaryInterceptors(
    (rpcRequest) => new Promise((resolve, reject) => { // was: I => new Promise((X, A) => {...})
      if (signal?.aborted) {
        const err = new RpcError(1, "Aborted");
        err.cause = signal.reason;
        reject(err);
      } else {
        let responseMetadata = {}; // was: e
        const call = sendUnaryRequest(transport, rpcRequest, baseUrl); // was: V = A4w(Q, I, r)

        call.addListener("error", (err) => void reject(err)); // was: V.Dn("error", B => void A(B))
        call.addListener("metadata", (meta) => { // was: V.Dn("metadata", B => {...})
          responseMetadata = meta;
        });
        call.addListener("data", (data) => { // was: V.Dn("data", B => {...})
          resolve(createUnaryResponse(data, responseMetadata)); // was: X(JAO(B, e))
        });

        if (signal) {
          signal.addEventListener("abort", () => {
            call.cancel();
            const err = new RpcError(1, "Aborted");
            err.cause = signal.reason;
            reject(err);
          });
        }
      }
    }),
    transport.getCastInstance // was: Q.Nx
  ).call(transport, methodDesc.D(request, metadata)).then(response => response.nP); // was: .call(Q, K.D(W, m)).then(I => I.nP)
}

/**
 * Convenience wrapper for executeUnaryCall.
 * [was: BG]
 *
 * @param {Object} transport [was: Q]
 * @param {string} fullUrl [was: c]
 * @param {*} request [was: W]
 * @param {Object} metadata [was: m]
 * @param {Object} methodDesc [was: K]
 * @param {Object} [options={}] [was: T]
 * @returns {Promise<*>}
 */
export function invokeUnaryRpc(transport, fullUrl, request, metadata, methodDesc, options = {}) { // was: BG
  return executeUnaryCall(transport, fullUrl, request, metadata, methodDesc, options);
}

// ---------------------------------------------------------------------------
// gRPC-Web request / response wrappers  [was: sN3, Mzy]
// ---------------------------------------------------------------------------

/**
 * Wraps a gRPC-Web RPC invocation request with payload, method descriptor,
 * and metadata.
 * [was: sN3]
 */
export class GrpcRpcRequest { // was: sN3
  /**
   * @param {*} payload - Request payload [was: Q → u7]
   * @param {Object} methodDescriptor - Method descriptor [was: c → KR]
   * @param {Object} metadata - Request metadata [was: W → metadata]
   */
  constructor(payload, methodDescriptor, metadata) {
    /** @type {*} Serialized request body [was: u7] */
    this.u7 = payload;

    /** @type {Object} Method descriptor [was: KR] */
    this.KR = methodDescriptor;

    /** @type {Object} Request metadata [was: metadata] */
    this.metadata = metadata;
  }

  /**
   * Returns the request metadata.
   * [was: sN3.prototype.getMetadata]
   *
   * @returns {Object}
   */
  getMetadata() {
    return this.metadata;
  }
}

/**
 * Wraps a gRPC-Web unary response with the deserialized payload and metadata.
 * [was: Mzy]
 */
export class GrpcUnaryResponse { // was: Mzy
  /**
   * @param {*} payload - Deserialized response [was: Q → nP]
   * @param {Object} [metadata={}] - Response metadata [was: c → metadata]
   */
  constructor(payload, metadata = {}) {
    /** @type {*} Deserialized response payload [was: nP] */
    this.nP = payload;

    /** @type {Object} Response metadata [was: metadata] */
    this.metadata = metadata;

    /** @type {?Object} gRPC status (set later) [was: status] */
    this.status = null;
  }

  /**
   * Returns response metadata.
   * [was: Mzy.prototype.getMetadata]
   *
   * @returns {Object}
   */
  getMetadata() {
    return this.metadata;
  }

  /**
   * Returns the gRPC status, or null.
   * [was: Mzy.prototype.getStatus]
   *
   * @returns {?Object}
   */
  getStatus() {
    return this.status;
  }
}

// ---------------------------------------------------------------------------
// gRPC method descriptor  [was: d07]
// ---------------------------------------------------------------------------

/**
 * Describes a single gRPC method — name, types, serializer, and deserializer.
 * [was: d07]
 */
export class GrpcMethodDescriptor { // was: d07
  /**
   * @param {string} name - Full method path (e.g. "/pkg.Service/Method") [was: Q]
   * @param {Function} requestType - Request proto constructor [was: c]
   * @param {Function} responseType - Response proto constructor [was: W]
   * @param {Function} serializer - Serializes request to wire format [was: m → W]
   * @param {Function} deserializer - Deserializes response from wire format [was: K → O]
   */
  constructor(name, requestType, responseType, serializer, deserializer) {
    /** @type {string} [was: name] */
    this.name = name;

    /** @type {string} Always "unary" for these descriptors */
    this.methodType = "unary";

    /** @type {Function} [was: requestType] */
    this.requestType = requestType;

    /** @type {Function} [was: responseType] */
    this.responseType = responseType;

    /** @type {Function} Serializer [was: W (property)] */
    this.W = serializer;

    /** @type {Function} Deserializer [was: O (property)] */
    this.O = deserializer;
  }

  /**
   * Creates a {@link GrpcRpcRequest} for this method.
   * [was: d07.prototype.D]
   *
   * @param {*} payload [was: Q]
   * @param {Object} [metadata={}] [was: c]
   * @returns {GrpcRpcRequest}
   */
  D(payload, metadata = {}) { // was: D(Q, c={})
    return new GrpcRpcRequest(payload, this, metadata); // was: new sN3(Q, this, c)
  }

  /**
   * Returns the full method name / path.
   * [was: d07.prototype.getName]
   *
   * @returns {string}
   */
  getName() {
    return this.name;
  }
}

// ---------------------------------------------------------------------------
// gRPC-Web transport (JSPB)  [was: nyO]
// ---------------------------------------------------------------------------

/**
 * gRPC-Web transport configured for JSPB (JSON+Protobuf) encoding.
 * Supports both unary and server-streaming calls.
 * [was: nyO]
 */
export class GrpcWebJspbTransport { // was: nyO
  constructor() {
    const config = { format: "jspb" }; // was: Q

    /** @type {boolean} Suppress CORS preflight by encoding headers in URL [was: QR] */
    this.QR = config.QR || getObjectByPath("suppressCorsPreflight", config) || false; // was: !1

    /** @type {boolean} Whether to send cookies cross-origin [was: withCredentials] */
    this.withCredentials = config.withCredentials || getObjectByPath("withCredentials", config) || false; // was: !1

    /** @type {Array<Object>} Server-streaming interceptors [was: ji] */
    this.ji = config.ji || [];

    /** @type {Array<Object>} Unary interceptors [was: Nx] */
    this.getCastInstance = config.getCastInstance || [];

    /** @type {*} Custom XHR credentials mode [was: QQ] */
    this.QQ = config.QQ;

    /** @type {boolean} Use alternate credentials mode [was: W] */
    this.W = config.v3J || false; // was: !1
  }

  /**
   * Initiates a server-streaming gRPC-Web call.
   * [was: nyO.prototype.serverStreaming]
   *
   * @param {string} fullUrl - Full service URL [was: Q]
   * @param {*} request - Request payload [was: c]
   * @param {Object} metadata - Request metadata [was: W]
   * @param {Object} methodDesc - Method descriptor [was: m]
   * @returns {GrpcWebCall} The streaming call object
   */
  serverStreaming(fullUrl, request, metadata, methodDesc) { // was: serverStreaming(Q, c, W, m)
    const baseUrl = fullUrl.substring(0, fullUrl.length - methodDesc.name.length); // was: K

    return composeStreamingInterceptors(
      (rpcRequest) => { // was: T => {...}
        const method = rpcRequest.KR; // was: r
        let headers = rpcRequest.getMetadata(); // was: U
        const xhr = createXhr(this, false); // was: I = fG(this, !1)
        headers = prepareGrpcHeaders(this, headers, xhr, baseUrl + method.getName()); // was: U = vx(...)
        const call = createGrpcCall(xhr, method.O, true); // was: X = aO(I, r.O, !0)
        const body = method.W(rpcRequest.u7); // was: T = r.W(T.u7)
        xhr.send(headers, "POST", body);
        return call;
      },
      this.ji // was: this.ji
    ).call(this, methodDesc.D(request, metadata)); // was: .call(this, m.D(c, W))
  }
}
