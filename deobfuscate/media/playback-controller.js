/**
 * Video element API wrapper and playback state synchronization.
 *
 * Extracted from base.js lines ~90000-93500.
 * Covers the DASH/SABR request lifecycle, request timing, bandwidth
 * estimation, format selection (ABR), and the track state management
 * that drives the HTML5 video element.
 *
 * @module playback-controller
 */
import { adMessageRenderer } from '../core/misc-helpers.js'; // was: rc
import { updateProgress, getDuration } from '../player/time-tracking.js';
import { dispose } from '../ads/dai-cue-range.js';
import { createLogger } from '../core/event-registration.js';
import { buildRequestUrl, createXHR, parseResponse } from '../core/composition-helpers.js';
import { toString } from '../core/string-utils.js';
import { processResponse } from '../data/collection-utils.js';
import { clearPendingRequests } from './track-manager.js';
import { isTimeInRange } from './codec-helpers.js';
import { setTimestampOffset } from './media-source.js';

// ---------------------------------------------------------------------------
// Network request timing
// ---------------------------------------------------------------------------

/**
 * Tracks timing for a single network request: connection, first-byte,
 * download completion, and stall detection.
 * [was: sWa]
 */
export class RequestTimeoutMonitor { // was: sWa
  /**
   * @param {object} requestHost - Host request object [was: Q / l0]
   * @param {object} policy - Timeout policy [was: c]
   * @param {object} urlBuilder - URL builder [was: W / lC]
   * @param {object} resourceInfo - Resource pool info [was: m / yp]
   * @param {object} timing - Request timing [was: K]
   * @param {object} logger - Logger instance [was: T]
   * @param {object} retryState - Retry state [was: r / j]
   * @param {object} authContext - Auth context [was: U / Oc]
   * @param {boolean} [isServerDriven=false] - Server-driven cancellation [was: I / D]
   */
  constructor(requestHost, policy, urlBuilder, resourceInfo, timing, logger, retryState, authContext, isServerDriven = false) {
    this.requestHost = requestHost; // was: this.l0
    this.policy = policy;
    this.urlBuilder = urlBuilder; // was: this.lC
    this.resourceInfo = resourceInfo; // was: this.yp
    this.timing = timing;
    this.logger = logger;
    this.retryState = retryState; // was: this.j
    this.authContext = authContext; // was: this.Oc
    this.isServerDriven = isServerDriven; // was: this.D
    this.lastError = null;
    this.stallCount = 0; // was: this.W
    this.hasTimedOut = false; // was: this.K
    this.consecutiveStalls = 0; // was: this.A
    this.checkTimer = new RepeatingTimer(
      () => this.check(), this.policy.checkIntervalMs, this
    ); // was: this.O = new g.Uc(this.J, this.policy.Rt, this)
  }

