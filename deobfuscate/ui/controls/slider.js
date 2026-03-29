/**
 * Slider / Scrubber Components — generic slider, speed slider, volume panel.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~113001-113083  (gjS — generic slider with drag, keyboard, wheel)
 *                 ~113084-113114  (OR4 — playback speed slider, legacy)
 *                 ~112954-112999  (Qi  — playback speed slider, input range)
 *                 ~113116-113137  (fQi — speed slider component wrapper)
 *                 ~114126-114242  (JPo — volume slider panel)
 *
 * [was: gjS, OR4, Qi, fQi, JPo]
 */

import { PlayerComponent } from '../../player/component.js';
import { toString } from '../../core/string-utils.js';
import { InputSlider } from '../timed-markers.js';
import { setPlaybackRate, getVolume, isMuted } from '../../player/time-tracking.js';
import { unMute, setVolume } from '../../player/player-api.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { remove } from '../../core/array-utils.js';

// ---------------------------------------------------------------------------
// GenericSlider
// ---------------------------------------------------------------------------

/**
 * A reusable slider widget with keyboard, mouse-drag, and mouse-wheel support.
 *
 * Renders a slider track with a draggable handle. Value is constrained to
 * `[minValue, maxValue]` and updated through ARIA attributes for accessibility.
 *
 * Template:
 *   <div class="ytp-slider-section" role="slider"
 *        aria-valuemin="{{minvalue}}" aria-valuemax="{{maxvalue}}"
 *        aria-valuenow="{{valuenow}}" aria-valuetext="{{valuetext}}"
 *        tabindex="0">
 *     <div class="ytp-slider">
 *       <div class="ytp-slider-handle" />
 *     </div>
 *   </div>
 *
 * [was: gjS]
 */
export class GenericSlider extends PlayerComponent {
  /**
   * Step size for keyboard increments.
   * @type {number}
   */
  step = 0.05; // was: this.L

  /**
   * Minimum allowed value.
   * @type {number}
   */
  minValue; // was: this.A

  /**
   * Maximum allowed value.
   * @type {number}
   */
  maxValue; // was: this.j

  /**
   * Total numeric range (maxValue - minValue).
   * @type {number}
   */
  range; // was: this.range

  /**
   * The outer section element (receives focus).
   * @type {HTMLElement}
   */
  sectionElement_; // was: this.Ka — z2("ytp-slider-section")

  /**
   * The slider track element.
   * @type {HTMLElement}
   */
  trackElement_; // was: this.K — z2("ytp-slider")

  /**
   * The slider handle element.
   * @type {HTMLElement}
   */
  handleElement_; // was: this.T2 — z2("ytp-slider-handle")

  /**
   * Drag interaction helper.
   * @type {Object}
   */
  dragHelper_; // was: this.J — new g.iG(this.K, true)

  /**
   * Current value.
   * @type {number}
   */
  currentValue; // was: this.O

  /**
   * @param {number} minValue       Minimum value.
   * @param {number} maxValue       Maximum value.
   * @param {number} [initialValue] Initial value (defaults to minValue).
   */
  constructor(minValue, maxValue, initialValue = undefined) {
    super({
      C: 'div',
      Z: 'ytp-slider-section',
      N: {
        role: 'slider',
        'aria-valuemin': '{{minvalue}}',
        'aria-valuemax': '{{maxvalue}}',
        'aria-valuenow': '{{valuenow}}',
        'aria-valuetext': '{{valuetext}}',
        tabindex: '0',
      },
      V: [{
        C: 'div',
        Z: 'ytp-slider',
        V: [{ C: 'div', Z: 'ytp-slider-handle' }],
      }],
    });

    this.step = 0.05;
    this.minValue = minValue;       // was: this.A = Q
    this.maxValue = maxValue;       // was: this.j = c
    this.range = maxValue - minValue; // was: this.range

    this.sectionElement_ = this.z2('ytp-slider-section'); // was: this.Ka
    this.trackElement_ = this.z2('ytp-slider');           // was: this.K
    this.handleElement_ = this.z2('ytp-slider-handle');   // was: this.T2

    this.dragHelper_ = null; // was: new g.iG(this.K, true)
    this.currentValue = initialValue !== undefined ? initialValue : minValue; // was: this.O

    // this.dragHelper_.subscribe("dragmove", this.onDrag_, this);
    // this.B(this.element, "keydown", this.onKeyDown_);
    // this.B(this.element, "wheel", this.onWheel_);

    this.initSlider_();
  }

