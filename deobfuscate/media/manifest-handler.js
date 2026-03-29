/**
 * Manifest and format metadata tracking — watch-time segments, playback pings,
 * and VSS (Video Stats Service) coordination.
 *
 * Extracted from base.js lines ~96962-97105.
 * Covers manifest/format metadata tracking, eligible segment collection,
 * format duration, segment boundaries, playback limits, and experiments
 * `manifestless_post_live` and `html5_sabr_parse_live_metadata_playback_boundaries`.
 *
 * @module manifest-handler
 */

// ---------------------------------------------------------------------------
// ManifestTracker  [was: UR3]
// ---------------------------------------------------------------------------


import { reportWarning } from '../data/gel-params.js'; // was: g.Ty
import { safeClearTimeout } from '../data/idb-transactions.js'; // was: g.JB
import { getAdContentVideoId } from './seek-controller.js'; // was: Ah
import { encodeUtf8 } from '../core/event-registration.js'; // was: bd
import { getTimeHead } from '../player/time-tracking.js'; // was: TH()
import { buildAdTelemetryContext } from '../player/media-state.js'; // was: gW
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { detectStateTransition } from '../data/interaction-logging.js'; // was: aH
import { disposeApp } from '../player/player-events.js'; // was: WA
import { isGaplessShortEligible } from './seek-controller.js'; // was: wA
import { buildWatchtimePayload } from '../ads/ad-async.js'; // was: W2
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { Disposable } from '../core/disposable.js';
import { appendParamsToUrl } from '../core/url-utils.js';
import { createLogger } from '../data/logger-init.js'; // was: g.JY
import { getYtNow } from '../player/time-tracking.js'; // was: g.Yo
// TODO: resolve g.qK

/**
 * Tracks manifest and format metadata for watch-time reporting.
 * Manages playback/watchtime/engage/ATR pings, collects segments
 * with their boundaries, and coordinates with the underlying
 * WatchTimeSegmentCollector.
 *
 * Key method: `getEligibleSegments()` (was: `mF()`) returns the
 * collected segment list, flushing the internal buffer.
 *
 * Experiments:
 *   - manifestless_post_live
 *   - html5_sabr_parse_live_metadata_playback_boundaries
 *
 * [was: UR3]
 *
 * @extends g.qK (Disposable)
 */
export class ManifestTracker extends Disposable { // was: UR3
  /**
   * @param {object} provider - Stats/telemetry provider with videoData, FI, EH [was: Q]
   */
  constructor(provider) { // was: (Q)
    super();
    this.provider = provider;

    /** @type {string} Current playback state label [was: K] */
    this.playbackState = "paused"; // was: K

    /** @type {number} Scheduled ping timer ID [was: L] */
    this.pingTimerId = NaN; // was: L

    /**
     * Ping interval thresholds in seconds.
     * Default: [10, 10, 10, 40] — first three at 10s, then every 40s.
     * [was: T2]
     * @type {number[]}
     */
    this.pingIntervals = [10, 10, 10, 40]; // was: T2

    /** @type {number} Current ping interval index [was: S] */
    this.pingIntervalIndex = 0; // was: S

    /** @type {number} [was: Ie] */
    this.Ie = 0; // was: Ie

    /** @type {boolean} Whether playback has started (playback ping sent) [was: A] */
    this.hasStarted = false; // was: A

    /** @type {boolean} [was: MM] */
    this.MM = false; // was: MM

    /** @type {boolean} [was: jG] */
    this.jG = false; // was: jG

    /** @type {boolean} [was: PA] */
    this.PA = false; // was: PA

    /** @type {boolean} [was: Ka] */
    this.Ka = false; // was: Ka

    /** @type {number} Seek offset in seconds [was: O] */
    this.seekOffset = NaN; // was: O

    /** @type {number} Delayed start offset [was: j] */
    this.delayedStartOffset = NaN; // was: j

    /** @type {Object} Logger instance [was: logger] */
    this.logger = createLogger("vss"); // was: new g.JY("vss")

    /** @type {object} Accessor for the segment collector [was: Rk] */
    this.accessors = { // was: Rk
      /** Returns the WatchTimeSegmentCollector [was: Hxe] */
      Hxe: () => this.segmentCollector, // was: W
    };

    /**
     * Underlying segment collector that tracks media time progression.
     * [was: W]
     * @type {WatchTimeSegmentCollector}
     */
    this.segmentCollector = new qv0(provider); // was: W -> new qv0(Q)
  }

