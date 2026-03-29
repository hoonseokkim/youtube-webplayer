/**
 * DRM signature encryption — async/sync signature generation, encrypted
 * client key handling, and the DRM adapter interface for onesie requests.
 *
 * Extracted from base.js lines 41000–42000.
 * Covers w2x (async signature), jl7 (sync cached signature), LGR (sync
 * encrypt fallback), I4 / R5n (raw encrypt), kH0 / Y$W / QlO / cR7
 * (key operations), Oc7 (onesie decrypt), and the downstream onesie
 * request assembly (dB, da7, slx).
 *
 * @module drm-signature
 */
import { getSubtleCrypto } from '../proto/varint-decoder.js';
import { getUserAgent } from '../core/browser-detection.js';
import { getConfig } from '../core/composition-helpers.js';

// ---------------------------------------------------------------------------
// I4 — synchronous encrypt with fallback
// ---------------------------------------------------------------------------

/**
 * Encrypt `plaintext` with the DRM key, using the async adapter when
 * available (W.W) or falling back to the sync Ue-based encryptor.
 *
 * [was: I4]  (line 40310)
 *
 * @param {Object} keyState   [was: Q] — key state holder (.W = { W: asyncAdapter, O: keyBytes })
 * @param {Uint8Array} plaintext [was: c] — data to encrypt
 * @param {Uint8Array} iv        [was: W] — initialisation vector
 * @returns {Uint8Array|null} ciphertext, or null on failure
 */
export function encryptSync(keyState, plaintext, iv) { // was: I4
  const asyncResult = keyState.key.asyncEncryptor?.encrypt(plaintext, iv); // was: Q.W.W?.encrypt(c, W)
  if (asyncResult) return asyncResult;
  return new SyncEncryptor(keyState.key.keyBytes).encrypt(plaintext, iv); // was: (new Ue(Q.W.O)).encrypt(c, W)
}

// ---------------------------------------------------------------------------
// R5n — async encrypt with Web Crypto fallback
// ---------------------------------------------------------------------------

/**
 * Attempt to encrypt via the Web Crypto SubtleCrypto API (JlW adapter)
 * when available; fall back to the synchronous `I4` path on failure.
 *
 * [was: R5n]  (line 40314)
 *
 * @param {Object} keyState   [was: Q] — key state holder
 * @param {Uint8Array} plaintext [was: c]
 * @param {Uint8Array} iv        [was: W]
 * @returns {Promise<Uint8Array>} ciphertext
 */
export async function encryptAsync(keyState, plaintext, iv) { // was: R5n
  let webCryptoAdapter; // was: m
  {
    const state = keyState.key; // was: m = Q.W
    const subtleCrypto = getSubtleCrypto(); // was: zh()
    webCryptoAdapter = subtleCrypto
      ? new WebCryptoEncryptor(state.keyBytes, subtleCrypto) // was: new JlW(m.O, K)
      : undefined;
  }

  if (webCryptoAdapter) {
    try {
      return await webCryptoAdapter.encrypt(plaintext, iv);
    } catch (_ignored) {
      // Fall through to sync path
    }
  }
  return encryptSync(keyState, plaintext, iv); // was: I4(Q, c, W)
}

// ---------------------------------------------------------------------------
// kH0 — encrypt request body (async path, may use Web Crypto)
// ---------------------------------------------------------------------------

/**
 * Encrypt the full request body for an onesie request.  If the key
 * state has an async adapter, uses R5n (Web Crypto); otherwise falls
 * back to SKW (stream key wrapper) for the symmetric encrypt.
 *
 * [was: kH0]  (line 40326)
 *
 * @param {Object} keyState [was: Q] — key state holder (.W = key, .iv = current IV)
 * @param {Uint8Array} body [was: c] — request body bytes
 * @returns {Promise<Uint8Array>} encrypted body
 */
export async function encryptRequestBody(keyState, body) { // was: kH0
  performance.now(); // was: (0, g.h)()  — timing side-effect
  if (keyState.key.asyncEncryptor) { // was: Q.W.W
    return encryptAsync(keyState, body, keyState.iv); // was: R5n(Q, c, Q.iv)
  }
  return createStreamKeyWrapper(keyState.key).encrypt(body, keyState.iv); // was: SKW(Q.W).encrypt(c, Q.iv)
}

