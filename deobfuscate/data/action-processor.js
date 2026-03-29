/**
 * action-processor.js -- Entity-key collection classes for menu/action renderers
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~65560-66999
 *
 * Provides:
 *  - EntityKeyCollector (LP): base class holding a data payload (W) and
 *    an abstract O() method that returns dependent entity keys
 *  - MenuActionProcessor (wa): extends LP, adds entityMetadata get/set
 *  - ~60 concrete subclasses that implement O() to collect entity-key
 *    references from their respective renderer/action data objects
 *  - ServiceKey instances (g.Y tokens) for well-known endpoint renderers
 *  - Living-room app mode enum (gL3)
 *  - Web display mode enum (jPW)
 *  - Embedded player mode enum ($SW)
 *  - Client type enum (Hyd)
 *
 * All concrete classes follow the same pattern: construct with a data payload,
 * then O() returns a deduplicated array of entity-key strings that should be
 * pre-fetched from the entity store before the action can execute.
 *
 * [was: LP, wa, xCw, nXW, DCK, Zym, EXK, sfx, dCW, wAX, LP3, by3, jfO,
 *  gXd, Oy3, fGm, Gl7, $Cy, C9w, MOX, Juw, Rjd, Yr0, kl7, pA7, Qj3,
 *  cXW, WoK, mkK, Kod, TIK, oa7, Uk0, rXW, IHy, XKx, AXw, erR, V2w,
 *  BIn, xk7, q07, nan, Dk3, t2K, HBO, NIn, S0O, Fow, ZBn, sjm, dk7,
 *  Lom, wKn, bBw, jjw, gax, OB_, fH7, vax, aHd, GIW, $k7, PTw, uP0,
 *  lHK, hrx, zrK, CTO, M2m, KJw, TJ7, oLW, rad, UU7, Is0, XQw, Aax,
 *  eI7, VsW, nLy, ts_, i5K, SYO, FJO, Z5W, ELK, srx, dU0, LJ_, wQ0,
 *  b57, jrx, O57, fsO, $U_, PqK, ls7, uad, hIw, zIX, CqK]
 */
import { SharePanel } from '../features/keyboard-handler.js'; // was: ojv

// ---------------------------------------------------------------------------
// Base classes (lines ~65560-65572)
// ---------------------------------------------------------------------------

/**
 * Base entity-key collector. Holds a data payload and exposes an abstract
 * `getEntityKeys()` method.
 *
 * [was: LP]
 */
export class EntityKeyCollector {
  /**
   * @param {Object} data - the renderer/action data payload [was: Q]
   */
  constructor(data) {
    this.data = data; // was: W
  }
}

/**
 * Menu/action processor extending EntityKeyCollector with
 * an entityMetadata accessor on the data payload.
 *
 * [was: wa]
 */
export class MenuActionProcessor extends EntityKeyCollector {
  /** @returns {*} */
  get entityMetadata() {
    return this.data.entityMetadata;
  }

  /** @param {*} value */
  set entityMetadata(value) {
    this.data.entityMetadata = value;
  }
}

// ---------------------------------------------------------------------------
// Service key registrations (lines ~65558-65814, 66220-66691)
// ---------------------------------------------------------------------------

// NOTE: g.Y("...") creates a well-known service-key token used to register
// renderer types in the dependency-injection registry. Below are the keys
// declared in this region, listed with their original variable names.

/**
 * Service-key token class. Each instance wraps a well-known endpoint name.
 * [was: g.Y]
 */
export class EndpointKey {
  constructor(name) {
    this.name = name;
  }
} // [was: g.Y]

/**
 * Signal action endpoint key. Used by signal-based command dispatch.
 * [was: g.CD] -- original: `g.CD = new g.Y("signalAction")`
 */
export const SIGNAL_ACTION_KEY = new EndpointKey("signalAction"); // [was: g.CD]

/**
 * Web command metadata endpoint key.
 * [was: g.bu] -- original: `g.bu = new g.Y("webCommandMetadata")`
 */
export const WEB_COMMAND_METADATA_KEY = new EndpointKey("webCommandMetadata"); // [was: g.bu]

