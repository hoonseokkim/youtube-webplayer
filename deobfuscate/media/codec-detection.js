/**
 * codec-detection.js -- Codec string parsing and capability detection
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~31414-31980, ~34670-34676
 *
 * Handles:
 *  - Building full MIME type + codec strings for VP9 / VP9.2 (HDR) / AV1 / H.264
 *  - MediaSource.isTypeSupported() probing for capability features (height,
 *    width, framerate, bitrate, channels, EOTF, AV1 profiles, HDCP)
 *  - HDR detection (SMPTE 2084 / PQ, ARIB STD-B67 / HLG, BT.2020 wide color gamut)
 *  - AV1 decode threshold estimation based on hardware core count / perf caps
 *  - DRM key-system probing (Widevine, PlayReady, FairPlay, cobalt)
 *  - EME (Encrypted Media Extensions) configuration and key-system access
 *  - Audio codec support (AC-3, E-AC-3, Opus channel count)
 *  - Format selection filter (video codec preference ordering)
 */
import { checkStatPayloadLength } from './engine-config.js'; // was: QO
import { computeAutoHideVisible } from '../player/caption-manager.js'; // was: mI
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { AdButton } from '../player/component-events.js'; // was: wK
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { isTypeSupported } from './codec-helpers.js';
import { isHdr } from '../player/time-tracking.js';
import { concat } from '../core/array-utils.js';

// ---------------------------------------------------------------------------
// VP9 codec string builder
// ---------------------------------------------------------------------------

/** @type {boolean|null} cached result of VP9 profile-2 probing [was: dg] */
let vp9Profile2Supported = null;

/**
 * Build the correct MIME type string for VP9 / VP9 Profile 2 (HDR).
 *
 * When the browser supports the full `vp09.XX.XX.XX...` form, this
 * function emits a fully-qualified codec string including bit-depth,
 * color primaries, transfer characteristics, and matrix coefficients.
 *
 * [was: Xc]
 *
 * @param {string} baseMimeType  - e.g. 'video/webm; codecs="vp9"'
 * @param {object} videoInfo     - video descriptor with .W (EOTF), .primaries
 * @param {string} itagCodecKey  - short codec key from Ak lookup (e.g. "9", "9h")
 * @returns {string} full MIME type
 */
export function buildVp9MimeType(baseMimeType, videoInfo, itagCodecKey) { // was: Xc
  if (vp9Profile2Supported === null) {
    vp9Profile2Supported =
      window.MediaSource &&
      MediaSource.isTypeSupported &&
      MediaSource.isTypeSupported('video/webm; codecs="vp09.02.51.10.01.09.16.09.00"') &&
      !MediaSource.isTypeSupported('video/webm; codecs="vp09.02.51.10.01.09.99.99.00"');
  }

  // If platform uses the short-form vp9 string (legacy / prefixed MSE)
  // [was: $pw — legacy WebKit MSE flag]
  if (USE_SHORT_VP9_CODEC && window.MediaSource && MediaSource.isTypeSupported !== undefined) {
    if (vp9Profile2Supported || (itagCodecKey !== '9' && itagCodecKey !== '(')) {
      if (vp9Profile2Supported || (itagCodecKey !== '9h' && itagCodecKey !== '(h')) {
        // keep baseMimeType unchanged
      } else {
        baseMimeType = 'video/webm; codecs="vp9.2"';
      }
    } else {
      baseMimeType = 'video/webm; codecs="vp9"';
    }
    return baseMimeType;
  }

  // Full codec string path
  if (!vp9Profile2Supported && !FORCE_LONG_VP9_CODEC) return baseMimeType;
  if (baseMimeType !== 'video/webm; codecs="vp9"' && baseMimeType !== 'video/webm; codecs="vp9.2"') {
    return baseMimeType;
  }

  let profile = '00';        // was: W
  let bitDepth = '08';       // was: m
  let matrixCoeff = '01';    // was: K
  let transferChar = '01';   // was: T
  let primaries = '01';      // was: r

  if (baseMimeType === 'video/webm; codecs="vp9.2"') {
    profile = '02';
    bitDepth = '10';
    if (videoInfo.primaries === 'bt2020') {
      matrixCoeff = '09';
      primaries = '09';
    }
    if (videoInfo.W === 'smpte2084') transferChar = '16'; // was: W field = EOTF
    if (videoInfo.W === 'arib-std-b67') transferChar = '18';
  }

  return `video/webm; codecs="${['vp09', profile, '51', bitDepth, '01', matrixCoeff, transferChar, primaries, '00'].join('.')}"`;
}

