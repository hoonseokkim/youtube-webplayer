/**
 * format-mappings.js -- Format parser continuations, codec mappings, and player config parsing
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~33098-33647
 *
 * Handles:
 *  - Legacy ad-params parsing from player annotations (jz3)
 *  - Manifestless windowed-live config (gOW)
 *  - DAI (Dynamic Ad Insertion) config parsing
 *  - Audio config: loudness normalization, muted autoplay, audio-only
 *  - DRM / FairPlay / Widevine config parsing
 *  - Playback start / end config, skip segments
 *  - MediaCommon config: dynamic readahead, SABR context updates, pipelining
 *  - Streaming data parsing: adaptive formats, HLS formats, DASH manifests
 *  - Video details parsing (title, author, channel, view count, etc.)
 *  - YPC (paid content) trailer handling
 *  - Live stream config (latency class, chunk readahead, sub-fragmented FMP4)
 *  - Player local volume storage via IndexedDB (C13, g.W4, g.MKn, g.mj, g.Kl)
 *  - Offline media storage (rA, g.pIx, cIn) via IDB transactions
 *  - Media key range encoding (mPx)
 *
 * @module media/format-mappings
 */

// ============================================================================
// Ad-params from legacy annotations renderer
// ============================================================================


import { getDatasyncId } from '../core/attestation.js'; // was: g.Dk
import { IdbPromise, createIdbNotSupportedError, getIdbToken, openWithToken, runTransaction } from '../data/idb-transactions.js'; // was: g.P8, g.$s, g.AD, g.m7, g.MD
import { getLocalStorage } from '../data/storage.js'; // was: g.Ku
import { sha1HexDigest } from '../core/event-system.js'; // was: kN
import { shouldUseSabr } from './seek-controller.js'; // was: M8
import { getCurrentTimeSec } from '../player/playback-bridge.js'; // was: Qd
import { SurveySubmittedTrigger } from '../ads/ad-trigger-types.js'; // was: Oz
import { VideoInfo } from './codec-tables.js'; // was: gh
import { setChapterMarginRight } from '../ui/progress-bar-impl.js'; // was: mM
import { applyHostOverride } from '../network/service-endpoints.js'; // was: xn
import { hasSapisidCookie } from '../core/event-system.js'; // was: Q2
import { adjustDaiDuration } from '../player/playback-mode.js'; // was: Qw
import { createInVideoOverlayLayout } from '../ads/slot-id-generator.js'; // was: QZ
import { zeroPad } from '../modules/heartbeat/health-monitor.js'; // was: S2
import { ProtobufStreamParser } from './bitstream-reader.js'; // was: SX
import { registerErrorInfoSupplier } from '../player/media-state.js'; // was: Mz
import { OrchestrationResult } from '../modules/offline/download-manager.js'; // was: OY
import { getTransferCharacteristics } from './format-parser.js'; // was: KYw
import { fetchInitSegmentIfNeeded } from './drm-segment.js'; // was: J7
import { ensureProtocol } from '../ads/ad-scheduling.js'; // was: iR
import { playerLocalMediaDbConfig } from '../data/storage-manager.js'; // was: J13
import { shouldUseDesktopControls } from '../data/bandwidth-tracker.js'; // was: tx
import { buildIndexKey } from './format-mappings.js'; // was: kA0
import { onRawStateChange } from '../player/player-events.js'; // was: w_
import { buildQueryFromObject, appendParamsToUrl } from '../core/url-utils.js';
import { toString } from '../core/string-utils.js';
import { PlayerError } from '../ui/cue-manager.js';
import { MEDIA_KEY_REGEX } from '../modules/offline/offline-helpers.js'; // was: g.Wdy
// TODO: resolve g.lB

/**
 * Parse ad parameters from the legacy desktop watch-ads renderer.
 * Sets autoplay and content-thumbnail flags on video data.
 *
 * [was: jz3]
 *
 * @param {Object} videoData        [was: Q]
 * @param {Array}  adComponents     [was: c]
 * @param {Object} playerVarsBridge [was: W]
 */
export function parseAdParams(videoData, adComponents, playerVarsBridge) { // was: jz3
  for (const component of adComponents) { // was: m
    const renderer = component?.playerLegacyDesktopWatchAdsRenderer; // was: c (reused)
    const params = renderer?.playerAdParams; // was: c (reused)
    if (params) {
      params.autoplay == '1' && ((videoData.F_ = true), (videoData.sha1HexDigest = true)); // was: !0
      videoData.i6 = params.encodedAdSafetyReason || null;
      params.showContentThumbnail !== undefined && // was: void 0
        (videoData.Rx = !!params.showContentThumbnail);
      playerVarsBridge.enabled_engage_types = params.enabledEngageTypes;
      break;
    }
  }
}

