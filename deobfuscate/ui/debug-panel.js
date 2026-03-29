/**
 * Debug Panel / Stats for Nerds — video info panel, sleep timer, menu item
 * renderer, option selection with keyboard nav, speedmaster overlay,
 * snackbar messages, and template variable injection.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: 102000–104000
 *     ~102000–102025  (unnamed menu-item option selection with Ka/Gf nav)
 *     ~102027–102151  (p9D   — SleepTimerMenuItem)
 *     ~102153–102188  (Qca   — SleepTimerComponent)
 *     ~102190–102250  (cvi   — SnackbarMessageComponent)
 *     ~102253–102416  (g.iG  — DragInteraction)
 *     ~102419–102449  (WpD   — SpeedmasterOverlay)
 *     ~102451–102530  (m$a   — SpeedmasterComponent)
 *     ~102532–102575  (KpH   — StationsComponent)
 *     ~102577–102590  (TTZ   — WrappedEvent)
 *     ~102592–102798  (g.Yg  — HTMLMediaElementProxy)
 *     ~102802–102818  (uN    — HorizonChart)
 *     ~102820–103147  (JMx   — StatsForNerdsPanel)
 *     ~103148–103162  (o91   — StatsForNerdsComponent)
 *     ~103164–103180  (hc    — AnimationHelper)
 *     ~103182–103327  (U$4   — TheaterModeButton)
 *     ~103329–103341  (I7W   — TheaterModeComponent)
 *     ~103343–103523  (X0m   — TimelyActionsComponent)
 *     ~103526–103539  (Av1   — ArraySizeExperiment)
 *     ~103541–103550  (ey1   — PlaybackRateExternalAPI)
 *     ~103552–103598  (IvK   — VoiceBoostToggle)
 *     ~103600–103638  (VfH   — VoiceBoostComponent)
 *     ~103640–103718  (BTm   — PoTokenComponent)
 *     ~103720–103773  (bER   — MoreVideosButton)
 *     ~103775–103999  (g.x$9 — VideowallStill, wV3 — FullscreenGrid)
 *
 * [was: p9D, Qca, cvi, g.iG, WpD, m$a, KpH, TTZ, g.Yg, uN, JMx, o91,
 *        hc, U$4, I7W, X0m, Av1, ey1, IvK, VfH, BTm, bER, g.x$9, wV3]
 */

import { onCueRangeEnter, onCueRangeExit } from '../ads/dai-cue-range.js';  // was: g.onCueRangeEnter, g.onCueRangeExit
import { addNativeListener, listen } from '../core/composition-helpers.js';  // was: g.LW, g.s7
import { logClick } from '../data/visual-element-tracking.js';  // was: g.pa
import { canPlayType } from '../media/codec-helpers.js';  // was: g.XL
import { onVideoDataChange, playVideo } from '../player/player-events.js';  // was: g.Qq, g.playVideo
import { populateSleepTimerOptions } from '../player/video-loader.js';  // was: g.Pv_
import { doc } from '../proto/messages-core.js';  // was: g.cN
import { isKnownBrowserVersion } from '../core/bitstream-helpers.js'; // was: G5
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { PlayerComponent } from '../player/component.js';
import { toString } from '../core/string-utils.js';
import { PlayerModule } from '../player/account-linking.js';
import { EventHandler } from '../core/event-handler.js';
import { ObservableTarget } from '../core/event-target.js';
import { containsNode } from '../core/dom-utils.js';
import { dispose } from '../ads/dai-cue-range.js';
import { getPlaybackRate, setPlaybackRate, isLooping, setLoop, isMuted, getCurrentTime, getDuration, getVideoPlaybackQuality, getVolume } from '../player/time-tracking.js';
import { DomEvent } from '../core/dom-event.js';
import { setVolume, togglePictureInPicture, updateEnvironmentData } from '../player/player-api.js';
import { Disposable } from '../core/disposable.js';

// ---------------------------------------------------------------------------
// Menu Item Option Selection (tail of unnamed class, lines 102000–102025)
// ---------------------------------------------------------------------------

/**
 * The tail end of a menu-item class that handles option selection,
 * keyboard navigation (right-arrow to open), and disposal of child options.
 *
 * Methods shown here are the prototype members visible in the source range.
 *
 * [was: unnamed class — continuation from prior lines]
 */

/*
  // line 102000 — toggles submenu attached/detached via Ik (settings menu)
  handleVisibility(isActive) {  // was: J(Q)
    if (isActive) {
      this.settingsMenu.attachItem(this);  // was: this.Ik.T7(this)
    } else {
      this.settingsMenu.detachItem(this);  // was: this.Ik.yj(this)
    }
  }

  // line 102007 — publish the selected value
  select(value) {  // was: W(Q)
    this.publish('select', value);
  }

  // line 102009 — keyboard selection callback (alias of select)
  onKeyboardSelect(value) {  // was: Ka(Q)
    this.select(value);
  }

  // line 102012 — format value for display
  formatValue(value) {  // was: A(Q)
    return value.toString();
  }

  // line 102015 — handle right-arrow key to open submenu
  onKeyDown(event) {  // was: Gf(Q)
    if (!event.defaultPrevented && event.keyCode === 39) { // ArrowRight
      this.open();
      event.preventDefault();
    }
  }

  // line 102019 — cleanup on dispose
  dispose() {  // was: WA()
    if (this.isAttached_ && this.settingsMenu) {
      this.settingsMenu.detachItem(this);
    }
    super.dispose();
    for (const key of Object.keys(this.options)) {
      this.options[key].dispose();
    }
  }
*/

// ---------------------------------------------------------------------------
// SleepTimerMenuItem
// ---------------------------------------------------------------------------

/**
 * Sleep-timer menu item in the player settings. Lets the user choose a
 * countdown (Off, 10/15/20/30/45/60 min, end-of-video, end-of-playlist).
 *
 * Template (label wrapper):
 *   <div class="ytp-menuitem-label-wrapper">
 *     <div>End of video</div>
 *     <div class="ytp-menuitem-sublabel">{{content}}</div>
 *   </div>
 *
 * [was: p9D]
 */
export class SleepTimerMenuItem /* extends g.lN */ {
  /**
   * Player API reference.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Map of option keys to their display labels.
   * @type {Object<string, string>}
   */
  optionMap = {}; // was: this.jG

  /**
   * Currently selected option key.
   * @type {string}
   */
  selectedOption; // was: this.b0

  /**
   * Remaining sleep time display string.
   * @type {string}
   */
  sleepTimeLeft = ''; // was: this.D

  /**
   * Remaining video time display string.
   * @type {string}
   */
  videoTimeLeft = ''; // was: this.T2

  /**
   * Label wrapper component for "End of video" sublabel.
   * @type {Object}
   */
  labelWrapper; // was: this.S

