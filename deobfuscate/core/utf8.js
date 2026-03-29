/**
 * UTF-8 Encoding / Decoding Utilities
 *
 * Provides UTF-8 byte-sequence parsing, TextEncoder/TextDecoder wrappers,
 * and fallback polyfills used throughout the player for string ↔ Uint8Array
 * conversion.  Also includes the Latin-1 (single-byte) fast-path decoder
 * and the helper that converts a JS string to raw byte codes.
 *
 * Source: base.js lines 72434–72449 (globals), 18987–19072 (functions)
 *
 * @module core/utf8
 */

// ---------------------------------------------------------------------------
// Shared globals  [was: Th, m3, r1]
// ---------------------------------------------------------------------------

/** @type {number[]} Reusable 1024-element scratch buffer for fromCharCode batches [was: Th] */
const charCodeBuffer = Array(1024); // was: Th

/**
 * Cached TextDecoder instance (undefined when unavailable).
 * [was: m3]
 * @type {TextDecoder|undefined}
 */
const textDecoder = globalThis.TextDecoder // was: m3
  ? new TextDecoder()
  : undefined;

/**
 * Cached TextEncoder instance (undefined when unavailable).
 * [was: r1]
 * @type {TextEncoder|undefined}
 */
const textEncoder = globalThis.TextEncoder // was: r1
  ? new TextEncoder()
  : undefined;

// ---------------------------------------------------------------------------
// Latin-1 (single-byte) fast decoder
// ---------------------------------------------------------------------------

/**
 * Decode a Uint8Array as a Latin-1 string (single-byte chars only).
 * Uses TextDecoder when available, otherwise falls back to
 * `String.fromCharCode`.
 *
 * [was: Ko]
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function decodeLatin1(bytes) { // was: Ko
  if (!bytes.length) return '';
  if (textDecoder) return textDecoder.decode(bytes); // was: m3
  return String.fromCharCode.apply(null, bytes);
}

// ---------------------------------------------------------------------------
// UTF-8 → String decoder (full multi-byte support)
// ---------------------------------------------------------------------------

/**
 * Decode a Uint8Array of UTF-8 bytes into a JavaScript string.
 *
 * Tries, in order:
 *   1. Native `TextDecoder`
 *   2. Cobalt's `FetchInternal.decodeFromUTF8` (YouTube TV / embedded)
 *   3. Manual byte-sequence parsing with surrogate-pair handling
 *
 * The manual path processes up to 1024 code-units at a time via a reusable
 * scratch buffer (`charCodeBuffer`) to avoid per-character string concatenation.
 *
 * [was: g.o8]
 *
 * @param {Uint8Array} bytes  Raw UTF-8 byte array.
 * @returns {string}          Decoded JavaScript string.
 */
export function decodeUTF8(bytes) { // was: g.o8
  if (!bytes.length) return '';

  try {
    if (textDecoder) return textDecoder.decode(bytes); // was: m3
    if ('FetchInternal' in window)
      return FetchInternal.decodeFromUTF8(bytes);
  } catch { /* fall through to manual path */ }

  let pos = 0; // was: c
  const chunks = []; // was: W
  const len = bytes.length; // was: m

  while (pos < len) {
    let bufIdx = 0; // was: T

    while (bufIdx < 1024 && pos < len) {
      let codePoint = bytes[pos++]; // was: K

      if (codePoint < 128) {
        // 1-byte (ASCII)
        charCodeBuffer[bufIdx++] = codePoint; // was: Th
        continue;
      }

      if (codePoint < 224) {
        // 2-byte sequence
        codePoint = (codePoint & 31) << 6
                  | (bytes[pos++] & 63);
      } else if (codePoint < 240) {
        // 3-byte sequence
        codePoint = (codePoint & 15) << 12
                  | (bytes[pos++] & 63) << 6
                  | (bytes[pos++] & 63);
      } else {
        // 4-byte sequence — produces a surrogate pair
        if (bufIdx + 1 === 1024) {
          --pos; // back up; flush buffer first
          break;
        }
        codePoint = (codePoint & 7) << 18
                  | (bytes[pos++] & 63) << 12
                  | (bytes[pos++] & 63) << 6
                  | (bytes[pos++] & 63);
        codePoint -= 0x10000; // 65536
        charCodeBuffer[bufIdx++] = 0xD800 | (codePoint >> 10);  // high surrogate
        codePoint = 0xDC00 | (codePoint & 0x3FF);               // low surrogate
      }

      charCodeBuffer[bufIdx++] = codePoint;
    }

    // Convert the scratch buffer slice to a string
    let chunk = String.fromCharCode.apply(String, charCodeBuffer); // was: K reuse
    if (bufIdx < 1024) {
      chunk = chunk.substring(0, bufIdx);
    }
    chunks.push(chunk);
  }

  return chunks.join('');
}

