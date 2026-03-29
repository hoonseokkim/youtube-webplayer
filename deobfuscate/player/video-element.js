import { dispose } from '../ads/dai-cue-range.js';
import { M4 } from '../core/composition-helpers.js';
import { registerDisposable } from '../core/event-system.js';
import { reportWarning } from '../data/gel-params.js';
import { RequestBase } from './audio-config.js';
import { parseLayoutExitTriggers } from '../ads/dai-layout.js'; // was: wP
import { findChildAtTime } from './state-init.js'; // was: vZ
import { layoutMatchesMetadata } from '../network/uri-utils.js'; // was: gx
import { isClipActive } from '../ui/progress-bar-impl.js'; // was: xg
import { flushPendingGrafts } from '../ads/ad-async.js'; // was: Y7
import { safeDecodeURIComponent } from '../data/idb-transactions.js'; // was: d_
import { sendFinalFlush } from '../core/event-system.js'; // was: qH
import { collectFlagged } from '../ads/ad-scheduling.js'; // was: Vq
import { accumulateBytes } from '../ads/ad-prebuffer.js'; // was: qm
import { bezierY } from '../core/bitstream-helpers.js'; // was: Oc
import { getTraceBackend } from '../data/gel-core.js'; // was: yp
import { RequestTimeoutMonitor } from '../media/playback-controller.js'; // was: sWa
import { FROZEN_EMPTY_ARRAY } from '../proto/messages-core.js'; // was: jy
import { getElapsedPlayTime } from '../modules/remote/remote-player.js'; // was: L1
import { getCookieAuthToken } from '../core/event-system.js'; // was: cO
import { createByteRange } from '../media/format-parser.js'; // was: Lk
import { readByte } from '../data/collection-utils.js'; // was: Wl
import { adMessageRenderer } from '../core/misc-helpers.js'; // was: rc
import { isSafeInteger } from '../proto/messages-core.js'; // was: C3
import { cueAdVideo } from './media-state.js'; // was: OH
import { HEX_COLOR_VALIDATION_REGEX } from '../modules/caption/caption-data.js'; // was: Or
import { deepEquals } from '../data/gel-core.js'; // was: KL
import { isH5MultiviewDaiEnabled } from './media-state.js'; // was: U$
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { readUnsignedInt } from '../media/format-parser.js'; // was: AY
import { handleGaplessSeek } from '../media/live-playback.js'; // was: Iq
import { coerceString } from '../core/composition-helpers.js'; // was: vn
import { scheduleHeartbeat } from '../modules/heartbeat/health-monitor.js'; // was: LB
import { logAdFetchTimeout } from '../ads/ad-prebuffer.js'; // was: ZC
import { scheduleNotification } from '../core/composition-helpers.js'; // was: Az
import { pubsub2TopicToKeys } from '../data/idb-operations.js'; // was: bV
import { LayoutRenderingAdapter } from '../ui/cue-manager.js'; // was: il
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { isDebuggingEvent } from '../data/gel-logger.js'; // was: lE
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { startVideoPlayback } from './player-events.js'; // was: SF
import { errorConfigNamespace } from '../network/error-config.js'; // was: Uf
import { recordStallSample } from '../ads/ad-prebuffer.js'; // was: nt
import { recordAdjustedSample } from '../ads/ad-prebuffer.js'; // was: DC
import { EXP_748402147 } from '../proto/messages-core.js'; // was: Hw
import { hasCustomPlaybackSupport } from '../ui/seek-bar-tail.js'; // was: wd
import { LiveStreamBreakEndedTrigger } from '../ads/ad-trigger-types.js'; // was: uh
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { ListenerMap } from '../core/composition-helpers.js'; // was: Sa
import { requestCastSelector } from '../modules/remote/mdx-client.js'; // was: F2
import { buildFetchOptions } from '../network/service-endpoints.js'; // was: qt
import { isStandardDetailPage } from '../data/bandwidth-tracker.js'; // was: i4
import { addSlotObserver } from '../network/uri-utils.js'; // was: l1
import { expandUndecodedRange } from '../ads/ad-cue-delivery.js'; // was: Nm
import { SYM_BINARY } from '../proto/message-setup.js'; // was: by
import { preferAudioOnly } from '../media/audio-normalization.js'; // was: bb
import { isTimeInRange } from '../media/codec-helpers.js'; // was: zb
import { readUint32 } from '../modules/caption/caption-internals.js'; // was: Gl
import { listenAll } from '../core/attestation.js'; // was: TE
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { toString } from '../core/string-utils.js';
import { serializeMessage } from '../proto/varint-decoder.js';
import { Disposable } from '../core/disposable.js';
import { ObservableTarget } from '../core/event-target.js';
import { Logger } from '../data/logger-init.js';
// TODO: resolve g.h
// TODO: resolve g.t6
// TODO: resolve g.yc

