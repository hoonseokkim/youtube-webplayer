/**
 * collection-utils.js -- Command endpoint extraction, ad-text rendering,
 * ad-feedback dialog, ad-info hover, toggle button state, innertube
 * request pipeline, deep-merge, byte-buffer / DataView helpers.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 * Source lines: 17275-17499  (endpoint helpers, ad text/feedback/info UI)
 *              18690-18986  (innertube fetch pipeline, deep-merge,
 *                            byte-buffer, DataView chunked reads)
 */

import { executeCommand, validateUrl } from '../ads/ad-scheduling.js';  // was: g.xA, g.D6
import { buildVodMediaSubLayout } from '../ads/slot-id-generator.js';  // was: g.own
import { listen, logError, logWarning } from '../core/composition-helpers.js';  // was: g.s7, g.Zp, g.si
import { adInfoDialogEndpoint, adInfoDialogRenderer, getProperty } from '../core/misc-helpers.js';  // was: g.L_X, g.gk_, g.l
import { buildFetchOptions, isSameOrigin } from '../network/service-endpoints.js';  // was: g.qt, g.ax
import { AdButton } from '../player/bootstrap.js';  // was: g.Ef
import { createDatabaseDefinition } from './idb-transactions.js'; // was: el
import { parseByteRange } from '../media/format-parser.js'; // was: dv
import { filter, concat, remove, splice } from '../core/array-utils.js';
import { createElement, createTextNode, addClass, appendChild } from '../core/dom-utils.js';
import { onAdUxClicked } from '../player/player-api.js';
import { AdInfoDialog } from '../ads/ad-renderer.js';
import { DeferredPromise } from '../core/promise.js'; // was: g.DeferredPromise
import { DetailedError } from '../core/errors.js'; // was: g.DetailedError
// TODO: resolve g.addClass
// TODO: resolve g.buildContext
// TODO: resolve g.createTextNode
// TODO: resolve g.getFlag
// TODO: resolve g.getLocalizedString
// TODO: resolve g.getProperty
// TODO: resolve g.isPlainObject
// TODO: resolve g.listen
// TODO: resolve g.logError
// TODO: resolve g.logWarning
// TODO: resolve g.now
// TODO: resolve g.resolvePromise
// TODO: resolve g.sanitizeUrl
// TODO: resolve g.setBackgroundImage
import { setAnchorHref } from '../core/dom-utils.js';
// TODO: resolve g.setVisible
// TODO: resolve g.urlEndpoint

// ===========================================================================
// Part 1 -- Command / endpoint extraction  (lines 17275-17280)
// ===========================================================================

/**
 * Extract navigation / service endpoint commands from a renderer model.
 * [was: Vq_]
 * @param {Object} renderer [was: Q]
 * @returns {Array}
 */
export function extractEndpoints(renderer) { // was: Vq_
  let endpoints = null;
  if (renderer.model != null) { // was: .W
    endpoints = [
      renderer.model.serviceEndpoint,
      renderer.model.navigationEndpoint,
    ].filter((ep) => ep != null);
    if (renderer.model.command) {
      endpoints = endpoints.concat(renderer.model.command);
    }
  }
  return endpoints || [];
}

/**
 * Get or create the singleton beacon-tracker.
 * [was: x77]
 * @returns {BeaconTracker} [was: BM3]
 */
export function getBeaconTracker() { // was: x77
  if (beaconTrackerInstance == null) { // was: Z1
    beaconTrackerInstance = new BeaconTracker(); // was: BM3
  }
  return beaconTrackerInstance;
}

let beaconTrackerInstance = null; // was: Z1

// ===========================================================================
// Part 2 -- Ad text rendering helpers  (lines 17287-17339)
// ===========================================================================

/**
 * Render a structured text object (simpleText or runs) to a DOM node.
 * [was: E8]
 * @param {Object}  textObj       [was: Q]
 * @param {boolean} [allowLinks]  [was: c]
 * @returns {Node}
 */
export function renderAdText(textObj, allowLinks) { // was: E8
  if (textObj.simpleText) {
    let node;
    innerBlock: {
      const text = textObj.simpleText;
      if (allowLinks) {
        const lines = splitNewlines(text); // was: qWd
        if (lines) {
          node = createElement("SPAN", null, lines); // was: tA
          break innerBlock;
        }
      }
      node = g.createTextNode(text); // was: g.Nn
    }
    return node;
  }

  const parts = [];
  if (textObj.runs) {
    for (let i = 0; i < textObj.runs.length; i++) {
      const run = textObj.runs[i];
      if (run.text) parts.push(renderTextRun(run, allowLinks)); // was: nk0
    }
  }
  return parts.length === 1
    ? parts[0]
    : createElement("SPAN", null, parts);
}

/**
 * Render a single text run with formatting (bold, italic, link).
 * [was: nk0]
 * @param {Object}  run         [was: Q]
 * @param {boolean} [allowLinks] [was: c]
 * @returns {Node}
 */
