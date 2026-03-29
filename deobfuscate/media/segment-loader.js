/**
 * Segment loading and request management.
 *
 * Extracted from base.js lines ~39000-42000.
 * Covers segment request scheduling, bandwidth-based segment selection,
 * segment fetch/abort logic, and request lifecycle management.
 *
 * @module segment-loader
 */
import { findBox, readUint16, rewriteTimestamps, stripBox } from './format-setup.js';
import { readUint8, readUint32 } from '../modules/caption/caption-internals.js';
import { getDuration, getCurrentTime } from '../player/time-tracking.js';
import { handleError } from '../player/context-updates.js';
import { computeBufferHealth } from './buffer-stats.js';
import { DashSegmentRequest } from './playback-controller.js';

// ---------------------------------------------------------------------------
// Segment slice / data helpers
// ---------------------------------------------------------------------------

/**
 * Computes the total pending byte length across all queued segment data.
 * [was: unnamed function around line 39000]
 *
 * @param {object} track - Track state object [was: Q]
 * @returns {number} Total bytes pending
 */
export function getPendingByteLength(track) { // was: unnamed fn ~39000
  let total = 0; // was: c
  if (track.pendingData) { // was: Q.W
    total += track.pendingData.payload.totalLength; // was: Q.W.O.totalLength
  }
  return total;
}

/**
 * Splits pending data at the given byte offset, returning the first portion
 * and leaving the remainder in the track.
 * [was: Yt0]
 *
 * @param {object} track - Track state [was: Q]
 * @param {number} byteOffset - Split point [was: c]
 * @returns {object} First data portion [was: W]
 */
export function splitPendingData(track, byteOffset) { // was: Yt0
  let data = track.pendingData; // was: W = Q.W
  byteOffset = Math.min(byteOffset, data.payload.totalLength);
  if (byteOffset === data.payload.totalLength) {
    track.pendingData = null; // was: Q.W = null
    return data;
  }
  const parts = splitSegmentData(data, byteOffset); // was: JKn(W, c)
  track.pendingData = parts[1]; // was: Q.W = W[1]
  return parts[0];
}

// ---------------------------------------------------------------------------
// Segment processing — init segments, media segments, emsg
// ---------------------------------------------------------------------------

/**
 * Processes a received segment chunk, handling init segments (moov/webm header),
 * media segments, emsg boxes, AV sync rewriting, and timestamp offsets.
 * [was: R7d]
 *
 * @param {object} sourceBufferState - Source buffer state [was: Q]
 * @param {Array} pendingSlices - Pending slices list [was: c]
 * @param {object} segment - Received segment chunk [was: W]
 */
