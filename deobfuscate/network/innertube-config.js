import { remove, removeAll } from '../core/array-utils.js';
import { toString } from '../core/string-utils.js';
import { InnerTubeTransportService } from './innertube-client.js';
import { adSlotRenderer } from '../core/misc-helpers.js'; // was: nz
import { GcfConfigManager } from '../data/idb-operations.js'; // was: BF
import { forEach } from '../core/event-registration.js';
import { clear } from '../core/array-utils.js';
import { getConfigSingleton } from '../core/attestation.js';

/**
 * Innertube Dependency-Injection Configuration
 *
 * Sets up the DI container (resolver) with all provider registrations needed
 * by the Innertube transport layer: the network manager, ephemeral response
 * store, store-response processor, endpoint command handlers, and the
 * top-level transport singleton.
 *
 * Source: base.js lines 14392–14449 (DI core), 18650–18689 (transport init),
 *         19931–20067 (bootstrapInnertube bootstrap), 66988–66998 (endpoint paths),
 *         68956–68998 (InjectionToken / Resolver classes),
 *         72139–72398 (endpoint handlers, tokens, store classes),
 *         72985–73071 (response processor, network manager)
 *
 * @module network/innertube-config
 */

// ---------------------------------------------------------------------------
// Dependency-injection primitives
// ---------------------------------------------------------------------------

/**
 * Symbol key used to annotate classes / factory descriptors with their
 * injection dependencies.
 * [was: Du]
 */
export const INJECTION_DEPS = Symbol('injectionDeps'); // was: Du

/**
 * A named token used as a key inside the DI container.
 * [was: uu]
 */
export class InjectionToken { // was: uu
  /**
   * @param {string} name  Human-readable token name.
   */
  constructor(name) {
    this.name = name;
  }

  toString() {
    return `InjectionToken(${this.name})`;
  }
}

/**
 * Wrapper indicating that a dependency is optional (may be absent in the
 * resolver without causing an error).
 * [was: x1]
 */
export class OptionalDep { // was: x1
  /**
   * @param {InjectionToken} key
   */
  constructor(key) {
    this.key = key;
  }
}

/**
 * Wrap an injection token to mark the dependency as optional.
 * [was: qg]
 *
 * @param {InjectionToken} token
 * @returns {OptionalDep}
 */
export function optional(token) { // was: qg
  return new OptionalDep(token);
}

// ---------------------------------------------------------------------------
// DI Resolver (singleton container)
// ---------------------------------------------------------------------------

/**
 * The dependency-injection resolver / container.
 *
 * - `providers`  (`this.O`)  — Map of token → provider descriptor
 * - `pendingPromises` (`this.A`) — Map of token → deferred promise
 * - `singletonCache`  (`this.W`) — Map of token → resolved instance
 * - `testHarness`     (`this.Rk`) — Testing helpers (snapshot / override)
 *
 * [was: $qd]
 */
export class Resolver { // was: $qd
  constructor() {
    /** @type {Map<InjectionToken, ProviderDescriptor>} [was: this.O] */
    this.providers = new Map(); // was: this.O

    /** @type {Map<InjectionToken, Deferred>} [was: this.A] */
    this.pendingPromises = new Map(); // was: this.A

    /** @type {Map<InjectionToken, *>} [was: this.W] */
    this.singletonCache = new Map(); // was: this.W

    /**
     * Test harness hooks.
     * [was: this.Rk]
     */
    this.testHarness = { // was: this.Rk
      /** Return a snapshot of all providers. [was: xY2] */
      snapshotProviders: () => new Map(this.providers), // was: xY2

      /**
       * Override a provider and return a rollback function.
       * [was: BXa]
       * @param {ProviderDescriptor} descriptor
       * @returns {Function}  Undo callback.
       */
      overrideProvider: (descriptor) => { // was: BXa
        const previousProvider = this.providers.get(descriptor.token); // was: c
        const previousInstance = this.singletonCache.get(descriptor.token); // was: W
        this.singletonCache.delete(descriptor.token);
        registerProvider(this, descriptor); // was: nL

        return () => {
          this.providers.delete(descriptor.token);
          this.singletonCache.delete(descriptor.token);
          if (previousProvider) registerProvider(this, previousProvider);
          if (previousInstance) this.singletonCache.set(descriptor.token, previousInstance);
        };
      },
    };
  }

