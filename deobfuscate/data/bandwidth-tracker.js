/**
 * bandwidth-tracker.js -- Player client configuration, platform detection, and format utilities
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~32214-32985
 *
 * Provides:
 *  - Client type detection (isWeb, isWebUnplugged, isWebRemix, isTVHTML5, etc.)
 *  - Player style / embed mode helpers
 *  - User profile image URL manipulation (FIFE URL resizing)
 *  - Player client parameter update pipeline (nD -> updateClientParams)
 *  - Format info construction from itag/codec tables (vU, aqx)
 *  - HLS format grouping and selection ($By, R4X, J0W)
 *  - Quality tier sorting and content protection parsing
 *  - OAuth token resolution helpers
 *  - Device pixel ratio accessor
 *  - Embedded-player lite-mode resolution
 *  - Engage-type allow-list checking
 *
 * @module data/bandwidth-tracker
 */

import { validateImageUrl } from '../ads/ad-scheduling.js';  // was: g.NP
import { userAgentContains } from '../core/composition-helpers.js';  // was: g.Hn
import { canPlayType, isTypeSupported } from '../media/codec-helpers.js';  // was: g.XL, g.eT
import { AudioTrack } from '../media/codec-tables.js';  // was: g.Br
import { optional } from '../network/innertube-config.js';  // was: g.qg
import { reportWarning } from './gel-params.js';  // was: g.Ty
import { getClientName } from './performance-profiling.js';  // was: g.cU
import { getProbeVideoElement } from '../media/codec-helpers.js'; // was: IR
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { EMBEDDED_PLAYER_LITE_MODES } from './device-context.js'; // was: EfO
import { coerceString } from '../core/composition-helpers.js'; // was: vn
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { coerceNumber } from '../core/composition-helpers.js'; // was: fh
import { coerceBoolean } from '../core/composition-helpers.js'; // was: gL
import { isKnownBrowserVersion } from '../core/bitstream-helpers.js'; // was: G5
import { isAndroidChrome } from '../core/composition-helpers.js'; // was: Nt
import { getHostWithPort } from './bandwidth-tracker.js'; // was: eQ
import { isWindowsPhoneOrIEMobile } from '../core/composition-helpers.js'; // was: vJW
import { isAndroid } from './device-platform.js'; // was: w8
import { ALWAYS_ENABLED_ENGAGE_TYPES } from './device-context.js'; // was: wl_
import { YOUTUBE_ALIAS_DOMAINS } from './device-context.js'; // was: j8x
import { createSuccessResult } from '../core/misc-helpers.js'; // was: I2
import { appendInitSegment } from '../media/mse-internals.js'; // was: qF
import { liftToPromise } from '../ads/ad-async.js'; // was: LF
import { catchCustom } from '../ads/ad-async.js'; // was: fF
import { thenCustom } from '../ads/ad-async.js'; // was: j5
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { itagToCodecMap } from '../media/codec-tables.js'; // was: Ak
import { VideoInfo } from '../media/codec-tables.js'; // was: gh
import { buildVp9MimeType } from '../media/codec-detection.js'; // was: Xc
import { FormatInfo } from '../media/codec-tables.js'; // was: OU
import { handleBackgroundSuspend } from '../media/quality-constraints.js'; // was: w3
import { createErrorResult } from '../core/misc-helpers.js'; // was: U1
import { QUALITY_LABELS_DESCENDING } from '../media/codec-tables.js'; // was: ZF
import { miniplayerIcon } from '../ui/svg-icons.js'; // was: D1
import { isWebKit600Plus } from '../core/composition-helpers.js'; // was: FF
import { isCobaltAppleTV } from '../core/composition-helpers.js'; // was: y5
import { extractUrlExpiration } from './bandwidth-tracker.js'; // was: z4O
import { deduplicateVp9Formats } from './bandwidth-tracker.js'; // was: CXK
import { findDefaultAudioItag } from './bandwidth-tracker.js'; // was: MBO
import { buildFormatDescriptor } from '../media/codec-helpers.js'; // was: fM
import { createSuggestedActionCueRange } from '../ui/progress-bar-impl.js'; // was: uO
import { PlayerError } from '../ui/cue-manager.js';
import { toString, startsWith } from '../core/string-utils.js';
import { splice, concat } from '../core/array-utils.js';
import { getDomain, parseUri, appendParamsToUrl } from '../core/url-utils.js';
import { isChrome, isAndroid, isIOS, isSafari } from '../core/browser-detection.js'; // was: g.Am, g.Lh, g.LD, g.v8
import { isBrowserVersionAtLeast } from './device-context.js'; // was: g.Pb
// TODO: resolve g.$5
// TODO: resolve g.d8
// TODO: resolve g.gg

// ============================================================================
// Client type helpers
// ============================================================================

/**
 * Returns the raw client identifier string.
 * [was: cU]
 *
 * @param {Object} config - player configuration [was: Q]
 * @returns {string}
 */
function getClientName(config) { // was: cU
  return config.W.c; // was: Q.W.c
}

