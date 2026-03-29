/**
 * segment-request.js -- Segment loading, request management, and response handling
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~37971-39999
 *
 * Handles:
 *  - ABR (Adaptive Bitrate) format selection state machine (oT, qt7, nYW, DZW)
 *  - Bandwidth estimation tracking per segment (m8, DZW)
 *  - Format switching based on buffer health and bandwidth (UZW, e77, rq3)
 *  - Server-format selection with SABR (VnX, iC0, yqR)
 *  - Media stream processing: slice parsing, init/index/media demuxing (Qm_, pc0, R7d)
 *  - DRM init-data extraction from PSSH boxes (OC_, fI7, WeR)
 *  - EBML (WebM) variable-length integer parsing (nE, vYn, aI3)
 *  - Offline media storage (Woffle): chunk writing, IDB persistence (sL7, L5m, wcW)
 *  - Buffer state tracking: ranges, health, pending bytes (Xo, El, fE)
 *  - Segment request lifecycle: creation, dispatch, completion, retry (We, bFn, V5K)
 *  - Request error handling and retry logic with exponential backoff
 *  - Track-level buffer management: seek, flush, rollback (tM, nb, vV)
 *  - Source-buffer append pipeline: init segments, media segments (qF, FxR)
 *  - Stats-for-nerds debug info assembly (uTy)
 *  - EMSG (Event Message Box) processing for live metadata
 *  - AV sync drift detection and correction (Tcy, o7K)
 *
 * @module media/segment-request
 */
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { SegmentResult } from './buffer-stats.js'; // was: TF
import { dumpFormatMap } from './format-setup.js'; // was: dk
import { handleBackgroundSuspend } from './quality-constraints.js'; // was: w3
import { cueAdVideo } from '../player/media-state.js'; // was: OH
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { publishExternalState } from '../player/playback-state.js'; // was: yw
import { supportsChangeType } from './codec-helpers.js'; // was: Yi
import { selectBestCodecPerQuality } from './buffer-stats.js'; // was: HCx
import { computeAutoHideVisible } from '../player/caption-manager.js'; // was: mI
import { positionMarkerOverlays } from '../ui/progress-bar-impl.js'; // was: UC
import { miniplayerIcon } from '../ui/svg-icons.js'; // was: D1
import { ReentrantChannel } from '../data/device-tail.js'; // was: tc
import { hasCapabilityFeature } from './codec-detection.js'; // was: fc
import { readByte } from '../data/collection-utils.js'; // was: Wl
import { EMPTY_EXTENSIONS } from '../proto/messages-core.js'; // was: KV
import { getUint8View } from '../data/collection-utils.js'; // was: Cp
import { trustedTypes } from '../proto/messages-core.js'; // was: Gy
import { NoOpLogger } from '../data/logger-init.js'; // was: WG
import { getRemainingInRange } from './codec-helpers.js'; // was: RR
import { estimateAv1Threshold } from './codec-detection.js'; // was: vr
import { findRangeIndex } from './codec-helpers.js'; // was: hm
import { OnLayoutSelfExitRequestedTrigger } from '../ads/ad-trigger-types.js'; // was: bh
import { getRangeEnd } from './codec-helpers.js'; // was: CM
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { LruRingBuffer } from './grpc-parser.js'; // was: dw
import { readVarintField } from '../proto/varint-decoder.js'; // was: xf
import { getTraceBackend } from '../data/gel-core.js'; // was: yp
import { nullToString } from '../core/composition-helpers.js'; // was: q4
import { sendFinalFlush } from '../core/event-system.js'; // was: qH
import { getRemoteModule } from '../player/caption-manager.js'; // was: w7
import { flushPendingGrafts } from '../ads/ad-async.js'; // was: Y7
import { bezierY } from '../core/bitstream-helpers.js'; // was: Oc
import { getElapsedPlayTime } from '../modules/remote/remote-player.js'; // was: L1
import { DashSegmentRequest } from './playback-controller.js'; // was: xU
import { coerceString } from '../core/composition-helpers.js'; // was: vn
import { loadVideoFromData } from '../player/media-state.js'; // was: sH
import { createProbeRequest } from './drm-segment.js'; // was: Led
import { accumulateBytes } from '../ads/ad-prebuffer.js'; // was: qm
import { createErrorResult } from '../core/misc-helpers.js'; // was: U1
import { callAw } from '../player/time-tracking.js'; // was: Aw()
import { readMessageField } from '../proto/varint-decoder.js'; // was: Hl
import { setSliderValue } from '../ui/progress-bar-impl.js'; // was: CI
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { cancelAndCleanupRequest } from './segment-loader.js'; // was: GF
import { fetchInitSegmentIfNeeded } from './drm-segment.js'; // was: J7
import { handleSegmentRedirect } from '../ads/dai-cue-range.js'; // was: jZ
import { LayoutRenderingAdapter } from '../ui/cue-manager.js'; // was: il
import { FROZEN_EMPTY_ARRAY } from '../proto/messages-core.js'; // was: jy
import { HEX_COLOR_VALIDATION_REGEX } from '../modules/caption/caption-data.js'; // was: Or
import { appendBuffer } from '../data/collection-utils.js'; // was: ug
import { sliceBuffer } from '../data/collection-utils.js'; // was: hr
import { shouldScheduleRequest } from './segment-loader.js'; // was: MJ
import { handleRequestResponse } from './segment-loader.js'; // was: k2
import { disableSsdai } from '../ads/ad-cue-delivery.js'; // was: pE
import { resetTrackState } from './buffer-stats.js'; // was: r4
import { RemoteConnection } from '../modules/remote/remote-player.js'; // was: xq
import { truncateVideoStreams } from '../ads/ad-async.js'; // was: vh7
import { routeSeek } from './mse-internals.js'; // was: yh
import { testUrlPattern } from '../ads/ad-scheduling.js'; // was: tI
import { lastElement, filter } from '../core/array-utils.js';
import { getCurrentTime } from '../player/time-tracking.js';
import { handleError } from '../player/context-updates.js';
import { dispose } from '../ads/dai-cue-range.js';

