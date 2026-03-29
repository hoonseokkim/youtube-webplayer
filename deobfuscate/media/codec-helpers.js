/**
 * Codec Helpers -- Video element pool, codec support checking, format utilities
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~22002–23000
 *
 * Handles:
 *  - Video element pool for codec probing (IR)
 *  - canPlayType / MediaSource.isTypeSupported wrappers (XL, eT)
 *  - Opus codec checking with Chrome-version gating
 *  - ManagedMediaSource fallback detection
 *  - Format availability check (MXm)
 *  - Webkit presentation-mode support (Vc)
 *  - Mute toggle capability detection (BT)
 *  - Container-type / mimeType parsing (dh, LM, wh, bo)
 *  - Quality-label to resolution mapping (sU)
 *  - Format descriptor construction (fM) and codec-key helpers (vT, UVW, I8n, XYK)
 *  - MediaCapabilities decodingInfo probing (ecn, A9m)
 *  - TimeRanges utilities (lo, VUm, uo, hm, zb, B2n, CM, Ml, Jm, RR, ki)
 *  - SourceBuffer.changeType detection (Yi)
 *  - MediaSource / ManagedMediaSource / WebKit MSE detection (xVy, pM)
 *  - MediaSource open-state check and ready callback (Qv, qox)
 */

// ---------------------------------------------------------------------------
// Video Element Pool  [was: IR]  (line ~22002)
// ---------------------------------------------------------------------------


import { isCobalt } from '../core/composition-helpers.js'; // was: g.i0
import { qualityLabelToOrdinal } from './codec-tables.js'; // was: g.EU
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { isKnownBrowserVersion } from '../core/bitstream-helpers.js'; // was: G5
import { isPS4 } from '../core/composition-helpers.js'; // was: O3_
import { QUALITY_LABELS_DESCENDING } from './codec-tables.js'; // was: ZF
import { paintProgress } from '../ui/progress-bar-impl.js'; // was: ec
import { VideoInfo } from './codec-tables.js'; // was: gh
import { FormatInfo } from './codec-tables.js'; // was: OU
import { computeAutoHideVisible } from '../player/caption-manager.js'; // was: mI
import { handleBackgroundSuspend } from './quality-constraints.js'; // was: w3
import { transitionPanel } from '../player/video-loader.js'; // was: mc
import { getObjectByPath } from '../core/type-helpers.js';
import { createElement } from '../core/dom-utils.js';
import { isChrome } from '../core/browser-detection.js'; // was: g.Am
// TODO: resolve g.mN

/**
 * Returns a reusable `<video>` element for codec-support probing.
 * The element is cached on the global `yt.player.utils.videoElement_`
 * property; a new one is created on first call.
 *
 * [was: IR]
 *
 * @returns {HTMLVideoElement}
 */
export function getProbeVideoElement() { // was: IR
  let element = getObjectByPath('yt.player.utils.videoElement_'); // was: Q
  if (!element) {
    element = createElement('VIDEO');
    setGlobal('yt.player.utils.videoElement_', element);
  }
  return element;
}

// ---------------------------------------------------------------------------
// canPlayType Wrapper  [was: XL]  (line ~22009)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the pooled video element reports support for the given
 * MIME type via `canPlayType`.
 *
 * [was: XL]
 *
 * @param {string} mimeType - e.g. 'video/mp4; codecs="avc1.42001E"'
 * @returns {boolean}
 */
export function canPlayType(mimeType) { // was: XL
  const createDatabaseDefinition = getProbeVideoElement(); // was: c
  return !!(createDatabaseDefinition && createDatabaseDefinition.canPlayType && createDatabaseDefinition.canPlayType(mimeType));
}

// ---------------------------------------------------------------------------
// MediaSource.isTypeSupported Wrapper  [was: eT]  (line ~22014)
// ---------------------------------------------------------------------------

/**
 * Checks whether the browser can demux/decode the given MIME type via
 * `MediaSource.isTypeSupported` (or `ManagedMediaSource.isTypeSupported`
 * on Safari).
 *
 * Special-cases:
 *  - Opus on Chrome < 38 without i0() flag is rejected.
 *  - If neither MediaSource nor ManagedMediaSource exist, falls back to
 *    webm container check and then canPlayType.
 *  - The bare AAC audio type is mapped to an H.264 video type for the
 *    probe (browser quirk workaround).
 *
 * [was: eT]
 *
 * @param {string} mimeType - full MIME + codecs string
 * @returns {boolean}
 */
