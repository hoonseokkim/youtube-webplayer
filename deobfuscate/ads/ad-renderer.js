/**
 * Ad Rendering and Display
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~70000-71553
 *
 * Covers the ad overlay UI: container management, skip buttons, ad preview
 * countdowns, feedback/info dialogs, ad badges, visit-advertiser links,
 * duration-remaining display, and the player overlay composition.
 */

// ---------------------------------------------------------------------------
// Imports (conceptual)
// ---------------------------------------------------------------------------
import { AdUIComponent } from './ad-ui-component.js';   // was: JU
import { DomComponent } from '../core/dom-component.js'; // was: g.KK / g.k
import { dispose } from '../core/lifecycle.js';           // was: g.F
import { addClass, toggleClass, hasClass, removeClass } from '../core/dom-utils.js'; // was: g.xK, g.L, g.n6
import { logWarning, logError } from '../core/error.js'; // was: g.Ty, g.Zf
import { AnimationController } from '../core/animation.js'; // was: g.QR
import { initAdFeedbackDialog } from '../data/collection-utils.js'; // was: y_0
import { unlistenByElement } from '../core/dom-listener.js'; // was: c8
import { createAdComponent } from '../player/playback-bridge.js'; // was: eWO
import { findAdComponent } from '../player/playback-bridge.js'; // was: VMw
import { clear } from '../core/array-utils.js';
import { onAdUxClicked } from '../player/player-api.js';
import { executeCommand } from './ad-scheduling.js';
import { getConfig } from '../core/composition-helpers.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Well-known component type IDs that are handled specially by the ad UI
 * container rather than the generic factory path.
 *
 * [was: zRW]
 */
export const KNOWN_AD_COMPONENT_TYPES = [
  'ad-attribution-bar',
  'ad-channel-thumbnail',
  'advertiser-name',
  'ad-preview',
  'ad-title',
  'skip-button',
  'visit-advertiser',
  'shopping-companion',
  'action-companion',
  'image-companion',
  'ads-engagement-panel',
  'ads-engagement-panel-layout',
  'banner-image',
  'top-banner-image-text-icon-buttoned',
]; // was: zRW (split + concat)

// ---------------------------------------------------------------------------
// AdUxUpdateMessage [was: Uzw]  (line ~70057)
// ---------------------------------------------------------------------------

/**
 * Wraps a single ad-UX update delivered to the container.
 * [was: Uzw]
 */
export class AdUxUpdateMessage {
  /**
   * @param {Object}  content     The renderer / view-model payload [was: Q]
   * @param {number}  actionType  1 = create, 2 = update, 3 = remove [was: c]
   * @param {string}  id          Unique component id [was: W]
   */
  constructor(content, actionType, id) {
    this.content = content;     // was: this.content = Q
    this.actionType = actionType; // was: this.actionType = c
    this.id = id;               // was: this.id = W
  }
}

// ---------------------------------------------------------------------------
// AdUpdateDispatcher (base) [was: ddm]  (line ~70065)
// ---------------------------------------------------------------------------

/**
 * Base class that listens for `onAdUxUpdate` events from the player API
 * and dispatches individual `AdUxUpdateMessage` items to subclasses.
 * [was: ddm]
 */
export class AdUpdateDispatcher {
  /**
   * @param {Object} api  Player API [was: Q / this.W]
   */
  constructor(api) {
    this.api = api; // was: this.W = Q
    this._listenOnPlayer(this.api, 'onAdUxUpdate', this._onBatchUpdate);
  }

  /**
   * @param {Array} updates [was: Q in D(Q)]
   */
  _onBatchUpdate(updates) { // was: D(Q)
    if (!Array.isArray(updates)) return;
    for (const msg of updates) {
      if (msg instanceof AdUxUpdateMessage) {
        this._handleSingleUpdate(msg); // was: this.j(c)
      }
    }
  }

  /**
   * Subclasses override to handle a single update.
   * @param {AdUxUpdateMessage} _message [was: j(c)]
   */
  _handleSingleUpdate(_message) { /* abstract */ }

  _listenOnPlayer() { /* event wiring -- see aB base class */ }
}

