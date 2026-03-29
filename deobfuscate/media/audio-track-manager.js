/**
 * Audio track management — base abstraction, stream-specific DRM key rotation,
 * and adaptive (Widevine) key lifecycle.
 *
 * Extracted from base.js lines ~95778–95903.
 *
 * Contains:
 * - `BaseAudioTrack`     [was: U9a] — empty base class extending EventTarget
 * - `StreamAudioTrack`   [was: ISW] — FairPlay DRM key-rotation handler for
 *   stream-based audio tracks
 * - `AdaptiveAudioTrack` [was: X94] — Widevine key-request scheduling with
 *   jittered delays for adaptive audio tracks
 *
 * Surrounding context (not extracted but referenced):
 * - `DrmLicenseSession` [was: AHa] (lines ~95943–96064) — per-session DRM
 *   license state (key statuses, provisioning, retry)
 * - `DrmTrackTypes` [was: OJx] — DRM track-type enum
 * - `MediaKeySession` wrapper [was: Zj] (lines ~96066–96124)
 * - `MediaKeySystemAccess` wrapper [was: gF] (lines ~96126–96196)
 *
 * @module audio-track-manager
 */

import { Disposable } from '../core/disposable.js'; // was: g.qK
import { EventTarget } from '../core/events.js';     // was: g.W1
import { Timer } from '../core/timer.js';             // was: g.Uc
import { now } from '../core/timing.js';              // was: g.h
import { registerDisposable } from '../core/event-system.js'; // was: g.F
import { isEmptyObject } from '../core/object-utils.js';
import { parseUri, encodeParam } from '../core/url-utils.js';
import { toString } from '../core/string-utils.js';
import { slice } from '../core/array-utils.js';
import { dispose } from '../ads/dai-cue-range.js';

// ============================================================================
// BaseAudioTrack  [was: U9a]
// ============================================================================

/**
 * Abstract base class for audio tracks. Extends the framework's event target
 * so that subclasses can publish lifecycle events (`rotated_need_key_info_ready`,
 * `log_qoe`, etc.) consumed by the player and DRM subsystems.
 *
 * [was: U9a]
 *
 * @extends EventTarget
 */
export class BaseAudioTrack extends EventTarget { // was: U9a extends g.W1
  // Intentionally empty — the base provides only the pub/sub surface from
  // EventTarget. Concrete behaviour lives in the subclasses below.
}


// ============================================================================
// StreamAudioTrack  [was: ISW]
// ============================================================================

/**
 * FairPlay stream-based audio track with automatic key-rotation.
 *
 * Listens to `"fairplay_next_need_key_info"` events from the DRM subsystem.
 * When a new crypto-period index (CPI) arrives, it buffers the key-info
 * records and, on a jittered timer, rewrites the FairPlay `skd://` URI with
 * the updated CPI, then publishes `"rotated_need_key_info_ready"` carrying a
 * fresh `initData` blob.
 *
 * Timer layout:
 *   - `pollTimer` (O) — periodic re-check at `pollIntervalMs` [was: Q param]
 *   - `dispatchTimer` (j) — jittered dispatch within `jitterWindowMs` [was: W param]
 *
 * [was: ISW]
 *
 * @extends BaseAudioTrack
 */
export class StreamAudioTrack extends BaseAudioTrack { // was: ISW extends U9a
  /**
   * @param {number} pollIntervalMs   [was: Q] — interval between poll cycles
   * @param {number} retryIntervalMs  [was: c] — retry interval after dispatch
   * @param {number} jitterWindowMs   [was: W] — random jitter window for dispatch
   * @param {object} drmEventSource   [was: m] — DRM event emitter
   */
  constructor(pollIntervalMs, retryIntervalMs, jitterWindowMs, drmEventSource) {
    super();

    /** @type {number} Current crypto-period index (-1 = uninitialised). [was: A] */
    this.cryptoPeriodIndex = -1; // was: this.A = -1

    /**
     * Buffered key-info records, keyed by DRM session key.
     * [was: W]
     * @type {Object<string, string>}
     */
    this.pendingKeyInfos = {}; // was: this.W = {}

    /**
     * @private Dispatch timer — fires once to emit buffered key infos.
     * [was: j]
     */
    this.dispatchTimer = new Timer(this.dispatchKeys, 0, this); // was: new g.Uc(this.K, 0, this)
    registerDisposable(this, this.dispatchTimer);

    /**
     * @private Poll timer — re-arms the dispatch timer at `retryIntervalMs`.
     * [was: O]
     */
    this.pollTimer = new Timer(() => {
      if (!this.isDisposed()) {
        this.dispatchTimer.start(Math.random() * jitterWindowMs);
        this.pollTimer.start(retryIntervalMs);
      }
    }, pollIntervalMs, this); // was: new g.Uc(...)
    registerDisposable(this, this.pollTimer);

    // Listen for FairPlay key-info events.
    drmEventSource.subscribe('fairplay_next_need_key_info', this.onKeyInfo, this);
  }

