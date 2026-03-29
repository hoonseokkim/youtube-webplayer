/**
 * seek-bar-tail.js -- Progress-bar tail: hover/drag event wiring,
 * chapter-aware seek, clip/loop range rendering, chapter progress bars,
 * fine-scrubbing clip-path cutout, quality/speed menus, caption toggle,
 * live badge, and time-to-seek display.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 * Source lines: 51500-51999
 */

import { getConfig, listen, unlisten } from '../core/composition-helpers.js';  // was: g.v, g.s7, g.fW
import { forEach } from '../core/event-registration.js';  // was: g.mfm
import { updateLayout } from '../modules/endscreen/autoplay-countdown.js';  // was: g.qk
import { getChapterGap } from './progress-bar-impl.js';  // was: g.Xk
import { sendPostRequest } from '../network/request.js'; // was: ms
import { PlayerContainer } from '../player/player-container.js'; // was: Bj4
import { ModuleManager } from '../player/module-setup.js'; // was: bvn
import { dispose } from '../ads/dai-cue-range.js';
import { toggleClass, setStyle, removeNode } from '../core/dom-utils.js';
import { getDuration, getPlayerSize, getPlaybackRate } from '../player/time-tracking.js';
import { clamp } from '../core/math-utils.js';
import { toString } from '../core/string-utils.js';
import { getModule } from '../player/module-registry.js';
import { remove } from '../core/array-utils.js';
import { Tooltip } from './control-misc.js';
// TODO: resolve g.HoverManager
// TODO: resolve g.clamp
// TODO: resolve g.getModule
// TODO: resolve g.qualityHeights
// TODO: resolve g.removeNode
// TODO: resolve g.requestRender
// TODO: resolve g.setStyle
// TODO: resolve g.toggleClass

// ---------------------------------------------------------------------------
// Seek-bar hover/drag event wiring -- Source lines 51500-51523
// ---------------------------------------------------------------------------

/**
 * Wire up hover and drag event subscriptions on the progress bar,
 * and optionally the "Delhi modern" cutout overlay.
 *
 * Called when the progress bar becomes interactive.
 * [was: inline block at ~51500]
 *
 * @param {SeekBar} seekBar [was: Q]
 */
export function wireProgressBarEvents(seekBar) { // was: inlined in enable/disable block
  seekBar.hoverManager = new g.HoverManager(seekBar.progressBar, true); // was: g.iG, .Y
  if (
    seekBar.api.getExperiment("enable_smart_skip_player_controls_shown_on_web_increased_triggering_sensitivity")
  ) {
    seekBar.hoverManager.subscribe("hoverstart", seekBar.onHoverStart, seekBar); // was: .mA
  }
  seekBar.hoverManager.subscribe("hovermove", seekBar.onHoverMove, seekBar);   // was: .t6
  seekBar.hoverManager.subscribe("hoverend", seekBar.onHoverEnd, seekBar);     // was: .by
  seekBar.hoverManager.subscribe("dragstart", seekBar.onDragStart, seekBar);   // was: .Eh
  seekBar.hoverManager.subscribe("dragmove", seekBar.onDragMove, seekBar);     // was: .W1
  seekBar.hoverManager.subscribe("dragend", seekBar.onDragEnd, seekBar);       // was: .TB

  // Modern "Delhi" cutout overlay
  if (
    seekBar.api &&
    seekBar.api.getExperiment("delhi_modern_web_player") &&
    seekBar.api.getExperiment("delhi_modern_web_player_cutout")
  ) {
    seekBar.cutoutHoverManager = new g.HoverManager(seekBar.progressBar, true); // was: .AA
    seekBar.cutoutHoverManager.subscribe("hoverstart", () => {
      seekBar.isCutoutHovered = true; // was: .FO
      updateClipPath(seekBar); // was: nv
    }, seekBar);
    seekBar.cutoutHoverManager.subscribe("hoverend", () => {
      seekBar.isCutoutHovered = false;
      updateClipPath(seekBar);
    }, seekBar);
  }

  seekBar.keydownListener = seekBar.listen("keydown", seekBar.onKeyDown); // was: .xq, .Gf
}

/**
 * Disable the seek bar, tearing down hover/drag subscriptions.
 * [was: inline block at ~51518-51522]
 * @param {SeekBar} seekBar [was: Q]
 */
export function disableSeekBar(seekBar) {
  seekBar.element.setAttribute("aria-disabled", "true");
  seekBar.unlisten(seekBar.keydownListener); // was: .Xd(.xq)
  seekBar.hoverManager.cancel();
  seekBar.hoverManager.dispose();
  seekBar.hoverManager = null;
}

// ---------------------------------------------------------------------------
// Fine-scrubbing reset -- Source lines 51525-51532
// ---------------------------------------------------------------------------

/**
 * Disable fine-scrubbing mode and reset all transforms.
 * [was: Sc]
 * @param {SeekBar} seekBar [was: Q]
 */