// ---------------------------------------------------------------------------
// Y$W — synchronous signature lookup (cached)
// ---------------------------------------------------------------------------

/**
 * Attempt a fast synchronous signature from the key state's cache.
 * Returns `{ iP: encryptedPayload, signature }` on hit, or undefined
 * on miss.
 *
 * [was: Y$W]  (line 40331)
 *
 * @param {Object} keyState [was: Q] — key state holder
 * @param {Uint8Array} body [was: c] — request body
 * @returns {{ iP: Uint8Array, signature: Uint8Array } | undefined}
 */
export function lookupCachedSignature(keyState, body) { // was: Y$W
  performance.now(); // was: (0, g.h)()
  return keyState.key.asyncEncryptor?.getCached(body, keyState.iv); // was: Q.W.W?.O(c, Q.iv)
}

// ---------------------------------------------------------------------------
// QlO — compute HMAC signature via pq7 adapter
// ---------------------------------------------------------------------------

/**
 * Compute an HMAC-based signature for the encrypted payload using the
 * pq7 (HMAC adapter) key.  Lazily initialises the HMAC key on the
 * key state if it hasn't been created yet.
 *
 * [was: QlO]  (line 40336)
 *
 * @param {Object} keyState        [was: Q] — key state holder
 * @param {Uint8Array} encryptedPayload [was: c] — the encrypted request body
 * @returns {Promise<Uint8Array>} HMAC signature bytes
 */
export async function computeHmacSignature(keyState, encryptedPayload) { // was: QlO
  performance.now(); // was: (0, g.h)()
  const key = keyState.key; // was: W = Q.W
  if (!key.hmacKey) { // was: W.K
    key.hmacKey = new HmacAdapter(key.hmacSecret); // was: W.K = new pq7(W.A)
  }
  return signWithHmac(key.hmacKey, encryptedPayload, keyState.iv); // was: uhK(W.K, c, Q.iv)
}

// ---------------------------------------------------------------------------
// cR7 — decrypt response body (async, with Web Crypto preference)
// ---------------------------------------------------------------------------

/**
 * Decrypt an onesie response body.  Prefers the async Web Crypto path
 * (R5n) when available; falls back to the sync SKW decryptor.
 *
 * [was: cR7]  (line 40343)
 *
 * @param {Object} keyState [was: Q] — key state holder
 * @param {Uint8Array} ciphertext [was: c] — encrypted response bytes
 * @param {Uint8Array} iv         [was: W] — initialisation vector for this response
 * @returns {Promise<Uint8Array>} decrypted bytes
 */
export async function decryptResponseBody(keyState, ciphertext, iv) { // was: cR7
  performance.now(); // was: (0, g.h)()
  if (keyState.key.asyncEncryptor) { // was: Q.W.W
    return encryptAsync(keyState, ciphertext, iv); // was: R5n(Q, c, W) — same AES-CTR is used for both directions
  }
  return createStreamKeyWrapper(keyState.key).decrypt(ciphertext, iv); // was: SKW(Q.W).decrypt(c, W)
}

// ---------------------------------------------------------------------------
// w2x — async signature encryption for onesie requests
// ---------------------------------------------------------------------------

/**
 * Full async onesie signature flow:
 *   1. Serialise the inner request protobuf via `g.yu(Q, Nl)`.
 *   2. Encrypt the serialised bytes with `kH0` (may use Web Crypto).
 *   3. Compute the HMAC signature with `QlO`.
 *   4. Assemble the final request via `dB`.
 *
 * [was: w2x]  (line 41012)
 *
 * @param {Object} outerRequest   [was: Q] — the onesie outer request (has .DS flag)
 * @param {Object} keyState       [was: c] — key state holder
 * @param {Object} config         [was: W] — player configuration / experiments
 * @param {Object} player         [was: m] — player instance (for getVideoData)
 * @param {Object} schedule       [was: K] — bandwidth schedule
 * @param {Object} ustreamerCfg   [was: T] — optional ustreamer config
 * @param {Object} volumeLevel    [was: r] — volume / media-capabilities info
 * @param {Object} extraContext   [was: U] — additional context payload
 * @returns {Promise<Object>} assembled request data (via dB)
 */
