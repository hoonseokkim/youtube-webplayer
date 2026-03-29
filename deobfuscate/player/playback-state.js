import { publishEvent, publishEventAll } from '../ads/ad-click-tracking.js';
import { storageGet, storageSet } from '../core/attestation.js';
import { wrapWithErrorReporter } from '../core/dom-listener.js';
import { attachVisualElement, getClientScreenNonce, getRootVisualElement } from '../data/gel-params.js';
import { isTvHtml5 } from '../data/performance-profiling.js';
import { DcR, McW, Rh } from '../data/session-storage.js';
import { onVideoDataChange } from './player-events.js'; // was: Qq
import { buildTimeRangeEntryTrigger } from '../ads/slot-id-generator.js'; // was: S5
import { requestSlotExit } from '../network/uri-utils.js'; // was: YO
import { globalEventBuffer } from '../data/module-init.js'; // was: rM
import { computeVideoFitSize } from './playback-state.js'; // was: xc7
import { isWindowsPhoneOrIEMobile } from '../core/composition-helpers.js'; // was: vJW
import { getNativeVideoAspectRatio } from './playback-state.js'; // was: qC0
import { updateNextVideoButton } from '../ui/progress-bar-impl.js'; // was: YZ
import { parseInstreamVideoAdRenderer } from '../ads/companion-layout.js'; // was: oL
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { DEFAULT_ASPECT_RATIO } from '../data/idb-operations.js'; // was: JL
import { BASE64_WEBSAFE_REPLACE } from '../proto/messages-core.js'; // was: J4
import { CONSTRUCTOR_GUARD } from '../proto/messages-core.js'; // was: hd
import { getExperimentFlags } from './time-tracking.js'; // was: Ty()
import { graftVisualElement } from '../ads/ad-async.js'; // was: k7
import { getClientFacingManager } from '../ads/ad-async.js'; // was: Mr
import { SlotIdFulfilledEmptyTrigger } from '../ads/ad-trigger-types.js'; // was: Zg
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { tryAsync } from '../ads/ad-async.js'; // was: bi
import { DEFAULT_STORE_EXPIRATION_TOKEN } from '../network/innertube-config.js'; // was: BI
import { getPlayerPhase } from '../media/source-buffer.js'; // was: q5
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { CssTransitionAnimation } from '../core/bitstream-helpers.js'; // was: NI
import { timedInvoke } from '../core/event-registration.js'; // was: pO
import { captureBandwidthSnapshot } from '../ads/ad-prebuffer.js'; // was: x$
import { isWithinLoopRange } from './playback-state.js'; // was: FMO
import { adjustDaiDuration } from './playback-mode.js'; // was: Qw
import { MARKER_TYPES } from '../ui/cue-manager.js'; // was: Z6
import { PlaylistData } from './module-setup.js'; // was: LMO
import { PerformanceTimer } from './module-setup.js'; // was: CG7
import { getLastRangeEnd } from '../media/codec-helpers.js'; // was: Ml
import { isLooping } from './time-tracking.js'; // was: mE()
import { updateVideoData } from '../features/autoplay.js';
import { getVideoAspectRatio } from './playback-mode.js';
import { getPlayerSize, getCurrentTime } from './time-tracking.js';
import { toggleClass, setSize, setPosition, setStyle } from '../core/dom-utils.js';
import { isWebUnplugged, isWebRemix } from '../data/performance-profiling.js';
import { getAppState } from './player-api.js';
import { getExperimentBoolean, getVisibilityState } from '../core/composition-helpers.js';
import { sendRequest } from '../data/idb-transactions.js';
import { getPlayerState } from './playback-bridge.js';
import { seekTo } from '../ads/dai-cue-range.js';
import { setLoopRange } from '../ui/seek-bar-tail.js';
import { clamp } from '../core/math-utils.js';
import { CueRange } from '../ui/cue-range.js';
import { safeDispose } from '../core/event-system.js';
import { VideoPlayer } from '../media/manifest-tail.js';
import { playVideo } from './player-events.js';
import { isBrowserVersionAtLeast } from '../data/device-context.js';
import { logVisualElementShown } from '../data/visual-element-tracking.js';
import { isChrome, isIOS, isSafari } from '../core/browser-detection.js'; // was: g.Am, g.LD, g.v8
import { isEquirectangular, isEquirectangular3D, isMeshProjection } from './video-data-helpers.js'; // was: g.ct, g.Wt, g.mO
// TODO: resolve g.Ff
// TODO: resolve g.pl
// TODO: resolve g.qa
// TODO: resolve g.rU
// TODO: resolve g.zC
// TODO: resolve g.zY

