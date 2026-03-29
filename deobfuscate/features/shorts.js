/**
 * Shorts-Specific Logic
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~85084-85086, 109887-109952,
 *         plus scattered references across 45463, 47634, 48645, 105015, etc.
 *
 * Covers Shorts mode detection, the Shorts title/channel overlay for
 * embedded players, and Shorts-specific UI adaptations.
 */

// ---------------------------------------------------------------------------
// Imports (conceptual)
// ---------------------------------------------------------------------------
import { DomComponent } from '../core/dom-component.js'; // was: g.k
import { isEmbedded } from '../core/player-config.js';   // was: g.oc
import { dispose } from '../core/lifecycle.js';            // was: g.F
import { buildShoppingOverlayUrl } from '../ui/progress-bar-impl.js'; // was: gz_
import { createSubscribeButton } from '../ui/progress-bar-impl.js'; // was: Ow0
import { OverflowButton } from './keyboard-handler.js'; // was: RyH
import { ShareButton } from './keyboard-handler.js'; // was: TOv
import { getConfig } from '../core/composition-helpers.js';
import { logClick } from '../data/visual-element-tracking.js';
import { getPlayerSize } from '../player/time-tracking.js';

// ---------------------------------------------------------------------------
// Shorts Mode Detection  (line ~85084)
// ---------------------------------------------------------------------------

/**
 * Determine whether the player should use the embedded Shorts experience.
 *
 * Conditions (simplified from obfuscated logic):
 *  1. Player must be in embedded mode (`g.oc`)
 *  2. `embeddedPlayerMode` must be "EMBEDDED_PLAYER_MODE_DEFAULT" (or absent)
 *  3. Must NOT have a playlist (`playlistId` absent)
 *  4. Either `embeds_enable_shorts` experiment is on, or the viewport is
 *     portrait (width <= height)
 *  5. `isShortsExperienceEligible` flag is set in the embedded player config
 *
 * @param {Object}  playerConfig   Embedded player config [was: this -- VideoData]
 * @param {{ width: number, height: number }} viewport  Player dimensions [was: Q]
 * @param {boolean} hasPlaylist    Whether a playlist is active [was: c]
 * @returns {boolean}
 *
 * [was: VideoData.prototype.isEmbedsShortsMode  (line 85084)]
 */
export function isEmbedsShortsMode(playerConfig, viewport, hasPlaylist) {
  // Must be an embedded player
  if (!isEmbedded(playerConfig.embedConfig)) { // was: !g.oc(this.AJ)
    return false;
  }

  // Must be default embed mode (not PIP, not other special modes)
  const embedMode = playerConfig.embedConfig?.playerMode ?? 'EMBEDDED_PLAYER_MODE_DEFAULT';
  if (embedMode !== 'EMBEDDED_PLAYER_MODE_DEFAULT') {
    return false;
  }

  // Playlists disable Shorts mode
  if (hasPlaylist) {
    return false;
  }

  const flags = playerConfig.embeddedPlayerConfig?.embeddedPlayerFlags;
  const isShortsEligible = !!flags?.isShortsExperienceEligible;

  // If the experiment is enabled, eligibility is sufficient
  if (playerConfig.experimentEnabled('embeds_enable_shorts')) { // was: this.X("embeds_enable_shorts")
    return isShortsEligible;
  }

  // Otherwise, also require portrait aspect ratio
  return isShortsEligible && viewport.width <= viewport.height;
}

// ---------------------------------------------------------------------------
// Shorts mode CSS class application  (line ~105015)
// ---------------------------------------------------------------------------

/**
 * Apply or remove the `ytp-shorts-mode` CSS class on the player element
 * based on the current Shorts mode state.
 *
 * @param {HTMLElement} rootElement  Player root node
 * @param {boolean}     isShortsMode
 *
 * [was: inline at line 105015-105016]
 */
export function applyShortsModeCss(rootElement, isShortsMode) {
  rootElement.classList.toggle('ytp-shorts-mode', isShortsMode); // was: g.L(this.element, "ytp-shorts-mode", W)
}

// ---------------------------------------------------------------------------
// Shorts Title/Channel Overlay [was: Uiv]  (line ~109887)
// ---------------------------------------------------------------------------

/**
 * Embedded Shorts title and channel overlay displayed at the top of the player.
 *
 * Shows:
 *  - Channel profile picture (clickable link to channel)
 *  - Channel name / expanded title (clickable link to channel)
 *  - Optional subscribe button
 *
 * CSS classes: `.ytp-shorts-title-channel`, `.ytp-shorts-title-channel-logo`,
 *             `.ytp-shorts-title-expanded-heading`, `.ytp-shorts-title-expanded-title`
 *
 * Only visible when `isEmbedsShortsMode()` returns true.
 *
 * [was: Uiv]
 */
