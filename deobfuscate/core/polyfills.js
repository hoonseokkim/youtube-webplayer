import { trunc } from '../proto/messages-core.js';
/**
 * Polyfills — ES2015+ feature detection and shims installed by YouTube's base.js.
 *
 * Deobfuscated from: player_es6.vflset/en_US/base.js
 *   Polyfill registry & installer:
 *     Qn   (polyfillRegistry)            line ~57010
 *     c3   (createPolyfillAccessor)       line ~78
 *     g.W3 (registerPolyfill)             line ~84
 *     r0   (installOnTypedArrays)         line ~88
 *     UO   (installPolyfill)              line ~94
 *     K7   (installOnPath)                line ~98
 *   Core shims:
 *     cy3  (objectCreate)                 line ~57011
 *     QW_  (defineProperty)               line ~57017
 *     IW   (globalRef)                    line ~57024
 *     mm   (typedArrayNames)              line ~57025
 *     Wmm  (setPrototypeOf)               line ~57028
 *   Inheritance helper:
 *     mX7  (inherits)                     line ~117
 *   Polyfilled APIs:
 *     Symbol.dispose                      line ~57029
 *     SuppressedError                     line ~57032
 *     String.prototype.replaceAll         line ~57048
 *     Array.prototype.at / TypedArray.at  lines ~57055-57060
 *     String.prototype.at                 line ~57061
 *     Promise.withResolvers               line ~57064
 *     Array.prototype.findLastIndex       lines ~57078-57086
 *   Helpers:
 *     Ay   (atPolyfill)                   line ~124
 *     xx   (findLastHelper)               line ~131
 */

// ---------------------------------------------------------------------------
// Polyfill Registry
// ---------------------------------------------------------------------------

/**
 * Internal registry array that holds polyfill implementations by numeric slot.
 * Polyfills are registered with {@link registerPolyfill} and accessed via
 * {@link createPolyfillAccessor}.
 *
 * @type {Array<Function>}
 */
/* was: Qn */
export const polyfillRegistry = []; // was: Qn = []

/**
 * Create a function that, when called, delegates to the polyfill stored at
 * the given slot index in {@link polyfillRegistry}.
 *
 * @param {number} slot - Index into the polyfill registry. [was: Q]
 * @returns {Function} A wrapper that calls `polyfillRegistry[slot]`.
 */
/* was: c3 */
export function createPolyfillAccessor(slot) { // was: c3
  return function () {
    return polyfillRegistry[slot].apply(this, arguments);
  };
}

/**
 * Register a polyfill implementation at the given slot index.
 *
 * @param {number}   slot - Index into the polyfill registry. [was: Q]
 * @param {Function} impl - The polyfill function.             [was: c]
 * @returns {Function} The registered implementation.
 */
/* was: g.W3 */
export function registerPolyfill(slot, impl) { // was: g.W3
  return (polyfillRegistry[slot] = impl);
}

// ---------------------------------------------------------------------------
// Core Object Shims
// ---------------------------------------------------------------------------

/**
 * `Object.create` polyfill.  Uses the native implementation when available;
 * otherwise falls back to a constructor-prototype pattern.
 *
 * @param {object|null} proto - The prototype to create from. [was: Q]
 * @returns {object} A new object with the given prototype.
 */
/* was: cy3 */
export const objectCreate = // was: cy3
  typeof Object.create === "function"
    ? Object.create
    : function (proto) { // was: Q
        function Surrogate() {} // was: c
        Surrogate.prototype = proto;
        return new Surrogate();
      };

/**
 * `Object.defineProperty` polyfill.  Uses the native implementation when
 * `Object.defineProperties` exists (a proxy for full ES5 support); otherwise
 * falls back to direct property assignment (ignoring descriptors).
 *
 * @param {object} target   - The target object.            [was: Q]
 * @param {string} property - The property name.             [was: c]
 * @param {PropertyDescriptor} descriptor - Property descriptor. [was: W]
 * @returns {object} The target object.
 */
