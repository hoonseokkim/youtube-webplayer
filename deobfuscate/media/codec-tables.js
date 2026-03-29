// Source: base.js lines 75600–77000
// Audio codec shorthand mappings (ac3, ec3, etc.), codec feature set
// definitions (Tz0, bam sets), format-to-code mappings (Ak object),
// MediaCapabilities feature descriptors, quality ordinal enums, and
// the SourceBuffer / MediaSource wrapper classes.

// ── MediaCapabilities feature descriptors ───────────────────────────────────

/**
 * Enumeration of media-capability feature keys used to probe decoder
 * support via `navigator.mediaCapabilities.decodingInfo()`.
 * Each entry carries a human-readable name, whether it applies to video,
 * a known-good "valid" value, and a known-bad "QO" sentinel for negative
 * testing.
 * [was: $i]
 */
import { writeBytesField } from '../proto/varint-decoder.js'; // was: sK
import { getSmoothedRtt } from './quality-manager.js'; // was: X0
import { getUserCacheName } from '../modules/offline/offline-helpers.js'; // was: hX
import { getQualityLabel } from './codec-helpers.js'; // was: sU
import { handleBackgroundSuspend } from './quality-constraints.js'; // was: w3
import { getContainerType } from './codec-helpers.js'; // was: dh
import { computeAutoHideVisible } from '../player/caption-manager.js'; // was: mI
import { isMultiChannelAudio } from './codec-helpers.js'; // was: I8n
import { toString } from '../core/string-utils.js';
import { isHdr } from '../player/time-tracking.js';
export const MediaCapabilityFeature = { // was: $i
  WIDTH: {
    name: "width",
    video: true, // was: !0
    valid: 640,
    invalid: 99999, // was: QO
  },
  HEIGHT: {
    name: "height",
    video: true,
    valid: 360,
    invalid: 99999,
  },
  FRAMERATE: {
    name: "framerate",
    video: true,
    valid: 30,
    invalid: 9999,
  },
  BITRATE: {
    name: "bitrate",
    video: true,
    valid: 300_000, // was: 3E5
    invalid: 2_000_000_000, // was: 2E9
  },
  EOTF: {
    name: "eotf",
    video: true,
    valid: "bt709",
    invalid: "catavision",
  },
  CHANNELS: {
    name: "channels",
    video: false, // was: !1
    valid: 2,
    invalid: 99,
  },
  CRYPTOBLOCKFORMAT: {
    name: "cryptoblockformat",
    video: true,
    valid: "subsample",
    invalid: "invalidformat",
  },
  DECODETOTEXTURE: {
    name: "decode-to-texture",
    video: true,
    valid: "false",
    invalid: "nope",
  },
  AV1_CODECS: {
    name: "codecs",
    video: true,
    valid: "av01.0.05M.08",
    invalid: "av99.0.05M.08",
  },
  EXPERIMENTAL: {
    name: "experimental",
    video: true,
    valid: "allowed",
    invalid: "invalid",
  },
  TUNNELMODE: {
    name: "tunnelmode",
    video: true,
    valid: "true",
    invalid: "false",
  },
};

// ── Audio-track display info ────────────────────────────────────────────────

/**
 * Describes an audio-track entry with display metadata and VSS tagging.
 * [was: B$w]
 */
export class AudioTrackDisplayInfo { // was: B$w
  /**
   * @param {string} displayName   - human-readable label
   * @param {string} vssId         - VSS tracking identifier
   * @param {string} languageCode  - BCP-47 language code
   * @param {string} [kind=""]     - role kind (e.g. "commentary")
   * @param {string} [xtags=""]    - extra tags
   * @param {string} [id=""]       - unique id
   */
  constructor(displayName, vssId, languageCode, kind = "", xtags = "", id = "") {
    this.displayName = displayName;
    this.vssId = vssId;
    this.languageCode = languageCode;
    this.kind = kind;
    this.xtags = xtags;
    this.id = id;
  }
}

// ── Codec shorthand arrays ──────────────────────────────────────────────────
// Each pair represents [standard, legacy/alternate] shorthand codes.
// The same array reference is shared for both lookup directions.

