/**
 * Device context tail, account state setup, player state initialization,
 * media session, external API surface.
 *
 * Source: base.js lines 84540–85083, 85087–85969
 * [was: (videoData method continuations), DXx, tdn, nxX, HM7, iMw, NhR,
 *  W0, bnx, tc, j30, Ei3, gq3, fFX, On7, OMn, vi0, aF7, g.HL]
 */

import { publishEventAll } from '../ads/ad-click-tracking.js';  // was: g.Ht
import { AsyncQueue } from '../core/bitstream-helpers.js';  // was: g.$K
import { getWebGLRenderer } from '../media/performance-monitor.js';  // was: g.mH
import { isAtLiveHead, pauseVideo, playVideo, preloadVideoByPlayerVars, seekBy, seekTo, stopVideo } from '../player/player-events.js';  // was: g.isAtLiveHead, g.pauseVideo, g.playVideo, g.preloadVideoByPlayerVars, g.seekBy, g.seekTo, g.stopVideo
import { PlayerError } from '../ui/cue-manager.js';  // was: g.rh
import { isFullscreenEnabled } from '../ui/layout/fullscreen.js';  // was: g.JE
import { isEmbedWithAudio } from './bandwidth-tracker.js';  // was: g.oc
import { logGelEvent, reportWarning } from './gel-params.js';  // was: g.eG, g.Ty
import { isWebEmbeddedPlayer } from './performance-profiling.js';  // was: g.sQ
import { testUrlPattern } from '../ads/ad-scheduling.js'; // was: tI
import { encryptSync } from '../media/drm-signature.js'; // was: I4
import { disposeApp } from '../player/player-events.js'; // was: WA
import { createDatabaseDefinition } from './idb-transactions.js'; // was: el
import { deriveExternalPlayerState } from '../player/playback-state.js'; // was: SCd
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { invokeUnaryRpc } from '../media/bitstream-reader.js'; // was: BG
import { markAutoplayFlag } from '../player/playback-state.js'; // was: k$
import { dispatchSeek } from '../player/playback-state.js'; // was: Y$
import { getClippedDuration } from '../player/playback-state.js'; // was: ci
import { LayoutIdExitedTrigger } from '../ads/ad-trigger-types.js'; // was: Lz
import { applyVolume } from '../player/playback-state.js'; // was: KH
import { unwrapTrustedResourceUrl } from '../core/composition-helpers.js'; // was: x3
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { getEffectiveBandwidth } from '../media/quality-manager.js'; // was: Ib
import { isMutedAutoplay } from '../player/playback-state.js'; // was: yS
import { validateSlotTriggers } from '../ads/ad-scheduling.js'; // was: er
import { isDetailOrShortsAutoplay } from '../features/autoplay.js'; // was: r7
import { getAdModule } from '../player/caption-manager.js'; // was: u2
import { tryAsync } from '../ads/ad-async.js'; // was: bi
import { stepGenerator } from '../ads/ad-async.js'; // was: GH
import { DEFAULT_STORE_EXPIRATION_TOKEN } from '../network/innertube-config.js'; // was: BI
import { EXP_748402147 } from '../proto/messages-core.js'; // was: Hw
import { EXTENDED_PLAYBACK_RATES } from './idb-operations.js'; // was: SLn
import { dispatchLayoutEvent } from '../media/source-buffer.js'; // was: DK
import { PREMIUM_PLAYBACK_RATES } from './idb-operations.js'; // was: F23
import { getSelectableVideoFormats } from '../player/context-updates.js'; // was: SZ()
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { normalizeVideoParams } from '../ads/ad-click-tracking.js'; // was: N3
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { normalizeMediaContentUrl } from '../ads/ad-click-tracking.js'; // was: ZMn
import { SLOT_MESSAGE_MARKER } from '../proto/messages-core.js'; // was: Ww
import { wireEvent } from './metrics-keys.js'; // was: m_
import { exitFullscreen } from '../ui/layout/fullscreen.js'; // was: kn
import { requestFullscreen } from '../ui/layout/fullscreen.js'; // was: Mt
import { getFullscreenElement } from '../ui/layout/fullscreen.js'; // was: R2
import { getRemoteModule } from '../player/caption-manager.js'; // was: w7
import { sendPostRequest } from '../network/request.js'; // was: ms
import { getMediaElementTime } from '../player/time-tracking.js'; // was: A6()
import { adjustDaiDuration } from '../player/playback-mode.js'; // was: Qw
import { getSeekableStart } from '../player/time-tracking.js'; // was: v4()
import { getStreamTimeOffsetNQ } from '../player/time-tracking.js'; // was: NQ()
import { getCountdownDuration } from '../modules/endscreen/autoplay-countdown.js'; // was: VY
import { computeBandwidthEstimate } from '../ads/ad-prebuffer.js'; // was: U6
import { Disposable } from '../core/disposable.js';
import { dispose } from '../ads/dai-cue-range.js';
import { getCurrentTime, getDuration, isMuted, getVolume, getPlaybackQuality, getPlayerSize } from '../player/time-tracking.js';
import { getAppState, loadVideoByPlayerVars, cueVideoByPlayerVars, getWebPlayerContextConfig } from '../player/player-api.js';
import { clamp } from '../core/math-utils.js';
import { filter, concat } from '../core/array-utils.js';
import { setSize } from '../core/dom-utils.js';
import { getOrigin, getDomain } from '../core/url-utils.js';
import { handleError } from '../player/context-updates.js';
// TODO: resolve g.ip

