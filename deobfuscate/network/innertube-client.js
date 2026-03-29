import { getConnectionType, getEffectiveConnectionType } from '../core/attestation.js';
import { logWarning } from '../core/composition-helpers.js';
import { deepClone } from '../core/object-utils.js';
import { now } from '../core/type-helpers.js';
import { compressAndSend, setAppInstallData, setConnectionType, setEmbedUrl, setGcfHashes, setMemoryInfo, setWebDisplayMode } from '../data/gel-core.js';
import { getClientScreenNonce } from '../data/gel-params.js';
import { getConfigValue } from '../modules/remote/mdx-session.js';
import { InnertubeError } from './error-handling.js';
import { sendXhrRequest } from './request.js';
import { appendCondensedParam, buildFetchOptions } from './service-endpoints.js';
import { identity } from '../proto/wire-format.js';

/**
 * Innertube API Client and Configuration
 *
 * Handles YouTube's internal Innertube API: context construction, API key
 * management, request building, auth headers, and the transport service
 * singleton that dispatches all Innertube requests.
 *
 * Source: base.js lines 13292-14095, 18508-18617, 66716-66731, 72091-72178
 *
 * @module network/innertube-client
 */

// ---------------------------------------------------------------------------
// Innertube availability check
// ---------------------------------------------------------------------------

/**
 * Returns whether the Innertube API is configured on the page.
 * [was: ZVy]
 *
 * Checks for both INNERTUBE_API_KEY and INNERTUBE_API_VERSION in the
 * global config object (N4).
 *
 * @returns {boolean}
 */
export function isInnertubeAvailable() { // was: ZVy
  return 'INNERTUBE_API_KEY' in globalConfig && 'INNERTUBE_API_VERSION' in globalConfig;
}

// ---------------------------------------------------------------------------
// Innertube configuration
// ---------------------------------------------------------------------------

/**
 * Reads the current Innertube configuration from page-level ytconfig.
 * [was: getInnertubeConfig]
 *
 * @returns {InnertubeConfig}
 */
export function getInnertubeConfig() { // was: g.Ne
  return {
    innertubeApiKey:              getConfigValue('INNERTUBE_API_KEY'),                      // was: innertubeApiKey
    innertubeApiVersion:          getConfigValue('INNERTUBE_API_VERSION'),                  // was: innertubeApiVersion
    clientConfigInfo:             getConfigValue('INNERTUBE_CONTEXT_CLIENT_CONFIG_INFO'),   // was: py
    clientName:                   getConfigValue('INNERTUBE_CONTEXT_CLIENT_NAME', 'WEB'),   // was: rT
    clientNameId:                 getConfigValue('INNERTUBE_CONTEXT_CLIENT_NAME', 1),       // was: rh
    innertubeContextClientVersion: getConfigValue('INNERTUBE_CONTEXT_CLIENT_VERSION'),      // was: innertubeContextClientVersion
    hostLanguage:                 getConfigValue('INNERTUBE_CONTEXT_HL'),                   // was: DT
    geoLocation:                  getConfigValue('INNERTUBE_CONTEXT_GL'),                   // was: u1
    hostOverride:                 getConfigValue('INNERTUBE_HOST_OVERRIDE') || '',           // was: hH
    useThirdPartyAuth:            !!getConfigValue('INNERTUBE_USE_THIRD_PARTY_AUTH', false), // was: Db
    omitApiKeyWhenAuthPresent:    !!getConfigValue('INNERTUBE_OMIT_API_KEY_WHEN_AUTH_HEADER_IS_PRESENT', false), // was: QP
    appInstallData:               getConfigValue('SERIALIZED_CLIENT_CONFIG_DATA'),          // was: appInstallData
  };
}

// ---------------------------------------------------------------------------
// Innertube context construction (lightweight, for GEL / batched logging)
// ---------------------------------------------------------------------------

/**
 * Builds a minimal Innertube request context from an {@link InnertubeConfig}.
 * Used by GEL (Google Event Logging) and similar batched-logging paths.
 * [was: buildInnertubeContext]
 *
 * @param {InnertubeConfig} config [was: Q]
 * @returns {InnertubeContext}
 */