/* was: QW_ */
export const defineProperty = // was: QW_
  typeof Object.defineProperties === "function"
    ? Object.defineProperty
    : function (target, property, descriptor) { // was: Q, c, W
        if (target === Array.prototype || target === Object.prototype) {
          return target;
        }
        target[property] = descriptor.value;
        return target;
      };

/**
 * Reference to the global object (`globalThis`).
 *
 * @type {typeof globalThis}
 */
/* was: IW */
export const globalRef = globalThis; // was: IW

/**
 * `Object.setPrototypeOf` — native reference, used by {@link inherits}.
 *
 * @type {typeof Object.setPrototypeOf}
 */
/* was: Wmm */
export const setPrototypeOf = Object.setPrototypeOf; // was: Wmm

// ---------------------------------------------------------------------------
// TypedArray Names
// ---------------------------------------------------------------------------

/**
 * List of TypedArray name prefixes used when installing polyfills across all
 * typed array prototypes (e.g., `Uint8Array.prototype.at`).
 *
 * Starts with the base nine types; BigInt64 / BigUint64 are appended if
 * `BigInt64Array` exists on `globalThis`.
 *
 * @type {string[]}
 */
/* was: mm */
export const typedArrayNames = // was: mm
  "Int8 Uint8 Uint8Clamped Int16 Uint16 Int32 Uint32 Float32 Float64".split(" ");

if (globalRef.BigInt64Array) {
  typedArrayNames.push("BigInt64");
  typedArrayNames.push("BigUint64");
}

// ---------------------------------------------------------------------------
// Polyfill Installation Utilities
// ---------------------------------------------------------------------------

/**
 * Walk a dotted property path on {@link globalRef} and install a polyfill
 * at the leaf position — but only if the factory returns a non-null value
 * different from the existing binding.
 *
 * @param {string}   path    - Dotted path, e.g. `"String.prototype.replaceAll"`. [was: Q]
 * @param {Function} factory - Factory `(existing) => replacement | null`.         [was: c]
 */
/* was: K7 */
function installOnPath(path, factory) { // was: K7
  let current = globalRef; // was: W = IW
  const parts = path.split("."); // was: Q = Q.split(".")
  for (let i = 0; i < parts.length - 1; i++) { // was: m
    const segment = parts[i]; // was: K
    if (!(segment in current)) return;
    current = current[segment];
  }
  const leafName = parts[parts.length - 1]; // was: Q (reused)
  const existing = current[leafName]; // was: m (reused)
  const replacement = factory(existing); // was: c (reused)
  if (replacement !== existing && replacement != null) {
    defineProperty(current, leafName, {
      configurable: true,
      writable: true,
      value: replacement,
    });
  }
}

/**
 * Install a polyfill at a global dotted path. A thin wrapper around
 * {@link installOnPath}.
 *
 * @param {string}   path    - Dotted path, e.g. `"Symbol.dispose"`.      [was: Q]
 * @param {Function} factory - Factory `(existing) => replacement | null`. [was: c]
 */
/* was: UO */
export function installPolyfill(path, factory) { // was: UO
  if (factory) {
    installOnPath(path, factory);
  }
}

/**
 * Install a polyfill on every TypedArray prototype.
 *
 * For each name in {@link typedArrayNames}, installs the factory result on
 * `<Name>Array.prototype.<method>`.
 *
 * @param {string}   method  - Method name to polyfill (e.g. `"at"`).     [was: Q]
 * @param {Function} factory - Factory `(existing) => replacement | null`. [was: c]
 */
/* was: r0 */
export function installOnTypedArrays(method, factory) { // was: r0
  if (factory) {
    for (let i = 0; i < typedArrayNames.length; i++) { // was: W
      installOnPath(typedArrayNames[i] + "Array.prototype." + method, factory);
    }
  }
}

// ---------------------------------------------------------------------------
// Inheritance Helper
// ---------------------------------------------------------------------------