  /**
   * Sets the slider's initial display state and ARIA attributes.
   * @private
   */
  initSlider_() { // was: init()
    this.setValue(this.currentValue);
    this.updateValue('minvalue', this.minValue);
    this.updateValue('maxvalue', this.maxValue);
  }

  /**
   * Handles keyboard input (arrow keys for step adjustment).
   *
   * @param {KeyboardEvent} event
   * @private
   */
  onKeyDown_(event) { // was: b0(Q)
    if (event.defaultPrevented) return;

    let delta; // was: c
    switch (event.keyCode) {
      case 37: // ArrowLeft
      case 40: // ArrowDown
        delta = -this.step;
        break;
      case 39: // ArrowRight
      case 38: // ArrowUp
        delta = this.step;
        break;
      default:
        return;
    }
    this.setValue(this.currentValue + delta);
    event.preventDefault();
  }

  /**
   * Handles mouse wheel input.
   *
   * @param {WheelEvent} event
   * @private
   */
  onWheel_(event) { // was: Y(Q)
    let value = this.currentValue; // was: c
    value += (event.deltaX || -event.deltaY) < 0 ? -0.05 : 0.05;
    this.setValue(value);
    event.preventDefault();
  }

  /**
   * Handles drag-move events — maps pixel position to slider value.
   *
   * @param {number} clientX  The horizontal drag position in client coords.
   * @private
   */
  onDrag_(clientX) { // was: S(Q)
    const trackLeft = this.trackElement_.getBoundingClientRect().x; // was: g.Tk(this.K).x
    const value = ((clientX - trackLeft) / 150) * this.range + this.minValue;
    this.setValue(value);
  }

  /**
   * Sets the current value, clamped to [minValue, maxValue], and updates
   * the handle position and ARIA attributes.
   *
   * @param {number} value         The new value.
   * @param {string} [displayText] Optional text for aria-valuetext.
   */
  setValue(value, displayText = '') { // was: W(Q, c="")
    value = Math.max(this.minValue, Math.min(value, this.maxValue)); // was: g.lm(Q, this.A, this.j)
    if (displayText === '') {
      displayText = value.toString();
    }
    this.updateValue('valuenow', value);
    this.updateValue('valuetext', displayText);
    this.handleElement_.style.left = `${((value - this.minValue) / this.range) * 130}px`;
    this.currentValue = value; // was: this.O = Q
  }

  /**
   * Focuses the slider section element.
   */
  focus() {
    this.sectionElement_.focus();
  }
}

// ---------------------------------------------------------------------------
// PlaybackSpeedSlider (input-range variant)
// ---------------------------------------------------------------------------

/**
 * A speed slider using an `<input type="range">` under the hood. Displays
 * the current speed as text (e.g. "1.50x") and optionally shows a "Premium"
 * badge for speeds above 2x.
 *
 * [was: Qi — extends HRZ (input-range slider base)]
 */
export class PlaybackSpeedSlider /* extends InputSlider */ {
  /**
   * Player API reference.
   * @type {Object}
   */
  api; // was: this.U

  /**
   * Text element showing current speed (e.g. "1.50x").
   * @type {HTMLElement}
   */
  speedText_; // was: this.Y — z2("ytp-speedslider-text")

  /**
   * Badge element for premium-speed indicator.
   * @type {HTMLElement}
   */
  premiumBadge_; // was: this.b0 — z2("ytp-speedslider-badge")

  /**
   * Debounced handler that commits the speed to the player.
   * @type {Function}
   */
  commitSpeed_; // was: this.S — $G(this.T2, 50, this)

  /**
   * @param {Object} api  The player API instance.
   */
  constructor(api) {
    // const rates = api.getAvailablePlaybackRates();
    // super(rates[0], rates[rates.length - 1], 0.05, api.getPlaybackRate(), {…indicator template…});

    this.api = api;
    this.speedText_ = null;   // z2("ytp-speedslider-text")
    this.premiumBadge_ = null; // z2("ytp-speedslider-badge")
    this.commitSpeed_ = null;  // debounced setPlaybackRate

    this.updateSpeedDisplay_();
    // this.B(this.O, "change", this.onInputChange_);
  }

  /**
   * Called when the underlying slider value changes (keyboard/drag).
   * @private
   */
  onSliderChange_() { // was: K()
    // super.K();
    if (this.speedText_) {
      this.updateSpeedDisplay_();
    }
  }

  /**
   * Called on `<input>` change — snaps to nearest 0.05 step, then debounces commit.
   * @private
   */
  onInputChange_() { // was: Ie()
    // Snap: Math.round(this.W / 0.05) * 0.05
    this.commitSpeed_();
  }

