import { addFinallyHandler } from '../core/composition-helpers.js';
import { MetricCondition } from '../data/module-init.js'; // was: X_

/**
 * error-config.js -- Network error sampling, URL parameter extraction,
 * client-to-platform mapping, biscotti-ID fetch wrapper, and ad command
 * interface constants.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~120000-120165
 *
 * Provides:
 *  - Player prototype stubs (g.Iy.prototype.bE, .LY) via c3() factory
 *  - Empty error config namespace (Uf)
 *  - Error-weight sampling table (nGa) -- patterns + weights for error
 *    log suppression (cross-ref: network/retry-policy.js)
 *  - URL parameter extraction regexes (RM7, Jbw, kfO, YpO, pmK, TnX)
 *    (cross-ref: network/retry-policy.js)
 *  - Ad signal query-string parameter list (ALW)
 *    (cross-ref: network/retry-policy.js)
 *  - No-cookie / redirect domains (mEO)
 *    (cross-ref: network/service-endpoints.js)
 *  - Client ID to platform name mapping (ek7)
 *    (cross-ref: network/service-endpoints.js)
 *  - Device form-factor mapping (V1d)
 *    (cross-ref: network/service-endpoints.js)
 *  - Player experiment flag enum (K90)
 *    (cross-ref: network/retry-policy.js)
 *  - BiscottiFetcher (Dno): wraps URL fetch with [BISCOTTI_ID] macro
 *    replacement, CSI tick instrumentation, and request dedup counters
 *  - Ad command interface keys (tzm) -- already in ads/ad-pinging.js
 *  - Ad pinging endpoint (xmx), engagement panel action (qDm),
 *    logging URLs pinger (n$_) -- already in ads/ad-pinging.js
 *  - AdPingingLifecycle (Hsi), PingEventForwarder (SDm),
 *    DefaultContentPlaybackLifecycleApi (Xe) -- already in ads/ad-pinging.js
 *
 * NOTE: Many symbols in this range are already deobfuscated in other modules
 * (see cross-references above). This file covers the items that are NOT yet
 * present elsewhere, primarily BiscottiFetcher and the g.Iy prototype stubs.
 *
 * @module network/error-config
 */

// ---------------------------------------------------------------------------
// Player prototype method stubs (lines 119998-120001)
// ---------------------------------------------------------------------------
// These attach generated accessor methods to the main App (g.Iy) prototype
// using the c3() factory (which creates a method that reads a numbered slot
// from the player's internal config table).
//
// g.Iy.prototype.xa = c3(41);   -- already in player-container.js
// g.Iy.prototype.IH = c3(16);   -- already in player-container.js
// g.Iy.prototype.bE = c3(10);   -- config slot 10 accessor
// g.Iy.prototype.LY = c3(8);    -- config slot 8 accessor

// ---------------------------------------------------------------------------
// Empty error config namespace (line 120002)
// ---------------------------------------------------------------------------

/**
 * Reserved namespace object for error configuration.
 * Populated elsewhere at runtime.
 *
 * [was: Uf]
 */
export const errorConfigNamespace = {}; // was: Uf

// ---------------------------------------------------------------------------
// BiscottiFetcher (lines ~120071-120098)
// ---------------------------------------------------------------------------

/**
 * Wraps URL fetching with automatic `[BISCOTTI_ID]` macro replacement.
 *
 * When a fetch URL contains the literal string `[BISCOTTI_ID]`, this class
 * first obtains the biscotti token (synchronously via `getBiscottiId()` if
 * already cached, otherwise asynchronously via `fetchBiscottiId()`), then
 * substitutes it into the URL before delegating to the underlying
 * `executeFetch()` helper.
 *
 * Also emits CSI timing ticks (`a_bid_s` at start, `a_bid_f` at finish)
 * on the first request after construction or `reset()`.
 *
 * [was: Dno]
 */
export class BiscottiFetcher {
  /**
   * @param {Object} player - the player instance, used for CSI timing [was: Q]
   */
  constructor(player) {
    this.player = player; // was: this.player = Q
    this.requestCount = 1; // was: this.W = 1
    this.fetchCount = 1;   // was: this.O = 1
  }

  /**
   * Record a CSI timing tick on the player's timing object.
   * @param {string} tickName [was: Q]
   */
  tick(tickName) { // was: Gj
    this.player.MetricCondition().tick(tickName);
  }

  /**
   * Fetch a URL, replacing `[BISCOTTI_ID]` macros first if present.
   *
   * If the URL has no BISCOTTI_ID macro, delegates immediately.
   * Otherwise, attempts synchronous retrieval (`getBiscottiId`);
   * if unavailable, fetches it asynchronously and chains the result.
   *
   * @param {string} url - the URL (may contain `[BISCOTTI_ID]`) [was: Q]
   * @param {Object} options - fetch configuration [was: c]
   * @returns {Promise} the fetch result
   */
  fetch(url, options) { // was: fetch(Q, c)
    if (!url.match(/\[BISCOTTI_ID\]/g)) {
      return executeFetch(this, url, options); // was: jk(this, Q, c)
    }

    const isFirstRequest = this.requestCount === 1; // was: W
    if (isFirstRequest) this.tick("a_bid_s");

    let cachedId = getBiscottiId(); // was: m = Umw()
    if (cachedId !== null) {
      if (isFirstRequest) this.tick("a_bid_f");
      return executeFetch(this, url, options, cachedId); // was: jk(this, Q, c, m)
    }

    const fetchPromise = fetchBiscottiId(); // was: m = ICK()
    if (isFirstRequest) {
      addFinallyHandler(fetchPromise, () => { // was: g.rV(m, () => { ... })
        this.tick("a_bid_f");
      });
    }

    return fetchPromise.then(
      (biscottiId) => executeFetch(this, url, options, biscottiId) // was: K => jk(this, Q, c, K)
    );
  }