const CODEC_H264 = ["h", "H"]; // was: Rxn
const CODEC_VP9 = ["9", "("]; // was: k6O
const CODEC_VP9_HDR = ["9h", "(h"]; // was: Yqn
const CODEC_VP8 = ["8", "*"]; // was: p$d
const CODEC_AAC = ["a", "A"]; // was: QVK
const CODEC_OPUS = ["o", "O"]; // was: ct3
const CODEC_AC3 = ["m", "M"]; // was: W$n
const CODEC_MULTI_AC3 = ["mac3", "MAC3"]; // was: mxn
const CODEC_MULTI_EAC3 = ["meac3", "MEAC3"]; // was: K$n

/**
 * Bidirectional codec-equivalence map. Given any shorthand code, returns
 * the array of all equivalent codes for that codec family.
 * Keys: "h","H","9","(","9h","(h","8","*","a","A","o","O","m","M",
 *       "mac3","MAC3","meac3","MEAC3"
 * [was: zE7]
 */
export const codecEquivalenceMap = { // was: zE7
  h: CODEC_H264,
  H: CODEC_H264,
  "9": CODEC_VP9,
  "(": CODEC_VP9,
  "9h": CODEC_VP9_HDR,
  "(h": CODEC_VP9_HDR,
  "8": CODEC_VP8,
  "*": CODEC_VP8,
  a: CODEC_AAC,
  A: CODEC_AAC,
  o: CODEC_OPUS,
  O: CODEC_OPUS,
  m: CODEC_AC3,
  M: CODEC_AC3,
  mac3: CODEC_MULTI_AC3,
  MAC3: CODEC_MULTI_AC3,
  meac3: CODEC_MULTI_EAC3,
  MEAC3: CODEC_MULTI_EAC3,
};

/**
 * Set of codec shorthand codes considered "audio-only" codecs, including
 * Opus, AAC, AC-3, multi-channel AC-3 / E-AC-3, and spatial audio.
 * [was: Tz0]
 */
export const audioOnlyCodecSet = new Set([ // was: Tz0
  "o",
  "O",
  "a",
  "ah",
  "A",
  "m",
  "M",
  "mac3",
  "MAC3",
  "meac3",
  "MEAC3",
  "so",
  "sa",
]);

/**
 * Subset of audio codecs that are multi-channel (AC-3 family).
 * [was: bam]
 */
export const multiChannelAudioCodecSet = new Set([ // was: bam
  "m",
  "M",
  "mac3",
  "MAC3",
  "meac3",
  "MEAC3",
]);

// ── Itag-to-codec-shorthand mapping ─────────────────────────────────────────

/**
 * Maps YouTube itag numbers (as string keys) to codec shorthand codes.
 *
 * Shorthand legend:
 *   "f"    = full progressive (muxed)
 *   "h"    = H.264 (video, standard container)
 *   "H"    = H.264 (video, alternate container)
 *   "9"    = VP9 (video, standard)
 *   "("    = VP9 (video, alternate / Cobalt)
 *   "9h"   = VP9 HDR (standard)
 *   "(h"   = VP9 HDR (alternate)
 *   "8"/"*"= VP8
 *   "1"    = AV1
 *   "1h"   = AV1 HDR
 *   "1e"   = AV1 (experimental / extended)
 *   "2"    = AV2
 *   "a"    = AAC audio (standard)
 *   "A"    = AAC audio (alternate)
 *   "o"    = Opus audio
 *   "O"    = Opus audio (alternate)
 *   "m"    = AC-3 audio
 *   "M"    = AC-3 audio (alternate)
 *   "mac3" = multi-channel AC-3
 *   "MAC3" = multi-channel AC-3 (alternate)
 *   "meac3"= multi-channel E-AC-3
 *   "MEAC3"= multi-channel E-AC-3 (alternate)
 *   "sa"   = spatial AAC
 *   "so"   = spatial Opus
 *   "i"    = iamf audio
 *   "I"    = iamf audio (alternate)
 *   "3"    = H.265/HEVC
 *   "w"    = WebM (legacy container-only tag)
 *   "6"    = itag 406 special
 *
 * [was: Ak]
 */