export async function encryptSignatureAsync(outerRequest, keyState, config, player, schedule, ustreamerCfg, volumeLevel, extraContext) { // was: w2x
  let serialisedPayload = serializeRequest(outerRequest, REQUEST_TYPE); // was: I = g.yu(Q, Nl)
  serialisedPayload = await encryptRequestBody(keyState, serialisedPayload); // was: I = await kH0(c, I)
  const signature = await computeHmacSignature(keyState, serialisedPayload); // was: X = await QlO(c, I)
  return assembleOnesieRequest( // was: dB(…)
    { encryptedPayload: serialisedPayload, hmacSignature: signature }, // was: { ao: I, hU: X }
    keyState,
    config,
    player,
    !!outerRequest.disableStreaming, // was: !!Q.DS
    schedule,
    ustreamerCfg,
    volumeLevel,
    extraContext
  );
}

// ---------------------------------------------------------------------------
// jl7 — synchronous cached-signature encryption
// ---------------------------------------------------------------------------

/**
 * Fast-path signature using the cached (pre-computed) signature from
 * `Y$W`.  Returns the assembled request when the cache hits; returns
 * `undefined` on miss, allowing the caller to fall back to the async
 * path (w2x).
 *
 * [was: jl7]  (line 41025)
 *
 * @param {Object} outerRequest [was: Q]
 * @param {Object} keyState     [was: c]
 * @param {Object} config       [was: W]
 * @param {Object} player       [was: m]
 * @param {Object} schedule     [was: K]
 * @param {Object} ustreamerCfg [was: T]
 * @param {Object} volumeLevel  [was: r]
 * @param {Object} extraContext [was: U]
 * @returns {Object|undefined} assembled request, or undefined on cache miss
 */
export function encryptSignatureCached(outerRequest, keyState, config, player, schedule, ustreamerCfg, volumeLevel, extraContext) { // was: jl7
  let serialisedPayload = serializeRequest(outerRequest, REQUEST_TYPE); // was: I = g.yu(Q, Nl)
  const cached = lookupCachedSignature(keyState, serialisedPayload); // was: I = Y$W(c, I)
  if (!cached) return undefined;
  return assembleOnesieRequest(
    { encryptedPayload: cached.iP, hmacSignature: cached.signature }, // was: { ao: I.iP, hU: I.signature }
    keyState,
    config,
    player,
    !!outerRequest.disableStreaming, // was: !!Q.DS
    schedule,
    ustreamerCfg,
    volumeLevel,
    extraContext
  );
}

// ---------------------------------------------------------------------------
// LGR — synchronous encrypt with IV-based signature
// ---------------------------------------------------------------------------

/**
 * The synchronous encrypt-and-sign path used when the async adapter
 * is unavailable or when `outerRequest.DS` (disable-streaming) is set.
 *
 *   1. Serialise the request (`g.yu`).
 *   2. Attempt `Y$W` (cached).  On hit, use cached encrypted payload
 *      and signature directly.
 *   3. On miss, call the raw `encrypt` method on the key state, then
 *      compute the IV-based signature via `vRO(Ps_)`.
 *   4. Assemble via `dB`.
 *
 * [was: LGR]  (line 40995)
 *
 * @param {Object} outerRequest [was: Q]
 * @param {Object} keyState     [was: c]
 * @param {Object} config       [was: W]
 * @param {Object} player       [was: m]
 * @param {Object} schedule     [was: K]
 * @param {Object} ustreamerCfg [was: T]
 * @param {Object} volumeLevel  [was: r]
 * @param {Object} extraContext [was: U]
 * @returns {Object} assembled request data
 */
