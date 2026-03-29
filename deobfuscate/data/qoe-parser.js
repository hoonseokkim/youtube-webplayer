/**
 * qoe-parser.js -- QoE and videostats URL parameter extraction
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~32986-33097
 *
 * Handles:
 *  - Ptracking URL parameter extraction (oid, pltype, ptchn, ptk, m)
 *  - QoE URL query parsing and CAT list categorization
 *  - DRM product information extraction from qoeUrl
 *  - Videostats playback URL parsing (adformat, ad_query_id, autoplay, etc.)
 *  - Videostats watchtime / ATR / engage URL parsing
 *  - Promoted playback tracking URL collection
 *  - Ad format detection and resolution via XI3
 */

import { getPlayerConfig } from '../core/attestation.js';  // was: g.pm
import { PlayerError } from '../ui/cue-manager.js';  // was: g.rh
import { parseQueryString } from './idb-transactions.js';  // was: g.bk
import { getInMemoryStore } from './gel-core.js'; // was: vm
import { isExperimentEnabled } from '../features/experiment-flags.js';
import { concat } from '../core/array-utils.js';

// ---------------------------------------------------------------------------
// Main tracking URL parser  (~32986-33097)
// [was: br_]
// ---------------------------------------------------------------------------

/**
 * Parse tracking URLs from a playability response and populate the
 * video-info object with extracted parameters.
 *
 * Processes:
 *  - `googleRemarketingUrl`
 *  - `youtubeRemarketingUrl`
 *  - `heartbeatLoggingToken`
 *  - `ptrackingUrl`   (owner id, playlist type, channel, key, mode)
 *  - `qoeUrl`         (CAT list, live flag, DRM product)
 *  - `videostatsPlaybackUrl` (ad format, autoplay, autonav, delay, event id, etc.)
 *  - `videostatsWatchtimeUrl`
 *  - `atrUrl`
 *  - `engageUrl`
 *  - `promotedPlaybackTracking` (quartile URLs, engaged view)
 *
 * @param {Object} videoInfo - video info / player vars target [was: Q]
 * @param {Object} trackingData - playability tracking data [was: c]
 * @param {Object} legacyParams - legacy query-param style player vars [was: W]
 * [was: br_]
 */
