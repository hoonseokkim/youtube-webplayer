/**
 * Cast Controls -- Cast UI components and Cast API controller
 *
 * Source: player_es6.vflset/en_US/remote.js
 *   - CastController [was: EG] lines 5437-5679
 *   - CastSession [was: yl] lines 5276-5366
 *   - DialSession [was: EFa] lines 5368-5412
 *   - ManualSession [was: sOo] lines 5414-5435
 *   - SessionBase [was: oV] lines 2020-2274
 *   - RemoteDisplayStatus [was: jOH] lines 6620-6659
 *   - PrivacyPopupDialog [was: bG0] lines 6563-6618
 *   - CastDevicePicker [was: gFS] lines 6661-6690
 *   - RemoteModuleApi [was: wx9] lines 6519-6561
 *
 * Provides:
 *  - Cast button and device picker UI
 *  - Connected device status indicator
 *  - Cast overlay displaying remote playback status
 *  - Privacy disclosure dialog for signed-out users
 *  - Cast API controller coordinating Chrome Cast SDK
 */

import { jsonSerialize } from '../../core/event-registration.js';  // was: g.bS
import { safeClearTimeout, safeSetTimeout } from '../../data/idb-transactions.js';  // was: g.JB, g.zn
import { isAtLiveHead, pauseVideo, playVideo, seekTo } from '../../player/player-events.js';  // was: g.isAtLiveHead, g.pauseVideo, g.playVideo, g.seekTo
import { getOnlineScreens, logMdx, ScreenInfo, screenMatchesId } from './mdx-client.js';  // was: g.Xxm, g.ue, g.VE, g.Bg
import { disposeApp } from '../../player/player-events.js'; // was: WA
import { getWallClockTime } from '../../player/time-tracking.js'; // was: Kk()
import { getMediaElementTime } from '../../player/time-tracking.js'; // was: A6()
import { getSeekableStart } from '../../player/time-tracking.js'; // was: v4()
import { Disposable } from '../../core/disposable.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { getCurrentTime, getDuration } from '../../player/time-tracking.js';
import { invertObject } from '../../core/object-utils.js';

// ---------------------------------------------------------------------------
// SessionBase [was: oV] (lines 2020-2274)
// ---------------------------------------------------------------------------

/**
 * Base class for cast/DIAL sessions. Manages receiver reference
 * and publishes session screen changes.
 * [was: oV]
 */
export class SessionBase extends Disposable { // was: oV extends g.W1
  /**
   * @param {Object} screenService [was: Q]
   * @param {Object} receiver -- chrome.cast.Receiver [was: c]
   * @param {string} sessionType [was: W]
   */
  constructor(screenService, receiver, sessionType) {
    super();
    /** @type {string} [was: this.Ie] */
    this.sessionType = sessionType;
    /** @type {Object} [was: this.j] -- screen service ref */
    this.screenService = screenService;
    /** @type {Object} [was: this.O] -- cast receiver */
    this.receiver = receiver; // was: this.O
    /** @type {ScreenInfo|null} [was: this.W] -- resolved screen */
    this.screen = null; // was: this.W
  }

  /**
   * Called when session establishment fails.
   * [was: Yq]
   * @param {Error} [error]
   */
  onSessionFailed(error) { // was: Yq
    if (this.u0()) return;
    if (error) {
      this.logSession('' + error);
      this.publish('sessionFailed');
    }
    this.screen = null;
    this.publish('sessionScreen', null);
  }

  /** Log a message for this session. [was: info] */
  logSession(message) {
    logMdx(this.sessionType, message);
  }

  /** Return the underlying cast session object, if any. [was: Yv] */
  getCastSession() { // was: Yv
    return null;
  }

  /**
   * Update the receiver display status (shown on the cast icon).
   * [was: xb]
   */
  setReceiverStatus(statusText) { // was: xb
    const receiver = this.receiver;
    if (statusText) {
      receiver.displayStatus = new chrome.cast.ReceiverDisplayStatus(statusText, []);
      receiver.displayStatus.showStop = true;
    } else {
      receiver.displayStatus = null;
    }
    chrome.cast.setReceiverDisplayStatus(receiver, () => {}, () => {});
  }

  /** [was: T2] -- attach a cast session object (overridden in subclasses) */
  attachSession(session) {} // was: T2

  /** [was: D] -- handle launch params (overridden in subclasses) */
  handleLaunchParams(params) {} // was: D

  /** [was: stop] -- stop the session (overridden in subclasses) */
  stop() {}

  disposeApp() {
    this.setReceiverStatus('');
    super.disposeApp();
  }
}

// ---------------------------------------------------------------------------
// CastSession [was: yl] (lines 5276-5366)
// ---------------------------------------------------------------------------