// ============================================================================
// Manifestless windowed-live config
// ============================================================================

/**
 * Parse the manifestless windowed-live configuration and DAI/audio/DRM/playback
 * sub-configs from the player config overlay.
 *
 * [was: gOW]
 *
 * @param {Object} videoData   [was: Q]
 * @param {Object} configBlock [was: c]
 */
export function parsePlayerConfigOverlay(videoData, configBlock) { // was: gOW
  // --- Manifestless windowed-live ----------------------------------------
  const windowedLive = configBlock.manifestlessWindowedLiveConfig; // was: W
  if (windowedLive) {
    const minSeq = Number(windowedLive.minDvrSequence); // was: m
    const maxSeq = Number(windowedLive.maxDvrSequence); // was: K
    const minTimeMs = Number(windowedLive.minDvrMediaTimeMs); // was: T
    const maxTimeMs = Number(windowedLive.maxDvrMediaTimeMs); // was: r
    const startWalltime = Number(windowedLive.startWalltimeMs); // was: W (reused)

    minSeq && (videoData.Kx = minSeq);
    if (minTimeMs) {
      videoData.NF = minTimeMs / 1e3;
      videoData.X('html5_sabr_parse_live_metadata_playback_boundaries') &&
        shouldUseSabr(videoData) &&
        (videoData.getCurrentTimeSec = minTimeMs / 1e3);
    }
    maxSeq && (videoData.Bs = maxSeq);
    if (maxTimeMs) {
      videoData.Kd = maxTimeMs / 1e3;
      videoData.X('html5_sabr_parse_live_metadata_playback_boundaries') &&
        shouldUseSabr(videoData) &&
        (videoData.Jk = maxTimeMs / 1e3);
    }
    startWalltime && (videoData.TO = startWalltime / 1e3);

    if ((minSeq || minTimeMs) && (maxSeq || maxTimeMs)) {
      videoData.Gd = true; // was: !0
      videoData.isLivePlayback = true;
      videoData.allowLiveDvr = true;
      videoData.DE = false; // was: !1
    }
  }

  // --- DAI config --------------------------------------------------------
  const daiConfig = configBlock.daiConfig; // was: m (reused)
  if (daiConfig) {
    if (daiConfig.enableDai) {
      videoData.wX = true; // was: !0
      daiConfig.enableServerStitchedDai && (videoData.enableServerStitchedDai = daiConfig.enableServerStitchedDai);
      daiConfig.enablePreroll && (videoData.ET = daiConfig.enablePreroll);
    }
    if (daiConfig.daiType === 'DAI_TYPE_SS_DISABLED' || daiConfig.debugInfo?.isDisabledUnpluggedChannel) {
      videoData.SurveySubmittedTrigger = true;
    }
    daiConfig.daiType === 'DAI_TYPE_CLIENT_STITCHED' && (videoData.VideoInfo = true);
    daiConfig.allowUstreamerRequestAdconfig && (videoData.setChapterMarginRight = true);
    daiConfig.sendSsdaiMissingAdBreakReasons && (videoData.CuePointOpportunityMetadata = true);
  }

  // --- Audio config ------------------------------------------------------
  const audioConfig = configBlock.audioConfig; // was: m (reused)
  if (audioConfig) {
    const loudnessDb = audioConfig.loudnessDb; // was: K
    loudnessDb != null && (videoData.Af = loudnessDb);

    const absoluteLoudness = audioConfig.trackAbsoluteLoudnessLkfs;
    absoluteLoudness != null && (videoData.applyHostOverride = absoluteLoudness);

    const targetLkfs = audioConfig.loudnessTargetLkfs;
    targetLkfs != null && (videoData.loudnessTargetLkfs = targetLkfs);

    audioConfig.audioMuted && (videoData.yD = true);
    audioConfig.muteOnStart && (videoData.jN = true);

    const normConfig = audioConfig.loudnessNormalizationConfig; // was: K (reused)
    if (normConfig) {
      normConfig.applyStatefulNormalization && (videoData.applyStatefulNormalization = true);
      normConfig.preserveStatefulLoudnessTarget && (videoData.preserveStatefulLoudnessTarget = true);
      const minTarget = normConfig.minimumLoudnessTargetLkfs; // was: T
      minTarget != null && (videoData.minimumLoudnessTargetLkfs = minTarget);
      const maxThreshold = normConfig.maxStatefulTimeThresholdSec; // was: K (reused)
      maxThreshold != null && (videoData.maxStatefulTimeThresholdSec = maxThreshold);
    }

    audioConfig.playAudioOnly && (videoData.hasSapisidCookie = true);
  }

  // --- Playback end config -----------------------------------------------
  const endConfig = configBlock.playbackEndConfig; // was: K (reused)
  if (endConfig) {
    const endSecs = endConfig.endSeconds; // was: m (reused)
    const limitedDuration = endConfig.limitedPlaybackDurationInSeconds; // was: K (reused)
    if (videoData.mutedAutoplay) {
      endSecs && (videoData.endSeconds = endSecs);
      limitedDuration && (videoData.limitedPlaybackDurationInSeconds = limitedDuration);
    }
  }

  // --- FairPlay config ---------------------------------------------------
  const fpConfig = configBlock.fairPlayConfig; // was: m (reused)
  if (fpConfig) {
    const cert = fpConfig.certificate; // was: K
    if (cert) videoData.w0 = Is(cert);
    const rotationMs = Number(fpConfig.keyRotationPeriodMs); // was: K (reused)
    rotationMs > 0 && (videoData.adjustDaiDuration = rotationMs);
    const prefetchMs = Number(fpConfig.keyPrefetchMarginMs); // was: m (reused)
    prefetchMs > 0 && (videoData.MN = prefetchMs);
  }

  // --- Playback start config / skip segments -----------------------------
  const startConfig = configBlock.playbackStartConfig; // was: m (reused)
  if (startConfig) {
    videoData.createInVideoOverlayLayout = Number(startConfig.startSeconds);
    const liveUtc = startConfig.liveUtcStartSeconds; // was: T
    const hasExistingUtc = !!videoData.liveUtcStartSeconds && videoData.liveUtcStartSeconds > 0; // was: K
    liveUtc && !hasExistingUtc && (videoData.liveUtcStartSeconds = Number(liveUtc));

    const startPosition = startConfig.startPosition; // was: T (reused)
    if (startPosition) {
      const utcMillis = startPosition.utcTimeMillis; // was: r
      utcMillis && !hasExistingUtc && (videoData.liveUtcStartSeconds = Number(utcMillis) * 0.001);
      const streamTimeMs = startPosition.streamTimeMillis; // was: K (reused)
      streamTimeMs && (videoData.Vg = Number(streamTimeMs) * 0.001);
    }
    videoData.progressBarStartPosition = startConfig.progressBarStartPosition;
    videoData.progressBarEndPosition = startConfig.progressBarEndPosition;
  } else {
    const skipConfig = configBlock.skippableSegmentsConfig; // was: m (reused)
    if (skipConfig) {
      const introMs = skipConfig.introSkipDurationMs; // was: K
      introMs && (videoData.qq = Number(introMs) / 1e3);
      const outroMs = skipConfig.outroSkipDurationMs; // was: m (reused)
      outroMs && (videoData.C$ = Number(outroMs) / 1e3);
    }
  }

  // --- Skippable intro config -------------------------------------------
  const introConfig = configBlock.skippableIntroConfig; // was: K (reused)
  if (introConfig) {
    const startMs = Number(introConfig.startMs); // was: m
    const endMs = Number(introConfig.endMs); // was: K (reused)
    if (!isNaN(startMs) && !isNaN(endMs)) {
      videoData.iL = startMs;
      videoData.Wk = endMs;
    }
  }

  // --- Stream selection config ------------------------------------------
  const streamConfig = configBlock.streamSelectionConfig; // was: m (reused)
  if (streamConfig) videoData.zeroPad = Number(streamConfig.maxBitrate);

  // --- VR config --------------------------------------------------------
  const vrConfig = configBlock.vrConfig; // was: m (reused)
  if (vrConfig) videoData.XM = vrConfig.partialSpherical == '1';

  // --- Web DRM config ---------------------------------------------------
  const webDrmConfig = configBlock.webDrmConfig; // was: m (reused)
  if (webDrmConfig) {
    webDrmConfig.skipWidevine && (videoData.R6 = true);
    const wvCert = webDrmConfig.widevineServiceCert; // was: K
    if (wvCert) videoData.Kf = Is(wvCert);
    webDrmConfig.useCobaltWidevine && (videoData.useCobaltWidevine = true);
    webDrmConfig.startWithNoQualityConstraint && (videoData.ProtobufStreamParser = true);
  }

  // --- MediaCommon config ------------------------------------------------
  const mcConfig = configBlock.mediaCommonConfig; // was: m (reused)
  if (mcConfig) {
    const readahead = mcConfig.dynamicReadaheadConfig; // was: K (reused)
    if (readahead) {
      videoData.maxReadAheadMediaTimeMs = readahead.maxReadAheadMediaTimeMs || NaN;
      videoData.minReadAheadMediaTimeMs = readahead.minReadAheadMediaTimeMs || NaN;
      videoData.readAheadGrowthRateMs = readahead.readAheadGrowthRateMs || NaN;

      const ustreamerConfig = mcConfig?.mediaUstreamerRequestConfig?.videoPlaybackUstreamerConfig; // was: K (reused)
      if (ustreamerConfig) videoData.Vf = Is(ustreamerConfig);

      const contextUpdates = mcConfig?.sabrContextUpdates; // was: K (reused)
      if (contextUpdates && contextUpdates.length > 0) {
        for (const update of contextUpdates) { // was: U
          if (update.type && update.value) {
            const entry = { // was: K (reused)
              type: update.type,
              scope: update.scope,
              value: Is(update.value) || undefined, // was: void 0
              sendByDefault: update.sendByDefault,
            };
            videoData.sabrContextUpdates.set(update.type, entry);
          }
        }
      }
    }

    const serverStartConfig = mcConfig.serverPlaybackStartConfig; // was: U
    if (serverStartConfig) videoData.serverPlaybackStartConfig = serverStartConfig;

    mcConfig.useServerDrivenAbr && (videoData.dS = true);

    const pipeliningConfig = mcConfig.requestPipeliningConfig; // was: U (reused)
    if (pipeliningConfig) videoData.requestPipeliningConfig = pipeliningConfig;
  }

  // --- Inline playback config -------------------------------------------
  const inlineConfig = configBlock.inlinePlaybackConfig; // was: U (reused)
  if (inlineConfig) videoData.IX = !!inlineConfig.showAudioControls;

  // --- Embedded player config -------------------------------------------
  const embedConfig = configBlock.embeddedPlayerConfig; // was: U (reused)
  if (embedConfig) {
    videoData.embeddedPlayerConfig = embedConfig;
    const mode = embedConfig.embeddedPlayerMode; // was: K (reused)
    if (mode) {
      const playerConfig = videoData.G(); // was: m (reused)
      playerConfig.Ie = mode;
      playerConfig.A = mode === 'EMBEDDED_PLAYER_MODE_PFL';
    }
    const perms = embedConfig.permissions; // was: U (reused)
    if (perms) videoData.allowImaMonetization = !!perms.allowImaMonetization;
  }

  // --- Web player config ------------------------------------------------
  const wpConfig = configBlock.webPlayerConfig; // was: U (reused)
  if (wpConfig) {
    wpConfig.gatewayExperimentGroup && (videoData.gatewayExperimentGroup = wpConfig.gatewayExperimentGroup);
    wpConfig.isProximaEligible && (videoData.isProximaLatencyEligible = true);
  }

  // --- Player controls seekable -----------------------------------------
  const controlsConfig = configBlock.playerControlsConfig; // was: c (reused)
  if (controlsConfig?.isSeekable !== undefined) { // was: void 0
    videoData.isSeekable = !!controlsConfig.isSeekable;
  }
}

