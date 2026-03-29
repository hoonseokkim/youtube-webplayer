/**
 * Caption Renderer — Classes responsible for caption text display,
 * positioning, and visual styling.
 *
 * Source: player_es6.vflset/en_US/caption.js, lines 209–403 (styling helpers),
 *         lines 2497–2787 (CaptionWindow base), lines 3319–3459 (subclasses).
 *
 * Three window types:
 *   - CaptionWindow       [was: cK]   — type 0 (default pop-on)
 *   - PaintOnWindow        [was: RBa]  — type 1 (paint-on / real-time)
 *   - RollUpWindow         [was: ks9]  — type 2 (roll-up)
 */

import { isAndroid } from '../../data/device-platform.js';  // was: g.w8
import { measureVisualLines } from './caption-internals.js';  // was: g.HUH
import { parseHexColor } from './caption-settings.js';  // was: g.HA
import { createDatabaseDefinition } from '../../data/idb-transactions.js'; // was: el
import { setStyle, addClass, appendChild, createTextNode, createElement, hasClass, removeClass } from '../../core/dom-utils.js';
import { getPlayerResponse } from '../../player/player-api.js';
import { concat, slice } from '../../core/array-utils.js';
import { buildPipFlags } from '../../data/device-context.js';

// ── Constants ────────────────────────────────────────────────────────

// Alignment keywords for text-align values
// [was: KKm] — Source line 2496
const TEXT_ALIGN_NAMES = ['left', 'right', 'center', 'justify'];

// ── Font family map ─────────────────────────────────────────────────
// [was: inline switch in z1m] — Source lines 287–309
const FONT_FAMILY_MAP = {
  1: '"Courier New", Courier, "Nimbus Mono L", "Cutive Mono", monospace',
  2: '"Times New Roman", Times, Georgia, Cambria, "PT Serif Caption", serif',
  3: '"Deja Vu Sans Mono", "Lucida Console", Monaco, Consolas, "PT Mono", monospace',
  5: '"Comic Sans MS", Impact, Handlee, fantasy',
  6: '"Monotype Corsiva", "URW Chancery L", "Apple Chancery", "Dancing Script", cursive',
  7: /* small-caps handled separately */ isAndroid() ? '"Carrois Gothic SC", sans-serif-smallcaps' : 'Arial, Helvetica, Verdana, "Marcellus SC", sans-serif',
  0: '"YouTube Noto", Roboto, Arial, Helvetica, Verdana, "PT Sans Caption", sans-serif',
  4: '"YouTube Noto", Roboto, Arial, Helvetica, Verdana, "PT Sans Caption", sans-serif',
};

// ── Helper: compute effective font-size multiplier ──────────────────
// [was: umm] — Source lines 216–221
export function computeFontSizeMultiplier(textStyle) { // was: umm
  let multiplier = 1 + 0.25 * (textStyle.fontSizeIncrement || 0);
  if (textStyle.offset === 0 || textStyle.offset === 2) multiplier *= 0.8;
  return multiplier;
}

// ── Helper: compute base font size in pixels ────────────────────────
// [was: lYi] — Source lines 209–215
export function computeBaseFontSize(playerWidth, playerHeight, containerWidth, containerHeight) { // was: lYi
  let fontSize = playerWidth / 360 * 16;
  if (playerHeight >= playerWidth) { // original: c >= Q
    let baseWidth = 640;
    if (containerHeight > containerWidth * 1.3) baseWidth = 480;
    fontSize = containerWidth / baseWidth * 16;
  }
  return fontSize;
}

// ── Helper: set vertical writing mode ───────────────────────────────
// [was: h1D] — Source lines 223–233
function applyVerticalWritingMode(window, element) { // was: h1D
  let mode = 'vertical-rl';
  if (window.captionWindowData.scrollDirection === 1) mode = 'vertical-lr'; // was: Yb
  if (isIE) mode = (mode === 'vertical-lr') ? 'tb-lr' : 'tb-rl';
  setStyle(element, '-o-writing-mode', mode);
  setStyle(element, '-webkit-writing-mode', mode);
  setStyle(element, 'writing-mode', mode);
  setStyle(element, 'text-orientation', 'upright');
  addClass(element, 'ytp-vertical-caption');
  if (window.rendererParams.printDirection === 3) { // was: oI
    setStyle(element, 'text-orientation', '');
    setStyle(element, 'transform', 'rotate(180deg)');
  }
}