export function isTypeSupported(mimeType) { // was: eT
  // Opus gate: reject on old Chrome without the experiment flag
  if (/opus/.test(mimeType) && isChrome() && !isKnownBrowserVersion('38') && !isCobalt())
    return false;

  // Prefer MediaSource.isTypeSupported
  if (self.MediaSource && self.MediaSource.isTypeSupported)
    return self.MediaSource.isTypeSupported(mimeType);

  // Safari ManagedMediaSource fallback
  if (self.ManagedMediaSource && self.ManagedMediaSource.isTypeSupported)
    return self.ManagedMediaSource.isTypeSupported(mimeType);

  // No MSE — reject webm if WebM is not supported at all
  if (/webm/.test(mimeType) && !isPS4())
    return false;

  // Browser quirk: bare AAC probe does not work; test as H.264 video instead
  if (mimeType === 'audio/mp4; codecs="mp4a.40.2"')
    mimeType = 'video/mp4; codecs="avc1.4d401f"';

  return !!canPlayType(mimeType);
}

// ---------------------------------------------------------------------------
// Format Availability Check  [was: MXm]  (line ~22027)
// ---------------------------------------------------------------------------

/**
 * Returns `null` if at least one audio + video codec pair is playable,
 * otherwise returns an error string explaining what is missing.
 *
 * [was: MXm]
 *
 * @param {boolean} [videoRequired] - if falsy, audio-only is acceptable
 * @returns {string|null} error code or null
 */
export function checkFormatAvailability(videoRequired) { // was: MXm
  try {
    const hasVideo = // was: c
      isTypeSupported('video/mp4; codecs="avc1.42001E"') ||
      isTypeSupported('video/webm; codecs="vp9"');

    const hasAudio =
      (isTypeSupported('audio/mp4; codecs="mp4a.40.2"') ||
       isTypeSupported('audio/webm; codecs="opus"')) &&
      (hasVideo || !videoRequired);

    const hasMuxed =
      canPlayType('video/mp4; codecs="avc1.42001E, mp4a.40.2"');

    return hasAudio || hasMuxed ? null : 'fmt.noneavailable';
  } catch {
    return 'html5.missingapi';
  }
}

// ---------------------------------------------------------------------------
// WebKit Presentation Mode  [was: Vc]  (line ~22036)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the video element supports WebKit's presentation mode
 * (e.g. Picture-in-Picture on Safari).
 *
 * [was: Vc]
 *
 * @returns {boolean}
 */
export function supportsWebkitPresentationMode() { // was: Vc
  const createDatabaseDefinition = getProbeVideoElement(); // was: Q
  return !(!createDatabaseDefinition.webkitSupportsPresentationMode || typeof createDatabaseDefinition.webkitSetPresentationMode !== 'function');
}

// ---------------------------------------------------------------------------
// Mute-Toggle Capability  [was: BT]  (line ~22041)
// ---------------------------------------------------------------------------

/**
 * Tests whether the video element's `muted` property is actually writable
 * (some embedded contexts silently block it).
 *
 * [was: BT]
 *
 * @returns {boolean}
 */
export function canToggleMute() { // was: BT
  const createDatabaseDefinition = getProbeVideoElement(); // was: Q
  try {
    const wasMuted = createDatabaseDefinition.muted; // was: c
    createDatabaseDefinition.muted = !wasMuted;
    return createDatabaseDefinition.muted !== wasMuted;
  } catch {}
  return false;
}

// ---------------------------------------------------------------------------
// Quality-Label to Resolution  [was: sU]  (line ~22769)
// ---------------------------------------------------------------------------

/**
 * Maps a pixel dimension pair to the closest quality label ("tiny",
 * "small", "medium", "large", "hd720", "hd1080", etc.) using the
 * `g.EU` resolution table and a 1.3x tolerance multiplier.
 *
 * [was: sU]
 *
 * @param {number} dimA - one dimension (width or height)
 * @param {number} dimB - the other dimension
 * @returns {string} quality label
 */