/**
 * Full playback controller and video element API wrapper.
 * Source: base.js lines 90001–93376 (LARGEST remaining gap)
 *
 * Contains:
 * - DASH media request (xU) — complete adaptive bitrate request with UMP, retry, bandwidth estimation
 * - SABR request timing (Li) — server-adaptive bitrate request timing tracker
 * - SABR UMP handler (w39/dXo) — parses SABR UMP response messages
 * - Onesie prefetch cache (b79) — manages prefetched segment data per format
 * - SABR request (Cb) — complete SABR streaming request lifecycle
 * - Loader timing (gxm) — CSI tick tracking for loader events
 * - DAI stream controller (O7S) — server-stitched DAI layout management
 * - Client-side DAI ad config store (fRW) — cue-point-based ad configuration
 * - Format selection result (TF/Uu) — audio/video format change result
 * - Bandwidth estimator wrapper (vxD)
 * - Exponential moving average (wF) — bandwidth smoothing
 * - ABR controller (aRa) — adaptive bitrate quality switching
 * - DASH loader (b87) — main adaptive streaming loader orchestrating requests
 *
 * [was: xU, Li, dXo, w39, b79, Cb, gxm, O7S, fRW, TF, Uu, vxD, wF, aRa, b87]
 */

// ---------------------------------------------------------------------------
// DASH Media Request [was: xU]
// Complete adaptive bitrate request with UMP support, timeout/retry logic,
// bandwidth estimation, and segment parsing.
// ---------------------------------------------------------------------------
export class DashMediaRequest extends RequestBase {
  constructor(policy, info, bandwidthSnapshot, formatInfo, callback, options = {}) {
    super(info, callback);
    this.policy = policy;
    this.logger = new Logger("dash/request");
    this.httpStatus = 0;        // was: this.XS
    this.JY = 0;                // walltime offset
    this.hasBandwidthEst3 = false; // was: this.vP
    this.headSeqNum = null;     // was: this.D2
    this.headTimeMillis = null; // was: this.Mu
    this.isTimedOut = false;    // was: this.IT
    this.Fr = null;
    this.Vf = null;
    this.parseLayoutExitTriggers = false;
    this.findChildAtTime = false;
    this.rG = null;
    this.SlotEntryTriggerMetadata = 0;
    this.layoutMatchesMetadata = 0;
    this.isClipActive = false;

    this.timing = new sA(this, bandwidthSnapshot);
    this.flushPendingGrafts = options.flushPendingGrafts || false;  // server-managed bandwidth
    this.Fr = options.Fr || 0;
    this.Vf = options.Vf || new Uint8Array(0);
    this.lC = buildQueryParams(this.info, this.policy, formatInfo);
    this.lC.set("rn", this.safeDecodeURIComponent().toString());
    this.lC.set("rbuf", (options.sendFinalFlush * 1000 || 0).toFixed().toString());
    if (this.flushPendingGrafts) this.lC.set("smb", "1");
    if (this.policy.q$ && options.poToken) this.lC.set("pot", options.poToken);
    if (options.Wt) this.lC.set("bbs", options.Wt);

    if (this.policy.useUmp && !M4(4, 4761, this.lC.m7)) {
      this.collectFlagged = new dF(this);
      this.lC.set("ump", "1");
      this.lC.set("srfvp", "1");
    }

    this.accumulateBytes = new RequestTimeoutMonitor(this, this.policy, this.lC, this.info.getTraceBackend, this.timing, this.logger, formatInfo, options.bezierY);
    this.ZD = options.ZD || null;
    this.FROZEN_EMPTY_ARRAY = dsn(this);
    W0R(this.accumulateBytes);

    // Build request body for POST if needed
    let requestOptions;
    if (this.policy.OX || this.collectFlagged || this.policy.Ka) {
      requestOptions = { method: "POST" };
      const header = (0, g.t6)([120, 0]);
      const bodyFields = {};
      if (options.getElapsedPlayTime) bodyFields.vF = GD(undefined, options.getElapsedPlayTime);
      if (this.policy.Q7 && this.Vf) bodyFields.videoPlaybackUstreamerConfig = this.Vf;
      if (this.policy.Ka && this.info.j) Object.assign(bodyFields, this.info.j);
      requestOptions.body = Object.keys(bodyFields).length > 0 ? serializeMessage(bodyFields, g.yc) : header;
    }

    try {
      this.xhr = s6(this.lC, this.policy.L, this.timing, /* usePost */ policy.A7 ? policy.getCookieAuthToken && !isNaN(this.info.Og) && this.info.Og > policy.sB ? false : true : false, requestOptions);
      this.accumulateBytes.O.start();
    } catch (err) {
      L0y(this, err, true);
    }
  }