// ---------------------------------------------------------------------------
// AdFeedbackDialog [was: ZXK]  (line ~70078)
// ---------------------------------------------------------------------------

/**
 * "Why this ad?" feedback dialog with selectable reasons and confirm/cancel.
 *
 * CSS: `.ytp-ad-feedback-dialog-background`, `.ytp-ad-feedback-dialog-container`
 *
 * [was: ZXK]
 */
export class AdFeedbackDialog extends AdUIComponent {
  /**
   * @param {Object} api       Player API [was: Q]
   * @param {string} layoutId  [was: c]
   * @param {Object} loggingData  [was: W]
   * @param {Object} commandExecutor  [was: m]
   */
  constructor(api, layoutId, loggingData, commandExecutor) {
    super(api, {
      tag: 'div', // was: C: "div"
      className: 'ytp-ad-feedback-dialog-background',
      children: [
        /* ... nested .ytp-ad-feedback-dialog-container > .ytp-ad-feedback-dialog-form ... */
      ],
    }, 'ad-info-dialog', layoutId, loggingData, commandExecutor);

    /** @type {Array} Selected reason items [was: this.j] */
    this.reasonItems = [];

    /** @type {HTMLElement|null} [was: this.W] */
    this.selectedOverlay = null;

    this.cancelButton = this._query('.ytp-ad-feedback-dialog-cancel-button');   // was: this.K
    this.confirmButton = this._query('.ytp-ad-feedback-dialog-confirm-button'); // was: this.D
    this.optionsContainer = this._query('.ytp-ad-info-dialog-feedback-options'); // was: this.S
    this.titleElement = this._query('.ytp-ad-feedback-dialog-title');            // was: this.T2

    /** @type {Object|null} Previous active element for focus restore [was: this.A / this.O] */
    this.previousFocus = null;
    this.muteOverlay = null;

    this.hide();
  }

  /**
   * Populate the dialog from a renderer payload.
   * [was: init(Q, c, W)]
   */
  init(elementSpec, renderer, macros) {
    super.init(elementSpec, renderer, macros);
    if (!renderer.reasons) {
      logError(new Error('AdFeedbackRenderer.reasons were not set.'));
      return;
    }
    if (renderer.confirmLabel == null) {
      logError(new Error('AdFeedbackRenderer.confirmLabel was not set.'));
      return;
    }
    if (renderer.cancelLabel == null) {
      logWarning(new Error('AdFeedbackRenderer.cancelLabel was not set.'));
    }
    if (renderer.title == null) {
      logWarning(new Error('AdFeedbackRenderer.title was not set.'));
    }
    this._populateReasons(renderer); // was: y_0(this, c)
  }

  clear() {
    this._detach(this.cancelButton);
    this._detach(this.confirmButton);
    this.reasonItems.length = 0;
    this.hide();
  }

  hide() {
    this.selectedOverlay?.hide();
    this.muteOverlay?.hide();
    super.hide();
    this.previousFocus?.focus();
  }

  show() {
    this.selectedOverlay?.show();
    this.muteOverlay?.show();
    this.previousFocus = document.activeElement;
    super.show();
    this.cancelButton.focus();
  }

  /** Close button handler [was: J()] */
  _onCloseClick() {
    this.api.onAdUxClicked('ad-feedback-dialog-close-button', this.layoutId);
    this.publish('a');
    this.hide();
  }

  /** Escape / overlay click [was: jG()] */
  _onDismiss() {
    this.hide();
  }

  _populateReasons(_renderer) { /* was: initAdFeedbackDialog */ }
  _detach(_el) { /* was: unlistenByElement */ }
  _query(sel) { return null; /* was: this.z2(sel) */ }
}

// ---------------------------------------------------------------------------
// FeedbackReasonItem [was: SWK]  (line ~70166)
// ---------------------------------------------------------------------------

/**
 * A single radio-button reason inside the feedback dialog.
 * [was: SWK]
 */
export class FeedbackReasonItem {
  /**
   * @param {Object} textData  Formatted text [was: Q]
   * @param {Object} command   Command to execute if selected [was: c]
   */
  constructor(textData, command) {
    this.command = command; // was: this.O
    // Builds a <label> with radio input + reason text
    this.labelElement = null; // was: this.W (g.KK)
    this.radioInput = null;   // was: this.A
  }

