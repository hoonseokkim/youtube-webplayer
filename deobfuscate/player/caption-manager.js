import { publishEventAll } from '../ads/ad-click-tracking.js';
import { ThrottleTimer } from '../core/bitstream-helpers.js';
import { isPS4VR, trustedResourceUrlFrom } from '../core/composition-helpers.js';
import { registerDisposable } from '../core/event-system.js';
import { getProperty } from '../core/misc-helpers.js';
import { isEmbedWithAudio, isUnpluggedPlatform, supportsFullscreen } from '../data/bandwidth-tracker.js';
import { reportErrorWithLevel } from '../data/gel-params.js';
import { Q40 } from '../data/session-storage.js';
import { chevronRightIcon } from '../ui/svg-icons.js';
import { positionMarkerOverlays } from '../ui/progress-bar-impl.js'; // was: UC
import { isTextTrackMimeType } from '../media/codec-helpers.js'; // was: LM
import { INCOMPLETE_CHUNK } from '../modules/remote/cast-session.js'; // was: Cx
import { isWebKids } from '../data/performance-profiling.js'; // was: Dm
import { getExperimentFlags } from './time-tracking.js'; // was: Ty()
import { isLeanback } from '../data/performance-profiling.js'; // was: y_
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { unwrapTrustedResourceUrl } from '../core/composition-helpers.js'; // was: x3
import { updateBadgeExpansion } from './video-loader.js'; // was: Q4
import { parseQueryString } from '../data/idb-transactions.js'; // was: bk
import { MODULE_DEPENDENCIES } from './module-setup.js'; // was: Ktw
import { checkAdExperiment } from './media-state.js'; // was: qP
import { moduleFileMap } from './module-setup.js'; // was: ao
import { MODULE_FILE_NAMES } from './module-setup.js'; // was: oow
import { getRemainingInRange } from '../media/codec-helpers.js'; // was: RR
import { ALL_MODULE_NAMES } from './module-setup.js'; // was: A8d
import { tryAsync } from '../ads/ad-async.js'; // was: bi
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { scheduleMicrotask } from '../core/composition-helpers.js'; // was: hG
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { AdVideoClickthroughMetadata } from '../ads/ad-interaction.js'; // was: ux
import { MetricCondition } from '../data/module-init.js'; // was: X_
import { MusicTrackHandler } from '../modules/offline/offline-orchestration.js'; // was: END
import { concat } from '../core/array-utils.js';
import { getPlayerResponse, getWebPlayerContextConfig } from './player-api.js';
import { isEmbedsShortsMode } from '../features/shorts.js';
import { isWebUnplugged, getDevicePixelRatio, isWebEmbeddedPlayer } from '../data/performance-profiling.js';
import { contains } from '../core/string-utils.js';
import { safeDispose } from '../core/event-system.js';
import { createElement, getElementsByTagName, appendChild } from '../core/dom-utils.js';
import { PlayerError } from '../ui/cue-manager.js';
import { getPlayerSize } from './time-tracking.js';
import { dispose } from '../ads/dai-cue-range.js';
import { VideoData } from '../data/device-platform.js';
import { ERROR_MESSAGES } from '../core/errors.js';
import { getDrmInfo, getEndscreenUrl, getEndscreenRenderer, getFeaturedChannelAnnotation, isEquirectangular, isEquirectangular3D, isMeshProjection, isStereo3D, getPlayerKeyword } from './video-data-helpers.js'; // was: g.Jh, g.IFO, g.XTx, g.K8, g.ct, g.Wt, g.mO, g.$Q, g.YQ
import { isSafari } from '../core/browser-detection.js'; // was: g.v8
// TODO: resolve g.eS
// TODO: resolve g.o_
// TODO: resolve g.s8
// TODO: resolve g.yrK

/**
 * Caption Manager — caption track enumeration, ASR detection,
 * HLS native captions, manifest-less playback caption handling,
 * module lifecycle management, and player controls auto-hide logic.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~48505–50000
 *
 * Key subsystems:
 *   - Caption track enumeration (getCaptionTracks, addCaptionTrack)
 *   - ASR (automatic speech recognition) vs regular track routing
 *   - HLS native captions support check (supportsHlsNativeCaptions)
 *   - Manifest-less playback caption detection (hasInStreamCaptions, shouldUseNativePlatformCaptions, isCaptionMimeTypeStream)
 *   - Module accessor functions (bM0, u2, getCaptionsModule, getAnnotationsModule, w7, CY, M2, getWebglModule, JT, J7X)
 *   - Module lifecycle: creation, eligibility, lazy loading (Ro, pV_, YlO, TBw, UTO)
 *   - Module destruction and deferred loading (Wv, cv, Xen, Qr)
 *   - Script loader with CSP nonce support (r87)
 *   - Controls auto-hide state machine (KI, V3n, mI)
 *   - Thumbnail resolution selection (BB7)
 *   - Error-message builder (o1, parseRichTextToVdom, no0)
 *   - Overlay insertion order (Un)
 *   - Paid-content overlay (t3W, H$K, DTx)
 *
 * [was: g.GN, getCaptionTracks, zzy, addCaptionTrack, supportsHlsNativeCaptions, shouldUseNativePlatformCaptions, isCaptionMimeTypeStream, hasInStreamCaptions, bM0, u2,
 *  getCaptionsModule, getAnnotationsModule, w7, CY, M2, getWebglModule, JT, J7X, RzO, kFO, Ro, Ym, pY,
 *  c8m, shouldLoadEndscreen, mTW, pV_, km, YlO, TBw, UTO, Qr, I_O, Xen, cv, Wv,
 *  e$w, r87, KI, V3n, mI, BB7, xT0, o1, parseRichTextToVdom, no0, Un, t3W, H$K, DTx]
 */

// ---------------------------------------------------------------------------
// Caption track enumeration  (lines 48505–48548)
// ---------------------------------------------------------------------------

// NOTE: g.GN (registerModule) is covered in module-registry.js.
// It is included in the source-line range but deliberately not
// duplicated here.

/**
 * Returns the list of caption tracks.  When `includeAsr` is true,
 * also includes automatic speech recognition (ASR) tracks.
 *
 * @param {Object} videoData   [was: Q]
 * @param {boolean} includeAsr [was: c]  — if true, concat regular + ASR tracks
 * @returns {Array} Array of caption track objects.
 *
 * [was: getCaptionTracks]
 */
export function getCaptionTracks(videoData, includeAsr) { // was: g.H6
  return includeAsr ? videoData.W.concat(videoData.O) : videoData.W;
}

