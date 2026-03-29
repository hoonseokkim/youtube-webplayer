/**
 * Slot & Layout ID Generation and Layout Builders
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~27000–28000
 *
 * Handles:
 *  - Deterministic trigger ID generation (Jq)
 *  - Counter-based layout ID generation for gapless playback (nQ)
 *  - Player overlay metadata assembly (PVO)
 *  - In-player overlay layout construction (lMd)
 *  - DAI composite layout assembly (awm)
 *  - VOD media layout creation with full exit trigger sets (JE7, uEO)
 *  - Player overlay layout shortcuts (FT, MlK)
 *  - Underlay text/icon/button layout (Y1d)
 *  - Media break (skippable) layout + overlay pairing (KF, ud3, ML7)
 *  - VOD media sub-layout for sequential playback (own)
 *  - Companion layout creation (Im, XD)
 *  - In-video overlay layout (QZ)
 *  - Endcap / interstitial layout stub (m5)
 *  - Slot creation helpers (Nr, Ut_, BL3, xt_, DtW, ihW, Zh7, gn3, P07, ReK)
 *  - Player underlay slot (kGK)
 *  - Playback tracking / forecasting slots (jCK, fkO, GEx, PKx)
 *  - Ad break request slots (SZ, iq7)
 *  - Survey slot pairing (hly, Uen, kUy)
 *  - Slot entry trigger construction (o1n, S5, Y3W)
 *  - Logging data association (Mw, KQ)
 */

import { getProperty, instreamAdPlayerOverlayRenderer, playerOverlayLayoutRenderer } from '../core/misc-helpers.js';  // was: g.l, g.Re, g.kA
import { generateRandomBase64 } from '../data/gel-core.js';  // was: g.Ab
import { generateSlotId } from './trigger-config.js';  // was: g.sa
import { getNumericAttrOrNull } from '../modules/caption/caption-internals.js'; // was: gE
import { videoInterstitialButtoned } from '../core/misc-helpers.js'; // was: pQ
import { LayoutIdExitedTrigger } from './ad-trigger-types.js'; // was: Lz
import { LiveStreamBreakEndedTrigger } from './ad-trigger-types.js'; // was: uh
import { getCobaltVersion } from '../core/composition-helpers.js'; // was: tE
import { buildAdSignals } from '../core/composition-helpers.js'; // was: lk
import { delayedResolve } from '../core/event-registration.js'; // was: HJ
import { SurveySubmittedTrigger } from './ad-trigger-types.js'; // was: Oz
import { LayoutExitedForReasonTrigger } from './ad-trigger-types.js'; // was: wR
import { isWebKit600Plus } from '../core/composition-helpers.js'; // was: FF
import { OnDifferentLayoutIdEnteredTrigger } from './ad-trigger-types.js'; // was: PE
import { OnDifferentSlotIdEnterRequestedTrigger } from './ad-trigger-types.js'; // was: Hq
import { CloseRequestedTrigger } from './ad-trigger-types.js'; // was: fz
import { InvideoOverlayMetadata } from './ad-interaction.js'; // was: JDd
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { handleSegmentRedirect } from './dai-cue-range.js'; // was: jZ
import { AdNextParamsMetadata } from './ad-interaction.js'; // was: lx
import { AdVideoClickthroughMetadata } from './ad-interaction.js'; // was: ux
import { playerUnderlayAdLayout } from '../core/misc-helpers.js'; // was: xb
import { squeezebackSidePanel } from '../core/misc-helpers.js'; // was: Vy
import { OnLayoutSelfExitRequestedTrigger } from './ad-trigger-types.js'; // was: bh
import { BeforeContentVideoIdStartedTrigger } from './ad-trigger-types.js'; // was: sz
import { SlotIdExitedTrigger } from './ad-trigger-types.js'; // was: Ez
import { OnNewPlaybackAfterContentVideoIdTrigger } from './ad-trigger-types.js'; // was: Zi
import { LayoutIdEnteredTrigger } from './ad-trigger-types.js'; // was: Gu
import { LayoutIdActiveAndSlotIdExitedTrigger } from './ad-trigger-types.js'; // was: ii
import { SlotIdEnteredTrigger } from './ad-trigger-types.js'; // was: gR
import { LiveStreamBreakStartedTrigger } from './ad-trigger-types.js'; // was: lh
import { forwardPlayback } from './dai-cue-range.js'; // was: Fp
import { MediaTimeRangeTrigger } from './ad-trigger-types.js'; // was: vE
import { NotInMediaTimeRangeTrigger } from './ad-trigger-types.js'; // was: mgK
import { updateSeekBarAria } from '../ui/progress-bar-impl.js'; // was: pI
import { MediaTimeRangeReactivationTrigger } from './ad-trigger-types.js'; // was: rbX
import { ContentVideoIdEndedTrigger } from './ad-trigger-types.js'; // was: aG
import { every } from '../core/array-utils.js';
import { MetadataCollection } from './ad-triggers.js';

// Stub: PlayerBytesSlotMetadata [was: LC] — MetadataValue subclass for "metadata_type_player_bytes_slot_metadata" (base.js ~73754).
// Extends MetadataValue (qh).  Not yet extracted to its own module.
const PlayerBytesSlotMetadata = LC; // was: LC

// ---------------------------------------------------------------------------
// Deterministic Trigger ID Generator  [was: Jq]  (line ~27006)
// ---------------------------------------------------------------------------

/**
 * Generates a trigger ID, either deterministically (counter-based) or
 * randomly. Uses the `.A` counter map on the context object.
 *
 * Deterministic format: `${triggerType}_${counter}`
 *
 * [was: Jq]
 *
 * @param {object}  context      [was: Q]  — has .QC, .A (counter map)
 * @param {string}  triggerType  [was: c]  — e.g. "LAYOUT_TYPE_ENDCAP"
 * @returns {string} generated trigger ID
 */
export function generateTriggerId(context, triggerType) { // was: Jq
  if (isDeterministicIdEnabled(context.QC.get())) { // was: tl
    let counter = context.A.get(triggerType) || 0; // was: W
    counter++;
    context.A.set(triggerType, counter);
    return `${triggerType}_${counter}`;
  }
  return generateRandomBase64(16); // random 16-char hex
}

// ---------------------------------------------------------------------------
// Deterministic Layout ID Generator  [was: nQ]  (line ~27016)
// ---------------------------------------------------------------------------

/**
 * Generates a layout ID, either deterministically or randomly.
 * Uses the `.W` counter map on the context object.
 *
 * Deterministic format: `${slotId}_${layoutType}_${counter}`
 *
 * [was: nQ]
 *
 * @param {object}  context     [was: Q]  — has .QC, .W (counter map)
 * @param {string}  layoutType  [was: c]  — e.g. "LAYOUT_TYPE_MEDIA_BREAK"
 * @param {string}  slotId      [was: W]  — parent slot ID
 * @returns {string} generated layout ID
 */
export function generateLayoutId(context, layoutType, slotId) { // was: nQ
  if (isDeterministicIdEnabled(context.QC.get())) { // was: tl
    let counter = context.W.get(layoutType) || 0; // was: m
    counter++;
    context.W.set(layoutType, counter);
    return `${slotId}_${layoutType}_${counter}`;
  }
  return generateRandomBase64(16); // random 16-char hex
}

// ---------------------------------------------------------------------------
// Player Overlay Metadata Builder  [was: PVO]  (line ~27026)
// ---------------------------------------------------------------------------

/**
 * Assembles the standard client metadata array for a player overlay layout.
 * Includes linked layout ID, callback ref, ad placement config,
 * video length, ad duration, and optional overlay renderers.
 *
 * [was: PVO]
 *
 * @param {object}  playbackMeta   [was: Q]  — extracted playback metadata
 * @returns {Array} metadata items
 */
export function buildPlayerOverlayMetadata(playbackMeta) { // was: PVO
  const items = [ // was: c
    new jn(playbackMeta.IM), // was: jn — linked layout ID
    new $ed(playbackMeta.getNumericAttrOrNull), // was: $ed — callback reference
    new kb(playbackMeta.adPlacementConfig),
    new VideoLengthSecondsMetadata(playbackMeta.videoLengthSeconds),
    new CuePointOpportunityMetadata(playbackMeta.Ga), // was: KC — ad duration
  ];
  if (playbackMeta.instreamAdPlayerOverlayRenderer)
    items.push(new InstreamOverlayRendererMetadata(playbackMeta.instreamAdPlayerOverlayRenderer));
  if (playbackMeta.playerOverlayLayoutRenderer)
    items.push(new PlayerOverlayLayoutMetadata(playbackMeta.playerOverlayLayoutRenderer));
  if (playbackMeta.videoInterstitialButtoned) // was: pQ — skip target callback ref
    items.push(new vc(playbackMeta.videoInterstitialButtoned));
  return items;
}

// ---------------------------------------------------------------------------
// In-Player Overlay Layout  [was: lMd]  (line ~27034)
// ---------------------------------------------------------------------------

/**
 * Creates a LAYOUT_TYPE_MEDIA_LAYOUT_PLAYER_OVERLAY layout descriptor.
 * Uses either the provided inPlayerLayoutId or generates one.
 * Exit trigger fires when the linked layout exits normally.
 *
 * [was: lMd]
 *
 * @param {string}   slotId          [was: Q]
 * @param {string}   g2Source        [was: c]  — "core" | "adapter"
 * @param {object}   playbackMeta    [was: W]  — extracted playback metadata
 * @param {object}   clientMetadata  [was: m]  — PI instance
 * @param {Function} callbackRef     [was: K]  — callback factory
 * @param {object}   idContext       [was: T]  — ID generation context
 * @returns {object} overlay layout descriptor
 */
