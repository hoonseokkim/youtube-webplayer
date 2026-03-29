import { dispose } from '../ads/dai-cue-range.js';
import { handleError } from './context-updates.js';
import { getPlayerState } from './playback-bridge.js';
import { getPreferredQuality, sendAbandonmentPing, togglePictureInPicture } from './player-api.js';
import { playVideo } from './player-events.js';
import { getCurrentTime, getDuration, getPlaybackQuality, getPlaybackRate, isHdr, setLoop, setPlaybackRate } from './time-tracking.js';

/**
 * DrmAdapter — adapter / proxy for a DRM-capable media pipeline.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~87033–87525
 *
 * Extends Disposable (g.qK) and wraps an inner pipeline instance
 * (`this.pipeline_`, was `this.EH`).  Nearly every method is a thin
 * delegation to the wrapped pipeline, which makes this class act as a
 * transparent adapter that can intercept or override specific calls
 * (e.g. `getStartTime()` always returns 0, and `getVideoLoadedFraction()`
 * has custom logic for completed downloads).
 *
 * The adapter also exposes a `context` object (`this.Rk`) that external
 * consumers can use to obtain the inner pipeline reference.
 *
 * Prototype methods assigned after the class body (lines 87527-87533)
 * add six additional callback slots via the `c3()` helper:
 *   D0 = c3(51), h2 = c3(39), SQ = c3(34),
 *   q6 = c3(28), f2 = c3(22), q3 = c3(14)
 *
 * [was: g.DX]
 */

import { Disposable } from '../core/disposable.js';
import { propagateStartupTimings } from './time-tracking.js'; // was: Iv()
import { garbageCollectCueRanges } from '../ads/dai-cue-range.js'; // was: Ks
import { hasAdPlacements } from './caption-manager.js'; // was: Ym
import { signalFZUpdate } from './context-updates.js'; // was: Ig()
import { getStreamInfo } from './context-updates.js'; // was: So()
import { getSelectableVideoFormats } from './context-updates.js'; // was: SZ()
import { getSelectableAudioFormats } from './context-updates.js'; // was: L3()
import { getTimeHead } from './time-tracking.js'; // was: TH()
import { isGaplessShortEligible } from '../media/seek-controller.js'; // was: wA
import { getSeekableRange } from './time-tracking.js'; // was: sR()
import { getWallClockTime } from './time-tracking.js'; // was: Kk()
import { getUNDelay } from './player-events.js'; // was: UN
import { getMediaElementTime } from './time-tracking.js'; // was: A6()
import { getQoeTimestamp } from './time-tracking.js'; // was: jM()
import { isLooping } from './time-tracking.js'; // was: mE()
import { getMediaSource } from './context-updates.js'; // was: pK()
import { getSeekableRangeStart } from './time-tracking.js'; // was: bC()
import { getSeekableStart } from './time-tracking.js'; // was: v4()
import { LatencyReporter } from '../ads/ad-interaction.js'; // was: p2
import { getCurrentScreenId } from '../modules/remote/mdx-client.js'; // was: p1
import { setBgeNetworkStatus } from '../network/uri-utils.js'; // was: HI
import { actionCompanionAdRenderer } from '../core/misc-helpers.js'; // was: zm
import { getOwnerDocument } from './video-loader.js'; // was: V4
import { getFormatQualityConstraint } from './context-updates.js'; // was: G3()
import { publishCueRangeEvent } from './playback-state.js'; // was: rW
import { getStreamTimeOffsetNQ } from './time-tracking.js'; // was: NQ()
import { getDebugInfo } from './time-tracking.js'; // was: I1()
import { removeRootClass } from './playback-bridge.js'; // was: YS
import { getVideoId } from './time-tracking.js'; // was: MY()
import { getLoadFraction } from './time-tracking.js'; // was: TV()
import { clientHintsOverride } from '../proto/messages-core.js'; // was: Sf
import { GelPayloadStore } from '../data/idb-operations.js'; // was: fL
import { iterateCursor } from '../data/idb-transactions.js'; // was: zE
import { isLoaderAvailable } from './time-tracking.js'; // was: A_()
import { SuggestedActionBadge } from '../media/live-state.js'; // was: aN
import { createChildCueRange } from './state-init.js'; // was: lM
import { dispatchAndPersistMutations } from '../modules/offline/entity-sync.js'; // was: lT
import { skipElement } from '../media/format-parser.js'; // was: ew
import { triggerIdleNetworkFetch } from './context-updates.js'; // was: hB()
import { getAdHandlerContext } from './playback-bridge.js'; // was: mQ
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { SYM_VALUE } from '../proto/message-setup.js'; // was: vk
import { getOrCreateRendererEntry } from '../ads/companion-layout.js'; // was: pz
import { setAttestationChallenge } from '../network/uri-utils.js'; // was: yJ
import { getMetricValues } from '../core/event-system.js'; // was: Ps
import { InjectionToken } from '../network/innertube-config.js'; // was: uu
import { setTimeLocked } from './time-tracking.js'; // was: Ht()
import { truncateValue } from '../data/gel-params.js'; // was: FY
import { checkAdExperiment } from './media-state.js'; // was: qP
import { lookupMetricIndex } from '../data/module-init.js'; // was: Zx
import { getChromeVersion } from '../core/composition-helpers.js'; // was: Dw
import { MeasurementHook } from '../data/module-init.js'; // was: H5
import { reevaluateFormat } from './context-updates.js'; // was: iE()
import { getAdContentVideoId } from '../media/seek-controller.js'; // was: Ah
import { getAudioTrack, getAvailableAudioTracks, getProximaLatencyPreference, getUserAudio51Preference, getUserPlaybackQualityPreference, hasSupportedAudio51Tracks, isProximaLatencyEligible, setProximaLatencyPreference, setUserAudio51Preference } from './player-api.js';
import { getPlaylistSequenceForTime, getStreamTimeOffset, isAtLiveHead, prefetchKeyPlay, prefetchJumpAhead, sendVideoStatsEngageEvent } from './time-tracking.js';
import { pauseVideo, stopVideo } from './player-events.js';
import { seekTo } from '../ads/dai-cue-range.js';