  /**
   * Periodic timeout check. Compares elapsed time against thresholds
   * and fires timeout if exceeded.
   * [was: J method]
   */
  check() { // was: J()
    if (this.isDisposed()) return;

    const now = performance.now();
    let shouldTimeout = false; // was: c

    if (this.policy.useWalltimeTimeout) { // was: this.policy.w6
      const baseline = this.timing.firstByteTime > 0
        ? this.timing.startTime
        : this.timing.connectTime; // was: W
      if (this.policy.resetTimeoutOnMetadata && this.consecutiveStalls) {
        // Use last stall time as baseline
      }
      const elapsed = now - baseline - (
        this.policy.useFixedDelay
          ? this.policy.fixedDelayMs
          : this.timing.roundTripTime() * 1000
      ); // was: Q
      const retryInfo = getRetryInfo(this.getRetryState(), false); // was: W = Hd(Lb(this), !1)
      if (elapsed >= 2000 * retryInfo) {
        shouldTimeout = true;
      } else if (elapsed >= this.policy.stallThresholdMs * retryInfo) { // was: Q.policy.T0
        this.stallCount = this.policy.maxStallWarnings; // was: this.W = this.policy.FN
      }
    } else if (this.timing.firstByteTime > 0) {
      if (this.isServerDriven) {
        if (this.policy.resetOnServerDriven) this.stallCount = 0;
        return;
      }
      const prevProgress = this.timing.getProgress(); // was: Q = this.timing.iX()
      this.timing.updateProgress(); // was: this.timing.Sh()
      if (this.timing.getProgress() - prevProgress >= this.policy.checkIntervalMs * 0.8) {
        this.stallCount++;
        shouldTimeout = this.stallCount >= 5;
      } else {
        this.stallCount = 0;
      }
    } else {
      const waitTime = now - this.timing.getQueuedTime(); // was: c = Q - this.timing.QE()
      if (this.policy.maxStallWarnings && waitTime > 0) {
        this.stallCount += 1; // was: this.W += 1
      }
      const retryMultiplier = getRetryInfo(this.getRetryState(), false) * this.policy.headMissSecs; // was: Q.policy.lz
      shouldTimeout = waitTime > retryMultiplier * 1000;
    }

    if (this.stallCount > 0) this.requestHost.onStallWarning(); // was: this.l0.Iq()
    if (shouldTimeout) {
      this.fireTimeout(); // was: this.aY()
    } else {
      this.checkTimer.start(); // was: this.O.start()
    }
  }

  /**
   * Fires a timeout event, aborting the request.
   * [was: aY]
   */
  fireTimeout() { // was: aY()
    this.hasTimedOut = true; // was: this.K = !0
    this.requestHost.abort(); // was: this.l0.AY()
    this.lastError = "net.timeout";
    signalError(this); // was: wt(this)
  }

  /**
   * Checks whether the request can be retried.
   * [was: canRetry]
   *
   * @param {boolean} isDecorated - Whether the request is ad-decorated [was: Q]
   * @returns {boolean}
   */
  canRetry(isDecorated) {
    const retryState = this.getRetryState(); // was: c = Lb(this)
    const maxRetries = isDecorated ? this.policy.maxDecoratedRetries : this.policy.maxRetries; // was: Q.policy.PQ : Q.policy.xq
    return retryState.timedOut < this.policy.maxTimeouts && retryState.errorCount < maxRetries; // was: c.timedOut < this.policy.uv && c.W < Q
  }

  /**
   * Returns the last error string.
   * [was: il]
   */
  getLastError() { // was: il()
    return this.lastError;
  }

  /**
   * Returns the stall warning count.
   * [was: vn]
   */
  getStallCount() { // was: vn()
    return this.stallCount;
  }

  /**
   * Disposes the timer.
   */
  dispose() {
    this.checkTimer.dispose();
  }

  /** @private */
  getRetryState() {
    return getRetryBucket(this.retryState); // was: Lb(this)
  }
}

// ---------------------------------------------------------------------------
// DASH segment request (XHR-based)
// ---------------------------------------------------------------------------

/**
 * Manages a single DASH segment fetch over XHR, including UMP parsing,
 * response status handling, bandwidth measurement, and retry logic.
 * [was: xU]
 */