export function createInPlayerOverlayLayout(slotId, g2Source, playbackMeta, clientMetadata, callbackRef, idContext) { // was: lMd
  const layoutId = playbackMeta.inPlayerLayoutId // was: Q (reassigned)
    ? playbackMeta.inPlayerLayoutId
    : generateLayoutId(idContext, 'LAYOUT_TYPE_MEDIA_LAYOUT_PLAYER_OVERLAY', slotId);

  const loggingData = playbackMeta.instreamAdPlayerOverlayRenderer // was: r
    ? playbackMeta.instreamAdPlayerOverlayRenderer?.adLayoutLoggingData
    : playbackMeta.playerOverlayLayoutRenderer?.adLayoutLoggingData;

  const layoutIdentity = { // was: U
    layoutId,
    layoutType: 'LAYOUT_TYPE_MEDIA_LAYOUT_PLAYER_OVERLAY',
    G2: g2Source,
  };

  return {
    layoutId,
    layoutType: 'LAYOUT_TYPE_MEDIA_LAYOUT_PLAYER_OVERLAY',
    zy: new Map(),
    layoutExitNormalTriggers: [
      new LayoutIdExitedTrigger(triggeredId => generateTriggerId(idContext, triggeredId), playbackMeta.IM), // was: Jq
    ],
    layoutExitSkipTriggers: [],
    layoutExitMuteTriggers: [],
    layoutExitUserInputSubmittedTriggers: [],
    layoutExitUserCancelledTriggers: [],
    G2: g2Source,
    clientMetadata,
    Je: callbackRef(layoutIdentity),
    adLayoutLoggingData: loggingData,
  };
}

// ---------------------------------------------------------------------------
// DAI Composite Layout  [was: awm]  (line ~27058)
// ---------------------------------------------------------------------------

/**
 * Assembles a LAYOUT_TYPE_COMPOSITE_PLAYER_BYTES layout for DAI.
 * Validates that all sub-layouts are of type LAYOUT_TYPE_MEDIA,
 * then wraps them with segment bounds, ad placement config, and
 * drift recovery metadata.
 *
 * [was: awm]
 *
 * @param {object}  builderCtx        [was: Q]  — ad layout builder context
 * @param {string}  parentSlotId      [was: c]  — parent slot ID
 * @param {number}  segmentStartMs    [was: W]
 * @param {Array}   subLayouts        [was: m]
 * @param {object}  placementConfig   [was: K]
 * @param {number}  driftRecoveryMs   [was: T]
 * @param {Function} callbackRef      [was: r]
 * @param {number}  segmentEndMs      [was: U]
 * @param {*}       streamingConfig   [was: I]
 * @returns {object} composite layout descriptor
 */
export function buildDaiCompositeLayout( // was: awm
  builderCtx, parentSlotId, segmentStartMs, subLayouts, placementConfig,
  driftRecoveryMs, callbackRef, segmentEndMs, streamingConfig
) {
  subLayouts.every(layout => isLayoutOfType(layout, [], ['LAYOUT_TYPE_MEDIA'])) // was: gx
    || logAdWarning('Unexpect subLayout type for DAI composite layout'); // was: v1

  const layoutId = generateLayoutId( // was: nQ
    builderCtx.O.get(), 'LAYOUT_TYPE_COMPOSITE_PLAYER_BYTES', parentSlotId
  );

  const layoutIdentity = { // was: X
    layoutId,
    layoutType: 'LAYOUT_TYPE_COMPOSITE_PLAYER_BYTES',
    G2: 'core',
  };

  return {
    layoutId,
    layoutType: 'LAYOUT_TYPE_COMPOSITE_PLAYER_BYTES',
    zy: new Map(),
    layoutExitNormalTriggers: [new LiveStreamBreakEndedTrigger(builderCtx.W)],
    layoutExitSkipTriggers: [],
    layoutExitMuteTriggers: [],
    layoutExitUserInputSubmittedTriggers: [],
    layoutExitUserCancelledTriggers: [],
    G2: 'core',
    clientMetadata: new MetadataCollection([
      new SlotEntryTriggerMetadata(segmentStartMs), // was: Aq — segment start ms
      new en(segmentEndMs), // was: en — segment end ms
      new rD3(subLayouts), // was: rD3 — sub-layout list
      new kb(placementConfig),
      new nC(driftRecoveryMs), // was: nC — drift recovery ms
      new AdBreakRequestMetadata(),
      new BlR(streamingConfig), // was: BlR — streaming config
    ]),
    Je: callbackRef(layoutIdentity),
  };
}

// ---------------------------------------------------------------------------
// VOD Media Layout (full)  [was: JE7]  (line ~27081)
// ---------------------------------------------------------------------------

/**
 * Creates a complete VOD media layout with all exit triggers
 * and client metadata. Wraps uEO and adds standard layout properties.
 *
 * [was: JE7]
 *
 * @param {object}  builderCtx        [was: Q]
 * @param {string}  layoutId          [was: c]
 * @param {string}  g2Source          [was: W]
 * @param {object}  mediaRenderer     [was: m]
 * @param {object}  placementConfig   [was: K]
 * @param {object}  playerVars        [was: T]
 * @param {number}  videoLength       [was: r]
 * @param {object}  adPodInfo         [was: U]
 * @param {Function} callbackRef      [was: I]
 * @param {Map}     remoteSlotsMap    [was: X]
 * @param {Array}   sdsSlotsData      [was: A]
 * @returns {object} media layout descriptor
 */
export function createVodMediaLayout( // was: JE7
  builderCtx, layoutId, g2Source, mediaRenderer, placementConfig,
  playerVars, videoLength, adPodInfo, callbackRef, remoteSlotsMap, sdsSlotsData
) {
  const raw = buildRawMediaLayout( // was: uEO
    builderCtx, layoutId, 'core', g2Source, mediaRenderer, placementConfig,
    playerVars, videoLength, adPodInfo, callbackRef, remoteSlotsMap,
    undefined, sdsSlotsData
  );

  return {
    layoutId: raw.layoutId,
    layoutType: raw.layoutType,
    zy: raw.zy,
    layoutExitNormalTriggers: raw.layoutExitNormalTriggers,
    layoutExitSkipTriggers: raw.layoutExitSkipTriggers,
    layoutExitMuteTriggers: raw.layoutExitMuteTriggers,
    layoutExitUserInputSubmittedTriggers: raw.layoutExitUserInputSubmittedTriggers,
    layoutExitUserCancelledTriggers: raw.layoutExitUserCancelledTriggers,
    G2: raw.G2,
    clientMetadata: new MetadataCollection(raw.l4), // was: l4 — raw metadata array
    Je: raw.Je,
    adLayoutLoggingData: raw.adLayoutLoggingData,
  };
}

// ---------------------------------------------------------------------------
// Player Overlay Layout Shortcut  [was: FT]  (line ~27099)
// ---------------------------------------------------------------------------

/**
 * Quick factory for a player overlay layout using standard playback metadata.
 *
 * [was: FT]
 *
 * @param {object}  builderCtx    [was: Q]
 * @param {string}  slotId        [was: c]
 * @param {string}  g2Source      [was: W]
 * @param {object}  playbackMeta  [was: m]
 * @param {Function} callbackRef  [was: K]
 * @returns {object} overlay layout
 */
export function createPlayerOverlayLayout(builderCtx, slotId, g2Source, playbackMeta, callbackRef) { // was: FT
  const metadataItems = buildPlayerOverlayMetadata(playbackMeta); // was: PVO
  return createInPlayerOverlayLayout(slotId, g2Source, playbackMeta, new MetadataCollection(metadataItems), callbackRef, builderCtx.O.get());
}

// ---------------------------------------------------------------------------
// Underlay Text/Icon/Button Layout  [was: Y1d]  (line ~27104)
// ---------------------------------------------------------------------------

/**
 * Creates a LAYOUT_TYPE_UNDERLAY_TEXT_ICON_BUTTON layout for player underlay ads.
 *
 * [was: Y1d]
 *
 * @param {object}  triggerCtx       [was: Q]
 * @param {string}  slotId           [was: c]
 * @param {object}  underlayData     [was: W]
 * @param {object}  placementConfig  [was: m]
 * @param {string}  linkedLayoutId   [was: K]
 * @param {Function} callbackRef     [was: T]
 * @returns {object} underlay layout descriptor
 */
export function createUnderlayLayout(triggerCtx, slotId, underlayData, placementConfig, linkedLayoutId, callbackRef) { // was: Y1d
  const clientMetadata = new MetadataCollection([new h03(underlayData), new kb(placementConfig)]); // was: W (reassigned)
  const layoutId = generateLayoutId(triggerCtx.O.get(), 'LAYOUT_TYPE_UNDERLAY_TEXT_ICON_BUTTON', slotId); // was: c (reassigned)

  const layoutIdentity = { // was: m (reassigned)
    layoutId,
    layoutType: 'LAYOUT_TYPE_UNDERLAY_TEXT_ICON_BUTTON',
    G2: 'core',
  };

  return {
    layoutId,
    layoutType: 'LAYOUT_TYPE_UNDERLAY_TEXT_ICON_BUTTON',
    zy: new Map(),
    layoutExitNormalTriggers: [
      new LayoutIdExitedTrigger(triggeredId => generateTriggerId(triggerCtx.O.get(), triggeredId), linkedLayoutId),
    ],
    layoutExitSkipTriggers: [],
    layoutExitMuteTriggers: [],
    layoutExitUserInputSubmittedTriggers: [],
    layoutExitUserCancelledTriggers: [],
    G2: 'core',
    clientMetadata,
    Je: callbackRef(layoutIdentity),
    adLayoutLoggingData: undefined,
  };
}

