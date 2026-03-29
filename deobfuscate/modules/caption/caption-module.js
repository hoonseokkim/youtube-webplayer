/**
 * Caption Module — Main module class for the "captions" satellite module.
 *
 * Source: player_es6.vflset/en_US/caption.js, lines 3724–4288
 * Registered via g.GN("captions", ...) at line 3724.
 *
 * [was: anonymous class passed to g.GN("captions", ...)]
 */

import { onCueRangeEnter, onCueRangeExit } from '../../ads/dai-cue-range.js';  // was: g.onCueRangeEnter, g.onCueRangeExit
import { getConfig } from '../../core/composition-helpers.js';  // was: g.v
import { onVideoDataChange } from '../../player/player-events.js';  // was: g.Qq
import { getTrackById } from './caption-helpers.js';  // was: g.aYD
import { addCueToWindow, ensureRendererForWindow, handleTrackOption, isForcedTrackActive, isSabrLiveCaptions, setNativeTrackMode, showSampleSubtitles, updateVssLogging } from './caption-internals.js';  // was: g.MyD, g.CF9, g.YVa, g.Cy, g.EHi, g.uvo, g.u9, g.py
import { getCaptionsInitialState, getStoredDisplaySettings } from './caption-settings.js';  // was: g.tu, g.NC
import { createTranslatedTrack } from './caption-track-list.js';  // was: g.sUa
import { TrackState } from '../../media/playback-controller.js'; // was: h_D
import { createDatabaseDefinition } from '../../data/idb-transactions.js'; // was: el
import { SYM_BINARY } from '../../proto/message-setup.js'; // was: by
import { toOnEventName } from '../../core/composition-helpers.js'; // was: gm
import { FormatInfo } from '../../media/codec-tables.js'; // was: OU
import { remove, splice, clear, filter, concat } from '../../core/array-utils.js';
import { EventHandler } from '../../core/event-handler.js';
import { Timer } from '../../core/timer.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { createElement, appendChild } from '../../core/dom-utils.js';
import { toString } from '../../core/string-utils.js';
import { isSubtitlesOn, getCaptionWindowContainerId } from '../../player/player-api.js';
import { registerModule } from '../../player/module-registry.js';

// ── Default caption display parameters ──────────────────────────────
// [was: PA] — Source lines 3705–3723
const DEFAULT_CAPTION_PARAMS = {
  windowColor: '#080808',
  windowOpacity: 0,
  textAlign: 2,
  anchorPoint: 7, // was: bW
  horizontalAnchor: 50, // was: kc
  verticalAnchor: 100, // was: ZB
  isDefault: true,
  textStyle: { // was: T1
    background: '#080808',
    backgroundOpacity: 0.75,
    charEdgeStyle: 0,
    color: '#fff',
    fontFamily: 4,
    fontSizeIncrement: 0,
    textOpacity: 1,
    offset: 1,
  },
};

// ── Helper: apply user display settings to module state ─────────────
// [was: l9] — Source lines 1264–1332
function applyDisplaySettings(module, userSettings, persist = false) {
  const defaultTextStyle = DEFAULT_CAPTION_PARAMS.textStyle;
  module.baseParams = {}; // was: K
  Object.assign(module.baseParams, DEFAULT_CAPTION_PARAMS);
  module.baseParams.textStyle = {};
  Object.assign(module.baseParams.textStyle, defaultTextStyle);
  module.overrideParams = { textStyle: {} }; // was: D

  // Apply each setting, routing it to either base or override bucket
  let target = userSettings.backgroundOverride ? module.overrideParams : module.baseParams;
  let value = userSettings.background || defaultTextStyle.background;
  target.textStyle.background = value;

  target = userSettings.colorOverride ? module.overrideParams : module.baseParams;
  value = userSettings.color || defaultTextStyle.color;
  target.textStyle.color = value;

  target = userSettings.windowColorOverride ? module.overrideParams : module.baseParams;
  value = userSettings.windowColor || DEFAULT_CAPTION_PARAMS.windowColor;
  target.windowColor = value;

  target = userSettings.backgroundOpacityOverride ? module.overrideParams : module.baseParams;
  value = userSettings.backgroundOpacity;
  if (value == null) value = defaultTextStyle.backgroundOpacity;
  target.textStyle.backgroundOpacity = value;

  target = userSettings.fontSizeIncrementOverride ? module.overrideParams : module.baseParams;
  value = userSettings.fontSizeIncrement;
  if (value == null) value = defaultTextStyle.fontSizeIncrement;
  target.textStyle.fontSizeIncrement = value;

  const fontStyleTarget = (userSettings.fontStyleOverride ? module.overrideParams : module.baseParams).textStyle;
  let fontStyle = userSettings.fontStyle;
  if (fontStyle == null) {
    fontStyle = defaultTextStyle.bold && defaultTextStyle.italic ? 3 : defaultTextStyle.bold ? 1 : defaultTextStyle.italic ? 2 : 0;
  }
  switch (fontStyle) {
    case 1: fontStyleTarget.bold = true; delete fontStyleTarget.italic; break;
    case 2: delete fontStyleTarget.bold; fontStyleTarget.italic = true; break;
    case 3: fontStyleTarget.bold = true; fontStyleTarget.italic = true; break;
    default: delete fontStyleTarget.bold; delete fontStyleTarget.italic;
  }

  target = userSettings.textOpacityOverride ? module.overrideParams : module.baseParams;
  value = userSettings.textOpacity;
  if (value == null) value = defaultTextStyle.textOpacity;
  target.textStyle.textOpacity = value;

  target = userSettings.windowOpacityOverride ? module.overrideParams : module.baseParams;
  value = userSettings.windowOpacity;
  if (value == null) value = DEFAULT_CAPTION_PARAMS.windowOpacity;
  target.windowOpacity = value;

  target = userSettings.charEdgeStyleOverride ? module.overrideParams : module.baseParams;
  value = userSettings.charEdgeStyle;
  if (value == null) value = defaultTextStyle.charEdgeStyle;
  target.textStyle.charEdgeStyle = value;

  target = userSettings.fontFamilyOverride ? module.overrideParams : module.baseParams;
  value = userSettings.fontFamily;
  if (value == null) value = defaultTextStyle.fontFamily;
  target.textStyle.fontFamily = value;

  if (module.loaded) module.refreshWindows(); // was: Fw
  if (persist) {
    setStoredPreference('yt-player-caption-display-settings', userSettings, 2592000); // 30 days
  }
}