export const itagToCodecMap = { // was: Ak
  // Progressive (muxed)
  "0": "f",

  // H.264 video (standard container)
  "160": "h",
  "133": "h",
  "134": "h",
  "135": "h",
  "136": "h",
  "137": "h",
  "264": "h",
  "266": "h",
  "138": "h",
  "298": "h",
  "299": "h",
  "304": "h",
  "305": "h",
  "214": "h",
  "216": "h",
  "374": "h",
  "375": "h",

  // AAC audio (standard)
  "140": "a",
  "141": "a",

  // Spatial AAC
  "327": "sa",

  // AC-3 audio
  "258": "m",

  // Multi-channel AC-3
  "380": "mac3",

  // Multi-channel E-AC-3
  "328": "meac3",

  // H.264 video (alternate container)
  "161": "H",
  "142": "H",
  "143": "H",
  "144": "H",
  "222": "H",
  "223": "H",
  "145": "H",
  "224": "H",
  "225": "H",
  "146": "H",
  "226": "H",
  "227": "H",
  "147": "H",
  "384": "H",
  "376": "H",
  "385": "H",
  "377": "H",

  // AAC audio (alternate)
  "149": "A",

  // AC-3 audio (alternate)
  "261": "M",

  // Multi-channel AC-3 (alternate)
  "381": "MAC3",

  // Multi-channel E-AC-3 (alternate)
  "329": "MEAC3",

  // VP9 video (standard)
  "598": "9",
  "278": "9",
  "242": "9",
  "243": "9",
  "244": "9",
  "775": "9",
  "776": "9",
  "777": "9",
  "778": "9",
  "779": "9",
  "780": "9",
  "781": "9",
  "782": "9",
  "783": "9",
  "247": "9",
  "248": "9",
  "353": "9",
  "355": "9",
  "356": "9",
  "271": "9",
  "577": "9",
  "313": "9",
  "579": "9",
  "272": "9",
  "302": "9",
  "303": "9",
  "407": "9",
  "408": "9",
  "308": "9",
  "315": "9",

  // VP9 HDR (standard)
  "330": "9h",
  "331": "9h",
  "332": "9h",
  "333": "9h",
  "334": "9h",
  "335": "9h",
  "336": "9h",
  "337": "9h",

  // Spatial Opus
  "338": "so",

  // Opus audio
  "600": "o",
  "250": "o",
  "251": "o",
  "774": "o",

  // VP8 video (alternate encoding)
  "194": "*",
  "195": "*",
  "220": "*",
  "221": "*",
  "196": "*",
  "197": "*",

  // VP9 video (alternate / Cobalt container)
  "279": "(",
  "280": "(",
  "317": "(",
  "318": "(",
  "273": "(",
  "274": "(",
  "357": "(",
  "358": "(",
  "275": "(",
  "359": "(",
  "360": "(",
  "276": "(",
  "583": "(",
  "584": "(",
  "314": "(",
  "585": "(",
  "561": "(",
  "277": "(",

  // VP9 HDR (alternate)
  "361": "(h",
  "362": "(h",
  "363": "(h",
  "364": "(h",
  "365": "(h",
  "366": "(h",
  "591": "(h",
  "592": "(h",
  "367": "(h",
  "586": "(h",
  "587": "(h",
  "368": "(h",
  "588": "(h",
  "562": "(h",

  // VP9 video (alternate – extended range)
  "409": "(",
  "410": "(",
  "411": "(",
  "412": "(",
  "557": "(",
  "558": "(",

  // AV1 video
  "394": "1",
  "395": "1",
  "396": "1",
  "397": "1",
  "398": "1",
  "399": "1",
  "720": "1",
  "721": "1",
  "400": "1",
  "401": "1",
  "571": "1",
  "402": "1",

  // AV1 HDR
  "694": "1h",
  "695": "1h",
  "696": "1h",
  "697": "1h",
  "698": "1h",
  "699": "1h",
  "700": "1h",
  "701": "1h",
  "702": "1h",
  "703": "1h",

  // H.265 / HEVC
  "386": "3",

  // WebM container (legacy)
  "387": "w",

  // Special itag 406
  "406": "6",

  // AV1 additional
  "787": "1",
  "788": "1",

  // AV1 experimental / extended
  "548": "1e",
  "549": "1e",
  "550": "1e",
  "551": "1e",
  "809": "1e",
  "810": "1e",
  "552": "1e",
  "811": "1e",
  "812": "1e",
  "553": "1e",
  "813": "1e",
  "814": "1e",
  "554": "1e",
  "815": "1e",
  "816": "1e",
  "555": "1e",
  "817": "1e",
  "818": "1e",
  "572": "1e",
  "556": "1e",

  // VP9 alternate extended (645–673)
  "645": "(", "646": "(", "647": "(", "648": "(", "649": "(",
  "650": "(", "651": "(", "652": "(", "653": "(", "654": "(",
  "655": "(", "656": "(", "657": "(", "658": "(", "659": "(",
  "660": "(", "661": "(", "662": "(", "663": "(", "664": "(",
  "665": "(", "666": "(", "667": "(", "668": "(", "669": "(",
  "670": "(", "671": "(", "672": "(", "673": "(",

  // VP9 HDR alternate extended (674–687)
  "674": "(h", "675": "(h", "676": "(h", "677": "(h", "678": "(h",
  "679": "(h", "680": "(h", "681": "(h", "682": "(h", "683": "(h",
  "684": "(h", "685": "(h", "686": "(h", "687": "(h",

  // AAC audio alternate (688–690)
  "688": "A",
  "689": "A",
  "690": "A",

  // Multi-channel E-AC-3 alternate
  "691": "MEAC3",

  // IAMF audio
  "773": "i",

  // IAMF audio (alternate)
  "806": "I",
  "805": "I",

  // VP9 standard – newer itags (829–840, 892–893)
  "829": "9", "830": "9", "831": "9", "832": "9", "833": "9",
  "834": "9", "835": "9", "836": "9", "892": "9", "893": "9",
  "837": "9", "838": "9", "839": "9", "840": "9",

  // VP9 alternate – newer itags (841–852, 894–895)
  "841": "(", "842": "(", "843": "(", "844": "(", "845": "(",
  "846": "(", "847": "(", "848": "(", "894": "(", "895": "(",
  "849": "(", "850": "(", "851": "(", "852": "(",

  // VP9 standard – newer itags (865–876, 896–897)
  "865": "9", "866": "9", "867": "9", "868": "9", "869": "9",
  "870": "9", "871": "9", "872": "9", "896": "9", "897": "9",
  "873": "9", "874": "9", "875": "9", "876": "9",

  // VP9 alternate – newer itags (877–888, 898–899)
  "877": "(", "878": "(", "879": "(", "880": "(", "881": "(",
  "882": "(", "883": "(", "884": "(", "898": "(", "899": "(",
  "885": "(", "886": "(", "887": "(", "888": "(",

  // AV2 video (900–908)
  "900": "2", "901": "2", "902": "2", "903": "2", "904": "2",
  "905": "2", "906": "2", "907": "2", "908": "2",
};