// ============================================================================
// ABR format selection state machine
// ============================================================================


// TODO: resolve g.H9
// TODO: resolve g.lj
// TODO: resolve g.v8

/**
 * Check whether the current ABR state matches a given quality constraint.
 * Returns true if the constraint is already satisfied (no switch needed).
 * [was: xZn]
 *
 * @param {Object} abrState  [was: Q]
 * @param {Object} constraint [was: c]
 * @returns {boolean}
 */
export function isAbrStateSatisfied(abrState, constraint) { // was: xZn
  return (
    abrState.W.equals(constraint) &&
    (!abrState.K.W || !abrState.W.isLocked() || abrState.nextVideo?.info.id === abrState.K.W)
  );
}

/**
 * Select the next video quality tier based on available bandwidth and buffer health.
 * [was: oT]
 *
 * @param {Object} abrState [was: Q]
 */
export function selectNextQuality(abrState) { // was: oT
  if (abrState.nextVideo && abrState.policy.j) return;

  if (abrState.W.isLocked()) {
    abrState.nextVideo =
      abrState.W.W <= 360
        ? abrState.k0.W[abrState.j[0].id]
        : abrState.k0.W[lastElement(abrState.j).id];
  } else {
    let idx = Math.min(abrState.L, abrState.j.length - 1); // was: c
    const bandwidth = eF(abrState.isSamsungSmartTV); // was: W
    const currentBr = estimateBitrate(abrState, abrState.O.info); // was: m

    // Find the lowest quality that fits the downshift threshold
    let downshiftLimit = bandwidth / abrState.policy.S - currentBr; // was: K
    while (idx > 0 && estimateBitrate(abrState, abrState.j[idx]) > downshiftLimit) {
      idx--;
    }

    // Find the highest quality that fits the upshift threshold
    let upshiftLimit = bandwidth / abrState.policy.Y - currentBr; // was: W (reused)
    while (idx < abrState.j.length - 1 && estimateBitrate(abrState, abrState.j[idx + 1]) <= upshiftLimit) {
      idx++;
    }

    abrState.nextVideo = abrState.k0.W[abrState.j[idx].id];
    abrState.L = idx;
  }
}

/**
 * Process a quality-constraint change event and decide whether to switch.
 * Returns a TF (track-format change) if a switch is warranted, null otherwise.
 * [was: qt7]
 *
 * @param {Object} abrState   [was: Q]
 * @param {Object} constraint [was: c]
 * @returns {TF|null}
 */
export function processQualityChange(abrState, constraint) { // was: qt7
  if (isAbrStateSatisfied(abrState, constraint)) return null;

  if (constraint.reason === 'm' && constraint.isLocked()) {
    KE(abrState, constraint);
    abrState.L = abrState.j.length - 1;
    WV(abrState);
    selectNextQuality(abrState);
    abrState.S = abrState.S || abrState.A !== abrState.nextVideo;
    abrState.A = abrState.nextVideo;
    return new SegmentResult(abrState.O, abrState.A, constraint.reason);
  }

  constraint.reason === 'r' && (abrState.Y = -1);
  KE(abrState, constraint);
  selectNextQuality(abrState);

  if (constraint.reason === 'r' && abrState.nextVideo === abrState.A) {
    return new SegmentResult(abrState.O, abrState.nextVideo, constraint.reason);
  }

  if (
    abrState.A &&
    abrState.nextVideo &&
    estimateBitrate(abrState, abrState.A.info) < estimateBitrate(abrState, abrState.nextVideo.info)
  ) {
    const reason = abrState.W.reason; // was: c (reused)
    abrState.mF = abrState.mF || reason === 'r' || reason === 'u' || reason === 'v';
  }
  return null;
}

/**
 * Handle a format update for a specific track.
 * [was: nYW]
 *
 * @param {Object} abrState [was: Q]
 * @param {Object} track    [was: c]
 * @returns {*} AqR result or null
 */
export function handleTrackFormatUpdate(abrState, track) { // was: nYW
  if (track.info.video) {
    if (abrState.A !== track) {
      abrState.A = track;
      return AqR(abrState);
    }
  } else {
    abrState.XI = abrState.J !== track;
    abrState.J = track;
  }
  return null;
}

// ============================================================================
// Bandwidth estimation
// ============================================================================

/**
 * Estimate the bitrate cost for a given format info, with caching per format ID.
 * Accounts for index-based byte rate, PM (average bitrate), and codec overhead.
 * [was: m8]
 *
 * @param {Object} abrState  [was: Q]
 * @param {Object} formatInfo [was: c]
 * @returns {number} estimated bytes/sec
 */
export function estimateBitrate(abrState, formatInfo) { // was: m8
  if (!abrState.MM[formatInfo.id]) {
    let indexRate = abrState.k0.W[formatInfo.id].index.dumpFormatMap(abrState.T2, 15); // was: W
    indexRate =
      formatInfo.PM && abrState.A && abrState.A.index.isLoaded()
        ? indexRate || formatInfo.PM
        : indexRate || formatInfo.handleBackgroundSuspend;
    abrState.MM[formatInfo.id] = indexRate;
  }

  let rate = abrState.MM[formatInfo.id]; // was: W (reused)
  abrState.UH.has(formatInfo.itag) && (rate *= 1.5);
  return (rate *= Math.max(1, abrState.JJ.Bj() || 0));
}

