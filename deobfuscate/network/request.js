import { getStatus, parseResponse } from '../core/composition-helpers.js';
import { getResponseText } from '../modules/remote/mdx-session.js';

/**
 * XHR / Fetch Wrapper Classes
 *
 * Provides two request adapters used throughout the YouTube web player:
 *
 * 1. **XhrIo** (`XhrIo`) -- a goog.net.XhrIo-style wrapper around
 *    `XMLHttpRequest` with event dispatching, timeout, and retry support.
 * 2. **FetchXhr** (`pZ`) -- a drop-in replacement that uses the Fetch API
 *    internally but exposes the same `XMLHttpRequest`-like interface
 *    (open/send/abort/getResponseHeader) so callers need not distinguish.
 *
 * Also includes the high-level AJAX helpers (`sendXhrRequest`, `H3W`, `cn`) that the
 * rest of the codebase calls for one-off or promise-based requests.
 *
 * Source: base.js lines 7609-7773, 8694-8725, 11291-11549,
 *         62122-62250, 63157-63287, 66713, 66735-66761
 *
 * @module network/request
 */

// ---------------------------------------------------------------------------
// XMLHttpRequest factory
// ---------------------------------------------------------------------------

/**
 * Returns a fresh `XMLHttpRequest` instance, or null if unavailable.
 * [was: VWw / BYX]
 *
 * @returns {XMLHttpRequest | null}
 */
export const createXhr = // was: VWw
  'XMLHttpRequest' in globalThis ? () => new XMLHttpRequest() : null;

// ---------------------------------------------------------------------------
// XhrIo -- event-based XMLHttpRequest wrapper
// ---------------------------------------------------------------------------

/**
 * Event-dispatching wrapper around `XMLHttpRequest`.
 * Extends the framework EventTarget (`EventTargetBase`).
 *
 * Fires the following events:
 *   - `"complete"` -- request finished (success or error)
 *   - `"success"`  -- request finished with an OK status
 *   - `"error"`    -- request finished with a non-OK status
 *   - `"timeout"`  -- request exceeded `timeoutMs`
 *   - `"abort"`    -- request was aborted by caller
 *   - `"ready"`    -- underlying XHR has been cleaned up
 *   - `"readystatechange"` -- forwarded from the native XHR
 *
 * [was: XhrIo]
 */
export class XhrIo extends EventTarget { // was: g.aY
  /**
   * @param {object} [xhrFactory] - Factory producing raw XHR instances [was: Ie]
   */
  constructor(xhrFactory) {
    super();
    /** @type {Map<string, string>} Custom default headers */
    this.headers = new Map();                    // was: this.headers

    /** @private XHR factory [was: Ie] */
    this._xhrFactory = xhrFactory || null;

    /** @private Whether the request is in-flight [was: A] */
    this._active = false;

    /** @private The underlying XMLHttpRequest [was: W] */
    this._xhr = null;

    /** @private Last request URL [was: L] */
    this._lastUri = '';

    /** @private Error code enum (0=none, 5=error, 6=http-error, 7=abort, 8=timeout) [was: O] */
    this._errorCode = 0;

    /** @private Human-readable last error [was: j] */
    this._lastError = '';

    /** @private Whether the XHR state change is from open/send [was: b0] */
    this._inOpenOrSend = false;

    /** @private Whether the XHR state change is from send [was: Y] */
    this._inSend = false;

    /** @private Whether the state change is from abort [was: K] */
    this._inAbort = false;

    /** @private Timeout timer ID [was: D] */
    this._timeoutId = null;

    /** @private Timeout duration (ms), 0 = no timeout [was: mF] */
    this.timeoutMs = 0;

    /** @private Response type override [was: T2] */
    this._responseType = '';

    /** @private Whether to use CORS credentials [was: J] */
    this._withCredentials = false;
  }