  /**
   * Resolve a token (or optional token) from this container.
   * [was: resolve]
   *
   * @param {InjectionToken|OptionalDep} token
   * @returns {*}
   */
  resolve(token) { // was: resolve
    if (token instanceof OptionalDep) { // was: x1
      return resolveProvider(this, token.key, [], true); // was: tb
    }
    return resolveProvider(this, token, []); // was: tb
  }
}

// ---------------------------------------------------------------------------
// Provider registration / resolution helpers
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ProviderDescriptor
 * @property {InjectionToken} token        [was: NP]  — The injection token.
 * @property {*}              [value]      [was: Wr]  — Static value provider.
 * @property {Function}       [factory]    [was: tK]  — Factory function provider.
 * @property {Function}       [useClass]   [was: Ag]  — Class constructor provider.
 * @property {boolean}        [transient]  [was: HUJ] — When true, skip singleton cache.
 */

/**
 * Register a provider inside the resolver. If there is a pending promise
 * waiting for this token it is resolved immediately.
 *
 * [was: nL]
 *
 * @param {Resolver} resolver         [was: Q]
 * @param {ProviderDescriptor} desc   [was: c]  — Descriptor with `.token` (NP).
 */
export function registerProvider(resolver, desc) { // was: nL
  resolver.providers.set(desc.token, desc); // was: Q.O.set(c.NP, c)
  const pending = resolver.pendingPromises.get(desc.token); // was: W
  if (pending) {
    try {
      pending.resolve(resolver.resolve(desc.token)); // was: W.xC(...)
    } catch (err) {
      pending.reject(err); // was: W.SR(err)
    }
  }
}

/**
 * Resolve a single provider, walking the dependency graph.
 *
 * [was: tb]
 *
 * @param {Resolver}        resolver     [was: Q]
 * @param {InjectionToken}  token        [was: c]
 * @param {InjectionToken[]} ancestors   [was: W]   Cycle-detection stack.
 * @param {boolean}         [isOptional] [was: m]
 * @returns {*}
 */
function resolveProvider(resolver, token, ancestors, isOptional = false) { // was: tb
  if (ancestors.indexOf(token) > -1) {
    throw Error(`Deps cycle for: ${token}`);
  }

  // Already resolved as singleton
  if (resolver.singletonCache.has(token)) { // was: Q.W.has(c)
    return resolver.singletonCache.get(token);
  }

  // No provider registered
  if (!resolver.providers.has(token)) { // was: Q.O.has(c)
    if (isOptional) return undefined;
    throw Error(`No provider for: ${token}`);
  }

  const desc = resolver.providers.get(token); // was: m
  ancestors.push(token);

  let instance; // was: K
  if (desc.value !== undefined) { // was: m.Wr
    instance = desc.value;
  } else if (desc.factory) { // was: m.tK
    const deps = desc[INJECTION_DEPS] // was: m[Du]
      ? resolveDeps(resolver, desc[INJECTION_DEPS], ancestors)
      : [];
    instance = desc.factory(...deps);
  } else if (desc.useClass) { // was: m.Ag
    const Ctor = desc.useClass;
    const deps = Ctor[INJECTION_DEPS] // was: K[Du]
      ? resolveDeps(resolver, Ctor[INJECTION_DEPS], ancestors)
      : [];
    instance = new Ctor(...deps);
  } else {
    throw Error(`Could not resolve providers for: ${token}`);
  }

  ancestors.pop();

  // Cache as singleton unless marked transient
  if (!desc.transient) { // was: m.HUJ
    resolver.singletonCache.set(token, instance);
  }
  return instance;
}