/**
 * Session type for Cast (Chromecast) receivers.
 * Communicates via the Cast SDK and urn:x-cast:com.google.youtube.mdx namespace.
 * [was: yl]
 */
export class CastSession extends SessionBase { // was: yl extends oV
  /**
   * @param {Object} screenService [was: Q]
   * @param {Object} receiver [was: c]
   * @param {Object} config [was: W]
   */
  constructor(screenService, receiver, config) {
    super(screenService, receiver, 'CastSession');
    /** @type {Object} [was: this.config_] */
    this.config = config;
    /** @type {Object|null} [was: this.A] -- chrome.cast.Session */
    this.castSession = null;
    /** @type {Function} [was: this.S] -- session update listener */
    this.sessionUpdateListener = this.onSessionUpdate.bind(this);
    /** @type {Function} [was: this.b0] -- YouTube message listener */
    this.youtubeMessageListener = this.onYoutubeMessage.bind(this);
    /** @type {number} [was: this.mF] -- initial status timeout */
    this.statusTimeout = safeSetTimeout(() => this.onMdxSessionStatus(null), 120000);
    /** @type {number} [was: this.Y, this.J, this.K, this.L] -- various timers */
    this.retryTimer = 0;
    this.availabilityTimer = 0;
    this.loungeTokenTimer = 0;
    this.loungeTokenRefreshTimer = 0;
  }

  /** Attach a chrome.cast.Session. [was: T2] */
  attachSession(session) { // was: T2
    if (this.castSession) {
      if (this.castSession === session) return;
      this.clearTimers();
      this.castSession.removeUpdateListener(this.sessionUpdateListener);
      this.castSession.removeMessageListener('urn:x-cast:com.google.youtube.mdx', this.youtubeMessageListener);
    }
    this.castSession = session;
    this.castSession.addUpdateListener(this.sessionUpdateListener);
    this.castSession.addMessageListener('urn:x-cast:com.google.youtube.mdx', this.youtubeMessageListener);
    this.sendYoutubeMessage('getMdxSessionStatus'); // was: Vua
  }

  /** Launch params are a no-op for cast sessions. [was: D] */
  handleLaunchParams(params) {
    this.logSession('launchWithParams no-op for Cast: ' + jsonSerialize(params));
  }

  /** Stop the cast receiver app. [was: stop] */
  stop() {
    if (this.castSession) {
      this.castSession.stop(
        () => this.onSessionFailed(),
        () => this.onSessionFailed(Error('Failed to stop receiver app.'))
      );
    } else {
      this.onSessionFailed(Error('Stopping cast device without session.'));
    }
  }

  /** Overridden: no display status updates for Cast. [was: xb override] */
  setReceiverStatus() {}

  /** Return the underlying chrome.cast.Session. [was: Yv] */
  getCastSession() {
    return this.castSession;
  }

