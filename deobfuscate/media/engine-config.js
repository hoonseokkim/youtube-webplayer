// Source: base.js lines 42000–42250
// Media engine configuration: max samples per write, codec reset delays,
// audio track pause using state, CPU usage tracking intervals (h5vcc settings),
// Cobalt platform service logging, QoE stat recording and bandwidth monitoring.

import { getMediaSetting } from "../core/media-settings.js"; // was: C$
import { encodeString } from "../core/encoding.js"; // was: I8
import { nowMs } from "../core/timing.js"; // was: g.h
import { getYtNow } from "./playback-stats.js"; // was: g.Yo
import { isOfflineVideo } from "../video/video-data-utils.js"; // was: wA
import { getConnectionType } from "./connection-info.js"; // was: JY7
import { ThrottleTimer } from '../core/bitstream-helpers.js'; // was: g.Uc
import { safeSetInterval } from '../data/idb-transactions.js'; // was: g.Ce
import { getWebGLRenderer } from './performance-monitor.js'; // was: g.mH
import { getTimeHead } from '../player/time-tracking.js'; // was: TH()
import { sendCommand } from '../ads/ad-scheduling.js'; // was: BR
import { logWoffleError } from '../modules/offline/offline-helpers.js'; // was: Rj
import { MetricCondition } from '../data/module-init.js'; // was: X_
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { sendFinalFlush } from '../core/event-system.js'; // was: qH
import { NoOpMetricProvider } from '../data/module-init.js'; // was: AU
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { adMessageRenderer } from '../core/misc-helpers.js'; // was: rc
import { getSlotState } from '../ads/ad-scheduling.js'; // was: zA
import { isCompressedDomainComposite } from './audio-normalization.js'; // was: gA
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { executeCommand } from '../ads/ad-scheduling.js'; // was: xA
import { writeVarint } from '../proto/varint-decoder.js'; // was: Fu
import { filter } from '../core/array-utils.js';
import { getCurrentTime } from '../player/time-tracking.js';
import { getVisibilityState } from '../core/composition-helpers.js';
import { isStereo3D, isEquirectangular, isEquirectangular3D, isMeshProjection } from '../player/video-data-helpers.js'; // was: g.$Q, g.ct, g.Wt, g.mO

/**
 * Required CPU usage tracker interval values.
 * [was: hFn]
 */
const REQUIRED_CPU_TRACKER_INTERVALS = []; // populated externally

// ── Media engine setting accessors ──────────────────────────────────────────

/**
 * Gets the maximum number of samples the media engine can write at once.
 * [was: Pzm]
 * @param {number} value
 * @returns {*}
 */
export function getMaxSamplesPerWrite(value) { // was: Pzm
  return getMediaSetting("Media.MaxSamplesPerWrite", value);
}

/**
 * Gets the codec-reset delay in milliseconds.
 * [was: lPW]
 * @param {number} delayMs
 * @returns {*}
 */
export function getCodecResetDelayMs(delayMs) { // was: lPW
  return getMediaSetting("Media.MediaCodecResetDelayMs", delayMs);
}

/**
 * Configures pausing via the audio-track state flag.
 * Converts the boolean to 1/0 before passing to the media engine.
 * [was: u10]
 * @param {boolean} enable
 * @returns {*}
 */
export function setPauseUsingAudioTrackState(enable) { // was: u10
  return getMediaSetting("Media.PauseUsingAudioTrackState", enable ? 1 : 0);
}

// ── h5vcc CPU usage tracking ────────────────────────────────────────────────

/**
 * Ensures the h5vcc "cpu_usage_tracker_intervals" persistent setting
 * includes every required "total"-type interval, then enables the tracker.
 * [was: zFy]
 */
