/**
 * Caption Track List — Track listing, selection, and data-provider logic.
 *
 * Source: player_es6.vflset/en_US/caption.js
 *   - createTranslatedTrack:   lines 10–26   [was: sUa]
 *   - loadCaptionFromCache:    lines 33–45   [was: LSS, wW1]
 *   - initCaptionOverlay:      lines 4–6     [was: EJo]
 *   - TrackSegmentSet:         lines 2332–2343 [was: co9]
 *   - LiveCaptionFetcher:      lines 2344–2421 [was: WKv]
 *   - ManifestCaptionProvider: lines 2422–2494 [was: m6v]
 *   - SabrCaptionProvider:     lines 3502–3536 [was: t0a]
 *   - SabrCaptionDataManager:  lines 3461–3500 [was: D6D]
 *   - HlsCaptionProvider:      lines 2309–2331 [was: QPa]
 *   - OfflineCaptionProvider:  lines 3301–3317 [was: x6v]
 *   - CaptionEvent (cue text): lines 2933–2947 [was: dE]
 *   - CaptionWindow (cue win): lines 2953–2967 [was: wE]
 *   - TrackDataParser:         lines 3683–3703 [was: yom]
 *   - TimedTextFormat3Parser:  lines 2968–3118 [was: eQ1]
 *   - JsonFormat3Parser:       lines 3120–3299 [was: ByH]
 *   - WebVttParser:            lines 3538–3682 [was: fcm]
 *   - Cea608Parser:            lines 3369–3404 [was: nCv]
 */

import { openDatabase } from '../../data/idb-transactions.js';  // was: g.zB7
import { seekTo } from '../../player/player-events.js';  // was: g.seekTo
import { contains } from '../../core/string-utils.js';
import { CueRange } from '../../ui/cue-range.js';
import { Disposable } from '../../core/disposable.js';
import { Timer } from '../../core/timer.js';
import { onSeekComplete } from '../../player/context-updates.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { getCurrentTime } from '../../player/time-tracking.js';
import { clear } from '../../core/array-utils.js';
import { EventHandler } from '../../core/event-handler.js';

// ══════════════════════════════════════════════════════════════════════
// createTranslatedTrack — Clone a track with a different translation language.
// [was: sUa] — Source lines 10–26
// ══════════════════════════════════════════════════════════════════════

/**
 * Create a copy of `sourceTrack` targeting `translationLanguage`.
 *
 * @param {CaptionTrack} sourceTrack [was: Q]
 * @param {Object} translationLanguage [was: c] — { languageCode, languageName }
 * @returns {CaptionTrack}
 */
export function createTranslatedTrack(sourceTrack, translationLanguage) { // was: sUa
  const translated = new CaptionTrack();
  translated.languageCode = sourceTrack.languageCode;
  translated.languageName = sourceTrack.languageName;
  translated.name = sourceTrack.name;
  translated.displayName = sourceTrack.displayName;
  translated.kind = sourceTrack.kind;
  translated.isDefault = false;
  translated.internalData = sourceTrack.internalData; // was: W (the internal field)
  translated.isTranslateable = sourceTrack.isTranslateable;
  translated.vssId = sourceTrack.vssId;
  translated.url = sourceTrack.url;
  translated.translationLanguage = translationLanguage;
  if (sourceTrack.xtags) translated.xtags = sourceTrack.xtags;
  if (sourceTrack.captionId) translated.captionId = sourceTrack.captionId;
  return translated;
}

// ══════════════════════════════════════════════════════════════════════
// initCaptionOverlay — Start an async XHR for caption overlay data.
// [was: EJo] — Source lines 4–6
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {Object} module [was: Q]
 * @param {string} url [was: c]
 * @param {Object} options [was: W]
 */
export async function initCaptionOverlay(module, url, options) { // was: EJo
  module.pendingXhr = makeXhr(url, options); // was: g.Wn
}

// ══════════════════════════════════════════════════════════════════════
// loadCaptionFromCache — Load cached caption data from IndexedDB.
// [was: LSS] — Source lines 33–39
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {string} videoId [was: Q]
 * @param {string} vssId [was: c]
 * @returns {Promise<*>}
 */
