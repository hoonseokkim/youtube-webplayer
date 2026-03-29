/**
 * Zlib compression module - JavaScript port of zlib 1.2.8
 *
 * Extracted from YouTube web player base.js
 * Source: player_es6.vflset/en_US/base.js
 * Source line ranges: 9752-10767 (deflate core), 65235-65465 (utils, tables, stream, prototypes)
 *
 * Original zlib authors:
 *   Jean-loup Gailly (jloup@gzip.org)
 *   Mark Adler (madler@alumni.caltech.edu)
 *
 * Copyright (C) 1995-2013 Jean-loup Gailly and Mark Adler
 * See RFC 1950 (zlib format), RFC 1951 (deflate format), RFC 1952 (gzip format)
 */
import { userSkipAd } from '../ads/dai-cue-range.js'; // was: s1
import { externalLinkIcon } from '../ui/svg-icons.js'; // was: n2
import { AdNextParamsMetadata } from '../ads/ad-interaction.js'; // was: lx
import { musicTrackEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: m2

// ---------------------------------------------------------------------------
// Typed array utilities  [was: Id object]
// Source lines: 65235-65301
// ---------------------------------------------------------------------------

const TYPED_ARRAY_SUPPORT = // was: G4m
  typeof Uint8Array !== "undefined" &&
  typeof Uint16Array !== "undefined" &&
  typeof Int32Array !== "undefined";

/**
 * Assign properties from source objects to target (like Object.assign).
 * @param {object} target [was: Q]
 * @param {...object} sources
 * @returns {object}
 */
function assign(target) { // was: Id.assign
  const sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    const src = sources.shift();
    if (src) {
      if (typeof src !== "object") {
        throw new TypeError(src + "must be non-object");
      }
      for (const key in src) {
        if (Object.prototype.hasOwnProperty.call(src, key)) {
          target[key] = src[key];
        }
      }
    }
  }
  return target;
}

/**
 * Shrink a typed array or plain array to the given length.
 * @param {Uint8Array|Array} buf [was: Q]
 * @param {number} size [was: c]
 * @returns {Uint8Array|Array}
 */
function shrinkBuf(buf, size) { // was: Id.X2
  if (buf.length === size) return buf;
  if (buf.subarray) return buf.subarray(0, size);
  buf.length = size;
  return buf;
}

// Typed-array copy/flatten implementations [was: $o7]
const typedArrayOps = {
  arraySet(dest, src, srcOffset, len, destOffset) { // was: xm
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(srcOffset, srcOffset + len), destOffset);
    } else {
      for (let i = 0; i < len; i++) {
        dest[destOffset + i] = src[srcOffset + i];
      }
    }
  },
  flattenChunks(chunks) { // was: U6
    let totalLen = 0;
    for (let i = 0; i < chunks.length; i++) {
      totalLen += chunks[i].length;
    }
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (let i = 0; i < chunks.length; i++) {
      result.set(chunks[i], offset);
      offset += chunks[i].length;
    }
    return result;
  },
};

// Plain-array copy/flatten implementations [was: PWR]
const plainArrayOps = {
  arraySet(dest, src, srcOffset, len, destOffset) { // was: xm
    for (let i = 0; i < len; i++) {
      dest[destOffset + i] = src[srcOffset + i];
    }
  },
  flattenChunks(chunks) { // was: U6
    return [].concat.apply([], chunks);
  },
};

/** @type {Uint8ArrayConstructor|ArrayConstructor} */
let Buf8; // was: Id.Gk (byte buffer constructor)
/** @type {Uint16ArrayConstructor|ArrayConstructor} */
let Buf16; // was: Id.M$ (16-bit buffer constructor)
/** @type {Int32ArrayConstructor|ArrayConstructor} */
let Buf32; // was: Id.hS (32-bit buffer constructor)

/** @type {typeof typedArrayOps.arraySet} */
let arraySet; // was: Id.xm
/** @type {typeof typedArrayOps.flattenChunks} */
let flattenChunks; // was: Id.U6

/**
 * Detect typed array support and set buffer constructors accordingly.
 */
function setTyped() { // was: Id.Wo
  if (TYPED_ARRAY_SUPPORT) {
    Buf8 = Uint8Array;
    Buf16 = Uint16Array;
    Buf32 = Int32Array;
    arraySet = typedArrayOps.arraySet;
    flattenChunks = typedArrayOps.flattenChunks;
  } else {
    Buf8 = Array;
    Buf16 = Array;
    Buf32 = Array;
    arraySet = plainArrayOps.arraySet;
    flattenChunks = plainArrayOps.flattenChunks;
  }
}

setTyped();

// Check for Uint8Array support (used for string conversion) [was: lU0]
let STR_APPLY_UIA_OK = true; // was: lU0
try {
  new Uint8Array(1);
} catch (_e) {
  STR_APPLY_UIA_OK = false;
}

// ---------------------------------------------------------------------------
// Adler-32 checksum  [was: MV]
// Source lines: 65308-65323
// ---------------------------------------------------------------------------

/**
 * Compute Adler-32 checksum.
 * @param {number} adler - Running checksum [was: Q]
 * @param {Uint8Array|Array} buf [was: c]
 * @param {number} len [was: W]
 * @param {number} pos [was: m]
 * @returns {number}
 */
function adler32(adler, buf, len, pos) { // was: MV
  let userSkipAd = adler & 0xffff | 0; // was: K
  let s2 = (adler >>> 16) & 0xffff | 0; // reuse of Q
  for (let n; len !== 0;) { // was: T
    n = len > 2000 ? 2000 : len;
    len -= n;
    do {
      userSkipAd = userSkipAd + buf[pos++] | 0;
      s2 = s2 + userSkipAd | 0;
    } while (--n);
    userSkipAd %= 65521;
    s2 %= 65521;
  }
  return userSkipAd | (s2 << 16) | 0;
}

// ---------------------------------------------------------------------------
// CRC-32 checksum  [was: J9]
// Source lines: 65325-65336
// ---------------------------------------------------------------------------

