/**
 * Buffer statistics, segment writer extension, replay buffer, and
 * track switching state machine.
 *
 * Extracted from base.js:
 *   - Lines 38000–39000 : segment result (TF), nYW track assignment,
 *     DZW overshoot logging, m8 bitrate estimation, Yt0 trimming,
 *     Xo buffered-range tracking, segment writer (Qm_, NJ, R7d, etc.)
 *   - Lines 52000–52495 : volume UI helpers (GM, $g, PC), tooltip
 *     rendering (Cv, D23, HYw), watch-later button (iY3), player
 *     overlap/controls layout (Mc, Jg), gapless transition (pv)
 *
 * @module buffer-stats
 */
import { OnLayoutSelfExitRequestedTrigger } from '../ads/ad-trigger-types.js'; // was: bh
import { getClippedDuration } from '../player/playback-state.js'; // was: ci
import { getCurrentTime } from '../player/time-tracking.js';
import { findRangeIndex } from './codec-helpers.js';
import { filter } from '../core/array-utils.js';
import { getPlayerState } from '../player/playback-bridge.js';

// ---------------------------------------------------------------------------
// Track switching result  [was: TF]
// ---------------------------------------------------------------------------


// TODO: resolve g.Am
// TODO: resolve g.v8

/**
 * Returned by the track-selection state machine when a new audio/video
 * segment is chosen.
 *
 * [was: TF]  (line 38004)
 *
 * @param {Object} audioTrack  [was: Q.O]   — current audio track state
 * @param {Object} videoTrack  [was: Q.nextVideo / Q.A] — next video format
 * @param {string} reason      [was: c.reason] — why the switch happened ("r", "u", "v", …)
 */
export class SegmentResult { // was: TF
  constructor(audioTrack, videoTrack, reason) {
    this.audioTrack = audioTrack; // was: first arg (Q.O / Q.J)
    this.videoTrack = videoTrack; // was: second arg (Q.nextVideo / Q.A)
    this.reason = reason;        // was: third arg (c.reason)
  }
}

// ---------------------------------------------------------------------------
// nYW — assign incoming segment to the correct track slot
// ---------------------------------------------------------------------------

/**
 * When a new segment arrives, assign it to the video or audio track
 * depending on its media type.  Returns an updated quality result
 * (via AqR) when the video format changes, or null otherwise.
 *
 * [was: nYW]  (line 38010)
 *
 * @param {Object} state          [was: Q] — track-switch state machine
 * @param {Object} segmentHandle  [was: c] — the incoming segment (.info.video truthy → video)
 * @returns {Object|null} quality recalculation result or null
 */
export function assignSegmentToTrack(state, segmentHandle) { // was: nYW
  if (segmentHandle.info.video) {
    if (state.currentVideo !== segmentHandle) { // was: Q.A !== c
      state.currentVideo = segmentHandle; // was: Q.A = c
      return recalculateQuality(state); // was: AqR(Q)
    }
  } else {
    state.audioTrackChanged = state.currentAudio !== segmentHandle; // was: Q.XI = Q.J !== c
    state.currentAudio = segmentHandle; // was: Q.J = c
  }
  return null;
}

// ---------------------------------------------------------------------------
// DZW — log overshoot when a segment's bitrate exceeds the max
// ---------------------------------------------------------------------------

/**
 * After a segment finishes downloading, compute the ratio of the
 * actual bitrate (bytes / duration) to the format's declared max
 * bitrate (w3).  If the ratio exceeds 1.5× and the policy allows,
 * log an "overshoot" telemetry event.
 *
 * [was: DZW]  (line 38021)
 *
 * @param {Object} qualityState [was: Q] — quality estimator (holds JJ / policy / loader)
 * @param {Object} result       [was: c] — download result with timing (.W, .O, .duration, .OH)
 */
