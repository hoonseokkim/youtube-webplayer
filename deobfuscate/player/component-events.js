import { executeCommand } from '../ads/ad-scheduling.js';
import { clear, map } from '../core/array-utils.js';
import { ThrottleTimer } from '../core/bitstream-helpers.js';
import { EventHandler } from '../core/event-handler.js';
import { registerDisposable } from '../core/event-system.js';
import { getProperty } from '../core/misc-helpers.js';
import { bind } from '../core/type-helpers.js';
import { getThumbnailUrl } from '../data/collection-utils.js';
import { reportErrorWithLevel, reportWarning } from '../data/gel-params.js';
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { hasCaptionTracks } from '../ui/seek-bar-tail.js'; // was: OC
import { disposeApp } from './player-events.js'; // was: WA
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { ContainerComponent } from './container-component.js';
import { addClass, setTextContent } from '../core/dom-utils.js';
import { logClick } from '../data/visual-element-tracking.js';
import { PlayerError } from '../ui/cue-manager.js';
import { concat, remove } from '../core/array-utils.js';
import { isEmptyOrWhitespace, toString } from '../core/string-utils.js';
import { onAdUxClicked } from './player-api.js';
import { dispose } from '../ads/dai-cue-range.js';
import { Disposable } from '../core/disposable.js';
import { ObservableTarget } from '../core/event-target.js';
import { Timer } from '../core/timer.js';
// TODO: resolve g.o_

/**
 * component-events.js -- Ad component base classes, event handling, message
 * dispatch, UI elements (buttons, toggles, dialogs, text, images, badges),
 * ad preview/skip controls, player overlay composition, and progress tracking.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines 69601-69930, 70056-70999
 *   (skips 69544-69600 covered in base-component.js,
 *    skips 69931-70055 covered in toggle-button)
 *
 * Provides:
 *  - Ad component base class (JU) with click/touch handling, server VE,
 *    visibility logging, and command execution
 *  - Ad button renderer (wK) with text/icon/style support
 *  - Resize observer wrapper (BM3) for ad component layout
 *  - Ad hover-text button (Eey) with callout tooltip
 *  - Ad image component (RB) with background-image mode
 *  - Confirm dialog (stw) with cancel/confirm/close overlay
 *  - Ad update action wrapper (Uzw) for UX updates
 *  - Ad update listener (ddm) for component state changes
 *  - Ad feedback dialog (ZXK) with radio-button reasons
 *  - Feedback reason option (SWK) with radio input
 *  - Ad mute confirm dialog (sSO) extending confirm dialog
 *  - Ad info dialog (OXx) with ad reasons, mute button, feedback
 *  - Ad info hover-text button (rS) with dialog launcher
 *  - Ad text component (Yp) with template support
 *  - Default progress state constant (L2_)
 *  - Progress-aware component base (pP) extending JU
 *  - Fade-animation controller (FadeAnimationController) with show/hide state machine
 *  - Ad preview slot (cy) with countdown and thumbnail
 *  - Flyout CTA (wg_) with icon, headline, description, action button
 *  - Instream user sentiment (bxm) with like/dislike toggles
 *  - Element opacity animator (Wy) with mouse-hover pause
 *  - Player state change descriptor (mV, G9O, PlayerStateChange)
 *  - Skip button (jtX) with icon, text, abnormality detection
 *  - Skip-ad compound component (Aj) with preskip + skip button
 *  - Visit-advertiser button (geK)
 *  - Simple ad badge (KS) with separator dot
 *  - Player overlay descriptor (To)
 *  - Ad playback progress tracker (Vd) tied to player events
 *  - Timer-based progress tracker (o5) with 100ms tick
 *  - Ad duration remaining display (rb) with templated countdown
 *  - Ad title display (Ox7)
 *  - Attributed-string components (UX, I5)
 *  - Ad badge (Xz) with label + pod index
 *  - Ad pod index display (fnn)
 *  - Ad disclosure banner (veX) with chevron and a11y
 *  - Ad progress bar value helper (qc)
 *  - Persistent progress bar (BX)
 *  - Full player overlay (m_y) composing skip, badge, info, CTA, etc.
 *
 * @module player/component-events
 */

