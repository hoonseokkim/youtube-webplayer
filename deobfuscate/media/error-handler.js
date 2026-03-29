/**
 * Playback error handling and health-event formatting.
 *
 * Extracted from base.js lines ~96482-97000.
 * Covers error severity classification (SIGNATURE_EXPIRED, FORMAT_UNAVAILABLE,
 * HTML5_SPS_UMP_STATUS_REJECTED, TOO_MANY_REQUESTS), delayed retry logic,
 * network-error counting, player health telemetry, and error message formatting.
 *
 * @module error-handler
 */

// ---------------------------------------------------------------------------
// PlaybackErrorHandler  [was: eoS]
// ---------------------------------------------------------------------------


import { ThrottleTimer } from '../core/bitstream-helpers.js'; // was: g.Uc
import { registerDisposable } from '../core/event-system.js'; // was: g.F
import { logGelEvent } from '../data/gel-params.js'; // was: g.eG
import { PlayerState } from './codec-tables.js'; // was: g.In
import { PlayerError } from '../ui/cue-manager.js'; // was: g.rh
import { setBgeNetworkStatus } from '../network/uri-utils.js'; // was: HI
import { extractMediaError } from './format-retry.js'; // was: yxK
import { handlePlaybackError } from './format-retry.js'; // was: wi
import { handleForbiddenError } from './format-retry.js'; // was: ZD_
import { handleInnertubeReloadRequired } from './format-retry.js'; // was: E5d
import { isForbiddenNetworkError } from './format-retry.js'; // was: Fin
import { isFatalNetworkError } from './format-retry.js'; // was: SQ_
import { adMessageRenderer } from '../core/misc-helpers.js'; // was: rc
import { probeNetworkPath } from '../ads/ad-click-tracking.js'; // was: rt
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { getCanaryStage } from './format-retry.js'; // was: am0
import { shouldUseSabr } from './seek-controller.js'; // was: M8
import { disposeApp } from '../player/player-events.js'; // was: WA
import { Disposable } from '../core/disposable.js';
import { handleError } from '../player/context-updates.js';
import { dispose } from '../ads/dai-cue-range.js';
import { getYtNow } from '../player/time-tracking.js'; // was: g.Yo
import { getDrmInfo } from '../player/video-data-helpers.js'; // was: g.Jh
// TODO: resolve g.h
// TODO: resolve g.qK

/**
 * Manages playback error state with severity classification.
 * Routes fatal vs. non-fatal errors, detects stale signatures,
 * handles delayed retries, and publishes error telemetry.
 *
 * Known error codes:
 *   - "html5.invalidstate", "fmt.unplayable", "fmt.unparseable"
 *   - "auth" (rc 429 -> TOO_MANY_REQUESTS)
 *   - "ump.spsrejectfailure" -> HTML5_SPS_UMP_STATUS_REJECTED
 *   - SIGNATURE_EXPIRED (stale signature expiration)
 *   - FORMAT_UNAVAILABLE (locked format)
 *
 * [was: eoS]
 *
 * @extends g.qK (Disposable)
 */
export class PlaybackErrorHandler extends Disposable { // was: eoS
  /**
   * @param {object} player - The player instance providing loader, publish, o$ [was: Q]
   */
  constructor(player) { // was: (Q)
    super();
    /** @type {object} Player reference [was: EH] */
    this.player = player; // was: EH
    /** @type {number} Current error code bitmask [was: Y4] */
    this.errorFlags = 0; // was: Y4
    /** @type {boolean} Whether a fatal error was reported [was: K] */
    this.hasFatalError = false; // was: K
    /** @type {boolean} Whether error was forwarded upstream [was: O] */
    this.errorForwarded = false; // was: O
    /** @type {number} Retry attempt counter [was: j] */
    this.retryCount = 0; // was: j

    /** @type {object} Player config shorthand [was: LayoutExitedMetadata] */
    this.playerConfig = this.player.G(); // was: AJ
    /** @type {object} Video data shorthand [was: videoData] */
    this.videoData = this.player.getVideoData(); // was: videoData

    /** @type {number} Max delayed retry attempts [was: A] */
    this.maxDelayedRetries = getExperimentValue(this.playerConfig.experiments, "html5_delayed_retry_count"); // was: A

    /** @type {g.Delay} Delayed retry timer [was: W] */
    this.retryTimer = new ThrottleTimer(() => { // was: W
      this.player.setBgeNetworkStatus(); // trigger retry
    }, getExperimentValue(this.playerConfig.experiments, "html5_delayed_retry_delay_ms"));

    registerDisposable(this, this.retryTimer);
  }

  /**
   * Whether any error flags are set.
   * [was: mR]
   *
   * @returns {boolean}
   */
  hasError() { // was: mR
    return !!this.errorFlags;
  }

