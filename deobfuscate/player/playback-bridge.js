import { addEmbedsConversionParams, callInternalMethod, handleAdClick, handleEmbedsClick, publishEvent } from '../ads/ad-click-tracking.js';
import { registerDisposable } from '../core/event-system.js';
import { getProperty } from '../core/misc-helpers.js';
import { toString } from '../core/string-utils.js';
import { isEmbedWithAudio, isUnpluggedPlatform } from '../data/bandwidth-tracker.js';
import { requiresNativeControls } from '../data/device-context.js';
import { reportErrorWithLevel, reportWarning } from '../data/gel-params.js';
import { isWebExact } from '../data/performance-profiling.js';
import { reportAdsControlFlowError } from '../data/interaction-logging.js'; // was: v1
import { globalEventBuffer } from '../data/module-init.js'; // was: rM
import { toggleAriaHidden } from '../data/interaction-logging.js'; // was: O8
import { graftTrackingParams } from '../ads/ad-async.js'; // was: Qa
import { adSlotRenderer } from '../core/misc-helpers.js'; // was: nz
import { rejectedPromise } from '../core/composition-helpers.js'; // was: cJ
import { updateBadgeControlsVisibility } from './video-loader.js'; // was: pf
import { isCuepointIdentifierLoggingEnabled } from './media-state.js'; // was: Gc
import { setAdErrorStat } from './media-state.js'; // was: j7
import { emitAdsClientStateChange } from './media-state.js'; // was: wQ
import { AdSystemContainerFull } from './bootstrap.js'; // was: xz0
import { isWebKids } from '../data/performance-profiling.js'; // was: Dm
import { isWebClient } from '../data/performance-profiling.js'; // was: XC
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { resolveIconType } from '../ui/svg-icons.js'; // was: F6
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { executeCommand } from '../ads/ad-scheduling.js'; // was: xA
import { numberToHexColor } from '../modules/caption/caption-settings.js'; // was: vA
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { updateToggleButtonState } from '../data/collection-utils.js'; // was: L2
import { startVideoPlayback } from './player-events.js'; // was: SF
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { AdVideoClickthroughMetadata } from '../ads/ad-interaction.js'; // was: ux
import { filter, extend } from '../core/array-utils.js';
import { addClass, removeClass, toggleClass, setStyle } from '../core/dom-utils.js';
import { cueVideoByPlayerVars } from './player-api.js';
import { getCurrentTime } from './time-tracking.js';
import { forEach } from '../core/event-registration.js';
import { isWebEmbeddedPlayer, isWebRemix, isWebUnplugged } from '../data/performance-profiling.js';
import { ContainerComponent } from './container-component.js';
import { shallowClone, getWithDefault } from '../core/object-utils.js';
import { pauseVideo } from './player-events.js';
import { isEmptyOrWhitespace } from '../core/string-utils.js';
import { isEmbedsShortsMode } from '../features/shorts.js';
import { PlayerComponent } from './component.js';
import { logClick } from '../data/visual-element-tracking.js';
import { appendParamsToUrl } from '../core/url-utils.js';
import { formatDuration } from '../ads/ad-async.js';
import { InstreamAdPlayerUnderlay } from '../ads/ad-countdown-timer.js'; // was: XXK
import { isChrome } from '../core/browser-detection.js';
import { binarySearch } from '../core/array-utils.js'; // was: g.H9
import { findFirstByClass } from '../core/dom-utils.js'; // was: g.I_
import { getElementSize } from '../core/dom-utils.js'; // was: g.A4
// TODO: resolve g.Ia
// TODO: resolve g.d8

// Stub: InvideoOverlayComponent [was: WQR] — in-video overlay ad slot (base.js ~122269).
// Extends AdComponent (JU), CSS class "ytp-ad-overlay-slot".  Not yet extracted to its own module.
const InvideoOverlayComponent = WQR; // was: WQR

// Stub: AdSurveyComponent [was: TSO] — ad survey multi-question component (base.js ~122809).
// Extends AdComponent (JU), CSS class "ytp-ad-survey".  Not yet extracted to its own module.
const AdSurveyComponent = TSO; // was: TSO

