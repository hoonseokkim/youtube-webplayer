/**
 * Ad Layout Scheduling & Fulfillment
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~20985–22000
 *
 * Handles:
 *  - Slot fulfillment callback (empty vs. non-empty layout delivery)
 *  - Layout scheduling: exit-trigger configuration, adapter factory lookup
 *  - Layout rendering adapter instantiation & trigger binding
 *  - Slot lifecycle state machine (enter, exit, expiration, rendering)
 *  - Trigger-category sorting and batch dispatch
 *  - Layout exit reason mapping (normal, skip, mute, user-input, cancel)
 *  - Error handling for missing slot state / adapter / triggers
 *  - Ad-break request/response fulfillment with throttled layout creation
 *  - URL validation helpers for stream, image, DRM, and caption URLs
 *  - Cue-range ID generators and ad-marker priority helpers
 */

import { forEach } from '../core/event-registration.js';  // was: g.mfm
import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { isUnpluggedPlatform } from '../data/bandwidth-tracker.js';  // was: g.Ie
import { reportWarning } from '../data/gel-params.js';  // was: g.Ty
import { isTvHtml5 } from '../data/performance-profiling.js';  // was: g.AI
import { LayoutRenderingAdapter } from '../ui/cue-manager.js';  // was: g.il
import { generateLayoutId } from './slot-id-generator.js';  // was: g.nQ
import { httpStatusToGrpcCode } from '../media/bitstream-reader.js'; // was: LO
import { computeMinStartReadahead } from '../media/quality-manager.js'; // was: Vh
import { routeSeek } from '../media/mse-internals.js'; // was: yh
import { isWebClient } from '../data/performance-profiling.js'; // was: XC
import { normalizeAspectRatio } from '../player/playback-state.js'; // was: Mm
import { LayoutIdEnteredTrigger } from './ad-trigger-types.js'; // was: Gu
import { buildTriggerDebugData } from '../network/uri-utils.js'; // was: vI
import { itagToCodecMap } from '../media/codec-tables.js'; // was: Ak
import { createLoggerFromConfig } from '../data/logger-init.js'; // was: mu
import { sortFormats } from '../media/format-setup.js'; // was: jQ
import { processActionCommands } from '../network/uri-utils.js'; // was: BwW
import { dispatchAction } from '../network/uri-utils.js'; // was: wx
import { CastController } from '../modules/remote/cast-controls.js'; // was: EG
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { concat } from '../core/array-utils.js';
import { toString } from '../core/string-utils.js';
import { Uri, setUriScheme } from '../network/uri-utils.js';
// TODO: resolve g.oO
// TODO: resolve g.rC

// ---------------------------------------------------------------------------
// Slot Fulfillment Error Callback  [was: T1]  (line ~20985)
// ---------------------------------------------------------------------------

/**
 * Reports a fulfillment error, logs it, and expires the slot.
 *
 * [was: T1]
 *
 * @param {object} callback     - command router with .LO logger  [was: Q]
 * @param {object} slot         - the slot that failed              [was: c]
 * @param {object} error        - AdsClientError instance           [was: W]
 * @param {string} errorType    - ADS_CLIENT_ERROR_TYPE_* constant  [was: m]
 */
export function reportFulfillmentError(callback, slot, error, errorType) { // was: T1
  logAdWarning(error, slot, undefined, undefined, error.gt); // was: v1(W, c, void 0, void 0, W.gt)
  error.iy
    ? logClientError(callback.httpStatusToGrpcCode, errorType, error.iy, slot) // was: KQ
    : logAdWarning('adsClientErrorMessage is missing.', slot); // was: v1
  expireSlot(callback, slot, true); // was: YO(Q, c, !0)
}

// ---------------------------------------------------------------------------
// Slot Fulfilled (empty / non-empty)  [was: dbm]  (line ~20991)
// ---------------------------------------------------------------------------

/**
 * Called when a slot has been fulfilled.
 * If the layout is `null`, fires the "empty" path and expires the slot.
 * Otherwise fires "non-empty", assigns the layout, and attempts scheduling.
 *
 * [was: dbm]
 *
 * @param {object} router    - command router                  [was: Q]
 * @param {object} slot      - fulfilled slot descriptor       [was: c]
 * @param {object|null} layout - resolved layout or null       [was: W]
 */