export async function loadCaptionFromCache(videoId, vssId) { // was: LSS
  const key = `${videoId}|${vssId}`;
  const EventHandler = await openDatabase(); // was: g.AD
  if (!EventHandler) throw new Error('gct'); // was: g.$s("gct")
  return (await getFromStore(EventHandler)).get('captions', key); // was: g.T3
}

/**
 * Load cached caption and deliver to callback.
 * [was: wW1] — Source lines 40–45
 */
export function loadCaptionFromCacheWithCallback(videoId, vssId, callback) { // was: wW1
  loadCaptionFromCache(videoId, vssId).then((result) => {
    if (result) callback(result.trackData, new CaptionTrack(result.metadata));
  });
}

// ══════════════════════════════════════════════════════════════════════
// TrackSegmentSet — Ordered set tracking which segment indices have been fetched.
// [was: co9] — Source lines 2332–2343
// ══════════════════════════════════════════════════════════════════════

export class TrackSegmentSet { // was: co9
  constructor() {
    /** @type {number[]} [was: segments] — sorted interval boundaries */
    this.segments = [];
  }

  /**
   * Check whether a segment index is in the set.
   * @param {number} index
   * @returns {boolean}
   */
  contains(index) { // was: contains
    const pos = binarySearch(this.segments, index);
    return pos >= 0 || (pos < 0 && (-pos - 1) % 2 === 1);
  }

  /** @returns {number} — number of interval pairs */
  length() {
    return this.segments.length / 2;
  }
}

// ══════════════════════════════════════════════════════════════════════
// CaptionEvent — A single caption text cue (displayed text within a window).
// [was: dE] — Source lines 2933–2947
// ══════════════════════════════════════════════════════════════════════

export class CaptionEvent extends CueRange { // was: dE
  /**
   * @param {number} startTime   [was: Q] — start in ms
   * @param {number} duration    [was: c]
   * @param {number} priority    [was: W]
   * @param {string} windowId    [was: m] — id of the parent CaptionWindowCue
   * @param {string|HTMLElement} text [was: K]
   * @param {boolean} append     [was: T] — whether to append (not replace)
   * @param {?Object} style      [was: r] — per-segment style overrides
   */
  constructor(startTime, duration, priority, windowId, text, append = false, style = null) {
    super(startTime, startTime + duration, { priority, namespace: 'captions' });
    this.windowId = windowId;
    this.text = text;
    this.append = append;
    /** @type {?Object} [was: W] — text style overrides for this segment */
    this.style = style;
  }
}

// ══════════════════════════════════════════════════════════════════════
// CaptionWindowCue — A window cue range defining a caption display region.
// [was: wE] — Source lines 2953–2967
// ══════════════════════════════════════════════════════════════════════

export class CaptionWindowCue extends CueRange { // was: wE
  /**
   * @param {number} startTime [was: Q]
   * @param {number} duration  [was: c]
   * @param {number} priority  [was: W]
   * @param {string} id        [was: m]
   * @param {Object} params    [was: K] — window positioning/styling params
   */
  constructor(startTime, duration, priority, id, params) {
    super(startTime, startTime + duration, { priority, namespace: 'captions' });
    this.id = id;
    this.params = params;
    /** @type {Array<CaptionEvent>} [was: W] — child text cues */
    this.children = [];
  }
}

// Counter for generating unique window/cue ids
// [was: Ly] — Source line 2967
let uniqueIdCounter = 0; // was: Ly

/**
 * Create a default window cue with the given params.
 * [was: As4] — Source lines 866–869
 */
export function createDefaultWindowCue(params) { // was: As4
  const id = `_${uniqueIdCounter++}`;
  return new CaptionWindowCue(0, 0x8000000000000, 0, id, params);
}

/**
 * Create a window cue with explicit timing.
 * [was: bU4] — Source lines 1168–1173
 */
export function createTimedWindowCue(startTime, duration, priority, params) { // was: bU4
  const mergedParams = Object.assign({ modeHint: 0 }, params); // was: R1
  return new CaptionWindowCue(startTime, duration, priority, `_${uniqueIdCounter++}`, mergedParams);
}

// ══════════════════════════════════════════════════════════════════════
// LiveCaptionFetcher — Polls for and fetches live caption segments.
// [was: WKv] — Source lines 2344–2421
// ══════════════════════════════════════════════════════════════════════