export function ensureCpuUsageTrackerIntervals() { // was: zFy
  let intervals =
    window.h5vcc?.settings?.getPersistentSettingAsString?.(
      "cpu_usage_tracker_intervals"
    );
  if (intervals != null) {
    intervals = JSON.parse(intervals) ?? [];
    const existingTotalSeconds = intervals
      .filter((entry) => entry.type === "total")
      .map((entry) => entry.seconds);

    for (const required of REQUIRED_CPU_TRACKER_INTERVALS) {
      if (existingTotalSeconds.indexOf(required) === -1) {
        intervals.push({ type: "total", seconds: required });
      }
    }

    window.h5vcc?.settings?.set("cpu_usage_tracker_intervals_enabled", 1);
    window.h5vcc?.settings?.set(
      "cpu_usage_tracker_intervals",
      JSON.stringify(intervals)
    );
  }
}

// ── Cobalt platform service helpers ─────────────────────────────────────────

/**
 * Reads the COAT client-log-info blob from the Cobalt platform service.
 * Returns a UTF-8 string decoded from the binary response.
 * [was: Cz3]
 * @returns {string}
 */
export function readCoatClientLogInfo() { // was: Cz3
  let service = window.H5vccPlatformService; // was: Q
  let result = ""; // was: c

  if (
    service &&
    service.has("dev.cobalt.coat.clientloginfo") &&
    (service = service.open("dev.cobalt.coat.clientloginfo", () => {}))
  ) {
    const response = service.send(new ArrayBuffer(0)); // was: W
    if (response) {
      result = String.fromCharCode(...new Uint8Array(response));
    }
    service.close();
  }
  return result;
}

/**
 * Sends the CPN (Client Playback Nonce) to the YouTube TV prod-logger
 * via the Cobalt platform service.
 * [was: MwK]
 * @param {string} cpn
 */
export function sendCpnToProdLogger(cpn) { // was: MwK
  let service = window.H5vccPlatformService; // was: c
  if (service?.has("com.google.android.youtube.tv.prodlogger")) {
    service = service.open(
      "com.google.android.youtube.tv.prodlogger",
      () => {}
    );
    if (service) {
      service.send(encodeString(`cpn: ${cpn}`).buffer);
      service.close();
    }
  }
}

// ── QoE stat helpers ────────────────────────────────────────────────────────

/**
 * Records a timestamped stat entry in the QoE map.
 * Format: "<time>:<values joined by colon>"
 * [was: g.J8]
 * @param {Object} qoe       - QoE tracker instance
 * @param {number} time       - playback time (seconds)
 * @param {string} statKey    - stat identifier (e.g. "cmt", "bh", "error")
 * @param {Array} values      - values to join with ":"
 */
export function recordTimedStat(qoe, time, statKey, values) { // was: g.J8
  appendStatEntry(
    qoe,
    time,
    `${statKey}:${values.join(":")}`  // was: `${c.toFixed(3)}:${m.join(":")}`  (caller passes pre-formatted time)
  );
}

/**
 * Appends a raw stat string to the per-time bucket map.
 * [was: MT]
 * @param {Object} qoe
 * @param {number|string} key
 * @param {string} entry
 */
export function appendStatEntry(qoe, key, entry) { // was: MT
  const existing = qoe.W.get(key); // was: m
  if (existing) {
    existing.push(entry);
  } else {
    qoe.W.set(key, [entry]);
  }
}

/**
 * Records the current media time ("cmt") stat, then handles gap-latency
 * logging ("gllat") for ad-to-video or video-to-ad transitions.
 * [was: R4]
 * @param {Object} qoe
 * @param {number} time
 */
