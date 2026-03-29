import { scheduleMicrotask } from '../core/composition-helpers.js';
import { PlayerState } from '../media/codec-tables.js';
import { setExpiryTimer } from '../core/event-registration.js'; // was: ww
import { handleSegmentTransition } from '../ads/ad-cue-delivery.js'; // was: we
import { getSeekableRange } from './time-tracking.js'; // was: sR()
import { isServerStitchedDai } from './playback-mode.js'; // was: wW
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { getSeekableRangeStart } from './time-tracking.js'; // was: bC()
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { hasAdPlacements } from './caption-manager.js'; // was: Ym
import { CLIENT_TYPE_WHITELIST } from './bootstrap.js'; // was: XCm
import { getCurrentTime, getDuration } from './time-tracking.js';
import { getPlayerState } from './playback-bridge.js';
import { CueRange } from '../ui/cue-range.js';
import { seekTo } from '../ads/dai-cue-range.js';
import { concat } from '../core/array-utils.js';
import { enqueueVideoByPlayerVars, clearQueue } from './player-api.js';
import { playVideo, pauseVideo } from './player-events.js';
import { VideoData } from '../data/device-platform.js';
// TODO: resolve g.C8

/**
 * Playback mode/state initialization between ad-cue-delivery and
 * playback-state: timeline management for child playbacks (CSDAI).
 *
 * Source: base.js lines 53736–54002
 * [was: Yn_, Qix, PZ, lM, cgK, pvX, KMO, Tdn, ogx, Gx, ah, rgd, vZ, ft,
 *  $$, WM3, Ucy, uM, Iln, AgW]
 */

// ---------------------------------------------------------------------------
// Timeline notification helpers (lines 53736–53764)
// ---------------------------------------------------------------------------

/**
 * Notify the timeline of a state transition.
 * [was: Yn_]
 * @param {Object} timeline  [was: Q]
 * @param {*} transitionType  [was: c]
 * @param {*} info  [was: W]
 * @param {*} extra  [was: m]
 */
export function notifyTimeline(timeline, transitionType, info, extra) { // was: Yn_
  const payload = { // was: c
    OT: transitionType,
    Wm: info,
    setExpiryTimer: timeline.W.getCurrentTime(),
    DeferredValue: extra,
  };
  handleSegmentTransition(timeline, payload);
}

/**
 * Execute a seek on the timeline, potentially switching child playback.
 * [was: Qix]
 * @param {Object} timeline  [was: Q]
 * @param {number} seekTime  [was: c]
 * @param {Object} seekOptions  [was: W]
 */
export function executeTimelineSeek(timeline, seekTime, seekOptions = {}) { // was: Qix
  const previousState = timeline.D || timeline.app.oe().getPlayerState(); // was: m
  cancelPendingTransitions(timeline, true); // was: ft(Q, !0)
  seekTime = isFinite(seekTime) ? seekTime : timeline.W.getSeekableRange;
  const { isServerStitchedDai: childPlayback, TW: childTime } = findChildAtTime(timeline, seekTime); // was: vZ(Q, c) -> K, T
  const needsSwitch = (childPlayback && !isCurrentChild(timeline, childPlayback)) ||
                       (!childPlayback && timeline.W !== timeline.app.oe()); // was: c
  const childTimeMs = childTime * 1e3; // was: r
  const inCueRange = timeline.A && timeline.A.start <= childTimeMs && childTimeMs <= timeline.A.end; // was: r
  if (!needsSwitch && inCueRange) clearActiveChild(timeline); // was: Gx
  if (childPlayback) {
    switchToChild(timeline, childPlayback, childTime, seekOptions, previousState); // was: pvX
  } else {
    seekParent(timeline, childTime, seekOptions, previousState, "_execute"); // was: $$
  }
}

/**
 * Log a timeline error to telemetry.
 * [was: PZ]
 * @param {Object} timeline  [was: Q]
 * @param {string} errorMsg  [was: c]
 * @param {string} [cpn]  [was: W]
 * @param {string} [videoId]  [was: m]
 */
export function logTimelineError(timeline, errorMsg, cpn, videoId) { // was: PZ
  timeline.W.RetryTimer("timelineerror", {
    e: errorMsg,
    cpn: cpn ? cpn : undefined, // was: void 0
    videoId: videoId ? videoId : undefined,
  });
}