export function onSlotFulfilled(router, slot, layout) { // was: dbm
  if (!isSlotRegistered(router.W, slot)) return; // was: h1(Q.W, c)

  getSlotState(router.W, slot).j = layout ? 'filled' : 'not_filled'; // was: zA(Q.W, c).j

  if (layout === null) {
    fireAdEvent(router.httpStatusToGrpcCode, 'ADS_CLIENT_EVENT_TYPE_SLOT_FULFILLED_EMPTY', slot); // was: cR
    for (const listener of router.O) // was: T
      listener.N6(slot);
    expireSlot(router, slot, false); // was: YO(Q, c, !1)
  } else {
    fireAdEvent(router.httpStatusToGrpcCode, 'ADS_CLIENT_EVENT_TYPE_SLOT_FULFILLED_NON_EMPTY', slot, layout); // was: cR

    // If there is a pre-fulfilled layout and the composite VOD flag is set, skip ZZ0
    slot.fulfilledLayout !== undefined && isCompositeVodEnabled(router.QC.get()) || assignFulfilledLayout(router, slot, layout); // was: sKy, ZZ0

    for (const listener of router.O) // was: T
      listener.computeMinStartReadahead(slot);

    if (isSlotRegistered(router.W, slot)) { // was: h1(Q.W, c)
      if (getSlotState(router.W, slot).K) { // was: zA(Q.W, c).K
        expireSlot(router, slot, false); // was: YO(Q, c, !1)
      } else {
        fireAdEvent(router.httpStatusToGrpcCode, 'ADS_CLIENT_EVENT_TYPE_SCHEDULE_LAYOUT_REQUESTED', slot, layout); // was: cR
        try {
          const slotManager = router.W; // was: m = Q.W
          if (!getSlotState(slotManager, slot)) // was: zA(m, c)
            throw new SchedulingError( // was: oe
              'Unknown slotState for onLayout',
              undefined,
              'ADS_CLIENT_ERROR_MESSAGE_SLOT_STATE_IS_NULL',
            );

          if (!slotManager.rj.jn.get(slot.slotType))
            throw new SchedulingError( // was: oe
              'No LayoutRenderingAdapterFactory registered for slot of type: ' + slot.slotType,
              undefined,
              'ADS_CLIENT_ERROR_MESSAGE_CANNOT_FIND_MATCHING_LAYOUT_RENDERING_ADAPTER_FACTORY',
            );

          if (
            layout.layoutExitNormalTriggers.length == 0 &&
            layout.layoutExitSkipTriggers.length == 0 &&
            layout.layoutExitMuteTriggers.length == 0 &&
            layout.layoutExitUserInputSubmittedTriggers.length == 0 &&
            layout.layoutExitUserCancelledTriggers.length == 0
          )
            throw new SchedulingError( // was: oe
              'Layout has no exit triggers.',
              undefined,
              'ADS_CLIENT_ERROR_MESSAGE_EMPTY_LAYOUT_EXIT_TRIGGER',
            );

          validateLayoutTriggers(slotManager, 'TRIGGER_CATEGORY_LAYOUT_EXIT_NORMAL', layout.layoutExitNormalTriggers); // was: ro
          validateLayoutTriggers(slotManager, 'TRIGGER_CATEGORY_LAYOUT_EXIT_USER_SKIPPED', layout.layoutExitSkipTriggers);
          validateLayoutTriggers(slotManager, 'TRIGGER_CATEGORY_LAYOUT_EXIT_USER_MUTED', layout.layoutExitMuteTriggers);
          validateLayoutTriggers(slotManager, 'TRIGGER_CATEGORY_LAYOUT_EXIT_USER_INPUT_SUBMITTED', layout.layoutExitUserInputSubmittedTriggers);
          validateLayoutTriggers(slotManager, 'TRIGGER_CATEGORY_LAYOUT_EXIT_USER_CANCELLED', layout.layoutExitUserCancelledTriggers);
        } catch (err) { // was: T
          if (err instanceof SchedulingError) // was: oe
            router.Gm(slot, layout, err, 'ADS_CLIENT_ERROR_TYPE_SCHEDULE_LAYOUT_FAILED');
          else
            router.Gm(
              slot,
              layout,
              new SchedulingError(`Unexpected error: ${err}`, undefined, 'ADS_CLIENT_ERROR_MESSAGE_UNEXPECTED_ERROR'),
              'ADS_CLIENT_ERROR_TYPE_SCHEDULE_LAYOUT_FAILED',
            );
          expireSlot(router, slot, true); // was: YO(Q, c, !0)
          return;
        }

        getSlotState(router.W, slot).D = true; // was: zA(Q.W, c).D = !0

        try {
          const slotManager = router.W; // was: K = Q.W
          const state = getSlotState(slotManager, slot); // was: T = zA(K, c)
          const adapter = slotManager.rj.jn
            .get(slot.slotType)
            .get()
            .build(slotManager.j, slotManager.O, slot, layout); // was: r

          adapter.init();
          state.layout = layout;

          if (state.A)
            throw new SchedulingError( // was: oe
              'Already had LayoutRenderingAdapter registered for slot',
              undefined,
              'ADS_CLIENT_ERROR_MESSAGE_BUILD_DUPLICATE_LAYOUT_RENDERING_ADAPTER',
            );

          state.A = adapter;

          bindTriggerAdapters(slotManager, state, 'TRIGGER_CATEGORY_LAYOUT_EXIT_NORMAL', layout.layoutExitNormalTriggers); // was: Ua
          bindTriggerAdapters(slotManager, state, 'TRIGGER_CATEGORY_LAYOUT_EXIT_USER_SKIPPED', layout.layoutExitSkipTriggers);
          bindTriggerAdapters(slotManager, state, 'TRIGGER_CATEGORY_LAYOUT_EXIT_USER_MUTED', layout.layoutExitMuteTriggers);
          bindTriggerAdapters(slotManager, state, 'TRIGGER_CATEGORY_LAYOUT_EXIT_USER_INPUT_SUBMITTED', layout.layoutExitUserInputSubmittedTriggers);
          bindTriggerAdapters(slotManager, state, 'TRIGGER_CATEGORY_LAYOUT_EXIT_USER_CANCELLED', layout.layoutExitUserCancelledTriggers);
        } catch (err) { // was: T
          clearSlotSchedulingFlag(router, slot); // was: Qq(Q, c)
          if (err instanceof SchedulingError) // was: oe
            router.Gm(slot, layout, err, 'ADS_CLIENT_ERROR_TYPE_SCHEDULE_LAYOUT_FAILED');
          else
            router.Gm(
              slot,
              layout,
              new SchedulingError(`Unexpected error: ${err}`, undefined, 'ADS_CLIENT_ERROR_MESSAGE_UNEXPECTED_ERROR'),
              'ADS_CLIENT_ERROR_TYPE_SCHEDULE_LAYOUT_FAILED',
            );
          expireSlot(router, slot, true); // was: YO(Q, c, !0)
          return;
        }

        fireAdEvent(router.httpStatusToGrpcCode, 'ADS_CLIENT_EVENT_TYPE_LAYOUT_SCHEDULED', slot, layout); // was: cR
        for (const listener of router.O) // was: T
          listener.routeSeek(slot, layout);

        clearSlotSchedulingFlag(router, slot); // was: Qq(Q, c)
        checkAndEnterSlot(router, slot); // was: Edy(Q, c)
      }
    } else {
      // Slot is unregistered after fulfillment — composite VOD fallback
      let compositeRouter = router.QC.get(); // was: Q = Q.QC.get()
      let isComposite; // was: Q (reused)
      if (
        isUnpluggedPlatform(compositeRouter.U.G()) ||
        isWebClient(compositeRouter.U.G()) ||
        isTvHtml5(compositeRouter.U.G())
      ) {
        isComposite = true;
      } else {
        logAdWarning('Composite VOD on legacy path.'); // was: v1
        isComposite = false;
      }
      if (isComposite)
        logAdWarning('slot is unscheduled after been fulfilled.', slot, layout); // was: v1
    }
  }
}

