/**
 * DAI (Dynamic Ad Insertion) Cue Range Manager
 *
 * Source: player_es6.vflset/en_US/base.js, lines 117000–117773
 *
 * Contains:
 *  - DAI cue range manager class with Set-based tracking
 *    (Hw, PA, QE, nO for processed/pending ad break identifiers)
 *  - Logging via `g.JY("dai")` logger
 *  - CueRange lifecycle callbacks:
 *    s$0 (get cue range map), HH (get parent handler),
 *    SGF (get skip ad CPN), UIA (enter), XJJ (exit),
 *    OUI (register), jgI (set active CPN)
 *  - Segment entry/exit with impression/start time tracking
 *  - Ad timeline management (overlapping playback detection, ad break scheduling)
 *  - Skip-ad flow with seek and media-end cue range
 *  - SSDAI transition detection (new vs legacy cue-range mode)
 *  - URL construction for ad segments with acpns, daistate, skipsq params
 *  - Error/telemetry reporting via PB (tJ "sdai")
 *
 * @module ads/dai-cue-range
 */

import { generateRandomBase64 } from '../data/gel-core.js';  // was: g.Ab
import { pauseVideo } from '../player/player-events.js';  // was: g.pauseVideo
import { serializeMessage } from '../proto/message-setup.js';  // was: g.mg
import { findOverlappingAdCuepoint } from './ad-prebuffer.js'; // was: bId
import { reportTelemetry } from './dai-cue-range.js'; // was: PB
import { SYM_WRAP } from '../proto/message-setup.js'; // was: wG
import { forwardAdCommand } from './ad-prebuffer.js'; // was: ED
import { getSeekableRangeStart } from '../player/time-tracking.js'; // was: bC()
import { findSegmentByEndTime } from './ad-prebuffer.js'; // was: EZn
import { cancelAdFetch } from './ad-prebuffer.js'; // was: HZ
import { insertSegmentEntry } from './ad-prebuffer.js'; // was: FIR
import { buildTileContextKey } from './ad-prebuffer.js'; // was: gZ0
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { createAdPlaybackOverlay } from './ad-prebuffer.js'; // was: f$0
import { ElementGeometryObserver } from '../data/module-init.js'; // was: et
import { logAdFetchTimeout } from './ad-prebuffer.js'; // was: ZC
import { clientHintsOverride } from '../proto/messages-core.js'; // was: Sf
import { garbageCollectCueRanges } from './dai-cue-range.js'; // was: Ks
import { getTimeHead } from '../player/time-tracking.js'; // was: TH()
import { getNFOffset } from './ad-async.js'; // was: iU
import { findChildBox } from '../media/format-setup.js'; // was: Rl
import { setExpiryTimer } from '../core/event-registration.js'; // was: ww
import { logSegmentEntryTiming } from './ad-cue-delivery.js'; // was: de
import { handleSegmentTransition } from './ad-cue-delivery.js'; // was: we
import { stepGenerator } from './ad-async.js'; // was: GH
import { renderAdText } from '../data/collection-utils.js'; // was: E8
import { listenOnce } from '../core/composition-helpers.js'; // was: E7
import { registerSecondaryPresenter } from './ad-prebuffer.js'; // was: Ih
import { initSegmentEntry } from './ad-prebuffer.js'; // was: iI7
import { updateAdProgressTime } from './ad-cue-delivery.js'; // was: Lt
import { seekDuringAd } from './ad-cue-delivery.js'; // was: wvK
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { resetAllState } from './ad-cue-delivery.js'; // was: hty
import { findSegmentByMediaTime } from './ad-cue-delivery.js'; // was: OD
import { findSegmentRecord } from './ad-cue-delivery.js'; // was: S1
import { removeAllCueRanges } from './ad-cue-delivery.js'; // was: RtK
import { handleAdToAdTransition } from './ad-cue-delivery.js'; // was: a$X
import { resetTransitionFlags } from './ad-cue-delivery.js'; // was: PO7
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { removeAdBreakCueRanges } from './dai-cue-range.js'; // was: M9
import { notifyTimeline } from '../player/state-init.js'; // was: Yn_
import { MetricCondition } from '../data/module-init.js'; // was: X_
import { recordPlaybackStartTiming } from '../player/video-loader.js'; // was: b2
import { removeSegmentEntry } from './ad-prebuffer.js'; // was: s10
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { getDuration, getCurrentTime } from '../player/time-tracking.js';
import { splice, clear } from '../core/array-utils.js';
import { getPlayerResponse } from '../player/player-api.js';
import { VideoData } from '../data/device-platform.js';
// TODO: resolve g.h
// TODO: resolve g.lB

// ---------------------------------------------------------------------------
// SsdaiCueRangeManager constructor fields  (lines 117000–117071)
// ---------------------------------------------------------------------------

