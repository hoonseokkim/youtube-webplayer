/**
 * DAI (Dynamic Ad Insertion) Media Layout Rendering
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~25003–26005
 *
 * Handles:
 *  - DAI media layout rendering (PlayerBytesAdLayoutRenderer)
 *  - Media rendering content validation
 *  - Video length calculations and segment timing
 *  - Drift recovery configuration
 *  - Sequential layout composition (ad intros, endcaps, surveys)
 *  - VOD media renderer validation and player variable extraction
 *  - Ad pod info and skip-target metadata propagation
 *  - Trigger conversion for slot entry / fulfillment / expiration
 *  - Layout exit trigger sets (normal, skip, mute, user-input, cancel)
 *  - Ping extraction from rendering content
 *  - Ad placement kind mapping from slot trigger events
 */

import { forEach } from '../core/event-registration.js';  // was: g.mfm
import { getProperty, instreamAdPlayerOverlayRenderer, instreamVideoAdRenderer, playerOverlayLayoutRenderer } from '../core/misc-helpers.js';  // was: g.l, g.Re, g.Tu, g.kA
import { generateTriggerId, isNotNullish } from './slot-id-generator.js';  // was: g.Jq, g.j23
import { clearStateBits } from '../media/source-buffer.js'; // was: Vv
import { getStoredDisplaySettings } from '../modules/caption/caption-settings.js'; // was: NC
import { AdPodInfo } from './ad-layout-renderer.js'; // was: rP
import { QUARTILE_EVENTS } from '../proto/message-defs.js'; // was: EN
import { createAdClientDataFactory } from '../network/uri-utils.js'; // was: $O
import { delayedResolve } from '../core/event-registration.js'; // was: HJ
import { playerBytesSequentialLayout } from '../core/misc-helpers.js'; // was: m0
import { adIntroRenderer } from '../core/misc-helpers.js'; // was: oG
import { adActionInterstitialRenderer } from '../core/misc-helpers.js'; // was: YA
import { MESSAGE_SENTINEL } from '../proto/messages-core.js'; // was: m4
import { AdNextParamsMetadata } from './ad-interaction.js'; // was: lx
import { AdVideoClickthroughMetadata } from './ad-interaction.js'; // was: ux
import { inPlayerAdLayout } from '../core/misc-helpers.js'; // was: v3y
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { LayoutIdEnteredTrigger } from './ad-trigger-types.js'; // was: Gu
import { SlotIdEnteredTrigger } from './ad-trigger-types.js'; // was: gR
import { SlotIdExitedTrigger } from './ad-trigger-types.js'; // was: Ez
import { OnNewPlaybackAfterContentVideoIdTrigger } from './ad-trigger-types.js'; // was: Zi
import { LayoutIdExitedTrigger } from './ad-trigger-types.js'; // was: Lz
import { playerUnderlayAdLayout } from '../core/misc-helpers.js'; // was: xb
import { squeezebackSidePanel } from '../core/misc-helpers.js'; // was: Vy
import { updateProgressBar } from '../ui/progress-bar-impl.js'; // was: rd
import { MetadataCollection } from './ad-triggers.js';
import { concat, filter } from '../core/array-utils.js';

// ---------------------------------------------------------------------------
// DAI Media Layout Renderer  [was: X8x]  (line ~25003)
// ---------------------------------------------------------------------------

/**
 * Creates a DAI media layout from a PlayerBytesAdLayoutRenderer.
 *
 * Validates rendering content, computes segment timing from video length,
 * builds client metadata (including drift recovery), and associates
 * an in-player slot.
 *
 * [was: X8x]
 *
 * @param {object}  slotCreator           - slot creation context           [was: Q]
 * @param {object}  adPlacementConfig     - ad placement configuration      [was: c]
 * @param {object}  layoutRenderer        - PlayerBytesAdLayoutRenderer     [was: W]
 * @param {object}  exitTriggers          - layout exit trigger sets        [was: m]
 * @param {object}  adPodTracker          - ad pod sequence tracker         [was: K]
 * @param {object}  triggerIdGenerator    - trigger ID generator            [was: T]
 * @param {Array}   inPlayerSlots         - available in-player slot defs   [was: r]
 * @param {object}  adStateHelper         - ad state helper                 [was: U]
 * @param {number}  segmentStartMs        - segment start in milliseconds   [was: I]
 * @param {number}  totalDurationMs       - total content duration in ms    [was: X]
 * @param {object}  featureFlags          - feature flag set                [was: A]
 * @returns {object|Error} layout+slot pair or Error
 */
export function createDaiMediaLayout( // was: X8x
  slotCreator, adPlacementConfig, layoutRenderer, exitTriggers,
  adPodTracker, triggerIdGenerator, inPlayerSlots, adStateHelper,
  segmentStartMs, totalDurationMs, featureFlags
) {
  if (!isValidLayoutRenderer(layoutRenderer)) // was: IG(W)
    return new z('Invalid PlayerBytesAdLayoutRenderer');

  const pingMap = extractPingMap(layoutRenderer); // was: gP(W)
  if (pingMap instanceof z)
    return pingMap;

  const layoutIdentity = { // was: V
    layoutId: layoutRenderer.adLayoutMetadata.layoutId,
    layoutType: layoutRenderer.adLayoutMetadata.layoutType,
    G2: 'core',
  };

  let mediaContent = getProperty(layoutRenderer.renderingContent, instreamVideoAdRenderer); // was: B
  if (!mediaContent)
    return new z('Invalid rendering content for DAI media layout');

  mediaContent = extractMediaContent(mediaContent); // was: oL(B)

  const segmentInfo = { // was: I (reassigned)
    clearStateBits: mediaContent, // was: Vv — media content descriptor
    f3: 0, // was: f3 — segment index (always 0 for single DAI)
    getStoredDisplaySettings: segmentStartMs, // was: NC — segment start ms
    Mx: Math.min(segmentStartMs + mediaContent.videoLengthSeconds * 1000, totalDurationMs), // was: Mx — segment end ms
    QUARTILE_EVENTS: new AdPodInfo(0, [mediaContent.videoLengthSeconds]), // was: EN — ad pod info
  };

  const clientMetadataItems = buildDaiClientMetadata( // was: VL_(c, W, I, K, …)
    adPlacementConfig, layoutRenderer, segmentInfo, adPodTracker,
    Number(layoutRenderer.driftRecoveryMs) ?? undefined, featureFlags
  );
  if (clientMetadataItems instanceof z)
    return clientMetadataItems;

  const layout = { // was: Q (reassigned)
    ...layoutIdentity,
    ...exitTriggers,
    zy: pingMap,
    renderingContent: layoutRenderer.renderingContent,
    clientMetadata: new MetadataCollection(clientMetadataItems),
    Je: createAdClientDataFactory(triggerIdGenerator, slotCreator)(layoutIdentity),
    adLayoutLoggingData: layoutRenderer.adLayoutMetadata.adLayoutLoggingData,
  };

  const associatedSlot = buildAssociatedInPlayerSlot( // was: fC(r, Q, K, U, T, void 0, !0)
    inPlayerSlots, layout, adPodTracker, adStateHelper, triggerIdGenerator,
    undefined, true
  );

  if (!associatedSlot) return new z('Expecting associatedInPlayerSlot');
  if (associatedSlot instanceof z) return associatedSlot;

  return {
    layout,
    delayedResolve: associatedSlot, // was: HJ — associated in-player slot
  };
}

// ---------------------------------------------------------------------------
// Ad Layout Converter (media vs. sequential)  [was: mDK]  (line ~25043)
// ---------------------------------------------------------------------------