  /**
   * Sends an HTTP request.
   * [was: XhrIo.prototype.send]
   *
   * @param {string} url        [was: Q]
   * @param {string} [method='GET'] [was: c]
   * @param {string|FormData} [body]  [was: W -> Q after reassignment]
   * @param {Map|Object} [extraHeaders] [was: m]
   */
  send(url, method, body, extraHeaders) {
    if (this._xhr) {
      throw Error('[goog.net.XhrIo] Object is active with another request=' +
        this._lastUri + '; newUri=' + url);
    }

    method = method ? method.toUpperCase() : 'GET';
    this._lastUri = url;
    this._lastError = '';
    this._errorCode = 0;
    this._inOpenOrSend = false;
    this._active = true;

    this._xhr = this._xhrFactory ? this._xhrFactory.create() : createXhr(); // was: BF7.W()
    this._xhr.onreadystatechange = this._onReadyStateChange.bind(this);

    try {
      this._inOpenOrSend = true;
      this._xhr.open(method, String(url), true);
      this._inOpenOrSend = false;
    } catch (err) {
      this._handleError(err); // was: lS(this, T)
      return;
    }

    const mergedHeaders = new Map(this.headers);
    if (extraHeaders) {
      if (Object.getPrototypeOf(extraHeaders) === Object.prototype) {
        for (const key in extraHeaders) mergedHeaders.set(key, extraHeaders[key]);
      } else if (typeof extraHeaders.keys === 'function' && typeof extraHeaders.get === 'function') {
        for (const key of extraHeaders.keys()) mergedHeaders.set(key, extraHeaders.get(key));
      } else {
        throw Error('Unknown input type for opt_headers: ' + String(extraHeaders));
      }
    }

    // Auto-set Content-Type for POST/PUT when not already set and not FormData
    const contentTypeKey = Array.from(mergedHeaders.keys()).find(
      (k) => k.toLowerCase() === 'content-type',
    );
    const isFormData = globalThis.FormData && body instanceof globalThis.FormData;
    const isPostOrPut = ['POST', 'PUT'].includes(method);
    if (isPostOrPut && !contentTypeKey && !isFormData) {
      mergedHeaders.set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
    }

    for (const [key, value] of mergedHeaders) {
      this._xhr.setRequestHeader(key, value);
    }

    if (this._responseType) this._xhr.responseType = this._responseType;
    if ('withCredentials' in this._xhr && this._xhr.withCredentials !== this._withCredentials) {
      this._xhr.withCredentials = this._withCredentials;
    }

    try {
      if (this._timeoutId) { clearTimeout(this._timeoutId); this._timeoutId = null; }
      if (this.timeoutMs > 0) {
        this._timeoutId = setTimeout(this._onTimeout.bind(this), this.timeoutMs);
      }
      this._inSend = true;
      this._xhr.send(body);
      this._inSend = false;
    } catch (err) {
      this._handleError(err);
    }
  }

  /**
   * Aborts the current request.
   * [was: XhrIo.prototype.abort]
   *
   * @param {number} [code=7] - Error code to set (7 = user abort)
   */
  abort(code) { // was: abort
    if (this._xhr && this._active) {
      this._active = false;
      this._inAbort = true;
      this._xhr.abort();
      this._inAbort = false;
      this._errorCode = code || 7;
      this.dispatchEvent(new Event('complete'));
      this.dispatchEvent(new Event('abort'));
      this._cleanup();
    }
  }

  /** @returns {boolean} Whether a request is currently in flight */
  isActive() { return !!this._xhr; } // was: isActive

  /** @returns {boolean} Whether the underlying XHR has reached readyState 4 */
  isComplete() { return this.getReadyState() === 4; } // was: isComplete

  /**
   * Returns the HTTP status code, or -1 if not available.
   * @returns {number}
   */
  getStatus() { // was: getStatus
    try {
      return this.getReadyState() > 2 ? this._xhr.status : -1;
    } catch {
      return -1;
    }
  }