export function renderTextRun(run, allowLinks) { // was: nk0
  let node = null;
  let text = run.text;
  if (allowLinks) {
    text = splitNewlines(text) || text;
  }
  if (run.bold)          node = createElement("B", null, node || text);
  if (run.italics)       node = createElement("I", null, node || text);
  if (run.strikethrough) node = createElement("STRIKE", null, node || text);

  if (run.navigationEndpoint && g.getProperty(run.navigationEndpoint, g.urlEndpoint)) { // was: g.l, g.s8
    const urlEp = g.getProperty(run.navigationEndpoint, g.urlEndpoint);
    node = createElement("A", null, node || text);
    setAnchorHref(node, urlEp.url); // was: g.QC
    if (urlEp.target === "TARGET_NEW_WINDOW") {
      node.target = "_blank";
    }
    const loggingUrls = run.navigationEndpoint.loggingUrls;
    if (loggingUrls) {
      const urls = loggingUrls.map((entry) => entry.baseUrl);
      getBeaconTracker().register(node, urls);
      g.addClass(node, "ytp-ad-has-logging-urls"); // was: g.xK
    }
  }
  return node || createElement("SPAN", null, text);
}

/**
 * Split text on newlines into an array with <BR> elements interleaved.
 * [was: qWd]
 * @param {string} text [was: Q]
 * @returns {Array|null}
 */
export function splitNewlines(text) { // was: qWd
  const lines = text.split(/(?:\r\n|\r|\n)/g);
  if (lines.length > 1) {
    const result = [lines[0]];
    for (let i = 1; i < lines.length; i++) {
      result.push(createElement("BR"));
      result.push(lines[i]);
    }
    return result;
  }
  return null;
}

/**
 * Extract the first thumbnail URL from a thumbnail object.
 * [was: dK]
 * @param {Object} thumbnailObj [was: Q]
 * @returns {string}
 */
export function getThumbnailUrl(thumbnailObj) { // was: dK
  return thumbnailObj &&
    thumbnailObj.thumbnails &&
    (thumbnailObj.thumbnails || null).length !== 0 &&
    thumbnailObj.thumbnails[0].url
    ? g.sanitizeUrl(thumbnailObj.thumbnails[0].url) // was: g.yC
    : "";
}

// ===========================================================================
// Part 3 -- Ad confirm dialog  (lines 17341-17357)
// ===========================================================================

/**
 * Populate a confirm dialog renderer with title, messages, and buttons.
 * [was: D7X]
 * @param {ConfirmDialog} dialog   [was: Q]
 * @param {Object}        data     [was: c]
 */
export function initConfirmDialog(dialog, data) { // was: D7X
  if (data.title) {
    const title = g.getLocalizedString(data.title); // was: g.rK
    dialog.updateValue("title", title);
  }
  if (data.dialogMessages) {
    for (const msg of data.dialogMessages) {
      const rendered = renderAdText(msg);
      dialog.messageContainer.appendChild(rendered); // was: .jG
    }
  }
  if (data.cancelLabel) {
    const cancelText = g.getLocalizedString(data.cancelLabel);
    dialog.updateValue("cancelLabel", cancelText);
    dialog.handler.listen(dialog.cancelButton, "click", (e) => dialog.onCancel(e)); // was: .W.B, .J, .j
  }
  if (data.confirmLabel) {
    const confirmText = g.getLocalizedString(data.confirmLabel);
    dialog.updateValue("confirmLabel", confirmText);
    dialog.handler.listen(dialog.confirmButton, "click", (e) => dialog.onConfirm(e)); // was: .S, .D
  }
  dialog.handler.listen(dialog.closeButton, "click", (e) => dialog.onClose(e)); // was: .T2, .K
}

// ===========================================================================
// Part 4 -- Toggle button state  (lines 17359-17371)
// ===========================================================================

/**
 * Update the visual state of a toggle button (checked / unchecked).
 * [was: L2]
 * @param {ToggleButton} button [was: Q]
 */
export function updateToggleButtonState(button) { // was: L2
  if (button.element) { // was: .S
    if (button.isToggled()) {
      g.setVisible(button.defaultIcon, false);   // was: g.ee, .D
      g.setVisible(button.toggledIcon, true);     // was: .K
      button.container.setAttribute("aria-checked", true); // was: .O
    } else {
      g.setVisible(button.defaultIcon, true);
      g.setVisible(button.toggledIcon, false);
      button.container.setAttribute("aria-checked", false);
    }
  }
}

/**
 * Extract endpoint commands from a toggle button, depending on toggled state.
 * [was: tq7]
 * @param {Object}  button  [was: Q]
 * @param {boolean} isDefault [was: c] - true = default, false = toggled.
 * @returns {Array}
 */
export function getToggleEndpoints(button, isDefault) { // was: tq7
  let endpoints = null;
  if (button.model) { // was: .A
    endpoints = (
      isDefault
        ? [button.model.defaultServiceEndpoint, button.model.defaultNavigationEndpoint]
        : [button.model.toggledServiceEndpoint]
    ).filter((ep) => ep != null);
  }
  return endpoints || [];
}

// ===========================================================================
// Part 5 -- Ad feedback dialog  (lines 17373-17478)
// ===========================================================================

/**
 * Initialise the ad-feedback dialog with reasons, buttons, and undo.
 * [was: y_0]
 * @param {AdFeedbackDialog} dialog [was: Q]
 * @param {Object}           data   [was: c]
 */
