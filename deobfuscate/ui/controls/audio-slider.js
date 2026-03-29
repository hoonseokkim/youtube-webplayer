/**
 * Audio / Slider Controls — progress bar implementation (main seek bar),
 * playback speed slider, remote cast button, and quality menu.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: 111800–112999
 *     ~111800–112252  (g.ZRD continued — ProgressBar methods)
 *     ~112254–112310+ (Ej9  — RemoteCastButton)
 *     ~112710–112952  (quality menu — QualityMenuItem)
 *     ~112954–112999  (Qi   — PlaybackSpeedInputSlider)
 *
 * [was: g.ZRD (partial), Ej9, quality menu, Qi]
 */

import { logClick } from '../../data/visual-element-tracking.js';  // was: g.pa
import { pauseVideo, seekBy, seekTo } from '../../player/player-events.js';  // was: g.pauseVideo, g.seekBy, g.seekTo
import { TimedMarker } from '../marker-tail.js';  // was: g.ZfO
import { StateFlag } from '../../player/component-events.js'; // was: mV
import { clearMarkerOverlays } from '../progress-bar-impl.js'; // was: TM
import { appendMarkerOverlay } from '../progress-bar-impl.js'; // was: sqd
import { positionMarkerOverlays } from '../progress-bar-impl.js'; // was: UC
import { SIGNAL_TRACKING } from '../../data/session-storage.js'; // was: zT
import { appendHeatMapTile } from '../progress-bar-impl.js'; // was: Hfw
import { disableFineScrubbing } from '../seek-bar-tail.js'; // was: Sc
import { buildQualityMenuItemFromMap } from '../seek-bar-tail.js'; // was: Rgd
import { Tooltip } from '../control-misc.js';
import { PlayerComponent } from '../../player/component.js';
import { getPlayerSize, getPlaybackQuality, setPlaybackRate } from '../../player/time-tracking.js';
import { getPreferredQuality } from '../../player/player-api.js';
import { QualityLabel } from '../../media/codec-tables.js';
import { InputSlider } from '../timed-markers.js';

// ---------------------------------------------------------------------------
// ProgressBar (continued methods)
// ---------------------------------------------------------------------------

/**
 * Additional methods on the main progress/seek bar component. These extend
 * the ProgressBar class defined in progress-bar.js with timed-marker parsing,
 * seek-bar interaction, chapter navigation, heat-map decoration, fine-scrubbing
 * integration, and clip boundary handling.
 *
 * [was: g.ZRD continued] (lines 111800–112252)
 */

/**
 * Parses marker data from video data and registers cue ranges for
 * timed markers (MARKER_TYPE_TIMESTAMPS) and heat maps (MARKER_TYPE_HEATMAP).
 * For timestamps, creates cue ranges and registers them with the player.
 * For heat maps, renders the engagement curve on each chapter segment.
 *
 * @returns {boolean} True if any timed markers were registered.
 * [was: zT] (line 111803)
 */