/**
 * Converts a PlayerBytesAdLayoutRenderer into a layout + slot array.
 * Branches on whether the rendering content is a single media layout
 * (Tu renderer) or a sequential layout (m0 renderer).
 *
 * [was: mDK]
 *
 * @param {object}  slotCreator       [was: Q]
 * @param {object}  adPlacementCfg    [was: c]
 * @param {object}  layoutRenderer    [was: W]
 * @param {object}  exitTriggers      [was: m]
 * @param {object}  vodConfig         [was: K]
 * @param {Array}   adPlacements      [was: T]
 * @param {object}  daiConfig         [was: r]
 * @param {object}  adStateHelper     [was: U]
 * @param {object}  vodSegmentData    [was: I]
 * @param {object}  remoteSlotsMap    [was: X]
 * @param {object}  featureFlags      [was: A]
 * @param {object}  experimentFlags   [was: e]
 * @param {Array}   inPlayerSlots     [was: V]
 * @param {object}  adBreakConfig     [was: B]
 * @param {Array}   sdsSlotsData      [was: n]
 * @returns {object|Error} { layout, rH } or Error
 */
export function convertAdLayout( // was: mDK
  slotCreator, adPlacementCfg, layoutRenderer, exitTriggers,
  vodConfig, adPlacements, daiConfig, adStateHelper, vodSegmentData,
  remoteSlotsMap, featureFlags, experimentFlags, inPlayerSlots,
  adBreakConfig, sdsSlotsData
) {
  const triggerSets = parseLayoutExitTriggers(layoutRenderer, adPlacements, vodConfig.pw); // was: wP(W, T, K.pw)
  if (triggerSets instanceof z)
    return triggerSets;

  if (getProperty(layoutRenderer.renderingContent, instreamVideoAdRenderer)) {
    const vodMediaInfos = buildVodMediaInfoArray([layoutRenderer], vodConfig, vodSegmentData); // was: qM_
    if (vodMediaInfos instanceof z)
      return vodMediaInfos;
    if (vodMediaInfos.length !== 1)
      return new z('Only expected one media layout.');

    const result = buildMediaLayoutWithSlot( // was: ns7
      slotCreator, adPlacementCfg, layoutRenderer, triggerSets,
      vodMediaInfos[0], undefined, 'core', exitTriggers, adPlacements,
      daiConfig, adStateHelper, remoteSlotsMap, inPlayerSlots,
      adBreakConfig, vodConfig.pw, undefined, sdsSlotsData
    );
    return result instanceof z ? result : {
      layout: result.layout,
      rH: result.delayedResolve ? [result.delayedResolve] : [],
    };
  }

  let sequentialContent = getProperty(layoutRenderer.renderingContent, playerBytesSequentialLayout); // was: d
  if (sequentialContent) {
    if (!hasValidAdLayoutMetadata(layoutRenderer.adLayoutMetadata)) // was: hS
      return new z('Invalid ad layout metadata');
    if (!isValidSequentialLayout(sequentialContent)) // was: Kz
      return new z('Invalid sequential layout');

    sequentialContent = sequentialContent.sequentialLayouts.map(
      entry => entry.playerBytesAdLayoutRenderer // was: b => b.playerBytesAdLayoutRenderer
    );

    const result = buildSequentialLayout( // was: DD3
      slotCreator, adPlacementCfg, layoutRenderer.adLayoutMetadata,
      triggerSets, sequentialContent, exitTriggers, adPlacements,
      vodConfig, vodSegmentData, daiConfig, adStateHelper,
      remoteSlotsMap, featureFlags, experimentFlags, inPlayerSlots,
      adBreakConfig, sdsSlotsData
    );
    return result instanceof z ? result : {
      layout: result.Z9,
      rH: result.rH,
    };
  }

  return new z('Not able to convert a sequential layout');
}

// ---------------------------------------------------------------------------
// Sequential Layout Builder  [was: DD3]  (line ~25075)
// ---------------------------------------------------------------------------

/**
 * Builds a sequential (composite) layout from an array of sub-renderers.
 * Iterates each sequential layout entry: media (Tu), ad-intro (oG),
 * or endcap (YA), accumulating child layouts and in-player slots.
 *
 * [was: DD3]
 *
 * @param {object}  slotCreator       [was: Q]
 * @param {object}  adPlacementCfg    [was: c]
 * @param {object}  adLayoutMetadata  [was: W]
 * @param {object}  triggerSets       [was: m]
 * @param {Array}   childRenderers    [was: K]
 * @param {object}  exitTriggers      [was: T]
 * @param {Array}   adPlacements      [was: r]
 * @param {object}  vodConfig         [was: U]
 * @param {object}  vodSegmentData    [was: I]
 * @param {object}  daiConfig         [was: X]
 * @param {object}  adStateHelper     [was: A]
 * @param {object}  remoteSlotsMap    [was: e]
 * @param {object}  featureFlags      [was: V]
 * @param {object}  experimentFlags   [was: B]
 * @param {Array}   inPlayerSlots     [was: n]
 * @param {object}  adBreakConfig     [was: S]
 * @param {Array}   sdsSlotsData      [was: d]
 * @returns {object|Error} { Z9: compositeLayout, rH: inPlayerSlots }
 */
