/**
 * DomEvent / BrowserEvent — wrappers around native browser DOM events.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   g.tG (DomEvent base):        line ~6883
 *   g.tG.prototype methods:      lines ~61679-61685
 *   HO   (BrowserEvent subclass): lines ~6889-6901 (constructor)
 *   HO.prototype.init:           lines ~61688-61716
 *   HO.prototype.stopPropagation: lines ~61718-61721
 *   HO.prototype.preventDefault:  lines ~61723-61727
 *   g.bw(HO, g.tG):              line ~61687
 *
 * g.tG is a minimal event base class (type, target, currentTarget,
 * stopPropagation, preventDefault).
 *
 * HO (BrowserEvent) extends g.tG and wraps a real native DOM event,
 * normalizing touch events, pointer events, and cross-browser differences.
 */

/**
 * Base event class — a lightweight wrapper providing a uniform interface.
 *
 * Not a true DOM Event subclass; this is YouTube's own event abstraction
 * used internally by EventTarget (g.$R).
 */
/* was: g.tG */
export class DomEvent {
  /**
   * @param {string}  type   - The event type string (e.g. 'click').
   * @param {Object}  [target] - The event target.
   */
  constructor(type, target) {
    /** @type {string} */
    this.type = type;

    /** @type {Object|null} */
    this.target = target;

    /** @type {Object|null} */
    this.currentTarget = target;

    /** @type {boolean} */
    this.defaultPrevented = false;

    /**
     * Whether propagation has been stopped.
     * @type {boolean}
     */
    this.propagationStopped_ = false; /* was: O */
  }

  /**
   * Stop the event from propagating further.
   */
  stopPropagation() {
    this.propagationStopped_ = true;
  }

  /**
   * Prevent the default browser action for this event.
   */
  preventDefault() {
    this.defaultPrevented = true;
  }
}

/**
 * BrowserEvent — wraps a native DOM event with normalized properties.
 *
 * Extends DomEvent and adds mouse/keyboard/pointer/touch normalization.
 * Created by the event dispatch system when a native DOM event fires.
 */
/* was: HO */
export class BrowserEvent extends DomEvent {
  /**
   * @param {Event}   [nativeEvent]    - The native DOM event to wrap.
   * @param {Element} [currentTarget]  - The element the listener is on.
   */
  constructor(nativeEvent, currentTarget) {
    super(nativeEvent ? nativeEvent.type : '');

    /** @type {Element|null} */
    this.relatedTarget = null;

    /** @type {Element|null} */
    this.currentTarget = null;

    /** @type {Element|null} */
    this.target = null;

    /** @type {number} */
    this.button = 0;

    /** @type {number} */
    this.screenX = 0;

    /** @type {number} */
    this.screenY = 0;

    /** @type {number} */
    this.clientX = 0;

    /** @type {number} */
    this.clientY = 0;

    /** @type {string} */
    this.key = '';

    /** @type {number} */
    this.keyCode = 0;

    /** @type {number} */
    this.charCode = 0;

    /** @type {boolean} */
    this.ctrlKey = false;

    /** @type {boolean} */
    this.altKey = false;

    /** @type {boolean} */
    this.shiftKey = false;

    /** @type {boolean} */
    this.metaKey = false;

    /** @type {*} */
    this.state = null;

    /** @type {number} */
    this.pointerId = 0;

    /** @type {string} */
    this.pointerType = '';

    /**
     * The underlying native DOM event.
     * @type {Event|null}
     */
    this.nativeEvent_ = null; /* was: W */

    if (nativeEvent) {
      this.init(nativeEvent, currentTarget);
    }
  }

  /**
   * Initialize from a native DOM event. Normalizes touch vs mouse,
   * copies key/button/modifier state, and handles cross-browser quirks.
   *
   * @param {Event}   nativeEvent   - The native DOM event.
   * @param {Element} currentTarget - The element the listener is attached to.
   */
  /* was: init */
  init(nativeEvent, currentTarget) {
    const type = this.type = nativeEvent.type;
    const touch = nativeEvent.changedTouches && nativeEvent.changedTouches.length
      ? nativeEvent.changedTouches[0]
      : null;

    this.target = nativeEvent.target || nativeEvent.srcElement;
    this.currentTarget = currentTarget;

    /* relatedTarget */
    let related = nativeEvent.relatedTarget;
    if (!related) {
      if (type === 'mouseover') {
        related = nativeEvent.fromElement;
      } else if (type === 'mouseout') {
        related = nativeEvent.toElement;
      }
    }
    this.relatedTarget = related;

    /* coordinates — prefer touch if present */
    if (touch) {
      this.clientX = touch.clientX !== undefined ? touch.clientX : touch.pageX;
      this.clientY = touch.clientY !== undefined ? touch.clientY : touch.pageY;
      this.screenX = touch.screenX || 0;
      this.screenY = touch.screenY || 0;
    } else {
      this.clientX = nativeEvent.clientX !== undefined ? nativeEvent.clientX : nativeEvent.pageX;
      this.clientY = nativeEvent.clientY !== undefined ? nativeEvent.clientY : nativeEvent.pageY;
      this.screenX = nativeEvent.screenX || 0;
      this.screenY = nativeEvent.screenY || 0;
    }

    /* button & key state */
    this.button = nativeEvent.button;
    this.keyCode = nativeEvent.keyCode || 0;
    this.key = nativeEvent.key || '';
    this.charCode = nativeEvent.charCode || (type === 'keypress' ? nativeEvent.keyCode : 0);

    /* modifier keys */
    this.ctrlKey = nativeEvent.ctrlKey;
    this.altKey = nativeEvent.altKey;
    this.shiftKey = nativeEvent.shiftKey;
    this.metaKey = nativeEvent.metaKey;

    /* pointer */
    this.pointerId = nativeEvent.pointerId || 0;
    this.pointerType = nativeEvent.pointerType;

    /* state (for popstate events etc.) */
    this.state = nativeEvent.state;

    /* store native event */
    this.nativeEvent_ = nativeEvent;

    /* if the native event already had default prevented, mirror it */
    if (nativeEvent.defaultPrevented) {
      BrowserEvent.prototype.preventDefault.call(this);
    }
  }

  /**
   * Stop propagation on both the wrapper and the native event.
   */
  stopPropagation() {
    super.stopPropagation();
    if (this.nativeEvent_.stopPropagation) {
      this.nativeEvent_.stopPropagation();
    } else {
      this.nativeEvent_.cancelBubble = true;
    }
  }

  /**
   * Prevent default on both the wrapper and the native event.
   */
  preventDefault() {
    super.preventDefault();
    const evt = this.nativeEvent_;
    if (evt.preventDefault) {
      evt.preventDefault();
    } else {
      evt.returnValue = false;
    }
  }
}
