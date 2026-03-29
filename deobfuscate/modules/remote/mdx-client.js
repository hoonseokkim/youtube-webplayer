/**
 * MDX (Media Device eXtensions) Protocol Client
 *
 * Source: player_es6.vflset/en_US/remote.js, lines 1-500 (utilities),
 *   lines 1548-2000 (screen services), lines 2020-2870 (sessions, cloudview),
 *   lines 2871-3002 (top-level remote API), lines 3169-3407 (streamz classes),
 *   lines 4397-4903 (channel message classes), lines 4904-5240 (screen service impls)
 *
 * Handles:
 *  - Cast receiver discovery via screen services
 *  - Session establishment (lounge token, browser channel)
 *  - Message passing to cast devices via browser/web channels
 *  - Playback state synchronization between sender and receiver
 */

import { getRemoteSessionScreenId } from '../../core/attestation.js';  // was: g.Xd
import { listen } from '../../core/composition-helpers.js';  // was: g.s7
import { forEach } from '../../core/event-registration.js';  // was: g.mfm
import { AbstractIterator, iteratorResult } from '../../core/event-system.js';  // was: g.OF, g.f4
import { safeClearTimeout, safeSetTimeout } from '../../data/idb-transactions.js';  // was: g.JB, g.zn
import { sendXhrRequest } from '../../network/request.js';  // was: g.Wn
import { startIconMorphAnimation } from '../../player/video-loader.js'; // was: nY
import { WebChannelSession } from './cast-session.js'; // was: aEv
import { disposeApp } from '../../player/player-events.js'; // was: WA
import { isInAdPlayback } from '../../ads/dai-cue-range.js'; // was: WB
import { containsValue, isEmptyObject, filterObject } from '../../core/object-utils.js';
import { isArrayLike, partial, getObjectByPath } from '../../core/type-helpers.js';
import { setUriQueryParam, parseUri, getDomain, appendParamsToUrl } from '../../core/url-utils.js';
import { toString, contains } from '../../core/string-utils.js';
import { clear, filter, concat, sortedInsert } from '../../core/array-utils.js';
import { getUserAgent } from '../../core/browser-detection.js';
import { sendRequest } from '../../data/idb-transactions.js';
import { handleError } from '../../player/context-updates.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { DomEvent } from '../../core/dom-event.js';
import { Disposable } from '../../core/disposable.js';
import { ITERATOR_DONE } from '../../core/event-system.js';

// Stub: LoungeSessionHandler [was: Oq] — manages PubSub, BrowserChannel lifecycle,
// reconnection, lounge token, and message routing (see cast-session.js ~872).
// Extends LegacyChannelHandler (NVS).  Not yet extracted to its own module.
const LoungeSessionHandler = Oq; // was: Oq

// ---------------------------------------------------------------------------
// compareVersions [was: djZ] (line 4-6)
// ---------------------------------------------------------------------------

/**
 * Compares two version strings.
 * [was: djZ]
 * @param {string} versionA [was: Q]
 * @param {string} versionB [was: c]
 * @returns {number}
 */
export function compareVersions(versionA, versionB) { // was: djZ
  return containsValue(versionA, versionB);  -> compareVersionStrings
}

// ---------------------------------------------------------------------------
// toIterator [was: Ln9] (lines 7-28)
// ---------------------------------------------------------------------------

/**
 * Wraps an iterable as a AbstractIterator iterator.
 * [was: Ln9]
 */
export function toIterator(iterable) { // was: Ln9
  if (iterable instanceof AbstractIterator) return iterable;  -> Iterator class
  if (typeof iterable.F7 === 'function') return iterable.F7(false);
  if (isArrayLike(iterable)) {
    let index = 0;
    const iter = new AbstractIterator();  -> Iterator class
    iter.next = function () {
      for (;;) {
        if (index >= iterable.length) return ITERATOR_DONE;
        if (index in iterable) return iteratorResult(iterable[index++]);  -> iteratorResult(value)
        index++;
      }
    };
    return iter;
  }
  throw Error('Not implemented');
}

// ---------------------------------------------------------------------------
// addCacheBustParam [was: T8] (lines 40-43)
// ---------------------------------------------------------------------------

/**
 * Adds a cache-busting "zx" parameter to a URI.
 * [was: T8]
 * @param {Uri} uri [was: Q]
 * @returns {Uri}
 */
export function addCacheBustParam(uri) { // was: T8
  setUriQueryParam(  -> setUriQueryParam(uri, key, value)
    uri,
    'zx',
    Math.floor(Math.random() * 2147483648).toString(36) +
      Math.abs(Math.floor(Math.random() * 2147483648) ^ now()).toString(36)
  );
  return uri;
}

// ---------------------------------------------------------------------------
// MdxDevice [was: ex] (lines 165-230)
// ---------------------------------------------------------------------------

/**
 * Represents an MDX device (screen or remote control).
 * Parsed from lounge status JSON.
 * [was: ex]
 */