// ---------------------------------------------------------------------------
// Skippable Media Break Layout  [was: ud3]  (line ~27128)
// ---------------------------------------------------------------------------

/**
 * Creates a LAYOUT_TYPE_MEDIA_BREAK sub-layout entry for a skippable ad.
 * Appends skip-target and ad-pod-index metadata, and optionally suppresses
 * skip triggers when a skip target is active.
 *
 * [was: ud3]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  slotId           [was: c]
 * @param {object}  placementConfig  [was: W]
 * @param {number}  durationMs       [was: m]
 * @param {object}  commandSet       [was: K]
 * @param {Map}     pings            [was: T]
 * @param {Function} callbackRef     [was: r]
 * @param {Function} overlayFactory  [was: U]
 * @param {number}  skipTarget       [was: I]  — skip target index (-1 = none)
 * @param {number}  adPodIndex       [was: X]
 * @param {*}       loggingData      [was: A]
 * @param {number}  adPodTotal       [was: e]
 * @returns {object} sub-layout result { tE, eZ, CF, ZY, lk, HJ }
 */
export function createSkippableMediaBreak( // was: ud3
  builderCtx, slotId, placementConfig, durationMs, commandSet,
  pings, callbackRef, overlayFactory, skipTarget, adPodIndex,
  loggingData, adPodTotal
) {
  const breakLayout = buildMediaBreakLayout( // was: KF
    builderCtx, slotId, placementConfig, durationMs, commandSet,
    pings, callbackRef, overlayFactory, loggingData, adPodTotal
  );

  const metadataItems = breakLayout.HM; // was: c (reassigned)
  const linkedLayoutRef = new $Y(breakLayout.DD); // was: W
  let skipTriggers = breakLayout.layoutExitSkipTriggers; // was: m

  if (skipTarget > 0) {
    metadataItems.push(linkedLayoutRef);
    metadataItems.push(new hq(skipTarget));
    skipTriggers = [];
  }
  metadataItems.push(new AdPodSkipIndexMetadata(adPodIndex));

  return {
    getCobaltVersion: { // was: tE — layout entry
      layoutId: breakLayout.layoutId,
      layoutType: breakLayout.layoutType,
      zy: breakLayout.zy,
      layoutExitNormalTriggers: [],
      layoutExitSkipTriggers: [],
      layoutExitMuteTriggers: [],
      layoutExitUserInputSubmittedTriggers: [],
      layoutExitUserCancelledTriggers: [],
      G2: breakLayout.G2,
      clientMetadata: new MetadataCollection(metadataItems),
      Je: breakLayout.Je,
      adLayoutLoggingData: breakLayout.adLayoutLoggingData,
    },
    eZ: skipTriggers, // was: eZ — skip triggers
    CF: breakLayout.layoutExitMuteTriggers, // was: CF — mute triggers
    ZY: breakLayout.layoutExitUserInputSubmittedTriggers, // was: ZY
    buildAdSignals: breakLayout.layoutExitUserCancelledTriggers, // was: lk
    delayedResolve: breakLayout.delayedResolve, // was: HJ — overlay layout
  };
}

// ---------------------------------------------------------------------------
// Survey Media Break Layout  [was: ML7]  (line ~27160)
// ---------------------------------------------------------------------------

/**
 * Creates a media break layout specifically for surveys.
 * Adds a user-input-submitted trigger (Oz) for survey completion.
 *
 * [was: ML7]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  slotId           [was: c]
 * @param {object}  placementConfig  [was: W]
 * @param {number}  durationMs       [was: m]
 * @param {object}  commandSet       [was: K]
 * @param {Function} callbackRef     [was: T]
 * @param {Function} overlayFactory  [was: r]
 * @param {object}  surveyBundle     [was: U]
 * @param {number}  adPodIndex       [was: I]
 * @returns {object} sub-layout result { tE, eZ, CF, ZY, lk, HJ }
 */
export function createSurveyMediaBreak( // was: ML7
  builderCtx, slotId, placementConfig, durationMs, commandSet,
  callbackRef, overlayFactory, surveyBundle, adPodIndex
) {
  const breakLayout = buildMediaBreakLayout( // was: KF
    builderCtx, slotId, placementConfig, durationMs, commandSet,
    new Map(), callbackRef, overlay => overlayFactory(overlay, surveyBundle)
  );

  const submitTrigger = new SurveySubmittedTrigger(builderCtx.W, breakLayout.DD); // was: Q (reassigned)
  const linkedLayoutRef = new $Y(breakLayout.DD); // was: W
  const podIndex = new AdPodSkipIndexMetadata(adPodIndex); // was: I (reassigned)

  return {
    getCobaltVersion: {
      layoutId: breakLayout.layoutId,
      layoutType: breakLayout.layoutType,
      zy: breakLayout.zy,
      layoutExitNormalTriggers: [],
      layoutExitSkipTriggers: [],
      layoutExitMuteTriggers: [],
      layoutExitUserInputSubmittedTriggers: [],
      layoutExitUserCancelledTriggers: [],
      G2: breakLayout.G2,
      clientMetadata: new MetadataCollection([...breakLayout.HM, linkedLayoutRef, podIndex]),
      Je: breakLayout.Je,
      adLayoutLoggingData: breakLayout.adLayoutLoggingData,
    },
    eZ: breakLayout.layoutExitSkipTriggers,
    CF: breakLayout.layoutExitMuteTriggers,
    ZY: [...breakLayout.layoutExitUserInputSubmittedTriggers, submitTrigger],
    buildAdSignals: breakLayout.layoutExitUserCancelledTriggers,
    delayedResolve: breakLayout.delayedResolve,
  };
}

// ---------------------------------------------------------------------------
// VOD Media Sub-Layout (sequential)  [was: own]  (line ~27188)
// ---------------------------------------------------------------------------

/**
 * Builds a media sub-layout for sequential (adapter) playback.
 * Handles skip-target suppression, ad-pod indexing, and critical-ad
 * error triggers.
 *
 * [was: own]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  layoutId         [was: c]
 * @param {object}  mediaRenderer    [was: W]
 * @param {object}  placementConfig  [was: m]
 * @param {object}  playerVars       [was: K]
 * @param {number}  videoLength      [was: T]
 * @param {string}  contentCpn       [was: r]
 * @param {object}  adPodInfo        [was: U]
 * @param {Function} callbackRef     [was: I]
 * @param {object}  skipTargetRef    [was: X]
 * @param {*}       remoteSlots      [was: A]
 * @param {object}  nextPlayerVars   [was: e]
 * @param {*}       experimentCfg    [was: V]
 * @returns {object} sub-layout result { tE, eZ, CF, ZY, lk }
 */
export function buildVodMediaSubLayout( // was: own
  builderCtx, layoutId, mediaRenderer, placementConfig, playerVars,
  videoLength, contentCpn, adPodInfo, callbackRef, skipTargetRef,
  remoteSlots, nextPlayerVars, experimentCfg
) {
  const raw = buildRawMediaLayout( // was: uEO
    builderCtx, layoutId, 'adapter', mediaRenderer, placementConfig,
    playerVars, videoLength, contentCpn, adPodInfo, callbackRef,
    remoteSlots, nextPlayerVars, experimentCfg
  );

  let skipTriggers = raw.layoutExitSkipTriggers; // was: m (reassigned)
  const metadataItems = raw.l4; // was: K (reassigned)

  if (mediaRenderer.adPodSkipTarget && mediaRenderer.adPodSkipTarget > 0) {
    metadataItems.push(skipTargetRef);
    metadataItems.push(new hq(mediaRenderer.adPodSkipTarget));
    skipTriggers = [];
  }
  metadataItems.push(new AdPodSkipIndexMetadata(adPodInfo.adPodIndex));

  if (mediaRenderer.isCritical) {
    skipTriggers = [new LayoutExitedForReasonTrigger(builderCtx.W, raw.layoutId, ['error']), ...skipTriggers];
  }

  return {
    getCobaltVersion: {
      layoutId: raw.layoutId,
      layoutType: raw.layoutType,
      zy: raw.zy,
      layoutExitNormalTriggers: [],
      layoutExitSkipTriggers: [],
      layoutExitMuteTriggers: [],
      layoutExitUserInputSubmittedTriggers: [],
      layoutExitUserCancelledTriggers: [],
      G2: raw.G2,
      clientMetadata: new MetadataCollection(metadataItems),
      Je: raw.Je,
      adLayoutLoggingData: raw.adLayoutLoggingData,
    },
    eZ: skipTriggers,
    CF: raw.layoutExitMuteTriggers,
    ZY: raw.layoutExitUserInputSubmittedTriggers,
    buildAdSignals: raw.layoutExitUserCancelledTriggers,
  };
}

// ---------------------------------------------------------------------------
// Overlay-Aware Player Overlay  [was: MlK]  (line ~27219)
// ---------------------------------------------------------------------------

/**
 * Like createPlayerOverlayLayout but also includes the Yz (yield flags)
 * and FF (filter flags) metadata from the playback metadata.
 *
 * [was: MlK]
 *
 * @param {object}  builderCtx    [was: Q]
 * @param {string}  slotId        [was: c]
 * @param {string}  g2Source      [was: W]
 * @param {object}  playbackMeta  [was: m]
 * @param {Function} callbackRef  [was: K]
 * @returns {object} overlay layout
 */
