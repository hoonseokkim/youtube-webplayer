import { buildMenuItemDescriptor, callInternalMethod, formatTooltip, insertAtLayer, publishEvent, setMenuItemLabel } from '../ads/ad-click-tracking.js';
import { map, remove } from '../core/array-utils.js';
import { getServiceLocator, storageSet } from '../core/attestation.js';
import { ThrottleTimer, stopAndFire } from '../core/bitstream-helpers.js';
import { M4, getConfig } from '../core/composition-helpers.js';
import { wrapWithErrorReporter } from '../core/dom-listener.js';
import { registerDisposable } from '../core/event-system.js';
import { getProperty } from '../core/misc-helpers.js';
import { isEmbedWithAudio } from '../data/bandwidth-tracker.js';
import { reportErrorWithLevel, reportWarning } from '../data/gel-params.js';
import { parseUrlQueryString } from '../data/idb-transactions.js';
import { isTvHtml5 } from '../data/performance-profiling.js';
import { DJO, zYy } from '../data/session-storage.js';
import { bootstrapInnertube } from '../network/innertube-config.js';
import { buildInnertubeApiPath } from '../network/service-endpoints.js';
import { getCaptionTracks } from './caption-manager.js';
import { getGlobalEntityStore, readEntitiesByType, serializeEntityKey, writeEntityInTransaction } from '../proto/varint-decoder.js';
import { deleteEntitiesInTransaction } from '../proto/varint-decoder.js'; // was: KN7
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { SLOT_MESSAGE_MARKER } from '../proto/messages-core.js'; // was: Ww
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { getProbeVideoElement } from '../media/codec-helpers.js'; // was: IR
import { hasCaptionTracks } from '../ui/seek-bar-tail.js'; // was: OC
import { infoCircleIcon } from '../ui/svg-icons.js'; // was: B1
import { externalLinkIcon } from '../ui/svg-icons.js'; // was: n2
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { setAudioTrackByLanguage } from '../ads/ad-click-tracking.js'; // was: hdR
import { thenCustom } from '../ads/ad-async.js'; // was: j5
import { isSignedIn } from '../data/bandwidth-tracker.js'; // was: fD
import { getPersistedSettingValue } from './video-loader.js'; // was: bb3
import { persistSettingValue } from './video-loader.js'; // was: jbx
import { getUserSettings } from '../ads/ad-async.js'; // was: xD
import { catchCustom } from '../ads/ad-async.js'; // was: fF
import { getSettingValues } from '../network/uri-utils.js'; // was: Wu3
import { uint32UnsignedReader } from '../proto/message-setup.js'; // was: Jj
import { persistSettingsToStorage } from './video-loader.js'; // was: ObR
import { setSettingValue } from '../network/uri-utils.js'; // was: Kun
import { getSecureOrigin } from '../core/event-system.js'; // was: J3
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { clearChildPlaybacksInRange } from './state-init.js'; // was: uM
import { getExperimentFlags } from './time-tracking.js'; // was: Ty()
import { generateUUID } from '../modules/remote/mdx-client.js'; // was: nx
import { isPlayerInNormalState } from '../ads/ad-prebuffer.js'; // was: iDm
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { getRemoteModule } from './caption-manager.js'; // was: w7
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { PATH_TOKEN_REGEX } from '../ui/debug-panel.js'; // was: kDX
import { generateComponentId } from '../data/visual-element-tracking.js'; // was: mU
import { unwrapCommand } from '../data/gel-params.js'; // was: gn
import { createByteRange } from '../media/format-parser.js'; // was: Lk
import { appendQueryParams } from '../network/service-endpoints.js'; // was: fe
import { getTimeInBuffer } from '../media/source-buffer.js'; // was: Tm
import { logPoTokenTiming } from './video-loader.js'; // was: SY
import { getBgeServiceWorkerKey } from '../network/uri-utils.js'; // was: t1
import { createOneOffSigner } from '../core/event-registration.js'; // was: ud
import { appendInitSegment } from '../media/mse-internals.js'; // was: qF
import { FormatInfo } from '../media/codec-tables.js'; // was: OU
import { fetchAttestationChallenge } from '../network/uri-utils.js'; // was: SK
import { StreamzBatcher } from '../data/event-logging.js'; // was: cG
import { IntegrityTokenPipeline } from '../media/grpc-parser.js'; // was: F8d
import { createFadeTransition } from '../core/bitstream-helpers.js'; // was: iB
import { AdVideoClickthroughMetadata } from '../ads/ad-interaction.js'; // was: ux
import { updateToggleButtonState } from '../data/collection-utils.js'; // was: L2
import { buildPingMetadata } from '../data/module-init.js'; // was: Fl
import { scheduleDebounce } from '../core/bitstream-helpers.js'; // was: Xr
import { isDetailPage } from '../data/performance-profiling.js'; // was: BU
import { isLeanback } from '../data/performance-profiling.js'; // was: y_
import { setConfig } from '../core/composition-helpers.js'; // was: y$
import { MetricCondition } from '../data/module-init.js'; // was: X_
import { extractRequestIds } from '../data/interaction-logging.js'; // was: B5m
import { resetBufferPosition } from '../modules/caption/caption-internals.js'; // was: Er
import { getEmbeddedPlayerMode } from '../core/composition-helpers.js'; // was: $n
import { graftTrackingParams } from '../ads/ad-async.js'; // was: Qa
import { loadVideoByPlayerVars, getAvailableAudioTracks, addUtcCueRange, getWatchNextResponse, getWebPlayerContextConfig } from './player-api.js';
import { filter, findIndex } from '../core/array-utils.js';
import { toString } from '../core/string-utils.js';
import { toggleClass, setTextContent, removeNode, removeChildren, setSize, setStyle, addClass, removeClass, createElement, appendChild, getElementsByTagName, showElement } from '../core/dom-utils.js';
import { PlayerError } from '../ui/cue-manager.js';
import { dispose } from '../ads/dai-cue-range.js';
import { listen, safeSetTimeout, safeSetInterval } from '../core/composition-helpers.js';
import { isEmbedsShortsMode } from '../features/shorts.js';
import { setPlaybackRate } from './time-tracking.js';
import { pauseVideo } from './player-events.js';
import { scheduleJob } from '../core/scheduler.js';
import { formatDuration } from '../ads/ad-async.js';
import { appendParamsToUrl } from '../core/url-utils.js';
import { clamp } from '../core/math-utils.js';
import { isEmbedded } from '../data/performance-profiling.js';
import { sendInnertubeRequest } from '../network/innertube-client.js';
import { removeClasses } from '../core/dom-utils.js';
import { invertObject } from '../core/object-utils.js';
import { replaceTemplateVars } from '../core/string-utils.js';
import { VideoData } from '../data/device-platform.js';
import { getElementSize, findFirstByClass } from '../core/dom-utils.js'; // was: g.A4, g.I_
// TODO: resolve g.h
// TODO: resolve g.ip
// TODO: resolve g.kW
// TODO: resolve g.nl
// TODO: resolve g.oo
// TODO: resolve g.xh

/**
 * Video Loader — video loading by player variables, multi-player state
 * machine, PES (Player Embedded Share) integration, and OAuth token
 * handling for next-video transitions.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~47100–48505
 *
 * Key subsystems:
 *   - loadNextVideoByPlayerVars (eYX) — advances the multi-video queue
 *   - PES initialization (xOy) and playback-position persistence (nUO, q6w)
 *   - Suggested-action badge UI (pf, Q4, tFw, Hbm, ru)
 *   - Audio-track preference persistence (gU0, Io, foy, Lyy, wpR, bb3, jbx, Ud, ObR)
 *   - Settings menu helpers (vUR, GD7, $O3, Pv_)
 *   - PO-token (Proof-of-Origin) bootstrap and session management
 *     (HEn, tJm, i2, y4, N2, N4K, FB, iEW, SY, n2O, xJ7, qlK)
 *   - Playlist data model (gu, createVideoDataForPlaylistItem, GFW, $Jy, Pry, v6)
 *   - Embedded player bootstrap via innertube (hzn, lvO)
 *
 * [was: eYX, xOy, q6w, nUO, pf, Q4, DOX, tFw, Hbm, c6, Nt_, ibd,
 *  clearPanelMenuItems, popToRootPanel, yMm, S6d, mc, pushPanel, FyK, EUm, sb0, ZbK, dOn, ru,
 *  gU0, Io, foy, Lyy, wpR, bb3, jbx, Ud, ObR, vUR, GD7, $O3, Pv_,
 *  AT, eY, XB, V4, u07, hY3, xm, Cvw, B6, MFw, Pxm, q2, RYO, Y6x,
 *  ppm, QTK, nY, c70, W80, mJ7, Dz, tT, K8O, T4x, UJX, XVR, A7w,
 *  ezO, VJX, B4d, xJ7, qlK, n2O, HEn, tJm, i2, y4, iEW, SY, N2,
 *  N4K, FB, ZER, populateSuggestionTile, updateAutoplaySuggestion, sT7, du, wu, g2n, sd, dJd, OE0, jTm,
 *  Ed, LY, L8x, fvy, b2, v2W, jY, av3, gu, createVideoDataForPlaylistItem, GFW, $Jy, Pry, v6,
 *  hzn, lvO]
 */

// ---------------------------------------------------------------------------
// Video loading by player variables  (line 47102)
// ---------------------------------------------------------------------------

/**
 * Loads the next video in the multi-video queue using player variables.
 *
 * Retrieves the current entry from the queue, copies the OAuth token from
 * the currently-playing video, then calls `loadVideoByPlayerVars` on the
 * player API with the merged player variables.
 *
 * @param {Object} controller  Multi-video queue controller.
 *   @param {Array}  controller.A        — ordered list of video entries
 *   @param {number} controller.j        — current index in the queue
 *   @param {Object} controller.J        — map from entry id to { playerVars, playerType }
 *   @param {boolean} controller.W       — loading guard flag
 *   @param {Object} controller.api      — player API instance
 *
 * [was: eYX]
 */
export function loadNextVideoByPlayerVars(controller) { // was: eYX
  const entryId = controller.A[controller.j]; // was: c
  if (entryId) {
    const { playerVars, playerType } = controller.J[entryId]; // was: W, m
    controller.W = true; // was: !0
    controller.j++;

    const currentVideoData = controller.api.getVideoData({ // was: c (reused)
      playerType: 1,
    });
    const mergedVars = Object.assign( // was: c (reused)
      { oauth_token: currentVideoData.oauthToken },
      playerVars,
    );

    controller.api.loadVideoByPlayerVars(mergedVars, true, playerType, true); // was: !0, m, !0
    controller.W = false; // was: !1
  }
}

// ---------------------------------------------------------------------------
// PES (Player Embedded Share) integration  (lines 47119–47168)
// ---------------------------------------------------------------------------

/**
 * Ensures the PES (Player Embedded Share) subsystem is initialized.
 * If `controller.W` is not already set, fetches the PES instance via
 * the global `getGlobalEntityStore()` promise.
 *
 * @param {Object} controller
 * @throws {Error} If PES is undefined after awaiting.
 *
 * [was: xOy]
 */
export async function ensurePesInitialized(controller) { // was: xOy
  if (!controller.W) {
    const pes = await getGlobalEntityStore(); // was: c
    if (!pes) throw Error("PES is undefined");
    controller.W = pes;
  }
}

/**
 * Expires stale playback-position entries that exceed the max count or
 * are older than 24 hours (864E5 ms = 86,400,000 ms).
 *
 * Algorithm:
 *   1. Fetch all `videoPlaybackPositionEntity` and `mainVideoEntity`
 *      entries from PES.
 *   2. Exclude positions whose videoId appears in the main video set.
 *   3. Sort remaining by `lastUpdatedClientTimestampMs` descending.
 *   4. Mark entries beyond `controller.A` (max count) or older than
 *      24 h for deletion.
 *   5. Batch-delete via `KN7`.
 *
 * @param {Object} controller
 *   @param {Object}  controller.W  — PES instance
 *   @param {number}  controller.A  — max playback-position entries to keep
 * @throws {Error} If deletion fails.
 *
 * [was: q6w]
 */
export async function expireStalePlaybackPositions(controller) { // was: q6w
  if (controller.W) {
    try {
      let positions = await readEntitiesByType(controller.W, "videoPlaybackPositionEntity"); // was: c
      let mainVideos = await readEntitiesByType(controller.W, "mainVideoEntity"); // was: W

      const mainVideoIds = new Set(mainVideos.map((r) => r.videoId)); // was: m
      const orphanedPositions = positions.filter((r) => !mainVideoIds.has(r.videoId)); // was: K

      orphanedPositions.sort(
        (r, U) =>
          Number(U.lastUpdatedClientTimestampMs) -
          Number(r.lastUpdatedClientTimestampMs),
      );

      const expirationThreshold = Date.now() - 864e5; // was: T — 24 hours in ms
      const keysToDelete = []; // was: c (reused)

      for (let i = 0; i < orphanedPositions.length; i++) { // was: W (reused) for loop var
        const entry = orphanedPositions[i]; // was: r
        if (
          (i >= controller.A ||
            Number(entry.lastUpdatedClientTimestampMs) < expirationThreshold) &&
          entry.key
        ) {
          keysToDelete.push(entry.key);
        }
      }

      await deleteEntitiesInTransaction(controller.W, keysToDelete);
    } catch (err) { // was: m
      throw Error("Failed to expire playback position", { cause: err });
    }
  }
}

/**
 * Persists a video's playback position to PES.
 *
 * Creates or updates a `videoPlaybackPositionEntity` entry.  On the
 * first call for a new video id, also triggers stale-position expiry.
 *
 * @param {Object} controller
 * @param {string} videoId              [was: c]
 * @param {number} positionSeconds      [was: W]
 * @param {number} clientTimestampMs    [was: m]
 * @throws {Error} If persistence fails.
 *
 * [was: nUO]
 */