export function encryptSignatureSync(outerRequest, keyState, config, player, schedule, ustreamerCfg, volumeLevel, extraContext) { // was: LGR
  const serialisedPayload = serializeRequest(outerRequest, REQUEST_TYPE); // was: I = g.yu(Q, Nl)
  let encryptedPayload; // was: X
  let signature;        // was: A

  if (!outerRequest.disableStreaming) { // was: !Q.DS
    const cached = lookupCachedSignature(keyState, serialisedPayload); // was: A = Y$W(c, I)
    if (cached) {
      encryptedPayload = cached.iP;
      signature = cached.signature;
    } else {
      encryptedPayload = keyState.encrypt(serialisedPayload); // was: X = c.encrypt(I)
      signature = encryptedPayload; // same ref initially — was: A = X = c.encrypt(I)
      performance.now(); // was: (0, g.h)()
      signature = computeIvSignature( // was: vRO(new Ps_(c.W.A), A, c.iv)
        new SignatureAdapter(keyState.key.hmacSecret), // was: new Ps_(c.W.A)
        signature,
        keyState.iv
      );
    }
  }

  return assembleOnesieRequest(
    encryptedPayload && signature
      ? { encryptedPayload, hmacSignature: signature }      // was: { ao: X, hU: A }
      : { rawPayload: serialisedPayload },                   // was: { Rf: I }
    keyState,
    config,
    player,
    !!outerRequest.disableStreaming,
    schedule,
    ustreamerCfg,
    volumeLevel,
    extraContext
  );
}

// ---------------------------------------------------------------------------
// Oc7 — onesie response decryption
// ---------------------------------------------------------------------------

/**
 * Decrypt the response body of an onesie reply, selecting the async
 * path (cR7 → Web Crypto) when `gDw` indicates it is available.
 *
 * [was: Oc7]  (line 41034)
 *
 * @param {Object} onesieState [was: Q] — onesie request state (.gU = key state, methods: A3, X)
 * @param {Uint8Array} ciphertext [was: c] — encrypted response body
 * @param {Uint8Array} iv         [was: W] — response IV
 * @returns {Promise<Uint8Array>} decrypted response
 */
export async function decryptOnesieResponse(onesieState, ciphertext, iv) { // was: Oc7
  onesieState.markTiming("oprd_s"); // was: Q.A3("oprd_s")
  const decrypted = shouldUseAsyncDecrypt(onesieState) // was: gDw(Q)
    ? await decryptResponseBody(onesieState.keyState, ciphertext, iv) // was: await cR7(Q.gU, c, W)
    : onesieState.keyState.decrypt(ciphertext, iv); // was: Q.gU.decrypt(c, W)
  onesieState.markTiming("oprd_c"); // was: Q.A3("oprd_c")
  return decrypted;
}

// ---------------------------------------------------------------------------
// dB — assemble onesie request from encrypted/raw payload
// ---------------------------------------------------------------------------

/**
 * Build the final request descriptor that is sent to the onesie
 * endpoint.  Merges the encrypted (or raw) payload, the innertube
 * request fields (encrypted client key, IV, flags), the known-format
 * constraints, the ustreamer config, and the video feedback.
 *
 * [was: dB]  (line 40958)
 *
 * @param {Object} payload        [was: first arg — { ao, hU } | { Rf }]
 * @param {Object} keyState       [was: c]
 * @param {Object} config         [was: W]
 * @param {Object} player         [was: m]
 * @param {boolean} disableStream [was: K]
 * @param {Object} schedule       [was: T]
 * @param {Object} ustreamerCfg   [was: r]
 * @param {Object} volumeLevel    [was: U]
 * @param {Object} extraContext   [was: I]
 * @returns {Object} the fully assembled request object
 */