/**
 * Resolve an array of dependency tokens, honoring optional wrappers.
 *
 * [was: GO7]
 *
 * @param {Resolver}                        resolver   [was: Q]
 * @param {Array<InjectionToken|OptionalDep>} deps     [was: c]
 * @param {InjectionToken[]}                ancestors  [was: W]
 * @returns {Array<*>}
 */
function resolveDeps(resolver, deps, ancestors) { // was: GO7
  if (!deps) return [];
  return deps.map((dep) =>
    dep instanceof OptionalDep // was: x1
      ? resolveProvider(resolver, dep.key, ancestors, true)
      : resolveProvider(resolver, dep, ancestors)
  );
}

// ---------------------------------------------------------------------------
// Resolver singleton accessor
// ---------------------------------------------------------------------------

/** @type {Resolver|undefined} [was: Hm] */
let resolverSingleton; // was: Hm

/**
 * Return the global DI resolver, creating it on first call.
 * [was: Ng]
 *
 * @returns {Resolver}
 */
export function getResolver() { // was: Ng
  if (!resolverSingleton) {
    resolverSingleton = new Resolver();
  }
  return resolverSingleton;
}

// ---------------------------------------------------------------------------
// Well-known injection tokens
// ---------------------------------------------------------------------------

/** Token for the network manager service.  [was: BVd] */
export const NETWORK_MANAGER_TOKEN = new InjectionToken('NETWORK_MANAGER_TOKEN'); // was: BVd

/** Token for the top-level transport singleton.  [was: FNw] */
export const INNERTUBE_TRANSPORT_TOKEN = new InjectionToken('INNERTUBE_TRANSPORT_TOKEN'); // was: FNw

/** Token for the client name (e.g. 1 = WEB).  [was: VJ] */
export const CLIENT_NAME_TOKEN = new InjectionToken('CLIENT_NAME_TOKEN'); // was: VJ

/** Token for the default store entry expiration (ms).  [was: BI] */
export const DEFAULT_STORE_EXPIRATION_TOKEN = new InjectionToken('DEFAULT_STORE_EXPIRATION_TOKEN'); // was: BI

/** Token for the ephemeral (in-memory) response store.  [was: xO] */
export const EPHEMERAL_STORE_TOKEN = new InjectionToken('EPHEMERAL_STORE_TOKEN'); // was: xO

/** Token for the store-response processor service.  [was: qw] */
export const STORE_RESPONSE_PROCESSOR_TOKEN = new InjectionToken('STORE_RESPONSE_PROCESSOR_TOKEN'); // was: qw

// ---------------------------------------------------------------------------
// Endpoint path constants
// ---------------------------------------------------------------------------

/** [was: oe7] */ export const SUBSCRIBE_PATHS          = ['subscription/subscribe'];          // was: oe7
/** [was: rem] */ export const UNSUBSCRIBE_PATHS        = ['subscription/unsubscribe'];        // was: rem
/** [was: ce7] */ export const SHARE_PANEL_PATHS        = ['share/get_share_panel'];           // was: ce7
/** [was: W2O] */ export const WEB_PLAYER_SHARE_PATHS   = ['share/get_web_player_share_panel']; // was: W2O
/** [was: mdO] */ export const FEEDBACK_PATHS           = ['feedback'];                        // was: mdO
/** [was: K2d] */ export const NOTIFICATION_PREF_PATHS  = ['notification/modify_channel_preference']; // was: K2d
/** [was: Tp7] */ export const PLAYLIST_EDIT_PATHS      = ['browse/edit_playlist'];            // was: Tp7

// ---------------------------------------------------------------------------
// Factory helper for endpoint handlers
// ---------------------------------------------------------------------------

/**
 * Wrap a class constructor as a zero-arg factory (used when registering
 * endpoint-command handler providers).
 *
 * [was: fp]
 *
 * @param {Function} Ctor
 * @returns {() => *}
 */