export class DashSegmentRequest { // was: xU
  /**
   * @param {object} policy - Request policy [was: Q]
   * @param {object} segmentInfo - Segment info [was: c]
   * @param {object} timingConfig - Timing/scheduler config [was: W]
   * @param {object} bandwidthState - Bandwidth state [was: m]
   * @param {Function} callback - Response callback [was: K]
   * @param {object} options - Additional options (ZD, Y7, poToken, etc.) [was: destructured]
   */
  constructor(policy, segmentInfo, timingConfig, bandwidthState, callback, options = {}) {
    this.policy = policy;
    this.info = segmentInfo;
    this.logger = createLogger("dash/request"); // was: new g.JY("dash/request")
    this.httpStatus = 0; // was: this.XS
    this.responseItag = 0; // was: this.JY
    this.hasServerBWE3 = false; // was: this.vP
    this.headSeqnum = null; // was: this.D2
    this.headTimeMillis = null; // was: this.Mu
    this.isRedirected = false; // was: this.IT
    this.utcSeekTime = null; // was: this.Fr
    this.utcSeekTimestamp = null; // was: this.Vf
    this.hasReceivedData = false; // was: this.wP
    this.isServerClosed = false; // was: this.vZ
    this.redirectAction = null; // was: this.rG
    this.heartbeatInterval = 0; // was: this.Aq
    this.gapDetected = false; // was: this.gx
    this.isEndOfStreamSignaled = false; // was: this.xg

    // Set up timing
    this.timing = new RequestTiming(this, timingConfig); // was: new sA(this, W)

    // Set up URL
    this.isSmallBuffer = options.isSmallBuffer || false; // was: this.Y7
    this.urlBuilder = buildRequestUrl(this.info, this.policy, bandwidthState); // was: g.Pd(...)
    this.urlBuilder.set("rn", this.getRequestNumber().toString());
    this.urlBuilder.set("rbuf", (options.bufferHealth * 1000).toFixed().toString());
    if (this.isSmallBuffer) this.urlBuilder.set("smb", "1");
    if (this.policy.attachPoToken && options.poToken) {
      this.urlBuilder.set("pot", options.poToken);
    }

    // Set up timeout monitor
    this.timeoutMonitor = new RequestTimeoutMonitor(
      this, this.policy, this.urlBuilder, this.info.resourcePool,
      this.timing, this.logger, bandwidthState, options.authContext
    ); // was: this.qm = new sWa(...)

    // UMP parser if enabled
    if (this.policy.useUmp) {
      this.umpParser = new UmpParser(this); // was: this.Vq = new dF(this)
      this.urlBuilder.set("ump", "1");
      this.urlBuilder.set("srfvp", "1");
    }

    // Start the XHR
    const xhrOptions = {};
    if (this.policy.usePostForMedia || this.umpParser || this.policy.useSsdaiPost) {
      xhrOptions.method = "POST";
      // Build post body from protobuf
    }

    try {
      this.xhr = createXHR(this.urlBuilder, this.policy.networkConfig, this.timing,
        this.policy.isStreaming, xhrOptions);
      this.timeoutMonitor.checkTimer.start();
    } catch (error) {
      handleXHRError(this, error, true); // was: L0y(this, S, !0)
    }

    this.callback = callback;
  }

  /**
   * Returns the request number (monotonic ID).
   * [was: d_]
   */
  getRequestNumber() { // was: d_()
    return this.timing.requestNumber;
  }

  /**
   * Returns the full request URL.
   * [was: Lk]
   */
  getUrl() { // was: Lk()
    return this.urlBuilder.getUrl(); // was: this.lC.Lk()
  }

  /**
   * Builds error details for logging.
   * [was: Pp]
   */
  getErrorInfo() { // was: Pp()
    const info = getTimeoutErrorInfo(this.timeoutMonitor); // was: TR7(this.qm)
    if (this.umpParser) {
      const ump = this.umpParser;
      const remaining = ump.buffer.totalLength; // was: c.W.totalLength
      info.ulen = remaining;
      if (remaining > 0) {
        info.ubyte = peekByte(ump.buffer, 0); // was: Wl(c.W, 0)
      }
    }
    info.itag = this.info.segments[0].formatHandle.info.itag;
    info.sq = `${this.info.segments[0].segmentNumber}`;
    if (this.httpStatus === 410 || this.httpStatus === 500 || this.httpStatus === 503) {
      info.fmt_unav = "true";
    }
    return info;
  }

  /**
   * Called when the XHR receives new data (readyState change).
   * [was: P7]
   */
  onProgress() { // was: P7()
    if (this.isDisposed() || !this.xhr) return;
    this.httpStatus = this.xhr.status;
    if (this.hasData()) {
      this.emitProgress(2); // was: this.bu(2)
    } else if (!this.isRedirected && this.isPartiallyLoaded()) {
      this.emitProgress();
      this.isRedirected = true;
    }
  }