export function processReceivedSegment(sourceBufferState, pendingSlices, segment) { // was: R7d
  if (segment.info.formatHandle.isIndexLoaded()) { // was: W.info.OH.A()
    // Handle indexed (media) segments
    if (sourceBufferState.avSyncEnabled && isFirstSegment(segment)) { // was: Q.JJ && KeW(W)
      const dataView = getSegmentDataView(segment); // was: g.kV(W)
      const trunBox = findBox(dataView, 0, 0x74727566 /* 'trun' */); // was: g.YD(c, 0, 1953658222)
      if (trunBox) {
        trunBox.skip(1);
        const flags = (readUint16(trunBox) << 16) | readUint8(trunBox); // was: v2(m) << 16 | al(m)
        const hasDataOffset = flags & 1; // was: T
        const hasSampleFlags = flags & 4; // was: r
        if (flags & 256) {
          const hasSampleDuration = flags & 512; // was: c
          const hasSampleSize = flags & 1024; // was: U
          const hasSampleCompositionOffset = flags & 2048; // was: K
          const sampleCount = readUint32(trunBox); // was: $D(m) -> I
          if (sampleCount >= 2) {
            if (hasDataOffset) trunBox.skip(4);
            if (hasSampleFlags) trunBox.skip(4);
            const firstSampleDuration = readUint32(trunBox); // was: T = $D(m)
            const skipSize = (sampleCount - 1) *
              (4 + (hasSampleDuration ? 4 : 0) + (hasSampleSize ? 4 : 0) +
               (hasSampleCompositionOffset ? 4 : 0)) - 4;
            trunBox.skip(skipSize);
            trunBox.data.setUint32(
              trunBox.offset + trunBox.position, // was: m.offset + m.W
              firstSampleDuration
            );
          }
        }
      }
    }

    // Companion track duration alignment check
    let needsDurationAlignment = sourceBufferState.companionTrack &&
      !!sourceBufferState.companionTrack.formatHandle.companionTrack; // was: c = Q.b0 && !!Q.b0.OH.b0

    if (needsDurationAlignment) {
      needsDurationAlignment = segment.info.isKeyframe(); // was: c = W.info.MK()
      if (needsDurationAlignment) {
        const segmentPts = getSegmentPresentationTime(segment); // was: p1X(W) -> c
        const companion = sourceBufferState.companionTrack; // was: U = Q.b0
        // Use high-precision comparison if available
        needsDurationAlignment =
          getEndTime(sourceBufferState, segmentPts) >=
          getEndTime(companion) + (1 / segmentPts); // simplified
        needsDurationAlignment = !needsDurationAlignment;
      }
    }

    if (needsDurationAlignment && isFirstSegment(segment)) {
      const companion = sourceBufferState.companionTrack; // was: c = Q.b0
      const durationDiff = companion.getDuration() - sourceBufferState.getDuration(); // was: c = c.getDuration() - Q.getDuration()
      const scaleFactor = 1 + durationDiff / segment.info.duration; // was: c = 1 + c / W.info.duration
      rewriteTimestamps(getSegmentDataView(segment), scaleFactor); // was: RX0(g.kV(W), c)
    }
  } else {
    // Handle non-indexed segments (init segments, emsg messages)
    let isNewEmsg = false; // was: m
    if (!sourceBufferState.emsgData) { // was: Q.K
      parseEmsgBoxes(segment); // was: crK(W)
      if (segment.emsgData) { // was: W.W
        sourceBufferState.emsgData = segment.emsgData; // was: Q.K = W.W
        isNewEmsg = true;
        const segmentInfo = segment.info; // was: T = W.info
        const emsgSegNum = segment.emsgData.segmentNumber; // was: r = W.W.segmentNumber
        segmentInfo.updateSource = "updateWithEmsg"; // was: T.J = "updateWithEmsg"
        segmentInfo.segmentNumber = emsgSegNum; // was: T.DF = r

        // Update index state from emsg
        const emsgState = segment.emsgData; // was: T = W.W
        if (emsgState.hasEndOfStream) { // was: T.D
          const index = sourceBufferState.formatHandle.index; // was: r = Q.OH.index
          index.emsgEndOfStream = !emsgState.hasEndOfStream; // was: r.K = !T.D
          index.endReason = "emsg"; // was: r.D = "emsg"
        }

        // Rewrite container structure based on format type
        const formatInfo = segment.info.formatHandle.info; // was: T = W.info.OH.info
        const dataView = getSegmentDataView(segment); // was: r = g.kV(W)
        if (isMp4Format(formatInfo)) { // was: g.Gb(T)
          stripBox(dataView, 0x656D7367 /* 'emsg' */); // was: mC(r, 1701671783)
        } else if (formatInfo.isWebM()) { // was: T.wH()
          stripEbmlElement([408125543], 307544935, dataView); // was: IX([408125543], 307544935, r)
        }
      }
    }

    // Process media duration and accumulate
    const mediaDuration = getMediaDuration(segment, sourceBufferState.policy.useExactDuration); // was: T = Wr(W, Q.policy.iX)
    if (mediaDuration && hasAudioVideoSync(segment)) { // was: T && QQy(W)
      const driftCompensation = computeDriftCompensation(sourceBufferState, segment); // was: r = Tcy(Q, W)
      sourceBufferState.driftAccumulator += driftCompensation; // was: Q.J += r
      const adjustedDuration = mediaDuration - driftCompensation; // was: T -= r
      sourceBufferState.appendedDuration += adjustedDuration; // was: Q.Y += T
      sourceBufferState.currentEndTime = sourceBufferState.policy.useTimestampRewriting
        ? sourceBufferState.currentEndTime + adjustedDuration
        : NaN; // was: Q.A = Q.policy.mA ? Q.A + T : NaN
    } else {
      // Detailed AV sync checking and slice rewriting
      if (sourceBufferState.policy.enableAVSync) { // was: Q.policy.Cq
        let sliceStartTime = sourceBufferState.loader.getSliceStartTime(
          getSegmentInfo(segment), 1
        ); // was: r = I = Q.loader.h7(g.QP(W), 1)

        if (sourceBufferState.currentEndTime >= 0 && segment.info.type !== 6) {
          // AV sync drift detection and logging
          const totalDrift = sliceStartTime - sourceBufferState.currentEndTime; // was: K = I - Q.A
          const segmentDrift = totalDrift - sourceBufferState.driftAccumulator; // was: X = K - Q.J
          const currentSq = segment.info.segmentNumber; // was: A = W.info.DF
          const lastSq = sourceBufferState.lastSegmentInfo
            ? sourceBufferState.lastSegmentInfo.segmentNumber : -1; // was: e = Q.Ie ? Q.Ie.DF : -1

          const isExcessiveDrift = Math.abs(segmentDrift) > 10; // was: S
          const isLargeDrift = sourceBufferState.policy.maxDriftPerTrack &&
            totalDrift > sourceBufferState.policy.maxDriftPerTrack; // was: n

          if (Math.abs(segmentDrift) > 1e-4) {
            sourceBufferState.discontinuityCount += 1; // was: Q.Ka += 1
            sourceBufferState.loader.handleError("qoe.avsync", {
              audio: `${+sourceBufferState.isAudioTrack()}`,
              sq: currentSq.toFixed(),
              sliceStart: sliceStartTime,
              lastSq: lastSq.toFixed(),
              totalDrift: (totalDrift * 1000).toFixed(),
              segDrift: (segmentDrift * 1000).toFixed(),
              skipRewrite: `${+(isLargeDrift || isExcessiveDrift)}`
            });
            sourceBufferState.lastDriftSegment = currentSq; // was: Q.UH = A
          }

          // Apply rewrite unless drift is too large
          const isIdentical = Math.abs(sourceBufferState.currentEndTime - sliceStartTime) < 1e-7;
          if (!(isLargeDrift || isExcessiveDrift || isIdentical)) {
            sliceStartTime = sourceBufferState.currentEndTime; // was: r = Q.A
          }
        }
      } else {
        // Simple start-time fallback
        const sliceStartTime = isNaN(sourceBufferState.currentEndTime)
          ? segment.info.startTime
          : sourceBufferState.currentEndTime; // was: r = isNaN(Q.A) ? W.info.startTime : Q.A
      }

      // Attempt to rewrite the segment and update state
      if (rewriteSegmentTimestamps(sourceBufferState, segment, sliceStartTime)) { // was: o7K(Q, W, r)
        sourceBufferState.appendedDuration += mediaDuration; // was: Q.Y += T
        sourceBufferState.currentEndTime = sliceStartTime + mediaDuration; // was: Q.A = r + T
        // Check for excessive discontinuity rewrites
        if (sourceBufferState.policy.maxDiscontinuityRewriteCount &&
            sourceBufferState.discontinuityCount >=
            sourceBufferState.policy.maxDiscontinuityRewriteCount) {
          sourceBufferState.discontinuityCount = 0;
          sourceBufferState.loader.resetMediaStream({
            resetForRewrites: "count"
          });
        }
      }
    }

    // Update tracking state
    sourceBufferState.lastSegmentInfo = segment.info; // was: Q.Ie = W.info
    sourceBufferState.lastSegmentDuration = getChunkDuration(segment); // was: Q.PA = cr(W)
    if (segment.startTimeOffset >= 0) { // was: W.A >= 0
      sourceBufferState.lastSliceStart = segment.startTimeOffset; // was: Q.XI = W.A
    }

    // Process new emsg data for live manifest updates
    if (isNewEmsg && sourceBufferState.emsgData) {
      const liveMetadata = createLiveMetadata(sourceBufferState, true); // was: m = Cx_(Q, !0)
      applyMetadataToSegment(segment.info, liveMetadata); // was: aX(W.info, m)

      if (sourceBufferState.pendingData) {
        applyMetadataToSegment(sourceBufferState.pendingData.info, liveMetadata);
      }

      for (const slice of pendingSlices) {
        if (!sourceBufferState.policy.hasEndOfStream ||
            slice.segmentNumber === sourceBufferState.emsgData?.segmentNumber) {
          applyMetadataToSegment(slice, liveMetadata);
        }
      }

      // Emit metadata to the loader
      if ((segment.info.isInitSegment || (sourceBufferState.pendingData &&
           sourceBufferState.pendingData.info.isInitSegment)) &&
          segment.info.type !== 6) {
        // Skip for init segments
      } else {
        sourceBufferState.lastLiveMetadata = liveMetadata; // was: Q.mF = m
        if (sourceBufferState.policy.useEmsgUpdates) { // was: Q.policy.O
          const emsgPayload = extractEmsgPayload(sourceBufferState.emsgData); // was: c = MnK(Q.K)
          sourceBufferState.loader.onLiveMetadata(
            sourceBufferState.formatHandle, liveMetadata, emsgPayload
          );
        } else {
          const loader = sourceBufferState.loader;
          if (loader.mediaState.isManifestless) {
            updateManifestlessState(loader, liveMetadata, null,
              !!sourceBufferState.formatHandle.info.video);
          }
        }
        if (!sourceBufferState.policy.skipEmsgIngestion) { // was: Q.policy.U7
          processEmsgForIngestion(sourceBufferState); // was: Jq3(Q)
        }
      }
    }
  }

  // Finalize: mark the segment as received and apply timestamp offset
  markSegmentReceived(sourceBufferState, segment); // was: WeR(Q, W)
  if (sourceBufferState.timestampOffset) {
    applyTimestampOffset(segment, sourceBufferState.timestampOffset); // was: kWR(W, Q.timestampOffset)
  }
}