  /**
   * Commits the speed change to the player (debounced target).
   * @private
   */
  commitToPlayer_() { // was: T2()
    this.api.setPlaybackRate(this.currentValue, true);
  }

  /**
   * Updates the speed text label and premium badge visibility.
   * @private
   */
  updateSpeedDisplay_() { // was: Ou()
    if (this.speedText_) {
      this.speedText_.textContent = `${this.currentValue?.toFixed(2) ?? '1.00'}x`;
    }
    if (this.premiumBadge_) {
      const isPremium = (this.currentValue ?? 1) > 2;
      this.premiumBadge_.classList.toggle('ytp-speedslider-premium-badge', isPremium);
      this.premiumBadge_.setAttribute('aria-label', isPremium ? 'Premium' : '');
    }
  }
}

// ---------------------------------------------------------------------------
// VolumeSliderPanel
// ---------------------------------------------------------------------------

/**
 * The volume control slider panel. Renders as a horizontal slider with a
 * draggable handle. Supports keyboard (arrow keys, Home/End), mouse drag,
 * and mouse wheel interactions. Value range: 0-100.
 *
 * Template:
 *   <div class="ytp-volume-panel" role="slider"
 *        aria-valuemin="0" aria-valuemax="100"
 *        aria-valuenow="{{valuenow}}" aria-valuetext="{{valuetext}}"
 *        tabindex="0"
 *        title="Volume" data-tooltip-title="Volume">
 *     <div class="ytp-volume-slider">
 *       <div class="ytp-volume-slider-handle" />
 *     </div>
 *   </div>
 *
 * [was: JPo]
 */
export class VolumeSliderPanel extends PlayerComponent {
  /**
   * Player API reference.
   * @type {Object}
   */
  api; // was: this.api

  /**
   * The parent chrome-bottom element (used for active-slider styling).
   * @type {HTMLElement}
   */
  chromeBottomElement_; // was: this.D

  /**
   * Whether we're in a touch/drag interaction.
   * @type {boolean}
   */
  isDragging = false; // was: this.isDragging

  /**
   * Current volume (0-100).
   * @type {number}
   */
  volume = 0; // was: this.volume

  /**
   * Volume stored before a drag started (for mute-on-zero-drag logic).
   * @type {number}
   */
  volumeBeforeDrag_ = 0; // was: this.b0

  /**
   * Whether the panel is hovered.
   * @type {boolean}
   */
  isHovered_ = false; // was: this.W

  /**
   * Whether the panel is focused.
   * @type {boolean}
   */
  isFocused_ = false; // was: this.O

  /**
   * The slider track element.
   * @type {HTMLElement}
   */
  sliderTrack_; // was: this.L — z2("ytp-volume-slider")

  /**
   * The slider handle element.
   * @type {HTMLElement}
   */
  sliderHandle_; // was: this.Ka — z2("ytp-volume-slider-handle")

  /**
   * Drag interaction helper.
   * @type {Object}
   */
  dragHelper_; // was: this.j — new g.iG(this.L, true)

  /**
   * @param {Object} api                  Player API instance.
   * @param {HTMLElement} chromeBottom     The chrome-bottom container element.
   */
  constructor(api, chromeBottom) {
    super({
      C: 'div',
      Z: 'ytp-volume-panel',
      N: {
        title: 'Volume',
        'data-tooltip-title': 'Volume',
        role: 'slider',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': '{{valuenow}}',
        'aria-valuetext': '{{valuetext}}',
        tabindex: '0',
      },
      V: [{
        C: 'div',
        Z: 'ytp-volume-slider',
        V: [{ C: 'div', Z: 'ytp-volume-slider-handle' }],
      }],
    });

    this.api = api;
    this.chromeBottomElement_ = chromeBottom; // was: this.D
    this.isDragging = false;
    this.isHovered_ = false;
    this.isFocused_ = false;
    this.volume = 0;
    this.volumeBeforeDrag_ = 0;

    this.sliderTrack_ = this.z2('ytp-volume-slider');       // was: this.L
    this.sliderHandle_ = this.z2('ytp-volume-slider-handle'); // was: this.Ka

    this.dragHelper_ = null; // was: new g.iG(this.L, true)

    // Subscribe to drag events
    // this.dragHelper_.subscribe("dragstart", this.onDragStart_, this);
    // this.dragHelper_.subscribe("dragmove", this.onDragMove_, this);
    // this.dragHelper_.subscribe("dragend", this.onDragEnd_, this);

    // Player event bindings
    // this.B(api, "onVolumeChange", this.onVolumeChange);
    // this.B(api, "appresize", this.onResize_);
    // this.B(api, "fullscreentoggled", this.onFullscreenToggle_);
    // this.B(this.element, "keydown", this.onKeyDown_);

    // Initial state
    this.updateVolume_(api.getVolume(), api.isMuted()); // was: GM(this, …)
  }

