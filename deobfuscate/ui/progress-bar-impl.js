/**
 * Progress Bar Implementation — progress bar hover tracking, preview tooltip
 * positioning, seek bar with chapter detection, sprite thumbnail hover preview,
 * and volume slider panel display logic.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: 50067–50546, 50601–51499
 *   (Lines 50547–50600 are covered in seek-overlay.js)
 *
 * Key subsystems:
 *   - Share panel service buttons (sAR, FHO, Ezy) — social share overlay
 *   - Clip/segment time range helpers (Gw, $Z)
 *   - Shopping overlay visibility state (Pv, dFn, lO, jAm)
 *   - Suggested-action badge logic (LH0, bwW, uO)
 *   - Channel logo / title bar helpers (fjK, Ow0, gz_)
 *   - Bottom gradient rendering (vzw)
 *   - Chapter title display (aj_, GK7)
 *   - Sprite thumbnail positioning ($Fx, hW, zw)
 *   - Fullscreen icon rendering (Pc0)
 *   - Jump button enable/disable (ljK)
 *   - Info card trigger (u3w, hsO)
 *   - Slider animation (zsR, CI, CcK, Mg_)
 *   - Volume popover (Rsw, kKw, Qq_, mG3, K6K)
 *   - Autoplay/next button (kZ, YZ, oB0, r5w, T3K, UGW)
 *   - Seek bar aria updates (pI, QV, cC, Xfm, IyO)
 *   - Filmstrip thumbnail strip (VVK)
 *   - Heat map rendering (B3w, xGn, qbW)
 *   - Chapter bar segments (WC, mM, DGm, Kv, Hfw, TM, ifW, SbR, F6K, Ii)
 *   - Chapter layout / sizing (g.oi, rd, UC, Of7, sqd, VV, BC, wfx, Xk, Ag)
 *   - Progress bar painting (ec, bfw, jq3)
 *   - Clip range check (xg)
 *   - Seek logging (Nc)
 *   - Seek bar enable/disable (yV)
 *
 * [was: Suw, a1, sAR, FHO, Ezy, Gw, $Z, Pv, dFn, lO, LH0, bwW, uO,
 *  jAm, gz_, Ow0, fjK, vzw, aj_, GK7, $Fx, hW, zw, Pc0, ljK, u3w,
 *  hsO, zsR, CI, CcK, Mg_, Rsw, kKw, Qq_, mG3, K6K, kZ, YZ, oB0,
 *  r5w, T3K, UGW, pI, QV, cC, Xfm, IyO, VVK, B3w, xGn, qbW,
 *  WC, mM, DGm, Kv, Hfw, TM, ifW, SbR, F6K, Ii, g.oi, rd, UC,
 *  Of7, sqd, VV, BC, wfx, Xk, Ag, ec, bfw, jq3, xg, Nc, yV]
 */

import { formatDuration } from '../ads/ad-async.js';  // was: g.Pq
import { callInternalMethod, handleEmbedsClick, hasPlaylist, insertAtLayer, isAutoplayEligible, publishEvent } from '../ads/ad-click-tracking.js';  // was: g.Dr, g.Yt, g.bp, g.f8, g.vt, g.xt
import { cueRangeEndId, cueRangeStartId } from '../ads/ad-scheduling.js';  // was: g.FC, g.Sr
import { listen } from '../core/composition-helpers.js';  // was: g.s7
import { registerDisposable, safeDispose } from '../core/event-system.js';  // was: g.F, g.BN
import { getProperty } from '../core/misc-helpers.js';  // was: g.l
import { getBaseOrigin, isEmbedWithAudio } from '../data/bandwidth-tracker.js';  // was: g.jh, g.oc
import { getClientScreenNonce, reportErrorWithLevel } from '../data/gel-params.js';  // was: g.Df, g.Zf
import { isPrimaryClick } from '../data/interaction-logging.js';  // was: g.P1
import { isWebExact } from '../data/performance-profiling.js';  // was: g.rT
import { logClick } from '../data/visual-element-tracking.js';  // was: g.pa
import { nextVideo, onVideoDataChange } from '../player/player-events.js';  // was: g.nextVideo, g.Qq
import { createVideoDataForPlaylistItem } from '../player/video-loader.js';  // was: g.fY
import { doc, win } from '../proto/messages-core.js';  // was: g.cN, g.bI
import { refreshArrowIcon } from './svg-icons.js';  // was: g.NQ
import { sendRawXhr } from '../network/request.js'; // was: cn
import { togglePopup } from '../ads/ad-click-tracking.js'; // was: lp
import { validateSlotTriggers } from '../ads/ad-scheduling.js'; // was: er
import { ShareButton } from '../features/keyboard-handler.js'; // was: TOv
import { appendInitSegment } from '../media/mse-internals.js'; // was: qF
import { EXP_FORCE_PROBE } from '../proto/messages-core.js'; // was: Zw7
import { createNullWindow } from '../data/idb-transactions.js'; // was: Uo
import { toggleFineScrub } from './seek-bar-tail.js'; // was: EC
import { setExperimentFlag } from '../core/attestation.js'; // was: xs
import { updateBadgeExpansion } from '../player/video-loader.js'; // was: Q4
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { selectResolutionLevel } from './sprite-thumbnails.js'; // was: Uw
import { getFrameIndexAtTime } from './sprite-thumbnails.js'; // was: UP3
import { enqueueSpritesheetLoads } from './sprite-thumbnails.js'; // was: rIR
import { findLoadedTile } from './sprite-thumbnails.js'; // was: Kdx
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { miniplayerIcon } from './svg-icons.js'; // was: D1
import { pictureInPictureIcon } from './svg-icons.js'; // was: pN7
import { solveBezierT } from '../core/bitstream-helpers.js'; // was: f6
import { bezierY } from '../core/bitstream-helpers.js'; // was: Oc
import { MusicTrackHandler } from '../modules/offline/offline-orchestration.js'; // was: END
import { SimpleDate } from '../modules/heartbeat/health-monitor.js'; // was: ZH
import { interpolateSvgPath } from '../player/video-loader.js'; // was: ppm
import { volumeMutedIcon } from './svg-icons.js'; // was: S_
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { playNewIcon } from './svg-icons.js'; // was: H1
import { playIcon } from './svg-icons.js'; // was: tK
import { pauseNewIcon } from './svg-icons.js'; // was: K_x
import { pauseIcon } from './svg-icons.js'; // was: m7W
import { sideBySideNewIcon } from './svg-icons.js'; // was: A_0
import { sideBySideIcon } from './svg-icons.js'; // was: X5K
import { hasChapterNavigation } from './progress-bar-impl.js'; // was: T3K
import { getNextPlaylistIndex } from '../player/video-loader.js'; // was: $Jy
import { getPreviousPlaylistIndex } from '../player/video-loader.js'; // was: Pry
import { AdVideoClickthroughMetadata } from '../ads/ad-interaction.js'; // was: ux
import { updateToggleButtonState } from '../data/collection-utils.js'; // was: L2
import { getRemoteModule } from '../player/caption-manager.js'; // was: w7
import { skipNextIcon } from './svg-icons.js'; // was: qQ
import { skipNextNewIcon } from './svg-icons.js'; // was: QSw
import { previousTrackIcon } from './svg-icons.js'; // was: U7m
import { getSpritePageIndex } from './sprite-thumbnails.js'; // was: II
import { createByteRange } from '../media/format-parser.js'; // was: Lk
import { coerceNumber } from '../core/composition-helpers.js'; // was: fh
import { SLOT_MESSAGE_MARKER } from '../proto/messages-core.js'; // was: Ww
import { buildHeatmapPoints } from '../network/uri-utils.js'; // was: JzW
import { buildSmoothSvgPath } from '../network/uri-utils.js'; // was: CSn
import { buildHeatmapPointsRaw } from '../network/uri-utils.js'; // was: Rh_
import { layoutChapterSegments } from './progress-bar-impl.js'; // was: g.oi
import { StateFlag } from '../player/component-events.js'; // was: mV
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { TimedMarker } from './marker-tail.js'; // was: ZfO
import { appendMarkerOverlay } from './progress-bar-impl.js'; // was: sqd
import { sendPostRequest } from '../network/request.js'; // was: ms
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { showSampleSubtitles } from '../modules/caption/caption-internals.js'; // was: u9
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { captureBandwidthSnapshot } from '../ads/ad-prebuffer.js'; // was: x$
import { updateClipPath } from './seek-bar-tail.js'; // was: nv
import { fillChapterProgress } from './seek-bar-tail.js'; // was: Dl
import { resetBufferPosition } from '../modules/caption/caption-internals.js'; // was: Er
import { renderTimedMarker } from './seek-bar-tail.js'; // was: fyd
import { updateClipRange } from './seek-bar-tail.js'; // was: tg
import { findChapterAtPixel } from './seek-bar-tail.js'; // was: HC
import { timeToMillisString } from './seek-bar-tail.js'; // was: vBx
import { logGesture } from '../data/visual-element-tracking.js'; // was: Qj
import { getPlayerSize, getCurrentTime, getDuration } from '../player/time-tracking.js';
import { PlayerComponent } from '../player/component.js';
import { createElement, toggleClass, addClass, removeClass, setStyle } from '../core/dom-utils.js';
import { appendParamsToUrl } from '../core/url-utils.js';
import { filter, remove } from '../core/array-utils.js';
import { CueRange } from './cue-range.js';
import { Tooltip } from './control-misc.js';
import { toString } from '../core/string-utils.js';
import { clamp } from '../core/math-utils.js';
import { dispose } from '../ads/dai-cue-range.js';
import { getWatchNextResponse, getPlayerResponse } from '../player/player-api.js';
import { safeWindowOpen, setAnchorHref } from '../core/dom-utils.js';
import { replaceTemplateVars } from '../core/string-utils.js';
// TODO: resolve g.C9
// TODO: resolve g.EBW
// TODO: resolve g.k9
// TODO: resolve g.tW

// ---------------------------------------------------------------------------
// Play-error handler  (line 50067)
// ---------------------------------------------------------------------------

/**
 * Handles media play() promise rejection.
 *
 * InvalidStateError and AbortError are silently ignored. NotAllowedError
 * triggers the muted-autoplay notification, while other errors are
 * reported globally.
 *
 * @param {Object} player       The player instance.           [was: Q]
 * @param {DOMException} error  The caught exception.          [was: c]
 *
 * [was: Suw]
 */
export function handlePlayError(player, error) { // was: Suw
  if (error.name !== "InvalidStateError" && error.name !== "AbortError") {
    if (error.name === "NotAllowedError") {
      player.W.sendRawXhr();
      togglePopup(player.O, player.element, false); // was: !1 → false
    } else {
      reportErrorWithLevel(error);
    }
  }
}

// ---------------------------------------------------------------------------
// Share button availability  (line 50072)
// ---------------------------------------------------------------------------

/**
 * Returns whether the share button should be shown for the current video.
 *
 * Checks embed config, sharing state, video flags, player width (>= 240),
 * and that a videoId exists.
 *
 * @param {Object} component   The share-panel component.     [was: Q]
 * @returns {boolean}
 *
 * [was: a1]
 */
export function isShareButtonAvailable(component) { // was: a1
  let config = component.api.G(); // was: c
  const videoData = component.api.getVideoData(); // was: W
  const isMutedLiveEmbed = isEmbedWithAudio(config) && hasPlaylist(component.api) && component.api.getPlayerStateObject().W(128); // was: m
  config = config.A || config.disableSharing && component.api.getPresentingPlayerType() !== 2
    || !videoData.showShareButton || videoData.appendInitSegment || isMutedLiveEmbed || videoData.validateSlotTriggers || false; // was: !1
  const playerWidth = component.api.bX().getPlayerSize().width; // was: Q (reused)
  return !!videoData.videoId && playerWidth >= 240 && !config;
}

// ---------------------------------------------------------------------------
// Share panel — build social service buttons  (line 50081)
// ---------------------------------------------------------------------------

/**
 * Builds Facebook/Twitter share buttons and the "More" link from a
 * share-data payload. Limits to 2 social buttons, then appends the
 * more-services link.
 *
 * @param {Object} panel      Share panel component.           [was: Q]
 * @param {Object} shareData  Share-data response (links/shareTargets, more/moreLink).  [was: c]
 *
 * [was: sAR]
 */
