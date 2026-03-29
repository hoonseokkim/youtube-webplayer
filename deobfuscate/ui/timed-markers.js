/**
 * Timed Markers & Key Moments UI — chapter containers, timed marker cue
 * ranges, jump/seek buttons with spin animation, and the eA9 base class
 * for chapter/marker title display.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: 110550–111561
 *     ~110470–110565  (njS — JumpButton with spin animation)
 *     ~110139–110247  (eA9 — ChapterTitleBase, VSi — ChapterTitle, DiD — TimedMarkerTitle)
 *     ~110567–110593  (DiD — TimedMarkerCueRange)
 *     ~110595–110640  (tSW — MiniplayerButton)
 *     ~110642–110713  (HRZ — InputSlider base)
 *     ~110715–110749  (NOW — VolumeInputSlider)
 *     ~110751–110808  (iR9 — VolumePopover)
 *     ~110810–111037  (Yc  — MuteButton / VolumeControl)
 *     ~111038–111141  (g.yP1 — PlayButton)
 *     ~111143–111229  (g.pi — PrevNextButton)
 *     ~111231–111427  (SyZ — FineScrubbing, A5w — thumbnail, egR — chapter title)
 *     ~111429–111561  (tV_ — HeatMapChapter)
 *
 * [was: njS, eA9, VSi, DiD, tSW, HRZ, NOW, iR9, Yc, g.yP1, g.pi,
 *        SyZ, A5w, egR, tV_]
 */

import { onCueRangeEnter, onCueRangeExit } from '../ads/dai-cue-range.js';  // was: g.onCueRangeEnter, g.onCueRangeExit
import { logClick } from '../data/visual-element-tracking.js';  // was: g.pa
import { updateVideoData } from '../features/autoplay.js';  // was: g.Sm
import { nextVideo, onVideoDataChange, pauseVideo, playVideo, previousVideo, seekBy, seekTo } from '../player/player-events.js';  // was: g.nextVideo, g.Qq, g.pauseVideo, g.playVideo, g.previousVideo, g.seekBy, g.seekTo
import { PlayerComponent } from '../player/component.js';
import { getPlayerSize, isMuted, getVolume, getCurrentTime } from '../player/time-tracking.js';
import { getLoopRange, unMute, setVolume } from '../player/player-api.js';

// ---------------------------------------------------------------------------
// ChapterTitleBase
// ---------------------------------------------------------------------------

/**
 * Base class for chapter/marker title display in the player controls.
 * Shows a clickable title with a chevron; clicking opens the chapter panel
 * or triggers an innertube command.
 *
 * Template:
 *   <div class="ytp-chapter-container">
 *     <button class="ytp-chapter-title ytp-button">
 *       <span class="ytp-chapter-title-prefix" aria-hidden="true">&bull;</span>
 *       <div class="ytp-chapter-title-content">{{chapterTitle}}</div>
 *       <div class="ytp-chapter-title-chevron">
 *         <svg><path d="M9.71 18.71l..." fill="#fff"/></svg>
 *       </div>
 *     </button>
 *   </div>
 *
 * [was: eA9] (line 110139)
 */
