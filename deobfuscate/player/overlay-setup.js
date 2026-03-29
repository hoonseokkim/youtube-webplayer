import { buildMenuItemDescriptor } from '../ads/ad-click-tracking.js';
import { maybeScrapePayload } from '../data/gel-logger.js'; // was: Gf
import { PlayerComponent } from './component.js';
import { listen } from '../core/composition-helpers.js';
import { MenuPanel } from '../ui/controls/menu.js';
// TODO: resolve g.$c
// TODO: resolve g.oo

/**
 * Gated overlay setup, video loader helpers, caption manager helpers, chrome base.
 * Source: base.js lines 105500–106999 (skipping 106328–106510, already covered)
 *
 * [was: sc1] SpinnerOverlay (continued) — loading spinner
 * [was: d$a] UnmuteButton — muted autoplay unmute overlay
 * [was: g.LH] BaseChrome — base class for player chrome/controls layer
 * [was: g.Lp1] BezelOverlay — play/pause bezel indicator
 * [was: w0a] InfoCardsButton — "i" info-card button in player
 * [was: b9W] InfoCardTeaser — info-card teaser text popup
 * [was: jcH] ChannelAvatar — channel logo + expanded flyout in embed
 * [was: RN] ContextMenuItem — right-click menu item with submenu arrow
 * [was: g9H] UserInfoPanel — "Watching as" signed-in panel
 * [was: O91] ContextMenu — full right-click context menu
 */

// === lines 105500–105521: SpinnerOverlay continued [was: sc1] ===

// SpinnerOverlay.message, show/hide/onStateChange/l3/O methods
// Shows spinner after 500ms delay; message shown on playback stall

// === lines 105523–105605: UnmuteButton [was: d$a] ===

/**
 * "Tap to unmute" button for muted autoplay. Animates in/out.
 * Has both modern (delhi) and legacy SVG icon variants.
 * [was: d$a]
 */
export class UnmuteButton extends PopupWidget { // was: d$a
  // lines 105523-105605
  // constructor: sets up click handler, muted autoplay listener
  // onMutedAutoplayChange: show/hide on mute state
  // w_: hide on ended state
  // onClick: unmute and log
}

// === lines 105607–105968: BaseChrome [was: g.LH] ===

/**
 * Base chrome layer: manages idle tracking, cued thumbnail, error screen,
 * paid content overlay, spinner, unmute button, double-tap seek, autohide,
 * gesture handling, video data changes, and state classes on root node.
 * [was: g.LH]
 */
// g.LH extends g.db
// Key methods:
//   init() — sets up initial state, publishes basechromeinitialized
//   onVideoDataChange(reason, videoData) — handles video switches
//   Sy() — returns true if controls should stay visible
//   z5() — updates ytp-menu-shown class
//   Xu(target) — checks if target is within player root for autohide
//   ey(autohidden) — handles autohide toggle, updates classes
//   Su(touchEvent) — touch handler: double-tap-to-seek
//   Bh(clickEvent) — click handler: toggle play/pause
//   GF(dblClickEvent) — double-click handler: fullscreen toggle
//   Sb() — play/pause toggle via debounced timer
//   OO(playerState) — updates root node state classes (playing/paused/buffering/etc.)
//   cn() — escape key handler chain
//   showControls(visible) — explicitly show/hide controls

// g.LH.prototype.vl = c3(6); — line 105970

// === lines 105971–106003: BezelOverlay [was: g.Lp1] ===

/**
 * Bezel (brief icon flash) for play/pause/etc indicators.
 * Shows icon + label for ~500ms (1000ms in delhi mode).
 * [was: g.Lp1]
 */
// g.Lp1 extends g.k
// HF(isPlaying) — shows play or pause bezel icon

// === lines 106023–106148: InfoCardsButton [was: w0a] ===

/**
 * The "i" button for info cards / shopping tags in the player.
 * Supports both standard info and shopping card variants.
 * [was: w0a]
 */