export function factoryOf(Ctor) { // was: fp
  return () => new Ctor();
}

// ---------------------------------------------------------------------------
// Cache-key builder
// ---------------------------------------------------------------------------

/**
 * Build a deterministic cache key for a service + params combination.
 * Keys are of the form  `service:<name>/<key1>:<value1>/<key2>:<value2>`.
 *
 * [was: nh]
 *
 * @param {string} serviceName  e.g. "player", "next"
 * @param {Object} [params={}]  e.g. `{ videoId: "abc" }`
 * @returns {string}
 */
export function buildCacheKey(serviceName, params = {}) { // was: nh
  return `service:${serviceName}/${
    Object.keys(params).sort().map((k) => `${k}:${params[k]}`).join('/')
  }`;
}

// ---------------------------------------------------------------------------
// Response cache entry
// ---------------------------------------------------------------------------

/**
 * Wraps a cached Innertube response.  Strips `frameworkUpdates` on creation
 * to avoid stale framework actions on cache replay.
 *
 * [was: Vaw]
 */
export class CacheEntry { // was: Vaw
  /**
   * @param {Object} raw  Raw cache record.
   */
  constructor(raw) {
    this.data = { ...raw };
    delete this.data.innertubeResponse?.frameworkUpdates;
  }

  /** [was: isExpired] */
  isExpired() { // was: isExpired
    return Number(this.data.expireTimestampMs || 0) < Date.now(); // was: g.h()
  }

  /** [was: isProcessed] */
  isProcessed() { // was: isProcessed
    return !!this.data.isProcessed;
  }
}

// ---------------------------------------------------------------------------
// Ephemeral (in-memory) response store
// ---------------------------------------------------------------------------

/**
 * Base class for timed response stores that track client name and default
 * expiration.
 *
 * [was: hVW]
 */
class BaseResponseStore { // was: hVW
  /**
   * @param {number} clientName       [was: Q]
   * @param {number} defaultExpiration [was: c]  Milliseconds.
   */
  constructor(clientName, defaultExpiration) {
    this.clientName = clientName; // was: this.clientName
    this.defaultExpiration = defaultExpiration; // was: this.O
  }

  /**
   * Store an entry. If no explicit expiration is set, `defaultExpiration`
   * is applied relative to now.
   *
   * [was: put]
   *
   * @param {string} key
   * @param {CacheEntry} entry
   */
  async put(key, entry) { // was: put
    const record = { ...entry.data }; // was: c
    record.key = key;
    record.clientName = this.clientName;
    if (record.expireTimestampMs === undefined) {
      record.expireTimestampMs = (Math.round(Date.now()) + this.defaultExpiration).toString();
    }
    return storeEntry(this, key, record); // was: ew7
  }
}
// Injection deps  [was: hVW[Du] = [VJ, BI]]
BaseResponseStore[INJECTION_DEPS] = [CLIENT_NAME_TOKEN, DEFAULT_STORE_EXPIRATION_TOKEN];

/**
 * Store an entry in the ephemeral map with a self-destruct timer.
 *
 * [was: ew7]
 *
 * @param {EphemeralStore} store  [was: Q]
 * @param {string}         key   [was: c]
 * @param {Object}         data  [was: W]
 */
async function storeEntry(store, key, data) { // was: ew7
  let expirationMs = store.defaultExpiration; // was: m
  if (data.expireTimestampMs) {
    expirationMs = Number(data.expireTimestampMs) - Math.round(Date.now());
    // Allow experiment override
    // was: Y3("mweb_override_response_store_expiration_ms")
  }
  const timer = setTimeout(() => {
    store.remove(key);
  }, expirationMs); // was: m
  store.entries.set(key, { // was: Q.W.set(c, {...})
    entryData: data,
    timer,
  });
}