  getElement() { return this.labelElement?.element; } // was: Ae()
  getCommand() { return this.command; }               // was: getCommand()
  isChecked() { return this.radioInput?.checked; }    // was: isChecked()
}

// ---------------------------------------------------------------------------
// AdInfoDialog [was: OXx]  (line ~70214)
// ---------------------------------------------------------------------------

/**
 * "About this ad" info dialog -- shows ad-targeting reasons, mute button, etc.
 * CSS: `.ytp-ad-info-dialog-background`
 * [was: OXx]
 */
export class AdInfoDialog extends AdUIComponent {
  constructor(api, layoutId, loggingData, commandExecutor, feedbackSupport) {
    super(api, {
      tag: 'div',
      className: 'ytp-ad-info-dialog-background',
      // ... nested structure omitted for brevity
    }, 'ad-info-dialog', layoutId, loggingData, commandExecutor);

    this.closeButton = null;          // was: this.W
    this.muteButton = null;           // was: this.A (ad mute wK instance)
    this.confirmButton = null;        // was: this.D
    this.muteContainer = null;        // was: this.JJ
    this.messageContainer = null;     // was: this.XI
    this.reasonsList = null;          // was: this.jG
    this.feedbackDialog = null;       // was: this.O (ZXK)
    this.muteConfirmDialog = null;    // was: this.j (sSO)
    this.feedbackSupport = feedbackSupport; // was: this.S = K
    this.rendererData = null;         // was: this.K
    this.hasLoggedImpression = false; // was: this.UH = !1
    this.savedFocusElement = null;    // was: this.J

    this.hide();
  }

  init(elementSpec, renderer, macros) {
    super.init(elementSpec, renderer, macros);
    this.rendererData = renderer; // was: this.K = c
    if (renderer.dialogMessage == null && renderer.title == null) {
      logError(new Error('Neither AdInfoDialogRenderer.dialogMessage nor .title was set.'));
      return;
    }
    // ... rest of init builds close/mute buttons, reasons list, etc.
  }

  clear() { this.hide(); }

  hide() {
    this.feedbackDialog?.hide();
    this.muteConfirmDialog?.hide();
    this.closeButton?.hide();
    this.muteButton?.hide();
    super.hide();
    this.savedFocusElement?.focus();
  }

  show() {
    this.closeButton?.show();
    this.muteButton?.show();
    if (!this.hasLoggedImpression) {
      const endpoints = this.rendererData?.impressionEndpoints ?? [];
      for (const ep of endpoints) {
        if (this.layoutId) {
          this.commandExecutor.executeCommand(ep, this.layoutId);
        } else {
          logError(new Error('Missing layoutId for ad info dialog.'));
        }
      }
      this.hasLoggedImpression = true;
    }
    this.savedFocusElement = document.activeElement;
    super.show();
    this.confirmButton?.focus();
  }
}

// ---------------------------------------------------------------------------
// AdText [was: Yp]  (line ~70374)
// ---------------------------------------------------------------------------

/**
 * Simple styled text element used throughout ad overlays.
 * CSS: `.ytp-ad-text`
 * [was: Yp]
 */
export class AdText extends AdUIComponent {
  constructor(api, layoutId, loggingData, commandExecutor, extraClass = null, componentType = 'ad-text') {
    super(api, {
      tag: 'div',
      className: extraClass ?? 'ytp-ad-text',
    }, componentType, layoutId, loggingData, commandExecutor);

    this.rendererData = null; // was: this.W
    this.hide();
  }

  init(elementSpec, renderer, macros) {
    super.init(elementSpec, renderer, macros);
    this.rendererData = renderer;
    if (!this.isTemplated()) {
      this.element.textContent = renderer.text ?? ''; // was: g.EZ(this.element, oH(this.W))
    }
    // Background image, font size, click-tracking, etc.
    this.show();
  }

  isTemplated() {
    return this.rendererData?.isTemplated ?? false;
  }

  clear() { this.hide(); }
}

// ---------------------------------------------------------------------------
// SkipButton [was: jtX]  (line ~70835)
// ---------------------------------------------------------------------------