export function initAdFeedbackDialog(dialog, data) { // was: y_0
  const cancelRenderer =
    data.cancelRenderer && data.cancelRenderer.buttonRenderer || null;

  if (cancelRenderer) {
    dialog.closeButton = new AdButton( // was: wK
      dialog.api,
      dialog.layoutId,
      dialog.interactionLoggingClientData,
      dialog.commandExecutor, // was: .vA
      ["ytp-ad-feedback-dialog-close-button"],
      "button"
    );
    buildVodMediaSubLayout(dialog, dialog.closeButton); // was: g.F
    dialog.closeButton.init(createTemplate("button"), cancelRenderer, dialog.macros); // was: c1
    dialog.closeButton.listen("click", dialog.dismiss, dialog); // was: .J
    dialog.closeButton.attach(dialog.element); // was: .x0
  }

  if (data.title) {
    const title = g.getLocalizedString(data.title);
    dialog.updateValue("title", title);
  }
  if (data.reasonsTitle) {
    const reasonsTitle = g.getLocalizedString(data.reasonsTitle);
    dialog.updateValue("reasonsTitle", reasonsTitle);
  }
  if (data.reasons) populateFeedbackReasons(dialog, data.reasons); // was: HXx

  if (data.cancelLabel) {
    const cancelText = g.getLocalizedString(data.cancelLabel);
    dialog.updateValue("cancelLabel", cancelText);
    g.listen(dialog.cancelElement, "click", () => dialog.dismiss()); // was: g.ph, .K, .J
  }
  if (data.confirmLabel) {
    const confirmText = g.getLocalizedString(data.confirmLabel);
    dialog.updateValue("confirmLabel", confirmText);
    g.listen(dialog.confirmElement, "click", () => confirmFeedback(dialog)); // was: .D, NMd
  }
  if (data.undoRenderer) initUndoButton(dialog, data.undoRenderer); // was: iXm
}

/**
 * Populate feedback reason radio options.
 * [was: HXx]
 * @param {AdFeedbackDialog} dialog  [was: Q]
 * @param {Array}            reasons [was: c]
 */
export function populateFeedbackReasons(dialog, reasons) { // was: HXx
  for (const entry of reasons) {
    const reason = entry.reason;
    if (reason == null) {
      g.logError(Error("AdFeedbackReason.reason was not set.")); // was: g.Ty
      continue;
    }
    const endpoint = entry.endpoint;
    if (endpoint == null) {
      g.logError(Error("AdFeedbackReason.endpoint was not set."));
      continue;
    }
    const option = new FeedbackReasonOption(reason, endpoint); // was: SWK
    buildVodMediaSubLayout(dialog, option);
    const container = dialog.reasonsContainer; // was: .S
    const createDatabaseDefinition = option.getElement(); // was: .Ae
    container.appendChild(createDatabaseDefinition);
    dialog.reasons.push(option); // was: .j
  }
}

/**
 * Confirm the selected feedback reason and send the command.
 * [was: NMd]
 * @param {AdFeedbackDialog} dialog [was: Q]
 */
export function confirmFeedback(dialog) { // was: NMd
  const checked = dialog.reasons.filter((r) => r.isChecked());
  if (checked.length === 0) return;
  const command = checked[0].getCommand();
  if (dialog.layoutId) {
    dialog.commandExecutor.executeCommand(command, dialog.layoutId);
  } else {
    g.logWarning(Error("Missing layoutId for ad feedback dialog.")); // was: g.Zf
  }
  dialog.api.onAdUxClicked("ad-feedback-dialog-confirm-button", dialog.layoutId);
  dialog.publish("a");
  dialog.hide();
}

/**
 * Set up the undo-mute button on a feedback dialog.
 * [was: iXm]
 * @param {AdFeedbackDialog} dialog       [was: Q]
 * @param {Object}           undoRenderer [was: c]
 */
export function initUndoButton(dialog, undoRenderer) { // was: iXm
  const renderer = undoRenderer && undoRenderer.buttonRenderer || null;
  if (!renderer) return;
  if (renderer.serviceEndpoint) {
    dialog.undoButton = new AdButton( // was: wK
      dialog.api,
      dialog.layoutId,
      dialog.interactionLoggingClientData,
      dialog.commandExecutor,
      ["ytp-ad-feedback-dialog-undo-mute-button"],
      "ad-feedback-undo-mute-button"
    );
    buildVodMediaSubLayout(dialog, dialog.undoButton); // was: g.F
    dialog.undoButton.init(
      createTemplate("ad-feedback-undo-mute-button"),
      renderer,
      dialog.macros
    );
    dialog.undoButton.listen("click", dialog.onUndoMute, dialog); // was: .jG
    dialog.undoButton.attach(dialog.undoContainer); // was: .x0, .T2
  } else {
    g.logError(
      Error("AdFeedbackRenderer.undoRenderer.undoButtonRenderer was specified but createSha1 not contain a service endpoint.")
    );
  }
}

// ===========================================================================
// Part 6 -- Ad-info hover / dialog wiring  (lines 17433-17499)
// ===========================================================================

/**
 * Initialise a feedback slide-in panel and register its close handler.
 * [was: F_d]
 * @param {FeedbackPanel} panel [was: Q]
 */
