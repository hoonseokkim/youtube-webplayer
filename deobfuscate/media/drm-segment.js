/**
 * DRM segment decryption — SDAI / DAI decryption hooks, per-segment DRM
 * state, content-ID mismatch logging, and ad-segment halt logic.
 *
 * Extracted from base.js lines 40000–41000.
 * Covers the tail of bFn (segment-fetch decision tree), SDAI telemetry,
 * the jJ / zD timing pair, stmidmismatch content-ID checks,
 * DAI halt/resume state machine, request throttling, and the
 * SABR request builder (z5x / lVO).
 *
 * @module drm-segment
 */
import { useInputSlider } from '../ui/seek-bar-tail.js'; // was: bG
import { clamp } from '../core/math-utils.js';
import { recordSegmentRequest, markTimingCheckpoint } from './buffer-stats.js';
import { getCurrentTime } from '../player/time-tracking.js';
import { handleError } from '../player/context-updates.js';
import { getConfig } from '../core/composition-helpers.js';
import { SabrRequest } from '../player/video-element.js';

// ---------------------------------------------------------------------------
// SDAI segment decryption hook  (lines 39995–40028)
// ---------------------------------------------------------------------------

/**
 * Called when a segment is fetched for a server-stitched DAI stream.
 * Decides whether the segment needs decryption and, if so, dispatches
 * it through the DRM pipeline.
 *
 * Key flow:
 *   1. Log "sdai" telemetry with segment number, itag, and start time.
 *   2. If the previous segment is still pending decryption and the policy
 *      requires serialisation (`policy.Ll`), bail out early.
 *   3. Compare the content-ID of the ad-parameters map (`yp.Zz("id")`)
 *      against the segment's ad map (`W.get("id")`).  On mismatch,
 *      log "stmidmismatch".
 *   4. When the DRM state is not in the "decrypt" phase (state !== 5),
 *      log the segment as "nodec_sq" and skip decryption.
 *   5. Otherwise, enqueue the segment into the writer via jJ and mark
 *      the timing via zD.
 *
 * [was: anonymous block inside bFn, lines 39995–40028]
 *
 * @param {Object} controller  [was: Q] — segment fetch controller
 * @param {Object} track       [was: c] — media track (audio or video)
 * @param {Object} requestInfo [was: W] — the segment request info being built
 * @param {number} sequenceNum [was: K] — segment sequence number
 * @param {string} itag        [was: A] — format itag string
 * @param {number} startTime   [was: T] — segment start time (seconds)
 */
export function handleSdaiSegmentDecryption(
  controller,
  track,
  requestInfo,
  sequenceNum,
  itag,
  startTime
) {
  const telemetry = { // was: T (object literal at line 39998–40002)
    dec_sq: sequenceNum,  // was: K
    itag,                 // was: A
    st: startTime.toFixed(3) // was: T.toFixed(3)
  };

  // Bail if the previous segment's decryption is still in flight
  if (controller.policy.serializeDecryption && track.isRequestPending(sequenceNum - 1)) { // was: Q.policy.Ll && c.isRequestPending(K - 1)
    controller.loader.logTelemetry("sdai", { // was: Q.loader.tJ("sdai", …)
      wt_daistate_on_sg: sequenceNum - 1
    });
    return;
  }

  controller.loader.logTelemetry("sdai", telemetry); // was: Q.loader.tJ("sdai", T)

  // Attach ad-parameters to the request if present
  if (requestInfo.adParams) { // was: m (third arg forwarded to new g.lB)
    requestInfo.adMap = new URLSearchParams(requestInfo.adParams); // was: W.W = new g.lB(m)
  }

  // Content-ID mismatch check
  if (controller.policy.enableLogging) { // was: Q.policy.A
    const currentContentId = requestInfo.baseParams.get("id") || ""; // was: W.yp.Zz("id") || ""
    const adContentId = requestInfo.adMap?.get("id") || "";          // was: W.W?.get("id") || ""
    if (currentContentId !== adContentId) {
      controller.loader.logTelemetry("stmidmismatch", { // was: Q.loader.tJ("stmidmismatch", …)
        cid: currentContentId,
        aid: adContentId
      });
    }
  }

  // If DRM state is not "decrypting", log and skip
  if (controller.drmState.phase !== 5) { // was: Q.W.O !== 5
    controller.loader.logTelemetry("sdai", {
      nodec_sq: sequenceNum,
      itag,
      st: startTime.toFixed(3)
    });
    return;
  }

  // Clamp segment to the known safe range if necessary
  if (controller.policy.clampToSafeRange && // was: Q.policy.a4
      requestInfo.entries[0].sequenceNumber !== -1 &&
      requestInfo.entries[0].sequenceNumber < controller.formatMap.safeStart) { // was: Q.k0.Kx
    requestInfo = track.sourceHandle.clamp(controller.formatMap.safeStart, false); // was: c.OH.K(Q.k0.Kx, !1)
  }

  // Enqueue the segment request and mark timing
  recordSegmentRequest(track, buildRequest(controller, requestInfo)); // was: jJ(c, We(Q, W))
  markTimingCheckpoint(controller.timing);                            // was: zD(Q.timing)

  // Notify DRM adapter of the new ad-params
  controller.drmAdapter?.onSegmentParams(requestInfo.baseParams); // was: Q.J?.W(W.yp)
}

