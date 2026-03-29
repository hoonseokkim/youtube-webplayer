/**
 * Cast Session Management — Receiver discovery, session lifecycle, browser channel wrappers
 *
 * Source: player_es6.vflset/en_US/remote.js, lines 3408–5240
 *
 * Covers:
 *  - Cast framework detection and extension IDs
 *  - Throttled callback timer (wp / ThrottledTimer)
 *  - Timestamp tracking (ba / Timestamp)
 *  - JSON codec (oJ / JsonCodec)
 *  - Event base classes (gp, OL, nRm, DHm, ta0)
 *  - ChannelRequest prototype methods (Pg / ChannelRequest)
 *  - BrowserChannel prototype methods (vRv / BrowserChannel)
 *  - ChannelHandler base (Cs0) and WebChannel wrapper (Ai)
 *  - WebChannelHandler adapter (Xj), ChannelDebugInfo (ep)
 *  - LegacyChannelRequest prototype methods (qW)
 *  - LoungeTransport prototype methods (rzv)
 *  - LegacyBrowserChannel (ZD) prototype methods
 *  - Legacy handler base (NVS)
 *  - Queue class (iOS)
 *  - Channel message/error events (yda, S2a)
 *  - RetryTimer (gN)
 *  - Lounge session handler (Oq) — PubSub, connect/disconnect, message routing
 *  - HTTP request helper (G6)
 *  - BrowserChannelTransport (GQa) — wraps Oq for EventTarget API
 *  - WebChannelSession (aEv) — modern WebChannel-based lounge session
 *  - WebChannelTransport (vuo) — wraps aEv for EventTarget API
 *  - Screen discovery logging (MH9, le, CT, z6, MW)
 *  - ScreenService base (Ji) and subclasses
 *  - DIAL screen poller (ZG9)
 *  - LocalScreenService (kr) — lounge token refresh, local screens
 *  - OnlineScreenService (rJa) — screen availability polling
 *  - RemoteScreenService (m$) — combines local + online services, DIAL pairing
 */

import { storageGet, storageSet } from '../../core/attestation.js';  // was: g.UM, g.rl
import { AsyncQueue, stopAndFire } from '../../core/bitstream-helpers.js';  // was: g.$K, g.I9
import { EventTargetBase, getConfig } from '../../core/composition-helpers.js';  // was: g.$R, g.v
import { safeDispose } from '../../core/event-system.js';  // was: g.BN
import { globalRef } from '../../core/polyfills.js';  // was: g.IW
import { safeClearTimeout, safeSetTimeout } from '../../data/idb-transactions.js';  // was: g.JB, g.zn
import { sendXhrRequest } from '../../network/request.js';  // was: g.Wn
import { lookupEntity } from '../../proto/varint-decoder.js'; // was: OK
import { startIconMorphAnimation } from '../../player/video-loader.js'; // was: nY
import { wrapSafe } from '../../ads/ad-async.js'; // was: ui
import { rejectPromise } from '../../ads/ad-async.js'; // was: wc
import { ScreenInfo } from './mdx-client.js'; // was: VE
import { logMdx } from './mdx-client.js'; // was: ue
import { DomEvent } from '../../core/dom-event.js';
import { sendRequest } from '../../data/idb-transactions.js';
import { partial } from '../../core/type-helpers.js';
import { contains } from '../../core/string-utils.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { ObservableTarget } from '../../core/event-target.js';
import { isEmptyObject, filterObject, objectKeys } from '../../core/object-utils.js';
// TODO: resolve g.W1
// TODO: resolve g.y1

// ---------------------------------------------------------------------------
// Cast framework globals (lines 3411-3414)
// ---------------------------------------------------------------------------

/** Current cast extension ID [was: Nd] */
let castExtensionId = ""; // was: Nd

/** Cast API instance reference [was: FO] */
let castApiInstance = null; // was: FO

/**
 * Whether to load the Cast framework.
 * [was: XOa]
 */
const shouldLoadCastFramework = TmZ("loadCastFramework") || TmZ("loadCastApplicationFramework"); // was: XOa

/**
 * Known Cast extension IDs for Chrome.
 * [was: ewm]
 */
const CAST_EXTENSION_IDS = [ // was: ewm
  "pkedcjkdefgpdelpbcmbmeomcjbeemfm",
  "enhhojjnijigcajfphajepfemndkmdlo",
];

// ---------------------------------------------------------------------------
// ThrottledTimer [was: wp] (lines 3415-3453)
// ---------------------------------------------------------------------------

/**
 * A timer that throttles invocations and supports pause/resume.
 * Extends Disposable.
 * [was: wp]
 */
// g.bw(wp, g.qK) — inherits from Disposable

/**
 * Schedules or re-schedules the throttled callback.
 * [was: wp.prototype.LG]
 *
 * @param {...*} args [was: Q]
 */
// wp.prototype.LG = function(Q) { ... }

/**
 * Stops the timer and clears pending invocation.
 * [was: wp.prototype.stop]
 */
// wp.prototype.stop = function() { ... }

/**
 * Pauses the timer (increments pause counter).
 * [was: wp.prototype.pause]
 */
// wp.prototype.pause = function() { ++this.O }

/**
 * Resumes the timer (decrements pause counter, fires if ready).
 * [was: wp.prototype.resume]
 */
// wp.prototype.resume = function() { ... }

/**
 * Disposes the timer.
 * [was: wp.prototype.WA]
 */
// wp.prototype.WA = function() { this.stop(); wp.FS.WA.call(this) }

/**
 * Internal tick handler — fires callback or reschedules.
 * [was: wp.prototype.BU]
 */
// wp.prototype.BU = function() { ... }

// ---------------------------------------------------------------------------
// Timestamp [was: ba] (lines 3454-3465)
// ---------------------------------------------------------------------------

/**
 * Simple timestamp holder with set/reset/get.
 * [was: ba]
 */
// var jx = null; — singleton instance
// ba.prototype.set = function(Q) { this.W = Q }
// ba.prototype.reset = function() { this.set(g.d0()) }
// ba.prototype.get = function() { return this.W }

// ---------------------------------------------------------------------------
// JsonCodec [was: oJ] (lines 3468-3475)
// ---------------------------------------------------------------------------

/**
 * JSON stringify/parse wrapper using native window.JSON.
 * [was: oJ]
 */
export const JsonCodec = class { // was: oJ
  stringify(value) { // was: stringify(Q)
    return globalRef.JSON.stringify(value, undefined);
  }
  parse(text) { // was: parse(Q)
    return globalRef.JSON.parse(text, undefined);
  }
};

// ---------------------------------------------------------------------------
// Event class inheritance declarations (lines 3477-3482)
// ---------------------------------------------------------------------------

// g.bw(gp, g.tG)   — ChannelMessageEvent extends BaseEvent
// g.bw(OL, g.tG)   — ChannelStatusEvent extends BaseEvent
// var q7a = null     — singleton
// g.bw(nRm, g.tG)  — extends BaseEvent
// g.bw(DHm, g.tG)  — extends BaseEvent
// g.bw(ta0, g.tG)  — TimingEvent extends BaseEvent

// ---------------------------------------------------------------------------
// Sentinel constants (lines 3489-3490)
// ---------------------------------------------------------------------------

/** Sentinel: invalid chunk format [was: FZS] */
export const INVALID_CHUNK = {}; // was: FZS

/** Sentinel: incomplete chunk [was: Cx] */
export const INCOMPLETE_CHUNK = {}; // was: Cx

// ---------------------------------------------------------------------------
// ChannelRequest prototype methods [was: Pg] (lines 3491-3604)
// ---------------------------------------------------------------------------

/**
 * Sets the request timeout.
 * [was: Pg.prototype.setTimeout] (line 3492-3494)
 *
 * @param {number} timeout [was: Q] - timeout in ms
 */
// Pg.prototype.setTimeout = function(Q) { this.JJ = Q }

/**
 * Handles XHR readystatechange, delegates to throttle or direct handler.
 * [was: Pg.prototype.vU] (lines 3496-3500)
 */