export function buildSharePanelButtons(panel, shareData) { // was: sAR
  clearShareButtons(panel); // was: FHO(Q)
  const links = shareData.links || shareData.shareTargets; // was: W
  let count = 0; // was: m

  for (let i = 0; i < links.length && count < 2; i++) { // was: U
    const link = links[i]; // was: I

    /** @type {Object|null} SVG icon descriptor */
    let icon; // was: K
    findIcon:
    switch (link.img || link.iconId) {
      case "facebook":
        icon = {
          C: "svg",
          N: { height: "100%", version: "1.1", viewBox: "0 0 38 38", width: "100%" },
          V: [
            { C: "rect", N: { fill: "#fff", height: "34", width: "34", x: "2", y: "2" } },
            { C: "path", N: {
              d: "M 34.2,0 3.8,0 C 1.70,0 .01,1.70 .01,3.8 L 0,34.2 C 0,36.29 1.70,38 3.8,38 l 30.4,0 C 36.29,38 38,36.29 38,34.2 L 38,3.8 C 38,1.70 36.29,0 34.2,0 l 0,0 z m -1.9,3.8 0,5.7 -3.8,0 c -1.04,0 -1.9,.84 -1.9,1.9 l 0,3.8 5.7,0 0,5.7 -5.7,0 0,13.3 -5.7,0 0,-13.3 -3.8,0 0,-5.7 3.8,0 0,-4.75 c 0,-3.67 2.97,-6.65 6.65,-6.65 l 4.75,0 z",
              fill: "#39579b"
            }}
          ]
        };
        break findIcon;

      case "twitter":
        icon = {
          C: "svg",
          N: { height: "100%", version: "1.1", viewBox: "0 0 38 38", width: "100%" },
          V: [
            { C: "rect", N: { fill: "#fff", height: "34", width: "34", x: "2", y: "2" } },
            { C: "path", N: {
              d: "M 34.2,0 3.8,0 C 1.70,0 .01,1.70 .01,3.8 L 0,34.2 C 0,36.29 1.70,38 3.8,38 l 30.4,0 C 36.29,38 38,36.29 38,34.2 L 38,3.8 C 38,1.70 36.29,0 34.2,0 l 0,0 z M 29.84,13.92 C 29.72,22.70 24.12,28.71 15.74,29.08 12.28,29.24 9.78,28.12 7.6,26.75 c 2.55,.40 5.71,-0.60 7.41,-2.06 -2.50,-0.24 -3.98,-1.52 -4.68,-3.56 .72,.12 1.48,.09 2.17,-0.05 -2.26,-0.76 -3.86,-2.15 -3.95,-5.07 .63,.28 1.29,.56 2.17,.60 C 9.03,15.64 7.79,12.13 9.21,9.80 c 2.50,2.75 5.52,4.99 10.47,5.30 -1.24,-5.31 5.81,-8.19 8.74,-4.62 1.24,-0.23 2.26,-0.71 3.23,-1.22 -0.39,1.23 -1.17,2.09 -2.11,2.79 1.03,-0.14 1.95,-0.38 2.73,-0.77 -0.47,.99 -1.53,1.9 -2.45,2.66 l 0,0 z",
              fill: "#01abf0"
            }}
          ]
        };
        break findIcon;

      default:
        icon = null;
    }

    if (!icon) continue;

    const serviceName = link.sname || link.serviceName; // was: X
    const button = new PlayerComponent({ // was: A
      C: "a",
      yC: ["ytp-share-panel-service-button", "ytp-button"],
      N: { href: link.url, target: "_blank", title: serviceName },
      V: [icon]
    });

    button.listen("click", (evt) => { // was: e
      let url = link.url; // was: V
      if (isPrimaryClick(evt)) {
        let opts = {}; // was: B
        opts.target = opts.target || "YouTube";
        opts.width = opts.width || "600";
        opts.height = opts.height || "600";
        {
          let options = opts; // was: n
          options || (options = {});
          let win = window; // was: B (reused)
          let safeUrl = url instanceof zy ? url : g.k9(typeof url.href !== "undefined" ? url.href : String(url)); // was: S
          const hasCOI = self.crossOriginIsolated !== undefined; // was: d  // was: void 0
          let referrerPolicy = "strict-origin-when-cross-origin"; // was: b
          if (window.Request) {
            referrerPolicy = (new Request("/")).referrerPolicy;
          }
          let noReferrer = options.noreferrer; // was: w
          if (hasCOI && noReferrer && referrerPolicy === "unsafe-url") {
            throw Error("Cannot use the noreferrer option on a page that sets a referrer-policy of `unsafe-url` in modern browsers!");
          }
          let useLegacyNoReferrer = noReferrer && !hasCOI; // was: b (reused)
          url = options.target || url.target; // was: V (reused)
          let features = []; // was: w (reused)
          let specialFeatures = []; // was: G
          let hasExplicitFalse = false; // was: T7  // was: !1

          for (let key in options) { // was: f
            const value = options[key]; // was: oW
            switch (key) {
              case "width":
              case "height":
              case "top":
              case "left":
                features.push(key + "=" + value);
                break;
              case "target":
                break;
              case "noopener":
              case "noreferrer":
                value ? specialFeatures.push(key) : (hasExplicitFalse = true, specialFeatures.push(key + "=false"));
                break;
              case "attributionsrc":
                features.push(key + (value ? "=" + value : ""));
                break;
              default:
                features.push(key + "=" + (value ? 1 : 0));
            }
          }

          const isNamedTarget = url !== undefined && !["_blank", "_self", "_top", "_parent", ""].includes(url); // was: f (reused)  // was: void 0
          const guardedNamedTarget = gT() && isNamedTarget; // was: f (reused)

          if (EXP_FORCE_PROBE && hasCOI && features.length === 0 && specialFeatures.length > 0 && !guardedNamedTarget && !hasExplicitFalse) {
            if (specialFeatures.length === 2) {
              specialFeatures = ["noreferrer"];
            }
            safeWindowOpen(win, safeUrl, url, specialFeatures[0]);
            win = createNullWindow();
          } else {
            const featureStr = features.join(","); // was: d (reused)
            if (gO() && win.navigator && win.navigator.standalone && url && url !== "_self") {
              const anchor = createElement("A"); // was: d (reused)
              setAnchorHref(anchor, safeUrl);
              anchor.target = url;
              if (useLegacyNoReferrer) {
                anchor.rel = "noreferrer";
              }
              const attrSrc = options.attributionsrc; // was: n (reused)
              if (attrSrc || attrSrc === "") {
                anchor.setAttribute("attributionsrc", attrSrc);
              }
              const mouseEvt = document.createEvent("MouseEvent"); // was: n (reused)
              mouseEvt.initMouseEvent("click", true, true, win, 1); // was: !0, !0
              anchor.dispatchEvent(mouseEvt);
              win = createNullWindow();
            } else if (useLegacyNoReferrer) {
              win = safeWindowOpen(win, "", url, featureStr);
              const urlStr = g.C9(safeUrl); // was: n (reused)
              if (win) {
                win.opener = null;
                let finalUrl = urlStr; // was: n (reused)
                if (finalUrl === "") finalUrl = "javascript:''";
                finalUrl = '<meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0; url=' + im(finalUrl) + '">';
                const safeHtml = mk(finalUrl); // was: n (reused)
                const doc = win.document; // was: S (reused)
                if (doc && doc.write) {
                  doc.write(KR(safeHtml));
                  doc.close();
                }
              }
            } else {
              win = safeWindowOpen(win, safeUrl, url, featureStr);
              if (win && options.noopener) {
                win.opener = null;
              }
              if (win && options.noreferrer) {
                win.opener = null;
              }
            }
          }
        }
        if (win) {
          if (!win.opener) win.opener = window;
          win.focus();
        }
        evt.preventDefault();
      }
    });

    button.addOnDisposeCallback(registerTooltip(panel.tooltip, button.element));
    if (serviceName === "Facebook") {
      panel.api.createClientVe(button.element, button, 164504);
    } else if (serviceName === "Twitter") {
      panel.api.createClientVe(button.element, button, 164505);
    }
    panel.B(button.element, "click", () => {
      panel.api.logClick(button.element);
    });
    panel.api.logVisibility(button.element, true); // was: !0
    panel.O.push(button);
    count++;
  }

  // "More" link
  const moreUrl = shareData.more || shareData.moreLink; // was: T
  const moreButton = new PlayerComponent({ // was: r
    C: "a",
    yC: ["ytp-share-panel-service-button", "ytp-button"],
    V: [{
      C: "span",
      Z: "ytp-share-panel-service-button-more",
      V: [{
        C: "svg",
        N: { height: "100%", version: "1.1", viewBox: "0 0 38 38", width: "100%" },
        V: [
          { C: "rect", N: { fill: "#fff", height: "34", width: "34", x: "2", y: "2" } },
          { C: "path", N: {
            d: "M 34.2,0 3.8,0 C 1.70,0 .01,1.70 .01,3.8 L 0,34.2 C 0,36.29 1.70,38 3.8,38 l 30.4,0 C 36.29,38 38,36.29 38,34.2 L 38,3.8 C 38,1.70 36.29,0 34.2,0 Z m -5.7,21.85 c 1.57,0 2.85,-1.27 2.85,-2.85 0,-1.57 -1.27,-2.85 -2.85,-2.85 -1.57,0 -2.85,1.27 -2.85,2.85 0,1.57 1.27,2.85 2.85,2.85 z m -9.5,0 c 1.57,0 2.85,-1.27 2.85,-2.85 0,-1.57 -1.27,-2.85 -2.85,-2.85 -1.57,0 -2.85,1.27 -2.85,2.85 0,1.57 1.27,2.85 2.85,2.85 z m -9.5,0 c 1.57,0 2.85,-1.27 2.85,-2.85 0,-1.57 -1.27,-2.85 -2.85,-2.85 -1.57,0 -2.85,1.27 -2.85,2.85 0,1.57 1.27,2.85 2.85,2.85 z",
            fill: "#4e4e4f",
            "fill-rule": "evenodd"
          }}
        ]
      }]
    }],
    N: { href: moreUrl, target: "_blank", title: "More" }
  });

  moreButton.listen("click", (evt) => { // was: U
    let url = moreUrl; // was: I
    panel.api.logClick(panel.moreButton.element);
    url = appendEmbedTrackingParams(panel, url); // was: Ezy
    handleEmbedsClick(url, panel.api, evt) && publishEvent(panel.api, "SHARE_CLICKED");
  });

  moreButton.addOnDisposeCallback(registerTooltip(panel.tooltip, moreButton.element));
  panel.api.createClientVe(moreButton.element, moreButton, 164506);
  panel.B(moreButton.element, "click", () => {
    panel.api.logClick(moreButton.element);
  });
  panel.api.logVisibility(moreButton.element, true); // was: !0
  panel.O.push(moreButton);
  panel.moreButton = moreButton;
  panel.updateValue("buttons", panel.O);
}

// ---------------------------------------------------------------------------
// Clear share buttons  (line 50302)
// ---------------------------------------------------------------------------

/**
 * Removes and disposes all share-panel service buttons.
 *
 * @param {Object} panel  Share panel component.  [was: Q]
 *
 * [was: FHO]
 */
export function clearShareButtons(panel) { // was: FHO
  for (const btn of panel.O) {
    btn.detach();
    safeDispose(btn);
  }
  panel.O = [];
}

// ---------------------------------------------------------------------------
// Append embed conversion tracking params  (line 50309)
// ---------------------------------------------------------------------------

/**
 * Appends embed conversion tracking parameters to a URL if the player
 * is in embed mode.
 *
 * @param {Object} panel  Share panel component.  [was: Q]
 * @param {string} url    Original URL.           [was: c]
 * @returns {string}      URL with tracking params appended.
 *
 * [was: Ezy]
 */
export function appendEmbedTrackingParams(panel, url) { // was: Ezy
  const params = {}; // was: W
  if (isEmbedWithAudio(panel.api.G())) {
    callInternalMethod(panel.api, "addEmbedsConversionTrackingParams", [params]);
    url = appendParamsToUrl(url, params);
  }
  return url;
}

// ---------------------------------------------------------------------------
// Clip time-range validation  (line 50316)
// ---------------------------------------------------------------------------

/**
 * Returns whether a time-range object has valid start/end seconds.
 *
 * @param {Object} [range]  Object with startSec/endSec.  [was: Q]
 * @returns {boolean}       true if both bounds are defined.
 *
 * [was: Gw]
 */
export function isValidTimeRange(range) { // was: Gw
  return range === undefined || range.startSec === undefined || range.endSec === undefined ? false : true; // was: void 0
}

/**
 * Offsets a time range by `offset` seconds (mutates in place).
 *
 * @param {Object} range   Object with startSec/endSec.  [was: Q]
 * @param {number} offset  Seconds to shift by.          [was: c]
 *
 * [was: $Z]
 */
export function shiftTimeRange(range, offset) { // was: $Z
  range.startSec += offset;
  range.endSec += offset;
}

// ---------------------------------------------------------------------------
// Shopping overlay visibility  (line 50325)
// ---------------------------------------------------------------------------

/**
 * Removes all shopping overlay visibility cue-range namespaces.
 *
 * @param {Object} component  Suggested action component.  [was: Q]
 *
 * [was: Pv]
 */
export function clearShoppingOverlayVisibility(component) { // was: Pv
  component.U.qI("shopping_overlay_visible");
  component.U.qI("shopping_overlay_preview_collapsed");
  component.U.qI("shopping_overlay_preview_expanded");
  component.U.qI("shopping_overlay_expanded");
}

/**
 * Sets the `isContentForward` flag and toggles the corresponding CSS class.
 *
 * @param {Object} component        Suggested action component.  [was: Q]
 * @param {boolean} isContentForward Whether content is in forward mode. [was: c]
 *
 * [was: dFn]
 */
export function setContentForward(component, isContentForward) { // was: dFn
  component.isContentForward = isContentForward;
  toggleClass(component.badge.element, "ytp-suggested-action-badge-content-forward", isContentForward);
}

/**
 * Updates the badge preview collapsed/expanded CSS classes based on
 * the current `isContentForward` state and the preview flags.
 *
 * @param {Object} component  Suggested action component.  [was: Q]
 *
 * [was: lO]
 */