/**
 * True if the client is any web-based platform (e.g. "WEB", "WEB_REMIX").
 * [was: XC]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isWebPlatform(config) { // was: XC
  return /web/i.test(getClientName(config));
}

/**
 * True if the client is WEB_UNPLUGGED (YouTube TV).
 * [was: g.X7]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isWebUnplugged(config) { // was: g.X7
  return getClientName(config) === 'WEB_UNPLUGGED';
}

/**
 * True if the client is WEB_REMIX (YouTube Music).
 * [was: g.uL]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isWebRemix(config) { // was: g.uL
  return getClientName(config) === 'WEB_REMIX';
}

/**
 * Whether the device should use the legacy `playsInline` workaround.
 * [was: g.Ax]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function needsPlaysInlineWorkaround(config) { // was: g.Ax
  return config.X('html5_local_playsinline')
    ? E1 && !isBrowserVersionAtLeast(602) && !('playsInline' in getProbeVideoElement())
    : E1 && !config.R_ || userAgentContains('nintendo wiiu')
      ? true  // was: !0
      : false; // was: !1
}

/**
 * True when the player is embedded and not an ad unit, with audio support.
 * [was: g.oc]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isEmbedWithAudio(config) { // was: g.oc
  return config.j && isEmbedded(config) && !isAdUnit(config) && !config.D;
}

/**
 * True if the client is TVHTML5_SIMPLY_EMBEDDED_PLAYER.
 * [was: ZoK]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isSimplyEmbeddedPlayer(config) { // was: ZoK
  return getClientName(config) === 'TVHTML5_SIMPLY_EMBEDDED_PLAYER';
}

/**
 * True if the page style is "adunit" or "gvn" style.
 * [was: V_]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isAdUnit(config) { // was: V_
  return config.isSamsungSmartTV === 'adunit' || config.playerStyle === 'gvn';
}

/**
 * True if the page style is "detailpage" (watch page).
 * [was: BU]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isDetailPage(config) { // was: BU
  return config.isSamsungSmartTV === 'detailpage';
}

/**
 * True if the page style is "embedded".
 * [was: g.eh]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isEmbedded(config) { // was: g.eh
  return config.isSamsungSmartTV === 'embedded';
}

/**
 * True if the page style is "profilepage".
 * [was: g.x5]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isProfilePage(config) { // was: g.x5
  return config.isSamsungSmartTV === 'profilepage';
}

/**
 * Determine the embedded player lite mode from experiments and flags.
 * Returns an `EMBEDDED_PLAYER_LITE_MODE_*` string.
 * [was: g.q8]
 *
 * @param {Object} config [was: Q]
 * @returns {string}
 */
export function getEmbeddedLiteMode(config) { // was: g.q8
  if (
    !config.webPlayerContextConfig?.embedsHostFlags?.enableLiteUx ||
    config.MQ ||
    config.D ||
    config.A ||
    config.Ie === 'EMBEDDED_PLAYER_MODE_PFP'
  ) {
    return 'EMBEDDED_PLAYER_LITE_MODE_NONE';
  }
  const mode = getExperimentValue(config.experiments, 'embeds_web_lite_mode'); // was: Q
  return mode === undefined // was: void 0
    ? 'EMBEDDED_PLAYER_LITE_MODE_UNKNOWN'
    : mode >= 0 && mode < EMBEDDED_PLAYER_LITE_MODES.length
      ? EMBEDDED_PLAYER_LITE_MODES[mode]
      : 'EMBEDDED_PLAYER_LITE_MODE_UNKNOWN';
}

// ============================================================================
// Client parameter updates
// ============================================================================

/**
 * Update player client parameters from new config data.
 * Logs a warning if parameters change after startup.
 *
 * [was: nD]
 *
 * @param {Object} playerConfig [was: Q]
 * @param {Object} params       [was: c]
 * @param {boolean} [isInitial=false] [was: W]
 */
export function updateClientParams(playerConfig, params, isInitial = false) { // was: nD
  playerConfig.instreamAdPlayerOverlayRenderer = coerceString(playerConfig.instreamAdPlayerOverlayRenderer, params.video_id); // was: Q.Re
  playerConfig.u3 = coerceString(playerConfig.u3, params.eventid); // was: Q.u3
  playerConfig.u3 && (I7 = playerConfig.u3);

  const changedKeys = []; // was: m
  for (const key of Object.keys(s80)) { // was: K
    const paramName = s80[key]; // was: T
    const value = params[paramName]; // was: r
    if (value != null) {
      if (value !== playerConfig.W[paramName]) changedKeys.push(paramName);
      playerConfig.W[paramName] = value;
    }
  }

  if (!isInitial && changedKeys.length > 0 && playerConfig.AD) {
    changedKeys.sort();
    reportWarning(new PlayerError('Player client parameters changed after startup', changedKeys));
  }

  playerConfig.userAge = coerceNumber(playerConfig.userAge, params.user_age);
  playerConfig.tQ = coerceString(playerConfig.tQ, params.user_display_email);
  playerConfig.userDisplayImage = coerceString(playerConfig.userDisplayImage, params.user_display_image);
  validateImageUrl(playerConfig.userDisplayImage) || (playerConfig.userDisplayImage = '');
  playerConfig.userDisplayName = coerceString(playerConfig.userDisplayName, params.user_display_name);
  playerConfig.vj = coerceString(playerConfig.vj, params.user_gender);
  playerConfig.csiPageType = coerceString(playerConfig.csiPageType, params.csi_page_type);
  playerConfig.csiServiceName = coerceString(playerConfig.csiServiceName, params.csi_service_name);
  playerConfig.r_ = coerceBoolean(playerConfig.r_, params.enablecsi);
  playerConfig.pageId = coerceString(playerConfig.pageId, params.pageid);

  const enabledTypes = params.enabled_engage_types; // was: W (reused)
  if (enabledTypes) {
    playerConfig.enabledEngageTypes = new Set(enabledTypes.split(','));
  }
  params.living_room_session_po_token &&
    (playerConfig.FO = params.living_room_session_po_token.toString());
}