export class InfoCardsButton extends PlayerComponent { // was: w0a
  // constructor: sets up click/hover handlers, fade transition
  // hL(enable) — enable/disable tooltip
  // Bw() — show button with fade
  // HB() — hide button with fade
  // Dl() — true if currently visible
  // onClicked — opens card drawer or fires innertube command
}

// === lines 106150–106327: InfoCardTeaser [was: b9W] ===

/**
 * Teaser popup that appears briefly to advertise info cards.
 * Supports dismissible mode in new format, auto-hide after duration.
 * [was: b9W]
 */
export class InfoCardTeaser extends PlayerComponent { // was: b9W
  // constructor: sets up event listeners for show/hide/click
  // T2() — hide if cards drawer is open
  // L() — teaser clicked: hide and open drawer
  // UH(teaserData) — show teaser with text and optional avatar
  // Bw(teaserData) — display the teaser popup with auto-hide timer
  // K() — position teaser relative to button
  // HB() — hide teaser with fade-out
}

// (lines 106328–106510 already covered — skip)

// === lines 106511–106550: Subscribe button tail ===
// Continuation of subscribe/unsubscribe button click handlers

// === lines 106552–106679: ChannelAvatar [was: jcH] ===

/**
 * Channel logo + expandable flyout (title, subtitle, subscribe button)
 * in the embedded player's top chrome.
 * [was: jcH]
 */
export class ChannelAvatar extends PlayerComponent { // was: jcH
  // constructor: builds channel logo link, expanded overlay
  // S(event) — click handler: expand/collapse or navigate
  // J() — collapse flyout
  // isExpanded() — checks expanded state
  // D() — expand flyout, show subscribe button
  // K() — begin collapse animation
  // ZF() — update from video data (profile pic, title, subtitle)
}

// === lines 106681–106692: ContextMenuItem [was: RN] ===

/**
 * Context menu item with right-arrow for submenu navigation.
 * [was: RN]
 */
export class ContextMenuItem extends g.oo { // was: RN
  constructor(config, api) { // was: Q, c — but actually ContextMenuItem extends g.oo
    super(buildMenuItemDescriptor({ "aria-haspopup": "true" }), api);
    this.listen("keydown", this.maybeScrapePayload);
  }
  /** Right arrow opens submenu. [was: Gf] */
  maybeScrapePayload(event) { // was: Q
    if (!event.defaultPrevented && event.keyCode === 39) {
      this.element.click();
      event.preventDefault();
    }
  }
}

// === lines 106694–106808: UserInfoPanel [was: g9H] ===

/**
 * "Watching as [username]" panel shown from account button in context menu.
 * Shows username, email, close button, and sign-in link for signed-out users.
 * [was: g9H]
 */
export class UserInfoPanel extends PlayerComponent { // was: g9H
  // show() — focus panel, enable tab navigation
  // hide() — disable tab navigation
  // constructor: builds panel with icon, username, email or sign-in link
  // W(event) — outside click handler: close panel
  // O() — sign-in click handler: navigate to login
  // ZF() — update display values from config
}

// === lines 106810–106999: ContextMenu [was: O91] ===

/**
 * Full right-click context menu with copy URL, embed code, debug info,
 * loop toggle, miniplayer, PiP, stats-for-nerds, troubleshoot, and account.
 * [was: O91]
 */
export class ContextMenu extends MenuPanel { // was: O91
  constructor(api, overlayManager, bezel) { // was: Q, c, W
    // super(api)
    // Sets up all menu items: copy video URL, copy at timestamp, embed code,
    // debug info, troubleshoot, stats for nerds, loop, miniplayer, PiP, account
    // Each item gets VE tracking, icon, and click handler
  }
  // UI() — close overlay
  // kM() — copy text to clipboard
  // sX() — copy debug text
  // ZM() — copy embed code
  // cz() — copy video URL
  // dc() — copy URL at current time
  // Go() — toggle loop
  // oS() — collapse miniplayer
  // nh() — PiP miniplayer
  // sA(event) — report playback issue
  // eP() — toggle stats for nerds
  // T9() — show account panel
  // onVideoDataChange(reason, videoData) — update menu items
}
