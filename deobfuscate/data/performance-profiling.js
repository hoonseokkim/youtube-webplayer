/**
 * performance-profiling.js -- Profile-based performance metrics
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~31993-32213
 *
 * Handles:
 *  - Profile-based performance metric recording (A0n, B1x, e4O)
 *  - PerformanceBucket histogram class (VBn)
 *  - Global performance tracking storage via window.ywc (xBK, qKO)
 *  - Cached binary (WASM) fetching for performance modules (nfw)
 *  - Memory-based metric aggregation with exponential decay (F37)
 *  - Client interface name checks (XC, g.X7, g.uL, etc.)
 */

import { win } from '../proto/messages-core.js';  // was: g.bI
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { toString } from '../core/string-utils.js';
import { readPlayerMemory } from '../ads/ad-async.js';

// ---------------------------------------------------------------------------
// Performance bucket histogram  (~82637-82655)
// [was: VBn]
// ---------------------------------------------------------------------------

/**
 * Histogram thresholds (in ms) for performance bucketing.
 * [was: VT]
 */
const PERF_BUCKET_THRESHOLDS = [20, 100, 500, 2000]; // was: VT

/**
 * Tracks call counts and latency distribution for a single profiled operation.
 *
 * Each instance accumulates a total sample count (`sampleCount`), total latency
 * (`totalLatency`), and per-bucket counts for thresholds defined in
 * `PERF_BUCKET_THRESHOLDS`.
 *
 * [was: VBn]
 */
export class PerformanceBucket {
  constructor() {
    /** Total sample weight [was: this.ZR] */
    this.sampleCount = 0; // was: this.ZR

    /** Cumulative latency in ms [was: this.O] */
    this.totalLatency = 0; // was: this.O

    /**
     * Per-threshold bucket counters.
     * `buckets[i]` counts samples whose (latency / weight) >= PERF_BUCKET_THRESHOLDS[i].
     * [was: this.W]
     */
    this.buckets = Array.from({ length: PERF_BUCKET_THRESHOLDS.length }).fill(0); // was: this.W
  }

  /**
   * Record a sample.
   *
   * @param {number} latency - elapsed time in ms [was: Q]
   * @param {number} [weight=1] - sample weight / multiplier [was: c]
   * [was: Y3]
   */
  addSample(latency, weight = 1) { // was: Y3
    this.sampleCount += weight;
    this.totalLatency += latency;
    const avgLatency = latency / weight;
    for (let i = 0; i < PERF_BUCKET_THRESHOLDS.length && !(avgLatency < PERF_BUCKET_THRESHOLDS[i]); ++i) {
      this.buckets[i] += weight;
    }
  }

