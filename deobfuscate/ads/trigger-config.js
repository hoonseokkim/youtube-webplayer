/**
 * Ad Trigger Configuration & Callback Processing
 *
 * Source: player_es6.vflset/en_US/base.js, lines ~26006–27005
 *
 * Handles:
 *  - Survey presence detection in linear ad renderers (cDO)
 *  - Priority-based trigger callback composition (Qun)
 *  - Composite player-bytes layout building from linear ad sequences
 *  - Ad intro, media, endcap, survey, and text-interstitial sub-layout dispatch
 *  - Ad pod skip-target and video length extraction (TUd)
 *  - VOD single-survey layout creation (IMx)
 *  - Sandwich / LinearAdSequence validation helpers (XF7, ADW, e0W)
 *  - Cue-point triggered ad break detection (Vld)
 *  - Full ad placement routing and slot creation (yy, BU0)
 *  - Companion renderer dispatch (engagement panels, action companions, images, shopping)
 *  - Ad break service renderer handling (live prefetch, cue-point, pause)
 *  - Notify-based ad scheduling for sandwich and sequential renderers (q33)
 *  - Layout metadata extraction for media playback callbacks (Al, S3R, F7X, yD7)
 *  - Deterministic slot ID generation (sa)
 */

import { getProperty, instreamAdPlayerOverlayRenderer, instreamSurveyAdRenderer, playerOverlayLayoutRenderer } from '../core/misc-helpers.js';  // was: g.l, g.Re, g.rR, g.kA
import { generateRandomBase64 } from '../data/gel-core.js';  // was: g.Ab
import { hasMetadataKey } from '../network/uri-utils.js';  // was: g.jK
import { buildVodMediaSubLayout, createSurveySlotPair, generateLayoutId } from './slot-id-generator.js';  // was: g.own, g.Uen, g.nQ
import { instreamVideoAdRenderer } from '../core/misc-helpers.js'; // was: Tu
import { AdPodInfo } from './ad-layout-renderer.js'; // was: rP
import { updateProgressBar } from '../ui/progress-bar-impl.js'; // was: rd
import { QUARTILE_EVENTS } from '../proto/message-defs.js'; // was: EN
import { MESSAGE_SENTINEL } from '../proto/messages-core.js'; // was: m4
import { adIntroRenderer } from '../core/misc-helpers.js'; // was: oG
import { getCobaltVersion } from '../core/composition-helpers.js'; // was: tE
import { delayedResolve } from '../core/event-registration.js'; // was: HJ
import { classifyIdbError } from '../data/idb-transactions.js'; // was: GE
import { adActionInterstitialRenderer } from '../core/misc-helpers.js'; // was: YA
import { buildAdSignals } from '../core/composition-helpers.js'; // was: lk
import { surveyTextInterstitial } from '../core/misc-helpers.js'; // was: Uz
import { OnLayoutSelfExitRequestedTrigger } from './ad-trigger-types.js'; // was: bh
import { readTimecodeScale } from '../media/format-parser.js'; // was: qM
import { handleSegmentRedirect } from './dai-cue-range.js'; // was: jZ
import { SurveySubmittedTrigger } from './ad-trigger-types.js'; // was: Oz
import { adMessageRenderer } from '../core/misc-helpers.js'; // was: rc
import { getNumericAttrOrNull } from '../modules/caption/caption-internals.js'; // was: gE
import { videoInterstitialButtoned } from '../core/misc-helpers.js'; // was: pQ
import { isWebKit600Plus } from '../core/composition-helpers.js'; // was: FF
import { MetadataCollection } from './ad-triggers.js';

// ---------------------------------------------------------------------------
// Survey Presence Check  [was: cDO]  (line ~26006)
// ---------------------------------------------------------------------------

/**
 * Returns `true` if any item in the linear ads array is an InstreamSurveyAdRenderer.
 *
 * [was: cDO]
 *
 * @param {Array}  linearAds   [was: Q]  — array of linear ad renderers
 * @returns {boolean}
 */