/**
 * The "Skip Ad" button rendered during skippable in-stream ads.
 *
 * CSS: `.ytp-ad-skip-button-slot`, `.ytp-ad-skip-button`,
 *      `.ytp-ad-skip-button-modern`, `.ytp-ad-skip-button-container`
 *
 * [was: jtX]
 */
export class SkipButton extends AdUIComponent {
  /**
   * @param {Object} api
   * @param {string} layoutId
   * @param {Object} loggingData
   * @param {Object} commandExecutor
   * @param {Object} progressSource    Provides getProgressState() [was: K / this.W]
   * @param {boolean} useAdLifecycleCommands  [was: T / this.JJ]
   */
  constructor(api, layoutId, loggingData, commandExecutor, progressSource, useAdLifecycleCommands) {
    super(api, {
      tag: 'div',
      className: 'ytp-ad-skip-button-slot',
    }, 'skip-button', layoutId, loggingData, commandExecutor, progressSource);

    this.rendererData = null;               // was: this.T2
    this.hasAdControlInClickCommands = false; // was: this.jG
    this.useAdLifecycleCommands = useAdLifecycleCommands; // was: this.JJ
    this.useModernStyle = this.api.getConfig().experiments
      .getBooleanFeature('enable_modern_skip_button_on_web'); // was: this.J

    this.showSkipToNextTooltip = false; // was: this.La

    /** @type {DomComponent|null} Button element [was: this.j] */
    this.buttonElement = null;

    /** @type {DomComponent|null} Container [was: this.D] */
    this.container = new DomComponent({
      tag: 'span',
      className: 'ytp-ad-skip-button-container',
    });
    if (this.useModernStyle) {
      this.container.element.classList.add('ytp-ad-skip-button-container-detached');
    }

    /** @type {AdText|null} Label text [was: this.O] */
    this.labelText = null;

    /** @type {AnimationController} Fade controller [was: this.Fw] */
    this.fadeController = new AnimationController(this.container, 500, false, 100, () => this.hide());

    /** Opacity auto-fade controller [was: this.UH -- instance of Wy] */
    this.opacityFader = null;

    this.hide();
  }

  /**
   * Build the button DOM from a SkipButtonRenderer.
   * [was: init(Q, c, W)]
   */
  init(elementSpec, renderer, macros) {
    super.init(elementSpec, renderer, macros);
    this.rendererData = renderer; // was: this.T2 = c

    if (!renderer || !renderer.message) {
      logError(new Error('SkipButtonRenderer.message was not specified or empty.'));
      return;
    }

    const iconType = this.useModernStyle ? 'SKIP_NEXT_NEW' : 'SKIP_NEXT';
    // Build icon, button, label text ...
    // (detailed DOM construction elided; see source lines 70869-70900)
  }

  clear() {
    this.opacityFader?.reset();
    this.hide();
  }

  hide() {
    this.container?.hide();
    this.labelText?.hide();
    super.hide();
  }

  /**
   * Handle click -- fires skip events, validates click integrity.
   * [was: onClick(Q)]
   */
  onClick(event) {
    if (this.buttonElement == null) return;

    if (event) {
      event.preventDefault();
    }

    // Verify click integrity [was: vkO]
    // Fire "onAdSkip" event via api
    // Execute click commands unless pruned by ad lifecycle
    super.onClick(event);
    this.publish('j'); // was: this.publish("j")
    this.api.onAdSkip(); // was: g.xt(this.api, "onAdSkip")

    if (!this.useAdLifecycleCommands || !this.hasAdControlInClickCommands) {
      this.api.onAdUxClicked(this.componentType, this.layoutId);
    }
  }

  show() {
    this.opacityFader?.start();
    this.container?.show();
    this.labelText?.show();
    super.show();
    if (this.showSkipToNextTooltip && this.api.getConfig().experimentEnabled('enable_skip_to_next_messaging')) {
      this.api.publish('showpromotooltip', this.element);
    }
  }
}

// ---------------------------------------------------------------------------
// SkipAdSlot [was: Aj]  (line ~70964)
// ---------------------------------------------------------------------------