/**
 * Adds a caption track to the appropriate list (ASR or regular),
 * deduplicating by the track's `equals()` method.
 *
 * @param {Object} track      The caption track to add. [was: Q — first param to zzy]
 * @param {Array}  trackList  Target array (either W or O). [was: c — second param to zzy]
 *
 * [was: zzy]
 */
function addTrackIfUnique(track, trackList) { // was: zzy
  if (!find(trackList, (existing) => track.equals(existing))) {
    trackList.push(track);
  }
}

/**
 * Registers a caption track into the video data's caption-track lists.
 * Routes ASR tracks to `videoData.O` and all others to `videoData.W`.
 *
 * @param {Object} videoData  [was: Q]
 * @param {Object} track      [was: c]
 *
 * [was: addCaptionTrack]
 */
export function addCaptionTrack(videoData, track) { // was: g.$m
  switch (track.kind) {
    case "asr":
      addTrackIfUnique(track, videoData.O);
      break;
    default:
      addTrackIfUnique(track, videoData.W);
  }
}

// ---------------------------------------------------------------------------
// HLS native captions support  (line 48528)
// ---------------------------------------------------------------------------

/**
 * Checks whether HLS native captions are available and should be used.
 *
 * Requirements:
 *   1. The `html5_use_hls_native_captions` experiment flag is on.
 *   2. The current browser is Safari (`g.v8`).
 *   3. The video data reports a UC (unified captions) capability.
 *   4. The player's media element has a valid HLS source (`Q.O?.A()`).
 *
 * @param {Object} videoData  [was: Q]
 * @param {Object} player     [was: c]
 * @returns {boolean}
 *
 * [was: supportsHlsNativeCaptions]
 */
export function supportsHlsNativeCaptions(videoData, player) { // was: g.Cr7
  return (
    player.G().X("html5_use_hls_native_captions") &&
    isSafari() &&
    videoData.positionMarkerOverlays() &&
    !!videoData.O?.A()
  );
}

// ---------------------------------------------------------------------------
// Manifest-less / DRM caption detection  (lines 48532–48548)
// ---------------------------------------------------------------------------

/**
 * Returns whether native platform captions should be used for this
 * player/format combination.  Accounts for Safari live DRM workaround.
 *
 * @param {Object} player       [was: Q]
 * @param {Object} formatInfo   [was: c]  — has `isManifestless` flag
 * @returns {boolean}
 *
 * [was: shouldUseNativePlatformCaptions]
 */
export function shouldUseNativePlatformCaptions(player, formatInfo) { // was: g.P6
  if (
    player.G().X("safari_live_drm_captions_fix") &&
    player.getVideoData()?.Ir()
  ) {
    return false; // was: !1
  }
  return isUnpluggedPlatform(player.G()) && !formatInfo.isManifestless;
}

/**
 * Tests whether a given format stream matches the expected caption
 * MIME type, optionally requiring a specific itag.
 *
 * @param {Object} stream   [was: Q]  — has `info.mimeType`, `info.itag`
 * @param {string} [itag]   [was: c]  — optional itag to match
 * @returns {boolean}
 *
 * [was: isCaptionMimeTypeStream]
 */
export function isCaptionMimeTypeStream(stream, itag) { // was: g.l2
  if (!isTextTrackMimeType(stream.info.mimeType)) return false; // was: !1
  return itag ? stream.info.itag === itag : true; // was: !0
}

/**
 * Determines whether in-stream captions are available for the current
 * video.  Checks multiple paths:
 *
 *   1. Native platform captions with rawcc data present.
 *   2. Manifest-less playback with itag 386 (embedded WebVTT).
 *   3. Non-manifest-less with general caption stream detection.
 *
 * @param {Object} videoData  [was: Q]
 * @param {Object} player     [was: c]
 * @returns {boolean}
 *
 * [was: hasInStreamCaptions]
 */
export function hasInStreamCaptions(videoData, player) { // was: g.MJX
  // Path 1: native platform captions with raw CC data
  if (
    videoData.W != null &&
    shouldUseNativePlatformCaptions(player, videoData.W) &&
    videoData.W.W.rawcc != null
  ) {
    return true; // was: !0
  }

  // Must have unified-captions capability
  if (!videoData.positionMarkerOverlays()) return false; // was: !1

  // Path 2: manifest-less with itag 386
  const hasManifestlessCaptions =
    !!videoData.W &&
    videoData.W.isManifestless &&
    Object.values(videoData.W.W).some((stream) => isCaptionMimeTypeStream(stream, "386")); // was: c (reused)

  // Path 3: non-manifest-less with any caption stream
  const hasRegularCaptions =
    !!videoData.W &&
    !videoData.W.isManifestless &&
    g.yrK(videoData.W); // was: Q (reused)

  return hasManifestlessCaptions || hasRegularCaptions;
}

// ---------------------------------------------------------------------------
// Module accessor functions  (lines 48550–48597)
// ---------------------------------------------------------------------------

/**
 * Returns the UX module, if the player configuration enables it.
 * @param {Object} moduleHost  [was: Q]
 * @returns {Object|undefined}
 * [was: bM0]
 */
export function getUxModule(moduleHost) { // was: bM0
  if (moduleHost.U.G().XI) return moduleHost.INCOMPLETE_CHUNK.get("ux");
}

/**
 * Returns the ad module.
 * @param {Object} moduleHost  [was: Q]
 * @returns {Object|undefined}
 * [was: u2]
 */
export function getAdModule(moduleHost) { // was: u2
  return moduleHost.INCOMPLETE_CHUNK.get("ad");
}

/**
 * Returns the captions module.
 * @param {Object} moduleHost  [was: Q]
 * @returns {Object|undefined}
 * [was: getCaptionsModule]
 */
export function getCaptionsModule(moduleHost) { // was: g.hT
  return moduleHost.INCOMPLETE_CHUNK.get("captions");
}

/**
 * Returns the annotations module.
 * @param {Object} moduleHost  [was: Q]
 * @returns {Object|undefined}
 * [was: getAnnotationsModule]
 */
export function getAnnotationsModule(moduleHost) { // was: g.zN
  return moduleHost.INCOMPLETE_CHUNK.get("annotations_module");
}

/**
 * Returns the remote module, if the player configuration enables it.
 * @param {Object} moduleHost  [was: Q]
 * @returns {Object|undefined}
 * [was: w7]
 */
export function getRemoteModule(moduleHost) { // was: w7
  if (moduleHost.U.G().OR) return moduleHost.INCOMPLETE_CHUNK.get("remote");
}

/**
 * Returns the creator-endscreen module.
 * @param {Object} moduleHost  [was: Q]
 * @returns {Object|undefined}
 * [was: CY]
 */
