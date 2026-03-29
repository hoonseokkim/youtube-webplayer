/**
 * CueRange — timed event markers on the video timeline.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~74052-74060  (UWK  — CueRangeCallback internal record)
 *                 ~74063-74067  (Z6   — MarkerStyle enum)
 *                 ~74081-74115  (g.C8 — CueRange)
 *
 * A CueRange represents a time interval [start, end] on the video timeline
 * with visual styling, optional tooltip, icons, and metadata. Used for
 * ad markers, chapter markers, and timed-event markers.
 *
 * [was: g.C8, UWK, Z6]
 */
import { toString, contains } from '../core/string-utils.js';
import { filter } from '../core/array-utils.js';

// ---------------------------------------------------------------------------
// MarkerStyle enum
// ---------------------------------------------------------------------------

/**
 * Visual styles for progress-bar markers.
 *
 * [was: Z6]
 *
 * @enum {string}
 */
export const MarkerStyle = {
  /** Ad break marker. */
  AD_MARKER: 'ytp-ad-progress',        // was: Z6.AD_MARKER
  /** Chapter divider marker. */
  CHAPTER_MARKER: 'ytp-chapter-marker', // was: Z6.CHAPTER_MARKER
  /** Generic timed marker. */
  TIME_MARKER: 'ytp-time-marker',       // was: Z6.TIME_MARKER
};

// ---------------------------------------------------------------------------
// CueRange
// ---------------------------------------------------------------------------

/**
 * Auto-incrementing counter for internal ordering.
 * @type {number}
 */
let nextInternalId = 1; // was: exw (initialised to 1 at line 74115)

/**
 * Represents a timed range on the video timeline, used for ad markers,
 * chapter markers, and arbitrary timed events. Each range can be styled
 * on the progress bar and carry metadata (tooltip, icons, color).
 *
 * [was: g.C8]
 */
export class CueRange {
  /**
   * Start time of the range in seconds.
   * @type {number}
   */
  start; // was: this.start

  /**
   * End time of the range in seconds.
   * @type {number}
   */
  end; // was: this.end

  /**
   * Whether this cue range is currently active (within playback window).
   * @type {boolean}
   */
  active = true; // was: this.active = !0

  /**
   * Hex colour string for the marker (e.g. "#ff0000"), or empty string.
   * @type {string}
   */
  color = ''; // was: this.color

  /**
   * Internal ordering id (auto-incremented).
   * @type {number}
   */
  internalId_; // was: this.O

  /**
   * Externally-provided string identifier.
   * @type {string}
   */
  id = ''; // was: this.id

  /**
   * Display priority (lower = higher priority). Default is 9.
   * @type {number}
   */
  priority = 9; // was: this.priority

  /**
   * Whether this range should render a visible marker on the progress bar.
   * @type {boolean}
   */
  visible = false; // was: this.visible = !1

  /**
   * CSS class name for the progress-bar marker.
   * @type {string}
   */
  style; // was: this.style

  /**
   * Namespace string for grouping related cue ranges.
   * @type {string}
   */
  namespace = ''; // was: this.namespace

  /**
   * Tooltip text to show on hover.
   * @type {string|undefined}
   */
  tooltip; // was: this.tooltip

  /**
   * Filtered array of icon/thumbnail objects, or null.
   * @type {Array|null}
   */
  icons = null; // was: this.icons

  /**
   * Associated clip identifier, if this range belongs to a clip.
   * @type {string|undefined}
   */
  associatedClipId; // was: this.associatedClipId

  /**
   * Position in milliseconds for single-point markers.
   * @type {number|undefined}
   */
  markerPositionMs; // was: this.markerPositionMs