export function updateBadgePreviewClasses(component) { // was: lO
  const isForwardAndNotEC = component.isContentForward && !component.toggleFineScrub();
  toggleClass(component.badge.element, "ytp-suggested-action-badge-preview-collapsed", isForwardAndNotEC && component.W);
  toggleClass(component.badge.element, "ytp-suggested-action-badge-preview-expanded", isForwardAndNotEC && component.j);
}

/**
 * Removes a child element from the suggested-action container.
 *
 * @param {Object} component  Suggested action component.  [was: Q]
 *
 * [was: LH0]
 */
export function removeSuggestedActionChild(component) { // was: LH0
  if (component.S) {
    component.jG.element.removeChild(component.S.element);
  }
  component.S = undefined; // was: void 0
}

/**
 * Converts product thumbnails into image DOM elements.
 *
 * @param {Object} component         Suggested action component.  [was: Q]
 * @param {Array}  productRenderers  Array of product renderer objects. [was: c]
 * @returns {Array<Object>}          Array of image element wrappers.
 *
 * [was: bwW]
 */
export function buildProductThumbnails(component, productRenderers) { // was: bwW
  return productRenderers.map(renderer => { // was: W
    const thumbnails = getProperty(renderer, wPR)?.thumbnail?.thumbnails;
    if (thumbnails && thumbnails.length !== 0) {
      return thumbnails[0].url;
    }
  }).filter(url => url !== undefined).map(url => { // was: void 0
    const img = new PlayerComponent({ // was: W (reused)
      C: "img",
      Z: "ytp-suggested-action-product-thumbnail",
      N: { alt: "", src: url }
    });
    registerDisposable(component, img);
    return img;
  });
}

/**
 * Creates a cue range for a suggested-action time window.
 *
 * @param {number} startSec  Start time in seconds.      [was: Q]
 * @param {number} endSec    End time in seconds.         [was: c]
 * @param {string} namespace Cue range namespace.         [was: W]
 * @returns {Object}         The cue range descriptor.
 *
 * [was: uO]
 */
export function createSuggestedActionCueRange(startSec, endSec, namespace) { // was: uO
  return new CueRange(startSec * 1000, endSec * 1000, { // was: 1E3
    priority: 9,
    namespace
  });
}

/**
 * Wires up all shopping-overlay visibility event handlers.
 *
 * @param {Object} component  Suggested action component.  [was: Q]
 *
 * [was: jAm]
 */
export function bindShoppingOverlayEvents(component) { // was: jAm
  component.B(component.U, cueRangeStartId("shopping_overlay_visible"), () => {
    component.setExperimentFlag(true); // was: !0
  });
  component.B(component.U, cueRangeEndId("shopping_overlay_visible"), () => {
    component.setExperimentFlag(false); // was: !1
  });
  component.B(component.U, cueRangeStartId("shopping_overlay_expanded"), () => {
    component.Ka = true;
    updateBadgeExpansion(component);
  });
  component.B(component.U, cueRangeEndId("shopping_overlay_expanded"), () => {
    component.Ka = false;
    updateBadgeExpansion(component);
  });
  component.B(component.U, cueRangeStartId("shopping_overlay_preview_collapsed"), () => {
    component.W = true;
    updateBadgePreviewClasses(component);
  });
  component.B(component.U, cueRangeEndId("shopping_overlay_preview_collapsed"), () => {
    component.W = false;
    updateBadgePreviewClasses(component);
  });
  component.B(component.U, cueRangeStartId("shopping_overlay_preview_expanded"), () => {
    component.j = true;
    updateBadgePreviewClasses(component);
  });
  component.B(component.U, cueRangeEndId("shopping_overlay_preview_expanded"), () => {
    component.j = false;
    updateBadgePreviewClasses(component);
  });
}

// ---------------------------------------------------------------------------
// Shopping overlay link builder  (line 50416)
// ---------------------------------------------------------------------------

/**
 * Builds the shopping overlay URL, appending embed tracking params
 * when in embed mode.
 *
 * @param {Object} component  Suggested action component.  [was: Q]
 * @returns {string}
 *
 * [was: gz_]
 */
export function buildShoppingOverlayUrl(component) { // was: gz_
  let config = component.api.G(); // was: c
  const videoData = component.api.getVideoData(); // was: W
  let url = getBaseOrigin(config) + videoData.PA; // was: W (reused)
  if (!isEmbedWithAudio(config)) return url;
  const params = {};
  callInternalMethod(component.api, "addEmbedsConversionTrackingParams", [params]);
  return appendParamsToUrl(url, params);
}

// ---------------------------------------------------------------------------
// Subscribe button  (line 50427)
// ---------------------------------------------------------------------------

/**
 * Creates and attaches the subscribe button for the video owner, unless
 * the player config disables it (iX flag).
 *
 * @param {Object} component  Title bar component.  [was: Q]
 *
 * [was: Ow0]
 */
export function createSubscribeButton(component) { // was: Ow0
  if (!component.api.G().readRepeatedMessageField) {
    const videoData = component.api.getVideoData(); // was: c
    const subscribeBtn = new g.tW( // was: W
      "Subscribe", null, "Subscribed", null,
      true, false, // was: !0, !1
      videoData.nB, videoData.subscribed,
      "channel_avatar", null, component.api, true // was: !0
    );
    component.api.createServerVe(subscribeBtn.element, component);
    component.api.setTrackingParams(subscribeBtn.element, videoData.subscribeButtonRenderer?.trackingParams || null);
    component.B(subscribeBtn.element, "click", () => {
      component.api.logClick(subscribeBtn.element);
    });
    component.subscribeButton = subscribeBtn;
    registerDisposable(component, component.subscribeButton);
    component.subscribeButton.createVisualElement(component.element);
  }
}

// ---------------------------------------------------------------------------
// Channel logo / title  (line 50443)
// ---------------------------------------------------------------------------

/**
 * Enables or disables the channel logo in the player title bar.
 *
 * @param {Object} component     Title bar component.                [was: Q]
 * @param {boolean} show         Whether to show the channel logo.   [was: c]
 * @param {string} [imageUrl=""] Channel avatar URL.                 [was: W]
 * @param {string} [channelName=""] Channel display name.            [was: m]
 *
 * [was: fjK]
 */
export function updateChannelLogo(component, show, imageUrl = "", channelName = "") { // was: fjK
  if (show) {
    if (component.O !== imageUrl) {
      component.W.style.backgroundImage = `url(${imageUrl})`;
      component.O = imageUrl;
    }
    component.updateValue("channelLogoLabel", replaceTemplateVars("Photo image of $CHANNEL_NAME", {
      CHANNEL_NAME: channelName
    }));
    addClass(component.api.getRootNode(), "ytp-title-enable-channel-logo");
  } else {
    removeClass(component.api.getRootNode(), "ytp-title-enable-channel-logo");
  }
  component.api.logVisibility(component.W, show && component.mF);
  component.api.logVisibility(component.channelName, show && component.mF);
}

// ---------------------------------------------------------------------------
// Bottom gradient  (line 50454)
// ---------------------------------------------------------------------------

/**
 * Renders the bottom gradient overlay for the player chrome, using a
 * canvas to draw a linear gradient from transparent to semi-opaque black.
 *
 * @param {Object} component  Gradient component.           [was: Q]
 * @param {number} height     Player height in pixels.      [was: c]
 *
 * [was: vzw]
 */