  safeDecodeURIComponent() { return this.timing.requestNumber; }
  createByteRange() { return this.lC.createByteRange(); }

  /** Build diagnostic payload. [was: Pp] */
  Pp() {
    const diagnostics = TR7(this.accumulateBytes);
    if (this.collectFlagged) {
      const ump = this.collectFlagged;
      const totalLen = ump.W.totalLength;
      diagnostics.ulen = totalLen;
      if (totalLen > 0) {
        const firstByte = readByte(ump.W, 0);
        diagnostics.ubyte = firstByte;
        if (totalLen === 1 && firstByte === 0) diagnostics.b248180278 = true;
      }
    }
    if (this.httpStatus) diagnostics.adMessageRenderer = this.policy.isSafeInteger ? this.httpStatus : this.httpStatus.toString();
    diagnostics.itag = this.info.eh[0].cueAdVideo.info.itag;
    diagnostics.ml = `${+this.info.eh[0].OH.W()}`;
    diagnostics.sq = `${this.info.eh[0].DF}`;
    if (this.httpStatus === 410 || this.httpStatus === 500 || this.httpStatus === 503) {
      diagnostics.fmt_unav = "true";
    }
    if (this.flushPendingGrafts) diagnostics.smb = "1";
    if (this.info.isDecorated()) diagnostics.sdai = "1";
    return diagnostics;
  }

  /** Handle progress events. [was: P7] */
  P7() {
    if (this.u0() || !this.xhr) return;
    this.httpStatus = this.xhr.status;
    if (this.policy.tY && this.HEX_COLOR_VALIDATION_REGEX) this.At(false);
    if (this.uW()) {
      this.bu(2);
    } else if (!this.isTimedOut && this.deepEquals()) {
      this.bu();
      this.isTimedOut = true;
    }
  }

  /** Handle response headers. [was: d9] */
  d9() {
    if (this.u0() || !this.xhr) return;
    if (!this.JY && this.xhr.Eo() && this.xhr.getResponseHeader("X-Walltime-Ms")) {
      const walltimeMs = Number(this.xhr.getResponseHeader("X-Walltime-Ms"));
      this.JY = ((0, g.h)() - walltimeMs) / 1000;
    }
    const headSeqNum = Number(this.xhr.getResponseHeader("X-Head-Seqnum"));
    const headTimeMs = Number(this.xhr.getResponseHeader("X-Head-Time-Millis"));
    this.qS?.stop();
    this.headSeqNum = headSeqNum || this.headSeqNum;
    this.headTimeMillis = headTimeMs || this.headTimeMillis;
  }