export class MdxDevice { // was: ex
  /**
   * @param {Object} [data] [was: Q]
   */
  constructor(data) { // was: ex(Q)
    /** @type {string} [was: this.id] */
    this.id = '';
    /** @type {string} [was: this.name] */
    this.name = '';
    /** @type {string} [was: this.clientName] */
    this.clientName = 'UNKNOWN_INTERFACE';
    /** @type {string} [was: this.app] */
    this.app = '';
    /** @type {string} [was: this.type] -- "REMOTE_CONTROL" or "LOUNGE_SCREEN" */
    this.type = 'REMOTE_CONTROL';
    /** @type {string} [was: this.username] */
    this.username = '';
    /** @type {string} [was: this.avatar] */
    this.avatar = '';
    /** @type {string} [was: this.obfuscatedGaiaId] */
    this.obfuscatedGaiaId = '';
    /** @type {string} [was: this.ownerObfuscatedGaiaId] */
    this.ownerObfuscatedGaiaId = '';
    /** @type {Set} [was: this.capabilities] */
    this.capabilities = new Set();
    /** @type {Set} [was: this.compatibleSenderThemes] */
    this.compatibleSenderThemes = new Set();
    /** @type {Set} [was: this.experiments] */
    this.experiments = new Set();
    /** @type {string} [was: this.theme] */
    this.theme = 'u';
    /** @type {string} [was: this.brand] */
    this.brand = '';
    /** @type {string} [was: this.model] */
    this.model = '';
    /** @type {number} [was: this.year] */
    this.year = 0;
    /** @type {string} [was: this.os] */
    this.os = '';
    /** @type {string} [was: this.osVersion] */
    this.osVersion = '';
    /** @type {string} [was: this.chipset] */
    this.chipset = '';
    /** @type {string} [was: this.mdxDialServerType] */
    this.mdxDialServerType = 'MDX_DIAL_SERVER_TYPE_UNKNOWN';

    if (data) {
      this.id = data.id || data.name;
      this.name = data.name;
      this.clientName = data.clientName ? data.clientName.toUpperCase() : 'UNKNOWN_INTERFACE';
      this.app = data.app;
      this.type = data.type || 'REMOTE_CONTROL';
      this.username = data.user || '';
      this.avatar = data.userAvatarUri || '';
      this.obfuscatedGaiaId = data.obfuscatedGaiaId || '';
      this.ownerObfuscatedGaiaId = data.ownerObfuscatedGaiaId || '';
      this.theme = data.theme || 'u';
      parseCapabilities(this, data.capabilities || '');       // was: $j9
      parseSenderThemes(this, data.compatibleSenderThemes || ''); // was: PQZ
      parseExperiments(this, data.experiments || '');          // was: lx1
      this.brand = data.brand || '';
      this.model = data.model || '';
      this.year = data.year || 0;
      this.os = data.os || '';
      this.osVersion = data.osVersion || '';
      this.chipset = data.chipset || '';
      this.mdxDialServerType = data.mdxDialServerType || 'MDX_DIAL_SERVER_TYPE_UNKNOWN';

      let deviceInfo = data.deviceInfo;
      if (deviceInfo) {
        deviceInfo = JSON.parse(deviceInfo);
        this.brand = deviceInfo.brand || '';
        this.model = deviceInfo.model || '';
        this.year = deviceInfo.year || 0;
        this.os = deviceInfo.os || '';
        this.osVersion = deviceInfo.osVersion || '';
        this.chipset = deviceInfo.chipset || '';
        this.clientName = deviceInfo.clientName ? deviceInfo.clientName.toUpperCase() : 'UNKNOWN_INTERFACE';
        this.mdxDialServerType = deviceInfo.mdxDialServerType || 'MDX_DIAL_SERVER_TYPE_UNKNOWN';
      }
    }
  }

  /** [was: ex.prototype.equals] */
  equals(other) {
    return other ? this.id === other.id : false;
  }
}

// ---------------------------------------------------------------------------
// CAPABILITY_MAP [was: ul0] (lines 3350-3388)
// ---------------------------------------------------------------------------

/**
 * Map of capability enum names to short codes.
 * [was: ul0]
 */
export const CAPABILITY_MAP = { // was: ul0
  AUTOPLAY: 'atp',              // was: yr
  SKIP_AD: 'ska',               // was: I1J
  QUEUE: 'que',                 // was: DMe
  MUSIC: 'mus',                 // was: jJ
  SUGGESTION: 'sus',            // was: wB0
  DISPLAY: 'dsp',               // was: y5
  SEQUENCING: 'seq',            // was: o0J
  MICROPHONE: 'mic',            // was: W_
  DISPLAY_AD: 'dpa',            // was: hn
  MULTI_LOOP_MODE: 'mlm',      // was: OW
  DISABLE_DRAIN_TRACK: 'dsdtr', // was: rC
  NO_TITLE_BAR: 'ntb',         // was: UW
  VOICE_SEARCH_PROMPT: 'vsp',  // was: RZI
  SCREEN: 'scn',               // was: GD
  REMOTE_PLAYBACK_ERROR: 'rpe',// was: k2H
  DISCONNECT_NOTIFICATION: 'dcn', // was: ya
  DISCONNECT_PROMPT: 'dcp',    // was: PE
  PAUSE_ON_SILENCE: 'pas',     // was: o7
  DISABLE_REMOTE_QUEUE: 'drq', // was: qg
  OPTIONAL_PIP_FULLSCREEN: 'opf', // was: gz
  ENABLE_LIVE_SEEKING: 'els',  // was: BE
  INITIAL_STATE: 'isg',        // was: L_
  SHORT_VIDEO_QUEUE: 'svq',    // was: RyJ
  MEDIA_VOLUME_PANEL: 'mvp',   // was: Ax
  ADS: 'ads',                  // was: CS
  SUBTITLES_CAPTION_PANEL: 'stcp', // was: KIF
  SERVER_ADS: 'sads',          // was: mQF
  DISABLE_LOCATION: 'dloc',    // was: UD
  DISABLE_CHROME_WHITELIST: 'dcw', // was: XJ
  AUDIO_SWITCH: 'asw',         // was: yl
  AUTOPLAY_WIDGET: 'aboveFeedAdLayout',      // was: xW
  WATCH_REMOTE_CONTROL: 'wrc', // was: PX
  PLAYBACK_CONTROL_WIDGET: 'pcw', // was: wAM
  IPV: 'ipv',                  // was: P$
  NO_DEVICE_TITLE: 'ndt',      // was: D$
  CAST_TOPS: 'ctops',          // was: f_
  GET_SCREEN_RESUMED_MESSAGE: 'gsrm', // was: AX
};

