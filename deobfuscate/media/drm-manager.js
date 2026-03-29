/**
 * DRM management: license constraints, DRM configuration, and EME MediaKeySession handling.
 *
 * Extracted from base.js lines ~96066-96481.
 * Covers SABR license constraint handling, DRM certificate management,
 * EME session lifecycle (keystatuschange, licenseerror), key status transitions,
 * DRM provision timing, and error codes ("drm.provision", "drm.license").
 *
 * @module drm-manager
 */

// ---------------------------------------------------------------------------
// LicenseConstraintManager  [was: Zj]
// ---------------------------------------------------------------------------


import { userAgentContains } from '../core/composition-helpers.js'; // was: g.Hn
import { registerDisposable } from '../core/event-system.js'; // was: g.F
import { generateRandomHexId } from '../data/gel-core.js'; // was: g.fd7
import { reportWarning } from '../data/gel-params.js'; // was: g.Ty
import { createQualityRange } from '../modules/caption/caption-translation.js'; // was: g.ya
import { wrapSafe } from '../ads/ad-async.js'; // was: ui
import { createSuccessResult } from '../core/misc-helpers.js'; // was: I2
import { disposeApp } from '../player/player-events.js'; // was: WA
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { ProtobufStreamParser } from './bitstream-reader.js'; // was: SX
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { listenAll } from '../core/attestation.js'; // was: TE
import { getCobaltVersion } from '../core/composition-helpers.js'; // was: tE
import { adjustDaiDuration } from '../player/playback-mode.js'; // was: Qw
import { StreamAudioTrack } from './audio-track-manager.js'; // was: ISW
import { AdaptiveAudioTrack } from './audio-track-manager.js'; // was: X94
import { buildDrmSessionId } from './segment-request.js'; // was: fI7
import { logDrmEvent } from './track-manager.js'; // was: HP
import { buildDrmLicenseUrl } from './track-manager.js'; // was: Gq_
import { hasKeyStatusApi } from './track-manager.js'; // was: yO
import { getMaxQualityFromFormats } from './track-manager.js'; // was: Yx0
import { isQualityInRange } from '../modules/caption/caption-translation.js'; // was: Nny
import { isGaplessShortEligible } from './seek-controller.js'; // was: wA
import { getStatusForTrackType } from './track-manager.js'; // was: m87
import { updateGridState } from '../player/video-loader.js'; // was: sd
import { Disposable } from '../core/disposable.js';
import { EventHandler } from '../core/event-handler.js';
import { dispose } from '../ads/dai-cue-range.js';
import { findIndex, remove, splice, removeAll, findLastIndex, clear } from '../core/array-utils.js';
import { ObservableTarget } from '../core/event-target.js';
// TODO: resolve g.W1
// TODO: resolve g.lj
// TODO: resolve g.qK
// TODO: resolve g.rU
// TODO: resolve g.y1

/**
 * Manages a single EME session or legacy key-add workflow.
 * Wraps MediaKeySession, handles message/keystatuschange/close events,
 * and propagates errors back via callbacks.
 * [was: Zj]
 *
 * @extends g.qK (Disposable)
 */
export class LicenseConstraintManager extends Disposable { // was: Zj
  /**
   * @param {HTMLMediaElement|null} mediaElement - The video/audio element [was: Q]
   * @param {object|null} drmConfig - DRM system configuration [was: c]
   * @param {Uint8Array|null} initData - Initialization data for the key request [was: W]
   * @param {MediaKeySession|null} session - The underlying MediaKeySession [was: m]
   * @param {object|null} errorEvent - Prefixed key-error event (legacy path) [was: K]
   * @param {boolean} ignoreTeardownErrors - Whether to swallow close() errors [was: T]
   */
  constructor(mediaElement, drmConfig, initData, session, errorEvent, ignoreTeardownErrors = false) { // was: (Q, c, W, m, K, T=!1)
    super();
    this.element = mediaElement; // was: Q
    this.drmSystemConfig = drmConfig; // was: L -> c
    this.initData = initData; // was: W
    this.session = session; // was: W -> m (MediaKeySession)
    this.legacyErrorEvent = errorEvent; // was: O -> K
    this.ignoreTeardownErrors = ignoreTeardownErrors; // was: b0 -> T
    this.sessionId = "";
    /** @type {Function|null} License-request callback [was: K] */
    this.onLicenseRequest = null; // was: K
    /** @type {Function|null} Error callback [was: A] */
    this.onError = null; // was: A
    /** @type {Function|null} Key-ready callback [was: D] */
    this.onKeyReady = null; // was: D
    /** @type {Function|null} Key-status callback [was: J] */
    this.onKeyStatusChange = null; // was: J
    this.eventHandler = new EventHandler(this); // was: j
    registerDisposable(this, this.eventHandler);
    T8K(this); // wire up native session events
  }

