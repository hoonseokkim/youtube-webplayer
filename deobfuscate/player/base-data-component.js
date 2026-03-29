
/**
 * Caption/track data components — base classes for caption track management.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   H90 (TrackPair):              line ~104545  (internal helper class)
 *   g.Ci (CaptionDataComponent):  lines ~104552-104594
 *   g.M0 (EmbeddedCaptionData):   lines ~104595-104639
 *   g.Jc (LegacyCaptionData):     lines ~104641-104734
 *
 * These classes manage caption/subtitle track lists, fetching track
 * metadata and content from the server. They extend Disposable and
 * publish `"trackListLoaded"` events through the player's pub/sub system.
 *
 * [was: H90, g.Ci, g.M0, g.Jc]
 */

import { Disposable } from '../core/disposable.js';
import { forceReconnect } from '../media/mse-internals.js'; // was: Kw
import { SimpleSlotAdapterFactory } from '../ads/ad-slot-adapters.js'; // was: hO
import { createByteRange } from '../media/format-parser.js'; // was: Lk
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { getElementsByTagName } from '../core/dom-utils.js';
import { filter } from '../core/array-utils.js';
import { NativeDeferred } from '../core/event-registration.js';

// ─────────────────────────────────────────────────────────────────────────────
// TrackPair — container for normal and forced caption track lists
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Holds two arrays of caption tracks: auto-generated (`asr`) and
 * regular (`normal`).
 *
 * [was: H90]
 */
class TrackPair {
  /**
   * Auto-generated (ASR) caption tracks.
   * @type {Array}
   */
  asr = []; // was: O

  /**
   * Normal (author-provided) caption tracks.
   * @type {Array}
   */
  normal = []; // was: W

