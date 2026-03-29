/**
 * Format Setup — live playback format handler, caption track handling
 * in format context, stream initialisation before format parsing, and
 * MP4 box manipulation helpers.
 *
 * Source: base.js lines 29075–29949
 *
 * Coverage map:
 *   29075-29134  Za0 — builds the per-family format map (video/audio grouping,
 *                filter, quality cap)
 *   29136-29292  af7 — selects the best audio + video format families,
 *                handles hybrid codec selection (AV1+VP9), spatial audio
 *   29294-29328  Gi_ — format selection with optional "preferred format" hint
 *   29330-29399  bH, g0K, svx, v0R, L9w, Om, yZK — format debug helpers,
 *                stream-size tracking, spatial-audio detection, family
 *                name pretty-printing, format-dedup key generation
 *   29401-29498  dk, E0K, F9d, SEO, ia0, gk — format debug dump, encrypted-
 *                format filter, HFR resolution filter, max-quality filter,
 *                per-family itag grouping, max quality ordinal helper
 *   29500-29570  Lc, jQ — format playability check (the big "is this format
 *                allowed?" gate), format sort by resolution/bitrate
 *   29572-29949  lfx, v2, al, Gg, $D, P2, lH, uYw, uH, hR — segment trim,
 *                MP4 box field readers (uint8, uint16, int32, uint32, int64,
 *                string, raw bytes, write-copy)
 *                zXK, C50, g.MGm, g.JZ0, Cc — cuepoint / emsg parsing
 *                Rl, g.YD, RX0, Ma, JR, g.pc, Q9, kD — box search,
 *                timestamp rewrite, box validation, box constructor,
 *                timescale readers, container-box detection
 *                poX, g.cd, QHK, g.Wd, cK_, g.mQm, mC, TKO, o4m —
 *                colour metadata, fragment decode time, segment index
 *                parsing, emsg parsing, box stripping, init-segment
 *                rewrite for encryption, PSSH extraction
 *
 * Lines ~29950-31300 (WebM/EBML, DASH MPD parsing) already covered in
 *   media/format-parser.js
 *
 * @module media/format-setup
 */
import { parseByteRange } from './format-parser.js'; // was: dv
import { filter, clear, concat, splice } from '../core/array-utils.js';
import { isHdr } from '../player/time-tracking.js';
import { getInt32 } from '../proto/wire-format.js';

// ===========================================================================
// Per-family format map builder (lines 29075-29134)
// ===========================================================================

/**
 * Builds a map of media-family-ID -> format-info arrays from the stream
 * data.  If the stream is a live "muxed" manifest (`sm(m)` returns true),
 * returns the pre-built per-family map directly.
 *
 * For non-live streams, groups formats by family, then filters each by
 * playability (via `Lc`), dedup key (resolution+fps+audio-quality), max
 * quality cap, and HFR precedence.  Caches the result on `Q.O`.
 * [was: Za0]
 *
 * @param {object} formatState   [was: Q] — per-request format state (cache in `.O`)
 * @param {object} streamConfig  [was: c] — quality/codec flags
 * @param {object} capabilities  [was: W] — DRM + decoder capability set
 * @param {object} manifest      [was: m] — stream manifest (`.W` = format map, `.isLive`)
 * @param {Function} logCallback [was: K] — debug-stat callback
 * @param {boolean}  doLog       [was: T] — whether debug logging is active
 * @param {Set}      rejectedFamilies [was: r] — accumulates rejected family IDs
 * @returns {Record<string, object[]>} familyId -> FormatInfo[]
 */
export function buildFamilyFormatMap(formatState, streamConfig, capabilities, manifest, logCallback, doLog, rejectedFamilies) { // was: Za0
  if (formatState.cachedMap) return formatState.cachedMap; // was: Q.O

  const rejectedItags = {}; // was: U
  const usedDecoders = new Set(); // was: I
  const familyMap = {}; // was: X

  // Live muxed manifest short-circuit
  if (isMuxedManifest(manifest)) { // was: sm(m)
    for (const key in manifest.formats) { // was: m.W
      if (!manifest.formats.hasOwnProperty(key)) continue;
      const entry = manifest.formats[key];
      familyMap[entry.info.familyId] = [entry.info]; // was: mI
    }
    return familyMap;
  }

  // Group all formats by family
  const grouped = groupFormatsByFamily(streamConfig, manifest, rejectedItags); // was: ia0(c, m, U)
  if (doLog) logCallback({ aftsrt: dumpFormatMap(grouped) }); // was: dk(A)

  const dedupCache = {}; // was: e
  for (const familyId of Object.keys(grouped)) {
    for (const fmt of grouped[familyId]) {
      const itag = fmt.itag;
      const dedupKey = buildFormatDedupKey(familyId, fmt, streamConfig); // was: yZK

      if (dedupCache.hasOwnProperty(dedupKey)) {
        // Already evaluated this dedup key
        if (dedupCache[dedupKey] === true) {
          familyMap[familyId].push(fmt);
        } else {
          rejectedItags[itag] = dedupCache[dedupKey];
        }
        continue;
      }

      const playable = checkFormatPlayability(streamConfig, fmt, capabilities, manifest.isLive, usedDecoders); // was: Lc
      if (playable !== true) {
        rejectedFamilies.add(familyId);
        rejectedItags[itag] = playable;
        if (playable === 'disablevp9hfr') dedupCache[dedupKey] = 'disablevp9hfr';
      } else {
        familyMap[familyId] = familyMap[familyId] || [];
        familyMap[familyId].push(fmt);
        dedupCache[dedupKey] = true;
      }
    }
  }

  if (doLog) logCallback({ bfflt: dumpFormatMap(familyMap) }); // was: dk(X)

  // Apply max-quality and HFR filters per family
  for (const familyId in familyMap) {
    if (!familyMap.hasOwnProperty(familyId)) continue;
    if (familyMap[familyId]?.[0]?.hasVideo()) { // was: MK()
      familyMap[familyId] = filterByMaxQuality(streamConfig, familyMap[familyId], rejectedItags); // was: SEO
      familyMap[familyId] = filterHfrResolutionPrecedence(familyMap[familyId], rejectedItags); // was: F9d
    }
  }

  if (doLog && Object.keys(rejectedItags).length > 0) {
    logCallback({ rjr: serializeRejections(rejectedItags) }); // was: Tb(U)
  }

  // Decrement decoder-error counters
  for (const familyId of usedDecoders.values()) {
    const decoderState = capabilities.decoderStates.get(familyId); // was: W.A.get(V)
    if (decoderState) --decoderState.errorCount; // was: gV
  }

  if (doLog) logCallback({ aftflt: dumpFormatMap(familyMap) });

  formatState.cachedMap = filterEmpty(familyMap, (v) => !!v.length); // was: g.Ev
  return formatState.cachedMap;
}

// ===========================================================================
// Best format family selection (lines 29136-29292)
// ===========================================================================

/**
 * Selects the best combination of video and audio format families from the
 * available format map.  Handles hybrid codec mode (AV1+VP9), spatial audio,
 * HQ audio preference, and encrypted-format filtering for live DRM streams.
 * [was: af7]
 *
 * @param {object}   formatState    [was: Q]
 * @param {object}   streamConfig   [was: c]
 * @param {object}   capabilities   [was: W]
 * @param {object}   manifest       [was: m]
 * @param {object}   [drmInfo]      [was: K]
 * @param {Function} logCallback    [was: T]
 * @param {boolean}  rebuildStreamSizes [was: r] — recalculate stream-size map
 * @param {boolean}  [filterEncrypted=false] [was: U]
 * @returns {FormatSelection|null}
 */
