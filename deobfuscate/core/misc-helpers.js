import { objectKeys } from './object-utils.js'; // was: g.Ov
import { filter, slice, remove, clear } from './array-utils.js';
import { getKeys, getValues } from './event-registration.js';
import { HeapEntry } from '../data/storage.js';
import { toString } from './string-utils.js';

/**
 * misc-helpers.js -- Scattered small utility gaps combined into one file:
 *   - Ad tracking event helpers and URL-parameter builders
 *   - Cookie read/write/test utilities
 *   - Property accessor shorthand
 *   - Priority queue (min-heap), typed-array polyfill helpers
 *   - Adler-32 and CRC-32 checksum functions
 *   - Deflate configuration tables and streaming push wrapper
 *   - Redux-like action constants
 *   - Attestation error enum
 *   - Ad renderer name registry (g.Y / endpoint name constants)
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 * Source lines: 6211-6275  (ad-tracking, URL param helpers)
 *              11612-11673 (cookie utils, property accessor)
 *              65132-65234 (PriorityQueue / min-heap)
 *              65466-65559 (Redux init, attestation enum, ad endpoint names)
 *
 * Skipped: 65235-65465 covered by compression/zlib.js
 */

// ===========================================================================
// Part 1 -- Ad tracking event helpers  (lines 6214-6272)
// ===========================================================================

/**
 * Build or retrieve a tracking event entry for a given event name.
 * [was: qyn]
 * @param {Object} tracker  [was: Q]
 * @param {string} eventId  [was: c]
 * @param {Object} options  [was: W] - May include opt_nativeTime, opt_osdId.
 * @returns {Object}
 */
export function getOrCreateTrackingEvent(tracker, eventId, options) { // was: qyn
  let entry = lookupEvent(eventRegistry, eventId); // was: T9(rM, c)
  if (!entry) {
    const nativeTime = options.opt_nativeTime || -1;
    entry = createTrackingEntry(tracker, eventId, getAdType(tracker), nativeTime); // was: P5, xN
    if (options.opt_osdId) {
      entry.osdId = options.opt_osdId; // was: .HA
    }
  }
  return entry;
}

/**
 * Build or retrieve a heartbeat tracking entry.
 * [was: njR]
 * @param {Object} tracker [was: Q]
 * @param {string} eventId [was: c]
 * @returns {Object}
 */
export function getOrCreateHeartbeatEvent(tracker, eventId) { // was: njR
  let entry = lookupEvent(eventRegistry, eventId);
  if (!entry) {
    entry = createTrackingEntry(tracker, eventId, "h", -1);
  }
  return entry;
}

/**
 * Register configurable tracking events if the tracker has a plugin.
 * [was: Diw]
 * @param {Object} tracker  [was: Q]
 * @param {string} eventId  [was: c]
 * @param {Object} options  [was: W] - Contains opt_configurable_tracking_events.
 */
export function registerConfigurableEvents(tracker, eventId, options) { // was: Diw
  const events = options.opt_configurable_tracking_events;
  if (tracker.plugin != null && Array.isArray(events)) { // was: .W
    registerEvents(tracker, events, eventId); // was: miR
  }
}

/**
 * Resolve the external activity event bridge function name.
 * [was: tSx]
 * @param {Object} tracker [was: Q]
 * @returns {string|null}
 */
export function getExternalActivityBridge(tracker) { // was: tSx
  resetState(); // was: rs
  switch (getAdType(tracker)) { // was: xN
    case "b":
      return "ytads.bulleit.triggerExternalActivityEvent";
    case "n":
      return "ima.bridge.triggerExternalActivityEvent";
    case "h":
    case "m":
    case "ml":
      return "ima.common.triggerExternalActivityEvent";
  }
  return null;
}

/**
 * Set the click-through URL tracking identifier on a tracker.
 * [was: sN]
 * @param {Object} tracker     [was: Q]
 * @param {string} clickTarget [was: c]
 */
export function setClickTrackingTarget(tracker, clickTarget) { // was: sN
  if (clickTarget) {
    tracker.clickTarget = clickTarget; // was: .b0
  }
}

/**
 * Append query parameters to a URL, respecting `?adurl=` redirects.
 * [was: d5]
 * @param {string}    url     [was: Q]
 * @param {...string} params  [was: c]
 * @returns {string}
 */
