/**
 * Endscreen Module — Main module class for the "endscreen" satellite module.
 *
 * Source: player_es6.vflset/en_US/endscreen.js, lines 1260–1345
 * Registered via g.GN("endscreen", ...) at line 1260.
 *
 * Contains the module lifecycle, cue-range handling, and endscreen
 * variant selection (videowall, subscribe-card, shorts branded, etc.).
 *
 * [was: anonymous class passed to g.GN("endscreen", ...)]
 */

import { onCueRangeEnter, onCueRangeExit } from '../../ads/dai-cue-range.js';  // was: g.onCueRangeEnter, g.onCueRangeExit
import { getConfig } from '../../core/composition-helpers.js';  // was: g.v
import { onVideoDataChange } from '../../player/player-events.js';  // was: g.Qq
import { CueRange } from '../../ui/cue-range.js';
import { EventHandler } from '../../core/event-handler.js';
import { isEmbedsShortsMode } from '../../features/shorts.js';
import { WatchAgainEndscreen, ModernVideowallEndscreen, ClassicVideowallEndscreen, SubscribeCardEndscreen, BaseEndscreen } from './suggestion-card.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { registerModule } from '../../player/module-registry.js';

// ── Helper: check if organic endscreen UI is enabled ────────────────
// [was: kp9] — Source lines 98–101
function shouldShowOrganicEndscreen(player) { // was: kp9
  const config = player.getConfig(); // was: G
  return config.showEndscreen && !config.disableAutoplay && !config.disableOrganicUi; // was: d3, qY, disableOrganicUi
}

// ── Helper: check if video data has changed ─────────────────────────
// [was: YB9] — Source lines 102–108
function hasVideoDataChanged(module) { // was: YB9
  const videoData = module.player.getVideoData();
  if (!videoData || module.lastVideoDataId === videoData.endscreenId) return false; // was: Xw
  module.lastVideoDataId = videoData.endscreenId;
  return true;
}

// ── Helper: register endscreen cue ranges with the player ───────────
// [was: p_Z] — Source lines 109–122
function registerEndscreenCueRanges(module) { // was: p_Z
  module.player.removeCueRangesByNamespace('endscreen'); // was: qI
  const videoData = module.player.getVideoData();

  // Preload cue: fires 10 seconds before video end
  const preloadCue = new CueRange(
    Math.max((videoData.lengthSeconds - 10) * 1000, 0),
    0x8000000000000,
    { id: 'preload', namespace: 'endscreen' },
  );

  // Load cue: fires at the very end of the video
  const loadCue = new CueRange(
    0x8000000000000,
    0x8000000000000,
    { id: 'load', priority: 8, namespace: 'endscreen' },
  );

  module.player.addCueRanges([preloadCue, loadCue]); // was: mV
}

// ══════════════════════════════════════════════════════════════════════
// EndscreenModule — the main class registered with g.GN("endscreen", ...)
// [was: anonymous class] — Source lines 1260–1343
// ══════════════════════════════════════════════════════════════════════
class EndscreenModule extends ModuleBase {
  /**
   * @param {Object} playerApi [was: Q]
   */
  constructor(playerApi) {
    super(playerApi);

    /** @type {?Object} [was: endScreen] — the active endscreen component */
    this.endScreen = null;

    /** @type {boolean} [was: O] — whether this is an organic (non-embed) endscreen */
    this.isOrganic = false;

    /** @type {boolean} [was: W] — flag for unused (reserved) */
    this.reservedFlag = false;

    /** @type {Object} [was: listeners] */
    this.listeners = new EventHandler(this);
    disposable(this, this.listeners);

    /** @type {?string} [was: lastVideoDataId] — tracks video data changes */
    this.lastVideoDataId = null;

    const config = playerApi.getConfig(); // was: G

    // ── Select endscreen variant ────────────────────────────────────
    if (playerApi.isEmbedsShortsMode()) {
      // Shorts embed: "Watch again on YouTube" endscreen
      this.endScreen = new WatchAgainEndscreen(playerApi); // was: olv
    } else if (shouldShowOrganicEndscreen(playerApi)) {
      this.isOrganic = true;
      hasVideoDataChanged(this);
      if (config.experimentEnabled('delhi_modern_endscreen')) {
        this.endScreen = new ModernVideowallEndscreen(playerApi); // was: cQi
      } else {
        this.endScreen = new ClassicVideowallEndscreen(playerApi); // was: KEi
      }
    } else if (config.isTrailerPage) { // was: qY
      this.endScreen = new SubscribeCardEndscreen(playerApi); // was: WE9
    } else {
      this.endScreen = new BaseEndscreen(playerApi); // was: yY
    }

    disposable(this, this.endScreen);
    attachToPlayer(playerApi, this.endScreen.element, 4);

    // Register cue ranges for this video
    registerEndscreenCueRanges(this);

    // Event bindings
    this.listeners.bindEvent(playerApi, 'videodatachange', this.onVideoDataChange, this);
    this.listeners.bindEvent(playerApi, cueRangeEnterKey('endscreen'), (cue) => this.onCueRangeEnter(cue));
    this.listeners.bindEvent(playerApi, cueRangeExitKey('endscreen'), (cue) => this.onCueRangeExit(cue));
  }