/* was: g.DX */
export class DrmAdapter extends Disposable {
  /**
   * @param {Object} pipeline — the inner media pipeline [was: Q / this.EH]
   */
  constructor(pipeline) {
    super();

    /** @private  Inner media pipeline being wrapped. [was: EH] */
    this.pipeline_ = pipeline;

    /**
     * Context object exposing a getter for the inner pipeline.
     * Consumed by external code that needs the raw pipeline reference.
     * @type {{ getPipeline: () => Object }}
     * [was: Rk]
     */
    this.context = {
      getPipeline: () => this.pipeline_, // was: Fi: () => this.EH
    };
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** @override  Dispose the inner pipeline then self. [was: WA] */
  dispose() {
    this.destroyPipeline_(); // was: this.j()
    super.dispose(); // was: super.WA()
  }

  /** @private  Dispose the inner pipeline. [was: j] */
  destroyPipeline_() {
    this.pipeline_.dispose();
  }

  // -----------------------------------------------------------------------
  // Cue-range / DRM / timeline management
  // -----------------------------------------------------------------------

  /**
   * Register a cue range with the inner pipeline.
   * @param {Object} cueRange [was: Q]
   *
   * was: addCueRange
   */
  addCueRange(cueRange) {
    this.pipeline_.addCueRange(cueRange);
  }

  /**
   * Handle a media-key update (EME key session message).
   * @param {*} keyData  [was: Q]
   * @param {*} param2   [was: c]
   *
   * was: Mp
   */
  onMediaKeyUpdate(keyData, param2) { // was: Mp
    this.pipeline_.Mp(keyData, param2);
  }

  /**
   * Initialise the DRM subsystem / timeline.
   *
   * was: Iv
   */
  initDrm() { // was: Iv
    this.pipeline_.propagateStartupTimings;
  }

  /**
   * Get the current timeline state.
   * @returns {*} timeline state value
   *
   * was: L7
   */
  getTimelineState() { // was: L7
    return this.pipeline_.L7();
  }

  /**
   * Check whether the wrapped pipeline is the same instance as `other`.
   * @param {Object} other
   * @returns {boolean}
   *
   * was: v2
   */
  isSamePipeline(other) { // was: v2
    return this.pipeline_ === other;
  }

  /**
   * Force-publish / refresh the pipeline state.
   *
   * was: V2 → calls this.EH.FP()
   */
  forcePublish() { // was: V2
    this.pipeline_.FP();
  }

  /**
   * Yr — forward to pipeline (purpose unclear, possibly DRM key rotation).
   * @param {*} param1 [was: Q]
   * @param {*} param2 [was: c]
   *
   * was: Yr
   */
  Yr(param1, param2) {
    this.pipeline_.Yr(param1, param2);
  }

  /**
   * Ks — forward to pipeline (possibly a capability query).
   * @param {*} param1 [was: Q]
   * @param {*} param2 [was: c]
   * @returns {*}
   *
   * was: Ks
   */
  garbageCollectCueRanges(param1, param2) {
    return this.pipeline_.garbageCollectCueRanges(param1, param2);
  }

  /**
   * Ym — forward to pipeline.
   * @param {*} param [was: Q]
   *
   * was: Ym
   */
  hasAdPlacements(param) {
    this.pipeline_.hasAdPlacements(param);
  }

  /**
   * Filter / refresh audio features.
   *
   * was: Ig
   */
  filterAudioFeatures() { // was: Ig
    this.pipeline_.signalFZUpdate;
  }

  /**
   * YH — forward to pipeline (audio-feature query).
   * @param {*} param [was: Q]
   * @returns {*}
   *
   * was: YH
   */
  YH(param) {
    return this.pipeline_.YH(param);
  }

  // -----------------------------------------------------------------------
  // Audio track accessors
  // -----------------------------------------------------------------------

  /**
   * @returns {*} current audio track descriptor
   * was: getAudioTrack
   */
  getAudioTrack() {
    return this.pipeline_.getAudioTrack();
  }

  /**
   * So — secondary audio track query.
   * @returns {*}
   * was: So
   */
  getStreamInfo {
    return this.pipeline_.getStreamInfo;
  }

  /**
   * @returns {Array} list of available audio tracks
   * was: getAvailableAudioTracks
   */
  getAvailableAudioTracks() {
    return this.pipeline_.getAvailableAudioTracks();
  }

  // -----------------------------------------------------------------------
  // Quality / format queries
  // -----------------------------------------------------------------------

  /**
   * @returns {Array} available quality levels
   * was: SZ
   */
  getAvailableQualityLevels() { // was: SZ
    return this.pipeline_.getSelectableVideoFormats;
  }

  /**
   * L3 — unknown (possibly codec info).
   * @returns {*}
   * was: L3
   */
  getSelectableAudioFormats {
    return this.pipeline_.getSelectableAudioFormats;
  }

  /**
   * @returns {string} client playback nonce (CPN)
   * was: Sr
   */
  getClientPlaybackNonce() { // was: Sr
    return this.getVideoData().clientPlaybackNonce;
  }

  /**
   * gj — forward to pipeline.
   * @returns {*}
   * was: gj
   */
  gj() {
    return this.pipeline_.gj();
  }

  /**
   * Et — forward to pipeline.
   * @returns {*}
   * was: Et
   */
  Et() {
    return this.pipeline_.Et();
  }

  /**
   * TH — forward to pipeline.
   * @returns {*}
   * was: TH
   */
  getTimeHead {
    return this.pipeline_.getTimeHead;
  }

  // -----------------------------------------------------------------------
  // Time / duration
  // -----------------------------------------------------------------------

  /**
   * @returns {number} current media time in seconds
   * was: getCurrentTime
   */
  getCurrentTime() {
    return this.pipeline_.getCurrentTime();
  }

  /**
   * mD — forward to pipeline (possibly media-data time).
   * @returns {*}
   * was: mD
   */
  mD() {
    return this.pipeline_.mD();
  }

  /**
   * yH — forward to pipeline.
   * @returns {*}
   * was: yH
   */
  yH() {
    return this.pipeline_.yH();
  }

  /**
   * wA — forward to pipeline.
   * @param {*} param [was: Q]
   * @returns {*}
   * was: wA
   */
  isGaplessShortEligible(param) {
    return this.pipeline_.isGaplessShortEligible(param);
  }

  /**
   * @param {boolean} [includeAds]
   * @returns {number} video duration in seconds
   * was: getDuration
   */
  getDuration(includeAds) {
    return this.pipeline_.getDuration(includeAds);
  }

  /**
   * sR — forward to pipeline.
   * @returns {*}
   * was: sR
   */
  getSeekableRange {
    return this.pipeline_.getSeekableRange;
  }

  /**
   * Kk — forward to pipeline.
   * @returns {*}
   * was: Kk
   */
  getWallClockTime {
    return this.pipeline_.getWallClockTime;
  }

  /**
   * kL — forward to pipeline.
   * @returns {*}
   * was: kL
   */
  kL() {
    return this.pipeline_.kL();
  }

  /**
   * UN — forward to pipeline.
   * @returns {*}
   * was: UN
   */
  getUNDelay() {
    return this.pipeline_.getUNDelay();
  }

  /**
   * A6 — forward to pipeline.
   * @returns {*}
   * was: A6
   */
  getMediaElementTime {
    return this.pipeline_.getMediaElementTime;
  }

  /**
   * ej — forward to pipeline.
   * @returns {*}
   * was: ej
   */
  ej() {
    return this.pipeline_.ej();
  }

  /**
   * jM — forward to pipeline.
   * @returns {*}
   * was: jM
   */
  getQoeTimestamp {
    return this.pipeline_.getQoeTimestamp;
  }

  /**
   * mE — forward to pipeline.
   * @returns {*}
   * was: mE
   */
  isLooping {
    return this.pipeline_.isLooping;
  }

  /**
   * qE — forward to pipeline.
   * @param {*} param [was: Q]
   * @returns {*}
   * was: qE
   */
  qE(param) {
    return this.pipeline_.qE(param);
  }

  // -----------------------------------------------------------------------
  // Buffering / streaming info
  // -----------------------------------------------------------------------

  /**
   * Yx — get the stream buffer / source buffer reference.
   * @returns {*}
   * was: Yx
   */
  getStreamBuffer() { // was: Yx
    return this.pipeline_.Yx();
  }

  /**
   * pK — forward to pipeline.
   * @returns {*}
   * was: pK
   */
  getMediaSource {
    return this.pipeline_.getMediaSource;
  }

  /**
   * bC — forward to pipeline.
   * @returns {*}
   * was: bC
   */
  getSeekableRangeStart {
    return this.pipeline_.getSeekableRangeStart;
  }

  /**
   * v4 — forward to pipeline.
   * @returns {*}
   * was: v4
   */
  getSeekableStart {
    return this.pipeline_.getSeekableStart;
  }

  /**
   * HI — forward to pipeline.
   * @param {*} p1 [was: Q]
   * @param {*} p2 [was: c]
   * @param {*} p3 [was: W]
   * @returns {*}
   * was: HI
   */
  setBgeNetworkStatus(getCurrentScreenId, LatencyReporter, p3) {
    return this.pipeline_.setBgeNetworkStatus(getCurrentScreenId, LatencyReporter, p3);
  }

  // -----------------------------------------------------------------------
  // Player state accessors
  // -----------------------------------------------------------------------

  /**
   * @returns {string} current playback quality string
   * was: getPlaybackQuality
   */
  getPlaybackQuality() {
    return this.pipeline_.getPlaybackQuality();
  }

  /**
   * @returns {number} current playback rate
   * was: getPlaybackRate
   */
  getPlaybackRate() {
    return this.pipeline_.getPlaybackRate();
  }

  /**
   * @returns {Object} player state object
   * was: getPlayerState
   */
  getPlayerState() {
    return this.pipeline_.getPlayerState();
  }

  /**
   * @returns {number} player type enum value
   * was: getPlayerType
   */
  getPlayerType() {
    return this.pipeline_.getPlayerType();
  }

  /**
   * @param {number} time — seconds
   * @returns {*} playlist sequence for the given time
   * was: getPlaylistSequenceForTime
   */
  getPlaylistSequenceForTime(time) {
    return this.pipeline_.getPlaylistSequenceForTime(time);
  }

  /**
   * zm — forward to pipeline.
   * @param {*} param [was: Q]
   * @returns {*}
   * was: zm
   */
  actionCompanionAdRenderer(param) {
    return this.pipeline_.actionCompanionAdRenderer(param);
  }

  /**
   * tp — forward to pipeline (possibly "time position").
   * @returns {*}
   * was: tp
   */
  tp() {
    return this.pipeline_.tp();
  }

  /**
   * @returns {*} preferred quality
   * was: getPreferredQuality
   */
  getPreferredQuality() {
    return this.pipeline_.getPreferredQuality();
  }

  /**
   * V4 — forward to pipeline.
   * @returns {*}
   * was: V4
   */
  getOwnerDocument() {
    return this.pipeline_.getOwnerDocument();
  }

  /**
   * @returns {*} Proxima latency preference
   * was: getProximaLatencyPreference
   */
  getProximaLatencyPreference() {
    return this.pipeline_.getProximaLatencyPreference();
  }

  /**
   * G3 — forward to pipeline (possibly quality-level detail).
   * @returns {*}
   * was: G3
   */
  getFormatQualityConstraint {
    return this.pipeline_.getFormatQualityConstraint;
  }

  /**
   * Always returns 0 — the adapter does not carry a start-time offset.
   * @returns {number}
   * was: getStartTime
   */
  getStartTime() {
    return 0;
  }

  // -----------------------------------------------------------------------
  // Storyboard
  // -----------------------------------------------------------------------

  /**
   * @returns {*} storyboard data from the video data
   * was: sV
   */
  getStoryboard() { // was: sV
    return this.getVideoData().sV();
  }

  /**
   * @returns {string} storyboard format
   * was: getStoryboardFormat
   */
  getStoryboardFormat() {
    return this.getVideoData().getStoryboardFormat();
  }

  // -----------------------------------------------------------------------
  // Stream / time offset
  // -----------------------------------------------------------------------

  /**
   * @returns {number} stream time offset
   * was: getStreamTimeOffset
   */
  getStreamTimeOffset() {
    return this.pipeline_.getStreamTimeOffset();
  }

  /**
   * rW — forward to pipeline.
   * @returns {*}
   * was: rW
   */
  publishCueRangeEvent() {
    return this.pipeline_.publishCueRangeEvent();
  }

  /**
   * NQ — forward to pipeline (possibly media start offset).
   * @returns {*}
   * was: NQ
   */
  getStreamTimeOffsetNQ {
    return this.pipeline_.getStreamTimeOffsetNQ;
  }

  /**
   * I1 — forward to pipeline.
   * @returns {*}
   * was: I1
   */
  getDebugInfo {
    return this.pipeline_.getDebugInfo;
  }

  // -----------------------------------------------------------------------
  // User preferences
  // -----------------------------------------------------------------------

  /**
   * @returns {*} user 5.1 audio preference
   * was: getUserAudio51Preference
   */
  getUserAudio51Preference() {
    return this.pipeline_.getUserAudio51Preference();
  }

  /**
   * @returns {*} user playback quality preference
   * was: getUserPlaybackQualityPreference
   */
  getUserPlaybackQualityPreference() {
    return this.pipeline_.getUserPlaybackQualityPreference();
  }

  // -----------------------------------------------------------------------
  // Video data
  // -----------------------------------------------------------------------

  /**
   * @returns {Object} the current video data object
   * was: getVideoData
   */
  getVideoData() {
    return this.pipeline_.getVideoData();
  }

  /**
   * YS — forward to pipeline.
   * @returns {*}
   * was: YS
   */
  removeRootClass() {
    return this.pipeline_.removeRootClass();
  }

  /**
   * MY — forward to pipeline.
   * @returns {*}
   * was: MY
   */
  getVideoId {
    return this.pipeline_.getVideoId;
  }

  /**
   * Compute the loaded fraction of the video.
   * If the video data says the download is complete, returns 1.
   * Otherwise delegates to the stream buffer.
   *
   * @returns {number} 0..1
   * was: getVideoLoadedFraction
   */
  getVideoLoadedFraction() {
    if (this.getVideoData().MQ()) return 1; // was: MQ() — isFullyDownloaded
    const streamBuffer = this.pipeline_.Yx(); // was: this.EH.Yx()
    return streamBuffer ? streamBuffer.getLoadFraction : 0; // was: Q.TV()
  }

  /**
   * Return the inner pipeline reference directly.
   * @returns {Object}
   *
   * was: Fi
   */
  getPipeline() { // was: Fi
    return this.pipeline_;
  }

  // -----------------------------------------------------------------------
  // Error / state handling
  // -----------------------------------------------------------------------

  /**
   * Sf — forward to pipeline.
   * @param {*} param [was: Q]
   * was: Sf
   */
  clientHintsOverride(param) {
    this.pipeline_.clientHintsOverride(param);
  }

  /**
   * @param {*} error
   * was: handleError
   */
  handleError(error) {
    this.pipeline_.handleError(error);
  }

  /**
   * fL — forward to pipeline.
   * @param {*} param [was: Q]
   * was: fL
   */
  GelPayloadStore(param) {
    this.pipeline_.GelPayloadStore(param);
  }

  /**
   * Ra — forward to pipeline.
   * @param {*} param [was: Q]
   * was: Ra
   */
  Ra(param) {
    this.pipeline_.Ra(param);
  }

  /**
   * KB — forward to pipeline.
   * @returns {*}
   * was: KB
   */
  KB() {
    return this.pipeline_.KB();
  }

  // -----------------------------------------------------------------------
  // Capability queries
  // -----------------------------------------------------------------------

  /**
   * @returns {boolean}
   * was: hasSupportedAudio51Tracks
   */
  hasSupportedAudio51Tracks() {
    return this.pipeline_.hasSupportedAudio51Tracks();
  }

  /**
   * @returns {boolean} whether the current video is an ad
   * was: isAd
   */
  isAd() {
    return this.getVideoData().isAd();
  }

  /**
   * zE — forward to pipeline.
   * @returns {*}
   * was: zE
   */
  iterateCursor() {
    return this.pipeline_.iterateCursor();
  }

  /**
   * M6 — forward to pipeline (possibly "is main content").
   * @returns {*}
   * was: M6
   */
  M6() {
    return this.pipeline_.M6();
  }

  /**
   * @param {number} threshold
   * @param {boolean} useBuffer
   * @returns {boolean} whether the player is at the live head
   * was: isAtLiveHead
   */
  isAtLiveHead(threshold, useBuffer) {
    return this.pipeline_.isAtLiveHead(threshold, useBuffer);
  }

  /**
   * A_ — forward to pipeline.
   * @returns {*}
   * was: A_
   */
  isLoaderAvailable {
    return this.pipeline_.isLoaderAvailable;
  }

  /**
   * @returns {boolean} whether this is a gapless playback
   * was: isGapless
   */
  isGapless() {
    return this.pipeline_.isGapless();
  }

  /**
   * Bc — forward to pipeline (gapless-transition readiness).
   * @returns {*}
   * was: Bc
   */
  Bc() {
    return this.pipeline_.Bc();
  }

  /**
   * @returns {boolean} whether the video is HDR
   * was: isHdr
   */
  isHdr() {
    return this.pipeline_.isHdr();
  }

  /**
   * aN — forward to pipeline.
   * @returns {*}
   * was: aN
   */
  SuggestedActionBadge() {
    return this.pipeline_.SuggestedActionBadge();
  }

  /**
   * gD — forward to pipeline.
   * @returns {*}
   * was: gD
   */
  gD() {
    return this.pipeline_.gD();
  }

  /**
   * HY — forward to pipeline.
   * @returns {*}
   * was: HY
   */
  HY() {
    return this.pipeline_.HY();
  }

  /**
   * @returns {boolean}
   * was: isProximaLatencyEligible
   */
  isProximaLatencyEligible() {
    return this.pipeline_.isProximaLatencyEligible();
  }

  /**
   * Zr — forward to pipeline.
   * @returns {*}
   * was: Zr
   */
  Zr() {
    return this.pipeline_.Zr();
  }

  /**
   * Check if the loader supports a given type.
   * @param {*} param [was: Q]
   * @returns {boolean}
   * was: lM
   */
  createChildCueRange(param) {
    return !!this.pipeline_.loader?.createChildCueRange(param);
  }

  /**
   * Px — forward to pipeline.
   * @returns {*}
   * was: Px
   */
  Px() {
    return this.pipeline_.Px();
  }

  // -----------------------------------------------------------------------
  // Playback control
  // -----------------------------------------------------------------------

  /**
   * lT — forward to pipeline (possibly "load track").
   * was: lT
   */
  dispatchAndPersistMutations() {
    this.pipeline_.dispatchAndPersistMutations();
  }

  /**
   * J_ — forward to pipeline.
   * @param {*} param [was: Q]
   * was: J_
   */
  J_(param) {
    this.pipeline_.J_(param);
  }

  /**
   * ew — forward to pipeline.
   * was: ew
   */
  skipElement() {
    this.pipeline_.skipElement();
  }

  /**
   * hB — forward to pipeline.
   * was: hB
   */
  triggerIdleNetworkFetch {
    this.pipeline_.triggerIdleNetworkFetch;
  }

  /**
   * QU — forward to pipeline.
   * was: QU
   */
  QU() {
    this.pipeline_.QU();
  }

  /**
   * C1 — forward to pipeline.
   * was: C1
   */
  C1() {
    this.pipeline_.C1();
  }

  /**
   * iO — forward to pipeline.
   * @param {*} param [was: Q]
   * was: iO
   */
  iO(param) {
    this.pipeline_.iO(param);
  }

  /**
   * Py — forward to pipeline.
   * was: Py
   */
  Py() {
    this.pipeline_.Py();
  }

  /**
   * @param {*} reason  [was: Q]
   * @param {*} param2  [was: c]
   * was: pauseVideo
   */
  pauseVideo(reason, param2) {
    this.pipeline_.pauseVideo(reason, param2);
  }

  /**
   * Prefetch a key-play.
   * @param {*} keyPlayParams [was: Q]
   * @param {*} param2        [was: c]
   * was: prefetchKeyPlay
   */
  prefetchKeyPlay(keyPlayParams, param2) {
    this.pipeline_.prefetchKeyPlay(keyPlayParams, param2);
  }

  /**
   * Prefetch a jump-ahead segment.
   * @param {*} jumpParams [was: Q]
   * was: prefetchJumpAhead
   */
  prefetchJumpAhead(jumpParams) {
    this.pipeline_.prefetchJumpAhead(jumpParams);
  }

  /**
   * VZ — forward to pipeline.
   * @param {*} param [was: Q]
   * was: VZ
   */
  VZ(param) {
    this.pipeline_.VZ(param);
  }

  /**
   * ox — forward to pipeline.
   * @param {*} param [was: Q]
   * was: ox
   */
  ox(param) {
    this.pipeline_.ox(param);
  }

  /**
   * @param {*} reason  [was: Q]
   * @param {*} param2  [was: c]
   * @returns {*}
   * was: playVideo
   */
  playVideo(reason, param2) {
    return this.pipeline_.playVideo(reason, param2);
  }

  /**
   * gN — forward to pipeline.
   * was: gN
   */
  gN(getCurrentScreenId, LatencyReporter, p3, p4, p5) {
    this.pipeline_.gN(getCurrentScreenId, LatencyReporter, p3, p4, p5);
  }

  /**
   * mQ — forward to pipeline.
   * was: mQ
   */
  getAdHandlerContext(getCurrentScreenId, LatencyReporter, p3, p4, p5) {
    this.pipeline_.getAdHandlerContext(getCurrentScreenId, LatencyReporter, p3, p4, p5);
  }

  /**
   * tJ — forward to pipeline.
   * was: tJ
   */
  RetryTimer(getCurrentScreenId, LatencyReporter, p3) {
    this.pipeline_.RetryTimer(getCurrentScreenId, LatencyReporter, p3);
  }

  /**
   * F9 — forward to pipeline.
   * @param {*} param [was: Q]
   * was: F9
   */
  F9(param) {
    this.pipeline_.F9(param);
  }

  /**
   * Gb — forward to pipeline's Vp (video player) sub-object.
   * @param {*} p1 [was: Q]
   * @param {*} p2 [was: c]
   * was: Gb
   */
  Gb(getCurrentScreenId, LatencyReporter) {
    this.pipeline_.Vp.Gb(getCurrentScreenId, LatencyReporter); // was: this.EH.Vp.Gb(Q, c)
  }

  /**
   * vk — forward to pipeline.
   * was: vk
   */
  SYM_VALUE(getCurrentScreenId, LatencyReporter, p3) {
    this.pipeline_.SYM_VALUE(getCurrentScreenId, LatencyReporter, p3);
  }

  /**
   * I$ — forward to pipeline.
   * @param {*} param [was: Q]
   * was: I$
   */
  I$(param) {
    this.pipeline_.I$(param);
  }

  /**
   * pz — forward to pipeline.
   * @param {*} param [was: Q]
   * was: pz
   */
  getOrCreateRendererEntry(param) {
    this.pipeline_.getOrCreateRendererEntry(param);
  }

  /**
   * i$ — forward to pipeline.
   * was: i$
   */
  i$(getCurrentScreenId, LatencyReporter) {
    this.pipeline_.i$(getCurrentScreenId, LatencyReporter);
  }

  /**
   * eV — forward to pipeline (8 params — possibly "emit video event").
   * was: eV
   */
  eV(getCurrentScreenId, LatencyReporter, p3, p4, p5, p6, p7, p8) {
    this.pipeline_.eV(getCurrentScreenId, LatencyReporter, p3, p4, p5, p6, p7, p8);
  }

  /**
   * yJ — invoke J6 on the pipeline's Vp sub-object.
   * was: yJ
   */
  setAttestationChallenge() {
    this.pipeline_.Vp.J6(); // was: J6(this.EH.Vp)
  }

  /**
   * z8 — forward to pipeline.
   * @param {*} param [was: Q]
   * was: z8
   */
  z8(param) {
    this.pipeline_.z8(param);
  }

  /**
   * NE — forward to pipeline.
   * was: NE
   */
  NE(getCurrentScreenId, LatencyReporter) {
    this.pipeline_.NE(getCurrentScreenId, LatencyReporter);
  }

  /**
   * Remove a cue range.
   * @param {*} cueRange [was: Q]
   * was: removeCueRange
   */
  removeCueRange(cueRange) {
    this.pipeline_.removeCueRange(cueRange);
  }

  /**
   * QX — forward to pipeline.
   * @param {*} param [was: Q]
   * was: QX
   */
  QX(param) {
    this.pipeline_.QX(param);
  }

  /**
   * qI — query on the pipeline's `ag` sub-object.
   * @param {*} param [was: Q]
   * @returns {*}
   * was: qI
   */
  qI(param) {
    return this.pipeline_.ag.qI(param); // was: this.EH.ag.qI(Q)
  }

  /**
   * VH — forward to pipeline.
   * @param {*} param [was: Q]
   * was: VH
   */
  VH(param) {
    this.pipeline_.VH(param);
  }

  /**
   * Ps — forward to pipeline.
   * was: Ps
   */
  getMetricValues(getCurrentScreenId, LatencyReporter, p3) {
    this.pipeline_.getMetricValues(getCurrentScreenId, LatencyReporter, p3);
  }

  /**
   * uu — forward to pipeline.
   * was: uu
   */
  InjectionToken() {
    this.pipeline_.InjectionToken();
  }

  /**
   * Reset the pipeline's `ag` sub-object.
   * was: Dk
   */
  resetAg() { // was: Dk
    this.pipeline_.ag.reset(); // was: this.EH.ag.reset()
  }

  /**
   * AL — forward to pipeline.
   * was: AL
   */
  AL() {
    this.pipeline_.AL();
  }

  /**
   * H7 — request seek to wall time seconds.
   * was: H7
   */
  H7(getCurrentScreenId, LatencyReporter, p3) {
    this.pipeline_.H7(getCurrentScreenId, LatencyReporter, p3);
  }

  /**
   * Seek to a specific time.
   * @param {number} seconds [was: Q]
   * @param {*}      param2  [was: c]
   * was: seekTo
   */
  seekTo(seconds, param2) {
    this.pipeline_.seekTo(seconds, param2);
  }

  /**
   * was: sendAbandonmentPing
   */
  sendAbandonmentPing() {
    this.pipeline_.sendAbandonmentPing();
  }

  /**
   * was: sendVideoStatsEngageEvent
   */
  sendVideoStatsEngageEvent(event, playerType) {
    this.pipeline_.sendVideoStatsEngageEvent(event, playerType);
  }

  /**
   * Sn — forward to pipeline.
   * was: Sn
   */
  Sn(getCurrentScreenId, LatencyReporter, p3) {
    this.pipeline_.Sn(getCurrentScreenId, LatencyReporter, p3);
  }

  /**
   * @param {boolean} loop
   * was: setLoop
   */
  setLoop(loop) {
    this.pipeline_.setLoop(loop);
  }

  /**
   * Ht — forward to pipeline.
   * was: Ht
   */
  setTimeLocked {
    this.pipeline_.setTimeLocked;
  }

  /**
   * @param {HTMLMediaElement} element
   * was: setMediaElement
   */
  setMediaElement(element) {
    this.pipeline_.setMediaElement(element);
  }

  /**
   * GW — forward to pipeline.
   * was: GW
   */
  GW(getCurrentScreenId, LatencyReporter, p3, p4) {
    this.pipeline_.GW(getCurrentScreenId, LatencyReporter, p3, p4);
  }

  /**
   * @param {number} rate
   * was: setPlaybackRate
   */
  setPlaybackRate(rate) {
    this.pipeline_.setPlaybackRate(rate);
  }

  /**
   * o$ — forward to pipeline (6 params).
   * was: o$
   */
  o$(getCurrentScreenId, LatencyReporter, p3, p4, p5, p6) {
    this.pipeline_.o$(getCurrentScreenId, LatencyReporter, p3, p4, p5, p6);
  }

  /**
   * FY — forward to pipeline.
   * was: FY
   */
  truncateValue(getCurrentScreenId, LatencyReporter) {
    this.pipeline_.truncateValue(getCurrentScreenId, LatencyReporter);
  }

  /**
   * qP — trigger a named action (e.g. "ypcRentalActivation").
   * @param {string} actionName [was: Q]
   * was: qP
   */
  checkAdExperiment(actionName) {
    this.pipeline_.checkAdExperiment(actionName);
  }

  /**
   * @param {*} preference
   * was: setProximaLatencyPreference
   */
  setProximaLatencyPreference(preference) {
    this.pipeline_.setProximaLatencyPreference(preference);
  }

  /**
   * t7 — forward to pipeline.
   * was: t7
   */
  t7(getCurrentScreenId, LatencyReporter, p3) {
    this.pipeline_.t7(getCurrentScreenId, LatencyReporter, p3);
  }

  /**
   * V0 — forward to pipeline.
   * @param {*} param [was: Q]
   * was: V0
   */
  V0(param) {
    this.pipeline_.V0(param);
  }

  /**
   * Y5 — forward to pipeline.
   * was: Y5
   */
  Y5() {
    this.pipeline_.Y5();
  }

  /**
   * Zx — forward to pipeline.
   * @param {*} param [was: Q]
   * was: Zx
   */
  lookupMetricIndex(param) {
    this.pipeline_.lookupMetricIndex(param);
  }

  /**
   * @param {*} preference
   * @param {boolean} reload
   * was: setUserAudio51Preference
   */
  setUserAudio51Preference(preference, reload) {
    this.pipeline_.setUserAudio51Preference(preference, reload);
  }

  /**
   * Dw — set quality range.
   * @param {*} qualityRange [was: Q]
   * @param {boolean} user   [was: c]
   * @param {*} param3       [was: W]
   * was: Dw
   */
  getChromeVersion(qualityRange, user, param3) {
    this.pipeline_.getChromeVersion(qualityRange, user, param3);
  }

  /**
   * ul — forward to pipeline.
   * @returns {*}
   * was: ul
   */
  ul() {
    return this.pipeline_.ul();
  }

  /**
   * Hb — forward to pipeline.
   * was: Hb
   */
  Hb() {
    this.pipeline_.Hb();
  }

  /**
   * kH — forward to pipeline.
   * @returns {*}
   * was: kH
   */
  kH() {
    return this.pipeline_.kH();
  }

  /**
   * oy — forward to pipeline.
   * @param {*} param [was: Q]
   * was: oy
   */
  oy(param) {
    this.pipeline_.oy(param);
  }

  /**
   * bv — forward to pipeline.
   * was: bv
   */
  bv() {
    this.pipeline_.bv();
  }

  /**
   * Ts — forward to pipeline.
   * @param {*} param [was: Q]
   * was: Ts
   */
  Ts(param) {
    this.pipeline_.Ts(param);
  }

  /**
   * was: stopVideo
   */
  stopVideo() {
    this.pipeline_.stopVideo();
  }

  // -----------------------------------------------------------------------
  // Pub/sub
  // -----------------------------------------------------------------------

  /**
   * @param {string} event  [was: Q]
   * @param {Function} handler [was: c]
   * @param {*} [context]   [was: W]
   * @returns {*} subscription handle
   * was: subscribe
   */
  subscribe(event, handler, context) {
    return this.pipeline_.subscribe(event, handler, context);
  }

  /**
   * H5 — forward to pipeline.
   * was: H5
   */
  MeasurementHook(getCurrentScreenId, LatencyReporter) {
    this.pipeline_.MeasurementHook(getCurrentScreenId, LatencyReporter);
  }

  /**
   * was: togglePictureInPicture
   */
  togglePictureInPicture() {
    this.pipeline_.togglePictureInPicture();
  }

  /**
   * WS — query on the pipeline's `ag` sub-object.
   * @param {*} param [was: Q]
   * @returns {*}
   * was: WS
   */
  WS(param) {
    return this.pipeline_.ag.WS(param);
  }

  /**
   * w1 — forward to the pipeline's `ag` sub-object.
   * @param {*} param [was: Q]
   * was: w1
   */
  w1(param) {
    this.pipeline_.ag.w1(param);
  }

  /**
   * @param {string} event  [was: Q]
   * @param {Function} handler [was: c]
   * @param {*} [context]   [was: W]
   * @returns {*}
   * was: unsubscribe
   */
  unsubscribe(event, handler, context) {
    return this.pipeline_.unsubscribe(event, handler, context);
  }

  /**
   * iG — forward to pipeline.
   * was: iG
   */
  iG(getCurrentScreenId, LatencyReporter) {
    this.pipeline_.iG(getCurrentScreenId, LatencyReporter);
  }

  /**
   * s2 — set audio track on the pipeline.
   * @param {*} trackId [was: Q]
   * @param {*} param2  [was: c]
   * @returns {*}
   * was: s2
   */
  s2(trackId, param2) {
    return this.pipeline_.s2(trackId, param2);
  }

  /**
   * iE — internal engagement refresh.
   * was: iE
   */
  reevaluateFormat {
    this.pipeline_.reevaluateFormat;
  }

  /**
   * Ah — forward to pipeline.
   * @param {*} param [was: Q]
   * was: Ah
   */
  getAdContentVideoId(param) {
    this.pipeline_.getAdContentVideoId(param);
  }

  /**
   * Bb — forward to pipeline.
   * was: Bb
   */
  Bb() {
    this.pipeline_.Bb();
  }
}

// -------------------------------------------------------------------------
// Prototype callback slots (lines 87527-87533)
// These are assigned via the c3() helper which creates event-callback
// properties at specific priority levels.
// -------------------------------------------------------------------------
// DrmAdapter.prototype.D0 = c3(51);  // was: g.y.D0 = c3(51)
// DrmAdapter.prototype.h2 = c3(39);  // was: g.y.h2 = c3(39)
// DrmAdapter.prototype.SQ = c3(34);  // was: g.y.SQ = c3(34)
// DrmAdapter.prototype.q6 = c3(28);  // was: g.y.q6 = c3(28)
// DrmAdapter.prototype.f2 = c3(22);  // was: g.y.f2 = c3(22)
// DrmAdapter.prototype.q3 = c3(14);  // was: g.y.q3 = c3(14)