// ── AudioTrack label class ──────────────────────────────────────────────────

/**
 * Represents a selectable audio track exposed through the external API.
 * The prototype methods are explicitly re-exported for external access.
 * [was: g.Br]
 */
export class AudioTrack { // was: g.Br
  /**
   * @param {string} name        - human-readable name
   * @param {string} id          - unique identifier
   * @param {boolean} isDefault  - true if default track
   * @param {boolean} [isAutoDubbed=false] - true if auto-dubbed
   */
  constructor(name, id, isDefault, isAutoDubbed = false) {
    this.name = name;
    this.id = id;
    this.isDefault = isDefault;
    this.isAutoDubbed = isAutoDubbed;
  }

  getName() {
    return this.name;
  }

  getId() {
    return this.id;
  }

  getIsDefault() {
    return this.isDefault;
  }

  getIsAutoDubbed() {
    return this.isAutoDubbed;
  }

  toString() {
    return this.name;
  }
}

// ── Stereo layout enum ──────────────────────────────────────────────────────

/**
 * [was: Ar7]
 */
export const StereoLayout = { // was: Ar7
  STEREO_LAYOUT_UNKNOWN: 0,
  STEREO_LAYOUT_LEFT_RIGHT: 1,
  STEREO_LAYOUT_TOP_BOTTOM: 2,
};

// ── Quality ordinal enum ────────────────────────────────────────────────────

/**
 * Numeric quality ordinal values and their reverse string labels.
 * [was: oIw]
 */