export function initFeedbackPanel(panel) { // was: F_d
  if (panel.closeButton) { // was: .W
    panel.closeButton.listen("click", panel.dismiss, panel); // was: .T2
  }
  g.listen(panel.overlayElement, "click", () => panel.dismiss()); // was: g.ph, .D
}

/**
 * Wire up an ad-feedback dialog from a content wrapper.
 * [was: Ek7]
 * @param {AdContainer}  container [was: Q]
 * @param {Object}       data      [was: c]
 */
export function initAdFeedback(container, data) { // was: Ek7
  const feedbackData = data.content && data.content.adFeedbackRenderer || null;
  if (!feedbackData) return;
  container.feedbackDialog = new AdFeedbackDialogRenderer( // was: ZXK
    container.api,
    container.layoutId,
    container.interactionLoggingClientData,
    container.commandExecutor
  );
  buildVodMediaSubLayout(container, container.feedbackDialog);
  container.feedbackDialog.init(createTemplate("ad-feedback-dialog"), feedbackData, container.macros);
  container.feedbackDialog.attach(container.dialogContainer); // was: .x0, .S
  container.feedbackDialog.subscribe("a", () => container.publish("c"));
}

/**
 * Wire up a confirm-dialog from a content wrapper.
 * [was: d7w]
 * @param {AdContainer} container [was: Q]
 * @param {Object}      data      [was: c]
 */
export function initAdConfirmDialog(container, data) { // was: d7w
  const dialogData = data.content && data.content.confirmDialogRenderer || null;
  if (!dialogData) return;
  container.confirmDialog = new ConfirmDialogRenderer( // was: sSO
    container.api,
    container.layoutId,
    container.interactionLoggingClientData,
    container.commandExecutor
  );
  buildVodMediaSubLayout(container, container.confirmDialog);
  container.confirmDialog.init(createTemplate("ad-mute-confirm-dialog"), dialogData, container.macros);
  container.confirmDialog.attach(container.dialogContainer);
  container.confirmDialog.subscribe("b", () => container.publish("c"));
}

/**
 * Configure the ad-info hover button with its optional dialog endpoint.
 * [was: jS3]
 * @param {AdInfoHoverButton} button   [was: Q]
 * @param {Object}            endpoint [was: c]
 * @param {Object}            macros   [was: W]
 */
export function configureAdInfoHoverButton(button, endpoint, macros) { // was: jS3
  if (button.button == null) {
    g.logWarning(Error("AdInfoHoverTextButton.button was expected but it was not created."));
    return;
  }
  if (button.shortTextElement) { // was: .O
    g.addClass(button.shortTextElement.element, "ytp-ad-info-hover-text-short");
  }
  const dialogEndpoint = endpoint &&
    endpoint.serviceEndpoint &&
    g.getProperty(endpoint.serviceEndpoint, adInfoDialogEndpoint) || null; // was: L_X

  if (dialogEndpoint) {
    createAdInfoDialog(button, dialogEndpoint, macros); // was: w5m
    button.button.listen("click", () => {
      if (button.dialog && !button.dialog.isDisposed) { // was: .OC
        button.dialog.show();
        onAdInfoClicked(button); // was: bX7
      }
    });
  } else {
    button.button.listen("click", () => onAdInfoClicked(button));
  }
}

/**
 * Create the ad-info dialog from an endpoint.
 * [was: w5m]
 * @param {AdInfoHoverButton} button     [was: Q]
 * @param {Object}            endpoint   [was: c]
 * @param {Object}            macros     [was: W]
 */
export function createAdInfoDialog(button, endpoint, macros) { // was: w5m
  const dialogData = endpoint.dialog &&
    g.getProperty(endpoint.dialog, adInfoDialogRenderer) || null; // was: gk_
  if (dialogData == null) {
    g.logWarning(Error("AdInfoDialogEndpoint createSha1 not contain an AdInfoDialogRenderer."));
    return;
  }
  button.dialog = new AdInfoDialog( // was: OXx
    button.api,
    button.layoutId,
    button.interactionLoggingClientData,
    button.commandExecutor,
    button.container // was: .j
  );
  buildVodMediaSubLayout(button, button.dialog);
  button.dialog.init(createTemplate("ad-info-dialog"), dialogData, macros);
  button.dialog.attach(button.container);
  button.dialog.subscribe("d", () => button.publish("f"));
  button.dialog.subscribe("c", () => button.publish("e"));
}

/**
 * Fire the ad-info icon-button click tracking event.
 * [was: bX7]
 * @param {AdInfoHoverButton} button [was: Q]
 */
export function onAdInfoClicked(button) { // was: bX7
  button.api.onAdUxClicked("ad-info-icon-button", button.layoutId);
}

/**
 * Apply background image from a URL string on an element.
 * [was: bL]
 * @param {AdElement} adElement [was: Q]
 * @param {string}    url       [was: c]
 */
export function applyBackgroundImage(adElement, url) { // was: bL
  if (url) {
    g.setBackgroundImage(adElement.element, buildImageUrl(adElement.urlHelper, url)); // was: g.EZ, oH
  }
}

/**
 * Subscribe to publisher state changes on a host.
 * [was: j_]
 * @param {AdComponent} component [was: Q]
 */