  /**
   * Returns the XHR readyState.
   * [was: g.hz]
   * @returns {number}
   */
  getReadyState() { // was: g.hz
    return this._xhr ? this._xhr.readyState : 0;
  }

  /**
   * Returns the response text.
   * [was: g.MA]
   * @returns {string}
   */
  getResponseText() { // was: g.MA
    try { return this._xhr ? this._xhr.responseText : ''; }
    catch { return ''; }
  }

  /**
   * Returns the response body (type depends on responseType).
   * [was: g.Jz]
   * @returns {*}
   */
  getResponse() { // was: g.Jz
    try {
      if (!this._xhr) return null;
      if ('response' in this._xhr) return this._xhr.response;
      switch (this._responseType) {
        case '': case 'text': return this._xhr.responseText;
        case 'arraybuffer':
          if ('mozResponseArrayBuffer' in this._xhr) return this._xhr.mozResponseArrayBuffer;
      }
      return null;
    } catch { return null; }
  }

  /**
   * Returns all response headers as a key-value object.
   * [was: g.RY]
   * @returns {Record<string, string>}
   */
  getAllResponseHeaders() { // was: g.RY
    const result = {};
    const raw = (this._xhr && this.getReadyState() >= 2
      ? this._xhr.getAllResponseHeaders() || ''
      : ''
    ).split('\r\n');

    for (const line of raw) {
      if (!line.trim()) continue;
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) continue;
      const name  = line.substring(0, colonIdx);
      const value = line.substring(colonIdx + 1).trim();
      const existing = result[name] || [];
      result[name] = existing;
      existing.push(value);
    }

    // Join multiple values with ", "
    for (const key of Object.keys(result)) {
      result[key] = result[key].join(', ');
    }
    return result;
  }

  /**
   * Returns a single response header value.
   * [was: g.ku]
   *
   * @param {string} name
   * @returns {string | undefined}
   */
  getResponseHeader(name) { // was: g.ku
    if (this._xhr && this.isComplete()) {
      const value = this._xhr.getResponseHeader(name);
      return value === null ? undefined : value;
    }
  }

  /**
   * Returns the last error message.
   * [was: getLastError]
   * @returns {string}
   */
  getLastError() {
    return typeof this._lastError === 'string' ? this._lastError : String(this._lastError);
  }

  // -- Private methods ------------------------------------------------------

  /** @private [was: BK] */
  _onReadyStateChange() {
    if (this._inOpenOrSend || this._inSend || this._inAbort) {
      this._processReadyState();
    } else {
      this._processReadyState();
    }
  }

  /** @private [was: CO] */
  _processReadyState() {
    if (!this._active) return;

    this.dispatchEvent(new Event('readystatechange'));

    if (!this.isComplete()) return;

    this._active = false;
    try {
      if (this._isSuccess()) {
        this.dispatchEvent(new Event('complete'));
        this.dispatchEvent(new Event('success'));
      } else {
        this._errorCode = 6;
        try {
          this._lastError = (this.getReadyState() > 2 ? this._xhr.statusText : '') +
            ' [' + this.getStatus() + ']';
        } catch { this._lastError = ''; }
        this.dispatchEvent(new Event('complete'));
        this.dispatchEvent(new Event('error'));
      }
    } finally {
      this._cleanup();
    }
  }

  /**
   * Checks whether the HTTP status is a success code.
   * [was: zQ]
   * @private
   * @returns {boolean}
   */
  _isSuccess() {
    const status = this.getStatus();
    switch (status) {
      case 200: case 201: case 202: case 204: case 206: case 304: case 1223:
        return true;
      default:
        // Status 0 is success for file:// or extension protocols
        if (status === 0) {
          const scheme = (this._lastUri.match(/^([a-z]+):/i) || [])[1];
          return !/^https?$/i.test(scheme || '');
        }
        return false;
    }
  }

  /** @private [was: lS] */
  _handleError(err) {
    this._active = false;
    this._lastError = err;
    this._errorCode = 5;
    this.dispatchEvent(new Event('complete'));
    this.dispatchEvent(new Event('error'));
    this._cleanup();
  }

  /** @private Timeout handler [was: ES] */
  _onTimeout() {
    if (this._xhr) {
      this._lastError = `Timed out after ${this.timeoutMs}ms, aborting`;
      this._errorCode = 8;
      this.dispatchEvent(new Event('timeout'));
      this.abort(8);
    }
  }

  /** @private Cleans up XHR reference [was: PJ] */
  _cleanup() {
    if (this._xhr) {
      if (this._timeoutId) { clearTimeout(this._timeoutId); this._timeoutId = null; }
      const xhr = this._xhr;
      this._xhr = null;
      this.dispatchEvent(new Event('ready'));
      try { xhr.onreadystatechange = null; } catch {}
    }
  }
}