export async function savePlaybackPosition(controller, videoId, positionSeconds, clientTimestampMs) { // was: nUO
  await ensurePesInitialized(controller); // was: xOy(Q)
  if (controller.W) {
    try {
      const entity = { // was: K
        key: serializeEntityKey(videoId, "videoPlaybackPositionEntity"),
        videoId,
        lastPlaybackPositionSeconds: positionSeconds.toString(),
        lastUpdatedClientTimestampMs: clientTimestampMs.toString(),
      };
      await writeEntityInTransaction(controller.W, entity, "videoPlaybackPositionEntity");

      if (controller.O !== videoId) {
        await expireStalePlaybackPositions(controller); // was: q6w(Q)
        controller.O = videoId;
      }
    } catch (err) { // was: K
      throw Error("Failed to add or update playback position", { cause: err });
    }
  }
}

// ---------------------------------------------------------------------------
// Suggested-action badge UI  (lines 47170–47450)
// ---------------------------------------------------------------------------

/**
 * Toggles the `ytp-suggested-action-badge-with-controls` CSS class on
 * the badge element based on whether controls are active or the
 * secondary flag is unset.
 *
 * @param {Object} badge  Suggested-action badge component.
 *   @param {Object}  badge.badge   — the badge element wrapper
 *   @param {boolean} badge.PA      — controls-active flag
 *   @param {boolean} badge.T2      — secondary visibility flag
 *
 * [was: pf]
 */
export function updateBadgeControlsVisibility(badge) { // was: pf
  toggleClass(
    badge.badge.element,
    "ytp-suggested-action-badge-with-controls",
    badge.PA || !badge.T2,
  );
}

/**
 * Evaluates whether the suggested-action badge should be expanded and
 * triggers the appropriate animation or immediate state change.
 *
 * @param {Object} component    Suggested-action component.
 * @param {boolean} [animate=true]  Whether to use animation timers.
 *                                   [was: c, default !0]
 *
 * [was: Q4]
 */
export function updateBadgeExpansion(component, animate = true) { // was: Q4
  const shouldExpand = component.toggleFineScrub(); // was: W
  if (component.expanded !== shouldExpand) {
    component.expanded = shouldExpand;
    if (animate) {
      component.mainVideoEntityActionMetadataKey.stop();
      component.applyQualityConstraint.stop();
      component.SLOT_MESSAGE_MARKER.stop();
      component.mainVideoEntityActionMetadataKey.start();
    } else {
      component.K.BB(component.expanded);
      toggleClass(
        component.badge.element,
        "ytp-suggested-action-badge-expanded",
        component.expanded,
      );
    }
    component.La();
  }
}

/**
 * Updates the suggested-action badge text, icon, and ARIA labels.
 *
 * If the badge has a custom icon configuration (`dA.iconType`),
 * renders the appropriate SVG inline.
 *
 * @param {Object} component  Suggested-action component.
 *
 * [was: tFw]
 */
export function updateBadgeContent(component) { // was: tFw
  let text = component.text || ""; // was: c
  const titleEl = findFirstByClass("ytp-suggested-action-badge-title", component.element); // was: W
  if (titleEl) setTextContent(titleEl, text);

  component.badge.element.setAttribute("aria-label", text);
  component.dismissButton.element.setAttribute(
    "aria-label",
    component.skipNextIcon ? component.skipNextIcon : "",
  );

  if (component.JJ && component.dA) {
    let icon; // was: c (reused)
    switch (component.dA.iconType) {
      case "SPARK":
        icon = {
          C: "svg",
          N: {
            fill: "white",
            height: "20px",
            viewBox: "0 -960 960 960",
            width: "20px",
          },
          V: [
            {
              C: "path",
              N: {
                d: "M480-96q-6 0-10-4t-6-10q-16-63-49.5-121.5T336-336q-46-46-104.5-79T110-464q-6-2-10-6t-4-10q0-6 4-10t10-6q63-16 121-49t105-79q46-45 79-104t49-122q2-6 6-10t10-4q6 0 10 4t6 10q16 63 49 121.5T624-624q46 46 104.5 79T850-496q6 2 10 6t4 10q0 6-4 10t-10 6q-63 16-122 49t-104 79q-46 47-79 105t-49 121q-2 6-6 10t-10 4Z",
              },
            },
          ],
        };
        break;
      default:
        icon = "";
    }
    component.D.updateValue("icon", icon);
    toggleClass(component.D.element, "ytp-suggested-action-badge-icon-custom-icon", true); // was: !0
  }
}

/**
 * Controls the visibility of the custom icon within a suggested-action badge.
 * If enabled, appends the icon element before the `jG` element; otherwise removes it.
 *
 * @param {Object} component
 * @param {boolean} showIcon  [was: c]
 *
 * [was: Hbm]
 */
export function toggleBadgeIcon(component, showIcon) { // was: Hbm
  if (component.JJ !== showIcon) {
    component.JJ = showIcon;
    if (component.JJ) {
      component.D.createVisualElement(component.jG.element);
    } else {
      removeNode(component.D.element);
    }
  }
}

/**
 * Attempts to focus the back button in a panel. Returns `true` if the
 * button existed and was focused, `false` otherwise.
 *
 * @param {Object} panel  [was: Q]
 * @returns {boolean}
 *
 * [was: c6]
 */
export function focusBackButton(panel) { // was: c6
  if (panel.backButton) {
    panel.backButton.focus();
    return true; // was: !0
  }
  return false; // was: !1
}

/**
 * Toggles the footer hide class on a settings panel.
 *
 * @param {Object} panel    [was: Q]
 * @param {boolean} [hide=false]  Whether to hide the footer. [was: c]
 *
 * [was: Nt_]
 */
export function togglePanelFooterVisibility(panel, hide = false) { // was: Nt_
  if (panel.fJ) {
    toggleClass(panel.z2("ytp-panel-footer"), "ytp-panel-hide-footer", hide);
  }
}

/**
 * Comparator that sorts menu items by descending priority.
 *
 * @param {Object} a  [was: Q]
 * @param {Object} b  [was: c]
 * @returns {number}
 *
 * [was: ibd]
 */
export function compareByPriorityDescending(a, b) { // was: ibd
  return b.priority - a.priority;
}

// ---------------------------------------------------------------------------
// Panel menu management  (lines 47239–47348)
// ---------------------------------------------------------------------------

/**
 * Removes all items from a panel menu, unsubscribing size-change events.
 *
 * @param {Object} panelMenu  [was: Q]
 *
 * [was: clearPanelMenuItems]
 */
export function clearPanelMenuItems(panelMenu) { // was: g.W6
  for (const item of panelMenu.items) { // was: c
    item.unsubscribe("size-change", panelMenu.bq, panelMenu);
  }
  panelMenu.items = [];
  try {
    removeChildren(panelMenu.menuItems.element);
  } catch (err) { // was: c
    reportWarning(
      new PlayerError("Failed to remove menu items from panel menu.", {
        error: err.message,
        originalStack: err.stack,
        childToBeRemoved:
          panelMenu.menuItems.element.firstChild?.textContent ??
          "child element not found",
      }),
    );
  }
  panelMenu.menuItems.publish("size-change");
}

/**
 * Pops the navigation stack back to the root panel.
 * If there are fewer than two panels, does nothing.
 *
 * @param {Object} popupMenu  [was: Q]
 *
 * [was: popToRootPanel]
 */
export function popToRootPanel(popupMenu) { // was: g.KY
  if (popupMenu.W.length <= 1) return;
  const topPanel = popupMenu.W.pop(); // was: c
  const rootPanel = popupMenu.W[0]; // was: W
  popupMenu.W = [rootPanel];
  transitionPanel(popupMenu, topPanel, rootPanel, true); // was: mc(..., !0)
}

/**
 * Measures and resizes the currently-visible panel, accounting for
 * header/footer heights and scroll overflow.
 *
 * @param {Object} popupMenu  [was: Q]
 *
 * [was: yMm]
 */
export function measureAndResizeCurrentPanel(popupMenu) { // was: yMm
  const currentPanel = popupMenu.W[popupMenu.W.length - 1]; // was: c
  if (!currentPanel) return;

  setSize(popupMenu.element, popupMenu.maxWidth || "100%", popupMenu.maxHeight || "100%");
  setStyle(currentPanel.element, "width", "");
  setStyle(currentPanel.element, "height", "");
  setStyle(currentPanel.element, "maxWidth", "100%");
  setStyle(currentPanel.element, "maxHeight", "100%");
  setStyle(currentPanel.content.element, "height", "");

  const size = getElementSize(currentPanel.element); // was: K
  size.width += 1;
  size.height += 1;
  setStyle(currentPanel.element, "width", `${size.width}px`);
  setStyle(currentPanel.element, "height", `${size.height}px`);
  setStyle(currentPanel.element, "maxWidth", "");
  setStyle(currentPanel.element, "maxHeight", "");

  let headerHeight = 0; // was: W
  if (currentPanel.Wu) {
    headerHeight = getElementSize(currentPanel.z2("ytp-panel-header")).height;
  }
  let footerHeight = 0; // was: m
  if (currentPanel.fJ) {
    const footerEl = currentPanel.z2("ytp-panel-footer"); // was: m (reused)
    setStyle(footerEl, "width", `${size.width}px`);
    footerHeight = getElementSize(footerEl).height;
  }
  setStyle(currentPanel.content.element, "height", `${size.height - headerHeight - footerHeight}px`);

  if (currentPanel.element instanceof HTMLElement) {
    const createDatabaseDefinition = currentPanel.element; // was: W (reused)
    const scrollOverflow = createDatabaseDefinition.scrollWidth - createDatabaseDefinition.clientWidth; // was: m (reused)
    if (createDatabaseDefinition.offsetWidth - createDatabaseDefinition.clientWidth > 0 && scrollOverflow > 0) {
      size.width += scrollOverflow;
      setStyle(currentPanel.element, "width", `${size.width}px`);
    }
  }
  popupMenu.size = size;
}

/**
 * Disposes pending panel-transition timers.
 *
 * @param {Object} popupMenu  [was: Q]
 *
 * [was: S6d]
 */
export function disposePanelTransitionTimers(popupMenu) { // was: S6d
  if (popupMenu.A) stopAndFire(popupMenu.A);
  if (popupMenu.j) stopAndFire(popupMenu.j);
}

/**
 * Transitions between two panels within the popup menu, optionally
 * animating the change.
 *
 * @param {Object} popupMenu        [was: Q]
 * @param {Object} outgoingPanel    [was: c]
 * @param {Object} incomingPanel    [was: W]
 * @param {boolean} isBack          Whether this is a back-navigation. [was: m]
 *
 * [was: mc]
 */
export function transitionPanel(popupMenu, outgoingPanel, incomingPanel, isBack) { // was: mc
  disposePanelTransitionTimers(popupMenu); // was: S6d(Q)

  if (outgoingPanel) {
    outgoingPanel.unsubscribe("size-change", popupMenu.OF, popupMenu);
    outgoingPanel.unsubscribe("back", popupMenu.getProbeVideoElement, popupMenu);
  }
  incomingPanel.subscribe("size-change", popupMenu.OF, popupMenu);
  incomingPanel.subscribe("back", popupMenu.getProbeVideoElement, popupMenu);

  if (popupMenu.hasCaptionTracks) {
    addClass(
      incomingPanel.element,
      isBack ? "ytp-panel-animate-back" : "ytp-panel-animate-forward",
    );
    incomingPanel.createVisualElement(popupMenu.content);
    incomingPanel.focus();
    popupMenu.element.scrollLeft = 0;
    popupMenu.element.scrollTop = 0;
    const previousSize = popupMenu.size; // was: K
    measureAndResizeCurrentPanel(popupMenu); // was: yMm(Q)
    setSize(popupMenu.element, previousSize);
    popupMenu.A = new ThrottleTimer(
      () => {
        finishPanelTransition(popupMenu, outgoingPanel, incomingPanel, isBack); // was: FyK
      },
      20,
      popupMenu,
    );
    popupMenu.A.start();
  } else {
    incomingPanel.createVisualElement(popupMenu.content);
    if (outgoingPanel) outgoingPanel.detach();
  }
}

/**
 * Pushes a new panel onto the navigation stack and transitions to it.
 *
 * @param {Object} popupMenu  [was: Q]
 * @param {Object} newPanel   [was: c]
 *
 * [was: pushPanel]
 */
export function pushPanel(popupMenu, newPanel) { // was: g.TN
  const currentPanel = popupMenu.W[popupMenu.W.length - 1]; // was: W
  if (currentPanel !== newPanel) {
    popupMenu.W.push(newPanel);
    transitionPanel(popupMenu, currentPanel, newPanel);
  }
}

/**
 * Completes an animated panel transition by cleaning up animation classes,
 * detaching the outgoing panel, and scheduling final cleanup.
 *
 * @param {Object} popupMenu        [was: Q]
 * @param {Object} outgoingPanel    [was: c]
 * @param {Object} incomingPanel    [was: W]
 * @param {boolean} isBack          [was: m]
 *
 * [was: FyK]
 */
export function finishPanelTransition(popupMenu, outgoingPanel, incomingPanel, isBack) { // was: FyK
  popupMenu.A.dispose();
  popupMenu.A = null;
  addClass(popupMenu.element, "ytp-popup-animating");

  if (isBack) {
    addClass(outgoingPanel.element, "ytp-panel-animate-forward");
    removeClass(incomingPanel.element, "ytp-panel-animate-back");
  } else {
    addClass(outgoingPanel.element, "ytp-panel-animate-back");
    removeClass(incomingPanel.element, "ytp-panel-animate-forward");
  }
  setSize(popupMenu.element, popupMenu.size);

  popupMenu.j = new ThrottleTimer(
    () => {
      removeClass(popupMenu.element, "ytp-popup-animating");
      outgoingPanel.detach();
      removeClasses(outgoingPanel.element, [
        "ytp-panel-animate-back",
        "ytp-panel-animate-forward",
      ]);
      popupMenu.j.dispose();
      popupMenu.j = null;
    },
    250,
    popupMenu,
  );
  popupMenu.j.start();
}