export function renderBottomGradient(component, height) { // was: vzw
  if (component.W) {
    height = Math.floor(height * 0.4);
    height = Math.max(height, 47);
    const totalHeight = height + 2; // was: W
    if (component.A !== totalHeight) {
      component.A = totalHeight;
      component.O.height = totalHeight;
      component.W.clearRect(0, 0, 1, totalHeight);
      const gradient = component.W.createLinearGradient(0, 2, 0, 2 + height); // was: m
      const offset = height - 42; // was: K
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(offset / height, "rgba(0, 0, 0, 0.3)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.68)");
      component.W.fillStyle = gradient;
      component.W.fillRect(0, 2, 1, height);
      component.element.style.height = `${totalHeight}px`;
      try {
        component.element.style.backgroundImage = `url(${component.O.toDataURL()})`;
      } catch (_e) {
        // Canvas toDataURL may fail in certain security contexts
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Chapter title  (line 50478)
// ---------------------------------------------------------------------------

/**
 * Updates the chapter title display and shows/hides it accordingly.
 *
 * @param {Object} component   Chapter display component.  [was: Q]
 * @param {string} chapterTitle  Title text (empty hides).  [was: c]
 *
 * [was: aj_]
 */
export function updateChapterTitle(component, chapterTitle) { // was: aj_
  if (chapterTitle !== component.D) {
    component.update({ chapterTitle, ariaLabel: chapterTitle });
    component.D = chapterTitle;
  }
  chapterTitle ? component.show() : component.hide();
}

/**
 * Updates the chapter container disabled state and refreshes layout.
 *
 * @param {Object} component  Chapter container component.  [was: Q]
 *
 * [was: GK7]
 */
export function updateChapterContainerDisabled(component) { // was: GK7
  component.W.disabled = component.O == null;
  toggleClass(component.W, "ytp-chapter-container-disabled", component.W.disabled);
  component.kx();
}

// ---------------------------------------------------------------------------
// Sprite thumbnail positioning  (line 50493)
// ---------------------------------------------------------------------------

/**
 * Positions and sizes a sprite-sheet thumbnail element within a given
 * container rectangle. Computes the visible frame from the sprite grid
 * and sets CSS background offset/sizing.
 *
 * @param {HTMLElement} element   Target element.                     [was: Q]
 * @param {Object}      sprite   Sprite descriptor (url, columns, rows, row, column, Ab, lL). [was: c]
 * @param {number}      maxWidth Available width.                     [was: W]
 * @param {number}      maxHeight Available height.                   [was: m]
 * @param {boolean}     [isInline=false] Skip vertical centering.    [was: K]
 *
 * [was: $Fx]
 */
export function positionSpriteThumbnail(element, sprite, maxWidth, maxHeight, isInline) { // was: $Fx
  const frameHeight = sprite.lL / sprite.rows; // was: T
  let scale = Math.min(maxWidth / (sprite.Ab / sprite.columns), maxHeight / frameHeight); // was: r
  let sheetWidth = sprite.Ab * scale; // was: U
  let sheetHeight = sprite.lL * scale; // was: I
  sheetWidth = Math.floor(sheetWidth / sprite.columns) * sprite.columns;
  sheetHeight = Math.floor(sheetHeight / sprite.rows) * sprite.rows;
  let frameW = sheetWidth / sprite.columns; // was: X
  let frameH = sheetHeight / sprite.rows; // was: A
  const offsetX = -sprite.column * frameW; // was: e
  const offsetY = -sprite.row * frameH; // was: V
  if (isInline && frameHeight <= 45) {
    frameH -= 1 / scale;
  }
  frameW -= 2 / scale;
  const style = element.style;
  style.width = `${frameW}px`;
  style.height = `${frameH}px`;
  if (!isInline) {
    const marginV = (maxHeight - frameH) / 2;
    const marginH = (maxWidth - frameW) / 2;
    style.marginTop = Math.floor(marginV) + "px";
    style.marginBottom = Math.ceil(marginV) + "px";
    style.marginLeft = Math.floor(marginH) + "px";
    style.marginRight = Math.ceil(marginH) + "px";
  }
  style.background = `url(${sprite.url}) ${offsetX}px ${offsetY}px/${sheetWidth}px ${sheetHeight}px`;
}

// ---------------------------------------------------------------------------
// Storyboard overlay  (line 50518)
// ---------------------------------------------------------------------------

/**
 * Enables or disables the storyboard overlay. When enabled, wires up
 * event listeners for video data changes, progress sync, and app resize.
 * When disabled, tears down listeners and hides the overlay.
 *
 * @param {Object} overlay     Storyboard overlay component.  [was: Q]
 * @param {Object|null} data   Storyboard data (null to disable).  [was: c]
 *
 * [was: hW]
 */
export function setStoryboardData(overlay, data) { // was: hW
  const wasActive = !!overlay.W; // was: W
  overlay.W = data;
  if (overlay.W) {
    if (!wasActive) {
      overlay.events.B(overlay.api, "videodatachange", () => {
        setStoryboardData(overlay, overlay.api.sV());
      });
      overlay.events.B(overlay.api, "progresssync", overlay.onProgress);
      overlay.events.B(overlay.api, "appresize", overlay.j);
    }
    overlay.frameIndex = NaN;
    updateStoryboardFrame(overlay); // was: zw
    overlay.fade.show(200);
  } else {
    if (wasActive) overlay.events.O();
    overlay.fade.hide();
    overlay.fade.stop();
  }
}

/**
 * Updates the storyboard frame display based on the current playback time.
 *
 * @param {Object} overlay  Storyboard overlay component.  [was: Q]
 *
 * [was: zw]
 */
export function updateStoryboardFrame(overlay) { // was: zw
  let storyboard = overlay.W; // was: c
  const currentTime = overlay.api.getCurrentTime(); // was: W
  const playerSize = overlay.api.bX().getPlayerSize(); // was: m
  let level = selectResolutionLevel(storyboard, playerSize.width); // was: K
  level = getFrameIndexAtTime(storyboard, level, currentTime); // was: K (reused)
  overlay.update({ timestamp: formatDuration(currentTime) });
  if (level !== overlay.frameIndex) {
    overlay.frameIndex = level;
    enqueueSpritesheetLoads(storyboard, level, playerSize.width);
    storyboard = findLoadedTile(storyboard, level, playerSize.width);
    positionSpriteThumbnail(overlay.O, storyboard, playerSize.width, playerSize.height);
  }
}

// Lines 50549–50600 are covered in seek-overlay.js (fullscreen icon SVGs)

// ---------------------------------------------------------------------------
// Jump button  (line 50687)
// ---------------------------------------------------------------------------

/**
 * Enables or disables the "jump" (skip intro/outro) button and logs
 * visibility.
 *
 * @param {Object} component  Jump button component.  [was: Q]
 * @param {boolean} enabled   Whether the button is enabled.  [was: c]
 *
 * [was: ljK]
 */
export function setJumpButtonEnabled(component, enabled) { // was: ljK
  enabled ? component.element.classList.add("ytp-jump-button-enabled")
    : component.element.classList.remove("ytp-jump-button-enabled");
  component.U.logVisibility(component.element, enabled);
  component.U.WI();
}

// ---------------------------------------------------------------------------
// Info card / key moments  (line 50693)
// ---------------------------------------------------------------------------

/**
 * Finds the first applicable key-moments info card entry, excluding
 * problem walkthrough panels.
 *
 * @param {Object} component  The info card trigger component.  [was: Q]
 * @returns {Object|undefined}
 *
 * [was: u3w]
 */
export function findInfoCardEntry(component) { // was: u3w
  const entries = component.U.getVideoData()?.Ka; // was: c
  if (entries) {
    const map = component.j.parseHexColor; // was: Q (reused)
    for (const key of entries) {
      const entry = map[key]; // was: c (reused)
      if (entry && entry.onTap?.innertubeCommand?.changeEngagementPanelVisibilityAction?.targetId !== "engagement-panel-macro-markers-problem-walkthroughs") {
        return entry;
      }
    }
  }
}

/**
 * Returns the icon for the info-card trigger, using modern icons if enabled.
 *
 * @param {Object} component  Info card trigger component.  [was: Q]
 * @returns {Object}          SVG icon descriptor.
 *
 * [was: hsO]
 */
export function getInfoCardIcon(component) { // was: hsO
  return component.U.X("delhi_modern_web_player_icons") ? pictureInPictureIcon() : miniplayerIcon();
}

// ---------------------------------------------------------------------------
// Slider animation  (line 50707)
// ---------------------------------------------------------------------------

/**
 * Updates the slider shape gradient CSS variable percentage.
 *
 * @param {Object} slider  Slider component.              [was: Q]
 * @param {number} value   Current slider value.           [was: c]
 *
 * [was: zsR]
 */
export function updateSliderGradient(slider, value) { // was: zsR
  slider.O.style.setProperty(
    "--yt-slider-shape-gradient-percent",
    `${(value - slider.A) / (slider.D - slider.A) * 100}%`
  );
}

/**
 * Sets the slider to a target value, optionally animating the transition.
 *
 * @param {Object} slider    Slider component.            [was: Q]
 * @param {number} target    Target value.                [was: c]
 * @param {boolean} [animate=false] Whether to animate.   [was: W]
 *
 * [was: CI]
 */
export function setSliderValue(slider, target, animate = false) { // was: CI  // was: !1
  if (slider.j) {
    cancelAnimationFrame(slider.j);
    slider.j = 0;
  }
  animate ? animateSlider(slider, slider.W, target) : applySliderValue(slider, target);
}

/**
 * Animates the slider from `from` to `to` over 400ms using an easing curve.
 *
 * @param {Object} slider  Slider component.  [was: Q]
 * @param {number} from    Start value.       [was: c]
 * @param {number} to      End value.         [was: W]
 *
 * [was: CcK]
 */
export function animateSlider(slider, from, to) { // was: CcK
  const startTime = performance.now(); // was: m
  const delta = to - from; // was: K
  if (delta !== 0) {
    const step = (timestamp) => { // was: T
      let progress = (timestamp - startTime) / 400; // was: r
      if (progress > 1) progress = 1;
      applySliderValue(slider, from + delta * bezierY(J60, solveBezierT(J60, progress)));
      slider.j = progress < 1 ? requestAnimationFrame(step) : 0;
    };
    slider.j = requestAnimationFrame(step);
  }
}

/**
 * Directly applies a numeric value to the slider, updating DOM and ARIA.
 *
 * @param {Object} slider  Slider component.  [was: Q]
 * @param {number} value   The value to apply. [was: c]
 *
 * [was: Mg_]
 */
export function applySliderValue(slider, value) { // was: Mg_
  slider.W = value;
  slider.update({
    slidervalue: slider.W,
    ariaValueNow: slider.W,
    ariaValueText: `${slider.W.toFixed(2)}`
  });
  slider.O.valueAsNumber = slider.W;
  updateSliderGradient(slider, value);
}

// ---------------------------------------------------------------------------
// Volume popover  (line 50743)
// ---------------------------------------------------------------------------

/**
 * Toggles the volume popover hover state and propagates visibility
 * to the chrome-bottom container.
 *
 * @param {Object} popover  Volume popover component.  [was: Q]
 * @param {boolean} visible Whether the popover should be visible.  [was: c]
 *
 * [was: Rsw]
 */
export function setVolumePopoverVisible(popover, visible) { // was: Rsw
  popover.element.classList.toggle("ytp-volume-popover-hovering", visible);
  popover.isVisible = visible;
  const chromeBottom = popover.element.closest(".ytp-chrome-bottom");
  if (chromeBottom) {
    chromeBottom.classList.toggle("ytp-volume-popover-showing", visible);
  }
}

/**
 * Creates the "your browser doesn't support changing the volume" popup.
 *
 * @param {Object} component  Volume button component.  [was: Q]
 *
 * [was: kKw]
 */
export function createVolumeUnsupportedPopup(component) { // was: kKw
  let popup = null; // was: c
  const messageParts = "Your browser doesn't support changing the volume. $BEGIN_LINKLearn More$END_LINK".split(/\$(BEGIN|MusicTrackHandler)_LINK/); // was: W
  popup = new PopupWidget(component.U, {
    C: "span",
    yC: ["ytp-popup", "ytp-generic-popup"],
    N: { tabindex: "0" },
    V: [messageParts[0], {
      C: "a",
      N: { href: "https://support.google.com/youtube/?p=noaudio", target: component.U.G().Y },
      eG: messageParts[2]
    }, messageParts[4]]
  }, 100, true); // was: !0
  registerDisposable(component, popup);
  popup.hide();
  popup.subscribe("show", (visible) => { // was: m
    component.U.SimpleDate(popup, visible);
  });
  insertAtLayer(component.U, popup.element, 4);
}

/**
 * Updates the volume ripple scale transform on the volume icon.
 *
 * @param {Object} component  Volume button component.  [was: Q]
 * @param {number} scale      Ripple scale factor (0-1). [was: c]
 *
 * [was: Qq_]
 */
export function updateVolumeRipple(component, scale) { // was: Qq_
  component.L = scale;
  let svgPath = component.PA; // was: W
  if (component.U.X("delhi_modern_web_player_icons")) {
    component.O.z2("ytp-svg-volume-animation-big-ripple")
      .setAttribute("transform", `translate(${JW}, ${R1}) scale(${scale}) translate(-${JW},-${R1})`);
  } else if (scale) {
    svgPath += interpolateSvgPath(YuK, pPn, scale);
  }
  component.S.setAttribute("d", svgPath);
}

// ---------------------------------------------------------------------------
// Volume icon states  (line 50783)
// ---------------------------------------------------------------------------

/**
 * Updates the volume icon to reflect the current mute-animation progress.
 * Handles both modern (SVG transform) and legacy (element transform/display)
 * icon variants.
 *
 * @param {Object} component    Volume button component.     [was: Q]
 * @param {number} muteProgress Mute animation progress (0-1). [was: c]
 *
 * [was: mG3]
 */
export function updateVolumeIconState(component, muteProgress) { // was: mG3
  let icon; // was: W
  if (muteProgress === 1) {
    icon = component.U.X("delhi_modern_web_player_icons") ? {
      C: "svg",
      N: { height: "24", viewBox: "0 0 24 24", width: "24" },
      V: [{
        C: "path",
        N: {
          d: "M11.60 2.08L11.48 2.14L3.91 6.68C3.02 7.21 2.28 7.97 1.77 8.87C1.26 9.77 1.00 10.79 1 11.83V12.16L1.01 12.56C1.07 13.52 1.37 14.46 1.87 15.29C2.38 16.12 3.08 16.81 3.91 17.31L11.48 21.85C11.63 21.94 11.80 21.99 11.98 21.99C12.16 22.00 12.33 21.95 12.49 21.87C12.64 21.78 12.77 21.65 12.86 21.50C12.95 21.35 13 21.17 13 21V3C12.99 2.83 12.95 2.67 12.87 2.52C12.80 2.37 12.68 2.25 12.54 2.16C12.41 2.07 12.25 2.01 12.08 2.00C11.92 1.98 11.75 2.01 11.60 2.08ZM4.94 8.4V8.40L11 4.76V19.23L4.94 15.6C4.38 15.26 3.92 14.80 3.58 14.25C3.24 13.70 3.05 13.07 3.00 12.43L3 12.17V11.83C2.99 11.14 3.17 10.46 3.51 9.86C3.85 9.25 4.34 8.75 4.94 8.4ZM21.29 8.29L19 10.58L16.70 8.29L16.63 8.22C16.43 8.07 16.19 7.99 15.95 8.00C15.70 8.01 15.47 8.12 15.29 8.29C15.12 8.47 15.01 8.70 15.00 8.95C14.99 9.19 15.07 9.43 15.22 9.63L15.29 9.70L17.58 12L15.29 14.29C15.19 14.38 15.12 14.49 15.06 14.61C15.01 14.73 14.98 14.87 14.98 15.00C14.98 15.13 15.01 15.26 15.06 15.39C15.11 15.51 15.18 15.62 15.28 15.71C15.37 15.81 15.48 15.88 15.60 15.93C15.73 15.98 15.86 16.01 15.99 16.01C16.12 16.01 16.26 15.98 16.38 15.93C16.50 15.87 16.61 15.80 16.70 15.70L19 13.41L21.29 15.70L21.36 15.77C21.56 15.93 21.80 16.01 22.05 15.99C22.29 15.98 22.53 15.88 22.70 15.70C22.88 15.53 22.98 15.29 22.99 15.05C23.00 14.80 22.93 14.56 22.77 14.36L22.70 14.29L20.41 12L22.70 9.70C22.80 9.61 22.87 9.50 22.93 9.38C22.98 9.26 23.01 9.12 23.01 8.99C23.01 8.86 22.98 8.73 22.93 8.60C22.88 8.48 22.81 8.37 22.71 8.28C22.62 8.18 22.51 8.11 22.39 8.06C22.26 8.01 22.13 7.98 22.00 7.98C21.87 7.98 21.73 8.01 21.61 8.06C21.49 8.12 21.38 8.19 21.29 8.29Z",
          fill: "white"
        }
      }]
    } : volumeMutedIcon();
  } else {
    icon = component.O;
  }

  component.Ka = muteProgress;

  if (component.U.X("delhi_modern_web_player_icons")) {
    component.O.z2("ytp-svg-volume-animation-small-ripple")
      .setAttribute("transform", `translate(${PLAY_ICON_SIZE}, ${PLAY_ICON_LEFT}) scale(${1 - muteProgress}) translate(-${PLAY_ICON_SIZE},-${PLAY_ICON_LEFT})`);
    component.O.z2("ytp-svg-volume-animation-big-ripple")
      .setAttribute("transform", `translate(${JW}, ${R1}) scale(${component.L - muteProgress}) translate(-${JW}, -${R1})`);
  } else {
    let offset = 20 * muteProgress; // was: m
    for (let i = 0; i < component.K.length; i++) { // was: K
      component.K[i].setAttribute("transform", `translate(${offset}, ${offset})`);
    }
    for (let i = 0; i < component.j.length; i++) { // was: m (reused)
      const createDatabaseDefinition = component.j[i]; // was: K (reused)
      if (createDatabaseDefinition?.style) {
        createDatabaseDefinition.style.display = muteProgress === 0 ? "none" : "";
      }
    }
  }

  if (icon !== component.isSamsungSmartTV) {
    component.updateValue("icon", icon);
    component.isSamsungSmartTV = icon;
  }
}

/**
 * Updates the mute/unmute tooltip and aria-label on the volume button.
 *
 * @param {Object} component  Volume button component.        [was: Q]
 * @param {boolean} isMuted   Whether the player is muted.    [was: c]
 *
 * [was: K6K]
 */
export function updateVolumeTooltip(component, isMuted) { // was: K6K
  if (component.U.G().MM) {
    let label = formatTooltip(component.U, "Mute", "m"); // was: W
    const unmutedLabel = formatTooltip(component.U, "Unmute", "m"); // was: m
    label = isMuted ? unmutedLabel : label;
    if (component.U.G().X("player_tooltip_data_title_killswitch")) {
      component.updateValue("title", label);
    } else {
      component.update({ "tooltip-title": label, "aria-label": label });
    }
    component.update({ "data-title-no-tooltip": isMuted ? "Unmute" : "Mute" });
    component.tooltip.WI();
  }
}

// ---------------------------------------------------------------------------
// Autoplay / Next button icon  (line 50832)
// ---------------------------------------------------------------------------

/**
 * Returns the appropriate autoplay-action icon for the given type.
 *
 * @param {Object} component  The button component (for experiment flag checks). [was: Q]
 * @param {number} type       Action type (1=play, 2=pause, 3=replay, 4=?). [was: c]
 * @returns {Object|null}     SVG icon descriptor, or null.
 *
 * [was: kZ]
 */
export function getAutoplayActionIcon(component, type) { // was: kZ
  const isModern = component.U.X("delhi_modern_web_player_icons"); // was: Q (reused)
  switch (type) {
    case 1:
      return isModern ? playNewIcon() : playIcon();
    case 2:
      return isModern ? pauseNewIcon() : pauseIcon();
    case 3:
      return isModern ? {
        C: "svg",
        N: { fill: "none", height: "36", viewBox: "0 0 36 36", width: "36" },
        V: [{ C: "path", N: {
          d: "M11.29 2.92C14.85 1.33 18.87 1.06 22.61 2.15L22.96 2.26C26.56 3.40 29.67 5.74 31.75 8.89L31.95 9.19C33.90 12.28 34.77 15.93 34.42 19.56L34.38 19.93C34.04 22.79 32.96 25.51 31.25 27.83C29.53 30.14 27.23 31.97 24.59 33.12C21.95 34.27 19.05 34.71 16.18 34.40C13.32 34.08 10.59 33.02 8.26 31.32L7.97 31.10C4.87 28.73 2.71 25.33 1.88 21.52L3.34 21.20L4.81 20.88C5.49 24.00 7.25 26.77 9.79 28.72L10.27 29.07C12.19 30.40 14.41 31.22 16.74 31.44C19.06 31.65 21.40 31.27 23.53 30.31C25.66 29.35 27.50 27.86 28.88 25.98C30.26 24.10 31.13 21.89 31.40 19.58L31.46 18.98C31.68 16.00 30.90 13.03 29.25 10.54C27.60 8.05 25.17 6.18 22.34 5.22L21.77 5.04C19.02 4.23 16.08 4.33 13.38 5.31C10.68 6.29 8.37 8.11 6.77 10.5H10.5L10.65 10.50C11.03 10.54 11.38 10.73 11.63 11.02C11.88 11.31 12.01 11.69 11.99 12.07C11.97 12.46 11.81 12.82 11.53 13.08C11.25 13.35 10.88 13.49 10.5 13.5H1.5V4.5L1.50 4.34C1.54 3.97 1.71 3.63 1.99 3.38C2.27 3.13 2.62 3.00 3 3.00C3.37 3.00 3.72 3.13 4.00 3.38C4.28 3.63 4.45 3.97 4.49 4.34L4.5 4.5V8.51C6.21 6.07 8.56 4.13 11.29 2.92ZM24 18L15 12.75V23.25L24 18ZM3.02 19.73C2.63 19.82 2.29 20.05 2.08 20.39C1.86 20.72 1.79 21.13 1.88 21.52L4.81 20.88C4.77 20.69 4.69 20.50 4.57 20.34C4.46 20.18 4.32 20.04 4.15 19.94C3.99 19.83 3.80 19.76 3.61 19.72C3.41 19.69 3.21 19.69 3.02 19.73Z",
          fill: "white"
        }}]
      } : refreshArrowIcon();
    case 4:
      return isModern ? sideBySideNewIcon() : sideBySideIcon();
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Next video button  (line 50863)
// ---------------------------------------------------------------------------

/**
 * Updates the next-video button state: disabled flag, tooltip/preview,
 * duration, URL, and aria attributes. Handles playlist navigation,
 * autoplay suggestions, and replay state.
 *
 * @param {Object} button  Next-video button component.  [was: Q]
 *
 * [was: YZ]
 */
export function updateNextVideoButton(button) { // was: YZ
  const data = {
    duration: null, preview: null, text: null, title: null,
    "tooltip-title": null, url: null, "data-title-no-tooltip": null,
    "aria-keyshortcuts": null
  };
  let hasNext = button.playlist != null && button.playlist.hasNext(); // was: W
  hasNext = hasPlaylist(button.U) && (!button.W || hasNext);
  const hasAutoplayNext = button.W && isAutoplayEligible(button.U); // was: m
  const hasChapterNav = hasChapterNavigation(button); // was: K  // was: T3K
  const isPreviewMode = button.W && button.U.getPresentingPlayerType() === 5; // was: T
  const nextLabel = formatTooltip(button.U, "Next", "SHIFT+n"); // was: r
  let prevLabel = formatTooltip(button.U, "Previous", "SHIFT+p"); // was: U

  if (isPreviewMode) {
    data.title = "Start video";
    data["tooltip-title"] = "Start video";
  } else if (button.A) {
    data.title = "Replay";
    data["tooltip-title"] = "Replay";
  } else if (hasNext) {
    let nextVideo = null; // was: I
    if (button.playlist) {
      nextVideo = createVideoDataForPlaylistItem(button.playlist, button.W ? getNextPlaylistIndex(button.playlist) : getPreviousPlaylistIndex(button.playlist));
    }
    if (nextVideo) {
      if (nextVideo.videoId) {
        const listId = button.playlist.listId; // was: X
        data.url = button.U.G().getVideoUrl(nextVideo.videoId, listId ? listId.toString() : undefined); // was: void 0
      }
      data.text = nextVideo.title;
      data.duration = nextVideo.lengthText ? nextVideo.lengthText
        : nextVideo.lengthSeconds ? formatDuration(nextVideo.lengthSeconds) : null;
      data.preview = nextVideo.AdVideoClickthroughMetadata("mqdefault.jpg");
    }
    if (button.W) {
      data.title = nextLabel;
      data["tooltip-title"] = nextLabel;
      data["data-title-no-tooltip"] = "Next";
      data["aria-keyshortcuts"] = "SHIFT+n";
    } else {
      data.title = prevLabel;
      data["tooltip-title"] = prevLabel;
      data["data-title-no-tooltip"] = "Previous";
      data["aria-keyshortcuts"] = "SHIFT+p";
    }
  } else if (hasAutoplayNext) {
    prevLabel = button.videoData?.mF(); // reused
    if (prevLabel) {
      data.url = prevLabel.updateToggleButtonState();
      data.text = prevLabel.title;
      data.duration = prevLabel.lengthText ? prevLabel.lengthText
        : prevLabel.lengthSeconds ? formatDuration(prevLabel.lengthSeconds) : null;
      data.preview = prevLabel.AdVideoClickthroughMetadata("mqdefault.jpg");
    }
    data.title = nextLabel;
    data["tooltip-title"] = nextLabel;
    data["data-title-no-tooltip"] = "Next";
    data["aria-keyshortcuts"] = "SHIFT+n";
  }

  data.disabled = !hasAutoplayNext && !hasNext && !hasChapterNav && !isPreviewMode;
  button.update(data);
  button.J = !!data.url;

  if (hasAutoplayNext || hasNext || button.A || hasChapterNav || isPreviewMode) {
    if (!button.O) {
      button.O = registerTooltip(button.tooltip, button.element);
      button.K = button.listen("click", button.onClick, button);
    }
  } else if (button.O) {
    button.O();
    button.O = null;
    button.Xd(button.K);
    button.K = null;
  }

  button.tooltip.WI();
  toggleClass(button.element, "ytp-playlist-ui", button.W && (hasNext || button.U.X("web_hide_next_button")));
}

/**
 * Unsubscribes from playlist shuffle events.
 *
 * @param {Object} button  Next-video button component.  [was: Q]
 *
 * [was: oB0]
 */
export function unsubscribePlaylistShuffle(button) { // was: oB0
  if (button.playlist) {
    button.playlist.unsubscribe("shuffle", button.onVideoDataChange, button);
  }
}

/**
 * Returns whether the previous-video button should be available.
 *
 * @param {Object} button  Next-video button component.  [was: Q]
 * @returns {boolean}
 *
 * [was: r5w]
 */
export function isPreviousButtonAvailable(button) { // was: r5w
  return !!button.playlist && !button.W && !!button.videoData
    && !button.videoData.isLivePlayback
    && button.U.getCurrentTime() >= 3
    && button.U.getPresentingPlayerType() !== 2;
}

/**
 * Returns whether chapter-based navigation is available in the given direction.
 *
 * @param {Object} button  Next-video button component.  [was: Q]
 * @returns {boolean}
 *
 * [was: T3K]
 */
export function hasChapterNavigation(button) { // was: T3K
  const chapters = getRemoteModule(button.U.CO()); // was: c
  return chapters ? (button.W ? chapters.hasNext() : chapters.hasPrevious()) : false;
}

// ---------------------------------------------------------------------------
// Previous/Next icon helper  (line 50942)
// ---------------------------------------------------------------------------

/**
 * Returns the SVG icon for the previous or next button.
 *
 * @param {boolean} isModern    Whether modern icons are enabled.  [was: Q]
 * @param {boolean} isPrevious  Whether this is the previous button. [was: c]
 * @returns {Object}            SVG icon descriptor.
 *
 * [was: UGW]
 */
export function getPrevNextIcon(isModern, isPrevious) { // was: UGW
  if (isModern) {
    return isPrevious ? skipNextNewIcon() : skipNextIcon();
  }
  return isPrevious ? {
    C: "svg",
    N: { fill: "none", height: "24", viewBox: "0 0 24 24", width: "24" },
    V: [{
      C: "path",
      N: {
        d: "M4 4C3.73 4 3.48 4.10 3.29 4.29C3.10 4.48 3 4.73 3 5V19C3 19.26 3.10 19.51 3.29 19.70C3.48 19.89 3.73 20 4 20C4.26 20 4.51 19.89 4.70 19.70C4.89 19.51 5 19.26 5 19V5C5 4.73 4.89 4.48 4.70 4.29C4.51 4.10 4.26 4 4 4ZM18.95 4.23L6 12.00L18.95 19.77C19.15 19.89 19.39 19.96 19.63 19.96C19.87 19.97 20.10 19.91 20.31 19.79C20.52 19.67 20.69 19.50 20.81 19.29C20.93 19.09 21.00 18.85 21 18.61V5.38C20.99 5.14 20.93 4.91 20.81 4.70C20.69 4.50 20.52 4.33 20.31 4.21C20.10 4.09 19.87 4.03 19.63 4.03C19.39 4.04 19.15 4.10 18.95 4.23Z",
        fill: "white"
      }
    }]
  } : previousTrackIcon();
}

// ---------------------------------------------------------------------------
// Seek bar ARIA  (line 50961)
// ---------------------------------------------------------------------------

/**
 * Updates the seek bar's ARIA attributes to reflect the given time.
 *
 * @param {Object} seekBar      Seek bar component.   [was: Q]
 * @param {number} timeSeconds  Current time in seconds.  [was: c]
 *
 * [was: pI]
 */
export function updateSeekBarAria(seekBar, timeSeconds) { // was: pI
  const formattedTime = formatDuration(timeSeconds); // was: W
  const ariaText = replaceTemplateVars("Seek to $PROGRESS", { PROGRESS: formatDuration(timeSeconds, true) }); // was: m  // was: !0
  seekBar.update({
    ariamin: 0,
    ariamax: Math.floor(seekBar.api.getDuration()),
    arianow: Math.floor(timeSeconds),
    arianowtext: ariaText,
    seekTime: formattedTime
  });
}

/**
 * Resets the seek bar's internal seek-tracking state.
 *
 * @param {Object} seekBar  Seek bar component.  [was: Q]
 *
 * [was: QV]
 */
export function resetSeekState(seekBar) { // was: QV
  seekBar.Y = NaN;
  seekBar.L = 0;
  seekBar.J = seekBar.A;
}

/**
 * Updates the seek bar's filmstrip position for the given time, adjusting
 * the CSS transform to center the correct frame.
 *
 * @param {Object} seekBar  Seek bar component.     [was: Q]
 * @param {number} time     Time in seconds to seek to. [was: c]
 *
 * [was: cC]
 */
export function updateFilmstripPosition(seekBar, time) { // was: cC
  if (seekBar.S) seekBar.S.Mq = true; // was: !0
  seekBar.update({ seekTime: formatDuration(time) });
  const frameWidth = seekBar.D * seekBar.scale; // was: W
  let offset = time < seekBar.interval / 2
    ? -time * frameWidth / seekBar.interval * 2 + seekBar.W / 2
    : -time * frameWidth / seekBar.interval - frameWidth / 2 + seekBar.W / 2; // was: c (reused)
  offset = clamp(offset, getMinFilmstripOffset(seekBar), seekBar.W / 2); // was: IyO
  seekBar.J = offset;
  seekBar.A = seekBar.J;
  setStyle(seekBar.isSamsungSmartTV, "transform", `translateX(${seekBar.J - seekBar.W / 2}px)`);
  setStyle(seekBar.isSamsungSmartTV, "padding", `0px ${seekBar.W / 2}px`);
  setStyle(seekBar.K, "position", "relative");
}

/**
 * Converts a pixel offset in the filmstrip back to a time in seconds.
 *
 * @param {Object} seekBar  Seek bar component.  [was: Q]
 * @param {number} offset   Pixel offset.        [was: c]
 * @returns {number}        Time in seconds.
 *
 * [was: Xfm]
 */
export function filmstripOffsetToTime(seekBar, offset) { // was: Xfm
  const frameWidth = seekBar.D * seekBar.scale; // was: W
  offset -= seekBar.W / 2; // was: c (reused)
  return offset > -frameWidth
    ? -offset / frameWidth * seekBar.interval * 0.5
    : -(offset + frameWidth / 2) / frameWidth * seekBar.interval;
}

/**
 * Returns the minimum (leftmost) filmstrip offset in pixels.
 *
 * @param {Object} seekBar  Seek bar component.  [was: Q]
 * @returns {number}
 *
 * [was: IyO]
 */
export function getMinFilmstripOffset(seekBar) { // was: IyO
  return -((seekBar.K.offsetWidth || (seekBar.frameCount - 1) * seekBar.D * seekBar.scale) - seekBar.W / 2);
}

// ---------------------------------------------------------------------------
// Filmstrip thumbnail strip  (line 51006)
// ---------------------------------------------------------------------------

/**
 * Builds or refreshes the filmstrip thumbnail strip from the storyboard,
 * including chapter markers positioned over the thumbnail grid.
 *
 * @param {Object} seekBar  Seek bar component.  [was: Q]
 *
 * [was: VVK]
 */
export function buildFilmstripThumbnails(seekBar) { // was: VVK
  let storyboard = seekBar.api.sV(); // was: c
  if (storyboard) {
    let targetHeight = 90 * seekBar.scale; // was: W
    let levelIndex = selectResolutionLevel(storyboard, 160 * seekBar.scale); // was: m
    const level = storyboard.levels[levelIndex]; // was: c (reused)
    if (level) {
      seekBar.D = level.width;
      if (!seekBar.j.length) {
        const frames = []; // was: m (reused)
        let sheetCount = getSpritePageIndex(level, level.O()); // was: K
        const framesPerSheet = level.columns * level.rows; // was: T
        let remaining = level.frameCount; // was: r
        for (let sheet = 0; sheet <= sheetCount; sheet++) { // was: U
          let rows = remaining < framesPerSheet ? Math.ceil(remaining / level.columns) : level.rows; // was: I
          for (let row = 0; row < level.rows; row++) { // was: X
            const cols = remaining < level.columns ? remaining : level.columns; // was: A
            const frameDesc = { // was: e
              url: level.createByteRange(sheet),
              column: 0,
              columns: cols,
              row,
              rows,
              Ab: level.width * cols,
              lL: level.height * rows
            };
            frames.push(frameDesc);
            remaining -= cols;
            if (remaining <= 1) break;
          }
        }
        seekBar.j = frames;
        seekBar.frameCount = level.K();
        seekBar.interval = level.W / 1000 || seekBar.api.getDuration() / seekBar.frameCount; // was: 1E3
      }

      // Adjust thumbnail element count
      while (seekBar.thumbnails.length > seekBar.j.length) {
        seekBar.thumbnails.pop()?.dispose();
      }
      while (seekBar.thumbnails.length < seekBar.j.length) {
        const thumb = new A5w; // was: m (reused)
        seekBar.thumbnails.push(thumb);
        thumb.createVisualElement(seekBar.K);
        registerDisposable(seekBar, thumb);
      }

      // Apply sprite backgrounds
      for (let i = 0; i < seekBar.j.length; i++) { // was: r (reused)
        const createDatabaseDefinition = seekBar.thumbnails[i].element; // was: m (reused)
        const frame = seekBar.j[i]; // was: K (reused)
        const w = seekBar.D * seekBar.scale; // was: T (reused)
        const coerceNumber = frame.lL / frame.rows; // was: U (reused)
        const ratio = targetHeight / coerceNumber; // was: I (reused)
        createDatabaseDefinition.style.background = `url(${frame.url}) 0 ${-frame.row * frame.lL / frame.rows * ratio}px/${w * level.columns}px ${fh * frame.rows * ratio}px`;
        createDatabaseDefinition.style.width = `${w * frame.columns}px`;
        createDatabaseDefinition.style.height = `${targetHeight}px`;
      }

      updateFilmstripPosition(seekBar, seekBar.api.getCurrentTime());

      // Chapter markers over filmstrip
      const chapters = seekBar.api.getVideoData().SLOT_MESSAGE_MARKER; // was: W (reused)
      while (seekBar.O.length > chapters.length) {
        seekBar.O.pop()?.dispose();
      }
      while (seekBar.O.length < chapters.length) {
        const marker = new egR; // was: m (reused)
        seekBar.O.push(new egR);
        registerDisposable(seekBar, marker);
      }
      for (let i = 0; i < chapters.length; i++) { // was: m (reused)
        const ch = chapters[i]; // was: K (reused)
        seekBar.O[i].update({ chapterTitle: ch.title });
        const frameIdx = Math.round(ch.startTime / level.W); // was: K (reused)
        const sheetIdx = Math.floor(frameIdx / level.rows); // was: T (reused)
        setStyle(seekBar.O[i].element, "transform", `translateX(${frameIdx % level.rows * seekBar.D * seekBar.scale}px)`);
        if (sheetIdx < seekBar.thumbnails.length && seekBar.thumbnails[sheetIdx]) {
          seekBar.O[i].createVisualElement(seekBar.thumbnails[sheetIdx].element);
        }
      }
      seekBar.Ie = true; // was: !0
    }
  }
}

// ---------------------------------------------------------------------------
// Heat map rendering  (line 51078)
// ---------------------------------------------------------------------------

/**
 * Sets the heat map container height.
 *
 * @param {Object} heatMap  Heat map component.       [was: Q]
 * @param {number} height   Desired height in pixels.  [was: c]
 *
 * [was: B3w]
 */
export function setHeatMapHeight(heatMap, height) { // was: B3w
  if (height > 0) {
    heatMap.O = height;
    heatMap.J.style.height = `${heatMap.O}px`;
  }
}

/**
 * Renders the heat map SVG path from heat marker data points.
 *
 * @param {Object}  heatMap   Heat map component.                         [was: Q]
 * @param {Array}   markers   Array of heat marker objects.               [was: c]
 * @param {number}  minHeight Minimum height in dp.                       [was: W]
 * @param {number}  maxHeight Maximum height in dp.                       [was: m]
 * @param {boolean} [isFirst=false] Whether this is the first chapter.    [was: K]
 *
 * [was: xGn]
 */
export function renderHeatMapPath(heatMap, markers, minHeight, maxHeight, isFirst = false) { // was: xGn  // was: !1
  setHeatMapHeight(heatMap, maxHeight);
  const pathData = buildHeatmapPoints(markers, minHeight, heatMap.O, maxHeight, isFirst); // was: W (reused)
  const path = markers.length === 0 ? "" : buildSmoothSvgPath(pathData); // was: c (reused)
  if (heatMap.api.X("delhi_modern_web_player")) {
    heatMap.A.setAttribute("d", path);
  } else {
    heatMap.K.setAttribute("d", path);
  }
  heatMap.Xq = path !== "";
  toggleClass(heatMap.api.getRootNode(), "ytp-heat-map", heatMap.Xq);
  toggleClass(heatMap.api.getRootNode(), "ytp-heat-map-played_bar", heatMap.api.X("web_player_heat_map_played_bar") && path !== "");
  if (heatMap.api.X("delhi_modern_web_player")) {
    heatMap.j.style.display = "none";
    heatMap.W.style.display = "none";
  } else {
    heatMap.A.style.display = "none";
  }
}

/**
 * Renders an alternative heat map variant (Rh_ vs JzW interpolation).
 *
 * @param {Object}  heatMap   Heat map component.                    [was: Q]
 * @param {Array}   markers   Array of heat marker objects.          [was: c]
 * @param {number}  minHeight Minimum height in dp.                  [was: W]
 * @param {number}  maxHeight Maximum height in dp.                  [was: m]
 * @param {boolean} [isFirst=false] Whether this is the first chapter. [was: K]
 *
 * [was: qbW]
 */
export function renderAlternateHeatMapPath(heatMap, markers, minHeight, maxHeight, isFirst = false) { // was: qbW
  setHeatMapHeight(heatMap, maxHeight);
  const pathData = buildHeatmapPointsRaw(markers, minHeight, heatMap.O, maxHeight, isFirst);
  const path = markers.length === 0 ? "" : buildSmoothSvgPath(pathData);
  if (heatMap.api.X("delhi_modern_web_player")) {
    heatMap.A.setAttribute("d", path);
  } else {
    heatMap.K.setAttribute("d", path);
  }
  heatMap.Xq = path !== "";
  toggleClass(heatMap.api.getRootNode(), "ytp-heat-map", heatMap.Xq);
  if (heatMap.api.X("delhi_modern_web_player")) {
    heatMap.j.style.display = "none";
    heatMap.W.style.display = "none";
  } else {
    heatMap.A.style.display = "none";
  }
}

// ---------------------------------------------------------------------------
// Chapter bar segments  (line 51106)
// ---------------------------------------------------------------------------

/**
 * Sets the CSS width of a chapter bar segment.
 *
 * @param {Object} segment  Chapter bar segment.  [was: Q]
 * @param {string} width    CSS width value.       [was: c]
 *
 * [was: WC]
 */
export function setChapterWidth(segment, width) { // was: WC
  setStyle(segment.W, "width", width);
}

/**
 * Sets the right margin on a chapter bar segment for gap spacing.
 *
 * @param {Object} segment  Chapter bar segment.  [was: Q]
 * @param {number} margin   Margin in pixels.      [was: c]
 *
 * [was: mM]
 */
export function setChapterMarginRight(segment, margin) { // was: mM
  setStyle(segment.W, "margin-right", `${margin}px`);
}

/**
 * Ensures at least one chapter segment exists, resetting to a single
 * full-width segment with no title.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 *
 * [was: DGm]
 */
export function ensureSingleChapter(progressBar) { // was: DGm
  if (progressBar.W.length === 0) {
    const segment = new nBW;
    progressBar.W.push(segment);
    registerDisposable(progressBar, segment);
    segment.createVisualElement(progressBar.La, 0);
  }
  while (progressBar.W.length > 1) {
    progressBar.W.pop().dispose();
  }
  setChapterWidth(progressBar.W[0], "100%");
  progressBar.W[0].startTime = 0;
  progressBar.W[0].title = "";
}

/**
 * Returns whether the progress bar should be shown (not live, not
 * minimized, not inline, and not in PiP unless allowed).
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 * @returns {boolean}
 *
 * [was: Kv]
 */
export function shouldShowProgressBar(progressBar) { // was: Kv
  const allowPip = isWebExact(progressBar.api.G())
    && (progressBar.api.X("web_shorts_pip") || progressBar.api.X("web_watch_pip"));
  return !progressBar.api.getVideoData()?.isLivePlayback
    && !progressBar.api.isMinimized()
    && !progressBar.api.isInline()
    && (!progressBar.api.Zh() || !allowPip);
}

/**
 * Creates and appends a new heat-map tile to the progress bar.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 *
 * [was: Hfw]
 */
export function appendHeatMapTile(progressBar) { // was: Hfw
  const tile = new tV_(progressBar.api); // was: c
  progressBar.j.push(tile);
  registerDisposable(progressBar, tile);
  tile.createVisualElement(progressBar.isSamsungSmartTV);
}

/**
 * Removes and disposes all marker overlays from the progress bar.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 *
 * [was: TM]
 */
export function clearMarkerOverlays(progressBar) { // was: TM
  while (progressBar.L.length) {
    progressBar.L.pop().dispose();
  }
}

/**
 * Extracts chapter data from the watch-next response.
 *
 * @param {Object} api  Player API instance.  [was: Q]
 * @returns {Array|undefined}  Chapter array, or undefined.
 *
 * [was: ifW]
 */
export function getChaptersFromWatchNext(api) { // was: ifW
  return getProperty(
    getProperty(api.getWatchNextResponse()?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer, pD)?.playerBar,
    N3W
  )?.chapters;
}

// ---------------------------------------------------------------------------
// Chapter bar building  (line 51149)
// ---------------------------------------------------------------------------

/**
 * Populates chapter bar segments from a chapter renderer array,
 * creating segment DOM nodes and setting start times/titles.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 * @param {Array}  chapters     Chapter renderer array.   [was: c]
 *
 * [was: SbR]
 */
export function buildChapterSegments(progressBar, chapters) { // was: SbR
  let idx = 0; // was: W
  let hasInsertedInitial = false; // was: m  // was: !1
  for (const renderer of chapters) {
    if (getProperty(renderer, y57)) {
      const chapterData = getProperty(renderer, y57); // was: c (reused)
      const parsed = { startTime: NaN, title: null, onActiveCommand: undefined }; // was: K  // was: void 0
      const titleText = chapterData.title; // was: T
      parsed.title = titleText ? logQoeEvent(titleText) : "";
      const startMs = chapterData.timeRangeStartMillis; // was: T (reused)
      if (startMs != null) parsed.startTime = startMs;
      parsed.onActiveCommand = chapterData.onActiveCommand;

      // Insert an empty chapter at index 0 if the first chapter doesn't start at 0
      if (idx === 0 && parsed.startTime !== 0) {
        progressBar.W[idx].startTime = 0;
        progressBar.W[idx].title = "";
        progressBar.W[idx].onActiveCommand = parsed.onActiveCommand;
        idx++;
        hasInsertedInitial = true;
      }

      if (progressBar.W.length <= idx) {
        const segment = new nBW; // was: K (reused)
        progressBar.W.push(segment);
        registerDisposable(progressBar, segment);
        segment.createVisualElement(progressBar.La, progressBar.La.children.length);
      }
      progressBar.W[idx].startTime = parsed.startTime;
      progressBar.W[idx].title = parsed.title ? parsed.title : "";
      progressBar.W[idx].onActiveCommand = parsed.onActiveCommand;
      progressBar.W[idx].index = hasInsertedInitial ? idx - 1 : idx;
    }
    idx++;
  }

  // Remove excess segments
  while (idx < progressBar.W.length) {
    progressBar.W.pop().dispose();
  }
  layoutChapterSegments(progressBar);
  updateProgressBar(progressBar); // was: rd
}

/**
 * Creates cue ranges for all chapters and registers them with the player.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 *
 * [was: F6K]
 */
export function createChapterCueRanges(progressBar) { // was: F6K
  const segments = progressBar.W; // was: c
  const ranges = []; // was: W
  for (let i = 0; i < segments.length; i++) { // was: K
    if (!isNaN(segments[i].startTime)) {
      const startMs = segments[i].startTime; // was: m
      const endMs = i === segments.length - 1 ? Infinity : segments[i + 1].startTime;
      const range = new CueRange(startMs, endMs, {
        namespace: "chapterCueRange",
        priority: 9,
        id: `c_${startMs}`
      });
      ranges.push(range);
    }
  }
  progressBar.api.qI("chapterCueRange");
  progressBar.api.StateFlag(ranges);
}

// ---------------------------------------------------------------------------
// Decorated player bar data loading  (line 51205)
// ---------------------------------------------------------------------------

/**
 * Loads chapters, markers, and heat map data from a decorator key into
 * the progress bar. Creates chapter segments, cue ranges, marker overlays,
 * and heat map tiles as needed.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 * @param {string} decoratorKey Decorator key (e.g. "HEATSEEKER"). [was: c]
 *
 * [was: Ii]
 */
export function loadDecoratedPlayerBarData(progressBar, decoratorKey) { // was: Ii
  // Chapters
  let chapterData = progressBar.isInAdPlayback[decoratorKey]?.chapters;
  if (chapterData) {
    buildChapterSegments(progressBar, chapterData);
    progressBar.api.getVideoData().SLOT_MESSAGE_MARKER = progressBar.W;
    createChapterCueRanges(progressBar);
  }

  // Markers (excluding HEATSEEKER)
  const markerData = progressBar.isInAdPlayback[decoratorKey]?.markers;
  if (markerData && decoratorKey !== "HEATSEEKER") {
    clearMarkerOverlays(progressBar);
    for (const markerRenderer of markerData) {
      const marker = new TimedMarker; // was: W (reused)
      const markerInfo = getProperty(markerRenderer, g.EBW); // was: K
      if (markerInfo) {
        marker.title = markerInfo.title?.simpleText || "";
        marker.timeRangeStartMillis = markerInfo.timeRangeStartMillis ?? NaN;
        marker.onActiveCommand = markerInfo?.onActiveCommand ?? undefined;
        appendMarkerOverlay(progressBar, marker); // was: sqd
      }
    }
    positionMarkerOverlays(progressBar, progressBar.L); // was: UC

    // Marker cue ranges
    const markerRanges = []; // was: K (reused)
    for (let i = 0; i < progressBar.L.length; i++) { // was: T
      if (!isNaN(progressBar.L[i].timeRangeStartMillis) && progressBar.L[i].onActiveCommand) {
        const range = A6n(
          progressBar.L[i].timeRangeStartMillis,
          i === progressBar.L.length - 1 ? Infinity : progressBar.L[i + 1].timeRangeStartMillis
        );
        markerRanges.push(range);
        progressBar.tQ[range.id] = progressBar.L[i].onActiveCommand;
      }
    }
    progressBar.api.StateFlag(markerRanges);
  }

  // Heat map
  const heatmapRenderer = getProperty(progressBar.isInAdPlayback[decoratorKey]?.heatmap, dG7);
  if (heatmapRenderer) {
    const markers = heatmapRenderer.heatMarkers || [];
    const minHeight = heatmapRenderer.minHeightDp ?? 0;
    const maxHeightDp = heatmapRenderer.maxHeightDp ?? 60;
    const chapterCount = progressBar.W.length;
    let lastMarker = null; // was: r

    for (let i = 0; i < chapterCount; i++) {
      const startTime = progressBar.W[i].startTime; // was: X
      const endTime = i === chapterCount - 1 ? Infinity : progressBar.W[i + 1].startTime; // was: A
      if (i === progressBar.j.length) appendHeatMapTile(progressBar);
      const chapterMarkers = []; // was: e
      if (lastMarker) chapterMarkers.push(lastMarker);
      for (const m of markers) {
        const sendPostRequest = getProperty(m, MH3)?.timeRangeStartMillis ?? -1; // was: V
        if (sendPostRequest >= startTime && sendPostRequest <= endTime) chapterMarkers.push(m);
      }
      if (maxHeightDp > 0) {
        progressBar.isSamsungSmartTV.style.height = `${maxHeightDp}px`;
      }
      renderHeatMapPath(progressBar.j[i], chapterMarkers, minHeight, maxHeightDp, i === 0);
      if (chapterMarkers.length > 0) {
        lastMarker = chapterMarkers[chapterMarkers.length - 1];
      }
    }

    layoutChapterSegments(progressBar);

    // Heat map decorations (labels)
    const decorations = heatmapRenderer.heatMarkersDecorations || [];
    const parsed = []; // was: U (reused)
    for (const dec of decorations) {
      const decData = getProperty(dec, L6_);
      if (decData) {
        const label = decData.label;
        parsed.push({
          visibleTimeRangeStartMillis: decData.visibleTimeRangeStartMillis ?? -1,
          visibleTimeRangeEndMillis: decData.visibleTimeRangeEndMillis ?? -1,
          decorationTimeMillis: decData.decorationTimeMillis ?? NaN,
          label: label ? logQoeEvent(label) : ""
        });
      }
    }
    progressBar.heatMarkersDecorations = parsed;
  }
}

// ---------------------------------------------------------------------------
// Chapter layout / sizing  (line 51268)
// ---------------------------------------------------------------------------

/**
 * Computes and applies widths to all chapter bar segments, accounting
 * for gaps and collapsing too-small segments into their neighbors.
 * Also positions heat map tiles if present.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 *
 * [was: g.oi]
 */
export function layoutChapterSegments(progressBar) { // was: g.oi
  progressBar.jG = progressBar.W.length - 1;
  progressBar.Fw = 0;
  if (collapseSmallChapters(progressBar, true)) { // was: wfx
    collapseSmallChapters(progressBar, false);
  }

  let accum = 0;
  for (let i = 0; i < progressBar.W.length; i++) {
    if (progressBar.W[i].width === 0) {
      // Handle zero-width final segment
      if (i === progressBar.W.length - 1) {
        for (let j = progressBar.W.length - 1; j >= 0; j--) {
          if (progressBar.W[j].width > 0) {
            setChapterMarginRight(progressBar.W[j], 0);
            const w = Math.floor(progressBar.W[j].width);
            progressBar.W[j].width = w;
            setChapterWidth(progressBar.W[j], `${w}px`);
            break;
          }
        }
      }
      progressBar.W[i].width = 0;
      setChapterWidth(progressBar.W[i], "0");
    } else if (i === progressBar.W.length - 1) {
      const w = Math.floor(progressBar.W[i].width + accum);
      progressBar.W[i].width = w;
      setChapterWidth(progressBar.W[i], `${w}px`);
    } else {
      accum = progressBar.W[i].width + accum;
      const rounded = Math.round(accum);
      accum -= rounded;
      progressBar.W[i].width = rounded;
      setChapterWidth(progressBar.W[i], `${rounded}px`);
    }
  }

  // Position heat map tiles
  let left = 0;
  if (progressBar.j.length === progressBar.W.length) {
    for (let i = 0; i < progressBar.j.length; i++) {
      const w = progressBar.W[i].width;
      progressBar.j[i].element.style.width = `${w}px`;
      progressBar.j[i].element.style.left = `${left}px`;
      left += w + getChapterGap(progressBar);
    }
  }

  // Modern player border radius classes
  if (progressBar.api.X("delhi_modern_web_player")) {
    if (progressBar.W.length === 1) {
      progressBar.W[0].O.classList.add("ytp-progress-bar-start", "ytp-progress-bar-end");
    } else {
      progressBar.W[0].O.classList.remove("ytp-progress-bar-end");
      progressBar.W[0].O.classList.add("ytp-progress-bar-start");
      progressBar.W[progressBar.W.length - 1].O.classList.add("ytp-progress-bar-end");
    }
  }
}

// ---------------------------------------------------------------------------
// Progress bar update  (line 51306)
// ---------------------------------------------------------------------------

/**
 * Full progress bar redraw: computes seekable range, updates play/load
 * progress, heat map, hover progress, and scrubber position.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 *
 * [was: rd]
 */
export function updateProgressBar(progressBar) { // was: rd
  if (!progressBar.J) return;
  const state = progressBar.api.getProgressState(); // was: c
  const videoData = progressBar.api.getVideoData(); // was: W
  if (videoData && videoData.enableServerStitchedDai && videoData.ET && !isFinite(state.current)) return;

  let range;
  if (progressBar.api.getVideoData()?.Ie() && state.airingStart && state.airingEnd) {
    range = computeClampedRange(progressBar, state.airingStart, state.airingEnd);
  } else if (progressBar.api.getPresentingPlayerType() === 2) {
    const skipDuration = progressBar.api.getVideoData()?.getPlayerResponse()?.playerConfig?.webPlayerConfig?.skippableAdProgressBarDuration;
    range = skipDuration
      ? computeClampedRange(progressBar, state.seekableStart, skipDuration / 1000) // was: 1E3
      : computeClampedRange(progressBar, state.seekableStart, state.seekableEnd);
  } else {
    range = computeClampedRange(progressBar, state.seekableStart, state.seekableEnd);
  }

  const loadFraction = lL(range, state.loaded, 0); // was: m
  const playFraction = lL(range, state.current, 0); // was: c (reused)
  const rangeChanged = progressBar.A.O !== range.O || progressBar.A.W !== range.W; // was: K
  progressBar.A = range;
  paintProgress(progressBar, playFraction, loadFraction); // was: ec
  if (rangeChanged) refreshProgressBarLayout(progressBar); // was: bfw
  updateHoverProgress(progressBar); // was: jq3

  // Compute scrubber min-width
  let minWidth = 48;
  const config = progressBar.api.G();
  const compactThreshold = getExperimentValue(progressBar.api.G().experiments, "delhi_modern_web_player_responsive_compact_controls_threshold");
  const isCompact = progressBar.api.X("delhi_modern_web_player_compact_controls") || compactThreshold > 0 && progressBar.api.getPlayerSize().width <= compactThreshold;
  if (progressBar.api.X("delhi_modern_web_player")) {
    minWidth = progressBar.api.getPlayerSize().width <= 528
      ? (isCompact ? 56 : 64)
      : (progressBar.D ? (isCompact ? 72 : 96) : (isCompact ? 56 : 72));
  } else if (progressBar.D) {
    minWidth = 54;
  } else if (isEmbedWithAudio(config) && !config.O) {
    minWidth = 40;
  }
  progressBar.T2 = minWidth;
}

// ---------------------------------------------------------------------------
// Marker overlay positioning  (line 51329)
// ---------------------------------------------------------------------------

/**
 * Positions marker overlays along the progress bar based on their
 * time offsets.
 *
 * @param {Object} progressBar  Progress bar component.       [was: Q]
 * @param {Array}  markers      Array of marker overlay objects. [was: c]
 *
 * [was: UC]
 */
export function positionMarkerOverlays(progressBar, markers) { // was: UC
  for (const marker of markers) {
    const x = timeToProgressX(progressBar, marker.timeRangeStartMillis / (progressBar.A.W * 1000), getProgressBarMetrics(progressBar)); // was: c (reused)  // was: 1E3
    const scaleX = progressBar.api.X("delhi_modern_web_player") ? 0.667 : 0.6; // was: m
    setStyle(marker.element, "transform", `translateX(${x}px) scaleX(${scaleX})`);
  }
}

// ---------------------------------------------------------------------------
// Decorated progress color / playhead  (line 51337)
// ---------------------------------------------------------------------------

/**
 * Applies progress color and playhead image decorations from the
 * watch-next response.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 * @param {Object} api          Player API.               [was: c]
 *
 * [was: Of7]
 */
export function applyProgressDecorations(progressBar, api) { // was: Of7
  let decorator = getProperty(api.getWatchNextResponse()?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer, pD);
  if (decorator?.progressColor) {
    for (let i = 0; i < progressBar.W.length; i++) {
      progressBar.W[i].Ae("PLAY_PROGRESS").style.background = jpy(decorator.progressColor);
    }
  }
  const playhead = getProperty(decorator?.playhead, gB0); // was: c (reused)
  progressBar.MM = playhead?.playheadImage?.thumbnails && playhead?.playheadImage?.thumbnails[0].url;
  progressBar.isTvHtml5Exact = playhead?.playheadFastForwardImage?.thumbnails && playhead?.playheadFastForwardImage?.thumbnails[0].url;
  progressBar.applyQualityConstraint = playhead?.playheadRewindImage?.thumbnails && playhead?.playheadRewindImage?.thumbnails[0].url;
  toggleClass(progressBar.showSampleSubtitles, "ytp-decorated-scrubber-container", !!progressBar.MM && !progressBar.api.bX().XA);
  if (playhead?.loggingDirectives?.trackingParams) {
    progressBar.api.setTrackingParams(progressBar.Ie, playhead?.loggingDirectives?.trackingParams);
    progressBar.api.createServerVe(progressBar.Ie, progressBar);
  }
  if (progressBar.MM && !progressBar.api.bX().XA) {
    progressBar.Ie.src = progressBar.MM;
  }
  if (progressBar.isTvHtml5Exact) fetch(progressBar.isTvHtml5Exact, { cache: "force-cache" });
  if (progressBar.applyQualityConstraint) fetch(progressBar.applyQualityConstraint, { cache: "force-cache" });
}

/**
 * Appends a marker overlay to the progress bar's marker container.
 *
 * @param {Object} progressBar  Progress bar component.   [was: Q]
 * @param {Object} marker       Marker overlay instance.   [was: c]
 *
 * [was: sqd]
 */
export function appendMarkerOverlay(progressBar, marker) { // was: sqd
  progressBar.L.push(marker);
  registerDisposable(progressBar, marker);
  marker.createVisualElement(progressBar.UR, progressBar.UR.children.length);
}

// ---------------------------------------------------------------------------
// Time-to-pixel conversion  (line 51364)
// ---------------------------------------------------------------------------

/**
 * Converts a normalized time fraction [0..1] to a pixel X offset within
 * the progress bar, accounting for chapter gaps.
 *
 * @param {Object} progressBar  Progress bar component.              [was: Q]
 * @param {number} fraction     Normalized time position (0..1).     [was: c]
 * @param {Object} metrics      Progress bar metrics (from BC).      [was: W]
 * @returns {number}            Pixel X offset.
 *
 * [was: VV]
 */
export function timeToProgressX(progressBar, fraction, metrics) { // was: VV
  let chapterIndex = -1; // was: m
  for (const seg of progressBar.W) {
    if (fraction * progressBar.A.W * 1000 > seg.startTime && seg.width > 0) chapterIndex++; // was: 1E3
  }
  chapterIndex = chapterIndex < 0 ? 0 : chapterIndex;
  const usableWidth = metrics.W - getChapterGap(progressBar) * progressBar.jG; // was: K
  return fraction * usableWidth + getChapterGap(progressBar) * chapterIndex + metrics.j;
}

/**
 * Computes the progress bar metrics (width and left offset) from the
 * current scrubber position.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 * @returns {Object}            Metrics object.
 *
 * [was: BC]
 */
export function getProgressBarMetrics(progressBar) { // was: BC
  let x = progressBar.instreamAdPlayerOverlayRenderer.x;
  x = clamp(x, 0, progressBar.J);
  progressBar.OR.update(x, progressBar.J);
  return progressBar.OR;
}

/**
 * Attempts to collapse chapters that are too small to display,
 * redistributing their width to neighbors.
 *
 * @param {Object}  progressBar   Progress bar component. [was: Q]
 * @param {boolean} isFirstPass   Whether this is the first pass.  [was: c]
 * @returns {boolean}             Whether any chapters were collapsed.
 *
 * [was: wfx]
 */
export function collapseSmallChapters(progressBar, isFirstPass) { // was: wfx
  let idx = 0; // was: W
  let collapsed = false; // was: m  // was: !1
  const count = progressBar.W.length; // was: K
  let totalDuration = progressBar.A.W * 1000; // was: T  // was: 1E3
  if (totalDuration === 0) {
    totalDuration = progressBar.api.getProgressState().seekableEnd * 1000;
  }

  if (totalDuration > 0 && progressBar.J > 0) {
    const usableWidth = progressBar.J - getChapterGap(progressBar) * progressBar.jG; // was: I
    const minWidth = progressBar.Fw === 0 ? 3 : usableWidth * progressBar.Fw; // was: X

    for (const seg of progressBar.W) seg.width = 0;

    while (idx < count) {
      let duration = totalDuration - progressBar.W[idx].startTime; // was: A
      if (idx < count - 1) {
        duration = progressBar.W[idx + 1].startTime - progressBar.W[idx].startTime;
        setChapterMarginRight(progressBar.W[idx], getChapterGap(progressBar));
      }
      toggleClass(progressBar.W[idx].W, "ytp-exp-chapter-hover-container", progressBar.W.length > 1);

      const computedWidth = (totalDuration === 0 ? 0 : duration / totalDuration * usableWidth) + progressBar.W[idx].width;
      if (computedWidth > minWidth) {
        progressBar.W[idx].width = computedWidth;
      } else {
        progressBar.W[idx].width = 0;
        // Redistribute
        const prev = progressBar.W[idx - 1];
        if (prev !== undefined && prev.width > 0) {
          prev.width += computedWidth;
        } else if (idx < progressBar.W.length - 1) {
          progressBar.W[idx + 1].width += computedWidth;
        }
        setChapterMarginRight(progressBar.W[idx], 0);
        if (isFirstPass) {
          progressBar.jG--;
          if (duration / totalDuration > progressBar.Fw) {
            progressBar.Fw = duration / totalDuration;
          }
          collapsed = true;
        }
      }
      idx++;
    }
  }
  return collapsed;
}

/**
 * Returns the gap width in pixels between chapter segments.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 * @returns {number}
 *
 * [was: Xk]
 */
export function getChapterGap(progressBar) { // was: Xk
  return progressBar.api.X("delhi_modern_web_player") ? 4 : progressBar.D ? 3 : 2;
}

/**
 * Computes the seekable range, clamping to clip bounds if active.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 * @param {number} start        Seekable start in seconds. [was: c]
 * @param {number} end          Seekable end in seconds.   [was: W]
 * @returns {Object}            Range object (qc instance).
 *
 * [was: Ag]
 */
export function computeClampedRange(progressBar, start, end) { // was: Ag
  if (isClipActive(progressBar)) {
    return new qc(
      Math.max(start, progressBar.captureBandwidthSnapshot.startTimeMs / 1000), // was: 1E3
      Math.min(end, progressBar.captureBandwidthSnapshot.endTimeMs / 1000)
    );
  }
  return new qc(start, end);
}

// ---------------------------------------------------------------------------
// Progress painting  (line 51424)
// ---------------------------------------------------------------------------

/**
 * Paints the play-progress, load-progress, and scrubber position.
 *
 * @param {Object} progressBar    Progress bar component.           [was: Q]
 * @param {number} playFraction   Play position as fraction (0..1). [was: c]
 * @param {number} loadFraction   Loaded position as fraction.      [was: W]
 *
 * [was: ec]
 */
export function paintProgress(progressBar, playFraction, loadFraction) { // was: ec
  progressBar.S = playFraction;
  progressBar.toggleFineScrub = loadFraction;
  const metrics = getProgressBarMetrics(progressBar); // was: m
  let duration = progressBar.A.W; // was: K
  let playTime = uH_(progressBar.A, progressBar.S); // was: T
  let ariaLabel = replaceTemplateVars("$PLAY_PROGRESS of $DURATION", { // was: r
    PLAY_PROGRESS: formatDuration(playTime, true), // was: !0
    DURATION: formatDuration(duration, true)
  });
  let chapterIdx = LI(progressBar.W, playTime * 1000); // was: U  // was: 1E3
  const chapterTitle = progressBar.W[chapterIdx].title;
  progressBar.update({
    ariamin: Math.floor(progressBar.A.O),
    ariamax: Math.floor(duration),
    arianow: Math.floor(playTime),
    arianowtext: chapterTitle ? chapterTitle + " " + ariaLabel : ariaLabel
  });

  let clipStart = progressBar.clipStart;
  let clipEnd = progressBar.clipEnd;
  if (progressBar.captureBandwidthSnapshot && progressBar.api.getPresentingPlayerType() !== 2) {
    clipStart = progressBar.captureBandwidthSnapshot.startTimeMs / 1000;
    clipEnd = progressBar.captureBandwidthSnapshot.endTimeMs / 1000;
  }
  const startFrac = lL(progressBar.A, clipStart, 0);
  const endFrac = lL(progressBar.A, clipEnd, 1);
  const videoData = progressBar.api.getVideoData();
  const clampedPlay = clamp(playFraction, startFrac, endFrac);
  const clampedLoad = videoData?.MQ() ? 1 : clamp(loadFraction, startFrac, endFrac);
  const scrubberX = timeToProgressX(progressBar, playFraction, metrics);
  setStyle(progressBar.showSampleSubtitles, "transform", `translateX(${scrubberX}px)`);
  if (progressBar.api.X("delhi_modern_web_player") && progressBar.api.X("delhi_modern_web_player_cutout")) {
    updateClipPath(progressBar, scrubberX);
  }
  fillChapterProgress(progressBar, metrics, startFrac, clampedPlay, "PLAY_PROGRESS");
  if (videoData?.Ie()) {
    const seekEnd = progressBar.api.getProgressState().seekableEnd;
    if (seekEnd) fillChapterProgress(progressBar, metrics, clampedPlay, lL(progressBar.A, seekEnd), "LIVE_BUFFER");
  } else {
    fillChapterProgress(progressBar, metrics, startFrac, clampedLoad, "LOAD_PROGRESS");
  }
  if (progressBar.api.X("web_player_heat_map_played_bar") && progressBar.j[0]) {
    progressBar.j[0].Y(clampedPlay);
  }
}

/**
 * Refreshes the progress bar layout when the range changes.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 *
 * [was: bfw]
 */
export function refreshProgressBarLayout(progressBar) { // was: bfw
  progressBar.resetBufferPosition.style.removeProperty("height");
  for (const key of Object.keys(progressBar.XI)) {
    renderTimedMarker(progressBar, key);
  }
  updateClipRange(progressBar);
  paintProgress(progressBar, progressBar.S, progressBar.toggleFineScrub);
}

/**
 * Updates the hover-progress indicator across chapter segments.
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 *
 * [was: jq3]
 */
export function updateHoverProgress(progressBar) { // was: jq3
  if (progressBar.api.getVideoData()?.Ie()) return;
  const metrics = getProgressBarMetrics(progressBar);
  fillChapterProgress(progressBar, metrics, progressBar.S, Math.max(metrics.O, progressBar.S), "HOVER_PROGRESS");
  const startIdx = findChapterAtPixel(progressBar, metrics.W * progressBar.S, true); // was: W  // was: !0
  const endIdx = findChapterAtPixel(progressBar, metrics.A, true);
  for (let i = startIdx; i <= endIdx; i++) {
    toggleClass(progressBar.W[i].A, "ytp-hover-progress-light", metrics.O > progressBar.S);
  }
  toggleClass(progressBar.resetBufferPosition, "ytp-scrubber-button-hover", startIdx === endIdx && progressBar.W.length > 1);
  if (progressBar.api.X("web_player_heat_map_played_bar") && progressBar.j[0]) {
    progressBar.j[0].L(metrics.O);
  }
}

/**
 * Returns whether a clip range is active (non-ad presenter type with a postId).
 *
 * @param {Object} progressBar  Progress bar component.  [was: Q]
 * @returns {boolean}
 *
 * [was: xg]
 */
export function isClipActive(progressBar) { // was: xg
  return !!progressBar.captureBandwidthSnapshot?.postId && progressBar.api.getPresentingPlayerType() !== 2;
}

// ---------------------------------------------------------------------------
// Seek logging  (line 51484)
// ---------------------------------------------------------------------------

/**
 * Logs a seek event to the visual-element logging system.
 *
 * @param {Object} component   Component with progressBar.visualElement.  [was: Q]
 * @param {number} startFrac   Start fraction.     [was: c]
 * @param {number} endFrac     End fraction.       [was: W]
 * @param {number} seekSource  Seek source enum.   [was: m]
 * @param {*}      veAction    VE action type.     [was: K]
 *
 * [was: Nc]
 */
export function logSeekEvent(component, startFrac, endFrac, seekSource, veAction) { // was: Nc
  startFrac = timeToMillisString(component, startFrac);
  endFrac = timeToMillisString(component, endFrac);
  const ve = component.progressBar.visualElement;
  const data = {
    seekData: {
      startMediaTimeMs: startFrac,
      endMediaTimeMs: endFrac,
      seekSource
    }
  };
  const csn = getClientScreenNonce();
  if (csn) logGesture(csn, ve, veAction, data);
}

// ---------------------------------------------------------------------------
// Seek bar enable/disable  (line 51498)
// ---------------------------------------------------------------------------

/**
 * Enables or disables the seek bar, removing/adding the aria-disabled
 * attribute and wiring/unwiring event listeners.
 *
 * @param {Object} seekBar  Seek bar component.       [was: Q]
 * @param {boolean} enabled Whether to enable.         [was: c]
 *
 * [was: yV]
 */
export function setSeekBarEnabled(seekBar, enabled) { // was: yV
  if (enabled) {
    if (!seekBar.Y) {
      seekBar.element.removeAttribute("aria-disabled");
      // (function continues in source beyond line 51499)
    }
  }
}

/**
 * Register tooltip hover behavior on element. [was: g.Zr]
 */
export function registerTooltip(tooltipManager, element) {
  // Registers mouseover/focus listeners, sets aria-label
  return () => {}; // cleanup function
}
