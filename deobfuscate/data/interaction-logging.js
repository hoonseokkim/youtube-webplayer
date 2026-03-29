/**
 * Interaction Logging — seek trust detection, biscotti-based detection,
 * generic stats logging, request-ID extraction, and ARIA helpers.
 *
 * Source: base.js lines ~17500–18500
 *
 * This module handles the player's interaction logging pipeline:
 *
 *  1. Seek-event trust detection (isTrusted checks on DOM events)
 *  2. Biscotti-based bot/abuse detection state machine
 *  3. Generic stats dispatch via the CATSTAT bitfield
 *  4. Request-ID extractor for CSI (Client-Side Instrumentation)
 *  5. ARIA-hidden toggle helper for accessibility
 *
 * [was: vkO, aLm, f2, fL_, B5m, O8, v1, aH, g.$4, g.P1]
 */
import { setConfig } from '../core/composition-helpers.js'; // was: y$

// ---------------------------------------------------------------------------
// Internal: result-type bit mapping
// ---------------------------------------------------------------------------

/**
 * Map a detection result enum (0-4) to a 2-bit value for the CATSTAT
 * bitfield.
 *
 * | Input | Meaning            | Output |
 * |-------|--------------------|--------|
 * | 2     | pass               | 0      |
 * | 1     | undetermined       | 2      |
 * | 0     | detected (blocked) | 3      |
 * | 3,4   | other              | 1      |
 *
 * @param {number} resultType  [was: Q]
 * @returns {number} 2-bit value
 * [was: fL_]
 */
function resultTypeToBits(resultType) { // was: fL_
  switch (resultType) {
    case 2:
      return 0;
    case 1:
      return 2;
    case 0:
      return 3;
    case 4:
    case 3:
      return 1;
    default:
      // cb(resultType, "unknown result type") — debug assertion
      throw new Error(`Unknown result type: ${resultType}`);
  }
}

// ---------------------------------------------------------------------------
// Seek-event trust detection
// ---------------------------------------------------------------------------

/**
 * Detect whether a seek event was programmatically dispatched (untrusted)
 * vs. user-initiated.  Writes the result to the ISDSTAT stat key and
 * logs a biscotti-based detection payload.
 *
 * Returns 1 if trusted, 0 if untrusted (synthetic).
 *
 * @param {Event} event     The DOM seek event.   [was: Q]
 * @param {Object} metadata CPN metadata object.  [was: c]
 * @returns {number} 1 = trusted, 0 = untrusted
 * [was: vkO]
 */
export function detectSeekEventTrust(event, metadata) { // was: vkO
  let result = 1; // was: W
  if (event.isTrusted === false) { // was: Q.isTrusted === !1
    result = 0;
  }
  setConfig('ISDSTAT', result);
  logBiscottiStats(result, 'i.s_', {
    triggerContext: 'sk',
    metadata,
  });
  return result;
}

// ---------------------------------------------------------------------------
// Biscotti-based detection
// ---------------------------------------------------------------------------

/**
 * Log a biscotti-based detection event for a seek action.
 *
 * Pushes one of four state strings depending on whether a seek event
 * existed and whether it was trusted:
 *
 *  - BISCOTTI_BASED_DETECTION_STATE_AS_SEEK_EVENT_TRUSTED
 *  - BISCOTTI_BASED_DETECTION_STATE_AS_SEEK_EVENT_NOT_TRUSTED
 *  - BISCOTTI_BASED_DETECTION_STATE_AS_SEEK_EVENT_TRUSTED_PROPERTY_UNDEFINED
 *  - BISCOTTI_BASED_DETECTION_STATE_AS_SEEK_EVENT_UNDEFINED
 *
 * @param {Object}     metadata   CPN metadata.     [was: Q]
 * @param {Event|null} seekEvent  The seek event.    [was: c]
 * [was: aLm]
 */