// Build CRC lookup table [was: ueW]
const crcTable = []; // was: ueW
for (let n = 0; n < 256; n++) { // was: s4
  let c = n; // was: E4
  for (let k = 0; k < 8; k++) { // was: hO7
    c = (c & 1) ? (3988292384 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

/**
 * Compute CRC-32 checksum.
 * @param {number} crc - Running CRC [was: Q]
 * @param {Uint8Array|Array} buf [was: c]
 * @param {number} len [was: W]
 * @param {number} pos [was: m]
 * @returns {number}
 */
function crc32(crc, buf, len, pos) { // was: J9
  const end = pos + len;
  crc ^= -1;
  for (let i = pos; i < end; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

// ---------------------------------------------------------------------------
// Error messages  [was: fu]
// Source lines: 65338-65349
// ---------------------------------------------------------------------------

/** @enum {string} */
const messages = { // was: fu
  2: "need dictionary",      // Z_NEED_DICT
  1: "stream end",           // Z_STREAM_END
  0: "",                     // Z_OK
  "-1": "file error",        // Z_ERRNO
  "-2": "stream error",      // Z_STREAM_ERROR
  "-3": "data error",        // Z_DATA_ERROR
  "-4": "insufficient memory", // Z_MEM_ERROR
  "-5": "buffer error",      // Z_BUF_ERROR
  "-6": "incompatible version", // Z_VERSION_ERROR
};

// ---------------------------------------------------------------------------
// Deflate constants and tables
// Source lines: 65350-65398
// ---------------------------------------------------------------------------

/** Extra bits for each length code [was: Z8] */
const extra_lbits = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];

/** Extra bits for each distance code [was: d2] */
const extra_dbits = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];

/** Extra bits for each bit-length code [was: QU3] */
const extra_blbits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7];

/** Order of bit-length code lengths [was: $I] */
const bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

/** Fixed literal/length tree [was: PY] */
const static_ltree = Array(576); // was: PY
zeroArray(static_ltree);

/** Fixed distance tree [was: l3] */
const static_dtree = Array(60); // was: l3
zeroArray(static_dtree);

/** Distance code lookup [was: so] */
const _dist_code = Array(512); // was: so
zeroArray(_dist_code);

/** Length code lookup [was: FM] */
const _length_code = Array(256); // was: FM
zeroArray(_length_code);

/** Base length for each length code [was: Eo] */
const base_length = Array(29); // was: Eo
zeroArray(base_length);

/** Base distance for each distance code [was: Lu] */
const base_dist = Array(30); // was: Lu
zeroArray(base_dist);

/** Static tree descriptors [was: Ke, Tn, ox] */
let static_l_desc; // was: Ke - static literal tree descriptor
let static_d_desc; // was: Tn - static distance tree descriptor
let static_bl_desc; // was: ox - static bit-length tree descriptor

/** Whether static trees have been initialized [was: mR] */
let static_init_done = false; // was: mR

// ---------------------------------------------------------------------------
// String-to-UTF8 conversion  [was: XM]
// Source line: 9752
// ---------------------------------------------------------------------------

/**
 * Convert a JavaScript string to a UTF-8 byte array.
 * @param {string} str [was: Q]
 * @returns {Uint8Array}
 */
function string2buf(str) { // was: XM
  let buf, i, c, strLen = str.length, bufLen = 0; // was: Q, c, W, m, K

  for (i = 0; i < strLen; i++) {
    c = str.charCodeAt(i);
    if ((c & 0xfc00) === 0xd800 && i + 1 < strLen) {
      const c2 = str.charCodeAt(i + 1); // was: r
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        i++;
      }
    }
    bufLen += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  buf = new Buf8(bufLen);
  let pos = 0;
  for (i = 0; pos < bufLen; i++) { // was: c = W = 0
    c = str.charCodeAt(i);
    if ((c & 0xfc00) === 0xd800 && i + 1 < strLen) {
      const c2 = str.charCodeAt(i + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        i++;
      }
    }
    if (c < 0x80) {
      buf[pos++] = c;
    } else if (c < 0x800) {
      buf[pos++] = 0xc0 | (c >>> 6);
      buf[pos++] = 0x80 | (c & 0x3f);
    } else if (c < 0x10000) {
      buf[pos++] = 0xe0 | (c >>> 12);
      buf[pos++] = 0x80 | ((c >>> 6) & 0x3f);
      buf[pos++] = 0x80 | (c & 0x3f);
    } else {
      buf[pos++] = 0xf0 | (c >>> 18);
      buf[pos++] = 0x80 | ((c >>> 12) & 0x3f);
      buf[pos++] = 0x80 | ((c >>> 6) & 0x3f);
      buf[pos++] = 0x80 | (c & 0x3f);
    }
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Small utility functions
// Source lines: 9776-9797
// ---------------------------------------------------------------------------

/**
 * Zero all elements of an array.
 * @param {Array|TypedArray} arr [was: Q]
 */
function zeroArray(arr) { // was: A9
  for (let i = arr.length; --i >= 0;) {
    arr[i] = 0;
  }
}

/**
 * Static tree descriptor.
 * @param {Array|null} staticTree - The static tree array [was: Q -> iF]
 * @param {Array} extraBits - Extra bits table [was: c -> qh]
 * @param {number} extraBase - First code with extra bits [was: W -> U_]
 * @param {number} numElements - Max number of elements in the tree [was: m -> w4]
 * @param {number} maxLength - Max bit length [was: K -> EX]
 */
function StaticTreeDesc(staticTree, extraBits, extraBase, numElements, maxLength) { // was: eU
  this.static_tree = staticTree;       // was: iF
  this.extra_bits = extraBits;         // was: qh
  this.extra_base = extraBase;         // was: U_
  this.elems = numElements;            // was: w4
  this.max_length = maxLength;         // was: EX
  this.has_stree = staticTree && staticTree.length; // was: O9
}

/**
 * Tree descriptor for a dynamic Huffman tree.
 * @param {Array} dynTree - The dynamic tree array [was: Q -> WH]
 * @param {StaticTreeDesc} statDesc - Corresponding static tree descriptor [was: c -> tD]
 */
function TreeDesc(dynTree, statDesc) { // was: BY
  this.dyn_tree = dynTree;   // was: WH
  this.max_code = 0;         // was: Vo
  this.stat_desc = statDesc; // was: tD
}

// ---------------------------------------------------------------------------
// Bit-stream output functions (trees.js equivalent)
// Source lines: 9799-9979
// ---------------------------------------------------------------------------

/**
 * Put a 16-bit value in little-endian order into pending_buf.
 * @param {DeflateState} s [was: Q]
 * @param {number} val [was: c]
 */
function put_short(s, val) { // was: xI
  s.pending_buf[s.pending++] = val & 0xff;
  s.pending_buf[s.pending++] = (val >>> 8) & 0xff;
}

/**
 * Send a value on a given number of bits.
 * Assumes bi_valid < 16.
 * @param {DeflateState} s [was: Q]
 * @param {number} val - Value to send [was: c]
 * @param {number} length - Number of bits [was: W]
 */
function send_bits(s, val, length) { // was: qV
  if (s.bi_valid > 16 - length) {
    s.bi_buf |= (val << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = val >> (16 - s.bi_valid);
    s.bi_valid += length - 16;
  } else {
    s.bi_buf |= (val << s.bi_valid) & 0xffff;
    s.bi_valid += length;
  }
}

/**
 * Send a code of the given tree.
 * @param {DeflateState} s [was: Q]
 * @param {number} code [was: c]
 * @param {Array} tree [was: W]
 */
function send_code(s, code, tree) { // was: nu
  send_bits(s, tree[code * 2], tree[code * 2 + 1]);
}

/**
 * Reverse the first `len` bits of a code.
 * @param {number} code [was: Q]
 * @param {number} len [was: c]
 * @returns {number}
 */
function bi_reverse(code, len) { // was: D8
  let res = 0; // was: W
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
}

/**
 * Generate the codes for a given tree and bit counts.
 * @param {Array} tree [was: Q]
 * @param {number} max_code [was: c]
 * @param {Array} bl_count [was: W]
 */
function gen_codes(tree, max_code, bl_count) { // was: t9
  const next_code = Array(16); // was: m
  let code = 0; // was: K
  for (let bits = 1; bits <= 15; bits++) { // was: T
    next_code[bits] = code = (code + bl_count[bits - 1]) << 1;
  }
  for (let n = 0; n <= max_code; n++) { // was: W
    const len = tree[n * 2 + 1]; // was: K
    if (len !== 0) {
      tree[n * 2] = bi_reverse(next_code[len]++, len);
    }
  }
}

/**
 * Initialize the tree data structures for a new zlib stream.
 * @param {DeflateState} s [was: Q]
 */
function init_block(s) { // was: HY
  let n; // was: c
  for (n = 0; n < 286; n++) s.dyn_ltree[n * 2] = 0;       // was: y$
  for (n = 0; n < 30; n++) s.dyn_dtree[n * 2] = 0;         // was: RY
  for (n = 0; n < 19; n++) s.bl_tree[n * 2] = 0;           // was: b9
  s.dyn_ltree[256 * 2] = 1; // END_BLOCK
  s.opt_len = s.static_len = 0; // was: U5, eC
  s.last_lit = s.matches = 0;   // was: CK, matches
}

/**
 * Flush the bit buffer, keeping at most 7 bits in it.
 * @param {DeflateState} s [was: Q]
 */
function bi_windup(s) { // was: NV
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/**
 * Copy a stored block, storing first the length and its complement.
 * @param {DeflateState} s [was: Q]
 * @param {number} buf - Input data starting position [was: c]
 * @param {number} stored_len [was: W]
 */
function copy_block(s, buf, stored_len) { // was: i3
  bi_windup(s);
  put_short(s, stored_len);
  put_short(s, ~stored_len);
  arraySet(s.pending_buf, s.window, buf, stored_len, s.pending);
  s.pending += stored_len;
}

/**
 * Compare two tree nodes (frequency/depth).
 * @param {Array} tree [was: Q]
 * @param {number} n1 [was: c]
 * @param {number} n2 [was: W]
 * @param {Array} depth [was: m]
 * @returns {boolean}
 */
function smaller(tree, n1, externalLinkIcon, depth) { // was: yD
  const idx1 = n1 * 2;
  const idx2 = externalLinkIcon * 2;
  return tree[idx1] < tree[idx2] || (tree[idx1] === tree[idx2] && depth[n1] <= depth[externalLinkIcon]);
}

/**
 * Restore the heap property by moving down the tree.
 * @param {DeflateState} s [was: Q]
 * @param {Array} tree [was: c]
 * @param {number} k - Node to move down [was: W]
 */
function pqdownheap(s, tree, k) { // was: SU
  const v = s.heap[k]; // was: m
  let j = k << 1; // was: K
  while (j <= s.heap_len) { // was: Y2
    if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
      j++;
    }
    if (smaller(tree, v, s.heap[j], s.depth)) break;
    s.heap[k] = s.heap[j];
    k = j;
    j <<= 1;
  }
  s.heap[k] = v;
}

/**
 * Send the block data compressed using the given Huffman trees.
 * @param {DeflateState} s [was: Q]
 * @param {Array} ltree - Literal tree [was: c]
 * @param {Array} dtree - Distance tree [was: W]
 */
function compress_block(s, ltree, dtree) { // was: w2
  let AdNextParamsMetadata = 0; // was: m (index into pending_buf)
  if (s.last_lit !== 0) {
    do {
      let dist = (s.pending_buf[s.d_buf + AdNextParamsMetadata * 2] << 8) | s.pending_buf[s.d_buf + AdNextParamsMetadata * 2 + 1]; // was: K
      let lc = s.pending_buf[s.l_buf + AdNextParamsMetadata]; // was: T
      AdNextParamsMetadata++;
      if (dist === 0) {
        send_code(s, lc, ltree);
      } else {
        let code = _length_code[lc]; // was: r
        send_code(s, code + 256 + 1, ltree);
        let extra = extra_lbits[code]; // was: U
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);
        }
        dist--;
        code = dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
        send_code(s, code, dtree);
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);
        }
      }
    } while (AdNextParamsMetadata < s.last_lit);
  }
  send_code(s, 256, ltree); // END_BLOCK
}

/**
 * Build a Huffman tree: set bit lengths and compute the tree codes.
 * @param {DeflateState} s [was: Q]
 * @param {TreeDesc} desc [was: c]
 */
function build_tree(s, desc) { // was: b3
  const tree = desc.dyn_tree; // was: W
  const stree = desc.stat_desc.static_tree; // was: m
  const has_stree = desc.stat_desc.has_stree; // was: K
  const elems = desc.stat_desc.elems; // was: T
  let n, max_code = -1; // was: r, U

  s.heap_len = 0; // was: Y2
  s.heap_max = 573; // was: As (HEAP_SIZE = 2 * L_CODES + 1 = 573)

  for (n = 0; n < elems; n++) {
    if (tree[n * 2] !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;
    } else {
      tree[n * 2 + 1] = 0;
    }
  }

  // Fill heap to ensure at least 2 codes
  while (s.heap_len < 2) {
    const node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0); // was: I
    tree[node * 2] = 1;
    s.depth[node] = 0;
    s.opt_len--;
    if (has_stree) {
      s.static_len -= stree[node * 2 + 1];
    }
  }
  desc.max_code = max_code;

  // Build the heap
  for (n = s.heap_len >> 1; n >= 1; n--) {
    pqdownheap(s, tree, n);
  }

  // Construct the Huffman tree by combining the two smallest nodes
  let node = elems; // was: I
  do {
    n = s.heap[1];
    s.heap[1] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1);
    const m = s.heap[1]; // was: m
    s.heap[--s.heap_max] = n;
    s.heap[--s.heap_max] = m;
    tree[node * 2] = tree[n * 2] + tree[m * 2];
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n * 2 + 1] = tree[m * 2 + 1] = node;
    s.heap[1] = node++;
    pqdownheap(s, tree, 1);
  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1];

  // Compute optimal bit lengths and generate codes
  const treeArr = desc.dyn_tree; // was: r (reuse)
  const maxCode = desc.max_code; // was: I
  const staticTree = desc.stat_desc.static_tree; // was: m
  const hasStree = desc.stat_desc.has_stree; // was: K
  const extra = desc.stat_desc.extra_bits; // was: T  (qh)
  const extraBase = desc.stat_desc.extra_base; // was: X  (U_)
  const maxBitLength = desc.stat_desc.max_length; // was: A  (EX)
  let overflow = 0; // was: V

  for (let bits = 0; bits <= 15; bits++) { // was: e
    s.bl_count[bits] = 0;
  }

  treeArr[s.heap[s.heap_max] * 2 + 1] = 0;

  let h; // was: c - reused as index into heap[] (walks forward then backward)
  for (h = s.heap_max + 1; h < 573; h++) { // HEAP_SIZE = 573
    const nodeIdx = s.heap[h]; // was: B
    let bits = treeArr[treeArr[nodeIdx * 2 + 1] * 2 + 1] + 1; // was: e
    if (bits > maxBitLength) {
      bits = maxBitLength;
      overflow++;
    }
    treeArr[nodeIdx * 2 + 1] = bits;
    if (nodeIdx > maxCode) continue; // leaf beyond max_code

    s.bl_count[bits]++;
    let xbits = 0; // was: n
    if (nodeIdx >= extraBase) {
      xbits = extra[nodeIdx - extraBase];
    }
    const f = treeArr[nodeIdx * 2]; // was: S
    s.opt_len += f * (bits + xbits);
    if (hasStree) {
      s.static_len += f * (staticTree[nodeIdx * 2 + 1] + xbits);
    }
  }

  if (overflow !== 0) {
    do {
      let bits = maxBitLength - 1; // was: e
      while (s.bl_count[bits] === 0) bits--;
      s.bl_count[bits]--;
      s.bl_count[bits + 1] += 2;
      s.bl_count[maxBitLength]--;
      overflow -= 2;
    } while (overflow > 0);

    for (let bits = maxBitLength; bits !== 0; bits--) { // was: e
      let externalLinkIcon = s.bl_count[bits]; // was: B
      while (externalLinkIcon !== 0) {
        const musicTrackEntityActionMetadataKey = s.heap[--h]; // was: m
        if (musicTrackEntityActionMetadataKey > maxCode) continue; // skip non-leaf
        if (treeArr[musicTrackEntityActionMetadataKey * 2 + 1] !== bits) {
          s.opt_len += (bits - treeArr[musicTrackEntityActionMetadataKey * 2 + 1]) * treeArr[musicTrackEntityActionMetadataKey * 2];
          treeArr[musicTrackEntityActionMetadataKey * 2 + 1] = bits;
        }
        externalLinkIcon--;
      }
    }
  }
  gen_codes(tree, max_code, s.bl_count);
}