export function buildInnertubeContext(config) { // was: g.iV
  const context = {
    client: {
      hl:           config.hostLanguage,       // was: Q.DT
      gl:           config.geoLocation,        // was: Q.u1
      clientName:   config.clientName,         // was: Q.rT
      clientVersion: config.innertubeContextClientVersion,
      configInfo:   config.clientConfigInfo,   // was: Q.py
    },
  };

  // User-agent
  if (navigator.userAgent) {
    context.client.userAgent = String(navigator.userAgent);
  }

  // Screen density
  const pixelRatio = globalWindow.devicePixelRatio; // was: g.qX.devicePixelRatio
  if (pixelRatio && pixelRatio !== 1) {
    context.client.screenDensityFloat = String(pixelRatio);
  }

  // Experiments token
  const experimentsToken = getExperimentsToken(); // was: pe()
  if (experimentsToken !== '') {
    context.client.experimentsToken = experimentsToken;
  }

  // Internal experiment flags
  const internalFlags = getInternalExperimentFlags(); // was: Q5()
  if (internalFlags.length > 0) {
    context.request = { internalExperimentFlags: internalFlags };
  }

  // Additional context enrichment
  setWebDisplayMode(config, undefined, context);              // was: ECw
  setEmbedUrl(undefined, context);                            // was: sPx
  setMemoryInfo(undefined, context);                          // was: d60
  setAppInstallData(config, undefined, context);              // was: LKd
  setConnectionType(undefined, context);                      // was: w__

  if (getExperimentFlag('start_client_gcf')) {
    setGcfHashes(undefined, context);                         // was: bVX
  }

  // Delegated session
  if (getConfigValue('DELEGATED_SESSION_ID') && !getExperimentFlag('pageid_as_header_web')) {
    context.user = { onBehalfOfUser: getConfigValue('DELEGATED_SESSION_ID') };
  }

  // Delegation context
  if (!getExperimentFlag('fill_delegate_context_in_gel_killswitch')) {
    const delegationContext = getConfigValue('INNERTUBE_CONTEXT_SERIALIZED_DELEGATION_CONTEXT');
    if (delegationContext) {
      context.user = { ...context.user, serializedDelegationContext: delegationContext };
    }
  }

  // Persistent device / rollout token
  const shellContext = getConfigValue('INNERTUBE_CONTEXT');
  if (getExperimentFlag('enable_persistent_device_token') && shellContext?.client?.rolloutToken) {
    context.client.rolloutToken = shellContext.client.rolloutToken;
  }

  // Device info from DEVICE param string
  const deviceString = getConfigValue('DEVICE', '');
  const deviceParams = parseQueryString(deviceString); // was: bk(K)
  const deviceInfo = {};
  for (const [key, value] of Object.entries(deviceParams)) {
    if (key === 'cbrand')      deviceInfo.deviceMake      = value;
    else if (key === 'cmodel') deviceInfo.deviceModel     = value;
    else if (key === 'cbr')    deviceInfo.browserName     = value;
    else if (key === 'cbrver') deviceInfo.browserVersion  = value;
    else if (key === 'cos')    deviceInfo.osName          = value;
    else if (key === 'cosver') deviceInfo.osVersion       = value;
    else if (key === 'cplatform') deviceInfo.platform     = value;
  }
  context.client = Object.assign(context.client, deviceInfo);

  return context;
}

// ---------------------------------------------------------------------------
// Full Innertube context (used for direct API calls like /player, /browse)
// ---------------------------------------------------------------------------

/**
 * Builds the full Innertube request context from the page-level shell.
 * Enriches the shell context with screen info, theme, timezone, ad signals,
 * safety mode, CSN, and more.
 * [was: buildFullInnertubeContext]
 *
 * @param {string} [clickTrackingParams] - Click-tracking token [was: Q]
 * @param {boolean} [skipConnectionType=false] - Omit connection type [was: c]
 * @param {boolean} [includeClientScreenNonce=false] - Include CSN [was: W]
 * @returns {InnertubeContext}
 */
