/**
 * ObservableTarget — an observable that supports pub/sub event channels.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Constructor:        line ~16142  (g.W1 = function)
 *   Prototype methods:  lines ~69376-69403  (g.W1.prototype.* via g.y alias)
 *   Inheritance set up: line ~69376  (g.bw(g.W1, g.qK))
 *
 * Internally delegates to a PubSub instance (g.$K):
 *   Constructor:        line ~9624   (g.$K = function)
 *   Prototype methods:  lines ~64847-64932 (g.$K.prototype.*)
 *   Inheritance:        line ~64847  (g.bw(g.$K, g.qK))
 */

import { Disposable } from './disposable.js';
import { AsyncQueue } from './bitstream-helpers.js'; // was: g.$K
import { EXP_748402147 } from '../proto/messages-core.js'; // was: Hw
import { splice, clear } from './array-utils.js';
import { forEach } from './event-registration.js';
import { queueMicrotask } from '../data/device-platform.js';
import { dispose } from '../ads/dai-cue-range.js';

// ---------------------------------------------------------------------------
// PubSub — internal subscription registry
// ---------------------------------------------------------------------------

/**
 * A simple publish/subscribe hub.
 *
 * Subscriptions are stored in a flat array (`this.slots_`) with three
 * consecutive entries per subscription: [topic, handler, context].
 * The integer index of the topic entry serves as the subscription key.
 *
 * @private
 */
/* was: g.$K */
class PubSub extends Disposable {
  /**
   * Next available slot index (always incremented, never reused).
   * Starts at 1 so that 0 is never a valid key (falsy guard).
   * @type {number}
   */
  nextSlot_ = 1; /* was: D */

  /**
   * Pending-unsubscribe queue — keys to remove after publishing finishes.
   * @type {Array<number>}
   */
  pendingRemoval_ = []; /* was: A */

  /**
   * Publish-depth counter; >0 while inside a publish() call.
   * @type {number}
   */
  publishDepth_ = 0; /* was: j */

  /**
   * Flat array holding subscription triples:
   *   [key+0] = topic string
   *   [key+1] = handler function
   *   [key+2] = context (this-binding) or undefined
   * @type {Array<*>}
   */
  slots_ = []; /* was: W */

  /**
   * Map from topic string to array of subscription keys.
   * @type {Object<string, Array<number>>}
   */
  topics_ = {}; /* was: O */

  /**
   * When true, handlers are invoked asynchronously (via microtask).
   * @type {boolean}
   */
  async_ = false; /* was: J */

  /**
   * @param {boolean} [async_=false]  If true, publish dispatches handlers
   *                                   asynchronously.
   */
  constructor(async_ = false) {
    super();
    this.async_ = !!async_;
  }

  /**
   * Subscribes a handler to a topic.
   *
   * @param {string}   topic     The event/topic name.
   * @param {Function} handler   The callback.
   * @param {Object}   [context] Optional `this` for the callback.
   * @returns {number}  A subscription key that can be passed to
   *                    {@link unsubscribeByKey}.
   */
  subscribe(topic, handler, context) {
    let keys = this.topics_[topic];
    if (!keys) {
      keys = this.topics_[topic] = [];
    }
    const key = this.nextSlot_;
    this.slots_[key] = topic;
    this.slots_[key + 1] = handler;
    this.slots_[key + 2] = context;
    this.nextSlot_ = key + 3;
    keys.push(key);
    return key;
  }

  /**
   * Removes a subscription identified by topic, handler, and context.
   *
   * @param {string}   topic
   * @param {Function} handler
   * @param {Object}   [context]
   * @returns {boolean} Whether the subscription was found and removed.
   */
  unsubscribe(topic, handler, context) {
    const keys = this.topics_[topic];
    if (keys) {
      const slots = this.slots_;
      const key = keys.find((k) => slots[k + 1] == handler && slots[k + 2] == context);
      if (key) {
        return this.unsubscribeByKey(key);
      }
    }
    return false;
  }

  /**
   * Removes a subscription by its key (as returned by {@link subscribe}).
   *
   * @param {number} key
   * @returns {boolean} Whether the key was valid.
   */
  /* was: bU */
  unsubscribeByKey(key) {
    const topic = this.slots_[key];
    if (topic) {
      const topicKeys = this.topics_[topic];
      if (this.publishDepth_ !== 0) {
        // Currently inside publish() — defer the actual removal.
        this.pendingRemoval_.push(key);
        this.slots_[key + 1] = () => {};
      } else {
        if (topicKeys) {
          // Remove key from the topic's key list.
          const idx = topicKeys.indexOf(key);
          if (idx !== -1) {
            topicKeys.splice(idx, 1);
          }
        }
        delete this.slots_[key];
        delete this.slots_[key + 1];
        delete this.slots_[key + 2];
      }
    }
    return !!topic;
  }