export function buildSequentialLayout( // was: DD3
  slotCreator, adPlacementCfg, adLayoutMetadata, triggerSets,
  childRenderers, exitTriggers, adPlacements, vodConfig, vodSegmentData,
  daiConfig, adStateHelper, remoteSlotsMap, featureFlags, experimentFlags,
  inPlayerSlots, adBreakConfig, sdsSlotsData
) {
  const skipTargetRef = new vc({ current: null }); // was: b
  const vodMediaInfos = buildVodMediaInfoArray(childRenderers, vodConfig, vodSegmentData); // was: w = qM_(K, U, I)
  if (vodMediaInfos instanceof z)
    return vodMediaInfos;

  const childLayouts = []; // was: I (reassigned)
  const collectedSlots = []; // was: f
  let lastVodMedia = undefined; // was: G

  for (let idx = 0; idx < childRenderers.length; idx++) { // was: $x
    const childRenderer = childRenderers[idx]; // was: T7

    // ----- Media content (Tu) -----
    if (getProperty(childRenderer.renderingContent, instreamVideoAdRenderer)) {
      lastVodMedia = isFeatureAvailable(featureFlags) && isFeatureEnabled(featureFlags) // was: aL(V) && Gv(V)
        ? vodMediaInfos[idx + 1]
        : undefined;

      const mediaResult = buildMediaLayoutWithSlot( // was: ns7
        slotCreator, adPlacementCfg, childRenderer, Ot,
        vodMediaInfos[idx], lastVodMedia, 'adapter', exitTriggers,
        adPlacements, daiConfig, adStateHelper, remoteSlotsMap,
        inPlayerSlots, adBreakConfig, vodConfig.pw, skipTargetRef, sdsSlotsData
      );
      if (mediaResult instanceof z)
        return mediaResult;

      childLayouts.push(mediaResult.layout);
      if (mediaResult.delayedResolve) collectedSlots.push(mediaResult.delayedResolve);
      lastVodMedia = vodMediaInfos[idx];
      continue;
    }

    // ----- Ad intro renderer (oG) -----
    if (getProperty(childRenderer.renderingContent, adIntroRenderer)) {
      let introLayout; // was: oW
      if (!isValidLayoutRenderer(childRenderer)) { // was: IG(T7)
        introLayout = new z('Invalid PlayerBytesAdLayoutRenderer');
      } else {
        let introRenderer = getProperty(childRenderer.renderingContent, adIntroRenderer); // was: yn
        if (!introRenderer || introRenderer.playerVars === undefined) {
          introLayout = new z('Invalid ad intro renderer');
        } else {
          const introIdentity = { // was: z7
            layoutId: childRenderer.adLayoutMetadata.layoutId,
            layoutType: childRenderer.adLayoutMetadata.layoutType,
            G2: 'adapter',
          };
          const playerVars = parsePlayerVars(introRenderer.playerVars); // was: bk(yn.playerVars)
          playerVars.autoplay = '1';

          introLayout = {
            ...introIdentity,
            ...Ot,
            renderingContent: childRenderer.renderingContent,
            clientMetadata: new MetadataCollection([
              new tLw(),
              new kb({ kind: 'AD_PLACEMENT_KIND_START' }),
              new tq({ current: null }),
              new PlayerVarsMetadata(playerVars),
            ]),
            zy: new Map(),
            Je: createAdClientDataFactory(adStateHelper, slotCreator)(introIdentity),
            adLayoutLoggingData: childRenderer.adLayoutMetadata.adLayoutLoggingData,
          };
        }
      }

      if (introLayout instanceof z)
        return introLayout;
      childLayouts.push(introLayout);
      continue;
    }

    // ----- Endcap renderer (YA) -----
    if (getProperty(childRenderer.renderingContent, adActionInterstitialRenderer)) {
      if (adBreakConfig) {
        const endcapLayout = buildEndcapLayout( // was: Hg3
          slotCreator, childRenderer, adStateHelper,
          getAdPlacementConfig(adPlacementCfg), lastVodMedia // was: bx(c)
        );
        if (endcapLayout instanceof z)
          return endcapLayout;

        childLayouts.push(endcapLayout);
        const endcapSlot = buildAssociatedInPlayerSlot( // was: fC
          inPlayerSlots, endcapLayout, adPlacements, vodConfig.pw,
          adStateHelper, skipTargetRef, false
        );
        if (endcapSlot instanceof z)
          return endcapSlot;
        if (endcapSlot)
          collectedSlots.push(endcapSlot);
        else
          return new z('Not able to retrieve InPlayer slot for endcap');
      } else {
        // Find associated in-player slot from ad placements
        let endcapAssociation; // was: oW
        findAssociation: {
          for (const placement of exitTriggers) { // was: z7 of T
            let linearAds = placement.renderer?.linearAdSequenceRenderer?.linearAds || []; // was: oW
            for (const linearAd of linearAds) { // was: wT
              const endcapRef = getProperty(linearAd, adActionInterstitialRenderer); // was: oW
              if (endcapRef
                && endcapRef.inPlayerSlotId !== undefined
                && endcapRef.inPlayerLayoutId !== undefined
                && endcapRef.associatedPlayerBytesLayoutId !== undefined
                && endcapRef.associatedPlayerBytesLayoutId === childRenderer.adLayoutMetadata.layoutId
              ) {
                endcapAssociation = {
                  tv: endcapRef,
                  adPlacementConfig: placement.config.adPlacementConfig,
                };
                break findAssociation;
              }
            }
          }
          endcapAssociation = new z('Not able to find associated InPlayer slot for endcap');
        }

        if (endcapAssociation instanceof z)
          return endcapAssociation;

        const endcapLayout = buildEndcapLayout( // was: Hg3
          slotCreator, childRenderer, adStateHelper,
          endcapAssociation.adPlacementConfig, lastVodMedia
        );
        if (endcapLayout instanceof z)
          return endcapLayout;

        childLayouts.push(endcapLayout);
        const endcapSlot = buildEndcapInPlayerSlot( // was: NlK
          endcapLayout.layoutId, experimentFlags, adPlacements,
          endcapAssociation, skipTargetRef, adStateHelper
        );
        if (endcapSlot instanceof z)
          return endcapSlot;
        collectedSlots.push(endcapSlot);
      }
    }
  }

  // Build the composite sequential layout
  const compositeIdentity = { // was: c (reassigned)
    layoutId: adLayoutMetadata.layoutId,
    layoutType: adLayoutMetadata.layoutType,
    G2: 'core',
  };

  return {
    Z9: { // was: Z9 — composite layout
      ...compositeIdentity,
      ...triggerSets,
      lj: childLayouts, // was: lj — child layouts array
      zy: new Map(),
      clientMetadata: new MetadataCollection([skipTargetRef]),
      Je: createAdClientDataFactory(adStateHelper, slotCreator)(compositeIdentity),
    },
    rH: collectedSlots,
  };
}

// ---------------------------------------------------------------------------
// Media Layout with Slot  [was: ns7]  (line ~25190)
// ---------------------------------------------------------------------------

/**
 * Builds a media layout with full client metadata for a VOD ad.
 * Resolves the in-player overlay slot (instreamAdPlayerOverlay or
 * playerOverlayLayout), attaches ad commands, pings, skip targets,
 * and optionally links an in-player slot.
 *
 * [was: ns7]
 *
 * @param {object}  slotCreator       [was: Q]
 * @param {object}  adPlacementCfg    [was: c]
 * @param {object}  layoutRenderer    [was: W]
 * @param {object}  exitTriggers      [was: m]
 * @param {object}  vodMediaInfo      [was: K]
 * @param {object}  nextVodMediaInfo  [was: T]  — next segment info (for gapless)
 * @param {string}  g2Source          [was: r]  — "core" | "adapter"
 * @param {Array}   adPlacements      [was: U]
 * @param {object}  adPodTracker      [was: I]
 * @param {object}  remoteSlotsMap    [was: X]
 * @param {object}  adStateHelper     [was: A]
 * @param {object}  overlayMap        [was: e]
 * @param {Array}   inPlayerSlots     [was: V]
 * @param {object}  adBreakConfig     [was: B]
 * @param {*}       pw                [was: n]
 * @param {object}  skipTargetRef     [was: S]
 * @param {Array}   sdsSlotsData      [was: d]
 * @returns {object|Error} { layout, HJ? } or Error
 */