// ---------------------------------------------------------------------------
// VideoData tail: player-var ingestion (lines 84540–85083)
// ---------------------------------------------------------------------------

/*
 * These lines are the tail of a large method on the VideoData class that
 * parses raw player vars (Q) into typed fields. Key assignments below:
 */

/**
 * Continued from VideoData.parse() — sets ad-beacon URLs, session data,
 * player-var booleans, and streaming/caption config.
 *
 * Notable field assignments (inline excerpt from source):
 *
 *   this.YD = Q.pyv_quartile50_beacon_url;       // 50% quartile beacon
 *   this.Sk = Q.pyv_quartile75_beacon_url;       // 75% quartile beacon
 *   this.o5 = Q.pyv_quartile100_beacon_url;      // 100% quartile beacon
 *   this.isFling = coerceNumber(…, Q.is_fling) === 1;
 *   this.videoId = extractVideoId(Q) || this.videoId;   [was: GG(Q)]
 *   this.Q2 = coerceBoolean(this.Q2, Q.audio_only);     [was: gL]
 *   this.adaptiveFormats = c;  // from Q.adaptive_fmts
 *   this.QE = true; // manifestful enabled           [was: !0]
 *   this.enableServerStitchedDai = …;
 *
 * The full body is 544 lines; see source for every field.
 */

// (No standalone export — this is method-body deobfuscation documentation.)

// ---------------------------------------------------------------------------
// VideoData.EM() — media-session eligibility (line 85087)
// ---------------------------------------------------------------------------

/**
 * Check whether the media session should be active.
 * Copied verbatim from VideoData.prototype.EM:
 *
 *   return this.J ||
 *     (this.X("web_player_media_session_infinity") && this.isLivePlayback);
 *
 * [was: EM]
 */

// ---------------------------------------------------------------------------
// VideoData.WA() — cleanup (lines 85090–85102)
// ---------------------------------------------------------------------------

/**
 * Dispose of video-data internals.
 * Nulls out playerResponse, adaptiveFormats, suggestions, etc.
 * [was: WA]
 */

// ---------------------------------------------------------------------------
// Enum maps (lines 85104–85140)
// ---------------------------------------------------------------------------

/**
 * Whether randomised preroll jitter is enabled.
 * [was: wam]
 */
export const enablePrerollJitter = true; // was: wam = !0

/**
 * Form-factor mapping (phone → SMALL, tablet → LARGE).
 * [was: DXx]
 */
export const FormFactorMap = {
  phone: "SMALL_FORM_FACTOR",
  tablet: "LARGE_FORM_FACTOR",
};

/**
 * Device-type mapping.
 * [was: tdn]
 */
export const DeviceTypeMap = {
  desktop: "DESKTOP",
  phone: "MOBILE",
  tablet: "TABLET",
};

/**
 * Break-type mapping (preroll/midroll/postroll).
 * [was: nxX]
 */
export const BreakTypeMap = {
  preroll: "BREAK_PREROLL",
  midroll: "BREAK_MIDROLL",
  postroll: "BREAK_POSTROLL",
};

/**
 * Kids age-up mode enum.
 * [was: HM7]
 */
export const KidsAgeUpMode = {
  0: "YT_KIDS_AGE_UP_MODE_UNKNOWN",
  1: "YT_KIDS_AGE_UP_MODE_OFF",
  2: "YT_KIDS_AGE_UP_MODE_TWEEN",
  3: "YT_KIDS_AGE_UP_MODE_PRESCHOOL",
};

/**
 * MDX control-mode enum.
 * [was: iMw]
 */
