/**
 * Ad Preview — preview rendering with image/text, preview-image component,
 * text templating for ad copy, ad avatar, headline, details, button rendering,
 * skip button configuration, and player overlay layout.
 *
 * Source: base.js lines 122965–124100
 * [was: gGZ, ZU, Ef, OsH, fJ4, vG4, aJv, KQx, GCW, $na, PI0, Aj_,
 *  lJW, uQi, hR1, rjn]
 */

import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { getProperty } from '../core/misc-helpers.js';  // was: g.l
import { reportErrorWithLevel, reportWarning } from '../data/gel-params.js';  // was: g.Zf, g.Ty
import { FadeAnimationController } from '../player/component-events.js';  // was: g.QR
import { pauseVideo } from '../player/player-events.js';  // was: g.pauseVideo
import { insertAtLayer, publishEvent } from './ad-click-tracking.js';  // was: g.f8, g.xt
import { ProgressAwareComponent } from '../player/component-events.js'; // was: pP
import { clearTimelyActionTimer } from '../player/video-loader.js'; // was: Dz
import { selectThumbnail } from '../network/uri-utils.js'; // was: s5
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { unsubscribeFromHost } from '../data/collection-utils.js'; // was: gK
import { subscribeToHost } from '../data/collection-utils.js'; // was: j_
import { AdComponent } from '../player/component-events.js'; // was: JU
import { setAriaLabel } from '../core/bitstream-helpers.js'; // was: mr
import { setRoleLink } from '../core/bitstream-helpers.js'; // was: c7
import { resolveIconType } from '../ui/svg-icons.js'; // was: F6
import { numberToHexColor } from '../modules/caption/caption-settings.js'; // was: vA
import { adAvatarViewModel } from '../core/misc-helpers.js'; // was: q_
import { adButtonViewModel } from '../core/misc-helpers.js'; // was: Dh
import { generateScopedId } from '../data/visual-element-tracking.js'; // was: c1
import { detectSeekEventTrust } from '../data/interaction-logging.js'; // was: vkO
import { adPreviewViewModel } from '../core/misc-helpers.js'; // was: UC7
import { skipAdButtonViewModel } from '../core/misc-helpers.js'; // was: XA_
import { skipAdViewModel } from '../core/misc-helpers.js'; // was: Aum
import { playerAdAvatarLockupViewModel } from '../core/misc-helpers.js'; // was: IGO
import { adBadgeViewModel } from '../core/misc-helpers.js'; // was: nK
import { adPodIndexViewModel } from '../core/misc-helpers.js'; // was: KPO
import { adHoverTextButtonRenderer } from '../core/misc-helpers.js'; // was: Ns
import { adDurationRemainingRenderer } from '../core/misc-helpers.js'; // was: CWy
import { visitAdvertiserLinkViewModel } from '../core/misc-helpers.js'; // was: VO0
import { adDisclosureBannerViewModel } from '../core/misc-helpers.js'; // was: mCX
import { isEmptyOrWhitespace, toString } from '../core/string-utils.js';
import { setTextContent } from '../core/dom-utils.js';
import { ContainerComponent } from '../player/container-component.js';
import { clear, remove } from '../core/array-utils.js';
import { onAdUxClicked } from '../player/player-api.js';
// TODO: resolve g.KK

// Stub: AdBadgeComponent [was: Xz] — ad badge with label + optional pod index (base.js ~71266).
// Extends AdComponent (JU), CSS class "ytp-ad-badge".  Not yet extracted to its own module.
const AdBadgeComponent = Xz; // was: Xz

/**
 * Ad preview text widget — shows a templated "Ad in X seconds" message
 * with an optional preview image, and auto-dismisses via fade transition.
 *
 * [was: gGZ]
 */
