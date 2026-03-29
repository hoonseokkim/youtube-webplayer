import { createElement } from '../core/dom-utils.js';

/**
 * UIComponent — base UI component with DOM element management.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Class definition: lines ~69409-69482  (g.Mu)
 *   Extends:          g.qK (Disposable)
 *
 * Manages a DOM element tree created from a declarative template object.
 * Supports template binding (mustache-style `{{key}}` placeholders),
 * CSS-class-based element lookup, and SVG element creation.
 *
 * [was: g.Mu]
 */

import { Disposable } from '../core/disposable.js';
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { startsWith, endsWith } from '../core/string-utils.js';
import { appendChild, createTextNode } from '../core/dom-utils.js';

/**
 * Resolve a template binding placeholder.
 *
 * If `value` is a mustache string like `"{{foo}}"`, it registers the
 * element/attribute pair in `component.templateBindings_` and returns
 * `undefined` (so nothing is written yet).  Otherwise returns the
 * value unchanged.
 *
 * @param {UIComponent} component
 * @param {Element}     element
 * @param {string}      attrName
 * @param {string}      value
 * @returns {string|undefined}
 * @private
 */
/* was: K2 */
function resolveBinding(component, element, attrName, value) {
  // The original K2 checks for `{{…}}` patterns and stashes a reference
  // so that later calls to updateValue() can fill them in.
  if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
    component.templateBindings_[value] = [element, attrName];
    return undefined;
  }
  return value;
}

/**
 * Set an attribute (or property) on an element, handling special cases
 * for `class`, `style`, boolean attributes, etc.
 *
 * @param {UIComponent} component
 * @param {Element}     element
 * @param {string}      name
 * @param {*}           value
 * @private
 */
/* was: TW */
function setAttribute(component, element, name, value) {
  if (value === undefined || value === null) return;
  if (typeof value === 'boolean') {
    if (value) {
      element.setAttribute(name, '');
    } else {
      element.removeAttribute(name);
    }
  } else {
    element.setAttribute(name, value);
  }
}

/**
 * Generate a unique ID for SVG shadow-use elements.
 * @returns {string}
 * @private
 */
/* was: mU */
let idCounter_ = 1; // was: f5w
function generateUniqueId() {
  return 'ytp-id-' + idCounter_++;
}

/**
 * Insert a child node at a specific index within a parent.
 *
 * @param {Element} parent
 * @param {Node}    child
 * @param {number}  index
 * @private
 */