/**
 * Playback Bridge — bridge between playback mode and polyfills, multi-player
 * presenter coordination, UI component state management, and listener
 * management for player events.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: 56019–57999
 *
 * Key subsystems:
 *   - UI root class helpers (Kq0, kS, YS, lY, pH, TWx)
 *     Add/remove CSS classes on the player root, get player state, cue empty.
 *   - Ad time/position helpers (Qd, cX, oSK)
 *     Current time for ad player types, ad video start offset.
 *   - Ad placement parsing (rwW, IXR)
 *     Extracts ad slots, placements, and SSDAI config from video data.
 *   - Listener broadcast (WX)
 *     Iterates over all registered listeners to dispatch events.
 *   - Cuepoint range conversion (Xiy, cBX)
 *     Converts cuepoint start/end to cue ranges for ad triggers.
 *   - Cuepoint event dispatch (Awd, VkO, eUd, BWn)
 *     Pushes cuepoints to listeners and logs trigger telemetry.
 *   - Ad control flow factory (NWK, mQ, iHy)
 *     Instantiates platform-specific ad control flow classes.
 *   - Ad display overrides (ywm, kcK, jE7, pi3, QDm)
 *     Toggles `ytp-ad-display-override` on the video player element.
 *   - Overlay ad rendering (SHX, Fq_, ZH7, oD, ESn, UR)
 *     Builds text/enhanced/image overlay ad DOM, handles click-through.
 *   - Invideo overlay logic (sE3, dzy, LqW, wix, ID, bHy)
 *     Validates overlay dimensions, opens/closes overlay state.
 *   - Survey ad rendering (gSO, OHO, vS7, $zx, lX0, uf_, x6, CYy, hUX, zUK)
 *     Survey question display, answer selection, multi-step navigation.
 *   - Ad interstitial helpers (eM, RUy, YHX, cjw, eWO)
 *     Show/hide ad components, avatar sizing, layout validation.
 *   - Ad component registry (VMw, HX, JB7, x_W, qR0, N_, n6K, BSR)
 *     Component lookup, preroll detection, slot/layout tracking.
 *   - Endscreen / suggestions (g.yd, shouldShowEndscreen, tMK, HKy, updateScrollIndicators, iKd)
 *     Builds suggestion cards, scrolling, visibility logging.
 *   - Polyfill definitions (Qn, cy3, QW_, IW, mm)
 *     Object.create/defineProperty polyfills, TypedArray names.
 *   - ES2025 polyfills (Symbol.dispose, SuppressedError, String.replaceAll,
 *     Array.at, Promise.withResolvers, Array.findLastIndex)
 *   - Browser detection globals (uS, FK, KmR, g.bw, etc.)
 *     User-agent parsing, feature-flag constants.
 *   - Core geometry (g.zY, g.JP, g.zC, PB)
 *     Point, Size, Rect prototypes with clone/ceil/floor/round/scale.
 *   - DOM helpers (cB, v6m, ahx, GVX)
 *     Document wrapper, focus utilities, performance timer.
 *   - Type guards (n3, df, Ep, n13, $__)
 *     Predicate functions for number, string, thenable, function, object.
 *   - URL/sandbox/CSP helpers (UJ, wS, ISx, TZn, AHm)
 *     URL truncation, referrer chain, sandbox attribute mapping.
 *   - Singleton factory (gf, x9n, BZK)
 *     AE-pattern singleton getter.
 *   - Proto binary format (Yy, Xm, pU, o6, etc.)
 *     ByteString, protobuf tag flags, and binary format constants.
 *
 * [was: Kq0, kS, YS, lY, pH, TWx, Qd, cX, oSK, rwW, IXR, WX, Xiy,
 *  cBX, Awd, VkO, eUd, BWn, NWK, mQ, iHy, ywm, SHX, Fq_, ZH7, oD,
 *  ESn, UR, sE3, dzy, LqW, wix, ID, bHy, jE7, eM, gSO, OHO, vS7,
 *  $zx, lX0, uf_, x6, CYy, hUX, zUK, RUy, kcK, YHX, pi3, QDm, cjw,
 *  eWO, VMw, HX, JB7, x_W, qR0, N_, n6K, BSR, g.yd, shouldShowEndscreen, tMK,
 *  HKy, updateScrollIndicators, iKd, Qn, cy3, QW_, IW, mm, and polyfill/global sections]
 */

// ---------------------------------------------------------------------------
// UI root class helpers  (line 56021)
// ---------------------------------------------------------------------------

/**
 * Removes a listener callback from the component's listener array.
 *
 * @param {Object} component  Player component.          [was: Q]
 * @param {*}      listener   Listener to remove.        [was: c]
 *
 * [was: Kq0]
 */
export function removeComponentListener(component, listener) { // was: Kq0
  component.Ci = component.Ci.filter((l) => l !== listener);
}

/**
 * Adds a CSS class to the player root node.
 *
 * @param {Object} component  Player component.    [was: Q]
 * @param {string} className  CSS class to add.    [was: c]
 *
 * [was: kS]
 */
export function addRootClass(component, className) { // was: kS
  addClass(component.U.getRootNode(), className);
}

/**
 * Removes a CSS class from the player root node.
 *
 * @param {Object} component  Player component.      [was: Q]
 * @param {string} className  CSS class to remove.    [was: c]
 *
 * [was: YS]
 */
export function removeRootClass(component, className) { // was: YS
  removeClass(component.U.getRootNode(), className);
}

/**
 * Returns the player state object for the given player type.
 *
 * @param {Object} component   Player component.   [was: Q]
 * @param {number} [playerType] Player type.        [was: c]
 * @returns {Object}
 *
 * [was: lY]
 */
export function getPlayerState(component, playerType) { // was: lY
  return component.U.getPlayerStateObject(playerType);
}

/**
 * Cues an empty video by ID "empty_video" on player type 2.
 *
 * @param {Object} component  Player component.  [was: Q]
 *
 * [was: pH]
 */
export function cueEmptyVideo(component) { // was: pH
  component.U.cueVideoByPlayerVars({ videoId: "empty_video" }, 2);
}

/**
 * Grants focus to the player when no custom controls are active.
 *
 * @param {Object} component  Player component.       [was: Q]
 * @param {*}      focusTarget Element or flag.        [was: c]
 *
 * [was: TWx]
 */
export function grantPlayerFocus(component, focusTarget) { // was: TWx
  const config = component.U.G(); // was: W
  if (requiresNativeControls(config) || config.controlsType !== "3") return;
  component.U.bX().gr(focusTarget);
}

