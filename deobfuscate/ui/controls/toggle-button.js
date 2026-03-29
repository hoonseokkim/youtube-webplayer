/**
 * Toggle Button Components — ad toggle buttons with checked/unchecked state.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~69931-70055  (kp — ad toggle button)
 *                 ~70057-70076  (Uzw — ad UX action, ddm — ad UX update listener)
 *
 * The main class `AdToggleButton` is an ad component that renders a
 * checkbox-backed toggle with icon swapping, tooltip, and ARIA semantics.
 *
 * [was: kp]
 */
import { AdComponent } from '../../player/component-events.js'; // was: JU
import { clear } from '../../core/array-utils.js';

// import { AdComponentBase } from '../../player/ad-component-base.js';

// ---------------------------------------------------------------------------
// AdToggleButton
// ---------------------------------------------------------------------------

/**
 * A toggle button used in ad overlays (e.g. "like", "remind me", ad preferences).
 *
 * Renders as a `<label>` wrapping a hidden `<input type="checkbox">`, an icon
 * span (which swaps between toggled/untoggled SVGs), and optional text/tooltip.
 *
 * Template:
 *   <div class="ytp-ad-toggle-button">
 *     <label class="ytp-ad-toggle-button-label" for="{{inputId}}">
 *       <span class="ytp-ad-toggle-button-icon" role="checkbox" aria-label="{{tooltipText}}">
 *         <span class="ytp-ad-toggle-button-untoggled-icon">{{untoggledIconTemplateSpec}}</span>
 *         <span class="ytp-ad-toggle-button-toggled-icon">{{toggledIconTemplateSpec}}</span>
 *       </span>
 *       <input class="ytp-ad-toggle-button-input" id="{{inputId}}" type="checkbox" />
 *       <span class="ytp-ad-toggle-button-text">{{buttonText}}</span>
 *       <span class="ytp-ad-toggle-button-tooltip">{{tooltipText}}</span>
 *     </label>
 *   </div>
 *
 * [was: kp]
 */
export class AdToggleButton /* extends AdComponent (ad component base) */ {
  /**
   * The outer toggle container element.
   * @type {HTMLElement}
   */
  container_; // was: this.j — z2("ytp-ad-toggle-button")

  /**
   * The hidden checkbox input element that backs the toggle state.
   * @type {HTMLInputElement}
   */
  checkboxInput_; // was: this.W — z2("ytp-ad-toggle-button-input")

  /**
   * The icon wrapper span (holds toggled + untoggled icon sub-spans).
   * @type {HTMLElement}
   */
  iconElement_; // was: this.O — z2("ytp-ad-toggle-button-icon")

  /**
   * The untoggled (default) icon span.
   * @type {HTMLElement}
   */
  untoggledIcon_; // was: this.D — z2("ytp-ad-toggle-button-untoggled-icon")

  /**
   * The toggled icon span.
   * @type {HTMLElement}
   */
  toggledIcon_; // was: this.K — z2("ytp-ad-toggle-button-toggled-icon")

  /**
   * The text label span.
   * @type {HTMLElement}
   */
  textElement_; // was: this.T2 — z2("ytp-ad-toggle-button-text")

  /**
   * The renderer data from the server response.
   * @type {Object|null}
   */
  rendererData_ = null; // was: this.A

  /**
   * Whether the button has a distinct toggled icon (vs. a single icon).
   * @type {boolean}
   */
  hasDualIcons_ = false; // was: this.S