  /**
   * Start playback tracking — send the initial "playback" ping,
   * initialize ping intervals, and begin segment collection.
   * [was: Ls]
   */
  onPlaybackStart() { // was: Ls
    if (this.hasStarted) return;

    if (this.provider.videoData.MC === 16623) {
      reportWarning(Error("Playback for EmbedPage"));
    }

    const playbackPing = uc(this, "playback"); // was: Q
    this.pingIntervals = pUn(this); // was: T2
    u77(this.segmentCollector); // reset collector

    playbackPing.J = h6(this); // join latency
    if (this.delayedStartOffset > 0) {
      playbackPing.W -= this.delayedStartOffset;
    }
    playbackPing.send();

    // Ptracking ping (third-party tracking pixel)
    if (this.provider.videoData.Hy) {
      const playerConfig = this.provider.FI; // was: Q (reused)
      const videoData = this.provider.videoData; // was: c
      const params = { // was: W
        html5: "1",
        video_id: videoData.videoId,
        cpn: videoData.clientPlaybackNonce,
        ei: videoData.eventId,
        ptk: videoData.Hy,
        oid: videoData.Fx,
        ptchn: videoData.RF,
        pltype: videoData.Eq,
        content_v: getAdContentVideoId(videoData),
      };
      if (videoData.encodeUtf8) {
        Object.assign(params, { m: videoData.encodeUtf8 });
      }
      const trackingUrl = appendParamsToUrl(playerConfig.kq + "ptracking", params); // was: Q (reused)
      zK(this, trackingUrl);
    }

    if (!this.provider.videoData.A2) {
      Wj3(this); // schedule watchtime pings
      mR0(this); // schedule engage pings
    }

    this.hasStarted = true;

    // Initialize segment collector position
    const collector = this.segmentCollector; // was: Q (reused)
    collector.O = collector.getTimeHead;
    collector.buildAdTelemetryContext = getYtNow(collector.provider);
    if (!(collector.A === 0 && collector.O < 5) && collector.O - collector.A > 2) {
      collector.A = collector.O;
    }
    collector.L = true;
  }

  /**
   * Cancel the scheduled ping timer.
   * [was: D]
   */
  cancelPingTimer() { // was: D
    safeClearTimeout(this.pingTimerId);
    this.pingTimerId = NaN;
  }

  /**
   * Flush pending segments and optionally mark as seek-triggered.
   * [was: Y]
   *
   * @param {boolean} isSeeking - Whether this flush is due to a seek [was: Q]
   */
  flushSegments(isSeeking = false) { // was: Y
    PP(this.segmentCollector, isSeeking);
    if (this.provider.FI.getExperimentFlags.W.BA(nPd)) {
      const segments = this.getEligibleSegments(); // was: Q (reused)
      for (const segment of segments) {
        const watchTimeSegment = new nWW(this.provider.videoData); // was: Q (reused)
        watchTimeSegment.segment = segment;
        watchTimeSegment.send();
      }
    }
  }

  /**
   * Returns the list of eligible segments and clears the internal buffer.
   * Each segment describes a contiguous playback range with start/end time,
   * visibility state, volume, and playback rate.
   * [was: mF]
   *
   * @returns {Array} Collected segments with time boundaries
   */
  getEligibleSegments() { // was: mF
    this.segmentCollector.update();
    const collector = this.segmentCollector; // was: Q
    if (collector.segments.length && collector.O === collector.A) {
      // No new progress — force-close current segment
      PP(collector);
    }
    const segments = collector.segments; // was: c
    collector.segments = [];
    collector.K = 0;
    return segments;
  }

  /**
   * Update live-ingestion offset metadata on the segment collector.
   * [was: HA]
   *
   * @param {object} metadata - Contains AI and J6 offset tokens [was: Q]
   */
  updateLiveMetadata(metadata) { // was: HA
    const collector = this.segmentCollector; // was: c
    collector.AI = metadata.AI;
    collector.J6 = metadata.J6;
  }

  /**
   * Build and return a watchtime ping, consuming the current segment list.
   * [was: J]
   *
   * @param {boolean} includeSeekOffset - Whether to include the seek-offset field [was: Q]
   * @param {boolean} markFinal - Whether this is a final ping [was: c]
   * @returns {object} The watchtime ping object
   */
  buildWatchtimePing(includeSeekOffset, markFinal = false) { // was: J
    const ping = QIm(this, this.getEligibleSegments()); // was: W
    if (!isNaN(this.seekOffset) && includeSeekOffset) {
      ping.Y = this.seekOffset;
    }
    if (markFinal) {
      ping.isInAdPlayback = true;
    }
    return ping;
  }

