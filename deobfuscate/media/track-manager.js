// Source: base.js lines 43000–44000
// Track index management across video/audio, SourceBuffer lock state
// (isLocked property), track unlock logging, mux config updates,
// DRM license handling, key-status tracking, and provisioning.


import { ThrottleTimer } from '../core/bitstream-helpers.js'; // was: g.Uc
import { incrementBackoff, registerDisposable } from '../core/event-system.js'; // was: g.BO, g.F
import { resolveOAuthToken } from '../data/bandwidth-tracker.js'; // was: g.OQ
import { sendGelRequest } from '../data/gel-core.js'; // was: g.JD
import { reportErrorWithLevel } from '../data/gel-params.js'; // was: g.Zf
import { buildInnertubeContext, getInnertubeConfig } from '../network/innertube-client.js'; // was: g.iV, g.Ne
import { loadVideoFromData } from '../player/media-state.js'; // was: sH
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { probeNetworkPath } from '../ads/ad-click-tracking.js'; // was: rt
import { cueAdVideo } from '../player/media-state.js'; // was: OH
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { reportTelemetry } from '../ads/dai-cue-range.js'; // was: PB
import { isTimeInRange } from './codec-helpers.js'; // was: zb
import { NoOpLogger } from '../data/logger-init.js'; // was: WG
import { ScreenService } from '../modules/remote/mdx-client.js'; // was: m$
import { clearManifestlessSegments } from '../ads/ad-async.js'; // was: Fc
import { validateDrmLicensorUrl } from '../ads/ad-scheduling.js'; // was: U1X
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { isTextTrackMimeType } from './codec-helpers.js'; // was: LM
import { getNFOffset } from '../ads/ad-async.js'; // was: iU
import { getSeekableRangeStart } from '../player/time-tracking.js'; // was: bC()
import { handleError } from '../player/context-updates.js';
import { getCurrentTime, getDuration } from '../player/time-tracking.js';
import { filter } from '../core/array-utils.js';
import { contains } from '../core/string-utils.js';
import { isFairplay } from '../player/video-data-helpers.js'; // was: g.RM
// TODO: resolve g.kW
// TODO: resolve g.lj

/**
 * Unlocks a locked SourceBuffer segment on the specified track (audio or video).
 * Logs unlock/mismatch events via QoE telemetry when debug-mode is active.
 * [was: BP]
 *
 * @param {Object} controller  - media controller instance [was: Q]
 * @param {boolean} isAudio    - true for audio track, false for video [was: c]
 */
export function unlockTrackSegment(controller, isAudio) { // was: BP
  if (controller.policy.XI && controller.loadVideoFromData) {
    let sourceBuffer = isAudio ? controller.loadVideoFromData?.W : controller.loadVideoFromData?.O; // was: W
    const track = isAudio ? controller.audioTrack : controller.videoTrack; // was: m (const)
    const pendingSegment = getHeadPendingSegment(track); // was: c  (Hp)

    if (pendingSegment?.isLocked) {
      if (controller.EH.G().cB()) {
        controller.RetryTimer("eosl", {
          unlock: pendingSegment.info.Pw(),
        });
      }

      track.Ie?.stop();
      pendingSegment.isLocked = false; // was: c.isLocked = !1
      track.B7(pendingSegment);
      updateAbrDecision(controller.W, pendingSegment.info); // was: DZW

      sourceBuffer = sourceBuffer?.Jv();
      if (sourceBuffer?.Pw() !== pendingSegment.info.Pw()) {
        controller.RetryTimer("oue", {
          bls: sourceBuffer?.Pw(),
          tls: pendingSegment.info.Pw(),
        });
      }
    }
  }
}

/**
 * Probes a connection-management-service path ("cms") for the given URL.
 * [was: nMO]
 *
 * @param {Object} controller [was: Q]
 * @param {string} url        [was: c]
 */
export function probeConnectionPath(controller, url) { // was: nMO
  probeNetworkPath(url, "cms", (result) => { // was: W
    if (controller.policy.A) {
      controller.RetryTimer("pathprobe", result);
    }
  }, (error) => { // was: W
    controller.EH.handleError(error);
  });
}

/**
 * Updates the mux-configuration change tracker (Z1) with the current
 * video-track info and propagates it to sub-components.
 * [was: ZJX]
 *
 * @param {Object} controller [was: Q]
 * @param {Object} muxConfig  [was: c]
 */