  /** Handle request completion. [was: U$] */
  isH5MultiviewDaiEnabled() {
    if (this.u0() || !this.xhr) return;
    this.httpStatus = this.xhr.status;
    const result = this.Ow(this.xhr); // was: Q
    if (this.policy.isTvHtml5Exact) this.qS?.stop();
    if (result === 5) {
      wt(this.accumulateBytes);
    } else {
      this.l3(result);
    }
    this.accumulateBytes.O.stop();
  }

  canRetry() {
    this.u0();
    const isDecorated = this.info.isDecorated();
    return this.accumulateBytes.canRetry(isDecorated);
  }

  onStateChange() {
    if (this.isComplete()) {
      if (this.policy.EJ) this.readUnsignedInt();
      else this.timing.deactivate();
    }
  }

  aY() { this.accumulateBytes.aY(); }
  handleGaplessSeek() { if (this.callback) this.callback(this, this.state); }
  coerceString() { return this.accumulateBytes.coerceString(); }

  dispose() {
    super.dispose();
    this.accumulateBytes.dispose();
    this.qS?.dispose();
    if (!this.policy.EJ) this.readUnsignedInt();
  }

  readUnsignedInt() {
    if (this.xhr) this.xhr.abort();
    this.timing.deactivate();
  }

  scheduleHeartbeat() {
    if (!this.logAdFetchTimeout().length) return [];
    this.scheduleNotification = true;
    return this.HEX_COLOR_VALIDATION_REGEX.scheduleHeartbeat();
  }

  uW() {
    if (this.state < 1) return false;
    return (this.HEX_COLOR_VALIDATION_REGEX && this.HEX_COLOR_VALIDATION_REGEX.Z5.length) || this.xhr?.Fz() ? true : false;
  }

  uw() { return this.JY; }
  pubsub2TopicToKeys() { this.xhr && (this.headSeqNum = Number(this.xhr.getResponseHeader("X-Head-Seqnum"))); return this.headSeqNum; }
  cH() { this.xhr && (this.headTimeMillis = Number(this.xhr.getResponseHeader("X-Head-Time-Millis"))); return this.headTimeMillis; }
  LayoutRenderingAdapter() { return this.accumulateBytes.LayoutRenderingAdapter(); }

  /** DRM heartbeat ping. [was: OP] */
  OP() {
    if (!this.u0() && this.xhr) {
      this.rp = "heartbeat";
      this.accumulateBytes.W += 2;
      this.handleGaplessSeek();
    }
  }
}

// ---------------------------------------------------------------------------
// RequestTimingBase   [was: Fma, base.js lines 89313-89409]
// ---------------------------------------------------------------------------

/**
 * Base class for network request timing instrumentation.
 *
 * Tracks a single media request's lifecycle timestamps (creation, header
 * arrival, first byte, completion), accumulated byte counts, stall time,
 * bandwidth snapshots, and policy-driven metrics. Each instance gets a
 * monotonically increasing requestNumber.  Subclasses (SabrRequestTiming,
 * DashRequestTiming) add protocol-specific bandwidth estimation.
 *
 * [was: Fma]
 */