/**
 * Playback State — playback mode state machine internals, player state
 * transitions and flags, video data update pipeline, template layout,
 * and media element lifecycle.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: 54018–54999
 *
 * Key subsystems:
 *   - Video container layout (Bd7, ngK, hL, qC0, Mm, xc7, zx)
 *     Manages the video element's position, size, aspect-ratio fitting,
 *     and visibility within the player template.
 *   - Visual element CSN tracking (tcy) — cross-session navigation
 *     grafting for client-side VEs.
 *   - Worker-based processing (HvR, Ndm, ivR, ygO) — web worker
 *     construction, crypto random fill, and periodic request dispatch.
 *   - Player state helpers (SCd, yS, k$)
 *     Derives the external player state code and handles muted-autoplay.
 *   - Seek and time operations (Y$, ci, KH, Tc, ZvK, Eg7, si0)
 *     Volume persistence, cue-range creation, seek dispatch.
 *   - Playlist management (dc7, oE, UH, Aw, wCy, jid, ggR)
 *     Autoplay state, playlist construction, module URL resolution.
 *   - Video initialization pipeline (Ovn, vgO, GM7, $cw, Xf, fln)
 *     Creates playback modes, initializes media elements, wires events.
 *   - Video reload (Hi, ll0, ek, rW, ukK, iY, z2_, h2m, yw, Sk)
 *     Handles reload, error-forwarding, PiP events, state publication.
 *   - Playback mode creation (createPlaybackMode, pt, ZX, EH, JgO, Nz, mq)
 *   - Autoplay / startup (xS, Vw, Bi, qz, alw, nH, Wi, IE)
 *   - Loop-range logic (R2O, FMO, kM_, YCO, Qw)
 *     Shorts loop, clip loop, chapter repeat.
 *
 * [was: Bd7, ngK, hL, qC0, Mm, xc7, zx, tcy, HvR, Ndm, ivR, ygO,
 *  SCd, yS, k$, Y$, ci, KH, Tc, ZvK, Eg7, si0, dc7, oE, UH, Aw,
 *  wCy, jid, ggR, Ovn, vgO, GM7, $cw, Xf, fln, Hi, ll0, ek, rW,
 *  ukK, iY, z2_, h2m, yw, Sk, createPlaybackMode, pt, ZX, EH, JgO, Nz, mq,
 *  xS, Vw, Bi, qz, alw, nH, Wi, IE, R2O, FMO, kM_, YCO, Qw]
 */

// ---------------------------------------------------------------------------
// Template event bindings  (line 54020)
// ---------------------------------------------------------------------------

/**
 * Binds template-level event listeners to the app event bus: initializing
 * mode, video player reset, video data change, and presenting player
 * state change.
 *
 * @param {Object} template  Player template instance.  [was: Q]
 *
 * [was: Bd7]
 */
export function bindTemplateEvents(template) { // was: Bd7
  const bus = template.app.ge; // was: c

  const onInit = () => { // was: W
    template.Sw = new g.zC(0, 0, 0, 0);
    template.x5 = new g.zC(0, 0, 0, 0);
  };

  const onVideoReset = (playbackMode) => { // was: m, r
    if (playbackMode.getVideoData()) template.updateVideoData(playbackMode.getVideoData());
  };

  const onVideoDataChange = (videoData, playerType) => { // was: K, r, U
    template.onVideoDataChange(videoData, playerType);
  };

  const onStateChange = (stateEvt) => { // was: T, r
    if (template.vB) updateVideoControls(template); // was: hL
    if (isVideoVisible(template) !== template.buildTimeRangeEntryTrigger) template.resize();
    if (template.app.G().X("web_enable_smart_zoom") && template.requestSlotExit) {
      if (stateEvt.state.isPaused()) {
        template.requestSlotExit.pause();
      } else if (stateEvt.Fq(8) && template.requestSlotExit.playState === "paused") {
        template.requestSlotExit.play();
      }
    }
  };

  bus.addEventListener("initializingmode", onInit);
  bus.addEventListener("videoplayerreset", onVideoReset);
  bus.addEventListener("videodatachange", onVideoDataChange);
  bus.addEventListener("presentingplayerstatechange", onStateChange);

  template.addOnDisposeCallback(() => {
    bus.removeEventListener("initializingmode", onInit);
    bus.removeEventListener("videoplayerreset", onVideoReset);
    bus.removeEventListener("videodatachange", onVideoDataChange);
    bus.removeEventListener("presentingplayerstatechange", onStateChange);
  });
}

// ---------------------------------------------------------------------------
// Video container layout  (line 54051)
// ---------------------------------------------------------------------------

/**
 * Computes and applies the video element's position, size, and transform
 * within the player container, accounting for aspect ratio, underlay mode,
 * cover-fit logic, and PiP state.
 *
 * @param {Object} template  Player template instance.  [was: Q]
 * @returns {boolean}        Whether the layout changed.
 *
 * [was: ngK]
 */