export function buildFullInnertubeContext(clickTrackingParams, skipConnectionType = false, includeClientScreenNonce = false) { // was: g.Oh
  const shellContext = getConfigValue('INNERTUBE_CONTEXT');
  if (!shellContext) {
    logWarning(Error('Error: No InnerTubeContext shell provided in ytconfig.'));
    return {};
  }

  const context = deepClone(shellContext); // was: g.Cm(m)

  if (!getExperimentFlag('web_no_tracking_params_in_shell_killswitch')) {
    delete context.clickTracking;
  }

  context.client = context.client || {};
  const client = context.client;

  // Mobile form factor
  if (client.clientName === 'MWEB' && client.clientFormFactor !== 'AUTOMOTIVE_FORM_FACTOR') {
    client.clientFormFactor = getConfigValue('IS_TABLET')
      ? 'LARGE_FORM_FACTOR'
      : 'SMALL_FORM_FACTOR';
  }

  // Screen metrics
  client.screenWidthPoints  = window.innerWidth;
  client.screenHeightPoints = window.innerHeight;
  client.screenPixelDensity = Math.round(window.devicePixelRatio || 1);
  client.screenDensityFloat = window.devicePixelRatio || 1;

  // Timezone offset (minutes)
  client.utcOffsetMinutes = -Math.floor(new Date().getTimezoneOffset());

  // UI theme
  const prefs = getPreferences(); // was: g.pm()
  let theme = 'USER_INTERFACE_THEME_LIGHT';
  if (prefs.get(165))      theme = 'USER_INTERFACE_THEME_DARK';   // was: BA(165)
  else if (prefs.get(174)) theme = 'USER_INTERFACE_THEME_LIGHT';  // was: BA(174)
  else if (!getExperimentFlag('kevlar_legacy_browsers')
    && window.matchMedia?.('(prefers-color-scheme)').matches
    && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'USER_INTERFACE_THEME_DARK';
  }
  client.userInterfaceTheme = getStoredTheme() || theme; // was: z37() || r

  // Connection type
  if (!skipConnectionType) {
    const connType = getConnectionType(); // was: nHw()
    if (connType) client.connectionType = connType;
    if (getExperimentFlag('web_log_effective_connection_type')) {
      const effectiveConn = getEffectiveConnectionType(); // was: tyx()
      if (effectiveConn) context.client.effectiveConnectionType = effectiveConn;
    }
  }

  // Memory info
  if (getExperimentFlag('web_log_memory_total_kbytes') && globalWindow.navigator?.deviceMemory) {
    context.client.memoryTotalKbytes = `${globalWindow.navigator.deviceMemory * 1e6}`;
  }

  // GCF hashes
  if (getExperimentFlag('web_gcf_hashes_innertube')) {
    const gcf = getGcfData(); // was: FKW()
    if (gcf) {
      context.client.configInfo = context.client.configInfo || {};
      if (gcf.coldConfigData) context.client.configInfo.coldConfigData = gcf.coldConfigData;
      if (gcf.coldHashData)   context.client.configInfo.coldHashData   = gcf.coldHashData;
      if (gcf.hotHashData)    context.client.configInfo.hotHashData    = gcf.hotHashData;
    }
  }

  // Timezone
  if (!getExperimentFlag('web_populate_time_zone_itc_killswitch')) {
    try {
      const tz = new Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) client.timeZone = tz;
    } catch { /* Intl not available */ }
  }

  // Experiments token
  const expToken = getExperimentsToken(); // was: pe()
  if (expToken) client.experimentsToken = expToken;
  else delete client.experimentsToken;

  // Internal experiment flags & consistency tokens
  const flags = getInternalExperimentFlags(); // was: Q5()
  const consistencyJars = getConsistencyTokenJars(); // was: gZ(jE.instance.W)
  context.request = {
    ...context.request,
    internalExperimentFlags: flags,
    consistencyTokenJars: consistencyJars,
  };

  // Pre-request context
  if (!getExperimentFlag('web_prequest_context_killswitch')) {
    const prerequestCtx = getConfigValue('INNERTUBE_CONTEXT_PREQUEST_CONTEXT');
    if (prerequestCtx) context.request.externalPrequestContext = prerequestCtx;
  }

  // Safety mode
  const safetyPrefs = getPreferences(); // was: g.pm()
  const safetyMode = safetyPrefs.get(58); // was: BA(58)
  const lockedSafety = safetyPrefs.get('gsml', ''); // was: get("gsml","")
  context.user = { ...context.user };
  if (safetyMode)   context.user.enableSafetyMode = safetyMode;
  if (lockedSafety) context.user.lockedSafetyMode = true;

  // Client screen nonce
  if (getExperimentFlag('warm_op_csn_cleanup')) {
    if (includeClientScreenNonce) {
      const csn = getClientScreenNonce(); // was: g.Df()
      if (csn) context.clientScreenNonce = csn;
    }
  } else if (!skipConnectionType) {
    const csn = getClientScreenNonce();
    if (csn) context.clientScreenNonce = csn;
  }

  // Click tracking
  if (clickTrackingParams) {
    context.clickTracking = { clickTrackingParams };
  }

  // Remote client (Chromecast)
  const remoteClient = getGlobal('yt.mdx.remote.remoteClient_'); // was: g.DR(...)
  if (remoteClient) context.remoteClient = remoteClient;

  // Location service
  LocationService.getInstance().setLocationOnInnerTubeContext(context); // was: g$.getInstance()

  // Ad signals
  try {
    const signals = getAdSignals(); // was: lk()
    const bid = signals.bid;
    delete signals.bid;
    context.adSignalsInfo = { params: [], bid };
    for (const [key, value] of Object.entries(signals)) {
      context.adSignalsInfo.params?.push({ key, value: `${value}` });
    }

    // Connected TV ad identifiers
    if (context.client?.clientName === 'TVHTML5' || context.client?.clientName === 'TVHTML5_UNPLUGGED') {
      const shellCtx = getConfigValue('INNERTUBE_CONTEXT');
      if (shellCtx.adSignalsInfo) {
        context.adSignalsInfo.advertisingId = shellCtx.adSignalsInfo.advertisingId;
        context.adSignalsInfo.advertisingIdSignalType = 'DEVICE_ID_TYPE_CONNECTED_TV_IFA';
        context.adSignalsInfo.limitAdTracking = shellCtx.adSignalsInfo.limitAdTracking;
      }
    }
  } catch (err) {
    logWarning(err); // was: g.Zf(e)
  }

  return context;
}

