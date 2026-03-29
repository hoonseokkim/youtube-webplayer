
/**
 * PlayerModule — base class for player modules with lifecycle hooks.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Class definition: lines ~104516-104543  (g.zj)
 *   Extends:          g.W1 (ObservableTarget)
 *
 * Modules are registered via {@link registerModule} and instantiated by
 * the player at startup.  Each module goes through a lifecycle:
 *   1. `create()`  — called once after construction
 *   2. `load()`    — called when the module should activate
 *   3. `unload()`  — called when the module should deactivate
 *   4. `dispose()` — inherited; tears down the module entirely
 *
 * [was: g.zj]
 */

import { ObservableTarget } from '../core/event-target.js';

export class PlayerModule extends ObservableTarget {
  /**
   * Whether the module is currently in the "loaded" state.
   * @type {boolean}
   */
  loaded = false;

  /**
   * Reference to the player API / controller instance.
   * @type {Object}
   */
  player;

  /**
   * @param {Object} player  The player API instance.
   */
  constructor(player) {
    super();
    this.loaded = false;
    this.player = player;
  }

  /**
   * One-time initialisation hook. Called after construction.
   * Subclasses override to perform setup that needs the player reference.
   */
  create() {}

  /**
   * Activates the module. Sets `loaded` to `true`.
   * Subclasses should call `super.load()` and then perform activation work.
   */
  load() {
    this.loaded = true;
  }

  /**
   * Deactivates the module. Sets `loaded` to `false`.
   * Subclasses should perform teardown work and then call `super.unload()`.
   */
  unload() {
    this.loaded = false;
  }

  /**
   * Notification hook — called when the player state changes.
   * Subclasses override as needed.
   */
  /* was: aI */
  onStateChange() {}

  /**
   * Returns whether this module supports the current context.
   * Default implementation returns `true`.
   *
   * @returns {boolean}
   */
  /* was: GS */
  isSupported() {
    return true;
  }

  /** @override */
  /* was: WA */
  disposeInternal() {
    if (this.loaded) {
      this.unload();
    }
    super.disposeInternal();
  }

  /**
   * Returns the module's option values as a plain object.
   *
   * @returns {Object}
   */
  /* was: wA */
  getOptionValues() {
    return {};
  }

  /**
   * Returns the list of option keys this module exposes.
   *
   * @returns {string[]}
   */
  getOptions() {
    return [];
  }
}
