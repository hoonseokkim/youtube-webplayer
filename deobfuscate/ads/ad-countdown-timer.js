/**
 * Ad Countdown Timer — timed pie countdown SVG rendering, circle path
 * drawing for animated countdowns, pie fill animation, and action
 * interstitial layout with skip/nonskippable overlay support.
 *
 * Source: base.js lines 122004–123000
 * [was: wBD, o6O, WQR, Ihm, XXK]
 */

import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { getProperty } from '../core/misc-helpers.js';  // was: g.l
import { reportErrorWithLevel } from '../data/gel-params.js';  // was: g.Zf
import { AdText, FadeAnimationController } from '../player/component-events.js';  // was: g.Yp, g.QR
import { pauseVideo } from '../player/player-events.js';  // was: g.pauseVideo
import { executeCommand } from './ad-scheduling.js';  // was: g.xA
import { ProgressAwareComponent } from '../player/component-events.js'; // was: pP
import { unsubscribeFromHost } from '../data/collection-utils.js'; // was: gK
import { subscribeToHost } from '../data/collection-utils.js'; // was: j_
import { AdComponent } from '../player/component-events.js'; // was: JU
import { numberToHexColor } from '../modules/caption/caption-settings.js'; // was: vA
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { AdVideoClickthroughMetadata } from './ad-interaction.js'; // was: ux
import { generateScopedId } from '../data/visual-element-tracking.js'; // was: c1
import { AdButton } from '../player/component-events.js'; // was: wK
import { setRoleLink } from '../core/bitstream-helpers.js'; // was: c7
import { getAriaLabel } from '../core/bitstream-helpers.js'; // was: K6
import { setAriaLabel } from '../core/bitstream-helpers.js'; // was: mr
import { TimerProgressTracker } from '../player/component-events.js'; // was: o5
import { AdPlaybackProgressTracker } from '../player/component-events.js'; // was: Vd
import { skipButtonRenderer } from '../core/misc-helpers.js'; // was: QfR
import { simpleAdBadge } from '../core/misc-helpers.js'; // was: pMw
import { adHoverTextButtonRenderer } from '../core/misc-helpers.js'; // was: Ns
import { adPreviewRenderer } from '../core/misc-helpers.js'; // was: ih
import { timedPieCountdown } from '../core/misc-helpers.js'; // was: cuw
import { setAdDisplayOverride } from '../player/playback-bridge.js'; // was: ywm
import { applyBackgroundImage } from '../data/collection-utils.js'; // was: bL
import { setStyle, removeClass, addClass, containsNode } from '../core/dom-utils.js';
import { clear, remove } from '../core/array-utils.js';
import { isEmptyOrWhitespace, toString } from '../core/string-utils.js';
import { ContainerComponent } from '../player/container-component.js';
// TODO: resolve g.KK

// Stub: SimpleAdBadgeComponent [was: KS] — simple ad badge with text + separator (base.js ~71039).
// Extends AdComponent (JU), CSS class "ytp-ad-simple-ad-badge".  Not yet extracted to its own module.
const SimpleAdBadgeComponent = KS; // was: KS

/**
 * SVG-based timed pie countdown widget. Renders a circular progress
 * indicator using stroke-dasharray animation on SVG circle elements.
 *
 * The SVG structure consists of three concentric circles:
 *   - background: full opaque circle (r=10)
 *   - inner: animated fill circle (r=5), stroke-dasharray driven
 *   - outer: border circle (r=10)
 *
 * [was: wBD]
 */