export class AdPreview extends ProgressAwareComponent {
  /**
   * @param {object} api [was: Q]
   * @param {string} layoutId [was: c]
   * @param {object} interactionLoggingClientData [was: W]
   * @param {object} commandExecutor [was: m]
   * @param {object} progressProvider [was: K]
   * @param {number} [fontVariant=0] - 0=default, 1=small font [was: T / UH]
   */
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor, progressProvider, fontVariant = 0) {
    super(api, {
      C: "div",
      Z: "ytp-preview-ad",
      V: [{ C: "div", Z: "ytp-preview-ad__text" }],
    }, "preview-ad", layoutId, interactionLoggingClientData, commandExecutor, progressProvider);

    this.fontVariant = fontVariant;       // was: UH
    this.durationMs = 0;                  // was: O
    this.lastCountdownValue = -1;         // was: T2

    /** @type {Element} Text element [was: j] */
    this.textElement = this.z2("ytp-preview-ad__text");

    switch (this.fontVariant) {
      case 1:
        this.textElement.classList.add("ytp-preview-ad__text--font--small");
        break;
    }

    /** @type {g.QR} Fade transition [was: transition] */
    this.transition = new FadeAnimationController(this, 400, false, 100, () => {
      this.hide();
    });
    registerDisposable(this, this.transition);
    this.hide();
  }

  /**
   * @param {object} componentType [was: Q]
   * @param {object} renderer [was: c]
   */
  init(componentType, renderer) {
    super.init(componentType, renderer, {});
    if (renderer.durationMilliseconds) {
      if (renderer.durationMilliseconds < 0) {
        reportErrorWithLevel(Error(`DurationMilliseconds was specified incorrectly in AdPreview with a value of: ${renderer.durationMilliseconds}`));
        return;
      }
      this.durationMs = renderer.durationMilliseconds;
    } else {
      this.durationMs = this.W.clearTimelyActionTimer(); // total ad duration from progress provider
    }

    if (!renderer.previewText?.text || isEmptyOrWhitespace(renderer.previewText.text)) {
      reportErrorWithLevel(Error("No text is returned for AdPreview."));
      return;
    }

    /** @type {{ text: string, isTemplated: boolean }} [was: jG] */
    this.previewTextData = renderer.previewText;
    if (!renderer.previewText.isTemplated) {
      setTextContent(this.textElement, renderer.previewText.text);
    }

    // Conditionally add preview image for Shorts/Rx content
    if (this.api.getVideoData({ playerType: 1 })?.Rx && renderer.previewImage) {
      const imageUrl = selectThumbnail(renderer.previewImage?.sources || [], 52, false)?.url || "";
      if (imageUrl && imageUrl.length) {
        /** @type {g.KK} [was: previewImage] */
        this.previewImage = new ContainerComponent({
          C: "img",
          Z: "ytp-preview-ad__image",
          N: { src: "{{imageUrl}}" },
        });
        this.previewImage.updateValue("imageUrl", imageUrl);
        registerDisposable(this, this.previewImage);
        this.previewImage.createVisualElement(this.element);
      } else {
        reportErrorWithLevel(Error("Failed to get imageUrl in AdPreview."));
      }
    } else {
      this.textElement.classList.add("ytp-preview-ad__text--padding--wide");
    }
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

  /** [was: K] */
  onAdEnd() {
    this.hide();
  }

  /**
   * Updates the countdown text on each progress tick.
   * [was: A]
   */
  onProgressUpdate() {
    if (!this.W) return;
    const progressState = this.W.getProgressState();
    if (!progressState?.current) return;

    const currentMs = 1e3 * progressState.current;
    if (currentMs >= this.durationMs) {
      this.onDurationReached(); // was: D
    } else if (this.previewTextData?.isTemplated) {
      const remaining = Math.max(0, Math.ceil((this.durationMs - currentMs) / 1e3));
      if (remaining !== this.lastCountdownValue) {
        const updatedText = this.previewTextData?.text?.replace("{TIME_REMAINING}", String(remaining));
        if (updatedText) setTextContent(this.textElement, updatedText);
        this.lastCountdownValue = remaining;
      }
    }
  }

  /** Triggers the fade-out when the preview duration is reached. [was: D] */
  onDurationReached() {
    this.transition.hide();
  }

  /** Triggers the fade-in and shows the preview. [was: J] */
  beginDisplay() {
    this.transition.show(100);
    this.show();
  }
}

/**
 * Ad avatar component — renders a circular or rounded-corner profile
 * image with configurable size classes (XXS through XL + responsive).
 *
 * [was: ZU]
 */