// ---------------------------------------------------------------------------
// FetchXhr -- Fetch-API-backed XHR-compatible adapter
// ---------------------------------------------------------------------------

/**
 * Implements the same interface as `XMLHttpRequest` (open/send/abort/
 * getResponseHeader/getAllResponseHeaders) but uses the Fetch API internally.
 * Supports streaming reads via `ReadableStream` when available.
 * [was: pZ]
 */
export class FetchXhr extends EventTarget { // was: pZ
  /**
   * @param {Window} [fetchContext] - Window whose `fetch` to use [was: Q -> b0]
   * @param {boolean} [streamBinaryChunks=false] - Return raw Uint8Array chunks [was: c -> D]
   */
  constructor(fetchContext, streamBinaryChunks = false) {
    super();
    this._fetchContext = fetchContext;                    // was: b0
    this._streamBinaryChunks = streamBinaryChunks;       // was: D

    this.readyState    = 0;        // was: readyState
    this.status        = 0;        // was: status
    this.statusText    = '';       // was: statusText
    this.responseType  = '';       // was: responseType
    this.response      = '';       // was: response
    this.responseText  = '';       // was: responseText
    this.responseXML   = null;     // was: responseXML
    this.onreadystatechange = null; // was: onreadystatechange

    /** @private Request headers [was: Y] */
    this._requestHeaders = new Headers();

    /** @private Response headers [was: O] */
    this._responseHeaders = null;

    /** @private HTTP method [was: S] */
    this._method = 'GET';

    /** @private Request URL [was: mF] */
    this._url = '';

    /** @private Whether send() has been called [was: W] */
    this._sent = false;

    /** @private The native Response object [was: j] */
    this._fetchResponse = null;

    /** @private ReadableStream reader [was: A] */
    this._streamReader = null;

    /** @private TextDecoder for streaming text [was: J] */
    this._textDecoder = null;

    /** @private Credentials mode [was: K] */
    this._credentialsMode = undefined;

    /** @private AbortController [was: L] */
    this._abortController = new AbortController();
  }

  /**
   * Opens a new request.
   * @param {string} method
   * @param {string} url
   */
  open(method, url) {
    if (this.readyState !== 0) {
      throw (this.abort(), Error('Error reopening a connection'));
    }
    this._method = method;
    this._url = url;
    this.readyState = 1;
    this._fireReadyStateChange();
  }

  /**
   * Sends the request.
   * @param {string|Blob|ArrayBuffer|FormData} [body]
   */
  send(body) {
    if (this.readyState !== 1) {
      throw (this.abort(), Error('need to call open() first. '));
    }
    if (this._abortController.signal.aborted) {
      throw (this.abort(), Error('Request was aborted.'));
    }

    this._sent = true;
    const init = {
      headers: this._requestHeaders,
      method:  this._method,
      credentials: this._credentialsMode,
      cache:   undefined,
      signal:  this._abortController.signal,
    };
    if (body) init.body = body;

    const fetchFn = (this._fetchContext || globalThis).fetch;
    fetchFn(new Request(this._url, init))
      .then(this._onFetchResponse.bind(this), this._onFetchError.bind(this));
  }