export function layoutVideoContainer(template) { // was: ngK
  let containerSize = template.globalEventBuffer(); // was: c
  let scaleX = 1; // was: W
  let changed = false; // was: m  // was: !1
  const videoSize = computeVideoFitSize(template, containerSize, template.getVideoAspectRatio()); // was: K
  const config = template.app.G(); // was: T
  const isUnderlayEnabled = config.X("enable_desktop_player_underlay"); // was: r
  const isVjw = isWindowsPhoneOrIEMobile(); // was: U
  let underlayThreshold = getExperimentValue(config.experiments, "player_underlay_min_player_width"); // was: I
  const isUnderlayActive = isUnderlayEnabled && template.Ju && template.getPlayerSize().width > underlayThreshold; // was: I (reused)

  let videoRect; // was: A
  if (isVideoVisible(template)) {
    let nativeAspect = getNativeVideoAspectRatio(template); // was: X
    let useNativeSize = isNaN(nativeAspect) || g.rU || (Ul && isSafari()) || isUnderlayActive; // was: A (reused)
    if (ou && !isBrowserVersionAtLeast(601)) {
      nativeAspect = videoSize.aspectRatio;
    } else {
      useNativeSize = useNativeSize || config.controlsType === "3";
    }

    if (useNativeSize) {
      if (isUnderlayActive) {
        const left = config.X("place_shrunken_video_on_left_of_player") ? 16 : template.getPlayerSize().width - containerSize.width - 16;
        const top = Math.max((template.getPlayerSize().height - containerSize.height) / 2, 0);
        videoRect = new g.zC(left, top, containerSize.width, containerSize.height);
        template.vB.style.setProperty("border-radius", "12px");
      } else {
        videoRect = new g.zC(0, 0, containerSize.width, containerSize.height);
      }
    } else {
      scaleX = videoSize.aspectRatio / nativeAspect;
      videoRect = new g.zC(
        (containerSize.width - videoSize.width / scaleX) / 2,
        (containerSize.height - videoSize.height) / 2,
        videoSize.width / scaleX,
        videoSize.height
      );
      if (scaleX === 1 && isSafari()) {
        const extra = videoRect.width - containerSize.height * nativeAspect;
        if (extra > 0) {
          videoRect.width += extra;
          videoRect.height += extra;
        }
      }
    }

    toggleClass(template.element, "ytp-fit-cover-video", Math.max(videoRect.width - videoSize.width, videoRect.height - videoSize.height) < 1);
    if (isVjw || template.updateNextVideoButton) template.vB.style.display = "";
    template.buildTimeRangeEntryTrigger = true;
  } else {
    let offsetY = -containerSize.height; // was: A (reused)
    if (ou) offsetY *= window.devicePixelRatio;
    else if (isIOS()) offsetY -= window.screen.height;
    videoRect = new g.zC(0, offsetY, containerSize.width, containerSize.height);
    if (isVjw || template.updateNextVideoButton) template.vB.style.display = "none";
    template.buildTimeRangeEntryTrigger = false;
  }

  if (!Cs(template.Sw, videoRect)) {
    template.Sw = videoRect;
    if (isWebUnplugged(config)) {
      template.vB.style.setProperty("width", videoRect.width + "px", "important");
      template.vB.style.setProperty("height", videoRect.height + "px", "important");
    } else {
      setSize(template.vB, videoRect.getSize());
    }
    const pos = new g.zY(videoRect.left, videoRect.top); // was: m (reused)
    setPosition(template.vB, Math.round(pos.x), Math.round(pos.y));
    changed = true;
  }

  const fitRect = new g.zC(
    (containerSize.width - videoSize.width) / 2,
    (containerSize.height - videoSize.height) / 2,
    videoSize.width,
    videoSize.height
  );
  if (!Cs(template.x5, fitRect)) {
    template.x5 = fitRect;
    changed = true;
  }

  setStyle(template.vB, "transform", scaleX === 1 ? "" : `scaleX(${scaleX})`);

  // Underlay transition handling
  if (isUnderlayEnabled && isUnderlayActive !== template.vy) {
    if (isUnderlayActive) {
      template.vB.addEventListener(Ct, template.Uy);
      template.vB.addEventListener("transitioncancel", template.Uy);
      template.vB.classList.add(g.qa.VIDEO_CONTAINER_TRANSITIONING);
    }
    template.vy = isUnderlayActive;
    template.app.ge.publish("playerUnderlayVisibilityChange", template.vy ? "transitioning" : "hidden");
  }

  return changed;
}

/**
 * Updates the native video element's controls and tabIndex based on
 * player state and configuration.
 *
 * @param {Object} template  Player template instance.  [was: Q]
 *
 * [was: hL]
 */