  /**
   * @param {Object} player  The player API. [was: Q]
   * @param {Object} parent  Parent settings menu. [was: c]
   */
  constructor(player, parent) {
    // super('Sleep timer', g.iN.SLEEP_TIMER, player, parent);
    this.player = player; // was: this.U = Q
    this.optionMap = {}; // was: this.jG = {}
    this.selectedOption = this.formatLabel('Off'); // was: this.b0 = this.K("Off")
    this.sleepTimeLeft = ''; // was: this.T2 = this.D = ""
    this.videoTimeLeft = '';

    // Icon setup if web_settings_menu_icons experiment is enabled
    if (player.X('web_settings_menu_icons')) {
      const icon = player.X('delhi_modern_web_player_icons')
        ? buildModernSleepIcon()  // Moon/night icon (modern variant)
        : buildLegacySleepIcon(); // Moon/Zz icon (legacy variant)
      this.setIcon(icon);
    }

    // Label wrapper with "End of video" and sublabel placeholder
    this.labelWrapper = new PlayerComponent({
      C: 'div',
      yC: ['ytp-menuitem-label-wrapper'],
      V: [
        { C: 'div', eG: 'End of video' },
        { C: 'div', yC: ['ytp-menuitem-sublabel'], eG: '{{content}}' },
      ],
    }); // was: this.S

    // g.F(this, this.labelWrapper);
    this.listen('click', this.onClick);
    this.bindEvent(player, 'videodatachange', this.onVideoDataChange);
    this.bindEvent(player, 'presentingplayerstatechange', this.onStateChange); // was: this.ZF
    this.bindEvent(player, 'settingsMenuVisibilityChanged', this.onMenuVisibilityChange); // was: this.PA
    player.createClientVe(this.element, this, 218889);
    this.onStateChange(); // was: this.ZF()
    // g.xt(this.player, 'onSleepTimerFeatureAvailable');
  }

  /**
   * Update options and selection when presenting player state changes.
   * Disables the item when presenting player type is ad (2).
   * [was: ZF]
   */
  onStateChange() {
    const offLabel = this.formatLabel('Off'); // was: Q
    if (this.player.getPresentingPlayerType() !== 2) {
      populateSleepTimerOptions(this); // was: Pv_(this)
      this.setSelected(this.selectedOption); // was: this.O(this.b0)
      if (this.sleepTimeLeft) {
        if (this.selectedOption === offLabel) {
          this.sleepTimeLeft = '';
        } else {
          this.setSleepTimerTimeLeft(this.sleepTimeLeft);
        }
      }
      if (this.videoTimeLeft) {
        this.setVideoTimeLeft(this.videoTimeLeft);
      }
      this.enable(true);
    } else {
      this.setOptions([]);
      this.enable(false);
    }
  }

  /**
   * Handles option selection — persists choice and closes the menu.
   * @param {string} optionKey [was: Q]
   * [was: W]
   */
  onSelect(optionKey) {
    this.applySelection(optionKey); // was: this.Ie(Q)
    this.settingsMenu.closeMenu(); // was: this.Ik.IR()
  }

  /**
   * Converts a raw option string to a display label.
   * @param {string} option  e.g. "Off", "End of video", "30"
   * @returns {string}
   * [was: K]
   */
  formatLabel(option) {
    switch (option) {
      case 'Off':
        return 'Off';
      case 'End of video':
        return 'End of video';
      case 'End of playlist':
        return 'End of playlist';
      default:
        return `${option.toString()} Minutes`.toLowerCase();
    }
  }

  /**
   * Applies the selected sleep timer option — fires toast for invalid
   * states (video already ended) or dispatches the setting change.
   * @param {string} optionKey [was: Q]
   * [was: Ie]
   */
  applySelection(optionKey) {
    const label = this.optionMap[optionKey]; // was: c
    const isEndOption = label === 'End of video' || label === 'End of playlist'; // was: W
    if (label === 'Off') {
      this.sleepTimeLeft = '';
    }

    const state = this.player.getPlayerState();
    if ((state !== 0 && state !== 5) || !isEndOption) {
      this.selectedOption = optionKey; // was: this.b0 = Q
      // super.W(Q) — inherited select
      this.setSelected(optionKey);
      // g.xt(this.player, 'onSleepTimerSettingsChanged', label);
    } else {
      // Video has ended — show toast
      // g.xt(this.player, 'innertubeCommand', { openPopupAction: { popupType: 'TOAST', ... } });
    }
  }

  /**
   * Fires when video data is reloaded to repopulate timer options.
   * @param {string} reason [was: Q]
   * [was: onVideoDataChange]
   */
  onVideoDataChange(reason) {
    if (reason === 'dataloaded') {
      populateSleepTimerOptions(this); // was: Pv_(this)
    }
  }

  /**
   * Logs menu visibility to the player.
   * @param {boolean} isVisible [was: Q]
   * [was: PA]
   */
  onMenuVisibilityChange(isVisible) {
    this.player.logVisibility(this.element, isVisible);
  }

  /**
   * Logs click on the menu item.
   * [was: onClick]
   */
  onClick() {
    this.player.logClick(this.element);
  }

  /**
   * Resets the sleep timer back to "Off".
   * [was: resetSleepTimerMenuSettings]
   */
  resetSleepTimerMenuSettings() {
    this.applySelection(this.formatLabel('Off'));
  }

  /**
   * Updates the sleep-timer countdown display.
   * @param {string} timeLeft [was: Q]
   * [was: setSleepTimerTimeLeft]
   */
  setSleepTimerTimeLeft(timeLeft) {
    this.sleepTimeLeft = timeLeft; // was: this.D = Q
    this.setContent(timeLeft);
  }

  /**
   * Updates the video-time-left sublabel.
   * @param {string} timeLeft [was: Q]
   * [was: setVideoTimeLeft]
   */
  setVideoTimeLeft(timeLeft) {
    this.videoTimeLeft = timeLeft; // was: this.T2 = Q
    this.labelWrapper.setContent(timeLeft); // was: this.S.setContent(Q)
  }
}

// ---------------------------------------------------------------------------
// populateSleepTimerOptions (helper)
// ---------------------------------------------------------------------------

/**
 * Builds the list of sleep-timer options and populates the menu item.
 * Options: Off, 10, 15, 20, 30, 45, 60, plus "End of video" for non-live,
 * and "End of playlist" when a non-radio playlist is active.
 *
 * @param {SleepTimerMenuItem} menuItem [was: Q]
 * [was: Pv_] (line 47587)
 */
function populateSleepTimerOptions(menuItem) {
  const options = 'Off 10 15 20 30 45 60'.split(' '); // was: c
  if (!menuItem.player.getVideoData()?.isLivePlayback) {
    options.push('End of video');
  }
  const playlist = menuItem.player.getPlaylist(); // was: W
  if (playlist && playlist.listId?.type !== 'RD') {
    options.push('End of playlist');
  }
  // menuItem.setOptions(g.hy(options, menuItem.formatLabel));
  // menuItem.optionMap = g.Fi(options, menuItem.formatLabel, menuItem);
  // Attach "End of video" sublabel wrapper to that option
  const endLabel = menuItem.formatLabel('End of video'); // was: c
  if (menuItem.options[endLabel]) {
    // g.hV(menuItem.options[endLabel], menuItem.labelWrapper);
  }
}

// ---------------------------------------------------------------------------
// SleepTimerComponent
// ---------------------------------------------------------------------------

/**
 * Plugin component that creates and manages the SleepTimerMenuItem,
 * wiring up external API methods for controlling the timer.
 *
 * [was: Qca]
 */
export class SleepTimerComponent /* extends PlayerModule */ {
  /**
   * The menu item instance (lazily created on settingsMenuInitialized).
   * @type {SleepTimerMenuItem|null}
   */
  menuItem = null; // was: this.menuItem

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super(player);

    player.addEventListener('settingsMenuInitialized', () => {
      if (!this.menuItem) {
        this.menuItem = new SleepTimerMenuItem(this.api, this.api.lU()); // was: p9D
        // g.F(this, this.menuItem);
      }
    });

    player.addEventListener('openSettingsMenuItem', (itemId) => { // was: c
      if (itemId === 'menu_item_sleep_timer') {
        if (!this.menuItem) this.api.lU()?.Bw();
        this.menuItem.open();
      }
    });

