/**
 * seek-controller.js -- Seek state machine, playback controller continuation, and format
 *                       parser tail with gapless validation
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~33728-34999
 *
 * Handles:
 *  - Storyboard level selection and frame lookup (II, Uw, UP3)
 *  - HLS manifest URL construction (I63) and N-parameter fixup (XRm)
 *  - Ad video-id resolution (Ah)
 *  - SABR (Server ABR) eligibility detection (M8)
 *  - Caption track parsing from player response (Dwd)
 *  - Playability status and error-screen parsing (tK_)
 *  - Heartbeat config parsing (Hrn)
 *  - Interstitial (pre/mid/post-roll) scheduling (y1K)
 *  - Tooltip and player-overlay parsing (S5x, dw7)
 *  - Video playability: backgroundable, offlineable, PiP (Lh7)
 *  - Embedded player response processing (trW) with playlist parsing
 *  - Watch-next response processing (yK) with autoplay/suggestions
 *  - Video data update pipeline (seR, g.Sm)
 *  - Gapless playback eligibility (jew, wA)
 *  - DRM probe and format selection (zZn, g.Ow, pR7)
 *  - Manifest loading (Yad) from DASH MPD or offline IndexedDB
 *  - HLS / legacy format selection (cm7, WXK, Thy)
 *  - Live-stream metadata: latency class, low-latency detection
 *  - Stats-for-nerds debug info assembly (uTy)
 *
 * @module media/seek-controller
 */

// ============================================================================
// Storyboard helpers
// ============================================================================


import { registerDisposable } from '../core/event-system.js'; // was: g.F
import { getProperty } from '../core/misc-helpers.js'; // was: g.l
import { reportWarning } from '../data/gel-params.js'; // was: g.Ty
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { validateCaptionsUrl } from '../ads/ad-scheduling.js'; // was: Xx7
import { makeAbsoluteUrl } from '../ads/ad-scheduling.js'; // was: Add
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { VideoInfo } from './codec-tables.js'; // was: gh
import { positionMarkerOverlays } from '../ui/progress-bar-impl.js'; // was: UC
import { isSabrLiveEligible } from './audio-normalization.js'; // was: VK
import { SimpleSlotAdapterFactory } from '../ads/ad-slot-adapters.js'; // was: hO
import { SYM_SERIALIZE } from '../proto/message-setup.js'; // was: gG
import { adBadgeViewModel } from '../core/misc-helpers.js'; // was: nK
import { isAudioCodec } from './codec-helpers.js'; // was: wh
import { parseCommaSeparatedQueries } from '../data/idb-transactions.js'; // was: jD
import { METRIC_RECORD_FIELDS } from '../proto/messages-media.js'; // was: uQ
import { parseQueryString } from '../data/idb-transactions.js'; // was: bk
import { getUserSettings } from '../ads/ad-async.js'; // was: xD
import { coerceBoolean } from '../core/composition-helpers.js'; // was: gL
import { clearChildPlaybacksInRange } from '../player/state-init.js'; // was: uM
import { preferAudioOnly } from './audio-normalization.js'; // was: bb
import { executeCommand } from '../ads/ad-scheduling.js'; // was: xA
import { AdButton } from '../player/component-events.js'; // was: wK
import { isAv1Disabled } from './audio-normalization.js'; // was: jm
import { playerBytesSequenceItemLayout } from '../core/misc-helpers.js'; // was: qs
import { isCompressedDomainComposite } from './audio-normalization.js'; // was: gA
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { isCobaltAppleTV } from '../core/composition-helpers.js'; // was: y5
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { buildFamilyFormatMap } from './format-setup.js'; // was: Za0
import { supportsDashOpus } from './codec-detection.js'; // was: FG
import { adjustDaiDuration } from '../player/playback-mode.js'; // was: Qw
import { readByte } from '../data/collection-utils.js'; // was: Wl
import { ensureListener } from '../core/composition-helpers.js'; // was: dm
import { snapSpeed } from '../ui/seek-bar-tail.js'; // was: dd
import { createErrorResult } from '../core/misc-helpers.js'; // was: U1
import { ensureFakeStream } from '../ads/ad-async.js'; // was: f0_
import { createSuccessResult } from '../core/misc-helpers.js'; // was: I2
import { selectFormatsWithHint } from './format-setup.js'; // was: Gi_
import { SessionBase } from '../modules/remote/cast-controls.js'; // was: oV
import { appendParamsToUrl } from '../core/url-utils.js';
import { mapErrorCode } from '../data/bandwidth-tracker.js';
import { concat } from '../core/array-utils.js';
import { supportsGaplessShorts, getUserAudio51Preference } from '../player/player-api.js';
import { SIGNAL_ACTION_KEY } from '../data/action-processor.js'; // was: g.CD
// TODO: resolve g.lB
// TODO: resolve g.zz

