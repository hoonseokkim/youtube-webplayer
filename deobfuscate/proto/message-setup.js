/**
 * Message Setup — additional protobuf message class setup, field descriptor
 * initialization, and message type registration.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: 58000–58319
 *
 * Key subsystems:
 *   - Zd base class (toJSON, Eg, clone) — the root protobuf message class
 *     with serialization and deep-clone support.
 *   - n0 field descriptor — holds reader/writer functions and the
 *     "requires Dd default" flag.
 *   - Wire-format reader/writer pairs:
 *     fSR, vWR — submessage read/write with Nq encoding.
 *     mg — full serialization: zU array -> YRO writer -> Uint8Array.
 *     aD, UuK — varint int32 read/write.
 *     GV — float32 read/write (IEEE 754 5-byte wire type).
 *     $6, IBX — sint32 zigzag read/write.
 *     Xjw — sint64 zigzag read/write.
 *     PX, AUx — uint32 read/write.
 *     efy, VtX — int64 signed read/write.
 *     BaX — repeated int64 read/write.
 *     xuX — fixed32 read/write.
 *     lt, q40 — enum read/write.
 *     ut, npx, DuK — string read/write (length-delimited).
 *     hj — submessage read/write (generic).
 *     zV — oneof submessage read/write.
 *     CK, M_ — bytes read/write.
 *     Jj — uint32 (unsigned) read/write.
 *     RD, ttO — int32 (signed) read/write.
 *     HP7 — fixed32 raw read/write (4-byte LE).
 *   - Symbol-keyed internal state (gG, sS, wG, vk, by)
 *   - Serialization helpers (rUw, mg, Sj)
 *
 * [was: Zd, n0, fSR, vWR, gG, sS, wG, vk, by, rUw, mg, aD, UuK, GV,
 *  $6, IBX, Xjw, PX, AUx, efy, VtX, BaX, xuX, lt, q40, ut, npx,
 *  DuK, hj, zV, CK, M_, Jj, RD, ttO, HP7]
 */
import { NetworkStatusManager } from '../data/idb-operations.js'; // was: zU
import { SLOT_ARRAY_STATE } from './messages-core.js'; // was: Xm
import { MESSAGE_SENTINEL } from './messages-core.js'; // was: m4
import { SLOT_MESSAGE_MARKER } from './messages-core.js'; // was: Ww
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { publishAdEvent } from '../player/media-state.js'; // was: b1
import { recordPlaybackStartTiming } from '../player/video-loader.js'; // was: b2
import { serialize } from './protobuf-writer.js';
import { toString } from '../core/string-utils.js';

// ---------------------------------------------------------------------------
// Zd — base protobuf message class  (line 57995)
// ---------------------------------------------------------------------------

/**
 * Base class for all protobuf message types. Wraps an internal `zU`
 * descriptor array and provides serialization, cloning, and JSON output.
 *
 * The constructor takes `(data, offset, wireFormatFlags)` and stores
 * the decoded representation via `Dc(data, offset, wireFormatFlags, 2048)`.
 *
 * [was: Zd]
 */
export class ProtobufMessage { // was: Zd
  /**
   * @param {*} data              Raw data array.                [was: Q]
   * @param {number} offset       Field offset.                  [was: c]
   * @param {*} wireFormatFlags   Wire format flag set.          [was: W]
   */
  constructor(data, offset, wireFormatFlags) {
    /** @type {Array} Internal descriptor array. [was: zU] */
    this.NetworkStatusManager = Dc(data, offset, wireFormatFlags, 2048);
  }

  /**
   * Serializes this message to a JSON-compatible object.
   * @returns {Object}
   */
  toJSON() {
    return xH(this);
  }

  /**
   * Serializes to a JSON string, optionally applying a replacer.
   *
   * @param {Function} [replacer]  JSON.stringify replacer.  [was: Q]
   * @returns {string}
   *
   * [was: Eg]
   */
  serialize(replacer) { // was: Eg
    return JSON.stringify(xH(this, replacer));
  }