let requestCounter = 0; // was: SOW
export class RequestTimingBase { // was: Fma
  constructor(delegate, options) { // was: Q, c
    this.l0 = delegate;                    // was: Q — delegate (notified on lifecycle events)
    this.requestNumber = ++requestCounter;  // was: ++SOW
    this.W = this.now();                    // creation timestamp
    this.S = this.b0 = NaN;                // first-byte time / header time
    this.J = this.W;                        // last progress timestamp
    this.A = this.gA = this.j = 0;          // byte counters
    this.L = this.W;                        // last bandwidth-sample timestamp
    this.WB = this.Ka = this.XI = this.Rt = this.w7 = this.PA = this.O = this.K = 0;
    this.T2 = this.isActive = false;
    this.nO = this.MQ = 0;                  // policy processing time accumulators
    this.Rk = { jr0: () => this.B5 };
    this.Qp = options.Qp;                   // bandwidth estimator
    this.snapshot = {};                      // was: x$(this.Qp) — bandwidth snapshot
    this.policy = this.Qp.O;                // active policy
    this.jp = !!options.jp;
    this.oN = options.oN;                    // bandwidth callback
    this.h6 = options.h6 || 0;
    this.Cr = options.Cr || 0;
    this.B5 = options.B5 ?? false;
    this.lE = options.lE ?? false;
  }

  /** Record header arrival time. [was: d9] */
  d9() {
    this.b0 = this.now();
    this.l0.d9();
  }

  /** Record progress (timestamp, bytesLoaded). [was: P7] */
  P7(timestamp, bytesLoaded) {
    timestamp - this.L < 10 && this.O > 0 || this.MM(timestamp, bytesLoaded);
    this.l0.P7(timestamp, bytesLoaded);
  }

  /** Update bandwidth sample. [was: MM] */
  MM(timestamp, bytesLoaded) {
    const dt = (timestamp - this.L) / 1e3;
    const db = bytesLoaded - this.A;
    if (!this.jp) this.oN(dt, db);
    this.L = timestamp;
    this.A = bytesLoaded;
  }

  /** Record stall. [was: CA] */
  CA(stallBytes) {
    if (!this.PA) {
      this.PA = this.j - this.gA + stallBytes;
      this.w7 = this.j;
      this.Rt = this.J;
    }
  }

  /** Mark first byte received. [was: Ie] */
  Ie(timestamp = this.J, bytes = this.j) {
    if (this.O <= 0) {
      this.S = timestamp;
      this.O = bytes;
      this.T2 = this.isActive = true;
    }
  }

  /** Return retry budget. [was: Re] */
  Re() { return this.Cr || 2; }

  /** Hook: request complete. [was: Hw] */
  Hw() {}
  /** Hook: request aborted. [was: pu] */
  pu() {}
  /** Hook: request error. [was: wd] */
  wd() {}

  /** Serialize timing metrics for logging. [was: Y] */
  Y() {
    const stats = {
      rn: this.requestNumber,
      rt: (this.J - this.W).toFixed(),       // round-trip time
      lb: this.j,                            // loaded bytes
      stall: (1e3 * this.K).toFixed(),       // stall duration ms
      ht: (this.b0 - this.W).toFixed(),      // header time
      elt: (this.S - this.W).toFixed(),       // first-byte latency
      elb: this.O,                           // first-byte loaded
      d: this.UH?.Eg(),                      // RLE debug data
    };
    if (this.policy.O) {
      stats.mph = this.MQ.toFixed();
      stats.tph = this.nO.toFixed();
    }
    stats.ulb = this.XI;
    stats.ult = this.Ka;
    return stats;
  }

  /** High-resolution timestamp. [was: now] */
  now() { return performance.now(); }

  /** Deactivate the request. [was: deactivate] */
  deactivate() {
    if (this.isActive) this.isActive = false;
  }
}

// ---------------------------------------------------------------------------
// SABR Request Timing [was: Li]
// Server-adaptive bitrate request timing — extends RequestTimingBase [was: Fma]
// ---------------------------------------------------------------------------
export class SabrRequestTiming extends RequestTimingBase { // was: Li extends Fma
  constructor(request, options) { // was: Q, c
    super(request, options);
    this.hasReceivedBandwidth = true; // was: this.HA
    this.hasGlobalBandwidth = false;  // was: this.jG
    this.bytesForBandwidth = 0;       // was: this.Xw / this.La
    this.durationForBandwidth = 0;
    this.estimatedAckTimeMs = NaN;    // was: this.JJ
    this.Fw = NaN;
    this.applyQualityConstraint = 0;
    if (options.isDebuggingEvent) this.mF = new tL(); // network-timing-spec logger
  }