// Placeholder flags — set by platform detection at startup
let USE_SHORT_VP9_CODEC = false;  // was: $pw
let FORCE_LONG_VP9_CODEC = false; // was: LJ

// ---------------------------------------------------------------------------
// MediaSource capability feature probing
// ---------------------------------------------------------------------------

/**
 * Capability feature descriptors used with `isTypeSupported` extended queries.
 * Each feature has a `.name`, a `.valid` value, and a `.QO` (invalid/sentinel)
 * value. If the browser returns `true` for the valid value and `false` for the
 * invalid one, the feature is considered reliably queryable.
 *
 * [was: $i]
 */
export const CAPABILITY_FEATURES = {
  WIDTH:            { name: 'width',             video: true,  valid: 640,              checkStatPayloadLength: 99999 },
  HEIGHT:           { name: 'height',            video: true,  valid: 360,              checkStatPayloadLength: 99999 },
  FRAMERATE:        { name: 'framerate',         video: true,  valid: 30,               checkStatPayloadLength: 9999 },
  BITRATE:          { name: 'bitrate',           video: true,  valid: 3E5,              checkStatPayloadLength: 2E9 },
  EOTF:             { name: 'eotf',              video: true,  valid: 'bt709',          checkStatPayloadLength: 'catavision' },
  CHANNELS:         { name: 'channels',          video: false, valid: 2,                checkStatPayloadLength: 99 },
  CRYPTOBLOCKFORMAT:{ name: 'cryptoblockformat', video: true,  valid: 'subsample',      checkStatPayloadLength: 'invalidformat' },
  DECODETOTEXTURE:  { name: 'decode-to-texture', video: true,  valid: 'false',          checkStatPayloadLength: 'nope' },
  AV1_CODECS:       { name: 'codecs',            video: true,  valid: 'av01.0.05M.08',  checkStatPayloadLength: 'av99.0.05M.08' },
  EXPERIMENTAL:     { name: 'experimental',      video: true,  valid: 'allowed',        checkStatPayloadLength: 'invalid' },
  TUNNELMODE:       { name: 'tunnelmode',        video: true,  valid: 'true',           checkStatPayloadLength: 'false' },
};

/**
 * Test whether a particular capability feature is reliably supported by
 * the current MediaSource implementation.
 * [was: T13]
 *
 * @param {object} capabilities  - capabilities cache object [was: Q, the l0K instance]
 * @param {object} feature       - one of CAPABILITY_FEATURES
 * @returns {boolean}
 */
export function probeCapabilityFeature(capabilities, feature) { // was: T13
  if (capabilities.K) return !!capabilities.K[feature.name];

  // Special case: BITRATE probing for VP9 4K
  if (
    feature === CAPABILITY_FEATURES.BITRATE &&
    capabilities.isTypeSupported('video/webm; codecs="vp9"; width=3840; height=2160; bitrate=2000000') &&
    !capabilities.isTypeSupported('video/webm; codecs="vp9"; width=3840; height=2160; bitrate=20000000')
  ) {
    return false;
  }

  // Special case: AV1 codec string validation
  if (feature === CAPABILITY_FEATURES.AV1_CODECS) {
    return (
      capabilities.isTypeSupported(`video/mp4; codecs=${feature.valid}`) &&
      !capabilities.isTypeSupported(`video/mp4; codecs=${feature.QO}`)
    );
  }

  // Generic probe: pick a base type, append the feature with valid/invalid values
  let baseType;
  if (feature.video) {
    baseType = 'video/webm; codecs="vp9"';
    if (!capabilities.isTypeSupported(baseType)) {
      baseType = 'video/mp4; codecs="avc1.4d401e"';
    }
  } else {
    baseType = 'audio/webm; codecs="opus"';
    if (!capabilities.isTypeSupported(baseType)) {
      baseType = 'audio/mp4; codecs="mp4a.40.2"';
    }
  }

  return (
    capabilities.isTypeSupported(`${baseType}; ${feature.name}=${feature.valid}`) &&
    !capabilities.isTypeSupported(`${baseType}; ${feature.name}=${feature.QO}`)
  );
}

