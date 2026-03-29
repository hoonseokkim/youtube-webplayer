/**
 * Ad Module Registration
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~124100-124304
 *
 * The main ad module class that extends the player module base class (g.zj)
 * and is registered via g.GN("ad", ...). Orchestrates ad loading, ad placement
 * parsing, and ad UI creation (CI9 container, L1a overlay).
 */

// ---------------------------------------------------------------------------
// Imports (conceptual -- actual paths TBD by full deobfuscation)
// ---------------------------------------------------------------------------
import { PlayerModule } from '../core/player-module.js';          // was: g.zj
import { registerModule } from '../core/module-registry.js';      // was: g.GN
import { dispose } from '../core/lifecycle.js';                    // was: g.F
import { isSmallScreen } from '../core/player-config.js';         // was: XC
import { isAudioOnly } from '../core/player-config.js';           // was: g.X7
import { isMiniPlayer } from '../core/player-config.js';          // was: Dm
import { logAdError } from './ad-logging.js';                     // was: v1
import { parseAdPlacements } from '../player/playback-bridge.js'; // was: rwW
import { getDuration, getCurrentTime } from '../player/time-tracking.js';
import { getConfig } from '../core/composition-helpers.js';
import { getPlayerResponse } from '../player/player-api.js';
import { remove } from '../core/array-utils.js';

// ---------------------------------------------------------------------------
// AdProgressTracker [was: Dno]  (lines ~124080-124113)
// ---------------------------------------------------------------------------

/**
 * Tracks ad playback progress and publishes progress/state events.
 * [was: Dno]
 */
export class AdProgressTracker {
  /** @param {Object} player [was: Q] */
  constructor(player) {
    /** @type {Object|null} [was: this.O] */
    this.progressState = null;

    /** @type {number} [was: this.N7] */
    this.playerType = undefined; // set externally

    this.api = player; // was: this.api
  }

  /**
   * Capture current playback progress and publish an update event.
   * [was: inline in Dno constructor callback]
   */
  captureProgress() {
    this.progressState = {
      seekableStart: 0,
      seekableEnd: this.api.getDuration({
        playerType: this.playerType,
        includeSeekedRange: false // was: wj: !1
      }),
      current: this.api.getCurrentTime({
        playerType: this.playerType,
        includeSeekedRange: false // was: wj: !1
      }),
    };
    this.publish('h'); // was: this.publish("h")
  }

  /** @returns {Object|null} [was: getProgressState] */
  getProgressState() {
    return this.progressState; // was: this.O
  }

  /**
   * Called on player state change; re-publishes when entering state 2.
   * @param {Object} stateChange [was: Q]
   * [was: A(Q)]
   */
  onStateChange(stateChange) {
    if (stateChange.hasChanged(2)) { // was: Q.Fq(2)
      this.publish('g');
    }
  }
}

// ---------------------------------------------------------------------------
// AdModule [was: MzH]  (lines ~124177-124304)
// ---------------------------------------------------------------------------

/**
 * Top-level ad module registered with the player.
 *
 * Extends `PlayerModule` [was: g.zj] and is registered via
 * `registerModule("ad", AdModule)` [was: g.GN("ad", MzH)].
 *
 * Responsibilities:
 *  - Create the ad orchestration pipeline [was: dna, Hsi]
 *  - Instantiate the ad UI container (`AdUIContainer` / CI9)
 *  - Parse ad placements from the player response and feed them
 *    to the ad control-flow manager
 *
 * [was: MzH]
 */