/**
 * True if the client is WEB_KIDS.
 * [was: Dm]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isWebKids(config) { // was: Dm
  return getClientName(config) === 'WEB_KIDS';
}

/**
 * Whether the player should use desktop-like controls in certain contexts.
 * [was: tx]
 *
 * @param {Object} config [was: Q]
 * @param {boolean} isAdContext [was: c]
 * @returns {boolean}
 */
export function shouldUseDesktopControls(config, isAdContext) { // was: tx
  return !config.D && isAndroidChrome() && isKnownBrowserVersion(55) && config.controlsType === '3' && !isAdContext;
}

/**
 * Returns the sanitized host URL for the player.
 * Replaces `youtube-nocookie.com` with `youtube.com`.
 * [was: g.HU]
 *
 * @param {Object} config [was: Q]
 * @returns {string}
 */
export function getPlayerHost(config) { // was: g.HU
  const host = getHostWithPort(config.kq); // was: Q
  return host === 'www.youtube-nocookie.com' ? 'www.youtube.com' : host;
}

/**
 * Build a thumbnail URL on ytimg.com.
 * [was: N8]
 *
 * @param {Object} config  [was: Q]
 * @param {string} videoId [was: c]
 * @param {string} [filename='hqdefault.jpg'] [was: W]
 * @returns {string}
 */
export function buildThumbnailUrl(config, videoId, filename) { // was: N8
  return config.protocol + '://i1.ytimg.com/vi/' + videoId + '/' + (filename || 'hqdefault.jpg');
}

/**
 * True when on a detail page that is not WEB_UNPLUGGED.
 * [was: i4]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isStandardDetailPage(config) { // was: i4
  return isDetailPage(config) && !isWebUnplugged(config);
}

/**
 * True when page style is "leanback".
 * [was: y_]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isLeanback(config) { // was: y_
  return config.isSamsungSmartTV === 'leanback';
}

/**
 * True when the client is any TVHTML5 variant.
 * [was: g.AI]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isTVHTML5(config) { // was: g.AI
  return /^TVHTML5/.test(getClientName(config));
}

/**
 * True when the client is exactly "TVHTML5".
 * [was: Sh]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isTVHTML5Base(config) { // was: Sh
  return getClientName(config) === 'TVHTML5';
}

/**
 * True when the device model is a Chromecast Ultra or Steak.
 * [was: dBK]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isChromecastUltra(config) { // was: dBK
  return (
    config.W.cmodel === 'CHROMECAST ULTRA/STEAK' ||
    config.W.cmodel === 'CHROMECAST/STEAK'
  );
}

/**
 * Returns the device pixel ratio, clamped to a minimum of 1.
 * [was: g.F7]
 *
 * @returns {number}
 */
export function getDevicePixelRatio() { // was: g.F7
  return window.devicePixelRatio > 1 ? window.devicePixelRatio : 1;
}

/**
 * True when the client name uppercased is "WEB".
 * [was: g.rT]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isWebClient(config) { // was: g.rT
  return getClientName(config).toUpperCase() === 'WEB';
}

/**
 * True if the client is TVHTML5_UNPLUGGED.
 * [was: Zm]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isTVHTML5Unplugged(config) { // was: Zm
  return getClientName(config) === 'TVHTML5_UNPLUGGED';
}

/**
 * True when the client is WEB_UNPLUGGED, TV_UNPLUGGED_CAST, or TVHTML5_UNPLUGGED.
 * [was: g.Ie]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isUnpluggedPlatform(config) { // was: g.Ie
  return isWebUnplugged(config) || getClientName(config) === 'TV_UNPLUGGED_CAST' || isTVHTML5Unplugged(config);
}

/**
 * True when the client is WEB_MUSIC_INTEGRATIONS.
 * [was: g.EQ]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isWebMusicIntegrations(config) { // was: g.EQ
  return getClientName(config) === 'WEB_MUSIC_INTEGRATIONS';
}

/**
 * True when the client is WEB_EMBEDDED_PLAYER.
 * [was: g.sQ]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function isWebEmbeddedPlayer(config) { // was: g.sQ
  return getClientName(config) === 'WEB_EMBEDDED_PLAYER';
}

/**
 * Returns false only when all three conditions are true:
 * web client, the `c` flag, and `W` flag.
 * [was: L3w]
 *
 * @param {Object} config     [was: Q]
 * @param {boolean} [flag1=false] [was: c]
 * @param {boolean} [flag2=true]  [was: W]
 * @returns {boolean}
 */
export function shouldApplyWebRestriction(config, flag1 = false, flag2 = true) { // was: L3w
  return !isWebClient(config) || !flag1 || !flag2;
}

// ============================================================================
// Fullscreen / autoplay / audio support detection
// ============================================================================