export function subscribeToHost(component) { // was: j_
  if (component.host && component.subscriptionId === -1) { // was: .W, .S
    component.subscriptionId = component.host.subscribe("h", component.onHostUpdate, component); // was: .A
    component.secondarySubId = component.host.subscribe("g", component.onHostDispose, component); // was: .XI, .K
    component.onHostUpdate();
  }
}

/**
 * Unsubscribe from publisher state changes on a host.
 * [was: gK]
 * @param {AdComponent} component [was: Q]
 */
export function unsubscribeFromHost(component) { // was: gK
  if (component.host != null && component.subscriptionId !== -1) {
    component.host.unsubscribe(component.subscriptionId); // was: .bU
    component.host.unsubscribe(component.secondarySubId);
    component.secondarySubId = -1;
    component.subscriptionId = -1;
  }
}

/**
 * Set or remove aria-hidden on an ad element.
 * [was: O8]
 * @param {Object}  wrapper [was: Q]
 * @param {boolean} hidden  [was: c]
 */
export function setAdElementAriaHidden(wrapper, hidden) { // was: O8
  const createDatabaseDefinition = wrapper.element.element;
  if (hidden) {
    createDatabaseDefinition.setAttribute("aria-hidden", "true");
  } else {
    createDatabaseDefinition.removeAttribute("aria-hidden");
  }
}

// ===========================================================================
// Part 7 -- Innertube request pipeline  (lines 18691-18843)
// ===========================================================================

/**
 * Resolve a command to a local signal/request handler and return its result.
 * [was: WZ_]
 * @param {RequestRouter} router  [was: Q]
 * @param {Object}        command [was: c]
 * @returns {Promise|undefined}
 */
export function resolveLocalCommand(router, command) { // was: WZ_
  let result;
  resolveBlock: {
    const handlers = router.handlers; // was: .j
    const signalKey = g.getProperty(command, signalEndpoint)?.signal; // was: J3y
    if (signalKey && handlers.signalHandlers && (result = handlers.signalHandlers[signalKey])) { // was: .hf
      result = result();
      break resolveBlock;
    }
    const requestKey = g.getProperty(command, requestEndpoint)?.request; // was: R37
    if (requestKey && handlers.requestHandlers && (result = handlers.requestHandlers[requestKey])) { // was: .BV
      result = result();
      break resolveBlock;
    }
    for (const key in command) {
      if (handlers.commandHandlers[key] && (result = handlers.commandHandlers[key])) { // was: .sx
        result = result();
        break resolveBlock;
      }
    }
    result = undefined;
  }
  if (result !== undefined) return Promise.resolve(result);
}

/**
 * Build synchronous request headers with auth context.
 * [was: mHR]
 * @param {InnertubeClient} client  [was: Q]
 * @param {Object}          config  [was: c]
 * @param {string}          corsMode [was: W]
 * @returns {Object}
 */
export function buildRequestHeadersSync(client, config, corsMode) { // was: mHR
  const authHeaders = client.authService.getHeaders( // was: .W.Sl
    config?.authConfig?.identity || defaultIdentity, // was: .HS, ZM
    { sessionIndex: config?.authConfig?.sessionIndex }
  );
  return {
    ...buildCorsHeaders(corsMode), // was: YN3
    ...authHeaders,
  };
}

/**
 * Build async request headers with auth context.
 * [was: KZO]
 * @param {InnertubeClient} client  [was: Q]
 * @param {Object}          config  [was: c]
 * @param {string}          corsMode [was: W]
 * @returns {Promise<Object>}
 */
export async function buildRequestHeadersAsync(client, config, corsMode) { // was: KZO
  const authHeaders = await g.resolvePromise( // was: g.QU
    client.authService.getHeaders(
      config?.authConfig?.identity || defaultIdentity,
      { sessionIndex: config?.authConfig?.sessionIndex }
    )
  );
  return Promise.resolve({
    ...buildCorsHeaders(corsMode),
    ...authHeaders,
  });
}

/**
 * Execute a full fetch request to an innertube endpoint, with caching
 * and response-processing middleware.
 * [was: XO7]
 * @param {InnertubeClient} client   [was: Q]
 * @param {Object}          request  [was: c]
 * @param {Object}          headers  [was: W]
 * @param {Function}        [onDone] [was: m]
 * @returns {Promise<Object|undefined>}
 */
