/**
 * Ad Cue Delivery — segment miss detection, precue validation, ad playback
 * state persistence, and cue-range management for server-stitched DAI.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~53236–53254  (pE — disable SSDAI flow)
 *                 ~53256–53283  (wvK, ZC, bId — seek/skip/timeout helpers)
 *                 ~53289–53325  (HZ, gZ0, f$0, sD, vZ_ — state helpers)
 *                 ~53327–53397  (de, we — segment enter logging/transition)
 *                 ~53400–53485  (Gwd, bM, Lt, l$d, Fb, ge, hty — ad lifecycle)
 *                 ~53487–53531  (uZ7, j1, g.iM, S1 — segment miss detection)
 *                 ~53533–53598  (dY_, OD, Nm, LIW, yH — precue validation)
 *                 ~53625–53735  (COn, M8O, JWX, RtK, $Yn, a$X, PO7, kwO, Yn_)
 *                 ~53189–53235  (g.wqw — get video playback record for segment)
 *
 * Key subsystems:
 *   - Segment miss detection (S1) — falls back to previous segment state
 *     when the current segment has no cached record
 *   - Precue validation (dY_) — checks undecoded-segment set and S1 result
 *   - State persistence for ad playback entries (FIR, ZI3, EZn, s10)
 *   - Previous segment state checking (OD) — time-based lookup into the
 *     ad timeline for E7 (encrypted) and standard playbacks
 *   - Ad delivery cue-range management (vZ_, RtK, de, we, a$X)
 *   - SSDAI disable flow (pE) — shuts down server-stitched ad insertion
 *   - Undecoded segment range tracking (Nm, g.iM)
 *   - Ad break info aggregation ($Yn) — collects CPNs, video IDs,
 *     ad formats, QoE context data for transition payloads
 *
 * [was: pE, wvK, ZC, bId, HZ, gZ0, f$0, sD, vZ_, de, we,
 *  Gwd, bM, Lt, l$d, Fb, ge, hty, uZ7, j1, g.iM, S1,
 *  dY_, OD, Nm, LIW, yH, COn, M8O, JWX, RtK, $Yn, a$X,
 *  PO7, kwO, Yn_, g.wqw]
 */

import { pauseVideo, playVideo, seekTo } from '../player/player-events.js';  // was: g.pauseVideo, g.playVideo, g.seekTo
import { reportTelemetry } from './dai-cue-range.js'; // was: PB
import { listenOnce } from '../core/composition-helpers.js'; // was: E7
import { publishCueRangeEvent } from '../player/playback-state.js'; // was: rW
import { renderAdText } from '../data/collection-utils.js'; // was: E8
import { isServerStitchedDai } from '../player/playback-mode.js'; // was: wW
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { getNFOffset } from './ad-async.js'; // was: iU
import { forwardPlayback } from './dai-cue-range.js'; // was: Fp
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { rejectedPromise } from '../core/composition-helpers.js'; // was: cJ
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { clientHintsOverride } from '../proto/messages-core.js'; // was: Sf
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { stepGenerator } from './ad-async.js'; // was: GH
import { getTimeHead } from '../player/time-tracking.js'; // was: TH()
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { setExpiryTimer } from '../core/event-registration.js'; // was: ww
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { findChildBox } from '../media/format-setup.js'; // was: Rl
import { removeAdBreakCueRanges } from './dai-cue-range.js'; // was: M9
import { unlockTrackSegment } from '../media/track-manager.js'; // was: BP
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { findSegmentByMediaTime } from './ad-prebuffer.js'; // was: yW_
import { EXP_748402147 } from '../proto/messages-core.js'; // was: Hw
import { SLOT_MESSAGE_MARKER } from '../proto/messages-core.js'; // was: Ww
import { isCompressedDomainComposite } from '../media/audio-normalization.js'; // was: gA
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { clearSecondaryPresenters } from './ad-prebuffer.js'; // was: MY_
import { registerSecondaryPresenter } from './ad-prebuffer.js'; // was: Ih
import { removeSegmentEntries } from './ad-prebuffer.js'; // was: ZI3
import { dispose } from './dai-cue-range.js';
import { getCurrentTime } from '../player/time-tracking.js';
import { CueRange } from '../ui/cue-range.js';
import { clear, slice } from '../core/array-utils.js';
// TODO: resolve g.C8

// ---------------------------------------------------------------------------
// Segment Miss Detection  (line 53506)
// ---------------------------------------------------------------------------

/**
 * Looks up the ad-playback record for a given segment sequence number.
 *
 * If no record exists in the `v5` cache for `segmentNumber`:
 *   1. Attempts a time-based lookup via `findSegmentByMediaTime` (OD).
 *   2. Falls back to the previous segment's record (`v5.get(segmentNumber - 1)`),
 *      logging a `misscue` or `adnf` telemetry event depending on whether
 *      an explicit miss key was provided and whether the prior segment's
 *      state (`nf`) is 2 (ad-no-fill).
 *
 * @param {Object} manager         SSDAI cue-range manager.           [was: Q]
 *   @param {Map}    manager.v5    — segment-number -> playback record cache  [was: v5]
 * @param {number} mediaTime       Current media time in seconds.     [was: c]
 * @param {number} segmentNumber   Segment sequence number.           [was: W]
 * @param {number} [trackType]     Track type enum (default 2).       [was: m]
 * @param {string} [missKey]       Optional miss-context key for logging. [was: K]
 * @returns {Object|undefined}     The playback record, or undefined.
 *
 * [was: S1]
 */