export const QualityOrdinal = { // was: oIw
  // Forward: label → ordinal
  hyJ: 0,
  je0: 124,
  AJJ: 144,
  KFe: 220,
  QeM: 240,
  xMG: 340,
  C00: 360,
  yJF: 480,
  UMH: 588,
  P0a: 608,
  qHF: 720,
  rJ2: 740,
  iae: 1080,
  zyF: 1100,
  Oaa: 1440,
  MGF: 2160,
  uII: 9999,

  // Reverse: ordinal → label string
  0: "QUALITY_ORDINAL_UNKNOWN",
  124: "QUALITY_ORDINAL_144P_SAVER",
  144: "QUALITY_ORDINAL_144P",
  220: "QUALITY_ORDINAL_240P_SAVER",
  240: "QUALITY_ORDINAL_240P",
  340: "QUALITY_ORDINAL_360P_SAVER",
  360: "QUALITY_ORDINAL_360P",
  480: "QUALITY_ORDINAL_480P",
  588: "QUALITY_ORDINAL_608P_SAVER",
  608: "QUALITY_ORDINAL_608P",
  720: "QUALITY_ORDINAL_720P",
  740: "QUALITY_ORDINAL_720P_ENHANCED",
  1080: "QUALITY_ORDINAL_1080P",
  1100: "QUALITY_ORDINAL_1080P_ENHANCED",
  1440: "QUALITY_ORDINAL_1440P",
  2160: "QUALITY_ORDINAL_2160P",
  9999: "QUALITY_ORDINAL_HIGHRES",
};

/**
 * Named quality labels used in the external API.
 * [was: g.o_K]
 */
export const QualityLabel = { // was: g.o_K
  yk: "auto",
  qCe: "tiny",
  writeBytesField: "light",
  iOF: "small",
  eJ: "medium",
  JM: "large",
  getSmoothedRtt: "hd720",
  qo: "hd1080",
  rF: "hd1440",
  getUserCacheName: "hd2160",
  DP: "hd2880",
  lr: "highres",
  UNKNOWN: "unknown",
};

/**
 * Label-to-ordinal mapping (used for user-facing quality selection).
 * [was: g.EU]
 */
export const qualityLabelToOrdinal = { // was: g.EU
  auto: 0,
  tiny: 144,
  light: 144,
  small: 240,
  medium: 360,
  large: 480,
  hd720: 720,
  hd1080: 1080,
  hd1440: 1440,
  hd2160: 2160,
  hd2880: 2880,
  highres: 4320,
};

/**
 * Ordinal-to-label reverse mapping.
 * [was: ZV]
 */
export const ordinalToQualityLabel = { // was: ZV
  0: "auto",
  144: "tiny",
  240: "small",
  360: "medium",
  480: "large",
  720: "hd720",
  1080: "hd1080",
  1440: "hd1440",
  2160: "hd2160",
  2880: "hd2880",
  4320: "highres",
};

/**
 * Ordinal enum label-to-number mapping (proto-style).
 * [was: VEx]
 */
export const qualityOrdinalEnum = { // was: VEx
  QUALITY_ORDINAL_UNKNOWN: 0,
  QUALITY_ORDINAL_144P_SAVER: 124,
  QUALITY_ORDINAL_144P: 144,
  QUALITY_ORDINAL_240P_SAVER: 220,
  QUALITY_ORDINAL_240P: 240,
  QUALITY_ORDINAL_360P_SAVER: 340,
  QUALITY_ORDINAL_360P: 360,
  QUALITY_ORDINAL_480P: 480,
  QUALITY_ORDINAL_608P_SAVER: 588,
  QUALITY_ORDINAL_608P: 608,
  QUALITY_ORDINAL_720P: 720,
  QUALITY_ORDINAL_720P_ENHANCED: 740,
  QUALITY_ORDINAL_1080P: 1080,
  QUALITY_ORDINAL_1080P_ENHANCED: 1100,
  QUALITY_ORDINAL_1440P: 1440,
  QUALITY_ORDINAL_2160P: 2160,
  QUALITY_ORDINAL_HIGHRES: 9999,
};

/**
 * Quality labels in descending order of resolution.
 * [was: ZF]
 */