export const MdxControlMode = {
  0: "MDX_CONTROL_MODE_UNKNOWN",
  1: "MDX_CONTROL_MODE_REMOTE",
  2: "MDX_CONTROL_MODE_VOICE",
};

/**
 * Unplugged filter-mode type enum.
 * [was: NhR]
 */
export const UnpluggedFilterMode = {
  0: "UNPLUGGED_FILTER_MODE_TYPE_UNKNOWN",
  1: "UNPLUGGED_FILTER_MODE_TYPE_NONE",
  2: "UNPLUGGED_FILTER_MODE_TYPE_PG",
  3: "UNPLUGGED_FILTER_MODE_TYPE_PG_THIRTEEN",
};

/**
 * Embedded-player muted-autoplay duration mode.
 * [was: W0]
 */
export const MutedAutoplayDurationMode = {
  0: "EMBEDDED_PLAYER_MUTED_AUTOPLAY_DURATION_MODE_UNSPECIFIED",
  1: "EMBEDDED_PLAYER_MUTED_AUTOPLAY_DURATION_MODE_30_SECONDS",
  2: "EMBEDDED_PLAYER_MUTED_AUTOPLAY_DURATION_MODE_FULL",
};

// ---------------------------------------------------------------------------
// External-call handler base (lines 85141–85201)
// ---------------------------------------------------------------------------

/**
 * Base class for handling external API calls dispatched into the player.
 * [was: bnx]
 */
export class ExternalCallHandler extends Disposable { // was: bnx
  /**
   * @param {Object} app  [was: Q]
   * @param {Object} state  [was: c]
   */
  constructor(app, state) {
    super();
    this.app = app;
    this.state = state;
  }

  /**
   * Dispatch an external API method call.
   * [was: handleExternalCall]
   * @param {string} methodName  [was: Q]
   * @param {Array} args  [was: c]
   * @param {string} [origin]  [was: W]
   * @returns {*}
   */
  handleExternalCall(methodName, args, origin) {
    const trustedFn = this.state.K[methodName]; // was: m
    const untrustedFn = this.state.D[methodName]; // was: K
    let target = trustedFn; // was: T
    if (untrustedFn) {
      if (origin && testUrlPattern(origin, Ai0)) {
        target = untrustedFn;
      } else if (!trustedFn) {
        throw Error(`API call from an untrusted origin: "${origin}"`);
      }
    }
    this.logApiCall(methodName, origin);
    if (target) {
      // Check for "javascript:" injection in arguments
      let dangerous = false; // was: W (reused)
      for (const arg of args) { // was: r
        if (String(arg).includes("javascript:")) {
          dangerous = true;
          break;
        }
      }
      if (dangerous) reportWarning(Error(`Dangerous call to "${methodName}" with [${args}].`));
      return target.apply(this, args);
    }
    throw Error(`Unknown API method: "${methodName}".`);
  }

  /**
   * Log an API call for telemetry.
   * [was: logApiCall]
   */
  logApiCall(methodName, origin, NetworkErrorCode) { // was: Q, c, W
    const config = this.app.G(); // was: m
    if (config.encryptSync && !this.state.Y.has(methodName)) {
      this.state.Y.add(methodName);
      logGelEvent("webPlayerApiCalled", {
        callerUrl: config.loaderUrl,
        methodName,
        origin: origin || undefined, // was: void 0
        playerStyle: config.playerStyle || undefined,
        embeddedPlayerMode: config.Ie,
        NetworkErrorCode,
      });
    }
  }

  /**
   * Publish an event, forwarding to sub-channels for specific event types.
   * [was: publish]
   */
  publish(eventName, ...args) { // was: Q, c
    this.state.A.publish(eventName, ...args);
    if (eventName === "videodatachange" || eventName === "resize" || eventName === "cardstatechange") {
      this.state.O.publish(eventName, ...args);
      this.state.j.publish(eventName, ...args);
    }
  }

  X(flag) { // was: Q
    return this.app.G().X(flag);
  }

  disposeApp() {
    if (this.state.element) {
      const createDatabaseDefinition = this.state.element; // was: Q
      for (const key in this.state.W) { // was: c
        if (this.state.W.hasOwnProperty(key)) createDatabaseDefinition[key] = null;
      }
      this.state.element = null;
    }
    super.disposeApp();
  }
}

// ---------------------------------------------------------------------------
// Reentrant publish channel (lines 85203–85222)
// ---------------------------------------------------------------------------