/**
 * Check (with caching) if a capability feature is supported.
 * [was: fc]
 *
 * @param {object} capabilities
 * @param {object} feature
 * @returns {boolean}
 */
export function hasCapabilityFeature(capabilities, feature) { // was: fc
  if (!(feature.name in capabilities.J)) {
    capabilities.J[feature.name] = probeCapabilityFeature(capabilities, feature);
  }
  return capabilities.J[feature.name];
}

// ---------------------------------------------------------------------------
// AV1 decode threshold estimation
// ---------------------------------------------------------------------------

/**
 * Estimate the maximum AV1 decode resolution that is practical on the
 * current device based on hardware concurrency, performance caps, and
 * the optional MediaCapabilities API.
 *
 * [was: vr]
 *
 * @param {object} experiments  - experiment flags holder
 * @param {object} [diagnostics={}] - output object for diagnostic keys
 * @param {object} [decodingInfo] - optional MediaCapabilities result
 * @param {boolean} [disableAv1=false]
 * @returns {number} max resolution ordinal (e.g. 480, 1080, 2160, 8192)
 */
export function estimateAv1Threshold(experiments, diagnostics = {}, decodingInfo, disableAv1 = false) { // was: vr
  if (disableAv1) {
    diagnostics.disabled = 1;
    return 0;
  }

  // If the capability bits for AV1_CODECS, HEIGHT, and BITRATE are all present
  if (
    hasCapabilityFeature(experiments.K, CAPABILITY_FEATURES.AV1_CODECS) &&
    hasCapabilityFeature(experiments.K, CAPABILITY_FEATURES.HEIGHT) &&
    hasCapabilityFeature(experiments.K, CAPABILITY_FEATURES.BITRATE)
  ) {
    diagnostics.isCapabilityUsable = 1;
    return 8192;
  }

  let threshold = 1080;
  const coreCount = navigator.hardwareConcurrency;
  if (coreCount <= 2) threshold = 480;
  diagnostics.coreCount = coreCount;

  const experimentDefault = experiments.BA?.('html5_default_av1_threshold');
  if (experimentDefault) threshold = diagnostics['default'] = experimentDefault;

  const mediaCap = experiments.K?.mF;
  if (mediaCap) {
    diagnostics.mcap = mediaCap;
    threshold = Math.max(threshold, mediaCap);
  }

  if (decodingInfo) {
    const efficientInfo = decodingInfo.videoInfos?.find(v => v.W())?.K?.powerEfficient;
    if (efficientInfo) {
      threshold = 8192;
      diagnostics.isEfficient = 1;
    }
    const video = decodingInfo.videoInfos[0].video;
    const perfCap = Math.min(
      lookupPerfCap('1', video.fps),
      lookupPerfCap('1', 30)
    );
    diagnostics.perfCap = perfCap;
    threshold = Math.min(threshold, perfCap);
    if (video.isHdr() && !efficientInfo) {
      diagnostics.hdr = 1;
      threshold *= 0.75;
    }
  } else {
    const cap30 = lookupPerfCap('1', 30);
    diagnostics.perfCap30 = cap30;
    threshold = Math.min(threshold, cap30);
    const cap60 = lookupPerfCap('1', 60);
    diagnostics.perfCap60 = cap60;
    threshold = Math.min(threshold, cap60);
  }

  return (diagnostics.av1Threshold = threshold);
}

// Placeholder — externally provided perf-cap lookup [was: bU]
function lookupPerfCap(codec, fps) {
  return 8192;
}