// ---------------------------------------------------------------------------
// Overflow menu item creation helpers  (lines 47350–47441)
// ---------------------------------------------------------------------------

/**
 * Creates an overflow menu item from a renderer object with a
 * `navigationEndpoint`, and wires it to fire an innertube command on click.
 *
 * @param {Object} menu           [was: Q]
 * @param {Object} rendererData   [was: c]  - must have `.text.simpleText`
 * @param {*}      parentMenu     [was: W]
 *
 * [was: EUm]
 */
export function createNavigationMenuItem(menu, rendererData, parentMenu) { // was: EUm
  const label = rendererData?.text?.simpleText; // was: m
  if (label) {
    const item = createMenuItemWithIcon(menu, parentMenu, label, rendererData?.icon, rendererData?.secondaryIcon); // was: W (reused)
    if (rendererData.navigationEndpoint) {
      item.listen(
        "click",
        () => {
          publishEvent(menu.U, "innertubeCommand", rendererData.navigationEndpoint);
          menu.hide();
        },
        menu,
      );
    }
  }
}

/**
 * Creates a service-endpoint menu item.  For "HIDE" icon types, publishes
 * a `featuredproductdismissed` event instead of firing a service endpoint.
 *
 * @param {Object} menu           [was: Q]
 * @param {Object} rendererData   [was: c]
 * @param {*}      parentMenu     [was: W]
 *
 * [was: sb0]
 */
export function createServiceMenuItem(menu, rendererData, parentMenu) { // was: sb0
  const label = rendererData?.text?.simpleText; // was: m
  if (label) {
    createMenuItemWithIcon(menu, parentMenu, label, rendererData?.icon).listen(
      "click",
      () => {
        if (rendererData?.icon?.iconType === "HIDE") {
          menu.U.publish("featuredproductdismissed");
        } else if (rendererData.serviceEndpoint) {
          publishEvent(menu.U, "innertubeCommand", rendererData.serviceEndpoint);
        }
        menu.hide();
      },
      menu,
    );
  }
}

/**
 * Low-level factory that creates a menu-item widget with an icon,
 * optional secondary icon, registers it for disposal, and adds it to
 * the parent menu.
 *
 * @param {Object} menu        [was: Q]
 * @param {*}      parentMenu  [was: c]
 * @param {string} label       [was: W]
 * @param {Object} icon        [was: m]
 * @param {Object} [secondaryIcon]  [was: K]
 * @returns {Object} The created menu item widget.
 *
 * [was: ZbK]
 */
export function createMenuItemWithIcon(menu, parentMenu, label, icon, secondaryIcon) { // was: ZbK
  const item = new g.oo(buildMenuItemDescriptor({}, [], false, !!secondaryIcon), parentMenu, label); // was: c (reused)
  if (secondaryIcon) item.updateValue("secondaryIcon", iconTypeSvg(secondaryIcon));
  item.setIcon(iconTypeSvg(icon));
  registerDisposable(menu, item);
  menu.tF.T7(item, true); // was: !0
  return item;
}

/**
 * Converts an `iconType` renderer to an inline SVG descriptor object.
 *
 * Supported icon types: ACCOUNT_CIRCLE, FLAG, HELP, HIDE, OPEN_IN_NEW.
 *
 * @param {Object|null} iconRenderer  [was: Q]
 * @returns {Object|null} SVG descriptor or null.
 *
 * [was: dOn]
 */
export function iconTypeSvg(iconRenderer) { // was: dOn
  if (!iconRenderer) return null;
  switch (iconRenderer.iconType) {
    case "ACCOUNT_CIRCLE":
      return {
        C: "svg",
        N: { height: "24", viewBox: "0 0 24 24", width: "24" },
        V: [
          {
            C: "path",
            N: {
              d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 1c4.96 0 9 4.04 9 9 0 1.42-.34 2.76-.93 3.96-1.53-1.72-3.98-2.89-7.38-3.03A3.99 3.99 0 0016 9c0-2.21-1.79-4-4-4S8 6.79 8 9c0 1.97 1.43 3.6 3.31 3.93-3.4.14-5.85 1.31-7.38 3.03C3.34 14.76 3 13.42 3 12c0-4.96 4.04-9 9-9zM9 9c0-1.65 1.35-3 3-3s3 1.35 3 3-1.35 3-3 3-3-1.35-3-3zm3 12c-3.16 0-5.94-1.64-7.55-4.12C6.01 14.93 8.61 13.9 12 13.9c3.39 0 5.99 1.03 7.55 2.98C17.94 19.36 15.16 21 12 21z",
              fill: "#fff",
            },
          },
        ],
      };
    case "FLAG":
      return {
        C: "svg",
        N: { fill: "none", height: "24", viewBox: "0 0 24 24", width: "24" },
        V: [
          {
            C: "path",
            N: {
              d: "M13.18 4L13.42 5.2L13.58 6H14.4H19V13H13.82L13.58 11.8L13.42 11H12.6H6V4H13.18ZM14 3H5V21H6V12H12.6L13 14H20V5H14.4L14 3Z",
              fill: "white",
            },
          },
        ],
      };
    case "HELP":
      return infoCircleIcon();
    case "HIDE":
      return {
        C: "svg",
        N: {
          "enable-background": "new 0 0 24 24",
          fill: "#fff",
          height: "24",
          viewBox: "0 0 24 24",
          width: "24",
        },
        V: [
          {
            C: "g",
            V: [
              {
                C: "path",
                N: {
                  d: "M16.24,9.17L13.41,12l2.83,2.83l-1.41,1.41L12,13.41l-2.83,2.83l-1.41-1.41L10.59,12L7.76,9.17l1.41-1.41L12,10.59 l2.83-2.83L16.24,9.17z M4.93,4.93c-3.91,3.91-3.91,10.24,0,14.14c3.91,3.91,10.24,3.91,14.14,0c3.91-3.91,3.91-10.24,0-14.14 C15.17,1.02,8.83,1.02,4.93,4.93z M18.36,5.64c3.51,3.51,3.51,9.22,0,12.73s-9.22,3.51-12.73,0s-3.51-9.22,0-12.73 C9.15,2.13,14.85,2.13,18.36,5.64z",
                },
              },
            ],
          },
        ],
      };
    case "OPEN_IN_NEW":
      return externalLinkIcon();
  }
}

/**
 * Initializes the suggested-action component when its visibility state
 * changes: sets enabled/visible flags, updates expansion, refreshes
 * thumbnail, and manages dismiss/overflow button visibility.
 *
 * @param {Object} component  Suggested-action component. [was: Q]
 *
 * [was: ru]
 */
export function initializeSuggestedActionVisibility(component) { // was: ru
  if (!component.isInitialized) return;
  component.enabled = component.isVisible;
  component.Ka = component.isVisible;
  updateBadgeExpansion(component); // was: Q4(Q)
  component.O();
  component.thumbnailImage.BB(component.isVisible);
  if (!component.shouldHideDismissButton) {
    component.dismissButton.BB(component.isVisible);
  }
  if (component.shouldShowOverflowButton) {
    component.overflowButton.BB(component.isVisible);
  }
}

// ---------------------------------------------------------------------------
// Audio track preference persistence  (lines 47452–47536)
// ---------------------------------------------------------------------------

/**
 * Applies an audio track selection and persists the preference to the
 * player settings store if applicable.
 *
 * @param {Object} controller   [was: Q]
 * @param {string} trackId      Audio track language id. [was: c]
 * @param {boolean} persist     Whether to persist. [was: W]
 *
 * [was: gU0]
 */
export function applyAudioTrackPreference(controller, trackId, persist) { // was: gU0
  if (!persist) return;
  let selectedId = ""; // was: m
  if (findAudioTrackById(controller, trackId)) {
    selectedId = trackId;
    controller.api.G().parseHexColor = trackId;
  }
  if (selectedId && isAudioTrackPersistable(controller, selectedId)) {
    setAudioTrackByLanguage(controller.api, selectedId);
    thenCustom(isSignedIn(controller.api.G(), controller.api.getVideoData()?.D()), (settingEntity) => { // was: K
      const currentSettingId = selectedId; // was: T
      if (getPersistedSettingValue(settingEntity) !== currentSettingId) {
        persistSettingValue(
          controller,
          getSettingItemId(settingEntity), // was: Ud(K)
          { stringValue: currentSettingId },
        );
      }
    });
  }
}

/**
 * Restores the audio-track preference from the persisted settings store.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: Io]
 */
export function restoreAudioTrackPreference(controller) { // was: Io
  if (getUserSettings()?.size) {
    thenCustom(isSignedIn(controller.api.G(), controller.api.getVideoData()?.D()), (settingEntity) => { // was: c
      const id = getPersistedSettingValue(settingEntity); // was: c (reused) — bb3
      if (id && isAudioTrackPersistable(controller, id)) {
        controller.api.G().parseHexColor = id;
      }
    });
  }
}

/**
 * Fetches audio-track settings from the innertube settings service
 * and applies them locally.
 *
 * @param {Object} controller  [was: Q]
 * @param {Object} settingEntity  [was: c]
 *
 * [was: foy]
 */
export function syncAudioTrackSettings(controller, settingEntity) { // was: foy
  catchCustom(
    thenCustom(
      thenCustom(controller.uint32UnsignedReader(), (svc) => getSettingValues(svc, [getSettingItemId(settingEntity)])), // was: W
      (result) => { // was: W
        if (result) {
          for (const { key, value } of result) { // was: m, K
            if (key && value) {
              persistSettingsToStorage([{ settingItemId: key, settingOptionValue: value }]);
              restoreAudioTrackPreference(controller); // was: Io(Q)
            }
          }
        }
      },
    ),
    () => {
      controller.W = true; // was: !0
    },
  );
}

/**
 * Finds an audio track by its language id.
 *
 * @param {Object} controller  [was: Q]
 * @param {string} trackId     [was: c]
 * @returns {Object|null} The audio track, or null.
 *
 * [was: Lyy]
 */
export function findAudioTrackById(controller, trackId) { // was: Lyy
  const tracks = controller.api.getAvailableAudioTracks(); // was: Q (reused)
  for (const track of tracks) { // was: W
    if (track.getLanguageInfo().getId() === trackId) return track;
  }
  return null;
}

/**
 * Returns whether a given audio-track id is persistable (non-empty
 * base language and video supports audio-track switching).
 *
 * @param {Object} controller  [was: Q]
 * @param {string} trackId     [was: c]
 * @returns {boolean}
 *
 * [was: wpR]
 */
export function isAudioTrackPersistable(controller, trackId) { // was: wpR
  return (
    trackId.split(".")[0] !== "" && controller.api.getVideoData()?.T0()
  );
}

/**
 * Reads the persisted setting value from a setting entity.
 *
 * @param {Object} settingEntity  [was: Q]
 * @returns {string} The stored string value, or empty string.
 *
 * [was: bb3]
 */
export function getPersistedSettingValue(settingEntity) { // was: bb3
  let result; // was: Q (reused)
  {
    const itemId = getSettingItemId(settingEntity); // was: Q (reused)
    const settingsMap = getUserSettings(); // was: c
    result = settingsMap ? settingsMap.get(itemId) : undefined; // was: void 0
  }
  return result && result.stringValue ? result.stringValue : "";
}

/**
 * Persists a setting key-value pair to innertube and the local cache.
 *
 * @param {Object} controller     [was: Q]
 * @param {string} settingItemId  [was: c]
 * @param {Object} settingValue   [was: W]
 *
 * [was: jbx]
 */
export function persistSettingValue(controller, settingItemId, settingValue) { // was: jbx
  persistSettingsToStorage([{ settingItemId, settingOptionValue: settingValue }]);
  thenCustom(controller.uint32UnsignedReader(), (svc) => { // was: m
    setSettingValue(svc, settingItemId, settingValue);
  });
}

/**
 * Derives a numeric setting-item id from a setting entity.
 * Returns "484" for falsy entities or "483" for truthy ones.
 *
 * @param {*} settingEntity  [was: Q]
 * @returns {string}
 *
 * [was: Ud]
 */
export function getSettingItemId(settingEntity) { // was: Ud
  let id = (484).toString(); // was: c
  if (settingEntity) id = (483).toString();
  return id;
}

/**
 * Persists an array of setting items to the `yt-player-user-settings`
 * cookie (2,592,000 seconds = 30 days TTL).
 *
 * @param {Array<{settingItemId: string, settingOptionValue: *}>} items  [was: Q]
 *
 * [was: ObR]
 */
export function persistSettingsToStorage(items) { // was: ObR
  let settingsMap = getUserSettings(); // was: c
  if (!settingsMap) settingsMap = new Map();
  for (const item of items) { // was: W
    settingsMap.set(item.settingItemId, item.settingOptionValue);
  }
  const serialized = JSON.stringify(Object.fromEntries(settingsMap)); // was: Q (reused)
  storageSet("yt-player-user-settings", serialized, 2592e3);
}

// ---------------------------------------------------------------------------
// Settings menu helpers  (lines 47538–47598)
// ---------------------------------------------------------------------------

/**
 * Unchecks the currently-selected option in a settings menu.
 *
 * @param {Object} settingsMenu  [was: Q]
 *
 * [was: vUR]
 */
