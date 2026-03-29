/**
 * Keyboard shortcut routing continuation, input handling, overflow panel,
 * playlist menu, promo tooltip, replay, search, seek overlay, share panel,
 * shopping overlay (products in video).
 * Source: base.js lines 108586–109886
 *
 * [was: RyH] OverflowButton — "..." more button in controls
 * [was: ky4] OverflowPanel — popup panel for overflow action buttons
 * [was: Yso] PlaylistMenuItem — single video item in playlist menu
 * [was: p0a] PlaylistMenu — popup playlist menu dialog
 * [was: Qg9] PlaylistMenuButton — button to open playlist panel
 * [was: Emw] PromoTooltip — promotional tooltip with accept/dismiss
 * [was: Wkm] ReplayButton — replay button shown at video end
 * [was: miS] SearchButton — search icon button (embeds)
 * [was: KkH] SeekOverlay — double-tap seek animation overlay
 * [was: TOv] ShareButton — share button with Web Share API support
 * [was: ojv] SharePanel — share dialog with link, services, playlist checkbox
 * [was: rPi] ShoppingOverlay — products-in-video shopping pill overlay
 */

import { hasPlaylist } from '../ads/ad-click-tracking.js';  // was: g.bp
import { isEmbedWithAudio } from '../data/bandwidth-tracker.js';  // was: g.oc
import { QUALITY_LABELS_DESCENDING } from '../media/codec-tables.js'; // was: ZF
import { validateSlotTriggers } from '../ads/ad-scheduling.js'; // was: er
import { SuggestedActionBadge } from '../media/live-state.js'; // was: aN
import { PlayerComponent } from '../player/component.js';
import { getPlayerSize } from '../player/time-tracking.js';
import { isEmbedsShortsMode } from './shorts.js';
import { toggleClass } from '../core/dom-utils.js';

// === lines 108586–108657: OverflowButton [was: RyH] ===

/**
 * The "..." more button that opens the overflow panel with additional actions.
 * Visibility depends on player width, ad state, and embed mode.
 * [was: RyH]
 */
export class OverflowButton extends PlayerComponent { // was: RyH
  constructor(api, overflowPanel) { // was: Q, c
    // super({...}) — builds button with 3-dot SVG icon
    // Sets up VE tracking, video reset/resize/fullscreen/state change listeners
    // Click opens overflow panel; close button returns focus
  }

  /** Update visibility based on player state and size. [was: ZF] */
  QUALITY_LABELS_DESCENDING() {
    const config = this.U.G(); // was: Q
    const isEmpty = config.A || this.U.X("web_player_hide_overflow_button_if_empty_menu") && this.Cw.isEmpty(); // was: c
    const isEmbedError = isEmbedWithAudio(config) && hasPlaylist(this.U) && this.U.getPlayerStateObject().W(128); // was: Q reuse
    const playerSize = this.U.getPlayerSize(); // was: W
    this.visible = this.U.dj() && !isEmbedError && playerSize.width >= 240 && !this.U.getVideoData().validateSlotTriggers && !isEmpty && !this.U.isEmbedsShortsMode();
    toggleClass(this.element, "ytp-overflow-button-visible", this.visible);
    this.BB(this.visible);
    if (this.visible) this.U.WI();
    this.U.logVisibility(this.element, this.visible && this.mF);
  }
}

// === lines 108659–108730: OverflowPanel [was: ky4] ===

/**
 * Popup panel containing overflow action buttons with close button.
 * [was: ky4]
 */
export class OverflowPanel extends PopupWidget { // was: ky4
  // constructor: builds panel container with close button
  // O(event) — click handler: close if clicking outside content
  // HB() — hide and unfocus
  // show()/hide() — toggle panel, update aria-modal
  // onFullscreenToggled(isFS) — close panel on exit fullscreen
  // isEmpty() — true if no action buttons
  // focus() — focus first visible action button
}

// === lines 108732–108775: PlaylistMenuItem [was: Yso] ===

/**
 * A single video item in the playlist dropdown (index, thumbnail, title, author).
 * [was: Yso]
 */
export class PlaylistMenuItem extends PlayerComponent { // was: Yso
  constructor(api, playlist, index) { // was: Q, c, W
    // super({...}) — builds item with index, now-playing indicator, thumbnail, title, author
    // onClick: plays video at this.index
  }
}

// === lines 108777–108902: PlaylistMenu [was: p0a] ===

/**
 * Playlist dropdown dialog showing all playlist items.
 * Updates on shuffle, video data change, and playlist update.
 * [was: p0a]
 */
export class PlaylistMenu extends PopupWidget { // was: p0a
  // constructor: builds header (title, close, subtitle) and items container
  // show()/hide() — subscribe/unsubscribe to playlist events
  // j() — refresh playlist data
  // O() — render playlist items, update selection
  // S(event) — title link click handler
  // updatePlaylist(playlist) — set/unset playlist subscription
}

// === lines 108904–109004: PlaylistMenuButton [was: Qg9] ===

/**
 * Button in player chrome that shows playlist position and opens playlist panel.
 * [was: Qg9]
 */
