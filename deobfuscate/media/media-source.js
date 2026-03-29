/**
 * MediaSource and SourceBuffer management.
 *
 * Extracted from base.js lines ~42500-44500 (primarily the loader-level
 * MediaSource/SourceBuffer interaction code).
 * Covers SourceBuffer append/remove, codec switching, init segment
 * handling, quota exceeded recovery, and updateend event handling.
 *
 * @module media-source
 */
import { getContainerType, serializeTimeRanges } from './codec-helpers.js';
import { rewriteEncryptionInfo } from './format-setup.js';
import { computeReadaheadLimit } from './segment-loader.js';
import { getCurrentTime } from '../player/time-tracking.js';
import { seekTo } from '../ads/dai-cue-range.js';
import { appendBuffer } from '../data/collection-utils.js';
import { handleError } from '../player/context-updates.js';

// ---------------------------------------------------------------------------
// SourceBuffer initialization and codec management
// ---------------------------------------------------------------------------

/**
 * Configures a SourceBuffer for a new format, including codec type and
 * timestamp offset. Aborts the current segment if needed.
 * [was: X3]
 *
 * @param {object} loader - Loader instance [was: Q]
 * @param {object} track - Track state (video or audio) [was: c]
 * @param {object} sourceBuffer - SourceBuffer wrapper [was: W]
 * @param {object} segmentInfo - Info about the pending segment [was: m]
 * @returns {boolean} True if configuration succeeded
 */