// Pg.prototype.vU = function(Q) { ... }

/**
 * Main readystatechange handler — processes streaming chunks,
 * handles status codes, manages watchdog, and dispatches data.
 * [was: Pg.prototype.UL] (lines 3502-3579)
 */
// Pg.prototype.UL = function(Q) { ... }

/**
 * Cancels this channel request.
 * [was: Pg.prototype.cancel] (lines 3582-3585)
 */
// Pg.prototype.cancel = function() { this.MM = !0; he(this) }

/**
 * Watchdog timeout handler — fires when request exceeds deadline.
 * [was: Pg.prototype.GL] (lines 3587-3595)
 */
// Pg.prototype.GL = function() { ... }

/**
 * Returns the last error code.
 * [was: Pg.prototype.getLastError] (lines 3597-3599)
 */
// Pg.prototype.getLastError = function() { return this.K }

/**
 * Returns the underlying XHR for header inspection.
 * [was: Pg.prototype.Ew] (lines 3601-3603)
 */
// Pg.prototype.Ew = function() { return this.W }

// ---------------------------------------------------------------------------
// MapEntry [was: NCm] (lines 3605-3611)
// ---------------------------------------------------------------------------

/**
 * Wraps a map (key-value data) with a sequence ID for the send queue.
 * [was: NCm]
 *
 * @param {number} mapId [was: Q] - sequence number
 * @param {Object} map [was: c] - key-value data
 */
export const ChannelMapEntry = class { // was: NCm
  constructor(mapId, map) {
    this.mapId = mapId; // was: this.W = Q
    this.map = map; // was: this.map = c
    this.context = null;
  }
};

// ---------------------------------------------------------------------------
// ConnectionPool.prototype.cancel (lines 3613-3623)
// ---------------------------------------------------------------------------

// See mdx-session.js for full ConnectionPool implementation.

// ---------------------------------------------------------------------------
// BrowserChannel prototype methods [was: vRv] (lines 3625-3789)
// ---------------------------------------------------------------------------

/**
 * Protocol version. [was: vRv.prototype.qn]
 */
// vRv.prototype.qn = 8

/**
 * Connection state: 1=INIT, 2=HANDSHAKE, 3=OPENED, 0=CLOSED.
 * [was: vRv.prototype.Tf]
 */
// vRv.prototype.Tf = 1

/**
 * Connects the BrowserChannel to a server path.
 * [was: vRv.prototype.connect] (lines 3628-3637)
 *
 * @param {string} basePath [was: Q]
 * @param {Object} [headers] [was: c]
 * @param {string} [osid] [was: W]
 * @param {number} [oaid] [was: m]
 */
// vRv.prototype.connect = function(Q, c, W, m) { ... }

/**
 * Disconnects, sending a terminate request via sendBeacon or Image ping.
 * [was: vRv.prototype.disconnect] (lines 3639-3664)
 */
// vRv.prototype.disconnect = function() { ... }

/**
 * Returns true if the channel is closed (state == 0).
 * [was: vRv.prototype.NK] (lines 3666-3668)
 */
// vRv.prototype.NK = function() { return this.Tf == 0 }

/**
 * Returns the current connection state.
 * [was: vRv.prototype.getState] (lines 3670-3672)
 */
// vRv.prototype.getState = function() { return this.Tf }

/**
 * Forward channel ready handler — initiates handshake or sends data.
 * [was: vRv.prototype.u5] (lines 3674-3733)
 */
// vRv.prototype.u5 = function(Q) { ... }

/**
 * Back channel ready handler — creates back-channel request.
 * [was: vRv.prototype.rI] (lines 3735-3743)
 */
// vRv.prototype.rI = function() { ... }

/**
 * Handles back channel downgrade from streaming to non-streaming.
 * [was: vRv.prototype.DM] (lines 3745-3752)
 */
// vRv.prototype.DM = function() { ... }

/**
 * Notified when back channel becomes active.
 * [was: vRv.prototype.Nl] (lines 3754-3758)
 */
// vRv.prototype.Nl = function(Q) { ... }

/**
 * Stale back channel handler.
 * [was: vRv.prototype.Na] (lines 3760-3765)
 */
// vRv.prototype.Na = function() { ... }

/**
 * Reachability result handler.
 * [was: vRv.prototype.X5] (lines 3767-3769)
 */
// vRv.prototype.X5 = function(Q) { Q ? at(2) : at(1) }

/**
 * Returns whether the channel handler says it's active.
 * [was: vRv.prototype.isActive] (lines 3771-3773)
 */
// vRv.prototype.isActive = function() { return !!this.K && this.K.isActive(this) }

// ---------------------------------------------------------------------------
// ChannelHandler (no-op base) [was: Cs0] (lines 3775-3789)
// ---------------------------------------------------------------------------

/**
 * No-op channel handler base class.
 * [was: Cs0]
 */
// Cs0.prototype.gI = function() {}    — onSessionEstablished
// Cs0.prototype.Xl = function() {}    — onMessage
// Cs0.prototype.Da = function() {}    — onError
// Cs0.prototype.hT = function() {}    — onClose
// Cs0.prototype.isActive = function() { return true }
// Cs0.prototype.oZ = function() {}    — onBadMap

// ---------------------------------------------------------------------------
// WebChannel prototype methods [was: Ai] (lines 3790-3844)
// ---------------------------------------------------------------------------

/**
 * Opens the WebChannel connection.
 * [was: Ai.prototype.open] (lines 3791-3795)
 */
// Ai.prototype.open = function() { this.W.K = this.A; ... this.W.connect(...) }

/**
 * Closes the WebChannel.
 * [was: Ai.prototype.close] (lines 3797-3799)
 */
// Ai.prototype.close = function() { this.W.disconnect() }

/**
 * Sends data over the WebChannel, wrapping strings in __data__.
 * [was: Ai.prototype.send] (lines 3801-3813)
 *
 * @param {string|Object} data [was: Q]
 */
// Ai.prototype.send = function(Q) { ... }

/**
 * Disposes the WebChannel.
 * [was: Ai.prototype.WA] (lines 3815-3821)
 */
// Ai.prototype.WA = function() { ... Ai.FS.WA.call(this) }

// ---------------------------------------------------------------------------
// WebChannelHandler prototype [was: Xj] (lines 3825-3841)
// ---------------------------------------------------------------------------

// g.bw(Xj, Cs0) — inherits from ChannelHandler

/**
 * On session established — dispatches "m" event.
 * [was: Xj.prototype.gI]
 */
// Xj.prototype.gI = function() { this.W.dispatchEvent("m") }

/**
 * On message — wraps in JGD (WebChannelMessage) and dispatches.
 * [was: Xj.prototype.Xl]
 */
// Xj.prototype.Xl = function(Q) { this.W.dispatchEvent(new JGD(Q)) }

/**
 * On error — wraps in Rw9 (WebChannelError) and dispatches.
 * [was: Xj.prototype.Da]
 */
// Xj.prototype.Da = function(Q) { this.W.dispatchEvent(new Rw9(Q)) }

/**
 * On close — dispatches "n" event.
 * [was: Xj.prototype.hT]
 */
// Xj.prototype.hT = function() { this.W.dispatchEvent("n") }

/**
 * Returns channel debug info.
 * [was: Ai.prototype.j] (lines 3842-3844)
 */
// Ai.prototype.j = function() { return new ep(this, this.W) }

// ---------------------------------------------------------------------------
// ChannelDebugInfo prototype [was: ep] (lines 3846-3863)
// ---------------------------------------------------------------------------

/**
 * Returns active request count in the connection pool.
 * [was: ep.prototype.O]
 */
// ep.prototype.O = function() { return px(this.W.O) }

/**
 * Returns outstanding maps (unsent data).
 * [was: ep.prototype.A]
 */
// ep.prototype.A = function() { return zwo(this.W).map(...) }

/**
 * Sets the commit callback on the browser channel.
 * [was: ep.prototype.commit]
 */
// ep.prototype.commit = function(Q) { this.W.Re = Q }

