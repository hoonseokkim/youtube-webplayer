/**
 * Ad Pinging — endpoint implementations for ad ping URLs, engagement panel
 * visibility control, click tracking parameter handling, and active
 * viewability measurement integration.
 *
 * Source: base.js lines 120100–121000
 * [was: tzm, xmx, qDm, n$_, Hsi, SDm, Xe, A2, eR, Njm, Vi, BM, xP,
 *  $S, v$K, qo, is9, yAS, SZv, n_, DU, t2, HH7, F1v, HM, No, ZsZ]
 */

import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { adPingingEndpoint } from '../core/misc-helpers.js';  // was: g.Vu7
import { publishEvent } from './ad-click-tracking.js';  // was: g.xt
import { cueRangeEndId, cueRangeStartId, executeCommand } from './ad-scheduling.js';  // was: g.FC, g.Sr, g.xA
import { onCueRangeEnter, onCueRangeExit } from './dai-cue-range.js';  // was: g.onCueRangeEnter, g.onCueRangeExit
import { sendPingFromLayout } from '../player/media-state.js'; // was: pZO
import { createAdCommandExecutor } from '../player/media-state.js'; // was: yLR
import { computeSurveyDuration } from './companion-layout.js'; // was: cc
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { reportAdsControlFlowError } from '../data/interaction-logging.js'; // was: v1
import { hasKeyStatusApi } from '../media/track-manager.js'; // was: yO
import { resetAdTransitionState } from '../player/media-state.js'; // was: dmK
import { logAdTransitionLatency } from '../player/media-state.js'; // was: Zt3
import { StateFlag } from '../player/component-events.js'; // was: mV
import { reloadPage } from '../media/format-retry.js'; // was: bc
import { getQualityLabel } from '../media/codec-helpers.js'; // was: sU
import { getLidarInstance } from '../player/media-state.js'; // was: Pi
import { YouTubeActiveViewManager } from '../data/module-init.js'; // was: y7
import { mapVastEventName } from '../player/media-state.js'; // was: $mR
import { removeRootClass } from '../player/playback-bridge.js'; // was: YS
import { sendTrackingPing } from '../player/media-state.js'; // was: JLO
import { appendAttributionReportingSignal } from '../data/gel-core.js'; // was: DqW
import { isTrackingUrl } from '../core/bitstream-helpers.js'; // was: HN3
import { isGoogleDomain } from '../data/idb-transactions.js'; // was: rCm
import { isYouTubeDomain } from '../data/idb-transactions.js'; // was: Pz
import { actionCompanionAdRenderer } from '../core/misc-helpers.js'; // was: zm
import { Disposable } from '../core/disposable.js';
import { filter } from '../core/array-utils.js';
import { CueRange } from '../ui/cue-range.js';
import { ObservableTarget } from '../core/event-target.js';
import { parseUri } from '../core/url-utils.js';

/**
 * Constants mapping method keys used across ad pinging handlers.
 * [was: tzm]
 */
export const adPingingMethodKeys = {
  replaceUrlMacros: "replaceUrlMacros",     // was: lFC
  onAboutThisAdPopupClosed: "onAboutThisAdPopupClosed", // was: H_
  executeCommand: "executeCommand",         // was: RD
};

/**
 * Handles the "adPingingEndpoint" action — fires a single ping URL
 * with macro replacement through the ping sender.
 * [was: xmx]
 */
export class AdPingingEndpoint {
  constructor(pingSenderProvider) { // was: Q
    this.pingSenderProvider = pingSenderProvider; // was: hJ
  }

  /** @returns {string} The endpoint name */
  getEndpointName() { // was: Bn
    return "adPingingEndpoint";
  }

  /**
   * Executes the ping.
   * @param {string} url - The base URL to ping [was: Q]
   * @param {*} macros - Macro context [was: c]
   * @param {*} extra - Additional parameters [was: W]
   */
  execute(url, macros, extra) { // was: R4
    sendPingFromLayout(this.pingSenderProvider.get(), url, macros, extra);
  }
}

/**
 * Handles the "changeEngagementPanelVisibilityAction" by dispatching
 * visibility change events to the player.
 * [was: qDm]
 */