export function findSegmentRecord(manager, mediaTime, segmentNumber, trackType, missKey) { // was: S1
  let record = manager.v5.get(segmentNumber); // was: T

  if (!record) {
    const byTime = findSegmentByMediaTime(manager, mediaTime); // was: T = OD(Q, c)
    if (byTime) return byTime;

    const prevRecord = manager.wD(segmentNumber - 1, trackType ?? 2); // was: c (reused)

    if (missKey) {
      manager.reportTelemetry({
        misscue: missKey,
        sq: segmentNumber,
        type: trackType,
        prevsstate: prevRecord?.nf,
        prevrecord: manager.v5.has(segmentNumber - 1),
      });
      return manager.v5.get(segmentNumber - 1);
    }

    if (prevRecord?.nf === 2) {
      manager.reportTelemetry({
        adnf: 1,
        sq: segmentNumber,
        type: trackType,
        prevrecord: manager.v5.has(segmentNumber - 1),
      });
      return manager.v5.get(segmentNumber - 1);
    }
  }

  return record;
}

// ---------------------------------------------------------------------------
// Precue Validation  (line 53533)
// ---------------------------------------------------------------------------

/**
 * Validates whether a segment should be treated as ad content.
 *
 * Returns `undefined` (discard) when:
 *   - SSDAI is disabled (`ol` flag)
 *   - The segment falls within the undecoded range (`g.iM`)
 *   - The record exists but the video data indicates E7 (encrypted) with
 *     a `JH` (join-hint) flag — meaning the join is already in progress
 *
 * Otherwise returns the playback record from `findSegmentRecord`.
 *
 * Logs `gdu: "undec"` when the segment is in the undecoded set.
 *
 * @param {Object} manager        SSDAI cue-range manager.           [was: Q]
 * @param {number} mediaTime      Current media time in seconds.     [was: c]
 * @param {number} segmentNumber  Segment sequence number.           [was: W]
 * @param {number} trackType      Track type enum.                   [was: m]
 * @param {number} itag           Format itag.                       [was: K]
 * @param {string} [missKey]      Miss-context key for logging.      [was: T]
 * @returns {Object|undefined}    Validated playback record.
 *
 * [was: dY_]
 */