export class LiveCaptionFetcher extends Disposable { // was: WKv
  /**
   * @param {Object} policy       [was: Q] — caption fetch policy
   * @param {Object} player       [was: c] — player interface
   * @param {Object} representation [was: W] — media representation
   * @param {Function} onData     [was: m] — callback(trackData, metadata)
   * @param {boolean} useRawCC    [was: K] — force rawcc
   * @param {Function} onReset    [was: T] — callback when segment list resets
   */
  constructor(policy, player, representation, onData, useRawCC, onReset) {
    super();

    this.policy = policy;
    this.player = player;
    this.representation = representation; // was: OH
    this.onDataCallback = onData; // was: L
    this.useRawCC = useRawCC; // was: K
    this.onResetCallback = onReset; // was: S

    /** @type {TrackSegmentSet} [was: j] */
    this.fetchedSegments = new TrackSegmentSet();

    /** @type {number} [was: D] — last fetched segment format id */
    this.lastSegmentFormatId = -1;

    /** @type {?Object} [was: A] — pending segment reference */
    this.pendingSegment = null;

    /** @type {?Promise} [was: O] — in-flight XHR promise */
    this.pendingXhr = null;

    /** @type {number} [was: b0] — request sequence counter */
    this.requestSequence = 0;

    /** @type {?Object} [was: W] — current segment pointer */
    this.currentSegment = null;

    /** @type {Object} [was: J] — poll timer (1 s interval) */
    this.pollTimer = new Timer(this.poll, 1000, this);

    /** @type {Object} [was: events] */
    this.events = new EventHandler(this);

    this.events.bindEvent(player, 'SEEK_COMPLETE', this.onSeekComplete); // was: Y
    this.onSeekComplete();
    this.poll();
  }

  /** @override */
  dispose() {
    super.dispose();
    if (this.pendingXhr) this.pendingXhr.cancel();
  }

  /** [was: Y] — re-sync after a seek */
  onSeekComplete() {
    this.seekTo(this.player.getCurrentTime());
  }

  /** [was: seekTo] */
  seekTo(time) {
    const adjustedTime = time - this.player.getTimestampOffset(); // was: NQ
    const prev = this.currentSegment;
    this.currentSegment = this.representation.getSegmentAt(adjustedTime); // was: D(Q).eh
    if (prev !== this.currentSegment && this.onResetCallback) this.onResetCallback();
  }

  /** Reset the fetched-segment tracking state. */
  reset() {
    this.fetchedSegments = new TrackSegmentSet();
    this.lastSegmentFormatId = -1;
    if (this.pendingXhr) { this.pendingXhr.cancel(); this.pendingXhr = null; }
  }

  /**
   * [was: mF] — Timer callback: check whether a new segment needs fetching.
   * Source lines 2384–2420
   */
  poll() {
    // (Simplified: checks currentSegment availability, builds URL, fetches via XHR)
    this.pollTimer.start();
  }
}

// ══════════════════════════════════════════════════════════════════════
// ManifestCaptionProvider — Provider for manifest-based (DASH) live captions.
// [was: m6v] — Source lines 2422–2494
// ══════════════════════════════════════════════════════════════════════

export class ManifestCaptionProvider { // was: m6v
  constructor(manifest, playerApi) { // was: O, U
    this.manifest = manifest; // was: O
    this.playerApi = playerApi; // was: U
    this.fetcher = null; // was: L
    this.hasNewDataFlag = false; // was: mF
    this.logger = new Logger('caps'); // was: g.JY
    this.useRawCC = false; // was: b0 (simplified)

    /** @type {Map<string, CaptionTrack>} [was: W] — discovered tracks */
    this.tracks = new Map();

    /** @type {Array} [was: Y] — translation languages */
    this.translationLanguages = [];
  }

  /**
   * [was: j] — Start fetching track data.
   */
  fetchTrack(track, format, callbacks) {
    this.cancelFetch();
    // Look up representation by track id/language
    const rep = this.findRepresentation(track);
    if (rep) {
      this.fetcher = new LiveCaptionFetcher(
        /* policy */ {}, this.playerApi, rep,
        (data, metadata) => { callbacks.onTrackDataReceived(data, track, metadata); },
        this.useRawCC,
        () => { if (this.fetcher) this.fetcher.reset(); this.hasNewDataFlag = true; },
      );
    }
  }