  /**
   * Handle an incoming FairPlay key-info event.
   *
   * If the new CPI is valid and >= the current one the record is buffered;
   * if a brand-new CPI arrives the pending set is cleared first.
   *
   * [was: D]
   *
   * @param {string} uri        [was: Q] — FairPlay `skd://` URI
   * @param {string} sessionKey [was: c] — DRM session identifier
   */
  onKeyInfo(uri, sessionKey) { // was: D(Q, c)
    if (!uri || !sessionKey) return;

    const newCpi = Number(b_(uri, 'cpi')) * 1 + 1; // was: W
    if (isNaN(newCpi) || newCpi <= 0 || newCpi < this.cryptoPeriodIndex) {
      // Invalid or stale CPI — stop timers and reset.
      this.dispatchTimer.stop();
      this.pollTimer.stop();
      this.cryptoPeriodIndex = -1;
      this.pendingKeyInfos = {};
    } else {
      if (newCpi > this.cryptoPeriodIndex) {
        // New CPI — reset pending set.
        this.cryptoPeriodIndex = newCpi;
        if (!isEmptyObject(this.pendingKeyInfos)) {
          this.pendingKeyInfos = {};
          this.dispatchTimer.stop();
          this.pollTimer.stop();
        }
      }
      this.pendingKeyInfos[sessionKey] = uri;
      this.pollTimer.cw(); // was: this.O.cw() — ensure poll is running
    }
  }

  /**
   * Dispatch all buffered key-info records: for each pending entry, rewrite
   * the `skd://` URI with the current CPI, encode as UTF-16LE `initData`,
   * and publish `"rotated_need_key_info_ready"`.
   *
   * [was: K]
   */
  dispatchKeys() { // was: K()
    for (const sessionKey of Object.keys(this.pendingKeyInfos)) {
      const uri = this.pendingKeyInfos[sessionKey]; // was: this.W[K]
      const parts = parseUri(uri);        // was: W = g.qN(this.W[K])
      const queryPart = parts[6];      // was: m = W[6]
      const newParams = [];            // was: T

      for (const param of queryPart.split('&')) {
        if (param.indexOf('cpi=') === 0) {
          newParams.push('cpi=' + this.cryptoPeriodIndex.toString());
        } else if (param.indexOf('ek=') === 0) {
          newParams.push('ek=' + encodeParam(sessionKey));
        } else {
          newParams.push(param);
        }
      }

      parts[6] = '?' + newParams.join('&');
      const rewrittenUri = 'skd://' + parts.slice(2).join(''); // was: c

      // Encode as UTF-16LE with 4-byte length prefix.
      const byteLength = rewrittenUri.length * 2;      // was: m
      const initData = new Uint8Array(byteLength + 4);  // was: W (reused)
      initData[0] = byteLength % 256;
      initData[1] = (byteLength - initData[0]) / 256;
      for (let i = 0; i < rewrittenUri.length; ++i) {
        initData[i * 2 + 4] = rewrittenUri.charCodeAt(i);
      }

      this.publish(
        'rotated_need_key_info_ready',
        new ir(initData, 'fairplay', true), // was: new ir(W, "fairplay", !0)
      );
    }

    this.pendingKeyInfos = {};
  }

  /** @override Clean up pending key-info buffer. [was: WA] */
  dispose() { // was: WA()
    this.pendingKeyInfos = {};
    super.dispose();
  }
}


// ============================================================================
// AdaptiveAudioTrack  [was: X94]
// ============================================================================

/**
 * Widevine adaptive audio track — manages key-request scheduling with
 * jittered delays to avoid thundering-herd licence requests across
 * concurrent players.
 *
 * Listens to `"widevine_set_need_key_info"` events. When a new
 * crypto-period arrives:
 *   1. Duplicate detection: if the CPI is already queued, skip.
 *   2. Proximity check: if a neighbouring CPI (±1) exists in the format
 *      map, apply a random delay of up to `(maxDelay − 30) s`.
 *   3. Otherwise dispatch immediately via `processKeyRequest`.
 *
 * [was: X94]
 *
 * @extends BaseAudioTrack
 */