/**
 * Record the observed bitrate for a completed segment download.
 * [was: DZW]
 *
 * @param {Object} abrState   [was: Q]
 * @param {Object} sliceInfo  [was: c]
 */
export function recordSegmentBitrate(abrState, sliceInfo) { // was: DZW
  if (sliceInfo.cueAdVideo.info.video && sliceInfo.A) {
    const observedRate = (sliceInfo.W + sliceInfo.O) / sliceInfo.duration; // was: W
    const maxBitrate = sliceInfo.cueAdVideo.info.handleBackgroundSuspend; // was: m
    if (observedRate && maxBitrate) {
      abrState.JJ.ER(1, observedRate / maxBitrate);
      abrState.policy.A &&
        observedRate / maxBitrate > 1.5 &&
        abrState.loader.RetryTimer('overshoot', {
          sq: sliceInfo.DF,
          br: observedRate,
          max: maxBitrate,
        });
    }
  }
}

// ============================================================================
// Codec / format preference filtering
// ============================================================================

/**
 * Filter formats by codec efficiency preferences (hardware decode, power-efficient).
 * [was: UZW]
 *
 * @param {Object} abrState [was: Q]
 * @param {Array}  formats  [was: c]
 * @param {Object} state    [was: W]
 * @returns {Array}
 */
export function filterByCodecPreference(abrState, formats, state) { // was: UZW
  const isManualOrSeek = state.reason === 'm' || state.reason === 's'; // was: m

  abrState.policy.publishExternalState &&
    Ul &&
    g.v8 &&
    (!isManualOrSeek || state.W < 1080) &&
    (formats = formats.filter(
      (f) => f.video && (!f.K || f.K.powerEfficient) // was: K
    ));

  if (formats.length > 0) {
    if (supportsChangeType()) {
      const preferred = selectBestCodecPerQuality(abrState, formats); // was: K
      formats = formats.filter(
        (f) => !!f && !!f.video && f.computeAutoHideVisible === preferred[f.video.qualityOrdinal].computeAutoHideVisible // was: T
      );
    } else {
      const topQuality = formats[0]?.video?.qualityOrdinal; // was: K
      if (topQuality) {
        const topTier = formats.filter(
          (f) => !!f && !!f.video && f.video.qualityOrdinal === topQuality // was: W (reused)
        );
        const preferredMI = selectBestCodecPerQuality(abrState, topTier)[topQuality].computeAutoHideVisible; // was: T
        formats = formats.filter(
          (f) => !!f && !!f.video && f.computeAutoHideVisible === preferredMI // was: r
        );
      }
    }
  }

  return formats;
}

/**
 * Select the preferred audio format based on surround-sound preference.
 * [was: e77]
 *
 * @param {Object} abrState [was: Q]
 * @returns {Object|null}
 */
export function selectPreferredAudio(abrState) { // was: e77
  const surround = find(abrState.D.O, (f) => f.audio.W); // was: c
  const stereo = find(abrState.D.O, (f) => !f.audio.W); // was: W
  return surround ? (abrState.policy.BQ ? surround : stereo) : null;
}

// ============================================================================
// SABR / server-driven format selection
// ============================================================================

/**
 * When SABR selects a format, find the matching client-side format entry
 * that is in the selectable set. Falls back to the original if no match.
 * [was: VnX]
 *
 * @param {Object} abrState [was: Q]
 * @param {Object} format   [was: c]
 * @param {Array}  candidates [was: W]
 * @returns {Object}
 */
export function resolveSabrFormat(abrState, format, candidates) { // was: VnX
  if (format.info.computeAutoHideVisible === 'f' || abrState.Ka.includes(EI(format, abrState.k0.positionMarkerOverlays))) {
    return format;
  }

  for (let i = 0; i < candidates.length; i++) { // was: m
    const candidate = abrState.k0.W[candidates[i].id]; // was: K
    if (!abrState.Ka.includes(EI(candidate, abrState.k0.positionMarkerOverlays))) continue;

    const srcCodec = format.info.computeAutoHideVisible; // was: T
    const dstCodec = candidate.info.computeAutoHideVisible; // was: r

    if (srcCodec === dstCodec || supportsChangeType()) {
      if (
        format.info.video
          ? format.info.O !== candidate.info.O
          : format.info.audio.W !== candidate.info.audio.W || format.info.miniplayerIcon?.id !== candidate.info.miniplayerIcon?.id
      ) {
        IT(abrState, { mismatch: 'xtag', f: format.info.id, t: candidate.info.id });
        return format;
      }
      IT(abrState, { f: format.info.itag, t: candidate.info.itag });
      abrState.jG = true; // was: !0
      return candidate;
    }
    IT(abrState, { mismatch: 'efficient', hasCapabilityFeature: srcCodec, ReentrantChannel: dstCodec });
  }

  IT(abrState, { mismatch: 'unselectable', fmts: abrState.Ka.join('.') });
  return format;
}

// ============================================================================
// EBML (WebM) variable-length integer parsing
// ============================================================================

/**
 * Read a single byte from a byte-offset reader. Throws on overflow.
 * [was: nE]
 *
 * @param {Object} reader [was: Q]
 * @returns {number}
 */
