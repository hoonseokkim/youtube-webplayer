// Source: player_es6.vflset/en_US/base.js, lines ~1563–1983, ~9356–9422
// DOM manipulation utilities extracted and deobfuscated from YouTube's base.js

/**
 * Create a DOM element.
 * @param {string} tagName - The tag name of the element to create.
 * @returns {Element}
 */
import { contains } from './string-utils.js';
import { remove } from './array-utils.js';
/* was: g.HB */
export function createElement(tagName) {
  return createElementFromDocument(document, tagName);
}

/**
 * Create an element on a specific document, handling XHTML content type.
 * @param {Document} doc
 * @param {string} tagName
 * @returns {Element}
 */
/* was: ns */
function createElementFromDocument(doc, tagName) {
  tagName = String(tagName);
  if (doc.contentType === 'application/xhtml+xml') {
    tagName = tagName.toLowerCase();
  }
  return doc.createElement(tagName);
}

/**
 * Create a text node.
 * @param {*} text - The text content (will be converted to string).
 * @returns {Text}
 */
/* was: g.Nn */
export function createTextNode(text) {
  return document.createTextNode(String(text));
}

/**
 * Append a child node to a parent.
 * @param {Node} parent
 * @param {Node} child
 */
/* was: g.iI */
export function appendChild(parent, child) {
  parent.appendChild(child);
}

/**
 * Remove all child nodes from an element.
 * @param {Node} node
 */
/* was: g.y0 */
export function removeChildren(node) {
  let child;
  while ((child = node.firstChild)) {
    node.removeChild(child);
  }
}

/**
 * Insert a child node at a specific index.
 * @param {Node} parent
 * @param {Node} child
 * @param {number} index
 */
/* was: Sz */
export function insertChildAt(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null);
}

/**
 * Remove a node from its parent and return it.
 * @param {Node} node
 * @returns {Node|null}
 */
/* was: g.FQ */
export function removeNode(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
}

/**
 * Check if a node contains another node.
 * @param {Node} parent
 * @param {Node} child
 * @returns {boolean}
 */
/* was: g.ZJ */
export function containsNode(parent, child) {
  return parent && child ? parent == child || parent.contains(child) : false;
}

/**
 * Set the text content of an element, with fallbacks for older node types.
 * @param {Node} node
 * @param {string} text
 */
/* was: g.EZ */
export function setTextContent(node, text) {
  if ('textContent' in node) {
    node.textContent = text;
  } else if (node.nodeType == 3) {
    node.data = String(text);
  } else if (node.firstChild && node.firstChild.nodeType == 3) {
    while (node.lastChild != node.firstChild) {
      node.removeChild(node.lastChild);
    }
    node.firstChild.data = String(text);
  } else {
    removeChildren(node);
    const ownerDoc = node.nodeType == 9 ? node : node.ownerDocument || node.document;
    node.appendChild(ownerDoc.createTextNode(String(text)));
  }
}

/**
 * Set CSS styles on an element.
 * Accepts either (element, value, propertyName) or (element, {prop: value, ...}).
 * @param {Element} element
 * @param {string|Object} styleOrValue
 * @param {string} [propertyName]
 */
/* was: g.JA */
export function setStyle(element, styleOrValue, propertyName) {
  if (typeof styleOrValue === 'string') {
    setSingleStyle(element, propertyName, styleOrValue);
  } else {
    for (const prop in styleOrValue) {
      setSingleStyle(element, styleOrValue[prop], prop);
    }
  }
}

/**
 * Set a single CSS style property on an element, handling vendor prefixes.
 * @param {Element} element
 * @param {*} value
 * @param {string} property
 */
/* was: Mn */
function setSingleStyle(element, value, property) {
  const resolved = resolveStyleProperty(element, property);
  if (resolved) {
    if (/^--/.test(resolved)) {
      element.style.setProperty(resolved, value);
    } else {
      element.style[resolved] = value;
    }
  }
}

/** @type {Object<string, string>} Cache for resolved style property names */
const stylePropertyCache = {};

/**
 * Resolve a CSS property name to its actual form (with vendor prefix if needed).
 * @param {Element} element
 * @param {string} property
 * @returns {string}
 */
/* was: R_ */
function resolveStyleProperty(element, property) {
  let resolved = stylePropertyCache[property];
  if (!resolved) {
    let camelCased = camelCase(property);
    resolved = camelCased;
    if (element.style[camelCased] === undefined) {
      // Try vendor-prefixed version (Webkit or Moz)
      const prefixed = 'Webkit' + capitalizeWords(camelCased);
      if (element.style[prefixed] !== undefined) {
        resolved = prefixed;
      }
    }
    stylePropertyCache[property] = resolved;
  }
  return resolved;
}

/**
 * Get a computed/inline style value from an element.
 * @param {Element} element
 * @param {string} property
 * @returns {string}
 */
/* was: g.ps */
export function getStyle(element, property) {
  const value = element.style[camelCase(property)];
  return typeof value !== 'undefined' ? value : element.style[resolveStyleProperty(element, property)] || '';
}

