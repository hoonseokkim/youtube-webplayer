/**
 * Keyboard Shortcut Handler
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~108200-108585
 *
 * Processes keyboard events on the player and maps them to actions such as
 * play/pause, seeking, volume, fullscreen, captions, and speed changes.
 * Part of the chrome UI controller (W1H) keyboard service.
 */

// ---------------------------------------------------------------------------
// Imports (conceptual)
// ---------------------------------------------------------------------------
import { isMac } from '../core/platform.js'; // was: Ul
import { MusicTrackHandler } from '../modules/offline/offline-orchestration.js'; // was: END
import { isSplitScreenEligible } from '../media/audio-normalization.js'; // was: UP
import { getActiveReceiver } from '../modules/remote/mdx-client.js'; // was: r6
import { getConfig } from '../core/composition-helpers.js';
import { isMutedByEmbedsMutedAutoplay, startSeekCsiAction, unMute } from '../player/player-api.js';
import { startsWith } from '../core/string-utils.js';
import { previousVideo, nextVideo, seekBy, playVideo, pauseVideo } from '../player/player-events.js';
import { getPlaybackRate, isMuted, getVolume, setPlaybackRate } from '../player/time-tracking.js';
import { exitFineScrubbing } from '../ui/controls/audio-slider.js';
import { seekTo } from '../ads/dai-cue-range.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Whether we are on macOS (affects modifier key interpretation). */
const IS_MAC = false; // was: Ul -- set at runtime

// ---------------------------------------------------------------------------
// Key-code reference (for readability)
// ---------------------------------------------------------------------------
const KEY = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  ESCAPE: 27,
  SPACE: 32,
  MusicTrackHandler: 35,
  HOME: 36,
  LEFT: 37,
  isSplitScreenEligible: 38,
  RIGHT: 39,
  DOWN: 40,
  COMMA: 188,   // "<" (speed down, frame back)
  PERIOD: 190,  // ">" (speed up, frame forward)
  ZERO: 48,     // through 57 = number keys
  NUMPAD_0: 96, // through 105
  C_KEY: 67,
  F_KEY: 70,
  J_KEY: 74,
  K_KEY: 75,
  L_KEY: 76,
  M_KEY: 77,
  N_KEY: 78,
  O_KEY: 79,
  P_KEY: 80,
  W_KEY: 87,
  PLUS: 187,
  MINUS: 189,
  MINUS_FF: 173, // Firefox minus
  EQUALS_FF: 61, // Firefox equals/plus
};

// ---------------------------------------------------------------------------
// KeyboardService (extracted logic from chrome controller)
// ---------------------------------------------------------------------------

/**
 * Handles global keyboard shortcuts for the player.
 *
 * This class is part of the chrome UI controller [was: W1H] and contains
 * the `handleGlobalKeyDown` / `handleGlobalKeyUp` methods that were
 * originally inline in that class (lines ~108305-108562).
 */
export class KeyboardShortcutHandler {
  /**
   * @param {Object} api           Player API
   * @param {Object} bezelDisplay  On-screen bezel/feedback display [was: this.r6]
   * @param {Object} controlsManager  [was: this.Lx]
   * @param {Object} seekOverlay   Seek overlay with animated arrows [was: this.W]
   * @param {Object} progressBar   Progress bar component [was: this.progressBar]
   */
  constructor(api, bezelDisplay, controlsManager, seekOverlay, progressBar) {
    /** @type {Object} Player API */
    this.api = api;

    /** @type {Object} Bezel display for feedback icons [was: this.r6] */
    this.bezelDisplay = bezelDisplay;

    /** @type {Object} Controls autohide manager [was: this.Lx] */
    this.controlsManager = controlsManager;

    /** @type {Object|null} Seek overlay with animated indicators [was: this.W] */
    this.seekOverlay = seekOverlay;

    /** @type {Object|null} Progress bar (for fine scrubbing) [was: this.progressBar] */
    this.progressBar = progressBar;

    /** @type {string} Accumulated chars for easter eggs [was: this.A] */
    this._easterEggBuffer = '';

    /** @type {Object} Internal state flags [was: this.j] */
    this._state = {
      isDisabled: false,         // was: D6
      isConsumed: false,         // was: Fl
      isEditing: false,          // was: Ed
    };
  }

  // -----------------------------------------------------------------------
  // Key Up  (line ~108305)
  // -----------------------------------------------------------------------