export class AdAvatar extends AdComponent {
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor) {
    super(api, {
      C: "img",
      Z: "ytp-ad-avatar",
    }, "ad-avatar", layoutId, interactionLoggingClientData, commandExecutor);
    this.hide();
  }

  /**
   * @param {object} componentType [was: Q]
   * @param {object} renderer - AdAvatarViewModel data [was: c]
   */
  init(componentType, renderer) {
    super.init(componentType, renderer, {});
    const imageUrl = selectThumbnail(renderer.image?.sources || [], YHX(renderer), true)?.url || "";
    if (!imageUrl || !imageUrl.length) {
      reportErrorWithLevel(Error("Failed to get imageUrl in AdAvatar."));
      return;
    }

    const imgElement = this.z2("ytp-ad-avatar");
    imgElement.src = imageUrl;

    const accessibilityLabel = renderer.interaction?.accessibility?.label;
    if (accessibilityLabel) {
      imgElement.alt = accessibilityLabel;
    }

    // Size classes
    switch (renderer.size) {
      case "AD_AVATAR_SIZE_XXS":
        this.element.classList.add("ytp-ad-avatar--size-xxs"); break;
      case "AD_AVATAR_SIZE_XS":
        this.element.classList.add("ytp-ad-avatar--size-xs"); break;
      case "AD_AVATAR_SIZE_S":
        this.element.classList.add("ytp-ad-avatar--size-s"); break;
      case "AD_AVATAR_SIZE_M":
        this.element.classList.add("ytp-ad-avatar--size-m"); break;
      case "AD_AVATAR_SIZE_L":
        this.element.classList.add("ytp-ad-avatar--size-l"); break;
      case "AD_AVATAR_SIZE_XL":
        this.element.classList.add("ytp-ad-avatar--size-xl"); break;
      case "AD_AVATAR_SIZE_RESPONSIVE":
        this.element.classList.add("ytp-ad-avatar--size-responsive"); break;
      default:
        this.element.classList.add("ytp-ad-avatar--size-m");
    }

    // Shape classes
    switch (renderer.style) {
      case "AD_AVATAR_STYLE_ROUNDED_CORNER":
        this.element.classList.add("ytp-ad-avatar--rounded-corner"); break;
      default:
        this.element.classList.add("ytp-ad-avatar--circular");
    }
  }

  clear() {
    this.hide();
  }

  onClick(event) {
    super.onClick(event);
  }
}

/**
 * Ad button (ViewModel-based) — renders a styled button with optional
 * icon and text, supporting multiple style and size variants.
 *
 * [was: Ef]
 */
export class AdButton extends AdComponent {
  /**
   * @param {object} api [was: Q]
   * @param {string} layoutId [was: c]
   * @param {object} interactionLoggingClientData [was: W]
   * @param {object} commandExecutor [was: m]
   * @param {boolean} [forceDarkTheme=false] [was: K]
   */
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor, forceDarkTheme = false) {
    super(api, {
      C: "button",
      Z: "ytp-ad-button-vm",
    }, "ad-button", layoutId, interactionLoggingClientData, commandExecutor);

    this.buttonText = null;  // was: buttonText
    this.buttonIcon = null;  // was: buttonIcon
    this.hide();
    this.forceDarkTheme = forceDarkTheme;
  }

  /**
   * @param {object} componentType [was: Q]
   * @param {object} renderer - AdButtonViewModel data [was: c]
   */
  init(componentType, renderer) {
    super.init(componentType, renderer, {});

    const labelContent = renderer.label?.content;
    const hasText = labelContent != null && !isEmptyOrWhitespace(labelContent);

    if (!hasText && !renderer.iconImage) {
      reportWarning(Error("AdButton does not have label or an icon."));
      return;
    }

    // Text span
    if (hasText) {
      this.buttonText = new ContainerComponent({
        C: "span",
        Z: "ytp-ad-button-vm__text",
        eG: labelContent,
      });
      registerDisposable(this, this.buttonText);
      this.buttonText.createVisualElement(this.element);
    }

    // Accessibility
    const a11yLabel = renderer.interaction?.accessibility?.label || (hasText ? labelContent : "");
    if (a11yLabel) {
      setAriaLabel(this.element, `${a11yLabel} This link opens in new tab`);
    }
    setRoleLink(this.element);

    // Icon
    if (renderer.iconImage) {
      let iconSpec; // was: W
      if (renderer.iconImage) {
        let clientResource; // was: K
        findIcon: {
          const iconData = renderer.iconImage;
          if (iconData.sources) {
            for (const source of iconData.sources) {
              if (
                source.clientResource?.imageName ||
                (source.customImageSource && getProperty(source.customImageSource, vXn)?.clientResource?.icon)
              ) {
                clientResource = source;
                break findIcon;
              }
            }
          }
          clientResource = undefined;
        }
        if (clientResource) {
          iconSpec = { iconType: clientResource.clientResource?.imageName };
        }
      }

      const iconElement = resolveIconType(iconSpec, false, false);
      if (iconElement != null) {
        this.buttonIcon = new ContainerComponent({
          C: "span",
          Z: "ytp-ad-button-vm__icon",
          V: [iconElement],
        });
        registerDisposable(this, this.buttonIcon);

        if (renderer.iconLeading) {
          Sz(this.element, this.buttonIcon.element, 0);
          this.buttonIcon.element.classList.add("ytp-ad-button-vm__icon--leading");
        } else if (hasText) {
          this.buttonIcon.createVisualElement(this.element);
          this.buttonIcon.element.classList.add("ytp-ad-button-vm__icon--trailing");
        } else {
          this.buttonIcon.createVisualElement(this.element);
          this.element.classList.add("ytp-ad-button-vm--icon-only");
        }
      }
    }

    // Style variants
    switch (renderer.style) {
      case "AD_BUTTON_STYLE_TRANSPARENT":
        this.element.classList.add("ytp-ad-button-vm--style-transparent"); break;
      case "AD_BUTTON_STYLE_FILLED_WHITE":
        this.element.classList.add("ytp-ad-button-vm--style-filled-white"); break;
      case "AD_BUTTON_STYLE_MONO_FILLED":
        this.element.classList.add("ytp-ad-button-vm--style-mono-filled"); break;
      case "AD_BUTTON_STYLE_FILLED":
        if (this.api.X("delhi_modern_web_player")) {
          this.element.classList.add("ytp-ad-button-vm--style-filled-white");
        } else {
          this.element.classList.add(
            this.forceDarkTheme
              ? "ytp-ad-button-vm--style-filled-dark"
              : "ytp-ad-button-vm--style-filled"
          );
        }
        break;
      default:
        this.element.classList.add("ytp-ad-button-vm--style-filled");
    }

    // Size variants
    switch (renderer.size) {
      case "AD_BUTTON_SIZE_COMPACT":
        this.element.classList.add("ytp-ad-button-vm--size-compact"); break;
      case "AD_BUTTON_SIZE_LARGE":
        this.element.classList.add("ytp-ad-button-vm--size-large"); break;
      default:
        this.element.classList.add("ytp-ad-button-vm--size-default");
    }
  }

  clear() {
    this.hide();
  }

  onClick(event) {
    super.onClick(event);
  }
}