// ---------------------------------------------------------------------------
// StatEvent infrastructure (lines 3865-3871)
// ---------------------------------------------------------------------------

/** Global stat event target [was: B$] */
// var B$ = new g.$R

/** StatEvent class [was: k$a] */
// class k$a extends g.tG { constructor() { super("statevent", B$) } }

// ---------------------------------------------------------------------------
// LegacyChannelRequest prototype methods [was: qW] (lines 3872-3977)
// ---------------------------------------------------------------------------

// Prototype field declarations (lines 3873-3891):
// qW.prototype.uG = null       — requestHeaders (was: SH in rzv)
// qW.prototype.W4 = false      — succeeded
// qW.prototype.ST = null       — watchdogTimerId
// qW.prototype.Vx = null       — watchdogDeadline
// qW.prototype.Jg = null       — startTime
// qW.prototype.kD = null       — requestType
// qW.prototype.kV = null       — requestUri
// qW.prototype.Xh = null       — adjustedUri
// qW.prototype.hD = null       — postBody
// qW.prototype.hI = null       — xhr
// qW.prototype.Hr = 0          — parseOffset
// qW.prototype.Jc = null       — responseData
// qW.prototype.gK = null       — httpMethod
// qW.prototype.YC = null       — lastError
// qW.prototype.HQ = -1         — statusCode
// qW.prototype.L9 = true       — keepConnectionOpen
// qW.prototype.gY = false      — cancelled
// qW.prototype.ob = 0          — throttleCount
// qW.prototype.Dd = null       — throttleTimer

/**
 * Sets the request timeout for legacy requests.
 * [was: qW.prototype.setTimeout] (lines 3895-3897)
 */
// qW.prototype.setTimeout = function(Q) { this.O = Q }

/**
 * XHR readystatechange handler.
 * [was: qW.prototype.nG] (lines 3899-3903)
 */
// qW.prototype.nG = function(Q) { ... }

/**
 * Main data handler for legacy requests — processes streaming chunks.
 * [was: qW.prototype.H0] (lines 3905-3957)
 */
// qW.prototype.H0 = function(Q) { ... }

/**
 * Cancels the legacy request.
 * [was: qW.prototype.cancel] (lines 3959-3962)
 */
// qW.prototype.cancel = function() { this.gY = true; NW(this) }

/**
 * Watchdog timeout for legacy requests.
 * [was: qW.prototype.Vk] (lines 3964-3972)
 */
// qW.prototype.Vk = function() { ... }

/**
 * Returns the last error code for legacy requests.
 * [was: qW.prototype.getLastError] (lines 3974-3976)
 */
// qW.prototype.getLastError = function() { return this.YC }

// ---------------------------------------------------------------------------
// LoungeTransport prototype methods [was: rzv] (lines 3978-4089)
// ---------------------------------------------------------------------------

// Prototype field declarations (lines 3979-3986):
// rzv.prototype.SH = null     — requestHeaders
// rzv.prototype.eM = null     — testRequest
// rzv.prototype.In = false    — hostPrefixVerified
// rzv.prototype.Ff = null     — testPath
// rzv.prototype.YA = null     — testPhase
// rzv.prototype.Q_ = -1      — statusCode
// rzv.prototype.JN = null     — hostPrefix
// rzv.prototype.Tu = null     — hostSuffix

/**
 * Connects the lounge transport.
 * [was: rzv.prototype.connect] (lines 3987-4001)
 */
// rzv.prototype.connect = function(Q) { ... }

/**
 * Image ping result handler.
 * [was: rzv.prototype.K8] (lines 4003-4014)
 */
// rzv.prototype.K8 = function(Q) { ... }

/**
 * Creates an XHR for the transport.
 * [was: rzv.prototype.Yd] (lines 4016-4018)
 */
// rzv.prototype.Yd = function(Q) { return this.W.Yd(Q) }

/**
 * Aborts the current test request.
 * [was: rzv.prototype.abort] (lines 4020-4024)
 */
// rzv.prototype.abort = function() { ... }

/**
 * Returns false (transport is never "closed").
 * [was: rzv.prototype.NK] (lines 4026-4028)
 */
// rzv.prototype.NK = function() { return false }

/**
 * Handles incoming data during transport test phases.
 * [was: rzv.prototype.JT] (lines 4030-4058)
 */
// rzv.prototype.JT = function(Q, c) { ... }

/**
 * Handles request completion during transport test.
 * [was: rzv.prototype.Rb] (lines 4061-4076)
 */
// rzv.prototype.Rb = function() { ... }

/**
 * Delegates useSecondaryDomain to the channel.
 * [was: rzv.prototype.sF] (lines 4078-4080)
 */
// rzv.prototype.sF = function() { return this.W.sF() }

/**
 * Delegates isActive to the channel.
 * [was: rzv.prototype.isActive] (lines 4082-4084)
 */
// rzv.prototype.isActive = function() { return this.W.isActive() }

/**
 * Delegates server reachability event to the channel.
 * [was: rzv.prototype.jb] (lines 4086-4088)
 */
// rzv.prototype.jb = function(Q) { this.W.jb(Q) }

// ---------------------------------------------------------------------------
// LegacyBrowserChannel prototype methods [was: ZD] (lines 4090-4338)
// ---------------------------------------------------------------------------

// Prototype field declarations (lines 4091-4112):
// ZD.prototype.SM = null       — initialHeaders
// ZD.prototype.ZK = null       — extraParams
// ZD.prototype.UE = null       — forwardChannelRequest
// ZD.prototype.eQ = null       — backChannelRequest
// ZD.prototype.m0 = null       — basePath
// ZD.prototype.l_ = null       — baseUri
// ZD.prototype.l5 = null       — backChannelUri
// ZD.prototype.Ex = null       — backChannelSubdomain
// ZD.prototype.cQ = 0          — mapIdCounter
// ZD.prototype.Sd = 0          — (unused counter)
// ZD.prototype.Ws = null       — handler
// ZD.prototype.wx = null       — forwardChannelRetryTimer
// ZD.prototype.K3 = null       — backChannelRetryTimer
// ZD.prototype.XY = null       — staleBackChannelTimer
// ZD.prototype.P4 = null       — transport (LoungeTransport)
// ZD.prototype.jH = null       — useBuffering
// ZD.prototype.Ea = -1         — lastAcknowledgedArrayId
// ZD.prototype.sL = -1         — lastServerArrayId
// ZD.prototype.Rp = -1         — serverReachabilityStatus
// ZD.prototype.FR = 0          — forwardChannelRetryCount
// ZD.prototype.RV = 0          — backChannelRetryCount
// ZD.prototype.DR = 8          — protocolVersion

/**
 * Error code enum for BrowserChannel disconnections.
 * [was: iG1] (lines 4113-4125)
 */
export const ChannelErrorCode = { // was: iG1
  lookupEntity: 0,                   // was: OK
  NETWORK_ERROR: 2,        // was: seF
  NO_DATA: 4,              // was: YE
  REQUEST_FAILED: 5,       // was: hx
  BLOCKED: 6,              // was: YCH
  STOP: 7,                 // was: STOP
  CLOSE: 8,                // was: jU
  REACHABILITY_FAIL: 9,    // was: Dc
  TIMEOUT: 10,             // was: Up
  UNKNOWN_SESSION: 11,     // was: u2
  BAD_RESPONSE: 12,        // was: U3
};

/**
 * Connects the legacy channel.
 * [was: ZD.prototype.connect] (lines 4129-4138)
 *
 * @param {string} path [was: Q]
 * @param {string} basePath [was: c]
 * @param {Object} [extraParams] [was: W]
 * @param {string} [osid] [was: m]
 * @param {number} [oaid] [was: K]
 */
// ZD.prototype.connect = function(Q, c, W, m, K) { ... }

/**
 * Disconnects, sending a terminate request via Image src.
 * [was: ZD.prototype.disconnect] (lines 4140-4157)
 */
// ZD.prototype.disconnect = function() { ... }

/**
 * Starts transport test phase.
 * [was: ZD.prototype.B2] (lines 4159-4164)
 */