/**
 * Composite slot holding a preskip countdown and a skip button.
 * Manages the transition from "Ad will end in N seconds" to "Skip Ad".
 *
 * CSS: `.ytp-ad-skip-ad-slot`
 * [was: Aj]
 */
export class SkipAdSlot extends AdUIComponent {
  constructor(api, layoutId, loggingData, commandExecutor, progressSource, useAdLifecycleCommands) {
    super(api, {
      tag: 'div',
      className: 'ytp-ad-skip-ad-slot',
    }, 'skip-ad', layoutId, loggingData, commandExecutor, progressSource);

    this.useAdLifecycleCommands = useAdLifecycleCommands; // was: this.T2
    this.isSkippable = false;          // was: this.D
    this.skipOffsetMs = 0;             // was: this.J
    this.preskipComponent = null;      // was: this.O  (cy instance)
    this.skipButton = null;            // was: this.j  (jtX instance)

    this.hide();
  }

  init(elementSpec, renderer, macros) {
    super.init(elementSpec, renderer, macros);

    // Parse preskipRenderer to get countdown duration
    const preskipData = renderer?.preskipRenderer?.adPreviewRenderer ?? {};
    if (preskipData.durationMilliseconds != null) {
      this.skipOffsetMs = preskipData.durationMilliseconds;
    } else if (renderer.skipOffsetMilliseconds) {
      this.skipOffsetMs = renderer.skipOffsetMilliseconds;
    }

    // Create skip button from skippableRenderer
    const skipData = renderer?.skippableRenderer?.skipButtonRenderer ?? null;
    if (skipData == null) {
      logError(new Error('SkipButtonRenderer was not set in player response.'));
      return;
    }
    this.skipButton = new SkipButton(
      this.api, this.layoutId, this.interactionLoggingClientData,
      this.commandExecutor, this.progressSource, this.useAdLifecycleCommands,
    );
    this.skipButton.init({ type: 'skip-button' }, skipData, macros);
    this.show();
  }

  show() {
    if (this.isSkippable && this.skipButton) {
      this.skipButton.show();
    } else {
      this.preskipComponent?.show();
    }
    super.show();
  }

  clear() {
    this.preskipComponent?.clear();
    this.skipButton?.clear();
    super.hide();
  }

  /** Progress tick -- checks if skip offset reached. [was: A()] */
  _onProgressTick() {
    const currentMs = 1000 * this.progressSource.getProgressState().current;
    if (currentMs >= this.skipOffsetMs) {
      this._transitionToSkippable(true); // was: lLK(this, !0)
    }
  }

  _transitionToSkippable(_show) { /* was: lLK */ }
}

// ---------------------------------------------------------------------------
// AdPlayerOverlay [was: m_y]  (line ~71417)
// ---------------------------------------------------------------------------

/**
 * The composite overlay rendered on top of the video during in-stream ads.
 * Houses skip/preview slot, ad badge, duration remaining, info button,
 * visit-advertiser, flyout CTA, user-sentiment controls, progress bar,
 * and disclosure banner.
 *
 * CSS: `.ytp-ad-player-overlay`, `.ytp-ad-player-overlay-*`
 * [was: m_y]
 */
export class AdPlayerOverlay extends AdUIComponent {
  constructor(api, layoutId, loggingData, commandExecutor, progressSource, useAdLifecycleCommands) {
    super(api, {
      tag: 'div',
      className: 'ytp-ad-player-overlay',
      children: [
        { tag: 'div', className: 'ytp-ad-player-overlay-flyout-cta' },
        { tag: 'div', className: 'ytp-ad-player-overlay-instream-info' },
        { tag: 'div', className: 'ytp-ad-player-overlay-skip-or-preview' },
        { tag: 'div', className: 'ytp-ad-player-overlay-progress-bar' },
        { tag: 'div', className: 'ytp-ad-player-overlay-instream-user-sentiment' },
        { tag: 'div', className: 'ytp-ad-player-overlay-ad-disclosure-banner' },
      ],
    }, 'player-overlay', layoutId, loggingData, commandExecutor);

    this.useAdLifecycleCommands = useAdLifecycleCommands; // was: this.D
    this.flyoutCtaSlot = null;        // was: this.K
    this.instreamInfoSlot = null;     // was: this.W
    this.adTitleElement = null;       // was: this.j
    this.adBadgeElement = null;       // was: this.A
    this.skipOrPreviewSlot = null;    // was: this.jG
    this.progressBarSlot = null;      // was: this.T2
    this.sentimentSlot = null;        // was: this.S
    this.disclosureBannerSlot = null; // was: this.J
    this.progressSource = progressSource; // was: this.O

    this.hide();
  }