export function updateVideoControls(template) { // was: hL
  const useNativeControls = template.app.G().controlsType === "3" && !template.Ta && isVideoVisible(template) && !template.app.Ec || false;
  template.vB.controls = useNativeControls;
  template.vB.tabIndex = useNativeControls ? 0 : -1;
  if (template.app.G().j) template.vB.ariaHidden = "true";
  useNativeControls ? template.vB.removeEventListener("focus", template.parseInstreamVideoAdRenderer)
    : template.vB.addEventListener("focus", template.parseInstreamVideoAdRenderer);
}

/**
 * Computes the native video aspect ratio, falling back to 16:9 for
 * live, spherical, or audio-only content.
 *
 * @param {Object} template  Player template instance.  [was: Q]
 * @returns {number}         Aspect ratio (width / height).
 *
 * [was: qC0]
 */
export function getNativeVideoAspectRatio(template) { // was: qC0
  const playback = template.app.oe(); // was: c
  const videoData = playback ? playback.getVideoData() : null;
  if (videoData) {
    if (isEquirectangular(videoData) || isEquirectangular3D(videoData) || isMeshProjection(videoData)) return 16 / 9;
    if (Ll(videoData) && videoData.A.W()) {
      const videoInfo = videoData.A.videoInfos[0].video;
      return normalizeAspectRatio(videoInfo.width, videoInfo.height); // was: Mm
    }
  }
  const createDatabaseDefinition = template.vB;
  return createDatabaseDefinition ? normalizeAspectRatio(createDatabaseDefinition.videoWidth, createDatabaseDefinition.videoHeight) : 16 / 9;
}

/**
 * Normalizes an aspect ratio, snapping near-anamorphic values to the
 * exact anamorphic constant (JL).
 *
 * @param {number} width   Width in pixels.   [was: Q]
 * @param {number} height  Height in pixels.  [was: c]
 * @returns {number}       Normalized aspect ratio.
 *
 * [was: Mm]
 */
export function normalizeAspectRatio(width, height) { // was: Mm
  return Math.abs(DEFAULT_ASPECT_RATIO * height - width) < 1 || Math.abs(DEFAULT_ASPECT_RATIO / width - height) < 1
    ? DEFAULT_ASPECT_RATIO : width / height;
}

/**
 * Computes the visible video rectangle within the player container,
 * accounting for forced aspect ratios (letterboxing/pillarboxing).
 *
 * @param {Object}  template     Player template.           [was: Q]
 * @param {Object}  containerSize Container {width, height}. [was: c]
 * @param {number}  aspectRatio  Target aspect ratio.        [was: W]
 * @param {boolean} [skipNaturalFit] Whether to skip natural fit. [was: m]
 * @returns {{width: number, height: number, aspectRatio: number}}
 *
 * [was: xc7]
 */
export function computeVideoFitSize(template, containerSize, aspectRatio, skipNaturalFit) { // was: xc7
  let targetAR = aspectRatio; // was: K
  const containerAR = normalizeAspectRatio(containerSize.width, containerSize.height); // was: T

  if (template.BASE64_WEBSAFE_REPLACE) {
    targetAR = aspectRatio < containerAR ? Infinity : 0;
  } else if (!isNaN(template.mL)) {
    targetAR = template.mL;
  } else if (!isNaN(template.CONSTRUCTOR_GUARD)) {
    targetAR = template.CONSTRUCTOR_GUARD;
  }

  if (!isFinite(targetAR)) {
    targetAR = Math.max(aspectRatio, containerAR);
  } else if (targetAR === 0 && template.app.G().getExperimentFlags.W.BA(DcR)) {
    targetAR = Math.min(aspectRatio, containerAR);
  }

  let result;
  if (targetAR > containerAR) {
    result = { width: containerSize.width, height: containerSize.width / targetAR, aspectRatio: targetAR };
  } else if (targetAR < containerAR) {
    result = { width: containerSize.height * targetAR, height: containerSize.height, aspectRatio: targetAR };
  } else {
    result = { width: containerSize.width, height: containerSize.height, aspectRatio: containerAR };
  }

  if (!skipNaturalFit && !isNaN(aspectRatio)) {
    if (aspectRatio > targetAR) {
      result.width = result.height * aspectRatio;
    } else if (aspectRatio < targetAR) {
      result.height = result.width / aspectRatio;
    }
    result.aspectRatio = aspectRatio;
  }

  return result;
}

/**
 * Returns whether the video element should be visible.
 *
 * @param {Object} template  Player template instance.  [was: Q]
 * @returns {boolean}
 *
 * [was: zx]
 */
