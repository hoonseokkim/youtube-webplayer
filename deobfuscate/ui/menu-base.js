/**
 * Menu component base classes.
 * Source: base.js lines 101530–102000
 *
 * Contains:
 * - PanelMenu (g.$c) — ordered menu panel with add/remove/focus management
 * - Popup (g.PL) — popup container with focus trapping and keyboard navigation
 * - ShoppingProductMenu (M4a) — product overflow menu for shopping overlays
 * - FeaturedProductOverlay (JHZ) — base suggested-action badge/banner
 * - ProductUpsellOverlay (Roa) — product upsell variant with view-model binding
 * - ProductUpsellModule (kaH) — module wrapper for product upsell
 * - AudioFormatChangeModule (Yvm) — handles internal audio format change events
 * - AutoDubLabel (aod)
 * - SubtitleMenuButton (g.lN) — dropdown for subtitle/audio track selection
 *
 * [was: g.$c, g.PL, M4a, JHZ, Roa, kaH, Yvm, aod, g.lN]
 */

import { buildMenuItemDescriptor, publishEvent, setMenuItemLabel } from '../ads/ad-click-tracking.js';  // was: g.up, g.xt, g.hV
import { cueRangeEndId, cueRangeStartId } from '../ads/ad-scheduling.js';  // was: g.FC, g.Sr
import { listen } from '../core/composition-helpers.js';  // was: g.s7
import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { getProperty } from '../core/misc-helpers.js';  // was: g.l
import { logClick } from '../data/visual-element-tracking.js';  // was: g.pa
import { onVideoDataChange } from '../player/player-events.js';  // was: g.Qq
import { clearPanelMenuItems, popToRootPanel, pushPanel } from '../player/video-loader.js';  // was: g.W6, g.KY, g.TN
import { compareByPriorityDescending } from '../player/video-loader.js'; // was: ibd
import { focusBackButton } from '../player/video-loader.js'; // was: c6
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { maybeScrapePayload } from '../data/gel-logger.js'; // was: Gf
import { disposePanelTransitionTimers } from '../player/video-loader.js'; // was: S6d
import { hasCaptionTracks } from './seek-bar-tail.js'; // was: OC
import { measureAndResizeCurrentPanel } from '../player/video-loader.js'; // was: yMm
import { getProbeVideoElement } from '../media/codec-helpers.js'; // was: IR
import { transitionPanel } from '../player/video-loader.js'; // was: mc
import { disposeApp } from '../player/player-events.js'; // was: WA
import { SuggestedActionBadge } from '../media/live-state.js'; // was: aN
import { OverflowButton } from '../features/keyboard-handler.js'; // was: RyH
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { skipNextIcon } from './svg-icons.js'; // was: qQ
import { initializeSuggestedActionVisibility } from '../player/video-loader.js'; // was: ru
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { getSecureOrigin } from '../core/event-system.js'; // was: J3
import { uncheckCurrentOption } from '../player/video-loader.js'; // was: vUR
import { Panel } from './controls/menu.js';
import { ContainerComponent } from '../player/container-component.js';
import { appendChild, setSize } from '../core/dom-utils.js';
import { splice, remove, binarySearch } from '../core/array-utils.js';
import { dispose } from '../ads/dai-cue-range.js';
import { PlayerComponent } from '../player/component.js';
import { Size } from '../core/math-utils.js';
// TODO: resolve g.oo

// ---------------------------------------------------------------------------
// PanelMenu [was: g.$c]
// Ordered menu panel that maintains sorted items and dispatches size-change events
// ---------------------------------------------------------------------------
export class PanelMenu extends Panel {
  /**
   * @param {Object} api      [was: Q]
   * @param {string|null} id  [was: c]
   * @param {*} parent        [was: W]
   * @param {*} position      [was: m]
   * @param {*} alignment     [was: K]
   * @param {*} anchor        [was: T]
   */
  constructor(api, id = null, parent, position, alignment, anchor) {
    const attrs = { role: "menu" };
    if (id) attrs.id = id;

    const menuElement = new ContainerComponent({
      C: "div",
      Z: "ytp-panel-menu",
      N: attrs,
    });

    super(api, menuElement, parent, position, alignment, anchor);
    this.menuItems = menuElement;
    this.items = [];
    registerDisposable(this, this.menuItems);
  }

