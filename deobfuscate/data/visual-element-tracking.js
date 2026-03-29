import { toString } from '../core/string-utils.js';
/**
 * Visual Element Tracking — GEL logging for element visibility and gestures.
 *
 * Source: base.js lines ~16000–16255
 *
 * This module implements the player's visual-element (VE) tracking system,
 * which logs element shown/hidden/gestured events to GEL (Google Event
 * Logging).  Events are routed through the CSN (Client Session Nonce)
 * framework: if a CSN is "UNDEFINED_CSN" the event is queued; otherwise
 * it is dispatched immediately via one of three paths:
 *
 *   - hZ()  — queue for deferred dispatch (undefined CSN)
 *   - XY()  — dispatch via a specific observer   [was: XY]
 *   - g.eG() — dispatch via the global GEL endpoint [was: g.eG]
 *
 * Event types (numeric):
 *   1  = element shown (initial)
 *   4  = element shown (re-attached)
 *   8  = element hidden (normal)
 *   16 = element hidden (end-of-sequence)
 *
 * [was: jwn, Ca, gEO, O4W, hZ, $6K, l5, zi, u5, fa,
 *       g.Rv, g.k0, g.Y0, g.pa, Qj, c1, g.W1, mU]
 */

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/**
 * Pending events queued while the CSN was "UNDEFINED_CSN".
 * Flushed by flushPendingEvents() once a valid CSN arrives.
 * @type {Array<{payloadName: string, payload: Object, MBH: undefined, options: Object}>}
 * [was: ME]
 */
const pendingEvents = []; // was: ME

/**
 * Timer handle for deferred flush.  0 means no pending timer.
 * @type {number}
 * [was: JZ]
 */
let flushTimerHandle = 0; // was: JZ

/**
 * Map of VE keys to "has been gestured" flags, used by the
 * no_client_ve_attach_unless_shown experiment.
 * @type {Map<string, boolean>}
 * [was: av]
 */
const gesturedElements = new Map(); // was: av

/**
 * Map of VE keys to deferred attach payloads, used by the
 * no_client_ve_attach_unless_shown experiment.
 * @type {Map<string, Array>}
 * [was: vo]
 */
const deferredAttachPayloads = new Map(); // was: vo

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a VE identity key from a visual element and CSN.
 *
 * @param {Object} visualElement  VE object with `.getAsJson()`.  [was: Q]
 * @param {string} csn            Client Session Nonce.           [was: c]
 * @returns {string} Composite key: `${veType}${veCounter}${csn}`
 * [was: l5]
 */
function buildVeKey(visualElement, csn) { // was: l5
  return `${visualElement.getAsJson().veType}${visualElement.getAsJson().veCounter}${csn}`;
}

/**
 * Attach options for GEL, optionally including sequence-group info.
 *
 * @param {Object} baseOptions  Options bag.          [was: Q]
 * @param {string} csn          Client Session Nonce. [was: c]
 * @returns {Object} The (mutated) options bag.
 * [was: fa]
 */
function attachSequenceOptions(baseOptions, csn) { // was: fa
  if (P('log_sequence_info_on_gel_web')) {
    baseOptions.sequenceGroup = csn;
  }
  return baseOptions;
}

/**
 * Get CTT (credential-transfer token) auth info for a CSN.
 * Stub — actual implementation is external.
 *
 * @param {string} csn  [was: c]
 * @returns {Object|undefined}
 * [was: tZ]
 */
function getCttAuthInfo(csn) { // was: tZ
  // External dependency — returns auth info or undefined
  return undefined;
}

/**
 * Queue an event for deferred dispatch (when CSN is undefined).
 *
 * @param {string} payloadName  Event name (e.g. "visualElementShown").  [was: Q]
 * @param {Object} options      GEL options.                             [was: c]
 * @param {Object} payload      The event payload.                       [was: W]
 * [was: hZ]
 */
function queueEvent(payloadName, options, payload) { // was: hZ
  pendingEvents.push({
    payloadName,
    payload,
    MBH: undefined, // was: void 0
    options,
  });
  if (!flushTimerHandle) {
    flushTimerHandle = scheduleDeferredFlush(); // was: JZ = lZy()
  }
}