// var BE7     = new g.Y("confirmDialogEndpoint")
// var qrO     = new g.Y("commandContext")
// var v83     = new g.Y("rawColdConfigGroup")
// var f9y     = new g.Y("rawHotConfigGroup")
// g.GW        = new EndpointKey("commandExecutorCommand")
// var hj7     = new g.Y("loggingContext")
// var P9d     = new g.Y("interactionLoggingCommandMetadata")
// var zjR     = new g.Y("dismissPlayerOverlayCommand")
// var me      = new g.Y("thumbnailLandscapePortraitRenderer")
// g.yuy       = new EndpointKey("changeEngagementPanelVisibilityAction")
// var R37     = new g.Y("continuationCommand")
// var Srm     = new g.Y("openPopupAction")
// (g.CD exported above as SIGNAL_ACTION_KEY)
// (g.bu exported above as WEB_COMMAND_METADATA_KEY)
// var yI0     = new g.Y("metadataBadgeRenderer")
// var J3y     = new g.Y("signalServiceEndpoint")
// var b5      = new g.Y("innertubeCommand")
// var FP3     = new g.Y("loggingDirectives")
// var G1m     = new g.Y("channelThumbnailEndpoint")
// var DPR     = new g.Y("embeddedPlayerErrorMessageRenderer")
// var AI_     = new g.Y("embeddedPlayerOverlayVideoDetailsRenderer")
// var $P0     = new g.Y("embeddedPlayerOverlayVideoDetailsCollapsedRenderer")
// var PR7     = new g.Y("embeddedPlayerOverlayVideoDetailsExpandedRenderer")
// var qad     = new g.Y("embedsInfoPanelRenderer")
// var vXn     = new g.Y("youtubeIconSource")
// var aGR     = new g.Y("callToActionButtonViewModel")
// var jt      = new g.Y("feedbackEndpoint")
// var NR      = new g.Y("changeKeyedMarkersVisibilityCommand")
// var iBm     = new g.Y("changeMarkersVisibilityCommand")
// var Sa_     = new g.Y("loadMarkersCommand")
// var yX_     = new g.Y("suggestedActionDataViewModel")
// var r7K     = new g.Y("timelyActionViewModel")
// var o2n     = new g.Y("timelyActionsOverlayViewModel")
// var wPR     = new g.Y("productListItemRenderer")
// var Ea7     = new g.Y("shoppingOverlayRenderer")
// var Vrm     = new g.Y("musicEmbeddedPlayerOverlayVideoDetailsRenderer")
// var JXm     = new g.Y("adFeedbackEndpoint")
// var Rry     = new g.Y("menuEndpoint")
// var kI7     = new g.Y("phoneDialerEndpoint")
// var Y0d     = new g.Y("sendSmsEndpoint")
// var a6O     = new g.Y("copyTextEndpoint")
// var pK0     = new g.Y("shareEndpoint")
// var QrK     = new g.Y("shareEntityEndpoint")
// var ca7     = new g.Y("shareEntityServiceEndpoint")
// var WJm     = new g.Y("webPlayerShareEntityServiceEndpoint")
// g.s8        = new g.Y("urlEndpoint")
// g.nl        = new g.Y("watchEndpoint")
// var mUO     = new g.Y("watchPlaylistEndpoint")
// var BJ7     = new g.Y("compositeVideoOverlayRenderer")
// var xUn     = new g.Y("miniplayerRenderer")
// var oiw     = new g.Y("paidContentOverlayRenderer")
// var EOK     = new g.Y("playerMutedAutoplayOverlayRenderer")
// var szm     = new g.Y("playerMutedAutoplayEndScreenRenderer")
// var Nxw     = new g.Y("unserializedPlayerResponse")
// var at7     = new g.Y("unserializedPlayerResponse")
// var qYm     = new g.Y("playlistEditEndpoint")
// var Wq      = new g.Y("buttonRenderer")
// var O4      = new g.Y("toggleButtonRenderer")
// var wz0     = new g.Y("counterfactualRenderer")
// var DUy     = new g.Y("resolveUrlCommandMetadata")
// var H5w     = new g.Y("modifyChannelNotificationPreferenceEndpoint")
// var eTK     = new g.Y("pingingEndpoint")
// var NJy     = new g.Y("unsubscribeEndpoint")
// g.dA        = new g.Y("subscribeButtonRenderer")
// var yan     = new g.Y("subscribeEndpoint")
// var NQy     = new g.Y("buttonViewModel")
// var be0     = new g.Y("qrCodeRenderer")
// var HQO     = new g.Y("autoplaySwitchButtonRenderer")
// pD          = new g.Y("decoratedPlayerBarRenderer")
// N3W         = new g.Y("chapteredPlayerBarRenderer")
// haO         = new g.Y("multiMarkersPlayerBarRenderer")
// y57         = new g.Y("chapterRenderer")
// g.EBW       = new g.Y("markerRenderer")
// var gB0     = new g.Y("decoratedPlayheadRenderer")
// var iQx     = new g.Y("desktopOverlayConfigRenderer")
// var g3d     = new g.Y("engagementPanelSectionListRenderer")
// var NoW     = new g.Y("gatedActionsOverlayViewModel")
// var MH3     = new g.Y("heatMarkerRenderer")
// var dG7     = new g.Y("heatmapRenderer")
// var xPx     = new g.Y("playlistPanelRenderer")
// var vLm     = new g.Y("productUpsellSuggestedActionViewModel")
// var fP      = new g.Y("suggestedActionTimeRangeTrigger")
// var as3     = new g.Y("suggestedActionsRenderer")
// var GB7     = new g.Y("suggestedActionRenderer")
// var L6_     = new g.Y("timedMarkerDecorationRenderer")
// var kxK     = new g.Y("cipher")
// var ird     = new g.Y("playerVars")
// var GAm     = new g.Y("playerVars")

// ---------------------------------------------------------------------------
// Enums (lines ~65602-65689, 65815-65820, 65923-65929, 66608-66615)
// ---------------------------------------------------------------------------