export function parseMarkerData(progressBar) {
  let hasTimedMarkers = false; // was: Q
  const videoData = progressBar.api.getVideoData(); // was: c
  if (!videoData) return hasTimedMarkers;

  progressBar.api.qI('timedMarkerCueRange');
  clearTimedMarkers(progressBar); // was: TM(this)

  for (const entityKey of videoData.Ka) { // was: X
    const markerType = progressBar.markerData[entityKey]?.markerType; // was: W
    const markers = progressBar.markerData[entityKey]?.markers; // was: m
    if (!markers) break;

    if (markerType === 'MARKER_TYPE_TIMESTAMPS') {
      // Parse each marker into a TimedMarker object
      for (const marker of markers) {
        const timedMarker = new TimedMarker(); // was: ZfO
        timedMarker.title = marker.title?.simpleText || '';
        timedMarker.timeRangeStartMillis = Number(marker.startMillis);
        timedMarker.durationMillis = Number(marker.durationMillis); // was: Q.W
        timedMarker.onActiveCommand = marker.onActive?.innertubeCommand;
        addTimedMarker(progressBar, timedMarker); // was: sqd(this, Q)
      }

      // Sort markers and register cue ranges
      sortMarkers(progressBar, progressBar.timedMarkers); // was: UC(this, this.L)
      const cueRanges = buildTimedMarkerCueRanges(progressBar); // was: inline loop
      progressBar.api.StateFlag(cueRanges);

      // Check if any markers are from smart-skip (which disables chapter display)
      let isChapterSource = true;
      for (const marker of markers) {
        if (marker.sourceType === 'SOURCE_TYPE_SMART_SKIP') {
          isChapterSource = false;
          break;
        }
      }
      if (isChapterSource) {
        progressBar.activeMarkerSet = progressBar.markerData[entityKey]; // was: this.xi
      }
      hasTimedMarkers = true;

    } else if (markerType === 'MARKER_TYPE_HEATMAP') {
      const markerSet = progressBar.markerData[entityKey];
      if (markerSet?.markers) {
        const minHeight = markerSet.markersMetadata?.heatmapMetadata?.minHeightDp ?? 0; // was: W
        const maxHeight = markerSet.markersMetadata?.heatmapMetadata?.maxHeightDp ?? 60; // was: K
        const chapterCount = progressBar.chapters.length; // was: T

        // Distribute heatmap markers across chapter segments
        let prevMarker = null; // was: r
        for (let i = 0; i < chapterCount; i++) { // was: U
          const chapterStart = progressBar.chapters[i].startTime; // was: I
          const chapterEnd = i === chapterCount - 1
            ? Infinity
            : progressBar.chapters[i + 1].startTime; // was: A

          // Create heat map chapter if needed
          if (i === progressBar.heatMapChapters.length) {
            createHeatMapChapter(progressBar); // was: Hfw(this)
          }

          const chapterMarkers = []; // was: e
          if (prevMarker) chapterMarkers.push(prevMarker);
          for (const marker of markerSet.markers) { // was: V
            const startMs = Number(marker.startMillis); // was: B
            if (startMs >= chapterStart && startMs <= chapterEnd) {
              chapterMarkers.push(marker);
            }
          }

          if (maxHeight > 0) {
            // progressBar.heatMapContainer.style.height = `${maxHeight}px`;
          }
          // qbW(progressBar.heatMapChapters[i], chapterMarkers, minHeight, maxHeight, i === 0);

          if (chapterMarkers.length > 0) {
            prevMarker = chapterMarkers[chapterMarkers.length - 1];
          }
        }
        // g.oi(progressBar); — trigger layout recalc
      }

      // Parse heatmap decorations (labels at specific times)
      const decorations = [];
      const decoData = markerSet?.markersDecoration?.timedMarkerDecorations;
      if (decoData) {
        for (const deco of decoData) {
          decorations.push({
            visibleTimeRangeStartMillis: deco.visibleTimeRangeStartMillis ?? -1,
            visibleTimeRangeEndMillis: deco.visibleTimeRangeEndMillis ?? -1,
            decorationTimeMillis: deco.decorationTimeMillis ?? NaN,
            label: deco.label ? extractText(deco.label) : '', // was: g.rK(...)
          });
        }
      }
      progressBar.heatMarkersDecorations = decorations;
    }
  }

  videoData.vQ = progressBar.timedMarkers; // was: c.vQ = this.L
  // g.L(progressBar.element, 'ytp-timed-markers-enabled', hasTimedMarkers);
  return hasTimedMarkers;
}

/**
 * Recalculates layout dimensions, marker positions, and fine-scrubbing bounds.
 * [was: b3] (line 111890)
 */
export function recalculateLayout(progressBar) {
  // g.oi(progressBar);
  // rd(progressBar); — recalculate positions
  // sortMarkers(progressBar, progressBar.timedMarkers);
  if (progressBar.fineScrubbing) {
    const offsetX = 0; // was: g.Tk(progressBar.element).x || 0
    progressBar.fineScrubbing.b3(offsetX, progressBar.totalWidth); // was: this.J
  }
}