// ---------------------------------------------------------------------------
// Cue-range helpers (lines 53766–53780)
// ---------------------------------------------------------------------------

/**
 * Create a cue-range for a child playback.
 * [was: lM]
 * @param {number} durationMs  [was: Q]
 * @param {boolean} isChildActive  [was: c]
 * @returns {g.C8}
 */
export function createChildCueRange(durationMs, isChildActive) { // was: lM
  return new CueRange(
    Math.max(0, durationMs - 5e3),
    isChildActive ? 0x8000000000000 : durationMs - 1,
    { namespace: "childplayback", priority: 9 }
  );
}

/**
 * Replace the cue-range (H4) on a child-playback entry.
 * [was: cgK]
 * @param {Object} timeline  [was: Q]
 * @param {Object} childEntry  [was: c]
 * @param {Object} newCueRange  [was: W]
 */
export function replaceChildCueRange(timeline, childEntry, newCueRange) { // was: cgK
  const oldCueRange = childEntry.ShrunkenPlayerBytesMetadata; // was: m
  childEntry.ShrunkenPlayerBytesMetadata = newCueRange;
  if (isCurrentChild(timeline, childEntry)) {
    const player = timeline.app.oe(); // was: W
    if (oldCueRange.Td === timeline.A) clearActiveChild(timeline); // was: Gx
    player.removeCueRange(oldCueRange.Td);
    player.addCueRange(childEntry.ShrunkenPlayerBytesMetadata.Td);
  }
}

// ---------------------------------------------------------------------------
// Child-playback switching (lines 53782–53870)
// ---------------------------------------------------------------------------

/**
 * Switch to (or remain in) a child playback at a given time.
 * [was: pvX]
 * @param {Object} timeline  [was: Q]
 * @param {Object} childEntry  [was: c]
 * @param {number} seekTime  [was: W]
 * @param {Object} seekOptions  [was: m]
 * @param {Object} previousState  [was: K]
 */
export function switchToChild(timeline, childEntry, seekTime, seekOptions, previousState) { // was: pvX
  const alreadyActive = isCurrentChild(timeline, childEntry); // was: T
  if (!alreadyActive) {
    childEntry.playerVars.prefer_gapless = true; // was: !0
    const videoData = new VideoData(timeline.FI, childEntry.playerVars); // was: r
    videoData.PJ = childEntry.PJ;
    timeline.api.Q0(videoData, childEntry.playerType);
  }
  const player = timeline.app.oe(); // was: r
  if (!alreadyActive) player.addCueRange(childEntry.ShrunkenPlayerBytesMetadata.Td);
  player.seekTo(seekTime, {
    Z7: "application_timelinemanager",
    ...seekOptions,
  });
  syncPlaybackState(timeline, previousState); // was: WM3
}

/**
 * Register a new child playback on the timeline.
 * Returns the unique playback ID, or "" on failure.
 * [was: KMO]
 * @param {Object} timeline  [was: Q]
 * @param {Object} playerVars  [was: c]
 * @param {number} playerType  [was: W]
 * @param {number} durationMs  [was: m]
 * @param {number} enterTimeMs  [was: K]
 * @param {*} cuepointId  [was: T]
 * @param {number} [parentReturnTimeMs]
 * @returns {string} playback ID or ""
 */
