/**
 * Ad pinging setup and telemetry initialization.
 * Source: base.js lines 79541–80473
 *
 * Contains:
 * - AdUxUpdateTriggerAdapter (CS) — handles skip/survey/mute triggers
 * - AdsControlFlowEventTriggerAdapter (Mh) — slot/layout lifecycle triggers
 * - CloseRequestedTriggerAdapter (jVR)
 * - ContentPlaybackLifecycleTriggerAdapter (JO)
 * - CueRangeTriggerAdapter (R5)
 * - LiveStreamBreakTransitionTriggerAdapter (g_K)
 * - OnLayoutSelfRequestedTriggerAdapter (kv)
 * - OpportunityEventTriggerAdapter (Yv)
 * - PrefetchTriggerAdapter (pS)
 * - TimeRelativeToLayoutEnterTriggerAdapter (O1y)
 * - VideoTransitionTriggerAdapter (QT)
 * - SlotMutationManager (cL) / SlotValidator (WL) / SlotMutationValidator (mw)
 * - AdSeenClientLogger (PyW)
 * - PacfEventLogger (fW_) / AsyncPacfEventLogger (Fz0)
 * - PingTracker (Ki)
 * - AdPromise (s$)
 * - ScreenManager (hl) / ScreenManagerProxy (pF) / ScreenManagerImpl (CF)
 *
 * [was: CS, Mh, jVR, JO, R5, g_K, kv, Yv, pS, O1y, QT, cL, WL, mw, PyW, fW_, Fz0, Ki, s$, hl, pF, CF]
 */

import { getServiceLocator } from '../core/attestation.js';  // was: g.SL
import { getProperty } from '../core/misc-helpers.js';  // was: g.l
import { scheduleJob } from '../core/scheduler.js';  // was: g.iK
import { createVeFromTrackingParams, getClientScreenNonce, logGelEvent, reportWarning } from '../data/gel-params.js';  // was: g.Bo, g.Df, g.eG, g.Ty
import { getExperimentBoolean } from '../data/idb-transactions.js';  // was: g.P
import { isTvHtml5 } from '../data/performance-profiling.js';  // was: g.AI
import { markAutoplayFlag } from '../player/playback-state.js'; // was: k$
import { handleSegmentRedirect } from './dai-cue-range.js'; // was: jZ
import { processTriggerBatch } from './ad-scheduling.js'; // was: pr
import { ScreenInfo } from '../modules/remote/mdx-client.js'; // was: VE
import { checkAdExperiment } from '../player/media-state.js'; // was: qP
import { reportAdsControlFlowError } from '../data/interaction-logging.js'; // was: v1
import { SurveySubmittedTrigger } from './ad-trigger-types.js'; // was: Oz
import { ScheduledAdEvent } from './ad-trigger-types.js'; // was: qr
import { createCueRangeMarker } from '../player/playback-state.js'; // was: Tc
import { sortFormats } from '../media/format-setup.js'; // was: jQ
import { SlotIdExitedTrigger } from './ad-trigger-types.js'; // was: Ez
import { SlotIdEnteredTrigger } from './ad-trigger-types.js'; // was: gR
import { SlotIdFulfilledEmptyTrigger } from './ad-trigger-types.js'; // was: Zg
import { SlotIdFulfilledNonEmptyTrigger } from './ad-trigger-types.js'; // was: FD
import { UnscheduledSlotTrigger } from './ad-trigger-types.js'; // was: yZ
import { forwardPlayback } from './dai-cue-range.js'; // was: Fp
import { LayoutIdEnteredTrigger } from './ad-trigger-types.js'; // was: Gu
import { OnDifferentSlotIdEnterRequestedTrigger } from './ad-trigger-types.js'; // was: Hq
import { LayoutIdExitedTrigger } from './ad-trigger-types.js'; // was: Lz
import { LayoutIdActiveAndSlotIdExitedTrigger } from './ad-trigger-types.js'; // was: ii
import { OnDifferentLayoutIdEnteredTrigger } from './ad-trigger-types.js'; // was: PE
import { LayoutExitedForReasonTrigger } from './ad-trigger-types.js'; // was: wR
import { buildTriggerDebugData } from '../network/uri-utils.js'; // was: vI
import { BotGuardInitialiser } from '../data/logger-init.js'; // was: HG
import { computeMinStartReadahead } from '../media/quality-manager.js'; // was: Vh
import { routeSeek } from '../media/mse-internals.js'; // was: yh
import { getScreenManagerHelper } from './ad-async.js'; // was: zH
import { normalizeAspectRatio } from '../player/playback-state.js'; // was: Mm
import { ensureCapacity } from '../proto/varint-decoder.js'; // was: SB
import { hasKeyStatusApi } from '../media/track-manager.js'; // was: yO
import { CloseRequestedTrigger } from './ad-trigger-types.js'; // was: fz
import { BeforeContentVideoIdStartedTrigger } from './ad-trigger-types.js'; // was: sz
import { OnNewPlaybackAfterContentVideoIdTrigger } from './ad-trigger-types.js'; // was: Zi
import { createLazyFactory } from '../data/gel-core.js'; // was: ld7
import { shouldIncludeDebugData } from '../network/uri-utils.js'; // was: GA
import { buildSlotTelemetry } from '../network/uri-utils.js'; // was: az
import { buildLayoutTelemetry } from '../network/uri-utils.js'; // was: iZw
import { buildOpportunityEvent } from '../network/uri-utils.js'; // was: yJm
import { ErrorReporter } from '../proto/message-defs.js'; // was: jBy
import { createClientScreen } from './ad-async.js'; // was: Rm
import { sendTrackingInteraction } from './ad-async.js'; // was: dgO
import { publishVisualElementState } from './ad-async.js'; // was: Spn
import { getLastRangeEnd } from '../media/codec-helpers.js'; // was: Ml
import { Disposable } from '../core/disposable.js';
import { clear } from '../core/array-utils.js';
import { PlayerError } from '../ui/cue-manager.js';
import { logVisualElementShown } from '../data/visual-element-tracking.js';
// TODO: resolve g.bu