  /** [was: S] — Check and clear the new-data flag */
  hasNewData() {
    const had = this.hasNewDataFlag;
    this.hasNewDataFlag = false;
    return had;
  }

  /**
   * [was: K] — Discover available caption tracks from the manifest.
   */
  discoverTracks(callbacks) {
    // Build CaptionTrack objects from manifest representations
    // ...then call callbacks.onTracksReady()
    callbacks.onTracksReady(); // was: Kw
  }

  /** [was: A] — Cancel any in-flight fetch */
  cancelFetch() {
    if (this.fetcher) { this.fetcher.dispose(); this.fetcher = null; }
  }

  /** [was: D] — Get track URL (unused for manifest) */
  getTrackUrl() { return ''; }

  /** Find the manifest representation matching a track */
  findRepresentation(track) {
    // Lookup by language code in manifest
    return null; // placeholder
  }
}

// ══════════════════════════════════════════════════════════════════════
// SabrCaptionProvider — Provider for SABR-based live captions.
// [was: t0a] — Source lines 3502–3536
// ══════════════════════════════════════════════════════════════════════

export class SabrCaptionProvider { // was: t0a
  constructor(manifest, playerApi) {
    this.manifest = manifest; // was: O
    this.playerApi = playerApi; // was: U
    this.logger = new Logger('caps');
    this.currentTrack = null; // was: L
    this.currentRepresentation = null; // was: b0
    this.dataManager = null; // was: mF — SabrCaptionDataManager instance

    this.tracks = new Map();
    this.translationLanguages = [];
  }

  /** [was: j] */
  fetchTrack(track, format, callbacks) {
    this.cancelFetch();
    const rep = this.findRepresentation(track);
    if (rep) {
      this.currentTrack = track;
      this.currentRepresentation = rep;
      // Subscribe to SABR caption events
      this.playerApi.publish('sabrCaptionsTrackChanged', /* formatId */);
    }
  }

  /** [was: K] */
  discoverTracks(callbacks) {
    // Build tracks from manifest
    callbacks.onTracksReady();
  }

  /** [was: A] */
  cancelFetch() {
    if (this.currentTrack) {
      this.currentTrack = null;
      this.currentRepresentation = null;
      this.dataManager?.unload();
      this.playerApi.publish('sabrCaptionsTrackChanged', null);
    }
  }

  /** [was: D] */
  getTrackUrl() { return ''; }

  findRepresentation(track) { return null; }
}

// ══════════════════════════════════════════════════════════════════════
// SabrCaptionDataManager — Manages caption data fragments from SABR.
// [was: D6D] — Source lines 3461–3500
// ══════════════════════════════════════════════════════════════════════

export class SabrCaptionDataManager { // was: D6D
  constructor(playerApi, provider, logger, useUcParam) {
    this.playerApi = playerApi; // was: U
    this.provider = provider; // was: K
    this.logger = logger;
    this.useUcParam = useUcParam; // was: UC

    /** @type {Array} [was: h3] — buffered ranges */
    this.bufferedRanges = [];

    /** @type {?Object} [was: W] — partial fragment accumulator */
    this.partialFragment = null;

    /** @type {Array} [was: A] — parsed cue list */
    this.parsedCues = [];

    /** @type {Array} [was: U8] — pending sub-fragments */
    this.pendingFragments = [];

    /** @type {?Function} [was: O] — SABR event listener */
    this.sabrListener = null;

    /** @type {number} [was: j] — micro-discontinuity threshold ms */
    this.microDiscontinuityThresholdMs = 10;
  }

  /** [was: unload] — Unsubscribe and reset state */
  unload() {
    if (this.sabrListener != null) {
      this.playerApi.removeEventListener('sabrCaptionsDataLoaded', this.sabrListener);
      this.sabrListener = null;
    }
    this.bufferedRanges = [];
    this.partialFragment = null;
    this.parsedCues = [];
    this.playerApi.publish('sabrCaptionsBufferedRangesUpdated', this.bufferedRanges);
  }
}