// ============================================================================
// Ad Component Base Class  (line 69566)
// ============================================================================

/**
 * Base class for all ad UI components. Manages click/touch event routing,
 * server-side visual-element creation, visibility logging, macro
 * substitution, and command execution through the layout system.
 *
 * [was: JU]
 */
export class AdComponent extends ContainerComponent { // was: JU
  constructor(api, elementSpec, componentType, layoutId, interactionLoggingClientData, commandExecutor, cssClass = null) {
    // was: Q, c, W, m, K, T, r=null
    super(elementSpec);
    this.api = api;
    this.macros = {};
    this.componentType = componentType;
    this.trackingParams = null; // was: this.Y = null
    this.loggingDirectives = null; // was: this.L = null
    this.cssClass = cssClass; // was: this.Re = r
    this.layoutId = layoutId;
    this.interactionLoggingClientData = interactionLoggingClientData;
    this.commandExecutor = commandExecutor; // was: this.vA = T
    this.componentId = null; // was: this.HA = null
    this.domContainer = new DomContainerWrapper(this.element); // was: this.IP = new lu(this.element)
    registerDisposable(this, this.domContainer);
    this.clickListenerKey = this.B(this.element, "click", this.onClick); // was: this.Y0
    this.touchListeners = []; // was: this.Ka = []
    this.touchTapHandler = new TouchTapHandler(this.onClick, this); // was: this.MM = new Npn(...)
    registerDisposable(this, this.touchTapHandler);
    this.firstVisibleFired = false; // was: this.WB = !1
    this.adRendererCommands = null; // was: this.b0 = null
    this.interaction = null; // was: this.PA = null
  }

  bind(descriptor) { // was: Q
    this.componentId || (descriptor.renderer && this.init(descriptor.id, descriptor.renderer, {}, descriptor));
    return Promise.resolve();
  }

  init(id, renderer, macroOverrides) { // was: Q, c, W
    this.componentId = id; // was: this.HA = Q
    this.element.setAttribute("id", this.componentId);
    this.cssClass && addClass(this.element, this.cssClass); // was: this.Re
    this.adRendererCommands = renderer && renderer.adRendererCommands; // was: this.b0
    this.interaction = renderer.interaction; // was: this.PA
    this.interaction?.onTap && addClass(this.element, "ytp-ad-component--clickable");
    this.macros = macroOverrides;
    this.trackingParams = renderer.trackingParams || null; // was: this.Y
    this.loggingDirectives = getProperty(renderer.rendererContext, loggingDirectivesKey)?.loggingDirectives ?? renderer.loggingDirectives; // was: this.L
    if (this.trackingParams != null) {
      this.createServerVe(this.element, this.trackingParams);
    } else if (this.loggingDirectives) {
      this.api.createServerVe(this.element, this, true); // was: !0
      this.api.setTrackingParams(this.element, this.loggingDirectives.trackingParams || null);
    }
  }

  clear() {}

  hide() {
    super.hide();
    (this.trackingParams != null || this.loggingDirectives) && this.logVisibility(this.element, false); // was: !1
  }

  show() {
    super.show();
    if (!this.firstVisibleFired) { // was: this.WB
      this.firstVisibleFired = true; // was: !0
      const impressionCmd = this.adRendererCommands && this.adRendererCommands.impressionCommand;
      const onFirstVisible = this.interaction?.onFirstVisible;
      if (impressionCmd) {
        this.executeCommand(impressionCmd); // was: this.Ie(Q)
      } else if (onFirstVisible) {
        const cmd = extractCommand(onFirstVisible); // was: gn(c)
        cmd && this.executeCommand(cmd);
      }
    }
    (this.trackingParams != null || this.loggingDirectives) && this.logVisibility(this.element, true); // was: !0
  }