/**
 * Whether fullscreen is likely supported on the current device.
 * Checks a wide set of UA-based conditions for Safari, Chrome, Firefox, etc.
 * [was: g.Ox]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function supportsFullscreen(config) { // was: g.Ox
  return (
    (config.deviceIsAudioOnly || !isChrome() || ou || config.controlsType === '3'
      ? false // was: !1
      : isAndroid() ? config.j && isBrowserVersionAtLeast(51) : true) || // was: !0
    (config.deviceIsAudioOnly || !g.gg || ou || config.controlsType === '3'
      ? false
      : isAndroid() ? config.j && isBrowserVersionAtLeast(48) : isBrowserVersionAtLeast(38)) ||
    (config.deviceIsAudioOnly || !g.d8 || ou || config.controlsType === '3'
      ? false
      : isAndroid() ? config.j && isBrowserVersionAtLeast(37) : isBrowserVersionAtLeast(27)) ||
    (!config.deviceIsAudioOnly && isIOS() && !isWindowsPhoneOrIEMobile() && isBrowserVersionAtLeast(11)) ||
    (!config.deviceIsAudioOnly && isSafari() && isBrowserVersionAtLeast('604.4'))
  );
}

/**
 * Whether the Web Audio API (AudioContext / webkitAudioContext) is available.
 * Returns false for embedded players on some platforms.
 * [was: uw_]
 *
 * @param {Object} config [was: Q]
 * @returns {boolean}
 */
export function supportsWebAudio(config) { // was: uw_
  if (isEmbedded(config) && isAndroid()) return false; // was: !1
  if (g.gg) {
    if (!isBrowserVersionAtLeast(47) || (!isBrowserVersionAtLeast(52) && isBrowserVersionAtLeast(51))) return false;
  } else if (isSafari()) return false;
  return window.AudioContext || window.webkitAudioContext ? true : false; // was: !0 : !1
}

/**
 * Check whether the given engage type is in the player's enabled set
 * or in the default allow-list.
 * [was: boK]
 *
 * @param {Object} config   [was: Q]
 * @param {*}      engageType [was: c]
 * @returns {boolean}
 */
export function isEngageTypeEnabled(config, engageType) { // was: boK
  return config.enabledEngageTypes.has(engageType.toString()) || ALWAYS_ENABLED_ENGAGE_TYPES.includes(engageType);
}

// ============================================================================
// Profile image URL manipulation (FIFE URLs)
// ============================================================================

/**
 * Transform a FIFE profile image URL to request a 20x20 cropped version.
 * Handles 5-segment, 8-segment, and 9-segment FIFE URL patterns.
 * [was: b4]
 *
 * @param {Object} config [was: Q]
 * @returns {string} transformed URL or original on failure
 */
export function getSmallProfileImage(config) { // was: b4
  if (!config.userDisplayImage) return '';

  const segments = config.userDisplayImage.split('/'); // was: c

  if (segments.length === 5) {
    const lastParts = segments[segments.length - 1].split('='); // was: Q (reused)
    lastParts[1] = 's20-c';
    segments[segments.length - 1] = lastParts.join('=');
    return segments.join('/');
  }

  if (segments.length === 8) {
    segments.splice(7, 0, 's20-c');
    return segments.join('/');
  }

  if (segments.length === 9) {
    segments[7] += '-s20-c';
    return segments.join('/');
  }

  reportWarning(new PlayerError('Profile image not a FIFE URL.', config.userDisplayImage));
  return config.userDisplayImage;
}

// ============================================================================
// Base URL helpers
// ============================================================================

/**
 * Builds the base YouTube origin URL, normalizing nocookie domains.
 * [was: g.jh]
 *
 * @param {Object} config [was: Q]
 * @returns {string}
 */
export function getBaseOrigin(config) { // was: g.jh
  let host = getPlayerHost(config); // was: c
  YOUTUBE_ALIAS_DOMAINS.includes(host) && (host = 'www.youtube.com');
  return config.protocol + '://' + host;
}

// ============================================================================
// OAuth token resolution
// ============================================================================

/**
 * Resolves the OAuth token from the player config's token bridge.
 * Returns an immediate value or a promise-wrapped deferred.
 * [was: g.OQ]
 *
 * @param {Object} config         [was: Q]
 * @param {string} [fallback='']  [was: c]
 * @returns {*}
 */
export function resolveOAuthToken(config, fallback = '') { // was: g.OQ
  if (config.TB) {
    const deferred = new g8(); // was: W
    let result; // was: m
    const tokenBridge = config.TB(); // was: K

    if (tokenBridge.signedOut) {
      result = '';
    } else if (tokenBridge.token) {
      result = tokenBridge.token;
    } else {
      tokenBridge.pendingResult.then(
        (resolved) => { // was: T
          tokenBridge.signedOut ? deferred.resolve('') : deferred.resolve(resolved.token);
        },
        (error) => { // was: T
          reportWarning(new PlayerError('b189348328_oauth_callback_failed', { error }));
          deferred.resolve(fallback);
        }
      );
    }

    return result !== undefined ? createSuccessResult(result) : new rL(deferred); // was: void 0
  }
  return createSuccessResult(fallback);
}

/**
 * Determines whether the user is signed in (has a valid OAuth token).
 * [was: fD]
 *
 * @param {Object} config        [was: Q]
 * @param {string} [fallback=''] [was: c]
 * @returns {*}
 */
export function isSignedIn(config, fallback = '') { // was: fD
  return config.appendInitSegment
    ? liftToPromise(true) // was: !0
    : catchCustom(thenCustom(liftToPromise(resolveOAuthToken(config, fallback)), (token) => liftToPromise(!!token)), () => liftToPromise(false)); // was: !1
}

// ============================================================================
// WebAssembly / asm.js selection
// ============================================================================