/**
 * Calculate the storyboard frame index from column/row grid dimensions.
 * [was: II]
 *
 * @param {Object} level     [was: Q] - storyboard level with .columns, .rows
 * @param {number} frameIndex [was: c]
 * @returns {number}
 */
export function getStoryboardPage(level, frameIndex) { // was: II
  return Math.floor(frameIndex / (level.columns * level.rows));
}

/**
 * Find the appropriate storyboard level for a given player width.
 * Caches results in `level.j`.
 * [was: Uw]
 *
 * @param {Object} storyboard  [was: Q]
 * @param {number} playerWidth [was: c]
 * @returns {number} level index
 */
export function getStoryboardLevel(storyboard, playerWidth) { // was: Uw
  let cached = storyboard.j.get(playerWidth); // was: W
  if (cached) return cached;

  const count = storyboard.levels.length; // was: W (reused)
  for (let i = 0; i < count; i++) { // was: m
    if (storyboard.levels[i].width >= playerWidth) {
      storyboard.j.set(playerWidth, i);
      return i;
    }
  }
  storyboard.j.set(playerWidth, count - 1);
  return count - 1;
}

/**
 * Look up the storyboard frame URL index for a given level and time.
 * [was: UP3]
 *
 * @param {Object} storyboard [was: Q]
 * @param {number} levelIndex [was: c]
 * @param {number} time       [was: W]
 * @returns {number} -1 if level missing
 */
export function getStoryboardFrameUrl(storyboard, levelIndex, time) { // was: UP3
  const level = storyboard.levels[levelIndex]; // was: Q (reused)
  return level ? level.j(time) : -1;
}

// ============================================================================
// HLS manifest URL construction
// ============================================================================

/**
 * Build an HLS manifest URL with CPN and optional IBW parameters.
 * [was: I63]
 *
 * @param {string} manifestUrl [was: Q]
 * @param {string} cpn         [was: c]
 * @param {number} [maxBitrate] [was: W]
 * @returns {Object} { url, type, quality, itag }
 */
export function buildHlsManifestUrl(manifestUrl, cpn, maxBitrate) { // was: I63
  const params = { cpn }; // was: c (reused)
  manifestUrl.indexOf('/ibw/') === -1 && (params.ibw = maxBitrate ? String(maxBitrate) : '1369843');
  return {
    url: appendParamsToUrl(manifestUrl, params),
    type: 'application/x-mpegURL',
    quality: 'auto',
    itag: '93',
  };
}

/**
 * Fix the `/n/` (N-parameter) in a format URL to match the `n` query param.
 * Works around server-side inconsistencies where the path and query diverge.
 * [was: XRm]
 *
 * @param {string} url [was: Q]
 * @returns {string}
 */
export function fixNParameter(url) { // was: XRm
  try {
    const nParam = new g.lB(url, true).get('n'); // was: c, was: !0
    if (nParam) {
      const pathMatch = url.match(/\/n\/([^/]+)/); // was: W
      if (pathMatch && pathMatch[1] && pathMatch[1] !== nParam) {
        return url.replace(`/n/${pathMatch[1]}`, `/n/${nParam}`);
      }
    }
  } catch (err) { // was: c
    reportWarning(err);
  }
  return url;
}

