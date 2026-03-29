/**
 * device-context.js -- Device fingerprint / context builder
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~82995-83283
 *
 * Handles:
 *  - Building the device context (cparams) from a config object's `device` field
 *  - Mapping device properties to short param keys (cbrand, cmodel, cbr, cbrver, etc.)
 *  - Optional high-resolution logging fields (cchip, ccappver, cfrmver, crqyear)
 *  - Embed detection and loaderUrl resolution
 *  - Trusted ad domain regex matching
 *  - Picture-in-picture feature flags and blocking policies
 *  - Related videos UI settings
 *  - Fullscreen and streaming policy configuration
 *  - Device platform detection (Nintendo Wii U, mobile, Chromecast, etc.)
 *  - Autoplay / muted-autoplay / autonav capabilities
 *  - Player style to CSI service-name mapping
 */

import { ExperimentConfig } from './experiment-config.js'; // was: Kf_
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { isExperimentEnabled } from '../features/experiment-flags.js';
import { createElement } from '../core/dom-utils.js';

// ---------------------------------------------------------------------------
// Device context mapping (inlined in PlayerConfig constructor, ~82995-83039)
// ---------------------------------------------------------------------------

/**
 * Build device context params (`this.W` cparams and `this.WB` extended
 * cparams) from a config object.
 *
 * This logic lives inside the PlayerConfig constructor. The config object
 * `c` is the INNERTUBE-style player config; `Q` is the legacy query-param
 * object.
 *
 * Primary cparams written to `cparams` (this.W):
 *   - caoe    : androidOsExperience
 *   - capsv   : androidPlayServicesVersion
 *   - cbrand  : device brand
 *   - cbr     : browser name
 *   - cbrver  : browser version
 *   - ccrv    : cobaltReleaseVehicle
 *   - c       : interfaceName   (default "WEB")
 *   - cver    : interfaceVersion (default "html5")
 *   - ctheme  : interfaceTheme
 *   - cplayer : interfacePlayerType (default "UNIPLAYER")
 *   - cmodel  : device model
 *   - cnetwork: network type
 *   - cos     : operating system
 *   - cosver  : OS version
 *   - cplatform: platform
 *
 * Extended cparams written to `extendedCparams` (this.WB) when
 * `html5_log_vss_extra_lr_cparams_freq` is "all" or "once":
 *   - cchip   : chipset
 *   - ccappver: cobaltAppVersion
 *   - cfrmver : firmwareVersion
 *   - crqyear : deviceYear
 *
 * @param {Object} config - INNERTUBE player config (has `device` sub-object) [was: c]
 * @param {Object} queryParams - legacy query-param object [was: Q]
 * @param {Object} cparams - primary context params target [was: this.W]
 * @param {Object} extendedCparams - extended context params target [was: this.WB]
 * @param {ExperimentConfig} experiments - experiment config for flag checks [was: this.experiments]
 */