// ZD.prototype.B2 = function(Q) { ... }

/**
 * Returns true if channel is closed.
 * [was: ZD.prototype.NK] (lines 4166-4168)
 */
// ZD.prototype.NK = function() { return this.W == 0 }

/**
 * Returns current channel state.
 * [was: ZD.prototype.getState] (lines 4170-4172)
 */
// ZD.prototype.getState = function() { return this.W }

/**
 * Forward channel ready callback.
 * [was: ZD.prototype.dI] (lines 4174-4177)
 */
// ZD.prototype.dI = function(Q) { this.wx = null; q_W(this, Q) }

/**
 * Back channel ready callback — creates rpc request.
 * [was: ZD.prototype.Za] (lines 4179-4192)
 */
// ZD.prototype.Za = function() { ... }

/**
 * Processes incoming data for the legacy channel.
 * Handles handshake (state 2), message routing (state 3),
 * session ID extraction, and stop/close commands.
 * [was: ZD.prototype.JT] (lines 4194-4244)
 */
// ZD.prototype.JT = function(Q, c) { ... }

/**
 * Stale back channel timer handler.
 * [was: ZD.prototype.RZ] (lines 4246-4252)
 */
// ZD.prototype.RZ = function() { ... }

/**
 * Request completion handler — routes to forward/back channel logic.
 * [was: ZD.prototype.Rb] (lines 4254-4306)
 */
// ZD.prototype.Rb = function(Q) { ... }

/**
 * Validates the channel is in one of the expected states.
 * [was: ZD.prototype.YF] (lines 4308-4311)
 */
// ZD.prototype.YF = function(Q) { if (!g.c9(arguments, this.W)) throw Error(...) }

/**
 * Reachability probe result handler.
 * [was: ZD.prototype.Dj] (lines 4313-4316)
 */
// ZD.prototype.Dj = function(Q) { Q ? xr() : (xr(), tHi(this, 8)) }

/**
 * Creates an XHR for legacy requests (no secondary domain).
 * [was: ZD.prototype.Yd] (lines 4318-4324)
 */
// ZD.prototype.Yd = function(Q) { ... return new g.aY }

/**
 * Returns whether the handler is active.
 * [was: ZD.prototype.isActive] (lines 4326-4328)
 */
// ZD.prototype.isActive = function() { return !!this.Ws && this.Ws.isActive(this) }

/**
 * Dispatches a ServerReachabilityEvent.
 * [was: ZD.prototype.jb] (lines 4330-4333)
 */
// ZD.prototype.jb = function(Q) { B$.dispatchEvent(new Aza(B$, Q)) }

/**
 * Returns false (legacy channel never uses secondary domain).
 * [was: ZD.prototype.sF] (lines 4335-4337)
 */
// ZD.prototype.sF = function() { return false }

// new xHo; — (line 4339) instantiates global

// ---------------------------------------------------------------------------
// LegacyChannelHandler (no-op base) [was: NVS] (lines 4340-4358)
// ---------------------------------------------------------------------------

/**
 * Base no-op handler for the legacy BrowserChannel.
 * [was: NVS]
 */
export class LegacyChannelHandler { // was: NVS
  /** Called when session opens. [was: GY] */
  onOpened() {} // was: GY

  /** Called when a message is received. [was: B0] */
  onMessage() {} // was: B0

  /** Called when forward channel maps are delivered. [was: v0] */
  onMapsDelivered() {} // was: v0

  /** Called on disconnect. [was: LV] */
  onDisconnected() {} // was: LV

  /** Called on close. [was: b8] */
  onClosed() {} // was: b8

  /** Returns extra headers to send. [was: Nn] */
  getHeaders() { return {}; } // was: Nn

  /** Returns whether the handler is active. */
  isActive() { return true; }
}

// ---------------------------------------------------------------------------
// Queue [was: iOS] (lines 4359-4396)
// ---------------------------------------------------------------------------

/**
 * Double-ended queue using two arrays.
 * [was: iOS]
 */
// iOS.prototype.enqueue = function(Q) { this.O.push(Q) }
// iOS.prototype.isEmpty = function() { return this.W.length === 0 && this.O.length === 0 }
// iOS.prototype.clear = function() { this.W = []; this.O = [] }
// iOS.prototype.contains = function(Q) { return g.c9(this.W, Q) || g.c9(this.O, Q) }
// iOS.prototype.remove = function(Q) { ... }
// iOS.prototype.z$ = function() { ... return Q (all items) }

// ---------------------------------------------------------------------------
// Channel event types (lines 4397-4408)
// ---------------------------------------------------------------------------

/**
 * Event fired when a channel message is received.
 * [was: yda]
 */
export class ChannelMessageEvent extends DomEvent { // was: yda
  constructor(message) {
    super("channelMessage");
    this.message = message; // was: this.message = Q
  }
}

/**
 * Event fired when a channel error occurs.
 * [was: S2a]
 */
export class ChannelErrorEvent extends DomEvent { // was: S2a
  constructor(error) {
    super("channelError");
    this.error = error; // was: this.error = Q
  }
}

// ---------------------------------------------------------------------------
// RetryTimer [was: gN] (lines 4410-4443)
// ---------------------------------------------------------------------------

/**
 * Exponential backoff retry timer with jitter.
 * Extends Disposable.
 * [was: gN]
 */
// g.bw(gN, g.qK)

/**
 * Handles retry — doubles delay, triggers callback, restarts if needed.
 * [was: gN.prototype.aj]
 */
// gN.prototype.aj = function() { this.retryCount++; this.eW = Math.min(3E5, this.eW * 2); ... }

/**
 * Returns the retry count.
 * [was: gN.prototype.WY]
 */
// gN.prototype.WY = function() { return this.retryCount }

/**
 * Starts the retry timer with jitter (delay + 0-15s random).
 * [was: gN.prototype.start]
 */
// gN.prototype.start = function() { const Q = this.eW + 15E3 * Math.random(); ... }

/**
 * Stops the retry timer.
 * [was: gN.prototype.stop]
 */
// gN.prototype.stop = function() { this.W.stop(); this.jI = 0 }

/**
 * Returns whether the timer is active.
 * [was: gN.prototype.isActive]
 */
// gN.prototype.isActive = function() { return this.W.isActive() }

/**
 * Resets the retry count and delay.
 * [was: gN.prototype.reset]
 */
// gN.prototype.reset = function() { this.W.stop(); this.retryCount = 0; this.eW = 5E3 }

// ---------------------------------------------------------------------------
// LoungeSessionHandler [was: Oq] (lines 4444-4611)
// ---------------------------------------------------------------------------

/**
 * Lounge session handler — manages PubSub, BrowserChannel lifecycle,
 * reconnection with RetryTimer, lounge token, and message routing.
 * Extends LegacyChannelHandler (NVS).
 * [was: Oq]
 */
// g.bw(Oq, NVS)

/**
 * Subscribes to a named event.
 * [was: Oq.prototype.subscribe]
 */
// Oq.prototype.subscribe = function(Q, c, W) { return this.J.subscribe(Q, c, W) }

/**
 * Unsubscribes from a named event.
 * [was: Oq.prototype.unsubscribe]
 */
// Oq.prototype.unsubscribe = function(Q, c, W) { return this.J.unsubscribe(Q, c, W) }

/**
 * Batch unsubscribe.
 * [was: Oq.prototype.bU]
 */
// Oq.prototype.bU = function(Q) { return this.J.bU(Q) }

/**
 * Publishes an event.
 * [was: Oq.prototype.publish]
 */
// Oq.prototype.publish = function(Q, c) { return this.J.publish.apply(this.J, arguments) }

/**
 * Disposes the handler — stops retry, disconnects channel.
 * [was: Oq.prototype.dispose] (lines 4462-4470)
 */
// Oq.prototype.dispose = function() { ... }

/**
 * Returns true if disposed.
 * [was: Oq.prototype.u0]
 */
// Oq.prototype.u0 = function() { return this.Y }

