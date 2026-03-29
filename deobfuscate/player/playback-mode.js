import { publishEvent, publishEventAll } from '../ads/ad-click-tracking.js';
import { isTvHtml5 } from '../data/performance-profiling.js';
import { DcR, Rh } from '../data/session-storage.js';
import { onVideoDataChange } from './player-events.js'; // was: Qq
import { updateVideoControls } from './playback-state.js'; // was: hL
import { buildTimeRangeEntryTrigger } from '../ads/slot-id-generator.js'; // was: S5
import { isVideoVisible } from './playback-state.js'; // was: zx
import { requestSlotExit } from '../network/uri-utils.js'; // was: YO
import { parseInstreamVideoAdRenderer } from '../ads/companion-layout.js'; // was: oL
import { DEFAULT_ASPECT_RATIO } from '../data/idb-operations.js'; // was: JL
import { BASE64_WEBSAFE_REPLACE } from '../proto/messages-core.js'; // was: J4
import { CONSTRUCTOR_GUARD } from '../proto/messages-core.js'; // was: hd
import { getExperimentFlags } from './time-tracking.js'; // was: Ty()
import { DEFAULT_STORE_EXPIRATION_TOKEN } from '../network/innertube-config.js'; // was: BI
import { getPlayerPhase } from '../media/source-buffer.js'; // was: q5
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { CssTransitionAnimation } from '../core/bitstream-helpers.js'; // was: NI
import { timedInvoke } from '../core/event-registration.js'; // was: pO
import { captureBandwidthSnapshot } from '../ads/ad-prebuffer.js'; // was: x$
import { isWithinLoopRange } from './playback-state.js'; // was: FMO
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { isLooping } from './time-tracking.js'; // was: mE()
import { getAdModule } from './caption-manager.js'; // was: u2
import { enqueueCallback } from '../core/composition-helpers.js'; // was: oY
import { CaptionWindowCue } from '../modules/caption/caption-track-list.js'; // was: wE
import { updateVideoData } from '../features/autoplay.js';
import { getAppState } from './player-api.js';
import { getPlayerState } from './playback-bridge.js';
import { getCurrentTime } from './time-tracking.js';
import { seekTo } from '../ads/dai-cue-range.js';
import { setLoopRange } from '../ui/seek-bar-tail.js';
import { isEmbedded } from '../data/performance-profiling.js';
import { nextVideo, playVideo } from './player-events.js';
import { forEach } from '../core/event-registration.js';
import { isEquirectangular, isEquirectangular3D, isMeshProjection } from './video-data-helpers.js'; // was: g.ct, g.Wt, g.mO
// TODO: resolve g.pl
// TODO: resolve g.zC

/**
 * Playback Mode & UI State Management
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~54003–54017  (FO7, e2w — version tagging)
 *                 ~54011–54018  (VcR — retro player mode toggle)
 *                 ~54020–54049  (Bd7 — presenter event binding)
 *                 ~54051–54101  (ngK — video container layout)
 *                 ~54103–54162  (hL, qC0, Mm, xc7, zx — video display utilities)
 *                 ~54257–54284  (SCd, yS, k$, Y$ — playback state & seeking)
 *                 ~54687–54726  (z2_, h2m, yw — playback resumption & state change)
 *                 ~54983–55009  (Qw, wW — server-stitched DAI duration)
 *                 ~55007–55013  (wW, tw — DAI state & endscreen teardown)
 *                 ~56005–56019  (mX, RE — multi-player presenter state)
 *
 * Key subsystems:
 *   - Retro player mode toggle (VcR) — toggles `ytp-retro-player` CSS class
 *   - Server-stitched DAI state detection (wW) — checks `enableServerStitchedDai`
 *   - Playback resumption logic (h2m, z2_) — autonav / playlist continuation
 *   - External API state change dispatch (yw) — fires `onStateChange`, `onAdStateChange`
 *   - Video container layout & aspect ratio management (ngK, xc7, Mm, qC0)
 *   - Presenter/UI component coordination (RE, mX) — ad video data sync
 *   - Video visibility detection (zx) — determines if video should be visible
 *   - Presenter event binding (Bd7) — wires initializingmode, videodatachange,
 *     videoplayerreset, presentingplayerstatechange
 *
 * [was: FO7, e2w, VcR, Bd7, ngK, hL, qC0, Mm, xc7, zx,
 *  SCd, yS, k$, Y$, z2_, h2m, yw, Qw, wW, tw, mX, RE]
 */