/**
 * In-memory ephemeral response store.  Extends `BaseResponseStore` with a
 * `Map` of keyed entries, each with a self-clearing timeout.
 *
 * [was: q_x]
 */
export class EphemeralStore extends BaseResponseStore { // was: q_x
  constructor(...args) {
    super(...args);
    /** @type {Map<string, {entryData: Object, timer: number}>} [was: this.W] */
    this.entries = new Map(); // was: this.W
  }

  /**
   * Retrieve a cache entry (or undefined).
   * [was: get → Bmn]
   *
   * @param {string} key
   * @returns {CacheEntry|undefined}
   */
  async get(key) { // was: get → Bmn
    const record = this.entries.get(key); // was: Q.W.get(c)
    if (record) return new CacheEntry(record.entryData);
  }

  /**
   * Remove (and cancel timer for) a single entry.
   * [was: remove → xH_]
   * @param {string} key
   */
  async remove(key) { // was: remove → xH_
    const record = this.entries.get(key); // was: W
    if (record) {
      clearTimeout(record.timer);
      this.entries.delete(key);
    }
  }

  /** Remove all entries.  [was: removeAll] */
  async removeAll() {
    this.entries.forEach((record) => {
      clearTimeout(record.timer);
    });
    this.entries.clear();
  }

  /**
   * Check whether a key exists.
   * [was: has]
   * @param {string} key
   * @returns {boolean}
   */
  has(key) { // was: has
    return !!this.entries.get(key);
  }

  /**
   * Return an iterator over all stored keys.
   * [was: Il]
   * @returns {IterableIterator<string>}
   */
  keys() { // was: Il
    return this.entries.keys();
  }
}

// ---------------------------------------------------------------------------
// Store-response processor
// ---------------------------------------------------------------------------

/**
 * Processes Innertube responses and optionally caches them in the ephemeral
 * store, including state-tag eviction logic.
 *
 * [was: nuR]
 */
export class StoreResponseProcessor { // was: nuR
  /**
   * @param {EphemeralStore} ephemeralStore  [was: Q]
   */
  constructor(ephemeralStore) {
    this.store = ephemeralStore; // was: this.W
  }

  /**
   * Process an Innertube response, applying state-tag eviction and
   * optional caching based on `maxAgeSeconds`.
   *
   * [was: handleResponse → delegates to X$]
   *
   * @param {Object} response  The raw Innertube JSON response.
   * @param {Object} request   The original request descriptor (must include
   *                           `config.BF.nz` for the cache key).
   */
  handleResponse(response, request) { // was: handleResponse
    if (!request) {
      throw Error('request needs to be passed into StoreResponseProcessorService');
    }
    processAndCacheResponse(this, response, request.config?.GcfConfigManager?.adSlotRenderer); // was: X$(this, Q, c.config?.BF?.nz)
  }
}
// Injection deps  [was: nuR[Du] = [xO]]
StoreResponseProcessor[INJECTION_DEPS] = [EPHEMERAL_STORE_TOKEN];

// ---------------------------------------------------------------------------
// State-tag eviction + response caching
// ---------------------------------------------------------------------------

/**
 * Process state-tag eviction and optionally cache the response in the
 * ephemeral store.
 *
 * [was: X$]
 *
 * @param {StoreResponseProcessor} processor  [was: Q]
 * @param {Object}                 response   [was: c]
 * @param {string|undefined}       cacheKey   [was: W]
 */