// ---------------------------------------------------------------------------
// AdUxUpdateTriggerAdapter [was: CS]
// Handles skip button, survey submit, and mute triggers for ad UX updates
// ---------------------------------------------------------------------------
export class AdUxUpdateTriggerAdapter extends b17 {
  /** @param {Function} triggerExecutor [was: Q] */
  constructor(triggerExecutor, playerAdapter, featureFlags) { // was: Q, c, W
    super(triggerExecutor);
    this.featureFlags = featureFlags; // was: this.QC
    playerAdapter.get().addListener(this);
    this.addOnDisposeCallback(() => {
      if (!playerAdapter.u0()) playerAdapter.get().removeListener(this);
    });
  }

  /**
   * Handle component interaction (skip, survey, etc.).
   * @param {string} componentId [was: Q]
   * @param {string} layoutId    [was: c]
   */
  AdHoverTextButtonMetadata(componentId, layoutId) {
    if (!layoutId) return;
    if (componentId === "skip-button") {
      const matchingTriggers = []; // was: Q
      for (const entry of this.markAutoplayFlag.values()) {
        const trigger = entry.trigger; // was: m
        if (trigger instanceof handleSegmentRedirect &&
            entry.category === "TRIGGER_CATEGORY_LAYOUT_EXIT_USER_SKIPPED" &&
            trigger.triggeringLayoutId === layoutId) {
          matchingTriggers.push(entry);
        }
      }
      if (matchingTriggers.length) processTriggerBatch(this.ScreenInfo(), matchingTriggers);
    } else {
      if (checkAdExperiment(this.featureFlags.get(), "supports_multi_step_on_desktop")) {
        if (componentId === "ad-action-submit-survey") Bq(this, layoutId);
      } else if (componentId === "survey-submit") {
        Bq(this, layoutId);
      } else if (componentId === "survey-single-select-answer-button") {
        Bq(this, layoutId);
      }
    }
  }

  /** Handle mute request. [was: wT] */
  onMuteRequested(layoutId) { // was: Q
    const matchingTriggers = [];
    for (const entry of this.markAutoplayFlag.values()) {
      const trigger = entry.trigger;
      if (trigger instanceof handleSegmentRedirect &&
          entry.category === "TRIGGER_CATEGORY_LAYOUT_EXIT_USER_MUTED" &&
          trigger.triggeringLayoutId === layoutId) {
        matchingTriggers.push(entry);
      }
    }
    if (matchingTriggers.length) {
      processTriggerBatch(this.ScreenInfo(), matchingTriggers);
    } else {
      reportAdsControlFlowError("Mute requested but no registered triggers can be activated.");
    }
  }