  /**
   * Deep-clones this message instance.
   * @returns {ProtobufMessage}
   *
   * [was: clone]
   */
  clone() {
    const arr = this.NetworkStatusManager; // was: Q
    const flags = arr[SLOT_ARRAY_STATE] | 0; // was: c
    return iF(this, arr, flags)
      ? ym(this, arr, true) // was: !0
      : new this.constructor(Ny(arr, flags, false)); // was: !1
  }
}

// Attach the m_m symbol marker and toString override
ProtobufMessage.prototype[SLOT_MESSAGE_MARKER] = MESSAGE_SENTINEL;
ProtobufMessage.prototype.toString = function () {
  return this.NetworkStatusManager.toString();
};

// ---------------------------------------------------------------------------
// n0 — field descriptor  (line 58017)
// ---------------------------------------------------------------------------

/**
 * Describes a single protobuf field's reader and writer functions, plus
 * a flag indicating whether the field uses the Dd default.
 *
 * @param {Function} reader   Binary reader function.  [was: Q]  [was: HD]
 * @param {Function} writer   Binary writer function.  [was: c]  [was: Jh]
 * @param {*}        [defaultFlag=Dd] Default-value flag source. [was: W]
 *
 * [was: n0]
 */
export class FieldDescriptor { // was: n0
  constructor(reader, writer, defaultFlag = Dd) {
    /** @type {Function} Reader function. [was: HD] */
    this.HD = reader;
    /** @type {Function} Writer function. [was: Jh] */
    this.Jh = writer;
    const token = w0(Dd); // was: Q (reused)
    /** @type {boolean} Whether this field uses the Dd default. [was: W] */
    this.W = !!token && defaultFlag === token || false;
  }
}

// ---------------------------------------------------------------------------
// Wire format reader/writer pairs  (line 58025)
// ---------------------------------------------------------------------------

/**
 * Submessage reader/writer pair using Nq encoding (variant 1).
 * Reads wire-type 2 (length-delimited) and delegates to P_.
 *
 * [was: fSR]
 */
export const submessageReaderWriter1 = tQ(function (wire, msg, fieldNum, msgCtor, fieldDesc) { // was: fSR
  if (wire.O !== 2) return false;
  P_(wire, Qe(msg, msgCtor, fieldNum), fieldDesc);
  return true;
}, Nq);

/**
 * Submessage reader/writer pair using Nq encoding (variant 2).
 * Identical encoding to fSR.
 *
 * [was: vWR]
 */
export const submessageReaderWriter2 = tQ(function (wire, msg, fieldNum, msgCtor, fieldDesc) { // was: vWR
  if (wire.O !== 2) return false;
  P_(wire, Qe(msg, msgCtor, fieldNum), fieldDesc);
  return true;
}, Nq);

// Internal symbol keys for serialization state
export const SYM_SERIALIZE = Symbol(); // was: gG
export const SYM_SKIP = Symbol();      // was: sS
export const SYM_WRAP = Symbol();      // was: wG
export const SYM_VALUE = Symbol();     // was: vk
export const SYM_BINARY = Symbol();    // was: by

// ---------------------------------------------------------------------------
// Full message serialization  (line 58036)
// ---------------------------------------------------------------------------

/**
 * Serializes a protobuf message to a Uint8Array.
 *
 * Walks the `zU` descriptor array through the YRO writer, collecting
 * byte chunks into a single output buffer.
 *
 * @param {ProtobufMessage} message      The message to serialize.      [was: Q]
 * @param {*}               fieldDescs   Field descriptor set.          [was: c]
 * @returns {Uint8Array}                 Serialized binary data.
 *
 * [was: mg]
 */
export function serializeMessage(message, fieldDescs) { // was: mg
  const writer = new YRO(); // was: W
  a$(message.NetworkStatusManager, writer, Sj(SYM_SERIALIZE, jj, OS, fieldDescs));
  o$(writer, writer.W.end());
  const output = new Uint8Array(writer.O); // was: Q (reused)
  const chunks = writer.A; // was: c (reused)
  const chunkCount = chunks.length; // was: m
  let offset = 0; // was: K
  for (let i = 0; i < chunkCount; i++) { // was: T
    const chunk = chunks[i]; // was: r
    output.set(chunk, offset);
    offset += chunk.length;
  }
  writer.A = [output];
  return output;
}