// ---------------------------------------------------------------------------
// Auth / visitor header construction
// ---------------------------------------------------------------------------

/**
 * Builds authentication and visitor-identification headers for Innertube
 * requests.
 * [was: fZ7]
 *
 * @param {boolean} useGapiAuth        - Use gapi OAuth token [was: Q]
 * @param {string}  hostOverride        - Host override URL [was: c]
 * @param {object}  [options={}]        - Additional options [was: W]
 * @param {string}  [options.visitorData]  - Override visitor data
 * @param {string}  [options.authToken]    - Override authorization token [was: MX]
 * @returns {Record<string, string>} HTTP headers
 */
export function buildAuthHeaders(useGapiAuth, hostOverride, options = {}) { // was: fZ7
  let headers = {};

  // Visitor identification
  if (getConfigValue('EOM_VISITOR_DATA')) {
    headers = { 'X-Goog-EOM-Visitor-Id': getConfigValue('EOM_VISITOR_DATA') };
  } else {
    headers = { 'X-Goog-Visitor-Id': options.visitorData || getConfigValue('VISITOR_DATA', '') };
  }

  // Nocookie domain skips auth
  if (hostOverride && hostOverride.includes('www.youtube-nocookie.com')) {
    return headers;
  }

  // Authorization
  let authToken = options.authToken || getConfigValue('AUTHORIZATION'); // was: W.MX
  if (!authToken) {
    if (useGapiAuth) {
      authToken = `Bearer ${getGlobal('gapi.auth.getToken')().access_token}`;
    } else {
      const sessionHeaders = getAuthService().getHeaders(DEFAULT_AUTH_IDENTITY); // was: Asd().Sl(ZM)
      if (!getExperimentFlag('pageid_as_header_web')) {
        delete sessionHeaders['X-Goog-PageId'];
      }
      headers = { ...headers, ...sessionHeaders };
    }
  }

  if (authToken) {
    headers.Authorization = authToken;
  }

  return headers;
}