export function updateMuxConfig(controller, muxConfig) { // was: ZJX
  controller.Z1 = muxConfig;
  if (controller.j) {
    controller.j.Z1 = muxConfig;
  }

  const config = controller.Z1; // was: c reused
  const isStreamingWebm = controller.videoTrack.cueAdVideo.info.wH(); // was: W
  config.isTvHtml5Exact = isStreamingWebm;
  config.reportTelemetry({ swebm: isStreamingWebm });

  controller.D.Z1 = controller.Z1;
  if (controller.policy.O) {
    controller.O.Z1 = controller.Z1;
    applyPendingFormatDenylists(controller); // was: eb0
  }
}

/**
 * Handles a segment timestamp arriving via manifest-less mode.
 * Adjusts the timestamp offset, triggers resume if time changed, and
 * un-stalls seeking when the segment is within range.
 * [was: EM_]
 *
 * @param {Object} controller [was: Q]
 * @param {number} timestamp  [was: c]
 */
export function handleSegmentTimestamp(controller, timestamp) { // was: EM_
  if (!(controller.loadVideoFromData && controller.loadVideoFromData.O)) return;

  const adjustedTime =
    timestamp - (isNaN(controller.timestampOffset) ? 0 : controller.timestampOffset); // was: c reused

  if (controller.getCurrentTime() !== adjustedTime) {
    controller.resume();
  }

  if (
    controller.Pj.isSeeking() &&
    controller.loadVideoFromData &&
    !controller.loadVideoFromData.NK()
  ) {
    const isNearCurrentTime =
      controller.getCurrentTime() <= adjustedTime &&
      adjustedTime < controller.getCurrentTime() + 10; // was: W
    const bufferCoversPlayhead = isTimeInRange(
      controller.loadVideoFromData.O.NoOpLogger(),
      controller.getCurrentTime() + nw
    ); // was: m
    if (isNearCurrentTime && bufferCoversPlayhead) {
      controller.Pj.j = false; // was: !1
    }
  }

  if (
    !controller.Pj.isSeeking() ||
    (controller.policy.J && !controller.policy.La)
  ) {
    controller.currentTime = adjustedTime;
  }
  controller.vY.cw();
}

/**
 * Checks whether the track head segment has been fully buffered past
 * the unlock threshold.
 * [was: tPd]
 *
 * @param {Object} track [was: Q]
 * @returns {boolean}
 */
export function isTrackHeadBuffered(track) { // was: tPd
  const segInfo = getHeadPendingSegment(track)?.info; // was: c
  return !segInfo || track.ScreenService(Math.min(segInfo.j + nw, segInfo.K));
}

/**
 * Updates the timestamp offset and propagates to all sub-systems
 * (manifest, video track, audio track).
 * [was: Dj]
 *
 * @param {Object} controller  [was: Q]
 * @param {number} newOffset   [was: c]
 */
export function updateTimestampOffset(controller, newOffset) { // was: Dj
  if (controller.timestampOffset !== newOffset) {
    controller.timestampOffset = newOffset;
    if (controller.policy.u3) {
      clearManifestlessSegments(controller.k0); // was: Fc
    }
    controller.j.J = controller.timestampOffset;
    controller.EH.jR(controller.timestampOffset);
    if (controller.k0.isManifestless) {
      controller.k0.timestampOffset = controller.timestampOffset;
    }
    controller.videoTrack.gB(controller.timestampOffset);
    controller.audioTrack.gB(controller.timestampOffset);
  }
}

/**
 * Clears pending request queues for both audio and video tracks.
 * [was: LxX]
 *
 * @param {Object} controller [was: Q]
 */
export function clearPendingRequests(controller) { // was: LxX
  controller.audioTrack.Y = [];
  controller.videoTrack.Y = [];
}

// ── DRM session and key helpers ──────────────────────────────────────────────

/**
 * Maps a DRM track-type string to its numeric enum value.
 * [was: jMK]
 *
 * @param {string} trackType  - e.g. "DRM_TRACK_TYPE_AUDIO"
 * @returns {number} 0–5
 */
