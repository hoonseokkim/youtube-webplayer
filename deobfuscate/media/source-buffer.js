/**
 * MediaSource buffering and SourceBuffer creation.
 *
 * Source: player_es6.vflset/en_US/base.js, lines 23000–24000
 *
 * Covers MediaSource SourceBuffer initialisation (dual-track audio/video),
 * WebKit source addition for platform-specific implementations, the DVX
 * wrapper class, view-based buffer cloning via Hu7, playback state helpers,
 * player state bit-field transitions, and ad layout rendering-adapter
 * lifecycle callbacks (pause/resume, progress, exit signals, quartile
 * tracking, and companion slot creation).
 *
 * @module source-buffer
 */

// ---------------------------------------------------------------------------
// MediaSource / SourceBuffer dual-track setup
// ---------------------------------------------------------------------------


import { getProperty } from '../core/misc-helpers.js'; // was: g.l
import { safeSetTimeout } from '../data/idb-transactions.js'; // was: g.zn
import { PlayerState } from './codec-tables.js'; // was: g.In
import { PlayerStateChange } from '../player/component-events.js'; // was: g.tS
import { computeAutoHideVisible } from '../player/caption-manager.js'; // was: mI
import { loadVideoFromData } from '../player/media-state.js'; // was: sH
import { getContainerType } from './codec-helpers.js'; // was: dh
import { tryThenableResolve } from '../core/composition-helpers.js'; // was: WJ
import { isMediaSourceOpen } from './codec-helpers.js'; // was: Qv
import { getStreamTimeOffsetNQ } from '../player/time-tracking.js'; // was: NQ()
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { getTraceBackend } from '../data/gel-core.js'; // was: yp
import { hasMediaSourceApi } from './codec-helpers.js'; // was: xVy
import { getMediaSource } from '../player/context-updates.js'; // was: pK()
import { getRemainingInRange } from './codec-helpers.js'; // was: RR
import { isTimeInRange } from './codec-helpers.js'; // was: zb
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { LayoutRenderingAdapter } from '../ui/cue-manager.js'; // was: il
import { readTimecodeScale } from './format-parser.js'; // was: qM
import { reportAdsControlFlowError } from '../data/interaction-logging.js'; // was: v1
import { sendCommand } from '../ads/ad-scheduling.js'; // was: BR
import { crossDeviceProgressCommand } from '../core/misc-helpers.js'; // was: jdw
import { dispatchSeek } from '../player/playback-state.js'; // was: Y$
import { detectStateTransition } from '../data/interaction-logging.js'; // was: aH
import { publishAdEvent } from '../player/media-state.js'; // was: b1
import { TimerBasedVodLayoutAdapter } from '../ads/ad-layout-renderer.js'; // was: $V_
import { LayoutExitedForReasonTrigger } from '../ads/ad-trigger-types.js'; // was: wR
import { PlayerBytesMediaLayoutAdapter } from '../ads/ad-layout-renderer.js'; // was: l87
import { getCobaltVersion } from '../core/composition-helpers.js'; // was: tE
import { hasMetadataKey } from '../network/uri-utils.js'; // was: jK
import { dispose, seekTo } from '../ads/dai-cue-range.js';
import { getCurrentTime } from '../player/time-tracking.js';
import { findIndex } from '../core/array-utils.js';
// TODO: resolve g.h
// TODO: resolve g.xh

/**
 * Creates two SourceBuffers (video + audio) on the player's MediaSource and
 * initialises DVX wrappers for each, then binds them via `nId`.
 *
 * If the audio MIME type starts with `"fakesb"` the audio SourceBuffer is
 * left as `undefined` (used for platforms that handle audio internally).
 * Also adds WebKit source IDs ("0" / "1") when the legacy element is present.
 *
 * [was: tUK]
 *
 * @param {object} player      - Player / media-buffer host [was: Q]
 * @param {object} videoFormat  - Video format descriptor (has `.mimeType`, `.mI`) [was: c]
 * @param {object} audioFormat  - Audio format descriptor (has `.mimeType`, `.mI`) [was: W]
 * @param {string} [suffix=""] - Optional MIME suffix appended to video MIME [was: m]
 */