export function getCreatorEndscreenModule(moduleHost) { // was: CY
  return moduleHost.INCOMPLETE_CHUNK.get("creatorendscreen");
}

/**
 * Returns the kids module, if the player is in kids mode.
 * @param {Object} moduleHost  [was: Q]
 * @returns {Object|undefined}
 * [was: M2]
 */
export function getKidsModule(moduleHost) { // was: M2
  if (isWebKids(moduleHost.U.G())) return moduleHost.INCOMPLETE_CHUNK.get("kids");
}

/**
 * Returns the WebGL module.
 * @param {Object} moduleHost  [was: Q]
 * @returns {Object|undefined}
 * [was: getWebglModule]
 */
export function getWebglModule(moduleHost) { // was: g.g7
  return moduleHost.INCOMPLETE_CHUNK.get("webgl");
}

/**
 * Returns the offline module, if offline playback is enabled.
 * @param {Object} moduleHost  [was: Q]
 * @returns {Object|undefined}
 * [was: JT]
 */
export function getOfflineModule(moduleHost) { // was: JT
  if (moduleHost.U.G().YR) return moduleHost.INCOMPLETE_CHUNK.get("offline");
}

/**
 * Returns the miniplayer module, if the config enables it.
 * @param {Object} moduleHost  [was: Q]
 * @returns {Object|undefined}
 * [was: J7X]
 */
export function getMiniplayerModule(moduleHost) { // was: J7X
  if (moduleHost.U.G().showMiniplayerUiWhenMinimized) {
    return moduleHost.INCOMPLETE_CHUNK.get("miniplayer");
  }
}

/**
 * Sets the active format adapter reference.
 * @param {Object} moduleHost  [was: Q]
 * @param {*} adapter          [was: c]
 * [was: RzO]
 */
export function setFormatAdapter(moduleHost, adapter) { // was: RzO
  moduleHost.A = adapter;
}

// ---------------------------------------------------------------------------
// Caption module eligibility  (line 48599)
// ---------------------------------------------------------------------------

/**
 * Determines whether the captions module should be loaded.
 * Returns true if any of:
 *   - HLS native captions are supported
 *   - `sC` (server captions) data is present
 *   - There are caption tracks in the video data
 *   - In-stream captions are available
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {boolean}
 *
 * [was: kFO]
 */
export function shouldLoadCaptionsModule(moduleHost) { // was: kFO
  const videoData = moduleHost.U.getVideoData(); // was: c
  return (
    supportsHlsNativeCaptions(videoData, moduleHost.U) ||
    !!videoData.sC ||
    !!videoData.captionTracks.length ||
    hasInStreamCaptions(videoData, moduleHost.U)
  );
}

// ---------------------------------------------------------------------------
// Module creation and lazy loading  (lines 48604–48898)
// ---------------------------------------------------------------------------

/**
 * Creates or re-creates a player module by name.  If the module class
 * is already registered, instantiates it directly; otherwise triggers
 * an async script load.
 *
 * @param {Object} moduleHost       [was: Q]
 * @param {string} moduleName       [was: c]
 * @param {boolean} [fireApiChange=false]  Emit `onApiChange` after creation. [was: W]
 * @param {boolean} [forceRecreate=false]  Force recreation even if loaded.  [was: m]
 * @param {Function} [onReady]      Custom ready callback. [was: K]
 *
 * [was: Ro]
 */
export function createModule(moduleHost, moduleName, fireApiChange = false, forceRecreate = false, onReady) { // was: Ro
  let errorHandler; // was: T
  let module = moduleHost.INCOMPLETE_CHUNK.get(moduleName); // was: r

  if (!module || forceRecreate) {
    if (!onReady) {
      onReady = () => {
        createModule(moduleHost, moduleName, fireApiChange, forceRecreate);
      };
    }
    if (!errorHandler) {
      errorHandler = () => {
        unloadModuleDependencies(moduleHost, moduleName); // was: km(Q, c)
      };
    }
    module =
      module ||
      tryInstantiateModule(moduleHost, moduleName, isModuleEligible(moduleHost, moduleName), onReady, errorHandler); // was: YlO(..., pV_(...))

    if (module) {
      moduleHost.INCOMPLETE_CHUNK.set(moduleName, module);
      module.create();
      moduleHost.U.publish("modulecreated", moduleName);
      if (fireApiChange) publishEventAll(moduleHost.U, "onApiChange");
    }
  }
}

/**
 * Checks whether the ad module should be loaded (player response
 * contains ad placements or ad slots).
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {boolean}
 *
 * [was: Ym]
 */
export function hasAdPlacements(moduleHost) { // was: Ym
  if (moduleHost.U.G().A) return false; // was: !1
  const playerResponse = moduleHost.U
    .getVideoData({ playerType: 1 })
    .getPlayerResponse(); // was: Q (reused)
  if (playerResponse) {
    const placements = playerResponse.adPlacements; // was: c
    if (placements) {
      for (let i = 0; i < placements.length; i++) { // was: W
        if (placements[i].adPlacementRenderer) return true; // was: !0
      }
    }
    if (playerResponse.adSlots) return true; // was: !0
  }
  return false; // was: !1
}

/**
 * Checks whether the asm.js (WebAssembly fallback) module should load.
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {boolean}
 *
 * [was: pY]
 */
export function shouldLoadAsmjsModule(moduleHost) { // was: pY
  return (
    moduleHost.U.G().X("html5_allow_asmjs") ||
    moduleHost.U.G().getExperimentFlags.W.BA(Q40)
  );
}

/**
 * Checks whether the creator-endscreen module should load.
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {boolean}
 *
 * [was: c8m]
 */
export function shouldLoadCreatorEndscreen(moduleHost) { // was: c8m
  if (moduleHost.U.isEmbedsShortsMode()) return false; // was: !1
  const player = moduleHost.U; // was: Q (reused)
  const config = player.G(); // was: c
  if (
    config.A ||
    config.getWebPlayerContextConfig()?.embedsEnableEmc3ds ||
    config.controlsType === "3"
  ) {
    return false; // was: !1
  }
  if (config.playerStyle === "creator-endscreen-editor") return true; // was: !0
  const videoData = player.getVideoData(); // was: Q (reused)
  return !!videoData && (!!getEndscreenUrl(videoData) || !!getEndscreenRenderer(videoData));
}

/**
 * Checks whether the endscreen module should load.  Accounts for
 * live playback restrictions, autoplay flags, and embed mode.
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {boolean}
 *
 * [was: shouldLoadEndscreen]
 */
