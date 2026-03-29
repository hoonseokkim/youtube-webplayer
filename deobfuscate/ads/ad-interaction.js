/**
 * ad-interaction.js -- Ad interactive elements, layout rendering, trigger
 * scheduling, command routing, URL allow-list patterns, and ad metadata
 * value wrappers.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines 71554-73301
 *   (skips 72091-72178 innertube transport classes,
 *    skips 72434-72449 innertube globals)
 *
 * Provides:
 *  - URL allow-list initialization (hK calls for youtube/gstatic/css/js)
 *  - YTCSI debug-log size limit (k9y)
 *  - Latency action name-to-enum mapping (c3K) -- 100+ CSI actions
 *  - AFT recorded event (N5W, Hdw)
 *  - GEL sequence-ID and usage-stats registries (Kn7, cu)
 *  - Latency tick/info/span reporter (p2)
 *  - Performance timing shim (anX) and cross-browser perf accessor (mY)
 *  - CSI resource-timing helpers (eE, y30)
 *  - Streamz flush classes (G8K, gN0, Sl_)
 *  - Cache wrapper (zay) with TTL support
 *  - Ads event cache (Z0, Eh, sh, PQ0) for companion/engagement-panel data
 *  - UI theme mapping (h3n) dark/light enum
 *  - Consistency-token jar service (jE)
 *  - Client location service (g$) with geolocation, X-Geo header
 *  - Simple key-value store (Paw)
 *  - Service locator container (mappings-based)
 *  - Innertube client-name path prefixes (ps0)
 *  - Innertube request builder base (ln7, By)
 *  - Specific innertube endpoint builders (iOR, yz7, NVR, DAR, tHK, HO0, S_3)
 *  - Injection tokens (VJ, BI, xO, FNw, BVd, qw)
 *  - IDB-backed key-value store (hVW) with TTL
 *  - Cache entry wrapper (Vaw) with expiry/processed checks
 *  - Ephemeral in-memory store (q_x) with auto-eviction
 *  - Redux-like store wrapper (Cad) with dispatch/subscribe
 *  - Chunked buffer (Xu) with split/focus
 *  - Protobuf reader/writer primitives (A0, iWm)
 *  - Entity-to-ID mapping tables (ZWm, FZR)
 *  - AES-CTR encryption engine (JeR) with S-box lookup tables
 *  - WebCrypto + fallback AES wrapper (UQ, JlW, Ue)
 *  - HMAC-SHA256 implementation (f4x) with block-level streaming
 *  - PES encoder/decoder framework (YLn, pgW, QJO, oux, MB)
 *  - Entity-to-protobuf-class registry (JGw)
 *  - Entity mutation observer (mAm)
 *  - Persistent entity store sync via BroadcastChannel (rzO)
 *  - Reduced-motion media-query helper (UAK)
 *  - Fetch-based network manager (xAy) with streaming JSON support
 *  - BotGuard/attestation VM lifecycle (WFm, mWn)
 *  - Attestation challenge runner (E5) with timeout racing
 *  - Cross-device progress command handler (itw)
 *  - Ad mute endpoint handler (DmW)
 *  - Open-popup / pinging no-op handlers (Nex, t1d)
 *  - Ad macro substitution keys (mz7) -- 40+ tracking macro names
 *  - URL-endpoint command handler (Htd) with macro expansion
 *  - Ad metadata value wrappers (qh, Iww, AEX, nw0, De7, lx, ux, JDd, tlR, HqK)
 *
 * @module ads/ad-interaction
 */