export function createDualSourceBuffers(player, videoFormat, audioFormat, suffix = "") { // was: tUK
  suffix = videoFormat.mimeType + suffix;
  const audioMimeType = audioFormat.mimeType; // was: K
  const videoCodecId = videoFormat.computeAutoHideVisible;        // was: c (reused)
  const audioCodecId = audioFormat.computeAutoHideVisible;        // was: W (reused)

  player.PA = player.loadVideoFromData?.addSourceBuffer(audioMimeType);
  player.UH = suffix.split(";")[0] === "fakesb"
    ? undefined  // was: void 0
    : player.loadVideoFromData?.addSourceBuffer(suffix);

  if (player.Ug) {
    player.Ug.webkitSourceAddId("0", audioMimeType);
    player.Ug.webkitSourceAddId("1", suffix);
  }

  const videoBuffer = new DrmVideoProxy(player.PA, player.Ug, "0", getContainerType(audioMimeType), audioCodecId, false); // was: W = new DVX(Q.PA,Q.Ug,"0",dh(K),W,!1)
  const audioBuffer = new DrmVideoProxy(player.UH, player.Ug, "1", getContainerType(suffix), videoCodecId, true);          // was: m = new DVX(Q.UH,Q.Ug,"1",dh(m),c,!0)

  nId(player, videoBuffer, audioBuffer);
}

// ---------------------------------------------------------------------------
// Buffer view cloning
// ---------------------------------------------------------------------------

/**
 * Creates a new `mB` media-buffer from the current player's existing video /
 * audio tracks by wrapping each in a `Hu7` view. Returns `null` if either
 * track is missing.
 *
 * [was: N2m]
 *
 * @param {object} player    - Player / media-buffer host [was: Q]
 * @param {*}      param1    - Passed through to Hu7 [was: c]
 * @param {*}      param2    - Passed through to Hu7 [was: W]
 * @param {*}      param3    - Passed through to Hu7 [was: m]
 * @returns {object|null} New mB instance, or null if tracks are unavailable
 */
export function createBufferView(player, param1, param2, param3) { // was: N2m
  if (!player.W || !player.O)
    return null;

  const videoTrack = player.W.isView() ? player.W.tryThenableResolve : player.W; // was: K
  const audioTrack = player.O.isView() ? player.O.tryThenableResolve : player.O; // was: T
  const clonedBuffer = new mB(player.mediaElement, player.loadVideoFromData, true); // was: r

  clonedBuffer.j = player.j;
  nId(
    clonedBuffer,
    new BufferView(videoTrack, param1, param2, param3),
    new BufferView(audioTrack, param1, param2, param3)
  );

  isMediaSourceOpen(player) || player.W.gB(player.W.getStreamTimeOffsetNQ);

  return clonedBuffer;
}

// ---------------------------------------------------------------------------
// Playback event logging
// ---------------------------------------------------------------------------

/**
 * Logs a "rms" (rate/media-state) event to the player's stats collector,
 * guarded by the collector's readiness.
 *
 * [was: WD]
 *
 * @param {object}  player     - Player instance [was: Q]
 * @param {*}       eventData  - Event payload [was: c]
 * @param {boolean} [force=false] - Whether to force-report even when paused [was: W]
 */
export function reportMediaState(player, eventData, force = false) { // was: WD
  player.l0?.cB() && player.l0.RetryTimer("rms", eventData, force);
}

// ---------------------------------------------------------------------------
// Buffer range helpers
// ---------------------------------------------------------------------------

/**
 * Returns the end time of the last buffered range, or `NaN` if the buffer
 * is empty.
 *
 * [was: KA]
 *
 * @param {object} source - Source whose `.L()` returns a TimeRanges-like object [was: Q]
 * @returns {number}
 */
export function getBufferedEnd(source) { // was: KA
  const ranges = source.L(); // was: Q
  return ranges.length < 1 ? NaN : ranges.end(ranges.length - 1);
}

// ---------------------------------------------------------------------------
// yp (overlay?) lifecycle
// ---------------------------------------------------------------------------

