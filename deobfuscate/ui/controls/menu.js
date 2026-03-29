/**
 * Menu / Dropdown Components — panels, popup menus, and menu items.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~101450-101529  (Gj — Panel)
 *                 ~101531-101596  (g.$c — MenuPanel with sorted menu items)
 *                 ~101598-101675  (g.PL — Popup container with focus trapping)
 *                 ~101677-101701  (M4a — shopping product menu)
 *                 ~113139-113199  (aQa — playback speed menu item, references panels)
 *
 * [was: Gj, g.$c, g.PL, M4a, aQa]
 */
import { createDatabaseDefinition } from '../../data/idb-transactions.js'; // was: el
import { ContainerComponent } from '../../player/container-component.js';
import { splice } from '../../core/array-utils.js';

// import { UIComponent } from '../../player/base-component.js';
// import { PlayerComponent } from '../../player/component.js';

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * A settings sub-panel with an optional back-button header and footer.
 *
 * Structure:
 *   <div class="ytp-panel">
 *     <div class="ytp-panel-header">         <!-- optional -->
 *       <div class="ytp-panel-back-button-container">
 *         <button class="ytp-button ytp-panel-back-button" aria-label="Back to previous menu" />
 *       </div>
 *       <span class="ytp-panel-title" role="heading" aria-level="2">…title…</span>
 *       <button class="ytp-button ytp-panel-options">…</button>  <!-- optional -->
 *     </div>
 *     …content component…
 *     <div class="ytp-panel-footer">…</div>  <!-- optional -->
 *   </div>
 *
 * [was: Gj]
 */
export class Panel /* extends ContainerComponent */ {
  /**
   * The content component rendered inside this panel.
   * @type {Object}
   */
  content; // was: this.content

  /**
   * The back button element (present when panel has a header/title).
   * @type {HTMLElement|undefined}
   */
  backButton; // was: this.backButton — z2("ytp-panel-back-button")

  /**
   * Whether this panel has a header row.
   * @type {boolean}
   */
  hasHeader_ = false; // was: this.Wu

  /**
   * Whether this panel has a footer row.
   * @type {boolean}
   */
  hasFooter_ = false; // was: this.fJ

  /**
   * Player API reference.
   * @type {Object}
   */
  api; // was: this.U

  /**
   * @param {Object}   api            Player API instance.
   * @param {Object}   contentComponent  The UI component to display inside.
   * @param {string}   [title]        Panel title text (enables header + back button).
   * @param {Object}   [optionsContent]  Content for the options button (if any).
   * @param {Function} [onOptions]    Click handler for the options button.
   * @param {Object}   [footer]       Footer template (if any).
   */
  constructor(api, contentComponent, title = undefined, optionsContent = undefined, onOptions = undefined, footer = undefined) {
    // super({C: "div", Z: "ytp-panel", V: […]});

    this.content = contentComponent; // was: this.content = c
    this.hasHeader_ = false;
    this.hasFooter_ = !!footer;
    this.api = api; // was: this.U

    if (title) {
      // Populate header with back button, title, optional options button
      this.hasHeader_ = true; // was: this.Wu = true
      // this.backButton = this.z2("ytp-panel-back-button");
      // this.B(this.backButton, "click", this.goBack_);
    }

    // contentComponent.subscribe("size-change", this.onSizeChange_, this);
    // this.B(api, "fullscreentoggled", this.onSizeChange_);
  }

  /**
   * Propagates size change events upward.
   * @private
   */
  onSizeChange_() { // was: sP()
    this.publish('size-change');
  }

  /**
   * Attempts to focus the first element in the panel.
   * @returns {boolean}
   */
  focusFirst() { // was: rk()
    // return c6(this);
    return false;
  }

  /**
   * Attempts to focus the last element in the panel.
   * @returns {boolean}
   */
  focusLast() { // was: h0()
    // return c6(this);
    return false;
  }

  /**
   * Focuses the content component.
   */
  focus() {
    this.content.focus();
  }

  /**
   * Navigates back (publishes a "back" event).
   * @private
   */
  goBack_() { // was: JV()
    this.publish('back');
  }
}

// ---------------------------------------------------------------------------
// MenuPanel
// ---------------------------------------------------------------------------