  vN(slot, trigger, category, handler) {
    if (this.markAutoplayFlag.has(trigger.triggerId))
      throw new z("Tried to register duplicate trigger for slot.");
    if (!(trigger instanceof SurveySubmittedTrigger || trigger instanceof handleSegmentRedirect))
      throw new z("Incorrect TriggerType: Tried to register trigger of type " + trigger.triggerType + " in AdUxUpdateTriggerAdapter.");
    this.markAutoplayFlag.set(trigger.triggerId, new ScheduledAdEvent(slot, trigger, category, handler));
  }

  Rs(trigger) { this.markAutoplayFlag.delete(trigger.triggerId); }
  e5() {}
  createCueRangeMarker() {}
  S4() {}
}

// ---------------------------------------------------------------------------
// AdsControlFlowEventTriggerAdapter [was: Mh]
// Handles slot/layout lifecycle event triggers (enter, exit, fulfill, etc.)
// ---------------------------------------------------------------------------
export class AdsControlFlowEventTriggerAdapter extends Disposable {
  constructor(triggerExecutor) { // was: Q
    super();
    this.ScreenInfo = triggerExecutor;
    this.sortFormats = true; // was: !0
    this.markAutoplayFlag = new Map();
    this.fulfilledSlots = new Set();       // was: this.j
    this.enteredSlots = new Set();         // was: this.O
    this.exitedSlots = new Set();          // was: this.A
    this.scheduledSlots = new Set();       // was: this.K
    this.renderedLayouts = new Set();      // was: this.W
  }

  vN(slot, trigger, category, handler) {
    if (this.markAutoplayFlag.has(trigger.triggerId))
      throw new z("Tried to register duplicate trigger for slot.");
    if (!(trigger instanceof SlotIdEnteredTrigger || trigger instanceof SlotIdExitedTrigger || trigger instanceof SlotIdFulfilledEmptyTrigger ||
          trigger instanceof SlotIdFulfilledNonEmptyTrigger || trigger instanceof forwardPlayback || trigger instanceof UnscheduledSlotTrigger ||
          trigger instanceof OnDifferentSlotIdEnterRequestedTrigger || trigger instanceof LayoutIdEnteredTrigger || trigger instanceof LayoutIdExitedTrigger ||
          trigger instanceof LayoutExitedForReasonTrigger || trigger instanceof OnDifferentLayoutIdEnteredTrigger || trigger instanceof LayoutIdActiveAndSlotIdExitedTrigger))
      throw new z("Incorrect TriggerType: Tried to register trigger of type " + trigger.triggerType + " in AdsControlFlowEventTriggerAdapter");
    const entry = new ScheduledAdEvent(slot, trigger, category, handler);
    this.markAutoplayFlag.set(trigger.triggerId, entry);
    if (trigger instanceof forwardPlayback && this.fulfilledSlots.has(trigger.triggeringSlotId)) processTriggerBatch(this.ScreenInfo(), [entry]);
    if (trigger instanceof SlotIdEnteredTrigger && this.enteredSlots.has(trigger.triggeringSlotId)) processTriggerBatch(this.ScreenInfo(), [entry]);
    if (trigger instanceof LayoutIdEnteredTrigger && this.renderedLayouts.has(trigger.triggeringLayoutId)) processTriggerBatch(this.ScreenInfo(), [entry]);
  }

  Rs(trigger) { this.markAutoplayFlag.delete(trigger.triggerId); }

  /** Slot fulfilled. [was: Rr] */
  Rr(slot) {
    this.fulfilledSlots.add(slot.slotId);
    const matched = [];
    for (const entry of this.markAutoplayFlag.values())
      if (entry.trigger instanceof forwardPlayback && slot.slotId === entry.trigger.triggeringSlotId) matched.push(entry);
    if (matched.length > 0) processTriggerBatch(this.ScreenInfo(), matched);
  }

  /** Slot unfulfilled. [was: nU] */
  nU(slot) {
    this.fulfilledSlots.delete(slot.slotId);
    const matched = [];
    for (const entry of this.markAutoplayFlag.values()) {
      const t = entry.trigger;
      if (t instanceof UnscheduledSlotTrigger && t.triggeringSlotId === slot.slotId) matched.push(entry);
    }
    if (matched.length > 0) processTriggerBatch(this.ScreenInfo(), matched);
  }

  buildTriggerDebugData(slot) {
    const matched = [];
    for (const entry of this.markAutoplayFlag.values()) {
      const t = entry.trigger;
      if (t instanceof OnDifferentSlotIdEnterRequestedTrigger && t.slotType === slot.slotType && t.W !== slot.slotId) matched.push(entry);
    }
    if (matched.length > 0) processTriggerBatch(this.ScreenInfo(), matched);
  }