  /**
   * Whether the error has been forwarded to the upstream handler.
   * [was: Px]
   *
   * @returns {boolean}
   */
  isErrorForwarded() { // was: Px
    return this.errorForwarded;
  }

  /**
   * Main error handler — classifies error severity and routes accordingly.
   *
   * Fatal errors are reported via player.o$() with a suberror code:
   *   - SIGNATURE_EXPIRED: stale-signature expiration detected
   *   - FORMAT_UNAVAILABLE: format locked by loader
   *   - HTML5_SPS_UMP_STATUS_REJECTED: SPS/UMP rejection
   *   - TOO_MANY_REQUESTS: HTTP 429 on auth
   *
   * Non-fatal errors are published as "nonfatalerror" and logged.
   * When the client playback nonce starts with "pp", a path-probe ping
   * is sent to diagnose manifest connectivity issues.
   *
   * [was: handleError]
   *
   * @param {g.rh} error - Error object with errorCode, details, severity [was: Q]
   */
  handleError(error) { // was: handleError
    extractMediaError(this, error); // pre-process error state

    // Skip retriable format errors
    if (
      (error.NetworkErrorCode === "html5.invalidstate" ||
       error.NetworkErrorCode === "fmt.unplayable" ||
       error.NetworkErrorCode === "fmt.unparseable") &&
      handlePlaybackError(this, error.NetworkErrorCode, error.details)
    ) {
      return;
    }

    // Check delayed-retry and exhaustion
    if (handleForbiddenError(this, error)) return;
    if (handleInnertubeReloadRequired(this)) return;

    // Detect SIGNATURE_EXPIRED — stale signature with expired timestamp
    if (
      this.playerConfig.mF !== "yt" &&
      isForbiddenNetworkError(this, error) &&
      this.videoData.dA &&
      (0, g.h)() / 1e3 > this.videoData.dA &&
      Ew(this.videoData)
    ) {
      const details = Object.assign({ e: error.NetworkErrorCode }, error.details); // was: c
      details.stalesigexp = "1";
      details.expire = Math.round(this.videoData.dA * 1e3);
      details.init = Math.round(this.videoData.ZO);
      details.now = Math.round((0, g.h)());
      error = new PlayerError(error.NetworkErrorCode, details, 2);
      this.player.o$(error.NetworkErrorCode, 2, "SIGNATURE_EXPIRED", Tb(error.details));
    }

    // Route by severity
    if (oR(error.severity)) {
      // --- Fatal path ---
      const loader = this.player.loader?.w6(); // was: c
      let suberrorCode; // was: W
      let suberrorNum; // was: m

      if (this.playerConfig.X("html5_use_network_error_code_enums")) {
        // Enum-typed error codes (numeric rc)
        if (isFatalNetworkError(error) && loader && loader.isLocked()) {
          suberrorCode = "FORMAT_UNAVAILABLE";
        } else if (!this.playerConfig.D && error.NetworkErrorCode === "auth" && error.details.adMessageRenderer === 429) {
          suberrorCode = "TOO_MANY_REQUESTS";
          suberrorNum = "6";
        } else if (error.NetworkErrorCode === "ump.spsrejectfailure") {
          suberrorCode = "HTML5_SPS_UMP_STATUS_REJECTED";
        }
      } else {
        // String-typed error codes (string rc)
        if (isFatalNetworkError(error) && loader && loader.isLocked()) {
          suberrorCode = "FORMAT_UNAVAILABLE";
        } else if (!this.playerConfig.D && error.NetworkErrorCode === "auth" && error.details.adMessageRenderer === "429") {
          suberrorCode = "TOO_MANY_REQUESTS";
          suberrorNum = "6";
        } else if (error.NetworkErrorCode === "ump.spsrejectfailure") {
          suberrorCode = "HTML5_SPS_UMP_STATUS_REJECTED";
        }
      }

      this.player.o$(error.NetworkErrorCode, error.severity, suberrorCode, Tb(error.details), suberrorNum);
    } else {
      // --- Non-fatal path ---
      this.player.publish("nonfatalerror", error);
      const isPrefixedNonce = /^pp/.test(this.videoData.clientPlaybackNonce); // was: W
      this.logNonFatalError(error.NetworkErrorCode, error.details);

      // Path-probe ping for manifest connectivity diagnosis
      if (isPrefixedNonce && error.NetworkErrorCode === "manifest.net.connect") {
        const probeUrl = `https://www.youtube.com/generate_204?cpn=${this.videoData.clientPlaybackNonce}&t=${(0, g.h)()}`; // was: Q (reused)
        probeNetworkPath(probeUrl, "manifest",
          (response) => { this.logPathProbe("pathprobe", response); }, // was: m
          (probeError) => { this.logNonFatalError(probeError.NetworkErrorCode, probeError.details); } // was: m
        );
      }
    }
  }

