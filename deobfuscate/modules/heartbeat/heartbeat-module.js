/**
 * Heartbeat Module — Main module class registered via g.GN("heartbeat", ...)
 *
 * Source: player_es6.vflset/en_US/heartbeat.js, lines 985–1093
 * Deobfuscated from the `(function(g) { ... })(_yt_player)` IIFE.
 */

import {
  registerDisposable, // was: g.F
  DelayedCallback, // was: g.Uc
  logEvent, // was: g.eG
  ExponentialBackoff, // was: g.V2
  InnertubeService, // was: g.AZ
  EventHandler, // was: g.db
  CueRange, // was: g.C8
  cueRangeEnterName, // was: g.Sr
  getKnownPlayerMessages, // was: g.Tw
} from '../../core/';

import {
  PlayerModule, // was: g.zj
  registerModule, // was: g.GN
} from '../../player/';

import { filterAndSortFormats } from '../../data/bandwidth-tracker.js'; // was: as
import { StateFlag } from '../../player/component-events.js'; // was: mV
import { disposeApp } from '../../player/player-events.js'; // was: WA
import { getExperimentFlags } from '../../player/time-tracking.js'; // was: Ty()
import { updateAdProgressTime } from '../../ads/ad-cue-delivery.js'; // was: Lt
import { hasCaptionTracks } from '../../ui/seek-bar-tail.js'; // was: OC
import { PlayerModule } from '../../player/account-linking.js';
import { Delay } from '../../core/timer.js';
import { performHeartbeat, SimpleDate, initHeartbeatFeature, processLiveStreamStatus, getInitialHeartbeatDelay, initBotguardForHeartbeat, resetHeartbeat, scheduleHeartbeat, safeJsonParse } from './health-monitor.js';
import { EventHandler } from '../../core/event-handler.js';
import { CueRange } from '../../ui/cue-range.js';
import { onCueRangeEnter } from '../../ads/dai-cue-range.js';
import { toString } from '../../core/string-utils.js';
import {
  SimpleDate,
  performHeartbeat,
  prepareAttestation,
  initHeartbeatFeature,
  getInitialHeartbeatDelay,
  initBotguardForHeartbeat,
  resetHeartbeat,
  scheduleHeartbeat,
  processLiveStreamStatus,
  safeJsonParse,
  HEARTBEAT_ERROR_CODES,
  LEGACY_HEARTBEAT_REGEX,
} from './health-monitor.js';

/**
 * The "heartbeat" satellite module. Manages periodic keep-alive polling
 * for live streams and DRM-protected content, offline slate display,
 * attestation token lifecycle, and stream transition handling.
 *
 * Registered via `g.GN("heartbeat", ...)` at source line 985.
 *
 * @extends {PlayerModule} [was: g.zj]
 */
export class HeartbeatModule extends PlayerModule { // was: anonymous class at g.GN("heartbeat", ...)
  /**
   * @param {Object} player - The player API instance
   */
  constructor(player) {
    super(player);

    /**
     * Whether this is a live stream.
     * [was: J -> j in some paths, but J used for isStreamInitialized]
     * @type {boolean}
     */
    this.isStreamInitialized = false; // was: this.J

    /**
     * Consecutive heartbeat error count.
     * [was: L]
     * @type {number}
     */
    this.errorCount = 0; // was: this.L

    /**
     * Whether the module has received at least one OK response.
     * [was: K]
     * @type {boolean}
     */
    this.hasReceivedOk = false; // was: this.K

    /**
     * Timer that fires the next heartbeat tick.
     * [was: O]
     * @type {DelayedCallback}
     */
    this.heartbeatTimer = new Delay(() => { performHeartbeat(this); }, 0); // was: this.O

    /**
     * Legacy heartbeat URL params (set via the "heartbeatparams" event).
     * [was: heartbeatParams (already readable)]
     * @type {Object|null}
     */
    this.heartbeatParams = null;

    /**
     * Last known playability status from the heartbeat response.
     * [was: W]
     * @type {Object|null}
     */
    this.lastPlayabilityStatus = null; // was: this.W

    /**
     * Whether this is a live-stream playback.
     * [was: j]
     * @type {boolean}
     */
    this.isLiveStream = false; // was: this.j

    /**
     * Exponential backoff for error retries.
     * [was: D]
     * @type {ExponentialBackoff}
     */
    this.backoff = new V2(1000, 60000, 1); // was: this.D

    /**
     * Current heartbeat sequence number.
     * @type {number}
     */
    this.sequenceNumber = 0;

    /**
     * The offline slate UI component (shown for offline live streams).
     * @type {OfflineSlate|null}
     */
    this.offlineSlate = null;

    /**
     * Innertube service for sending heartbeat API calls.
     * [was: b0]
     * @type {InnertubeService}
     */
    this.innertubeService = new DeferredValue(undefined); // was: this.b0

    /**
     * Current attestation response promise.
     * @type {Promise<Object|undefined>}
     */
    this.attestationResponse = Promise.resolve(undefined);

    /**
     * The attestation response that was sent with the current in-flight request.
     * [was: Y]
     * @type {Promise<Object|undefined>}
     */
    this.pendingAttestationResponse = Promise.resolve(undefined); // was: this.Y

    /**
     * UTC offset in minutes for the heartbeat request context.
     * @type {number}
     */
    this.utcOffsetMinutes = -(new SimpleDate()).getTimezoneOffset();

    /**
     * Server-provided heartbeat data echoed in subsequent requests.
     * [was: T2]
     * @type {Object|undefined}
     */
    this.heartbeatServerData = undefined; // was: this.T2

    /**
     * Event subscription manager.
     * [was: A]
     * @type {EventHandler}
     */
    this.eventHandler = new EventHandler(this); // was: this.A

    F(this, this.heartbeatTimer);
    F(this, this.eventHandler);

    // Prepare initial attestation and start heartbeat feature
    prepareAttestation(this); // was: Dq0(this)
    initHeartbeatFeature(this); // was: FE9(this)

    // Subscribe to player events
    this.eventHandler.B(player, "heartbeatparams", this.onHeartbeatParams); // was: Yk
    this.eventHandler.B(player, "presentingplayerstatechange", this.onPresentingStateChange); // was: mF
    this.eventHandler.B(player, "videoplayerreset", this.onVideoPlayerReset); // was: S
    this.eventHandler.B(player, Sr("heartbeat"), this.onCueRangeEnter);

    // Process any pre-existing live state data
    if (this.isLiveStream && this.lastPlayabilityStatus) {
      processLiveStreamStatus(this, undefined, this.lastPlayabilityStatus);
    }

    // Register initial cue ranges for heartbeat timing
    const initialCueRange = new CueRange(getInitialHeartbeatDelay(this, true), 0x7ffffffffffff, {
      priority: 1,
      namespace: "heartbeat",
    });
    const streamEndCueRange = new CueRange(0x8000000000000, 0x8000000000000, {
      id: "stream_end",
      priority: 1,
      namespace: "heartbeat",
    });
    player.StateFlag([initialCueRange, streamEndCueRange]);

    // Initialize botguard if needed
    initBotguardForHeartbeat(this); // was: dqm(this)
  }