/**
 * Set up prototype-chain inheritance between two constructors, mimicking
 * the Closure Library `goog.inherits` pattern.
 *
 * After calling `inherits(Child, Parent)`:
 *   - `Child.prototype` is a new object whose `[[Prototype]]` is `Parent.prototype`
 *   - `Child.prototype.constructor` points back to `Child`
 *   - `Child.FS` (was: `FS`) holds a reference to `Parent.prototype` (the "super" prototype)
 *   - `Object.setPrototypeOf(Child, Parent)` is called so static methods inherit
 *
 * @param {Function} childCtor  - The child constructor.  [was: Q]
 * @param {Function} parentCtor - The parent constructor. [was: c]
 */
/* was: mX7 */
export function inherits(childCtor, parentCtor) { // was: mX7
  childCtor.prototype = objectCreate(parentCtor.prototype); // was: cy3(c.prototype)
  childCtor.prototype.constructor = childCtor;
  setPrototypeOf(childCtor, parentCtor); // was: Wmm(Q, c)
  childCtor.FS = parentCtor.prototype; // was: Q.FS = c.prototype — "super" prototype reference
}

// ---------------------------------------------------------------------------
// Array / String `.at()` Polyfill
// ---------------------------------------------------------------------------

/**
 * Shared implementation for `Array.prototype.at`, `String.prototype.at`,
 * and `TypedArray.prototype.at`.
 *
 * @this {Array|string|TypedArray}
 * @param {number} index - The index (may be negative). [was: Q]
 * @returns {*} The element at the resolved index, or `undefined`.
 */
/* was: Ay */
export function atPolyfill(index) { // was: Ay
  index = Math.trunc(index) || 0; // was: Q = Math.trunc(Q) || 0
  if (index < 0) {
    index += this.length;
  }
  if (!(index < 0 || index >= this.length)) {
    return this[index];
  }
}

// ---------------------------------------------------------------------------
// findLast / findLastIndex Helper
// ---------------------------------------------------------------------------

/**
 * Internal helper for `findLastIndex` (and potentially `findLast`).
 *
 * Iterates from the end of an array-like, returning the first match.
 *
 * @param {Array|string} collection - The collection to search. [was: Q]
 * @param {Function}     predicate  - Test function `(element, index, collection) => boolean`. [was: c]
 * @param {*}            [thisArg]  - Value to use as `this` when calling predicate.            [was: W]
 * @returns {{ index: number, value: * }} The matched index and value, or `{ index: -1, value: undefined }`.
 */
/* was: xx */
export function findLastHelper(collection, predicate, thisArg) { // was: xx
  if (collection instanceof String) {
    collection = String(collection);
  }
  for (let i = collection.length - 1; i >= 0; i--) { // was: m
    const element = collection[i]; // was: K
    if (predicate.call(thisArg, element, i, collection)) {
      return {
        index: i,    // was: xK
        value: element, // was: wQ
      };
    }
  }
  return {
    index: -1,      // was: xK: -1
    value: undefined, // was: wQ: void 0
  };
}

// ---------------------------------------------------------------------------
// Polyfill Installations
// ---------------------------------------------------------------------------

/**
 * Install all polyfills. In the original source these are executed at module
 * evaluation time (lines 57029-57087). Call this once during bootstrap.
 */
