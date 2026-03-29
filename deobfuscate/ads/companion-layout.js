/**
 * Companion Layout and Ad Slot Generation.
 *
 * Source: player_es6.vflset/en_US/base.js, lines 24000–25000
 *
 * Covers discovery companion layout parsing (from both ActionCompanionAdRenderer
 * and TopBannerImageTextIconButtonedLayoutViewModel), ad slot correlation with
 * layout types, companion AdPlacementSupportedRenderer aggregation, survey ad
 * duration computation, instream survey/ad layout generation for DAI, ad-pod
 * composite layout construction, InPlayerSlot generation, trigger factories,
 * and slot/layout metadata assembly for VOD and SSDAI flows.
 *
 * @module companion-layout
 */

import { getProperty, instreamAdPlayerOverlayRenderer, instreamSurveyAdRenderer, instreamVideoAdRenderer, playerOverlayLayoutRenderer } from '../core/misc-helpers.js';  // was: g.l, g.Re, g.rR, g.Tu, g.kA
import { createContentEntrySlot } from './slot-id-generator.js'; // was: Ut_
import { ActionCompanionMetadata } from './ad-interaction.js'; // was: Iww
import { generateLayoutId } from './slot-id-generator.js'; // was: nQ
import { OnNewPlaybackAfterContentVideoIdTrigger } from './ad-trigger-types.js'; // was: Zi
import { TopBannerMetadata } from './ad-interaction.js'; // was: AEX
import { registerInstreamRenderers } from './companion-layout.js'; // was: Yb
import { isRendererEntryValid } from './companion-layout.js'; // was: V$n
import { extractUAMatch } from '../core/bitstream-helpers.js'; // was: a9
import { getRequestAnimationFrame } from '../core/bitstream-helpers.js'; // was: o9
import { createLayoutExitEntrySlot } from './slot-id-generator.js'; // was: BL3
import { createLayoutEnteredSlot } from './slot-id-generator.js'; // was: xt_
import { reportAdsControlFlowError } from '../data/interaction-logging.js'; // was: v1
import { createCallbackEntry } from '../core/composition-helpers.js'; // was: pW
import { instreamSurveyMultiSelect } from '../core/misc-helpers.js'; // was: Di
import { instreamSurveySingleSelect } from '../core/misc-helpers.js'; // was: tn
import { createDelegatedInPlayerSlot } from './slot-id-generator.js'; // was: DtW
import { createEndcapOrInterstitialLayout } from './slot-id-generator.js'; // was: m5
import { createInputEventInPlayerSlot } from './slot-id-generator.js'; // was: ihW
import { LayoutIdExitedTrigger } from './ad-trigger-types.js'; // was: Lz
import { slidingTextOverlay } from '../core/misc-helpers.js'; // was: FsK
import { createLayoutEnteredInPlayerSlot } from './slot-id-generator.js'; // was: Zh7
import { handleSegmentRedirect } from './dai-cue-range.js'; // was: jZ
import { SurveySubmittedTrigger } from './ad-trigger-types.js'; // was: Oz
import { PlaybackMinimizedTrigger } from './ad-trigger-types.js'; // was: Enx
import { expandLinearAdSequence } from './companion-layout.js'; // was: LsK
import { parseAdTimeOffset } from './companion-layout.js'; // was: wnx
import { parseInstreamVideoAdRenderer } from './companion-layout.js'; // was: oL
import { AdPodInfo } from './ad-layout-renderer.js'; // was: rP
import { getDriftRecoveryMs } from './companion-layout.js'; // was: bhR
import { LiveStreamBreakEndedTrigger } from './ad-trigger-types.js'; // was: uh
import { isNotNullish } from './slot-id-generator.js'; // was: j23
import { createPlayerBytesSlot } from './slot-id-generator.js'; // was: gn3
import { getStoredDisplaySettings } from '../modules/caption/caption-settings.js'; // was: NC
import { buildSubLayoutFactory } from './companion-layout.js'; // was: vn_
import { buildDaiCompositeLayout } from './slot-id-generator.js'; // was: awm
import { adAvatarViewModel } from '../core/misc-helpers.js'; // was: q_
import { parseQueryString } from '../data/idb-transactions.js'; // was: bk
import { sendPostRequest } from '../network/request.js'; // was: ms
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { hasMetadataKey } from '../network/uri-utils.js'; // was: jK
import { getNumericAttrOrNull } from '../modules/caption/caption-internals.js'; // was: gE
import { videoInterstitialButtoned } from '../core/misc-helpers.js'; // was: pQ
import { generateSlotId } from './trigger-config.js'; // was: sa
import { generateInPlayerSlots } from './companion-layout.js'; // was: lw3
import { MetadataCollection } from './ad-triggers.js';
import { filter } from '../core/array-utils.js';

// ---------------------------------------------------------------------------
// Companion layout generation (Action Companion)
// ---------------------------------------------------------------------------

/**
 * Generates a companion-with-action-button layout from an
 * `ActionCompanionAdRenderer`. Returns an error if `slotType` is `null`.
 *
 * Delegates to `Ut_` for slot creation, then builds a
 * `LAYOUT_TYPE_COMPANION_WITH_ACTION_BUTTON` layout descriptor with
 * `Iww`-wrapped renderer metadata and a `kb`-wrapped placement config.
 *
 * [was: XnW]
 *
 * @param {object}   slotFactory       - Slot factory instance [was: Q]
 * @param {string|null} slotType       - Target slot type (null → error) [was: c]
 * @param {object}   idProvider        - Provides `.O.get()` for layout ID generation [was: W]
 * @param {object}   renderer          - ActionCompanionAdRenderer [was: m]
 * @param {object}   placementConfig   - Ad placement config [was: K]
 * @param {object}   triggerConfig     - Trigger configuration [was: T]
 * @param {string}   contentVideoId    - Video ID for exit triggers [was: r]
 * @param {Function} loggingDataMapper - Maps slot → logging data factory [was: U]
 * @returns {Array|object} Array with one slot descriptor, or an error
 */