export const QUALITY_LABELS_DESCENDING = // was: ZF
  "highres hd2880 hd2160 hd1440 hd1080 hd720 large medium small tiny".split(" ");

// ── VideoInfo class ─────────────────────────────────────────────────────────

/**
 * Describes the video properties of a format (resolution, fps, HDR, etc.).
 * [was: gh]
 */
export class VideoInfo { // was: gh
  /**
   * @param {number} width
   * @param {number} height
   * @param {number} fps
   * @param {string} [projectionType]
   * @param {number} [stereoLayout]
   * @param {string} [quality]
   * @param {string} [qualityLabel]
   * @param {*} [U]                   - internal field [was: this.A]
   * @param {string} [eotf]           - electro-optical transfer function
   * @param {string} [primaries]      - color primaries
   * @param {boolean} [decodeable]    - whether guaranteed decodeable
   */
  constructor(width, height, fps, projectionType, stereoLayout, quality, qualityLabel, U, eotf, primaries, decodeable) {
    this.width = width;
    this.height = height;
    this.A = U; // was: this.A = U
    this.quality = quality || getQualityLabel(width, height); // was: sU (auto-derive quality label)
    this.qualityOrdinal = qualityLabelToOrdinal[this.quality];
    this.fps = fps || 0;

    this.stereoLayout =
      !stereoLayout || (projectionType != null && projectionType !== "UNKNOWN" && projectionType !== "RECTANGULAR")
        ? 0
        : stereoLayout;

    this.projectionType = projectionType
      ? projectionType === "EQUIRECTANGULAR" && stereoLayout === 2
        ? "EQUIRECTANGULAR_THREED_TOP_BOTTOM"
        : projectionType
      : "UNKNOWN";

    // Build the qualityLabel (e.g. "1080p60")
    let label = qualityLabel; // was: Q reused
    if (!label) {
      const ordinal = qualityLabelToOrdinal[this.quality];
      if (ordinal === 0) {
        label = "Auto";
      } else {
        const proj = this.projectionType;
        const f = this.fps;
        label =
          ordinal.toString() +
          (proj === "EQUIRECTANGULAR" ||
          proj === "EQUIRECTANGULAR_THREED_TOP_BOTTOM" ||
          proj === "MESH"
            ? "s"
            : "p") +
          (f > 55 ? "60" : f > 49 ? "50" : f > 39 ? "48" : "");
      }
    }
    this.qualityLabel = label;

    this.W = eotf || ""; // was: this.W = I || ""
    this.primaries = primaries || "";
    this.j = decodeable ?? true; // was: this.j = A ?? !0
  }

  /**
   * Returns true if the framerate is considered "high" (> 32 fps).
   * [was: O]
   */
  isHighFrameRate() { // was: O
    return this.fps > 32;
  }

  /**
   * Returns true if this is an HDR format (PQ or HLG).
   */
  isHdr() {
    return this.W === "smpte2084" || this.W === "arib-std-b67";
  }
}

// ── FormatInfo class ────────────────────────────────────────────────────────

/**
 * Complete format descriptor combining an itag, mime type, and optional
 * video/audio sub-descriptors. Provides codec-family helper predicates.
 * [was: OU]
 */
export class FormatInfo { // was: OU
  /**
   * @param {string} id        - format id, possibly "itag;xtags"
   * @param {string} mimeType  - full MIME type string
   * @param {Object} [props={}] - additional properties (w3, video, audio, etc.)
   */
  constructor(id, mimeType, props = {}) {
    this.id = id;
    this.mimeType = mimeType;
    if (props.handleBackgroundSuspend <= 0) props.handleBackgroundSuspend = 16_000;
    Object.assign(this, props);

    [this.itag, this.O] = this.id.split(";");
    this.containerType = getContainerType(mimeType); // was: dh (derive container type)
    this.computeAutoHideVisible = itagToCodecMap[this.itag] || "";
  }

  /** Has video sub-descriptor. [was: J] */
  hasVideo() { // was: J
    return this.video;
  }

  /** Has audio sub-descriptor. [was: L] */
  hasAudio() { // was: L
    return this.audio;
  }

  /** Container is WebM. [was: wH] */
  isWebM() { // was: wH
    return this.containerType === 2;
  }