export function assembleOnesieRequest(payload, keyState, config, player, disableStream, schedule, ustreamerCfg, volumeLevel, extraContext) { // was: dB
  const encryptedPayload = payload.encryptedPayload; // was: X = Q.ao
  const hmacSignature = payload.hmacSignature;        // was: A = Q.hU
  const rawPayload = payload.rawPayload;              // was: Q = Q.Rf

  const hasEncryption = encryptedPayload !== undefined && hmacSignature !== undefined; // was: e = X !== void 0 && A !== void 0
  const videoData = player.getVideoData(); // was: V = m.getVideoData()
  const encryptedClientKey = keyState.key.encryptedClientKey; // was: B = c.W.encryptedClientKey
  const iv = hasEncryption ? keyState.iv : undefined; // was: c = e ? c.iv : void 0

  const totalScheduleBytes = computeTotalScheduleBytes(schedule, true); // was: e = U6(T, !0)
  const shouldDisableCompression = disableStream || (!!getSubtleCrypto() && totalScheduleBytes > 1572864); // was: K = K || !!zh() && e > 1572864

  return {
    innertubeRequest: {
      rawPayload,                                      // was: S6: Q
      encryptedPayload,                                // was: p6: X
      hmacSignature,                                   // was: hU: A
      encryptedClientKey,                              // was: encryptedClientKey: B
      iv,                                              // was: iv: c
      enableTranscoding: true,                         // was: Tx: !0
      enableAdaptive: true,                            // was: ai: !0
      supportsDecompression: "DecompressionStream" in window || !shouldDisableCompression, // was: aX
      useJsonFormatter: config.experiments.getFlag(    // was: TX
        "html5_use_jsonformatter_to_parse_player_response"
      )
    },
    knownFormats: buildKnownFormatConstraints({        // was: KF: ZzX(…)
      schedule,
      config,
      player,
      startTimeMs: videoData.startSeconds * 1000,      // was: vp: V.startSeconds * 1E3
      enableDecompression: true                         // was: Dq: !0
    }),
    onesieUstreamerConfig: ustreamerCfg,               // was: onesieUstreamerConfig: r
    volumeLevel,                                       // was: VL: U
    videoFeedback: buildVideoFeedback(videoData),      // was: vF: GD(V)
    reloadPlaybackParams: videoData.reloadParams?.reloadPlaybackParams, // was: reloadPlaybackParams: V.xq?.reloadPlaybackParams
    extraContext                                       // was: zo: I
  };
}

// ---------------------------------------------------------------------------
// da7 — build the innertube /player POST request
// ---------------------------------------------------------------------------

/**
 * Construct the HTTP request (URL, headers, body) for the innertube
 * `/player` endpoint.  Handles auth tokens, visitor data, Lava device
 * context, sherlog, and user-agent headers.
 *
 * [was: da7]  (line 40919)
 *
 * @param {Object} bodyJson      [was: Q] — the JSON body to POST
 * @param {Object} playerConfig  [was: c] — player config (.UR.innertubeApiVersion, .experiments)
 * @param {Object} contextData   [was: W] — innertube context (.visitorData)
 * @param {string|null} authToken [was: m] — OAuth bearer token or null
 * @param {boolean} [disableStreaming=false] [was: K] — DS flag
 * @returns {{ url: string, headers: Array, postBody: Uint8Array, isSync: boolean, disableStreaming: boolean }}
 */
export function buildInnertubePlayerRequest(bodyJson, playerConfig, contextData, authToken, disableStreaming = false) { // was: da7
  const url = `https://youtubei.googleapis.com/youtubei/${playerConfig.apiConfig.innertubeApiVersion}/player`; // was: T
  const headers = [{ name: "Content-Type", value: "application/json" }]; // was: r

  if (authToken) {
    headers.push({ name: "Authorization", value: `Bearer ${authToken}` });
  }
  headers.push({ name: "User-Agent", value: getUserAgent() }); // was: g.iC()

  // Visitor data
  const eomVisitorData = getGlobalConfig("EOM_VISITOR_DATA"); // was: g.v("EOM_VISITOR_DATA")
  if (eomVisitorData) {
    headers.push({ name: "X-Goog-EOM-Visitor-Id", value: eomVisitorData });
  } else {
    const visitorData = contextData.visitorData || getGlobalConfig("VISITOR_DATA"); // was: W.visitorData || g.v("VISITOR_DATA")
    if (visitorData) {
      headers.push({ name: "X-Goog-Visitor-Id", value: visitorData });
    }
  }

  // Lava device context
  const lavaContext = getGlobalConfig("SERIALIZED_LAVA_DEVICE_CONTEXT"); // was: g.v("SERIALIZED_LAVA_DEVICE_CONTEXT")
  if (lavaContext) {
    headers.push({ name: "X-YouTube-Lava-Device-Context", value: lavaContext });
  }

  // Sherlog debug header
  const sherlogUser = getExperimentString(playerConfig.experiments, "debug_sherlog_username"); // was: WU(c.experiments, "debug_sherlog_username")
  if (sherlogUser) {
    headers.push({ name: "X-Youtube-Sherlog-Username", value: sherlogUser });
  }

  const postBody = encodeToBytes(JSON.stringify(bodyJson)); // was: I8(JSON.stringify(Q))

  return {
    url,
    headers,          // was: Co: r
    postBody,         // was: postBody: Q
    isSync: disableStreaming, // was: Ja: K
    disableStreaming   // was: DS: K
  };
}