export function readNextByte(reader) { // was: nE
  if (reader.offset >= reader.O.totalLength) throw Error();
  return readByte(reader.O, reader.offset++);
}

/**
 * Read a variable-length EBML integer.
 * [was: vYn]
 *
 * @param {Object}  reader     [was: Q]
 * @param {boolean} [raw=false] [was: c] - true returns raw value (element ID form)
 * @returns {number}
 */
export function readEbmlVarInt(reader, raw = false) { // was: vYn
  let firstByte = readNextByte(reader); // was: W

  if (firstByte === 1) {
    // 8-byte integer
    let value = -1; // was: c (reused)
    for (let i = 0; i < 7; i++) { // was: W (reused)
      const b = readNextByte(reader); // was: m
      value === -1 && b !== 255 && (value = 0);
      value > -1 && (value = value * 256 + b);
    }
    return value;
  }

  let mask = 128; // was: m
  for (let i = 0; i < 6 && mask > firstByte; i++) { // was: K
    firstByte = firstByte * 256 + readNextByte(reader);
    mask *= 128;
  }
  return raw ? firstByte : firstByte - mask;
}

/**
 * Read an EBML element header (id + size).
 * Returns { id: -1, size: -1 } on failure.
 * [was: aI3]
 *
 * @param {Object} reader [was: Q]
 * @returns {{ id: number, size: number }}
 */
export function readEbmlElement(reader) { // was: aI3
  try {
    const id = readEbmlVarInt(reader, true); // was: c, was: !0
    const size = readEbmlVarInt(reader, false); // was: W, was: !1
    return { id, size };
  } catch (_e) { // was: c
    return { id: -1, size: -1 };
  }
}

// ============================================================================
// DRM init-data extraction
// ============================================================================

/**
 * Extract DRM init data (PSSH boxes, crypto period index, key IDs) from
 * the init segment data.
 * [was: OC_]
 *
 * @param {Object} drmInfo [was: Q] - object with .initData (Uint8Array), .A (keyIds array), etc.
 */
export function extractDrmInitData(drmInfo) { // was: OC_
  // Scan for PSSH boxes (box type 0x70737368 = 1886614376)
  let parsedPssh; // was: m
  const initData = drmInfo.initData; // was: c

  try {
    let offset = 0; // was: W
    const view = new DataView(initData.buffer); // was: K

    while (offset < view.byteLength - 8) {
      const boxSize = view.getUint32(offset); // was: T
      if (boxSize <= 1) break;

      if (view.getUint32(offset + 4) !== 1886614376) {
        offset += boxSize;
        continue;
      }

      let headerSize = 32; // was: r
      if (view.getUint8(offset + 8) > 0) {
        const kidCount = view.getUint32(offset + 28); // was: I
        headerSize += kidCount * 16 + 4;
      }

      const dataSize = view.getUint32(offset + headerSize - 4); // was: U
      try {
        const parsed = gY3(initData.subarray(offset + headerSize, offset + headerSize + dataSize)); // was: I (reused)
        if (parsed !== null) {
          parsedPssh = parsed;
          break;
        }
      } catch (_e) {
        // ignore
      }
      offset += boxSize;
    }
  } catch (_e) {
    // fallthrough: parsedPssh remains undefined
  }

  if (parsedPssh != null) {
    const periodIndex = $J(dD(parsedPssh, 7, undefined, xC)); // was: c (reused)
    if (periodIndex != null && !drmInfo.wH) {
      drmInfo.cryptoPeriodIndex = periodIndex;
    }

    const keyVersion = $J(dD(parsedPssh, 10, undefined, xC)); // was: c (reused)
    keyVersion != null && keyVersion > 0 && !drmInfo.wH && (drmInfo.W = keyVersion);

    for (const keyId of vw(parsedPssh, 2, Gs, undefined === EMPTY_EXTENSIONS ? 2 : 4)) { // was: K
      const keyIdArray = drmInfo.A; // was: m (reused)
      const rawBytes = mS(keyId); // was: W (reused)
      const hexString = g.lj(rawBytes, 4); // was: W (reused)
      keyIdArray.push(hexString);
    }
  }
}

/**
 * Build a DRM session identifier from the init data.
 * [was: fI7]
 *
 * @param {Object} drmInfo [was: Q]
 * @returns {string}
 */
export function buildDrmSessionId(drmInfo) { // was: fI7
  return isNaN(drmInfo.cryptoPeriodIndex)
    ? g.lj(drmInfo.initData)
    : `${drmInfo.cryptoPeriodIndex}`;
}

// ============================================================================
// Offline media storage (Woffle)
// ============================================================================

/**
 * Write segment data into the Woffle chunk buffer and flush full chunks to IDB.
 * [was: sL7]
 *
 * @param {Object} woffle     [was: Q]
 * @param {Object} sliceData  [was: c]
 */