// ---------------------------------------------------------------------------
// Ad time / position helpers  (line 56048)
// ---------------------------------------------------------------------------

/**
 * Returns the current playback time in seconds for the given player type.
 *
 * @param {Object} component  Player component.       [was: Q]
 * @param {number} [type]     Player type.             [was: c]
 * @param {*}      [opts]     Options.                 [was: W]
 * @returns {number}
 *
 * [was: Qd]
 */
export function getCurrentTimeSec(component, type, opts) { // was: Qd
  return component.getCurrentTimeSec(type, opts);
}

/**
 * Returns the elapsed ad playback time for the given CPN, accounting for
 * the ad's start offset on the playback timeline.
 *
 * @param {Object} component  Player component.  [was: Q]
 * @param {string} cpn        Client playback nonce.  [was: c]
 * @returns {number}          Elapsed seconds (>= 0).
 *
 * [was: cX]
 */
export function getAdElapsedTime(component, cpn) { // was: cX
  const startTime = component.cA.get().zv.get(cpn) ?? null;
  if (startTime === null) {
    reportAdsControlFlowError("Expected ad video start time on playback timeline");
    return 0;
  }
  const currentTime = component.U.getCurrentTime({ playerType: 2, wj: true }); // was: !0
  return currentTime < startTime ? 0 : currentTime - startTime;
}

/**
 * Returns the height of the region below the player overlay.
 *
 * @param {Object} component  Player component.  [was: Q]
 * @returns {number}          Height in pixels.
 *
 * [was: oSK]
 */
export function getBottomOverlayHeight(component) { // was: oSK
  const containerSize = component.U.bX().globalEventBuffer(); // was: c
  const overlayRect = component.U.toggleAriaHidden(true, true); // was: Q (reused)  // was: !0, !0
  return containerSize.height - (overlayRect.height + overlayRect.top);
}

// ---------------------------------------------------------------------------
// Ad placement parsing  (line 56070)
// ---------------------------------------------------------------------------

/**
 * Parses ad placements from a video-data response, adjusting end-time
 * placeholders and extracting SSDAI config.
 *
 * @param {Object} adData     Ad data from video response (or null).  [was: Q]
 * @param {Object} timeRange  {end: number} seekable end in ms.       [was: c]
 * @returns {{RI: Array, adSlots: Array, aU: boolean, ssdaiAdsConfig: Object|undefined}}
 *
 * [was: rwW]
 */
export function parseAdPlacements(adData, timeRange) { // was: rwW
  if (!adData) {
    return { RI: [], adSlots: [], aU: true, ssdaiAdsConfig: undefined }; // was: void 0
  }
  if (adData.trackingParams) graftTrackingParams(adData.trackingParams);
  if (adData.adThrottled) {
    return { RI: [], adSlots: [], aU: true, ssdaiAdsConfig: undefined };
  }

  const adSlots = adData.adSlots ?? []; // was: W
  let playerAds = adData.playerAds ?? []; // was: m
  if (!(playerAds?.length || adSlots.length)) {
    return { RI: [], adSlots, aU: false, ssdaiAdsConfig: undefined };
  }

  playerAds = playerAds.map((a) => a.adPlacementRenderer).filter((a) => !(!a || !a.renderer));
  if (!playerAds.length && !adSlots.length) {
    return { RI: [], adSlots, aU: false, ssdaiAdsConfig: undefined };
  }

  // Fix up "-1" end-time sentinels
  if (timeRange.end > 0) {
    const endStr = timeRange.end.toString(); // was: K
    playerAds.forEach((placement) => {
      const cfg = placement.config?.adPlacementConfig;
      if (cfg && cfg.kind === "AD_PLACEMENT_KIND_MILLISECONDS" && cfg.adTimeOffset
        && cfg.adTimeOffset.offsetEndMilliseconds === "-1"
        && cfg.adTimeOffset.offsetEndMilliseconds !== endStr) {
        cfg.adTimeOffset.offsetEndMilliseconds = endStr;
      }
    });
    adSlots.map((s) => getProperty(s, adSlotRenderer)).forEach((slot) => {
      const trigger = slot?.slotEntryTrigger?.mediaTimeRangeTrigger;
      if (trigger && trigger.offsetEndMilliseconds === "-1") {
        trigger.offsetEndMilliseconds = endStr;
      }
    });
  }

  return { RI: playerAds, adSlots, aU: false, ssdaiAdsConfig: adData.ssdaiAdsConfig };
}

/**
 * Dispatches ad UX update notifications to the player API.
 *
 * @param {Object} component  Player component.  [was: Q]
 * @param {Array}  adUxItems  Ad UX items.        [was: c]
 * @param {*}      state      UX state.            [was: W]
 *
 * [was: IXR]
 */
export function notifyAdUxUpdate(component, adUxItems, state) { // was: IXR
  const wrapped = map(adUxItems, (item) => new Uzw(item, state, item.id));
  publishEvent(component.U, "onAdUxUpdate", wrapped);
}

// ---------------------------------------------------------------------------
// Listener broadcast  (line 56127)
// ---------------------------------------------------------------------------

