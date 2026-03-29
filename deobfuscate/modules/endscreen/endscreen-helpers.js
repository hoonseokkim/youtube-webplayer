/**
 * Endscreen helper functions
 *
 * Deobfuscated from: player_es6.vflset/en_US/endscreen.js
 * Lines 1-3 (IIFE wrapper / strict mode) and 98-135 (helper predicates and
 * prototype patches that wire endscreen logic into the player framework).
 *
 * The original IIFE wrapper:
 *   (function(g) {
 *       var window = this;
 *       'use strict';
 *       ...
 *   })
 * establishes the `g` (_yt_player) namespace reference used by every helper
 * below.
 */

import { PlayerApi } from '../../data/device-tail.js';  // was: g.HL
import { applyQualityConstraint } from '../../media/quality-constraints.js'; // was: d3
import { StateFlag } from '../../player/component-events.js'; // was: mV
import { animateGridScroll } from '../../player/video-loader.js'; // was: LY
import { getProgressBarMetrics } from '../../ui/progress-bar-impl.js'; // was: BC
import { createInt32Array } from '../../proto/varint-decoder.js'; // was: vl
import { CueRange } from '../../ui/cue-range.js';

// ── Helper predicates ────────────────────────────────────────────────

/**
 * Check whether the organic (non-ad) endscreen UI is enabled.
 *
 * Original name: kp9
 *
 * @param {Object} component - Endscreen component instance
 * @returns {boolean} true when organic endscreen UI should render
 */
export function isOrganicEndscreenEnabled(component) {
  const config = component.G();
  return config.applyQualityConstraint && !config.qY && !config.disableOrganicUi;
}

/**
 * Detect whether the underlying video data has changed since the last check,
 * based on the video's unique identifier (`Xw`).  Updates the component's
 * cached value so subsequent calls return false until the video changes again.
 *
 * Original name: YB9
 *
 * @param {Object} component - Endscreen component instance
 * @returns {boolean} true when the video data has changed
 */
export function hasVideoDataChanged(component) {
  const videoData = component.player.getVideoData();
  if (!videoData || component.W === videoData.Xw) {
    return false;
  }
  component.W = videoData.Xw;
  return true;
}

/**
 * Schedule the endscreen preload and load cue-range entries on the player
 * timeline.  A "preload" cue fires 10 seconds before the video ends and a
 * "load" cue fires at the very end (max-safe timestamp).
 *
 * Original name: p_Z
 *
 * @param {Object} component - Endscreen component instance
 */
export function scheduleEndscreenCueRanges(component) {
  component.player.qI('endscreen');

  const videoData = component.player.getVideoData();
  const preloadCue = new CueRange(
    Math.max((videoData.lengthSeconds - 10) * 1e3, 0),
    0x8000000000000,
    { id: 'preload', namespace: 'endscreen' }
  );
  const loadCue = new CueRange(
    0x8000000000000,
    0x8000000000000,
    { id: 'load', priority: 8, namespace: 'endscreen' }
  );

  component.player.StateFlag([preloadCue, loadCue]);
}

// ── Prototype patches ────────────────────────────────────────────────
// The original source patches several framework prototypes to expose
// endscreen-related accessors.  In the deobfuscated form we document
// their purpose here and re-export thin wrappers.

/**
 * PlayerApi.prototype.LY  (priority 9)
 * Delegates to app.LY() -- returns the endscreen data for the current video.
 *
 * Original: g.N0.prototype.LY = g.W3(9, function() { return this.app.LY() });
 */
export function patchPlayerApiEndscreenData(PlayerApi, priorityWrapper) {
  PlayerApi.prototype.animateGridScroll = priorityWrapper(9, function () {
    return this.app.animateGridScroll();
  });
}

/**
 * VideoDataProvider.prototype.LY  (priority 8)
 * Returns the endscreen renderer payload (BC) from the current video data.
 *
 * Original: g.Iy.prototype.LY = g.W3(8, function() { return this.getVideoData().BC });
 */
export function patchVideoDataEndscreen(VideoDataProvider, priorityWrapper) {
  VideoDataProvider.prototype.animateGridScroll = priorityWrapper(8, function () {
    return this.getVideoData().getProgressBarMetrics;
  });
}

/**
 * ModuleHost.prototype.vl  (priority 7)
 * Forwards endscreen visibility flag to the inner module.
 *
 * Original: g.HL.prototype.vl = g.W3(7, function(Q) { this.l9().vl(Q) });
 */
export function patchModuleHostEndscreen(ModuleHost, priorityWrapper) {
  ModuleHost.prototype.createInt32Array = priorityWrapper(7, function (visible) {
    this.l9().createInt32Array(visible);
  });
}

/**
 * EndscreenRenderer.prototype.vl  (priority 6)
 * Sets the endscreen visibility state and triggers a re-render.
 *
 * Original: g.LH.prototype.vl = g.W3(6, function(Q) {
 *     this.y9 !== Q && (this.y9 = Q, this.zO())
 * });
 */
export function patchEndscreenRendererVisibility(EndscreenRenderer, priorityWrapper) {
  EndscreenRenderer.prototype.createInt32Array = priorityWrapper(6, function (visible) {
    if (this.y9 !== visible) {
      this.y9 = visible;
      this.zO();
    }
  });
}
