/**
 * Ad Trigger / Timing Logic
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~73302-74000
 *
 * Covers ad scheduling triggers, trigger category constants, ad break
 * request/response metadata types, slot/layout lifecycle state machines,
 * and the control-flow manager that orchestrates slot entry/exit.
 */

// ---------------------------------------------------------------------------
// Imports (conceptual)
// ---------------------------------------------------------------------------
import { Disposable } from '../core/lifecycle.js'; // was: g.qK
import { logError } from '../core/composition-helpers.js';
import { dispose } from './dai-cue-range.js';

// ---------------------------------------------------------------------------
// Ping Macro Keys [was: mz7]  (line ~73321)
// ---------------------------------------------------------------------------

/**
 * Named macro keys substituted into ad ping URLs at fire time.
 *
 * Each key maps to a placeholder token (e.g. `{AD_CPN}`) that the pinging
 * system replaces with a live value.
 *
 * [was: mz7]
 */
export const AD_PING_MACROS = {
  FINAL:                   'FINAL',               // was: KS
  AD_BREAK_LENGTH:         'AD_BREAK_LENGTH',      // was: uJ
  AD_CPN:                  'AD_CPN',               // was: hK
  AD_HEIGHT:               'AH',                   // was: DJ
  AD_MEDIA_TIME:           'AD_MT',                // was: XW
  AD_SKIP_RATIO:           'ASR',                  // was: gQ
  AD_WIDTH:                'AW',                   // was: JK
  NETWORK_MANAGER:         'NM',                   // was: nM
  NX_DIMENSION:            'NX',                   // was: YB
  NY_DIMENSION:            'NY',                   // was: S1
  CONNECTION_TYPE:          'CONN',                // was: e7
  CONTENT_CPN:             'CPN',                  // was: zD
  DV_VIEWABILITY:          'DV_VIEWABILITY',       // was: kP
  ERROR_CODE:              'ERRORCODE',            // was: vE
  ERROR_MSG:               'ERROR_MSG',            // was: n_
  EVENT_ID:                'EI',                   // was: S7
  GOOGLE_VIEWABILITY:      'GOOGLE_VIEWABILITY',   // was: Cb
  IAS_VIEWABILITY:         'IAS_VIEWABILITY',      // was: oz
  LAST_ACTIVITY:           'LACT',                 // was: H$
  LIVE_TARGETING_CONTEXT:  'LIVE_TARGETING_CONTEXT', // was: c$
  INTERACTION_X:           'I_X',                  // was: SY
  INTERACTION_Y:           'I_Y',                  // was: RQ
  MEDIA_TIME:              'MT',                   // was: T_
  MIDROLL_POSITION:        'MIDROLL_POS',          // was: wz
  MIDROLL_POSITION_MS:     'MIDROLL_POS_MS',       // was: a7
  MOAT_INIT:               'MOAT_INIT',            // was: I7
  MOAT_VIEWABILITY:        'MOAT_VIEWABILITY',     // was: pj
  PLAYER_HEIGHT:           'elementsCommandKey',                  // was: Yj
  PLAYER_VISIBLE_HEIGHT:   'PV_H',                // was: SJ
  PLAYER_VISIBLE_WIDTH:    'PV_W',                // was: R7
  PLAYER_WIDTH:            'P_W',                  // was: FFM
  TRIGGER_TYPE:            'TRIGGER_TYPE',         // was: mMJ
  SDK_VERSION:             'SDKV',                 // was: VGI
  SLOT_POSITION:           'SLOT_POS',             // was: pB0
  SURVEY_LOCAL_TIME:       'SURVEY_LOCAL_TIME_EPOCH_S', // was: yeJ
  SURVEY_ELAPSED_MS:       'SURVEY_ELAPSED_MS',    // was: xQH
  VISIBILITY:              'VIS',                  // was: sS
  VIEWABILITY:             'VIEWABILITY',          // was: mmG
  VED:                     'VED',                  // was: ttH
  VOLUME:                  'VOL',                  // was: TAF
  WATCH_TIME:              'WT',                   // was: f70
  YT_ERROR_CODE:           'YT_ERROR_CODE',        // was: BAG
};