  /** Codec is VP9 (any variant). [was: j] */
  isVP9() { // was: j
    return (
      this.computeAutoHideVisible === "9" ||
      this.computeAutoHideVisible === "(" ||
      this.computeAutoHideVisible === "9h" ||
      this.computeAutoHideVisible === "(h"
    );
  }

  /** Codec is AV1 (any variant). [was: W] */
  isAV1() { // was: W
    return this.computeAutoHideVisible === "1" || this.computeAutoHideVisible === "1h" || (aR && this.computeAutoHideVisible === "1e");
  }

  /** Codec is a surround/AC-3/E-AC-3/IAMF audio format. [was: D] */
  isSurroundAudio() { // was: D
    return (
      this.computeAutoHideVisible === "mac3" ||
      this.computeAutoHideVisible === "meac3" ||
      this.computeAutoHideVisible === "m" ||
      this.computeAutoHideVisible === "i" ||
      isMultiChannelAudio(this) // was: I8n (external additional check)
    );
  }

  /** Format is DRM-encrypted. */
  isEncrypted() {
    return !!this.contentProtection;
  }

  /** Has audio sub-descriptor (alias). [was: Dg] */
  isAudioFormat() { // was: Dg
    return !!this.audio;
  }

  /** Has video sub-descriptor (alias). [was: MK] */
  isVideoFormat() { // was: MK
    return !!this.video;
  }

  /** Is an HLS manifest format. [was: A] */
  isHls() { // was: A
    return this.mimeType === "application/x-mpegURL";
  }
}

/**
 * Module-level flag: whether AV1-experimental ("1e") itags are enabled.
 * [was: aR]
 */
let av1ExperimentalEnabled = false; // was: aR = !1

// ── PlayerState class ───────────────────────────────────────────────────────

/**
 * Bitmask-based player state descriptor.
 * [was: g.In]
 *
 * Bit flags:
 *   1    = buffering
 *   2    = ended
 *   4    = paused
 *   8    = playing
 *   16   = seeking (used elsewhere)
 *   32   = ad
 *   64   = cued/unstarted
 *   128  = error
 *   512  = suspended
 *   1024 = will-stop
 */
export class PlayerState { // was: g.In
  /**
   * @param {number} [state=64]
   * @param {*} [seekSource]
   * @param {*} [stoppageReason]
   * @param {*} [Dr]
   */
  constructor(state, Dr = null, seekSource = null, stoppageReason = null) {
    this.Dr = Dr;
    this.seekSource = seekSource;
    this.stoppageReason = stoppageReason;
    this.state = state || 64;
  }

  /** Tests whether a given bit flag is set. [was: W] */
  hasFlag(flag) { // was: W
    return !!(this.state & flag);
  }

  isPaused() {
    return this.hasFlag(4);
  }

  isPlaying() {
    return this.hasFlag(8) && !this.hasFlag(512) && !this.hasFlag(64) && !this.hasFlag(2);
  }

  isOrWillBePlaying() {
    return this.hasFlag(8) && !this.hasFlag(2) && !this.hasFlag(1024);
  }

  /** Exactly the "playing" bit and nothing else. [was: O] */
  isPurelyPlaying() { // was: O
    return this.state === 8;
  }

  isCued() {
    return this.hasFlag(64) && !this.hasFlag(8) && !this.hasFlag(4);
  }

  isBuffering() {
    return this.hasFlag(1) && !this.hasFlag(2);
  }

  isError() {
    return this.hasFlag(128);
  }

  isSuspended() {
    return this.hasFlag(512);
  }

  /** Unstarted (cued + paused). [was: aN] */
  isUnstarted() { // was: aN
    return this.hasFlag(64) && this.hasFlag(4);
  }

  toString() {
    return `PSt.${this.state.toString(16)}`;
  }
}

/**
 * Player-state CSS mode class names.
 * [was: wb]
 */
export const PlayerStateMode = { // was: wb
  BUFFERING: "buffering-mode",
  CUED: "cued-mode",
  ENDED: "ended-mode",
  PAUSED: "paused-mode",
  PLAYING: "playing-mode",
  SEEKING: "seeking-mode",
  UNSTARTED: "unstarted-mode",
};