  /**
   * Cleanup: stops heartbeat and removes cue ranges.
   * [was: WA]
   * Source lines: 1026–1030
   */
  disposeApp() {
    resetHeartbeat(this);
    this.player.qI("heartbeat");
    super.disposeApp();
  }

  /**
   * Called when the heartbeat cue range is entered (initial trigger).
   * Source lines: 1031–1034
   */
  onCueRangeEnter() {
    this.isStreamInitialized = true;
    scheduleHeartbeat(this, getInitialHeartbeatDelay(this));
  }

  /**
   * Called when the player receives heartbeat URL params.
   * [was: Yk]
   * Source lines: 1035–1038
   */
  onHeartbeatParams(params) {
    this.heartbeatParams = params;
    scheduleHeartbeat(this, getInitialHeartbeatDelay(this));
  }

  /**
   * Reacts to player state changes (buffering, paused, ended, etc.).
   * [was: mF]
   * Source lines: 1039–1049
   */
  onPresentingStateChange(stateEvent) {
    if (this.player.getPresentingPlayerType() === 8) return;
    if (this.lastPlayabilityStatus?.status === "UNPLAYABLE") return;

    if (stateEvent.state.W(2) || stateEvent.state.W(64)) {
      // Ended or error — reset and restart if live
      resetHeartbeat(this);
      if (this.isLiveStream) {
        this.isStreamInitialized = true;
        scheduleHeartbeat(this, getInitialHeartbeatDelay(this, true));
      }
    } else {
      // Playing, paused, or buffering — schedule heartbeat
      const experimentActive = this.player.G().experiments.getExperimentFlags.W.BA(/* y27 */);
      if (stateEvent.state.W(1) || stateEvent.state.W(8) || (experimentActive && stateEvent.state.W(4))) {
        scheduleHeartbeat(this, getInitialHeartbeatDelay(this));
      }
    }
  }

  /**
   * Reacts to video player reset events.
   * [was: S]
   * Source lines: 1050–1052
   */
  onVideoPlayerReset() {
    if (this.player.getPresentingPlayerType() !== 3) {
      scheduleHeartbeat(this, getInitialHeartbeatDelay(this));
    }
  }

  /**
   * Returns the appropriate player type (premiere -> ad type 1).
   * Source lines: 1053–1056
   */
  getPlayerType() {
    if (this.player.getPresentingPlayerType() === 8) return 1;
  }

  /**
   * Gets the current video data, respecting the player type.
   * Source lines: 1057–1061
   */
  getVideoData() {
    return this.player.getVideoData({ playerType: this.getPlayerType() });
  }

  /**
   * Whether this module supports a given player type.
   * Returns false for types 4 (miniplayer) and 3 (embedded).
   * [was: GS]
   * Source lines: 1062–1069
   */
  GS(playerType) {
    switch (playerType) {
      case 4:
      case 3:
        return false;
    }
    return true;
  }

  /**
   * Logs a heartbeat action transition event.
   * [was: JG]
   * Source lines: 1070–1077
   */
  logHeartbeatAction(trigger, reason, playabilityStatus) { // was: JG
    const payload = { trigger, reason };
    if (playabilityStatus) {
      payload.serializedServerContext = playabilityStatus.additionalLoggingData;
    }
    eG("heartbeatActionPlayerTransitioned", payload);
  }

  /**
   * Extracts a human-readable error message from a heartbeat response.
   * [was: eB]
   * Source lines: 1078–1087
   *
   * @param {string} rawResponse - Raw response text
   * @returns {string} Error message
   */
  getErrorMessage(rawResponse) { // was: eB
    let category = "LICENSE";
    const json = safeJsonParse(rawResponse);
    if (json) return json.reason || Tw[category] || "";

    const match = rawResponse.match(LEGACY_HEARTBEAT_REGEX);
    if (match) {
      const code = Number(match[1]);
      if (code) {
        const label = HEARTBEAT_ERROR_CODES[code.toString()];
        if (label) category = label;
      }
    }
    return Tw[category] || "";
  }

  /**
   * Returns whether the offline slate is currently visible.
   * [was: Lt]
   * Source lines: 1088–1090
   */
  updateAdProgressTime() {
    return !!this.offlineSlate && this.offlineSlate.hasCaptionTracks;
  }
}

// Register the module with the player framework
GN("heartbeat", HeartbeatModule);
