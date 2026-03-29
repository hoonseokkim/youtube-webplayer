/**
 * Array manipulation utilities.
 * Deobfuscated from: player_es6.vflset/en_US/base.js, lines ~299-430, 4755-4765
 */

import { isArrayLike } from "./type-helpers.js";
import { dispose } from '../ads/dai-cue-range.js';

/**
 * Returns the last element of an array-like value.
 * @param {Array|ArrayLike} arr
 * @returns {*}
 */
/* was: g.v3 */
export function lastElement(arr) {
  return arr[arr.length - 1];
}

/**
 * Iterates over each element of an array-like value, calling `callback(element, index, arr)`.
 * @param {Array|ArrayLike} arr
 * @param {Function} callback
 * @param {*} [context] - The `this` value for `callback`.
 */
/* was: g.lw */
export function forEach(arr, callback, context) {
  Array.prototype.forEach.call(arr, callback, context);
}

/**
 * Iterates over an array-like value in reverse order.
 * @param {Array|ArrayLike} arr
 * @param {Function} callback - Called with `(element, index, arr)`.
 */
/* was: ryW */
export function forEachRight(arr, callback) {
  const len = arr.length;
  const items = typeof arr === "string" ? arr.split("") : arr;
  for (let i = len - 1; i >= 0; --i) {
    if (i in items) {
      callback.call(undefined, items[i], i, arr);
    }
  }
}

/**
 * Returns a new array containing only elements for which `callback` returns truthy.
 * Operates on array-like values via `Array.prototype.filter`.
 * @param {Array|ArrayLike} arr
 * @param {Function} callback
 * @param {*} [context]
 * @returns {Array}
 */
/* was: g.uw */
export function filter(arr, callback, context) {
  return Array.prototype.filter.call(arr, callback, context);
}

/**
 * Returns a new array produced by calling `callback(element, index, arr)` on each element.
 * @param {Array|ArrayLike} arr
 * @param {Function} callback
 * @param {*} [context]
 * @returns {Array}
 */
/* was: g.hy */
export function map(arr, callback, context) {
  return Array.prototype.map.call(arr, callback, context);
}

/**
 * Reduces an array-like value using a standard left-fold.
 * @param {Array|ArrayLike} arr
 * @param {Function} callback
 * @param {*} initialValue
 * @returns {*}
 */
/* was: C7 */
export function reduceLeft(arr, callback, initialValue) {
  return Array.prototype.reduce.call(arr, callback, initialValue);
}

/**
 * Returns `true` if `callback` returns truthy for at least one element
 * (calls `Array.prototype.some`).
 * @param {Array|ArrayLike} arr
 * @param {Function} callback
 * @returns {boolean}
 */
/* was: Jy */
export function someUnchecked(arr, callback) {
  return Array.prototype.some.call(arr, callback, undefined);
}

/**
 * Returns `true` if `callback` returns truthy for every element
 * (calls `Array.prototype.every`).
 * @param {Array|ArrayLike} arr
 * @param {Function} callback
 * @param {*} [context]
 * @returns {boolean}
 */
/* was: g.RW */
export function every(arr, callback, context) {
  return Array.prototype.every.call(arr, callback, context);
}

/**
 * Finds the first element for which `callback` returns truthy, or `null` if none match.
 * @param {Array|ArrayLike} arr
 * @param {Function} callback
 * @param {*} [context]
 * @returns {*}
 */
/* was: g.Yx */
export function find(arr, callback, context) {
  const idx = findIndex(arr, callback, context);
  if (idx < 0) return null;
  return typeof arr === "string" ? arr.charAt(idx) : arr[idx];
}

/**
 * Returns the index of the first element for which `callback` returns truthy, or -1.
 * @param {Array|ArrayLike} arr
 * @param {Function} callback
 * @param {*} [context]
 * @returns {number}
 */
/* was: kx */
export function findIndex(arr, callback, context) {
  const len = arr.length;
  const items = typeof arr === "string" ? arr.split("") : arr;
  for (let i = 0; i < len; i++) {
    if (i in items && callback.call(context, items[i], i, arr)) {
      return i;
    }
  }
  return -1;
}

/**
 * Returns the index of the last element for which `callback` returns truthy, or -1.
 * @param {Array|ArrayLike} arr
 * @param {Function} callback
 * @param {*} [context]
 * @returns {number}
 */
/* was: g.p7 */
export function findLastIndex(arr, callback, context) {
  const len = arr.length;
  const items = typeof arr === "string" ? arr.split("") : arr;
  for (let i = len - 1; i >= 0; i--) {
    if (i in items && callback.call(context, items[i], i, arr)) {
      return i;
    }
  }
  return -1;
}

/**
 * Returns `true` if `arr` contains `value` (using `indexOf`).
 * @param {Array|ArrayLike} arr
 * @param {*} value
 * @returns {boolean}
 */
/* was: g.c9 */
export function contains(arr, value) {
  return Array.prototype.indexOf.call(arr, value, undefined) >= 0;
}

/**
 * Removes the first occurrence of `value` from `arr`.
 * Returns `true` if the element was found and removed.
 * @param {Array} arr
 * @param {*} value
 * @returns {boolean}
 */
/* was: g.o0 */
export function remove(arr, value) {
  const idx = Array.prototype.indexOf.call(arr, value, undefined);
  let found;
  (found = idx >= 0) && removeAt(arr, idx);
  return found;
}