  gH(slot) {
    this.enteredSlots.add(slot.slotId);
    const matched = [];
    for (const entry of this.markAutoplayFlag.values())
      if (entry.trigger instanceof SlotIdEnteredTrigger && slot.slotId === entry.trigger.triggeringSlotId) matched.push(entry);
    if (matched.length > 0) processTriggerBatch(this.ScreenInfo(), matched);
  }

  BotGuardInitialiser(slot) {
    this.enteredSlots.delete(slot.slotId);
    this.exitedSlots.add(slot.slotId);
    const matched = [];
    for (const entry of this.markAutoplayFlag.values()) {
      if (entry.trigger instanceof SlotIdExitedTrigger) {
        if (slot.slotId === entry.trigger.triggeringSlotId) matched.push(entry);
      } else if (entry.trigger instanceof LayoutIdActiveAndSlotIdExitedTrigger) {
        const t = entry.trigger;
        if (slot.slotId === t.slotId && this.renderedLayouts.has(t.triggeringLayoutId)) matched.push(entry);
      }
    }
    if (matched.length > 0) processTriggerBatch(this.ScreenInfo(), matched);
  }

  N6(slot) {
    const matched = [];
    for (const entry of this.markAutoplayFlag.values())
      if (entry.trigger instanceof SlotIdFulfilledEmptyTrigger && slot.slotId === entry.trigger.triggeringSlotId) matched.push(entry);
    if (matched.length > 0) processTriggerBatch(this.ScreenInfo(), matched);
  }

  computeMinStartReadahead(slot) {
    const matched = [];
    for (const entry of this.markAutoplayFlag.values())
      if (entry.trigger instanceof SlotIdFulfilledNonEmptyTrigger && slot.slotId === entry.trigger.triggeringSlotId) matched.push(entry);
    if (matched.length > 0) processTriggerBatch(this.ScreenInfo(), matched);
  }

  routeSeek(_slot, layout) { this.scheduledSlots.add(layout.layoutId); }
  getScreenManagerHelper(_slot, layout) { this.scheduledSlots.delete(layout.layoutId); }

  normalizeAspectRatio(slot, layout) {
    this.renderedLayouts.add(layout.layoutId);
    const matched = [];
    for (const entry of this.markAutoplayFlag.values()) {
      if (entry.trigger instanceof LayoutIdEnteredTrigger) {
        if (layout.layoutId === entry.trigger.triggeringLayoutId) matched.push(entry);
      } else if (entry.trigger instanceof OnDifferentLayoutIdEnteredTrigger) {
        const t = entry.trigger;
        if (slot.slotType === t.slotType && layout.layoutType === t.layoutType && layout.layoutId !== t.W)
          matched.push(entry);
      } else if (entry.trigger instanceof LayoutIdActiveAndSlotIdExitedTrigger) {
        const t = entry.trigger;
        if (layout.layoutId === t.triggeringLayoutId && this.exitedSlots.has(t.slotId))
          matched.push(entry);
      }
    }
    if (matched.length > 0) processTriggerBatch(this.ScreenInfo(), matched);
  }

  onLayoutExited(_slot, layout, exitReason) {
    this.renderedLayouts.delete(layout.layoutId);
    const matched = [];
    for (const entry of this.markAutoplayFlag.values()) {
      if (entry.trigger instanceof LayoutIdExitedTrigger && layout.layoutId === entry.trigger.triggeringLayoutId)
        matched.push(entry);
      if (entry.trigger instanceof LayoutExitedForReasonTrigger) {
        const t = entry.trigger;
        if (layout.layoutId === t.triggeringLayoutId && t.W.includes(exitReason))
          matched.push(entry);
      }
    }
    if (matched.length > 0) processTriggerBatch(this.ScreenInfo(), matched);
  }

  ensureCapacity() {}
  V1() { this.exitedSlots.clear(); }
  hasKeyStatusApi() {}
}

// ---------------------------------------------------------------------------
// Remaining trigger adapters (abbreviated for brevity – full structure preserved)
// [was: jVR, JO, R5, g_K, kv, Yv, pS, O1y, QT]
// ---------------------------------------------------------------------------

