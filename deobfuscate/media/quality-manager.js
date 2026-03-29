/**
 * quality-manager.js -- Quality/bitrate selection and adaptation
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~36230-37970
 *
 * Handles:
 *  - Bandwidth estimation and smoothing
 *  - Readahead buffer sizing (min/max readahead, growth rate)
 *  - Adaptive bitrate selection (video track ladder, up/down switching)
 *  - Quality constraint composition (manual, smooth, visibility, performance,
 *    speed policies)
 *  - Buffer range tracking (segment timeline merge/split)
 *  - itag deny-listing for per-playback constraints
 *  - Audio track selection (default, DRC preference, 5.1 preference)
 *  - Quality labels ("tiny", "small", "medium", "large", "hd720", etc.)
 *  - Server-side ABR (SABR) client hints construction
 */
import { isCompressedDomainComposite } from './audio-normalization.js'; // was: gA
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { getRemoteModule } from '../player/caption-manager.js'; // was: w7
import { registerAdTimelinePlayback } from '../ads/dai-cue-range.js'; // was: Rt
import { appendInitSegment } from './mse-internals.js'; // was: qF
import { createGrpcStreamCall } from '../network/xhr-handler.js'; // was: aO
import { detectStateTransition } from '../data/interaction-logging.js'; // was: aH
import { getAdPlacementConfig } from '../ads/dai-layout.js'; // was: bx
import { createTimeRanges } from './codec-helpers.js'; // was: lo
import { positionMarkerOverlays } from '../ui/progress-bar-impl.js'; // was: UC
import { handleBackgroundSuspend } from './quality-constraints.js'; // was: w3
import { getTraceBackend } from '../data/gel-core.js'; // was: yp
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { computeAutoHideVisible } from '../player/caption-manager.js'; // was: mI
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { miniplayerIcon } from '../ui/svg-icons.js'; // was: D1
import { detectCapabilities } from '../ads/ad-click-tracking.js'; // was: Ic
import { createOneOffSigner } from '../core/event-registration.js'; // was: ud
import { getQoeTimestamp } from '../player/time-tracking.js'; // was: jM()
import { getListenerMap } from '../core/composition-helpers.js'; // was: wm
import { getSourceBuffers } from '../ads/ad-prebuffer.js'; // was: WZ
import { splice, filter, findIndex } from '../core/array-utils.js';
import { getVisibilityState } from '../core/composition-helpers.js';
import { getPlaybackRate } from '../player/time-tracking.js';

// ---------------------------------------------------------------------------
// Quality label constants
// ---------------------------------------------------------------------------

/**
 * Canonical quality label strings used by the YouTube player.
 * Ordered from lowest to highest resolution.
 */
export const QUALITY_LABELS = [
  'tiny',      // ~144p
  'small',     // ~240p
  'medium',    // ~360p
  'large',     // ~480p
  'hd720',     //  720p
  'hd1080',    // 1080p
  'hd1440',    // 1440p
  'hd2160',    // 2160p (4K)
  'hd2880',    // 2880p (not common)
  'highres',   // > 4K
];

// ---------------------------------------------------------------------------
// Bandwidth estimation
// ---------------------------------------------------------------------------

/**
 * Compute effective bandwidth in bytes/second from the smoothed estimator.
 * [was: U6]
 *
 * @param {object} bandwidthEstimator  [was: Qp]
 * @param {boolean} [includeOverhead=true]
 * @param {number} [networkTypeMultiplier]
 * @returns {number} bytes per second
 */
export function getEffectiveBandwidth(bandwidthEstimator, includeOverhead = true, networkTypeMultiplier) { // was: Ib -> U6
  // U6(Q.Qp, !Q.policy.Is, Q.policy.NT) — wrapping the inner call
  return computeBandwidth(bandwidthEstimator, includeOverhead, networkTypeMultiplier);
}

// Inner placeholder — actual smoothing logic lives in bandwidth estimator module
function computeBandwidth(estimator, includeOverhead, ntMultiplier) {
  // Deferred: wraps the exponential weighted moving average estimator
  return estimator?.currentEstimate ?? 500_000; // fallback ~500 KB/s
}

/**
 * Get the current smoothed round-trip factor from the bandwidth estimator.
 * [was: X0]
 *
 * @param {object} bandwidthEstimator
 * @returns {number} smoothed RTT factor
 */