import { expandUrlTemplate } from '../core/bitstream-helpers.js';  // was: g.lZ
import { getCookie } from '../core/misc-helpers.js';  // was: g.V5
import { logGelEvent } from '../data/gel-params.js';  // was: g.eG
import { getExperimentBoolean } from '../data/idb-transactions.js';  // was: g.P
import { playbackDataActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: js
import { findSegmentRecord } from './ad-cue-delivery.js'; // was: S1
import { addStateBits } from '../media/source-buffer.js'; // was: e7
import { markTimingCheckpoint } from '../media/buffer-stats.js'; // was: zD
import { MediaTimeRangeTrigger } from './ad-trigger-types.js'; // was: vE
import { SabrRequest } from '../media/playback-controller.js'; // was: Cb
import { logPoTokenTiming } from '../player/video-loader.js'; // was: SY
import { setPlayerTime } from '../modules/remote/remote-player.js'; // was: wz
import { SYM_SKIP } from '../proto/message-setup.js'; // was: sS
import { computeClampedRange } from '../ui/progress-bar-impl.js'; // was: Ag
import { concat } from '../core/array-utils.js';
import { safeOpenUrl } from '../data/gel-params.js';
// TODO: resolve g.concat

// ============================================================================
// URL Allow-list Initialization  (line 71554)
// ============================================================================

/**
 * Registers URL pattern allow-lists for the player's resource loader,
 * covering YouTube origins, static assets, and mobile/Kabuki routes.
 */
registerUrlPatterns([/^https:\/\/([\w-]*\.)*youtube\.com.*/, /^https:\/\/([\w-]*\.)*gstatic\.com.*/]); // was: hK([...])
registerUrlPatterns([/\.css$/, /\.js$/, /\.webm$/, /\.png$/]);
registerUrlPatterns([
  /\.css$/, /\.js$/, /\.ico$/,
  /\/ytmweb\/_\/playbackDataActionMetadataKey\//, /\/ytmweb\/_\/ss\//,
  /\/kabuki\/_\/playbackDataActionMetadataKey\//, /\/kabuki\/_\/ss\//,
  /\/ytmainappweb\/_\/playbackDataActionMetadataKey\//, /\/ytmainappweb\/_\/ss\//,
  /\/ytmusicweb\/_\/playbackDataActionMetadataKey\//, /\/ytmusicweb\/_\/ss\//,
  /\/music_integrations\/_\/playbackDataActionMetadataKey\//, /\/music_integrations\/_\/ss\//
]);
registerUrlPatterns([/purge_shell=1/]);

// ============================================================================
// CSI Debug / Latency Action Mapping  (line 71569)
// ============================================================================

/**
 * Maximum number of CSI debug entries to retain.
 * [was: k9y]
 */
export const csiDebugMaxSize = getConfigInt("ytcsi_debug_max_size", 100); // was: Y3(...)

/**
 * Maps CSI action short names to their LATENCY_ACTION_* enum values.
 * Contains 100+ entries covering watch, browse, search, embed, creator
 * studio, CMS, ads, live, and more.
 *
 * [was: c3K]
 */
export const LATENCY_ACTION_MAP = { // was: c3K
  auto_search: "LATENCY_ACTION_AUTO_SEARCH",
  ad_to_ad: "LATENCY_ACTION_AD_TO_AD",
  ad_to_video: "LATENCY_ACTION_AD_TO_VIDEO",
  app_startup: "LATENCY_ACTION_APP_STARTUP",
  browse: "LATENCY_ACTION_BROWSE",
  cast_splash: "LATENCY_ACTION_CAST_SPLASH",
  call_to_cast: "LATENCY_ACTION_CALL_TO_CAST",
  direct_playback: "LATENCY_ACTION_DIRECT_PLAYBACK",
  embed: "LATENCY_ACTION_EMBED",
  embed_no_video: "LATENCY_ACTION_EMBED_NO_VIDEO",
  home: "LATENCY_ACTION_HOME",
  library: "LATENCY_ACTION_LIBRARY",
  live: "LATENCY_ACTION_LIVE",
  player_att: "LATENCY_ACTION_PLAYER_ATTESTATION",
  prebuffer: "LATENCY_ACTION_PREBUFFER",
  prefetch: "LATENCY_ACTION_PREFETCH",
  reel_watch: "LATENCY_ACTION_REEL_WATCH",
  results: "LATENCY_ACTION_RESULTS",
  search_suggest: "LATENCY_ACTION_SUGGEST",
  seek: "LATENCY_ACTION_PLAYER_SEEK",
  settings: "LATENCY_ACTION_SETTINGS",
  video_to_ad: "LATENCY_ACTION_VIDEO_TO_AD",
  watch: "LATENCY_ACTION_WATCH",
  "watch,watch7": "LATENCY_ACTION_WATCH",
  "watch,watch7_html5": "LATENCY_ACTION_WATCH",
  "watch,watch7ad": "LATENCY_ACTION_WATCH",
  "watch,watch7ad_html5": "LATENCY_ACTION_WATCH",
  wn_comments: "LATENCY_ACTION_LOAD_COMMENTS",
  networkless_performance: "LATENCY_ACTION_NETWORKLESS_PERFORMANCE",
  gel_compression: "LATENCY_ACTION_GEL_COMPRESSION",
  gel_jspb_serialize: "LATENCY_ACTION_GEL_JSPB_SERIALIZE",
  attestation_challenge_fetch: "LATENCY_ACTION_ATTESTATION_CHALLENGE_FETCH"
  // ... 70+ additional creator-studio / CMS entries omitted for brevity --
  // see source lines 71655-71737 for full Object.assign block
};

// ============================================================================
// Latency Reporter  (line 71749)
// ============================================================================

/**
 * Reports latency ticks, info payloads, JSPB info, and spans for
 * client-side instrumentation. De-duplicates by a usage-count guard.
 *
 * [was: p2]
 */
export class LatencyReporter { // was: p2
  constructor() {
    this.usageCount = 0; // was: this.W = 0
  }

  tick(tickName, clientActionNonce, timestamp, cttAuthInfo) { // was: Q, c, W, m
    if (!isDuplicate(this, `tick_${tickName}_${clientActionNonce}`)) { // was: Wu(this, ...)
      logGelEvent("latencyActionTicked", {
        tickName,
        clientActionNonce
      }, { timestamp, cttAuthInfo });
    }
  }

  info(payload, clientActionNonce, cttAuthInfo) { // was: Q, c, W
    const keySignature = Object.keys(payload).join("");
    if (!isDuplicate(this, `info_${keySignature}_${clientActionNonce}`)) {
      const data = { ...payload, clientActionNonce };
      logGelEvent("latencyActionInfo", data, { cttAuthInfo });
    }
  }

  jspbInfo(jspbPayload, clientActionNonce, cttAuthInfo) { // was: Q, c, W
    let fieldSig = "";
    for (let i = 0; i < getJspbFields(jspbPayload).length; i++) // was: xH(Q)
      if (getJspbFields(jspbPayload)[i] !== undefined) // was: void 0
        fieldSig = i === 0 ? fieldSig.concat(`${i}`) : fieldSig.concat(`_${i}`);
    if (!isDuplicate(this, `info_${fieldSig}_${clientActionNonce}`)) {
      setJspbString(jspbPayload, 2, clientActionNonce); // was: DZ(Q, 2, c)
      const opts = { cttAuthInfo };
      const wrapper = getExperimentBoolean("jspb_sparse_encoded_pivot") ? new JspbPivot([{}]) : new JspbPivot(); // was: rn
      setJspbSubmessageOneOf(wrapper, LatencyInfoType, 7, LatencyInfoSubtype, jspbPayload); // was: UB(W, lGO, 7, u87, Q)
      sendJspbPayload(wrapper, opts); // was: oNX(W, c)
    }
  }

  span(payload, clientActionNonce, cttAuthInfo) { // was: Q, c, W
    const keySignature = Object.keys(payload).join("");
    if (!isDuplicate(this, `span_${keySignature}_${clientActionNonce}`)) {
      payload.clientActionNonce = clientActionNonce;
      logGelEvent("latencyActionSpan", payload, { cttAuthInfo });
    }
  }
}

// ============================================================================
// Ads Event Cache  (line 71887)
// ============================================================================

/**
 * Module-level caches for the last companion data, engagement-panel
 * actions, and scroll-to commands received from ad responses.
 * [was: Z0, Eh, sh, PQ0]
 */
let lastCompanionData = null; // was: Z0
let lastUpdateEngagementPanelAction = null; // was: Eh
let lastChangeEngagementPanelVisibilityAction = null; // was: sh
let lastScrollToEngagementPanelCommand = null; // was: PQ0

setGlobal("yt.www.ads.eventcache.getLastCompanionData", () => lastCompanionData);
setGlobal("yt.www.ads.eventcache.getLastPlaShelfData", () => null);
setGlobal("yt.www.ads.eventcache.getLastUpdateEngagementPanelAction", () => lastUpdateEngagementPanelAction);
setGlobal("yt.www.ads.eventcache.getLastChangeEngagementPanelVisibilityAction", () => lastChangeEngagementPanelVisibilityAction);
setGlobal("yt.www.ads.eventcache.getLastScrollToEngagementPanelCommand", () => lastScrollToEngagementPanelCommand);

// ============================================================================
// UI Theme Mapping  (line 71907)
// ============================================================================

/**
 * Maps theme names to their protobuf enum values.
 * [was: h3n]
 */
export const THEME_ENUM_MAP = new Map([ // was: h3n
  ["dark", "USER_INTERFACE_THEME_DARK"],
  ["light", "USER_INTERFACE_THEME_LIGHT"]
]);

// ============================================================================
// Consistency Token Service  (line 71908)
// ============================================================================

/**
 * Manages consistency-token jars for innertube request/response pairs,
 * keeping the local set in sync with server-returned jars.
 *
 * [was: jE]
 */
export class ConsistencyTokenService { // was: jE
  constructor() {
    this.tokenJars = {}; // was: this.W = {}
    if (this.isEnabled = isConsistencyServiceEnabled()) { // was: this.O = b3_()
      const initialToken = getCookie("CONSISTENCY");
      initialToken && this.addTokenJar({ encryptedTokenJarContents: initialToken }); // was: CQW(this, ...)
    }
  }

  handleResponse(response, request) { // was: Q, c
    if (!request)
      throw Error("request needs to be passed into ConsistencyService");
    const requestJars = request.Ut.context?.request?.consistencyTokenJars || [];
    const responseJar = response.responseContext?.consistencyTokenJar;
    responseJar && this.replace(requestJars, responseJar);
  }

  replace(oldJars, newJar) { // was: Q, c
    for (const jar of oldJars)
      delete this.tokenJars[jar.encryptedTokenJarContents];
    this.addTokenJar(newJar); // was: CQW(this, c)
  }
}

// ============================================================================
// Ad Macro Substitution Keys  (line 73321)
// ============================================================================

/**
 * Maps symbolic macro names to the placeholder strings used in ad ping
 * URLs. The player substitutes actual values before sending pings.
 *
 * [was: mz7]
 */
export const AD_MACRO_KEYS = { // was: mz7
  KS: "FINAL",
  uJ: "AD_BREAK_LENGTH",
  hK: "AD_CPN",
  DJ: "AH",
  XW: "AD_MT",
  gQ: "ASR",
  JK: "AW",
  nM: "NM",
  YB: "NX",
  findSegmentRecord: "NY",
  addStateBits: "CONN",
  markTimingCheckpoint: "CPN",
  kP: "DV_VIEWABILITY",
  MediaTimeRangeTrigger: "ERRORCODE",
  n_: "ERROR_MSG",
  S7: "EI",
  SabrRequest: "GOOGLE_VIEWABILITY",
  oz: "IAS_VIEWABILITY",
  H$: "LACT",
  c$: "LIVE_TARGETING_CONTEXT",
  logPoTokenTiming: "I_X",
  RQ: "I_Y",
  T_: "MT",
  setPlayerTime: "MIDROLL_POS",
  a7: "MIDROLL_POS_MS",
  I7: "MOAT_INIT",
  pj: "MOAT_VIEWABILITY",
  Yj: "elementsCommandKey",
  SJ: "PV_H",
  R7: "PV_W",
  FFM: "P_W",
  mMJ: "TRIGGER_TYPE",
  VGI: "SDKV",
  pB0: "SLOT_POS",
  yeJ: "SURVEY_LOCAL_TIME_EPOCH_S",
  xQH: "SURVEY_ELAPSED_MS",
  SYM_SKIP: "VIS",
  mmG: "VIEWABILITY",
  ttH: "VED",
  TAF: "VOL",
  f70: "WT",
  BAG: "YT_ERROR_CODE"
};

// ============================================================================
// URL Endpoint Command Handler  (line 73365)
// ============================================================================

/**
 * Handles `urlEndpoint` commands by resolving the layout context,
 * substituting ad macros into the URL, and firing tracking pings.
 *
 * [was: Htd]
 */
export class UrlEndpointHandler { // was: Htd
  constructor(playerApi, featureFlags, layoutStateRef) { // was: Q, c, W
    this.playerApi = playerApi; // was: this.gs = Q
    this.featureFlags = featureFlags; // was: this.W = c
    this.layoutStateRef = layoutStateRef; // was: this.hJ = W
    registerInjection(getInjector(), { // was: nL(Ng(), ...)
      NP: postMessageTunnelToken, // was: od3
      computeClampedRange: PostMessageTunnelClass // was: cid
    });
  }

  /** [was: Bn] */
  getCommandName() {
    return "urlEndpoint";
  }

  /** [was: R4] */
  handleCommand(endpoint, layoutId, extraContext) { // was: Q, c, W
    let macros;
    {
      const layoutState = this.layoutStateRef.get();
      const layoutInfo = findLayout(layoutState.O.get(), layoutId); // was: VZ(m.O.get(), c)
      if (layoutInfo) {
        macros = buildMacros(layoutState, getLayoutChannel(layoutInfo), layoutInfo, undefined, undefined, extraContext); // was: $A(m, CH(K), K, ...)
      } else {
        logAdWarning("Trying to ping from an unknown layout", undefined, undefined, { layoutId }); // was: v1(...)
        macros = {};
      }
    }
    macros = { ...macros };
    if (checkFeatureFlag(this.featureFlags, "h5_inplayer_enable_adcpn_macro_substitution_for_click_pings")) {
      const adVideoData = getPlayerVideoData(this.playerApi, 2); // was: mX(this.gs, 2)
      adVideoData && (macros.AD_CPN = adVideoData.clientPlaybackNonce);
    }
    const expandedUrl = expandUrlTemplate(endpoint.url, macros);
    const request = safeOpenUrl(expandedUrl, undefined, undefined, undefined, endpoint.attributionSrcMode === "ATTRIBUTION_SRC_MODE_LABEL_CHROME"); // was: void 0
    trackPingRequest(request, expandedUrl); // was: rJ7(Q, c)
  }
}

// ============================================================================
// Ad Metadata Value Wrappers  (line 73397)
// ============================================================================

/**
 * Base metadata wrapper providing a typed `.get()` accessor.
 * [was: qh]
 */
export class MetadataValue { // was: qh
  constructor(value) { this.value = value; }
  get() { return this.value; }
}

/**
 * Companion ad renderer metadata.
 * [was: Iww]
 */
export class ActionCompanionMetadata extends MetadataValue { // was: Iww
  metadataType() { return "metadata_type_action_companion_ad_renderer"; } // was: W()
}

/**
 * Top-banner image+text+icon layout view-model metadata.
 * [was: AEX]
 */
export class TopBannerMetadata extends MetadataValue { // was: AEX
  metadataType() { return "metadata_type_top_banner_image_text_icon_buttoned_layout_view_model"; }
}

/**
 * Ads engagement-panel renderer metadata.
 * [was: nw0]
 */
export class EngagementPanelRendererMetadata extends MetadataValue { // was: nw0
  metadataType() { return "metadata_type_ads_engagement_panel_renderer"; }
}

/**
 * Ads engagement-panel layout view-model metadata.
 * [was: De7]
 */
export class EngagementPanelLayoutMetadata extends MetadataValue { // was: De7
  metadataType() { return "metadata_type_ads_engagement_panel_layout_view_model"; }
}

/**
 * Ad next-params metadata.
 * [was: lx]
 */
export class AdNextParamsMetadata extends MetadataValue { // was: lx
  metadataType() { return "metadata_type_ad_next_params"; }
}

/**
 * Ad video clickthrough endpoint metadata.
 * [was: ux]
 */
export class AdVideoClickthroughMetadata extends MetadataValue { // was: ux
  metadataType() { return "metadata_type_ad_video_clickthrough_endpoint"; }
}

/**
 * In-video overlay ad renderer metadata.
 * [was: JDd]
 */
export class InvideoOverlayMetadata extends MetadataValue { // was: JDd
  metadataType() { return "metadata_type_invideo_overlay_ad_renderer"; }
}

/**
 * Image companion ad renderer metadata.
 * [was: tlR]
 */
export class ImageCompanionMetadata extends MetadataValue { // was: tlR
  metadataType() { return "metadata_type_image_companion_ad_renderer"; }
}

/**
 * Banner image layout view-model metadata.
 * [was: HqK]
 */
export class BannerImageMetadata extends MetadataValue { // was: HqK
  metadataType() { return "metadata_type_banner_image_layout_view_model"; }
}