export function registerChildPlayback(timeline, playerVars, playerType, durationMs, enterTimeMs, cuepointId, parentReturnTimeMs) { // was: KMO
  const cpn = playerVars.cpn; // was: r
  const videoId = playerVars.docid || playerVars.video_id || playerVars.videoId || playerVars.id; // was: U
  const parentPlayer = timeline.W; // was: I
  parentReturnTimeMs = parentReturnTimeMs === undefined ? enterTimeMs + durationMs : parentReturnTimeMs; // was: void 0

  if (enterTimeMs > parentReturnTimeMs) {
    logTimelineError(timeline, `enterAfterReturn enterTimeMs=${enterTimeMs} is greater than parentReturnTimeMs=${parentReturnTimeMs.toFixed(3)}`, cpn, videoId);
    return "";
  }
  const minSeekableMs = parentPlayer.getSeekableRangeStart * 1e3; // was: X
  if (enterTimeMs < minSeekableMs) {
    logTimelineError(timeline, `enterBeforeMinSeekable enterTimeMs=${enterTimeMs} is less than parentMinSeekableTimeMs=${minSeekableMs}`, cpn, videoId);
    return "";
  }
  const durationMs2 = parentPlayer.getDuration() * 1e3; // was: X
  if (parentReturnTimeMs > durationMs2) {
    const msg = `returnAfterDuration parentReturnTimeMs=${parentReturnTimeMs.toFixed(3)} is greater than parentDurationMs=${durationMs2}. And timestampOffset in seconds is ${parentPlayer.NQ()}`; // was: I
    logTimelineError(timeline, msg, cpn, videoId);
    return "";
  }

  // Validate no overlapping entries
  let adjacent = null; // was: X
  for (const entry of timeline.O) { // was: e
    if (enterTimeMs >= entry.CX && enterTimeMs < entry.yz) {
      logTimelineError(timeline, "overlappingEnter", cpn, videoId);
      return "";
    }
    if (parentReturnTimeMs <= entry.yz && parentReturnTimeMs > entry.CX) {
      logTimelineError(timeline, "overlappingReturn", cpn, videoId);
      return "";
    }
    if (parentReturnTimeMs === entry.CX) {
      logTimelineError(timeline, "outOfOrder", cpn, videoId);
      return "";
    }
    if (enterTimeMs === entry.yz) adjacent = entry;
  }

  const playbackId = `cs_childplayback_${mc0++}`; // was: r
  const cueRange = { // was: U
    Td: createChildCueRange(durationMs, true), // was: lM(m, !0)
    Jt: Infinity,
    target: null,
  };
  const newEntry = { // was: A
    PJ: playbackId,
    playerVars,
    playerType,
    durationMs,
    CX: enterTimeMs,
    yz: parentReturnTimeMs,
    ShrunkenPlayerBytesMetadata: cueRange,
  };

  timeline.O = timeline.O.concat(newEntry).sort((a, b) => a.CX - b.CX); // was: e, V

  if (adjacent) {
    replaceChildCueRange(timeline, adjacent, { // was: cgK
      Td: createChildCueRange(adjacent.durationMs, true), // was: lM
      Jt: adjacent.ShrunkenPlayerBytesMetadata.Jt,
      target: newEntry,
    });
  } else {
    const enterCue = { // was: c
      Td: createChildCueRange(enterTimeMs, false), // was: lM(K, !1)
      Jt: enterTimeMs,
      target: newEntry,
    };
    timeline.K.set(enterCue.Td, enterCue);
    parentPlayer.addCueRange(enterCue.Td);
  }

  // If the parent is currently at the child's time, switch immediately
  let shouldPreload = true; // was: c -> !0
  if (timeline.W === timeline.app.oe()) {
    const currentMs = parentPlayer.getCurrentTime() * 1e3; // was: I
    if (currentMs >= newEntry.CX && currentMs < newEntry.yz) {
      const state = timeline.app.oe().getPlayerState(); // was: e
      const offset = currentMs - newEntry.CX; // was: V
      scheduleMicrotask(() => { // was: hG
        switchToChild(timeline, newEntry, offset / 1e3, {}, state); // was: pvX
      });
      shouldPreload = false; // was: !1
    }
  }
  if (shouldPreload) {
    timeline.S.unshift(newEntry);
    timeline.isSamsungSmartTV.cw(0);
  }
  return playbackId;
}

// ---------------------------------------------------------------------------
// Enqueue / transition helpers (lines 53872–53891)
// ---------------------------------------------------------------------------

/**
 * Enqueue a child playback by player vars.
 * [was: Tdn]
 */
export function enqueueChildByVars(timeline, childEntry, seekOptions, cueRange) { // was: Tdn
  timeline.A = cueRange; // was: m
  const playbackId = childEntry.PJ; // was: m
  const vars = childEntry.playerVars; // was: K
  const playerType = childEntry.playerType; // was: T
  timeline.J = childEntry;
  if (vars) timeline.api.enqueueVideoByPlayerVars(vars, playerType, seekOptions, playbackId);
}

/**
 * Transition back to parent playback.
 * [was: ogx]
 */
export function transitionToParent(timeline, seekOptions, playerRef, cueRange) { // was: ogx
  timeline.A = cueRange; // was: m
  timeline.api.T3(timeline.W, playerRef, seekOptions);
}