/**
 * Client application type enum — maps short keys to numeric IDs.
 *
 * [was: Hyd]
 *
 * @enum {number}
 */
export const ClientType = {
  UNKNOWN: 0,               // was: n$y
  WEB: 1,                   // was: WiA
  MWEB: 32,                 // was: Qt2
  MWEB_TIER_2: 61,          // was: Um0
  WEB_UNPLUGGED: 67,        // was: k7e
  TVHTML5: 103,             // was: udA (for error compat)
  WEB_CREATOR: 86,          // was: r3A
  WEB_EMBEDDED_PLAYER: 42,  // was: MtF
  WEB_REMIX: 60,            // was: KiC
  WEB_KIDS: 62,             // was: a7a
  WEB_MUSIC_ANALYTICS: 73,  // was: P3F
  MWEB_MUSIC: 76,           // was: xm0
  WEB_INTERNAL_ANALYTICS: 88,  // was: hee
  WEB_EXPERIMENTS: 90,      // was: Dme
  WEB_PARENT_TOOLS: 99,     // was: gxa
  WEB_PHONE_VERIFICATION: 98, // was: A3C
  WEB_UNPLUGGED_ONBOARDING: 100, // was: XwG
  WEB_AUTH: 102,             // was: y3e
  ANDROID_TESTSUITE: 41,    // was: HX0
  ANDROID_CREATOR: 69,      // was: J3J
  ANDROID_KIDS: 70,         // was: l7e
  ANDROID_MUSIC: 71,        // was: st0
  IOS: 5,                   // was: IOS
  ANDROID: 3,               // was: ANDROID
  IOS_EMBEDDED_PLAYER: 15,  // was: eY
  IOS_MUSIC: 92,            // was: MG
  IOS_UNPLUGGED: 40,        // was: fH
  IOS_CREATOR: 25,          // was: wu
  IOS_KIDS: 17,             // was: aQ
  TVHTML5_KIDS: 19,         // was: IQ
  TVHTML5_CAST: 64,         // was: pH
  TVHTML5_UNPLUGGED: 66,    // was: ze
  TVHTML5_MUSIC: 26,        // was: AM
  TVHTML5_SIMPLY: 22,       // was: KH
  TVHTML5_SIMPLY_EMBEDDED_PLAYER: 33, // was: CH
  TV_APPLE: 68,             // was: xE
  TVLITE: 35,               // was: yN
  GOOGLE_ASSISTANT: 53,     // was: jY
  TV_GOOGLE_CAST: 37,       // was: QN
  TV_UNPLUGGED_CAST: 39,    // was: W$
  MEDIA_CONNECT_FRONTEND: 7, // was: HOe
  ANDROID_LITE: 57,         // was: JeF
  ANDROID_AUTOMOTIVE: 43,   // was: l10
  ANDROID_VR: 59,           // was: ZOF
  GOOGLE_LENS: 93,          // was: skH
  WEB_HEROES: 74,           // was: Op
  WEB_GAMING: 75,           // was: ce2
  WEB_SHOPPING: 85,         // was: dQA
  TVHTML5_FOR_KIDS: 65,     // was: LIe
  IOS_LIVE_CREATION: 80,    // was: Gya
  TVHTML5_YONGLE: 8,        // was: v$I
  TVHTML5_LIVING_ROOM: 10,  // was: kyG
  IOS_MESSAGES_EXTENSION: 58, // was: o$G
  TVHTML5_UNPLUGGED_SIMPLY: 63, // was: N3e
  ANDROID_TV: 72,           // was: B30
  TVHTML5_SIMPLY_KIDS: 23,  // was: zI
  ANDROID_EMBEDDED_PLAYER: 11, // was: dmI
  ANDROID_UNPLUGGED: 13,    // was: LiG
  ANDROID_MUSIC_A2: 12,     // was: RA
  IOS_UPTIME: 16,           // was: g$F
  ANDROID_TESTSUITE_2: 56,  // was: jtM
  TV_COBALT: 31,            // was: qOM
  WEB_MUSIC: 77,            // was: Qi
  WEB_SHOPPING_2: 84,       // was: Mo
  WEB_UNKNOWN_87: 87,       // was: C3e
  WEB_UNKNOWN_89: 89,       // was: Kb
  WEB_UNKNOWN_94: 94,       // was: Q5
  WEB_UNKNOWN_95: 95,       // was: bI
  OS: 2,                    // was: OS
  ANDROID_PRODUCER: 54,     // was: YW
  ANDROID_TESTSUITE_3: 14,  // was: S3
  IOS_PRODUCER: 91,         // was: aA
  ANDROID_PRODUCER_2: 55,   // was: R2
  TVHTML5_CAST_2: 24,       // was: FH
  TVHTML5_AUDIO: 20,        // was: Ep
  ANDROID_MUSIC_2: 18,      // was: mP
  IOS_TESTSUITE: 21,        // was: TI
  ANDROID_AUTOMOTIVE_2: 104, // was: e1
  TVHTML5_UNPLUGGED_2: 30,  // was: pM
  TVHTML5_SIMPLY_2: 29,     // was: Ai
  TVHTML5_KIDS_2: 28,       // was: j1
  UNKNOWN_101: 101,         // was: bXa
  TV_GENERIC: 34,           // was: MO
  TV_GENERIC_2: 36,         // was: IA
  TV_GENERIC_3: 38,         // was: b2
};