/**
 * Records the WebAssembly availability and updates the feature flags.
 * [was: gf3]
 *
 * @param {Object} config  [was: Q]
 * @param {Object} wasmCtx [was: c]
 */
export function setWasmContext(config, wasmCtx) { // was: gf3
  config.La = wasmCtx;
  config.skipNextIcon?.W?.D(wasmCtx);
  wasmCtx.W ? config.hq.push('asmjs') : config.hq.push('wasm');
}

/**
 * Extracts host and optional port from a URL's host component.
 * [was: eQ]
 *
 * @param {string} url [was: Q]
 * @returns {string}
 */
export function getHostWithPort(url) { // was: eQ
  const host = getDomain(url); // was: c
  const port = Number(parseUri(url)[4] || null) || null; // was: Q (reused)
  return port ? `${host}:${port}` : host;
}

// ============================================================================
// Format info construction from itag/codec tables
// ============================================================================

/**
 * Build a video FormatInfo from static itag/codec tables.
 * Returns null if the itag is not recognized.
 * [was: vU]
 *
 * @param {string|number} itag    [was: Q]
 * @param {boolean}       [rotated=false] [was: c]
 * @returns {OU|null}
 */
export function buildVideoFormatFromItag(itag, rotated = false) { // was: vU
  const codecKey = itagToCodecMap[itag]; // was: W
  let mimeType = OoW[codecKey]; // was: m
  const formatEntry = fqO[itag]; // was: K
  if (!formatEntry || !mimeType) return null;

  const videoInfo = new VideoInfo( // was: c (reused)
    rotated ? formatEntry.height : formatEntry.width,
    rotated ? formatEntry.width : formatEntry.height,
    formatEntry.fps
  );
  mimeType = buildVp9MimeType(mimeType, videoInfo, codecKey);
  return new FormatInfo(itag, mimeType, {
    video: videoInfo,
    handleBackgroundSuspend: formatEntry.bitrate / 8,
  });
}

/**
 * Build an audio FormatInfo from static itag/codec tables.
 * Returns null if the itag is not recognized.
 * [was: aqx]
 *
 * @param {string|number} itag [was: Q]
 * @returns {OU|null}
 */
export function buildAudioFormatFromItag(itag) { // was: aqx
  const mimeType = OoW[itagToCodecMap[itag]]; // was: c
  const audioEntry = vf7[itag]; // was: W
  return audioEntry && mimeType
    ? new FormatInfo(itag, mimeType, {
        audio: new jT(audioEntry.audioSampleRate, audioEntry.numChannels),
      })
    : null;
}

// ============================================================================
// HLS format selection
// ============================================================================

/**
 * Filter format array by canPlayType, sort by quality tiers, return promise.
 * [was: as]
 *
 * @param {Object} playerConfig [was: Q]
 * @param {Array}  formats      [was: c]
 * @param {boolean} skipDash    [was: W]
 * @param {boolean} forceAll    [was: m]
 * @returns {*} promise resolving to format array or rejected
 */
export function filterAndSortFormats(playerConfig, formats, skipDash, forceAll) { // was: as
  if (skipDash) return createErrorResult();

  const qualityMap = {}; // was: W (reused)
  const mediaElement = getProbeVideoElement(); // was: K

  for (const fmt of formats) { // was: T
    if (playerConfig.canPlayType(mediaElement, fmt.getInfo().mimeType) || forceAll) {
      const quality = fmt.W.video.quality; // was: c (reused)
      if (!qualityMap[quality] || qualityMap[quality].getInfo().wH()) {
        qualityMap[quality] = fmt;
      }
    }
  }

  const result = []; // was: Q (reused)
  qualityMap.auto && result.push(qualityMap.auto);
  for (const tier of QUALITY_LABELS_DESCENDING) { // was: T
    const match = qualityMap[tier]; // was: m
    if (match) result.push(match);
  }
  return result.length ? createSuccessResult(result) : createErrorResult();
}

/**
 * Parse HLS format entries into a map keyed by itag.
 * Validates MediaSource type support and HDR/DRM filtering.
 * [was: $By]
 *
 * @param {Array}   rawFormats      [was: Q]
 * @param {boolean} [filterFmp4=false] [was: c]
 * @param {boolean} [allowHdr=true]    [was: W]
 * @param {Object}  [rejections={}]    [was: m]
 * @returns {Object|null} map of itag -> GhX array
 */
export function parseHlsFormats(rawFormats, filterFmp4 = false, allowHdr = true, rejections = {}) { // was: $By
  const result = {}; // was: K

  for (const entry of rawFormats) { // was: r
    if (
      filterFmp4 &&
      MediaSource &&
      MediaSource.isTypeSupported &&
      !MediaSource.isTypeSupported(
        entry.audio_channels
          ? entry.type + '; channels=' + entry.audio_channels
          : entry.type
      )
    ) {
      rejections[entry.itag] = 'tpus';
      continue;
    }

    if (
      !allowHdr &&
      entry.drm_families &&
      (entry.eotf === 'smpte2084' || entry.eotf === 'arib-std-b67')
    ) {
      rejections[entry.itag] = 'enchdr';
      continue;
    }

    let audioTrack = undefined; // was: Q (reused)
    const eotfMap = { // was: U
      bt709: 'SDR',
      bt2020: 'SDR',
      smpte2084: 'PQ',
      'arib-std-b67': 'HLG',
    };

    let codecMatch = entry.type.match(/codecs="([^"]*)"/); // was: T
    codecMatch = codecMatch ? codecMatch[1] : '';

    entry.audio_track_id &&
      (audioTrack = new AudioTrack(entry.name, entry.audio_track_id, !!entry.is_default));

    const eotf = entry.eotf; // was: I
    const parsed = new TimerEventMetadata({ // was: Q (reused)
      itag: entry.itag,
      url: entry.url,
      codecs: codecMatch,
      width: Number(entry.width),
      height: Number(entry.height),
      fps: Number(entry.fps),
      bitrate: Number(entry.bitrate),
      audioItag: entry.audio_itag,
      MA: eotf ? eotfMap[eotf] : undefined, // was: void 0
      contentProtection: entry.drm_families,
      miniplayerIcon: audioTrack,
      audioChannels: Number(entry.audio_channels),
    });

    result[parsed.itag] = result[parsed.itag] || [];
    result[parsed.itag].push(parsed);
  }

  return result;
}