/**
 * Clear the active child and queue.
 * [was: Gx]
 */
export function clearActiveChild(timeline) { // was: Gx
  timeline.J = null;
  timeline.A = null;
  if (!timeline.api.Zr()) timeline.api.clearQueue();
}

/**
 * Check whether a child entry is the currently presenting playback.
 * [was: ah]
 * @param {Object} timeline  [was: Q]
 * @param {Object} childEntry  [was: c]
 * @returns {boolean}
 */
export function isCurrentChild(timeline, childEntry) { // was: ah
  const player = timeline.app.oe(); // was: Q
  return !!player && player.getVideoData().PJ === childEntry.PJ;
}

/**
 * Get the return-time for a child entry (in ms).
 * [was: rgd]
 */
export function getChildReturnTime(timeline, childEntry) { // was: rgd
  if (!isCurrentChild(timeline, childEntry)) logTimelineError(timeline, "childPlaybackIsNotPresenting");
  return childEntry.yz === childEntry.CX + childEntry.durationMs
    ? childEntry.CX + timeline.app.oe().getCurrentTime() * 1e3
    : childEntry.yz;
}

// ---------------------------------------------------------------------------
// Timeline lookup / cancellation (lines 53902–53946)
// ---------------------------------------------------------------------------

/**
 * Find the child playback (if any) at a given seek time, and return
 * the adjusted time within it.
 * [was: vZ]
 * @param {Object} timeline  [was: Q]
 * @param {number} seekTime  [was: c]  (seconds)
 * @returns {{ wW: Object|null, TW: number }}
 */
export function findChildAtTime(timeline, seekTime) { // was: vZ
  let offset = 0; // was: W
  for (const entry of timeline.O) { // was: m
    const entryStart = entry.CX / 1e3 + offset; // was: Q (reused)
    const entryEnd = entryStart + entry.durationMs / 1e3; // was: K
    if (entryStart > seekTime) break;
    if (entryEnd > seekTime) {
      return { isServerStitchedDai: entry, TW: seekTime - entryStart };
    }
    offset = entryEnd - entry.yz / 1e3;
  }
  return { isServerStitchedDai: null, TW: seekTime - offset };
}

/**
 * Cancel all pending transitions and reset the timeline state.
 * [was: ft]
 * @param {Object} timeline  [was: Q]
 * @param {boolean} resetJumper  [was: c]
 */
export function cancelPendingTransitions(timeline, resetJumper) { // was: ft
  timeline.mF = NaN;
  timeline.Y = null;
  timeline.L.stop();
  if (timeline.j && resetJumper) timeline.j.hasAdPlacements();
  timeline.D = null;
  timeline.j = null;
}

/**
 * Seek the parent player to a given time.
 * [was: $$]
 */
export function seekParent(timeline, seekTime, seekOptions, previousState, label) { // was: $$
  const parent = timeline.W; // was: T
  if (parent !== timeline.app.oe()) timeline.app.Mf();
  if (!timeline.FI.X("html5_sabr_csdai_seek_log")) label = ""; // was: K
  parent.seekTo(seekTime, {
    Z7: "application_timelinemanager" + (label ?? ""),
    ...seekOptions,
  });
  syncPlaybackState(timeline, previousState); // was: WM3
}

/**
 * Synchronize play/pause state after a seek or transition.
 * [was: WM3]
 */
export function syncPlaybackState(timeline, previousState) { // was: WM3
  const player = timeline.app.oe(); // was: Q
  const currentState = player.getPlayerState(); // was: W
  if (previousState.isOrWillBePlaying() && !currentState.isOrWillBePlaying()) {
    player.playVideo();
  } else if (previousState.isPaused() && !currentState.isPaused()) {
    player.pauseVideo();
  }
}

// ---------------------------------------------------------------------------
// Force-transition and cleanup (lines 53948–54002)
// ---------------------------------------------------------------------------

/**
 * Force a transition back to the parent from any active child.
 * [was: Ucy]
 */
