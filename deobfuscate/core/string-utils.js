// Source: player_es6.vflset/en_US/base.js, lines ~908–930, ~1357–1416, ~1365–1406
// String operation utilities extracted and deobfuscated from YouTube's base.js

/**
 * Check if a string starts with a given prefix.
 * @param {string} str
 * @param {string} prefix
 * @returns {boolean}
 */
/* was: x9 */
export function startsWith(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
}

/**
 * Check if a string ends with a given suffix.
 * @param {string} str
 * @param {string} suffix
 * @returns {boolean}
 */
/* was: q$ */
export function endsWith(str, suffix) {
  const index = str.length - suffix.length;
  return index >= 0 && str.indexOf(suffix, index) == index;
}

/**
 * Check if a string is empty or contains only whitespace (including non-breaking space).
 * @param {string} str
 * @returns {boolean}
 */
/* was: g.n9 */
export function isEmptyOrWhitespace(str) {
  return /^[\s\xa0]*$/.test(str);
}

/**
 * Check if a string contains a given substring.
 * @param {string} str
 * @param {string} substr
 * @returns {boolean}
 */
/* was: g.D7 */
export function contains(str, substr) {
  return str.indexOf(substr) != -1;
}

/**
 * Case-insensitive substring containment check.
 * @param {string} str
 * @param {string} substr
 * @returns {boolean}
 */
/* was: tv */
export function containsIgnoreCase(str, substr) {
  return contains(str.toLowerCase(), substr.toLowerCase());
}

/**
 * Convert a value to a string, returning empty string for null/undefined.
 * @param {*} value
 * @returns {string}
 */
/* was: g.yC */
export function toString(value) {
  return value == null ? '' : String(value);
}

/**
 * Compute a simple hash code for a string (Java-style).
 * @param {string} str
 * @returns {number}
 */
/* was: SS */
export function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; ++i) {
    hash = (31 * hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Parse a string to a number, returning NaN for whitespace-only strings.
 * @param {string} str
 * @returns {number}
 */
/* was: ZQ */
export function toNumber(str) {
  const num = Number(str);
  return num == 0 && isEmptyOrWhitespace(str) ? NaN : num;
}

/**
 * Convert a hyphen-separated string to camelCase.
 * e.g. "font-size" -> "fontSize"
 * @param {string} str
 * @returns {string}
 */
/* was: Ey */
export function toCamelCase(str) {
  return String(str).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}

/**
 * Return the kebab-case constant "google-av-inapp".
 *
 * The original `sy` was a zero-argument function that always returned this
 * fixed string — it was NOT a general-purpose camelCase-to-kebab converter.
 *
 * @returns {string}
 */
/* was: sy */
export function toKebabCase() {
  return "googleAvInapp".replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Capitalize the first letter of each word in a string.
 * @param {string} str
 * @returns {string}
 */
/* was: G7d */
export function capitalizeWords(str) {
  return str.replace(RegExp('(^|[\\s]+)([a-z])', 'g'), (_match, space, letter) => {
    return space + letter.toUpperCase();
  });
}

/**
 * Split a string on the first colon, returning at most 2 parts.
 * e.g. "a:b:c" -> ["a", "b:c"]
 * @param {string} str
 * @returns {string[]}
 */
/* was: $XR */
export function splitOnFirstColon(str) {
  let remaining = 1;
  const parts = str.split(':');
  const result = [];
  while (remaining > 0 && parts.length) {
    result.push(parts.shift());
    remaining--;
  }
  if (parts.length) {
    result.push(parts.join(':'));
  }
  return result;
}

/**
 * HTML-escape a string, converting &, <, >, ", ', and null bytes to entities.
 * @param {string} str
 * @returns {string}
 */
/* was: im */
export function escapeHtml(str) {
  // Only process if the string contains any characters that need escaping
  if (/[&<>"'\0]/.test(str)) {
    if (str.indexOf('&') != -1) str = str.replace(/&/g, '&amp;');
    if (str.indexOf('<') != -1) str = str.replace(/</g, '&lt;');
    if (str.indexOf('>') != -1) str = str.replace(/>/g, '&gt;');
    if (str.indexOf('"') != -1) str = str.replace(/"/g, '&quot;');
    if (str.indexOf("'") != -1) str = str.replace(/'/g, '&#39;');
    if (str.indexOf('\x00') != -1) str = str.replace(/\0/g, '&#0;');
  }
  return str;
}

/**
 * Encode a string to a UTF-8 byte array.
 * @param {string} str
 * @returns {number[]}
 */
/* was: g.Gk */
export function stringToUtf8ByteArray(str) {
  const bytes = [];
  let pos = 0;
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 128) {
      bytes[pos++] = code;
    } else if (code < 2048) {
      bytes[pos++] = (code >> 6) | 192;
      bytes[pos++] = (code & 63) | 128;
    } else {
      if ((code & 0xfc00) == 0xd800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) == 0xdc00) {
        // Surrogate pair
        code = 0x10000 + ((code & 0x3ff) << 10) + (str.charCodeAt(++i) & 0x3ff);
        bytes[pos++] = (code >> 18) | 240;
        bytes[pos++] = ((code >> 12) & 63) | 128;
      } else {
        bytes[pos++] = (code >> 12) | 224;
      }
      bytes[pos++] = ((code >> 6) & 63) | 128;
      bytes[pos++] = (code & 63) | 128;
    }
  }
  return bytes;
}

/**
 * Convert a hex string to a byte array.
 * @param {string} hex
 * @returns {number[]}
 */
/* was: aa */
export function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

/**
 * Convert a byte array to a hex string.
 * @param {Uint8Array|number[]} bytes
 * @returns {string}
 */
/* was: qvW */
export function bytesToHex(bytes) {
  return Array.prototype.map
    .call(bytes, (byte) => {
      const hex = byte.toString(16);
      return hex.length > 1 ? hex : '0' + hex;
    })
    .join('');
}

/**
 * Replace $KEY placeholders in a template string. [was: g.LQ]
 */
export function replaceTemplateVars(template, replacements) {
  for (const [key, value] of Object.entries(replacements)) {
    template = template.replace(new RegExp('\\$' + key, 'gi'), String(value));
  }
  return template;
}
