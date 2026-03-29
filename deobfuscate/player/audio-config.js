import { dispose } from '../ads/dai-cue-range.js';
import { storageSet } from '../core/attestation.js';
import { registerDisposable } from '../core/event-system.js';
import { updateEnvironmentData } from './player-api.js';
import { getPlaybackRate, setPlaybackRate } from './time-tracking.js';
import { tracksHaveMultipleDistinctValues } from '../ads/ad-click-tracking.js'; // was: IKx
import { miniplayerIcon } from '../ui/svg-icons.js'; // was: D1
import { tracksHaveDistinctValues } from '../ads/ad-click-tracking.js'; // was: ob
import { isSurroundTrack } from '../ads/ad-click-tracking.js'; // was: Wp
import { isDrcTrack } from '../ads/ad-click-tracking.js'; // was: my
import { isHighQualityNonSurround } from '../ads/ad-click-tracking.js'; // was: TD
import { isSpatialAudio } from '../ads/ad-click-tracking.js'; // was: Kb
import { hasLanguageDescriptor } from '../ads/ad-click-tracking.js'; // was: U53
import { filterByAudioLanguage } from '../ads/ad-click-tracking.js'; // was: WBn
import { updateClipState } from '../ui/seek-bar-tail.js'; // was: vC
import { filterBySurroundPreference } from '../ads/ad-click-tracking.js'; // was: m5n
import { filterByDrcPreference } from '../media/quality-manager.js'; // was: TQ_
import { filterBySpatialAudio } from '../ads/ad-click-tracking.js'; // was: oTn
import { filterByAudioQualityPreference } from '../media/quality-manager.js'; // was: rSK
import { wrapTracksAsHls } from '../ads/ad-click-tracking.js'; // was: KB_
import { getAudioQualitySetting } from '../ads/ad-async.js'; // was: Bnx
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { signalFZUpdate } from './context-updates.js'; // was: Ig()
import { processEntry } from '../core/composition-helpers.js'; // was: Xn
import { trustedTypes } from '../proto/messages-core.js'; // was: Gy
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { createErrorResult } from '../core/misc-helpers.js'; // was: U1
import { appendBuffer } from '../data/collection-utils.js'; // was: ug
import { getOfflineStorage } from '../data/gel-core.js'; // was: uV
import { imageCompanionAdRenderer } from '../core/misc-helpers.js'; // was: CA
import { scheduleNotification } from '../core/composition-helpers.js'; // was: Az
import { FROZEN_EMPTY_ARRAY } from '../proto/messages-core.js'; // was: jy
import { HEX_COLOR_VALIDATION_REGEX } from '../modules/caption/caption-data.js'; // was: Or
import { pubsub2TopicToKeys } from '../data/idb-operations.js'; // was: bV
import { isTimeInRange } from '../media/codec-helpers.js'; // was: zb
import { cueAdVideo } from './media-state.js'; // was: OH
import { reportErrorToGel } from '../data/gel-params.js'; // was: EE
import { isH5MultiviewDaiEnabled } from './media-state.js'; // was: U$
import { CuePointProcessor } from './bootstrap.js'; // was: iW
import { getAvailableAudioTracks } from './player-api.js';
import { PlayerModule } from './account-linking.js';
import { EventHandler } from '../core/event-handler.js';
import { forEach } from '../core/event-registration.js';
import { slice } from '../core/array-utils.js';

/**
 * Account linking continuation, audio config, XHR handler continuation.
 * Source: base.js lines 88106–88961, 89047–89959
 * (Skipping 88962–89046 — already covered)
 *
 * Contains:
 * - Audio track sort strategies (RSW, Zb, F4) — sort/filter rules for audio tracks
 * - AudioTrackFilterModel (N7m) — computes availability state for audio features
 * - AudioQualitySettingModule (k2O) — user audio quality preference (HQ audio)
 * - AudioTrackStateModule (Ykm)
 * - AutonavToggle (pa_) / AutonavModule (QWo)
 * - CinematicLightingMenuItem (eGw) / CinematicSettingsModule (cy9)
 * - ClipConfigModule (Wma) / CreatorEndscreenModule (mXa)
 * - DelhiModernModule (KmS) — applies Delhi modern player CSS classes
 * - StableVolumeMenuItem (T04) / DrcModule (oxi)
 * - EmbargoModule (ry0) / EmbedsConversionModule (UX9)
 * - EmbedsShortsModule (IRS) / ScreenManagerModule (X3a)
 * - IntersectionObserverWrapper (qjK) / IntersectionModule (Ay9)
 * - FeaturedProductDismissModule (e_v) / FreePreviewTimer (Vdm) / FreePreviewModule (B01)
 * - FullerscreenEduButton (xX0) / FullerscreenModule (qO9)
 * - SphericalPropertiesModule (td1) / VeLoggingModule (H71)
 * - PlaybackSchedule (N0a) / SegmentTracker (i70) / SeekHandler (yyD)
 * - RLE encoder (tL) / RequestTiming base (Fma) / DASH request timing (sA)
 * - UMP demuxer (dF) / Request base (Z74)
 * - Cobalt XHR (pDn) / Offline XHR (Yj3) / Fetch transport (QG3) / Legacy XHR (cnx)
 *
 * [was: RSW, N7m, F4, Zb, k2O, Ykm, pa_, QWo, eGw, cy9, Wma, mXa, KmS, T04, oxi,
 *  ry0, UX9, IRS, X3a, qjK, Ay9, e_v, Vdm, B01, xX0, qO9, td1, H71,
 *  N0a, i70, yyD, tL, Fma, sA, dF, Z74, pDn, Yj3, QG3, cnx]
 */