// ---------------------------------------------------------------------------
// HDR / WCG detection
// ---------------------------------------------------------------------------

/**
 * Check whether the display environment supports HDR via media queries.
 * Used in `P5w` (format-is-playable check) to gate HDR formats.
 *
 * @returns {boolean}
 */
export function isHdrDisplaySupported() {
  if (!window.matchMedia) return false;
  return (
    window.matchMedia('(dynamic-range: high), (video-dynamic-range: high)').matches ||
    (window.screen.pixelDepth > 24 && window.matchMedia('(color-gamut: p3)').matches)
  );
}

/**
 * Determine if a format is playable on this device.
 * Returns `true` if playable, or a short diagnostic string explaining why not.
 *
 * Checks: codec support, HDR display, Opus version, AV1 encode, extended
 * capabilities, HDCP for encrypted content, etc.
 *
 * [was: P5w]
 *
 * @param {object} capabilities  - device capability info [was: Q (l0K)]
 * @param {object} formatInfo    - format descriptor (OU) [was: c]
 * @param {number} [playbackRate=1]
 * @returns {true|string} true if supported; otherwise a reason code
 */
export function isFormatPlayable(capabilities, formatInfo, playbackRate = 1) { // was: P5w
  const itag = formatInfo.itag;
  if (itag === '0') return true;

  let mimeType = formatInfo.mimeType;

  // AV1 software encoder check
  if (formatInfo.computeAutoHideVisible === '1e' && !capabilities.j) return 'dav1enc';
  // AV1 blocked by flag
  if (formatInfo.W() && capabilities.Y) return 'dav1';

  // HDR/WCG display check
  if (
    formatInfo.video &&
    (formatInfo.video.isHdr() || formatInfo.video.primaries === 'bt2020') &&
    !(
      hasCapabilityFeature(capabilities, CAPABILITY_FEATURES.EOTF) ||
      isHdrDisplaySupported()
    )
  ) {
    return 'dhdr';
  }

  // Opus version gate (itag 338 requires Chrome 53+ / Firefox 64+)
  if (itag === '338' && !isModernOpusSupported()) {
    return 'dopus';
  }

  // Build extended capability constraints from the format
  const constraints = buildCapabilityConstraints(formatInfo, playbackRate);

  // Check each capability feature
  for (const key of Object.keys(CAPABILITY_FEATURES)) {
    const feature = CAPABILITY_FEATURES[key];
    const constraintValue = constraints[feature.name];
    if (!constraintValue) continue;

    // VP9 profile 2 EOTF is auto-embedded in the codec string
    if (feature === CAPABILITY_FEATURES.EOTF && formatInfo.mimeType.indexOf('vp09.02') > 0) {
      continue;
    }

    if (hasCapabilityFeature(capabilities, feature)) {
      if (capabilities.K && capabilities.K[feature.name] < constraints[feature.name]) {
        return feature.name;
      }
      mimeType = `${mimeType}; ${feature.name}=${constraints[feature.name]}`;
    } else if (isVp9Profile2(formatInfo) && feature === CAPABILITY_FEATURES.EOTF) {
      return 'dvp92';
    }
  }

  // HDCP 2.2 requirement for encrypted high-resolution content
  if (
    capabilities.L &&
    formatInfo.video &&
    formatInfo.video.qualityOrdinal > 1080 &&
    formatInfo.contentProtection
  ) {
    mimeType += '; hdcp=2.2';
  }

  return capabilities.isTypeSupported(mimeType) ? true : 'tpus';
}

/**
 * Check if a format uses VP9 Profile 2 (10-bit / HDR).
 * [was: vT]
 */
function isVp9Profile2(formatInfo) {
  return formatInfo.mimeType?.includes('vp09.02');
}

// Placeholder
function isModernOpusSupported() { return true; }
function buildCapabilityConstraints(/* formatInfo, rate */) { return {}; }

// ---------------------------------------------------------------------------
// DRM key-system ordering
// ---------------------------------------------------------------------------

/**
 * Known DRM key-system identifiers and their preferred ordering.
 * [was: kM]
 */