/**
 * Scan a literal or distance tree to determine the frequencies of the
 * codes in the bit length tree.
 * @param {DeflateState} s [was: Q]
 * @param {Array} tree [was: c]
 * @param {number} max_code [was: W]
 */
function scan_tree(s, tree, max_code) { // was: jU
  let n, prevlen = -1, curlen = tree[1], count = 0; // was: m, K, T, r
  let max_count = 7, min_count = 4; // was: U, I

  if (curlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code + 1) * 2 + 1] = 0xffff; // sentinel

  for (n = 0; n <= max_code; n++) {
    const nextlen = curlen; // was: X
    curlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && nextlen === curlen) {
      continue; // was: || separated
    }
    if (count < min_count) {
      s.bl_tree[nextlen * 2] += count;
    } else if (nextlen !== 0) {
      if (nextlen !== prevlen) s.bl_tree[nextlen * 2]++;
      s.bl_tree[16 * 2]++; // REP_3_6
    } else if (count <= 10) {
      s.bl_tree[17 * 2]++; // REPZ_3_10
    } else {
      s.bl_tree[18 * 2]++; // REPZ_11_138
    }
    count = 0;
    prevlen = nextlen;
    if (curlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (nextlen === curlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}

/**
 * Send a literal or distance tree in compressed form using the codes
 * in bl_tree.
 * @param {DeflateState} s [was: Q]
 * @param {Array} tree [was: c]
 * @param {number} max_code [was: W]
 */
function send_tree(s, tree, max_code) { // was: g2
  let n, prevlen = -1, curlen = tree[1], count = 0; // was: m, K, T, r
  let max_count = 7, min_count = 4; // was: U, I

  if (curlen === 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    const nextlen = curlen; // was: X
    curlen = tree[(n + 1) * 2 + 1];
    if (!(++count < max_count && nextlen === curlen)) {
      if (count < min_count) {
        do {
          send_code(s, nextlen, s.bl_tree);
        } while (--count !== 0);
      } else if (nextlen !== 0) {
        if (nextlen !== prevlen) {
          send_code(s, nextlen, s.bl_tree);
          count--;
        }
        send_code(s, 16, s.bl_tree); // REP_3_6
        send_bits(s, count - 3, 2);
      } else if (count <= 10) {
        send_code(s, 17, s.bl_tree); // REPZ_3_10
        send_bits(s, count - 3, 3);
      } else {
        send_code(s, 18, s.bl_tree); // REPZ_11_138
        send_bits(s, count - 11, 7);
      }
      count = 0;
      prevlen = nextlen;
      if (curlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (nextlen === curlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  }
}

/**
 * Determine if the data block is text or binary by checking
 * the distribution of byte values.
 * @param {DeflateState} s [was: Q]
 * @returns {number} 0 = binary, 1 = text
 */
function detect_data_type(s) { // was: J40
  let black_mask = 0xf3ffc07f; // was: c (binary value 4093624447)
  for (let n = 0; n <= 31; n++, black_mask >>>= 1) {
    if ((black_mask & 1) && s.dyn_ltree[n * 2] !== 0) return 0; // binary
  }
  if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
    return 1; // text
  }
  for (let n = 32; n < 256; n++) {
    if (s.dyn_ltree[n * 2] !== 0) return 1;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Pending buffer / literal buffer functions
// Source lines: 10044-10131
// ---------------------------------------------------------------------------

/**
 * Save a literal/length + distance pair into pending buffers.
 * Returns true if the block buffer is full.
 * @param {DeflateState} s [was: Q]
 * @param {number} dist [was: c]
 * @param {number} lc - Literal char or match length - 3 [was: W]
 * @returns {boolean}
 */
function _tr_tally(s, dist, lc) { // was: Oo
  s.pending_buf[s.d_buf + s.last_lit * 2] = (dist >>> 8) & 0xff;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;
  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
  s.last_lit++;
  if (dist === 0) {
    s.dyn_ltree[lc * 2]++;
  } else {
    s.matches++;
    dist--;
    s.dyn_ltree[(_length_code[lc] + 256 + 1) * 2]++;
    s.dyn_dtree[(dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)]) * 2]++;
  }
  return s.last_lit === s.lit_bufsize - 1;
}

/**
 * Set the return error message on a stream.
 * @param {ZStream} strm [was: Q]
 * @param {number} errorCode [was: c]
 * @returns {number}
 */
function err(strm, NetworkErrorCode) { // was: vY
  strm.msg = messages[NetworkErrorCode];
  return NetworkErrorCode;
}

/**
 * Zero out an array (used for head[], prev[] arrays).
 * @param {Array|TypedArray} arr [was: Q]
 */
function zero(arr) { // was: ad
  for (let i = arr.length; --i >= 0;) {
    arr[i] = 0;
  }
}

// ---------------------------------------------------------------------------
// Flush / output functions
// Source lines: 10066-10131
// ---------------------------------------------------------------------------

/**
 * Flush as much pending output as possible. All deflate output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm.output buffer and copying into it.
 * @param {ZStream} strm [was: Q]
 */
function flush_pending(strm) { // was: GZ
  const s = strm.state; // was: c
  let len = s.pending; // was: W
  if (len > strm.avail_out) len = strm.avail_out;
  if (len === 0) return;

  arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
}

/**
 * Flush the current block, with given end-of-file flag.
 * IN assertion: strStart >= block_start.
 * @param {DeflateState} s [was: Q]
 * @param {boolean} last - True if this is the last block [was: c]
 */
function _tr_flush_block(s, last) { // was: u3
  const stored_start = s.block_start >= 0 ? s.block_start : -1; // was: W
  const stored_len = s.strstart - s.block_start; // was: m
  let max_blindex = 0; // was: K

  if (s.level > 0) {
    if (s.strm.data_type === 2) {
      s.strm.data_type = detect_data_type(s);
    }

    build_tree(s, s.l_desc);
    build_tree(s, s.d_desc);

    // Build bit-length tree
    scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
    scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
    build_tree(s, s.bl_desc);

    for (max_blindex = 18; max_blindex >= 3; max_blindex--) {
      if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) break;
    }
    s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;

    var opt_lenb = (s.opt_len + 3 + 7) >>> 3; // was: T
    var static_lenb = (s.static_len + 3 + 7) >>> 3; // was: r
    if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
  } else {
    opt_lenb = static_lenb = stored_len + 5;
  }

  if (stored_len + 4 <= opt_lenb && stored_start !== -1) {
    // Stored block
    send_bits(s, last ? 1 : 0, 3);
    copy_block(s, stored_start, stored_len);
  } else if (s.strategy === 4 || static_lenb === opt_lenb) {
    // Fixed Huffman block
    send_bits(s, 2 + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);
  } else {
    // Dynamic Huffman block
    send_bits(s, 4 + (last ? 1 : 0), 3);
    const lcodes = s.l_desc.max_code + 1; // was: W
    const dcodes = s.d_desc.max_code + 1; // was: m
    const blcodes = max_blindex + 1; // was: K
    send_bits(s, lcodes - 257, 5);
    send_bits(s, dcodes - 1, 5);
    send_bits(s, blcodes - 4, 4);
    for (let rank = 0; rank < blcodes; rank++) { // was: T
      send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
    }
    send_tree(s, s.dyn_ltree, lcodes - 1);
    send_tree(s, s.dyn_dtree, dcodes - 1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }

  init_block(s);
  if (last) bi_windup(s);

  s.block_start = s.strstart;
  flush_pending(s.strm);
}

/**
 * Put a byte into pending_buf.
 * @param {DeflateState} s [was: Q]
 * @param {number} b [was: c]
 */
function put_byte(s, b) { // was: h9
  s.pending_buf[s.pending++] = b;
}

/**
 * Put a 16-bit value in big-endian (MSB first) into pending_buf.
 * @param {DeflateState} s [was: Q]
 * @param {number} val [was: c]
 */
function putShortMSB(s, val) { // was: zZ
  s.pending_buf[s.pending++] = (val >>> 8) & 0xff;
  s.pending_buf[s.pending++] = val & 0xff;
}

// ---------------------------------------------------------------------------
// Longest match (deflate core)
// Source lines: 10133-10214
// ---------------------------------------------------------------------------

/**
 * Find the longest matching string, returning its length.
 * @param {DeflateState} s [was: Q]
 * @param {number} cur_match - Hash chain head [was: c]
 * @returns {number} Match length
 */
function longest_match(s, cur_match) { // was: Cu
  let chain_length = s.max_chain_length; // was: W (ih)
  let scan = s.strstart; // was: m (jh)
  let best_len = s.prev_length; // was: K (H1)
  const nice_match = s.nice_match; // was: T (gO)
  const limit = s.strstart > s.w_size - 262 ? s.strstart - (s.w_size - 262) : 0; // was: r
  const win = s.window; // was: U
  const wmask = s.w_mask; // was: I (MR)
  const prev = s.prev; // was: X (N3)
  const strend = s.strstart + 258; // was: A
  let scan_end1 = win[scan + best_len - 1]; // was: e
  let scan_end = win[scan + best_len]; // was: V

  if (s.prev_length >= s.good_match) chain_length >>= 2; // was: Sq
  if (nice_match > s.lookahead) { /* noop, capped later */ }

  do {
    let match = cur_match; // was: B
    if (win[match + best_len] === scan_end &&
        win[match + best_len - 1] === scan_end1 &&
        win[match] === win[scan] &&
        win[++match] === win[scan + 1]) {
      scan += 2;
      match++;
      // Unrolled inner loop (8 comparisons per iteration)
      while (
        win[++scan] === win[++match] && win[++scan] === win[++match] &&
        win[++scan] === win[++match] && win[++scan] === win[++match] &&
        win[++scan] === win[++match] && win[++scan] === win[++match] &&
        win[++scan] === win[++match] && win[++scan] === win[++match] &&
        scan < strend
      ) { /* empty */ }

      const len = 258 - (strend - scan); // was: B
      scan = strend - 258;
      if (len > best_len) {
        s.match_start = cur_match; // was: o1
        best_len = len;
        if (len >= nice_match) break;
        scan_end1 = win[scan + best_len - 1];
        scan_end = win[scan + best_len];
      }
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  return best_len <= s.lookahead ? best_len : s.lookahead;
}

/**
 * Fill the window when the lookahead becomes insufficient.
 * @param {DeflateState} s [was: Q]
 */
function fill_window(s) { // was: Rd
  const wsize = s.w_size; // was: c
  let more; // was: m
  do {
    more = s.window_size - s.lookahead - s.strstart; // was: m (iA - EO - jh)

    if (s.strstart >= wsize + (wsize - 262)) {
      arraySet(s.window, s.window, wsize, wsize, 0);
      s.match_start -= wsize;
      s.strstart -= wsize;
      s.block_start -= wsize;
      let n = s.hash_size; // was: K = W (bT)
      let p; // was: T
      do {
        p = s.head[--n];
        s.head[n] = p >= wsize ? p - wsize : 0;
      } while (--n); // reuse original variable pattern

      // Fix: re-read n
      n = wsize;
      let i = wsize; // was: K
      do {
        p = s.prev[--i];
        s.prev[i] = p >= wsize ? p - wsize : 0;
      } while (--n);
      more += wsize;
    }

    if (s.strm.avail_in === 0) break; // was: XD

    // Read from input into window
    const strm = s.strm; // was: K
    const n = strm.avail_in > more ? more : strm.avail_in; // was: r
    if (n === 0) { /* do nothing */ }
    else {
      strm.avail_in -= n;
      arraySet(s.window, strm.input, strm.next_in, n, s.strstart + s.lookahead);
      if (s.strm.state.wrap === 1) {
        s.strm.adler = adler32(s.strm.adler, s.window, n, s.strstart + s.lookahead);
      } else if (s.strm.state.wrap === 2) {
        s.strm.adler = crc32(s.strm.adler, s.window, n, s.strstart + s.lookahead);
      }
      strm.next_in += n;
      strm.total_in += n;
    }

    s.lookahead += n;
    if (s.lookahead + s.insert >= 3) {
      let str = s.strstart - s.insert; // was: m
      s.ins_h = s.window[str]; // was: BJ
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask; // was: n3, V_
      while (s.insert) {
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 3 - 1]) & s.hash_mask;
        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < 3) break;
      }
    }
  } while (s.lookahead < 262 && s.strm.avail_in !== 0);
}

// ---------------------------------------------------------------------------
// Deflate strategies
// Source lines: 10216-10368
// ---------------------------------------------------------------------------

/**
 * Compress as much as possible from the input stream, return the current
 * block state. (Deflate: fast strategy)
 * @param {DeflateState} s [was: Q]
 * @param {number} flush [was: c]
 * @returns {number} Block state (1=need_more, 2=block_done, 3=finish_started, 4=finish_done)
 */
function deflate_fast(s, flush) { // was: kI
  let hash_head; // was: W
  for (;;) {
    if (s.lookahead < 262) {
      fill_window(s);
      if (s.lookahead < 262 && flush === 0) return 1; // need_more
      if (s.lookahead === 0) break;
    }
    hash_head = 0;
    if (s.lookahead >= 3) {
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 3 - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
    }
    if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - 262) {
      s.match_length = longest_match(s, hash_head); // was: I8
    }
    if (s.match_length >= 3) {
      const bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - 3);
      s.lookahead -= s.match_length;
      if (s.match_length <= s.max_lazy_match && s.lookahead >= 3) {
        s.match_length--;
        do {
          s.strstart++;
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 3 - 1]) & s.hash_mask;
          s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        } while (--s.match_length !== 0);
        s.strstart++;
      } else {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;
      }
    } else {
      /* No match; output a literal byte */
      _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (s.last_lit && (_tr_flush_block(s, false), s.strm.avail_out === 0)) {
      return 1;
    }
  }
  s.insert = s.strstart < 2 ? s.strstart : 2;
  if (flush === 4) {
    _tr_flush_block(s, true);
    return s.strm.avail_out === 0 ? 3 : 4;
  }
  if (s.last_lit) {
    _tr_flush_block(s, false);
    if (s.strm.avail_out === 0) return 1;
  }
  return 2;
}