// ---------------------------------------------------------------------------
// String → UTF-8 encoder (into existing buffer)
// ---------------------------------------------------------------------------

/**
 * Encode a JavaScript string as UTF-8 bytes into an existing `Uint8Array`.
 *
 * When the native `TextEncoder.encodeInto` API is available it is used
 * directly.  Otherwise a manual code-point walk handles 1–4 byte sequences
 * including surrogate pairs.
 *
 * [was: UK]
 *
 * @param {string}     str    Source string.
 * @param {Uint8Array} buffer Destination byte buffer (must be large enough).
 * @returns {number}          Number of bytes written — or, when `encodeInto`
 *                            short-reads, the *required* buffer size
 *                            (`str.length * 4`).
 */
export function encodeUTF8Into(str, buffer) { // was: UK
  if (textEncoder?.encodeInto) { // was: r1
    const { read, written } = textEncoder.encodeInto(str, buffer);
    return read < str.length ? str.length * 4 : written;
  }

  let pos = 0; // was: W
  for (let i = 0; i < str.length; i++) { // was: m
    let codePoint = str.charCodeAt(i); // was: K

    if (codePoint < 128) {
      buffer[pos++] = codePoint;
    } else if (codePoint < 2048) {
      buffer[pos++] = (codePoint >> 6) | 192;
      buffer[pos++] = (codePoint & 63) | 128;
    } else {
      // Check for surrogate pair (4-byte sequence)
      if ((codePoint & 0xFC00) === 0xD800                    // high surrogate
          && i + 1 < str.length
          && (str.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {  // low surrogate
        codePoint = 0x10000
          + ((codePoint & 0x3FF) << 10)
          + (str.charCodeAt(++i) & 0x3FF);
        buffer[pos++] = (codePoint >> 18) | 240;
        buffer[pos++] = ((codePoint >> 12) & 63) | 128;
      } else {
        // 3-byte BMP character
        buffer[pos++] = (codePoint >> 12) | 224;
      }
      buffer[pos++] = ((codePoint >> 6) & 63) | 128;
      buffer[pos++] = (codePoint & 63) | 128;
    }
  }
  return pos;
}

// ---------------------------------------------------------------------------
// String → UTF-8 Uint8Array (allocating)
// ---------------------------------------------------------------------------

/**
 * Encode a JavaScript string into a new `Uint8Array` of UTF-8 bytes.
 *
 * Uses the native `TextEncoder.encode` when available; otherwise allocates
 * a buffer at 120 % of `str.length`, attempts to encode, and retries with
 * a larger buffer if the first attempt was too small.
 *
 * [was: I8]
 *
 * @param {string} str
 * @returns {Uint8Array}
 */
export function encodeUTF8(str) { // was: I8
  if (textEncoder) return textEncoder.encode(str); // was: r1

  let buffer = new Uint8Array(Math.ceil(str.length * 1.2)); // was: c
  let written = encodeUTF8Into(str, buffer); // was: W, UK

  if (buffer.length < written) {
    buffer = new Uint8Array(written);
    written = encodeUTF8Into(str, buffer);
  }
  if (buffer.length > written) {
    buffer = buffer.subarray(0, written);
  }
  return buffer;
}

// ---------------------------------------------------------------------------
// String → raw byte-code array (Latin-1 / charCode)
// ---------------------------------------------------------------------------

/**
 * Convert a JavaScript string to a Uint8Array using raw `charCodeAt` values
 * (i.e. Latin-1 / ISO-8859-1 — no UTF-8 multi-byte encoding).
 *
 * [was: HW7]
 *
 * @param {string} str
 * @returns {Uint8Array}
 */
export function stringToRawBytes(str) { // was: HW7
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}
