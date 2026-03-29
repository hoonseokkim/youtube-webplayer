/**
 * Slider/button control miscellaneous: speed slider, subtitle settings, captions menu,
 * variable speed panel, settings menu, subtitle button, time display, volume panel,
 * standard controls assembly, suggested action overlay, title bar, tooltip.
 * Source: base.js lines 113084–114999 (skipping 113001–113083 and 114242–114448, already covered)
 *
 * [was: OR4] SpeedSlider — legacy speed slider using custom slider base
 * [was: fQi] SpeedSliderComponent — wrapper for speed slider (input or custom)
 * [was: vjv] CustomSpeedPanel — custom speed sub-panel
 * [was: aQa] PlaybackSpeedMenuItem — playback speed menu item in settings
 * [was: GYS] SubtitleOptionMenuItem — individual subtitle option (font, color, etc.)
 * [was: $iD] SubtitleOptionsPanel — panel containing all subtitle style options
 * [was: Pm4] AutoTranslateMenu — auto-translate language selection
 * [was: lQi] SubtitlesCCMenuItem — subtitles/CC track selection menu item
 * [was: utW] VariableSpeedPanel — granular speed panel with slider and presets
 * [was: hA9] VariableSpeedMenuItem — speed menu item that opens variable speed panel
 * [was: zAW] SettingsMenu — the main settings gear menu
 * [was: Cm9] SubtitlesButton — CC button in controls bar
 * [was: g.MSo] TimeDisplay — current time / duration display
 * [was: JPo] VolumePanel — volume slider with drag support
 * [was: (anon)] StandardControls — assembles all bottom chrome controls
 * [was: Yy9] SuggestedActionOverlay — suggested action button overlay
 * [was: cM] TitleClassNames — CSS class name constants for title bar
 * [was: pbo] TitleBar — video title + channel name in top chrome
 * [was: g.Q_S] Tooltip — progress bar tooltip with storyboard preview
 */
import { snapSpeed } from './seek-bar-tail.js'; // was: dd
import { getPlaybackRate, setPlaybackRate } from '../player/time-tracking.js';
import { createElement, addClass } from '../core/dom-utils.js';
import { toString } from '../core/string-utils.js';
import { Panel } from './controls/menu.js';
import { Popup } from './menu-base.js';
import { PlayerComponent } from '../player/component.js';

// TODO: resolve g.lN

// TODO: resolve g.lN

// === lines 113084–113114: SpeedSlider [was: OR4] ===

/**
 * Legacy playback speed slider using the custom slider base class.
 * Shows speed text like "1.5x" and debounces rate changes.
 * [was: OR4]
 */
export class SpeedSlider extends gjS { // was: OR4
  constructor(api) { // was: Q
    super(
      api.getAvailablePlaybackRates()[0],
      api.getAvailablePlaybackRates()[api.getAvailablePlaybackRates().length - 1],
      api.getPlaybackRate()
    );
    this.U = api;
    this.D = createElement("P"); // text display element
    this.MM = $G(this.Ie, 50, this); // debounced rate setter
    addClass(this.K, "ytp-speedslider");
    addClass(this.D, "ytp-speedslider-text");
    // Insert text after slider
    const textEl = this.D; // was: Q reuse
    const sliderEl = this.K; // was: c
    sliderEl.parentNode?.insertBefore(textEl, sliderEl.nextSibling);
    this.Ou(); // update text display
    this.B(this.U, "onPlaybackRateChange", this.updateValues);
  }

  Ie() { this.U.setPlaybackRate(this.O, true); } // was: !0
  Ou() { this.D.textContent = `${dd(this, this.O)}x`; }
  W(value) { // was: Q
    super.W(value, snapSpeed(this, value).toString());
    if (this.D) { this.Ou(); this.MM(); }
  }
  updateValues() {
    const currentRate = this.U.getPlaybackRate(); // was: Q
    if (snapSpeed(this, this.O) !== currentRate) { this.W(currentRate); this.Ou(); }
  }
}

// === lines 113116–113137: SpeedSliderComponent / CustomSpeedPanel ===
// Wrappers around SpeedSlider or input-based slider

// === lines 113139–113255: PlaybackSpeedMenuItem [was: aQa] ===

/**
 * Settings menu item for playback speed with optional premium upsell badge.
 * Supports custom speed sub-panel and input slider for fine control.
 * [was: aQa]
 */
export class PlaybackSpeedMenuItem extends g.lN { // was: aQa
  // constructor: builds menu item with speed icon, available rates
  // onVideoDataChange: refresh available rates
  // A(rate): format rate label ("Normal" for 1)
  // ZF(): enable/disable based on presenting player type
  // W(rate): apply speed — custom, premium upsell, or standard
}

// === lines 113257–113370: SubtitleOptionMenuItem / SubtitleOptionsPanel ===

/**
 * Individual subtitle styling option (font family, color, size, etc.)
 * and the panel containing all subtitle customization options.
 * [was: GYS, $iD]
 */

// === lines 113372–113563: SubtitlesCCMenuItem [was: lQi] ===

/**
 * Full subtitles/CC menu item with track list, auto-translate, and options sub-panel.
 * Supports contribute, correction, and translation language selection.
 * [was: lQi]
 */