/**
 * Same as above, but achieves better compression. (Deflate: slow/lazy strategy)
 * @param {DeflateState} s [was: Q]
 * @param {number} flush [was: c]
 * @returns {number}
 */
function deflate_slow(s, flush) { // was: YI
  let hash_head, max_insert; // was: W, m

  for (;;) {
    if (s.lookahead < 262) {
      fill_window(s);
      if (s.lookahead < 262 && flush === 0) return 1;
      if (s.lookahead === 0) break;
    }
    hash_head = 0;
    if (s.lookahead >= 3) {
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 3 - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
    }
    s.prev_length = s.match_length;
    s.prev_match = s.match_start; // was: Mt
    s.match_length = 2;

    if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - 262) {
      s.match_length = longest_match(s, hash_head);
      if (s.match_length <= 5 && (s.strategy === 1 || (s.match_length === 3 && s.strstart - s.match_start > 4096))) {
        s.match_length = 2;
      }
    }

    if (s.prev_length >= 3 && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - 3;
      const bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - 3);
      s.lookahead -= s.prev_length - 1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 3 - 1]) & s.hash_mask;
          s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0; // was: Hx
      s.match_length = 2;
      s.strstart++;
      if (bflush) {
        _tr_flush_block(s, false);
        if (s.strm.avail_out === 0) return 1;
      }
    } else if (s.match_available) {
      const bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      if (bflush) _tr_flush_block(s, false);
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) return 1;
    } else {
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }

  if (s.match_available) {
    _tr_tally(s, 0, s.window[s.strstart - 1]);
    s.match_available = 0;
  }
  s.insert = s.strstart < 2 ? s.strstart : 2;
  if (flush === 4) {
    _tr_flush_block(s, true);
    return s.strm.avail_out === 0 ? 3 : 4;
  }
  if (s.last_lit) {
    _tr_flush_block(s, false);
    if (s.strm.avail_out === 0) return 1;
  }
  return 2;
}