  /**
   * [was: B1] — Determine if the endscreen should be active for this video.
   * Source lines 1284–1294
   * @returns {boolean}
   */
  shouldBeActive() {
    const videoData = this.player.getVideoData();
    const isMutedAutoplayLimited = videoData.mutedAutoplay && (
      videoData.limitedPlaybackDurationInSeconds > 0 ||
      videoData.endSeconds > 0 ||
      videoData.mutedAutoplayDurationMode !== 2
    );

    // Shorts embed always active (unless muted autoplay is limited)
    if (this.player.isEmbedsShortsMode() && !isMutedAutoplayLimited) return true;

    const hasSuggestions = !!(videoData?.getFirstSuggestion() || videoData?.suggestions?.length);
    const showWall = !shouldShowOrganicEndscreen(this.player) || hasSuggestions;
    const isBlocked = videoData.isBlocked; // was: Bi
    const isRestricted = this.player.isRestricted(); // was: Rv
    return showWall && !isBlocked && !isRestricted && !isMutedAutoplayLimited;
  }

  /** [was: nx] — Is the endscreen currently visible? */
  isVisible() {
    return this.endScreen.isVisible(); // was: nx
  }

  /** [was: P3] — Is the countdown currently running? */
  isCountdownRunning() {
    return this.isVisible() ? this.endScreen.isCountdownRunning() : false; // was: S
  }

  /** @override [was: WA] — dispose */
  dispose() {
    this.player.removeCueRangesByNamespace('endscreen');
    super.dispose();
  }

  /**
   * @override [was: load]
   * Source lines 1305–1320
   */
  load() {
    // Check for stream-transition endpoint (e.g. live-to-VOD)
    const videoData = this.player.getVideoData();
    const transitionEndpoint = videoData.transitionEndpointAtEndOfStream;
    if (transitionEndpoint && transitionEndpoint.videoId) {
      const heartbeat = this.player.getServiceManager().services.get('heartbeat'); // was: CO().Cx
      const suggestion = videoData.getFirstSuggestion(); // was: mF
      if (!suggestion || transitionEndpoint.videoId !== suggestion.videoId || videoData.isTransitioned) { // was: Zd
        this.player.loadVideoById(transitionEndpoint.videoId, undefined, undefined, true, true, transitionEndpoint); // was: SF
        if (heartbeat) {
          heartbeat.triggerAction('HEARTBEAT_ACTION_TRIGGER_AT_STREAM_END', 'HEARTBEAT_ACTION_TRANSITION_REASON_HAS_NEW_STREAM_TRANSITION_ENDPOINT'); // was: JG
        }
        return; // transition handled — don't show endscreen
      }
    }

    super.load();
    this.endScreen.show();
  }

  /** @override [was: unload] */
  unload() {
    super.unload();
    this.endScreen.hide();
    this.endScreen.destroy();
  }

  // ── Cue range handlers ─────────────────────────────────────────────

  /** [was: onCueRangeEnter] — Source lines 1326–1329 */
  onCueRangeEnter(cue) {
    if (!this.shouldBeActive()) return;
    if (!this.endScreen.created) this.endScreen.create();
    if (cue.getId() === 'load') this.load();
  }

  /** [was: onCueRangeExit] — Source lines 1330–1332 */
  onCueRangeExit(cue) {
    if (cue.getId() === 'load' && this.loaded) this.unload();
  }

  // ── Video data change ──────────────────────────────────────────────

  /**
   * [was: onVideoDataChange] — Source lines 1333–1341
   * Re-creates the endscreen component if the video data (suggestions) changed.
   */
  onVideoDataChange() {
    registerEndscreenCueRanges(this);
    if (this.isOrganic && hasVideoDataChanged(this)) {
      if (this.endScreen) {
        this.endScreen.hide();
        if (this.endScreen.created) this.endScreen.destroy();
        this.endScreen.dispose();
      }
      this.endScreen = new ClassicVideowallEndscreen(this.player); // was: KEi
      disposable(this, this.endScreen);
      attachToPlayer(this.player, this.endScreen.element, 4);
    }
  }
}

// ── Register the module ─────────────────────────────────────────────
registerModule('endscreen', EndscreenModule);

export { EndscreenModule };