    // External API bindings
    // R(player, 'resetSleepTimerMenuSettings', () => this.resetSleepTimerMenuSettings());
    // R(player, 'setSleepTimerTimeLeft', (t) => this.setSleepTimerTimeLeft(t));
    // R(player, 'setVideoTimeLeft', (t) => this.setVideoTimeLeft(t));
  }

  resetSleepTimerMenuSettings() {
    this.menuItem?.resetSleepTimerMenuSettings();
  }

  setSleepTimerTimeLeft(time) { // was: Q
    this.menuItem?.setSleepTimerTimeLeft(time);
  }

  setVideoTimeLeft(time) { // was: Q
    this.menuItem?.setVideoTimeLeft(time);
  }
}

// ---------------------------------------------------------------------------
// SnackbarMessageComponent
// ---------------------------------------------------------------------------

/**
 * Listens for snackbar message events (e.g. ad-blocker buffering warning)
 * and dispatches innertube toast commands when appropriate.
 *
 * [was: cvi]
 */
export class SnackbarMessageComponent /* extends PlayerModule */ {
  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super(player);
    this.events = new EventHandler(player); // was: this.events
    // g.F(this, this.events);

    this.events.B(player, 'onSnackbarMessage', (messageType) => { // was: c
      switch (messageType) {
        case 1:
          if (this.api.getPlayerStateObject().isBuffering()) {
            // Dispatch "Experiencing interruptions?" toast with
            // link to support.google.com/youtube/answer/3037019
            // g.xt(this.api, 'innertubeCommand', { openPopupAction: ... });
          }
          break;
      }
    });
  }
}

// ---------------------------------------------------------------------------
// DragInteraction
// ---------------------------------------------------------------------------

/**
 * Unified mouse/touch drag interaction handler. Publishes events:
 *   - hoverstart / hovermove / hoverend
 *   - dragstart  / dragmove  / dragend
 *
 * Supports both pointer and touch events, with optional draggable attribute
 * for native HTML drag-and-drop compatibility.
 *
 * [was: g.iG]
 */
export class DragInteraction /* extends ObservableTarget */ {
  /**
   * The target DOM element to track.
   * @type {HTMLElement}
   */
  target; // was: this.target

  /**
   * Whether dragging is enabled (vs. hover-only).
   * @type {boolean}
   */
  isDraggable; // was: this.W

  /**
   * Event delegation target (may differ from target).
   * @type {HTMLElement}
   */
  eventTarget; // was: this.b0

  /**
   * Whether to pass through default touch action.
   * @type {boolean}
   */
  passTouchAction; // was: this.Ie

  /**
   * Whether pointer is currently hovering.
   * @type {boolean}
   */
  isHovering = false; // was: this.O

  /**
   * Whether a drag is in progress.
   * @type {boolean}
   */
  isDragging = false; // was: this.A

  /**
   * Internal event group for cleanup.
   * @type {Object}
   */
  eventGroup_; // was: this.j — new aB(this)

  /**
   * Saved mouse-out event for deduplication.
   * @type {Event|null}
   */
  savedOutEvent = null; // was: this.K

  /**
   * Active touch identifier for multi-touch tracking.
   * @type {number|null}
   */
  touchId = null; // was: this.J

  /**
   * @param {HTMLElement} target             The element to track. [was: Q]
   * @param {boolean}     [isDraggable=false] Enable drag events. [was: c]
   * @param {HTMLElement}  [eventTarget]      Override event-delegation target. [was: W]
   * @param {boolean}     [allowScroll=false] Allow default touch scrolling. [was: m]
   * @param {boolean}     [passTouchAction=false] Don't set touch-action:none. [was: K]
   */
  constructor(target, isDraggable = false, eventTarget = undefined, allowScroll = false, passTouchAction = false) {
    // super();
    this.passTouchAction = passTouchAction; // was: this.Ie = K
    this.isHovering = false; // was: this.S = !1
    this.eventGroup_ = null; // was: new aB(this)
    this.savedOutEvent = null; // was: this.K = null
    this.touchId = null; // was: this.J = null
    this.isDragging = false; // was: this.A = !1
    this.isHovering = false; // was: this.O = !1

    this.target = target;
    this.isDraggable = isDraggable;
    this.eventTarget = eventTarget || target; // was: this.b0 = W || Q
    // this.S = m (allowScroll)

    if (isDraggable) {
      // g.xG && target.setAttribute('draggable', 'true');
      if (!passTouchAction) {
        target.style.touchAction = 'none';
      }
    }
    // AT(this) — binds initial listeners
  }

  /**
   * Cancels any active drag or hover interaction.
   * [was: cancel]
   */
  cancel() {
    if (this.isDragging) {
      this.isDragging = false;
      this.publish('dragend', 0, 0, null);
    }
    if (this.isHovering) {
      this.isHovering = false;
      this.publish('hoverend', 0, 0, null);
      // eY(this); — unbind move listeners
      // AT(this); — rebind initial listeners
    }
  }

  /**
   * Handles pointer entering the target area.
   * @param {PointerEvent} event [was: Q]
   * [was: Z3]
   */
  onPointerOver(event) {
    // eY(this); — clear previous listeners
    // Bind move, out, touchstart, and optionally mousedown
    const target = event.target; // was: c
    const pos = { x: event.pageX, y: event.pageY }; // was: new g.zY(...)
    this.isHovering = true;
    this.publish('hoverstart', pos.x, pos.y, target);
    this.publish('hovermove', pos.x, pos.y, target);
  }

  /**
   * Handles pointer movement while hovering.
   * @param {PointerEvent} event [was: Q]
   * [was: Y]
   */
  onPointerMove(event) {
    const target = event.target;
    const pos = { x: event.pageX, y: event.pageY };
    // Deduplicate events from saved out-event
    if (this.savedOutEvent) {
      const saved = this.savedOutEvent;
      this.savedOutEvent = null;
      if (saved.relatedTarget === target) return;
    }
    this.publish('hovermove', pos.x, pos.y, target);
  }

  /**
   * Handles pointer leaving the target area.
   * @param {PointerEvent} event [was: Q]
   * [was: F3]
   */
  onPointerOut(event) {
    const pos = { x: event.pageX, y: event.pageY };
    const related = event.relatedTarget;
    try {
      if (related && containsNode(this.target, related)) {
        this.savedOutEvent = event;
        this.publish('hovermove', pos.x, pos.y, related);
        return;
      }
    } catch (_) { /* cross-origin */ }
    // eY(this); AT(this);
    this.isHovering = false;
    this.publish('hoverend', pos.x, pos.y, related);
  }

  /**
   * Handles mouse-down to start a drag.
   * @param {MouseEvent} event [was: Q]
   * [was: D]
   */
  onMouseDown(event) {
    if (typeof event.button !== 'number' || event.button === 0) {
      // eY(this); — clear listeners
      // Bind move/up on owner document
      const target = event.target;
      this.isDragging = true;
      const pos = { x: event.pageX, y: event.pageY };
      this.publish('dragstart', pos.x, pos.y, target);
      this.publish('dragmove', pos.x, pos.y, target);
    }
  }

  /**
   * Handles mouse-up to end a drag.
   * @param {MouseEvent} event [was: Q]
   * [was: T2]
   */
  onMouseUp(event) {
    // eY(this);
    this.isDragging = false;
    const target = event.target;
    const pos = { x: event.pageX, y: event.pageY };
    this.publish('dragend', pos.x, pos.y, target);
  }