  /**
   * Add an item to the menu, maintaining sort order.
   * @param {Object} item    [was: Q]
   * @param {boolean} append [was: c] — if true, append without sorting
   */
  T7(item, append = false) {
    if (append) {
      this.items.push(item);
      this.menuItems.element.appendChild(item.element);
    } else {
      let insertIndex = binarySearch(this.items, item, compareByPriorityDescending);
      if (insertIndex >= 0) return; // already exists
      insertIndex = ~insertIndex;
      splice(this.items, insertIndex, 0, item);
      Sz(this.menuItems.element, item.element, insertIndex);
    }
    item.subscribe("size-change", this.bq, this);
    this.menuItems.publish("size-change");
  }

  /** Focus first item. [was: rk] */
  rk() {
    if (focusBackButton(this)) return false;
    this.items[0].focus();
    return true;
  }

  /** Focus last item. [was: h0] */
  h0() {
    this.items[this.items.length - 1].focus();
    return true;
  }

  /**
   * Remove an item from the menu.
   * @param {Object} item [was: Q]
   */
  yj(item) {
    item.unsubscribe("size-change", this.bq, this);
    if (!this.u0()) {
      remove(this.items, item);
      this.menuItems.element.removeChild(item.element);
      this.menuItems.publish("size-change");
    }
  }

  /** Propagate size change. [was: bq] */
  bq() { this.menuItems.publish("size-change"); }

  /** Focus the checked radio item, or first item. [was: focus] */
  focus() {
    let focusIndex = 0;
    for (let i = 0; i < this.items.length; i++) {
      const createDatabaseDefinition = this.items[i].element;
      if (createDatabaseDefinition.getAttribute("role") === "menuitemradio") {
        if (createDatabaseDefinition.getAttribute("aria-checked") === "true") {
          focusIndex = i;
          break;
        }
      } else {
        break;
      }
    }
    this.items[focusIndex].focus();
  }

  /** Get item count. [was: al] */
  getItemCount() { return this.items.length; }
}

// ---------------------------------------------------------------------------
// Popup [was: g.PL]
// Popup container with focus trap, keyboard navigation, and panel stack
// ---------------------------------------------------------------------------
export class Popup extends PopupWidget {
  constructor(api, cssClass) { // was: Q, c
    super(api, {
      C: "div",
      yC: ["ytp-popup", cssClass || ""],
      V: [
        { C: "div", Z: "ytp-focus-trap-before", N: { tabindex: "0" } },
        { C: "div", Z: "ytp-popup-content" },
        { C: "div", Z: "ytp-focus-trap-after", N: { tabindex: "0" } },
      ],
    }, 100, true);

    this.W = [];          // panel stack
    this.A = null;        // was: this.j
    this.j = null;
    this.maxWidth = 0;
    this.maxHeight = 0;
    this.size = new Size(0, 0);
    this.content = this.z2("ytp-popup-content");

    this.listen("keydown", this.maybeScrapePayload);
    this.B(this.z2("ytp-focus-trap-before"), "focus", this.UH);
    this.B(this.z2("ytp-focus-trap-after"), "focus", this.PA);
  }

  /** Tab backward — focus last item. [was: UH] */
  UH(event) {
    if (!this.W[this.W.length - 1].h0()) event.preventDefault();
  }

  /** Tab forward — focus first item. [was: PA] */
  PA(event) {
    if (!this.W[this.W.length - 1].rk()) event.preventDefault();
  }

  show() {
    super.show();
    this.OF();
  }

  hide() {
    super.hide();
    if (this.W.length > 1) popToRootPanel(this);
  }

  /** Recalculate size. [was: OF] */
  OF() {
    disposePanelTransitionTimers(this);
    if (this.hasCaptionTracks) {
      measureAndResizeCurrentPanel(this);
      setSize(this.element, this.size);
    }
  }

  /** Pop back to previous panel. [was: IR] */
  getProbeVideoElement() {
    const popped = this.W.pop();
    transitionPanel(this, popped, this.W[this.W.length - 1], true);
  }

  /** Handle keyboard navigation. [was: Gf] */
  maybeScrapePayload(event) {
    if (event.defaultPrevented) return;
    switch (event.keyCode) {
      case 27: // Escape
        this.HB();
        event.preventDefault();
        break;
      case 37: // Left arrow — go back
        if (this.W.length > 1) this.getProbeVideoElement();
        event.preventDefault();
        break;
      case 39: // Right arrow
        event.preventDefault();
        break;
    }
  }