export class EngagementPanelVisibilityAction {
  constructor(player) { // was: Q
    this.player = player; // was: U
  }

  getEndpointName() { // was: Bn
    return "changeEngagementPanelVisibilityAction";
  }

  execute(actionPayload) { // was: R4, Q
    publishEvent(this.player, "changeEngagementPanelVisibility", {
      changeEngagementPanelVisibilityAction: actionPayload,
    });
  }
}

/**
 * Handles the "loggingUrls" action — iterates multiple URLs and pings each,
 * optionally with attribution source mode.
 * [was: n$_]
 */
export class LoggingUrlsPinger {
  constructor(pingSenderProvider) { // was: Q
    this.pingSenderProvider = pingSenderProvider; // was: hJ
  }

  getEndpointName() { // was: Bn
    return "loggingUrls";
  }

  /**
   * @param {Array<{baseUrl: string, attributionSrcMode?: string}>} urls [was: Q]
   * @param {*} macros [was: c]
   * @param {*} extra [was: W]
   */
  execute(urls, macros, extra) { // was: R4
    for (const entry of urls) {
      sendPingFromLayout(this.pingSenderProvider.get(), entry.baseUrl, macros, extra, entry.attributionSrcMode);
    }
  }
}

/**
 * Base class for lifecycle-aware ad pinging components.
 * [was: Hsi]
 */
export class AdPingingLifecycle extends Disposable {
  constructor(config) { // was: Q
    super();
    this.config = config; // was: W
    this.disposer = createAdCommandExecutor(this); // was: O
  }
}

/**
 * Adapter that forwards ping-based events to the ad data store,
 * attaching the content CPN for identification.
 * [was: SDm]
 */
export class PingEventForwarder {
  constructor(dataStore, playerContext) { // was: Q, c
    this.dataStore = dataStore;  // was: gs
    this.playerContext = playerContext; // was: QC
  }

  /**
   * @param {string} eventName [was: Q]
   * @param {object} params [was: c]
   */
  forward(eventName, params) { // was: PB
    params = {
      ...params,
      computeSurveyDuration: this.dataStore.hC(), // content CPN
    };
    this.dataStore.U.RetryTimer(eventName, params);
  }
}

/**
 * Default content playback lifecycle API — manages content video loaded/abandoned
 * signals and propagates them to sub-systems (playback, cue-point, live-stream, etc.).
 * [was: Xe]
 */
export class DefaultContentPlaybackLifecycleApi extends Disposable {
  /**
   * @param {object} player [was: Q]
   * @param {object} opportunityHandler [was: c]
   * @param {object} playerAdapter [was: W]
   * @param {object} dataStore [was: m]
   * @param {object} [cuePointApi] [was: K]
   */
  constructor(player, opportunityHandler, playerAdapter, dataStore, cuePointApi) {
    super();
    this.opportunityHandler = opportunityHandler; // was: O
    this.playerAdapter = playerAdapter;           // was: Ca
    this.dataStore = dataStore;                   // was: cA
    this.cuePointApi = cuePointApi;               // was: ZE
    this.listeners = [];
    const handler = new aB(this); // was: T
    registerDisposable(this, handler);
    handler.B(player, "internalAbandon", this.onInternalAbandon); // was: A
    this.addOnDisposeCallback(() => {
      handler.O();
    });
  }

  addListener(listener) { // was: Q
    this.listeners.push(listener);
  }