/**
 * PubSub channel that queues events published during handler execution
 * to prevent infinite recursion.
 * [was: tc]
 */
export class ReentrantChannel extends AsyncQueue { // was: tc
  constructor() {
    super();
    this.K = new Map();
  }

  publish(eventName, ...args) { // was: Q, c
    if (this.K.has(eventName)) {
      this.K.get(eventName).push(args);
      return true; // was: !0
    }
    let delivered = false; // was: W -> !1
    try {
      const queue = [args]; // was: c (reused)
      this.K.set(eventName, queue);
      while (queue.length) {
        delivered = super.publish(eventName, ...queue.shift());
      }
    } finally {
      this.K.delete(eventName);
    }
    return delivered;
  }
}

// ---------------------------------------------------------------------------
// API state container (lines 85224–85245)
// ---------------------------------------------------------------------------

/**
 * State object holding the element, method tables, and pub-sub channels.
 * [was: j30]
 */
export class ApiState extends Disposable { // was: j30
  constructor() {
    super(...arguments);
    this.element = null;
    this.J = new Set();
    this.K = {};           // trusted methods
    this.D = {};           // untrusted methods
    this.W = {};           // element property map
    this.Y = new Set();    // logged methods
    this.A = new ReentrantChannel(); // was: tc
    this.O = new ReentrantChannel();
    this.j = new ReentrantChannel();
    this.L = new ReentrantChannel();
  }

  disposeApp() {
    this.L.dispose();
    this.j.dispose();
    this.O.dispose();
    this.A.dispose();
    this.Y = this.W = this.D = this.K = this.J = undefined; // was: void 0
  }
}

/**
 * Set of player-var keys that map directly to embed parameters.
 * [was: Ei3]
 */
export const EmbedParamKeys = new Set(
  "endSeconds startSeconds mediaContentUrl suggestedQuality videoId rct rctn playmuted muted_autoplay_duration_mode".split(" ")
);

// ---------------------------------------------------------------------------
// Embed API surface (lines 85248–85594)
// ---------------------------------------------------------------------------

/**
 * Public embed API (iframe API methods).
 * [was: gq3]
 */
export class EmbedApi extends ExternalCallHandler { // was: gq3
  getApiInterface() {
    return Array.from(this.state.J);
  }

  mF(event, callback) { // was: Q, c
    this.state.L.subscribe(event, callback);
  }

  U7(event, callback) { // was: Q, c
    this.state.L.unsubscribe(event, callback);
  }

  getPlayerState(playerType) { // was: Q
    return deriveExternalPlayerState(this.app, playerType);
  }

  toggleFineScrub() {
    return deriveExternalPlayerState(this.app);
  }

  invokeUnaryRpc(videoId, startSeconds, suggestedQuality) { // was: Q, c, W
    if (So(this)) {
      markAutoplayFlag(this.app, true, 1); // was: !0
      dispatchSeek(this.app, videoId, startSeconds, suggestedQuality, 1);
    }
  }

  getCurrentTime(playerType, option1, option2) { // was: Q, c, W
    const opts = jR3(playerType, option1, option2);
    const type = opts.playerType; // was: c
    const state = this.getPlayerState(type); // was: W
    if (this.app.getAppState() === 2 && state === 5) {
      return this.app.getVideoData()?.startSeconds || 0;
    }
    if (this.X("web_player_max_seekable_on_ended") && state === 0) {
      return getClippedDuration(this.app, type);
    }
    return this.app.getCurrentTime(opts);
  }

  PA() {
    return this.app.getCurrentTime({ playerType: 1 });
  }

  JJ() {
    const ingestionTime = this.app.Kk(1); // was: Q
    return isNaN(ingestionTime)
      ? this.getCurrentTime({ playerType: 1 })
      : ingestionTime;
  }

  XI() {
    return this.app.getDuration({ playerType: 1 });
  }

  LayoutIdExitedTrigger(volume, fromUser) { // was: Q, c
    volume = clamp(Math.floor(volume), 0, 100);
    if (isFinite(volume)) {
      applyVolume(this.app, { volume, muted: this.isMuted() }, fromUser);
    }
  }

  unwrapTrustedResourceUrl(volume) { // was: Q
    this.LayoutIdExitedTrigger(volume, false); // was: !1
  }

  bO(fromUser) { // was: Q
    applyVolume(this.app, { muted: true, volume: this.getVolume() }, fromUser); // was: !0
  }

  mainVideoEntityActionMetadataKey() { this.bO(false); } // was: !1