// ---------------------------------------------------------------------------
// Version check  (line 54003)
// ---------------------------------------------------------------------------

/**
 * Checks whether a specific version key exists in the player's version map.
 *
 * @param {Object} player    Player instance.
 *   @param {Map} player.W   — version/flag map  [was: W]
 * @param {string} key       Version key to look up.  [was: c]
 * @returns {boolean}        True if the key is present and truthy.
 *
 * [was: FO7]
 */
export function hasVersion(player, key) { // was: FO7
  return key ? !!player.W.get(key) : false; // was: c ? !!Q.W.get(c) : !1
}

// ---------------------------------------------------------------------------
// Dataset version stamp  (line 54007)
// ---------------------------------------------------------------------------

/**
 * Stamps a DOM element's `dataset.version` with the given value.
 *
 * @param {HTMLElement} element  Target element.  [was: Q]
 * @param {string}      version Version string.   [was: c]
 *
 * [was: e2w]
 */
export function setDatasetVersion(element, version) { // was: e2w
  element.dataset.version = version;
}

// ---------------------------------------------------------------------------
// Retro Player Mode Toggle  (line 54011)
// ---------------------------------------------------------------------------

/**
 * Toggles the "retro player" visual mode on the player template.
 *
 * Flips the `XA` flag, adds/removes the `ytp-retro-player` CSS class,
 * forces a resize (bracketed by `fm` guard to suppress transient layout),
 * then notifies the app's event emitter via `onRetroModeChanged`.
 *
 * @param {Object} template  Player template/UI component.
 *   @param {boolean}    template.XA      — retro-mode enabled flag  [was: XA]
 *   @param {boolean}    template.fm      — resize-guard flag        [was: fm]
 *   @param {HTMLElement} template.element — root element
 *   @param {Object}     template.app     — application controller
 *   @param {Object}     template.app.ge  — event emitter            [was: ge]
 *
 * [was: VcR]
 */
export function toggleRetroPlayerMode(template) { // was: VcR
  template.XA = !template.XA;
  template.fm = true; // was: !0
  template.element.classList.toggle('ytp-retro-player', template.XA);
  template.resize();
  template.fm = false; // was: !1
  publishEvent(template.app.ge, 'onRetroModeChanged', template.XA);
}

// ---------------------------------------------------------------------------
// Presenter Event Binding  (line 54020)
// ---------------------------------------------------------------------------

/**
 * Binds core lifecycle events from the app's event emitter to the player
 * template. Registers four listeners:
 *
 *   - `initializingmode`            — resets video/viewport rects to zero
 *   - `videoplayerreset`            — syncs video data from the player
 *   - `videodatachange`             — forwards to `template.Qq()`
 *   - `presentingplayerstatechange` — handles native controls, resize,
 *                                     and smart-zoom animation pause/resume
 *
 * All listeners are unregistered on dispose.
 *
 * @param {Object} template  Player template/UI component.
 *   @param {g.zC}   template.Sw  — video container rect  [was: Sw]
 *   @param {g.zC}   template.x5  — video content rect    [was: x5]
 *   @param {boolean} template.vB — video element ref      [was: vB]
 *   @param {Object} template.S5  — visibility flag        [was: S5]
 *   @param {Object} template.YO  — smart-zoom animation   [was: YO]
 *   @param {Object} template.app — application controller
 *
 * [was: Bd7]
 */