  /** Aborts the request. */
  abort() {
    this.response = this.responseText = '';
    this._requestHeaders = new Headers();
    this.status = 0;
    this._abortController.abort('Request was aborted.');
    this._streamReader?.cancel('Request was aborted.').catch(() => {});

    if (this.readyState >= 1 && this._sent && this.readyState !== 4) {
      this._sent = false;
      this._finalize();
    }
    this.readyState = 0;
  }

  /**
   * Sets a request header.
   * @param {string} name
   * @param {string} value
   */
  setRequestHeader(name, value) {
    this._requestHeaders.append(name, value);
  }

  /**
   * Returns a response header value.
   * @param {string} name
   * @returns {string}
   */
  getResponseHeader(name) {
    return this._responseHeaders ? this._responseHeaders.get(name.toLowerCase()) || '' : '';
  }

  /**
   * Returns all response headers as a CRLF-delimited string.
   * @returns {string}
   */
  getAllResponseHeaders() {
    if (!this._responseHeaders) return '';
    const lines = [];
    const entries = this._responseHeaders.entries();
    for (let entry = entries.next(); !entry.done; entry = entries.next()) {
      lines.push(entry.value[0] + ': ' + entry.value[1]);
    }
    return lines.join('\r\n');
  }

  /**
   * Sets the credentials mode.
   * [was: setCredentialsMode]
   * @param {string} mode - "include" | "same-origin" | "omit"
   */
  setCredentialsMode(mode) { this._credentialsMode = mode; }

  // -- Private methods ------------------------------------------------------

  /**
   * Handles the resolved fetch Response.
   * [was: W3]
   * @private
   */
  _onFetchResponse(response) { // was: W3
    if (!this._sent) return;

    this._fetchResponse = response;

    if (!this._responseHeaders) {
      this.status = this._fetchResponse.status;
      this.statusText = this._fetchResponse.statusText;
      this._responseHeaders = response.headers;
      this.readyState = 2;
      this._fireReadyStateChange();
    }

    if (!this._sent) return;
    this.readyState = 3;
    this._fireReadyStateChange();
    if (!this._sent) return;

    if (this.responseType === 'arraybuffer') {
      response.arrayBuffer().then(this._onArrayBuffer.bind(this), this._onFetchError.bind(this));
    } else if (typeof globalThis.ReadableStream !== 'undefined' && 'body' in response) {
      this._streamReader = response.body.getReader();
      if (this._streamBinaryChunks) {
        if (this.responseType) throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');
        this.response = [];
      } else {
        this.response = this.responseText = '';
        this._textDecoder = new TextDecoder();
      }
      this._readNextChunk();
    } else {
      response.text().then(this._onText.bind(this), this._onFetchError.bind(this));
    }
  }

  /**
   * Processes a streamed chunk.
   * [was: mB]
   * @private
   */
  _onStreamChunk(result) { // was: mB
    if (!this._sent) return;

    if (this._streamBinaryChunks && result.value) {
      this.response.push(result.value);
    } else if (!this._streamBinaryChunks) {
      const bytes = result.value || new Uint8Array(0);
      const decoded = this._textDecoder.decode(bytes, { stream: !result.done });
      if (decoded) this.response = this.responseText += decoded;
    }

    if (result.done) {
      this._finalize();
    } else {
      this._fireReadyStateChange();
      if (this.readyState === 3) this._readNextChunk();
    }
  }

  /** @private [was: Qt] */
  _readNextChunk() {
    this._streamReader.read()
      .then(this._onStreamChunk.bind(this))
      .catch(this._onFetchError.bind(this));
  }

  /** @private [was: fZ] */
  _onText(text) {
    if (this._sent) {
      this.response = this.responseText = text;
      this._finalize();
    }
  }