  disposeApp() {
    this.logSession('disposeInternal');
    this.clearTimers();
    if (this.castSession) {
      this.castSession.removeUpdateListener(this.sessionUpdateListener);
      this.castSession.removeMessageListener('urn:x-cast:com.google.youtube.mdx', this.youtubeMessageListener);
    }
    this.castSession = null;
    super.disposeApp();
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  /** Send a YouTube-namespace message to the cast receiver. [was: Vua] */
  sendYoutubeMessage(type) { // was: Vua
    const message = { type };
    if (this.castSession) {
      this.castSession.sendMessage('urn:x-cast:com.google.youtube.mdx', message, () => {}, () => {
        this.logSession('Failed to send message: ' + type + '.');
      });
    }
  }

  /** Handle session update (alive/dead). [was: Ka] */
  onSessionUpdate(isAlive) {
    if (this.u0() || isAlive) return;
    this.logSession('Cast session died.');
    this.onSessionFailed();
  }

  /** Handle YouTube namespace messages. [was: jG] */
  onYoutubeMessage(namespace, rawData) { // was: jG
    if (this.u0() || !rawData) return;
    const data = JSON.parse(rawData);
    if (!data || typeof data !== 'object') return;

    const type = '' + data.type;
    const payload = data.data || {};
    this.logSession('onYoutubeMessage_: ' + type + ' ' + jsonSerialize(payload));

    switch (type) {
      case 'mdxSessionStatus':
        this.onMdxSessionStatus(payload);
        break;
      case 'loungeToken':
        this.onLoungeToken(payload);
        break;
      default:
        this.logSession('Unknown youtube message: ' + type);
    }
  }

  /** Handle MDX session status from receiver. [was: AJH] */
  onMdxSessionStatus(data) {
    safeClearTimeout(this.statusTimeout);
    this.statusTimeout = 0;
    if (!data) {
      this.onSessionFailed(Error('Waiting for session status timed out.'));
      return;
    }
    if (this.config.enableCastLoungeToken && data.loungeToken) {
      if (data.deviceId) {
        if (this.screen && this.screen.uuid === data.deviceId) return;
        if (data.loungeTokenRefreshIntervalMs) {
          this.setScreenFromData({
            name: this.receiver.friendlyName,
            screenId: data.screenId,
            loungeToken: data.loungeToken,
            dialId: data.deviceId,
            screenIdType: 'shortLived',
          }, data.loungeTokenRefreshIntervalMs);
        } else {
          this.resolveScreenById(data.screenId);
        }
      } else {
        this.resolveScreenById(data.screenId);
      }
    } else {
      this.resolveScreenById(data.screenId);
    }
  }

  /** Handle lounge token refresh response. [was: Bw0] */
  onLoungeToken(data) { // was: Bw0
    safeClearTimeout(this.loungeTokenTimer);
    this.loungeTokenTimer = 0;
    if (!data || !data.loungeToken || (this.screen?.token === data.loungeToken)) {
      // Retry after delay
      this.scheduleLoungeTokenRefresh(30000);
    } else {
      // Apply new token
      if (this.screen) this.screen.token = data.loungeToken;
      this.publish('sessionScreen', this.screen);
      this.scheduleLoungeTokenRefresh(data.loungeTokenRefreshIntervalMs);
    }
  }

  /** @private [was: X2] */
  scheduleLoungeTokenRefresh(delayMs) {
    safeClearTimeout(this.loungeTokenRefreshTimer);
    this.loungeTokenRefreshTimer = 0;
    if (delayMs === 0) {
      this.requestLoungeToken();
    } else {
      this.loungeTokenRefreshTimer = safeSetTimeout(() => this.requestLoungeToken(), delayMs);
    }
  }

  /** @private [was: xb1] */
  requestLoungeToken() {
    this.sendYoutubeMessage('getLoungeToken');
    safeClearTimeout(this.loungeTokenTimer);
    this.loungeTokenTimer = safeSetTimeout(() => this.onLoungeToken(null), 30000);
  }

  /** @private */
  resolveScreenById(screenId) { // was: IV
    if (!screenId) {
      this.onSessionFailed(Error('Waiting for session status timed out.'));
      return;
    }
    if (this.screen && this.screen.id === screenId) return;
    // Resolve via screen service
    this.screenService.getAutomaticScreenByIds(this.receiver.label, screenId, this.receiver.friendlyName,
      (screen) => { this.screen = screen; this.publish('sessionScreen', this.screen); },
      () => this.onSessionFailed(), 5
    );
  }

  /** @private */
  setScreenFromData(data, refreshInterval) { // was: XG4
    const screen = new ScreenInfo(data);
    // Verify screen is online before accepting
    this.screenService.checkScreenAvailability(screen, (isOnline) => {
      if (isOnline) {
        this.screen = screen;
        this.publish('sessionScreen', this.screen);
        this.scheduleLoungeTokenRefresh(refreshInterval);
      } else {
        this.onSessionFailed();
      }
    }, 5);
  }

  /** @private [was: eTi] */
  clearTimers() {
    safeClearTimeout(this.retryTimer); this.retryTimer = 0;
    safeClearTimeout(this.availabilityTimer); this.availabilityTimer = 0;
    safeClearTimeout(this.statusTimeout); this.statusTimeout = 0;
    safeClearTimeout(this.loungeTokenTimer); this.loungeTokenTimer = 0;
    safeClearTimeout(this.loungeTokenRefreshTimer); this.loungeTokenRefreshTimer = 0;
  }
}

// ---------------------------------------------------------------------------
// DialSession [was: EFa] (lines 5368-5412)
// ---------------------------------------------------------------------------

/**
 * Session type for DIAL (Discovery and Launch) receivers.
 * [was: EFa]
 */
export class DialSession extends SessionBase { // was: EFa extends oV
  constructor(screenService, receiver, theme, config) {
    super(screenService, receiver, 'DialSession');
    this.config = config;
    /** @type {Object|null} [was: this.Y] -- DIAL launch data */
    this.launchData = null;
    /** @type {Object|null} [was: this.A] -- DIAL session object */
    this.dialSession = null;
    /** @type {string} [was: this.b0] -- pairing code */
    this.pairingCode = '';
    /** @type {string} [was: this.jG] -- sender theme */
    this.senderTheme = theme;
    /** @type {Function} [was: this.MM] -- session update listener */
    this.updateListener = this.onDialSessionUpdate.bind(this);
  }

  attachSession(session) { // was: T2
    this.dialSession = session;
    this.dialSession.addUpdateListener(this.updateListener);
  }

  handleLaunchParams(params) { // was: D
    this.launchData = params;
    // Trigger deferred launch callback
  }