export function bindPresenterEvents(template) { // was: Bd7
  const eventEmitter = template.app.ge; // was: c

  const onInitializingMode = () => { // was: W
    template.Sw = new g.zC(0, 0, 0, 0);
    template.x5 = new g.zC(0, 0, 0, 0);
  };

  const onVideoPlayerReset = (player) => { // was: m
    if (player.getVideoData()) {
      template.updateVideoData(player.getVideoData());
    }
  };

  const onVideoDataChange = (playerType, videoData) => { // was: K
    template.onVideoDataChange(playerType, videoData);
  };

  const onPresentingPlayerStateChange = (stateEvent) => { // was: T
    if (template.vB) updateVideoControls(template); // was: hL(Q)
    if (isVideoVisible(template) !== template.buildTimeRangeEntryTrigger) template.resize(); // was: zx(Q) !== Q.S5

    if (template.app.G().X('web_enable_smart_zoom') && template.requestSlotExit) {
      if (stateEvent.state.isPaused()) {
        template.requestSlotExit.pause();
      } else if (stateEvent.Fq(8) && template.requestSlotExit.playState === 'paused') {
        template.requestSlotExit.play();
      }
    }
  };

  eventEmitter.addEventListener('initializingmode', onInitializingMode);
  eventEmitter.addEventListener('videoplayerreset', onVideoPlayerReset);
  eventEmitter.addEventListener('videodatachange', onVideoDataChange);
  eventEmitter.addEventListener('presentingplayerstatechange', onPresentingPlayerStateChange);

  template.addOnDisposeCallback(() => {
    eventEmitter.removeEventListener('initializingmode', onInitializingMode);
    eventEmitter.removeEventListener('videoplayerreset', onVideoPlayerReset);
    eventEmitter.removeEventListener('videodatachange', onVideoDataChange);
    eventEmitter.removeEventListener('presentingplayerstatechange', onPresentingPlayerStateChange);
  });
}

// ---------------------------------------------------------------------------
// Native Controls Toggle  (line 54103)
// ---------------------------------------------------------------------------

/**
 * Toggles native HTML5 video controls based on player configuration.
 *
 * Enables native controls when `controlsType === "3"` (native mode),
 * the template is not in a special mode, the video is visible, and the
 * app is not in embed-controls mode. Also manages focus handling and
 * `ariaHidden` for accessibility.
 *
 * @param {Object} template  Player template/UI component.
 *   @param {HTMLVideoElement} template.vB  — video element   [was: vB]
 *   @param {boolean}         template.Ta  — special mode flag [was: Ta]
 *   @param {Function}        template.oL  — focus handler     [was: oL]
 *   @param {Object}          template.app — application controller
 *
 * [was: hL]
 */
function toggleNativeControls(template) { // was: hL
  const useNativeControls = // was: c
    template.app.G().controlsType === '3' &&
    !template.Ta &&
    isVideoVisible(template) && // was: zx(Q)
    !template.app.Ec;

  template.vB.controls = useNativeControls;
  template.vB.tabIndex = useNativeControls ? 0 : -1;

  if (template.app.G().j) {
    template.vB.ariaHidden = 'true';
  }

  if (useNativeControls) {
    template.vB.removeEventListener('focus', template.parseInstreamVideoAdRenderer);
  } else {
    template.vB.addEventListener('focus', template.parseInstreamVideoAdRenderer);
  }
}

// Keep module-level reference for internal use
const updateVideoControls = toggleNativeControls;

// ---------------------------------------------------------------------------
// Video Aspect Ratio  (line 54111)
// ---------------------------------------------------------------------------

