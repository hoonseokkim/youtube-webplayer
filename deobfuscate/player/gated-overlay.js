import { dispose } from '../ads/dai-cue-range.js';
import { UIComponent } from './base-component.js';
import { listen } from '../core/composition-helpers.js';
import { PlayerModule } from './account-linking.js';

/**
 * GatedActionsOverlay — overlay displayed when user actions require
 * authentication or other gating conditions (e.g. sign-in prompts
 * on miniplayer).
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~88962–89046
 *
 * Two classes:
 *   nx9  -> GatedActionsOverlay   (the UI widget)
 *   DXW  -> GatedActionsOverlayController  (the controller/module)
 *
 * The overlay contains:
 *   - A background layer with a blur/dim sub-overlay
 *   - A miniplayer close button (top-level, fires "onCloseMiniplayer")
 *   - A bar with title, subtitle, and a button container
 *
 * Action buttons are populated dynamically via `updateActionButtons()`
 * (was: iAO, defined at line ~36156).
 *
 * [was: nx9, DXW]
 */

// import { UIComponent } from './base-component.js';  // was: g.k
// import { PlayerModule } from './base-module.js';     // was: yT

// ---------------------------------------------------------------------------
// GatedActionsOverlay  [was: nx9]
// ---------------------------------------------------------------------------

/**
 * The visual overlay widget.  Builds a DOM tree from a declarative template
 * and stores references to key sub-elements.
 *
 * Template structure (CSS classes):
 *   .ytp-gated-actions-overlay
 *     .ytp-gated-actions-overlay-background
 *       .ytp-gated-actions-overlay-background-overlay
 *     button.ytp-gated-actions-overlay-miniplayer-close-button.ytp-button
 *       (close icon SVG)
 *     .ytp-gated-actions-overlay-bar
 *       .ytp-gated-actions-overlay-text-container
 *         .ytp-gated-actions-overlay-title          {{title}}
 *         .ytp-gated-actions-overlay-subtitle       {{subtitle}}
 *       .ytp-gated-actions-overlay-button-container
 *
 * [was: nx9]
 */
export class GatedActionsOverlay /* extends UIComponent */ {
  /**
   * @param {Object} api — the player API reference [was: Q]
   */
  constructor(api) {
    // super({...template...});  // was: super({ C: "div", Z: "ytp-gated-actions-overlay", ... })

    /** Player API reference. */
    this.api = api;

    /**
     * Background element.
     * @type {HTMLElement}
     * [was: this.background]
     */
    this.background = this.z2("ytp-gated-actions-overlay-background");
    // was: this.z2("ytp-gated-actions-overlay-background")

    /**
     * Button container element where action buttons are appended.
     * @type {HTMLElement}
     * [was: this.O]
     */
    this.buttonContainer = this.z2("ytp-gated-actions-overlay-button-container");
    // was: this.O = this.z2("ytp-gated-actions-overlay-button-container")

    /**
     * Array of active action-button entries.
     * Each entry is `{ element: UIComponent, listener?: EventHandle }`.
     * @type {Array<{ element: *, listener?: * }>}
     * [was: this.W]
     */
    this.actionButtons = []; // was: this.W = []

    // Bind the miniplayer close button to fire "onCloseMiniplayer"
    this.listen(
      this.z2("ytp-gated-actions-overlay-miniplayer-close-button"),
      "click",
      () => {
        this.api.publish("onCloseMiniplayer"); // was: g.xt(this.api, "onCloseMiniplayer")
      }
    );

    // Start hidden
    this.hide();
  }
}

// ---------------------------------------------------------------------------
// updateActionButtons  [was: iAO] (line ~36156)
// ---------------------------------------------------------------------------

/**
 * Populate (or reconcile) the overlay's action-button list from a server-
 * provided array of button descriptors.  Creates new button elements as
 * needed, updates text, and removes excess buttons.
 *
 * @param {GatedActionsOverlay} overlay   — the overlay instance [was: Q]
 * @param {Array<Object>}       buttons   — server-provided button data [was: c]
 *
 * was: iAO(Q, c) (line 36156)
 */