export function isVideoVisible(template) { // was: zx
  if (template.app.getAppState() === 1) return false;
  if (template.app.getAppState() === 6) return true;
  const playback = template.app.oe();
  if (!playback || playback.KB()) return false;
  const state = template.app.ge.getPlayerStateObject();
  const isReady = !state.W(2) || (playback && playback.getVideoData().J);
  const isBuffering = state.W(1024);
  return state && isReady && !isBuffering && !state.isCued();
}

// ---------------------------------------------------------------------------
// Visual element CSN tracking  (line 54164)
// ---------------------------------------------------------------------------

/**
 * Updates visual-element cross-session-navigation (CSN) references when
 * the active CSN changes. Re-grafts client VEs to the new CSN.
 *
 * @param {Object} veTracker  VE tracking context.  [was: Q]
 *
 * [was: tcy]
 */
export function updateVisualElementCSN(veTracker) { // was: tcy
  if (veTracker.csn === getClientScreenNonce()) return;
  if (veTracker.csn === "UNDEFINED_CSN") {
    veTracker.csn = getClientScreenNonce();
    return;
  }
  const newCsn = getClientScreenNonce(); // was: c
  const rootVe = getRootVisualElement(); // was: W
  if (newCsn && rootVe) {
    veTracker.csn = newCsn;
    for (const elem of veTracker.elements) {
      const ve = elem.visualElement; // was: K
      if (ve && ve.isClientVe() && newCsn && rootVe) {
        getExperimentBoolean("combine_ve_grafts")
          ? graftVisualElement(getClientFacingManager(), ve, rootVe)
          : wrapWithErrorReporter(attachVisualElement)(undefined, newCsn, rootVe, ve); // was: void 0
      }
    }
  }
  if (newCsn) {
    for (const elem of veTracker.W) {
      const ve = elem.visualElement;
      if (ve && ve.isClientVe()) logVisualElementShown(newCsn, ve);
    }
  }
}

// ---------------------------------------------------------------------------
// Worker-based processing  (line 54184)
// ---------------------------------------------------------------------------

/**
 * Initializes the web worker, waiting for its first message to confirm
 * successful creation.
 *
 * @param {Object} workerHost  Worker host component.  [was: Q]
 *
 * [was: HvR]
 */
export async function initWorker(workerHost) { // was: HvR
  if (workerHost.SlotIdFulfilledEmptyTrigger) return;
  workerHost.SlotIdFulfilledEmptyTrigger = workerHost.isSamsungSmartTV(workerHost.S);
  try {
    const { promise, resolve, reject } = Promise.withResolvers(); // was: W
    const timer = setTimeout(() => reject("timeout"), 10000); // was: c  // was: 1E4
    workerHost.SlotIdFulfilledEmptyTrigger.onerror = () => reject("error");
    workerHost.SlotIdFulfilledEmptyTrigger.onmessage = () => {
      resolve();
      clearTimeout(timer);
    };
    await promise;
    workerHost.SlotIdFulfilledEmptyTrigger.onmessage = null;
    workerHost.SlotIdFulfilledEmptyTrigger.onerror = null;
    workerHost.SlotIdFulfilledEmptyTrigger.addEventListener("message", (msg) => void workerHost.receive(msg));
    workerHost.RetryTimer("workerCtor", {});
  } catch (err) {
    clearTimeout(timer);
    workerHost.SlotIdFulfilledEmptyTrigger?.terminate();
    workerHost.SlotIdFulfilledEmptyTrigger.onmessage = null;
    workerHost.SlotIdFulfilledEmptyTrigger.onerror = null;
    workerHost.SlotIdFulfilledEmptyTrigger = undefined; // was: void 0
    workerHost.RetryTimer("workerErr", { e: `${err}` });
  }
}

/**
 * Creates or reuses a buffer of cryptographically random bytes.
 *
 * @param {Object} workerHost  Worker host component.  [was: Q]
 * @param {number} byteLength  Desired byte count.     [was: c]
 * @returns {Uint8Array}
 *
 * [was: Ndm]
 */
export function getOrCreateRandomBuffer(workerHost, byteLength) { // was: Ndm
  if (workerHost.W && workerHost.W.byteLength === byteLength) return workerHost.W;
  const buffer = new Uint8Array(byteLength); // was: W
  let offset = 0; // was: m
  while (byteLength > 0) {
    const chunk = new Uint8Array(Math.min(byteLength, 65536)); // was: K
    crypto.getRandomValues(chunk);
    buffer.set(chunk, offset);
    byteLength -= chunk.length;
    offset += chunk.length;
  }
  return workerHost.W = buffer;
}

/**
 * Sends a timing request to the worker with random payload.
 *
 * @param {Object} workerHost  Worker host component.  [was: Q]
 * @param {number} byteLength  Payload size.           [was: c]
 *
 * [was: ivR]
 */