/**
 * Replaces the current `yp` overlay instance on the player. If the existing
 * instance differs from the new one it is disposed first.
 *
 * [was: iu7]
 *
 * @param {object} player   - Player instance [was: Q]
 * @param {object|null} overlay - New overlay (or null to clear) [was: c]
 */
export function setOverlay(player, overlay) { // was: iu7
  if (player.getTraceBackend && player.getTraceBackend.equals(overlay)) return;
  if (player.getTraceBackend) player.getTraceBackend.dispose();
  player.getTraceBackend = overlay;
}

// ---------------------------------------------------------------------------
// Deferred playback initialisation
// ---------------------------------------------------------------------------

/**
 * Lazily initialises the secondary playback resource (`player.O`) if the
 * platform supports it (`xVy()`). Retries after the pending promise resolves.
 *
 * [was: y97]
 *
 * @param {object} player [was: Q]
 */
export function initSecondaryPlayback(player) { // was: y97
  if (!player.O && hasMediaSourceApi()) {
    if (player.j) {
      player.j.then(() => initSecondaryPlayback(player));
    } else if (!player.JE()) {
      player.O = player.getMediaSource;
    }
  }
}

/**
 * Disposes the secondary playback resource if present.
 *
 * [was: Som]
 *
 * @param {object} player [was: Q]
 */
export function disposeSecondaryPlayback(player) { // was: Som
  if (player.O) {
    player.O.dispose();
    player.O = undefined; // was: void 0
  }
}

// ---------------------------------------------------------------------------
// Autoplay retry loop
// ---------------------------------------------------------------------------

/**
 * Retries `play()` on a paused player up to 10 times at 500 ms intervals
 * until the current time advances past the given threshold.
 *
 * [was: FAO]
 *
 * @param {object} player    - Player instance [was: Q]
 * @param {number} threshold - Time threshold in seconds [was: c]
 * @param {number} attempt   - Current attempt counter [was: W]
 */
export function retryPlay(player, threshold, attempt) { // was: FAO
  if (player.isPaused() || player.getCurrentTime() > threshold || attempt > 10)
    return;

  player.play();
  safeSetTimeout(() => {
    retryPlay(player, player.getCurrentTime(), attempt + 1);
  }, 500);
}

// ---------------------------------------------------------------------------
// Buffered-time utilities
// ---------------------------------------------------------------------------

/**
 * Returns the result of `RR(player.pU(), player.getCurrentTime())` — the
 * "time in buffer" relative to the current playback position.
 *
 * [was: Tm]
 *
 * @param {object} player [was: Q]
 * @returns {number}
 */
export function getTimeInBuffer(player) { // was: Tm
  return getRemainingInRange(player.pU(), player.getCurrentTime());
}

/**
 * Checks whether the given buffer position `pos` is within a buffered range,
 * returning `false` if the player is in an error or zero-state.
 *
 * [was: Zu7]
 *
 * @param {object} player [was: Q]
 * @param {number} pos    - Seconds to probe [was: c]
 * @returns {boolean}
 */
export function isPositionBuffered(player, pos) { // was: Zu7
  if (player.A() === 0 || player.hasError())
    return false; // was: !1

  const hasPlayed = player.getCurrentTime() > 0; // was: W
  return pos >= 0 && (
    (/* ranges */ player.L()),
    player.L().length || !hasPlayed
  )
    ? isTimeInRange(player.L(), pos)
    : hasPlayed;
}

// ---------------------------------------------------------------------------
// Player reset
// ---------------------------------------------------------------------------

/**
 * Fully resets a player that has ended: logs "rs_s", seeks to 0 on supported
 * platforms, reloads the media element, clears the overlay, then deletes the
 * pending promise.
 *
 * [was: on]
 *
 * @param {object} player [was: Q]
 */