  /**
   * Handle EME "message" event — forward license request to callback.
   * [was: T2]
   *
   * @param {MediaKeyMessageEvent} event [was: Q]
   */
  handleMessage(event) { // was: T2
    if (this.onLicenseRequest) {
      const messageType = event.messageType || "license-request"; // was: c
      this.onLicenseRequest(new Uint8Array(event.message), messageType);
    }
  }

  /**
   * Handle "keystatuseschange" — forward key statuses map.
   * [was: sN]
   */
  handleKeyStatusChange() { // was: sN
    if (this.onKeyStatusChange) {
      this.onKeyStatusChange(this.session.keyStatuses);
    }
  }

  /**
   * Handle session closed — on Xbox One, propagate "closedShouldNotRetry".
   * [was: onClosed]
   */
  onClosed() { // was: onClosed
    if (!this.u0() && userAgentContains("xboxone") && this.onError) {
      this.onError("closedShouldNotRetry");
    }
  }

  /**
   * Legacy message handler (webkit prefix path).
   * [was: S]
   *
   * @param {object} event [was: Q]
   */
  handleLegacyMessage(event) { // was: S
    if (this.onLicenseRequest) {
      this.onLicenseRequest(event.message, "license-request");
    }
  }

  /**
   * Handle prefixed key error — formats error code and system code,
   * then invokes the error callback.
   * [was: mF]
   *
   * @param {object} event - The key error event [was: Q]
   */
  handleKeyError(event) { // was: mF
    if (this.onError) {
      let NetworkErrorCode; // was: c
      let systemCode; // was: Q (reused)
      if (this.legacyErrorEvent) {
        NetworkErrorCode = this.legacyErrorEvent.error.code;
        systemCode = this.legacyErrorEvent.error.systemCode;
      } else {
        NetworkErrorCode = event.NetworkErrorCode;
        systemCode = event.systemCode;
      }
      this.onError(`t.prefixedKeyError;c.${NetworkErrorCode};sc.${systemCode}`, NetworkErrorCode, systemCode);
    }
  }

  /**
   * Handle key-added / key-ready event.
   * [was: Y]
   */
  handleKeyReady() { // was: Y
    if (this.onKeyReady) {
      this.onKeyReady();
    }
  }

  /**
   * Push a license response to the underlying session.
   * Uses EME update() when available, falls back to legacy addKey / webkitAddKey.
   * [was: update]
   *
   * @param {BufferSource} licenseResponse - The license server response [was: Q]
   * @returns {Promise}
   */
  update(licenseResponse) { // was: update
    if (this.session) {
      return this.session.update(licenseResponse).then(null, wrapSafe((error) => { // was: c
        o5O(this, "t.update", error);
      }));
    }

    if (this.legacyErrorEvent) {
      this.legacyErrorEvent.update(licenseResponse);
    } else if (this.element?.addKey) {
      this.element.addKey(this.drmSystemConfig.keySystem, licenseResponse, this.initData, this.sessionId);
    } else if (this.element?.webkitAddKey) {
      this.element.webkitAddKey(this.drmSystemConfig.keySystem, licenseResponse, this.initData, this.sessionId);
    }

    return createSuccessResult(); // resolved promise
  }

  /**
   * Dispose — close the underlying session and release references.
   * [was: WA]
   */
  disposeApp() { // was: WA (dispose hook)
    if (this.session) {
      if (this.ignoreTeardownErrors) {
        this.session.close().catch(reportWarning);
      } else {
        this.session.close();
      }
    }
    this.element = null;
    super.disposeApp();
  }
}


// ---------------------------------------------------------------------------
// DrmConfig  [was: gF]
// ---------------------------------------------------------------------------

/**
 * DRM configuration and certificate handling.
 * Manages MediaKeys creation, server certificate attachment,
 * and session creation (EME standard + legacy prefixed paths).
 * [was: gF]
 *
 * @extends g.qK (Disposable)
 */
