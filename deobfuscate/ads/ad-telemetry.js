/**
 * Ad Telemetry — event logging with slot/layout context,
 * premium ads-seen logging, error logging, and Innertube logger integration.
 *
 * Source: base.js lines 28000–28026
 * [was: cR, OZn, Ugx, E$]
 */

import { getServiceLocator } from '../core/attestation.js';  // was: g.SL
import { scheduleJob } from '../core/scheduler.js';  // was: g.iK
import { GcfConfigManager } from '../data/idb-operations.js'; // was: BF
import { pubsub2SubscribedKeys } from '../data/idb-operations.js'; // was: wU
import { getResolver } from '../network/innertube-config.js'; // was: Ng
import { optional } from '../network/innertube-config.js'; // was: qg
import { checkAdExperiment } from '../player/media-state.js'; // was: qP
import { shouldIncludeDebugData } from '../network/uri-utils.js'; // was: GA

/**
 * Logs an ad client event with slot and layout context, and optionally
 * triggers premium ads-seen logging if the hot-config flags are enabled.
 *
 * @param {object} logger - The ad event logger instance [was: Q]
 * @param {string} eventType - The ads client event type string [was: c]
 * @param {object} slot - The ad slot object with adSlotLoggingData [was: W]
 * @param {object} [layout] - The ad layout object with adLayoutLoggingData [was: m]
 */
export function logAdEventWithSlotLayout(logger, eventType, slot, layout) { // was: cR
  logger.W(
    eventType,
    undefined,
    undefined,
    undefined,
    slot,
    layout ? layout : undefined,
    undefined,
    undefined,
    slot.adSlotLoggingData,
    layout ? layout.adLayoutLoggingData : undefined
  );
  const resolvedConfig = getResolver().resolve(optional(GcfConfigManager))?.pubsub2SubscribedKeys(); // was: c (reused)
  const adsHotConfig = resolvedConfig?.adsHotConfig; // was: W (reused)
  if (
    resolvedConfig?.adsSeenHotConfig?.logOnAdsSeen &&
    adsHotConfig?.webEnablePremiumAdsSeenLogging
  ) {
    logPremiumAdsSeen(logger, layout ? layout : undefined); // was: Ugx
  }
}

/**
 * Logs a trigger-activated event for ad debugging, including optional
 * PACF debug console output and Innertube event dispatch.
 *
 * @param {object} logger - The ad event logger instance [was: Q]
 * @param {string} eventType - Always "ADS_CLIENT_EVENT_TYPE_TRIGGER_ACTIVATED" [was: c]
 * @param {object} trigger - The trigger object [was: W]
 * @param {object} [layout] - The ad layout object [was: m]
 */
export function logTriggerActivated(logger, eventType, trigger, layout) { // was: OZn
  if (checkAdExperiment(logger.QC.get(), "h5_enable_pacf_debug_logs")) {
    console.log(
      "[PACF]: ADS_CLIENT_EVENT_TYPE_TRIGGER_ACTIVATED",
      "trigger:", trigger,
      "slot:", eventType,
      "layout:", layout
    );
  }
  if (shouldIncludeDebugData(logger.O.get())) {
    logger.W(
      "ADS_CLIENT_EVENT_TYPE_TRIGGER_ACTIVATED",
      undefined,
      undefined,
      undefined,
      eventType,
      layout ? layout : undefined,
      undefined,
      trigger,
      eventType.adSlotLoggingData,
      layout ? layout.adLayoutLoggingData : undefined
    );
  }
}

/**
 * Logs a premium ads-seen event by scheduling the layout logging data
 * onto the next microtask via scheduleJob/getServiceLocator.
 *
 * @param {object} logger - The ad event logger instance [was: Q]
 * @param {object} [layout] - The ad layout object [was: c]
 */
export function logPremiumAdsSeen(logger, layout) { // was: Ugx
  if (layout) {
    const layoutLoggingData = layout.adLayoutLoggingData; // was: W
    scheduleJob(getServiceLocator(), () => {
      logger.A?.W(layoutLoggingData);
    }, 0);
  }
}

/**
 * Looks up a slot/layout entry from a mapping by a given key (e.g., timeline playback ID).
 * Returns null if no matching entry exists.
 *
 * @param {object} store - The mapping store with a .W Map property [was: Q]
 * @param {string} key - The lookup key (e.g., PJ / timeline playback ID) [was: c]
 * @returns {{ layoutId: string|null, slotId: string|null } | null}
 */
export function lookupSlotLayout(store, key) { // was: E$
  return store.W.get(key) || null;
}