export function recordCurrentMediaTime(qoe, time) { // was: R4
  const currentTime = qoe.provider.getCurrentTime(); // was: W
  recordTimedStat(qoe, time, "cmt", [currentTime.toFixed(3)]);

  let providerTH = qoe.provider.getTimeHead; // was: W reused, m
  let threshold = providerTH;

  // Check if gap threshold is exceeded
  const isLiveOrOffline = !qoe.O || isOfflineVideo(qoe.provider.videoData)
    ? false
    : threshold * 1000 > qoe.O.k9 + 100;

  if (isLiveOrOffline && qoe.O) {
    const wasAd = qoe.O.isAd; // was: m
    const gapMs = providerTH * 1000 - qoe.O.k9; // was: W
    qoe.cY = time * 1000 - qoe.O.logWoffleError - gapMs - qoe.O.sendCommand;

    let wallTime = nowMs() - gapMs; // was: K
    const gapLatency = qoe.cY; // was: c (reassignment)
    const videoData = qoe.provider.videoData; // was: W (reassignment)
    const isTargetAd = videoData.isAd(); // was: T

    if (wasAd || isTargetAd) {
      const transitionType =
        `${wasAd ? "ad" : "video"}_to_${isTargetAd ? "ad" : "video"}`; // was: T
      const params = {}; // was: r
      if (videoData.UG) {
        params.cttAuthInfo = {
          token: videoData.UG,
          videoId: videoData.videoId,
        };
      }
      params.startTime = wallTime - gapLatency;
      // qp, g.xh, Bu calls omitted – forwarded to external handlers
    } else {
      const csiState = qoe.provider.EH.MetricCondition(); // was: K reused
      if (csiState.D !== videoData.clientPlaybackNonce) {
        csiState.K = videoData.clientPlaybackNonce;
        csiState.O = gapLatency;
      }
      // else log error if not cI()
    }

    qoe.RetryTimer("gllat", {
      l: qoe.cY.toFixed(),
      prev_ad: +wasAd,
    });
    delete qoe.O;
  }
}

/**
 * Records the buffer-health ("bh") stat when available.
 * [was: ko]
 * @param {Object} qoe
 * @param {number} time
 * @param {Object} auStats  - AU() result with qH / O properties
 */
export function recordBufferHealth(qoe, time, auStats) { // was: ko
  if (!isNaN(auStats.sendFinalFlush)) {
    let bufferHealth = auStats.sendFinalFlush; // was: m
    if (auStats.O < bufferHealth) {
      bufferHealth = auStats.O;
    }
    recordTimedStat(qoe, time, "bh", [bufferHealth.toFixed(3)]);
  }
}

/**
 * Periodic stat flush – bandwidth, memory, CPU, battery, visibility,
 * connection type, and buffer health.
 * [was: p$]
 * @param {Object} qoe
 * @param {number} [time=NaN]
 */
export function flushPeriodicStats(qoe, time = NaN) { // was: p$
  time = time >= 0 ? time : getYtNow(qoe.provider);
  const auStats = qoe.provider.EH.NoOpMetricProvider(); // was: W

  // Bandwidth measured
  let bytesReceived = auStats.Ry - (qoe.jG || 0); // was: m
  if (bytesReceived > 0) {
    recordTimedStat(qoe, time, "bwm", [
      bytesReceived,
      (auStats.f7 - (qoe.sC || 0)).toFixed(3),
    ]);
  }
  if (isNaN(qoe.jG) && auStats.Ry && qoe.isOffline) {
    qoe.bf(false);
  }
  qoe.jG = auStats.Ry;
  qoe.sC = auStats.f7;

  // Bandwidth estimate
  if (!isNaN(auStats.bandwidthEstimate)) {
    recordTimedStat(qoe, time, "bwe", [
      auStats.bandwidthEstimate.toFixed(0),
    ]);
  }

  // Extended bandwidth info
  if (qoe.provider.FI.cB() && Object.keys(auStats.W).length !== 0) {
    qoe.RetryTimer("bwinfo", auStats.W);
  }

  // Memory info
  if (qoe.provider.FI.cB() || qoe.provider.FI.X("html5_log_meminfo")) {
    const memInfo = qIO(); // external helper
    if (Object.values(memInfo).some((v) => v !== undefined)) {
      qoe.RetryTimer("meminfo", memInfo);
    }
  }

  // CPU info
  if (qoe.provider.FI.cB()) {
    const cpuInfo = qoe.XI?.j();
    if (cpuInfo && Object.values(cpuInfo).some((v) => v != null)) {
      qoe.RetryTimer("cpuinfo", cpuInfo);
    }
  }

  // JS profiler
  if (qoe.PA) {
    qoe.RetryTimer("jsprof", qoe.PA.flush());
  }

  // Battery
  if (qoe.L) {
    recordTimedStat(qoe, time, "bat", [
      qoe.L.level,
      qoe.L.charging ? "1" : "0",
    ]);
  }

  // Visibility state
  const visState = qoe.provider.EH.getVisibilityState(); // was: m reused
  if (qoe.Xw !== visState) {
    recordTimedStat(qoe, time, "vis", [visState]);
    qoe.Xw = visState;
  }

  // Current media time / gap latency
  recordCurrentMediaTime(qoe, time);

  // Connection type
  const connType = getConnectionType(qoe.provider);
  if (connType && connType !== qoe.readRepeatedMessageField) {
    recordTimedStat(qoe, time, "conn", [connType]);
    qoe.readRepeatedMessageField = connType;
  }

  // Buffer health
  recordBufferHealth(qoe, time, auStats);
}