  onClick(event) { // was: Q
    if ((this.trackingParams || this.loggingDirectives) && !clickDedupeSet.has(event)) { // was: Zxn
      const createDatabaseDefinition = this.element;
      this.api.hasVe(createDatabaseDefinition) && this.hasCaptionTracks && this.api.logClick(createDatabaseDefinition, this.interactionLoggingClientData);
      clickDedupeSet.add(event);
    }
    let clickCmd = this.adRendererCommands && this.adRendererCommands.clickCommand;
    const onTap = this.interaction?.onTap;
    if (clickCmd) {
      const processedCmd = this.processClickCommand(clickCmd); // was: this.EC(W)
      this.executeCommand(processedCmd);
    } else {
      let shouldHandle = onTap;
      if (shouldHandle) {
        const target = this.element;
        const path = event.composedPath();
        for (const node of path) { // was: m
          if (node === target) break;
          if (node.className.indexOf("ytp-ad-component--clickable") >= 0) {
            shouldHandle = false; // was: !1
            break;
          }
        }
      }
      if (shouldHandle) {
        const cmd = extractCommand(onTap); // was: gn(c)
        cmd && this.executeCommand(cmd);
      }
    }
  }

  /**
   * Hook for subclasses to transform click commands (e.g. strip ad-lifecycle).
   * [was: EC]
   */
  processClickCommand(command) { // was: Q
    return command;
  }

  onTouchStart(event) { this.touchTapHandler.onTouchStart(event); }
  onTouchMove(event) { this.touchTapHandler.onTouchMove(event); }
  onTouchEnd(event) { if (this.touchTapHandler) this.touchTapHandler.onTouchEnd(event); }

  /**
   * Execute a command via the layout's command executor.
   * [was: Ie]
   */
  executeCommand(command) { // was: Q
    if (this.layoutId) {
      this.commandExecutor.executeCommand(command, this.layoutId); // was: this.vA.executeCommand(Q, this.layoutId)
    } else {
      const error = new PlayerError("There is undefined layoutId when calling the runCommand method.", {
        componentType: this.componentType
      });
      reportErrorWithLevel(error);
    }
  }

  createServerVe(element, trackingParams) { // was: Q, c
    this.api.createServerVe(element, this);
    this.api.setTrackingParams(element, trackingParams);
  }

  logVisibility(element, isVisible) { // was: Q, c
    this.api.hasVe(element) && this.api.logVisibility(element, isVisible, this.interactionLoggingClientData);
  }

  disposeApp() {
    this.clear(null);
    this.Xd(this.clickListenerKey); // was: this.Y0
    for (const key of this.touchListeners) // was: this.Ka
      this.Xd(key);
    super.disposeApp();
  }
}

// ============================================================================
// Ad Button Renderer  (line 69685)
// ============================================================================

/**
 * Renders an ad button with optional text and icon. Supports link-style
 * and default styles, click tracking, and icon-before-text layout.
 *
 * [was: wK]
 */
export class AdButton extends AdComponent { // was: wK
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor, extraClasses = [], componentType = "button", iconBeforeText = false, tabindex, cleanPlayer = false) {
    // was: Q, c, W, m, K=[], T="button", r=!1, U, I=!1
    const spec = {
      C: "button",
      yC: ["ytp-ad-button"].concat(extraClasses)
    };
    if (tabindex != null) {
      spec.N = { tabindex };
    }
    super(api, spec, componentType, layoutId, interactionLoggingClientData, commandExecutor);
    this.textElement = null; // was: this.A = null
    this.iconElement = null; // was: this.O = null
    this.rendererData = null; // was: this.W = null
    this.iconBeforeText = iconBeforeText; // was: this.K = r
    this.isCleanPlayer = cleanPlayer; // was: this.j = I
    this.hide();
  }

  init(id, renderer, macros) { // was: Q, c, W
    super.init(id, renderer, macros);
    this.rendererData = renderer; // was: this.W = c

    if (renderer.text == null && renderer.icon == null) {
      reportWarning(Error("ButtonRenderer createSha1 not have text or an icon set."));
      return;
    }

    let styleClass = null;
    switch (renderer.style || null) {
      case "STYLE_UNKNOWN":
        styleClass = "ytp-ad-button-link";
        break;
      default:
        styleClass = null;
    }
    styleClass != null && addClass(this.element, styleClass);

    if (renderer.text != null) {
      const text = logQoeEvent(renderer.text); // was: Q
      if (!isEmptyOrWhitespace(text)) {
        this.element.setAttribute("aria-label", text);
        this.textElement = new ContainerComponent({
          C: "span",
          Z: "ytp-ad-button-text",
          eG: text
        });
        registerDisposable(this, this.textElement);
        this.textElement.createVisualElement(this.element);
      }
    }

    if (renderer.accessibilityData?.accessibilityData?.label && !isEmptyOrWhitespace(renderer.accessibilityData.accessibilityData.label)) {
      this.element.setAttribute("aria-label", renderer.accessibilityData.accessibilityData.label);
    }

    if (renderer.icon != null) {
      const iconSpec = createIconElement(renderer.icon, this.isCleanPlayer); // was: F6(c.icon, this.j)
      if (iconSpec != null) {
        this.iconElement = new ContainerComponent({
          C: "span",
          Z: "ytp-ad-button-icon",
          V: [iconSpec]
        });
        registerDisposable(this, this.iconElement);
        this.iconBeforeText
          ? insertAtIndex(this.element, this.iconElement.element, 0) // was: Sz(...)
          : this.iconElement.createVisualElement(this.element);
      }
    }
  }

  clear() { this.hide(); }

  onClick(event) {
    super.onClick(event);
    for (const cmd of getButtonCommands(this)) // was: Vq_(this)
      this.layoutId
        ? this.commandExecutor.executeCommand(cmd, this.layoutId)
        : reportErrorWithLevel(Error("Missing layoutId for button."));
    this.api.onAdUxClicked(this.componentType, this.layoutId);
  }
}