// ---------------------------------------------------------------------------
// Audio track sort strategies [was: RSW]
// Maps feature IDs to sorting/filtering functions for audio tracks
// ---------------------------------------------------------------------------
export const AUDIO_SORT_STRATEGIES = {
  [0]: (tracks) => tracksHaveMultipleDistinctValues(tracks, (t) => t.miniplayerIcon?.id),    // by language
  [2]: (tracks) => tracksHaveDistinctValues(tracks, isSurroundTrack),                    // spatial audio
  [3]: (tracks) => tracksHaveDistinctValues(tracks, isDrcTrack),                    // DRC / stable volume
  [4]: (tracks) => tracksHaveDistinctValues(tracks, isHighQualityNonSurround),                    // high quality audio
  [1]: (tracks) => tracksHaveDistinctValues(tracks, isSpatialAudio),                    // descriptive audio
};

// ---------------------------------------------------------------------------
// Feature priority order [was: F4]
// ---------------------------------------------------------------------------
const AUDIO_FEATURE_ORDER = [0, 1, 2, 3, 4]; // was: F4

// ---------------------------------------------------------------------------
// Feature filter definitions [was: Zb]
// ---------------------------------------------------------------------------
const AUDIO_FEATURE_FILTERS = {
  [0]: { g8: 2, RemoteSlotMetadata: hasLanguageDescriptor, updateClipState: filterByAudioLanguage },    // language
  [2]: { g8: 4, RemoteSlotMetadata: isSurroundTrack, updateClipState: filterBySurroundPreference },     // spatial
  [3]: { g8: 5, RemoteSlotMetadata: isDrcTrack, updateClipState: filterByDrcPreference },     // DRC
  [1]: { g8: 3, RemoteSlotMetadata: isSpatialAudio, updateClipState: filterBySpatialAudio },     // descriptive
  [4]: { g8: 6, RemoteSlotMetadata: isHighQualityNonSurround, updateClipState: filterByAudioQualityPreference },     // HQ audio
};

// ---------------------------------------------------------------------------
// AudioTrackFilterModel [was: N7m]
// Computes per-feature availability and fallback state
// ---------------------------------------------------------------------------
export class AudioTrackFilterModel {
  constructor(videoData) { // was: Q
    this.sortedTracks = {};  // was: this.W
    this.featureState = {};  // was: this.A
    this.Rk = { o1C: () => this.sortedTracks };
    this.videoData = videoData;

    const rawTracks = videoData.A?.A; // was: c
    this.allTracks = rawTracks?.length > 0 ? rawTracks : (() => {
      const available = videoData.getAvailableAudioTracks();
      return available.length > 0 ? wrapTracksAsHls(available) : [];
    })(); // was: this.O

    for (const featureId of AUDIO_FEATURE_ORDER) {
      this.sortedTracks[featureId] = AUDIO_SORT_STRATEGIES[featureId](this.allTracks);
    }
    this.recompute(); // was: this.Ig()
  }

  /** Get availability state for a feature. [was: YH] */
  getFeatureState(featureId) { return this.featureState[featureId]; }

  /** Recompute availability based on current track set. [was: Ig] */
  recompute() {
    let tracks = this.allTracks;
    const state = {};
    for (const featureId of AUDIO_FEATURE_ORDER) {
      if (this.sortedTracks[featureId]) {
        tracks = AUDIO_FEATURE_FILTERS[featureId].updateClipState(tracks, this.videoData);
        for (const otherId of AUDIO_FEATURE_ORDER) {
          if (state[otherId] === undefined && !Jy(tracks, AUDIO_FEATURE_FILTERS[otherId].RemoteSlotMetadata)) {
            state[otherId] = AUDIO_FEATURE_FILTERS[featureId].g8;
          }
        }
        if (state[featureId] === undefined) state[featureId] = 0;
      } else {
        state[featureId] = 1;
      }
    }
    this.featureState = state;
  }
}