/**
 * For Strategy.RLE, limit the match to a length of 258.
 * @param {DeflateState} s [was: Q]
 * @param {number} flush [was: c]
 * @returns {number}
 */
function deflate_rle(s, flush) { // was: RL7
  let bflush, scan, strend; // was: W, m, K
  const win = s.window; // was: T

  for (;;) {
    if (s.lookahead <= 258) {
      fill_window(s);
      if (s.lookahead <= 258 && flush === 0) return 1;
      if (s.lookahead === 0) break;
    }
    s.match_length = 0;
    if (s.lookahead >= 3 && s.strstart > 0) {
      scan = s.strstart - 1;
      let prev = win[scan]; // was: W
      if (prev === win[++scan] && prev === win[++scan] && prev === win[++scan]) {
        strend = s.strstart + 258;
        while (
          prev === win[++scan] && prev === win[++scan] &&
          prev === win[++scan] && prev === win[++scan] &&
          prev === win[++scan] && prev === win[++scan] &&
          prev === win[++scan] && prev === win[++scan] &&
          scan < strend
        ) { /* empty */ }
        s.match_length = 258 - (strend - scan);
        if (s.match_length > s.lookahead) s.match_length = s.lookahead;
      }
    }
    if (s.match_length >= 3) {
      bflush = _tr_tally(s, 1, s.match_length - 3);
      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      _tr_flush_block(s, false);
      if (s.strm.avail_out === 0) return 1;
    }
  }
  s.insert = 0;
  if (flush === 4) {
    _tr_flush_block(s, true);
    return s.strm.avail_out === 0 ? 3 : 4;
  }
  if (s.last_lit) {
    _tr_flush_block(s, false);
    if (s.strm.avail_out === 0) return 1;
  }
  return 2;
}

/**
 * For Strategy.HUFFMAN_ONLY, do not attempt string matching.
 * @param {DeflateState} s [was: Q]
 * @param {number} flush [was: c]
 * @returns {number}
 */
function deflate_huff(s, flush) { // was: kkO
  let bflush; // was: W
  for (;;) {
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === 0) return 1;
        break;
      }
    }
    s.match_length = 0;
    bflush = _tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      _tr_flush_block(s, false);
      if (s.strm.avail_out === 0) return 1;
    }
  }
  s.insert = 0;
  if (flush === 4) {
    _tr_flush_block(s, true);
    return s.strm.avail_out === 0 ? 3 : 4;
  }
  if (s.last_lit) {
    _tr_flush_block(s, false);
    if (s.strm.avail_out === 0) return 1;
  }
  return 2;
}

// ---------------------------------------------------------------------------
// Configuration table  [was: pu, Q$]
// Source lines: 10370-10376, 65367-65398
// ---------------------------------------------------------------------------

/**
 * Configuration for a compression level.
 * @param {number} good_length [was: Ri]
 * @param {number} max_lazy [was: FL]
 * @param {number} nice_length [was: AP]
 * @param {number} max_chain [was: R3]
 * @param {Function} func [was: func]
 */
function Config(good_length, max_lazy, nice_length, max_chain, func) { // was: pu
  this.good_length = good_length; // was: Ri
  this.max_lazy = max_lazy;       // was: FL
  this.nice_length = nice_length; // was: AP
  this.max_chain = max_chain;     // was: R3
  this.func = func;               // was: func
}

/**
 * Configuration table indexed by compression level (0-9).
 * @type {Config[]}
 */