/**
 * Updates video data — triggers full re-parse of chapters, markers, and
 * heat maps. Handles both server-provided chapters and entity-store chapters.
 * @param {Object} videoData     [was: Q]
 * @param {boolean} [isNewData=false] [was: c]
 * [was: updateVideoData] (line 111956)
 */
export function updateProgressBarVideoData(progressBar, videoData, isNewData = false) {
  const isPlayable = !!videoData?.isPlayable(); // was: W — Xq()
  if (isPlayable) {
    // Determine live-buffer mode, load chapters from markersMap or entity store,
    // parse heatmap data, register cue ranges
  }
  // Update seekable state
  if (isNewData && isPlayable) {
    // Reset clip boundaries, clear heat maps, reset fine scrubbing
    // Call parseMarkerData if entity store markers are available
  }
  // Recalculate layout
}

/**
 * Handles player state changes — cancels tooltip on seeking end,
 * pauses video when fine scrubbing, and hides scrubber on certain states.
 * @param {Object} stateChange [was: Q]
 * [was: aq] (line 112022)
 */
export function onProgressBarStateChange(progressBar, stateChange) {
  if (progressBar.tooltip && !stateChange.state.isSeeking()
    && progressBar.api.getPresentingPlayerType() !== 3) {
    progressBar.tooltip.cancel();
  }
  if (progressBar.fineScrubbing?.isEnabled && stateChange.state.isSeeking()) {
    progressBar.api.pauseVideo();
  }
  // Toggle scrubber-button visibility based on state
}

/**
 * Updates the loop/clip range on the progress bar.
 * @param {Object|undefined} loopRange [was: Q]
 * [was: x3] (line 112028)
 */
export function setLoopRange(progressBar, loopRange) {
  const changed = !!progressBar.loopRange !== !!loopRange;
  progressBar.loopRange = loopRange;
  // Update clip start/end icons, titles, and boundaries
  // If clips mode changed, re-parse video data
}

// ---------------------------------------------------------------------------
// Hover / Drag Interactions (progress bar)
// ---------------------------------------------------------------------------

/**
 * Called when the mouse enters the progress bar — publishes
 * progressBarHoverStart event.
 * [was: mA] (line 112045)
 */
export function onProgressBarHoverStart(progressBar) {
  progressBar.api.publish('progressBarHoverStart');
}

/**
 * Called during progress bar hover — updates the tooltip with time,
 * chapter title, heat-map decoration labels, and fine-scrubbing pullup hint.
 * @param {number} pageX   [was: Q]
 * @param {number} pageY   [was: c]
 * @param {Element} [target] [was: W]
 * [was: t6] (line 112048)
 */
export function onProgressBarHoverMove(progressBar, pageX, pageY, target = undefined) {
  // Compute seek time from pixel position
  // Show chapter-specific hover effects
  // Show heatmap hover effects
  // Position and update the tooltip with time, chapter, decorations
  // g.xK(progressBar.api.getRootNode(), 'ytp-progress-bar-hover');
}

/**
 * Called when the mouse leaves the progress bar.
 * [was: by] (line 112131)
 */
export function onProgressBarHoverEnd(progressBar) {
  progressBar.hideTooltip(); // was: this.K()
  // g.n6(progressBar.api.getRootNode(), 'ytp-progress-bar-hover');
  // progressBar.api.publish('progressBarHoverEnd');
}

/**
 * Called on drag-start — begins seeking, possibly enabling fine scrubbing.
 * @param {number} pageX    [was: Q]
 * @param {number} pageY    [was: c]
 * [was: Eh] (line 112140)
 */
export function onProgressBarDragStart(progressBar, pageX, pageY) {
  // Record start position for fine-scrubbing threshold
  // Seek to the clicked position
  // Pause if was playing (will resume on drag-end)
  // g.xK(progressBar.element, 'ytp-drag');
}

/**
 * Called on drag-end — commits the seek, resumes playback if needed,
 * and evaluates whether to enable fine scrubbing.
 * [was: TB] (line 112154)
 */