/**
 * SSDAI (Server-Stitched DAI) cue range manager.
 *
 * Tracks ad playback segments stitched into the main content stream.
 * Uses cue ranges to detect when the player enters/exits ad content,
 * manages ad CPN (client playback nonce) assignment, and coordinates
 * with the ad timeline for seeking and skipping.
 *
 * Key fields:
 *  - `this.D`          — current ad break descriptor [was: D]
 *  - `this.Hw`         — Set of ad break ids that sent "noad" signal [was: Hw]
 *  - `this.Y`          — Array of completed ad break descriptors [was: Y]
 *  - `this.PA`         — Array of confirmed ad playbacks [was: PA]
 *  - `this.QE`         — Array of cue-range entries pending processing [was: QE]
 *  - `this.nO`         — Array of rejected ad break ids [was: nO]
 *  - `this.UH`         — Set of scheduled ad break identifiers [was: UH]
 *  - `this.Ww`         — Set of ad CPNs seen from emsg [was: Ww]
 *  - `this.gA`         — Set of ad CPNs from cue-range tracking [was: gA]
 *  - `this.u3`         — Set of ad break ids already impression-logged [was: u3]
 *  - `this.Re`         — Set of ad CPNs in skip state [was: Re]
 *  - `this.logger`     — Logger instance via `g.JY("dai")` [was: logger]
 *  - `this.jG`         — Map<adBreakId, Set<cpn>> for live transition tracking [was: jG]
 *  - `this.MQ`         — Map<cpn, adBreakId> reverse lookup [was: MQ]
 *  - `this.O`          — Ad timeline instance (IJ4) [was: O]
 *  - `this.Rk`         — Callback interface object [was: Rk]
 *
 * [was: anonymous class — SSDAI cue range manager]
 *
 * @class SsdaiCueRangeManager
 */

// ---------------------------------------------------------------------------
// Rk — Callback interface  (lines 117022–117054)
// ---------------------------------------------------------------------------

/**
 * The `Rk` object exposes callbacks used by the ad timeline and ad layout:
 *
 *  - `s$0()`       → returns `this.A` (cue range Map)            [was: s$0]
 *  - `HH()`        → delegates to `this.O.Rk.HH()` (parent)     [was: HH]
 *  - `SGF()`       → returns `this.j` (skip-ad CPN)              [was: SGF]
 *  - `UIA(cpn)`    → calls `this.onCueRangeEnter(this.A.get(cpn))` [was: UIA]
 *  - `XJJ(cpn)`    → calls `this.onCueRangeExit(this.A.get(cpn))`  [was: XJJ]
 *  - `OUI(k, v)`   → calls `this.A.set(k, v)`                   [was: OUI]
 *  - `jgI(cpn)`    → sets `this.iU = cpn` (active ad CPN)        [was: jgI]
 *  - `Rl()`        → returns the content (non-ad) timeline entry  [was: Rl]
 *  - `dI0(key)`    → lookups from `this.O.W.get(key)`            [was: dI0]
 *  - `YG0()`       → returns `this.b0` (skip progress listener)  [was: YG0]
 *  - `gk()`        → delegates to `this.O.Rk.gk()`              [was: gk]
 *  - `Ls(cpn, t)`  → calls `this.Ls(cpn, t)`                    [was: Ls]
 *  - `bxF()`       → returns `this.qQ` (decoration map)          [was: bxF]
 *  - `M9(abid)`    → calls `this.M9(abid)` (remove ad break)    [was: M9]
 *
 * @typedef {Object} SsdaiCallbackInterface
 */

// ---------------------------------------------------------------------------
// Constructor body  (lines 117055–117071)
// ---------------------------------------------------------------------------

/**
 * After setting up fields and the Rk interface, the constructor:
 *
 * 1. Calls `this.W.getPlayerType()` to warm caches
 * 2. Creates the ad timeline: `this.O = new IJ4(this.FI)` [was: IJ4]
 * 3. Registers with the player: `this.W.Zx(this)` [was: Zx]
 * 4. Stores logging flag: `this.JJ = this.FI.cB()` [was: JJ, cB — is debug]
 * 5. Configures experiment flags:
 *    - `this.U7` = html5_use_new_ssdai_transition_detector [was: U7]
 *    - `this.Y0` = transition threshold from config (P4_) [was: Y0]
 *    - For live+NORMAL latency, overrides Y0 with lbm config [was: lbm]
 *    - `this.Xw` = serialized QoE context data flag (PNd) [was: Xw]
 *    - `this.w6` = video data mM (decoration mode) [was: w6]
 * 6. If new transition detector (U7): subscribes to "playbackstarted"
 *    Otherwise: subscribes to cue range enter/exit events
 * 7. `this.dA` = skip-ad-after-error flag [was: dA]
 * 8. Calls `Ih(this.app.GH(), this.W, false)` [was: Ih — init heartbeat]
 */

// ---------------------------------------------------------------------------
// Rt — Register Ad Timeline Playback  (lines 117073–117178)
// ---------------------------------------------------------------------------