const configuration_table = [ // was: Q$
  /*      good  lazy  nice  chain */
  new Config(0,    0,    0,    0,    function deflate_stored(s, flush) { // level 0
    let max_block_size = 65535; // was: W
    if (max_block_size > s.pending_buf_size - 5) {
      max_block_size = s.pending_buf_size - 5;
    }
    for (;;) {
      if (s.lookahead <= 1) {
        fill_window(s);
        if (s.lookahead === 0 && flush === 0) return 1;
        if (s.lookahead === 0) break;
      }
      s.strstart += s.lookahead;
      s.lookahead = 0;
      const max_start = s.block_start + max_block_size; // was: m
      if (s.strstart === 0 || s.strstart >= max_start) {
        s.lookahead = s.strstart - max_start;
        s.strstart = max_start;
        _tr_flush_block(s, false);
        if (s.strm.avail_out === 0) return 1;
      }
      if (s.strstart - s.block_start >= s.w_size - 262) {
        _tr_flush_block(s, false);
        if (s.strm.avail_out === 0) return 1;
      }
    }
    s.insert = 0;
    if (flush === 4) {
      _tr_flush_block(s, true);
      return s.strm.avail_out === 0 ? 3 : 4;
    }
    if (s.strstart > s.block_start) _tr_flush_block(s, false);
    return 1;
  }),
  new Config(4,   4,    8,    4,    deflate_fast),  // level 1
  new Config(4,   5,   16,    8,    deflate_fast),  // level 2
  new Config(4,   6,   32,   32,    deflate_fast),  // level 3
  new Config(4,   4,   16,   16,    deflate_slow),  // level 4
  new Config(8,  16,   32,   32,    deflate_slow),  // level 5
  new Config(8,  16,  128,  128,    deflate_slow),  // level 6
  new Config(8,  32,  128,  256,    deflate_slow),  // level 7
  new Config(32, 128,  258, 1024,   deflate_slow),  // level 8
  new Config(32, 258,  258, 4096,   deflate_slow),  // level 9
];

// ---------------------------------------------------------------------------
// ZStream  [was: Wz]
// Source lines: 65399-65409
// ---------------------------------------------------------------------------

/**
 * The zlib stream object, holding input/output state.
 */
function ZStream() { // was: Wz
  this.input = null;
  this.next_in = 0;      // was: GV
  this.avail_in = 0;     // was: XD
  this.total_in = 0;     // was: Jf
  this.output = null;
  this.next_out = 0;     // was: mf
  this.avail_out = 0;    // was: Vz
  this.total_out = 0;    // was: mH
  this.msg = "";
  this.state = null;
  this.data_type = 2;    // was: FT (Z_UNKNOWN)
  this.adler = 0;        // was: MI
}

// ---------------------------------------------------------------------------
// DeflateState  [was: YTd]
// Source lines: 10378-10406
// ---------------------------------------------------------------------------

/**
 * Internal state for the deflate compressor.
 */
function DeflateState() { // was: YTd
  this.strm = null;                   // was: JA - pointer back to ZStream
  this.status = 0;
  this.pending_buf = null;            // was: QY
  this.pending_buf_size = 0;          // was: r0
  this.pending_out = 0;              // was: cq
  this.pending = 0;
  this.wrap = 0;
  this.gzhead = null;                // was: iC
  this.gzindex = 0;                  // was: fd
  this.method = 8;                   // Z_DEFLATED
  this.last_flush = -1;              // was: dD
  this.w_size = 0;                   // was: Pc - window size (LZ77)
  this.w_bits = 0;                   // was: jS - log2(w_size)
  this.w_mask = 0;                   // was: MR - w_size - 1
  this.window = null;
  this.window_size = 0;              // was: iA - 2 * w_size
  this.prev = null;                  // was: N3 - link to older string with same hash
  this.head = null;                  // head of hash chains
  this.ins_h = 0;                    // was: BJ - hash index of string to be inserted
  this.hash_size = 0;                // was: bT - number of hash table entries
  this.hash_bits = 0;                // was: j5 - log2(hash_size)
  this.hash_mask = 0;                // was: V_ - hash_size - 1
  this.hash_shift = 0;               // was: n3
  this.block_start = 0;              // was: zB
  this.match_length = 0;             // was: I8 - length of best match
  this.prev_match = 0;               // was: Mt - previous match
  this.match_available = 0;          // was: Hx - set if previous match exists
  this.strstart = 0;                 // was: jh - start of string to insert
  this.match_start = 0;              // was: o1 - start of matching string
  this.lookahead = 0;                // was: EO - number of valid bytes ahead
  this.prev_length = 0;              // was: H1
  this.max_chain_length = 0;         // was: ih
  this.max_lazy_match = 0;           // was: Kc
  this.level = 0;
  this.strategy = 0;
  this.good_match = 0;               // was: Sq
  this.nice_match = 0;               // was: gO

  // Dynamic literal tree (frequency + code)
  this.dyn_ltree = new Buf16(1146);  // was: y$ - (HEAP_SIZE = 2*L_CODES+1)*2
  this.dyn_dtree = new Buf16(122);   // was: RY - (2*D_CODES+1)*2
  this.bl_tree = new Buf16(78);      // was: b9 - (2*BL_CODES+1)*2
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc = null;                // was: PL - descriptor for literal tree
  this.d_desc = null;                // was: ou - descriptor for distance tree
  this.bl_desc = null;               // was: qX - descriptor for bit-length tree

  this.bl_count = new Buf16(16);     // was: gR
  this.heap = new Buf16(573);        // was: hQ (2*L_CODES+1)
  zero(this.heap);
  this.heap_len = 0;                 // was: Y2
  this.heap_max = 0;                 // was: As

  this.depth = new Buf16(573);       // was: depth
  zero(this.depth);

  this.l_buf = 0;                    // was: bZ - index for literals
  this.lit_bufsize = 0;              // was: bY
  this.last_lit = 0;                 // was: CK - running index in l_buf
  this.d_buf = 0;                    // was: r5 - index for distances
  this.opt_len = 0;                  // was: U5 - bit length of current block
  this.static_len = 0;              // was: eC - bit length of static block
  this.matches = 0;
  this.insert = 0;                   // was: ll
  this.bi_buf = 0;                   // was: g_ - bits not yet written
  this.bi_valid = 0;                 // was: g7 - valid bits in bi_buf
}

// ---------------------------------------------------------------------------
// deflate() - main deflate function  [was: pSm]
// Source lines: 10408-10556
// ---------------------------------------------------------------------------

/**
 * Execute one pass of the deflate algorithm.
 * @param {ZStream} strm [was: Q]
 * @param {number} flush [was: c]
 * @returns {number} Z_OK (0), Z_STREAM_END (1), or error code
 */