/* was: Sz */
function insertChildAt(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base UI component.
 *
 * Holds a DOM `element` created from a template descriptor and provides:
 *   - CSS-class-keyed element lookup via `getElementByClass()`
 *   - Mustache-style template binding via `update()` / `updateValue()`
 *   - Attach / detach lifecycle
 *
 * Template descriptor shape (the `Q` argument to the constructor):
 * ```
 * {
 *   C:  string,          // tag name
 *   Z:  string,          // CSS class (single)
 *   yC: string[],        // CSS classes (multiple)
 *   eG: string,          // single text-child content
 *   V:  Array,           // children (strings, sub-descriptors, or elements)
 *   N:  Object,          // attributes map  { name: value }
 *   rA: boolean,         // SVG shadow-use flag
 * }
 * ```
 *
 * [was: g.Mu]
 */
export class UIComponent extends Disposable {
  /**
   * Map from CSS class name to the corresponding DOM element.
   * @type {Object<string, Element>}
   */
  classElements_ = {}; // was: sC

  /**
   * Map from template placeholder (e.g. `"{{content}}"`) to
   * `[element, attributeName]` pairs for deferred value injection.
   * @type {Object<string, [Element, string]>}
   */
  templateBindings_ = {}; // was: rX

  /**
   * The root DOM element for this component.
   * @type {Element}
   */
  element;

  /**
   * @param {Object} template  A template descriptor object.
   */
  constructor(template) {
    super();
    this.classElements_ = {};
    this.templateBindings_ = {};
    this.element = this.createElement(template);
  }

  /**
   * Recursively creates a DOM element tree from a template descriptor.
   *
   * @param {Object}  template   The template descriptor.
   * @param {boolean} [isSvg]    Whether to create SVG namespace elements.
   * @returns {Element}
   */
  createElement(template, isSvg) {
    isSvg = isSvg || template.C === 'svg';

    let element;
    let cssClass = template.Z;
    let cssClasses = template.yC;

    if (isSvg) {
      element = document.createElementNS('http://www.w3.org/2000/svg', template.C);
      // was: g.LD check — force focusable="false" on SVG elements in IE/Edge
      // Omitted: legacy browser workaround
    } else {
      element = document.createElement(template.C); // was: g.HB(template.C)
    }

    // Single CSS class
    if (cssClass) {
      const resolved = resolveBinding(this, element, 'class', cssClass);
      if (resolved) {
        setAttribute(this, element, 'class', resolved);
        this.classElements_[resolved] = element;
      }
    } else if (cssClasses) {
      // Multiple CSS classes
      for (const cls of cssClasses) {
        this.classElements_[cls] = element;
      }
      setAttribute(this, element, 'class', cssClasses.join(' '));
    }

    // Children
    const singleChild = template.eG;
    const children = template.V;

    if (singleChild) {
      const resolved = resolveBinding(this, element, 'child', singleChild);
      if (resolved !== undefined) {
        element.appendChild(document.createTextNode(resolved)); // was: g.Nn(resolved)
      }
    } else if (children) {
      let shadowIndex = 0;
      for (const child of children) {
        if (!child) continue;

        if (typeof child === 'string') {
          // Text child
          const resolved = resolveBinding(this, element, 'child', child);
          if (resolved != null) {
            element.appendChild(document.createTextNode(resolved));
          }
        } else if (child.element) {
          // Already-built component
          element.appendChild(child.element);
        } else {
          // Sub-template descriptor
          const childDescriptor = child;
          const childElement = this.createElement(childDescriptor, isSvg);
          element.appendChild(childElement);

          // SVG shadow-use clone
          if (childDescriptor.rA) {
            const id = generateUniqueId();
            childElement.id = id;
            const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            useEl.setAttribute('class', 'ytp-svg-shadow');
            useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${id}`);
            insertChildAt(element, useEl, shadowIndex++);
          }
        }
      }
    }

    // Attributes
    const attrs = template.N;
    if (attrs) {
      for (const name of Object.keys(attrs)) {
        const raw = attrs[name];
        const value = typeof raw === 'string' ? resolveBinding(this, element, name, raw) : raw;
        setAttribute(this, element, name, value);
      }
    }

    return element;
  }

  /**
   * Returns the element that was registered under the given CSS class name.
   *
   * @param {string} className
   * @returns {Element|undefined}
   */
  /* was: z2 */
  getElementByClass(className) {
    return this.classElements_[className];
  }

  /**
   * Appends this component's element to a parent, optionally at a
   * specific child index.
   *
   * @param {Element} parent
   * @param {number}  [index]  If provided, inserts at this child index.
   */
  /* was: x0 */
  attachTo(parent, index) {
    if (typeof index === 'number') {
      insertChildAt(parent, this.element, index);
    } else {
      parent.appendChild(this.element);
    }
  }

  /**
   * Removes this component's element from its parent.
   */
  detach() {
    const createDatabaseDefinition = this.element;
    if (createDatabaseDefinition && createDatabaseDefinition.parentNode) {
      createDatabaseDefinition.parentNode.removeChild(createDatabaseDefinition); // was: g.FQ(this.element)
    }
  }

  /**
   * Batch-update multiple template bindings.
   *
   * @param {Object<string, *>} values  Keys are binding names, values are
   *                                     the new content to inject.
   */
  update(values) {
    for (const key of Object.keys(values)) {
      this.updateValue(key, values[key]);
    }
  }

  /**
   * Update a single template binding by name.
   *
   * @param {string} name   The binding name (without `{{…}}` delimiters).
   * @param {*}      value  The new value.
   */
  updateValue(name, value) {
    const binding = this.templateBindings_[`{{${name}}}`];
    if (binding) {
      setAttribute(this, binding[0], binding[1], value);
    }
  }

  /** @override */
  /* was: WA */
  disposeInternal() {
    this.classElements_ = {};
    this.templateBindings_ = {};
    this.detach();
    super.disposeInternal();
  }
}