// ---------------------------------------------------------------------------
// Trigger Category Maps [was: fay, lam]  (line ~73768-73770)
// ---------------------------------------------------------------------------

/**
 * Maps trigger categories to human-readable exit reasons.
 * Used when a layout exits -- determines what kind of exit it was.
 *
 * [was: fay]
 */
export const TRIGGER_EXIT_REASONS = new Map([
  ['TRIGGER_CATEGORY_LAYOUT_EXIT_NORMAL',           'normal'],
  ['TRIGGER_CATEGORY_LAYOUT_EXIT_USER_SKIPPED',     'skipped'],
  ['TRIGGER_CATEGORY_LAYOUT_EXIT_USER_MUTED',       'muted'],
  ['TRIGGER_CATEGORY_LAYOUT_EXIT_USER_INPUT_SUBMITTED', 'user_input_submitted'],
  ['TRIGGER_CATEGORY_LAYOUT_EXIT_USER_CANCELLED',   'user_cancelled'],
]);

/**
 * Maps trigger categories to internal logging identifiers.
 * [was: lam]
 */
export const TRIGGER_CATEGORY_IDS = new Map([
  ['TRIGGER_CATEGORY_LAYOUT_EXIT_NORMAL',               'trigger_category_layout_exit_normal'],
  ['TRIGGER_CATEGORY_LAYOUT_EXIT_USER_SKIPPED',         'trigger_category_layout_exit_user_skipped'],
  ['TRIGGER_CATEGORY_LAYOUT_EXIT_USER_MUTED',           'trigger_category_layout_exit_user_muted'],
  ['TRIGGER_CATEGORY_SLOT_EXPIRATION',                   'trigger_category_slot_expiration'],
  ['TRIGGER_CATEGORY_SLOT_FULFILLMENT',                  'trigger_category_slot_fulfillment'],
  ['TRIGGER_CATEGORY_SLOT_ENTRY',                        'trigger_category_slot_entry'],
  ['TRIGGER_CATEGORY_LAYOUT_EXIT_USER_INPUT_SUBMITTED',  'trigger_category_layout_exit_user_input_submitted'],
  ['TRIGGER_CATEGORY_LAYOUT_EXIT_USER_CANCELLED',        'trigger_category_layout_exit_user_cancelled'],
]);

/**
 * Maps exit reason strings to ADS_CLIENT_EVENT_TYPE pairs for telemetry.
 * [was: tuR]
 */
export const EXIT_REASON_EVENTS = new Map([
  ['normal',               { requested: 'ADS_CLIENT_EVENT_TYPE_NORMAL_EXIT_LAYOUT_REQUESTED',                exited: 'ADS_CLIENT_EVENT_TYPE_LAYOUT_EXITED_NORMALLY' }],
  ['skipped',              { requested: 'ADS_CLIENT_EVENT_TYPE_SKIP_EXIT_LAYOUT_REQUESTED',                  exited: 'ADS_CLIENT_EVENT_TYPE_LAYOUT_EXITED_SKIP' }],
  ['muted',                { requested: 'ADS_CLIENT_EVENT_TYPE_MUTE_EXIT_LAYOUT_REQUESTED',                  exited: 'ADS_CLIENT_EVENT_TYPE_LAYOUT_EXITED_MUTE' }],
  ['abandoned',            { requested: 'ADS_CLIENT_EVENT_TYPE_ABANDON_EXIT_LAYOUT_REQUESTED',               exited: 'ADS_CLIENT_EVENT_TYPE_LAYOUT_EXITED_ABANDON' }],
  ['user_input_submitted', { requested: 'ADS_CLIENT_EVENT_TYPE_USER_INPUT_SUBMITTED_EXIT_LAYOUT_REQUESTED',  exited: 'ADS_CLIENT_EVENT_TYPE_LAYOUT_EXITED_USER_INPUT_SUBMITTED' }],
  ['user_cancelled',       { requested: 'ADS_CLIENT_EVENT_TYPE_USER_CANCELLED_EXIT_LAYOUT_REQUESTED',        exited: 'ADS_CLIENT_EVENT_TYPE_LAYOUT_EXITED_USER_CANCELLED' }],
  ['error',                { requested: 'ADS_CLIENT_EVENT_TYPE_ABORTED_EXIT_LAYOUT_REQUESTED',               exited: 'ADS_CLIENT_EVENT_TYPE_LAYOUT_EXITED_ABORTED' }],
]); // was: tuR