export class DrmConfig extends Disposable { // was: gF
  /**
   * @param {HTMLMediaElement} mediaElement [was: Q]
   * @param {object} keySystemConfig - Key-system configuration (keySystem, flavor, certificates) [was: c]
   * @param {boolean} ignoreTeardownErrors - Swallow close() errors on teardown [was: W]
   */
  constructor(mediaElement, keySystemConfig, ignoreTeardownErrors = false) { // was: (Q, c, W=!1)
    super();
    this.element = mediaElement; // was: Q
    this.keySystemConfig = keySystemConfig; // was: W -> c
    this.ignoreTeardownErrors = ignoreTeardownErrors; // was: D -> W
    /** @type {Object<string, LicenseConstraintManager>} Active sessions by ID [was: K] */
    this.sessions = {}; // was: K
    /** @type {LicenseConstraintManager|null} Legacy single-session fallback [was: A] */
    this.legacySession = null; // was: A
    this.eventHandler = new EventHandler(this); // was: j
    /** @type {MediaKeys|null} The underlying MediaKeys instance [was: mediaKeys] */
    this.mediaKeys = null;
    /** @type {*} Pending MediaKeys promise tracking [was: O] */
    this.pendingMediaKeys = null; // was: O
    /** @type {Promise} Sequential operation chain [was: J] */
    this.operationChain = Promise.resolve(); // was: J
    registerDisposable(this, this.eventHandler);
  }

  /**
   * Attach server certificate to the MediaKeys instance.
   * Only applies for Widevine with a certificate, or Fairplay with w0 certificate.
   * [was: setServerCertificate]
   *
   * @returns {Promise|null}
   */
  setServerCertificate() { // was: setServerCertificate
    if (!this.mediaKeys.setServerCertificate) return null;

    if (this.keySystemConfig.flavor === "widevine" && this.keySystemConfig.Kf) {
      return this.mediaKeys.setServerCertificate(this.keySystemConfig.Kf);
    }
    if (this.keySystemConfig.W() && this.keySystemConfig.w0) {
      return this.mediaKeys.setServerCertificate(this.keySystemConfig.w0);
    }
    return null;
  }

  /**
   * Create a new EME session (or legacy key-request).
   * Generates the license request and returns a LicenseConstraintManager.
   * [was: createSession]
   *
   * @param {object} initDataInfo - Contains initData and contentType [was: Q]
   * @param {Function|null} timingCallback - Optional timing log callback [was: c]
   * @returns {LicenseConstraintManager}
   */
  createSession(initDataInfo, timingCallback) { // was: createSession
    let processedInitData = initDataInfo.initData; // was: W

    if (this.keySystemConfig.keySystemAccess) {
      timingCallback && timingCallback("createsession");
      const nativeSession = this.mediaKeys.createSession(); // was: m

      if (Jk(this.keySystemConfig)) {
        processedInitData = XUm(processedInitData, this.keySystemConfig.w0);
      } else if (this.keySystemConfig.W()) {
        processedInitData = wrm(processedInitData) || new Uint8Array(0);
      }

      timingCallback && timingCallback("genreq");
      const generatePromise = nativeSession.generateRequest(initDataInfo.contentType, processedInitData); // was: Q (reused)
      const session = new LicenseConstraintManager(null, null, null, nativeSession, null, this.ignoreTeardownErrors); // was: K

      generatePromise.then(
        () => { timingCallback && timingCallback("genreqsuccess"); },
        wrapSafe((error) => { o5O(session, "t.generateRequest", error); }) // was: T
      );

      return session;
    }

    if (zq(this.keySystemConfig)) {
      return ImX(this, processedInitData);
    }
    if (ML(this.keySystemConfig)) {
      return Axd(this, processedInitData);
    }

    // Legacy prefixed path
    if (this.element?.generateKeyRequest) {
      this.element.generateKeyRequest(this.keySystemConfig.keySystem, processedInitData);
    } else {
      this.element?.webkitGenerateKeyRequest(this.keySystemConfig.keySystem, processedInitData);
    }

    this.legacySession = new LicenseConstraintManager(
      this.element, this.keySystemConfig, processedInitData, null, null, this.ignoreTeardownErrors
    );
    return this.legacySession;
  }

  /**
   * Forward legacy "message" event to the correct session.
   * [was: mF]
   *
   * @param {object} event [was: Q]
   */
  handleLegacyMessage(event) { // was: mF
    const session = Eu(this, event); // was: c
    if (session) session.handleLegacyMessage(event); // was: c.S(Q)
  }

  /**
   * Forward legacy "keyerror" event.
   * [was: Y]
   *
   * @param {object} event [was: Q]
   */
  handleLegacyKeyError(event) { // was: Y
    const session = Eu(this, event); // was: c
    if (session) session.handleKeyError(event); // was: c.mF(Q)
  }

  /**
   * Forward legacy "keyadded" event.
   * [was: L]
   *
   * @param {object} event [was: Q]
   */
  handleLegacyKeyAdded(event) { // was: L
    const session = Eu(this, event); // was: c
    if (session) session.handleKeyReady(event); // was: c.Y(Q)
  }

  /**
   * Retrieve DRM metrics from the MediaKeys object (platform-specific).
   * [was: getMetrics]
   *
   * @returns {*} Metrics object or null
   */
  getMetrics() { // was: getMetrics
    let metrics = null; // was: Q
    if (this.mediaKeys && this.mediaKeys.getMetrics) {
      try {
        metrics = this.mediaKeys.getMetrics();
      } catch {}
    }
    return metrics;
  }

