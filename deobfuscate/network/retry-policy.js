import { sendPromiseRequest } from './request.js';

/**
 * Error Handling and Retry Logic
 *
 * Exponential-backoff retry for network requests, error classification
 * (retryable vs. fatal), and the error-weight table used by the player's
 * error-reporting pipeline.
 *
 * Source: base.js lines 11567-11611, 66735-66776, 120003-120065
 *
 * @module network/retry-policy
 */

// ---------------------------------------------------------------------------
// Retry with exponential backoff
// ---------------------------------------------------------------------------

/**
 * Sends an XHR-based request and retries on failure using exponential
 * backoff. Stops retrying when:
 *   - `maxRetries` is exhausted, or
 *   - the server returns HTTP 403 (fatal / auth failure).
 *
 * [was: sendWithRetry]
 *
 * @param {string} url                    - Request URL [was: Q]
 * @param {AjaxOptions} options           - XHR options (forwarded to sendPromiseRequest) [was: c]
 * @param {number} maxRetries             - Maximum number of retries [was: W]
 * @param {number} baseDelayMs            - Initial backoff delay in ms [was: m]
 * @param {number} [maxDelayMs=-1]        - Cap on backoff delay; -1 = unlimited [was: K]
 * @param {Function} [onRetry]            - Called before each retry with (error, retriesLeft) [was: T]
 * @returns {Promise<SuccessResponse>}      Resolves on success, rejects with
 *          {@link PromiseAjaxError} when retries are exhausted or a 403 is received.
 */