export function configureSourceBuffer(loader, track, sourceBuffer, segmentInfo) { // was: X3
  const lastSegment = getLastTLSSegment(track); // was: K = Fo(c)
  // Abort if there is a pending segment from a different format
  if (lastSegment && !lastSegment.isInitSegment &&
      !segmentMatchesFormat(lastSegment, segmentInfo)) {
    sourceBuffer.abort();
    if (loader.policy.enableTimelineAppender) {
      track.timelineAppender?.reset(); // was: c.L?.J()
    }
  }

  // Set container type if needed
  if (!sourceBuffer.getContainerType() || isLegacyPlatform()) { // was: !W.tU() || Yi()
    try {
      if (loader.policy.useCodecFamilyChange) { // was: Q.policy.aS
        if (sourceBuffer.needsCodecUpdate(
            segmentInfo.formatHandle.info.containerType,
            segmentInfo.formatHandle.info.manifestType
        )) {
          sourceBuffer.changeType(
            segmentInfo.formatHandle.info.containerType,
            segmentInfo.formatHandle.info.manifestType,
            segmentInfo.formatHandle.info.mimeType
          );
        }
      } else {
        sourceBuffer.setMimeType(
          segmentInfo.formatHandle.info.containerType,
          segmentInfo.formatHandle.info.mimeType
        ); // was: W.Im(m.OH.info.containerType, m.OH.info.mimeType)
      }
    } catch (error) {
      reportError(error);
      loader.reportEvent("ctexp", {
        name: error.name,
        msg: error.message
      });
      return false;
    }
  } else if (segmentInfo.formatHandle.info.containerType !== sourceBuffer.getContainerType()) {
    loader.reportEvent("ctu", {
      ct: isLegacyPlatform(),
      prev_c: sourceBuffer.getContainerType(),
      curr_c: segmentInfo.formatHandle.info.containerType
    });
  }

  // Set timestamp offset from companion track data
  const companionData = segmentInfo.formatHandle.companionTrack; // was: m = m.OH.b0
  if (loader.policy.enableTimestampOffset && companionData) {
    const duration = 0 + companionData.duration; // was: c = 0 + m.duration
    const offset = -companionData.position; // was: m = -m.W
    if (0 !== sourceBuffer.getStartTime() || duration !== sourceBuffer.getEndTime()) {
      sourceBuffer.setDurationRange(0, duration); // was: W.Km(0, c)
    }
    if (offset !== sourceBuffer.getTimestampOffset()) {
      sourceBuffer.setTimestampOffset(offset); // was: W.gB(m)
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Init segment handling
// ---------------------------------------------------------------------------

/**
 * Checks whether a new init segment (moov/header) needs to be appended,
 * and if so, appends it to the SourceBuffer.
 * [was: qF]
 *
 * @param {object} loader - Loader instance [was: Q]
 * @param {object} track - Track state [was: c]
 * @param {object} sourceBuffer - SourceBuffer wrapper [was: W]
 * @param {object} segment - Pending segment [was: m]
 * @returns {boolean} True if the caller should yield (init was appended)
 */
export function maybeAppendInitSegment(loader, track, sourceBuffer, segment) { // was: qF
  const formatHandle = segment.info.formatHandle; // was: K = m.info.OH
  formatHandle.isIndexLoaded(); // ensure index is loaded

  const initData = formatHandle.initData; // was: K = m.info.OH.O
  if (!initData || !sourceBuffer.isAttached() || sourceBuffer.getInitData() === initData) {
    return false;
  }

  let dataToAppend = initData; // was: T = K

  // Handle encrypted init segments with FairPlay workarounds
  const existingInitHash = sourceBuffer.getInitDataHash(); // was: r = W.gw()
  if (loader.policy.enableFairPlayInitRewrite && existingInitHash &&
      sourceBuffer.isView() && isMp4Format(segment.info.formatHandle.info)) {
    const view = new DataView(initData.buffer, initData.byteOffset, initData.byteLength);
    const rewritten = rewriteEncryptionInfo(view, existingInitHash); // was: TKO(I, r)
    if (rewritten) {
      dataToAppend = new Uint8Array(rewritten.buffer, rewritten.byteOffset, rewritten.byteLength);
    } else {
      loader.reportEvent("fenc", {});
    }
  }

  // Spoof 4K init segments for compatibility testing
  if (loader.policy.spoof4K) {
    const spoofed = spoof4KInitSegment(loader, segment, new DataArrayBuffer([dataToAppend]));
    if (spoofed) {
      dataToAppend = flattenDataBuffer(spoofed); // was: T = Cp(r)
    }
  }

  // Check for init segment stuck in retry loop
  if (segment === loader.lastInitSegment) {
    loader.initRetryCount += 1;
    if (loader.playerController.getVideoData().isEnabled(
        "html5_shorts_gapless_restart_on_init_seg_retries") &&
        loader.initRetryCount > 5) {
      loader.initRetryCount = 0;
      loader.playerController.reportDebug({ initSegStuck: 1 });
      return true;
    }
  } else {
    loader.initRetryCount = 0;
    loader.lastInitSegment = segment;
  }

  // Abort existing data if policy requires it
  if (loader.policy.abortBeforeSeparateInit) {
    sourceBuffer.abort();
    track.timelineAppender?.reset();
  }

  // Compute the next segment info for the timeline appender
  let nextSegmentInfo = undefined;
  const nextSlice = formatHandle.getFirstSlice(0, segment.info.clipId); // was: r = m.info.OH.J(0, m.info.clipId)
  if (nextSlice) nextSegmentInfo = nextSlice.segments[0]; // was: U = r.eh[0]

  // Append the init segment
  const result = appendToSourceBuffer(
    loader, sourceBuffer, dataToAppend, nextSegmentInfo, initData
  ); // was: K = yk0(Q, W, T, U, K)

  track.timelineAppender?.onInitSegment(result, nextSegmentInfo); // was: c.L?.Y(K, U)

  if (result !== 0) {
    // Init append failed
    if (loader.policy.gaplessShorts && isGaplessContent(loader.playerController.getVideoData())) {
      if (!loader.playerController.canRetryGapless()) {
        reportAppendError(loader, "sepInit", result, segment.info);
      }
      triggerGaplessRestart(loader.playerController, "sie");
    } else {
      reportAppendError(loader, "sepInit", result, segment.info);
    }
    return true;
  }

  // Record timing for first init segment
  if (segment.info.isKeyframe()) { // was: m.info.MK()
    const timing = loader.timing;
    if (!timing.videoInitAppended) {
      timing.videoInitAppended = performance.now();
      recordCSIEvent("vis_a", timing.videoInitAppended, timing.sessionStart);
    }
  } else {
    const timing = loader.timing;
    if (!timing.audioInitAppended) {
      timing.audioInitAppended = performance.now();
      recordCSIEvent("ais_a", timing.audioInitAppended, timing.sessionStart);
    }
  }

  // Notify DRM of key info from init segment
  const encryptionInfo = segment.info.formatHandle.encryptionInfo; // was: m = m.info.OH.HC
  if (encryptionInfo) {
    loader.playerController.onInitData(
      new InitDataEvent(encryptionInfo.key, encryptionInfo.type)
    ); // was: Q.EH.g9(new ir(m.key, m.type))
  }

  return sourceBuffer.isUpdating(); // was: W.yq()
}

// ---------------------------------------------------------------------------
// Media segment append
// ---------------------------------------------------------------------------

/**
 * Appends a media segment to the SourceBuffer, with full error handling
 * for QuotaExceeded, InvalidState, and other DOMException types.
 * [was: FxR]
 *
 * @param {object} loader - Loader instance [was: Q]
 * @param {object} track - Track state [was: c]
 * @param {object} sourceBuffer - SourceBuffer wrapper [was: W]
 * @returns {boolean} True if data was appended
 */
export function appendMediaSegment(loader, track, sourceBuffer) { // was: FxR
  // Skip if end-of-stream locked
  if (loader.policy.endOfStreamLock && getPendingSegment(track)?.isLocked) {
    return false;
  }

  // Need data and a ready SourceBuffer
  if (sourceBuffer.isGarbageCollecting()) return true;
  if (!sourceBuffer.isAttached()) return false;

  const segment = getPendingSegment(track); // was: m = Hp(c)
  if (!segment || segment.info.type === 6) return false;

  // Check if ad decorator allows this segment
  if (loader.policy.enableOnesieAdSkip || loader.adStateManager?.canAppend(track, segment.info.segmentNumber)) {
    loader.appendStallTimestamp = 0; // was: Q.jG = 0
  } else {
    if (loader.seekController.isSeeking()) {
      scheduleNextPoll(loader); // was: wB(Q)
    }
    loader.appendStallTimestamp = loader.appendStallTimestamp || performance.now();
    return false;
  }

  // Configure source buffer for this segment's format
  if (!configureSourceBuffer(loader, track, sourceBuffer, segment.info)) {
    return false;
  }

  // Check if init segment needs appending first
  const isManifestless = loader.mediaState.isManifestless || segment.needsInit; // was: K = Q.k0.isManifestless || m.K
  const isLiveAudioWorkaround = loader.ingestionTracker &&
    !!loader.ingestionTracker.seekPromise &&
    track.formatHandle.info.audio;

  if (!(loader.mediaState.supportsOffsets && segment.info.fragmentIndex !== 0 ||
        isManifestless && !isLiveAudioWorkaround) &&
      maybeAppendInitSegment(loader, track, sourceBuffer, segment)) {
    return true;
  }

  if (isLiveAudioWorkaround) return false;

  // Check readahead limit before appending
  const readaheadLimit = computeReadaheadLimit(loader, track); // was: T = Do(Q, c)
  const maxAppendTime = loader.getCurrentTime() + readaheadLimit;
  if (segment.info.partialEndTime > maxAppendTime) {
    // Not time to append yet — wait for more buffering
    return false;
  }

  // Flatten the segment data and append
  const startMark = loader.policy.enableTimingMarks ? performance.now() : 0;

  let initData = segment.needsInit && segment.info.formatHandle.initData || undefined; // was: r
  let payloadData = segment.payload; // was: U = m.O

  // Apply init+payload rewrite if needed (e.g. 4K spoofing)
  if (segment.needsInit) {
    const rewritten = maybeRewritePayload(loader, segment, payloadData);
    if (rewritten) payloadData = rewritten;
  }

  const flatPayload = flattenDataBuffer(payloadData); // was: I = Cp(U)
  const endMark = loader.policy.enableTimingMarks ? performance.now() : 0;

  const appendResult = appendToSourceBuffer(
    loader, sourceBuffer, flatPayload, segment.info, initData
  ); // was: W = yk0(Q, W, I, m.info, r)

  track.timelineAppender?.onMediaAppend(
    segment.info, appendResult, endMark - startMark, performance.now() - endMark
  );

  loader.initRetryCount = 0;

  if (appendResult === 0) {
    // Success
    if (loader.hasQuotaExceeded) {
      loader.hasQuotaExceeded = false;
      loader.quotaExceededRetried = false;
    }
    loader.invalidStateCount = 0;
    return true;
  }

  // Handle specific error codes
  if (appendResult === 2 /* InvalidState */ || appendResult === 5 /* AbortError */) {
    reportAppendError(loader, "checked", appendResult, segment.info);
  } else if (appendResult === 1 /* QuotaExceeded */) {
    if (!loader.hasQuotaExceeded) {
      loader.hasQuotaExceeded = true;
      return false;
    }
    if (!loader.quotaExceededRetried) {
      loader.quotaExceededRetried = true;
      loader.playerController.seekTo(loader.getCurrentTime(), {
        seekReason: "quotaExceeded",
        forceReload: true
      });
      return false;
    }
    // Reduce buffer sizes
    if (segment.info.isKeyframe()) {
      loader.policy.videoReadaheadBytes = Math.floor(loader.policy.videoReadaheadBytes * 0.8);
      loader.policy.maxReadaheadSecs = Math.floor(loader.policy.maxReadaheadSecs * 0.8);
    } else {
      loader.policy.audioReadaheadBytes = Math.floor(loader.policy.audioReadaheadBytes * 0.8);
      loader.policy.maxReadaheadSecs = Math.floor(loader.policy.maxReadaheadSecs * 0.8);
    }
    // Stun the format to force a downgrade
    stunFormat(loader, segment.info.formatHandle); // was: r4(Q.W, m.info.OH)
  }

  loader.playerController.reportDebug({ reattachOnAppend: appendResult });
  return false;
}

/**
 * Low-level SourceBuffer.appendBuffer() call with DOMException handling.
 * Returns a status code: 0=success, 1=QuotaExceeded, 2=InvalidState,
 * 3=MediaSourceClosed, 4=Unknown, 5=AbortError, 6=EndOfStreamDelay.
 * [was: yk0]
 *
 * @param {object} loader - Loader instance [was: Q]
 * @param {object} sourceBuffer - SourceBuffer wrapper [was: c]
 * @param {Uint8Array} data - Data to append [was: W]
 * @param {object} [segmentInfo] - Segment metadata [was: m]
 * @param {Uint8Array} [initData] - Init segment data [was: K]
 * @returns {number} Status code
 */
export function appendToSourceBuffer(loader, sourceBuffer, data, segmentInfo, initData) { // was: yk0
  try {
    // Handle end-of-stream delayed append
    const track = sourceBuffer === loader.mediaSourceManager?.audioSourceBuffer
      ? loader.audioTrack : loader.videoTrack;

    if (loader.policy.endOfStreamLock && segmentInfo?.isLastSegment()) {
      if (segmentInfo?.retryCount > 1) return 6;
      // Set up delayed unlock timer
      track.endOfStreamTimer = new DelayedTimer(() => {
        const pending = getPendingSegment(track);
        if (loader.isDisposed() || !pending?.isLocked) return;
        if (isReadyToUnlock(track)) {
          unlockEndOfStream(loader, track === loader.audioTrack);
        } else {
          pending.info.retryCount += 1;
          if (loader.mediaSourceManager) loader.syncMediaSource();
        }
      }, 10000, loader);
      track.endOfStreamTimer.start();
    }

    sourceBuffer.appendBuffer(data, segmentInfo, initData);
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.code === 11 /* InvalidState */) return 2;
      if (error.code === 12 /* AbortError */) return 5;
      if (error.code === 22 || error.message.indexOf("Not enough storage") === 0) {
        // QuotaExceeded
        const details = {
          name: "QuotaExceededError",
          buffered: serializeTimeRanges(sourceBuffer.getBuffered()).replace(/,/g, "_"),
          vheap: getHeapSize(loader.videoTrack),
          aheap: getHeapSize(loader.audioTrack),
          message: truncate(error.message, 3),
          track: loader.mediaSourceManager
            ? (sourceBuffer === loader.mediaSourceManager.videoSourceBuffer ? "v" : "a")
            : "u"
        };
        Object.assign(details, getMemoryInfo());
        loader.handleError("player.exception", details);
        return 1;
      }
      reportError(error);
    }
    return 4;
  }

  return loader.mediaSourceManager?.isSourceBufferError() ? 3 : 0;
}

// ---------------------------------------------------------------------------
// MediaSource lifecycle
// ---------------------------------------------------------------------------

/**
 * Attaches SourceBuffers to the MediaSource, configuring audio and video
 * tracks with their initial codec info and wiring up event listeners.
 * [was: xL7]
 *
 * @param {object} loader - Loader instance [was: Q]
 * @param {object} mediaSourceManager - MediaSource manager [was: c]
 * @param {boolean} [suppressResume=false] - Skip auto-resume [was: W]
 * @param {boolean} [preserveTimeline=false] - Keep existing timeline [was: m]
 */
export function attachSourceBuffers(loader, mediaSourceManager, suppressResume = false, preserveTimeline = false) { // was: xL7
  bindSourceBuffer(loader.videoTrack, mediaSourceManager.videoSourceBuffer || null, preserveTimeline);
  bindSourceBuffer(loader.audioTrack, mediaSourceManager.audioSourceBuffer || null, preserveTimeline);
  loader.mediaSourceManager = mediaSourceManager;
  loader.mediaSourceManager.isActive = true;
  if (!suppressResume) loader.resume();
  mediaSourceManager.audioSourceBuffer.addEventListener(loader.mediaSourceListener, loader);
  mediaSourceManager.videoSourceBuffer.addEventListener(loader.mediaSourceListener, loader);
}

/**
 * Detaches SourceBuffers and tears down the MediaSource state.
 * [was: Bg0]
 *
 * @param {object} loader - Loader instance [was: Q]
 * @param {boolean} [preserveTimeline=false] - Keep timeline appender [was: c]
 */
export function detachSourceBuffers(loader, preserveTimeline = false) { // was: Bg0
  if (loader.mediaSourceManager) {
    if (loader.mediaSourceManager.audioSourceBuffer &&
        loader.mediaSourceManager.videoSourceBuffer) {
      loader.mediaSourceManager.audioSourceBuffer.removeEventListener(
        loader.mediaSourceListener, loader
      );
      loader.mediaSourceManager.videoSourceBuffer.removeEventListener(
        loader.mediaSourceListener, loader
      );
    }
  }
  bindSourceBuffer(loader.audioTrack, null, preserveTimeline);
  bindSourceBuffer(loader.videoTrack, null, preserveTimeline);
  if (loader.mediaSourceManager) {
    loader.mediaSourceManager.isActive = false;
  }
  loader.mediaSourceManager = null;
}

// ---------------------------------------------------------------------------
// Timestamp offset management
// ---------------------------------------------------------------------------

/**
 * Updates the timestamp offset for the entire pipeline, propagating to
 * the media state, seek controller, and both track SourceBuffers.
 * [was: Dj]
 *
 * @param {object} loader - Loader instance [was: Q]
 * @param {number} offset - New timestamp offset in seconds [was: c]
 */
export function setTimestampOffset(loader, offset) { // was: Dj
  if (loader.timestampOffset === offset) return;

  loader.timestampOffset = offset;

  if (loader.policy.enableSegmentTimeline) {
    refreshMediaState(loader.mediaState); // was: Fc(Q.k0)
  }

  loader.adStateManager.timestampOffset = loader.timestampOffset; // was: Q.j.J = Q.timestampOffset
  loader.playerController.onTimestampOffsetChange(loader.timestampOffset); // was: Q.EH.jR(Q.timestampOffset)

  if (loader.mediaState.isManifestless) {
    loader.mediaState.timestampOffset = loader.timestampOffset;
  }

  loader.videoTrack.setTimestampOffset(loader.timestampOffset); // was: Q.videoTrack.gB(Q.timestampOffset)
  loader.audioTrack.setTimestampOffset(loader.timestampOffset); // was: Q.audioTrack.gB(Q.timestampOffset)
}

// ---------------------------------------------------------------------------
// Append error reporting
// ---------------------------------------------------------------------------

/**
 * Reports a SourceBuffer append error, potentially triggering a format stun
 * or a full playback error.
 * [was: xz]
 *
 * @param {object} loader - Loader instance [was: Q]
 * @param {string} origin - Origin description [was: c]
 * @param {number} errorCode - Append result code [was: W]
 * @param {object} segmentInfo - Segment that failed [was: m]
 */
export function reportAppendError(loader, origin, NetworkErrorCode, segmentInfo) { // was: xz
  let errorType = "fmt.unplayable"; // was: K
  let severity = 1; // was: T

  if (NetworkErrorCode === 5 || NetworkErrorCode === 3) {
    errorType = "fmt.unparseable";
    // Stun video format to force downgrade
    if (segmentInfo.formatHandle.info.video) {
      stunFormat(loader, segmentInfo.formatHandle);
    }
  } else if (NetworkErrorCode === 2) {
    if (loader.invalidStateCount < 15) {
      loader.invalidStateCount++;
      errorType = "html5.invalidstate";
      severity = 0;
    }
  }

  const details = getSegmentErrorDetails(segmentInfo); // was: m = fk(m)
  details.mrs = loader.mediaSourceManager?.getReadyState();
  details.origin = origin;
  details.reason = NetworkErrorCode;
  details.trg = "appenderr";
  loader.handleError(errorType, details, severity);
}