export function resetPlayer(player) { // was: on
  if (player.JE()) {
    if (player.l0) player.l0.eX("rs_s");
    if (ou && player.getCurrentTime() > 0) player.seekTo(0);
    player.parseHexColor();
    player.load();
    setOverlay(player, null); // was: iu7(Q, null)
  }
  delete player.j;
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

/**
 * Maps a player error code to a human-readable error tag string, or `null`
 * for unknown codes.
 *
 * [was: rQ]
 *
 * @param {object} player [was: Q]
 * @returns {string|null}
 */
export function classifyPlayerError(player) { // was: rQ
  switch (player.LayoutRenderingAdapter()) {
    case 2:
      return "progressive.net.retryexhausted";
    case 3: {
      const errorMsg = player.eB(); // was: Q
      return (errorMsg?.includes("MEDIA_ERR_CAPABILITY_CHANGED") ||
              (EIO && errorMsg?.includes("audio_output_change")))
        ? "capability.changed"
        : "fmt.decode";
    }
    case 4:
      return "fmt.unplayable";
    case 5:
      return "drm.unavailable";
    case 1000: // was: 1E3
      return "capability.changed";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Playing-state guard
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the player is actively playing (not seeking, not
 * buffering).
 *
 * [was: Uj]
 *
 * @param {object} player [was: Q]
 * @returns {boolean}
 */
export function isActivelyPlaying(player) { // was: Uj
  return player.isPlaying() && !player.W(16) && !player.W(32);
}

// ---------------------------------------------------------------------------
// Player state transitions  (bit-field helpers)
// ---------------------------------------------------------------------------

/**
 * Builds a new `g.In` state object by comparing the proposed fields against
 * the current state. Returns the existing state unchanged when nothing
 * differs or the combination is invalid (e.g. bit 128 without `Dr`, or
 * bits 2+16 together).
 *
 * [was: XN]
 *
 * @param {object}      current        - Current state [was: Q]
 * @param {number}      [stateBits]    - New state bit-field [was: c]
 * @param {*}           [dr]           - Drift-recovery value [was: W]
 * @param {*}           [seekSource]   - Seek source [was: m]
 * @param {*}           [stoppageReason] - Stoppage reason [was: K]
 * @returns {object} Updated state (possibly same reference)
 */
export function buildNextState(current, stateBits, dr, seekSource, stoppageReason) { // was: XN
  if (!(stateBits === current.state &&
        dr === current.Dr &&
        seekSource === current.seekSource &&
        stoppageReason === current.stoppageReason ||
        stateBits !== undefined &&
        (stateBits & 128 && !dr || stateBits & 2 && stateBits & 16))) {
    let isSeeking; // was: T
    if (isSeeking = stateBits) {
      isSeeking = stateBits || current.state;
      isSeeking = !!(isSeeking & 16 || isSeeking & 32);
    }
    current = new PlayerState(
      stateBits,
      dr,
      isSeeking ? (seekSource ? seekSource : current.seekSource) : null,
      stoppageReason
    );
  }
  return current;
}

/**
 * Computes the ad-scheduling state from the current playback state snapshot.
 *
 * [was: AS]
 *
 * @param {object}  schedule  - Scheduling context [was: Q]
 * @param {object}  player    - Player instance [was: c]
 * @param {boolean} [force=false] [was: W]
 * @returns {*}
 */
export function computeAdSchedulingState(schedule, player, force = false) { // was: AS
  return sdy(schedule, player.getCurrentTime(), (0, g.h)(), getTimeInBuffer(player), force);
}

/**
 * Sets (OR) state bits on the current state.
 * [was: e7]
 *
 * @param {object}  state      [was: Q]
 * @param {number}  bitsToSet  [was: c]
 * @param {*}       [seekSrc]  [was: W]
 * @param {*}       [stopReason] [was: m]
 * @returns {object}
 */
export function addStateBits(state, bitsToSet, seekSrc = null, stopReason = null) { // was: e7
  return buildNextState(state, state.state | bitsToSet, null, seekSrc, stopReason);
}

/**
 * Clears (AND-NOT) state bits on the current state.
 * [was: Vv]
 *
 * @param {object}  state        [was: Q]
 * @param {number}  bitsToClear  [was: c]
 * @returns {object}
 */
export function clearStateBits(state, bitsToClear) { // was: Vv
  return buildNextState(state, state.state & ~bitsToClear, null, null, null);
}

/**
 * Simultaneously sets some bits and clears others.
 * [was: BD]
 *
 * @param {object}  state        [was: Q]
 * @param {number}  bitsToSet    [was: c]
 * @param {number}  bitsToClear  [was: W]
 * @param {*}       [seekSrc]    [was: m]
 * @param {*}       [stopReason] [was: K]
 * @returns {object}
 */
export function setAndClearStateBits(state, bitsToSet, bitsToClear, seekSrc = null, stopReason = null) { // was: BD
  return buildNextState(state, (state.state | bitsToSet) & ~bitsToClear, null, seekSrc, stopReason);
}

/**
 * Returns `true` when two state objects share the same `state` and `Dr`.
 * [was: g.xT]
 *
 * @param {object} a [was: Q]
 * @param {object} b [was: c]
 * @returns {boolean}
 */
export function statesMatch(a, b) { // was: g.xT
  return b.state === a.state && b.Dr === a.Dr;
}

/**
 * Derives a numeric "player phase" from the state bit-field.
 *  -1 = unknown/error, 0 = ended, 1 = buffering, 2 = paused, 3 = playing/seeking
 * [was: q5]
 *
 * @param {object} state [was: Q]
 * @returns {number}
 */
export function getPlayerPhase(state) { // was: q5
  return state.W(128) ? -1
    : state.W(2)    ? 0
    : state.W(2048)  ? 3
    : state.W(64)    ? -1
    : state.W(1) && !state.W(32) ? 3
    : state.W(8)     ? 1
    : state.W(4)     ? 2
    : -1;
}

// ---------------------------------------------------------------------------
// Layout metadata helpers (ad layout interaction commands)
// ---------------------------------------------------------------------------

/**
 * Extracts the interactions-and-progress layout commands from a layout's
 * client metadata.
 *
 * [was: nA]
 *
 * @param {object} ctx - Layout rendering context [was: Q]
 * @returns {object|undefined}
 */
export function getInteractionCommands(ctx) { // was: nA
  return ctx.layout.clientMetadata.readTimecodeScale("METADATA_TYPE_INTERACTIONS_AND_PROGRESS_LAYOUT_COMMANDS");
}

/**
 * Dispatches a DK-style event on the layout's VC (view-controller).
 * [was: DK]
 *
 * @param {object} ctx   [was: Q]
 * @param {string} event [was: c]
 */
export function dispatchLayoutEvent(ctx, event) { // was: DK
  lR(ctx.VC, event, !ctx.W);
}

/**
 * Logs a "layout exit signal received outside exit flow" warning.
 * [was: dVm]
 *
 * @param {object} ctx [was: Q]
 */
export function warnUnexpectedExitSignal(ctx) { // was: dVm
  reportAdsControlFlowError("Received layout exit signal when not in layout exit flow.", ctx.slot, ctx.layout);
}

// ---------------------------------------------------------------------------
// Layout pause / resume / progress
// ---------------------------------------------------------------------------

/**
 * Pauses the current layout if it is in the "rendering" phase: dispatches
 * "pause" to the view-controller, executes pause commands, and transitions
 * to phase 2.
 *
 * [was: LA3]
 *
 * @param {object} ctx [was: Q]
 */
export function pauseLayout(ctx) { // was: LA3
  if (ctx.pX === "rendering") {
    dispatchLayoutEvent(ctx, "pause"); // was: DK(Q, "pause")
    const commands = getInteractionCommands(ctx)?.pauseCommands || []; // was: c
    sendCommand(ctx.r3.get(), commands, ctx.layout.layoutId);
    ctx.ow(2);
  }
}

/**
 * Resumes the current layout if it is in the "rendering" phase: dispatches
 * "resume" to the view-controller and executes resume commands.
 *
 * [was: wY3]
 *
 * @param {object} ctx [was: Q]
 */
export function resumeLayout(ctx) { // was: wY3
  if (ctx.pX === "rendering") {
    dispatchLayoutEvent(ctx, "resume"); // was: DK(Q, "resume")
    const commands = getInteractionCommands(ctx)?.resumeCommands || []; // was: c
    sendCommand(ctx.r3.get(), commands, ctx.layout.layoutId);
  }
}

/**
 * Dispatches a progress update to the layout's view-controller.
 * [was: bun]
 *
 * @param {object}  ctx        [was: Q]
 * @param {*}       progressData [was: c]
 * @param {boolean} [force=false] [was: W]
 */
export function updateLayoutProgress(ctx, progressData, force = false) { // was: bun
  if (!ctx.W) {
    uR(ctx.VC, progressData, force);
  }
}

/**
 * Returns whether the layout's progress commands contain a `jdw`-typed command.
 * [was: gIx]
 *
 * @param {object} ctx [was: Q]
 * @returns {boolean}
 */
export function hasProgressJdwCommand(ctx) { // was: gIx
  return (getInteractionCommands(ctx)?.progressCommands || [])
    .findIndex(cmd => !!getProperty(cmd?.command, crossDeviceProgressCommand)) !== -1;
}

// ---------------------------------------------------------------------------
// Layout exit handling
// ---------------------------------------------------------------------------

/**
 * Handles layout exit based on the exit reason: "normal" → complete,
 * "skipped" → skip, "abandoned" → abandon (only if impression was logged).
 *
 * [was: Ou0]
 *
 * @param {object} ctx    [was: Q]
 * @param {string} reason - "normal" | "skipped" | "abandoned" [was: c]
 */
export function handleLayoutExit(ctx, reason) { // was: Ou0
  switch (reason) {
    case "normal":
      ctx.dispatchSeek("complete");
      break;
    case "skipped":
      ctx.dispatchSeek("skip");
      break;
    case "abandoned":
      if (hI(ctx.VC, "impression")) ctx.dispatchSeek("abandon");
      break;
  }
}

/**
 * First-state filter: ensures the initial state change event produces a
 * fresh `g.tS` wrapper with a blank `g.In`.
 *
 * [was: f8W]
 *
 * @param {object} ctx    [was: Q]
 * @param {object} event  [was: c]
 * @returns {object}
 */
export function ensureFirstStateEvent(ctx, event) { // was: f8W
  if (!ctx.A) {
    event = new PlayerStateChange(event.state, new PlayerState);
    ctx.A = true; // was: !0
  }
  return event;
}

/**
 * Routes a player-state transition to the appropriate layout lifecycle method
 * (end → ow(1), pause, or resume).
 *
 * [was: vI7]
 *
 * @param {object} ctx   [was: Q]
 * @param {object} state [was: c]
 */
export function onPlayerStateChange(ctx, state) { // was: vI7
  if (cT(state)) {
    ctx.ow(1);
  } else if (state.Fq(4) && !state.Fq(2)) {
    pauseLayout(ctx); // was: LA3(Q)
  }
  if (detectStateTransition(state, 4) < 0 && !(detectStateTransition(state, 2) < 0)) {
    resumeLayout(ctx); // was: wY3(Q)
  }
}

// ---------------------------------------------------------------------------
// Ad break start signal
// ---------------------------------------------------------------------------

/**
 * Fires the "ad_bl" beacon and reports ad-break metadata when the ad is at
 * position 0 (the first ad in a break).
 *
 * [was: a8x]
 *
 * @param {object} ctx [was: Q]
 */
export function signalAdBreakStart(ctx) { // was: a8x
  if (ctx.position === 0) {
    ctx.D7.get();
    const kind = ctx.layout.clientMetadata
      .readTimecodeScale("metadata_type_ad_placement_config").kind; // was: Q
    const payload = { adBreakType: HD(kind) };       // was: Q
    Bu("ad_bl");
    g.xh(payload);
  }
}

// ---------------------------------------------------------------------------
// Transition pings  (video↔ad, ad↔ad)
// ---------------------------------------------------------------------------

/**
 * Ensures transition pings are registered for all four transition types.
 * [was: g.N5]
 *
 * @param {object} registry [was: Q]
 * @param {*}      config   [was: c]
 * @param {string} primary  [was: W]
 */
export function ensureTransitionPings(registry, config, primary) { // was: g.N5
  if (!np(registry, primary))         tr(registry, config, primary);
  if (!np(registry, "video_to_ad"))   tr(registry, config, "video_to_ad");
  if (!np(registry, "ad_to_video"))   tr(registry, config, "ad_to_video");
  if (!np(registry, "ad_to_ad"))      tr(registry, config, "ad_to_ad");
}

// ---------------------------------------------------------------------------
// Ad playback progress timer
// ---------------------------------------------------------------------------

/**
 * Starts the ad playback progress timer: records the current time, reports
 * the initial progress, then kicks off the repeating timer.
 *
 * [was: GZw]
 *
 * @param {object} ctx [was: Q]
 */
export function startAdProgressTimer(ctx) { // was: GZw
  ctx.iZ = Date.now();
  reportAdProgress(ctx, ctx.K2);
  ctx.timer.start();
}

/**
 * Reports the current ad playback progress (current / duration in seconds)
 * to the ad module via `onAdPlaybackProgress`.
 *
 * [was: yv]
 *
 * @param {object} ctx     [was: Q]
 * @param {number} current - Current position in ms [was: c]
 */
export function reportAdProgress(ctx, current) { // was: yv
  const payload = {
    current: current / 1000, // was: c / 1E3
    duration: ctx.Tj() / 1000 // was: Q.Tj() / 1E3
  };
  publishAdEvent(ctx.mG.get(), "onAdPlaybackProgress", payload);
}

// ---------------------------------------------------------------------------
// Layout rendering adapter factories
// ---------------------------------------------------------------------------

/**
 * Creates a `$V_` media-break layout rendering adapter with a no-op `ow`.
 * [was: P3R]
 *
 * @param {object} config [was: Q]
 * @returns {object}
 */
export function createMediaBreakAdapter(config) { // was: P3R
  return new TimerBasedVodLayoutAdapter({
    ...config,
    LayoutExitedForReasonTrigger: config.callback,
    ow: () => {}
  });
}

/**
 * Creates an `l87` ad-intro layout rendering adapter that dispatches
 * `onAdIntroStateChange` on state change.
 *
 * [was: uM3]
 *
 * @param {object} config [was: Q]
 * @returns {object}
 */
export function createAdIntroAdapter(config) { // was: uM3
  return new PlayerBytesMediaLayoutAdapter({
    ...config,
    ow: (stateChange) => { // was: c
      publishAdEvent(config.mG.get(), "onAdIntroStateChange", stateChange);
    }
  });
}

/**
 * Creates an `l87` ad layout rendering adapter that dispatches via `n1`.
 * [was: hc7]
 *
 * @param {object} config [was: Q]
 * @returns {object}
 */
export function createAdMediaAdapter(config) { // was: hc7
  return new PlayerBytesMediaLayoutAdapter({
    ...config,
    ow: (stateChange) => { // was: c
      config.mG.get().n1(stateChange);
    }
  });
}

// ---------------------------------------------------------------------------
// Layout type matcher / adapter selector
// ---------------------------------------------------------------------------

/**
 * Selects a rendering adapter for a given layout template (`tE`) by checking
 * its metadata and layout type. Returns `undefined` if no adapter matches.
 *
 * - `LAYOUT_TYPE_MEDIA_BREAK` with duration metadata → `$V_` (media-break)
 * - `LAYOUT_TYPE_MEDIA` with player-vars + callback → `l87` (intro or media)
 *
 * [was: zc_]
 *
 * @param {object} config [was: Q]
 * @returns {object|undefined}
 */
export function selectRenderingAdapter(config) { // was: zc_
  let template = config.getCobaltVersion; // was: c
  let requiredKeys = ["METADATA_TYPE_MEDIA_BREAK_LAYOUT_DURATION_MILLISECONDS"]; // was: W

  for (const key of G1()) {
    requiredKeys.push(key);
  }

  if (MP(template, { Qz: requiredKeys, a8: ["LAYOUT_TYPE_MEDIA_BREAK"] })) {
    return createMediaBreakAdapter(config); // was: P3R(Q)
  }

  template = config.getCobaltVersion;
  requiredKeys = ["metadata_type_player_vars", "metadata_type_player_bytes_callback_ref"];

  for (const key of G1()) {
    requiredKeys.push(key);
  }

  if (MP(template, { Qz: requiredKeys, a8: ["LAYOUT_TYPE_MEDIA"] })) {
    return hasMetadataKey(config.getCobaltVersion.clientMetadata, "metadata_type_ad_intro")
      ? createAdIntroAdapter(config)  // was: uM3(Q)
      : createAdMediaAdapter(config); // was: hc7(Q)
  }
}