/**
 * Player ad avatar lockup card — composites an avatar, headline,
 * description, and CTA button in a card that appears at a configurable
 * start time during ad playback.
 *
 * [was: OsH]
 */
export class PlayerAdAvatarLockupCard extends ProgressAwareComponent {
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor, progressProvider) {
    super(api, {
      C: "div",
      yC: ["ytp-ad-avatar-lockup-card--inactive", "ytp-ad-avatar-lockup-card"],
      V: [{
        C: "div",
        Z: "ytp-ad-avatar-lockup-card__avatar_and_text_container",
        V: [{
          C: "div",
          Z: "ytp-ad-avatar-lockup-card__text_container",
        }],
      }],
    }, "ad-avatar-lockup-card", layoutId, interactionLoggingClientData, commandExecutor, progressProvider);

    this.startMilliseconds = 0;

    this.adAvatar = new AdAvatar(this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor);
    registerDisposable(this, this.adAvatar);
    Sz(this.element, this.adAvatar.element, 0);

    this.headline = new RemoteSlotMetadata(this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor);
    registerDisposable(this, this.headline);
    this.headline.createVisualElement(this.z2("ytp-ad-avatar-lockup-card__text_container"));
    this.headline.element.classList.add("ytp-ad-avatar-lockup-card__headline");

    this.description = new RemoteSlotMetadata(this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor);
    registerDisposable(this, this.description);
    this.description.createVisualElement(this.z2("ytp-ad-avatar-lockup-card__text_container"));
    this.description.element.classList.add("ytp-ad-avatar-lockup-card__description");

    this.adButton = new AdButton(this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor);
    registerDisposable(this, this.adButton);
    this.adButton.createVisualElement(this.element);
    this.hide();
  }

  /**
   * @param {object} componentType [was: Q]
   * @param {object} renderer - PlayerAdAvatarLockupCardButtonedViewModel [was: c]
   */
  init(componentType, renderer) {
    super.init(componentType, renderer, {});

    const avatarData = getProperty(renderer.avatar, adAvatarViewModel);
    if (!avatarData) {
      reportErrorWithLevel(Error("No AdAvatarViewModel is returned in PlayerAdAvatarLockupCardButtonedViewModel."));
      return;
    }
    const headlineData = renderer.headline;
    if (!headlineData) {
      reportErrorWithLevel(Error("No headline is returned in PlayerAdAvatarLockupCardButtonedViewModel."));
      return;
    }
    const descriptionData = renderer.description;
    if (!descriptionData) {
      reportErrorWithLevel(Error("No description is returned in PlayerAdAvatarLockupCardButtonedViewModel."));
      return;
    }
    const buttonData = getProperty(renderer.button, adButtonViewModel);
    if (!buttonData) {
      reportErrorWithLevel(Error("No AdButtonViewModel is returned in PlayerAdAvatarLockupCardButtonedViewModel."));
      return;
    }

    this.adAvatar.init(generateScopedId("ad-avatar"), avatarData);
    this.headline.init(generateScopedId("ad-simple-attributed-string"), new MutedAutplayMetadata(headlineData));
    this.description.init(generateScopedId("ad-simple-attributed-string"), new MutedAutplayMetadata(descriptionData));
    if (headlineData.content && headlineData.content.length > 20) {
      this.description.element.classList.add("ytp-ad-avatar-lockup-card__description--hidden--in--small--player");
    }
    this.adButton.init(generateScopedId("ad-button"), buttonData);
    this.startMilliseconds = renderer.startMs || 0;

    if (!this.api.Js()) this.show();
    this.api.addEventListener("playerUnderlayVisibilityChange", this.onVisibilityChange.bind(this));
    subscribeToHost(this);
  }

  /**
   * Activates the card once playback progress reaches startMilliseconds.
   * [was: A]
   */
  onProgressUpdate() {
    if (!this.W) return;
    const progressState = this.W.getProgressState();
    if (progressState && progressState.current && 1e3 * progressState.current >= this.startMilliseconds) {
      unsubscribeFromHost(this);
      this.element.classList.remove("ytp-ad-avatar-lockup-card--inactive");
    }
  }

  /** [was: K] */
  onAdEnd() {
    this.clear();
  }

  onClick(event) {
    this.api.pauseVideo();
    super.onClick(event);
  }

  clear() {
    this.hide();
    this.api.removeEventListener("playerUnderlayVisibilityChange", this.onVisibilityChange.bind(this));
  }

  show() {
    this.adAvatar.show();
    this.headline.show();
    this.description.show();
    this.adButton.show();
    super.show();
  }

  hide() {
    this.adAvatar.hide();
    this.headline.hide();
    this.description.hide();
    this.adButton.hide();
    super.hide();
  }

  /** @private [was: O] */
  onVisibilityChange(state) {
    state === "hidden" ? this.show() : this.hide();
  }
}

