/**
 * Autoplay — Next-video selection, related-video parsing, autonav feature
 * tracking, and video metadata extraction for autoplay.
 *
 * Source: player_es6.vflset/en_US/base.js, lines 34000–34983
 *
 * Handles:
 *  - endScreenVideoRenderer / endScreenPlaylistRenderer parsing
 *  - Autoplay click-tracking parameter propagation (itct, autonav, playnext)
 *  - Thumbnail overlay analysis (LIVE, UPCOMING, DEFAULT badges)
 *  - webShowNewAutonavCountdown next-video card population
 *  - Related-video suggestion list building
 *  - VideoData field merging (seR — legacy key-value update path)
 *  - Autoplay eligibility checks (c0, r7)
 *  - Audio normalization gain calculation (Am7, edm)
 *  - Autoplay state enum mapping (ZQ7)
 */

import { getProperty } from '../core/misc-helpers.js';  // was: g.l
import { isEmbedWithAudio } from '../data/bandwidth-tracker.js';  // was: g.oc
import { reportWarning } from '../data/gel-params.js';  // was: g.Ty
import { playVideo } from '../player/player-events.js';  // was: g.playVideo
import { appendUrlParams } from '../core/misc-helpers.js'; // was: d5
import { SIGNAL_TRACKING } from '../data/session-storage.js'; // was: zT
import { getProgressBarMetrics } from '../ui/progress-bar-impl.js'; // was: BC
import { encryptSync } from '../media/drm-signature.js'; // was: I4
import { coerceString } from '../core/composition-helpers.js'; // was: vn
import { ensureProtocol } from '../ads/ad-scheduling.js'; // was: iR
import { updateBadgeExpansion } from '../player/video-loader.js'; // was: Q4
import { coerceBoolean } from '../core/composition-helpers.js'; // was: gL
import { EMPTY_EXTENSIONS } from '../proto/messages-core.js'; // was: KV
import { validateBaseUrl } from '../media/seek-controller.js'; // was: nO_
import { matchEnum } from '../core/composition-helpers.js'; // was: O1
import { coerceNumber } from '../core/composition-helpers.js'; // was: fh
import { registerAdTimelinePlayback } from '../ads/dai-cue-range.js'; // was: Rt
import { getUserSettings } from '../ads/ad-async.js'; // was: xD
import { ShareButton } from './keyboard-handler.js'; // was: TOv
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { appendInitSegment } from '../media/mse-internals.js'; // was: qF
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { parseKeywords } from '../media/format-mappings.js'; // was: ft3
import { parseCommaSeparatedQueries } from '../data/idb-transactions.js'; // was: jD
import { parseKeyValueString } from '../data/idb-transactions.js'; // was: Le
import { AdPlaybackProgressTracker } from '../player/component-events.js'; // was: Vd
import { setSeekBarEnabled } from '../ui/progress-bar-impl.js'; // was: yV
import { isSignedIn } from '../data/bandwidth-tracker.js'; // was: fD
import { mergeInlineMetrics } from './autoplay.js'; // was: EAW
import { executeAttestation } from '../core/event-registration.js'; // was: vG
import { extractVideoId } from '../core/composition-helpers.js'; // was: GG
import { readByte } from '../data/collection-utils.js'; // was: Wl
import { getEventLabel } from './autoplay.js'; // was: TL
import { sha1HexDigest } from '../core/event-system.js'; // was: kN
import { isDetailOrShortsAutoplay } from './autoplay.js'; // was: r7
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { invokeUnaryRpc } from '../media/bitstream-reader.js'; // was: BG
import { resetBufferPosition } from '../modules/caption/caption-internals.js'; // was: Er
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { pubsub2Publish } from '../data/gel-core.js'; // was: Lq
import { getThumbnailUrl } from '../data/collection-utils.js'; // was: dK
import { getEstimatedTime } from '../modules/remote/remote-player.js'; // was: b$
import { shouldIncludeDebugData } from '../network/uri-utils.js'; // was: GA
import { getOnesieRequestDiagnostics } from '../media/drm-signature.js'; // was: L$
import { PlayerError } from '../ui/cue-manager.js';
// TODO: resolve g.nl
// TODO: resolve g.s8

