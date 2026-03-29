/**
 * Remote Module -- Main cast/remote playback module
 *
 * Source: player_es6.vflset/en_US/remote.js, lines 6692-6918
 *
 * The main remote module class registered via g.GN("remote", ...).
 * Manages remote casting lifecycle: receiver discovery, session establishment,
 * connection/disconnection, and presenting player state delegation.
 *
 * Also includes the RemoteModuleApi (wx9) lines 6519-6561 and
 * top-level remote orchestration functions (IAi, iJ, rdZ, etc.) lines 2797-3001.
 */

import { RemotePlayerProxy } from './remote-player.js';                // was: d1W
import { RemoteConnection } from './remote-player.js';                 // was: xq
import { QueueManager } from './remote-player.js';                     // was: Lvo
import { CastController } from './cast-controls.js';                   // was: EG
import { RemoteDisplayStatus } from './cast-controls.js';              // was: jOH
import { CastDevicePicker } from './cast-controls.js';                 // was: gFS
import { PrivacyPopupDialog } from './cast-controls.js';               // was: bG0
import { RemoteModuleApi } from './cast-controls.js';                  // was: wx9
import {
import { ScreenService } from './mdx-client.js'; // was: m$
import { isWebEmbeddedPlayer } from '../../data/performance-profiling.js'; // was: g.sQ
import { isWebExact } from '../../data/performance-profiling.js'; // was: g.rT
import { PlayerStateChange } from '../../player/component-events.js'; // was: g.tS
import { CastSession } from './cast-controls.js'; // was: yl
import { isWebRemix } from '../../data/performance-profiling.js'; // was: g.uL
import { createVideoDataForPlaylistItem } from '../../player/video-loader.js'; // was: g.fY
import { jsonSerialize } from '../../core/event-registration.js'; // was: g.bS
import { isWebUnplugged } from '../../data/performance-profiling.js'; // was: g.X7
import { insertAtLayer } from '../../ads/ad-click-tracking.js'; // was: g.f8
import { isEmbedded } from '../../data/performance-profiling.js'; // was: g.eh
import { getEstimatedTime } from './remote-player.js'; // was: b$
import { deleteDatabase } from '../../data/idb-transactions.js'; // was: WF
import { disposeApp } from '../../player/player-events.js'; // was: WA
import { pubsubUnsubscribe } from '../../data/gel-core.js'; // was: g.cm
import { publishEventWithTransport } from '../../ads/ad-click-tracking.js'; // was: g.tV
import { getWallClockTime } from '../../player/time-tracking.js'; // was: Kk()
import { getMediaElementTime } from '../../player/time-tracking.js'; // was: A6()
import { getSeekableStart } from '../../player/time-tracking.js'; // was: v4()
import { getCountdownDuration } from '../endscreen/autoplay-countdown.js'; // was: VY
import { storageGet } from '../../core/attestation.js'; // was: g.UM
import { toString } from '../../core/string-utils.js';
import { RemotePlayerState, getElapsedPlayTime, getSeekableEnd } from './remote-player.js';
import { getAppState, getAdState } from '../../player/player-api.js';
import { getCurrentTime, getDuration, isAtLiveHead } from '../../player/time-tracking.js';
import { getLocationOverride, setConnectData, isApiReady, getCastInstance, isConnectionActive, getCurrentScreenId, getConnection, initializeRemote, getConnectData, getOnlineScreens, isCastInstalled, getActiveReceiver, requestCastSelector } from './mdx-client.js';
import { pauseVideo, cancelPlayback, nextVideo, playVideo } from '../../player/player-events.js';
import { PlayerModule } from '../../player/account-linking.js';
import { PlayerState } from '../../media/codec-tables.js';
import { listen } from '../../core/composition-helpers.js';
import { clear, concat } from '../../core/array-utils.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { getPlayerConfig } from '../../core/attestation.js';
import { registerModule } from '../../player/module-registry.js';
  getScreenService,
  getConnection,
  setConnection,
  getCurrentScreenId,
  setCurrentScreenId,
  getConnectData,
  setConnectData,
  getOnlineScreens,
  isCastInstalled,
  getCastReceiverName,
  clearCurrentReceiver,
  requestCastSelector,
  isApiReady,
  getCastInstance,
  isConnectionActive,
  initializeRemote,
  resumeOrStartConnection,
} from './mdx-client.js';