  /**
   * Called when the XHR load completes.
   * [was: U$]
   */
  onLoadComplete() { // was: U$()
    if (this.isDisposed() || !this.xhr) return;
    this.httpStatus = this.xhr.status;
    const resultCode = this.processResponse(this.xhr); // was: Q = this.Ow(Q)
    if (resultCode === 5) {
      signalError(this.timeoutMonitor); // was: wt(this.qm)
    } else {
      this.setState(resultCode); // was: this.l3(Q)
    }
    this.timeoutMonitor.checkTimer.stop();
  }

  /**
   * Processes the final XHR response: checks for redirects, errors,
   * measures bandwidth, and returns a status code.
   * [was: Ow]
   *
   * @param {object} xhr - XHR object [was: Q]
   * @returns {number} Status code: 3=redirect, 4=complete, 5=error
   */
  processResponse(xhr) { // was: Ow(Q)
    this.extractResponseData(); // was: wE_(this)

    // Check for bad status
    if (isRetryableError(this.timeoutMonitor, this.xhr.status,
        this.umpParser ? (this.timing.hasFirstByte || this.hasReceivedData) : this.xhr.isOk(),
        false, this.isEndOfStreamSignaled)) {
      return 5;
    }

    // Check for redirect
    let redirectUrl = "";
    if (hasRedirect(this.timeoutMonitor, this.xhr)) {
      redirectUrl = getRedirectUrl(this.timeoutMonitor, this.xhr);
    }
    if (redirectUrl) {
      incrementRetryCount(this.getRetryState());
      this.info.applyRedirect(this.urlBuilder, redirectUrl); // was: this.info.jZ(this.lC, c)
      return 3;
    }

    // For UMP requests, finalize parsing
    if (this.umpParser) {
      this.extractResponseData(); // flush remaining
      this.parseRemainingData();
      if (isRetryableError(this.timeoutMonitor, this.xhr.status,
          this.timing.hasFirstByte || this.hasReceivedData, false, this.isEndOfStreamSignaled)) {
        return 5;
      }
      if (!this.isServerClosed) {
        if (this.hasReceivedData) {
          incrementRetryCount(this.getRetryState());
          return 3;
        }
        this.timeoutMonitor.lastError = "net.closed";
        return 5;
      }
    }

    // Measure bandwidth from response headers
    const contentLength = xhr.getContentLength();
    const serverBWE = this.isStreamingXHR() ? xhr.getResponseHeader("X-Bandwidth-Est") : 0;
    const serverBWE3 = this.isStreamingXHR() ? xhr.getResponseHeader("X-Bandwidth-Est3") : 0;
    let bwe = serverBWE ? Number(serverBWE) : 0;
    if (serverBWE3) {
      this.hasServerBWE3 = true;
      if (this.policy.preferServerBWE3) bwe = Number(serverBWE3);
    }

    reportBandwidthMeasurement(this.timeoutMonitor, contentLength, bwe,
      this.info.segments[0].type === 5 /* probe */);
    return 4;
  }

  /**
   * Checks if a retry is possible.
   * [was: canRetry]
   */
  canRetry() {
    this.isDisposed();
    const isDecorated = this.info.isDecorated();
    return this.timeoutMonitor.canRetry(isDecorated);
  }

  /**
   * Aborts the request and deactivates timing.
   * [was: AY]
   */
  abort() { // was: AY()
    if (this.xhr) this.xhr.abort();
    this.timing.deactivate();
  }

  /**
   * Returns buffered chunks ready for consumption.
   * [was: LB]
   */
  getChunks() { // was: LB()
    if (!this.getBufferedChunks().length) return [];
    this.hasConsumedChunks = true; // was: this.Az = !0
    return this.responseParser.getChunks(); // was: this.Or.LB()
  }

  /**
   * Reports whether new data is available to consume.
   * [was: uW]
   */
  hasData() { // was: uW()
    if (this.state < 1) return false;
    return (this.responseParser && this.responseParser.hasPendingChunks()) ||
           this.xhr?.hasResponseData();
  }