export function drmTrackTypeToNumber(trackType) { // was: jMK
  switch (trackType) {
    case "DRM_TRACK_TYPE_AUDIO":
      return 1;
    case "DRM_TRACK_TYPE_SD":
      return 2;
    case "DRM_TRACK_TYPE_HD":
      return 3;
    case "DRM_TRACK_TYPE_UHD1":
      return 4;
    case "DRM_TRACK_TYPE_UHD2":
      return 5;
    default:
      return 0;
  }
}

/**
 * Parses a DRM license response into an internal license result.
 * Extracts status, license bytes, authorized-format track types,
 * and optional FairPlay / SABR constraints.
 * [was: f2n]
 *
 * @param {Object} response   - raw license response [was: Q]
 * @param {boolean} [includeTrackTypes=false]  [was: c]
 * @returns {Object|null}     - parsed license result or null on bad OK
 */
export function parseLicenseResponse(response, includeTrackTypes = false) { // was: f2n
  let statusCode = response.status === "LICENSE_STATUS_OK" ? 0 : 9999; // was: W
  let licenseBytes = null; // was: m

  if (response.license) {
    try {
      licenseBytes = CN(response.license); // was: CN  (base64 decode)
    } catch (err) {
      reportErrorWithLevel(err);
    }
  }

  if (statusCode === 0 && !licenseBytes) return null;

  const result = new gMw(statusCode, licenseBytes); // was: m reused
  if (statusCode !== 0 && response.reason) {
    result.errorMessage = response.reason;
  }

  if (response.authorizedFormats) {
    const seen = {}; // was: W
    const formatNames = []; // was: K
    const keyIdMap = {}; // was: T

    for (const fmt of response.authorizedFormats) { // was: r
      if (!fmt.trackType || !fmt.keyId) continue;

      if (includeTrackTypes) {
        result.O.push({
          trackType: drmTrackTypeToNumber(fmt.trackType),
          isHdr: !!fmt.isHdr,
        });
      }

      let label = OJx[fmt.trackType]; // was: U  (OJx = external track-type labels)
      if (label) {
        if (label === "HD" && response.isHd720) label = "HD720";
        if (fmt.isHdr) label += "HDR";

        if (!seen[label]) {
          formatNames.push(label);
          seen[label] = true;
        }

        let keyIdBytes = null; // was: I
        try {
          keyIdBytes = CN(fmt.keyId);
        } catch (err) {
          reportErrorWithLevel(err);
        }
        if (keyIdBytes) {
          keyIdMap[g.lj(keyIdBytes, 4)] = label;
        }
      }
    }

    result.A = formatNames;
    result.W = keyIdMap;
  }

  if (response.nextFairplayKeyId) {
    result.nextFairplayKeyId = response.nextFairplayKeyId;
  }
  if (response.sabrLicenseConstraint) {
    result.sabrLicenseConstraint = CN(response.sabrLicenseConstraint);
  }

  return result;
}

/**
 * Wires up onSuccess / onError callbacks on a license-request object.
 * [was: vMm]
 *
 * @param {Object} request   [was: Q]
 * @param {Function} onSuccess [was: c]
 * @param {Function} onError   [was: W]
 */
export function bindLicenseCallbacks(request, onSuccess, onError) { // was: vMm
  request.onSuccess = onSuccess;
  request.onError = onError;
}

/**
 * Sends the actual DRM license request via the get_drm_license endpoint.
 * [was: a2x]
 *
 * @param {Object} licenseReq  [was: Q]
 * @param {Object} body        [was: c]
 * @param {string} url         [was: W]
 * @param {string|undefined} authToken [was: m]
 */
export function sendDrmLicenseRequest(licenseReq, body, url, authToken) { // was: a2x
  const options = { // was: K
    timeout: 30_000,
    onSuccess: (resp) => { // was: T
      if (!licenseReq.u0()) {
        Bu("drm_net_r", undefined, licenseReq.timer);
        const parsed = parseLicenseResponse(resp, licenseReq.O);
        if (parsed) {
          licenseReq.onSuccess(parsed, licenseReq.requestNumber);
        } else {
          licenseReq.onError(licenseReq, "drm.net", "t.p;p.i");
        }
      }
    },
    onError: (resp) => { // was: T
      if (!licenseReq.u0()) {
        if (resp && resp.error) {
          const err = resp.error; // was: T
          licenseReq.onError(
            licenseReq,
            "drm.net.badstatus",
            `t.r;p.i;c.${err.code};s.${err.status}`,
            err.code
          );
        } else {
          licenseReq.onError(licenseReq, "drm.net.badstatus", "t.r;p.i;c.n");
        }
      }
    },
    onTimeout: () => {
      licenseReq.onError(
        licenseReq,
        "drm.net",
        `rt.req.${licenseReq.requestNumber}`
      );
    },
  };

  if (authToken) {
    options.MX = `Bearer ${authToken}`;
  }
  sendGelRequest(url, "player/get_drm_license", body, options);
}