// ── Helper: build CSS properties for a text segment style ───────────
// [was: z1m] — Source lines 234–348
export function buildSegmentStyles(renderer, textStyle) { // was: z1m
  const styles = {};
  let bgColor = textStyle.background || renderer.captionWindowData.textStyle.background;

  // Background
  if (textStyle.backgroundOpacity != null || textStyle.background) {
    const opacity = textStyle.backgroundOpacity ?? renderer.captionWindowData.textStyle.backgroundOpacity;
    const rgb = parseHexColor(bgColor); // was: HA
    styles.background = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})`;
    if (renderer.supportsBoxDecorationBreak) { // was: nO
      styles['box-decoration-break'] = 'clone';
      styles['border-radius'] = `${renderer.baseFontSizePx / 8}px`; // was: HA (the field, not the func)
    }
  }

  // Font size
  if (textStyle.fontSizeIncrement != null || textStyle.offset != null) {
    styles['font-size'] = `${renderer.scaledFontSize * computeFontSizeMultiplier(textStyle)}px`; // was: JJ
  }

  // Text color + opacity
  let textOpacityValue = 1;
  let color = textStyle.color || renderer.captionWindowData.textStyle.color;
  if (textStyle.color || textStyle.textOpacity != null) {
    const rgb = parseHexColor(color);
    textOpacityValue = textStyle.textOpacity ?? renderer.captionWindowData.textStyle.textOpacity;
    const rgba = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${textOpacityValue})`;
    styles.color = rgba;
    styles.fill = rgba;
  }

  // Character edge style (shadow / outline / raised / depressed)
  let edgeStyle = textStyle.charEdgeStyle;
  if (edgeStyle === 0) edgeStyle = undefined;
  if (edgeStyle) {
    let dark = `rgba(34, 34, 34, ${textOpacityValue})`;
    let light = `rgba(204, 204, 204, ${textOpacityValue})`;
    if (textStyle.edgeColor) dark = light = textStyle.edgeColor; // was: Xf
    const unit = renderer.scaledFontSize / 16 / 2;
    const oneUnit = Math.max(unit, 1);
    let twoUnit = Math.max(2 * unit, 1);
    let threeUnit = Math.max(3 * unit, 1);
    const fiveUnit = Math.max(5 * unit, 1);
    const shadows = [];
    switch (edgeStyle) {
      case 4: // drop-shadow
        for (; threeUnit <= fiveUnit; threeUnit += unit) shadows.push(`${twoUnit}px ${twoUnit}px ${threeUnit}px ${dark}`);
        break;
      case 1: { // raised
        const step = window.devicePixelRatio >= 2 ? 0.5 : 1;
        for (let t = oneUnit; t <= threeUnit; t += step) shadows.push(`${t}px ${t}px ${dark}`);
        break;
      }
      case 2: // depressed
        shadows.push(`${oneUnit}px ${oneUnit}px ${light}`);
        shadows.push(`-${oneUnit}px -${oneUnit}px ${dark}`);
        break;
      case 3: // uniform outline
        for (let i = 0; i < 5; i++) shadows.push(`0 0 ${twoUnit}px ${dark}`);
        break;
    }
    styles['text-shadow'] = shadows.join(', ');
  }

  // Font family
  const ff = FONT_FAMILY_MAP[textStyle.fontFamily];
  if (ff) styles['font-family'] = ff;

  // Vertical alignment (subscript / superscript)
  const offset = textStyle.offset ?? renderer.captionWindowData.textStyle.offset;
  switch (offset) {
    case 0: styles['vertical-align'] = 'sub'; break;
    case 2: styles['vertical-align'] = 'super'; break;
  }

  // Small caps
  if (textStyle.fontFamily === 7) styles['font-variant'] = 'small-caps';
  if (textStyle.bold) styles['font-weight'] = 'bold';
  if (textStyle.italic) styles['font-style'] = 'italic';
  if (textStyle.underline) styles['text-decoration'] = 'underline';
  if (textStyle.isHidden) styles.visibility = 'hidden'; // was: iH

  return styles;
}