export class ChapterTitleBase /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Progress bar reference (for chapter data).
   * @type {Object}
   */
  progressBar; // was: this.j

  /**
   * Last displayed title text.
   * @type {string}
   */
  lastTitle = ''; // was: this.D

  /**
   * Current chapter index.
   * @type {number}
   */
  currentIndex = 0; // was: this.currentIndex

  /**
   * On-tap innertube command for the title button.
   * @type {Object|undefined}
   */
  onTapCommand; // was: this.O

  /**
   * Whether the first update has been applied.
   * @type {boolean}
   */
  isFirstUpdate = true; // was: this.A

  /**
   * The container element.
   * @type {HTMLElement}
   */
  containerElement; // was: this.Y

  /**
   * The button element.
   * @type {HTMLElement}
   */
  buttonElement; // was: this.W

  /**
   * The title content element.
   * @type {HTMLElement}
   */
  titleElement; // was: this.K

  /**
   * @param {Object} player          [was: Q]
   * @param {Object} progressBar     [was: c]
   * @param {string} cueRangeNS      Cue range namespace. [was: W]
   * @param {string} tooltipText     Tooltip for the button. [was: m]
   */
  constructor(player, progressBar, cueRangeNS, tooltipText) {
    // super({ C: 'div', Z: 'ytp-chapter-container', V: [...] });
    this.player = player;
    this.progressBar = progressBar;
    this.lastTitle = '';
    this.currentIndex = 0;
    this.onTapCommand = undefined;
    this.isFirstUpdate = true;

    this.containerElement = null; // was: this.z2('ytp-chapter-container')
    this.buttonElement = null;    // was: this.z2('ytp-chapter-title')
    this.titleElement = null;     // was: this.z2('ytp-chapter-title-content')

    this.updateSize_();

    // this.updateVideoData('newdata', this.player.getVideoData());
    // this.bindEvent(player, 'videodatachange', this.updateVideoData);
    // this.bindEvent(player, 'resize', this.updateSize_);
    // this.bindEvent(this.containerElement, 'click', this.onClick);
    // this.bindEvent(player, g.Sr(cueRangeNS), this.onCueRangeEnter); // was: this.kx
    // this.bindEvent(player, 'onLoopRangeChange', this.onCueRangeEnter);
    // this.bindEvent(player, 'innertubeCommand', this.onClickCommand);
  }

  /**
   * Handles click on the title — dispatches the on-tap command.
   * [was: onClick]
   */
  onClick() {
    // g.xt(this.player, 'innertubeCommand', this.onTapCommand);
  }

  /**
   * Constrains the title element width based on player size.
   * [was: L]
   * @private
   */
  updateSize_() {
    if (this.player.X('delhi_modern_web_player')) {
      const size = this.player.getPlayerSize();
      if (size.width) {
        // this.element.style.maxWidth = `${size.width * 0.25}px`;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// ChapterTitle
// ---------------------------------------------------------------------------

/**
 * Concrete chapter title that tracks which chapter is active based on
 * the current playback position. Updates the title text and fires
 * onActiveCommand when the chapter changes.
 *
 * [was: VSi] (line 110216)
 */
export class ChapterTitle extends ChapterTitleBase {
  /**
   * Previous chapter label (for "View chapter" tooltip override).
   * @type {string}
   */
  previousLabel = ''; // was: this.J

  /**
   * @param {Object} player      [was: Q]
   * @param {Object} progressBar [was: c]
   */
  constructor(player, progressBar) {
    super(player, progressBar, 'chapterCueRange', 'View chapter');
    this.previousLabel = '';
  }

  /**
   * Handles innertube commands that may trigger a chapter update.
   * @param {Object} command [was: Q]
   * [was: onClickCommand]
   */
  onClickCommand(command) {
    // if (g.l(command, NR)) this.onCueRangeEnter();
  }

  /**
   * Updates the on-tap command and label from video data.
   * @param {string} changeType [was: Q]
   * @param {Object} videoData  [was: c]
   * [was: updateVideoData]
   */
  updateVideoData(changeType, videoData) {
    // Extract playerBarActionButton from the decorated player bar renderer
    // this.onTapCommand = actionButton?.command;
    // GK7(this) — update visibility
  }

  /**
   * Called when a chapter cue range is entered — updates the displayed
   * title to match the current chapter.
   * [was: kx]
   */
  onCueRangeEnter() {
    let title = this.previousLabel; // was: Q
    const chapters = this.progressBar.chapters; // was: c
    const isClipsLoop = this.player.getLoopRange()?.type === 'clips'; // was: W
    if (chapters.length > 1 && !isClipsLoop) {
      const currentMs = this.player.getProgressState().current * 1000; // was: Q
      const index = this.findChapterIndex_(chapters, currentMs); // was: LI(c, Q)
      title = chapters[index].title || 'Chapters';
      if (index !== this.currentIndex || this.isFirstUpdate) {
        // g.xt(this.player, 'innertubeCommand', chapters[index].onActiveCommand);
        this.currentIndex = index;
      }
      this.isFirstUpdate = false;
    } else {
      this.isFirstUpdate = true;
    }
    this.setTitle_(title); // was: aj_(this, Q)
  }

  /**
   * Finds the chapter index for a given time.
   * @param {Array} chapters
   * @param {number} timeMs
   * @returns {number}
   * @private
   */
  findChapterIndex_(chapters, timeMs) {
    // Binary search for the chapter containing timeMs
    // was: LI(c, Q)
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (chapters[i].startTime <= timeMs) return i;
    }
    return 0;
  }

  /**
   * Sets the displayed title text.
   * @param {string} title
   * @private
   */
  setTitle_(title) {
    // was: aj_(this, Q)
    // this.updateValue('chapterTitle', title);
    this.lastTitle = title;
  }
}

// ---------------------------------------------------------------------------
// TimedMarkerCueRange (DiD)
// ---------------------------------------------------------------------------

/**
 * Timed marker title that tracks "key moments" markers rather than
 * traditional chapters. Shows the current key-moment title and handles
 * cue range enter/exit for marker visibility.
 *
 * [was: DiD] (line 110567)
 */
export class TimedMarkerCueRange extends ChapterTitleBase {
  /**
   * @param {Object} player      [was: Q]
   * @param {Object} progressBar [was: c]
   */
  constructor(player, progressBar) {
    super(player, progressBar, 'timedMarkerCueRange', 'View key moments');

    // this.bindEvent(player, g.FC('timedMarkerCueRange'), this.onCueRangeExit);
    // this.bindEvent(player, 'updatemarkervisibility', this.updateVideoData);
  }

  /**
   * Handles innertube commands — if the command is a marker expansion
   * command, exits the current cue range.
   * @param {Object} command [was: Q]
   * [was: onClickCommand]
   */
  onClickCommand(command) {
    // if (g.l(command, iBm)) this.onCueRangeExit();
  }

  /**
   * Updates the on-tap command from marker data.
   * [was: updateVideoData]
   */
  updateVideoData() {
    // this.onTapCommand = u3w(this)?.onTap?.innertubeCommand;
    // GK7(this) — update visibility
  }

  /**
   * Called when a timedMarkerCueRange is exited — updates the title
   * based on the current playback position among the timed markers.
   * [was: kx]
   */
  onCueRangeExit() {
    let title = ''; // was: Q
    const markers = this.progressBar.timedMarkers; // was: c
    let headerTitle = ''; // was: u3w(this)?.headerTitle
    // headerTitle = headerTitle ? g.rK(headerTitle) : '';

    const isClipsLoop = this.player.getLoopRange()?.type === 'clips'; // was: m
    if (markers.length > 1 && !isClipsLoop) {
      const currentMs = this.player.getProgressState().current * 1000; // was: Q
      const index = this.findMarkerIndex_(markers, currentMs); // was: UFK(c, Q)
      title = index != null ? markers[index].title : headerTitle;
      if (index != null && index !== this.currentIndex) {
        // g.xt(this.player, 'innertubeCommand', markers[index].onActiveCommand);
        this.currentIndex = index;
      }
    }
    this.setTitle_(title); // was: aj_(this, Q)
  }

  /**
   * Finds the timed marker index for a given time.
   * @param {Array} markers
   * @param {number} timeMs
   * @returns {number|null}
   * @private
   */
  findMarkerIndex_(markers, timeMs) {
    // was: UFK(c, Q)
    for (let i = markers.length - 1; i >= 0; i--) {
      if (markers[i].timeRangeStartMillis <= timeMs) return i;
    }
    return null;
  }

  /**
   * Sets the displayed title text.
   * @param {string} title
   * @private
   */
  setTitle_(title) {
    // was: aj_(this, Q)
    this.lastTitle = title;
  }
}

// ---------------------------------------------------------------------------
// JumpButton
// ---------------------------------------------------------------------------

/**
 * Seek-forward / seek-backward button with a spin animation on click.
 * Renders a circular arrow SVG with the seek amount (e.g. "10") as text.
 * Consecutive rapid clicks queue the spin animation.
 *
 * Template:
 *   <button class="ytp-button ytp-jump-button" title="{{title}}">
 *     <svg viewBox="0 0 24 24">
 *       <path class="ytp-circle-arrow ytp-svg-fill" d="..." />
 *       <text class="ytp-jump-button-text ytp-svg-fill" x="..." y="..." />
 *     </svg>
 *   </button>
 *
 * [was: njS] (line 110470)
 */
export class JumpButton /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Seek amount in seconds (negative = backward, positive = forward).
   * @type {number}
   */
  seekSeconds; // was: this.W

  /**
   * Spin animation timer (250ms per cycle).
   * @type {Object}
   */
  spinTimer; // was: this.O — new g.Uc(callback, 250)

  /**
   * Whether another spin is queued after the current one finishes.
   * @type {boolean}
   */
  spinQueued = false; // was: this.A

  /**
   * The text element showing the seek amount.
   * @type {HTMLElement}
   */
  textElement; // was: this.j

  /**
   * @param {Object} player     [was: Q]
   * @param {number} seekSeconds Seek amount in seconds. [was: c]
   */
  constructor(player, seekSeconds) {
    // super({ C: 'button', yC: ['ytp-button', 'ytp-jump-button'], ... });
    // SVG has different path for forward vs backward arrows
    this.player = player;
    this.seekSeconds = seekSeconds;
    this.spinQueued = false;

    // Spin timer callback: if spinQueued, restart; else remove animation classes
    // this.spinTimer = new g.Uc(() => {
    //   if (this.spinQueued) {
    //     this.spinQueued = false;
    //     this.spinTimer.start();
    //   } else {
    //     this.element.classList.remove('ytp-jump-spin', 'backwards');
    //   }
    // }, 250);

    const isForward = seekSeconds > 0; // was: c
    if (isForward) {
      // player.createClientVe(this.element, this, 36843);
    } else {
      // player.createClientVe(this.element, this, 36844);
    }

    // Set tooltip: "Seek forward $SECONDS seconds. (->)" or similar
    // const label = g.LQ(isForward
    //   ? 'Seek forward $SECONDS seconds. (\u2192)'
    //   : 'Seek backwards $SECONDS seconds. (\u2190)',
    //   { SECONDS: Math.abs(seekSeconds).toString() });

    // Set the text content of the SVG text element
    // this.textElement = this.element.querySelector('.ytp-jump-button-text');
    // this.textElement.textContent = Math.abs(seekSeconds).toString();

    // this.listen('click', this.onClick, this);
    // EP(player, this.element, this);
  }

  /**
   * Seeks by the configured amount and triggers the spin animation.
   * If a spin is already in progress, queues the next one.
   * [was: onClick]
   */
  onClick() {
    this.player.logClick(this.element);
    this.player.seekBy(this.seekSeconds, true);

    const direction = this.seekSeconds > 0 ? 1 : -1; // was: Q
    const amount = Math.abs(this.seekSeconds); // was: c

    // Trigger double-tap UI feedback if available
    const doubleTapUI = this.player.l9().h8; // was: W
    if (doubleTapUI) {
      doubleTapUI.showKeyboardSeek(direction, amount); // was: W.YU(Q, c)
    }

    // Start or queue the spin animation
    if (this.spinTimer?.isActive()) {
      this.spinQueued = true;
    } else {
      const classes = ['ytp-jump-spin'];
      if (this.seekSeconds < 0) classes.push('backwards');
      this.element.classList.add(...classes);
      // this.spinTimer.start();
    }
  }
}

// ---------------------------------------------------------------------------
// InputSlider
// ---------------------------------------------------------------------------

/**
 * Base class for HTML `<input type="range">` based sliders. Provides
 * a section container, an optional header element, and handles `input`
 * and `keydown` events for value changes.
 *
 * Template:
 *   <div class="ytp-input-slider-section">
 *     {optional header}
 *     <input class="ytp-input-slider" type="range"
 *            role="slider" min="{{minvalue}}" max="{{maxvalue}}"
 *            step="{{stepvalue}}" value="{{slidervalue}}" />
 *   </div>
 *
 * [was: HRZ] (line 110642)
 */
export class InputSlider /* extends PlayerComponent */ {
  /**
   * Minimum value.
   * @type {number}
   */
  minValue; // was: this.A

  /**
   * Maximum value.
   * @type {number}
   */
  maxValue; // was: this.D

  /**
   * Step size.
   * @type {number}
   */
  step; // was: this.L

  /**
   * Current value.
   * @type {number}
   */
  currentValue; // was: this.W

  /**
   * Initial value (may differ from min).
   * @type {number|undefined}
   */
  initialValue; // was: this.initialValue

  /**
   * Optional header component.
   * @type {Object|undefined}
   */
  header; // was: this.header

  /**
   * Internal counter (for debounce tracking).
   * @type {number}
   */
  changeCount = 0; // was: this.j

  /**
   * The native input element.
   * @type {HTMLInputElement}
   */
  inputElement; // was: this.O

  /**
   * @param {number}  min           [was: Q]
   * @param {number}  max           [was: c]
   * @param {number}  step          [was: W]
   * @param {number}  [initialValue] [was: m]
   * @param {Object}  [header]       Header component. [was: K]
   * @param {boolean} [isVertical=false] Whether the slider is vertical. [was: T]
   */
  constructor(min, max, step, initialValue = undefined, header = undefined, isVertical = false) {
    // super({ C: 'div', yC: ['ytp-input-slider-section', ...], V: [...] });
    this.minValue = min;
    this.maxValue = max;
    this.step = step;
    this.initialValue = initialValue;
    this.header = header;
    this.changeCount = 0;

    this.inputElement = null; // was: this.O = this.z2('ytp-input-slider')
    this.currentValue = initialValue !== undefined ? initialValue : min; // was: this.W

    this.init();
    // this.B(this.inputElement, 'input', this.onInput);
    // this.B(this.inputElement, 'keydown', this.onKeyDown);
  }

  /**
   * Initializes ARIA attributes and visual state.
   * [was: init]
   */
  init() {
    // this.update({
    //   minvalue: this.minValue, maxvalue: this.maxValue,
    //   stepvalue: this.step, slidervalue: this.currentValue,
    //   ariaValueNow: this.currentValue, ariaMinValue: this.minValue,
    //   ariaMaxValue: this.maxValue, ariaValueText: `${this.currentValue.toFixed(2)}`
    // });
    // zsR(this, this.currentValue); — update visual fill
  }

  /**
   * Handles native input events — reads the new value and applies it.
   * [was: K]
   */
  onInput() {
    // setSliderValue(this, Number(this.inputElement.value));  — was: CI(this, ...)
    // this.inputElement.focus();
  }

  /**
   * Handles keyboard events (ArrowUp/Down) for value adjustment.
   * @param {KeyboardEvent} event [was: Q]
   * [was: J]
   */
  onKeyDown(event) {
    if (event.defaultPrevented) return;
    let delta;
    switch (event.code) {
      case 'ArrowDown':
        delta = -this.step;
        break;
      case 'ArrowUp':
        delta = this.step;
        break;
      default:
        return;
    }
    const newValue = Math.min(this.maxValue, Math.max(Number((this.currentValue + delta).toFixed(2)), this.minValue));
    // setSliderValue(this, newValue); — was: CI(this, ...)
  }
}

/**
 * Easing curve for the slider thumb animation: nearly linear start,
 * smooth deceleration.
 * [was: J60] — new jC(0, 0, 0.05, 0, 0, 1, 1, 1)
 */
// const SLIDER_EASE = new jC(0, 0, 0.05, 0, 0, 1, 1, 1);

// ---------------------------------------------------------------------------
// VolumeInputSlider
// ---------------------------------------------------------------------------

/**
 * Vertical volume slider (0–100) with mouse-wheel support. Extends
 * InputSlider for use in the volume popover or horizontal volume controls.
 *
 * [was: NOW] (line 110715)
 */
export class VolumeInputSlider extends InputSlider {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Debounced volume-set callback.
   * @type {Function}
   */
  debouncedSetVolume; // was: this.S — $G(this.applyVolume_, 10, this)

  /**
   * Flag to prevent feedback loops from onVolumeChange.
   * @type {boolean}
   */
  suppressExternalUpdate = false; // was: this.Y

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    const initialVolume = player.isMuted() ? 0 : player.getVolume();
    super(0, 100, 1, initialVolume, undefined, true);
    this.player = player;
    this.suppressExternalUpdate = false;
    // this.debouncedSetVolume = $G(this.applyVolume_, 10, this);
    // this.bindEvent(player, 'onVolumeChange', this.onVolumeChange);
    // this.bindEvent(this.element, 'wheel', this.onWheel);
  }

  /**
   * Handles external volume changes (e.g. from mute button).
   * @param {{volume: number, muted: boolean}} data [was: Q]
   * [was: onVolumeChange]
   */
  onVolumeChange(data) {
    if (this.suppressExternalUpdate) {
      this.suppressExternalUpdate = false;
      return;
    }
    const vol = data.volume;
    if (vol === 0 || data.muted) {
      // setSliderValue(this, 0);
    } else {
      // setSliderValue(this, vol);
    }
  }

  /**
   * Called when the slider input changes — debounces the actual volume set.
   * [was: K]
   */
  onInput() {
    super.onInput();
    this.debouncedSetVolume?.(this.currentValue);
  }

  /**
   * Handles mouse wheel on the volume slider.
   * @param {WheelEvent} event [was: Q]
   * [was: b0]
   */
  onWheel(event) {
    let delta = -event.deltaY; // was: c
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE || event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      delta = Math.max(0, Math.min(this.currentValue + delta, 100)); // was: g.lm(...)
    } else {
      delta = Math.max(0, Math.min(this.currentValue + Math.max(-10, Math.min(delta / 10, 10)), 100));
    }
    // setSliderValue(this, delta);
    // this.debouncedSetVolume(delta);
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Applies the volume value to the player API.
   * @param {number} volume  0–100. [was: Q]
   * @param {boolean} [mute] Force mute. [was: c]
   * [was: T2]
   * @private
   */
  applyVolume_(volume, mute) {
    this.suppressExternalUpdate = true;
    if (volume === 0 || mute) {
      this.player.mute();
    } else {
      if (this.player.isMuted()) this.player.unMute();
      this.player.setVolume(volume);
    }
  }
}