export function writeWoffleChunk(woffle, sliceData) { // was: sL7
  let readOffset = 0; // was: W
  const rawBytes = getUint8View(sliceData.O); // was: m

  if (woffle.j < woffle.A) {
    readOffset = woffle.A * woffle.chunkSize - ((sliceData.info.range?.start || 0) + sliceData.info.W);
    if (readOffset >= rawBytes.length) return;
    if (readOffset < 0) throw Error('Missing data');
    woffle.j = woffle.A;
    woffle.O = 0;
  }

  while (readOffset < rawBytes.length) {
    const copyLen = Math.min(rawBytes.length - readOffset, woffle.K.byteLength - woffle.O); // was: K
    const slice = new Uint8Array(rawBytes.buffer, rawBytes.byteOffset + readOffset, copyLen); // was: T
    woffle.K.set(slice, woffle.O);
    woffle.O += copyLen;
    readOffset += copyLen;

    if (woffle.O === woffle.K.length) {
      if (sliceData.info === woffle.Ys && qJ(woffle) && readOffset === rawBytes.length) break;

      const progress = A7(woffle); // was: K (reused)
      const writePromise = rA(
        woffle.policy.j,
        woffle.W.info,
        BV(woffle),
        progress,
        woffle.policy.JJ,
        woffle.j,
        woffle.K,
        woffle.crypto
      );
      woffle.mF.add(writePromise);
      x2(woffle, writePromise);

      if (!woffle.u0()) {
        const stats = A7(woffle); // was: K (reused)
        woffle.T2(
          BV(woffle),
          stats !== undefined // was: void 0
            ? (stats.downloadedEndTime || 0) * stats.averageByteRate
            : stats.maxKnownEndTime * stats.averageByteRate,
          stats.maxKnownEndTime * stats.averageByteRate
        );
      }

      woffle.K = new Uint8Array(woffle.chunkSize);
      woffle.O = 0;
      woffle.j += 1;
    }
  }
}

/**
 * Finalize the Woffle download (flush the last partial chunk to IDB).
 * [was: L5m]
 *
 * @param {Object} woffle [was: Q]
 */
export function finalizeWoffle(woffle) { // was: L5m
  if (!qJ(woffle)) return;
  if (!woffle.Ys || !woffle.indexRange) {
    eJ(woffle, new AdLayoutRendererMetadata('Woffle: Expect at EOS to always have lastSlice or indexRange'));
    return;
  }
  if (!woffle.O) {
    eJ(woffle, new AdLayoutRendererMetadata('Woffle: Expect always re-mark currentChunkOffset at EOS'));
    return;
  }

  const lastChunkData = new Uint8Array(woffle.K.buffer, 0, woffle.O); // was: c
  const finalProgress = dZR(woffle); // was: W
  const videoId = woffle.policy.j; // was: m

  Promise.all(woffle.mF).then(() => {
    const writePromise = rA(videoId, woffle.Ys.cueAdVideo.info, BV(woffle, true), finalProgress, woffle.policy.JJ, woffle.j, lastChunkData, woffle.crypto);
    x2(woffle, writePromise, true); // was: !0
  });
}

// ============================================================================
// Buffer state tracking
// ============================================================================

/**
 * Compute buffer health: the number of seconds of playable content
 * ahead of the current playback position.
 * [was: El]
 *
 * @param {Object}  track      [was: Q]
 * @param {boolean} [useAhead=false] [was: c]
 * @returns {number}
 */
export function getBufferHealth(track, useAhead = false) { // was: El
  const currentTime = track.loader.getCurrentTime(); // was: W
  const lastSlice = track.A.GR(); // was: m
  let endTime = lastSlice?.info.K || 0; // was: K

  if (track.policy.J && !isFinite(currentTime)) return 0;

  if (lastSlice?.info.cueAdVideo.T2() && !lastSlice.info.A) {
    if (track.policy.pF) {
      endTime = lastSlice.info.j;
    } else if (track.policy.qR) {
      const info = lastSlice.info; // was: T
      endTime = info.range
        ? info.K
        : Math.min(
            info.startTime + Math.min(info.duration * info.W / info.cueAdVideo.info.handleBackgroundSuspend, info.duration) +
              (info.range
                ? info.L
                : Math.min(info.duration, info.duration * info.O / info.cueAdVideo.info.handleBackgroundSuspend)),
            info.startTime + info.duration
          );
    }
  }

  if (!track.trustedTypes) {
    if ((track.policy.W || track.policy.AD) && useAhead && !isNaN(currentTime)) {
      if (lastSlice) return endTime - currentTime;
      if (track.policy.AD && track.cueAdVideo.info.computeAutoHideVisible === 'f') return Infinity;
    }
    return 0;
  }

  const tlsSlice = Fo(track); // was: T (reused)
  if (tlsSlice && Zv(tlsSlice)) return tlsSlice.K;

  const bufferedRanges = track.trustedTypes.NoOpLogger(true); // was: r, was: !0

  if (useAhead && lastSlice) {
    let extra = 0; // was: T (reused)
    track.policy.W && (extra = getRemainingInRange(bufferedRanges, endTime + 0.02));
    return extra + endTime - currentTime;
  }

  let health = getRemainingInRange(bufferedRanges, currentTime); // was: c (reused)

  if (track.policy.estimateAv1Threshold && tlsSlice) {
    const curBufIdx = findRangeIndex(bufferedRanges, currentTime); // was: m (reused)
    const tlsBufIdx = findRangeIndex(bufferedRanges, tlsSlice.j - 0.02); // was: r (reused)
    if (curBufIdx === tlsBufIdx) {
      const tlsHealth = tlsSlice.K - currentTime; // was: W (reused)
      track.policy.A &&
        tlsHealth > health + 0.02 &&
        track.RetryTimer('abh', { OnLayoutSelfExitRequestedTrigger: health, bhtls: tlsHealth });
      health = Math.max(health, tlsHealth);
    }
  }

  return health;
}

// ============================================================================
// Seek / flush / rollback
// ============================================================================

/**
 * Seek a track to a specific time, flushing queued segments.
 * Returns the resolved seek position or NaN.
 * [was: tM]
 *
 * @param {Object} track    [was: Q]
 * @param {number} seekTime [was: c]
 * @param {Object} [seekCtx] [was: W]
 * @returns {number}
 */