export function getQualityLabel(dimA, dimB) { // was: sU
  const maxDim = Math.max(dimA, dimB); // was: W
  const minDim = Math.min(dimA, dimB); // was: Q (reassigned)
  let prevLabel = QUALITY_LABELS_DESCENDING[0]; // was: c
  for (let i = 0; i < QUALITY_LABELS_DESCENDING.length; i++) { // was: m
    const label = QUALITY_LABELS_DESCENDING[i]; // was: K
    const height = qualityLabelToOrdinal[label]; // was: T
    if (maxDim >= Math.floor(height * 16 / 9) * 1.3 || minDim >= height * 1.3)
      return prevLabel;
    prevLabel = label;
  }
  return 'tiny';
}

// ---------------------------------------------------------------------------
// Container-Type Detection  [was: dh]  (line ~22783)
// ---------------------------------------------------------------------------

/**
 * Returns a numeric container-type constant from a MIME type string.
 *   1 = MP4, 2 = WebM, 3 = FLV, 4 = VTT, 0 = unknown.
 *
 * [was: dh]
 *
 * @param {string} mimeType
 * @returns {number}
 */
export function getContainerType(mimeType) { // was: dh
  if (mimeType.indexOf('/mp4') >= 0) return 1;
  if (mimeType.indexOf('/webm') >= 0) return 2;
  if (mimeType.indexOf('/x-flv') >= 0) return 3;
  if (mimeType.indexOf('/vtt') >= 0) return 4;
  return 0;
}

// ---------------------------------------------------------------------------
// Text-Track Detection  [was: LM]  (line ~22787)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the MIME type indicates a text/subtitle format.
 * [was: LM]
 */
export function isTextTrackMimeType(mimeType) { // was: LM
  return mimeType.includes('vtt') || mimeType.includes('text/mp4');
}

// ---------------------------------------------------------------------------
// Audio / Video Codec Detection  [was: wh, bo]  (line ~22791–22797)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the codec string contains a known audio codec identifier.
 * Matches: opus, mp4a, dtse, ac-3, ec-3, iamf.
 *
 * [was: wh]
 *
 * @param {string} codecString
 * @returns {boolean}
 */
export function isAudioCodec(codecString) { // was: wh
  return /(opus|mp4a|dtse|ac-3|paintProgress-3|iamf)/.test(codecString);
}

/**
 * Returns `true` if the codec string contains a known video codec identifier.
 * Matches: vp9, vp09, vp8, avc1, av01, av02.
 *
 * [was: bo]
 *
 * @param {string} codecString
 * @returns {boolean}
 */
export function isVideoCodec(codecString) { // was: bo
  return /(vp9|vp09|vp8|avc1|av01|av02)/.test(codecString);
}

// ---------------------------------------------------------------------------
// Format Descriptor Constructor  [was: fM]  (line ~22799)
// ---------------------------------------------------------------------------

/**
 * Builds a combined audio+video format descriptor (OU) from a raw
 * MIME type, quality label, itag, and optional width/height overrides.
 *
 * [was: fM]
 *
 * @param {string} rawMimeType   - possibly HTML-entity-escaped MIME type   [was: Q]
 * @param {string} qualityLabel  - e.g. "hd720"                            [was: c]
 * @param {*}      itag          - format itag                              [was: W]
 * @param {number|string} [width]  - explicit width                         [was: m]
 * @param {number|string} [height] - explicit height                        [was: K]
 * @param {*}      [eotf]         - EOTF (electro-optical transfer fn)      [was: T]
 * @param {*}      [primaries]     - color primaries                        [was: r]
 * @returns {OU} format descriptor
 */
export function buildFormatDescriptor(rawMimeType, qualityLabel, itag, width, height, eotf, primaries) { // was: fM
  const audioDesc = new jT(); // was: U
  if (!(qualityLabel in qualityLabelToOrdinal)) qualityLabel = 'small';
  if (qualityLabel === 'light') qualityLabel = 'tiny';

  if (width && height) {
    height = Number(height); // was: K = Number(K)
    width = Number(width); // was: m = Number(m)
  } else {
    height = qualityLabelToOrdinal[qualityLabel]; // was: K = g.EU[c]
    width = Math.round(height * 16 / 9); // was: m = Math.round(K * 16 / 9)
  }

  const videoDesc = new VideoInfo(width, height, 0, null, undefined, qualityLabel, eotf, primaries); // was: T
  rawMimeType = unescape(rawMimeType.replace(/&quot;/g, '"')); // was: Q
  return new FormatInfo(itag, rawMimeType, { audio: audioDesc, video: videoDesc });
}