// ---------------------------------------------------------------------------
// Segment request creation and scheduling
// ---------------------------------------------------------------------------

/**
 * Determines whether a new segment request should be issued for a given track,
 * considering buffer health, active requests, rate limiting, and ad state.
 * [was: MJ]
 *
 * @param {object} requestManager - Request manager state [was: Q]
 * @param {object} track - Track to check [was: c]
 * @param {object} otherTrack - Companion track [was: W]
 * @returns {boolean} True if a request should be scheduled
 */
export function shouldScheduleRequest(requestManager, track, otherTrack) { // was: MJ
  if (requestManager.policy.disableRequestScheduling) return false; // was: Q.policy.qY

  // Check ad-related halting conditions
  const adState = requestManager.adState; // was: Q.W -> m
  const lastCompletedSq = track.pendingData?.completedSq() || -1; // was: K
  // ... (simplified from complex halting logic)

  if (!track.pendingData?.formatHandle?.resourcePool?.canRequest(
    requestManager.policy, requestManager.bandwidthState,
    requestManager.loader.retryGeneration
  )) {
    return false;
  }

  if (requestManager.loader.isSuspended &&
      (!isScheduleActive(requestManager.schedule) || requestManager.loader.networkBlocked)) {
    return false;
  }

  // Pipeline / manifestless checks
  if (requestManager.mediaState.isManifestless) {
    if (track.activeRequests.length > 0 && track.pendingData &&
        track.pendingData.segmentNumber === -1) {
      return false;
    }
    if (track.activeRequests.length >= requestManager.policy.maxPipelineDepth) { // was: Q.policy.fY
      return false;
    }
  }

  // If no pending segment exists, create one
  if (!track.pendingData) {
    if (!track.formatHandle.isIndexLoaded()) return false;
    seekToCurrentTime(track, requestManager.loader.getCurrentTime()); // was: tM(c, Q.loader.getCurrentTime())
  }

  // Ensure we do not exceed max concurrent requests
  const totalActive = track.activeRequests.length + otherTrack.activeRequests.length;
  const hasActive = (track.activeRequests.length ?
    track.activeRequests[0].isPartiallyLoaded() : false) ||
    (otherTrack.activeRequests.length ?
      otherTrack.activeRequests[0].isPartiallyLoaded() : false) ||
    requestManager.mediaState.isLive;

  let adjustedTotal = totalActive;
  if (hasActive) adjustedTotal--;
  if (adjustedTotal + 1 >= requestManager.policy.maxConcurrentRequests) { // was: Q.policy.mX
    return false;
  }

  const nextSegment = track.pendingData; // was: m = c.W
  if (!nextSegment) return true;

  // Check segment validity
  if (nextSegment.isEndOfStream() && nextSegment.formatHandle.isIndexLoaded()) {
    return false;
  }

  // Audio-only or EOS segments don't need further checks
  if ((nextSegment.formatHandle.info.audio && nextSegment.isEndOfStream()) ||
      nextSegment.isLastSegment()) {
    return false;
  }

  // Ensure readahead doesn't exceed max allowed
  const maxReadahead = computeMaxReadahead(requestManager, track); // was: dr_(Q, c)
  if (isValidSegment(nextSegment) && nextSegment.endTime > maxReadahead) {
    return false;
  }

  // Check source buffer lock state
  if (track.sourceBuffer?.isLocked()) return false;

  return true;
}