/**
 * Removes the element at `index` from `arr` using splice.
 * Returns `true` if exactly one element was removed.
 * @param {Array} arr
 * @param {number} index
 * @returns {boolean}
 */
/* was: g.Ta */
export function removeAt(arr, index) {
  return Array.prototype.splice.call(arr, index, 1).length === 1;
}

/**
 * Removes the first element matching `callback` from `arr`.
 * @param {Array} arr
 * @param {Function} callback
 */
/* was: g.rZ */
export function removeByPredicate(arr, callback) {
  const idx = findIndex(arr, callback);
  if (idx >= 0) {
    removeAt(arr, idx);
  }
}

/**
 * Removes all elements matching `callback` from `arr` (iterates in reverse for safety).
 * @param {Array} arr
 * @param {Function} callback
 */
/* was: UX3 */
export function removeAll(arr, callback) {
  let count = 0;
  forEachRight(arr, function (element, index) {
    if (callback.call(undefined, element, index, arr) && removeAt(arr, index)) {
      count++;
    }
  });
}

/**
 * Flattens arguments into a single array via `Array.prototype.concat`.
 * @param {...*} arrays
 * @returns {Array}
 */
/* was: g.I0 */
export function concat(...arrays) {
  return Array.prototype.concat.apply([], arrays);
}

/**
 * Returns a shallow copy of an array-like value.
 * @param {Array|ArrayLike} arr
 * @returns {Array}
 */
/* was: g.Xi */
export function toArray(arr) {
  const len = arr.length;
  if (len > 0) {
    const result = new Array(len);
    for (let i = 0; i < len; i++) {
      result[i] = arr[i];
    }
    return result;
  }
  return [];
}

/**
 * Extends `arr` by pushing individual elements or flattening array-like arguments.
 * @param {Array} arr - The array to extend (mutated in place).
 * @param {...*} values - Values or arrays to append.
 */
/* was: g.AH */
export function extend(arr, ...values) {
  for (const value of values) {
    if (isArrayLike(value)) {
      const base = arr.length || 0;
      const addLen = value.length || 0;
      arr.length = base + addLen;
      for (let i = 0; i < addLen; i++) {
        arr[base + i] = value[i];
      }
    } else {
      arr.push(value);
    }
  }
}

/**
 * General splice wrapper. Passes all arguments (from index onward) to
 * `Array.prototype.splice`. Can insert, delete, or replace elements.
 * @param {Array} arr
 * @param {number} index - Start position.
 * @param {number} [deleteCount] - Number of elements to remove.
 * @param {...*} [elements] - Elements to insert at `index`.
 */
/* was: g.q9 */
export function splice(arr, index, deleteCount, ...elements) {
  Array.prototype.splice.apply(arr, slice(arguments, 1));
}

/**
 * Returns a slice of an array-like value (wrapper around `Array.prototype.slice`).
 * @param {Array|ArrayLike} arr
 * @param {number} start
 * @param {number} [end]
 * @returns {Array}
 */
/* was: xW */
export function slice(arr, start, end) {
  if (end === undefined) {
    return Array.prototype.slice.call(arr, start);
  }
  return Array.prototype.slice.call(arr, start, end);
}

/**
 * Empties an array-like value by setting `length` to 0.
 * For non-true-arrays, also deletes numeric properties.
 * @param {Array|ArrayLike} arr
 */
/* was: ma */
export function emptyArray(arr) {
  if (!Array.isArray(arr)) {
    for (let i = arr.length - 1; i >= 0; i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
}

/**
 * Disposes of each argument; array-like arguments are recursively expanded.
 * Each non-array item is disposed via `safeDispose`.
 * @param {...*} items
 */
/* was: g.xE */
export function clear(...items) {
  for (const item of items) {
    if (isArrayLike(item)) {
      clear(...item);
    } else {
      safeDispose(item);
    }
  }
}

/**
 * Calls `.dispose()` on a value if it has one (safe no-op otherwise).
 * @param {*} value
 */
/* was: g.BN */
export function safeDispose(value) {
  if (value && typeof value.dispose === "function") {
    value.dispose();
  }
}

/**
 * Binary search for `target` in a sorted array.
 * Returns the index if found, or `-(insertionPoint + 1)` if not found.
 * An optional `comparator` function can be provided; it defaults to
 * numeric/lexicographic comparison.
 *
 * @param {Array} arr     Sorted array.
 * @param {*}     target  Value to search for.
 * @param {Function} [comparator] - `(a, b) => number`.
 * @returns {number}
 */
/* was: g.H9 */
export function binarySearch(arr, target, comparator) {
  let low = 0;
  let high = arr.length;
  const cmp = comparator || ((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  while (low < high) {
    const mid = (low + high) >>> 1;
    const result = cmp(target, arr[mid]);
    if (result > 0) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  // Check for exact match
  if (low < arr.length && cmp(target, arr[low]) === 0) return low;
  return -(low + 1);
}

/**
 * Insert `value` into `arr` at the position that maintains sort order.
 * Uses `binarySearch` to find the insertion point.
 *
 * @param {Array} arr        Sorted array (mutated in place).
 * @param {*}     value      Value to insert.
 * @param {Function} [comparator] - `(a, b) => number`.
 */
/* was: g.S4 */
export function sortedInsert(arr, value, comparator) {
  let idx = binarySearch(arr, value, comparator);
  if (idx < 0) {
    idx = -(idx + 1);
  }
  Array.prototype.splice.call(arr, idx, 0, value);
}