  /**
   * Reset the request/fetch counters so the next fetch re-emits CSI ticks.
   */
  reset() { // was: reset()
    this.requestCount = 1; // was: this.W = 1
    this.fetchCount = 1;   // was: this.O = 1
  }
}

// ---------------------------------------------------------------------------
// Ad command interface constants (line 120100-120103)
// ---------------------------------------------------------------------------
// Already deobfuscated in ads/ad-pinging.js as `adPingingMethodKeys`.
// Repeated here for reference only:
//
// export const adCommandInterface = {  // was: tzm
//   replaceUrlMacros: "replaceUrlMacros",          // was: lFC
//   onAboutThisAdPopupClosed: "onAboutThisAdPopupClosed", // was: H_
//   executeCommand: "executeCommand",              // was: RD
// };

// ---------------------------------------------------------------------------
// Ad pinging / engagement-panel / logging-URLs endpoints (lines 120105-120142)
// ---------------------------------------------------------------------------
// Already deobfuscated in ads/ad-pinging.js:
//   AdPingingEndpoint       [was: xmx]  -- "adPingingEndpoint"
//   EngagementPanelVisibilityAction [was: qDm]  -- "changeEngagementPanelVisibilityAction"
//   LoggingUrlsPinger       [was: n$_]  -- "loggingUrls"

// ---------------------------------------------------------------------------
// Cross-references to fully deobfuscated symbols elsewhere
// ---------------------------------------------------------------------------
//
// ERROR_WEIGHT_TABLE (nGa)          -> network/retry-policy.js
// ACTION_PROXY_PATTERN (RM7)        -> network/retry-policy.js
// TOKEN_PATTERN (Jbw)               -> network/retry-policy.js
// VIDEO_ID_PATTERN (kfO)            -> network/retry-policy.js
// INDEX_PATTERN (YpO)               -> network/retry-policy.js
// MEDIA_POSITION_PATTERN (pmK)      -> network/retry-policy.js
// VIDEO_VISIT_TOKEN_PATTERN (TnX)   -> network/retry-policy.js
// AD_SIGNAL_PARAMS (ALW)            -> network/retry-policy.js
// CLIENT_ID_TO_NAME (ek7)           -> network/service-endpoints.js
// FORM_FACTOR_MAP (V1d)             -> network/service-endpoints.js
// NOCOOKIE_DOMAINS (mEO)            -> network/service-endpoints.js
// PLAYER_FLAGS (K90)                -> network/retry-policy.js
// adPingingMethodKeys (tzm)         -> ads/ad-pinging.js
// AdPingingEndpoint (xmx)           -> ads/ad-pinging.js
// EngagementPanelVisibilityAction (qDm) -> ads/ad-pinging.js
// LoggingUrlsPinger (n$_)           -> ads/ad-pinging.js
// AdPingingLifecycle (Hsi)          -> ads/ad-pinging.js
// PingEventForwarder (SDm)          -> ads/ad-pinging.js
// DefaultContentPlaybackLifecycleApi (Xe) -> ads/ad-pinging.js

// ---------------------------------------------------------------------------
// External function stubs (not defined in this range, referenced only)
// ---------------------------------------------------------------------------

/**
 * Execute a fetch request with optional biscotti ID substitution.
 * Defined elsewhere in base.js (~line 55139).
 *
 * [was: jk]
 *
 * @param {BiscottiFetcher} fetcher [was: Q]
 * @param {string} url [was: c]
 * @param {Object} options [was: destructured {yG, Td, cueProcessedMs}]
 * @param {string} [biscottiId] [was: T]
 */
function executeFetch(fetcher, url, options, biscottiId) { // was: jk
  // Stub -- actual implementation lives at line ~55139
  // jk = function(Q, c, {yG: W, Td: m, cueProcessedMs: K}={}, T="") { ... }
  throw new Error("executeFetch stub: link to actual implementation");
}

/**
 * Synchronously retrieve the cached biscotti ID, or null if not yet fetched.
 * Defined elsewhere in base.js (~line 55121).
 *
 * [was: Umw]
 *
 * @returns {string|null}
 */
function getBiscottiId() { // was: Umw
  throw new Error("getBiscottiId stub: link to actual implementation");
}

/**
 * Asynchronously fetch the biscotti ID from the server.
 * Defined elsewhere in base.js (~line 55127).
 *
 * [was: ICK]
 *
 * @returns {Promise<string>}
 */
function fetchBiscottiId() { // was: ICK
  throw new Error("fetchBiscottiId stub: link to actual implementation");
}