export function seekTrack(track, seekTime, seekCtx) { // was: tM
  track.cueAdVideo.W();
  let resolved = LE(track, seekTime); // was: m
  if (resolved >= 0) return resolved;

  track.J?.S(seekTime, seekCtx);

  // Find the earliest pending-write time in the Woffle
  let earliestPending = Infinity; // was: T
  const mediaWriter = track.A; // was: T (reused)
  if (mediaWriter.D) {
    const writer = mediaWriter.D; // was: T (reused)
    if (writer.Ys && writer.Ys.type === 3) {
      earliestPending = writer.Ys.startTime;
    } else if (writer.A > 0) {
      const idx = writer.W.index; // was: r
      const search = g.H9(idx.offsets.subarray(0, idx.count), writer.A * writer.chunkSize); // was: r (reused)
      earliestPending = writer.W.index.getStartTime(search >= 0 ? search : Math.max(0, -search - 2));
    } else {
      earliestPending = 0;
    }
  }

  seekTime = Math.min(seekTime, earliestPending); // was: K.call(m, c, T)
  track.W = track.policy.isSamsungSmartTV ? null : track.cueAdVideo.D(seekTime).eh[0];

  if (w4(track)) {
    (track.policy.u_ && seekCtx?.seekSource === 60) || (track.trustedTypes && track.trustedTypes.abort());
    track.policy.Ev && track.J?.J();
  }

  track.MM = 0;
  return track.W ? track.W.startTime : seekTime;
}

/**
 * Find a valid seek point in the buffer for a given time.
 * Returns the buffered start time or NaN.
 * [was: nb]
 *
 * @param {Object}  track    [was: Q]
 * @param {number}  time     [was: c]
 * @param {boolean} [loose=false] [was: W]
 * @returns {number}
 */
export function findBufferedSeekPoint(track, time, loose = false) { // was: nb
  if (track.trustedTypes) {
    const ranges = track.trustedTypes.NoOpLogger(); // was: m
    const bufIdx = getRangeEnd(ranges, time); // was: K
    let seekSliceIdx = NaN; // was: T
    const lastSlice = Fo(track); // was: r
    lastSlice && (seekSliceIdx = getRangeEnd(ranges, lastSlice.cueAdVideo.index.getStartTime(lastSlice.DF)));

    if (bufIdx === seekSliceIdx && track.W && track.W.O && Xqx(d4(track), 0)) {
      return time;
    }
  }

  const found = LE(track, time, loose); // was: Q (reused)
  return found >= 0 ? found : NaN;
}

/**
 * Roll back a track to a given segment number, discarding appended segments.
 * [was: vV]
 *
 * @param {Object} track       [was: Q]
 * @param {number} segmentNum  [was: c]
 * @param {number} seekTime    [was: W]
 * @param {number} targetTime  [was: m]
 * @returns {boolean}
 */
export function rollbackTrack(track, segmentNum, seekTime, targetTime) { // was: vV
  if (!track.cueAdVideo.index.Wb(segmentNum, true)) return false; // was: !0

  try {
    qO(track);
    const mediaStream = track.A; // was: K
    let poppedInfo = null; // was: T

    for (let i = mediaStream.O.length - 1; i >= 0; i--) { // was: r
      const slice = mediaStream.O[i]; // was: U
      if (slice.info.DF >= segmentNum) {
        mediaStream.O.pop();
        mediaStream.A -= Wr(slice, mediaStream.policy.readRepeatedMessageField);
        poppedInfo = slice.info;
      }
    }

    if (poppedInfo) {
      mediaStream.j = mediaStream.O.length > 0 ? mediaStream.O[mediaStream.O.length - 1].info : mediaStream.jG;
      mediaStream.O.length !== 0 || mediaStream.j || t7(mediaStream, 'r');
    }

    mediaStream.loader.RetryTimer('mdstm', {
      rollbk: 1,
      itag: poppedInfo ? poppedInfo.cueAdVideo.info.itag : '',
      popped: poppedInfo ? poppedInfo.DF : -1,
      sq: segmentNum,
      lastslc: mediaStream.j ? mediaStream.j.DF : -1,
      lastfraget: mediaStream.A.toFixed(3),
    });

    if (track.policy.W) {
      track.W = null;
      return true;
    }
    targetTime > seekTime ? seekTrack(track, targetTime) : (track.W = track.cueAdVideo.K(segmentNum - 1, false).eh[0]); // was: !1
  } catch (err) { // was: T
    const errInfo = UU(err); // was: c (reused)
    errInfo.details.reason = 'rollbkerr';
    track.loader.handleError(errInfo.NetworkErrorCode, errInfo.details, errInfo.severity);
    return false;
  }
  return true;
}

// ============================================================================
// Request lifecycle
// ============================================================================

/**
 * Create and dispatch a segment request (XHR or fetch).
 * Wires up the completion callback with format switching, error handling, etc.
 * [was: We]
 *
 * @param {Object} scheduler  [was: Q]
 * @param {Object} sliceInfo  [was: c]
 * @returns {xU} the new request object
 */