  removeListener(listener) { // was: Q
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /**
   * Called when a content video is loaded.
   * @param {string} cpn - Client playback nonce [was: Q]
   * @param {*} videoData [was: c]
   * @param {boolean} forceReload [was: W]
   * @param {*} param4 [was: m]
   * @param {*} param5 [was: K]
   * @param {*} param6 [was: T]
   * @param {*} param7 [was: r]
   * @param {*} param8 [was: U]
   */
  onContentVideoLoaded(cpn, videoData, forceReload, param4, param5, param6, param7, param8) { // was: V1
    if (cpn === "") {
      reportAdsControlFlowError("Received empty content video CPN in DefaultContentPlaybackLifecycleApi");
    } else if (cpn !== this.W || forceReload) {
      this.W = cpn;
      this.playerAdapter.get().V1(cpn, videoData, forceReload, param4, param5, param6, param7, param8);
      this.dataStore.get().V1(cpn, videoData, forceReload, param4, param5, param6, param7, param8);
      this.cuePointApi?.get().V1(cpn, videoData, forceReload, param4, param5, param6, param7, param8);
      this.opportunityHandler.V1(cpn, videoData, forceReload, param4, param5, param6, param7, param8);
      for (const listener of this.listeners) {
        listener.V1(cpn, videoData, forceReload, param4, param5, param6, param7, param8);
      }
    } else {
      reportAdsControlFlowError("Duplicate content video loaded signal");
    }
  }

  /** @private */
  onInternalAbandon() { // was: A
    if (this.W) {
      this.onContentVideoAbandoned(this.W);
    }
  }

  /**
   * @param {string} cpn [was: Q]
   */
  onContentVideoAbandoned(cpn) { // was: yO
    this.W = undefined;
    for (const listener of this.listeners) {
      listener.hasKeyStatusApi(cpn);
    }
  }
}

/**
 * Tracks ad-to-content / content-to-ad transition state for telemetry
 * (latency logging, video stream type classification, etc.).
 * [was: A2]
 */
export class AdTransitionTracker {
  constructor(player) { // was: Q
    this.player = player; // was: U
    this.adVideoId = null;
    this.timelinePlaybackId = null; // was: W
    this.videoId = null;
    this.adCpn = null;
    this.contentCpn = null;
    this.isContentPlaying = true; // was: K, originally !0
    this.hasStartedTracking = false; // was: A, originally !1
    this.hasCompleted = false; // was: O, originally !1
    this.adFormat = null;
    this.adPlacementKind = "AD_PLACEMENT_KIND_UNKNOWN"; // was: j
    this.actionType = "unknown_type";
    this.videoStreamType = "VIDEO_STREAM_TYPE_VOD";
  }

  /**
   * Records a transition event.
   * @param {string} placementKind [was: Q]
   * @param {boolean} isAd [was: c]
   * @param {number} index [was: W]
   * @param {number} breakIndex [was: m]
   * @param {boolean} isLive [was: K]
   */
  recordTransition(placementKind, isAd, index, breakIndex, isLive) { // was: yv
    resetAdTransitionState(this);
    this.isContentPlaying = !isAd && index === 0;
    const contentVideoData = this.player.getVideoData({ playerType: 1 }); // was: T
    const adVideoData = this.player.getVideoData({ playerType: 2 }); // was: r
    if (contentVideoData) {
      this.contentCpn = contentVideoData.clientPlaybackNonce;
      this.videoId = contentVideoData.videoId;
      this.timelinePlaybackId = contentVideoData.UG;
    }
    if (adVideoData) {
      this.adCpn = adVideoData.clientPlaybackNonce;
      this.adVideoId = adVideoData.videoId;
      this.adFormat = adVideoData.adFormat;
    }
    this.adPlacementKind = placementKind;
    if (breakIndex <= 0) {
      resetAdTransitionState(this);
      this.isContentPlaying = !isAd && index === 0;
    } else {
      this.actionType = this.isContentPlaying
        ? isAd
          ? "unknown_type"
          : "video_to_ad"
        : isAd
          ? "ad_to_video"
          : "ad_to_ad";
      this.videoStreamType = isLive
        ? "VIDEO_STREAM_TYPE_LIVE"
        : "VIDEO_STREAM_TYPE_VOD";
      if (this.actionType !== "unknown_type") {
        this.hasStartedTracking = true;
        if (np("_start", this.actionType)) {
          logAdTransitionLatency(this);
        }
      }
    }
  }