export function disableFineScrubbing(seekBar) { // was: Sc
  if (seekBar.fineScrubber) { // was: .O
    seekBar.fineScrubber.disable();
    seekBar.fineScrubHeight = 0; // was: .JJ
    seekBar.scrubTrack.style.removeProperty("transform");        // was: .b0
    seekBar.progressBar.style.removeProperty("transform");
    seekBar.scrubRegion.style.removeProperty("height");           // was: .Y0
    if (seekBar.element.parentElement) {
      seekBar.element.parentElement.style.removeProperty("height");
    }
  }
}

// ---------------------------------------------------------------------------
// Chapter repeat range -- Source lines 51534-51544
// ---------------------------------------------------------------------------

/**
 * Toggle the "repeating chapter" visual highlight on chapter segments.
 * [was: ay3]
 * @param {SeekBar} seekBar  [was: Q]
 * @param {Object}  [prevLoop] [was: c]
 */
export function updateRepeatChapterRange(seekBar, prevLoop) { // was: ay3
  if (seekBar.loopRange?.type === "repeatChapter" || prevLoop?.type === "repeatChapter") {
    if (prevLoop) {
      const prevSeg = seekBar.chapters[findChapterIndex(seekBar.chapters, prevLoop.startTimeMs)]; // was: LI
      g.toggleClass(prevSeg.element, "ytp-repeating-chapter", false); // was: g.L
    }
    if (seekBar.loopRange) { // was: .x$
      const curSeg = seekBar.chapters[findChapterIndex(seekBar.chapters, seekBar.loopRange.startTimeMs)];
      g.toggleClass(curSeg.element, "ytp-repeating-chapter", true);
    }
    seekBar.chapters.forEach((seg) => {
      g.toggleClass(seg.element, "ytp-exp-chapter-hover-container", !seekBar.loopRange);
    });
  }
}

// ---------------------------------------------------------------------------
// Clip / loop range rendering -- Source lines 51546-51567
// ---------------------------------------------------------------------------

/**
 * Recompute and position the clip start/end markers and tinted overlays.
 * [was: tg]
 * @param {SeekBar} seekBar [was: Q]
 */
export function updateClipRange(seekBar) { // was: tg
  let isLoopActive = !!seekBar.loopRange && seekBar.api.getPresentingPlayerType() !== 2;
  let clipStart = seekBar.clipStart;
  let clipEnd = seekBar.clipEnd;
  let showStart = true;
  let showEnd = true;

  if (isLoopActive && seekBar.loopRange) {
    clipStart = seekBar.loopRange.startTimeMs / 1000;
    clipEnd = seekBar.loopRange.endTimeMs / 1000;
  } else {
    showStart = clipStart > seekBar.timeRange.start; // was: .A.O
    showEnd = seekBar.timeRange.duration > 0 && clipEnd < seekBar.timeRange.duration; // was: .A.W
  }

  if (seekBar.loopRange?.postId || seekBar.loopRange?.type === "repeatChapter") {
    showEnd = false;
    showStart = false;
  }

  g.toggleClass(seekBar.element, "ytp-loop-range-enabled", isLoopActive);
  g.toggleClass(seekBar.element, "ytp-clip-start-enabled", showStart);
  g.toggleClass(seekBar.element, "ytp-clip-end-enabled", showEnd);

  const startFrac = showStart ? toFraction(seekBar.timeRange, clipStart, 0) : 0;   // was: lL
  const endFrac = showEnd ? toFraction(seekBar.timeRange, clipEnd, 1) : 1;

  seekBar.clipStartMarker.style.left = `${Math.round(startFrac * 1000) / 10}%`;     // was: .qQ
  seekBar.clipEndMarker.style.left = `${Math.round(endFrac * 1000) / 10}%`;          // was: .MQ
  seekBar.startOverlay.style.width = `${Math.round(startFrac * 1000) / 10}%`;        // was: .gA
  seekBar.endOverlay.style.left = `${Math.round(endFrac * 1000) / 10}%`;             // was: .QE
  seekBar.endOverlay.style.width = `${Math.round((1 - endFrac) * 1000) / 10}%`;
}

// ---------------------------------------------------------------------------
// Chapter-aware seek position -- Source lines 51569-51593
// ---------------------------------------------------------------------------

/**
 * Convert a pixel offset into a time position, accounting for chapters.
 * [was: Fk]
 * @param {SeekBar} seekBar   [was: Q]
 * @param {Object}  position  [was: c]
 * @returns {number} time in seconds
 */
export function pixelToTime(seekBar, position) { // was: Fk
  let time = timeFromFraction(seekBar.timeRange, position.fraction); // was: uH_
  if (seekBar.chapters.length > 1) {
    const chIdx = findChapterAtPixel(seekBar, position.pixelX, true); // was: HC
    let pixelSum = 0;
    for (let i = 0; i < chIdx; i++) {
      if (seekBar.chapters[i].width > 0) {
        pixelSum += seekBar.chapters[i].width;
        pixelSum += getChapterGap(seekBar); // was: Xk
      }
    }
    const chapter = seekBar.chapters[chIdx];
    const nextStart = chIdx === seekBar.chapters.length - 1
      ? seekBar.timeRange.duration * 1000 // was: .A.W
      : seekBar.chapters[chIdx + 1].startTime;
    time = (chapter.startTime + (position.pixelX - pixelSum) / chapter.width *
      (nextStart - chapter.startTime)) / 1000 || 0;
  }
  return time;
}