// ---------------------------------------------------------------------------
// VolumePopover
// ---------------------------------------------------------------------------

/**
 * A popover panel containing a VolumeInputSlider, shown above/beside the
 * mute button. Auto-hides after 300ms when the mouse leaves.
 *
 * [was: iR9] (line 110751)
 */
export class VolumePopover /* extends PlayerComponent */ {
  /**
   * Whether the popover is currently visible.
   * @type {boolean}
   */
  isVisible = false; // was: this.isVisible

  /**
   * The volume slider inside the popover.
   * @type {VolumeInputSlider}
   */
  volumeSlider; // was: this.j

  /**
   * Auto-hide timer (300ms).
   * @type {Object}
   */
  hideTimer; // was: this.W — new g.Uc(() => setVisible(this, false), 300)

  /**
   * Tooltip instance.
   * @type {Object}
   */
  tooltip; // was: this.tooltip

  /**
   * @param {Object} player         [was: Q]
   * @param {Object} tooltipProvider [was: c]
   */
  constructor(player, tooltipProvider) {
    // super({ C: 'div', N: { tabindex: '0', ... }, yC: ['ytp-volume-popover'] });
    this.isVisible = false;
    this.tooltip = tooltipProvider.d6(); // was: c.d6()
    this.volumeSlider = new VolumeInputSlider(player); // was: new NOW(Q)
    // g.F(this, this.volumeSlider);
    // this.volumeSlider.appendTo(this.element);
    // this.hideTimer = new g.Uc(() => this.setVisible_(false), 300);

    // Bind mouseenter/leave, focus/blur -> control hide timer
    // g.F(this, this.hideTimer);
  }