/**
 * Set the active audio track id on the format set.
 * [was: PXO]
 *
 * @param {Object} formatSet [was: Q]
 * @param {string} trackId   [was: c]
 */
export function setActiveAudioTrack(formatSet, trackId) { // was: PXO
  formatSet.A.some((fmt) => fmt.miniplayerIcon?.getId() === trackId);
  formatSet.W = trackId;
}

/**
 * Sorts audio format options by bitrate, placing those below the threshold first.
 * [was: lq7]
 *
 * @param {Object} formatSet [was: Q]
 */
export function sortAudioByBitrate(formatSet) { // was: lq7
  const belowThreshold = []; // was: c
  const aboveThreshold = []; // was: W
  for (const fmt of formatSet.O) { // was: m
    fmt.bitrate <= formatSet.j ? belowThreshold.push(fmt) : aboveThreshold.push(fmt);
  }
  belowThreshold.sort((a, b) => b.bitrate - a.bitrate); // was: (m, K)
  aboveThreshold.sort((a, b) => a.bitrate - b.bitrate);
  formatSet.O = belowThreshold.concat(aboveThreshold);
}

/**
 * Append CPN and optional paired token to a URL.
 * [was: Gz]
 *
 * @param {Object} videoData [was: Q]
 * @param {string} url       [was: c]
 * @param {string} [paired]  [was: W]
 * @returns {string}
 */
export function appendCpnToUrl(videoData, url, paired) { // was: Gz
  videoData.cpn && (url = appendParamsToUrl(url, { cpn: videoData.cpn }));
  paired && (url = appendParamsToUrl(url, { paired }));
  return url;
}

/**
 * Build a composite itag key from video + optional audio itag.
 * [was: uu7]
 *
 * @param {Object} videoFmt [was: Q]
 * @param {Object|null} audioFmt [was: c]
 * @returns {string}
 */
export function compositeItagKey(videoFmt, audioFmt) { // was: uu7
  let key = videoFmt.itag.toString(); // was: Q (reused)
  audioFmt !== null && (key += audioFmt.itag.toString());
  return key;
}

/**
 * Extract audio tracks from HLS format data (for native track switching).
 * Returns null if no applicable formats exist.
 * [was: h4n]
 *
 * @param {Object} config     [was: Q]
 * @param {Array}  hlsFormats [was: c]
 * @returns {Array|null}
 */
export function extractHlsAudioTracks(config, hlsFormats) { // was: h4n
  if (!(ou || isWebKit600Plus() || isCobaltAppleTV())) return null;

  const parsed = parseHlsFormats(hlsFormats, config.X('html5_filter_fmp4_in_hls'));
  if (!parsed) return null;

  const tracks = []; // was: c (reused)
  const seen = {}; // was: W

  for (const itag of Object.keys(parsed)) { // was: m
    for (const entry of parsed[itag]) { // was: K
      if (entry.miniplayerIcon) {
        const trackId = entry.miniplayerIcon.getId(); // was: T
        if (!seen[trackId]) {
          const track = new g.$5(trackId, entry.miniplayerIcon); // was: r
          seen[trackId] = track;
          tracks.push(track);
        }
      }
    }
  }

  return tracks.length > 0 ? tracks : null;
}

// ============================================================================
// HLS manifest assembly
// ============================================================================

/**
 * Build the full HLS variant playlist from parsed format data.
 * Groups video + audio tracks, creates M3U8-style format entries.
 * [was: R4X]
 *
 * @param {Object}  config         [was: Q]
 * @param {boolean} isAd           [was: c]
 * @param {Array}   hlsFormatData  [was: W]
 * @param {string|null} captionUrl [was: m]
 * @param {number}  maxBitrate     [was: K]
 * @param {string}  cpn            [was: T]
 * @param {Function} reportFiltered [was: r]
 * @returns {*} promise
 */