  /** On request complete. [was: qQ] */
  skipNextIcon(timestamp, bytesLoaded) {
    startVideoPlayback(this, timestamp, bytesLoaded);
    this.MM(timestamp, bytesLoaded);
    if (this.isDebuggingEvent && this.D) {
      const delta = bytesLoaded - this.D.h4;
      gbd(this, 0, timestamp - this.D.localTimestampMs, timestamp - this.D.localTimestampMs, delta, this.D.errorConfigNamespace > 0 ? delta / this.D.errorConfigNamespace * 1000 : 0);
    }
    // Update bandwidth stats
    if (this.hasGlobalBandwidth) {
      const estimatedTime = this.A * this.snapshot.stall + this.A / this.snapshot.byterate;
      if (this.O > 0) recordStallSample(this.Qp, this.bytesForBandwidth, this.K);
      const elapsed = (timestamp - this.W) / 1000 || 0.01;
      if (this.policy.L && !(this.O > 0)) recordAdjustedSample(this.Qp, elapsed, this.A, estimatedTime, false);
    }
  }

  /** Record ACK timestamp from server. [was: Hw] */
  EXP_748402147(ackTimeMs) { this.estimatedAckTimeMs = ackTimeMs; }

  /** Record server timing pulse. [was: pu] */
  pu(pulse) { // was: Q
    if (pulse.timestampMs) this.estimatedAckTimeMs = pulse.timestampMs;
    if (pulse.l7) this.Fw = pulse.l7;
    if (!isNaN(this.estimatedAckTimeMs) && !isNaN(this.Fw)) {
      this.applyQualityConstraint = this.now() - this.Fw / 2 - this.estimatedAckTimeMs;
    }
  }

  /** Record wire-level timing data. [was: wd] */
  hasCustomPlaybackSupport(data) { // was: Q
    const prevUf = this.D?.errorConfigNamespace;
    const deltaAr = this.D ? data.Ar - this.D.Ar : 0;
    const now = this.now();
    const deltaBytes = this.j - (this.D?.h4 || 0);
    if (this.D && this.isDebuggingEvent) {
      const elapsed = isNaN(this.D.localTimestampMs) || isNaN(this.J) ? 0 : this.J - this.D.localTimestampMs;
      gbd(this, deltaAr, now - this.D.localTimestampMs, elapsed, deltaBytes, prevUf && prevUf > 0 ? deltaBytes / prevUf * 1000 : 0);
    }
    this.D = { Ar: data.Ar, localTimestampMs: now, h4: this.j, errorConfigNamespace: data.LiveStreamBreakEndedTrigger !== undefined ? data.LiveStreamBreakEndedTrigger * 1000 : 0 };
  }

  Y() {
    const diag = super.Y();
    diag.rbw = this.sC();
    diag.rbe = +this.hasReceivedBandwidth;
    diag.gbe = +this.hasGlobalBandwidth;
    diag.ackt = (this.estimatedAckTimeMs - this.W).toFixed();
    if (this.mF?.W()) diag.nts = this.mF.Eg();
    return diag;
  }

  Ie(timestamp = this.J, bytes = this.j) {
    if (!(this.O > 0)) {
      super.Ie(timestamp, bytes);
      const qp = this.Qp;
      qp.L.ER(1, (timestamp - this.isSamsungSmartTV) / 1000);
      qp.Ie.ER(1, (timestamp - this.isSamsungSmartTV) / 1000);
    }
  }

  isTvHtml5Exact() {} // no-op for SABR
  readRepeatedMessageField() { return NaN; }
  mainVideoEntityActionMetadataKey() { return this.W + this.snapshot.delay * 1000; }
  sC() { return this.bytesForBandwidth * 1000 / this.Y0(); }
  u3() { return this.S; }
  Y0() {
    const pending = this.hasReceivedBandwidth ? this.now() - this.L : 0;
    return Math.max(this.durationForBandwidth * 1000 + pending, 1);
  }
}