// ============================================================================
// Streaming data parsing
// ============================================================================

/**
 * Parse streaming data (adaptive + HLS formats, DASH/HLS manifest URLs,
 * DRM license info, SABR streaming URL).
 *
 * [was: Orw]
 *
 * @param {Object} videoData   [was: Q]
 * @param {Object} streamData  [was: c]
 * @param {Object} [pairingCfg] [was: W]
 */
export function parseStreamingData(videoData, streamData, pairingCfg) { // was: Orw
  // --- Adaptive formats --------------------------------------------------
  const adaptiveFormats = streamData.formats; // was: m
  if (adaptiveFormats) {
    let debugList = []; // was: K
    for (const fmt of adaptiveFormats) { // was: T
      debugList.push(`${fmt.itag}/${fmt.width}x${fmt.height}`);
    }
    videoData.registerErrorInfoSupplier = debugList.join(',');

    debugList = [];
    for (const fmt of adaptiveFormats) { // was: r
      const entry = { // was: m (reused)
        itag: fmt.itag,
        type: fmt.mimeType,
        quality: fmt.quality,
      };
      const url = fmt.url; // was: T
      url && (entry.url = url);
      const { TP: hasSig, Os: signedUrl, cF: sp, s: sig } = Bs(49, 1346, fmt); // was: V, B, n, S
      hasSig && ((entry.url = signedUrl), (entry.sp = sp), (entry.s = sig));
      debugList.push(buildQueryFromObject(entry));
    }
    videoData.OrchestrationResult = debugList.join(',');
  }

  // --- HLS formats -------------------------------------------------------
  const hlsFormats = streamData.hlsFormats; // was: r (reused)
  if (hlsFormats) {
    const audioPairing = {}; // was: K (reused)
    if (pairingCfg) {
      const pairs = pairingCfg.audioPairingConfig?.pairs; // was: W (reused)
      if (pairs) {
        for (const pair of pairs) { // was: U
          const vItag = pair.videoItag; // was: W (reused)
          audioPairing[vItag] || (audioPairing[vItag] = []);
          audioPairing[vItag].push(pair.audioItag);
        }
      }
    }

    const bitrateMap = {}; // was: U (reused)
    for (const fmt of hlsFormats) bitrateMap[fmt.itag] = fmt.bitrate; // was: I

    const hlsEntries = []; // was: I (reused)
    for (const fmt of hlsFormats) { // was: X
      const entry = { // was: W (reused)
        itag: fmt.itag,
        type: fmt.mimeType,
        url: fmt.url,
        bitrate: fmt.bitrate,
        width: fmt.width,
        height: fmt.height,
        fps: fmt.fps,
      };

      const audioTrack = fmt.audioTrack; // was: r (reused)
      if (audioTrack) {
        const displayName = audioTrack.displayName; // was: m (reused)
        if (displayName) {
          entry.name = displayName;
          entry.audio_track_id = audioTrack.id;
          audioTrack.audioIsDefault && (entry.is_default = '1');
        }
      }

      if (fmt.drmFamilies) {
        const families = []; // was: r (reused)
        for (const family of fmt.drmFamilies) families.push(xM[family]); // was: A
        entry.drm_families = families.join(',');
      }

      const pairedAudio = audioPairing[fmt.itag]; // was: r (reused)
      if (pairedAudio && pairedAudio.length) {
        entry.audio_itag = pairedAudio.join(',');
        const pairedBr = bitrateMap[pairedAudio[0]]; // was: r (reused)
        pairedBr && (entry.bitrate += pairedBr);
      }

      const eotf = getTransferCharacteristics(fmt); // was: r (reused)
      eotf && (entry.eotf = eotf);
      fmt.audioChannels && (entry.audio_channels = fmt.audioChannels);
      hlsEntries.push(buildQueryFromObject(entry));
    }
    videoData.hlsFormats = hlsEntries.join(',');
  }

  // --- License info (DRM) -----------------------------------------------
  const licenseInfos = streamData.licenseInfos; // was: A (reused)
  if (licenseInfos && licenseInfos.length > 0) {
    const cpMap = {}; // was: X (reused)
    for (const info of licenseInfos) { // was: e
      const family = info.drmFamily; // was: A (reused)
      const url = info.url; // was: K
      family && url && (cpMap[xM[family]] = url);
    }
    videoData.contentProtection = cpMap;
  }

  // --- DRM params --------------------------------------------------------
  const drmParams = streamData.drmParams; // was: e (reused)
  if (drmParams) videoData.drmParams = drmParams;

  // --- DASH manifest URL -------------------------------------------------
  const dashUrl = streamData.dashManifestUrl; // was: e (reused)
  if (dashUrl) {
    videoData.fetchInitSegmentIfNeeded = appendParamsToUrl(dashUrl, { cpn: videoData.clientPlaybackNonce });
  }

  // --- HLS manifest URL --------------------------------------------------
  const hlsUrl = streamData.hlsManifestUrl; // was: e (reused)
  if (hlsUrl) videoData.hlsvp = hlsUrl;

  // --- Probe URL ---------------------------------------------------------
  const probeUrl = streamData.probeUrl; // was: e (reused)
  if (probeUrl) {
    videoData.probeUrl = ensureProtocol(appendParamsToUrl(probeUrl, { cpn: videoData.clientPlaybackNonce }));
  }

  // --- SABR streaming URL ------------------------------------------------
  const sabrUrl = streamData.serverAbrStreamingUrl; // was: c (reused)
  if (sabrUrl) videoData.U2 = new g.lB(sabrUrl, true); // was: !0
}

