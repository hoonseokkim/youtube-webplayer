/**
 * Type checking and fundamental helper utilities.
 * Deobfuscated from: player_es6.vflset/en_US/base.js, lines ~160-230
 */

/**
 * Returns a refined typeof string: "array", "null", or the standard typeof result.
 * @param {*} value
 * @returns {string}
 */
/* was: NX */
export function typeOf(value) {
  const t = typeof value;
  if (t !== "object") return t;
  if (!value) return "null";
  if (Array.isArray(value)) return "array";
  return t;
}

/**
 * Checks whether a value is "array-like" (an array, or an object with a numeric `length`).
 * @param {*} value
 * @returns {boolean}
 */
/* was: g.iw */
export function isArrayLike(value) {
  const t = typeOf(value);
  return t === "array" || (t === "object" && typeof value.length === "number");
}

/**
 * Checks whether a value is a non-null object or a function.
 * Used throughout the player to guard property access on values that might be primitives.
 * @param {*} value
 * @returns {boolean}
 */
/* was: g.Sd */
export function isObject(value) {
  const t = typeof value;
  return (t === "object" && value != null) || t === "function";
}

/**
 * Returns a unique integer ID for the given object, assigning one if it does not already have one.
 * IDs are stored as a property keyed by `FK` (a Closure-style UID property name).
 * @param {Object} obj
 * @returns {number}
 */
/* was: g.ZR */
export function getUid(obj) {
  return Object.prototype.hasOwnProperty.call(obj, UID_PROPERTY) && obj[UID_PROPERTY] ||
    (obj[UID_PROPERTY] = ++uidCounter);
}

/** @private  Property key used for unique IDs (was: FK) */
const UID_PROPERTY = "closure_uid_" + ((Math.random() * 1e9) >>> 0);

/** @private  Monotonic counter for unique IDs (was: KmR) */
let uidCounter = 0;

/**
 * Binds a function to a context and optional leading arguments (partial application).
 * @param {Function} fn - The function to partially apply.
 * @param {...*} boundArgs - Arguments to prepend when the returned function is called.
 * @returns {Function}
 */
/* was: g.sO */
export function partial(fn, ...boundArgs) {
  return function (...callArgs) {
    const args = [...boundArgs, ...callArgs];
    return fn.apply(this, args);
  };
}

/**
 * Returns the current timestamp in milliseconds (wrapper around `Date.now`).
 * @returns {number}
 */
/* was: g.d0 */
export function now() {
  return Date.now();
}

/**
 * Sets up prototype-chain inheritance from `child` to `parent`.
 * Also installs a static `m7` helper on `child` for calling overridden parent methods.
 * @param {Function} child  - The child constructor.
 * @param {Function} parent - The parent constructor.
 */
/* was: g.bw */
export function inherits(child, parent) {
  /** @constructor */
  function Bridge() {}
  Bridge.prototype = parent.prototype;

  child.FS = parent.prototype;           // "superClass_" reference
  child.prototype = new Bridge();
  child.prototype.constructor = child;

  /**
   * Calls a parent method in the context of an instance.
   * @param {Object} instance
   * @param {string} methodName
   * @param {...*} args
   * @returns {*}
   */
  child.m7 = function (instance, methodName, ...args) {
    return parent.prototype[methodName].apply(instance, args);
  };
}

/**
 * Resolves a dot-separated property path on an object (e.g. "a.b.c").
 * Returns `null` if any segment along the path is nullish.
 * @param {string} path
 * @param {Object} [root] - Defaults to the global object when omitted.
 * @returns {*}
 */
/* was: g.DR */
export function getObjectByPath(path, root) {
  const parts = path.split(".");
  let current = root ?? globalThis;
  for (let i = 0; i < parts.length; i++) {
    current = current[parts[i]];
    if (current == null) return null;
  }
  return current;
}

/**
 * Binds a function to a given `this` context (internal bind helper used before `g.sO`).
 * @param {Function} fn
 * @param {Object} context
 * @param {...*} args
 * @returns {Function}
 */
/* was: g.EO (delegates to T0d) */
export function bind(fn, context, ...args) {
  return fn.call.apply(fn.bind, [fn, context, ...args]);
}