  /**
   * Dispose — null MediaKeys, dispose all sessions.
   * [was: WA]
   */
  disposeApp() { // was: WA
    this.pendingMediaKeys = null;
    this.mediaKeys = null;
    this.legacySession?.dispose();
    for (const session of Object.values(this.sessions)) {
      session.dispose();
    }
    this.sessions = {};
    super.disposeApp();
    delete this.element;
  }
}


// ---------------------------------------------------------------------------
// ByteArrayMap  [was: OA]
// ---------------------------------------------------------------------------

/**
 * Simple key-value map that uses byte-array comparison for keys.
 * Used to deduplicate init-data requests in the DRM subsystem.
 * [was: OA]
 */
export class ByteArrayMap { // was: OA
  constructor() {
    this.keys = [];
    this.values = [];
  }

  /**
   * @param {Uint8Array} key [was: Q]
   * @returns {*} The stored value, or null
   */
  get(key) { // was: get
    const index = this.findIndex(key); // was: Q (reused)
    return index !== -1 ? this.values[index] : null;
  }

  /**
   * @param {Uint8Array} key [was: Q]
   */
  remove(key) { // was: remove
    const index = this.findIndex(key); // was: Q (reused)
    if (index !== -1) {
      this.keys.splice(index, 1);
      this.values.splice(index, 1);
    }
  }

  removeAll() {
    this.keys = [];
    this.values = [];
  }

  /**
   * @param {Uint8Array} key [was: Q]
   * @param {*} value [was: c]
   */
  set(key, value) { // was: set
    const index = this.findIndex(key); // was: W
    if (index !== -1) {
      this.values[index] = value;
    } else {
      this.keys.push(key);
      this.values.push(value);
    }
  }

  /**
   * @param {Uint8Array} key [was: Q]
   * @returns {number}
   */
  findIndex(key) { // was: findIndex
    return findLastIndex(this.keys, (candidate) => g.y1(key, candidate)); // was: c
  }
}


// ---------------------------------------------------------------------------
// MediaKeySessionManager  [was: sZw]
// ---------------------------------------------------------------------------

/**
 * Top-level EME MediaKeySession manager.
 * Orchestrates DRM session creation, key rotation, heartbeat params,
 * keystatuschange / licenseerror event handling, key status transitions,
 * DRM provision timing, and quality-constraint signaling.
 *
 * Error codes surfaced: "drm.provision", "drm.license"
 * [was: sZw]
 *
 * @extends g.W1 (EventTarget / Subscribable)
 */