export function onProgressBarDragEnd(progressBar) {
  // If fine-scrubbing threshold met, enable fine scrubbing
  // Otherwise, commit the seek and resume playback
  // g.n6(progressBar.element, 'ytp-drag');
}

/**
 * Called during drag — updates the seek position and fine-scrubbing pullup.
 * @param {number} pageX   [was: Q]
 * @param {number} pageY   [was: c]
 * [was: W1] (line 112181)
 */
export function onProgressBarDragMove(progressBar, pageX, pageY) {
  // Compute seek time from pixel position
  // Update cursor icon (left/right arrows for directional feedback)
  // If fine scrubbing is initializing, track the pullup distance
}

/**
 * Handles keyboard navigation on the progress bar.
 * @param {KeyboardEvent} event [was: Q]
 * [was: Gf] (line 111917)
 */
export function onProgressBarKeyDown(progressBar, event) {
  if (event.defaultPrevented) return;
  let handled = false;
  switch (event.keyCode) {
    case 36: // Home
      progressBar.api.seekTo(0, undefined, undefined, undefined, 79);
      handled = true;
      break;
    case 35: // End
      progressBar.api.seekTo(Infinity, undefined, undefined, undefined, 80);
      handled = true;
      break;
    case 34: // PageDown — seek back 60s
      progressBar.api.seekBy(-60, undefined, undefined, 76);
      handled = true;
      break;
    case 33: // PageUp — seek forward 60s
      progressBar.api.seekBy(60, undefined, undefined, 75);
      handled = true;
      break;
    case 38: // ArrowUp — seek forward 5s
      progressBar.api.seekBy(5, undefined, undefined, 72);
      handled = true;
      break;
    case 40: // ArrowDown — seek back 5s
      progressBar.api.seekBy(-5, undefined, undefined, 71);
      handled = true;
      break;
  }
  if (handled) event.preventDefault();
}

// ---------------------------------------------------------------------------
// Ad / Clip Marker Management
// ---------------------------------------------------------------------------

/**
 * Adds ad break markers to the progress bar.
 * @param {Array} markers [was: Q]
 * [was: pB] (line 112214)
 */
export function addAdMarkers(progressBar, markers) {
  for (const marker of markers) {
    if (!marker.visible) continue;
    const id = marker.getId();
    if (progressBar.adMarkers[id]) continue;
    // Create a div element for the marker, position it on the bar
    // progressBar.adMarkers[id] = marker;
    // progressBar.adMarkerElements[id] = element;
  }
}

/**
 * Removes ad break markers from the progress bar.
 * @param {Array} markers [was: Q]
 * [was: I_] (line 112230)
 */
export function removeAdMarkers(progressBar, markers) {
  for (const marker of markers) {
    // MVK(progressBar, marker); — remove element and data
  }
}

/**
 * Exits fine scrubbing (restores saved time).
 * @param {boolean} [logClick] [was: Q]
 * [was: Ei] (line 112234)
 */
export function exitFineScrubbing(progressBar, logClick) {
  if (progressBar.fineScrubbing) {
    progressBar.fineScrubbing.onExit(logClick != null);
    resetFineScrubbingUI(progressBar); // was: Sc(this)
  }
}

/**
 * Plays from the fine-scrubbing position.
 * @param {boolean} [logClick] [was: Q]
 * [was: Rt] (line 112238)
 */
export function playFromFineScrubbing(progressBar, logClick) {
  if (progressBar.fineScrubbing) {
    progressBar.fineScrubbing.play(logClick != null);
    resetFineScrubbingUI(progressBar);
  }
}

// Placeholder helpers
function clearTimedMarkers(_pb) { /* was: clearMarkerOverlays */ }
function addTimedMarker(_pb, _marker) { /* was: appendMarkerOverlay */ }
function sortMarkers(_pb, _markers) { /* was: positionMarkerOverlays */ }
function buildTimedMarkerCueRanges(_pb) { return []; /* handleNoSelectableFormats in SIGNAL_TRACKING */ }
function createHeatMapChapter(_pb) { /* was: appendHeatMapTile */ }
function resetFineScrubbingUI(_pb) { /* was: disableFineScrubbing */ }
function extractText(_label) { return ''; /* was: logQoeEvent */ }