/**
 * Full stat snapshot triggered by an error – records error, flushes
 * periodic stats, and checks QoE payload length.
 * [was: kJX]
 * @param {Object} qoe
 * @param {string} errorCode
 * @param {string} errorDetails
 */
export function recordErrorSnapshot(qoe, NetworkErrorCode, errorDetails) { // was: kJX
  const time = getYtNow(qoe.provider); // was: m
  recordErrorStat(qoe, time, NetworkErrorCode, 0, errorDetails); // was: RF_
  flushPeriodicStats(qoe, time);
  checkStatPayloadLength(qoe); // was: QO
}

/**
 * Appends a "cat" (category) stat entry.
 * [was: cP]
 * @param {Object} qoe
 * @param {string} category
 */
export function appendCategory(qoe, category) { // was: cP
  appendStatEntry(qoe, "cat", category);
}

/**
 * Checks total serialised stat payload length and triggers an early
 * flush when it exceeds 96 KB.
 * [was: QO]
 * @param {Object} qoe
 */
export function checkStatPayloadLength(qoe) { // was: QO
  if (!qoe.provider.FI.X("html5_qoe_no_len_check")) {
    let totalLength = 0; // was: c
    for (const [key, entries] of qoe.W.entries()) {
      totalLength +=
        key.length + Number(C7(entries, (acc, entry) => acc + entry.length, 0));
    }
    if (totalLength > 96_000) {
      new ThrottleTimer(qoe.reportStats, 0, qoe).start();
    }
  }
}

/**
 * Records an error stat entry with severity info.
 * [was: RF_]
 * @param {Object} qoe
 * @param {number} time
 * @param {string} errorCode
 * @param {number} severity   - 1 = fatal, 0 = non-fatal
 * @param {string} details
 */
export function recordErrorStat(qoe, time, NetworkErrorCode, severity, details) { // was: RF_
  const browserVersion = qoe.provider.FI.W.cbrver; // was: T

  // Chrome 96 bad-status special handling
  if (
    qoe.provider.FI.W.cbr === "Chrome" &&
    /^96[.]/.test(browserVersion) &&
    NetworkErrorCode === "net.badstatus" &&
    /adMessageRenderer\.500/.test(details)
  ) {
    markForcedCanaryZone(qoe, 3); // was: Kw
  }

  // UMP b248180278 check
  if (qoe.provider.FI.X("html5_use_ump") && /b248180278/.test(details)) {
    markForcedCanaryZone(qoe, 4);
  }

  const currentTime = qoe.provider.getCurrentTime(); // was: T reused
  const severityLabel = severity === 1 ? "fatal" : ""; // was: m
  const parts = [NetworkErrorCode, severityLabel, currentTime.toFixed(3)]; // was: W

  if (severityLabel) {
    details += `;a6s.${i1()}`; // was: K  (i1 = external helper)
  }
  if (details) {
    parts.push(sanitizeStatValue(details)); // was: WxK
  }

  recordTimedStat(qoe, time, "error", parts);
  qoe.K = true;
}