export function uncheckCurrentOption(settingsMenu) { // was: vUR
  if (settingsMenu.L) {
    const item = settingsMenu.options[settingsMenu.L]; // was: c
    item.element.getAttribute("aria-checked");
    item.element.setAttribute("aria-checked", "false");
    settingsMenu.L = null;
  }
}

/**
 * Rebuilds the settings-panel menu from a new list of option keys.
 *
 * Reuses existing option widgets where possible (matching key + priority),
 * disposes orphaned ones, and respects section headers.
 *
 * @param {Object} settingsMenu    [was: Q]
 * @param {Array}  optionKeys      [was: c]
 *
 * [was: GD7]
 */
export function rebuildSettingsMenu(settingsMenu, optionKeys) { // was: GD7
  clearPanelMenuItems(settingsMenu.getSecureOrigin); // was: g.W6(Q.J3)
  const newOptions = {}; // was: W
  let hasCheckedItem = false; // was: m

  for (let i = 0; i < optionKeys.length; i++) { // was: T
    let key = optionKeys[i]; // was: K
    if (key instanceof aod) {
      // Section header
      const headerItem = new g.oo( // was: K (reused)
        {
          C: "div",
          yC: ["ytp-menuitem", "ytp-menuitem-section-header"],
          N: { "aria-disabled": "true" },
          V: [{ C: "div", yC: ["ytp-menuitem-label"], eG: "{{label}}" }],
        },
        -i,
        key.label,
      );
      settingsMenu.getSecureOrigin.T7(headerItem, true); // was: !0
    } else {
      let item = settingsMenu.options[key]; // was: r (inside else)
      const isChecked = key === settingsMenu.L; // was: U
      if (isChecked) hasCheckedItem = true;

      if (item && item.priority === -i) {
        setMenuItemLabel(settingsMenu.options[key], settingsMenu.A(key, true)); // was: !0
        delete settingsMenu.options[key];
      } else {
        item = settingsMenu.Y(key, -i, isChecked);
      }

      newOptions[key] = item;
      settingsMenu.getSecureOrigin.T7(item, true); // was: !0
    }
  }

  if (!hasCheckedItem) settingsMenu.L = null;

  for (const orphanKey of Object.keys(settingsMenu.options)) { // was: T
    settingsMenu.options[orphanKey].dispose();
  }
  settingsMenu.options = newOptions;
}

/**
 * Delegates footer visibility to the settings panel.
 *
 * @param {Object} settingsMenu  [was: Q]
 * @param {boolean} [hide=false]  [was: c]
 *
 * [was: $O3]
 */
export function toggleSettingsFooter(settingsMenu, hide = false) { // was: $O3
  togglePanelFooterVisibility(settingsMenu.getSecureOrigin, hide); // was: Nt_(Q.J3, c)
}

/**
 * Populates the sleep-timer submenu with time options.
 * Appends "End of video" for non-live content and "End of playlist"
 * when a non-radio playlist is active.
 *
 * @param {Object} sleepTimerMenu  [was: Q]
 *
 * [was: Pv_]
 */
export function populateSleepTimerOptions(sleepTimerMenu) { // was: Pv_
  const options = "Off 10 15 20 30 45 60".split(" "); // was: c
  if (!sleepTimerMenu.U.getVideoData()?.isLivePlayback) {
    options.push("End of video");
  }
  const playlist = sleepTimerMenu.U.getPlaylist(); // was: W
  if (playlist && playlist.listId?.type !== "RD") {
    options.push("End of playlist");
  }
  sleepTimerMenu.j(map(options, sleepTimerMenu.K));
  sleepTimerMenu.jG = invertObject(options, sleepTimerMenu.K, sleepTimerMenu);
  const endOfVideoKey = sleepTimerMenu.K("End of video"); // was: c (reused)
  if (sleepTimerMenu.options[endOfVideoKey]) {
    setMenuItemLabel(sleepTimerMenu.options[endOfVideoKey], sleepTimerMenu.S);
  }
}

// ---------------------------------------------------------------------------
// Pointer/touch event helpers  (lines 47598–47629)
// ---------------------------------------------------------------------------

/**
 * Disposes the current pointer-event state of a component.
 *
 * @param {Object} component  [was: Q]
 *
 * [was: AT]
 */
export function disposePointerState(component) { // was: AT
  component.K = null;
  component.J = null;
  component.B(pointerEventName("over"), component.Z3); // was: XB("over")
  component.B("touchstart", component.L);
  if (component.W) component.B(pointerEventName("down"), component.jG); // was: XB("down")
}

/**
 * Toggles the hidden state of a drag-handle element.
 *
 * @param {Object} component  [was: Q]
 *
 * [was: eY]
 */
export function toggleDragHandleVisibility(component) { // was: eY
  component.j.O(!component.W);
}

/**
 * Returns the correct pointer event name, accounting for MS-prefixed events.
 *
 * @param {string} suffix  Event suffix, e.g. "over", "down". [was: Q]
 * @returns {string} Full event name.
 *
 * [was: XB]
 */
export function pointerEventName(suffix) { // was: XB
  return window.navigator.msPointerEnabled
    ? `MSPointer${suffix.charAt(0).toUpperCase()}${suffix.substring(1)}`
    : `mouse${suffix}`;
}

/**
 * Returns the appropriate document for a given element, using the shadow
 * root's host document if applicable.
 *
 * @param {Element} element  [was: Q]
 * @returns {Document}
 *
 * [was: V4]
 */
export function getOwnerDocument(element) { // was: V4
  return element && lon ? isInAdPlayback(element) || document : document;
}

/**
 * Finds the changed touch matching a stored touch identifier.
 *
 * @param {Object} component   [was: Q]
 * @param {TouchEvent} event   [was: c]
 * @returns {Touch|null}
 *
 * [was: u07]
 */
export function findMatchingTouch(component, event) { // was: u07
  for (let i = 0; i < event.changedTouches.length; i++) { // was: W
    const touch = event.changedTouches[i]; // was: m
    if (touch.identifier === component.J) return touch;
  }
  return null;
}

/**
 * Sets the global flag controlling shadow-root-aware document lookup.
 *
 * @param {boolean} value  [was: Q]
 *
 * [was: hY3]
 */
export function setShadowRootDocumentMode(value) { // was: hY3
  lon = value;
}

// ---------------------------------------------------------------------------
// Speed-master (long-press fast-forward)  (lines 47631–47656)
// ---------------------------------------------------------------------------

/**
 * Re-evaluates whether the speed-master (long-press 2x speed) feature
 * should be active based on the current video state and configuration.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: xm]
 */
export function updateSpeedmasterEligibility(controller) { // was: xm
  const videoData = controller.api.getVideoData(); // was: c
  const experiments = controller.api.G().experiments; // was: W
  const isEligible =
    !!controller.Y &&
    !videoData?.isLivePlayback &&
    !(experiments.getExperimentFlags.W.BA(zYy) && videoData?.clearChildPlaybacksInRange()) &&
    !controller.api.generateUUID() &&
    controller.api.getPresentingPlayerType() !== 2 &&
    !controller.api.getPlayerStateObject().W(2) &&
    !g.ip(controller.api)?.dj() &&
    !controller.api.isEmbedsShortsMode() &&
    isPlayerInNormalState(controller.api.OV()); // was: c (reused)

  if (controller.j !== isEligible) {
    controller.j = isEligible;
    if (controller.j) {
      controller.W.subscribe("dragstart", controller.S, controller);
    } else {
      controller.W.unsubscribe("dragstart", controller.S, controller);
      controller.W.unsubscribe("dragmove", controller.D, controller);
      controller.W.unsubscribe("dragend", controller.K, controller);
      resetSpeedmaster(controller); // was: B6(Q)
    }
  }
}

/**
 * Handles keyboard activation of speedmaster (space-key long-press).
 *
 * @param {Object} controller  [was: Q]
 * @param {KeyboardEvent} event  [was: c]
 * @param {boolean} isDown       [was: W]
 * @param {boolean} isUp         [was: m]
 *
 * [was: Cvw]
 */
export function handleSpeedmasterKeyboard(controller, event, isDown, isUp) { // was: Cvw
  if (!isDown) {
    if (isUp) {
      if (
        event.keyCode !== 32 ||
        event.repeat ||
        controller.A ||
        !controller.j ||
        controller.delay.cw()
      ) {
        // no-op
      }
    } else {
      resetSpeedmaster(controller); // was: B6(Q)
    }
  }
}

/**
 * Resets the speedmaster state: stops the delay timer, restores original
 * playback rate, re-shows controls, and optionally pauses the video.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: B6]
 */
export function resetSpeedmaster(controller) { // was: B6
  controller.delay.stop();
  controller.W.unsubscribe("dragmove", controller.D, controller);
  controller.W.unsubscribe("dragend", controller.K, controller);
  if (controller.A) {
    controller.A = false; // was: !1
    controller.speedmasterUserEdu.K();
    controller.api.setPlaybackRate(controller.isSamsungSmartTV);
    controller.api.showControls();
    if (controller.Ie) controller.api.pauseVideo();
    if (controller.X("enable_smart_skip_speedmaster_on_web")) {
      controller.api.publish("speedmasterchanged", false); // was: !1
    }
  }
}

// ---------------------------------------------------------------------------
// Stations cue-range registration  (line 47658)
// ---------------------------------------------------------------------------

/**
 * Registers UTC cue-ranges for station playback-position markers.
 *
 * @param {Object} controller          [was: Q]
 * @param {Array}  markers             [was: c]
 * @param {string} stationNamespace    [was: W]
 *
 * [was: MFw]
 */
export function registerStationCueRanges(controller, markers, stationNamespace) { // was: MFw
  for (const marker of markers) { // was: m
    const startTimeSec =
      Number(marker.playbackRelativePosition?.utcTimeMs) / 1e3; // was: c (reused)
    const endTimeSec = startTimeSec + Number(marker.duration?.seconds); // was: K
    const cueId = `stations:${stationNamespace}:${startTimeSec}`; // was: T

    if (!controller.O.has(cueId)) {
      controller.O.add(cueId);
      if (marker.onEnter) controller.W[cueId] = marker.onEnter;
      controller.api.addUtcCueRange(cueId, startTimeSec, endTimeSec, stationNamespace, false); // was: !1
    }
  }
}

// ---------------------------------------------------------------------------
// Format / codec description  (line 47669)
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable codec description string for a format, e.g.
 * `"vp9 (137)"` or just the itag if no codec is found.
 *
 * @param {Object} format  [was: Q]
 * @returns {string}
 *
 * [was: Pxm]
 */
export function getFormatCodecDescription(format) { // was: Pxm
  const match = /codecs="([^"]*)"/.exec(format.mimeType); // was: c
  return match && match[1] ? match[1] + " (" + format.itag + ")" : format.itag;
}

// ---------------------------------------------------------------------------
// Audio visualiser (canvas-based waveform)  (lines 47674–47727)
// ---------------------------------------------------------------------------

/**
 * Initialises or updates the audio-visualiser canvas, then renders new
 * sample data as coloured vertical bars.
 *
 * On first call (`heightPx === -1`), creates either a `<canvas>` element
 * or a set of `<span>` elements as a fallback when Canvas 2D is
 * unavailable.  Subsequent calls render the provided sample values.
 *
 * @param {Object} visualiser   [was: Q]
 * @param {Array<number>} samples  [was: c]
 *
 * [was: q2]
 */
export function renderAudioVisualiser(visualiser, samples) { // was: q2
  // --- First-time initialisation ---
  if (visualiser.heightPx === -1) {
    let canvasEl = null; // was: W
    try {
      canvasEl = createElement("CANVAS");
      visualiser.O = canvasEl.getContext("2d");
    } catch (_err) {} // was: r

    if (visualiser.O) {
      const totalWidth = visualiser.W * visualiser.sampleCount; // was: m
      visualiser.A = canvasEl;
      visualiser.A.width = totalWidth;
      visualiser.A.style.width = `${totalWidth}px`;
      visualiser.element.appendChild(visualiser.A);
    } else {
      // Fallback: reduce sample count, increase bar width
      visualiser.sampleCount = Math.floor(visualiser.sampleCount / 4);
      visualiser.W *= 4;
      for (let i = 0; i < visualiser.sampleCount; i++) { // was: W (reused)
        const bar = createElement("SPAN"); // was: m
        bar.style.width = `${visualiser.W}px`;
        bar.style.left = `${visualiser.W * i}px`;
        visualiser.element.appendChild(bar);
      }
    }
  }

  // --- Height recalibration ---
  let clientHeight = visualiser.element.clientHeight || 24; // was: W (reused)
  if (clientHeight !== visualiser.heightPx) {
    visualiser.heightPx = clientHeight;
    if (visualiser.O) {
      const scaleFactor = (window.devicePixelRatio || 1) > 1 ? 2 : 1; // was: W (reused)
      visualiser.A.height = visualiser.heightPx * scaleFactor;
      visualiser.A.style.height = `${visualiser.heightPx}px`;
      visualiser.O.scale(1, scaleFactor);
    }
  }

  // --- Render samples ---
  for (const sampleValue of samples) { // was: K
    const vis = visualiser; // was: c (alias)
    const idx = visualiser.index; // was: T
    let colourIdx = 0; // was: W (reused)

    // Find which colour range this sample falls into
    for (; colourIdx + 2 < vis.j.length && vis.j[colourIdx + 1] < sampleValue; ) {
      colourIdx++;
    }
    const ratio = Math.min(1, (sampleValue - vis.j[colourIdx]) / (vis.j[colourIdx + 1] - vis.j[colourIdx])); // was: m

    if (vis.O) {
      // Canvas rendering
      vis.O.fillStyle = vis.K[colourIdx];
      vis.O.fillRect(idx * vis.W, 0, vis.W, vis.heightPx);
      vis.O.fillStyle = vis.K[colourIdx + 1];
      vis.O.fillRect(idx * vis.W, vis.heightPx * (1 - ratio), vis.W, vis.heightPx);
    } else {
      // Fallback span rendering
      const bar = vis.element.children[idx]; // was: T (reused)
      const dpr = window.devicePixelRatio || 1; // was: r
      const barHeight = Math.min(vis.heightPx, Math.round(vis.heightPx * ratio * dpr) / dpr) || 0; // was: m (reused)
      bar.style.height = `${barHeight}px`;
      bar.style.backgroundColor = vis.K[colourIdx + 1];
      bar.style.borderTop = `solid ${vis.heightPx - barHeight}px ${vis.K[colourIdx]}`;
    }
    visualiser.index = (visualiser.index + 1) % visualiser.sampleCount;
  }

  // Clear the next sample slot
  const nextIdx = visualiser.index; // was: K (reused)
  if (visualiser.O) {
    visualiser.O.clearRect(nextIdx * visualiser.W, 0, visualiser.W, visualiser.heightPx);
  } else {
    const nextBar = visualiser.element.children[nextIdx]; // was: Q (reused)
    nextBar.style.height = "0px";
    nextBar.style.borderTop = "";
  }
}