// ---------------------------------------------------------------------------
// Varint int32 read/write  (line 58053)
// ---------------------------------------------------------------------------

/**
 * Reads a varint-encoded int32 from wire type 0, storing the result
 * via C0.
 *
 * [was: aD]
 */
export const varintInt32Reader = Pk(function (wire, msg, fieldNum) { // was: aD
  if (wire.O !== 1) return false;
  C0(msg, fieldNum, LV(wire.W));
  return true;
}, JQ, vX);

/**
 * Reads a varint-encoded int32 into a oneof slot.
 *
 * [was: UuK]
 */
export const varintInt32OneofReader = Pk(function (wire, msg, fieldNum, oneofIdx) { // was: UuK
  if (wire.O !== 1) return false;
  kH(msg, fieldNum, oneofIdx, LV(wire.W));
  return true;
}, JQ, vX);

// ---------------------------------------------------------------------------
// Float32 read/write  (line 58065)
// ---------------------------------------------------------------------------

/**
 * Reads a 32-bit float from wire type 5 (fixed32), decoding IEEE 754.
 *
 * [was: GV]
 */
export const float32Reader = Pk(function (wire, msg, fieldNum) { // was: GV
  if (wire.O !== 5) return false;
  let bits = sB(wire.W); // was: m
  const sign = (bits >> 31) * 2 + 1; // was: Q (reused)
  const exponent = (bits >>> 23) & 255; // was: K
  bits &= 8388607; // was: m (mantissa)
  C0(msg, fieldNum, exponent === 255
    ? (bits ? NaN : sign * Infinity)
    : (exponent === 0
      ? sign * 1.401298464324817e-45 * bits
      : sign * Math.pow(2, exponent - 150) * (bits + 8388608)));
  return true;
}, function (writer, msg, fieldNum) {
  msg = wY(msg);
  if (msg != null) {
    rG(writer, fieldNum, 5);
    const view = Mq || (Mq = new DataView(new ArrayBuffer(8)));
    view.setFloat32(0, +msg, true); // was: !0
    HW = 0;
    tC = view.getUint32(0, true);
    mE(writer.W, tC);
  }
}, KL3);

// ---------------------------------------------------------------------------
// Sint32 zigzag read/write  (line 58084)
// ---------------------------------------------------------------------------

/**
 * Reads a zigzag-encoded sint32 from wire type 0.
 *
 * [was: $6]
 */
export const sint32ZigzagReader = Pk(function (wire, msg, fieldNum) { // was: $6
  if (wire.O !== 0) return false;
  C0(msg, fieldNum, S0(wire.W, ZY));
  return true;
}, R$, OR);

/**
 * Reads a zigzag-encoded sint32 into a oneof slot.
 *
 * [was: IBX]
 */
export const sint32ZigzagOneofReader = Pk(function (wire, msg, fieldNum, oneofIdx) { // was: IBX
  if (wire.O !== 0) return false;
  kH(msg, fieldNum, oneofIdx, S0(wire.W, ZY));
  return true;
}, R$, OR);

// ---------------------------------------------------------------------------
// Sint64 zigzag read/write  (line 58094)
// ---------------------------------------------------------------------------

/**
 * Reads a zigzag-encoded sint64 from wire type 0.
 *
 * [was: Xjw]
 */
export const sint64ZigzagReader = Pk(function (wire, msg, fieldNum) { // was: Xjw
  if (wire.O !== 0) return false;
  C0(msg, fieldNum, S0(wire.W, Fm));
  return true;
}, function (writer, msg, fieldNum) {
  msg = kJ(msg);
  if (msg != null) {
    XV(msg);
    if (msg != null) {
      rG(writer, fieldNum, 0);
      switch (typeof msg) {
        case "number":
          i6(msg);
          Wk(writer.W, tC, HW);
          break;
        case "bigint": {
          const encoded = Jo(msg);
          Wk(writer.W, encoded.O, encoded.W);
          break;
        }
        default: {
          const encoded = kC(msg);
          Wk(writer.W, encoded.O, encoded.W);
        }
      }
    }
  }
}, muW);