// ---------------------------------------------------------------------------
// generateUUID [was: nx] (lines 265-270)
// ---------------------------------------------------------------------------

/**
 * Generate a v4 UUID string.
 * [was: nx]
 */
function generateUUID() { // was: nx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
    const rand = Math.random() * 16 | 0;
    return (ch === 'x' ? rand : rand & 3 | 8).toString(16);
  });
}

// ---------------------------------------------------------------------------
// getRemotePlayerState [was: f1] (lines 2503-2505)
// ---------------------------------------------------------------------------

/**
 * Get a RemotePlayerState snapshot from the remote proxy.
 * [was: f1]
 * @param {RemotePlayerProxy} proxy [was: Q]
 * @returns {RemotePlayerState}
 */
function getRemotePlayerState(proxy) { // was: f1
  return new RemotePlayerState(proxy.getPlayerContextData()); // was: new sG(Q.j.getPlayerContextData())
}

// ---------------------------------------------------------------------------
// isProxyConnected [was: vH] (lines 2506-2508)
// ---------------------------------------------------------------------------

/**
 * Check whether the proxy is in connected state (state === 1).
 * [was: vH]
 */
function isProxyConnected(proxy) { // was: vH
  return proxy.getState() === 1;
}

// ---------------------------------------------------------------------------
// shouldShowPrivacyDisclosure [was: D1m] (lines 3080-3083)
// ---------------------------------------------------------------------------

/**
 * Whether the privacy disclosure popup should show before casting.
 * [was: D1m]
 */
function shouldShowPrivacyDisclosure(module) { // was: D1m
  const config = module.player.G();
  return !config.X('mdx_enable_privacy_disclosure_ui') || module.isLoggedIn() || module.privacyConfirmed || !module.privacyPopup
    ? false
    : isWebExact(config) || isWebEmbeddedPlayer(config);  (isEmbeddedPlayer) and g.sQ (isMiniPlayer)
}

// ---------------------------------------------------------------------------
// updatePresentingState [was: tX4] (lines 3084-3087)
// ---------------------------------------------------------------------------

/**
 * Publish a presenting-player state change on the module's player.
 * [was: tX4]
 */
function updatePresentingState(module, oldState, newState) { // was: tX4
  module.presentingState = newState; // was: Q.GU = W
  module.player.publish('presentingplayerstatechange', new PlayerStateChange(newState, oldState));  -> PlayerStateChange constructor
}

// ---------------------------------------------------------------------------
// forwardControlToRemote [was: Ha] (lines 3088-3090)
// ---------------------------------------------------------------------------

/**
 * Forward a control command to the remote queue manager.
 * [was: Ha]
 */
function forwardControlToRemote(module, command, ...args) { // was: Ha
  module.loaded && module.queueManager.handleCommand(command, ...args); // was: Q.loaded && Q.c5.jZ(c, ...W)
}

// ---------------------------------------------------------------------------
// removePlayerStateListener [was: Nv] (lines 3091-3094)
// ---------------------------------------------------------------------------

/**
 * Remove the presenting-player state change listener if active.
 * [was: Nv]
 */
function removePlayerStateListener(module) { // was: Nv
  if (module.stateChangeListener) { // was: Q.G4
    module.player.removeEventListener('presentingplayerstatechange', module.stateChangeListener);
    module.stateChangeListener = null;
  }
}

// ---------------------------------------------------------------------------
// handleReceiverSelection [was: iJ] (lines 3095-3149)
// ---------------------------------------------------------------------------