export function shouldLoadEndscreen(moduleHost) { // was: g.Wt0
  const config = moduleHost.U.G(); // was: c
  if (config.A || isLeanback(config) || config.D || (!config.applyQualityConstraint && !config.qY)) {
    return false; // was: !1
  }
  const presentingType = moduleHost.U.getPresentingPlayerType(); // was: W
  if (presentingType === 2 || presentingType === 3) return false; // was: !1

  const videoData = moduleHost.U.getVideoData(); // was: Q (reused)
  if (!videoData) return false; // was: !1

  let isLiveBlocked =
    !videoData.isLiveDefaultBroadcast || config.X("allow_poltergust_autoplay"); // was: W (reused)
  isLiveBlocked =
    videoData.isLivePlayback && (!config.X("allow_live_autoplay") || !isLiveBlocked);
  const allowLiveMweb = videoData.isLivePlayback && config.X("allow_live_autoplay_on_mweb"); // was: c (reused)

  return !isLiveBlocked || allowLiveMweb;
}

/**
 * Checks whether the WebGL module should load, based on video type
 * (spherical, mesh, HDR) and available hardware.
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {boolean}
 *
 * [was: mTW]
 */
export function shouldLoadWebglModule(moduleHost) { // was: mTW
  const videoData = moduleHost.U.getVideoData(); // was: c
  const config = moduleHost.U.G(); // was: Q (reused)
  let hasWebGL = isPS4VR(); // was: W
  const enableSpherical = config.X("enable_spherical_kabuki"); // was: m
  const hasGpuAccel = supportsFullscreen(config); // was: K

  if (isMeshProjection(videoData)) return hasWebGL || enableSpherical || hasGpuAccel;
  if (isEquirectangular(videoData)) return hasGpuAccel || hasWebGL || enableSpherical;
  if (isEquirectangular3D(videoData)) return hasGpuAccel || hasWebGL || false; // was: !1
  if (isStereo3D(videoData)) return hasGpuAccel || false; // was: !1

  const isHdr = videoData.O && videoData.O.video && videoData.O.video.isHdr(); // was: W (reused)
  return hasGpuAccel && !getDrmInfo(videoData) && !isHdr && config.X("enable_webgl_noop");
}

/**
 * Master switch that determines whether a named module is eligible for
 * loading based on the current player state and video data.
 *
 * @param {Object} moduleHost  [was: Q]
 * @param {string} moduleName  [was: c]
 * @returns {boolean}
 *
 * [was: pV_]
 */
export function isModuleEligible(moduleHost, moduleName) { // was: pV_
  switch (moduleName) {
    case "ad":
      return hasAdPlacements(moduleHost); // was: Ym(Q)
    case "annotations_module": {
      if (moduleHost.U.isEmbedsShortsMode()) return false; // was: !1
      const player = moduleHost.U; // was: c (reused)
      const cfg = player.G(); // was: Q (reused)
      const vd = player.getVideoData(); // was: c (reused)
      if (cfg.A || vd.PQ || cfg.controlsType === "3") return false; // was: !1
      if (
        cfg.Ka.isEmpty() &&
        cfg.playerStyle !== "annotation-editor" &&
        cfg.playerStyle !== "live-dashboard"
      ) {
        return !!vd.updateBadgeExpansion || !!vd.unwrapTrustedResourceUrl() || !!getFeaturedChannelAnnotation(vd);
      }
      return true; // was: !0
    }
    case "asmjs":
      return shouldLoadAsmjsModule(moduleHost); // was: pY(Q)
    case "creatorendscreen":
      return shouldLoadCreatorEndscreen(moduleHost); // was: c8m(Q)
    case "embed":
      return isEmbedWithAudio(moduleHost.U.G());
    case "endscreen":
      return shouldLoadEndscreen(moduleHost); // was: g.Wt0(Q)
    case "heartbeat":
      return moduleHost.parseQueryString();
    case "kids":
      return isWebKids(moduleHost.U.G());
    case "remote":
      return moduleHost.U.G().OR;
    case "miniplayer":
      return moduleHost.U.G().showMiniplayerUiWhenMinimized;
    case "offline":
      return moduleHost.U.G().YR;
    case "captions":
      return shouldLoadCaptionsModule(moduleHost); // was: kFO(Q)
    case "unplugged":
      return isWebUnplugged(moduleHost.U.G());
    case "ux":
      return moduleHost.U.G().XI;
    case "webgl":
      return shouldLoadWebglModule(moduleHost); // was: mTW(Q)
    case "ypc":
      return moduleHost.kh();
    default:
      reportErrorWithLevel(Error(`Module descriptor ${moduleName} does not match`));
      return false; // was: !1
  }
}

/**
 * Notifies all dependent components that a module failed to load.
 *
 * @param {Object} moduleHost  [was: Q]
 * @param {string} moduleName  [was: c]
 *
 * [was: km]
 */
export function unloadModuleDependencies(moduleHost, moduleName) { // was: km
  const deps = MODULE_DEPENDENCIES[moduleName]; // was: c (reused)
  for (const dep of deps) { // was: W
    moduleHost.U.checkAdExperiment(dep);
  }
}

/**
 * Tries to instantiate a module from the registry.  If the class is
 * registered, creates and returns it; if not, triggers an async script
 * load.  Returns null if the module is ineligible or not yet loaded.
 *
 * @param {Object} moduleHost   [was: Q]
 * @param {string} moduleName   [was: c]
 * @param {boolean} isEligible  [was: W]
 * @param {Function} onReady    [was: m]
 * @param {Function} onError    [was: K]
 * @returns {Object|null}
 *
 * [was: YlO]
 */
export function tryInstantiateModule(moduleHost, moduleName, isEligible, onReady, onError) { // was: YlO
  try {
    if (isEligible) {
      const ModuleClass = moduleFileMap.get(moduleName); // was: T
      if (ModuleClass) return new ModuleClass(moduleHost.U);
      loadModuleScript(moduleHost, moduleName, onReady, onError); // was: TBw
    } else {
      unloadModuleDependencies(moduleHost, moduleName); // was: km(Q, c)
    }
  } catch (err) { // was: T
    unloadModuleDependencies(moduleHost, moduleName);
    reportErrorWithLevel(err);
  }
  return null;
}

/**
 * Loads a module's script file from the module-base URL, applying a
 * cache-buster query parameter if configured.
 *
 * @param {Object} moduleHost  [was: Q]
 * @param {string} moduleName  [was: c]
 * @param {Function} onReady   [was: W]
 * @param {Function} onError   [was: m]
 *
 * [was: TBw]
 */