export class SubtitlesCCMenuItem extends g.lN { // was: lQi
  // constructor: builds CC menu with track list, options button, auto-translate
  // D(track): get track key ("__off__" for no track)
  // A(key): display name for track key
  // W(key): apply track selection, handle translate/contribute/correction
  // ZF(): refresh track list from API
  // Ie(langCode): apply translation language
  // lc(setting, value): apply subtitle style setting
}

// === lines 113566–113751: VariableSpeedPanel [was: utW] ===

/**
 * Granular variable speed panel with continuous slider, +/- buttons,
 * speed display, premium badge, and preset speed chips.
 * [was: utW]
 */
export class VariableSpeedPanel extends Panel { // was: utW
  // constructor: builds slider, increment buttons, preset chips, display
  // onPlaybackRateChange(rate): sync slider and display
  // Ou(rate): update display text
  // Si(): show/hide preset chips based on player width
}

// === lines 113753–113867: SettingsMenu [was: zAW] ===

/**
 * The main settings gear menu. Lazily initializes quality, subtitles, speed,
 * autoplay, and audio menu items on first open.
 * [was: zAW]
 */
export class SettingsMenu extends Popup { // was: zAW
  // constructor: creates settings panel container, subscribes to highlight/open events
  // initialize(): creates QualityMenuItem, SubtitlesCCMenuItem, speed, audio items
  // T7(item): add menu item
  // yj(item): remove menu item
  // Bw(anchor): show menu (lazy init)
  // show()/hide(): toggle ytp-settings-shown class
  // xs(visible): log visibility
  // Ig(): forward audio change
}

// === lines 113869–113956: SubtitlesButton [was: Cm9] ===

/**
 * CC button in the bottom controls bar. Toggles captions on/off.
 * Shows promo tooltip for nitrate when no tracks available.
 * [was: Cm9]
 */
export class SubtitlesButton extends PlayerComponent { // was: Cm9
  // constructor: builds button with CC icon, aria-keyshortcuts="c"
  // onClick(): toggle subtitles, show promo tooltip if applicable
  // isEnabled(): check if active track has displayName
  // ZF(): update visibility, icon opacity, tooltip text
}

// === lines 113958–114083 + 114084–114124: TimeDisplay [was: g.MSo] ===

/**
 * Current time / duration display with live badge, clip range, and countdown toggle.
 * Supports DVR live, premiere, and clip loop modes.
 * [was: g.MSo]
 */
export class TimeDisplay extends PlayerComponent { // was: g.MSo
  // constructor: builds time display with current time, separator, duration, live badge,
  //   clip icon, watch-full-video button
  // canShowCountdown(): true if not in clip or live mode
  // kx(): update current time, duration, aria label based on state
  // onLoopRangeChange(range): update clip range display
  // onVideoDataChange(reason, videoData, playerType): refresh metadata
  // updateVideoData(videoData): set isLive, isPremiere, liveIndicatorText
  // onClick(event): click live badge to seek to live edge
}

// (lines 114242–114448 already covered — skip)

// === lines 114449–114711: StandardControls (anonymous class extending g.qK) ===

/**
 * Assembles the complete bottom chrome controls: gradient, progress bar,
 * play button, jump buttons, volume, time display, chapter title,
 * right controls (CC, settings, miniplayer, AirPlay, fullscreen),
 * settings menu, overflow panel.
 * [was: anonymous class at line 114449]
 */
// Key members:
//   progressBar: g.ZRD — the progress bar
//   Yy: g.MSo — time display
//   JJ: qy1 — fullscreen button
//   A: zAW — settings menu
//   playButton: g.yP1 — play/pause button
//   EC: Cm9 — subtitles button
//   settingsButton: sgv — gear button
//   muteButton: Yc — mute toggle
//   XI: JPo — volume slider
//   Ka: VSi — chapter title
//   mF: njS — backward jump button
//   S: njS — forward jump button
//   L: BOZ — expand right-bottom button (delhi mode)

// === lines 114713–114797: SuggestedActionOverlay [was: Yy9] ===

/**
 * Suggested action button overlay (e.g., "View Chapters") triggered by timed cue ranges.
 * [was: Yy9]
 */

// === lines 114798–114891: TitleBar [was: pbo] ===

/**
 * Video title and channel name in the top chrome bar.
 * Supports link navigation, embed conversion tracking, and embed playlist mode.
 * [was: pbo]
 */

// === lines 114893–114999: Tooltip [was: g.Q_S] ===

/**
 * Progress bar tooltip with storyboard frame preview, timestamp, chapter title,
 * keyboard shortcut display, and edu text. Three display modes:
 * type 1 = progress bar hover, type 2 = button hover, type 3 = popup.
 * [was: g.Q_S]
 */
export class Tooltip extends PlayerComponent { // was: g.Q_S
  // constructor: builds complex tooltip structure with image, text, bg, pill, edu
  // setEnabled(enabled): show/hide tooltip
  // on(...): show progress bar tooltip at position
  // Ko(): dismiss type-1 tooltip
  // JL(element, text): show popup tooltip on element
  // WI(): refresh tooltip title from element attributes
  // K(): dismiss current tooltip
  // T$(...elements): dismiss if tooltip is attached to any of the elements
}
