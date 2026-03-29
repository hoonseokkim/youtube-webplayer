/**
 * Quality Constraints
 *
 * Handles quality constraint evaluation, reattachment decisions based on
 * DRM / performance / bitrate reasons, and quality ordinal management.
 *
 * Source: base.js lines 46011-47000
 * @module quality-constraints
 */
import { resetBufferPosition } from '../modules/caption/caption-internals.js'; // was: Er
import { LatencyTimer } from '../data/logger-init.js'; // was: DB
import { createTimeRanges } from './codec-helpers.js'; // was: lo
import { isAbrStateSatisfied } from './segment-request.js'; // was: xZn
import { processQualityChange } from './segment-request.js'; // was: qt7
import { evaluateFormatSwitch } from './mse-internals.js'; // was: eg
import { supportsChangeType } from './codec-helpers.js'; // was: Yi
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { logMetaCsiEvent } from '../data/gel-core.js'; // was: jl
import { getWallClockTime } from '../player/time-tracking.js'; // was: Kk()

// ---------------------------------------------------------------------------
// Quality constraint handler  [was: d3]
// ---------------------------------------------------------------------------


// TODO: resolve g.h

/**
 * Evaluates and applies quality constraints when adaptive formats are active.
 *
 * When a constraint change is detected the function decides between:
 *   - "u"    (unlocked): codec mismatch requiring reattach          [was: reason "m"]
 *   - "drm"  (DRM lock): DRM-related format lock requiring reattach [was: reason "l"]
 *   - "perf" (bitrate) : bitrate/performance cap requiring reattach [was: reason "b"]
 *   - "codec": hardware-acceleration codec constraint                [was: HA flag]
 *
 * If none of those conditions apply, the loader simply refreshes the
 * buffering pipeline via `wB` (re-buffer).
 *
 * @param {Object} player - The video player instance.
 */
export function applyQualityConstraint(player) { // was: d3
  if (!player.videoData.A || !player.videoData.A.W()) return;

  const constraint = sb(player); // was: sb  (compute current constraint)

  if (!player.loader) return;
  const loader = player.loader;
  if (loader.u0()) return; // disposed

  // ------------------------------------------------------------------
  // Path A: policy.W is truthy -- use the constraint-cache (loader.K)
  // ------------------------------------------------------------------
  if (loader.policy.W) {
    const cache = loader.K; // was: cache (constraint cache)

    // Skip when constraint is unchanged
    if (
      !(constraint.isLocked() && cache.W.A) &&
      cache.O !== undefined &&
      constraint.equals(cache.O)
    ) {
      return;
    }

    const previousConstraint = loader.K.O;
    lg7(loader.K, constraint); // was: lg7  (update constraint cache)

    // Check if codec-mismatch unlock requires reattach  [was: reason "m"]
    let needsUnlockReattach = false; // was: m
    if (constraint.isLocked() && constraint.reason === "m") {
      const qualityCache = loader.K;     // was: m (reused var)
      const currentQualityOrdinal = qualityCache.j?.info.J().qualityOrdinal;

      needsUnlockReattach = qualityCache.T2
        ? true
        : qualityCache.j
          ? constraint.W !== currentQualityOrdinal
            ? true
            : !qualityCache.W.A || (qualityCache.Ck.UR && qualityCache.W.W === qualityCache.j.info.itag)
              ? false
              : true
          : false;
    }

    const needsDrmReattach =
      loader.policy.resetBufferPosition && constraint.reason === "l"; // was: K — DRM lock [was: reason "l"]

    const needsBitrateReattach =
      previousConstraint.W > constraint.W &&
      constraint.reason === "b"; // was: W — bitrate cap [was: reason "b"]

    if (needsUnlockReattach || needsDrmReattach || needsBitrateReattach) {
      loader.EH.LatencyTimer({
        reattachOnConstraint: needsUnlockReattach
          ? "u"
          : needsDrmReattach
            ? "drm"
            : "perf",
        createTimeRanges: constraint.O, // was: O  (lower quality ordinal bound)
        up: constraint.W, // was: W  (upper quality ordinal bound)
      });
      if (!loader.policy.UR) {
        loader.K.W.A = false;
      }
    } else {
      if (loader.policy.UR) {
        loader.K.W.A = false;
      }
      wB(loader); // was: wB  (refresh buffering pipeline)
    }

    return;
  }

  // ------------------------------------------------------------------
  // Path B: no policy.W -- direct constraint application
  // ------------------------------------------------------------------
  if (!isAbrStateSatisfied(loader.W, constraint) && loader.videoTrack) {
    const previousUpper = loader.W.W; // was: K (previous upper bound)

    IA(loader, processQualityChange(loader.W, constraint)); // was: IA / qt7
    evaluateFormatSwitch(loader);                            // was: eg  (reconfigure)

    const unlockReattach =
      constraint.isLocked() &&
      constraint.reason === "m" &&
      loader.W.S; // was: W.S (format switch pending)

    const drmReattach =
      loader.policy.resetBufferPosition &&
      constraint.reason === "l" &&
      PV(loader.videoTrack); // was: PV  (track has DRM)

    const bitrateReattach =
      previousUpper.W > constraint.W && constraint.reason === "b";

    const codecReattach =
      loader.W.parseHexColor && !supportsChangeType(); // was: HA (hw-accel mismatch), Yi (supports?)

    if (unlockReattach || drmReattach || bitrateReattach || codecReattach) {
      loader.EH.LatencyTimer({
        reattachOnConstraint: unlockReattach
          ? "u"
          : drmReattach
            ? "drm"
            : codecReattach
              ? "codec"
              : "perf",
      });
    } else {
      wB(loader);
    }
  }
}

// ---------------------------------------------------------------------------
// Background suspend / resume  [was: w3]
// ---------------------------------------------------------------------------

/**
 * Suspends or resumes the media element when the player transitions
 * between foreground and background on mobile.
 *
 * @param {Object} player       - The video player instance.
 * @param {boolean} [attemptResume=true] - Whether to try resuming on foreground.
 */
export function handleBackgroundSuspend(player, attemptResume = true) { // was: w3
  if (
    !player.FI.AB ||
    player.videoData.backgroundable ||
    !player.mediaElement ||
    player.M6()
  ) {
    return;
  }

  if (player.isBackground() && player.mediaElement.Ka()) {
    player.RetryTimer("bgmobile", { suspend: 1 });
    player.NE(true, true);
  } else if (!player.isBackground() && attemptResume && Lf(player)) {
    player.RetryTimer("bgmobile", { resume: 1 });
  }
}

// ---------------------------------------------------------------------------
// Live absolute time computation  [was: bA]
// ---------------------------------------------------------------------------

/**
 * Returns the live broadcast absolute time (wall-clock epoch seconds).
 * For non-live content returns `NaN`.
 *
 * @param {Object} player - The video player instance.
 * @returns {number}
 */
export function getLiveBroadcastTime(player) { // was: bA
  if (!v4(player.videoData)) return NaN;

  let serverTimeOffset = 0;
  if (player.loader && player.videoData.W) {
    serverTimeOffset = G3(player.videoData)
      ? player.loader.logMetaCsiEvent.Bj() || 0
      : player.videoData.W.Ie;
  }

  return (0, g.h)() / 1000 - player.getWallClockTime - serverTimeOffset;
}