// ── Helper: get stored display settings from local storage ──────────
// [was: NC] — Source line 65–67
function getStoredDisplaySettings() {
  return getStoredPreference('yt-player-caption-display-settings');
}

// ── Helper: should use native text tracks ───────────────────────────
// [was: Gs4] — Source lines 1260–1263
function shouldUseNativeTextTracks(module) { // was: Gs4
  const hasTextTracks = !!module.playerApi.getMediaElement()?.hasTextTracks(); // was: T2
  return (module.sourceType === 'HLS' && hasTextTracks)
    ? true
    : module.isExternalControls && hasTextTracks && module.sourceType !== 'LIVE' && module.sourceType !== 'SABR_LIVE';
}

// ── Helper: determine whether captions should be on ─────────────────
// [was: lcZ] — Source lines 1356–1385
function shouldEnableCaptions(module) { // was: lcZ
  if (module.config.captionsAutoToggle === 1 || module.videoData.captionsMode === 1 || module.videoData.getMetadataTag('yt:cc') === 'alwayson') {
    return true;
  }
  let audioTrackSubtype;
  if (module.videoData.captionTracks.length) {
    audioTrackSubtype = module.getAudioTrack().subtype; // was: O
  }
  if (module.config.captionsAutoToggle === 2) {
    let stored;
    if (isFeatureEnabled(module.config)) {
      stored = module.config.experimentEnabled('enable_player_captions_persistence_state_machine')
        ? getStoredPreference('yt-player-caption-persistence')
        : getStickyCaption(module); // was: PFi
    } else if (module.storage) {
      try { stored = module.storage.get('module-enabled'); } catch (_) { module.storage.remove('module-enabled'); }
    } else {
      stored = null;
    }
    if (stored != null) return !!stored;
  }

  const initialState = getCaptionsInitialState(module.player.getAudioTrack(), isFeatureEnabled(module.config));
  const ccMeta = module.videoData.getMetadataTag('yt:cc');
  const stickyPref = checkStickyPreference(module); // was: hu

  if (stickyPref === undefined) {
    if (initialState === 'CAPTIONS_INITIAL_STATE_ON_RECOMMENDED') return ccMeta ? ccMeta === 'on' : true;
    if (initialState === 'CAPTIONS_INITIAL_STATE_OFF_RECOMMENDED') return ccMeta === 'on';
  } else {
    return ccMeta === 'on';
  }
  return audioTrackSubtype === 'ON' || ccMeta === 'on';
}

// ── Helper: check for sticky preference ─────────────────────────────
// [was: hu] — Source lines 1346–1355
function checkStickyPreference(module) { // was: hu
  let result = undefined;
  const experimentValue = module.playerApi.getExperiments().getIntValue(65); // was: BA(65)
  if (isFeatureEnabled(module.config) && experimentValue != null) {
    if (getStickyCaption(module) != null) return false;
    result = !experimentValue;
  }
  return result;
}

// [was: PFi] — Source lines 1342–1345
function getStickyCaption(module) {
  if (!module.playerApi.isInline()) {
    return getStoredPreference('yt-player-sticky-caption');
  }
}

// ── Helper: check for forced caption tracks ─────────────────────────
// [was: zl] — Source lines 1386–1391
function hasForcedTrack(module, includeDisabled = false) { // was: zl
  if (module.activeTrack && !includeDisabled || !module.videoData.captionTracks.length) return false;
  const audioTrack = module.getAudioTrack();
  return !!audioTrack.forcedTrack || audioTrack.subtype === 'FORCED_ON'; // was: W, O
}

// ── Helper: get the forced/generated caption track ──────────────────
// [was: MC] — Source lines 1416–1418
function getForcedTrack(module) { // was: MC
  return module.audioTrackState && module.audioTrackState.forcedTrack; // was: Y.W
}