// ============================================================================
// Video details parsing
// ============================================================================

/**
 * Parse video metadata from the videoDetails block (title, author, channel,
 * view count, live status, thumbnails, etc.).
 *
 * [was: vOx]
 *
 * @param {Object} videoData    [was: Q]
 * @param {Object} details      [was: c]
 * @param {Object} playerVars   [was: W]
 */
export function parseVideoDetails(videoData, details, playerVars) { // was: vOx
  const videoId = details.videoId; // was: m
  videoId && ((videoData.videoId = videoId), playerVars.video_id || (playerVars.video_id = videoId));

  const title = details.title;
  title && ((videoData.title = title), playerVars.title || (playerVars.title = title));

  const length = details.lengthSeconds;
  length && ((videoData.lengthSeconds = Number(length)), playerVars.length_seconds || (playerVars.length_seconds = length));

  const keywords = details.keywords;
  keywords && (videoData.keywords = parseKeywords(keywords));

  const channelId = details.channelId;
  channelId && ((videoData.nB = channelId), playerVars.ucid || (playerVars.ucid = channelId));

  const viewCount = details.viewCount;
  viewCount && (videoData.rawViewCount = Number(viewCount));

  const author = details.author;
  author && ((videoData.author = author), playerVars.author || (playerVars.author = author));

  const desc = details.shortDescription; // was: W (reused)
  desc && (videoData.shortDescription = desc);

  const crawlable = details.isCrawlable;
  crawlable && (videoData.isListed = crawlable);

  const musicType = details.musicVideoType;
  musicType && (videoData.musicVideoType = musicType);

  const isLive = details.isLive;
  isLive != null && (videoData.isLivePlayback = isLive);
  if (isLive || details.isUpcoming) videoData.isPremiere = !details.isLiveContent;

  const thumbnail = details.thumbnail;
  thumbnail && (videoData.EV = l4(thumbnail));

  const isPodcast = details.isExternallyHostedPodcast;
  isPodcast && (videoData.isExternallyHostedPodcast = isPodcast);

  const stationType = details.stationType;
  stationType && stationType !== 'STATION_TYPE_UNKNOWN' && (videoData.gb = true);

  const joinPos = details.viewerLivestreamJoinPosition;
  joinPos?.utcTimeMillis && (videoData.UB = ZQ(joinPos.utcTimeMillis));

  videoData.G().experiments.SG('enable_centered_caption_for_tvfilm_video') &&
    details.isTvfilmVideo != null &&
    (videoData.isTvfilmVideo = details.isTvfilmVideo);
}