/**
 * Marks the "forced canary zone" flag so it is only logged once.
 * [was: Kw]
 * @param {Object} qoe
 * @param {number} code
 */
function markForcedCanaryZone(qoe, code) { // was: Kw
  if (!qoe.JJ) {
    appendStatEntry(qoe, "fcnz", `${code}`);
    qoe.JJ = true;
  }
}

/**
 * Sanitises a stat value string, replacing unsafe characters with "_"
 * and "+" with "-".
 * [was: WxK]
 * @param {string} value
 * @returns {string}
 */
export function sanitizeStatValue(value) { // was: WxK
  if (/[^a-getSlotState-Z0-9;.!_-]/.test(value)) {
    value = value.replace(/[+]/g, "-").replace(/[^a-getSlotState-Z0-9;.!_-]/g, "_");
  }
  return value;
}

/**
 * Initialises the QoE session with metadata categories –
 * prefetch, reload, monitor, live, streaming, control mode, experiment IDs, etc.
 * [was: ckn]
 * @param {Object} qoe
 */
export function initQoeSession(qoe) { // was: ckn
  const videoData = qoe.provider.videoData;

  if (videoData.isCompressedDomainComposite) appendCategory(qoe, "prefetch");

  if (videoData.parseHexColor) {
    qoe.RetryTimer("reload", {
      r: videoData.reloadReason,
      ct: videoData.parseHexColor,
    });
  }
  if (videoData.executeCommand) appendCategory(qoe, "monitor");
  if (videoData.isLivePlayback) appendCategory(qoe, "live");
  // `em` is a module-level streaming flag
  // if (em) appendCategory(qoe, "streaming");

  if (videoData.zd) {
    qoe.RetryTimer("ctrl", { mode: videoData.zd }, true);
  }

  if (videoData.V$) {
    const ytpType = videoData.V$.replace(/,/g, "_"); // was: c
    qoe.RetryTimer("ytp", { type: ytpType }, true);
  }

  if (videoData.writeVarint) {
    const expIds = videoData.writeVarint.replace(/,/g, "."); // was: c
    qoe.RetryTimer("ytrexp", { ids: expIds }, true);
  }

  if (qoe.provider.FI.cB()) {
    qoe.RetryTimer("now", { wt: nowMs() });
  }

  // GPU info for white-noise / WebGL-noop experiments
  const needsGpu =
    qoe.provider.FI.X("enable_white_noise") ||
    qoe.provider.FI.X("enable_webgl_noop");
  const videoData2 = qoe.provider.videoData;
  const isSpecialFormat =
    isStereo3D(videoData2) || isEquirectangular(videoData2) || isEquirectangular3D(videoData2) || isMeshProjection(videoData2);

  if ((needsGpu || isSpecialFormat)) {
    const gpuInfo = getWebGLRenderer();
    if (gpuInfo) qoe.W.set("gpu", [gpuInfo]);
  }

  // Offline / COTN markers
  // IZ(videoData) => recordTimedStat(qoe, getYtNow(...), "dt", ["1"]);
  // videoData.cotn handling => qoe.bf(true);

  // Player age bucket
  if (qoe.provider.FI.cB()) {
    const ageMs = nowMs() - qoe.provider.FI.AA; // was: c
    qoe.RetryTimer("playerage", {
      secs: (1.6 ** Math.round(Math.log(ageMs / 1000) / Math.log(1.6))).toFixed(),
    });
  }

  qoe.K = true;
  qoe.mF = safeSetInterval(() => {
    qoe.reportStats();
  }, 10_000);
}