  reset() {
    return new AdTransitionTracker(this.player);
  }
}

/**
 * Manages ad cue ranges on the player timeline, listening for enter/exit events
 * and dispatching them to registered listeners.
 * [was: eR]
 */
export class AdCueRangeManager extends Disposable {
  constructor(player) { // was: Q
    super();
    this.player = player; // was: U
    this.cueRanges = new Map(); // was: W
    this.eventHandler = new aB(this); // was: O
    registerDisposable(this, this.eventHandler);
    this.eventHandler.B(this.player, cueRangeStartId("ad"), this.onCueRangeEnter, this);
    this.eventHandler.B(this.player, cueRangeEndId("ad"), this.onCueRangeExit, this);
  }

  /**
   * @param {string} id [was: Q]
   * @param {number} start [was: c]
   * @param {number} end [was: W]
   * @param {boolean} visible [was: m]
   * @param {object} listener [was: K]
   * @param {number} [priority=3] [was: T]
   * @param {number} [playerType=1] [was: r]
   * @param {string} [clipId] [was: U]
   * @param {number} [markerPositionMs] [was: I]
   */
  addCueRange(id, start, end, visible, listener, priority = 3, playerType = 1, clipId, markerPositionMs) {
    if (this.cueRanges.has(id)) {
      reportAdsControlFlowError("Tried to register duplicate cue range", undefined, undefined, {
        CueRangeID: id,
      });
    } else {
      const cueRange = new AdCueRange(id, start, end, visible, priority, clipId, markerPositionMs); // was: Njm
      this.cueRanges.set(cueRange.id, {
        Td: cueRange,
        listener: listener,
        N7: playerType,
      });
      this.player.StateFlag([cueRange], playerType);
    }
  }

  removeCueRange(id) { // was: Q
    const entry = this.cueRanges.get(id); // was: c
    if (entry) {
      this.player.reloadPage([entry.Td], entry.N7);
      this.cueRanges.delete(entry.Td.id);
    } else {
      reportAdsControlFlowError("Requested to remove unknown cue range", undefined, undefined, {
        CueRangeID: id,
      });
    }
  }

  onCueRangeEnter(cueRange) { // was: Q
    if (this.cueRanges.has(cueRange.id)) {
      this.cueRanges.get(cueRange.id).listener.onCueRangeEnter(cueRange.id);
    }
  }

  onCueRangeExit(cueRange) { // was: Q
    if (this.cueRanges.has(cueRange.id)) {
      this.cueRanges.get(cueRange.id).listener.onCueRangeExit(cueRange.id);
    }
  }
}

/**
 * Represents a single ad cue range on the player timeline.
 * [was: Njm]
 */
class AdCueRange extends CueRange {
  constructor(id, start, end, visible, priority, associatedClipId, markerPositionMs) {
    super(start, end, {
      id,
      namespace: "ad",
      priority,
      visible,
      associatedClipId,
      markerPositionMs,
    });
  }
}

/**
 * Wrapper for adding player response associations.
 * [was: Vi]
 */
export class PlayerResponseAssociator {
  constructor(player) { // was: Q
    this.player = player; // was: U
  }

  addPlayerResponseForAssociation(response) { // was: Q
    this.player.addPlayerResponseForAssociation(response);
  }
}

/**
 * Wrapper for n1 (network interface) calls on the player.
 * [was: BM]
 */
export class PlayerNetworkInterface {
  constructor(player) { // was: Q
    this.player = player; // was: U
  }

  n1(payload) { // was: Q
    this.player.n1(payload);
  }
}

/**
 * Wrapper that holds a reference to the player for ad context lookups.
 * [was: xP]
 */
export class PlayerContextWrapper {
  constructor(player) { // was: Q
    this.player = player; // was: U
  }
}

/**
 * Singleton holder for the Bulleit video metadata store. Exposes global
 * hooks for ytads.bulleit.getVideoMetadata and triggerExternalActivityEvent.
 * [was: $S (singleton ref), v$K (class)]
 */
let bulleitMetadataStoreInstance = null; // was: $S

export class BulleitVideoMetadataStore extends ObservableTarget {
  constructor() {
    super();
    this.metadata = {}; // was: W
    this.addOnDisposeCallback(() => {
      for (const key of Object.keys(this.metadata)) {
        delete this.metadata[key];
      }
    });
  }