/**
 * Embedded player mode enum.
 *
 * [was: $SW]
 *
 * @enum {string}
 */
export const EmbeddedPlayerMode = {
  UNKNOWN: "EMBEDDED_PLAYER_MODE_UNKNOWN",  // was: dC
  DEFAULT: "EMBEDDED_PLAYER_MODE_DEFAULT",  // was: sD
  PFP: "EMBEDDED_PLAYER_MODE_PFP",         // was: cE
  PFL: "EMBEDDED_PLAYER_MODE_PFL",         // was: Zi
};

/**
 * Web display mode enum.
 *
 * [was: jPW]
 *
 * @enum {string}
 */
export const WebDisplayMode = {
  UNKNOWN: "WEB_DISPLAY_MODE_UNKNOWN",       // was: OX0
  BROWSER: "WEB_DISPLAY_MODE_BROWSER",       // was: I70
  MINIMAL_UI: "WEB_DISPLAY_MODE_MINIMAL_UI", // was: iXF
  STANDALONE: "WEB_DISPLAY_MODE_STANDALONE", // was: ze0
  FULLSCREEN: "WEB_DISPLAY_MODE_FULLSCREEN", // was: pwe
};

/**
 * Living-room app mode enum.
 *
 * [was: gL3]
 *
 * @enum {string}
 */
export const LivingRoomAppMode = {
  UNSPECIFIED: "LIVING_ROOM_APP_MODE_UNSPECIFIED", // was: NG
  MAIN: "LIVING_ROOM_APP_MODE_MAIN",              // was: B$
  KIDS: "LIVING_ROOM_APP_MODE_KIDS",              // was: LH
  MUSIC: "LIVING_ROOM_APP_MODE_MUSIC",            // was: Ge
  UNPLUGGED: "LIVING_ROOM_APP_MODE_UNPLUGGED",    // was: v$
  GAMING: "LIVING_ROOM_APP_MODE_GAMING",          // was: du
};

// ---------------------------------------------------------------------------
// Concrete entity-key collectors: simple (empty) (lines ~65574-66003)
// ---------------------------------------------------------------------------
// These renderers declare no dependent entity keys.

/** [was: xCw] */ export class CommandContextProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: nXW] */ export class UnknownCommandProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: DCK] */ export class ConfigGroupProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: Zym] */ export class EmbedsInfoProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: EXK] */ export class EmbedErrorProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: jfO] */ export class DescriptionFallbackProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: gXd] */ export class FeedbackProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: Oy3] */ export class FeedbackProcessor2 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: fGm] */ export class IconSourceProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: Gl7] */ export class CallToActionProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: $Cy] */ export class CallToActionProcessor2 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: C9w] */ export class DismissOverlayProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: MOX] */ export class DismissOverlayProcessor2 extends MenuActionProcessor { getEntityKeys() { return []; } }

// ---------------------------------------------------------------------------
// Concrete: renderers that return empty keys (lines 66005-66009)
// ---------------------------------------------------------------------------

/** Menu renderer with no entity-key dependencies. [was: Juw] */
export class EmptyMenuRenderer extends MenuActionProcessor {
  getEntityKeys() { // was: O
    return [];
  }
}

// ---------------------------------------------------------------------------
// Download menu renderers (lines ~66011-66041)
// ---------------------------------------------------------------------------

/**
 * Downloads-list menu renderer. Collects entity keys from downloadsList,
 * smartDownloadsList, recommendedDownloadsList, and refresh fields.
 *
 * [was: Rjd]
 */
export class DownloadsListMenuRenderer extends MenuActionProcessor {
  /** @returns {string[]} deduplicated entity keys */
  getEntityKeys() { // was: O
    const keys = []; // was: Q
    if (this.data.downloadsList) keys.push(this.data.downloadsList);
    if (this.data.smartDownloadsList) keys.push(this.data.smartDownloadsList);
    if (this.data.recommendedDownloadsList) keys.push(this.data.recommendedDownloadsList);
    if (this.data.refresh) keys.push(this.data.refresh);
    return [...new Set(keys)];
  }
}

/**
 * Download items menu renderer. Collects entity keys from a refresh field
 * and iterates individual download entries via DownloadItemKeyCollector.
 *
 * [was: Yr0]
 */
export class DownloadItemsMenuRenderer extends MenuActionProcessor {
  /** @returns {string[]} deduplicated entity keys */
  getEntityKeys() { // was: O
    const keys = []; // was: Q
    if (this.data.refresh) keys.push(this.data.refresh);
    if (this.data.downloads) {
      for (const entry of this.data.downloads) { // was: c
        keys.push(...new DownloadItemKeyCollector(entry).getEntityKeys());
      }
    }
    return [...new Set(keys)];
  }
}

/**
 * Single download item key collector. Extracts video, playlist,
 * videoItem, and playlistItem keys.
 *
 * [was: kl7]
 */