/**
 * Handle the user selecting a receiver (device) to cast to.
 * Routes to cast-selector flow, reconnects, or starts a new connection.
 * [was: iJ]
 */
function handleReceiverSelection(module, receiver) { // was: iJ
  if (receiver.key === module.localReceiver.key) return;

  if (receiver.key === module.disconnectReceiver.key) {
    stopCastSession(); // was: I3()
    return;
  }

  if (shouldShowPrivacyDisclosure(module)) {
    pauseAndShowPrivacy(module); // was: HGm
  }

  module.currentReceiver = receiver; // was: Q.qp = c

  if (isWebRemix(module.player.G())) return;  -> isAudioOnly(config)

  // Build connect data from current video state
  const playlistId = module.player.getPlaylistId();
  let videoData = module.player.getVideoData({ playerType: 1 });
  const videoId = videoData.videoId;

  if ((!playlistId && !videoId) ||
      ((module.player.getAppState() === 2 || module.player.getAppState() === 1) &&
       module.player.G().X('should_clear_video_data_on_player_cued_unstarted'))) {
    videoData = null;
  } else {
    const playlist = module.player.getPlaylist();
    let videoIds;
    if (playlist) {
      videoIds = [];
      for (let i = 0; i < playlist.length; i++) {
        videoIds[i] = createVideoDataForPlaylistItem(playlist, i).videoId;  -> getVideoDataAtIndex(playlist, i)
      }
    } else {
      videoIds = [videoId];
    }
    const currentTime = module.player.getCurrentTime(1);
    const connectPayload = {
      videoIds,
      listId: playlistId,
      videoId,
      playerParams: videoData.playerParams,
      clickTrackingParams: videoData.S,
      index: Math.max(module.player.getPlaylistIndex(), 0),
      currentTime: currentTime === 0 ? undefined : currentTime,
    };
    const locationInfo = getLocationOverride(videoData); // was: gNZ
    if (locationInfo) connectPayload.locationInfo = locationInfo;
    videoData = connectPayload;
  }

  logRemote('Connecting to: ' + jsonSerialize(receiver));  -> jsonStringify(value)

  if (receiver.key === 'cast-selector-receiver') {
    setConnectData(videoData || null); // was: Wa
    const launchParams = videoData || null;
    if (isApiReady()) {
      getCastInstance().setLaunchParams(launchParams);
    }
  } else if (!videoData && isConnectionActive() && getCurrentScreenId() === receiver.key) {
    publish('yt-remote-connection-change', true); // was: Zn
  } else {
    stopCastSession(); // was: I3
    setConnectData(videoData || null);
    const allScreens = getScreenService().M4();
    const screen = findScreenByKey(allScreens, receiver.key); // was: te
    if (screen) startConnection(screen, 1); // was: X9
  }
}

// ---------------------------------------------------------------------------
// pauseAndShowPrivacy [was: HGm] (lines 3141-3150)
// ---------------------------------------------------------------------------

/**
 * Pause the local player and show the privacy disclosure popup.
 * [was: HGm]
 */
function pauseAndShowPrivacy(module) { // was: HGm
  if (module.player.getPlayerStateObject().isPlaying()) {
    module.player.pauseVideo();
  } else {
    module.stateChangeListener = (event) => {
      if (!module.privacyConfirmed && event.Fq(8)) {
        module.player.pauseVideo();
        removePlayerStateListener(module);
      }
    };
    module.player.addEventListener('presentingplayerstatechange', module.stateChangeListener);
  }
  if (module.privacyPopup) module.privacyPopup.Bw();
  if (!getConnection()) {
    Ba = true; // was: Ba = !0 -- global flag for deferred connection
  }
}

// ---------------------------------------------------------------------------
// Remote Module class [was: anonymous class at g.GN("remote", ...)] (lines 6692-6915)
// ---------------------------------------------------------------------------

/**
 * Remote/casting player module.
 * Registered as "remote" via g.GN. Manages cast receiver list,
 * session lifecycle, and delegates playback to remote devices.
 *
 * [was: anonymous class in g.GN("remote", class extends g.zj { ... })]
 */