/**
 * Find which chapter segment a pixel X falls into.
 * [was: HC]
 * @param {SeekBar} seekBar    [was: Q]
 * @param {number}  pixelX     [was: c]
 * @param {boolean} [accountForGaps=false] [was: W]
 * @returns {number} chapter index
 */
export function findChapterAtPixel(seekBar, pixelX, accountForGaps = false) { // was: HC
  let idx = 0;
  if (accountForGaps) {
    pixelX -= countGapsBefore(seekBar, pixelX) * getChapterGap(seekBar); // was: GXd, Xk
  }
  for (const ch of seekBar.chapters) {
    if (pixelX > ch.width) {
      pixelX -= ch.width;
    } else {
      break;
    }
    idx++;
  }
  return idx === seekBar.chapters.length ? idx - 1 : idx;
}

// ---------------------------------------------------------------------------
// Fine-scrub vertical offset -- Source lines 51595-51602
// ---------------------------------------------------------------------------

/**
 * Apply a vertical translation to the progress bar for fine-scrub elevation.
 * [was: $GR]
 * @param {SeekBar} seekBar     [was: Q]
 * @param {number}  offsetPx    [was: c] - Pixels to shift upward.
 */
export function applyFineScrubOffset(seekBar, offsetPx) { // was: $GR
  const extraHeight = offsetPx / ((seekBar.isLargePlayer ? 135 : 90) - seekBar.baseHeight) * seekBar.baseHeight; // was: .D, .T2
  g.setStyle(seekBar.progressBar, "transform", `translateY(${-offsetPx}px)`);  // was: g.JA
  g.setStyle(seekBar.scrubTrack, "transform", `translateY(${-offsetPx}px)`);   // was: .b0
  g.setStyle(seekBar.scrubRegion, "transform", `translateY(${extraHeight}px)`); // was: .Y0
  seekBar.scrubRegion.style.height = `${offsetPx + extraHeight}px`;
  if (seekBar.element.parentElement) {
    seekBar.element.parentElement.style.height = `${seekBar.baseHeight - extraHeight}px`;
  }
}

// ---------------------------------------------------------------------------
// Time display helper -- Source lines 51604-51609
// ---------------------------------------------------------------------------

/**
 * Convert a time in seconds to a clamped millisecond string for display.
 * [was: vBx]
 * @param {SeekBar} seekBar [was: Q]
 * @param {number}  timeSec [was: c]
 * @returns {string}
 */
export function timeToMillisString(seekBar, timeSec) { // was: vBx
  if (timeSec < 0) return "0";
  const sendPostRequest = Math.floor(Math.min(timeSec, seekBar.api.getDuration()) * 1000);
  return sendPostRequest > 2 ** 31 - 1 ? "0" : String(sendPostRequest);
}

// ---------------------------------------------------------------------------
// Chapter boundary detection -- Source lines 51611-51616
// ---------------------------------------------------------------------------

/**
 * Test if a seek position is near a chapter boundary (within 4px).
 * [was: PA_]
 * @param {SeekBar} seekBar     [was: Q]
 * @param {number}  timeSec     [was: c]
 * @param {number}  chapterIdx  [was: W]
 * @returns {boolean}
 */
export function isNearChapterBoundary(seekBar, timeSec, chapterIdx) { // was: PA_
  if (chapterIdx >= seekBar.chapters.length) return false;
  const usableWidth = seekBar.totalWidth - getChapterGap(seekBar) * seekBar.chapterGapCount; // was: .J, .jG
  return (
    Math.abs(timeSec - seekBar.chapters[chapterIdx].startTime / 1000) /
      seekBar.timeRange.duration * usableWidth < 4
  );
}

// ---------------------------------------------------------------------------
// Timed marker (heat-map / decoration) rendering -- Source lines 51618-51631
// ---------------------------------------------------------------------------

/**
 * Position and size a timed marker (e.g. heat-map segment) on the seek bar.
 * [was: fyd]
 * @param {SeekBar} seekBar   [was: Q]
 * @param {number}  markerIdx [was: c]
 */