export function installAllPolyfills() {
  // --- Symbol.dispose ---
  // was: UO("Symbol.dispose", function(Q) { return Q ? Q : Symbol("Symbol.dispose") })
  installPolyfill("Symbol.dispose", function (existing) { // was: Q
    return existing ? existing : Symbol("Symbol.dispose");
  });

  // --- SuppressedError ---
  // was: UO("SuppressedError", function(Q) { ... })
  installPolyfill("SuppressedError", function (existing) { // was: Q
    /**
     * Polyfill for the TC39 SuppressedError proposal.
     *
     * @param {Error}  error      - The primary error.          [was: W]
     * @param {Error}  suppressed - The suppressed error.       [was: m]
     * @param {string} message    - Human-readable description. [was: K]
     * @constructor
     */
    function SuppressedErrorPolyfill(error, suppressed, message) { // was: c(W, m, K)
      if (!(this instanceof SuppressedErrorPolyfill)) {
        return new SuppressedErrorPolyfill(error, suppressed, message);
      }
      const wrapped = Error(message); // was: K = Error(K)
      if ("stack" in wrapped) {
        this.stack = wrapped.stack;
      }
      this.message = wrapped.message;
      this.error = error; // was: this.error = W
      this.suppressed = suppressed; // was: this.suppressed = m
    }

    if (existing) return existing;

    inherits(SuppressedErrorPolyfill, Error); // was: mX7(c, Error)
    SuppressedErrorPolyfill.prototype.name = "SuppressedError";
    return SuppressedErrorPolyfill;
  });

  // --- String.prototype.replaceAll ---
  // was: UO("String.prototype.replaceAll", function(Q) { ... })
  installPolyfill("String.prototype.replaceAll", function (existing) { // was: Q
    if (existing) return existing;

    /**
     * @this {string}
     * @param {string|RegExp} searchValue  - The value to search for.  [was: c]
     * @param {string}        replaceValue - The replacement string.    [was: W]
     * @returns {string}
     */
    return function replaceAll(searchValue, replaceValue) { // was: c, W
      if (searchValue instanceof RegExp && !searchValue.global) {
        throw new TypeError(
          "String.prototype.replaceAll called with a non-global RegExp argument."
        );
      }
      if (searchValue instanceof RegExp) {
        return this.replace(searchValue, replaceValue);
      }
      return this.replace(
        new RegExp(
          String(searchValue)
            .replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1")
            .replace(/\x08/g, "\\x08"),
          "g"
        ),
        replaceValue
      );
    };
  });

  // --- Array.prototype.at ---
  // was: UO("Array.prototype.at", function(Q) { return Q ? Q : Ay })
  installPolyfill("Array.prototype.at", function (existing) {
    return existing ? existing : atPolyfill;
  });

  // --- TypedArray.prototype.at ---
  // was: r0("at", function(Q) { return Q ? Q : Ay })
  installOnTypedArrays("at", function (existing) {
    return existing ? existing : atPolyfill;
  });

  // --- String.prototype.at ---
  // was: UO("String.prototype.at", function(Q) { return Q ? Q : Ay })
  installPolyfill("String.prototype.at", function (existing) {
    return existing ? existing : atPolyfill;
  });

  // --- Promise.withResolvers ---
  // was: UO("Promise.withResolvers", function(Q) { ... })
  installPolyfill("Promise.withResolvers", function (existing) { // was: Q
    if (existing) return existing;

    /**
     * Polyfill for `Promise.withResolvers()` (TC39 Stage 4).
     *
     * @returns {{ promise: Promise, resolve: Function, reject: Function }}
     */
    return function withResolvers() {
      let resolve; // was: c
      let reject; // was: W
      return {
        promise: new Promise(function (res, rej) { // was: m, K
          resolve = res;
          reject = rej;
        }),
        resolve,
        reject,
      };
    };
  });

  // --- Array.prototype.findLastIndex ---
  // was: UO("Array.prototype.findLastIndex", function(Q) { ... })
  installPolyfill("Array.prototype.findLastIndex", function (existing) { // was: Q
    if (existing) return existing;

    /**
     * @this {Array}
     * @param {Function} predicate - Test function.       [was: c]
     * @param {*}        [thisArg] - Binding for `this`. [was: W]
     * @returns {number} Last matching index, or -1.
     */
    return function findLastIndex(predicate, thisArg) { // was: c, W
      return findLastHelper(this, predicate, thisArg).index; // was: xx(this, c, W).xK
    };
  });

  // --- TypedArray.prototype.findLastIndex ---
  // was: r0("findLastIndex", function(Q) { ... })
  installOnTypedArrays("findLastIndex", function (existing) {
    if (existing) return existing;

    return function findLastIndex(predicate, thisArg) { // was: c, W
      return findLastHelper(this, predicate, thisArg).index; // was: xx(this, c, W).xK
    };
  });
}