/**
 * Parse keyword list into a key-value map.
 * Entries of the form "key=value" become { key: value };
 * bare entries map to { entry: true }.
 *
 * [was: ft3]
 *
 * @param {Array} keywordList [was: Q]
 * @returns {Object}
 */
export function parseKeywords(keywordList) { // was: ft3
  const result = {}; // was: c
  for (const word of keywordList) { // was: W
    const parts = word.split('='); // was: Q (reused)
    parts.length === 2 ? (result[parts[0]] = parts[1]) : (result[word] = true); // was: !0
  }
  return result;
}

// ============================================================================
// Player local volume storage (IndexedDB)
// ============================================================================

/**
 * Lazily initialize the player local volume storage singleton.
 * Removes the legacy localStorage key, then opens the scoped store.
 *
 * [was: C13]
 *
 * @returns {zay|undefined}
 */
function getLocalVolumeStore() { // was: C13
  if (c4 === undefined) { // was: void 0
    try {
      window.localStorage.removeItem('yt-player-lv');
    } catch (_e) {
      // ignore
    }
    try {
      const hasStorage = !!self.localStorage; // was: Q
      if (hasStorage) {
        const storeKey = getLocalStorage(`${getDatasyncId()}::yt-player`); // was: Q (reused)
        if (storeKey) {
          c4 = new zay(storeKey);
        } else {
          c4 = undefined;
        }
      } else {
        c4 = undefined;
      }
    } catch {
      c4 = undefined;
    }
  }
  return c4;
}