export function getSmoothedRtt(bandwidthEstimator) { // was: X0
  return bandwidthEstimator?.smoothedRtt ?? 0.1;
}

/**
 * Record a bandwidth sample (time delta + bytes transferred).
 * [was: SF]
 *
 * @param {object} stats        [was: Q — the request timing/stats object]
 * @param {number} timestamp    - current time in ms
 * @param {number} bytesLoaded
 */
export function recordBandwidthSample(stats, timestamp, bytesLoaded) { // was: SF
  updateBandwidthEstimator(stats.Qp, timestamp); // was: $50
  if (stats.UH) {
    stats.UH.add(Math.ceil(timestamp) - Math.ceil(stats.J));
    stats.UH.add(Math.max(0, Math.ceil(bytesLoaded / 1024) - Math.ceil(stats.j / 1024)));
  }
  const timeDelta = timestamp - stats.J;
  const bytesDelta = bytesLoaded - stats.j;
  stats.isCompressedDomainComposite = bytesDelta; // was: gA — last chunk bytes
  stats.isInAdPlayback = Math.max(stats.isInAdPlayback, bytesDelta / (timeDelta + 0.01) * 1000); // was: WB — peak rate
  stats.J = timestamp;
  stats.j = bytesLoaded;
  if (stats.PA && bytesLoaded > stats.PA) {
    finalizePeakStats(stats); // was: Pfx
  }
}

function updateBandwidthEstimator(/* estimator, time */) { /* deferred */ }
function finalizePeakStats(stats) { // was: Pfx
  stats.XI = Math.max(stats.XI, stats.j - stats.getRemoteModule);
  stats.Ka = Math.max(stats.Ka, stats.J - stats.registerAdTimelinePlayback);
  stats.PA = 0;
}

// ---------------------------------------------------------------------------
// Readahead buffer sizing
// ---------------------------------------------------------------------------

/**
 * Compute the target buffer size (in bytes) given the current bandwidth,
 * available buffer time, and playback rate.
 *
 * [was: AM]
 *
 * @param {object} config       - readahead policy config [was: Q]
 * @param {number} bytesPerSec  - effective bitrate of current format
 * @param {number} overhead     - overhead bytes per second (headers, etc.)
 * @param {number} bufferSec    - seconds of buffer available ahead of playhead
 * @param {boolean} [force=false]
 * @returns {number} target buffer size in bytes
 */
export function computeTargetBufferSize(config, bytesPerSec, overhead, bufferSec, force = false) { // was: AM
  if (config.policy.bN) {
    return Math.ceil(config.policy.bN * bytesPerSec);
  }
  if (config.policy.Pn) bufferSec = Math.abs(bufferSec);
  bufferSec /= config.playbackRate;

  const inverseBw = 1 / getEffectiveBandwidth(config.Qp);
  let targetSec =
    Math.max(0.9 * (bufferSec - 3), getSmoothedRtt(config.Qp) + config.Qp.O.W * inverseBw) /
    inverseBw * 0.8 /
    (bytesPerSec + overhead);
  targetSec = Math.min(targetSec, bufferSec);

  if (config.policy.appendInitSegment > 0 && force) {
    targetSec = Math.max(targetSec, config.policy.appendInitSegment);
  }

  return clampBufferSize(config, targetSec, bytesPerSec);
}

/**
 * Clamp buffer size to policy min/max.
 * [was: FBd]
 *
 * @param {object} config
 * @param {number} targetSec
 * @param {number} bytesPerSec
 * @returns {number}
 */
function clampBufferSize(config, targetSec, bytesPerSec) { // was: FBd
  return (
    Math.ceil(
      Math.max(
        Math.max(config.policy.Eh, config.policy.createGrpcStreamCall * bytesPerSec),
        Math.min(
          Math.min(config.policy.PA, 31 * bytesPerSec),
          Math.ceil(targetSec * bytesPerSec)
        )
      )
    ) || config.policy.Eh
  );
}

/**
 * Compute the minimum readahead time (in seconds) for playback start,
 * considering bandwidth tiers from server config.
 *
 * [was: Vh]
 *
 * @param {object} config
 * @param {boolean} isResume
 * @param {number} currentBandwidthBps
 * @returns {number} seconds
 */