/**
 * Schedule the deferred flush.  Stub — wraps a timer-based callback.
 * @returns {number} Timer handle.
 * [was: lZy]
 */
function scheduleDeferredFlush() { // was: lZy
  // Implementation is external — returns a timer ID
  return 0;
}

/**
 * Dispatch via a specific observer (CSN-scoped path).
 * Stub — actual implementation is external.
 *
 * @param {string} payloadName
 * @param {Object} payload
 * @param {*}      observer  [was: Q]
 * @param {Object} options
 * [was: XY]
 */
function dispatchViaObserver(payloadName, payload, observer, options) { // was: XY
  // External dependency
}

// ---------------------------------------------------------------------------
// Visual-element shown
// ---------------------------------------------------------------------------

/**
 * Log that a visual element has been shown.
 *
 * The source (line ~15990-16005) builds a payload with `eventType: 1`
 * and routes through the CSN dispatch framework.
 *
 * NOTE: This function is called inline from the original source; it is
 * extracted here for clarity.  The original is an anonymous function
 * assigned at ~line 15988.
 *
 * @param {*}      observer       Observer reference (may be undefined). [was: Q]
 * @param {string} csn            Client Session Nonce.                  [was: c]
 * @param {Object} visualElement  VE with `.getAsJson()`.                [was: W]
 * @param {Object} [clientData]   Optional client data.                  [was: K]
 */
export function logVisualElementShown(observer, csn, visualElement, clientData) {
  // was: inline anonymous function ~line 15988
  const options = attachSequenceOptions({
    cttAuthInfo: getCttAuthInfo(csn) || undefined,
    automatedLogEventSource: undefined,
  }, csn);

  const payload = {
    csn,
    ve: visualElement.getAsJson(),
    eventType: 1,
  };

  if (clientData) {
    payload.clientData = clientData;
  }

  if (csn === 'UNDEFINED_CSN') {
    queueEvent('visualElementShown', options, payload);        // was: hZ(...)
  } else if (observer) {
    dispatchViaObserver('visualElementShown', payload, observer, options); // was: XY(...)
  } else {
    eG('visualElementShown', payload, options);                // was: g.eG(...)
  }
}

// ---------------------------------------------------------------------------
// Visual-element hidden
// ---------------------------------------------------------------------------

/**
 * Log that a visual element has been hidden.
 *
 * Uses `eventType: 8` for normal hide, `eventType: 16` for end-of-sequence.
 *
 * @param {*}       observer         Observer reference.                  [was: Q]
 * @param {string}  csn              Client Session Nonce.                [was: c]
 * @param {Object}  visualElement    VE with `.getAsJson()`.              [was: W]
 * @param {boolean} [isEndOfSequence=false]  End-of-sequence flag.       [was: m]
 * [was: jwn]
 */
export function logVisualElementHidden(observer, csn, visualElement, isEndOfSequence = false) { // was: jwn
  const eventType = isEndOfSequence ? 16 : 8; // was: K = m ? 16 : 8

  const options = attachSequenceOptions({
    cttAuthInfo: getCttAuthInfo(csn) || undefined,
    endOfSequence: isEndOfSequence,
    automatedLogEventSource: undefined,
  }, csn);

  const payload = {
    csn,
    ve: visualElement.getAsJson(),
    eventType,
  };

  if (csn === 'UNDEFINED_CSN') {
    queueEvent('visualElementHidden', options, payload);
  } else if (observer) {
    dispatchViaObserver('visualElementHidden', payload, observer, options);
  } else {
    eG('visualElementHidden', payload, options);
  }
}

// ---------------------------------------------------------------------------
// Visual-element gestured (click / interaction)
// ---------------------------------------------------------------------------

