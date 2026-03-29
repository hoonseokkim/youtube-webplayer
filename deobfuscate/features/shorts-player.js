/**
 * Shorts player specific logic: tooltip tail, watch later button,
 * embed chrome (W1H), chrome factory, shorts gapless loop, media view,
 * gapless transition manager, visibility state, player stubs, player registry,
 * bandwidth estimation, DAI player adapter, format range tracking.
 * Source: base.js lines 115000–117000
 *
 * [was: g.Q_S] Tooltip (continued from line 115000) — tooltip methods tail
 * [was: cA4] WatchLaterButton — watch later / save button
 * [was: W1H] EmbedChrome — full embed chrome with all UI components
 * [was: mni] ChromeFactory — creates appropriate chrome based on config
 * [was: K14] ShortsGaplessLoop — handles gapless looping for Shorts
 * [was: bY0] ShortsFlags — boolean flags for shorts player state
 * [was: g.cZ] MediaElementView — wraps media element with start/end view window
 * [was: P27] GaplessTransition — manages audio/video source buffer handoff
 * [was: Tj0] GaplessTransitionManager — queues and manages gapless transitions
 * [was: oGv] VisibilityState — tracks fullscreen, PiP, minimized, inline, background
 * [was: g.WM] PlayerStub — no-op player interface stub
 * [was: g.K_] PlayerRegistry — manages multiple player instances (main, ad, etc.)
 * [was: rAa] HistogramBandwidthEstimator — histogram-based bandwidth estimator
 * [was: T4] PercentileBandwidthEstimator — percentile-based bandwidth estimator
 * [was: Uni] BandwidthTracker — tracks bandwidth, delay, stall, and interruptions
 * [was: HIm] BandwidthPolicy — configuration for bandwidth estimation
 * [was: OIn] DAIPlayerAdapter — server-stitched DAI ad player adapter
 * [was: g.oy] FormatRangeTracker — tracks video/audio format ranges
 * [was: g.rX] HeartbeatManager — manages heartbeat requests and ad break tracking
 */

import { cueRangeEndId } from '../ads/ad-scheduling.js';  // was: g.FC
import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { isWebRemix } from '../data/performance-profiling.js';  // was: g.uL
import { PlayerComponent } from '../player/component.js';
import { PlayerModule } from '../player/account-linking.js';
import { Disposable } from '../core/disposable.js';
import { EventHandler } from '../core/event-handler.js';
import { getCurrentTime, getDuration } from '../player/time-tracking.js';
import { ObservableTarget } from '../core/event-target.js';

// === lines 115000–115146: Tooltip methods (continued) ===

// Tooltip.setEnabled, on, Ko, JL, WI, Ka, jG, K, T$ methods
// See ui/control-misc.js for class definition

// === lines 115148–115238: WatchLaterButton [was: cA4] ===

/**
 * Watch Later / Save button for embedded player.
 * Supports pending state, tooltip with user avatar.
 * [was: cA4]
 */
export class WatchLaterButton extends PlayerComponent { // was: cA4
  constructor(api) { // was: Q
    // super({...}) — builds button with clock icon + "Watch later" title
    // Sets up click handler, VE tracking, tooltip with user image
  }
  // O(): update visibility based on player state/size
  // MY(): return current video ID
  // onClick(): log click, toggle WL state
  // onReset(): clear pending state
  // ZF(state, message): update icon and tooltip
}

// === lines 115240–115654: EmbedChrome [was: W1H] ===

/**
 * Complete embed chrome: extends BaseChrome with all UI components including
 * top gradient, channel avatar, title, playlist button, cards, overflow,
 * share, search, watch later, copy link, context menu, seek overlay,
 * bezel, suggested actions, shopping overlay, keyboard handlers.
 * [was: W1H]
 */
export class EmbedChrome extends BaseChrome { // was: W1H
  // Key members initialized in init():
  //   r6: g.Lp1 — bezel overlay
  //   h8: KkH|a7m — seek overlay (delhi or legacy)
  //   Dh: div.ytp-chrome-top — top chrome container
  //   tooltip: g.Q_S — tooltip
  //   channelAvatar: jcH — channel avatar
  //   title: pbo — title bar
  //   xR: div.ytp-chrome-top-buttons — top buttons container
  //   dX: w0a — info cards button
  //   Hj: kY1|null — standard controls
  //   contextMenu: f7D — context menu
  //   Wi: Qg9 — playlist button
  //   shareButton: TOv — share button
  //   searchButton: miS — search button
  //   YN: cA4 — watch later button
  //   copyLinkButton: v9W — copy link button
  //   Cw: ky4 — overflow panel
  //   overflowButton: RyH — overflow button

  // Key methods:
  //   d6(): return tooltip
  //   Y_(): return standard controls (Hj)
  //   oh(panel, visible): track visible panel for autohide
  //   Sy(): should controls stay visible
  //   z5(): update top chrome, cards, controls visibility
  //   wS(...): position popup relative to controls
  //   handleGlobalKeyDown/Up: delegate to keyboard handler
  //   cn(): escape key chain
  //   hk(dir, x, y, extra): seek overlay trigger
  //   renderChapterSeekingAnimation: chapter seek overlay
}

// === lines 115656–115674: ChromeFactory [was: mni] ===

/**
 * Factory that creates the appropriate chrome based on player config.
 * Uses LH (base) for organic-UI-disabled or mobile; W1H (embed) otherwise.
 * [was: mni]
 */