  getEffectiveBandwidth(fromUser) { // was: Q
    applyVolume(this.app, { muted: false, volume: Math.max(5, this.getVolume()) }, fromUser); // was: !1
  }

  yf() {
    if (!isMutedAutoplay(this.app)) this.getEffectiveBandwidth(false); // was: !1
  }

  getPlayerMode() {
    const mode = {}; // was: Q
    if (this.app.getVideoData().validateSlotTriggers) {
      mode.pfp = {
        enableIma: this.app.a$().allowImaMonetization,
        autoplay: isDetailOrShortsAutoplay(this.app.a$()),
        mutedAutoplay: this.app.a$().mutedAutoplay,
      };
    }
    return mode;
  }

  X4() {
    const playerType = this.app.getPresentingPlayerType(); // was: Q
    if (playerType === 2 && !this.app.wX()) {
      const adModule = getAdModule(this.app.CO()); // was: c
      if (!(qR0(adModule) || (isEmbedWithAudio(this.app.G()) && this.app.oe().getPlayerState().W(1024))) || N_(adModule)) return;
    }
    const tryAsync = this.app.stepGenerator().DEFAULT_STORE_EXPIRATION_TOKEN; // was: c
    tryAsync ? tryAsync.playVideo() : this.app.playVideo(playerType);
  }

  EXP_748402147() {
    markAutoplayFlag(this.app, true, 1); // was: !0
    this.X4();
  }

  pauseVideo(reason) { // was: Q
    const playerType = this.app.getPresentingPlayerType(); // was: c
    if (playerType !== 2 || this.app.wX() || qR0(getAdModule(this.app.CO()))) {
      const tryAsync = this.app.stepGenerator().DEFAULT_STORE_EXPIRATION_TOKEN; // was: W
      tryAsync ? tryAsync.pauseVideo() : this.app.pauseVideo(playerType, reason);
    }
  }

  xi() {
    const app = this.app; // was: Q
    let pageTransitioned = false; // was: c -> !1
    if (app.FI.sC) {
      app.ge.publish("pageTransition");
      pageTransitioned = true; // was: !0
    }
    app.stopVideo(pageTransitioned);
  }

  clearVideo() {}

  getAvailablePlaybackRates() {
    const config = this.app.G(); // was: Q
    if (config.enableSpeedOptions) {
      const trustedOrigins = [
        "https://admin.youtube.com",
        "https://viacon.corp.google.com",
        "https://yurt.corp.google.com",
      ];
      if (trustedOrigins.includes(config.j ? config.ancestorOrigins[0] : window.location.origin) || config.iN) {
        return EXTENDED_PLAYBACK_RATES;
      }
      const vd = this.app.getVideoData(); // was: Q
      const minRate = vd.dispatchLayoutEvent; // was: c
      const maxRate = vd.hg; // was: W
      return PREMIUM_PLAYBACK_RATES.filter((rate) => rate >= minRate && rate <= maxRate); // was: m
    }
    return [1];
  }

  getPlaybackQuality(playerType) { // was: Q
    return this.app.uX({ playerType }).getPlaybackQuality();
  }

  vj() {}

  getAvailableQualityLevels(playerType) { // was: Q
    const player = this.app.uX({ playerType }); // was: Q
    let levels = map(player.getSelectableVideoFormats, (fmt) => fmt.quality); // was: c
    if (levels.length) {
      if (levels[0] === "auto") levels.shift();
      levels = levels.concat(["auto"]);
    }
    return levels;
  }

  Ka() { return this.getAvailableQualityLevels(1); }
  isInAdPlayback() { return this.j(); }
  readRepeatedMessageField() { return 1; }

  getVideoLoadedFraction(playerType) { // was: Q
    return this.app.getVideoLoadedFraction(playerType);
  }

  j() { return this.getVideoLoadedFraction(); }
  MQ() { return 0; }

  getSize() {
    const size = this.app.bX().getPlayerSize(); // was: Q
    return { width: size.width, height: size.height };
  }

  setSize() { this.app.bX().resize(); }

  loadVideoById(videoId, startSeconds, quality, playerType) { // was: Q, c, W, m
    if (!videoId) return false; // was: !1
    const vars = normalizeVideoParams(videoId, startSeconds, quality); // was: Q
    return this.app.loadVideoByPlayerVars(vars, playerType);
  }

  applyQualityConstraint(videoId, startSeconds, quality) { // was: Q, c, W
    const loaded = this.loadVideoById(videoId, startSeconds, quality, 1); // was: Q
    markAutoplayFlag(this.app, loaded, 1);
  }