// ---------------------------------------------------------------------------
// SENDER_THEME_MAP [was: h31] (lines 3389-3398)
// ---------------------------------------------------------------------------

/**
 * Sender theme identifiers.
 * [was: h31]
 */
export const SENDER_THEME_MAP = { // was: h31
  UNKNOWN: 'u',      // was: SCG
  CLASSIC: 'cl',     // was: oA
  DARK: 'k',         // was: De
  ICON: 'i',         // was: SL
  CORAL: 'cr',       // was: OD
  MATERIAL: 'm',     // was: Me
  GAMING: 'g',       // was: eL
  UNPLUGGED: 'up',   // was: gL
};

// ---------------------------------------------------------------------------
// parseCapabilities [was: $j9], parseSenderThemes [was: PQZ],
// parseExperiments [was: lx1] (lines 210-230)
// ---------------------------------------------------------------------------

function parseCapabilities(device, csvString) { // was: $j9
  device.capabilities.clear();
  filter(csvString.split(','), partial(compareVersions, CAPABILITY_MAP)).forEach((cap) => {
    device.capabilities.add(cap);
  });
}

function parseSenderThemes(device, csvString) { // was: PQZ
  device.compatibleSenderThemes.clear();
  filter(csvString.split(','), partial(compareVersions, SENDER_THEME_MAP)).forEach((theme) => {
    device.compatibleSenderThemes.add(theme);
  });
}

function parseExperiments(device, csvString) { // was: lx1
  device.experiments.clear();
  csvString.split(',').forEach((exp) => {
    device.experiments.add(exp);
  });
}

// ---------------------------------------------------------------------------
// ScreenInfo [was: VE] (lines 231-261)
// ---------------------------------------------------------------------------

/**
 * Describes a remote screen (TV / cast device).
 * Contains lounge token, screen ID, and DIAL ID.
 * [was: VE]
 */
export class ScreenInfo { // was: VE
  constructor(data) {
    data = data || {};
    /** @type {string} [was: this.name] */
    this.name = data.name || '';
    /** @type {string} [was: this.id] -- screen ID */
    this.id = data.id || data.screenId || '';
    /** @type {string} [was: this.token] -- lounge token */
    this.token = data.token || data.loungeToken || '';
    /** @type {string} [was: this.uuid] -- DIAL ID */
    this.uuid = data.uuid || data.dialId || '';
    /** @type {string} [was: this.idType] -- "normal" or "shortLived" */
    this.idType = data.screenIdType || 'normal';
    /** @type {string} [was: this.secret] */
    this.secret = data.screenIdSecret || '';
  }
}

/**
 * Check whether a screen matches a given identifier (id or uuid).
 * [was: Bg]
 */
export function screenMatchesId(screen, identifier) { // was: Bg
  return !!identifier && (screen.id === identifier || screen.uuid === identifier);
}

/**
 * Convert a ScreenInfo to a serializable object.
 * [was: z3m]
 */
export function serializeScreen(screen) { // was: z3m
  return {
    name: screen.name,
    screenId: screen.id,
    loungeToken: screen.token,
    dialId: screen.uuid,
    screenIdType: screen.idType,
    screenIdSecret: screen.secret,
  };
}

/**
 * Generate a v4 UUID string.
 * [was: nx]
 */
export function generateUUID() { // was: nx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
    const rand = Math.random() * 16 | 0;
    return (ch === 'x' ? rand : rand & 3 | 8).toString(16);
  });
}

// ---------------------------------------------------------------------------
// LoungeApiClient [was: G6] (lines 1669-1675)
// ---------------------------------------------------------------------------

/**
 * HTTP client for the YouTube Lounge API.
 * Constructs URLs and makes API requests for screen pairing,
 * token management, and screen availability.
 * [was: G6]
 */
export class LoungeApiClient { // was: G6
  constructor(loungeHost) {
    /** @type {string} [was: this.scheme] */
    this.scheme = 'https';
    /** @type {string} [was: this.port] */
    this.port = '';
    /** @type {string} [was: this.domain] */
    this.domain = '';
    /** @type {string} [was: this.W] -- base API path */
    this.basePath = '/api/lounge'; // was: this.W
    /** @type {boolean} [was: this.O] -- supports cross-origin */
    this.supportsCrossOrigin = true; // was: this.O

    const href = loungeHost || document.location.href;
    const port = Number(parseUri(href)[4] || null) || '';
    if (port) this.port = ':' + port;
    this.domain = getDomain(href) || '';

    const userAgent = getUserAgent();
    if (userAgent.search('MSIE') >= 0) {
      const match = userAgent.match(/MSIE ([\d.]+)/);
      if (match && compareVersions(match[1], '10.0') < 0) { $ -> compareVersions
        this.supportsCrossOrigin = false;
      }
    }
  }

  /**
   * Build an API endpoint URL.
   * [was: $r]
   * @param {string} path
   * @returns {string}
   */
  buildUrl(path) { // was: $r (free function)
    let base = this.basePath;
    if (this.supportsCrossOrigin) {
      base = this.scheme + '://' + this.domain + this.port + this.basePath;
    }
    return appendParamsToUrl(base + path, {});  -> buildUrlWithParams(base, params)
  }