export function createOverlayAwarePlayerOverlay(builderCtx, slotId, g2Source, playbackMeta, callbackRef) { // was: MlK
  const metadataItems = buildPlayerOverlayMetadata(playbackMeta); // was: PVO
  metadataItems.push(new z0X(playbackMeta.Yz)); // was: z0X — yield flags
  metadataItems.push(new CV3(playbackMeta.isWebKit600Plus)); // was: CV3 — filter flags
  return createInPlayerOverlayLayout(slotId, g2Source, playbackMeta, new MetadataCollection(metadataItems), callbackRef, builderCtx.O.get());
}

// ---------------------------------------------------------------------------
// Companion Layout with Impression Pings  [was: Im]  (line ~27226)
// ---------------------------------------------------------------------------

/**
 * Creates a companion layout (e.g. action button, image, shopping) that
 * exits normally when the associated media layout enters a specific slot.
 *
 * [was: Im]
 *
 * @param {object}  triggerCtx       [was: Q]
 * @param {string}  slotId           [was: c]
 * @param {string}  layoutType       [was: W]
 * @param {object}  rendererData     [was: m]  — companion renderer wrapper
 * @param {string}  linkedSlotId     [was: K]  — linked SLOT_TYPE_PLAYER_BYTES slot
 * @param {object}  placementConfig  [was: T]
 * @param {Array}   impressionPings  [was: r]  — impression URL array (optional)
 * @param {Function} callbackRef     [was: U]
 * @param {*}       loggingData      [was: I]
 * @param {string}  linkedLayoutId   [was: X]  — additional linked layout (optional)
 * @returns {object} companion layout descriptor
 */
export function createCompanionLayoutWithPings( // was: Im
  triggerCtx, slotId, layoutType, rendererData, linkedSlotId,
  placementConfig, impressionPings, callbackRef, loggingData, linkedLayoutId
) {
  const layoutId = generateLayoutId(triggerCtx.O.get(), layoutType, slotId); // was: nQ

  const layoutIdentity = { // was: A
    layoutId,
    layoutType,
    G2: 'core',
  };

  const pingMap = new Map(); // was: e
  if (impressionPings) pingMap.set('impression', impressionPings);

  const exitTriggers = [ // was: r (reassigned)
    new OnDifferentLayoutIdEnteredTrigger(triggerCtx.W, linkedSlotId, 'SLOT_TYPE_PLAYER_BYTES', 'LAYOUT_TYPE_MEDIA'),
  ];
  if (linkedLayoutId)
    exitTriggers.push(new LayoutExitedForReasonTrigger(triggerCtx.W, linkedLayoutId, ['normal']));

  return {
    layoutId,
    layoutType,
    zy: pingMap,
    layoutExitNormalTriggers: exitTriggers,
    layoutExitSkipTriggers: [],
    layoutExitMuteTriggers: [],
    layoutExitUserInputSubmittedTriggers: [],
    layoutExitUserCancelledTriggers: [],
    G2: 'core',
    clientMetadata: new MetadataCollection([rendererData, new kb(placementConfig), new jn(linkedSlotId)]),
    Je: callbackRef(layoutIdentity),
    adLayoutLoggingData: loggingData,
  };
}

// ---------------------------------------------------------------------------
// Companion Layout (no pings)  [was: XD]  (line ~27253)
// ---------------------------------------------------------------------------

/**
 * Creates a companion layout without impression pings (e.g. for view models).
 *
 * [was: XD]
 *
 * @param {object}  triggerCtx       [was: Q]
 * @param {string}  slotId           [was: c]
 * @param {string}  layoutType       [was: W]
 * @param {object}  rendererData     [was: m]
 * @param {string}  linkedSlotId     [was: K]
 * @param {object}  placementConfig  [was: T]
 * @param {Function} callbackRef     [was: r]
 * @param {*}       loggingData      [was: U]
 * @param {string}  linkedLayoutId   [was: I]  — optional
 * @returns {object} companion layout descriptor
 */
export function createCompanionLayout( // was: XD
  triggerCtx, slotId, layoutType, rendererData, linkedSlotId,
  placementConfig, callbackRef, loggingData, linkedLayoutId
) {
  const layoutId = generateLayoutId(triggerCtx.O.get(), layoutType, slotId); // was: nQ

  const layoutIdentity = { // was: X
    layoutId,
    layoutType,
    G2: 'core',
  };

  const exitTriggers = [ // was: A
    new OnDifferentLayoutIdEnteredTrigger(triggerCtx.W, linkedSlotId, 'SLOT_TYPE_PLAYER_BYTES', 'LAYOUT_TYPE_MEDIA'),
  ];
  if (linkedLayoutId)
    exitTriggers.push(new LayoutExitedForReasonTrigger(triggerCtx.W, linkedLayoutId, ['normal']));

  return {
    layoutId,
    layoutType,
    zy: new Map(),
    layoutExitNormalTriggers: exitTriggers,
    layoutExitSkipTriggers: [],
    layoutExitMuteTriggers: [],
    layoutExitUserInputSubmittedTriggers: [],
    layoutExitUserCancelledTriggers: [],
    G2: 'core',
    clientMetadata: new MetadataCollection([rendererData, new kb(placementConfig), new jn(linkedSlotId)]),
    Je: callbackRef(layoutIdentity),
    adLayoutLoggingData: loggingData,
  };
}

// ---------------------------------------------------------------------------
// In-Video Overlay Exit Metadata  [was: cq]  (line ~27278)
// ---------------------------------------------------------------------------

/**
 * Builds metadata items for in-video overlay exit triggers.
 * Includes a slot-hide trigger and an optional overlay-dismiss trigger.
 *
 * [was: cq]
 *
 * @param {object}  builderCtx      [was: Q]
 * @param {object}  dismissTrigger  [was: c]  — optional dismiss trigger
 * @param {string}  slotId          [was: W]
 * @returns {Array} metadata items
 */
export function buildOverlayExitMetadata(builderCtx, dismissTrigger, slotId) { // was: cq
  const items = []; // was: m
  items.push(new OnDifferentSlotIdEnterRequestedTrigger(builderCtx.W, slotId));
  if (dismissTrigger) items.push(dismissTrigger);
  return items;
}

// ---------------------------------------------------------------------------
// In-Video Overlay Layout  [was: QZ]  (line ~27285)
// ---------------------------------------------------------------------------

/**
 * Creates an in-video overlay layout (text, enhanced-text, or image).
 *
 * [was: QZ]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  layoutId         [was: c]
 * @param {string}  layoutType       [was: W]
 * @param {object}  overlayRenderer  [was: m]
 * @param {object}  placementConfig  [was: K]
 * @param {Function} callbackRef     [was: T]
 * @param {Array}   exitTriggers     [was: r]  — normal exit triggers
 * @returns {object} overlay layout descriptor
 */
export function createInVideoOverlayLayout( // was: QZ
  builderCtx, layoutId, layoutType, overlayRenderer, placementConfig,
  callbackRef, exitTriggers
) {
  const layoutIdentity = { // was: U
    layoutId,
    layoutType,
    G2: 'core',
  };

  return {
    layoutId,
    layoutType,
    zy: new Map(),
    layoutExitNormalTriggers: exitTriggers,
    layoutExitSkipTriggers: [new CloseRequestedTrigger(builderCtx.W, layoutId)],
    layoutExitMuteTriggers: [],
    layoutExitUserInputSubmittedTriggers: [],
    layoutExitUserCancelledTriggers: [],
    G2: 'core',
    clientMetadata: new MetadataCollection([new InvideoOverlayMetadata(overlayRenderer), new kb(placementConfig)]),
    Je: callbackRef(layoutIdentity),
    adLayoutLoggingData: overlayRenderer.adLayoutLoggingData,
  };
}

// ---------------------------------------------------------------------------
// Endcap / Interstitial Layout Stub  [was: m5]  (line ~27307)
// ---------------------------------------------------------------------------

/**
 * Creates a simple layout descriptor for an endcap or interstitial.
 * Exit is triggered by a linked-layout normal exit (Lz).
 *
 * [was: m5]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  layoutId         [was: c]
 * @param {string}  linkedLayoutId   [was: W]
 * @param {object}  placementConfig  [was: m]
 * @param {Function} callbackRef     [was: K]
 * @param {string}  layoutType       [was: T]
 * @param {Array}   extraMetadata    [was: r]
 * @param {*}       loggingData      [was: U]
 * @returns {object} layout descriptor
 */
export function createEndcapOrInterstitialLayout( // was: m5
  builderCtx, layoutId, linkedLayoutId, placementConfig,
  callbackRef, layoutType, extraMetadata, loggingData
) {
  const layoutIdentity = { // was: I
    layoutId,
    layoutType,
    G2: 'core',
  };

  return {
    layoutId,
    layoutType,
    zy: new Map(),
    layoutExitNormalTriggers: [new LayoutIdExitedTrigger(builderCtx.W, linkedLayoutId)],
    layoutExitSkipTriggers: [],
    layoutExitMuteTriggers: [],
    layoutExitUserInputSubmittedTriggers: [],
    layoutExitUserCancelledTriggers: [],
    G2: 'core',
    clientMetadata: new MetadataCollection([new kb(placementConfig), ...extraMetadata]),
    Je: callbackRef(layoutIdentity),
    adLayoutLoggingData: loggingData,
  };
}

// ---------------------------------------------------------------------------
// Media Break Layout (base)  [was: KF]  (line ~27329)
// ---------------------------------------------------------------------------

