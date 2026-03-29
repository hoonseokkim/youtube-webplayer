/**
 * Ad Trigger Type Classes
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~78700-79040
 *
 * Each trigger class represents a specific event condition that drives
 * the ad slot/layout lifecycle state machine. Triggers are registered
 * with the scheduling system via TRIGGER_CATEGORY_SLOT_ENTRY,
 * TRIGGER_CATEGORY_SLOT_FULFILLMENT, or TRIGGER_CATEGORY_SLOT_EXPIRATION.
 *
 * Naming convention: `TRIGGER_TYPE_<NAME>` string constants are stored
 * as `.triggerType` on each instance and used for dispatch.
 */

// ---------------------------------------------------------------------------
// Imports (conceptual)
// ---------------------------------------------------------------------------
// No external dependencies -- these are plain data classes.

// ---------------------------------------------------------------------------
// BeforeContentVideoIdStartedTrigger [was: sz]  (line 78701)
// ---------------------------------------------------------------------------

/**
 * Fires before the content video with the given ID starts.
 *
 * [was: sz]
 */
export class BeforeContentVideoIdStartedTrigger { // was: sz
  /**
   * @param {Function} idGenerator  Generates unique trigger IDs [was: Q]
   * @param {string}   videoId      Content video ID to watch [was: c -> IY]
   * @param {string}   [triggerId]  Optional explicit trigger ID [was: W]
   */
  constructor(idGenerator, videoId, triggerId) {
    this.videoId = videoId; // was: this.IY = c
    this.triggerType = 'TRIGGER_TYPE_BEFORE_CONTENT_VIDEO_ID_STARTED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// CloseRequestedTrigger [was: fz]  (line 78709)
// ---------------------------------------------------------------------------

/**
 * Fires when the user requests to close the ad (e.g. dismiss button).
 *
 * [was: fz]
 */
export class CloseRequestedTrigger { // was: fz
  constructor(idGenerator, exitReason, triggerId) {
    this.exitReason = exitReason; // was: this.W = c
    this.triggerType = 'TRIGGER_TYPE_CLOSE_REQUESTED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// ContentVideoIdEndedTrigger [was: aG]  (line 78717)
// ---------------------------------------------------------------------------

/**
 * Fires when the content video with the given ID ends.
 *
 * [was: aG]
 */
export class ContentVideoIdEndedTrigger { // was: aG
  constructor(idGenerator, videoId, visible, triggerId) {
    this.videoId = videoId;   // was: this.IY = c
    this.visible = visible;   // was: this.visible = W
    this.triggerType = 'TRIGGER_TYPE_CONTENT_VIDEO_ID_ENDED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// CueBreakIdentifiedTrigger [was: KDR]  (line 78726)
// ---------------------------------------------------------------------------

/**
 * Fires when a cue break is identified in the content stream.
 *
 * [was: KDR]
 */
export class CueBreakIdentifiedTrigger { // was: KDR
  constructor(idGenerator) {
    this.triggerType = 'TRIGGER_TYPE_CUE_BREAK_IDENTIFIED';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// DurationAfterMediaPausedTrigger [was: TLO]  (line 78733)
// ---------------------------------------------------------------------------

/**
 * Fires after the media has been paused for a specified duration.
 *
 * [was: TLO]
 */
export class DurationAfterMediaPausedTrigger { // was: TLO
  constructor(idGenerator) {
    this.triggerType = 'TRIGGER_TYPE_DURATION_AFTER_MEDIA_PAUSED';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// LayoutIdActiveAndSlotIdExitedTrigger [was: ii]  (line 78740)
// ---------------------------------------------------------------------------

/**
 * Fires when a specific layout is active AND a specific slot has exited.
 *
 * [was: ii]
 */
export class LayoutIdActiveAndSlotIdExitedTrigger { // was: ii
  constructor(idGenerator, triggeringLayoutId, slotId) {
    this.triggeringLayoutId = triggeringLayoutId; // was: c
    this.slotId = slotId;                         // was: W
    this.triggerType = 'TRIGGER_TYPE_LAYOUT_ID_ACTIVE_AND_SLOT_ID_HAS_EXITED';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// LayoutIdEnteredTrigger [was: Gu]  (line 78749)
// ---------------------------------------------------------------------------

/**
 * Fires when a specific layout ID enters the rendering state.
 *
 * [was: Gu]
 */
export class LayoutIdEnteredTrigger { // was: Gu
  constructor(idGenerator, triggeringLayoutId, triggerId) {
    this.triggeringLayoutId = triggeringLayoutId; // was: c
    this.triggerType = 'TRIGGER_TYPE_LAYOUT_ID_ENTERED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// LayoutExitedForReasonTrigger [was: wR]  (line 78757)
// ---------------------------------------------------------------------------

/**
 * Fires when a specific layout exits for a given reason.
 *
 * [was: wR]
 */
export class LayoutExitedForReasonTrigger { // was: wR
  constructor(idGenerator, triggeringLayoutId, exitReason, triggerId) {
    this.triggeringLayoutId = triggeringLayoutId; // was: c
    this.exitReason = exitReason;                 // was: this.W = W
    this.triggerType = 'TRIGGER_TYPE_LAYOUT_EXITED_FOR_REASON';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// LayoutIdExitedTrigger [was: Lz]  (line 78766)
// ---------------------------------------------------------------------------

/**
 * Fires when a specific layout ID exits (any reason).
 *
 * [was: Lz]
 */
export class LayoutIdExitedTrigger { // was: Lz
  constructor(idGenerator, triggeringLayoutId, triggerId) {
    this.triggeringLayoutId = triggeringLayoutId;
    this.triggerType = 'TRIGGER_TYPE_LAYOUT_ID_EXITED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// LiveStreamBreakEndedTrigger [was: uh]  (line 78774)
// ---------------------------------------------------------------------------

/**
 * Fires when a live stream ad break ends.
 *
 * [was: uh]
 */
export class LiveStreamBreakEndedTrigger { // was: uh
  constructor(idGenerator, triggerId) {
    this.triggerType = 'TRIGGER_TYPE_LIVE_STREAM_BREAK_ENDED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// LiveStreamBreakScheduledDurationMatchedTrigger [was: hn]  (line 78781)
// ---------------------------------------------------------------------------

/**
 * Fires when a live stream break's actual duration matches the scheduled duration.
 *
 * [was: hn]
 */
export class LiveStreamBreakScheduledDurationMatchedTrigger { // was: hn
  constructor(breakDurationMs, triggerId) {
    this.breakDurationMs = breakDurationMs; // was: Q
    this.triggerType = 'TRIGGER_TYPE_LIVE_STREAM_BREAK_SCHEDULED_DURATION_MATCHED';
    this.triggerId = triggerId || '';
  }
}

// ---------------------------------------------------------------------------
// LiveStreamBreakScheduledDurationNotMatchedTrigger [was: zu]  (line 78789)
// ---------------------------------------------------------------------------

/**
 * Fires when a live stream break's actual duration does NOT match the scheduled duration.
 *
 * [was: zu]
 */
export class LiveStreamBreakScheduledDurationNotMatchedTrigger { // was: zu
  constructor(breakDurationMs, triggerId) {
    this.breakDurationMs = breakDurationMs;
    this.triggerType = 'TRIGGER_TYPE_LIVE_STREAM_BREAK_SCHEDULED_DURATION_NOT_MATCHED';
    this.triggerId = triggerId || '';
  }
}

// ---------------------------------------------------------------------------
// LiveStreamBreakStartedTrigger [was: lh]  (line 78797)
// ---------------------------------------------------------------------------

/**
 * Fires when a live stream ad break starts.
 *
 * [was: lh]
 */
export class LiveStreamBreakStartedTrigger { // was: lh
  constructor(idGenerator, triggerId) {
    this.triggerType = 'TRIGGER_TYPE_LIVE_STREAM_BREAK_STARTED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// MediaResumedTrigger [was: rEm]  (line 78804)
// ---------------------------------------------------------------------------

/**
 * Fires when media playback resumes after a pause.
 *
 * [was: rEm]
 */
export class MediaResumedTrigger { // was: rEm
  constructor(triggerId) {
    this.triggerId = triggerId; // was: Q
    this.triggerType = 'TRIGGER_TYPE_MEDIA_RESUMED';
  }
}

// ---------------------------------------------------------------------------
// MediaTimeRangeReactivationTrigger [was: rbX]  (line 78811)
// ---------------------------------------------------------------------------

/**
 * Fires when playback enters a media time range, with reactivation
 * allowed if the user previously cancelled.
 *
 * [was: rbX]
 */
export class MediaTimeRangeReactivationTrigger { // was: rbX
  constructor(idGenerator, videoId, timeRange, visible, layoutId) {
    this.videoId = videoId;     // was: this.IY = c
    this.timeRange = timeRange; // was: this.W = W
    this.visible = visible;     // was: this.visible = m
    this.layoutId = layoutId;   // was: this.layoutId = K
    this.triggerType = 'TRIGGER_TYPE_MEDIA_TIME_RANGE_ALLOW_REACTIVATION_ON_USER_CANCELLED';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// MediaTimeRangeTrigger [was: vE]  (line 78822)
// ---------------------------------------------------------------------------

/**
 * Fires when playback enters a specified media time range.
 *
 * [was: vE]
 */
export class MediaTimeRangeTrigger { // was: vE
  constructor(idGenerator, videoId, timeRange, visible, triggerId) {
    this.videoId = videoId;     // was: this.IY = c
    this.timeRange = timeRange; // was: this.W = W
    this.visible = visible;     // was: this.visible = m
    this.triggerType = 'TRIGGER_TYPE_MEDIA_TIME_RANGE';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// NewSlotScheduledWithBreakDurationTrigger [was: Cz]  (line 78832)
// ---------------------------------------------------------------------------

/**
 * Fires when a new slot is scheduled with a specific break duration.
 *
 * [was: Cz]
 */
export class NewSlotScheduledWithBreakDurationTrigger { // was: Cz
  constructor(breakDurationMs, triggerId) {
    this.breakDurationMs = breakDurationMs;
    this.triggerType = 'TRIGGER_TYPE_NEW_SLOT_SCHEDULED_WITH_BREAK_DURATION';
    this.triggerId = triggerId || '';
  }
}

// ---------------------------------------------------------------------------
// NotInMediaTimeRangeTrigger [was: mgK]  (line 78840)
// ---------------------------------------------------------------------------

/**
 * Fires when playback is NOT within a specified media time range.
 *
 * [was: mgK]
 */
export class NotInMediaTimeRangeTrigger { // was: mgK
  constructor(idGenerator, videoId, timeRange) {
    this.videoId = videoId;     // was: this.IY = c
    this.timeRange = timeRange; // was: this.W = W
    this.triggerType = 'TRIGGER_TYPE_NOT_IN_MEDIA_TIME_RANGE';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// OnDifferentLayoutIdEnteredTrigger [was: PE]  (line 78849)
// ---------------------------------------------------------------------------

/**
 * Fires when a different layout ID enters (used to exit the current one).
 *
 * [was: PE]
 */
export class OnDifferentLayoutIdEnteredTrigger { // was: PE
  constructor(idGenerator, exitReason, slotType, layoutType, triggerId) {
    this.exitReason = exitReason; // was: this.W = c
    this.slotType = slotType;     // was: this.slotType = W
    this.layoutType = layoutType; // was: this.layoutType = m
    this.triggerType = 'TRIGGER_TYPE_ON_DIFFERENT_LAYOUT_ID_ENTERED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// OnDifferentSlotIdEnterRequestedTrigger [was: Hq]  (line 78859)
// ---------------------------------------------------------------------------

/**
 * Fires when a different slot of SLOT_TYPE_IN_PLAYER requests entry.
 *
 * [was: Hq]
 */
export class OnDifferentSlotIdEnterRequestedTrigger { // was: Hq
  constructor(idGenerator, exitReason) {
    this.exitReason = exitReason;          // was: this.W = c
    this.slotType = 'SLOT_TYPE_IN_PLAYER'; // was: hardcoded
    this.triggerType = 'TRIGGER_TYPE_ON_DIFFERENT_SLOT_ID_ENTER_REQUESTED';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// OnLayoutSelfExitRequestedTrigger [was: bh]  (line 78868)
// ---------------------------------------------------------------------------

/**
 * Fires when a layout requests its own exit.
 *
 * [was: bh]
 */
export class OnLayoutSelfExitRequestedTrigger { // was: bh
  constructor(idGenerator, layoutId, triggerId) {
    this.layoutId = layoutId; // was: c
    this.triggerType = 'TRIGGER_TYPE_ON_LAYOUT_SELF_EXIT_REQUESTED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// OnNewPlaybackAfterContentVideoIdTrigger [was: Zi]  (line 78876)
// ---------------------------------------------------------------------------

/**
 * Fires on a new playback session after a specific content video ID.
 *
 * [was: Zi]
 */
export class OnNewPlaybackAfterContentVideoIdTrigger { // was: Zi
  constructor(idGenerator, exitReason, triggerId) {
    this.exitReason = exitReason; // was: this.W = c
    this.triggerType = 'TRIGGER_TYPE_ON_NEW_PLAYBACK_AFTER_CONTENT_VIDEO_ID';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// OnOpportunityTypeReceivedTrigger [was: kSn]  (line 78884)
// ---------------------------------------------------------------------------

/**
 * Fires when an ad break service response opportunity is received.
 *
 * [was: kSn]
 */
export class OnOpportunityTypeReceivedTrigger { // was: kSn
  constructor(idGenerator, associatedSlotId) {
    this.opportunityType = 'OPPORTUNITY_TYPE_AD_BREAK_SERVICE_RESPONSE_RECEIVED';
    this.associatedSlotId = associatedSlotId; // was: c
    this.triggerType = 'TRIGGER_TYPE_ON_OPPORTUNITY_TYPE_RECEIVED';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// FulfillmentIndexEntry [was: Rk3]  (line 78893)
// ---------------------------------------------------------------------------

/**
 * Simple data class mapping a fulfillment payload to a positional index.
 *
 * [was: Rk3]
 */
export class FulfillmentIndexEntry { // was: Rk3
  constructor(payload, index) {
    this.payload = payload; // was: this.W = Q
    this.index = index;     // was: this.index = c
  }
}

// ---------------------------------------------------------------------------
// PlaybackMinimizedTrigger [was: Enx]  (line 78900)
// ---------------------------------------------------------------------------

/**
 * Fires when the player is minimized (e.g. PiP or mini-player).
 *
 * [was: Enx]
 */
export class PlaybackMinimizedTrigger { // was: Enx
  constructor(idGenerator) {
    this.triggerType = 'TRIGGER_TYPE_PLAYBACK_MINIMIZED';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// PrefetchCacheExpiredTrigger [was: Ms]  (line 78907)
// ---------------------------------------------------------------------------

/**
 * Fires when the prefetch cache has expired.
 *
 * [was: Ms]
 */
export class PrefetchCacheExpiredTrigger { // was: Ms
  constructor(idGenerator, triggerId) {
    this.triggerType = 'TRIGGER_TYPE_PREFETCH_CACHE_EXPIRED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// ProgressPastMediaTimeWithOffsetTrigger [was: pFy]  (line 78914)
// ---------------------------------------------------------------------------

/**
 * Fires when playback progresses past a media time offset relative to
 * a layout's enter time.
 *
 * [was: pFy]
 */
export class ProgressPastMediaTimeWithOffsetTrigger { // was: pFy
  constructor(idGenerator, layoutId, offsetMs) {
    this.layoutId = layoutId; // was: c
    this.offsetMs = offsetMs; // was: W
    this.triggerType = 'TRIGGER_TYPE_PROGRESS_PAST_MEDIA_TIME_WITH_OFFSET_RELATIVE_TO_LAYOUT_ENTER';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// SeekBackwardBeforeLayoutEnterTrigger [was: cb3]  (line 78923)
// ---------------------------------------------------------------------------

/**
 * Fires when the user seeks backward before a layout's enter time.
 *
 * [was: cb3]
 */
export class SeekBackwardBeforeLayoutEnterTrigger { // was: cb3
  constructor(idGenerator, layoutId) {
    this.layoutId = layoutId;
    this.triggerType = 'TRIGGER_TYPE_SEEK_BACKWARD_BEFORE_LAYOUT_ENTER_TIME';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// SeekForwardPastMediaTimeWithOffsetTrigger [was: Q7x]  (line 78931)
// ---------------------------------------------------------------------------

/**
 * Fires when the user seeks forward past a media time offset relative to
 * a layout's enter time.
 *
 * [was: Q7x]
 */
export class SeekForwardPastMediaTimeWithOffsetTrigger { // was: Q7x
  constructor(idGenerator, layoutId, offsetMs) {
    this.layoutId = layoutId;
    this.offsetMs = offsetMs;
    this.triggerType = 'TRIGGER_TYPE_SEEK_FORWARD_PAST_MEDIA_TIME_WITH_OFFSET_RELATIVE_TO_LAYOUT_ENTER';
    this.triggerId = idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// SkipRequestedTrigger [was: jZ]  (line 78940)
// ---------------------------------------------------------------------------

/**
 * Fires when a skip is requested for a specific layout.
 *
 * [was: jZ]
 */
export class SkipRequestedTrigger { // was: jZ
  constructor(idGenerator, triggeringLayoutId, triggerId) {
    this.triggeringLayoutId = triggeringLayoutId;
    this.triggerType = 'TRIGGER_TYPE_SKIP_REQUESTED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// SlotIdEnteredTrigger [was: gR]  (line 78948)
// ---------------------------------------------------------------------------

/**
 * Fires when a specific slot ID enters. Supports cloning with a new slot ID.
 *
 * [was: gR]
 */
export class SlotIdEnteredTrigger { // was: gR
  constructor(idGenerator, triggeringSlotId, triggerId) {
    this.triggeringSlotId = triggeringSlotId;
    this.triggerType = 'TRIGGER_TYPE_SLOT_ID_ENTERED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }

  /**
   * Creates a clone of this trigger bound to a new slot ID.
   * [was: clone]
   */
  clone(newSlotId) { // was: clone(Q)
    return new SlotIdEnteredTrigger(() => this.triggerId, newSlotId);
  }
}

// ---------------------------------------------------------------------------
// SlotIdExitedTrigger [was: Ez]  (line 78959)
// ---------------------------------------------------------------------------

/**
 * Fires when a specific slot ID exits. Supports cloning.
 *
 * [was: Ez]
 */
export class SlotIdExitedTrigger { // was: Ez
  constructor(idGenerator, triggeringSlotId, triggerId) {
    this.triggeringSlotId = triggeringSlotId;
    this.triggerType = 'TRIGGER_TYPE_SLOT_ID_EXITED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }

  clone(newSlotId) {
    return new SlotIdExitedTrigger(() => this.triggerId, newSlotId);
  }
}

// ---------------------------------------------------------------------------
// SlotIdFulfilledEmptyTrigger [was: Zg]  (line 78970)
// ---------------------------------------------------------------------------

/**
 * Fires when a specific slot is fulfilled with no ads (empty).
 *
 * [was: Zg]
 */
export class SlotIdFulfilledEmptyTrigger { // was: Zg
  constructor(idGenerator, triggeringSlotId) {
    this.triggeringSlotId = triggeringSlotId;
    this.triggerType = 'TRIGGER_TYPE_SLOT_ID_FULFILLED_EMPTY';
    this.triggerId = idGenerator(this.triggerType);
  }

  clone(newSlotId) {
    return new SlotIdFulfilledEmptyTrigger(() => this.triggerId, newSlotId);
  }
}

// ---------------------------------------------------------------------------
// SlotIdFulfilledNonEmptyTrigger [was: FD]  (line 78981)
// ---------------------------------------------------------------------------

/**
 * Fires when a specific slot is fulfilled with at least one ad.
 *
 * [was: FD]
 */
export class SlotIdFulfilledNonEmptyTrigger { // was: FD
  constructor(idGenerator, triggeringSlotId) {
    this.triggeringSlotId = triggeringSlotId;
    this.triggerType = 'TRIGGER_TYPE_SLOT_ID_FULFILLED_NON_EMPTY';
    this.triggerId = idGenerator(this.triggerType);
  }

  clone(newSlotId) {
    return new SlotIdFulfilledNonEmptyTrigger(() => this.triggerId, newSlotId);
  }
}

// ---------------------------------------------------------------------------
// SlotIdScheduledTrigger [was: Fp]  (line 78992)
// ---------------------------------------------------------------------------

/**
 * Fires when a specific slot ID is scheduled.
 *
 * [was: Fp]
 */
export class SlotIdScheduledTrigger { // was: Fp
  constructor(idGenerator, triggeringSlotId, triggerId) {
    this.triggeringSlotId = triggeringSlotId;
    this.triggerType = 'TRIGGER_TYPE_SLOT_ID_SCHEDULED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }

  clone(newSlotId) {
    return new SlotIdScheduledTrigger(() => this.triggerId, newSlotId);
  }
}

// ---------------------------------------------------------------------------
// UnscheduledSlotTrigger [was: yZ]  (line 79003)
// ---------------------------------------------------------------------------

/**
 * Fires when a specific slot ID is unscheduled (removed from the schedule).
 *
 * [was: yZ]
 */
export class UnscheduledSlotTrigger { // was: yZ
  constructor(idGenerator, triggeringSlotId) {
    this.triggeringSlotId = triggeringSlotId;
    this.triggerType = 'TRIGGER_TYPE_SLOT_ID_UNSCHEDULED';
    this.triggerId = idGenerator(this.triggerType);
  }

  clone(newSlotId) {
    return new UnscheduledSlotTrigger(() => this.triggerId, newSlotId);
  }
}

// ---------------------------------------------------------------------------
// SurveySubmittedTrigger [was: Oz]  (line 79014)
// ---------------------------------------------------------------------------

/**
 * Fires when a survey is submitted for a specific triggering layout.
 *
 * [was: Oz]
 */
export class SurveySubmittedTrigger { // was: Oz
  constructor(idGenerator, triggeringLayoutId, triggerId) {
    this.triggeringLayoutId = triggeringLayoutId; // was: c
    this.triggerType = 'TRIGGER_TYPE_SURVEY_SUBMITTED';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// TimeRelativeTrigger [was: $b]  (line 79022)
// ---------------------------------------------------------------------------

/**
 * Fires after a specified duration (ms) relative to a layout's enter time.
 * Commonly used for skip-button delays and timed actions.
 *
 * [was: $b]
 *
 * @property {number} durationMs            Delay in milliseconds [was: c]
 * @property {string} triggeringLayoutId     Layout whose enter time is the reference [was: W]
 */
export class TimeRelativeTrigger { // was: $b
  constructor(idGenerator, durationMs, triggeringLayoutId, triggerId) {
    this.durationMs = durationMs;                   // was: c
    this.triggeringLayoutId = triggeringLayoutId;     // was: W
    this.triggerType = 'TRIGGER_TYPE_TIME_RELATIVE_TO_LAYOUT_ENTER';
    this.triggerId = triggerId || idGenerator(this.triggerType);
  }
}

// ---------------------------------------------------------------------------
// ScheduledAdEvent [was: qr]  (line 79031)
// ---------------------------------------------------------------------------

/**
 * Composite descriptor tying together a trigger category, trigger instance,
 * slot, and layout into a single schedulable ad event.
 *
 * [was: qr]
 *
 * @property {string} category  "TRIGGER_CATEGORY_SLOT_ENTRY" | "TRIGGER_CATEGORY_SLOT_FULFILLMENT" | "TRIGGER_CATEGORY_SLOT_EXPIRATION" | "TRIGGER_CATEGORY_LAYOUT_EXIT_*"
 * @property {Object} trigger   One of the trigger class instances above
 * @property {Object} slot      The ad slot descriptor
 * @property {Object} layout    The ad layout descriptor
 */
export class ScheduledAdEvent { // was: qr
  constructor(category, trigger, slot, layout) {
    this.category = category; // was: Q
    this.trigger = trigger;   // was: c
    this.slot = slot;         // was: W
    this.layout = layout;     // was: m
  }
}

// ---------------------------------------------------------------------------
// Default Layout Exit Triggers [was: Ot]  (line 79054)
// ---------------------------------------------------------------------------

/**
 * Default (empty) layout exit trigger configuration. Used as a base when
 * no custom exit triggers are specified.
 *
 * [was: Ot]
 */
export const DEFAULT_LAYOUT_EXIT_TRIGGERS = {
  layoutExitMuteTriggers: [],
  layoutExitNormalTriggers: [],
  layoutExitSkipTriggers: [],
  layoutExitUserCancelledTriggers: [],
  layoutExitUserInputSubmittedTriggers: [],
};

// ---------------------------------------------------------------------------
// LoadPolicy enum [was: OX]  (line 79061)
// ---------------------------------------------------------------------------

/**
 * Determines when an ad resource should be loaded.
 *
 * [was: OX]
 */
export const LoadPolicy = {
  ALWAYS: 1,         // was: oQ: 1
  BY_PREFERENCE: 2,  // was: VN: 2
  BY_REQUEST: 3,     // was: nH: 3

  // Reverse mapping
  1: 'LOAD_POLICY_ALWAYS',
  2: 'LOAD_POLICY_BY_PREFERENCE',
  3: 'LOAD_POLICY_BY_REQUEST',
};