/**
 * Register a new ad playback segment into the SSDAI timeline.
 *
 * Validates the segment timing (enter < return, within seekable range,
 * no overlapping playbacks). Creates a `g.Od` (video data) instance for
 * the ad, inserts it into the timeline via `FIR`, and starts playback
 * transition if the seek timer was active.
 *
 * For live streams with new transition detector, maintains `jG` / `MQ`
 * maps linking CPNs to ad break IDs.
 *
 * [was: Rt] (line 117073)
 *
 * @param {object}  playerVars      - Ad player vars [was: Q]
 * @param {object}  ssdaiAdsConfig  - SSDAI ads config (null if missing) [was: c]
 * @param {number}  playerType      - Player type enum [was: W]
 * @param {number}  durationMs      - Ad duration in milliseconds [was: m]
 * @param {number}  enterTimeMs     - Enter time in content timeline (ms) [was: K]
 * @param {number}  returnTimeMs    - Return time after ad (ms) [was: T]
 * @param {string}  adBreakId       - Ad break identifier [was: r]
 * @param {object}  decorationInfo  - Decoration / overlay info [was: U]
 * @returns {g.Od|undefined} The created VideoData, or undefined on rejection
 */
export function registerAdTimelinePlayback( // was: Rt (line 117073)
  self, playerVars, ssdaiAdsConfig, playerType, durationMs,
  enterTimeMs, returnTimeMs, adBreakId, decorationInfo,
) {
  let existingEntry = findOverlappingAdCuepoint(self, enterTimeMs, enterTimeMs + durationMs); // was: I, bId

  // Log if ad added after timeout
  if (self.L) {
    self.reportTelemetry({ adaftto: 1 });
  }

  // Log missing ads config
  if (!ssdaiAdsConfig) {
    self.reportTelemetry({
      missadcon: 1,
      enter: enterTimeMs,
      len: durationMs,
      aid: adBreakId,
    });
  }

  // Track first ad break id
  if (self.K && !self.K.SYM_WRAP) {
    self.K.SYM_WRAP = adBreakId; // was: wG — first ad break id for cuepoint
  }

  // Log fallback ad
  if (self.ol) { // was: ol — DAI disabled flag
    self.reportTelemetry({
      adfbk: 1,
      enter: enterTimeMs,
      len: durationMs,
      aid: adBreakId,
    });
  }

  const player = self.W; // was: X (assigned from self.W)

  // Validation: enterTime > returnTime
  if (enterTimeMs > returnTimeMs) {
    forwardAdCommand(self, { // was: ED — report stitch error
      reason: "enterTime_greater_than_return",
      CX: enterTimeMs,
      yz: returnTimeMs,
    });
  }

  // Validation: enterTime < minSeekableTime
  let minSeekableTimeMs = player.getSeekableRangeStart * 1000; // was: A, bC — min seekable time
  if (enterTimeMs < minSeekableTimeMs) {
    forwardAdCommand(self, {
      reason: "enterTime_less_than_minSeekableTime",
      enterMs: enterTimeMs,
      minSkMs: minSeekableTimeMs,
    }, false);
  }

  // Validation: returnTime > content duration
  const contentDurationMs = player.getDuration() * 1000; // was: X (reused)
  if (returnTimeMs > contentDurationMs) {
    forwardAdCommand(self, {
      reason: "parent_return_greater_than_content_duration",
      yz: returnTimeMs,
      GHa: contentDurationMs,
    });
  }

  // Check for overlapping playbacks
  const overlapping = findSegmentByEndTime(self.O, enterTimeMs); // was: X (reused), EZn
  if (overlapping && overlapping.yz > enterTimeMs) {
    forwardAdCommand(self, {
      reason: "overlapping_playbacks",
      HrC: playerVars.video_id || "",
      CX: enterTimeMs,
      yz: returnTimeMs,
      q72: overlapping.cpn,
      DIF: overlapping.videoData?.videoId || "",
      rA2: overlapping.durationMs,
      uqa: overlapping.CX,
      hKe: overlapping.yz,
    });
  }

  // Handle existing entry with overlap
  if (existingEntry && overlapping) {
    for (let i = 0; i < self.Y.length; i++) { // was: A
      if (self.Y[i].identifier === existingEntry.identifier) {
        self.Y.splice(i, 1);
        break;
      }
    }
  } else if (existingEntry) {
    // Reject: duplicate attach-to-timeline
    self.reportTelemetry({ rejectAttl: 1 });
    if (adBreakId && !Jy(self.nO, (e) => e === adBreakId)) { // was: Jy — find in array
      self.reportTelemetry({ rejectAdBreakAttl: adBreakId }, true);
      self.nO.push(adBreakId);
    }
    cancelAdFetch(self); // was: HZ — handle rejection
    return;
  }

  // Assign CPN if missing
  if (!playerVars.cpn) {
    playerVars.cpn = generateRandomBase64(16); // was: g.Ab — random string
  }
  const cpn = playerVars.cpn; // was: I (reused)

  // Create VideoData for the ad
  const videoData = new VideoData(self.FI, playerVars); // was: Q (reused)
  videoData.yu = true; // was: yu — is SSDAI ad
  videoData.PJ = videoData.clientPlaybackNonce; // was: PJ — playback nonce

  const adBreakKey = adBreakId ? adBreakId : overlapping ? overlapping.OE : cpn; // was: X (reused)

  // Build timeline entry
  const timelineEntry = { // was: c (reused)
    playerType,
    durationMs,
    CX: enterTimeMs, // was: CX — enter time
    yz: returnTimeMs, // was: yz — return time
    cpn,
    videoData,
    errorCount: 0,
    ssdaiAdsConfig,
    OE: adBreakKey, // was: OE — ad break key
  };

  // Attach serialized QoE context if enabled
  const playbackTracking = videoData.getPlayerResponse()?.playbackTracking; // was: W (reused)
  if (self.Xw) {
    timelineEntry.serializedQoeContextData = playbackTracking?.serializedQoeContextData;
  }

  // Attach playback ping context if enabled
  if (self.Y0) {
    const serializedData = Is(playbackTracking?.serializedPlaybackPingContextData ?? "") ?? undefined; // was: W (reused)
    timelineEntry.AI = serializeMessage(
      { clientPlaybackNonce: cpn, serializedPlaybackPingContextData: serializedData },
      yp7, // was: yp7 — proto definition
    );
  }

  // Insert into timeline
  insertSegmentEntry(self.O, timelineEntry); // was: FIR

  // Handle decoration info
  const decoration = buildTileContextKey(self, decorationInfo); // was: U (reused), gZ0
  if (decoration && self.w6) {
    self.skipNextIcon.set(adBreakKey, decoration); // was: qQ — decoration map
  }

  // Initialize video data for ad playback
  createAdPlaybackOverlay(self, videoData, durationMs); // was: f$0

  // Log completion
  self.reportTelemetry({
    attlDone: returnTimeMs - enterTimeMs,
    acpn: cpn,
    ElementGeometryObserver: enterTimeMs,
    prt: returnTimeMs,
  });

  // If seek timer was running, cancel and start playback
  if (self.J.isActive()) { // was: J — seek timer
    self.L = false;
    self.J.stop();
    logAdFetchTimeout(self); // was: ZC — clear seek state
    self.clientHintsOverride(true); // was: Sf — start forward
  }

  // Track CPN → ad break id for live streams
  if (adBreakId && self.U7) {
    if (self.jG.has(adBreakId)) {
      self.jG.get(adBreakId).add(cpn);
    } else {
      self.jG.set(adBreakId, new Set([cpn]));
    }
    self.MQ.set(cpn, adBreakId);
  }

  return videoData;
}