  /**
   * Send an HTTP request to the lounge API.
   * [was: G6.prototype.sendRequest]
   */
  sendRequest(method, url, params, onSuccess, onError, rawFormat, withCredentials) {
    const options = {
      format: rawFormat ? 'RAW' : 'JSON',
      method,
      context: this,
      timeout: 5000,
      withCredentials: !!withCredentials,
      onSuccess: partial(this.handleSuccess, onSuccess, !rawFormat),
      onError: partial(this.handleError, onError),
      onTimeout: partial(this.handleTimeout, onError),
    };
    if (params) {
      options.postParams = params;
      options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    }
    return sendXhrRequest(url, options);  -> sendXhr(url, options)
  }

  /** @private [was: G6.prototype.j] */
  handleSuccess(onSuccess, parseJson, xhr, response) {
    parseJson ? onSuccess(response) : onSuccess({ text: xhr.responseText });
  }

  /** @private [was: G6.prototype.A] */
  handleError(onError, xhr) {
    onError(Error('Request error: ' + xhr.status));
  }

  /** @private [was: G6.prototype.K] */
  handleTimeout(onError) {
    onError(Error('request timed out'));
  }
}

// ---------------------------------------------------------------------------
// BrowserChannelSession [was: GQa] (lines 4677-4743)
// ---------------------------------------------------------------------------

/**
 * Wraps a browser channel (long-polling) handler and exposes
 * a unified event interface for the MDX connection.
 * [was: GQa]
 */
export class BrowserChannelSession extends EventTarget { // was: GQa extends g.$R
  /**
   * @param {Function} handlerFactory [was: Q]
   * @param {string} screenId [was: c]
   */
  constructor(handlerFactory, screenId) {
    super();
    /** @type {Object} [was: this.handler] */
    this.handler = handlerFactory(); // was: Q()
    this.handler.subscribe('handlerOpened', this.onOpened, this);
    this.handler.subscribe('handlerClosed', this.onClosed, this);
    this.handler.subscribe('handlerError', (NetworkErrorCode, isAuthError) => {
      this.onError(isAuthError);
    });
    this.handler.subscribe('handlerMessage', this.onMessage, this);
    /** @type {string} [was: this.O] -- screen ID for session persistence */
    this.screenId = screenId; // was: this.O
  }

  /** Connect to the lounge backend. [was: connect] */
  connect(params, disconnectReason, savedSession) {
    this.handler.connect(params, disconnectReason, savedSession);
  }

  /** Disconnect from the lounge. [was: disconnect] */
  disconnect(reason) {
    this.handler.disconnect(reason);
  }

  /** Reconnect immediately. [was: ip] */
  reconnectNow() { // was: ip
    this.handler.ip();
  }

  /** @returns {string} device ID [was: getDeviceId] */
  getDeviceId() {
    return this.handler.getDeviceId();
  }

  /** @returns {number} ms until reconnect, NaN if not scheduled [was: nY] */
  getReconnectTimeout() { // was: nY
    return this.handler.startIconMorphAnimation();
  }

  /** Whether the channel is connected. [was: Oi] */
  isConnected() { // was: Oi
    return this.handler.Oi();
  }

  /**
   * Channel opened -- persist session info.
   * [was: W]
   */
  onOpened() { // was: W
    this.dispatchEvent('channelOpened');
    const handler = this.handler;
    setData('yt-remote-session-browser-channel', {
      firstTestResults: [''],
      secondTestResults: !handler.W.jH,
      sessionId: handler.W.j,
      arrayId: handler.W.Ea,
    });
    setData('yt-remote-session-screen-id', this.screenId);
    // Update connected devices list
    const devices = getConnectedDevices(); // was: Hg
    const deviceId = getLocalDeviceId();   // was: ia
    if (!contains(devices, deviceId)) devices.push(deviceId);
    setData('yt-remote-connected-devices', devices, 86400); // was: YN9
    syncDeviceCookies(); // was: yE
  }

  /** [was: onClosed] */
  onClosed() {
    this.dispatchEvent('channelClosed');
  }

  /** [was: onMessage] */
  onMessage(message) {
    this.dispatchEvent(new ChannelMessageEvent(message)); // was: yda
  }

  /**
   * @param {boolean} isAuthError [was: Q]
   * [was: onError]
   */
  onError(isAuthError) {
    this.dispatchEvent(new ChannelErrorEvent(isAuthError ? 1 : 0)); // was: S2a
  }

  /** Forward a message to the backend. [was: sendMessage] */
  sendMessage(action, params) {
    this.handler.sendMessage(action, params);
  }

  /** Update the lounge ID token. [was: dN] */
  setLoungeToken(token) { // was: dN
    this.handler.dN(token);
  }

  /** [was: dispose] */
  dispose() {
    this.handler.dispose();
  }
}

// ---------------------------------------------------------------------------
// WebChannelSession [was: vuo] (lines 4854-4902)
// ---------------------------------------------------------------------------

/**
 * Wraps a WebChannel handler with the same interface as BrowserChannelSession.
 * Used when enable_mdx_web_channel_desktop flag is active.
 * [was: vuo]
 */
export class WebChannelSession extends EventTarget { // was: vuo extends g.$R
  /**
   * @param {Function} handlerFactory [was: Q]
   */
  constructor(handlerFactory) {
    super();
    /** @type {Object} [was: this.W] */
    this.handler = handlerFactory(); // was: Q()
    this.handler.subscribe('webChannelOpened', this.onOpened, this);
    this.handler.subscribe('webChannelClosed', this.onClosed, this);
    this.handler.subscribe('webChannelError', this.onError, this);
    this.handler.subscribe('webChannelMessage', this.onMessage, this);
  }

  connect(params, disconnectReason) {
    this.handler.connect(params, disconnectReason);
  }

  disconnect(reason) {
    this.handler.disconnect(reason);
  }