  cueVideoById(videoId, startSeconds, quality, playerType) { // was: Q, c, W, m
    const vars = normalizeVideoParams(videoId, startSeconds, quality);
    this.app.cueVideoByPlayerVars(vars, playerType);
  }

  S(videoId, startSeconds, quality) { this.cueVideoById(videoId, startSeconds, quality, 1); } // was: Q, c, W

  loadVideoByUrl(url, startSeconds, quality, playerType) { // was: Q, c, W, m
    const vars = normalizeMediaContentUrl(url, startSeconds, quality);
    return this.app.loadVideoByPlayerVars(vars, playerType);
  }

  SLOT_MESSAGE_MARKER(url, startSeconds, quality) { // was: Q, c, W
    const loaded = this.loadVideoByUrl(url, startSeconds, quality, 1);
    markAutoplayFlag(this.app, loaded, 1);
  }

  cueVideoByUrl(url, startSeconds, quality, playerType) { // was: Q, c, W, m
    const vars = normalizeMediaContentUrl(url, startSeconds, quality);
    this.app.cueVideoByPlayerVars(vars, playerType);
  }

  T2(url, startSeconds, quality) { this.cueVideoByUrl(url, startSeconds, quality, 1); }

  getVolume() { return this.app.nw.volume; }
  isMuted() { return this.app.nw.muted; }
  destroy() { this.app.dispose(); }

  logImaAdEvent(eventType, breakType) { // was: Q, c
    const config = this.app.G(); // was: W
    if (this.app.a$().allowImaMonetization) {
      const payload = { // was: Q
        adSource: "EMBEDS_AD_SOURCE_IMA",
        breakType,
        embedUrl: getOrigin(this.app.G().loaderUrl),
        eventType,
        youtubeHost: getDomain(this.app.G().kq) || "",
      };
      payload.embeddedPlayerMode = config.Ie;
      logGelEvent("embedsAdEvent", payload);
    }
  }

  mutedAutoplay(mode) { // was: Q
    const config = this.app.G(); // was: c
    if (config.getWebPlayerContextConfig()?.embedsHostFlags?.allowMutedAutoplayDurationMode?.length &&
        !config.A) {
      this.app.mutedAutoplay(mode);
    }
  }

  preloadVideoById(videoId, startSeconds, quality, playerType) { // was: Q, c, W, m
    if (this.app.G().getWebPlayerContextConfig()?.embedsHostFlags?.allowPreloadVideoById && videoId) {
      const vars = normalizeVideoParams(videoId, startSeconds, quality);
      this.app.preloadVideoByPlayerVars(vars, playerType);
    }
  }

  dA(videoId, startSeconds, quality) { this.preloadVideoById(videoId, startSeconds, quality, 1); }

  setFauxFullscreen(enabled) { // was: Q
    isFullscreenEnabled();
    this.app.Z0(enabled ? 2 : 0);
  }

  tQ(enabled) { // was: Q
    if (this.app.G().getWebPlayerContextConfig()?.embedsHostFlags?.allowSetFauxFullscreen) {
      this.setFauxFullscreen(enabled);
    }
  }

  setCenterCrop(enabled) { // was: Q
    if (this.app.G().getWebPlayerContextConfig()?.embedsHostFlags?.allowSetCenterCrop) {
      this.app.bX().setCenterCrop(enabled);
    }
  }

  wakeUpControls() {
    const controls = g.ip(this); // was: Q
    if (controls) controls.aM();
  }
}

// ---------------------------------------------------------------------------
// Embed-type allowlist (line 85596)
// ---------------------------------------------------------------------------

/**
 * List of valid embed player-style identifiers.
 * [was: fFX]
 */
export const ValidEmbedStyles = "driveweb flix flix_from_driveweb hovercard projector texmex wshbp".split(" ");

// ---------------------------------------------------------------------------
// Internal (non-embed) API surface (lines 85597–85931)
// ---------------------------------------------------------------------------

/**
 * Extended internal API that adds module loading, seeking, option-setting, etc.
 * [was: On7]
 */
export class InternalApi extends EmbedApi { // was: On7 extends gq3
  wireEvent(event, callback) { this.state.j.subscribe(event, callback); } // was: Q, c
  G9(event, callback) { this.state.j.unsubscribe(event, callback); } // was: Q, c

  cueVideoByPlayerVars(vars, playerType) { this.app.cueVideoByPlayerVars(vars, playerType); } // was: Q, c
  GC(vars, playerType = 1) { this.cueVideoByPlayerVars(Fq(this, vars), playerType); }