  /**
   * Handle global key-up events.
   *
   * @param {number}  keyCode   [was: Q]
   * @param {boolean} shiftKey  [was: c]
   * @param {boolean} ctrlKey   [was: W]
   * @param {boolean} altKey    [was: m]
   * @param {boolean} metaKey   [was: K]
   * @param {string}  key       [was: T]
   * @param {string}  code      [was: r]
   * @returns {boolean} Whether the event was handled.
   *
   * [was: handleGlobalKeyUp]
   */
  handleKeyUp(keyCode, shiftKey, ctrlKey, altKey, metaKey, key, code) {
    this.api.publish('keyboardserviceglobalkeyup', {
      keyCode, shiftKey, ctrlKey, altKey, metaKey, key, code,
    });

    let handled = false;
    if (this._state.isDisabled) return handled;

    switch (keyCode) {
      case KEY.TAB:
        this._showKeyboardFocus(true); // was: wH(this, !0)
        handled = true;
        break;

      case KEY.SPACE:
        // Speed-master spacebar release (experimental)
        if (this.api.experimentEnabled('web_speedmaster_spacebar_control')) {
          if (!this.api.getConfig().disableKeyboard) {
            handled = this._togglePlayPause(this.progressBar?.getFineScrubbing()?.isEnabled);
          }
        }
        break;

      case KEY.RIGHT:
        // Ctrl+Right (or Cmd+Right on Mac) = seek to next chapter
        if (this.api.experimentEnabled('web_enable_keyboard_shortcut_for_timely_actions')) {
          const useModifier = IS_MAC ? altKey : ctrlKey;
          if (useModifier && this.api.canSeek()) {
            handled = this._seekToNextChapter();
          }
        }
        break;
    }

    return handled;
  }

  // -----------------------------------------------------------------------
  // Key Down  (line ~108338)
  // -----------------------------------------------------------------------