  /**
   * Handles touch-start for touch-based drag/hover.
   * @param {TouchEvent} event [was: Q]
   * [was: L]
   */
  onTouchStart(event) {
    const touch = event.changedTouches[0]; // was: c
    if (!touch) return;
    if (this.passTouchAction) return;

    this.touchId = touch.identifier; // was: this.J = c.identifier
    const target = event.target;

    if (!this.isHovering) {
      this.isHovering = true;
      this.publish('hoverstart', touch.pageX, touch.pageY, target);
    }
    this.publish('hovermove', touch.pageX, touch.pageY, target);

    if (this.isDraggable) {
      this.isDragging = true;
      this.publish('dragstart', touch.pageX, touch.pageY, target);
      this.publish('dragmove', touch.pageX, touch.pageY, target);
    }
  }

  /**
   * Handles touch-end / touch-cancel.
   * @param {TouchEvent} event [was: Q]
   * [was: mF]
   */
  onTouchEnd(event) {
    const touch = this.findTouch_(event); // was: u07(this, Q)
    if (!touch) return;
    // eY(this); AT(this);
    this.isHovering = false;
    const target = event.target;
    if (this.isDraggable) {
      this.isDragging = false;
      this.publish('dragend', touch.pageX, touch.pageY, target);
    }
    this.publish('hoverend', touch.pageX, touch.pageY, target);
  }

  /**
   * Cleans up on disposal.
   * [was: WA]
   */
  dispose() {
    if (this.isDraggable) {
      // g.xG && this.target.removeAttribute('draggable');
      this.target.style.touchAction = '';
    }
    // eY(this);
    // super.dispose();
  }

  /**
   * Finds the tracked touch in a TouchEvent by identifier.
   * @param {TouchEvent} event
   * @returns {Touch|null}
   * @private
   */
  findTouch_(event) { // was: u07
    for (const touch of event.changedTouches) {
      if (touch.identifier === this.touchId) return touch;
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// SpeedmasterOverlay
// ---------------------------------------------------------------------------

/**
 * Overlay shown during the speedmaster (long-press 2x speed) gesture.
 * Displays a label like "2x" with an animated icon.
 *
 * Template:
 *   <div class="ytp-overlay ytp-speedmaster-overlay">
 *     <div class="ytp-speedmaster-user-edu">
 *       <div class="ytp-speedmaster-label">{label}</div>
 *       <div class="ytp-speedmaster-icon">{{icon}}</div>
 *     </div>
 *   </div>
 *
 * [was: WpD]
 */
export class SpeedmasterOverlay /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * The user-edu inner container element.
   * @type {HTMLElement}
   */
  userEdu; // was: this.W

  /**
   * @param {Object} player [was: Q]
   * @param {string} label  Display text, e.g. "2x". [was: c]
   */
  constructor(player, label) {
    // super({ C: 'div', yC: ['ytp-overlay', 'ytp-speedmaster-overlay'], ... });
    this.player = player;
    this.userEdu = null; // was: this.W = this.z2('ytp-speedmaster-user-edu')
    // this.updateValue('icon', MNX());
    // g.xK(this.userEdu, 'ytp-speedmaster-has-icon');
    // this.player.createClientVe(this.userEdu, this, 173040, true);
    this.hide_();
  }

  /**
   * Hides the overlay and logs invisibility.
   * [was: K]
   * @private
   */
  hide_() {
    // g.JA(this.element, 'display', 'none');
    // this.player.logVisibility(this.userEdu, false);
  }
}

// ---------------------------------------------------------------------------
// SpeedmasterComponent
// ---------------------------------------------------------------------------

/**
 * Component that implements the "hold to 2x speed" (speedmaster) feature.
 * On long-press (500ms), playback rate is doubled; on release it restores.
 * Optionally supports spacebar control.
 *
 * [was: m$a]
 */
export class SpeedmasterComponent /* extends PlayerModule */ {
  /**
   * Whether speedmaster is currently active (2x playing).
   * @type {boolean}
   */
  isActive = false; // was: this.A

  /**
   * Whether touch/pointer is currently held.
   * @type {boolean}
   */
  isHeld = false; // was: this.j

  /**
   * Display label, e.g. "2x".
   * @type {string}
   */
  label; // was: this.Y

  /**
   * Overlay UI.
   * @type {SpeedmasterOverlay}
   */
  speedmasterUserEdu; // was: this.speedmasterUserEdu

  /**
   * Drag interaction on the player root.
   * @type {DragInteraction}
   */
  dragHelper; // was: this.W

  /**
   * Delay timer for triggering speedmaster after 500ms hold.
   * @type {Object}
   */
  delay; // was: this.delay

  /**
   * Saved playback rate before speedmaster activation.
   * @type {number}
   */
  savedRate; // was: this.b0

  /**
   * Whether player was paused before speedmaster activation.
   * @type {boolean}
   */
  wasPaused; // was: this.Ie

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super(player);
    this.isActive = false;
    this.isHeld = false;
    this.label = '2x'; // was: this.Y = "2x"
    this.speedmasterUserEdu = new SpeedmasterOverlay(player, this.label); // was: WpD
    // g.F(this, this.speedmasterUserEdu);
    // g.f8(this.api, this.speedmasterUserEdu.element, 4);
    this.dragHelper = new DragInteraction(this.api.bX().isKnownBrowserVersion, true, null, false, true); // was: g.iG
    // g.F(this, this.dragHelper);
    // this.delay = new g.Uc(this.activate, 500, this);

    // Event bindings: videodatachange, presentingplayerstatechange, autonavvisibility, etc.
  }

  /**
   * Called on drag start — begins the hold timer.
   * @param {number} x [was: Q]
   * @param {number} y [was: c]
   * [was: S]
   */
  onDragStart(x, y) {
    // if (this.isDisabled()) return;
    // this.startPosition = [x, y];
    // this.dragHelper.subscribe('dragmove', this.onDragMove, this);
    // this.dragHelper.subscribe('dragend', this.onDragEnd, this);
    // if (!this.isActive) this.delay.start();
  }

  /**
   * Activates speedmaster — sets rate to 2x and plays.
   * [was: T2]
   */
  activate() {
    if (!this.isHeld) return;
    this.isActive = true;
    this.savedRate = this.api.getPlaybackRate(); // was: this.b0
    this.wasPaused = this.api.getPlayerStateObject().isPaused(); // was: this.Ie

    // Show overlay
    // g.JA(speedmasterUserEdu.element, 'display', '');

    this.api.setPlaybackRate(2);
    this.api.hideControls();
    this.api.playVideo();
    // Optionally publish 'speedmasterchanged'
  }
}

// ---------------------------------------------------------------------------
// StationsComponent
// ---------------------------------------------------------------------------

/**
 * Handles station (live radio) cue ranges for embargo and metadata updates.
 * Registers cue ranges on video data load and triggers embargo or
 * innertube commands when ranges fire.
 *
 * [was: KpH]
 */
export class StationsComponent /* extends PlayerModule */ {
  /**
   * Set of registered cue range IDs.
   * @type {Set<string>}
   */
  registeredRanges = new Set(); // was: this.O

  /**
   * Map of cue range ID to associated data array.
   * @type {Object}
   */
  rangeData = {}; // was: this.W

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super(player);
    this.registeredRanges = new Set();
    this.rangeData = {};
    // Binds videodatachange, stationsEmbargo cue enter, stationsMetadataUpdate cue enter
  }
}

// ---------------------------------------------------------------------------
// WrappedEvent
// ---------------------------------------------------------------------------

/**
 * Wraps a native browser event so that preventDefault / stopPropagation
 * are forwarded to the original event as well.
 *
 * [was: TTZ]
 */