// ---------------------------------------------------------------------------
// Metadata Value Wrapper [was: qh]  (line ~73397)
// ---------------------------------------------------------------------------

/**
 * Base class for typed metadata values attached to ad slots/layouts.
 * Each subclass returns a string key identifying its metadata type.
 * [was: qh]
 */
export class MetadataValue {
  /** @param {*} value [was: Q] */
  constructor(value) {
    this.value = value; // was: this.value = Q
  }
  get() { return this.value; }
  /** @returns {string} Metadata type key. Subclasses override. */
  key() { return ''; } // was: W()
}

// Selected concrete metadata types (representative subset):

export class AdPlacementConfigMeta extends MetadataValue {
  key() { return 'metadata_type_ad_placement_config'; } // was: kb
}

export class AdPodInfoMeta extends MetadataValue {
  key() { return 'metadata_type_ad_pod_info'; } // was: qZ
}

export class ContentCpnMeta extends MetadataValue {
  key() { return 'metadata_type_content_cpn'; } // was: Ut
}

export class PlayerVarsMeta extends MetadataValue {
  key() { return 'metadata_type_player_vars'; } // was: XT
}

export class CuePointMeta extends MetadataValue {
  key() { return 'metadata_type_cue_point'; } // was: KF0
}

export class LayoutEnterMsMeta extends MetadataValue {
  key() { return 'metadata_type_layout_enter_ms'; } // was: Aq
}

export class LayoutExitMsMeta extends MetadataValue {
  key() { return 'metadata_type_layout_exit_ms'; } // was: en
}

export class VideoLengthSecondsMeta extends MetadataValue {
  key() { return 'metadata_type_video_length_seconds'; } // was: IL
}

export class AdBreakRequestDataMeta extends MetadataValue {
  key() { return 'metadata_type_ad_break_request_data'; } // was: mtw
}

export class AdBreakResponseDataMeta extends MetadataValue {
  key() { return 'metadata_type_ad_break_response_data'; } // was: Y9m
}

export class PrefetchMeta extends MetadataValue {
  constructor() { super({}); }
  key() { return 'metadata_type_prefetch_metadata'; } // was: xD3
}

export class MediaLayoutDurationSecondsMeta extends MetadataValue {
  key() { return 'METADATA_TYPE_MEDIA_LAYOUT_DURATION_seconds'; } // was: KC
}

// ---------------------------------------------------------------------------
// MetadataCollection [was: PI]  (line ~73791)
// ---------------------------------------------------------------------------

/**
 * An indexed collection of `MetadataValue` instances for a slot or layout.
 * [was: PI]
 */
export class MetadataCollection {
  /**
   * @param {MetadataValue[]} items [was: Q]
   */
  constructor(items) {
    /** @type {Map<string, MetadataValue>} [was: this.W] */
    this._map = new Map();
    for (const item of items) {
      this._map.set(item.key(), item);
    }
  }

  /**
   * Look up a metadata value by its type key.
   * @param {string} typeKey [was: Q]
   * @returns {*|undefined}
   * [was: qM(Q)]
   */
  query(typeKey) {
    const entry = this._map.get(typeKey);
    return entry?.get();
  }
}

// ---------------------------------------------------------------------------
// SlotState [was: TNW]  (line ~73920)
// ---------------------------------------------------------------------------

/**
 * Tracks the lifecycle state of a single ad slot.
 *
 * State machine for `scheduleState` [was: this.W]:
 *   not_scheduled -> scheduled -> enter_requested -> entered -> rendering
 *     -> rendering_stop_requested -> exit_requested -> (back to scheduled)
 *
 * Fill state [was: this.j]:
 *   not_filled -> fill_requested -> filled | fill_canceled
 *
 * [was: TNW]
 */