  /**
   * Handle global key-down events -- the main shortcut dispatcher.
   *
   * @param {number}  keyCode [was: Q]
   * @param {boolean} shiftKey [was: c]
   * @param {boolean} ctrlKey  [was: W]
   * @param {boolean} altKey   [was: m]
   * @param {boolean} metaKey  [was: K]
   * @param {string}  key      [was: T]
   * @param {string}  code     [was: r]
   * @param {boolean} repeat   [was: U]
   * @returns {boolean} Whether the event was handled.
   *
   * [was: handleGlobalKeyDown]
   */
  handleKeyDown(keyCode, shiftKey, ctrlKey, altKey, metaKey, key, code, repeat) {
    if (!repeat) this._state.isDisabled = false;

    let handled = false;
    const config = this.api.getConfig();
    const isFineScrubbing = this.progressBar?.getFineScrubbing()?.isEnabled;

    // Block all shortcuts if keyboard disabled and not muted-autoplay
    if (config.disableKeyboard && !this.api.isMutedByEmbedsMutedAutoplay()) {
      return handled;
    }

    // Easter egg detection (lines 108357-108363)
    // "awesome" -> color party; "bday" -> celebration animation
    if (!config.isMobileDevice) {
      const ch = key || String.fromCharCode(keyCode).toLowerCase();
      this._easterEggBuffer += ch;
      if ('awesome'.startsWith(this._easterEggBuffer)) {
        handled = true;
        if (this._easterEggBuffer.length === 7 && this._easterEggBuffer === 'awesome') {
          this.api.getRootNode().classList.toggle('ytp-color-party');
        }
      } else {
        this._easterEggBuffer = ch;
        handled = 'awesome'.startsWith(this._easterEggBuffer);
      }
    }

    if (handled) return handled;

    // Block shortcuts that require non-muted state
    if (this.api.isMutedByEmbedsMutedAutoplay() && !_MUTED_ALLOWED_KEYS.includes(keyCode)) {
      return handled;
    }

    const chapters = this.api.getVideoData()?.chapters ?? [];
    const hasModifier = IS_MAC ? altKey : ctrlKey; // was: V

    switch (keyCode) {
      // -------------------------------------------------------------------
      // Shift+P = Previous video
      // -------------------------------------------------------------------
      case KEY.P_KEY:
        if (shiftKey && !config.disablePlaylistNavigation) {
          this._showBezel(_previousIcon(), 'Previous'); // was: Bv(this.r6, U7m(), "Previous")
          this.api.previousVideo();
          handled = true;
        }
        break;

      // -------------------------------------------------------------------
      // Shift+N = Next video
      // -------------------------------------------------------------------
      case KEY.N_KEY:
        if (shiftKey && !config.disablePlaylistNavigation) {
          this._showBezel(_nextIcon(), 'Next');
          this.api.nextVideo();
          handled = true;
        }
        break;

      // -------------------------------------------------------------------
      // J = Seek backward 10 seconds
      // -------------------------------------------------------------------
      case KEY.J_KEY:
        if (this.api.canSeek()) {
          this.api.startSeekCsiAction();
          if (this.seekOverlay) {
            this.seekOverlay.showSeek(-1, 10); // was: this.W.YU(-1, 10)
          } else {
            this._showBezel(_rewind10Icon());
            this.api.seekBy(-10 * this.api.getPlaybackRate(), undefined, undefined, 73);
          }
          handled = true;
        }
        break;

      // -------------------------------------------------------------------
      // L = Seek forward 10 seconds
      // -------------------------------------------------------------------
      case KEY.L_KEY:
        if (this.api.canSeek()) {
          this.api.startSeekCsiAction();
          if (this.seekOverlay) {
            this.seekOverlay.showSeek(1, 10);
          } else {
            this._showBezel(_forward10Icon());
            this.api.seekBy(10 * this.api.getPlaybackRate(), undefined, undefined, 74);
          }
          handled = true;
        }
        break;

      // -------------------------------------------------------------------
      // Left Arrow = Seek backward 5s (or previous chapter with Ctrl)
      // -------------------------------------------------------------------
      case KEY.LEFT:
        if (this.api.canSeek()) {
          this.api.startSeekCsiAction();
          if (hasModifier) {
            handled = this._seekToPreviousChapter(chapters);
          } else {
            if (this.seekOverlay) {
              this.seekOverlay.showSeek(-1, 5);
            } else {
              this._showBezel(_rewind5Icon());
              this.api.seekBy(-5 * this.api.getPlaybackRate(), undefined, undefined, 71);
            }
            handled = true;
          }
        }
        break;

      // -------------------------------------------------------------------
      // Right Arrow = Seek forward 5s (or next chapter with Ctrl)
      // -------------------------------------------------------------------
      case KEY.RIGHT:
        if (this.api.canSeek()) {
          this.api.startSeekCsiAction();
          if (hasModifier) {
            handled = this._seekToNextChapter(chapters);
          } else {
            if (this.seekOverlay) {
              this.seekOverlay.showSeek(1, 5);
            } else {
              this._showBezel(_forward5Icon());
              this.api.seekBy(5 * this.api.getPlaybackRate(), undefined, undefined, 72);
            }
            handled = true;
          }
        }
        break;

      // -------------------------------------------------------------------
      // M = Toggle mute
      // -------------------------------------------------------------------
      case KEY.M_KEY:
        if (this.api.isMuted()) {
          this.api.unMute();
          this._showVolumeBezel(this.api.getVolume(), false);
        } else {
          this.api.mute();
          this._showVolumeBezel(0, true);
        }
        handled = true;
        break;

      // -------------------------------------------------------------------
      // Space = Toggle play/pause (or speed-master release)
      // -------------------------------------------------------------------
      case KEY.SPACE:
        handled = this.api.experimentEnabled('web_speedmaster_spacebar_control')
          ? !config.disableKeyboard
          : this._togglePlayPause(isFineScrubbing);
        break;

      // -------------------------------------------------------------------
      // K = Toggle play/pause
      // -------------------------------------------------------------------
      case KEY.K_KEY:
        handled = this._togglePlayPause(isFineScrubbing);
        break;

      // -------------------------------------------------------------------
      // Shift+> = Increase playback speed by 0.25
      // -------------------------------------------------------------------
      case KEY.PERIOD:
        if (shiftKey) {
          if (config.enableSpeedOptions && this._canChangeSpeed()) {
            const rate = this.api.getPlaybackRate();
            this.api.setPlaybackRate(rate + 0.25, true);
            this._showSpeedBezel(false);
            handled = true;
          }
        } else if (this.api.canSeek()) {
          this._stepFrame(1); // frame-forward when paused
          handled = true;
        }
        break;

      // -------------------------------------------------------------------
      // Shift+< = Decrease playback speed by 0.25
      // -------------------------------------------------------------------
      case KEY.COMMA:
        if (shiftKey) {
          if (config.enableSpeedOptions && this._canChangeSpeed()) {
            const rate = this.api.getPlaybackRate();
            this.api.setPlaybackRate(rate - 0.25, true);
            this._showSpeedBezel(true);
            handled = true;
          }
        } else if (this.api.canSeek()) {
          this._stepFrame(-1);
          handled = true;
        }
        break;

      // -------------------------------------------------------------------
      // F = Toggle fullscreen
      // -------------------------------------------------------------------
      case KEY.F_KEY:
        if (this.api.canToggleFullscreen()) {
          this.api.toggleFullscreen().catch(() => {});
          handled = true;
        }
        break;

      // -------------------------------------------------------------------
      // Escape = Exit fine-scrubbing or dismiss active panel
      // -------------------------------------------------------------------
      case KEY.ESCAPE:
        if (isFineScrubbing) {
          this.progressBar.exitFineScrubbing();
          handled = true;
        } else if (this._dismissActivePanel()) {
          handled = true;
        }
        break;
    }

    // -------------------------------------------------------------------
    // C = Toggle captions
    // -------------------------------------------------------------------
    if (config.controlsType !== '3') {
      if (keyCode === KEY.C_KEY) {
        if (this.api.hasCaptionTrack()) {
          const currentTrack = this.api.getOption('captions', 'track');
          this.api.toggleSubtitles(true);
          this._showCaptionBezel(!currentTrack || (currentTrack && !currentTrack.displayName));
          handled = true;
        }
      }
      // O = cycle text opacity, W = cycle window opacity
      // +/- = change font size
    }

    // -------------------------------------------------------------------
    // Number keys 0-9 = Seek to percentage (0% - 90%)
    // -------------------------------------------------------------------
    if (!shiftKey && !ctrlKey && !altKey) {
      let pct;
      if (keyCode >= 48 && keyCode <= 57) pct = keyCode - 48;
      else if (keyCode >= 96 && keyCode <= 105) pct = keyCode - 96;

      if (pct != null && this.api.canSeek()) {
        this.api.startSeekCsiAction();
        const state = this.api.getProgressState();
        const target = (pct / 10) * (state.seekableEnd - state.seekableStart) + state.seekableStart;
        this.api.seekTo(target, undefined, undefined, undefined, 81);
        handled = true;
      }
    }

    if (handled) this.controlsManager.resetAutoHide(); // was: this.Lx.aM()
    return handled;
  }