export class WrappedEvent /* extends DomEvent */ {
  /**
   * The original native event.
   * @type {Event|null}
   */
  originalEvent; // was: this.W

  /**
   * @param {Object} target   Event target. [was: Q — mapped to c in super]
   * @param {string} type     Event type.   [was: c — mapped to Q in super]
   * @param {Event}  [original] The native event. [was: W]
   */
  constructor(target, type, original = undefined) {
    // super(type, target);
    this.originalEvent = original;
  }

  preventDefault() {
    // super.preventDefault();
    this.originalEvent?.preventDefault();
  }

  stopPropagation() {
    // super.stopPropagation();
    this.originalEvent?.stopPropagation();
  }
}

// ---------------------------------------------------------------------------
// HTMLMediaElementProxy
// ---------------------------------------------------------------------------

/**
 * Proxy wrapper around an HTMLMediaElement (audio or video).
 * Delegates all standard media operations to the underlying element while
 * providing a uniform interface for the player framework. Also captures and
 * re-dispatches media events through the custom event system.
 *
 * [was: g.Yg]
 */
export class HTMLMediaElementProxy /* extends LayoutIdMetadata */ {
  /**
   * The underlying HTMLMediaElement.
   * @type {HTMLMediaElement}
   */
  mediaElement; // was: this.W

  /**
   * Map of registered native event names to listener functions.
   * @type {Object<string, Function>}
   */
  registeredListeners = {}; // was: this.XI

  /**
   * Re-dispatch listener bound to this instance.
   * @type {Function}
   */
  listener; // was: this.listener

  /**
   * @param {HTMLMediaElement} element [was: Q]
   */
  constructor(element) {
    // super();
    this.mediaElement = element;
    this.registeredListeners = {};
    this.listener = (event) => { // was: c => ...
      this.dispatchEvent(new WrappedEvent(this, event.type, event));
    };
  }

  /** @returns {boolean} Always true. [was: D] */
  isReady() { return true; }

  /** @returns {boolean} Always false. [was: isView] */
  isView() { return false; }

  /** @returns {boolean} Always false. [was: iX] */
  isInline() { return false; }

  /** Returns the underlying media element. [was: Ae] */
  getMediaElement() { return this.mediaElement; }

  /** Returns the current source URL. [was: JE] */
  getSource() { return this.mediaElement.src; }

  /**
   * Sets the source URL, preserving playback rate.
   * @param {string} url [was: Q]
   * [was: JJ]
   */
  setSource(url) {
    const rate = this.getPlaybackRate();
    this.mediaElement.src = url;
    this.setPlaybackRate(rate);
  }

  /** Removes the src attribute. [was: HA] */
  removeSource() { this.mediaElement.removeAttribute('src'); }

  /** @returns {number} Current playback rate, defaulting to 1. [was: getPlaybackRate] */
  getPlaybackRate() {
    try {
      return this.mediaElement.playbackRate >= 0 ? this.mediaElement.playbackRate : 1;
    } catch { return 1; }
  }

  /**
   * Sets playback rate only if it differs from current.
   * @param {number} rate [was: Q]
   * @returns {number}
   * [was: setPlaybackRate]
   */
  setPlaybackRate(rate) {
    if (this.getPlaybackRate() !== rate) {
      this.mediaElement.playbackRate = rate;
    }
    return rate;
  }

  /** @returns {boolean} Whether loop is enabled. [was: mE] */
  isLooping() { return this.mediaElement.loop; }

  /** @param {boolean} loop [was: setLoop] */
  setLoop(loop) { this.mediaElement.loop = loop; }

  /** @param {string} type [was: canPlayType] */
  canPlayType(type, codecs) { return this.mediaElement.canPlayType(type, codecs); }

  /** @returns {boolean} [was: isPaused] */
  isPaused() { return this.mediaElement.paused; }

  /** @returns {boolean} [was: isSeeking] */
  isSeeking() { return this.mediaElement.seeking; }

  /** @returns {boolean} [was: isEnded] */
  isEnded() { return this.mediaElement.ended; }

  /** @returns {boolean} Whether audio is muted. [was: PA] */
  isMuted() { return this.mediaElement.muted; }

  /**
   * Sets the muted state.
   * @param {boolean} muted [was: Q]
   * [was: Y]
   */
  setMuted(muted) { this.mediaElement.muted = muted; }

  /** @returns {TimeRanges} Played ranges. [was: K] */
  getPlayed() { return this.mediaElement.played || { length: 0 }; }

  /** @returns {TimeRanges} Buffered ranges. [was: pU] */
  getBuffered() {
    try { return this.mediaElement.buffered; } catch { }
    return { length: 0 };
  }

  /** @returns {TimeRanges} Seekable ranges. [was: L] */
  getSeekable() { return this.mediaElement.seekable || { length: 0 }; }

  /** @returns {Date|null} Live stream start date. [was: jG] */
  getStartDate() {
    return this.mediaElement.getStartDate ? this.mediaElement.getStartDate() : null;
  }

  /** @returns {number} [was: getCurrentTime] */
  getCurrentTime() { return this.mediaElement.currentTime; }

  /** @param {number} time [was: setCurrentTime] */
  setCurrentTime(time) { this.mediaElement.currentTime = time; }

  /** @returns {number} [was: getDuration] */
  getDuration() { return this.mediaElement.duration; }

  /** Reloads the media, preserving playback rate. [was: load] */
  load() {
    const rate = this.mediaElement.playbackRate;
    try { this.mediaElement.load(); } catch { }
    this.mediaElement.playbackRate = rate;
  }

  /** [was: pause] */
  pause() { this.mediaElement.pause(); }

  /**
   * Starts playback, returning a promise (swallowing unhandled rejections).
   * @returns {Promise|null}
   * [was: play]
   */
  play() {
    const promise = this.mediaElement.play();
    if (!promise?.then) return null;
    promise.then(undefined, () => {});
    return promise;
  }

  /** @returns {number} Ready state. [was: A] */
  getReadyState() { return this.mediaElement.readyState; }

  /** @returns {number} Network state. [was: UH] */
  getNetworkState() { return this.mediaElement.networkState; }

  /** @returns {number|null} Error code. [was: il] */
  getErrorCode() { return this.mediaElement.error ? this.mediaElement.error.code : null; }

  /** @returns {string} Error message. [was: eB] */
  getErrorMessage() { return this.mediaElement.error ? this.mediaElement.error.message : ''; }

  /**
   * Returns video playback quality metrics (frames dropped/decoded).
   * @returns {Object}
   * [was: getVideoPlaybackQuality]
   */
  getVideoPlaybackQuality() {
    if (window.HTMLVideoElement && this.mediaElement instanceof window.HTMLVideoElement
      && this.mediaElement.getVideoPlaybackQuality) {
      return this.mediaElement.getVideoPlaybackQuality();
    }
    const createDatabaseDefinition = this.mediaElement;
    const dropped = createDatabaseDefinition.webkitDroppedFrameCount;
    const decoded = createDatabaseDefinition.webkitDecodedFrameCount;
    if (decoded) return { droppedVideoFrames: dropped || 0, totalVideoFrames: decoded };
    return {};
  }

  /** @returns {number} Volume (0–1). [was: getVolume] */
  getVolume() { return this.mediaElement.volume; }

  /** @param {number} volume [was: setVolume] */
  setVolume(volume) { this.mediaElement.volume = volume; }

  /**
   * Registers a native event listener (idempotent per event name).
   * @param {string} eventName [was: Q]
   * [was: EC]
   */
  addNativeListener(eventName) {
    if (!this.registeredListeners[eventName]) {
      this.mediaElement.addEventListener(eventName, this.listener);
      this.registeredListeners[eventName] = this.listener;
    }
  }