export function loadModuleScript(moduleHost, moduleName, onReady, onError) { // was: TBw
  if (moduleHost.J) {
    const scriptPath = MODULE_FILE_NAMES[moduleName]; // was: K
    let url = moduleHost.J + scriptPath; // was: c (reused)
    if (moduleHost.j) url += `?cb=${moduleHost.j}`;
    injectScript(moduleHost, url, () => { // was: r87
      moduleHost.D.add(scriptPath);
      onReady.call(moduleHost);
    }, onError);
  }
}

/**
 * Asynchronously loads the asm.js module, creating it if necessary.
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {Promise<Object>}
 *
 * [was: UTO]
 */
export async function loadAsmjsModule(moduleHost) { // was: UTO
  let module = moduleHost.INCOMPLETE_CHUNK.get("asmjs"); // was: c
  if (module) return module;

  const ModuleClass =
    moduleFileMap.get("asmjs") ??
    (await new Promise((resolve, reject) => { // was: W, m
      loadModuleScript(moduleHost, "asmjs", () => {
        const loaded = moduleFileMap.get("asmjs"); // was: K
        loaded ? resolve(loaded) : reject("cannot load module asmjs");
      }, reject);
    }));

  if (!ModuleClass) return Promise.reject("cannot load module asmjs");

  module = new ModuleClass(moduleHost.U); // was: c (reused)
  moduleHost.INCOMPLETE_CHUNK.set("asmjs", module);
  module.create();
  return module;
}

// ---------------------------------------------------------------------------
// Ad deferral and module readiness  (lines 48790–48845)
// ---------------------------------------------------------------------------

/**
 * Determines whether the ad module should be deferred based on start
 * time proximity to the first ad break.
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {boolean}
 *
 * [was: Qr]
 */
export function shouldDeferAdModule(moduleHost) { // was: Qr
  const videoData = moduleHost.U.getVideoData(); // was: c
  let shouldDefer = videoData.X("web_player_defer_ad"); // was: Q (reused)

  if (shouldDefer) {
    if (
      contains(videoData.getRemainingInRange, "ad") ||
      l6W(videoData) ||
      videoData.enableServerStitchedDai
    ) {
      shouldDefer = false; // was: !1
    } else {
      const startSeconds = videoData.startSeconds; // was: Q (reused)
      const adPlacements = videoData.playerResponse?.adPlacements; // was: m

      if (adPlacements) {
        let earliestAdMs = Number.MAX_VALUE; // was: c (reused)
        for (const placement of adPlacements) { // was: W
          const renderer = placement.adPlacementRenderer; // was: m (reused)
          if (renderer) {
            const placementConfig = renderer.config?.adPlacementConfig; // was: K
            if (placementConfig?.kind === "AD_PLACEMENT_KIND_MILLISECONDS") {
              const effectiveMs =
                (Number(placementConfig?.adTimeOffset?.offsetStartMilliseconds) || 0) -
                Number(renderer.renderer?.adBreakServiceRenderer?.prefetchMilliseconds || 0); // was: m (reused)
              if (effectiveMs < earliestAdMs) earliestAdMs = effectiveMs;
            }
          }
        }
        shouldDefer = earliestAdMs - 5e3 <= startSeconds * 1e3 ? false : true; // was: !1 : !0
      } else {
        shouldDefer = false; // was: !1
      }
    }
  }
  return shouldDefer;
}

/**
 * Async wrapper for `loadAsmjsModule`.
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {Promise<Object>}
 *
 * [was: I_O]
 */
export async function loadAsmjsModuleAsync(moduleHost) { // was: I_O
  return await loadAsmjsModule(moduleHost);
}

/**
 * Returns whether modules should be deferred due to inline ad playback.
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {boolean}
 *
 * [was: Xen]
 */
export function shouldDeferModulesForAd(moduleHost) { // was: Xen
  const videoData = moduleHost.U.getVideoData(); // was: c
  let shouldDefer = moduleHost.mF && !videoData.isInlinePlaybackNoAd; // was: W
  if (moduleHost.U.X("html5_defer_modules_on_ads_only") && !videoData.isAd()) {
    shouldDefer = false; // was: !1
  }
  return shouldDefer;
}

/**
 * Creates deferred modules (captions, endscreen, creator-endscreen)
 * once the ad module signals readiness.
 *
 * @param {Object} moduleHost  [was: Q]
 *
 * [was: cv]
 */
export function createDeferredModules(moduleHost) { // was: cv
  if (shouldDeferAdModule(moduleHost)) moduleHost.K(); // was: Qr(Q) && Q.K()
  if (shouldDeferModulesForAd(moduleHost)) { // was: Xen(Q)
    createModule(moduleHost, "captions", true); // was: Ro(Q, "captions", !0)
    createModule(moduleHost, "endscreen");
    moduleHost.W();
    createModule(moduleHost, "creatorendscreen", true); // was: !0
  }
}

/**
 * Destroys all volatile modules (those in the `A8d` list) when the
 * video data changes or on dispose.
 *
 * @param {Object} moduleHost  [was: Q]
 * @param {Object} videoData   [was: c]
 * @param {boolean} [force]    Force destruction regardless of GS check. [was: W]
 *
 * [was: Wv]
 */
export function destroyVolatileModules(moduleHost, videoData, force) { // was: Wv
  for (const name of ALL_MODULE_NAMES) { // was: m
    const module = moduleHost.INCOMPLETE_CHUNK.get(name); // was: K
    if (module && (force || module.GS(videoData))) {
      safeDispose(module);
      moduleHost.INCOMPLETE_CHUNK.delete(name);
    }
  }
  moduleHost.U.publish("modulesDestroyed", videoData);
}

/**
 * Returns a lazy-evaluated promise for the asm.js module.
 *
 * @param {Object} moduleHost  [was: Q]
 * @returns {Promise<Object>}
 *
 * [was: e$w]
 */
export function getOrLoadAsmjsModule(moduleHost) { // was: e$w
  return tryAsync(() => moduleHost.INCOMPLETE_CHUNK.get("asmjs") ?? loadAsmjsModuleAsync(moduleHost)); // was: I_O
}

// ---------------------------------------------------------------------------
// Script injection with CSP nonce  (lines 48847–48898)
// ---------------------------------------------------------------------------

/**
 * Injects a `<script>` element into the page, or reuses an existing one
 * if a script with the same `data-original-src` or `src` is found.
 *
 * Handles `onload`, `onerror`, and IE's `onreadystatechange` events.
 * Applies the CSP `nonce` attribute if configured in the player config.
 *
 * @param {Object} moduleHost   [was: Q]
 * @param {string} scriptUrl    [was: c]
 * @param {Function} onSuccess  [was: W]
 * @param {Function} onFailure  [was: m]
 *
 * [was: r87]
 */