/**
 * Logs a DRM diagnostic entry; optionally publishes to ctmp telemetry.
 * [was: HP]
 *
 * @param {Object} drmSession [was: Q]
 * @param {Object} data       [was: c]
 * @param {boolean} [force=false] [was: W]
 */
export function logDrmEvent(drmSession, data, force = false) { // was: HP
  Tb(data); // was: Tb  (external logger/serialiser)
  if (force || drmSession.FI.cB()) {
    drmSession.publish("ctmp", "drmlog", data);
  }
}

/**
 * Builds the full DRM license URL, appending experiment IDs if the
 * "fexp" parameter is not already present.
 * [was: Gq_]
 *
 * @param {Object} drmSession [was: Q]
 * @returns {string}
 */
export function buildDrmLicenseUrl(drmSession) { // was: Gq_
  let url = drmSession.baseUrl; // was: c
  validateDrmLicensorUrl(url) || drmSession.error("drm.net", 2, "t.x");

  if (!b_(url, "fexp")) {
    const activeExperiments = [
      "23898307",
      "23914062",
      "23916106",
      "23883098",
    ].filter((id) => drmSession.FI.experiments.experiments[id]); // was: W

    if (activeExperiments.length > 0) {
      drmSession.K.fexp = activeExperiments.join();
    }
  }

  for (const key of Object.keys(drmSession.K)) { // was: W
    url = M4m(url, key, drmSession.K[key]);
  }
  return url;
}

/**
 * Returns a human-readable summary of key statuses for logging.
 * Each entry is formatted as "<keyId>_<trackType>_<status>".
 * [was: Wi3]
 *
 * @param {Object} drmSession [was: Q]
 * @param {string} separator  [was: c]
 * @returns {string}
 */
export function formatKeyStatuses(drmSession, separator) { // was: Wi3
  const parts = []; // was: W
  for (const keyId of Object.keys(drmSession.W)) {
    parts.push(
      `${keyId}_${drmSession.W[keyId].type}_${drmSession.W[keyId].status}`
    );
  }
  return parts.join(separator);
}

/**
 * Checks whether the session has usable key-status reporting via the
 * KeyStatuses API.
 * [was: yO]
 *
 * @param {Object} drmSession [was: Q]
 * @returns {boolean}
 */
export function hasKeyStatusApi(drmSession) { // was: yO
  let result; // was: c
  if ((result = drmSession.mF && drmSession.j != null)) {
    const session = drmSession.j; // was: Q
    result = !(!session.W || !session.W.keyStatuses);
  }
  return result;
}

/**
 * Checks whether a specific track type currently has "usable" key status.
 * [was: Sg]
 *
 * @param {Object} drmSession [was: Q]
 * @param {string} trackType  [was: c]
 * @returns {boolean}
 */
export function isTrackTypeUsable(drmSession, trackType) { // was: Sg
  for (const keyId in drmSession.W) {
    if (
      drmSession.W[keyId].status === "usable" &&
      drmSession.W[keyId].type === trackType
    ) {
      return true; // was: !0
    }
  }
  return false; // was: !1
}

/**
 * Returns the status string for the first key matching the given track type.
 * [was: m87]
 *
 * @param {Object} drmSession [was: Q]
 * @param {string} trackType  [was: c]
 * @returns {string|undefined}
 */
export function getStatusForTrackType(drmSession, trackType) { // was: m87
  for (const keyId in drmSession.W) {
    if (drmSession.W[keyId].type === trackType) {
      return drmSession.W[keyId].status;
    }
  }
}

/**
 * Swaps byte pairs in a 16-byte key-ID array to convert between
 * big-endian UUID and little-endian GUID representations.
 * [was: Kin]
 *
 * @param {Uint8Array} keyId [was: Q]
 */