// ---------------------------------------------------------------------------
// AudioQualitySettingModule [was: k2O]
// Manages user audio quality preference (normal/high quality)
// ---------------------------------------------------------------------------
export class AudioQualitySettingModule extends PlayerModule {
  constructor(api) {
    super(api);
    this.events = new EventHandler(api);
    registerDisposable(this, this.events);

    const isEnabled = this.api.X("html5_enable_audio_quality_setting_feature"); // was: c
    R(this.api, "getUserAudioQualitySetting", () => isEnabled ? this.getUserAudioQualitySetting() : 2);
    R(this.api, "setUserAudioQualitySetting", (setting) => { if (isEnabled) this.setUserAudioQualitySetting(setting); });
    R(this.api, "hasHqaAudioTrack", () => isEnabled ? this.hasHqaAudioTrack() : false);
    R(this.api, "getAudioQualitySettingState", () => isEnabled ? this.api.YH(4) : 1);

    this.userSetting = getAudioQualitySetting(); // was: this.Xn
    this.updateEnvironmentData();
  }

  getUserAudioQualitySetting() { return this.userSetting; }

  setUserAudioQualitySetting(setting) { // was: Q
    this.api.RetryTimer("aqs_set", { setting });
    storageSet("yt-player-audio-quality-setting", setting, 3122064000);
    if (setting !== this.userSetting) {
      this.userSetting = setting;
      this.updateEnvironmentData();
      if (this.hasHqaAudioTrack()) this.api.Bb();
      this.api.signalFZUpdate;
    }
  }

  hasHqaAudioTrack() {
    const tracks = this.api.getVideoData()?.A?.O;
    return tracks ? Jy(tracks, (t) => isHighQualityNonSurround(t)) : false;
  }

  updateEnvironmentData() { this.api.G().processEntry = this.userSetting; }
}

// ---------------------------------------------------------------------------
// PlaybackSchedule [was: N0a]
// Controls playback rate for adaptive streaming scheduling
// ---------------------------------------------------------------------------
export class PlaybackSchedule {
  constructor(bandwidthEstimator, policy) { // was: Q, c
    this.Qp = bandwidthEstimator;
    this.policy = policy;
    this.playbackRate = 1;
  }

  setPlaybackRate(rate) { this.playbackRate = Math.max(1, rate); }
  getPlaybackRate() { return this.playbackRate; }
}

// ---------------------------------------------------------------------------
// SeekHandler [was: yyD]
// Manages seek operations across audio/video tracks
// ---------------------------------------------------------------------------
export class SeekHandler {
  constructor(loader, manifest, videoTrack, audioTrack, policy) {
    this.loader = loader;
    this.k0 = manifest;          // was: c
    this.videoTrack = videoTrack; // was: W
    this.audioTrack = audioTrack; // was: m
    this.policy = policy;         // was: K
    this.seekCount = 0;
    this.targetTime = 0;
    this.isSeeking_ = false;     // was: this.j
    this.A = null;
    this.O = 0;
    this.W = this.k0.isManifestless && !this.k0.DE;
  }

  seek(targetTime, options) { // was: Q, c
    if (targetTime !== this.targetTime) this.seekCount = 0;
    this.targetTime = targetTime;

    const prevVideoFormat = this.videoTrack.W;
    const prevAudioFormat = this.audioTrack.W;
    const audioBuffer = this.audioTrack.trustedTypes;
    const videoSeekTime = gTW(this, this.videoTrack, targetTime, this.videoTrack.trustedTypes, options);
    const audioSeekTime = gTW(this, this.audioTrack, this.policy.mainVideoEntityActionMetadataKey ? targetTime : videoSeekTime, audioBuffer, options);
    const finalTime = Math.max(targetTime, videoSeekTime, audioSeekTime);

    this.isSeeking_ = true;
    if (this.k0.isManifestless) {
      OAn(this, this.videoTrack, prevVideoFormat);
      OAn(this, this.audioTrack, prevAudioFormat);
    }
    return finalTime;
  }

  isSeeking() { return this.isSeeking_; }
  createErrorResult(offset) { this.O = offset; }
}

// ---------------------------------------------------------------------------
// UMP Demuxer [was: dF]
// Parses UMP (Unified Media Protocol) framed streams
// ---------------------------------------------------------------------------
export class UmpDemuxer {
  constructor(handler) { // was: Q
    this.l0 = handler;
    this.W = new ChunkedByteBuffer();
  }

  feed(data) { // was: Q
    appendBuffer(this.W, data);
    this.process(); // was: this.JF()
  }

