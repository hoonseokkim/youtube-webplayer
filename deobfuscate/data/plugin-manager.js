/**
 * plugin-manager.js -- Multi-plugin initialization orchestration and
 * plugin disposal management.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~59996-60041
 *
 * Covers:
 *  - MultiPluginManager (rPK): orchestrates initialization, disposal,
 *    and delegation across an ordered list of measurement plugins.
 *  - PluginSlotHolder (t_): simple container for the currently-active
 *    measurement plugin slot reference.
 *
 * The MultiPluginManager extends the abstract measurement-provider base
 * class (QW) and delegates getName / G0 / oM to whichever concrete plugin
 * is currently active (either the overridden one or the default).
 */
import { ViewabilityManager } from '../proto/message-defs.js'; // was: QW
import { MeasurementClient } from '../proto/message-defs.js'; // was: pK
import { win } from '../proto/messages-core.js'; // was: bI
import { ElementGeometryObserver } from './module-init.js'; // was: et
import { getDebugInfo } from '../player/time-tracking.js';
import { forEach } from '../core/event-registration.js';
import { dispose } from '../ads/dai-cue-range.js';



// ── imports (from core layer) ────────────────────────────────────────────
// import { forEach as iterateArray } from '../core/array-utils.js'; // was: g.lw
// import { some as arraySome }       from '../core/array-utils.js'; // was: Jy

// =========================================================================
// PluginSlotHolder   [was: t_, lines 59990-59994]
// =========================================================================

/**
 * Simple holder for a reference to the current measurement-plugin
 * instance (`.pluginInstance`) and an optional secondary slot (`.secondary`).
 *
 * [was: t_]
 */
export class PluginSlotHolder { // was: t_
  constructor() {
    /** @type {?Object} primary plugin reference [was: this.O] */
    this.primary = null; // was: this.O

    /** @type {?Object} resolved measurement plugin [was: this.W] */
    this.pluginInstance = null; // was: this.W
  }
}

// =========================================================================
// MultiPluginManager   [was: rPK, lines 59996-60041]
// =========================================================================

/**
 * Orchestrates an ordered list of measurement plugins (e.g. MRAID,
 * IntersectionObserver, geometric, native-bridge).  On construction the
 * plugin list is normalised via `f7w`, and the last valid plugin is used
 * as the fallback base.
 *
 * Key behaviour:
 *  - `init()` iterates all plugins, calling `initialize()` on each.
 *    If any succeeds the callback is stored and the base plugin is wired.
 *  - `dispose()` cascades disposal to every plugin in the list.
 *  - `getName()`, `G0()`, `oM()` delegate to the override plugin when one
 *    has been set via `applyOverride()`, otherwise to the default base.
 *
 * [was: rPK]
 */
export class MultiPluginManager extends ViewabilityManager { // was: rPK extends QW
  /**
   * @param {Array} pluginConfigs - raw plugin configuration objects [was: Q]
   */
  constructor(pluginConfigs) { // was: constructor(Q)
    const plugins = f7w(pluginConfigs); // was: Q = f7w(Q) — normalise/filter plugins
    super(
      plugins.length
        ? plugins[plugins.length - 1]
        : new MeasurementClient(win, 0) // was: new pK(bI, 0) — fallback empty plugin
    );

    /**
     * Ordered list of concrete measurement plugins.
     * @type {Array}
     * [was: this.K]
     */
    this.plugins = plugins; // was: this.K

    /**
     * Override plugin reference. When non-null, getName/G0/oM
     * delegate here instead of to the default base.
     * @type {?Object}
     * [was: this.O]
     */
    this.overridePlugin = null; // was: this.O
  }

  // ── delegation methods ────────────────────────────────────────────────

  /**
   * Returns the human-readable name of the active measurement plugin.
   *
   * [was: getName]
   * @returns {string}
   */
  getName() { // was: getName()
    return (this.overridePlugin ? this.overridePlugin : this.W).getName();
  }

  /**
   * Returns diagnostic / debug info from the active plugin.
   *
   * [was: G0]
   * @returns {Object}
   */
  getDebugInfo() { // was: G0()
    return (this.overridePlugin ? this.overridePlugin : this.W).G0();
  }

  /**
   * Returns the operational mode of the active plugin.
   *
   * [was: oM]
   * @returns {number}
   */
  getOperationalMode() { // was: oM()
    return (this.overridePlugin ? this.overridePlugin : this.W).oM();
  }

  // ── lifecycle ─────────────────────────────────────────────────────────

  /**
   * Initialise all plugins in order. If at least one plugin initialises
   * successfully, store the ready callback and wire the base plugin.
   *
   * @param {Function} readyCallback - invoked when measurement is ready [was: Q]
   * @returns {boolean} true if at least one plugin initialised
   *
   * [was: init]
   */
  init(readyCallback) { // was: init(Q)
    let anyInitialised = false; // was: c
    forEach(this.plugins, (plugin) => { // was: g.lw(this.K, W => { ... })
      if (plugin.initialize()) {
        anyInitialised = true;
      }
    });
    if (anyInitialised) {
      this.J = readyCallback; // was: this.J = Q — store the "ready" callback
      ow(this.W, this);       // was: ow(this.W, this) — wire base plugin
    }
    return anyInitialised;
  }

  /**
   * Dispose of every plugin in the list, then invoke the super-class
   * disposal logic.
   *
   * [was: dispose]
   */
  dispose() { // was: dispose()
    forEach(this.plugins, (plugin) => { // was: g.lw(this.K, Q => { Q.dispose() })
      plugin.dispose();
    });
    super.dispose();
  }

  // ── query methods ─────────────────────────────────────────────────────

  /**
   * Returns `true` if any plugin reports a positive readiness state
   * via its `T2()` method.
   *
   * [was: S]
   * @returns {boolean}
   */
  isAnyReady() { // was: S()
    return Jy(this.plugins, (plugin) => plugin.T2()); // was: Jy(this.K, Q => Q.T2())
  }

  /**
   * Returns `true` if any plugin reports a positive availability state.
   * (Implementation is identical to `isAnyReady`; kept separate for
   * call-site semantics.)
   *
   * [was: A]
   * @returns {boolean}
   */
  isAnyAvailable() { // was: A()
    return Jy(this.plugins, (plugin) => plugin.T2()); // was: Jy(this.K, Q => Q.T2())
  }

  /**
   * Creates a new viewability measurement element observer for the given
   * element, using the base plugin's configuration.
   *
   * @param {Element} element       - DOM element to observe     [was: Q]
   * @param {Object}  config        - measurement configuration  [was: c]
   * @param {Object}  options       - additional options          [was: W]
   * @returns {Object} a measurement observer instance
   *
   * [was: j]
   */
  createObserver(element, config, options) { // was: j(Q, c, W)
    return new ElementGeometryObserver(element, this.W, config, options); // was: new et(Q, this.W, c, W)
  }

  /**
   * Apply an override from an external measurement provider. After this
   * call, `getName()` / `getDebugInfo()` / `getOperationalMode()` will
   * delegate to the override's plugin reference.
   *
   * @param {Object} provider - provider carrying an `.O` plugin ref [was: Q]
   *
   * [was: D]
   */
  applyOverride(provider) { // was: D(Q)
    this.overridePlugin = provider.O; // was: this.O = Q.O
  }
}