/**
 * Iterates all registered listeners, invoking `callback` on each.
 *
 * @param {Object}   host      Host with `.listeners` array.  [was: Q]
 * @param {Function} callback  Function to call per listener.  [was: c]
 *
 * [was: WX]
 */
export function broadcastToListeners(host, callback) { // was: WX
  for (const listener of host.listeners) {
    callback(listener);
  }
}

// ---------------------------------------------------------------------------
// Cuepoint range conversion  (line 56132)
// ---------------------------------------------------------------------------

/**
 * Converts a cuepoint descriptor into a cue range and scheduling object.
 *
 * @param {Object}  cuepoint      Cuepoint descriptor.  [was: Q]
 * @param {boolean} allowPredict  Whether to allow predictStart events. [was: c]
 * @returns {{L8: Object, xY: Object}|null}
 *
 * [was: Xiy]
 */
export function cuepointToRange(cuepoint, allowPredict) { // was: Xiy
  let endTime = cuepoint.startSecs + cuepoint.rejectedPromise;
  endTime = endTime <= 0 ? null : endTime;
  if (endTime === null) return null;

  switch (cuepoint.event) {
    case "start":
    case "continue":
    case "stop":
      break;
    case "predictStart":
      if (!allowPredict) return null;
      break;
    default:
      return null;
  }

  const start = Math.max(cuepoint.startSecs, 0);
  return {
    L8: new v7(start, endTime),
    xY: new zg(start, endTime - start, cuepoint.context, cuepoint.identifier, cuepoint.event, cuepoint.W)
  };
}

/**
 * Finds the closest time boundary in the sorted breakpoint list within
 * the given tolerance.
 *
 * @param {Object} breakpoints  Breakpoint container with `.W` sorted array.  [was: Q]
 * @param {number} target       Target time.                                   [was: c]
 * @param {number} tolerance    Maximum distance.                              [was: W]
 * @returns {number|null}       Matched breakpoint, or null.
 *
 * [was: cBX]
 */
export function findNearestBreakpoint(breakpoints, target, tolerance) { // was: cBX
  const idx = binarySearch(breakpoints.W, target);
  if (idx >= 0) return target;
  const insertIdx = -idx - 1;
  return (insertIdx >= breakpoints.W.length || breakpoints.W[insertIdx] > tolerance)
    ? null
    : breakpoints.W[insertIdx];
}

// ---------------------------------------------------------------------------
// Cuepoint event dispatch  (line 56164)
// ---------------------------------------------------------------------------

/**
 * Pushes a cuepoint to the pending list and notifies all listeners.
 *
 * @param {Object} manager   Cuepoint manager.   [was: Q]
 * @param {Object} cuepoint  Cuepoint to push.    [was: c]
 *
 * [was: Awd]
 */
export function dispatchCuepoint(manager, cuepoint) { // was: Awd
  manager.updateBadgeControlsVisibility.push(cuepoint);
  let blocked = false; // was: W  // was: !1
  for (const listener of manager.listeners) {
    blocked = listener.f$(cuepoint) || blocked;
  }
  manager.j = blocked;
  if (isCuepointIdentifierLoggingEnabled(manager.QC.get())) {
    setAdErrorStat(manager.hJ.get(), "onci", `cpi.${cuepoint.identifier};cpe.${cuepoint.event};cps.${cuepoint.startSecs};cbi.${blocked}`);
  }
}

/**
 * Logs a cuepoint trigger event to the ad telemetry system.
 *
 * @param {Object} manager   Cuepoint manager.   [was: Q]
 * @param {Object} cuepoint  Cuepoint data.       [was: c]
 *
 * [was: VkO]
 */
export function logCuepointTrigger(manager, cuepoint) { // was: VkO
  emitAdsClientStateChange(manager.hJ.get(), {
    cuepointTrigger: {
      event: mapCuepointEventType(cuepoint.event), // was: eUd
      cuepointId: cuepoint.identifier,
      totalCueDurationMs: cuepoint.rejectedPromise * 1000, // was: 1E3
      playheadTimeMs: cuepoint.W,
      cueStartTimeMs: cuepoint.startSecs * 1000,
      cuepointReceivedTimeMs: Date.now(),
      contentCpn: manager.U.getVideoData({ playerType: 1 }).clientPlaybackNonce
    }
  });
}

/**
 * Maps a cuepoint event string to its protobuf enum name.
 *
 * @param {string} event  Event string.  [was: Q]
 * @returns {string}
 *
 * [was: eUd]
 */
export function mapCuepointEventType(event) { // was: eUd
  switch (event) {
    case "unknown":      return "CUEPOINT_EVENT_UNKNOWN";
    case "start":        return "CUEPOINT_EVENT_START";
    case "continue":     return "CUEPOINT_EVENT_CONTINUE";
    case "stop":         return "CUEPOINT_EVENT_STOP";
    case "predictStart": return "CUEPOINT_EVENT_PREDICT_START";
    case "prefetch":     return "CUEPOINT_EVENT_PREFETCH";
    default:             return cb(event, "Unexpected cuepoint event");
  }
}

/**
 * Maps a numeric transition reason to its enum value.
 *
 * @param {number} reason  Transition reason (1-7).  [was: Q]
 * @returns {number}
 *
 * [was: BWn]
 */