/**
 * Builds default request headers for Innertube fetch-based transport.
 * Includes content-type, visitor/EOM IDs, client name/version, debug info.
 * [was: YN3]
 *
 * @param {string} [fetchMode] - Fetch mode ("cors" suppresses some headers)
 * @returns {Record<string, string>}
 */
export function buildDefaultInnertubeHeaders(fetchMode) { // was: YN3
  const headers = { 'Content-Type': 'application/json' };

  // Visitor ID
  if (getConfigValue('EOM_VISITOR_DATA')) {
    headers['X-Goog-EOM-Visitor-Id'] = getConfigValue('EOM_VISITOR_DATA');
  } else if (getConfigValue('VISITOR_DATA')) {
    headers['X-Goog-Visitor-Id'] = getConfigValue('VISITOR_DATA');
  }

  headers['X-Youtube-Bootstrap-Logged-In'] = getConfigValue('LOGGED_IN', false);

  if (getConfigValue('DEBUG_SETTINGS_METADATA')) {
    headers['X-Debug-Settings-Metadata'] = getConfigValue('DEBUG_SETTINGS_METADATA');
  }

  // These headers are suppressed for CORS requests
  if (fetchMode !== 'cors') {
    const clientName    = getConfigValue('INNERTUBE_CONTEXT_CLIENT_NAME');
    const clientVersion = getConfigValue('INNERTUBE_CONTEXT_CLIENT_VERSION');
    const chromeHeader  = getConfigValue('CHROME_CONNECTED_HEADER');
    const adminState    = getConfigValue('DOMAIN_ADMIN_STATE');
    const geoHeader     = LocationService.getInstance().getXGeoHeader?.();

    if (clientName)    headers['X-Youtube-Client-Name']       = clientName;
    if (clientVersion) headers['X-Youtube-Client-Version']    = clientVersion;
    if (chromeHeader)  headers['X-Youtube-Chrome-Connected']  = chromeHeader;
    if (adminState)    headers['X-Youtube-Domain-Admin-State'] = adminState;
    if (geoHeader)     headers['X-Geo']                       = geoHeader;
  }

  const lavaCtx = getConfigValue('SERIALIZED_LAVA_DEVICE_CONTEXT');
  if (lavaCtx) {
    headers['X-YouTube-Lava-Device-Context'] = lavaCtx;
  }

  return headers;
}

// ---------------------------------------------------------------------------
// Header-to-config mapping (used by legacy XHR paths)
// ---------------------------------------------------------------------------

/**
 * Maps HTTP header names to their corresponding ytconfig keys.
 * [was: nJy]
 *
 * @type {Record<string, string>}
 */
export const HEADER_TO_CONFIG_KEY = { // was: nJy
  'Authorization':                    'AUTHORIZATION',
  'X-Goog-EOM-Visitor-Id':           'EOM_VISITOR_DATA',
  'X-Goog-Visitor-Id':               'SANDBOXED_VISITOR_ID',
  'X-Youtube-Domain-Admin-State':    'DOMAIN_ADMIN_STATE',
  'X-Youtube-Chrome-Connected':      'CHROME_CONNECTED_HEADER',
  'X-YouTube-Client-Name':           'INNERTUBE_CONTEXT_CLIENT_NAME',
  'X-YouTube-Client-Version':        'INNERTUBE_CONTEXT_CLIENT_VERSION',
  'X-YouTube-Delegation-Context':    'INNERTUBE_CONTEXT_SERIALIZED_DELEGATION_CONTEXT',
  'X-YouTube-Device':                'DEVICE',
  'X-Youtube-Identity-Token':        'ID_TOKEN',
  'X-YouTube-Page-CL':               'PAGE_CL',
  'X-YouTube-Page-Label':            'PAGE_BUILD_LABEL',
  'X-Goog-AuthUser':                 'SESSION_INDEX',
  'X-Goog-PageId':                   'DELEGATED_SESSION_ID',
};

// ---------------------------------------------------------------------------
// Innertube API call (GEL / logging path)
// ---------------------------------------------------------------------------