export function sendWorkerTimingRequest(workerHost, byteLength) { // was: ivR
  if (!workerHost.SlotIdFulfilledEmptyTrigger) return;
  const buf = getOrCreateRandomBuffer(workerHost, byteLength);
  if (buf.length > 0) buf[0]++;
  const request = {
    [0]: 0,
    [1]: performance.now(),
    [2]: buf
  };
  workerHost.request(request);
}

/**
 * Starts periodic worker requests (if the worker was successfully
 * constructed).
 *
 * @param {Object} workerHost  Worker host component.  [was: Q]
 *
 * [was: ygO]
 */
export async function startPeriodicWorkerRequests(workerHost) { // was: ygO
  if (workerHost.O !== undefined || workerHost.A) return; // was: void 0
  workerHost.A = true;
  await initWorker(workerHost);
  workerHost.A = false;
  if (workerHost.SlotIdFulfilledEmptyTrigger) {
    sendWorkerTimingRequest(workerHost, workerHost.Y);
    workerHost.O = setInterval(() => workerHost.sendRequest(), workerHost.intervalMs);
  }
}

// ---------------------------------------------------------------------------
// Player state derivation  (line 54257)
// ---------------------------------------------------------------------------

/**
 * Derives the external player state code from the internal playback state.
 *
 * @param {Object} app         Application instance.    [was: Q]
 * @param {number} playerType  Presenting player type.  [was: c]
 * @returns {number}           External state code (-1, 0, 1, 2, 3, 5).
 *
 * [was: SCd]
 */
export function deriveExternalPlayerState(app, playerType) { // was: SCd
  const tryAsync = app.fk.DEFAULT_STORE_EXPIRATION_TOKEN;
  if (tryAsync) return getPlayerPhase(tryAsync.getPlayerState());
  if (app.getVideoData().enableServerStitchedDai && playerType === 2) {
    const isAd = app.FI.getExperimentFlags.W.BA(Rh)
      ? (app.fk.W?.isAd() ?? false) // was: !1
      : app.CssTransitionAnimation?.isInAdPlayback(app.getCurrentTime());
    return isAd ? app.j4 : -1;
  }
  return playerType !== 2 || app.wX() ? app.j4 : app.pN;
}

/**
 * Returns whether the player is in muted-autoplay state.
 *
 * @param {Object} app  Application instance.  [was: Q]
 * @returns {boolean}
 *
 * [was: yS]
 */
export function isMutedAutoplay(app) { // was: yS
  return app.Ec && app.getVideoData().mutedAutoplay;
}

/**
 * Marks a playback mode as having been autoplayed (nO flag).
 *
 * @param {Object} app        Application instance.  [was: Q]
 * @param {boolean} autoplay  Whether auto-played.    [was: c]
 * @param {number} playerType Player type.            [was: W]
 *
 * [was: k$]
 */
export function markAutoplayFlag(app, autoplay, playerType) { // was: k$
  if (!autoplay) return;
  const playback = app.uX({ playerType }); // was: c (reused)
  if (playback === app.timedInvoke()) playback.getVideoData().nO = true; // was: !0
}

// ---------------------------------------------------------------------------
// Seek dispatch  (line 54273)
// ---------------------------------------------------------------------------

/**
 * Dispatches a seek to the given time, delegating to the appropriate
 * playback mode and handling loop-range clearing.
 *
 * @param {Object}  app          Application instance.       [was: Q]
 * @param {number}  time         Target time in seconds.      [was: c]
 * @param {boolean} [smooth=true] Whether to use smooth seek.  [was: W]
 * @param {number}  [method]     Seek method enum.            [was: m]
 * @param {number}  [playerType] Target player type.          [was: K]
 * @param {number}  [seekSource] Seek source identifier.      [was: T]
 *
 * [was: Y$]
 */
export function dispatchSeek(app, time, smooth = true, method, playerType, seekSource) { // was: Y$  // was: !0
  const playback = app.uX({ playerType }); // was: r
  const videoData = playback.getVideoData(); // was: U
  if (playback.getPlayerType() === 2 && !app.wX(playback) && !videoData.isSeekable) return;
  if (g.pl(videoData)) return;

  const tryAsync = app.fk.DEFAULT_STORE_EXPIRATION_TOKEN; // was: U (reused)
  if (tryAsync) {
    tryAsync.seekTo(time, {
      b_: !smooth,
      GM: method,
      Z7: "application",
      seekSource
    });
  } else {
    if (playback && playback === app.timedInvoke() && app.captureBandwidthSnapshot && !isWithinLoopRange(app, time)) {
      app.setLoopRange(null);
    }
    app.seekTo(time, smooth, method, playerType, seekSource, "_request");
  }
}

/**
 * Returns the clipped duration for the given player type.
 *
 * @param {Object} app        Application instance.  [was: Q]
 * @param {number} playerType Player type.            [was: c]
 * @returns {number}          Duration in seconds.
 *
 * [was: ci]
 */