  reconnectNow() { // was: ip
    this.handler.ip();
  }

  getDeviceId() {
    return this.handler.getDeviceId();
  }

  getReconnectTimeout() { // was: nY
    return this.handler.startIconMorphAnimation();
  }

  isConnected() { // was: Oi
    return this.handler.D === 3;
  }

  onOpened() {
    this.dispatchEvent('channelOpened');
  }

  onClosed() {
    this.dispatchEvent('channelClosed');
  }

  onMessage(message) {
    this.dispatchEvent(new ChannelMessageEvent(message)); // was: yda
  }

  onError() {
    this.dispatchEvent(new ChannelErrorEvent(this.handler.XS === 401 ? 1 : 0));
  }

  sendMessage(action, params) {
    this.handler.sendMessage(action, params);
  }

  setLoungeToken(token) { // was: dN
    this.handler.dN(token);
  }

  dispose() {
    this.handler.dispose();
  }
}

// ---------------------------------------------------------------------------
// ChannelMessageEvent [was: yda] (lines 4397-4402)
// ---------------------------------------------------------------------------

/**
 * Event dispatched when the MDX channel receives a message.
 * [was: yda]
 */
export class ChannelMessageEvent extends DomEvent { // was: yda -- TODO: resolve g.tG -> BaseEvent class
  constructor(message) {
    super('channelMessage');
    /** @type {Object} [was: this.message] */
    this.message = message;
  }
}

// ---------------------------------------------------------------------------
// ChannelErrorEvent [was: S2a] (lines 4403-4408)
// ---------------------------------------------------------------------------

/**
 * Event dispatched on MDX channel errors.
 * [was: S2a]
 */
export class ChannelErrorEvent extends DomEvent { // was: S2a -- TODO: resolve g.tG -> BaseEvent class
  constructor(NetworkErrorCode) {
    super('channelError');
    /** @type {number} [was: this.error] -- 0 = generic, 1 = auth */
    this.error = NetworkErrorCode;
  }
}

// ---------------------------------------------------------------------------
// createChannelSession [was: $Am] (lines 1727-1729)
// ---------------------------------------------------------------------------

/**
 * Factory: creates either a BrowserChannelSession or WebChannelSession.
 * [was: $Am]
 * @param {LoungeApiClient} apiClient [was: Q]
 * @param {Object} channelParams [was: c]
 * @param {Function} xsrfTokenGetter [was: W]
 * @param {boolean} isShortLivedToken [was: m]
 * @param {string} screenId [was: K]
 * @returns {BrowserChannelSession|WebChannelSession}
 */
export function createChannelSession(apiClient, channelParams, xsrfTokenGetter = () => '', isShortLivedToken, screenId) { // was: $Am
  const browserChannelFactory = () =>
    new LoungeSessionHandler(apiClient.buildUrl('/bc'), channelParams, false, xsrfTokenGetter, isShortLivedToken); // was: new Oq()

  if (getFlag('enable_mdx_web_channel_desktop')) {
    return new WebChannelSession(
      () => new WebChannelSession(apiClient.buildUrl('/wc'), channelParams, xsrfTokenGetter)
    );
  }
  return new BrowserChannelSession(browserChannelFactory, screenId);
}

// ---------------------------------------------------------------------------
// ScreenServiceBase [was: Ji] (lines 1783-1924)
// ---------------------------------------------------------------------------

/**
 * Base class for screen services that manage a list of known screens.
 * [was: Ji]
 */
export class ScreenServiceBase extends Disposable { // was: Ji extends g.W1
  constructor(name) {
    super();
    /** @type {string} [was: this.D] */
    this.serviceName = name; // was: this.D
    /** @type {Array<ScreenInfo>} [was: this.screens] */
    this.screens = [];
  }

  /** Return all known screens. [was: M4] */
  getAllScreens() { // was: M4
    return this.screens;
  }

  /** Whether a screen with matching ID exists. [was: contains] */
  contains(screen) {
    return !!findScreenByInfo(this.screens, screen); // was: Dn
  }

  /** Find a screen by its ID. [was: get] */
  get(id) {
    return id ? findScreenByKey(this.screens, id) : null; // was: te
  }

  /** Log info from this screen service. [was: info] */
  info(message) {
    logMdx(this.serviceName, message); // was: ue(this.D, Q)
  }
}

// ---------------------------------------------------------------------------
// OnlineScreenService [was: rJa] (lines 5052-5134)
// ---------------------------------------------------------------------------

/**
 * Polls the Lounge API for screen availability (online/offline status).
 * [was: rJa]
 */
export class OnlineScreenService extends Disposable { // was: rJa extends g.W1
  /**
   * @param {LoungeApiClient} apiClient [was: Q]
   * @param {Function} screenProvider [was: c]
   */
  constructor(apiClient, screenProvider) {
    super();
    /** @type {Function} [was: this.D] */
    this.screenProvider = screenProvider;
    /** @type {Object<string,boolean>} [was: this.W] -- screenId -> online */
    this.onlineStatus = {};
    /** @type {LoungeApiClient} [was: this.K] */
    this.apiClient = apiClient;
    /** @type {number} [was: this.j] -- fast-check period timestamp */
    this.fastCheckEnd = NaN;
    /** @type {number} [was: this.A] -- poll timer */
    this.pollTimer = NaN;
    /** @type {Object|null} [was: this.O] -- pending XHR */
    this.pendingRequest = null;

    // Initialize from persisted online IDs
    const savedIds = (getData('yt-remote-online-screen-ids') || '').split(',').filter(Boolean);
    const screens = this.screenProvider();
    const status = {};
    for (const screen of screens) {
      status[screen.id] = contains(savedIds, screen.id);
    }
    this.onlineStatus = status;
  }