/**
 * Log a generic click gesture on a visual element.
 *
 * Convenience wrapper around logVisualElementGesture() that defaults
 * the gestureType to undefined (i.e. GENERIC_CLICK).
 *
 * @param {*}      observer       Observer reference.   [was: Q]
 * @param {string} csn            Client Session Nonce. [was: c]
 * @param {Object} visualElement  VE with `.getAsJson()`. [was: W]
 * @param {Object} [clientData]   Optional client data.   [was: m]
 * @param {*}      [K]            Unused / reserved.      [was: K]
 * @param {*}      [automatedLogEventSource]               [was: T]
 * [was: Ca]
 */
export function logVisualElementClicked(observer, csn, visualElement, clientData, K, automatedLogEventSource) { // was: Ca
  logVisualElementGesture(observer, csn, visualElement, undefined, clientData, K, automatedLogEventSource);
}

/**
 * Log a gesture (interaction) on a visual element.
 *
 * @param {*}      observer         Observer reference.     [was: Q]
 * @param {string} csn              Client Session Nonce.   [was: c]
 * @param {Object} visualElement    VE with `.getAsJson()`. [was: W]
 * @param {string} [gestureType]    Gesture type enum string.
 *                                  Defaults to "INTERACTION_LOGGING_GESTURE_TYPE_GENERIC_CLICK".
 *                                  [was: m]
 * @param {Object} [clientData]     Optional client data.   [was: K]
 * @param {*}      [T]              Unused / reserved.      [was: T]
 * @param {*}      [automatedLogEventSource]                [was: r]
 * [was: gEO]
 */
export function logVisualElementGesture(observer, csn, visualElement, gestureType, clientData, T, automatedLogEventSource) { // was: gEO
  markAsGestured(visualElement, csn); // was: zi(W, c)

  gestureType = gestureType || 'INTERACTION_LOGGING_GESTURE_TYPE_GENERIC_CLICK';

  const options = attachSequenceOptions({
    cttAuthInfo: getCttAuthInfo(csn) || undefined,
    automatedLogEventSource,
  }, csn);

  const payload = {
    csn,
    ve: visualElement.getAsJson(),
    gestureType,
  };

  if (clientData) {
    payload.clientData = clientData;
  }

  if (csn === 'UNDEFINED_CSN') {
    queueEvent('visualElementGestured', options, payload);
  } else if (observer) {
    dispatchViaObserver('visualElementGestured', payload, observer, options);
  } else {
    eG('visualElementGestured', payload, options);
  }
}

// ---------------------------------------------------------------------------
// Deferred-event flush
// ---------------------------------------------------------------------------

/**
 * Flush all pending VE events that were queued while the CSN was
 * "UNDEFINED_CSN".  Called once a valid CSN is assigned.
 *
 * Each queued event is re-dispatched via `g.eG()` with the now-valid CSN.
 *
 * @param {Object} context  Object with `.csn` — the new valid CSN.  [was: Q]
 * [was: $6K]
 */
export function flushPendingEvents(context) { // was: $6K
  if (pendingEvents.length) {
    for (const entry of pendingEvents) {
      if (entry.payload) {
        entry.payload.csn = context.csn;
        eG(entry.payloadName, entry.payload, entry.options);
      }
    }
    pendingEvents.length = 0;
  }
  flushTimerHandle = 0;
}

// ---------------------------------------------------------------------------
// Gesture / show-attach bookkeeping
// ---------------------------------------------------------------------------

/**
 * Mark a visual element as having received a gesture.
 *
 * This is used by the "no_client_ve_attach_unless_shown" experiment to
 * flush deferred attach payloads once a gesture is received.
 *
 * @param {Object} visualElement  [was: Q → W in gEO]
 * @param {string} csn            [was: c]
 * [was: zi]
 */
function markAsGestured(visualElement, csn) { // was: zi
  if (P('no_client_ve_attach_unless_shown')) {
    const key = buildVeKey(visualElement, csn);
    gesturedElements.set(key, true); // was: av.set(W, !0)
    flushDeferredAttach(visualElement, csn);
  }
}

/**
 * Flush a deferred VE attach payload if one exists for this element.
 *
 * @param {Object} visualElement  [was: Q]
 * @param {string} csn            [was: c]
 * [was: u5]
 */