  /**
   * Returns the last error string.
   * [was: il]
   */
  getLastError() { // was: il()
    return this.timeoutMonitor.getLastError();
  }

  /**
   * Disposes the request, cleaning up timers and XHR.
   */
  dispose() {
    this.timeoutMonitor.dispose();
    this.heartbeatTimer?.dispose();
    if (!this.policy.deferXHRDispose) this.abort();
  }

  /** @private */
  extractResponseData() { // was: At(Q)
    try {
      if (this.xhr?.hasHeaders() && this.xhr.hasResponseData() &&
          !hasRedirect(this.timeoutMonitor, this.xhr)) {
        if (!this.responseParser) {
          this.responseParser = new SegmentResponseParser(this.policy, this.info.segments);
        }
        if (this.xhr.hasResponseData()) {
          if (this.umpParser) {
            this.umpParser.feed(this.xhr.consumeResponse());
          } else {
            parseResponse(this.responseParser, this.xhr.consumeResponse(), false);
          }
        }
      }
    } catch (error) {
      if (this.umpParser) {
        handleUmpError(this, error);
      } else {
        reportError(error);
      }
    }
  }

  /** @private */
  isStreamingXHR() {
    return !this.policy.networkConfig.disableSubfragmented && !isNaN(this.info.headMargin) && this.info.headMargin > 0;
  }

  /** @private */
  getRetryState() {
    return getRetryBucket(this.timeoutMonitor.retryState);
  }
}

// ---------------------------------------------------------------------------
// SABR (Server ABR) request
// ---------------------------------------------------------------------------

/**
 * Manages a SABR streaming request, which multiplexes audio+video data,
 * metadata, and control messages over a single POST connection.
 * [was: Cb]
 */
export class SabrRequest { // was: Cb
  /**
   * @param {object} policy - Request policy [was: Q]
   * @param {object} requestInfo - Request info (PHn) [was: c]
   * @param {object} mediaState - Media state [was: W / k0]
   * @param {object} retryState - Bandwidth/retry state [was: m]
   * @param {object} requestManager - Parent request manager [was: K / l0]
   * @param {object} timingConfig - Timing config [was: T]
   * @param {object} authContext - Auth context [was: r]
   */
  constructor(policy, requestInfo, mediaState, retryState, requestManager, timingConfig, authContext) {
    this.policy = policy;
    this.info = requestInfo;
    this.mediaState = mediaState; // was: this.k0
    this.requestManager = requestManager; // was: this.l0
    this.logger = createLogger("sabr"); // was: new g.JY("sabr")

    this.umpParser = new UmpParser(this); // was: this.Vq = new dF(this)
    this.messageHandler = new SabrMessageHandler(this); // was: this.zq = new w39(this)
    this.mediaStore = new MediaSegmentStore(this); // was: this.Sa = new b79(this)

    this.state = 1; // LOADING
    this.isRedirected = false; // was: this.nI
    this.cancellationTimestamp = 0; // was: this.F2
    this.clipId = "";
    this.segmentNumber = -1;
    this.segmentStartTimeMs = -1;
    this.requestBodySize = 0; // was: this.qt
    this.lastMediaSeqnum = -1; // was: this.Sm
    this.serverPlaybackPaused = false; // was: this.i4
    this.isEndOfStreamSignaled = false; // was: this.xg

    // Set up timing
    this.timing = this.policy.enableSabrTiming
      ? new LiveRequestTiming(this, timingConfig) // was: Li
      : new RequestTiming(this, timingConfig); // was: sA

    // Build URL
    this.urlBuilder = this.policy.enableSabrHostFallback
      ? requestInfo.fallbackUrl
      : buildSabrUrl(requestInfo, this.policy, retryState);
    this.urlBuilder.set("rn", `${this.getRequestNumber()}`);
    this.urlBuilder.set("alr", "yes");

    // Set up timeout monitor
    this.timeoutMonitor = new RequestTimeoutMonitor(
      this, this.policy, this.urlBuilder, requestInfo.resourcePool,
      this.timing, this.logger, retryState, authContext,
      this.policy.enableServerDrivenRequestCancellation
    );

    // Start XHR
    const postBody = requestInfo.serializedPayload; // was: c.O
    const xhrOptions = { method: "POST", body: postBody };
    if (postBody) this.requestBodySize = postBody.length;

    try {
      this.xhr = createXHR(this.urlBuilder, this.policy.networkConfig,
        this.timing, true /* streaming */, xhrOptions);
      this.timeoutMonitor.checkTimer.start();
    } catch (error) {
      reportError(error);
    }
  }

