/**
 * Media Integrity (Android WebView)
 *
 * Provides and requests media-integrity tokens from the Android WebView
 * experimental API, used for attestation of playback requests.
 *
 * Cloud project: 868618676952
 *
 * Timing markers:
 *   pt_pis  - provider init start
 *   pt_pif  - provider init finished (success)
 *   pt_pie  - provider init error
 *   pt_ms   - token request (media) start
 *   pt_mf   - token request (media) finished (success)
 *   pt_me   - token request (media) error (catch in promise)
 *   pt_mec  - token request (media) error (catch in try/catch)
 *
 * Source: base.js lines 46981-47051
 * @module media-integrity
 */

// ---------------------------------------------------------------------------
// Feature detection  [was: kB]
// ---------------------------------------------------------------------------


import { reportWarning } from '../data/gel-params.js'; // was: g.Ty
import { MetricCondition } from '../data/module-init.js'; // was: X_
import { getTimeInBuffer } from './source-buffer.js'; // was: Tm
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { handleError } from '../player/context-updates.js';

/**
 * Returns `true` when the Android WebView media-integrity token provider API
 * is available on the current page.
 *
 * @returns {boolean}
 */
export function isMediaIntegrityAvailable() { // was: kB
  return !!(
    window.android &&
    window.android.webview &&
    window.android.webview.getExperimentalMediaIntegrityTokenProvider
  );
}

// ---------------------------------------------------------------------------
// Provider initialisation  [was: rMR]
// ---------------------------------------------------------------------------

/**
 * Initialises the media-integrity token provider for the given context.
 * Must be called once (typically at player start or via `requestIdleCallback`).
 *
 * On success the provider reference is stored in `ctx.O` and the pending
 * promise (`ctx.W`) is resolved.
 *
 * @param {Object} ctx - The integrity context object.
 *   ctx.api  - player API handle
 *   ctx.KO   - performance timer  [was: KO / X_()]
 *   ctx.W    - pending promise     [was: g8]
 *   ctx.O    - provider reference  (set on success)
 */
export function initMediaIntegrityProvider(ctx) { // was: rMR
  if (!isMediaIntegrityAvailable()) return;

  ctx.KO = ctx.api.MetricCondition(); // was: X_  (perf timer factory)
  ctx.KO.getTimeInBuffer("pt_pis");   // timing: provider-init-start

  try {
    window.android.webview
      .getExperimentalMediaIntegrityTokenProvider({
        cloudProjectNumber: 868618676952,
      })
      .then((provider) => {
        ctx.O = provider;
        ctx.W?.resolve();
        ctx.KO.getTimeInBuffer("pt_pif"); // timing: provider-init-finished
      })
      .catch((err) => {
        logIntegrityError(err, "player_start"); // was: YB
        ctx.KO.getTimeInBuffer("pt_pie"); // timing: provider-init-error
        ctx.W?.reject(err);
      });
  } catch (err) {
    logIntegrityError(err, "player_start_catch");
    ctx.api.RetryTimer("pfes", {}); // telemetry: provider-fetch-error-sync
    ctx.W?.reject(err);
  }
}

// ---------------------------------------------------------------------------
// Initialisation entry-point (idle-aware)  [was: UOy]
// ---------------------------------------------------------------------------

/**
 * Kicks off the media-integrity flow. Uses `requestIdleCallback` when
 * available; otherwise falls back to a synchronous call.
 *
 * @param {Object} ctx - The integrity context object.
 */
export function startMediaIntegrity(ctx) { // was: UOy
  if (!isMediaIntegrityAvailable()) return;

  ctx.KO = ctx.api.MetricCondition();
  ctx.W = new g8();     // was: g8 (deferred / promise wrapper)
  ctx.A = 2;            // status: awaiting provider

  ctx.KO.getTimeInBuffer("pt_pish"); // timing: provider-init-scheduled-hint

  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      initMediaIntegrityProvider(ctx);
    });
  } else {
    initMediaIntegrityProvider(ctx);
  }
}

// ---------------------------------------------------------------------------
// Token request  [was: Io7]
// ---------------------------------------------------------------------------

/**
 * Requests a media-integrity token for a specific video. The token is
 * attached to `videoData.iN.Qb` for downstream consumption.
 *
 * @param {Object} ctx       - The integrity context object (must have `.O` set).
 * @param {Object} videoData - The video data object (needs `.videoId`).
 */
export function requestMediaIntegrityToken(ctx, videoData) { // was: Io7
  if (!ctx.O) return; // provider not initialised

  const videoId = videoData.videoId;
  ctx.A = 3; // status: requesting token
  ctx.KO.getTimeInBuffer("pt_ms"); // timing: media-token-start

  try {
    ctx.O.requestToken(videoId)
      .then((rawToken) => {
        ctx.KO.getTimeInBuffer("pt_mf"); // timing: media-token-finished
        const token = Is(rawToken); // was: Is  (extract token string)
        if (token) {
          videoData.iN = { Qb: token };
        }
      })
      .catch((err) => {
        ctx.KO.getTimeInBuffer("pt_me"); // timing: media-token-error
        logIntegrityError(err, "player_generate");
        ctx.handleError(err, videoData);
      });
  } catch (err) {
    logIntegrityError(err, "player_generate_catch");
    ctx.handleError(err, videoData);
  }
}

// ---------------------------------------------------------------------------
// Error logging helper  [was: YB]
// ---------------------------------------------------------------------------

/**
 * Logs a media-integrity error if it carries a message.
 *
 * @param {Error} err    - The caught error.
 * @param {string} phase - Human-readable phase label (e.g. "player_start").
 */
function logIntegrityError(err, phase) { // was: YB
  if (err.message) {
    reportWarning(Error(`${phase}_${err.message}`));
  }
}