/**
 * Creates a new segment request object (DASH/XHR-based) for the given
 * segment info, wiring up the response callback.
 * [was: We]
 *
 * @param {object} requestManager - Request manager [was: Q]
 * @param {object} segmentInfo - Segment info to fetch [was: c]
 * @returns {object} Newly created request [was: xU instance]
 */
export function createSegmentRequest(requestManager, segmentInfo) { // was: We
  requestManager.loader.trackRequest(segmentInfo); // was: Q.loader.RX(c)
  const totalBytes = computeTotalBytes(segmentInfo); // was: W = LU0(c)
  const schedulerState = requestManager.loader.getSchedulerState(); // was: m = Q.loader.dw()

  const options = {
    scheduler: requestManager.schedule, // was: Qp
    totalBytes: totalBytes, // was: VD
    estimatedDuration: estimateDuration(requestManager.bandwidthEstimator, totalBytes), // was: xf: Sjd(Q.j, W)
    isSubfragmented: isSubfragmented(segmentInfo.segments[0]), // was: B5: jw(c.eh[0])
    isJumboRequest: isJumboRequest(segmentInfo), // was: jp
    enableDebugLogging: requestManager.policy.enableDebugLogging, // was: Ft
    onBandwidthUpdate: (bytesLoaded, elapsed) => {
      requestManager.loader.updateBandwidth(bytesLoaded, elapsed);
    }
  };

  const requestConfig = {
    bufferHealth: computeBufferHealth(segmentInfo, requestManager.loader.getCurrentTime()), // was: qH
    serverBitrateEstimates: requestManager.policy.enableServerBitrateEstimates &&
      hasInitSegment(segmentInfo) && segmentInfo.segments[0].formatHandle.info.video
        ? getServerBitrateEstimates(requestManager.bitrateEstimator) : undefined, // was: ZD
    isSmallBuffer: requestManager.policy.enableSmallBufferMode, // was: Y7
    poToken: requestManager.loader.getPoToken(), // was: poToken
    authContext: requestManager.loader.getAuthContext(), // was: Oc
    randomBytes: requestManager.randomBytes, // was: Wt
    utcSeekTimestamp: isNaN(requestManager.utcSeekTimestamp)
      ? null : requestManager.utcSeekTimestamp, // was: Fr
    ustreamerConfig: requestManager.ustreamerConfig, // was: Vf
    heartbeatInterval: requestManager.heartbeatInterval, // was: Aq
    schedulerState: schedulerState // was: L1: m
  };

  // Build and return the request
  return new DashSegmentRequest(
    requestManager.policy,
    segmentInfo,
    options,
    requestManager.bandwidthState,
    createRequestCallback(requestManager), // response handler
    schedulerState
  );
}