/**
 * A panel that contains a sorted list of menu items.
 * Extends {@link Panel} with item management (add, remove, sort, focus).
 *
 * Structure:
 *   <div class="ytp-panel">
 *     …optional header…
 *     <div class="ytp-panel-menu" role="menu">
 *       <div class="ytp-menuitem" role="menuitemradio" …>…</div>
 *       …
 *     </div>
 *     …optional footer…
 *   </div>
 *
 * [was: g.$c]
 */
export class MenuPanel extends Panel {
  /**
   * The menu container element.
   * @type {Object}
   */
  menuItems; // was: this.menuItems (g.KK with class "ytp-panel-menu")

  /**
   * Ordered array of menu item instances.
   * @type {Array<Object>}
   */
  items = []; // was: this.items

  /**
   * @param {Object}   api        Player API instance.
   * @param {string}   [menuId]   DOM id for the menu container.
   * @param {string}   [title]    Panel title.
   * @param {Object}   [optionsContent]
   * @param {Function} [onOptions]
   * @param {Object}   [footer]
   */
  constructor(api, menuId = null, title = undefined, optionsContent = undefined, onOptions = undefined, footer = undefined) {
    const menuAttrs = { role: 'menu' };
    if (menuId) menuAttrs.id = menuId;

    const menuContainer = {
      C: 'div',
      Z: 'ytp-panel-menu',
      N: menuAttrs,
    }; // was: c = new g.KK({…})

    super(api, menuContainer, title, optionsContent, onOptions, footer);

    this.menuItems = menuContainer; // was: this.menuItems = c
    this.items = [];
  }

  /**
   * Adds a menu item, inserted in sorted order (by priority) unless
   * `appendToEnd` is true.
   *
   * @param {Object}  item          The menu item component.
   * @param {boolean} [appendToEnd] If true, append without sorting.
   */
  addItem(item, appendToEnd = false) { // was: T7(Q, c=false)
    if (appendToEnd) {
      this.items.push(item);
      // this.menuItems.element.appendChild(item.element);
    } else {
      // Binary-search insert by priority
      // const index = g.H9(this.items, item, ibd);
      // g.q9(this.items, ~index, 0, item);
      // Sz(this.menuItems.element, item.element, ~index);
    }
    item.subscribe('size-change', this.onItemSizeChange_, this);
    // this.menuItems.publish("size-change");
  }

  /**
   * Focuses the first item, or the checked radio item.
   * @returns {boolean}
   */
  focusFirst() { // was: rk()
    // c6(this) || this.items[0].focus();
    return true;
  }

  /**
   * Focuses the last item.
   * @returns {boolean}
   */
  focusLast() { // was: h0()
    if (this.items.length > 0) {
      this.items[this.items.length - 1].focus();
    }
    return true;
  }

  /**
   * Removes a menu item from the panel.
   *
   * @param {Object} item  The menu item to remove.
   */
  removeItem(item) { // was: yj(Q)
    item.unsubscribe('size-change', this.onItemSizeChange_, this);
    const index = this.items.indexOf(item);
    if (index >= 0) {
      this.items.splice(index, 1);
      // this.menuItems.element.removeChild(item.element);
      // this.menuItems.publish("size-change");
    }
  }

  /**
   * @private
   */
  onItemSizeChange_() { // was: bq()
    // this.menuItems.publish("size-change");
  }

  /**
   * Focuses the first checked radio item, or falls back to the first item.
   */
  focus() { // was: focus()
    let focusIndex = 0;
    for (let i = 0; i < this.items.length; i++) {
      const createDatabaseDefinition = this.items[i].element;
      if (createDatabaseDefinition.getAttribute('role') === 'menuitemradio') {
        if (createDatabaseDefinition.getAttribute('aria-checked') === 'true') {
          focusIndex = i;
          break;
        }
      } else {
        break;
      }
    }
    this.items[focusIndex].focus();
  }

  /**
   * Returns the number of items in the menu.
   * @returns {number}
   */
  getItemCount() { // was: al()
    return this.items.length;
  }
}

// ---------------------------------------------------------------------------
// Popup
// ---------------------------------------------------------------------------