export function buildDeviceContext(config, queryParams, cparams, extendedCparams, experiments) {
  if (config && config.device) {
    const device = config.device; // was: m = c.device

    if (device.androidOsExperience) {
      cparams.caoe = `${device.androidOsExperience}`;
    }
    if (device.androidPlayServicesVersion) {
      cparams.capsv = `${device.androidPlayServicesVersion}`;
    }
    if (device.brand) {
      cparams.cbrand = device.brand; // was: m.brand
    }
    if (device.browser) {
      cparams.cbr = device.browser; // was: m.browser
    }
    if (device.browserVersion) {
      cparams.cbrver = device.browserVersion; // was: m.browserVersion
    }
    if (device.cobaltReleaseVehicle) {
      cparams.ccrv = `${device.cobaltReleaseVehicle}`;
    }

    cparams.c = device.interfaceName || 'WEB';
    cparams.cver = device.interfaceVersion || 'html5';

    if (device.interfaceTheme) {
      cparams.ctheme = device.interfaceTheme; // was: m.interfaceTheme
    }

    cparams.cplayer = device.interfacePlayerType || 'UNIPLAYER';

    if (device.model) {
      cparams.cmodel = device.model; // was: m.model
    }
    if (device.network) {
      cparams.cnetwork = device.network; // was: m.network
    }
    if (device.os) {
      cparams.cos = device.os; // was: m.os
    }
    if (device.osVersion) {
      cparams.cosver = device.osVersion; // was: m.osVersion
    }
    if (device.platform) {
      cparams.cplatform = device.platform; // was: m.platform
    }

    // Extended logging params -- gated on experiment flag frequency
    const logFreq = getExperimentString(experiments, 'html5_log_vss_extra_lr_cparams_freq'); // was: WU(...)
    if (logFreq === 'all' || logFreq === 'once') {
      if (device.chipset) {
        extendedCparams.cchip = device.chipset; // was: m.chipset
      }
      if (device.cobaltAppVersion) {
        extendedCparams.ccappver = device.cobaltAppVersion; // was: m.cobaltAppVersion
      }
      if (device.firmwareVersion) {
        extendedCparams.cfrmver = device.firmwareVersion; // was: m.firmwareVersion
      }
      if (device.deviceYear) {
        extendedCparams.crqyear = device.deviceYear; // was: m.deviceYear
      }
    }
  } else {
    // Fallback to legacy query-param style
    cparams.c = queryParams.c || 'web'; // was: Q.c || "web"
    cparams.cver = queryParams.cver || 'html5'; // was: Q.cver || "html5"
    cparams.cplayer = 'UNIPLAYER';
  }
}

// ---------------------------------------------------------------------------
// Loader URL / embed detection (~83033-83038)
// ---------------------------------------------------------------------------

/**
 * Resolve the loader URL, preferring embed URL when the player is embedded,
 * or falling back to `document.location`.
 *
 * [was: inline in PlayerConfig constructor, line ~83033]
 *
 * @param {Object} config - INNERTUBE config [was: c]
 * @param {Object} queryParams - legacy query params [was: Q]
 * @param {boolean} isEmbed - whether the player is in embed mode [was: this.j]
 * @param {Function} isZoK - trust-domain check function [was: ZoK]
 * @param {string} documentUrl - current document URL [was: this.Hw]
 * @returns {string} resolved loader URL
 */
export function resolveLoaderUrl(config, queryParams, isEmbed, isZoK, documentUrl) {
  if (config) {
    // INNERTUBE path
    return (isEmbed || (isZoK() && config.loaderUrl))
      ? (config.loaderUrl || '')
      : documentUrl;
  }
  // Legacy path
  return (isEmbed || (isZoK() && queryParams.loaderUrl))
    ? (queryParams.loaderUrl ?? '') // was: vn("", Q.loaderUrl)
    : documentUrl;
}

/**
 * Check whether a URL belongs to a trusted ad domain.
 *
 * [was: inline at line ~83038, uses regex IDK via tI()]
 *
 * @param {string} url - URL to test
 * @param {RegExp} trustedDomainRegex - regex for trusted domains [was: IDK]
 * @returns {boolean}
 */
export function isTrustedAdDomain(url, trustedDomainRegex) {
  return trustedDomainRegex.test(url);
}

// ---------------------------------------------------------------------------
// Helpers (referenced but defined elsewhere)
// ---------------------------------------------------------------------------

/**
 * Retrieve a string-valued experiment flag.
 * Placeholder -- actual implementation is in ExperimentConfig/WU.
 * [was: WU]
 */
function getExperimentString(experiments, flagName) {
  return experiments?.flags?.[flagName] ?? '';
}

// ===========================================================================
// PlayerConfig constructor -- feature flags & platform detection
// Source: player_es6.vflset/en_US/base.js, lines ~83039-83283
// ===========================================================================

// ---------------------------------------------------------------------------
// Picture-in-picture feature flags  (~83098-83114)
// ---------------------------------------------------------------------------

/**
 * Determine whether the browser supports picture-in-picture.
 *
 * Checks `document.pictureInPictureEnabled` (standard API) or vendor-prefixed
 * `Vc()` (Safari webkit PiP).
 *
 * [was: inline at line ~83098; `this.ef`]
 *
 * @returns {boolean}
 */
export function isPictureInPictureSupported() { // was: this.ef assignment
  return !!window.document.pictureInPictureEnabled || isWebkitPipSupported(); // was: Vc()
}