export async function executeInnertubeRequest(client, request, headers, onDone = () => {}) { // was: XO7
  const cacheKey = request.config?.cacheConfig?.key; // was: .BF?.nz
  if (cacheKey && client.responseStore && client.responseStore.has(cacheKey) && !request.config?.cacheConfig?.disableCache) {
    const cached = await client.responseStore.get(cacheKey);
    if (cached && !cached.isExpired()) {
      const response = extractCachedResponse(cached); // was: Tm0
      if (g.getFlag("web_process_response_store_responses") && !cached.isProcessed()) {
        processResponse(client, response, request); // was: oR7
        await markResponseProcessed(client.responseStore, cacheKey); // was: rGx
      }
      return Promise.resolve(response);
    }
  }

  await prepareRequestContext(request); // was: UH_
  const requestKey = request.config?.requestKey;
  let fetchPromise;

  if (requestKey && client.pendingRequests.has(requestKey)) { // was: .O
    fetchPromise = client.pendingRequests.get(requestKey);
  } else {
    const body = JSON.stringify(request.payload); // was: .Ut
    request.fetchOptions = { // was: .Jq
      ...request.fetchOptions,
      headers: {
        ...(request.fetchOptions?.headers ?? {}),
        ...headers,
      },
    };
    const opts = { ...request.fetchOptions };
    if (request.fetchOptions.method === "POST") {
      opts.body = body;
    }
    if (request.config?.requestStartTimerKey) { // was: .vR
      markTimestamp(request.config.requestStartTimerKey); // was: Bu
    }
    fetchPromise = client.fetchService.fetch(request.input, opts, request.config); // was: .CU
    if (requestKey) client.pendingRequests.set(requestKey, fetchPromise);
  }

  let response = await fetchPromise;

  // Handle streaming player unwrap
  if (response && g.getFlag("web_streaming_player") && Array.isArray(response)) {
    response = response[0].playerResponse;
  }

  // Unwrap gRPC error details
  if (response && "error" in response && response?.error?.details) {
    let details = response.error.details;
    for (const detail of details) {
      const type = detail["@type"];
      if (type && innertubeErrorTypes.indexOf(type) > -1) { // was: I4m
        delete detail["@type"];
        response = detail;
      }
    }
  }

  if (requestKey && client.pendingRequests.has(requestKey)) {
    client.pendingRequests.delete(requestKey);
  }

  if (request.config?.requestCompleteTimerKey) { // was: .Y8
    markTimestamp(request.config.requestCompleteTimerKey);
  }
  processResponse(client, response, request);
  if (request.config?.responseProcessedTimerKey) { // was: .HR
    markTimestamp(request.config.responseProcessedTimerKey);
  }
  onDone();
  return response || undefined;
}

/**
 * Route a command through the local handler or build a full fetch request.
 * [was: Gr]
 * @param {InnertubeClient} client  [was: Q]
 * @param {Object}          command [was: c]
 * @param {string}          corsMode [was: W]
 * @returns {Promise}
 */
export function routeCommand(client, command, corsMode) { // was: Gr
  const localResult = resolveLocalCommand(client, command);
  if (localResult) {
    return new DeferredPromise(async (resolve, reject) => { // was: g.RF
      const built = (await localResult).build(command, corsMode, defaultIdentity); // was: .K
      if (built) {
        validateUrl(built.input); // was: yL
        const fetchMode = built.fetchOptions?.mode === "cors" ? "cors" : undefined;
        const headers = client.authService.isSync // was: .KE
          ? buildRequestHeadersSync(client, built.config, fetchMode)
          : await buildRequestHeadersAsync(client, built.config, fetchMode);
        resolve(executeInnertubeRequest(client, built, headers));
      } else {
        reject(new DetailedError("Error: Failed to build request for command.", command)); // was: g.H8
      }
    });
  }
  return rejectWith(new DetailedError("Error: No request builder found for command.", command)); // was: cJ
}

/**
 * Send a direct innertube API request (e.g. /youtubei/v1/foo).
 * [was: g.$h]
 * @param {InnertubeClient} client    [was: Q]
 * @param {Object}          payload   [was: c]
 * @param {string}          endpoint  [was: W]
 * @param {Object}          configObj [was: m]
 * @param {Object}          [authCfg] [was: K]
 * @returns {Promise}
 */
export function sendInnertubeRequest(client, payload, endpoint, configObj, authCfg = { authConfig: { identity: defaultIdentity } }) { // was: g.$h
  let onDone = () => {};
  onDone = createRequestTiming(getRequestUrl(endpoint)); // was: wsy, dj0
  if (!payload.context) {
    payload.context = g.buildContext(configObj, true); // was: g.Oh
  }
  return new DeferredPromise(async (resolve) => {
    let corsMode = resolveEndpointUrl(endpoint); // was: xn
    corsMode = isSameOrigin(corsMode) ? "same-origin" : "cors"; // was: ax
    const headers = client.authService.isSync
      ? buildRequestHeadersSync(client, authCfg, corsMode)
      : await buildRequestHeadersAsync(client, authCfg, corsMode);
    const url = buildInnertubeUrl(resolveEndpointUrl(endpoint)); // was: gJR
    const request = {
      input: url,
      fetchOptions: buildFetchOptions(url), // was: qt
      payload,
      config: authCfg,
    };
    resolve(executeInnertubeRequest(client, request, headers, onDone));
  });
}

/**
 * Await and process context modifiers before a request.
 * [was: UH_]
 * @param {Object} request [was: Q]
 */
export async function prepareRequestContext(request) { // was: UH_
  if (request?.payload?.context) {
    const ctx = request.payload.context;
    for (const modifier of []) {
      await modifier.applyToContext(ctx); // was: .E3a
    }
  }
}

/**
 * Pass a response through all registered response processors.
 * [was: oR7]
 * @param {InnertubeClient} client  [was: Q]
 * @param {Object}          response [was: c]
 * @param {Object}          request  [was: W]
 */
export function processResponse(client, response, request) { // was: oR7
  if (response && !response?.sequenceMetaData?.skipProcessing && client.processors) { // was: .K
    for (const key of processorKeys) { // was: AGK
      if (client.processors[key]) {
        client.processors[key].handleResponse(response, request);
      }
    }
  }
}