/**
 * Base factory for a LAYOUT_TYPE_MEDIA_BREAK layout.
 * Generates the layout ID, creates the overlay layout via the overlayFactory,
 * and assembles skip/mute/cancel triggers.
 *
 * [was: KF]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  slotId           [was: c]
 * @param {object}  placementConfig  [was: W]
 * @param {number}  durationMs       [was: m]
 * @param {object}  commandSet       [was: K]
 * @param {Map}     pings            [was: T]
 * @param {Function} callbackRef     [was: r]
 * @param {Function} overlayFactory  [was: U]
 * @param {*}       loggingData      [was: I]
 * @param {number}  adPodIndex       [was: X]  — optional ad pod index
 * @returns {object} intermediate layout result (not yet wrapped in PI)
 */
export function buildMediaBreakLayout( // was: KF
  builderCtx, slotId, placementConfig, durationMs, commandSet,
  pings, callbackRef, overlayFactory, loggingData, adPodIndex
) {
  const layoutId = generateLayoutId(builderCtx.O.get(), 'LAYOUT_TYPE_MEDIA_BREAK', slotId); // was: nQ

  const layoutIdentity = { // was: A
    layoutId,
    layoutType: 'LAYOUT_TYPE_MEDIA_BREAK',
    G2: 'adapter',
  };

  const overlayLayout = overlayFactory(layoutId); // was: U = U(c)
  const fulfilledLayout = overlayLayout.clientMetadata.readTimecodeScale('metadata_type_fulfilled_layout'); // was: e
  if (!fulfilledLayout)
    logAdWarning('Could not retrieve overlay layout ID during VodSkippableMediaBreakLayout creation. This should never happen.');

  const linkedLayoutId = fulfilledLayout ? fulfilledLayout.layoutId : ''; // was: V

  const metadataItems = [ // was: W (reassigned)
    new kb(placementConfig),
    new MediaLayoutDurationMetadata(durationMs),
    new InteractionsProgressMetadata(commandSet),
  ];
  if (fulfilledLayout)
    metadataItems.push(new SurveyTriggerMetadata(fulfilledLayout.layoutType));
  if (adPodIndex)
    metadataItems.push(new ix(adPodIndex));

  return {
    layoutId,
    layoutType: 'LAYOUT_TYPE_MEDIA_BREAK',
    zy: pings,
    layoutExitNormalTriggers: [],
    layoutExitSkipTriggers: [new handleSegmentRedirect(builderCtx.W, linkedLayoutId)],
    layoutExitMuteTriggers: [],
    layoutExitUserInputSubmittedTriggers: [],
    layoutExitUserCancelledTriggers: [],
    G2: 'adapter',
    HM: metadataItems, // was: HM — raw metadata (not yet wrapped in PI)
    Je: callbackRef(layoutIdentity),
    adLayoutLoggingData: loggingData,
    delayedResolve: overlayLayout, // was: HJ — overlay layout
    DD: linkedLayoutId, // was: DD — linked overlay layout ID
  };
}

// ---------------------------------------------------------------------------
// Raw Media Layout Builder  [was: uEO]  (line ~27361)
// ---------------------------------------------------------------------------

/**
 * Core builder for a LAYOUT_TYPE_MEDIA layout.
 * Assembles all metadata (placement config, ad pod info, video ID, commands,
 * player vars, overlay renderers, underlay, skip offset, etc.) and
 * optionally searches for a player-underlay association.
 *
 * [was: uEO]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  layoutId         [was: c]
 * @param {string}  g2Source         [was: W]
 * @param {object}  mediaRenderer    [was: m]
 * @param {object}  placementConfig  [was: K]
 * @param {object}  playerVars       [was: T]
 * @param {number}  videoLength      [was: r]
 * @param {object}  adPodInfo        [was: U]
 * @param {Function} callbackRef     [was: I]
 * @param {Map}     remoteSlotsMap   [was: X]
 * @param {*}       remoteSlots      [was: A]
 * @param {object}  nextPlayerVars   [was: e]
 * @param {Array}   sdsSlotsData     [was: V]
 * @returns {object} raw layout result with l4 (metadata array)
 */
export function buildRawMediaLayout( // was: uEO
  builderCtx, layoutId, g2Source, mediaRenderer, placementConfig,
  playerVars, videoLength, adPodInfo, callbackRef, remoteSlotsMap,
  remoteSlots, nextPlayerVars, sdsSlotsData
) {
  const layoutIdentity = { // was: B
    layoutId,
    layoutType: 'LAYOUT_TYPE_MEDIA',
    G2: g2Source,
  };

  const metadataItems = [ // was: K (reassigned)
    new kb(placementConfig),
    new qZ(adPodInfo),
    new xY(mediaRenderer.externalVideoId),
    new ContentCpnMetadata(adPodInfo), // was: Ut — content CPN
    new InteractionsProgressMetadata({
      impressionCommands: mediaRenderer.impressionCommands,
      abandonCommands: mediaRenderer.onAbandonCommands,
      completeCommands: mediaRenderer.completeCommands,
      progressCommands: mediaRenderer.adVideoProgressCommands,
    }),
    new PlayerVarsMetadata(playerVars),
    new tq({ current: null }),
    new VideoLengthSecondsMetadata(videoLength),
  ];

  // Overlay renderers
  const instreamOverlay = mediaRenderer.playerOverlay.instreamAdPlayerOverlayRenderer; // was: T (reassigned)
  if (instreamOverlay) metadataItems.push(new InstreamOverlayRendererMetadata(instreamOverlay));

  const playerOverlayLayout = mediaRenderer.playerOverlay.playerOverlayLayoutRenderer; // was: r (reassigned)
  if (playerOverlayLayout) metadataItems.push(new PlayerOverlayLayoutMetadata(playerOverlayLayout));

  if (nextPlayerVars) metadataItems.push(new PlayerBytesCallbackMetadata(nextPlayerVars));

  const playerUnderlay = mediaRenderer.playerUnderlay; // was: e (reassigned)
  if (playerUnderlay) metadataItems.push(new h03(playerUnderlay));

  // In-player slot association
  const inPlayerSlotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_IN_PLAYER'); // was: sa
  const inPlayerLayoutId = (instreamOverlay
    ? instreamOverlay.elementId
    : playerOverlayLayout?.layoutId)
    || generateLayoutId(builderCtx.O.get(), 'LAYOUT_TYPE_MEDIA_LAYOUT_PLAYER_OVERLAY', inPlayerSlotId);

  metadataItems.push(new $Y(inPlayerLayoutId));
  metadataItems.push(new ig7(inPlayerSlotId));
  metadataItems.push(new ix(adPodInfo.adPodIndex));

  if (mediaRenderer.adNextParams) metadataItems.push(new AdNextParamsMetadata(mediaRenderer.adNextParams));
  if (mediaRenderer.shrunkenPlayerBytesConfig) metadataItems.push(new R0X(mediaRenderer.shrunkenPlayerBytesConfig));
  if (mediaRenderer.clickthroughEndpoint) metadataItems.push(new AdVideoClickthroughMetadata(mediaRenderer.clickthroughEndpoint));
  if (mediaRenderer.legacyInfoCardVastExtension) metadataItems.push(new CompositeLayoutSlotMetadata(mediaRenderer.legacyInfoCardVastExtension));
  if (mediaRenderer.sodarExtensionData) metadataItems.push(new SodarExtensionMetadata(mediaRenderer.sodarExtensionData));
  if (remoteSlots) metadataItems.push(new zv(remoteSlots));

  metadataItems.push(new ActiveViewTrafficTypeMetadata(vR(mediaRenderer.pings)));

  const pingMap = buildPingMap(mediaRenderer.pings); // was: ae

  // Search for player-underlay association
  if (sdsSlotsData) {
    let underlaySlot; // was: n
    findUnderlay: {
      for (const sdsSlot of sdsSlotsData) { // was: n of V
        if (sdsSlot.adSlotMetadata.slotType === 'SLOT_TYPE_PLAYER_UNDERLAY') {
          const fulfilledLayout = getProperty(sdsSlot.fulfillmentContent.fulfilledLayout, playerUnderlayAdLayout);
          if (!fulfilledLayout) continue;
          const underlayRenderer = getProperty(fulfilledLayout.renderingContent, squeezebackSidePanel);
          if (underlayRenderer && underlayRenderer.associatedPlayerBytesLayoutId === layoutId)
            break findUnderlay;
        }
      }
      underlaySlot = undefined;
    }
    if (underlaySlot) metadataItems.push(new PlayerBytesMediaLayoutMetadata(underlaySlot));
  }

  return {
    layoutId,
    layoutType: 'LAYOUT_TYPE_MEDIA',
    zy: pingMap,
    layoutExitNormalTriggers: [new OnLayoutSelfExitRequestedTrigger(builderCtx.W, layoutId)],
    layoutExitSkipTriggers: mediaRenderer.skipOffsetMilliseconds
      ? [new handleSegmentRedirect(builderCtx.W, inPlayerLayoutId)]
      : [],
    layoutExitMuteTriggers: [new handleSegmentRedirect(builderCtx.W, inPlayerLayoutId)],
    layoutExitUserInputSubmittedTriggers: [],
    layoutExitUserCancelledTriggers: [],
    G2: g2Source,
    l4: metadataItems, // was: l4 — raw metadata items (not yet PI-wrapped)
    Je: callbackRef(layoutIdentity),
    adLayoutLoggingData: mediaRenderer.adLayoutLoggingData,
  };
}

// ---------------------------------------------------------------------------
// Null Check Helper  [was: j23]  (line ~27422)
// ---------------------------------------------------------------------------