export function mapTransitionReason(reason) { // was: BWn
  switch (reason) {
    case 1: return 1;
    case 2: return 2;
    case 3: return 3;
    case 4: return 4;
    case 5: return 5;
    case 6: return 6;
    case 7: return 7;
    default: cb(reason, "unknown transitionReason");
  }
}

// ---------------------------------------------------------------------------
// Ad control flow factory  (line 56229)
// ---------------------------------------------------------------------------

/**
 * Creates the platform-specific ad control flow instance based on the
 * player's interface type (desktop polymer, mobile web, TV, etc.).
 *
 * @param {Object} adModule   Ad module.               [was: Q]
 * @param {Object} api        Player API.              [was: c]
 * @param {Object} slotMgr    Slot manager.            [was: W]
 * @param {Object} macros     Macro resolver.          [was: m]
 * @param {Object} opts       Additional options.      [was: K]
 * @returns {Object}          Ad control flow instance.
 *
 * [was: NWK]
 */
export function createAdControlFlow(adModule, api, slotMgr, macros, opts) { // was: NWK
  try {
    const config = api.G(); // was: r
    let flow; // was: T
    if (isWebExact(config))      flow = new AdSystemContainerFull(adModule, api, slotMgr, macros, opts);
    else if (isWebEmbeddedPlayer(config)) flow = new qHR(adModule, api, slotMgr, macros, opts);
    else if (isWebKids(config))   flow = new nS0(adModule, api, slotMgr, macros, opts);
    else if (isWebRemix(config)) flow = new DzR(adModule, api, slotMgr, macros, opts);
    else if (isWebUnplugged(config)) flow = new tkR(adModule, api, slotMgr, macros, opts);
    else throw new TypeError("Unknown web interface");
    return flow;
  } catch {
    const config = api.G();
    reportAdsControlFlowError("Unexpected interface not supported in Ads Control Flow", undefined, undefined, {
      platform: config.W.cplatform,
      interface: config.W.c,
      irG: config.W.cver,
      pjA: config.W.ctheme,
      IgF: config.W.cplayer,
      VBC: config.playerStyle
    });
    return new HH7(adModule, api, slotMgr, opts);
  }
}

/**
 * Returns the ad module's Hc (handler context) from the BY property.
 *
 * @param {Object} adModule  Ad module.  [was: Q]
 * @returns {Object}
 *
 * [was: mQ]
 */
export function getAdHandlerContext(adModule) { // was: mQ
  return adModule.W.BY;
}

/**
 * Returns whether the player is in desktop-polymer non-TV embed mode.
 *
 * @param {Object} api  Player API.  [was: Q]
 * @returns {boolean}
 *
 * [was: iHy]
 */
export function isDesktopPolymerEmbed(api) { // was: iHy
  const config = api.G();
  return isWebClient(config) && !isUnpluggedPlatform(config) && config.playerStyle === "desktop-polymer";
}

// ---------------------------------------------------------------------------
// Ad display override  (line 56270)
// ---------------------------------------------------------------------------

/**
 * Toggles the `ytp-ad-display-override` class on the video player element.
 *
 * @param {boolean} enabled  Whether the override is active.  [was: Q]
 *
 * [was: ywm]
 */
export function setAdDisplayOverride(enabled) { // was: ywm
  const playerEl = findFirstByClass("html5-video-player");
  if (playerEl) toggleClass(playerEl, "ytp-ad-display-override", enabled);
}

// ---------------------------------------------------------------------------
// Overlay ad rendering  (line 56275)
// ---------------------------------------------------------------------------

/**
 * Creates the DOM for a text overlay ad with close button, title,
 * description, and display URL.
 *
 * @param {Object} host  Overlay ad host component.  [was: Q]
 * @returns {Object}     KK template instance.
 *
 * [was: SHX]
 */
export function createTextOverlayAd(host) { // was: SHX
  const template = new ContainerComponent({
    C: "div", Z: "ytp-ad-text-overlay",
    V: [
      { C: "div", Z: "ytp-ad-overlay-ad-info-button-container" },
      { C: "div", Z: "ytp-ad-overlay-close-container",
        V: [{ C: "button", Z: "ytp-ad-overlay-close-button", V: [resolveIconType(TV)] }] },
      { C: "div", Z: "ytp-ad-overlay-title", eG: "{{title}}" },
      { C: "div", Z: "ytp-ad-overlay-desc", eG: "{{description}}" },
      { C: "div", yC: ["ytp-ad-overlay-link-handleNoSelectableFormats-block", "ytp-ad-overlay-link"], eG: "{{displayUrl}}" }
    ]
  });
  host.B(template.z2("ytp-ad-overlay-title"), "click", (evt) => handleOverlayClick(host, template.element, evt));
  host.B(template.z2("ytp-ad-overlay-link"), "click", (evt) => handleOverlayClick(host, template.element, evt));
  host.B(template.z2("ytp-ad-overlay-close-container"), "click", host.jG);
  template.hide();
  return template;
}

/**
 * Creates the DOM for an enhanced (image + text) overlay ad.
 *
 * @param {Object} host  Overlay ad host component.  [was: Q]
 * @returns {Object}     KK template instance.
 *
 * [was: Fq_]
 */