// ── Helper: resolve the best caption track to use ───────────────────
// [was: Ju] — Source lines 1419–1462
function resolvePreferredTrack(module, includeAsr) { // was: Ju
  if (!module.trackProvider) return null;
  if (module.audioTrackState && module.audioTrackState.resolvedTrack) { // was: Y.j
    return module.audioTrackState.resolvedTrack;
  }
  const allTracks = filterTracks(module.trackProvider.tracks, includeAsr); // was: g.H6
  let match = null;

  if (module.config.experimentEnabled('web_enable_caption_language_preference_stickiness')) { // was: dSm
    const stickyLang = module.playerApi.isInline() ? undefined : getStoredPreference('yt-player-caption-sticky-language');
    const langPreferences = [
      stickyLang,
      module.videoData.captionsLanguagePreference,
      module.config.captionsLanguagePreference,
      module.videoData.getMetadataTag('yt:cc_default_lang'),
    ];
    let hasPreference = false;
    for (const pref of langPreferences) {
      if (pref) {
        hasPreference = true;
        for (const track of allTracks) {
          if (getLanguageCode(track) === pref) return track;
        }
        for (const track of allTracks) {
          if (getLanguageCode(track).split('-')[0] === pref.split('-')[0]) return track;
        }
      }
    }
    if (hasPreference && module.trackProvider) {
      const translationLanguages = module.trackProvider.translationLanguages; // was: Y
      if (translationLanguages.length) {
        for (const lang of translationLanguages) {
          if (lang.languageCode === stickyLang) { match = lang; break; }
        }
      }
    }
  } else {
    const prefs = [module.videoData.captionsLanguagePreference, module.config.captionsLanguagePreference, module.videoData.getMetadataTag('yt:cc_default_lang')];
    for (const pref of prefs) {
      for (const track of allTracks) {
        if (getLanguageCode(track) === pref) return track;
      }
    }
  }

  let result = null;
  if (module.audioTrackState && module.audioTrackState.defaultTrack) { // was: Y.A
    result = module.audioTrackState.defaultTrack;
  }
  if (!result) result = allTracks.find(t => t.isDefault) || null;
  if (!result) result = allTracks[0] || getForcedTrack(module);
  if (result && match && getLanguageCode(result).split('-')[0] !== match.languageCode.split('-')[0]) {
    result = createTranslatedTrack(result, match);
  }
  return result;
}

// ── Helper: set the active caption track ────────────────────────────
// [was: QY] — Source lines 1463–1472
function setActiveTrack(module, track, isUserAction) { // was: QY
  if (module.loaded) module.unload();
  if (isUserAction != null) {
    module.isManualSwitch = isUserAction; // was: J
    if (module.isManualSwitch) {
      if (module.config.experimentEnabled('enable_player_captions_persistence_state_machine')) {
        persistCaptionEnabled(module, !!track);
      } else if (isFeatureEnabled(module.config)) {
        persistStickyCaption(module, !!track);
      } else {
        persistModuleEnabled(module, !!track);
      }
    }
  }
  if (track !== null || hasForcedTrack(module, true) || module.reportCaptionState(track, !!track, module.isManualSwitch ? 'm' : 's'));
  module.activeTrack = track; // was: O
  if (hasForcedTrack(module)) module.activeTrack = getForcedTrack(module);
  module.updateVssLogging(module.activeTrack ?? undefined); // was: py
  module.load();
}

// [was: Rf] — Source line 1473–1475
function persistCaptionEnabled(module, enabled) {
  if (module.config.experimentEnabled('enable_player_captions_persistence_state_machine')) {
    setStoredPreference('yt-player-caption-persistence', enabled, 3122064000);
  }
}

// [was: kX] — Source lines 1476–1478
function persistStickyCaption(module, enabled) {
  if (!module.playerApi.isInline()) {
    setStoredPreference('yt-player-sticky-caption', enabled, 2592000);
  }
}

// [was: YX] — Source lines 1479–1484
function persistModuleEnabled(module, enabled) {
  if (module.storage) {
    try { module.storage.set('module-enabled', enabled); } catch (_) {}
  }
}

// ── Helper: ensure timer is running ─────────────────────────────────
// [was: DG] — Source lines 7–9
function ensureTimerActive(timer) { // was: DG
  if (!timer.isActive()) timer.start();
}

// ── Helper: remove cue events from player ───────────────────────────
// [was: $ya] — Source lines 1531–1536
function removeCaptionCues(module, cues) { // was: $ya
  module.player.removeCueRanges(cues); // was: bc
  for (const cue of cues) {
    module.activeCues.splice(module.activeCues.indexOf(cue), 1); // was: g.o0(Q.MM, W)
  }
  ensureTimerActive(module.renderTimer); // was: Ka
}