export function logBiscottiSeekDetection(metadata, seekEvent) { // was: aLm
  const states = []; // was: W
  if (seekEvent) {
    if (seekEvent.isTrusted === true) { // was: c.isTrusted === !0
      states.push('BISCOTTI_BASED_DETECTION_STATE_AS_SEEK_EVENT_TRUSTED');
    } else if (seekEvent.isTrusted === false) { // was: c.isTrusted === !1
      states.push('BISCOTTI_BASED_DETECTION_STATE_AS_SEEK_EVENT_NOT_TRUSTED');
    } else {
      states.push('BISCOTTI_BASED_DETECTION_STATE_AS_SEEK_EVENT_TRUSTED_PROPERTY_UNDEFINED');
    }
  } else {
    states.push('BISCOTTI_BASED_DETECTION_STATE_AS_SEEK_EVENT_UNDEFINED');
  }
  logBiscottiStats(0, 'a.s_', {
    metadata,
    states,
  });
  setConfig('ASDSTAT', 0);
}

// ---------------------------------------------------------------------------
// Generic stats logger
// ---------------------------------------------------------------------------

/**
 * @type {Object<string, {O: string, W?: number}>}
 * Registry of stat-key descriptors, keyed by short prefix.
 * Each entry has `.O` (stat source prefix) and optionally `.W` (CATSTAT
 * bit-shift offset).
 *
 * Populated externally — referenced as `G9O` in the source.
 * [was: G9O]
 */
const statsKeyRegistry = {}; // was: G9O — populated elsewhere

/**
 * Log a biscotti-based detection stat and update the CATSTAT bitfield.
 *
 * @param {number} detectionResult  0 = detected, 1 = undetermined, 2 = pass  [was: Q]
 * @param {string} statsKeyPrefix   Short key like "i.s_" or "a.s_"           [was: c]
 * @param {Object} options          Bag with triggerContext, metadata, etc.     [was: W]
 *   @param {string}  [options.triggerContext]
 *   @param {string}  [options.RB]
 *   @param {Array}   [options.states]
 *   @param {number}  [options.SU]  duration in ms
 *   @param {Object}  [options.metadata]
 * [was: f2]
 */
export function logBiscottiStats(detectionResult, statsKeyPrefix, options) { // was: f2
  const descriptor = statsKeyRegistry[statsKeyPrefix]; // was: c = G9O[c]
  const payload = { // was: m
    detected: detectionResult === 0,
    source: `${descriptor.O}${options.triggerContext ?? ''}${options.SkipRequestedTriggerMetadata ?? ''}`,
    detectionStates: options.states,
    durationMs: options.SU,
  };
  if (options.metadata) {
    payload.contentCpn = options.metadata.contentCpn;
    payload.adCpn = options.metadata.adCpn;
  }
  eG('biscottiBasedDetection', payload);

  // Update the CATSTAT bitfield if this descriptor has a bit-shift offset
  if (descriptor.W !== undefined) { // was: c.W !== void 0
    let currentCatstat = Number(getSetting('CATSTAT', 0)); // was: W = Number(g.v("CATSTAT", 0))
    if (descriptor.W !== undefined) {
      const bitShift = descriptor.W; // was: c = c.W
      const bits = resultTypeToBits(detectionResult); // was: Q = fL_(Q)
      currentCatstat = (currentCatstat & ~(3 << bitShift)) | (bits << bitShift);
    }
    setConfig('CATSTAT', currentCatstat);
  }
}

// ---------------------------------------------------------------------------
// Ads control-flow error reporter
// ---------------------------------------------------------------------------

/**
 * Report an ads control-flow error, sampled at 0.05%.
 *
 * @param {string|Error} errorOrMessage  Error or message string.  [was: Q]
 * @param {Object|null}  [slot]          Slot info.                [was: c]
 * @param {Object|null}  [layout]        Layout info.              [was: W]
 * @param {Object}       [extra={}]      Additional metadata.      [was: m]
 * @param {boolean}      [isKnownError]  If true, marks as aggressively sampled.  [was: K]
 * [was: v1]
 */