// ============================================================================
// Ad Text Component  (line 70374)
// ============================================================================

/**
 * Renders ad text with optional template interpolation, background images,
 * font-size overrides, and tooltip target binding.
 *
 * [was: Yp]
 */
export class AdText extends AdComponent { // was: Yp
  constructor(api, layoutId, interactionLoggingClientData, commandExecutor, cssClass = null, componentType = "ad-text") {
    // was: Q, c, W, m, K=null, T="ad-text"
    super(api, { C: "div", Z: "ytp-ad-text" }, componentType, layoutId, interactionLoggingClientData, commandExecutor, cssClass);
    this.rendererData = null; // was: this.W = null
    this.hide();
  }

  init(id, renderer, macros) { // was: Q, c, W
    super.init(id, renderer, macros);
    this.rendererData = renderer;
    this.isTemplated() || setTextContent(this.element, getAdText(this.rendererData)); // was: oH(...)

    if (renderer.backgroundImage) {
      const thumbnailUrl = (renderer.backgroundImage.thumbnail) ? getThumbnailUrl(renderer.backgroundImage.thumbnail) : ""; // was: dK(Q)
      const videoData = this.api.getVideoData({ playerType: 1 });
      const isVertical = videoData && videoData.Rx;
      if (thumbnailUrl && isVertical) {
        this.element.style.backgroundImage = `url(${thumbnailUrl})`;
        this.element.style.backgroundSize = "100%";
      }
      if (renderer.style?.adTextStyle) {
        switch (renderer.style.adTextStyle.fontSize) {
          case "AD_FONT_SIZE_MEDIUM":
            this.element.style.fontSize = "26px";
            break;
        }
      }
    }

    const targetId = toString(renderer.targetId);
    targetId && this.element.setAttribute("data-tooltip-target-id", targetId);
    renderer?.adRendererCommands?.clickCommand
      ? this.element.classList.add("ytp-ad-clickable-element")
      : this.element.classList.remove("ytp-ad-clickable-element");
    this.show();
  }

  isTemplated() {
    return this.rendererData.isTemplated || false; // was: !1
  }

  clear() { this.hide(); }
}

// ============================================================================
// Progress-Aware Component Base  (line 70415)
// ============================================================================

/**
 * Default progress state (start=0, end=1, current=0).
 * [was: L2_]
 */
export const DEFAULT_PROGRESS_STATE = { // was: L2_
  seekableStart: 0,
  seekableEnd: 1,
  current: 0
};

/**
 * Base for components that need to track playback progress (preview,
 * skip-button, duration-remaining, etc.).
 *
 * [was: pP]
 */
export class ProgressAwareComponent extends AdComponent { // was: pP
  constructor(api, elementSpec, componentType, layoutId, interactionLoggingClientData, commandExecutor, progressSource) {
    // was: Q, c, W, m, K, T, r
    super(api, elementSpec, componentType, layoutId, interactionLoggingClientData, commandExecutor);
    this.progressSource = progressSource; // was: this.W = r
    registerDisposable(this, this.progressSource);
    this.lastProgressMs = -1; // was: this.XI
    this.lastState = -1; // was: this.S = -1
  }