export function swapKeyIdEndianness(keyId) { // was: Kin
  let tmp; // was: c
  tmp = keyId[0]; keyId[0] = keyId[3]; keyId[3] = tmp;
  tmp = keyId[1]; keyId[1] = keyId[2]; keyId[2] = tmp;
  tmp = keyId[4]; keyId[4] = keyId[5]; keyId[5] = tmp;
  tmp = keyId[6]; keyId[6] = keyId[7]; keyId[7] = tmp;
}

/**
 * Maps a list of authorized DRM format names to the highest supported
 * quality label string.
 * [was: Yx0]
 *
 * @param {string[]} formats [was: Q]
 * @returns {string} quality label ("highres" | "hd2160" | "hd1080" | "hd720" | "large")
 */
export function getMaxQualityFromFormats(formats) { // was: Yx0
  if (contains(formats, "UHD2") || contains(formats, "UHD2HDR")) return "highres";
  if (contains(formats, "UHD1") || contains(formats, "UHD1HDR")) return "hd2160";
  if (contains(formats, "HD") || contains(formats, "HDHDR")) return "hd1080";
  if (contains(formats, "HD720") || contains(formats, "HD720HDR")) return "hd720";
  return "large";
}

/**
 * Retries a DRM license request after a back-off delay.
 * [was: CUx]
 *
 * @param {Object} drmSession  [was: Q]
 * @param {Object} licenseReq  [was: c]
 */
export function retryLicenseRequest(drmSession, licenseReq) { // was: CUx
  const delayMs = licenseReq.W.getValue(); // was: W
  const timer = new ThrottleTimer(() => {
    sendFullLicenseRequest(drmSession, licenseReq); // was: MPO
  }, delayMs);
  registerDisposable(drmSession, timer);
  timer.start();
  incrementBackoff(licenseReq.W); // advance backoff
  logDrmEvent(drmSession, { rtyrq: 1 });
}

/**
 * Builds and sends the full license request payload, including context,
 * device info, DRM params, and credential tokens.
 * [was: MPO]
 *
 * @param {Object} drmSession  [was: Q]
 * @param {Object} licenseReq  [was: c]
 */
export function sendFullLicenseRequest(drmSession, licenseReq) { // was: MPO
  drmSession.status = "km";
  Bu("drm_net_s", undefined, drmSession.videoData.Y);

  const config = new g.DeferredValue(drmSession.FI.UR); // was: W
  const body = { // was: m
    context: buildInnertubeContext(config.config_ || getInnertubeConfig()),
  };

  body.drmSystem = prd[drmSession.O.flavor];
  body.videoId = drmSession.videoData.videoId;
  body.cpn = drmSession.videoData.clientPlaybackNonce;
  body.sessionId = drmSession.sessionId;
  body.licenseRequest = g.lj(licenseReq.message);
  body.drmParams = drmSession.videoData.drmParams;

  if (!isNaN(drmSession.cryptoPeriodIndex)) {
    body.isKeyRotated = true;
    body.cryptoPeriodIndex = drmSession.cryptoPeriodIndex;
  }

  const isHdr = !!drmSession.videoData.O?.J()?.isHdr(); // was: K
  body.drmVideoFeature = isHdr
    ? "DRM_VIDEO_FEATURE_PREFER_HDR"
    : "DRM_VIDEO_FEATURE_SDR";

  if (
    drmSession.FI.experiments.getExperimentFlags.W.BA(Qsm)
  ) {
    body.context = g.kW(drmSession.videoData);
  }

  if (body.context && body.context.client) {
    const clientInfo = drmSession.FI.W; // was: K reused
    if (clientInfo) {
      body.context.client.deviceMake = clientInfo.cbrand;
      body.context.client.deviceModel = clientInfo.cmodel;
      body.context.client.browserName = clientInfo.cbr;
      body.context.client.browserVersion = clientInfo.cbrver;
      body.context.client.osName = clientInfo.cos;
      body.context.client.osVersion = clientInfo.cosver;
    }

    if (!drmSession.FI.experiments.getExperimentFlags.W.BA(Qsm)) {
      body.context.user = body.context.user || {};
      if (drmSession.videoData.isSamsungSmartTV) {
        body.context.user.credentialTransferTokens = [
          { token: drmSession.videoData.isSamsungSmartTV, scope: "VIDEO" },
        ];
      }
      if (drmSession.videoData.Y0) {
        body.context.user.kidsParent = {
          oauthToken: drmSession.videoData.Y0,
        };
      }
    }

    body.context.request = body.context.request || {};
    body.context.request.mdxEnvironment =
      drmSession.videoData.mdxEnvironment || body.context.request.mdxEnvironment;

    if (isFairplay(drmSession.O)) {
      body.fairplayKeyId = g.lj(aa(drmSession.fairplayKeyId));
    }

    resolveOAuthToken(drmSession.FI, drmSession.videoData.D()).then((authToken) => {
      sendDrmLicenseRequest(licenseReq, body, config, authToken);
      drmSession.status = "rs";
    });
  } else {
    drmSession.error("drm.net", 2, "t.r;ic.0");
  }
}

