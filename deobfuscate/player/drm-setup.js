import { setMenuItemLabel } from '../ads/ad-click-tracking.js';
import { dispose } from '../ads/dai-cue-range.js';
import { isLitePlaybackLimit } from '../core/composition-helpers.js';
import { registerDisposable } from '../core/event-system.js';
import { getLiteMode } from '../data/device-context.js';
import { PlayerApi } from '../data/device-tail.js';
import { FadeAnimationController } from './component-events.js';
import { getPlayerState } from './playback-bridge.js';
import { cueVideoByPlayerVars, loadVideoByPlayerVars, mute, setVolume, unMute } from './player-api.js';
import { cancelPlayback, nextVideo, playVideo, playVideoAt, previousVideo, seekBy } from './player-events.js';
import { getCurrentTime, getDuration, getPlaybackRate, getPlayerSize, setPlaybackRate } from './time-tracking.js';
import { registerInternalApi } from '../ads/ad-click-tracking.js'; // was: $ln
import { registerLeaderMethod } from '../ads/ad-click-tracking.js'; // was: n8
import { registerPublicApi } from '../ads/ad-click-tracking.js'; // was: wTw
import { startVideoPlayback } from './player-events.js'; // was: SF
import { generateUUID } from '../modules/remote/mdx-client.js'; // was: nx
import { INCOMPLETE_CHUNK } from '../modules/remote/cast-session.js'; // was: Cx
import { parseKeyValueString } from '../data/idb-transactions.js'; // was: Le
import { uint32UnsignedReader } from '../proto/message-setup.js'; // was: Jj
import { getDebugInfo } from './time-tracking.js'; // was: I1()
import { CssTransitionAnimation } from '../core/bitstream-helpers.js'; // was: NI
import { listenOnce } from '../core/composition-helpers.js'; // was: E7
import { resetBufferPosition } from '../modules/caption/caption-internals.js'; // was: Er
import { isMutedAutoplay } from './playback-state.js'; // was: yS
import { timedInvoke } from '../core/event-registration.js'; // was: pO
import { fillChapterProgress } from '../ui/seek-bar-tail.js'; // was: Dl
import { getPipAwareDocument } from '../ads/ad-click-tracking.js'; // was: Pt
import { closePopupMenu } from '../ads/ad-click-tracking.js'; // was: Coy
import { hasCaptionTracks } from '../ui/seek-bar-tail.js'; // was: OC
import { getAudioTrack } from './player-api.js';
import { ContainerComponent } from './container-component.js';
import { EventHandler } from '../core/event-handler.js';
// TODO: resolve g.ip
// TODO: resolve g.pl

/**
 * DRM adapter setup, audio settings initialization, player API registration.
 * Source: base.js lines 86540–87001, 87032, 87526–87718
 * (Skipping 87002–87031 and 87033–87525 — already covered)
 *
 * Contains:
 * - Extended player API (g.N0) — registers all public API methods on the player
 * - DRM adapter state (vq7) — holds mediaKeys, certificate, license request
 * - Popup base class (MY) — floating popup with show/hide/focus
 * - LinkedAccountPopup (a3O) — account linking popup dialog
 * - Menu item (g.oo) — base class for settings menu items
 * - Menu priority enum (g.iN) — numeric priority for each settings menu category
 *
 * [was: g.N0, vq7, MY, a3O, g.oo, g.iN]
 */