export class MediaKeySessionManager extends ObservableTarget { // was: sZw
  /**
   * @param {HTMLMediaElement} mediaElement [was: Q]
   * @param {object} videoData - Video metadata [was: c]
   * @param {object} playerConfig - Player configuration / feature flags [was: W]
   * @param {object|null} sharedMediaElement - Shared element for gapless transitions [was: m]
   * @param {object} persistentState - Cross-session persistent DRM state [was: K]
   */
  constructor(mediaElement, videoData, playerConfig, sharedMediaElement = null, persistentState) { // was: (Q, c, W, m=null, K)
    super();
    this.element = mediaElement; // was: Q -> element
    this.videoData = videoData; // was: c -> videoData
    this.playerConfig = playerConfig; // was: FI -> W
    this.mediaElement = sharedMediaElement; // was: mediaElement -> m
    this.persistentState = persistentState; // was: uC -> K

    /** @type {Array} Pending key-info queue [was: j] */
    this.pendingKeyInfoQueue = []; // was: j
    /** @type {number} Remaining sessions for PlayReady dual-session setup [was: PA] */
    this.remainingSessionCount = 2; // was: PA
    /** @type {boolean} Key-added flag [was: Ka] */
    this.keyAdded = false; // was: Ka
    /** @type {boolean} [was: Y0] */
    this.Y0 = false; // was: Y0
    /** @type {object|null} Heartbeat parameters from license response [was: heartbeatParams] */
    this.heartbeatParams = null;
    /** @type {boolean} License request in flight [was: mF] */
    this.licenseRequestPending = false; // was: mF
    /** @type {boolean} Session creation in progress [was: T2] */
    this.sessionCreationPending = false; // was: T2
    /** @type {object|null} Key rotation manager (Fairplay ISW / Widevine X94) [was: K] */
    this.keyRotationManager = null; // was: K (shadows param, assigned later)
    /** @type {boolean} Whether keystatuseschange has ever fired [was: jG] */
    this.hasReceivedKeyStatus = false; // was: jG

    /** @type {object} Key-system configuration shorthand [was: W] */
    this.keySystemConfig = this.videoData.K; // was: W
    /** @type {string} DRM session identifier [was: drmSessionId] */
    this.drmSessionId = this.videoData.drmSessionId || generateRandomHexId();
    /** @type {Map} Active license-request sessions by init-data hash [was: A] */
    this.activeSessions = new Map(); // was: A
    /** @type {ByteArrayMap} Init-data deduplication map [was: D] */
    this.initDataMap = new ByteArrayMap(); // was: D
    /** @type {ByteArrayMap} Sync init-data loader map [was: L] */
    this.syncInitDataMap = new ByteArrayMap(); // was: L
    this.eventHandler = new EventHandler(this); // was: b0

    /** @type {boolean} Whether to ignore teardown errors [was: Y] */
    this.ignoreTeardownErrors = this.playerConfig.X("html5_eme_ignore_teardown_errors"); // was: Y

    // Legacy key-add detection
    const createDatabaseDefinition = this.element; // was: Q (reused)
    (createDatabaseDefinition && (createDatabaseDefinition.addKey || createDatabaseDefinition.webkitAddKey)) || aM() || Gq(playerConfig.experiments);

    // Determine initial quality constraint
    let qualityConstraint; // was: W (reused)
    if (this.playerConfig.X("html5_enable_vp9_fairplay") && this.keySystemConfig.W()) {
      qualityConstraint = IN; // unconstrained
    } else {
      const useSX = this.videoData.ProtobufStreamParser; // was: W (reused)
      qualityConstraint = (this.keySystemConfig.flavor === "fairplay" || useSX) ? ab : IN;
    }
    /** @type {object} Current quality constraint [was: J] */
    this.qualityConstraint = qualityConstraint; // was: J

    // MediaKeys instance — shared or owned
    if (this.playerConfig.getExperimentFlags.W.BA($07) && this.persistentState) {
      if (!this.persistentState.mediaKeys) {
        this.persistentState.mediaKeys = new DrmConfig(this.element, this.keySystemConfig, this.ignoreTeardownErrors);
      }
      this.mediaKeys = this.persistentState.mediaKeys;
    } else {
      this.mediaKeys = new DrmConfig(this.element, this.keySystemConfig, this.ignoreTeardownErrors);
      registerDisposable(this, this.mediaKeys);
    }

    // PlayReady dual-key path
    if (zq(this.keySystemConfig)) {
      /** @type {DrmConfig|undefined} Secondary DrmConfig for PlayReady [was: S] */
      this.secondaryDrmConfig = new DrmConfig(this.element, this.keySystemConfig, this.ignoreTeardownErrors); // was: S
      registerDisposable(this, this.secondaryDrmConfig);
    }

    registerDisposable(this, this.eventHandler);

    // Bind encrypted / needkey events
    if (this.keySystemConfig.keySystemAccess) {
      this.eventHandler.B(mediaElement, "encrypted", this.onEncrypted); // was: EC
    } else {
      listenAll(this.eventHandler, mediaElement,
        zq(this.keySystemConfig) ? ["msneedkey"] : ["needkey", "webkitneedkey"],
        this.onNeedKey // was: Fw
      );
    }

    Vhd(this); // attach MediaKeys to the element

    // Key rotation manager (Fairplay / Widevine)
    let rotationManager; // was: W (reused again)
    switch (this.keySystemConfig.flavor) {
      case "fairplay":
        if (getCobaltVersion() > 19.2999) {
          const renewalWindow = this.keySystemConfig.adjustDaiDuration; // was: W
          let renewalOffset = this.keySystemConfig.MN; // was: Q
          if (renewalOffset >= renewalWindow) renewalOffset = renewalWindow * 0.75;
          const halfDelta = (renewalWindow - renewalOffset) * 0.5; // was: c
          rotationManager = new StreamAudioTrack(halfDelta, renewalWindow, renewalWindow - halfDelta - renewalOffset, this);
        } else {
          rotationManager = null;
        }
        break;
      case "widevine":
        rotationManager = new AdaptiveAudioTrack(this.activeSessions, this);
        break;
      default:
        rotationManager = null;
    }

    this.keyRotationManager = rotationManager; // was: K (property)
    if (this.keyRotationManager) {
      registerDisposable(this, this.keyRotationManager);
      this.keyRotationManager.subscribe("rotated_need_key_info_ready", this.onRotatedNeedKeyInfo, this); // was: MM
      this.keyRotationManager.subscribe("log_qoe", this.logQoe, this); // was: O
    }

    Gq(this.playerConfig.experiments);
    this.logQoe({ cks: this.keySystemConfig.getInfo() });
  }

