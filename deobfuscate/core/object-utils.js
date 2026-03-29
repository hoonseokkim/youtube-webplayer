// Source: base.js lines 530–669
// Object iteration and manipulation utilities extracted from YouTube's web player.

/**
 * IE-safe property names that Object.prototype.hasOwnProperty must be checked for explicitly.
 * @type {string[]}
 */
import { removeAdBreakCueRanges } from '../ads/dai-cue-range.js'; // was: M9
const IE_NON_ENUMERABLE_KEYS = /* was: removeAdBreakCueRanges */
  "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");

/**
 * Iterate over every own-enumerable entry of an object.
 * @param {Object} obj        The source object.
 * @param {Function} callback Called with (value, key, obj).
 * @param {*} [thisArg]       Optional `this` binding for the callback.
 */
/* was: g.ZS */
export function forEachObject(obj, callback, thisArg) {
  for (const key in obj)
    callback.call(thisArg, obj[key], key, obj);
}

/**
 * Return a new object containing only the entries that pass a predicate.
 * @param {Object} obj        The source object.
 * @param {Function} predicate Called with (value, key, obj); return truthy to keep.
 * @param {*} [thisArg]       Optional `this` binding for the predicate.
 * @returns {Object}
 */
/* was: g.Ev */
export function filterObject(obj, predicate, thisArg) {
  const result = {};
  for (const key in obj)
    if (predicate.call(thisArg, obj[key], key, obj))
      result[key] = obj[key];
  return result;
}

/**
 * Map every entry of an object through a transform function, returning a new object.
 * @param {Object} obj       The source object.
 * @param {Function} mapFn   Called with (value, key, obj); its return value becomes the new value.
 * @returns {Object}
 */
/* was: dZ */
export function mapObject(obj, mapFn) {
  const result = {};
  for (const key in obj)
    result[key] = mapFn.call(undefined, obj[key], key, obj);
  return result;
}

/**
 * Test whether at least one entry of an object passes a predicate.
 * @param {Object} obj        The source object.
 * @param {Function} predicate Called with (value, key, obj).
 * @param {*} [thisArg]       Optional `this` binding.
 * @returns {boolean}
 */
/* was: g.Lm */
export function someObject(obj, predicate, thisArg) {
  for (const key in obj)
    if (predicate.call(thisArg, obj[key], key, obj))
      return true;
  return false;
}

/**
 * Test whether every entry of an object passes a predicate.
 * @param {Object} obj        The source object.
 * @param {Function} predicate Called with (value, key, obj).
 * @returns {boolean}
 */
/* was: wZ */
export function everyObject(obj, predicate) {
  for (const key in obj)
    if (!predicate.call(undefined, obj[key], key, obj))
      return false;
  return true;
}

/**
 * Return the first enumerable key of an object, or undefined if empty.
 * @param {Object} obj
 * @returns {string|undefined}
 */
/* was: g.bD */
export function firstKey(obj) {
  for (const key in obj)
    return key;
}

/**
 * Return the first enumerable value of an object, or undefined if empty.
 * @param {Object} obj
 * @returns {*}
 */
/* was: j4 */
export function firstValue(obj) {
  for (const key in obj)
    return obj[key];
}

/**
 * Collect all own-enumerable values of an object into an array.
 * @param {Object} obj
 * @returns {Array}
 */
/* was: gZ */
export function objectValues(obj) {
  const values = [];
  let i = 0;
  for (const key in obj)
    values[i++] = obj[key];
  return values;
}

/**
 * Collect all own-enumerable keys of an object into an array.
 * @param {Object} obj
 * @returns {string[]}
 */
/* was: g.Ov */
export function objectKeys(obj) {
  const keys = [];
  let i = 0;
  for (const key in obj)
    keys[i++] = key;
  return keys;
}

/**
 * Check whether a non-null object contains a given key.
 * @param {Object} obj
 * @param {string} key
 * @returns {boolean}
 */
/* was: g.fm */
export function hasKey(obj, key) {
  return obj !== null && key in obj;
}