  /** Process buffered UMP frames. [was: JF] */
  process() {
    // Handle continuation of partial frames
    if (this.j) {
      if (!this.W.totalLength) return;
      const { getOfflineStorage: consumed, N4: remaining } = this.W.split(this.A - this.O);
      if (!this.l0.imageCompanionAdRenderer(this.j, consumed, this.O, this.A)) return;
      this.O += consumed.totalLength;
      this.W = remaining;
      if (this.O === this.A) {
        this.j = this.A = this.O = undefined;
      }
    }

    // Parse complete frames
    for (;;) {
      let offset = 0;
      let typeId, payloadLength;
      [typeId, offset] = JS0(this.W, offset);
      [payloadLength, offset] = JS0(this.W, offset);
      if (typeId < 0 || payloadLength < 0) break;

      if (!(offset + payloadLength <= this.W.totalLength)) {
        // Partial frame — try streaming callback
        if (!(this.l0.imageCompanionAdRenderer && offset + 1 <= this.W.totalLength)) break;
        const { N4: remainder } = this.W.split(offset);
        if (this.l0.imageCompanionAdRenderer(typeId, remainder, 0, payloadLength)) {
          this.j = typeId;
          this.O = remainder.totalLength;
          this.A = payloadLength;
          this.W = new ChunkedByteBuffer([]);
        }
        break;
      }

      const { getOfflineStorage: payload, N4: rest } = this.W.split(offset).N4.split(payloadLength);
      this.l0.zW(typeId, payload);
      this.W = rest;
    }
  }

  dispose() { this.W = new ChunkedByteBuffer(); }
}

// ---------------------------------------------------------------------------
// Request Base Class [was: Z74]
// Base for all network request objects (DASH, SABR, etc.)
// ---------------------------------------------------------------------------
export class RequestBase {
  constructor(info, callback) { // was: Q, c
    this.info = info;
    this.callback = callback;
    this.state = 1;
    this.scheduleNotification = false; // was: !1 — data consumed flag
    this.FROZEN_EMPTY_ARRAY = false;
    this.HEX_COLOR_VALIDATION_REGEX = null;  // segment parser
  }

  uw() { return 0; }
  pubsub2TopicToKeys() { return null; }
  cH() { return null; }
  isTimeInRange() { return this.state >= 1; }
  isComplete() { return this.state >= 3; }
  CB() { return this.state === 5; }
  onStateChange() {}

  l3(newState) { // was: Q
    const oldState = this.state;
    this.state = newState;
    this.onStateChange(oldState);
    if (this.callback) this.callback(this, oldState);
  }

  bu(minState) { // was: Q
    if (minState && this.state < minState) {
      this.l3(minState);
    } else if (this.callback) {
      this.callback(this, this.state);
    }
  }

  u0() { return this.state === -1; }

  Pw() {
    let desc = "";
    this.info.eh.forEach((seg) => { desc += `${seg.Pw()}.`; });
    return desc.slice(0, -1);
  }

  dispose() {
    if (!this.u0()) {
      this.info.eh[0].cueAdVideo.mF = false;
      this.l3(-1);
    }
  }

  VW() { return 0; }
}

// ---------------------------------------------------------------------------
// Fetch Transport [was: QG3]
// Modern fetch()-based streaming transport for media requests
// ---------------------------------------------------------------------------
export class FetchTransport {
  constructor(url, policy, handler, options = {}) {
    this.policy = policy;
    this.l0 = handler;
    this.D = options;
    this.status = 0;
    this.response = undefined;
    this.bytesReceived = 0;   // was: this.O
    this.hasError = false;     // was: this.K
    this.errorMessage = "";
    this.W = new ChunkedByteBuffer();
    this.abortController = window.AbortController ? new AbortController() : undefined; // was: this.j
    this.start(url);
  }

  start(url) {
    const init = { credentials: "include", cache: "no-store" };
    Object.assign(init, this.D);
    if (this.abortController) init.signal = this.abortController.signal;
    const request = new Request(url, init);
    fetch(request).then(this.L, this.onError).then(undefined, reportErrorToGel);
  }

  onDone() { if (!this.u0()) this.l0.isH5MultiviewDaiEnabled(); }

  getResponseHeader(name) { return this.responseHeaders ? this.responseHeaders.get(name) : null; }
  Eo() { return !!this.responseHeaders; }
  CuePointProcessor() { return this.bytesReceived; }
  FC() { return +this.getResponseHeader("content-length"); }
  pg() { return this.status >= 200 && this.status < 300 && !!this.bytesReceived; }
  Fz() { return !!this.W.totalLength; }
  rS() { const data = this.W; this.W = new ChunkedByteBuffer(); return data; }
  sy() { return this.W; }
  u0() { return this.aborted; }
  abort() {
    if (this.A) this.A.cancel().catch(() => {});
    if (this.abortController) this.abortController.abort();
    this.aborted = true;
  }
  T5() { return true; }
  wr() { return this.hasError; }
  eB() { return this.errorMessage; }
}