  loadVideoByPlayerVars(vars, playerType, opt1, opt2, opt3) { // was: Q, c, W, m, K
    this.app.loadVideoByPlayerVars(vars, opt1, playerType, opt2, opt3);
  }
  VP(vars, playerType, opt1 = 1, opt2) { this.loadVideoByPlayerVars(Fq(this, vars), playerType, opt1, opt2); }

  preloadVideoByPlayerVars(vars, playerType, startTime = NaN, param1 = "", param2 = "") { // was: Q, c, W, m, K
    this.app.preloadVideoByPlayerVars(vars, playerType, startTime, param1, param2);
  }
  uR(vars, playerType = 1, startTime, param1) { this.preloadVideoByPlayerVars(Fq(this, vars), playerType, startTime, param1); }

  seekBy(amount, opt1, opt2, opt3, opt4) { // was: Q, c, W, m, K
    if (So(this)) dispatchSeek(this.app, this.app.getCurrentTime() + amount, opt1, opt2, opt4, opt3);
  }

  seekTo(time, opt1, opt2, opt3, opt4) { // was: Q, c, W, m, K
    if (So(this)) dispatchSeek(this.app, time, opt1, opt2, opt3, opt4);
  }

  getDuration(playerType, option) { return this.app.getDuration(jR3(playerType, option)); } // was: Q, c

  isFullscreen() { return this.app.isFullscreen(); }

  toggleFullscreen() {
    const onError = (err) => reportWarning(err); // was: Q, W
    const config = this.app.G(); // was: c
    if (config.externalFullscreen) {
      if (!isWebEmbeddedPlayer(config)) {
        return this.isFullscreen() ? exitFullscreen(window.document.documentElement) : requestFullscreen(window.document.documentElement).catch(onError);
      }
    } else if (isFullscreenEnabled() || config.J) {
      if (this.isFullscreen()) return exitFullscreen(getFullscreenElement());
      if (config.controlsType !== "3" && isFullscreenEnabled()) return requestFullscreen(this.app.bX().element).catch(onError);
      const media = this.app.Yx().Ae(); // was: c
      return media ? requestFullscreen(media).catch(onError) : Promise.reject(Error("Media element missing"));
    }
    publishEventAll(this, "onFullscreenToggled", this.isFullscreen());
    return Promise.resolve(undefined); // was: void 0
  }

  getProgressState(playerType) { // was: Q
    if (this.A() === 3) return getRemoteModule(this.app.CO()).getProgressState();
    const videoData = this.app.getVideoData(); // was: c
    const player = this.app.uX({ playerType }); // was: W
    const type = player.getPlayerType(); // was: m

    // Compute airing start from progressBarStartPosition
    let airingStart = 0; // was: K
    const startPos = this.app.getVideoData().progressBarStartPosition;
    if (startPos?.utcTimeMillis) {
      const sendPostRequest = Number(startPos.utcTimeMillis) / 1e3;
      if (!isNaN(sendPostRequest)) airingStart = this.bj(sendPostRequest, playerType);
    }

    // Compute airing end from progressBarEndPosition
    let airingEnd = 0; // was: T
    const endPos = this.app.getVideoData().progressBarEndPosition;
    if (endPos?.utcTimeMillis) {
      const sendPostRequest = Number(endPos.utcTimeMillis) / 1e3;
      if (!isNaN(sendPostRequest)) airingEnd = this.bj(sendPostRequest, playerType);
    }

    const current = this.getCurrentTime({ playerType }); // was: r
    const duration = this.getDuration({ playerType }); // was: Q (reused)
    const ingestionTime = this.app.Kk(type); // was: U
    const isAtLiveHead = this.app.isAtLiveHead(type); // was: I
    const loaded = this.app.getMediaElementTime; // was: X
    let playerInstance = this.app.uX({ playerType: type }); // was: A, e
    playerInstance = pt(this.app, playerInstance);
    const seekableStart = adjustDaiDuration(this.app, playerInstance.getSeekableStart, playerInstance); // was: A
    const seekableEnd = getClippedDuration(this.app, type); // was: e
    const offset = player.getStreamTimeOffsetNQ; // was: W
    const viewerJoinTime = this.app.getVideoData().UB; // was: V
    const joinMediaTime = !viewerJoinTime || isNaN(viewerJoinTime) ? 0 : this.bj(viewerJoinTime, type); // was: m

    return {
      airingStart,
      airingEnd,
      allowSeeking: this.app.getCountdownDuration(),
      clipEnd: videoData.clipEnd,
      clipStart: videoData.clipStart,
      current,
      displayedStart: -1,
      duration,
      ingestionTime,
      isAtLiveHead,
      loaded,
      seekableStart,
      seekableEnd,
      offset,
      viewerLivestreamJoinMediaTime: joinMediaTime,
    };
  }