  /** @private [was: Tz] */
  _onArrayBuffer(buffer) {
    if (this._sent) {
      this.response = buffer;
      this._finalize();
    }
  }

  /** @private [was: Fe] */
  _onFetchError() {
    if (this._sent) this._finalize();
  }

  /** @private Sets readyState to 4 and fires change [was: mv] */
  _finalize() {
    this.readyState = 4;
    this._fetchResponse = null;
    this._streamReader = null;
    this._textDecoder = null;
    this._fireReadyStateChange();
  }

  /** @private [was: cx] */
  _fireReadyStateChange() {
    if (this.onreadystatechange) this.onreadystatechange.call(this);
  }
}

// The withCredentials getter/setter (mirrors native XHR behavior)
Object.defineProperty(FetchXhr.prototype, 'withCredentials', {
  get() { return this._credentialsMode === 'include'; },
  set(val) { this.setCredentialsMode(val ? 'include' : 'same-origin'); },
});

// ---------------------------------------------------------------------------
// High-level AJAX helpers
// ---------------------------------------------------------------------------

/**
 * Low-level XHR sender. Opens and sends a request via `XMLHttpRequest`,
 * setting headers and handling progress/attribution.
 * [was: cn / NYx]
 *
 * @param {string} url
 * @param {Function} [callback] - Called when readyState reaches 4
 * @param {string} [method='GET']
 * @param {string} [body='']
 * @param {Record<string, string>} [headers]
 * @param {string} [responseType]
 * @param {boolean} [withCredentials=false]
 * @param {boolean} [attributionReporting=false]
 * @param {Function} [onProgress] - Streaming progress callback
 * @returns {XMLHttpRequest | null}
 */
export function sendRawXhr( // was: cn
  url,
  callback,
  method = 'GET',
  body = '',
  headers,
  responseType,
  withCredentials = false,
  attributionReporting = false,
  onProgress,
) {
  const xhr = createXhr?.(); // was: BYX()
  if (!xhr) return null;

  const onComplete = () => {
    const state = xhr.readyState ?? 0;
    if (state === 4 && callback) callback(xhr);
  };

  if ('onloadend' in xhr) {
    xhr.addEventListener('loadend', onComplete, false);
  } else {
    xhr.onreadystatechange = onComplete;
  }

  xhr.open(method, url, true);
  if (responseType) xhr.responseType = responseType;
  if (withCredentials) xhr.withCredentials = true;

  // Auto-set Content-Type for POST when no Content-Type header is provided
  let needsContentType = method === 'POST' && (
    window.FormData === undefined || !(body instanceof FormData)
  );
  if (headers) {
    for (const name in headers) {
      xhr.setRequestHeader(name, headers[name]);
      if (name.toLowerCase() === 'content-type') needsContentType = false;
    }
  }
  if (needsContentType) xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

  // Progress callback (streaming)
  if (onProgress && 'onprogress' in xhr) {
    xhr.onprogress = () => onProgress(xhr.responseText);
  }

  // Attribution Reporting API
  if (attributionReporting && 'setAttributionReporting' in XMLHttpRequest.prototype) {
    try {
      xhr.setAttributionReporting({ eventSourceEligible: true, triggerEligible: false });
    } catch (err) {
      logSilent(err); // was: si(e)
    }
  }

  xhr.send(body);
  return xhr;
}

/**
 * Sends an XHR-based request with JSON/XML parsing, callbacks, and timeout.
 * The workhorse for non-fetch AJAX throughout the player.
 * [was: sendXhrRequest]
 *
 * @param {string} url
 * @param {AjaxOptions} options
 * @returns {XMLHttpRequest}
 */