export class TimedPieCountdown extends ProgressAwareComponent {
  /**
   * @param {object} api - Player API [was: Q]
   * @param {string} layoutId [was: c]
   * @param {object} interactionLoggingClientData [was: W]
   * @param {object} commandExecutor [was: m]
   * @param {object} progressProvider [was: K]
   */
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor, progressProvider) {
    super(api, {
      C: "div",
      Z: "ytp-ad-timed-pie-countdown-container",
      V: [{
        C: "svg",
        Z: "ytp-ad-timed-pie-countdown",
        N: { viewBox: "0 0 20 20" },
        V: [{
          C: "circle",
          Z: "ytp-ad-timed-pie-countdown-background",
          N: { r: "10", cx: "10", cy: "10" },
        }, {
          C: "circle",
          Z: "ytp-ad-timed-pie-countdown-inner",
          N: { r: "5", cx: "10", cy: "10" },
        }, {
          C: "circle",
          Z: "ytp-ad-timed-pie-countdown-outer",
          N: { r: "10", cx: "10", cy: "10" },
        }],
      }],
    }, "timed-pie-countdown", layoutId, interactionLoggingClientData, commandExecutor, progressProvider);

    /** @type {Element} The outer container element [was: D] */
    this.container = this.z2("ytp-ad-timed-pie-countdown-container");
    /** @type {Element} The inner circle SVG element [was: j] */
    this.innerCircle = this.z2("ytp-ad-timed-pie-countdown-inner");
    /** @type {Element} The outer circle SVG element [was: J] */
    this.outerCircle = this.z2("ytp-ad-timed-pie-countdown-outer");
    /** @type {number} Circumference of the inner circle (2 * PI * r) [was: O] */
    this.circumference = Math.ceil(2 * Math.PI * 5);
    this.hide();
  }

  /**
   * Initializes the countdown with zero fill, applies light theme classes,
   * and positions the countdown in the upper-right corner.
   * @param {object} componentType [was: Q]
   * @param {object} rendererData [was: c]
   * @param {object} macros [was: W]
   */
  init(componentType, rendererData, macros) {
    super.init(componentType, rendererData, macros);
    setStyle(this.innerCircle, "stroke-dasharray", `0 ${this.circumference}`);
    this.innerCircle.classList.add("ytp-ad-timed-pie-countdown-inner-light");
    this.outerCircle.classList.add("ytp-ad-timed-pie-countdown-outer-light");
    this.container.classList.add("ytp-ad-timed-pie-countdown-container-upper-right");
    this.show();
  }

  clear() {
    this.hide();
  }

  hide() {
    unsubscribeFromHost(this);
    super.hide();
  }

  show() {
    subscribeToHost(this);
    super.show();
  }

  /** Called when the ad ends — hides the countdown. [was: K] */
  onAdEnd() {
    this.hide();
  }

  /**
   * Called on each animation frame — updates the stroke-dasharray
   * to reflect the current playback progress as a pie fill.
   * [was: A]
   */
  onProgressUpdate() {
    if (this.W) {
      const progressState = this.W.getProgressState(); // was: Q
      if (progressState != null && progressState.current != null) {
        const fillAmount = (progressState.current / progressState.seekableEnd) * this.circumference;
        setStyle(this.innerCircle, "stroke-dasharray", `${fillAmount} ${this.circumference}`);
      }
    }
  }
}

/**
 * Ad action interstitial — full-screen interstitial card shown during
 * ad breaks, containing an image (profile picture), headline text,
 * description, background image, CTA button, and optional skip button
 * or nonskippable overlay with countdown timer.
 *
 * [was: o6O]
 */