  /** Toggles picture-in-picture. [was: togglePictureInPicture] */
  togglePictureInPicture() {
    const createDatabaseDefinition = this.mediaElement;
    const doc = window.document;
    if (doc.pictureInPictureEnabled) {
      createDatabaseDefinition !== doc.pictureInPictureElement
        ? createDatabaseDefinition.requestPictureInPicture()
        : doc.exitPictureInPicture();
    }
  }

  /**
   * Cleans up all native event listeners.
   * [was: WA]
   */
  dispose() {
    for (const name of Object.keys(this.registeredListeners)) {
      this.mediaElement.removeEventListener(name, this.registeredListeners[name]);
    }
    // super.dispose();
  }
}

// ---------------------------------------------------------------------------
// HorizonChart
// ---------------------------------------------------------------------------

/**
 * A small horizon chart (sparkline-style) used in the stats-for-nerds panel
 * to display bandwidth, buffer health, live latency, and network activity.
 * Renders colored horizontal bars proportional to sample values.
 *
 * Template:
 *   <div class="ytp-horizonchart" style="width: ...; height: 1em" />
 *
 * [was: uN]
 */
export class HorizonChart /* extends PlayerComponent */ {
  /**
   * Number of data samples to display.
   * @type {number}
   */
  sampleCount = 150; // was: this.sampleCount

  /**
   * Breakpoints array for color thresholds.
   * @type {number[]}
   */
  breakpoints; // was: this.j

  /**
   * Color array corresponding to breakpoints.
   * @type {string[]}
   */
  colors; // was: this.K

  /**
   * Current sample insertion index.
   * @type {number}
   */
  index = 0; // was: this.index

  /**
   * Cached height in pixels.
   * @type {number}
   */
  heightPx = -1; // was: this.heightPx

  /**
   * Pixel width per sample bar.
   * @type {number}
   */
  barWidth = 2; // was: this.W

  /**
   * @param {number[]} breakpoints  Threshold values for coloring. [was: Q]
   * @param {string[]} colors       Corresponding colors. [was: c]
   */
  constructor(breakpoints, colors) {
    // super({ C: 'div', Z: 'ytp-horizonchart' });
    this.sampleCount = 150;
    this.breakpoints = breakpoints;
    this.colors = colors;
    this.index = 0;
    this.heightPx = -1;
    this.barWidth = 2;
    // this.element.style.width = `${this.barWidth * this.sampleCount}px`;
    // this.element.style.height = '1em';
  }
}

// ---------------------------------------------------------------------------
// StatsForNerdsPanel
// ---------------------------------------------------------------------------

/**
 * The "Stats for nerds" debug info panel. Displays video ID, sCPN, viewport,
 * frame stats, resolution, volume, codecs, DRM info, connection speed,
 * network activity, buffer health, live latency, playback categories,
 * format debug info, and more — each with optional horizon chart visualizations.
 *
 * Template includes template variables like `{{video_id_and_cpn}}`,
 * `{{dims_and_frames}}`, `{{resolution}}`, `{{bandwidth_kbps}}`, etc.
 *
 * [was: JMx]
 */
export class StatsForNerdsPanel /* extends PlayerComponent */ {
  /**
   * Player/data source for stat retrieval.
   * @type {Object}
   */
  dataSource; // was: this.ge

  /**
   * Scroll/drift position for the anti-burn-in animation.
   * @type {number}
   */
  position = 0; // was: this.position

  /**
   * Direction flag for position drift.
   * @type {boolean}
   */
  driftForward = true; // was: this.K

  /**
   * Cache of last-set stat values to avoid redundant DOM updates.
   * @type {Object}
   */
  lastValues = {}; // was: this.J

  /**
   * Bandwidth horizon chart.
   * @type {HorizonChart}
   */
  bandwidthChart; // was: this.W

  /**
   * Live latency horizon chart.
   * @type {HorizonChart}
   */
  latencyChart; // was: this.A

  /**
   * Buffer health horizon chart.
   * @type {HorizonChart}
   */
  bufferChart; // was: this.O

  /**
   * Network activity horizon chart.
   * @type {HorizonChart}
   */
  networkChart; // was: this.D

  /**
   * Refresh timer (500ms or 5s depending on render cost).
   * @type {Object}
   */
  refreshDelay; // was: this.delay

  /**
   * Anti-burn-in drift timer (20s intervals).
   * @type {Object}
   */
  driftDelay; // was: this.j

  /**
   * @param {Object} dataSource [was: Q]
   */
  constructor(dataSource) {
    // super({ C: 'div', yC: ['html5-video-info-panel', 'ytp-sfn'], V: [...] });
    this.dataSource = dataSource;
    this.position = 0;
    this.driftForward = true;

    // Bandwidth breakpoints: 0, 18750, 37500, 81250, 128K, 256K, ...
    const bwBreakpoints = [0, 18750, 37500, 81250, 128000, 256000, 512000, 2048000, 8192000, 32768000, 131072000];
    const bwColors = '#000 #d53e4f #f46d43 #fdae61 #fee08b #e6f598 #abdda4 #66c2a5 #3288bd #124588 #fff'.split(' ');
    const netBreakpoints = bwBreakpoints.map((v) => v / 4);

    this.lastValues = {};
    this.bandwidthChart = new HorizonChart(bwBreakpoints, bwColors);
    this.latencyChart = new HorizonChart(
      [0, 3, 10, 15, 30, 60, 90],
      '#000 #66c2a5 #abdda4 #e6f598 #fdae61 #f46d43 #a8330f'.split(' ')
    );
    this.bufferChart = new HorizonChart(
      [0, 15, 30, 60, 90, 120],
      '#000 #fdae61 #e6f598 #66c2a5 #3288bd #fff'.split(' ')
    );
    this.networkChart = new HorizonChart(netBreakpoints, bwColors);

    // this.refreshDelay = new g.Uc(this.refresh, 500, this);
    // this.driftDelay = new g.Uc(this.drift, 20000, this);
  }

  /**
   * Shows the panel and starts the refresh cycle.
   * [was: show]
   */
  show() {
    // super.show();
    this.refresh();
  }

  /**
   * Hides the panel and stops timers.
   * [was: hide]
   */
  hide() {
    // super.hide();
    // this.refreshDelay.stop();
    // this.driftDelay.stop();
  }

  /**
   * Pulls fresh stats from the data source and updates the DOM.
   * Measures render time — if > 25ms, slows refresh to 5s.
   * [was: ZF]
   */
  refresh() {
    // const start = g.h();
    // const stats = uTy(this.dataSource);
    // q2(this.bandwidthChart, stats.bandwidth_samples);
    // q2(this.networkChart, stats.network_activity_samples);
    // q2(this.latencyChart, stats.live_latency_samples);
    // q2(this.bufferChart, stats.buffer_health_samples);
    // Only update changed values
    // const elapsed = g.h() - start;
    // const nextInterval = elapsed > 25 ? 5000 : 500;
    // this.refreshDelay.start(nextInterval);
  }

  /**
   * Slowly drifts the panel position to prevent OLED burn-in.
   * [was: L]
   */
  drift() {
    if (this.driftForward) {
      this.position += 1;
      if (this.position > 15) this.driftForward = false;
    } else {
      this.position -= 1;
      if (this.position <= 0) this.driftForward = true;
    }
    // this.element.style.left = `${this.position}%`;
    // this.element.style.top = `${this.position}%`;
    // this.driftDelay.start(20000);
  }
}