  /**
   * Handle media progress updates — reschedule pings as needed.
   * [was: onProgress]
   */
  onProgress() { // was: onProgress
    this.segmentCollector.update();
    if (chy(this)) {
      Wj3(this);
      mR0(this);
    }
  }

  /**
   * Handle player state changes — manage segment flushing and ping sending
   * around play/pause/seek/end transitions.
   * [was: b0]
   *
   * @param {object} stateChange - Player state change descriptor [was: Q]
   */
  onStateChange(stateChange) { // was: b0
    if (this.u0()) return;

    const usePausePings = this.provider.FI.getExperimentFlags.W.BA(Sfn); // was: c

    if (stateChange.state.W(2) || stateChange.state.W(512)) {
      // Ended or error state
      this.playbackState = "paused";
      if (stateChange.Fq(2) || stateChange.Fq(512)) {
        if (stateChange.Fq(2)) {
          this.segmentCollector.previouslyEnded = true;
        }
        if (this.hasStarted) {
          this.cancelPingTimer();
          Cw(this).send(); // final watchtime ping
          this.seekOffset = NaN;
        }
      }
    } else if (stateChange.state.W(1) || stateChange.state.W(4)) {
      // Buffering or paused
      const wasPlaying = this.playbackState === "playing"; // was: W
      this.playbackState = "paused";
      if (usePausePings) {
        const isNewPauseOrBuffer = stateChange.Fq(1) || stateChange.Fq(4); // was: Q (reused)
        if (this.hasStarted && isNewPauseOrBuffer && wasPlaying) {
          this.buildWatchtimePing(!isNaN(this.seekOffset)).send();
          this.cancelPingTimer();
          this.seekOffset = NaN;
        }
      }
    } else if (stateChange.state.W(8)) {
      // Playing
      this.playbackState = "playing";
      const joinLatency = (this.hasStarted && isNaN(this.pingTimerId)) ? h6(this) : NaN; // was: W
      const resumeFromPause = usePausePings && (detectStateTransition(stateChange, 4) < 0 || detectStateTransition(stateChange, 1) < 0); // was: c

      if (!isNaN(joinLatency) && (detectStateTransition(stateChange, 64) < 0 || detectStateTransition(stateChange, 512) < 0 || resumeFromPause)) {
        const ping = this.buildWatchtimePing(false); // was: c (reused)
        ping.J = joinLatency;
        ping.send();
      }

      // Detect loop-back seek (seek source 58 = looping)
      if (stateChange.Fq(16) && stateChange.state.seekSource === 58) {
        this.segmentCollector.previouslyEnded = true;
      }
    } else {
      this.playbackState = "paused";
    }
  }

  /**
   * Dispose — cancel timers and finalize segment collector.
   * [was: WA]
   */
  disposeApp() { // was: WA
    super.disposeApp();
    this.cancelPingTimer();
    lmd(this.segmentCollector); // finalize collector
  }

  /**
   * Serialize current state for diagnostics (returns playback ping params).
   * [was: wA]
   *
   * @returns {object}
   */
  isGaplessShortEligible() { // was: wA
    return buildWatchtimePayload(uc(this, "playback"));
  }

  /**
   * Build an engage ping with the given action type.
   * [was: zm]
   *
   * @param {*} actionType [was: Q]
   * @returns {string} Serialized engage URL
   */
  buildEngagePing(actionType) { // was: zm
    const engagePing = uc(this, "engage"); // was: c
    engagePing.isSamsungSmartTV = actionType;
    return Jx7(engagePing, TAR(this.provider));
  }

  /**
   * Check accumulated segment duration and send a watchtime ping if threshold is exceeded.
   * [was: UH]
   */
  checkSegmentDurationThreshold() { // was: UH
    const accumulatedDuration = this.segmentCollector.K; // was: Q
    const threshold = this.provider.FI.getExperimentFlags.W.BA(UoX) || 4000; // was: c
    if (accumulatedDuration > threshold) {
      this.buildWatchtimePing(!isNaN(this.seekOffset)).send();
    }
  }

  /**
   * Reset the ping interval index.
   * [was: XI]
   */
  resetPingInterval() { // was: XI
    this.pingIntervalIndex = 0;
  }
}