  /**
   * Publishes an event to all subscribers of the given topic.
   *
   * @param {string} topic  The topic/event name.
   * @param {...*}   args   Arguments forwarded to each handler.
   * @returns {boolean} Whether at least one handler was invoked.
   */
  publish(topic, ...rest) {
    const keys = this.topics_[topic];
    if (keys) {
      const args = rest;

      let i;
      if (this.async_) {
        // Asynchronous dispatch — each handler runs in its own microtask.
        for (i = 0; i < keys.length; i++) {
          const k = keys[i];
          _invokeAsync(this.slots_[k + 1], this.slots_[k + 2], args);
        }
      } else {
        // Synchronous dispatch.
        this.publishDepth_++;
        try {
          for (i = 0; i < keys.length && !this.isDisposed(); i++) {
            const k = keys[i];
            this.slots_[k + 1].apply(this.slots_[k + 2], args);
          }
        } finally {
          this.publishDepth_--;
          if (this.pendingRemoval_.length > 0 && this.publishDepth_ === 0) {
            let pending;
            while ((pending = this.pendingRemoval_.pop())) {
              this.unsubscribeByKey(pending);
            }
          }
        }
      }
      return i !== 0;
    }
    return false;
  }

  /**
   * Removes all subscriptions, or all subscriptions for a single topic.
   *
   * @param {string} [topic]  If provided, only that topic is cleared.
   */
  clear(topic) {
    if (topic) {
      const keys = this.topics_[topic];
      if (keys) {
        keys.forEach(this.unsubscribeByKey, this);
        delete this.topics_[topic];
      }
    } else {
      this.slots_.length = 0;
      this.topics_ = {};
    }
  }

  /** @override */
  disposeInternal() {
    super.disposeInternal();
    this.clear();
    this.pendingRemoval_.length = 0;
  }
}

/**
 * Schedules a function call asynchronously (microtask).
 * Mirrors the original `zL3` helper (line ~9634).
 *
 * @param {Function} fn
 * @param {Object}   context
 * @param {Array<*>} args
 * @private
 */
/* was: zL3 */
function _invokeAsync(fn, context, args) {
  queueMicrotask(() => {
    fn.apply(context, args);
  });
}

// ---------------------------------------------------------------------------
// ObservableTarget — public-facing observable base class
// ---------------------------------------------------------------------------

/**
 * A disposable object that provides pub/sub functionality.
 *
 * This is the standard "event target" base class used throughout the
 * YouTube player.  Components extend it and expose domain-specific events
 * via {@link publish}.
 *
 * The pub/sub bookkeeping is delegated to an internal {@link PubSub}
 * instance that is automatically disposed together with this object.
 */
/* was: g.ObservableTarget */
export class ObservableTarget extends Disposable {
  /**
   * Internal pub/sub hub.
   * @type {PubSub}
   * @private
   */
  pubsub_; /* was: EXP_748402147 — instance of AsyncQueue */

  /**
   * @param {boolean} [async=false]  When true, event handlers are invoked
   *                                  asynchronously (via microtask).
   */
  constructor(async = false) {
    super();
    this.pubsub_ = new PubSub(async);
    // Register the PubSub for cascading disposal (mirrors g.F(this, this.Hw)).
    this.addOnDisposeCallback(() => {
      this.pubsub_.dispose();
    });
  }

  /**
   * Subscribes a handler to a topic on this object.
   *
   * @param {string}   topic     The event/topic name.
   * @param {Function} handler   The callback.
   * @param {Object}   [context] Optional `this` for the callback.
   * @returns {number}  A subscription key (0 if already disposed).
   */
  subscribe(topic, handler, context) {
    if (this.isDisposed()) return 0;
    return this.pubsub_.subscribe(topic, handler, context);
  }

  /**
   * Removes a subscription by topic, handler, and context.
   *
   * @param {string}   topic
   * @param {Function} handler
   * @param {Object}   [context]
   * @returns {boolean} Whether the subscription was found and removed.
   */
  unsubscribe(topic, handler, context) {
    if (this.isDisposed()) return false;
    return this.pubsub_.unsubscribe(topic, handler, context);
  }

  /**
   * Removes a subscription by its key.
   *
   * @param {number} key  The key returned by {@link subscribe}.
   * @returns {boolean} Whether the key was valid and removed.
   */
  /* was: bU */
  unsubscribeByKey(key) {
    if (this.isDisposed()) return false;
    return this.pubsub_.unsubscribeByKey(key);
  }

  /**
   * Publishes an event, invoking all registered handlers.
   *
   * @param {string} topic  The event/topic name.
   * @param {...*}   args   Additional arguments forwarded to handlers.
   * @returns {boolean} Whether at least one handler was called.
   */
  publish(topic, ...args) {
    if (this.isDisposed()) return false;
    return this.pubsub_.publish(topic, ...args);
  }

  /**
   * Subscribes to multiple topics at once using a map object.
   *
   * @param {Object<string, Function>} topicMap  Keys are topic names,
   *                                              values are handlers.
   * @param {Object} [context]  Optional `this` binding for all handlers.
   */
  /* was: H5 */
  subscribeAll(topicMap, context) {
    for (const topic in topicMap) {
      this.subscribe(topic, topicMap[topic], context);
    }
  }

  /**
   * Unsubscribes from multiple topics at once using a map object.
   *
   * @param {Object<string, Function>} topicMap  Keys are topic names,
   *                                              values are handlers.
   * @param {Object} [context]  Optional `this` binding for all handlers.
   */
  /* was: iG */
  unsubscribeAll(topicMap, context) {
    for (const topic in topicMap) {
      this.unsubscribe(topic, topicMap[topic], context);
    }
  }
}