export class DownloadItemKeyCollector extends EntityKeyCollector {
  /** @returns {string[]} deduplicated entity keys */
  getEntityKeys() { // was: O
    const keys = []; // was: Q
    if (this.data.video) keys.push(this.data.video);
    if (this.data.playlist) keys.push(this.data.playlist);
    if (this.data.videoItem) keys.push(this.data.videoItem);
    if (this.data.playlistItem) keys.push(this.data.playlistItem);
    return [...new Set(keys)];
  }
}

// ---------------------------------------------------------------------------
// Offline / local-image entity collectors (lines ~66043-66060)
// ---------------------------------------------------------------------------

/**
 * Collects localImageEntities keys.
 * [was: pA7]
 */
export class LocalImageEntitiesProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.localImageEntities) keys.push(...this.data.localImageEntities);
    return [...new Set(keys)];
  }
}

/**
 * Collects playbackData, localImageEntities, and videoDownloadContextEntity.
 * [was: Qj3]
 */
export class PlaybackDataWithImagesProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.playbackData) keys.push(this.data.playbackData);
    if (this.data.localImageEntities) keys.push(...this.data.localImageEntities);
    if (this.data.videoDownloadContextEntity) keys.push(this.data.videoDownloadContextEntity);
    return [...new Set(keys)];
  }
}

// ---------------------------------------------------------------------------
// More empty-key processors (lines ~66061-66219)
// ---------------------------------------------------------------------------

/** [was: cXW] */ export class EmptyProcessor1 extends MenuActionProcessor { getEntityKeys() { return []; } }

/**
 * Collects fakeChildren keys.
 * [was: WoK]
 */
export class FakeChildrenProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.fakeChildren) keys.push(...this.data.fakeChildren);
    return [...new Set(keys)];
  }
}

/**
 * Collects video, playbackData, and offlineVideoPolicy keys.
 * [was: mkK]
 */
export class OfflineVideoPolicyProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.video) keys.push(this.data.video);
    if (this.data.playbackData) keys.push(this.data.playbackData);
    if (this.data.offlineVideoPolicy) keys.push(this.data.offlineVideoPolicy);
    return [...new Set(keys)];
  }
}

/** [was: Kod] */ export class EmptyProcessor2 extends MenuActionProcessor { getEntityKeys() { return []; } }

/**
 * Channel owner / videos / collaborators / downloadState / refresh.
 * [was: TIK]
 */
export class ChannelDownloadsProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.channelOwner) keys.push(this.data.channelOwner);
    if (this.data.videos) keys.push(...this.data.videos);
    if (this.data.collaboratorChannels) keys.push(...this.data.collaboratorChannels);
    if (this.data.downloadState) keys.push(this.data.downloadState);
    if (this.data.refresh) keys.push(this.data.refresh);
    return [...new Set(keys)];
  }
}

/**
 * Video + channelContributor keys.
 * [was: oa7]
 */
export class VideoContributorProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.video) keys.push(this.data.video);
    if (this.data.channelContributor) keys.push(this.data.channelContributor);
    return [...new Set(keys)];
  }
}

/**
 * Recommended video metadata sub-collector (delegates to inner metadata).
 * [was: Uk0]
 */
export class RecommendedVideoMetadataCollector extends EntityKeyCollector {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.recommendedVideoMetadata) {
      keys.push(...new RecommendedVideoImageCollector(this.data.recommendedVideoMetadata).getEntityKeys());
    }
    return [...new Set(keys)];
  }
}

/**
 * Extracts localImageEntities and videoDownloadContextEntity from
 * recommended video metadata.
 * [was: rXW]
 */
export class RecommendedVideoImageCollector extends EntityKeyCollector {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.localImageEntities) keys.push(...this.data.localImageEntities);
    if (this.data.videoDownloadContextEntity) keys.push(this.data.videoDownloadContextEntity);
    return [...new Set(keys)];
  }
}

/**
 * Extracts playbackPosition.
 * [was: IHy]
 */
export class PlaybackPositionCollector extends EntityKeyCollector {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.playbackPosition) keys.push(this.data.playbackPosition);
    return [...new Set(keys)];
  }
}

/**
 * Collects owner, downloadState, userState (via PlaybackPositionCollector),
 * and additionalMetadata (via RecommendedVideoMetadataCollector).
 * [was: XKx]
 */
export class VideoCardProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.owner) keys.push(this.data.owner);
    if (this.data.downloadState) keys.push(this.data.downloadState);
    if (this.data.userState) {
      keys.push(...new PlaybackPositionCollector(this.data.userState).getEntityKeys());
    }
    if (this.data.additionalMetadata) {
      keys.push(...new RecommendedVideoMetadataCollector(this.data.additionalMetadata).getEntityKeys());
    }
    return [...new Set(keys)];
  }
}

/**
 * Collects userChannelDetails.
 * [was: AXw]
 */
export class UserChannelProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.userChannelDetails) keys.push(this.data.userChannelDetails);
    return [...new Set(keys)];
  }
}