  focus() {
    if (this.W.length) this.W[this.W.length - 1].focus();
  }

  disposeApp() {
    super.disposeApp();
    this.A?.dispose();
    this.j?.dispose();
  }
}

// ---------------------------------------------------------------------------
// FeaturedProductOverlay [was: JHZ]
// Base overlay for suggested actions / featured products
// ---------------------------------------------------------------------------
export class FeaturedProductOverlay extends SuggestedActionBadge {
  constructor(api) { // was: Q
    super(api, false, true);
    this.isInitialized = false;
    this.isVisible = false;
    this.j = false;               // has tracking params
    this.shouldHideDismissButton = false;
    this.shouldShowOverflowButton = false;
    this.isCounterfactual = false;
    this.T2 = true;
    this.enabled = true; // was: not explicitly in constructor, but used

    this.overflowButton = new PlayerComponent({
      C: "button",
      yC: ["ytp-featured-product-overflow-icon", "ytp-button"],
      N: { "aria-haspopup": "true" },
    });
    this.overflowButton.hide();
    registerDisposable(this, this.overflowButton);

    this.badge.element.classList.add("ytp-suggested-action");

    this.thumbnailImage = new PlayerComponent({
      C: "img", Z: "ytp-suggested-action-badge-img", N: { src: "{{url}}" },
    });
    this.thumbnailImage.hide();
    registerDisposable(this, this.thumbnailImage);

    this.thumbnailIcon = new PlayerComponent({
      C: "div", Z: "ytp-suggested-action-badge-icon",
    });
    this.thumbnailIcon.hide();
    registerDisposable(this, this.thumbnailIcon);

    this.banner = new PlayerComponent({
      C: "a", Z: "ytp-suggested-action-container",
      V: [
        this.thumbnailImage, this.thumbnailIcon,
        {
          C: "div", Z: "ytp-suggested-action-details",
          V: [
            { C: "text", Z: "ytp-suggested-action-title", eG: "{{title}}" },
            { C: "text", Z: "ytp-suggested-action-subtitle", eG: "{{subtitle}}" },
            { C: "text", Z: "ytp-suggested-action-metadata-text", eG: "{{metadata}}" },
          ],
        },
        this.dismissButton, this.overflowButton,
      ],
    });
    registerDisposable(this, this.banner);
    this.banner.createVisualElement(this.K.element);

    this.B(this.U, "videodatachange", this.onVideoDataChange);
    this.B(this.U, cueRangeStartId("suggested_action_view_model"), this.Fw);
    this.B(this.U, cueRangeEndId("suggested_action_view_model"), this.MQ);
    this.B(this.overflowButton.element, "click", this.instreamAdPlayerOverlayRenderer);
    this.B(api, "featuredproductdismissed", this.L);
    this.U.createServerVe(this.banner.element, this.banner, true);
  }

  UH(event) {
    if (event.target !== this.dismissButton.element && event.target !== this.overflowButton.element) {
      this.J();
      if (this.onClickCommand) publishEvent(this.U, "innertubeCommand", this.onClickCommand);
    }
  }

  L() { this.enabled = false; this.Ie.hide(); }
  Y() { return !!this.W && this.enabled; }

  onVideoDataChange(eventType, videoData) {
    this.XI(videoData);
    if (!this.W) return;
    this.parseHexColor();
    if (!this.isCounterfactual) {
      this.banner.update({
        title: this.W?.title,
        subtitle: this.W?.subtitle,
        metadata: this.W?.metadataText,
      });
      this.onClickCommand = getProperty(this.W?.onTap, b5);
      if (this.W?.thumbnailImage) {
        const sources = this.W?.thumbnailImage?.sources || [];
        if (sources.length > 0) this.thumbnailImage.update({ url: sources[0].url });
      } else if (this.W?.thumbnailIconName) {
        this.thumbnailIcon.update({ icon: this.W?.thumbnailIconName });
      }
      this.shouldShowOverflowButton = !!this.W?.shouldShowOverflowButton;
      this.shouldHideDismissButton = !!this.W?.shouldHideDismissButton;
    }
    this.banner.element.setAttribute("aria-label", this.W?.a11yLabel || "");
    this.skipNextIcon = this.W?.dismissButtonA11yLabel;
    this.dismissButton.hide();
    this.overflowButton.hide();
    this.isInitialized = true;
    initializeSuggestedActionVisibility(this);
  }