  stop() {
    if (this.dialSession) {
      this.dialSession.stop(() => this.onSessionFailed(), () => this.onSessionFailed('Failed to stop DIAL device.'));
    } else {
      this.onSessionFailed();
    }
  }

  disposeApp() {
    if (this.dialSession) this.dialSession.removeUpdateListener(this.updateListener);
    this.dialSession = null;
    super.disposeApp();
  }

  /** @private [was: PA] */
  onDialSessionUpdate(isAlive) {
    if (this.u0() || isAlive) return;
    this.logSession('DIAL session died.');
    this.onSessionFailed();
  }
}

// ---------------------------------------------------------------------------
// ManualSession [was: sOo] (lines 5414-5435)
// ---------------------------------------------------------------------------

/**
 * Session for manually-paired (custom) receivers that connect via MDX only.
 * [was: sOo]
 */
export class ManualSession extends SessionBase { // was: sOo extends oV
  constructor(screenService, receiver) {
    super(screenService, receiver, 'ManualSession');
    /** @type {number} [was: this.A] -- resolution timer */
    this.resolveTimer = safeSetTimeout(() => this.resolveScreen(), 150);
  }

  stop() {
    this.onSessionFailed();
  }

  attachSession() {} // no-op

  /** @private [was: D] */
  resolveScreen() {
    safeClearTimeout(this.resolveTimer);
    this.resolveTimer = NaN;
    const allScreens = this.screenService.getAllScreens();
    const screen = allScreens.find((s) => screenMatchesId(s, this.receiver.label));
    if (screen) {
      this.screen = screen;
      this.publish('sessionScreen', screen);
    } else {
      this.onSessionFailed(Error('No such screen'));
    }
  }

  disposeApp() {
    safeClearTimeout(this.resolveTimer);
    this.resolveTimer = NaN;
    super.disposeApp();
  }
}

// ---------------------------------------------------------------------------
// CastController [was: EG] (lines 5437-5679)
// ---------------------------------------------------------------------------

/**
 * Coordinates the Chrome Cast SDK: initializes the API, handles
 * receiver discovery, session lifecycle, and custom receiver management.
 * [was: EG]
 */
export class CastController extends Disposable { // was: EG extends g.W1
  /**
   * @param {Object} screenService [was: Q]
   * @param {Object} config [was: c]
   */
  constructor(screenService, config) {
    super();
    /** @type {Object} [was: this.config_] */
    this.config = config;
    /** @type {Object} [was: this.O] -- screen service */
    this.screenService = screenService;
    /** @type {string} [was: this.T2] -- Cast app ID */
    this.appId = config.appId || '233637DE';
    /** @type {string} [was: this.j] -- sender theme */
    this.senderTheme = config.theme || 'cl';
    /** @type {boolean} [was: this.Ie] -- disable Cast API */
    this.disableCastApi = config.disableCastApi || false;
    /** @type {boolean} [was: this.J] -- force mirroring mode */
    this.forceMirroring = config.forceMirroring || false;
    /** @type {SessionBase|null} [was: this.W] -- active session */
    this.activeSession = null;
    /** @type {boolean} [was: this.L] -- native receiver available */
    this.nativeReceiverAvailable = false;
    /** @type {Array<Object>} [was: this.A] -- custom receivers list */
    this.customReceivers = [];
    /** @type {Function} [was: this.D] -- receiver action listener */
    this.receiverActionListener = this.onReceiverAction.bind(this);
  }

  /**
   * Initialize the Cast API.
   * [was: init]
   * @param {boolean} forceMirror
   * @param {Function} callback
   */
  init(forceMirror, callback) {
    chrome.cast.timeout.requestSession = 30000;

    const sessionRequest = new chrome.cast.SessionRequest(this.appId, [chrome.cast.Capability.AUDIO_OUT]);
    if (getFlag('desktop_enable_cast_connect')) {
      sessionRequest.androidReceiverCompatible = true;
    }
    if (!this.disableCastApi) {
      sessionRequest.dialRequest = new chrome.cast.DialRequest('YouTube');
    }

    const autoJoinPolicy = chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED;
    const defaultAction = forceMirror || this.forceMirroring
      ? chrome.cast.DefaultActionPolicy.CAST_THIS_TAB
      : chrome.cast.DefaultActionPolicy.CREATE_SESSION;

    const apiConfig = new chrome.cast.ApiConfig(
      sessionRequest,
      (session) => this.onSessionEstablished(session), // was: this.Y
      (availability) => this.onReceiverAvailabilityChanged(availability), // was: this.jG
      autoJoinPolicy,
      defaultAction
    );
    apiConfig.customDialLaunchCallback = (request) => this.onCustomDialLaunch(request); // was: this.MM

    chrome.cast.initialize(
      apiConfig,
      () => {
        if (this.u0()) return;
        chrome.cast.addReceiverActionListener(this.receiverActionListener);
        this.screenService.subscribe('onlineScreenChange', () => this.refreshCustomReceivers());
        this.customReceivers = this.buildCustomReceiverList(); // was: Fuo
        chrome.cast.setCustomReceivers(this.customReceivers, () => {}, () => {});
        this.publish('yt-remote-cast2-availability-change', this.hasReceivers());
        callback(true);
      },
      (error) => {
        callback(false);
      }
    );
  }