  clear() {
    this.dispose();
  }
}

// ============================================================================
// Fade Animation Controller  (line 70427)
// ============================================================================

/**
 * State machine that animates an element through show -> fade-in ->
 * visible -> fade-out -> hidden transitions, with configurable delays.
 *
 * [was: FadeAnimationController]
 */
export class FadeAnimationController extends Disposable { // was: g.QR
  constructor(element, showDuration, startVisible, hideDuration, onHidden, onShown) {
    // was: Q, c, W, m, K, T
    super();
    this.element = element;
    this.state = null;
    if (!startVisible) element.hide();
    this.showDurationMs = showDuration; // was: this.A = c
    this.hideDurationMs = hideDuration === undefined ? showDuration : hideDuration; // was: this.j
    this.onShownCallback = onShown; // was: this.O = T
    this.onHidden = onHidden;
    this.delay = new ThrottleTimer(this.tick, 0, this); // was: this.W
    registerDisposable(this, this.delay);
  }

  show(initialDelay) { // was: Q
    if (this.state === 1 || this.state === 2) return;
    if (this.state === 4) this.tick();
    if (this.state === 5) {
      this.element.show();
      this.state = null;
      this.delay.stop();
      this.onShownCallback && this.onShownCallback();
    } else if (!this.element.hasCaptionTracks) {
      setAriaHidden(this, true); // was: O8(this, !0)
      this.state = 1;
      initialDelay ? this.delay.start(initialDelay) : this.tick();
    }
  }

  hide() {
    if (this.state === 4) return;
    if (this.state === 1 || this.state === 2) {
      this.element.hide();
      this.state = null;
      this.delay.stop();
    } else if (this.element.hasCaptionTracks) {
      setAriaHidden(this, true); // was: O8(this, !0)
      this.state = 4;
      this.delay.start(this.hideDurationMs);
    }
  }

  /**
   * Internal tick handler driving the state machine.
   * [was: W]
   */
  tick() {
    switch (this.state) {
      case 1:
        this.element.show();
        this.state = 2;
        this.delay.start(10);
        break;
      case 2:
        setAriaHidden(this, false); // was: O8(this, !1)
        this.state = 3;
        this.delay.start(this.showDurationMs);
        break;
      case 3:
        this.state = null;
        this.onShownCallback && this.onShownCallback();
        break;
      case 4:
        this.element.hide();
        setAriaHidden(this, false);
        this.state = 5;
        this.delay.start(0);
        break;
      case 5:
        this.state = null;
        if (this.onHidden) this.onHidden();
        break;
    }
  }

  stop() {
    while (this.state !== null && this.state !== 5) {
      this.delay.stop();
      this.tick();
    }
  }

  disposeApp() {
    this.element.u0() || this.element.element.removeAttribute("aria-hidden");
    super.disposeApp();
  }
}

// ============================================================================
// Player State Change Descriptor  (line 70814)
// ============================================================================

/**
 * Maps abbreviated state-flag identifiers to their bit offsets.
 * [was: mV, G9O]
 */
export class StateFlag { // was: mV
  constructor(abbreviation, bitOffset) { // was: Q, c
    this.abbreviation = abbreviation; // was: this.O = Q
    this.bitOffset = bitOffset; // was: this.W = c
  }
}

export const STATE_FLAGS = [ // was: G9O
  new StateFlag("b.f_", 0),  new StateFlag("j.s_", 2),
  new StateFlag("r.s_", 4),  new StateFlag("e.h_", 6),
  new StateFlag("i.s_", 8),  new StateFlag("s.t_", 10),
  new StateFlag("p.h_", 12), new StateFlag("s.i_", 14),
  new StateFlag("f.i_", 16), new StateFlag("a.b_", 18),
  new StateFlag("a.o_"),     new StateFlag("g.o_", 22),
  new StateFlag("p.i_", 24), new StateFlag("p.m_"),
  new StateFlag("n.k_", 20), new StateFlag("i.f_"),
  new StateFlag("a.s_"),     new StateFlag("m.c_"),
  new StateFlag("n.h_", 26), new StateFlag("o.p_"),
  new StateFlag("m.p_", 28), new StateFlag("o.a_"),
  new StateFlag("d.p_"),     new StateFlag("e.i_")
].reduce((map, flag) => {
  map[flag.abbreviation] = flag;
  return map;
}, {});