// ---------------------------------------------------------------------------
// gDw — should we use async (Web Crypto) decryption?
// ---------------------------------------------------------------------------

/**
 * Returns true when the async decrypt path should be used for onesie
 * responses.  Disabled by the `html5_onesie_sync_request_encryption`
 * experiment or when the request has `DS` (disable-streaming) set.
 *
 * [was: gDw]  (line 41051)
 *
 * @param {Object} onesieState  [was: Q] — onesie request state
 * @param {Object} [outerRequest] [was: c] — optional outer request with .DS flag
 * @returns {boolean}
 */
export function shouldUseAsyncDecrypt(onesieState, outerRequest) { // was: gDw
  if (onesieState.getExperiment("html5_onesie_sync_request_encryption") || outerRequest?.disableStreaming) { // was: Q.X("html5_onesie_sync_request_encryption") || c?.DS
    return false;
  }
  return !!getSubtleCrypto(); // was: !!zh()
}

// ---------------------------------------------------------------------------
// slx — set common query params on the onesie URL
// ---------------------------------------------------------------------------

/**
 * Append standard onesie query parameters (CPN, opr, por, timing
 * flags, preferred-format itags) to the URL being built.
 *
 * [was: slx]  (line 40901)
 *
 * @param {URLSearchParams|Object} params    [was: Q] — URL params builder
 * @param {Object}                 videoData [was: c] — video metadata
 * @param {Object|null}            formats   [was: W] — preferred format itags (audio/video arrays)
 * @param {boolean}                [noMedia=false] [was: m] — skip media-byte params
 */
export function setOnesieQueryParams(params, videoData, formats, noMedia = false) { // was: slx
  params.set("cpn", videoData.clientPlaybackNonce);
  params.set("opr", "1");
  const config = videoData.getConfig(); // was: K = c.G()
  params.set("por", "1");

  if (!getSubtleCrypto()) { // was: !zh()
    params.set("onem", "1");
  }

  if (videoData.startSeconds > 0) {
    params.set("osts", `${videoData.startSeconds}`);
  }

  if (noMedia) return;

  if (config.getExperiment("html5_onesie_disable_partial_segments")) { // was: K.X("html5_onesie_disable_partial_segments")
    params.set("oses", "1");
  }

  const skipMediaBytes = config.getExperiment("html5_gapless_onesie_no_media_bytes") &&
    hasAdaptiveSwitch(videoData) && videoData.isGapless; // was: K.X("html5_gapless_onesie_no_media_bytes") && wA(c) && c.gA

  if (formats && !skipMediaBytes) {
    const audioFormats = formats.audio; // was: c = W.audio
    params.set("pvi", formats.video.join(","));
    if (!config.getExperiment("html5_onesie_disable_audio_bytes")) { // was: K.X("html5_onesie_disable_audio_bytes")
      params.set("pai", audioFormats.join(","));
    }
    if (!isWebModule) { // was: !em
      params.set("osh", "1");
    }
  } else {
    params.set("oad", "0");
    params.set("ovd", "0");
    params.set("oaad", "0");
    params.set("oavd", "0");
  }
}

// ---------------------------------------------------------------------------
// L$ — extract onesie request diagnostics
// ---------------------------------------------------------------------------