  /** Start polling for screen availability. [was: start] */
  start() {
    const fastCheck = parseInt(getData('yt-remote-fast-check-period') || '0', 10);
    this.fastCheckEnd = now() - 14400000 < fastCheck ? 0 : fastCheck;
    if (this.fastCheckEnd) {
      this.schedulePoll(); // was: QQ
    } else {
      this.fastCheckEnd = now() + 300000;
      setData('yt-remote-fast-check-period', this.fastCheckEnd);
      this.checkNow(); // was: this.J
    }
  }

  /** Whether there are no screens to check. [was: isEmpty] */
  isEmpty() {
    return isEmptyObject(this.onlineStatus);
  }

  /** Re-check availability of current screens. [was: update] */
  update() {
    const screens = this.screenProvider();
    const filtered = filterObject(this.onlineStatus, (online, id) => {
      return online && !!findScreenByKey(screens, id);
    });
    this.applyUpdate(filtered); // was: cH
  }

  /** Schedule the next poll. [was: QQ] */
  schedulePoll() { // was: QQ
    if (!isNaN(this.pollTimer)) safeClearTimeout(this.pollTimer);
    this.pollTimer = safeSetTimeout(() => this.checkNow(), this.fastCheckEnd > 0 && this.fastCheckEnd < now() ? 20000 : 10000);
  }

  /** Immediately check screen availability via API. [was: J] */
  checkNow() { // was: J
    if (!isNaN(this.pollTimer)) safeClearTimeout(this.pollTimer);
    this.pollTimer = NaN;
    if (this.pendingRequest) this.pendingRequest.abort();

    const tokenMap = this.buildTokenMap(); // was: QKD
    if (Object.keys(tokenMap).length) {
      const url = this.apiClient.buildUrl('/pairing/get_screen_availability');
      const params = { lounge_token: Object.keys(tokenMap).join(',') };
      this.pendingRequest = this.apiClient.sendRequest(
        'POST', url, params,
        (response) => this.onAvailabilityResult(tokenMap, response),
        (error) => this.onAvailabilityError(error)
      );
    } else {
      this.applyUpdate({});
      this.schedulePoll();
    }
  }

  /** Build a map of loungeToken -> screenId. [was: QKD] */
  buildTokenMap() { // was: QKD
    const map = {};
    for (const screen of this.screenProvider()) {
      if (screen.token) {
        map[screen.token] = screen.id;
      }
    }
    return map;
  }

  /** Handle availability API response. [was: Y] */
  onAvailabilityResult(tokenMap, response) {
    this.pendingRequest = null;
    const screens = response.screens || [];
    const result = {};
    for (const entry of screens) {
      const screenId = tokenMap[entry.loungeToken];
      if (screenId) result[screenId] = entry.status === 'online';
    }
    this.applyUpdate(result);
    this.schedulePoll();
  }

  /** Handle availability API error. [was: L] */
  onAvailabilityError(error) {
    this.pendingRequest = null;
    this.schedulePoll();
  }

  /**
   * Apply updated online status and publish if changed.
   * [was: cH]
   */
  applyUpdate(newStatus) { // was: cH
    const changed = Object.keys(newStatus).length !== Object.keys(this.onlineStatus).length ||
      Object.keys(newStatus).some((id) => !this.onlineStatus[id]);
    if (changed) {
      this.onlineStatus = newStatus;
      this.publish('screenChange');
    }
    // Persist online screen IDs
    const onlineIds = Object.keys(newStatus).filter((id) => newStatus[id]);
    onlineIds.sort();
    if (onlineIds.length) {
      setData('yt-remote-online-screen-ids', onlineIds.join(','), 60);
    } else {
      removeData('yt-remote-online-screen-ids');
    }
  }

  disposeApp() {
    if (!isNaN(this.pollTimer)) safeClearTimeout(this.pollTimer);
    this.pollTimer = NaN;
    if (this.pendingRequest) {
      this.pendingRequest.abort();
      this.pendingRequest = null;
    }
    super.disposeApp();
  }
}

// ---------------------------------------------------------------------------
// ScreenService [was: m$] (lines 1909-5240)
// ---------------------------------------------------------------------------

/**
 * Composite screen service: manages local (paired) screens,
 * automatic (DIAL-discovered) screens, and online status.
 * [was: m$]
 */
export class ScreenService extends ScreenServiceBase { // was: m$ extends Ji
  /**
   * @param {LoungeApiClient} apiClient [was: Q]
   * @param {boolean} disableAutoScreenCache [was: c]
   */
  constructor(apiClient, disableAutoScreenCache = false) {
    super('ScreenService');
    /** @type {LoungeApiClient} [was: this.j] */
    this.apiClient = apiClient;
    /** @type {boolean} [was: this.J] */
    this.disableAutoCache = disableAutoScreenCache;
    /** @type {OnlineScreenService|null} [was: this.W] */
    this.onlineService = null;
    /** @type {LocalScreenService|null} [was: this.O] */
    this.localService = null;
    /** @type {Array<ScreenInfo>} [was: this.A] -- automatic/DIAL screens */
    this.automaticScreens = [];
    /** @type {Object<string,string>} [was: this.K] -- uuid -> screenId map */
    this.deviceIdMap = {};

    this.initialize(); // was: cJ9
  }