/**
 * Build a cache-hit response object from a stored entry.
 * [was: Tm0]
 * @param {CacheEntry} entry [was: Q]
 * @returns {Object}
 */
export function extractCachedResponse(entry) { // was: Tm0
  return {
    ...entry.data.innertubeResponse,
    cacheMetadata: { isCacheHit: true },
  };
}

/**
 * Mark a cached response as processed.
 * [was: rGx]
 * @param {ResponseStore} store    [was: Q]
 * @param {string}        cacheKey [was: c]
 */
export async function markResponseProcessed(store, cacheKey) { // was: rGx
  const wrapper = store.entries.get(cacheKey); // was: .W
  if (wrapper) {
    wrapper.entryData.isProcessed = true;
    await upsertCacheEntry(store, cacheKey, wrapper.entryData); // was: ew7
  }
}

/**
 * Insert or update a cache entry with an expiry timer.
 * [was: ew7]
 * @param {ResponseStore} store     [was: Q]
 * @param {string}        cacheKey  [was: c]
 * @param {Object}        entryData [was: W]
 */
export async function upsertCacheEntry(store, cacheKey, entryData) { // was: ew7
  let ttlMs = store.defaultTtl; // was: .O
  if (entryData.expireTimestampMs) {
    ttlMs = Number(entryData.expireTimestampMs) - Math.round(g.now()); // was: g.h
    const override = getConfigValue("mweb_override_response_store_expiration_ms"); // was: Y3
    if (override > 0 && override < ttlMs) {
      ttlMs = override;
    }
  }
  const timer = setTimeout(() => {
    store.remove(cacheKey);
  }, ttlMs);
  store.entries.set(cacheKey, { entryData, timer });
}

/**
 * Read a cache entry and wrap it in a typed accessor.
 * [was: Bmn]
 * @param {ResponseStore} store    [was: Q]
 * @param {string}        cacheKey [was: c]
 * @returns {CacheAccessor|undefined} [was: Vaw]
 */
export function getCacheEntry(store, cacheKey) { // was: Bmn
  const wrapper = store.entries.get(cacheKey);
  if (wrapper) return new CacheAccessor(wrapper.entryData); // was: Vaw
}

/**
 * Delete a cache entry and clear its expiry timer.
 * [was: xH_]
 * @param {ResponseStore} store    [was: Q]
 * @param {string}        cacheKey [was: c]
 */
export function removeCacheEntry(store, cacheKey) { // was: xH_
  const wrapper = store.entries.get(cacheKey);
  if (wrapper) {
    clearTimeout(wrapper.timer);
    store.entries.delete(cacheKey);
  }
}

// ===========================================================================
// Part 8 -- Deep merge  (lines 18874-18902)
// ===========================================================================

/**
 * Recursively deep-merge two plain objects with type checking.
 * Arrays are replaced (or concatenated if `appendArrays` is true).
 * [was: g.Pu]
 * @param {Object}  base         [was: Q]
 * @param {Object}  updates      [was: c]
 * @param {boolean} [appendArrays] [was: W]
 * @returns {Object}
 */
export function deepMerge(base, updates, appendArrays) { // was: g.Pu
  const merged = { ...base };
  for (const key of Object.keys(updates)) {
    const baseVal = base[key];
    const updateVal = updates[key];

    if (updateVal === undefined) {
      delete merged[key];
    } else if (baseVal === undefined) {
      merged[key] = updateVal;
    } else if (Array.isArray(updateVal) && Array.isArray(baseVal)) {
      merged[key] = appendArrays ? [...baseVal, ...updateVal] : updateVal;
    } else if (
      !Array.isArray(updateVal) && g.isPlainObject(updateVal) && // was: g.Sd
      !Array.isArray(baseVal) && g.isPlainObject(baseVal)
    ) {
      merged[key] = deepMerge(baseVal, updateVal, appendArrays);
    } else if (typeof updateVal === typeof baseVal) {
      merged[key] = updateVal;
    } else {
      const err = new DetailedError("Attempted to merge fields of differing types.", {
        name: "DeepMergeError",
        key,
        currentValue: baseVal, // was: LnM
        updateValue: updateVal,
      });
      g.logWarning(err);
      return base;
    }
  }
  return merged;
}

// ===========================================================================
// Part 9 -- Byte-buffer / DataView helpers  (lines 18904-18986)
// ===========================================================================

/**
 * Check whether a new chunk can be appended contiguously to the buffer.
 * [was: q77]
 * @param {ByteBuffer} buf   [was: Q]
 * @param {Uint8Array} chunk [was: c]
 * @returns {boolean}
 */
export function canAppendContiguous(buf, chunk) { // was: q77
  if (buf.chunks.length === 0) return false; // was: .W
  const last = buf.chunks[buf.chunks.length - 1];
  return last && last.buffer === chunk.buffer &&
    last.byteOffset + last.length === chunk.byteOffset;
}

/**
 * Reset a byte-buffer's focus state.
 * [was: lg]
 * @param {ByteBuffer} buf [was: Q]
 */
export function resetFocus(buf) { // was: lg
  buf.dataView = undefined; // was: .j
  buf.chunkIndex = 0;       // was: .O
  buf.chunkOffset = 0;      // was: .A
}