// ══════════════════════════════════════════════════════════════════════
// parseEndScreenSuggestions — Parse endscreen renderers into suggestions.
// [was: inline within a larger function] — Source lines 34019–34081
// ══════════════════════════════════════════════════════════════════════

/**
 * Walk the `endScreenVideoRenderer` and `endScreenPlaylistRenderer` entries
 * from the player response and produce an array of suggestion card objects
 * (`th` for videos, `H4` for playlists).
 *
 * For each video renderer the following fields are extracted:
 *  - `videoId`, `lengthInSeconds`, `publishedTimeText`
 *  - `shortBylineText` (author), `shortViewCountText`
 *  - `title` + accessibility label
 *  - `navigationEndpoint` (clickTrackingParams, watchEndpoint, urlEndpoint)
 *  - `thumbnailOverlays` — detects LIVE, UPCOMING, or DEFAULT badge style
 *  - `thumbnail` → `EV` (cover image data via `l4`)
 *
 * For each playlist renderer:
 *  - `playlistId`, `videoCount`, first video `videoId`
 *  - `title`, `shortBylineText` (author)
 *
 * @param {Array} renderers [was: r] — array of endscreen renderer wrappers
 * @param {Object} videoData [was: Q] — current VideoData instance
 * @returns {Array} suggestions — array of `th` / `H4` instances
 */
export function parseEndScreenSuggestions(renderers, videoData) {
  const suggestions = []; // was: X
  for (const entry of renderers) { // was: e
    let clickTrackingParams = undefined; // was: r (reused)
    let card = null; // was: A

    if (entry.endScreenVideoRenderer) {
      const renderer = entry.endScreenVideoRenderer; // was: T
      const titleObj = renderer.title; // was: U
      card = new th(videoData.G()); // was: new th(Q.G())
      card.videoId = renderer.videoId;
      card.lengthSeconds = renderer.lengthInSeconds || 0;

      const publishedTime = renderer.publishedTimeText; // was: I
      if (publishedTime) card.publishedTimeText = logQoeEvent(publishedTime);

      const byline = renderer.shortBylineText; // was: I (reused)
      if (byline) card.author = logQoeEvent(byline);

      const viewCount = renderer.shortViewCountText; // was: I (reused)
      if (viewCount) card.shortViewCount = logQoeEvent(viewCount);

      if (titleObj) {
        card.title = logQoeEvent(titleObj);
        const accessibility = titleObj.accessibility; // was: U
        if (accessibility) {
          const data = accessibility.accessibilityData; // was: U
          if (data && data.label) card.ariaLabel = data.label;
        }
      }

      const navEndpoint = renderer.navigationEndpoint; // was: I
      if (navEndpoint) {
        clickTrackingParams = navEndpoint.clickTrackingParams; // was: r
        const watchEndpoint = getProperty(navEndpoint, g.nl); // was: U
        const urlEndpoint = getProperty(navEndpoint, g.s8); // was: I
        if (watchEndpoint) {
          card.Li = watchEndpoint;
        } else if (urlEndpoint != null) {
          card.watchUrl = urlEndpoint.url;
        }
      }

      const overlays = renderer.thumbnailOverlays; // was: U
      if (overlays) {
        for (const overlay of overlays) { // was: V
          const statusRenderer = overlay.thumbnailOverlayTimeStatusRenderer; // was: U
          if (statusRenderer) {
            if (statusRenderer.style === "LIVE") {
              card.isLivePlayback = true; // was: !0
              break;
            } else if (statusRenderer.style === "UPCOMING") {
              card.isUpcoming = true; // was: !0
              break;
            }
          }
        }
      }
      card.EV = l4(renderer.thumbnail); // was: l4(T.thumbnail)

    } else if (entry.endScreenPlaylistRenderer) {
      const renderer = entry.endScreenPlaylistRenderer; // was: T
      const navEndpoint = renderer.navigationEndpoint; // was: r
      if (!navEndpoint) continue;

      const watchEndpoint = getProperty(navEndpoint, g.nl); // was: A
      if (!watchEndpoint) continue;

      const firstVideoId = watchEndpoint.videoId; // was: U
      card = new ShrunkenPlayerBytesMetadata(videoData.G()); // was: new H4(Q.G())
      card.playlistId = renderer.playlistId;
      card.playlistLength = Number(renderer.videoCount) || 0;
      card.W = firstVideoId || null;
      card.videoId = firstVideoId;

      const title = renderer.title; // was: U
      if (title) card.title = logQoeEvent(title);

      const author = renderer.shortBylineText; // was: U
      if (author) card.author = logQoeEvent(author);

      clickTrackingParams = navEndpoint.clickTrackingParams; // was: r
      card.EV = l4(renderer.thumbnail);
    }

    if (card) {
      if (clickTrackingParams) {
        card.sessionData = { itct: clickTrackingParams };
      }
      suggestions.push(card);
    }
  }
  return suggestions;
}