  /**
   * Forward a successful path-probe result to the stats tracker.
   * [was: tJ]
   *
   * @param {string} label [was: Q]
   * @param {*} response [was: c]
   */
  logPathProbe(label, response) { // was: tJ
    this.player.Vp.RetryTimer(label, response);
  }

  /**
   * Forward a non-fatal error to the stats tracker.
   * [was: I$]
   *
   * @param {string} errorCode [was: Q]
   * @param {object} details [was: c]
   */
  logNonFatalError(NetworkErrorCode, details) { // was: I$
    const serialized = Tb(details); // was: c (reused)
    this.player.Vp.I$(NetworkErrorCode, serialized);
  }
}


// ---------------------------------------------------------------------------
// RetryInfo  [was: jZn]
// ---------------------------------------------------------------------------

/**
 * Encapsulates retry context for a failed request.
 * [was: jZn]
 */
export class RetryInfo { // was: jZn
  /**
   * @param {*} request - The original request [was: Q]
   * @param {string} reason - Why the retry is needed [was: c]
   * @param {*} errorData - Error details [was: W]
   * @param {string} source - Source identifier [was: m]
   * @param {string} token - Auth/session token [was: K]
   */
  constructor(request, reason, errorData, source, token) { // was: (Q, c, W, m, K)
    this.request = request; // was: W -> Q
    this.reason = reason; // was: c
    this.errorData = errorData; // was: O -> W
    this.source = source; // was: m
    this.token = token; // was: K
  }
}


// ---------------------------------------------------------------------------
// ErrorFormatter  [was: x91]
// ---------------------------------------------------------------------------

/**
 * Collects player health telemetry and sends a single health-event ping.
 * Tracks play time, rebuffer time, seek count, network errors, non-network
 * errors, JS exceptions, SABR fallback, and player canary state.
 * [was: x91]
 *
 * @extends g.qK (Disposable)
 */
export class ErrorFormatter extends Disposable { // was: x91
  /**
   * @param {object} provider - Stats/telemetry provider [was: Q]
   */
  constructor(provider) { // was: (Q)
    super();
    this.provider = provider;
    /** @type {number} Time when stats collection began (ms) [was: W] */
    this.startTime = -1; // was: W
    /** @type {boolean} Whether the health event has been sent [was: K] */
    this.hasSent = false; // was: K
    /** @type {number} Join latency reference time (ms) [was: O] */
    this.joinTime = -1; // was: O
    /** @type {PlayerState} Current player state [was: playerState] */
    this.playerState = new PlayerState();
    /** @type {number} Accumulated play time in seconds [was: playTimeSecs] */
    this.playTimeSecs = 0;
    /** @type {number} Accumulated rebuffer time in seconds [was: rebufferTimeSecs] */
    this.rebufferTimeSecs = 0;
    /** @type {number} [was: j] */
    this.lastUpdateTime = 0; // was: j
    /** @type {number} [was: networkErrorCount] */
    this.networkErrorCount = 0;
    /** @type {boolean} [was: encounteredSabrFallback] */
    this.encounteredSabrFallback = false;
    /** @type {number} [was: nonNetworkErrorCount] */
    this.nonNetworkErrorCount = 0;
    /** @type {number} [was: seekCount] */
    this.seekCount = 0;

    /** @type {g.Delay} 60-second send timer [was: delay] */
    this.delay = new ThrottleTimer(this.send, 60000, this); // was: delay
    /** @type {boolean} Whether sending is complete [was: A] */
    this.sendComplete = false; // was: A
    /** @type {number} JS error counter [was: jsErrorCount] */
    this.jsErrorCount = 0;

    /** @type {object} Callback references for cleanup [was: Rk] */
    this.callbackRefs = { // was: Rk
      fu: () => { this.onJsError(); },
    };

    /** @type {Function} JS error increment handler [was: fu] */
    this.onJsError = () => { this.jsErrorCount++; };

    registerDisposable(this, this.delay);
    window.addEventListener("error", this.onJsError);
    window.addEventListener("unhandledrejection", this.onJsError);
  }

  /**
   * Mark the start of playback — record start time and kick off the send timer.
   * [was: Ls]
   */
  onPlaybackStart() { // was: Ls
    const now = getYtNow(this.provider); // was: Q
    if (this.startTime < 0) {
      this.startTime = now;
      this.delay.start();
    }
    this.lastUpdateTime = now;
    this.joinTime = now;
  }