export class AdActionInterstitial extends AdComponent {
  /**
   * @param {object} api [was: Q]
   * @param {string} layoutId [was: c]
   * @param {object} interactionLoggingClientData [was: W]
   * @param {object} commandExecutor [was: m]
   * @param {boolean} isDaiEnabled [was: K / DX]
   * @param {object} skipButtonConfig [was: T / G8]
   */
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor, isDaiEnabled, skipButtonConfig) {
    super(api, {
      C: "div",
      Z: "ytp-ad-action-interstitial",
      N: { tabindex: "0" },
      V: [{
        C: "div",
        Z: "ytp-ad-action-interstitial-background-container",
      }, {
        C: "div",
        Z: "ytp-ad-action-interstitial-slot",
        V: [{
          C: "div",
          Z: "ytp-ad-action-interstitial-instream-info",
        }, {
          C: "div",
          Z: "ytp-ad-action-interstitial-card",
          V: [{
            C: "div",
            Z: "ytp-ad-action-interstitial-image-container",
          }, {
            C: "div",
            Z: "ytp-ad-action-interstitial-headline-container",
          }, {
            C: "div",
            Z: "ytp-ad-action-interstitial-description-container",
          }, {
            C: "div",
            Z: "ytp-ad-action-interstitial-action-button-container",
          }],
        }],
      }],
    }, "ad-action-interstitial", layoutId, interactionLoggingClientData, commandExecutor);

    this.isDaiEnabled = isDaiEnabled;         // was: DX
    this.skipButtonConfig = skipButtonConfig;  // was: G8
    this.navigationEndpoint = null;
    this.progressProvider = null;             // was: W
    this.skipButton = null;
    this.nonskippableOverlay = null;          // was: O
    this.actionButton = null;

    /** @type {Element} [was: jG] */
    this.instreamInfoContainer = this.z2("ytp-ad-action-interstitial-instream-info");
    /** @type {Element} [was: T2] */
    this.imageContainer = this.z2("ytp-ad-action-interstitial-image-container");

    /** @type {SkipRequestedTriggerMetadata} Ad image component [was: D] */
    this.adImage = new SkipRequestedTriggerMetadata(
      this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
      "ytp-ad-action-interstitial-image"
    );
    registerDisposable(this, this.adImage);
    this.adImage.createVisualElement(this.imageContainer);

    /** @type {Element} [was: S] */
    this.headlineContainer = this.z2("ytp-ad-action-interstitial-headline-container");
    /** @type {Yp} Headline text component [was: K] */
    this.headlineText = new AdText(
      this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
      "ytp-ad-action-interstitial-headline"
    );
    registerDisposable(this, this.headlineText);
    this.headlineText.createVisualElement(this.headlineContainer);

    /** @type {Element} [was: J] */
    this.descriptionContainer = this.z2("ytp-ad-action-interstitial-description-container");
    /** @type {Yp} Description text component [was: A] */
    this.descriptionText = new AdText(
      this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
      "ytp-ad-action-interstitial-description"
    );
    registerDisposable(this, this.descriptionText);
    this.descriptionText.createVisualElement(this.descriptionContainer);

    /** @type {Element} Background container [was: La] */
    this.backgroundContainer = this.z2("ytp-ad-action-interstitial-background-container");
    /** @type {SkipRequestedTriggerMetadata} Background image component [was: UH] */
    this.backgroundImage = new SkipRequestedTriggerMetadata(
      this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
      "ytp-ad-action-interstitial-background", true
    );
    registerDisposable(this, this.backgroundImage);
    this.backgroundImage.createVisualElement(this.backgroundContainer);

    /** @type {Element} Action button container [was: JJ] */
    this.actionButtonContainer = this.z2("ytp-ad-action-interstitial-action-button-container");
    /** @type {Element} Slot element [was: slot] */
    this.slot = this.z2("ytp-ad-action-interstitial-slot");
    /** @type {Element} Card element [was: XO] */
    this.card = this.z2("ytp-ad-action-interstitial-card");
    /** @type {aB} Event handler [was: j] */
    this.eventHandler = new aB();
    registerDisposable(this, this.eventHandler);

    this.hide();
  }

  /**
   * Initializes the interstitial with renderer data. Validates all required
   * fields (image, headline, description, background, button, duration,
   * navigation endpoint) and sets up the UI hierarchy.
   *
   * @param {object} componentType [was: Q]
   * @param {object} renderer - AdActionInterstitialRenderer data [was: c]
   * @param {object} macros [was: W]
   */
  init(componentType, renderer, macros) {
    super.init(componentType, renderer, macros);
    // Validation chain — each missing field throws and returns
    if (!renderer.image || !renderer.image.thumbnail) {
      reportErrorWithLevel(Error("AdActionInterstitialRenderer has no image."));
      return;
    }
    if (!renderer.headline) {
      reportErrorWithLevel(Error("AdActionInterstitialRenderer has no headline AdText."));
      return;
    }
    if (!renderer.description) {
      reportErrorWithLevel(Error("AdActionInterstitialRenderer has no description AdText."));
      return;
    }
    if (!renderer.backgroundImage || !renderer.backgroundImage.thumbnail) {
      reportErrorWithLevel(Error("AdActionInterstitialRenderer has no background AdImage."));
      return;
    }
    if (!renderer.actionButton || !getProperty(renderer.actionButton, Wq)) {
      reportErrorWithLevel(Error("AdActionInterstitialRenderer has no button."));
      return;
    }

    const durationMs = renderer.durationMilliseconds || 0; // was: Q (reused)
    if (typeof durationMs !== "number" || durationMs <= 0) {
      reportErrorWithLevel(Error(`durationMilliseconds was specified incorrectly in AdActionInterstitialRenderer with a value of: ${durationMs}`));
      return;
    }
    if (!renderer.navigationEndpoint) {
      reportErrorWithLevel(Error("AdActionInterstitialRenderer has no navigation endpoint."));
      return;
    }

    // Substitute empty profile pictures / author names from ad video data
    const adVideoData = this.api.getVideoData({ playerType: 2 }); // was: m
    if (adVideoData != null) {
      const imageThumbnails = renderer.image.thumbnail.thumbnails; // was: K
      if (imageThumbnails != null && imageThumbnails.length > 0 && isEmptyOrWhitespace(toString(imageThumbnails[0].url))) {
        imageThumbnails[0].url = adVideoData.profilePicture;
        if (isEmptyOrWhitespace(toString(adVideoData.profilePicture))) {
          u6m(6, "VideoPlayer", 239976093, "Expected non-empty profile picture.");
        }
      }
      const bgThumbnails = renderer.backgroundImage.thumbnail.thumbnails;
      if (bgThumbnails != null && bgThumbnails.length > 0 && isEmptyOrWhitespace(toString(bgThumbnails[0].url))) {
        bgThumbnails[0].url = adVideoData.AdVideoClickthroughMetadata();
      }
      const headlineData = renderer.headline;
      if (headlineData != null && isEmptyOrWhitespace(toString(headlineData.text))) {
        headlineData.text = adVideoData.author;
      }
    }

    // Initialize child components
    this.adImage.init(generateScopedId("ad-image"), renderer.image, macros);
    this.headlineText.init(generateScopedId("ad-text"), renderer.headline, macros);
    this.descriptionText.init(generateScopedId("ad-text"), renderer.description, macros);
    this.backgroundImage.init(generateScopedId("ad-image"), renderer.backgroundImage, macros);

    // Dark background + light text theme
    const buttonClasses = [
      "ytp-ad-action-interstitial-action-button",
      "ytp-ad-action-interstitial-action-button-rounded",
    ];
    this.slot.classList.add("ytp-ad-action-interstitial-slot-dark-background");
    this.headlineText.element.classList.add("ytp-ad-action-interstitial-headline-light");
    this.descriptionText.element.classList.add("ytp-ad-action-interstitial-description-light");

    if (this.api.G().X("enable_default_mono_cta_migration_web_client")) {
      buttonClasses.push("ytp-ad-action-interstitial-action-button-mono-dark");
    } else {
      buttonClasses.push("ytp-ad-action-interstitial-action-button-dark");
    }

    // Mobile companion sizing
    if (this.api.G().O) {
      buttonClasses.push("ytp-ad-action-interstitial-action-button-mobile-companion-size");
      if (this.api.G().X("enable_default_mono_cta_migration_web_client")) {
        buttonClasses.push("ytp-ad-action-interstitial-action-button-mono-dark");
      } else {
        buttonClasses.push("ytp-ad-action-interstitial-action-button-dark");
      }
    }

    // Unified endcap (desktop only)
    if (this.api.G().X("enable_unified_action_endcap_on_web") && !this.api.G().O) {
      if (this.api.G().X("enable_default_mono_cta_migration_web_client")) {
        buttonClasses.push("ytp-ad-action-interstitial-action-button-unified-mono");
      } else {
        buttonClasses.push("ytp-ad-action-interstitial-action-button-unified");
      }
      this.actionButtonContainer.classList.add("ytp-ad-action-interstitial-action-button-container-unified");
      this.adImage.element.classList.add("ytp-ad-action-interstitial-image-unified");
      this.backgroundContainer.classList.add("ytp-ad-action-interstitial-background-container-unified");
      this.card.classList.add("ytp-ad-action-interstitial-card-unified");
      this.descriptionContainer.classList.add("ytp-ad-action-interstitial-description-container-unified");
      this.descriptionText.element.classList.add("ytp-ad-action-interstitial-description-unified");
      this.headlineContainer.classList.add("ytp-ad-action-interstitial-headline-container-unified");
      this.headlineText.element.classList.add("ytp-ad-action-interstitial-headline-unified");
      this.imageContainer.classList.add("ytp-ad-action-interstitial-image-container-unified");
      this.instreamInfoContainer.classList.add("ytp-ad-action-interstitial-instream-info-unified");
      this.slot.classList.add("ytp-ad-action-interstitial-slot-unified");
    }

    // Action button
    this.actionButton = new AdButton(
      this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor, buttonClasses
    );
    registerDisposable(this, this.actionButton);
    this.actionButton.createVisualElement(this.actionButtonContainer);
    this.actionButton.init(generateScopedId("button"), getProperty(renderer.actionButton, Wq), macros);
    setRoleLink(this.actionButton.element);
    const buttonLabel = getAriaLabel(this.actionButton.element);
    setAriaLabel(this.actionButton.element, buttonLabel + " This link opens in new tab");

    this.navigationEndpoint = renderer.navigationEndpoint;

    // Click handlers for image, description, and headline (desktop only)
    this.eventHandler.B(this.imageContainer, "click", this.onNavigationClick, this);
    this.eventHandler.B(this.descriptionContainer, "click", this.onNavigationClick, this);
    if (!this.api.G().O) {
      this.eventHandler.B(this.headlineContainer, "click", this.onNavigationClick, this);
    }

    // Progress provider (DAI vs standard)
    this.progressProvider = this.isDaiEnabled ? new AdPlaybackProgressTracker(this.api, durationMs) : new TimerProgressTracker(durationMs);
    registerDisposable(this, this.progressProvider);

    // Skip button or nonskippable overlay
    if (renderer.skipButton) {
      const skipData = getProperty(renderer.skipButton, skipButtonRenderer);
      if (skipData && this.progressProvider) {
        this.skipButton = new jtX(
          this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
          this.progressProvider, this.skipButtonConfig
        );
        registerDisposable(this, this.skipButton);
        this.skipButton.createVisualElement(this.element);
        this.skipButton.init(generateScopedId("skip-button"), skipData, macros);
      }
      // Ad badge
      if (renderer.adBadgeRenderer) {
        const badgeData = getProperty(renderer.adBadgeRenderer, simpleAdBadge);
        if (badgeData) {
          const badge = new SimpleAdBadgeComponent( // was: new KS()
            this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor, true
          );
          badge.createVisualElement(this.instreamInfoContainer);
          badge.init(generateScopedId("simple-ad-badge"), badgeData, this.macros);
          registerDisposable(this, badge);
        }
      }
      // Ad info button
      if (renderer.adInfoRenderer) {
        const infoData = getProperty(renderer.adInfoRenderer, adHoverTextButtonRenderer);
        if (infoData) {
          const infoButton = new rS(
            this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
            this.element, undefined, true
          );
          infoButton.createVisualElement(this.instreamInfoContainer);
          infoButton.init(generateScopedId("ad-info-hover-text-button"), infoData, this.macros);
          registerDisposable(this, infoButton);
        }
      }
    } else if (renderer.nonskippableOverlayRenderer) {
      const overlayData = getProperty(renderer.nonskippableOverlayRenderer, adPreviewRenderer);
      if (overlayData && this.progressProvider) {
        this.nonskippableOverlay = new cy(
          this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
          this.progressProvider, false
        );
        registerDisposable(this, this.nonskippableOverlay);
        this.nonskippableOverlay.createVisualElement(this.element);
        this.nonskippableOverlay.init(generateScopedId("ad-preview"), overlayData, macros);
      }
    }

    // Countdown renderer (timed pie)
    if (renderer.countdownRenderer) {
      const countdownData = getProperty(renderer.countdownRenderer, timedPieCountdown);
      if (countdownData && this.progressProvider) {
        const countdown = new TimedPieCountdown(
          this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
          this.progressProvider
        );
        registerDisposable(this, countdown);
        countdown.createVisualElement(this.element);
        countdown.init(generateScopedId("timed-pie-countdown"), countdownData, this.macros);
      }
    }

    this.show();
    this.element.focus();
  }

  clear() {
    this.eventHandler.O();
    this.hide();
  }

  show() {
    setAdDisplayOverride(true);
    if (this.actionButton) this.actionButton.show();
    if (this.skipButton) this.skipButton.show();
    if (this.nonskippableOverlay) this.nonskippableOverlay.show();
    super.show();
  }

  hide() {
    setAdDisplayOverride(false);
    if (this.actionButton) this.actionButton.hide();
    if (this.skipButton) this.skipButton.hide();
    if (this.nonskippableOverlay) this.nonskippableOverlay.hide();
    super.hide();
  }

  /** Navigates to the ad's endpoint on click. [was: XI] */
  onNavigationClick() {
    if (this.navigationEndpoint) {
      if (this.layoutId) {
        this.numberToHexColor.executeCommand(this.navigationEndpoint, this.layoutId);
      } else {
        reportErrorWithLevel(Error("Missing layoutId for ad action interstitial."));
      }
    }
  }
}