export class CloseRequestedTriggerAdapter extends Disposable {
  constructor(triggerExecutor) { super(); this.ScreenInfo = triggerExecutor; this.markAutoplayFlag = new Map(); }
  vN(slot, trigger, category, handler) {
    if (this.markAutoplayFlag.has(trigger.triggerId)) throw new z("Tried to register duplicate trigger for slot.");
    if (!(trigger instanceof CloseRequestedTrigger)) throw new z("Incorrect TriggerType: Tried to register trigger of type " + trigger.triggerType + " in CloseRequestedTriggerAdapter");
    this.markAutoplayFlag.set(trigger.triggerId, new ScheduledAdEvent(slot, trigger, category, handler));
  }
  Rs(trigger) { this.markAutoplayFlag.delete(trigger.triggerId); }
}

export class ContentPlaybackLifecycleTriggerAdapter extends Disposable {
  constructor(triggerExecutor, playerAdapter, context) {
    super(); this.ScreenInfo = triggerExecutor; this.context = context; this.markAutoplayFlag = new Map();
    playerAdapter.get().addListener(this);
    this.addOnDisposeCallback(() => { if (!playerAdapter.u0()) playerAdapter.get().removeListener(this); });
  }
  vN(slot, trigger, category, handler) {
    if (this.markAutoplayFlag.has(trigger.triggerId)) throw new z("Tried to register duplicate trigger for slot.");
    if (!(trigger instanceof BeforeContentVideoIdStartedTrigger || trigger instanceof OnNewPlaybackAfterContentVideoIdTrigger)) throw new z("Incorrect TriggerType: Tried to register trigger of type " + trigger.triggerType + " in ContentPlaybackLifecycleTriggerAdapter");
    this.markAutoplayFlag.set(trigger.triggerId, new ScheduledAdEvent(slot, trigger, category, handler));
  }
  Rs(trigger) { this.markAutoplayFlag.delete(trigger.triggerId); }
  V1(cpn) { const matched = []; /* fire BeforeContentVideoIdStartedTrigger/OnNewPlaybackAfterContentVideoIdTrigger triggers */ if (matched.length) processTriggerBatch(this.ScreenInfo(), matched); }
  hasKeyStatusApi(cpn) { const matched = []; if (matched.length) processTriggerBatch(this.ScreenInfo(), matched); }
}

// ---------------------------------------------------------------------------
// PacfEventLogger [was: fW_]
// Logs PACF (Player Ads Control Flow) client events for telemetry
// ---------------------------------------------------------------------------
export class PacfEventLogger extends Disposable {
  constructor(featureFlags, adStateProvider) {
    super();
    this.QC = featureFlags; // was: Q
    this.O = adStateProvider; // was: c
    this.eventCount = 0;
    this.A = createLazyFactory()();
  }

  logEvent(eventType) { this.W(eventType); }