export function validatePrecue(manager, mediaTime, segmentNumber, trackType, itag, missKey) { // was: dY_
  if (!manager.ol) {
    if (isInUndecodedRange(manager, segmentNumber)) { // was: g.iM(Q, W)
      manager.reportTelemetry({
        gdu: 'undec',
        seg: segmentNumber,
        itag,
      });
    } else {
      const record = findSegmentRecord(manager, mediaTime, segmentNumber, trackType, missKey); // was: c = S1(...)
      if (!manager.W.getVideoData().listenOnce() || !record?.JH) {
        return record;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Time-Based Segment Lookup  (line 53546)
// ---------------------------------------------------------------------------

/**
 * Finds the ad-playback record that spans the given media time by
 * searching the ordered timeline.
 *
 * For E7 (encrypted) playbacks, uses the entry's `E8` field as an
 * alternative start-time base with a 1-second tolerance window.
 *
 * For standard playbacks, delegates to `bM()` with a 1-second fallback
 * tolerance.
 *
 * @param {Object} manager    SSDAI cue-range manager.        [was: Q]
 * @param {number} mediaTime  Media time in seconds (raw).     [was: c]
 * @returns {Object|undefined} Matching playback record.
 *
 * [was: OD]
 */
export function findSegmentByMediaTime(manager, mediaTime) { // was: OD
  const adjustedTime = mediaTime + manager.publishCueRangeEvent(); // was: c (reused)

  if (manager.W.getVideoData().listenOnce()) {
    // Encrypted playback — search ordered timeline directly
    let match; // was: m
    const timeline = manager.O; // was: Q (reused)
    const searchTime = adjustedTime * 1000; // was: Q (reused)

    for (const entry of timeline.O) { // was: m of W.O
      const startMs = entry.renderAdText ? entry.renderAdText * 1000 : entry.CX; // was: W
      if (searchTime >= entry.CX - 1000 && searchTime <= startMs + entry.durationMs + 1000) {
        match = entry;
        break;
      }
    }

    return { isServerStitchedDai: match, TW: adjustedTime }?.isServerStitchedDai;
  }

  // Standard playback
  let result = lookupByTime(manager, adjustedTime); // was: m = bM(Q, c)
  if (!result?.isServerStitchedDai) {
    result = lookupByTime(manager, adjustedTime, 1); // was: m = bM(Q, c, 1) — 1s tolerance
  }
  return result?.isServerStitchedDai;
}

// ---------------------------------------------------------------------------
// Undecoded Segment Range Check  (line 53499)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the given segment number falls within any of the
 * manager's undecoded ranges.
 *
 * @param {Object} manager        SSDAI cue-range manager.   [was: Q]
 *   @param {Array} manager.HA    — undecoded range list       [was: HA]
 * @param {number} segmentNumber  Segment sequence number.    [was: c]
 * @returns {boolean}
 *
 * [was: g.iM]
 */
export function isInUndecodedRange(manager, segmentNumber) { // was: g.iM
  for (const range of manager.parseHexColor) { // was: W
    if (segmentNumber >= range.start && segmentNumber <= range.end) {
      return true; // was: !0
    }
  }
  return false; // was: !1
}

// ---------------------------------------------------------------------------
// Undecoded Segment Range Expansion  (line 53568)
// ---------------------------------------------------------------------------

/**
 * Extends or creates an undecoded-segment range entry for a segment that
 * could not be decoded.
 *
 * If the segment is already within an existing range, this is a no-op.
 * If it is exactly one past the end of an existing range, the range is
 * extended by one. Otherwise a new single-segment range is created.
 *
 * Skipped entirely for "unlimited" mode (`W === true`).
 *
 * @param {Object}  manager        SSDAI cue-range manager.   [was: Q]
 * @param {number}  segmentNumber  Segment sequence number.    [was: c]
 * @param {boolean} [isUnlimited=false]  Skip tracking.       [was: W]
 *
 * [was: Nm]
 */
export function expandUndecodedRange(manager, segmentNumber, isUnlimited = false) { // was: Nm
  if (!isUnlimited) {
    for (const range of manager.parseHexColor) { // was: m
      if (segmentNumber >= range.start && segmentNumber <= range.end) return;
      if (segmentNumber === range.end + 1) {
        range.end += 1;
        return;
      }
    }
    manager.parseHexColor.push(new ztw(segmentNumber));
  }
}

// ---------------------------------------------------------------------------
// Disable SSDAI  (line 53236)
// ---------------------------------------------------------------------------

/**
 * Disables server-stitched DAI for the current playback session.
 *
 * Before disabling:
 *   - Validates the segment via `findSegmentRecord` (if provided)
 *   - Resets the active ad-playback CPN counter and publishes
 *     `serverstitchedvideochange`
 *   - Delegates to the player's `Yr()` method with a reason payload
 *
 * @param {Object}  manager        SSDAI cue-range manager.           [was: Q]
 * @param {number}  [mediaTime]    Current media time (seconds).      [was: c]
 * @param {number}  [segmentNumber] Segment sequence number.          [was: W]
 * @param {Object}  [reason]       Disable reason payload.            [was: m]
 *                                 Defaults to `{ reason: "disablessdai" }`.
 * @param {*}       [extra]        Extra data forwarded to `Yr()`.    [was: K]
 * @returns {boolean}              `true` if SSDAI was successfully disabled.
 *
 * [was: pE]
 */
export function disableSsdai(manager, mediaTime, segmentNumber, reason, extra) { // was: pE
  reason = reason || { reason: 'disablessdai' };

  if (mediaTime && segmentNumber) {
    if (!findSegmentRecord(manager, mediaTime, segmentNumber)) { // was: !S1(Q, c, W)
      return false; // was: !1
    }
    reason.sq = segmentNumber;
  }

  if (manager.ol) return false;

  manager.ol = true; // was: !0

  if (manager.NR > 0) {
    manager.NR = 0;
    manager.getNFOffset = '';
    manager.forwardPlayback(manager.W.Sr(), 0);
    manager.api.publish('serverstitchedvideochange');
  }

  manager.W.Yr(reason, extra);
  return true; // was: !0
}

// ---------------------------------------------------------------------------
// Seek During Ad  (line 53256)
// ---------------------------------------------------------------------------

/**
 * Handles seeking while a server-stitched ad is playing.
 *
 * Saves the current player state, re-enables ad-segment processing,
 * delegates the seek to the player, and restores play/pause state
 * after the seek completes.
 *
 * @param {Object} manager    SSDAI cue-range manager.         [was: Q]
 * @param {number} seekTime   Target time in seconds.           [was: c]
 * @param {Object} seekOpts   Seek options forwarded to player. [was: W]
 *
 * [was: wvK]
 */
export function seekDuringAd(manager, seekTime, seekOpts) { // was: wvK
  const previousState = manager.toggleFineScrub || manager.app.oe().getPlayerState(); // was: m
  Fb(manager, true); // was: Fb(Q, !0) — reset ad state
  manager.W.seekTo(seekTime, seekOpts);

  const player = manager.app.oe(); // was: Q (reused)
  const newState = player.getPlayerState(); // was: c (reused)

  if (previousState.isOrWillBePlaying() && !newState.isOrWillBePlaying()) {
    player.playVideo();
  } else if (previousState.isPaused() && !newState.isPaused()) {
    player.pauseVideo();
  }
}

// ---------------------------------------------------------------------------
// Ad Fetch Timeout Logging  (line 53265)
// ---------------------------------------------------------------------------

/**
 * Logs the duration of an ad-fetch attempt with a timeout indicator.
 *
 * @param {Object} manager  SSDAI cue-range manager.  [was: Q]
 *
 * [was: ZC]
 */
export function logAdFetchTimeout(manager) { // was: ZC
  if (manager.JJ) {
    manager.reportTelemetry({
      adf: `0_${(new Date()).getTime() / 1000 - manager.d3}_isTimeout_${manager.L}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Skip-Over-Ad Detection  (line 53271)
// ---------------------------------------------------------------------------

/**
 * Checks whether a playback time range overlaps with any queued ad break.
 *
 * If an overlap is found and the ad break has not yet been added to the
 * `QE` (skipped-entries) list, logs an `adskip` event and appends the
 * break to `QE`. Returns the overlapping ad break descriptor if found.
 *
 * @param {Object} manager  SSDAI cue-range manager.         [was: Q]
 *   @param {Array} manager.Y   — completed ad break descriptors [was: Y]
 *   @param {Array} manager.QE  — skipped entries list            [was: QE]
 * @param {number} startMs  Range start in milliseconds.      [was: c]
 * @param {number} endMs    Range end in milliseconds.         [was: W]
 * @returns {Object|undefined}  Overlapping ad break descriptor.
 *
 * [was: bId]
 */
export function detectSkippedAdBreak(manager, startMs, endMs) { // was: bId
  if (manager.Y.length) {
    for (const adBreak of manager.Y) { // was: m
      const adStartMs = adBreak.startSecs * 1000; // was: K
      const adEndMs = adBreak.rejectedPromise * 1000 + adStartMs; // was: T

      if (
        (startMs > adStartMs && startMs < adEndMs) ||
        (endMs > adStartMs && endMs < adEndMs)
      ) {
        const alreadySkipped = Jy(manager.mainVideoEntityActionMetadataKey, (entry) => entry.identifier === adBreak.identifier); // was: inline
        if (!alreadySkipped) {
          manager.reportTelemetry({ adskip: startMs });
          manager.mainVideoEntityActionMetadataKey.push(adBreak);
        }
        return adBreak;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Cancel Ad Fetch  (line 53289)
// ---------------------------------------------------------------------------

/**
 * Cancels any in-progress ad-fetch timer and resets the fetch state.
 *
 * @param {Object} manager  SSDAI cue-range manager.  [was: Q]
 *   @param {boolean}      manager.L  — timeout-reached flag  [was: L]
 *   @param {Object}       manager.J  — fetch timer            [was: J]
 *
 * [was: HZ]
 */
export function cancelAdFetch(manager) { // was: HZ
  manager.L = false; // was: !1
  if (manager.J.isActive()) logAdFetchTimeout(manager); // was: ZC(Q)
  manager.J.stop();
  manager.clientHintsOverride(false); // was: !1
}

// ---------------------------------------------------------------------------
// Tile Context Key  (line 53296)
// ---------------------------------------------------------------------------

/**
 * Constructs a tile-context key string from a segment's metadata.
 *
 * When the `j1y` feature flag is active and the segment has `tileContext`,
 * appends it after a semicolon. Otherwise returns just `fK` (format key).
 *
 * @param {Object} manager    SSDAI cue-range manager.  [was: Q]
 * @param {Object} [segment]  Segment metadata.          [was: c]
 * @returns {string}          Context key string.
 *
 * [was: gZ0]
 */
export function buildTileContextKey(manager, segment) { // was: gZ0
  if (!segment) return '';
  return manager.FI.getExperimentFlags.W.BA(j1y) && segment?.tileContext
    ? `${segment?.fK};${segment?.tileContext}`
    : segment?.fK || '';
}

// ---------------------------------------------------------------------------
// Register Ad Playback  (line 53300)
// ---------------------------------------------------------------------------

/**
 * Creates a new ad-playback observation record and registers it with the
 * app's global history tracker.
 *
 * @param {Object} manager       SSDAI cue-range manager.            [was: Q]
 * @param {Object} videoData     Video data for the ad.               [was: c]
 * @param {Object} parentPlayer  The parent (content) player.         [was: W — reused as duration]
 * @param {number} durationMs    Duration of the ad in milliseconds.  [was: W]
 *
 * [was: f$0]
 */
export function registerAdPlayback(manager, videoData, parentPlayer, durationMs) { // was: f$0
  // Dispose any existing record for this CPN
  const existing = manager.app.stepGenerator().j[videoData.clientPlaybackNonce]; // was: inline
  existing?.dispose();

  const observation = new AdUxStateMetadata(videoData, manager.W, durationMs / 1000); // was: c (reused)
  manager.T2.set(observation.Sr(), observation);

  const history = manager.app.stepGenerator(); // was: Q (reused)
  history.j[observation.Sr()] = observation;
  history.K[observation.Sr()] = observation;
}

// ---------------------------------------------------------------------------
// Server-Stitched Video Change Debug Payload  (line 53309)
// ---------------------------------------------------------------------------

/**
 * Constructs a telemetry payload for SSDAI video-change events.
 *
 * @param {Object} manager       SSDAI cue-range manager.  [was: Q]
 * @param {string} changeType    Change type label (e.g. `"c2a"`, `"a2c"`).  [was: c]
 * @param {Object} [entry]       Playback entry (for CPN & video ID).        [was: W]
 * @returns {{ssvc:string, cpn:string, vid:string, ct:string, cmt:string}}
 *
 * [was: sD]
 */
export function buildVideoChangePayload(manager, changeType, entry) { // was: sD
  return {
    ssvc: changeType,
    cpn: entry?.cpn || '',
    vid: entry?.videoData.videoId || '',
    ct: (manager.W.getCurrentTime() || 0).toFixed(3),
    cmt: (manager.W.getTimeHead || 0).toFixed(3),
  };
}

// ---------------------------------------------------------------------------
// Cue Range Factory  (line 53319)
// ---------------------------------------------------------------------------

/**
 * Creates a new `g.C8` cue-range object for server-stitched ad tracking.
 *
 * Uses the `serverstitchedcuerange` namespace with priority 9.
 *
 * @param {number} startMs  Range start in milliseconds.   [was: Q]
 * @param {number} endMs    Range end in milliseconds.      [was: c]
 * @param {string} id       Cue-range identifier.           [was: W]
 * @returns {g.C8}          New cue-range instance.
 *
 * [was: vZ_]
 */
export function createSsdaiCueRange(startMs, endMs, id) { // was: vZ_
  return new CueRange(startMs, endMs, {
    id,
    namespace: 'serverstitchedcuerange',
    priority: 9,
  });
}

// ---------------------------------------------------------------------------
// Segment Enter Timing Log  (line 53327)
// ---------------------------------------------------------------------------

/**
 * Logs the timing of a server-stitched event relative to the ad entry
 * start time, used for "late join" detection.
 *
 * Only fires when the `html5_ssdai_log_ssevt_in_loader_timers` flag is
 * enabled. The `late` field measures how many milliseconds behind the
 * expected entry time the event occurred.
 *
 * @param {Object} manager      SSDAI cue-range manager.         [was: Q]
 * @param {string} cpn          Client playback nonce of the ad.  [was: c]
 * @param {number} entryStart   Expected entry start (seconds).   [was: W]
 * @param {number} actualTime   Actual event time (seconds).      [was: m]
 *
 * [was: de]
 */
export function logSegmentEntryTiming(manager, cpn, entryStart, actualTime) { // was: de
  if (manager.FI.X('html5_ssdai_log_ssevt_in_loader_timers')) {
    const lateMs = manager.mF ? 0 : Math.round((actualTime - entryStart) * 1000); // was: m (reused)
    manager.W.RetryTimer('ssevt', {
      tag: 'sstme',
      ad: cpn !== manager.W.Sr(),
      cpn,
      st: (entryStart - manager.W.publishCueRangeEvent()).toFixed(3),
      late: lateMs,
    });
  }
}

// ---------------------------------------------------------------------------
// Segment Transition Handler  (line 53338)
// ---------------------------------------------------------------------------

/**
 * Processes a transition between two server-stitched playback segments.
 *
 * Handles three transition types:
 *   - **content-to-ad** (`playerType 1 -> 2`): resets ad count, increments
 *     `NR`, logs `c2a`, publishes `serverstitchedvideochange`
 *   - **ad-to-content** (`playerType 2 -> 1`): publishes
 *     `serverstitchedvideochange`, logs `a2c`, resets `NR`, records exit time
 *   - **ad-to-ad** (`playerType 2 -> 2`): delegates to `handleAdToAdTransition`
 *
 * Ignores no-op transitions where entering CPN equals `iU`.
 * After processing, calls the player's `eV()` method and resets
 * seek/skip flags via `PO7`.
 *
 * @param {Object} manager     SSDAI cue-range manager.         [was: Q]
 * @param {Object} transition  Transition descriptor.            [was: c]
 *   @param {Object} transition.OT  — exiting playback entry    [was: OT]
 *   @param {Object} transition.Wm  — entering playback entry   [was: Wm]
 *   @param {number} transition.ww  — current media time         [was: ww]
 *   @param {*}      transition.AZ  — aggregated break info      [was: AZ]
 *
 * [was: we]
 */
export function handleSegmentTransition(manager, transition) { // was: we
  if (!manager.j && !manager.mF) {
    updateAdProgressTime(manager, manager.getNFOffset); // was: Lt(Q, Q.iU)
  }

  const exitEntry = transition.OT;  // was: W
  const enterEntry = transition.Wm; // was: m

  if (enterEntry.cpn === manager.getNFOffset) {
    manager.reportTelemetry({
      igtranssame: 1,
      enter: enterEntry.cpn,
      exit: exitEntry.cpn,
    });
    return;
  }

  const wasSeeking = manager.mF;    // was: K
  const wasSkipping = !!manager.j;   // was: T
  manager.j = '';

  const currentMediaTime = transition.setExpiryTimer; // was: r
  const parentReturnTime = // was: U
    exitEntry.playerType === 2
      ? exitEntry.CX / 1000 + exitEntry.videoData.readRepeatedMessageField
      : manager.findChildBox().videoData.readRepeatedMessageField;

  // Media-end cue-range handling
  if (manager.api.X('html5_ssdai_enable_media_end_cue_range')) {
    if (!wasSkipping && !wasSeeking && exitEntry.playerType === 2) {
      // Normal ad end — no flags
    } else if (wasSeeking || wasSkipping) {
      manager.reportTelemetry({
        mecr: 0,
        seek: wasSeeking,
        skip: wasSkipping,
      });
    }
    if (!wasSkipping && !wasSeeking && exitEntry.playerType === 2) {
      manager.api.WS(exitEntry.cpn);
    }
  }

  if (exitEntry.playerType === 2 && enterEntry.playerType === 2) {
    // Ad-to-ad transition
    if (wasSkipping) {
      manager.reportTelemetry({
        igtransskip: 1,
        enter: enterEntry.cpn,
        exit: exitEntry.cpn,
        seek: wasSeeking,
        skip: manager.j,
      });
    } else {
      handleAdToAdTransition(manager, exitEntry, enterEntry, parentReturnTime, currentMediaTime, wasSeeking, wasSkipping); // was: a$X
    }
  } else {
    // Content-to-ad or ad-to-content
    manager.getNFOffset = enterEntry.cpn;
    manager.forwardPlayback(enterEntry.cpn, enterEntry.startTimeSecs || currentMediaTime);

    const aggregatedInfo = transition.DeferredValue; // was: c (reused)

    if (exitEntry.playerType === 1 && enterEntry.playerType === 2) {
      // Content-to-ad
      manager.Ie = 0;
      Gwd(manager, enterEntry);
      const payload = buildVideoChangePayload(manager, 'c2a', enterEntry); // was: I = sD(Q, "c2a", m)
      manager.reportTelemetry(payload);
      manager.NR++;
    } else if (exitEntry.playerType === 2 && enterEntry.playerType === 1) {
      // Ad-to-content
      manager.api.publish('serverstitchedvideochange');
      const payload = buildVideoChangePayload(manager, 'a2c'); // was: I = sD(Q, "a2c")
      manager.reportTelemetry(payload);
      manager.NR = 0;
      manager.Ie = parentReturnTime;

      // Update exit observation end time
      const exitCpn = exitEntry.cpn;   // was: I (reused)
      const exitTime = manager.Ie;      // was: X
      if (exitCpn !== manager.W.Sr()) {
        const observation = manager.T2.get(exitCpn); // was: A
        if (observation) {
          observation.W = exitTime;
        } else {
          manager.reportTelemetry({ nop_e: exitCpn });
        }
      }

      manager.removeAdBreakCueRanges(exitEntry.OE);
    }

    const breakInfo = collectAdBreakInfo(manager); // was: I = $Yn(Q)
    manager.W.eV(exitEntry, enterEntry, parentReturnTime, currentMediaTime, wasSeeking, wasSkipping, aggregatedInfo, breakInfo);
  }

  resetTransitionFlags(manager); // was: PO7(Q)
}

// ---------------------------------------------------------------------------
// Ad-to-Ad Transition  (line 53703)
// ---------------------------------------------------------------------------

/**
 * Handles a transition between two ad segments within the same ad break.
 *
 * Updates the active CPN, logs `a2a` telemetry, increments the ad-break
 * counter, and delegates to the player's `eV()` method.
 *
 * @param {Object} manager           SSDAI cue-range manager.   [was: Q]
 * @param {Object} exitEntry         Exiting ad entry.           [was: c]
 * @param {Object} enterEntry        Entering ad entry.          [was: W]
 * @param {number} parentReturnTime  Parent return time (s).     [was: m]
 * @param {number} currentMediaTime  Current media time (s).     [was: K]
 * @param {boolean} wasSeeking       Whether a seek was active.  [was: T]
 * @param {boolean} wasSkipping      Whether a skip was active.  [was: r]
 *
 * [was: a$X]
 */
export function handleAdToAdTransition(manager, exitEntry, enterEntry, parentReturnTime, currentMediaTime, wasSeeking, wasSkipping) { // was: a$X
  if (exitEntry && enterEntry) {
    manager.getNFOffset = enterEntry.cpn;
    manager.forwardPlayback(enterEntry.cpn, enterEntry.startTimeSecs || currentMediaTime);
    Gwd(manager, enterEntry);

    const payload = buildVideoChangePayload(manager, 'a2a', enterEntry); // was: U
    manager.reportTelemetry(payload);
    manager.NR++;

    const breakInfo = collectAdBreakInfo(manager); // was: U (reused)
    manager.W.eV(
      exitEntry,
      enterEntry,
      parentReturnTime || 0,
      currentMediaTime || 0,
      !!wasSeeking,
      !!wasSkipping,
      undefined,
      breakInfo,
    );
  } else {
    manager.reportTelemetry({
      misspbkonadtrans: 1,
      enter: enterEntry?.cpn || '',
      exit: exitEntry?.cpn || '',
      seek: wasSeeking,
      skip: wasSkipping,
    });
  }
}

// ---------------------------------------------------------------------------
// Collect Ad Break Info  (line 53667)
// ---------------------------------------------------------------------------

/**
 * Aggregates ad-break metadata from the global history tracker for
 * inclusion in transition payloads.
 *
 * Collects:
 *   - Creative IDs (`AI`) and content IDs (`GN`, `BP`)
 *   - CPNs, video IDs, ad formats
 *   - Serialized QoE context data
 *
 * Only runs when `Y0` (creative info) or `Xw` (QoE context) flags are set.
 *
 * @param {Object} manager  SSDAI cue-range manager.  [was: Q]
 * @returns {{aZ: Object|undefined, QJ: Object|undefined}|undefined}
 *
 * [was: $Yn]
 */
export function collectAdBreakInfo(manager) { // was: $Yn
  if (!manager.Y0 && !manager.Xw) return undefined;

  const observations = Array.from(manager.app.stepGenerator().L.values()); // was: c
  const creativeIds = [];       // was: W
  const contentIds = [];        // was: m
  const qoeContexts = [];      // was: K
  const cpns = [];              // was: T
  const videoIds = [];          // was: r
  const adFormats = [];         // was: U

  for (const obs of observations) { // was: I
    const entry = manager.O.uX(obs.Sr()); // was: c (reused)
    if (entry) {
      if (entry.AI) creativeIds.push(entry.AI);
      if (entry.GN) contentIds.push(entry.GN);
      if (entry.unlockTrackSegment) contentIds.push(entry.unlockTrackSegment);
      cpns.push(entry.cpn);
      videoIds.push(entry.videoData.videoId || '');
      adFormats.push(entry.videoData.adFormat || entry.videoData.Fw);
      if (entry.serializedQoeContextData != null) {
        qoeContexts.push(entry.serializedQoeContextData);
      }
    }
  }

  let creativeInfo;  // was: c (reused), I
  let qoeInfo;       // was: I

  if (manager.Y0) {
    creativeInfo = { AI: creativeIds, J6: contentIds };
  }
  if (manager.Xw) {
    qoeInfo = {
      Fg: cpns,
      wZ: videoIds,
      adFormats,
      serializedQoeContextData: qoeContexts,
    };
  }

  return { aZ: creativeInfo, QJ: qoeInfo };
}

// ---------------------------------------------------------------------------
// Reset Transition Flags  (line 53723)
// ---------------------------------------------------------------------------

/**
 * Resets the seek-skip tracking flags after a transition is processed.
 *
 * @param {Object} manager  SSDAI cue-range manager.  [was: Q]
 *
 * [was: PO7]
 */
export function resetTransitionFlags(manager) { // was: PO7
  manager.instreamAdPlayerOverlayRenderer.add(manager.j);
  manager.j = '';
  manager.mF = false; // was: !1
}

// ---------------------------------------------------------------------------
// Update Ad Progress Time  (line 53414)
// ---------------------------------------------------------------------------

/**
 * Records the current media time as the ad playback's `iX` (elapsed
 * progress) for the given CPN.
 *
 * If the CPN matches a known child-playback entry, computes the elapsed
 * time relative to the entry's `E8` or `A.get(cpn).start` field.
 * Otherwise updates the content (parent) video data's `iX` with the
 * raw player time.
 *
 * @param {Object} manager  SSDAI cue-range manager.           [was: Q]
 * @param {string} [cpn]    Client playback nonce to update.   [was: c]
 *
 * [was: Lt]
 */
export function updateAdProgressTime(manager, cpn) { // was: Lt
  const targetCpn = cpn || manager.getNFOffset; // was: W
  const entry = manager.O.uX(targetCpn); // was: m

  if (entry) {
    const videoData = entry.videoData; // was: c (reused)
    const startTime = entry.renderAdText || (manager.A.get(targetCpn)?.start ?? 0) / 1000; // was: W (reused)
    const elapsed = manager.W.getCurrentTime() - startTime; // was: Q (reused)
    videoData.readRepeatedMessageField = elapsed > 0 ? elapsed : 0;
  } else {
    manager.findChildBox().videoData.readRepeatedMessageField = manager.W.getCurrentTime();
  }
}

// ---------------------------------------------------------------------------
// Time-Based Lookup Helper  (line 53407)
// ---------------------------------------------------------------------------

/**
 * Wraps the `yW_` function to look up a child-playback entry by time.
 *
 * @param {Object} manager       SSDAI cue-range manager.              [was: Q]
 * @param {number} timeSec       Time in seconds.                       [was: c]
 * @param {number} [toleranceSec=0]  Tolerance in seconds.             [was: W]
 * @returns {{wW: Object|undefined, TW: number}}
 *
 * [was: bM]
 */
export function lookupByTime(manager, timeSec, toleranceSec = 0) { // was: bM
  return {
    isServerStitchedDai: findSegmentByMediaTime(manager.O, timeSec * 1000, toleranceSec * 1000), // was: yW_(Q.O, c * 1E3, W * 1E3)
    TW: timeSec,
  };
}

// ---------------------------------------------------------------------------
// Full State Reset  (line 53455)
// ---------------------------------------------------------------------------

/**
 * Completely resets all SSDAI cue-range manager state for a new video
 * load. Clears all maps, sets, arrays, and counters. Cancels any
 * in-progress ad fetch and resets the global history tracker.
 *
 * @param {Object} manager  SSDAI cue-range manager.  [was: Q]
 *
 * [was: hty]
 */
export function resetAllState(manager) { // was: hty
  manager.S.clearAll();
  manager.A.clear();
  manager.O.clear();
  manager.v5.clear();
  manager.parseHexColor = [];
  manager.D = null;
  manager.EXP_748402147.clear();
  manager.UH.clear();
  manager.Y = [];
  manager.PA = [];
  manager.mainVideoEntityActionMetadataKey = [];
  manager.nO = [];
  manager.SLOT_MESSAGE_MARKER.clear();
  manager.isCompressedDomainComposite.clear();
  manager.u3.clear();
  manager.instreamAdPlayerOverlayRenderer.clear();
  manager.L = false;  // was: !1
  manager.Ie = 0;
  manager.mF = false; // was: !1
  manager.XI = false;  // was: !1
  manager.NR = 0;
  manager.applyQualityConstraint = 0;
  manager.isTvHtml5Exact = false;  // was: !1
  manager.ol = false;  // was: !1
  manager.j = '';
  clearSecondaryPresenters(manager.app.stepGenerator());
  registerSecondaryPresenter(manager.app.stepGenerator(), manager.W, false); // was: !1
  manager.T2.clear();

  if (manager.J.isActive()) cancelAdFetch(manager); // was: HZ(Q)
}

// ---------------------------------------------------------------------------
// Clear Active Cue Ranges  (line 53487)
// ---------------------------------------------------------------------------

/**
 * Removes all child-playback entries whose enter/return times span
 * the full timeline (`CX >= -1` and `yz <= Infinity`), effectively
 * clearing any active ad cue ranges.
 *
 * @param {Object} manager  SSDAI cue-range manager.  [was: Q]
 *
 * [was: uZ7]
 */
export function clearActiveCueRanges(manager) { // was: uZ7
  removeSegmentEntries(manager.O, (entry) => entry.CX >= -1 && entry.yz <= Infinity); // was: c => c.CX >= -1 && c.yz <= Infinity
}

// ---------------------------------------------------------------------------
// Update Child Playback Duration  (line 53491)
// ---------------------------------------------------------------------------

/**
 * Updates the duration and return-time of a child-playback entry.
 * Also updates the corresponding observation record in the history
 * tracker. Logs `nop_d` if no observation exists.
 *
 * @param {Object} manager      SSDAI cue-range manager.  [was: Q]
 * @param {Object} entry        Child-playback entry.      [was: c]
 * @param {number} durationMs   New duration (ms).         [was: W]
 * @param {number} returnTimeMs New parent return time (ms). [was: m]
 *
 * [was: j1]
 */
export function updateChildPlaybackDuration(manager, entry, durationMs, returnTimeMs) { // was: j1
  entry.durationMs = durationMs;
  entry.yz = returnTimeMs;

  const observation = manager.T2.get(entry.cpn); // was: m (reused)
  if (observation) {
    observation.ly(durationMs / 1000);
  } else {
    manager.reportTelemetry({ nop_d: entry.cpn });
  }
}

// ---------------------------------------------------------------------------
// Remove All Cue Ranges  (line 53660)
// ---------------------------------------------------------------------------

/**
 * Removes every cue range tracked in the manager's `A` map from the
 * player, then clears both the map and the scheduled-set `S`.
 *
 * @param {Object} manager  SSDAI cue-range manager.  [was: Q]
 *   @param {Map}    manager.A — cue-range map         [was: A]
 *   @param {Object} manager.S — scheduled ad set      [was: S]
 *
 * [was: RtK]
 */
export function removeAllCueRanges(manager) { // was: RtK
  for (const cueRange of manager.A.values()) {
    manager.W.removeCueRange(cueRange);
  }
  manager.A.clear();
  manager.S.clearAll();
}

// ---------------------------------------------------------------------------
// Decorated Ad CPN Logging  (line 53625)
// ---------------------------------------------------------------------------

/**
 * Iterates through child-playback entries for a given ad-break ID and
 * logs each CPN that has a non-zero duration (i.e. is a real ad, not a
 * placeholder), starting from the entry matching `startCpn`.
 *
 * @param {Object} manager    SSDAI cue-range manager.     [was: Q]
 * @param {string} startCpn   CPN from which to begin.     [was: c]
 * @param {string} adBreakId  Ad-break identifier.          [was: W]
 *
 * [was: COn]
 */
export function logDecoratedAdCpns(manager, startCpn, adBreakId) { // was: COn
  let found = false; // was: m
  const entries = manager.O.W.get(adBreakId); // was: W (reused)
  if (!entries) return;

  for (const entry of entries) { // was: K
    if (entry.durationMs === 0 || entry.yz === entry.CX) continue;

    const cpn = entry.cpn; // was: W (reused)
    if (startCpn === cpn) found = true; // was: m = !0

    if (found && !manager.isCompressedDomainComposite.has(cpn)) {
      manager.reportTelemetry({ decoratedAd: cpn });
      manager.isCompressedDomainComposite.add(cpn);
    }
  }
}

// ---------------------------------------------------------------------------
// Ad Position Within Break  (line 53637)
// ---------------------------------------------------------------------------

/**
 * Returns the zero-based position of a CPN within its ad-break group.
 * Returns -1 if the CPN or ad-break ID is not found.
 *
 * @param {Object} manager    SSDAI cue-range manager.  [was: Q]
 * @param {string} cpn        Client playback nonce.     [was: c]
 * @param {string} adBreakId  Ad-break identifier.       [was: W]
 * @returns {number}          Position (0-based), or -1.
 *
 * [was: M8O]
 */
export function getAdPositionInBreak(manager, cpn, adBreakId) { // was: M8O
  let index = 0; // was: m
  const entries = manager.O.W.get(adBreakId); // was: Q (reused)
  if (!entries) return -1;

  for (const entry of entries) { // was: K
    if (entry.cpn === cpn) return index;
    index++;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Ad Count Within Break  (line 53650)
// ---------------------------------------------------------------------------

/**
 * Returns the number of non-empty ad entries within an ad-break group.
 * An entry is considered non-empty when `durationMs !== 0` and
 * `yz !== CX` (return time differs from enter time).
 *
 * @param {Object} manager    SSDAI cue-range manager.  [was: Q]
 * @param {string} adBreakId  Ad-break identifier.       [was: c]
 * @returns {number}          Count of real ads in the break.
 *
 * [was: JWX]
 */
export function getAdCountInBreak(manager, adBreakId) { // was: JWX
  let count = 0; // was: W
  const entries = manager.O.W.get(adBreakId); // was: Q (reused)
  if (!entries) return 0;

  for (const entry of entries) { // was: m
    if (entry.durationMs !== 0 && entry.yz !== entry.CX) {
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Last-Ad-In-Break Tail Duration  (line 53729)
// ---------------------------------------------------------------------------

/**
 * Returns a 1-second tail duration if the given CPN is the last ad in
 * an E7 (encrypted) break, and the track type is 2 (video). Otherwise
 * returns 0.
 *
 * This is used to extend the cue-range window so the player can detect
 * the transition back to content slightly before the ad actually ends.
 *
 * @param {Object} manager    SSDAI cue-range manager.  [was: Q]
 * @param {string} cpn        Client playback nonce.     [was: c]
 * @param {number} trackType  Track type enum.           [was: W]
 * @returns {number}          Tail duration in ms (0 or 1000).
 *
 * [was: kwO]
 */
export function getLastAdTailDuration(manager, cpn, trackType) { // was: kwO
  let isLastInBreak; // was: m
  if (isLastInBreak = manager.W.getVideoData().listenOnce()) {
    const entry = manager.O.uX(cpn); // was: m (reused)
    isLastInBreak = entry && entry.OE
      ? ((entries) => entries && entries.slice(-1)[0].cpn === cpn)(manager.O.W.get(entry.OE))
      : false; // was: !1
  }
  return isLastInBreak && trackType === 2 ? 1000 : 0;
}

// ---------------------------------------------------------------------------
// Emit Transition  (line 53736)
// ---------------------------------------------------------------------------

/**
 * Constructs a transition descriptor from exit/enter entries and the
 * current media time, then delegates to `handleSegmentTransition`.
 *
 * @param {Object} manager      SSDAI cue-range manager.          [was: Q]
 * @param {Object} exitEntry    Exiting playback entry.            [was: c]
 * @param {Object} enterEntry   Entering playback entry.           [was: W]
 * @param {*}      breakInfo    Aggregated ad break metadata.      [was: m]
 *
 * [was: Yn_]
 */
export function emitTransition(manager, exitEntry, enterEntry, breakInfo) { // was: Yn_
  const transition = {
    OT: exitEntry,         // was: c
    Wm: enterEntry,        // was: W
    setExpiryTimer: manager.W.getCurrentTime(), // was: Q.W.getCurrentTime()
    DeferredValue: breakInfo,         // was: m
  };
  handleSegmentTransition(manager, transition); // was: we(Q, c)
}