export function computeMinStartReadahead(config, isResume, currentBandwidthBps) { // was: Vh
  const resumePolicy = config.policy.playbackStartPolicy.resumeMinReadaheadPolicy || [];
  const startPolicy = config.policy.playbackStartPolicy.startMinReadaheadPolicy || [];
  let minReadahead = Infinity;
  const tiers = isResume && resumePolicy.length > 0 ? resumePolicy : startPolicy;
  for (const tier of tiers) {
    const readaheadMs = tier.minReadaheadMs || 0;
    if (currentBandwidthBps < (tier.minBandwidthBytesPerSec || 0)) continue;
    if (minReadahead > readaheadMs) minReadahead = readaheadMs;
  }
  return minReadahead < Infinity ? minReadahead / 1000 : Infinity;
}

// ---------------------------------------------------------------------------
// Buffer range tracking / segment timeline merge
// ---------------------------------------------------------------------------

/**
 * Merge a newly completed segment into the buffer range timeline.
 * Handles overlapping ranges, format switches, and split/merge logic.
 *
 * [was: snW]
 *
 * @param {object} context         - merge context with tolerance (.W) and logger
 * @param {Array}  bufferedRanges  - mutable array of {formatId, startTimeMs, durationMs, MF, bx}
 * @param {Array}  pendingSegments - mutable array of partial segments
 * @param {object} segment         - the newly completed segment
 * @param {number} lastIndex       - previous insertion index
 * @returns {number} updated insertion index
 */
export function mergeSegmentIntoTimeline(context, bufferedRanges, pendingSegments, segment, lastIndex) { // was: snW
  // If segment is not the final fragment, accumulate it
  if (!segment.info.A) {
    if (pendingSegments.length === 0) {
      pendingSegments.push(segment);
    } else {
      const merged = pendingSegments.pop()?.D(segment);
      if (merged) {
        pendingSegments.push(merged);
      } else {
        pendingSegments.push(segment);
      }
    }
    return lastIndex;
  }

  // Final fragment — merge with pending
  let complete = pendingSegments.pop()?.D(segment);
  if (!complete) complete = segment;

  if (complete.info.W) {
    // Incomplete segment — log and skip
    context.logger?.({ incompleteSegment: complete.info.Pw() });
    return lastIndex;
  }

  const { formatId, DF: sequenceNumber, startTimeMs, clipId, Tn: durationMs } = context.detectStateTransition(complete);
  const entry = {
    clipId,
    formatId,
    startTimeMs,
    durationMs,
    MF: sequenceNumber,
    getAdPlacementConfig: sequenceNumber,
  };

  // Binary search for insertion point
  let insertIdx = binarySearchByStartTime(bufferedRanges, entry.startTimeMs);
  const existing = insertIdx >= 0 ? bufferedRanges[insertIdx] : null;

  let merged = false;
  if (existing) {
    const existEnd = existing.startTimeMs + existing.durationMs;
    const newEnd = entry.startTimeMs + entry.durationMs;

    if (entry.startTimeMs - existEnd > context.W) {
      // Gap too large — no merge
      merged = false;
    } else if (isSameFormat(context, existing.formatId, entry.formatId)) {
      // Same format — extend existing range
      existing.durationMs = Math.max(existEnd, newEnd) - existing.startTimeMs;
      existing.getAdPlacementConfig = Math.max(existing.getAdPlacementConfig, entry.getAdPlacementConfig);
      merged = true;
    } else if (Math.abs(existing.startTimeMs - entry.startTimeMs) <= context.W) {
      // Overlapping start — replace if new is shorter
      if (existing.durationMs > entry.durationMs + context.W) {
        // Split: swap format in the leading portion
        const oldFormatId = existing.formatId;
        const oldMF = existing.MF;
        const oldBx = existing.getAdPlacementConfig;
        existing.formatId = entry.formatId;
        existing.durationMs = entry.durationMs;
        existing.MF = entry.MF;
        existing.getAdPlacementConfig = entry.getAdPlacementConfig;
        entry.formatId = oldFormatId;
        entry.startTimeMs = newEnd;
        entry.durationMs = existEnd - newEnd;
        entry.MF = oldMF;
        entry.getAdPlacementConfig = oldBx;
        merged = false;
      } else {
        existing.formatId = entry.formatId;
        merged = true;
      }
    } else if (existEnd > entry.startTimeMs) {
      // Partial overlap — truncate existing
      existing.durationMs = entry.startTimeMs - existing.startTimeMs;
      existing.getAdPlacementConfig = entry.MF - 1;
      merged = false;
    }
  }

  if (merged) {
    // entry was absorbed into `existing`
  } else {
    insertIdx += 1;
    bufferedRanges.splice(insertIdx, 0, entry);
  }

  // Clean up any subsequent ranges that are now covered
  let removeCount = 0;
  for (let i = insertIdx + 1; i < bufferedRanges.length; i++) {
    const next = bufferedRanges[i];
    const currentEnd = entry.startTimeMs + entry.durationMs;
    const nextEnd = next.startTimeMs + next.durationMs;
    if (currentEnd >= nextEnd + context.W) {
      removeCount++;
    } else {
      break;
    }
  }
  if (removeCount) bufferedRanges.splice(insertIdx + 1, removeCount);

  return insertIdx;
}