/**
 * Read the player local-volume map from storage.
 * Returns an empty object on error.
 *
 * [was: g.W4]
 *
 * @returns {Object}
 */
export function getLocalVolumeMap() { // was: g.W4
  const store = getLocalVolumeStore(); // was: Q
  if (!store) return {};
  try {
    const raw = store.get('yt-player-lv'); // was: c
    return JSON.parse(raw || '{}');
  } catch (_e) {
    return {};
  }
}

/**
 * Write the player local-volume map to storage.
 *
 * [was: g.MKn]
 *
 * @param {Object} map [was: Q]
 */
export function setLocalVolumeMap(map) { // was: g.MKn
  const store = getLocalVolumeStore(); // was: c
  store && store.set('yt-player-lv', JSON.stringify(map));
}

/**
 * Get a single volume entry. Returns 0 if not found.
 *
 * [was: g.mj]
 *
 * @param {string} key [was: Q]
 * @returns {number}
 */
export function getLocalVolume(key) { // was: g.mj
  return getLocalVolumeMap()[key] || 0;
}

/**
 * Set a single volume entry. Deletes the key when value is 0.
 *
 * [was: g.Kl]
 *
 * @param {string} key   [was: Q]
 * @param {number} value [was: c]
 */
export function setLocalVolume(key, value) { // was: g.Kl
  const map = getLocalVolumeMap(); // was: W
  if (value !== map[key]) {
    value !== 0 ? (map[key] = value) : delete map[key];
    setLocalVolumeMap(map);
  }
}