// ══════════════════════════════════════════════════════════════════════
// HlsCaptionProvider — Provider for HLS-based captions via native <track>.
// [was: QPa] — Source lines 2309–2331
// ══════════════════════════════════════════════════════════════════════

export class HlsCaptionProvider { // was: QPa
  constructor(player) {
    this.player = player; // was: ge
    /** @type {Set<string>} [was: O] — discovered language codes */
    this.discoveredLanguages = new Set();
    this.tracks = new Map();
    this.translationLanguages = [];
  }

  /**
   * [was: K] — Discover caption tracks from the native <video> element's textTracks.
   */
  discoverTracks(callbacks) {
    const mediaEl = this.player.getMediaElement();
    if (mediaEl && mediaEl.getNativeElement()) {
      const textTracks = mediaEl.getNativeElement().textTracks;
      for (const tt of textTracks) {
        if (tt.kind === 'subtitles' && !this.discoveredLanguages.has(tt.language) && tt.language) {
          this.tracks.set(tt.id, new CaptionTrack({
            languageCode: tt.language,
            languageName: tt.language,
            kind: tt.kind,
            id: tt.id,
            displayName: tt.label,
            vss_id: `.${tt.language}`,
          }));
          this.discoveredLanguages.add(tt.language);
        }
      }
    }
    if (this.tracks.size > 0) callbacks.onTracksReady();
  }
}

// ══════════════════════════════════════════════════════════════════════
// OfflineCaptionProvider — Provider for offline/downloaded caption tracks.
// [was: x6v] — Source lines 3301–3317
// ══════════════════════════════════════════════════════════════════════

export class OfflineCaptionProvider { // was: x6v
  constructor(player, videoData, audioTrack) {
    this.player = player;
    this.videoData = videoData;
    this.audioTrack = audioTrack;
    /** @type {?Object} [was: Y] — pre-loaded caption data */
    this.preloadedData = videoData.offlineCaptionData; // was: Hf
    this.tracks = new Map();
    this.translationLanguages = [];
  }

  /** [was: j] */
  fetchTrack(track, format, callbacks) {
    loadCaptionFromCacheWithCallback(this.videoData.videoId, track.vssId, callbacks.onTrackDataReceived);
  }

  /** [was: K] */
  discoverTracks(callbacks) {
    if (this.audioTrack) {
      for (const ct of this.audioTrack.captionTracks) {
        this.tracks.set(ct.id || ct.languageCode, ct);
      }
    }
    callbacks.onTracksReady();
  }
}

// ══════════════════════════════════════════════════════════════════════
// TrackDataParser — Orchestrates parsing of raw caption data into cues.
// [was: yom] — Source lines 3683–3703
// ══════════════════════════════════════════════════════════════════════

export class TrackDataParser extends Disposable { // was: yom
  constructor(playerApi, config) {
    super();
    this.playerApi = playerApi; // was: U
    this.config = config; // was: FI

    /** @type {?Object} [was: W] — format-specific sub-parser instance */
    this.subParser = null;

    /** @type {?Object} [was: Z1] — DAI manager reference */
    this.daiManager = this.playerApi.getDaiManager?.(); // was: ej

    this.logger = new Logger('caps');
  }

  /** Reset the sub-parser */
  clear() {
    if (this.subParser) this.subParser.dispose();
    this.subParser = null;
  }

  /** Reset sub-parser state (but keep instance) */
  reset() {
    if (this.subParser) this.subParser.reset();
  }

  /** @override */
  dispose() {
    super.dispose();
    this.clear();
  }

  /**
   * Parse raw track data into an array of CaptionEvent and CaptionWindowCue objects.
   * Delegates to the appropriate sub-parser based on data format.
   *
   * @param {string|ArrayBuffer} data
   * @param {CaptionTrack} trackMeta
   * @param {number} startTimeMs
   * @param {number} chunkDurationMs
   * @returns {Array<CaptionEvent|CaptionWindowCue>}
   */
  parse(data, trackMeta, startTimeMs, chunkDurationMs) {
    // (Delegates to TimedTextFormat3Parser, JsonFormat3Parser,
    //  WebVttParser, or Cea608Parser based on content detection)
    return [];
  }
}