export function selectBestFormats(formatState, streamConfig, capabilities, manifest, drmInfo, logCallback, rebuildStreamSizes, filterEncrypted = false) { // was: af7
  const doLog = streamConfig.enableDebugLogging || !!drmInfo; // was: c.W || !!K
  const webVttCaptions = doLog && streamConfig.supportsWebVttCaptions ? logCallback : undefined; // was: I, sC

  let rejectedFamilies = new Set();
  let formatMap = buildFamilyFormatMap(formatState, streamConfig, capabilities, manifest, logCallback, doLog, rejectedFamilies);

  // Encrypted-format filter for DRM live
  if (manifest.isDrmProtected()) { // was: m.j()
    formatMap = filterEncryptedFormats(capabilities, formatMap, drmInfo, doLog, logCallback, streamConfig); // was: E0K
    if (doLog) logCallback({ enflt: dumpFormatMap(formatMap) });
  }

  // Spatial audio detection
  streamConfig.hasSpatialAudio = detectSpatialAudio(formatMap, streamConfig); // was: svx -> Y0

  // Audio family selection
  const hasFamily = (familyId) => !!formatMap[familyId]; // was: K = T7 => !!A[T7]
  let audioPrefOrder = getAudioPreferenceOrder(streamConfig); // was: dEx(c)

  // Collect muxed (audio+video) formats
  let muxedFormats = [];
  for (const formats of Object.values(formatMap)) {
    if (formats?.length && formats[0].isMuxed()) muxedFormats.push(...formats); // was: Dg()
  }

  // Live muxed manifest
  if (isMuxedManifest(manifest)) {
    const audioFamily = findFirst(Object.values(formatMap), (fmts) => !!fmts.length && !!fmts[0].audio); // was: g.Yx
    const videoFamily = findFirst(Object.values(formatMap), (fmts) => !!fmts.length && !!fmts[0].video);
    if (!audioFamily || !videoFamily) return noFormatsAvailable(); // was: U1()
    return createFormatSelection(new FormatSet(videoFamily, audioFamily, webVttCaptions, muxedFormats)); // was: I2(new wk(...))
  }

  // Adaptive (non-muxed) audio selection
  let audioFormats = formatMap.a; // was: A.a (AAC family)
  let forcedAacForHqa = false;

  if (streamConfig.preferHighQualityAudio && audioPrefOrder[0] !== 'a' && hasHighQualityAudio(audioFormats)) { // was: GT, L9w
    audioPrefOrder.unshift('a');
    forcedAacForHqa = true;
  }

  if (doLog) {
    logCallback({ audioPrefOrder: audioPrefOrder.join('_') });
    logCallback({ preferHighQualityAudio: streamConfig.preferHighQualityAudio });
    logCallback({ forcedAacForHqa });
  }

  // Select audio
  let selectedAudio = [];
  if (streamConfig.mergeAudioStreams) { // was: qQ
    const validAudioFamilies = audioPrefOrder.filter(hasFamily); // was: g.uw(e, K)
    const seenStreamIds = new Set();
    for (const familyId of validAudioFamilies) {
      const fmts = formatMap[familyId];
      const seenInFamily = new Set();
      for (const fmt of fmts) {
        const streamId = fmt.audioStreamId?.id; // was: D1?.id
        if (streamId) {
          if (seenStreamIds.has(streamId)) {
            if (seenInFamily.has(streamId)) selectedAudio.push(fmt);
          } else {
            seenInFamily.add(streamId);
            seenStreamIds.add(streamId);
            selectedAudio.push(fmt);
          }
        }
      }
    }
    if (selectedAudio.length === 0) {
      if (validAudioFamilies.length === 0) {
        if (doLog) logCallback({ noaudio: 1 });
        return noFormatsAvailable();
      }
      selectedAudio = formatMap[validAudioFamilies[0]];
    }
  } else {
    const bestAudioFamily = findFirst(audioPrefOrder, hasFamily); // was: g.Yx(e, K)
    if (!bestAudioFamily) {
      if (doLog) logCallback({ noaudio: 1 });
      return noFormatsAvailable();
    }
    selectedAudio = formatMap[bestAudioFamily];
  }

  // Delete VP9 if HEVC is present and UC flag is set
  if (formatMap['9'] && formatMap.h && manifest.disableVp9OnHevc && !streamConfig.forceVp9) { // was: UC, UH
    if (doLog) logCallback({ dltvp9: 1 });
    delete formatMap['9'];
  }

  // Stream-size tracking for ABR
  if (rebuildStreamSizes) {
    if (doLog) logCallback({ bfsflt: dumpFormatMap(formatMap), bfsflta: dumpStreamSizes(formatState) }); // was: bH(Q)
    if (streamConfig.useNewStreamSizeTracking) { // was: jG
      formatState.streamSizes = rebuildStreamSizeMap(rejectedFamilies, formatState.streamSizes); // was: wo0
    } else {
      formatState.streamSizes.clear();
    }
    if (doLog) logCallback({ bfsfltb: dumpStreamSizes(formatState) });

    for (const familyId in formatMap) {
      if (!formatMap.hasOwnProperty(familyId)) continue;
      if (familyId === 'f' || (streamConfig.minVideoCodecLevel === 0 && BLOCKED_SIZE_FAMILIES.has(familyId))) { // was: wK, bam
        continue;
      }
      for (const fmt of formatMap[familyId]) {
        if (streamConfig.useNewStreamSizeTracking) {
          updateStreamSizeNew(familyId, fmt, formatState.streamSizes); // was: jv_
        } else {
          updateStreamSize(formatState, familyId, fmt); // was: g0K
        }
      }
    }
    if (doLog) logCallback({ aftsflt: dumpStreamSizes(formatState) });
  }

  // Video family selection
  const av1Family = formatMap['1h'] ? '1h' : '1';
  const vp9Family = formatMap['9h'] ? '9h' : '9';
  const av1Formats = formatMap[av1Family];
  const h264Formats = formatMap['2'];
  const vp9Formats = formatMap[vp9Family];

  if (av1Formats?.length) {
    streamConfig.stats.highestAv1Resolution = av1Formats[av1Formats.length - 1].video.qualityOrdinal; // was: Q.O
  }
  if (vp9Formats?.length) {
    streamConfig.stats.highestVp9Resolution = vp9Formats[vp9Formats.length - 1].video.qualityOrdinal;
  }

  let hybridVideoFormats = [];
  let hybridFamilyIds = [];

  // Forced codec overrides
  if (streamConfig.forceH264 && h264Formats) { // was: yY
    hybridVideoFormats = h264Formats;
    hybridFamilyIds = ['2'];
  } else if (streamConfig.forceAv1 && av1Formats) { // was: u3
    hybridVideoFormats = av1Formats;
    hybridFamilyIds = [av1Family];
    logCallback({ forceAv1: av1Family });
  } else if (streamConfig.hybridCodecMode && !streamConfig.disableHybrid) { // was: L, rB
    // Hybrid AV1+VP9 mode
    hybridFamilyIds = isHighResDrmManifest(manifest) // was: Oa7(m)
      ? (formatMap['1h'] || formatMap['9h'] ? ['1h', '9h'] : ['9', 'h'])
      : ['1', '9', 'h'];
    if (doLog) logCallback({ newhybpref: hybridFamilyIds.join('.') });
    for (const fid of hybridFamilyIds) {
      hybridVideoFormats = hybridVideoFormats.concat(formatMap[fid]).filter((f) => f);
    }
  } else if (streamConfig.hybridCodecRatio > 0 && vp9Formats && av1Formats) { // was: DQ
    hybridFamilyIds = [av1Family, vp9Family];
    hybridVideoFormats = av1Formats.concat(vp9Formats).filter((f) => f);
  }

  if (hybridVideoFormats.length && !streamConfig.disableHybrid) {
    sortFormats(hybridVideoFormats, hybridFamilyIds); // was: jQ
    if (doLog) {
      const itagList = [];
      for (const fmt of hybridVideoFormats) itagList.push(fmt.itag);
      logCallback({ hbdfmt: itagList.join('.') });
    }
    return createFormatSelection(new FormatSet(hybridVideoFormats, selectedAudio, webVttCaptions, muxedFormats));
  }

  // Single best video family
  const videoFamilyPreference = getVideoFamilyPreference(streamConfig); // was: ffd(c)
  let bestVideoFamily = findFirst(videoFamilyPreference, hasFamily); // was: g.Yx(G, K)

  if (!bestVideoFamily) {
    if (formatMap[av1Family]) {
      const sorted = formatMap[av1Family];
      sortFormats(sorted);
      return createFormatSelection(new FormatSet(sorted, selectedAudio, webVttCaptions, muxedFormats));
    }
    if (doLog) logCallback({ novideo: 1 });
    return noFormatsAvailable();
  }

  // Prefer VP9 over AV1 if VP9 reaches higher resolution
  if ((bestVideoFamily === '1' || bestVideoFamily === '1h') && formatMap[vp9Family]) {
    const av1MaxRes = getMaxQualityOrdinal(formatMap[bestVideoFamily]); // was: gk
    const vp9MaxRes = getMaxQualityOrdinal(formatMap[vp9Family]);
    if (vp9MaxRes > av1MaxRes) {
      bestVideoFamily = vp9Family;
    } else if (vp9MaxRes === av1MaxRes && hasVp9HdrFormats(formatMap[vp9Family])) { // was: v0R
      bestVideoFamily = vp9Family;
    }
  }

  // Prefer HEVC over VP9 if HEVC reaches higher resolution
  if (bestVideoFamily === '9' && formatMap.h) {
    if (getMaxQualityOrdinal(formatMap.h) > getMaxQualityOrdinal(formatMap['9'])) {
      bestVideoFamily = 'h';
    }
  }

  // Live AV1 enhanced -> HEVC fallback if AV1 caps at <1440
  if (streamConfig.preferHevcForLive && manifest.isLive && bestVideoFamily === '(' && formatMap.H) { // was: Re
    if (getMaxQualityOrdinal(formatMap['(']) < 1440) bestVideoFamily = 'H';
  }

  if (doLog) logCallback({ vfmly: prettyFamilyName(bestVideoFamily) }); // was: Om(G)

  const videoFormats = formatMap[bestVideoFamily];
  if (!videoFormats.length) {
    if (doLog) logCallback({ novfmly: prettyFamilyName(bestVideoFamily) });
    return noFormatsAvailable();
  }

  sortFormats(videoFormats);
  return createFormatSelection(new FormatSet(videoFormats, selectedAudio, webVttCaptions, muxedFormats));
}