export function buildMediaLayoutWithSlot( // was: ns7
  slotCreator, adPlacementCfg, layoutRenderer, exitTriggers,
  vodMediaInfo, nextVodMediaInfo, g2Source, adPlacements, adPodTracker,
  remoteSlotsMap, adStateHelper, overlayMap, inPlayerSlots,
  adBreakConfig, pw, skipTargetRef, sdsSlotsData
) {
  if (!isValidLayoutRenderer(layoutRenderer)) // was: IG(W)
    return new z('Invalid PlayerBytesAdLayoutRenderer');

  const pingMap = extractPingMap(layoutRenderer); // was: gP(W)
  if (pingMap instanceof z)
    return pingMap;

  const layoutIdentity = { // was: r (reassigned)
    layoutId: layoutRenderer.adLayoutMetadata.layoutId,
    layoutType: layoutRenderer.adLayoutMetadata.layoutType,
    G2: g2Source,
  };

  // Build client metadata items from the media renderer
  let metadataItems; // was: T (block-scoped)
  buildMetadata: {
    const layoutId = layoutRenderer.adLayoutMetadata.layoutId; // was: T7
    const mediaRenderer = getProperty(layoutRenderer.renderingContent, instreamVideoAdRenderer); // was: oW

    if (mediaRenderer && isValidVodMediaRenderer(mediaRenderer)) { // was: WE(oW)
      const items = []; // was: w

      if (adBreakConfig || mediaRenderer.isSeekableWithNoAdElements) {
        items.push(new kb(getAdPlacementConfig(adPlacementCfg))); // was: bx(c)
      } else {
        // Find associated in-player overlay from ad placements
        let overlayResult; // was: G
        findOverlay: {
          let placementConfig = layoutId; // was: c (reassigned in block)
          for (let placement of adPlacements) { // was: G of U
            const linearAds = getLinearAdsFromRenderer(placement.renderer) || []; // was: nnR
            for (let linearAd of linearAds) { // was: f of U
              if (linearAd.associatedPlayerBytesLayoutId === placementConfig) {
                // Validate the overlay shim
                let isValid; // was: U (block scoped)
                validateShim: {
                  if (!linearAd.associatedPlayerBytesLayoutId) {
                    isValid = false;
                    break validateShim;
                  }
                  const playerOverlay = linearAd.playerOverlay; // was: U
                  const hasPlayerOverlayLayout = playerOverlay !== undefined
                    && playerOverlay.playerOverlayLayoutRenderer !== undefined
                    && playerOverlay.playerOverlayLayoutRenderer.inPlayerSlotId !== undefined
                    && playerOverlay.playerOverlayLayoutRenderer.inPlayerLayoutId !== undefined;
                  isValid = (playerOverlay !== undefined
                    && playerOverlay.instreamAdPlayerOverlayRenderer !== undefined
                    && playerOverlay.instreamAdPlayerOverlayRenderer.inPlayerSlotId !== undefined
                    && playerOverlay.instreamAdPlayerOverlayRenderer.inPlayerLayoutId !== undefined)
                    || hasPlayerOverlayLayout;
                }

                overlayResult = isValid
                  ? { instreamVideoAdRenderer: linearAd, adPlacementConfig: placement.config.adPlacementConfig }
                  : new z('Invalid InPlayer shim');
                break findOverlay;
              }
            }
          }
          overlayResult = new z('Not able to find associated InPlayer slot');
        }

        if (overlayResult instanceof z) {
          metadataItems = overlayResult;
          break buildMetadata;
        }

        const instreamOverlay = overlayResult.instreamVideoAdRenderer.playerOverlay.instreamAdPlayerOverlayRenderer; // was: f
        const playerOverlayLayout = overlayResult.instreamVideoAdRenderer.playerOverlay.playerOverlayLayoutRenderer; // was: U
        const inPlayerSlotId = instreamOverlay?.inPlayerSlotId ?? playerOverlayLayout?.inPlayerSlotId; // was: c
        const inPlayerLayoutId = instreamOverlay?.inPlayerLayoutId ?? playerOverlayLayout?.inPlayerLayoutId; // was: G7

        if (inPlayerSlotId === undefined) {
          metadataItems = new z('InPlayer shim slot id is undefined');
          break buildMetadata;
        }
        if (inPlayerLayoutId === undefined) {
          metadataItems = new z('InPlayer shim layout id is undefined');
          break buildMetadata;
        }

        items.push(
          new $Y(inPlayerLayoutId),
          new ig7(inPlayerSlotId),
          new ix(vodMediaInfo.QUARTILE_EVENTS.adPodIndex),
          new kb(overlayResult.adPlacementConfig)
        );
        if (instreamOverlay) items.push(new InstreamOverlayRendererMetadata(instreamOverlay));
        if (playerOverlayLayout) items.push(new PlayerOverlayLayoutMetadata(playerOverlayLayout));
      }

      items.push(
        new qZ(vodMediaInfo.QUARTILE_EVENTS),
        new xY(mediaRenderer.externalVideoId),
        new ContentCpnMetadata(adPodTracker),
        new InteractionsProgressMetadata({
          impressionCommands: mediaRenderer.impressionCommands,
          abandonCommands: mediaRenderer.onAbandonCommands,
          completeCommands: mediaRenderer.completeCommands,
          progressCommands: mediaRenderer.adVideoProgressCommands,
        }),
        new PlayerVarsMetadata(vodMediaInfo.MESSAGE_SENTINEL),
        new tq({ current: null }),
        new VideoLengthSecondsMetadata(vodMediaInfo.yb.mN),
        new ActiveViewTrafficTypeMetadata(vR(mediaRenderer.pings)),
        new AdPodSkipIndexMetadata(vodMediaInfo.QUARTILE_EVENTS.adPodIndex)
      );

      if (sdsSlotsData) items.push(new jn(sdsSlotsData));

      const underlaySlot = findPlayerUnderlaySlot(layoutId, inPlayerSlots); // was: yNd(T7, V)
      if (underlaySlot) items.push(new PlayerBytesMediaLayoutMetadata(underlaySlot));

      if (nextVodMediaInfo) items.push(new PlayerBytesCallbackMetadata(nextVodMediaInfo.MESSAGE_SENTINEL));

      if (mediaRenderer.adNextParams) items.push(new AdNextParamsMetadata(mediaRenderer.adNextParams));
      if (mediaRenderer.clickthroughEndpoint) items.push(new AdVideoClickthroughMetadata(mediaRenderer.clickthroughEndpoint));
      if (mediaRenderer.legacyInfoCardVastExtension) items.push(new CompositeLayoutSlotMetadata(mediaRenderer.legacyInfoCardVastExtension));
      if (mediaRenderer.sodarExtensionData) items.push(new SodarExtensionMetadata(mediaRenderer.sodarExtensionData));

      if (skipTargetRef && mediaRenderer.adPodSkipTarget && mediaRenderer.adPodSkipTarget > 0) {
        items.push(skipTargetRef);
        items.push(new hq(mediaRenderer.adPodSkipTarget));
      }

      const remoteSlots = remoteSlotsMap.get(mediaRenderer.externalVideoId); // was: T = X.get(…)
      if (remoteSlots) items.push(new zv(remoteSlots));

      metadataItems = items;
    } else {
      metadataItems = new z('Invalid vod media renderer');
    }
  }

  if (metadataItems instanceof z)
    return metadataItems;

  const layout = { // was: Q (reassigned)
    ...layoutIdentity,
    ...exitTriggers,
    zy: pingMap,
    renderingContent: layoutRenderer.renderingContent,
    clientMetadata: new MetadataCollection(metadataItems),
    Je: createAdClientDataFactory(adStateHelper, slotCreator)(layoutIdentity),
    adLayoutLoggingData: layoutRenderer.adLayoutMetadata.adLayoutLoggingData,
  };

  // Set up the overlay info on the overlay map
  const mediaRenderer = getProperty(layoutRenderer.renderingContent, instreamVideoAdRenderer); // was: W (reassigned)
  if (!mediaRenderer || !isValidVodMediaRenderer(mediaRenderer)) // was: WE(W)
    return new z('Invalid meida renderer'); // (sic — original typo preserved)

  const overlayEntry = initOverlayEntry(overlayMap, mediaRenderer.externalVideoId); // was: pz(e, W.externalVideoId)
  overlayEntry.instreamVideoAdRenderer = mediaRenderer;
  overlayEntry.lV = 'AD_PLACEMENT_KIND_START';

  if (adBreakConfig) {
    const inPlayerSlot = buildAssociatedInPlayerSlot( // was: fC
      inPlayerSlots, layout, adPodTracker, pw, adStateHelper, skipTargetRef, false
    );
    if (inPlayerSlot instanceof z) return inPlayerSlot;

    if (findPlayerUnderlaySlot(layout.layoutId, inPlayerSlots) && inPlayerSlot) {
      return {
        layout: {
          ...layout,
          clientMetadata: new MetadataCollection(metadataItems.concat(new Es3(inPlayerSlot))),
        },
      };
    }
    return {
      layout,
      delayedResolve: inPlayerSlot, // was: HJ — associated in-player slot
    };
  }

  return { layout };
}