/**
 * Build a diagnostics object from the onesie request state, including
 * timing data, host information, and the request type.
 *
 * [was: L$]  (line 41041)
 *
 * @param {Object} onesieState [was: Q]
 * @returns {Object} diagnostics bag (empty if no timing data)
 */
export function getOnesieRequestDiagnostics(onesieState) { // was: L$
  if (!onesieState.timing) { // was: !Q.Nm
    return {};
  }
  const diag = onesieState.timing.describe(); // was: c = Q.Nm.Y()
  diag.d = onesieState.timing.decoder?.summary(); // was: c.d = Q.Nm.UH?.Eg()
  diag.shost = onesieState.serverHost; // was: c.shost = Q.u$
  diag.ty = "o";
  return diag;
}

// ---------------------------------------------------------------------------
// mad — update primary/secondary host locations
// ---------------------------------------------------------------------------

/**
 * Set the primary and (optionally) secondary host locations on the
 * host manager.  The secondary is derived from the primary via
 * `WGy` (decrement-host regex).
 *
 * [was: mad]  (line 40348)
 *
 * @param {Object} hostManager [was: Q] — host location manager
 * @param {Object} hosts       [was: c] — { primary, secondary } host strings
 */
export function updateHostLocations(hostManager, hosts) { // was: mad
  const primary = hosts?.primary; // was: W = c?.primary
  setHostLocation(hostManager, 0, primary); // was: XX(Q, 0, W)

  const fallbackPrimary = primary ? deriveSecondaryHost(primary) : undefined; // was: W = W ? WGy(W) : void 0
  setHostLocation(hostManager, 2, fallbackPrimary); // was: XX(Q, 2, W)

  setHostLocation(hostManager, 1, hosts?.secondary); // was: XX(Q, 1, c?.secondary)
}

// ---------------------------------------------------------------------------
// WGy — derive secondary host by decrementing the numeric prefix
// ---------------------------------------------------------------------------

/**
 * Given a host string like `"2---sn-abc.googlevideo.com"`, derive the
 * secondary by replacing the leading number: `1→2`, `N→N-1`.
 *
 * [was: WGy]  (line 40381)
 *
 * @param {string} host [was: Q] — primary host string
 * @returns {string} derived secondary host
 */
export function deriveSecondaryHost(host) { // was: WGy
  return host.replace(/(\d+)---/g, (_match, numStr) => { // was: (c, W)
    const num = Number(numStr);
    return `${num === 1 ? 2 : num - 1}---`;
  });
}

// ---------------------------------------------------------------------------
// Helpers referenced but defined elsewhere (stubs for completeness)
// ---------------------------------------------------------------------------

/* These are called by the functions above but live in other modules.
 *
 * serializeRequest             [was: g.yu]         — protobuf serialiser
 * REQUEST_TYPE                 [was: Nl]           — protobuf message type constant
 * getSubtleCrypto              [was: zh]           — returns window.crypto.subtle or null
 * SyncEncryptor                [was: Ue]           — pure-JS AES-CTR encryptor
 * WebCryptoEncryptor           [was: JlW]          — Web Crypto AES-CTR wrapper
 * HmacAdapter                  [was: pq7]          — HMAC-SHA256 adapter
 * SignatureAdapter             [was: Ps_]          — IV-based signature computer
 * createStreamKeyWrapper       [was: SKW]          — stream cipher key wrapper
 * computeIvSignature           [was: vRO]          — compute IV-derived HMAC
 * signWithHmac                 [was: uhK]          — HMAC sign helper
 * encodeToBytes                [was: I8]           — string → Uint8Array
 * buildKnownFormatConstraints  [was: ZzX]          — quality-constraints.js
 * buildVideoFeedback           [was: GD]           — quality-constraints.js
 * computeTotalScheduleBytes    [was: U6]           — performance-monitor.js
 * getUserAgent                 [was: g.iC]         — UA string helper
 * getGlobalConfig              [was: g.v]          — global config lookup
 * getExperimentString          [was: WU]           — experiment string accessor
 * hasAdaptiveSwitch            [was: wA]           — gapless-playback.js
 * setHostLocation              [was: XX]           — (local to host manager)
 */