/**
 * Check whether any value in the object loosely equals the target.
 * @param {Object} obj
 * @param {*} target
 * @returns {boolean}
 */
/* was: g.a0 */
export function containsValue(obj, target) {
  for (const key in obj)
    if (obj[key] == target)
      return true;
  return false;
}

/**
 * Find the first key whose entry satisfies a predicate.
 * @param {Object} obj
 * @param {Function} predicate Called with (value, key, obj).
 * @returns {string|undefined}
 */
/* was: Ga */
export function findKey(obj, predicate) {
  for (const key in obj)
    if (predicate.call(undefined, obj[key], key, obj))
      return key;
}

/**
 * Find the first value whose entry satisfies a predicate.
 * @param {Object} obj
 * @param {Function} predicate Called with (value, key, obj).
 * @returns {*}
 */
/* was: $W */
export function findValue(obj, predicate) {
  const key = findKey(obj, predicate);
  return key && obj[key];
}

/**
 * Return true if the object has no enumerable keys.
 * @param {Object} obj
 * @returns {boolean}
 */
/* was: g.P9 */
export function isEmptyObject(obj) {
  for (const _ in obj)
    return false;
  return true;
}

/**
 * Delete all own-enumerable properties from an object (mutates in place).
 * @param {Object} obj
 */
/* was: g.lD */
export function clearObject(obj) {
  for (const key in obj)
    delete obj[key];
}

/**
 * Get a value from an object by key, falling back to a default if the key is absent.
 * @param {Object} obj
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
/* was: g.uD */
export function getWithDefault(obj, key, defaultValue) {
  return obj !== null && key in obj ? obj[key] : defaultValue;
}

/**
 * Shallow-compare two objects for key/value equality (using ===).
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
/* was: g.hH */
export function shallowEquals(a, b) {
  for (const key in a)
    if (!(key in b) || a[key] !== b[key])
      return false;
  for (const key in b)
    if (!(key in a))
      return false;
  return true;
}

/**
 * Create a shallow copy of an object.
 * @param {Object} obj
 * @returns {Object}
 */
/* was: g.za */
export function shallowClone(obj) {
  const clone = {};
  for (const key in obj)
    clone[key] = obj[key];
  return clone;
}

/**
 * Deep-clone a value. Handles primitives, Date, Map, Set, ArrayBuffer views,
 * arrays, plain objects, and objects with a `.clone()` method.
 * @param {*} value
 * @returns {*}
 */
/* was: g.Cm */
export function deepClone(value) {
  if (!value || typeof value !== "object")
    return value;
  if (typeof value.clone === "function")
    return value.clone();
  if (typeof Map !== "undefined" && value instanceof Map)
    return new Map(value);
  if (typeof Set !== "undefined" && value instanceof Set)
    return new Set(value);
  if (value instanceof Date)
    return new Date(value.getTime());

  const copy = Array.isArray(value)
    ? []
    : (typeof ArrayBuffer !== "function" ||
       typeof ArrayBuffer.isView !== "function" ||
       !ArrayBuffer.isView(value) ||
       value instanceof DataView)
      ? {}
      : new value.constructor(value.length);

  for (const key in value)
    copy[key] = deepClone(value[key]);
  return copy;
}

/**
 * Merge one or more source objects into a target (like Object.assign but also
 * copies IE-non-enumerable property names explicitly).
 * @param {Object} target
 * @param {...Object} sources
 */
/* was: g.JH */
export function extendObject(target, ...sources) {
  let key, source;
  for (let i = 0; i < sources.length; i++) {
    source = sources[i];
    for (key in source)
      target[key] = source[key];
    // Explicitly copy properties that older IE did not enumerate.
    for (let j = 0; j < IE_NON_ENUMERABLE_KEYS.length; j++) {
      key = IE_NON_ENUMERABLE_KEYS[j];
      if (Object.prototype.hasOwnProperty.call(source, key))
        target[key] = source[key];
    }
  }
}

/**
 * Invert object keys/values using a key function. [was: g.Fi]
 */
export function invertObject(obj, keyFn, thisArg) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[keyFn.call(thisArg, value, key, obj)] = value;
  }
  return result;
}
