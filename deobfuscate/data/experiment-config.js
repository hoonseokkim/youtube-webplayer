/**
 * experiment-config.js -- Experiment flag & configuration retrieval
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~82507-82549
 *
 * Handles:
 *  - WPCC (Web Player Client Config) flag retrieval from serialized experiment flags
 *  - Extended experiment configuration (experiment IDs, experiment flags, WPCC config)
 */

import { parseQueryString } from '../core/url-utils.js'; // was: Le
import { SecondaryFeatureWrapper } from './session-storage.js'; // was: EPW
import { FeatureWrapper } from './session-storage.js'; // was: Z_W
import { buildPipFlags } from './device-context.js';

// ---------------------------------------------------------------------------
// WpccFlagRetriever [was: mvn]
// ---------------------------------------------------------------------------

/**
 * Retrieves WPCC (Web Player Client Config) flags from a serialized
 * "&"-delimited experiment flag string.
 *
 * The constructor parses `config.serializedClientExperimentFlags` into a
 * Map<string, string> for fast flag lookups.
 *
 * [was: mvn]
 */
export class WpccFlagRetriever {
  /**
   * @param {Object} config - config object containing serializedClientExperimentFlags
   *   [was: Q]
   */
  constructor(config) { // was: constructor(Q)
    /** @type {Map<string, string>} -- parsed flag key-value pairs [was: flags] */
    const parsed = parseQueryString(config.serializedClientExperimentFlags ?? '', '&'); // was: Le(Q.serializedClientExperimentFlags ?? "", "&")
    this.flags = new Map(
      Object.entries(parsed).map(
        ([key, value]) => typeof value === 'string' ? [key, value] : [key, value[0]]
      )
    );
  }

  /**
   * Retrieve a typed WPCC flag value.
   * Throws if the flag descriptor's `di` is not 3 (WPCC type).
   *
   * [was: BA]
   * @param {Object} flagDescriptor - flag descriptor with `di` field [was: Q]
   * @returns {*} the flag value
   */
  getWpccFlag(flagDescriptor) { // was: BA(Q)
    if (flagDescriptor.di !== 3) {
      throw Error('WpccFlagRetriever only supports WPCC flags');
    }
    return resolveWpccFlag(this, flagDescriptor); // was: W33(this, Q)
  }

  /**
   * Check whether a boolean flag is set to "true".
   *
   * [was: SG]
   * @param {string} flagName [was: Q]
   * @returns {boolean}
   */
  isFlagEnabled(flagName) { // was: SG(Q)
    return this.flags.get(`${flagName}`) === 'true';
  }
}

// ---------------------------------------------------------------------------
// ExperimentConfig [was: Kf_]
// ---------------------------------------------------------------------------

/**
 * Extended experiment configuration that combines experiment IDs, serialized
 * experiment flags, and WPCC flag retrievers.
 *
 * [was: Kf_]
 */
export class ExperimentConfig {
  /**
   * @param {string} [serializedExperimentIds] - comma-separated experiment IDs [was: Q]
   * @param {string} [serializedFlags] - "&"-delimited flag string [was: c]
   * @param {Object} [wpccConfig={}] - config for WPCC flag retriever [was: W]
   */
  constructor(serializedExperimentIds, serializedFlags, wpccConfig) { // was: constructor(Q, c, W)
    /** @type {*} [was: W] */
    this.cachedValue = undefined; // was: this.W = void 0

    /** @type {string[]} -- list of active experiment IDs [was: experimentIds] */
    this.experimentIds = serializedExperimentIds ? serializedExperimentIds.split(',') : [];

    /** @type {Object<string, string>} -- parsed flags as key-value pairs [was: flags] */
    this.flags = parseQueryString(serializedFlags || '', '&'); // was: Le(c || "", "&")

    /** @type {Object<string, boolean>} -- experiment ID presence map [was: experiments] */
    const experimentMap = {};
    for (const id of this.experimentIds) {
      experimentMap[id] = true; // was: Q[m] = !0
    }
    this.experiments = experimentMap;

    /** @private {WpccFlagRetriever} [was: buildPipFlags new mvn(W)] */
    const wpccRetriever = new WpccFlagRetriever(wpccConfig); // was: new mvn(W)

    /** @private -- typed flag adapter [was: A] */
    this.typedFlagAdapter = new SecondaryFeatureWrapper(wpccRetriever); // was: new EPW(W)

    /** @private -- extended flag adapter [was: O] */
    this.extendedFlagAdapter = new FeatureWrapper(wpccRetriever); // was: new Z_W(W)
  }

  /**
   * Get the typed flag adapter.
   * [was: Ty]
   * @returns {EPW}
   */
  getTypedFlagAdapter() { // was: Ty()
    return this.typedFlagAdapter; // was: this.A
  }

  /**
   * Get the extended flag adapter.
   * [was: iV]
   * @returns {Z_W}
   */
  getExtendedFlagAdapter() { // was: iV()
    return this.extendedFlagAdapter; // was: this.O
  }

  /**
   * Check whether a boolean experiment flag is enabled ("true").
   *
   * [was: SG]
   * @param {string} flagName [was: Q]
   * @returns {boolean}
   */
  isFlagEnabled(flagName) { // was: SG(Q)
    const value = this.getFlag(flagName); // was: this.BA(Q)
    JSON.stringify(value);
    return value === 'true';
  }

  /**
   * Look up a raw flag value by name.
   *
   * [was: BA]
   * @param {string} flagName [was: Q]
   * @returns {string|undefined}
   */
  getFlag(flagName) { // was: BA(Q)
    return this.flags[flagName];
  }
}