export function appendUrlParams(url, ...params) { // was: d5
  const joined = params.filter(Boolean).join("&");
  if (!joined) return url;
  const adUrlMatch = url.match(/[?&]adurl=/);
  if (adUrlMatch) {
    return (
      url.slice(0, adUrlMatch.index + 1) +
      joined + "&" +
      url.slice(adUrlMatch.index + 1)
    );
  }
  return url + (url.indexOf("?") < 0 ? "?" : "&") + joined;
}

/**
 * Build a single query parameter string `&key=value`, or empty if value is falsy.
 * [was: Ld]
 * @param {string} key   [was: Q]
 * @param {string} value [was: c]
 * @returns {string}
 */
export function buildQueryParam(key, value) { // was: Ld
  return value ? "&" + key + "=" + encodeURIComponent(value) : "";
}

/**
 * Build the User-Agent Client Hints query string from the UA data object.
 * [was: HR0]
 * @param {Object} tracker [was: Q]
 * @returns {string}
 */
export function buildUAClientHintsParams(tracker) { // was: HR0
  const uaData = tracker.uaData; // was: .j
  if (!uaData) return "";

  let params =
    buildQueryParam("uap", uaData.platform) +
    buildQueryParam("uapv", uaData.platformVersion) +
    buildQueryParam("uafv", uaData.uaFullVersion) +
    buildQueryParam("uaa", uaData.architecture) +
    buildQueryParam("uam", uaData.model) +
    buildQueryParam("uab", uaData.bitness);

  if (uaData.fullVersionList) {
    params +=
      "&uafvl=" +
      encodeURIComponent(
        uaData.fullVersionList
          .map(
            (brand) =>
              encodeURIComponent(brand.brand) + ";" + encodeURIComponent(brand.version)
          )
          .join("|")
      );
  }
  if (uaData.wow64 != null) {
    params += "&uaw=" + Number(uaData.wow64);
  }
  return params.slice(1); // strip leading "&"
}

// ===========================================================================
// Part 2 -- Cookie utilities  (lines 11612-11667)
// ===========================================================================

/**
 * Set a Result object to "error" state with an optional value.
 * [was: LSR]
 * @param {Result} result [was: Q]
 * @param {*}      [value=null] [was: c]
 */
export function setResultError(result, value = null) { // was: LSR
  result.state = 2; // was: .A
  result.value = value; // was: .O
}

/**
 * Set a Result object to "success" state with an optional value.
 * [was: wWn]
 * @param {Result} result [was: Q]
 * @param {*}      [value=null] [was: c]
 */
export function setResultSuccess(result, value = null) { // was: wWn
  result.state = 1;
  result.value = value;
}

/**
 * Create a new Result in "error" state.
 * [was: U1]
 * @param {*} [value=null] [was: Q]
 * @returns {Result} [was: rL]
 */
export function createErrorResult(value = null) { // was: U1
  const result = new Result(); // was: rL
  setResultError(result, value);
  return result;
}

/**
 * Create a new Result in "success" state.
 * [was: I2]
 * @param {*} [value=null] [was: Q]
 * @returns {Result} [was: rL]
 */
export function createSuccessResult(value = null) { // was: I2
  const result = new Result();
  setResultSuccess(result, value);
  return result;
}

/**
 * Set a cookie with an optional expiry and domain.
 * [was: g.e$]
 * @param {string}  name     [was: Q]
 * @param {string}  value    [was: c]
 * @param {number}  [maxAge] [was: W] - Seconds.
 * @param {string}  [domain="youtube.com"] [was: m]
 * @param {boolean} [secure=false]          [was: K]
 */
export function setCookie(name, value, maxAge, domain = "youtube.com", secure = false) { // was: g.e$
  if (cookiesDisabled) return; // was: XF
  cookieJar.set("" + name, value, { // was: AE
    maxAge: maxAge, // was: sz
    path: "/",
    domain,
    secure,
  });
}

/**
 * Read a cookie by name.
 * [was: g.V5]
 * @param {string} name       [was: Q]
 * @param {*}      [fallback] [was: c]
 * @returns {string|undefined}
 */
export function getCookie(name, fallback) { // was: g.V5
  if (cookiesDisabled) return undefined;
  return cookieJar.get("" + name, fallback);
}