// ══════════════════════════════════════════════════════════════════════
// buildAutoplaySessionData — Set autonav tracking params on a suggestion.
// [was: inline] — Source lines 34000–34005, 34123–34136
// ══════════════════════════════════════════════════════════════════════

/**
 * Build the session-data dictionary attached to the next autoplay card.
 *
 * Keys produced:
 *  - `autonav`: always `"1"`
 *  - `playnext`: `"true"` or `"false"` stringified
 *  - `itct`: click-tracking param (from autoplay endpoint or omitted)
 *  - `feature`: falls back to `"related-auto"` when `itct` is absent
 *  - `autoplay`: `"1"` when the card targets a playlist
 *
 * @param {boolean} isPlayNext [was: W]
 * @param {string|undefined} clickTrackingParams [was: A]
 * @param {boolean} hasPlaylistId — whether the target card has a playlistId
 * @returns {Object} session data dictionary
 */
export function buildAutoplaySessionData(isPlayNext, clickTrackingParams, hasPlaylistId) {
  const sessionData = { // was: T / W
    autonav: "1",
    playnext: String(isPlayNext),
  };
  if (hasPlaylistId) sessionData.autoplay = "1";
  if (clickTrackingParams) {
    sessionData.itct = clickTrackingParams;
  } else {
    sessionData.feature = "related-auto";
  }
  return sessionData;
}

// ══════════════════════════════════════════════════════════════════════
// populateAutonavCountdownCard — Fill the "new autonav countdown" card.
// [was: inline] — Source lines 34085–34141
// ══════════════════════════════════════════════════════════════════════

/**
 * When `webShowNewAutonavCountdown` is enabled, build a fully-populated
 * video suggestion card from the autonav config (`K`).
 *
 * Extracts `videoTitle`, `byline`, `publishedTimeText`, `shortViewCountText`,
 * thumbnail overlay badges (LIVE / UPCOMING / DEFAULT with lengthText), the
 * `background` thumbnail, the `nextButton` navigation endpoint, and a
 * premium badge check (`BADGE_STYLE_TYPE_PREMIUM`).
 *
 * Also sets countdown timers:
 *  - `Q.BC = countDownSecs * 1000`
 *  - `Q.I4 = countDownSecsForFullscreen * 1000` (or `-1` for infinite)
 *
 * @param {Object} videoData [was: Q] — mutable VideoData
 * @param {Object} autonavConfig [was: K] — from player response
 * @param {Object|null} responseData [was: m] — optional full response
 * @param {boolean} isPlayNext [was: W]
 */