/**
 * Ad message overlay — a transient text message shown during ad playback
 * with fade-in/fade-out transitions and templated countdown support.
 *
 * [was: Ihm]
 */
export class AdMessageOverlay extends ProgressAwareComponent {
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor, progressProvider) {
    super(api, {
      C: "div",
      Z: "ytp-ad-message-overlay",
      V: [{ C: "div", Z: "ytp-ad-message-slot" }],
    }, "ad-message", layoutId, interactionLoggingClientData, commandExecutor, progressProvider);

    this.lastCountdownValue = -1;    // was: J
    this.targetEndTimeMs = 0;        // was: j
    this.hasTimedOut = false;        // was: T2

    /** @type {Element} [was: jG] */
    this.messageSlot = this.z2("ytp-ad-message-slot");

    /** @type {g.KK} Container span [was: O] */
    this.container = new ContainerComponent({ C: "span", Z: "ytp-ad-message-container" });
    this.container.createVisualElement(this.messageSlot);
    registerDisposable(this, this.container);

    /** @type {Yp} Message text component [was: messageText] */
    this.messageText = new AdText(
      this.api, this.layoutId, this.interactionLoggingClientData, commandExecutor,
      "ytp-ad-message-text"
    );
    registerDisposable(this, this.messageText);
    this.messageText.createVisualElement(this.container.element);

    /** @type {g.QR} Fade transition [was: D] */
    this.fadeTransition = new FadeAnimationController(this.container, 400, false, 100, () => {
      this.hide();
    });
    registerDisposable(this, this.fadeTransition);
    this.hide();
  }

  init(componentType, renderer, macros) {
    super.init(componentType, renderer, macros);
    const durationMs = renderer.durationMs; // was: Q
    this.targetEndTimeMs =
      durationMs == null || durationMs === 0
        ? 0
        : durationMs + this.W.getProgressState().current * 1e3;

    let textData; // was: m
    if (renderer.text) {
      textData = renderer.text.templatedAdText;
    } else if (renderer.staticMessage) {
      textData = renderer.staticMessage;
    }
    this.messageText.init(generateScopedId("ad-text"), textData, macros);
    this.messageText.createVisualElement(this.container.element);
    this.fadeTransition.show(100);
    this.show();
  }

  clear() {
    this.hide();
  }

  hide() {
    bHy(this, false);
    super.hide();
    this.container.hide();
    this.messageText.hide();
    unsubscribeFromHost(this);
  }

  show() {
    bHy(this, true);
    super.show();
    subscribeToHost(this);
    this.container.show();
    this.messageText.show();
  }

  /** [was: K] */
  onAdEnd() {
    this.hide();
  }

  /**
   * Updates the countdown text on each progress tick.
   * [was: A]
   */
  onProgressUpdate() {
    if (this.W == null) return;
    const progressState = this.W.getProgressState(); // was: Q
    if (progressState == null || progressState.current == null) return;

    const currentMs = 1e3 * progressState.current; // was: Q (reused)
    if (!this.hasTimedOut && currentMs >= this.targetEndTimeMs) {
      this.fadeTransition.hide();
      this.hasTimedOut = true;
    } else if (this.messageText && this.messageText.isTemplated()) {
      const remaining = Math.max(0, Math.ceil((this.targetEndTimeMs - currentMs) / 1e3));
      if (remaining !== this.lastCountdownValue) {
        applyBackgroundImage(this.messageText, { TIME_REMAINING: String(remaining) });
        this.lastCountdownValue = remaining;
      }
    }
  }
}

