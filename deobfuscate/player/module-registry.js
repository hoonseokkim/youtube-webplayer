/**
 * Module Registry — registration and lookup of player modules by name.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Registry map:       line ~104515  (var ao = new Map)
 *   Register function:  lines ~48505-48508  (g.GN)
 *
 * Modules are registered via `registerModule("name", ModuleClass)` and
 * looked up by name at runtime when the player constructs its module graph.
 *
 * [was: ao (Map), g.GN (register function)]
 */

/**
 * Global map from module name to module class constructor.
 * @type {Map<string, typeof import('./base-module.js').PlayerModule>}
 */
/* was: ao */
const moduleRegistry = new Map();

/**
 * Registers a player module class under the given name.
 *
 * If a module with the same name already exists it is silently
 * overwritten (the original code calls `ao.get(Q)` before `ao.set(Q, c)`
 * but discards the result).
 *
 * Usage:
 * ```js
 * registerModule('captions', class extends PlayerModule {
 *   create() { … }
 *   load()   { … }
 *   unload() { … }
 * });
 * ```
 *
 * @param {string}   name         The module identifier.
 * @param {Function} moduleClass  A class that extends {@link PlayerModule}.
 */
/* was: g.GN */
export function registerModule(name, moduleClass) {
  moduleRegistry.get(name); // original no-op lookup preserved for fidelity
  moduleRegistry.set(name, moduleClass);
}

/**
 * Returns the module class registered under the given name, or
 * `undefined` if no module has been registered with that name.
 *
 * @param {string} name
 * @returns {Function|undefined}
 */
export function getModule(name) {
  return moduleRegistry.get(name);
}

/**
 * Returns the underlying registry map (read-only access for debugging).
 * @returns {Map<string, Function>}
 */
export function getRegistry() {
  return moduleRegistry;
}