// ---------------------------------------------------------------------------
// Layout Event Dispatchers  [was: LuR, wGR, bZO]  (line ~21062–21076)
// ---------------------------------------------------------------------------

/**
 * Fires when a layout is received (non-core origin only).
 * [was: LuR]
 */
export function onLayoutReceived(router, slot, layout) { // was: LuR
  if (slot.G2 !== 'core')
    fireAdEvent(router.httpStatusToGrpcCode, 'ADS_CLIENT_EVENT_TYPE_LAYOUT_RECEIVED', slot, layout); // was: cR
}

/**
 * Fires when a layout has been scheduled, notifying all listeners.
 * [was: wGR]
 */
export function notifyLayoutScheduled(router, slot, layout) { // was: wGR
  fireAdEvent(router.httpStatusToGrpcCode, 'ADS_CLIENT_EVENT_TYPE_LAYOUT_SCHEDULED', slot, layout); // was: cR
  for (const listener of router.O) // was: m
    listener.routeSeek(slot, layout);
}

/**
 * Fires when a layout has been entered (rendering will begin).
 * [was: bZO]
 */
export function notifyLayoutEntered(router, slot, layout) { // was: bZO
  fireAdEvent(router.httpStatusToGrpcCode, 'ADS_CLIENT_EVENT_TYPE_LAYOUT_ENTERED', slot, layout); // was: cR
  for (const listener of router.O) // was: m
    listener.normalizeAspectRatio(slot, layout);
}

// ---------------------------------------------------------------------------
// Slot Exit Request  [was: Fu_]  (line ~21078)
// ---------------------------------------------------------------------------

/**
 * Requests that a slot be exited. If a layout is currently rendering it
 * asks the layout to stop first; otherwise it sends the exit request
 * directly to the slot adapter.
 *
 * [was: Fu_]
 *
 * @param {object}  router  - command router   [was: Q]
 * @param {object}  slot    - slot to exit     [was: c]
 * @param {boolean} isError - true if exiting due to error [was: W]
 */