// ---------------------------------------------------------------------------
// Endcap Layout Builder  [was: Hg3]  (line ~25306)
// ---------------------------------------------------------------------------

/**
 * Builds a layout descriptor for an endcap ad.
 * Extracts duration, abandon/completion commands, skip pings,
 * and ad pod indexing from the YA renderer.
 *
 * [was: Hg3]
 *
 * @param {object}  slotCreator       [was: Q]
 * @param {object}  layoutRenderer    [was: c]
 * @param {object}  adStateHelper     [was: W]
 * @param {object}  adPlacementCfg    [was: m]
 * @param {object}  prevVodMediaInfo  [was: K]  — previous segment for pod indexing
 * @returns {object|Error} endcap layout or Error
 */
export function buildEndcapLayout( // was: Hg3
  slotCreator, layoutRenderer, adStateHelper, adPlacementCfg, prevVodMediaInfo
) {
  if (!isValidLayoutRenderer(layoutRenderer)) // was: IG(c)
    return new z('Invalid PlayerBytesAdLayoutRenderer');

  const endcapRenderer = getProperty(layoutRenderer.renderingContent, adActionInterstitialRenderer); // was: T
  if (!endcapRenderer || endcapRenderer.durationMilliseconds === undefined)
    return new z('Invalid endcap renderer');

  const layoutIdentity = { // was: r
    layoutId: layoutRenderer.adLayoutMetadata.layoutId,
    layoutType: layoutRenderer.adLayoutMetadata.layoutType,
    G2: 'adapter',
  };

  const metadataItems = [ // was: m (reassigned)
    new MediaLayoutDurationMetadata(endcapRenderer.durationMilliseconds),
    new InteractionsProgressMetadata({
      impressionCommands: undefined,
      abandonCommands: endcapRenderer.abandonCommands
        ? [{ commandExecutorCommand: endcapRenderer.abandonCommands }]
        : undefined,
      completeCommands: endcapRenderer.completionCommands,
    }),
    new kb(adPlacementCfg),
    new SurveyTriggerMetadata('LAYOUT_TYPE_ENDCAP'),
  ];

  if (prevVodMediaInfo) {
    metadataItems.push(new AdPodSkipIndexMetadata(prevVodMediaInfo.QUARTILE_EVENTS.adPodIndex - 1));
    metadataItems.push(new ix(prevVodMediaInfo.QUARTILE_EVENTS.adPodIndex));
    metadataItems.push(new hq(prevVodMediaInfo.adPodSkipTarget ?? -1));
  }

  return {
    ...layoutIdentity,
    ...Ot,
    renderingContent: layoutRenderer.renderingContent,
    clientMetadata: new MetadataCollection(metadataItems),
    zy: endcapRenderer.skipPings
      ? new Map([['skip', endcapRenderer.skipPings]])
      : new Map(),
    Je: createAdClientDataFactory(adStateHelper, slotCreator)(layoutIdentity),
    adLayoutLoggingData: layoutRenderer.adLayoutMetadata.adLayoutLoggingData,
  };
}

// ---------------------------------------------------------------------------
// Associated In-Player Slot Builder  [was: fC]  (line ~25338)
// ---------------------------------------------------------------------------

/**
 * Finds and builds the in-player slot associated with a given layout.
 * Filters in-player slot definitions by slotType + triggeringSourceLayoutId,
 * converts triggers, and creates the fulfilled overlay layout.
 *
 * [was: fC]
 *
 * @param {Array}   slotDefs          [was: Q]
 * @param {object}  parentLayout      [was: c]
 * @param {object}  adPodTracker      [was: W]
 * @param {*}       pw                [was: m]
 * @param {object}  triggerIdGen      [was: K]
 * @param {object}  skipTargetRef     [was: T]
 * @param {boolean} isDaiMedia        [was: r]
 * @returns {object|undefined|Error} slot or undefined or Error
 */
export function buildAssociatedInPlayerSlot( // was: fC
  slotDefs, parentLayout, adPodTracker, pw, triggerIdGen, skipTargetRef, isDaiMedia
) {
  const matchingDefs = slotDefs.filter(
    entry => entry.adSlotMetadata.slotType === 'SLOT_TYPE_IN_PLAYER'
      && entry.adSlotMetadata.triggeringSourceLayoutId === parentLayout.layoutId
  );

  if (matchingDefs.length === 0) return undefined;
  if (matchingDefs.length !== 1)
    return new z('Invalid InPlayer slot association for the given PlayerBytes layout');

  const slotDef = matchingDefs[0]; // was: U
  const convertedTriggers = convertSlotTriggers(slotDef, adPodTracker, pw); // was: cN7
  if (convertedTriggers instanceof z)
    return convertedTriggers;

  const slotDescriptor = { // was: Q (reassigned)
    slotId: slotDef.adSlotMetadata.slotId,
    slotType: slotDef.adSlotMetadata.slotType,
    slotPhysicalPosition: slotDef.adSlotMetadata.slotPhysicalPosition ?? 1,
    G2: 'core',
    slotEntryTrigger: convertedTriggers.slotEntryTrigger,
    slotFulfillmentTriggers: convertedTriggers.slotFulfillmentTriggers,
    slotExpirationTriggers: convertedTriggers.slotExpirationTriggers,
  };

  const fulfilledRenderer = getProperty(slotDef.fulfillmentContent.fulfilledLayout, inPlayerAdLayout); // was: I
  if (!fulfilledRenderer || !isValidInPlayerRenderer(fulfilledRenderer)) // was: sx0
    return new z('Invalid InPlayerAdLayoutRenderer');

  const overlayIdentity = { // was: X
    layoutId: fulfilledRenderer.adLayoutMetadata.layoutId,
    layoutType: fulfilledRenderer.adLayoutMetadata.layoutType,
    G2: 'core',
  };

  const overlayExitTriggers = parseLayoutExitTriggers(fulfilledRenderer, adPodTracker, pw); // was: wP
  if (overlayExitTriggers instanceof z)
    return overlayExitTriggers;

  const metadataItems = []; // was: m (reassigned)
  const overlayLayoutType = fulfilledRenderer.adLayoutMetadata.layoutType; // was: A

  if (isDaiMedia) metadataItems.push(new AdBreakRequestMetadata()); // was: r && m.push(new Hc)

  if (overlayLayoutType === 'LAYOUT_TYPE_MEDIA_LAYOUT_PLAYER_OVERLAY') {
    metadataItems.push(...buildOverlayMetadata(slotDef.adSlotMetadata.triggerEvent, parentLayout)); // was: sCK
    const linkedTrigger = findLinkedExitTrigger(overlayExitTriggers, parentLayout.layoutId); // was: dD7
    if (linkedTrigger) metadataItems.push(new LWx(linkedTrigger));
  } else if (overlayLayoutType === 'LAYOUT_TYPE_ENDCAP'
    || overlayLayoutType === 'LAYOUT_TYPE_VIDEO_INTERSTITIAL_CENTERED') {
    metadataItems.push(new kb(getAdPlacementConfig(slotDef.adSlotMetadata.triggerEvent))); // was: bx
    if (overlayLayoutType === 'LAYOUT_TYPE_VIDEO_INTERSTITIAL_CENTERED')
      return new z('Cannot parse endcap layout since AdUxReadyApi is not provided');
    if (skipTargetRef) metadataItems.push(skipTargetRef);
  } else {
    return new z('Not able to parse an SDF InPlayer layout');
  }

  const overlayLayout = { // was: K (reassigned)
    ...overlayIdentity,
    ...overlayExitTriggers,
    renderingContent: fulfilledRenderer.renderingContent,
    zy: new Map(),
    Je: createAdClientDataFactory(triggerIdGen, slotDescriptor)(overlayIdentity),
    clientMetadata: new MetadataCollection(metadataItems),
    adLayoutLoggingData: fulfilledRenderer.adLayoutMetadata.adLayoutLoggingData,
  };

  return {
    ...slotDescriptor,
    fulfilledLayout: overlayLayout,
    clientMetadata: new MetadataCollection([]),
  };
}