class RemoteModule extends PlayerModule { // was: g.zj
  /**
   * @param {Object} player [was: Q]
   */
  constructor(player) { // was: constructor(Q)
    super(player);

    /**
     * Local "This computer" receiver entry.
     * [was: this.Hp]
     * @type {{ key: string, name: string }}
     */
    this.localReceiver = { // was: this.Hp
      key: generateUUID(),
      name: 'This computer',
    };

    /**
     * Queue manager bridging remote proxy to local player.
     * [was: this.c5]
     * @type {QueueManager|null}
     */
    this.queueManager = null; // was: this.c5

    /**
     * Event subscription keys for cleanup.
     * [was: this.subscriptions]
     * @type {Array}
     */
    this.subscriptions = [];

    /**
     * Remote player proxy (d1W / RemotePlayerProxy).
     * [was: this.fX]
     * @type {RemotePlayerProxy|null}
     */
    this.remoteProxy = null; // was: this.fX

    /**
     * Saved remote player state for reconnection.
     * [was: this.Hv]
     * @type {RemotePlayerState|null}
     */
    this.savedRemoteState = null; // was: this.Hv

    /**
     * List of available receivers (local + remote devices).
     * [was: this.Bk]
     * @type {Array<{ key: string, name: string }>}
     */
    this.receivers = [this.localReceiver]; // was: this.Bk

    /**
     * Currently selected receiver.
     * [was: this.qp]
     * @type {{ key: string, name: string }}
     */
    this.currentReceiver = this.localReceiver; // was: this.qp

    /**
     * Current presenting player state.
     * [was: this.GU]
     * @type {PlayerState}
     */
    this.presentingState = new PlayerState(64); // was: new g.In(64) -- IDLE

    /**
     * Current playback time for remote player.
     * [was: this.LJ]
     * @type {number}
     */
    this.currentTime = 0; // was: this.LJ

    /**
     * Current ad state (-1 = none, 0 = post-ad, 1 = in-ad).
     * [was: this.Aj]
     * @type {number}
     */
    this.adState = -1; // was: this.Aj

    /**
     * Whether privacy disclosure was confirmed by user.
     * [was: this.Nd]
     * @type {boolean}
     */
    this.privacyConfirmed = false; // was: this.Nd

    /**
     * Presenting-player state change listener reference.
     * [was: this.G4]
     * @type {Function|null}
     */
    this.stateChangeListener = null; // was: this.G4

    /**
     * Privacy popup dialog widget.
     * [was: this.Uc]
     * @type {PrivacyPopupDialog|null}
     */
    this.privacyPopup = null; // was: this.Uc

    /**
     * Remote module API overlay for player.
     * [was: this.BI]
     * @type {RemoteModuleApi|null}
     */
    this.remoteApi = null; // was: this.BI

    // Create UI elements if not audio-only or mini-player
    if (!isWebUnplugged(this.player.G()) && !isWebRemix(this.player.G())) {  -> isLitePlayer, g.uL -> isAudioOnly
      const api = this.player;
      const controlsRoot = g.ip(api);  -> getControlsRoot(api)
      if (controlsRoot) {
        const menuButton = controlsRoot.lU();
        if (menuButton) {
          const picker = new CastDevicePicker(api, menuButton); // was: gFS
          ownDisposable(this, picker);
        }
      }

      const displayStatus = new RemoteDisplayStatus(api); // was: jOH
      ownDisposable(this, displayStatus);
      insertAtLayer(api, displayStatus.element, 4);  -> insertAtDomLevel(api, element, level)

      this.privacyPopup = new PrivacyPopupDialog(); // was: bG0
      ownDisposable(this, this.privacyPopup);
      insertAtLayer(api, this.privacyPopup.element, 4);

      // Check if resuming an existing session
      this.privacyConfirmed = !!mf(); // was: !!mf() -- checks for active session screen
    }
  }