// ===========================================================================
// Format selection with preferred-format hint (lines 29294-29328)
// ===========================================================================

/**
 * Selects formats with an optional "preferred format" hint — if the hint
 * points to a valid muxed pairing, that pairing is returned directly;
 * otherwise delegates to the standard `selectBestFormats`.
 * [was: Gi_]
 *
 * @param {object}   formatState    [was: Q]
 * @param {object}   streamConfig   [was: c]
 * @param {object}   capabilities   [was: W]
 * @param {object}   manifest       [was: m]
 * @param {object}   [drmInfo]      [was: K]
 * @param {Function} logCallback    [was: T]
 * @param {string[]} [preferredFmtIds] [was: r]
 * @param {boolean}  [rebuildStreamSizes=false] [was: U]
 * @returns {FormatSelection|null}
 */
export function selectFormatsWithHint(formatState, streamConfig, capabilities, manifest, drmInfo, logCallback, preferredFmtIds, rebuildStreamSizes = false) { // was: Gi_
  if (streamConfig.supportsPreferredFormats && preferredFmtIds && preferredFmtIds.length > 1 && // was: d3
      !(streamConfig.hybridCodecRatio > 0 || streamConfig.hybridCodecMode)) { // was: DQ, L
    const doLog = streamConfig.enableDebugLogging || !!drmInfo;
    const webVttCaptions = doLog && streamConfig.supportsWebVttCaptions ? logCallback : undefined;
    const grouped = groupFormatsByFamily(streamConfig, manifest); // was: ia0
    const videoFormats = [];
    const audioFormats = [];
    const dedupCache = {};

    for (let i = 0; i < preferredFmtIds.length; i++) {
      const fmtId = preferredFmtIds[i];
      const entry = manifest.decoderStates.get(fmtId); // was: m.A.get(I)
      if (!entry?.info) continue;
      const info = entry.info;
      const familyId = info.familyId; // was: mI

      if (!checkFormatPlayability(streamConfig, info, capabilities, manifest.isLive)) { // was: Lc
        if (doLog) logCallback({ opfu: fmtId });
        continue;
      }

      const bucket = info.hasVideo() ? videoFormats : audioFormats; // was: MK()
      const familyFormats = grouped[familyId];
      for (const fmt of familyFormats) {
        const dedupKey = buildFormatDedupKey(familyId, fmt, streamConfig);
        if (dedupCache.hasOwnProperty(dedupKey)) {
          if (dedupCache[dedupKey] === true) bucket.push(fmt);
        } else if (checkFormatPlayability(streamConfig, fmt, capabilities, manifest.isLive)) {
          bucket.push(fmt);
          dedupCache[dedupKey] = true;
        }
      }
    }

    if (videoFormats.length && audioFormats.length) {
      if (doLog) logCallback({ opfm: videoFormats[0].itag + ',' + audioFormats[0].itag });
      return createFormatSelection(new FormatSet(videoFormats, audioFormats, webVttCaptions));
    }
  }

  return selectBestFormats(formatState, streamConfig, capabilities, manifest, drmInfo, logCallback, rebuildStreamSizes);
}

// ===========================================================================
// Format debug / tracking helpers (lines 29330-29498)
// ===========================================================================

/**
 * Returns a dot-separated debug string of stream-size entries.
 * [was: bH]
 *
 * @param {object} formatState [was: Q]
 * @returns {string}
 */
export function dumpStreamSizes(formatState) { // was: bH
  const parts = [];
  for (const [key, entry] of formatState.streamSizes.entries()) {
    parts.push(`${key}_${entry.maxWidth}_${entry.maxHeight}`);
  }
  return parts.join('.');
}

/**
 * Updates the stream-size tracking map with a new format's dimensions.
 * [was: g0K]
 *
 * @param {object} formatState [was: Q]
 * @param {string} familyId    [was: c]
 * @param {object} fmt         [was: W] — format info
 */