/**
 * Build the full set of picture-in-picture experiment flags from a
 * PlayerConfig.
 *
 * [was: inline at lines ~83106-83114; properties on `this`]
 *
 * @param {Object} config - PlayerConfig instance [was: this]
 * @returns {Object} pip feature flags
 */
export function buildPipFlags(config) { // was: inline in constructor
  const pipLoggingOnResize = config.isExperimentEnabled('html5_picture_in_picture_logging_onresize'); // was: this.PS = this.X("html5_picture_in_picture_logging_onresize")
  const pipLoggingRatio = getExperimentNumber(config.experiments, 'html5_picture_in_picture_logging_onresize_ratio') ?? 0.33; // was: this.qR = g.Um(...) ?? .33
  const pipBlockingOnResize = config.isExperimentEnabled('html5_picture_in_picture_blocking_onresize'); // was: this.a_
  const pipBlockingOnTimeUpdate = config.isExperimentEnabled('html5_picture_in_picture_blocking_ontimeupdate'); // was: this.I_
  const pipBlockingDocumentFullscreen = config.isExperimentEnabled('html5_picture_in_picture_blocking_document_fullscreen'); // was: this.xo
  const pipBlockingStandardApi = config.isExperimentEnabled('html5_picture_in_picture_blocking_standard_api'); // was: this.pB

  // Composite PiP blocking flag
  const isChromeLike = isChrome() && getChromeMajor(58) && !isAndroidWebView(); // was: U = Nt() && G5(58) && !wL()
  const isMseUnavailable = isIOS() || typeof MediaSource === 'undefined'; // was: r = ou || typeof MediaSource === "undefined"
  const shouldBlockPip = // was: this.gA
    (config.isExperimentEnabled('uniplayer_block_pip') && (isChromeLike || isMseUnavailable)) ||
    pipBlockingOnResize ||
    pipBlockingOnTimeUpdate ||
    pipBlockingStandardApi;

  return {
    pipLoggingOnResize,       // was: this.PS
    pipLoggingRatio,          // was: this.qR
    pipBlockingOnResize,      // was: this.a_
    pipBlockingOnTimeUpdate,  // was: this.I_
    pipBlockingDocumentFullscreen, // was: this.xo
    pipBlockingStandardApi,   // was: this.pB
    shouldBlockPip,           // was: this.gA
  };
}

// ---------------------------------------------------------------------------
// Related videos UI settings  (~83115-83121)
// ---------------------------------------------------------------------------

/**
 * Determine whether related videos should be shown at end of playback.
 *
 * For embedded players (`g.oc`) that have NOT opted out of the API
 * deprecation (`ws`), related videos are always shown.  Otherwise
 * the `rel` / `disableRelatedVideos` config value is honoured.
 *
 * [was: inline at lines ~83115-83119; `this.d3`]
 *
 * @param {Object} config - PlayerConfig [was: this]
 * @param {Object} innertubeConfig - INNERTUBE config [was: c]
 * @param {Object} queryParams - legacy query params [was: Q]
 * @returns {boolean} true if related videos are enabled
 */
export function isRelatedVideosEnabled(config, innertubeConfig, queryParams) { // was: this.d3 assignment
  const forceRelated = isOfficialEmbed(config) && !config.optOutApiDeprecation; // was: U = g.oc(this) && !this.ws
  let relParam; // was: I
  if (innertubeConfig) {
    if (innertubeConfig.disableRelatedVideos !== undefined) {
      relParam = !innertubeConfig.disableRelatedVideos;
    }
  } else {
    relParam = queryParams.rel;
  }
  return forceRelated || parseBooleanDefault(!config.isGvn, relParam); // was: gL(!this.D, I)
}

/**
 * Determine whether content-owner related videos are enabled.
 *
 * [was: inline at line ~83119; `this.T0`]
 *
 * @param {Object} innertubeConfig - INNERTUBE config [was: c]
 * @param {Object} queryParams - legacy query params [was: Q]
 * @returns {boolean}
 */
export function isContentOwnerRelatedEnabled(innertubeConfig, queryParams) { // was: this.T0
  return parseBooleanDefault(false, innertubeConfig ? innertubeConfig.enableContentOwnerRelatedVideos : queryParams.co_rel);
}