export function populateAutonavCountdownCard(videoData, autonavConfig, responseData, isPlayNext) {
  const card = new th(videoData.G()); // was: e
  card.videoId = autonavConfig.videoId;

  // Title + accessibility
  const videoTitle = autonavConfig.videoTitle; // was: X
  if (videoTitle) {
    card.title = logQoeEvent(videoTitle);
    const accessibility = videoTitle.accessibility; // was: X
    if (accessibility) {
      const data = accessibility.accessibilityData; // was: X
      if (data && data.label) card.ariaLabel = data.label;
    }
  }

  // Byline / published time / view count
  const byline = autonavConfig.byline; // was: X
  if (byline) card.author = logQoeEvent(byline);

  const publishedTime = autonavConfig.publishedTimeText; // was: X
  if (publishedTime) card.publishedTimeText = logQoeEvent(publishedTime);

  const viewCount = autonavConfig.shortViewCountText; // was: X
  if (viewCount) card.shortViewCount = logQoeEvent(viewCount);

  // Thumbnail overlays — detect LIVE, UPCOMING, DEFAULT
  const overlays = autonavConfig.thumbnailOverlays; // was: X
  if (overlays) {
    for (const overlay of overlays) { // was: B
      const statusRenderer = overlay.thumbnailOverlayTimeStatusRenderer; // was: X
      if (statusRenderer) {
        if (statusRenderer.style === "LIVE") {
          card.isLivePlayback = true; // was: !0
          break;
        } else if (statusRenderer.style === "UPCOMING") {
          card.isUpcoming = true; // was: !0
          break;
        } else if (statusRenderer.style === "DEFAULT" && statusRenderer.text) {
          card.lengthText = logQoeEvent(statusRenderer.text);
          const textAccessibility = statusRenderer.text.accessibility; // was: B
          if (textAccessibility) {
            const accData = textAccessibility.accessibilityData; // was: B
            if (accData && accData.label) card.h_ = accData.label || "";
          }
          break;
        }
      }
    }
  }

  // Background thumbnail
  card.EV = l4(autonavConfig.background); // was: V.background

  // Next-button navigation endpoint
  const nextButton = autonavConfig.nextButton; // was: B
  if (nextButton) {
    const buttonRenderer = nextButton.buttonRenderer; // was: B
    if (buttonRenderer) {
      const navEndpoint = buttonRenderer.navigationEndpoint; // was: B
      if (navEndpoint) {
        const watchEndpoint = getProperty(navEndpoint, g.nl); // was: B
        if (watchEndpoint) card.Li = watchEndpoint;
      }
    }
  }

  // Premium badge
  if (autonavConfig.topBadges) {
    const firstBadge = autonavConfig.topBadges[0]; // was: B
    if (firstBadge) {
      const badgeRenderer = getProperty(firstBadge, yI0); // was: B
      if (badgeRenderer && badgeRenderer.style === "BADGE_STYLE_TYPE_PREMIUM") {
        card.pC = true; // was: !0
      }
    }
  }

  // Alternative title
  const altTitle = autonavConfig.alternativeTitle; // was: B
  if (altTitle) card.KY = logQoeEvent(altTitle);

  // Session data with autonav tracking
  const sessionData = buildAutoplaySessionData(isPlayNext, undefined, card.playlistId);
  if (responseData) {
    const autoplayVideo = responseData.autoplay?.autoplay?.sets?.[0]?.autoplayVideo; // was: V
    if (autoplayVideo) {
      const itct = autoplayVideo.clickTrackingParams; // was: m
      if (itct) sessionData.itct = itct;
      const watchEp = getProperty(autoplayVideo, g.nl); // was: V
      if (watchEp) card.C5 = watchEp;
    }
  } else if (autonavConfig) {
    const itct = autonavConfig.nextButton?.buttonRenderer?.navigationEndpoint?.clickTrackingParams; // was: V
    if (itct) sessionData.itct = itct;
  }
  if (!sessionData.itct) sessionData.feature = "related-auto";
  card.appendUrlParams = sessionData;

  if (!videoData.suggestions) videoData.suggestions = [];
  videoData.SIGNAL_TRACKING = card;

  // Countdown timers
  if (autonavConfig.countDownSecs != null) {
    videoData.getProgressBarMetrics = autonavConfig.countDownSecs * 1000;
  }
  if (autonavConfig.countDownSecsForFullscreen != null) {
    videoData.encryptSync = autonavConfig.countDownSecsForFullscreen >= 0
      ? autonavConfig.countDownSecsForFullscreen * 1000
      : -1;
  }
}

// ══════════════════════════════════════════════════════════════════════
// mergeVideoDataFromLegacyParams — Apply key-value updates to VideoData.
// [was: seR] — Source lines 34172–34229
// ══════════════════════════════════════════════════════════════════════

