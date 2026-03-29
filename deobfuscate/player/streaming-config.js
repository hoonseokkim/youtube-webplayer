/**
 * Streaming configuration classes — XHR request header builder and
 * HTML5 streaming resilience tuning.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~87002–87031
 *
 * [was: zdd, f3O]
 */

// import { XhrRequest } from '../network/xhr-request.js';  // was: eL

// ---------------------------------------------------------------------------
// RequestHeaderBuilder  [was: zdd]
// ---------------------------------------------------------------------------

/**
 * XHR request subclass that merges custom request headers into every
 * outgoing request.  Extends the base XHR request class (`eL`).
 *
 * Usage:
 *   const req = new RequestHeaderBuilder();
 *   req.requestHeaders['X-Custom'] = 'value';
 *   // headers are merged in getRequestHeaders()
 *
 * [was: zdd]
 */
export class RequestHeaderBuilder /* extends XhrRequest */ {
  constructor() {
    // super(...arguments);  // was: super(...arguments)

    /**
     * Extra headers to include in every request.
     * @type {Record<string, string>}
     */
    this.requestHeaders = {};
  }

  /**
   * Build the full set of request headers by merging the parent's headers
   * with the custom `requestHeaders` map.
   *
   * @param {*} url    [was: Q]
   * @param {*} params [was: c]
   * @returns {Record<string, string>}
   *
   * was: Sl(Q, c)
   */
  getRequestHeaders(url, params) { // was: Sl
    return {
      ...super.getRequestHeaders(url, params), // was: super.Sl(Q, c)
      ...this.requestHeaders,
    };
  }
}

// ---------------------------------------------------------------------------
// StreamingResilienceConfig  [was: f3O]
// ---------------------------------------------------------------------------

/**
 * Configuration object that reads HTML5 streaming resilience experiment
 * flags and exposes tuning knobs consumed by the adaptive streaming
 * engine.
 *
 * Constructor parameters are derived from the experiment framework and
 * control buffer thresholds, progress handling, and SABR live fixes.
 *
 * [was: f3O]
 */
export class StreamingResilienceConfig {
  /**
   * @param {Object} experiments — experiment flag reader (has `.SG()` and
   *                               `g.Um()` accessors)  [was: Q]
   */
  constructor(experiments) {
    /** @private  Experiment reader. [was: experiments] */
    this.experiments = experiments;

    /**
     * Default buffer size in bytes.  Increased to 65536 when both
     * `html5_sabr_live_audio_early_return_fix` is enabled and the
     * environment flag `em` is true.
     * @type {number}
     * [was: W, default 2048]
     */
    this.bufferSize = 2048; // was: this.W = 2048

    /**
     * Internal counter / state.
     * @type {number}
     * [was: j, default 0]
     */
    this.counter = 0; // was: this.j = 0

    /**
     * Whether the main resilience experiment is enabled.
     * @type {boolean}
     * [was: J]
     */
    this.resilienceEnabled = this.getFlag("html5_streaming_resilience"); // was: this.J

    /**
     * Media-time weight factor.  0.5 when resilience is enabled, 0.25 otherwise.
     * @type {number}
     * [was: mF]
     */
    this.mediaTimeWeightFactor = this.resilienceEnabled ? 0.5 : 0.25; // was: this.mF

    /**
     * Proportional media-time weight from experiment, or 0.
     * @type {number}
     * [was: A]
     */
    this.mediaTimeWeightProp = experiments.getNumber?.("html5_media_time_weight_prop") || 0;
    // was: g.Um(this.experiments, "html5_media_time_weight_prop") || 0

    /**
     * Whether to consider end-stall in resilience calculations.
     * @type {boolean}
     * [was: K]
     */
    this.considerEndStall = experiments.SG("html5_consider_end_stall"); // was: this.K

    /**
     * Combined flag: considerEndStall AND the global `em` flag.
     * @type {boolean}
     * [was: Y]
     */
    this.considerEndStallWithEnv = this.considerEndStall; // was: this.K && em

    /**
     * Whether to measure max progress handling.
     * @type {boolean}
     * [was: O]
     */
    this.measureMaxProgressHandling = experiments.SG("html5_measure_max_progress_handling");
    // was: this.O

    /**
     * Whether to treat pre-elbow requests as metadata.
     * @type {boolean}
     * [was: L]
     */
    this.treatPreElbowAsMetadata = this.getFlag("html5_treat_requests_pre_elbow_as_metadata");
    // was: this.L

    /**
     * Whether media-time weighting is enabled (either via the boolean flag
     * or the proportional weight being non-zero).
     * @type {boolean}
     * [was: D]
     */
    this.mediaTimeWeightEnabled =
      this.getFlag("html5_media_time_weight") || !!this.mediaTimeWeightProp;
    // was: this.D

    // SABR live audio early-return fix: bump buffer size
    if (this.getFlag("html5_sabr_live_audio_early_return_fix")) {
      // was: em && (this.W = 65536)
      // Note: `em` is a global environment flag not available in this module
      this.bufferSize = 65536;
    }
  }

  /**
   * Read a boolean experiment flag.
   *
   * @param {string} flagName
   * @returns {boolean}
   *
   * was: X(Q) (line 87028)
   */
  getFlag(flagName) { // was: X
    return this.experiments.SG(flagName);
  }
}