  /**
   * @param {number} start                Start time in seconds.
   * @param {number} end                  End time in seconds.
   * @param {Object} [options]            Optional configuration.
   * @param {string} [options.id]         External identifier.
   * @param {number} [options.priority]   Display priority (default 9).
   * @param {boolean} [options.visible]   Whether to show a marker.
   * @param {string} [options.style]      Marker CSS class (default: AD_MARKER).
   * @param {string} [options.namespace]  Grouping namespace.
   * @param {number} [options.color]      Marker colour as an integer (converted to hex).
   * @param {string} [options.tooltip]    Hover tooltip text.
   * @param {Array}  [options.icons]      Array of icon objects with thumbnails.
   * @param {string} [options.associatedClipId]
   * @param {number} [options.markerPositionMs]
   */
  constructor(start, end, options = {}) { // was: constructor(Q, c, W={})
    this.start = start;       // was: this.start = Q
    this.end = end;           // was: this.end = c
    this.active = true;       // was: this.active = !0
    this.color = '';
    this.internalId_ = nextInternalId++; // was: this.O = exw++

    this.id = options.id || '';
    this.priority = options.priority || 9;
    this.visible = options.visible || false;
    this.style = options.style || MarkerStyle.AD_MARKER;
    this.namespace = options.namespace || '';

    // Convert integer colour to hex string
    if (options.color !== undefined) {
      const hex = options.color.toString(16); // was: Q = Q.toString(16)
      this.color = `#${hex.padStart(6, '0')}`;
      // was: `#${Array(7 - Q.length).join("0")}${Q}`
    }

    this.tooltip = options.tooltip;

    // Filter icons to only those with valid thumbnail URLs
    this.icons = options.icons
      ? options.icons.filter(icon =>
          icon.thumbnails?.some(thumb => isValidUrl_(thumb.url)) // was: g.NP(K.url)
        )
      : null;

    this.associatedClipId = options.associatedClipId;
    this.markerPositionMs = options.markerPositionMs;

    // Defensive re-assignments (present in source, likely compiler artifact)
    this.visible = this.visible;
    this.style = this.style;
    this.start = this.start;
  }

  /**
   * Returns the external string identifier.
   * @returns {string}
   */
  getId() { // was: getId()
    return this.id;
  }

  /**
   * Returns a human-readable string representation.
   * @returns {string}
   */
  toString() { // was: toString()
    return `CueRange{${this.namespace}:${this.id}}[${formatTime_(this.start)}, ${formatTime_(this.end)}]`;
    // was: "CueRange{" + this.namespace + ":" + this.id + "}[" + e97(this.start) + ", " + e97(this.end) + "]"
  }

  /**
   * Tests whether a given time (and optional next-cue time) falls within
   * this range. A zero-length range matches its exact point.
   *
   * @param {number} time        Current time in seconds.
   * @param {number} [nextTime]  Optional end-of-window time.
   * @returns {boolean}
   */
  contains(time, nextTime = undefined) { // was: contains(Q, c)
    const afterStart = time >= this.start;
    const beforeEnd = time < this.end || (time === this.end && this.start === this.end);

    if (!afterStart || !beforeEnd) return false;

    if (nextTime == null) return true;

    return time < nextTime && nextTime <= this.end;
  }
}

// Ensure getId is available as an own property (matches source line 74116)
CueRange.prototype.getId = CueRange.prototype.getId;

// ---------------------------------------------------------------------------
// CueRangeCallback (internal)
// ---------------------------------------------------------------------------

/**
 * Internal record binding a callback to a cue-range slot for timed
 * event dispatch. Not exported — used internally by the cue-range system.
 *
 * [was: UWK]
 */
class CueRangeCallback {
  /**
   * @param {Function} callback   Handler to invoke when the cue fires.
   * @param {Object}   slot       The slot this callback is registered on.
   * @param {Object}   provider   [was: W] — data provider reference.
   * @param {Object}   config     [was: EG] — configuration data.
   * @param {Object}   context    [was: QC] — execution context.
   */
  constructor(callback, slot, provider, config, context) {
    this.callback = callback;   // was: this.callback = Q
    this.slot = slot;           // was: this.slot = c
    this.provider_ = provider;  // was: this.O = W
    this.config_ = config;      // was: this.EG = m
    this.context_ = context;    // was: this.QC = K
    this.state_ = null;         // was: this.W = null
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/**
 * Placeholder for `e97` — formats seconds to a display string.
 * @param {number} seconds
 * @returns {string}
 * @private
 */
function formatTime_(seconds) { // was: e97
  return String(seconds);
}

/**
 * Placeholder for URL validation.
 * @param {string} url
 * @returns {boolean}
 * @private
 */
function isValidUrl_(url) { // was: g.NP
  return typeof url === 'string' && url.length > 0;
}
