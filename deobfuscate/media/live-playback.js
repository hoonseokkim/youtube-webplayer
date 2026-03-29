/**
 * Live Playback Control
 *
 * Handles live stream seek-to-live (peg-to-live), gapless shorts seeking,
 * video-player-initiated seek suppression, and end-credits cue ranges.
 *
 * Source: base.js lines 45001-46010
 * @module live-playback
 */
import { getSeekableRange } from '../player/time-tracking.js'; // was: sR()
import { getSeekableRangeStart } from '../player/time-tracking.js'; // was: bC()
import { getStreamTimeOffsetNQ } from '../player/time-tracking.js'; // was: NQ()
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { getBufferedEnd } from './source-buffer.js'; // was: KA
import { clampToSeekableRange } from './buffer-manager.js'; // was: Ub
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { shouldUseSabr } from './seek-controller.js'; // was: M8
import { isTimeInRange } from './codec-helpers.js'; // was: zb
import { getCurrentTime } from '../player/time-tracking.js';
import { seekTo } from '../ads/dai-cue-range.js';
import { CueRange } from '../ui/cue-range.js';

// ---------------------------------------------------------------------------
// Peg-to-live logic  [was: sI_]
// ---------------------------------------------------------------------------



/**
 * Pegs playback to the live edge when behind, optionally performing an
 * in-buffer seek if the target is already buffered.
 *
 * @param {Object} player      - The media player instance.
 * @param {boolean} allowInBufferSeek - Whether to attempt an in-buffer seek first.
 */
export function pegToLive(player, allowInBufferSeek) { // was: sI_
  if (!player.W) return;

  const liveTimeline = player.W; // was: W (live-timeline controller)
  let currentTime = player.getCurrentTime();
  let seekableEnd = liveTimeline.getSeekableRange; // was: sR  (seekable range end)
  let targetOffset = liveTimeline.policy.O; // was: policy.O (target live offset)

  // If not joined, reduce offset by 1 (floor at 0)
  if (!liveTimeline.j) {
    targetOffset = Math.max(targetOffset - 1, 0);
  }
  targetOffset *= cf(liveTimeline); // was: cf  (segment-duration factor)

  if (currentTime >= seekableEnd - targetOffset || !liveTimeline.kU()) {
    // Already at live head or cannot keep up -- compute fallback target
    seekableEnd = currentTime < player.videoData.getSeekableRangeStart
      ? Math.min(player.videoData.getSeekableRangeStart + 10, liveTimeline.getSeekableRange)
      : NaN;
  } else {
    // Adaptively grow the target offset (policy.K == adaptive mode)
    if (liveTimeline.policy.K) {
      if (liveTimeline.policy.mF) {
        liveTimeline.policy.O = Math.min(
          liveTimeline.policy.O + liveTimeline.policy.J,
          liveTimeline.policy.D,
        );
        liveTimeline.policy.W = Math.min(liveTimeline.policy.W + 1, 10);
      } else {
        liveTimeline.policy.O = Math.max(
          liveTimeline.policy.O + 1,
          liveTimeline.policy.D,
        );
        liveTimeline.policy.W = Math.max(liveTimeline.policy.W + 1, 10);
      }
    }
    seekableEnd = Infinity;
  }

  if (isNaN(seekableEnd)) return;

  // Try an in-buffer seek when the loader already has the target buffered
  if (
    player.loader &&
    allowInBufferSeek
  ) {
    const isInBufferPtlActive = player.MM.isActive(); // was: MM  (in-buffer-PTL timer)
    currentTime = player.W.getSeekableRange;
    const bufferedTarget = dLy(player.loader, currentTime - player.getStreamTimeOffsetNQ);

    if (bufferedTarget && !isInBufferPtlActive) {
      player.MM.start();
      player.EH.RetryTimer("inBufferPtl", {
        cmt: player.getCurrentTime(),
        seekTo: bufferedTarget + player.getStreamTimeOffsetNQ,
      });
      player.seekTo(bufferedTarget + player.getStreamTimeOffsetNQ, {
        Z7: "seektimeline_inBufferSeek",
        seekSource: 34, // was: seekSource: 34
      });
      return;
    }
  }

  player.seekTo(seekableEnd, {
    Z7: "seektimeline_pegToLive",
    seekSource: 34, // was: seekSource: 34
  });
}

// ---------------------------------------------------------------------------
// Gapless / pseudo-gapless shorts seek  [was: Iq]
// ---------------------------------------------------------------------------

/**
 * Handles gapless seeking for Shorts and pseudo-gapless playback transitions.
 * Resolves or retries the seek promise depending on how close the media
 * element's current time is to the requested seek target.
 *
 * @param {Object} player     - The media player instance.
 * @param {Object} [seekOpts] - Optional seek metadata (e.g. seekSource).
 */