export class AdaptiveAudioTrack extends BaseAudioTrack { // was: X94 extends U9a
  /**
   * @param {Map} formatMap       [was: Q] — format ID → format descriptor map (A)
   * @param {object} drmEventSource [was: c] — DRM event emitter
   */
  constructor(formatMap, drmEventSource) {
    super();

    /** @type {Map} Format map for proximity checks. [was: A] */
    this.formatMap = formatMap; // was: this.A = Q

    /**
     * Queue of pending key requests, each `{ time: number, info: object }`.
     * [was: W]
     * @type {Array<{ time: number, info: object }>}
     */
    this.pendingQueue = []; // was: this.W = []

    /**
     * @private Delay timer — fires to process the next queued request.
     * [was: O]
     */
    this.delayTimer = new Timer(() => {
      this.publish('log_qoe', {
        wvagt: 'timer',
        reqlen: this.pendingQueue ? this.pendingQueue.length : -1,
      });

      if (this.pendingQueue) {
        if (this.pendingQueue.length > 0) {
          const next = this.pendingQueue.shift(); // was: W = this.W.shift()
          processKeyRequest(this, next.info);      // was: bJn(this, W.info)
        }
        if (this.pendingQueue.length > 0) {
          const delay = this.pendingQueue[0].time - now(); // was: W = this.W[0].time - (0,g.h)()
          this.delayTimer.start(Math.max(0, delay));
        }
      }
    }, 0); // was: new g.Uc(...)
    registerDisposable(this, this.delayTimer);

    // Subscribe to Widevine key-info events.
    drmEventSource.subscribe('widevine_set_need_key_info', this.onKeyInfo, this);
  }

  /**
   * Handle an incoming Widevine key-info event.
   *
   * Deduplicates by CPI, computes a jittered delay based on format-map
   * proximity, and either dispatches immediately or enqueues.
   *
   * [was: j]
   *
   * @param {object} keyInfo [was: Q] — key-info descriptor with `cryptoPeriodIndex`, `W` (maxDelay)
   */
  onKeyInfo(keyInfo) { // was: j(Q)
    // --- Duplicate check --------------------------------------------------
    let isDuplicate; // was: c
    checkDuplicate: {
      const cpi = keyInfo.cryptoPeriodIndex; // was: c = Q.cryptoPeriodIndex
      if (cpi && this.pendingQueue.length > 0) {
        for (const entry of this.pendingQueue) {
          if (cpi === entry.info.cryptoPeriodIndex) {
            isDuplicate = true;
            break checkDuplicate;
          }
        }
      }
      isDuplicate = false;
    }

    if (isDuplicate) return;

    const currentTime = now(); // was: c = (0, g.h)()

    // --- Proximity check: is there a neighbouring CPI in the format map? ---
    let isProximate; // was: m
    proximityCheck: {
      const cpi = keyInfo.cryptoPeriodIndex; // was: W
      if (!isNaN(cpi)) {
        for (const fmt of this.formatMap.values()) { // was: m of this.A.values()
          if (Math.abs(fmt.cryptoPeriodIndex - cpi) <= 1) {
            isProximate = true;
            break proximityCheck;
          }
        }
      }
      isProximate = false;
    }

    let delayMs; // was: m (reused)
    if (isProximate) {
      const maxDelaySecs = keyInfo.W; // was: m = Q.W
      delayMs = Math.max(0, Math.random() * ((isNaN(maxDelaySecs) ? 120 : maxDelaySecs) - 30)) * 1000;
    } else {
      delayMs = 0;
    }

    this.publish('log_qoe', {
      wvagt: `delay.${delayMs}`,
      cpi: keyInfo.cryptoPeriodIndex,
      reqlen: this.pendingQueue.length,
    });

    if (delayMs <= 0) {
      processKeyRequest(this, keyInfo); // was: bJn(this, Q)
    } else {
      this.pendingQueue.push({ time: currentTime + delayMs, info: keyInfo });
      this.delayTimer.cw(delayMs); // was: this.O.cw(m)
    }
  }

  /** @override Clear the pending queue. [was: WA] */
  dispose() { // was: WA()
    this.pendingQueue = [];
    super.dispose();
  }
}


// ============================================================================
// Helpers (referenced but defined elsewhere)
// ============================================================================

/**
 * Process a key request through the DRM subsystem.
 * [was: bJn]
 *
 * @param {AdaptiveAudioTrack} track
 * @param {object} keyInfo
 */
function processKeyRequest(track, keyInfo) { // was: bJn(this, Q)
  // Implementation lives in the DRM module — forward call.
  bJn(track, keyInfo);
}

/**
 * Complete a seek operation on a CPN format tracker.
 * [was: oVx]
 *
 * @param {CpnFormatTracker} tracker
 */
function onSeekComplete(tracker) { // was: oVx(this)
  oVx(tracker);
}

/**
 * Clear pending CPN-switch notifications for a segment index.
 * [was: UMO]
 */
function clearPendingNotifications(tracker, segmentIndex) { // was: UMO(this, Q)
  UMO(tracker, segmentIndex);
}

/**
 * Schedule a delayed CPN switch at a given media time.
 * [was: IPx]
 */
function scheduleCpnSwitch(tracker, segmentIndex, newCpn, time) { // was: IPx(this, Q, T, K)
  IPx(tracker, segmentIndex, newCpn, time);
}