export function createActionCompanionLayout(slotFactory, slotType, idProvider, renderer, placementConfig, triggerConfig, contentVideoId, loggingDataMapper) { // was: XnW
  if (slotType === null) {
    return new z("Invalid slot type when get discovery companion fromActionCompanionAdRenderer", {
      slotType,
      ActionCompanionAdRenderer: renderer
    });
  }

  return [createContentEntrySlot(slotFactory, slotType, contentVideoId, triggerConfig, (slotInfo) => { // was: I
    let slotId = slotInfo.slotId; // was: X
    const loggingDataFactory = loggingDataMapper(slotInfo); // was: I (reused)
    const adLayoutLoggingData = renderer.adLayoutLoggingData; // was: A
    const clientMetadata = new MetadataCollection([new ActionCompanionMetadata(renderer), new kb(placementConfig)]); // was: e
    slotId = generateLayoutId(idProvider.O.get(), "LAYOUT_TYPE_COMPANION_WITH_ACTION_BUTTON", slotId); // was: X
    const layoutSkeleton = { // was: V
      layoutId: slotId,
      layoutType: "LAYOUT_TYPE_COMPANION_WITH_ACTION_BUTTON",
      G2: "core"
    };
    return {
      layoutId: slotId,
      layoutType: "LAYOUT_TYPE_COMPANION_WITH_ACTION_BUTTON",
      zy: new Map,
      layoutExitNormalTriggers: [new OnNewPlaybackAfterContentVideoIdTrigger(idProvider.W, contentVideoId)],
      layoutExitSkipTriggers: [],
      layoutExitMuteTriggers: [],
      layoutExitUserInputSubmittedTriggers: [],
      layoutExitUserCancelledTriggers: [],
      G2: "core",
      clientMetadata,
      Je: loggingDataFactory(layoutSkeleton),
      adLayoutLoggingData
    };
  })];
}

// ---------------------------------------------------------------------------
// Companion layout generation (Top Banner / Discovery)
// ---------------------------------------------------------------------------

/**
 * Generates a companion-with-action-button layout from a
 * `TopBannerImageTextIconButtonedLayoutViewModel`. Returns an error if
 * `slotType` is `null`.
 *
 * Same structure as `createActionCompanionLayout` but wraps the renderer in
 * `AEX` instead of `Iww`.
 *
 * [was: eeW]
 *
 * @param {object}   slotFactory       - Slot factory [was: Q]
 * @param {string|null} slotType       - Target slot type [was: c]
 * @param {object}   idProvider        - Layout ID provider [was: W]
 * @param {object}   viewModel         - TopBannerImageTextIconButtonedLayoutViewModel [was: m]
 * @param {object}   placementConfig   - Ad placement config [was: K]
 * @param {object}   triggerConfig     - Trigger configuration [was: T]
 * @param {string}   contentVideoId    - Video ID for exit triggers [was: r]
 * @param {Function} loggingDataMapper - Slot → logging data factory [was: U]
 * @returns {Array|object}
 */
export function createDiscoveryCompanionLayout(slotFactory, slotType, idProvider, viewModel, placementConfig, triggerConfig, contentVideoId, loggingDataMapper) { // was: eeW
  if (slotType === null) {
    return new z("Invalid slot type when get discovery companion fromTopBannerImageTextIconButtonedLayoutViewModel", {
      slotType,
      TopBannerImageTextIconButtonedLayoutViewModel: viewModel
    });
  }

  return [createContentEntrySlot(slotFactory, slotType, contentVideoId, triggerConfig, (slotInfo) => { // was: I
    let slotId = slotInfo.slotId; // was: X
    const loggingDataFactory = loggingDataMapper(slotInfo); // was: I (reused)
    const adLayoutLoggingData = viewModel.adLayoutLoggingData; // was: A
    const clientMetadata = new MetadataCollection([new TopBannerMetadata(viewModel), new kb(placementConfig)]); // was: e
    slotId = generateLayoutId(idProvider.O.get(), "LAYOUT_TYPE_COMPANION_WITH_ACTION_BUTTON", slotId); // was: X
    const layoutSkeleton = { // was: V
      layoutId: slotId,
      layoutType: "LAYOUT_TYPE_COMPANION_WITH_ACTION_BUTTON",
      G2: "core"
    };
    return {
      layoutId: slotId,
      layoutType: "LAYOUT_TYPE_COMPANION_WITH_ACTION_BUTTON",
      zy: new Map,
      layoutExitNormalTriggers: [new OnNewPlaybackAfterContentVideoIdTrigger(idProvider.W, contentVideoId)],
      layoutExitSkipTriggers: [],
      layoutExitMuteTriggers: [],
      layoutExitUserInputSubmittedTriggers: [],
      layoutExitUserCancelledTriggers: [],
      G2: "core",
      clientMetadata,
      Je: loggingDataFactory(layoutSkeleton),
      adLayoutLoggingData
    };
  })];
}

// ---------------------------------------------------------------------------
// Companion ad aggregation across placement renderers
// ---------------------------------------------------------------------------

/**
 * Walks all ad-placement renderers, collects companion slot descriptors for
 * each `instreamVideoAdRenderer`, and returns the combined array.
 *
 * When `skipYb` is falsy, calls `Yb` to register renderers by video-element
 * ID first. Filters for valid entries via `V$n`, then delegates to `BL3` /
 * `xt_` based on whether the companion is content-video-bound and whether
 * multiple renderers exist.
 *
 * [was: q1d]
 *
 * @param {Map}     rendererMap        - Mutable map of video-ID → renderer info [was: Q]
 * @param {Array}   placementRenderers - Raw placement renderer list [was: c]
 * @param {object}  slotFactory        - Slot factory [was: W]
 * @param {object}  idProvider         - Layout ID provider [was: m]
 * @param {object}  triggerConfig      - Trigger configuration [was: K]
 * @param {boolean} skipYb             - If truthy, skip initial Yb registration [was: T]
 * @returns {Array}
 */