// ---------------------------------------------------------------------------
// Uint32 read/write  (line 58118)
// ---------------------------------------------------------------------------

/**
 * Reads a varint-encoded uint32 from wire type 0.
 *
 * [was: PX]
 */
export const uint32Reader = Pk(function (wire, msg, fieldNum) { // was: PX
  if (wire.O !== 0) return false;
  C0(msg, fieldNum, ZZ(wire.W));
  return true;
}, kl, gS);

/**
 * Reads a uint32 into a oneof slot.
 *
 * [was: AUx]
 */
export const uint32OneofReader = Pk(function (wire, msg, fieldNum, oneofIdx) { // was: AUx
  if (wire.O !== 0) return false;
  kH(msg, fieldNum, oneofIdx, ZZ(wire.W));
  return true;
}, kl, gS);

// ---------------------------------------------------------------------------
// Int64 signed read/write  (line 58130)
// ---------------------------------------------------------------------------

/**
 * Reads a signed int64 from wire type 1 (fixed64).
 *
 * [was: efy]
 */
export const int64SignedReader = Pk(function (wire, msg, fieldNum) { // was: efy
  return ch(wire, msg, fieldNum);
}, function (writer, msg, fieldNum) {
  msg = kJ(msg);
  if (msg != null) {
    Bk(msg);
    rG(writer, fieldNum, 1);
    const w = writer.W;
    Bk(msg);
    switch (typeof msg) {
      case "number":
        if (msg < 0) {
          const neg = -msg;
          const encoded = YC(new M6(neg & 4294967295, neg / 4294967296));
          mE(w, encoded.O);
          mE(w, encoded.W);
        } else {
          NS(msg);
          mE(w, tC);
          mE(w, HW);
        }
        break;
      case "bigint": {
        const encoded = msg < BigInt(0) ? YC(Jo(-msg)) : Jo(msg);
        mE(w, encoded.O);
        mE(w, encoded.W);
        break;
      }
      default: {
        const encoded = msg.length && msg[0] === "-"
          ? YC(kC(msg.substring(1)))
          : kC(msg);
        mE(w, encoded.O);
        mE(w, encoded.W);
      }
    }
  }
}, fK);

/**
 * Int64 signed alternative writer (uses AQ instead of full encoding).
 *
 * [was: VtX]
 */
export const int64SignedWriterAlt = Pk(function (wire, msg, fieldNum) { // was: VtX
  return ch(wire, msg, fieldNum);
}, function (writer, msg, fieldNum) {
  AQ(writer, fieldNum, kJ(msg));
}, fK);

// ---------------------------------------------------------------------------
// Repeated int64 read/write  (line 58167)
// ---------------------------------------------------------------------------

/**
 * Reads repeated int64 values (wire type 1 or 2 packed).
 *
 * [was: BaX]
 */
export const repeatedInt64Reader = ly(function (wire, msg, fieldNum) { // was: BaX
  if (wire.O !== 1 && wire.O !== 2) return false;
  const arr = uF(msg, msg[SLOT_ARRAY_STATE] | 0, fieldNum);
  wire.O === 2 ? CV(wire, dy, arr) : arr.push(dy(wire.W));
  return true;
}, function (writer, msg, fieldNum) {
  msg = $l(kJ, msg, false); // was: !1
  if (msg != null) {
    for (let i = 0; i < msg.length; i++) {
      AQ(writer, fieldNum, msg[i]);
    }
  }
}, fK);

// ---------------------------------------------------------------------------
// Fixed32 read/write  (line 58178)
// ---------------------------------------------------------------------------

/**
 * Reads a raw fixed32 (wire type 5) as an unsigned integer.
 *
 * [was: xuX]
 */
export const fixed32Reader = Pk(function (wire, msg, fieldNum) { // was: xuX
  if (wire.O !== 5) return false;
  C0(msg, fieldNum, sB(wire.W));
  return true;
}, function (writer, msg, fieldNum) {
  msg = $J(msg);
  if (msg != null) {
    rG(writer, fieldNum, 5);
    mE(writer.W, msg);
  }
}, cU7);

// ---------------------------------------------------------------------------
// Enum read/write  (line 58188)
// ---------------------------------------------------------------------------