function processAndCacheResponse(processor, response, cacheKey) { // was: X$
  // --- State-tag eviction (skip if killswitch is on) ---
  // Omitted: the full state-tag eviction logic reads
  //   response.responseContext.stateTags.stateTagsModified,
  //   cross-references with cached entries' relevantStateTags, and
  //   evicts entries whose stateTag matches with
  //   STATE_TAG_CACHE_INSTRUCTION_EVICT_RESPONSE.
  // (See source lines 19931–19971 for the unabridged version.)

  // --- Cache the response if maxAgeSeconds is set ---
  const maxAgeSeconds = response.responseContext?.maxAgeSeconds;
  if (cacheKey && maxAgeSeconds && Number(maxAgeSeconds) > 0) {
    const maxAgeMs = Number(maxAgeSeconds) * 1000; // was: m
    const nowMs = Math.round(Date.now()); // was: T
    const nowStr = nowMs.toString(); // was: U

    const record = {
      innertubeResponse: response,
      serverDateTimestampMs: nowStr,
      lastModifiedTimestampMs: nowStr,
      expireTimestampMs: (nowMs + maxAgeMs).toString(),
      isProcessed: true, // was: !0
    };

    // Stamp clientName when available (from global config)
    const clientName = undefined; // was: g.v("INNERTUBE_CONTEXT_CLIENT_NAME")
    if (clientName) record.clientName = clientName;

    processor.store.put(cacheKey, new CacheEntry(record)); // was: Q.W.put(W, new Vaw(c))
  }
}

// ---------------------------------------------------------------------------
// Innertube transport service (singleton)
// ---------------------------------------------------------------------------

/**
 * List of response-context processor keys that the transport service walks
 * when handling a response.
 *
 * [was: AGK]
 * @type {string[]}
 */
export const RESPONSE_PROCESSOR_KEYS = [ // was: AGK
  'tokens', 'consistency', 'service_params', 'mss', 'client_location',
  'entities', 'adblock_detection', 'response_received_commands', 'store',
  'manifest', 'player_preload', 'shorts_prefetch', 'resolve_url_prefetch',
];

/**
 * Core Innertube transport service. Holds the endpoint-handler map,
 * the network manager, the analytics/logger instance, and the optional
 * ephemeral store.
 *
 * [was: aQ]
 */
export class InnertubeTransportService { // was: aQ
  /** @type {InnertubeTransportService|undefined} */
  static instance = undefined;

  /**
   * @param {Object}         endpointMap      [was: Q → this.j]   Signal/request handler maps.
   * @param {Object}         networkManager   [was: c → this.CU]  Network fetch abstraction.
   * @param {Object}         analyticsService [was: W → this.W]   Service for request logging.
   * @param {Object}         [extraConfig]    [was: m → this.K]   Optional handlers map.
   * @param {EphemeralStore} [ephemeralStore] [was: K → this.A]   Ephemeral cache store.
   */
  constructor(endpointMap, networkManager, analyticsService, extraConfig, ephemeralStore) {
    this.endpointMap = endpointMap;         // was: this.j
    this.networkManager = networkManager;   // was: this.CU
    this.analyticsService = analyticsService; // was: this.W
    this.extraConfig = extraConfig;         // was: this.K
    this.ephemeralStore = ephemeralStore;    // was: this.A
    this.requestMap = new Map();            // was: this.O

    // Ensure the endpoint map has signal handlers
    if (!endpointMap.hf) endpointMap.hf = {};
    endpointMap.hf = {
      ...DEFAULT_SIGNAL_HANDLERS, // was: uOx
      ...endpointMap.hf,
    };
  }

  /**
   * Create a request spec for a given command.
   * [was: zP → k_y]
   *
   * @param {Object} command
   * @returns {Object}
   */
  createRequest(command) { // was: zP
    return createRequestFromCommand(command, this.endpointMap); // was: k_y(Q, this.j)
  }
}

/**
 * Placeholder for the default signal-handler map that is merged into every
 * InnertubeTransportService's endpoint map.  Contains at minimum the
 * GET_DATASYNC_IDS handler.
 *
 * [was: uOx]
 * @type {Object}
 */
const DEFAULT_SIGNAL_HANDLERS = {}; // was: uOx (populated at module load time)

/**
 * Placeholder reference to `k_y` — the function that maps an API command
 * to a fetch-ready request spec (input URL, init object, body).
 *
 * [was: k_y]
 */