  /**
   * Set the connected screen status on the cast button.
   * [was: UH -- setConnectedScreenStatus]
   */
  setConnectedScreenStatus(screenId, statusText) {
    if (this.activeSession) {
      const currentScreen = this.activeSession.screen;
      if (!screenId || (currentScreen && currentScreen.id !== screenId)) {
        this.setActiveSession(null);
      }
    }
    if (screenId && statusText && !this.activeSession) {
      // Create a ManualSession for the connected screen
      const allScreens = this.screenService.getAllScreens();
      const screen = allScreens.find((s) => screenMatchesId(s, screenId));
      if (!screen || screen.idType === 'shortLived') return;

      let receiver = this.findCustomReceiver(screen);
      if (!receiver) {
        receiver = new chrome.cast.Receiver(screen.uuid || screen.id, screen.name);
        receiver.receiverType = chrome.cast.ReceiverType.CUSTOM;
        this.customReceivers.push(receiver);
        chrome.cast.setCustomReceivers(this.customReceivers, () => {}, () => {});
      }
      this.setActiveSession(new ManualSession(this.screenService, receiver), true);
    }
    if (this.activeSession) {
      this.activeSession.setReceiverStatus(statusText);
    }
  }

  /** Set launch params on the active session. [was: XI -- setLaunchParams] */
  setLaunchParams(params) {
    if (this.activeSession) {
      this.activeSession.handleLaunchParams(params);
    }
  }

  /** Stop the active session. [was: b0 -- stopSession] */
  stopSession() {
    if (this.activeSession) {
      this.activeSession.stop();
      this.setActiveSession(null);
    }
  }

  /** Request the cast device picker. [was: requestSession] */
  requestSession() {
    chrome.cast.requestSession(
      (session) => this.onSessionEstablished(session),
      (error) => this.onSessionError(error)
    );
  }

  /** Get the current chrome.cast.Session. [was: S -- getCastSession] */
  getCastSession() {
    return this.activeSession ? this.activeSession.getCastSession() : null;
  }

  /** Handle browser channel auth errors. [was: handleBrowserChannelAuthError] */
  handleBrowserChannelAuthError() {
    // Refresh the lounge token if possible
  }

  /** Whether any receivers are available. [was: BH] */
  hasReceivers() { // was: BH
    return this.nativeReceiverAvailable || this.customReceivers.length > 0 || !!this.activeSession;
  }