/**
 * Collects channelOwner, playbackPosition, localImageEntities, downloadStatus.
 * [was: erR]
 */
export class ChannelVideoStatusProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.channelOwner) keys.push(this.data.channelOwner);
    if (this.data.playbackPosition) keys.push(this.data.playbackPosition);
    if (this.data.localImageEntities) keys.push(...this.data.localImageEntities);
    if (this.data.downloadStatus) keys.push(this.data.downloadStatus);
    return [...new Set(keys)];
  }
}

/** [was: V2w] */ export class EmptyProcessor3 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: BIn] */ export class EmptyProcessor4 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: xk7] */ export class EmptyProcessor5 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: q07] */ export class EmptyProcessor6 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: nan] */ export class EmptyProcessor7 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: Dk3] */ export class EmptyProcessor8 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: t2K] */ export class EmptyProcessor9 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: HBO] */ export class EmptyProcessor10 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: NIn] */ export class EmptyProcessor11 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: S0O] */ export class EmptyProcessor12 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: Fow] */ export class EmptyProcessor13 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: ZBn] */ export class EmptyProcessor14 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: sjm] */ export class EmptyProcessor15 extends MenuActionProcessor { getEntityKeys() { return []; } }

// ---------------------------------------------------------------------------
// Music / composite source collectors (lines ~66252-66428)
// ---------------------------------------------------------------------------

/**
 * Collects compositeSourceKeys.
 * [was: dk7]
 */
export class CompositeSourceProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.compositeSourceKeys) keys.push(...this.data.compositeSourceKeys);
    return [...new Set(keys)];
  }
}

/**
 * Collects trackDownloadMetadatas.
 * [was: Lom]
 */
export class TrackDownloadMetadataProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.trackDownloadMetadatas) keys.push(...this.data.trackDownloadMetadatas);
    return [...new Set(keys)];
  }
}

/**
 * Collects all download category keys: downloadedTracks, smartDownloadedTracks,
 * downloadedEpisodes, downloadedAlbumReleases, smartDownloadedAlbumReleases,
 * downloadedPlaylists, smartDownloadedPlaylists, metadataOnlyTracks.
 *
 * [was: wKn]
 */
export class AllDownloadsProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.downloadedTracks) keys.push(...this.data.downloadedTracks);
    if (this.data.smartDownloadedTracks) keys.push(...this.data.smartDownloadedTracks);
    if (this.data.downloadedEpisodes) keys.push(...this.data.downloadedEpisodes);
    if (this.data.downloadedAlbumReleases) keys.push(...this.data.downloadedAlbumReleases);
    if (this.data.smartDownloadedAlbumReleases) keys.push(...this.data.smartDownloadedAlbumReleases);
    if (this.data.downloadedPlaylists) keys.push(...this.data.downloadedPlaylists);
    if (this.data.smartDownloadedPlaylists) keys.push(...this.data.smartDownloadedPlaylists);
    if (this.data.metadataOnlyTracks) keys.push(...this.data.metadataOnlyTracks);
    return [...new Set(keys)];
  }
}

/**
 * Collects trackDownloadMetadatas (variant).
 * [was: bBw]
 */
export class TrackDownloadMetadataProcessor2 extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.trackDownloadMetadatas) keys.push(...this.data.trackDownloadMetadatas);
    return [...new Set(keys)];
  }
}

/**
 * Collects playbackData, localImageEntities, videoDownloadContextEntity.
 * [was: jjw]
 */
export class VideoDownloadContextProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.playbackData) keys.push(this.data.playbackData);
    if (this.data.localImageEntities) keys.push(...this.data.localImageEntities);
    if (this.data.videoDownloadContextEntity) keys.push(this.data.videoDownloadContextEntity);
    return [...new Set(keys)];
  }
}

/**
 * Music album release / artist detail processor.
 * Collects musicLibraryStatusEntity, primaryArtists, details, userDetails,
 * tracks, share, downloadMetadata, refresh.
 *
 * [was: gax]
 */
export class MusicAlbumDetailProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.musicLibraryStatusEntity) keys.push(this.data.musicLibraryStatusEntity);
    if (this.data.primaryArtists) keys.push(...this.data.primaryArtists);
    if (this.data.details) keys.push(this.data.details);
    if (this.data.userDetails) keys.push(this.data.userDetails);
    if (this.data.tracks) keys.push(...this.data.tracks);
    if (this.data.share) keys.push(this.data.share);
    if (this.data.downloadMetadata) keys.push(this.data.downloadMetadata);
    if (this.data.refresh) keys.push(this.data.refresh);
    return [...new Set(keys)];
  }
}

/**
 * Album release with tracks.
 * [was: OB_]
 */
export class AlbumReleaseTracksProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.albumRelease) keys.push(this.data.albumRelease);
    if (this.data.tracks) keys.push(...this.data.tracks);
    return [...new Set(keys)];
  }
}

/**
 * Album release only.
 * [was: fH7]
 */
export class AlbumReleaseProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.albumRelease) keys.push(this.data.albumRelease);
    return [...new Set(keys)];
  }
}