export function parseTrackingUrls(videoInfo, trackingData, legacyParams) { // was: br_
  // --- Google / YouTube remarketing ---
  let url = extractBaseUrl(trackingData.googleRemarketingUrl); // was: m = u4(c.googleRemarketingUrl)
  if (url) {
    videoInfo.googleRemarketingUrl = url;
  }
  url = extractBaseUrl(trackingData.youtubeRemarketingUrl);
  if (url) {
    videoInfo.youtubeRemarketingUrl = url;
  }

  // --- Heartbeat logging token ---
  if (url = trackingData.heartbeatLoggingToken) { // was: m = c.heartbeatLoggingToken
    videoInfo.heartbeatLoggingToken = url;
  }

  const statsUrls = {}; // was: m = {}

  // --- Ptracking URL ---
  let ptrackingRaw = extractBaseUrl(trackingData.ptrackingUrl); // was: K = u4(c.ptrackingUrl)
  if (ptrackingRaw) {
    const ptrackingParams = flattenQueryParams(ptrackingRaw); // was: K = hx(K)

    let value = ptrackingParams.oid; // was: T = K.oid
    if (value) {
      videoInfo.ownerId = value; // was: Q.Fx = T
    }
    value = ptrackingParams.pltype;
    if (value) {
      videoInfo.playlistType = value; // was: Q.Eq = T
    }
    value = ptrackingParams.ptchn;
    if (value) {
      videoInfo.ptrackingChannel = value; // was: Q.RF = T
    }
    value = ptrackingParams.ptk;
    if (value) {
      videoInfo.ptrackingKey = encodeURIComponent(value); // was: Q.Hy = encodeURIComponent(T)
    }
    value = ptrackingParams.m;
    if (value) {
      videoInfo.ptrackingMode = value; // was: Q.bd = K
    }
  }

  // --- QoE URL ---
  let qoeRaw = extractBaseUrl(trackingData.qoeUrl); // was: K = u4(c.qoeUrl)
  if (qoeRaw) {
    const qoeAllParams = parseQueryString(qoeRaw); // was: K = g.g_(K)

    // Flatten array values to comma-separated strings
    for (const key of Object.keys(qoeAllParams)) { // was: r of Object.keys(K)
      const val = qoeAllParams[key]; // was: T = K[r]
      qoeAllParams[key] = Array.isArray(val) ? val.join(',') : val;
    }

    const qoeParams = qoeAllParams; // was: r = K
    videoInfo.qoeParams = qoeParams; // was: Q.U4 = r

    // CAT list -- feature categorization tags
    const catValue = qoeParams.cat; // was: K = r.cat
    if (catValue) {
      if (videoInfo.isExperimentEnabled('html5_enable_qoe_cat_list')) { // was: Q.X("html5_enable_qoe_cat_list")
        videoInfo.catList = videoInfo.catList.concat(catValue.split(',')); // was: Q.SI = Q.SI.concat(K.split(","))
      } else {
        videoInfo.catString = catValue; // was: Q.hq = K
      }
    }

    // Live indicator
    const liveValue = qoeParams.live; // was: K = r.live
    if (liveValue) {
      videoInfo.qoeLiveFlag = liveValue; // was: Q.Od = K
    }

    // DRM product identifier
    const drmProductValue = qoeParams.drm_product; // was: r = r.drm_product
    if (drmProductValue) {
      videoInfo.drmProduct = drmProductValue; // was: Q.drmProduct = r
    }
  }

  // --- Videostats playback URL ---
  let playbackRaw = extractBaseUrl(trackingData.videostatsPlaybackUrl); // was: r = u4(c.videostatsPlaybackUrl)
  if (playbackRaw) {
    const playbackParams = flattenQueryParams(playbackRaw); // was: r = hx(r)

    // Ad format
    let paramVal = playbackParams.adformat; // was: K = r.adformat
    if (paramVal) {
      legacyParams.adformat = paramVal; // was: W.adformat = K
      const playerConfig = videoInfo.getPlayerConfig(); // was: T = Q.G()
      const resolvedAdFormat = resolveAdFormat(paramVal, videoInfo.PD, playerConfig.j, playerConfig.L); // was: T = XI3(K, Q.PD, T.j, T.L)
      if (resolvedAdFormat) {
        videoInfo.adFormat = resolvedAdFormat; // was: Q.adFormat = T
      }
    }

    // Ad query id
    let tmp = playbackParams.aqi; // was: T = r.aqi
    if (tmp) {
      legacyParams.ad_query_id = tmp; // was: W.ad_query_id = T
    }

    // Autoplay flag
    tmp = playbackParams.autoplay; // was: W = r.autoplay
    if (tmp) {
      videoInfo.isAutoplay = tmp === '1'; // was: Q.F_ = W == "1"
      videoInfo.isAutoplayTriggered = tmp === '1'; // was: Q.kN = W == "1"
    }

    // Autonav flag
    tmp = playbackParams.autonav; // was: W = r.autonav
    if (tmp) {
      videoInfo.isAutonav = tmp === '1'; // was: Q.isAutonav = W == "1"
    }

    // Delay
    tmp = playbackParams.delay; // was: W = r.delay
    if (tmp) {
      videoInfo.delayMs = parseFloat(tmp); // was: Q.A2 = ZQ(W)
    }

    // Event ID
    tmp = playbackParams.ei; // was: W = r.ei
    if (tmp) {
      videoInfo.eventId = tmp; // was: Q.eventId = W
    }

    // Ad context (base64-encoded proto)
    tmp = decodeBase64OrNull(playbackParams.adcontext); // was: W = Is(r.adcontext)
    if (tmp) {
      try {
        const adCtx = parseAdContext(tmp); // was: U = wIR(W)
        if (adCtx) {
          videoInfo.adContext = adCtx; // was: Q.W2 = U
        }
      } catch (_err) { // was: I
        reportError(Error('Malformed adContext')); // was: g.Ty(Error("Malformed adContext"))
      }
    }

    // If ad context or adformat present, force autoplay flag
    if (tmp || paramVal) {
      videoInfo.isAutoplay = true; // was: Q.F_ = !0
    }

    // Feature
    tmp = playbackParams.feature; // was: U = r.feature
    if (tmp) {
      videoInfo.feature = tmp; // was: Q.fT = U
    }

    // Playlist ID
    tmp = playbackParams.list; // was: U = r.list
    if (tmp) {
      videoInfo.playlistId = tmp; // was: Q.playlistId = U
    }

    // Offer flag
    tmp = playbackParams.of; // was: U = r.of
    if (tmp) {
      videoInfo.offerFlag = tmp; // was: Q.Pv = U
    }

    // Origin session ID
    tmp = playbackParams.osid; // was: U = r.osid
    if (tmp) {
      videoInfo.osid = tmp; // was: Q.osid = U
    }

    // Referrer
    tmp = playbackParams.referrer; // was: U = r.referrer
    if (tmp) {
      videoInfo.referrer = tmp; // was: Q.referrer = U
    }

    // Source detail
    tmp = playbackParams.sdetail; // was: U = r.sdetail
    if (tmp) {
      videoInfo.sourceDetail = tmp; // was: Q.Om = U
    }

    // Source ID
    tmp = playbackParams.sourceid; // was: U = r.sourceid
    if (tmp) {
      videoInfo.sourceId = tmp; // was: Q.epA = U
    }

    // Server-side render tracking
    tmp = playbackParams.ssrt; // was: U = r.ssrt
    if (tmp) {
      videoInfo.isServerSideRendered = tmp === '1'; // was: Q.g1 = U == "1"
    }

    // Subscribed flag
    tmp = playbackParams.subscribed; // was: U = r.subscribed
    if (tmp) {
      videoInfo.subscribed = tmp === '1'; // was: Q.subscribed = U == "1"
    }

    // User gender / age
    tmp = playbackParams.uga; // was: U = r.uga
    if (tmp) {
      videoInfo.userGenderAge = tmp; // was: Q.userGenderAge = U
    }

    // User playback type
    tmp = playbackParams.upt; // was: U = r.upt
    if (tmp) {
      videoInfo.userPlaybackType = tmp; // was: Q.pv = U
    }

    // Video metadata
    tmp = playbackParams.getInMemoryStore; // was: U = r.vm
    if (tmp) {
      videoInfo.videoMetadata = tmp; // was: Q.videoMetadata = U
    }

    statsUrls.playback = playbackParams; // was: m.playback = r
  }

  // --- Videostats watchtime URL ---
  let watchtimeRaw = extractBaseUrl(trackingData.videostatsWatchtimeUrl); // was: U = u4(c.videostatsWatchtimeUrl)
  if (watchtimeRaw) {
    const watchtimeParams = flattenQueryParams(watchtimeRaw); // was: U = hx(U)
    const aldValue = watchtimeParams.ald; // was: W = U.ald
    if (aldValue) {
      videoInfo.adLoadDelay = aldValue; // was: Q.fW = W
    }
    statsUrls.watchtime = watchtimeParams; // was: m.watchtime = U
  }

  // --- ATR URL ---
  let atrRaw = extractBaseUrl(trackingData.atrUrl); // was: U = u4(c.atrUrl)
  if (atrRaw) {
    const atrParams = flattenQueryParams(atrRaw); // was: U = hx(U)
    statsUrls.atr = atrParams; // was: m.atr = U
  }

  // --- Engage URL ---
  let engageRaw = extractBaseUrl(trackingData.engageUrl); // was: U = u4(c.engageUrl)
  if (engageRaw) {
    const engageParams = flattenQueryParams(engageRaw); // was: U = hx(U)
    statsUrls.engage = engageParams; // was: m.engage = U
  }

  videoInfo.statsUrls = statsUrls; // was: Q.dU = m

  // --- Promoted playback tracking (quartile URLs) ---
  if (trackingData.promotedPlaybackTracking) {
    const promo = trackingData.promotedPlaybackTracking; // was: m = c.promotedPlaybackTracking
    if (promo.startUrls) {
      videoInfo.promoStartUrls = promo.startUrls; // was: Q.b$ = m.startUrls
    }
    if (promo.firstQuartileUrls) {
      videoInfo.promoFirstQuartileUrls = promo.firstQuartileUrls; // was: Q.Bv = m.firstQuartileUrls
    }
    if (promo.secondQuartileUrls) {
      videoInfo.promoSecondQuartileUrls = promo.secondQuartileUrls; // was: Q.GA = m.secondQuartileUrls
    }
    if (promo.thirdQuartileUrls) {
      videoInfo.promoThirdQuartileUrls = promo.thirdQuartileUrls; // was: Q.vv = m.thirdQuartileUrls
    }
    if (promo.completeUrls) {
      videoInfo.promoCompleteUrls = promo.completeUrls; // was: Q.L$ = m.completeUrls
    }
    if (promo.engagedViewUrls) {
      if (promo.engagedViewUrls.length > 1) {
        reportError(new PlayerError('There are more than one engaged_view_urls.')); // was: g.Ty(new g.H8(...))
      }
      videoInfo.engagedViewUrl = promo.engagedViewUrls[0]; // was: Q.T8 = m.engagedViewUrls[0]
    }
  }

  // --- Serialized one-time QoE context data ---
  if (
    videoInfo.isExperimentEnabled('html5_send_serialized_one_time_qoe_context_data') &&
    trackingData.serializedOneTimeQoeContextData
  ) {
    videoInfo.serializedOneTimeQoeContextData = trackingData.serializedOneTimeQoeContextData;
  }
}