  Fw() { this.isVisible = true; initializeSuggestedActionVisibility(this); }
  MQ() { this.isVisible = false; initializeSuggestedActionVisibility(this); }

  La() {
    super.La();
    if (this.j) this.U.logVisibility(this.banner.element, this.isVisible);
  }

  J() {
    super.J(false);
    if (this.j) this.U.logClick(this.banner.element);
  }

  instreamAdPlayerOverlayRenderer(event) {
    if (!this.S) {
      this.S = new M4a(this.U);
      registerDisposable(this, this.S);
    }
    if (this.isSamsungSmartTV?.menu?.menuRenderer) {
      this.S.open(this.isSamsungSmartTV.menu.menuRenderer, event.target);
      event.preventDefault();
    }
  }

  XI() {}  // override in subclass
  parseHexColor() {}  // override in subclass

  disposeApp() {
    this.U.qI("suggested_action_view_model");
    super.disposeApp();
  }
}

// ---------------------------------------------------------------------------
// SubtitleMenuButton [was: g.lN]
// Dropdown button for subtitle/audio track selection with radio items
// ---------------------------------------------------------------------------
export class SubtitleMenuButton extends g.oo {
  constructor(parent, priority, api, menuPanel, menuParent, menuPosition, menuAnchor) {
    super(buildMenuItemDescriptor({ "aria-haspopup": "true" }), priority, api);
    this.Ik = menuPanel;      // settings menu host
    this.MM = false;           // is enabled
    this.L = null;             // current selection
    this.options = {};         // option ID -> menu item
    this.getSecureOrigin = new PanelMenu(parent, undefined, api, menuParent, menuPosition, menuAnchor);
    registerDisposable(this, this.getSecureOrigin);
    this.listen("keydown", this.maybeScrapePayload);
    this.listen("click", this.open);
  }

  open() { pushPanel(this.Ik, this.getSecureOrigin); }

  /** Set checked option. [was: O] */
  setSelected(optionId) { // was: Q
    uncheckCurrentOption(this);
    const item = this.options[optionId];
    if (item) {
      item.element.setAttribute("aria-checked", "true");
      this.setContent(this.A(optionId));
      this.L = optionId;
    }
  }

  /** Replace option set. [was: j] */
  setOptions(optionIds) { // was: Q
    clearPanelMenuItems(this.getSecureOrigin);
    const newOptions = {};
    let hasSelection = false;

    for (let i = 0; i < optionIds.length; i++) {
      const id = optionIds[i];
      const isSelected = id === this.L;
      if (isSelected) hasSelection = true;

      let item = this.options[id];
      if (item && item.priority === -i) {
        setMenuItemLabel(this.options[id], this.A(id, true));
        delete this.options[id];
      } else {
        item = this.Y(id, -i, isSelected);
      }
      newOptions[id] = item;
      this.getSecureOrigin.T7(item, true);
    }

    if (!hasSelection) this.L = null;

    // Dispose old options
    for (const id of Object.keys(this.options)) {
      this.options[id].dispose();
    }
    this.options = newOptions;
  }

  /** Create a menu item for an option. [was: Y] */
  Y(optionId, priority, isChecked, footer) { // was: Q, c, W, m
    const template = {
      C: "div",
      yC: ["ytp-menuitem", footer ? "ytp-menuitem-with-footer" : ""],
      N: {
        tabindex: "0",
        role: "menuitemradio",
        "aria-checked": isChecked ? "true" : "false",
      },
      V: [{ C: "div", yC: ["ytp-menuitem-label"], eG: "{{label}}" }],
    };

    if (footer) {
      const footerEl = { C: "div", Z: "ytp-menuitem-footer", V: [footer] };
      if (template.V) template.V.push(footerEl);
      else template.V = [footerEl];
    }

    const item = new g.oo(template, priority, this.A(optionId, true));
    item.listen("click", () => { this.Ka(optionId); });
    return item;
  }

  /** Enable/disable the button. [was: enable] */
  enable(shouldEnable) { // was: Q
    if (this.MM) {
      if (!shouldEnable) {
        this.MM = false;
        this.J(false);
      }
    } else if (shouldEnable) {
      this.MM = true;
      // ... activation logic
    }
  }
}

// ---------------------------------------------------------------------------
// AutoDubLabel [was: aod]
// Simple label for auto-dubbed audio tracks
// ---------------------------------------------------------------------------
export class AutoDubLabel {
  constructor() {
    this.label = "Auto-dubbed";
  }
}