/**
 * Merge a flat key-value parameter bag (`params`) into an existing
 * `VideoData` instance.  This is the legacy (non-JSON) update path used
 * when the server returns query-string-style fields.
 *
 * Notable field mappings:
 *  - `c.iv_invideo_url` → `Q.Q4` (in-video annotation URL)
 *  - `c.cc_asr` → `Q.rX` (ASR caption flag)
 *  - `c.autonav_state` → `Q.autonavState` (via `ZQ7` enum)
 *  - `c.rvs` → `Q.suggestions` (related-video string → `th` / `H4` objects)
 *  - `c.keywords` → `Q.keywords` (comma-separated → sanitized array)
 *
 * @param {Object} videoData [was: Q]
 * @param {Object} params [was: c]
 */
export function mergeVideoDataFromLegacyParams(videoData, params) { // was: seR
  videoData.fflags = coerceString(videoData.fflags, params.fflags);

  let temp = params.iv_invideo_url; // was: W
  if (temp) videoData.updateBadgeExpansion = ensureProtocol(temp);

  videoData.je = coerceBoolean(videoData.je, params.iv_ads_only);

  temp = params.cta_conversion_urls;
  if (temp) videoData.EMPTY_EXTENSIONS = temp;

  videoData.isPharma = coerceBoolean(videoData.isPharma, params.is_pharma);
  videoData.author = coerceString(videoData.author, params.author);
  videoData.sC = validateBaseUrl(params.ttsurl) || videoData.sC;
  videoData.rX = coerceBoolean(videoData.rX, params.cc_asr);
  videoData.PA = coerceString(videoData.PA, params.channel_path);

  temp = params.profile_picture;
  if (temp) videoData.profilePicture = coerceString(videoData.profilePicture, temp);

  videoData.videoCountText = coerceString(videoData.videoCountText, params.video_count_text);
  videoData.autonavState = matchEnum(videoData.autonavState, params.autonav_state, ZQ7);
  videoData.clientPlaybackNonce = coerceString(videoData.clientPlaybackNonce, params.cpn);
  videoData.subscribed = coerceBoolean(videoData.subscribed, params.subscribed);
  videoData.rawViewCount = coerceNumber(videoData.rawViewCount, params.view_count);
  videoData.shortViewCount = coerceString(videoData.shortViewCount, params.short_view_count_text);
  videoData.publishedTimeText = coerceString(videoData.publishedTimeText || "", params.publishedTimeText);
  videoData.lengthText = coerceString(videoData.lengthText || "", params.lengthText);
  videoData.h_ = coerceString(videoData.h_ || "", params.h_);
  videoData.KY = coerceString(videoData.KY || "", params.KY);
  videoData.title = coerceString(videoData.title, params.title);
  videoData.subtitle = coerceString(videoData.subtitle, params.subtitle);
  videoData.expandedTitle = coerceString(videoData.expandedTitle, params.expanded_title);
  videoData.expandedSubtitle = coerceString(videoData.expandedSubtitle, params.expanded_subtitle);
  videoData.ypcPreview = coerceString(videoData.ypcPreview, params.ypc_preview);
  videoData.Oa = coerceString(videoData.Oa, params.ypc_origin);
  videoData.registerAdTimelinePlayback = coerceBoolean(videoData.registerAdTimelinePlayback, params.ypc_is_premiere_trailer);
  videoData.getUserSettings = coerceString(videoData.getUserSettings, params.ypc_clickwrap_message);
  videoData.paygated = coerceBoolean(videoData.paygated, params.paygated);
  videoData.mK = coerceBoolean(videoData.mK, params.requires_purchase);
  videoData.showShareButton = !coerceBoolean(!videoData.showShareButton, params.ss);
  videoData.isTvHtml5Exact = coerceBoolean(videoData.isTvHtml5Exact, params.showwatchlater);
  videoData.qY = coerceBoolean(videoData.qY, params.shownotifybutton);
  videoData.appendInitSegment = coerceBoolean(videoData.appendInitSegment, params.copy_share);

  temp = params.createDatabaseDefinition;
  if (temp) videoData.eventLabel = temp;

  temp = params.keywords;
  if (temp) videoData.keywords = parseKeywords(temp.split(","));

  temp = params.rvs;
  if (temp) {
    videoData.suggestions = parseCommaSeparatedQueries(temp).map(
      (entry) => entry.playlist || entry.list || entry.api
        ? new ShrunkenPlayerBytesMetadata(videoData.LayoutExitedMetadata, entry)
        : new th(videoData.LayoutExitedMetadata, entry),
    );
  }

  videoData.contentCheckOk = coerceBoolean(videoData.contentCheckOk, params.cco);
  videoData.racyCheckOk = coerceBoolean(videoData.racyCheckOk, params.rco);
  videoData.isLivingRoomDeeplink = coerceBoolean(videoData.isLivingRoomDeeplink, params.is_living_room_deeplink);
  videoData.oauthToken = coerceString(videoData.oauthToken, params.oauth_token);
  videoData.Y0 = coerceString(videoData.Y0, params.kpt);
  videoData.visitorData = coerceString(videoData.visitorData, params.visitor_data);

  temp = params.session_data;
  if (temp) videoData.sessionData = parseKeyValueString(temp, "&");

  videoData.AdPlaybackProgressTracker = coerceString(videoData.AdPlaybackProgressTracker, params.endscreen_ad_tracking_data);
  videoData.setSeekBarEnabled = coerceBoolean(videoData.setSeekBarEnabled, params.wait_for_vast_info_cards_xml);
  videoData.isSignedIn = coerceBoolean(videoData.isSignedIn, params.suppress_creator_endscreen);
  videoData.PQ = coerceBoolean(videoData.PQ, params.is_trueview_action);
  videoData.xX = coerceString(videoData.xX, params.tracking_list);

  mergeInlineMetrics(videoData, params); // was: EAW(Q, c)
}