export function forceParentTransition(timeline) { // was: Ucy
  const activeChild = timeline.O.find((entry) => isCurrentChild(timeline, entry)); // was: c, W -> ah
  if (activeChild) {
    const childPlayer = timeline.app.oe(); // was: W
    clearActiveChild(timeline); // was: Gx
    const emptyState = new PlayerState(8); // was: m
    const returnTime = getChildReturnTime(timeline, activeChild) / 1e3; // was: c -> rgd
    seekParent(timeline, returnTime, {}, emptyState, "_force"); // was: $$
    childPlayer.RetryTimer("forceParentTransition", { childPlayback: 1 });
    timeline.W.RetryTimer("forceParentTransition", { parentPlayback: 1 });
  }
}

/**
 * Clear child playbacks within a time range, adjusting adjacent cue-ranges.
 * [was: uM]
 * @param {Object} timeline  [was: Q]
 * @param {number} startMs  [was: c]
 * @param {number} endMs  [was: W]
 */
export function clearChildPlaybacksInRange(timeline, startMs = -1, endMs = Infinity) { // was: uM
  // Remove enter-cue-ranges that fall within the range
  for (const [cueId, cue] of timeline.K) { // was: U, I
    if (cue.Jt >= startMs && cue.target && cue.target.yz <= endMs) {
      timeline.W.removeCueRange(cueId); // was: m
      timeline.K.delete(cueId);
    }
  }
  // Remove child entries in range, cleaning up active ones
  const remaining = []; // was: m
  for (const entry of timeline.O) { // was: U
    if (entry.CX >= startMs && entry.yz <= endMs) {
      if (timeline.J === entry) clearActiveChild(timeline); // was: K -> Gx
      if (isCurrentChild(timeline, entry)) timeline.app.Mf(); // was: ah
    } else {
      remaining.push(entry);
    }
  }
  timeline.O = remaining;

  // Adjust the child at startMs if it straddles the boundary
  const { isServerStitchedDai: childAtStart, TW: adjustedTime } = findChildAtTime(timeline, startMs / 1e3); // was: T, r -> vZ
  if (childAtStart) {
    const newDurationMs = adjustedTime * 1e3; // was: c
    updateChildDuration(timeline, childAtStart, newDurationMs,
      childAtStart.yz === childAtStart.CX + childAtStart.durationMs
        ? childAtStart.CX + newDurationMs
        : childAtStart.yz
    ); // was: Iln
  }

  // Check the child at endMs — should not straddle
  const { isServerStitchedDai: childAtEnd } = findChildAtTime(timeline, endMs / 1e3); // was: c
  if (childAtEnd) {
    logTimelineError(
      timeline,
      `Invalid clearEndTimeMs=${endMs} that falls during ` +
      `playback={timelinePlaybackId=${childAtEnd.PJ} video_id=${childAtEnd.playerVars.video_id} ` +
      `durationMs=${childAtEnd.durationMs} enterTimeMs=${childAtEnd.CX} parentReturnTimeMs=${childAtEnd.yz}}.` +
      `Child playbacks can only have duration updated not their start.`
    );
  }
}

/**
 * Update a child playback's duration and parent-return time.
 * [was: Iln]
 * @param {Object} timeline  [was: Q]
 * @param {Object} childEntry  [was: c]
 * @param {number} newDurationMs  [was: W]
 * @param {number} newReturnMs  [was: m]
 */
export function updateChildDuration(timeline, childEntry, newDurationMs, newReturnMs) { // was: Iln
  childEntry.durationMs = newDurationMs;
  childEntry.yz = newReturnMs;
  const newCueRange = { // was: m
    Td: createChildCueRange(newDurationMs, true), // was: lM(W, !0)
    Jt: newDurationMs,
    target: null,
  };
  replaceChildCueRange(timeline, childEntry, newCueRange); // was: cgK
  if (isCurrentChild(timeline, childEntry) &&
      timeline.app.oe().getCurrentTime() * 1e3 > newDurationMs) {
    const returnTime = getChildReturnTime(timeline, childEntry) / 1e3; // was: c -> rgd
    const currentState = timeline.app.oe().getPlayerState(); // was: W
    seekParent(timeline, returnTime, {}, currentState, "_update"); // was: $$
  }
}

/**
 * Validate a playback-mode string (no-op validator).
 * [was: AgW]
 * @param {string} mode  [was: Q]
 */
export function validatePlaybackMode(mode) { // was: AgW
  if (mode && mode !== "web") CLIENT_TYPE_WHITELIST.includes(mode);
}