// ---------------------------------------------------------------------------
// Fullscreen and streaming policy  (~83102-83105, ~83252-83259)
// ---------------------------------------------------------------------------

/**
 * Determine whether fullscreen is disabled.
 *
 * [was: inline at line ~83103; `this.Q1`]
 *
 * @param {Object} innertubeConfig - INNERTUBE config [was: c]
 * @param {Object} queryParams - legacy query params [was: Q]
 * @returns {boolean} true if fullscreen is DISABLED
 */
export function isFullscreenDisabled(innertubeConfig, queryParams) { // was: this.Q1
  return innertubeConfig
    ? !!innertubeConfig.disableFullscreen
    : !parseBooleanDefault(true, queryParams.fs);
}

/**
 * Determine whether the fullscreen button should be shown.
 *
 * Fullscreen is enabled when not explicitly disabled, the browser API
 * is available (`g.JE()`), and the player is not in a lite-mode embedded
 * context.
 *
 * [was: inline at line ~83105; `this.Y0`]
 *
 * @param {Object} config - PlayerConfig [was: this]
 * @param {boolean} fullscreenDisabled - result of isFullscreenDisabled [was: this.Q1]
 * @returns {boolean}
 */
export function isFullscreenAvailable(config, fullscreenDisabled) { // was: this.Y0
  const isDetailOrAdBlazer = (isDetailPage(config) || isAdUnit(config)) && config.playerStyle === 'blazer'; // was: U
  const isLiteEmbedded = isLiteModeActive(getLiteMode(config)) && isOfficialEmbed(config); // was: r
  return !fullscreenDisabled && (isDetailOrAdBlazer || isFullscreenApiAvailable()) && !isLiteEmbedded;
}

/**
 * Determine whether external fullscreen mode is used (host app controls
 * fullscreen rather than the player).
 *
 * [was: inline at line ~83259; `this.externalFullscreen`]
 *
 * @param {Object} config - PlayerConfig [was: this]
 * @param {Object} innertubeConfig - INNERTUBE config [was: c]
 * @param {Object} queryParams - legacy query params [was: Q]
 * @returns {boolean}
 */
export function isExternalFullscreen(config, innertubeConfig, queryParams) { // was: this.externalFullscreen
  if (isOfficialEmbed(config) && !innertubeConfig?.embedsHostFlags?.allowSetFauxFullscreen) {
    return false;
  }
  return innertubeConfig
    ? !!innertubeConfig.externalFullscreen
    : parseBooleanDefault(false, queryParams.external_fullscreen);
}

// ---------------------------------------------------------------------------
// Device platform detection  (~83098-83100, ~83228-83229, ~83062-83075)
// ---------------------------------------------------------------------------

/**
 * Determine whether autoplay is supported on this platform.
 *
 * Autoplay is blocked on mobile devices that are NOT in an official embed
 * context, and on the Nintendo Wii U browser -- unless the
 * `supportsAutoplayOverride` config flag is set.
 *
 * [was: inline at line ~83100; `this.BG`]
 *
 * @param {Object} config - PlayerConfig [was: this]
 * @param {Object} innertubeConfig - INNERTUBE config [was: c]
 * @param {Object} queryParams - legacy query params [was: Q]
 * @returns {boolean} true if autoplay is supported
 */
export function isAutoplaySupported(config, innertubeConfig, queryParams) { // was: this.BG
  const overrideFlag = innertubeConfig // was: U
    ? !!innertubeConfig.supportsAutoplayOverride
    : parseBooleanDefault(false, queryParams.autoplayoverride);
  return (!(config.isMobileDevice && !isOfficialEmbed(config)) && !isNintendoWiiU()) || overrideFlag;
}

/**
 * Detect whether the user agent is a Nintendo Wii U browser.
 *
 * [was: g.Hn("nintendo wiiu"), referenced at lines ~83100, ~32228]
 *
 * @returns {boolean}
 */
export function isNintendoWiiU() {
  return /nintendo wiiu/i.test(navigator.userAgent); // was: g.Hn("nintendo wiiu")
}