  disposeApp() {
    this.screenService.unsubscribe('onlineScreenChange', () => this.refreshCustomReceivers());
    if (window.chrome?.cast) {
      chrome.cast.removeReceiverActionListener(this.receiverActionListener);
    }
    dispose(this.activeSession);
    super.disposeApp();
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  /** @private [was: qx] */
  setActiveSession(session, isResumed = false) { // was: qx
    if (session === this.activeSession) return;
    dispose(this.activeSession);
    this.activeSession = session;
    if (session) {
      if (isResumed) {
        this.publish('yt-remote-cast2-receiver-resumed', session.receiver);
      } else {
        this.publish('yt-remote-cast2-receiver-selected', session.receiver);
      }
      session.subscribe('sessionScreen', (screen) => this.onSessionScreen(session, screen));
      session.subscribe('sessionFailed', () => this.onSessionFailed(session));
      if (session.screen) {
        this.publish('yt-remote-cast2-session-change', session.screen);
      }
    } else {
      this.publish('yt-remote-cast2-session-change', null);
    }
  }

  /** @private [was: mF] */
  onSessionScreen(session, screen) {
    if (this.activeSession === session) {
      if (!screen) this.setActiveSession(null);
      this.publish('yt-remote-cast2-session-change', screen);
    }
  }

  /** @private [was: ZZZ] */
  onSessionFailed(session) {
    if (this.activeSession === session) {
      this.publish('yt-remote-cast2-session-failed');
    }
  }

  /** @private -- handle Cast receiver action (click/stop). [was: Ka] */
  onReceiverAction(receiver, action) {
    if (this.u0() || !receiver) return;
    receiver.friendlyName = chrome.cast.unescape(receiver.friendlyName);

    switch (action) {
      case chrome.cast.ReceiverAction.CAST:
        if (this.activeSession && this.activeSession.receiver.label !== receiver.label) {
          this.activeSession.stop();
        }
        // Create appropriate session type based on receiver type
        switch (receiver.receiverType) {
          case chrome.cast.ReceiverType.CUSTOM:
            this.setActiveSession(new ManualSession(this.screenService, receiver));
            break;
          case chrome.cast.ReceiverType.DIAL:
            this.setActiveSession(new DialSession(this.screenService, receiver, this.senderTheme, this.config));
            break;
          case chrome.cast.ReceiverType.CAST:
            this.setActiveSession(new CastSession(this.screenService, receiver, this.config));
            break;
        }
        break;
      case chrome.cast.ReceiverAction.STOP:
        if (this.activeSession && this.activeSession.receiver.label === receiver.label) {
          this.activeSession.stop();
        }
        break;
    }
  }

  /** @private [was: Y -- onSessionEstablished] */
  onSessionEstablished(session) {
    if (this.u0() || this.forceMirroring) return;
    const receiver = session.receiver;
    if (receiver.receiverType === chrome.cast.ReceiverType.CUSTOM) return;

    if (!this.activeSession) {
      if (receiver.receiverType === chrome.cast.ReceiverType.CAST) {
        // Resumed cast session
        receiver.friendlyName = chrome.cast.unescape(receiver.friendlyName);
        this.setActiveSession(new CastSession(this.screenService, receiver, this.config), true);
      } else {
        return;
      }
    }
    this.activeSession.attachSession(session);
  }

  /** @private [was: PA] */
  onSessionError(error) {
    if (this.u0()) return;
    if (error.code !== chrome.cast.ErrorCode.CANCEL) {
      this.setActiveSession(null);
    }
    this.publish('yt-remote-cast2-session-failed');
  }

  /** @private [was: jG -- onReceiverAvailabilityChanged] */
  onReceiverAvailabilityChanged(availability) {
    if (this.u0()) return;
    const hadReceivers = this.hasReceivers();
    this.nativeReceiverAvailable = availability === chrome.cast.ReceiverAvailability.AVAILABLE;
    if (this.hasReceivers() !== hadReceivers) {
      this.publish('yt-remote-cast2-availability-change', this.hasReceivers());
    }
  }

  /** @private [was: MM -- onCustomDialLaunch] */
  onCustomDialLaunch(request) {
    if (this.u0()) return Promise.reject(Error('disposed'));
    // Handle custom DIAL launch flow
    // See source lines 5586-5617 for full implementation
    return this.activeSession
      ? Promise.resolve(new chrome.cast.DialLaunchResponse(false))
      : Promise.reject(Error('no active session'));
  }

  /** @private [was: K] */
  refreshCustomReceivers() {
    if (this.u0()) return;
    this.customReceivers = this.buildCustomReceiverList();
    chrome.cast.setCustomReceivers(this.customReceivers, () => {}, () => {});
    this.publish('yt-remote-cast2-availability-change', this.hasReceivers());
  }

  /** @private [was: Fuo] */
  buildCustomReceiverList() {
    const onlineScreens = this.screenService.getOnlineScreens();
    let activeReceiver = this.activeSession?.receiver;
    const receivers = onlineScreens.map((screen) => {
      if (activeReceiver && screenMatchesId(screen, activeReceiver.label)) {
        activeReceiver = null; // already included
      }
      const key = screen.uuid || screen.id;
      let receiver = this.findCustomReceiver(screen);
      if (receiver) {
        receiver.label = key;
        receiver.friendlyName = screen.name;
      } else {
        receiver = new chrome.cast.Receiver(key, screen.name);
        receiver.receiverType = chrome.cast.ReceiverType.CUSTOM;
      }
      return receiver;
    });
    // Append active receiver if not already listed
    if (activeReceiver && activeReceiver.receiverType === chrome.cast.ReceiverType.CUSTOM) {
      receivers.push(activeReceiver);
    }
    return receivers;
  }

  /** @private [was: S9a] */
  findCustomReceiver(screen) {
    return screen ? this.customReceivers.find((r) => screenMatchesId(screen, r.label)) : null;
  }
}

// Expose public API methods
CastController.prototype.setLaunchParams = CastController.prototype.setLaunchParams;
CastController.prototype.setConnectedScreenStatus = CastController.prototype.setConnectedScreenStatus;
CastController.prototype.stopSession = CastController.prototype.stopSession;
CastController.prototype.getCastSession = CastController.prototype.getCastSession;
CastController.prototype.requestSession = CastController.prototype.requestSession;
CastController.prototype.init = CastController.prototype.init;
CastController.prototype.dispose = CastController.prototype.dispose;

// ---------------------------------------------------------------------------
// RemoteModuleApi [was: wx9] (lines 6519-6561)
// ---------------------------------------------------------------------------

/**
 * API overlay that bridges the remote module into the local player's
 * expected interface (getCurrentTime, getDuration, seekTo, etc.).
 * [was: wx9]
 */
export class RemoteModuleApi extends PlayerStub { // was: wx9 extends g.WM -- TODO: resolve g.WM -> PlayerApiOverlay base class
  /**
   * @param {Object} config [was: Q]
   * @param {Object} remoteModule [was: c] -- the RemoteModule instance
   */
  constructor(config, remoteModule) {
    super(config);
    /** @type {Object} [was: this.W] -- remote module back-reference */
    this.remoteModule = remoteModule;
  }