/**
 * Binary search for the range whose startTimeMs is closest to (but <= ) `timeMs`.
 * [was: ZAK]
 *
 * @param {Array} ranges
 * @param {number} timeMs
 * @returns {number} index (may be -1 if before all ranges)
 */
function binarySearchByStartTime(ranges, timeMs) { // was: ZAK
  // Standard binary search, returns exact index or -(insertionPoint) - 2
  let createTimeRanges = 0, hi = ranges.length - 1;
  while (createTimeRanges <= hi) {
    const mid = (createTimeRanges + hi) >>> 1;
    if (ranges[mid].startTimeMs < timeMs) createTimeRanges = mid + 1;
    else if (ranges[mid].startTimeMs > timeMs) hi = mid - 1;
    else return mid;
  }
  return hi; // largest index with startTimeMs <= timeMs, or -1
}

/**
 * Compare two format IDs for equivalence (same itag, xtags, and optionally lmt).
 * [was: ETn]
 *
 * @param {object} context
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
function isSameFormat(context, a, b) { // was: ETn
  if (a.itag !== b.itag || a.xtags !== b.xtags) return false;
  return context.k0?.positionMarkerOverlays || a.lmt === b.lmt;
}

// ---------------------------------------------------------------------------
// Adaptive video quality ladder
// ---------------------------------------------------------------------------

/**
 * Compute the effective byte-rate cost of a video format, used for
 * comparing formats in the quality ladder.
 *
 * [was: m8 (referenced inside KE, oT, Xc_)]
 *
 * @param {object} selector  - the quality selector context
 * @param {object} formatInfo
 * @returns {number} normalized cost metric
 */
function formatByteCost(selector, formatInfo) {
  // Simplified: returns bytesPerSecond. Real impl may apply per-format scaling.
  return formatInfo.handleBackgroundSuspend || 0;
}

/**
 * Select the initial video and audio formats based on the current bandwidth,
 * user preferences, and quality constraints.
 *
 * [was: BPm]
 *
 * @param {object} selector          - quality selector state
 * @param {object} qualityConstraint - composed constraint (manual + auto)
 * @param {string} [audioTrackId]    - preferred audio track ID
 * @returns {object} { audioFormat, videoFormat, reason }
 */
export function selectInitialFormats(selector, qualityConstraint, audioTrackId) { // was: BPm
  buildVideoLadder(selector, qualityConstraint); // was: KE

  // Pick audio format
  let audioInfo = selectAudioFormat(selector.K, audioTrackId); // was: oY_
  if (!audioTrackId && !audioInfo) {
    audioInfo = selectFallbackAudio(selector); // was: e77
  }
  audioInfo = audioInfo || selector.D.O[0];
  selector.O = selector.k0.W[audioInfo.id];
  applyAudioPreferences(selector); // was: WV

  // Save initial audio selection
  selector.J = selector.O;

  // Pick video format based on bandwidth
  selectVideoBandwidthLevel(selector); // was: Xc_

  // Apply locked-format overrides (e.g. DRM license constraints)
  if (selector.Ka.length) {
    selector.nextVideo = applyLockedFormatOverride(selector, selector.nextVideo, selector.D.videoInfos);
    selector.O = applyLockedFormatOverride(selector, selector.O, selector.D.O);
  }

  selector.A = selector.nextVideo;
  selector.J = selector.O;
  return createFormatSelection(selector); // was: AqR
}