/**
 * Returns a snapshot of the current DRM status for telemetry.
 * [was: F3]
 *
 * @param {Object} drmSession [was: Q]
 * @returns {Object}
 */
export function getDrmStatusSnapshot(drmSession) { // was: F3
  const snapshot = {}; // was: c
  snapshot[drmSession.status] = hasKeyStatusApi(drmSession)
    ? formatKeyStatuses(drmSession, ".")
    : drmSession.A.join(".");
  return snapshot;
}

// ── Segment index update helpers ────────────────────────────────────────────

/**
 * Applies a manifest-less segment-index update – propagates duration
 * corrections and resets when startTime mismatches.
 * [was: rlx] (partial – first ~15 lines)
 *
 * @param {Object} controller  [was: Q]
 * @param {Object} segmentInfo [was: c]
 * @param {*} W
 * @param {boolean} isVideo    [was: m]
 * @param {*} K
 */
export function applySegmentIndexUpdate(controller, segmentInfo, W, isVideo, K) { // was: rlx
  const manifest = controller.k0; // was: T
  const isSabr = controller.policy.W; // was: r
  let updated = false; // was: U -> !1
  let resetSegmentIndex = -1; // was: I

  for (const formatKey in manifest.W) { // was: e
    const isFormatVideo =
      isTextTrackMimeType(manifest.W[formatKey].info.mimeType) ||
      manifest.W[formatKey].info.MK(); // was: X

    if (isVideo === isFormatVideo) {
      const index = manifest.W[formatKey].index; // was: X reused
      if (index.Wb(segmentInfo.DF)) {
        // Check for startTime mismatch
        const existing = index.A(segmentInfo.DF); // was: V
        if (existing && existing.startTime !== segmentInfo.startTime) {
          index.segments = [];
          index.J(segmentInfo);
          updated = true; // was: U = !0
        } else {
          updated = false; // was: U = !1
        }

        if (updated) {
          resetSegmentIndex = segmentInfo.DF;
        } else if (!segmentInfo.pending && isSabr) {
          const oldDuration = index.getDuration(segmentInfo.DF); // was: A
          if (oldDuration !== segmentInfo.duration) {
            manifest.publish("clienttemp", "mfldurUpdate", {
              itag: manifest.W[formatKey].info.itag,
              seg: segmentInfo.DF,
              od: oldDuration,
              nd: segmentInfo.duration,
            }, false);
            index.J(segmentInfo);
            updated = true;
          }
        }
      } else {
        index.J(segmentInfo);
        updated = true;
      }
    }
  }

  if (resetSegmentIndex >= 0) {
    manifest.publish("clienttemp", "resetMflIndex", {
      [isVideo ? "v" : "a"]: resetSegmentIndex,
    }, false);
  }

  // Propagate to the seek handler and ABR
  Gmn(controller.Pj, segmentInfo, isVideo, updated);
  if (!controller.policy.T2) {
    controller.j.Kp(segmentInfo, W, isVideo, K);
  }

  // Adjust live-start boundary if needed
  if (
    segmentInfo.DF === manifest.Kx &&
    updated &&
    getNFOffset(manifest) &&
    segmentInfo.startTime > getNFOffset(manifest)
  ) {
    manifest.NF =
      segmentInfo.startTime +
      (isNaN(controller.timestampOffset) ? 0 : controller.timestampOffset);

    if (
      controller.Pj.isSeeking() &&
      controller.Pj.targetTime < manifest.getSeekableRangeStart
    ) {
      controller.Pj.seek(manifest.getSeekableRangeStart, {});
    }
  }
}