  /**
   * Returns video metadata for a given query ID.
   * @param {string} queryId [was: Q]
   * @returns {object}
   */
  getVideoMetadata(queryId) { // was: sU
    return this.metadata.hasOwnProperty(queryId) ? this.metadata[queryId].getQualityLabel() : {};
  }
}

/**
 * Active viewability measurement manager — subscribes to Bulleit viewability
 * events and forwards them to registered ad query listeners.
 * [was: qo]
 */
export class ActiveViewabilityManager {
  /**
   * @param {object} playerAdapter [was: Q / Ca]
   * @param {object} player [was: c / U]
   * @param {object} playerContext [was: W / QC]
   */
  constructor(playerAdapter, player, playerContext) {
    this.playerAdapter = playerAdapter; // was: Ca
    this.player = player;               // was: U
    this.playerContext = playerContext;   // was: QC
    this.registeredQueries = new Set();  // was: O
    this.queryListeners = new Map();     // was: W (inner)

    getLidarInstance().subscribe("adactiveviewmeasurable", this.onMeasurable, this);
    getLidarInstance().subscribe("adfullyviewableaudiblehalfdurationimpression", this.onFullyViewableAudible, this);
    getLidarInstance().subscribe("adviewableimpression", this.onViewableImpression, this);
    getLidarInstance().subscribe("adaudioaudible", this.onAudioAudible, this);
    getLidarInstance().subscribe("adaudiomeasurable", this.onAudioMeasurable, this);
  }

  /**
   * Resolves viewability signals for a given query.
   * @param {string} queryId [was: Q]
   * @param {string} eventType [was: c]
   * @returns {object}
   */
  resolveSignals(queryId, eventType) { // was: m9
    if (!this.queryListeners.has(queryId)) return {};
    if (eventType === "seek") {
      const entry = gf(YouTubeActiveViewManager).Y(queryId, {}); // was: Q (reused)
      entry && C4(entry);
      return {};
    }
    const mappedEvent = mapVastEventName(eventType); // was: c (reused)
    if (mappedEvent === null) return {};
    let adElement = this.player.removeRootClass(); // was: W
    if (!adElement) return {};
    const presentingPlayerType = this.player.getPresentingPlayerType(true); // was: m
    if (!this.player.getVideoData({ playerType: presentingPlayerType })?.isAd()) {
      return {};
    }
    adElement = {
      opt_adElement: adElement,
      opt_fullscreen: this.playerAdapter.get().isFullscreen(),
    };
    return Sv(mappedEvent, queryId, adElement);
  }

  /**
   * Registers a viewability measurement session.
   * @param {string} queryId [was: Q]
   * @param {*} param2 [was: c]
   * @param {*} param3 [was: W]
   * @param {number} width [was: m]
   * @param {number} height [was: K]
   */
  registerSession(queryId, param2, param3, width, height) { // was: J
    if (this.queryListeners.has(queryId) && (width <= 0 || height <= 0)) return;
    gf(YouTubeActiveViewManager).J(queryId, param2, param3, width, height);
  }

  /** @private */ onMeasurable({ queryId }) { this.queryListeners.get(queryId)?.Vm(); } // was: Vm
  /** @private */ onFullyViewableAudible({ queryId }) { this.queryListeners.get(queryId)?.oE(); } // was: oE
  /** @private */ onViewableImpression({ queryId }) { this.queryListeners.get(queryId)?.nL(); } // was: nL
  /** @private */ onAudioAudible({ queryId }) { this.queryListeners.get(queryId)?.vx(); } // was: vx
  /** @private */ onAudioMeasurable({ queryId }) { this.queryListeners.get(queryId)?.N8(); } // was: N8
}

/**
 * Base class for ad ping senders with error suppression.
 * [was: is9]
 */
export class BasePingSender {
  send(url, macros, extra, forceAttribution = false) { // was: Q, c, W, m=!1
    try {
      sendTrackingPing(this, url, macros, extra, forceAttribution);
    } catch (_ignored) { // was: K
      // Silently swallow errors for ping reliability
    }
  }
}

/**
 * Authenticated ad ping sender that provides credential closures for
 * page ID, auth token, datasync ID, and experiment flags.
 * [was: yAS]
 */
export class AuthenticatedPingSender extends BasePingSender {
  constructor(authInfoFn, pageIdFn, authTokenFn, datasyncIdFn, experimentsFn) { // was: Q–K
    super();
    this.authInfoFn = authInfoFn;       // was: j
    this.pageIdFn = pageIdFn;           // was: K (param c)
    this.authTokenFn = authTokenFn;     // was: W
    this.datasyncIdFn = datasyncIdFn;   // was: O (param m)
    this.experimentsFn = experimentsFn; // was: A (param K)
  }
}

/**
 * Secure ping sender that upgrades URLs to HTTPS, scrubs referrers, and
 * attaches authentication headers (USER_AUTH, PLUS_PAGE_ID, VISITOR_ID, etc.)
 * when the URL domain matches Google ad endpoints.
 * [was: SZv]
 */
export class SecurePingSender {
  constructor(innerSender, playerContextProvider) { // was: Q, c
    this.innerSender = innerSender;               // was: W
    this.playerContextProvider = playerContextProvider; // was: QC
  }