/**
 * Skip ad button (ViewModel-based) — styled button with a "skip next"
 * icon, auto-hide timer, and optional tooltip for "skip to next" messaging.
 *
 * [was: fJ4]
 */
export class SkipAdButton extends AdComponent {
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor) {
    super(api, {
      C: "button",
      Z: "ytp-skip-ad-button",
      V: [{ C: "div", Z: "ytp-skip-ad-button__text" }],
    }, "skip-button", layoutId, interactionLoggingClientData, commandExecutor);

    this.hasTooltip = false;           // was: O
    this.buttonTextElement = this.z2("ytp-skip-ad-button__text"); // was: K

    this.transition = new FadeAnimationController(this, 500, false, 100, () => {
      this.hide();
    });
    registerDisposable(this, this.transition);

    this.autoHideTimer = new Wy(this.element, 15e3, 5e3, 0.5, 0.5, true); // was: W
    registerDisposable(this, this.autoHideTimer);
    this.hide();
  }

  /**
   * @param {object} componentType [was: Q]
   * @param {object} renderer - SkipAdButtonViewModel [was: c]
   */
  init(componentType, renderer) {
    super.init(componentType, renderer, {});
    if (!renderer.label || isEmptyOrWhitespace(renderer.label)) {
      reportErrorWithLevel(Error("No label is returned for SkipAdButton."));
      return;
    }

    setTextContent(this.buttonTextElement, renderer.label);
    const iconElement = resolveIconType(
      { iconType: "SKIP_NEXT_NEW" }, false, false,
      this.api.X("delhi_modern_web_player_icons")
    );
    if (iconElement == null) {
      reportErrorWithLevel(Error("Unable to retrieve icon for SkipAdButton"));
      return;
    }

    /** @type {g.KK} Icon wrapper [was: A] */
    this.iconWrapper = new ContainerComponent({
      C: "span",
      Z: "ytp-skip-ad-button__icon",
      V: [iconElement],
    });
    registerDisposable(this, this.iconWrapper);
    this.iconWrapper.createVisualElement(this.element);

    // Tooltip for "skip to next" messaging
    if (this.api.G().experiments.SG("enable_skip_to_next_messaging")) {
      const targetId = toString(renderer.targetId);
      if (targetId) {
        this.hasTooltip = true;
        this.element.setAttribute("data-tooltip-target-id", targetId);
        this.element.setAttribute("data-tooltip-target-fixed", "");
      }
    }
  }

  onClick(event) {
    if (event) event.preventDefault();
    const abnormalityScore = detectSeekEventTrust(event, {
      contentCpn: this.api.getVideoData({ playerType: 1 })?.clientPlaybackNonce ?? "",
    });
    if (abnormalityScore === 0) {
      publishEvent(this.api, "onAbnormalityDetected");
    } else {
      super.onClick(event);
      publishEvent(this.api, "onAdSkip");
      this.api.onAdUxClicked(this.componentType, this.layoutId);
    }
  }

  clear() {
    this.autoHideTimer.reset();
    this.hide();
  }

  hide() {
    super.hide();
  }

  show() {
    this.autoHideTimer.start();
    super.show();
    if (this.hasTooltip && this.api.G().experiments.SG("enable_skip_to_next_messaging")) {
      this.api.publish("showpromotooltip", this.element);
    }
  }

  /** Fades in and shows the button. [was: j] */
  fadeIn() {
    this.transition.show();
    this.show();
  }
}