  /**
   * Shows the popover.
   * [was: O]
   */
  show() {
    this.setVisible_(true); // was: Rsw(this, true)
  }

  /**
   * Starts the auto-hide timer.
   * [was: A]
   */
  startHideTimer() {
    // this.hideTimer.start();
  }

  /**
   * Stops the auto-hide timer (keeps visible).
   * [was: D]
   */
  stopHideTimer() {
    // this.hideTimer.stop();
  }

  /**
   * Returns whether the popover is visible.
   * @returns {boolean}
   * [was: K]
   */
  getIsVisible() {
    return this.isVisible;
  }

  /**
   * @param {boolean} visible
   * @private
   */
  setVisible_(visible) {
    this.isVisible = visible;
    // Toggle display CSS
  }
}

// ---------------------------------------------------------------------------
// MuteButton / VolumeControl
// ---------------------------------------------------------------------------

/**
 * The mute/unmute button with animated volume icon. In modern (Delhi)
 * mode, may also contain a VolumePopover for vertical slider access.
 *
 * The icon animates between three states:
 *   - Full volume (large + small ripple visible)
 *   - Low volume (small ripple only)
 *   - Muted (slash through speaker, ripples hidden)
 *
 * Animated via CSS transitions on SVG clip-path transforms.
 *
 * [was: Yc] (line 110810)
 */