/**
 * Show or hide an element by toggling its display style.
 * @param {Element} element
 * @param {boolean} visible - true to show, false to hide.
 */
/* was: g.ee */
export function showElement(element, visible) {
  element.style.display = visible ? '' : 'none';
}

/**
 * Set the position of an element (left/top).
 * @param {Element} element
 * @param {number|{x: number, y: number}} xOrPoint
 * @param {number} [y]
 */
/* was: g.ml */
export function setPosition(element, xOrPoint, y) {
  let x;
  if (xOrPoint && typeof xOrPoint === 'object' && 'x' in xOrPoint) {
    x = xOrPoint.x;
    y = xOrPoint.y;
  } else {
    x = xOrPoint;
  }
  element.style.left = toPixelUnit(x, false);
  element.style.top = toPixelUnit(y, false);
}

/**
 * Set the size of an element (width/height).
 * @param {Element} element
 * @param {number|{width: number, height: number}} widthOrSize
 * @param {number} [height]
 */
/* was: g.XI */
export function setSize(element, widthOrSize, height) {
  if (widthOrSize && typeof widthOrSize === 'object' && 'width' in widthOrSize) {
    height = widthOrSize.height;
    widthOrSize = widthOrSize.width;
  } else if (height === undefined) {
    throw Error('missing height argument');
  }
  element.style.width = toPixelUnit(widthOrSize, true);
  element.style.height = toPixelUnit(height, true);
}

/**
 * Convert a numeric value to a pixel string.
 * @param {number|string} value
 * @param {boolean} round - Whether to round the number.
 * @returns {string}
 */
/* was: WS */
function toPixelUnit(value, round) {
  if (typeof value == 'number') {
    value = (round ? Math.round(value) : value) + 'px';
  }
  return value;
}

/**
 * Get the page offset position of an element.
 * @param {Element} element
 * @returns {{x: number, y: number}}
 */
/* was: g.Tk */
export function getPageOffset(element) {
  const doc = element.nodeType == 9 ? element : element.ownerDocument || element.document;
  const result = { x: 0, y: 0 };
  if (element == (doc ? (doc.nodeType == 9 ? doc : doc.ownerDocument || doc.document) : document).documentElement) {
    return result;
  }
  const rect = getBoundingClientRectSafe(element);
  const scrollEl = doc.scrollingElement || doc.documentElement;
  const view = doc.defaultView;
  const scrollX = view?.pageXOffset || scrollEl.scrollLeft;
  const scrollY = view?.pageYOffset || scrollEl.scrollTop;
  result.x = rect.left + scrollX;
  result.y = rect.top + scrollY;
  return result;
}

/**
 * Safely get the bounding client rect of an element.
 * @param {Element} element
 * @returns {DOMRect|{left:0, top:0, right:0, bottom:0}}
 */
/* was: KN */
function getBoundingClientRectSafe(element) {
  try {
    return element.getBoundingClientRect();
  } catch {
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }
}

// ── CSS class manipulation ──

/**
 * Get the className string from an element (handles SVG and other non-standard elements).
 * @param {Element} element
 * @returns {string}
 */
/* was: Ap */
function getClassName(element) {
  return typeof element.className == 'string'
    ? element.className
    : (element.getAttribute && element.getAttribute('class')) || '';
}

/**
 * Get the list of CSS classes on an element.
 * @param {Element} element
 * @returns {string[]}
 */
/* was: eC */
function getClassList(element) {
  return element.classList ? element.classList : getClassName(element).match(/\S+/g) || [];
}

/**
 * Set the full CSS class string of an element.
 * @param {Element} element
 * @param {string} className
 */
/* was: g.VN */
export function setClassName(element, className) {
  if (typeof element.className == 'string') {
    element.className = className;
  } else if (element.setAttribute) {
    element.setAttribute('class', className);
  }
}

/**
 * Check if an element has a specific CSS class.
 * @param {Element} element
 * @param {string} className
 * @returns {boolean}
 */
/* was: g.B7 */
export function hasClass(element, className) {
  if (element.classList) {
    return element.classList.contains(className);
  }
  const classes = getClassList(element);
  return Array.prototype.indexOf.call(classes, className, undefined) >= 0;
}

/**
 * Add a CSS class to an element.
 * @param {Element} element
 * @param {string} className
 */
/* was: g.xK */
export function addClass(element, className) {
  if (element.classList) {
    element.classList.add(className);
  } else if (!hasClass(element, className)) {
    const current = getClassName(element);
    setClassName(element, current + (current.length > 0 ? ' ' + className : className));
  }
}

/**
 * Remove a CSS class from an element.
 * @param {Element} element
 * @param {string} className
 */
/* was: g.n6 */
export function removeClass(element, className) {
  if (element.classList) {
    element.classList.remove(className);
  } else if (hasClass(element, className)) {
    setClassName(
      element,
      Array.prototype.filter
        .call(getClassList(element), (c) => c != className)
        .join(' ')
    );
  }
}

/**
 * Remove multiple CSS classes from an element.
 * @param {Element} element
 * @param {string[]} classNames
 */