/** Simple data class for a timed marker. [was: ZfO] */
class TimedMarker {
  title = '';
  timeRangeStartMillis = 0;
  durationMillis = 0;
  onActiveCommand = undefined;
}

// ---------------------------------------------------------------------------
// RemoteCastButton
// ---------------------------------------------------------------------------

/**
 * "Play on TV" / Chromecast button. Shows when MDX receivers are available,
 * toggles between connected and disconnected icons.
 *
 * Template:
 *   <button class="ytp-remote-button ytp-button"
 *           title="Play on TV" data-priority="10">
 *     {{icon}}
 *   </button>
 *
 * [was: Ej9] (line 112254)
 */
export class RemoteCastButton /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Settings menu reference.
   * @type {Object}
   */
  settingsMenu; // was: this.Ik

  /**
   * Current icon state: 1=disconnected, 2=connected.
   * @type {number|null}
   */
  iconState = null; // was: this.W

  /**
   * @param {Object} player      [was: Q]
   * @param {Object} settingsMenu [was: c]
   */
  constructor(player, settingsMenu) {
    // super({ C: 'button', yC: ['ytp-remote-button', 'ytp-button'], ... });
    this.player = player;
    this.settingsMenu = settingsMenu;
    this.iconState = null;

    // Bind: onMdxReceiversChange, presentingplayerstatechange, appresize
    // player.createClientVe(this.element, this, 139118);
    this.updateVisibility(); // was: this.ZF()
    // this.listen('click', this.onClick, this);
  }

  /**
   * Whether the cast is currently active.
   * @returns {boolean}
   * [was: isActive]
   */
  isActive() {
    return !!this.player.getOption('remote', 'casting');
  }

  /**
   * Updates button visibility and icon based on receiver availability.
   * [was: ZF]
   */
  updateVisibility() {
    let hasReceivers = false;
    if (this.player.getOptions().includes('remote')) {
      hasReceivers = this.player.getOption('remote', 'receivers').length > 1;
    }
    const visible = hasReceivers && this.player.bX().getPlayerSize().width >= 400;
    // this.setVisible(visible);
    // this.player.logVisibility(this.element, this.isVisible);

    let newState = 1; // disconnected
    if (hasReceivers && this.isActive()) newState = 2; // connected

    if (this.iconState !== newState) {
      this.iconState = newState;
      // Update SVG icon based on state and delhi_modern_web_player_icons flag
    }
  }
}

// ---------------------------------------------------------------------------
// QualityMenuItem (partial — lines 112710–112952)
// ---------------------------------------------------------------------------

/**
 * Quality (resolution) menu item in the settings menu. Supports both
 * legacy quality levels (auto, hd1080, etc.) and new format-ID-based
 * quality selection. Shows an inline survey ("Looks good?") for
 * quality experiments.
 *
 * Key methods:
 *   - updateAvailableQualities / dH  — refreshes the option list
 *   - onSelect / W                   — applies the chosen quality
 *   - formatLabel / A                — generates the display label
 *   - createOption / Y               — creates a menu item option
 *
 * [was: unnamed class, lines ~112710–112952]
 */