export class MuteButton /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * SVG icon component.
   * @type {Object}
   */
  iconComponent; // was: this.O — new g.Mu(svgDef)

  /**
   * Speaker path element (animated d attribute).
   * @type {SVGElement}
   */
  speakerPath; // was: this.S

  /**
   * Whether the button is visible.
   * @type {boolean}
   */
  visible = false; // was: this.visible

  /**
   * Volume popover (Delhi mode only).
   * @type {VolumePopover|null}
   */
  volumePopover = null; // was: this.W

  /**
   * Volume icon button/container element.
   * @type {HTMLElement|null}
   */
  iconElement = null; // was: this.A

  /**
   * Tooltip instance.
   * @type {Object}
   */
  tooltip; // was: this.tooltip

  /**
   * Fullscreen/error message popup.
   * @type {Object|null}
   */
  message = null; // was: this.message

  /**
   * @param {Object} player          [was: Q]
   * @param {Object} tooltipProvider  [was: c]
   */
  constructor(player, tooltipProvider) {
    // super({ C: 'div' or 'button', Z: 'ytp-mute-button', ... });
    this.player = player;
    this.visible = false;
    this.volumePopover = null;
    this.iconElement = null; // was: g.I_('ytp-volume-icon', this.element)
    this.tooltip = tooltipProvider.d6();

    // Build SVG icon (modern or legacy) with animated clip paths
    // this.iconComponent = new g.Mu(svgDefinition);
    // this.speakerPath = this.iconComponent.z2('ytp-svg-volume-animation-speaker');

    // Animation helpers for ripple transitions
    // Bind: appresize, onVolumeChange, click

    // In Delhi mode with vertical volume, create VolumePopover
    // player.createClientVe(this.element, this, 28662);
    this.updateSize_(player.bX().getPlayerSize());
    this.setVolume(player.getVolume(), player.isMuted());
  }

  /**
   * Updates visibility based on player width (hidden below 300px).
   * @param {{width: number, height: number}} size [was: Q]
   * [was: Ie]
   */
  updateSize_(size) {
    this.visible = size.width >= 300;
    // this.setVisible(this.visible);
    // this.player.logVisibility(this.element, this.visible && this.isControlsVisible);
  }

  /**
   * Toggles mute on click (or opens popover in Delhi mode).
   * [was: J / XI]
   */
  onClick() {
    if (this.player.G().MM) {
      // Audio enabled — toggle mute
      if (this.player.isMuted()) {
        this.player.unMute();
      } else {
        this.player.mute();
      }
    }
    // this.player.logClick(this.element);
  }

  /**
   * Responds to external volume changes and updates the icon.
   * @param {{volume: number, muted: boolean}} data [was: Q]
   * [was: onVolumeChange]
   */
  onVolumeChange(data) {
    this.setVolume(data.volume, data.muted);
  }

  /**
   * Updates the icon state (speaker path, ripple visibility, mute slash)
   * with optional animation.
   * @param {number}  volume  0–100 [was: Q]
   * @param {boolean} muted          [was: c]
   * [was: setVolume]
   */
  setVolume(volume, muted) {
    const normalizedVolume = muted ? 0 : volume / 100; // was: W
    // Determine ripple state: 0 = muted, >50 = full, else low
    // Animate speaker path and mute slash if state changed
    // Update ARIA label
  }
}