  toString() {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Profile-based metric recording  (~31993-32016)
// [was: e4O, A0n, B1x]
// ---------------------------------------------------------------------------

/**
 * Conditionally record a performance profile for the result of an operation
 * that may be a Promise or observable.
 *
 * If `result` is a thenable (Promise) or observable, the recording is deferred
 * until the value resolves; otherwise it records immediately.
 *
 * @param {Object} tracker - performance tracker with `.W` map of PerformanceBucket [was: Q]
 * @param {*} result - the operation result (may be Promise/observable) [was: c]
 * @param {string} profileName - default profile key [was: W]
 * @param {number} startTime - operation start timestamp [was: m]
 * @param {Function} [profileResolver] - optional fn(result) => {ZR, profile} [was: K]
 * @returns {*} the original result, possibly wrapped
 * [was: e4O]
 */
export function recordProfileMetric(tracker, result, profileName, startTime, profileResolver) { // was: e4O
  if (result && typeof result === 'object') {
    const onResolved = (resolvedValue) => recordProfileEntry(tracker, resolvedValue, profileName, startTime, profileResolver); // was: T
    if (isPromiseLike(result)) { // was: Ep(c)
      return result.then(onResolved);
    }
    if (isObservableLike(result)) { // was: dc(c)
      return mapObservable(result, onResolved); // was: j5(c, T)
    }
  }
  return recordProfileEntry(tracker, result, profileName, startTime, profileResolver);
}

/**
 * Core profile entry recorder.  Computes elapsed time, resolves the profile
 * key via `profileResolver`, and pushes a sample into the tracker.
 *
 * @param {Object} tracker - performance tracker [was: Q]
 * @param {*} result - resolved operation result [was: c]
 * @param {string} profileName - default profile key [was: W]
 * @param {number} startTime - operation start timestamp [was: m]
 * @param {Function} [profileResolver] - optional fn(result) => {ZR, profile} [was: K]
 * @returns {*} the result, unchanged
 * [was: A0n]
 */
export function recordProfileEntry(tracker, result, profileName, startTime, profileResolver) { // was: A0n
  const now = getCurrentTimeMs(); // was: T = (0, g.h)()
  const resolved = profileResolver ? profileResolver(result) : undefined; // was: K = K ? K(c) : void 0
  const sampleWeight = resolved?.sampleCount ?? 1; // was: r = K?.ZR ?? 1
  if (sampleWeight !== 0) {
    addTrackerSample(tracker, resolved?.profile ?? profileName, now - startTime, sampleWeight); // was: B1x(Q, K?.profile ?? W, T - m, r)
  }
  return result;
}

/**
 * Push a latency sample into the tracker's PerformanceBucket for the given key.
 *
 * @param {Object} tracker - performance tracker with `.W` map [was: Q]
 * @param {string} key - profile bucket key [was: c]
 * @param {number} latency - elapsed time in ms [was: W]
 * @param {number} [weight=1] - sample weight [was: m]
 * [was: B1x]
 */
export function addTrackerSample(tracker, key, latency, weight = 1) { // was: B1x
  if (latency >= 0) {
    if (!(key in tracker.W)) {
      tracker.W[key] = new PerformanceBucket(); // was: new VBn
    }
    tracker.W[key].addSample(latency, weight); // was: Q.W[c].Y3(W, m)
  }
}

// ---------------------------------------------------------------------------
// Global performance tracking storage  (~32018-32051)
// window.ywc -- keyed cache for binary modules and compiled WASM
// [was: xBK, qKO, nfw]
// ---------------------------------------------------------------------------

/**
 * Get (or create) the global cache entry for the given URL key.
 *
 * Stored on `window.ywc[url]`.
 *
 * @param {string} url - cache key (typically a WASM module URL) [was: Q]
 * @returns {Object} mutable cache record
 * [was: xBK]
 */
export function getGlobalCache(url) { // was: xBK
  const win = window; // was: c
  if (!win.ywc) {
    win.ywc = {};
  }
  let entry = win.ywc[url]; // was: W
  if (entry) return entry;
  entry = {};
  return (win.ywc[url] = entry);
}

/**
 * Remove a global cache entry.
 *
 * @param {string} url - cache key [was: Q]
 * [was: qKO]
 */
export function deleteGlobalCache(url) { // was: qKO
  const win = window; // was: c
  if (win.ywc) {
    delete win.ywc[url];
  }
}

/**
 * Fetch a binary resource (typically WASM), caching the result globally.
 *
 * Returns a Promise<ArrayBuffer>.  On success the raw bytes are also stored
 * in the cache entry's `.bin` property.  On failure the cache entry is purged.
 *
 * @param {string} url - URL to fetch [was: Q]
 * @returns {Promise<ArrayBuffer>}
 * [was: nfw]
 */
export function fetchBinaryCached(url) { // was: nfw
  const entry = getGlobalCache(url); // was: c = xBK(Q)
  if (entry.binP) return entry.binP;

  entry.binP = Promise.resolve()
    .then(() => fetch(url))
    .then((response) => { // was: W
      if (!response.ok) throw Error(`HTTP${response.statusText}`);
      return response.arrayBuffer();
    });

  entry.binP.then(
    (buffer) => { // was: W
      entry.bin = buffer;
    },
    () => {
      deleteGlobalCache(url); // was: qKO(Q)
    }
  );

  return entry.binP;
}

// ---------------------------------------------------------------------------
// Memory-based metric aggregation with exponential decay  (~32189-32213)
// [was: F37]
// ---------------------------------------------------------------------------

/**
 * Aggregate performance metrics using exponential half-life decay,
 * persisting to `yt-player-memory` in local storage.
 *
 * Reads the current stored values, adjusts for elapsed time via half-life
 * decay, and writes the updated snapshot back.
 *
 * @param {Object} state - metric aggregation state [was: Q]
 *   @param {Object} state.values - current raw value accumulations [was: Q.values]
 *   @param {Object} state.halfLives - per-key half-life durations [was: Q.x4]
 *   @param {Object} state.baseline - baseline values for delta computation [was: Q.O]
 *   @param {number} state.elapsedTime - time units elapsed since last snapshot [was: Q.W]
 * [was: F37]
 */
export function aggregateDecayMetrics(state) { // was: F37
  let stored = loadStoredMemoryMetrics(); // was: c = UEO()
  if (stored.values) {
    const storedValues = stored.values; // was: c = c.values
    const decayedOutput = {}; // was: r

    for (const key of Object.keys(state.values)) { // was: W of Object.keys(Q.values)
      if (storedValues[key] && state.baseline[key]) {
        state.values[key] += storedValues[key] - state.baseline[key]; // was: Q.values[W] += c[W] - Q.O[W]
      }

      const ref = state; // was: m = Q, K = m
      if (!ref.values[key]) {
        const fresh = loadStoredMemoryMetrics(); // was: T = UEO()
        ref.values = fresh.values || {};
        ref.halfLives = fresh.halfLives || {}; // was: K.x4 = T.halfLives || {}
        ref.baseline = fresh.values ? Object.assign({}, fresh.values) : {}; // was: K.O = T.values ? ...
      }

      decayedOutput[key] = ref.values[key] && ref.halfLives[key]
        ? ref.values[key] / (2 ** (ref.elapsedTime / ref.halfLives[key]))
        : 0; // was: m.values[W] / 2 ** (m.W / m.x4[W])
    }

    state.baseline = decayedOutput; // was: Q.O = r
  }

  const halfLives = state.halfLives; // was: W = Q.x4
  const output = {}; // was: c = {}
  output.values = state.baseline; // was: c.values = Q.O
  output.halfLives = halfLives; // was: c.halfLives = W
  persistPlayerMemory('yt-player-memory', output, 2592000); // was: g.rl("yt-player-memory", c, 2592E3)
}

// ---------------------------------------------------------------------------
// Client interface name checks  (~32215-32358)
// [was: XC, g.X7, g.uL, g.Ax, g.oc, ZoK, V_, BU, g.eh, g.x5, etc.]
// ---------------------------------------------------------------------------

/**
 * Get the client interface name (e.g. "WEB", "TVHTML5", "WEB_REMIX").
 * [was: cU]
 *
 * @param {Object} config - player config [was: Q]
 * @returns {string}
 */
export function getClientName(config) { // was: cU
  return config.W.c;
}

/**
 * Check if the client interface name contains "web" (case-insensitive).
 * [was: XC]
 */
export function isWebClient(config) { // was: XC
  return /web/i.test(getClientName(config));
}

/**
 * Check if client is WEB_UNPLUGGED (YouTube TV).
 * [was: g.X7]
 */
export function isWebUnplugged(config) { // was: g.X7
  return getClientName(config) === 'WEB_UNPLUGGED';
}

/**
 * Check if client is WEB_REMIX (YouTube Music).
 * [was: g.uL]
 */
export function isWebRemix(config) { // was: g.uL
  return getClientName(config) === 'WEB_REMIX';
}

/**
 * Check if client is WEB_KIDS (YouTube Kids).
 * [was: Dm]
 */
export function isWebKids(config) { // was: Dm
  return getClientName(config) === 'WEB_KIDS';
}

/**
 * Check if client is TVHTML5_SIMPLY_EMBEDDED_PLAYER.
 * [was: ZoK]
 */
export function isSimplyEmbedded(config) { // was: ZoK
  return getClientName(config) === 'TVHTML5_SIMPLY_EMBEDDED_PLAYER';
}

/**
 * Check if the client is any TVHTML5 variant.
 * [was: g.AI]
 */
export function isTvHtml5(config) { // was: g.AI
  return /^TVHTML5/.test(getClientName(config));
}

/**
 * Check if client is exactly TVHTML5.
 * [was: Sh]
 */
export function isTvHtml5Exact(config) { // was: Sh
  return getClientName(config) === 'TVHTML5';
}

/**
 * Check if client is TVHTML5_UNPLUGGED.
 * [was: Zm]
 */
export function isTvUnplugged(config) { // was: Zm
  return getClientName(config) === 'TVHTML5_UNPLUGGED';
}

/**
 * Check if client is WEB_MUSIC_INTEGRATIONS.
 * [was: g.EQ]
 */
export function isWebMusicIntegrations(config) { // was: g.EQ
  return getClientName(config) === 'WEB_MUSIC_INTEGRATIONS';
}

/**
 * Check if client is WEB_EMBEDDED_PLAYER.
 * [was: g.sQ]
 */
export function isWebEmbeddedPlayer(config) { // was: g.sQ
  return getClientName(config) === 'WEB_EMBEDDED_PLAYER';
}

/**
 * Check if client is exactly "WEB" (uppercase).
 * [was: g.rT]
 */
export function isWebExact(config) { // was: g.rT
  return getClientName(config).toUpperCase() === 'WEB';
}

/**
 * Check if event label is "adunit" or playerStyle is "gvn" (ad unit context).
 * [was: V_]
 */
export function isAdUnit(config) { // was: V_
  return config.isSamsungSmartTV === 'adunit' || config.playerStyle === 'gvn';
}

/**
 * Check if event label is "detailpage".
 * [was: BU]
 */
export function isDetailPage(config) { // was: BU
  return config.isSamsungSmartTV === 'detailpage';
}

/**
 * Check if event label is "embedded".
 * [was: g.eh]
 */
export function isEmbedded(config) { // was: g.eh
  return config.isSamsungSmartTV === 'embedded';
}

/**
 * Check if event label is "profilepage".
 * [was: g.x5]
 */
export function isProfilePage(config) { // was: g.x5
  return config.isSamsungSmartTV === 'profilepage';
}

/**
 * Check if event label is "leanback".
 * [was: y_]
 */
export function isLeanback(config) { // was: y_
  return config.isSamsungSmartTV === 'leanback';
}

/**
 * Check if device model is a Chromecast (Ultra or Steak).
 * [was: dBK]
 */
export function isChromecastSteak(config) { // was: dBK
  return config.W.cmodel === 'CHROMECAST ULTRA/STEAK' || config.W.cmodel === 'CHROMECAST/STEAK';
}

/**
 * Get the device pixel ratio (minimum 1).
 * [was: g.F7]
 */
export function getDevicePixelRatio() { // was: g.F7
  return window.devicePixelRatio > 1 ? window.devicePixelRatio : 1;
}

// ---------------------------------------------------------------------------
// Placeholder references (defined elsewhere in the codebase)
// ---------------------------------------------------------------------------

/** @returns {number} current high-res timestamp [was: (0, g.h)()] */
function getCurrentTimeMs() {
  return performance.now();
}

/** Check if value is thenable [was: Ep] */
function isPromiseLike(value) {
  return value && typeof value.then === 'function';
}

/** Check if value is observable-like [was: dc] */
function isObservableLike(value) {
  return value && typeof value.subscribe === 'function';
}

/** Map over an observable [was: j5] */
function mapObservable(obs, fn) {
  return obs; // stub -- actual impl in observables module
}

/** Load stored memory metrics from localStorage [was: readPlayerMemory] */
function loadStoredMemoryMetrics() {
  const result = { values: {}, halfLives: {} };
  try {
    const raw = JSON.parse(JSON.parse(window.localStorage['yt-player-memory']).data);
    result.values = raw.values;
    result.halfLives = raw.halfLives;
  } catch {}
  return result;
}

/** Persist data to localStorage with TTL [was: g.rl] */
function persistPlayerMemory(key, value, ttlSeconds) {
  // stub -- actual impl writes via yt.player localStorage wrapper
}