/**
 * Returns true if the value is not null and not undefined.
 *
 * [was: j23]
 *
 * @param {*}  value   [was: Q]
 * @returns {boolean}
 */
export function isNotNullish(value) { // was: j23
  return value != null;
}

// ---------------------------------------------------------------------------
// Slot Creation Helpers  (lines ~27426–27796)
// ---------------------------------------------------------------------------

/**
 * Creates a slot with a content-entering entry trigger and standard
 * fulfillment/expiration triggers.
 *
 * [was: Ut_]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  slotType         [was: c]
 * @param {string}  contentCpn       [was: W]
 * @param {*}       loggingData      [was: m]
 * @param {Function} layoutFactory   [was: K]
 * @returns {object} slot descriptor
 */
export function createContentEntrySlot(builderCtx, slotType, contentCpn, loggingData, layoutFactory) { // was: Ut_
  const slotId = generateSlotId(builderCtx.O.get(), slotType); // was: sa
  return createSlotWithFulfillment( // was: Nr
    builderCtx, slotId, slotType,
    new BeforeContentVideoIdStartedTrigger(builderCtx.W, contentCpn),
    [new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn), new SlotIdExitedTrigger(builderCtx.W, slotId)],
    loggingData, layoutFactory
  );
}

/**
 * Creates a slot that enters on a layout-exit-normal trigger for a specific layout.
 *
 * [was: BL3]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  slotType         [was: c]
 * @param {string}  contentCpn       [was: W]
 * @param {string}  errorLayoutId    [was: m]
 * @param {string}  entryLayoutId    [was: K]
 * @param {*}       loggingData      [was: T]
 * @param {Function} layoutFactory   [was: r]
 * @returns {object} slot descriptor
 */
export function createLayoutExitEntrySlot(builderCtx, slotType, contentCpn, errorLayoutId, entryLayoutId, loggingData, layoutFactory) { // was: BL3
  const slotId = generateSlotId(builderCtx.O.get(), slotType); // was: sa
  return createSlotWithFulfillment(
    builderCtx, slotId, slotType,
    new LayoutExitedForReasonTrigger(builderCtx.W, entryLayoutId, ['normal']),
    [new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn), new SlotIdExitedTrigger(builderCtx.W, slotId), new LayoutExitedForReasonTrigger(builderCtx.W, errorLayoutId, ['error'])],
    loggingData, layoutFactory
  );
}

/**
 * Creates a slot with a layout-entered entry trigger.
 *
 * [was: xt_]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  slotType         [was: c]
 * @param {string}  contentCpn       [was: W]
 * @param {string}  entryLayoutId    [was: m]
 * @param {*}       loggingData      [was: K]
 * @param {Function} layoutFactory   [was: T]
 * @returns {object} slot descriptor
 */
export function createLayoutEnteredSlot(builderCtx, slotType, contentCpn, entryLayoutId, loggingData, layoutFactory) { // was: xt_
  const slotId = generateSlotId(builderCtx.O.get(), slotType); // was: sa
  return createSlotWithFulfillment(
    builderCtx, slotId, slotType,
    new LayoutIdEnteredTrigger(builderCtx.W, entryLayoutId),
    [new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn), new SlotIdExitedTrigger(builderCtx.W, slotId), new LayoutExitedForReasonTrigger(builderCtx.W, entryLayoutId, ['error'])],
    loggingData, layoutFactory
  );
}

/**
 * Delegates to kUy for in-player slot with layout-entered trigger.
 *
 * [was: DtW]
 */
export function createDelegatedInPlayerSlot(builderCtx, slotId, contentCpn, placementConfig, layoutFactory) { // was: DtW
  return createInPlayerSlotWithLayoutEntry(builderCtx, slotId, contentCpn, placementConfig, layoutFactory); // was: kUy
}

/**
 * Creates an in-player slot with an input-event entry trigger.
 *
 * [was: ihW]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  contentCpn       [was: c]
 * @param {string}  inputLayoutId    [was: W]
 * @param {string}  entryLayoutId    [was: m]
 * @param {Function} layoutFactory   [was: K]
 * @returns {object} slot descriptor
 */
export function createInputEventInPlayerSlot(builderCtx, contentCpn, inputLayoutId, entryLayoutId, layoutFactory) { // was: ihW
  const slotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_IN_PLAYER'); // was: sa
  const entryTrigger = new LayoutIdActiveAndSlotIdExitedTrigger(builderCtx.W, entryLayoutId, inputLayoutId); // was: W (reassigned)
  const fulfillmentTriggers = [new SlotIdEnteredTrigger(builderCtx.W, slotId)]; // was: m (reassigned)
  const expirationTriggers = [new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn)]; // was: Q (reassigned)

  return {
    slotId,
    slotType: 'SLOT_TYPE_IN_PLAYER',
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(layoutFactory({
      slotId,
      slotType: 'SLOT_TYPE_IN_PLAYER',
      slotPhysicalPosition: 1,
      G2: 'core',
      slotEntryTrigger: entryTrigger,
      slotFulfillmentTriggers: fulfillmentTriggers,
      slotExpirationTriggers: expirationTriggers,
    }))]),
  };
}

/**
 * Creates an in-player slot with a layout-entered entry trigger and
 * standard expiration triggers.
 *
 * [was: Zh7]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  contentCpn       [was: c]
 * @param {string}  entryLayoutId    [was: W]
 * @param {Function} layoutFactory   [was: m]
 * @returns {object} slot descriptor
 */
export function createLayoutEnteredInPlayerSlot(builderCtx, contentCpn, entryLayoutId, layoutFactory) { // was: Zh7
  const slotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_IN_PLAYER'); // was: sa
  const entryTrigger = new LayoutIdEnteredTrigger(builderCtx.W, entryLayoutId); // was: W (reassigned)
  const fulfillmentTriggers = [new SlotIdEnteredTrigger(builderCtx.W, slotId)]; // was: T (reassigned)
  const expirationTriggers = [new SlotIdExitedTrigger(builderCtx.W, slotId), new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn)]; // was: r

  const slotDescriptor = { // was: T (reassigned)
    slotId,
    slotType: 'SLOT_TYPE_IN_PLAYER',
    slotPhysicalPosition: 1,
    G2: 'core',
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
  };

  return {
    slotId,
    slotType: 'SLOT_TYPE_IN_PLAYER',
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: [new SlotIdEnteredTrigger(builderCtx.W, slotId)],
    slotExpirationTriggers: [new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn), new SlotIdExitedTrigger(builderCtx.W, slotId)],
    G2: 'core',
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(layoutFactory(slotDescriptor))]),
  };
}

/**
 * Creates a SLOT_TYPE_PLAYER_BYTES slot with a layout-host entry trigger
 * and an optional content-loaded ref.
 *
 * [was: gn3]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  contentCpn       [was: c]
 * @param {*}       loggingData      [was: W]
 * @param {Function} layoutFactory   [was: m]
 * @param {*}       contentLoadedRef [was: K]  — optional
 * @returns {object} slot descriptor
 */
export function createPlayerBytesSlot(builderCtx, contentCpn, loggingData, layoutFactory, contentLoadedRef) { // was: gn3
  const slotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_PLAYER_BYTES'); // was: sa
  const entryTrigger = new LiveStreamBreakStartedTrigger(builderCtx.W); // was: r
  const fulfillmentTriggers = [new forwardPlayback(builderCtx.W, slotId)]; // was: U
  const expirationTriggers = [new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn)]; // was: Q (reassigned)

  const metadataItems = []; // was: c (reassigned)
  metadataItems.push(new FulfilledLayoutMetadata(layoutFactory({
    slotId,
    slotType: 'SLOT_TYPE_PLAYER_BYTES',
    slotPhysicalPosition: 1,
    G2: 'core',
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
  })));
  metadataItems.push(new AdBreakRequestMetadata());
  if (contentLoadedRef)
    metadataItems.push(new dP({ current: contentLoadedRef }));

  return {
    slotId,
    slotType: 'SLOT_TYPE_PLAYER_BYTES',
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection(metadataItems),
    adSlotLoggingData: loggingData,
  };
}

/**
 * Creates an in-player slot with a layout-entered trigger, standard
 * fulfillment/expiration, and an optional pre-existing slotId.
 *
 * [was: ReK]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  contentCpn       [was: c]
 * @param {string}  entryLayoutId    [was: W]
 * @param {Function} layoutFactory   [was: m]
 * @param {string}  existingSlotId   [was: K]  — optional
 * @returns {object} slot descriptor
 */
export function createReusableInPlayerSlot(builderCtx, contentCpn, entryLayoutId, layoutFactory, existingSlotId) { // was: ReK
  const slotId = existingSlotId || generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_IN_PLAYER'); // was: K
  const entryTrigger = new LayoutIdEnteredTrigger(builderCtx.W, entryLayoutId); // was: W (reassigned)
  const fulfillmentTriggers = [new SlotIdEnteredTrigger(builderCtx.W, slotId)]; // was: T
  const expirationTriggers = [new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn), new SlotIdExitedTrigger(builderCtx.W, slotId)]; // was: Q

  return {
    slotId,
    slotType: 'SLOT_TYPE_IN_PLAYER',
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(layoutFactory({
      slotId,
      slotType: 'SLOT_TYPE_IN_PLAYER',
      slotPhysicalPosition: 1,
      G2: 'core',
      slotEntryTrigger: entryTrigger,
      slotFulfillmentTriggers: fulfillmentTriggers,
      slotExpirationTriggers: expirationTriggers,
    }))]),
  };
}