// ---------------------------------------------------------------------------
// SABR Request [was: Cb]
// Complete SABR (Server Adaptive Bitrate) streaming request lifecycle.
// Manages UMP demuxing, segment dispatch, retry, server-driven cancellation.
// ---------------------------------------------------------------------------
export class SabrRequest extends Disposable {
  constructor(policy, info, manifest, handler, formatInfo, timingOptions, retryOc) {
    super();
    this.policy = policy;
    this.info = info;
    this.k0 = manifest;
    this.l0 = handler;
    this.logger = new Logger("sabr");
    this.collectFlagged = new dF(this);       // UMP demuxer
    this.zq = new w39(this);       // SABR UMP message handler
    this.ListenerMap = new b79(this);       // prefetch cache
    this.state = 1;
    this.nI = false;               // redirect received
    this.requestCastSelector = 0;                   // cancellation timestamp
    this.clipId = "";
    this.segmentNumber = -1;
    this.segmentStartTimeMs = -1;
    this.buildFetchOptions = 0;
    this.Sm = -1;
    this.isStandardDetailPage = false;               // initialized flag
    this.isClipActive = false;               // format unavailable
    this.addSlotObserver = false;

    // Create timing
    this.expandUndecodedRange = policy.b6 ? new SabrRequestTiming(this, timingOptions) : new sA(this, timingOptions);
    this.lC = policy.Fw ? info.u$ : M5X(info, policy, formatInfo);
    this.lC.set("rn", `${this.d_()}`);
    this.lC.set("alr", "yes");

    upx(this.ListenerMap, manifest, policy);
    this.accumulateBytes = new RequestTimeoutMonitor(this, policy, this.lC, info.getTraceBackend, this.expandUndecodedRange, this.logger, formatInfo, retryOc, policy.enableServerDrivenRequestCancellation);
    W0R(this.accumulateBytes);

    if (policy?.SYM_BINARY) { registerDisposable(this, this.ListenerMap); registerDisposable(this, this.accumulateBytes); }

    const body = info.O;
    const requestOptions = { method: "POST", body };
    if (body) this.buildFetchOptions = body.length;

    try {
      this.xhr = s6(this.lC, policy.L, this.expandUndecodedRange, /* em */ true, requestOptions);
      this.accumulateBytes.O.start();
    } catch (err) {
      reportWarning(err);
    }
  }

  P7() { if (!this.u0() && this.xhr) { this.At(false); gB(this.l0, this); } }
  d9() {}

  isH5MultiviewDaiEnabled() {
    if (this.u0() || !this.xhr) return;
    const result = this.Ow();
    if (result === 5) { if (this.LayoutRenderingAdapter() === "net.badstatus") this.l0.eR(); wt(this.accumulateBytes); }
    else { this.l0.preferAudioOnly(); this.l3(result); }
    this.accumulateBytes.O.stop();
    this.pT?.stop();
  }

  canRetry() { this.u0(); return this.accumulateBytes.canRetry(false); }

  dispose() {
    if (!this.u0()) { super.dispose(); this.accumulateBytes.dispose(); this.pT?.dispose(); this.l3(-1); this.readUnsignedInt(); }
  }

  l3(newState) { this.state = newState; gB(this.l0, this); }
  isComplete() { return this.state >= 3; }
  CB() { return this.state === 5; }
  lQ() { return this.state === 4; }
  isTimeInRange() { return this.state >= 1; }
  safeDecodeURIComponent() { return this.expandUndecodedRange.requestNumber; }
  createByteRange() { return this.lC.createByteRange(); }
  readUnsignedInt() { this.expandUndecodedRange.deactivate(); this.xhr?.abort(); }
  LayoutRenderingAdapter() { return this.accumulateBytes.LayoutRenderingAdapter(); }
  coerceString() { return this.policy.MQ ? this.accumulateBytes.coerceString() : 0; }
  readUint32() { return "SABR"; }

