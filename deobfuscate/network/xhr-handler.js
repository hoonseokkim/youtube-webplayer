import { getStatus } from '../core/composition-helpers.js';
import { XhrConfig, incrementCounter, registerCounter } from '../core/event-registration.js';
import { XhrIo } from './request.js';
import { getNowPlayingPosition } from '../player/time-tracking.js'; // was: Np()
import { int64FieldDescriptor } from '../core/event-system.js'; // was: ap
import { resetPlayer } from '../media/source-buffer.js'; // was: on
import { createParserForResponse } from '../media/bitstream-reader.js'; // was: Uf3
import { httpStatusToGrpcCode } from '../media/bitstream-reader.js'; // was: LO
import { xhrErrorDescription } from '../media/bitstream-reader.js'; // was: K1d
import { RpcError } from '../data/event-logging.js'; // was: fZ
import { ProtoAny } from '../media/grpc-parser.js'; // was: YZR
import { SlotIdFulfilledEmptyTrigger } from '../ads/ad-trigger-types.js'; // was: Zg
import { AUTH_HASH_ALGORITHMS } from '../media/grpc-parser.js'; // was: VeO
import { getCastInstance } from '../modules/remote/mdx-client.js'; // was: Nx
import { splice, removeAll, concat, slice, remove } from '../core/array-utils.js';
import { setPrototypeOf } from '../core/polyfills.js';
import { dispose } from '../ads/dai-cue-range.js';
import { listen } from '../core/composition-helpers.js';
import { forEach } from '../core/event-registration.js';
import { getObjectByPath } from '../core/type-helpers.js';
import { getInt32 } from '../proto/wire-format.js'; // was: g.Ao
import { EventHandler } from '../core/event-handler.js'; // was: g.Hx
// TODO: resolve g.RY
// TODO: resolve g.hz
// TODO: resolve g.td

/**
 * XHR ReadyStateChange Handler & gRPC Stream Client
 *
 * Contains the readystatechange watcher class that monitors XHR state
 * transitions, parses progressive/streaming responses using content-type
 * aware parsers, and dispatches parsed data or error notifications.
 *
 * Also includes the gRPC-Web stream event adapter that bridges the
 * low-level XHR handler to a Node-style event-emitter interface
 * (data / metadata / status / end / error), plus the gRPC-Web
 * transport client that sets up streaming RPCs.
 *
 * Source: base.js lines 8534-8538, 8556-8638, 8678-8681,
 *         9002-9043, 9097-9133, 63025-63033, 63043-63066,
 *         63068-63092, 63115-63144, 63146-63155, 63163-63189,
 *         63191-63193, 64009-64098, 64100-64161, 64163-64189
 *
 * @module network/xhr-handler
 */

// ---------------------------------------------------------------------------
// Helper: remove listener from array
// ---------------------------------------------------------------------------

/**
 * Removes a callback from an array by reference.
 * [was: kd]
 *
 * @param {Array<Function>} list  - Listener array [was: Q]
 * @param {Function}        fn    - Callback to remove [was: c]
 */
function removeFromArray(list, fn) { // was: kd
  const index = list.indexOf(fn); // was: c
  if (index > -1) list.splice(index, 1);
}

// ---------------------------------------------------------------------------
// JAO -- wrap response into RpcResponse
// ---------------------------------------------------------------------------

/**
 * Wraps a deserialized RPC response payload with optional metadata.
 * [was: JAO]
 *
 * @param {*}      payload   - Deserialized response data [was: Q]
 * @param {Object} [metadata={}] - Response metadata headers [was: c]
 * @returns {RpcResponse} [was: Mzy]
 */
export function createRpcResponse(payload, metadata = {}) { // was: JAO
  return new RpcResponse(payload, metadata);
}

// ---------------------------------------------------------------------------
// RpcResponse -- response wrapper with metadata + status
// ---------------------------------------------------------------------------

/**
 * Wraps a single gRPC-Web unary response.
 * [was: Mzy]
 */
export class RpcResponse { // was: Mzy
  /**
   * @param {*}      payload   - Deserialized response [was: Q -> nP]
   * @param {Object} [metadata={}] - Metadata map [was: c]
   */
  constructor(payload, metadata = {}) {
    /** @type {*} Deserialized response body [was: nP] */
    this.payload = payload; // was: this.nP

    /** @type {Object} Response metadata headers [was: metadata] */
    this.metadata = metadata; // was: this.metadata

    /** @type {?Object} gRPC status, set later [was: status] */
    this.status = null; // was: this.status
  }

  /** @returns {Object} [was: getMetadata] */
  getMetadata() {
    return this.metadata;
  }

  /** @returns {?Object} [was: getStatus] */
  getStatus() {
    return this.status;
  }
}

// ---------------------------------------------------------------------------
// RpcRequest -- request wrapper with method descriptor + metadata
// ---------------------------------------------------------------------------