// ---------------------------------------------------------------------------
// dr_ — compute the max readahead time for a track
// ---------------------------------------------------------------------------

/**
 * Determine how far ahead (in seconds from now) the loader should
 * buffer for the given track, taking into account:
 *   - DAI ad-pod timing (startSecs + cJ + 15 s lookahead)
 *   - Policy caps (EC + YR * elapsed)
 *   - Manifest-request-limit (Oa) throttle
 *
 * [was: dr_]  (line 40030)
 *
 * @param {Object} controller [was: Q] — segment controller
 * @param {Object} track      [was: c] — the audio/video track
 * @returns {number} max readahead time in seconds
 */
export function computeMaxReadaheadTime(controller, track) { // was: dr_
  // DAI shortcut: use the ad-pod timing directly
  const daiState = controller.drmState; // was: W = Q.W
  const adPod = daiState.adMap ? daiState.adMap.podInfo : null; // was: W.W ? W.W.pk : null
  if (controller.policy.useAdPodTiming && adPod) { // was: Q.policy.MM && W
    return adPod.startSecs + adPod.duration + 15; // was: W.startSecs + W.cJ + 15
  }

  // Normal readahead: base + elapsed-time scaling
  let maxReadahead = computeBaseReadahead(controller.loader, track); // was: Do(Q.loader, c)
  if (controller.policy.elapsedCap > 0) { // was: Q.policy.EC > 0
    const elapsedSecs = (performance.now() - controller.loader.startTime) / 1000; // was: ((0, g.h)() - Q.loader.aL) / 1E3
    maxReadahead = Math.min(
      maxReadahead,
      controller.policy.elapsedCap + controller.policy.elapsedScale * elapsedSecs // was: Q.policy.EC + Q.policy.YR * W
    );
  }

  let target = controller.loader.getCurrentTime() + maxReadahead; // was: c = Q.loader.getCurrentTime() + c

  // Manifest-request-limit throttle
  if (controller.policy.manifestRequestLimit) { // was: Q.policy.Oa
    const manifestLimit = getManifestStartTime(controller.loader) + controller.policy.manifestRequestLimit; // was: jmK(Q.loader) + Q.policy.Oa
    if (manifestLimit < target) {
      controller.loader.logTelemetry("mrl", { // was: Q.loader.tJ("mrl", …)
        ori: target,
        mod: manifestLimit
      }, true);
      if (controller.policy.refreshOnThrottle) { // was: Q.policy.yV
        refreshManifest(controller.loader); // was: mt(Q.loader)
      }
      target = manifestLimit;
    }
  }

  return target;
}

// ---------------------------------------------------------------------------
// Led — create a probe request on retry
// ---------------------------------------------------------------------------