/**
 * Check whether the `playsInline` attribute is needed (iOS Safari
 * without `playsInline` support on the video element, or Nintendo Wii U).
 *
 * When the `html5_local_playsinline` experiment is active, uses a more
 * targeted check based on iOS version and video element capabilities.
 *
 * [was: g.Ax, line ~32228]
 *
 * @param {Object} config - PlayerConfig [was: Q]
 * @returns {boolean} true if native controls / inline playback cannot be used
 */
export function requiresNativeControls(config) { // was: g.Ax
  if (config.isExperimentEnabled('html5_local_playsinline')) {
    // iOS without playsInline attribute support
    return isIOS() && !isSafariVersionAtLeast(602) && !('playsInline' in createVideoElement());
  }
  // Legacy path: iOS without mobile-inline override, or Wii U
  if ((isIOS() && !config.mobileIphoneSupportsInlinePlayback) || isNintendoWiiU()) {
    return true;
  }
  return false;
}

/**
 * Resolve the living room app mode from config.
 *
 * [was: inline at line ~83254; `this.livingRoomAppMode`]
 *
 * @param {Object} queryParams - legacy query params [was: Q]
 * @param {Object} innertubeConfig - INNERTUBE config [was: c]
 * @returns {string}
 */
export function resolveLivingRoomAppMode(queryParams, innertubeConfig) {
  const VALID_MODES = [ // was: gL3
    'LIVING_ROOM_APP_MODE_UNSPECIFIED',
    'LIVING_ROOM_APP_MODE_MAIN',
    'LIVING_ROOM_APP_MODE_KIDS',
  ];
  const raw = queryParams.living_room_app_mode || innertubeConfig?.device?.livingRoomAppMode;
  return VALID_MODES.includes(raw)
    ? raw
    : 'LIVING_ROOM_APP_MODE_UNSPECIFIED';
}

// ---------------------------------------------------------------------------
// Player style -> CSI service name mapping  (~83123-83175)
// ---------------------------------------------------------------------------

/**
 * Map the player style string to the CSI service-name abbreviation.
 *
 * [was: inline switch at lines ~83123-83175; `this.mF`]
 *
 * @param {string} playerStyle - e.g. "blogger", "gmail", "docs" [was: this.playerStyle]
 * @returns {string} two-letter CSI service name
 */
export function getCsiServiceName(playerStyle) { // was: this.mF assignment
  switch (playerStyle) {
    case 'blogger':        return 'bl';
    case 'discover-ads':   return 'dd';
    case 'gmail':          return 'gm';
    case 'gac':            return 'ga';
    case 'ads-preview':    return 'ap';
    case 'ads-fe':         return 'adfe';
    case 'books':          return 'gb';
    case 'docs':           // fall through
    case 'flix':           return 'gd';
    case 'duo':            return 'gu';
    case 'google-live':    return 'gl';
    case 'google-one':     return 'go';
    case 'play':           // fall through
    case 'play-ads':       return 'gp';
    case 'chat':           return 'hc';
    case 'hangouts-meet':  return 'hm';
    case 'photos-edu':     // fall through
    case 'picasaweb':      return 'pw';
    default:               return 'yt';
  }
}

// ---------------------------------------------------------------------------
// Embedded player lite-mode enumeration  (~32256-32261)
// ---------------------------------------------------------------------------

/**
 * Lite-mode enum values for embedded players.
 * [was: EfO]
 */
export const EMBEDDED_PLAYER_LITE_MODES = [ // was: EfO
  'EMBEDDED_PLAYER_LITE_MODE_UNKNOWN',
  'EMBEDDED_PLAYER_LITE_MODE_NONE',
  'EMBEDDED_PLAYER_LITE_MODE_FIXED_PLAYBACK_LIMIT',
  'EMBEDDED_PLAYER_LITE_MODE_DYNAMIC_PLAYBACK_LIMIT',
];

/**
 * Determine the embedded player lite mode.
 *
 * [was: g.q8, lines ~32256-32261]
 *
 * @param {Object} config - PlayerConfig [was: Q]
 * @returns {string} one of EMBEDDED_PLAYER_LITE_MODES
 */