export function getClippedDuration(app, playerType) { // was: ci
  const playback = app.uX({ playerType }); // was: c (reused)
  const resolved = pt(app, playback); // was: c (reused)
  return adjustDaiDuration(app, resolved.qE(), resolved);
}

// ---------------------------------------------------------------------------
// Volume persistence  (line 54295)
// ---------------------------------------------------------------------------

/**
 * Applies a volume change: persists to localStorage (if allowed), triggers
 * media-element volume update, and publishes the `onVolumeChange` event.
 *
 * @param {Object}  app       Application instance.       [was: Q]
 * @param {Object}  volume    {volume: number, muted: boolean}. [was: c]
 * @param {boolean} persist   Whether to persist to storage.    [was: W]
 *
 * [was: KH]
 */
export function applyVolume(app, volume, persist) { // was: KH
  if (!app.FI.MM) return;
  app.nw = volume;
  if (!volume.muted) Wi(app, false); // was: !1
  if (persist && app.FI.storeUserVolume && !app.FI.Xw) {
    const stored = { volume: Math.floor(volume.volume), muted: volume.muted };
    if (!stored.unstorable) {
      storageSet("yt-player-volume", stored);
      storageSet("yt-player-volume", stored, 2592000); // was: 2592E3
    }
  }
  mq(app);
  const isSilent = isChrome && app.mediaElement && !app.mediaElement.JE();
  if (!app.FI.Xw || isSilent) return;
  publishEventAll(app.ge, "onVolumeChange", {
    muted: volume.muted,
    volume: volume.volume,
    unstorable: !app.FI.storeUserVolume
  });
}

/**
 * Reads stored user volume from localStorage.
 *
 * @param {Object} app  Application instance.  [was: Q]
 * @returns {{volume: number, muted: boolean}}
 *
 * [was: Eg7]
 */
export function getStoredVolume(app) { // was: Eg7
  if (app.FI.storeUserVolume) {
    const stored = storageGet("yt-player-volume") || {};
    const vol = stored.volume;
    return {
      volume: isNaN(vol) ? 100 : clamp(Math.floor(vol), 0, 100),
      muted: !!stored.muted
    };
  }
  return { volume: 100, muted: app.FI.mute };
}

// ---------------------------------------------------------------------------
// Cue-range creation helpers  (line 54313)
// ---------------------------------------------------------------------------

/**
 * Creates and adds a cue-range marker at the given time span.
 *
 * @param {Object}  app       Application instance.         [was: Q]
 * @param {string}  id        Unique marker ID.              [was: c]
 * @param {number}  start     Start time in seconds.         [was: W]
 * @param {number}  end       End time in seconds.           [was: m]
 * @param {number}  [color]   Marker color (if time marker). [was: K]
 * @param {string}  [type]    Marker type ("chapter"/"ad").  [was: T]
 * @param {string}  [ns]      Namespace override.            [was: r]
 * @returns {boolean}         Always true.
 *
 * [was: Tc]
 */
export function createCueRangeMarker(app, id, start, end, color, type, ns) { // was: Tc
  const opts = { id, namespace: ns ?? "appapi" };
  if (type === "chapter") {
    opts.style = MARKER_TYPES.CHAPTER_MARKER;
    opts.visible = true; // was: !0
  } else if (!isNaN(color)) {
    opts.style = type === "ad" ? MARKER_TYPES.AD_MARKER : MARKER_TYPES.TIME_MARKER;
    if (type !== "ad") opts.color = color;
    opts.visible = true;
  }
  app.Mp([new CueRange(start * 1000, end * 1000, opts)], 1); // was: 1E3
  return true;
}

// ---------------------------------------------------------------------------
// Playlist management  (line 54364)
// ---------------------------------------------------------------------------

/**
 * Updates the autoplay navigation state and publishes the change.
 *
 * @param {Object} app    Application instance.  [was: Q]
 * @param {number} state  New autoplay state.     [was: c]
 *
 * [was: dc7]
 */
export function setAutonavState(app, state) { // was: dc7
  app.a$().autonavState = state;
  storageSet("yt-player-autonavstate", state);
  app.ge.publish("autonavchange", state);
}

/**
 * Replaces the playlist instance with a new one from the given config.
 *
 * @param {Object}       app     Application instance.              [was: Q]
 * @param {Object|null}  config  Playlist config (null to clear).   [was: c]
 *
 * [was: oE]
 */
export function replacePlaylist(app, config) { // was: oE
  if (app.playlist) {
    safeDispose(app.playlist);
    app.playlist = null;
  }
  if (config) {
    if (app.JI) config.fetch = 0;
    app.playlist = new PlaylistData(app.FI, config);
  }
}