/**
 * Remove a cookie by name.
 * [was: g.Bn]
 * @param {string} name                 [was: Q]
 * @param {string} [path="/"]           [was: c]
 * @param {string} [domain="youtube.com"] [was: W]
 */
export function removeCookie(name, path = "/", domain = "youtube.com") { // was: g.Bn
  if (cookiesDisabled) return;
  cookieJar.remove("" + name, path, domain);
}

/**
 * Test if cookies are enabled and writable.
 * [was: b3_]
 * @returns {boolean}
 */
export function areCookiesEnabled() { // was: b3_
  if (!cookieJar.isEnabled()) return false;
  if (!cookieJar.isEmpty()) return true;
  cookieJar.set("TESTCOOKIESENABLED", "1", { maxAge: 60 });
  if (cookieJar.get("TESTCOOKIESENABLED") !== "1") return false;
  cookieJar.remove("TESTCOOKIESENABLED");
  return true;
}

// ---------------------------------------------------------------------------
// Obfuscated class wrapper  (line 11666-11668)
// ---------------------------------------------------------------------------

/**
 * Obfuscated class constructor call (minified bootstrap shim).
 * [was: jUd]
 * @returns {*}
 */
// var jUd = function() {
//   return VD[x[13]](this, 17, 1522);
// };

// ---------------------------------------------------------------------------
// Property accessor shorthand  (lines 11669-11673)
// ---------------------------------------------------------------------------

/**
 * Look up a named property on an object by a type descriptor.
 * [was: g.l]
 * @param {Object}         obj        [was: Q]
 * @param {TypeDescriptor} descriptor [was: c] - Has `.name` property.
 * @returns {*}
 */
export function getProperty(obj, descriptor) { // was: g.l
  if (obj) return obj[descriptor.name];
}

// ===========================================================================
// Part 3 -- Priority queue (min-heap)  (lines 65132-65227)
// ===========================================================================

/**
 * A min-heap-based priority queue.
 * [was: ZB]
 */
export class PriorityQueue {
  /**
   * @param {PriorityQueue} [source] [was: Q] - Clone from existing queue.
   */
  constructor(source) {
    /** @type {Array<HeapEntry>} [was: W (inner)] */
    this.heap = [];

    if (source) {
      if (source instanceof PriorityQueue) {
        const keys = source.getKeys();   // was: .Il
        const vals = source.getValues();  // was: .z$
        if (this.heap.length <= 0) {
          for (let i = 0; i < keys.length; i++) {
            this.heap.push(new HeapEntry(keys[i], vals[i])); // was: TZ
          }
          return;
        }
        // fallthrough: merge into non-empty
        for (let i = 0; i < keys.length; i++) {
          this.enqueue(keys[i], vals[i]);
        }
      } else {
        const keys = objectKeys(source); // was: g.Ov
        const vals = getObjectValues(source);  // was: gZ
        for (let i = 0; i < keys.length; i++) {
          this.enqueue(keys[i], vals[i]);
        }
      }
    }
  }

  /**
   * Insert a key-value pair, maintaining the min-heap invariant.
   * [was: ll]
   * @param {number} priority [was: Q]
   * @param {*}      value    [was: c]
   */
  enqueue(priority, value) { // was: ll
    this.heap.push(new HeapEntry(priority, value));
    let idx = this.heap.length - 1;
    const entry = this.heap[idx];
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      if (this.heap[parentIdx].key > entry.key) { // was: .W
        this.heap[idx] = this.heap[parentIdx];
        idx = parentIdx;
      } else {
        break;
      }
    }
    this.heap[idx] = entry;
  }

  /**
   * Remove and return the minimum-priority value.
   * [was: remove]
   * @returns {*|undefined}
   */
  dequeue() { // was: remove
    const heap = this.heap;
    const size = heap.length;
    const top = heap[0];
    if (size <= 0) return undefined;
    if (size === 1) {
      heap.length = 0;
    } else {
      heap[0] = heap.pop();
      let idx = 0;
      const length = heap.length;
      const entry = heap[idx];
      while (idx < length >> 1) {
        let childIdx = idx * 2 + 1;
        const rightIdx = idx * 2 + 2;
        childIdx = rightIdx < length && heap[rightIdx].key < heap[childIdx].key
          ? rightIdx : childIdx;
        if (heap[childIdx].key > entry.key) break;
        heap[idx] = heap[childIdx];
        idx = childIdx;
      }
      heap[idx] = entry;
    }
    return top.getValue();
  }

  /**
   * Return all values in heap order (NOT sorted).
   * [was: z$]
   * @returns {Array}
   */
  getValues() {
    return this.heap.map((e) => e.getValue());
  }

  /**
   * Return all keys (priorities) in heap order.
   * [was: Il]
   * @returns {number[]}
   */
  getKeys() {
    return this.heap.map((e) => e.key);
  }

  /**
   * Create a shallow copy.
   * [was: clone]
   * @returns {PriorityQueue}
   */
  clone() {
    return new PriorityQueue(this);
  }

  /**
   * Check if empty.
   * [was: isEmpty]
   * @returns {boolean}
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Remove all entries.
   * [was: clear]
   */
  clear() {
    this.heap.length = 0;
  }
}