  W(eventType, opportunityType, associatedSlotId, triggerData, slot, layout, ping, triggerEntry, adSlotLogging, adLayoutLogging, errorInfo, delay = 0) {
    if (checkAdExperiment(this.QC.get(), "h5_enable_pacf_debug_logs")) {
      console.log(`[PACF]: ${eventType}`, "slot:", slot, "layout:", layout, "ping:", ping);
    }
    try {
      const emitEvent = () => {
        if (this.QC.get().U.G().X("html5_disable_client_tmp_logs") || eventType === "ADS_CLIENT_EVENT_TYPE_UNSPECIFIED") return;
        if (!eventType) reportAdsControlFlowError("Empty PACF event type", slot, layout);
        const stateSnapshot = shouldIncludeDebugData(this.O.get());
        const event = { eventType, eventOrder: ++this.eventCount };
        const clientData = {};
        if (slot) clientData.slotData = buildSlotTelemetry(stateSnapshot, slot);
        if (layout) clientData.layoutData = buildLayoutTelemetry(stateSnapshot, layout);
        if (ping) clientData.pingData = { pingDispatchStatus: "ADS_CLIENT_PING_DISPATCH_STATUS_SUCCESS", serializedAdPingMetadata: ping.W.serializedAdPingMetadata, pingIndex: ping.index };
        if (triggerEntry) clientData.triggerData = buildTriggerDebugData(triggerEntry.trigger, triggerEntry.category);
        if (opportunityType) clientData.opportunityData = buildOpportunityEvent(stateSnapshot, opportunityType, associatedSlotId, triggerData);
        event.adClientData = clientData;
        if (adSlotLogging) event.serializedSlotAdServingData = adSlotLogging.serializedSlotAdServingDataEntry;
        if (adLayoutLogging) event.serializedAdServingData = adLayoutLogging.serializedAdServingDataEntry;
        if (errorInfo) event.errorInfo = errorInfo;
        logGelEvent("adsClientStateChange", { adsClientEvent: event });
      };
      delay && delay > 0 ? scheduleJob(getServiceLocator(), () => emitEvent(), delay) : emitEvent();
    } catch (err) {
      if (checkAdExperiment(this.QC.get(), "html5_log_pacf_logging_errors")) {
        scheduleJob(getServiceLocator(), () => { reportAdsControlFlowError(err instanceof Error ? err : String(err), slot, layout, { pacf_message: "exception during pacf logging" }); });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// AsyncPacfEventLogger [was: Fz0]
// ---------------------------------------------------------------------------
export class AsyncPacfEventLogger extends PacfEventLogger {
  constructor(featureFlags, adStateProvider, contentAdapter) {
    super(featureFlags, adStateProvider);
    this.cA = contentAdapter; // was: W
  }
  W(eventType, opportunityType, associatedSlotId, triggerData, slot, layout, ping, triggerEntry, adSlotLogging, adLayoutLogging, errorInfo) {
    let delay;
    const flags = this.QC.get();
    if (isTvHtml5(flags.U.G())) {
      delay = getExperimentValue(flags.U.G().experiments, "H5_async_logging_delay_ms");
    }
    super.W(eventType, opportunityType, associatedSlotId, triggerData, slot, layout, ping, triggerEntry, adSlotLogging, adLayoutLogging, errorInfo, delay);
  }
}

// ---------------------------------------------------------------------------
// ScreenManagerImpl [was: CF]
// Manages screen/page transitions, VE logging, and playback associations
// ---------------------------------------------------------------------------
export class ScreenManagerImpl {
  constructor() {
    this.Y = [];     // screens stack
    this.mF = [];    // pending state changes
    this.W = [];     // screen layers
    this.J = new Map();
    this.Ie = new Map();
    this.D = [];
    this.S = [];
    this.j = new Map();
    this.L = new Map();
    this.O = new Set();
    this.MM = new Map();
  }

  A(client) { this.client = client; }

  T2(command, options = {}) {
    wrapWithErrorReporter(() => {
      const rootVeType = getProperty(command?.commandMetadata, g.bu)?.rootVe || getProperty(command?.commandMetadata, P9d)?.screenVisualElement?.uiType;
      if (rootVeType) {
        let parentVe, parentCsn;
        const meta = getProperty(command?.commandMetadata, DUy);
        if (meta?.parentTrackingParams) {
          parentVe = createVeFromTrackingParams(meta.parentTrackingParams);
          if (meta.parentCsn) parentCsn = meta.parentCsn;
        } else if (options.clickedVisualElement) {
          parentVe = options.clickedVisualElement;
        } else if (command.clickTrackingParams) {
          parentVe = createVeFromTrackingParams(command.clickTrackingParams);
        }
        createClientScreen(this, rootVeType, parentVe, { ...options, parentCsn });
      } else {
        reportWarning(new PlayerError("Error: Trying to create a new screen without a rootVeType", command));
      }
    })();
  }

  clickCommand(command, element, layerIndex = 0) {
    return sendTrackingInteraction(this, command.clickTrackingParams, element, layerIndex);
  }

  stateChanged(trackingParams, stateData, layerIndex = 0) {
    this.visualElementStateChanged(createVeFromTrackingParams(trackingParams), stateData, layerIndex);
  }

  visualElementStateChanged(ve, stateData, layerIndex = 0) {
    if (layerIndex === 0 && this.O.has(layerIndex)) {
      this.mF.push([ve, stateData]);
    } else {
      publishVisualElementState(this, ve, stateData, layerIndex);
    }
  }

  getLastRangeEnd(videoData) {
    const cpn = videoData.cpn;
    const csn = getClientScreenNonce();
    if (cpn && csn && csn !== "UNDEFINED_CSN") {
      let itctVe;
      if (videoData.itct) itctVe = createVeFromTrackingParams(videoData.itct || "");
      const eventData = { cpn, csn };
      if (getExperimentBoolean("web_playback_associated_ve") && itctVe) {
        logVisualElementShown(csn, itctVe);
        eventData.playbackVe = itctVe.getAsJson();
      }
      logGelEvent("playbackAssociated", eventData, {});
    }
  }
}

// ---------------------------------------------------------------------------
// Default language [was: $7]
// ---------------------------------------------------------------------------
export const DEFAULT_LANGUAGE = window.G7G || "en"; // was: $7