export class QualityMenuItem /* extends g.lN */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Settings menu reference.
   * @type {Object}
   */
  settingsMenu; // was: this.Ik (from parent class ref: this.jG)

  /**
   * Whether using the new format-ID-based quality menu.
   * @type {boolean}
   */
  isNewMenu; // was: this.K

  /**
   * Map from option key to quality/format details (new menu).
   * @type {Object}
   */
  qualityMap = {}; // was: this.D

  /**
   * Map from option key to quality details (legacy menu).
   * @type {Object}
   */
  legacyQualityMap = {}; // was: this.T2

  /**
   * Set of available quality option keys (new menu).
   * @type {Set<string>}
   */
  availableQualities = new Set(); // was: this.XI

  /**
   * Current playback quality label (e.g. "1080p").
   * @type {string}
   */
  currentQualityLabel = ''; // was: this.Ie

  /**
   * Current playback quality key (e.g. "hd1080").
   * @type {string}
   */
  currentQuality = ''; // was: this.b0

  /**
   * Whether paygated quality tiers are available.
   * @type {boolean}
   */
  hasPaygatedQualities = false; // was: this.S

  /**
   * Updates the selected quality display based on the player's current state.
   * [was: PA] (line 112819)
   */
  updateSelectedDisplay() {
    if (this.isNewMenu) {
      const preferred = this.player.getPreferredQuality(); // was: Q
      if (!this.availableQualities.has(preferred)) return;
      this.currentQuality = this.player.getPlaybackQuality(); // was: this.b0
      this.currentQualityLabel = this.player.getPlaybackQualityLabel(); // was: this.Ie
      if (preferred === 'auto') {
        this.setSelected(preferred);
        this.setContent(this.formatLabel(preferred));
      } else {
        this.setSelected(this.currentQualityLabel);
      }
    } else {
      const preferred = this.player.getPreferredQuality();
      if (this.options[preferred]) {
        this.currentQuality = this.player.getPlaybackQuality();
        this.setSelected(preferred);
        if (preferred === 'auto') {
          this.setContent(this.formatLabel(preferred));
        }
      }
    }
  }

  /**
   * Applies the selected quality option.
   * @param {string} optionKey [was: Q]
   * [was: W] (line 112832)
   */
  onSelect(optionKey) {
    if (optionKey === 'missing-qualities') return;
    // super.onSelect(optionKey);

    const details = this.isNewMenu ? this.qualityMap[optionKey] : this.legacyQualityMap[optionKey];
    const quality = details?.quality; // was: W
    const formatId = details?.formatId; // was: m
    const paygated = details?.paygatedQualityDetails; // was: c
    const endpoint = paygated?.endpoint; // was: K

    if (paygated) {
      this.player.logClick(this.options[optionKey]?.element);
    }

    if (this.isNewMenu) {
      // Handle paygated notification or upsell
      if (endpoint) {
        // g.xt(this.player, 'innertubeCommand', endpoint);
        // Check if it's a notification (show) or redirect (return early)
      }
      if (formatId) {
        this.player.setPlaybackQuality(quality, formatId);
      } else {
        this.player.setPlaybackQuality(quality);
      }
    } else {
      // Legacy path
      if (endpoint) {
        // g.xt(this.player, 'innertubeCommand', endpoint);
      }
      this.player.setPlaybackQuality(optionKey);
    }

    this.settingsMenu.close(); // was: this.Ik.HB()
    this.updateAvailableQualities(); // was: this.dH()
  }

  /**
   * Formats a quality option key into a display label with optional
   * secondary "auto" sublabel.
   * @param {string}  optionKey  [was: Q]
   * @param {boolean} [isCompact=false] [was: c]
   * @returns {Object} Template definition.
   * [was: A] (line 112933)
   */
  formatLabel(optionKey, isCompact = false) {
    if (optionKey === 'missing-qualities') {
      return { C: 'div', eG: 'Missing options?' };
    }
    if (optionKey === 'handleNoSelectableFormats-survey') return '';

    let labels;
    if (this.hasPaygatedQualities || this.isNewMenu) {
      labels = [buildQualityLabel(this, optionKey, isCompact, false)]; // was: sC(this, Q, c, false)
    } else {
      labels = [buildLegacyLabel(this, optionKey)]; // was: Rgd(this, Q)
    }

    // Append secondary "auto" label when preference is auto and this is the auto option
    const preferred = this.player.getPreferredQuality();
    if (!isCompact && preferred === 'auto' && optionKey === 'auto') {
      labels.push(' ');
      // Append the current actual quality as a secondary label
    }

    return { C: 'div', V: labels };
  }

  /** Placeholder */ updateAvailableQualities() { /* was: dH */ }
}