/**
 * Wraps a gRPC-Web request with its method descriptor and metadata.
 * [was: sN3]
 */
export class RpcRequest { // was: sN3
  /**
   * @param {*}                payload    - Request body [was: Q -> u7]
   * @param {MethodDescriptor} method     - Method descriptor [was: c -> KR]
   * @param {Object}           metadata   - Request metadata [was: W]
   */
  constructor(payload, method, metadata) {
    /** @type {*} Serialized request body [was: u7] */
    this.payload = payload; // was: this.u7

    /** @type {MethodDescriptor} [was: KR] */
    this.method = method; // was: this.KR

    /** @type {Object} Request metadata headers [was: metadata] */
    this.metadata = metadata; // was: this.metadata
  }

  /** @returns {Object} [was: getMetadata] */
  getMetadata() {
    return this.metadata;
  }
}

// ---------------------------------------------------------------------------
// MethodDescriptor -- describes a single gRPC method
// ---------------------------------------------------------------------------

/**
 * Describes a single gRPC service method (name, types, serializers).
 * [was: d07]
 */
export class MethodDescriptor { // was: d07
  /**
   * @param {string}   name           - Full method path (e.g. "/pkg.Svc/Method") [was: Q]
   * @param {Function} requestType    - Request proto constructor [was: c]
   * @param {Function} responseType   - Response proto constructor [was: W]
   * @param {Function} serializer     - Request serializer fn [was: m -> W (stored)]
   * @param {Function} deserializer   - Response deserializer fn [was: K -> O (stored)]
   */
  constructor(name, requestType, responseType, serializer, deserializer) {
    /** @type {string} Full qualified method name [was: name] */
    this.name = name;

    /** @type {string} Always "unary" for these descriptors [was: methodType] */
    this.methodType = "unary";

    /** @type {Function} [was: requestType] */
    this.requestType = requestType;

    /** @type {Function} [was: responseType] */
    this.responseType = responseType;

    /** @type {Function} Serializes request to wire format [was: W] */
    this.serializer = serializer; // was: this.W

    /** @type {Function} Deserializes response from wire format [was: O] */
    this.deserializer = deserializer; // was: this.O
  }

  /**
   * Creates an RpcRequest wrapping the given payload.
   * [was: D]
   *
   * @param {*}      payload   [was: Q]
   * @param {Object} [metadata={}] [was: c]
   * @returns {RpcRequest} [was: sN3]
   */
  createRequest(payload, metadata = {}) { // was: D
    return new RpcRequest(payload, this, metadata);
  }

  /** @returns {string} [was: getName] */
  getName() {
    return this.name;
  }
}

// ---------------------------------------------------------------------------
// StreamzCounter -- client streamz metric for ABA/GAC
// ---------------------------------------------------------------------------

/**
 * Registers and increments a client-side streamz counter
 * at `/client_streamz/youtube/aba/gac`.
 * [was: Ziw]
 */
export class StreamzCounter { // was: Ziw
  constructor() {
    /** @private Counter handle [was: O] */
    const handle = g.getNowPlayingPosition; // was: Q
    this.handle = handle; // was: this.O
    registerCounter(handle, "/client_streamz/youtube/aba/gac", int64FieldDescriptor("type"), int64FieldDescriptor("sequence"));
  }

  /**
   * Increments the counter for the given type and sequence.
   * [was: W]
   *
   * @param {string} type     [was: Q]
   * @param {string} sequence [was: c]
   */
  increment(type, sequence) { // was: W
    incrementCounter(this.handle, "/client_streamz/youtube/aba/gac", type, sequence);
  }
}

// ---------------------------------------------------------------------------
// GrpcStreamClient -- event-emitting gRPC stream call handle
// ---------------------------------------------------------------------------

/**
 * A gRPC-Web streaming call handle that emits Node-style events.
 *
 * Events:
 *   - `"data"`     -- a deserialized message was received
 *   - `"metadata"` -- trailing metadata arrived
 *   - `"status"`   -- gRPC status received
 *   - `"end"`      -- stream ended normally
 *   - `"error"`    -- stream error
 *
 * [was: qTm]
 */
export class GrpcStreamClient { // was: qTm
  /**
   * @param {Object}   opts                   [was: Q]
   * @param {Object}   opts.xhr               - The XhrIo instance [was: Q.xhr]
   * @param {?StreamEventAdapter} opts.streamAdapter - Optional stream adapter [was: Q.MB]
   * @param {Function} deserializer           - Response deserializer [was: c -> J]
   */
  constructor({ xhr, streamAdapter }, deserializer) { // was: Q, c
    /** @private {Array<Function>} "data" listeners [was: O] */
    this._dataListeners = []; // was: this.O

    /** @private {Array<Function>} "metadata" listeners [was: j] */
    this._metadataListeners = []; // was: this.j

    /** @private {Array<Function>} "status" listeners [was: K] */
    this._statusListeners = []; // was: this.K

    /** @private {Array<Function>} "end" listeners [was: A] */
    this._endListeners = []; // was: this.A

    /** @private {Array<Function>} "error" listeners [was: W] */
    this._errorListeners = []; // was: this.W

    /** @private Stream event adapter, if streaming [was: D] */
    this._streamAdapter = streamAdapter; // was: this.D

    /** @private Response deserializer [was: J] */
    this._deserializer = deserializer; // was: this.J

    /** @private The underlying XHR [was: xhr] */
    this.xhr = xhr; // was: this.xhr

    if (this._streamAdapter) {
      setupStreamDataListeners(this); // was: RR0(this)
    }
  }