export function createSegmentRequest(scheduler, sliceInfo) { // was: We
  scheduler.loader.RX(sliceInfo);
  const byteLength = LU0(sliceInfo); // was: W
  const timestamp = scheduler.loader.LruRingBuffer(); // was: m

  const requestOpts = { // was: W (reused)
    Qp: scheduler.schedule,
    VD: byteLength,
    readVarintField: Sjd(scheduler.j, byteLength),
    B5: jw(sliceInfo.eh[0]),
    jp: M4(20, 4745, sliceInfo.getTraceBackend.W),
    Ft: scheduler.policy.A,
    oN: (code, details) => { scheduler.loader.Tt(code, details); },
  };

  scheduler.schedule.O.D && (requestOpts.h6 = (scheduler.videoTrack.cueAdVideo?.info.handleBackgroundSuspend || 0) + (scheduler.audioTrack.cueAdVideo?.info.handleBackgroundSuspend || 0));
  scheduler.nullToString && ((requestOpts.DF = sliceInfo.eh[0].DF), (requestOpts.Og = sliceInfo.Og), (requestOpts.nullToString = scheduler.nullToString));

  const fetchOpts = { // was: m (reused)
    sendFinalFlush: w1m(sliceInfo, scheduler.loader.getCurrentTime()),
    ZD: scheduler.policy.getRemoteModule && $V(sliceInfo) && sliceInfo.eh[0].cueAdVideo.info.video ? yqR(scheduler.O) : undefined,
    flushPendingGrafts: scheduler.policy.MM,
    poToken: scheduler.loader.tp(),
    bezierY: scheduler.loader.f4(),
    Wt: scheduler.Wt,
    Fr: isNaN(scheduler.Fr) ? null : scheduler.Fr,
    Vf: scheduler.Vf,
    SlotEntryTriggerMetadata: scheduler.SlotEntryTriggerMetadata,
    getElapsedPlayTime: timestamp,
  };

  return new DashSegmentRequest(
    scheduler.policy,
    sliceInfo,
    requestOpts,
    scheduler.A,
    createRequestCompletionHandler(scheduler),
    fetchOpts
  );
}

/**
 * Build the completion handler for a segment request. This is the main
 * callback that processes response data, handles errors, retries, and
 * drives the append pipeline forward.
 *
 * (Internal: extracted from the anonymous function inside We)
 *
 * @param {Object} scheduler [was: Q]
 * @returns {Function}
 */