// ============================================================================
// Ad video-id resolution
// ============================================================================

/**
 * If the current video is an ad and its video ID differs from the player config's,
 * return the player config's video ID (the "content" video ID).
 * [was: Ah]
 *
 * @param {Object} videoData [was: Q]
 * @returns {string|undefined}
 */
export function getAdContentVideoId(videoData) { // was: Ah
  if (
    videoData.isAd() &&
    (videoData.JJ
      ? videoData.videoId !== videoData.LayoutExitedMetadata.instreamAdPlayerOverlayRenderer
      : videoData.videoId != videoData.LayoutExitedMetadata.instreamAdPlayerOverlayRenderer)
  ) {
    return videoData.LayoutExitedMetadata.instreamAdPlayerOverlayRenderer;
  }
}

// ============================================================================
// URL validation for captions / base URLs
// ============================================================================

/**
 * Validate and normalise a caption/TTS base URL. Returns empty string on failure.
 * [was: nO_]
 *
 * @param {string} url [was: Q]
 * @returns {string}
 */
export function validateBaseUrl(url) { // was: nO_
  if (url) {
    if (validateCaptionsUrl(url)) return url;
    const normalized = makeAbsoluteUrl(url); // was: Q (reused)
    if (validateCaptionsUrl(normalized, true)) return normalized; // was: !0
  }
  return '';
}

// ============================================================================
// SABR eligibility
// ============================================================================

/**
 * Determine whether the current video should use SABR (Server-driven ABR).
 * Checks network namespace, DRM status, experiment flags, and feature gates.
 * [was: M8]
 *
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function shouldUseSabr(videoData) { // was: M8
  const isDriveNamespace = videoData.X('html5_enable_sabr_on_drive') && videoData.LayoutExitedMetadata.mF === 'gd'; // was: c

  if (videoData.mq) {
    videoData.dS && videoData.RetryTimer('fds', { fds: true }, true); // was: !0
    return false; // was: !1
  }

  if (videoData.LayoutExitedMetadata.mF !== 'yt' && !isDriveNamespace) {
    videoData.dS && videoData.RetryTimer('dsvn', { ns: videoData.LayoutExitedMetadata.mF }, true);
    return false;
  }

  if (
    videoData.cotn ||
    !videoData.W ||
    (videoData.W.isOtf && !videoData.X('html5_enable_sabr_otf_in_client')) ||
    (videoData.A && !videoData.A.W()) ||
    (videoData.VideoInfo && !videoData.X('html5_enable_sabr_csdai'))
  ) {
    return false;
  }

  if (videoData.X('html5_use_sabr_requests_for_debugging')) return true; // was: !0

  videoData.dS && videoData.RetryTimer('esfw', { usbc: videoData.dS, hsu: !!videoData.U2 }, true);

  if (videoData.dS && videoData.U2) return true;

  if (videoData.X('html5_remove_client_sabr_determination')) return false;

  const isNonDrmNonLive = !videoData.W.positionMarkerOverlays && !videoData.Ir(); // was: W
  const streamingXhr = isNonDrmNonLive && em && videoData.X('html5_enable_sabr_vod_streaming_xhr'); // was: c (reused)
  const nonStreamingXhr = isNonDrmNonLive && !em && videoData.X('html5_enable_sabr_vod_non_streaming_xhr'); // was: W (reused)
  const liveEligible = isSabrLiveEligible(videoData); // was: m
  const drmStreaming = // was: K
    videoData.X('html5_enable_sabr_drm_vod_streaming_xhr') &&
    em &&
    videoData.Ir() &&
    !videoData.W.positionMarkerOverlays &&
    (videoData.drmProduct === '1' ? false : true); // was: !1 : !0

  const eligible = streamingXhr || nonStreamingXhr || liveEligible || drmStreaming; // was: c (reused)
  eligible && !videoData.U2 && videoData.RetryTimer('sabr', { loc: 'm' }, true);
  return eligible && !!videoData.U2;
}

// ============================================================================
// Caption track parsing
// ============================================================================

/**
 * Parse caption tracks, audio tracks, and translation languages
 * from the playerCaptionsTracklistRenderer config.
 * [was: Dwd]
 *
 * @param {Object} videoData [was: Q]
 * @param {Object} captionConfig [was: c]
 */