  constructor() {
    this.asr = [];
    this.normal = [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CaptionDataComponent — abstract base for caption data sources
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Abstract base class for caption/track data components.
 *
 * Manages two {@link TrackPair} instances (primary and forced tracks),
 * a deferred promise for coordinating asynchronous track-list loading,
 * and arrays for translation targets and translation-override data.
 *
 * Subclasses must implement:
 *   - `load(handler)` — initiate track list fetching
 *   - `buildUrl(track, format)` — build a URL for fetching track content
 *   - `abort()` — cancel any pending fetch
 *
 * [was: g.Ci]
 */
export class CaptionDataComponent extends Disposable {
  /**
   * The player/controller reference.
   * @type {Object}
   */
  player_; // was: ge

  /**
   * Primary track pair (normal + ASR tracks).
   * @type {TrackPair}
   */
  tracks; // was: W

  /**
   * Forced/fallback track pair.
   * @type {TrackPair}
   */
  forcedTracks; // was: Ie

  /**
   * Pending track-list-loaded promise coordinator.
   * @type {Object|null}
   */
  pendingLoad_ = null; // was: J

  /**
   * Translation target languages.
   * @type {Array}
   */
  translationTargets = []; // was: Y

  /**
   * Translation override data.
   * @type {Array}
   */
  translationOverrides = []; // was: T2

  /**
   * @param {Object} player  The player API instance [was: ge].
   */
  constructor(player) {
    super();
    this.player_ = player;
    this.tracks = new TrackPair(); // was: new H90
    this.forcedTracks = new TrackPair(); // was: new H90
    this.pendingLoad_ = null;
    this.translationTargets = [];
    this.translationOverrides = [];
  }

  /**
   * Initiates track list loading. Subclasses override.
   *
   * @param {Object} handler  An object with a `Kw` method called on completion.
   */
  /* was: K */
  load(handler) {}

  /**
   * Aborts any pending fetch. Subclasses override.
   */
  /* was: A */
  abort() {}

  /**
   * Builds a URL for fetching a specific caption track.
   * Subclasses override.
   *
   * @param {Object} track
   * @param {string} format
   * @returns {string}
   */
  /* was: D */
  buildUrl(track, format) {
    return '';
  }

  /**
   * Dispatches the `"trackListLoaded"` event through the player's pub/sub,
   * optionally waiting for asynchronous decoration before invoking the
   * handler's completion callback.
   *
   * @param {Object} handler    Object with a `Kw` completion method.
   * @param {string} videoId    The video ID for which tracks were loaded.
   */
  /* was: Kw */
  dispatchTrackListLoaded(handler, videoId) {
    if (this.player_.G().X('html5_dispatch_tracklist_loaded_event')) {
      // Cancel any previous pending load.
      if (this.pendingLoad_) {
        this.pendingLoad_.reject();
        this.pendingLoad_ = null;
      }

      const promises = [];
      this.player_.publish('trackListLoaded', this.tracks, promises, videoId);

      if (this.player_.G().X('enable_po_decoration_of_forced_tracks')) {
        this.player_.publish('trackListLoaded', this.forcedTracks, promises, videoId);
      }

      if (promises.length) {
        // was: new g.id — a deferred promise wrapper
        const deferred = createDeferred();
        deferred.promise.then(handler.forceReconnect, () => {});
        this.pendingLoad_ = deferred;
        Promise.all(promises)
          .then(deferred.resolve, deferred.reject)
          .finally(() => {
            this.pendingLoad_ = null;
          });
      } else {
        handler.forceReconnect();
      }
    } else {
      handler.forceReconnect();
    }
  }

  /** @override */
  /* was: WA */
  disposeInternal() {
    if (this.pendingLoad_) {
      this.pendingLoad_.reject();
      this.pendingLoad_ = null;
    }
    this.abort();
    super.disposeInternal();
  }
}

// Prototype-level flags — original code sets these via c3() helper.
// was: g.Ci.prototype.S = c3(63);
// was: g.Ci.prototype.j = c3(62);

// ─────────────────────────────────────────────────────────────────────────────
// EmbeddedCaptionData — caption data sourced from embedded player response
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Caption data component that reads track info from the embedded player
 * response (video data + audio track metadata).
 *
 * [was: g.M0]
 */
export class EmbeddedCaptionData extends CaptionDataComponent {
  /**
   * The video data object.
   * @type {Object}
   */
  videoData;

  /**
   * The audio track descriptor (contains `captionTracks`).
   * @type {Object|undefined}
   */
  audioTrack;

  /**
   * Pending XHR / fetch handle.
   * @type {Object|null}
   */
  pendingRequest_ = null; // was: O

  /**
   * Whether the video uses signed URLs.
   * @type {boolean}
   */
  useSignedUrls_ = false; // was: L

  /**
   * @param {Object} player      The player API instance [was: ge].
   * @param {Object} videoData   The video data object.
   * @param {Object} [audioTrack]  Audio track descriptor with caption info.
   */
  constructor(player, videoData, audioTrack) {
    super(player);
    this.videoData = videoData;
    this.audioTrack = audioTrack;
    this.pendingRequest_ = null;
    this.useSignedUrls_ = false;
    this.translationTargets = videoData.Hf; // was: Y = c.Hf
    this.translationOverrides = videoData.SimpleSlotAdapterFactory; // was: T2 = c.hO
    this.useSignedUrls_ = false; // was: g.oZ(c) — checks signed-URL flag
  }

  /**
   * Loads track metadata from the audio track's caption list.
   *
   * @param {Object} handler  Completion handler with `Kw` method.
   * @override
   */
  /* was: K */
  load(handler) {
    if (this.audioTrack) {
      for (const captionTrack of this.audioTrack.captionTracks) {
        // was: g.$m(this.W, c) — adds track to appropriate list (ASR vs normal)
        addTrackToList(this.tracks, captionTrack);
      }
      if (this.audioTrack.W) {
        addTrackToList(this.forcedTracks, this.audioTrack.W);
      }
    }
    this.dispatchTrackListLoaded(handler, this.videoData.videoId);
  }

  /**
   * Builds the URL for fetching caption content.
   *
   * @param {Object} track   The caption track object.
   * @param {string} format  Caption format (e.g. `"srv3"`, `"json3"`).
   * @returns {string}
   * @override
   */
  /* was: D */
  buildUrl(track, format) {
    const baseUrl = track.createByteRange(); // was: Q.Lk()
    const params = { fmt: format };

    if (format === 'srv3' || format === '3' || format === 'json3') {
      // was: g.i0() — checks some runtime flag
      // Default path: set XOR-based obfuscation params
      Object.assign(params, { xorb: 2, xobt: 3, xovt: 3 });
    }

    if (track.translationLanguage) {
      params.tlang = track.translationLanguage; // was: g.Na(Q)
    }

    if (this.useSignedUrls_) {
      params.xosf = '1';
    }

    Object.assign(params, this.player_.G().W);
    return appendUrlParams(baseUrl, params); // was: fe(baseUrl, params)
  }

  /**
   * Aborts any pending caption content fetch.
   * @override
   */
  /* was: A */
  abort() {
    if (this.pendingRequest_) {
      this.pendingRequest_.abort();
    }
  }
}

// was: g.M0.prototype.j = c3(61);

// ─────────────────────────────────────────────────────────────────────────────
// LegacyCaptionData — caption data fetched via the legacy XML timedtext API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Caption data component that fetches track metadata from the legacy
 * `/api/timedtext` XML endpoint (used when embedded caption data is
 * not available).
 *
 * [was: g.Jc]
 */
export class LegacyCaptionData extends CaptionDataComponent {
  /**
   * The video ID to fetch captions for.
   * @type {string}
   */
  videoId;

  /**
   * Whether ASR (auto-generated) tracks should be requested.
   * @type {boolean}
   */
  requestAsr_; // was: yK

  /**
   * Event ID for tracking/analytics.
   * @type {string}
   */
  eventId;

  /**
   * Translation language name cache — maps language codes to display names.
   * @type {Object<string, string>}
   */
  translationLanguageNames_ = {}; // was: mF

  /**
   * Pending XHR handle.
   * @type {Object|null}
   */
  pendingRequest_ = null; // was: O

  /**
   * Base URL for the timedtext API.
   * @type {string}
   */
  baseUrl_; // was: L

  /**
   * @param {Object} player     The player API instance [was: ge].
   * @param {string} apiUrl     The timedtext API base URL.
   * @param {string} videoId    The video ID.
   * @param {Object} [options]  Additional options.
   * @param {boolean} [requestAsr]  Whether to request ASR tracks [was: yK].
   * @param {string}  [eventId]     Event ID for analytics [was: T].
   */
  constructor(player, apiUrl, videoId, options, requestAsr, eventId) {
    super(player);
    this.videoId = videoId;
    this.requestAsr_ = requestAsr;
    this.eventId = eventId;
    this.translationLanguageNames_ = {};
    this.pendingRequest_ = null;

    // Normalize language code (underscore to hyphen)
    let lang = (options || {}).hl || ''; // was: g.g_(c).hl
    lang = lang.split('_').join('-');
    this.baseUrl_ = appendUrlParams(apiUrl, { hl: lang }); // was: fe(c, { hl: Q })
  }

  /**
   * Fetches the track list from the legacy XML timedtext API.
   *
   * @param {Object} handler  Completion handler with `Kw` method.
   * @override
   */
  /* was: K */
  load(handler) {
    let url = this.baseUrl_;
    const params = {
      type: 'list',
      tlangs: 1,
      v: this.videoId,
      vssids: 1,
    };
    if (this.requestAsr_) {
      params.asrs = 1;
    }
    url = appendUrlParams(url, params);

    this.abort();

    // was: g.Wn(url, { format: "RAW", onSuccess: …, withCredentials: true })
    // Simplified — the actual fetch uses an internal XHR wrapper.
    this.pendingRequest_ = fetchXml(url, {
      format: 'RAW',
      onSuccess: (response) => {
        this.pendingRequest_ = null;
        const xml = response.responseXML;
        if (xml && xml.firstChild) {
          // Parse <track> elements
          const trackElements = xml.getElementsByTagName('track');
          for (let i = 0; i < trackElements.length; i++) {
            const createDatabaseDefinition = trackElements[i];
            const languageCode = createDatabaseDefinition.getAttribute('lang_code');
            const languageName = createDatabaseDefinition.getAttribute('lang_translated');
            const name = createDatabaseDefinition.getAttribute('name');
            const kind = createDatabaseDefinition.getAttribute('kind');
            const id = createDatabaseDefinition.getAttribute('id');
            const isDefault = createDatabaseDefinition.getAttribute('lang_default') === 'true';
            const isTranslatable = createDatabaseDefinition.getAttribute('cantran') === 'true';
            const vssId = createDatabaseDefinition.getAttribute('vss_id');

            // was: g.$m(this.W, new g.zz({…}))
            addTrackToList(this.tracks, {
              languageCode,
              languageName,
              name,
              kind,
              id,
              is_servable: true,
              is_translateable: isTranslatable,
              vss_id: vssId,
              is_default: isDefault,
            });
          }

          // Parse <target> elements (translation targets)
          const targetElements = xml.getElementsByTagName('target');
          for (let i = 0; i < targetElements.length; i++) {
            const target = {
              languageCode: targetElements[i].getAttribute('lang_code'),
              languageName: targetElements[i].getAttribute('lang_translated'),
              languageOriginal: targetElements[i].getAttribute('lang_original'),
              id: targetElements[i].getAttribute('id'),
              isDefault: targetElements[i].getAttribute('lang_default') === 'true',
            };
            this.translationLanguageNames_[target.languageCode] = target.languageName;
            this.translationTargets.push(target);
          }
        }
        this.dispatchTrackListLoaded(handler, this.videoId);
      },
      withCredentials: true,
    });
  }

  /**
   * Builds the URL for fetching a specific caption track's content.
   *
   * @param {Object} track   The caption track object.
   * @param {string} format  Caption format string.
   * @returns {string}
   * @override
   */
  /* was: D */
  buildUrl(track, format) {
    let url = this.baseUrl_;
    const params = {
      v: this.videoId,
      type: 'track',
      lang: track.languageCode,
      name: track.getName(),
      kind: track.kind,
      fmt: format,
    };

    const config = this.player_.G();
    if (config.X('captions_url_add_ei')) {
      params.ei = this.eventId;
    }
    if (track.translationLanguage) {
      params.tlang = track.translationLanguage; // was: g.Na(Q)
    }
    Object.assign(params, config.W);
    return appendUrlParams(url, params);
  }

  /**
   * Aborts any pending fetch.
   * @override
   */
  /* was: A */
  abort() {
    if (this.pendingRequest_) {
      this.pendingRequest_.abort();
    }
  }
}

// was: g.Jc.prototype.j = c3(60);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (stubs — these reference external utilities)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds a caption track to the appropriate list (ASR or normal) within
 * a TrackPair, avoiding duplicates.
 *
 * @param {TrackPair} trackPair
 * @param {Object}    track
 * @private
 */
/* was: addCaptionTrack + zzy */
function addTrackToList(trackPair, track) {
  const list = track.kind === 'asr' ? trackPair.asr : trackPair.normal;
  const isDuplicate = list.some((existing) => existing.equals?.(track));
  if (!isDuplicate) {
    list.push(track);
  }
}

/**
 * Appends query parameters to a URL string.
 * Stub — the real implementation lives in the URL utilities.
 *
 * @param {string} url
 * @param {Object} params
 * @returns {string}
 * @private
 */
/* was: fe */
function appendUrlParams(url, params) {
  // TODO: import from '../core/url-utils.js' once available
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  if (!query) return url;
  return url + (url.includes('?') ? '&' : '?') + query;
}

/**
 * Fetches an XML resource. Stub wrapping the player's internal XHR helper.
 *
 * @param {string} url
 * @param {Object} options
 * @returns {Object}  An abortable request handle.
 * @private
 */
/* was: sendXhrRequest */
function fetchXml(url, options) {
  // TODO: replace with actual XHR/fetch wrapper import
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  if (options.withCredentials) {
    xhr.withCredentials = true;
  }
  xhr.onload = () => {
    if (options.onSuccess) {
      options.onSuccess(xhr);
    }
  };
  xhr.send();
  return xhr;
}

/**
 * Creates a deferred promise (resolve/reject exposed externally).
 *
 * @returns {{ promise: Promise, resolve: Function, reject: Function }}
 * @private
 */
/* was: new NativeDeferred */
function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