/**
 * Artist details + userDetails.
 * [was: vax]
 */
export class ArtistDetailsProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.details) keys.push(this.data.details);
    if (this.data.userDetails) keys.push(this.data.userDetails);
    return [...new Set(keys)];
  }
}

/**
 * Parent artist reference.
 * [was: aHd]
 */
export class ParentArtistProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.parentArtist) keys.push(this.data.parentArtist);
    return [...new Set(keys)];
  }
}

/**
 * Parent artist reference (variant).
 * [was: GIW]
 */
export class ParentArtistProcessor2 extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.parentArtist) keys.push(this.data.parentArtist);
    return [...new Set(keys)];
  }
}

/** [was: $k7] */ export class EmptyMusicProcessor1 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: PTw] */ export class EmptyMusicProcessor2 extends MenuActionProcessor { getEntityKeys() { return []; } }

/**
 * Playlist detail processor. Collects tracks, refresh, musicLibraryStatusEntity,
 * details, downloadMetadata, sideloadMetadata, userDetails, entryCollection,
 * share, and podcast additional metadata (via PodcastMetadataCollector).
 *
 * [was: uP0]
 */
export class PlaylistDetailProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.tracks) keys.push(...this.data.tracks);
    if (this.data.refresh) keys.push(this.data.refresh);
    if (this.data.musicLibraryStatusEntity) keys.push(this.data.musicLibraryStatusEntity);
    if (this.data.details) keys.push(this.data.details);
    if (this.data.downloadMetadata) keys.push(this.data.downloadMetadata);
    if (this.data.sideloadMetadata) keys.push(this.data.sideloadMetadata);
    if (this.data.userDetails) keys.push(this.data.userDetails);
    if (this.data.entryCollection) keys.push(this.data.entryCollection);
    if (this.data.share) keys.push(this.data.share);
    if (this.data.podcastShowAdditionalMetadata) {
      keys.push(...new PodcastMetadataCollector(this.data.podcastShowAdditionalMetadata).getEntityKeys());
    }
    return [...new Set(keys)];
  }
}

/**
 * Podcast show metadata sub-collector. Extracts creatorEntity.
 * [was: lHK]
 */
export class PodcastMetadataCollector extends EntityKeyCollector {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.creatorEntity) keys.push(this.data.creatorEntity);
    return [...new Set(keys)];
  }
}

/** [was: hrx] */ export class EmptyMusicProcessor3 extends MenuActionProcessor { getEntityKeys() { return []; } }

/**
 * Music track detail processor. Collects musicLibraryStatusEntity, artists,
 * audioModeVersion, videoModeVersion, userDetails, details, albumRelease,
 * share, libraryEdit, downloadMetadata, playbackPosition, lyrics.
 *
 * [was: zrK]
 */
export class MusicTrackDetailProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.musicLibraryStatusEntity) keys.push(this.data.musicLibraryStatusEntity);
    if (this.data.artists) keys.push(...this.data.artists);
    if (this.data.audioModeVersion) keys.push(this.data.audioModeVersion);
    if (this.data.videoModeVersion) keys.push(this.data.videoModeVersion);
    if (this.data.userDetails) keys.push(this.data.userDetails);
    if (this.data.details) keys.push(this.data.details);
    if (this.data.albumRelease) keys.push(this.data.albumRelease);
    if (this.data.share) keys.push(this.data.share);
    if (this.data.libraryEdit) keys.push(this.data.libraryEdit);
    if (this.data.downloadMetadata) keys.push(this.data.downloadMetadata);
    if (this.data.playbackPosition) keys.push(this.data.playbackPosition);
    if (this.data.lyrics) keys.push(this.data.lyrics);
    return [...new Set(keys)];
  }
}

/**
 * Parent track reference.
 * [was: CTO]
 */
export class ParentTrackProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.parentTrack) keys.push(this.data.parentTrack);
    return [...new Set(keys)];
  }
}

/**
 * Parent track reference (variant).
 * [was: M2m]
 */
export class ParentTrackProcessor2 extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.parentTrack) keys.push(this.data.parentTrack);
    return [...new Set(keys)];
  }
}

// ---------------------------------------------------------------------------
// Endpoint / overlay renderers with empty keys (lines ~66442-66604)
// ---------------------------------------------------------------------------

/** [was: KJw] */ export class ShareEndpointProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: TJ7] */ export class ShareEndpointProcessor2 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: oLW] */ export class CopyTextProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: rad] */ export class PhoneDialerProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }

/**
 * Ads playback data collector. Collects transfer, adsPlaybackData,
 * drmLicense, offlineVideoPolicy, videoDownloadContextEntity.
 *
 * [was: UU7]
 */
export class AdsPlaybackDataProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.transfer) keys.push(this.data.transfer);
    if (this.data.adsPlaybackData) keys.push(...this.data.adsPlaybackData);
    if (this.data.drmLicense) keys.push(this.data.drmLicense);
    if (this.data.offlineVideoPolicy) keys.push(this.data.offlineVideoPolicy);
    if (this.data.videoDownloadContextEntity) keys.push(this.data.videoDownloadContextEntity);
    return [...new Set(keys)];
  }
}