function createRequestCompletionHandler(scheduler) {
  return (request, retryCount) => { // was: (K, T)
    try {
      const formatTrack = request.info.eh[0].cueAdVideo; // was: T7
      const track = formatTrack.info.video ? scheduler.videoTrack : scheduler.audioTrack; // was: oW

      if (request.state >= 2 && !request.isComplete() && !request.coerceString()) {
        if (scheduler.loader.loadVideoFromData && !scheduler.loader.isSuspended && getBufferHealth(track) > 3) {
          // skip - buffer is healthy enough
        } else {
          const retryAction = E7W(request, scheduler.policy, scheduler.A); // was: G7
          retryAction === 1 && (scheduler.S = true);
          createProbeRequest(scheduler, request, retryAction);
        }
      }

      if (request.isComplete() || (request.u0() && retryCount < 3)) {
        if (scheduler.policy.A) {
          const timing = request.timing.Y(); // was: yn
          timing.rst = request.state;
          timing.strm = request.xhr.T5();
          timing.cncl = request.xhr && request.accumulateBytes.K ? 1 : 0;
          scheduler.loader.RetryTimer('rqs', timing);
        }
        request.vP && scheduler.loader.RetryTimer('sbwe3', {}, true);
      }

      if (!scheduler.u0() && request.state >= 2) {
        RPy(scheduler.timing, request, formatTrack);

        // CABR UTC seek handling
        if (scheduler.Fr && request.rG && scheduler.loader) {
          scheduler.Fr = NaN;
          scheduler.loader.createErrorResult(request.rG);
          scheduler.loader.callAw;
          scheduler.loader.RetryTimer('cabrUtcSeek', { mediaTimeSeconds: request.rG });
        }
        if (request.readMessageField && scheduler.Fr && request.readMessageField && !request.readMessageField.action) {
          scheduler.loader.setSliderValue(scheduler.Fr);
          scheduler.Fr = NaN;
          scheduler.loader.RetryTimer('cabrUtcSeekFallback', { targetUtcTimeSeconds: scheduler.Fr });
        }

        request.e2 && scheduler.loader.JB(request.e2);
        scheduler.policy.isTvHtml5Exact && (scheduler.SlotEntryTriggerMetadata = request.SlotEntryTriggerMetadata);

        if (request.state === 3) {
          // Error state
          cancelAndCleanupRequest(track, request);
          $V(request.info) && fetchInitSegmentIfNeeded(scheduler, track, formatTrack, true);
          if (scheduler.Z1) {
            const hv = request.info.hv(); // was: yn
            hv && scheduler.Z1.handleSegmentRedirect(request.info.eh[0].DF, formatTrack.info.id, hv);
          }
          scheduler.loader.q7();
        } else if (request.isComplete() && request.info.eh[0].type === 5) {
          // Type 5 = preload hint
          if (request.state !== 4) {
            request.CB() && scheduler.loader.handleError(request.LayoutRenderingAdapter(), request.Pp());
          } else {
            const pendingReq = (request.info.eh[0].cueAdVideo.info.video ? scheduler.videoTrack : scheduler.audioTrack).O[0] || null;
            pendingReq && pendingReq instanceof DashSegmentRequest && pendingReq.coerceString() && pendingReq.aY();
          }
          request.dispose();
        } else {
          // Handle itag changes from X-Response-Itag header
          if (!request.CB() && request.FROZEN_EMPTY_ARRAY && request.state >= 2 && request.state !== 3) {
            const responseItag = request.xhr.getResponseHeader('X-Response-Itag'); // was: I
            if (responseItag) {
              const newFormat = iC0(scheduler.O, responseItag); // was: X
              const totalBytes = request.info.A; // was: A
              if (totalBytes) {
                const byteOffset = totalBytes - newFormat.jG(); // was: e
                newFormat.mF = true;
                request.info.eh[0].cueAdVideo.mF = false;
                const newInfo = newFormat.J(byteOffset); // was: V
                request.info = newInfo;
                // Update proxy info if present
                if (request.HEX_COLOR_VALIDATION_REGEX) {
                  const proxy = request.HEX_COLOR_VALIDATION_REGEX; // was: B
                  const slices = newInfo.eh; // was: n
                  proxy.eh = slices;
                  const totalBuf = new ChunkedByteBuffer(); // was: $x
                  for (let i = 0; i < proxy.Z5.length; i++) appendBuffer(totalBuf, proxy.Z5[i].O);
                  for (let i = 0; i < proxy.Z5.length; i++) {
                    proxy.Z5[i].info = slices[i];
                    const range = slices[i].range; // was: z7
                    proxy.Z5[i].O = sliceBuffer(totalBuf, range.start - newInfo.eh[0].range.start, range.length);
                  }
                }
                request.FROZEN_EMPTY_ARRAY = false;
                RT(scheduler.loader, scheduler.videoTrack, newFormat);
                const videoTrack = scheduler.videoTrack; // was: S
                videoTrack.W && (videoTrack.W.cueAdVideo = newFormat);
                scheduler.loader.shouldScheduleRequest(newFormat.info.video.quality);
                const lmt = request.VW(); // was: d
                lmt && newFormat.info.lastModified && newFormat.info.lastModified !== +lmt && cancelAndCleanupRequest(scheduler.videoTrack, request);
              }
            } else {
              request.FROZEN_EMPTY_ARRAY = false;
            }
          }

          request.L4?.itagDenylist && scheduler.loader.jw(request.L4.itagDenylist);

          if (request.state === 4) {
            // Successful completion
            handleRequestResponse(scheduler, request);
            scheduler.W && scheduler.W.MM(request.info, scheduler.Z1);
          } else if (scheduler.policy.A7 && request.uW() && !request.isComplete() && !handleRequestResponse(scheduler, request) && !request.CB()) {
            return; // break out of processing
          }

          if (request.CB()) {
            // Request failed
            const fmtTrack = request.info.eh[0].cueAdVideo; // was: yn
            const NetworkErrorCode = request.LayoutRenderingAdapter(); // was: $x
            const segNum = request.info.eh[0].DF; // was: z7
            const seekKey = kU(scheduler.W, request.info.eh[0].j, segNum); // was: wT

            NetworkErrorCode === 'net.badstatus' && (scheduler.K += 1);

            if (request.canRetry() && Y2(scheduler.loader)) {
              if (!(request.info.getTraceBackend.O >= scheduler.policy.PQ && scheduler.Z1 && request.info.isDecorated() && NetworkErrorCode === 'net.badstatus' && disableSsdai(scheduler.Z1, seekKey, segNum))) {
                const shouldStun = (fmtTrack.info.video && fmtTrack.getTraceBackend.O > 1 || request.XS === 410 || request.XS === 500 || request.XS === 503) && !(QI(scheduler.O.K).size > 0) && !M4(4, 4761, fmtTrack.getTraceBackend.W);
                const errDetails = request.Pp(); // was: w
                shouldStun && (errDetails.stun = '1');
                scheduler.loader.handleError(NetworkErrorCode, errDetails);
                if (!scheduler.u0()) {
                  shouldStun && resetTrackState(scheduler.O, fmtTrack);
                  cancelAndCleanupRequest(track, request);
                  scheduler.loader.q7();
                }
              }
            } else {
              let severity = 1; // was: X (reused)
              scheduler.Z1 && request.info.isDecorated() && NetworkErrorCode === 'net.badstatus' && disableSsdai(scheduler.Z1, seekKey, segNum) && (severity = 0);

              if (scheduler.k0.isLive && request.LayoutRenderingAdapter() === 'net.badstatus' && scheduler.K <= scheduler.policy.RemoteConnection * 2) {
                truncateVideoStreams(scheduler.k0);
                if (scheduler.k0.DE || scheduler.k0.isPremiere) {
                  routeSeek(scheduler.loader, 0, { Z7: 'badStatusWorkaround' });
                } else if (scheduler.k0.isWindowedLive) {
                  routeSeek(scheduler.loader, scheduler.k0.NF, { Z7: 'badStatusWorkaround', h7: true });
                } else {
                  Qo(scheduler.loader);
                }
              } else {
                scheduler.loader.handleError(NetworkErrorCode, request.Pp(), severity);
              }

              if (!isNaN(scheduler.Fr)) {
                scheduler.loader.setSliderValue(scheduler.Fr);
                scheduler.Fr = NaN;
              }
            }

            scheduler.policy.sC && !request.isComplete() ? ce(scheduler.loader) : scheduler.loader.q7();

            const retryCheck = smw(request, scheduler.policy, scheduler.A); // was: G
            createProbeRequest(scheduler, request, retryCheck);
          }
        }
      }
    } catch (err) { // was: T7
      const severity = scheduler.mF ? 1 : 0; // was: G
      scheduler.mF = true;
      const wrapped = UU(err, severity); // was: G (reused)
      scheduler.loader.handleError(wrapped.NetworkErrorCode, wrapped.details, wrapped.severity);
      oR(severity) || scheduler.loader.testUrlPattern();
    }
  };
}