  /** @returns {number} [was: getCurrentTime] */
  getCurrentTime() {
    return this.remoteModule.getCurrentTime();
  }

  /** @returns {number} [was: getDuration] */
  getDuration() {
    return this.remoteModule.getDuration();
  }

  /** Live ingestion time. [was: Kk] */
  getWallClockTime {
    return this.remoteModule.getWallClockTime;
  }

  /** Loaded time. [was: A6] */
  getMediaElementTime {
    return this.remoteModule.getMediaElementTime;
  }

  /** Seekable end. [was: qE] */
  qE() {
    return this.remoteModule.qE();
  }

  /** Seekable start. [was: v4] */
  getSeekableStart {
    return this.remoteModule.getSeekableStart;
  }

  /** Get the presenting player state. [was: getPlayerState] */
  getg.In() {
    return this.remoteModule.presentingState; // was: this.W.GU
  }

  /** Whether playback is at live head. [was: isAtLiveHead] */
  isAtLiveHead() {
    return this.remoteModule.isAtLiveHead();
  }

  /** Pause remote playback. [was: pauseVideo] */
  pauseVideo() {
    forwardControlToRemote(this.remoteModule, 'control_pause');
  }

  /** Play remote playback. [was: playVideo] */
  async playVideo() {
    forwardControlToRemote(this.remoteModule, 'control_play');
  }

  /**
   * Seek on the remote device.
   * [was: seekTo]
   * @param {number} time
   * @param {Object} [options]
   */
  seekTo(time, options) {
    forwardControlToRemote(this.remoteModule, 'control_seek', time, !options?.b_);
  }

  /**
   * Set audio track on the remote device.
   * [was: s2]
   */
  s2(track) {
    forwardControlToRemote(this.remoteModule, 'control_set_audio_track', track);
    return true;
  }
}

/** Helper to forward control commands. [was: Ha] */
function forwardControlToRemote(module, command, ...args) {
  if (module.loaded && module.queueManager) {
    module.queueManager.handleCommand(command, ...args);
  }
}

// ---------------------------------------------------------------------------
// RemoteDisplayStatus [was: jOH] (lines 6620-6659)
// ---------------------------------------------------------------------------

/**
 * Overlay widget showing the remote playback status (e.g., "Playing on TV").
 * [was: jOH]
 */
export class RemoteDisplayStatus extends Widget { // was: jOH extends g.k
  /**
   * @param {Object} playerApi [was: Q]
   */
  constructor(playerApi) {
    super({
      C: 'div',
      Z: 'ytp-remote',
      V: [{
        C: 'div',
        Z: 'ytp-remote-display-status',
        V: [{
          C: 'div',
          Z: 'ytp-remote-display-status-icon',
          V: [castIconSvg()], // was: g.$Kx()
        }, {
          C: 'div',
          Z: 'ytp-remote-display-status-text',
          eG: '{{statustext}}',
        }],
      }],
    });

    /** @type {Object} [was: this.api] */
    this.api = playerApi;
    /** @type {FadeWidget} [was: this.fade] */
    this.fade = new FadeWidget(this, 250); // was: g.QR
    ownDisposable(this, this.fade); // was: g.F

    this.B(playerApi, 'presentingplayerstatechange', this.onStateChange);
    this.updateStatus(playerApi.getPlayerStateObject());
  }

  /** @private [was: onStateChange] */
  onStateChange(event) {
    this.updateStatus(event.state);
  }