/**
 * Append all chunks from one byte-buffer to another.
 * [was: ug]
 * @param {ByteBuffer} dest   [was: Q]
 * @param {ByteBuffer} source [was: c]
 */
export function appendBuffer(dest, source) { // was: ug
  for (const chunk of source.chunks) {
    dest.append(chunk);
  }
}

/**
 * Split a byte-buffer at two positions and return the middle.
 * [was: hr]
 * @param {ByteBuffer} buf   [was: Q]
 * @param {number}     start [was: c]
 * @param {number}     end   [was: W]
 * @returns {ByteBuffer}
 */
export function sliceBuffer(buf, start, end) { // was: hr
  let { before: _head, after: tail } = buf.split(start); // was: .uV, .N4
  ({ before: tail } = tail.split(end));
  return tail;
}

/**
 * Check that reading `length` bytes from `offset` stays within the current chunk.
 * [was: zr]
 * @param {ByteBuffer} buf    [was: Q]
 * @param {number}     offset [was: c]
 * @param {number}     length [was: W]
 * @returns {boolean}
 */
export function isWithinCurrentChunk(buf, offset, length) { // was: zr
  buf.isFocused(offset);
  return offset - buf.chunkOffset + length <= buf.chunks[buf.chunkIndex].length;
}

/**
 * Get a DataView over the focused chunk of a byte-buffer.
 * [was: nR7]
 * @param {ByteBuffer} buf [was: Q]
 * @returns {DataView}
 */
export function getChunkDataView(buf) { // was: nR7
  if (!buf.dataView) {
    const chunk = buf.chunks[buf.chunkIndex];
    buf.dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.length);
  }
  return buf.dataView;
}

/**
 * Get a DataView of `length` bytes starting at `offset`, coalescing chunks if needed.
 * [was: DH7]
 * @param {ByteBuffer} buf      [was: Q]
 * @param {number}     [offset=0] [was: c]
 * @param {number}     [length=-1] [was: W] - Negative means "rest of buffer".
 * @returns {DataView}
 */
export function getDataView(buf, offset = 0, length = -1) { // was: DH7
  if (!buf.totalLength || !length) {
    return new DataView(new ArrayBuffer(0));
  }
  if (length < 0) length = buf.totalLength - offset;
  buf.focus(offset);

  if (!isWithinCurrentChunk(buf, offset, length)) {
    const startIdx = buf.chunkIndex;
    const startOff = buf.chunkOffset;
    buf.focus(offset + length - 1);
    const merged = new Uint8Array(buf.chunkOffset + buf.chunks[buf.chunkIndex].length - startOff);
    let pos = 0;
    for (let i = startIdx; i <= buf.chunkIndex; i++) {
      merged.set(buf.chunks[i], pos);
      pos += buf.chunks[i].length;
    }
    buf.chunks.splice(startIdx, buf.chunkIndex - startIdx + 1, merged);
    resetFocus(buf);
    buf.focus(offset);
  }

  const chunk = buf.chunks[buf.chunkIndex];
  return new DataView(chunk.buffer, chunk.byteOffset + offset - buf.chunkOffset, length);
}

/**
 * Get a Uint8Array view of `length` bytes at `offset`.
 * [was: Cp]
 * @param {ByteBuffer} buf      [was: Q]
 * @param {number}     [offset=0] [was: c]
 * @param {number}     [length=-1] [was: W]
 * @returns {Uint8Array}
 */
export function getUint8View(buf, offset = 0, length = -1) { // was: Cp
  const parseByteRange = getDataView(buf, offset, length);
  return new Uint8Array(parseByteRange.buffer, parseByteRange.byteOffset, parseByteRange.byteLength);
}

/**
 * Copy bytes from the buffer into a new Uint8Array.
 * [was: cl]
 * @param {ByteBuffer} buf      [was: Q]
 * @param {number}     [offset=0] [was: c]
 * @param {number}     [length=-1] [was: W]
 * @returns {Uint8Array}
 */
export function copyBytes(buf, offset = 0, length = -1) { // was: cl
  const view = getUint8View(buf, offset, length);
  const copy = new Uint8Array(view.length);
  try {
    copy.set(view);
  } catch (_e) {
    for (let i = 0; i < view.length; i++) {
      copy[i] = view[i];
    }
  }
  return copy;
}

/**
 * Read a single byte at a given offset.
 * [was: Wl]
 * @param {ByteBuffer} buf    [was: Q]
 * @param {number}     offset [was: c]
 * @returns {number}
 */
export function readByte(buf, offset) { // was: Wl
  buf.focus(offset);
  return buf.chunks[buf.chunkIndex][offset - buf.chunkOffset];
}

/**
 * Read an unsigned 32-bit big-endian integer at the given offset.
 * [was: taW]
 * @param {ByteBuffer} buf    [was: Q]
 * @param {number}     offset [was: c]
 * @returns {number}
 */
export function readUint32BE(buf, offset) { // was: taW
  buf.focus(offset);
  if (isWithinCurrentChunk(buf, offset, 4)) {
    return getChunkDataView(buf).getUint32(offset - buf.chunkOffset);
  }
  return (
    256 * (256 * (256 * readByte(buf, offset) + readByte(buf, offset + 1)) +
      readByte(buf, offset + 2)) +
    readByte(buf, offset + 3)
  );
}