// ---------------------------------------------------------------------------
// Overlay Metadata Builder  [was: sCK]  (line ~25397)
// ---------------------------------------------------------------------------

/**
 * Collects client metadata items for an overlay layout from its parent layout.
 * Propagates callback refs, skip targets, remote slot data, ad-next params,
 * clickthrough endpoints, and ad pod info.
 *
 * [was: sCK]
 *
 * @param {string}  triggerEvent   - slot trigger event type   [was: Q]
 * @param {object}  parentLayout   - parent media layout       [was: c]
 * @returns {Array} metadata items
 */
export function buildOverlayMetadata(triggerEvent, parentLayout) { // was: sCK
  const items = []; // was: W
  items.push(new kb(getAdPlacementConfig(triggerEvent))); // was: bx(Q)
  items.push(new jn(parentLayout.layoutId));

  let ref; // was: Q (reassigned)
  ref = parentLayout.clientMetadata.readTimecodeScale('metadata_type_player_bytes_callback_ref');
  if (ref) items.push(new tq(ref));

  ref = parentLayout.clientMetadata.readTimecodeScale('metadata_type_ad_pod_skip_target_callback_ref');
  if (ref) items.push(new vc(ref));

  ref = parentLayout.clientMetadata.readTimecodeScale('metadata_type_remote_slots_data');
  if (ref) items.push(new zv(ref));

  ref = parentLayout.clientMetadata.readTimecodeScale('metadata_type_ad_next_params');
  if (ref) items.push(new AdNextParamsMetadata(ref));

  ref = parentLayout.clientMetadata.readTimecodeScale('metadata_type_ad_video_clickthrough_endpoint');
  if (ref) items.push(new AdVideoClickthroughMetadata(ref));

  ref = parentLayout.clientMetadata.readTimecodeScale('metadata_type_ad_pod_info');
  if (ref) items.push(new qZ(ref));

  const videoId = parentLayout.clientMetadata.readTimecodeScale('metadata_type_ad_video_id'); // was: c (reassigned)
  if (videoId) items.push(new xY(videoId));

  return items;
}

// ---------------------------------------------------------------------------
// Endcap In-Player Slot Builder  [was: NlK]  (line ~25411)
// ---------------------------------------------------------------------------

/**
 * Builds an in-player slot specifically for an endcap layout that has
 * a pre-associated inPlayerSlotId and inPlayerLayoutId from the TV renderer.
 *
 * [was: NlK]
 *
 * @param {string}  parentLayoutId    [was: Q]
 * @param {Array}   slotDefs          [was: c]
 * @param {object}  contentCpn        [was: W]
 * @param {object}  endcapAssoc       [was: m]  — { tv, adPlacementConfig }
 * @param {object}  skipTargetRef     [was: K]
 * @param {object}  triggerIdGen      [was: T]
 * @returns {object} slot descriptor with fulfilled endcap layout
 */
export function buildEndcapInPlayerSlot( // was: NlK
  parentLayoutId, slotDefs, contentCpn, endcapAssoc, skipTargetRef, triggerIdGen
) {
  const slotId = endcapAssoc.tv.inPlayerSlotId; // was: r
  const triggerId = triggeredLayoutId => generateTriggerId(slotDefs, triggeredLayoutId); // was: U = X => Jq(c, X)

  const layoutIdentity = { // was: I
    layoutId: endcapAssoc.tv.inPlayerLayoutId,
    layoutType: 'LAYOUT_TYPE_ENDCAP',
    G2: 'core',
  };

  const slotDescriptor = { // was: W (reassigned)
    slotId,
    slotType: 'SLOT_TYPE_IN_PLAYER',
    slotPhysicalPosition: 1,
    G2: 'core',
    slotEntryTrigger: new LayoutIdEnteredTrigger(triggerId, parentLayoutId),
    slotFulfillmentTriggers: [new SlotIdEnteredTrigger(triggerId, slotId)],
    slotExpirationTriggers: [
      new SlotIdExitedTrigger(triggerId, slotId),
      new OnNewPlaybackAfterContentVideoIdTrigger(triggerId, contentCpn),
    ],
  };

  const endcapLayout = { // was: Q (reassigned)
    ...layoutIdentity,
    layoutExitNormalTriggers: [new LayoutIdExitedTrigger(triggerId, parentLayoutId)],
    layoutExitSkipTriggers: [],
    layoutExitMuteTriggers: [],
    layoutExitUserInputSubmittedTriggers: [],
    layoutExitUserCancelledTriggers: [],
    zy: new Map(),
    clientMetadata: new MetadataCollection([
      new w8W(endcapAssoc.tv),
      new kb(endcapAssoc.adPlacementConfig),
      skipTargetRef,
    ]),
    Je: createAdClientDataFactory(triggerIdGen, slotDescriptor)(layoutIdentity),
    adLayoutLoggingData: endcapAssoc.tv.adLayoutLoggingData,
  };

  return {
    ...slotDescriptor,
    clientMetadata: new MetadataCollection([new FulfilledLayoutMetadata(endcapLayout)]),
  };
}

// ---------------------------------------------------------------------------
// Player Underlay Slot Finder  [was: yNd]  (line ~25446)
// ---------------------------------------------------------------------------

/**
 * Searches in-player slot definitions for a SLOT_TYPE_PLAYER_UNDERLAY
 * whose associated layout matches the given layout ID.
 *
 * [was: yNd]
 *
 * @param {string}  layoutId      [was: Q]
 * @param {Array}   slotDefs      [was: c]
 * @returns {object|undefined} the matching underlay slot or undefined
 */