export function parseCaptionTracks(videoData, captionConfig) { // was: Dwd
  videoData.captionTracks = [];

  if (captionConfig.captionTracks) {
    for (const track of captionConfig.captionTracks) { // was: W
      const baseUrl = validateBaseUrl(track.baseUrl); // was: m
      if (!baseUrl) return;

      const entry = { // was: m (reused)
        is_translateable: !!track.isTranslatable,
        languageCode: track.languageCode,
        languageName: track.name && logQoeEvent(track.name),
        url: baseUrl,
        vss_id: track.vssId,
        kind: track.kind,
      };
      entry.name = track.trackName;
      entry.displayName = track.name && logQoeEvent(track.name);
      videoData.captionTracks.push(new g.zz(entry));
    }
  }

  videoData.u8 = captionConfig.audioTracks || [];
  videoData.Xv = captionConfig.defaultAudioTrackIndex || 0;
  videoData.Hf = [];

  if (captionConfig.translationLanguages) {
    for (const lang of captionConfig.translationLanguages) { // was: K
      const langEntry = {}; // was: W (reused)
      langEntry.languageCode = lang.languageCode;
      langEntry.languageName = logQoeEvent(lang.languageName);

      if (lang.translationSourceTrackIndices) {
        langEntry.translationSourceTrackIndices = [];
        for (const idx of lang.translationSourceTrackIndices) { // was: T
          langEntry.translationSourceTrackIndices.push(idx);
        }
      }

      if (lang.excludeAudioTrackIndices) {
        langEntry.excludeAudioTrackIndices = [];
        for (const idx of lang.excludeAudioTrackIndices) {
          langEntry.excludeAudioTrackIndices.push(idx);
        }
      }

      videoData.Hf.push(langEntry);
    }
  }

  videoData.SimpleSlotAdapterFactory = [];
  if (captionConfig.defaultTranslationSourceTrackIndices) {
    for (const idx of captionConfig.defaultTranslationSourceTrackIndices) { // was: K
      videoData.SimpleSlotAdapterFactory.push(idx);
    }
  }

  videoData.SYM_SERIALIZE = !!captionConfig.contribute && !!captionConfig.contribute.captionsMetadataRenderer;
}

// ============================================================================
// Playability / error handling
// ============================================================================

/**
 * Parse error information from the playability status block.
 * Sets errorCode, errorReason, errorDetail, nK (subreason), Ke (raw subreason).
 * [was: tK_]
 *
 * @param {Object} videoData   [was: Q]
 * @param {Object} playability [was: c]
 * @param {Object} [videoInfo] [was: W]
 */