/**
 * When a segment request fails with a retryable status, optionally
 * create a small "probe" sub-request (first 4 KB) to test the server
 * before committing to the full re-fetch.
 *
 * [was: Led]  (line 40048)
 *
 * @param {Object} controller [was: Q] — segment controller
 * @param {Object} request    [was: c] — the failed request
 * @param {number} probeLevel [was: W] — 0 = none, 1 = n/a, 2 = probe with WN flag
 */
export function createProbeRequest(controller, request, probeLevel) { // was: Led
  if (probeLevel === 0) return;

  let probeInfo; // was: c (reassigned)
  const info = request.info; // was: c = c.info
  const isWideningProbe = probeLevel === 2; // was: W = W === 2

  if (info.isSABR) { // was: c.W
    probeInfo = null;
  } else {
    const firstEntry = info.entries[0]; // was: m = c.eh[0]

    let range;
    if (info.range) {
      range = createRange(info.range.start, Math.min(4096, info.totalBytes)); // was: Lk(c.range.start, Math.min(4096, c.A))
    } else {
      // OTF / defrag segments cannot be probed
      if (info.url && info.url.indexOf("/range/") >= 0 ||
          info.baseParams.get("defrag") === "1" ||
          info.baseParams.get("otf") === "1") {
        probeInfo = null;
      } else {
        range = createRange(0, 4096); // was: Lk(0, 4096)
      }
    }

    if (range) {
      probeInfo = new SegmentRequestInfo( // was: Ck
        [new SegmentEntry(5, firstEntry.sourceHandle, range, "createProbeRequestInfo" + firstEntry.tag, firstEntry.sequenceNumber)], // was: new vd(5, m.OH, K, "createProbeRequestInfo" + m.J, m.DF)
        info.url
      );
      probeInfo.isWideningProbe = isWideningProbe; // was: K.WN = W
      probeInfo.isSABR = info.isSABR; // was: K.W = c.W
    }
  }

  if (probeInfo) {
    buildRequest(controller, probeInfo); // was: We(Q, c)
  }
}

// ---------------------------------------------------------------------------
// J7 — issue an init-segment fetch for a format that hasn't been fetched
// ---------------------------------------------------------------------------

/**
 * If the given format's init segment has not yet been fetched,
 * create and dispatch the init-segment request.  The request is
 * throttled by an optional byte-rate delay.
 *
 * [was: J7]  (line 40073)
 *
 * @param {Object} controller   [was: Q] — segment controller
 * @param {Object} track        [was: c] — media track
 * @param {Object} sourceHandle [was: W] — the format's source handle
 * @param {boolean} applyDelay  [was: m] — whether to add a throttle delay
 */
export function fetchInitSegmentIfNeeded(controller, track, sourceHandle, applyDelay) { // was: J7
  if (sourceHandle.isDash() || sourceHandle.isIndexed() || sourceHandle.initFetched || // was: W.W() || W.Ie() || W.mF
      !sourceHandle.baseParams.isEligible(controller.policy, controller.formatState, controller.loader.useInputSlider) || // was: !W.yp.J(Q.policy, Q.A, Q.loader.bG)
      sourceHandle.info.codecFamily === "f" || // was: W.info.mI === "f"
      controller.policy.isSABR) { // was: Q.policy.W
    return;
  }

  let throttleDelay;
  if (applyDelay) {
    const formatInfo = sourceHandle.info; // was: K = W.info
    throttleDelay = computeThrottleDelay( // was: FBd(m, …)
      controller.bandwidthState,
      formatInfo.video ? controller.bandwidthState.policy.videoThrottleRate : controller.bandwidthState.policy.audioThrottleRate, // was: m.policy.XG : m.policy.rR
      formatInfo.maxBitrate // was: K.w3
    );
  } else {
    throttleDelay = 0;
  }

  const initRequest = sourceHandle.createInitRequest(throttleDelay); // was: W.J(m)
  const dispatched = buildRequest(controller, initRequest); // was: We(Q, m)
  if (isFullSegmentRequest(initRequest)) { // was: GJ(m)
    recordSegmentRequest(track, dispatched); // was: jJ(c, Q)
  }
  sourceHandle.initFetched = true; // was: W.mF = !0
}

// ---------------------------------------------------------------------------
// k2 — handle response slices for SABR / manifestless streams
// ---------------------------------------------------------------------------