/**
 * Build the filtered and sorted video format ladder.
 * Filters out formats that exceed byte-rate caps, are deny-listed,
 * or have too many recent errors.
 *
 * [was: KE]
 *
 * @param {object} selector
 * @param {object} qualityConstraint
 */
function buildVideoLadder(selector, qualityConstraint) { // was: KE
  selector.W = qualityConstraint;
  let candidates = selector.D.videoInfos;

  if (!selector.W.isLocked()) {
    const now = Date.now();
    candidates = candidates.filter(function (info) {
      if (info.handleBackgroundSuspend > this.policy.handleBackgroundSuspend) return false;
      const stream = this.k0.W[info.id];
      const denyExpiry = getDenyList(this.K).get(info.id);
      if (denyExpiry > now) return false;
      if (stream.getTraceBackend.O > 4 || stream.XI > 4) return false;
      if (this.Ie.has(+info.itag)) return false;
      return true;
    }, selector);

    if (selector.K.v7()) {
      candidates = candidates.filter(info => info.video.width <= 854 && info.video.height <= 480);
    }
  }

  if (candidates.length === 0) candidates = selector.D.videoInfos;

  // Apply quality constraint filter
  let filtered = candidates;
  if (!selector.policy.t8) {
    filtered = applyQualityOrdinalCap(selector, filtered, qualityConstraint);
  }
  filtered = filtered.filter(qualityConstraint.j, qualityConstraint);

  // Handle manually locked quality
  if (selector.W.isLocked() && selector.K.W) {
    const locked = candidates.find(info => info.id === selector.K.W);
    if (locked) {
      filtered = [locked];
    } else {
      clearLockedQuality(selector.K, ''); // was: cV
    }
  }

  if (!selector.policy.t8) {
    filtered = applyQualityOrdinalCap(selector, filtered, qualityConstraint);
  }
  if (filtered.length === 0) filtered = [candidates[0]];

  // Sort by byte cost
  filtered.sort((a, b) => formatByteCost(selector, a) - formatByteCost(selector, b));

  // Remove dominated formats (lower res but higher cost)
  for (let i = 1; i < filtered.length; i++) {
    const prev = filtered[i - 1];
    const curr = filtered[i];
    if (prev.video.width > curr.video.width) {
      filtered.splice(i, 1);
      i--;
    } else if (formatByteCost(selector, prev) * selector.policy.Y > formatByteCost(selector, curr)) {
      filtered.splice(i - 1, 1);
      i--;
    }
  }

  selector.j = filtered; // available video formats
  selector.parseHexColor = !!selector.A && !!selector.A.info && selector.A.info.computeAutoHideVisible !== filtered[filtered.length - 1].computeAutoHideVisible;
}

/**
 * Select the video bandwidth level within the ladder.
 * [was: Xc_]
 *
 * @param {object} selector
 */
function selectVideoBandwidthLevel(selector) { // was: Xc_
  const switchDownRatio = selector.policy.S;
  const headroom =
    getEffectiveBandwidthPerPlaybackRate(selector.isSamsungSmartTV) / switchDownRatio -
    formatByteCost(selector, selector.O.info);

  // Find highest-quality format that fits within the headroom
  let idx = selector.j.findIndex(info => formatByteCost(selector, info) < headroom);
  if (idx < 0) idx = 0;

  selector.L = idx;
  selector.nextVideo = selector.k0.W[selector.j[idx].id];
}

/**
 * Re-evaluate the video format during playback (steady-state ABR).
 * Called periodically; promotes or demotes the format based on current bandwidth.
 *
 * [was: oT]
 *
 * @param {object} selector
 */
export function reevaluateVideoFormat(selector) { // was: oT
  if (!selector.nextVideo || !selector.policy.j) {
    if (selector.W.isLocked()) {
      // Jump to locked quality extreme
      selector.nextVideo = selector.W.W <= 360
        ? selector.k0.W[selector.j[0].id]
        : selector.k0.W[selector.j[selector.j.length - 1].id];
    } else {
      let idx = Math.min(selector.L, selector.j.length - 1);
      const bw = getEffectiveBandwidthPerPlaybackRate(selector.isSamsungSmartTV);
      const currentCost = formatByteCost(selector, selector.O.info);

      // Try to step down if bandwidth is too low
      const headroomDown = bw / selector.policy.S - currentCost;
      while (idx > 0 && formatByteCost(selector, selector.j[idx]) > headroomDown) idx--;

      // Try to step up if bandwidth allows
      const headroomUp = bw / selector.policy.Y - currentCost;
      while (
        idx < selector.j.length - 1 &&
        formatByteCost(selector, selector.j[idx + 1]) < headroomUp
      ) idx++;

      selector.nextVideo = selector.k0.W[selector.j[idx].id];
      selector.L = idx;
    }
  }
}