export function createEnhancedOverlayAd(host) { // was: Fq_
  const template = new ContainerComponent({
    C: "div", yC: ["ytp-ad-text-overlay", "ytp-ad-enhanced-overlay"],
    V: [
      { C: "div", Z: "ytp-ad-overlay-ad-info-button-container" },
      { C: "div", Z: "ytp-ad-overlay-close-container",
        V: [{ C: "button", Z: "ytp-ad-overlay-close-button", V: [resolveIconType(TV)] }] },
      { C: "div", Z: "ytp-ad-overlay-text-image",
        V: [{ C: "img", N: { src: "{{imageUrl}}" } }] },
      { C: "div", Z: "ytp-ad-overlay-title", eG: "{{title}}" },
      { C: "div", Z: "ytp-ad-overlay-desc", eG: "{{description}}" },
      { C: "div", yC: ["ytp-ad-overlay-link-handleNoSelectableFormats-block", "ytp-ad-overlay-link"], eG: "{{displayUrl}}" }
    ]
  });
  host.B(template.z2("ytp-ad-overlay-title"), "click", (evt) => handleOverlayClick(host, template.element, evt));
  host.B(template.z2("ytp-ad-overlay-link"), "click", (evt) => handleOverlayClick(host, template.element, evt));
  host.B(template.z2("ytp-ad-overlay-close-container"), "click", host.jG);
  host.B(template.z2("ytp-ad-overlay-text-image"), "click", host.skipNextIcon);
  template.hide();
  return template;
}

/**
 * Creates the DOM for an image-only overlay ad.
 *
 * @param {Object} host  Overlay ad host component.  [was: Q]
 * @returns {Object}     KK template instance.
 *
 * [was: ZH7]
 */
export function createImageOverlayAd(host) { // was: ZH7
  const template = new ContainerComponent({
    C: "div", Z: "ytp-ad-image-overlay",
    V: [
      { C: "div", Z: "ytp-ad-overlay-ad-info-button-container" },
      { C: "div", Z: "ytp-ad-overlay-close-container",
        V: [{ C: "button", Z: "ytp-ad-overlay-close-button", V: [resolveIconType(TV)] }] },
      { C: "div", Z: "ytp-ad-overlay-image",
        V: [{ C: "img", N: { src: "{{imageUrl}}", width: "{{width}}", height: "{{height}}" } }] }
    ]
  });
  host.B(template.z2("ytp-ad-overlay-image"), "click", (evt) => handleOverlayClick(host, template.element, evt));
  host.B(template.z2("ytp-ad-overlay-close-container"), "click", host.jG);
  template.hide();
  return template;
}

/**
 * Handles a click on an overlay ad element: computes click coordinates,
 * resolves macros, triggers navigation endpoints, and pauses playback.
 *
 * @param {Object}      host     Overlay ad host component.   [was: Q]
 * @param {HTMLElement}  element  The clicked overlay element.  [was: c]
 * @param {Event}        event   The click event.               [was: W]
 *
 * [was: oD]
 */
export function handleOverlayClick(host, element, event) { // was: oD
  const macros = shallowClone(host.macros); // was: m
  const size = getElementSize(element); // was: K
  macros.AW = { toString: () => size.width.toString() };
  macros.AH = { toString: () => size.height.toString() };
  const clickPos = g.Ia(event, element).floor(); // was: T
  macros.I_X = { toString: () => clickPos.x.toString() };
  macros.NX = { toString: () => clickPos.x.toString() };
  macros.I_Y = { toString: () => clickPos.y.toString() };
  macros.NY = { toString: () => clickPos.y.toString() };
  macros.NM = { toString: () => host.J.toString() };
  for (const endpoint of host.D) {
    if (host.layoutId) {
      executeCommand(host.numberToHexColor, endpoint, host.layoutId, macros);
    } else {
      reportErrorWithLevel(Error("Missing layoutId for invideo_overlay_ad."));
    }
  }
  host.api.pauseVideo();
}

/**
 * Toggles the overlay-open/overlay-closed classes on the player root.
 *
 * @param {Object}  host    Overlay ad host component.  [was: Q]
 * @param {boolean} isOpen  Whether the overlay is open.  [was: c]
 *
 * [was: ESn]
 */
export function setOverlayOpenState(host, isOpen) { // was: ESn
  const root = host.api.getRootNode();
  toggleClass(root, "ytp-ad-overlay-open", isOpen);
  toggleClass(root, "ytp-ad-overlay-closed", !isOpen);
}

// ---------------------------------------------------------------------------
// Invideo overlay logic  (line 56472)
// ---------------------------------------------------------------------------

/**
 * Validates a text overlay ad and populates its fields if the player
 * window is large enough.
 *
 * @param {Object} host       Overlay ad host component.  [was: Q]
 * @param {Object} renderer   InvideoOverlayAdRenderer.    [was: c]
 * @returns {boolean}         Whether the overlay was shown.
 *
 * [was: sE3]
 */
export function showTextOverlay(host, renderer) { // was: sE3
  if (ID(host, XA) || host.api.isMinimized()) return false;
  const title = oH(renderer.title); // was: W
  const desc = oH(renderer.description); // was: m
  if (isEmptyOrWhitespace(title) || isEmptyOrWhitespace(desc)) return false;

  host.createServerVe(host.A.element, renderer.trackingParams || null);
  host.A.updateValue("title", oH(renderer.title));
  host.A.updateValue("description", oH(renderer.description));
  host.A.updateValue("displayUrl", oH(renderer.displayUrl));
  if (renderer.navigationEndpoint) extend(host.D, renderer.navigationEndpoint);
  host.A.show();
  host.T2.start();
  host.logVisibility(host.A.element, true); // was: !0
  host.B(host.A.element, "mouseover", () => { host.J++; });
  return true;
}