  /** @private [was: cJ9] */
  initialize() {
    this.deviceIdMap = getData('yt-remote-device-id-map') || {};
    this.localService = new LocalScreenService(this.apiClient); // was: kr
    this.localService.subscribe('screenChange', () => this.onLocalScreenChange());
    this.syncScreens(); // was: od9

    if (!this.disableAutoCache) {
      this.automaticScreens = Mva(getData('yt-remote-automatic-screen-cache') || []);
    }
    this.deviceIdMap = getData('yt-remote-device-id-map') || {};
    this.info('Initializing automatic screens: ' + qd(this.automaticScreens));

    this.onlineService = new OnlineScreenService(this.apiClient, () => this.getAllScreens(true));
    this.onlineService.subscribe('screenChange', () => {
      this.publish('onlineScreenChange');
    });
  }

  /** Start both local and online services. [was: start] */
  start() {
    this.localService.start();
    this.onlineService.start();
    if (this.screens.length) {
      this.publish('screenChange');
      if (!this.onlineService.isEmpty()) this.publish('onlineScreenChange');
    }
  }

  /**
   * Return all screens, optionally including automatic screens.
   * [was: M4]
   */
  getAllScreens(includeAuto) { // was: M4
    if (includeAuto) return this.screens;
    return concat(this.screens, filter(this.automaticScreens, (s) => !this.contains(s)));
  }

  /**
   * Return screens that are currently online.
   * [was: VQ]
   */
  getOnlineScreens() { // was: VQ
    return filter(this.getAllScreens(true), (screen) => {
      return !!this.onlineService.onlineStatus[screen.id];
    });
  }

  /** @private sync local screens into this.screens [was: od9] */
  syncScreens() {
    this.screens = this.localService.getAllScreens();
    // Enrich with UUID from device ID map
    const reverseMap = {};
    for (const [uuid, id] of Object.entries(this.deviceIdMap)) {
      reverseMap[id] = uuid;
    }
    for (const screen of this.screens) {
      screen.uuid = reverseMap[screen.id] || '';
    }
  }

  /** @private [was: wb] */
  onLocalScreenChange() {
    this.syncScreens();
    this.publish('screenChange');
    this.onlineService.update();
  }

  disposeApp() {
    if (this.localService) dispose(this.localService);
    if (this.onlineService) dispose(this.onlineService);
    super.disposeApp();
  }
}

// ---------------------------------------------------------------------------
// Debug logging [was: ue, hi, Ql, n1, tt, u$, x_, pT] (lines 1737-1782)
// ---------------------------------------------------------------------------

/** @type {number} [was: MH9] */
const debugStartTime = Date.now(); // was: MH9

/**
 * Log an MDX debug message.
 * [was: ue]
 */
export function logMdx(category, message) { // was: ue
  // Simplified -- original uses a ring buffer (CT) and handler list (le)
  const elapsed = ((Date.now() - debugStartTime) / 1000).toFixed(3);
  const formatted = `[${elapsed}s] [yt.mdx.remote] ${category}: ${message}\n`;
  // In production, this feeds into debug handler chain
}

function logRemote(msg) { logMdx('remote', msg); }    // was: Ql
function logCloudview(msg) { logMdx('cloudview', msg); } // was: n1, tt
function logConnection(msg) { logMdx('conn', msg); }     // was: u$
function logController(msg) { logMdx('Controller', msg); } // was: x_

// ---------------------------------------------------------------------------
// Top-level remote state accessors [was: various g.n7/g.DR calls]
// (lines 2928-2970)
// ---------------------------------------------------------------------------

/** @type {LoungeApiClient|null} [was: RV] */
let loungeApiClient = null; // was: RV

/** @type {Array|null} [was: k_] -- deferred connection proxies */
let deferredProxies = null; // was: k_

/** @type {ScreenServiceProxy|null} [was: Vl] */
let screenServiceProxy = null; // was: Vl

/** @type {Array} [was: ca] -- global event subscription keys */
const globalSubscriptions = []; // was: ca

/**
 * Get the screen service wrapper singleton.
 * [was: Y_]
 */
export function getScreenService() { // was: Y_
  if (!screenServiceProxy) {
    const service = getObjectByPath('yt.mdx.remote.screenService_');
    screenServiceProxy = service ? new ScreenServiceProxy(service) : null; // was: e9m
  }
  return screenServiceProxy;
}

/** Get the current screen ID being cast to. [was: p1] */
export function getCurrentScreenId() { // was: p1
  return getObjectByPath('yt.mdx.remote.currentScreenId_');
}

/** Set the current screen ID. [was: VXW] */
export function setCurrentScreenId(id) { // was: VXW
  setGlobal('yt.mdx.remote.currentScreenId_', id);
}

/** Get pending connect data (video/playlist info). [was: BCS] */
export function getConnectData() { // was: BCS
  return getObjectByPath('yt.mdx.remote.connectData_');
}

/** Set pending connect data. [was: Wa] */
export function setConnectData(data) { // was: Wa
  setGlobal('yt.mdx.remote.connectData_', data);
}

/** Get the current RemoteConnection instance. [was: o3] */
export function getConnection() { // was: o3
  return getObjectByPath('yt.mdx.remote.connection_');
}

/**
 * Set or clear the current connection, firing events as needed.
 * [was: A$]
 */
export function setConnection(connection) { // was: A$
  const previous = getConnection();
  setConnectData(null);
  if (!connection) setCurrentScreenId('');
  setGlobal('yt.mdx.remote.connection_', connection);

  if (deferredProxies) {
    deferredProxies.forEach((fn) => fn(connection));
    deferredProxies.length = 0;
  }

  if (previous && !connection) {
    publish('yt-remote-connection-change', false); // was: Zn
  } else if (!previous && connection) {
    publish('yt-remote-connection-change', true);
  }
}

/** Whether there is an active remote connection. [was: eA] */
export function isConnectionActive() { // was: eA
  const conn = getConnection();
  return !!conn && conn.getProxyState() !== 3;
}

