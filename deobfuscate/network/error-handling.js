/**
 * error-handling.js -- XHR / Innertube response error handling
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~80474-80516, 28616-28629
 *
 * Provides:
 *  - XhrApiFetcher: a minimal XHR-based fetch adapter that sends requests,
 *    strips the XSSI prefix (`)]}'`), JSON-parses the body, and attaches
 *    Innertube error metadata on non-200 responses.
 *  - createXhrRequest: factory that opens and configures a raw XMLHttpRequest
 *    with credentials, custom headers, and optional readystatechange hooks.
 *
 * @module network/error-handling
 */
import { compose } from '../core/composition-helpers.js'; // was: Ix

// ============================================================================
// createXhrRequest  [was: g1R]
// ============================================================================

/**
 * Open and configure a raw `XMLHttpRequest`.
 *
 * Sets:
 *  - `responseType = "text"`
 *  - `withCredentials = true`
 *  - Any custom headers from `options.headers`
 *  - An optional `onreadystatechange` hook from `options.Ix`
 *
 * [was: g1R]
 * @param {string} url            request URL          [was: Q]
 * @param {Object} options        request configuration [was: c]
 * @param {string} [options.method="GET"]  HTTP method
 * @param {Object} [options.headers]       header key-value map
 * @param {Object} [fetchOptions]          extra fetch options  [was: W]
 * @param {Function} [fetchOptions.Ix]     readystatechange callback
 * @returns {XMLHttpRequest}
 */
export function createXhrRequest(url, options, fetchOptions) { // was: g1R
  const xhr = new XMLHttpRequest(); // was: m

  if (fetchOptions?.compose) { // was: W?.Ix
    xhr.onreadystatechange = (event) => { // was: K
      fetchOptions.compose(xhr, event);
    };
  }

  xhr.open(options.method ?? 'GET', url, true); // was: m.open(c.method ?? "GET", Q, !0)
  xhr.responseType = 'text';
  xhr.withCredentials = true; // was: !0

  if (options.headers) {
    for (const [header, value] of Object.entries(options.headers)) { // was: [K,T]
      xhr.setRequestHeader(header, value);
    }
  }

  return xhr;
}

// ============================================================================
// XhrApiFetcher  [was: mG]
// ============================================================================

/**
 * Minimal fetch adapter that uses `XMLHttpRequest` under the hood.
 *
 * The `fetch()` method returns a `Promise<Object>` that resolves with
 * the parsed JSON response body.  On non-200 status codes the body is
 * still parsed, but an `errorMetadata.status` field is injected into the
 * result.
 *
 * The XSSI / JSON-hijacking prefix `)]}'` that Google APIs prepend to
 * JSON responses is stripped before parsing.
 *
 * [was: mG]
 */
export class XhrApiFetcher {
  /**
   * Send an XHR request and return the parsed JSON response.
   *
   * [was: mG.prototype.fetch]
   * @param {string} url            [was: Q]
   * @param {Object} requestConfig  { method, body, headers } [was: c]
   * @param {Object} [fetchOptions] [was: W]
   * @param {boolean} [fetchOptions.dR] -- when true, throw on JSON parse failure
   * @returns {Promise<Object>}
   */
  fetch(url, requestConfig, fetchOptions) { // was: fetch(Q, c, W)
    const xhr = createXhrRequest(url, requestConfig, fetchOptions); // was: g1R(Q, c, W)

    return new Promise((resolve, reject) => { // was: (K, T)
      const handleDone = () => { // was: r
        if (fetchOptions?.dR) { // was: W?.dR
          try {
            const result = this.handleResponse(url, xhr.status, xhr.response, fetchOptions);
            resolve(result);
          } catch (err) { // was: U
            reject(err);
          }
        } else {
          resolve(this.handleResponse(url, xhr.status, xhr.response, fetchOptions));
        }
      };

      xhr.onerror = handleDone;
      xhr.onload = handleDone;
      xhr.send(requestConfig.body ?? null); // was: m.send(c.body ?? null)
    });
  }

  /**
   * Parse an XHR response body, stripping the XSSI prefix and handling
   * JSON parse failures and non-200 status codes.
   *
   * **JSON parsing fallback:**
   * If `JSON.parse` throws, an error is reported to the telemetry
   * pipeline via `reportWarning(new g.H8(...))`.  When `fetchOptions.dR` is
   * truthy **and** the body is non-empty, the error is re-thrown as a
   * `g.A1` (a fatal innertube error).  Otherwise, an empty object `{}`
   * is returned so that callers always receive a valid object.
   *
   * **HTTP status handling:**
   * When `status !== 200`, an `errorMetadata` object is merged into the
   * result so that downstream code can detect and react to API errors
   * without inspecting the HTTP layer directly.
   *
   * [was: mG.prototype.handleResponse]
   * @param {string} url          the original request URL   [was: Q]
   * @param {number} status       HTTP status code           [was: c]
   * @param {string} rawBody      raw response text          [was: W]
   * @param {Object} [fetchOptions]                          [was: m]
   * @returns {Object} parsed (and possibly error-decorated) response
   */
  handleResponse(url, status, rawBody, fetchOptions) { // was: handleResponse(Q, c, W, m)
    // Strip the Google XSSI / JSON-hijacking prefix.
    const body = rawBody.replace(")]}'", ''); // was: W.replace(")]}'", "")

    let parsed; // was: K
    try {
      parsed = JSON.parse(body);
    } catch (err) { // was: T
      // Report parse failure for telemetry.
      // was: g.Ty(new g.H8("JSON parsing failed after XHR fetch", Q, c, W))
      reportError('JSON parsing failed after XHR fetch', url, status, rawBody);

      if (fetchOptions?.dR && body) { // was: m?.dR && W
        // Propagate as a fatal innertube error.
        // was: throw new g.A1("JSON parsing failed after XHR fetch")
        throw new InnertubeError('JSON parsing failed after XHR fetch');
      }

      parsed = {};
    }

    // Attach error metadata for non-200 responses.
    if (status !== 200) {
      // was: g.Ty(new g.H8("XHR API fetch failed", Q, c, W))
      reportError('XHR API fetch failed', url, status, rawBody);

      parsed = {
        ...parsed,
        errorMetadata: {
          status, // was: status: c
        },
      };
    }

    return parsed;
  }
}

// ============================================================================
// Error helpers (stubs -- real implementations live in core/error.js)
// ============================================================================

/**
 * Report a non-fatal error to the YouTube telemetry pipeline.
 * In production this calls `reportWarning(new g.H8(...))`.
 *
 * [was: reportWarning + g.H8]
 * @param {string} message
 * @param  {...*} args
 */
function reportError(message, ...args) {
  // In the original: g.Ty(new g.H8(message, ...args))
  // This is a telemetry side-channel; a no-op here.
  if (typeof console !== 'undefined') {
    console.warn('[InnertubeXhr]', message, ...args);
  }
}

/**
 * A fatal Innertube error that propagates to callers when `dR` is set.
 * Extends the base `g.H8` error class in the original codebase.
 *
 * [was: g.A1]
 */
export class InnertubeError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'InnertubeError'; // was: g.A1
  }
}