export class AdModule extends PlayerModule {
  /**
   * @param {Object} player  The player API instance [was: Q]
   */
  constructor(player) {
    super(player);

    /** @type {Object|null} Lazy-initialized ad pipeline [was: this.O] */
    this.adPipeline = null;

    /** @type {boolean} Whether create() has been called [was: this.created] */
    this.created = false;

    /** @type {AdProgressTracker} [was: this.A] */
    this.progressTracker = new AdProgressTracker(this.player); // was: new Dno(this.player)

    /**
     * Factory function returning the ad pipeline instance (lazy).
     * [was: this.j]
     */
    this.getOrCreatePipeline = () =>
      this.adPipeline ??
      (this.adPipeline = new _AdPipelineFactory({
        // Various config lookups from this.W (orchestrator wrapper)
        // Kept abstract; real wiring requires full deobfuscation
      }).pipeline); // was: (new Hsi({...})).O

    /**
     * Ad orchestrator wrapper that coordinates slots, layouts, and rendering.
     * [was: this.W  -- instance of dna]
     */
    this.orchestrator = new _AdOrchestrator(
      this.player,
      this,
      this.progressTracker,
      this.getOrCreatePipeline,
    ); // was: new dna(this.player, this, this.A, this.j)
    dispose(this, this.orchestrator); // was: g.F(this, this.W)

    // Conditionally create the ad UI container and secondary overlay
    const config = player.getConfig(); // was: Q.G()
    if (
      !isSmallScreen(config) && // was: !XC(c)
      !isAudioOnly(config) &&   // was: !g.X7(c)
      !isMiniPlayer(config)     // was: !Dm(c)
    ) {
      dispose(
        this,
        new _AdUIContainer(
          player,
          this.orchestrator._getCommandExecutor(), // was: mQ(this.W).vA
          this.orchestrator._getLayoutManager(),    // was: mQ(this.W).Hc
        ),
      ); // was: g.F(this, new CI9(Q, mQ(this.W).vA, mQ(this.W).Hc))

      dispose(this, new _AdSecondaryOverlay(player)); // was: g.F(this, new L1a(Q))
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** First-time ad system initialization. [was: create()] */
  create() {
    try {
      this._notifyLifecycle();      // was: n6K(this)
      this.load();
      this.created = true;
      this._notifyLifecycle();      // was: n6K(this)
    } catch (error) {
      logAdError(error instanceof Error ? error : String(error)); // was: v1(...)
    }
  }

  /** Load ad placements from the current video's player response. [was: load()] */
  load() {
    this._loadInternal(); // was: this.K()
  }

  /**
   * Internal load -- parses ad placements from the player response
   * and feeds them into the control-flow manager.
   * [was: K()]
   */
  _loadInternal() {
    super.load();

    const layoutManager = this.orchestrator._getLayoutManager(); // was: mQ(this.W).Hc

    try {
      this.player.getRootNode().classList.add('ad-created');
    } catch (err) {
      logAdError(err instanceof Error ? err : String(err));
    }

    const videoData = this.player.getVideoData({ playerType: 1 }); // was: c
    const videoId = videoData?.videoId ?? '';                       // was: W
    const playerResponse = videoData?.getPlayerResponse() ?? {};   // was: m

    const rawPlacements = (playerResponse.adPlacements ?? []).map(
      (p) => p.adPlacementRenderer,
    ); // was: K

    const adSlots = (playerResponse.adSlots ?? []).map(
      (s) => s.adSlotRenderer, // was: g.l(r, nz) -- simplified
    ); // was: T

    const isDaiEnabled =
      playerResponse.playerConfig?.daiConfig?.enableDai ?? false; // was: m (reused)

    videoData?.resetAdState(); // was: c && c.UC()

    const parsedPlacements = _g.parseAdPlacements(
      rawPlacements,
      adSlots,
      layoutManager,
      this.orchestrator._getAdEventLogger(), // was: mQ(this.W).aE
    ); // was: BSR(K, T, Q, mQ(this.W).aE)

    const clientPlaybackNonce = videoData?.clientPlaybackNonce ?? ''; // was: K (reused)
    const isServerStitched = videoData?.isServerStitchedAd ?? false; // was: c (reused)
    const durationMs = 1000 * this.player.getDuration({ playerType: 1 }); // was: T (reused)

    // Feed placements to the ad control-flow manager
    this.orchestrator._getControlFlowManager().initializeAdBreaks(
      clientPlaybackNonce,
      durationMs,
      isServerStitched,
      parsedPlacements.prerollSlots,     // was: Q.gg
      parsedPlacements.midrollSlots,     // was: Q.p5
      parsedPlacements.prerollSlots,     // duplicated in source
      isDaiEnabled,
      videoId,
    ); // was: this.W.W.Yg.V1(...)
  }

  /** Tear down the ad system for the current video. [was: destroy()] */
  destroy() {
    const videoData = this.player.getVideoData({ playerType: 1 });
    this.orchestrator._getControlFlowManager().teardown(
      videoData?.clientPlaybackNonce ?? '',
    ); // was: this.W.W.YhasKeyStatusApi(...)

    this.unload();
    this.created = false;
  }

  /** Remove ad UI and clean up. [was: unload()] */
  unload() {
    super.unload();
    try {
      this.player.getRootNode().classList.remove('ad-created');
    } catch (err) {
      logAdError(err instanceof Error ? err : String(err));
    }
    if (this.adPipeline != null) {
      // additional cleanup elided -- see source line ~124254+
    }
  }

  // -- Private helpers (stubs) ---
  _notifyLifecycle() {
    /* was: n6K(this) -- notifies lifecycle observers */
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerModule('ad', AdModule); // was: g.GN("ad", MzH)

// ---------------------------------------------------------------------------
// Placeholder classes referenced above (not fully deobfuscated here)
// ---------------------------------------------------------------------------
class _AdPipelineFactory {} // was: Hsi
class _AdOrchestrator {     // was: dna
  constructor() {}
  _getCommandExecutor() {}  // was: mQ(this.W).vA
  _getLayoutManager() {}    // was: mQ(this.W).Hc
  _getAdEventLogger() {}    // was: mQ(this.W).aE
  _getControlFlowManager() { return { initializeAdBreaks() {}, teardown() {} }; }
}
class _AdUIContainer {}     // was: CI9
class _AdSecondaryOverlay {} // was: L1a
function _g.parseAdPlacements() { return { prerollSlots: [], midrollSlots: [] }; } // was: BSR