  /**
   * @param {Object} api              Player API instance.
   * @param {string} layoutId         Layout identifier for command dispatch.
   * @param {Object} loggingData      Interaction logging client data.
   * @param {Object} commandAdapter   [was: vA] — executes ad commands.
   * @param {string[]} [extraClasses] Additional CSS classes.
   */
  constructor(api, layoutId, loggingData, commandAdapter, extraClasses = []) {
    // Generate a unique id for the checkbox input
    const inputId = `ytp-ad-toggle-button-input-${Date.now()}`; // was: c1("ytp-ad-toggle-button-input")

    // Build accessibility attributes
    const iconAttrs = {
      role: 'checkbox',      // was: r.role — changed from "button" to "checkbox"
      'aria-label': '{{tooltipText}}',
    };

    // …super(api, {template}, "toggle-button", layoutId, loggingData, commandAdapter)…

    this.container_ = null;       // populated by z2("ytp-ad-toggle-button")
    this.checkboxInput_ = null;   // populated by z2("ytp-ad-toggle-button-input")
    this.iconElement_ = null;     // populated by z2("ytp-ad-toggle-button-icon")
    this.untoggledIcon_ = null;   // populated by z2("ytp-ad-toggle-button-untoggled-icon")
    this.toggledIcon_ = null;     // populated by z2("ytp-ad-toggle-button-toggled-icon")
    this.textElement_ = null;     // populated by z2("ytp-ad-toggle-button-text")
    this.rendererData_ = null;
    this.hasDualIcons_ = false;
    this.hide();
  }

  /**
   * Initialises the toggle from a ToggleButtonRenderer response.
   *
   * @param {string} elementId    Unique element identifier.
   * @param {Object} data         ToggleButtonRenderer data from the server.
   * @param {Object} macros       Template macro map.
   */
  init(elementId, data, macros) { // was: init(Q, c, W)
    // super.init(elementId, data, macros);
    this.rendererData_ = data; // was: this.A = c

    if (data.defaultText == null && data.defaultIcon == null) {
      // Error: "ToggleButtonRenderer must have either text or icon set."
      return;
    }
    if (data.defaultIcon == null && data.toggledIcon != null) {
      // Error: "ToggleButtonRenderer cannot have toggled icon set without a default icon."
      return;
    }

    // Apply style class based on data.style.styleType
    if (data.style) {
      let styleClass = null; // was: Q
      switch (data.style.styleType) {
        case 'STYLE_UNKNOWN':
        case 'STYLE_DEFAULT':
          styleClass = 'ytp-ad-toggle-button-default-style';
          break;
        default:
          styleClass = null;
      }
      if (styleClass !== null) {
        this.container_.classList.add(styleClass); // was: g.xK(this.j, Q)
      }
    }

    // Set text label
    const templateValues = {}; // was: Q = {}
    if (data.defaultText) {
      const text = data.defaultText; // was: g.rK(c.defaultText)
      if (text) {
        templateValues.buttonText = text;
        // Set aria-label on the checkbox input (with experiment guard)
        this.checkboxInput_.setAttribute('aria-label', text);
        // Also on icon element (with experiment guard)
        this.iconElement_.setAttribute('aria-label', text);
      }
    } else {
      // Hide text element: g.ee(this.T2, false)
      this.textElement_.style.display = 'none';
    }

    // Set tooltip
    if (data.defaultTooltip) {
      templateValues.tooltipText = data.defaultTooltip;
      if (!this.checkboxInput_.hasAttribute('aria-label')) {
        this.iconElement_.setAttribute('aria-label', data.defaultTooltip);
      }
    }

    // Set icons
    if (data.defaultIcon) {
      // Render untoggled icon SVG
      // this.updateValue("untoggledIconTemplateSpec", renderIcon(data.defaultIcon));

      if (data.toggledIcon) {
        this.hasDualIcons_ = true; // was: this.S = true
        // Render toggled icon SVG
        // this.updateValue("toggledIconTemplateSpec", renderIcon(data.toggledIcon));
      } else {
        // Show only the untoggled icon, hide the toggled icon span
        this.untoggledIcon_.style.display = '';
        this.toggledIcon_.style.display = 'none';
      }
      // Hide the raw checkbox
      this.checkboxInput_.style.display = 'none';
    } else {
      // No icon — hide the icon element entirely
      this.iconElement_.style.display = 'none';
    }

    // Apply initial template values
    // this.update(templateValues);

    // Set initial toggled state if provided
    if (data.isToggled) {
      this.container_.classList.add('ytp-ad-toggle-button-toggled');
      this.toggleButton(data.isToggled);
    }

    // Update ARIA checked state
    this.updateAriaChecked_(); // was: L2(this)

    // Listen for native change events on the checkbox
    // this.B(this.element, "change", this.onChangeHandler_);

    this.show();
  }