  /**
   * Handle "encrypted" event (standard EME).
   * [was: EC]
   *
   * @param {MediaEncryptedEvent} event [was: Q]
   */
  onEncrypted(event) { // was: EC
    this.logQoe({ onecpt: 1 });
    if (event.initData) {
      x8n(this, new Uint8Array(event.initData), event.initDataType);
    }
  }

  /**
   * Handle legacy "needkey" / "webkitneedkey" event.
   * [was: Fw]
   *
   * @param {object} event [was: Q]
   */
  onNeedKey(event) { // was: Fw
    this.logQoe({ onndky: 1 });
    x8n(this, event.initData, event.contentType);
  }

  /**
   * Handle rotated need-key-info from key rotation manager.
   * [was: g9]
   *
   * @param {object} keyInfo [was: Q]
   */
  onNeedKeyInfo(keyInfo) { // was: g9
    this.logQoe({ onneedkeyinfo: 1 });
    if (this.playerConfig.X("html5_eme_loader_sync")) {
      if (!this.syncInitDataMap.get(keyInfo.initData)) {
        this.syncInitDataMap.set(keyInfo.initData, keyInfo);
      }
    }
    B8X(this, keyInfo);
  }

  /**
   * Queue rotated key info for sequential processing.
   * [was: MM]
   *
   * @param {object} keyInfo [was: Q]
   */
  onRotatedNeedKeyInfo(keyInfo) { // was: MM
    this.pendingKeyInfoQueue.push(keyInfo);
    Lw(this); // process queue
  }

  /**
   * Create a DRM session for the given key info.
   * Subscribes to all session lifecycle events (keystatuseschange,
   * licenseerror, newlicense, newsession, sessionready, etc.).
   * [was: createSession]
   *
   * @param {object} keyInfo [was: Q]
   */
  createSession(keyInfo) { // was: createSession
    const initDataHash = qQn(this) ? buildDrmSessionId(keyInfo) : g.lj(keyInfo.initData); // was: c
    this.activeSessions.get(initDataHash);
    this.sessionCreationPending = true; // was: T2 = !0

    const licenseSession = new AHa(this.videoData, this.playerConfig, keyInfo, this.drmSessionId, this.persistentState); // was: Q (reused)
    this.activeSessions.set(initDataHash, licenseSession);

    licenseSession.subscribe("ctmp", this.onCtmp, this); // was: UH
    licenseSession.subscribe("keystatuseschange", this.onKeyStatusesChange, this); // was: sN
    licenseSession.subscribe("licenseerror", this.onLicenseError, this); // was: Mc
    licenseSession.subscribe("newlicense", this.onNewLicense, this); // was: HA
    licenseSession.subscribe("newsession", this.onNewSession, this); // was: JJ
    licenseSession.subscribe("sessionready", this.onSessionReady, this); // was: La
    licenseSession.subscribe("fairplay_next_need_key_info", this.onFairplayNextNeedKey, this); // was: XI

    if (this.playerConfig.X("html5_enable_vp9_fairplay")) {
      licenseSession.subscribe("qualitychange", this.onQualityChange, this); // was: Ie
    }

    licenseSession.subscribe("sabrlicenseconstraint", this.onSabrLicenseConstraint, this); // was: WB

    const drmConfigInstance = this.mediaKeys; // was: c (reused)
    logDrmEvent(licenseSession, { createkeysession: 1 });
    licenseSession.status = "gr"; // generateRequest pending
    Bu("drm_gk_s", undefined, licenseSession.videoData.Y);
    licenseSession.url = buildDrmLicenseUrl(licenseSession);

    if (licenseSession.FI.getExperimentFlags.W.BA(kq_) && licenseSession.uC?.W && licenseSession.uC?.licenseRequest) {
      licenseSession.j = licenseSession.uC.W;
      PUy(licenseSession, licenseSession.uC.W, licenseSession.uC, licenseSession.uC.certificate);
      ic(licenseSession, licenseSession.uC.licenseRequest, "license-request");
    } else {
      licenseSession.j = JkW(licenseSession, drmConfigInstance, licenseSession.uC?.certificate);
      registerDisposable(licenseSession, licenseSession.j);
    }
  }

  /**
   * Handle "newlicense" — store heartbeat params.
   * [was: HA]
   *
   * @param {object|null} heartbeatParams [was: Q]
   */
  onNewLicense(heartbeatParams) { // was: HA
    if (this.u0()) return;
    this.logQoe({ onnelcswhb: 1 });
    if (heartbeatParams && !this.heartbeatParams) {
      this.heartbeatParams = heartbeatParams;
      this.publish("heartbeatparams", heartbeatParams);
    }
  }