/**
 * Sends a request to a specific Innertube API endpoint via the lightweight
 * logging transport (used by GEL batch logger and similar).
 * [was: anonymous function body at line ~14030-14095]
 *
 * @param {object} client       - Innertube client instance with config_ [was: Q]
 * @param {string} endpointPath - API method path (e.g. "log_event") [was: c]
 * @param {object} requestBody  - JSON request body [was: W (postParams / postBody)]
 * @param {object} options      - Request options [was: m]
 * @param {Function} [options.onSuccess] - Success callback
 * @param {Function} [options.onError]   - Error callback
 * @param {number}  [options.timeout]    - Timeout in ms
 * @param {boolean} [options.compress]   - Gzip-compress the body
 * @param {boolean} [options.retry]      - Allow networkless retry
 * @param {object}  [options.networklessOptions] - Networkless transport config
 */
export function sendInnertubeRequest(client, endpointPath, requestBody, options) {
  const requestConfig = {
    headers: { 'Content-Type': 'application/json' },
    onSuccess: options.onSuccess ? (xhr) => options.onSuccess(xhr) : undefined,
    onError: options.onError ? (error) => options.onError(error) : undefined,
    timeout: options.timeout,
    withCredentials: true,
    compress: options.compress,
  };

  if (!requestConfig.headers['Content-Type']) {
    requestConfig.headers['Content-Type'] = 'application/json';
  }

  // Host override
  let baseUrl = '';
  const hostOverride = client.config_.hostOverride; // was: hH
  if (hostOverride) baseUrl = hostOverride;

  // Auth headers
  const useThirdPartyAuth = client.config_.useThirdPartyAuth || false; // was: Db
  const authHeaders = buildAuthHeaders(useThirdPartyAuth, baseUrl, options);
  Object.assign(requestConfig.headers, authHeaders);

  // Cross-origin header
  if (requestConfig.headers.Authorization && !baseUrl && useThirdPartyAuth) {
    requestConfig.headers['x-origin'] = window.location.origin;
  }

  // Build URL
  const url = appendQueryParams(
    `${baseUrl}/youtubei/${client.config_.innertubeApiVersion}/${endpointPath}`,
    { alt: 'json' },
  ); // was: fe(...)

  const executeRequest = (useNetworkless = false) => {
    try {
      if (useNetworkless && options.retry && !options.networklessOptions.bypassNetworkless) {
        requestConfig.method = 'POST';
        if (options.networklessOptions.writeThenSend) {
          getNetworklessQueue().writeThenSend(url, requestConfig); // was: Cq().writeThenSend
        } else {
          getNetworklessQueue().sendAndWrite(url, requestConfig); // was: Cq().sendAndWrite
        }
      } else if (options.compress) {
        const body = requestConfig.postBody
          ? (typeof requestConfig.postBody !== 'string'
            ? JSON.stringify(requestConfig.postBody)
            : requestConfig.postBody)
          : JSON.stringify(requestConfig.postParams);
        compressAndSend(url, body, requestConfig, sendXhrRequest); // was: gU(U, ..., g.Wn) or gU(U, ..., ms)
      } else {
        sendPostRequest(url, requestConfig); // was: ms(U, K)
      }
    } catch (err) {
      if (err.name === 'InvalidAccessError') {
        logSilent(Error('An extension is blocking network request.'));
      } else {
        throw err;
      }
    }
  };

  // Check networkless initialization
  const networklessOptions = getGlobal('ytNetworklessLoggingInitializationOptions');
  if (networklessOptions && networklessState.isNwlInitialized) { // was: Z0O.isNwlInitialized
    isNetworklessReady().then((ready) => executeRequest(ready)); // was: YVm().then(...)
  } else {
    executeRequest(false);
  }
}

// ---------------------------------------------------------------------------
// Full Innertube transport (command-based, used by browse / player / etc.)
// ---------------------------------------------------------------------------

/**
 * Sends an Innertube request for a given API path, returning a Promise of the
 * parsed JSON response. This is the primary high-level transport used by the
 * web client for /player, /browse, /next, etc.
 * [was: sendInnertubeRequest]
 *
 * @param {InnerTubeTransportService} transport [was: Q]
 * @param {object} requestBody  - The request payload (context will be added) [was: c]
 * @param {string} apiPath      - e.g. "/youtubei/v1/player" [was: W]
 * @param {string} [clickTrackingParams] - Click-tracking token [was: m]
 * @param {object} [sessionConfig]       - Auth / session config [was: K]
 * @returns {Promise<object>}
 */