// ---------------------------------------------------------------------------
// StatsForNerdsComponent
// ---------------------------------------------------------------------------

/**
 * Plugin component that creates the StatsForNerdsPanel and exposes
 * external API methods: getStatsForNerds, showVideoInfo, hideVideoInfo,
 * isVideoInfoVisible.
 *
 * [was: o91]
 */
export class StatsForNerdsComponent /* extends PlayerModule */ {
  /**
   * The panel instance (lazily created).
   * @type {StatsForNerdsPanel|null}
   */
  panel = null; // was: this.J3

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super(player);
    // R(player, 'getStatsForNerds', () => uTy(this.api));
    // q3(player, 'showVideoInfo', () => showPanel(this, true));
    // q3(player, 'hideVideoInfo', () => showPanel(this, false));
    // q3(player, 'isVideoInfoVisible', () => !!this.panel?.isVisible());
  }
}

// ---------------------------------------------------------------------------
// AnimationHelper
// ---------------------------------------------------------------------------

/**
 * A simple animation timer that drives a cubic-bezier easing curve over a
 * given duration, calling a callback each frame with the eased progress.
 *
 * [was: hc]
 */
export class AnimationHelper /* extends Disposable */ {
  /**
   * Easing callback receiving progress 0..1.
   * @type {Function|null}
   */
  callback = null; // was: this.O

  /**
   * Total animation duration in ms.
   * @type {number}
   */
  duration = 0; // was: this.duration

  /**
   * Timestamp when animation started.
   * @type {number}
   */
  startTime = 0; // was: this.startTime

  /**
   * Internal RAF-based timer.
   * @type {Object}
   */
  timer; // was: this.delay — new g.T5(this.tick, null, this)

  constructor() {
    // super();
    this.callback = null;
    this.duration = 0;
    this.startTime = 0;
    // this.timer = new g.T5(this.tick, null, this);
  }

  /**
   * Per-frame tick — computes normalized progress, applies easing,
   * and invokes the callback. Restarts the timer if not complete.
   * [was: W]
   */
  tick() {
    let elapsed = Date.now() - this.startTime; // was: (0, g.h)() - this.startTime
    let progress = elapsed < this.duration ? elapsed / this.duration : 1;
    // this.callback(gq(EASE_CURVE, progress)); // ease via cubic bezier
    if (progress < 1) {
      // this.timer.start();
    }
  }
}

/**
 * Default easing curve: cubic bezier (0, 0, 0.4, 0, 0.2, 1, 1, 1).
 * [was: rvi]
 */
// const EASE_CURVE = new jC(0, 0, 0.4, 0, 0.2, 1, 1, 1);

/**
 * Regex for splitting numeric / non-numeric tokens in SVG path data.
 * [was: kDX]
 */
export const PATH_TOKEN_REGEX = /[0-9.-]+|[^0-9.-]+/g; // was: kDX

// ---------------------------------------------------------------------------
// TheaterModeButton
// ---------------------------------------------------------------------------

/**
 * Button that toggles theater (wide) mode in the player controls.
 *
 * Renders different SVG icons depending on the current mode and the
 * active experiment flags.
 *
 * [was: U$4]
 */
export class TheaterModeButton /* extends PlayerComponent */ {
  /**
   * Player API.
   * @type {Object}
   */
  api; // was: this.api

  /**
   * Current theater-mode state (null = unknown, true/false).
   * @type {boolean|null}
   */
  isTheaterMode = null; // was: this.d7

  /**
   * Animation helper for icon transitions.
   * @type {AnimationHelper}
   */
  transition; // was: this.transition

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super({ C: 'button', yC: ['ytp-size-button', 'ytp-button'], ... });
    this.api = player;
    this.isTheaterMode = null;
    this.transition = new AnimationHelper();
    // g.F(this, this.transition);

    // Event bindings: sizestylechange, fullscreentoggled, presentingplayerstatechange
    // player.createClientVe(this.element, this, 139116);
    this.updateVisibility(); // was: this.ZF()
    // this.listen('click', this.onClick);
  }

  /**
   * Toggles theater mode on click.
   * [was: onClick]
   */
  onClick() {
    // const app = this.api.app;
    // const newState = app.X('web_log_theater_mode_visibility') ? !app.d7() : !app.YK;
    // g.xt(app.ge, 'SIZE_CLICKED', newState);
    // this.api.logClick(this.element);
  }

  /**
   * Updates button visibility based on player state (visible when not
   * fullscreen, not in miniplayer type).
   * [was: ZF]
   */
  updateVisibility() {
    // const visible = this.api.N1() && !this.api.isFullscreen()
    //   && this.api.getPresentingPlayerType() !== 3;
    // this.setVisible(visible);
    // if (this.isVisible) { ... update icon if state changed ... }
  }
}

// ---------------------------------------------------------------------------
// TheaterModeComponent
// ---------------------------------------------------------------------------

/**
 * Plugin component that lazily creates the TheaterModeButton when the
 * standard controls are initialized.
 *
 * [was: I7W]
 */
export class TheaterModeComponent /* extends PlayerModule */ {
  /**
   * The button instance (lazily created).
   * @type {TheaterModeButton|null}
   */
  button = null; // was: this.button

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super(player);
    // this.events.B(player, 'standardControlsInitialized', () => {
    //   this.button = new TheaterModeButton(player);
    //   g.F(this, this.button);
    //   player.KD(this.button, 'RIGHT_CONTROLS_RIGHT');
    // });
  }
}

// ---------------------------------------------------------------------------
// TimelyActionsComponent
// ---------------------------------------------------------------------------

/**
 * Component managing server-driven "timely actions" — cue-range-triggered
 * overlays and commands (e.g. smart-skip prompts). Handles cue range
 * registration, enter/exit, and additional trigger conditions like
 * keyboard seek, progress bar seek, controls shown, speedmaster state.
 *
 * [was: X0m]
 */
export class TimelyActionsComponent /* extends PlayerModule */ {
  /**
   * Map of trigger type to handler function.
   * @type {Object<string, Function>}
   */
  triggerHandlers; // was: this.Ie

  /**
   * Whether player controls are currently shown.
   * @type {boolean}
   */
  controlsShown = false; // was: this.D

  /**
   * Whether the player root is hovered.
   * @type {boolean}
   */
  isRootHovered = false; // was: this.L

  /**
   * Whether the progress bar is being hovered.
   * @type {boolean}
   */
  isProgressBarHovered = false; // was: this.Y

  /**
   * Whether speedmaster is active.
   * @type {boolean}
   */
  isSpeedmasterActive = false; // was: this.T2

  /**
   * Map of cue range ID to show count.
   * @type {Object<string, number>}
   */
  showCounts = {}; // was: this.K

  /**
   * Current video ID.
   * @type {string|undefined}
   */
  videoId; // was: this.videoId

  /**
   * The timely actions data from video data.
   * @type {Array|undefined}
   */
  timelyActions; // was: this.timelyActions

  /**
   * Currently active cue range ID.
   * @type {string|undefined}
   */
  activeCueRangeId; // was: this.W

  /**
   * Seek source of the last seek operation.
   * @type {string|undefined}
   */
  lastSeekSource; // was: this.A

  /**
   * Whether the last action was triggered.
   * @type {boolean}
   */
  wasTriggered = false; // was: this.mF