function getEffectiveBandwidthPerPlaybackRate(config) {
  return getEffectiveBandwidth(config.Qp) / (config.playbackRate || 1);
}

// ---------------------------------------------------------------------------
// Audio format selection
// ---------------------------------------------------------------------------

/**
 * Select an audio format by track ID, falling back to default.
 * [was: oY_]
 *
 * @param {object} qualityState
 * @param {string} [trackId]
 * @returns {object|null}
 */
function selectAudioFormat(qualityState, trackId) { // was: oY_
  if (!trackId) return null;
  let match = qualityState.O?.O?.find(info => info.id === trackId);
  if (!match) {
    match = qualityState.O?.O?.find(info => !!info.miniplayerIcon?.isDefault);
  }
  return match ?? null;
}

/**
 * Apply user audio preferences (DRC, 5.1 surround, spatial audio filtering).
 * [was: WV]
 *
 * @param {object} selector
 */
function applyAudioPreferences(selector) { // was: WV
  if (!selector.O || (!selector.policy.j && !selector.O.info.miniplayerIcon)) {
    let candidates = selector.D.O;
    if (selector.O) {
      const filtered = candidates.filter(info => info.audio.W === selector.O.info.audio.W);
      if (filtered.length) candidates = filtered;
    }
    selector.O = selector.k0.W[candidates[0].id];

    if (candidates.length > 1 && !selector.policy.GT) {
      // Prefer lower quality audio unless surround is preferred
      if (!selector.policy.MS) {
        const lowQuality = candidates.find(
          info => info.audio.audioQuality !== 'AUDIO_QUALITY_HIGH'
        );
        if (lowQuality) selector.O = selector.k0.W[lowQuality.id];
      }
    }
  }
}

/**
 * Filter formats by DRC (Dynamic Range Compression) user preference.
 * [was: TQ_ / my]
 *
 * @param {Array} formats
 * @returns {Array}
 */
export function filterByDrcPreference(formats) { // was: TQ_
  // If user has DRC preference set, filter to DRC-enabled formats
  const drcPreferred = hasDrcPreference(); // was: g.UM("yt-player-drc-pref")
  return drcPreferred ? formats.filter(isDrcFormat) : formats;
}

function hasDrcPreference() { return false; }

/**
 * Check if a format is a DRC variant.
 * [was: my]
 *
 * @param {object} format
 * @returns {boolean}
 */
function isDrcFormat(format) { // was: my
  return format.audio?.W === true;
}

/**
 * Filter out high-quality audio formats when the user prefers standard quality.
 * [was: rSK / TD]
 *
 * @param {Array} formats
 * @returns {Array}
 */
export function filterByAudioQualityPreference(formats) { // was: rSK
  if (getAudioQualityMode() === 1) {
    return formats.filter(isHighQualityNonDefault);
  }
  return formats;
}

function getAudioQualityMode() { return 0; } // was: Bnx()

/**
 * Check if format is high-quality audio and not the default track.
 * [was: TD]
 */
function isHighQualityNonDefault(format) { // was: TD
  return format.audio?.audioQuality === 'AUDIO_QUALITY_HIGH' && !isDefaultTrack(format);
}

function isDefaultTrack(format) { return format.D(); } // was: Wp

// ---------------------------------------------------------------------------
// Quality constraint helpers
// ---------------------------------------------------------------------------

/**
 * Cap video candidates by the maximum quality ordinal in the constraint.
 * [was: UZW (referenced but not fully shown in source)]
 *
 * @param {object} selector
 * @param {Array} candidates
 * @param {object} constraint
 * @returns {Array}
 */
function applyQualityOrdinalCap(selector, candidates, constraint) {
  if (!constraint.W || constraint.W <= 0) return candidates;
  return candidates.filter(info => (info.video?.qualityOrdinal || 0) <= constraint.W);
}

function clearLockedQuality(state, value) { // was: cV
  if (state.W !== value) {
    state.W = value;
    state.A = true;
  }
}