function createRequestFromCommand(command, endpointMap) { // was: k_y
  // Delegates into the endpoint handler resolved from `endpointMap.hf`
  // or `endpointMap.BV` based on the command's signal/request discriminator.
  // Full implementation lives in network/innertube-client.js.
  throw Error('createRequestFromCommand: stub — see network/innertube-client.js');
}

// ---------------------------------------------------------------------------
// Transport initialisation & singleton guard
// ---------------------------------------------------------------------------

/**
 * Initialise the transport service singleton. Throws if already initialised
 * with different arguments.
 *
 * [was: cG_]
 *
 * @param {Object} endpointMap
 * @param {Object} networkManager
 * @param {Object} analyticsService
 * @param {Object} [extra]
 * @param {EphemeralStore} [ephemeralStore]
 */
export function initTransportService(endpointMap, networkManager, analyticsService, extra, ephemeralStore) { // was: cG_
  if (InnertubeTransportService.instance !== undefined) {
    const existing = InnertubeTransportService.instance; // was: m = aQ.instance
    const diffs = [
      endpointMap    !== existing.endpointMap,
      networkManager !== existing.networkManager,
      analyticsService !== existing.analyticsService,
      ephemeralStore !== existing.ephemeralStore,
      false,
      false,
      false,
    ];
    if (diffs.some((d) => d)) {
      throw Error('InnerTubeTransportService is already initialized'); // was: g.H8(...)
    }
  } else {
    InnertubeTransportService.instance = new InnertubeTransportService(
      endpointMap, networkManager, analyticsService, extra, ephemeralStore,
    );
  }
}

// ---------------------------------------------------------------------------
// Top-level bootstrap:  g.nr
// ---------------------------------------------------------------------------

/**
 * Singleton guard — the resolved transport token instance. Once set,
 * `bootstrapInnertube` is a no-op.
 *
 * [was: eK]
 * @type {*}
 */
let transportInstance; // was: eK

/**
 * Bootstrap the entire Innertube DI graph: register the network manager,
 * the ephemeral store, the store-response processor, all endpoint-command
 * handlers, and finally the transport singleton.
 *
 * Called once during player / page initialisation.
 *
 * [was: bootstrapInnertube]
 *
 * @param {Object} [analyticsService]  [was: Q]  Logging / analytics instance.
 * @param {Object} [networkManager]    [was: c]  Pre-created network manager
 *                                                (resolved from BVd if omitted).
 * @param {Object} [options]           [was: W]  Optional flags (e.g. `QH`
 *                                                to enable response caching).
 * @returns {*}  The resolved transport instance.
 */