// ---------------------------------------------------------------------------
// Ad component / layout rendering  (line 56753)
// ---------------------------------------------------------------------------

/**
 * Factory for creating ad UI components by layout type.
 *
 * @param {string}  layoutType  Layout type string (e.g. "player-overlay"). [was: Q]
 * @param {Object}  api         Player API.                                [was: c]
 * @param {Object}  macros      Macro resolver.                            [was: W]
 * @param {Object}  vA          Visual action handler.                     [was: m]
 * @param {Object}  [opts={}]   Additional options.                        [was: K]
 * @param {boolean} [flag1=false] Extra flag.                              [was: T]
 * @param {boolean} [flag2=false] Extra flag.                              [was: r]
 * @returns {Object|null}       Created component, or null.
 *
 * [was: eWO]
 */
export function createAdComponent(layoutType, api, macros, numberToHexColor, opts = {}, flag1 = false, flag2 = false) { // was: eWO  // was: !1
  let component;
  switch (layoutType) {
    case "invideo-overlay":
      component = new InvideoOverlayComponent(api, numberToHexColor, opts, macros); break; // was: new WQR()
    case "player-overlay":
      component = new m_y(api, numberToHexColor, opts, macros, new tj(api), flag2); break;
    case "player-overlay-layout":
      component = new KQx(api, numberToHexColor, opts, macros, new tj(api)); break;
    case "survey":
      component = new AdSurveyComponent(api, numberToHexColor, opts, macros); break; // was: new TSO()
    case "ad-action-interstitial":
      component = new o6O(api, numberToHexColor, opts, macros, flag1, flag2); break;
    case "video-interstitial-buttoned-centered":
      component = new rjn(api, numberToHexColor, opts, macros); break;
    case "survey-interstitial":
      component = new U_w(api, numberToHexColor, opts, macros); break;
    case "ad-message":
      component = new Ihm(api, numberToHexColor, opts, macros, new tj(api, 1)); break;
    case "player-underlay":
      component = new InstreamAdPlayerUnderlay(api, numberToHexColor, opts, macros); break; // was: new XXK()
    case "display-underlay-text-grid-cards":
      component = new Aj_(api, numberToHexColor, opts, macros, new tj(api)); break;
    default:
      return null;
  }
  return component;
}

/**
 * Looks up a registered ad component by element ID.
 *
 * @param {Object} registry  Component registry.      [was: Q]
 * @param {Object} ref       Reference with `.id`.     [was: c]
 * @returns {Object|null}    The component, or null.
 *
 * [was: VMw]
 */
export function findAdComponent(registry, ref) { // was: VMw
  const component = getWithDefault(registry.components, ref.id, null);
  if (component == null) reportWarning(Error("Component not found for element id: " + ref.id));
  return component || null;
}

// ---------------------------------------------------------------------------
// Endscreen / suggestions  (line 56884)
// ---------------------------------------------------------------------------

/**
 * Returns whether the endscreen should be shown based on player config
 * and dimensions.
 *
 * @param {Object} api  Player API.  [was: Q]
 * @returns {boolean}
 *
 * [was: shouldShowEndscreen]
 */
export function shouldShowEndscreen(api) { // was: g.D_O
  const config = api.G();
  if (!config.applyQualityConstraint || config.A || !isEmbedWithAudio(config)) return false;
  if (api.isEmbedsShortsMode()) {
    const size = api.toggleAriaHidden();
    return Math.min(size.width, size.height) >= 315;
  }
  return !api.dj();
}

/**
 * Builds the 16 suggestion card DOM elements for the endscreen.
 *
 * @param {Object} endscreen  Endscreen component.  [was: Q]
 *
 * [was: tMK]
 */
export function buildSuggestionCards(endscreen) { // was: tMK
  for (let i = 0; i < 16; ++i) {
    const card = new PlayerComponent({
      C: "a", Z: "ytp-suggestion-link",
      N: { href: "{{link}}", target: endscreen.api.G().Y, "aria-label": "{{aria_label}}" },
      V: [
        { C: "div", Z: "ytp-suggestion-image" },
        { C: "div", Z: "ytp-suggestion-overlay",
          N: { style: "{{blink_rendering_hack}}", "aria-hidden": "{{aria_hidden}}" },
          V: [
            { C: "div", Z: "ytp-suggestion-title", eG: "{{title}}" },
            { C: "div", Z: "ytp-suggestion-author", eG: "{{author_and_views}}" },
            { C: "div", N: { "data-is-live": "{{is_live}}" },
              Z: "ytp-suggestion-duration", eG: "{{duration}}" }
          ]
        }
      ]
    });

    registerDisposable(endscreen, card);
    const link = card.z2("ytp-suggestion-link");
    setStyle(link, "transitionDelay", `${i / 20}s`);
    endscreen.A.B(link, "click", (evt) => {
      const idx = i;
      if (endscreen.O) {
        const suggestion = endscreen.suggestionData[idx];
        const session = suggestion.sessionData;
        if (endscreen.K && endscreen.api.X("web_player_log_click_before_generating_ve_conversion_params")) {
          endscreen.api.logClick(endscreen.W[idx].element);
          let url = suggestion.updateToggleButtonState();
          const params = {};
          addEmbedsConversionParams(endscreen.api, params);
          url = appendParamsToUrl(url, params);
          handleEmbedsClick(url, endscreen.api, evt);
        } else {
          handleAdClick(evt, endscreen.api, endscreen.K, session || undefined) // was: void 0
            && endscreen.api.startVideoPlayback(suggestion.videoId, session, suggestion.playlistId);
        }
      } else {
        evt.preventDefault();
        document.activeElement.blur();
      }
    });
    card.createVisualElement(endscreen.suggestions.element);
    endscreen.W.push(card);
    endscreen.api.createServerVe(card.element, card);
  }
}