/**
 * Attempts to issue requests for both video and audio tracks if conditions are met.
 * This is the main scheduling entry point called from the poll loop.
 * [was: bFn]
 *
 * @param {object} requestManager - Request manager state [was: Q]
 * @param {object} track - Primary track [was: c]
 * @param {object} otherTrack - Companion track [was: W]
 */
export function scheduleSegmentRequests(requestManager, track, otherTrack) { // was: bFn
  if (shouldScheduleRequest(requestManager, track, otherTrack)) {
    const segmentInfo = requestManager.buildSegmentInfo(track, otherTrack); // was: W = Q.D(c, W)

    // Handle server-stitched ad decoration if applicable
    if (requestManager.adDecorator) {
      // ... ad decoration logic (complex, abbreviated)
    }

    // Check minimum segment number constraints
    if (requestManager.policy.enforceMinSegmentNumber &&
        segmentInfo.segments[0].segmentNumber !== -1 &&
        segmentInfo.segments[0].segmentNumber < requestManager.mediaState.minSegmentNumber) {
      // Skip segments below minimum
      return;
    }

    // Create the request and register it with the track
    const request = createSegmentRequest(requestManager, segmentInfo);
    registerRequest(track, request); // was: jJ(c, We(Q, W))
    recordTimingEvent(requestManager.timing); // was: zD(Q.timing)
    requestManager.probeManager?.track(segmentInfo.resourcePool); // was: Q.J?.W(W.yp)
  }
}