// ---------------------------------------------------------------------------
// Ks — Garbage-collect old cue ranges  (lines 117179–117183)
// ---------------------------------------------------------------------------

/**
 * Remove cue ranges older than 1 hour from the "serverstitchedcuerange" set.
 *
 * [was: Ks] (line 117179)
 */
export function garbageCollectCueRanges(self) { // was: Ks
  const stale = self.W.garbageCollectCueRanges("serverstitchedcuerange", 3600000); // was: Q, Ks
  for (const cueRange of stale) { // was: c
    self.A.delete(cueRange.getId());
  }
}

// ---------------------------------------------------------------------------
// onCueRangeEnter  (lines 117184–117209)
// ---------------------------------------------------------------------------

/**
 * Handle entering an ad cue range (legacy mode).
 *
 * Logs the enter event, looks up the timeline entry for this CPN,
 * records `startTimeSecs`, and triggers the ad transition via `we()`.
 *
 * [was: onCueRangeEnter] (line 117184)
 *
 * @param {object} cueRange - The entered cue range [was: Q]
 */
export function onCueRangeEnter(self, cueRange) { // was: onCueRangeEnter
  const cpn = cueRange.getId(); // was: c

  self.reportTelemetry({
    oncueEnter: 1,
    cpn,
    start: cueRange.start,
    end: cueRange.end,
    ct: (self.W.getCurrentTime() || 0).toFixed(3),
    cmt: (self.W.getTimeHead || 0).toFixed(3), // was: TH — media time
  });

  let timelineEntry = self.O.uX(cpn); // was: W, uX — lookup by CPN
  self.reportTelemetry({ enterAdCueRange: 1 });

  const contentCpn = self.getNFOffset || self.findChildBox().cpn; // was: m
  const contentEntry = self.O.uX(contentCpn) ?? self.findChildBox(); // was: K

  if (timelineEntry) {
    const currentTime = self.W.getCurrentTime(); // was: m (reused)
    timelineEntry.startTimeSecs = cueRange.start / 1000;
    const transition = { // was: W (reused)
      OT: contentEntry, // was: OT — outgoing timeline entry
      Wm: timelineEntry, // was: Wm — incoming (ad) entry
      setExpiryTimer: currentTime, // was: ww — wall time
    };
    logSegmentEntryTiming(self, cpn, cueRange.start / 1000, currentTime); // was: de — record impression
    handleSegmentTransition(self, transition); // was: we — execute transition
  }

  self.XI = false; // was: XI — initial state cleared
}

// ---------------------------------------------------------------------------
// Ls — Playback-started transition (new detector)  (lines 117211–117250)
// ---------------------------------------------------------------------------

/**
 * Handle playback-started signal for SSDAI transition detection (new mode).
 *
 * When a new CPN becomes active (`Q`), determines if it's an ad or content,
 * sets `startTimeSecs` and optionally `E8` (earliest seen time), then
 * triggers the `we()` transition.
 *
 * For live streams, cleans up old CPN entries from the `jG`/`MQ` maps
 * and the player's internal state once an ad break completes.
 *
 * [was: Ls] (line 117211)
 *
 * @param {string}  newCpn       - CPN that started playing [was: Q]
 * @param {number}  startTime    - Start time in seconds [was: c]
 * @param {boolean} isInitial    - Whether this is the initial playback [was: W]
 */