export const KEY_SYSTEMS = {
  playready: ['com.youtube.playready', 'com.microsoft.playready'],
  widevine: ['com.youtube.widevine.l3', 'com.widevine.alpha'],
};

/**
 * Build the ordered list of key-system identifiers to attempt.
 *
 * [was: Cg7]
 *
 * @param {boolean} preferPlayReady
 * @param {boolean} useWidevineL3
 * @param {boolean} useFairPlay
 * @param {boolean} useFairPlaySbdl
 * @returns {string[]}
 */
export function buildKeySystemOrder(preferPlayReady, useWidevineL3, useFairPlay, useFairPlaySbdl) { // was: Cg7
  const isFairPlayPlatform = isFairPlayNative(); // was: y5()
  const systems = (isFairPlayPlatform || useFairPlay)
    ? ['com.youtube.fairplay']
    : ['com.widevine.alpha'];

  if (useWidevineL3) systems.unshift('com.youtube.widevine.l3');
  if (isFairPlayPlatform && useFairPlaySbdl) systems.unshift('com.youtube.fairplay.sbdl');

  if (isFairPlayPlatform || useFairPlay) return systems;
  return preferPlayReady
    ? [...systems, ...KEY_SYSTEMS.playready]
    : [...KEY_SYSTEMS.playready, ...systems];
}

// Placeholder platform checks
function isFairPlayNative() { return false; }

// ---------------------------------------------------------------------------
// EME key-system access configuration builder
// ---------------------------------------------------------------------------

/**
 * Build `MediaKeySystemConfiguration` objects for `requestMediaKeySystemAccess`.
 *
 * [was: MEO]
 *
 * @param {object} drmProbe    - the DRM probe context [was: Q]
 * @param {object} keySystem   - key-system descriptor [was: c]
 * @returns {MediaKeySystemConfiguration[]}
 */
export function buildMediaKeySystemConfig(drmProbe, keySystem) { // was: MEO
  const config = {
    initDataTypes: ['cenc', 'webm'],
    audioCapabilities: [],
    videoCapabilities: [],
  };

  if (keySystem.keySystem === 'com.microsoft.playready') {
    config.initDataTypes = ['keyids', 'cenc'];
  }

  for (const mimeType of Object.keys(drmProbe.W[keySystem.flavor])) {
    const isAudio = mimeType.indexOf('audio/') === 0;
    const capArray = isAudio ? config.audioCapabilities : config.videoCapabilities;

    if (keySystem.flavor !== 'widevine' || drmProbe.K) {
      capArray.push({ contentType: mimeType });
    } else {
      if (isAudio) {
        capArray.push({ contentType: mimeType, robustness: 'SW_SECURE_CRYPTO' });
      } else {
        capArray.push({ contentType: mimeType, robustness: 'HW_SECURE_ALL' });
        capArray.push({ contentType: mimeType, robustness: 'SW_SECURE_DECODE' });
      }
    }
  }

  return [config];
}

// ---------------------------------------------------------------------------
// Format codec preference ordering
// ---------------------------------------------------------------------------

/**
 * Build the preferred order of video codec families for format selection.
 *
 * Codec keys (single/double char) map to codec families:
 *  - "1" / "1h" = AV1 / AV1 HDR
 *  - "9" / "9h" = VP9 / VP9 HDR
 *  - "h"        = H.264 (AVC)
 *  - "8"        = VP8
 *  - "H"        = H.264 high-profile
 *  - "(" / "(h" = VP9 (alternative) / VP9 HDR (alternative)
 *  - "*"        = any
 *  - "f"        = audio-only fallback (XI mode)
 *  - "1e"       = AV1 software encoder variant
 *
 * [was: ffd]
 *
 * @param {object} selectionConfig - format selection flags [was: Q (l0K)]
 * @returns {string[]} ordered codec keys
 */