  /**
   * Handle "newsession" — dequeue pending key info, allow next session creation.
   * [was: JJ]
   */
  onNewSession() { // was: JJ
    if (this.u0()) return;
    this.logQoe({ newlcssn: 1 });
    this.pendingKeyInfoQueue.shift();
    this.sessionCreationPending = false; // was: T2 = !1
    Lw(this);
  }

  /**
   * Handle "sessionready" — for PlayReady dual-session, attach MediaKeys once both ready.
   * [was: La]
   */
  onSessionReady() { // was: La
    if (!zq(this.keySystemConfig)) return;
    this.logQoe({ onsnrdy: 1 });
    this.remainingSessionCount--;
    if (this.remainingSessionCount === 0) {
      const secondary = this.secondaryDrmConfig; // was: Q
      secondary.element?.msSetMediaKeys?.(secondary.pendingMediaKeys);
    }
  }

  /**
   * Handle "keystatuseschange" — update authorized formats and quality constraint.
   * Propagates key status transitions for DRM provision timing.
   * [was: sN]
   *
   * @param {object} sessionInfo - License session with key statuses [was: Q]
   */
  onKeyStatusesChange(sessionInfo) { // was: sN
    if (this.u0()) return;

    if (!this.hasReceivedKeyStatus) {
      this.hasReceivedKeyStatus = true;
      if (this.playerConfig.cB()) {
        n5n(this); // log DRM metrics
      }
    }

    this.logQoe({ onksch: 1 });

    // Determine best quality from key statuses
    const updateQualityFn = this.onQualityChange; // was: c
    let bestQuality; // was: W

    if (!hasKeyStatusApi(sessionInfo) && g.rU && sessionInfo.O.keySystem === "com.microsoft.playready" && navigator.requestMediaKeySystemAccess) {
      bestQuality = "large";
    } else {
      let usableTypes = []; // was: W (reused)
      let allUnknown = true; // was: m

      if (hasKeyStatusApi(sessionInfo)) {
        for (const keyId of Object.keys(sessionInfo.W)) {
          if (sessionInfo.W[keyId].status === "usable") usableTypes.push(sessionInfo.W[keyId].type);
          if (sessionInfo.W[keyId].status !== "unknown") allUnknown = false;
        }
      }

      if (!hasKeyStatusApi(sessionInfo) || allUnknown) {
        usableTypes = sessionInfo.A;
      }

      bestQuality = getMaxQualityFromFormats(usableTypes);

      if (sessionInfo.FI.getExperimentFlags.W.BA(NF) && sessionInfo.uC?.certificate && bestQuality <= "large" && sessionInfo.A.length === 0) {
        logDrmEvent(sessionInfo, { best_qual: bestQuality }, true);
      }
    }

    updateQualityFn.call(this, bestQuality);

    // Collect authorized formats
    let authorizedFormats; // was: K
    if (sessionInfo.FI.X("html5_enable_vp9_fairplay") && sessionInfo.O.W()) {
      authorizedFormats = sessionInfo.Y;
    } else {
      if (!hasKeyStatusApi(sessionInfo)) {
        const formatMap = {}; // was: c (reused)
        for (const keyId of sessionInfo.A) { // was: K
          cx_(sessionInfo, keyId, formatMap);
        }
      }
      authorizedFormats = sessionInfo.authorizedFormats;
    }

    this.videoData.authorizedFormats = authorizedFormats;
    this.publish("keystatuseschange", sessionInfo);
  }

  /**
   * Forward CTMP telemetry event.
   * [was: UH]
   *
   * @param {string} type [was: Q]
   * @param {*} data [was: c]
   */
  onCtmp(type, data) { // was: UH
    if (!this.u0()) this.publish("ctmp", type, data);
  }

  /**
   * Forward Fairplay next-need-key-info event.
   * [was: XI]
   *
   * @param {*} keyInfo [was: Q]
   * @param {*} extra [was: c]
   */
  onFairplayNextNeedKey(keyInfo, extra) { // was: XI
    if (!this.u0()) this.publish("fairplay_next_need_key_info", keyInfo, extra);
  }

  /**
   * Handle license error — log DRM metrics if configured, propagate.
   * Error codes: "drm.provision", "drm.license"
   * [was: Mc]
   *
   * @param {string} errorCode [was: Q]
   * @param {number} severity [was: c]
   * @param {string} details [was: W]
   * @param {*} extra [was: m]
   */
  onLicenseError(NetworkErrorCode, severity, details, extra) { // was: Mc
    if (this.u0()) return;
    if (this.videoData.X("html5_log_drm_metrics_on_error")) {
      n5n(this);
    }
    this.publish("licenseerror", NetworkErrorCode, severity, details, extra);
  }