export function renderTimedMarker(seekBar, markerIdx) { // was: fyd
  const marker = seekBar.timedMarkers[markerIdx];    // was: .XI
  const markerEl = seekBar.timedMarkerElements[markerIdx]; // was: .Xw
  const metrics = getBarMetrics(seekBar);              // was: BC

  let startFrac = toFraction(seekBar.timeRange, marker.start / 1000, 0);
  const markerWidthFrac = getMarkerWidth(marker, seekBar.isLargePlayer) / metrics.width; // was: VXx

  let endFrac = toFraction(seekBar.timeRange, marker.end / 1000, 1);
  if (markerWidthFrac !== Number.POSITIVE_INFINITY) {
    startFrac = g.clamp(startFrac, 0, endFrac - markerWidthFrac); // was: g.lm
  }
  endFrac = Math.min(endFrac, startFrac + markerWidthFrac);

  if (marker.color) {
    markerEl.style.background = marker.color;
  }

  markerEl.style.left = `${Math.max(startFrac * metrics.totalWidth + metrics.offset, 0)}px`; // was: .W, .j
  setBarWidth(seekBar, markerEl, g.clamp((endFrac - startFrac) * metrics.totalWidth + metrics.offset, 0, metrics.width), metrics.width, true); // was: Zl
}

// ---------------------------------------------------------------------------
// Clip-path cutout (Delhi modern) -- Source lines 51633-51636
// ---------------------------------------------------------------------------

/**
 * Update the clip-path on the seek-bar overlay for the modern cutout.
 * [was: nv]
 * @param {SeekBar} seekBar     [was: Q]
 * @param {number}  [hoverPos]  [was: c]
 */
export function updateClipPath(seekBar, hoverPos) { // was: nv
  if (seekBar.api.getPresentingPlayerType() !== 1) {
    seekBar.overlay.style.removeProperty("clip-path"); // was: .La
    return;
  }
  if (!hoverPos) {
    hoverPos = computeHoverPosition(seekBar, seekBar.currentSeekFrac, getBarMetrics(seekBar)); // was: VV, .S
  }
  seekBar.overlay.style.clipPath =
    'path("' +
    (seekBar.isCutoutHovered
      ? buildCutoutPath(seekBar, 8, hoverPos, seekBar.isLargePlayer ? 50 : 36, 0, 6) // was: lyx
      : buildCutoutPath(seekBar, 4, hoverPos, seekBar.isLargePlayer ? 34 : 24, 2, 3)) +
    '")';
}

// ---------------------------------------------------------------------------
// Multi-chapter progress fill -- Source lines 51638-51720
// ---------------------------------------------------------------------------

/**
 * Fill chapter progress bars between a start fraction and a current fraction.
 * [was: Dl]
 * @param {SeekBar} seekBar     [was: Q]
 * @param {Object}  metrics     [was: c]
 * @param {number}  startFrac   [was: W]
 * @param {number}  currentFrac [was: m]
 * @param {string}  fillType    [was: K] - e.g. "PLAY_PROGRESS", "HOVER_PROGRESS"
 */
export function fillChapterProgress(seekBar, metrics, startFrac, currentFrac, fillType) { // was: Dl
  const numChapters = seekBar.chapters.length;
  const usableWidth = metrics.totalWidth - seekBar.chapterGapCount * getChapterGap(seekBar); // was: .jG, Xk
  const startPx = startFrac * usableWidth;
  let startChIdx = findChapterAtPixel(seekBar, startPx);
  let currentPx = currentFrac * usableWidth;
  let endChIdx = findChapterAtPixel(seekBar, currentPx);

  if (fillType === "HOVER_PROGRESS") {
    endChIdx = findChapterAtPixel(seekBar, metrics.totalWidth * currentFrac, true);
    currentPx = metrics.totalWidth * currentFrac - countGapsBefore(seekBar, metrics.totalWidth * currentFrac) * getChapterGap(seekBar);
  }

  const startOffset = Math.max(startPx - getChapterPixelOffset(seekBar, startChIdx), 0); // was: uyX

  // Set left offset for all chapters from startChIdx onward
  for (let i = startChIdx; i < numChapters; i++) {
    seekBar.chapters[i].getBar(fillType).style.left = (startChIdx === i ? `${startOffset}px` : "0"); // was: .Ae
  }

  const hoverPos = computeHoverPosition(seekBar, seekBar.currentSeekFrac, metrics);

  // Fill chapters between start and end
  for (let i = startChIdx; i < endChIdx; i++) {
    const bar = seekBar.chapters[i].getBar(fillType);
    const chWidth = seekBar.chapters[i].width;
    const fillWidth = i === startChIdx ? chWidth - startOffset : chWidth;
    setBarWidth(seekBar, bar, fillWidth, chWidth); // was: Zl
    applyProgressGradient(seekBar, bar, fillWidth, chWidth, i, hoverPos, fillType); // was: hgm
  }

  // Partial fill for the last chapter
  const lastWidth = seekBar.chapters[endChIdx].width;
  let fillPx = g.clamp(currentPx - getChapterPixelOffset(seekBar, endChIdx), 0, lastWidth);
  if (startChIdx === endChIdx) fillPx -= startOffset;
  const lastBar = seekBar.chapters[endChIdx].getBar(fillType);
  setBarWidth(seekBar, lastBar, fillPx, lastWidth);
  applyProgressGradient(seekBar, lastBar, fillPx, lastWidth, endChIdx, hoverPos, fillType);

  // Zero-fill remaining chapters
  for (let i = endChIdx + 1; i < numChapters; i++) {
    clearChapterBar(seekBar, i, fillType); // was: zgx
  }
  for (let i = 0; i < startChIdx; i++) {
    clearChapterBar(seekBar, i, fillType);
  }
}