  /**
   * Initialize remote module: set up MDX, register event subscriptions.
   * [was: create]
   */
  create() {
    const config = this.player.G();
    const appConfig = isEmbedded(config);  -> getAppConfig(playerConfig)

    const mdxConfig = {
      device: 'Desktop',
      app: 'youtube-desktop',
      loadCastApiSetupScript: config.X('mdx_load_cast_api_bootstrap_script'),
      enableDialLoungeToken: config.X('enable_dial_short_lived_lounge_token'),
      enableCastLoungeToken: config.X('enable_cast_short_lived_lounge_token'),
    };

    initializeRemote(appConfig, mdxConfig); // was: IAi

    this.subscriptions.push(listen('yt-remote-before-disconnect', this.onBeforeDisconnect, this));
    this.subscriptions.push(listen('yt-remote-connection-change', this.onConnectionChange, this));
    this.subscriptions.push(listen('yt-remote-receiver-availability-change', this.onReceiverAvailabilityChange, this));
    this.subscriptions.push(listen('yt-remote-auto-connect', this.onAutoConnect, this));
    this.subscriptions.push(listen('yt-remote-receiver-resumed', this.onReceiverResumed, this));
    this.subscriptions.push(listen('mdx-privacy-popup-confirm', this.onPrivacyConfirm, this));
    this.subscriptions.push(listen('mdx-privacy-popup-cancel', this.onPrivacyCancel, this));

    this.onReceiverAvailabilityChange(); // was: this.G6()
  }

  /**
   * Load the remote module -- switch player to remote presenting mode.
   * [was: load]
   */
  load() {
    this.player.cancelPlayback();
    super.load();

    this.remoteApi = new RemoteModuleApi(this.player.G(), this); // was: wx9
    this.player.uf(this.remoteApi);

    this.queueManager = new QueueManager(this, this.player, this.remoteProxy); // was: Lvo

    let startTime = getConnectData() ? getConnectData().currentTime : 0; // was: BCS
    const proxy = isConnectionActive() ? new RemotePlayerProxy() : null; // was: d1W
    if (startTime === 0 && proxy) {
      startTime = getEstimatedTime(getRemotePlayerState(proxy)); // was: b$(f1(c))
    }
    if (startTime !== 0) this.kx(startTime);

    updatePresentingState(this, this.presentingState, this.presentingState);
    this.player.Eu(6);
  }

  /**
   * Unload the remote module -- revert to local playback.
   * [was: unload]
   */
  unload() {
    this.player.publish('mdxautoplaycanceled');
    this.player.deleteDatabase();
    this.currentReceiver = this.localReceiver; // was: this.qp = this.Hp

    clear(this.queueManager, this.remoteProxy); // was: g.xE(this.c5, this.fX)
    this.remoteProxy = null;   // was: this.fX = null
    this.remoteApi = null;     // was: this.BI = null
    this.queueManager = null;  // was: this.c5 = null

    super.unload();
    this.player.Eu(5);
    removePlayerStateListener(this);
  }

  /** [was: WA] */
  disposeApp() {
    pubsubUnsubscribe(this.subscriptions);  -> disposeAll(subscriptions)
    super.disposeApp();
  }

  /** Get ad playback state. [was: getAdState] */
  getAdState() {
    return this.adState;
  }

  /** Whether the remote queue has a previous item. [was: hasPrevious] */
  hasPrevious() {
    return this.remoteProxy ? getRemotePlayerState(this.remoteProxy).hasPrevious : false;
  }

  /** Whether the remote queue has a next item. [was: hasNext] */
  hasNext() {
    return this.remoteProxy ? getRemotePlayerState(this.remoteProxy).hasNext : false;
  }

  /**
   * Update current playback time and publish progress events.
   * [was: kx]
   * @param {number} time [was: Q]
   * @param {number} [duration] [was: c]
   */
  kx(time, duration) {
    this.currentTime = time || 0;
    this.player.publish('progresssync', time, duration);
    publishEventWithTransport(this.player, 'onVideoProgress', time || 0);  -> triggerEvent(player, eventName, ...args)
  }