  /**
   * @param {string} url [was: Q]
   * @param {*} macros [was: c]
   * @param {*} extra [was: W]
   * @param {string} [attributionSrcMode] [was: m]
   */
  send(url, macros, extra, attributionSrcMode) {
    let useAttribution = false; // was: K
    try {
      if (
        attributionSrcMode === "ATTRIBUTION_SRC_MODE_LABEL_CHROME" ||
        attributionSrcMode === "ATTRIBUTION_SRC_MODE_XHR_OPTION"
      ) {
        useAttribution = true;
        url = appendAttributionReportingSignal(url);
      }
      const parsed = parseUri(url); // was: T (reused as m)
      let secureUrl; // was: r
      if (parsed[1] === "https") {
        secureUrl = url;
      } else {
        parsed[1] = "https";
        secureUrl = x8("https", parsed[2], parsed[3], parsed[4], parsed[5], parsed[6], parsed[7]);
      }
      const scrubReferrer = isTrackingUrl(secureUrl); // was: T (reused)
      const headers = []; // was: T (reused)
      const shouldAddRemarketingAuth =
        isGoogleDomain(secureUrl) &&
        this.playerContextProvider.get().U.G().experiments.SG(
          "add_auth_headers_to_remarketing_google_dot_com_ping"
        ); // was: I
      if (isYouTubeDomain(secureUrl) || shouldAddRemarketingAuth) {
        headers.push({ headerType: "USER_AUTH" });
        headers.push({ headerType: "PLUS_PAGE_ID" });
        headers.push({ headerType: "VISITOR_ID" });
        headers.push({ headerType: "EOM_VISITOR_ID" });
        headers.push({ headerType: "AUTH_USER" });
        headers.push({ headerType: "DATASYNC_ID" });
      }
      this.innerSender.send(
        {
          baseUrl: secureUrl,
          scrubReferrer,
          headers,
        },
        macros,
        extra,
        useAttribution
      );
    } catch (_ignored) { // was: U
      // Silently swallow errors for ping reliability
    }
  }
}

/**
 * Ad ping coordinator — owns the player reference, viewability integration,
 * data store, logging output, and the secure ping sender instance.
 * [was: n_]
 */
export class AdPingCoordinator {
  constructor(player, urlReplacer, viewability, dataStore, loggingOutput, playerContext, innerSender) {
    // was: Q, c, W, m, K, T, r (default-constructed yAS)
    this.player = player;             // was: U
    this.urlReplacer = urlReplacer;   // was: O
    this.viewability = viewability;   // was: lX
    this.dataStore = dataStore;       // was: cA
    this.loggingOutput = loggingOutput; // was: LO
    this.playerContext = playerContext;  // was: QC
    this.innerSender = innerSender;     // was: j
    this.cachedSender = null;           // was: S_
    this.endpointMap = new Map();       // was: W
    this.secureSender = new SecurePingSender(innerSender, this.playerContext); // was: A
  }

  /** Returns the player's zone-map for player type 1. */
  getZoneMap() { // was: zm
    return this.player.actionCompanionAdRenderer(1);
  }
}