/**
 * SVG path data arrays for the small and large volume ripple arcs.
 * [was: YuK, pPn]
 */
export const VOLUME_SMALL_RIPPLE_PATH = ['M', 19, ',', 11.29, ' C', 21.89, ',', 12.15, /*...*/ 'Z'];
export const VOLUME_LARGE_RIPPLE_PATH = ['M', 19, ',', 11.29, ' C', 21.89, ',', 12.15, /*...*/ 'Z'];

/**
 * Coordinate constants for play button icon positioning.
 * [was: c53, W67, JW, R1]
 */
export const PLAY_ICON_SIZE = 18;    // was: c53
export const PLAY_ICON_LEFT = 12;    // was: W67
export const PLAY_ICON_RIGHT = 22;   // was: JW
export const PLAY_ICON_CENTER = 12;  // was: R1

// ---------------------------------------------------------------------------
// PlayButton
// ---------------------------------------------------------------------------

/**
 * The main play/pause button. Shows play, pause, replay, or stop icons
 * based on the current player state. Transitions between play/pause icons
 * are animated via the AnimationHelper.
 *
 * [was: g.yP1] (line 111038)
 */
export class PlayButton /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Current icon state: 1=play, 2=pause, 3=replay, 4=stop.
   * @type {number|null}
   */
  iconState = null; // was: this.W

  /**
   * Icon transition animation helper.
   * @type {Object}
   */
  transition; // was: this.transition

  /**
   * Tooltip instance.
   * @type {Object}
   */
  tooltip; // was: this.tooltip

  /**
   * @param {Object} player          [was: Q]
   * @param {Object} tooltipProvider  [was: c]
   */
  constructor(player, tooltipProvider) {
    // super({ C: 'button', yC: ['ytp-play-button', 'ytp-button'], ... });
    this.player = player;
    this.iconState = null;
    // this.transition = new AnimationHelper();
    this.tooltip = tooltipProvider.d6();

    // player.createClientVe(this.element, this, 36842);
    // player.logVisibility(this.element, true);
    // Bind: fullscreentoggled, presentingplayerstatechange, videodatachange
    // this.updateState(player.getPlayerStateObject());
    // this.listen('click', this.onClick, this);
  }

  /**
   * Updates the icon and tooltip based on the player state.
   * @param {Object} playerState [was: Q]
   * [was: l3]
   */
  updateState(playerState) {
    let newState;
    // const isLive = g.pl(this.player.getVideoData());
    if (playerState.isOrWillBePlaying()) {
      newState = 2; // Pause (or 4 for live stop)
    } else if (playerState.isEnded()) {
      newState = 3; // Replay
    } else {
      newState = 1; // Play
    }

    if (this.iconState === newState) return;
    // Update tooltip text, icon SVG, and optionally animate the transition
    this.iconState = newState;
  }

  /**
   * Toggles play/pause on click.
   * @param {MouseEvent} event [was: Q]
   * [was: Sb]
   */
  onClick(event) {
    this.player.logClick(this.element);
    if (this.player.getPlayerStateObject().isOrWillBePlaying()) {
      this.player.pauseVideo();
    } else {
      this.player.playVideo();
    }
  }
}