export function collectCompanionSlots(rendererMap, placementRenderers, slotFactory, idProvider, triggerConfig, skipYb) { // was: q1d
  if (!skipYb) {
    for (const entry of placementRenderers) {
      registerInstreamRenderers(rendererMap, entry.renderer, entry.config.adPlacementConfig.kind);
    }
  }

  const validEntries = Array.from(rendererMap.values()).filter(entry => isRendererEntryValid(entry)); // was: Q
  const results = []; // was: c

  for (const entry of validEntries) {
    for (const companion of entry.I9) {
      const defaultMapper = (slotInfo) => // was: T (reused)
        companion.getRequestAnimationFrame(slotInfo, entry.instreamVideoAdRenderer.elementId, companion.extractUAMatch);

      if (companion.isContentVideoCompanion) {
        results.push(createLayoutExitEntrySlot(
          slotFactory, idProvider, triggerConfig,
          entry.instreamVideoAdRenderer.elementId,
          companion.associatedCompositePlayerBytesLayoutId,
          companion.adSlotLoggingData,
          defaultMapper
        ));
      } else if (validEntries.length > 1) {
        results.push(createLayoutEnteredSlot(
          slotFactory, idProvider, triggerConfig,
          entry.instreamVideoAdRenderer.elementId,
          companion.adSlotLoggingData,
          (slotInfo) => companion.getRequestAnimationFrame(
            slotInfo,
            entry.instreamVideoAdRenderer.elementId,
            companion.extractUAMatch,
            companion.associatedCompositePlayerBytesLayoutId
          )
        ));
      } else {
        results.push(createLayoutEnteredSlot(
          slotFactory, idProvider, triggerConfig,
          entry.instreamVideoAdRenderer.elementId,
          companion.adSlotLoggingData,
          defaultMapper
        ));
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Renderer extraction helpers
// ---------------------------------------------------------------------------

/**
 * Registers instream video ad renderers from a placement renderer into the
 * shared map, keyed by `externalVideoId`.
 *
 * [was: Yb]
 *
 * @param {Map}    rendererMap - Shared map of video-ID → renderer info [was: Q]
 * @param {object} renderer    - Placement renderer [was: c]
 * @param {string} kind        - Ad placement kind [was: W]
 */
export function registerInstreamRenderers(rendererMap, renderer, kind) { // was: Yb
  const extracted = extractInstreamRenderers(renderer); // was: c (reused)
  if (!extracted) return;

  for (const item of extracted) {
    if (item && item.externalVideoId) {
      const entry = getOrCreateRendererEntry(rendererMap, item.externalVideoId); // was: c (reused)
      if (!entry.instreamVideoAdRenderer) {
        entry.instreamVideoAdRenderer = item;
        entry.lV = kind;
      }
    } else {
      reportAdsControlFlowError("InstreamVideoAdRenderer without externalVideoId");
    }
  }
}

/**
 * Extracts instream video ad renderer(s) from a placement renderer —
 * checking sandwiched-linear, direct instream, and linear-ad-sequence forms.
 *
 * [was: nnR]
 *
 * @param {object} renderer [was: Q]
 * @returns {Array|null}
 */
export function extractInstreamRenderers(renderer) { // was: nnR
  const results = []; // was: c
  const sandwichedLinearAd = renderer.sandwichedLinearAdRenderer &&
    renderer.sandwichedLinearAdRenderer.linearAd &&
    getProperty(renderer.sandwichedLinearAdRenderer.linearAd, instreamVideoAdRenderer); // was: W

  if (sandwichedLinearAd) {
    results.push(sandwichedLinearAd);
    return results;
  }

  if (renderer.instreamVideoAdRenderer) {
    results.push(renderer.instreamVideoAdRenderer);
    return results;
  }

  if (renderer.linearAdSequenceRenderer && renderer.linearAdSequenceRenderer.linearAds) {
    for (const linearAd of renderer.linearAdSequenceRenderer.linearAds) {
      if (getProperty(linearAd, instreamVideoAdRenderer)) {
        results.push(getProperty(linearAd, instreamVideoAdRenderer));
      }
    }
    return results;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Renderer entry validation
// ---------------------------------------------------------------------------

/**
 * Validates that an `AdPlacementSupportedRenderers` map entry is complete:
 * has an instream renderer, element ID, and all companion entries carry
 * valid callbacks and matching placement kinds.
 *
 * [was: V$n]
 *
 * @param {object} entry [was: Q]
 * @returns {boolean}
 */
export function isRendererEntryValid(entry) { // was: V$n
  if (entry.instreamVideoAdRenderer === undefined) {
    reportAdsControlFlowError("AdPlacementSupportedRenderers without matching InstreamVideoAdRenderer");
    return false;
  }

  for (const companion of entry.I9) {
    if (companion.getRequestAnimationFrame === undefined) return false;

    if (companion.extractUAMatch === undefined) {
      reportAdsControlFlowError("AdPlacementConfig for AdPlacementSupportedRenderers that matches an InstreamVideoAdRenderer is undefined");
      return false;
    }

    if (entry.lV === undefined ||
        companion.createCallbackEntry === undefined ||
        (entry.lV !== companion.createCallbackEntry && companion.createCallbackEntry !== "AD_PLACEMENT_KIND_SELF_START")) {
      return false;
    }

    if (entry.instreamVideoAdRenderer.elementId === undefined) {
      reportAdsControlFlowError("InstreamVideoAdRenderer has no elementId", undefined, undefined, {
        kind: entry.lV,
        "matching APSR kind": companion.createCallbackEntry
      });
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Renderer entry map accessor
// ---------------------------------------------------------------------------

/**
 * Retrieves or creates a renderer entry in the shared map for the given
 * video ID.
 *
 * [was: pz]
 *
 * @param {Map}    rendererMap - Shared map [was: Q]
 * @param {string} videoId     - External video ID [was: c]
 * @returns {object}
 */
export function getOrCreateRendererEntry(rendererMap, videoId) { // was: pz
  if (!rendererMap.has(videoId)) {
    rendererMap.set(videoId, {
      instreamVideoAdRenderer: undefined, // was: void 0
      lV: undefined, // was: void 0
      adVideoId: videoId,
      I9: []
    });
  }
  return rendererMap.get(videoId);
}

/**
 * Pushes a companion descriptor onto the renderer entry's `I9` array.
 * Warns if `videoId` is missing.
 *
 * [was: QM]
 *
 * @param {Map}      rendererMap                  [was: Q]
 * @param {string}   triggerEvent                 [was: c]
 * @param {string}   placementKind                [was: W]
 * @param {boolean}  isContentVideoCompanion      [was: m]
 * @param {string}   videoId                      [was: K]
 * @param {string}   compositeLayoutId            [was: T]
 * @param {object}   adPlacementConfig            [was: r]
 * @param {object}   adSlotLoggingData            [was: U]
 * @param {Function} layoutFactory                [was: I]
 */
export function addCompanionDescriptor(rendererMap, triggerEvent, placementKind, isContentVideoCompanion, videoId, compositeLayoutId, adPlacementConfig, adSlotLoggingData, layoutFactory) { // was: QM
  if (videoId) {
    getOrCreateRendererEntry(rendererMap, videoId).I9.push({
      NA0: triggerEvent,
      createCallbackEntry: placementKind,
      isContentVideoCompanion,
      extractUAMatch: adPlacementConfig,
      associatedCompositePlayerBytesLayoutId: compositeLayoutId,
      adSlotLoggingData,
      getRequestAnimationFrame: layoutFactory
    });
  } else {
    reportAdsControlFlowError("Companion AdPlacementSupportedRenderer without adVideoId");
  }
}

// ---------------------------------------------------------------------------
// Survey ad helpers
// ---------------------------------------------------------------------------

/**
 * Computes the total duration (ms) of a survey ad by summing the
 * `durationMilliseconds` of each question.
 *
 * [was: cc]
 *
 * @param {object} surveyRenderer - Instream survey ad renderer [was: Q]
 * @returns {number} Total duration in milliseconds
 */
export function computeSurveyDuration(surveyRenderer) { // was: cc
  let total = 0; // was: c
  for (const question of surveyRenderer.questions) {
    const parsed = getProperty(question, instreamSurveyMultiSelect) || getProperty(question, instreamSurveySingleSelect); // was: Q (reused)
    if (parsed) {
      total += parsed.surveyAdQuestionCommon?.durationMilliseconds || 0;
    }
  }
  return total;
}

/**
 * Extracts a normalised playback-commands bag from a survey renderer,
 * merging the `instreamAdCompleteCommands` and first question's
 * `timeoutCommands` into the `completeCommands` slot.
 *
 * [was: Wc]
 *
 * @param {object} surveyRenderer [was: Q]
 * @returns {object} Normalised command map
 */
export function extractSurveyPlaybackCommands(surveyRenderer) { // was: Wc
  const firstQuestionCommon =
    getProperty(surveyRenderer.questions?.[0], instreamSurveyMultiSelect)?.surveyAdQuestionCommon ||
    getProperty(surveyRenderer.questions?.[0], instreamSurveySingleSelect)?.surveyAdQuestionCommon; // was: c

  const completeCommands = [
    ...(surveyRenderer.playbackCommands?.instreamAdCompleteCommands || []),
    ...(firstQuestionCommon?.timeoutCommands || [])
  ]; // was: c (reused)

  return {
    impressionCommands: surveyRenderer.playbackCommands?.impressionCommands,
    errorCommands: surveyRenderer.playbackCommands?.errorCommands,
    muteCommands: surveyRenderer.playbackCommands?.muteCommands,
    unmuteCommands: surveyRenderer.playbackCommands?.unmuteCommands,
    pauseCommands: surveyRenderer.playbackCommands?.pauseCommands,
    rewindCommands: surveyRenderer.playbackCommands?.rewindCommands,
    resumeCommands: surveyRenderer.playbackCommands?.resumeCommands,
    skipCommands: surveyRenderer.playbackCommands?.skipCommands,
    progressCommands: surveyRenderer.playbackCommands?.progressCommands,
    tre: surveyRenderer.playbackCommands?.clickthroughCommands,
    fullscreenCommands: surveyRenderer.playbackCommands?.fullscreenCommands,
    activeViewViewableCommands: surveyRenderer.playbackCommands?.activeViewViewableCommands,
    activeViewMeasurableCommands: surveyRenderer.playbackCommands?.activeViewMeasurableCommands,
    activeViewFullyViewableAudibleHalfDurationCommands: surveyRenderer.playbackCommands?.activeViewFullyViewableAudibleHalfDurationCommands,
    activeViewAudioAudibleCommands: surveyRenderer.playbackCommands?.activeViewTracking?.activeViewAudioAudibleCommands,
    activeViewAudioMeasurableCommands: surveyRenderer.playbackCommands?.activeViewTracking?.activeViewAudioMeasurableCommands,
    endFullscreenCommands: surveyRenderer.playbackCommands?.endFullscreenCommands,
    abandonCommands: surveyRenderer.playbackCommands?.abandonCommands,
    completeCommands
  };
}

// ---------------------------------------------------------------------------
// Survey layout factory
// ---------------------------------------------------------------------------

/**
 * Returns a two-argument factory function that creates a survey layout and
 * its associated triggers (normal-exit, skip, survey-submitted).
 *
 * [was: HhO]
 *
 * @param {object}   config         [was: Q]
 * @param {object}   idProvider     [was: c]
 * @param {object}   surveyData     [was: W]
 * @param {Array}    metadataItems  [was: m]
 * @param {object}   placementConfig [was: K]
 * @param {object}   triggerConfig  [was: T]
 * @param {Function} loggingMapper  [was: r]
 * @returns {Function}
 */
export function createSurveyLayoutFactory(config, idProvider, surveyData, metadataItems, placementConfig, triggerConfig, loggingMapper) { // was: HhO
  return (slotFactory, slotInfo) => // was: (U, I)
    createDelegatedInPlayerSlot(config, slotInfo.slotId, slotFactory, triggerConfig, (triggerId, exitTrigger) => { // was: (X, A)
      const layoutId = slotInfo.layoutId; // was: e
      const loggingData = loggingMapper(triggerId); // was: X (reused)
      return createEndcapOrInterstitialLayout(
        idProvider, layoutId, exitTrigger, placementConfig,
        loggingData, "LAYOUT_TYPE_SURVEY",
        [new t$7(surveyData), ...metadataItems],
        surveyData.adLayoutLoggingData
      );
    });
}

// ---------------------------------------------------------------------------
// Sliding text overlay
// ---------------------------------------------------------------------------

/**
 * Creates a `LAYOUT_TYPE_SLIDING_TEXT_PLAYER_OVERLAY` layout from an
 * `InstreamVideoAdRenderer` that carries `additionalPlayerOverlay` with
 * `slidingTextPlayerOverlayRenderer`. Returns an error for invalid renderers.
 *
 * [was: S1_]
 *
 * @param {object}   renderer       - InstreamVideoAdRenderer [was: Q]
 * @param {object}   triggerConfig  [was: c]
 * @param {string}   slotId         [was: W]
 * @param {string}   linkedLayoutId [was: m]
 * @param {object}   idProvider     [was: K]
 * @param {object}   slotFactory    [was: T]
 * @param {Function} loggingMapper  [was: r]
 * @returns {Array|object} Array with the layout descriptor, or an error
 */
export function createSlidingTextOverlay(renderer, triggerConfig, slotId, linkedLayoutId, idProvider, slotFactory, loggingMapper) { // was: S1_
  if (!hasSlidingTextOverlay(renderer)) {
    return new z("Invalid InstreamVideoAdRenderer for SlidingText.", {
      instreamVideoAdRenderer: renderer
    });
  }

  const overlayRenderer = renderer.additionalPlayerOverlay.slidingTextPlayerOverlayRenderer; // was: U

  return [createInputEventInPlayerSlot(slotFactory, triggerConfig, slotId, linkedLayoutId, (slotInfo) => { // was: I
    let layoutId = slotInfo.slotId; // was: X
    const loggingDataFactory = loggingMapper(slotInfo); // was: I (reused)
    layoutId = generateLayoutId(idProvider.O.get(), "LAYOUT_TYPE_SLIDING_TEXT_PLAYER_OVERLAY", layoutId); // was: X
    const layoutSkeleton = { // was: A
      layoutId,
      layoutType: "LAYOUT_TYPE_SLIDING_TEXT_PLAYER_OVERLAY",
      G2: "core"
    };
    const exitTrigger = new LayoutIdExitedTrigger(idProvider.W, linkedLayoutId); // was: e

    return {
      layoutId,
      layoutType: "LAYOUT_TYPE_SLIDING_TEXT_PLAYER_OVERLAY",
      zy: new Map,
      layoutExitNormalTriggers: [exitTrigger],
      layoutExitSkipTriggers: [],
      layoutExitMuteTriggers: [],
      layoutExitUserInputSubmittedTriggers: [],
      layoutExitUserCancelledTriggers: [],
      G2: "core",
      clientMetadata: new MetadataCollection([new yEx(overlayRenderer)]),
      Je: loggingDataFactory(layoutSkeleton)
    };
  })];
}

/**
 * Returns `true` if the renderer carries a valid sliding-text overlay
 * (has a title and at least one sliding message).
 *
 * [was: NL7]
 *
 * @param {object} renderer [was: Q]
 * @returns {boolean}
 */
export function hasSlidingTextOverlay(renderer) { // was: NL7
  const overlay = getProperty(renderer?.additionalPlayerOverlay, slidingTextOverlay); // was: Q
  if (!overlay) return false;
  const messages = overlay.slidingMessages; // was: c
  return overlay.title && messages && messages.length !== 0 ? true : false;
}

// ---------------------------------------------------------------------------
// DAI survey layout factory
// ---------------------------------------------------------------------------

/**
 * Creates a factory that, given a slot factory and logging mapper, produces
 * a `LAYOUT_TYPE_SURVEY` layout for DAI instream surveys. Returns a no-op
 * factory when the renderer has no survey, or an error factory for invalid
 * renderers / zero-duration surveys.
 *
 * [was: dtR]
 *
 * @param {object}  renderer      - InstreamVideoAdRenderer [was: Q]
 * @param {object}  placementConfig [was: c]
 * @param {string}  contentVideoId [was: W]
 * @param {string}  linkedLayoutId [was: m]
 * @param {object}  idProvider     [was: K]
 * @returns {Function}
 */
export function createDaiSurveyFactory(renderer, placementConfig, contentVideoId, linkedLayoutId, idProvider) { // was: dtR
  if (!renderer.playerOverlay?.instreamSurveyAdRenderer)
    return () => [];

  if (!z8x(renderer)) {
    return () => new z("Received invalid InstreamVideoAdRenderer for DAI survey.", {
      instreamVideoAdRenderer: renderer
    });
  }

  const surveyRenderer = renderer.playerOverlay.instreamSurveyAdRenderer; // was: T
  const surveyDuration = computeSurveyDuration(surveyRenderer);           // was: r

  if (surveyDuration <= 0) {
    return () => new z("InstreamSurveyAdRenderer should have valid duration.", {
      instreamSurveyAdRenderer: surveyRenderer
    });
  }

  return (slotFactory, loggingMapper) => { // was: (U, I)
    const surveySlot = createLayoutEnteredInPlayerSlot(slotFactory, contentVideoId, linkedLayoutId, (slotInfo) => { // was: X = Zh7(…)
      let layoutId = slotInfo.slotId; // was: e
      const loggingDataFactory = loggingMapper(slotInfo); // was: A (reused)
      const commands = extractSurveyPlaybackCommands(surveyRenderer); // was: V
      layoutId = generateLayoutId(idProvider.O.get(), "LAYOUT_TYPE_SURVEY", layoutId); // was: e
      const layoutSkeleton = { // was: B
        layoutId,
        layoutType: "LAYOUT_TYPE_SURVEY",
        G2: "core"
      };
      const normalExitTrigger = new LayoutIdExitedTrigger(idProvider.W, linkedLayoutId); // was: n
      const skipTrigger = new handleSegmentRedirect(idProvider.W, layoutId);             // was: S
      const submittedTrigger = new SurveySubmittedTrigger(idProvider.W, layoutId);        // was: d
      const mediaEndTrigger = new PlaybackMinimizedTrigger(idProvider.W);                  // was: b

      return {
        layoutId,
        layoutType: "LAYOUT_TYPE_SURVEY",
        zy: new Map,
        layoutExitNormalTriggers: [normalExitTrigger, mediaEndTrigger],
        layoutExitSkipTriggers: [skipTrigger],
        layoutExitMuteTriggers: [],
        layoutExitUserInputSubmittedTriggers: [submittedTrigger],
        layoutExitUserCancelledTriggers: [],
        G2: "core",
        clientMetadata: new MetadataCollection([
          new s2O(surveyRenderer),
          new kb(placementConfig),
          new CuePointOpportunityMetadata(surveyDuration / 1000), // was: r / 1E3
          new InteractionsProgressMetadata(commands)
        ]),
        Je: loggingDataFactory(layoutSkeleton),
        adLayoutLoggingData: surveyRenderer.adLayoutLoggingData
      };
    });

    const slidingText = createSlidingTextOverlay(renderer, contentVideoId, surveySlot.slotId, linkedLayoutId, idProvider, slotFactory, loggingMapper); // was: S1_
    return slidingText instanceof z ? slidingText : [surveySlot, ...slidingText];
  };
}

// ---------------------------------------------------------------------------
// DAI ad slot generation
// ---------------------------------------------------------------------------

/**
 * Generates one or more DAI layout/slot descriptors from an
 * `AdPlacementRenderer`. Handles both single `instreamVideoAdRenderer` and
 * `linearAdSequenceRenderer` cases. Returns an error on invalid input.
 *
 * [was: fwn]
 *
 * @param {object}   slotFactory       [was: Q]
 * @param {object}   idProvider        [was: c]
 * @param {object}   placementRenderer [was: W]
 * @param {string}   contentCpn        [was: m]
 * @param {Function} loggingMapper     [was: K]
 * @param {object}   triggerConfig     [was: T]
 * @param {*}        extra             [was: r]
 * @returns {Array|object}
 */
export function generateDaiSlots(slotFactory, idProvider, placementRenderer, contentCpn, loggingMapper, triggerConfig, extra) { // was: fwn
  const layouts = []; // was: U

  try {
    let layoutFactory; // was: I
    let surveyFactories = []; // was: X

    if (placementRenderer.renderer.linearAdSequenceRenderer) {
      layoutFactory = (slotInfo) => { // was: e
        const result = expandLinearAdSequence(slotInfo.slotId, placementRenderer, idProvider, loggingMapper(slotInfo), contentCpn, triggerConfig); // was: e (reused)
        surveyFactories = result.r$;
        return result.N5;
      };
    } else if (placementRenderer.renderer.instreamVideoAdRenderer) {
      layoutFactory = (slotInfo) => { // was: e
        let slotId = slotInfo.slotId; // was: V
        const loggingDataFactory = loggingMapper(slotInfo); // was: e (reused)
        const adPlacementConfig = placementRenderer.config.adPlacementConfig; // was: B
        const { jq: enterMs, C0: exitMs } = parseAdTimeOffset(adPlacementConfig); // was: {jq: n, C0: S}

        let ivar = placementRenderer.renderer.instreamVideoAdRenderer; // was: d
        if (ivar?.playerOverlay?.instreamSurveyAdRenderer) {
          throw new TypeError("Survey overlay should not be set on single video.");
        }

        const parsed = parseInstreamVideoAdRenderer(ivar); // was: b
        const adjustedExitMs = Math.min(enterMs + parsed.videoLengthSeconds * 1000, exitMs); // was: w
        const adPodPosition = new AdPodInfo(0, [parsed.videoLengthSeconds]); // was: f

        const videoLengthSeconds = parsed.videoLengthSeconds;         // was: G
        const playerVars = parsed.playerVars;                         // was: T7
        const overlayRenderer = parsed.instreamAdPlayerOverlayRenderer; // was: oW
        const playerOverlayLayout = parsed.playerOverlayLayoutRenderer; // was: G7
        const adVideoId = parsed.adVideoId;                           // was: yn
        const driftRecoveryMs = getDriftRecoveryMs(placementRenderer);               // was: $x
        const pings = parsed.zy;                                      // was: z7
        const pingMetadata = parsed.A8;                               // was: b (reused)
        const adLayoutLoggingData = ivar?.adLayoutLoggingData;        // was: wT
        const sodarData = ivar?.sodarExtensionData;                   // was: d (reused)

        slotId = generateLayoutId(idProvider.O.get(), "LAYOUT_TYPE_MEDIA", slotId); // was: V
        const layoutSkeleton = { // was: P3
          layoutId: slotId,
          layoutType: "LAYOUT_TYPE_MEDIA",
          G2: "core"
        };

        return {
          layoutId: slotId,
          layoutType: "LAYOUT_TYPE_MEDIA",
          zy: pings,
          layoutExitNormalTriggers: [new LiveStreamBreakEndedTrigger(idProvider.W)],
          layoutExitSkipTriggers: [],
          layoutExitMuteTriggers: [],
          layoutExitUserInputSubmittedTriggers: [],
          layoutExitUserCancelledTriggers: [],
          G2: "core",
          clientMetadata: new MetadataCollection([
            new ContentCpnMetadata(contentCpn),
            new VideoLengthSecondsMetadata(videoLengthSeconds),
            new PlayerVarsMetadata(playerVars),
            new SlotEntryTriggerMetadata(enterMs),
            new en(adjustedExitMs),
            overlayRenderer && new InstreamOverlayRendererMetadata(overlayRenderer),
            playerOverlayLayout && new PlayerOverlayLayoutMetadata(playerOverlayLayout),
            new kb(adPlacementConfig),
            new xY(adVideoId),
            new qZ(adPodPosition),
            new nC(driftRecoveryMs),
            sodarData && new SodarExtensionMetadata(sodarData),
            new tq({ current: null }),
            new AdBreakRequestMetadata,
            new ActiveViewTrafficTypeMetadata(pingMetadata)
          ].filter(isNotNullish)),
          Je: loggingDataFactory(layoutSkeleton),
          adLayoutLoggingData
        };
      };
    } else {
      throw new TypeError("Expected valid AdPlacementRenderer for DAI");
    }

    const primarySlot = createPlayerBytesSlot(slotFactory, contentCpn, placementRenderer.adSlotLoggingData, layoutFactory, extra); // was: A
    layouts.push(primarySlot);

    for (const surveyFactory of surveyFactories) {
      const surveyLayouts = surveyFactory(slotFactory, loggingMapper); // was: V
      if (surveyLayouts instanceof z) return surveyLayouts;
      layouts.push(...surveyLayouts);
    }
  } catch (error) { // was: I
    return new z(error, {
      errorMessage: error.message,
      AdPlacementRenderer: placementRenderer,
      numberOfSurveyRenderers: countSurveyRenderers(placementRenderer)
    });
  }

  return layouts;
}

/**
 * Counts the number of survey renderers inside a linearAdSequenceRenderer.
 *
 * [was: Oh0]
 *
 * @param {object} placementRenderer [was: Q]
 * @returns {number}
 */
export function countSurveyRenderers(placementRenderer) { // was: Oh0
  const { linearAds } = placementRenderer.renderer.linearAdSequenceRenderer || {};
  return linearAds?.length
    ? linearAds.filter(ad => getProperty(ad, instreamVideoAdRenderer)?.playerOverlay?.instreamSurveyAdRenderer != null).length
    : 0;
}

// ---------------------------------------------------------------------------
// DAI linear-ad-sequence layout expansion
// ---------------------------------------------------------------------------

/**
 * Expands a `linearAdSequenceRenderer` into per-ad sub-layouts and a
 * composite layout. Returns the composite layout descriptor and an array
 * of survey-factory functions.
 *
 * [was: LsK]
 *
 * @param {string}   slotId            [was: Q]
 * @param {object}   placementRenderer [was: c]
 * @param {object}   idProvider        [was: W]
 * @param {Function} loggingMapper     [was: m]
 * @param {string}   contentCpn        [was: K]
 * @param {object}   triggerConfig     [was: T]
 * @returns {{ N5: object, r$: Array }}
 */
export function expandLinearAdSequence(slotId, placementRenderer, idProvider, loggingMapper, contentCpn, triggerConfig) { // was: LsK
  const adPlacementConfig = placementRenderer.config.adPlacementConfig; // was: r
  const { jq: enterMs, C0: exitMs } = parseAdTimeOffset(adPlacementConfig);          // was: {jq: U, C0: I}

  const { linearAds } = placementRenderer.renderer.linearAdSequenceRenderer || {}; // was: X
  if (!linearAds?.length) {
    throw new TypeError("Expected linear ads");
  }

  const videoLengths = []; // was: A
  const buildState = { // was: e
    getStoredDisplaySettings: enterMs,
    f3: 0,
    Po: videoLengths
  };

  const adEntries = linearAds
    .map(ad => buildSubLayoutFactory(slotId, ad, buildState, idProvider, loggingMapper, adPlacementConfig, contentCpn, exitMs))
    .map((factory, index) => { // was: (B, n)
      const position = new AdPodInfo(index, videoLengths); // was: n
      return factory(position);
    });

  const subLayouts = adEntries.map(entry => entry.AdLayoutRendererMetadata); // was: V

  return {
    N5: buildDaiCompositeLayout(idProvider, slotId, enterMs, subLayouts, adPlacementConfig, getDriftRecoveryMs(placementRenderer), loggingMapper, exitMs, triggerConfig),
    r$: adEntries.map(entry => entry.adAvatarViewModel)
  };
}

// ---------------------------------------------------------------------------
// Per-ad sub-layout builder (within a linear sequence)
// ---------------------------------------------------------------------------

/**
 * Returns a deferred factory for a single media sub-layout within a linear
 * ad sequence. Captures the video length, timing offsets, and player-vars
 * at call time; the returned function takes an `rP` position and produces
 * both the layout and a survey-factory.
 *
 * [was: vn_]
 *
 * @param {string}   slotId            [was: Q]
 * @param {object}   linearAd          [was: c]
 * @param {object}   buildState        - Mutable { NC, f3, Po } [was: W]
 * @param {object}   idProvider        [was: m]
 * @param {Function} loggingMapper     [was: K]
 * @param {object}   adPlacementConfig [was: T]
 * @param {string}   contentCpn        [was: r]
 * @param {number}   exitMs            [was: U]
 * @returns {Function} (position: rP) → { VI: layout, q_: surveyFactory }
 */
export function buildSubLayoutFactory(slotId, linearAd, buildState, idProvider, loggingMapper, adPlacementConfig, contentCpn, exitMs) { // was: vn_
  const parsed = parseInstreamVideoAdRenderer(getProperty(linearAd, instreamVideoAdRenderer));     // was: I
  const startOffsetMs = buildState.getStoredDisplaySettings;       // was: X
  const adIndex = buildState.f3;             // was: A
  const adjustedExitMs = Math.min(startOffsetMs + parsed.videoLengthSeconds * 1000, exitMs); // was: e

  buildState.getStoredDisplaySettings = adjustedExitMs;
  buildState.f3++;
  buildState.Po.push(parsed.videoLengthSeconds);

  const surveyRenderer = getProperty(linearAd, instreamVideoAdRenderer)?.playerOverlay?.instreamSurveyAdRenderer; // was: V

  if (parsed.adVideoId === "nPpU29QrbiU" && surveyRenderer == null) {
    throw new TypeError("Survey slate media has no survey overlay");
  }

  return (position) => { // was: B
    RG(parsed.playerVars, position);

    const videoLengthSeconds = parsed.videoLengthSeconds;         // was: n
    const playerVars = parsed.playerVars;                         // was: S
    const pings = parsed.zy;                                      // was: d
    const pingMetadata = parsed.A8;                               // was: b
    const overlayRenderer = parsed.instreamAdPlayerOverlayRenderer; // was: w
    const playerOverlayLayout = parsed.playerOverlayLayoutRenderer; // was: f
    const adVideoId = parsed.adVideoId;                           // was: G
    const adLayoutLoggingData = getProperty(linearAd, instreamVideoAdRenderer)?.adLayoutLoggingData; // was: T7
    const sodarData = getProperty(linearAd, instreamVideoAdRenderer)?.sodarExtensionData;     // was: oW

    const layoutId = generateLayoutId(idProvider.O.get(), "LAYOUT_TYPE_MEDIA", slotId); // was: G7
    const layoutSkeleton = { // was: yn
      layoutId,
      layoutType: "LAYOUT_TYPE_MEDIA",
      G2: "adapter"
    };

    const layout = { // was: B (reused)
      layoutId,
      layoutType: "LAYOUT_TYPE_MEDIA",
      zy: pings,
      layoutExitNormalTriggers: [],
      layoutExitSkipTriggers: [],
      layoutExitMuteTriggers: [],
      layoutExitUserInputSubmittedTriggers: [],
      layoutExitUserCancelledTriggers: [],
      G2: "adapter",
      clientMetadata: new MetadataCollection([
        new ContentCpnMetadata(contentCpn),
        new VideoLengthSecondsMetadata(videoLengthSeconds),
        new PlayerVarsMetadata(playerVars),
        new SlotEntryTriggerMetadata(startOffsetMs),
        new en(adjustedExitMs),
        new ix(adIndex),
        new tq({ current: null }),
        overlayRenderer && new InstreamOverlayRendererMetadata(overlayRenderer),
        playerOverlayLayout && new PlayerOverlayLayoutMetadata(playerOverlayLayout),
        new kb(adPlacementConfig),
        new xY(adVideoId),
        new qZ(position),
        sodarData && new SodarExtensionMetadata(sodarData),
        surveyRenderer && new GGw(surveyRenderer),
        new AdBreakRequestMetadata,
        new ActiveViewTrafficTypeMetadata(pingMetadata)
      ].filter(isNotNullish)),
      Je: loggingMapper(layoutSkeleton),
      adLayoutLoggingData
    };

    const surveyFactory = createDaiSurveyFactory(getProperty(linearAd, instreamVideoAdRenderer), adPlacementConfig, contentCpn, layout.layoutId, idProvider); // was: dtR

    return {
      AdLayoutRendererMetadata: layout,
      adAvatarViewModel: surveyFactory
    };
  };
}

// ---------------------------------------------------------------------------
// Instream video ad parsing
// ---------------------------------------------------------------------------

/**
 * Parses an `InstreamVideoAdRenderer` into its constituent parts: player
 * vars, video length, overlay renderers, video ID, pings, and ping metadata.
 * Throws on missing or invalid data.
 *
 * [was: oL]
 *
 * @param {object} renderer [was: Q]
 * @returns {{ playerVars: object, videoLengthSeconds: number, instreamAdPlayerOverlayRenderer: object|null, playerOverlayLayoutRenderer: object|null, adVideoId: string, zy: Map, A8: * }}
 */
export function parseInstreamVideoAdRenderer(renderer) { // was: oL
  if (!renderer)
    throw new TypeError("Expected instream video ad renderer");
  if (!renderer.playerVars)
    throw new TypeError("Expected player vars in url encoded string");

  const playerVars = parseQueryString(renderer.playerVars); // was: c
  let videoLengthSeconds = Number(playerVars.length_seconds); // was: W

  if (isNaN(videoLengthSeconds))
    throw new TypeError("Expected valid length seconds in player vars");

  const trimmedMax = Number(renderer.trimmedMaxNonSkippableAdDurationMs); // was: m
  videoLengthSeconds = isNaN(trimmedMax) ? videoLengthSeconds : Math.min(videoLengthSeconds, trimmedMax / 1000);

  const { instreamAdPlayerOverlayRenderer: overlayRenderer = null } = renderer.playerOverlay || {}; // was: m
  const { playerOverlayLayoutRenderer: layoutRenderer = null } = renderer.playerOverlay || {};       // was: K

  let adVideoId = playerVars.video_id; // was: T
  if (!adVideoId) {
    adVideoId = renderer.externalVideoId ? renderer.externalVideoId : undefined;
  }
  if (!adVideoId) throw new TypeError("Expected valid video id in IVAR");

  return {
    playerVars,
    videoLengthSeconds,
    instreamAdPlayerOverlayRenderer: overlayRenderer,
    playerOverlayLayoutRenderer: layoutRenderer,
    adVideoId,
    zy: renderer.pings ? ae(renderer.pings) : new Map,
    A8: vR(renderer.pings)
  };
}

// ---------------------------------------------------------------------------
// Drift recovery and ad-time offset parsing
// ---------------------------------------------------------------------------

/**
 * Extracts the drift-recovery value from a placement renderer. Returns
 * `null` for non-positive or NaN values.
 *
 * [was: bhR]
 *
 * @param {object} renderer [was: Q]
 * @returns {number|null}
 */
export function getDriftRecoveryMs(renderer) { // was: bhR
  const sendPostRequest = Number(renderer.driftRecoveryMs); // was: Q
  return isNaN(sendPostRequest) || sendPostRequest <= 0 ? null : sendPostRequest;
}

/**
 * Extracts the start/end offset (ms) from an `adTimeOffset` field inside an
 * ad-placement config. Throws on NaN.
 *
 * [was: wnx]
 *
 * @param {object} config [was: Q]
 * @returns {{ jq: number, C0: number }} { enterMs, exitMs }
 */
export function parseAdTimeOffset(config) { // was: wnx
  const { offsetStartMilliseconds: rawStart, offsetEndMilliseconds: rawEnd } = config.adTimeOffset || {};
  const enterMs = Number(rawStart); // was: Q (reused)
  if (isNaN(enterMs))
    throw new TypeError("Expected valid start offset");

  const exitMs = Number(rawEnd); // was: m
  if (isNaN(exitMs))
    throw new TypeError("Expected valid end offset");

  return { jq: enterMs, C0: exitMs };
}

// ---------------------------------------------------------------------------
// Player-bytes callback data extraction
// ---------------------------------------------------------------------------

/**
 * Extracts the player-bytes callback data bag from a layout's client
 * metadata. Returns `null` when the callback reference is missing.
 *
 * [was: $t_]
 *
 * @param {object} layout [was: Q]
 * @returns {object|null}
 */
export function extractPlayerBytesCallbackData(layout) { // was: $t_
  const callbackRef = layout.clientMetadata.readTimecodeScale("metadata_type_player_bytes_callback_ref")?.current; // was: c
  if (!callbackRef) return null;

  const skipTargetRef = layout.clientMetadata.readTimecodeScale("metadata_type_ad_pod_skip_target_callback_ref"); // was: W

  const layoutId = layout.layoutId;                                                               // was: m
  const contentCpn = layout.clientMetadata.readTimecodeScale("metadata_type_content_cpn");                       // was: K
  const overlayRenderer = layout.clientMetadata.readTimecodeScale("metadata_type_instream_ad_player_overlay_renderer"); // was: T
  const underlayRenderer = layout.clientMetadata.readTimecodeScale("metadata_type_player_underlay_renderer");    // was: r
  const adPlacementConfig = layout.clientMetadata.readTimecodeScale("metadata_type_ad_placement_config");        // was: U
  const videoLengthSeconds = layout.clientMetadata.readTimecodeScale("metadata_type_video_length_seconds");      // was: I

  const hasEnterAndExit = hasMetadataKey(layout.clientMetadata, "metadata_type_layout_enter_ms") &&
    hasMetadataKey(layout.clientMetadata, "metadata_type_layout_exit_ms"); // was: X

  const daiDuration = hasEnterAndExit
    ? (layout.clientMetadata.readTimecodeScale("metadata_type_layout_exit_ms") -
       layout.clientMetadata.readTimecodeScale("metadata_type_layout_enter_ms")) / 1000
    : undefined; // was: void 0

  return {
    IM: layoutId,
    contentCpn,
    getNumericAttrOrNull: callbackRef,
    videoInterstitialButtoned: skipTargetRef,
    instreamAdPlayerOverlayRenderer: overlayRenderer,
    instreamAdPlayerUnderlayRenderer: underlayRenderer,
    adPlacementConfig,
    videoLengthSeconds,
    Ga: daiDuration,
    inPlayerLayoutId: layout.clientMetadata.readTimecodeScale("metadata_type_linked_in_player_layout_id"),
    inPlayerSlotId: layout.clientMetadata.readTimecodeScale("metadata_type_linked_in_player_slot_id")
  };
}

// ---------------------------------------------------------------------------
// VOD ad-notify + in-player slot generation
// ---------------------------------------------------------------------------

/**
 * Generates an ad-notify layout and its associated in-player slots for VOD.
 *
 * [was: uFx]
 *
 * @param {object} slotFactory       [was: Q]
 * @param {object} triggerConfig     [was: c]
 * @param {string} contentVideoId    [was: W]
 * @param {object} idProviderSrc     [was: m]
 * @param {object} idProvider        [was: K]
 * @param {object} exitTriggerConfig [was: T]
 * @param {object} loggingConfig     [was: r]
 * @param {object} fulfillmentConfig [was: U]
 * @param {*}      metadataExtra     [was: I]
 * @param {*}      remoteSlots       [was: X]
 * @param {*}      transitionMapper  [was: A]
 * @param {*}      experimentConfig  [was: e]
 * @param {*}      featureFlags      [was: V]
 * @param {*}      playerContext     [was: B]
 * @param {*}      extra             [was: n]
 * @returns {Array|object}
 */
export function generateAdNotifySlots(slotFactory, triggerConfig, contentVideoId, idProviderSrc, idProvider, exitTriggerConfig, loggingConfig, fulfillmentConfig, metadataExtra, remoteSlots, transitionMapper, experimentConfig, featureFlags, playerContext, extra) { // was: uFx
  const slotId = generateSlotId(idProviderSrc, "SLOT_TYPE_PLAYER_BYTES"); // was: m (reused)
  const adNotifyLayout = P07(idProvider, slotFactory, loggingConfig, contentVideoId, slotId, metadataExtra, remoteSlots); // was: Q (reused)

  if (adNotifyLayout instanceof z) return adNotifyLayout;

  const fulfilledLayoutId = adNotifyLayout.clientMetadata.readTimecodeScale("metadata_type_fulfilled_layout")?.layoutId; // was: X
  if (!fulfilledLayoutId) return new z("Invalid adNotify layout");

  const inPlayerSlots = generateInPlayerSlots(fulfilledLayoutId, idProvider, exitTriggerConfig, contentVideoId, fulfillmentConfig, triggerConfig, metadataExtra, transitionMapper, experimentConfig, featureFlags, playerContext, extra, loggingConfig); // was: c (reused)
  return inPlayerSlots instanceof z ? inPlayerSlots : [adNotifyLayout, ...inPlayerSlots];
}

/**
 * Generates in-player slots from a fulfilled layout ID, delegating to
 * `heW` for the layout factory and `zew` for slot creation.
 *
 * [was: lw3]
 *
 * @param {string}   fulfilledLayoutId [was: Q]
 * @param {object}   idProvider        [was: c]
 * @param {object}   exitConfig        [was: W]
 * @param {string}   contentVideoId    [was: m]
 * @param {object}   fulfillmentConfig [was: K]
 * @param {object}   triggerConfig     [was: T]
 * @param {*}        metadataExtra     [was: r]
 * @param {*}        transitionMapper  [was: U]
 * @param {*}        experimentConfig  [was: I]
 * @param {*}        featureFlags      [was: X]
 * @param {*}        playerContext     [was: A]
 * @param {*}        extra             [was: e]
 * @param {object}   loggingConfig     [was: V]
 * @returns {Array|object}
 */
export function generateInPlayerSlots(fulfilledLayoutId, idProvider, exitConfig, contentVideoId, fulfillmentConfig, triggerConfig, metadataExtra, transitionMapper, experimentConfig, featureFlags, playerContext, extra, loggingConfig) { // was: lw3
  const layoutFactory = heW(idProvider, exitConfig, contentVideoId, triggerConfig, metadataExtra, transitionMapper, experimentConfig, featureFlags, playerContext, extra, loggingConfig); // was: W
  if (layoutFactory instanceof z) return layoutFactory;

  const result = zew(idProvider, fulfilledLayoutId, metadataExtra, fulfillmentConfig, layoutFactory); // was: Q
  return result instanceof z ? result : [...result.rH, result.fg];
}