export function parsePlayabilityError(videoData, playability, videoInfo) { // was: tK_
  const errorScreen = playability.errorScreen; // was: m

  // Skip errors when the screen is a YPC offer/trailer or the status is OK/live-offline/fullscreen
  if (
    errorScreen &&
    (errorScreen.playerLegacyDesktopYpcOfferRenderer ||
      errorScreen.playerLegacyDesktopYpcTrailerRenderer ||
      errorScreen.ypcTrailerRenderer)
  ) {
    return;
  }
  if (videoInfo && videoInfo.isUpcoming) return;
  if (['OK', 'LIVE_STREAM_OFFLINE', 'FULLSCREEN_ONLY'].includes(playability.status)) return;

  videoData.NetworkErrorCode = mapErrorCode(playability.NetworkErrorCode) || 'auth';

  const errorMsg = errorScreen?.playerErrorMessageRenderer; // was: W (reused)
  if (errorMsg) {
    videoData.playerErrorMessageRenderer = errorMsg;
    const reason = errorMsg.reason; // was: K
    reason && (videoData.errorReason = logQoeEvent(reason));
    const subreason = errorMsg.subreason; // was: W (reused)
    if (subreason) {
      videoData.adBadgeViewModel = logQoeEvent(subreason);
      videoData.Ke = subreason;
    }
  } else {
    videoData.errorReason = playability.reason || null;
  }

  const status = playability.status; // was: W (reused)
  if (status === 'LOGIN_REQUIRED') {
    videoData.errorDetail = '1';
  } else if (status === 'CONTENT_CHECK_REQUIRED') {
    videoData.errorDetail = '2';
  } else if (status === 'AGE_CHECK_REQUIRED') {
    const kavRenderer = playability.errorScreen?.playerKavRenderer; // was: c (reused)
    videoData.errorDetail = kavRenderer && kavRenderer.kavUrl ? '4' : '3';
  } else {
    const proceedCmd = errorScreen?.playerErrorMessageRenderer?.proceedButton?.buttonRenderer?.command; // was: m (reused)
    videoData.errorDetail = playability.isBlockedInRestrictedMode
      ? '5'
      : getProperty(proceedCmd, SIGNAL_ACTION_KEY)?.signal === 'RELOAD_PAGE'
        ? '7'
        : '0';
  }
}

// ============================================================================
// Heartbeat config
// ============================================================================

/**
 * Parse heartbeat configuration from the player response.
 * [was: Hrn]
 *
 * @param {Object} videoData    [was: Q]
 * @param {Object} heartbeatCfg [was: c]
 */
export function parseHeartbeatConfig(videoData, heartbeatCfg) { // was: Hrn
  videoData.isAudioCodec = true; // was: !0
  const token = heartbeatCfg.heartbeatToken; // was: W
  if (token) {
    videoData.drmSessionId = heartbeatCfg.drmSessionId || '';
    videoData.heartbeatToken = token;
    videoData.tG = Number(heartbeatCfg.intervalMilliseconds);
    videoData.parseCommaSeparatedQueries = Number(heartbeatCfg.maxRetries);
    videoData.Mv = !!heartbeatCfg.softFailOnError;
    videoData.METRIC_RECORD_FIELDS = !!heartbeatCfg.useInnertubeHeartbeatsForDrm;
  }
  videoData.heartbeatServerData = heartbeatCfg.heartbeatServerData;
  videoData.DL = !!heartbeatCfg.heartbeatAttestationConfig?.requiresAttestation;
}

// ============================================================================
// Interstitial scheduling
// ============================================================================

/**
 * Schedule interstitials (pre-roll, mid-roll, post-roll) from the player response.
 * [was: y1K]
 *
 * @param {Object} videoData      [was: Q]
 * @param {Array}  interstitialPods [was: c]
 */
export function scheduleInterstitials(videoData, interstitialPods) { // was: y1K
  for (const pod of interstitialPods) { // was: W
    const entries = pod.interstitials.map((item) => { // was: c (reused), m
      const nxwRenderer = getProperty(item, Nxw); // was: K
      if (nxwRenderer) {
        return { is_yto_interstitial: true, raw_player_response: nxwRenderer }; // was: !0
      }
      const irdRenderer = getProperty(item, ird); // was: m (reused)
      if (irdRenderer) {
        return Object.assign({ is_yto_interstitial: true }, parseQueryString(irdRenderer));
      }
    });

    for (const entry of entries) { // was: m
      switch (pod.podConfig.playbackPlacement) {
        case 'INTERSTITIAL_PLAYBACK_PLACEMENT_PRE':
          videoData.interstitials = videoData.interstitials.concat({
            time: 0,
            playerVars: entry,
            N7: 5,
          });
          break;

        case 'INTERSTITIAL_PLAYBACK_PLACEMENT_POST':
          videoData.interstitials = videoData.interstitials.concat({
            time: 0x7ffffffffffff,
            playerVars: entry,
            N7: 6,
          });
          break;

        case 'INTERSTITIAL_PLAYBACK_PLACEMENT_INSERT_AT_VIDEO_TIME': {
          const timeMs = Number(pod.podConfig.timeToInsertAtMillis); // was: c (reused)
          videoData.interstitials = videoData.interstitials.concat({
            time: timeMs,
            playerVars: entry,
            N7: timeMs === 0 ? 5 : 7,
          });
          break;
        }
      }
    }
  }
}