export function buildVideoCodecPreference(selectionConfig) { // was: ffd
  // Audio-only / forced format mode
  if (selectionConfig.XI) return ['f'];

  let codecs = ['9h', '9', 'h', '8'];
  if (selectionConfig.isTvHtml5Exact) codecs.push('1e');
  codecs = codecs.concat(['(h', '(', 'H', '*']);

  // AV1 at 2160p+ resolution
  if (selectionConfig.MM) {
    codecs.unshift('1');
    codecs.unshift('1h');
  }

  // VP9 disabled — push H.264 to front
  if (selectionConfig.rB) codecs.unshift('h');

  return codecs;
}

/**
 * Build the preferred order of audio codec families.
 *
 * Codec keys:
 *  - "o"     = Opus (standard)
 *  - "a"     = AAC
 *  - "A"     = AAC-HE
 *  - "so"    = spatial Opus
 *  - "sa"    = spatial AAC
 *  - "mac3"  = AC-3
 *  - "MAC3"  = AC-3 (alt)
 *  - "meac3" = E-AC-3
 *  - "MEAC3" = E-AC-3 (alt)
 *  - "i" / "I" = IAMF
 *
 * [was: dEx]
 *
 * @param {object} selectionConfig
 * @returns {string[]} ordered codec keys
 */
export function buildAudioCodecPreference(selectionConfig) { // was: dEx
  let codecs = ['o', 'a', 'A'];

  if (selectionConfig.AdButton === 1) {
    if (selectionConfig.j) codecs = ['mac3', 'MAC3'].concat(codecs);   // AC-3
    if (selectionConfig.K) codecs = ['meac3', 'MEAC3'].concat(codecs); // E-AC-3
    if (selectionConfig.readRepeatedMessageField) codecs = ['i', 'I'].concat(codecs);        // IAMF
  }

  if (selectionConfig.mF) codecs = ['so', 'sa'].concat(codecs);        // spatial audio

  return codecs;
}

// ---------------------------------------------------------------------------
// MediaCapabilities (navigator.mediaCapabilities) async probe
// ---------------------------------------------------------------------------

/**
 * Asynchronously probe AV1 decode efficiency at 4K/60fps using the
 * Media Capabilities API. Updates the capability object's `mF` field
 * if the device is both smooth and power-efficient.
 *
 * [was: ofm]
 *
 * @param {object} capabilities - device capability tracker
 */
export function probeAv1DecodingEfficiency(capabilities) { // was: ofm
  if (!navigator.mediaCapabilities?.decodingInfo) return;

  navigator.mediaCapabilities.decodingInfo({
    type: 'media-source',
    video: {
      contentType: 'video/mp4; codecs="av01.0.12M.08"',
      width: 3840,
      height: 2160,
      bitrate: 32_000_000,
      framerate: 60,
    },
  }).then(result => {
    if (result.smooth && result.powerEfficient) {
      capabilities.mF = 2160;
    }
  });
}

// ---------------------------------------------------------------------------
// FairPlay / Safari detection helpers
// ---------------------------------------------------------------------------

/**
 * Check if the current platform should fall back to HLS (no DASH).
 *
 * Safari without full EME or certain FairPlay configurations forces HLS.
 * [was: ZT]
 *
 * @param {object} videoData
 * @returns {boolean}
 */
export function shouldUseHlsFallback(videoData) { // was: ZT
  if (isFairPlayNative()) {
    return !canPlayOpus(videoData);
  }
  if (isSafariWithoutFullEme()) {
    return !(
      !videoData.w0 ||
      (!videoData.X('html5_enable_safari_fairplay') && canUseMse())
    );
  }
  return false;
}

// Placeholder helpers
function canPlayOpus(/* videoData */) { return true; }
function isSafariWithoutFullEme() { return false; }
function canUseMse() { return true; }

/**
 * Check whether the platform supports DASH + Opus audio.
 * Used as a gate for tvOS and similar environments.
 * [was: FG]
 *
 * @param {object} videoData
 * @returns {boolean}
 */
export function supportsDashOpus(videoData) { // was: FG
  return (
    videoData.X('html5_tvos_skip_dash_audio_check') ||
    MediaSource.isTypeSupported('audio/webm; codecs="opus"')
  );
}