// Placeholder helpers for quality label building
function buildQualityLabel(_menu, _key, _compact, _secondary) { return ''; /* was: sC */ }
function buildLegacyLabel(_menu, _key) { return ''; /* was: buildQualityMenuItemFromMap */ }

// ---------------------------------------------------------------------------
// PlaybackSpeedInputSlider
// ---------------------------------------------------------------------------

/**
 * Playback speed slider using `<input type="range">`. Extends InputSlider
 * with speed-specific behavior: indicator badge, premium varispeed support,
 * and debounced rate application.
 *
 * Template (header):
 *   <div class="ytp-speedslider-indicator-container">
 *     <div class="ytp-speedslider-badge" />
 *     <p class="ytp-speedslider-text" />
 *   </div>
 *
 * [was: Qi] (line 112954)
 */
export class PlaybackSpeedInputSlider /* extends InputSlider / InputSlider */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Debounced callback to apply the playback rate.
   * @type {Function}
   */
  debouncedApply; // was: this.S — $G(this.applyRate_, 50, this)

  /**
   * The speed text element (e.g. "1.50x").
   * @type {HTMLElement}
   */
  speedText; // was: this.Y

  /**
   * The premium badge element.
   * @type {HTMLElement}
   */
  premiumBadge; // was: this.b0

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    const rates = player.getAvailablePlaybackRates();
    const min = rates[0];
    const max = rates[rates.length - 1];
    // super(min, max, 0.05, player.getPlaybackRate(), headerComponent);

    this.player = player;
    // this.debouncedApply = $G(this.applyRate_, 50, this);

    // g.xK(this.inputElement, 'ytp-speedslider');
    this.speedText = null;    // was: this.z2('ytp-speedslider-text')
    this.premiumBadge = null; // was: this.z2('ytp-speedslider-badge')

    if (player.X('web_enable_varispeed_panel')) {
      // g.xK(this.inputElement, 'ytp-varispeed-input-slider');
    }
    this.updateSpeedDisplay(); // was: this.Ou()
    // this.bindEvent(this.inputElement, 'change', this.onChange);
  }

  /**
   * Handles native input event — updates speed display.
   * [was: K]
   */
  onInput() {
    // super.onInput();
    if (this.speedText) this.updateSpeedDisplay();
  }

  /**
   * Handles change event — snaps to 0.05 increments for premium varispeed.
   * [was: Ie]
   */
  onChange() {
    if (this.player.X('enable_web_premium_varispeed')) {
      const snapped = Math.round(this.currentValue / 0.05) * 0.05;
      // setSliderValue(this, snapped);
    }
    this.debouncedApply?.();
  }

  /**
   * Applies the current slider value as the playback rate.
   * [was: T2]
   * @private
   */
  applyRate_() {
    this.player.setPlaybackRate(this.currentValue, true);
  }

  /**
   * Updates the speed text display and premium badge visibility.
   * [was: Ou]
   */
  updateSpeedDisplay() {
    if (this.speedText) {
      this.speedText.textContent = `${this.currentValue.toFixed(2)}x`;
    }
    const isPremiumSpeed = this.currentValue > 2 && this.player.X('enable_web_premium_varispeed');
    if (this.premiumBadge) {
      this.premiumBadge.classList.toggle('ytp-speedslider-premium-badge', isPremiumSpeed);
      this.premiumBadge.setAttribute('aria-label', isPremiumSpeed ? 'Premium' : '');
    }
  }

  /**
   * Handles keyboard events — applies rate on arrow key and optionally
   * prevents default to keep focus in the slider.
   * @param {KeyboardEvent} event [was: Q]
   * [was: J]
   */
  onKeyDown(event) {
    // super.onKeyDown(event);
    this.debouncedApply?.();
    this.updateSpeedDisplay();
    if (this.player.X('web_enable_varispeed_panel')) {
      if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        event.preventDefault();
      }
    } else {
      event.preventDefault();
    }
  }
}