// ── Helper: append a text segment to a caption visual line ──────────
// [was: JCi] — Source lines 353–376
function appendSegmentToLine(renderer, cue, overrideStyle) { // was: JCi
  renderer.isDirty = renderer.isDirty || !!overrideStyle; // was: Ka
  const mergedStyle = {};
  Object.assign(mergedStyle, renderer.captionWindowData.textStyle);
  Object.assign(mergedStyle, overrideStyle || cue.style); // was: W
  Object.assign(mergedStyle, renderer.overrideParams.textStyle);

  const isFirstLine = !renderer.currentVisualLine; // was: J
  if (isFirstLine) createVisualLine(renderer); // was: C64

  let segmentSpan = (renderer.lastSegmentSpan && renderer.lastSegmentStyle && /* deep equal */ JSON.stringify(mergedStyle) === JSON.stringify(renderer.lastSegmentStyle))
    ? renderer.lastSegmentSpan
    : createSegmentSpan(renderer, mergedStyle); // was: MWv

  const isStringContent = typeof cue.text === 'string';
  const lines = isStringContent ? cue.text.split('\n') : [cue.text];

  for (let i = 0; i < lines.length; i++) {
    const needsNewLine = i > 0 || !cue.append;
    const content = lines[i];
    if (needsNewLine && !isFirstLine) {
      createVisualLine(renderer);
      segmentSpan = createSegmentSpan(renderer, mergedStyle);
    } else if (needsNewLine && isFirstLine) {
      // first line of first segment — no new line needed
    }
    if (content) {
      segmentSpan.appendChild(isStringContent ? createTextNode(content) : content);
    }
  }
  renderer.lastSegmentStyle = mergedStyle; // was: PA
  renderer.lastSegmentSpan = segmentSpan; // was: jG
  renderer.displayedCues.push(cue); // was: D
}

// [was: C64] — Source lines 377–384
function createVisualLine(renderer) {
  renderer.currentVisualLine = createElement('SPAN'); // was: J
  setStyle(renderer.currentVisualLine, { display: 'block' });
  addClass(renderer.currentVisualLine, 'caption-visual-line');
  renderer.textContainer.appendChild(renderer.currentVisualLine); // was: A
}

// [was: MWv] — Source lines 385–403
function createSegmentSpan(renderer, textStyle) {
  const span = createElement('SPAN');
  setStyle(span, { display: 'handleNoSelectableFormats-block', 'white-space': 'pre-wrap' });
  setStyle(span, buildSegmentStyles(renderer, textStyle));
  span.classList.add('ytp-caption-segment');
  renderer.currentVisualLine.appendChild(span);

  // Remove border-radius between adjacent sibling segments
  if (span.previousElementSibling) {
    setStyle(span.previousElementSibling, { 'border-top-right-radius': '0', 'border-bottom-right-radius': '0' });
    setStyle(span, { 'border-top-left-radius': '0', 'border-bottom-left-radius': '0' });
  }
  return span;
}

// ── Helper: parse a CSS px value to number ──────────────────────────
// [was: i9] — Source lines 349–352
function parsePx(value) {
  const parts = value.split('px');
  return parts.length > 0 ? (Number(parts[0]) || 0) : 0;
}