// ---------------------------------------------------------------------------
// Player Underlay Slot  [was: kGK]  (line ~27658)
// ---------------------------------------------------------------------------

/**
 * Creates a SLOT_TYPE_PLAYER_UNDERLAY slot with a layout-entered entry trigger.
 *
 * [was: kGK]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  contentCpn       [was: c]
 * @param {string}  entryLayoutId    [was: W]
 * @param {Function} layoutFactory   [was: m]
 * @returns {object} slot descriptor
 */
export function createPlayerUnderlaySlot(builderCtx, contentCpn, entryLayoutId, layoutFactory) { // was: kGK
  const slotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_PLAYER_UNDERLAY'); // was: sa
  const entryTrigger = new LayoutIdEnteredTrigger(builderCtx.W, entryLayoutId); // was: W (reassigned)
  const fulfillmentTriggers = [new SlotIdEnteredTrigger(builderCtx.W, slotId)]; // was: T
  const expirationTriggers = [new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn), new SlotIdExitedTrigger(builderCtx.W, slotId)]; // was: Q (reassigned)

  return {
    slotId,
    slotType: 'SLOT_TYPE_PLAYER_UNDERLAY',
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(layoutFactory({
      slotId,
      slotType: 'SLOT_TYPE_PLAYER_UNDERLAY',
      slotPhysicalPosition: 1,
      G2: 'core',
      slotEntryTrigger: entryTrigger,
      slotFulfillmentTriggers: fulfillmentTriggers,
      slotExpirationTriggers: expirationTriggers,
    }))]),
  };
}

// ---------------------------------------------------------------------------
// Playback Tracking Slot  [was: jCK]  (line ~27683)
// ---------------------------------------------------------------------------

/**
 * Creates a playback tracking slot (or SLOT_TYPE_PLAYER_BYTES_SEQUENCE_ITEM
 * if `isSequenceItem` is true).
 *
 * [was: jCK]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  contentCpn       [was: c]
 * @param {boolean} isSequenceItem   [was: W]
 * @param {*}       loggingData      [was: m]
 * @param {Function} layoutFactory   [was: K]
 * @returns {object} slot descriptor
 */
export function createPlaybackTrackingSlot(builderCtx, contentCpn, isSequenceItem, loggingData, layoutFactory) { // was: jCK
  const slotType = isSequenceItem // was: W (reassigned)
    ? 'SLOT_TYPE_PLAYER_BYTES_SEQUENCE_ITEM'
    : 'SLOT_TYPE_PLAYBACK_TRACKING';

  const slotId = generateSlotId(builderCtx.O.get(), slotType); // was: sa
  const entryTrigger = new BeforeContentVideoIdStartedTrigger(builderCtx.W, contentCpn); // was: c (reassigned)
  const fulfillmentTriggers = [new SlotIdEnteredTrigger(builderCtx.W, slotId)]; // was: r
  const expirationTriggers = [new SlotIdExitedTrigger(builderCtx.W, slotId)]; // was: Q (reassigned)

  return {
    slotId,
    slotType,
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(layoutFactory({
      slotId,
      slotType,
      slotPhysicalPosition: 1,
      G2: 'core',
      slotEntryTrigger: entryTrigger,
      slotFulfillmentTriggers: fulfillmentTriggers,
      slotExpirationTriggers: expirationTriggers,
    }))]),
    adSlotLoggingData: loggingData,
  };
}

// ---------------------------------------------------------------------------
// Forecasting Slot  [was: fkO]  (line ~27710)
// ---------------------------------------------------------------------------

/**
 * Creates a SLOT_TYPE_FORECASTING slot with a time-range entry trigger.
 *
 * [was: fkO]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {object}  placementConfig  [was: c]
 * @param {string}  contentCpn       [was: W]
 * @param {number}  durationMs       [was: m]
 * @param {*}       loggingData      [was: K]
 * @param {Function} layoutFactory   [was: T]
 * @returns {object|Error} slot descriptor or Error
 */
export function createForecastingSlot(builderCtx, placementConfig, contentCpn, durationMs, loggingData, layoutFactory) { // was: fkO
  const slotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_FORECASTING'); // was: sa
  const entryTrigger = buildTimeRangeEntryTrigger(builderCtx, placementConfig, contentCpn, durationMs); // was: S5
  if (entryTrigger instanceof z) return entryTrigger;

  const fulfillmentTriggers = [new SlotIdEnteredTrigger(builderCtx.W, slotId)]; // was: m (reassigned)
  const expirationTriggers = [new SlotIdExitedTrigger(builderCtx.W, slotId), new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn)]; // was: Q (reassigned)

  return {
    slotId,
    slotType: 'SLOT_TYPE_FORECASTING',
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(layoutFactory({
      slotId,
      slotType: 'SLOT_TYPE_FORECASTING',
      slotPhysicalPosition: 1,
      G2: 'core',
      slotEntryTrigger: entryTrigger,
      slotFulfillmentTriggers: fulfillmentTriggers,
      slotExpirationTriggers: expirationTriggers,
    }))]),
    adSlotLoggingData: loggingData,
  };
}

// ---------------------------------------------------------------------------
// In-Player Overlay Slot (content-entering)  [was: GEx]  (line ~27738)
// ---------------------------------------------------------------------------

/**
 * Creates an in-player slot for overlays that enter when content starts.
 *
 * [was: GEx]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  contentCpn       [was: c]
 * @param {*}       loggingData      [was: W]
 * @param {Function} layoutFactory   [was: m]
 * @returns {object} slot descriptor
 */
export function createContentEntryInPlayerSlot(builderCtx, contentCpn, loggingData, layoutFactory) { // was: GEx
  const slotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_IN_PLAYER'); // was: sa
  const entryTrigger = new BeforeContentVideoIdStartedTrigger(builderCtx.W, contentCpn); // was: T
  const fulfillmentTriggers = [new forwardPlayback(builderCtx.W, slotId)]; // was: r
  const expirationTriggers = [new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn), new SlotIdExitedTrigger(builderCtx.W, slotId)]; // was: Q (reassigned)

  return {
    slotId,
    slotType: 'SLOT_TYPE_IN_PLAYER',
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(layoutFactory({
      slotId,
      slotType: 'SLOT_TYPE_IN_PLAYER',
      slotPhysicalPosition: 1,
      G2: 'core',
      slotEntryTrigger: entryTrigger,
      slotFulfillmentTriggers: fulfillmentTriggers,
      slotExpirationTriggers: expirationTriggers,
    }))]),
    adSlotLoggingData: loggingData,
  };
}

// ---------------------------------------------------------------------------
// In-Player Overlay Slot (time-range)  [was: PKx]  (line ~27764)
// ---------------------------------------------------------------------------

/**
 * Creates an in-player slot that enters on a time-range trigger.
 * Optionally creates a cue-range marker trigger for the overlay dismiss.
 *
 * [was: PKx]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {object}  placementConfig  [was: c]
 * @param {string}  contentCpn       [was: W]
 * @param {number}  durationMs       [was: m]
 * @param {*}       loggingData      [was: K]
 * @param {Function} layoutFactory   [was: T]  — (slot, markerTrigger?) => layout | Error
 * @returns {object|Error} slot descriptor or Error
 */
export function createTimeRangeInPlayerSlot( // was: PKx
  builderCtx, placementConfig, contentCpn, durationMs, loggingData, layoutFactory
) {
  const entryTrigger = buildTimeRangeEntryTrigger(builderCtx, placementConfig, contentCpn, durationMs); // was: S5
  if (entryTrigger instanceof z) return entryTrigger;

  const markerTrigger = entryTrigger instanceof MediaTimeRangeTrigger // was: r
    ? new NotInMediaTimeRangeTrigger(builderCtx.W, contentCpn, entryTrigger.W)
    : null;

  const slotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_IN_PLAYER'); // was: m (reassigned)
  const fulfillmentTriggers = [new SlotIdEnteredTrigger(builderCtx.W, slotId)]; // was: U
  const expirationTriggers = [new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn), new SlotIdExitedTrigger(builderCtx.W, slotId)]; // was: Q (reassigned)

  const layout = layoutFactory({
    slotId,
    slotType: 'SLOT_TYPE_IN_PLAYER',
    slotPhysicalPosition: 1,
    G2: 'core',
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
  }, markerTrigger);

  if (layout instanceof oe) return new z(layout);

  return {
    slotId,
    slotType: 'SLOT_TYPE_IN_PLAYER',
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(layout)]),
    adSlotLoggingData: loggingData,
  };
}

// ---------------------------------------------------------------------------
// Survey Slot Helpers  [was: hly, Uen, kUy]  (lines ~27794–27920)
// ---------------------------------------------------------------------------

/**
 * Creates an in-player slot for a survey overlay (delegates to kUy).
 *
 * [was: hly]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  linkedLayoutId   [was: c]
 * @param {string}  contentCpn       [was: W]
 * @param {Function} layoutFactory   [was: m]
 * @returns {object} slot descriptor
 */
export function createSurveyInPlayerSlot(builderCtx, linkedLayoutId, contentCpn, layoutFactory) { // was: hly
  const slotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_IN_PLAYER'); // was: sa
  return createInPlayerSlotWithLayoutEntry(builderCtx, slotId, linkedLayoutId, contentCpn, layoutFactory); // was: kUy
}