/**
 * Skip ad container — wraps the preview and skip button, managing the
 * transition from "preview" state to "skippable" state based on
 * skipOffsetMilliseconds.
 *
 * [was: vG4]
 */
export class SkipAdContainer extends ProgressAwareComponent {
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor, progressProvider) {
    super(api, {
      C: "div",
      Z: "ytp-skip-ad",
    }, "skip-ad", layoutId, interactionLoggingClientData, commandExecutor, progressProvider);

    this.skipOffsetMilliseconds = 0;
    this.isSkippable = false;

    /** @type {SkipAdButton} [was: j] */
    this.skipButton = new SkipAdButton(this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor);
    registerDisposable(this, this.skipButton);
    this.skipButton.createVisualElement(this.element);
    this.hide();
  }

  /**
   * @param {object} componentType [was: Q]
   * @param {object} renderer - SkipAdViewModel [was: c]
   */
  init(componentType, renderer) {
    super.init(componentType, renderer, {});

    // Preskip preview state (DAI only)
    const preskipData = getProperty(renderer.preskipState, adPreviewViewModel);
    if (this.api.getVideoData()?.isDaiEnabled()) {
      if (!preskipData) {
        reportErrorWithLevel(Error("No AdPreviewViewModel is returned in SkipAdViewModel."));
        return;
      }
      /** @type {AdPreview} [was: O] */
      this.adPreview = new AdPreview(
        this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor, this.W
      );
      registerDisposable(this, this.adPreview);
      this.adPreview.createVisualElement(this.element);
      this.adPreview?.init(generateScopedId("preview-ad"), preskipData);
      this.adPreview?.beginDisplay();
    }

    // Skippable state
    const skippableData = getProperty(renderer.skippableState, skipAdButtonViewModel);
    if (!skippableData) {
      reportErrorWithLevel(Error("No SkipAdButtonViewModel is returned in SkipAdViewModel."));
      return;
    }
    if (renderer.skipOffsetMilliseconds != null) {
      this.skipOffsetMilliseconds = renderer.skipOffsetMilliseconds;
    } else {
      reportWarning(Error("No skipOffsetMilliseconds is returned in SkipAdViewModel."));
      this.skipOffsetMilliseconds = 5e3;
    }
    this.skipButton.init(generateScopedId("skip-button"), skippableData);
    this.show();
  }

  show() {
    subscribeToHost(this);
    super.show();
  }

  hide() {
    if (!this.isSkippable && this.adPreview) {
      this.adPreview.hide();
    } else if (this.skipButton) {
      this.skipButton.hide();
    }
    unsubscribeFromHost(this);
    super.hide();
  }

  clear() {
    this.adPreview?.clear();
    if (this.skipButton) this.skipButton.clear();
    unsubscribeFromHost(this);
    super.hide();
  }

  /** [was: K] */
  onAdEnd() {
    this.hide();
  }

  /**
   * Checks progress and transitions to skippable state when offset is reached.
   * [was: A]
   */
  onProgressUpdate() {
    if (1e3 * this.W.getProgressState().current >= this.skipOffsetMilliseconds && !this.isSkippable) {
      this.isSkippable = true;
      this.adPreview?.onDurationReached();
      this.skipButton?.fadeIn();
    }
  }
}

/**
 * Visit advertiser link — a styled text link that opens the advertiser's
 * page in a new tab.
 *
 * [was: aJv]
 */