export function sendXhrRequest(url, options) { // was: g.Wn
  const format = options.format || 'JSON';
  url = buildRequestUrl(url, options); // was: DSX(Q, c)
  const body = buildRequestBody(url, options); // was: tWO(Q, c)

  let completed = false;
  let timeoutId;

  const xhr = sendRawXhr(url, (rawXhr) => {
    if (completed) return;
    completed = true;
    if (timeoutId) clearTimeout(timeoutId);

    const isOk = isHttpSuccess(rawXhr); // was: g.hB(U)
    let parsed = null;
    const isClientError = rawXhr.status >= 400 && rawXhr.status < 500;
    const isServerError = rawXhr.status >= 500 && rawXhr.status < 600;

    if (isOk || isClientError || isServerError) {
      parsed = parseResponse(url, format, rawXhr, options.convertToSafeHtml); // was: i33
    }

    const success = isOk && isResponseValid(format, rawXhr, parsed); // was: yCK
    parsed = parsed || {};
    const context = options.context || globalThis;

    if (success) options.onSuccess?.call(context, rawXhr, parsed);
    else         options.onError?.call(context, rawXhr, parsed);
    options.onFinish?.call(context, rawXhr, parsed);
  }, options.method, body, options.headers, options.responseType, options.withCredentials, false, options.onProgress);

  // Timeout
  const timeoutMs = options.timeout || 0;
  if (options.onTimeout && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true;
        xhr.abort();
        clearTimeout(timeoutId);
        options.onTimeout.call(options.context || globalThis, xhr);
      }
    }, timeoutMs);
  }

  return xhr;
}

/**
 * Sends a request preferring the Fetch API when available, falling back to
 * XHR. Handles JSON parsing and timeout.
 * [was: H3W]
 *
 * @param {string} url
 * @param {AjaxOptions} options
 */
export function sendFetchRequest(url, options) { // was: H3W
  if (!window.fetch || options.format === 'XML') {
    return sendXhrRequest(url, options);
  }

  const init = {
    method: options.method || 'GET',
    credentials: 'same-origin',
  };
  if (options.headers)  init.headers  = options.headers;
  if (options.priority) init.priority = options.priority;

  url = buildRequestUrl(url, options); // was: DSX
  const body = buildRequestBody(url, options); // was: tWO
  if (body) init.body = body;
  if (options.withCredentials) init.credentials = 'include';

  const context = options.context || globalThis;
  let completed = false;
  let timeoutId;

  fetch(url, init)
    .then((response) => {
      if (completed) return;
      completed = true;
      if (timeoutId) clearTimeout(timeoutId);

      const isOk = response.ok;
      const handleResult = (data) => {
        data = data || {};
        if (isOk) options.onSuccess?.call(context, data, response);
        else      options.onError?.call(context, data, response);
        options.onFinish?.call(context, data, response);
      };

      const format = options.format || 'JSON';
      if (format === 'JSON' && (isOk || (response.status >= 400 && response.status < 500))) {
        response.json().then(handleResult, () => handleResult(null));
      } else {
        handleResult(null);
      }
    })
    .catch(() => {
      options.onError?.call(context, {}, {});
    });

  // Timeout
  const timeoutMs = options.timeout || 0;
  if (options.onFetchTimeout && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true;
        clearTimeout(timeoutId);
        options.onFetchTimeout.call(options.context || globalThis);
      }
    }, timeoutMs);
  }
}

/**
 * Shorthand: sends a POST request via XHR.
 * [was: ms]
 *
 * @param {string} url
 * @param {AjaxOptions} options
 * @returns {XMLHttpRequest}
 */
export function sendPostRequest(url, options) { // was: ms
  options.method = 'POST';
  if (!options.postParams) options.postParams = {};
  return sendXhrRequest(url, options);
}

// ---------------------------------------------------------------------------
// Promise-based request wrapper
// ---------------------------------------------------------------------------

/**
 * Promise-based AJAX wrapper. Resolves with a {@link SuccessResponse} on HTTP
 * success; rejects with a {@link PromiseAjaxError} on error or timeout.
 * [was: TG]
 *
 * @param {string} url
 * @param {AjaxOptions} options
 * @returns {Promise<SuccessResponse>}
 */