// ============================================================================
// Tooltip / overlay parsing
// ============================================================================

/**
 * Extract tooltip renderer from response array.
 * [was: S5x]
 *
 * @param {Object} videoData [was: Q]
 * @param {Array}  items     [was: c]
 */
export function parseTooltip(videoData, items) { // was: S5x
  const match = items.find((item) => !(!item || !item.tooltipRenderer)); // was: c (reused)
  if (match) videoData.tooltipRenderer = match.tooltipRenderer;
}

/**
 * Parse player controls overlay (muted autoplay end-screen text, control background).
 * [was: dw7]
 *
 * @param {Object} videoData  [was: Q]
 * @param {Object} overlayCtrl [was: c]
 */
export function parseControlsOverlay(videoData, overlayCtrl) { // was: dw7
  const renderer = overlayCtrl?.playerControlsOverlayRenderer; // was: c (reused)
  if (renderer) {
    Zrm(videoData, renderer.controlBgHtml);
    if (renderer.mutedAutoplay) {
      const maRenderer = getProperty(renderer.mutedAutoplay, EOK); // was: c (reused)
      if (maRenderer?.endScreen) {
        const endScreen = getProperty(maRenderer.endScreen, szm); // was: c (reused)
        endScreen?.text && (videoData.qy = logQoeEvent(endScreen.text));
      }
    } else {
      videoData.mutedAutoplay = false; // was: !1
    }
  }
}

// ============================================================================
// Playback capability flags
// ============================================================================

/**
 * Parse playback-capability flags: backgroundable, offlineable, PiP, embed, YPC.
 * [was: Lh7]
 *
 * @param {Object} videoData   [was: Q]
 * @param {Object} capabilities [was: c]
 */
export function parsePlaybackCapabilities(videoData, capabilities) { // was: Lh7
  const bgRenderer = capabilities.backgroundability; // was: W
  bgRenderer?.backgroundabilityRenderer?.backgroundable && (videoData.backgroundable = true);

  capabilities.offlineability?.offlineabilityRenderer?.offlineable && (videoData.offlineable = true);

  const ctxParams = capabilities.contextParams; // was: W (reused)
  ctxParams && (videoData.contextParams = ctxParams);

  const pipRenderer = capabilities.pictureInPicture; // was: W (reused)
  pipRenderer?.pictureInPictureRenderer?.playableInPip && (videoData.pipable = true);

  capabilities.playableInEmbed && (videoData.allowEmbed = true);

  const ypcWrap = capabilities.ypcClickwrap; // was: W (reused)
  if (ypcWrap) {
    const legacyRenderer = ypcWrap.playerLegacyDesktopYpcClickwrapRenderer; // was: c (reused)
    const rentalRenderer = ypcWrap.ypcRentalActivationRenderer; // was: W (reused)
    if (legacyRenderer) {
      videoData.getUserSettings = legacyRenderer.durationMessage || '';
      videoData.UY = true;
    } else if (rentalRenderer) {
      const durationMsg = rentalRenderer.durationMessage; // was: c (reused)
      videoData.getUserSettings = durationMsg ? logQoeEvent(durationMsg) : '';
      videoData.UY = true;
    }
  }
}