export function injectScript(moduleHost, scriptUrl, onSuccess, onFailure) { // was: r87
  const existingScripts = g.o_("SCRIPT"); // was: K
  let isNew = false; // was: T  — was: !1
  let scriptEl; // was: r

  for (let i = 0; i < existingScripts.length; i++) { // was: B
    const createDatabaseDefinition = existingScripts[i]; // was: n
    if (createDatabaseDefinition.src === scriptUrl || createDatabaseDefinition.getAttribute("data-original-src") === scriptUrl) {
      scriptEl = createDatabaseDefinition;
    }
  }

  if (!scriptEl) {
    scriptEl = createElement("SCRIPT");
    scriptEl.setAttribute("data-original-src", scriptUrl);
    isNew = true; // was: !0
  }

  const safeOnSuccess = () => { // was: U
    if (!moduleHost.u0()) onSuccess.call(moduleHost);
  };
  const safeOnFailure = () => { // was: I
    if (!moduleHost.u0()) onFailure.call(moduleHost);
  };

  const previousOnload = scriptEl.onload; // was: X
  scriptEl.onload = (event) => { // was: B
    scheduleMicrotask(safeOnSuccess);
    if (previousOnload) previousOnload.apply(window, [event]);
  };

  const previousOnerror = scriptEl.onerror; // was: A
  scriptEl.onerror = (event) => { // was: B
    if (Math.random() < 0.01) {
      const error = new PlayerError(
        "Unable to load player module",
        scriptUrl,
        document.location && document.location.origin,
      ); // was: n
      reportErrorWithLevel(error);
    }
    scheduleMicrotask(safeOnFailure);
    if (previousOnerror) previousOnerror(event);
  };

  const scriptRef = scriptEl; // was: e
  const previousOnReadyStateChange = scriptRef.onreadystatechange; // was: V
  scriptRef.onreadystatechange = (event) => { // was: B
    switch (scriptRef.readyState) {
      case "loaded":
      case "complete":
        scheduleMicrotask(safeOnSuccess);
    }
    if (previousOnReadyStateChange) previousOnReadyStateChange(event);
  };

  if (isNew) {
    const nonce = moduleHost.U.G().cspNonce; // was: K (reused)
    if (nonce) scriptEl.setAttribute("nonce", nonce);
    g.eS(scriptEl, trustedResourceUrlFrom(scriptUrl));
    const head = g.o_("HEAD")[0] || document.body; // was: K (reused)
    head.insertBefore(scriptEl, head.firstChild);
    moduleHost.addOnDisposeCallback(() => {
      if (scriptEl.parentNode) scriptEl.parentNode.removeChild(scriptEl);
    });
  }
}

// ---------------------------------------------------------------------------
// Controls auto-hide state machine  (lines 48901–48931)
// ---------------------------------------------------------------------------

/**
 * Updates the auto-hide bitmask flags and starts/stops the associated
 * timers.  Publishes `"autohideupdate"` when the computed visibility
 * changes.
 *
 * Bitmask flags:
 *   - 1:    user activity
 *   - 2:    mouse-move
 *   - 4:    pointer hover
 *   - 128:  error state
 *   - 512:  default auto-hide
 *   - 2048: seek-bar interaction
 *
 * @param {Object} controller  [was: Q]
 * @param {number} flag        Bitmask flag(s) to set/clear. [was: c]
 * @param {boolean} enable     Whether to set (true) or clear (false). [was: W]
 *
 * [was: KI]
 */
export function updateAutoHideFlags(controller, flag, enable) { // was: KI
  controller.u0();
  const previousVisible = computeAutoHideVisible(controller); // was: m — mI(Q)

  if (enable) {
    controller.O |= flag;
    if (flag & 1) controller.Y.start();
    if (flag & 2) controller.mF.start();
    if (flag & 2048) controller.S.start();
  } else {
    controller.O &= ~flag;
    if (flag & 1) controller.Y.stop();
    if (flag & 2) controller.mF.stop();
    if (flag & 2048) controller.S.stop();
    if (flag & 512) controller.isSamsungSmartTV.stop();
  }

  if (controller.O & 512 && !(controller.O & 128)) {
    controller.isSamsungSmartTV.cw(controller.Ka);
  }

  const nowVisible = computeAutoHideVisible(controller); // was: c (reused)
  if (previousVisible !== nowVisible) {
    controller.publish("autohideupdate", nowVisible);
  }
}

/**
 * Resets the hover-tracking auto-hide state and re-registers the
 * mouseover listener.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: V3n]
 */
export function resetHoverAutoHide(controller) { // was: V3n
  updateAutoHideFlags(controller, 4, false); // was: KI(Q, 4, !1)
  if (controller.J) {
    controller.W.Xd(controller.J);
    controller.J = null;
    controller.A = controller.W.B(controller.target, "mouseover", controller.Z3);
  }
  if (controller.A) {
    controller.W.Xd(controller.A);
    controller.A = controller.W.B(controller.target, "mouseover", controller.Z3);
  }
}

/**
 * Computes whether the controls should be visible based on the current
 * auto-hide bitmask, respecting experiment flags.
 *
 * @param {Object} controller  [was: Q]
 * @returns {boolean} True if controls should be shown.
 *
 * [was: mI]
 */
export function computeAutoHideVisible(controller) { // was: mI
  let flags = controller.O; // was: c
  if (controller.api.X("allow_autohide_on_paused_videos")) flags &= -129;
  if (controller.api.X("web_player_default_autohide")) flags &= -513;
  return !flags;
}

// ---------------------------------------------------------------------------
// Thumbnail resolution selection  (lines 48933–48962)
// ---------------------------------------------------------------------------

/**
 * Selects the best thumbnail resolution for the current player size and
 * device pixel ratio, then sets it as the background image of the
 * poster element.
 *
 * Resolution ladder:
 *   - >1280 x 720 px  -> maxresdefault.jpg
 *   - >640 x 480 px   -> maxresdefault.jpg (fallback)
 *   - >320 x 180 px   -> sddefault / hqdefault / mqdefault
 *   - else             -> default.jpg
 *
 * @param {Object} controller     [was: Q]
 * @param {...Object} videoDataList  One or more VideoData sources. [was: c]
 *
 * [was: BB7]
 */