// ---------------------------------------------------------------------------
// Stats-for-nerds overlay  (line 47729)
// ---------------------------------------------------------------------------

/**
 * Creates or toggles the stats-for-nerds overlay.
 *
 * @param {Object} controller  [was: Q]
 * @param {boolean} show       [was: c]
 *
 * [was: RYO]
 */
export function toggleStatsForNerds(controller, show) { // was: RYO
  const wasVisible = !!controller.getSecureOrigin?.Q1(); // was: W
  if (!controller.getSecureOrigin) {
    controller.getSecureOrigin = new JMx(controller.api);
    registerDisposable(controller, controller.getSecureOrigin);
    insertAtLayer(controller.api, controller.getSecureOrigin.element, 4);
  }
  controller.getSecureOrigin.BB(show);
  const remoteModule = getRemoteModule(controller.api.CO()); // was: m
  if (remoteModule && remoteModule.loaded && wasVisible !== show) {
    remoteModule.Sz();
  }
  if (show) controller.api.RetryTimer("sfn", {}, true); // was: !0
}

// ---------------------------------------------------------------------------
// SVG path animation helpers  (lines 47740–47795)
// ---------------------------------------------------------------------------

/**
 * Parses an SVG path `d` attribute into a mixed array of numbers and
 * string tokens (commands, spaces).
 *
 * @param {string} pathData  [was: Q]
 * @returns {Array<number|string>}
 *
 * [was: Y6x]
 */
export function parseSvgPathTokens(pathData) { // was: Y6x
  const tokens = []; // was: c
  const parts = pathData.match(PATH_TOKEN_REGEX); // was: Q (reused)
  for (let i = 0; i < parts.length; i++) { // was: W
    const numVal = parts[i] === " " ? NaN : Number(parts[i]); // was: m
    tokens.push(isNaN(numVal) ? parts[i] : numVal);
  }
  return tokens;
}

/**
 * Interpolates between two parsed SVG path token arrays at a given
 * progress ratio.  String tokens are passed through as-is; numeric
 * tokens are linearly interpolated.
 *
 * @param {Array} fromTokens   [was: Q]
 * @param {Array} toTokens     [was: c]
 * @param {number} progress    0..1  [was: W]
 * @returns {string}
 *
 * [was: ppm]
 */
export function interpolateSvgPath(fromTokens, toTokens, progress) { // was: ppm
  let result = ""; // was: m
  for (let i = 0; i < fromTokens.length; i++) { // was: K
    const token = fromTokens[i]; // was: T
    result =
      typeof token === "number"
        ? result + (token + (toTokens[i] - token) * progress)
        : result + token;
  }
  return result;
}

/**
 * Extracts the `d` attribute from the first `<path>` element in an
 * SVG descriptor tree.
 *
 * @param {Object} _root      [was: Q]  — unused context
 * @param {Object} descriptor [was: c]  — SVG virtual-DOM descriptor
 * @returns {string|undefined}
 *
 * [was: QTK]
 */
export function extractPathData(_root, descriptor) { // was: QTK
  if (descriptor.C === "path") return descriptor.N.d;
  if (descriptor.V) {
    for (let i = 0; i < descriptor.V.length; i++) { // was: m
      const child = descriptor.V[i]; // was: W
      if (child && typeof child !== "string") {
        const found = extractPathData(_root, child); // was: W (reused)
        if (found) return found;
      }
    }
  }
}

/**
 * Starts a morphing animation on an icon element.
 *
 * @param {Object} animator     [was: Q]
 * @param {Function} callback   Update function called each frame. [was: c]
 * @param {number} durationMs   Animation duration in ms. [was: W]
 *
 * [was: nY]
 */
export function startIconMorphAnimation(animator, callback, durationMs) { // was: nY
  animator.O = callback;
  animator.startTime = (0, g.h)();
  animator.duration = durationMs;
  animator.W();
}

/**
 * Morphs an SVG icon from its current path to a new target path over
 * 200 ms.  Handles `<use>` elements by regenerating unique ids.
 *
 * @param {Object} animator       [was: Q]
 * @param {Element} svgElement    [was: c]
 * @param {Object} targetSvg      [was: W]  — SVG descriptor
 *
 * [was: c70]
 */
export function morphSvgIcon(animator, svgElement, targetSvg) { // was: c70
  const targetPathD = extractPathData(animator, targetSvg); // was: W (reused)
  const pathEl = svgElement.getElementsByTagName("path")[0]; // was: m
  const currentPathD = pathEl.getAttribute("d"); // was: K

  if (pathEl.getAttribute("id")) {
    const newId = generateComponentId(); // was: U
    const useElements = svgElement.getElementsByTagName("use"); // was: c (reused)
    for (let i = 0; i < useElements.length; i++) { // was: I
      useElements[i].setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        `#${newId}`,
      );
    }
    pathEl.setAttribute("id", newId);
  }

  const fromTokens = parseSvgPathTokens(currentPathD); // was: T
  const toTokens = parseSvgPathTokens(targetPathD); // was: r

  startIconMorphAnimation(
    animator,
    (progress) => { // was: U
      pathEl.setAttribute("d", interpolateSvgPath(fromTokens, toTokens, progress));
    },
    200,
  );
}

// ---------------------------------------------------------------------------
// Timely-action seek matching  (lines 47797–47847)
// ---------------------------------------------------------------------------

/**
 * Tests whether a seek action matches the controller's current key code.
 * Maps specific seek directions and durations to key codes 71-74.
 *
 * @param {Object} controller  [was: Q]
 * @param {Object} seekAction  [was: c]
 * @returns {boolean}
 *
 * [was: W80]
 */
export function matchesSeekAction(controller, seekAction) { // was: W80
  if (controller.A === undefined) return false; // was: void 0, !1
  if (
    seekAction.seekDirection === "TIMELY_ACTION_TRIGGER_DIRECTION_FORWARD" &&
    Number(seekAction.seekLengthMilliseconds) === 5e3
  )
    return controller.A === 72;
  if (
    seekAction.seekDirection === "TIMELY_ACTION_TRIGGER_DIRECTION_FORWARD" &&
    Number(seekAction.seekLengthMilliseconds) === 1e4
  )
    return controller.A === 74;
  if (
    seekAction.seekDirection === "TIMELY_ACTION_TRIGGER_DIRECTION_BACKWARD" &&
    Number(seekAction.seekLengthMilliseconds) === 5e3
  )
    return controller.A === 71;
  if (
    seekAction.seekDirection === "TIMELY_ACTION_TRIGGER_DIRECTION_BACKWARD" &&
    Number(seekAction.seekLengthMilliseconds) === 1e4
  )
    return controller.A === 73;
  return false; // was: !1
}

/**
 * Initialises the timely-action tracking map from the action list,
 * setting all action counts to zero.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: mJ7]
 */
export function initTimelyActionTracking(controller) { // was: mJ7
  if (controller.timelyActions) {
    controller.K = controller.timelyActions.reduce((map, action) => { // was: c, W
      if (action.cueRangeId === undefined) return map; // was: void 0
      map[action.cueRangeId] = 0;
      return map;
    }, {});
  }
}

/**
 * Clears the timely-action visibility timer.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: Dz]
 */
export function clearTimelyActionTimer(controller) { // was: Dz
  if (controller.isSamsungSmartTV) clearTimeout(controller.isSamsungSmartTV);
  controller.isSamsungSmartTV = undefined; // was: void 0
  controller.mF = false; // was: !1
}

/**
 * Finds a timely action by its cue-range id.
 *
 * @param {Object} controller    [was: Q]
 * @param {string} cueRangeId    [was: c]
 * @returns {Object|undefined}
 *
 * [was: tT]
 */
export function findTimelyActionByCueRange(controller, cueRangeId) { // was: tT
  if (controller.timelyActions) {
    for (const action of controller.timelyActions) { // was: W
      if (action.cueRangeId === cueRangeId) return action;
    }
  }
}

/**
 * Extracts the exit-command from a timely action's `onCueRangeExit`.
 *
 * @param {Object} controller  [was: Q]
 * @param {string} cueRangeId  [was: c]
 * @returns {Object|undefined}
 *
 * [was: K8O]
 */
export function getTimelyActionExitCommand(controller, cueRangeId) { // was: K8O
  const action = findTimelyActionByCueRange(controller, cueRangeId); // was: Q (reused)
  if (action && action.onCueRangeExit) return unwrapCommand(action.onCueRangeExit);
}

/**
 * Schedules a timer to auto-hide a timely action after its maximum
 * visible duration, firing the exit command when the timer elapses.
 *
 * @param {Object} controller          [was: Q]
 * @param {Object} timelyActionConfig  [was: c]
 *
 * [was: T4x]
 */
export function scheduleTimelyActionAutoHide(controller, timelyActionConfig) { // was: T4x
  const maxDurationMs = Number(timelyActionConfig?.maxVisibleDurationMilliseconds); // was: W
  if (maxDurationMs) {
    clearTimelyActionTimer(controller); // was: Dz(Q)
    controller.isSamsungSmartTV = setTimeout(() => {
      if (
        controller.W !== undefined && // was: void 0
        timelyActionConfig?.cueRangeId === controller.W
      ) {
        controller.mF = false; // was: !1
        const exitCmd = getTimelyActionExitCommand(controller, controller.W); // was: m
        if (exitCmd) publishEvent(controller.api, "innertubeCommand", exitCmd);
      }
    }, maxDurationMs);
  }
}

/**
 * Parses the timely-actions list from the watch-next response's
 * player overlay.
 *
 * @param {Object} api  Player API with `getWatchNextResponse()`. [was: Q]
 * @returns {Array|undefined}
 *
 * [was: UJX]
 */
export function parseTimelyActionsFromWatchNext(api) { // was: UJX
  const response = api.getWatchNextResponse(); // was: Q (reused)
  if (!response) return;
  const overlay = getProperty(
    response.playerOverlays?.playerOverlayRenderer?.timelyActionsOverlayViewModel,
    o2n,
  ); // was: Q (reused)
  if (overlay?.timelyActions) {
    return overlay.timelyActions
      .map((entry) => getProperty(entry, r7K)) // was: c
      .filter((entry) => !!entry); // was: c
  }
}

// ---------------------------------------------------------------------------
// Voice-boost menu  (line 47849)
// ---------------------------------------------------------------------------

/**
 * Lazily creates the voice-boost menu item if it does not exist.
 *
 * @param {Object} voiceBoostController  [was: Q]
 *
 * [was: XVR]
 */
export function ensureVoiceBoostMenuItem(voiceBoostController) { // was: XVR
  if (!voiceBoostController.menuItem) {
    voiceBoostController.menuItem = new IvK(
      voiceBoostController.api,
      (pref) => { // was: c
        voiceBoostController.setVoiceBoostUserPreference(pref);
      },
      () => voiceBoostController.getVoiceBoostUserPreference(),
      () => voiceBoostController.getVoiceBoostState(),
    );
    registerDisposable(voiceBoostController, voiceBoostController.menuItem);
  }
}

// ---------------------------------------------------------------------------
// Caption track helpers for PO-token  (lines 47857–47882)
// ---------------------------------------------------------------------------

/**
 * Checks if a caption track URL signals an experimental player variant
 * (contains "xpv" or "xpe" in the `exp` query parameter).
 *
 * @param {Object} captionTrack  [was: Q]
 * @returns {boolean}
 *
 * [was: A7w]
 */
export function isExperimentalCaptionTrack(captionTrack) { // was: A7w
  const url = captionTrack.createByteRange(); // was: Q (reused)
  if (!url) return false; // was: !1
  const expParam = parseUrlQueryString(url).exp || ""; // was: Q (reused)
  return expParam.includes("xpv") || expParam.includes("xpe");
}

/**
 * Returns whether any caption track (including ASR) is experimental.
 *
 * @param {Object} videoData  [was: Q]
 * @returns {boolean}
 *
 * [was: ezO]
 */
export function hasExperimentalCaptionTracks(videoData) { // was: ezO
  for (const track of getCaptionTracks(videoData, true)) { // was: c — true = include ASR
    if (isExperimentalCaptionTrack(track)) return true; // was: !0
  }
  return false; // was: !1
}

/**
 * Injects PO-token (proof-of-origin) parameters into all experimental
 * caption-track URLs.
 *
 * @param {Object} videoData  [was: Q]
 * @param {string} poToken   [was: c]
 *
 * [was: VJX]
 */
export function injectPoTokenIntoCaptionUrls(videoData, poToken) { // was: VJX
  for (const track of getCaptionTracks(videoData, true)) { // was: m — include ASR
    if (isExperimentalCaptionTrack(track)) {
      const params = { potc: "1", pot: poToken }; // was: W
      if (track.url) track.url = appendQueryParams(track.url, params);
    }
  }
}