/**
 * Process an in-flight response: for manifestless streams, update the
 * format index with the received headers, push each completed slice
 * through the track writer, and record timing metrics.
 *
 * [was: k2]  (line 40087)
 *
 * @param {Object} controller [was: Q] — segment controller
 * @param {Object} response   [was: c] — the in-flight response object
 * @returns {boolean} true if any slice was successfully pushed
 */
export function processResponseSlices(controller, response) { // was: k2
  if (controller.policy.useUmp && response.isAborted()) { // was: Q.policy.useUmp && c.u0()
    return false;
  }

  try {
    const sourceHandle = response.info.entries[0].sourceHandle; // was: W = c.info.eh[0].OH
    const track = sourceHandle.info.video ? controller.videoTrack : controller.audioTrack; // was: r

    if (controller.formatMap.isManifestless && track) { // was: Q.k0.isManifestless && m
      controller.errorCount = 0; // was: Q.K = 0
      if (track.needsDiscard) { // was: m.D
        response.isAborted(); // was: c.u0()  — check / trigger abort
        response.isComplete() || response.abort(); // was: c.isComplete() || c.uW()
        track.needsDiscard = false; // was: m.D = !1
      }
      if (response.bandwidthSample()) { // was: c.uw()
        controller.loader.bandwidthEstimator.record(1, response.bandwidthSample()); // was: Q.loader.jl.ER(1, c.uw())
      }
      const headerInfo = response.extractHeaderInfo(); // was: K = c.bV()
      const contentLength = response.contentLength();  // was: T = c.cH()
      updateFormatIndex(controller.formatMap, headerInfo, contentLength); // was: Ex(Q.k0, K, T)
    }

    // Push init / index segments
    if (response.info.hasInitOrIndex() && !isFullSegmentRequest(response.info)) { // was: c.info.B5() && !GJ(c.info)
      for (const slice of response.getInitSlices()) { // was: c.LB()
        pushInitSlice(track, slice); // was: BcR(r, I)
      }
    }

    // Drain completed slices from the track writer
    while (track.queue.length && track.queue[0].state === 4) { // was: m.O.length && m.O[0].state === 4
      const completed = track.queue.shift(); // was: I = m.O.shift()
      processCompletedSlice(track, completed); // was: V5K(m, I)
      track.lastProcessedTime = completed.endTime(); // was: m.Ka = I.s6()
    }
    if (track.queue.length) {
      processCompletedSlice(track, track.queue[0]); // was: V5K(m, m.O[0])
    }

    const hasPending = !!getPendingSlice(track); // was: U = !!Hp(r)
    if (hasPending && response instanceof SegmentResponse) { // was: c instanceof Bp
      if (sourceHandle.info.isAudio()) { // was: W.info.Dg()
        markAudioFirstByte(controller.timing); // was: Jnm(Q.timing)
      } else {
        markVideoFirstByte(controller.timing); // was: MZR(Q.timing)
      }
    }

    return hasPending;
  } catch (error) {
    const details = response.describe(); // was: c.Pp()
    details.origin = "hrhs";
    const parsed = parseError(error); // was: UU(…)
    controller.loader.handleError(parsed.NetworkErrorCode, details, parsed.severity);
    return false;
  }
}

// ---------------------------------------------------------------------------
// MQO — check whether SABR should issue a new readahead request
// ---------------------------------------------------------------------------

/**
 * Top-level gate for the SABR request loop.  Returns true when a new
 * request should be created, false when buffering is sufficient or
 * the loader is blocked (rate-limited, end-of-stream, ads, etc.).
 *
 * [was: MQO]  (line 41165)
 *
 * @param {Object} controller [was: Q] — SABR controller
 * @returns {boolean}
 */