/**
 * Connects to the lounge server via BrowserChannel.
 * [was: Oq.prototype.connect] (lines 4476-4501)
 *
 * @param {Object} [params] [was: Q]
 * @param {number} [disconnectReason] [was: c]
 * @param {Object} [testResults] [was: W]
 */
// Oq.prototype.connect = async function(Q, c, W) { ... }

/**
 * Disconnects the lounge session.
 * [was: Oq.prototype.disconnect] (lines 4503-4515)
 */
// Oq.prototype.disconnect = function(Q) { ... }

/**
 * Sends a message via the browser channel, queuing if not connected.
 * [was: Oq.prototype.sendMessage] (lines 4517-4538)
 *
 * @param {string} command [was: Q] - the _sc command name
 * @param {Object} [data] [was: c] - message payload
 */
// Oq.prototype.sendMessage = async function(Q, c) { ... }

/**
 * Called when BrowserChannel session opens. Resets retry, flushes queue.
 * [was: Oq.prototype.GY] (lines 4540-4563)
 */
// Oq.prototype.GY = function() { ... }

/**
 * Called on disconnect error. Starts retry timer.
 * [was: Oq.prototype.LV] (lines 4566-4575)
 */
// Oq.prototype.LV = function(Q) { ... }

/**
 * Called when channel closes. Re-queues unsent maps.
 * [was: Oq.prototype.b8] (lines 4577-4590)
 */
// Oq.prototype.b8 = function(Q, c) { ... }

/**
 * Called when forward channel maps are acknowledged.
 * [was: Oq.prototype.v0] (lines 4592-4594)
 */
// Oq.prototype.v0 = function(Q, c) { ... }

/**
 * Returns extra query params including gsessionid, UI code, version.
 * [was: Oq.prototype.Nn] (lines 4596-4605)
 */
// Oq.prototype.Nn = function() { ... }

/**
 * Handles incoming messages: session ID ("S"), gracefulReconnect, or data.
 * [was: Oq.prototype.B0] (lines 4607-4611)
 */
// Oq.prototype.B0 = function(Q) { ... }

/**
 * Returns whether the channel is in OPENED state (state 3).
 * [was: Oq.prototype.Oi] (lines 4613-4615)
 */
// Oq.prototype.Oi = function() { return !!this.W && this.W.getState() == 3 }

/**
 * Sets the lounge ID token for authentication.
 * [was: Oq.prototype.dN] (lines 4617-4624)
 */
// Oq.prototype.dN = function(Q) { ... }

/**
 * Returns the device ID from session config.
 * [was: Oq.prototype.getDeviceId] (lines 4626-4628)
 */
// Oq.prototype.getDeviceId = function() { return this.b0.id }

/**
 * Returns time until next retry in ms, or NaN if not retrying.
 * [was: Oq.prototype.nY] (lines 4630-4632)
 */
// Oq.prototype.nY = function() { ... }

/**
 * Forces an immediate retry.
 * [was: Oq.prototype.ip] (lines 4634-4638)
 */
// Oq.prototype.ip = function() { ... }

/**
 * Retry timer callback — reconnects when no requests are pending.
 * [was: Oq.prototype.Pt] (lines 4640-4643)
 */
// Oq.prototype.Pt = function() { ... }

// ---------------------------------------------------------------------------
// HttpRequestHelper [was: G6] (lines 4645-4675)
// ---------------------------------------------------------------------------

/**
 * Helper for making HTTP requests with JSON or RAW format.
 * [was: G6]
 */
export class HttpRequestHelper { // was: G6
  /**
   * Sends an HTTP request.
   * [was: G6.prototype.sendRequest]
   *
   * @param {string} method [was: Q]
   * @param {string} url [was: c]
   * @param {Object} [postParams] [was: W]
   * @param {Function} onSuccess [was: m]
   * @param {Function} onError [was: K]
   * @param {boolean} [rawFormat] [was: T] - if true, returns raw text
   * @param {boolean} [withCredentials] [was: r]
   * @returns {XMLHttpRequest}
   */
  sendRequest(method, url, postParams, onSuccess, onError, rawFormat, withCredentials) { // was: sendRequest
    const options = {
      format: rawFormat ? "RAW" : "JSON",
      method: method, // was: Q
      context: this,
      timeout: 5000,
      withCredentials: !!withCredentials,
      onSuccess: partial(this.onRequestSuccess, onSuccess, !rawFormat), // was: g.sO(this.j, m, !T)
      onError: partial(this.onRequestError, onError), // was: g.sO(this.A, K)
      onTimeout: partial(this.onRequestTimeout, onError), // was: g.sO(this.K, K)
    };
    if (postParams) {
      options.postParams = postParams;
      options.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    }
    return sendXhrRequest(url, options);
  }

  /**
   * Success handler — parses JSON or returns raw text.
   * [was: G6.prototype.j]
   */
  onRequestSuccess(callback, isJson, _xhr, responseData) { // was: j
    isJson ? callback(responseData) : callback({ text: _xhr.responseText });
  }

  /**
   * Error handler.
   * [was: G6.prototype.A]
   */
  onRequestError(callback, xhr) { // was: A
    callback(Error("Request error: " + xhr.status));
  }

  /**
   * Timeout handler.
   * [was: G6.prototype.K]
   */
  onRequestTimeout(callback) { // was: K
    callback(Error("request timed out"));
  }
}

// ---------------------------------------------------------------------------
// BrowserChannelTransport [was: GQa] (lines 4677-4743)
// ---------------------------------------------------------------------------

/**
 * Wraps a LoungeSessionHandler (Oq) to provide EventTarget-based API.
 * Used by the old BrowserChannel codepath.
 * [was: GQa]
 */
export class BrowserChannelTransport extends EventTargetBase { // was: GQa
  /**
   * @param {Function} handlerFactory [was: Q] - returns an Oq instance
   * @param {string} screenId [was: c]
   */
  constructor(handlerFactory, screenId) {
    super();
    this.handler = handlerFactory(); // was: this.handler = Q()
    this.handler.subscribe("handlerOpened", this.onOpened, this); // was: W
    this.handler.subscribe("handlerClosed", this.onClosed, this);
    this.handler.subscribe("handlerError", (NetworkErrorCode, isAuth) => {
      this.onError(isAuth);
    });
    this.handler.subscribe("handlerMessage", this.onMessage, this);
    this.screenId = screenId; // was: this.O = c
  }

  connect(params, disconnectReason, testResults) { // was: connect(Q, c, W)
    this.handler.connect(params, disconnectReason, testResults);
  }

  disconnect(reason) { // was: disconnect(Q)
    this.handler.disconnect(reason);
  }

  ip() {
    this.handler.ip();
  }

  getDeviceId() {
    return this.handler.getDeviceId();
  }

  startIconMorphAnimation() {
    return this.handler.startIconMorphAnimation();
  }

  /** Returns whether the underlying channel is connected. [was: Oi] */
  isConnected() { // was: Oi
    return this.handler.Oi();
  }

  /** Dispatches channelOpened, saves session state to storage. [was: W] */
  onOpened() { // was: W
    this.dispatchEvent("channelOpened");
    const handler = this.handler;
    const screenId = this.screenId;

    // Persist browser channel state for reconnection
    storageSet("yt-remote-session-browser-channel", {
      firstTestResults: [""],
      secondTestResults: !handler.W.jH, // was: !Q.W.jH — useBuffering
      sessionId: handler.W.j,            // was: Q.W.j
      arrayId: handler.W.Ea,             // was: Q.W.Ea
    });
    storageSet("yt-remote-session-screen-id", screenId);

    // Add current screen to connected screens list
    const connectedScreens = Hg(); // was: Q = Hg()
    const currentScreen = ia(); // was: c = ia()
    if (!contains(connectedScreens, currentScreen)) {
      connectedScreens.push(currentScreen);
    }
    YN9(connectedScreens); // was: YN9(Q)
    yE();
  }

  onClosed() {
    this.dispatchEvent("channelClosed");
  }

  onMessage(message) { // was: onMessage(Q)
    this.dispatchEvent(new ChannelMessageEvent(message));
  }