  /**
   * Returns the monotonic request number.
   * [was: d_]
   */
  getRequestNumber() { // was: d_()
    return this.timing.requestNumber;
  }

  /**
   * Returns whether the request has completed (success or error).
   * [was: isComplete]
   */
  isComplete() { // was: isComplete()
    return this.state >= 3;
  }

  /**
   * Returns true if the request completed successfully with data.
   * [was: Gc]
   */
  isSuccessful() { // was: Gc()
    return this.state === 3;
  }

  /**
   * Returns true if the request ended in error.
   * [was: CB]
   */
  hasError() { // was: CB()
    return this.state === 5;
  }

  /**
   * Returns the last error string.
   * [was: il]
   */
  getLastError() { // was: il()
    return this.timeoutMonitor.getLastError();
  }

  /**
   * Aborts the request (both timing and XHR).
   * [was: AY]
   */
  abort() { // was: AY()
    this.timing.deactivate();
    this.xhr?.abort();
  }

  /**
   * Returns chunks for a given format ID.
   * [was: LB]
   */
  getChunks(formatId) { // was: LB(Q)
    return this.mediaStore.getChunks(formatId); // was: this.Sa.LB(Q)
  }

  /**
   * Returns whether there is data available for a given format.
   * [was: uW]
   */
  hasDataForFormat(formatId) { // was: uW(Q)
    return this.mediaStore.hasData(formatId); // was: this.Sa.uW(Q)
  }

  /**
   * Returns all format IDs being served by this request.
   * [was: B4]
   */
  getFormatIds() { // was: B4()
    return this.mediaStore.getFormatIds(); // was: this.Sa.B4()
  }

  /**
   * Builds error details for logging.
   * [was: Pp]
   */
  getErrorInfo() { // was: Pp()
    const info = getTimeoutErrorInfo(this.timeoutMonitor);
    Object.assign(info, getRequestBodyInfo(this.info));
    info.req = "sabr";
    info.rn = this.getRequestNumber();
    if (this.xhr?.status) {
      info.adMessageRenderer = this.policy.useNetworkErrorCodeEnums
        ? this.xhr.status
        : this.xhr.status.toString();
    }
    return info;
  }

  /**
   * Disposes the SABR request.
   */
  dispose() {
    if (!this.isDisposed()) {
      this.timeoutMonitor.dispose();
      this.cancellationTimer?.dispose();
      this.setState(-1);
      this.abort();
    }
  }

  /** @private */
  setState(code) { // was: l3(Q)
    this.state = code;
    handleSabrResponse(this.requestManager, this); // was: gB(this.l0, this)
  }
}

// ---------------------------------------------------------------------------
// Track state (audio/video)
// ---------------------------------------------------------------------------

/**
 * Manages the state of a single media track (audio or video):
 * its source buffer binding, format handle, pending segments,
 * active requests, and buffer append queue.
 * [was: h_D]
 */