export function updateStreamSize(formatState, familyId, fmt) { // was: g0K
  const fps = fmt.video?.fps || 0;
  const sizeKey = `${familyId}_${fps}`;
  const isMuxed = !!fmt.audio; // was: T
  const existing = formatState.streamSizes.get(sizeKey);
  const hasMuxedAudio = !!fmt.audio;

  if (existing && (!hasMuxedAudio && fmt.video?.height && existing.maxHeight && existing.maxHeight >= fmt.video?.height)) {
    return;
  }

  const entry = existing || {
    itag: fmt.itag,
    familyId, // was: mI
    isMuxed: isMuxed, // was: Dg
  };

  if (isMuxed) {
    entry.numChannels = fmt.audio.numChannels;
  } else {
    const video = fmt.video;
    entry.maxWidth = video?.width;
    entry.maxHeight = video?.height;
    entry.maxFramerate = fps;
    entry.maxBitrateBps = fmt.averageBitrate * 8; // was: w3 * 8
    entry.isHdr = video?.isHdr(); // was: Z6
  }

  formatState.streamSizes.set(sizeKey, entry);
}

/**
 * Detects whether spatial audio families are present in the format map.
 * [was: svx]
 *
 * @param {object} formatMap    [was: Q]
 * @param {object} streamConfig [was: c]
 * @returns {boolean}
 */
export function detectSpatialAudio(formatMap, streamConfig) { // was: svx
  const hasFoa = !(!formatMap.m && !formatMap.M); // first-order ambisonics
  const hasAc3 = !(!formatMap.mac3 && !formatMap.MAC3);
  const hasEac3 = !(!formatMap.meac3 && !formatMap.MEAC3);
  const hasIamf = !(!formatMap.i && !formatMap.I);
  streamConfig.hasIamf = hasIamf; // was: nO
  return hasFoa || hasAc3 || hasEac3 || hasIamf;
}

/**
 * Returns whether any format in the array has a VP9 HDR itag.
 * [was: v0R]
 *
 * @param {object[]} formats [was: Q]
 * @returns {boolean}
 */
export function hasVp9HdrFormats(formats) { // was: v0R
  for (const fmt of formats) {
    if (fmt.itag && VP9_HDR_ITAGS.has(fmt.itag)) return true; // was: $E7
  }
  return false;
}

/**
 * Returns whether any audio format has AUDIO_QUALITY_HIGH.
 * [was: L9w]
 *
 * @param {object[]} formats [was: Q]
 * @returns {boolean}
 */
export function hasHighQualityAudio(formats) { // was: L9w
  for (const fmt of formats) {
    if (fmt.audio.audioQuality === 'AUDIO_QUALITY_HIGH') return true;
  }
  return false;
}

/**
 * Pretty-prints a media-family ID (replaces internal symbols with names).
 * [was: Om]
 *
 * @param {string} familyId [was: Q]
 * @returns {string}
 */
export function prettyFamilyName(familyId) { // was: Om
  switch (familyId) {
    case '*': return 'v8e';
    case '(': return 'v9e';
    case '(h': return 'v9he';
    default:   return familyId;
  }
}

/**
 * Builds a dedup key for a format (family + fps + audio VBR + video CABR).
 * [was: yZK]
 *
 * @param {string} familyId    [was: Q]
 * @param {object} fmt         [was: c]
 * @param {object} streamConfig [was: W]
 * @returns {string}
 */
export function buildFormatDedupKey(familyId, fmt, streamConfig) { // was: yZK
  return streamConfig.enableMultiTrackVideoCABR // was: T2
    ? `${familyId}_${Number(fmt.video?.fps || 0)}_${!!fmt.audio?.isVariableBitrate}_${!!fmt.video?.isCABR}` // was: O, j
    : `${familyId}_${Number(fmt.video?.fps || 0)}_${!!fmt.audio?.isVariableBitrate}`;
}

/**
 * Returns a dot-separated debug dump of the format map.
 * [was: dk]
 *
 * @param {object} formatMap [was: Q]
 * @returns {string}
 */
export function dumpFormatMap(formatMap) { // was: dk
  const parts = [];
  for (const familyId in formatMap) {
    if (!formatMap.hasOwnProperty(familyId)) continue;
    parts.push(prettyFamilyName(familyId));
    for (const fmt of formatMap[familyId]) parts.push(fmt.itag);
  }
  return parts.join('.');
}

// ===========================================================================
// Encrypted-format filter (lines 29414-29450)
// ===========================================================================

/**
 * Filters a format map to only formats that are playable under the active
 * DRM system.  Rejects formats that lack content protection, that use
 * unsupported codecs in encrypted mode, or that the DRM system cannot
 * handle.
 * [was: E0K]
 *
 * @param {object}   capabilities   [was: Q]
 * @param {object}   formatMap      [was: c]
 * @param {object}   [drmInfo]      [was: W]
 * @param {boolean}  doLog          [was: m]
 * @param {Function} logCallback    [was: K]
 * @param {object}   streamConfig   [was: T]
 * @returns {object} Filtered format map
 */
export function filterEncryptedFormats(capabilities, formatMap, drmInfo, doLog, logCallback, streamConfig) { // was: E0K
  const filtered = {};
  const rejected = {};

  forEachEntry(formatMap, (formats, familyId) => { // was: g.ZS
    formats = formats.filter((fmt) => {
      const itag = fmt.itag;

      if (!fmt.contentProtection) {
        rejected[itag] = 'noenc';
        return false;
      }

      // Live HDR blocked for certain configs
      if (streamConfig.allowClearHdr && fmt.familyId === '(h' && streamConfig.supportsHfrHdr) { // was: WB, b0
        rejected[itag] = 'lichdr';
        return false;
      }

      // AV1 encrypted requires decoder support
      if (!capabilities.supportsAv1Encrypted && fmt.familyId === '1e') { // was: j
        rejected[itag] = 'noav1enc';
        return false;
      }

      // VP9/VP9-HDR encrypted
      if (fmt.familyId === '(' || fmt.familyId === '(h') {
        if (capabilities.supportsVp9Encrypted && drmInfo?.flavor === 'widevine') { // was: O
          const experimentalMime = fmt.mimeType + '; experimental=allowed';
          const supported = !!fmt.contentProtection[drmInfo.flavor] && !!drmInfo.supportedMimeTypes[experimentalMime]; // was: W.O[V]
          if (!supported) rejected[itag] = fmt.contentProtection[drmInfo.flavor] ? 'unspt' : 'noflv';
          return supported;
        }
        if (!hasCapability(capabilities, CAPABILITY_CRYPTOBLOCKFORMAT) && !capabilities.enableMultiTrackVideoCABR || capabilities.disableVp9Encrypted) { // was: fc, $i, S
          rejected[itag] = capabilities.disableVp9Encrypted ? 'disvp' : 'vpsub';
          return false;
        }
      }

      // General DRM check
      if (drmInfo && fmt.contentProtection[drmInfo.flavor] && drmInfo.supportedMimeTypes[fmt.mimeType]) {
        return true;
      }
      rejected[itag] = drmInfo
        ? (fmt.contentProtection[drmInfo.flavor] ? 'unspt' : 'noflv')
        : 'nosys';
      return false;
    });

    if (formats.length) filtered[familyId] = formats;
  });

  if (doLog && Object.entries(rejected).length) {
    logCallback({ rjr: serializeRejections(rejected) });
  }
  return filtered;
}

// ===========================================================================
// Quality / HFR filters (lines 29452-29498)
// ===========================================================================

/**
 * Filters out formats whose resolution exceeds the max-quality cap.
 * [was: SEO]
 *
 * @param {object}   streamConfig [was: Q]
 * @param {object[]} formats      [was: c]
 * @param {object}   rejected     [was: W] — rejection reason map
 * @returns {object[]}
 */