  /**
   * Track an error event — distinguish network vs. non-network errors.
   * [was: onError]
   *
   * @param {string} errorCode [was: Q]
   */
  onError(NetworkErrorCode) { // was: onError
    if (NetworkErrorCode === "player.fatalexception" && !this.provider.X("html5_exception_to_health")) {
      return;
    }
    if (NetworkErrorCode === "sabr.fallback") {
      this.encounteredSabrFallback = true;
    }
    if (NetworkErrorCode.match(NETWORK_ERROR_PATTERN)) { // was: BZi
      this.networkErrorCount++;
    } else {
      this.nonNetworkErrorCount++;
    }
  }

  /**
   * Build and send the player health event ping.
   * Includes player state classification, canary type, live mode, DRM, gapless,
   * server-stitched DAI, and SABR flags.
   * [was: send]
   */
  send() { // was: send
    if (this.sendComplete || this.startTime < 0) return;

    $8w(this); // finalize accumulated counters

    const elapsedMs = getYtNow(this.provider) - this.startTime; // was: Q
    let playerStateLabel = "PLAYER_PLAYBACK_STATE_UNKNOWN"; // was: c
    const errorState = this.playerState.Dr; // was: W

    if (this.playerState.isError()) {
      playerStateLabel = (errorState && errorState.NetworkErrorCode === "auth")
        ? "PLAYER_PLAYBACK_STATE_UNKNOWN"
        : "PLAYER_PLAYBACK_STATE_ERROR";
    } else if (this.playerState.W(2)) {
      playerStateLabel = "PLAYER_PLAYBACK_STATE_ENDED";
    } else if (this.playerState.W(64)) {
      playerStateLabel = "PLAYER_PLAYBACK_STATE_UNSTARTED";
    } else if (this.playerState.W(16) || this.playerState.W(32)) {
      playerStateLabel = "PLAYER_PLAYBACK_STATE_SEEKING";
    } else if (this.playerState.W(1) && this.playerState.W(4)) {
      playerStateLabel = "PLAYER_PLAYBACK_STATE_PAUSED_BUFFERING";
    } else if (this.playerState.W(1)) {
      playerStateLabel = "PLAYER_PLAYBACK_STATE_BUFFERING";
    } else if (this.playerState.W(4)) {
      playerStateLabel = "PLAYER_PLAYBACK_STATE_PAUSED";
    } else if (this.playerState.W(8)) {
      playerStateLabel = "PLAYER_PLAYBACK_STATE_PLAYING";
    }

    const liveMode = Q3R[kQ(this.provider.videoData)]; // was: W (reused)

    // Determine canary type
    let canaryType; // was: m
    switch (this.provider.FI.playerCanaryState) {
      case "canary":
        canaryType = "HTML5_PLAYER_CANARY_TYPE_EXPERIMENT";
        break;
      case "holdback":
        canaryType = "HTML5_PLAYER_CANARY_TYPE_CONTROL";
        break;
      default:
        canaryType = "HTML5_PLAYER_CANARY_TYPE_UNSPECIFIED";
    }

    const canaryStage = getCanaryStage(this.provider); // was: K
    const joinLatency = this.joinTime < 0 ? elapsedMs : this.joinTime - this.startTime; // was: T
    const isStaleSession = this.provider.FI.AA + 3600000 < (0, g.h)(); // was: Q (reused)

    const healthEvent = { // was: c (reused)
      started: this.joinTime >= 0,
      stateAtSend: playerStateLabel,
      joinLatencySecs: joinLatency,
      jsErrorCount: this.jsErrorCount,
      playTimeSecs: this.playTimeSecs,
      rebufferTimeSecs: this.rebufferTimeSecs,
      seekCount: this.seekCount,
      networkErrorCount: this.networkErrorCount,
      nonNetworkErrorCount: this.nonNetworkErrorCount,
      playerCanaryType: canaryType,
      playerCanaryStage: canaryStage,
      isAd: this.provider.videoData.isAd(),
      liveMode: liveMode,
      hasDrm: !!getDrmInfo(this.provider.videoData),
      isGapless: this.provider.videoData.J,
      isServerStitchedDai: this.provider.videoData.enableServerStitchedDai,
      encounteredSabrFallback: this.encounteredSabrFallback,
      isSabr: shouldUseSabr(this.provider.videoData),
    };

    if (!isStaleSession) {
      logGelEvent("html5PlayerHealthEvent", healthEvent);
    }

    this.sendComplete = true;
    this.dispose();
  }

  /**
   * Dispose — ensure health event is sent, remove global listeners.
   * [was: WA]
   */
  disposeApp() { // was: WA
    if (!this.sendComplete) this.send();
    window.removeEventListener("error", this.onJsError);
    window.removeEventListener("unhandledrejection", this.onJsError);
    super.disposeApp();
  }
}

/**
 * Regex matching network-related error codes.
 * [was: BZi]
 */
const NETWORK_ERROR_PATTERN = /\bnet\b/; // was: BZi