/**
 * Creates a paired SLOT_TYPE_PLAYER_BYTES + SLOT_TYPE_IN_PLAYER for a
 * standalone survey with a time-range entry.
 *
 * [was: Uen]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {object}  placementConfig  [was: c]
 * @param {string}  contentCpn       [was: W]
 * @param {number}  durationMs       [was: m]
 * @param {*}       loggingData      [was: K]
 * @param {Function} layoutFactory   [was: T]  — (slot, meta) => { To, A9 }
 * @returns {Array|Error} two-slot array or Error
 */
export function createSurveySlotPair(builderCtx, placementConfig, contentCpn, durationMs, loggingData, layoutFactory) { // was: Uen
  const playerBytesSlotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_PLAYER_BYTES'); // was: r
  const inPlayerSlotId = generateSlotId(builderCtx.O.get(), 'SLOT_TYPE_IN_PLAYER'); // was: U
  const surveyLayoutId = generateLayoutId(builderCtx.O.get(), 'LAYOUT_TYPE_SURVEY', inPlayerSlotId); // was: I

  const entryTrigger = buildTimeRangeEntryTrigger(builderCtx, placementConfig, contentCpn, durationMs); // was: S5
  const fulfillmentTriggers = [new SlotIdEnteredTrigger(builderCtx.W, playerBytesSlotId)]; // was: X
  const expirationTriggers = [ // was: W (reassigned)
    new SlotIdExitedTrigger(builderCtx.W, playerBytesSlotId),
    new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn),
    new CloseRequestedTrigger(builderCtx.W, surveyLayoutId),
  ];

  if (entryTrigger instanceof z) return entryTrigger;

  const { To: mediaBreakLayout, A9: overlayLayout } = layoutFactory({
    slotId: playerBytesSlotId,
    slotType: 'SLOT_TYPE_PLAYER_BYTES',
    slotPhysicalPosition: 1,
    G2: 'core',
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
  }, {
    slotId: inPlayerSlotId,
    layoutId: surveyLayoutId,
  });

  return [{
    slotId: playerBytesSlotId,
    slotType: 'SLOT_TYPE_PLAYER_BYTES',
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection([
      new FulfilledLayoutMetadata(mediaBreakLayout),
      new PlayerBytesSlotMetadata({ updateSeekBarAria: builderCtx.updateSeekBarAria(placementConfig) }), // was: new LC()
    ]),
    adSlotLoggingData: loggingData,
  }, overlayLayout];
}

/**
 * Core in-player slot creator with layout-entered trigger.
 *
 * [was: kUy]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {string}  slotId           [was: c]
 * @param {string}  entryLayoutId    [was: W]
 * @param {string}  contentCpn       [was: m]
 * @param {Function} layoutFactory   [was: K]
 * @returns {object} slot descriptor
 */
export function createInPlayerSlotWithLayoutEntry(builderCtx, slotId, entryLayoutId, contentCpn, layoutFactory) { // was: kUy
  const entryTrigger = new LayoutIdEnteredTrigger(builderCtx.W, entryLayoutId); // was: T
  const fulfillmentTriggers = [new SlotIdEnteredTrigger(builderCtx.W, slotId)]; // was: r
  const expirationTriggers = [new SlotIdExitedTrigger(builderCtx.W, slotId), new OnNewPlaybackAfterContentVideoIdTrigger(builderCtx.W, contentCpn)]; // was: Q (reassigned)

  return {
    slotId,
    slotType: 'SLOT_TYPE_IN_PLAYER',
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(layoutFactory({
      slotId,
      slotType: 'SLOT_TYPE_IN_PLAYER',
      slotPhysicalPosition: 1,
      G2: 'core',
      slotEntryTrigger: entryTrigger,
      slotFulfillmentTriggers: fulfillmentTriggers,
      slotExpirationTriggers: expirationTriggers,
    }, entryLayoutId))]),
    adSlotLoggingData: undefined,
  };
}

// ---------------------------------------------------------------------------
// Slot Entry Trigger Factories  [was: S5, Y3W, o1n]  (lines ~27922–27992)
// ---------------------------------------------------------------------------

/**
 * Builds a time-range entry trigger using the standard vE constructor.
 *
 * [was: S5]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {object}  placementConfig  [was: c]
 * @param {string}  contentCpn       [was: W]
 * @param {number}  durationMs       [was: m]
 * @returns {object|Error} trigger or Error
 */
export function buildTimeRangeEntryTrigger(builderCtx, placementConfig, contentCpn, durationMs) { // was: S5
  return buildEntryTrigger(builderCtx, placementConfig, contentCpn, durationMs,
    (range, visible) => new MediaTimeRangeTrigger(builderCtx.W, contentCpn, range, visible)
  );
}

/**
 * Builds a time-range entry trigger with a banner overlay variant (rbX).
 *
 * [was: Y3W]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {object}  placementConfig  [was: c]
 * @param {string}  contentCpn       [was: W]
 * @param {number}  durationMs       [was: m]
 * @param {string}  layoutId         [was: K]
 * @returns {object|Error} trigger or Error
 */
export function buildBannerEntryTrigger(builderCtx, placementConfig, contentCpn, durationMs, layoutId) { // was: Y3W
  return buildEntryTrigger(builderCtx, placementConfig, contentCpn, durationMs,
    (range, visible) => new MediaTimeRangeReactivationTrigger(builderCtx.W, contentCpn, range, visible, layoutId)
  );
}

/**
 * Core entry trigger factory. Dispatches by ad placement kind:
 *  - AD_PLACEMENT_KIND_START -> sz (content-start trigger)
 *  - AD_PLACEMENT_KIND_MILLISECONDS -> time-range trigger via factory
 *  - AD_PLACEMENT_KIND_END -> aG (content-end trigger)
 *
 * [was: o1n]
 *
 * @param {object}  builderCtx       [was: Q]
 * @param {object}  placementConfig  [was: c]
 * @param {string}  contentCpn       [was: W]
 * @param {number}  durationMs       [was: m]
 * @param {Function} triggerFactory  [was: K]  — (range, visible) => trigger
 * @returns {object|Error} trigger or Error
 */
export function buildEntryTrigger(builderCtx, placementConfig, contentCpn, durationMs, triggerFactory) { // was: o1n
  const showMarker = !placementConfig.hideCueRangeMarker; // was: T

  switch (placementConfig.kind) {
    case 'AD_PLACEMENT_KIND_START':
      return new BeforeContentVideoIdStartedTrigger(builderCtx.W, contentCpn);
    case 'AD_PLACEMENT_KIND_MILLISECONDS': {
      const range = convertPlacementToRange(placementConfig, durationMs); // was: cE0
      if (range instanceof z) return range;
      return triggerFactory(range.uj, showMarker);
    }
    case 'AD_PLACEMENT_KIND_END':
      return new ContentVideoIdEndedTrigger(builderCtx.W, contentCpn, showMarker);
    default:
      return new z('Cannot construct entry trigger', {
        kind: placementConfig.kind,
      });
  }
}

// ---------------------------------------------------------------------------
// Base Slot Creator  [was: Nr]  (line ~27930)
// ---------------------------------------------------------------------------

/**
 * Generic slot creation helper with a fulfilled layout from the factory.
 *
 * [was: Nr]
 *
 * @param {object}  builderCtx          [was: Q]
 * @param {string}  slotId              [was: c]
 * @param {string}  slotType            [was: W]
 * @param {object}  entryTrigger        [was: m]
 * @param {Array}   expirationTriggers  [was: K]
 * @param {*}       loggingData         [was: T]
 * @param {Function} layoutFactory      [was: r]
 * @returns {object} slot descriptor
 */
export function createSlotWithFulfillment(builderCtx, slotId, slotType, entryTrigger, expirationTriggers, loggingData, layoutFactory) { // was: Nr
  const fulfillmentTriggers = [new forwardPlayback(builderCtx.W, slotId)]; // was: Q (reassigned)

  return {
    slotId,
    slotType,
    slotPhysicalPosition: 1,
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
    G2: 'core',
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(layoutFactory({
      slotId,
      slotType,
      slotPhysicalPosition: 1,
      G2: 'core',
      slotEntryTrigger: entryTrigger,
      slotFulfillmentTriggers: fulfillmentTriggers,
      slotExpirationTriggers: expirationTriggers,
    }))]),
    adSlotLoggingData: loggingData,
  };
}

// ---------------------------------------------------------------------------
// Logging Data Association  [was: Mw, KQ]  (lines ~27994–27999)
// ---------------------------------------------------------------------------

/**
 * Fires a slot-level ad event with logging data.
 *
 * [was: Mw]
 *
 * @param {object}  eventRouter   [was: Q]
 * @param {string}  eventType     [was: c]
 * @param {object}  slot          [was: W]
 */
export function fireSlotAdEvent(eventRouter, eventType, slot) { // was: Mw
  eventRouter.W(eventType, undefined, undefined, undefined, slot, undefined, undefined, undefined, slot.adSlotLoggingData);
}

/**
 * Fires an error-level ad event with slot and layout logging data.
 *
 * [was: KQ]
 *
 * @param {object}  eventRouter   [was: Q]
 * @param {string}  eventType     [was: c]  — always "ADS_CLIENT_EVENT_TYPE_ERROR"
 * @param {*}       errorInfo     [was: W]
 * @param {object}  slot          [was: m]
 * @param {object}  layout        [was: K]  — optional
 */
export function fireErrorAdEvent(eventRouter, eventType, errorInfo, slot, layout) { // was: KQ
  eventRouter.W(
    'ADS_CLIENT_EVENT_TYPE_ERROR', undefined, undefined, undefined,
    slot, layout, undefined, undefined,
    slot.adSlotLoggingData,
    layout ? layout.adLayoutLoggingData : undefined,
    // ... (continues with additional error context in source)
  );
}