// ---------------------------------------------------------------------------
// Extended Player API [was: g.N0]
// Registers all external API methods via n8() for public access
// ---------------------------------------------------------------------------
export class ExtendedPlayerApi extends PlayerApi {
  constructor(element, config) { // was: Q, c
    super(element, config);
    registerInternalApi(this);

    // Register all public API methods
    const apiMethods = [
      ["addEventListener", "m_"], ["removeEventListener", "G9"],
      ["cueVideoByPlayerVars", "GC"], ["loadVideoByPlayerVars", "VP"],
      ["preloadVideoByPlayerVars", "uR"], ["loadVideoById", "tV"],
      ["loadVideoByUrl", "T6"], ["playVideo", "X4"],
      ["loadPlaylist", "loadPlaylist"], ["nextVideo", "nextVideo"],
      ["previousVideo", "previousVideo"], ["playVideoAt", "playVideoAt"],
      ["getVideoData", "n0"], ["seekBy", "Ej"], ["seekTo", "tZ"],
      ["showControls", "showControls"], ["hideControls", "hideControls"],
      ["cancelPlayback", "cancelPlayback"], ["getProgressState", "getProgressState"],
      ["isInline", "isInline"], ["setInline", "setInline"],
      ["setLoopVideo", "setLoopVideo"], ["getLoopVideo", "getLoopVideo"],
      ["getVideoContentRect", "getVideoContentRect"],
      ["getVideoStats", "n6"], ["getCurrentTime", "s_"],
      ["getDuration", "ZA"], ["getPlayerState", "Bg"],
      ["getVideoLoadedFraction", "Ve"], ["mute", "bO"], ["unMute", "Ib"],
      ["setVolume", "Lz"], ["loadModule", "loadModule"],
      ["unloadModule", "unloadModule"], ["getOption", "N0"],
      ["getOptions", "getOptions"], ["setOption", "setOption"],
      ["addCueRange", "addCueRange"], ["getDebugText", "getDebugText"],
      ["getStoryboardFormat", "getStoryboardFormat"],
      ["toggleFullscreen", "toggleFullscreen"], ["isFullscreen", "isFullscreen"],
      ["getPlayerSize", "getPlayerSize"], ["toggleSubtitles", "toggleSubtitles"],
      ["setCenterCrop", "setCenterCrop"], ["setFauxFullscreen", "setFauxFullscreen"],
      ["setSizeStyle", "setSizeStyle"],
      ["handleGlobalKeyDown", "handleGlobalKeyDown"],
      ["handleGlobalKeyUp", "handleGlobalKeyUp"],
    ];
    for (const [publicName, internalName] of apiMethods) {
      registerLeaderMethod(this, publicName, this[internalName] || this[publicName]);
    }
    registerPublicApi(this);
  }

  // --- Delegate methods to this.app ---

  startVideoPlayback(a, b, c, d, e, f, g_) { return this.app.startVideoPlayback(a, b, c, d, e, f, g_); }
  Rv() { return this.app.Rv(); }
  CO() { return this.app.CO(); }

  generateUUID() {
    const endscreen = this.CO().INCOMPLETE_CHUNK.get("endscreen");
    return !!endscreen && endscreen.generateUUID();
  }

  getRootNode() { return this.bX().element; }
  G() { return this.app.G(); }
  ej() { return this.app.parseKeyValueString(); }
  uint32UnsignedReader(data) { return this.app.uint32UnsignedReader(data); }

  lU() { return g.ip(this)?.lU() || null; }

  getSourceConfigForActiveAudioTrack() {
    const sourceConfigs = this.getVideoData()?.Q7();
    if (sourceConfigs) {
      const activeTrackId = this.getAudioTrack().getLanguageInfo().getId();
      for (const config of sourceConfigs) {
        for (const track of config.audioTracks ?? []) {
          if (track.id === activeTrackId) return config;
        }
      }
    }
  }

  getDebugInfo { return this.app.oe().getDebugInfo; }
  getStartTime(playerType) { return this.app.uX(playerType).getStartTime(); }
  getPlayerStateObject(playerType) { return this.app.getPlayerStateObject(playerType); }
  bX() { return this.app.bX(); }
  getPlaylist() { return this.app.getPlaylist(); }

  getVideoData(options = {}) {
    const videoData = this.app.uX(options).getVideoData();
    if (options.wj === false) return videoData;
    if (videoData.enableServerStitchedDai && options.playerType === 2) {
      const app = this.app;
      return app.CssTransitionAnimation ? app.fk.W?.getVideoData() || app.getVideoData() : app.getVideoData();
    }
    return videoData;
  }

  // Seekability check [was: VY]
  canSeek() {
    const config = this.G();
    if (config.jG || config.disableSeek) return false;
    const player = this.app.oe();
    const vd = player.getVideoData();
    if (!vd.Xq() || g.pl(vd) ||
        (this.getPresentingPlayerType() === 2 && !this.app.wX() && !vd.isSeekable) ||
        (vd.listenOnce() && this.getPresentingPlayerType(true) === 2) ||
        (player.KB() && this.getPresentingPlayerType() !== 3)) return false;
    const quality = getLiteMode(config);
    if (isLitePlaybackLimit(quality) && !vd.resetBufferPosition || isMutedAutoplay(this.app)) return false;
    return true;
  }

  getPresentingPlayerType(isLifa) { return this.app.getPresentingPlayerType(isLifa); }
  getPlaybackRate() { return this.app.timedInvoke().getPlaybackRate(); }
  setPlaybackRate(rate, source) { this.app.setPlaybackRate(rate, source); }
}

// ---------------------------------------------------------------------------
// DRM Adapter State [was: vq7]
// Holds references to mediaKeys, certificate, license requests
// ---------------------------------------------------------------------------
export class DrmAdapterState {
  constructor() {
    this.certificate = null;
    this.W = null;          // key session wrapper
    this.mediaKeys = null;
    this.licenseRequest = null;
    this.isDisposed = false; // was: this.O = !1
  }