export class SlotState {
  /**
   * @param {Object} slot [was: Q]
   */
  constructor(slot) {
    this.slot = slot;

    /** @type {Map} Trigger handlers by category [was: this.b0] */
    this.entryTriggers = new Map();

    /** @type {Map} [was: this.mF] */
    this.exitTriggers = new Map();

    /** @type {Map} [was: this.Y] */
    this.fulfillmentTriggers = new Map();

    /** @type {Map} [was: this.S] */
    this.expirationTriggers = new Map();

    /** @type {Object|undefined} Active layout being rendered [was: this.layout] */
    this.layout = undefined;

    /** @type {Object|undefined} Fill adapter [was: this.J] */
    this.fillAdapter = undefined;

    /** @type {Object|undefined} Rendering adapter [was: this.O] */
    this.renderingAdapter = undefined;

    /** @type {Object|undefined} [was: this.A] */
    this.fulfillmentAdapter = undefined;

    /** @type {boolean} [was: this.K] */
    this.isSlotDisposed = false;

    /** @type {boolean} [was: this.D] */
    this.hasError = false;

    /** @type {Array} Pending layouts [was: this.L] */
    this.pendingLayouts = [];

    /** @type {string} Schedule lifecycle state [was: this.W] */
    this.scheduleState = 'not_scheduled';

    /** @type {string} Fill lifecycle state [was: this.j] */
    this.fillState = 'not_filled';
  }

  /**
   * Whether the slot is currently active (entered or rendering).
   * [was: isActive()]
   */
  isActive() {
    switch (this.scheduleState) {
      case 'entered':
      case 'rendering':
      case 'rendering_stop_requested':
      case 'exit_requested':
        return true;
      default:
        return false;
    }
  }
}

// ---------------------------------------------------------------------------
// ControlFlowManager [was: MuW]  (line ~73946)
// ---------------------------------------------------------------------------

/**
 * Manages the lifecycle of all ad slots: scheduling, filling, entering,
 * rendering, and exiting. The central state machine coordinator.
 *
 * [was: MuW]
 */
export class ControlFlowManager extends Disposable {
  /**
   * @param {Function}  slotRegistry     [was: Q / this.rj]
   * @param {Object}    fillAdapter      [was: c / this.A]
   * @param {Object}    renderAdapter    [was: W / this.K]
   * @param {Object}    fulfillAdapter   [was: m / this.j]
   * @param {Object}    exitAdapter      [was: K / this.O]
   * @param {Object}    configProvider   [was: T / this.QC]
   */
  constructor(slotRegistry, fillAdapter, renderAdapter, fulfillAdapter, exitAdapter, configProvider) {
    super();
    this.slotRegistry = slotRegistry;
    this.fillAdapter = fillAdapter;
    this.renderAdapter = renderAdapter;
    this.fulfillAdapter = fulfillAdapter;
    this.exitAdapter = exitAdapter;
    this.configProvider = configProvider;

    /** @type {Map<string, SlotState>} [was: this.W] */
    this.slots = new Map();
  }

  /**
   * Get all slots matching a given type and position.
   * @param {string} slotType    [was: Q]
   * @param {string} slotPosition [was: c]
   * @returns {Object[]}
   * [was: oo(Q, c)]
   */
  getSlots(slotType, slotPosition) {
    const key = `${slotType}_${slotPosition}`;
    const states = this._getSlotStates(key);
    return Array.from(states.values()).map((s) => s.slot);
  }

  /** Mark a slot as scheduled. [was: Rr(Q)] */
  scheduleSlot(slot) {
    const state = this._getState(slot);
    state.scheduleState = 'scheduled';
  }

  /** Request fill for a slot. [was: Gu(Q)] */
  requestFill(slot) {
    const state = this._getState(slot);
    state.fillState = 'fill_requested';
    state.fillAdapter?.requestFill(); // was: Q.J.Gu()
  }

  /** Mark a slot as entered. [was: gH(Q)] */
  enterSlot(slot) {
    const state = this._getState(slot);
    state.scheduleState = 'entered';
  }