  /** @returns {number} [was: getCurrentTime] */
  getCurrentTime() {
    return this.currentTime;
  }

  /** @returns {number} [was: getDuration] */
  getDuration() {
    return getRemotePlayerState(this.remoteProxy).getDuration() || 0;
  }

  /** Live ingestion time. [was: Kk] */
  getWallClockTime {
    const state = getRemotePlayerState(this.remoteProxy);
    return state.isLive ? state.liveIngestionTime + getElapsedPlayTime(state) : state.liveIngestionTime; // was: Q.j ? Q.W + L1(Q) : Q.W
  }

  /** Loaded time. [was: A6] */
  getMediaElementTime {
    return getRemotePlayerState(this.remoteProxy).loadedTime;
  }

  /** Seekable end time. [was: qE] */
  qE() {
    return getSeekableEnd(getRemotePlayerState(this.remoteProxy)); // was: aaD
  }

  /** Seekable start time. [was: v4] */
  getSeekableStart {
    const state = getRemotePlayerState(this.remoteProxy);
    return state.seekableStart > 0
      ? state.seekableStart + getElapsedPlayTime(state)
      : state.seekableStart;
  }

  /**
   * Build a progress state object for the UI.
   * [was: getProgressState]
   */
  getProgressState() {
    const state = getRemotePlayerState(this.remoteProxy);
    const videoData = this.player.getVideoData();
    return {
      airingStart: 0,
      airingEnd: 0,
      allowSeeking: state.playerState !== 1081 && this.player.getCountdownDuration(),
      clipEnd: videoData.clipEnd,
      clipStart: videoData.clipStart,
      current: this.getCurrentTime(),
      displayedStart: -1,
      duration: this.getDuration(),
      ingestionTime: this.getWallClockTime,
      isAtLiveHead: this.isAtLiveHead(),
      loaded: this.getMediaElementTime,
      seekableEnd: this.qE(),
      seekableStart: this.getSeekableStart,
      offset: 0,
      viewerLivestreamJoinMediaTime: 0,
    };
  }

  /** Whether playback is at the live edge. [was: isAtLiveHead] */
  isAtLiveHead() {
    return getSeekableEnd(getRemotePlayerState(this.remoteProxy)) - this.getCurrentTime() <= 1;
  }

  /** Skip to next video in remote queue. [was: nextVideo] */
  nextVideo() {
    if (this.remoteProxy) this.remoteProxy.nextVideo();
  }

  /** Go to previous video in remote queue. [was: Ye] */
  Ye() {
    if (this.remoteProxy) this.remoteProxy.Ye();
  }

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  /**
   * Called before the remote connection is about to disconnect.
   * Saves current remote state for potential reconnection.
   * [was: hP]
   */
  onBeforeDisconnect(reason) { // was: hP
    if (reason === 1) {
      this.savedRemoteState = this.remoteProxy ? getRemotePlayerState(this.remoteProxy) : null; // was: this.Hv
    }
  }

  /**
   * Called when remote connection state changes.
   * Creates or destroys the remote player proxy accordingly.
   * [was: lm]
   */
  onConnectionChange() { // was: lm
    const proxy = isConnectionActive() ? new RemotePlayerProxy() : null; // was: eA() ? new d1W : null
    if (proxy) {
      const prevReceiver = this.currentReceiver;
      if (this.loaded) this.unload();
      this.remoteProxy = proxy;       // was: this.fX = Q
      this.savedRemoteState = null;   // was: this.Hv = null
      if (prevReceiver.key !== this.localReceiver.key) {
        this.currentReceiver = prevReceiver;
        this.load();
      }
    } else {
      dispose(this.remoteProxy);      // was: g.BN(this.fX)
      this.remoteProxy = null;
      if (this.loaded) {
        this.unload();
        const saved = this.savedRemoteState;
        if (saved && saved.videoId === this.player.getVideoData().videoId) {
          this.player.cueVideoById(saved.videoId, getEstimatedTime(saved));
        }
      }
    }
    this.player.publish('videodatachange', 'newdata', this.player.getVideoData(), 3);
  }