export function buildHlsVariantPlaylist(config, isAd, hlsFormatData, captionUrl, maxBitrate, cpn, reportFiltered) {
  // was: R4X
  if (!(ou || isWebKit600Plus() || isCobaltAppleTV())) return createErrorResult();

  const rejections = {}; // was: U
  const expireTime = extractUrlExpiration(hlsFormatData); // was: I
  const parsed = parseHlsFormats(
    hlsFormatData,
    config.X('html5_filter_fmp4_in_hls'),
    config.K.D,
    rejections
  ); // was: X

  if (!parsed) {
    reportFiltered({ noplst: 1 });
    return createErrorResult();
  }

  deduplicateVp9Formats(parsed);

  const drmUrls = { fairplay: 'https://youtube.com/api/drm/fps?ek=uninitialized' }; // was: A
  let drmConfig; // was: e

  const videoFormats = []; // was: W (reused)
  const audioFormats = []; // was: V
  const variants = []; // was: B
  let bestVideo = null; // was: n
  let eotfValue = ''; // was: S

  const captionEntry = // was: m (reused)
    captionUrl && captionUrl.match(/hls_timedtext_playlist/)
      ? new TimerEventMetadata({
          itag: '0',
          url: captionUrl,
          codecs: 'vtt',
          width: 0,
          height: 0,
          fps: 0,
          bitrate: 0,
          miniplayerIcon: new AudioTrack('English', 'en', false), // was: !1
        })
      : null;

  for (const itag of Object.keys(parsed)) { // was: f
    if (config.X('html5_disable_drm_hfr_1080') && (itag === '383' || itag === '373')) {
      rejections[itag] = 'disdrmhfr';
      continue;
    }

    for (const entry of parsed[itag]) { // was: G
      if (entry.width) {
        // video format
        for (const audioItag of entry.O) { // was: G7
          if (parsed[audioItag]) {
            entry.W = audioItag;
            break;
          }
        }
        entry.W || (entry.W = findDefaultAudioItag(parsed, entry));

        const audioEntries = parsed[entry.W]; // was: T7
        if (!audioEntries) continue;

        videoFormats.push(entry);
        entry.contentProtection === 'fairplay' && (drmConfig = drmUrls);

        let eotfStr = ''; // was: oW
        entry.MA === 'PQ'
          ? (eotfStr = 'smpte2084')
          : entry.MA === 'HLG' && (eotfStr = 'arib-std-b67');
        eotfStr && (eotfValue = eotfStr);

        variants.push(
          buildHlsVariant(
            audioEntries,
            [entry],
            captionEntry,
            cpn,
            entry.itag,
            entry.width,
            entry.height,
            entry.fps,
            expireTime,
            undefined, // was: void 0
            undefined,
            drmConfig,
            eotfStr
          )
        );

        if (!bestVideo || entry.width * entry.height * entry.fps > bestVideo.width * bestVideo.height * bestVideo.fps) {
          bestVideo = entry;
        }
      } else {
        audioFormats.push(entry);
      }
    }
  }

  // Check if all variants are encrypted
  variants.reduce((allEnc, v) => v.getInfo().isEncrypted() && allEnc, true) && // was: !0
    (drmConfig = drmUrls);

  maxBitrate = Math.max(maxBitrate, 0);
  const { fps: bestFps = 0, width: bestW = 0, height: bestH = 0 } = bestVideo || {};
  const useNativeAudioTrackSwitching = config.X('html5_native_audio_track_switching'); // was: n (reused)

  variants.push(
    buildHlsVariant(
      audioFormats,
      videoFormats,
      captionEntry,
      cpn,
      '93',
      bestW,
      bestH,
      bestFps,
      expireTime,
      'auto',
      maxBitrate,
      drmConfig,
      eotfValue,
      useNativeAudioTrackSwitching
    )
  );

  Object.entries(rejections).length && reportFiltered(rejections);
  return filterAndSortFormats(config.K, variants, shouldUseDesktopControls(config, isAd), false);
}

/**
 * Create a single HLS variant entry (M3U8 line equivalent).
 * [was: J0W]
 *
 * @param {Array}  audioEntries [was: Q]
 * @param {Array}  videoEntries [was: c]
 * @param {Object|null} caption [was: W]
 * @param {string} cpn          [was: m]
 * @param {string} itag         [was: K]
 * @param {number} width        [was: T]
 * @param {number} height       [was: r]
 * @param {number} fps          [was: U]
 * @param {number} expireTime   [was: I]
 * @param {string} [quality]    [was: X]
 * @param {number} [startBitrate] [was: A]
 * @param {Object} [drm]        [was: e]
 * @param {string} [eotf]       [was: V]
 * @param {boolean} [nativeTrackSwitch] [was: B]
 * @returns {YKn}
 */
export function buildHlsVariant(
  audioEntries, videoEntries, caption, cpn, itag,
  width, height, fps, expireTime, quality, startBitrate, drm, eotf, nativeTrackSwitch
) { // was: J0W
  let maxChannels = 0; // was: n
  let preferredAudioItag = ''; // was: S

  for (const audio of audioEntries) { // was: d
    preferredAudioItag || (preferredAudioItag = audio.itag);
    audio.audioChannels && audio.audioChannels > maxChannels &&
      ((maxChannels = audio.audioChannels), (preferredAudioItag = audio.itag));
  }

  const formatInfo = new FormatInfo(itag, 'application/x-mpegURL', { // was: K (reused)
    audio: new jT(0, maxChannels),
    video: new VideoInfo(width, height, fps, null, undefined, quality, undefined, undefined, eotf),
    contentProtection: drm,
    rO: preferredAudioItag,
  });

  const hlsFormatSet = new khm(audioEntries, videoEntries, caption ? [caption] : [], cpn, !!nativeTrackSwitch); // was: Q (reused)
  hlsFormatSet.j = startBitrate || 1369843;
  return new YKn(formatInfo, hlsFormatSet, expireTime);
}

/**
 * Extract the URL expiration timestamp from HLS format URLs.
 * [was: z4O]
 *
 * @param {Array} formats [was: Q]
 * @returns {number}
 */