export class VisitAdvertiserLink extends AdComponent {
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor) {
    super(api, {
      C: "div",
      Z: "ytp-visit-advertiser-link",
    }, "visit-advertiser-link", layoutId, interactionLoggingClientData, commandExecutor);
    this.hide();
  }

  init(componentType, renderer) {
    super.init(componentType, renderer, {});
    if (!renderer.label) {
      reportErrorWithLevel(Error("No label found in VisitAdvertiserLink."));
      return;
    }
    if (renderer.label?.content && !isEmptyOrWhitespace(renderer.label.content)) {
      this.linkText = new ContainerComponent({
        C: "span",
        Z: "ytp-visit-advertiser-link__text",
        eG: renderer.label.content,
      });
      registerDisposable(this, this.linkText);
      this.linkText.createVisualElement(this.element);
    }
    if (renderer.interaction?.accessibility?.label) {
      setAriaLabel(this.element, `${renderer.interaction.accessibility.label} This link opens in new tab`);
    } else if (renderer.label?.content && !isEmptyOrWhitespace(renderer.label.content)) {
      setAriaLabel(this.element, `${renderer.label.content} This link opens in new tab`);
    }
    setRoleLink(this.element);
    this.element.setAttribute("tabindex", "0");
    this.show();
  }

  onClick(event) {
    super.onClick(event);
    this.api.onAdUxClicked(this.componentType, this.layoutId);
  }

  clear() {
    this.hide();
  }
}

/**
 * Player overlay layout — composites ad badge, ad pod index, skip-or-preview,
 * ad info, duration remaining, visit advertiser link, ad disclosure banner,
 * player card, and autoplay countdown into the player overlay layer.
 *
 * [was: KQx]
 */