/**
 * Build a clip-path "M ... L ... C ..." SVG path string for the cutout hole.
 * [was: lyx]
 * @param {SeekBar} seekBar [was: Q]
 * @param {number}  inset   [was: c]
 * @param {number}  center  [was: W]
 * @param {number}  holeW   [was: m]
 * @param {number}  top     [was: K]
 * @param {number}  radius  [was: T]
 * @returns {string}
 */
export function buildCutoutPath(seekBar, inset, center, holeW, top, radius) { // was: lyx
  const left = center - holeW / 2;
  const right = center + holeW / 2;
  const bottom = inset + top;
  return `M 0 ${top} L 0 ${bottom} L ${left} ${bottom} C ${left + radius} ${bottom} ${left + radius} ${top} ${left} ${top} L 0 ${top} M ${right} ${top} L ${seekBar.totalWidth} ${top} L ${seekBar.totalWidth} ${bottom} L ${right} ${bottom} C ${right - radius} ${bottom} ${right - radius} ${top} ${right} ${top}`;
}

/**
 * Count how many chapter gaps exist before a given pixel position.
 * [was: GXd]
 * @param {SeekBar} seekBar [was: Q]
 * @param {number}  pixelX  [was: c]
 * @returns {number}
 */
export function countGapsBefore(seekBar, pixelX) { // was: GXd
  const total = seekBar.chapters.length;
  let count = 0;
  for (const ch of seekBar.chapters) {
    if (ch.width !== 0) {
      if (pixelX > ch.width) {
        pixelX -= ch.width;
        pixelX -= getChapterGap(seekBar);
        count++;
      } else {
        break;
      }
    }
  }
  return count === total ? total - 1 : count;
}

/**
 * Get the cumulative pixel offset up to (but not including) a chapter.
 * [was: uyX]
 * @param {SeekBar} seekBar    [was: Q]
 * @param {number}  chapterIdx [was: c]
 * @returns {number}
 */
export function getChapterPixelOffset(seekBar, chapterIdx) { // was: uyX
  if (chapterIdx >= seekBar.chapters.length) return seekBar.totalWidth;
  let offset = 0;
  let i = 0;
  while (i < chapterIdx) {
    offset += seekBar.chapters[i].width;
    i++;
  }
  return offset;
}

/**
 * Set the width of a chapter progress bar element.
 * [was: Zl]
 * @param {SeekBar} seekBar   [was: Q]
 * @param {Element} barEl     [was: c]
 * @param {number}  fillWidth [was: W]
 * @param {number}  totalWidth [was: m]
 * @param {boolean} [forcePixels] [was: K]
 */
export function setBarWidth(seekBar, barEl, fillWidth, totalWidth, forcePixels) { // was: Zl
  if (forcePixels || seekBar.api.getConfig().isMobileWeb) { // was: .G().O
    barEl.style.width = `${fillWidth}px`;
  } else {
    g.setStyle(barEl, "transform", `scalex(${totalWidth ? fillWidth / totalWidth : 0})`);
  }
}

/**
 * Apply background-size / background-position for play-progress gradient.
 * [was: hgm]
 * @param {SeekBar} seekBar   [was: Q]
 * @param {Element} barEl     [was: c]
 * @param {number}  fillWidth [was: W]
 * @param {number}  totalWidth [was: m]
 * @param {number}  chIdx     [was: K]
 * @param {number}  hoverPos  [was: T]
 * @param {string}  fillType  [was: r]
 */
export function applyProgressGradient(seekBar, barEl, fillWidth, totalWidth, chIdx, hoverPos, fillType) { // was: hgm
  if (fillType === "PLAY_PROGRESS") {
    const scale = !totalWidth || seekBar.api.getConfig().isMobileWeb ? 1 : fillWidth / totalWidth;
    let bgSize, bgPosX;
    if (seekBar.startOverlay.clientWidth > 0 || seekBar.endOverlay.clientWidth > 0) { // was: .gA, .QE
      bgSize = barEl.clientWidth / scale;
      bgPosX = -1 * seekBar.startOverlay.clientWidth / scale;
    } else {
      bgSize = hoverPos / scale;
      bgPosX = -1 * seekBar.chapters[chIdx].element.offsetLeft / scale;
    }
    g.setStyle(barEl, "background-size", `${bgSize}px`);
    g.setStyle(barEl, "background-position-x", `${bgPosX}px`);
  }
}

/**
 * Zero-fill a chapter's progress bar.
 * [was: zgx]
 * @param {SeekBar} seekBar   [was: Q]
 * @param {number}  chIdx     [was: c]
 * @param {string}  fillType  [was: W]
 */
export function clearChapterBar(seekBar, chIdx, fillType) { // was: zgx
  const bar = seekBar.chapters[chIdx].getBar(fillType);
  setBarWidth(seekBar, bar, 0, seekBar.chapters[chIdx].width);
}