export function bootstrapInnertube(analyticsService, networkManager, options) { // was: g.nr
  if (transportInstance) return transportInstance; // was: eK

  const resolver = getResolver(); // was: r = Ng()

  // -- Register network manager (class provider) --
  registerProvider(resolver, {
    token: NETWORK_MANAGER_TOKEN, // was: NP: BVd
    useClass: NetworkManager,     // was: Ag: xAy
  });

  // -- Optional: enable response caching --
  if (options?.enableCaching) { // was: W?.QH
    registerProvider(resolver, {
      token: CLIENT_NAME_TOKEN, // was: NP: VJ
      value: undefined,          // was: Wr: g.v("INNERTUBE_CONTEXT_CLIENT_NAME", W.clientInterface)
    });

    registerProvider(resolver, {
      token: DEFAULT_STORE_EXPIRATION_TOKEN, // was: NP: BI
      value: 5_184_000, // 60 days in ms  [was: Wr: 5184E6]
    });

    registerProvider(resolver, {
      token: EPHEMERAL_STORE_TOKEN,         // was: NP: xO
      useClass: EphemeralStore,             // was: Ag: q_x
      [INJECTION_DEPS]: [CLIENT_NAME_TOKEN, DEFAULT_STORE_EXPIRATION_TOKEN], // was: [Du]: [VJ, BI]
    });

    registerProvider(resolver, {
      token: STORE_RESPONSE_PROCESSOR_TOKEN, // was: NP: qw
      useClass: StoreResponseProcessor,      // was: Ag: nuR
    });

    // Pre-warm: process any initial server-rendered responses
    const storeProcessor = resolver.resolve(STORE_RESPONSE_PROCESSOR_TOKEN); // was: m = r.resolve(qw)
    const win = globalThis;
    if (win.ytInitialVideoId) {
      const videoId = win.ytInitialVideoId; // was: T
      if (win.ytInitialPlayerResponse) {
        processAndCacheResponse(
          storeProcessor,
          win.ytInitialPlayerResponse,
          buildCacheKey('player', { videoId }),
        );
      }
      if (win.ytInitialWatchNextResponse) {
        processAndCacheResponse(
          storeProcessor,
          win.ytInitialWatchNextResponse,
          buildCacheKey('next', { videoId }),
        );
      }
      if (win.ytInitialReelItemWatchResponse) {
        processAndCacheResponse(
          storeProcessor,
          win.ytInitialReelItemWatchResponse,
          buildCacheKey('reel_item_watch', { videoId }),
        );
      }
    }
  }

  // -- Register endpoint-command handler factories --
  const endpointHandlers = {
    feedbackEndpoint:                             factoryOf(FeedbackEndpoint),
    modifyChannelNotificationPreferenceEndpoint:  factoryOf(NotificationPrefEndpoint),
    playlistEditEndpoint:                         factoryOf(PlaylistEditEndpoint),
    shareEntityEndpoint:                          factoryOf(ShareEntityEndpoint),
    subscribeEndpoint:                            factoryOf(SubscribeEndpoint),
    unsubscribeEndpoint:                          factoryOf(UnsubscribeEndpoint),
    webPlayerShareEntityServiceEndpoint:          factoryOf(WebPlayerShareEndpoint),
  };

  // -- Initialise the transport singleton --
  if (analyticsService === undefined) {
    analyticsService = createDefaultAnalytics(); // was: Asd()
  }
  if (networkManager === undefined) {
    networkManager = resolver.resolve(NETWORK_MANAGER_TOKEN); // was: r.resolve(BVd)
  }

  const ephemeralStore = options?.enableCaching
    ? resolver.resolve(EPHEMERAL_STORE_TOKEN)
    : undefined;

  initTransportService(endpointHandlers, networkManager, analyticsService, {}, ephemeralStore);

  registerProvider(resolver, {
    token: INNERTUBE_TRANSPORT_TOKEN,          // was: NP: FNw
    value: InnertubeTransportService.instance, // was: Wr: aQ.instance
  });

  transportInstance = resolver.resolve(INNERTUBE_TRANSPORT_TOKEN); // was: eK = r.resolve(FNw)
  return transportInstance;
}

// ---------------------------------------------------------------------------
// Stubs for endpoint handler classes (defined in full elsewhere)
// ---------------------------------------------------------------------------
// These are minimal forward references so the bootstrap code compiles.
// Full implementations live in `network/service-endpoints.js`.

/** [was: DAR] */ class FeedbackEndpoint {}              // was: DAR
/** [was: tHK] */ class NotificationPrefEndpoint {}       // was: tHK
/** [was: HO0] */ class PlaylistEditEndpoint {}           // was: HO0
/** [was: NVR] */ class ShareEntityEndpoint {}            // was: NVR
/** [was: iOR] */ class SubscribeEndpoint {}              // was: iOR
/** [was: yz7] */ class UnsubscribeEndpoint {}            // was: yz7
/** [was: S_3] */ class WebPlayerShareEndpoint {}         // was: S_3

/** [was: xAy] */ class NetworkManager {}                 // was: xAy

/** Placeholder for default analytics factory.  [was: getConfigSingleton] */
function createDefaultAnalytics() { // was: Asd
  // was: eL.instance || (eL.instance = new eL); return eL.instance
  return {};
}
