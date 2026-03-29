// Source: base.js lines 954–1091, 1418–1441
// Browser and platform detection utilities extracted from YouTube's web player.
//
// NOTE: Several of these functions depend on module-level state from the
// original bundle (Client Hints data, experiment flags, etc.).  The helpers
// below are written to be self-contained where possible; a few require the
// caller to supply the userAgent or Client Hints object.

// ---------------------------------------------------------------------------
// Module-level state — cached Client Hints data
// [was: yA, Sf, FW]
//
// The original code reads navigator.userAgentData once at module load time
// and caches it in `FW`. The experiment flags `yA` and `Sf` gate whether
// Client Hints are used at all. We simplify by always reading
// navigator.userAgentData (the flags are not available outside the bundle).
// ---------------------------------------------------------------------------

/** @type {?NavigatorUAData} Cached Client Hints data [was: FW] */
import { seekToElement } from '../media/format-parser.js'; // was: rv
import { forEach } from './event-registration.js';
let _clientHintsData = null;
{
  const _nav = globalThis.navigator;
  _clientHintsData = _nav ? _nav.userAgentData || null : null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Return the current user-agent string, or "" if unavailable.
 * @returns {string}
 */
/* was: g.iC */
export function getUserAgent() {
  const nav = globalThis.navigator;
  return nav?.userAgent ?? "";
}

/**
 * Check whether the UA string contains a given substring.
 * @param {string} substr
 * @returns {boolean}
 */
/* was: Es */
export function uaContains(substr) {
  return getUserAgent().includes(substr);
}

/**
 * Return true when Client Hints data is available and has brand entries.
 * Uses the module-level cached `_clientHintsData` [was: FW].
 * @returns {boolean}
 */
/* was: dT */
export function hasClientHintsBrands() {
  return !!_clientHintsData && _clientHintsData.brands.length > 0;
}

/**
 * Check whether any Client Hints brand entry contains a substring.
 * Uses the module-level cached `_clientHintsData` [was: FW].
 * @param {string} substr
 * @returns {boolean}
 */
/* was: Z7 */
export function clientHintsBrandContains(substr) {
  if (!_clientHintsData)
    return false;
  for (let i = 0; i < _clientHintsData.brands.length; i++) {
    const { brand } = _clientHintsData.brands[i];
    if (brand && brand.includes(substr))
      return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Browser checks
// ---------------------------------------------------------------------------

/**
 * Detect Opera (legacy, pre-Chromium).
 * @returns {boolean}
 */
/* was: L9 */
export function isOpera() {
  return hasClientHintsBrands() ? false : uaContains("Opera");
}

/**
 * Detect Internet Explorer (any version, including Trident-based IE 11).
 * @returns {boolean}
 */
/* was: bC */
export function isIE() {
  return hasClientHintsBrands() ? false : uaContains("Trident") || uaContains("MSIE");
}

/**
 * Detect Microsoft Edge (Chromium-based or legacy).
 * @returns {boolean}
 */
/* was: jf */
export function isEdge() {
  return hasClientHintsBrands()
    ? clientHintsBrandContains("Microsoft Edge")
    : uaContains("Edg/");
}

/**
 * Detect Firefox (desktop or iOS).
 * @returns {boolean}
 */
/* was: gT */
export function isFirefox() {
  return uaContains("Firefox") || uaContains("FxiOS");
}

/**
 * Detect Safari (excludes Chrome, Edge, Opera, Firefox, Silk, Android browser).
 * @returns {boolean}
 */
/* was: f9 */
export function isSafari() {
  return (
    uaContains("Safari") &&
    !isChrome() &&
    !(hasClientHintsBrands() ? false : uaContains("Coast")) &&
    !isOpera() &&
    !(hasClientHintsBrands() ? false : uaContains("Edge")) &&
    !isEdge() &&
    !(hasClientHintsBrands() ? clientHintsBrandContains("Opera") : uaContains("OPR")) &&
    !isFirefox() &&
    !uaContains("Silk") &&
    !uaContains("Android")
  );
}

/**
 * Detect Chromium-based browsers (Chrome, CriOS, Silk, HeadlessChrome).
 * @returns {boolean}
 */
/* was: Os */
export function isChrome() {
  return hasClientHintsBrands()
    ? clientHintsBrandContains("Chromium")
    : (uaContains("Chrome") || uaContains("CriOS")) &&
        !(hasClientHintsBrands() ? false : uaContains("Edge")) ||
      uaContains("Silk");
}

/**
 * Detect the stock Android browser (not Chrome, Firefox, Opera, or Silk).
 * @returns {boolean}
 */
/* was: v0 */
export function isAndroidBrowser() {
  return uaContains("Android") && !isChrome() && !isFirefox() && !isOpera() && !uaContains("Silk");
}

// ---------------------------------------------------------------------------
// Platform checks
// ---------------------------------------------------------------------------

/**
 * Return true when Client Hints platform data is available.
 * Uses the module-level cached `_clientHintsData` [was: FW].
 * @returns {boolean}
 */
/* was: wO */
export function hasClientHintsPlatform() {
  return !!_clientHintsData && !!_clientHintsData.platform;
}

/**
 * Detect Android (via Client Hints or UA string).
 * Uses the module-level cached `_clientHintsData` [was: FW].
 * @returns {boolean}
 */
/* was: bm */
export function isAndroid() {
  return hasClientHintsPlatform()
    ? _clientHintsData.platform === "Android"
    : uaContains("Android");
}

/**
 * Detect iPhone (excludes iPod and iPad).
 * @returns {boolean}
 */
/* was: jS */
export function isIPhone() {
  return uaContains("iPhone") && !uaContains("iPod") && !uaContains("iPad");
}

/**
 * Detect any iOS device (iPhone, iPad, or iPod).
 * @returns {boolean}
 */
/* was: gO */
export function isIOS() {
  return isIPhone() || uaContains("iPad") || uaContains("iPod");
}

/**
 * Detect macOS (via Client Hints or UA string).
 * @returns {boolean}
 */
/* was: Oy */
export function isMacOS() {
  return hasClientHintsPlatform()
    ? _clientHintsData.platform === "macOS"
    : uaContains("Macintosh");
}

/**
 * Detect Windows (via Client Hints or UA string).
 * @returns {boolean}
 */
/* was: fR */
export function isWindows() {
  return hasClientHintsPlatform()
    ? _clientHintsData.platform === "Windows"
    : uaContains("Windows");
}

// ---------------------------------------------------------------------------
// Version helpers
// ---------------------------------------------------------------------------

/**
 * Get the major version number of a named browser, or NaN if not detected.
 * Uses Client Hints when available, falls back to UA-string parsing.
 * @param {string} browserName One of "Chromium", "Firefox", "Safari",
 *                             "Microsoft Edge", "Opera", "Android Browser",
 *                             "Internet Explorer", "Silk".
 * @returns {number}
 */
/* was: ac */
export function getBrowserMajorVersion(browserName) {
  if (hasClientHintsBrands() && browserName !== "Silk") {
    const entry = _clientHintsData.brands.find(({ brand }) => brand === browserName);
    if (!entry || !entry.version)
      return NaN;
    const parts = entry.version.split(".");
    return parts.length === 0 ? NaN : Number(parts[0]);
  }
  const versionStr = getBrowserVersionString(browserName);
  if (versionStr === "")
    return NaN;
  const parts = versionStr.split(".");
  return parts.length === 0 ? NaN : Number(parts[0]);
}

// ---------------------------------------------------------------------------
// Internal: full version string from UA (used by getBrowserMajorVersion)
// ---------------------------------------------------------------------------

/**
 * Build a lookup function from parsed UA product tokens.
 * @param {Array} tokens Array of [name, version, detail] tuples.
 * @returns {Function} Accepts an array of candidate product names, returns
 *                     the version string of the first match or "".
 */
/* was: yyw */
function buildProductLookup(tokens) {
  const map = {};
  tokens.forEach((entry) => {
    map[entry[0]] = entry[1];
  });
  return (candidates) => map[candidates.find((name) => name in map)] || "";
}

/**
 * Extract the full version string for a given browser name from the UA.
 * @param {string} browserName
 * @returns {string}
 */
/* was: SOx */
function getBrowserVersionString(browserName) {
  let ua = getUserAgent();

  if (browserName === "Internet Explorer") {
    if (isIE()) {
      let match = /seekToElement: *([\d.]*)/.exec(ua);
      if (match?.[1])
        return match[1];

      let version = "";
      const msieMatch = /MSIE +([\d.]+)/.exec(ua);
      if (msieMatch?.[1]) {
        const tridentMatch = /Trident\/(\d.\d)/.exec(ua);
        if (msieMatch[1] === "7.0") {
          if (tridentMatch?.[1]) {
            switch (tridentMatch[1]) {
              case "4.0": version = "8.0"; break;
              case "5.0": version = "9.0"; break;
              case "6.0": version = "10.0"; break;
              case "7.0": version = "11.0"; break;
            }
          } else {
            version = "7.0";
          }
        } else {
          version = msieMatch[1];
        }
      }
      return version;
    }
    return "";
  }

  const productRe = /([A-Z][\w ]+)\/([\S]+)\s*(?:\((.*?)\))?/g;
  const tokens = [];
  let m;
  while ((m = productRe.exec(ua)))
    tokens.push([m[1], m[2], m[3] ?? undefined]);

  const lookup = buildProductLookup(tokens);

  switch (browserName) {
    case "Opera":
      if (isOpera()) return lookup(["Version", "Opera"]);
      if (hasClientHintsBrands() ? clientHintsBrandContains("Opera") : uaContains("OPR"))
        return lookup(["OPR"]);
      break;
    case "Microsoft Edge":
      if (hasClientHintsBrands() ? false : uaContains("Edge"))
        return lookup(["Edge"]);
      if (isEdge()) return lookup(["Edg"]);
      break;
    case "Chromium":
      if (isChrome()) return lookup(["Chrome", "CriOS", "HeadlessChrome"]);
      break;
  }

  if (
    (browserName === "Firefox" && isFirefox()) ||
    (browserName === "Safari" && isSafari()) ||
    (browserName === "Android Browser" && isAndroidBrowser()) ||
    (browserName === "Silk" && uaContains("Silk"))
  ) {
    const fallback = tokens[2];
    return fallback?.[1] || "";
  }

  return "";
}

/**
 * Chrome/Chromium browser detection flag (evaluated once at load time).
 * Distinct from the isChrome() function [was: Os] which checks Client Hints.
 * [was: g.Am]
 */
export const isChromeFlag = /Chrome|CriOS|Silk/.test(
  typeof navigator !== 'undefined' ? navigator.userAgent : ''
) && !/Edge/.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');

// ---------------------------------------------------------------------------
// Module-load-time browser/platform flags (evaluated once)
// These mirror the original `g.XX = ...` assignments at lines 57286-57335.
// ---------------------------------------------------------------------------

/**
 * True if running on Android (evaluated once at load time).
 * [was: g.Lh]  — original: `g.Lh = bm()`
 * @type {boolean}
 */
export const isAndroidFlag = isAndroid(); // [was: g.Lh]

/**
 * True if running IE or Edge (evaluated once at load time).
 * [was: g.LD]  — original: `g.LD = g.rU || g.Fr`
 * @type {boolean}
 */
export const isIEOrEdgeFlag = isEdge() || isIE(); // [was: g.LD]

/**
 * True if running Safari but NOT iOS (evaluated once at load time).
 * [was: g.v8]  — original: `g.v8 = f9() && !gO()`
 * @type {boolean}
 */
export const isSafariDesktopFlag = isSafari() && !isIOS(); // [was: g.v8]