export class TrackState { // was: h_D
  /**
   * @param {object} loader - Parent loader [was: Q]
   * @param {object} policy - Policy config [was: c]
   * @param {object} formatHandle - Format/representation [was: W / OH]
   * @param {object} timing - Timing state [was: m]
   */
  constructor(loader, policy, formatHandle, timing) {
    this.loader = loader;
    this.policy = policy;
    this.formatHandle = formatHandle; // was: this.OH
    this.timing = timing;
    this.logger = createLogger("dash"); // was: new g.JY("dash")
    this.activeRequests = []; // was: this.O
    this.requestHistory = []; // was: this.b0
    this.sourceBuffer = null; // was: this.Gy
    this.pendingData = null; // was: this.W
    this.hasFormatChanged = false; // was: this.jG
    this.lastRequestTiming = 0; // was: this.Ka
    this.appendStallCount = 0; // was: this.MM
    this.maxSegmentNumber = -1; // was: this.K
    this.hasReceivedFirstSegment = false; // was: this.S
    this.endOfStreamSegment = -1; // was: this.T2
    this.endOfStreamTimer = null; // was: this.Ie
    this.lastAppendedTime = NaN; // was: this.mF
    this.pendingKeyRotations = []; // was: this.Y

    // Internal append state
    this.appendState = new AppendState(loader, policy, formatHandle); // was: this.A = new uKH(...)

    // Buffer timeline (optional)
    if (this.policy.enableBufferTimeline) { // was: this.policy.W
      this.timelineAppender = new BufferTimelineAppender(
        this.appendState, this.loader.getManifest(), this.policy
      ); // was: this.J = new i70(...)
    }

    // Debug logging (optional)
    if (this.policy.enableTimingMarks) { // was: this.policy.WB
      this.debugLogger = new SourceBufferDebugLogger(this); // was: this.L = new $XS(this)
    }

    this.averageBitrate = formatHandle.info.averageBitrate; // was: this.w3
    this.isInitiallyManifestless = this.policy.disableCompanionTrack
      ? false : formatHandle.isPartiallyLoaded(); // was: this.D
    this.isManifestless = formatHandle.isPartiallyLoaded(); // was: this.isManifestless
    this.needsInit = this.isInitiallyManifestless; // was: this.j
  }

  /**
   * Whether this track carries audio.
   * [was: Dg]
   */
  isAudioTrack() { // was: Dg()
    return !!this.formatHandle.info.audio;
  }

  /**
   * Returns the last received (appended) segment info.
   * [was: GR]
   */
  getLastReceived() { // was: GR()
    return this.appendState.getLastReceived(); // was: this.A.GR()
  }

  /**
   * Marks a segment as consumed from the append queue.
   * [was: B7]
   */
  consumeSegment(segment) { // was: B7(Q)
    this.appendState.consumeSegment(segment);
    this.timelineAppender?.onSegmentConsumed(segment);
    this.averageBitrate = Math.max(
      this.averageBitrate,
      segment.info.formatHandle.info.averageBitrate || 0
    );
  }

  /**
   * Returns the total duration from the format index.
   * [was: getDuration]
   */
  getDuration() { // was: getDuration()
    return this.formatHandle.index.getTotalDuration(); // was: this.OH.index.GO()
  }

  /**
   * Clears all pending requests and resets append state.
   * [was: tI]
   */
  reset() { // was: tI()
    clearPendingRequests(this); // was: qO(this)
    this.appendState.reset(); // was: this.A.tI()
  }

  /**
   * Returns the internal append-state manager.
   * [was: dn]
   */
  getAppendState() { // was: dn()
    return this.appendState; // was: this.A
  }

  /**
   * Checks if the given time falls within a buffered range.
   * [was: m$]
   */
  hasDataAt(time) { // was: m$(Q)
    return this.sourceBuffer
      ? isTimeInRange(this.sourceBuffer.getBuffered(), time)
      : true;
  }

  /**
   * Reports a QoE event through the loader.
   */
  reportEvent(name, data) { // was: tJ(Q, c)
    this.loader.reportEvent(name, data);
  }

  /**
   * Sets the timestamp offset on the timeline and debug logger.
   * [was: gB]
   */
  setTimestampOffset(offset) { // was: gB(Q)
    this.timelineAppender?.setTimestampOffset(offset);
    this.debugLogger?.setTimestampOffset(offset);
  }

  dispose() {
    this.debugLogger?.flush();
  }
}