export function reportAdsControlFlowError(errorOrMessage, slot, layout, extra = {}, isKnownError) { // was: v1
  if (!isKnownError || Math.random() < 5e-4) {
    slot = slot || null;
    layout = layout || null;
    const error = errorOrMessage instanceof Error
      ? errorOrMessage
      : new Error(errorOrMessage); // was: new g.H8(Q)

    if (error.args) {
      for (const arg of error.args) {
        if (arg instanceof Object) {
          extra = { ...arg, ...extra };
        }
      }
    }

    extra.category = 'H5 Ads Control Flow';
    if (slot) {
      extra.slot = slot ? `slot:  ${slot.slotType}` : '';
    }
    if (layout) {
      extra.layout = layout ? `layout:  ${layout.layoutType}` : '';
      extra.layoutId = layout.layoutId;
    }
    if (isKnownError) {
      extra.known_error_aggressively_sampled = true; // was: !0
    }
    error.args = [extra];
    // g.Ty(error) — report to error-logging service
  }
}

// ---------------------------------------------------------------------------
// State-transition helper
// ---------------------------------------------------------------------------

/**
 * Detect whether a specific state bit transitioned on or off.
 *
 * @param {Object} stateChange  Object with `.state` and `.oldState`,
 *                              each having a `.W(bit)` method.  [was: Q]
 * @param {number} bit          The state bit to check.          [was: c]
 * @returns {number}  1 if turned on, -1 if turned off, 0 if unchanged.
 * [was: aH]
 */
export function detectStateTransition(stateChange, bit) { // was: aH
  if (stateChange.state.W(bit) && !stateChange.oldState.W(bit)) return 1;
  if (!stateChange.state.W(bit) && stateChange.oldState.W(bit)) return -1;
  return 0;
}

// ---------------------------------------------------------------------------
// Request-ID extractor for CSI
// ---------------------------------------------------------------------------

/**
 * Extract request IDs and subscription/monetization flags from a
 * TIMING_INFO object.  Used by CSI (Client-Side Instrumentation) to
 * annotate latency reports.
 *
 * Recognized keys:
 *   GetBrowse_rid, GetGuide_rid, GetHome_rid, GetPlayer_rid,
 *   GetSearch_rid, GetSettings_rid, GetTrending_rid, GetWatchNext_rid,
 *   yt_red  (→ isRedSubscriber),
 *   yt_ad   (→ isMonetized)
 *
 * @param {Object} timingInfo  Key-value map from TIMING_INFO.  [was: Q]
 * @returns {Object} Structured object with `.requestIds[]`, `.isRedSubscriber`,
 *                   `.isMonetized`.
 * [was: B5m]
 */