/**
 * Extended priority queue with an `enqueue` alias.
 * [was: aU_]
 */
export class EnqueuablePriorityQueue extends PriorityQueue {
  // enqueue is inherited from PriorityQueue
}

// ---------------------------------------------------------------------------
// Singleton ID generator  (lines 65229-65234)
// ---------------------------------------------------------------------------

/**
 * Global monotonic ID counter (singleton).
 * [was: od]
 */
// od.AE = undefined;
// od.getInstance = function() { return od.AE ? od.AE : od.AE = new od; };
// od.prototype.W = 0;

// ===========================================================================
// Part 4 -- Redux-like constants, Attestation enum, ad endpoint names
//           (lines 65466-65559)
// ===========================================================================

/**
 * Generate a random Redux-style action-type suffix.
 * [was: AB]
 * @returns {string}
 */
function randomSuffix() { // was: AB
  return Math.random().toString(36).substring(7).split("").join(".");
}

/** Redux INIT action type. [was: X5] */
export const REDUX_INIT = `@@redux/INIT${randomSuffix()}`;

/** Redux REPLACE action type. [was: mSX] */
export const REDUX_REPLACE = `@@redux/REPLACE${randomSuffix()}`;

/** Observable symbol (Symbol.observable or polyfill). [was: V$] */
export const observableSymbol =
  typeof Symbol === "function" && Symbol.observable || "@@observable";

/**
 * Jenkins-hash seed for attestation challenges.
 * [was: YD3]
 * @type {number}
 */
export const JENKINS_HASH_SEED = -643384726;

/**
 * Attestation error enum factory, built from a proto descriptor.
 * [was: zOO]
 *
 * Error codes:
 *   ATTESTATION_ERROR_UNKNOWN (0)
 *   ATTESTATION_ERROR_VM_NOT_INITIALIZED (1)
 *   ATTESTATION_ERROR_VM_NO_RESPONSE (2)
 *   ATTESTATION_ERROR_VM_TIMEOUT (3)
 *   ATTESTATION_ERROR_VM_INTERNAL_ERROR (4)
 *   ATTESTATION_ERROR_PREFETCH_CHALLENGE_INVALID (5)
 *   ATTESTATION_ERROR_PREFETCH_CHALLENGE_NETWORK_ERROR (6)
 *   ATTESTATION_ERROR_PREFETCH_CHALLENGE_OFFLINE (7)
 *   ATTESTATION_ERROR_PREFETCH_CHALLENGE_INTERNAL_ERROR (8)
 *   ATTESTATION_ERROR_API_NOT_READY (9)
 *   ATTESTATION_ERROR_DEVICE_OFFLINE (10)
 *   ATTESTATION_ERROR_KEY_PAIR_INIT_FAILED (12)
 *   ATTESTATION_ERROR_SIGNING_DATA_MISSING (13)
 *   ATTESTATION_ERROR_SIGNING_FAILED (14)
 *   ATTESTATION_ERROR_CERT_CHAIN_RETRIEVAL_FAILED (15)
 */
// (initialised at load time via iPm proto descriptor factory)

// ---------------------------------------------------------------------------
// Named type descriptor  (line 65484-65488)
// ---------------------------------------------------------------------------

/**
 * A named type descriptor used to look up renderer/endpoint properties.
 * [was: g.Y]
 */
export class TypeDescriptor {
  /**
   * @param {string} name [was: Q]
   */
  constructor(name) {
    this.name = name;
  }
}