export class ShortsTitleOverlay extends DomComponent {
  /**
   * @param {Object} api  Player API [was: Q]
   */
  constructor(api) {
    super({
      tag: 'div',
      className: 'ytp-shorts-title-channel',
      children: [
        {
          tag: 'a',
          className: 'ytp-shorts-title-channel-logo',
          attributes: {
            href: '{{channelLink}}',
            target: api.getConfig().linkTarget, // was: Q.G().Y
            'aria-label': '{{channelLogoLabel}}',
          },
        },
        {
          tag: 'div',
          className: 'ytp-shorts-title-expanded-heading',
          children: [
            {
              tag: 'div',
              className: 'ytp-shorts-title-expanded-title',
              children: [
                {
                  tag: 'a',
                  textContent: '{{expandedTitle}}',
                  attributes: {
                    href: '{{channelTitleLink}}',
                    target: api.getConfig().linkTarget,
                    tabIndex: '0',
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    this.api = api;

    /** @type {HTMLElement} Channel logo image element [was: this.W] */
    this.logoElement = this._query('.ytp-shorts-title-channel-logo');

    /** @type {HTMLElement} Channel name text element [was: this.channelName] */
    this.channelNameElement = this._query('.ytp-shorts-title-expanded-title');

    /** @type {Object|null} Subscribe button (created if applicable) [was: this.subscribeButton] */
    this.subscribeButton = null;

    // Register click tracking on logo and channel name
    api.createClientVe(this.logoElement, this, 36925);
    this._onLogoClick = (event) => {
      this.api.logClick(this.logoElement);
      window.open(this._getChannelUrl()); // was: g.TY(window, gz_(this))
      event.preventDefault();
    };

    api.createClientVe(this.channelNameElement, this, 37220);
    this._onChannelNameClick = (event) => {
      this.api.logClick(this.channelNameElement);
      window.open(this._getChannelUrl());
      event.preventDefault();
    };

    // Initialize subscribe button if applicable [was: Ow0(this)]
    this._initSubscribeButton();

    // Listen for data changes
    this._g.s7(api, 'videodatachange', this._update);
    this._g.s7(api, 'videoplayerreset', this._update);
    this._update();
  }

  /**
   * Refresh visibility and content based on current video data.
   * [was: ZF()]
   */
  _update() {
    const config = this.api.getConfig();

    // Only visible in embedded Shorts mode
    this.setVisible(isEmbedded(config) && this.api.isEmbedsShortsMode()); // was: g.oc(Q) && this.api.isEmbedsShortsMode()

    if (this.subscribeButton) {
      this.api.logVisibility(this.subscribeButton.element, this.isVisible);
    }

    const videoData = this.api.getVideoData();
    let shouldShow = false;

    if (this.api.getPresentingPlayerType() === 2) {
      // Ad player type
      shouldShow = !!videoData.videoId && !!videoData.isListed &&
                   !!videoData.author && !!videoData.channelUrl &&
                   !!videoData.profilePicture;
    } else if (isEmbedded(config)) {
      shouldShow = !!videoData.videoId && !!videoData.channelUrl &&
                   !!videoData.profilePicture && !videoData.isEmbed &&
                   !config.isMinimalMode &&
                   !(config.isMobileEmbed && this.api.getPlayerSize().width < 200);
    }

    this._applyContent(
      shouldShow,
      videoData.profilePicture,
      isEmbedded(config) ? videoData.expandedTitle : videoData.author,
    ); // was: fjK(this, W, c.profilePicture, ...)

    if (this.subscribeButton) {
      this.subscribeButton.channelId = videoData.channelId; // was: c.nB
    }

    this.updateValue('expandedTitle', videoData.expandedTitle);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Apply profile picture and channel name to the overlay.
   * @param {boolean}     show
   * @param {string|null} profilePicUrl
   * @param {string}      channelName
   * [was: fjK]
   */
  _applyContent(show, profilePicUrl, channelName) {
    if (!show) {
      this.setVisible(false);
      return;
    }
    if (profilePicUrl) {
      this.logoElement.style.backgroundImage = `url(${profilePicUrl})`;
    }
    if (channelName) {
      this.channelNameElement.textContent = channelName;
    }
    this.setVisible(true);
  }

  _getChannelUrl() { return ''; /* was: buildShoppingOverlayUrl(this) */ }
  _initSubscribeButton() { /* was: createSubscribeButton(this) */ }
  _query(_sel) { return null; /* was: this.z2(sel) */ }
  _g.s7() { /* event wiring */ }
  setVisible(_v) { /* was: this.BB(v) */ }
}

// ---------------------------------------------------------------------------
// Shorts-specific UI adaptations (scattered references)
// ---------------------------------------------------------------------------

/**
 * Checks various Shorts-related conditions used across the player UI:
 *
 * - Hide overflow menu button in Shorts mode (line ~108643)
 * - Hide watch-later button in Shorts mode (line ~52276)
 * - Adjust player controls layout for portrait (line ~52063)
 * - Disable autoplay toggle in Shorts mode (line ~48645)
 * - Hide playlist panel in Shorts mode (line ~108973)
 * - Suppress share/copy-link in Shorts mode where applicable
 *
 * These are not centralized in one function in the source; they are
 * `this.api.isEmbedsShortsMode()` checks sprinkled throughout the UI
 * component visibility logic.
 */
export const SHORTS_UI_RULES = {
  /** Overflow ("More") button hidden in Shorts (line ~108643). */
  hideOverflowButton: true,

  /** Share button visibility may be suppressed (line ~52276). */
  hideShareButton: true,

  /** Watch-later button hidden (line ~49536). */
  hideWatchLater: true,

  /** Playlist panel suppressed (line ~108973). */
  hidePlaylistPanel: true,

  /** Channel avatar adjusts positioning for Shorts viewport (line ~52063). */
  adjustAvatarPosition: true,

  /** Autoplay toggle hidden (line ~48645). */
  hideAutoplayToggle: true,
};