export function selectAndSetThumbnail(controller, ...videoDataList) { // was: BB7
  const config = controller.api.G(); // was: W
  let thumbnailUrl; // was: m

  for (const videoData of videoDataList) { // was: T
    if (!videoData || (videoData instanceof VideoData && !videoData.videoId)) continue;

    const playerSize = controller.api.bX().getPlayerSize(); // was: m (reused)
    let dpr = getDevicePixelRatio(); // was: K
    const scaledWidth = playerSize.width * dpr; // was: c (reused)
    dpr *= playerSize.height;

    if (scaledWidth > 1280 || dpr > 720) {
      thumbnailUrl = videoData.AdVideoClickthroughMetadata("maxresdefault.jpg");
      if (thumbnailUrl) break;
    }
    if (scaledWidth > 640 || dpr > 480) {
      thumbnailUrl = videoData.AdVideoClickthroughMetadata("maxresdefault.jpg");
      if (thumbnailUrl) break;
    }
    if (scaledWidth > 320 || dpr > 180) {
      thumbnailUrl =
        videoData.AdVideoClickthroughMetadata("sddefault.jpg") ||
        videoData.AdVideoClickthroughMetadata("hqdefault.jpg") ||
        videoData.AdVideoClickthroughMetadata("mqdefault.jpg");
      if (thumbnailUrl) break;
    }
    thumbnailUrl = videoData.AdVideoClickthroughMetadata("default.jpg");
    if (thumbnailUrl) break;
  }

  if (isWebEmbeddedPlayer(config)) {
    const img = new Image(); // was: W (reused)
    img.addEventListener("load", () => {
      bdn();
    });
    img.src = thumbnailUrl ? thumbnailUrl : "";
    controller.api.MetricCondition().tick("ftr");
  }
  controller.K.style.backgroundImage = thumbnailUrl ? `url(${thumbnailUrl})` : "";
}

/**
 * Removes all stored event-listener keys.
 *
 * @param {Object} component  [was: Q]
 *
 * [was: xT0]
 */
export function removeAllListenerKeys(component) { // was: xT0
  for (let i = 0; i < component.keys.length; i++) { // was: c
    component.Xd(component.keys[i]);
  }
  component.keys = [];
}

// ---------------------------------------------------------------------------
// Error message builder  (lines 48970–49034)
// ---------------------------------------------------------------------------

/**
 * Builds a rich error-message virtual-DOM node containing a link.
 * The message is split on `$BEGIN_LINK` / `$END_LINK` markers.
 *
 * @param {Object} controller     [was: Q]
 * @param {string} messageKey     Key into `g.Tw` error strings. [was: c]
 * @param {string} linkUrl        [was: W]
 * @param {boolean} [includeCpn=false]   Include CPN in the template. [was: m]
 * @param {boolean} [useBlankTarget=false]  Force `_blank`. [was: K]
 * @param {string} [heading]      Optional heading text. [was: T]
 * @param {boolean} [includeBreak=true]  Include `<br>` before link. [was: r]
 * @returns {Object} Virtual-DOM `<span>` descriptor.
 *
 * [was: o1]
 */
export function buildErrorMessage(
  controller,
  messageKey,
  linkUrl,
  includeCpn = false,
  useBlankTarget = false,
  heading,
  includeBreak = true,
) { // was: o1
  if (!useBlankTarget) useBlankTarget = controller.api.G().j;
  const videoData = controller.api.getVideoData(); // was: U

  const parts = g
    .LQ(ERROR_MESSAGES[messageKey] || "", includeCpn ? { CPN: videoData.clientPlaybackNonce } : {})
    .split(/\$(BEGIN|MusicTrackHandler)_LINK/); // was: c (reused)

  const children = []; // was: m (reused)
  if (heading) children.push({ C: "h2", eG: heading });
  children.push(parts[0]);
  if (includeBreak) children.push({ C: "br" });
  children.push({
    C: "a",
    N: {
      href: linkUrl,
      target: useBlankTarget ? "_blank" : null,
    },
    Z: "ytp-error-link",
    eG: parts[2],
  });
  controller.A = true; // was: !0
  children.push(parts[4]);

  return { C: "span", V: children };
}

/**
 * Parses a rich-text string with embedded `<a>` link markers into a
 * virtual-DOM `<span>` descriptor.  The input is split by a regex
 * (`qeX`) that delineates link href, target, and text.
 *
 * @param {string} richText  [was: Q]
 * @returns {Object} Virtual-DOM `<span>` descriptor.
 *
 * [was: parseRichTextToVdom]
 */
export function parseRichTextToVdom(richText) { // was: g.rH
  const segments = richText.split(qeX); // was: Q (reused)
  const children = []; // was: c

  for (let i = 0; i < segments.length; i += 3) { // was: W
    const lines = segments[i++].split("\n"); // was: m
    children.push(lines[0]);
    for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) { // was: K
      children.push({ C: "br" });
      children.push(lines[lineIdx]);
    }
    if (i < segments.length) {
      children.push({
        C: "a",
        N: {
          href: segments[i],
          target: segments[i + 1],
        },
        eG: segments[i + 2],
      });
    }
  }

  return { C: "span", V: children };
}

/**
 * Binds click handlers to all `<a>` elements within a component's
 * element subtree.
 *
 * @param {Object} component   [was: Q]
 * @param {Function} handler   [was: c]
 *
 * [was: no0]
 */
export function bindLinkClickHandlers(component, handler) { // was: no0
  const links = component.element.getElementsByTagName("a"); // was: W
  for (let i = 0; i < links.length; i++) { // was: m
    const key = component.B(links[i], "click", handler); // was: K
    component.keys.push(key);
  }
}

// ---------------------------------------------------------------------------
// Overlay insertion ordering  (line 49036)
// ---------------------------------------------------------------------------

/**
 * Inserts an overlay element into a container, respecting
 * `data-overlay-order` attributes for z-ordering.
 *
 * If `useInlineContainer` is true and a matching inline container
 * exists, the element is inserted into that container instead.
 *
 * @param {Object} _context            [was: Q]
 * @param {Element} overlayEl          [was: c]
 * @param {Element} containerEl        [was: W]
 * @param {boolean} useInlineContainer [was: m]
 *
 * [was: Un]
 */