  /** Cancel fill for a slot. [was: yB(Q)] */
  cancelFill(slot) {
    this._getState(slot).fillState = 'fill_canceled';
  }

  /** Mark a slot as exited, returning to scheduled. [was: HG(Q)] */
  exitSlot(slot) {
    const state = this._getState(slot);
    state.scheduleState = 'scheduled';
  }

  /** Mark a layout as exited within its slot. [was: onLayoutExited(Q, c)] */
  onLayoutExited(slot, layout) {
    const state = this._getState(slot);
    if (state.layout?.layoutId === layout.layoutId) {
      state.scheduleState = 'entered';
    }
  }

  // -- Private helpers ---
  _getState(_slot) { return new SlotState(_slot); }
  _getSlotStates(_key) { return new Map(); }
}

// ---------------------------------------------------------------------------
// AdEventRouter [was: Cdn]  (line ~73843)
// ---------------------------------------------------------------------------

/**
 * Routes ad lifecycle events (opportunity received, slot entered/exited,
 * layout entered/exited, errors) to registered observers and the telemetry
 * logger.
 *
 * [was: Cdn]
 */
export class AdEventRouter extends Disposable {
  /**
   * @param {Function}  controlFlowFactory  [was: Q]
   * @param {Array}     observers           [was: c / this.O]
   * @param {Object}    telemetryLogger     [was: W / this.LO]
   * @param {Object}    configProvider      [was: m / this.QC]
   */
  constructor(controlFlowFactory, observers, telemetryLogger, configProvider) {
    super();
    this.observers = observers;
    this.telemetryLogger = telemetryLogger;
    this.configProvider = configProvider;
    this.controlFlow = controlFlowFactory(this, this, this, this, this); // was: Q(this,this,this,this,this)
  }

  /** New ad opportunity received. [was: SB(Q, c)] */
  onOpportunityReceived(slots, layouts) {
    this.telemetryLogger.log('ADS_CLIENT_EVENT_TYPE_OPPORTUNITY_RECEIVED', slots, layouts);
    for (const observer of this.observers) {
      observer.onOpportunityReceived(slots, layouts);
    }
  }

  /** Slot has entered. [was: gH(Q)] */
  onSlotEntered(slot) {
    this.telemetryLogger.log('ADS_CLIENT_EVENT_TYPE_SLOT_ENTERED', slot);
    this.controlFlow.enterSlot(slot);
    for (const observer of this.observers) {
      observer.onSlotEntered(slot);
    }
  }

  /** Slot has exited. [was: HG(Q)] */
  onSlotExited(slot) {
    this.telemetryLogger.log('ADS_CLIENT_EVENT_TYPE_SLOT_EXITED', slot);
    this.controlFlow.exitSlot(slot);
    for (const observer of this.observers) {
      observer.onSlotExited(slot);
    }
  }

  /** Layout has entered. [was: Mm(Q, c)] */
  onLayoutEntered(slot, layout) {
    this.telemetryLogger.log('ADS_CLIENT_EVENT_TYPE_LAYOUT_ENTERED', slot, layout);
    for (const observer of this.observers) {
      observer.onLayoutEntered(slot, layout);
    }
  }

  /** Layout has exited. [was: onLayoutExited(Q, c, W)] */
  onLayoutExited(slot, layout, exitReason) {
    const eventType = EXIT_REASON_EVENTS.get(exitReason)?.exited ?? 'UNKNOWN';
    this.telemetryLogger.log(eventType, slot, layout);
    this.controlFlow.onLayoutExited(slot, layout);
    for (const observer of this.observers) {
      observer.onLayoutExited(slot, layout, exitReason);
    }
  }

  /** Error during slot processing. [was: Gm(Q, c, W, m)] */
  onError(slot, layout, error, clientEventMessage) {
    if (error && clientEventMessage) {
      this.telemetryLogger.logError(clientEventMessage, error, slot, layout);
    }
    // Force-exit the slot
  }

  dispose() {
    // Exit all active slots on teardown
    super.dispose();
  }
}