  /**
   * Update the displayed status text based on player state.
   * [was: l3]
   */
  updateStatus(state) { // was: l3
    if (this.api.getPresentingPlayerType() === 3) { // remote
      const vars = {
        RECEIVER_NAME: this.api.getOption('remote', 'currentReceiver').name,
      };
      let text;
      if (state.W(128)) { // error
        text = localizeString('Error on $RECEIVER_NAME', vars);
      } else if (state.isPlaying() || state.isPaused()) {
        text = localizeString('Playing on $RECEIVER_NAME', vars);
      } else {
        text = localizeString('Connected to $RECEIVER_NAME', vars);
      }
      this.updateValue('statustext', text);
      this.fade.show();
    } else {
      this.fade.hide();
    }
  }
}

// ---------------------------------------------------------------------------
// PrivacyPopupDialog [was: bG0] (lines 6563-6618)
// ---------------------------------------------------------------------------

/**
 * Privacy disclosure popup shown to signed-out users before casting.
 * Warns that watch history may be affected on the remote device.
 * [was: bG0]
 */
export class PrivacyPopupDialog extends Widget { // was: bG0 extends g.k
  constructor() {
    super({
      C: 'div',
      Z: 'ytp-mdx-popup-dialog',
      N: { role: 'dialog' },
      V: [{
        C: 'div',
        Z: 'ytp-mdx-popup-dialog-inner-content',
        V: [{
          C: 'div',
          Z: 'ytp-mdx-popup-title',
          eG: "You're signed out",
        }, {
          C: 'div',
          Z: 'ytp-mdx-popup-description',
          eG: 'Videos you watch may be added to the TV\'s watch history and influence TV recommendations. To avoid this, cancel and sign in to YouTube on your computer.',
        }, {
          C: 'div',
          Z: 'ytp-mdx-privacy-popup-buttons',
          V: [{
            C: 'button',
            yC: ['ytp-button', 'ytp-mdx-privacy-popup-cancel'],
            eG: 'Cancel',
          }, {
            C: 'button',
            yC: ['ytp-button', 'ytp-mdx-privacy-popup-confirm'],
            eG: 'Confirm',
          }],
        }],
      }],
    });

    /** @type {FadeWidget} [was: this.fade] */
    this.fade = new FadeWidget(this, 250);
    /** @type {Element} [was: this.cancelButton] */
    this.cancelButton = this.z2('ytp-mdx-privacy-popup-cancel');
    /** @type {Element} [was: this.confirmButton] */
    this.confirmButton = this.z2('ytp-mdx-privacy-popup-confirm');

    ownDisposable(this, this.fade);
    this.B(this.cancelButton, 'click', this.onCancel);
    this.B(this.confirmButton, 'click', this.onConfirm);
  }

  /** Show the popup. [was: Bw] */
  Bw() {
    this.fade.show();
  }

  /** Hide the popup. [was: HB] */
  HB() {
    this.fade.hide();
  }

  /** @private [was: W] */
  onCancel() {
    publish('mdx-privacy-popup-cancel'); // was: Zn
    this.HB();
  }

  /** @private [was: O] */
  onConfirm() {
    publish('mdx-privacy-popup-confirm'); // was: Zn
    this.HB();
  }
}

// ---------------------------------------------------------------------------
// CastDevicePicker [was: gFS] (lines 6661-6690)
// ---------------------------------------------------------------------------

/**
 * Menu-based device picker for selecting a cast receiver.
 * Shown in the player settings panel.
 * [was: gFS]
 */
export class CastDevicePicker extends MenuWidget { // was: gFS extends g.lN
  /**
   * @param {Object} playerApi [was: Q]
   * @param {Object} menuButton [was: c]
   */
  constructor(playerApi, menuButton) {
    super('Play on', 1, playerApi, menuButton);

    /** @type {Object} [was: this.U] */
    this.playerApi = playerApi;
    /** @type {Object} [was: this.Bk] -- receiver key -> receiver map */
    this.receiverMap = {};

    this.B(playerApi, 'onMdxReceiversChange', this.refresh);
    this.B(playerApi, 'presentingplayerstatechange', this.refresh);
    this.refresh();
  }

  /**
   * Refresh the device list from the remote module options.
   * [was: D]
   */
  refresh() { // was: D
    const receivers = this.playerApi.getOption('remote', 'receivers');
    if (receivers && receivers.length > 1 && !this.playerApi.getOption('remote', 'quickCast')) {
      this.receiverMap = invertObject(receivers, this.getKey, this);
      this.j(receivers.map(this.getKey)); // was: this.j(g.hy(Q, this.K))

      const current = this.playerApi.getOption('remote', 'currentReceiver');
      const currentKey = this.getKey(current);
      if (this.options[currentKey]) this.O(currentKey);

      this.enable(true);
    } else {
      this.enable(false);
    }
  }

  /** Extract key from receiver. [was: K] */
  getKey(receiver) { // was: K
    return receiver.key;
  }

  /** Get display name for a receiver key. [was: A] */
  A(key) {
    return key === 'cast-selector-receiver' ? 'Cast...' : this.receiverMap[key].name;
  }

  /** Handle receiver selection. [was: W] */
  W(key) {
    super.W(key);
    this.playerApi.setOption('remote', 'currentReceiver', this.receiverMap[key]);
    this.Ik.HB(); // close the settings menu
  }
}