export function onPlaybackStartedTransition(self, newCpn, startTime, isInitial) { // was: Ls
  if (!newCpn || !startTime || newCpn === self.app.stepGenerator().W?.Sr()) return; // was: Sr — get CPN

  if ((self.app.stepGenerator().j[newCpn] || null) === null) {
    self.reportTelemetry({ nocpn: newCpn, active: self.app.stepGenerator().W?.Sr() });
    return;
  }

  self.XI = isInitial ?? false;

  const activeCpn = self.app.stepGenerator().W?.Sr() || self.W.Sr(); // was: W
  const outgoingEntry = self.O.uX(activeCpn) ?? self.findChildBox(); // was: m
  const incomingEntry = self.O.uX(newCpn) ?? self.findChildBox(); // was: K

  incomingEntry.startTimeSecs = startTime;
  if (incomingEntry.playerType === 2) { // ad player type
    incomingEntry.renderAdText = incomingEntry.renderAdText != null
      ? Math.min(incomingEntry.renderAdText, startTime)
      : startTime; // was: E8 — earliest start
  }

  const currentTime = self.W.getCurrentTime(); // was: T
  logSegmentEntryTiming(self, activeCpn, startTime, currentTime);
  handleSegmentTransition(self, { OT: outgoingEntry, Wm: incomingEntry, setExpiryTimer: currentTime });

  // Live stream: clean up completed ad break CPNs
  if (self.W.getVideoData().listenOnce() && newCpn === self.W.Sr()) { // was: E7 — is live
    const adBreakId = self.MQ.get(activeCpn); // was: c (reused)
    if (adBreakId) {
      for (const oldCpn of self.jG.get(adBreakId) ?? []) { // was: r
        const playerCache = self.app.stepGenerator(); // was: Q (reused)
        const cachedPlayer = playerCache.j[oldCpn]; // was: W (reused)
        if (cachedPlayer) {
          if (playerCache.W === cachedPlayer) playerCache.W = null;
          if (playerCache.J === cachedPlayer) playerCache.J = null;
          if (oldCpn === playerCache.L.get("")?.Sr()) playerCache.L.delete("");
          delete playerCache.j[oldCpn];
          delete playerCache.K[oldCpn];
        }
        self.T2.delete(oldCpn);
        self.MQ.delete(oldCpn);
      }
      self.jG.delete(adBreakId);
    } else {
      self.reportTelemetry({ no_abid: newCpn });
    }
  }
}

// ---------------------------------------------------------------------------
// Fp — Forward playback to a CPN  (lines 117252–117261)
// ---------------------------------------------------------------------------

/**
 * Forward playback state to the player for a given CPN.
 *
 * If the CPN is the main content, calls `Ih` on the main player.
 * Otherwise looks up the preloaded player from `T2` map and calls
 * `iI7` / `Ih` on it.
 *
 * [was: Fp] (line 117252)
 *
 * @param {string} cpn      [was: Q]
 * @param {number} position [was: c]
 */
export function forwardPlayback(self, cpn, position) { // was: Fp
  if (cpn === self.W.Sr()) {
    registerSecondaryPresenter(self.app.stepGenerator(), self.W, false); // was: Ih — init heartbeat
  } else {
    const preloadedPlayer = self.T2.get(cpn); // was: W
    if (preloadedPlayer) {
      initSegmentEntry(preloadedPlayer, position, !self.XI); // was: iI7 — init ad player
      registerSecondaryPresenter(self.app.stepGenerator(), preloadedPlayer, true);
    } else {
      self.reportTelemetry({ nop_s: cpn });
    }
  }
}

// ---------------------------------------------------------------------------
// onCueRangeExit  (lines 117263–117289)
// ---------------------------------------------------------------------------

/**
 * Handle exiting an ad cue range (legacy mode).
 *
 * Checks if any other active cue range still covers the current time;
 * if not, transitions back to content playback.
 *
 * [was: onCueRangeExit] (line 117263)
 *
 * @param {object} cueRange [was: Q]
 */
export function onCueRangeExit(self, cueRange) { // was: onCueRangeExit
  const currentTimeMs = self.W.getCurrentTime() * 1000; // was: c
  const exitCpn = cueRange.getId(); // was: W

  self.reportTelemetry({
    oncueExit: 1,
    cpn: exitCpn,
    start: cueRange.start,
    end: cueRange.end,
    ct: (self.W.getCurrentTime() || 0).toFixed(3),
    cmt: (self.W.getTimeHead || 0).toFixed(3),
  });

  // Check if still inside another ad cue range
  for (const otherRange of self.A.values()) { // was: m
    if (otherRange.getId() !== exitCpn && currentTimeMs >= otherRange.start && currentTimeMs <= otherRange.end) {
      return; // still in an ad
    }
  }

  // Transition back to content
  const timelineEntry = self.O.uX(exitCpn); // was: c (reused)
  if (timelineEntry) {
    const playerState = self.W.getPlayerState(); // was: W (reused)
    // Don't transition if live and ended
    if (self.W.getVideoData().listenOnce() && playerState.W(2)) return;

    const currentTime = self.W.getCurrentTime(); // was: W (reused again)
    const contentEntry = self.findChildBox(); // was: m (reused)
    contentEntry.startTimeSecs = cueRange.end / 1000;

    const transition = { // was: c (reused)
      OT: timelineEntry,
      Wm: contentEntry,
      setExpiryTimer: currentTime,
    };
    logSegmentEntryTiming(self, self.W.Sr(), cueRange.end / 1000, currentTime);
    handleSegmentTransition(self, transition);
  }
}