  /**
   * Registers an event listener.
   * [was: Dn]
   *
   * @param {string}   event    - One of "data"|"metadata"|"status"|"end"|"error" [was: Q]
   * @param {Function} callback [was: c]
   */
  resetPlayer(event, callback) { // was: Dn
    if (event === "data") this._dataListeners.push(callback);
    else if (event === "metadata") this._metadataListeners.push(callback);
    else if (event === "status") this._statusListeners.push(callback);
    else if (event === "end") this._endListeners.push(callback);
    else if (event === "error") this._errorListeners.push(callback);
  }

  /**
   * Removes an event listener.
   * [was: removeListener]
   *
   * @param {string}   event    [was: Q]
   * @param {Function} callback [was: c]
   * @returns {this}
   */
  removeListener(event, callback) { // was: removeListener
    if (event === "data") removeFromArray(this._dataListeners, callback);
    else if (event === "metadata") removeFromArray(this._metadataListeners, callback);
    else if (event === "status") removeFromArray(this._statusListeners, callback);
    else if (event === "end") removeFromArray(this._endListeners, callback);
    else if (event === "error") removeFromArray(this._errorListeners, callback);
    return this;
  }

  /**
   * Aborts the underlying XHR.
   * [was: cancel]
   */
  cancel() { // was: cancel
    this.xhr.abort();
  }
}

// ---------------------------------------------------------------------------
// AsyncStackError -- synthetic stack for async RPC debugging
// ---------------------------------------------------------------------------

/**
 * Sentinel error used to capture the async call stack at the point
 * where a gRPC-Web call is initiated. Its `.stack` property is later
 * appended to actual errors for easier debugging.
 * [was: pBw]
 */