// ══════════════════════════════════════════════════════════════════════
// CaptionModule — the main class registered with g.GN("captions", ...)
// [was: anonymous class] — Source lines 3724–4286
// ══════════════════════════════════════════════════════════════════════
class CaptionModule extends ModuleBase {
  /**
   * @param {Object} playerApi [was: Q] — player interface
   */
  constructor(playerApi) {
    super(playerApi);

    /** @type {Object} [was: U] — player API reference */
    this.playerApi = playerApi;

    /** @type {Array} [was: MM] — active caption cue ranges currently displayed */
    this.activeCues = [];

    /** @type {Object.<string, CaptionRenderer>} [was: b0] — map of window-id to renderer */
    this.renderers = {};

    /** @type {Object.<string, Array>} [was: UH] — map of window-id to pending cue events */
    this.pendingWindowCues = {};

    /** @type {boolean} [was: J] — whether the last track change was user-initiated */
    this.isManualSwitch = false;

    /** @type {string} [was: A] — source type for captions */
    this.sourceType = 'NONE';

    /** @type {?Object} [was: La] — settings icon element (for tooltip) */
    this.settingsIcon = null;

    /** @type {?Array} [was: PA] — tooltip cue data */
    this.tooltipCues = null;

    /** @type {?Array} [was: mF] — sample subtitle cue data (for preview) */
    this.sampleCues = null;

    /** @type {?Object} [was: Y] — audio-track state snapshot */
    this.audioTrackState = null;

    /** @type {?Object} [was: W] — track provider (CaptionTrackProvider) */
    this.trackProvider = null;

    /** @type {Object} [was: EC] — callbacks supplied to track providers */
    this.providerCallbacks = {
      onTracksReady: () => { this.onTracksReady(); }, // was: Kw
      onTrackDataReceived: (data, track, startTimeMs, chunkDurationMs, contentLength = 0) => { // was: Zn
        const dropCapThreshold = Number(this.videoData.getExperiments().getIntValue(/* g.Jc7 */) ?? 0);
        if (contentLength > 0 && dropCapThreshold > 0 && this.videoData.lengthSeconds > 0 && contentLength / this.videoData.lengthSeconds > dropCapThreshold) {
          this.playerApi.logTelemetry('tts', { dropcap: contentLength }); // was: tJ
        } else {
          this.onTrackDataReceived(data, track, startTimeMs, chunkDurationMs);
        }
      },
    };

    /** @type {?CaptionTrack} [was: O] — currently active caption track */
    this.activeTrack = null;

    /** @type {Object} [was: FI] — player config */
    this.config = this.playerApi.getConfig(); // was: G()

    /** @type {Object} [was: videoData] */
    this.videoData = this.playerApi.getVideoData();

    /** @type {Object} [was: Re] — video rect provider */
    this.videoRectProvider = this.playerApi.getVideoContentRectProvider(); // was: bX()

    /** @type {Object} [was: K] — base display parameters */
    this.baseParams = { textStyle: {} };

    /** @type {Object} [was: D] — override display parameters */
    this.overrideParams = { textStyle: {} };

    // ── Determine caption source type (lines 3756) ──────────────────
    if (this.videoData.isOffline()) { // was: MQ
      this.sourceType = 'OFFLINE';
    } else if (this.videoData.isHlsCaptions(this.playerApi)) { // was: g.Cr7
      this.sourceType = 'HLS';
    } else if (this.videoData.isSabrLiveCaptions(this.playerApi)) { // was: EHi
      this.sourceType = 'SABR_LIVE';
    } else if (this.videoData.isLiveCaptions(this.playerApi)) { // was: g.MJX
      this.sourceType = 'LIVE';
    } else if (this.videoData.captionTracks.length) {
      this.sourceType = 'INNERTUBE';
    } else if (this.videoData.timedTextServiceUrl) { // was: sC
      this.sourceType = 'TTS';
    }

    /** @type {boolean} [was: XI] — external controls mode (e.g. Chromecast) */
    this.isExternalControls = this.config.controlsType === '3';

    /** @type {Object} [was: HA] — track data parser */
    this.trackParser = new CaptionTrackParser(this.playerApi, this.config); // was: yom

    /** @type {Object} [was: T2] — event listeners manager */
    this.listeners = new EventHandler(this);

    /** @type {Component} [was: L] — the caption window container element */
    this.windowContainer = new Component({
      tagName: 'div', // was: C
      className: 'ytp-caption-window-container', // was: Z
      attributes: { id: 'ytp-caption-window-container' }, // was: N
    });

    /** @type {Object} [was: S] — caption positioning insets */
    this.captionInsets = { top: 0, right: 0, bottom: 0, left: 0, width: 1, height: 1 };

    // Storage for persistence (lines 3775–3778)
    let storage = null;
    const storedModuleData = getStoredPreference('yt-html5-player-modules::subtitlesModuleData'); // was: g.Ku
    if (storedModuleData) storage = new StorageWrapper(storedModuleData); // was: g.P7
    /** @type {?Object} [was: storage] */
    this.storage = storage;

    /** @type {boolean} [was: Y0] — media element supports text track listeners */
    this.supportsTextTrackListeners = !!playerApi.getMediaElement()?.supportsTextTrackListeners(); // was: Ie

    /** @type {boolean} [was: j] — whether to use native text tracks */
    this.useNativeTracks = shouldUseNativeTextTracks(this);

    /** @type {boolean} [was: Ie] — whether to use native tracks for live */
    this.useNativeLiveTracks = !this.useNativeTracks && this.isExternalControls && this.supportsTextTrackListeners && (this.sourceType === 'LIVE' || this.sourceType === 'SABR_LIVE');

    disposable(this, this.trackParser);

    // Render timer and delayed-display timer
    if (this.useNativeTracks) {
      /** @type {?Timer} [was: Ka] */
      this.renderTimer = null;
      /** @type {?DelayedTimer} [was: jG] */
      this.tooltipTimer = null;
    } else {
      this.renderTimer = new Timer(this.renderCaptions, undefined, this); // was: T5
      disposable(this, this.renderTimer);
      this.tooltipTimer = new DelayedTimer(this.dismissTooltip, 2000, this); // was: Uc
      disposable(this, this.tooltipTimer);
    }

    disposable(this, this.listeners);
    attachToPlayer(this.player, this.windowContainer.element, 4);
    disposable(this, this.windowContainer);

    if (!this.useNativeTracks) this.listeners.bindEvent(playerApi, 'resize', this.refreshWindows);

    /** @type {boolean} [was: WB] — should track fullscreen resize */
    this.trackFullscreenResize = false; // simplified from original
    if (this.trackFullscreenResize) this.listeners.bindEvent(playerApi, 'resize', this.onFullscreenToggle);

    this.listeners.bindEvent(playerApi, 'onPlaybackAudioChange', this.onAudioTrackChange);
    this.listeners.bindEvent(playerApi, cueRangeEnterKey('captions'), (cue) => this.onCueRangeEnter(cue));
    this.listeners.bindEvent(playerApi, cueRangeExitKey('captions'), (cue) => this.onCueRangeExit(cue));

    // Apply stored display settings
    applyDisplaySettings(this, getStoredDisplaySettings() || {});

    fireEvent(this.player, 'onCaptionsModuleAvailable');

    // HLS native track discovery
    if (this.sourceType === 'HLS' && this.useNativeTracks) {
      const mediaEl = this.playerApi.getMediaElement().getNativeElement(); // was: Ae
      if (this.supportsTextTrackListeners) {
        this.listeners.bindEvent(mediaEl.textTracks, 'addtrack', this.onNativeTrackAdded); // was: qQ
      }
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────

  /** @override [was: WA] — dispose */
  dispose() {
    if (this.useNativeTracks || this.useNativeLiveTracks) {
      const mediaEl = this.playerApi.getMediaElement();
      if (mediaEl && !mediaEl.isDisposed()) mediaEl.removeAllTrackElements(); // was: J
    } else {
      this.showSampleSubtitles(false); // was: u9(this, false)
    }
    super.dispose();
  }

  /** [was: h1] — should honor caption availabilities per audio track */
  shouldHonorAvailabilities() {
    return this.config.experimentEnabled('html5_honor_caption_availabilities_in_audio_track') && this.sourceType !== 'LIVE' && this.sourceType !== 'SABR_LIVE';
  }

  /**
   * [was: B1] — determines if caption module should be loaded/active.
   * @returns {boolean}
   */
  shouldBeActive() {
    if (this.isExternalControls) return this.useNativeTracks || this.useNativeLiveTracks;
    if (this.sourceType === 'HLS') return this.useNativeTracks;

    const audioTrack = this.getAudioTrack();
    if (this.shouldHonorAvailabilities()) {
      if (!audioTrack.captionTracks.length) return false;
      if (!this.trackProvider) return true;
    }

    const initialState = getCaptionsInitialState(audioTrack, isFeatureEnabled(this.config));
    if (initialState === 'CAPTIONS_INITIAL_STATE_ON_REQUIRED') return true;
    if (initialState === 'CAPTIONS_INITIAL_STATE_OFF_REQUIRED') return hasForcedTrack(this);
    return checkStickyPreference(this) || hasForcedTrack(this) ? true : shouldEnableCaptions(this);
  }

  /** @override [was: load] — load captions for the current track */
  load() {
    super.load();
    this.audioTrackState = this.getAudioTrack();

    if (this.trackProvider) {
      if (this.activeTrack) {
        this.trackParser.clear();
        if (this.useNativeTracks) {
          this.setNativeTrackMode(true); // was: uvo(this, true)
        } else if (this.player.getPresentingPlayerType() !== 3) {
          this.trackProvider.fetchTrack(this.activeTrack, 'json3', this.providerCallbacks); // was: j
        }
        if ((this.sourceType !== 'HLS' && this.useNativeTracks) || this.useNativeLiveTracks || this.isForcedTrackActive()) {
          // skip external notification
        } else {
          fireEvent(this.player, 'captionschanged', serializeTrack(this.activeTrack));
        }
      }
    } else {
      // First load — create the appropriate track provider
      let provider;
      switch (this.sourceType) {
        case 'OFFLINE': /* OfflineCaptionProvider */; break;
        case 'SABR_LIVE': /* SabrLiveCaptionProvider */; break;
        case 'HLS': /* HlsCaptionProvider */; break;
        case 'LIVE': /* LiveCaptionProvider */; break;
        case 'INNERTUBE': /* InnerTubeCaptionProvider */; break;
        default: /* TtsCaptionProvider */; break;
      }
      this.trackProvider = provider;
      disposable(this, this.trackProvider);
      this.trackProvider.discoverTracks(this.providerCallbacks); // was: K(this.EC)
    }
  }

  /** @override [was: unload] */
  unload() {
    if (this.useNativeTracks && this.activeTrack) {
      this.setNativeTrackMode(false);
    } else {
      if (this.tooltipTimer) this.tooltipTimer.stop(); // was: fB
      this.player.removeCueRangesByNamespace('captions'); // was: qI
      this.activeCues = [];
      if (this.trackProvider) this.trackProvider.cancelFetch(); // was: A
      this.trackParser.clear();
      if (this.sampleCues) this.player.addCueRanges(this.sampleCues); // was: mV
      this.refreshWindows();
    }
    super.unload();
    this.player.onCaptionsModuleStateChange(); // was: FP
    fireEvent(this.player, 'captionschanged', {});
  }

  /** @override [was: create] — called once when module is first needed */
  create() {
    if (this.shouldBeActive()) this.load();
    // (promo tooltip logic omitted for brevity)
  }

  // ── Track list / selection ─────────────────────────────────────────

  /** [was: Kw] — called when track provider finishes discovering tracks */
  onTracksReady() {
    const initialState = getCaptionsInitialState(this.player.getAudioTrack(), isFeatureEnabled(this.config));
    let track;
    if (initialState === 'CAPTIONS_INITIAL_STATE_ON_REQUIRED') {
      track = resolvePreferredTrack(this, this.isManualSwitch);
    } else if (initialState === 'CAPTIONS_INITIAL_STATE_OFF_REQUIRED' && hasForcedTrack(this)) {
      track = getForcedTrack(this);
    } else if (checkStickyPreference(this) || this.isManualSwitch || shouldEnableCaptions(this)) {
      track = resolvePreferredTrack(this, this.isManualSwitch);
    } else if (hasForcedTrack(this)) {
      track = getForcedTrack(this);
    } else {
      track = null;
    }

    if ((this.sourceType !== 'HLS' && this.useNativeTracks) || this.useNativeLiveTracks) {
      // Build <track> elements for native playback
      const allTracks = filterTracks(this.trackProvider.tracks, true);
      const trackElements = allTracks.map((t) => {
        const createDatabaseDefinition = document.createElement('TRACK');
        createDatabaseDefinition.setAttribute('kind', 'subtitles');
        createDatabaseDefinition.setAttribute('label', getTrackDisplayName(t));
        createDatabaseDefinition.setAttribute('srclang', getLanguageCode(t));
        createDatabaseDefinition.setAttribute('id', t.toString());
        if (!this.useNativeLiveTracks) createDatabaseDefinition.setAttribute('src', this.trackProvider.getTrackUrl(t, 'vtt')); // was: D
        if (t === track) createDatabaseDefinition.setAttribute('default', '1');
        return createDatabaseDefinition;
      });
      const mediaEl = this.playerApi.getMediaElement();
      mediaEl.appendTrackElements(trackElements); // was: mF
      const nativeEl = mediaEl.getNativeElement();
      if (this.supportsTextTrackListeners) {
        this.listeners.bindEvent(nativeEl.textTracks, 'change', this.onNativeTrackChanged); // was: Xw
      }
    } else {
      if (!this.activeTrack && track) setActiveTrack(this, track);
      fireEvent(this.player, 'onCaptionsTrackListChanged');
      fireCallback(this.player, 'onApiChange'); // was: g.Ht
    }
  }

  /** [was: Xw] — native text track "change" event handler */
  onNativeTrackChanged() {
    const textTracks = this.playerApi.getMediaElement().getNativeElement().textTracks;
    let active = null;
    for (let i = 0; i < textTracks.length; i++) {
      if (textTracks[i].mode === 'showing') active = this.getTrackById(textTracks[i].id);
    }
    const current = this.loaded ? this.activeTrack : null;
    if (current !== active) setActiveTrack(this, active, true);
  }

  /** [was: getTrackById] — find a track by string id */
  getTrackById(id) {
    const allTracks = filterTracks(this.trackProvider.tracks, true);
    for (const track of allTracks) {
      if (track.toString() === id) return track;
    }
    return null;
  }

  // ── Cue range callbacks ────────────────────────────────────────────

  /** [was: onCueRangeEnter] — Source line 4048 */
  onCueRangeEnter(cue) {
    this.activeCues.push(cue);
    ensureTimerActive(this.renderTimer);
  }

  /** [was: onCueRangeExit] — Source line 4052 */
  onCueRangeExit(cue) {
    this.activeCues.splice(this.activeCues.indexOf(cue), 1);
    // If live track provider needs cleanup, remove old cue
    if (this.trackProvider?.isLiveProvider && this.trackProvider.isRawCC) {
      this.player.removeCueRanges([cue]);
    }
    ensureTimerActive(this.renderTimer);
  }

  // ── Caption data received ──────────────────────────────────────────

  /**
   * [was: Zn] — Called when raw caption data arrives from the track provider.
   * Parses and registers cue ranges with the player.
   * Source lines 3919–4046
   */
  onTrackDataReceived(data, trackMeta, startTimeMs, chunkDurationMs) {
    if (!data) return;
    this.updateVssLogging(this.activeTrack ?? undefined);
    if (this.trackProvider.hasNewData()) { // was: S
      this.activeCues = [];
      this.playerApi.removeCueRangesByNamespace('captions');
      ensureTimerActive(this.renderTimer);
      this.trackParser.reset();
    }

    const parsedCues = this.trackParser.parse(data, trackMeta, startTimeMs || 0, chunkDurationMs || 0);
    if (parsedCues.length > 0) {
      const track = this.activeTrack;
      this.reportCaptionState(track, !!track, this.isForcedTrackActive() ? 'g' : this.isManualSwitch ? 'm' : 's');
    }
    this.player.addCueRanges(parsedCues, undefined, this.sourceType === 'LIVE' || this.sourceType === 'SABR_LIVE'); // was: mV

    // Show one-time tooltip if manual switch and not inline
    if (this.isManualSwitch && !this.useNativeLiveTracks && !this.isForcedTrackActive()) {
      if (this.config.experimentEnabled('enable_player_captions_persistence_state_machine')) {
        persistCaptionEnabled(this, true);
      } else if (isFeatureEnabled(this.config)) {
        persistStickyCaption(this, true);
      } else {
        persistModuleEnabled(this, true);
      }
      if (this.audioTrackState) this.audioTrackState.resolvedTrack = this.activeTrack;
      this.player.onCaptionsModuleStateChange();
    }
    this.isManualSwitch = false;
  }

  // ── Rendering ──────────────────────────────────────────────────────

  /**
   * [was: iX] — Render timer callback: sorts active cues and hands them
   * to appropriate CaptionWindow renderers.
   * Source lines 4064–4091
   */
  renderCaptions() {
    if (this.trackFullscreenResize && this.useNativeTracks) return;
    this.renderTimer.stop();
    this.pendingWindowCues = {}; // was: g.lD
    this.activeCues.sort(/* SYM_BINARY priority */);

    const cues = this.sampleCues
      ? this.activeCues.filter((c) => this.sampleCues.indexOf(c) === -1)
      : this.activeCues;

    for (const cue of cues) {
      if (cue.isWindow) { // was: instanceof wE
        this.ensureRendererForWindow(cue); // was: CF9
      } else {
        this.addCueToWindow(cue); // was: MyD
      }
    }

    for (const [windowId, renderer] of Object.entries(this.renderers)) {
      if (this.pendingWindowCues[windowId]) {
        if (!renderer.element.parentNode) {
          this.windowContainer.element.appendChild(renderer.element);
        }
        renderer.updateContent(this.pendingWindowCues[windowId]); // was: L
      } else {
        renderer.dispose();
        delete this.renderers[windowId];
      }
    }
  }

  /** [was: Fw] — Refresh all caption windows (e.g. after resize) */
  refreshWindows() {
    if (!this.useNativeTracks && this.loaded) {
      for (const [id, renderer] of Object.entries(this.renderers)) {
        renderer.dispose();
        delete this.renderers[id];
      }
      this.renderCaptions();
    }
  }

  // ── Settings ───────────────────────────────────────────────────────

  /**
   * [was: Vb] — Reset caption display settings to defaults.
   * Source line 4093–4096
   */
  resetDisplaySettings() {
    applyDisplaySettings(this, {}, true);
    fireEvent(this.player, 'captionssettingschanged');
  }

  /**
   * [was: oi] — Returns the current effective display settings.
   * Source lines 4097–4133
   */
  getDisplaySettings() {
    const ts = DEFAULT_CAPTION_PARAMS.textStyle;
    const result = {
      background: ts.background,
      backgroundOpacity: ts.backgroundOpacity,
      charEdgeStyle: ts.charEdgeStyle,
      color: ts.color,
      fontFamily: ts.fontFamily,
      fontSizeIncrement: ts.fontSizeIncrement,
      fontStyle: ts.bold && ts.italic ? 3 : ts.bold ? 1 : ts.italic ? 2 : 0,
      textOpacity: ts.textOpacity,
      windowColor: DEFAULT_CAPTION_PARAMS.windowColor,
      windowOpacity: DEFAULT_CAPTION_PARAMS.windowOpacity,
    };
    const stored = getStoredDisplaySettings() || {};
    for (const key of Object.keys(stored)) {
      if (stored[key] != null) result[key] = stored[key];
    }
    return result;
  }

  /**
   * [was: RJ] — Update caption display settings.
   * Source lines 4134–4140
   */
  updateDisplaySettings(settings, persist) {
    const merged = {};
    Object.assign(merged, getStoredDisplaySettings());
    Object.assign(merged, settings);
    applyDisplaySettings(this, merged, persist);
    fireEvent(this.player, 'captionssettingschanged');
  }

  // ── Module API ─────────────────────────────────────────────────────

  /**
   * [was: aI] — Handle option-value pairs from the player API.
   * Source lines 4148–4181
   */
  setOption(option, value) {
    switch (option) {
      case 'fontSize':
        if (!isNaN(value)) {
          const clamped = Math.max(-2, Math.min(value, 4)); // was: g.lm
          this.updateDisplaySettings({ fontSizeIncrement: clamped });
          return clamped;
        }
        break;
      case 'reload':
        if (value && !this.useNativeTracks) setActiveTrack(this, this.activeTrack, true);
        break;
      case 'track':
        return this.handleTrackOption(value); // was: YVa
      case 'tracklist':
        return this.trackProvider
          ? filterTracks(this.trackProvider.tracks, !(!value || !value.includeAsr)).map(t => serializeTrack(t))
          : [];
      case 'translationLanguages':
        return this.trackProvider ? this.trackProvider.translationLanguages.map(l => Object.assign({}, l)) : [];
    }
  }

  /**
   * [was: getOptions] — Return supported option names.
   * Source lines 4182–4186
   */
  getOptions() {
    const options = ['reload', 'fontSize', 'track', 'tracklist', 'translationLanguages', 'sampleSubtitle'];
    if (this.config.isLoggedIn) options.push('stickyLoading'); // was: L
    return options;
  }

  /** [was: sj] — Toggle captions on/off. Source lines 4204–4208 */
  toggleCaptions(isUserAction) {
    if (this.isSubtitlesOn()) {
      if (this.config.experimentEnabled('enable_player_captions_persistence_state_machine') && isUserAction) {
        persistCaptionEnabled(this, false);
      } else if (isFeatureEnabled(this.config)) {
        persistStickyCaption(this, false);
      } else {
        persistModuleEnabled(this, false);
      }
      this.updateVssLogging();
      setActiveTrack(this, null, true);
    } else {
      this.enableCaptions(isUserAction); // was: D8
    }
  }

  /** [was: D8] — Enable captions. Source lines 4209–4213 */
  enableCaptions(isUserAction) {
    const track = (this.isForcedTrackActive() || !this.activeTrack) ? resolvePreferredTrack(this, true) : this.activeTrack;
    if (track) this.reportCaptionState(track.vssId, 'm');
    if (!this.isSubtitlesOn()) {
      setActiveTrack(this, track, this.config.experimentEnabled('enable_player_captions_persistence_state_machine') ? isUserAction : true);
    }
  }

  /** [was: isSubtitlesOn] — Source line 4214 */
  isSubtitlesOn() {
    return !!this.loaded && !!this.activeTrack && !this.isForcedTrackActive();
  }

  /** [was: isForcedTrackActive] — is the current track the forced/generated one? [was: Cy] */
  isForcedTrackActive() {
    const forced = getForcedTrack(this);
    return !!forced && this.activeTrack === forced;
  }

  /** [was: sC] — Called when audio track changes. Source lines 4217–4225 */
  onAudioTrackChange() {
    const wasForcedActive = this.isForcedTrackActive();
    if (hasForcedTrack(this, wasForcedActive)) {
      setActiveTrack(this, this.getAudioTrack().forcedTrack, false);
    } else if (this.videoData.captionTracks.length) {
      if (this.loaded) this.unload();
      if (this.shouldHonorAvailabilities()) {
        this.isManualSwitch = false;
        this.activeTrack = null;
        if (this.trackProvider) { this.trackProvider.dispose(); this.trackProvider = null; }
      }
      if (this.shouldBeActive()) {
        if (wasForcedActive) setActiveTrack(this, resolvePreferredTrack(this, false), false);
        else this.load();
      }
    }
  }

  /** [was: onVideoDataChange] — Source lines 4243–4252 */
  onVideoDataChange(reason, newVideoData) {
    if (reason === 'newdata') {
      this.videoData = newVideoData;
      if (this.loaded) this.unload();
      this.isManualSwitch = false;
      this.activeTrack = null;
      if (this.trackProvider) {
        this.trackProvider.dispose();
        this.trackProvider = null;
        fireEvent(this.player, 'captionschanged', {});
      }
      if (this.shouldBeActive()) this.load();
    }
  }

  /** [was: getAudioTrack] */
  getAudioTrack() {
    return this.player.getAudioTrack();
  }

  /** [was: getCaptionWindowContainerId] — Source line 4057 */
  getCaptionWindowContainerId() {
    return this.windowContainer.element.id;
  }

  // ── Logging helpers ────────────────────────────────────────────────

  /** [was: q6] — Report caption format state. Source lines 4268–4280 */
  reportCaptionState(track, enabled, source) {
    const sanitize = /&|,|:|;|(\n)|(\s)|(\/)|(\\)/toOnEventName;
    let vssId = '';
    if (track) vssId = (track.vssId || '').replace(sanitize, '');
    let trackId = '';
    if (track?.getId()) trackId = track.getId() || '';
    if (track?.getXtags()) trackId = trackId.concat(`;${track.getXtags().replace(sanitize, '')}`);
    if (this.sourceType === 'HLS') trackId = '';
    this.playerApi.reportCaptionState(enabled ? vssId : '', enabled ? trackId : '', source); // was: q6
  }

  /** [was: SQ] — Report caption format info. Source lines 4281–4284 */
  reportCaptionFormatInfo(vssId, source) {
    const sanitized = (vssId || '').replace(/&|,|:|;|(\n)|(\s)|(\/)|(\\)/toOnEventName, '');
    if (sanitized.length > 0) this.playerApi.reportCaptionFormatInfo(sanitized, source); // was: SQ
  }

  /** [was: py] — Update VSS logging with active track. Source line 1485–1487 */
  updateVssLogging(track) {
    if (this.config.experimentEnabled('html5_modify_caption_vss_logging')) {
      this.videoData.vssTrack = track; // was: OJ
    }
  }
}

// ── Register the module ─────────────────────────────────────────────
registerModule('captions', CaptionModule);

export { CaptionModule, DEFAULT_CAPTION_PARAMS, applyDisplaySettings };