// ---------------------------------------------------------------------------
// Rl — Content timeline entry  (lines 117290–117301)
// ---------------------------------------------------------------------------

/**
 * Build a content (non-ad) timeline entry from the main player state.
 *
 * [was: Rl] (line 117290)
 *
 * @returns {{ cpn: string, durationMs: 0, CX: 0, playerType: 1, yz: 0, videoData: object, errorCount: 0, OE: string }}
 */
export function getContentTimelineEntry(self) { // was: Rl
  return {
    cpn: self.W.Sr(), // was: Sr — get CPN
    durationMs: 0,
    CX: 0,
    playerType: 1,
    yz: 0,
    videoData: self.W.getVideoData(),
    errorCount: 0,
    OE: "",
  };
}

// ---------------------------------------------------------------------------
// WB — Is currently in ad playback  (lines 117302–117308)
// ---------------------------------------------------------------------------

/**
 * Check if DAI is currently presenting an ad.
 *
 * Returns false if DAI is disabled (`this.ol`). For live, additionally
 * checks that the ad entry is not marked as JH (joined-head).
 *
 * [was: WB] (line 117302)
 *
 * @returns {boolean}
 */
export function isInAdPlayback(self) { // was: WB
  if (self.ol) return false; // was: ol — DAI disabled

  let entry = undefined; // was: Q
  if (self.getNFOffset) {
    entry = self.O.uX(self.getNFOffset); // was: uX — lookup
  }

  return self.W.getVideoData().listenOnce() // was: E7 — is live
    ? !!entry && !entry.JH // was: JH — joined head flag
    : !!entry;
}

// ---------------------------------------------------------------------------
// seekTo — Seek within SSDAI  (lines 117309–117328)
// ---------------------------------------------------------------------------

/**
 * Perform a seek within the SSDAI timeline.
 *
 * Clears the active CPN, then either:
 *  - For live + seek past the threshold: pauses and triggers `l$d`
 *  - For immediate seek (`W=true`): calls `wvK`
 *  - Otherwise: defers seek with timer and stashes the seek state
 *
 * [was: seekTo] (line 117309)
 *
 * @param {number}  targetTime  [was: Q]
 * @param {object}  seekParams  [was: c]
 * @param {boolean} immediate   [was: W]
 * @param {number|null} timeout [was: m]
 */
export function seekTo(self, targetTime = 0, seekParams = {}, immediate = false, timeout = null) { // was: seekTo
  updateAdProgressTime(self, self.getNFOffset); // was: Lt — clear active ad CPN

  if (self.W.getVideoData().listenOnce() && targetTime <= self.Ie) { // was: Ie — threshold
    self.W.pauseVideo();
    self.Ie = 0;
    l$d(self, targetTime); // was: l$d — live seek
  } else if ((self.XI = true, self.mF = true, immediate)) { // was: XI, mF — flags
    seekDuringAd(self, targetTime, seekParams); // was: wvK — immediate seek
  } else {
    const currentPlayer = self.app.oe(); // was: W (reused)
    const savedState = currentPlayer === self.Ka ? self.toggleFineScrub : null; // was: K

    Fb(self, false); // was: Fb — reset seek state
    self.sC = targetTime; // was: sC — pending seek target
    self.readRepeatedMessageField = seekParams; // was: iX — pending seek params

    if (timeout != null) {
      self.Fw.start(timeout); // was: Fw — seek timeout timer
    }

    if (currentPlayer) {
      self.toggleFineScrub = savedState || currentPlayer.getPlayerState(); // was: EC — saved state
      currentPlayer.Ts(seekParams); // was: Ts — apply seek params
      self.Ka = currentPlayer; // was: Ka — stashed player ref
    }
  }
}

// ---------------------------------------------------------------------------
// WA — Dispose  (line 117330)
// ---------------------------------------------------------------------------

/**
 * Dispose the SSDAI cue range manager.
 *
 * [was: WA] (line 117330)
 */
export function dispose(self) { // was: WA
  Fb(self, false);
  ge(self); // was: ge — cleanup
  resetAllState(self); // was: hty — clear timers
  // super.WA()
}

// ---------------------------------------------------------------------------
// jZ — Handle segment redirect  (lines 117336–117352)
// ---------------------------------------------------------------------------

/**
 * Record a redirect location for a specific segment and itag.
 *
 * [was: jZ] (line 117336)
 *
 * @param {number} segmentNum  [was: Q]
 * @param {string} itagString  [was: c] — itag with optional params after ";"
 * @param {string} urlString   [was: W] — redirect URL
 */