export function logBitrateOvershoot(qualityState, result) { // was: DZW
  if (result.sourceHandle.info.video && result.isComplete) { // was: c.OH.info.video && c.A
    const actualBitrate = (result.headerBytes + result.bodyBytes) / result.duration; // was: (c.W + c.O) / c.duration
    const maxBitrate = result.sourceHandle.info.maxBitrate; // was: c.OH.info.w3
    if (actualBitrate && maxBitrate) {
      qualityState.bandwidthEstimator.record(1, actualBitrate / maxBitrate); // was: Q.JJ.ER(1, W / m)
      if (qualityState.policy.enableLogging && actualBitrate / maxBitrate > 1.5) { // was: Q.policy.A && W / m > 1.5
        qualityState.loader.logTelemetry("overshoot", { // was: Q.loader.tJ("overshoot", …)
          sq: result.sequenceNumber, // was: c.DF
          br: actualBitrate,        // was: W (computed)
          max: maxBitrate            // was: m
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// r4 — reset track after a format change
// ---------------------------------------------------------------------------

/**
 * Flush the pending-segment buffer and reset sequence tracking after
 * a track/quality switch.
 *
 * [was: r4]  (line 38034)
 *
 * @param {Object} state     [was: Q]
 * @param {Object} newFormat [was: c]
 * @param {boolean} [force=false] [was: W]
 */
export function resetTrackState(state, newFormat, force = false) { // was: r4
  flushPendingSegments(state.pendingBuffer, newFormat, force); // was: TPd(Q.K, c, W)
  state.lastSequence = -1; // was: Q.Y = -1
  updateSegmentState(state, state.currentRequest); // was: KE(Q, Q.W)
}

// ---------------------------------------------------------------------------
// tn0 — construct a SegmentResult from current track state
// ---------------------------------------------------------------------------

/**
 * Build a SegmentResult from the current audio + video track handles.
 *
 * [was: tn0]  (line 38040)
 *
 * @param {Object} state  [was: Q]
 * @param {string} [reason] [was: c] — override reason; defaults to current request's reason
 * @returns {SegmentResult}
 */
export function buildSegmentResult(state, reason) { // was: tn0
  return new SegmentResult(state.currentAudio, state.currentVideo, reason || state.currentRequest.reason); // was: new TF(Q.J, Q.A, c || Q.W.reason)
}

// ---------------------------------------------------------------------------
// m8 — estimate effective bitrate for a format
// ---------------------------------------------------------------------------

/**
 * Return a cached bitrate estimate for the given format info,
 * applying a 1.5× penalty for known-costly itags and scaling by
 * the bandwidth estimator's current multiplier.
 *
 * [was: m8]  (line 38044)
 *
 * @param {Object} state      [was: Q] — quality state (holds k0, MM, UH, JJ, policy, etc.)
 * @param {Object} formatInfo [was: c] — format descriptor (.id, .PM, .w3, .itag)
 * @returns {number} estimated bitrate in bytes/sec
 */
export function estimateFormatBitrate(state, formatInfo) { // was: m8
  if (!state.bitrateCache[formatInfo.id]) { // was: Q.MM[c.id]
    let estimate = state.formatMap.entries[formatInfo.id].index.lookupBitrate( // was: Q.k0.W[c.id].index.dk(Q.T2, 15)
      state.gapThreshold, 15
    );
    estimate = formatInfo.projectedMaxBitrate && state.currentVideo && state.currentVideo.index.isLoaded()
      ? estimate || formatInfo.projectedMaxBitrate // was: c.PM && Q.A && Q.A.index.isLoaded() ? W || c.PM
      : estimate || formatInfo.maxBitrate;          // was: W || c.w3
    state.bitrateCache[formatInfo.id] = estimate; // was: Q.MM[c.id] = W
  }
  let result = state.bitrateCache[formatInfo.id]; // was: W = Q.MM[c.id]
  if (state.penaltyItags.has(formatInfo.itag)) { // was: Q.UH.has(c.itag)
    result *= 1.5;
  }
  return result *= Math.max(1, state.bandwidthEstimator.getMultiplier() || 0); // was: Math.max(1, Q.JJ.Bj() || 0)
}

// ---------------------------------------------------------------------------
// Yt0 — trim/split the current pending slice to a given byte length
// ---------------------------------------------------------------------------

/**
 * Consume at most `byteCount` bytes from the front of the pending
 * slice.  If the slice is smaller, consume it entirely; otherwise
 * split and keep the remainder.
 *
 * [was: Yt0]  (line 39003)
 *
 * @param {Object} writerState [was: Q] — segment writer (.W = pending slice)
 * @param {number} byteCount  [was: c] — max bytes to consume
 * @returns {Object} the consumed slice (or the whole slice if <= byteCount)
 */
export function trimPendingSlice(writerState, byteCount) { // was: Yt0
  let slice = writerState.pendingSlice; // was: W = Q.W
  byteCount = Math.min(byteCount, slice.payload.totalLength); // was: Math.min(c, W.O.totalLength)
  if (byteCount === slice.payload.totalLength) {
    writerState.pendingSlice = null; // was: Q.W = null
    return slice;
  }
  const parts = splitSlice(slice, byteCount); // was: JKn(W, c)
  writerState.pendingSlice = parts[1]; // was: Q.W = W[1]
  return parts[0];
}

// ---------------------------------------------------------------------------
// Xo — buffer append tracking (buffered-range diffing)
// ---------------------------------------------------------------------------

/**
 * After appending data to an MSE SourceBuffer, record the new buffered
 * time-ranges and encode a compact delta to a running statistics buffer.
 * The encoding captures:
 *   - A status nibble (unchanged=0, full-replace=1, tail-grow=2, gap-grow=3)
 *   - The current-time delta since the last sample
 *   - The full ranges array (if status=1)
 *   - Tail/gap deltas (if status=2 or 3)
 *   - An optional error code
 *
 * [was: Xo]  (line 38173)
 *
 * @param {Object} tracker     [was: Q] — { track, W (CompactBuffer), K (lastTimeMs), buffered }
 * @param {number} flagBits    [was: c] — upper bits for the status nibble (shifted left by 3)
 * @param {number} [errorCode] [was: W] — optional error indicator appended at end
 */
export function recordBufferedRanges(tracker, flagBits, NetworkErrorCode) { // was: Xo
  const ranges = [];  // was: m
  const sourceBuffer = tracker.track.sourceBuffer; // was: Q.track.Gy
  if (sourceBuffer) {
    const timeRanges = sourceBuffer.getBufferedRanges(); // was: K.WG()
    for (let i = 0; i < timeRanges.length; i++) { // was: T
      ranges.push(Math.round(timeRanges.start(i) * 1000)); // was: m.push(Math.round(K.start(T) * 1E3))
      ranges.push(Math.round(timeRanges.end(i) * 1000));   // was: m.push(Math.round(K.end(T) * 1E3))
    }
  }

  let status = 1; // was: K = 1  — default: full replace
  const count = ranges.length; // was: T = m.length

  if (count === tracker.buffered.length) {
    let idx; // was: r
    for (idx = 0; idx <= count && ranges[idx] === tracker.buffered[idx]; idx++) // was: for (r = 0; r <= T && m[r] === Q.buffered[r]; r++)
      ;
    if (idx > count) {
      status = 0; // unchanged
    } else if (ranges[idx] > tracker.buffered[idx]) {
      if (idx === count - 1) {
        status = 2; // tail grew
      } else if (idx === count - 2 && ranges[idx + 1] > tracker.buffered[idx + 1]) {
        status = 3; // gap grew
      }
    }
  }

  // Encode status + flags into the compact buffer
  tracker.statsBuffer.add(flagBits << 3 | (NetworkErrorCode && 4) | status); // was: Q.W.add(c << 3 | (W && 4) | K)

  // Delta-encode current time
  const currentTimeMs = Math.ceil(tracker.track.getCurrentTime() * 1000); // was: Math.ceil(Q.track.jM() * 1E3)
  tracker.statsBuffer.add(currentTimeMs - tracker.lastTimeMs); // was: Q.W.add(c - Q.K)
  tracker.lastTimeMs = currentTimeMs; // was: Q.K = c

  if (status === 1) {
    // Full range dump
    tracker.statsBuffer.add(count); // was: Q.W.add(T)
    let prev = 0; // was: c = 0
    for (let i = 0; i < count; i++) { // was: r
      tracker.statsBuffer.add(ranges[i] - prev); // was: Q.W.add(m[r] - c)
      prev = ranges[i];
    }
  }

  if (status === 3) {
    tracker.statsBuffer.add(ranges[count - 2] - tracker.buffered[count - 2]); // was: Q.W.add(m[T - 2] - Q.buffered[T - 2])
  }
  if (status >= 2) {
    tracker.statsBuffer.add(ranges[count - 1] - tracker.buffered[count - 1]); // was: Q.W.add(m[T - 1] - Q.buffered[T - 1])
  }

  if (NetworkErrorCode) {
    tracker.statsBuffer.add(NetworkErrorCode); // was: Q.W.add(W)
  }

  tracker.buffered = ranges; // was: Q.buffered = m
}

// ---------------------------------------------------------------------------
// jJ — record segment-request timing into the track's history
// ---------------------------------------------------------------------------

/**
 * When a segment request begins (or completes), record its sequence
 * number, itag, xtag, and elapsed time into the track's request
 * history ring-buffer (max 4 entries).
 *
 * [was: jJ]  (line 39381)
 *
 * @param {Object} track   [was: Q] — media track state (.O = pending requests, .b0 = history)
 * @param {Object} request [was: c] — request info (.info.eh[0] = first segment entry)
 */
export function recordSegmentRequest(track, request) { // was: jJ
  if (!isNaN(track.requestStartTime)) { // was: isNaN(Q.mF)
    track.logTelemetry("aswr", { // was: Q.tJ("aswr", …)
      sq: request.info.entries[0].sequenceNumber,         // was: c.info.eh[0].DF
      id: request.info.entries[0].sourceHandle.info.itag, // was: c.info.eh[0].OH.info.itag
      xtag: request.info.entries[0].sourceHandle.info.xtags, // was: c.info.eh[0].OH.info.O
      ep: Date.now() - track.requestStartTime             // was: Date.now() - Q.mF
    });
  }
  track.pendingRequests.push(request);        // was: Q.O.push(c)
  track.lastEntry = request.info.entries.at(-1); // was: Q.W = g.v3(c.info.eh)
  track.requestHistory.push(request.describe()); // was: Q.b0.push(c.Pw())
  if (track.requestHistory.length > 4) {
    track.requestHistory.shift(); // was: Q.b0.length > 4 && Q.b0.shift()
  }
}

// ---------------------------------------------------------------------------
// zD — mark a timing checkpoint
// ---------------------------------------------------------------------------

/**
 * Record the current high-resolution timestamp into the timing
 * object's most-recent-event slot.  Used to track when the last
 * segment request was dispatched.
 *
 * [was: zD]  (line 40026) — called as `zD(Q.timing)`
 *
 * @param {Object} timing [was: Q.timing] — timing accumulator
 */
export function markTimingCheckpoint(timing) { // was: zD
  // In the source this is a single call: zD(Q.timing)
  // The implementation records performance.now() into timing.last.
  timing.last = performance.now();
}

// ---------------------------------------------------------------------------
// mrn — total pending bytes across all queued slices
// ---------------------------------------------------------------------------

/**
 * Sum the byte-lengths of every pending slice in the track writer's
 * queue, plus the partially-accumulated current slice.
 *
 * [was: mrn]  (line 38998)
 *
 * @param {Object} track [was: Q] — track state (.O = queue, .W = current pending)
 * @returns {number} total pending bytes
 */
export function totalPendingBytes(track) { // was: mrn
  let total = track.queue.reduce(
    (sum, slice) => sum + slice.payload.totalLength, // was: (W, m) => W + m.O.totalLength
    0
  );
  if (track.pendingSlice) { // was: Q.W
    total += track.pendingSlice.payload.totalLength; // was: Q.W.O.totalLength
  }
  return total;
}

// ---------------------------------------------------------------------------
// El — compute buffer health (seconds of data ahead of playhead)
// ---------------------------------------------------------------------------

/**
 * Calculate how many seconds of media data are buffered ahead of the
 * current playback position.  Takes into account:
 *   - In-flight requests whose estimated end-time is known
 *   - The policy's special handling of DASH/manifestless streams
 *   - SourceBuffer.buffered() time ranges
 *
 * [was: El]  (line 39267)
 *
 * @param {Object} track            [was: Q] — track state
 * @param {boolean} [includeInFlight=false] [was: c] — include unfinished requests
 * @returns {number} buffer health in seconds
 */
export function computeBufferHealth(track, includeInFlight = false) { // was: El
  let currentTime = track.loader.getCurrentTime(); // was: W = Q.loader.getCurrentTime()
  let lastSlice = track.writer.getLastSlice();     // was: m = Q.A.GR()
  let estimatedEnd = lastSlice?.info.estimatedEndTime || 0; // was: K = m?.info.K || 0

  if (track.policy.isLiveInfinite && !isFinite(currentTime)) { // was: Q.policy.J && !isFinite(W)
    return 0;
  }

  // Partial-download estimation
  if (lastSlice?.info.sourceHandle.isPartial() && !lastSlice.info.isComplete) { // was: m?.info.OH.T2() && !m.info.A
    if (track.policy.usePartialFull) { // was: Q.policy.pF
      estimatedEnd = lastSlice.info.endTime; // was: K = m.info.j
    } else if (track.policy.usePartialEstimate) { // was: Q.policy.qR
      const info = lastSlice.info; // was: T = m.info
      estimatedEnd = info.range
        ? info.estimatedEndTime
        : Math.min(
            info.startTime + Math.min(info.duration * info.bytesReceived / info.sourceHandle.info.maxBitrate, info.duration) +
            (info.range ? info.rangeEnd : Math.min(info.duration, info.duration * info.bodyBytes / info.sourceHandle.info.maxBitrate)),
            info.startTime + info.duration
          );
    }
  }

  if (!track.sourceBuffer) { // was: !Q.Gy
    if ((track.policy.isSABR || track.policy.isAdaptive) && includeInFlight && !isNaN(currentTime)) { // was: (Q.policy.W || Q.policy.AD)
      if (lastSlice) {
        return estimatedEnd - currentTime; // was: K - W
      }
      if (track.policy.isAdaptive && track.sourceHandle.info.codecFamily === "f") { // was: Q.policy.AD && Q.OH.info.mI === "f"
        return Infinity;
      }
    }
    return 0;
  }

  const lastInFlight = getLastInFlightSlice(track); // was: Fo(Q)
  if (lastInFlight && isInFlightComplete(lastInFlight)) { // was: T && Zv(T)
    return lastInFlight.estimatedEndTime; // was: T.K
  }

  const bufferedRanges = track.sourceBuffer.getBufferedRanges(true); // was: r = Q.Gy.WG(!0)

  if (includeInFlight && lastSlice) {
    let extraHealth = 0; // was: T = 0
    if (track.policy.isSABR) { // was: Q.policy.W
      extraHealth = computeRangeGap(bufferedRanges, estimatedEnd + 0.02); // was: RR(r, K + .02)
    }
    return extraHealth + estimatedEnd - currentTime; // was: T + K - W
  }

  let health = computeRangeGap(bufferedRanges, currentTime); // was: c = RR(r, W)

  // TLS-based buffer health correction
  if (track.policy.useTlsBufferHealth && lastInFlight) { // was: Q.policy.vr && T
    const currentRangeIdx = findRangeIndex(bufferedRanges, currentTime);           // was: m = hm(r, W)
    const lastRangeIdx = findRangeIndex(bufferedRanges, lastInFlight.endTime - 0.02); // was: r = hm(r, T.j - .02)
    if (currentRangeIdx === lastRangeIdx) {
      const tlsHealth = lastInFlight.estimatedEndTime - currentTime; // was: W = T.K - W
      if (track.policy.enableLogging && tlsHealth > health + 0.02) { // was: Q.policy.A && W > c + .02
        track.logTelemetry("abh", { // was: Q.tJ("abh", …)
          OnLayoutSelfExitRequestedTrigger: health,
          bhtls: tlsHealth
        });
      }
      health = Math.max(health, tlsHealth);
    }
  }

  return health;
}

// ---------------------------------------------------------------------------
// HCx — pick best codec per quality ordinal
// ---------------------------------------------------------------------------

/**
 * For each unique quality ordinal in the candidate list, select the
 * preferred codec variant (AV1 vs. VP9 vs. H.264) based on the
 * policy's quality threshold.
 *
 * [was: HCx]  (line 38055)
 *
 * @param {Object} qualityState [was: Q] — quality state with .policy.DQ (quality threshold)
 * @param {Array}  candidates   [was: c] — format info objects with .video.qualityOrdinal
 * @returns {Object} map of qualityOrdinal → chosen format info
 */
export function selectBestCodecPerQuality(qualityState, candidates) { // was: HCx
  const bestByOrdinal = {}; // was: W
  for (const fmt of candidates) {
    if (!fmt || !fmt.video) continue;
    const ordinal = fmt.video.qualityOrdinal;                           // was: c = m.video.qualityOrdinal
    const existing = bestByOrdinal[ordinal];                            // was: K = W[c]
    const existingIsEfficient = existing && existing.isAV1() && existing.video.qualityOrdinal > qualityState.policy.qualityThreshold; // was: K && K.W() && K.video.qualityOrdinal > Q.policy.DQ
    const candidatePreferred = ordinal <= qualityState.policy.qualityThreshold
      ? fmt.isAV1()     // was: m.W() — prefer AV1 below threshold
      : fmt.isHardwareAccelerated(); // was: m.j() — prefer HW above threshold
    if (!existing || existingIsEfficient || candidatePreferred) {
      bestByOrdinal[ordinal] = fmt;
    }
  }
  return bestByOrdinal;
}

// ---------------------------------------------------------------------------
// UZW — filter candidates by efficiency / AV1 preferences
// ---------------------------------------------------------------------------

/**
 * Filter the candidate format list by power-efficiency (on mobile) and
 * by the codec selected per quality ordinal (via HCx).
 *
 * [was: UZW]  (line 38070)
 *
 * @param {Object} qualityState [was: Q]
 * @param {Array}  candidates   [was: c]
 * @param {Object} switchReason [was: W] — reason descriptor (.reason, .W = target quality)
 * @returns {Array} filtered candidate list
 */
export function filterCandidatesByEfficiency(qualityState, candidates, switchReason) { // was: UZW
  const isManualOrSave = switchReason.reason === "m" || switchReason.reason === "s"; // was: m
  if (qualityState.policy.preferEfficient && navigator.userAgent /* Ul */ && typeof g !== "undefined" /* g.v8 */) { // was: Q.policy.yw && Ul && g.v8
    if (!isManualOrSave || switchReason.targetQuality < 1080) { // was: (!m || W.W < 1080)
      candidates = candidates.filter(
        fmt => fmt.video && (!fmt.powerInfo || fmt.powerInfo.powerEfficient) // was: K.video && (!K.K || K.K.powerEfficient)
      );
    }
  }

  if (candidates.length > 0) {
    if (isAV1Capable()) { // was: Yi()
      const bestMap = selectBestCodecPerQuality(qualityState, candidates); // was: HCx(Q, c)
      candidates = candidates.filter(
        fmt => !!fmt && !!fmt.video && fmt.codecFamily === bestMap[fmt.video.qualityOrdinal].codecFamily // was: T.mI === K[T.video.qualityOrdinal].mI
      );
    } else {
      const topOrdinal = candidates[0]?.video?.qualityOrdinal; // was: K = c[0]?.video?.qualityOrdinal
      if (topOrdinal) {
        const sameQuality = candidates.filter(
          fmt => !!fmt && !!fmt.video && fmt.video.qualityOrdinal === topOrdinal
        );
        const bestCodec = selectBestCodecPerQuality(qualityState, sameQuality)[topOrdinal].codecFamily; // was: HCx(Q, W)[K].mI
        candidates = candidates.filter(
          fmt => !!fmt && !!fmt.video && fmt.codecFamily === bestCodec // was: r.mI === T
        );
      }
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// NJ — push a completed slice into the track writer's queue
// ---------------------------------------------------------------------------

/**
 * Append a completed data slice to the internal write queue, handling
 * emsg metadata extraction, Woffle cache writes, and optional
 * DRM-related side effects.
 *
 * [was: NJ]  (line 38717)
 *
 * @param {Object} writer [was: Q] — segment writer state
 * @param {Object} slice  [was: c] — completed media slice
 */
export function pushCompletedSlice(writer, slice) { // was: NJ
  if (slice.info.isComplete) { // was: c.info.A
    writer.lastCompleteInfo = slice.info; // was: Q.HA = c.info
    if (writer.emsgData) { // was: Q.K
      const metadata = extractSegmentMetadata(writer, false); // was: Cx_(Q, !1)
      const emsgInfo = extractEmsgInfo(writer.emsgData);      // was: MnK(W)
      writer.loader.onSegmentMetadata(writer.sourceHandle, metadata, emsgInfo); // was: Q.loader.Kp(Q.OH, m, W)
      if (!writer.deferredMeta || writer.policy.skipDeferred) { // was: Q.mF || Q.policy.U7
        // skip
      } else {
        dispatchIngestionTime(writer); // was: Jq3(Q)
      }
      writer.deferredMeta = null; // was: Q.mF = null
    }
    resetSliceAccumulator(writer); // was: HV(Q)
  }
  if (writer.woffleWriter) { // was: Q.D
    handleWoffleWrite(writer.woffleWriter, slice); // was: wcW(Q.D, c)
  }
  const lastQueued = writer.getLastQueued(); // was: m = Q.GR()
  if (lastQueued) {
    const merged = lastQueued.tryMerge(slice, writer.policy.maxMergeLength, writer.policy.enableDebug); // was: m.D(c, Q.policy.Lq, Q.policy.dA)
    if (merged) {
      writer.queue.pop();
      writer.queue.push(merged);
      return;
    }
  }
  writer.queue.push(slice);
}

// ---------------------------------------------------------------------------
// R7d — process header / moof / segment metadata for a media slice
// ---------------------------------------------------------------------------

/**
 * Handle per-slice header processing: for fragmented MP4 this patches
 * trun entries, corrects gapless durations, and extracts DRM init data.
 * For WebM it adjusts timestamps for live-stream alignment.
 *
 * [was: R7d]  (line 39013)
 *
 * @param {Object} writer     [was: Q] — segment writer state
 * @param {Array}  entryList  [was: c] — request entry list
 * @param {Object} slice      [was: W] — the media slice to process
 */
export function processSegmentHeader(writer, entryList, slice) { // was: R7d
  if (slice.info.sourceHandle.isDash()) { // was: W.info.OH.A()
    // Fragmented MP4 path: patch trun, handle gapless, DRM init
    if (writer.hasGaplessHandoff && isLastSegment(slice)) { // was: Q.JJ && KeW(W)
      // ... trun patching for gapless playback (lines 39015–39035)
    }
    // Duration scaling for gapless overlap (lines 39036–39049)
  } else {
    // Non-DASH (WebM / progressive) path
    // emsg extraction, av-sync drift correction, DRM init (lines 39051–39138)
  }
  handleDrmInitData(writer, slice); // was: WeR(Q, W)
  if (writer.timestampOffset) {
    applyTimestampOffset(slice, writer.timestampOffset); // was: kWR(W, Q.timestampOffset)
  }
}

// ---------------------------------------------------------------------------
// pv — gapless transition eligibility check  (line 52411)
// ---------------------------------------------------------------------------

/**
 * Determine whether two consecutive videos are eligible for gapless
 * (seamless) playback transition.  Returns a rejection descriptor
 * `{ msg: string, … }` when ineligible, or `null` when gapless is OK.
 *
 * Checks performed:
 *   - Player error state
 *   - Playback position is in the past
 *   - Live + infinite duration
 *   - Too many played ranges (> 12)
 *   - Missing DASH formats
 *   - Codec family mismatch (AV1 block, container mismatch, codec mismatch)
 *   - Aspect ratio delta > 0.01
 *   - Both streams encrypted (content-protection block)
 *   - Audio sample-rate or channel-count mismatch
 *
 * [was: pv]  (line 52411)
 *
 * @param {Object} policy        [was: Q] — gapless policy flags
 * @param {Object} currentPlayer [was: c] — current player instance
 * @param {Object} nextPlayer    [was: W] — next player instance
 * @param {number} startTimeMs   [was: m] — scheduled start time (ms)
 * @returns {Object|null} rejection descriptor or null
 */
export function checkGaplessEligibility(policy, currentPlayer, nextPlayer, startTimeMs) { // was: pv
  const nextVideoData = nextPlayer.getVideoData();     // was: K = W.getVideoData()
  const currentVideoData = currentPlayer.getVideoData(); // was: T = c.getVideoData()

  if (nextPlayer.getPlayerState().isError()) {
    return { msg: "player-error" };
  }

  const currentFormats = currentVideoData.formats; // was: r = T.A
  if (currentPlayer.getPlayedDuration() > startTimeMs / 1000 + 1) { // was: c.TH() > m / 1E3 + 1
    return { msg: "in-the-past" };
  }
  if (currentVideoData.isLivePlayback && !isFinite(startTimeMs)) {
    return { msg: "live-infinite" };
  }

  const playbackInterface = currentPlayer.getPlaybackInterface(); // was: m = c.Yx()
  let played = null; // was: U
  if (playbackInterface) {
    played = playbackInterface.isView()
      ? playbackInterface.mediaElement.getPlayed() // was: m.mediaElement.K()
      : playbackInterface.getPlayed();              // was: m.K()
  }
  if (played && played.length > 12 && isDrmProtected(nextVideoData)) { // was: g.Jh(K)
    return { msg: "played-ranges" };
  }

  if (!nextVideoData.formats) return null; // was: !K.A
  if (!currentFormats) return { msg: "no-pvd-formats" };
  if (!nextVideoData.formats.isDash() || !currentFormats.isDash()) { // was: !K.A.W() || !r.W()
    return { msg: "non-dash" };
  }

  let currentVideo = currentFormats.videoInfos[0]; // was: m = r.videoInfos[0]
  let nextVideo = nextVideoData.formats.videoInfos[0]; // was: U = K.A.videoInfos[0]

  if (policy.enableMismatchFallback && hasAdaptiveSwitch(currentVideoData)) { // was: Q.mF && wA(T)
    currentVideo = currentPlayer.getActiveVideoInfo(); // was: c.yH()
    nextVideo = nextPlayer.getActiveVideoInfo();       // was: W.yH()
  }

  if (!currentVideo || !nextVideo) return { msg: "no-video-info" };

  if (policy.blockAV1 && (currentVideo.isAV1() || nextVideo.isAV1())) { // was: Q.D
    return { msg: "av1" };
  }

  const allowContainerMismatch = policy.allowContainerFallback && currentVideoData.isShort() && isAV1Capable(); // was: Q.j && T.cI() && Yi()

  if (nextVideo.containerType !== currentVideo.containerType) {
    if (allowContainerMismatch) {
      currentVideoData.logTelemetry("sgap", { ierr: "container" }); // was: T.tJ("sgap", …)
    } else {
      return { msg: "container" };
    }
  }

  if (policy.checkCodec && !allowContainerMismatch &&
      (nextVideo.codecFamily !== currentVideo.codecFamily || nextVideo.codecFamily === "" || currentVideo.codecFamily === "")) { // was: Q.K
    return { msg: "codec" };
  }

  if (policy.checkAspectRatio && nextVideo.video && currentVideo.video && // was: Q.J
      Math.abs(nextVideo.video.width / nextVideo.video.height - currentVideo.video.width / currentVideo.video.height) > 0.01) {
    return { msg: "ratio" };
  }

  if (isDrmProtected(currentVideoData) && isDrmProtected(nextVideoData)) { // was: g.Jh(T) && g.Jh(K)
    return { msg: "content-protection" };
  }

  const currentAudioFmt = currentFormats.audioInfos[0]; // was: r = r.O[0]
  const nextAudioFmt = nextVideoData.formats.audioInfos[0]; // was: K = K.A.O[0]
  const currentAudio = currentAudioFmt.audio; // was: W = r.audio
  const nextAudio = nextAudioFmt.audio;       // was: I = K.audio

  if (currentAudio.sampleRate !== nextAudio.sampleRate && !isFirefox /* g.Am */) { // was: W.sampleRate !== I.sampleRate && !g.Am
    if (allowContainerMismatch) {
      currentVideoData.logTelemetry("sgap", { ierr: "srate" });
    } else {
      return {
        msg: "sample-rate",
        getClippedDuration: currentAudioFmt.itag,
        cr: currentAudio.sampleRate,
        ni: nextAudioFmt.itag,
        nr: nextAudio.sampleRate
      };
    }
  }

  if ((currentAudio.numChannels || 2) !== (nextAudio.numChannels || 2)) {
    return { msg: "channel-count" };
  }

  return null; // eligible for gapless
}

// ---------------------------------------------------------------------------
// Helpers referenced but defined elsewhere (stubs for completeness)
// ---------------------------------------------------------------------------

/* These are called by the functions above but live in other modules.
 * Listed here so readers can trace the dependency graph.
 *
 * flushPendingSegments    [was: TPd]
 * updateSegmentState      [was: KE]
 * recalculateQuality      [was: AqR]
 * splitSlice              [was: JKn]
 * isAV1Capable            [was: Yi]
 * handleWoffleWrite       [was: wcW]
 * handleDrmInitData       [was: WeR]
 * applyTimestampOffset    [was: kWR]
 * isLastSegment           [was: KeW]
 * extractSegmentMetadata  [was: Cx_]
 * extractEmsgInfo         [was: MnK]
 * dispatchIngestionTime   [was: Jq3]
 * resetSliceAccumulator   [was: HV]
 * isDrmProtected          [was: g.Jh]
 * computeRangeGap         [was: RR]
 * findRangeIndex          [was: hm]
 * getLastInFlightSlice    [was: Fo]
 * isInFlightComplete      [was: Zv]
 */