export function sendPromiseRequest(url, options) { // was: TG
  const mergedOptions = { ...options }; // was: g.za(c)
  let xhrRef;

  return new Promise((resolve, reject) => {
    mergedOptions.onSuccess = (xhr) => {
      if (isHttpSuccess(xhr)) {
        resolve(new SuccessResponse(xhr)); // was: dS7
      } else {
        reject(new PromiseAjaxError(
          `Request failed, status=${getHttpStatus(xhr)}`,
          'net.badstatus',
          xhr,
        ));
      }
    };
    mergedOptions.onError = (xhr) => {
      reject(new PromiseAjaxError('Unknown request error', 'net.unknown', xhr));
    };
    mergedOptions.onTimeout = (xhr) => {
      reject(new PromiseAjaxError('Request timed out', 'net.timeout', xhr));
    };
    xhrRef = sendXhrRequest(url, mergedOptions);
  }).catch((err) => {
    if (err instanceof CancelError) xhrRef?.abort(); // was: eH
    return Promise.reject(err);
  });
}

// ---------------------------------------------------------------------------
// Error and response types
// ---------------------------------------------------------------------------

/**
 * Error thrown by promise-based AJAX helpers.
 * [was: Kh]
 */
export class PromiseAjaxError extends Error { // was: Kh
  /**
   * @param {string} message
   * @param {string} errorCode - e.g. "net.badstatus", "net.timeout", "net.unknown"
   * @param {XMLHttpRequest} [xhr]
   */
  constructor(message, NetworkErrorCode, xhr) {
    super(`${message}, NetworkErrorCode=${NetworkErrorCode}`);
    this.NetworkErrorCode = NetworkErrorCode;
    this.xhr = xhr;
    this.name = 'PromiseAjaxError';
  }
}

/**
 * Wrapper for a successful XHR response.
 * [was: dS7]
 */
export class SuccessResponse { // was: dS7
  /** @param {XMLHttpRequest} xhr */
  constructor(xhr) {
    this.xhr = xhr;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns whether an XHR has a success HTTP status.
 * [was: isSuccessStatus]
 *
 * @param {XMLHttpRequest} xhr
 * @returns {boolean}
 */
function isHttpSuccess(xhr) { // was: g.hB
  switch (xhr.status) {
    case 200: case 201: case 202: case 203: case 204: case 205: case 206: case 304:
      return true;
    default:
      return false;
  }
}

/**
 * Extracts the HTTP status from an XHR or XHR-like object, or returns -1.
 * [was: uk]
 *
 * @param {object} xhr
 * @returns {number}
 */
function getHttpStatus(xhr) { // was: uk
  return xhr && 'status' in xhr ? xhr.status : -1;
}

// ---------------------------------------------------------------------------
// Placeholder imports
// ---------------------------------------------------------------------------

/*
import { getConfigValue, getExperimentFlag, logSilent }
  from '../core/config.js';
import { CancelError }
import { defineProperty } from '../core/polyfills.js';
import { buildRequestUrl, buildRequestBody } from '../core/composition-helpers.js';
  from '../core/errors.js';

// buildRequestUrl [was: DSX] and buildRequestBody [was: tWO] handle XSRF
// token injection, domain prefixing, etc. They live in the same source
// region and depend on ../core/config.js for XSRF_TOKEN/XSRF_FIELD_NAME.

// parseResponse [was: i33] and isResponseValid [was: yCK] parse JSON/XML
// response bodies and validate them.
*/

/**
 * Get response text from XhrIo. [was: g.MA]
 */
export function getResponseText(xhrIo) {
  return xhrIo.getResponseText();
}

/**
 * Get response body from XhrIo. [was: g.Jz]
 */
export function getResponse(xhrIo) {
  return xhrIo.getResponse();
}