/**
 * Reads a varint-encoded enum value from wire type 0.
 *
 * [was: lt]
 */
export const enumReader = Pk(function (wire, msg, fieldNum) { // was: lt
  if (wire.O !== 0) return false;
  C0(msg, fieldNum, Fg(wire.W));
  return true;
}, Yl, pX0);

/**
 * Reads an enum value into a oneof slot.
 *
 * [was: q40]
 */
export const enumOneofReader = Pk(function (wire, msg, fieldNum, oneofIdx) { // was: q40
  if (wire.O !== 0) return false;
  kH(msg, fieldNum, oneofIdx, Fg(wire.W));
  return true;
}, Yl, pX0);

// ---------------------------------------------------------------------------
// String read/write  (line 58200)
// ---------------------------------------------------------------------------

/**
 * Reads a length-delimited string from wire type 2.
 *
 * [was: ut]
 */
export const stringReader = Pk(function (wire, msg, fieldNum) { // was: ut
  if (wire.O !== 2) return false;
  C0(msg, fieldNum, ho(wire));
  return true;
}, p0, jM);

/**
 * Reads repeated strings from wire type 2.
 *
 * [was: npx]
 */
export const repeatedStringReader = ly(function (wire, msg, fieldNum) { // was: npx
  if (wire.O !== 2) return false;
  uF(msg, msg[SLOT_ARRAY_STATE] | 0, fieldNum).push(ho(wire));
  return true;
}, function (writer, msg, fieldNum) {
  msg = $l(Qm, msg, true); // was: !0
  if (msg != null) {
    for (let i = 0; i < msg.length; i++) {
      const val = msg[i];
      if (val != null) Vf(writer, fieldNum, fN(val));
    }
  }
}, jM);

/**
 * Reads a string into a oneof slot.
 *
 * [was: DuK]
 */
export const stringOneofReader = Pk(function (wire, msg, fieldNum, oneofIdx) { // was: DuK
  if (wire.O !== 2) return false;
  kH(msg, fieldNum, oneofIdx, ho(wire));
  return true;
}, p0, jM);

// ---------------------------------------------------------------------------
// Submessage read/write (generic)  (line 58228)
// ---------------------------------------------------------------------------

/**
 * Generic submessage reader/writer: reads wire type 2, creates the
 * sub-message via `ts`, and delegates to P_.
 *
 * [was: hj]
 */
export const submessageReaderWriter = (function (reader, writer, defaultFlag = Dd) {
  return new FieldDescriptor(reader, writer, defaultFlag);
})(function (wire, msg, fieldNum, msgCtor, fieldDescs) {
  if (wire.O !== 2) return false;
  const sub = ts(undefined, msgCtor); // was: void 0
  uF(msg, msg[SLOT_ARRAY_STATE] | 0, fieldNum).push(sub);
  P_(wire, sub, fieldDescs);
  return true;
}, function (writer, msg, fieldNum, msgCtor, fieldDescs) {
  if (Array.isArray(msg)) {
    for (let i = 0; i < msg.length; i++) {
      Qz(writer, msg[i], fieldNum, msgCtor, fieldDescs);
    }
    const flags = msg[SLOT_ARRAY_STATE] | 0;
    if (!(flags & 1)) msg[SLOT_ARRAY_STATE] = flags | 1;
  }
});

// ---------------------------------------------------------------------------
// Oneof submessage read/write  (line 58245)
// ---------------------------------------------------------------------------

/**
 * Reads a submessage into a oneof slot (wire type 2).
 *
 * [was: zV]
 */
export const oneofSubmessageReader = tQ(function (wire, msg, fieldNum, msgCtor, fieldDescs, oneofIdx) { // was: zV
  if (wire.O !== 2) return false;
  let flags = msg[SLOT_ARRAY_STATE] | 0;
  Js(msg, flags, oneofIdx, fieldNum, qS(flags));
  const sub = Qe(msg, msgCtor, fieldNum);
  P_(wire, sub, fieldDescs);
  return true;
}, Qz);

// ---------------------------------------------------------------------------
// Bytes read/write  (line 58254)
// ---------------------------------------------------------------------------