export function sendInnertubeApiRequest(
  transport,
  requestBody,
  apiPath,
  clickTrackingParams,
  sessionConfig = { authSession: { identity: DEFAULT_AUTH_IDENTITY } },
) { // was: g.$h
  let perfCallback = () => {};
  perfCallback = startPerfTimer(stripApiPrefix(apiPath)); // was: wsy(dj0(W))

  if (!requestBody.context) {
    requestBody.context = buildFullInnertubeContext(clickTrackingParams, true);
  }

  return new Promise(async (resolve) => {
    // Determine fetch mode
    let fetchMode = applyHostOverride(apiPath); // was: xn(W)
    fetchMode = isSameOrigin(fetchMode) ? 'same-origin' : 'cors';

    // Build headers
    const headers = transport.authProvider.isSynchronous // was: W.KE
      ? buildHeadersSync(transport, sessionConfig, fetchMode)
      : await buildHeadersAsync(transport, sessionConfig, fetchMode);

    // Build request descriptor
    let requestUrl = appendCondensedParam(applyHostOverride(apiPath)); // was: gJR(xn(W))
    const requestDescriptor = {
      input: requestUrl,
      fetchOptions: buildFetchOptions(requestUrl), // was: qt(I)
      body: requestBody,                           // was: Ut
      config: sessionConfig,
    };

    resolve(executeTransportRequest(transport, requestDescriptor, headers, perfCallback));
    // was: XO7(Q, I, U, T)
  });
}

// ---------------------------------------------------------------------------
// InnerTubeTransportService singleton
// ---------------------------------------------------------------------------

/**
 * Central transport service for all Innertube API requests.
 * Singleton; initialized once during player bootstrap via
 * {@link initInnerTubeTransport}.
 * [was: aQ]
 */
export class InnerTubeTransportService { // was: aQ
  /** @type {InnerTubeTransportService | undefined} */
  static instance = undefined;

  /**
   * @param {object} requestBuilderRegistry - Signal/request builder map [was: Q -> j]
   * @param {object} fetchTransport         - Fetch-based transport      [was: c -> CU]
   * @param {object} authProvider           - Auth header provider       [was: W -> W]
   * @param {object} responseProcessors     - Response handler map       [was: m -> K]
   * @param {object} responseCache          - Response store / cache     [was: K -> A]
   */
  constructor(requestBuilderRegistry, fetchTransport, authProvider, responseProcessors, responseCache) {
    this.requestBuilderRegistry = requestBuilderRegistry; // was: j
    this.fetchTransport         = fetchTransport;         // was: CU
    this.authProvider           = authProvider;            // was: W
    this.responseProcessors     = responseProcessors;     // was: K
    this.responseCache          = responseCache;           // was: A
    this.pendingRequests        = new Map();               // was: O

    // Merge default signal handlers
    if (!requestBuilderRegistry.signalHandlers) { // was: hf
      requestBuilderRegistry.signalHandlers = {};
    }
    requestBuilderRegistry.signalHandlers = {
      ...DEFAULT_SIGNAL_HANDLERS, // was: uOx
      ...requestBuilderRegistry.signalHandlers,
    };
  }

  /**
   * Checks whether a command object has a matching request builder.
   * [was: zP]
   *
   * @param {object} command
   * @returns {boolean}
   */
  hasRequestBuilder(command) { // was: zP
    return hasMatchingBuilder(command, this.requestBuilderRegistry); // was: k_y(Q, this.j)
  }
}

/**
 * Initializes the singleton InnerTubeTransportService.
 * Throws if called more than once with different arguments.
 * [was: cG_]
 *
 * @param {object} requestBuilderRegistry
 * @param {object} fetchTransport
 * @param {object} authProvider
 * @param {object} responseProcessors
 * @param {object} responseCache
 */