export class PlayerOverlayLayout extends AdComponent {
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor, progressProvider) {
    super(api, {
      C: "div",
      Z: "ytp-ad-player-overlay-layout",
      V: [{
        C: "div", Z: "ytp-ad-player-overlay-layout__player-card-container",
      }, {
        C: "div", Z: "ytp-ad-player-overlay-layout__ad-info-container",
      }, {
        C: "div", Z: "ytp-ad-player-overlay-layout__skip-or-preview-container",
      }, {
        C: "div", Z: "ytp-ad-player-overlay-layout__ad-disclosure-banner-container",
      }],
    }, "player-overlay-layout", layoutId, interactionLoggingClientData, commandExecutor);

    this.progressProvider = progressProvider; // was: O
    this.playerCardContainer = this.z2("ytp-ad-player-overlay-layout__player-card-container"); // was: S
    this.adInfoContainer = this.z2("ytp-ad-player-overlay-layout__ad-info-container");         // was: W
    this.skipOrPreviewContainer = this.z2("ytp-ad-player-overlay-layout__skip-or-preview-container"); // was: D
    this.disclosureBannerContainer = this.z2("ytp-ad-player-overlay-layout__ad-disclosure-banner-container"); // was: J
    this.hide();
  }

  /**
   * @param {object} componentType [was: Q]
   * @param {object} renderer [was: c]
   * @param {object} macros [was: W]
   * @param {object} extraConfig [was: m]
   */
  init(componentType, renderer, macros, extraConfig) {
    super.init(componentType, renderer, {});

    let skipOffsetMs; // was: K

    // Skip or preview
    if (renderer.skipOrPreview) {
      const skipOrPreviewData = renderer.skipOrPreview;
      const skipAdData = getProperty(skipOrPreviewData, skipAdViewModel);
      const previewData = getProperty(skipOrPreviewData, adPreviewViewModel);
      if (skipAdData) {
        this.skipAdContainer = new SkipAdContainer(
          this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor, this.progressProvider
        );
        registerDisposable(this, this.skipAdContainer);
        this.skipAdContainer.createVisualElement(this.skipOrPreviewContainer);
        this.skipAdContainer.init(generateScopedId("skip-ad"), skipAdData);
      } else if (previewData && this.api.getVideoData()?.isDaiEnabled()) {
        this.adPreview = new AdPreview(
          this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
          this.progressProvider, 1
        );
        registerDisposable(this, this.adPreview);
        this.adPreview.createVisualElement(this.skipOrPreviewContainer);
        this.adPreview.init(generateScopedId("ad-preview"), previewData);
        this.adPreview.beginDisplay();
      }
      const resolvedSkipAd = getProperty(renderer.skipOrPreview, skipAdViewModel);
      if (resolvedSkipAd) {
        skipOffsetMs = resolvedSkipAd.skipOffsetMilliseconds;
      }
    }

    // Player card (avatar lockup)
    if (renderer.playerAdCard) {
      const cardData = getProperty(renderer.playerAdCard, playerAdAvatarLockupViewModel);
      if (cardData) {
        this.playerAdCard = new PlayerAdAvatarLockupCard(
          this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor, this.progressProvider
        );
        registerDisposable(this, this.playerAdCard);
        this.playerAdCard.createVisualElement(this.playerCardContainer);
        this.playerAdCard.init(generateScopedId("ad-avatar-lockup-card"), cardData);
      }
    }

    // Ad badge
    if (renderer.adBadgeRenderer) {
      const badgeData = getProperty(renderer.adBadgeRenderer, adBadgeViewModel);
      if (badgeData) {
        this.adBadge = new AdBadgeComponent(this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor, true); // was: new Xz()
        registerDisposable(this, this.adBadge);
        this.adBadge.createVisualElement(this.adInfoContainer);
        this.adBadge.init(generateScopedId("ad-badge"), badgeData);
      } else {
        reportErrorWithLevel(Error("AdBadgeViewModel is not found in player overlay layout."));
      }
    }

    // Ad pod index
    if (renderer.adPodIndex) {
      const podData = getProperty(renderer.adPodIndex, adPodIndexViewModel);
      if (podData) {
        this.adPodIndex = new fnn(this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor);
        registerDisposable(this, this.adPodIndex);
        this.adPodIndex.createVisualElement(this.adInfoContainer);
        this.adPodIndex.init(generateScopedId("ad-pod-index"), podData);
      }
    }

    // Ad info button
    if (renderer.adInfoRenderer) {
      const infoData = getProperty(renderer.adInfoRenderer, adHoverTextButtonRenderer);
      if (infoData) {
        this.adInfoButton = new rS(
          this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
          this.element, undefined, true
        );
        registerDisposable(this, this.adInfoButton);
        if (this.adBadge !== undefined) {
          this.adInfoContainer.insertBefore(this.adInfoButton.element, this.adBadge.element.nextSibling);
        } else {
          this.adInfoButton.createVisualElement(this.adInfoContainer);
        }
        this.adInfoButton.init(generateScopedId("ad-info-hover-text-button"), infoData, this.macros);
      } else {
        reportWarning(Error("AdInfoRenderer is not found in player overlay layout."));
      }
    }

    // Ad duration remaining (DAI only)
    const isDai = this.api.getVideoData()?.isDaiEnabled();
    if (renderer.adDurationRemaining && isDai) {
      const durationData = getProperty(renderer.adDurationRemaining, adDurationRemainingRenderer);
      if (durationData) {
        this.adDurationRemaining = new rb(
          this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor,
          this.progressProvider, extraConfig.videoAdDurationSeconds, true
        );
        registerDisposable(this, this.adDurationRemaining);
        if (this.adPodIndex !== undefined) {
          this.adInfoContainer.insertBefore(this.adDurationRemaining.element, this.adPodIndex.element.nextSibling);
        } else {
          this.adDurationRemaining.createVisualElement(this.adInfoContainer);
        }
        this.adDurationRemaining.init(generateScopedId("ad-duration-remaining"), durationData, this.macros);
        this.adDurationRemaining.element.classList.add("ytp-ad-duration-remaining-autohide");
      }
    }

    // Visit advertiser link
    if (renderer.visitAdvertiserLink) {
      const linkData = getProperty(renderer.visitAdvertiserLink, visitAdvertiserLinkViewModel);
      if (linkData) {
        this.visitAdvertiserLink = new VisitAdvertiserLink(
          this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor
        );
        registerDisposable(this, this.visitAdvertiserLink);
        this.visitAdvertiserLink.createVisualElement(this.adInfoContainer);
        this.visitAdvertiserLink.init(generateScopedId("visit-advertiser-link"), linkData);
      }
    }

    // Ad disclosure banner
    if (renderer.adDisclosureBanner) {
      const bannerData = getProperty(renderer.adDisclosureBanner, adDisclosureBannerViewModel);
      if (bannerData) {
        this.adDisclosureBanner = new veX(
          this.api, this.layoutId, this.interactionLoggingClientData, this.numberToHexColor
        );
        registerDisposable(this, this.adDisclosureBanner);
        this.adDisclosureBanner.createVisualElement(this.disclosureBannerContainer);
        this.adDisclosureBanner.init(generateScopedId("ad-disclosure-banner"), bannerData);
      }
    }

    // Autoplay countdown overlay
    this.autoplayCountdown = new BX(this.api, this.progressProvider, skipOffsetMs, true); // was: K
    registerDisposable(this, this.autoplayCountdown);
    insertAtLayer(this.api, this.autoplayCountdown.element, 4);

    this.show();
  }

  clear() {
    this.hide();
  }
}