  /**
   * Return the current quality constraint. Logs license quality cap if applicable.
   * [was: t_]
   *
   * @returns {object} Quality constraint
   */
  getQualityConstraint() { // was: t_
    if (this.playerConfig.getExperimentFlags.W.BA(NF) && this.persistentState?.certificate) {
      this.logQoe({ lic_qual_cap: this.qualityConstraint.W }, true);
    }
    return this.qualityConstraint;
  }

  /**
   * Handle quality change from key statuses.
   * [was: Ie]
   *
   * @param {string} quality [was: Q]
   */
  onQualityChange(quality) { // was: Ie
    const candidate = createQualityRange("auto", quality, false, "l"); // was: c
    if (this.videoData.ProtobufStreamParser) {
      if (this.qualityConstraint.equals(candidate)) return;
    } else {
      if (isQualityInRange(this.qualityConstraint, quality)) return;
    }
    this.qualityConstraint = candidate;
    this.publish("qualitychange");
    this.logQoe({ updtlq: quality });
  }

  /**
   * Handle SABR license constraint update.
   * [was: WB]
   *
   * @param {*} constraint [was: Q]
   */
  onSabrLicenseConstraint(constraint) { // was: WB
    this.videoData.sabrLicenseConstraint = constraint;
  }

  /**
   * Dispose — detach MediaKeys, unsubscribe from all sessions, clear state.
   * [was: WA]
   */
  disposeApp() { // was: WA
    // Detach MediaKeys from the element (standard EME path)
    if (this.keySystemConfig.keySystemAccess && this.element && !this.mediaElement?.l0?.ul()) {
      if (this.ignoreTeardownErrors) {
        this.element.setMediaKeys(null).catch(reportWarning);
      } else {
        this.element.setMediaKeys(null);
      }
    }

    this.element = null;
    this.pendingKeyInfoQueue = [];

    for (const session of this.activeSessions.values()) {
      session.unsubscribe("ctmp", this.onCtmp, this);
      session.unsubscribe("keystatuseschange", this.onKeyStatusesChange, this);
      session.unsubscribe("licenseerror", this.onLicenseError, this);
      session.unsubscribe("newlicense", this.onNewLicense, this);
      session.unsubscribe("newsession", this.onNewSession, this);
      session.unsubscribe("sessionready", this.onSessionReady, this);
      session.unsubscribe("fairplay_next_need_key_info", this.onFairplayNextNeedKey, this);
      if (this.playerConfig.X("html5_enable_vp9_fairplay")) {
        session.unsubscribe("qualitychange", this.onQualityChange, this);
      }
      session.dispose();
    }

    this.activeSessions.clear();
    this.initDataMap.removeAll();
    this.syncInitDataMap.removeAll();
    this.heartbeatParams = null;
    super.disposeApp();
  }

  /**
   * Serialize DRM state for debugging / diagnostics.
   * [was: wA]
   *
   * @returns {object}
   */
  isGaplessShortEligible() { // was: wA
    const state = {
      systemInfo: this.keySystemConfig.isGaplessShortEligible(),
      sessions: [],
    };
    for (const session of this.activeSessions.values()) {
      state.sessions.push(session.isGaplessShortEligible());
    }
    return state;
  }

  /**
   * Return a human-readable info string for diagnostics.
   * [was: getInfo]
   *
   * @returns {string}
   */
  getInfo() { // was: getInfo
    if (this.activeSessions.size <= 0) return "no session";
    return `${this.activeSessions.values().next().value.getInfo()}${this.keyRotationManager ? "/KR" : ""}`;
  }

  /**
   * Log a QoE telemetry event for DRM.
   * [was: O]
   *
   * @param {object} data - Key-value pairs to log [was: Q]
   * @param {boolean} force - Send even outside cB() scope [was: c]
   */
  logQoe(data, force = false) { // was: O
    if (this.u0()) return;
    Tb(data);
    if (this.playerConfig.cB() || force) {
      this.publish("ctmp", "drmlog", data);
    }
  }

  /**
   * Check output-restricted status across all sessions (SD + AUDIO).
   * Returns true if any stream is output-restricted.
   * [was: Re]
   *
   * @returns {boolean}
   */
  isOutputRestricted() { // was: Re
    let sdStatus = undefined; // was: Q = void 0
    let audioStatus = undefined; // was: c = void 0
    for (const session of this.activeSessions.values()) {
      if (!sdStatus) sdStatus = getStatusForTrackType(session, "SD");
      if (!audioStatus) audioStatus = getStatusForTrackType(session, "AUDIO");
    }
    this.logQoe({ updateGridState: sdStatus, audio: audioStatus });
    return sdStatus === "output-restricted" || audioStatus === "output-restricted";
  }
}