// ---------------------------------------------------------------------------
// PrevNextButton
// ---------------------------------------------------------------------------

/**
 * Previous / Next video button. Behavior changes based on context:
 * - In a playlist: navigates to previous/next video.
 * - With autoplay: shows next suggestion.
 * - For "previous" with no prior video: seeks to 0.
 *
 * [was: g.pi] (line 111143)
 */
export class PrevNextButton /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Whether this is the "next" button (true) or "previous" button (false).
   * @type {boolean}
   */
  isNext; // was: this.W

  /**
   * Current video data.
   * @type {Object|null}
   */
  videoData = null; // was: this.videoData

  /**
   * Current playlist reference.
   * @type {Object|null}
   */
  playlist = null; // was: this.playlist

  /**
   * Whether "previous" should seek to start instead of going back.
   * @type {boolean}
   */
  shouldSeekToStart = false; // was: this.A

  /**
   * Tooltip instance.
   * @type {Object}
   */
  tooltip; // was: this.tooltip

  /**
   * @param {Object}  player          [was: Q]
   * @param {Object}  tooltipProvider  [was: c]
   * @param {boolean} isNext           [was: W]
   */
  constructor(player, tooltipProvider, isNext) {
    // super({ C: 'a', yC: [...], ... });
    this.player = player;
    this.isNext = isNext;
    this.videoData = null;
    this.playlist = null;
    this.shouldSeekToStart = false;
    this.tooltip = tooltipProvider.d6();

    // Bind: fullscreentoggled, videodatachange, onPlaylistUpdate, onLoopRangeChange, etc.
    this.onVideoDataChange();
  }

  /**
   * Refreshes button state (visibility, label, thumbnail) from video data.
   * [was: onVideoDataChange]
   */
  onVideoDataChange() {
    // this.videoData = this.player.getVideoData({ playerType: 1 });
    // this.playlist = this.player.getPlaylist();
    // Update visibility, tooltip, preview thumbnail
  }

  /**
   * Navigates to next/previous video or seeks to start.
   * @param {MouseEvent} event [was: Q]
   * [was: onClick]
   */
  onClick(event) {
    this.player.logClick(this.element);
    if (this.isNext) {
      this.player.nextVideo(true);
    } else if (this.shouldSeekToStart) {
      this.player.seekTo(0);
    } else {
      this.player.previousVideo(true);
    }
  }
}

// ---------------------------------------------------------------------------
// FineScrubbing
// ---------------------------------------------------------------------------

/**
 * Fine-scrubbing panel that appears above the progress bar when the user
 * pulls up. Shows a strip of thumbnails at high resolution with a draggable
 * cursor for frame-precise seeking.
 *
 * Template:
 *   <div class="ytp-fine-scrubbing">
 *     <div class="ytp-fine-scrubbing-draggable">
 *       <div class="ytp-fine-scrubbing-thumbnails" role="slider" />
 *     </div>
 *     <div class="ytp-fine-scrubbing-cursor" />
 *     <div class="ytp-fine-scrubbing-seek-time">{{seekTime}}</div>
 *     <div class="ytp-fine-scrubbing-play" />
 *     <div class="ytp-fine-scrubbing-dismiss" />
 *   </div>
 *
 * [was: SyZ] (line 111231)
 */
export class FineScrubbing /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  api; // was: this.api

  /**
   * Whether fine scrubbing is currently enabled/active.
   * @type {boolean}
   */
  isEnabled = false; // was: this.isEnabled

  /**
   * Array of thumbnail elements.
   * @type {Array}
   */
  thumbnails = []; // was: this.thumbnails

  /**
   * Saved time before fine scrubbing started.
   * @type {number}
   */
  savedTime = 0; // was: this.UH

  /**
   * @param {Object} player          [was: Q]
   * @param {Object} tooltipInstance  [was: c]
   */
  constructor(player, tooltipInstance) {
    // super({ C: 'div', Z: 'ytp-fine-scrubbing', ... });
    this.api = player;
    this.isEnabled = false;
    this.thumbnails = [];
    this.savedTime = 0;
    // Drag interaction, event bindings, etc.
  }

  /**
   * Enables fine scrubbing — records the current time and shows the panel.
   * [was: enable]
   */
  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.savedTime = this.api.getCurrentTime();
    // Show the panel, bind wheel events, log visibility
  }

  /**
   * Disables fine scrubbing and hides the panel.
   * [was: disable]
   */
  disable() {
    this.isEnabled = false;
    this.hide();
    // Unbind wheel events, log visibility
  }

  /**
   * Plays from the current fine-scrub position and closes the panel.
   * @param {boolean} [logClick] Whether to log the play click. [was: Q]
   * [was: play]
   */
  play(logClick) {
    // this.api.seekTo(computedTime, ...);
    this.api.playVideo();
    // if (logClick) this.api.logClick(this.playButton);
  }

  /**
   * Exits fine scrubbing — restores the saved time and resumes playback.
   * @param {boolean} [logClick] Whether to log the dismiss click. [was: Q]
   * [was: onExit]
   */
  onExit(logClick) {
    this.api.seekTo(this.savedTime);
    this.api.playVideo();
    // if (logClick) this.api.logClick(this.dismissButton);
  }

  /**
   * Resets the fine scrubbing state completely.
   * [was: reset]
   */
  reset() {
    this.disable();
    // Clear thumbnail cache and storyboard data
  }
}