  onError(isAuthError) { // was: onError(Q)
    this.dispatchEvent(new ChannelErrorEvent(isAuthError ? 1 : 0));
  }

  sendMessage(command, data) { // was: sendMessage(Q, c)
    this.handler.sendMessage(command, data);
  }

  /** Sets the lounge ID token. [was: dN] */
  setLoungeIdToken(token) { // was: dN(Q)
    this.handler.dN(token);
  }

  dispose() {
    this.handler.dispose();
  }
}

// ---------------------------------------------------------------------------
// WebChannelSession [was: aEv] (lines 4745-4852)
// ---------------------------------------------------------------------------

/**
 * Modern WebChannel-based lounge session.
 * Uses Ai (WebChannel) instead of ZD (LegacyBrowserChannel).
 * [was: aEv]
 */
export class WebChannelSession { // was: aEv
  /**
   * @param {string} pathPrefix [was: Q]
   * @param {Object} deviceConfig [was: c]
   * @param {Function} [loungeTokenGetter] [was: W]
   */
  constructor(pathPrefix, deviceConfig, loungeTokenGetter = () => "") {
    new ChannelHandlerAdapter(); // was: new Mav
    const pubsub = new AsyncQueue(); // was: m = new g.$K

    this.pathPrefix = pathPrefix; // was: this.pathPrefix = Q
    this.deviceConfig = deviceConfig; // was: this.W = c
    this.loungeTokenGetter = loungeTokenGetter; // was: this.b0 = W
    this.pubsub = pubsub; // was: this.K = m
    this.connectParams = null; // was: this.L
    this.disconnectReason = 0; // was: this.Y = 0
    this.connectUiCode = 0; // was: this.J = 0
    this.channel = null; // was: this.channel
    this.connectionState = 0; // was: this.D = 0
    this.retryTimer = new gN(() => { // was: this.A
      this.retryTimer.isActive();
      this.channel?.j().O() === 0 && this.connect(this.connectParams, this.connectUiCode);
    });
    this.queryParams = {}; // was: this.j
    this.extraParams = {}; // was: this.O
    this.isDisposed = false; // was: this.mF
    this.logger = null; // was: this.logger
    this.messageQueue = []; // was: this.S
    this.lastErrorCode = undefined; // was: this.XS
    this.metricsTracker = new S_9(); // was: this.Ka
    this.forwardChannelMetrics = new FND(); // was: this.T2
    this.backChannelMetrics = new Eum(); // was: this.MM
    this.sessionMetrics = new sY4(); // was: this.Ie
  }

  /**
   * Connects via WebChannel.
   * [was: aEv.prototype.connect] (lines 4773-4798)
   */
  connect(params = {}, uiCode = 0) {
    if (this.connectionState === 2) return; // already connecting
    this.retryTimer.stop();
    this.connectParams = params;
    this.connectUiCode = uiCode;

    P$(this); // clear pending metrics

    const idToken = getConfig("ID_TOKEN"); // was: g.v("ID_TOKEN")
    if (idToken) {
      this.queryParams["x-youtube-identity-token"] = idToken;
    } else {
      delete this.queryParams["x-youtube-identity-token"];
    }

    if (this.deviceConfig) {
      this.extraParams.device = this.deviceConfig.device;
      this.extraParams.name = this.deviceConfig.name;
      this.extraParams.app = this.deviceConfig.app;
      this.extraParams.id = this.deviceConfig.id;
      if (this.deviceConfig.tP) this.extraParams.mdxVersion = `${this.deviceConfig.tP}`;
      if (this.deviceConfig.theme) this.extraParams.theme = this.deviceConfig.theme;
      if (this.deviceConfig.capabilities) this.extraParams.capabilities = this.deviceConfig.capabilities;
      if (this.deviceConfig.cW) this.extraParams.cst = this.deviceConfig.cW;
      if (this.deviceConfig.authuser) this.extraParams.authuser = this.deviceConfig.authuser;
      if (this.deviceConfig.pageId) this.extraParams.pageId = this.deviceConfig.pageId;
    }

    if (this.connectUiCode !== 0) {
      this.extraParams.wrapSafe = `${this.connectUiCode}`;
    } else {
      delete this.extraParams.wrapSafe;
    }

    Object.assign(this.extraParams, this.connectParams);

    this.channel = new Ai(this.pathPrefix, { // was: new Ai
      Ok: "gsessionid",
      Wz: this.queryParams,
      rejectPromise: this.extraParams,
    });
    this.channel.open();
    this.connectionState = 2;
    fEa(this); // setup event listeners
  }

  /**
   * Disconnects the session.
   * [was: aEv.prototype.disconnect] (lines 4800-4807)
   */
  disconnect(reason = 0) {
    this.disconnectReason = reason;
    this.retryTimer.stop();
    P$(this);
    if (this.channel) {
      if (this.disconnectReason !== 0) {
        this.extraParams.wrapSafe = `${this.disconnectReason}`;
      } else {
        delete this.extraParams.wrapSafe;
      }
      this.channel.close();
    }
    this.disconnectReason = 0;
  }

  /**
   * Returns time until next retry or NaN.
   * [was: aEv.prototype.nY]
   */
  startIconMorphAnimation() {
    return this.retryTimer.isActive() ? this.retryTimer.jI - Date.now() : NaN;
  }

  /**
   * Forces an immediate retry.
   * [was: aEv.prototype.ip]
   */
  ip() {
    const timer = this.retryTimer;
    stopAndFire(timer.W);
    timer.start();
  }

  /**
   * Sends a message via the WebChannel.
   * [was: aEv.prototype.sendMessage] (lines 4816-4822)
   */
  sendMessage(command, data) { // was: sendMessage(Q, c)
    if (this.channel) {
      P$(this);
      this.channel.send({ _sc: command, ...data });
    }
  }

  /**
   * Sets the lounge ID token for auth headers.
   * [was: aEv.prototype.dN]
   */
  setLoungeIdToken(token) { // was: dN(Q)
    if (!token) this.retryTimer.stop();
    if (token) {
      this.queryParams["X-YouTube-LoungeId-Token"] = token;
    } else {
      delete this.queryParams["X-YouTube-LoungeId-Token"];
    }
  }

  /**
   * Returns the device ID.
   * [was: aEv.prototype.getDeviceId]
   */
  getDeviceId() {
    return this.deviceConfig ? this.deviceConfig.id : "";
  }

  publish(event, ...args) { return this.pubsub.publish(event, ...args); }
  subscribe(event, callback, context) { return this.pubsub.subscribe(event, callback, context); }
  unsubscribe(event, callback, context) { return this.pubsub.unsubscribe(event, callback, context); }
  bU(subscriptionId) { return this.pubsub.bU(subscriptionId); }

  /**
   * Disposes the session.
   * [was: aEv.prototype.dispose]
   */
  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;
    safeDispose(this.pubsub);
    this.disconnect();
    safeDispose(this.retryTimer);
    this.loungeTokenGetter = () => "";
  }

  /**
   * Returns whether the session is disposed.
   * [was: aEv.prototype.u0]
   */
  isSessionDisposed() { // was: u0
    return this.isDisposed;
  }
}

// ---------------------------------------------------------------------------
// WebChannelTransport [was: vuo] (lines 4854-4902)
// ---------------------------------------------------------------------------

/**
 * Wraps a WebChannelSession to provide EventTarget-based API.
 * [was: vuo]
 */
export class WebChannelTransport extends EventTargetBase { // was: vuo
  /**
   * @param {Function} sessionFactory [was: Q] - returns a WebChannelSession
   */
  constructor(sessionFactory) {
    super();
    this.session = sessionFactory(); // was: this.W = Q()
    this.session.subscribe("webChannelOpened", this.onOpened, this);
    this.session.subscribe("webChannelClosed", this.onClosed, this);
    this.session.subscribe("webChannelError", this.onError, this);
    this.session.subscribe("webChannelMessage", this.onMessage, this);
  }

  connect(params, uiCode) { this.session.connect(params, uiCode); }
  disconnect(reason) { this.session.disconnect(reason); }
  ip() { this.session.ip(); }
  getDeviceId() { return this.session.getDeviceId(); }
  startIconMorphAnimation() { return this.session.startIconMorphAnimation(); }