// ---------------------------------------------------------------------------
// Codec-Key Helpers  [was: vT, UVW, I8n, g.Gb, XYK]  (line ~22814–22832)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the format uses VP9 Profile 2 (HDR) codec key.
 * [was: vT]
 */
export function isVp9Hdr(format) { // was: vT
  return format.computeAutoHideVisible === '9h' || format.computeAutoHideVisible === '(h';
}

/**
 * Returns `true` if the format requires FairPlay DRM (or Widevine L1 on
 * platforms that support it via the `aR` flag).
 *
 * [was: UVW]
 */
export function requiresFairPlayDrm(format) { // was: UVW
  return (
    (!!format.contentProtection &&
     !!format.contentProtection.fairplay &&
     (format.computeAutoHideVisible === '(' || format.computeAutoHideVisible === '(h' || format.computeAutoHideVisible === 'A' || format.computeAutoHideVisible === 'MEAC3')) ||
    (aR && !!format.contentProtection && format.computeAutoHideVisible === '1e')
  );
}

/**
 * Returns `true` if the format uses a multi-channel / immersive audio codec key.
 * [was: I8n]
 */
export function isMultiChannelAudio(format) { // was: I8n
  return format.computeAutoHideVisible === 'MAC3' || format.computeAutoHideVisible === 'MEAC3' || format.computeAutoHideVisible === 'M' || format.computeAutoHideVisible === 'I';
}

/**
 * Returns `true` if the format is MP4 container.
 * [was: g.Gb]
 */
export function isMp4Container(format) { // was: g.Gb
  return format.containerType === 1;
}

/**
 * Returns `true` if the format uses a Widevine-type encryption key.
 * [was: XYK]
 */
export function isWidevineEncrypted(format) { // was: XYK
  return (
    format.computeAutoHideVisible === '(' ||
    format.computeAutoHideVisible === '(h' ||
    format.computeAutoHideVisible === 'H' ||
    (aR && format.computeAutoHideVisible === '1e')
  );
}

// ---------------------------------------------------------------------------
// MediaCapabilities Robustness Map  [was: A9m]  (line ~22834)
// ---------------------------------------------------------------------------

/**
 * Builds a key-value map of MediaCapabilities configuration properties
 * from a format descriptor, used for `isTypeSupported` probing with
 * extended configuration.
 *
 * [was: A9m]
 *
 * @param {object} format          - format descriptor          [was: Q]
 * @param {number} [rateMultiplier=1] - playback-rate multiplier [was: c]
 * @returns {Object<string, *>}
 */
export function buildMediaCapabilitiesConfig(format, rateMultiplier = 1) { // was: A9m
  const config = {}; // was: W

  if (format.video) {
    if (format.video.width)
      config[MediaCapabilityKey.WIDTH.name] = format.video.width; // was: $i.WIDTH
    if (format.video.height)
      config[MediaCapabilityKey.HEIGHT.name] = format.video.height;
    if (format.video.fps)
      config[MediaCapabilityKey.FRAMERATE.name] = format.video.fps * rateMultiplier;
    if (format.video.W) // EOTF
      config[MediaCapabilityKey.EOTF.name] = format.video.W;
    if (format.handleBackgroundSuspend)
      config[MediaCapabilityKey.BITRATE.name] = format.handleBackgroundSuspend * 8 * rateMultiplier;
    if (format.computeAutoHideVisible === '(')
      config[MediaCapabilityKey.CRYPTOBLOCKFORMAT.name] = 'subsample';
    if (
      format.video.projectionType === 'EQUIRECTANGULAR' ||
      format.video.projectionType === 'EQUIRECTANGULAR_THREED_TOP_BOTTOM' ||
      format.video.projectionType === 'MESH'
    )
      config[MediaCapabilityKey.DECODETOTEXTURE.name] = 'true';
  }

  if (format.audio?.numChannels && format.computeAutoHideVisible !== 'i' && format.computeAutoHideVisible !== 'I')
    config[MediaCapabilityKey.CHANNELS.name] = format.audio.numChannels;

  return config;
}

// ---------------------------------------------------------------------------
// Format ID Builder  [was: g.PT]  (line ~22847)
// ---------------------------------------------------------------------------