export function hasSurveyRenderer(linearAds) { // was: cDO
  for (const ad of linearAds) {
    if (getProperty(ad, instreamSurveyAdRenderer))
      return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Trigger Callback Composer  [was: Qun]  (line ~26013)
// ---------------------------------------------------------------------------

/**
 * Creates a callback that, given a slot and optional survey bundle metadata,
 * builds a composite layout from an array of linear ad renderers.
 *
 * Two code paths exist based on whether the `featureFlags` object indicates
 * the new sequential builder (`aL(A) && Gv(A)`). Both paths iterate the
 * linear ad renderers and dispatch to the appropriate sub-layout factory:
 *  - oG  -> ad intro (CKd)
 *  - Tu  -> media (own)
 *  - YA  -> endcap (zl0)
 *  - rR  -> survey (JNw)
 *  - Uz  -> text interstitial (kEy)
 *
 * The result is assembled into a LAYOUT_TYPE_COMPOSITE_PLAYER_BYTES with
 * exit triggers aggregated from all sub-layouts.
 *
 * [was: Qun]
 *
 * @param {object}  layoutBuilder       [was: Q]  — ad layout builder context
 * @param {object}  adPlacementCfg      [was: c]  — ad placement config
 * @param {object}  placementConfig     [was: W]  — placement kind/config
 * @param {Array}   linearAds           [was: m]  — linear ad renderer array
 * @param {object}  adLayoutMetadata    [was: K]  — optional layout metadata override
 * @param {object}  contentCpn          [was: T]  — content CPN string
 * @param {object}  vodConfig           [was: r]  — VOD config (pw, etc.)
 * @param {Function} triggerIdFactory   [was: U]  — trigger ID factory fn
 * @param {Map}     remoteSlotsMap      [was: I]  — external video ID -> remote slots
 * @param {object}  vodSegmentData      [was: X]  — VOD segment timing data
 * @param {object}  featureFlags        [was: A]  — feature flag object
 * @param {object}  experimentConfig    [was: e]  — experiment config
 * @param {Array}   sdsSlotsData        [was: V]  — SDS slots data (optional)
 * @returns {Function} (slotDescriptor, surveyBundle?) => compositeResult | Error
 */
export function createTriggerCallbackComposer( // was: Qun
  layoutBuilder, adPlacementCfg, placementConfig, linearAds, adLayoutMetadata,
  contentCpn, vodConfig, triggerIdFactory, remoteSlotsMap, vodSegmentData,
  featureFlags, experimentConfig, sdsSlotsData
) {
  return (slotDescriptor, surveyBundle) => { // was: (V, B)
    if (isFeatureAvailable(featureFlags) && isFeatureEnabled(featureFlags)) { // was: aL(A) && Gv(A)
      // New sequential builder path
      const videoLengths = extractVideoLengthsFromLinearAds(linearAds); // was: TUd(m)
      if (videoLengths instanceof z) {
        return videoLengths; // was: B = n
      }

      let mediaCount = 0; // was: S
      const childLayouts = []; // was: d
      let skipTriggers = []; // was: b
      let muteTriggers = []; // was: w
      const userInputTriggers = []; // was: f
      const cancelTriggers = []; // was: G
      let metadataItems = []; // was: T7
      const surveyRef = new om(); // was: oW
      const skipTargetRef = new vc({ current: null }); // was: G7
      let hasSkipTarget = false; // was: yn
      let collectedSlots = []; // was: $x
      let mediaIndex = 0; // was: z7
      const mediaDataMap = []; // was: wT
      let lastSkipTarget = -1; // was: (not named directly, tracked through n)

      // Pre-process all media renderers
      for (let i = 0; i < linearAds.length; i++) { // was: P3
        const linearAd = linearAds[i]; // was: Ft
        const mediaRenderer = getProperty(linearAd, instreamVideoAdRenderer); // was: CR

        if (!mediaRenderer) continue;

        const parsedMedia = parseVodMedia(mediaRenderer); // was: yM(CR)
        if (parsedMedia instanceof oe) {
          return new z(parsedMedia); // was: B = new z(CR)
        }

        const adPodInfo = new AdPodInfo(mediaIndex, videoLengths); // was: Wx
        const playerVarsConfig = buildPlayerVarsConfig( // was: ik = Sn(…)
          parsedMedia.playerVars, parsedMedia.updateProgressBar, vodConfig, vodSegmentData, adPodInfo
        );
        mediaIndex++;

        mediaDataMap[i] = {
          renderer: linearAd,
          data: parsedMedia,
          QUARTILE_EVENTS: adPodInfo, // was: EN — ad pod info
          MESSAGE_SENTINEL: playerVarsConfig, // was: m4 — player vars config
        };
      }

      // Build sub-layouts
      let lastAdSkipTarget = -1; // was: n
      for (let idx = 0; idx < linearAds.length; idx++) { // was: z7
        const linearAd = linearAds[idx]; // was: P3

        // Ad intro
        let adIntro = getProperty(linearAd, adIntroRenderer); // was: Ft
        if (adIntro) {
          const introFactory = createAdIntroLayout(adPlacementCfg, placementConfig, adIntro, triggerIdFactory); // was: CKd
          if (introFactory instanceof z) return introFactory;

          const introResult = introFactory(slotDescriptor);
          childLayouts.push(introResult.getCobaltVersion);
          skipTriggers = [...introResult.eZ, ...skipTriggers];
          muteTriggers = [...introResult.CF, ...muteTriggers];
          if (introResult.delayedResolve) collectedSlots = [introResult.delayedResolve, ...collectedSlots];
          continue;
        }

        // Media
        if (getProperty(linearAd, instreamVideoAdRenderer)) {
          const mediaData = mediaDataMap[idx]; // was: Ft
          const parsedMedia = mediaData.data; // was: n
          const adPodInfo = mediaData.QUARTILE_EVENTS; // was: P3
          const playerVarsConfig = mediaData.MESSAGE_SENTINEL; // was: Ft

          const nextMediaData = mediaDataMap[idx + 1]; // was: CR
          let nextPlayerVarsConfig = undefined; // was: dY
          if (nextMediaData) nextPlayerVarsConfig = nextMediaData.MESSAGE_SENTINEL;

          const mediaResult = buildVodMediaSubLayout( // was: own
            adPlacementCfg, parsedMedia.layoutId, parsedMedia.classifyIdbError,
            placementConfig, playerVarsConfig, parsedMedia.mN,
            contentCpn, adPodInfo, triggerIdFactory(slotDescriptor),
            skipTargetRef, remoteSlotsMap.get(parsedMedia.classifyIdbError.externalVideoId),
            nextPlayerVarsConfig, experimentConfig
          );
          mediaCount++;

          childLayouts.push(mediaResult.getCobaltVersion);
          skipTriggers = [...mediaResult.eZ, ...skipTriggers];
          muteTriggers = [...mediaResult.CF, ...muteTriggers];

          if (!hasSkipTarget) {
            metadataItems.push(skipTargetRef);
            hasSkipTarget = true;
          }

          lastAdSkipTarget = parsedMedia.classifyIdbError.adPodSkipTarget && parsedMedia.classifyIdbError.adPodSkipTarget > 0
            ? parsedMedia.classifyIdbError.adPodSkipTarget
            : -1;
          continue;
        }

        // Endcap
        adIntro = getProperty(linearAd, adActionInterstitialRenderer); // reuse variable
        if (adIntro) {
          const endcapFactory = createEndcapSubLayout( // was: zl0
            layoutBuilder, adPlacementCfg, placementConfig, adIntro,
            contentCpn, mediaCount, triggerIdFactory, skipTargetRef, lastAdSkipTarget
          );
          if (endcapFactory instanceof z) return endcapFactory;

          const endcapResult = endcapFactory(slotDescriptor);
          childLayouts.push(endcapResult.getCobaltVersion);
          skipTriggers = [...endcapResult.eZ, ...skipTriggers];
          muteTriggers = [...endcapResult.CF, ...muteTriggers];
          if (endcapResult.delayedResolve) collectedSlots = [endcapResult.delayedResolve, ...collectedSlots];
          continue;
        }

        // Survey
        adIntro = getProperty(linearAd, instreamSurveyAdRenderer);
        if (adIntro) {
          if (surveyBundle === undefined) {
            return new z('Composite Survey must already have a Survey Bundle with required metadata.', {
              instreamSurveyAdRenderer: adIntro,
            });
          }

          const surveyFactory = createCompositeSurveyLayout( // was: JNw
            layoutBuilder, adPlacementCfg, placementConfig, contentCpn,
            adIntro, surveyRef, triggerIdFactory, surveyBundle, mediaCount,
            hasFeatureFlag(featureFlags, 'supports_multi_step_on_desktop') // was: qP(A, …)
          );
          if (surveyFactory instanceof z) return surveyFactory;

          const surveyResult = surveyFactory(slotDescriptor);
          childLayouts.push(surveyResult.getCobaltVersion);
          if (surveyResult.delayedResolve) collectedSlots.push(surveyResult.delayedResolve);
          skipTriggers = [...surveyResult.eZ, ...skipTriggers];
          muteTriggers = [...surveyResult.CF, ...muteTriggers];
          userInputTriggers.push(...surveyResult.ZY);
          cancelTriggers.push(...surveyResult.buildAdSignals);
          metadataItems = [surveyRef, ...metadataItems];
          continue;
        }

        // Text interstitial
        const textInterstitial = getProperty(linearAd, surveyTextInterstitial); // was: P3
        if (textInterstitial) {
          const interstitialFactory = createTextInterstitialLayout( // was: kEy
            layoutBuilder, adPlacementCfg, placementConfig, contentCpn,
            textInterstitial, surveyRef, triggerIdFactory, mediaCount
          );
          if (interstitialFactory instanceof z) return interstitialFactory;

          const interstitialResult = interstitialFactory(slotDescriptor);
          childLayouts.push(interstitialResult.getCobaltVersion);
          if (interstitialResult.delayedResolve) collectedSlots.push(interstitialResult.delayedResolve);
          muteTriggers = [...interstitialResult.CF, ...muteTriggers];
        } else {
          return new z('Unsupported linearAd found in LinearAdSequenceRenderer.');
        }
      }

      return {
        lj: childLayouts, // was: lj — child layouts
        layoutExitSkipTriggers: skipTriggers,
        layoutExitUserInputSubmittedTriggers: userInputTriggers,
        layoutExitUserCancelledTriggers: cancelTriggers,
        layoutExitMuteTriggers: muteTriggers,
        HM: metadataItems, // was: HM — metadata items for composite
        rH: collectedSlots, // was: rH — collected in-player slots
      };

    } else {
      // Legacy builder path (no feature-flag gating)
      const videoLengths = extractVideoLengthsFromLinearAds(linearAds); // was: TUd(m)
      if (videoLengths instanceof z) return videoLengths;

      let mediaCount = 0; // was: dY
      const childLayouts = []; // was: d
      let skipTriggers = []; // was: b
      let muteTriggers = []; // was: w
      const userInputTriggers = []; // was: f
      const cancelTriggers = []; // was: G
      let metadataItems = []; // was: T7
      const surveyRef = new om(); // was: oW
      const skipTargetRef = new vc({ current: null }); // was: G7
      let hasSkipTarget = false; // was: yn
      let collectedSlots = []; // was: $x
      let lastParsedMedia = -1; // was: z7

      for (const linearAd of linearAds) { // was: S of m

        // Ad intro
        if (getProperty(linearAd, adIntroRenderer)) {
          const introFactory = createAdIntroLayout(adPlacementCfg, placementConfig, getProperty(linearAd, adIntroRenderer), triggerIdFactory); // was: CKd
          if (introFactory instanceof z) return introFactory;

          const introResult = introFactory(slotDescriptor);
          childLayouts.push(introResult.getCobaltVersion);
          skipTriggers = [...introResult.eZ, ...skipTriggers];
          muteTriggers = [...introResult.CF, ...muteTriggers];
          if (introResult.delayedResolve) collectedSlots = [introResult.delayedResolve, ...collectedSlots];
          continue;
        }

        // Media
        if (getProperty(linearAd, instreamVideoAdRenderer)) {
          lastParsedMedia = parseVodMedia(getProperty(linearAd, instreamVideoAdRenderer)); // was: yM
          if (lastParsedMedia instanceof oe) return new z(lastParsedMedia);

          const adPodInfo = new AdPodInfo(mediaCount, videoLengths); // was: n
          const mediaResult = buildVodMediaSubLayout( // was: own
            adPlacementCfg, lastParsedMedia.layoutId, lastParsedMedia.classifyIdbError,
            placementConfig,
            buildPlayerVarsConfig(lastParsedMedia.playerVars, lastParsedMedia.updateProgressBar, vodConfig, vodSegmentData, adPodInfo),
            lastParsedMedia.mN, contentCpn, adPodInfo,
            triggerIdFactory(slotDescriptor), skipTargetRef,
            remoteSlotsMap.get(lastParsedMedia.classifyIdbError.externalVideoId),
            undefined, experimentConfig
          );
          mediaCount++;

          childLayouts.push(mediaResult.getCobaltVersion);
          skipTriggers = [...mediaResult.eZ, ...skipTriggers];
          muteTriggers = [...mediaResult.CF, ...muteTriggers];

          if (!hasSkipTarget) {
            metadataItems.push(skipTargetRef);
            hasSkipTarget = true;
          }

          lastParsedMedia = lastParsedMedia.classifyIdbError.adPodSkipTarget && lastParsedMedia.classifyIdbError.adPodSkipTarget > 0
            ? lastParsedMedia.classifyIdbError.adPodSkipTarget
            : -1;
          continue;
        }

        // Endcap
        if (getProperty(linearAd, adActionInterstitialRenderer)) {
          const endcapFactory = createEndcapSubLayout( // was: zl0
            layoutBuilder, adPlacementCfg, placementConfig,
            getProperty(linearAd, adActionInterstitialRenderer), contentCpn, mediaCount, triggerIdFactory,
            skipTargetRef, lastParsedMedia
          );
          if (endcapFactory instanceof z) return endcapFactory;

          const endcapResult = endcapFactory(slotDescriptor);
          childLayouts.push(endcapResult.getCobaltVersion);
          skipTriggers = [...endcapResult.eZ, ...skipTriggers];
          muteTriggers = [...endcapResult.CF, ...muteTriggers];
          if (endcapResult.delayedResolve) collectedSlots = [endcapResult.delayedResolve, ...collectedSlots];
          continue;
        }

        // Survey
        if (getProperty(linearAd, instreamSurveyAdRenderer)) {
          if (surveyBundle === undefined) {
            return new z('Composite Survey must already have a Survey Bundle with required metadata.', {
              instreamSurveyAdRenderer: getProperty(linearAd, instreamSurveyAdRenderer),
            });
          }

          const surveyFactory = createCompositeSurveyLayout( // was: JNw
            layoutBuilder, adPlacementCfg, placementConfig, contentCpn,
            getProperty(linearAd, instreamSurveyAdRenderer), surveyRef, triggerIdFactory, surveyBundle, mediaCount,
            hasFeatureFlag(featureFlags, 'supports_multi_step_on_desktop')
          );
          if (surveyFactory instanceof z) return surveyFactory;

          const surveyResult = surveyFactory(slotDescriptor);
          childLayouts.push(surveyResult.getCobaltVersion);
          if (surveyResult.delayedResolve) collectedSlots.push(surveyResult.delayedResolve);
          skipTriggers = [...surveyResult.eZ, ...skipTriggers];
          muteTriggers = [...surveyResult.CF, ...muteTriggers];
          userInputTriggers.push(...surveyResult.ZY);
          cancelTriggers.push(...surveyResult.buildAdSignals);
          metadataItems = [surveyRef, ...metadataItems];
          continue;
        }

        // Text interstitial
        if (getProperty(linearAd, surveyTextInterstitial)) {
          const interstitialFactory = createTextInterstitialLayout( // was: kEy
            layoutBuilder, adPlacementCfg, placementConfig, contentCpn,
            getProperty(linearAd, surveyTextInterstitial), surveyRef, triggerIdFactory, mediaCount
          );
          if (interstitialFactory instanceof z) return interstitialFactory;

          const interstitialResult = interstitialFactory(slotDescriptor);
          childLayouts.push(interstitialResult.getCobaltVersion);
          if (interstitialResult.delayedResolve) collectedSlots.push(interstitialResult.delayedResolve);
          muteTriggers = [...interstitialResult.CF, ...muteTriggers];
        } else {
          return new z('Unsupported linearAd found in LinearAdSequenceRenderer.');
        }
      }

      return {
        lj: childLayouts,
        layoutExitSkipTriggers: skipTriggers,
        layoutExitUserInputSubmittedTriggers: userInputTriggers,
        layoutExitUserCancelledTriggers: cancelTriggers,
        layoutExitMuteTriggers: muteTriggers,
        HM: metadataItems,
        rH: collectedSlots,
      };
    }

    // Assemble the composite layout from the sub-layout result
    if (surveyBundle instanceof z) {
      return surveyBundle; // was: V = B
    }

    const compositeSlotId = slotDescriptor.slotId; // was: G
    const subLayouts = surveyBundle.lj; // was: dY
    const exitSkipTriggers = surveyBundle.layoutExitSkipTriggers; // was: S
    const exitMuteTriggers = surveyBundle.layoutExitMuteTriggers; // was: d
    const exitInputTriggers = surveyBundle.layoutExitUserInputSubmittedTriggers; // was: b
    const compositeMetadata = surveyBundle.HM; // was: w
    const callbackRef = triggerIdFactory(slotDescriptor); // was: V = U(V)

    const compositeLayoutType = adLayoutMetadata
      ? adLayoutMetadata.layoutType
      : 'LAYOUT_TYPE_COMPOSITE_PLAYER_BYTES'; // was: f
    const compositeLayoutId = adLayoutMetadata
      ? adLayoutMetadata.layoutId
      : generateLayoutId(adPlacementCfg.O.get(), compositeLayoutType, compositeSlotId); // was: nQ, G

    const compositeIdentity = { // was: T7
      layoutId: compositeLayoutId,
      layoutType: compositeLayoutType,
      G2: 'core',
    };

    return {
      layout: {
        layoutId: compositeLayoutId,
        layoutType: compositeLayoutType,
        zy: new Map(),
        layoutExitNormalTriggers: [new OnLayoutSelfExitRequestedTrigger(adPlacementCfg.W, compositeLayoutId)],
        layoutExitSkipTriggers: exitSkipTriggers,
        layoutExitMuteTriggers: exitMuteTriggers,
        layoutExitUserInputSubmittedTriggers: exitInputTriggers,
        layoutExitUserCancelledTriggers: [],
        G2: 'core',
        clientMetadata: new MetadataCollection([new rD3(subLayouts), ...compositeMetadata]),
        Je: callbackRef(compositeIdentity),
      },
      rH: surveyBundle.rH, // was: rH — collected in-player slots
    };
  };
}

// ---------------------------------------------------------------------------
// Video Length Extractor  [was: TUd]  (line ~26286)
// ---------------------------------------------------------------------------

/**
 * Extracts an array of video lengths (in seconds) from the media renderers
 * within a linear ad array. Non-media renderers are skipped.
 *
 * [was: TUd]
 *
 * @param {Array}  linearAds   [was: Q]
 * @returns {Array<number>|Error} video lengths or Error
 */
export function extractVideoLengthsFromLinearAds(linearAds) { // was: TUd
  const lengths = []; // was: c
  for (const ad of linearAds) { // was: W of Q
    if (!getProperty(ad, instreamVideoAdRenderer)) continue;

    const parsed = parseVodMedia(getProperty(ad, instreamVideoAdRenderer)); // was: yM
    if (parsed instanceof oe)
      return new z(parsed);
    lengths.push(parsed.mN); // was: mN — video length seconds
  }
  return lengths;
}

// ---------------------------------------------------------------------------
// VOD Single Survey Layout  [was: IMx]  (line ~26299)
// ---------------------------------------------------------------------------

/**
 * Creates a single-survey layout for VOD playback.
 * Validates the InstreamSurveyAdRenderer and duration, then creates
 * a LAYOUT_TYPE_MEDIA_BREAK with a survey overlay.
 *
 * [was: IMx]
 *
 * @param {object}  layoutBuilder        [was: Q]
 * @param {object}  adPlacementCfg       [was: c]
 * @param {object}  surveyRenderer       [was: W]
 * @param {object}  placementConfig      [was: m]
 * @param {object}  adSlotLoggingData    [was: K]
 * @param {string}  contentCpn           [was: T]
 * @param {Function} triggerIdFactory    [was: r]
 * @param {boolean} supportsMultiStep    [was: U]  — defaults to false
 * @returns {Array|Error} array of slots or Error
 */
export function createVodSingleSurveyLayout( // was: IMx
  layoutBuilder, adPlacementCfg, surveyRenderer, placementConfig,
  adSlotLoggingData, contentCpn, triggerIdFactory, supportsMultiStep = false
) {
  if (!isValidSurveyRenderer(surveyRenderer, supportsMultiStep)) // was: h8_
    return new z('Received invalid InstreamSurveyAdRenderer for VOD single survey.', {
      InstreamSurveyAdRenderer: surveyRenderer,
    });

  const durationMs = getSurveyDuration(surveyRenderer); // was: cc(W)
  if (durationMs <= 0)
    return new z('InstreamSurveyAdRenderer should have valid duration.', {
      instreamSurveyAdRenderer: surveyRenderer,
    });

  const surveyRef = new om(); // was: X
  const overlayFactory = buildSurveyOverlayFactory( // was: HhO
    layoutBuilder, adPlacementCfg, surveyRenderer, surveyRef,
    placementConfig, contentCpn, triggerIdFactory
  );

  return createSurveySlotPair( // was: Uen
    layoutBuilder, placementConfig, contentCpn, durationMs, adSlotLoggingData,
    (slotDesc, surveyBundleMeta) => { // was: (e, V)
      const slotId = slotDesc.slotId; // was: B
      const commandSet = extractSurveyCommands(surveyRenderer); // was: Wc(W)
      const callbackRef = triggerIdFactory(slotDesc); // was: e = r(e)
      const layoutId = generateLayoutId(adPlacementCfg.O.get(), 'LAYOUT_TYPE_MEDIA_BREAK', slotId); // was: nQ

      const layoutIdentity = { // was: S
        layoutId,
        layoutType: 'LAYOUT_TYPE_MEDIA_BREAK',
        G2: 'core',
      };

      const overlayLayout = overlayFactory(layoutId, surveyBundleMeta); // was: d = A(B, V)
      const fulfilledLayout = overlayLayout.clientMetadata.readTimecodeScale('metadata_type_fulfilled_layout'); // was: b
      if (!fulfilledLayout)
        logAdWarning('Could not retrieve overlay layout ID during VodMediaBreakLayout for survey creation. This should never happen.');

      const metadataItems = [ // was: n
        new kb(placementConfig),
        new MediaLayoutDurationMetadata(durationMs),
        new InteractionsProgressMetadata(commandSet),
        surveyRef,
      ];
      if (fulfilledLayout)
        metadataItems.push(new SurveyTriggerMetadata(fulfilledLayout.layoutType));

      return {
        To: { // was: To — media break layout
          layoutId,
          layoutType: 'LAYOUT_TYPE_MEDIA_BREAK',
          zy: new Map(),
          layoutExitNormalTriggers: [new OnLayoutSelfExitRequestedTrigger(adPlacementCfg.W, layoutId)],
          layoutExitSkipTriggers: [new handleSegmentRedirect(adPlacementCfg.W, surveyBundleMeta.layoutId)],
          layoutExitMuteTriggers: [],
          layoutExitUserInputSubmittedTriggers: [new SurveySubmittedTrigger(adPlacementCfg.W, surveyBundleMeta.layoutId)],
          layoutExitUserCancelledTriggers: [],
          G2: 'core',
          clientMetadata: new MetadataCollection(metadataItems),
          Je: callbackRef(layoutIdentity),
        },
        A9: overlayLayout, // was: A9 — overlay layout
      };
    }
  );
}

// ---------------------------------------------------------------------------
// Sandwich Validation Helpers  [was: XF7, ADW, e0W]  (lines ~26346–26368)
// ---------------------------------------------------------------------------

/**
 * Checks whether a SandwichedLinearAdRenderer has a valid notify ad-start
 * with a media linear ad.
 *
 * [was: XF7]
 *
 * @param {object}  sandwichRenderer   [was: Q]
 * @returns {boolean}
 */
export function isSandwichWithNotify(sandwichRenderer) { // was: XF7
  if (!isValidSandwichRenderer(sandwichRenderer)) // was: MDn
    return false;
  const notifyRenderer = getProperty(sandwichRenderer.adVideoStart, adMessageRenderer); // was: c
  if (!notifyRenderer) return false;
  if (getProperty(sandwichRenderer.linearAd, instreamVideoAdRenderer) && isValidNotifyRenderer(notifyRenderer)) // was: pA
    return true;
  logAdWarning('Invalid Sandwich with notify'); // was: v1
  return false;
}

/**
 * Checks whether a LinearAdSequenceRenderer (without adLayoutMetadata)
 * has a valid notify ad-start.
 *
 * [was: ADW]
 *
 * @param {object}  sequenceRenderer   [was: Q]
 * @returns {boolean}
 */
export function isSequenceWithNotify(sequenceRenderer) { // was: ADW
  if (sequenceRenderer.linearAds == null)
    return false;
  const notifyRenderer = getProperty(sequenceRenderer.adStart, adMessageRenderer); // was: Q (reassigned)
  if (!notifyRenderer) return false;
  if (isValidNotifyRenderer(notifyRenderer)) return true; // was: pA
  logAdWarning('Invalid LASR with notify'); // was: v1
  return false;
}

/**
 * Checks whether a LinearAdSequenceRenderer (with adLayoutMetadata)
 * has a valid notify ad-start.
 *
 * [was: e0W]
 *
 * @param {object}  sequenceRenderer   [was: Q]
 * @returns {boolean}
 */
export function isSequenceWithMetadataAndNotify(sequenceRenderer) { // was: e0W
  if (!isValidSequenceWithMetadata(sequenceRenderer)) // was: Ckw
    return false;
  const notifyRenderer = getProperty(sequenceRenderer.adStart, adMessageRenderer); // was: Q (reassigned)
  if (!notifyRenderer) return false;
  if (isValidNotifyRenderer(notifyRenderer)) return true; // was: pA
  logAdWarning('Invalid LASR with notify'); // was: v1
  return false;
}

// ---------------------------------------------------------------------------
// Cue-Point Triggered Detection  [was: Vld]  (line ~26370)
// ---------------------------------------------------------------------------

/**
 * Returns true if the ad placement is cue-point triggered and has a
 * getAdBreakUrl on its adBreakServiceRenderer.
 *
 * [was: Vld]
 *
 * @param {object}  placement   [was: Q]
 * @returns {boolean}
 */
export function isCuePointTriggeredBreak(placement) { // was: Vld
  return placement.config?.adPlacementConfig?.kind === 'AD_PLACEMENT_KIND_CUE_POINT_TRIGGERED'
    && placement.renderer?.adBreakServiceRenderer?.getAdBreakUrl !== undefined;
}

// ---------------------------------------------------------------------------
// Layout Metadata Extraction  [was: Al]  (line ~26615)
// ---------------------------------------------------------------------------

/**
 * Extracts full layout metadata for media playback from a layout's
 * client metadata. Returns null if no callback ref is present.
 *
 * Includes layout ID, content CPN, callback ref, overlay renderers,
 * ad placement config, video length, ad duration, and linked IDs.
 *
 * [was: Al]
 *
 * @param {object}  layout   [was: Q]
 * @returns {object|null}
 */
export function extractMediaPlaybackMetadata(layout) { // was: Al
  const callbackRef = layout.clientMetadata.readTimecodeScale('metadata_type_player_bytes_callback_ref')?.current; // was: c
  if (!callbackRef) return null;

  const skipTargetRef = layout.clientMetadata.readTimecodeScale('metadata_type_ad_pod_skip_target_callback_ref'); // was: W

  const layoutId = layout.layoutId; // was: m
  const contentCpn = layout.clientMetadata.readTimecodeScale('metadata_type_content_cpn'); // was: K
  const instreamOverlay = layout.clientMetadata.readTimecodeScale('metadata_type_instream_ad_player_overlay_renderer'); // was: T
  const playerOverlay = layout.clientMetadata.readTimecodeScale('metadata_type_player_overlay_layout_renderer'); // was: r
  const playerUnderlay = layout.clientMetadata.readTimecodeScale('metadata_type_player_underlay_renderer'); // was: U
  const placementConfig = layout.clientMetadata.readTimecodeScale('metadata_type_ad_placement_config'); // was: I
  const videoLengthSeconds = layout.clientMetadata.readTimecodeScale('metadata_type_video_length_seconds'); // was: X

  // Compute ad duration from one of two metadata paths
  let adDuration; // was: A
  if (hasMetadataKey(layout.clientMetadata, 'METADATA_TYPE_MEDIA_LAYOUT_DURATION_seconds')) { // was: jK
    adDuration = layout.clientMetadata.readTimecodeScale('METADATA_TYPE_MEDIA_LAYOUT_DURATION_seconds');
  } else if (
    hasMetadataKey(layout.clientMetadata, 'metadata_type_layout_enter_ms')
    && hasMetadataKey(layout.clientMetadata, 'metadata_type_layout_exit_ms')
  ) {
    adDuration = (layout.clientMetadata.readTimecodeScale('metadata_type_layout_exit_ms')
      - layout.clientMetadata.readTimecodeScale('metadata_type_layout_enter_ms')) / 1000;
  } else {
    adDuration = undefined;
  }

  return {
    IM: layoutId, // was: IM — layout identifier
    contentCpn,
    getNumericAttrOrNull: callbackRef, // was: gE — callback reference
    videoInterstitialButtoned: skipTargetRef, // was: pQ — skip target callback ref
    instreamAdPlayerOverlayRenderer: instreamOverlay,
    playerOverlayLayoutRenderer: playerOverlay,
    instreamAdPlayerUnderlayRenderer: playerUnderlay,
    adPlacementConfig: placementConfig,
    videoLengthSeconds,
    Ga: adDuration, // was: Ga — ad duration seconds
    inPlayerLayoutId: layout.clientMetadata.readTimecodeScale('metadata_type_linked_in_player_layout_id'),
    inPlayerSlotId: layout.clientMetadata.readTimecodeScale('metadata_type_linked_in_player_slot_id'),
  };
}

// ---------------------------------------------------------------------------
// Sequential Layout Metadata  [was: S3R]  (line ~26644)
// ---------------------------------------------------------------------------

/**
 * Extracts layout metadata for a sequential layout (delegates to yD7).
 *
 * [was: S3R]
 *
 * @param {object}  layout      [was: Q]
 * @param {object}  context     [was: c]
 * @returns {object|null}
 */
export function extractSequentialLayoutMetadata(layout, context) { // was: S3R
  return extractBaseLayoutMetadata(layout, context); // was: yD7
}

// ---------------------------------------------------------------------------
// Ad-Pod Aware Metadata  [was: F7X]  (line ~26648)
// ---------------------------------------------------------------------------

/**
 * Like extractSequentialLayoutMetadata but also includes the ad break
 * remaining length from ad pod info.
 *
 * [was: F7X]
 *
 * @param {object}  layout      [was: Q]
 * @param {object}  context     [was: c]
 * @returns {object|null}
 */
export function extractAdPodAwareMetadata(layout, context) { // was: F7X
  const metadata = extractBaseLayoutMetadata(layout, context); // was: yD7
  if (!metadata) return null;
  metadata.Ga = layout.clientMetadata.readTimecodeScale('metadata_type_ad_pod_info')?.adBreakRemainingLengthSeconds;
  return metadata;
}

// ---------------------------------------------------------------------------
// Base Layout Metadata  [was: yD7]  (line ~26656)
// ---------------------------------------------------------------------------

/**
 * Core metadata extractor for playback layouts.
 * Returns null if no callback ref is found.
 *
 * [was: yD7]
 *
 * @param {object}  layout      [was: Q]
 * @param {object}  context     [was: c]
 * @returns {object|null}
 */
export function extractBaseLayoutMetadata(layout, context) { // was: yD7
  const callbackRef = layout.clientMetadata.readTimecodeScale('metadata_type_player_bytes_callback_ref')?.current; // was: W
  if (!callbackRef) return null;

  const filterFlags = extractFilterFlags(layout, context); // was: gFR

  return {
    Yz: extractYzFlags(layout, context), // was: jOy
    adPlacementConfig: layout.clientMetadata.readTimecodeScale('metadata_type_ad_placement_config'),
    isWebKit600Plus: filterFlags, // was: FF — filter flags
    contentCpn: layout.clientMetadata.readTimecodeScale('metadata_type_content_cpn'),
    inPlayerLayoutId: layout.clientMetadata.readTimecodeScale('metadata_type_linked_in_player_layout_id'),
    inPlayerSlotId: layout.clientMetadata.readTimecodeScale('metadata_type_linked_in_player_slot_id'),
    instreamAdPlayerOverlayRenderer: layout.clientMetadata.readTimecodeScale('metadata_type_instream_ad_player_overlay_renderer'),
    playerOverlayLayoutRenderer: undefined,
    instreamAdPlayerUnderlayRenderer: undefined,
    Ga: undefined, // was: Ga — ad duration (filled by caller)
    getNumericAttrOrNull: callbackRef,
    IM: layout.layoutId,
    videoLengthSeconds: layout.clientMetadata.readTimecodeScale('metadata_type_video_length_seconds'),
  };
}

// ---------------------------------------------------------------------------
// Deterministic Slot ID Generator  [was: sa]  (line ~26996)
// ---------------------------------------------------------------------------

/**
 * Generates a slot ID, either deterministically (counter-based, when
 * deterministic IDs are enabled) or randomly (16-char hex).
 *
 * Deterministic format: `${slotType}_${counter}`
 *
 * [was: sa]
 *
 * @param {object}  context    [was: Q]  — has .QC, .O (counter map)
 * @param {string}  slotType   [was: c]  — e.g. "SLOT_TYPE_PLAYER_BYTES"
 * @returns {string} generated slot ID
 */
export function generateSlotId(context, slotType) { // was: sa
  if (isDeterministicIdEnabled(context.QC.get())) { // was: tl
    let counter = context.O.get(slotType) || 0; // was: W
    counter++;
    context.O.set(slotType, counter);
    return `${slotType}_${counter}`;
  }
  return generateRandomBase64(16); // random 16-char hex
}