export function filterByMaxQuality(streamConfig, formats, rejected) { // was: SEO
  return formats.filter((fmt) => {
    if (fmt.video.qualityOrdinal <= streamConfig.maxQualityOrdinal) return true; // was: MQ
    rejected[fmt.itag] = 'maxquality';
    return false;
  });
}

/**
 * Filters out non-HFR formats whose resolution exceeds the lowest HFR
 * resolution, and blocks itag 299 on PS3.
 * [was: F9d]
 *
 * @param {object[]} formats  [was: Q]
 * @param {object}   rejected [was: c]
 * @returns {object[]}
 */
export function filterHfrResolutionPrecedence(formats, rejected) { // was: F9d
  const minHfrWidth = formats.reduce(
    (min, fmt) => fmt.video.isHighFrameRate() ? Math.min(min, fmt.video.width) : min, // was: O()
    Infinity,
  );

  if (minHfrWidth < Infinity) {
    formats = formats.filter((fmt) => {
      if (fmt.video.isHighFrameRate() || fmt.video.width < minHfrWidth) return true;
      rejected[fmt.itag] = 'hfrfirst';
      return false;
    });
  }

  if (isPs3Platform()) { // was: S$()
    formats = formats.filter((fmt) => {
      if (fmt.itag !== '299') return true;
      rejected[fmt.itag] = 'ps3hfr1080';
      return false;
    });
  }

  return formats;
}

/**
 * Groups all formats in the manifest by their media-family ID, sorted
 * by quality, filtering out formats below the min-quality threshold.
 * [was: ia0]
 *
 * @param {object} streamConfig [was: Q]
 * @param {object} manifest     [was: c]
 * @param {object} [rejected]   [was: W]
 * @returns {Record<string, object[]>}
 */
export function groupFormatsByFamily(streamConfig, manifest, rejected) { // was: ia0
  const grouped = {};
  for (const key in manifest.formats) { // was: c.W
    if (!manifest.formats.hasOwnProperty(key)) continue;
    const info = manifest.formats[key].info;
    if (streamConfig.minQualityOrdinal && info.video && info.video.qualityOrdinal < streamConfig.minQualityOrdinal) { // was: J
      if (rejected) rejected[info.itag] = `min${streamConfig.minQualityOrdinal}`;
      continue;
    }
    const familyId = info.familyId; // was: mI
    grouped[familyId] = grouped[familyId] || [];
    grouped[familyId].push(info);
  }
  for (const familyId of Object.keys(grouped)) {
    sortFormats(grouped[familyId]); // was: jQ
  }
  return grouped;
}

/**
 * Returns the maximum quality ordinal across an array of formats.
 * [was: gk]
 *
 * @param {object[]} formats [was: Q]
 * @returns {number}
 */
export function getMaxQualityOrdinal(formats) { // was: gk
  return formats.reduce((max, fmt) => Math.max(max, fmt.video.qualityOrdinal), 0); // was: C7
}

// ===========================================================================
// Format playability gate (lines 29504-29555)
// ===========================================================================

/**
 * The comprehensive "is this format allowed?" gate.  Returns `true` if
 * the format is playable, or a string rejection reason otherwise.
 * [was: Lc]
 *
 * @param {object}  streamConfig [was: Q]
 * @param {object}  fmt          [was: c] — format info
 * @param {object}  capabilities [was: W]
 * @param {boolean} [isLive=false] [was: m]
 * @param {Set}     [usedDecoders=new Set()] [was: K]
 * @returns {true|string}
 */
export function checkFormatPlayability(streamConfig, fmt, capabilities, isLive = false, usedDecoders = new Set()) { // was: Lc
  if (fmt.familyId === '') return 'unkn';
  if ((fmt.itag === '304' || fmt.itag === '266') && streamConfig.disableVp9Encrypted) return 'blk2khfr'; // was: S
  if (streamConfig.maxResolution && fmt.video && fmt.video.qualityOrdinal > streamConfig.maxResolution) return `max${streamConfig.maxResolution}`; // was: D
  if (streamConfig.blockHighH264 && fmt.familyId === 'h' && fmt.video && fmt.video.qualityOrdinal > 1080) return 'blkhigh264'; // was: La
  if (fmt.familyId === '(h' && !capabilities.supportsHdr) return 'enchdr'; // was: D
  if (isLive && isLevel51(fmt) && !streamConfig.allowLevel51Live) return 'blk51live'; // was: I8n, PA
  if ((fmt.familyId === 'MAC3' || fmt.familyId === 'mac3') && !streamConfig.supportsAc3) return 'blkac3'; // was: j
  if ((fmt.familyId === 'MEAC3' || fmt.familyId === 'meac3') && !streamConfig.supportsEac3) return 'blkeac3'; // was: K
  if (fmt.familyId === 'M' || fmt.familyId === 'm') return 'blkaac51';
  if ((fmt.familyId === 'so' || fmt.familyId === 'sa') && !streamConfig.supportsAmbisonic) return 'blkamb'; // was: mF
  if (!streamConfig.allowClearHdr && isClearHdr(fmt) && (!capabilities.supportsAv1Encrypted || fmt.familyId !== '1e')) return 'cbc'; // was: WB, UVW
  if (!capabilities.supportsAv1Encrypted && isClearHdr(fmt) && fmt.familyId === '1e') return 'cbcav1';
  if ((fmt.familyId === 'i' || fmt.familyId === 'I') && !streamConfig.supportsIamf) return 'blkiamf'; // was: iX
  if (streamConfig.blockVariableBitrateAudio && fmt.audio?.isVariableBitrate === true) return 'blkvbcabr'; // was: Fw, O
  if (streamConfig.enableMultiTrackVideoCABR && fmt.video?.isCABR === false) return 'blkmtvcabr'; // was: T2, j
  if (streamConfig.av1MaxResolution &&
      (fmt.familyId === '1' || fmt.familyId === '1h' || (capabilities.supportsAv1Encrypted && fmt.familyId === '1e')) &&
      fmt.video?.qualityOrdinal > streamConfig.av1MaxResolution) return 'av1cap'; // was: HA

  // Decoder error backoff
  const decoderState = capabilities.decoderStates.get(fmt.familyId);
  if (!streamConfig.ignoreDecoderErrors && decoderState && decoderState.errorCount > 0) { // was: EC, gV
    usedDecoders.add(fmt.familyId);
    return 'byerr';
  }

  // HFR checks
  if (fmt.video?.isHighFrameRate()) { // was: O()
    if (!capabilities.supportsHfrHdr && !hasCapability(capabilities, CAPABILITY_FRAMERATE)) return 'capHfr'; // was: b0, fc, $i.FRAMERATE
    if (streamConfig.block8kHfr && fmt.video.qualityOrdinal >= 4320) return 'blk8khfr'; // was: JJ
    if (fmt.isDrmProtected() && streamConfig.disableVp9Hfr && fmt.contentProtection && fmt.video.qualityOrdinal >= 1440) return 'disablevp9hfr'; // was: j(), QE
  }

  // Bitrate cap
  if (streamConfig.maxBitrate && fmt.averageBitrate > streamConfig.maxBitrate) return 'ratecap'; // was: w3
  // Max video height cap for muxed
  if (streamConfig.maxMuxedVideoHeight > 0 && fmt.hasVideo() && fmt.video.height > streamConfig.maxMuxedVideoHeight) return 'mvhcap'; // was: Ie, MK()

  // Platform-specific playability
  const platformResult = checkPlatformPlayability(capabilities, fmt); // was: P5w
  return platformResult !== true ? platformResult : true;
}

// ===========================================================================
// Format sorting (lines 29557-29570)
// ===========================================================================