// ---------------------------------------------------------------------------
// Resize / layout -- Source lines 51722-51738
// ---------------------------------------------------------------------------

/**
 * Resize the seek bar to new dimensions.
 * [was: g.CA7]
 * @param {SeekBar} seekBar    [was: Q]
 * @param {number}  totalWidth [was: c] - pixel width of the bar area
 * @param {number}  barWidth   [was: W] - pixel width available for chapters
 * @param {boolean} isLarge    [was: m] - large player mode
 */
export function resizeSeekBar(seekBar, totalWidth, barWidth, isLarge) { // was: g.CA7
  const widthChanged = seekBar.totalWidth !== barWidth;
  const sizeChanged = seekBar.isLargePlayer !== isLarge;
  seekBar.pixelRatio = totalWidth;    // was: .pF
  seekBar.totalWidth = barWidth;      // was: .J
  seekBar.isLargePlayer = isLarge;    // was: .D

  if (isFineScrubActive(seekBar) && seekBar.fineScrubber?.setLargeMode) { // was: Kv
    seekBar.fineScrubber.setLargeMode(isLarge); // was: .Y0
  }
  recalcChapterWidths(seekBar); // was: bfw

  if (seekBar.chapters.length === 1) {
    seekBar.chapters[0].width = barWidth || 0;
  }
  if (widthChanged) g.requestRender(seekBar); // was: g.oi

  if (seekBar.fineScrubber && sizeChanged && isFineScrubActive(seekBar)) {
    if (seekBar.fineScrubber.isEnabled) {
      const fullHeight = seekBar.isLargePlayer ? 135 : 90;
      const offset = fullHeight - seekBar.baseHeight;
      seekBar.scrubRegion.style.height = `${fullHeight}px`;
      g.setStyle(seekBar.scrubTrack, "transform", `translateY(${-offset}px)`);
      g.setStyle(seekBar.progressBar, "transform", `translateY(${-offset}px)`);
    }
    reinitFineScrubber(seekBar.fineScrubber); // was: VVK
  }
}

// ---------------------------------------------------------------------------
// Timed marker removal -- Source lines 51740-51745
// ---------------------------------------------------------------------------

/**
 * Remove a timed marker by reference.
 * [was: MVK]
 * @param {SeekBar} seekBar [was: Q]
 * @param {Object}  marker  [was: c]
 */
export function removeTimedMarker(seekBar, marker) { // was: MVK
  const id = marker.getId();
  if (seekBar.timedMarkers[id] === marker) {
    g.removeNode(seekBar.timedMarkerElements[id]); // was: g.FQ
    delete seekBar.timedMarkers[id];
    delete seekBar.timedMarkerElements[id];
  }
}

// ---------------------------------------------------------------------------
// Settings menu toggle -- Source lines 51747-51750
// ---------------------------------------------------------------------------

/**
 * Toggle the scrub/fine-seek mode from the settings menu.
 * [was: EC]
 * @param {SettingsPanel} panel   [was: Q]
 * @param {boolean}       enabled [was: c]
 */
export function toggleFineScrub(panel, enabled) { // was: EC
  panel.fineScrubEnabled = !!enabled; // was: .O
  panel.resize(panel.host.getPlayerContainer().getPlayerSize()); // was: .W, .U.bX()
}

// ---------------------------------------------------------------------------
// Quality menu item builder -- Source lines 51752-51791
// ---------------------------------------------------------------------------

/**
 * Build a quality-menu item label (e.g. "1080p  HD").
 * [was: J57]
 * @param {QualityMenu}  menu       [was: Q]
 * @param {string}       label      [was: c]
 * @param {string}       qualityId  [was: W]
 * @param {string}       cssClass   [was: m]
 * @returns {Object} Virtual DOM descriptor
 */
export function buildQualityMenuItem(menu, label, qualityId, cssClass) { // was: J57
  const item = {
    tag: "span",     // was: C
    classes: cssClass, // was: yC
    children: [label], // was: V
  };

  let badge;
  let badgeClass = "ytp-swatch-color";
  if (menu.isPremium || menu.isEnhanced) { // was: .S, .K
    badgeClass = "ytp-swatch-color-white";
  }

  if (qualityId === "highres")       badge = "8K";
  else if (qualityId === "hd2880")   badge = "5K";
  else if (qualityId === "hd2160")   badge = "4K";
  else if (qualityId.indexOf("hd") === 0 && qualityId !== "hd720") badge = "HD";

  if (badge) {
    item.children.push(" ");
    item.children.push({
      tag: "sup",   // was: C
      cls: badgeClass, // was: Z
      text: badge,     // was: eG
    });
  }
  return item;
}

/**
 * Build a quality menu item from the available-quality map.
 * [was: Rgd]
 * @param {QualityMenu}  menu       [was: Q]
 * @param {string}       qualityId  [was: c]
 * @param {string}       cssClass   [was: W]
 * @returns {Object}
 */