export class ChromeFactory extends PlayerModule { // was: mni
  constructor(player) { // was: Q
    super(player);
    this.chrome = null;
    this.load();
  }
  GS() { return false; } // was: !1
  create() {
    const config = this.player.G(); // was: Q
    if ((isWebRemix(config) && config.O) || config.disableOrganicUi) {
      this.chrome = new BaseChrome(this.player);
    } else {
      this.chrome = new EmbedChrome(this.player);
    }
    registerDisposable(this, this.chrome);
    this.chrome.init();
  }
  l9() { return this.chrome; }
}

// === lines 115676–115719: ShortsGaplessLoop [was: K14] ===

/**
 * Handles gapless looping for Shorts videos, coordinating between
 * current and next video data for seamless replay.
 * [was: K14]
 */
export class ShortsGaplessLoop extends Disposable { // was: K14
  constructor(app) { // was: Q
    super();
    this.app = app;
    this.K = null; // was: this.K
    this.j = null; // was: this.j
    this.O = null; // was: this.O
    this.W = null; // was: this.W — next video data
    this.A = 1;
    this.events = new EventHandler(this);
    this.events.B(this.app.ge, cueRangeEndId("gaplessshortslooprange"), this.L);
    registerDisposable(this, this.events);
  }
  // J(): attempt gapless playback of next video
  // D(): attempt gapless with source buffer handoff
  // L(cueRange): handle loop range end — seek to 0
}

// === lines 115721–115725: ShortsFlags [was: bY0] ===

/** Boolean flags for shorts player state. [was: bY0] */
export class ShortsFlags { // was: bY0
  constructor() {
    this.j = false;
    this.K = false;
    this.L = false;
    this.mF = false;
    this.D = false;
    this.Y = false;
    this.A = false;
    this.O = false;
    this.J = false;
    this.W = false;
  }
}

// === lines 115727–115932: MediaElementView [was: g.cZ] ===

/**
 * Wraps a media element with a start/end view window, translating all
 * time-based operations to the view's coordinate system.
 * Used for server-stitched DAI and gapless transitions.
 * [was: g.cZ]
 */
export class MediaElementView extends LayoutIdMetadata { // was: g.cZ
  constructor(mediaElement, start, end, keepDuration = false) { // was: Q, c, W, m=!1
    super();
    this.mediaElement = mediaElement;
    this.start = start; // was: c
    this.end = end; // was: W
    this.W = keepDuration; // was: m
  }
  isView() { return true; } // was: !0
  getCurrentTime() { return this.mediaElement.getCurrentTime() - this.start; }
  setCurrentTime(time) { this.mediaElement.setCurrentTime(time + this.start); } // was: Q
  getDuration() {
    return isFinite(this.end) && !this.W
      ? this.end - this.start
      : this.mediaElement.getDuration() - this.start;
  }
  // All other methods delegate to this.mediaElement
  // play, pause, seek, volume, attribute, etc.
}

// === lines 115936–116108: GaplessTransition [was: P27] ===

/**
 * Manages a single gapless transition between two players, handling
 * source buffer preparation, handoff timing, and error recovery.
 * [was: P27]
 */
export class GaplessTransition extends Disposable { // was: P27
  // constructor: sets up policy, current/next player, timing, status
  // A(): prepare transition (check indexes, create source buffer splits)
  // J(sourceBuffer): handle updateend — check buffer continuity
  // bl(reason, info): fail transition with error logging
  // MM(): check if transition is ready to proceed
}

// === lines 116110–116145: GaplessTransitionManager [was: Tj0] ===

/**
 * Queues and manages gapless transitions between players.
 * [was: Tj0]
 */
export class GaplessTransitionManager extends Disposable { // was: Tj0
  // constructor: sets up queue, scheduling
  // clearQueue(resetError, cancelCurrent): cancel pending transitions
  // Zr(): true if queue is empty
  // bS()/Bc(): transition state checks
}

// === lines 116147–116229: VisibilityState [was: oGv] ===

/**
 * Tracks player visibility state: fullscreen mode, PiP, minimized,
 * inline, background, squeezeback, and theater mode.
 * Publishes visibilitychange and visibilitystatechange events.
 * [was: oGv]
 */
export class VisibilityState extends ObservableTarget { // was: oGv
  // getVisibilityState(...): compute visibility state enum from all flags
  // Z0(mode): set fullscreen mode
  // setMinimized/setInline/RN(pip)/setSqueezeback/nu(theater)
  // isFullscreen/isMinimized/isInline/isBackground/Zh(pip)/Zq(squeeze)/d7(theater)
}

// === lines 116231–116581: PlayerStub [was: g.WM] ===

/**
 * No-op player interface stub that returns safe defaults for all player methods.
 * Used as placeholder when no active player exists.
 * [was: g.WM]
 */
// Implements ~100 no-op methods: getCurrentTime→0, getDuration→0, getPlaybackRate→1,
// getPlayerState→new g.In, getVideoData→new g.Od, etc.

// === lines 116582–116702: PlayerRegistry [was: g.K_] ===

/**
 * Manages multiple player instances: main (mF), presenting (O), ad players (A),
 * with a cache (D) for recently active players.
 * [was: g.K_]
 */

// === lines 116704–116798: Bandwidth estimation classes ===
// rAa (HistogramBandwidthEstimator), T4 (PercentileBandwidthEstimator)
// Used for adaptive bitrate selection

// === lines 116800–116866: BandwidthTracker [was: Uni] / BandwidthPolicy [was: HIm] ===
// Tracks real-time bandwidth measurements and applies estimation policy

// === lines 116867–116906: DAIPlayerAdapter [was: OIn] ===
// Adapter wrapping a content player for server-stitched DAI ad playback

// === lines 116907–117000: FormatRangeTracker [was: g.oy] + HeartbeatManager start [was: g.rX] ===
// Format range tracking for video/audio quality switching
// Heartbeat manager setup (continues past line 117000)