/** [was: Is0] */ export class EmptyTransferProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }

/**
 * Offline video streams + caption tracks.
 * [was: XQw]
 */
export class OfflineStreamsProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.offlineVideoStreams) keys.push(...this.data.offlineVideoStreams);
    if (this.data.captionTrack) keys.push(...this.data.captionTrack);
    return [...new Set(keys)];
  }
}

/** [was: Aax] */ export class EmptyStreamProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: eI7] */ export class EmptyStreamProcessor2 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: VsW] */ export class EmptyOverlayProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: nLy] */ export class PlaylistEditProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: ts_] */ export class ResolveUrlProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: i5K] */ export class SubscribeProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: SYO] */ export class SubscribeEndpointProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: FJO] */ export class UnsubscribeProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: Z5W] */ export class NotificationProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: ELK] */ export class ButtonViewModelProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: srx] */ export class EmptyButtonProcessor1 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: dU0] */ export class EmptyButtonProcessor2 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: LJ_] */ export class EmptyButtonProcessor3 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: wQ0] */ export class EmptyButtonProcessor4 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: b57] */ export class EmptyButtonProcessor5 extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: jrx] */ export class QrCodeProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: O57] */ export class LivingRoomProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: fsO] */ export class AutoplayProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: $U_] */ export class PlayerBarProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: PqK] */ export class HeatmapProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: ls7] */ export class PlaylistPanelProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: uad] */ export class SuggestedActionProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: hIw] */ export class TimedMarkerProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: zIX] */ export class EngagementPanelProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }
/** [was: CqK] */ export class DesktopOverlayProcessor extends MenuActionProcessor { getEntityKeys() { return []; } }

// ---------------------------------------------------------------------------
// Channel entity-key collectors (lines ~65839-65887)
// ---------------------------------------------------------------------------

/**
 * Channel entity collector — alternateChannel, alternateChannelList,
 * oneofChannelEntity.
 * [was: sfx]
 */
export class ChannelEntityProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.alternateChannel) keys.push(this.data.alternateChannel);
    if (this.data.alternateChannelList) keys.push(...this.data.alternateChannelList);
    if (this.data.oneofChannelEntity) keys.push(this.data.oneofChannelEntity);
    return [...new Set(keys)];
  }
}

/**
 * Entry collection processor.
 * [was: dCW]
 */
export class EntryCollectionProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.entryCollection) keys.push(this.data.entryCollection);
    return [...new Set(keys)];
  }
}

/**
 * Playlist entry processor. Collects parentPlaylist and delegates to
 * PlaylistEntryVideoCollector for each entry.
 * [was: wAX]
 */
export class PlaylistEntryProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.parentPlaylist) keys.push(this.data.parentPlaylist);
    if (this.data.entries) {
      for (const entry of this.data.entries) { // was: c
        keys.push(...new PlaylistEntryVideoCollector(entry).getEntityKeys());
      }
    }
    return [...new Set(keys)];
  }
}

/**
 * Single playlist entry video key extractor.
 * [was: LP3]
 */
export class PlaylistEntryVideoCollector extends EntityKeyCollector {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.video) keys.push(this.data.video);
    return [...new Set(keys)];
  }
}

/**
 * Description entity / creators / theBiggestFan.
 * [was: by3]
 */
export class DescriptionEntityProcessor extends MenuActionProcessor {
  getEntityKeys() { // was: O
    const keys = [];
    if (this.data.descriptionEntity) keys.push(this.data.descriptionEntity);
    if (this.data.creators) keys.push(...this.data.creators);
    if (this.data.theBiggestFan) keys.push(this.data.theBiggestFan);
    return [...new Set(keys)];
  }
}

// ---------------------------------------------------------------------------
// Innertube action endpoint path arrays (lines ~66986-66999)
// ---------------------------------------------------------------------------

/**
 * Innertube action endpoint paths used by the player to resolve
 * service calls. Each array entry is a path segment for the
 * "/youtubei/v1/{...}" REST endpoint.
 */
export const actionEndpoints = {
  att:                  ["att/get"],                              // was: ymX
  embeddedPlayer:       ["embedded_player"],                      // was: uo3
  accountSettings:      ["account/get_setting_values"],           // was: QKw
  sharePanel:           ["share/get_share_panel"],                // was: ce7
  webPlayerSharePanel:  ["share/get_web_player_share_panel"],     // was: W2O
  feedback:             ["feedback"],                             // was: mdO
  notificationPref:     ["notification/modify_channel_preference"], // was: K2d
  player:               ["player"],                               // was: m3O
  playlistEdit:         ["browse/edit_playlist"],                 // was: Tp7
  reelWatch:            ["reel/reel_item_watch"],                 // was: U37
  setSetting:           ["account/set_setting"],                  // was: mb_
  subscribe:            ["subscription/subscribe"],               // was: oe7
  unsubscribe:          ["subscription/unsubscribe"],             // was: rem
  watchNext:            ["next", "unplugged/watch_next"],         // was: ot7
};