export function shouldCreateReadaheadRequest(controller) { // was: MQO
  if (!checkRateLimit(controller, controller.rateLimitState)) { // was: !hpm(Q, Q.S)
    setBlockReason(controller, "ratelimited"); // was: Oe(Q, "ratelimited")
    return false;
  }
  if (isEndOfStream(controller.audioTrack) && isEndOfStream(controller.videoTrack)) { // was: $2(Q.audioTrack) && $2(Q.videoTrack)
    setBlockReason(controller, "endofstream");
    return false;
  }

  // DAI / SSDAI halt checks (lines 41172–41201)
  if (controller.policy.enableDai) { // was: Q.policy.O
    if (controller.policy.useSsdaiBlocking) { // was: Q.policy.K
      if (controller.drmAdapter?.isBlocked()) { // was: Q.J?.b0()
        setBlockReason(controller, "ssdaiblocked");
        return false;
      }
    } else {
      let halted = false;
      if (controller.daiState.phase === 2) { // was: Q.b0.O === 2
        halted = true;
      } else if (controller.daiState.phase === 3) { // was: Q.b0.O === 3
        // ... check whether we've buffered past the ad-pod boundary
        halted = true; // simplified; actual logic at lines 41182–41197
      }
      if (halted) {
        setBlockReason(controller, "waitingforads");
        return false;
      }
    }
  }

  // Readahead targets met?
  if (!controller.readaheadPolicy) { // was: !Q.A
    logRequestDecision(controller, { nopolicy: 1 }); // was: Gt(Q, …)
    return true;
  }

  const audioReadahead = Math.min(
    computeBaseReadahead(controller.loader, controller.audioTrack) * 1000,
    controller.readaheadPolicy.targetAudioReadaheadMs // was: Q.A.targetAudioReadaheadMs
  );
  const videoReadahead = Math.min(
    computeBaseReadahead(controller.loader, controller.videoTrack) * 1000,
    controller.readaheadPolicy.targetVideoReadaheadMs
  );
  const minReadahead = Math.min(audioReadahead, videoReadahead); // was: K
  const currentTimeMs = controller.player.getCurrentTime() * 1000; // was: T

  const { audioAhead, videoAhead } = computeReadaheadAmounts(controller, currentTimeMs); // was: zpy

  const audioSatisfied = audioAhead >= minReadahead; // was: !(r < K)
  const videoSatisfied = videoAhead >= minReadahead;

  if (audioSatisfied && videoSatisfied) {
    setBlockReason(controller, "readaheadmet"); // was: Oe(Q, "readaheadmet")
    return false;
  }

  logRequestDecision(controller, { /* telemetry fields */ }); // was: Gt(Q, e)
  return true;
}

// ---------------------------------------------------------------------------
// z5x — build SABR request data payload
// ---------------------------------------------------------------------------

/**
 * Assemble the full request-data object for a SABR streaming request,
 * including the known-format constraints, video-playback configuration,
 * DRM adapter state, and any pending context updates.
 *
 * [was: z5x]  (line 40219)
 *
 * @param {Object} controller     [was: Q] — SABR controller
 * @param {Function|null} logFn   [was: c] — optional telemetry logger
 * @param {boolean} includeContext [was: W] — whether to log context update info
 * @param {boolean} isRetry       [was: m] — true on retry requests
 * @returns {Object} the assembled request data for serialisation
 */