export function initInnerTubeTransport(requestBuilderRegistry, fetchTransport, authProvider, responseProcessors, responseCache) { // was: cG_
  if (InnerTubeTransportService.instance !== undefined) {
    const existing = InnerTubeTransportService.instance;
    const mismatches = [
      requestBuilderRegistry !== existing.requestBuilderRegistry,
      fetchTransport         !== existing.fetchTransport,
      authProvider           !== existing.authProvider,
      responseCache          !== existing.responseCache,
      false, false, false,
    ];
    if (mismatches.some((m) => m)) {
      throw new InnertubeError('InnerTubeTransportService is already initialized', mismatches);
    }
  } else {
    InnerTubeTransportService.instance = new InnerTubeTransportService(
      requestBuilderRegistry,
      fetchTransport,
      authProvider,
      responseProcessors,
      responseCache,
    );
  }
}

// ---------------------------------------------------------------------------
// Response cache entry
// ---------------------------------------------------------------------------

/**
 * Wraps a cached Innertube response with expiration and processing state.
 * [was: Vaw]
 */
export class CachedResponse { // was: Vaw
  /**
   * @param {object} entryData - Raw cache entry data
   */
  constructor(entryData) {
    this.data = { ...entryData };
    delete this.data.innertubeResponse?.frameworkUpdates;
  }

  /**
   * Whether the cached entry has passed its TTL.
   * @returns {boolean}
   */
  isExpired() {
    return Number(this.data.expireTimestampMs || 0) < now(); // was: g.h()
  }

  /**
   * Whether the response has already been processed by response processors.
   * @returns {boolean}
   */
  isProcessed() {
    return !!this.data.isProcessed;
  }
}

// ---------------------------------------------------------------------------
// Response processor categories
// ---------------------------------------------------------------------------

/**
 * The ordered list of response-processor keys that are checked after every
 * Innertube API response.
 * [was: AGK]
 *
 * @type {string[]}
 */
export const RESPONSE_PROCESSOR_KEYS = [
  'tokens',
  'consistency',
  'service_params',
  'mss',
  'client_location',
  'entities',
  'adblock_detection',
  'response_received_commands',
  'store',
  'manifest',
  'player_preload',
  'shorts_prefetch',
  'resolve_url_prefetch',
];

// ---------------------------------------------------------------------------
// Innertube response type hints
// ---------------------------------------------------------------------------

/**
 * Type URLs that the transport layer uses to unwrap error detail payloads.
 * [was: I4m]
 *
 * @type {string[]}
 */
export const INNERTUBE_RESPONSE_TYPE_URLS = [
  'type.googleapis.com/youtube.api.pfiinnertube.YoutubeApiInnertube.BrowseResponse',
  'type.googleapis.com/youtube.api.pfiinnertube.YoutubeApiInnertube.PlayerResponse',
  'type.googleapis.com/youtube.api.pfiinnertube.YoutubeApiInnertube.PanelResponse',
];

// ---------------------------------------------------------------------------
// Placeholder imports (from ../core/ and sibling modules)
// ---------------------------------------------------------------------------
// These references are intentional stubs showing expected imports.
// Actual paths depend on the rest of the deobfuscated codebase.

/*
import { getConfigValue, getExperimentFlag, getExperimentsToken,
         getInternalExperimentFlags, getGlobal, deepClone, now,
         parseQueryString, appendQueryParams, logWarning, logSilent }
  from '../core/config.js';
import { getPreferences, getStoredTheme, getClientScreenNonce }
  from '../core/preferences.js';
import { getConnectionType, getEffectiveConnectionType }
  from '../core/device.js';
import { getAdSignals }
  from '../core/ad-signals.js';
import { LocationService }
  from '../core/location-service.js';
import { getAuthService, DEFAULT_AUTH_IDENTITY }
  from '../core/auth.js';
import { getNetworklessQueue, isNetworklessReady, networklessState }
  from './networkless.js';
import { sendXhrRequest, sendPostRequest, compressAndSend }
  from './request.js';
import { isSameOrigin, applyHostOverride, appendCondensedParam,
         buildFetchOptions, stripApiPrefix, startPerfTimer }
  from './service-endpoints.js';
import { InnertubeError }
import { getExperimentsToken, getExperimentFlag, parseQueryString, applyHostOverride } from '../core/composition-helpers.js';
import { appendQueryParams, isSameOrigin } from './service-endpoints.js';
  from '../core/errors.js';
*/