/**
 * Instream ad player underlay companion — positioned beside the shrunken
 * video, showing image, headline, description, and CTA button.
 *
 * [was: XXK]
 */
export class InstreamAdPlayerUnderlay extends AdComponent {
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor) {
    super(api, {
      C: "div",
      Z: "ytp-ad-underlay-companion",
      V: [{
        C: "div",
        Z: "ytp-ad-underlay-side-container",
        V: [{
          C: "div", Z: "ytp-ad-underlay-image-container",
        }, {
          C: "div", Z: "ytp-ad-underlay-description-container",
        }, {
          C: "div", Z: "ytp-ad-underlay-headline-container",
        }, {
          C: "div", Z: "ytp-ad-underlay-action-button-container",
        }],
      }],
    }, "player-underlay", layoutId, interactionLoggingClientData, commandExecutor);

    this.actionButton = null;

    /** @type {Element} [was: jG] */
    this.imageContainer = this.z2("ytp-ad-underlay-image-container");
    /** @type {SkipRequestedTriggerMetadata} [was: A] */
    this.adImage = new SkipRequestedTriggerMetadata(
      this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
      "ytp-ad-underlay-image"
    );
    registerDisposable(this, this.adImage);
    this.adImage.createVisualElement(this.imageContainer);

    /** @type {Element} [was: T2] */
    this.headlineContainer = this.z2("ytp-ad-underlay-headline-container");
    /** @type {Yp} [was: O] */
    this.headlineText = new AdText(
      this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
      "ytp-ad-underlay-headline"
    );
    registerDisposable(this, this.headlineText);
    this.headlineText.createVisualElement(this.headlineContainer);

    /** @type {Element} [was: S] */
    this.descriptionContainer = this.z2("ytp-ad-underlay-description-container");
    /** @type {Yp} [was: j] */
    this.descriptionText = new AdText(
      this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
      "ytp-ad-underlay-description"
    );
    registerDisposable(this, this.descriptionText);
    this.descriptionText.createVisualElement(this.descriptionContainer);

    /** @type {Element} Action button container [was: J] */
    this.buttonContainer = this.z2("ytp-ad-underlay-action-button-container");
    /** @type {Element} Side container [was: W] */
    this.sideContainer = this.z2("ytp-ad-underlay-side-container");
    this.hide();
  }

  init(componentType, renderer, macros) {
    super.init(componentType, renderer, {});
    if (!renderer.image || !renderer.image.thumbnail) {
      reportErrorWithLevel(Error("InstreamAdPlayerUnderlayRenderer has no image."));
      return;
    }
    if (!renderer.headline) {
      reportErrorWithLevel(Error("InstreamAdPlayerUnderlayRenderer has no headline AdText."));
      return;
    }
    if (!renderer.description) {
      reportErrorWithLevel(Error("InstreamAdPlayerUnderlayRenderer has no description AdText."));
      return;
    }
    if (!renderer.actionButton || !getProperty(renderer.actionButton, Wq)) {
      reportErrorWithLevel(Error("InstreamAdPlayerUnderlayRenderer has no button."));
      return;
    }

    this.adImage.init(generateScopedId("ad-image"), renderer.image, macros);
    this.headlineText.init(generateScopedId("ad-text"), renderer.headline, macros);
    this.descriptionText.init(generateScopedId("ad-text"), renderer.description, macros);

    this.actionButton = new AdButton(
      this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
      ["ytp-ad-underlay-action-button"]
    );
    if (renderer.backgroundColor) {
      setStyle(this.element, "background-color", jpy(renderer.backgroundColor));
    }
    registerDisposable(this, this.actionButton);
    this.actionButton.createVisualElement(this.buttonContainer);
    this.actionButton.init(generateScopedId("button"), getProperty(renderer.actionButton, Wq), macros);

    const videoWidthFraction = getExperimentValue(this.api.G().experiments, "player_underlay_video_width_fraction");
    if (this.api.G().X("place_shrunken_video_on_left_of_player")) {
      removeClass(this.sideContainer, "ytp-ad-underlay-left-container");
      addClass(this.sideContainer, "ytp-ad-underlay-right-container");
      setStyle(this.sideContainer, "margin-left", `${Math.round((videoWidthFraction + 0.02) * 100)}%`);
    } else {
      removeClass(this.sideContainer, "ytp-ad-underlay-right-container");
      addClass(this.sideContainer, "ytp-ad-underlay-left-container");
    }
    setStyle(this.sideContainer, "width", `${Math.round((1 - videoWidthFraction - 0.04) * 100)}%`);

    if (this.api.Js()) this.show();
    this.api.addEventListener("playerUnderlayVisibilityChange", this.onVisibilityChange.bind(this));
    this.api.addEventListener("resize", this.onResize.bind(this));
  }

  show() {
    jE7(true);
    if (this.actionButton) this.actionButton.show();
    super.show();
  }

  hide() {
    jE7(false);
    if (this.actionButton) this.actionButton.hide();
    super.hide();
  }

  clear() {
    this.api.removeEventListener("playerUnderlayVisibilityChange", this.onVisibilityChange.bind(this));
    this.api.removeEventListener("resize", this.onResize.bind(this));
    this.hide();
  }

  onClick(event) { // was: Q
    super.onClick(event);
    if (this.actionButton && containsNode(this.actionButton.element, event.target)) {
      this.api.pauseVideo();
    }
  }

  /**
   * Handles underlay visibility transitions.
   * @param {string} state - "transitioning" | "visible" | "hidden" [was: Q]
   * @private [was: D]
   */
  onVisibilityChange(state) {
    if (state === "transitioning") {
      this.sideContainer.classList.remove("ytp-ad-underlay-clickable");
      this.show();
    } else if (state === "visible") {
      this.sideContainer.classList.add("ytp-ad-underlay-clickable");
    } else if (state === "hidden") {
      this.hide();
      this.sideContainer.classList.remove("ytp-ad-underlay-clickable");
    }
  }

  /**
   * Handles player resize — adjusts button sizing and headline font.
   * @param {{ width: number }} size [was: Q]
   * @private [was: K]
   */
  onResize(size) {
    if (size.width > 1200) {
      this.actionButton.element.classList.add("ytp-ad-underlay-action-button-large");
      this.actionButton.element.classList.remove("ytp-ad-underlay-action-button-medium");
    } else if (size.width > 875) {
      this.actionButton.element.classList.add("ytp-ad-underlay-action-button-medium");
      this.actionButton.element.classList.remove("ytp-ad-underlay-action-button-large");
    } else {
      this.actionButton.element.classList.remove("ytp-ad-underlay-action-button-large");
      this.actionButton.element.classList.remove("ytp-ad-underlay-action-button-medium");
    }
    setStyle(this.headlineText.element, "font-size", `${size.width / 40}px`);
  }
}