// ---------------------------------------------------------------------------
// State publication  (line 54610)
// ---------------------------------------------------------------------------

/**
 * Publishes cue-range events to the event bus and, for external
 * interfaces, converts them to the external format.
 *
 * @param {Object} app       Application instance.          [was: Q]
 * @param {string} eventName Event name ("cuerangesadded", etc.). [was: c]
 * @param {Array}  ranges    Array of cue-range objects.     [was: W]
 *
 * [was: rW]
 */
export function publishCueRangeEvent(app, eventName, ranges) { // was: rW
  app.ge.publish(eventName, ranges);
  const isExternal = isTvHtml5(app.FI) || isWebUnplugged(app.FI) || isWebRemix(app.FI);
  if (!ranges || !isExternal) return;

  let callbackName;
  switch (eventName) {
    case "cuerangemarkersupdated":
      callbackName = "onCueRangeMarkersUpdated"; break;
    case "cuerangesadded":
      callbackName = "onCueRangesAdded"; break;
    case "cuerangesremoved":
      callbackName = "onCueRangesRemoved"; break;
  }
  if (callbackName) {
    publishEvent(app.ge, callbackName, ranges.map((r) => ({
      getId() { return this.id; },
      end: r.end,
      id: r.getId(),
      namespace: r.namespace === "ad" ? "ad" : "",
      start: r.start,
      style: r.style,
      visible: r.visible,
      markerPositionMs: r.markerPositionMs
    })));
  }
}

// ---------------------------------------------------------------------------
// Playback mode creation  (line 54732)
// ---------------------------------------------------------------------------

/**
 * Creates a new playback mode (g.Ff) for the given player type and video data.
 *
 * @param {Object} app        Application instance.  [was: Q]
 * @param {number} playerType Player type enum.       [was: c]
 * @param {Object} videoData  Video data.             [was: W]
 * @param {Object} [extra]    Extra creation params.  [was: m]
 * @returns {Object}          New playback mode.
 *
 * [was: createPlaybackMode]
 */
export function createPlaybackMode(app, playerType, videoData, extra) { // was: g.PGw
  let timing = app.KO; // was: K
  if (playerType === 2) timing = new PerformanceTimer(app.FI);
  const mode = new VideoPlayer(
    app.FI, playerType, timing, app.template,
    (event, data, extra2) => { app.ge.publish(event, data, extra2); },
    () => app.ge.getVisibilityState(),
    app.visibility, app, app.Qp, videoData, extra, app.uC, app.Bq
  );
  if (app.FI.getExperimentFlags.W.BA(McW)) app.getLastRangeEnd(videoData.clientPlaybackNonce);
  return mode;
}

// ---------------------------------------------------------------------------
// External player state publication  (line 54706)
// ---------------------------------------------------------------------------

/**
 * Publishes the external player state change to API listeners.
 *
 * @param {Object} app    Application instance.  [was: Q]
 * @param {number} state  State code (-1..5).     [was: c]
 *
 * [was: yw]
 */
export function publishExternalState(app, state) { // was: yw
  const playback = app.oe(); // was: W
  const type = playback.getPlayerType(); // was: m
  if (type === 2 && !app.wX()) {
    if (app.pN !== state) {
      app.pN = state;
      publishEventAll(app.ge, "onAdStateChange", state);
    }
    return;
  }
  if (type === 2 && app.wX() || type === 5 || type === 6 || type === 7) {
    if (state === -1 || state === 0 || state === 5) return;
  }
  if (state === 0) {
    if (app.captureBandwidthSnapshot) return;
    if (playback.isLooping && isTvHtml5(app.FI)) {
      app.playVideo();
      return;
    }
  }
  if (app.j4 !== state) {
    app.j4 = state;
    publishEventAll(app.ge, "onStateChange", state);
  }
}

// ---------------------------------------------------------------------------
// Loop range  (line 54937)
// ---------------------------------------------------------------------------

/**
 * Returns whether the given time falls within the active loop range.
 *
 * @param {Object} app  Application instance.  [was: Q]
 * @param {number} time Time in seconds.        [was: c]
 * @returns {boolean}
 *
 * [was: FMO]
 */
export function isWithinLoopRange(app, time) { // was: FMO
  if (!app.captureBandwidthSnapshot) return false;
  const loopStart = app.captureBandwidthSnapshot.startTimeMs * 0.001 - 1;
  let loopEnd = app.captureBandwidthSnapshot.endTimeMs * 0.001;
  if (app.captureBandwidthSnapshot.type === "repeatChapter") loopEnd--;
  return Math.abs(time - loopStart) <= 1e-6 || Math.abs(time - loopEnd) <= 1e-6
    || (time >= loopStart && time <= loopEnd);
}