  /** Returns whether underlying session is in OPENED state. [was: Oi] */
  isConnected() { // was: Oi
    return this.session.connectionState === 3; // was: this.W.D === 3
  }

  onOpened() { this.dispatchEvent("channelOpened"); }
  onClosed() { this.dispatchEvent("channelClosed"); }
  onMessage(message) { this.dispatchEvent(new ChannelMessageEvent(message)); }
  onError() {
    this.dispatchEvent(new ChannelErrorEvent(this.session.lastErrorCode === 401 ? 1 : 0));
  }

  sendMessage(command, data) { this.session.sendMessage(command, data); }

  /** Sets the lounge ID token. [was: dN] */
  setLoungeIdToken(token) { this.session.setLoungeIdToken(token); }

  dispose() { this.session.dispose(); }
}

// ---------------------------------------------------------------------------
// Screen discovery state (lines 4904-4908)
// ---------------------------------------------------------------------------

/** Timestamp of module load [was: MH9] */
const moduleLoadTime = Date.now(); // was: MH9

/** Active screen poller reference [was: le] */
let activeScreenPoller = null; // was: le

/** Circular log buffer (50 entries) [was: CT] */
const logBuffer = Array(50); // was: CT

/** Log buffer write index [was: z6] */
let logIndex = -1; // was: z6

/** Whether logging is muted [was: MW] */
let loggingMuted = false; // was: MW

// ---------------------------------------------------------------------------
// ScreenService (base) [was: Ji] (lines 4909-4924)
// ---------------------------------------------------------------------------

/**
 * Base class for screen service implementations.
 * Extends Disposable (g.W1).
 * [was: Ji]
 */
// g.bw(Ji, g.W1)

/**
 * Returns all screens.
 * [was: Ji.prototype.M4]
 */
// Ji.prototype.M4 = function() { return this.screens }

/**
 * Checks if a screen is in this service.
 * [was: Ji.prototype.contains]
 */
// Ji.prototype.contains = function(Q) { return !!Dn(this.screens, Q) }

/**
 * Gets a screen by ID.
 * [was: Ji.prototype.get]
 */
// Ji.prototype.get = function(Q) { return Q ? te(this.screens, Q) : null }

/**
 * Logs an info message.
 * [was: Ji.prototype.info]
 */
// Ji.prototype.info = function(Q) { ue(this.D, Q) }

// ---------------------------------------------------------------------------
// DIALScreenPoller [was: ZG9] (lines 4926-4990)
// ---------------------------------------------------------------------------

/**
 * Polls the lounge server for a screen paired via DIAL protocol.
 * Uses exponential backoff intervals from FvD array.
 * [was: ZG9]
 */
export class DIALScreenPoller extends ObservableTarget { // was: ZG9
  /**
   * @param {HttpRequestHelper} requestHelper [was: Q]
   * @param {string} pairingCode [was: c]
   * @param {string} dialId [was: W]
   * @param {string} screenName [was: m]
   * @param {boolean} useShortLivedTokens [was: K]
   */
  constructor(requestHelper, pairingCode, dialId, screenName, useShortLivedTokens) {
    super();
    this.requestHelper = requestHelper; // was: this.j = Q
    this.pairingCode = pairingCode; // was: this.S = c
    this.dialId = dialId; // was: this.L = W
    this.screenName = screenName; // was: this.mF = m
    this.useShortLivedTokens = useShortLivedTokens; // was: this.Y = K
    this.retryIndex = 0; // was: this.O = 0
    this.currentRequest = null; // was: this.W = null
    this.retryTimerId = NaN; // was: this.ot = NaN
  }

  start() {
    if (!this.currentRequest && isNaN(this.retryTimerId)) this.poll(); // was: this.A()
  }

  stop() {
    if (this.currentRequest) { this.currentRequest.abort(); this.currentRequest = null; }
    if (!isNaN(this.retryTimerId)) { safeClearTimeout(this.retryTimerId); this.retryTimerId = NaN; }
  }

  /** @override */
  dispose() { // was: WA
    this.stop();
    super.dispose();
  }

  /** Sends the pairing request. [was: ZG9.prototype.A] */
  poll() { // was: A
    this.retryTimerId = NaN;
    this.currentRequest = sendXhrRequest($r(this.requestHelper, "/pairing/get_screen"), {
      method: "POST",
      postParams: { pairing_code: this.pairingCode },
      timeout: 5000,
      onSuccess: (0, bind)(this.onPairingSuccess, this),
      onError: (0, bind)(this.onPairingError, this),
      onTimeout: (0, bind)(this.onPairingTimeout, this),
    });
  }

  /**
   * Handles successful pairing response.
   * [was: ZG9.prototype.D]
   */
  onPairingSuccess(_xhr, data) { // was: D(Q, c)
    this.currentRequest = null;
    const screenData = data.screen || {};
    screenData.dialId = this.dialId;
    screenData.name = this.screenName;

    let tokenRefreshInterval = -1;
    if (
      this.useShortLivedTokens &&
      screenData.shortLivedLoungeToken?.value &&
      screenData.shortLivedLoungeToken?.refreshIntervalMs
    ) {
      screenData.screenIdType = "shortLived";
      screenData.loungeToken = screenData.shortLivedLoungeToken.value;
      tokenRefreshInterval = screenData.shortLivedLoungeToken.refreshIntervalMs;
    }

    this.publish("pairingComplete", new ScreenInfo(screenData), tokenRefreshInterval);
  }

  /**
   * Handles pairing error — retries with backoff.
   * [was: ZG9.prototype.K]
   */
  onPairingError(xhr) { // was: K(Q)
    this.currentRequest = null;
    if (xhr.status && xhr.status === 404) {
      if (this.retryIndex >= DIAL_POLL_INTERVALS.length) {
        this.publish("pairingFailed", Error("DIAL polling timed out"));
      } else {
        const delay = DIAL_POLL_INTERVALS[this.retryIndex];
        this.retryTimerId = safeSetTimeout((0, bind)(this.poll, this), delay);
        this.retryIndex++;
      }
    } else {
      this.publish("pairingFailed", Error("Server error " + xhr.status));
    }
  }

  /**
   * Handles pairing timeout.
   * [was: ZG9.prototype.J]
   */
  onPairingTimeout() { // was: J
    this.currentRequest = null;
    this.publish("pairingFailed", Error("Server not responding"));
  }
}

/**
 * DIAL polling retry intervals in ms.
 * [was: FvD] (line 4990)
 */
const DIAL_POLL_INTERVALS = [2000, 2000, 1000, 1000, 1000, 2000, 2000, 5000, 5000, 10000]; // was: FvD

// ---------------------------------------------------------------------------
// LocalScreenService [was: kr] (lines 4991-5047)
// ---------------------------------------------------------------------------

/**
 * Manages locally-known screens. Periodically refreshes lounge tokens.
 * Extends ScreenService (Ji).
 * [was: kr]
 */
// g.bw(kr, Ji)

/**
 * Starts periodic polling for lounge token refresh.
 * [was: kr.prototype.start] (lines 4993-4999)
 */
// kr.prototype.start = function() { ... }

/**
 * Adds a screen, persists it, and requests a lounge token if needed.
 * [was: kr.prototype.add] (lines 5001-5008)
 */
// kr.prototype.add = function(Q, c) { ... }

/**
 * Removes a screen and persists the change.
 * [was: kr.prototype.remove] (lines 5010-5016)
 */
// kr.prototype.remove = function(Q, c) { ... }

/**
 * Updates a screen's name.
 * [was: kr.prototype.OB] (lines 5018-5026)
 */
// kr.prototype.OB = function(Q, c, W, m) { ... }

/**
 * Disposes the service.
 * [was: kr.prototype.WA] (lines 5028-5031)
 */
// kr.prototype.WA = function() { g.JB(this.W); kr.FS.WA.call(this) }