  /**
   * Container element for timely action overlays.
   * @type {Object}
   */
  container; // was: this.O

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super(player);
    this.triggerHandlers = {
      TIMELY_ACTION_TRIGGER_TYPE_UNSPECIFIED: () => false,
      TIMELY_ACTION_TRIGGER_TYPE_KEYBOARD_SEEK: (args) => this.checkSeekTrigger_(args),
      TIMELY_ACTION_TRIGGER_TYPE_PROGRESS_BAR_SEEK: (args) => this.checkSeekTrigger_(args),
      TIMELY_ACTION_TRIGGER_TYPE_PLAYER_CONTROLS_SHOWN: () => this.controlsShown && this.isRootHovered,
      TIMELY_ACTION_TRIGGER_TYPE_SPEEDMASTER: () => this.isSpeedmasterActive,
    };
    this.controlsShown = false;
    this.isRootHovered = false;
    this.isProgressBarHovered = false;
    this.isSpeedmasterActive = false;
    this.showCounts = {};

    // Container for timely action overlays
    // this.container = new g.k({ C: 'div', yC: ['ytp-player-content', 'ytp-timely-actions-content'] });
    // this.container.hide();

    // Many event bindings omitted for brevity
  }

  /**
   * Handles new video data — clears old cue ranges and registers new ones.
   * @param {Object} videoData [was: Q]
   * [was: onVideoDataChange]
   */
  onVideoDataChange(videoData) {
    this.clearCueRanges(); // was: this.bc()
    this.videoId = videoData.videoId;
    this.activeCueRangeId = undefined;
    this.lastSeekSource = undefined;
    // this.timelyActions = UJX(videoData);
    // Register cue ranges and check visibility
  }

  /**
   * Called when a cue range is entered.
   * @param {string} cueRangeId [was: Q]
   * [was: onCueRangeEnter]
   */
  onCueRangeEnter(cueRangeId) {
    // Validate show count hasn't been exceeded, then set active
    this.activeCueRangeId = cueRangeId;
    this.evaluate_(); // was: this.j()
  }

  /**
   * Called when a cue range is exited — dispatches exit command.
   * @param {string} cueRangeId [was: Q]
   * [was: onCueRangeExit]
   */
  onCueRangeExit(cueRangeId) {
    // Dispatch exit command if needed
    this.activeCueRangeId = undefined;
  }

  /**
   * Evaluates whether all trigger conditions are met for the active
   * cue range and dispatches the associated innertube command.
   * [was: j]
   * @private
   */
  evaluate_() {
    if (this.activeCueRangeId === undefined) return;
    // Check additional triggers, dispatch onCueRangeEnter command
  }

  /**
   * Clears all registered cue ranges.
   * [was: bc]
   * @private
   */
  clearCueRanges() {
    // this.api.qI('timelyAction', 1);
    if (this.activeCueRangeId !== undefined) {
      this.onCueRangeExit(this.activeCueRangeId);
    }
  }

  /**
   * Checks whether a seek-based trigger should fire.
   * @param {Object} args
   * @returns {boolean}
   * @private
   */
  checkSeekTrigger_(args) { // was: W80
    return false; // Placeholder
  }

  dispose() {
    this.timelyActions = undefined;
    this.activeCueRangeId = undefined;
    this.lastSeekSource = undefined;
    this.showCounts = {};
    this.clearCueRanges();
    // super.dispose();
  }
}

// ---------------------------------------------------------------------------
// VoiceBoostToggle
// ---------------------------------------------------------------------------

/**
 * Toggle menu item for the "Voice boost" audio enhancement feature.
 * Appears in the settings menu (or audio sub-menu) and toggles the
 * voice-boost filter on/off.
 *
 * [was: IvK]
 */
export class VoiceBoostToggle /* extends Si */ {
  /**
   * Player API.
   * @type {Object}
   */
  player; // was: this.U

  /**
   * Callback to set the voice boost preference.
   * @type {Function}
   */
  setPreference; // was: this.j

  /**
   * Callback to get the current voice boost level.
   * @type {Function}
   */
  getLevel; // was: this.A

  /**
   * Callback to get the voice boost state enum.
   * @type {Function}
   */
  getVoiceBoostState; // was: this.getVoiceBoostState

  /**
   * Whether this toggle is currently attached to the menu.
   * @type {boolean}
   */
  isAttached = false; // was: this.O

  /**
   * @param {Object} player              [was: Q]
   * @param {Function} setPreference     [was: c]
   * @param {Function} getLevel          [was: W]
   * @param {Function} getVoiceBoostState [was: m]
   */
  constructor(player, setPreference, getLevel, getVoiceBoostState) {
    // super('Voice boost', g.iN.E4);
    this.player = player;
    this.setPreference = setPreference;
    this.getLevel = getLevel;
    this.getVoiceBoostState = getVoiceBoostState;
    this.isAttached = false;

    // this.settingsMenu = player.X('html5_enable_new_audio_settings_menu')
    //   ? player.lU().KW : player.lU();

    // this.bindEvent(player, 'onFilterAudioFeatures', this.updateVisibility);
    // this.setIcon(SVG_VOICE_BOOST_ICON);
    // this.subscribe('select', this.onToggle, this);
    // this.updateVisibility();
  }

  /**
   * Handles toggle — sets voice boost preference to 2 (on) or 1 (off).
   * @param {boolean} isEnabled [was: Q]
   * [was: K]
   */
  onToggle(isEnabled) {
    this.setPreference(isEnabled ? 2 : 1);
  }

  /**
   * Updates visibility based on presenting player type and feature state.
   * [was: dH]
   */
  updateVisibility() {
    const playerType = this.player.getPresentingPlayerType();
    if (playerType === 2 || playerType === 3) {
      // Ad or miniplayer — detach
      if (this.isAttached) {
        this.isAttached = false;
        // this.settingsMenu.detachItem(this);
      }
    } else {
      const state = this.getVoiceBoostState();
      if (state !== 1) {
        // State 0 = available, update toggle; state != 0 = disabled
        if (!this.isAttached) {
          // this.settingsMenu.attachItem(this);
          this.isAttached = true;
        }
      } else if (this.isAttached) {
        // this.settingsMenu.detachItem(this);
        this.isAttached = false;
      }
    }
  }

  dispose() {
    // this.settingsMenu.detachItem(this);
    // super.dispose();
  }
}

// ---------------------------------------------------------------------------
// VoiceBoostComponent
// ---------------------------------------------------------------------------

/**
 * Plugin component managing voice boost user preference persistence and
 * the VoiceBoostToggle menu item lifecycle.
 *
 * [was: VfH]
 */
export class VoiceBoostComponent /* extends PlayerModule */ {
  /**
   * User preference value: 0 = default, 1 = off, 2 = on.
   * @type {number}
   */
  preference; // was: this.W

  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) {
    // super(player);
    const isEnabled = this.api.X('html5_enable_voice_boost');
    // if (isEnabled) register settingsMenuInitialized handler
    // Register external APIs: getVoiceBoostUserPreference, setVoiceBoostUserPreference, getVoiceBoostState
    this.preference = 0; // was: VGK() ?? 0  (read from cookie)
    this.updateEnvironmentData();
  }

  getVoiceBoostUserPreference() { return this.preference; }

  /**
   * Persists the preference to a cookie and triggers re-render.
   * @param {number} pref  0|1|2 [was: Q]
   */
  setVoiceBoostUserPreference(pref) {
    // this.api.tJ('vb_set', { pref });
    // g.rl('yt-player-voice-boost', pref, 31536e4);
    if (pref !== this.preference) {
      this.preference = pref;
      this.updateEnvironmentData();
      // if (this.getVoiceBoostState() !== 1) this.api.Bb();
      // this.api.Ig();
    }
  }

  getVoiceBoostState() {
    return this.api.YH(1);
  }

  updateEnvironmentData() {
    // this.api.G().uE = this.preference;
  }
}
