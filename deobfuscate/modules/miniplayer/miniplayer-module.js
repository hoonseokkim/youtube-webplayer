/**
 * Miniplayer Module — Main module class registered via g.GN("miniplayer", ...)
 *
 * Source: player_es6.vflset/en_US/miniplayer.js, lines 306–343
 * Deobfuscated from the `(function(g) { ... })(_yt_player)` IIFE.
 */

import {
  toggleClass, // was: g.L
  registerDisposable, // was: g.F
  addToPlayerLayer, // was: g.f8
} from '../../core/';

import {
  PlayerModule, // was: g.zj
  registerModule, // was: g.GN
  EventHandler, // was: g.db
} from '../../player/';

import { MiniplayerUI } from './miniplayer-controls.js';
import { filterAndSortFormats } from '../../data/bandwidth-tracker.js'; // was: as
import { PlayerModule } from '../../player/account-linking.js';
import { EventHandler } from '../../core/event-handler.js';
import { onVideoDataChange } from '../../player/player-events.js';
import { getVideoAspectRatio } from '../../player/playback-mode.js';

/**
 * The "miniplayer" satellite module. Manages showing/hiding the miniplayer
 * UI overlay and tracking aspect ratio to adjust corner rounding.
 *
 * Registered via `g.GN("miniplayer", ...)` at source line 306.
 *
 * @extends {PlayerModule} [was: g.zj]
 */
export class MiniplayerModule extends PlayerModule { // was: anonymous class at g.GN("miniplayer", ...)
  /**
   * @param {Object} player - The player API instance
   */
  constructor(player) {
    super(player);

    /**
     * Event subscription manager.
     * [was: O]
     * @type {EventHandler}
     */
    this.eventHandler = new EventHandler(this); // was: this.O

    /**
     * The miniplayer UI overlay instance.
     * [was: W]
     * @type {MiniplayerUI}
     */
    this.miniplayerUI = new MiniplayerUI(this.player); // was: this.W
    this.miniplayerUI.hide();
    f8(this.player, this.miniplayerUI.element, 4);

    // If the player is already minimized at construction time, load immediately
    if (player.isMinimized()) {
      this.load();
      L(player.getRootNode(), "ytp-player-minimized", true);
    }
  }

  /**
   * Called when video data changes. Checks whether the video has a
   * non-standard aspect ratio and applies a CSS class accordingly.
   *
   * Source lines: 316–323
   */
  onVideoDataChange() {
    if (this.player.getVideoData()) {
      const aspectRatio = this.player.getVideoAspectRatio();
      const standardWide = 16 / 9;
      const isNonStandardAspect = aspectRatio > standardWide + 0.1 || aspectRatio < standardWide - 0.1;
      L(
        this.player.getRootNode(),
        "ytp-rounded-miniplayer-not-regular-wide-video",
        isNonStandardAspect
      );
    }
  }

  /**
   * Lifecycle: called after the module is constructed. Subscribes to
   * `videodatachange` and runs initial aspect-ratio check.
   *
   * Source lines: 324–328
   */
  create() {
    super.create();
    this.eventHandler.B(this.player, "videodatachange", this.onVideoDataChange);
    this.onVideoDataChange();
  }

  /**
   * Whether this module supports a given player type.
   * Always returns `false` — miniplayer does not gate on player type.
   * [was: GS]
   *
   * @returns {boolean}
   */
  GS() {
    return false;
  }

  /**
   * Loads the miniplayer: hides standard controls and shows the
   * miniplayer overlay.
   *
   * Source lines: 332–335
   */
  load() {
    this.player.hideControls();
    this.miniplayerUI.show();
  }

  /**
   * Unloads the miniplayer: restores standard controls and hides the
   * miniplayer overlay.
   *
   * Source lines: 336–339
   */
  unload() {
    this.player.showControls();
    this.miniplayerUI.hide();
  }
}

// Register the module with the player framework
GN("miniplayer", MiniplayerModule);