export function extractUrlExpiration(formats) { // was: z4O
  for (const fmt of formats) { // was: c
    if (fmt.url) {
      const parts = fmt.url.split('expire/'); // was: Q (reused)
      if (parts.length > 1) return +parts[1].split('/')[0];
    }
  }
  return NaN;
}

/**
 * Find a matching audio format for a video format when no explicit pairing exists.
 * [was: MBO]
 *
 * @param {Object} parsed      [was: Q]
 * @param {Object} videoFormat [was: c]
 * @returns {string}
 */
export function findDefaultAudioItag(parsed, videoFormat) { // was: MBO
  for (const itag of Object.keys(parsed)) { // was: W
    const first = parsed[itag][0]; // was: m
    if (!first.width && first.contentProtection === videoFormat.contentProtection && !first.audioChannels) {
      return itag;
    }
  }
  return '';
}

/**
 * Remove non-VP9 formats when VP9 versions exist at the same resolution.
 * Mutates the parsed format map in place.
 * [was: CXK]
 *
 * @param {Object} parsed [was: Q]
 */
export function deduplicateVp9Formats(parsed) { // was: CXK
  const vp9Heights = new Set(); // was: c
  for (const entries of Object.values(parsed)) { // was: W
    if (entries.length) {
      const first = entries[0]; // was: m
      first.height && first.codecs.startsWith('vp09') && vp9Heights.add(first.height);
    }
  }

  const toRemove = []; // was: W (reused)
  if (vp9Heights.size) {
    for (const itag of Object.keys(parsed)) { // was: K
      if (parsed[itag].length) {
        const first = parsed[itag][0]; // was: m (reused)
        first.height && vp9Heights.has(first.height) && !first.codecs.startsWith('vp09') &&
          toRemove.push(itag);
      }
    }
  }

  for (const itag of toRemove) delete parsed[itag]; // was: K
}

// ============================================================================
// Legacy format selection helpers
// ============================================================================

/**
 * Build format list from legacy `QzR`-style entries with type/medium/itag.
 * [was: QzR]
 *
 * @param {Object} config    [was: Q]
 * @param {boolean} isAd     [was: c]
 * @param {Array}  entries   [was: W]
 * @returns {*} promise
 */
export function buildLegacyFormats(config, isAd, entries) { // was: QzR
  const result = []; // was: m
  for (const entry of entries) { // was: K
    if (!entry || !entry.url) continue;
    const info = buildFormatDescriptor(entry.type, 'medium', '0'); // was: W (reused)
    result.push(new plX(info, entry.url));
  }
  return filterAndSortFormats(config.K, result, shouldUseDesktopControls(config, isAd), false);
}

/**
 * Build a single auto-quality format entry.
 * [was: c1W]
 *
 * @param {Object} config     [was: Q]
 * @param {Object} formatEntry [was: c]
 * @returns {*} promise
 */
export function buildAutoQualityFormat(config, formatEntry) { // was: c1W
  const list = []; // was: W
  const info = buildFormatDescriptor(formatEntry.type, 'auto', formatEntry.itag); // was: m
  list.push(new plX(info, formatEntry.url));
  return filterAndSortFormats(config.K, list, false, true); // was: !1, !0
}

// ============================================================================
// Error-code mapping
// ============================================================================

/**
 * Map a raw error code string to a known error constant.
 * Returns null if the code is unrecognized.
 * [was: mw0]
 *
 * @param {string} code [was: Q]
 * @returns {string|null}
 */
export function mapErrorCode(code) { // was: mw0
  return code && Wh3[code] ? Wh3[code] : null;
}

/**
 * Normalize SABR error strings to a canonical form.
 * Unknown errors map to "sabr.config".
 * [was: Khx]
 *
 * @param {string} errorCode [was: Q]
 * @returns {string}
 */
export function normalizeSabrError(NetworkErrorCode) { // was: Khx
  switch (NetworkErrorCode) {
    case 'multiview.ustreamer_disabled':
    case 'sabr.invalid_input_stream':
    case 'sabr.live_no_max_sq':
    case 'sabr.live_unauthorized_request':
    case 'sabr.malformed_config':
    case 'sabr.media_serving_enforcement_id_error':
    case 'sabr.metadata_fetcher_error':
    case 'sabr.no_audio_selected':
    case 'sabr.no_available_formats':
    case 'sabr.no_redirect_url':
    case 'sabr.no_video_selected':
    case 'sabr.too_many_chunk_reader_error_retries':
      return NetworkErrorCode;
    default:
      return 'sabr.config';
  }
}

/**
 * Initialize the Onesie config from a watch endpoint's onesie config.
 * [was: oOw]
 *
 * @param {Object} videoData  [was: Q]
 * @param {Object} watchEndpt [was: c]
 */
export function initOnesieConfig(videoData, watchEndpt) { // was: oOw
  const onesieConfig = watchEndpt?.watchEndpointSupportedOnesieConfig?.html5PlaybackOnesieConfig;
  if (onesieConfig) {
    videoData.createSuggestedActionCueRange = new Tx7(onesieConfig);
  }
}

// ============================================================================
// Engage-type checking
// ============================================================================

/**
 * Check whether a specific engage type is enabled via the player config's
 * enabled set or the default allow-list.
 *
 * (re-export of isEngageTypeEnabled for completeness)
 */
// Already exported above as isEngageTypeEnabled