function flushDeferredAttach(visualElement, csn) { // was: u5
  const key = buildVeKey(visualElement, csn);
  if (deferredAttachPayloads.has(key)) {
    const args = deferredAttachPayloads.get(key) || [];
    // g.Po(args[0], args[1], args[2], args[3], true)
    // ^ dispatches the deferred attach — external dependency
    deferredAttachPayloads.delete(key);
  }
}

// ---------------------------------------------------------------------------
// CSN token generator
// ---------------------------------------------------------------------------

/**
 * Generate a new Client Session Nonce — a 16-byte random string encoded
 * in a URL-safe base64 alphabet (A-Z, a-z, 0-9, -, _).
 *
 * @returns {string} 16-character random token.
 * [was: O4W]
 */
export function generateClientSessionNonce() { // was: O4W
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const randomBytes = new Uint8Array(16); // was: Xx(16)
  crypto.getRandomValues(randomBytes);

  const chars = [];
  for (let i = 0; i < randomBytes.length; i++) {
    chars.push(ALPHABET.charAt(randomBytes[i] & 63));
  }
  return chars.join('');
}

// ---------------------------------------------------------------------------
// Convenience wrappers (public API surface)
// ---------------------------------------------------------------------------

/**
 * Batch-show visual elements under a given CSN.
 *
 * Iterates child VEs via `g.lw()` and logs each as shown with
 * `eventType: 4` (re-attached).
 *
 * @param {string} csn        Client Session Nonce.           [was: Q]
 * @param {Object} veParent   Parent VE to iterate children.  [was: c]
 * [was: g.k0]
 */
export function batchShowVisualElements(csn, veParent) { // was: g.k0
  // Implementation delegates to g.lw(veParent, callback)
  // Each child VE is logged as visualElementShown with eventType 4
}

/**
 * Batch-hide visual elements under a given CSN.
 *
 * @param {string} csn        Client Session Nonce.           [was: Q]
 * @param {Object} veParent   Parent VE to iterate children.  [was: c]
 * [was: g.Y0]
 */
export function batchHideVisualElements(csn, veParent) { // was: g.Y0
  // Implementation delegates to g.lw(veParent, callback)
  // Each child VE is logged via logVisualElementHidden
}

/**
 * Log a generic click on a visual element (convenience).
 *
 * @param {string} csn            [was: Q]
 * @param {Object} visualElement  [was: c]
 * @param {Object} [clientData]   [was: W]
 * [was: g.pa]
 */
export function logClick(csn, visualElement, clientData) { // was: g.pa
  logVisualElementClicked(undefined, csn, visualElement, clientData, undefined);
}

/**
 * Log a gesture with explicit gesture type (convenience).
 *
 * @param {string} csn            [was: Q]
 * @param {Object} visualElement  [was: c]
 * @param {string} gestureType    [was: W]
 * @param {Object} [clientData]   [was: m]
 * [was: Qj]
 */
export function logGesture(csn, visualElement, gestureType, clientData) { // was: Qj
  logVisualElementGesture(undefined, csn, visualElement, gestureType, clientData, undefined);
}

// ---------------------------------------------------------------------------
// Unique-ID generator for player components
// ---------------------------------------------------------------------------

/** @type {number} [was: f5w] */
let componentIdCounter = 0;

/**
 * Generate a unique DOM element ID for a player component.
 * Format: "ytp-id-0", "ytp-id-1", etc.
 *
 * @returns {string}
 * [was: mU]
 */
export function generateComponentId() { // was: mU
  const id = 'ytp-id-' + componentIdCounter.toString();
  componentIdCounter++;
  return id;
}

/**
 * Generate a scoped unique ID by appending a base-36 counter.
 * Format: `${prefix}:${counter}` — e.g. "button:1a".
 *
 * @param {string} prefix  Base prefix string.  [was: Q]
 * @returns {string}
 * [was: c1]
 */
export function generateScopedId(prefix) { // was: c1
  // od.getInstance().W++ — singleton counter, base-36 encoded
  // Simplified: uses a module-level counter
  const suffix = ':' + (scopedIdCounter++).toString(36);
  return prefix + suffix;
}

/** @type {number} Internal counter for generateScopedId. */
let scopedIdCounter = 0;