export function getLiteMode(config) { // was: g.q8
  if (
    !config.webPlayerContextConfig?.embedsHostFlags?.enableLiteUx ||
    config.isPrivateEmbed ||  // was: Q.MQ
    config.isGvn ||           // was: Q.D
    config.isPflMode ||       // was: Q.A
    config.embeddedPlayerMode === 'EMBEDDED_PLAYER_MODE_PFP' // was: Q.Ie === "EMBEDDED_PLAYER_MODE_PFP"
  ) {
    return 'EMBEDDED_PLAYER_LITE_MODE_NONE';
  }
  const modeIndex = getExperimentNumber(config.experiments, 'embeds_web_lite_mode'); // was: g.Um(...)
  if (modeIndex === undefined) {
    return 'EMBEDDED_PLAYER_LITE_MODE_UNKNOWN';
  }
  return (modeIndex >= 0 && modeIndex < EMBEDDED_PLAYER_LITE_MODES.length)
    ? EMBEDDED_PLAYER_LITE_MODES[modeIndex]
    : 'EMBEDDED_PLAYER_LITE_MODE_UNKNOWN';
}

// ---------------------------------------------------------------------------
// Nocookie domain normalization  (~32302-32305, ~83337)
// ---------------------------------------------------------------------------

/**
 * Domains that should be treated as `www.youtube.com` for URL generation.
 * [was: j8x]
 */
export const YOUTUBE_ALIAS_DOMAINS = [ // was: j8x
  'www.youtube-nocookie.com',
  'youtube.googleapis.com',
  'www.youtubeeducation.com',
  'youtubeeducation.com',
];

/**
 * Engage-type IDs that are always enabled regardless of config.
 * [was: wl_]
 */
export const ALWAYS_ENABLED_ENGAGE_TYPES = [19]; // was: wl_

// ---------------------------------------------------------------------------
// Additional helpers (stubs for functions referenced in new sections)
// ---------------------------------------------------------------------------

/** Get numeric experiment value. [was: g.Um] */
function getExperimentNumber(experiments, flagName) {
  return experiments?.flags?.[flagName];
}

/** Parse a boolean with a default. [was: gL] */
function parseBooleanDefault(defaultVal, value) {
  return value !== undefined ? !!value : defaultVal;
}

/** Check if player is in an official YouTube embed. [was: g.oc] */
function isOfficialEmbed(config) {
  return config.j && isEmbedded(config) && !isAdUnit(config) && !config.isGvn;
}

/** Check event label is "embedded". [was: g.eh] */
function isEmbedded(config) {
  return config.isSamsungSmartTV === 'embedded';
}

/** Check event label is "detailpage". [was: BU] */
function isDetailPage(config) {
  return config.isSamsungSmartTV === 'detailpage';
}

/** Check if playerStyle is an ad unit. [was: V_] */
function isAdUnit(config) {
  return config.isSamsungSmartTV === 'adunit' || config.playerStyle === 'gvn';
}

/** Check if lite mode string is active (not NONE). [was: g.l0] */
function isLiteModeActive(mode) {
  return mode !== 'EMBEDDED_PLAYER_LITE_MODE_NONE';
}

/** Check fullscreen API availability. [was: g.JE] */
function isFullscreenApiAvailable() {
  return !!(document.fullscreenEnabled ?? document.webkitFullscreenEnabled);
}

/** Check if iOS. [was: E1, ou] */
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** Check Safari version. [was: g.Pb] */
function isSafariVersionAtLeast(_ver) {
  return false; // stub
}

/** Check if Chrome. [was: Nt] */
function isChrome() {
  return /Chrome/.test(navigator.userAgent);
}

/** Check Chrome major version. [was: G5] */
function getChromeMajor(_minVer) {
  return true; // stub
}

/** Check if Android WebView. [was: wL] */
function isAndroidWebView() {
  return false; // stub
}

/** Check if webkit PiP is supported (Safari). [was: Vc] */
function isWebkitPipSupported() {
  return false; // stub
}

/** Create a video element for feature detection. [was: IR()] */
function createVideoElement() {
  return document.createElement('video');
}

/**
 * Generic browser version check (alias for isSafariVersionAtLeast).
 * [was: g.Pb]
 */
export function isBrowserVersionAtLeast(ver) {
  return isSafariVersionAtLeast(ver);
}