/* was: g.De */
export function removeClasses(element, classNames) {
  if (element.classList) {
    Array.prototype.forEach.call(classNames, (cls) => {
      removeClass(element, cls);
    });
  } else {
    setClassName(
      element,
      Array.prototype.filter
        .call(getClassList(element), (cls) => !classNames.includes(cls))
        .join(' ')
    );
  }
}

/**
 * Toggle a CSS class on an element based on a boolean condition.
 * @param {Element} element
 * @param {string} className
 * @param {boolean} enable - true to add, false to remove.
 */
/* was: g.L */
export function toggleClass(element, className, enable) {
  if (enable) {
    addClass(element, className);
  } else {
    removeClass(element, className);
  }
}

/**
 * Toggle a CSS class on an element (flip current state).
 * @param {Element} element
 * @param {string} className
 */
/* was: tp */
export function toggleClassFlip(element, className) {
  const shouldAdd = !hasClass(element, className);
  toggleClass(element, className, shouldAdd);
}

// ── Query helpers ──

/**
 * Get elements by tag name.
 * @param {string} tagName
 * @param {Document|Element} [root]
 * @returns {HTMLCollection}
 */
/* was: g.o_ */
export function getElementsByTagName(tagName, root) {
  return (root || document).getElementsByTagName(String(tagName));
}

/**
 * Query all elements matching a CSS class selector.
 * @param {string} className
 * @param {Document|Element} [root]
 * @returns {NodeList}
 */
/* was: g.rj */
export function querySelectorAllByClass(className, root) {
  return (root || document).querySelectorAll('.' + className);
}

/**
 * Find the first element matching a CSS class.
 * @param {string} className
 * @param {Document|Element} [root]
 * @returns {Element|null}
 */
/* was: g.I_ */
export function findFirstByClass(className, root) {
  const context = root || document;
  if (context.getElementsByClassName) {
    return context.getElementsByClassName(className)[0] || null;
  }
  return (root || document).querySelector(className ? '.' + className : '') || null;
}

// ── Internal helpers (not exported but used above) ──

/**
 * Convert a hyphenated string to camelCase.
 * @param {string} str
 * @returns {string}
 */
/* was: Ey */
function camelCase(str) {
  return String(str).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}

/**
 * Capitalize the first letter of each word segment (for vendor prefix building).
 * @param {string} str
 * @returns {string}
 */
/* was: G7d */
function capitalizeWords(str) {
  return str.replace(RegExp('(^|[\\s]+)([a-z])', 'g'), (_match, space, letter) => {
    return space + letter.toUpperCase();
  });
}

// ---------------------------------------------------------------------------
// Window / anchor helpers
// ---------------------------------------------------------------------------

/**
 * Safe window.open() wrapper. [was: g.TY]
 */
export function safeWindowOpen(windowObj, url, target, features) {
  return windowObj.open(url, target, features);
}

/**
 * Safely set href on anchor element. [was: g.QC]
 */
export function setAnchorHref(element, url) {
  element.href = url;
}

// ---------------------------------------------------------------------------
// Element size measurement  [was: g.A4, lines 1952-1968]
// ---------------------------------------------------------------------------

/**
 * Get the computed size of an element, even if it has `display: none`.
 *
 * If the element is hidden (`display: none`), the function temporarily makes
 * it visible (absolutely positioned and invisible) to measure its dimensions,
 * then restores the original styles.
 *
 * Returns `{ width, height }` via offsetWidth/offsetHeight or
 * getBoundingClientRect as a fallback.
 *
 * [was: g.A4]
 *
 * @param {Element} element
 * @returns {{ width: number, height: number }}
 */
export function getElementSize(element) {
  if (getComputedStyleValue(element, 'display') !== 'none') {
    return getElementSizeRaw(element);
  }
  const style = element.style;
  const savedDisplay = style.display;
  const savedVisibility = style.visibility;
  const savedPosition = style.position;
  style.visibility = 'hidden';
  style.position = 'absolute';
  style.display = 'inline';
  const size = getElementSizeRaw(element);
  style.display = savedDisplay;
  style.position = savedPosition;
  style.visibility = savedVisibility;
  return size;
} // [was: g.A4]

/**
 * Read the raw size of an element via offsetWidth/offsetHeight, falling back
 * to getBoundingClientRect.
 * [was: Q0m]
 * @param {Element} element
 * @returns {{ width: number, height: number }}
 */
function getElementSizeRaw(element) {
  const w = element.offsetWidth;
  const h = element.offsetHeight;
  const isWebKit = /WebKit/.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const needsFallback = isWebKit && !w && !h;
  if ((w === undefined || needsFallback) && element.getBoundingClientRect) {
    const rect = getBoundingClientRectSafe(element);
    return { width: rect.right - rect.left, height: rect.bottom - rect.top };
  }
  return { width: w, height: h };
}

/**
 * Get a computed style value from an element.
 * [was: cS]
 * @param {Element} element
 * @param {string} property
 * @returns {string}
 */
function getComputedStyleValue(element, property) {
  const win = element.ownerDocument?.defaultView || window;
  const computed = win.getComputedStyle(element, null);
  return computed ? computed[property] || computed.getPropertyValue(property) || '' : '';
}