// ============================================================================
// Offline / WIAC media storage (IndexedDB)
// ============================================================================

/**
 * Open a player IndexedDB transaction.
 *
 * [was: g.T3]
 *
 * @param {*} db [was: Q]
 * @returns {Promise}
 */
export async function openPlayerIdbTransaction(EventHandler) { // was: g.T3
  return openWithToken(playerLocalMediaDbConfig(), EventHandler);
}

/**
 * Write a media segment and its index to IndexedDB for offline playback.
 * Returns the new download state (0..4).
 *
 * [was: rA]
 *
 * @param {string}  videoId     [was: Q]
 * @param {Object}  formatInfo  [was: c]
 * @param {Object}  formatMeta  [was: W]
 * @param {Object}  progress    [was: m]
 * @param {boolean} isMusic     [was: K]
 * @param {number}  [chunkIdx]  [was: T]
 * @param {*}       [chunkData] [was: r]
 * @param {*}       [crypto]    [was: U]
 * @returns {Promise<number>}
 */
export async function writeMediaChunk(videoId, formatInfo, formatMeta, progress, isMusic, chunkIdx, chunkData, crypto) {
  // was: rA
  if (getLocalVolume(videoId) === 4) return 4;

  const idb = await getIdbToken(); // was: I
  if (!idb) throw createIdbNotSupportedError('wiac');

  crypto && chunkData !== undefined && (chunkData = await Ram(crypto, chunkData)); // was: void 0

  const lastModified = formatMeta.lastModified || '0'; // was: X
  const dbHandle = await openPlayerIdbTransaction(idb); // was: U (reused)

  try {
    oI++;
    return await runTransaction(
      dbHandle,
      ['index', 'media'],
      { mode: 'readwrite', tag: 'IDB_TRANSACTION_TAG_WIAC', g3: true }, // was: !0
      (shouldUseDesktopControls) => { // was: A
        let mediaPut; // was: e
        if (chunkIdx !== undefined && chunkData !== undefined) { // was: void 0
          const key = `${videoId}|${formatInfo.id}|${lastModified}|${String(chunkIdx).padStart(10, '0')}`; // was: e
          mediaPut = shouldUseDesktopControls.objectStore('media').put(chunkData, key);
        } else {
          mediaPut = IdbPromise.resolve(undefined); // was: void 0
        }

        const indexKeyThis = buildIndexKey(videoId, formatInfo.MK()); // was: V
        const indexKeyOther = buildIndexKey(videoId, !formatInfo.MK()); // was: B
        const indexData = { // was: n
          fmts: onRawStateChange({
            dlt: progress.downloadedEndTime.toString(),
            mket: progress.maxKnownEndTime.toString(),
            avbr: progress.averageByteRate.toString(),
          }),
          format: formatMeta || {},
        };

        const indexPut = shouldUseDesktopControls.objectStore('index').put(indexData, indexKeyThis); // was: V (reused)
        const isComplete = progress.downloadedEndTime === -1; // was: S
        const otherGet = isComplete ? shouldUseDesktopControls.objectStore('index').get(indexKeyOther) : IdbPromise.resolve(undefined);
        const musicEntry = { fmts: 'music', format: {} }; // was: d
        const musicPut = isComplete && isMusic && !formatInfo.MK()
          ? shouldUseDesktopControls.objectStore('index').put(musicEntry, indexKeyOther)
          : IdbPromise.resolve(undefined); // was: A (reused)

        return IdbPromise.all([musicPut, otherGet, mediaPut, indexPut]).then(
          ([, otherData]) => { // was: b
            oI--;
            let state = getLocalVolume(videoId); // was: w
            if ((state !== 4 && isComplete && isMusic) || (otherData !== undefined && isDownloadComplete(otherData.fmts))) {
              state = 1;
              setLocalVolume(videoId, state);
            }
            return state;
          }
        );
      }
    );
  } catch (err) { // was: A
    oI--;
    const state = getLocalVolume(videoId); // was: U (reused)
    if (state === 4) return state;
    setLocalVolume(videoId, 4);
    throw err;
  }
}