/**
 * Retrieves the native aspect ratio of the currently playing video.
 *
 * Checks for special content types (live, VR, 360) that default to 16:9,
 * and for pre-loaded format info. Falls back to the `<video>` element's
 * `videoWidth / videoHeight` or 16:9 as a last resort.
 *
 * @param {Object} template  Player template/UI component.
 *   @param {HTMLVideoElement} template.vB — video element  [was: vB]
 *   @param {Object}          template.app — application controller
 * @returns {number}  Aspect ratio (width / height).
 *
 * [was: qC0]
 */
export function getVideoAspectRatio(template) { // was: qC0
  let videoData = template.app.oe(); // was: c
  videoData = videoData ? videoData.getVideoData() : null;

  if (videoData) {
    if (isEquirectangular(videoData) || isEquirectangular3D(videoData) || isMeshProjection(videoData)) {
      return 16 / 9;
    }
    if (Ll(videoData) && videoData.A.W()) {
      const video = videoData.A.videoInfos[0].video; // was: Q (reused)
      return normalizeAspectRatio(video.width, video.height); // was: Mm
    }
  }

  const videoElement = template.vB; // was: Q (reused)
  return videoElement
    ? normalizeAspectRatio(videoElement.videoWidth, videoElement.videoHeight)
    : 16 / 9;
}

// ---------------------------------------------------------------------------
// Aspect Ratio Normalisation  (line 54123)
// ---------------------------------------------------------------------------

/**
 * Normalises a pixel width/height pair into an aspect ratio, snapping
 * near-anamorphic values (close to `JL`, the stored anamorphic constant)
 * to exactly `JL`.
 *
 * @param {number} width   Pixel width.   [was: Q]
 * @param {number} height  Pixel height.  [was: c]
 * @returns {number}       Aspect ratio.
 *
 * [was: Mm]
 */
export function normalizeAspectRatio(width, height) { // was: Mm
  return Math.abs(DEFAULT_ASPECT_RATIO * height - width) < 1 ||
    Math.abs(DEFAULT_ASPECT_RATIO / width - height) < 1
    ? DEFAULT_ASPECT_RATIO
    : width / height;
}

// ---------------------------------------------------------------------------
// Constrained Video Size Calculation  (line 54127)
// ---------------------------------------------------------------------------

/**
 * Computes the constrained video display size within the player viewport,
 * respecting the requested aspect ratio, forced aspect modes (letterbox /
 * pillarbox / fill), and the `DcR` experiment flag for minimum coverage.
 *
 * @param {Object} template       Player template/UI component.
 *   @param {boolean} template.J4   — force-fill mode         [was: J4]
 *   @param {number}  template.mL   — forced aspect ratio      [was: mL]
 *   @param {number}  template.hd   — fallback aspect ratio    [was: hd]
 *   @param {Object}  template.app  — application controller
 * @param {Object} containerSize  `{width, height}` of the viewport.        [was: c]
 * @param {number} videoAspect    Native video aspect ratio.                 [was: W]
 * @param {boolean} [skipCorrection]  If true, skip final width/height      [was: m]
 *                                    correction for native mismatch.
 * @returns {{width:number, height:number, aspectRatio:number}}
 *
 * [was: xc7]
 */