/**
 * Sorts formats in ascending order by resolution then bitrate.
 * When a family-ID priority list is provided, ties are broken by
 * family preference.
 * [was: jQ]
 *
 * @param {object[]} formats       [was: Q]
 * @param {string[]} [familyOrder=[]] [was: c]
 */
export function sortFormats(formats, familyOrder = []) { // was: jQ
  formats.sort((a, b) => { // was: g.iD
    const bitrateDiff = b.averageBitrate - a.averageBitrate; // was: w3
    if (!a.hasVideo() || !b.hasVideo()) return bitrateDiff; // was: MK()

    let resolutionDiff = b.video.height * b.video.width - a.video.height * a.video.width;
    if (!resolutionDiff && familyOrder.length > 0) {
      const aIdx = familyOrder.indexOf(a.familyId) + 1;
      const bIdx = familyOrder.indexOf(b.familyId) + 1;
      resolutionDiff = (aIdx === 0 || bIdx === 0) ? bIdx || -1 : aIdx - bIdx;
    }
    return resolutionDiff || bitrateDiff;
  });
}

// ===========================================================================
// Segment trim + MP4 box readers (lines 29572-29949)
// ===========================================================================

/**
 * Trims segments from the head of a segment list whose end time is before
 * the given threshold.
 * [was: lfx]
 *
 * @param {object} segmentList [was: Q]
 * @param {number} threshold   [was: c] — cutoff time
 */
export function trimSegmentsBefore(segmentList, threshold) { // was: lfx
  if (threshold > segmentList.lastEndTime()) { // was: nX()
    segmentList.segments = [];
  } else {
    const idx = binarySearch(segmentList.segments, (seg) => seg.endTime >= threshold, segmentList); // was: kx
    if (idx > 0) segmentList.segments.splice(0, idx);
  }
}

/**
 * Reads a uint8 from a box at the current read offset.
 * [was: v2]
 *
 * @param {object} box [was: Q]
 * @returns {number}
 */
export function readUint8(box) { // was: v2
  const value = box.data.getUint8(box.offset + box.readOffset); // was: Q.W
  box.readOffset += 1;
  return value;
}

/**
 * Reads a uint16 (big-endian) from a box.
 * [was: al]
 *
 * @param {object} box [was: Q]
 * @returns {number}
 */
export function readUint16(box) { // was: al
  const value = box.data.getUint16(box.offset + box.readOffset);
  box.readOffset += 2;
  return value;
}

/**
 * Reads a signed int32 (big-endian) from a box.
 * [was: Gg]
 *
 * @param {object} box [was: Q]
 * @returns {number}
 */
export function readInt32(box) { // was: Gg
  const value = box.data.getInt32(box.offset + box.readOffset);
  box.readOffset += 4;
  return value;
}

/**
 * Reads an unsigned uint32 (big-endian) from a box.
 * [was: $D]
 *
 * @param {object} box [was: Q]
 * @returns {number}
 */
export function readUint32(box) { // was: $D
  const value = box.data.getUint32(box.offset + box.readOffset);
  box.readOffset += 4;
  return value;
}

/**
 * Reads a uint64 (big-endian) from a box as a JS number.
 * [was: P2]
 *
 * @param {object} box [was: Q]
 * @returns {number}
 */
export function readUint64(box) { // was: P2
  const parseByteRange = box.data;
  const pos = box.offset + box.readOffset;
  const value = parseByteRange.getUint32(pos) * 4294967296 + parseByteRange.getUint32(pos + 4);
  box.readOffset += 8;
  return value;
}

/**
 * Reads a null-terminated (or until-end) string from a box.
 * [was: lH]
 *
 * @param {object} box          [was: Q]
 * @param {number} [terminator=NaN] [was: c] — byte value to stop at
 * @returns {string}
 */
export function readString(box, terminator = NaN) { // was: lH
  let end;
  if (isNaN(terminator)) {
    end = box.size;
  } else {
    for (end = box.readOffset; end < box.size && box.data.getUint8(box.offset + end) !== terminator; ) {
      ++end;
    }
  }
  const bytes = new Uint8Array(box.data.buffer, box.offset + box.readOffset + box.data.byteOffset, end - box.readOffset);
  box.readOffset = Math.min(end + 1, box.size);
  return decodeUtf8(bytes); // was: Ko(c)
}

/**
 * Returns the raw bytes of a box as a Uint8Array.
 * [was: uYw]
 *
 * @param {object} box [was: Q]
 * @returns {Uint8Array}
 */
export function getBoxBytes(box) { // was: uYw
  return new Uint8Array(box.data.buffer, box.offset + box.data.byteOffset, box.size);
}

/**
 * Copies bytes from a source DataView into a box-writer.
 * [was: uH]
 *
 * @param {object}   writer     [was: Q] — { data, offset }
 * @param {DataView} source     [was: c]
 * @param {number}   srcOffset  [was: W]
 * @param {number}   length     [was: m]
 */
export function writeBytes(writer, source, srcOffset, length) { // was: uH
  (new Uint8Array(writer.data.buffer, writer.offset, length))
    .set(new Uint8Array(source.buffer, srcOffset + source.byteOffset, length));
  writer.offset += length;
}

/**
 * Reads a single byte from an emsg data object by key index.
 * [was: hR]
 *
 * @param {object} emsg [was: Q]
 * @param {number} key  [was: c]
 * @returns {number}
 */
export function readEmsgByte(emsg, key) { // was: hR
  return Number(emsg.data[key]) || 0;
}

/**
 * Parses a cuepoint from an emsg metadata object.
 * [was: zXK]
 *
 * @param {object} emsg [was: Q]
 * @returns {CuepointInfo|null}
 */
export function parseCuepoint(emsg) { // was: zXK
  if (!emsg.data['Cuepoint-Type']) return null;
  return new CuepointInfo(
    -(Number(emsg.data['Cuepoint-Playhead-Time-Sec']) || 0),
    Number(emsg.data['Cuepoint-Total-Duration-Sec']) || 0,
    emsg.data['Cuepoint-Context'],
    emsg.data['Cuepoint-Identifier'] || '',
    CUEPOINT_EVENT_MAP[emsg.data['Cuepoint-Event'] || ''] || 'unknown', // was: hXO
    (Number(emsg.data['Cuepoint-Playhead-Time-Sec']) || 0) * 1000,
  );
}

/**
 * Reads the start media time (in seconds) from emsg data.
 * [was: C50]
 *
 * @param {object} emsg [was: Q]
 * @returns {number}
 */
export function getStartMediaTimeSec(emsg) { // was: C50
  return Number(emsg.data['Start-Media-Time-Us']) / 1e6 || 0;
}

/**
 * Returns the serialized DAI state from an emsg.
 * [was: g.MGm]
 *
 * @param {object} emsg [was: Q]
 * @returns {string}
 */
export function getSerializedState(emsg) { // was: g.MGm
  return emsg.data['Serialized-State'] ? emsg.data['Serialized-State'] : '';
}

/**
 * Returns the ad-break-finished status from an emsg.
 * [was: g.JZ0]
 *
 * @param {object} emsg [was: Q]
 * @returns {number} 0=unknown, 1=true, 2=false
 */
export function getAdBreakFinished(emsg) { // was: g.JZ0
  switch (emsg.data['Is-Ad-Break-Finished']) {
    case 'true':  return 1;
    case 'false': return 2;
    default:      return 0;
  }
}

/**
 * Parses HTTP-style headers from a string (CRLF-separated "Key: Value").
 * [was: Cc]
 *
 * @param {string} headerStr [was: Q]
 * @returns {Record<string, string>|null}
 */