/**
 * Logs visibility for suggestion cards currently in view.
 *
 * @param {Object} endscreen  Endscreen component.  [was: Q]
 *
 * [was: HKy]
 */
export function logVisibleSuggestions(endscreen) { // was: HKy
  if (!endscreen.api.G().X("web_player_log_click_before_generating_ve_conversion_params")) return;
  let startIdx = Math.floor(-endscreen.scrollPosition / (endscreen.j + 8));
  const endIdx = Math.min(startIdx + endscreen.columns, endscreen.suggestionData.length) - 1;
  for (; startIdx <= endIdx; startIdx++) {
    endscreen.api.logVisibility(endscreen.W[startIdx].element, true); // was: !0
  }
}

/**
 * Updates the scroll position indicators and navigation button layout.
 *
 * @param {Object} endscreen  Endscreen component.  [was: Q]
 *
 * [was: updateScrollIndicators]
 */
export function updateScrollIndicators(endscreen) { // was: g.SM
  let buttonOffset = endscreen.api.Qh() ? 32 : 16;
  buttonOffset = endscreen.J / 2 + buttonOffset;
  endscreen.next.element.style.bottom = `${buttonOffset}px`;
  endscreen.previous.element.style.bottom = `${buttonOffset}px`;

  const scrollPos = endscreen.scrollPosition;
  const maxScroll = endscreen.containerWidth - endscreen.suggestionData.length * (endscreen.j + 8);
  toggleClass(endscreen.element, "ytp-scroll-min", scrollPos >= 0);
  toggleClass(endscreen.element, "ytp-scroll-max", scrollPos <= maxScroll);
}

/**
 * Populates suggestion card DOM elements with data (titles, thumbnails,
 * durations, links) and hides unused cards.
 *
 * @param {Object} endscreen  Endscreen component.  [was: Q]
 *
 * [was: iKd]
 */
export function populateSuggestionCards(endscreen) { // was: iKd
  const count = endscreen.suggestionData.length;
  for (let i = 0; i < count; ++i) {
    const config = endscreen.api.G();
    const suggestion = endscreen.suggestionData[i];
    const card = endscreen.W[i];

    const authorLine = endscreen.api.isEmbedsShortsMode()
      ? (suggestion.shortViewCount || "")
      : (suggestion.shortViewCount ? `${suggestion.author} \u2022 ${suggestion.shortViewCount}` : suggestion.author);

    card.element.style.display = "";
    setStyle(card.z2("ytp-suggestion-link"), "display", "handleNoSelectableFormats-block");
    if (NS_.test(suggestion.title)) card.z2("ytp-suggestion-title").dir = "rtl";
    if (NS_.test(authorLine)) card.z2("ytp-suggestion-author").dir = "rtl";

    const duration = suggestion.isLivePlayback ? "Live"
      : suggestion.lengthSeconds ? formatDuration(suggestion.lengthSeconds) : "";

    let url = suggestion.updateToggleButtonState(endscreen.api.isEmbedsShortsMode());
    if (isEmbedWithAudio(config) && !config.X("web_player_log_click_before_generating_ve_conversion_params")) {
      const params = {};
      callInternalMethod(endscreen.api, "addEmbedsConversionTrackingParams", [params]);
      url = appendParamsToUrl(url, params);
    }
    if (config.X("web_player_log_click_before_generating_ve_conversion_params")) {
      const itct = suggestion.sessionData?.itct;
      if (itct) endscreen.api.setTrackingParams(card.element, itct);
    }

    card.update({
      author_and_views: authorLine,
      duration,
      link: url,
      title: suggestion.title,
      aria_label: suggestion.ariaLabel || suggestion.title,
      is_live: suggestion.isLivePlayback,
      aria_hidden: !!suggestion.ariaLabel,
      blink_rendering_hack: (isChrome || g.d8) ? "will-change: opacity" : undefined // was: void 0
    });

    const imgEl = card.z2("ytp-suggestion-image");
    const thumbUrl = endscreen.api.isEmbedsShortsMode() ? suggestion.AdVideoClickthroughMetadata("hq2.jpg") : suggestion.AdVideoClickthroughMetadata();
    imgEl.style.backgroundImage = thumbUrl ? `url(${thumbUrl})` : "";
  }

  // Hide unused cards
  if (count < 16) {
    for (let i = count; i < 16; ++i) {
      setStyle(endscreen.W[i].z2("ytp-suggestion-link"), "display", "none");
    }
  }
  updateScrollIndicators(endscreen);
}