/**
 * Reads raw bytes from wire type 2.
 *
 * [was: CK]
 */
export const bytesReader = Pk(function (wire, msg, fieldNum) { // was: CK
  if (wire.O !== 2) return false;
  C0(msg, fieldNum, zp(wire));
  return true;
}, function (writer, msg, fieldNum) {
  msg = YJ(msg);
  if (msg != null) Vf(writer, fieldNum, i7(msg, true).buffer); // was: !0
}, Taw);

/**
 * Reads repeated bytes fields from wire type 2.
 *
 * [was: M_]
 */
export const repeatedBytesReader = ly(function (wire, msg, fieldNum) { // was: M_
  if (wire.O !== 2) return false;
  uF(msg, msg[SLOT_ARRAY_STATE] | 0, fieldNum).push(zp(wire));
  return true;
}, function (writer, msg, fieldNum) {
  msg = $l(YJ, msg, false); // was: !1
  if (msg != null) {
    for (let i = 0; i < msg.length; i++) {
      const val = msg[i];
      if (val != null) Vf(writer, fieldNum, i7(val, true).buffer);
    }
  }
}, Taw);

// ---------------------------------------------------------------------------
// Uint32 unsigned / Int32 signed read/write  (line 58279)
// ---------------------------------------------------------------------------

/**
 * Reads unsigned uint32 (>>> 0) from wire type 0.
 *
 * [was: Jj]
 */
export const uint32UnsignedReader = Pk(function (wire, msg, fieldNum) { // was: Jj
  if (wire.O !== 0) return false;
  C0(msg, fieldNum, ZZ(wire.W) >>> 0);
  return true;
}, function (writer, msg, fieldNum) {
  msg = $J(msg);
  if (msg != null) {
    rG(writer, fieldNum, 0);
    K0(writer.W, msg);
  }
}, QB0);

/**
 * Reads signed int32 from wire type 0.
 *
 * [was: RD]
 */
export const int32SignedReader = Pk(function (wire, msg, fieldNum) { // was: RD
  if (wire.O !== 0) return false;
  C0(msg, fieldNum, ZZ(wire.W));
  return true;
}, function (writer, msg, fieldNum) {
  ej(writer, fieldNum, G0(msg));
}, opd);

/**
 * Reads repeated int32 (packed or unpacked) from wire type 0 or 2.
 *
 * [was: ttO]
 */
export const repeatedInt32Reader = ly(function (wire, msg, fieldNum) { // was: ttO
  if (wire.O !== 0 && wire.O !== 2) return false;
  const arr = uF(msg, msg[SLOT_ARRAY_STATE] | 0, fieldNum);
  wire.O === 2 ? CV(wire, gW7, arr) : arr.push(ZZ(wire.W));
  return true;
}, function (writer, msg, fieldNum) {
  msg = $l(G0, msg, true); // was: !0
  if (msg != null) {
    for (let i = 0; i < msg.length; i++) {
      ej(writer, fieldNum, msg[i]);
    }
  }
}, opd);

// ---------------------------------------------------------------------------
// Fixed32 raw 4-byte LE read  (line 58309)
// ---------------------------------------------------------------------------

/**
 * Reads a raw 4-byte little-endian fixed32 from wire type 5, assembling
 * the bytes manually.
 *
 * [was: HP7]
 */
export const fixed32RawReader = Pk(function (wire, msg, fieldNum) { // was: HP7
  if (wire.O !== 5) return false;
  const buf = wire.W;
  const data = buf.O; // was: m
  const pos = buf.W; // was: K
  const isSamsungSmartTV = data[pos + 0]; // was: T
  const publishAdEvent = data[pos + 1]; // was: r
  const recordPlaybackStartTiming = data[pos + 2]; // was: U
  const b3 = data[pos + 3]; // was: m (reused)
  EB(buf, 4);
  // Note: the assembly of these 4 bytes into the final value continues
  // beyond line 58319 in the source.
  // Partial — the reader stores the assembled uint32.
  const value = (isSamsungSmartTV | (publishAdEvent << 8) | (recordPlaybackStartTiming << 16) | (b3 << 24)) >>> 0;
  C0(msg, fieldNum, value);
  return true;
});