export function insertOverlayByOrder(_context, overlayEl, containerEl, useInlineContainer) { // was: Un
  const order = Number(overlayEl.getAttribute("data-overlay-order")) || 0; // was: K
  let insertIndex = 0; // was: T
  let inlineContainer = null; // was: r

  for (const child of containerEl.children) { // was: U
    if (useInlineContainer && child.classList.contains("ytp-overlay-handleNoSelectableFormats-container")) {
      inlineContainer = child;
      break;
    }
    if (order < (Number(child.getAttribute("data-overlay-order")) || 0)) break;
    insertIndex++;
  }

  if (inlineContainer) {
    insertOverlayByOrder(_context, overlayEl, inlineContainer, false); // was: Un(Q, c, r, !1)
  } else if (useInlineContainer) {
    const wrapper = document.createElement("div"); // was: Q (reused)
    wrapper.classList.add("ytp-overlay-handleNoSelectableFormats-container");
    wrapper.setAttribute("data-overlay-order", `${order}`);
    inlineContainer = wrapper;
    inlineContainer.appendChild(overlayEl);
    Sz(containerEl, inlineContainer, insertIndex);
  } else {
    Sz(containerEl, overlayEl, insertIndex);
  }
}

// ---------------------------------------------------------------------------
// Paid-content overlay  (lines 49057–49104)
// ---------------------------------------------------------------------------

/**
 * Updates the paid-content overlay when the video data changes.
 * Handles video-id transitions and decides whether to show the
 * overlay based on available paid-content metadata.
 *
 * @param {Object} overlay     [was: Q]
 * @param {Object} videoData   [was: c]
 *
 * [was: t3W]
 */
export function updatePaidContentOverlay(overlay, videoData) { // was: t3W
  const paidText = rm_(videoData); // was: W
  const paidDurationMs = UlW(videoData); // was: m

  if (videoData.UY && overlay.U.KB()) return;

  if (overlay.W || overlay.U.X("enable_paid_content_overlay_bugfix")) {
    if (videoData.videoId && videoData.videoId !== overlay.videoId) {
      overlay.W?.fB();
      if (
        !overlay.U.X("enable_paid_content_overlay_bugfix") ||
        (paidText && paidDurationMs)
      ) {
        overlay.videoId = videoData.videoId;
        overlay.j = !!paidDurationMs;
        if (overlay.j && paidText) {
          initPaidContentTimer(overlay, paidDurationMs, paidText, videoData); // was: DTx
        }
      } else {
        overlay.j = false; // was: !1
      }
    }
  } else if (paidText && paidDurationMs && !overlay.U.X("enable_paid_content_overlay_bugfix")) {
    initPaidContentTimer(overlay, paidDurationMs, paidText, videoData); // was: DTx
  }
}

/**
 * Handles player-state changes for the paid-content overlay.
 * Shows the overlay on ad completion (state bit 8), hides on
 * ended/unstarted (bits 2, 64).
 *
 * @param {Object} overlay      [was: Q]
 * @param {Object} playerState  [was: c]
 *
 * [was: H$K]
 */
export function handlePaidContentStateChange(overlay, playerState) { // was: H$K
  if (!overlay.W) return;

  if (playerState.W(8) && overlay.j) {
    overlay.j = false; // was: !1
    if (overlay.O) {
      overlay.O.start();
    } else {
      overlay.Bw();
    }
  } else if ((playerState.W(2) || playerState.W(64)) && overlay.videoId) {
    overlay.videoId = null;
    if (overlay.O) overlay.O.stop();
  }
}

/**
 * Initialises the paid-content overlay timer, navigation endpoint,
 * and visual content (icon, text, chevron).
 *
 * @param {Object} overlay     [was: Q]
 * @param {number} durationMs  Timer duration in ms. [was: c]
 * @param {string} text        Display text. [was: W]
 * @param {Object} videoData   [was: m]
 *
 * [was: DTx]
 */
export function initPaidContentTimer(overlay, durationMs, text, videoData) { // was: DTx
  if (overlay.W) overlay.W.dispose();
  overlay.W = new ThrottleTimer(overlay.HB, durationMs, overlay);
  registerDisposable(overlay, overlay.W);

  const rendererInfo = RI(videoData); // was: m (reused)
  let navEndpoint = rendererInfo?.navigationEndpoint; // was: c (reused)
  const iconType = rendererInfo?.icon?.iconType; // was: m (reused)
  let linkUrl = getProperty(navEndpoint, g.s8)?.url; // was: K

  overlay.U.setTrackingParams(overlay.element, navEndpoint?.clickTrackingParams || null);

  if (navEndpoint && !linkUrl) {
    overlay.innertubeCommand = navEndpoint;
    linkUrl = "#!";
  } else {
    overlay.innertubeCommand = null;
  }

  overlay.A.update({
    href: linkUrl ?? "#",
    text,
    icon:
      iconType === "MONEY_HAND"
        ? {
            C: "svg",
            N: {
              fill: "none",
              height: "100%",
              viewBox: "0 0 24 24",
              width: "100%",
            },
            V: [
              {
                C: "path",
                N: {
                  d: "M6 9H5V5V4H6H19V5H6V9ZM21.72 16.04C21.56 16.8 21.15 17.5 20.55 18.05C20.47 18.13 18.42 20.01 14.03 20.01C13.85 20.01 13.67 20.01 13.48 20C11.3 19.92 8.51 19.23 5.4 18H2V10H5H6H7V6H21V13H16.72C16.37 13.59 15.74 14 15 14H12.7C13.01 14.46 13.56 15 14.5 15H15.02C16.07 15 17.1 14.64 17.92 13.98C18.82 13.26 20.03 13.22 20.91 13.84C21.58 14.32 21.9 15.19 21.72 16.04ZM15 10C15 9.45 14.55 9 14 9C13.45 9 13 9.45 13 10H15ZM20 11C19.45 11 19 11.45 19 12H20V11ZM19 7C19 7.55 19.45 8 20 8V7H19ZM8 8C8.55 8 9 7.55 9 7H8V8ZM8 10H12C12 8.9 12.9 8 14 8C15.1 8 16 8.9 16 10V10.28C16.59 10.63 17 11.26 17 12H18C18 10.9 18.9 10 20 10V9C18.9 9 18 8.1 18 7H10C10 8.1 9.1 9 8 9V10ZM5 13.5V11H3V17H5V13.5ZM20.33 14.66C19.81 14.29 19.1 14.31 18.6 14.71C17.55 15.56 16.29 16 15.02 16H14.5C12.62 16 11.67 14.46 11.43 13.64L11.24 13H15C15.55 13 16 12.55 16 12C16 11.45 15.55 11 15 11H6V13.5V17.16C8.9 18.29 11.5 18.93 13.52 19C17.85 19.15 19.85 17.34 19.87 17.32C20.33 16.9 20.62 16.4 20.74 15.84C20.84 15.37 20.68 14.91 20.33 14.66Z",
                  fill: "white",
                },
              },
            ],
          }
        : null,
    chevron: linkUrl || overlay.innertubeCommand ? chevronRightIcon() : null,
  });
}