  /**
   * Called when receiver availability changes. Rebuilds the receiver list.
   * [was: G6]
   */
  onReceiverAvailabilityChange() { // was: G6
    let list = [this.localReceiver];
    const screens = getOnlineScreens(); // was: Xxm
    if (isCastInstalled() && storageGet('yt-remote-cast-available')) {
      screens.push({ key: 'cast-selector-receiver', name: 'Cast...' });
    }
    this.receivers = list.concat(screens);

    const activeReceiver = getActiveReceiver() || this.localReceiver; // was: r6() || this.Hp
    handleReceiverSelection(this, activeReceiver);
    publishEventWithTransport(this.player, 'onMdxReceiversChange');  -> triggerEvent(player, eventName)
  }

  /**
   * Auto-connect to a receiver (e.g., resumed session).
   * [was: JW]
   */
  onAutoConnect() { // was: JW
    const receiver = getActiveReceiver(); // was: r6
    handleReceiverSelection(this, receiver);
  }

  /**
   * Receiver was resumed from a previous session.
   * [was: Hh]
   */
  onReceiverResumed() { // was: Hh
    this.currentReceiver = getActiveReceiver(); // was: r6()
  }

  /**
   * User confirmed the privacy popup -- proceed with casting.
   * [was: Xj]
   */
  onPrivacyConfirm() { // was: Xj
    this.privacyConfirmed = true;
    removePlayerStateListener(this);
    Ba = false;
    if (Uk) startConnection(Uk, 1); // was: X9(Uk, 1)
    Uk = null;
  }

  /**
   * User cancelled the privacy popup -- revert to local playback.
   * [was: Dy]
   */
  onPrivacyCancel() { // was: Dy
    this.privacyConfirmed = false;
    removePlayerStateListener(this);
    handleReceiverSelection(this, this.localReceiver);
    this.currentReceiver = this.localReceiver;
    Ba = false;
    Uk = null;
    this.player.playVideo();
  }

  /**
   * Option getter/setter for the remote module.
   * Handles "casting", "receivers", "currentReceiver", "quickCast".
   * [was: aI]
   */
  aI(option, value) { // was: aI
    switch (option) {
      case 'casting':
        return this.loaded;
      case 'receivers':
        return this.receivers;
      case 'currentReceiver':
        if (value) {
          if (value.key === 'cast-selector-receiver') {
            requestCastSelector(); // was: F2
          } else {
            handleReceiverSelection(this, value);
          }
        }
        return this.loaded ? this.currentReceiver : this.localReceiver;
      case 'quickCast':
        if (this.receivers.length === 2 && this.receivers[1].key === 'cast-selector-receiver') {
          if (value) requestCastSelector();
          return true;
        }
        return false;
    }
  }

  /** Send debug command to remote device. [was: Sz] */
  Sz() {
    this.remoteProxy.Sz();
  }

  /** Whether remote module supports certain features. [was: GS] */
  GS() {
    return false;
  }

  /** List of configurable options. [was: getOptions] */
  getOptions() {
    return ['casting', 'receivers', 'currentReceiver', 'quickCast'];
  }

  /**
   * Whether the user is logged in (for privacy disclosure logic).
   * [was: isLoggedIn]
   */
  isLoggedIn() {
    return getPlayerConfig('PLAYER_CONFIG')?.args?.authuser !== undefined
      ? true
      : !(!getPlayerConfig('SESSION_INDEX') && !getPlayerConfig('LOGGED_IN'));
  }
}

// ---------------------------------------------------------------------------
// Module registration
// ---------------------------------------------------------------------------

registerModule('remote', RemoteModule); // was: g.GN("remote", class extends g.zj { ... })

export { RemoteModule };