export function parseHeaders(headerStr) { // was: Cc
  const headers = {};
  const lines = headerStr.split('\r\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length === 0) return headers;
    const match = lines[i].match(/([^:]+):\s+([\S\s]+)/);
    if (match != null) headers[match[1]] = match[2];
  }
  return null;
}

/**
 * Finds the first child box of a given type within a parent range.
 * Descends into container boxes.
 * [was: Rl]
 *
 * @param {DataView} data   [was: Q]
 * @param {number}   offset [was: c]
 * @param {number}   type   [was: W] — 4-byte box type as uint32
 * @returns {object|null}
 */
export function findChildBox(data, offset, type) { // was: Rl
  while (isValidBox(data, offset)) { // was: Ma
    const box = parseBox(data, offset); // was: JR
    if (box.type === type) return box;
    offset += box.size;
  }
  return null;
}

/**
 * Finds a box at the top level, skipping into container boxes.
 * [was: g.YD]
 *
 * @param {DataView} data   [was: Q]
 * @param {number}   offset [was: c]
 * @param {number}   type   [was: W]
 * @returns {object|null}
 */
export function findBox(data, offset, type) { // was: g.YD
  while (isValidBox(data, offset)) {
    const box = parseBox(data, offset);
    if (box.type === type) return box;
    offset = isContainerBox(box.type) ? offset + 8 : offset + box.size; // was: kD
  }
  return null;
}

/**
 * Rewrites sample durations in trun/tfhd boxes to apply a playback-rate
 * scale factor.
 * [was: RX0]
 *
 * @param {DataView} data        [was: Q]
 * @param {number}   scaleFactor [was: c]
 */
export function rewriteTimestamps(data, scaleFactor) { // was: RX0
  const tfhdBox = findBox(data, 0, 0x74666864); // 'tfhd' = 1952868452
  const trunBox = findBox(data, 0, 0x7472756E); // 'trun' = 1953658222
  if (!tfhdBox || !trunBox) return;
  if (data.getUint32(tfhdBox.offset + 12) >= 2) return;

  // tfhd: default sample duration
  tfhdBox.skip(1);
  let flags = readUint8(tfhdBox) << 16 | readUint16(tfhdBox);
  tfhdBox.skip(4);
  if (flags & 1) tfhdBox.skip(8);
  if (flags & 2) tfhdBox.skip(4);
  if (flags & 8) {
    const pos = tfhdBox.readOffset;
    const duration = readUint32(tfhdBox);
    tfhdBox.data.setUint32(
      tfhdBox.offset + pos,
      scaleFactor > 1 ? Math.ceil(duration * scaleFactor) : Math.floor(duration * scaleFactor),
    );
  }

  // trun: per-sample durations
  trunBox.skip(1);
  flags = readUint8(trunBox) << 16 | readUint16(trunBox);
  if (flags & 256) {
    const hasDuration = flags & 1;
    const hasSize = flags & 4;
    const hasFlags = flags & 512;
    const hasCto = flags & 1024;
    const hasSct = flags & 2048;
    const sampleCount = readUint32(trunBox);
    if (hasDuration) trunBox.skip(4);
    if (hasSize) trunBox.skip(4);
    const skipPerSample = (hasFlags ? 4 : 0) + (hasCto ? 4 : 0) + (hasSct ? 4 : 0);
    for (let i = 0; i < sampleCount; i++) {
      const pos = trunBox.readOffset;
      const dur = readUint32(trunBox);
      trunBox.data.setUint32(
        trunBox.offset + pos,
        scaleFactor > 1 ? Math.ceil(dur * scaleFactor) : Math.floor(dur * scaleFactor),
      );
      trunBox.skip(skipPerSample);
    }
  }
}

/**
 * Checks whether there is a valid MP4 box at the given offset.
 * [was: Ma]
 *
 * @param {DataView} data   [was: Q]
 * @param {number}   offset [was: c]
 * @returns {boolean}
 */
export function isValidBox(data, offset) { // was: Ma
  if (data.byteLength - offset < 8) return false;
  const size = data.getUint32(offset);
  if (size < 8 || data.byteLength - offset < size) return false;
  for (let i = 4; i < 8; i++) {
    const ch = data.getInt8(offset + i);
    if (ch < 48 || ch > 122) return false;
  }
  return true;
}

/**
 * Parses a box header (size + type) at the given offset.
 * [was: JR]
 *
 * @param {DataView} data   [was: Q]
 * @param {number}   offset [was: c]
 * @returns {Mp4Box}
 */
export function parseBox(data, offset) { // was: JR
  const size = data.getUint32(offset);
  const type = data.getUint32(offset + 4);
  return new Mp4Box(data, offset, size, type); // was: kiO
}

/**
 * Reads the timescale from an mdhd box.
 * [was: g.pc]
 *
 * @param {object} mdhdBox [was: Q]
 * @returns {number}
 */
export function readMediaHeaderTimescale(mdhdBox) { // was: g.pc
  const version = mdhdBox.data.getUint8(mdhdBox.dataOffset);
  const fieldOffset = version ? 20 : 12;
  return mdhdBox.data.getUint32(mdhdBox.dataOffset + fieldOffset);
}

/**
 * Reads the timescale from an init segment (finds moov > mdhd).
 * [was: Q9]
 *
 * @param {Uint8Array} initSegment [was: Q]
 * @returns {number}
 */
export function readTimescaleFromInit(initSegment) { // was: Q9
  const parseByteRange = new DataView(initSegment.buffer, initSegment.byteOffset, initSegment.byteLength);
  const mdhdBox = findBox(parseByteRange, 0, 0x6D646864); // 'mdhd' = 1836476516
  return mdhdBox ? readMediaHeaderTimescale(mdhdBox) : NaN;
}

/**
 * Returns whether a box type is a container (needs descent rather than skip).
 * [was: kD]
 *
 * @param {number} type [was: Q]
 * @returns {boolean}
 */
export function isContainerBox(type) { // was: kD
  return type === 0x6D6F6F66 || // moof = 1836019558
    type === 0x6D6F6F76 ||       // moov = 1836019574
    type === 0x6D766578 ||       // mvex = 1835297121
    type === 0x6D696E66 ||       // minf = 1835626086
    type === 0x7374626C ||       // stbl = 1937007212
    type === 0x74726166 ||       // traf = 1953653094
    type === 0x7472616B ||       // trak = 1953653099
    type === 0x6D646961;         // mdia = 1836475768
}

/**
 * Reads the decode time from a tfdt box (fragment base media decode time).
 * [was: g.cd]
 *
 * @param {object} tfdtBox [was: Q]
 * @returns {number}
 */
export function readFragmentDecodeTime(tfdtBox) { // was: g.cd
  if (tfdtBox.data.getUint8(tfdtBox.dataOffset)) {
    // Version 1: 64-bit
    const parseByteRange = tfdtBox.data;
    const pos = tfdtBox.dataOffset + 4;
    return parseByteRange.getUint32(pos) * 4294967296 + parseByteRange.getUint32(pos + 4);
  }
  // Version 0: 32-bit
  return tfdtBox.data.getUint32(tfdtBox.dataOffset + 4);
}

/**
 * Parses a segment index (sidx) box.
 * [was: QHK]
 *
 * @param {object} sidxBox [was: Q]
 * @returns {object} { timescale, earliestPts, firstOffset, durations, sizes }
 */