export function handleGaplessSeek(player, seekOpts) { // was: Iq
  if (!player.j) return; // no pending seek promise

  // Live playback with manifest: clamp seek target
  if (
    player.videoData.isLivePlayback &&
    player.videoData.A &&
    !player.videoData.A.W() &&
    player.mediaElement &&
    player.mediaElement.A() > 0 &&
    getBufferedEnd(player.mediaElement) > 0
  ) {
    player.O = clampToSeekableRange(player, player.O, false);
  }

  // Pseudo-gapless shorts: check experiment flag and seekSource === 60
  const isPseudoGaplessShorts =
    player.X("html5_pseudogapless_shorts_seek_to_next_start") &&
    seekOpts?.seekSource === 60;

  if (!player.mediaElement || !isMediaReady(player, isPseudoGaplessShorts)) {
    // was: dRn
    player.isInAdPlayback.start(750); // retry after 750 ms
    return;
  }

  if (isNaN(player.O) || !isFinite(player.O)) return;

  const offsetDelta = player.PA - (player.O - player.timestampOffset);
  if (offsetDelta === 0 || Math.abs(offsetDelta) < 0.005) return;

  const timeDelta =
    player.mediaElement.getCurrentTime() - player.O;

  if (
    Math.abs(timeDelta) <= player.UH ||
    Math.abs(timeDelta) < 0.005
  ) {
    resolveSeekOnSeeked(player); // was: Ljd
    return;
  }

  // One-shot "force first seek" flag  [was: videoData.AB]
  if (player.videoData.AB) {
    player.videoData.AB = false;
  } else if (
    !v4(player.videoData) &&
    player.O >= player.TU() - 0.1
  ) {
    // Target at or beyond max seekable -- resolve immediately as ended
    player.O = player.TU();
    player.j.resolve(player.TU());
    if (player.FI.cB()) {
      player.EH.RetryTimer("setEndedInSeek", {
        tgt: `${player.O}`,
        maxst: `${player.TU()}`,
      });
    }
    player.EH.Sn();
    return;
  }

  try {
    const rawTarget = player.O - player.timestampOffset;
    player.mediaElement.seekTo(rawTarget);
    player.mF.W = rawTarget;
    player.PA = rawTarget;
    player.A = player.O;
    player.S = false; // was: !1
  } catch (_e) {
    // Silently swallow seek errors (transient media-element state)
  }
}

// ---------------------------------------------------------------------------
// Disable video-player-initiated seeks flag check  [was: A5]
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the "disable video-player-initiated seeks" experiment
 * is active **and** the video uses SABR (manifestless) delivery.
 *
 * @param {Object} eventHandler - The player event handler (EH). [was: Q.EH]
 * @returns {boolean}
 */
export function isVideoPlayerSeekDisabled(eventHandler) { // was: A5
  return (
    eventHandler.X("html5_disable_video_player_initiated_seeks") &&
    shouldUseSabr(eventHandler.videoData)
  );
}

// ---------------------------------------------------------------------------
// End-credits cue range management  [was: Eb / Zy, namespace "endcr"]
// ---------------------------------------------------------------------------

/**
 * Sets up an end-credits cue range starting at `endSeconds` and spanning to
 * the theoretical max safe timestamp.
 *
 * @param {Object} player      - The media player instance.
 * @param {number} endSeconds  - The point (in seconds) where end-credits begin.
 */
export function setEndCreditsCueRange(player, endSeconds) { // was: Eb
  if (player.Zs) {
    removeEndCreditsCueRange(player);
  }
  player.Zs = new CueRange(endSeconds * 1000, 0x7ffffffffffff);
  player.Zs.namespace = "endcr";
  player.addCueRange(player.Zs);
}

/**
 * Removes a previously-set end-credits cue range.
 *
 * @param {Object} player - The media player instance.
 */
export function removeEndCreditsCueRange(player) { // was: Zy
  player.removeCueRange(player.Zs);
  player.Zs = null;
}

// ---------------------------------------------------------------------------
// Internal helpers (kept private, referenced above)
// ---------------------------------------------------------------------------

/**
 * Checks whether the media element is ready to accept a seek.
 * [was: dRn]
 *
 * @param {Object} player              - The media player instance.
 * @param {boolean} [forceNoBuffer=false] - Skip buffer-range check.
 * @returns {boolean}
 */
function isMediaReady(player, forceNoBuffer = false) { // was: dRn
  if (
    !player.mediaElement ||
    player.mediaElement.A() === 0 ||
    player.mediaElement.hasError()
  ) {
    return false;
  }

  const hasPositiveTime = player.mediaElement.getCurrentTime() > 0;

  if (
    (player.videoData.A && player.videoData.A.W()) ||
    player.videoData.isLivePlayback ||
    !player.videoData.Ir()
  ) {
    if (player.O >= 0 && !forceNoBuffer) {
      const buffered = player.mediaElement.L();
      return buffered.length || !hasPositiveTime
        ? isTimeInRange(buffered, player.O - player.timestampOffset)
        : hasPositiveTime;
    }
    return hasPositiveTime;
  }

  return hasPositiveTime;
}

/**
 * Resolves the pending seek promise when the media element reports `seeked`.
 * [was: Ljd]
 *
 * @param {Object} player - The media player instance.
 */
function resolveSeekOnSeeked(player) { // was: Ljd
  if (player.j) {
    player.j.resolve(player.mediaElement.getCurrentTime());
    player.mF.O = null;
  }
}