// ---------------------------------------------------------------------------
// PO-token (Proof-of-Origin) bootstrap  (lines 47884–48085)
// ---------------------------------------------------------------------------

/**
 * Swallows rejections from a promise (used for fire-and-forget PO-token ops).
 *
 * @param {Promise} promise  [was: Q]
 *
 * [was: B4d]
 */
export async function swallowRejection(promise) { // was: B4d
  try {
    await promise;
  } catch (_err) {} // was: c
}

/**
 * Creates a PO-token integrity-token fetch client using the Google API key.
 *
 * @param {string} requestKey  [was: Q]
 * @returns {Object} A `qb` instance wrapping the integrity-token endpoint.
 *
 * [was: xJ7]
 */
export function createIntegrityTokenClient(requestKey) { // was: xJ7
  const transport = new GT(); // was: c
  const headers = { // was: W
    ["X-Goog-Api-Key"]: "AIzaSyDyT5W0Jh49F30Pqqtyfdf7pDLFKLJoAnw",
  };
  return new qb(transport, requestKey, () => headers);
}

/**
 * Creates a PO-token generator client.
 *
 * @param {Object} config  [was: Q]
 * @returns {Object} A `gw` instance.
 *
 * [was: qlK]
 */
export function createPoTokenGenerator(config) { // was: qlK
  return new gw(config);
}

/**
 * Resolves the initial PO-token once the generator is ready.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: n2O]
 */
export function resolveInitialPoToken(controller) { // was: n2O
  if (controller.O) {
    controller.j = new g8();
    controller.K.promise.then(() => {
      controller.KO.getTimeInBuffer("pot_if");
      generateSessionPoToken(controller); // was: N2(Q)
    });
  }
}

/**
 * Main entry point for PO-token initialisation.  Chooses between the
 * shared-OWL path, deferred KaiOS path, or immediate generation.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: HEn]
 */
export function initializePoToken(controller) { // was: HEn
  const shouldGenerate =
    (controller.X("html5_generate_session_po_token") ||
      controller.X("html5_generate_content_po_token")) &&
    !controller.useLivingRoomPoToken; // was: c

  try {
    if (
      controller.X("html5_use_shared_owl_instance") ||
      controller.api.G().getExperimentFlags.W.BA(DJO)
    ) {
      initializeSharedOwlPoToken(controller); // was: tJm(Q)
    } else if (shouldGenerate) {
      controller.KO.getTimeInBuffer("pot_isc");
      const deferTimeoutMs = getExperimentValue(
        controller.api.G().experiments,
        "html5_webpo_kaios_defer_timeout_ms",
      ); // was: W

      if (deferTimeoutMs) {
        ensureFallbackGenerator(controller); // was: i2(Q)
        safeSetTimeout(() => {
          startPoTokenGeneration(controller); // was: y4(Q)
        }, deferTimeoutMs);
      } else if (controller.X("html5_webpo_idle_priority_job")) {
        ensureFallbackGenerator(controller); // was: i2(Q)
        scheduleJob(getServiceLocator(), () => {
          startPoTokenGeneration(controller); // was: y4(Q)
        });
      } else {
        startPoTokenGeneration(controller); // was: y4(Q)
      }
    }
  } catch (err) { // was: W
    if (err instanceof Error) reportWarning(err);
  }
}

/**
 * Initialises PO-token via a shared OWL (Origin Web Library) instance.
 * This path caches the generator and resolves tokens asynchronously.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: tJm]
 */
export async function initializeSharedOwlPoToken(controller) { // was: tJm
  logPoTokenTiming(controller, "swpo_i");
  ensureFallbackGenerator(controller); // was: i2(Q)
  generateSessionPoToken(controller); // was: N2(Q)

  let owlInstance = await bQ(getBgeServiceWorkerKey()); // was: c
  logPoTokenTiming(controller, "swpo_co");
  owlInstance = await Sy0(owlInstance); // was: c (reused)

  if (!controller.X("html5_web_po_token_disable_caching")) {
    owlInstance.NW(150);
  }
  controller.O = owlInstance;
  logPoTokenTiming(controller, "swpo_cc");

  swallowRejection(owlInstance.AC()).then(() => { // was: B4d(c.AC())
    controller.W = true; // was: !0
    controller.K.resolve();
    logPoTokenTiming(controller, "swpo_re");
  });

  safeSetTimeout(() => {
    startPoTokenGeneration(controller); // was: y4(Q)
    logPoTokenTiming(controller, "swpo_si");
  }, 0);
}

/**
 * Ensures a fallback PO-token generator is available (synchronous path).
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: i2]
 */
export function ensureFallbackGenerator(controller) { // was: i2
  if (!controller.A) controller.A = createOneOffSigner();
}

/**
 * Starts the PO-token generation pipeline.  Creates the generator if
 * needed, optionally sets up session-token generation and an interval.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: y4]
 */
export function startPoTokenGeneration(controller) { // was: y4
  const config = controller.api.G(); // was: c
  controller.KO.getTimeInBuffer("pot_ist");

  if (!controller.O) createPoTokenClient(controller); // was: N4K(Q)

  if (!controller.X("html5_bandaid_attach_content_po_token")) {
    if (controller.X("html5_generate_session_po_token")) {
      generateSessionPoToken(controller); // was: N2(Q)
      resolveInitialPoToken(controller); // was: n2O(Q)
    }
    const intervalMs =
      getExperimentValue(config.experiments, "html5_session_po_token_interval_time_ms") || 0; // was: c (reused)
    if (intervalMs > 0) {
      controller.L = safeSetInterval(() => {
        generateSessionPoToken(controller); // was: N2(Q)
      }, intervalMs);
    }
    controller.J = true; // was: !0
  }
}

/**
 * Returns the PO-token request key from experiments or a hard-coded
 * default based on the platform.
 *
 * @param {Object} config  Player config. [was: Q]
 * @returns {string}
 *
 * [was: iEW]
 */
export function getPoTokenRequestKey(config) { // was: iEW
  const experimentKey = WU(config.experiments, "html5_web_po_request_key"); // was: c
  if (experimentKey) return experimentKey;
  return isTvHtml5(config) ? "Z1elNkAKLpSR3oPOUMSN" : "O43z0dpjhgX20SCx4KAo";
}

/**
 * Logs a PO-token timing event if the experiment flag is active.
 *
 * @param {Object} controller  [was: Q]
 * @param {string} eventName   [was: c]
 *
 * [was: SY]
 */
export function logPoTokenTiming(controller, eventName) { // was: SY
  if (controller.X("html5_webpo_bge_ctmp")) {
    controller.api.RetryTimer(eventName, {
      hwpo: !!controller.O,
      hwpor: controller.W,
    });
  }
}

/**
 * Generates a session PO-token for the current visitor/datasync identity.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: N2]
 */
export async function generateSessionPoToken(controller) { // was: N2
  if (
    controller.X("html5_generate_session_po_token") &&
    !controller.useLivingRoomPoToken
  ) {
    const config = controller.api.G(); // was: c
    let bindingId = getConfig("EOM_VISITOR_DATA") || getConfig("VISITOR_DATA"); // was: W

    bindingId = config.appendInitSegment ? config.datasyncId : bindingId;
    bindingId =
      WU(config.experiments, "html5_mock_content_binding_for_session_token") ||
      config.livingRoomPoTokenId ||
      bindingId;

    config.FO = mintPoToken(controller, bindingId); // was: FB(Q, W)
  }
}

/**
 * Initialises the full PO-token client (integrity-token + generator +
 * attestation wrapper).  Wires error handling and optional caching.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: N4K]
 */
export function createPoTokenClient(controller) { // was: N4K
  const config = controller.api.G(); // was: c
  let requestKey = getPoTokenRequestKey(config); // was: W
  const integrityClient = createIntegrityTokenClient(requestKey); // was: W (reused) -> xJ7

  const originalFetch = integrityClient.FormatInfo.bind(integrityClient); // was: m
  integrityClient.FormatInfo = async (request) => { // was: T
    const result = await originalFetch(request); // was: T (reused)
    controller.api.RetryTimer("itr", {});
    return result;
  };

  let generator; // was: K
  try {
    generator = createPoTokenGenerator({ // was: qlK
      Fm: integrityClient,
      Fh: { maxAttempts: 5 },
      fetchAttestationChallenge: {
        MP: "CLEn",
        disable: config.experiments.SG("html5_web_po_disable_remote_logging"),
        Pg: mB7(config.experiments),
        wY: (key) => { // was: r
          let instance = y7y.get(key); // was: U
          if (!instance) {
            instance = new Sl_(key); // was: U (reused)
            instance = new StreamzBatcher(instance); // was: U (reused)
            y7y.set(key, instance);
          }
          return instance;
        },
        IS: controller.X("wpo_dis_lfdms") ? 0 : 1e3,
      },
      JP: reportWarning,
    });

    const attestation = new IntegrityTokenPipeline({ // was: T
      OG: generator,
      Fm: integrityClient,
      onError: reportWarning,
    });

    swallowRejection(attestation.AC()).then(() => { // was: B4d
      controller.W = true; // was: !0
      controller.K.resolve();
    });

    if (!controller.X("html5_web_po_token_disable_caching")) {
      attestation.NW(150);
    }
    registerDisposable(controller, generator);
    registerDisposable(controller, attestation);
    controller.O = attestation;
  } catch (err) { // was: T
    reportWarning(err);
    generator?.dispose();
  }
}

/**
 * Mints a PO-token for the given content binding.  Falls back to the
 * synchronous generator (`controller.A`) if the async generator is
 * not yet ready.
 *
 * @param {Object} controller     [was: Q]
 * @param {string} contentBinding [was: c]
 * @returns {string} The minted token, or empty string on failure.
 *
 * [was: FB]
 */
export function mintPoToken(controller, contentBinding) { // was: FB
  if (!controller.O) {
    if (controller.A) {
      try {
        return controller.A(contentBinding);
      } catch (err) { // was: W
        reportWarning(err);
      }
    }
    return "";
  }

  try {
    controller.KO.getTimeInBuffer(controller.W ? "pot_cms" : "pot_csms");
    const options = { // was: W
      yc: true, // was: !0
      PK: true, // was: !0
      createFadeTransition: contentBinding,
    };

    if (!controller.X("html5_web_po_token_disable_caching")) {
      options.xS = {
        PV: contentBinding,
        O4: true, // was: !0
        OZ: true, // was: !0
      };
    }

    const token = controller.O.Ol(options); // was: m
    controller.KO.getTimeInBuffer(controller.W ? "pot_cmf" : "pot_csmf");

    if (controller.W) {
      controller.j?.resolve();
      controller.j = null;
      if (controller.D) {
        controller.D = false; // was: !1
        controller.api.app.oe().J_(false); // was: !1
      }
    }
    return token;
  } catch (err) { // was: W
    reportWarning(err);
    return "";
  }
}

// ---------------------------------------------------------------------------
// Suggestion / autoplay tile rendering  (lines 48086–48250)
// ---------------------------------------------------------------------------

/**
 * Updates the collapse/expand button text for the recommendations grid.
 *
 * @param {Object} button  [was: Q]
 * @param {number} state   2 = active (hide), else 1 = peeking (more). [was: c]
 *
 * [was: ZER]
 */
export function updateRecommendationsGridButtonText(button, state) { // was: ZER
  let title; // was: c (reused)
  let ariaLabel; // was: W
  switch (state) {
    case 2:
      title = "Hide videos";
      ariaLabel = "Hide recommendations grid";
      break;
    default:
      title = "More videos";
      ariaLabel = "Show recommendations grid";
  }
  button.updateValue("title", title);
  button.element.ariaLabel = ariaLabel;
  button.j.textContent = title;
}

/**
 * Populates a suggestion tile with video metadata (title, author,
 * duration, thumbnail, playlist info, etc.).
 *
 * @param {Object} tile       [was: Q]
 * @param {Object} videoData  [was: c]
 * @param {string} [thumbSuffix]  Thumbnail suffix. [was: W]
 *
 * [was: populateSuggestionTile]
 */
export function populateSuggestionTile(tile, videoData, thumbSuffix) { // was: g.Zz
  toggleClass(tile.element, "ytp-suggestion-set", !!videoData.videoId);

  const playlistId = videoData.playlistId; // was: m
  const thumbnailUrl = videoData.AdVideoClickthroughMetadata(thumbSuffix ? thumbSuffix : "mqdefault.jpg"); // was: W (reused)

  let lengthText = null; // was: K
  let accessibleLength = null; // was: T
  if (videoData instanceof th) {
    if (videoData.lengthText) {
      lengthText = videoData.lengthText || null;
      accessibleLength = videoData.h_ || null;
    } else if (videoData.lengthSeconds) {
      lengthText = formatDuration(videoData.lengthSeconds);
      accessibleLength = formatDuration(videoData.lengthSeconds, true); // was: !0
    }
  }

  const isList = !!playlistId; // was: r
  const isMix = isList && k5(playlistId).type === "RD"; // was: m (reused)
  const isLive = videoData instanceof th ? videoData.isLivePlayback : null; // was: U
  const isUpcoming = videoData instanceof th ? videoData.isUpcoming : null; // was: I
  const author = videoData.author; // was: X
  const shortViewCount = videoData.shortViewCount; // was: A
  const publishedTimeText = videoData.publishedTimeText; // was: e

  const authorAndViews = []; // was: V
  const viewsAndTime = []; // was: B
  if (author) authorAndViews.push(author);
  if (shortViewCount) {
    authorAndViews.push(shortViewCount);
    viewsAndTime.push(shortViewCount);
  }
  if (publishedTimeText) viewsAndTime.push(publishedTimeText);

  const tileData = { // was: W (reused)
    title: videoData.title,
    author,
    author_and_views: authorAndViews.join(" \u2022 "),
    aria_label:
      videoData.ariaLabel ||
      replaceTemplateVars("Watch $TITLE", { TITLE: videoData.title }),
    duration: lengthText,
    timestamp: accessibleLength,
    url: videoData.updateToggleButtonState(),
    is_live: isLive,
    is_upcoming: isUpcoming,
    is_list: isList,
    is_mix: isMix,
    background: thumbnailUrl ? `background-image: url(${thumbnailUrl})` : "",
    views_and_publish_time: viewsAndTime.join(" \u2022 "),
    autoplayAlternativeHeader: videoData.KY,
  };

  if (videoData instanceof ShrunkenPlayerBytesMetadata) {
    tileData.playlist_length = videoData.playlistLength;
  }
  tile.update(tileData);
}