/**
 * A popup container with focus-trapping (focus wraps from last to first
 * item and vice versa) and keyboard navigation (Escape to close, Left
 * arrow to go back one panel level).
 *
 * Structure:
 *   <div class="ytp-popup">
 *     <div class="ytp-focus-trap-before" tabindex="0" />
 *     <div class="ytp-popup-content">
 *       …panels…
 *     </div>
 *     <div class="ytp-focus-trap-after" tabindex="0" />
 *   </div>
 *
 * [was: g.PL]
 */
export class Popup /* extends PopupWidget (positioned overlay base) */ {
  /**
   * Stack of panels currently displayed. The last item is the "top" panel.
   * @type {Array<Panel>}
   */
  panelStack_ = []; // was: this.W

  /**
   * The popup content wrapper element.
   * @type {HTMLElement}
   */
  contentElement; // was: this.content — z2("ytp-popup-content")

  /**
   * Maximum width for the popup (set by chrome layout).
   * @type {number}
   */
  maxWidth = 0; // was: this.maxWidth

  /**
   * Maximum height for the popup (set by chrome layout).
   * @type {number}
   */
  maxHeight = 0; // was: this.maxHeight

  /**
   * Computed size of the popup.
   * @type {{ width: number, height: number }}
   */
  size = { width: 0, height: 0 }; // was: this.size — new g.JP(0, 0)

  /**
   * @param {Object} api           Player API instance.
   * @param {string} [cssClass]    Additional CSS class for the popup.
   */
  constructor(api, cssClass = '') {
    // super(api, {template}, 100, true);

    this.panelStack_ = [];
    this.contentElement = null; // z2("ytp-popup-content")

    // Focus traps: before / after elements
    // this.listen("keydown", this.onKeyDown_);
    // this.B(z2("ytp-focus-trap-before"), "focus", this.onFocusTrapBefore_);
    // this.B(z2("ytp-focus-trap-after"), "focus", this.onFocusTrapAfter_);
  }

  /**
   * Focus trap — wraps focus to the last element of the top panel.
   * @param {FocusEvent} event
   * @private
   */
  onFocusTrapBefore_(event) { // was: UH(Q)
    const topPanel = this.panelStack_[this.panelStack_.length - 1];
    if (!topPanel.focusLast()) {
      event.preventDefault();
    }
  }

  /**
   * Focus trap — wraps focus to the first element of the top panel.
   * @param {FocusEvent} event
   * @private
   */
  onFocusTrapAfter_(event) { // was: PA(Q)
    const topPanel = this.panelStack_[this.panelStack_.length - 1];
    if (!topPanel.focusFirst()) {
      event.preventDefault();
    }
  }

  /**
   * Shows the popup and recalculates layout.
   */
  show() {
    // super.show();
    this.recalculateLayout_(); // was: this.OF()
  }

  /**
   * Hides the popup and resets to a single panel.
   */
  hide() {
    // super.hide();
    if (this.panelStack_.length > 1) {
      // Reset to root panel: g.KY(this)
    }
  }

  /**
   * Recalculates popup size and position.
   * @private
   */
  recalculateLayout_() { // was: OF()
    // S6d(this) — compute content size
    // yMm(this) — position the popup
    // g.XI(this.element, this.size);
  }

  /**
   * Pops the top panel off the stack, animating back to the previous panel.
   */
  goBack() { // was: IR()
    const removed = this.panelStack_.pop();
    // mc(this, removed, this.panelStack_[this.panelStack_.length - 1], true);
  }

  /**
   * Handles keyboard navigation.
   *
   * @param {KeyboardEvent} event
   * @private
   */
  onKeyDown_(event) { // was: Gf(Q)
    if (event.defaultPrevented) return;

    switch (event.keyCode) {
      case 27: // Escape — close popup
        this.dismiss_(); // was: this.HB()
        event.preventDefault();
        break;
      case 37: // Left arrow — go back one panel
        if (this.panelStack_.length > 1) {
          this.goBack();
        }
        event.preventDefault();
        break;
      case 39: // Right arrow — consume event
        event.preventDefault();
        break;
    }
  }

  /**
   * Focuses the top panel.
   */
  focus() {
    if (this.panelStack_.length > 0) {
      this.panelStack_[this.panelStack_.length - 1].focus();
    }
  }

  /**
   * Dismisses / hides the popup.
   * @private
   */
  dismiss_() { // was: HB()
    this.hide();
  }
}