/**
 * Extracts a normalized format-ID object (itag, lmt, xtags) from a
 * format descriptor.
 *
 * [was: g.PT]
 *
 * @param {object}  format        - format descriptor [was: Q]
 * @param {boolean} [resetLmt]    - if truthy, zero out lastModified [was: c]
 * @returns {{ itag: number, lmt: *, xtags: string }}
 */
export function buildFormatId(format, resetLmt) { // was: g.PT
  return {
    itag: +format.itag,
    lmt: resetLmt ? 0 : format.lastModified,
    xtags: format.O || '',
  };
}

// ---------------------------------------------------------------------------
// MediaCapabilities decodingInfo Probe  [was: ecn]  (line ~22855)
// ---------------------------------------------------------------------------

/**
 * Queries `navigator.mediaCapabilities.decodingInfo` for a format and
 * stores the result on `format.K`.
 *
 * Skips the probe for FLAC-only formats (mI === "f").
 *
 * [was: ecn]
 *
 * @param {object} format - format descriptor
 * @returns {Promise<void>}
 */
export function probeDecodingInfo(format) { // was: ecn
  const transitionPanel = navigator.mediaCapabilities; // was: c
  if (!transitionPanel?.decodingInfo || format.computeAutoHideVisible === 'f')
    return Promise.resolve();

  const config = { // was: W
    type: format.audio && format.video ? 'file' : 'media-source',
  };

  if (format.video) {
    config.video = {
      contentType: format.mimeType,
      width: format.video.width || 640,
      height: format.video.height || 360,
      bitrate: format.handleBackgroundSuspend * 8 || 1_000_000,
      framerate: format.video.fps || 30,
    };
  }

  if (format.audio) {
    config.audio = {
      contentType: format.mimeType,
      channels: `${format.audio.numChannels || 2}`,
      bitrate: format.handleBackgroundSuspend * 8 || 128_000,
      samplerate: format.audio.sampleRate || 44100,
    };
  }

  return transitionPanel.decodingInfo(config).then((result) => { // was: m
    format.K = result;
  });
}

// ---------------------------------------------------------------------------
// TimeRanges Utilities  [was: lo, VUm, uo, hm, zb, B2n, CM, Ml, Jm, RR, ki]
//                       (line ~22881–22963)
// ---------------------------------------------------------------------------

/**
 * Creates a synthetic TimeRanges-like object from parallel start/end arrays.
 * [was: lo]
 *
 * @param {number[]} starts
 * @param {number[]} ends
 * @returns {{ start(i: number): number, end(i: number): number, length: number }}
 */
export function createTimeRanges(starts, ends) { // was: lo
  return {
    start(index) { return starts[index]; }, // was: W
    end(index) { return ends[index]; },
    length: starts.length,
  };
}

/**
 * Appends a new range to an existing TimeRanges object, returning a new
 * sorted TimeRanges.
 *
 * [was: VUm]
 */
export function appendTimeRange(ranges, start, end) { // was: VUm
  const starts = []; // was: m
  const ends = []; // was: K
  for (let i = 0; i < ranges.length; i++) { // was: T
    starts.push(ranges.start(i));
    ends.push(ranges.end(i));
  }
  starts.push(start);
  ends.push(end);
  starts.sort((a, b) => a - b); // was: T, r
  ends.sort((a, b) => a - b);
  return createTimeRanges(starts, ends);
}

/**
 * Serialises a TimeRanges object to a human-readable string
 * (e.g. "0.000-5.123,10.000-15.456").
 *
 * [was: uo]
 *
 * @param {TimeRanges} ranges
 * @param {string}     [separator=","]
 * @param {number}     [maxEntries] - how many trailing entries to include
 * @returns {string}
 */
export function serializeTimeRanges(ranges, separator = ',', maxEntries = ranges ? ranges.length : 0) { // was: uo
  const parts = []; // was: m
  if (ranges) {
    for (let i = Math.max(ranges.length - maxEntries, 0); i < ranges.length; i++) // was: W
      parts.push(`${ranges.start(i).toFixed(3)}-${ranges.end(i).toFixed(3)}`);
  }
  return parts.join(separator);
}

/**
 * Returns the index of the TimeRange that contains `time`, or -1.
 * [was: hm]
 */
export function findRangeIndex(ranges, time) { // was: hm
  if (!ranges) return -1;
  try {
    for (let i = 0; i < ranges.length; i++) // was: W
      if (ranges.start(i) <= time && ranges.end(i) >= time)
        return i;
  } catch (_err) {} // was: W
  return -1;
}