// ---------------------------------------------------------------------------
// Ad endpoint / renderer name constants  (lines 65490-65559)
// ---------------------------------------------------------------------------

export const adInfoDialogEndpoint            = new TypeDescriptor("adInfoDialogEndpoint");             // was: L_X
export const adPingingEndpoint               = new TypeDescriptor("adPingingEndpoint");                // was: Vu7
export const crossDeviceProgressCommand      = new TypeDescriptor("crossDeviceProgressCommand");       // was: jdw
export const actionCompanionAdRenderer       = new TypeDescriptor("actionCompanionAdRenderer");        // was: zm
export const adActionInterstitialRenderer    = new TypeDescriptor("adActionInterstitialRenderer");     // was: YA
export const adDurationRemainingRenderer     = new TypeDescriptor("adDurationRemainingRenderer");      // was: CWy
export const adHoverTextButtonRenderer       = new TypeDescriptor("adHoverTextButtonRenderer");        // was: Ns
export const adInfoDialogRenderer            = new TypeDescriptor("adInfoDialogRenderer");             // was: gk_
export const adMessageRenderer               = new TypeDescriptor("adMessageRenderer");                // was: rc
export const adPreviewRenderer               = new TypeDescriptor("adPreviewRenderer");                // was: ih
export const adsEngagementPanelRenderer      = new TypeDescriptor("adsEngagementPanelRenderer");       // was: M5
export const dismissablePanelRenderer        = new TypeDescriptor("dismissablePanelTextPortraitImageRenderer"); // was: jxm
export const adsEngagementPanelSLViewModel   = new TypeDescriptor("adsEngagementPanelSectionListViewModel");   // was: cE
export const flyoutCtaRenderer               = new TypeDescriptor("flyoutCtaRenderer");                // was: MR7
export const imageCompanionAdRenderer        = new TypeDescriptor("imageCompanionAdRenderer");         // was: CA
export const instreamAdPlayerOverlayRenderer = new TypeDescriptor("instreamAdPlayerOverlayRenderer");  // was: Re
export const instreamSurveyBgImageRenderer   = new TypeDescriptor("instreamSurveyAdBackgroundImageRenderer"); // was: aXW
export const instreamSurveyOverlayRenderer   = new TypeDescriptor("instreamSurveyAdPlayerOverlayRenderer");   // was: HE
export const instreamSurveyAdRenderer        = new TypeDescriptor("instreamSurveyAdRenderer");         // was: rR
export const instreamSurveySingleSelect      = new TypeDescriptor("instreamSurveyAdSingleSelectQuestionRenderer"); // was: tn
export const instreamSurveyMultiSelect       = new TypeDescriptor("instreamSurveyAdMultiSelectQuestionRenderer");  // was: Di
export const instreamSurveyAnswer            = new TypeDescriptor("instreamSurveyAdAnswerRenderer");   // was: da
export const instreamSurveyNoneOfAbove       = new TypeDescriptor("instreamSurveyAdAnswerNoneOfTheAboveRenderer"); // was: J2O
export const instreamVideoAdRenderer         = new TypeDescriptor("instreamVideoAdRenderer");          // was: Tu
export const textOverlayAdContent            = new TypeDescriptor("textOverlayAdContentRenderer");     // was: ROR
export const enhancedTextOverlayAdContent    = new TypeDescriptor("enhancedTextOverlayAdContentRenderer"); // was: k4x
export const imageOverlayAdContent           = new TypeDescriptor("imageOverlayAdContentRenderer");    // was: Yfy
export const playerOverlayLayoutRenderer     = new TypeDescriptor("playerOverlayLayoutRenderer");      // was: kA
export const videoInterstitialButtoned       = new TypeDescriptor("videoInterstitialButtonedCenteredLayoutRenderer"); // was: pQ
export const aboveFeedAdLayout               = new TypeDescriptor("aboveFeedAdLayoutRenderer");        // was: apw
export const belowPlayerAdLayout             = new TypeDescriptor("belowPlayerAdLayoutRenderer");      // was: GnO
export const inPlayerAdLayout                = new TypeDescriptor("inPlayerAdLayoutRenderer");          // was: v3y
export const inPlayerOrganicOverlayLayout    = new TypeDescriptor("inPlayerOrganicOverlayAdLayoutRenderer"); // was: $4X
export const playerBytesAdLayout             = new TypeDescriptor("playerBytesAdLayoutRenderer");       // was: Xp
export const playerBytesSequenceItemLayout   = new TypeDescriptor("playerBytesSequenceItemAdLayoutRenderer"); // was: qs
export const playerUnderlayAdLayout          = new TypeDescriptor("playerUnderlayAdLayoutRenderer");    // was: xb
export const adIntroRenderer                 = new TypeDescriptor("adIntroRenderer");                   // was: oG
export const playerBytesSequentialLayout     = new TypeDescriptor("playerBytesSequentialLayoutRenderer"); // was: m0
export const slidingTextOverlay              = new TypeDescriptor("slidingTextPlayerOverlayRenderer");  // was: FsK
export const surveyTextInterstitial          = new TypeDescriptor("surveyTextInterstitialRenderer");    // was: Uz
export const videoAdTracking                 = new TypeDescriptor("videoAdTrackingRenderer");           // was: An
export const videoInterstitialViewModel      = new TypeDescriptor("videoInterstitialCenteredLayoutViewModel"); // was: E37
export const organicTransitionOverlay        = new TypeDescriptor("playerOrganicTransitionOverlayRenderer"); // was: d4K
export const simpleAdBadge                   = new TypeDescriptor("simpleAdBadgeRenderer");             // was: pMw
export const skipAdRenderer                  = new TypeDescriptor("skipAdRenderer");                    // was: vD
export const skipButtonRenderer              = new TypeDescriptor("skipButtonRenderer");                // was: QfR
export const adSlotRenderer                  = new TypeDescriptor("adSlotRenderer");                    // was: nz
export const squeezebackSidePanel            = new TypeDescriptor("squeezebackPlayerSidePanelRenderer"); // was: Vy
export const timedPieCountdown               = new TypeDescriptor("timedPieCountdownRenderer");         // was: cuw
export const adAvatarViewModel               = new TypeDescriptor("adAvatarViewModel");                 // was: q_
export const adBadgeViewModel                = new TypeDescriptor("adBadgeViewModel");                  // was: nK
export const adButtonViewModel               = new TypeDescriptor("adButtonViewModel");                 // was: Dh
export const adDetailsLineViewModel          = new TypeDescriptor("adDetailsLineViewModel");            // was: WPW
export const adDisclosureBannerViewModel     = new TypeDescriptor("adDisclosureBannerViewModel");       // was: mCX
export const adPodIndexViewModel             = new TypeDescriptor("adPodIndexViewModel");               // was: KPO
export const imageBackgroundViewModel        = new TypeDescriptor("imageBackgroundViewModel");          // was: TEx
export const adGridCardCollectionViewModel   = new TypeDescriptor("adGridCardCollectionViewModel");     // was: oXK
export const adGridCardTextViewModel         = new TypeDescriptor("adGridCardTextViewModel");           // was: ruX
export const adPreviewViewModel              = new TypeDescriptor("adPreviewViewModel");                // was: UC7
export const playerAdAvatarLockupViewModel   = new TypeDescriptor("playerAdAvatarLockupCardButtonedViewModel"); // was: IGO
export const skipAdButtonViewModel           = new TypeDescriptor("skipAdButtonViewModel");             // was: XA_
export const skipAdViewModel                 = new TypeDescriptor("skipAdViewModel");                   // was: Aum
export const timedPieCountdownViewModel      = new TypeDescriptor("timedPieCountdownViewModel");        // was: ejO
export const visitAdvertiserLinkViewModel    = new TypeDescriptor("visitAdvertiserLinkViewModel");      // was: VO0
export const bannerImageLayoutViewModel      = new TypeDescriptor("bannerImageLayoutViewModel");        // was: JS
export const topBannerImageLayoutViewModel   = new TypeDescriptor("topBannerImageTextIconButtonedLayoutViewModel"); // was: Rn
export const adsEngagementPanelLayoutVM      = new TypeDescriptor("adsEngagementPanelLayoutViewModel"); // was: kT
export const displayUnderlayGridCardsVM      = new TypeDescriptor("displayUnderlayTextGridCardsLayoutViewModel"); // was: BE
export const browseEndpoint                  = new TypeDescriptor("browseEndpoint");                    // was: g.qR
export const confirmDialogEndpoint           = new TypeDescriptor("confirmDialogEndpoint");             // was: BE7