/**
 * A single thumbnail element within the fine-scrubbing strip.
 * [was: A5w] (line 111407)
 */
export class FineScrubbingThumbnail /* extends PlayerComponent */ {
  constructor() {
    // super({ C: 'div', Z: 'ytp-fine-scrubbing-thumbnail' });
  }
}

/**
 * Chapter title overlay within the fine-scrubbing strip.
 * [was: egR] (line 111415)
 */
export class FineScrubbingChapterTitle /* extends PlayerComponent */ {
  constructor() {
    // super({ C: 'div', Z: 'ytp-fine-scrubbing-chapter-title', V: [...] });
  }
}

// ---------------------------------------------------------------------------
// HeatMapChapter
// ---------------------------------------------------------------------------

/**
 * A single chapter segment of the heat map visualization on the progress bar.
 * Contains an SVG with a clipped path representing the engagement curve,
 * plus rect overlays for hover, play-progress, and modern gradient rendering.
 *
 * Template:
 *   <div class="ytp-heat-map-chapter">
 *     <svg class="ytp-heat-map-svg" viewBox="0 0 1000 100">
 *       <defs>
 *         <clipPath id="{{id}}">
 *           <path class="ytp-heat-map-path" d="" fill="white" />
 *         </clipPath>
 *         <linearGradient id="ytp-heat-map-gradient-def" ...>
 *           <stop offset="0%" stop-color="white" stop-opacity="1" />
 *           <stop offset="100%" stop-color="white" stop-opacity="0" />
 *         </linearGradient>
 *       </defs>
 *       <rect class="ytp-heat-map-graph" clip-path="url(#hm_1)" fill-opacity="0.4" />
 *       <rect class="ytp-heat-map-hover" clip-path="url(#hm_1)" fill-opacity="0.7" />
 *       <rect class="ytp-heat-map-play" clip-path="url(#hm_1)" />
 *       <path class="ytp-modern-heat-map" fill="url(#ytp-heat-map-gradient-def)" />
 *     </svg>
 *   </div>
 *
 * [was: tV_] (line 111429)
 */
export class HeatMapChapter /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  api; // was: this.api

  /**
   * The SVG container element.
   * @type {SVGElement}
   */
  svgElement; // was: this.J

  /**
   * The clip-path path element.
   * @type {SVGPathElement}
   */
  clipPath; // was: this.K

  /**
   * The background graph rect.
   * @type {SVGRectElement}
   */
  graphRect; // was: this.j

  /**
   * The play-progress rect.
   * @type {SVGRectElement}
   */
  playRect; // was: this.D

  /**
   * The hover-highlight rect.
   * @type {SVGRectElement}
   */
  hoverRect; // was: this.W

  /**
   * The modern gradient path element.
   * @type {SVGPathElement}
   */
  modernPath; // was: this.A

  /**
   * Whether this chapter's heat map data has been populated.
   * @type {boolean}
   */
  isPopulated = false; // was: this.Xq

  /**
   * Height of the heat map in dp.
   * @type {number}
   */
  heightDp = 60; // was: this.O

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super({ C: 'div', Z: 'ytp-heat-map-chapter', V: [SVG...] });
    this.api = player;
    this.svgElement = null;  // was: this.z2('ytp-heat-map-svg')
    this.clipPath = null;    // was: this.z2('ytp-heat-map-path')
    this.graphRect = null;   // was: this.z2('ytp-heat-map-graph')
    this.playRect = null;    // was: this.z2('ytp-heat-map-play')
    this.hoverRect = null;   // was: this.z2('ytp-heat-map-hover')
    this.modernPath = null;  // was: this.z2('ytp-modern-heat-map')
    this.isPopulated = false;
    this.heightDp = 60;

    // Generate a unique clip-path ID and set it on the rects
    // const clipId = `${g.ZR(this)}`;
    // this.update({ id: clipId });
    // const clipUrl = `url(#${clipId})`;
    // this.graphRect.setAttribute('clip-path', clipUrl);
    // this.playRect.setAttribute('clip-path', clipUrl);
    // this.hoverRect.setAttribute('clip-path', clipUrl);
  }

  /**
   * Updates the play-progress fill width.
   * @param {number} fraction  0–1 [was: Q]
   * [was: Y]
   */
  setPlayProgress(fraction) {
    this.playRect?.setAttribute('width', `${(fraction * 100).toFixed(2)}%`);
  }

  /**
   * Updates the hover-highlight fill width.
   * @param {number} fraction  0–1 [was: Q]
   * [was: L]
   */
  setHoverProgress(fraction) {
    this.hoverRect?.setAttribute('width', `${(fraction * 100).toFixed(2)}%`);
  }
}
