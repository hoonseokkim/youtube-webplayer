
/**
 * ContainerComponent — a player component that manages child components
 * and provides pub/sub event delegation.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Class definition: lines ~69545-69563  (g.KK)
 *   Extends:          g.k (PlayerComponent)
 *
 * Wraps an internal ObservableTarget (PubSub hub) so that the container
 * can act as an event bus for its children. The hub is disposed together
 * with the component via cascading disposal.
 *
 * [was: g.KK]
 */

import { PlayerComponent } from './component.js';
// ObservableTarget provides the internal PubSub hub.
// In the original code, `g.W1` is instantiated as `this.iX`.
// We import it here for type reference; at runtime the hub is constructed
// directly in the constructor.
import { ObservableTarget } from '../core/event-target.js';
import { dispose } from '../ads/dai-cue-range.js';

export class ContainerComponent extends PlayerComponent {
  /**
   * Internal pub/sub hub for container-level events.
   * @type {ObservableTarget}
   * @private
   */
  eventHub_; // was: iX

  /**
   * @param {Object} template  A template descriptor (see {@link UIComponent}).
   */
  constructor(template) {
    super(template);
    this.eventHub_ = new ObservableTarget(); // was: new g.W1
    // Register for cascading disposal — was: g.F(this, this.iX)
    this.addOnDisposeCallback(() => {
      this.eventHub_.dispose();
    });
  }

  /**
   * Subscribes a handler to a topic on this container's event hub.
   *
   * @param {string}   topic
   * @param {Function} handler
   * @param {Object}   [context]
   * @returns {number}  Subscription key.
   */
  subscribe(topic, handler, context) {
    return this.eventHub_.subscribe(topic, handler, context);
  }

  /**
   * Removes a subscription by topic, handler, and context.
   *
   * @param {string}   topic
   * @param {Function} handler
   * @param {Object}   [context]
   * @returns {boolean}
   */
  unsubscribe(topic, handler, context) {
    return this.eventHub_.unsubscribe(topic, handler, context);
  }

  /**
   * Removes a subscription by its key.
   *
   * @param {number} key
   * @returns {boolean}
   */
  /* was: bU */
  unsubscribeByKey(key) {
    return this.eventHub_.unsubscribeByKey(key);
  }

  /**
   * Publishes an event to all subscribers on this container's hub.
   *
   * @param {string} topic
   * @param {...*}   args
   * @returns {boolean}
   */
  publish(topic, ...args) {
    return this.eventHub_.publish(topic, ...args);
  }
}