export function buildQualityMenuItemFromMap(menu, qualityId, cssClass) { // was: Rgd
  const info = menu.qualityLabels[qualityId]; // was: .UH
  const fallback = g.qualityHeights[qualityId]; // was: g.EU
  return buildQualityMenuItem(
    menu,
    info ? info.qualityLabel : fallback ? `${fallback}p` : "Auto",
    qualityId,
    cssClass
  );
}

// ---------------------------------------------------------------------------
// Speed menu -- Source lines 51793-51877
// ---------------------------------------------------------------------------

/**
 * Snap a playback speed to the nearest 0.05 increment.
 * [was: dd]
 * @param {SpeedMenu} menu  [was: Q]
 * @param {number}    speed [was: c]
 * @returns {number}
 */
export function snapSpeed(menu, speed) { // was: dd
  speed = Number(g.clamp(speed, menu.min, menu.max).toFixed(2)); // was: .A, .j
  const remainder = Math.floor((speed + 0.001) * 100 % 5 + 2e-15);
  let snapped = speed;
  if (remainder !== 0) {
    snapped = speed - remainder * 0.01;
  }
  return Number(snapped.toFixed(2));
}

/**
 * Update the speed display label.
 * [was: kX3]
 * @param {SpeedMenu} menu  [was: Q]
 * @param {number}    speed [was: c]
 */
export function updateSpeedLabel(menu, speed) { // was: kX3
  const label = formatSpeed(speed); // was: Lv
  if (menu.customLabel && (menu.isCustom || speed === menu.customSpeed)) { // was: .K, .b0, .T2
    menu.setActive(menu.customLabel); // was: .O
    menu.setContent(speed.toString());
  } else {
    menu.setActive(label);
  }
}

/**
 * Rebuild the speed menu with all available rates.
 * [was: pfW]
 * @param {SpeedMenu} menu [was: Q]
 */
export function rebuildSpeedMenu(menu) { // was: pfW
  let items = menu.availableSpeeds.map(formatSpeed); // was: .S
  if (menu.customItem) items.push(menu.customItem); // was: .D
  menu.setItems(items); // was: .j
  menu.customLabel = null;
  menu.customSpeed = null;

  const currentRate = menu.player.getPlaybackRate(); // was: .U
  if (hasCustomPlaybackSupport(menu.player) && addCustomSpeedOption(menu, currentRate)) { // was: wd, Ybx
    // custom speed was added
  }
  if (!menu.availableSpeeds.includes(currentRate) || menu.isCustom) { // was: .b0
    menu.setActive(menu.customLabel);
  } else {
    menu.setActive(formatSpeed(currentRate));
  }
}

/**
 * Format a speed number to string.
 * [was: Lv]
 * @param {number} speed [was: Q]
 * @returns {string}
 */
export function formatSpeed(speed) { // was: Lv
  return speed.toString();
}

/**
 * Check if the player supports custom playback speed.
 * [was: wd]
 * @param {Player} player [was: Q]
 * @returns {boolean}
 */
export function hasCustomPlaybackSupport(player) { // was: wd
  return player.getExperiment("web_settings_menu_surface_custom_playback");
}

/**
 * Check if custom speed input slider is available.
 * [was: cTx]
 * @param {Player} player   [was: Q]
 * @param {boolean} enabled [was: c]
 * @returns {boolean}
 */
export function canShowSpeedSlider(player, enabled) { // was: cTx
  return !!enabled && player.getAvailablePlaybackRates()[player.getAvailablePlaybackRates().length - 1] <= 2;
}

/**
 * Check if the input slider variant is enabled.
 * [was: bG]
 * @param {Player} player [was: Q]
 * @returns {boolean}
 */
export function useInputSlider(player) { // was: bG
  return player.getExperiment("web_settings_menu_surface_custom_playback") &&
    player.getExperiment("web_settings_use_input_slider");
}

// ---------------------------------------------------------------------------
// Caption toggle detection -- Source lines 51935-51939
// ---------------------------------------------------------------------------

/**
 * Detect whether captions are available and at least one track exists.
 * [was: OC]
 * @param {CaptionButton} button [was: Q]
 * @returns {boolean}
 */