  /**
   * Handles keyboard volume changes (Left/Right = ±5, Home = 0, End = 100).
   *
   * @param {KeyboardEvent} event
   * @private
   */
  onKeyDown_(event) { // was: MM(Q)
    if (event.defaultPrevented) return;

    const keyCode = event.keyCode; // was: c
    let newVolume = null;          // was: W

    if (keyCode === 37) newVolume = this.volume - 5;       // Left
    else if (keyCode === 39) newVolume = this.volume + 5;  // Right
    else if (keyCode === 36) newVolume = 0;                // Home
    else if (keyCode === 35) newVolume = 100;              // End

    if (newVolume !== null) {
      newVolume = Math.max(0, Math.min(newVolume, 100)); // was: g.lm(W, 0, 100)
      if (newVolume === 0) {
        this.api.mute();
      } else {
        if (this.api.isMuted()) this.api.unMute();
        this.api.setVolume(newVolume);
      }
      event.preventDefault();
    }
  }

  /**
   * Handles mouse wheel volume changes.
   *
   * @param {WheelEvent} event
   * @private
   */
  onWheel_(event) { // was: T2(Q)
    const delta = event.deltaX || -event.deltaY; // was: c
    if (event.deltaMode) {
      this.api.setVolume(this.volume + (delta < 0 ? -10 : 10));
    } else {
      const clamped = Math.max(-10, Math.min(delta / 10, 10)); // was: g.lm(c / 10, -10, 10)
      this.api.setVolume(this.volume + clamped);
    }
    event.preventDefault();
  }

  /**
   * Called when a drag starts — stores current volume for mute-on-zero logic.
   * @private
   */
  onDragStart_() { // was: UH()
    this.volumeBeforeDrag_ = this.volume; // was: this.b0 = this.volume
    if (this.api.isMuted()) {
      this.api.unMute();
    }
  }

  /**
   * Called during drag — maps pixel position to volume 0-100.
   *
   * @param {number} clientX
   * @private
   */
  onDragMove_(clientX) { // was: Ie(Q)
    const trackLeft = this.sliderTrack_.getBoundingClientRect().x; // was: g.Tk(this.L).x
    const trackWidth = 52; // or 78 in big mode
    const handleWidth = 12; // or 18 in big mode
    const x = clientX - trackLeft;  // was: Q
    const fraction = Math.max(0, Math.min((x - handleWidth / 2) / (trackWidth - handleWidth), 1));

    // Non-linear volume mapping (experiment-gated)
    let volume = fraction;
    // was: c <= .25 ? c / .25 * .1 : .1 + (c - .25) / .75 * .9
    this.api.setVolume(volume * 100);
  }

  /**
   * Called when a drag ends — mutes if dragged to zero.
   * @private
   */
  onDragEnd_() { // was: PA()
    if (this.volume === 0) {
      this.api.mute();
      this.api.setVolume(this.volumeBeforeDrag_);
    }
  }

  /**
   * Responds to volume change events from the player.
   *
   * @param {{ volume: number, muted: boolean }} volumeData
   */
  onVolumeChange(volumeData) { // was: onVolumeChange(Q)
    this.updateVolume_(volumeData.volume, volumeData.muted); // was: GM(this, Q.volume, Q.muted)
  }

  /**
   * Updates the visual state of the slider to reflect new volume/mute.
   *
   * @param {number}  volume  Volume 0-100.
   * @param {boolean} muted   Whether audio is muted.
   * @private
   */
  updateVolume_(volume, muted) { // was: GM(this, Q, c)
    this.volume = volume;
    // Update slider handle position and ARIA values
    this.updateValue('valuenow', muted ? 0 : volume);
    this.updateValue('valuetext', muted ? '0%' : `${Math.round(volume)}%`);
  }

  /**
   * Toggles hover styling on the volume control.
   *
   * @param {boolean} hovered
   */
  setHovered(hovered) { // was: J(Q)
    this.element.classList.toggle('ytp-volume-control-hover', hovered);
    this.isHovered_ = hovered;
  }

  /**
   * Cleans up — removes active slider class from chrome bottom.
   */
  dispose() { // was: WA()
    // super.dispose();
    this.chromeBottomElement_?.classList.remove('ytp-volume-slider-active');
  }
}