function deflate(strm, flush) { // was: pSm
  if (!strm || !strm.state || flush > 5 || flush < 0) {
    return strm ? err(strm, -2) : -2; // Z_STREAM_ERROR
  }

  const s = strm.state; // was: W

  if (!strm.output || (!strm.input && strm.avail_in !== 0) || (s.status === 666 && flush !== 4)) {
    return err(strm, strm.avail_out === 0 ? -5 : -2);
  }

  s.strm = strm;
  const old_flush = s.last_flush; // was: m
  s.last_flush = flush;

  // Write header
  if (s.status === 42) { // INIT_STATE
    if (s.wrap === 2) {
      // gzip header
      strm.adler = 0;
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (s.gzhead) {
        put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (s.gzhead.extra ? 4 : 0) + (s.gzhead.name ? 8 : 0) + (s.gzhead.comment ? 16 : 0));
        put_byte(s, s.gzhead.time & 0xff);
        put_byte(s, (s.gzhead.time >> 8) & 0xff);
        put_byte(s, (s.gzhead.time >> 16) & 0xff);
        put_byte(s, (s.gzhead.time >> 24) & 0xff);
        put_byte(s, s.level === 9 ? 2 : (s.strategy >= 2 || s.level < 2 ? 4 : 0));
        put_byte(s, s.gzhead.os & 0xff);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 0xff);
          put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = 69; // EXTRA_STATE
      } else {
        put_byte(s, 0); put_byte(s, 0); put_byte(s, 0); put_byte(s, 0); put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 : (s.strategy >= 2 || s.level < 2 ? 4 : 0));
        put_byte(s, 3); // OS_CODE
        s.status = 113; // BUSY_STATE
      }
    } else {
      // zlib header
      let header = (8 + ((s.w_bits - 8) << 4)) << 8; // was: K
      header |= ((s.strategy >= 2 || s.level < 2 ? 0 : s.level < 6 ? 1 : s.level === 6 ? 2 : 3) << 6);
      if (s.strstart !== 0) header |= 32; // PRESET_DICT
      s.status = 113; // BUSY_STATE
      putShortMSB(s, header + (31 - header % 31));
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }
      strm.adler = 1; // adler32(0, null, 0)
    }
  }

  // Gzip EXTRA field
  if (s.status === 69) {
    if (s.gzhead.extra) {
      let beg = s.pending; // was: K
      while (s.gzindex < (s.gzhead.extra.length & 0xffff) && (s.pending !== s.pending_buf_size || (s.gzhead.hcrc && s.pending > beg && (strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg)), flush_pending(strm), beg = s.pending, s.pending !== s.pending_buf_size))) {
        put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = 73; // NAME_STATE
      }
    } else {
      s.status = 73;
    }
  }

  // Gzip NAME field
  if (s.status === 73) {
    if (s.gzhead.name) {
      let beg = s.pending;
      let val; // was: T
      do {
        if (s.pending === s.pending_buf_size && (s.gzhead.hcrc && s.pending > beg && (strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg)), flush_pending(strm), beg = s.pending, s.pending === s.pending_buf_size)) {
          val = 1;
          break;
        }
        val = s.gzindex < s.gzhead.name.length ? s.gzhead.name.charCodeAt(s.gzindex++) & 0xff : 0;
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = 91; // COMMENT_STATE
      }
    } else {
      s.status = 91;
    }
  }

  // Gzip COMMENT field
  if (s.status === 91) {
    if (s.gzhead.comment) {
      let beg = s.pending;
      let val;
      do {
        if (s.pending === s.pending_buf_size && (s.gzhead.hcrc && s.pending > beg && (strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg)), flush_pending(strm), beg = s.pending, s.pending === s.pending_buf_size)) {
          val = 1;
          break;
        }
        val = s.gzindex < s.gzhead.comment.length ? s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff : 0;
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) s.status = 103; // HCRC_STATE
    } else {
      s.status = 103;
    }
  }

  // Gzip HCRC
  if (s.status === 103) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) flush_pending(strm);
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        strm.adler = 0;
        s.status = 113;
      }
    } else {
      s.status = 113;
    }
  }

  // Flush pending output
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      s.last_flush = -1;
      return 0; // Z_OK
    }
  } else if (strm.avail_in === 0 && (flush << 1) - (flush > 4 ? 9 : 0) <= (old_flush << 1) - (old_flush > 4 ? 9 : 0) && flush !== 4) {
    return err(strm, -5); // Z_BUF_ERROR
  }

  // Check for finish when status is 666
  if (s.status === 666 && strm.avail_in !== 0) {
    return err(strm, -5);
  }

  // Compress data
  if (strm.avail_in !== 0 || s.lookahead !== 0 || (flush !== 0 && s.status !== 666)) {
    const bstate = s.strategy === 2 ? deflate_huff(s, flush)
      : s.strategy === 3 ? deflate_rle(s, flush)
      : configuration_table[s.level].func(s, flush);

    if (bstate === 3 || bstate === 4) s.status = 666; // FINISH_STATE

    if (bstate === 1 || bstate === 3) {
      if (strm.avail_out === 0) s.last_flush = -1;
      return 0;
    }
    if (bstate === 2) {
      if (flush === 1) { // Z_SYNC_FLUSH
        send_bits(s, 2, 3);
        send_code(s, 256, static_ltree);
        if (s.bi_valid === 16) {
          put_short(s, s.bi_buf);
          s.bi_buf = 0;
          s.bi_valid = 0;
        } else if (s.bi_valid >= 8) {
          s.pending_buf[s.pending++] = s.bi_buf & 0xff;
          s.bi_buf >>= 8;
          s.bi_valid -= 8;
        }
      } else if (flush !== 5) { // not Z_TREES
        send_bits(s, 0, 3);
        copy_block(s, 0, 0);
        if (flush === 3) { // Z_FULL_FLUSH
          zero(s.head);
          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        return 0;
      }
    }
  }

  if (flush !== 4) return 0; // Z_OK
  if (s.wrap <= 0) return 1; // Z_STREAM_END

  // Write trailer
  if (s.wrap === 2) {
    // gzip trailer (CRC32 + ISIZE)
    put_byte(s, strm.adler & 0xff);
    put_byte(s, (strm.adler >> 8) & 0xff);
    put_byte(s, (strm.adler >> 16) & 0xff);
    put_byte(s, (strm.adler >> 24) & 0xff);
    put_byte(s, strm.total_in & 0xff);
    put_byte(s, (strm.total_in >> 8) & 0xff);
    put_byte(s, (strm.total_in >> 16) & 0xff);
    put_byte(s, (strm.total_in >> 24) & 0xff);
  } else {
    // zlib trailer (Adler-32)
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 0xffff);
  }
  flush_pending(strm);
  if (s.wrap > 0) s.wrap = -s.wrap;
  return s.pending !== 0 ? 0 : 1;
}

// ---------------------------------------------------------------------------
// Deflate class (high-level API)  [was: cz]
// Source lines: 10558-10767, 65412-65464
// ---------------------------------------------------------------------------

const _toString = Object.prototype.toString; // was: r_

/**
 * High-level Deflate compressor.
 * @param {object} [options]
 * @param {number} [options.level=-1] - Compression level (0-9, -1 = default)
 * @param {number} [options.method=8] - Compression method (8 = deflate)
 * @param {number} [options.chunkSize=16384]
 * @param {number} [options.windowBits=15] [was: C7]
 * @param {number} [options.memLevel=8] [was: fh]
 * @param {number} [options.strategy=0]
 * @param {string} [options.to=""]
 * @param {boolean} [options.raw] - Raw deflate (no header/trailer)
 * @param {boolean} [options.gzip] [was: FE]
 * @param {object} [options.header] - Custom gzip header
 * @param {string|Uint8Array|ArrayBuffer} [options.dictionary] [was: uP]
 */