export class AsyncStackError extends Error { // was: pBw
  constructor() {
    super();
    this.name = "AsyncStack";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// updateStatus / cleanup helpers
// ---------------------------------------------------------------------------

/**
 * Updates the status code on the XHR handler and fires the status callback.
 * [was: bZ]
 *
 * @param {XhrReadyStateHandler} handler [was: Q]
 * @param {number}               status  - New status code [was: c]
 */
function updateHandlerStatus(handler, status) { // was: bZ
  if (handler.statusCode !== status) {
    handler.statusCode = status; // was: Q.K = c
    if (handler._statusCallback) handler._statusCallback(); // was: Q.J && Q.J()
  }
}

/**
 * Cleans up the XHR handler -- removes all event listeners,
 * aborts, and disposes the underlying XHR.
 * [was: jX]
 *
 * @param {XhrReadyStateHandler} handler [was: Q]
 */
function cleanupHandler(handler) { // was: jX
  handler._eventHandler.removeAll(); // was: Q.L.removeAll()
  if (handler._xhr) {
    const xhr = handler._xhr; // was: c
    handler._xhr = null; // was: Q.W = null
    xhr.abort();
    xhr.dispose();
  }
}

// ---------------------------------------------------------------------------
// XhrReadyStateHandler -- readystatechange watcher
// ---------------------------------------------------------------------------

/**
 * Watches an XHR's `readystatechange` events and progressively parses
 * the response. Supports both text-based (JSON, JSON+protobuf) and
 * binary (x-protobuf, including base64-encoded) streaming.
 *
 * Status codes (this.statusCode / [was: K]):
 *   0 = initial
 *   1 = receiving data
 *   2 = completed successfully
 *   3 = HTTP error
 *   4 = empty response
 *   5 = parse error
 *   6 = exception during handling
 *   7 = network abort
 *   8 = timeout
 *
 * [was: Bfx]
 */
export class XhrReadyStateHandler { // was: Bfx
  /**
   * @param {Object} xhr - The XhrIo instance to monitor [was: Q]
   */
  constructor(xhr) {
    /** @private The XhrIo being watched [was: W] */
    this._xhr = xhr; // was: this.W

    /** @private Content-type parser (SX | ZA | dC | wC), set on first response [was: O] */
    this._parser = null; // was: this.O

    /** @private Number of bytes/chunks already consumed [was: A] */
    this._consumedOffset = 0; // was: this.A

    /**
     * Status code tracking the handler's state.
     * @type {number} [was: K]
     */
    this.statusCode = 0; // was: this.K

    /** @private Whether binary (Uint8Array) chunks were detected [was: Y] */
    this._isBinaryStream = false; // was: this.Y

    /** @private TextDecoder for decoding binary to text when not in Tv() mode [was: D] */
    this._textDecoder = null; // was: this.D

    /** @private Status-change callback, set externally [was: J] */
    this._statusCallback = null; // was: this.J

    /** @private Data callback for parsed messages, set externally [was: j] */
    this._dataCallback = null; // was: this.j

    /** @private {EventHandler} Manages event subscriptions [was: L] */
    this._eventHandler = new EventHandler(this);
    this._eventHandler.listen(this._xhr, "readystatechange", this._onReadyStateChange); // was: this.L.listen(...)
  }

  /**
   * Returns the underlying XHR instance.
   * [was: Ew]
   *
   * @returns {Object} [was: W]
   */
  getXhr() { // was: Ew
    return this._xhr;
  }

  /**
   * Returns the current handler status code.
   * [was: getStatus]
   *
   * @returns {number}
   */
  getStatus() { // was: getStatus
    return this.statusCode;
  }

  /**
   * Handles `readystatechange` from the underlying XHR. This is the
   * core progressive response parser -- it detects the content type,
   * accumulates binary chunks or text, feeds them to the appropriate
   * parser, and dispatches parsed data or error status.
   *
   * [was: mF]
   *
   * @param {Event} event [was: Q]
   */
  _onReadyStateChange(event) { // was: mF
    const target = event.target; // was: Q = Q.target
    try {
      if (target === this._xhr) {
        const readyState = g.hz(this._xhr); // was: T
        let NetworkErrorCode = this._xhr.O; // was: c
        const httpStatus = this._xhr.getStatus(); // was: W
        const responseText = this._xhr.getResponseText(); // was: g.MA(this._xhr)
        const parsedMessages = []; // was: Q (reused)

        // Detect binary (Uint8Array) streaming chunks
        if (this._xhr.getResponse() instanceof Array) {
          const responseChunks = this._xhr.getResponse(); // was: g.Jz(this._xhr)
          if (responseChunks.length > 0 && responseChunks[0] instanceof Uint8Array) {
            this._isBinaryStream = true; // was: this.Y = true
            parsedMessages.push(...responseChunks);
          }
        }

        // Skip if readyState < 3, or readyState == 3 with no text and no chunks
        if (readyState < 3 || (readyState === 3 && !responseText && parsedMessages.length === 0)) {
          return;
        }

        // Determine if HTTP status indicates success
        const isSuccess = httpStatus === 200 || httpStatus === 206; // was: W

        // On readyState 4 (complete), map XHR error codes to handler status
        if (readyState === 4) {
          if (NetworkErrorCode === 8) {
            updateHandlerStatus(this, 7); // was: bZ(this, 7) -- timeout -> network abort
          } else if (NetworkErrorCode === 7) {
            updateHandlerStatus(this, 8); // was: bZ(this, 8) -- abort -> timeout
          } else if (!isSuccess) {
            updateHandlerStatus(this, 3); // was: bZ(this, 3) -- HTTP error
          }
        }

        // Initialize parser from Content-Type on first data
        if (!this._parser) {
          this._parser = createParserForResponse(this._xhr); // was: this.O = Uf3(this.W)
          if (this._parser === null) {
            updateHandlerStatus(this, 5); // was: bZ(this, 5) -- parse error
          }
        }

        // If status is already > 2, just clean up
        if (this.statusCode > 2) {
          cleanupHandler(this); // was: jX(this)
          return;
        }

        // --- Progressive parsing ---
        if (parsedMessages.length > this._consumedOffset) {
          // Binary streaming path: chunks arrived as Uint8Array[]
          const chunkCount = parsedMessages.length; // was: U
          let results = []; // was: c (reused)
          try {
            if (this._parser.Tv()) {
              // Binary parser mode (e.g. protobuf)
              for (let i = 0; i < chunkCount; i++) { // was: m
                const parsed = this._parser.parse(Array.from(parsedMessages[i])); // was: K
                if (parsed) results = results.concat(parsed);
              }
            } else {
              // Text parser mode: decode binary chunks to string first
              let text = ""; // was: K
              if (!this._textDecoder) {
                if (typeof TextDecoder === "undefined") {
                  throw Error("TextDecoder is not supported by this browser.");
                }
                this._textDecoder = new TextDecoder();
              }
              for (let i = 0; i < chunkCount; i++) { // was: m
                text += this._textDecoder.decode(parsedMessages[i], {
                  stream: readyState === 4 && i === chunkCount - 1
                });
              }
              results = this._parser.parse(text);
            }
            parsedMessages.splice(0, chunkCount);
            if (results && this._dataCallback) this._dataCallback(results);
          } catch (_err) { // was: I
            updateHandlerStatus(this, 5); // was: bZ(this, 5)
            cleanupHandler(this); // was: jX(this)
            return;
          }
        } else if (responseText.length > this._consumedOffset) {
          // Text streaming path: new text data available
          const newText = responseText.slice(this._consumedOffset); // was: m
          this._consumedOffset = responseText.length; // was: this.A = r.length
          try {
            const parsed = this._parser.parse(newText); // was: U
            if (parsed !== null && this._dataCallback) this._dataCallback(parsed);
          } catch (_err) { // was: U
            updateHandlerStatus(this, 5); // was: bZ(this, 5)
            cleanupHandler(this); // was: jX(this)
            return;
          }
        }

        // On readyState 4 (done), finalize
        if (readyState === 4) {
          if (responseText.length !== 0 || this._isBinaryStream) {
            updateHandlerStatus(this, 2); // was: bZ(this, 2) -- completed successfully
          } else {
            updateHandlerStatus(this, 4); // was: bZ(this, 4) -- empty response
          }
          cleanupHandler(this); // was: jX(this)
        } else {
          updateHandlerStatus(this, 1); // was: bZ(this, 1) -- receiving data
        }
      }
    } catch (_err) { // was: T
      updateHandlerStatus(this, 6); // was: bZ(this, 6) -- exception
      cleanupHandler(this); // was: jX(this)
    }
  }
}

// ---------------------------------------------------------------------------
// StreamEventAdapter -- bridges XhrReadyStateHandler to event listeners
// ---------------------------------------------------------------------------

/**
 * Adapts a low-level `XhrReadyStateHandler` into a higher-level
 * event-driven interface. Supports "data", "readable", "end",
 * "error", and "close" events with both persistent and once listeners.
 *
 * [was: xfm]
 */
export class StreamEventAdapter { // was: xfm
  /**
   * @param {XhrReadyStateHandler} handler - The XHR handler to adapt [was: Q]
   */
  constructor(handler) {
    /** @private The underlying XHR handler [was: A] */
    this._handler = handler; // was: this.A

    // Wire up data and status callbacks
    const dataCallback = bind(this._onData, this); // was: c
    handler._dataCallback = dataCallback; // was: Q.j = c

    const statusCallback = bind(this._onStatusChange, this); // was: c
    handler._statusCallback = statusCallback; // was: Q.J = c

    /** @private {Object<string, Array<Function>>} Persistent listeners [was: O] */
    this._listeners = {}; // was: this.O

    /** @private {Object<string, Array<Function>>} One-shot listeners [was: W] */
    this._onceListeners = {}; // was: this.W
  }

  /**
   * Registers a persistent event listener.
   * [was: Dn]
   *
   * @param {string}   event    [was: Q]
   * @param {Function} callback [was: c]
   */
  resetPlayer(event, callback) { // was: Dn
    let list = this._listeners[event]; // was: W
    if (!list) {
      list = [];
      this._listeners[event] = list;
    }
    list.push(callback);
  }

  /**
   * Registers a persistent listener (alias for `on`).
   * [was: addListener]
   *
   * @param {string}   event    [was: Q]
   * @param {Function} callback [was: c]
   * @returns {this}
   */
  addListener(event, callback) { // was: addListener
    this.resetPlayer(event, callback);
    return this;
  }

  /**
   * Removes a listener from both persistent and once lists.
   * [was: removeListener]
   *
   * @param {string}   event    [was: Q]
   * @param {Function} callback [was: c]
   * @returns {this}
   */
  removeListener(event, callback) { // was: removeListener
    const persistent = this._listeners[event]; // was: W
    if (persistent) remove(persistent, callback);
    const once = this._onceListeners[event]; // was: Q (reused)
    if (once) remove(once, callback);
    return this;
  }

  /**
   * Registers a one-shot event listener (fires once then auto-removes).
   * [was: once]
   *
   * @param {string}   event    [was: Q]
   * @param {Function} callback [was: c]
   * @returns {this}
   */
  once(event, callback) { // was: once
    let list = this._onceListeners[event]; // was: W
    if (!list) {
      list = [];
      this._onceListeners[event] = list;
    }
    list.push(callback);
    return this;
  }

  /**
   * Called when the XHR handler delivers parsed data messages.
   * Dispatches to "data" persistent and once listeners.
   * [was: j]
   *
   * @param {Array} messages - Parsed messages [was: Q]
   */
  _onData(messages) { // was: j
    const persistent = this._listeners.data; // was: c
    if (persistent) dispatchToListeners(messages, persistent); // was: gC(Q, c)
    const once = this._onceListeners.data; // was: c
    if (once) dispatchToListeners(messages, once); // was: gC(Q, c)
    this._onceListeners.data = [];
  }

  /**
   * Called when the XHR handler's status changes.
   * Maps handler status codes to semantic events.
   * [was: K]
   */
  _onStatusChange() { // was: K
    switch (this._handler.getStatus()) {
      case 1: // receiving data
        emitEvent(this, "readable");
        break;
      case 5: // parse error
      case 6: // exception
      case 4: // empty response
      case 7: // network abort
      case 3: // HTTP error
        emitEvent(this, "error");
        break;
      case 8: // timeout
        emitEvent(this, "close");
        break;
      case 2: // completed
        emitEvent(this, "end");
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Dispatch helpers
// ---------------------------------------------------------------------------

/**
 * Dispatches each message in an array to every callback in the list.
 * [was: gC]
 *
 * @param {Array}            messages  - Parsed messages [was: Q]
 * @param {Array<Function>}  callbacks - Listener array [was: c]
 */
function dispatchToListeners(messages, callbacks) { // was: gC
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]; // was: m
    callbacks.forEach(function (cb) { // was: K
      try {
        cb(message);
      } catch (_err) { /* swallow per original */ } // was: T
    });
  }
}

/**
 * Emits an event by invoking all persistent and once listeners.
 * Once listeners are cleared after invocation.
 * [was: O2]
 *
 * @param {StreamEventAdapter} adapter [was: Q]
 * @param {string}             event   [was: c]
 */
function emitEvent(adapter, event) { // was: O2
  const persistent = adapter._listeners[event]; // was: W
  if (persistent) {
    persistent.forEach(function (fn) { // was: m
      try {
        fn();
      } catch (_err) { /* swallow per original */ } // was: K
    });
  }
  const once = adapter._onceListeners[event]; // was: W
  if (once) {
    once.forEach(function (fn) { // was: m
      fn();
    });
  }
  adapter._onceListeners[event] = [];
}

// ---------------------------------------------------------------------------
// setupStreamDataListeners -- wires up stream adapter -> grpc client
// ---------------------------------------------------------------------------

/**
 * Connects the stream event adapter's "data" and "end"/"error" events
 * to the GrpcStreamClient, handling deserialization, status parsing,
 * and error mapping.
 *
 * [was: RR0]
 *
 * @param {GrpcStreamClient} client [was: Q]
 */
function setupStreamDataListeners(client) { // was: RR0
  // On "data": deserialize the message or parse the trailing status
  client._streamAdapter.resetPlayer("data", (frame) => { // was: c
    if ("1" in frame) {
      // Data frame
      const rawData = frame["1"]; // was: W
      let deserialized; // was: m
      try {
        deserialized = client._deserializer(rawData);
      } catch (err) { // was: K
        emitError(client, new GrpcError(13, // was: fZ(13, ...)
          `Error when deserializing response data; error: ${err}, response: ${rawData}`));
      }
      if (deserialized) emitData(client, deserialized); // was: zS(Q, m)
    }
    if ("2" in frame) {
      // Status frame
      const status = parseRpcStatus(client, frame["2"]); // was: c = CZ(Q, c["2"])
      for (let i = 0; i < client._statusListeners.length; i++) {
        client._statusListeners[i](status);
      }
    }
  });

  // On "end": emit metadata then fire end listeners
  client._streamAdapter.resetPlayer("end", () => {
    emitMetadata(client, collectResponseHeaders(client)); // was: Mb(Q, JJ(Q))
    for (let i = 0; i < client._endListeners.length; i++) {
      client._endListeners[i]();
    }
  });

  // On "error": map XHR error codes to gRPC codes and emit
  client._streamAdapter.resetPlayer("error", () => {
    if (client._errorListeners.length !== 0) {
      let NetworkErrorCode = client.xhr.O; // was: c
      if (NetworkErrorCode === 0 && !zQ(client.xhr)) NetworkErrorCode = 6;
      let httpStatusCode = -1; // was: W

      let grpcCode; // was: m
      switch (NetworkErrorCode) {
        case 0:  grpcCode = 2;  break; // UNKNOWN
        case 7:  grpcCode = 10; break; // ABORTED
        case 8:  grpcCode = 4;  break; // DEADLINE_EXCEEDED
        case 6:
          httpStatusCode = client.xhr.getStatus();
          grpcCode = httpStatusToGrpcCode(httpStatusCode); // was: LO(W)
          break;
        default: grpcCode = 14; break; // UNAVAILABLE
      }

      emitMetadata(client, collectResponseHeaders(client)); // was: Mb(Q, JJ(Q))
      let message = xhrErrorDescription(NetworkErrorCode) + ", error: " + client.xhr.getLastError(); // was: c
      if (httpStatusCode !== -1) {
        message += `, http status code: ${httpStatusCode}`;
      }
      emitError(client, new RpcError(grpcCode, message)); // was: hJ(Q, new fZ(m, c))
    }
  });
}

/**
 * Fires all "data" listeners with a deserialized message.
 * [was: zS]
 *
 * @param {GrpcStreamClient} client  [was: Q]
 * @param {*}                message [was: c]
 */
function emitData(client, message) { // was: zS
  for (let i = 0; i < client._dataListeners.length; i++) {
    client._dataListeners[i](message);
  }
}

/**
 * Fires all "metadata" listeners with a metadata object.
 * [was: Mb]
 *
 * @param {GrpcStreamClient} client   [was: Q]
 * @param {Object}           metadata [was: c]
 */
function emitMetadata(client, metadata) { // was: Mb
  for (let i = 0; i < client._metadataListeners.length; i++) {
    client._metadataListeners[i](metadata);
  }
}

/**
 * Fires all "error" listeners with a GrpcError.
 * [was: hJ]
 *
 * @param {GrpcStreamClient} client [was: Q]
 * @param {Error}            error  [was: c]
 */
function emitError(client, error) { // was: hJ
  for (let i = 0; i < client._errorListeners.length; i++) {
    client._errorListeners[i](error);
  }
}

/**
 * Collects response headers from the XHR into a plain object.
 * [was: JJ]
 *
 * @param {GrpcStreamClient} client [was: Q]
 * @returns {Object} header map
 */
function collectResponseHeaders(client) { // was: JJ
  const headers = {}; // was: c
  const raw = g.RY(client.xhr); // was: W
  Object.keys(raw).forEach((key) => { // was: m
    headers[key] = raw[key];
  });
  return headers;
}

// ---------------------------------------------------------------------------
// parseRpcStatus -- decode gRPC status from wire format
// ---------------------------------------------------------------------------

/**
 * Parses a gRPC status frame from the trailing metadata.
 * [was: CZ]
 *
 * @param {GrpcStreamClient} client   [was: Q]
 * @param {*}                rawFrame - Raw status data [was: c]
 * @returns {{ code: number, details: string, metadata: Object }}
 */
function parseRpcStatus(client, rawFrame) { // was: CZ
  let code = 2; // was: W -- default UNKNOWN
  let details; // was: m
  const metadata = {}; // was: K

  try {
    const statusProto = kCw(rawFrame); // was: T
    code = getInt32(statusProto, 1);
    details = statusProto.getMessage();
    if (Tp(statusProto, ProtoAny, 3).length) {
      metadata["grpc-web-status-details-bin"] = rawFrame;
    }
  } catch (err) { // was: T
    if (client.xhr && client.xhr.getStatus() === 404) {
      code = 5; // NOT_FOUND
      details = "Not Found: " + String(client.xhr.L);
    } else {
      code = 14; // UNAVAILABLE
      details = `Unable to parse RpcStatus: ${err}`;
    }
  }

  return { code, details, metadata };
}

// ---------------------------------------------------------------------------
// IOO / XSK -- interceptor chain builders
// ---------------------------------------------------------------------------

/**
 * Composes a chain of stream interceptors into a single function.
 * Each interceptor wraps the next, allowing pre/post processing.
 * [was: IOO]
 *
 * @param {Function}         baseFn       - The core handler [was: Q]
 * @param {Array<Object>}    interceptors - Objects with `.intercept(req, next)` [was: c]
 * @returns {Function} The composed handler
 */
export function composeStreamInterceptors(baseFn, interceptors) { // was: IOO
  return interceptors.reduce(
    (next, interceptor) => (request) => interceptor.intercept(request, next), // was: K => m.intercept(K, W)
    baseFn,
  );
}

// ---------------------------------------------------------------------------
// createXhrForRpc -- creates an XHR instance for gRPC calls
// ---------------------------------------------------------------------------

/**
 * Creates a properly configured XhrIo for a gRPC-Web call.
 * If the transport has a custom factory or streaming config,
 * uses a custom factory; otherwise uses the default XhrIo.
 * [was: fG]
 *
 * @param {GrpcWebTransport} transport [was: Q]
 * @param {boolean}          isUnary   - true for unary, false for streaming [was: c]
 * @returns {Object} XhrIo instance [was: XhrIo]
 */
export function createXhrForRpc(transport, isUnary) { // was: fG
  const useStreaming = transport.useStreamingTransport && !isUnary; // was: c
  if (transport.xhrFactory || useStreaming) {
    return new XhrIo(new XhrConfig({
      SlotIdFulfilledEmptyTrigger: transport.xhrFactory,     // was: Q.QQ
      Ac: useStreaming,              // was: c
    }));
  }
  return new XhrIo();
}

// ---------------------------------------------------------------------------
// setupRequestHeaders -- configures headers for gRPC-Web
// ---------------------------------------------------------------------------

/**
 * Attaches gRPC-Web headers (Content-Type, User-Agent, Authorization)
 * to the XHR. If CORS preflight suppression is enabled, headers are
 * passed via a query parameter instead.
 * [was: vx]
 *
 * @param {GrpcWebTransport} transport [was: Q]
 * @param {Object}           metadata  - Request metadata map [was: c]
 * @param {Object}           xhr       - The XhrIo instance [was: W]
 * @param {string}           url       - The request URL [was: m]
 * @returns {string} The (possibly modified) URL
 */
export function setupRequestHeaders(transport, metadata, xhr, url) { // was: vx
  metadata["Content-Type"] = "application/json+protobuf";
  metadata["X-User-Agent"] = "grpc-web-javascript/0.1";

  const authHeader = metadata.Authorization; // was: K
  if ((authHeader && AUTH_HASH_ALGORITHMS.has(authHeader.split(" ")[0])) || transport.withCredentials) {
    xhr.J = true; // was: W.J = !0
  }

  if (transport.suppressCorsPreflight) { // was: Q.QR
    url = g.td(url, "$httpHeaders", metadata); // was: m = g.td(m, "$httpHeaders", c)
  } else {
    for (const key of Object.keys(metadata)) { // was: T
      xhr.headers.set(key, metadata[key]);
    }
  }

  return url;
}

// ---------------------------------------------------------------------------
// createGrpcStreamCall -- assembles XHR + handler into a stream call
// ---------------------------------------------------------------------------

/**
 * Creates a `GrpcStreamClient` from an XHR, optionally wrapping it
 * in a stream handler/adapter for progressive parsing.
 * [was: aO]
 *
 * @param {Object}   xhr          - XhrIo instance [was: Q]
 * @param {Function} deserializer - Response deserializer [was: c]
 * @param {boolean}  isStreaming   - Whether to set up streaming handlers [was: W]
 * @returns {GrpcStreamClient} [was: qTm]
 */
export function createGrpcStreamCall(xhr, deserializer, isStreaming) { // was: aO
  let streamAdapter; // was: m
  if (isStreaming) {
    xhr.isActive(); // side-effect: ensures XHR state is ready
    const handler = new XhrReadyStateHandler(xhr); // was: W = new Bfx(Q)
    streamAdapter = new StreamEventAdapter(handler); // was: m = new xfm(W)
  }
  return new GrpcStreamClient(
    { xhr, streamAdapter }, // was: { xhr: Q, MB: m }
    deserializer,
  );
}

// ---------------------------------------------------------------------------
// GrpcWebTransport -- gRPC-Web transport client
// ---------------------------------------------------------------------------

/**
 * gRPC-Web transport that sends requests over XHR with JSON+protobuf
 * encoding. Supports CORS preflight suppression, credentials,
 * interceptors, and streaming responses.
 *
 * [was: nyO]
 */
export class GrpcWebTransport { // was: nyO
  constructor() {
    const opts = { format: "jspb" }; // was: Q

    /** @type {boolean} Suppress CORS preflight by passing headers in query [was: QR] */
    this.suppressCorsPreflight = opts.QR || getObjectByPath("suppressCorsPreflight", opts) || false;

    /** @type {boolean} Send cookies/auth with requests [was: withCredentials] */
    this.withCredentials = opts.withCredentials || getObjectByPath("withCredentials", opts) || false;

    /** @type {Array} Stream interceptors [was: ji] */
    this.streamInterceptors = opts.ji || []; // was: this.ji

    /** @type {Array} Unary interceptors [was: Nx] */
    this.unaryInterceptors = opts.getCastInstance || []; // was: this.Nx

    /** @type {?Function} Custom XHR factory [was: QQ] */
    this.xhrFactory = opts.QQ; // was: this.QQ

    /** @type {boolean} Use streaming transport (e.g. fetch body) [was: W] */
    this.useStreamingTransport = opts.v3J || false; // was: this.W
  }

  /**
   * Initiates a server-streaming gRPC call.
   * [was: serverStreaming]
   *
   * @param {string}           fullUrl    - Full service URL [was: Q]
   * @param {*}                request    - Request payload [was: c]
   * @param {Object}           metadata   - Request metadata [was: W]
   * @param {MethodDescriptor} method     - The method descriptor [was: m]
   * @returns {GrpcStreamClient}
   */
  serverStreaming(fullUrl, request, metadata, method) { // was: serverStreaming
    const baseUrl = fullUrl.substring(0, fullUrl.length - method.name.length); // was: K

    return composeStreamInterceptors(
      (rpcRequest) => { // was: T
        const descriptor = rpcRequest.method; // was: r
        let reqMetadata = rpcRequest.getMetadata(); // was: U
        const xhr = createXhrForRpc(this, false); // was: I
        const url = setupRequestHeaders(this, reqMetadata, xhr, baseUrl + descriptor.getName()); // was: U
        const streamCall = createGrpcStreamCall(xhr, descriptor.deserializer, true); // was: X
        const serialized = descriptor.serializer(rpcRequest.payload); // was: T
        xhr.send(url, "POST", serialized);
        return streamCall;
      },
      this.streamInterceptors,
    ).call(this, method.createRequest(request, metadata));
  }
}