// ============================================================================
// Gapless playback eligibility
// ============================================================================

/**
 * Determine whether the video should use gapless (seamless) playback.
 * [was: jew]
 *
 * @param {Object} videoData       [was: Q]
 * @param {*}      [serverGapless] [was: c]
 * @returns {boolean}
 */
export function shouldUseGapless(videoData, serverGapless) { // was: jew
  return serverGapless != null
    ? coerceBoolean(videoData.J, serverGapless)
    : videoData.J
      ? videoData.J
      : videoData.LayoutExitedMetadata.preferGapless && videoData.LayoutExitedMetadata.supportsGaplessShorts();
}

/**
 * Validate epoch timestamp (must be finite and greater than 1e9).
 * [was: gAX]
 *
 * @param {number} ts [was: Q]
 * @returns {boolean}
 */
export function isValidEpochTimestamp(ts) { // was: gAX
  return !!ts && isFinite(ts) && ts > 1e9;
}

/**
 * Whether the video qualifies for a gapless shorts transition.
 * [was: wA]
 *
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function isGaplessShortEligible(videoData) { // was: wA
  return videoData.cI() && videoData.G().supportsGaplessShorts();
}

// ============================================================================
// Format selection orchestration
// ============================================================================

/**
 * Build the format selection config for a video (codec preferences, DRM,
 * audio-only, live, etc.).
 * [was: g.Ow]
 *
 * @param {Object} videoData [was: Q]
 * @returns {Object} format selection config
 */
export function buildFormatConfig(videoData) { // was: g.Ow
  let gaplessFlag = videoData.J; // was: c
  videoData.X('html5_gapless_unlimit_format_selection') && isGaplessShortEligible(videoData) &&
    (gaplessFlag = false); // was: !1

  const isLiveEncrypted = !!videoData.W && videoData.W.positionMarkerOverlays; // was: W
  let config = hEm(videoData.LayoutExitedMetadata, { // was: c (reused)
    clearChildPlaybacksInRange: videoData.clearChildPlaybacksInRange(),
    h9: isLiveEncrypted,
    f8: preferAudioOnly(videoData),
    GT: videoData.GT,
    rl: gaplessFlag,
    isOtf: videoData.isOtf(),
    CD: videoData.CD(),
    executeCommand: videoData.executeCommand,
    AdButton: videoData.getUserAudio51Preference(),
    disableAv1: isAv1Disabled(videoData),
    playerBytesSequenceItemLayout: isCompressedDomainComposite(videoData),
  });

  shouldUseSabr(videoData) && (config.skipNextIcon = true); // was: !0

  // Cobalt TVOS dogfood
  isCobaltAppleTV() &&
    videoData.playerResponse?.playerConfig?.webPlayerConfig?.useCobaltTvosDogfoodFeatures &&
    ((config.j = true), (config.K = true));

  // Ad-specific format restrictions
  videoData.J && videoData.isAd() && (
    videoData.r_ && (config.Y = videoData.r_),
    videoData.pF && (config.A = videoData.pF)
  );

  // Shorts hard-cap resolution
  videoData.cI() &&
    (config.Ie = getExperimentValue(videoData.LayoutExitedMetadata.experiments, 'html5_hard_cap_max_vertical_resolution_for_shorts'));

  config.PA = videoData.isLivePlayback && videoData.Ir() && videoData.LayoutExitedMetadata.X('html5_drm_live_audio_51');
  config.isSamsungSmartTV = videoData.Oo;
  videoData.X('html5_disable_vp9_hdr_fairplay') && isCobaltAppleTV() && (config.isSamsungSmartTV = true);
  config.Fw = !shouldUseSabr(videoData);
  config.T2 = !shouldUseSabr(videoData) && videoData.LayoutExitedMetadata.experiments.getExperimentFlags.W.BA(uCm);

  return (videoData.La = config);
}

// ============================================================================
// DRM probe and format loading
// ============================================================================