export function computeConstrainedVideoSize(template, containerSize, videoAspect, skipCorrection) { // was: xc7
  let targetAspect = videoAspect; // was: K
  const containerAspect = normalizeAspectRatio(containerSize.width, containerSize.height); // was: T

  if (template.BASE64_WEBSAFE_REPLACE) {
    targetAspect = videoAspect < containerAspect ? Infinity : 0;
  } else if (!isNaN(template.mL)) {
    targetAspect = template.mL;
  } else if (!isNaN(template.CONSTRUCTOR_GUARD)) {
    targetAspect = template.CONSTRUCTOR_GUARD;
  }

  if (isFinite(targetAspect)) {
    if (targetAspect === 0 && template.app.G().getExperimentFlags.W.BA(DcR)) {
      targetAspect = Math.min(videoAspect, containerAspect);
    }
  } else {
    targetAspect = Math.max(videoAspect, containerAspect);
  }

  const result = // was: Q (reused)
    targetAspect > containerAspect
      ? {
          width: containerSize.width,
          height: containerSize.width / targetAspect,
          aspectRatio: targetAspect,
        }
      : targetAspect < containerAspect
        ? {
            width: containerSize.height * targetAspect,
            height: containerSize.height,
            aspectRatio: targetAspect,
          }
        : {
            width: containerSize.width,
            height: containerSize.height,
            aspectRatio: containerAspect,
          };

  if (!skipCorrection && !isNaN(videoAspect)) {
    if (videoAspect > targetAspect) {
      result.width = result.height * videoAspect;
    } else if (videoAspect < targetAspect) {
      result.height = result.width / videoAspect;
    }
    result.aspectRatio = videoAspect;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Video Visibility Detection  (line 54150)
// ---------------------------------------------------------------------------

/**
 * Determines whether the video element should be visible in the current
 * app state.
 *
 * Returns `false` when:
 *   - App state is 1 (not yet initialised)
 *   - No presenting player exists, or the player has keyboard focus blocked
 *   - The player state has flag 2 set (unless videoData.J overrides it)
 *   - The player state has flag 1024 set (e.g. remote playback)
 *   - The player is cued but not playing
 *
 * Returns `true` when app state is 6 (fullscreen / special mode).
 *
 * @param {Object} template  Player template/UI component.
 *   @param {Object} template.app — application controller
 * @returns {boolean}
 *
 * [was: zx]
 */
export function isVideoVisible(template) { // was: zx
  if (template.app.getAppState() === 1) return false; // was: !1
  if (template.app.getAppState() === 6) return true;  // was: !0

  const presentingPlayer = template.app.oe(); // was: c
  if (!presentingPlayer || presentingPlayer.KB()) return false;

  const playerState = template.app.ge.getPlayerStateObject(); // was: Q (reused)
  const isActive = !playerState.W(2) || // was: c (reused)
    (presentingPlayer && presentingPlayer.getVideoData().J);
  const isRemote = playerState.W(1024); // was: W

  return playerState && isActive && !isRemote && !playerState.isCued();
}

// Keep module-level alias for internal use
const isVideoVisible = isVideoVisible;

// ---------------------------------------------------------------------------
// Playback State Code  (line 54257)
// ---------------------------------------------------------------------------

/**
 * Computes the external API playback state code for a given player and
 * player type.
 *
 * Handles special cases:
 *   - When a `BI` (background/interactive) player exists, delegates to its state
 *   - For server-stitched DAI type-2 players, checks ad occupancy via `NI.WB()`
 *     or the `Rh` feature flag, returning `j4` or -1
 *   - For non-type-2 players, falls back to `pN` when not in watch mode
 *
 * @param {Object} app       Application controller.
 *   @param {Object}  app.fk    — player container / multi-player state  [was: fk]
 *   @param {Object}  app.FI    — player configuration                    [was: FI]
 *   @param {Object}  app.NI    — DAI manager (nullable)                  [was: NI]
 *   @param {number}  app.j4    — main player state code                  [was: j4]
 *   @param {number}  app.pN    — ad player state code                    [was: pN]
 * @param {number} playerType   Player type enum (1 = main, 2 = ad, etc). [was: c]
 * @returns {number}            External API state code.
 *
 * [was: SCd]
 */
export function getPlaybackStateCode(app, playerType) { // was: SCd
  const backgroundPlayer = app.fk.DEFAULT_STORE_EXPIRATION_TOKEN; // was: W
  if (backgroundPlayer) {
    return getPlayerPhase(backgroundPlayer.getPlayerState());
  }

  if (app.getVideoData().enableServerStitchedDai && playerType === 2) {
    const isAdOccupied = app.FI.getExperimentFlags.W.BA(Rh) // was: inline ternary
      ? (app.fk.W?.isAd() ?? false) // was: Q.fk.W?.isAd() ?? !1
      : app.CssTransitionAnimation?.isInAdPlayback(app.getCurrentTime());
    return isAdOccupied ? app.j4 : -1;
  }

  return playerType !== 2 || app.wX()
    ? app.j4
    : app.pN;
}

// ---------------------------------------------------------------------------
// Muted Autoplay Detection  (line 54262)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the player is in muted-autoplay mode
 * (`Ec` flag set and video data has `mutedAutoplay`).
 *
 * @param {Object} app  Application controller.  [was: Q]
 * @returns {boolean}
 *
 * [was: yS]
 */
export function isMutedAutoplay(app) { // was: yS
  return app.Ec && app.getVideoData().mutedAutoplay;
}

// ---------------------------------------------------------------------------
// Mark Video as Auto-navigated  (line 54266)
// ---------------------------------------------------------------------------

/**
 * When `shouldMark` is truthy, retrieves the player for the given type
 * and, if it is the primary player, sets its `nO` (auto-nav) flag.
 *
 * @param {Object}  app         Application controller.       [was: Q]
 * @param {boolean} shouldMark  Whether to apply the mark.    [was: c]
 * @param {number}  playerType  Player type enum.              [was: W]
 *
 * [was: k$]
 */
export function markAutoNavigated(app, shouldMark, playerType) { // was: k$
  if (shouldMark) {
    const player = app.uX({ playerType }); // was: c (reused)
    if (player === app.timedInvoke()) {
      player.getVideoData().nO = true; // was: !0
    }
  }
}

// ---------------------------------------------------------------------------
// Application-Level Seek  (line 54273)
// ---------------------------------------------------------------------------

/**
 * Performs an application-level seek on the specified player type.
 *
 * Handles special cases:
 *   - Background/interactive player delegates to its own `seekTo`
 *   - Clears the loop range if seeking outside it
 *   - Supports optional `allowImprecise`, `seekSource`, and `playerType` params
 *
 * @param {Object}  app           Application controller.                 [was: Q]
 * @param {number}  targetTime    Seek target in seconds.                  [was: c]
 * @param {boolean} [precise=true]  If false, allow imprecise seek.        [was: W]
 * @param {*}       [seekHint]      Extra seek metadata.                   [was: m]
 * @param {number}  [playerType]    Player type enum.                      [was: K]
 * @param {number}  [seekSource]    Seek source identifier.                [was: T]
 *
 * [was: Y$]
 */
export function seekApplication(app, targetTime, precise = true, seekHint, playerType, seekSource) { // was: Y$
  const player = app.uX({ playerType }); // was: r
  const videoData = player.getVideoData(); // was: U

  if (
    player.getPlayerType() === 2 &&
    !app.wX(player) &&
    !videoData.isSeekable
  ) return;

  if (g.pl(videoData)) return;

  const backgroundPlayer = app.fk.DEFAULT_STORE_EXPIRATION_TOKEN; // was: U (reused)
  if (backgroundPlayer) {
    backgroundPlayer.seekTo(targetTime, {
      b_: !precise,   // was: !W
      GM: seekHint,    // was: m
      Z7: 'application',
      seekSource,      // was: T
    });
  } else {
    if (player && player === app.timedInvoke() && app.captureBandwidthSnapshot && !isWithinLoopRange(app, targetTime)) {
      app.setLoopRange(null);
    }
    app.seekTo(targetTime, precise, seekHint, playerType, seekSource, '_request');
  }
}

// ---------------------------------------------------------------------------
// Playback Ended — Autonav Check  (line 54697)
// ---------------------------------------------------------------------------

/**
 * Checks whether automatic navigation to the next video should occur
 * when playback ends.
 *
 * Returns `true` (and advances the playlist) when:
 *   - A playlist is active
 *   - The player config allows background audio playback or is embed-enabled
 *   - The player reports `Rv()` (ready to advance)
 *
 * @param {Object} app  Application controller.  [was: Q]
 * @returns {boolean}    True if autonav was triggered.
 *
 * [was: h2m]
 */
export function tryAutonavOnEnd(app) { // was: h2m
  if (
    app.playlist &&
    (isEmbedded(app.FI) || app.FI.isSamsungSmartTV === 'background_audio_playback') &&
    app.Rv()
  ) {
    const shouldLog = app.FI.X('html5_player_autonav_logging'); // was: c
    app.nextVideo(false, shouldLog); // was: !1
    return true; // was: !0
  }
  return false; // was: !1
}

// ---------------------------------------------------------------------------
// Playback End State Dispatch  (line 54687)
// ---------------------------------------------------------------------------

/**
 * Handles the player reaching the end of playback.
 *
 * If autonav applies, advances the playlist. Otherwise, yields back the
 * presenting player and dispatches the new external state code.
 *
 * @param {Object} app  Application controller.  [was: Q]
 *
 * [was: z2_]
 */
export function handlePlaybackEnded(app) { // was: z2_
  if (!tryAutonavOnEnd(app)) {
    const presentingPlayer = app.timedInvoke().Yx(); // was: c
    if (presentingPlayer) {
      const promise = presentingPlayer.S(); // was: c (reused)
      if (promise instanceof Promise) {
        promise.catch(() => {});
      }
    }
    dispatchExternalStateChange(app, getPlayerPhase(app.getPlayerStateObject())); // was: yw(Q, q5(...))
  }
}

// ---------------------------------------------------------------------------
// External State Change Dispatch  (line 54706)
// ---------------------------------------------------------------------------

/**
 * Fires the appropriate external API state-change event.
 *
 * For the main player (type !== 2), emits `onStateChange`.
 * For the ad player (type === 2), emits `onAdStateChange`.
 *
 * Suppresses duplicate dispatches by comparing with the stored state
 * codes (`j4` for main, `pN` for ad). Also suppresses certain terminal
 * codes (0, -1, 5) when the presenting player is an auxiliary type
 * (5, 6, 7) or a watch-mode ad.
 *
 * Special handling for state 0 (ended):
 *   - If a loop range is set, state 0 is swallowed
 *   - If in mE() mode on an API player, `playVideo()` is called instead
 *
 * @param {Object} app        Application controller.     [was: Q]
 * @param {number} stateCode  External API state code.     [was: c]
 *
 * [was: yw]
 */
export function dispatchExternalStateChange(app, stateCode) { // was: yw
  const presentingPlayer = app.oe(); // was: W
  const playerType = presentingPlayer.getPlayerType(); // was: m

  if (playerType !== 2 || app.wX()) {
    // Main player or watch-mode ad
    if (playerType === 2 && app.wX() ||
        playerType === 5 || playerType === 6 || playerType === 7) {
      if (stateCode === -1 || stateCode === 0 || stateCode === 5) return;
    }

    if (stateCode === 0) {
      if (app.captureBandwidthSnapshot) return; // loop range active — swallow ended state
      if (presentingPlayer.isLooping && isTvHtml5(app.FI)) {
        app.playVideo();
        return;
      }
    }

    if (app.j4 !== stateCode) {
      app.j4 = stateCode;
      publishEventAll(app.ge, 'onStateChange', stateCode);
    }
  } else {
    // Ad player
    if (app.pN !== stateCode) {
      app.pN = stateCode;
      publishEventAll(app.ge, 'onAdStateChange', stateCode);
    }
  }
}

// ---------------------------------------------------------------------------
// Server-Stitched DAI State  (line 55007)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the current video uses server-stitched DAI and a
 * DAI manager (`NI`) is active.
 *
 * @param {Object} app  Application controller.  [was: Q]
 * @returns {boolean}
 *
 * [was: wW]
 */
export function isServerStitchedDai(app) { // was: wW
  return app.getVideoData().enableServerStitchedDai && !!app.CssTransitionAnimation;
}

// ---------------------------------------------------------------------------
// DAI Duration Adjustment  (line 54983)
// ---------------------------------------------------------------------------

/**
 * Adjusts a raw duration value to account for child-playback segments
 * in server-stitched DAI mode.
 *
 * When DAI is **not** active, returns `rawDuration` unchanged.
 * When DAI **is** active, walks the timeline manager's ordered list of
 * child playback entries and accumulates their time offsets to compute
 * the adjusted timeline position.
 *
 * @param {Object} app          Application controller.          [was: Q]
 * @param {number} rawDuration  Un-adjusted duration in seconds. [was: c]
 * @param {Object} player       The presenting player instance.  [was: W]
 * @returns {number}            Adjusted duration in seconds.
 *
 * [was: Qw]
 */
export function adjustDaiDuration(app, rawDuration, player) { // was: Qw
  if (app.wX(player) && (player = player.getVideoData(), !isServerStitchedDai(app))) {
    const timeline = app.Z1; // was: Q (reused)

    for (const entry of timeline.O) { // was: m
      if (player.PJ === entry.PJ) {
        rawDuration += entry.CX / 1000; // was: c += m.CX / 1E3
        break;
      }
    }

    let adjusted = rawDuration; // was: m (reused)
    for (const entry of timeline.O) { // was: K
      if (player.PJ === entry.PJ) break;

      const enterOffset = entry.CX / 1000; // was: Q (reused)
      if (enterOffset < rawDuration) {
        adjusted += entry.durationMs / 1000 + enterOffset - entry.yz / 1000;
      } else {
        break;
      }
    }

    return adjusted;
  }

  return rawDuration;
}

// ---------------------------------------------------------------------------
// Endscreen Teardown  (line 55011)
// ---------------------------------------------------------------------------

/**
 * Destroys the endscreen module if it exists and has been created.
 *
 * @param {Object} app  Application controller.  [was: Q]
 *
 * [was: tw]
 */
export function teardownEndscreen(app) { // was: tw
  const endscreen = getAdModule(app.CO()); // was: Q (reused)
  if (endscreen && endscreen.created) {
    endscreen.destroy();
  }
}

// ---------------------------------------------------------------------------
// Multi-Player Presenter State  (line 56005)
// ---------------------------------------------------------------------------

/**
 * Retrieves ad-specific video data via the presenter's `Pf()` mapping
 * for the given player type.
 *
 * @param {Object} presenterState  Presenter state manager.  [was: Q]
 *   @param {Object} presenterState.U — player API reference  [was: U]
 * @param {number} playerType       Player type enum.         [was: c]
 * @returns {Object|null}           Mapped video data, or null.
 *
 * [was: mX]
 */
export function getPresenterVideoData(presenterState, playerType) { // was: mX
  const videoData = presenterState.U.getVideoData({ playerType }); // was: W
  return videoData
    ? presenterState.Pf(videoData, playerType || presenterState.U.getPresentingPlayerType(true)) // was: !0
    : null;
}

// ---------------------------------------------------------------------------
// Presenter Update  (line 56012)
// ---------------------------------------------------------------------------

/**
 * Updates the presenter's active video-data snapshot and notifies all
 * registered listeners via `wE()`.
 *
 * @param {Object} presenterState  Presenter state manager.    [was: Q]
 *   @param {Array}  presenterState.listeners — listener list  [was: listeners]
 *   @param {Object} presenterState.oY        — current snapshot [was: oY]
 * @param {Object} videoData       Raw video data.              [was: c]
 * @param {number} playerType      Player type enum.            [was: W]
 *
 * [was: RE]
 */
export function updatePresenterState(presenterState, videoData, playerType) { // was: RE
  const mapped = presenterState.Pf(videoData, playerType); // was: m
  presenterState.enqueueCallback = mapped;

  presenterState.listeners.forEach((listener) => { // was: K
    listener.CaptionWindowCue(mapped);
  });
}