  /**
   * Convert a UTC timestamp to media time.
   * [was: bj]
   */
  bj(utcSeconds, playerType) { // was: Q, c
    const ingestionTime = this.app.Kk(playerType); // was: W
    if (!ingestionTime) return 0;
    const delta = ingestionTime - this.app.getCurrentTime({ playerType }); // was: c
    return utcSeconds - delta;
  }
}

// ---------------------------------------------------------------------------
// Allowlists for player-var forwarding (lines 85930–85931)
// ---------------------------------------------------------------------------

/**
 * Internal player-var keys forwarded during video load.
 * [was: OMn]
 */
export const InternalPlayerVarKeys =
  "BASE_URL BASE_YT_URL adformat adaptive_fmts allow_embed audio_only authuser autoplay cc_load_policy cpn dash dashmpd disable_native_context_menu disablekb docid el enable_faster_speeds enablecastapi end eventid external_fullscreen fmt_list hl hlsdvr hlsvp iurl iurlhq iurlmq length_seconds live_playback osig override_hl partnerid pause_at_start pipable player_response playsinline plid post_live_playback postid ps public qoe_cat raw_player_response rel show_loop_video_toggle start startSeconds status suggestedQuality timestamp title token ttsurl use_native_controls url_encoded_fmt_stream_map video_id videoId".split(" ");

/**
 * Embed-safe player-var keys forwarded to iframes.
 * [was: vi0]
 */
export const EmbedPlayerVarKeys =
  "adformat allow_embed authuser autohide autonav autoplay c cbr cbrver cc_load_policy controls cos cosver cr csi_page_type cver cyc dash dashmpd disablekb el enablecastapi enablecsi end external_fullscreen external_list fs hl host_language innertube_api_key innertube_api_version innertube_context_client_version iurl iurlhq iurlmq iv_load_policy jsapicallback length_seconds live_playback live_storyboard_spec loaderUrl osig override_hl pageid partnerid pipable player_params player_wide playsinline plid postid profile_picture ps rel show_miniplayer_button showinfo showwatchlater start startSeconds status storyboard_spec suggestedQuality timestamp title tkn token transparent_background ucid url_encoded_fmt_stream_map use_miniplayer_ui use_native_controls videoId video_id vss_host watermark".split(" ");

// ---------------------------------------------------------------------------
// Error-code to playability-status mapping (lines 85932–85949)
// ---------------------------------------------------------------------------

/**
 * Map of error sub-codes to playability status codes.
 * [was: aF7]
 */
export const ErrorCodeMap = {
  ["api.invalidparam"]: 2,
  auth: 150,
  ["drm.auth"]: 150,
  ["heartbeat.net"]: 150,
  ["heartbeat.servererror"]: 150,
  ["heartbeat.stop"]: 150,
  ["html5.unsupportedads"]: 5,
  ["fmt.noneavailable"]: 5,
  ["fmt.decode"]: 5,
  ["fmt.unplayable"]: 5,
  ["html5.missingapi"]: 5,
  ["html5.unsupportedlive"]: 5,
  ["drm.unavailable"]: 5,
  ["mrm.blocked"]: 151,
  ["embedder.identity.denied"]: 152,
  ["embedder.identity.missing.referrer"]: 153,
};

// ---------------------------------------------------------------------------
// Full player API (g.HL) — partial (lines 85950–85969)
// ---------------------------------------------------------------------------

/**
 * The top-level player API class used by first-party pages.
 * Extends InternalApi with bandwidth estimation, issue reporting, etc.
 * [was: g.HL]
 */
export class PlayerApi extends InternalApi { // was: g.HL extends On7
  isExternalMethodAvailable(methodName, origin) { // was: Q, c
    return this.state.K[methodName]
      ? true // was: !0
      : !!(this.state.D[methodName] && origin && testUrlPattern(origin, Ai0));
  }

  getBandwidthEstimate() {
    return computeBandwidthEstimate(this.app.Qp);
  }

  reportPlaybackIssue(description = "") { // was: Q
    const player = this.app.oe(); // was: c
    const details = { gpu: (0, getWebGLRenderer)(), d: description }; // was: Q
    player.handleError(new PlayerError("feedback", details));
  }

  getInternalApi() {
    return { ...this.state.W };
  }
}