/**
 * Start the DRM probe sequence. Creates an hZ0 (DRM manager), probes for
 * supported key systems, then resolves the video's Q1 (DRM session list).
 * [was: zZn]
 *
 * @param {Object} videoData [was: Q]
 */
export function startDrmProbe(videoData) { // was: zZn
  Bu('drm_pb_s', undefined, videoData.Y); // was: void 0

  videoData.w0 || (videoData.W && videoData.W.j());

  let filterResult = {}; // was: c
  if (videoData.W) {
    filterResult = buildFamilyFormatMap(
      videoData.tQ,
      buildFormatConfig(videoData),
      videoData.LayoutExitedMetadata.K,
      videoData.W,
      (reason) => videoData.publish('ctmp', 'fmtflt', reason),
      true, // was: !0
      new Set()
    );
  }

  const drmManager = new hZ0( // was: c (reused)
    filterResult,
    videoData.LayoutExitedMetadata,
    videoData.R6,
    videoData.useCobaltWidevine ? (isCobaltAppleTV() ? supportsDashOpus(videoData) : false) : false,
    (code, details) => { videoData.RetryTimer(code, details); }
  );

  registerDisposable(videoData, drmManager);
  videoData.yf = false; // was: !1
  videoData.loading = true; // was: !0

  YhX(drmManager, (sessions) => { // was: W
    Bu('drm_pb_f', undefined, videoData.Y);

    for (const session of sessions) { // was: m
      switch (session.flavor) {
        case 'fairplay':
          session.w0 = videoData.w0;
          session.adjustDaiDuration = videoData.adjustDaiDuration;
          session.MN = videoData.MN;
          break;
        case 'widevine':
          session.Kf = videoData.Kf;
          break;
      }
    }

    videoData.Q1 = sessions;
    if (videoData.Q1.length > 0) {
      videoData.K = videoData.Q1[0];
      if (videoData.LayoutExitedMetadata.cB()) {
        const probeResults = {}; // was: W (reused)
        for (const [mimeType, supported] of Object.entries(videoData.K.O)) {
          let codec = 'unk'; // was: r
          const match = mimeType.match(/(.*)codecs="(.*)"/); // was: U
          match && (codec = match[2]);
          probeResults[codec] = supported; // was: m (reused)
        }
        videoData.RetryTimer('drmProbe', probeResults);
      }
    }

    videoData.readByte();
  });
}

/**
 * Whether the video should use DASH format selection.
 * Returns a promise that resolves once the format list is available.
 * [was: pR7]
 *
 * @param {Object}  videoData       [was: Q]
 * @param {boolean} [skipDash=false] [was: c]
 * @returns {Promise}
 */
export function selectDashFormats(videoData, skipDash) { // was: pR7
  const shouldSkip = skipDash || OQW(videoData) || videoData.isExternallyHostedPodcast; // was: W

  if (!videoData.W || shouldSkip) {
    videoData.RetryTimer('skipDash', {
      ensureListener: !!videoData.W,
      air: skipDash,
      snapSpeed: videoData.mw,
      mss: mi(),
      '3pp': videoData.isExternallyHostedPodcast,
    });
    return createErrorResult();
  }

  preferAudioOnly(videoData) && ensureFakeStream(videoData.W, videoData.isLivePlayback);

  return createSuccessResult().then(() =>
    selectFormatsWithHint(
      videoData.tQ,
      buildFormatConfig(videoData),
      videoData.LayoutExitedMetadata.K,
      videoData.W,
      videoData.K,
      (reason) => videoData.publish('ctmp', 'fmtflt', reason),
      videoData.SessionBase,
      Cl(videoData)
    ).then((formats) => { // was: m
      videoData.Jr(formats);
      videoData.tQ.O = null;
      /^av/.test(videoData.clientPlaybackNonce) && videoData.La && videoData.RetryTimer('av1', videoData.La.O);
    })
  );
}