// ---------------------------------------------------------------------------
// Request response handling
// ---------------------------------------------------------------------------

/**
 * Processes completed and in-progress segment requests:
 * handles init segments, media data, errors, retries, and format switching.
 * [was: k2]
 *
 * @param {object} requestManager - Request manager [was: Q]
 * @param {object} request - Completed or progressing request [was: c]
 * @returns {boolean} True if data was successfully consumed
 */
export function handleRequestResponse(requestManager, request) { // was: k2
  if (requestManager.policy.useUmp && request.isDisposed()) return false;

  try {
    const formatHandle = request.info.segments[0].formatHandle; // was: W = c.info.eh[0].OH
    const track = formatHandle.info.video
      ? requestManager.videoTrack
      : requestManager.audioTrack; // was: r

    // Manifestless: update media state index
    if (requestManager.mediaState.isManifestless && track) {
      requestManager.badStatusCount = 0; // was: Q.K = 0
      if (track.hasInitData) { // was: m.D
        track.hasInitData = false;
      }
      // Update head sequence number from response headers
      const headSeqnum = request.getHeadSeqnum(); // was: K = c.bV()
      const headTimeMillis = request.getHeadTimeMillis(); // was: T = c.cH()
      updateMediaStateHead(requestManager.mediaState, headSeqnum, headTimeMillis); // was: Ex(Q.k0, K, T)
    }

    // Process init segment responses
    if (request.info.isInitOnly() && !hasMediaPayload(request.info)) {
      for (const chunk of request.getChunks()) { // was: c.LB()
        processInitSegmentResponse(track, chunk); // was: BcR(r, I)
      }
    }

    // Drain completed requests from the track queue
    while (track.activeRequests.length &&
           track.activeRequests[0].state === 4 /* COMPLETE */) {
      const completed = track.activeRequests.shift();
      processCompletedRequest(track, completed); // was: V5K(m, I)
      track.lastRequestTiming = completed.getTiming(); // was: m.Ka = I.s6()
    }

    // Process first pending request if it has data
    if (track.activeRequests.length) {
      processCompletedRequest(track, track.activeRequests[0]);
    }

    const hasPendingData = !!getPendingSegment(track); // was: U = !!Hp(r)
    return hasPendingData;
  } catch (error) {
    const details = request.getErrorInfo(); // was: c.Pp()
    details.origin = "hrhs";
    requestManager.loader.handleError("fmt.unplayable", details, 1);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Segment request cancellation and error recovery
// ---------------------------------------------------------------------------

/**
 * Cancels a failed request and removes its segments from the track queue.
 * [was: GF]
 *
 * @param {object} track - Track state [was: Q]
 * @param {object} request - Failed request [was: c]
 */
export function cancelAndCleanupRequest(track, request) { // was: GF
  let index;
  for (index = 0; index < track.activeRequests.length && request !== track.activeRequests[index]; index++);

  if (index === track.activeRequests.length) {
    disposeRequest(track, request); // was: sl(Q, c)
  } else {
    // Remove this and all subsequent requests
    while (index < track.activeRequests.length) {
      disposeRequest(track, track.activeRequests.pop());
    }

    // Re-establish the next segment from the last appended one
    const lastAppended = getLastAppendedSegment(track); // was: m = aT(Q)
    if (lastAppended && lastAppended.formatHandle.isLive() &&
        segmentsMatch(request.info.segments, (seg) => segmentFollows(seg, lastAppended))) {
      track.pendingData = lastAppended;
    } else {
      track.pendingData = null;
      // If offline and not in reset mode, also dispose the request data
      if (!track.loader.isOffline() || track.policy.resetOnUnresumable) {
        disposeRequest(track, request, true);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Buffer health for request scheduling
// ---------------------------------------------------------------------------

/**
 * Computes the current buffer health (amount of buffered-ahead media in seconds)
 * for a track, optionally including pending request data.
 * [was: El]
 *
 * @param {object} track - Track state [was: Q]
 * @param {boolean} [includePending=false] - Include pending requests [was: c]
 * @returns {number} Buffer health in seconds
 */
export function getBufferHealth(track, includePending = false) { // was: El
  const currentTime = track.loader.getCurrentTime(); // was: W = Q.loader.getCurrentTime()
  const lastReceived = track.sourceBufferState.getLastReceived(); // was: m = Q.A.GR()
  let endTime = lastReceived?.info.endTime || 0; // was: K

  if (track.policy.useLiveBufferHealth && !isFinite(currentTime)) return 0;

  // Use partial segment progress if available
  if (lastReceived?.info.formatHandle.isPartiallyLoaded() && !lastReceived.info.isInitSegment) {
    if (track.policy.usePartialEndTime) {
      endTime = lastReceived.info.partialEndTime; // was: K = m.info.j
    }
  }

  if (!track.sourceBuffer) {
    // No source buffer yet — use pending request info
    if ((track.policy.usePendingBuffer || track.policy.useAbsBufferHealth) &&
        includePending && !isNaN(currentTime)) {
      if (lastReceived) return endTime - currentTime;
      if (track.policy.useAbsBufferHealth &&
          track.formatHandle.info.manifestType === "f") {
        return Infinity;
      }
    }
    return 0;
  }

  // Check TLS-based buffer health
  const tlsState = getLastTLSSegment(track); // was: T = Fo(Q)
  if (tlsState && isEndOfStream(tlsState)) return tlsState.endTime; // was: T.K

  const buffered = track.sourceBuffer.getBuffered(true); // was: r = Q.Gy.WG(!0)

  if (includePending && lastReceived) {
    let pendingGap = 0;
    if (track.policy.usePendingBuffer) {
      pendingGap = getBufferedGap(buffered, endTime + 0.02); // was: RR(r, K + .02)
    }
    return pendingGap + endTime - currentTime;
  }

  return getBufferedAhead(buffered, currentTime); // was: c = RR(r, W)
}

// ---------------------------------------------------------------------------
// Max readahead computation
// ---------------------------------------------------------------------------

/**
 * Computes how far ahead of the current playback time the loader
 * is allowed to request segments, factoring in buffer limits, ad breaks,
 * and interruption/seek timing.
 * [was: dr_]
 *
 * @param {object} requestManager - Request manager [was: Q]
 * @param {object} track - Track state [was: c]
 * @returns {number} Maximum readahead time in seconds
 */
export function computeMaxReadahead(requestManager, track) { // was: dr_
  const adState = requestManager.adState; // was: W = Q.W
  const adPrediction = adState.pendingData ? adState.pendingData.prediction : null; // was: W.W ? W.W.pk : null

  if (requestManager.policy.enableSmallBufferMode && adPrediction) {
    return adPrediction.startSecs + adPrediction.duration + 15; // was: W.startSecs + W.cJ + 15
  }

  let maxReadaheadSecs = computeReadaheadLimit(
    requestManager.loader, track
  ); // was: c = Do(Q.loader, c)

  // Apply time-based expansion after seek
  if (requestManager.policy.postInterruptReadahead > 0) {
    const timeSinceLastSeek = ((performance.now() || Date.now()) -
      requestManager.loader.lastSeekTime) / 1000; // was: W = ((0, g.h)() - Q.loader.aL) / 1E3
    maxReadaheadSecs = Math.min(
      maxReadaheadSecs,
      requestManager.policy.postInterruptReadahead +
        requestManager.policy.readaheadGrowthRate * timeSinceLastSeek
    );
  }

  const maxReadaheadTime = requestManager.loader.getCurrentTime() + maxReadaheadSecs;

  // Constrain by upcoming ad break if applicable
  if (requestManager.policy.constrainByAdBreak) {
    const nextAdStart = getNextAdBreakTime(requestManager.loader) +
      requestManager.policy.constrainByAdBreak; // was: W = jmK(Q.loader) + Q.policy.Oa
    if (nextAdStart < maxReadaheadTime) {
      if (requestManager.policy.resetSeekTimeOnInterruption) {
        recordSeekTime(requestManager.loader); // was: mt(Q.loader)
      }
      return nextAdStart;
    }
  }

  return maxReadaheadTime;
}

// ---------------------------------------------------------------------------
// Readahead limit per-track (how many seconds to buffer)
// ---------------------------------------------------------------------------

/**
 * Computes the per-track readahead limit in seconds, based on policy, format
 * bitrate, and current buffer state.
 * [was: Do]
 *
 * @param {object} loader - Loader instance [was: Q]
 * @param {object} formatInfo - Format info for the track [was: c]
 * @returns {number} Readahead limit in seconds
 */
export function computeReadaheadLimit(loader, formatInfo) { // was: Do
  if (loader.hasQuotaExceeded && !loader.isRetrying) return 3;
  if (loader.isSuspended) return 1;
  if (loader.mediaSourceManager?.isBufferFull()) return 4;

  let readaheadSecs = (formatInfo.formatHandle.info.audio
    ? loader.policy.audioReadaheadBytes
    : loader.policy.videoReadaheadBytes
  ) / (formatInfo.averageBitrate * loader.policy.bitrateMultiplier); // was: c.w3 * Q.policy.uE

  // Extend readahead when behind in live buffer
  if (loader.policy.minReadbehindSecs > 0 && loader.mediaSourceManager &&
      isMediaSourceActive(loader.mediaSourceManager)) {
    const sourceBuffer = formatInfo.formatHandle.info.video
      ? loader.mediaSourceManager.videoSourceBuffer
      : loader.mediaSourceManager.audioSourceBuffer;
    if (sourceBuffer && !sourceBuffer.isUpdating()) {
      const buffered = sourceBuffer.getBuffered();
      const rangeIndex = getBufferedRangeIndex(buffered, loader.getCurrentTime());
      if (rangeIndex >= 0) {
        const readBehind = loader.getCurrentTime() - buffered.start(rangeIndex);
        readaheadSecs += Math.max(0,
          Math.min(readBehind - loader.policy.minReadbehindSecs,
                   loader.policy.minReadbehindCap));
      }
    }
  }

  // Apply max readahead cap
  if (loader.policy.maxReadaheadSecs > 0) {
    readaheadSecs = Math.min(readaheadSecs, loader.policy.maxReadaheadSecs); // was: Q.policy.Ie
  }

  return readaheadSecs;
}