export function handleSegmentRedirect(self, segmentNum, itagString, urlString) { // was: jZ
  if (!urlString || !itagString) return;

  const entry = self.v5.get(segmentNum); // was: m, v5 — segment→entry map
  if (!entry) return;

  if (!entry.locations) entry.locations = new Map();
  const itag = Number(itagString.split(";")[0]); // was: K
  const url = new g.lB(urlString); // was: W (reused)

  self.reportTelemetry({
    hdlredir: 1,
    itag: itagString,
    seg: segmentNum,
    hostport: uB(30, 7442, url), // was: uB — extract host:port
  });

  entry.locations.set(itag, url);
}

// ---------------------------------------------------------------------------
// vg — Get video playback response params  (lines 117353–117384)
// ---------------------------------------------------------------------------

/**
 * Get video playback response parameters for a given media time.
 *
 * Returns ads config, ad CPNs (`Fg`), and optional skip-forward info (`EF`).
 *
 * [was: vg] (line 117353)
 *
 * @param {number} mediaTime [was: Q]
 * @returns {{ Fg: string[], adsConfig: object, EF: object|undefined }|null}
 */
export function getVideoPlaybackResponseParams(self, mediaTime) { // was: vg
  // Determine the ad playback entry
  let adEntry; // was: W (from inner block)
  if (!self.ol) { // not DAI-disabled
    const entry = findSegmentByMediaTime(self, mediaTime); // was: c, OD — find entry by time
    if (!self.W.getVideoData().listenOnce() || !entry?.JH) {
      adEntry = entry;
    }
  }

  if (!adEntry) {
    self.reportTelemetry({ gvprp: "ncp", mt: mediaTime });
    return null;
  }

  const adBreakKey = adEntry.OE; // was: c (reused)
  const adsConfig = LIW(self, adEntry.ssdaiAdsConfig); // was: m, LIW — transform config
  const skipForward = adEntry.Jp && adEntry.ZX && mediaTime >= adEntry.ZX
    ? adEntry.Jp
    : undefined; // was: W (reused) — EF skip info

  const result = {
    Fg: adBreakKey ? yH(self, adBreakKey) : [], // was: yH — get CPNs for ad break
    adsConfig,
    EF: skipForward,
  };

  self.reportTelemetry({
    gvprpro: "v",
    mt: mediaTime.toFixed(3),
    acpns: result.Fg?.join("_") || "none",
    abid: adBreakKey,
  });

  return result;
}

// ---------------------------------------------------------------------------
// EY — Skip ad on segment  (lines 117484–117527)
// ---------------------------------------------------------------------------

/**
 * Skip an ad at a given segment number.
 *
 * Marks the timeline entry with `Jp` (skip segment) and `ZX` (skip time),
 * clears active CPN, resets state, and triggers `a$X` for skip transition.
 *
 * [was: EY] (line 117484)
 *
 * @param {number}  mediaTimeMs  [was: Q]
 * @param {number}  segmentNum   [was: c]
 * @param {boolean} isStitch     [was: W]
 */
export function skipAdOnSegment(self, mediaTimeMs, segmentNum, isStitch = false) { // was: EY
  const entry = findSegmentRecord(self, mediaTimeMs, segmentNum); // was: m, S1 — find entry

  if (!entry) return;

  if (self.dA) self.MM = entry; // was: dA, MM — skip error tracking

  let nextEntry = undefined; // was: K
  const adBreakKey = entry.OE; // was: T

  if (adBreakKey) {
    self.reportTelemetry({
      skipadonsq: segmentNum,
      sts: isStitch,
      abid: adBreakKey,
      acpn: entry.cpn,
      avid: entry.videoData.videoId,
    });

    const adBreakEntries = self.O.W.get(adBreakKey); // was: W (reused)
    if (!adBreakEntries) return;

    for (const abEntry of adBreakEntries) { // was: r
      abEntry.Jp = segmentNum; // was: Jp — skip segment
      abEntry.ZX = mediaTimeMs; // was: ZX — skip time
      if (abEntry.CX > entry.CX) nextEntry = abEntry; // was: K (reused)
    }
  }

  updateAdProgressTime(self, self.getNFOffset); // was: Lt — clear active CPN
  self.j = entry.cpn; // was: j — skip-ad CPN
  removeAllCueRanges(self); // was: RtK — reset tracking

  if (self.api.X("html5_ssdai_enable_media_end_cue_range")) {
    self.W.w1(self.j); // was: w1 — set media-end cue range CPN
  }

  const currentTime = self.W.getCurrentTime(); // was: Q (reused)
  handleAdToAdTransition(self, entry, nextEntry, currentTime, currentTime, false, true); // was: a$X — skip transition
  resetTransitionFlags(self); // was: PO7 — post-skip processing
}

// ---------------------------------------------------------------------------
// ez — Reset skip-ad state  (lines 117515–117528)
// ---------------------------------------------------------------------------

/**
 * Reset the skip-ad state, clearing the skip CPN and resetting tracking.
 *
 * [was: ez] (line 117515)
 */