/**
 * Updates an autoplay suggestion tile with higher-quality thumbnails
 * and optional embed-tracking parameters.
 *
 * @param {Object} tile       [was: Q]
 * @param {Object} videoData  [was: c]
 *
 * [was: updateAutoplaySuggestion]
 */
export function updateAutoplaySuggestion(tile, videoData) { // was: g.E2d
  if (tile.suggestion === videoData) return;
  tile.suggestion = videoData;

  const config = tile.api.G(); // was: W
  let thumbSuffix = "hqdefault.jpg"; // was: m
  if (videoData.AdVideoClickthroughMetadata("sddefault.jpg")) thumbSuffix = "sddefault.jpg";

  populateSuggestionTile(tile, videoData, thumbSuffix); // was: g.Zz(Q, c, m)

  if (
    isEmbedWithAudio(config) &&
    !tile.api.X("web_player_log_click_before_generating_ve_conversion_params")
  ) {
    let url = videoData.updateToggleButtonState(); // was: W (reused)
    const trackingParams = {}; // was: m (reused)
    callInternalMethod(tile.api, "addEmbedsConversionTrackingParams", [trackingParams]);
    url = appendParamsToUrl(url, trackingParams);
    tile.updateValue("url", url);
  }

  const sessionItct = videoData.sessionData?.itct; // was: c (reused)
  if (sessionItct) tile.api.setTrackingParams(tile.element, sessionItct);
}

// ---------------------------------------------------------------------------
// Fullscreen grid state management  (lines 48162–48323)
// ---------------------------------------------------------------------------

/**
 * Updates the grid hover-overlay tooltip text.
 *
 * @param {Object} gridOverlay  [was: Q]
 * @param {number} state        [was: c]
 *
 * [was: sT7]
 */
export function updateGridOverlayTooltip(gridOverlay, state) { // was: sT7
  let text = ""; // was: W
  const tooltip = formatTooltip(gridOverlay.player, "More videos", "v"); // was: m
  if (state === 2) text = "Hide videos";
  else if (state === 1) text = "More videos";

  gridOverlay.element.setAttribute("title", tooltip);
  gridOverlay.element.setAttribute("data-title-no-tooltip", text);
  gridOverlay.element.setAttribute("aria-label", text);

  const hoverOverlay = gridOverlay.z2("ytp-fullscreen-grid-hover-overlay"); // was: c (reused)
  if (hoverOverlay) {
    hoverOverlay.setAttribute("title", tooltip);
    hoverOverlay.setAttribute("data-title-no-tooltip", text);
    hoverOverlay.setAttribute("aria-label", text);
  }
  if (!gridOverlay.D) {
    const expandBtn = gridOverlay.z2("ytp-fullscreen-grid-expand-button"); // was: c (reused)
    if (expandBtn) {
      expandBtn.setAttribute("title", tooltip);
      expandBtn.setAttribute("data-title-no-tooltip", text);
      expandBtn.setAttribute("aria-label", text);
    }
  }
  gridOverlay.player.WI();
}

/**
 * Synchronises the full-bleed player mode class and related overlays.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: du]
 */
export function syncFullBleedMode(controller) { // was: du
  const isFullBleed = isFullBleedActive(controller); // was: c — Ed(Q)
  toggleClass(controller.api.getRootNode(), "ytp-full-bleed-player", isFullBleed);
  if (controller.isSamsungSmartTV) showElement(controller.isSamsungSmartTV, isFullBleed);
  if (controller.playerOverlayVideoDetailsRenderer) {
    showElement(controller.playerOverlayVideoDetailsRenderer, isFullBleed);
  }
  if (controller.j) updateGridState(controller); // was: sd(Q)
}

/**
 * Sets the grid state to a new value, updates the grid component,
 * and applies DOM classes.
 *
 * @param {Object} controller    [was: Q]
 * @param {number} newState      0=hidden, 1=peeking, 2=active. [was: c]
 * @param {string} [gestureType]  Interaction logging gesture type. [was: W]
 *
 * [was: wu]
 */
export function setGridState(controller, newState, gestureType) { // was: wu
  controller.A = newState;
  controller.O?.l3(newState, gestureType);
  controller.Y?.l3(newState);
  controller.W = 0;
  animateGridScroll(controller); // was: LY(Q)
  applyGridDomClasses(controller, newState); // was: dJd(Q, c)
}

/**
 * Wires up all event listeners for the fullscreen recommendations grid.
 *
 * @param {Object} controller     [was: Q]
 * @param {Object} eventBinder    [was: c]
 * @param {Object} eventSource    [was: W]
 *
 * [was: g2n]
 */
export function initGridEventListeners(controller, eventBinder, eventSource) { // was: g2n
  eventBinder.B(eventSource, "keyboardserviceglobalkeydown", (event, context) => { // was: m, K
    if (
      controller.j &&
      event.keyCode === 86 &&
      !event.repeat &&
      controller.A !== 0
    ) {
      if (context) context.buildPingMetadata = true; // was: !0
      controller.S("INTERACTION_LOGGING_GESTURE_TYPE_KEY_PRESS");
    }
  });

  eventBinder.B(controller.api.getRootNode(), "wheel", (event) => { // was: m
    if (
      !controller.mF &&
      controller.j &&
      controller.O?.element &&
      !controller.api.getPlayerStateObject().W(2) &&
      controller.A !== 0 &&
      isFullBleedActive(controller) // was: Ed(Q)
    ) {
      addClass(controller.api.getRootNode(), "ytp-grid-scrolling");
      if (controller.K === 0) controller.K = window.innerHeight;

      if (controller.A === 1) {
        if (controller.K !== 0) {
          controller.W += event.deltaY / controller.K;
          controller.W = clamp(controller.W, 0, 0.7);
          animateGridScroll(controller); // was: LY(Q)
          handleGridScrollThreshold(controller, controller.J / controller.K + controller.W >= 0.7, 2); // was: L8x
        }
      } else if (controller.A === 2) {
        const isScrollUp = event.deltaY < 0; // was: K
        const atTop = controller.O?.j?.scrollTop === 0; // was: T
        const hasOffset = controller.W !== 0; // was: r
        if ((isScrollUp && atTop) || (hasOffset && !isScrollUp)) {
          if (controller.K !== 0) {
            controller.W = Math.max(0, controller.W - event.deltaY / controller.K);
            animateGridScroll(controller); // was: LY(Q)
            handleGridScrollThreshold(
              controller,
              controller.J / controller.K + Math.abs(controller.W) >= 0.7,
              1,
            ); // was: L8x
          }
        } else if (controller.W !== 0) {
          controller.W = 0;
          animateGridScroll(controller); // was: LY(Q)
        }
      }
    }
  }, controller, true); // was: !0

  eventBinder.B(eventSource, "standardControlsInitialized", () => {
    if (!controller.O) {
      controller.O = new wV3(controller.api, controller.PA.bind(controller));
      if (controller.MM) {
        controller.Y = new bER(controller.api);
        registerDisposable(controller, controller.Y);
        controller.Y.element.setAttribute("data-overlay-order", "12");
        controller.api.scheduleDebounce(controller.Y.element, 4);
        controller.Y.listen("click", controller.S, controller);
      }
      registerDisposable(controller, controller.O);
      const chromeBottom = controller.api.getRootNode().querySelector(".ytp-chrome-bottom"); // was: m
      if (chromeBottom && chromeBottom.parentNode) {
        chromeBottom.parentNode.insertBefore(controller.O.element, chromeBottom.nextSibling);
      }
      updateGridPeekHeight(controller); // was: jTm(Q)
    }
  });

  eventBinder.B(eventSource, "presentingplayerstatechange", () => {
    updateGridState(controller); // was: sd(Q)
  });
  eventBinder.B(eventSource, "autonavvisibility", () => {
    updateGridState(controller); // was: sd(Q)
  });
  controller.api.OV().subscribe("visibilitystatechange", () => {
    updateGridState(controller); // was: sd(Q)
  });

  applyGridDomClasses(controller, controller.A); // was: dJd(Q, Q.A)
}

/**
 * Recalculates the grid state based on the current player presentation
 * mode, ended state, and full-bleed eligibility.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: sd]
 */
export function updateGridState(controller) { // was: sd
  if (!controller.j) return;

  removeClass(controller.api.getRootNode(), "ytp-grid-scrolling");

  if (
    controller.api.getPresentingPlayerType() === 2 ||
    controller.api.generateUUID() ||
    controller.api.isMinimized()
  ) {
    setGridState(controller, 0);
  } else {
    const isEnded = controller.api.getPlayerStateObject().W(2); // was: c
    if (isEnded) {
      setGridState(controller, 2, "INTERACTION_LOGGING_GESTURE_TYPE_AUTOMATED");
    } else if (controller.isEnded && !isEnded) {
      const target = isFullBleedActive(controller) ? 1 : 0; // was: W
      controller.isEnded = isEnded;
      setGridState(controller, target);
    } else {
      if (isFullBleedActive(controller)) { // was: Ed(Q)
        if (controller.A !== 2) setGridState(controller, 1);
      } else {
        setGridState(controller, 0);
      }
    }
    controller.isEnded = isEnded;
  }
}

/**
 * Applies CSS grid-state classes (peeking / active) to the root node.
 *
 * @param {Object} controller  [was: Q]
 * @param {number} state       [was: c]
 *
 * [was: dJd]
 */
export function applyGridDomClasses(controller, state) { // was: dJd
  const rootNode = controller.api.getRootNode(); // was: W
  toggleClass(rootNode, "ytp-fullscreen-grid-peeking", state === 1);
  toggleClass(rootNode, "ytp-fullscreen-grid-active", state === 2);
  if (state === 1) updateGridPeekHeight(controller); // was: jTm(Q)
}

/**
 * Calculates and applies the peek-height CSS variable for the grid.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: jTm]
 */
export function updateGridPeekHeight(controller) { // was: jTm
  const rootNode = controller.api.getRootNode(); // was: c

  let peekHeight; // was: W
  const playerState = controller.api.getPlayerStateObject();
  if (
    playerState.W(256) ||
    playerState.W(32) ||
    playerState.W(16)
  ) {
    peekHeight = controller.J;
  } else if (
    controller.Ka &&
    playerState.isPaused()
  ) {
    peekHeight =
      (controller.O?.element.clientWidth || 0) * 0.5625 / 3 * controller.jG ||
      controller.T2;
  } else {
    peekHeight = controller.T2;
  }

  controller.J = peekHeight;
  rootNode.style.setProperty("--ytp-grid-peek-height", `${controller.J}px`);
  toggleClass(rootNode, "ytp-disable-bottom-gradient", controller.J <= 12 && controller.D === 0);
}

/**
 * Returns whether the player is in full-bleed mode (fullscreen, or
 * large-screen and theater mode).
 *
 * @param {Object} controller  [was: Q]
 * @returns {boolean}
 *
 * [was: Ed]
 */
export function isFullBleedActive(controller) { // was: Ed
  return controller.api.isFullscreen() || (controller.UH && controller.api.d7());
}

/**
 * Smoothly animates the grid scroll CSS variable via `requestAnimationFrame`.
 *
 * @param {Object} controller  [was: Q]
 *
 * [was: LY]
 */
export function animateGridScroll(controller) { // was: LY
  if (controller.W === 0) {
    controller.api.getRootNode().style.setProperty("--ytp-grid-scroll-percentage", "0");
  }
  requestAnimationFrame(() => {
    const delta = controller.W - controller.D; // was: c
    let step = delta; // was: W
    if (controller.W !== 0) {
      step = clamp(delta, -0.01, 0.01);
    }
    controller.D += step;
    controller.api
      .getRootNode()
      .style.setProperty("--ytp-grid-scroll-percentage", `${controller.D.toString()}`);
    if (controller.D !== controller.W) animateGridScroll(controller);
  });
}

/**
 * Evaluates whether the scroll threshold has been crossed and
 * transitions the grid state accordingly.
 *
 * @param {Object} controller    [was: Q]
 * @param {boolean} crossed      Whether the threshold was crossed. [was: c]
 * @param {number} targetState   Target grid state. [was: W]
 *
 * [was: L8x]
 */
export function handleGridScrollThreshold(controller, crossed, targetState) { // was: L8x
  if (controller.L) clearTimeout(controller.L);
  if (controller.W === 0) {
    removeClass(controller.api.getRootNode(), "ytp-grid-scrolling");
  }
  if (crossed) {
    finalizeGridScroll(controller, targetState); // was: fvy(Q, W)
  } else if (controller.W < 0.1) {
    controller.L = window.setTimeout(() => {
      finalizeGridScroll(controller); // was: fvy(Q)
    }, 1e3);
  }
}

/**
 * Finalises a grid scroll gesture: clears the debounce timer and
 * either transitions to the target state or emits a scroll interaction.
 *
 * @param {Object} controller      [was: Q]
 * @param {number} [targetState]   [was: c]
 *
 * [was: fvy]
 */