// ══════════════════════════════════════════════════════════════════════
// updateVideoData — Top-level data merge entry point.
// [was: g.Sm] — Source lines 34232–34246
// ══════════════════════════════════════════════════════════════════════

/**
 * Update `videoData` with `params`.  When `isFullReplace` is true the
 * entire data object is replaced via `setData`; otherwise individual
 * fields are patched through the legacy merge helpers.
 *
 * Logs a warning when a CPN (client playback nonce) is unexpectedly
 * present in the update payload.
 *
 * @param {Object} videoData [was: Q]
 * @param {Object} params [was: c]
 * @param {boolean} isFullReplace [was: W]
 */
export function updateVideoData(videoData, params, isFullReplace) { // was: g.Sm
  if (params && params.cpn) {
    reportWarning(new PlayerError("CPN provided in VideoData update", {
      gR2: params.cpn,
      executeAttestation: videoData.clientPlaybackNonce,
      tBe: isFullReplace,
    }));
  }
  if (isFullReplace) {
    extractVideoId(params);
    videoData.setData(params);
    if (xQ(videoData)) videoData.readByte();
  } else {
    const p = params || {};
    trW(videoData, p);
    yK(videoData, p);
    Fd3(videoData, p);
    mergeVideoDataFromLegacyParams(videoData, p); // was: seR(Q, c)
    videoData.publish("dataupdated");
  }
}

// ══════════════════════════════════════════════════════════════════════
// isAutoplayEligible — Determine whether this video should auto-start.
// [was: c0] — Source lines 34974–34983
// ══════════════════════════════════════════════════════════════════════