export function hasCaptionTracks(button) { // was: OC
  const captionModule = g.getModule(button.player.getModuleManager()); // was: g.hT, .CO
  if (captionModule == null) return false;
  if (captionModule.hasMultipleTracks()) { // was: .h1
    return !!button.player.getOption("captions", "tracklist", { includeAsr: true }).length;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Live badge -- Source lines 51941-51955
// ---------------------------------------------------------------------------

/**
 * Update the live badge display state (at live edge, premiere, text).
 * [was: rTn]
 * @param {TimeDisplay} display   [was: Q]
 * @param {boolean}     atLiveHead [was: c]
 */
export function updateLiveBadge(display, atLiveHead) { // was: rTn
  const badgeEl = display.liveBadge.element;
  const isAdPlaying = display.api.isLifaAdPlaying();
  badgeEl.disabled = isAdPlaying || atLiveHead;

  if (
    !isLiveMode(display) || // was: fv
    (display.lastAtLiveHead === atLiveHead &&
      display.lastIndicatorText === display.liveIndicatorText &&
      display.lastIsPremiere === display.isPremiere)
  ) {
    return;
  }

  display.lastAtLiveHead = atLiveHead;       // was: .L
  display.lastIndicatorText = display.liveIndicatorText; // was: .J
  display.lastIsPremiere = display.isPremiere; // was: .D
  display.updateLayout();                     // was: .kx

  if (atLiveHead) {
    badgeEl.classList.add("ytp-live-badge-is-livehead");
  } else {
    badgeEl.classList.remove("ytp-live-badge-is-livehead");
  }

  if (display.liveIndicatorText) {
    display.liveBadge.setContent(display.liveIndicatorText);
  } else {
    display.liveBadge.setContent(display.isPremiere ? "Premiere" : "Live");
  }

  if (atLiveHead) {
    if (display.tooltipCleanup) { // was: .W
      display.tooltipCleanup();
      display.tooltipCleanup = null;
      badgeEl.removeAttribute("data-tooltip-title");
    }
  } else {
    badgeEl.setAttribute("data-tooltip-title", "Skip ahead to live broadcast.");
    display.tooltipCleanup = g.registerTooltip(display.tooltip, display.liveBadge.element); // was: g.Zr
  }
}

// ---------------------------------------------------------------------------
// Clip / loop state helpers -- Source lines 51957-51999
// ---------------------------------------------------------------------------

/**
 * Set the loop range on the seek bar and trigger a redraw.
 * [was: U2X]
 * @param {SeekBar} seekBar   [was: Q]
 * @param {Object}  loopRange [was: c]
 */
export function setLoopRange(seekBar, loopRange) { // was: U2X
  const changed = seekBar.loopRange !== loopRange;
  seekBar.loopRange = loopRange; // was: .x$
  if (changed) updateClipState(seekBar); // was: vC
}

/**
 * Check if we're in clip mode (has a postId, not ad, not repeat-chapter).
 * [was: ai]
 * @param {SeekBar} seekBar [was: Q]
 * @returns {boolean}
 */
export function isClipMode(seekBar) { // was: ai
  return (
    !!seekBar.loopRange &&
    !!seekBar.loopRange.postId &&
    seekBar.api.getPresentingPlayerType() !== 2 &&
    (!seekBar.loopRange.type || seekBar.loopRange.type === "clips")
  );
}

/**
 * Check if the live indicator should be shown.
 * [was: fv]
 * @param {TimeDisplay} display [was: Q]
 * @returns {boolean}
 */
export function isLiveMode(display) { // was: fv
  const hasLinearProgress = display.api.getConfig().getExperiment("enable_linear_program_progress");
  const isAd = display.api.getPresentingPlayerType() === 2;
  return display.isLive && !isClipMode(display) && (!hasLinearProgress || !display.isLinearProgram) && !isAd; // was: .d8, .O
}

/**
 * Update clip/live CSS classes and labels on the seek bar.
 * [was: vC]
 * @param {SeekBar} seekBar [was: Q]
 */
export function updateClipState(seekBar) { // was: vC
  seekBar.updateValue("clipicon", {
    tag: "svg",
    attrs: {
      height: "100%",
      version: "1.1",
      viewBox: "0 0 24 24",
      width: "100%",
    },
    children: [{
      tag: "path",
      attrs: {
        d: "M22,3h-4l-5,5l3,3l6-6V3L22,3z M10.79,7.79C10.91,7.38,11,6.95,11,6.5C11,4.01,8.99,2,6.5,2S2,4.01,2,6.5S4.01,11,6.5,11 c0.45,0,.88-0.09,1.29-0.21L9,12l-1.21,1.21C7.38,13.09,6.95,13,6.5,13C4.01,13,2,15.01,2,17.5S4.01,22,6.5,22s4.5-2.01,4.5-4.5 c0-0.45-0.09-0.88-0.21-1.29L12,15l6,6h4v-2L10.79,7.79z M6.5,8C5.67,8,5,7.33,5,6.5S5.67,5,6.5,5S8,5.67,8,6.5S7.33,8,6.5,8z M6.5,19C5.67,19,5,18.33,5,17.5S5.67,16,6.5,16S8,16.67,8,17.5S7.33,19,6.5,19z",
      },
    }],
  });

  if (seekBar.isLive && !seekBar.isLinearProgram) { // was: .d8, .O
    seekBar.updateValue("watchfullvideo", "Watch live stream");
  } else {
    seekBar.updateValue("watchfullvideo", "Watch full video");
  }

  g.toggleClass(seekBar.element, "ytp-clip", isClipMode(seekBar));
  g.toggleClass(seekBar.element, "ytp-live", isLiveMode(seekBar));
}

/**
 * Update the seek bar's compact mode based on container width.
 * [was: Iz7]
 * @param {SeekBar} seekBar [was: Q]
 * @param {Object}  size    [was: c]
 */
export function updateCompactMode(seekBar, size) { // was: Iz7
  seekBar.setCompact(size.width >= 350); // was: .BB
}