  /**
   * Build sub-components from the player overlay renderer data.
   * [was: init(Q, c, W, m)]
   */
  init(elementSpec, renderer, macros, contentInfo) {
    super.init(elementSpec, renderer, macros);

    // Skip or Preview
    if (renderer.skipOrPreviewRenderer) {
      // creates SkipAdSlot and attaches to skipOrPreviewSlot
    }

    // Ad badge (simple or view-model based)
    if (renderer.adBadgeRenderer) {
      // creates AdBadge or SimpleAdBadge
    }

    // Duration remaining
    if (renderer.adDurationRemaining && !renderer.showWithoutLinkedMediaLayout) {
      // creates AdDurationRemaining
    }

    // Ad info button
    if (renderer.adInfoRenderer) {
      // creates the "Why this ad?" hover button
    }

    // Visit advertiser link
    if (renderer.visitAdvertiserRenderer) {
      // creates VisitAdvertiserButton
    }

    // Persistent progress bar (for certain player configs)
    // Flyout CTA, brand interaction, disclosure banner ...

    this.show();
  }

  clear() { this.hide(); }
}

// ---------------------------------------------------------------------------
// AdUIContainer [was: CI9]  (line ~124116)
// ---------------------------------------------------------------------------

/**
 * Top-level container that receives ad UX updates and creates/updates/removes
 * ad UI components. Mounted as `.video-ads.ytp-ad-module`.
 *
 * [was: CI9]
 */
export class AdUIContainer extends AdUpdateDispatcher {
  /**
   * @param {Object} api              Player API [was: Q]
   * @param {Object} commandExecutor  [was: c / this.vA]
   * @param {Object} layoutManager    [was: W]
   */
  constructor(api, commandExecutor, layoutManager) {
    super(api);
    this.api = api;
    this.commandExecutor = commandExecutor; // was: this.vA
    this.components = {};                   // was: this.components

    // Create the root container div: .video-ads.ytp-ad-module
    const rootElement = new DomComponent({
      tag: 'div',
      classNames: ['video-ads', 'ytp-ad-module'],
    });
    dispose(this, rootElement);

    // Optionally add underlay container
  }

  /**
   * Process a single ad UX update.
   * @param {AdUxUpdateMessage} message [was: j(Q)]
   */
  _handleSingleUpdate(message) { // was: j(Q)
    const { id, content, actionType } = message;
    const componentType = content.componentType;

    if (KNOWN_AD_COMPONENT_TYPES.includes(componentType)) return;

    switch (actionType) {
      case 1: { // CREATE
        const component = this._createComponent(componentType, content);
        if (!component) {
          logWarning(new Error(`No UI component returned from ComponentFactory for type: ${componentType}`));
          break;
        }
        if (this.components[id]) {
          logWarning(new Error(`Ad UI component already registered: ${id}`));
        } else {
          this.components[id] = component;
        }
        component.bind(content);
        break;
      }
      case 2: { // UPDATE
        const existing = this._findComponent(message);
        existing?.bind(content);
        break;
      }
      case 3: { // REMOVE
        const toRemove = this._findComponent(message);
        if (toRemove) {
          toRemove.dispose();
          delete this.components[id];
        } else {
          logWarning(new Error(`Ad UI component does not exist: ${id}`));
        }
        break;
      }
    }
  }

  /** Dispose all child components. [was: WA()] */
  dispose() {
    for (const component of Object.values(this.components)) {
      component.dispose();
    }
    this.components = {};
    super.dispose();
  }

  _createComponent(_type, _content) { return null; /* was: createAdComponent */ }
  _findComponent(_message) { return null; /* was: findAdComponent */ }
}