/**
 * Central autoplay gate.  The decision depends on:
 *
 *  - **adunit**: delegates to `Q.kN` (the ad-unit's own autoplay flag).
 *  - **detailpage / shortspage**:
 *    - `Q.isAutonav` or `Q.HA > 0` → auto-navigate mode.
 *    - `Q.d3` (DOM-paused) → no autoplay.
 *    - Fallback: `AJ.BG || AJ.Er || !isEmbedWithAudio(AJ)` (embed/overlay heuristics).
 *  - **everything else**: honours `Q.nO` (spatial audio flag gate) when
 *    `isEmbedWithAudio` is true.
 *
 * When the `html5_log_detailpage_autoplay` experiment is active, a
 * telemetry event is published via `tJ("autoplay_info", ...)`.
 *
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function isAutoplayEligible(videoData) { // was: c0
  const eventLabel = getEventLabel(videoData); // was: TL(Q)
  const result = eventLabel === "adunit"
    ? videoData.sha1HexDigest
    : isDetailOrShortsAutoplay(videoData) // was: r7(Q) — checks detailpage / shortspage / mutedAutoplay
      ? eventLabel === "detailpage" || eventLabel === "shortspage"
        ? videoData.isAutonav || videoData.parseHexColor > 0
        : videoData.applyQualityConstraint
          ? false // was: !1
          : videoData.LayoutExitedMetadata.invokeUnaryRpc || videoData.LayoutExitedMetadata.resetBufferPosition || !isEmbedWithAudio(videoData.LayoutExitedMetadata)
            ? true // was: !0
            : false // was: !1
      : (videoData.applyQualityConstraint ? 0 : videoData.nO) && isEmbedWithAudio(videoData.LayoutExitedMetadata)
        ? true // was: !0
        : false; // was: !1

  if (videoData.X("html5_log_detailpage_autoplay") && eventLabel === "detailpage") {
    videoData.RetryTimer("autoplay_info", {
      autoplay: videoData.F_,
      autonav: videoData.isAutonav,
      wasDompaused: videoData.applyQualityConstraint,
      result,
    });
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════
// isDetailOrShortsAutoplay — Check for detail / shorts / muted autoplay.
// [was: r7] — Source lines 34970–34972
// ══════════════════════════════════════════════════════════════════════

/**
 * Returns `true` when the video is on a detail page, shorts page,
 * explicitly force-autoplayed (`F_`), or a muted autoplay unit.
 *
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function isDetailOrShortsAutoplay(videoData) { // was: r7
  const label = getEventLabel(videoData);
  return videoData.F_ || label === "detailpage" || label === "shortspage" || videoData.mutedAutoplay;
}

// ══════════════════════════════════════════════════════════════════════
// getEventLabel — Resolve the event-label string for telemetry.
// [was: TL] — Source lines 34962–34964
// ══════════════════════════════════════════════════════════════════════

/**
 * If the video has an `adFormat` other than `"1_5"`, the event label is
 * `"adunit"`.  Otherwise falls back to `Q.eventLabel` or `AJ.b0`.
 *
 * @param {Object} videoData [was: Q]
 * @returns {string}
 */
export function getEventLabel(videoData) { // was: TL
  return videoData.adFormat && (videoData.JJ
    ? videoData.adFormat !== "1_5"
    : videoData.adFormat != "1_5")
    ? "adunit"
    : videoData.eventLabel || videoData.LayoutExitedMetadata.isSamsungSmartTV;
}

// ══════════════════════════════════════════════════════════════════════
// isShortsPage — Quick test for the "shortspage" event label.
// [was: g.oZ] — Source lines 34966–34968
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function isShortsPage(videoData) { // was: g.oZ
  return getEventLabel(videoData) === "shortspage";
}

// ══════════════════════════════════════════════════════════════════════
// mergeInlineMetrics — Copy inline-metric & masthead ad quartile URLs.
// [was: EAW] — Source lines 34248–34262
// ══════════════════════════════════════════════════════════════════════

/**
 * When `params.inlineMetricEnabled` is truthy, set the flag on `videoData`.
 * Also copies `playback_progress_0s_url` (as a `dPw` instance) and the
 * full set of masthead-ad quartile tracking URLs (0 / 25 / 50 / 75 / 100,
 * both singular and plural forms).
 *
 * @param {Object} videoData [was: Q]
 * @param {Object} params [was: c]
 */
export function mergeInlineMetrics(videoData, params) { // was: EAW
  if (params.inlineMetricEnabled) videoData.inlineMetricEnabled = true; // was: !0
  if (params.playback_progress_0s_url) {
    videoData.ObservableTarget = new dPw(params);
  }
  const quartiles = params.video_masthead_ad_quartile_urls; // was: c (reassigned)
  if (quartiles) {
    videoData.VX = quartiles.quartile_0_url;
    videoData.pubsub2Publish = quartiles.quartile_25_url;
    videoData.Br = quartiles.quartile_50_url;
    videoData.GQ = quartiles.quartile_75_url;
    videoData.getThumbnailUrl = quartiles.quartile_100_url;
    videoData.getEstimatedTime = quartiles.quartile_0_urls;
    videoData.Bv = quartiles.quartile_25_urls;
    videoData.shouldIncludeDebugData = quartiles.quartile_50_urls;
    videoData.vv = quartiles.quartile_75_urls;
    videoData.getOnesieRequestDiagnostics = quartiles.quartile_100_urls;
  }
}