// ---------------------------------------------------------------------------
// Legacy ad param extraction  (~33099-33109)
// [was: jz3]
// ---------------------------------------------------------------------------

/**
 * Extract legacy desktop ad parameters from watch-ads renderer.
 *
 * @param {Object} videoInfo - video info target [was: Q]
 * @param {Array} renderers - array of ad renderer wrappers [was: c]
 * @param {Object} legacyParams - legacy player vars [was: W]
 * [was: jz3]
 */
export function parseLegacyAdParams(videoInfo, renderers, legacyParams) { // was: jz3
  for (const renderer of renderers) {
    if (renderer) {
      const adRenderer = renderer.playerLegacyDesktopWatchAdsRenderer; // was: c = m.playerLegacyDesktopWatchAdsRenderer
      if (adRenderer) {
        const adParams = adRenderer.playerAdParams; // was: c = c.playerAdParams
        if (adParams) {
          if (adParams.autoplay === '1') {
            videoInfo.isAutoplay = true; // was: Q.F_ = !0
            videoInfo.isAutoplayTriggered = true; // was: Q.kN = !0
          }
          videoInfo.encodedAdSafetyReason = adParams.encodedAdSafetyReason || null; // was: Q.i6
          if (adParams.showContentThumbnail !== undefined) {
            videoInfo.showContentThumbnail = !!adParams.showContentThumbnail; // was: Q.Rx
          }
          legacyParams.enabled_engage_types = adParams.enabledEngageTypes; // was: W.enabled_engage_types
          break;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers (referenced but defined elsewhere)
// ---------------------------------------------------------------------------

/**
 * Extract baseUrl from a tracking object. Returns empty string if missing.
 * [was: u4]
 */
function extractBaseUrl(obj) {
  return obj?.baseUrl || '';
}

/**
 * Parse a URL's query string into a flat map (first value only per key).
 * [was: hx]
 */
function flattenQueryParams(url) {
  const parsed = parseQueryString(url); // was: g.g_(Q)
  for (const key of Object.keys(parsed)) {
    const val = parsed[key];
    parsed[key] = Array.isArray(val) ? val[0] : val;
  }
  return parsed;
}

/** Parse URL query string into key-value map. [was: g.g_] */
function parseQueryString(_url) {
  // stub -- actual impl in url-utils module
  return {};
}

/** Decode base64 string, returning null on failure. [was: Is => CN wrapper] */
function decodeBase64OrNull(str) {
  if (!str) return null;
  try {
    return atob(str);
  } catch {
    return null;
  }
}

/** Parse ad context proto. [was: wIR] */
function parseAdContext(_decoded) {
  // stub -- actual impl deserializes ad context protobuf
  return null;
}

/**
 * Resolve an ad format string into a canonical format identifier.
 * [was: XI3]
 *
 * @param {string} adformat - raw adformat value [was: Q]
 * @param {string} publisherId - publisher/PD value [was: c]
 * @param {boolean} isEmbed - embed mode flag [was: W]
 * @param {boolean} isTrustedDomain - trusted domain flag [was: m]
 * @returns {string|null}
 */
function resolveAdFormat(adformat, publisherId, isEmbed, isTrustedDomain) {
  // stub -- actual impl at line ~32736
  return adformat || null;
}

/** Report an error. [was: g.Ty] */
function reportError(_err) {
  // stub
}

/** Player error class placeholder. [was: g.H8] */
class PlayerError extends Error {}