  // -----------------------------------------------------------------------
  // Frame stepping  (line ~108563)
  // -----------------------------------------------------------------------

  /**
   * When paused, step forward/backward by one frame.
   *
   * @param {number} direction  +1 or -1
   * [was: step(Q)]
   */
  _stepFrame(direction) {
    if (this.api.getPlayerStateObject().isPaused()) {
      const format = this.api.getVideoData().format; // was: c.video
      if (format) {
        const fps = format.fps || 30;
        this.api.seekBy(direction / fps, undefined, undefined, direction > 0 ? 77 : 78);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Play / Pause toggle  (line ~108570)
  // -----------------------------------------------------------------------

  /**
   * Toggle play/pause state (Space or K key).
   *
   * @param {boolean} isFineScrubbing  Whether fine-scrubbing is active
   * @returns {boolean} true if handled
   * [was: Sb(Q)]
   */
  _togglePlayPause(isFineScrubbing) {
    if (this.api.getConfig().disableKeyboard) return false;

    if (isFineScrubbing) {
      this.progressBar.resumeFromFineScrubbing();
    } else {
      const shouldPlay = !this.api.getPlayerStateObject().isOrWillBePlaying();
      this.bezelDisplay.showPlayPause(shouldPlay); // was: this.r6.HF(Q)
      if (shouldPlay) {
        this.api.playVideo();
      } else {
        this.api.pauseVideo();
      }
    }
    return true;
  }

  // -----------------------------------------------------------------------
  // Helpers (stubs)
  // -----------------------------------------------------------------------

  _showBezel(_icon, _label) { /* was: Bv(this.getActiveReceiver, ...) */ }
  _showVolumeBezel(_vol, _muted) { /* was: xZ(this.getActiveReceiver, ...) */ }
  _showSpeedBezel(_isDecrease) { /* was: EoX(this.getActiveReceiver, ...) */ }
  _showCaptionBezel(_isOn) { /* was: s47(this.getActiveReceiver, ...) */ }
  _showKeyboardFocus(_show) { /* was: wH(this, ...) */ }
  _canChangeSpeed() { return true; /* was: Bi0(this) */ }
  _dismissActivePanel() { return false; /* was: this.mF() */ }
  _seekToNextChapter(_chapters) { return false; }
  _seekToPreviousChapter(_chapters) { return false; }
}

// Allowed keys even during muted autoplay [was: Mf9]
const _MUTED_ALLOWED_KEYS = [KEY.M_KEY, KEY.isSplitScreenEligible, KEY.DOWN];

// Icon stubs
function _previousIcon() { return null; }
function _nextIcon() { return null; }
function _rewind5Icon() { return null; }
function _rewind10Icon() { return null; }
function _forward5Icon() { return null; }
function _forward10Icon() { return null; }