/**
 * Read all format indices for a given video ID from IDB.
 *
 * [was: g.pIx]
 *
 * @param {string} videoId [was: Q]
 * @returns {Promise<Array>}
 */
export async function readMediaIndices(videoId) { // was: g.pIx
  const idb = await getIdbToken(); // was: c
  if (!idb) throw createIdbNotSupportedError('ri');

  const dbHandle = await openPlayerIdbTransaction(idb);
  return runTransaction(
    dbHandle,
    ['index'],
    { mode: 'readonly', tag: 'IDB_TRANSACTION_TAG_LMRI' },
    (shouldUseDesktopControls) => { // was: W
      const range = IDBKeyRange.bound(videoId + '|', videoId + '~'); // was: m
      return shouldUseDesktopControls
        .objectStore('index')
        .getAll(range)
        .then((rows) => rows.map((row) => (row ? row.format : {}))); // was: K, T
    }
  );
}

/**
 * Read a single media chunk from IDB.
 *
 * [was: cIn]
 *
 * @param {string} videoId    [was: Q]
 * @param {string} formatId   [was: c]
 * @param {string} lmt        [was: W]
 * @param {number} chunkIndex [was: m]
 * @param {*}      [crypto]   [was: K]
 * @returns {Promise}
 */
export async function readMediaChunk(videoId, formatId, lmt, chunkIndex, crypto) { // was: cIn
  const idb = await getIdbToken(); // was: T
  if (!idb) throw createIdbNotSupportedError('rc');

  const result = runTransaction(
    await openPlayerIdbTransaction(idb),
    ['media'],
    { mode: 'readonly', tag: 'IDB_TRANSACTION_TAG_LMRM' },
    (shouldUseDesktopControls) => { // was: r
      const key = `${videoId}|${formatId}|${lmt}|${String(chunkIndex).padStart(10, '0')}`; // was: U
      return shouldUseDesktopControls.objectStore('media').get(key);
    }
  );

  return crypto
    ? result
        .then((data) => { // was: r
          if (data === undefined) throw Error('No data from indexDb'); // was: void 0
          return QeX(crypto, data);
        })
        .catch((err) => { // was: r
          throw new PlayerError(`Error while reading chunk: ${err.name}, ${err.message}`);
        })
    : result;
}

/**
 * Check whether a download-state string indicates music-only content.
 *
 * [was: g.Y53]
 *
 * @param {string} fmts [was: Q]
 * @returns {boolean}
 */
export function isDownloadComplete(fmts) { // was: g.Y53
  return fmts
    ? fmts === 'music'
      ? true  // was: !0
      : fmts.includes('dlt=-1') || !fmts.includes('dlt=')
    : false; // was: !1
}

/**
 * Build an IDB index key for a video-id + track-type (video vs audio).
 *
 * [was: kA0]
 *
 * @param {string}  videoId  [was: Q]
 * @param {boolean} isVideo  [was: c]
 * @returns {string}
 */
export function buildIndexKey(videoId, isVideo) { // was: kA0
  return `${videoId}|${isVideo ? 'v' : 'a'}`;
}

// ============================================================================
// Media key range encoding
// ============================================================================

/**
 * Compress a list of `videoId|formatId|lmt|chunkIndex` keys into a map of
 * `videoId|formatId|lmt` -> "rangeStart-rangeEnd,..." strings.
 *
 * [was: mPx]
 *
 * @param {Array} keys [was: Q]
 * @returns {Object}
 */
export function compressMediaKeyRanges(keys) { // was: mPx
  const ranges = {}; // was: c
  const unknown = {}; // was: W

  for (const key of keys) { // was: T
    const parts = key.split('|'); // was: m
    if (!key.match(MEDIA_KEY_REGEX)) {
      unknown[key] = '?';
      continue;
    }
    const chunkIndex = Number(parts.pop()); // was: Q (reused)
    if (isNaN(chunkIndex)) {
      unknown[key] = '?';
      continue;
    }
    const prefix = parts.join('|'); // was: K
    const existing = ranges[prefix]; // was: m (reused)
    if (existing) {
      const lastRange = existing[existing.length - 1]; // was: K (reused)
      chunkIndex === lastRange.end + 1
        ? (lastRange.end = chunkIndex)
        : existing.push({ start: chunkIndex, end: chunkIndex });
    } else {
      ranges[prefix] = [{ start: chunkIndex, end: chunkIndex }];
    }
  }

  for (const prefix of Object.keys(ranges)) { // was: T
    unknown[prefix] = ranges[prefix].map((r) => `${r.start}-${r.end}`).join(',');
  }

  return unknown;
}