/**
 * Represents a player state transition, carrying both the current and
 * previous state for comparison.
 *
 * [was: PlayerStateChange]
 */
export class PlayerStateChange { // was: g.tS
  constructor(state, oldState) {
    this.state = state;
    this.oldState = oldState;
  }

  /**
   * Returns whether a particular flag bit is set in the new state.
   * [was: Fq]
   */
  hasFlag(flagBit) { // was: Q
    return computeStateDelta(this, flagBit) > 0; // was: aH(this, Q) > 0
  }
}

// ============================================================================
// Ad Playback Progress Tracker  (line 71082)
// ============================================================================

/**
 * Tracks ad playback progress by listening to the player's
 * `onAdPlaybackProgress` events and publishing progress/completion signals.
 *
 * [was: Vd]
 */
export class AdPlaybackProgressTracker extends ObservableTarget { // was: Vd
  constructor(api, durationMs) { // was: Q, c
    super();
    this.api = api;
    this.durationMs = durationMs;
    this.progressListenerKey = null; // was: this.W = null
    this.handler = new EventHandler(this); // was: new aB(this)
    registerDisposable(this, this.handler);
    this.progressState = DEFAULT_PROGRESS_STATE; // was: this.O = L2_
    this.handler.B(this.api, "presentingplayerstatechange", this.onStateChange); // was: this.A
    this.progressListenerKey = this.handler.B(this.api, "onAdPlaybackProgress", this.onProgress); // was: this.kx
  }

  getDurationMs() { return this.durationMs; } // was: Dz

  stop() {
    this.progressListenerKey && this.handler.Xd(this.progressListenerKey);
  }

  /** [was: kx] */
  onProgress(progressData) { // was: Q
    this.progressState = {
      seekableStart: 0,
      seekableEnd: this.durationMs / 1000,
      current: progressData.current
    };
    this.publish("h");
  }

  getProgressState() {
    return this.progressState;
  }

  /** [was: A] */
  onStateChange(stateChange) { // was: Q
    stateChange.hasFlag(2) && this.publish("g");
  }
}

// ============================================================================
// Timer-Based Progress Tracker  (line 71116)
// ============================================================================

/**
 * Self-running progress tracker that ticks every 100ms without relying on
 * player events. Used for non-video ad layouts (e.g. image companions).
 *
 * [was: o5]
 */
export class TimerProgressTracker extends ObservableTarget { // was: o5
  constructor(durationMs) { // was: Q
    super();
    this.isRunning = false; // was: this.W = !1
    this.elapsedMs = 0; // was: this.K2 = 0
    this.handler = new EventHandler(this); // was: new aB(this)
    registerDisposable(this, this.handler);
    this.durationMs = durationMs; // was: Q
    this.timer = new Timer(100);
    registerDisposable(this, this.timer);
    this.handler.B(this.timer, "tick", this.onTick); // was: this.kx
    this.progressState = { // was: this.O
      seekableStart: 0,
      seekableEnd: durationMs / 1000,
      current: 0
    };
    this.start();
  }

  getDurationMs() { return this.durationMs; } // was: Dz

  start() {
    if (!this.isRunning) {
      this.isRunning = true; // was: !0
      this.timer.start();
    }
  }

  stop() {
    if (this.isRunning) {
      this.isRunning = false; // was: !1
      this.timer.stop();
    }
  }

  /** [was: kx] */
  onTick() {
    this.elapsedMs += 100;
    let isComplete = false; // was: Q = !1
    if (this.elapsedMs > this.durationMs) {
      this.elapsedMs = this.durationMs;
      this.timer.stop();
      isComplete = true; // was: !0
    }
    this.progressState = {
      seekableStart: 0,
      seekableEnd: this.durationMs / 1000,
      current: this.elapsedMs / 1000
    };
    this.publish("h");
    isComplete && this.publish("g");
  }

  getProgressState() {
    return this.progressState;
  }
}