  scheduleHeartbeat(formatId) { return this.ListenerMap.scheduleHeartbeat(formatId); }
  listenAll(formatId) { return this.ListenerMap.listenAll(formatId); }
  uW(formatId) { return this.ListenerMap.uW(formatId); }
  B4() { return this.ListenerMap.B4(); }

  /** Build diagnostic info. [was: Pp] */
  Pp() {
    const diag = TR7(this.accumulateBytes);
    Object.assign(diag, rB(this.info));
    diag.req = "sabr";
    diag.rn = this.safeDecodeURIComponent();
    if (this.xhr?.status) diag.adMessageRenderer = this.policy.isSafeInteger ? this.xhr.status : this.xhr.status.toString();
    return diag;
  }
}

// ---------------------------------------------------------------------------
// DAI Stream Controller [was: O7S]
// Manages server-stitched DAI layout tracking, ad metadata per segment
// ---------------------------------------------------------------------------
export class DaiStreamController extends ObservableTarget {
  constructor(loader, manifest, policy, videoTrack, audioTrack, isResumed) {
    super();
    this.loader = loader;
    this.k0 = manifest;
    this.policy = policy;
    this.videoTrack = videoTrack;
    this.audioTrack = audioTrack;
    this.Y = null;         // current video segment
    this.W = null;         // pending video segment
    this.K = NaN;          // was: this.D
    this.D = NaN;
    this.J = 0;
    this.L = NaN;
    this.Z1 = null;        // DAI state machine
    this.isSamsungSmartTV = NaN;
    this.T2 = NaN;
    this.Ie = new Map();
    this.j = NaN;
    this.A = NaN;
    this.S = NaN;
    this.O = isResumed ? 1 : 0; // state: 0=inactive, 1=monitoring
  }

  /** Record ad metadata for a segment. [was: Kp] */
  Kp(segInfo, stitchedMetadata, isVideoTrack, isFirstSlice) {
    if (isVideoTrack && this.policy.O) {
      // Track ad segment transitions
      if (segInfo.DF !== this.W?.DF) {
        YzX(this, segInfo, stitchedMetadata, isVideoTrack);
        if (!isNaN(segInfo.startTime)) {
          cqw(this, segInfo.DF, kU(this, segInfo.startTime, segInfo.DF), !!stitchedMetadata, this.Z1);
        }
      }
    }
  }

  RetryTimer(key, data, force = false) {
    if ((key !== "sdai" || this.policy.PS || force)) this.loader.RetryTimer(key, data);
  }
}

// ---------------------------------------------------------------------------
// Format Change Result [was: TF]
// Represents the result of an audio/video format selection change
// ---------------------------------------------------------------------------
export class FormatChangeResult {
  constructor(audio, video, reason) {
    this.audio = audio;
    this.video = video;
    this.reason = reason;
  }
}

// ---------------------------------------------------------------------------
// Format Update [was: Uu]
// Represents a format update notification
// ---------------------------------------------------------------------------
export class FormatUpdate {
  constructor(format, reason, source, token) {
    this.W = format;
    this.reason = reason;
    this.source = source;
    this.token = token;
  }
}

// ---------------------------------------------------------------------------
// Exponential Moving Average [was: wF]
// Used for bandwidth smoothing in ABR decisions
// ---------------------------------------------------------------------------
export class ExponentialMovingAverage {
  constructor(halfLife) { // was: Q
    this.W = 0;  // smoothed value
    this.O = 0;  // sample count
    this.alpha = Math.exp(Math.log(0.5) / halfLife);
  }

  /** Add a weighted sample. [was: ER] */
  addSample(weight, value) { // was: Q, c
    const decay = this.alpha ** weight;
    this.W = value * (1 - decay) + decay * this.W;
    this.O += weight;
  }

  /** Get current smoothed estimate, correcting for initialization bias. [was: Bj] */
  estimate() {
    return this.W / (1 - this.alpha ** this.O);
  }
}