function Deflate(options) { // was: cz
  if (!(this instanceof Deflate)) return new Deflate(options);

  options = this.options = assign({
    level: -1,
    method: 8,
    chunkSize: 16384,
    windowBits: 15,   // was: C7
    memLevel: 8,       // was: fh
    strategy: 0,
    to: "",
  }, options || {});

  if (options.raw && options.windowBits > 0) {
    options.windowBits = -options.windowBits;
  } else if (options.gzip && options.windowBits > 0 && options.windowBits < 16) {
    options.windowBits += 16;
  }

  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new ZStream(); // was: JA
  this.strm.avail_out = 0;

  // deflateInit2
  const strm = this.strm;
  let level = options.level;
  const method = options.method;
  let windowBits = options.windowBits;
  const memLevel = options.memLevel;
  const strategy = options.strategy;
  let ret;

  if (strm) {
    let wrap = 1; // was: U

    if (level === -1) level = 6;
    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else if (windowBits > 15) {
      wrap = 2; // gzip
      windowBits -= 16;
    }

    if (memLevel < 1 || memLevel > 9 || method !== 8 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > 4) {
      ret = err(strm, -2);
    } else {
      if (windowBits === 8) windowBits = 9;

      const s = new DeflateState(); // was: I
      strm.state = s;
      s.strm = strm;
      s.wrap = wrap;
      s.gzhead = null;
      s.w_bits = windowBits;
      s.w_size = 1 << s.w_bits;
      s.w_mask = s.w_size - 1;
      s.hash_bits = memLevel + 7;
      s.hash_size = 1 << s.hash_bits;
      s.hash_mask = s.hash_size - 1;
      s.hash_shift = ~~((s.hash_bits + 3 - 1) / 3);
      s.window = new Buf8(s.w_size * 2);
      s.head = new Buf16(s.hash_size);
      s.prev = new Buf16(s.w_size);
      s.lit_bufsize = 1 << (memLevel + 6);
      s.pending_buf_size = s.lit_bufsize * 4;
      s.pending_buf = new Buf8(s.pending_buf_size);
      s.d_buf = 1 * s.lit_bufsize;
      s.l_buf = 3 * s.lit_bufsize;
      s.level = level;
      s.strategy = strategy;
      s.method = method;

      // deflateReset
      if (strm && strm.state) {
        strm.total_in = strm.total_out = 0;
        strm.data_type = 2;
        const ds = strm.state;
        ds.pending = 0;
        ds.pending_out = 0;
        if (ds.wrap < 0) ds.wrap = -ds.wrap;
        ds.status = ds.wrap ? 42 : 113; // INIT_STATE or BUSY_STATE
        strm.adler = ds.wrap === 2 ? 0 : 1;
        ds.last_flush = 0;

        // Build static trees (once)
        if (!static_init_done) {
          const bl_count = Array(16);
          // Build length code -> length index table
          let code, n;
          for (code = 0, n = 0; n < 28; n++) {
            base_length[n] = code;
            for (let i = 0; i < (1 << extra_lbits[n]); i++) {
              _length_code[code++] = n;
            }
          }
          _length_code[code - 1] = n;

          // Build distance code -> distance index table
          for (code = 0, n = 0; n < 16; n++) {
            base_dist[n] = code;
            for (let i = 0; i < (1 << extra_dbits[n]); i++) {
              _dist_code[code++] = n;
            }
          }
          for (let r = code >> 7; n < 30; n++) {
            base_dist[n] = r << 7;
            for (let i = 0; i < (1 << (extra_dbits[n] - 7)); i++) {
              _dist_code[256 + r++] = n;
            }
          }

          // Build fixed literal/length tree (RFC 1951, section 3.2.6)
          for (let i = 0; i <= 15; i++) bl_count[i] = 0;
          for (let i = 0; i <= 143;)   { static_ltree[i * 2 + 1] = 8; i++; bl_count[8]++; }
          for (let i = 144; i <= 255;) { static_ltree[i * 2 + 1] = 9; i++; bl_count[9]++; }
          for (let i = 256; i <= 279;) { static_ltree[i * 2 + 1] = 7; i++; bl_count[7]++; }
          for (let i = 280; i <= 287;) { static_ltree[i * 2 + 1] = 8; i++; bl_count[8]++; }
          gen_codes(static_ltree, 287, bl_count);

          // Build fixed distance tree
          for (let i = 0; i < 30; i++) {
            static_dtree[i * 2 + 1] = 5;
            static_dtree[i * 2] = bi_reverse(i, 5);
          }

          static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, 257, 286, 15);
          static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, 30, 15);
          static_bl_desc = new StaticTreeDesc(null, extra_blbits, 0, 19, 7);

          static_init_done = true;
        }

        ds.l_desc = new TreeDesc(ds.dyn_ltree, static_l_desc);
        ds.d_desc = new TreeDesc(ds.dyn_dtree, static_d_desc);
        ds.bl_desc = new TreeDesc(ds.bl_tree, static_bl_desc);

        ds.bi_buf = 0;
        ds.bi_valid = 0;
        init_block(ds);
        ret = 0;
      } else {
        ret = err(strm, -2);
      }

      if (ret === 0) {
        const cs = strm.state;
        cs.window_size = 2 * cs.w_size;
        zero(cs.head);
        cs.max_lazy_match = configuration_table[cs.level].max_lazy;
        cs.good_match = configuration_table[cs.level].good_length;
        cs.nice_match = configuration_table[cs.level].nice_length;
        cs.max_chain_length = configuration_table[cs.level].max_chain;
        cs.strstart = 0;
        cs.block_start = 0;
        cs.lookahead = 0;
        cs.insert = 0;
        cs.match_length = cs.prev_length = 2;
        cs.match_available = 0;
        cs.ins_h = 0;
      }
      ret = ret;
    }
  } else {
    ret = -2;
  }

  if (ret !== 0) throw Error(messages[ret]);

  // Custom gzip header support
  if (options.header) {
    const _strm = this.strm;
    if (_strm && _strm.state && _strm.state.wrap === 2) {
      _strm.state.gzhead = options.header;
    }
  }

  // Dictionary support [was: uP]
  if (options.dictionary) {
    let dict; // was: X
    if (typeof options.dictionary === "string") {
      dict = string2buf(options.dictionary);
    } else if (_toString.call(options.dictionary) === "[object ArrayBuffer]") {
      dict = new Uint8Array(options.dictionary);
    } else {
      dict = options.dictionary;
    }

    // deflateSetDictionary
    const _strm = this.strm;
    const dictBuf = dict;
    let dictLength = dictBuf.length;

    if (_strm && _strm.state) {
      const ds = _strm.state;
      const w = ds.wrap;
      if (w === 2 || (w === 1 && ds.status !== 42) || ds.lookahead) {
        ret = -2;
      } else {
        if (w === 1) {
          _strm.adler = adler32(_strm.adler, dictBuf, dictLength, 0);
        }
        ds.wrap = 0;
        if (dictLength >= ds.w_size) {
          if (w === 0) {
            zero(ds.head);
            ds.strstart = 0;
            ds.block_start = 0;
            ds.insert = 0;
          }
          const tmpDict = new Buf8(ds.w_size);
          arraySet(tmpDict, dictBuf, dictLength - ds.w_size, ds.w_size, 0);
          dictBuf = tmpDict;
          dictLength = ds.w_size;
        }

        const avail = _strm.avail_in;
        const next = _strm.next_in;
        const input = _strm.input;
        _strm.avail_in = dictLength;
        _strm.next_in = 0;
        _strm.input = dictBuf;
        fill_window(ds);
        while (ds.lookahead >= 3) {
          let str = ds.strstart;
          let n = ds.lookahead - 2;
          do {
            ds.ins_h = ((ds.ins_h << ds.hash_shift) ^ ds.window[str + 3 - 1]) & ds.hash_mask;
            ds.prev[str & ds.w_mask] = ds.head[ds.ins_h];
            ds.head[ds.ins_h] = str;
            str++;
          } while (--n);
          ds.strstart = str;
          ds.lookahead = 2;
          fill_window(ds);
        }
        ds.strstart += ds.lookahead;
        ds.block_start = ds.strstart;
        ds.insert = ds.lookahead;
        ds.lookahead = 0;
        ds.match_length = ds.prev_length = 2;
        ds.match_available = 0;
        _strm.next_in = next;
        _strm.input = input;
        _strm.avail_in = avail;
        ds.wrap = w;
        ret = 0;
      }
    } else {
      ret = -2;
    }

    if (ret !== 0) throw Error(messages[ret]);
    this._dict_set = true; // was: vx0
  }
}

/**
 * Push data through the compressor.
 * @param {string|Uint8Array|ArrayBuffer} data [was: Q]
 * @param {number|boolean} mode - Flush mode or true for Z_FINISH [was: c]
 * @returns {boolean}
 */
Deflate.prototype.push = function (data, mode) { // was: cz.prototype.push
  const strm = this.strm; // was: W (JA)
  const chunkSize = this.options.chunkSize; // was: m

  if (this.ended) return false;

  const _mode = mode === ~~mode ? mode : mode === true ? 4 : 0; // was: K

  if (typeof data === "string") {
    strm.input = string2buf(data);
  } else if (_toString.call(data) === "[object ArrayBuffer]") {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  let status; // was: Q - deflate return value
  do {
    if (strm.avail_out === 0) {
      strm.output = new Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = deflate(strm, _mode);
    if (status !== 1 && status !== 0) {
      this._onEnd(status);
      this.ended = true;
      return false;
    }
    if (strm.avail_out === 0 || (strm.avail_in === 0 && (_mode === 4 || _mode === 2))) {
      if (this.options.to === "string") {
        let buf = shrinkBuf(strm.output, strm.next_out);
        const len = buf.length;
        let result;
        if (len < 65537 && (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray)) {
          result = String.fromCharCode.apply(null, shrinkBuf(buf, len));
        } else {
          result = "";
          for (let i = 0; i < len; i++) {
            result += String.fromCharCode(buf[i]);
          }
        }
        this.chunks.push(result);
      } else {
        this.chunks.push(shrinkBuf(strm.output, strm.next_out));
      }
    }
  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== 1);

  if (_mode === 4) {
    // deflateEnd
    let endRet;
    const _strm = this.strm;
    if (_strm && _strm.state) {
      const st = _strm.state.status;
      if (st !== 42 && st !== 69 && st !== 73 && st !== 91 && st !== 103 && st !== 113 && st !== 666) {
        endRet = err(_strm, -2);
      } else {
        _strm.state = null;
        endRet = st === 113 ? err(_strm, -3) : 0;
      }
    } else {
      endRet = -2;
    }
    this._onEnd(endRet);
    this.ended = true;
    return endRet === 0;
  }

  if (_mode === 2) {
    this._onEnd(0);
    strm.avail_out = 0;
  }

  return true;
};

/**
 * Called when deflation ends; collects output.
 * @param {number} status [was: Q]
 */
Deflate.prototype._onEnd = function (status) { // was: cz.prototype.KA
  if (status === 0) {
    this.result = this.options.to === "string"
      ? this.chunks.join("")
      : flattenChunks(this.chunks);
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};

// ---------------------------------------------------------------------------
// gzip convenience function  [was: Ui]
// Source line: 10759
// ---------------------------------------------------------------------------

/**
 * Compress data with gzip wrapper in one call.
 * @param {string|Uint8Array|ArrayBuffer} input [was: Q]
 * @returns {Uint8Array}
 */
function gzip(input) { // was: Ui
  const opts = {};
  opts.gzip = true; // was: FE
  const d = new Deflate(opts);
  d.push(input, true);
  if (d.err) throw d.msg || messages[d.err];
  return d.result;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  // Checksums
  adler32,
  crc32,

  // High-level API
  Deflate,
  gzip,

  // Low-level API
  deflate,
  ZStream,
  DeflateState,

  // Utilities
  assign,
  shrinkBuf,
  arraySet,
  flattenChunks,
  string2buf,
  zeroArray,
  zero,
  Buf8,
  Buf16,
  Buf32,

  // Tree structures
  StaticTreeDesc,
  TreeDesc,

  // Constants / tables
  messages,
  extra_lbits,
  extra_dbits,
  extra_blbits,
  bl_order,
  static_ltree,
  static_dtree,
  _dist_code,
  _length_code,
  base_length,
  base_dist,
  configuration_table,
};