  dispose() {
    this.certificate = null;
    this.W?.dispose();
    this.licenseRequest = this.W = null;
    this.mediaKeys?.dispose();
    this.mediaKeys = null;
    this.isDisposed = true; // was: this.O = !0
  }

  u0() { return this.isDisposed; }
}

// ---------------------------------------------------------------------------
// Popup Base Class [was: MY]
// Floating popup overlay with fade animation, focus trapping
// ---------------------------------------------------------------------------
export class PopupBase extends ContainerComponent {
  constructor(api, template, fadeSpeed, autoClose = false) { // was: Q, c, W, m
    super(template);
    this.U = api;
    this.MM = autoClose;
    this.K = new EventHandler(this);
    this.fade = new FadeAnimationController(this, fadeSpeed, true, undefined, undefined, () => { this.Y(); });
    registerDisposable(this, this.K);
    registerDisposable(this, this.fade);
  }

  show() {
    const wasVisible = this.fillChapterProgress();
    super.show();
    if (this.MM) {
      this.K.B(window, "blur", this.HB);
      this.K.B(getPipAwareDocument(this), "click", this.Ie);
    }
    if (!wasVisible) this.publish("show", true);
  }

  hide() {
    const wasVisible = this.fillChapterProgress();
    super.hide();
    closePopupMenu(this);
    if (wasVisible) this.publish("show", false);
  }

  Bw(sourceElement, shouldTrack) {
    this.sourceElement = sourceElement;
    this.fade.show();
    if (shouldTrack) {
      if (!this.D) this.D = this.K.B(this.U, "appresize", this.L);
      this.L();
    } else if (this.D) {
      this.K.Xd(this.D);
      this.D = undefined;
    }
  }

  Y() {
    if (this.sourceElement && this.element) {
      this.sourceElement.getAttribute("aria-haspopup");
      this.sourceElement.setAttribute("aria-expanded", "true");
      this.focus();
    }
  }

  HB() {
    const wasVisible = this.fillChapterProgress();
    closePopupMenu(this);
    this.fade.hide();
    if (wasVisible) this.publish("show", false);
  }

  fillChapterProgress() { return this.hasCaptionTracks && this.fade.state !== 4; }
}

// ---------------------------------------------------------------------------
// Menu Item Base [was: g.oo]
// Base component for settings menu items with priority ordering
// ---------------------------------------------------------------------------
export class MenuItem extends ContainerComponent {
  constructor(template, priority, initialData, content) {
    super(template);
    this.priority = priority;
    if (initialData) setMenuItemLabel(this, initialData);
    if (content) this.setContent(content);
  }

  setIcon(icon) { this.updateValue("icon", icon); }

  updateValue(key, value) {
    super.updateValue(key, value);
    this.publish("size-change");
  }
}

// ---------------------------------------------------------------------------
// Settings Menu Priority Enum [was: g.iN]
// Numeric priority constants for settings menu item ordering
// ---------------------------------------------------------------------------
export const MENU_ITEM_PRIORITY = {
  LOOP: 18,           // was: eU
  STABLE_VOLUME: 17,  // was: tO
  VOICE_BOOST: 16,    // was: E4
  REMOTE_SELECT: 15,  // was: g0I
  SIZE: 14,           // was: a1G
  MINIPLAYER: 13,     // was: IB
  THREED: 12,         // was: Df
  AUTONAV: 11,        // was: PU
  CINEMATIC: 10,      // was: Dm
  ANNOTATIONS: 9,     // was: jd
  AUDIO: 8,
  SUBTITLES: 7,
  SLEEP_TIMER: 6,
  SPEED: 5,           // was: Fv
  AUDIO_SETTINGS: 4,  // was: xF
  QUALITY: 3,         // was: Cl
  LINKED_ACCOUNT: 2,  // was: Ze
  REMOTE: 1,
  CONTEXT_MENU: 0,    // was: aD

  // Reverse lookup
  18: "LOOP", 17: "STABLE_VOLUME", 16: "VOICE_BOOST", 15: "REMOTE_SELECT",
  14: "SIZE", 13: "MINIPLAYER", 12: "THREED", 11: "AUTONAV",
  10: "CINEMATIC", 9: "ANNOTATIONS", 8: "AUDIO", 7: "SUBTITLES",
  6: "SLEEP_TIMER", 5: "SPEED", 4: "AUDIO_SETTINGS", 3: "QUALITY",
  2: "LINKEDACCOUNT", 1: "REMOTE", 0: "CONTEXTMENU",
};