/**
 * Returns `true` if `time` falls within any range.
 * [was: zb]
 */
export function isTimeInRange(ranges, time) { // was: zb
  return findRangeIndex(ranges, time) >= 0;
}

/**
 * Returns the start of the range containing `time`, or NaN.
 * [was: B2n]
 */
export function getRangeStart(ranges, time) { // was: B2n
  if (!ranges) return NaN;
  const idx = findRangeIndex(ranges, time); // was: c
  return idx >= 0 ? ranges.start(idx) : NaN;
}

/**
 * Returns the end of the range containing `time`, or NaN.
 * [was: CM]
 */
export function getRangeEnd(ranges, time) { // was: CM
  if (!ranges) return NaN;
  const idx = findRangeIndex(ranges, time); // was: c
  return idx >= 0 ? ranges.end(idx) : NaN;
}

/**
 * Returns the end of the last range, or NaN.
 * [was: Ml]
 */
export function getLastRangeEnd(ranges) { // was: Ml
  return ranges && ranges.length ? ranges.end(ranges.length - 1) : NaN;
}

/**
 * Returns `true` if the last range ends after 0 (i.e. there is buffered data).
 * [was: Jm]
 */
export function hasBufferedData(ranges) { // was: Jm
  return getLastRangeEnd(ranges) > 0;
}

/**
 * Returns the number of seconds remaining in the current range from `time`.
 * [was: RR]
 */
export function getRemainingInRange(ranges, time) { // was: RR
  const end = getRangeEnd(ranges, time); // was: Q = CM(Q, c)
  return end >= 0 ? end - time : 0;
}

/**
 * Clips a TimeRanges object to the `[start, end)` window, returning
 * a new TimeRanges with offsets relative to `start`.
 *
 * [was: ki]
 */
export function clipTimeRanges(ranges, start, end) { // was: ki
  const starts = []; // was: m
  const ends = []; // was: K
  for (let i = 0; i < ranges.length; i++) { // was: T
    if (ranges.end(i) < start || ranges.start(i) > end) continue;
    starts.push(Math.max(start, ranges.start(i)) - start);
    ends.push(Math.min(end, ranges.end(i)) - start);
  }
  return createTimeRanges(starts, ends);
}

// ---------------------------------------------------------------------------
// SourceBuffer.changeType Detection  [was: Yi]  (line ~22965)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if `SourceBuffer.prototype.changeType` exists.
 * [was: Yi]
 */
export function supportsChangeType() { // was: Yi
  return window.SourceBuffer ? !!SourceBuffer.prototype.changeType : false;
}

// ---------------------------------------------------------------------------
// MediaSource API Detection  [was: xVy, pM]  (line ~22969–22975)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if any form of Media Source Extensions is available
 * (standard, Managed, WebKit, or legacy webkitSourceAddId).
 *
 * [was: xVy]
 */
export function hasMediaSourceApi() { // was: xVy
  return !!(
    window.MediaSource ||
    window.ManagedMediaSource ||
    window.WebKitMediaSource ||
    (window.HTMLMediaElement && HTMLMediaElement.prototype.webkitSourceAddId)
  );
}

/**
 * Returns `true` if a fully-featured MediaSource (with `isTypeSupported`)
 * or ManagedMediaSource is present.
 *
 * [was: pM]
 */
export function hasFullMediaSource() { // was: pM
  return (
    (!(!window.MediaSource || !window.MediaSource.isTypeSupported)) ||
    !!window.ManagedMediaSource
  );
}

// ---------------------------------------------------------------------------
// MediaSource Open-State Check  [was: Qv, qox]  (line ~22977–22990)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the MediaSource's readyState is "open".
 * Swallows any exception (e.g. if the source has been detached).
 *
 * [was: Qv]
 */
export function isMediaSourceOpen(mediaSource) { // was: Qv
  try {
    return mediaSource.A() === 'open';
  } catch (_err) { // was: c
    return false;
  }
}

/**
 * Schedules a callback for when the MediaSource is open.
 * If already open, defers via `g.mN`; otherwise stores it for later.
 *
 * [was: qox]
 */
export function onMediaSourceOpen(mediaSource, callback) { // was: qox
  if (isMediaSourceOpen(mediaSource)) {
    g.mN(() => { callback(mediaSource); });
  } else {
    mediaSource.callback = callback;
  }
}