/** Whether the Cast API extension is installed. [was: yQ] */
export function isCastInstalled() { // was: yQ
  return !!getData('yt-remote-cast-installed');
}

/** Get the friendly name of the current cast receiver. [was: gdm] */
export function getCastReceiverName() { // was: gdm
  const receiver = getData('yt-remote-cast-receiver');
  return receiver ? receiver.friendlyName : null;
}

/** Clear the persisted cast receiver. [was: OZ1] */
export function clearCurrentReceiver() { // was: OZ1
  removeData('yt-remote-cast-receiver');
}

/** Get the Cast controller singleton. [was: Nx] */
export function getCastInstance() { // was: Nx
  return getObjectByPath('yt.mdx.remote.cloudview.instance_');
}

/** Whether the Cast API is ready. [was: S6] */
export function isApiReady() { // was: S6
  return !!getObjectByPath('yt.mdx.remote.cloudview.apiReady_');
}

/** Request the cast device picker UI. [was: F2] */
export function requestCastSelector() { // was: F2
  if (!isCastInstalled()) return;
  if (!getCastInstance()) return;
  if (isApiReady()) {
    getCastInstance().requestSession();
  } else {
    // Wait for API ready then request
    globalSubscriptions.push(listen('yt-remote-cast2-api-ready', requestCastSelector));
  }
}

/**
 * Return the list of online screen keys with names.
 * [was: Xxm]
 */
export function getOnlineScreens() { // was: Xxm
  let screens = getScreenService().AE.$_gos();
  const currentScreen = getCurrentConnectedScreen();
  if (currentScreen && getConnection()) {
    if (!findScreenByInfo(screens, currentScreen)) {
      screens.push(currentScreen);
    }
  }
  return screens.map((s) => ({ key: s.id, name: s.name })); // was: J3H
}

/**
 * Get the active receiver entry (connected screen or cast receiver).
 * [was: r6]
 */
export function getActiveReceiver() { // was: r6
  let receiver = getActiveScreenReceiver(); // was: Ad4
  if (!receiver && isCastInstalled() && getCastReceiverName()) {
    receiver = { key: 'cast-selector-receiver', name: getCastReceiverName() };
  }
  return receiver;
}

/**
 * Initialize the entire remote/MDX subsystem.
 * [was: IAi] (lines 2797-2870)
 */
export function initializeRemote(appConfig, mdxConfig) { // was: IAi
  // Abbreviated -- sets up LoungeApiClient, ScreenService, cast API, and event wiring
  // See source lines 2797-2870 for full implementation
  if (!loungeApiClient) {
    loungeApiClient = new LoungeApiClient(mdxConfig?.loungeApiHost);
  }
  // ... (full initialization logic)
}

// ---------------------------------------------------------------------------
// Helpers (internal)
// ---------------------------------------------------------------------------

function findScreenByInfo(screens, screen) { // was: Dn
  return find(screens, (s) => {
    return s || screen ? (!s !== !screen ? false : s.id === screen.id) : true;
  });
}

function findScreenByKey(screens, key) { // was: te
  return find(screens, (s) => screenMatchesId(s, key));
}

function getConnectedDevices() { // was: Hg
  const devices = getData('yt-remote-connected-devices') || [];
  g.iD(devices);  -> deduplicateArray(arr)
  return devices;
}

function getLocalDeviceId() { // was: ia
  let id = getData('yt-remote-device-id');
  if (!id) {
    id = generateUUID();
    setData('yt-remote-device-id', id, 31536000);
  }
  const devices = getConnectedDevices();
  let suffix = 1;
  let candidate = id;
  while (contains(devices, candidate)) {
    suffix++;
    candidate = id + '#' + suffix;
  }
  return candidate;
}

function syncDeviceCookies() { // was: yE
  let devices = getConnectedDevices();
  const deviceId = getLocalDeviceId();
  if (getRemoteSessionScreenId()) sortedInsert(devices, deviceId); // was: g.S4(devices, deviceId)
  // Sync to cookie for cross-tab awareness
}

function getSavedBrowserChannel() { // was: psZ
  return getData('yt-remote-session-browser-channel');
}

function getCurrentConnectedScreen() { // was: T2
  const screenId = getCurrentScreenId();
  if (!screenId) return null;
  const allScreens = getScreenService().getAllScreens();
  return findScreenByKey(allScreens, screenId);
}

function getActiveScreenReceiver() { // was: Ad4
  const screens = getOnlineScreens();
  let currentScreen = getCurrentConnectedScreen();
  if (!currentScreen) currentScreen = getSessionScreen(); // was: mf
  return find(screens, (s) => {
    return currentScreen && screenMatchesId(currentScreen, s.key);
  });
}

function getSessionScreen() { // was: mf
  const sessionDeviceId = getRemoteSessionScreenId();  -> getSessionDeviceId()
  if (!sessionDeviceId) return null;
  const service = getScreenService();
  if (!service) return null;
  return findScreenByKey(service.getAllScreens(), sessionDeviceId);
}

/**
 * Extract location override info from video data.
 * [was: gNZ] (lines 68-81)
 */
export function getLocationOverride(videoData) { // was: gNZ
  if (videoData.isInAdPlayback) {
    if (videoData.isInAdPlayback.locationOverrideToken) {
      return { locationOverrideToken: videoData.isInAdPlayback.locationOverrideToken };
    }
    if (videoData.isInAdPlayback.latitudeE7 != null && videoData.isInAdPlayback.longitudeE7 != null) {
      return { latitudeE7: videoData.isInAdPlayback.latitudeE7, longitudeE7: videoData.isInAdPlayback.longitudeE7 };
    }
  }
  return null;
}