function getDenyList(state) { return state.j || new Map(); } // was: QI
function applyLockedFormatOverride(selector, format, candidates) { return format; } // stub
function selectFallbackAudio(selector) { return null; } // was: e77

/**
 * Create a format-selection result snapshot.
 * [was: AqR]
 *
 * @param {object} selector
 * @returns {object} { audioFormat, videoFormat, reason }
 */
function createFormatSelection(selector) { // was: AqR
  if (selector.jG) {
    selector.jG = false;
  } else {
    selector.Y = Date.now();
  }
  selector.mF = false;
  selector.PA = false;
  return {
    audioFormat: selector.J,       // was: J (initial audio)
    videoFormat: selector.A,       // was: A (initial video)
    reason: selector.W?.reason,
  };
}

// ---------------------------------------------------------------------------
// SABR (Server ABR) client hints
// ---------------------------------------------------------------------------

/**
 * Build the client-state hints object sent to the SABR endpoint to
 * inform server-side adaptive bitrate decisions.
 *
 * [was: ZzX]
 *
 * @param {object} context  - SABR context with refs to player, estimator, config
 * @returns {object} hints payload
 */
export function buildSabrClientHints(context) { // was: ZzX
  const hints = {};
  const config = context.LayoutExitedMetadata;      // was: AJ — player config
  const estimator = context.Qp;   // was: Qp — bandwidth estimator
  const player = context.EH;      // was: EH — player instance
  const videoData = player.getVideoData();

  // Manual quality selection info
  const manualQuality = getManualQualitySelection(); // was: XU(0)
  if (manualQuality) {
    hints.LZ = manualQuality;
    hints.lastManualDirection = getLastManualDirection(); // was: rZK()
    const timeSince = getTimeSinceLastManualSelection(); // was: Xwd()
    if (timeSince > 0) {
      hints.timeSinceLastManualFormatSelectionMs = Date.now() - timeSince;
    }
  }

  // Bandwidth estimate
  if (estimator.mF || isEmbeddedIphone(config)) {
    hints.detectCapabilities = getEffectiveBandwidth(estimator);
  }

  // Viewport dimensions
  const isPortrait = videoData.cI();
  const baseHeight = QUALITY_MEDIUM_HEIGHT;
  const baseWidth = Math.floor(baseHeight * 16 / 9);
  const viewportWidth = isPortrait ? baseHeight : baseWidth;
  const viewportHeight = isPortrait ? baseWidth : baseHeight;

  const playerSize = player.createOneOffSigner();
  hints.L5 = Math.max(playerSize.width, viewportWidth);  // was: L5 — clientViewportWidth
  hints.dZ = Math.max(playerSize.height, viewportHeight); // was: dZ — clientViewportHeight

  // Visibility
  hints.visibility = player.getVisibilityState(); // was: U
  hints.g$ = getDisplayRefreshRate();              // was: YW()
  hints.Wg = player.getQoeTimestamp * 1000;                  // was: jM — media time offset ms

  // Quality policy composition
  const policyState = player.P9();
  hints.K9 = {
    defaultPolicy:  policyState?.tC?.W || 0,
    smooth:         policyState?.bF?.W || 0,
    visibility:     policyState?.getListenerMap?.W || 0,
    iD:             policyState?.SlotSignalMetadata?.W || 0,
    performance:    policyState?.b7?.W || 0,
    speed:          policyState?.getSourceBuffers?.W || 0,
  };
  hints.WQ = policyState?.zM?.W || 0;

  // Playback rate
  const rate = player.getPlaybackRate();
  if (rate !== 1) hints.playbackRate = rate;

  // Network interruption history
  hints.YY = estimator.interruptions?.[0] || 0;

  // Network type (if available)
  const connType = navigator.connection?.type;
  if (connType) {
    hints.detailedNetworkType = NETWORK_TYPE_MAP[connType] || NETWORK_TYPE_MAP.other;
  }

  return hints;
}

const QUALITY_MEDIUM_HEIGHT = 360; // was: g.EU.medium
const NETWORK_TYPE_MAP = { other: 0 }; // was: F0_

// Placeholder stubs
function getManualQualitySelection() { return 0; }
function getLastManualDirection() { return 0; }
function getTimeSinceLastManualSelection() { return 0; }
function isEmbeddedIphone(/* config */) { return false; }
function getDisplayRefreshRate() { return 60; }