export function requestSlotExit(router, slot, isError) { // was: Fu_
  if (isSlotRegistered(router.W, slot) && isSlotActiveOrEnterRequested(getSlotState(router.W, slot))) { // was: h1, Cr
    const activeLayout = getActiveLayout(router.W, slot); // was: m = J1(Q.W, c)
    if (activeLayout && isLayoutRendering(router.W, slot)) { // was: WR
      requestLayoutExit(router, slot, activeLayout, isError ? 'error' : 'abandoned'); // was: jKR
    } else {
      fireSlotEvent(router.httpStatusToGrpcCode, 'ADS_CLIENT_EVENT_TYPE_EXIT_SLOT_REQUESTED', slot); // was: Mw
      try {
        const state = getSlotState(router.W, slot); // was: K = zA(Q.W, c)
        if (!state)
          throw new SlotError( // was: z
            'Cannot exit slot it is unregistered',
            undefined,
            'ADS_CLIENT_ERROR_MESSAGE_SLOT_WAS_UNREGISTERED',
          );
        if (
          state.W !== 'enter_requested' &&
          state.W !== 'entered' &&
          state.W !== 'rendering'
        )
          logIllegalStage(state.slot, state.W, 'exitSlot'); // was: md

        state.W = 'exit_requested';

        if (state.O === undefined) { // was: K.O === void 0
          state.W = 'scheduled';
          throw new SlotError( // was: z
            'Cannot exit slot because adapter is not defined',
            undefined,
            'ADS_CLIENT_ERROR_MESSAGE_NO_SLOT_ADAPTER_REGISTERED',
          );
        }
        state.O.z3(); // adapter.exitSlot()
      } catch (err) { // was: K
        if (err instanceof SlotError && err.iy) { // was: z
          logClientError(router.httpStatusToGrpcCode, 'ADS_CLIENT_ERROR_TYPE_EXIT_SLOT_FAILED', err.iy, slot); // was: KQ
          logAdWarning(err, slot, undefined, undefined, err.gt); // was: v1
        } else {
          logClientError(router.httpStatusToGrpcCode, 'ADS_CLIENT_ERROR_TYPE_EXIT_SLOT_FAILED', 'ADS_CLIENT_ERROR_MESSAGE_UNEXPECTED_ERROR', slot); // was: KQ
          logAdWarning(err, slot); // was: v1
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Layout Exited Notification  [was: gd7]  (line ~21104)
// ---------------------------------------------------------------------------

/**
 * Fires when a layout has exited, mapping the exit reason to the
 * appropriate event type.
 *
 * [was: gd7]
 */
export function notifyLayoutExited(router, slot, layout, exitReason) { // was: gd7
  fireAdEvent(router.httpStatusToGrpcCode, mapExitReasonToEventType(exitReason), slot, layout); // was: cR(Q.LO, HZK(m), c, W)
  for (const listener of router.O) // was: K
    listener.onLayoutExited(slot, layout, exitReason);
}

// ---------------------------------------------------------------------------
// Trigger Batch Processor  [was: pr]  (line ~21110)
// ---------------------------------------------------------------------------

/**
 * Sorts a batch of fired triggers by category priority, then dispatches
 * each group through the appropriate handler (layout exit, slot
 * expiration, fulfillment, entry).
 *
 * Triggers whose slot is in a scheduling phase are deferred to a queue.
 *
 * [was: pr]
 *
 * @param {object} router   - command router            [was: Q]
 * @param {Array}  triggers - array of trigger records  [was: c]
 */
export function processTriggerBatch(router, triggers) { // was: pr
  triggers.sort((a, b) => { // was: K, T
    if (a.category === b.category)
      return a.trigger.triggerId.localeCompare(b.trigger.triggerId);
    const warnMissing = (cat) => { // was: r = U => ...
      logAdWarning('TriggerCategoryOrder enum does not contain trigger category: ' + cat);
    };
    return getTriggerCategoryOrder(a.category, warnMissing) - getTriggerCategoryOrder(b.category, warnMissing); // was: Dbn
  });

  const categoryMap = new Map(); // was: W
  for (const trigger of triggers) { // was: m
    if (!isSlotRegistered(router.W, trigger.slot)) // was: h1
      continue;

    if (getSlotState(router.W, trigger.slot).D) { // was: zA(Q.W, m.slot).D -- slot is scheduling
      getSlotState(router.W, trigger.slot).L.push(trigger);
      continue;
    }

    logTriggerFired(router.httpStatusToGrpcCode, trigger.slot, trigger, trigger.layout); // was: OZn
    let bucket = categoryMap.get(trigger.category); // was: c = W.get(m.category)
    if (!bucket) bucket = [];
    bucket.push(trigger);
    categoryMap.set(trigger.category, bucket);
  }

  // Layout-exit categories dispatched via fay map
  for (const [category, exitReason] of LAYOUT_EXIT_CATEGORY_MAP) { // was: fay
    const bucket = categoryMap.get(category); // was: c
    if (bucket)
      processLayoutExitTriggers(router, bucket, exitReason); // was: vd7
  }

  // Slot expiration
  const expirationBucket = categoryMap.get('TRIGGER_CATEGORY_SLOT_EXPIRATION'); // was: m
  if (expirationBucket)
    processSlotExpirationTriggers(router, expirationBucket); // was: aaw

  // Slot fulfillment
  const fulfillmentBucket = categoryMap.get('TRIGGER_CATEGORY_SLOT_FULFILLMENT'); // was: m
  if (fulfillmentBucket)
    processSlotFulfillmentTriggers(router, fulfillmentBucket); // was: GSO

  // Slot entry
  const entryBucket = categoryMap.get('TRIGGER_CATEGORY_SLOT_ENTRY'); // was: W
  if (entryBucket)
    processSlotEntryTriggers(router, entryBucket); // was: $b3
}

// ---------------------------------------------------------------------------
// Layout Exit Trigger Processing  [was: vd7]  (line ~21142)
// ---------------------------------------------------------------------------

/**
 * For each trigger that has an associated layout currently rendering,
 * requests the layout to exit.
 *
 * [was: vd7]
 */
export function processLayoutExitTriggers(router, triggers, exitReason) { // was: vd7
  for (const trigger of triggers) // was: m
    if (trigger.layout && isLayoutRendering(router.W, trigger.slot)) // was: WR
      requestLayoutExit(router, trigger.slot, trigger.layout, exitReason); // was: jKR
}

// ---------------------------------------------------------------------------
// Slot Expiration Trigger Processing  [was: aaw]  (line ~21147)
// ---------------------------------------------------------------------------

/**
 * Expires each slot referenced by the given triggers.
 * [was: aaw]
 */
export function processSlotExpirationTriggers(router, triggers) { // was: aaw
  for (const trigger of triggers) // was: W
    expireSlot(router, trigger.slot, false); // was: YO(Q, W.slot, !1)
}

// ---------------------------------------------------------------------------
// Slot Fulfillment Trigger Processing  [was: GSO]  (line ~21152)
// ---------------------------------------------------------------------------

/**
 * For each trigger whose slot is not yet filled, requests fulfillment.
 * [was: GSO]
 */
export function processSlotFulfillmentTriggers(router, triggers) { // was: GSO
  for (const trigger of triggers) { // was: W
    let shouldFulfill; // was: c (reused in switch)
    switch (getSlotState(router.W, trigger.slot).j) { // was: zA(Q.W, W.slot).j
      case 'not_filled':
        shouldFulfill = true;
        break;
      default:
        shouldFulfill = false;
    }
    if (shouldFulfill) {
      fireSlotEvent(router.httpStatusToGrpcCode, 'ADS_CLIENT_EVENT_TYPE_FULFILL_SLOT_REQUESTED', trigger.slot); // was: Mw
      router.W.LayoutIdEnteredTrigger(trigger.slot);
    }
  }
}

// ---------------------------------------------------------------------------
// Slot Entry Trigger Processing  [was: $b3]  (line ~21166)
// ---------------------------------------------------------------------------

/**
 * Attempts to enter each slot referenced by the given entry triggers.
 * Validates adapter presence, stage legality, and slot collision before
 * requesting entry from the slot adapter.
 *
 * [was: $b3]
 */
export function processSlotEntryTriggers(router, triggers) { // was: $b3
  for (const trigger of triggers) { // was: K
    fireSlotEvent(router.httpStatusToGrpcCode, 'ADS_CLIENT_EVENT_TYPE_ENTER_SLOT_REQUESTED', trigger.slot); // was: Mw
    for (const listener of router.O) // was: T
      listener.buildTriggerDebugData(trigger.slot);

    try {
      const slotManager = router.W; // was: W
      const slot = trigger.slot; // was: m
      const state = getSlotState(slotManager, slot); // was: T = zA(W, m)

      if (!state)
        throw new SlotError('Got enter request for unknown slot', undefined, 'ADS_CLIENT_ERROR_MESSAGE_SLOT_STATE_IS_NULL'); // was: z
      if (!state.O)
        throw new SlotError('Tried to enter slot with no assigned slotAdapter', undefined, 'ADS_CLIENT_ERROR_MESSAGE_NO_SLOT_ADAPTER_REGISTERED');
      if (state.W !== 'scheduled')
        throw new SlotError('Tried to enter a slot from stage: ' + state.W, undefined, 'ADS_CLIENT_ERROR_MESSAGE_ILLEGAL_SLOT_STATE');
      if (isSlotActiveOrEnterRequested(state)) // was: Cr
        throw new SlotError('Got enter request for already active slot', undefined, 'ADS_CLIENT_ERROR_MESSAGE_SLOT_COLLISION');

      // Check for duplicate active slots of the same type+position
      for (const otherState of getSlotStatesByKey(slotManager, `${slot.slotType}_${slot.slotPhysicalPosition}`).values()) { // was: kO, r
        if (
          state !== otherState &&
          isSlotActiveOrEnterRequested(otherState) && // was: Cr
          (
            state.slot.fulfilledLayout?.layoutType !== 'LAYOUT_TYPE_VIDEO_INTERSTITIAL_CENTERED' ||
            otherState.layout?.layoutType !== 'LAYOUT_TYPE_MEDIA_LAYOUT_PLAYER_OVERLAY'
          )
        )
          throw new SlotError(
            'Trying to enter a slot when a slot of same type is already active.',
            { activeSlotStatus: otherState.W },
            'ADS_CLIENT_ERROR_MESSAGE_DUPLICATE_SLOT',
          );
      }
    } catch (err) { // was: T
      if (err instanceof SlotError && err.iy) { // was: z
        logClientError(router.httpStatusToGrpcCode, 'ADS_CLIENT_ERROR_TYPE_ENTER_SLOT_FAILED', err.iy, trigger.slot);
        logAdWarning(err, trigger.slot, getActiveLayout(router.W, trigger.slot), undefined, err.gt); // was: v1
      } else {
        logClientError(router.httpStatusToGrpcCode, 'ADS_CLIENT_ERROR_TYPE_ENTER_SLOT_FAILED', 'ADS_CLIENT_ERROR_MESSAGE_UNEXPECTED_ERROR', trigger.slot);
        logAdWarning(err, trigger.slot);
      }
      expireSlot(router, trigger.slot, true); // was: YO(Q, K.slot, !0)
      continue;
    }

    const entryState = getSlotState(router.W, trigger.slot); // was: c = zA(Q.W, K.slot)
    if (entryState.W !== 'scheduled')
      logIllegalStage(entryState.slot, entryState.W, 'enterSlot'); // was: md
    entryState.W = 'enter_requested';
    entryState.O.e4(); // adapter.enterSlot()
  }
}

// ---------------------------------------------------------------------------
// Layout Exit Request  [was: jKR]  (line ~21202)
// ---------------------------------------------------------------------------

/**
 * Requests that a layout stop rendering. Fires the appropriate exit event
 * and tells the adapter to stop.
 *
 * [was: jKR]
 *
 * @param {object} router     [was: Q]
 * @param {object} slot       [was: c]
 * @param {object} layout     [was: W]
 * @param {string} exitReason [was: m] - e.g. "error", "abandoned", "normal", "skipped"
 */
export function requestLayoutExit(router, slot, layout, exitReason) { // was: jKR
  if (!isSlotRegistered(router.W, slot)) return; // was: h1
  fireAdEvent(
    router.httpStatusToGrpcCode,
    EXIT_REASON_EVENT_MAP.get(exitReason)?.Cg || 'ADS_CLIENT_EVENT_TYPE_UNSPECIFIED', // was: tuR
    slot,
    layout,
  );
  const state = getSlotState(router.W, slot); // was: Q = zA(Q.W, c)
  if (state.W !== 'rendering')
    logIllegalStage(state.slot, state.W, 'exitLayout'); // was: md
  state.W = 'rendering_stop_requested';
  state.A.D5(layout, exitReason); // adapter.stopRendering()
}

// ---------------------------------------------------------------------------
// Slot-State Helpers  [was: Cr, h1, J1, Pd3, WR, kO, zA]  (line ~21210–21254)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the slot is in "enter_requested" or already active.
 * [was: Cr]
 */
export function isSlotActiveOrEnterRequested(state) { // was: Cr
  return state.W === 'enter_requested' || state.isActive();
}

/**
 * Returns `true` if the slot manager has a registered state for the slot.
 * [was: h1]
 */
export function isSlotRegistered(slotManager, slot) { // was: h1
  return getSlotState(slotManager, slot) != null;
}

/**
 * Returns the currently active layout for a slot, or `null`.
 * Logs a warning if state is unexpected.
 * [was: J1]
 */
export function getActiveLayout(slotManager, slot) { // was: J1
  const state = getSlotState(slotManager, slot); // was: Q = zA(Q, c)
  if (state) {
    if (state.layout != null && !state.layout)
      logAdWarning('Unexpected empty layout', slot);
  } else {
    logAdWarning('Unexpected undefined slotState', slot);
  }
  return state?.layout || null;
}

/**
 * Collects all registered slot descriptors.
 * [was: Pd3]
 */
export function getAllRegisteredSlots(router) { // was: Pd3
  const result = []; // was: c
  router.W.forEach((stateMap) => { // was: W
    for (const entry of stateMap.values()) // was: m
      result.push(entry.slot);
  });
  return result;
}

/**
 * Returns `true` if a slot has a layout and is currently rendering.
 * [was: WR]
 */
export function isLayoutRendering(slotManager, slot) { // was: WR
  const state = getSlotState(slotManager, slot); // was: Q = zA(Q, c)
  let hasLayout = state.layout != null; // was: c
  if (hasLayout) {
    switch (state.W) {
      case 'rendering':
      case 'rendering_stop_requested':
        hasLayout = true;
        break;
      default:
        hasLayout = false;
    }
  }
  return hasLayout;
}

/**
 * Returns the slot-state map for a given composite key, or an empty Map.
 * [was: kO]
 */
export function getSlotStatesByKey(slotManager, key) { // was: kO
  const map = slotManager.W.get(key); // was: Q = Q.W.get(c)
  return map ? map : new Map();
}

/**
 * Looks up the slot-state for a specific slot by its type, position, and ID.
 * [was: zA]
 */
export function getSlotState(slotManager, slot) { // was: zA
  return getSlotStatesByKey(slotManager, `${slot.slotType}_${slot.slotPhysicalPosition}`).get(slot.slotId);
}

// ---------------------------------------------------------------------------
// Trigger Validation  [was: er, ro]  (line ~21255–21278)
// ---------------------------------------------------------------------------

/**
 * Validates that a set of slot-level triggers have registered adapters.
 * Throws a SlotError if the triggers array is empty or an adapter is missing.
 *
 * [was: er]
 */
export function validateSlotTriggers(slotManager, category, triggers) { // was: er
  if (triggers.length == 0)
    throw new SlotError(
      `No ${TRIGGER_CATEGORY_NAMES.get(category)} triggers found for slot.`, // was: lam
      undefined,
      getTriggerErrorMessage(category), // was: usm
    );
  for (const trigger of triggers) // was: m
    if (!slotManager.rj.lW.get(trigger.triggerType))
      throw new SlotError(
        'No trigger adapter registered for ' + category + ' trigger of type: ' + trigger.triggerType,
        undefined,
        'ADS_CLIENT_ERROR_MESSAGE_NO_TRIGGER_ADAPTER_REGISTERED_FOR_TYPE',
      );
}

/**
 * Validates that layout-level triggers have registered adapters.
 * Throws a SchedulingError if an adapter is missing.
 *
 * [was: ro]
 */
export function validateLayoutTriggers(slotManager, category, triggers) { // was: ro
  for (const trigger of triggers) // was: m
    if (!slotManager.rj.lW.get(trigger.triggerType))
      throw new SchedulingError(
        `No trigger adapter registered for ${TRIGGER_CATEGORY_NAMES.get(category)} trigger of type: ${trigger.triggerType}`, // was: lam
        undefined,
        'ADS_CLIENT_ERROR_MESSAGE_NO_TRIGGER_ADAPTER_REGISTERED_FOR_TYPE',
      );
}

// ---------------------------------------------------------------------------
// Trigger Adapter Binding  [was: Ua]  (line ~21280)
// ---------------------------------------------------------------------------

/**
 * For each trigger, looks up the appropriate adapter, initialises it with
 * the slot + layout context, and stores it in the state's trigger map.
 *
 * [was: Ua]
 */
export function bindTriggerAdapters(slotManager, state, category, triggers) { // was: Ua
  for (const trigger of triggers) { // was: K
    const adapter = slotManager.rj.lW.get(trigger.triggerType); // was: m
    adapter.vN(category, trigger, state.slot, state.layout ? state.layout : null);
    state.S.set(trigger.triggerId, adapter);
  }
}

// ---------------------------------------------------------------------------
// Trigger Teardown  [was: Rz]  (line ~21267)
// ---------------------------------------------------------------------------

/**
 * Releases and removes trigger adapters from the state's trigger map.
 * [was: Rz]
 */
export function releaseTriggerAdapters(state, triggers) { // was: Rz
  for (const trigger of triggers) { // was: W
    const adapter = state.S.get(trigger.triggerId); // was: c
    if (adapter) {
      adapter.Rs(trigger);
      state.S.delete(trigger.triggerId);
    }
  }
}

// ---------------------------------------------------------------------------
// Illegal-Stage Warning  [was: md]  (line ~21263)
// ---------------------------------------------------------------------------

/**
 * Logs a warning when a slot method is called at an unexpected lifecycle stage.
 * [was: md]
 */
export function logIllegalStage(slot, stage, methodName) { // was: md
  logAdWarning(`Slot stage was ${stage} when calling method ${methodName}`, slot);
}

// ---------------------------------------------------------------------------
// Trigger Error-Message Lookup  [was: usm]  (line ~21287)
// ---------------------------------------------------------------------------

/**
 * Maps a trigger category to its missing-trigger error-message constant.
 * [was: usm]
 */
export function getTriggerErrorMessage(category) { // was: usm
  switch (category) {
    case 'TRIGGER_CATEGORY_SLOT_ENTRY':
      return 'ADS_CLIENT_ERROR_MESSAGE_EMPTY_SLOT_ENTRY_TRIGGER';
    case 'TRIGGER_CATEGORY_SLOT_EXPIRATION':
      return 'ADS_CLIENT_ERROR_MESSAGE_EMPTY_SLOT_EXPIRATION_TRIGGER';
    case 'TRIGGER_CATEGORY_SLOT_FULFILLMENT':
      return 'ADS_CLIENT_ERROR_MESSAGE_EMPTY_SLOT_FULFILLMENT_TRIGGER';
    default:
      return 'ADS_CLIENT_ERROR_MESSAGE_INVALID_TRIGGER';
  }
}

// ---------------------------------------------------------------------------
// Component Registry Helpers  [was: hTm, Vq]  (line ~21300–21309)
// ---------------------------------------------------------------------------

/**
 * Collects all disposable (jQ-flagged) components from every registry map.
 * [was: hTm]
 */
export function collectDisposableComponents(registry) { // was: hTm
  return collectFlagged(registry.itagToCodecMap)
    .concat(collectFlagged(registry.lW))
    .concat(collectFlagged(registry.ZW))
    .concat(collectFlagged(registry.createLoggerFromConfig))
    .concat(collectFlagged(registry.jn));
}

/**
 * Collects entries from a map whose `.jQ` flag is truthy.
 * [was: Vq]
 */
export function collectFlagged(map) { // was: Vq
  const result = []; // was: c
  for (const entry of map.values()) // was: W
    if (entry.sortFormats) result.push(entry);
  return result;
}

// ---------------------------------------------------------------------------
// Command Router Factory  [was: J, JJR]  (line ~21311–21319)
// ---------------------------------------------------------------------------

/**
 * Wraps a router config into a new zTn instance.
 * [was: J]
 */
export function createRouterWrapper(config) { // was: J
  return new zTn(config); // was: new zTn(Q)
}

/**
 * Creates a full Cdn command-router from the given wrapper.
 * [was: JJR]
 */
export function createCommandRouter(wrapper) { // was: JJR
  const router = new Cdn( // was: c
    (a, b, c, d) => new MuW(wrapper.W.rj, a, b, c, d, wrapper.W.QC), // was: W, m, K, T
    new Set(collectDisposableComponents(wrapper.W.rj).concat(wrapper.W.listeners)),
    wrapper.W.httpStatusToGrpcCode,
    wrapper.W.QC,
  );
  registerDisposable(wrapper, router);
  return router;
}

// ---------------------------------------------------------------------------
// Router Invocation Helpers  [was: BR, xA]  (line ~21321–21328)
// ---------------------------------------------------------------------------

/**
 * Sends a command through the router.
 * [was: BR]
 */
export function sendCommand(routerGetter, slot, layout) { // was: BR
  processActionCommands(routerGetter.W(), slot, layout); // was: BwW(Q.W(), c, W)
}

/**
 * Executes a command via the router, with an optional third argument.
 * [was: xA]
 */
export function executeCommand(routerGetter, slot, layout, extra) { // was: xA
  const router = routerGetter.W(); // was: Q = Q.W()
  if (!router) logAdWarning('Could not initiate a command router instance.'); // was: v1
  dispatchAction(router, slot, layout, extra);
}

// ---------------------------------------------------------------------------
// SODAR Snapshot Export  [was: RTK]  (line ~21330)
// ---------------------------------------------------------------------------

/**
 * Conditionally initialises SODAR (Google measurement) snapshot export.
 * [was: RTK]
 */
export function initSodarSnapshot(context, config) { // was: RTK
  const hasBgParams = config.bgp && config.bgub; // was: W
  const hasUpb = !!config.upb; // was: m
  if (config.siub && config.scs && (hasBgParams || hasUpb)) {
    if (hasUpb && hasExperimentFlag(context.QC.get(), 'html5_export_sodar_snapshot')) // was: qP
      registerSnapshotCallback(async (key) => (await loadModule(getModulePath())).snapshot(key)); // was: L7, bQ, t1
    initSodarConfig(config.siub, config.scs, config.bgub, config.bgp, config.upb); // was: NOx
  }
}

// ---------------------------------------------------------------------------
// Ad-Break Request Fulfillment  [was: pGR]  (line ~21337)
// ---------------------------------------------------------------------------

/**
 * Initiates an ad-break request for a slot. On success, creates a
 * throttled/normal ad-break response layout and delivers it via the
 * fulfillment callback. On failure, reports an error unless cancelled.
 *
 * [was: pGR]
 *
 * @param {object}   context         - slot fulfillment context   [was: Q]
 * @param {Function} requestFactory  - creates the async request  [was: c]
 * @param {Function} [onError]       - called on non-cancel error [was: W]
 * @param {Function} [onSuccess]     - called with response       [was: m]
 */
export function fulfillAdBreakRequest(context, requestFactory, onError, onSuccess) { // was: pGR
  if (context.W) {
    logAdWarning('Currently active request ongoing for slot. This should never happen', context.slot);
  }

  context.W = requestFactory();

  context.W.then(
    (response) => { // was: K
      context.W = null;
      if (onSuccess) onSuccess(response);

      const layoutType = response.aU // was: T
        ? 'LAYOUT_TYPE_THROTTLED_AD_BREAK_RESPONSE'
        : 'LAYOUT_TYPE_AD_BREAK_RESPONSE';

      const idProvider = context.O.get(); // was: r
      const slotId = context.slot.slotId; // was: U
      const renderingId = generateRenderingId(context.CastController.get(), { // was: I = $O(...)
        slotId: context.slot.slotId,
        slotType: context.slot.slotType,
        slotPhysicalPosition: context.slot.slotPhysicalPosition,
        G2: context.slot.G2,
        slotEntryTrigger: context.slot.slotEntryTrigger,
        slotFulfillmentTriggers: context.slot.slotFulfillmentTriggers,
        slotExpirationTriggers: context.slot.slotExpirationTriggers,
      });

      const layoutId = generateLayoutId(idProvider.O.get(), layoutType, slotId); // was: X = nQ(...)
      const layoutDescriptor = { // was: A
        layoutId: layoutId,
        layoutType: layoutType,
        G2: 'core',
      };

      const layout = { // was: K (reused)
        layoutId: layoutId,
        layoutType: layoutType,
        zy: new Map(),
        layoutExitNormalTriggers: [new AdBreakExitTrigger(idProvider.W, slotId)], // was: kSn
        layoutExitSkipTriggers: [],
        layoutExitMuteTriggers: [],
        layoutExitUserInputSubmittedTriggers: [],
        layoutExitUserCancelledTriggers: [],
        G2: 'core',
        clientMetadata: new ClientMetadataCollection([new AdBreakResponseMetadata(response)]), // was: PI, Y9m
        Je: renderingId(layoutDescriptor),
      };

      onSlotFulfilled(context.callback, context.slot, layout); // was: dbm
    },
    (error) => { // was: K
      context.W = null;
      if (onError) onError();
      if (!(error instanceof CancelledError)) // was: eH
        reportFulfillmentError(
          context.callback,
          context.slot,
          new SlotError(error, undefined, 'ADS_CLIENT_ERROR_MESSAGE_AD_BREAK_REQUEST_ERROR', true), // was: z
          'ADS_CLIENT_ERROR_TYPE_FULFILL_SLOT_FAILED',
        );
    },
  );
}

// ---------------------------------------------------------------------------
// Cancel Slot Fulfillment  [was: QOw]  (line ~21384)
// ---------------------------------------------------------------------------

/**
 * Cancels any in-flight fulfillment request for a slot and notifies the
 * callback.
 *
 * [was: QOw]
 */
export function cancelSlotFulfillment(context) { // was: QOw
  if (context.W == null) {
    context.callback.yB(context.slot);
  } else {
    try {
      context.W.cancel();
      context.W = null;
      context.callback.yB(context.slot);
    } catch (err) { // was: c
      context.W = null;
      reportFulfillmentError(
        context.callback,
        context.slot,
        new SlotError(err, undefined, 'ADS_CLIENT_ERROR_MESSAGE_CANCEL_SLOT_FULFILLMENT_FAILURE'), // was: z
        'ADS_CLIENT_ERROR_TYPE_CANCEL_FULFILL_SLOT_FAILED',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// URL Validation  [was: D6, tI, Wv0, HR, g.NP, oF3, U1X, Xx7]  (line ~21398–21429)
// ---------------------------------------------------------------------------

/**
 * Core URL validator. Optionally reports invalid URLs via reportWarning.
 * [was: D6]
 *
 * @param {boolean} isValid  - whether the URL matched the regex
 * @param {string}  url      - the URL being validated
 * @param {boolean} [report=false] - whether to report invalid URLs
 * @param {string}  [label='']     - human label for error messages
 * @returns {boolean}
 */
export function validateUrl(isValid, url, report = false, label = '') { // was: D6
  if (!isValid && report)
    reportWarning(Error(`Player URL validator detects invalid url. ${label}: ${url}`));
  return isValid;
}

/**
 * Tests a URL against a regex, returning a boolean.
 * [was: tI]
 */
export function testUrlPattern(url, pattern) { // was: tI
  return pattern && pattern.test(url) ? true : false;
}

/**
 * Extracts the hostname portion of a URL using the cdw regex.
 * [was: Wv0]
 */
export function extractHostname(url) { // was: Wv0
  const match = cdw && cdw.exec(url); // was: Q = cdw && cdw.exec(Q)
  return match ? match[0] : '';
}

/**
 * Validates a trusted stream URL.
 * [was: HR]
 */
export function validateStreamUrl(url) { // was: HR
  return validateUrl(testUrlPattern(url, m1d), url, false, 'Trusted Stream URL'); // was: D6(tI(Q, m1d), Q, !1, ...)
}

/**
 * Validates a trusted image URL.
 * [was: g.NP]
 */
export function validateImageUrl(url) { // was: g.NP
  return validateUrl(testUrlPattern(url, Kvw), url, false, 'Trusted Image URL');
}

/**
 * Validates a trusted promoted-video domain URL.
 * [was: oF3]
 */
export function validatePromotedVideoDomainUrl(url) { // was: oF3
  return validateUrl(testUrlPattern(url, TC0), url, false, 'Trusted Promoted Video Domain URL');
}

/**
 * Validates a DRM licensor URL.
 * [was: U1X]
 */
export function validateDrmLicensorUrl(url) { // was: U1X
  return validateUrl(testUrlPattern(url, rd0), url, false, 'Drm Licensor URL');
}

/**
 * Validates a captions URL, optionally reporting invalid ones.
 * [was: Xx7]
 */
export function validateCaptionsUrl(url, report = false) { // was: Xx7
  return validateUrl(testUrlPattern(url, IAK), url, report, 'Captions URL');
}

// ---------------------------------------------------------------------------
// URL Normalisers  [was: Add, iR]  (line ~21431–21443)
// ---------------------------------------------------------------------------

/**
 * Converts a relative URL to an absolute one using the current document origin.
 * [was: Add]
 */
export function makeAbsoluteUrl(url) { // was: Add
  const parsed = new Uri(url); // was: Q
  setUriScheme(parsed, document.location.protocol);
  g.oO(parsed, document.location.hostname);
  if (document.location.port) g.rC(parsed, document.location.port);
  return parsed.toString();
}

/**
 * Ensures a URL uses the current document's protocol.
 * [was: iR]
 */
export function ensureProtocol(url) { // was: iR
  const parsed = new Uri(url); // was: Q
  setUriScheme(parsed, document.location.protocol);
  return parsed.toString();
}

// ---------------------------------------------------------------------------
// Ad Position Label  [was: e97]  (line ~21445)
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable label for special ad-position sentinel values,
 * or the numeric string representation.
 *
 * [was: e97]
 */
export function formatAdPosition(position) { // was: e97
  if (position === -0x8000000000000) return 'BEFORE_MEDIA_START';
  if (position === 0) return 'MEDIA_START';
  if (position === 0x7ffffffffffff) return 'MEDIA_END';
  if (position === 0x8000000000000) return 'AFTER_MEDIA_END';
  return position.toString();
}

// ---------------------------------------------------------------------------
// Cue-Range Comparator & ID Generators  [was: g.yq, g.Sr, g.FC]  (line ~21449–21459)
// ---------------------------------------------------------------------------

/**
 * Comparator for sorting cue-ranges by start time, then priority, then O.
 * [was: g.yq]
 */
export function compareCueRanges(a, b) { // was: g.yq
  return a.start - b.start || a.priority - b.priority || a.O - b.O;
}

/**
 * Creates a cue-range "start" ID.
 * [was: g.Sr]
 */
export function cueRangeStartId(id) { // was: g.Sr
  return `crn_${id}`;
}

/**
 * Creates a cue-range "end" ID.
 * [was: g.FC]
 */
export function cueRangeEndId(id) { // was: g.FC
  return `crx_${id}`;
}

// ---------------------------------------------------------------------------
// Marker Priority  [was: VXx]  (line ~21461)
// ---------------------------------------------------------------------------

/**
 * Returns the minimum-width (in px) for a given marker style, used to
 * decide whether a marker is worth rendering at small scrubber sizes.
 *
 * [was: VXx]
 *
 * @param {object}  marker       - marker descriptor with .style
 * @param {boolean} isExpanded   - whether the scrubber is expanded
 * @returns {number}
 */
export function getMarkerMinWidth(marker, isExpanded) { // was: VXx
  switch (marker.style) {
    case MarkerStyle.CHAPTER_MARKER: // was: Z6.CHAPTER_MARKER
      return isExpanded ? 8 : 5;
    case MarkerStyle.AD_MARKER: // was: Z6.AD_MARKER
      return 6;
    case MarkerStyle.TIME_MARKER: // was: Z6.TIME_MARKER
      return Number.POSITIVE_INFINITY;
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Cue-Point Dismissal  [was: BCR]  (line ~21474)
// ---------------------------------------------------------------------------

/**
 * Dismisses a cue-point by its identifier stored in the slot's metadata.
 * [was: BCR]
 */
export function dismissCuePoint(context) { // was: BCR
  context.G7?.get().Hk(
    context.slot.clientMetadata.readTimecodeScale('metadata_type_cue_point').identifier,
  );
}

// ---------------------------------------------------------------------------
// NOTE: Lines beyond ~21478 continue with layout-type metadata builders,
// ping tracking maps, ad-break response adapters, companion layout
// selectors, and player-bytes overlay scheduling – see separate modules.
// ---------------------------------------------------------------------------