export function findPlayerUnderlaySlot(layoutId, slotDefs) { // was: yNd
  for (const slotDef of slotDefs) {
    if (slotDef.adSlotMetadata.slotType === 'SLOT_TYPE_PLAYER_UNDERLAY') {
      let fulfilledLayout = getProperty(slotDef.fulfillmentContent.fulfilledLayout, playerUnderlayAdLayout);
      if (!fulfilledLayout) continue;
      const underlayRenderer = getProperty(fulfilledLayout.renderingContent, squeezebackSidePanel);
      if (underlayRenderer && underlayRenderer.associatedPlayerBytesLayoutId === layoutId)
        return slotDef;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Slot Trigger Converter  [was: cN7]  (line ~25457)
// ---------------------------------------------------------------------------

/**
 * Converts raw slot trigger definitions (entry, fulfillment, expiration)
 * from the wire format into runtime trigger instances via Jn.
 *
 * [was: cN7]
 *
 * @param {object}  slotDef          [was: Q]
 * @param {object}  adPodTracker     [was: c]
 * @param {*}       pw               [was: W]
 * @returns {object|Error} { slotEntryTrigger, slotFulfillmentTriggers, slotExpirationTriggers }
 */
export function convertSlotTriggers(slotDef, adPodTracker, pw) { // was: cN7
  const entryTrigger = convertTrigger(slotDef.slotEntryTrigger, adPodTracker, pw); // was: Jn
  if (entryTrigger instanceof z)
    return entryTrigger;

  const fulfillmentTriggers = []; // was: K
  for (const rawTrigger of slotDef.slotFulfillmentTriggers) {
    const trigger = convertTrigger(rawTrigger, adPodTracker, pw); // was: Jn
    if (trigger instanceof z)
      return trigger;
    fulfillmentTriggers.push(trigger);
  }

  const expirationTriggers = []; // was: T (reassigned)
  for (const rawTrigger of slotDef.slotExpirationTriggers) {
    const trigger = convertTrigger(rawTrigger, adPodTracker, pw); // was: Jn
    if (trigger instanceof z)
      return trigger;
    expirationTriggers.push(trigger);
  }

  return {
    slotEntryTrigger: entryTrigger,
    slotFulfillmentTriggers: fulfillmentTriggers,
    slotExpirationTriggers: expirationTriggers,
  };
}

// ---------------------------------------------------------------------------
// Layout Exit Triggers Parser  [was: wP]  (line ~25482)
// ---------------------------------------------------------------------------

/**
 * Parses all five categories of layout exit triggers from a layout renderer.
 * Each trigger is converted from wire format via Jn.
 *
 * [was: wP]
 *
 * @param {object}  layoutRenderer    [was: Q]
 * @param {object}  adPodTracker      [was: c]
 * @param {*}       pw                [was: W]
 * @returns {object|Error} trigger sets: { layoutExitNormalTriggers, layoutExitSkipTriggers,
 *   layoutExitMuteTriggers, layoutExitUserInputSubmittedTriggers, layoutExitUserCancelledTriggers }
 */
export function parseLayoutExitTriggers(layoutRenderer, adPodTracker, pw) { // was: wP
  const normalTriggers = []; // was: m
  for (const raw of layoutRenderer.layoutExitNormalTriggers || []) {
    const trigger = convertTrigger(raw, adPodTracker, pw); // was: Jn
    if (trigger instanceof z) return trigger;
    normalTriggers.push(trigger);
  }

  const skipTriggers = []; // was: K
  for (const raw of layoutRenderer.layoutExitSkipTriggers || []) {
    const trigger = convertTrigger(raw, adPodTracker, pw);
    if (trigger instanceof z) return trigger;
    skipTriggers.push(trigger);
  }

  const muteTriggers = []; // was: r
  if ('layoutExitMuteTriggers' in layoutRenderer) {
    for (const raw of layoutRenderer.layoutExitMuteTriggers || []) {
      const trigger = convertTrigger(raw, adPodTracker, pw);
      if (trigger instanceof z) return trigger;
      muteTriggers.push(trigger);
    }
  }

  const userInputTriggers = []; // was: U
  if ('layoutExitUserInputSubmittedTriggers' in layoutRenderer) {
    for (const raw of layoutRenderer.layoutExitUserInputSubmittedTriggers || []) {
      const trigger = convertTrigger(raw, adPodTracker, pw);
      if (trigger instanceof z) return trigger;
      userInputTriggers.push(trigger);
    }
  }

  const cancelTriggers = []; // was: I
  if ('layoutExitUserCancelledTriggers' in layoutRenderer) {
    for (const raw of layoutRenderer.layoutExitUserCancelledTriggers || []) {
      const trigger = convertTrigger(raw, adPodTracker, pw);
      if (trigger instanceof z) return trigger;
      cancelTriggers.push(trigger);
    }
  }

  return {
    layoutExitNormalTriggers: normalTriggers,
    layoutExitSkipTriggers: skipTriggers,
    layoutExitMuteTriggers: muteTriggers,
    layoutExitUserInputSubmittedTriggers: userInputTriggers,
    layoutExitUserCancelledTriggers: cancelTriggers,
  };
}

// ---------------------------------------------------------------------------
// Ping Map Extractor  [was: gP]  (line ~25530)
// ---------------------------------------------------------------------------

/**
 * Extracts the ping tracking map from a layout renderer.
 * If the rendering content is a media renderer (Tu), uses its pings.
 * If it is an endcap (YA), returns skip pings only.
 *
 * [was: gP]
 *
 * @param {object}  layoutRenderer   [was: Q]
 * @returns {Map|Error} ping map or Error
 */
export function extractPingMap(layoutRenderer) { // was: gP
  const mediaRenderer = getProperty(layoutRenderer.renderingContent, instreamVideoAdRenderer);
  if (mediaRenderer?.pings)
    return buildPingMap(mediaRenderer.pings); // was: ae(c.pings)

  const endcapRenderer = getProperty(layoutRenderer.renderingContent, adActionInterstitialRenderer);
  return endcapRenderer?.skipPings
    ? new Map([['skip', endcapRenderer.skipPings]])
    : new Map();
}

// ---------------------------------------------------------------------------
// DAI Client Metadata Builder  [was: VL_]  (line ~25538)
// ---------------------------------------------------------------------------

/**
 * Builds the client metadata array for a DAI media layout.
 * Includes content CPN, video length, impression/abandon/complete commands,
 * player vars, segment bounds, ad pod info, and optional drift recovery.
 *
 * [was: VL_]
 *
 * @param {object}  adPlacementCfg     [was: Q]
 * @param {object}  layoutRenderer     [was: c]
 * @param {object}  segmentInfo        [was: W]
 * @param {object}  adPodTracker       [was: m]
 * @param {number}  driftRecoveryMs    [was: K]
 * @param {object}  featureFlags       [was: T]
 * @returns {Array|Error} metadata items or Error
 */
export function buildDaiClientMetadata( // was: VL_
  adPlacementCfg, layoutRenderer, segmentInfo, adPodTracker, driftRecoveryMs, featureFlags
) {
  const mediaRenderer = getProperty(layoutRenderer.renderingContent, instreamVideoAdRenderer); // was: c (reassigned)
  if (!mediaRenderer)
    return new z('Invalid rendering content for DAI media layout');

  const items = [ // was: Q (reassigned)
    new ContentCpnMetadata(adPodTracker),
    new VideoLengthSecondsMetadata(segmentInfo.clearStateBits.videoLengthSeconds),
    ...(shouldTrackCommands(featureFlags) // was: kY(T)
      ? [new InteractionsProgressMetadata({
          impressionCommands: mediaRenderer.impressionCommands,
          abandonCommands: mediaRenderer.onAbandonCommands,
          completeCommands: mediaRenderer.completeCommands,
          progressCommands: mediaRenderer.adVideoProgressCommands,
        })]
      : []),
    new PlayerVarsMetadata(segmentInfo.clearStateBits.playerVars),
    new SlotEntryTriggerMetadata(segmentInfo.getStoredDisplaySettings), // was: Aq — segment start ms
    new en(segmentInfo.Mx), // was: en — segment end ms
    new ix(segmentInfo.f3), // was: ix — segment index
    new kb(getAdPlacementConfig(adPlacementCfg)), // was: bx(Q)
    new xY(segmentInfo.clearStateBits.adVideoId),
    new qZ(segmentInfo.QUARTILE_EVENTS),
    mediaRenderer.sodarExtensionData && new SodarExtensionMetadata(mediaRenderer.sodarExtensionData),
    new tq({ current: null }),
    new AdBreakRequestMetadata(),
    new ActiveViewTrafficTypeMetadata(vR(mediaRenderer.pings)),
  ].filter(isNotNullish); // was: QCX

  if (driftRecoveryMs !== undefined)
    items.push(new nC(driftRecoveryMs));

  return items;
}

// ---------------------------------------------------------------------------
// DAI Segment Timing Builder  [was: eln]  (line ~25554)
// ---------------------------------------------------------------------------

/**
 * Computes per-segment timing information for a DAI ad pod.
 * Each segment gets a start/end time, an ad pod index, and
 * has its player vars annotated with the pod info.
 *
 * [was: eln]
 *
 * @param {Array}   layoutRenderers    [was: Q]  — array of renderers
 * @param {number}  podStartMs         [was: c]  — pod start in ms
 * @param {number}  podEndMs           [was: W]  — pod end (content duration) in ms
 * @returns {Array} segment info objects
 */
export function buildDaiSegmentTimings(layoutRenderers, podStartMs, podEndMs) { // was: eln
  const mediaContents = layoutRenderers.map( // was: Q (reassigned)
    renderer => extractMediaContent(getProperty(renderer.renderingContent, instreamVideoAdRenderer))
  );

  const videoLengths = mediaContents.map(content => content.videoLengthSeconds); // was: m
  const adPodInfos = videoLengths.map((_, idx) => new AdPodInfo(idx, videoLengths)); // was: K

  let currentStartMs = podStartMs; // was: T
  let currentEndMs = podEndMs; // was: r
  const segments = []; // was: U

  mediaContents.forEach((content, idx) => { // was: (I, X)
    currentEndMs = Math.min(currentStartMs + content.videoLengthSeconds * 1000, podEndMs);
    annotatePlayerVarsWithPodInfo(content.playerVars, adPodInfos[idx]); // was: RG
    segments.push({
      clearStateBits: content, // was: Vv — media content descriptor
      getStoredDisplaySettings: currentStartMs, // was: NC — segment start ms
      Mx: currentEndMs, // was: Mx — segment end ms
      f3: idx, // was: f3 — segment index
      QUARTILE_EVENTS: adPodInfos[idx], // was: EN — ad pod info
    });
    currentStartMs = currentEndMs;
  });

  return segments;
}

// ---------------------------------------------------------------------------
// VOD Media Info Array Builder  [was: qM_]  (line ~25577)
// ---------------------------------------------------------------------------

/**
 * Builds an array of VOD media info objects from layout renderers.
 * Validates each media renderer, extracts player vars and video lengths,
 * and computes per-segment ad pod metadata.
 *
 * [was: qM_]
 *
 * @param {Array}   layoutRenderers   [was: Q]
 * @param {object}  vodConfig         [was: c]
 * @param {object}  vodSegmentData    [was: W]
 * @returns {Array|Error} array of media info objects or Error
 */
export function buildVodMediaInfoArray(layoutRenderers, vodConfig, vodSegmentData) { // was: qM_
  const mediaInfos = []; // was: m
  for (const renderer of layoutRenderers) { // was: K of Q
    const mediaRenderer = getProperty(renderer.renderingContent, instreamVideoAdRenderer); // was: T
    if (mediaRenderer) {
      if (!isValidVodMediaRenderer(mediaRenderer)) // was: WE(T)
        return new z('Invalid vod media renderer');
      mediaInfos.push(extractVodMediaData(mediaRenderer)); // was: bgX
    }
  }

  const videoLengths = mediaInfos.map(info => info.mN); // was: K (reassigned)
  const result = []; // was: T (reassigned)
  let mediaIndex = 0; // was: r

  for (let i = 0; i < layoutRenderers.length; i++) { // was: U
    const mediaRenderer = getProperty(layoutRenderers[i].renderingContent, instreamVideoAdRenderer); // was: I
    if (!mediaRenderer) continue;

    const adPodInfo = new AdPodInfo(mediaIndex, videoLengths); // was: X
    const playerVarsConfig = buildPlayerVarsConfig( // was: Sn
      mediaInfos[mediaIndex].playerVars,
      mediaInfos[mediaIndex].updateProgressBar,
      vodConfig,
      vodSegmentData,
      adPodInfo
    );

    result[i] = {
      QUARTILE_EVENTS: adPodInfo, // was: EN — ad pod info
      adPodSkipTarget: mediaRenderer.adPodSkipTarget,
      yb: mediaInfos[mediaIndex], // was: yb — media data (playerVars, rd, mN)
      MESSAGE_SENTINEL: playerVarsConfig, // was: m4 — computed player vars config
    };
    mediaIndex++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// VOD Media Data Extractor  [was: bgX]  (line ~25622)
// ---------------------------------------------------------------------------

/**
 * Extracts player variables and video length from a VOD media renderer.
 * Returns NaN-safe video length, defaulting to 0 with a warning.
 *
 * [was: bgX]
 *
 * @param {object}  mediaRenderer   [was: Q]
 * @returns {object} { playerVars, rd, mN }
 */
export function extractVodMediaData(mediaRenderer) { // was: bgX
  const playerVars = parsePlayerVars(mediaRenderer.playerVars); // was: bk
  let videoLengthSeconds = Number(playerVars.length_seconds); // was: W
  if (isNaN(videoLengthSeconds)) {
    videoLengthSeconds = 0;
    logAdWarning('Expected valid length seconds in player vars but got NaN'); // was: v1
  }
  return {
    playerVars,
    updateProgressBar: mediaRenderer.playerVars, // was: rd — raw player vars string
    mN: videoLengthSeconds, // was: mN — video length in seconds
  };
}

// ---------------------------------------------------------------------------
// Slot Trigger Event to Placement Kind  [was: bx]  (line ~25634)
// ---------------------------------------------------------------------------

/**
 * Maps a SLOT_TRIGGER_EVENT_* constant to an AD_PLACEMENT_KIND_* config object.
 *
 * [was: bx]
 *
 * @param {string}  triggerEvent   [was: Q]
 * @returns {object} { kind: string }
 */
export function getAdPlacementConfig(triggerEvent) { // was: bx
  switch (triggerEvent) {
    case 'SLOT_TRIGGER_EVENT_LAYOUT_ID_ENTERED':
      return { kind: 'AD_PLACEMENT_KIND_LAYOUT_ID_ENTERED' };
    case 'SLOT_TRIGGER_EVENT_BEFORE_CONTENT':
      return { kind: 'AD_PLACEMENT_KIND_START' };
    case 'SLOT_TRIGGER_EVENT_CONTENT_OFFSET':
      return { kind: 'AD_PLACEMENT_KIND_MILLISECONDS' };
    case 'SLOT_TRIGGER_EVENT_AFTER_CONTENT':
      return { kind: 'AD_PLACEMENT_KIND_END' };
    case 'SLOT_TRIGGER_EVENT_CONTENT_PAUSED':
      return { kind: 'AD_PLACEMENT_KIND_PAUSE' };
    default:
      return { kind: 'AD_PLACEMENT_KIND_UNKNOWN' };
  }
}

// ---------------------------------------------------------------------------
// Linked Exit Trigger Finder  [was: dD7]  (line ~25663)
// ---------------------------------------------------------------------------

/**
 * Finds the triggering layout ID from normal exit triggers that references
 * a layout other than the given one (for linked overlay exit behaviour).
 *
 * [was: dD7]
 *
 * @param {object}  exitTriggers   [was: Q]
 * @param {string}  excludeId      [was: c]  — layout ID to exclude
 * @returns {string|undefined} linked layout ID or undefined
 */
export function findLinkedExitTrigger(exitTriggers, excludeId) { // was: dD7
  return exitTriggers.layoutExitNormalTriggers.find(
    trigger => trigger instanceof LayoutIdExitedTrigger && trigger?.triggeringLayoutId !== excludeId
  )?.triggeringLayoutId;
}
