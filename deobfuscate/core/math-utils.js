// Source: base.js lines 486–499, 950–951, 929–948, 1466–1477
// Math and numeric helper utilities extracted from YouTube's web player.

/**
 * Clamp a numeric value between a minimum and maximum (inclusive).
 * @param {number} value The value to clamp.
 * @param {number} min   Lower bound.
 * @param {number} max   Upper bound.
 * @returns {number}
 */
/* was: g.lm */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Mathematical (floored) modulo that always returns a non-negative result
 * when the divisor is positive, unlike JavaScript's remainder operator.
 * @param {number} dividend
 * @param {number} divisor
 * @returns {number}
 */
/* was: g.um */
export function flooredModulo(dividend, divisor) {
  dividend %= divisor;
  return dividend * divisor < 0 ? dividend + divisor : dividend;
}

/**
 * Linearly interpolate between two values.
 * @param {number} a Start value.
 * @param {number} b End value.
 * @param {number} t Interpolation factor (0 = a, 1 = b).
 * @returns {number}
 */
/* was: hP */
export function lerp(a, b, t) {
  return a + t * (b - a);
}

/**
 * Default comparator: returns -1, 0, or 1.
 * @param {*} a
 * @param {*} b
 * @returns {number}
 */
/* was: DS */
export function defaultCompare(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}

/**
 * Numeric comparator (same logic as defaultCompare, kept as a separate
 * reference in the original source).
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
/* was: H0 */
export function compareNumbers(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Compare two dot-separated version strings (e.g. "3.12.1" vs "3.9.0").
 * Each segment is compared numerically first, then lexicographically for
 * any non-digit suffix.
 * @param {string} version1
 * @param {string} version2
 * @returns {number} Negative if version1 < version2, positive if greater, 0 if equal.
 */
/* was: g.N$ */
export function compareVersions(version1, version2) {
  let result = 0;
  const parts1 = String(version1).trim().split(".");
  const parts2 = String(version2).trim().split(".");
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; result === 0 && i < maxLen; i++) {
    let seg1 = parts1[i] || "";
    let seg2 = parts2[i] || "";
    do {
      seg1 = /(\d*)(\D*)(.*)/.exec(seg1) || ["", "", "", ""];
      seg2 = /(\d*)(\D*)(.*)/.exec(seg2) || ["", "", "", ""];
      if (seg1[0].length === 0 && seg2[0].length === 0)
        break;
      result =
        compareNumbers(
          seg1[1].length === 0 ? 0 : parseInt(seg1[1], 10),
          seg2[1].length === 0 ? 0 : parseInt(seg2[1], 10)
        ) ||
        compareNumbers(seg1[2].length === 0, seg2[2].length === 0) ||
        compareNumbers(seg1[2], seg2[2]);
      seg1 = seg1[3];
      seg2 = seg2[3];
    } while (result === 0);
  }
  return result;
}

/**
 * Strict equality check (used as the default element comparator for arrays).
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
/* was: e_O */
export function strictEquals(a, b) {
  return a === b;
}

/**
 * Hash a string to a 32-bit unsigned integer (Java-style hashCode).
 * @param {string} str
 * @returns {number}
 */
/* was: (anonymous, line ~1379) */
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; ++i)
    hash = (31 * hash + str.charCodeAt(i)) >>> 0;
  return hash;
}

/**
 * Convert a string to a number, returning NaN for blank / whitespace-only strings.
 * @param {string} str
 * @returns {number}
 */
/* was: ZQ */
export function toNumber(str) {
  const num = Number(str);
  return num === 0 && /^[\s\xa0]*$/.test(str) ? NaN : num;
}

/**
 * Size with width/height. [was: g.JP]
 */
export class Size {
  constructor(width = 0, height = 0) {
    this.width = width;
    this.height = height;
  }
}

/**
 * Compare two Size objects for equality. [was: g.Rg]
 */
export function sizeEquals(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.width === b.width && a.height === b.height;
}