export function buildSabrRequestData(controller, logFn, includeContext, isRetry) { // was: z5x
  const formatMap = controller.formatMap; // was: K = Q.k0
  const videoData = controller.player.getVideoData(); // was: T = Q.EH.getVideoData()
  const drmAdapter = controller.drmAdapter; // was: r = Q.yd

  const knownFormats = buildKnownFormatConstraints({ // was: ZzX(…)
    schedule: controller.schedule,              // was: Q.Qp
    config: videoData.getConfig(),              // was: T.G()
    player: controller.player,                  // was: Q.EH
    startTimeMs: controller.startTimeMs,        // was: Q.vp
    qualityConstraints: controller.qualityConstraints, // was: Q.Ck
    // ... additional fields omitted for brevity
    sabrLicenseConstraint: videoData.sabrLicenseConstraint,
    authorizedFormats: videoData.authorizedFormats
  });

  const videoFeedback = buildVideoFeedback( // was: GD(T, …)
    videoData,
    controller.lastRequestInfo,
    controller.nextRequestPolicy,
    controller.pendingContexts,
    controller.contextVersion,
    controller.experimentParams,
    controller.contextOverrides
  );

  // Log context update types if requested
  if (includeContext && logFn) {
    const contextTypes = videoFeedback.pendingContexts
      ? videoFeedback.pendingContexts.map(e => e.type)
      : [];
    logFn("sabr", {
      stmctxt: contextTypes.join("_"),
      unsntctxt: videoFeedback.unsentContexts ? videoFeedback.unsentContexts.join("_") : ""
    });
  }

  // Resolve default preferred formats if not explicitly set
  let audioPreferred = controller.audioPreferredFormat;  // was: c = Q.CT
  let videoPreferred = controller.videoPreferredFormat;  // was: W = Q.PF
  if (videoPreferred === undefined && audioPreferred === undefined) {
    videoPreferred = resolvePreferredFormat(formatMap.useClientTag, controller.activeFormats?.video); // was: h5n(K.UC, Q.OI?.video)
    audioPreferred = resolvePreferredFormat(formatMap.useClientTag, controller.activeFormats?.audio);
  }

  let ustreamerConfig;
  if (videoData.ustreamerConfig) { // was: T.Vf
    ustreamerConfig = videoData.ustreamerConfig;
  }

  // Optional padding buffer for bandwidth probing
  let paddingBuffer;
  const paddingSize = controller.qualityConstraints?.paddingSize; // was: T = Q.Ck?.Vd
  if (paddingSize && paddingSize > 0 && (controller.enableBandwidthProbing || controller.enableNetworkInfo)) { // was: (Q.jj || Q.nI)
    paddingBuffer = new Uint8Array(paddingSize); // was: new Uint8Array(T)
  }

  const requestData = { // was: r
    knownFormats,                                 // was: KF: U
    clientAbrState: controller.clientAbrState,     // was: kA: Q.kA
    audioPreferredFormat: audioPreferred,           // was: CT: c
    videoPreferredFormat: videoPreferred,           // was: PF: W
    drmAdapter,                                    // was: yd: r
    videoPlaybackUstreamerConfig: ustreamerConfig,  // was: videoPlaybackUstreamerConfig: X
    videoFeedback,                                 // was: vF: I
    paddingBuffer                                  // was: E3: A
  };

  // Attach Yl / Yc payloads for live / gapless
  if (isRetry && controller.retryPayload) {
    if (controller.retryPayload.length > 0) {
      requestData.retryPayload = controller.retryPayload; // was: r.Yl = Q.Yl
    }
  } else if (controller.initialPayload) {
    requestData.initialPayload = controller.initialPayload; // was: r.Yc = Q.Yc
  }

  // UHD quality hints
  if (controller.qualityConstraints?.isUHD() && !isAV1Capable()) { // was: Q.Ck?.UH() && !Yi()
    if (controller.preferredDecoderConfig) {
      requestData.preferredDecoderConfig = controller.preferredDecoderConfig; // was: r.D_ = Q.D_
    }
    if (controller.preferredQualityLabel) {
      requestData.preferredQualityLabel = controller.preferredQualityLabel; // was: r.qV = Q.qV
    }
  }

  requestData.headerHints = controller.headerHints;   // was: r.h3 = Q.h3
  requestData.joinedFormat = formatMap.joinedFormats;  // was: r.PY = K.JJ
  return requestData;
}

// ---------------------------------------------------------------------------
// lVO — create and dispatch a SABR segment request
// ---------------------------------------------------------------------------

/**
 * Build a full SABR request (Cb) from the readahead policy and current
 * format state, attach it to the controller, and record timing.
 *
 * [was: lVO]  (line 41296)
 *
 * @param {Object} controller     [was: Q] — SABR controller
 * @param {Object} requestPolicy  [was: c] — the PHn request policy
 * @param {*}      [context]      [was: W] — optional context override
 * @returns {Object} the created Cb request
 */