export function parseSegmentIndex(sidxBox) { // was: QHK
  const copy = new Mp4Box(sidxBox.data, sidxBox.offset, sidxBox.size, sidxBox.type, sidxBox.extendedSize);
  const version = readUint8(copy);
  copy.skip(7);
  const timescale = readUint32(copy);
  let earliestPts, firstOffset;
  if (version === 0) {
    earliestPts = readUint32(copy);
    firstOffset = readUint32(copy);
  } else {
    earliestPts = readUint64(copy);
    firstOffset = readUint64(copy);
  }
  copy.skip(2);
  const entryCount = readUint16(copy);
  const durations = [];
  const sizes = [];
  for (let i = 0; i < entryCount; i++) {
    durations.push(readUint32(copy));
    sizes.push(readUint32(copy));
    copy.skip(4);
  }
  return {
    timescale,
    earliestPts, // was: eA
    firstOffset,  // was: kG
    durations,    // was: s0
    sizes,        // was: oP
  };
}

/**
 * Finds all top-level boxes of a given type.
 * [was: g.Wd]
 *
 * @param {DataView} data [was: Q]
 * @param {number}   type [was: c]
 * @returns {object[]}
 */
export function findAllBoxes(data, type) { // was: g.Wd
  let offset = 0;
  const results = [];
  while (isValidBox(data, offset)) {
    const box = parseBox(data, offset);
    if (box.type === type) results.push(box);
    offset = isContainerBox(box.type) ? offset + 8 : offset + box.size;
  }
  return results;
}

/**
 * Parses an emsg box into a structured event object.
 * [was: cK_]
 *
 * @param {object} emsgBox [was: Q]
 * @returns {object}
 */
export function parseEmsgBox(emsgBox) { // was: cK_
  emsgBox.skip(4);
  return {
    schemeIdUri: readString(emsgBox, 0), // was: F5
    value: readString(emsgBox, 0),
    timescale: readUint32(emsgBox),
    presentationTimeDelta: readUint32(emsgBox), // was: RWe
    eventDuration: readUint32(emsgBox),
    id: readUint32(emsgBox),
    messageData: readString(emsgBox), // was: Qc
    offset: emsgBox.offset,
  };
}

/**
 * Parses one or two emsg boxes from the top of a segment and returns
 * a merged metadata object.
 * [was: g.mQm]
 *
 * @param {DataView} data [was: Q]
 * @returns {EmsgMetadata|null}
 */
export function parseEmsgMetadata(data) { // was: g.mQm
  const firstEmsg = findChildBox(data, 0, 0x656D7367); // 'emsg' = 1701671783
  if (!firstEmsg) return null;
  let parsed = parseEmsgBox(firstEmsg);
  const schemeIdUri = parsed.schemeIdUri; // was: F5
  let headers = parseHeaders(parsed.messageData);

  // Check for a second emsg immediately after
  const secondEmsg = findChildBox(data, firstEmsg.offset + firstEmsg.size, 0x656D7367);
  if (secondEmsg) {
    const parsed2 = parseEmsgBox(secondEmsg);
    const headers2 = parseHeaders(parsed2.messageData);
    if (headers && headers2) {
      for (const key of Object.keys(headers2)) {
        headers[key] = headers2[key];
      }
    }
  }
  return headers ? new EmsgMetadata(headers, schemeIdUri) : null; // was: WU3
}

/**
 * Strips all occurrences of a box type by rewriting its FourCC to 'skip'.
 * [was: mC]
 *
 * @param {DataView} data    [was: Q]
 * @param {number}   boxType [was: c]
 */
export function stripBox(data, boxType) { // was: mC
  let box = findChildBox(data, 0, boxType);
  while (box) {
    box.type = 0x736B6970; // 'skip' = 1936419184
    box.data.setUint32(box.offset + 4, 0x736B6970);
    box = findChildBox(data, box.offset + box.size, boxType);
  }
}

/**
 * Rewrites an init segment to include encryption info from a second
 * init segment (merges stsd entries for multi-key DRM).
 * [was: TKO]
 *
 * @param {DataView}   originalInit [was: Q]
 * @param {Uint8Array} newInit      [was: c] — second init with encryption info
 * @returns {DataView|null}
 */
export function rewriteEncryptionInfo(originalInit, newInit) { // was: TKO
  const origStbl = findBox(originalInit, 0, 0x7374626C); // stbl = 1937011556
  const origStsd = findBox(originalInit, 0, 0x73747364); // stsd = 1953654136
  if (!origStbl || !origStsd || originalInit.getUint32(origStbl.offset + 12) >= 2) return null;

  const newDv = new DataView(newInit.buffer, newInit.byteOffset, newInit.length);
  const newStbl = findBox(newDv, 0, 0x7374626C);
  if (!newStbl) return null;

  const newEntrySize = newDv.getUint32(newStbl.dataOffset + 8);
  const codec = newDv.getUint32(newStbl.dataOffset + 12);
  if (codec !== 0x656E6361 && codec !== 0x656E6376) return null; // 'enca' / 'encv'

  // Build merged output
  const output = new BoxWriter(originalInit.byteLength + newEntrySize); // was: KUW
  writeBytes(output, originalInit, 0, origStbl.offset + 12);
  output.data.setInt32(output.offset, 2);
  output.offset += 4;
  writeBytes(output, originalInit, origStbl.offset + 16, origStbl.size - 16);
  writeBytes(output, newDv, newDv.byteOffset + newStbl.dataOffset + 8, newEntrySize);
  writeBytes(output, originalInit, origStbl.offset + origStbl.size, originalInit.byteLength - (origStbl.offset + origStbl.size));

  // Update container box sizes
  const containerTypes = [0x6D6F6F76, 0x7472616B, 0x6D646961, 0x6D696E66, 0x7374626C, 0x73746264]; // moov, trak, mdia, minf, stbl, stsd(ish)
  for (const ct of containerTypes) {
    const box = findBox(originalInit, 0, ct);
    output.data.setUint32(box.offset, box.size + newEntrySize);
  }

  const mergedStsd = findBox(output.data, 0, 0x73747364);
  output.data.setUint32(mergedStsd.offset + 16, 2);

  return output.data;
}

/**
 * Extracts the PSSH (Protection System Specific Header) box's key ID
 * from an init segment.
 * [was: o4m]
 *
 * @param {DataView} data [was: Q]
 * @returns {Uint8Array|null} 16-byte key ID, or null
 */
export function extractPsshKeyId(data) { // was: o4m
  const stbl = findBox(data, 0, 0x7374626C); // stbl
  if (!stbl) return null;
  const codec = data.getUint32(stbl.dataOffset + 12);
  if (codec !== 0x656E6361 && codec !== 0x656E6376) return null; // enca / encv

  const descOffset = stbl.offset + 24 + (codec === 0x656E6361 ? 28 : 78); // was: 1701733217
  const sinf = findChildBox(data, descOffset, 0x73696E66); // sinf = 1936289382
  if (!sinf) return null;

  const schm = findChildBox(data, sinf.offset + 8, 0x7363686D); // schm = 1935894637
  if (!schm || data.getUint32(schm.offset + 12) !== 0x63656E63) return null; // cenc = 1667392371

  const schi = findChildBox(data, sinf.offset + 8, 0x73636869); // schi = 1935894633
  if (!schi) return null;

  const tenc = findChildBox(data, schi.offset + 8, 0x74656E63); // tenc = 1952804451
  if (!tenc) return null;

  const keyId = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    keyId[i] = data.getInt8(tenc.offset + 16 + i);
  }
  return keyId;
}