export function updateActionButtons(overlay, buttons) {
  let i = 0;

  for (i = 0; i < buttons.length; i++) {
    let entry = overlay.actionButtons[i]; // was: Q.W[W]
    let element = entry?.element;         // was: m?.element → K

    if (!element) {
      // Create a new button element from the template
      // was: new g.k({ C: "button", Z: "ytp-gated-actions-overlay-button", ... })
      element = createButtonElement();
      // was: g.F(Q, K) — register for disposal
      // was: K.x0(Q.O) — append to button container
      element.appendTo(overlay.buttonContainer);
      entry = { element };
    }

    // Extract the button data from the protobuf wrapper
    const buttonData = buttons[i]; // was: g.l(c[W], NQy) → T

    // Update the button text
    element.update({
      buttonText: buttonData?.title || buttonData?.titleFormatted?.content || "",
    });

    // Remove old click listener and attach a new one
    if (entry.listener) {
      element.removeListener(entry.listener); // was: K.Xd(m.listener)
    }
    entry.listener = element.listen("click", () => {
      const command = buttonData?.onTap; // was: g.l(T?.onTap, b5) → r
      if (command) {
        overlay.api.publish("innertubeCommand", command);
        // was: g.xt(Q.api, "innertubeCommand", r)
      }
    });

    overlay.actionButtons[i] = entry; // was: Q.W[W] = m
  }

  // Remove excess buttons that are no longer needed
  while (i < overlay.actionButtons.length) {
    overlay.actionButtons.pop().element.dispose();
  }
}

// ---------------------------------------------------------------------------
// GatedActionsOverlayController  [was: DXW]
// ---------------------------------------------------------------------------

/**
 * Controller / player module that manages the `GatedActionsOverlay` widget.
 * Listens for `videodatachange` events and shows/hides the overlay based
 * on the presence of `W0` (gated-actions data) in the video data.
 *
 * [was: DXW]
 */
export class GatedActionsOverlayController /* extends PlayerModule */ {
  /**
   * @param {Object} api — the player API reference [was: Q]
   */
  constructor(api) {
    // super(api);

    /** @private  Event handler group. [was: this.events] */
    this.events = api.createEventHandler(); // was: new g.db(Q)
    // g.F(this, this.events) — register for disposal

    /** @private  The overlay widget. [was: this.W] */
    this.overlay = new GatedActionsOverlay(api); // was: new nx9(this.api)
    // g.F(this, this.W) — register for disposal

    // Listen for video data changes and update the overlay
    this.events.listen(api, "videodatachange", () => {
      const gatedData = api.getVideoData()?.W0; // was: c

      if (gatedData) {
        // Update title and subtitle
        this.overlay.update({
          title:    gatedData.title?.content || "",
          subtitle: gatedData.subtitle?.content || "",
        });

        // Update background image from the highest-resolution thumbnail
        const thumbnail = gatedData.thumbnail; // was: m
        let backgroundImage = "none";           // was: K
        if (thumbnail?.sources) {
          let maxWidth = 0; // was: T
          for (const source of thumbnail.sources) {
            if (source.width && source.url && source.width > maxWidth) {
              maxWidth = source.width;
              backgroundImage = `url(${source.url})`;
            }
          }
        }
        this.overlay.background.style.backgroundImage = backgroundImage;

        // Populate action buttons
        updateActionButtons(this.overlay, gatedData.actionButtons || []);
        // was: iAO(W, c.actionButtons || [])

        this.overlay.show();
      } else {
        this.overlay.hide();
      }
    });

    // Register the overlay element at screen layer 4
    api.addScreenElement(this.overlay.element, 4);
    // was: g.f8(this.api, this.W.element, 4)
  }
}

// ---------------------------------------------------------------------------
// Private helper (not exported — placeholder for template creation)
// ---------------------------------------------------------------------------

/**
 * Create a button element for the overlay.
 * In the original code this uses `new g.k({...})` with a declarative
 * template.  We use a placeholder here.
 *
 * @returns {Object} a UI component representing the button
 * @private
 */
function createButtonElement() {
  // Template:
  // { C: "button", Z: "ytp-gated-actions-overlay-button",
  //   N: { tabindex: "0" },
  //   V: [{ C: "div", Z: "ytp-gated-actions-overlay-button-title", eG: "{{buttonText}}" }] }
  return {
    update() {},
    listen() {},
    removeListener() {},
    appendTo() {},
    dispose() {},
  };
}