export function createAndDispatchSabrRequest(controller, requestPolicy, context) { // was: lVO
  const options = { // was: m
    schedule: controller.schedule,           // was: Q.Qp
    onNotify: (type, data) => {              // was: oN
      controller.player.onTelemetry(type, data); // was: Q.EH.Tt(T, r)
    },
    enableMultiWrite: controller.policy.enableMultiWrite, // was: B5: Q.policy.mw
    enableFullTelemetry: controller.policy.enableLogging, // was: Ft: Q.policy.A
    enableLowLatency: controller.policy.enableLowLatency  // was: lE: Q.policy.lE
  };

  // Add combined bitrate hint for scheduling
  if (controller.schedule.config.enableBitrateHint) { // was: Q.Qp.O.D
    options.combinedBitrate =
      (controller.videoTrack.sourceHandle.info.maxBitrate || 0) +
      (controller.audioTrack.sourceHandle.info.maxBitrate || 0); // was: (Q.videoTrack.OH.info.w3 || 0) + (Q.audioTrack.OH.info.w3 || 0)
  }

  // Determine encryption level
  const encryptionLevel = requestPolicy.isEncrypted(controller.policy, controller.bandwidthState) ? 2 : 1; // was: Ci7(c, Q.policy, Q.j)
  if (encryptionLevel !== controller.currentEncryptionLevel) { // was: K !== Q.mF
    controller.currentEncryptionLevel = encryptionLevel;
    flushPendingContextUpdates(controller); // was: Gg_(Q)
  }

  context = controller.buildRequestContext(context); // was: W = Q.y3(W)

  // Validate context completeness if required
  if (controller.policy.enableContextValidation && controller.policy.enableLogging && context.pendingContexts) { // was: Q.policy.mF && Q.policy.A && W.Pd
    // ... telemetry for missing contexts (lines 41314–41322)
  }

  // Create the Cb request
  if (!requestPolicy.setData(context, controller.policy, controller.bandwidthState) &&
      controller.policy.enableContextValidation) { // was: !c.setData(W, Q.policy, Q.j) && Q.policy.mF
    controller.loader.handleError("player.exception", {
      reason: "buildsabrrequestdatafailed"
    }, 1);
  }

  const request = new SabrRequest( // was: new Cb(…)
    controller.policy,
    requestPolicy,
    controller.formatMap,
    controller.bandwidthState,
    controller,
    options,
    controller.loader.getConnectionInfo() // was: Q.loader.f4()
  );

  markTimingCheckpoint(controller.timing); // was: zD(Q.timing)

  if (controller.policy.enableRequestTelemetry) { // was: Q.policy.gA
    controller.loader.logTelemetry("sabrcrqinfo", {
      rn: request.describe(),       // was: m.d_()
      probe: requestPolicy.isProbe() // was: c.tq()
    });
  }

  return controller.lastRequest = request; // was: Q.HA = m
}

// ---------------------------------------------------------------------------
// Helpers referenced but defined elsewhere (stubs for completeness)
// ---------------------------------------------------------------------------

/* These are called by the functions above but live in other modules.
 *
 * recordSegmentRequest       [was: jJ]           — buffer-stats.js
 * markTimingCheckpoint       [was: zD]           — buffer-stats.js
 * buildRequest               [was: We]           — segment-loader.js
 * computeBaseReadahead       [was: Do]           — playback-controller.js
 * getManifestStartTime       [was: jmK]          — manifest-handler.js
 * refreshManifest            [was: mt]           — manifest-handler.js
 * setBlockReason             [was: Oe]           — (local)
 * logRequestDecision         [was: Gt]           — (local)
 * checkRateLimit             [was: hpm]          — (local)
 * isEndOfStream              [was: $2]           — (local)
 * computeReadaheadAmounts    [was: zpy]          — (local)
 * flushPendingContextUpdates [was: Gg_]          — (local)
 * isFullSegmentRequest       [was: GJ]           — segment-loader.js
 * computeThrottleDelay       [was: FBd]          — quality-manager.js
 * buildKnownFormatConstraints [was: ZzX]         — quality-constraints.js
 * buildVideoFeedback         [was: GD]           — quality-constraints.js
 * isAV1Capable               [was: Yi]           — codec-detection.js
 * createRange                [was: Lk]           — format-parser.js
 * parseError                 [was: UU]           — error-handler.js
 */