export function extractRequestIds(timingInfo) { // was: B5m
  const result = {}; // was: c

  /**
   * Push a request-ID entry into result.requestIds[].
   * @param {Object} target
   * @param {string} key      e.g. "GetBrowse_rid"
   * @param {*}      value    the request ID value
   */
  const pushRequestId = (target, key, value) => { // was: W
    // Strip "_rid" suffix to get the endpoint name
    key = key.match('_rid') ? key.split('_rid')[0] : key;
    if (typeof value === 'number') {
      value = JSON.stringify(value);
    }
    if (target.requestIds) {
      target.requestIds.push({ endpoint: key, id: value });
    } else {
      target.requestIds = [{ endpoint: key, id: value }];
    }
  };

  for (const [key, value] of Object.entries(timingInfo)) {
    switch (key) {
      case 'GetBrowse_rid':
        pushRequestId(result, key, value);
        break;
      case 'GetGuide_rid':
        pushRequestId(result, key, value);
        break;
      case 'GetHome_rid':
        pushRequestId(result, key, value);
        break;
      case 'GetPlayer_rid':
        pushRequestId(result, key, value);
        break;
      case 'GetSearch_rid':
        pushRequestId(result, key, value);
        break;
      case 'GetSettings_rid':
        pushRequestId(result, key, value);
        break;
      case 'GetTrending_rid':
        pushRequestId(result, key, value);
        break;
      case 'GetWatchNext_rid':
        pushRequestId(result, key, value);
        break;
      case 'yt_red':
        result.isRedSubscriber = !!value;
        break;
      case 'yt_ad':
        result.isMonetized = !!value;
        break;
      // Other keys are silently ignored
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// ARIA hidden toggle helper
// ---------------------------------------------------------------------------

/**
 * Toggle the `aria-hidden` attribute on a component's root element.
 *
 * When `hidden` is true the attribute is set to "true"; when false the
 * attribute is removed entirely (making the element visible to screen
 * readers again).
 *
 * @param {Object}  component  Component wrapper with `.element.element` DOM ref.  [was: Q]
 * @param {boolean} hidden     Whether to hide.  [was: c]
 * [was: O8]
 */
export function toggleAriaHidden(component, hidden) { // was: O8
  const element = component.element.element; // was: Q = Q.element.element
  if (hidden) {
    element.setAttribute('aria-hidden', 'true');
  } else {
    element.removeAttribute('aria-hidden');
  }
}

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

/**
 * Format a duration in seconds into a human-readable string.
 *
 * When `verbose` is false (default), returns compact format:
 *   "1:02:03" or "3:45"
 *
 * When `verbose` is true, returns expanded format:
 *   "1 Days 2 Hours 3 Minutes 45 Seconds"
 *
 * Negative values are prefixed with "-".
 *
 * @param {number}  totalSeconds  Duration in seconds.  [was: Q]
 * @param {boolean} [verbose]     Use expanded format.  [was: c]
 * @returns {string}
 * [was: g.$4]
 */
export function formatDuration(totalSeconds, verbose) { // was: g.$4
  const absSeconds = Math.abs(Math.floor(totalSeconds)); // was: W
  const days = Math.floor(absSeconds / 86400); // was: m
  const hours = Math.floor((absSeconds % 86400) / 3600); // was: K
  const minutes = Math.floor((absSeconds % 3600) / 60); // was: T
  const seconds = Math.floor(absSeconds % 60); // was: W (reused)

  let formatted; // was: m (reused for output)

  if (verbose) {
    let parts = '';
    if (days > 0) parts += ` ${days} Days`;
    if (days > 0 || hours > 0) parts += ` ${hours} Hours`;
    parts += ` ${minutes} Minutes`;
    parts += ` ${seconds} Seconds`;
    formatted = parts.trim();
  } else {
    let parts = '';
    if (days > 0) {
      parts += `${days}:`;
      if (hours < 10) parts += '0';
    }
    if (days > 0 || hours > 0) {
      parts += `${hours}:`;
      if (minutes < 10) parts += '0';
    }
    parts += `${minutes}:`;
    if (seconds < 10) parts += '0';
    formatted = parts + seconds;
  }

  return totalSeconds >= 0 ? formatted : `-${formatted}`;
}

// ---------------------------------------------------------------------------
// Primary-click detection
// ---------------------------------------------------------------------------

/**
 * Check whether a mouse/keyboard event is a "primary" (unmodified left)
 * click.  Returns false if any modifier key is held or if the button
 * is not 0 (left).
 *
 * @param {MouseEvent|KeyboardEvent} event  [was: Q]
 * @returns {boolean}
 * [was: g.P1]
 */
export function isPrimaryClick(event) { // was: g.P1
  return (
    (!('button' in event) || typeof event.button !== 'number' || event.button === 0) &&
    !('shiftKey' in event && event.shiftKey) &&
    !('altKey' in event && event.altKey) &&
    !('metaKey' in event && event.metaKey) &&
    !('ctrlKey' in event && event.ctrlKey)
  );
}

// ---------------------------------------------------------------------------
// Helpers referenced but not defined here
// ---------------------------------------------------------------------------

/**
 * Placeholder — reads a setting value.  Actual implementation lives in
 * `../core/config.js`.
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
function getSetting(key, defaultValue) { // was: g.v
  // Delegated to core/config.js at runtime
  return defaultValue;
}