export class PlaylistMenuButton extends PlayerComponent { // was: Qg9
  // constructor: builds button with playlist icon, title, position text
  // hide()/show() — manage visibility
  // ZF() — update position text, check shorts mode
  // W() — subscribe to playlist shuffle events
}

// === lines 109006–109231: PromoTooltip [was: Emw] ===

/**
 * Promotional tooltip (e.g., "Try this feature") with accept/dismiss buttons.
 * Supports targeting by element, tracking, and auto-dismiss.
 * [was: Emw]
 */
export class PromoTooltip extends PlayerComponent { // was: Emw
  constructor(tooltipRenderer, api) { // was: Q, c
    // super({...}) — builds tooltip with title, details, accept/dismiss buttons, pointer
    // Sets up show/hide controls listeners, click handlers
  }
  // K(renderer, sourceElement) — update tooltip content and show
  // b0() — controls shown handler
  // S() — controls hidden handler
  // Ie() — accept button click
  // MM() — dismiss button click
  // T2(event) — document click: dismiss if appropriate
  // Uv(action) — send feedback token for impression/accept/dismiss
  // b3() — resize handler: reposition
}

// === lines 109235–109262: ReplayButton [was: Wkm] ===

/**
 * Replay button shown when video ends.
 * [was: Wkm]
 */
export class ReplayButton extends PlayerComponent { // was: Wkm
  constructor(api) { // was: Q
    // super({...}) — builds button with replay icon
    // Shows when player state has ended flag (W(2))
    // onClick: starts playback
  }
}

// === lines 109264–109341: SearchButton [was: miS] ===

/**
 * Search button for embedded player (navigates to YouTube search).
 * [was: miS]
 */
export class SearchButton extends PlayerComponent { // was: miS
  constructor(api) { // was: Q
    // super({...}) — builds button with search SVG icon + "Search" title
    // onClick: constructs search URL with conversion tracking, opens in window
    // W() — updates visibility based on player width, embed config, ad state
  }
}

// === lines 109343–109494: SeekOverlay [was: KkH] ===

/**
 * Double-tap seek animation overlay showing forward/back arrows with duration.
 * Supports three states: fading-in, lingering, fading-out. Bumps duration text on repeat.
 * [was: KkH]
 */
export class SeekOverlay extends PlayerComponent { // was: KkH
  constructor(api) { // was: Q
    // super({...}) — builds overlay with back/forward arrow animations + message area
    // Creates VE tracking for both directions
  }
  /** Trigger seek animation. [was: trigger] */
  trigger(direction, seconds, chapterIcon, chapterText) { // was: Q, c, W, m
    // Show overlay, handle state transitions, animate duration bump
  }
  /** Touch-triggered seek. [was: hk] */
  hk(direction, x, y, extraSeconds) { // was: Q, c, W, m
    this.trigger(direction, extraSeconds);
  }
  /** Keyboard-triggered seek with VE logging. [was: YU] */
  YU(direction, seconds, seekData) { // was: Q, c, W
    this.trigger(direction, seconds);
    // Log seek interaction via VE
  }
  /** Chapter-based seek animation. [was: aW] */
  aW(direction, icon, text) { // was: Q, c, W
    this.trigger(direction, undefined, icon, text); // was: void 0
  }
}

// === lines 109496–109594: ShareButton [was: TOv] ===

/**
 * Share button supporting Web Share API (mobile) or share panel fallback.
 * [was: TOv]
 */
export class ShareButton extends PlayerComponent { // was: TOv
  constructor(api, chrome, sharePanel) { // was: Q, c, W
    // super({...}) — builds button with share SVG icon + "Share" title
    // onClick: uses navigator.share() if available, else opens share panel
    // ZF: visibility based on player size, embed mode, shorts mode
  }
}

// === lines 109596–109740: SharePanel [was: ojv] ===

/**
 * Share dialog with copyable link, include-playlist checkbox, and service buttons.
 * [was: ojv]
 */
export class SharePanel extends PopupWidget { // was: ojv
  // constructor: builds panel with link, checkbox, loading spinner, service buttons, close
  // show() — load share panel data via innertube command
  // ZF() — update link URL, fetch share buttons
  // onFullscreenToggled — close on exit fullscreen
}

// === lines 109742–109885: ShoppingOverlay [was: rPi] ===

/**
 * Products-in-video shopping pill that shows at timed intervals.
 * Supports content-forward mode with product images and "more" indicator.
 * [was: rPi]
 */
export class ShoppingOverlay extends SuggestedActionBadge { // was: rPi
  constructor(api) { // was: Q
    // super(api)
    // Sets up product overlay with badge, dismiss button, timing
    // Listens to changeProductsInVideoVisibility, videodatachange
  }
  // UH(event) — click: fire innertube command
  // L() — dismiss: mark dismissed, hide
  // XI(visible) — external visibility change
  // onVideoDataChange(reason, videoData) — parse product overlay renderer
  // Y() — should show check
  // Y0(adEvent) — ad overlap: collapse preview/expanded timings
  // xs(visible) — toggle scheduled/unscheduled state
  // mV(offset) — schedule cue ranges for visible/preview/expanded
  // O() — update root node class for shopping pill shown
}