export function resetSkipAdState(self) { // was: ez
  const timeline = self.O; // was: Q
  for (const entry of timeline.O) { // was: c
    entry.Jp = NaN;
    entry.ZX = NaN;
  }
  removeAllCueRanges(self);
  self.reportTelemetry({ rsac: "resetSkipAd", sac: self.j });
  self.instreamAdPlayerOverlayRenderer.delete(self.j);
  self.j = "";
  if (self.dA) self.MM = undefined;
}

// ---------------------------------------------------------------------------
// s1 — User-initiated skip (LIFA)  (lines 117716–117749)
// ---------------------------------------------------------------------------

/**
 * Execute a user-initiated skip of the current ad (LIFA flow).
 *
 * Pauses the player, looks up the current ad entry, marks it as skipped,
 * removes its cue range, performs the seek via `l$d`, and sets up a
 * "progresssync" listener to finalize the transition.
 *
 * [was: s1] (line 117716)
 *
 * @param {number} timestamp - Current wall time [was: Q]
 * @returns {boolean} Whether the skip was executed
 */
export function userSkipAd(self, timestamp) { // was: s1
  // Reject duplicate skips
  if (self.FI.X("html5_lifa_ignore_multiple_skips") && self.isSamsungSmartTV) {
    self.reportTelemetry({
      ufs_ad: self.j,
      ufs_cur: self.getNFOffset,
      ufs_cont: self.findChildBox().cpn,
    });
    return false;
  }

  updateAdProgressTime(self, self.getNFOffset);
  self.W.pauseVideo(false, self.FI.getExperimentFlags.W.BA(r2w) ? 68 : undefined); // was: r2w — config key

  const currentTime = self.W.getCurrentTime(); // was: c
  const adEntry = self.O.uX(self.getNFOffset); // was: W

  if (!adEntry) {
    self.reportTelemetry({ skipFail: currentTime });
    return false;
  }

  self.j = self.getNFOffset; // was: j — skip CPN
  self.mF = false; // was: mF — clear manual seek flag

  if (self.api.X("html5_ssdai_enable_media_end_cue_range")) {
    self.W.w1(self.j);
  }

  self.removeAdBreakCueRanges(adEntry.OE); // was: M9 — remove ad break cue ranges

  notifyTimeline(self, adEntry, self.findChildBox(), timestamp); // was: Yn_ — skip transition

  l$d(self, currentTime, {
    seekSource: 89,
    Z7: "lifa_skip", // was: Z7 — seek reason tag
  });

  // Listen for progress sync to finalize
  if (!self.isSamsungSmartTV) {
    self.isSamsungSmartTV = self.events.B(self.api, "progresssync", () => {
      recordPlaybackStartTiming(self.api.MetricCondition(), (0, g.h)(), "ad_to_video"); // was: b2 — timing mark
      if (self.isSamsungSmartTV) {
        self.events.Xd(self.isSamsungSmartTV); // was: Xd — unsubscribe
        self.isSamsungSmartTV = null;
      }
    });
  }

  return true;
}

// ---------------------------------------------------------------------------
// M9 — Remove ad break cue ranges  (lines 117751–117768)
// ---------------------------------------------------------------------------

/**
 * Remove all cue ranges and timeline entries for a given ad break ID.
 *
 * For live streams, also removes the ad break from the timeline's W map
 * and disposes any decoration.
 *
 * [was: M9] (line 117751)
 *
 * @param {string} adBreakId [was: Q]
 */
export function removeAdBreakCueRanges(self, adBreakId) { // was: M9
  if (!self.W.getVideoData().listenOnce()) return; // only for live

  const entries = self.O.W.get(adBreakId); // was: c
  if (!entries) return;

  for (const entry of entries) { // was: W
    const cueRange = self.A.get(entry.cpn); // was: c (reused)
    self.A.delete(entry.cpn);
    if (cueRange) self.W.removeCueRange(cueRange);
    removeSegmentEntry(self.O, entry); // was: s10 — remove from timeline
  }
  self.v5.clear(); // was: v5 — segment map

  // Clean up the ad break group
  const timeline = self.O; // was: W (reused)
  const group = timeline.W.get(adBreakId) ?? []; // was: c (reused)
  for (const entry of group) { // was: m
    removeSegmentEntry(timeline, entry);
  }
  timeline.W.delete(adBreakId);

  // Dispose decoration
  const decoration = self.skipNextIcon.get(adBreakId); // was: Q (reused)
  if (decoration && self.w6) {
    self.W.V0(decoration); // was: V0 — remove decoration
  }
}

// ---------------------------------------------------------------------------
// PB — Telemetry reporting  (line 117770)
// ---------------------------------------------------------------------------

/**
 * Report telemetry via "sdai" event on the player.
 *
 * Only logs when debug mode (`this.JJ`) is enabled, unless `force` is true.
 *
 * [was: PB] (line 117770)
 *
 * @param {object}  data  [was: Q]
 * @param {boolean} force [was: c]
 */
export function reportTelemetry(self, data, force = false) { // was: PB
  if (force || self.JJ) {
    self.W.RetryTimer("sdai", data); // was: tJ — log event
  }
}