/**
 * Handles lounge token refresh response.
 * [was: kr.prototype.t9] (lines 5033-5046)
 */
// kr.prototype.t9 = function(Q) { ... }

/**
 * Handles lounge token refresh failure.
 * [was: kr.prototype.bH] (lines 5048-5050)
 */
// kr.prototype.bH = function(Q) { ... }

// ---------------------------------------------------------------------------
// OnlineScreenService [was: rJa] (lines 5052-5134)
// ---------------------------------------------------------------------------

/**
 * Tracks which screens are currently online by polling the server.
 * [was: rJa]
 */
export class OnlineScreenService extends ObservableTarget { // was: rJa
  /**
   * @param {HttpRequestHelper} requestHelper [was: Q]
   * @param {Function} screenProvider [was: c] - returns current screens array
   */
  constructor(requestHelper, screenProvider) {
    super();
    this.logger = screenProvider; // was: this.D = c

    // Initialize online status from storage
    const storedIds = (storageGet("yt-remote-online-screen-ids") || "")
      ? (storageGet("yt-remote-online-screen-ids") || "").split(",")
      : [];
    const statusMap = {};
    const screens = this.logger();
    for (let i = 0; i < screens.length; i++) {
      const id = screens[i].id;
      statusMap[id] = contains(storedIds, id);
    }
    this.onlineStatus = statusMap; // was: this.W = W
    this.requestHelper = requestHelper; // was: this.K = Q
    this.fastCheckPeriod = NaN; // was: this.j
    this.pollTimerId = NaN; // was: this.A
    this.currentRequest = null; // was: this.O
  }

  start() {
    const storedPeriod = parseInt(storageGet("yt-remote-fast-check-period") || "0", 10);
    this.fastCheckPeriod = (now() - 14400000 < storedPeriod) ? 0 : storedPeriod; // was: this.j
    if (this.fastCheckPeriod) {
      scheduleAvailabilityPoll(this); // was: QQ(this)
    } else {
      this.fastCheckPeriod = now() + 300000;
      storageSet("yt-remote-fast-check-period", this.fastCheckPeriod);
      this.pollNow(); // was: this.J()
    }
  }

  isEmpty() { return isEmptyObject(this.onlineStatus); }

  update() {
    const screens = this.logger();
    const filtered = filterObject(this.onlineStatus, function (isOnline, screenId) {
      return isOnline && !!te(screens, screenId);
    }, this);
    updateOnlineStatus(this, filtered); // was: cH(this, c)
  }

  dispose() { // was: WA
    safeClearTimeout(this.pollTimerId);
    this.pollTimerId = NaN;
    if (this.currentRequest) { this.currentRequest.abort(); this.currentRequest = null; }
    super.dispose();
  }

  /** Sends get_screen_availability request. [was: rJa.prototype.J] */
  pollNow() { // was: J
    safeClearTimeout(this.pollTimerId);
    this.pollTimerId = NaN;
    if (this.currentRequest) this.currentRequest.abort();

    const tokenMap = buildTokenMap(this); // was: QKD(this)
    if (rp(tokenMap)) { // has entries
      const url = $r(this.requestHelper, "/pairing/get_screen_availability");
      const params = { lounge_token: objectKeys(tokenMap).join(",") };
      this.currentRequest = this.requestHelper.sendRequest(
        "POST", url, params,
        (0, bind)(this.onAvailabilitySuccess, this, tokenMap),
        (0, bind)(this.onAvailabilityError, this)
      );
    } else {
      updateOnlineStatus(this, {});
      scheduleAvailabilityPoll(this);
    }
  }

  /** Handles availability response. [was: rJa.prototype.Y] */
  onAvailabilitySuccess(tokenMap, data) { // was: Y(Q, c)
    this.currentRequest = null;
    const currentTokens = objectKeys(buildTokenMap(this));
    if (g.y1(currentTokens, objectKeys(tokenMap))) {
      const screens = data.screens || [];
      const statusMap = {};
      for (let i = 0; i < screens.length; i++) {
        statusMap[tokenMap[screens[i].loungeToken]] = screens[i].status === "online";
      }
      updateOnlineStatus(this, statusMap);
      scheduleAvailabilityPoll(this);
    } else {
      this.logMessage("Changing Screen set during request.");
      this.pollNow();
    }
  }

  /** Handles availability error. [was: rJa.prototype.L] */
  onAvailabilityError(error) { // was: L(Q)
    this.logMessage("Screen availability failed: " + error);
    this.currentRequest = null;
    scheduleAvailabilityPoll(this);
  }

  /** Logs a message. [was: rJa.prototype.jB] */
  logMessage(message) { // was: jB
    logMdx("OnlineScreenService", message);
  }
}

// ---------------------------------------------------------------------------
// RemoteScreenService [was: m$] (lines 5136-5240)
// ---------------------------------------------------------------------------

/**
 * Combines LocalScreenService and OnlineScreenService for full
 * remote screen management including DIAL pairing.
 * Extends ScreenService (Ji).
 * [was: m$]
 */
// g.bw(m$, Ji)

/**
 * Starts both local and online screen services.
 * [was: m$.prototype.start] (lines 5138-5143)
 */
// m$.prototype.start = function() { this.O.start(); this.W.start(); ... }

/**
 * Adds a screen via the local service.
 * [was: m$.prototype.add] (lines 5145-5147)
 */
// m$.prototype.add = function(Q, c, W) { this.O.add(Q, c, W) }

/**
 * Removes a screen and updates online status.
 * [was: m$.prototype.remove] (lines 5149-5152)
 */
// m$.prototype.remove = function(Q, c, W) { this.O.remove(Q, c, W); this.W.update() }

/**
 * Updates a screen's name.
 * [was: m$.prototype.OB] (lines 5154-5158)
 */
// m$.prototype.OB = function(Q, c, W, m) { ... }

/**
 * Returns screens, optionally including known-offline ones.
 * [was: m$.prototype.M4] (lines 5160-5164)
 *
 * @param {boolean} [includeOffline] [was: Q]
 * @returns {Array}
 */
// m$.prototype.M4 = function(Q) { ... }

/**
 * Returns only online screens.
 * [was: m$.prototype.VQ] (lines 5166-5170)
 */
// m$.prototype.VQ = function() { ... }

/**
 * Initiates DIAL screen pairing via polling.
 * [was: m$.prototype.nV] (lines 5172-5188)
 *
 * @param {string} pairingCode [was: Q]
 * @param {string} dialId [was: c]
 * @param {string} screenName [was: W]
 * @param {boolean} useShortLived [was: m]
 * @param {Function} onSuccess [was: K]
 * @param {Function} onError [was: T]
 * @returns {Function} stop function
 */
// m$.prototype.nV = function(Q, c, W, m, K, T) { ... }

/**
 * Initiates screen pairing by pairing code (single request).
 * [was: m$.prototype.Fb] (lines 5190-5226)
 *
 * @param {string} pairingCode [was: Q]
 * @param {Function} nameResolver [was: c] - generates unique name
 * @param {Function} onSuccess [was: W]
 * @param {Function} onError [was: m]
 */
// m$.prototype.Fb = function(Q, c, W, m) { ... }

/**
 * Disposes both local and online services.
 * [was: m$.prototype.WA] (lines 5228-5232)
 */
// m$.prototype.WA = function() { g.BN(this.O); g.BN(this.W); m$.FS.WA.call(this) }

/**
 * Handles screen data change from storage — refreshes screens.
 * [was: m$.prototype.wb] (lines 5234-5238)
 */
// m$.prototype.wb = function() { od9(this); this.publish("screenChange"); this.W.update() }

// m$.prototype.dispose = m$.prototype.dispose (line 5240)

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  castExtensionId,
  castApiInstance,
  shouldLoadCastFramework,
  CAST_EXTENSION_IDS,
  INVALID_CHUNK,
  INCOMPLETE_CHUNK,
  ChannelErrorCode,
  ChannelMapEntry,
  DIAL_POLL_INTERVALS,
  moduleLoadTime,
  activeScreenPoller,
  logBuffer,
  logIndex,
  loggingMuted,
};