export function finalizeGridScroll(controller, targetState) { // was: fvy
  if (controller.L) {
    clearTimeout(controller.L);
    controller.L = null;
  }
  controller.K = 0;
  if (controller.j && controller.A !== 0) {
    if (targetState) {
      setGridState(controller, targetState); // was: wu(Q, c)
    } else if (Math.abs(controller.W) >= 0.15) {
      controller.S("INTERACTION_LOGGING_GESTURE_TYPE_SCROLL_BEGAN_DRAGGING");
    }
    controller.W = 0;
    animateGridScroll(controller); // was: LY(Q)
    removeClass(controller.api.getRootNode(), "ytp-grid-scrolling");
  }
}

// ---------------------------------------------------------------------------
// CSI timing  (lines 48325–48375)
// ---------------------------------------------------------------------------

/**
 * Records a "pbs" (playback-start) timing event on the CSI timeline.
 *
 * @param {Object} timer         [was: Q]
 * @param {number} [timestamp]   [was: c]
 * @param {string} [timerName]   [was: W]
 *
 * [was: b2]
 */
export function recordPlaybackStartTiming(timer, timestamp, timerName) { // was: b2
  Bu("pbs", timestamp ?? (0, g.h)(), timerName ?? timer.timerName);
}

/**
 * Begins CSI timing for a new playback session, flushing any pending
 * metrics from the previous session and recording metadata.
 *
 * @param {Object} timer      [was: Q]
 * @param {Object} videoData  [was: c]
 * @param {number} [startTime]  Optional override for playback-start time. [was: W]
 *
 * [was: v2W]
 */
export function beginCsiTimingSession(timer, videoData, startTime) { // was: v2W
  const isMainPlayer = isEmbedded(videoData.LayoutExitedMetadata) && !videoData.LayoutExitedMetadata.D; // was: m
  if (
    videoData.LayoutExitedMetadata.r_ &&
    (isDetailPage(videoData.LayoutExitedMetadata) || videoData.LayoutExitedMetadata.isSamsungSmartTV === "shortspage" || isLeanback(videoData.LayoutExitedMetadata) || isMainPlayer) &&
    !timer.A
  ) {
    timer.A = true; // was: !0
    timer.D = videoData.clientPlaybackNonce;

    getConfig("TIMING_ACTION") || setConfig("TIMING_ACTION", timer.FI.csiPageType);
    if (timer.FI.csiServiceName) setConfig("CSI_SERVICE_NAME", timer.FI.csiServiceName);

    if (timer.W) {
      const metrics = timer.W.MetricCondition(); // was: m (reused)
      for (const key of Object.keys(metrics)) { // was: K
        Bu(key, metrics[key], timer.timerName);
      }
      const info = wrapWithErrorReporter(extractRequestIds)(timer.W.Bf); // was: K (reused)
      g.xh(info, timer.timerName);
      const cleared = timer.W; // was: K (reused)
      cleared.O = {};
      cleared.Bf = {};
    }

    g.xh(
      {
        playerInfo: { visibilityState: wrapWithErrorReporter(Vv7)() },
        playerType: "LATENCY_PLAYER_HTML5",
      },
      timer.timerName,
    );

    if (timer.K === videoData.clientPlaybackNonce && !Number.isNaN(timer.O)) {
      if (np("_start", timer.timerName)) {
        startTime = wrapWithErrorReporter(r$)("_start", timer.timerName) + timer.O;
      } else {
        reportWarning(
          new PlayerError("attempted to log gapless pbs before CSI timeline started", {
            cpn: videoData.clientPlaybackNonce,
          }),
        );
      }
    }

    if (startTime && !np("pbs", timer.timerName) && !videoData.YI) {
      recordPlaybackStartTiming(timer, startTime); // was: b2(Q, W)
    }
  }
}

/**
 * Resets the CSI timer for a complete navigation.
 *
 * @param {Object} timer  [was: Q]
 *
 * [was: jY]
 */
export function resetCsiTimer(timer) { // was: jY
  Fn3();
  SNw();
  timer.timerName = "";
}

/**
 * Clears CSI session state without flushing metrics.
 *
 * @param {Object} timer  [was: Q]
 *
 * [was: av3]
 */
export function clearCsiSessionState(timer) { // was: av3
  if (timer.W) {
    const metrics = timer.W; // was: c
    metrics.O = {};
    metrics.Bf = {};
  }
  timer.A = false; // was: !1
  timer.K = undefined; // was: void 0
  timer.O = NaN;
}

// ---------------------------------------------------------------------------
// Playlist data model  (lines 48377–48503)
// ---------------------------------------------------------------------------

/**
 * Returns whether the given object is a playlist-like structure
 * (has `playlist`, `list`, or `api` property).
 *
 * @param {Object} obj  [was: Q]
 * @returns {boolean}
 *
 * [was: gu]
 */
export function isPlaylistLike(obj) { // was: gu
  return !!(obj.playlist || obj.list || obj.api);
}

/**
 * Creates a `VideoData` instance for the playlist item at the given
 * index (or the current index if omitted).
 *
 * @param {Object} playlist      [was: Q]
 * @param {number} [index]       [was: c]
 * @param {boolean} [autoplay]   [was: W]
 * @param {boolean} [autonav]    [was: m]
 * @returns {Object|null}
 *
 * [was: createVideoDataForPlaylistItem]
 */
export function createVideoDataForPlaylistItem(playlist, index, autoplay, autonav) { // was: g.fY
  index = index !== undefined ? index : playlist.index; // was: void 0
  const rawItem =
    playlist.items && index in playlist.items
      ? playlist.items[playlist.order[index]]
      : null; // was: c (reused)

  let videoData = null; // was: K
  if (rawItem) {
    if (autoplay) rawItem.autoplay = "1";
    if (autonav) rawItem.autonav = "1";
    videoData = new VideoData(playlist.LayoutExitedMetadata, rawItem);
    registerDisposable(playlist, videoData);
    videoData.resetBufferPosition = true; // was: !0
    videoData.startSeconds = playlist.startSeconds || videoData.clipStart || 0;
    if (playlist.listId) videoData.playlistId = playlist.listId.toString();
  }
  return videoData;
}

/**
 * Populates a playlist from a raw API response (legacy format).
 *
 * @param {Object} playlist  [was: Q]
 * @param {Object} response  [was: c]
 *
 * [was: GFW]
 */
export function populatePlaylistFromResponse(playlist, response) { // was: GFW
  if (!response.video || !response.video.length) return;

  playlist.title = response.title || "";
  playlist.description = response.description;
  playlist.views = response.views;
  playlist.likes = response.likes;
  playlist.dislikes = response.dislikes;
  playlist.author = response.author || "";

  const loop = response.loop; // was: W
  if (loop) playlist.loop = loop;

  const previousVideoData = createVideoDataForPlaylistItem(playlist); // was: W (reused)
  playlist.items = [];
  for (const video of response.video) { // was: m
    if (video) {
      video.video_id = video.encrypted_id;
      playlist.items.push(video);
    }
  }
  playlist.length = playlist.items.length;
  if (response.index) {
    playlist.index = response.index; // was: c (reused)
  } else {
    playlist.findIndex(previousVideoData);
  }
  playlist.setShuffle(false); // was: !1
  playlist.loaded = true; // was: !0
  playlist.O++;
  if (playlist.W) playlist.W();
}

/**
 * Returns the next playlist index, wrapping to 0 at the end.
 *
 * @param {Object} playlist  [was: Q]
 * @returns {number}
 *
 * [was: $Jy]
 */
export function getNextPlaylistIndex(playlist) { // was: $Jy
  const next = playlist.index + 1; // was: c
  return next >= playlist.length ? 0 : next;
}

/**
 * Returns the previous playlist index, wrapping to the last item.
 *
 * @param {Object} playlist  [was: Q]
 * @returns {number}
 *
 * [was: Pry]
 */
export function getPreviousPlaylistIndex(playlist) { // was: Pry
  const prev = playlist.index - 1; // was: c
  return prev < 0 ? playlist.length - 1 : prev;
}

/**
 * Sets the current playlist index, clamping to valid bounds, and
 * resets the start-seconds.
 *
 * @param {Object} playlist  [was: Q]
 * @param {number} index     [was: c]
 *
 * [was: v6]
 */
export function setPlaylistIndex(playlist, index) { // was: v6
  playlist.index = clamp(index, 0, playlist.length - 1);
  playlist.startSeconds = 0;
}

// ---------------------------------------------------------------------------
// Embedded player bootstrap via innertube  (lines 48434–48503)
// ---------------------------------------------------------------------------

/**
 * Fetches the embedded player response from the innertube API and
 * constructs a `VideoData` instance.
 *
 * Handles single-video, playlist (by id/user/templist), and
 * raw-embedded-player-response scenarios.
 *
 * @param {Object} player       [was: Q]
 * @param {Object} playerVars   [was: c]
 * @returns {Promise<Object>} A `VideoData` instance.
 *
 * [was: hzn]
 */
export async function fetchEmbeddedPlayerResponse(player, playerVars) { // was: hzn
  const requestId = bootstrapInnertube(); // was: W
  const config = player.G(); // was: m

  const request = { // was: K
    context: g.kW(player),
    playbackContext: {
      contentPlaybackContext: {
        ancestorOrigins: config.ancestorOrigins,
      },
    },
  };

  let webPlayerCtx = config.getWebPlayerContextConfig(); // was: T
  if (webPlayerCtx?.encryptedHostFlags) {
    request.playbackContext.contentPlaybackContext.encryptedHostFlags =
      webPlayerCtx.encryptedHostFlags;
  }
  if (webPlayerCtx?.hideInfo) {
    request.playerParams = { showinfo: false }; // was: !1
  }

  const embedConfig = config.embedConfig; // was: T (reused)
  const serializedEmbedConfig = player.AA; // was: r

  // --- Resolve the video id ---
  let videoId = playerVars.docid || playerVars.video_id || playerVars.videoId || playerVars.id; // was: U
  if (!videoId) {
    let rawResponse = playerVars.raw_embedded_player_response; // was: U (reused)
    if (!rawResponse) {
      const parsedResponse = playerVars.embedded_player_response; // was: I
      if (parsedResponse) rawResponse = JSON.parse(parsedResponse);
    }
    videoId = rawResponse
      ? getProperty(
          rawResponse?.embedPreview?.thumbnailPreviewRenderer?.playButton
            ?.buttonRenderer?.navigationEndpoint,
          g.nl,
        )?.videoId || null
      : null;
  }
  videoId = videoId ? videoId : undefined; // was: void 0

  // --- Resolve playlist ---
  const listId = player.playlistId ? player.playlistId : playerVars.list; // was: I
  const listType = playerVars.listType; // was: X

  if (listId) {
    let playlistRequest; // was: A
    if (listType === "user_uploads") {
      playlistRequest = { username: listId };
    } else {
      playlistRequest = { playlistId: listId };
    }
    applyPlaylistRequestParams(embedConfig, serializedEmbedConfig, videoId, playerVars, playlistRequest, config.experiments); // was: lvO
    request.playlistRequest = playlistRequest;
  } else if (playerVars.playlist) {
    const playlistRequest = { // was: A
      templistVideoIds: playerVars.playlist.toString().split(","),
    };
    applyPlaylistRequestParams(embedConfig, serializedEmbedConfig, videoId, playerVars, playlistRequest, config.experiments); // was: lvO
    request.playlistRequest = playlistRequest;
  } else if (videoId) {
    const singleRequest = { videoId }; // was: A
    if (serializedEmbedConfig && config.X("embeds_enable_per_video_embed_config")) {
      singleRequest.serializedThirdPartyEmbedConfig = serializedEmbedConfig;
    } else if (embedConfig) {
      singleRequest.serializedThirdPartyEmbedConfig = embedConfig;
    }
    request.singleVideoRequest = singleRequest;
  }

  const endpoint = buildInnertubeApiPath(uo3); // was: m (reused)
  try {
    const response = await sendInnertubeRequest(requestId, request, endpoint); // was: e
    const updatedConfig = player.G(); // was: V
    playerVars.raw_embedded_player_response = response;
    updatedConfig.Ie = getEmbeddedPlayerMode(playerVars, isEmbedWithAudio(updatedConfig));
    updatedConfig.A = updatedConfig.Ie === "EMBEDDED_PLAYER_MODE_PFL";
    if (response && response.trackingParams) graftTrackingParams(response.trackingParams);
    return new VideoData(updatedConfig, playerVars);
  } catch (err) { // was: e
    if (!(err instanceof Error)) err = Error("b259802748");
    reportErrorWithLevel(err);
    return player;
  }
}

/**
 * Applies common parameters (index, videoId, embed config) to a
 * playlist request object.
 *
 * @param {*} embedConfig                   [was: Q]
 * @param {*} serializedEmbedConfig         [was: c]
 * @param {string} videoId                  [was: W]
 * @param {Object} playerVars              [was: m]
 * @param {Object} playlistRequest         [was: K]
 * @param {Object} experiments             [was: T]
 *
 * [was: lvO]
 */
export function applyPlaylistRequestParams(embedConfig, serializedEmbedConfig, videoId, playerVars, playlistRequest, experiments) { // was: lvO
  if (playerVars.index) {
    playlistRequest.playlistIndex = String(Number(playerVars.index) + 1);
  }
  playlistRequest.videoId = videoId ? videoId : "";
  if (serializedEmbedConfig && experiments.SG("embeds_enable_per_video_embed_config")) {
    playlistRequest.serializedThirdPartyEmbedConfig = serializedEmbedConfig;
  } else if (embedConfig) {
    playlistRequest.serializedThirdPartyEmbedConfig = embedConfig;
  }
}