export function sendWithRetry( // was: g.o2
  url,
  options,
  maxRetries,
  baseDelayMs,
  maxDelayMs = -1,
  onRetry,
) {
  /**
   * Returns a promise that resolves after `ms` milliseconds.
   * [was: r (inner)]
   */
  const delay = (sendPostRequest) => new Promise((resolve) => setTimeout(resolve, sendPostRequest)); // was: r

  /**
   * Recursive retry loop.
   * [was: U (inner)]
   *
   * @param {Promise} requestPromise - Current in-flight request
   * @param {number} retriesLeft     - Remaining retry attempts [was: X]
   * @param {number} currentDelayMs  - Current backoff interval [was: A]
   * @returns {Promise<SuccessResponse>}
   */
  const retryLoop = (requestPromise, retriesLeft, currentDelayMs) => // was: U
    requestPromise.catch((error) => {
      // No retries left or 403 -> give up immediately
      if (retriesLeft <= 0 || getHttpStatus(error.xhr) === 403) {
        return Promise.reject(
          new PromiseAjaxError(
            'Request retried too many times',
            'net.retryexhausted',
            error.xhr,
          ),
        );
      }

      // Exponential backoff: 2^(attempt) * baseDelay
      const computedDelay = Math.pow(2, maxRetries - retriesLeft + 1) * currentDelayMs; // was: V
      const cappedDelay = maxDelayMs > 0 ? Math.min(maxDelayMs, computedDelay) : computedDelay; // was: B

      return delay(currentDelayMs).then(() => {
        onRetry?.(error, retriesLeft - 1);
        return retryLoop(
          sendPromiseRequest(url, options), // was: TG(Q, c)
          retriesLeft - 1,
          cappedDelay,
        );
      });
    });

  return retryLoop(
    sendPromiseRequest(url, options), // was: TG(Q, c)
    maxRetries - 1,
    baseDelayMs,
  );
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

/**
 * Standard network error codes emitted by the request layer.
 * The string values double as suffixes in player error strings
 * (e.g. `"manifest.net.retryexhausted"`).
 *
 * @enum {string}
 */
export const NetworkErrorCode = { // was: errorCode values from Kh
  /** HTTP status indicated failure */
  BAD_STATUS:       'net.badstatus',

  /** Cause could not be determined */
  UNKNOWN:          'net.unknown',

  /** Request timed out */
  TIMEOUT:          'net.timeout',

  /** All retry attempts exhausted */
  RETRY_EXHAUSTED:  'net.retryexhausted',
};

/**
 * Determines whether a given error code represents a retriable condition.
 * HTTP 403 and explicit `net.retryexhausted` are considered non-retriable.
 *
 * @param {string} errorCode - One of {@link NetworkErrorCode}
 * @param {number} [httpStatus] - HTTP status code if available
 * @returns {boolean}
 */
export function isRetriableError(errorCode, httpStatus) {
  if (httpStatus === 403) return false;
  if (errorCode === NetworkErrorCode.RETRY_EXHAUSTED) return false;
  return true;
}

/**
 * Common composite error codes used in player error propagation.
 * These combine a domain (e.g. "manifest", "progressive", "drm") with
 * a network error suffix.
 *
 * @type {Record<string, string>}
 */
export const CompositeErrorCode = {
  MANIFEST_RETRY_EXHAUSTED:     'manifest.net.retryexhausted',
  PROGRESSIVE_RETRY_EXHAUSTED:  'progressive.net.retryexhausted',
  DRM_RETRY_EXHAUSTED:          'drm.net.retryexhausted',
  NET_BAD_STATUS:               'net.badstatus',
};

// ---------------------------------------------------------------------------
// Error weight table (used for error reporting / sampling)
// ---------------------------------------------------------------------------

/**
 * A table of error-message patterns and their associated sampling weights.
 * Higher weight = more likely to be sampled in error reporting. A weight of
 * 0 means the error is suppressed entirely.
 * [was: nGa]
 *
 * @type {{ patternRules: Array<{pattern: RegExp, weight: number}>, callbackRules: Array<{callback: Function, weight: number}> }}
 */
export const ERROR_WEIGHT_TABLE = { // was: nGa
  /**
   * Pattern-based rules. Each `pattern` [was: J2] is matched against the
   * error message; `weight` controls sampling probability.
   */
  patternRules: [ // was: iS
    {
      pattern: /Unable to load player module/,   // was: J2
      weight: 20,
    },
    {
      pattern: /Failed to fetch/,
      weight: 500,
    },
    {
      pattern: /XHR API fetch failed/,
      weight: 10,
    },
    {
      pattern: /JSON parsing failed after XHR fetch/,
      weight: 10,
    },
    {
      pattern: /Retrying OnePlatform request/,
      weight: 10,
    },
    {
      pattern: /CSN Missing or undefined during playback association/,
      weight: 100,
    },
    {
      pattern: /Non-recoverable error. computeReadaheadLimit not retry./,
      weight: 0,  // suppressed: non-retriable
    },
    {
      pattern: /Internal Error. Retry with an exponential backoff./,
      weight: 0,  // suppressed: already retried
    },
    {
      pattern: /API disabled SYM_BINARY application./,
      weight: 0,  // suppressed
    },
    {
      pattern: /Unexpected end of JSON input/,
      weight: 0,  // suppressed
    },
  ],

  /**
   * Callback-based rules. Each `callback` [was: Hn[].callback] is invoked
   * with the error; if it returns truthy the corresponding weight is used.
   */
  callbackRules: [ // was: Hn
    {
      callback: checkAdBlockError, // was: o$d
      weight: 500,
    },
  ],
};

// ---------------------------------------------------------------------------
// PromiseAjaxError (re-exported for import convenience)
// ---------------------------------------------------------------------------

/**
 * Error class thrown by the promise-based AJAX helpers when a request fails.
 * [was: Kh]
 */
export class PromiseAjaxError extends Error { // was: Kh
  /**
   * @param {string} message
   * @param {string} errorCode - One of {@link NetworkErrorCode}
   * @param {XMLHttpRequest} [xhr]
   */
  constructor(message, errorCode, xhr) {
    super(`${message}, errorCode=${errorCode}`);
    this.errorCode = errorCode;
    this.xhr       = xhr;
    this.name      = 'PromiseAjaxError';
  }
}

/**
 * Wrapper for a successful XHR response (resolved value from
 * {@link sendPromiseRequest}).
 * [was: dS7]
 */
export class SuccessResponse { // was: dS7
  /** @param {XMLHttpRequest} xhr */
  constructor(xhr) {
    this.xhr = xhr;
  }
}

/**
 * Biscotti-specific error class. Wraps underlying network or missing-ID
 * errors with typed boolean flags.
 * [was: MWO]
 */
export class BiscottiError extends Error { // was: MWO
  /**
   * @param {Error} cause - The underlying error
   */
  constructor(cause) {
    super(cause.message || cause.description || cause.name);
    /** Whether the Biscotti ID was not found on the server */
    this.isMissing = cause instanceof BiscottiMissingError; // was: hE
    /** Whether the request timed out */
    this.isTimeout = cause instanceof PromiseAjaxError && cause.errorCode === 'net.timeout';
    /** Whether the request was cancelled */
    this.isCanceled = cause instanceof CancelError; // was: eH
  }
}
BiscottiError.prototype.name = 'BiscottiError';

/**
 * Thrown when the Biscotti ID is absent from the server response.
 * [was: hE]
 */
export class BiscottiMissingError extends Error { // was: hE
  constructor() {
    super('Biscotti ID is missing from server');
  }
}

// ---------------------------------------------------------------------------
// Player-level flag constants for error-state tracking
// ---------------------------------------------------------------------------

/**
 * Player capability flags related to error recovery and retry.
 * [was: K90 (partial)]
 *
 * @type {Record<string, number>}
 */
export const PLAYER_FLAGS = { // was: K90
  FLAG_AUTO_CAPTIONS_DEFAULT_ON:  66,
  FLAG_AUTOPLAY_DISABLED:        140,
  FLAG_AUTOPLAY_EXPLICITLY_SET:  141,
};

// ---------------------------------------------------------------------------
// URL-validation patterns (used for telemetry / ping URLs)
// ---------------------------------------------------------------------------

/**
 * Pattern matching proxy-action URLs.
 * [was: RM7]
 * @type {RegExp}
 */
export const ACTION_PROXY_PATTERN = /[&?]action_proxy=1/; // was: RM7

/**
 * Extracts the `token` parameter from a URL.
 * [was: Jbw]
 * @type {RegExp}
 */
export const TOKEN_PATTERN = /[&?]token=([\w-]*)/; // was: Jbw

/**
 * Extracts the `video_id` parameter from a URL.
 * [was: kfO]
 * @type {RegExp}
 */
export const VIDEO_ID_PATTERN = /[&?]video_id=([\w-]*)/; // was: kfO

/**
 * Extracts the `index` parameter from a URL.
 * [was: YpO]
 * @type {RegExp}
 */
export const INDEX_PATTERN = /[&?]index=([\d-]*)/; // was: YpO

/**
 * Extracts the `m_pos_ms` parameter from a URL.
 * [was: pmK]
 * @type {RegExp}
 */
export const MEDIA_POSITION_PATTERN = /[&?]m_pos_ms=([\d-]*)/; // was: pmK

/**
 * Extracts the `vvt` (video visit token) parameter from a URL.
 * [was: TnX]
 * @type {RegExp}
 */
export const VIDEO_VISIT_TOKEN_PATTERN = /[&?]vvt=([\w-]*)/; // was: TnX

// ---------------------------------------------------------------------------
// Ad-signal query parameters forwarded with pings
// ---------------------------------------------------------------------------

/**
 * Allowlisted query-parameter names that are forwarded to ad-signal URLs.
 * [was: ALW]
 *
 * @type {string[]}
 */
export const AD_SIGNAL_PARAMS = [ // was: ALW
  'ca_type', 'dt', 'el', 'flash', 'u_tz', 'u_his', 'u_h', 'u_w',
  'u_ah', 'u_aw', 'u_cd', 'u_nplug', 'u_nmime', 'frm', 'u_java',
  'bc', 'bih', 'biw', 'brdim', 'vis', 'wgl',
];

// ---------------------------------------------------------------------------
// Placeholder imports
// ---------------------------------------------------------------------------

/*
import { sendPromiseRequest, PromiseAjaxError, SuccessResponse }
  from './request.js';
import { CancelError }
import { sendPostRequest } from './request.js'; // was: ms
import { computeReadaheadLimit } from '../media/segment-loader.js'; // was: Do
import { SYM_BINARY } from '../proto/message-setup.js'; // was: by
  from '../core/errors.js';

// getHttpStatus extracts xhr.status, returning -1 when unavailable.
function getHttpStatus(xhr) {
  return xhr && 'status' in xhr ? xhr.status : -1;
}

// checkAdBlockError [was: o$d] is a callback that detects ad-blocker
// interference; its implementation lives in the ad-signals module.
function checkAdBlockError(error) { /* ... *\/ }
*/