// ══════════════════════════════════════════════════════════════════════
// CaptionWindow — base class for all caption window types (type 0).
// [was: cK] — Source lines 2497–2787
// ══════════════════════════════════════════════════════════════════════
export class CaptionWindow extends Component {
  /**
   * @param {Object} windowData   [was: Q] — window cue range with params
   * @param {Object} baseParams   [was: c] — base caption display params
   * @param {Object} overrideParams [was: W] — user-override display params
   * @param {number} videoWidth   [was: m]
   * @param {number} videoHeight  [was: K]
   * @param {number} containerWidth  [was: T]
   * @param {number} containerHeight [was: r]
   * @param {Object} experiments  [was: U]
   * @param {Function} onEditClick [was: I] — callback when edit button is clicked
   * @param {Object} playerApi   [was: X]
   */
  constructor(windowData, baseParams, overrideParams, videoWidth, videoHeight, containerWidth, containerHeight, experiments, onEditClick, playerApi) {
    const isInlineMode = playerApi.isInline() && true; // was: A
    const mergedParams = {};
    Object.assign(mergedParams, baseParams);
    Object.assign(mergedParams, windowData.params);
    Object.assign(mergedParams, overrideParams);
    const mergedTextStyle = {};
    Object.assign(mergedTextStyle, baseParams.textStyle);
    if (windowData.params.textStyle) Object.assign(mergedTextStyle, windowData.params.textStyle);
    Object.assign(mergedTextStyle, overrideParams.textStyle);

    if (isInlineMode) {
      mergedParams.windowOpacity = 0.6;
      mergedTextStyle.backgroundOpacity = 0;
    }
    mergedParams.textStyle = mergedTextStyle;

    const isRTL = mergedParams.printDirection === 1; // was: oI

    // Build child elements
    const children = [{
      tagName: 'span',
      className: 'captions-text',
      attributes: { style: 'word-wrap: normal; display: block;' },
    }];

    // Optional edit button (for caption correction)
    const editCommand = experiments.isEnabled('caption_edit_on_hover') && playerApi.getVideoData().getPlayerResponse()?.captions?.playerCaptionsTracklistRenderer?.openTranscriptCommand;
    if (editCommand) {
      children.unshift({
        tagName: 'button',
        className: 'caption-edit',
        attributes: { tabindex: '0', 'aria-label': 'Edit caption' }, // was: gJS()
      });
    }

    super({
      tagName: 'div',
      className: 'caption-window',
      attributes: {
        id: `caption-window-${windowData.id}`,
        dir: isRTL ? 'rtl' : 'ltr',
        tabindex: '0',
        lang: mergedParams.lang,
      },
      children,
    });

    /** @type {Array} [was: D] — cues currently rendered */
    this.displayedCues = [];

    /** @type {boolean} [was: Ka] — whether a full re-render is needed */
    this.isDirty = false;

    /** @type {Object} [was: O] — the window cue range */
    this.windowData = windowData;

    /** @type {?HTMLElement} [was: jG] — last segment span created */
    this.lastSegmentSpan = null;

    /** @type {?Object} [was: PA] — last segment style applied */
    this.lastSegmentStyle = null;

    /** @type {number} [was: w6] — container width */
    this.containerWidth = containerWidth;

    /** @type {number} [was: Rt] — container height */
    this.containerHeight = containerHeight;

    /** @type {?HTMLElement} [was: J] — current visual line element */
    this.currentVisualLine = null;

    this.maxWidth = containerWidth * 0.96;
    this.maxHeight = containerHeight * 0.96;

    /** @type {Object} [was: W] — effective merged display params */
    this.captionWindowData = mergedParams;

    /** @type {Object} [was: u3] — override params */
    this.overrideParams = overrideParams;

    /** @type {Object} [was: T2] — base params */
    this.baseDisplayParams = baseParams;

    /** @type {HTMLElement} [was: A] — the text container <span> */
    this.textContainer = this.querySelector('.captions-text'); // was: z2

    /** @type {boolean} [was: nO] — supports CSS box-decoration-break */
    this.supportsBoxDecorationBreak = this.textContainer.style.getPropertyValue('box-decoration-break') !== '' || this.textContainer.style.getPropertyValue('-webkit-box-decoration-break') !== '';

    /** @type {number} [was: JJ] — scaled font size in px */
    this.scaledFontSize = computeBaseFontSize(videoWidth, videoHeight, containerWidth, containerHeight);

    /** @type {Function} [was: QE] — edit button click handler */
    this.onEditClick = onEditClick;

    // Edit button wiring
    if (editCommand) {
      /** @type {?HTMLElement} [was: K] — edit button */
      this.editButton = this.querySelector('.caption-edit');
      this.addEventListener(this.editButton, 'click', () => this.onEditClick());
    }

    /** @type {number} — window type: 0 = pop-on, 1 = paint-on, 2 = roll-up */
    this.type = 0;

    /** @type {number} [was: HA] — base font size px (for border-radius calc) */
    this.baseFontSizePx = this.scaledFontSize * computeFontSizeMultiplier(mergedTextStyle);

    /** @type {boolean} [was: iX] — buildPipFlags (mini-player) mode */
    this.isInlineMode = isInlineMode;

    /** @type {boolean} [was: j] — vertical writing mode active */
    this.isVertical = (windowData.params.printDirection === 2 || windowData.params.printDirection === 3);
    if (this.isVertical) applyVerticalWritingMode(this, this.element);

    // Apply window background color
    let windowBgColor = '';
    if (mergedParams.windowOpacity) {
      const rgb = parseHexColor(mergedParams.windowColor);
      windowBgColor = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${mergedParams.windowOpacity})`;
    }

    const windowStyles = {
      'background-color': windowBgColor,
      display: mergedParams.isVisible === false ? 'none' : '',
      'text-align': TEXT_ALIGN_NAMES[mergedParams.textAlign],
    };
    if (this.supportsBoxDecorationBreak) {
      windowStyles['border-radius'] = windowBgColor ? `${this.baseFontSizePx / 8}px` : '';
    }
    setStyle(this.element, windowStyles);

    // Drag support
    const dragListener = new DragListener(this.element, true);
    disposable(this, dragListener);
    dragListener.subscribe('dragstart', this.onDragStart, this);
    dragListener.subscribe('dragmove', this.onDragMove, this);
    dragListener.subscribe('dragend', this.onDragEnd, this);

    this.dragStartX = 0; // was: Fw
    this.dragStartY = 0; // was: WB
    this.dragOffsetX = 0; // was: Re
    this.dragOffsetY = 0; // was: EC
  }

  // ── Drag handlers ───────────────────────────────────────────────
  // [was: dA, Hw, gA] — Source lines 2610–2649

  onDragStart(x, y) { // was: dA
    this.dragOffsetX = x;
    this.dragOffsetY = y;
    // calculate offset from element position
  }

  onDragMove(x, y) { // was: Hw
    if (x !== this.dragOffsetX || y !== this.dragOffsetY) {
      if (!hasClass(this.element, 'ytp-dragging')) addClass(this.element, 'ytp-dragging');
      // Update anchor point, horizontal, vertical anchors based on drag delta
    }
  }

  onDragEnd() { // was: gA
    removeClass(this.element, 'ytp-dragging');
  }

  // ── Content update ──────────────────────────────────────────────

  /** [was: Sh] — Schedule content update */
  scheduleUpdate() { // was: Sh
    this.updateContent(this.displayedCues);
  }

  /**
   * [was: L] — Update the displayed caption content from cue list.
   * Source lines 2653–2764
   * @param {Array} cues
   */
  updateContent(cues) {
    // Compute window sizing
    const width = this.isInlineMode ? 0 : Math.min(this.computeWidth(), this.maxWidth);
    const height = this.computeHeight();

    // Set max constraints
    const maxDim = this.isInlineMode ? `calc(96% - 0px)` : '96%';
    setStyle(this.element, {
      top: 0, left: 0, right: '', bottom: '',
      width: width ? `${width}px` : '',
      height: height ? `${height}px` : '',
      'max-width': maxDim,
      'max-height': maxDim,
      margin: '', transform: '',
    });

    this.renderCues(cues); // was: XI

    // Position the window based on anchor-point grid
    const anchorPoint = this.captionWindowData.anchorPoint; // was: bW
    const hAnchor = this.captionWindowData.horizontalAnchor; // was: kc
    const vAnchor = this.captionWindowData.verticalAnchor; // was: ZB
    const hPercent = hAnchor * 0.96 + 2;
    const vPercent = vAnchor * 0.96 + 2;

    const posStyles = { transform: '', top: '', left: '' };

    // Horizontal positioning (3 columns: left/center/right)
    switch (anchorPoint % 3) {
      case 0: posStyles.left = `${hPercent}%`; break;
      case 1: posStyles.left = `${hPercent}%`; posStyles.transform += ' translateX(-50%)'; break;
      case 2: posStyles.right = `${100 - hPercent}%`; break;
    }

    // Vertical positioning (3 rows: top/middle/bottom)
    switch (Math.floor(anchorPoint / 3)) {
      case 0: posStyles.top = `${vPercent}%`; break;
      case 1: posStyles.top = `${vPercent}%`; posStyles.transform += ' translateY(-50%)'; break;
      case 2: posStyles.bottom = `${100 - vPercent}%`; break;
    }
    setStyle(this.element, posStyles);
  }

  /**
   * [was: XI] — Render cues into the text container.
   * Source lines 2765–2777
   */
  renderCues(cues) { // was: XI
    let firstDiff;
    for (firstDiff = 0; firstDiff < cues.length && cues[firstDiff] === this.displayedCues[firstDiff]; firstDiff++);

    if (this.isDirty || this.displayedCues.length > firstDiff) {
      // Full re-render needed
      firstDiff = 0;
      this.isDirty = false;
      this.displayedCues = [];
      this.currentVisualLine = null;
      this.lastSegmentSpan = null;
      this.lastSegmentStyle = null;
      this.textContainer.innerHTML = ''; // was: g.y0
    }

    for (; firstDiff < cues.length; firstDiff++) {
      appendSegmentToLine(this, cues[firstDiff]);
    }
  }

  /** [was: qQ] — compute content width (0 for base class) */
  computeWidth() { return 0; } // was: qQ

  /** [was: MQ] — compute content height (0 for base class) */
  computeHeight() { return 0; } // was: MQ
}

// ══════════════════════════════════════════════════════════════════════
// PaintOnWindow — type 1: renders upcoming segments as hidden then reveals.
// [was: RBa] — Source lines 3319–3342
// ══════════════════════════════════════════════════════════════════════
export class PaintOnWindow extends CaptionWindow {
  constructor(windowData, baseParams, overrideParams, videoWidth, videoHeight, containerWidth, containerHeight, experiments, onEditClick, playerApi) {
    super(windowData, baseParams, overrideParams, videoWidth, videoHeight, containerWidth, containerHeight, experiments, onEditClick, playerApi);
    this.type = 1;
  }

  /**
   * @override [was: XI]
   * Renders all window segments; those beyond the active cue list
   * are rendered hidden (visibility: hidden) to pre-allocate space.
   */
  renderCues(cues) { // was: XI
    const allWindowCues = this.windowData.children; // was: O.W — all cues in the window
    super.renderCues(cues);

    // Render remaining hidden cues to pre-compute layout
    let lastStyle, lastMerged;
    for (let i = cues.length; i < allWindowCues.length; i++) {
      const cue = allWindowCues[i];
      let hidden;
      if (lastMerged && cue.style === lastStyle) {
        hidden = lastMerged;
      } else {
        hidden = {};
        Object.assign(hidden, cue.style);
        hidden.isHidden = true; // was: iH = true  [was: qBH = { iH: !0 }]
        lastStyle = cue.style;
        lastMerged = hidden;
      }
      appendSegmentToLine(this, cue, hidden);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// RollUpWindow — type 2: roll-up / scrolling captions.
// [was: ks9] — Source lines 3406–3459
// ══════════════════════════════════════════════════════════════════════
export class RollUpWindow extends CaptionWindow {
  constructor(windowData, baseParams, overrideParams, videoWidth, videoHeight, containerWidth, containerHeight, experiments, onEditClick, playerApi) {
    super(windowData, baseParams, overrideParams, videoWidth, videoHeight, containerWidth, containerHeight, experiments, onEditClick, playerApi);
    this.type = 2;

    /** @type {Array<HTMLElement>} [was: Ie] — visual line elements */
    this.visualLines = [];

    /** @type {number} [was: UH] — previous scroll offset */
    this.previousScrollOffset = 0;

    /** @type {number} [was: S] — visible area dimension (px) */
    this.visibleSize = 0;

    /** @type {number} [was: b0] — max content dimension */
    this.maxContentSize = 0;

    /** @type {number} [was: MM] — column width (NaN until measured) */
    this.columnWidth = NaN;

    /** @type {number} [was: Xw] — previous max content size */
    this.previousMaxContentSize = 0;

    /** @type {?Array} [was: Ww] — last cues passed to updateContent */
    this.lastCues = null;

    /** @type {Object} [was: d3] — delayed timer for rollup animation */
    this.rollupAnimationTimer = new DelayedTimer(this.onRollupComplete, 433, this);

    addClass(this.element, 'ytp-caption-window-rollup');
    disposable(this, this.rollupAnimationTimer);
    setStyle(this.element, 'overflow', 'hidden');
  }

  /** @override */
  scheduleUpdate() {
    this.rollupAnimationTimer.reset(); // was: g.I9
  }

  /** [was: Y0] — Roll-up animation completion handler */
  onRollupComplete() {
    this.element.removeEventListener('transitionend', this.onRollupComplete, false);
    removeClass(this.element, 'ytp-rollup-mode');
    this.updateContent(this.lastCues, true);
  }

  /** @override [was: MQ] */
  computeHeight() { return this.isVertical ? this.maxContentSize : this.visibleSize; }

  /** @override [was: qQ] */
  computeWidth() { return this.isVertical ? this.visibleSize : this.maxContentSize; }

  /**
   * @override [was: L]
   * Handles the scroll/roll-up animation when new lines arrive.
   */
  updateContent(cues, isAfterAnimation) {
    this.lastCues = cues;
    if (this.windowData.params.rowCount) { // was: lS
      // Check for overlap with previous cues and merge
      let overlap = 0;
      for (let i = 0; i < this.displayedCues.length && overlap < cues.length; i++) {
        if (this.displayedCues[i] === cues[overlap]) overlap++;
      }
      if (overlap > 0 && overlap < cues.length) {
        cues = this.displayedCues.concat(cues.slice(overlap));
      }

      this.previousMaxContentSize = this.maxContentSize;
      this.visibleSize = 0;
      this.maxContentSize = 0;
      super.updateContent(cues);
      // Trigger rollup animation
      this.measureAndScroll(isAfterAnimation); // was: NDa
    }
    super.updateContent(cues);
  }

  // [was: NDa] — Source lines 1010–1023
  measureAndScroll(isAfterAnimation) {
    this.measureVisualLines(); // was: HUH
    const totalSize = this.visualLines.reduce((sum, createDatabaseDefinition) => (this.isVertical ? createDatabaseDefinition.offsetWidth : createDatabaseDefinition.offsetHeight) + sum, 0);
    const scrollDelta = this.visibleSize - totalSize;

    if (scrollDelta !== this.previousScrollOffset) {
      const isGrowing = scrollDelta > 0 && this.previousScrollOffset === 0;
      const isShrinking = scrollDelta < this.previousScrollOffset;
      if (!isAfterAnimation && !isNaN(scrollDelta) && !isGrowing && isShrinking) {
        addClass(this.element, 'ytp-rollup-mode');
        this.addEventListener(this.element, 'transitionend', this.onRollupComplete);
      }
      const axis = this.isVertical ? 'X' : 'Y';
      const direction = (this.isVertical && this.captionWindowData.scrollDirection !== 1) ? -scrollDelta : scrollDelta;
      setStyle(this.textContainer, 'transform', `translate${axis}(${direction}px)`);
      this.previousScrollOffset = scrollDelta;
    }
    this.measureVisualLines();
  }

  // [was: HUH] — Source lines 990–1009
  measureVisualLines() {
    this.visualLines = Array.from(this.element.getElementsByClassName('caption-visual-line'));
    const maxRows = this.windowData.params.rowCount; // was: lS
    let count = 0;
    let size = 0;
    for (let i = this.visualLines.length - 1; count < maxRows && i > -1; i--) {
      size += this.isVertical ? this.visualLines[i].offsetWidth : this.visualLines[i].offsetHeight;
      count++;
    }
    this.visibleSize = size;
  }
}