  /**
   * Handles click events — toggles state and dispatches commands.
   *
   * @param {Event} event
   */
  onClick(event) { // was: onClick(Q)
    if (this.hasCommands_()) { // was: this.Ka.length > 0
      this.toggleButton(!this.isToggled());
      this.onChangeHandler_();
    }
    // super.onClick(event);
  }

  /**
   * Internal change handler — updates visual state and executes commands.
   * @private
   */
  onChangeHandler_() { // was: J()
    const toggled = this.isToggled();

    // Update CSS class
    this.container_.classList.toggle('ytp-ad-toggle-button-toggled', toggled);

    // Execute toggled/untoggled commands
    // for (const command of tq7(this, toggled)) { … }

    if (toggled) {
      // this.api.onAdUxClicked("toggle-button", this.layoutId);
    }

    this.updateAriaChecked_(); // was: L2(this)
  }

  /**
   * Hides the toggle button.
   */
  clear() {
    this.hide();
  }

  /**
   * Programmatically sets the toggle state.
   *
   * @param {boolean} toggled  Whether the button should be in toggled state.
   */
  toggleButton(toggled) { // was: toggleButton(Q)
    this.container_.classList.toggle('ytp-ad-toggle-button-toggled', toggled);
    this.checkboxInput_.checked = toggled;
    this.updateAriaChecked_(); // was: L2(this)
  }

  /**
   * Returns whether the toggle is currently checked/toggled.
   *
   * @returns {boolean}
   */
  isToggled() { // was: isToggled()
    return this.checkboxInput_.checked;
  }

  /**
   * Syncs the `aria-checked` attribute with the checkbox state.
   * @private
   */
  updateAriaChecked_() { // was: L2(this)
    const checked = this.isToggled();
    this.iconElement_?.setAttribute('aria-checked', String(checked));
  }

  /**
   * @returns {boolean} Whether the button has associated commands.
   * @private
   */
  hasCommands_() {
    // was: this.Ka.length > 0
    return true;
  }
}

// ---------------------------------------------------------------------------
// AdUxAction
// ---------------------------------------------------------------------------

/**
 * Represents a single ad UX update action, carrying content, type and id.
 *
 * [was: Uzw]
 */
export class AdUxAction {
  /**
   * @param {*}      content     The action payload content.
   * @param {string} actionType  The type of ad UX action.
   * @param {string} id          Unique identifier for this action.
   */
  constructor(content, actionType, id) {
    this.content = content;     // was: this.content = Q
    this.actionType = actionType; // was: this.actionType = c
    this.id = id;               // was: this.id = W
  }
}

// ---------------------------------------------------------------------------
// AdUxUpdateListener
// ---------------------------------------------------------------------------

/**
 * Listens for `onAdUxUpdate` events from the player API and dispatches
 * individual {@link AdUxAction} items to a handler method.
 *
 * [was: ddm]
 */
export class AdUxUpdateListener /* extends aB (event handler base) */ {
  /**
   * @param {Object} api  The player API to listen on.
   */
  constructor(api) {
    // super();
    this.api_ = api; // was: this.W = Q
    // this.B(this.api_, "onAdUxUpdate", this.onUpdate_);
  }

  /**
   * Handles batched ad UX updates.
   *
   * @param {Array} updates  Array of update objects.
   * @private
   */
  onUpdate_(updates) { // was: D(Q)
    if (!Array.isArray(updates)) return;
    for (const update of updates) {
      if (update instanceof AdUxAction) {
        this.handleAction_(update); // was: this.j(c)
      }
    }
  }

  /**
   * Override in subclasses to handle individual actions.
   *
   * @param {AdUxAction} action
   * @abstract
   */
  handleAction_(action) { // was: j(c) — abstract in base
    // no-op; subclasses override
  }
}
