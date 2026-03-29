import { publishEvent } from '../ads/ad-click-tracking.js';
import { storageSet } from '../core/attestation.js';
import { reportWarning } from '../data/gel-params.js';
import { Pf } from '../data/session-storage.js';
import { qualityLabelToOrdinal } from '../media/codec-tables.js';
import { recordTimedStat } from '../media/engine-config.js';
import { createQualityRange } from '../modules/caption/caption-translation.js';
import { addStateBits } from '../media/source-buffer.js'; // was: e7
import { setBgeNetworkStatus } from '../network/uri-utils.js'; // was: HI
import { clearStateBits } from '../media/source-buffer.js'; // was: Vv
import { PluginSlotHolder } from '../data/plugin-manager.js'; // was: t_
import { createOneOffSigner } from '../core/event-registration.js'; // was: ud
import { ProtobufStreamParser } from '../media/bitstream-reader.js'; // was: SX
import { getVideoId } from './time-tracking.js'; // was: MY()
import { getQualityLabel } from '../modules/caption/caption-translation.js'; // was: Em
import { getPersistedQuality } from '../ads/ad-async.js'; // was: XU
import { reevaluateFormat } from './context-updates.js'; // was: iE()
import { ordinalToQualityLabel } from '../media/codec-tables.js'; // was: ZV
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { installPolyfill } from '../core/polyfills.js'; // was: UO
import { getProximaPreference } from '../ads/ad-async.js'; // was: AR
import { enqueueEntry } from '../core/composition-helpers.js'; // was: TQ
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { getStreamTimeOffsetNQ } from './time-tracking.js'; // was: NQ()
import { miniplayerIcon } from '../ui/svg-icons.js'; // was: D1
import { OnLayoutSelfExitRequestedTrigger } from '../ads/ad-trigger-types.js'; // was: bh
import { audioTrackLabelMap } from './time-tracking.js'; // was: h5
import { setActiveAudioTrack } from '../data/bandwidth-tracker.js'; // was: PXO
import { getTraceBackend } from '../data/gel-core.js'; // was: yp
import { signalFZUpdate } from './context-updates.js'; // was: Ig()
import { positionMarkerOverlays } from '../ui/progress-bar-impl.js'; // was: UC
import { shouldUseSabr } from '../media/seek-controller.js'; // was: M8
import { isGaplessShortEligible } from '../media/seek-controller.js'; // was: wA
import { loadVideoFromData } from './media-state.js'; // was: sH
import { onMediaSourceOpen } from '../media/codec-helpers.js'; // was: qox
import { RetryInfo } from '../media/error-handler.js'; // was: jZn
import { getExperimentFlags } from './time-tracking.js'; // was: Ty()
import { buildSeekSourceKey } from '../media/mse-internals.js'; // was: Kxd
import { updatePresenterState } from './playback-mode.js'; // was: RE
import { buildQueryParam } from '../core/misc-helpers.js'; // was: Ld
import { isAv1Disabled } from '../media/audio-normalization.js'; // was: jm
import { setSliderValue } from '../ui/progress-bar-impl.js'; // was: CI
import { isVideoPlayerSeekDisabled } from '../media/live-playback.js'; // was: A5
import { isPlayableLive } from '../ads/ad-async.js'; // was: sx
import { safeHtmlFrom } from '../core/composition-helpers.js'; // was: ne
import { setAndClearStateBits } from '../media/source-buffer.js'; // was: BD
import { SuggestedActionBadge } from '../media/live-state.js'; // was: aN
import { testUrlPattern } from '../ads/ad-scheduling.js'; // was: tI
import { buildNextState } from '../media/source-buffer.js'; // was: XN
import { hasAdPlacements } from './caption-manager.js'; // was: Ym
import { timedInvoke } from '../core/event-registration.js'; // was: pO
import { findPlayerByCpn } from './media-state.js'; // was: Te7
import { logBiscottiStats } from '../data/interaction-logging.js'; // was: f2
import { setConfig } from '../core/composition-helpers.js'; // was: y$
import { PLAYER_ERROR_CODES } from '../ui/cue-manager.js'; // was: MpW
import { CloseRequestedTrigger } from '../ads/ad-trigger-types.js'; // was: fz
import { restoreAudioTrackPreference } from './video-loader.js'; // was: Io
import { adBadgeViewModel } from '../core/misc-helpers.js'; // was: nK
import { PlayerError } from '../ui/cue-manager.js';
import { playVideo } from './player-events.js';
import { compose } from '../core/composition-helpers.js';
import { getPlaybackRate, setPlaybackRate, getCurrentTime, isAtLiveHead } from './time-tracking.js';
import { dispose } from '../ads/dai-cue-range.js';
import { remove } from '../core/array-utils.js';
import { containsValue } from '../core/object-utils.js';
import { getYtNow } from './time-tracking.js';
import { ERROR_MESSAGES } from '../core/errors.js';
import { globalScheduler } from '../core/scheduler.js';
// TODO: resolve g.KD
// TODO: resolve g.h
// TODO: resolve g.pl
// TODO: resolve g.xh

/**
 * Player Context Updates — SABR context updates, abnormality detection,
 * DB restart/reset, SZ/L3 selectable format lists, quality selection,
 * audio track switching, and error handling via o$.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~98500–99500
 *
 * All methods in this file belong to the g.Ff (VideoPlayer) class which
 * extends g.W1.  The class instance is the core video-player controller
 * responsible for managing playback, formats, DRM, loader, and media
 * element interaction.
 *
 * Key subsystems:
 *   - Selectable format enumeration (SZ, L3) and quality preference
 *     resolution (t_, G3, ud, Ct)
 *   - Quality override handling (Dw, O2) with performance cap support
 *   - Audio track management (s2, setUserAudio51Preference, RE)
 *   - Player context update propagation to SABR (E2) with
 *     abnormality detection hooks
 *   - Error surfacing via o$ — builds structured error objects and
 *     transitions the player into error state (128)
 *   - DB restart/reset flow: clears 2048 flag, disposes loader or
 *     restarts playback
 *   - Proxima latency preference, playlist overlay, and
 *     iE (internal format re-evaluation)
 *
 * [was: methods on g.Ff — SZ, L3, ud, Ct, t_, G3, Xt, O2, Dw,
 *  getUserPlaybackQualityPreference, hasSupportedAudio51Tracks,
 *  setUserAudio51Preference, getUserAudio51Preference,
 *  setProximaLatencyPreference, getProximaLatencyPreference,
 *  isProximaLatencyEligible, ZS, TQ, iE, s2, getAvailableAudioTracks,
 *  getAudioTrack, So, YH, Ig, hB, ew, onPlayerRequestSent, vM, VH,
 *  pK, GW, g9, MJ, RE, FK, Ld, Px, z8, handleError, mR, CI, HI, fL,
 *  Ra, pauseVideo, stopVideo, NE, seekTo, Ts, Ym, uY, zA, E2, DI,
 *  o$, DB]
 */

// ---------------------------------------------------------------------------
// Selectable formats error fallback  (lines 98499–98505)
// ---------------------------------------------------------------------------

/**
 * When no selectable formats are available after playback setup, the
 * player raises a fatal or retryable error via o$.
 *
 * If the stream is a live broadcast on an unsupported browser the error
 * code is "html5.unsupportedlive" (severity 2).  Otherwise, if the
 * video data indicates an unplayable format the code is "fmt.unplayable"
 * (severity 1), falling back to "fmt.noneavailable".
 *
 * [was: inline tail of the playback-start path inside g.Ff]
 *
 * @param {Object} self  g.Ff instance (this)
 */
export function handleNoSelectableFormats(self) { // was: inline (lines 98499–98503)
  let NetworkErrorCode; // was: c
  let severity;  // was: Q

  if (self.videoData.isLivePlayback && !g.KD(self.FI.K, true)) { // was: !0
    NetworkErrorCode = "html5.unsupportedlive";
    severity = 2;
  } else {
    NetworkErrorCode = self.videoData.Ir()
      ? "fmt.unplayable"
      : "fmt.noneavailable";
    severity = 1;
  }

  reportWarning(Error("selectableFormats"));
  self.o$(NetworkErrorCode, severity, "HTML5_NO_AVAILABLE_FORMATS_FALLBACK", "trg.selectableFormats");
}

// ---------------------------------------------------------------------------
// DB — restart player (dispose loader or re-init)  (lines 98506–98516)
// ---------------------------------------------------------------------------

/**
 * Restarts the player, optionally logging a QoE restart event.
 *
 * Transitions the player state into 2048 (loading), then disposes of
 * the current media source setup.  If the video data has pending
 * initialization (`videoData.W.j()`) or the media element is still a
 * view, the loader is reset and a new element is requested via HI.
 * Otherwise the media is torn down via Lf and, if playing, playback
 * is resumed.  Finally clears the 2048 flag if the player is paused.
 *
 * [was: DB]
 *
 * @param {Object} [restartInfo]  Optional details attached to the
 *   "qoe.restart" error event.
 */
export function restartPlayer(self, restartInfo) { // was: DB(Q)
  if (restartInfo) {
    self.I$(new PlayerError("qoe.restart", restartInfo));
  }

  self.OO(addStateBits(self.playerState, 2048));
  self.VH(); // was: VH — dispose media source

  const hasPendingInit = self.videoData.W && self.videoData.W.j(); // was: Q (reused)
  const isMediaView = self.mediaElement && self.mediaElement.isView(); // was: c

  if (hasPendingInit || isMediaView) {
    if (self.loader) {
      VPd(self.loader);
    }
    self.setBgeNetworkStatus(); // was: HI — request new element
  } else {
    Lf(self); // teardown current media
    if (self.playerState.isOrWillBePlaying()) {
      self.playVideo();
    }
  }

  if (!self.playerState.isOrWillBePlaying()) {
    self.OO(clearStateBits(self.playerState, 2048));
  }
}

// ---------------------------------------------------------------------------
// SZ — get selectable video formats  (lines 98517–98522)
// ---------------------------------------------------------------------------

/**
 * Returns the list of selectable video formats for the current stream.
 *
 * Delegates to the format-selection subsystem (`z1.W.SZ`) after
 * computing the active quality constraint via GK / t_.
 *
 * [was: SZ]
 *
 * @returns {Array} Selectable video format descriptors, or [] if
 *   the format selector (z1) is not yet initialized.
 */
export function getSelectableVideoFormats(self) { // was: SZ()
  if (!self.z1) return [];
  const qualityConstraint = GK(self.aR, self.z1, self.PluginSlotHolder()); // was: Q
  return self.z1.W.SZ(qualityConstraint);
}

// ---------------------------------------------------------------------------
// L3 — get selectable audio formats  (lines 98523–98528)
// ---------------------------------------------------------------------------

/**
 * Returns the list of selectable audio formats (L3) for the current
 * stream, subject to the active quality constraint.
 *
 * [was: L3]
 *
 * @returns {Array} Selectable audio format descriptors, or [].
 */
export function getSelectableAudioFormats(self) { // was: L3()
  if (!self.z1) return [];
  const qualityConstraint = GK(self.aR, self.z1, self.PluginSlotHolder()); // was: Q
  return self.z1.W.L3(qualityConstraint);
}

// ---------------------------------------------------------------------------
// ud — user-driven quality available  (line 98529–98531)
// ---------------------------------------------------------------------------

/**
 * Returns whether the user-driven quality selector is available.
 *
 * [was: ud]
 *
 * @returns {*} Result from aR.ud, gated on whether z1 has a
 *   current format.
 */
export function isUserDrivenQualityAvailable(self) { // was: ud()
  return self.aR.createOneOffSigner(!!self.z1?.W?.W());
}

// ---------------------------------------------------------------------------
// Ct — current quality constraint  (lines 98532–98534)
// ---------------------------------------------------------------------------

/**
 * Returns the current quality constraint from the adaptive-rate
 * controller, or the identity constraint (ab) if the format selector
 * is not initialized.
 *
 * [was: Ct]
 *
 * @returns {Object} Quality constraint object.
 */
export function getCurrentQualityConstraint(self) { // was: Ct()
  return self.z1 ? self.aR.Ct(self.z1) : ab;
}

// ---------------------------------------------------------------------------
// t_ — compute effective quality cap  (lines 98535–98540)
// ---------------------------------------------------------------------------

/**
 * Computes the effective quality cap taking into account the DRM
 * adapter (Y1) state, live stream status, and output-restricted (wf)
 * flag.
 *
 * If the DRM adapter exists, its cap is used.  Otherwise, for a live
 * stream with pending initialization the cap is IN (a live-specific
 * constraint); all other cases default to ab (identity / no cap).
 * When the player is output-restricted (wf), an additional DRM
 * downgrade composition (hv0) is applied.
 *
 * [was: t_]
 *
 * @returns {Object} Composed quality cap.
 */
export function getEffectiveQualityCap(self) { // was: t_()
  let cap; // was: Q

  if (self.Y1) {
    cap = self.Y1.PluginSlotHolder();
  } else if (Ll(self.videoData) && self.videoData.W && self.videoData.W.j()) {
    cap = self.videoData.ProtobufStreamParser ? ab : IN;
  } else {
    cap = ab;
  }

  if (self.wf) {
    cap = cap.compose(hv0); // DRM output-restriction downgrade
  }

  return cap;
}

// ---------------------------------------------------------------------------
// G3 — get quality constraint for current format  (lines 98541–98543)
// ---------------------------------------------------------------------------

/**
 * Returns the quality constraint for the currently selected format,
 * or the identity constraint (ab) if no format selector is active.
 *
 * [was: G3]
 *
 * @returns {Object} Quality constraint.
 */
export function getFormatQualityConstraint(self) { // was: G3()
  return self.z1 ? GK(self.aR, self.z1, self.PluginSlotHolder()) : ab;
}

// ---------------------------------------------------------------------------
// Xt — check if video is in history  (lines 98544–98548)
// ---------------------------------------------------------------------------

/**
 * Checks whether the current video (by video ID or prefetched key) is
 * present in the playback history tracker (sO.Pk).
 *
 * [was: Xt]
 *
 * @returns {boolean}
 */
export function isInPlaybackHistory(self) { // was: Xt()
  const videoId = self.getVideoId; // was: Q
  const prefetchedVideoId = self.sO.a$().videoId; // was: c
  return self.sO.Pk.Xt(videoId) || self.sO.Pk.Xt(prefetchedVideoId);
}

// ---------------------------------------------------------------------------
// O2 — report quality selection to QoE  (lines 98549–98556)
// ---------------------------------------------------------------------------

/**
 * Reports the quality selection mode and target resolution to the QoE
 * subsystem (Vp).
 *
 * If the quality is the identity constraint (auto), reports mode "A".
 * Otherwise resolves the maximum resolution from the L3 selectable
 * formats and reports mode "M" with that value.
 *
 * [was: O2]
 *
 * @param {Object} qualityPreference  The quality preference object
 *   whose `.W` property is the numeric quality ordinal.
 */
export function reportQualitySelection(self, qualityPreference) { // was: O2(Q)
  if (qualityPreference.W === ab.W) {
    self.Vp.O2("A");
  } else {
    const selectableFormats = self.z1?.W?.L3(qualityPreference) // was: c
      ?.map(format => format.video) // was: W
      ?.sort((a, b) => (b.A ?? 0) - (a.A ?? 0)); // was: (W, m)
    self.Vp.O2(
      "M",
      selectableFormats?.[0]?.A ?? (r9m(qualityPreference.W) ? qualityPreference.W : 0),
    );
  }
}

// ---------------------------------------------------------------------------
// Dw — set quality preference and apply  (lines 98557–98586)
// ---------------------------------------------------------------------------

/**
 * Sets the user's quality preference and triggers a format
 * re-evaluation.
 *
 * Calls O2 to report the selection, persists the preference on
 * videoData.pB, and if the format selector (z1) and a save flag are
 * set, writes the quality value to localStorage via `storageSet` and
 * adjusts the playback rate if it exceeds the capability of the new
 * quality level.
 *
 * Finally, if a loader is active, the quality change reason string is
 * forwarded to the appropriate segment selection policy, and iE is
 * called to re-evaluate the format.
 *
 * [was: Dw]
 *
 * @param {Object} qualityPreference  Quality preference object.
 * @param {boolean} save              Whether to persist the change.
 * @param {string} [reason]           Reason string for the loader.
 */
export function setQualityPreference(self, qualityPreference, save, reason) { // was: Dw(Q, c, W)
  self.O2(qualityPreference);
  self.videoData.pB = qualityPreference;

  if (self.z1 && save) {
    const rateController = self.aR; // was: c (reused)
    const formatSelector = self.z1; // was: m

    if (formatSelector.W.W()) {
      const maxQualityUpgrade = getExperimentValue(rateController.FI.experiments, "html5_max_quality_sel_upgrade"); // was: K
      let targetQuality = maxQualityUpgrade ? qualityPreference.W : qualityLabelToOrdinal[getQualityLabel(qualityPreference)]; // was: T
      const currentQualityOrdinal = formatSelector.W.videoInfos[0].video.qualityOrdinal; // was: r
      const isCurrentQuality = currentQualityOrdinal !== 0 && qualityPreference.W === currentQualityOrdinal; // was: U
      const isAboveUser = getPersistedQuality() > currentQualityOrdinal; // was: r (reused)

      if (!(isCurrentQuality && isAboveUser)) {
        if (maxQualityUpgrade && isCurrentQuality) {
          targetQuality = Math.max(targetQuality, maxQualityUpgrade);
        }

        const canAdapt = vP(rateController, formatSelector.W?.videoInfos); // was: K (reused)
        let playbackRate = rateController.EH.getPlaybackRate(); // was: U (reused)

        if (playbackRate > 1 && canAdapt) {
          const maxRateQuality = r0x(rateController.FI.K, formatSelector.W.videoInfos, playbackRate); // was: K (reused)
          if (qualityPreference.W !== 0 && maxRateQuality < qualityPreference.W) {
            rateController.EH.setPlaybackRate(1);
          }
        }

        storageSet("yt-player-quality", {
          quality: targetQuality,
          previousQuality: formatSelector.videoData.O?.video?.qualityOrdinal || 0,
        }, 31104e3); // ~1 year in seconds

        rateController.Qp.policy.O = getPersistedQuality() >= 480;

        if (rateController.X("html5_perf_cap_override_sticky")) {
          Pgw(rateController.A, rateController.X("html5_perserve_av1_perf_cap"));
        }
      }
    }
  }

  if (self.loader) {
    const loader = self.loader; // was: Q (reused)
    const changeReason = reason || ""; // was: W (reused)
    if (loader.policy.W) {
      cV(loader.K.W, changeReason);
    } else {
      cV(loader.W.K, changeReason);
    }
  }

  self.reevaluateFormat;
}

// ---------------------------------------------------------------------------
// getUserPlaybackQualityPreference  (lines 98587–98589)
// ---------------------------------------------------------------------------

/**
 * Returns the user's persisted playback quality preference as a
 * human-readable quality label string (e.g. "hd720", "large").
 *
 * If the format list (videoData.A) is loaded and not empty, returns
 * the resolved quality from the preference object.  Otherwise falls
 * back to the global user quality setting (XU → ZV lookup).
 *
 * [was: getUserPlaybackQualityPreference]
 *
 * @returns {string} Quality label.
 */
export function getUserPlaybackQualityPreference(self) { // was: getUserPlaybackQualityPreference()
  return self.videoData.A && !self.videoData.A.W()
    ? getQualityLabel(self.videoData.pB)
    : ordinalToQualityLabel[getPersistedQuality()];
}

// ---------------------------------------------------------------------------
// Audio 5.1 preference  (lines 98590–98602)
// ---------------------------------------------------------------------------

/**
 * Whether any audio tracks support 5.1 surround.
 * [was: hasSupportedAudio51Tracks]
 * @returns {boolean}
 */
export function hasSupportedAudio51Tracks(self) { // was: hasSupportedAudio51Tracks()
  return self.videoData.hasSupportedAudio51Tracks();
}

/**
 * Persists the user's 5.1 audio preference.
 *
 * Logs a "toggle51" telemetry event and writes to localStorage via
 * `storageSet`.  Triggers a format re-evaluation via Bb.
 *
 * [was: setUserAudio51Preference]
 *
 * @param {*} preference  New preference value.
 * @param {boolean} longExpiry  If true the cookie lives ~1 year,
 *   otherwise ~30 days.
 */
export function setUserAudio51Preference(self, preference, longExpiry) { // was: setUserAudio51Preference(Q, c)
  if (self.getUserAudio51Preference() !== preference) {
    self.RetryTimer("toggle51", { pref: preference });
    storageSet(
      "yt-player-audio51",
      preference,
      longExpiry ? 31536e3 : 2592e3, // was: c ? 31536E3 : 2592E3
    );
    self.Bb();
  }
}

/**
 * Returns the current 5.1 audio preference.
 * [was: getUserAudio51Preference]
 */
export function getUserAudio51Preference(self) { // was: getUserAudio51Preference()
  return self.videoData.getUserAudio51Preference();
}

// ---------------------------------------------------------------------------
// Proxima latency preference  (lines 98603–98621)
// ---------------------------------------------------------------------------

/**
 * Sets the Proxima low-latency preference and, if it changed, seeks
 * to the live head.
 *
 * [was: setProximaLatencyPreference]
 *
 * @param {number} preference  The new latency preference value.
 */
export function setProximaLatencyPreference(self, preference) { // was: setProximaLatencyPreference(Q)
  const previousPreference = self.getProximaLatencyPreference(); // was: c

  self.RetryTimer("proxima", { pref: preference });
  storageSet("yt-player-proxima-pref", preference, 31536e3); // ~1 year

  if (previousPreference !== preference) {
    const seekTimeline = self.installPolyfill; // was: Q (reused)
    seekTimeline.La = true; // was: !0
    seekTimeline.EH.seekTo(Infinity, {
      Z7: "seektimeline_proximaSeekToHead",
      seekSource: 34,
    });
  }
}

/**
 * Returns the stored Proxima latency preference, defaulting to 0.
 * [was: getProximaLatencyPreference]
 * @returns {number}
 */
export function getProximaLatencyPreference() { // was: getProximaLatencyPreference()
  return getProximaPreference() ?? 0;
}

/**
 * Whether the current video is eligible for Proxima low-latency mode.
 * [was: isProximaLatencyEligible]
 * @returns {boolean}
 */
export function isProximaLatencyEligible(self) { // was: isProximaLatencyEligible()
  return self.videoData.isProximaLatencyEligible;
}

// ---------------------------------------------------------------------------
// Playlist overlay / video ID events  (lines 98622–98627)
// ---------------------------------------------------------------------------

/**
 * Signals a "playlist overlay viewed" event for the current video.
 * [was: ZS]
 */
export function signalPlaylistOverlayViewed(self) { // was: ZS()
  if (self.videoData.videoId) {
    self.sO.ZS(self.videoData);
  } else {
    self.RetryTimer("povid", {});
  }
}

/**
 * Signals a "playlist item added via overlay" event.
 * [was: TQ]
 */
export function signalPlaylistItemAddedViaOverlay(self) { // was: TQ()
  if (self.videoData.videoId) {
    self.sO.enqueueEntry(self.videoData);
  } else {
    self.RetryTimer("piavid", {});
  }
}

// ---------------------------------------------------------------------------
// iE — internal format re-evaluation  (lines 98628–98658)
// ---------------------------------------------------------------------------

/**
 * Re-evaluates which format to use and transitions the media source
 * if necessary.
 *
 * If the player is in a terminal or error state, does nothing.  When
 * the format list is fully loaded and reports `W()` (empty/auto), it
 * delegates to d3 for adaptive bitrate selection.  Otherwise it walks
 * the explicit format candidates (EC) to find one whose quality
 * ordinal is at or below the computed cap, sets `videoData.MM`, and
 * calls SV/vtW to apply it.
 *
 * If the player is currently playing (or will be), it clears the
 * pending-play flag and re-enters playVideo.
 *
 * [was: iE]
 */
export function reevaluateFormat(self) { // was: iE()
  if (self.u0() || self.playerState.W(128) || !self.videoData.A) return;

  if (self.videoData.A.W()) {
    applyQualityConstraint(self); // adaptive bitrate selection
  } else {
    const qualityCap = sb(self); // was: m

    // Walk format candidates to find the best match under the cap
    let selectedFormat; // was: c (inner block)
    const formatCandidates = self.videoData.toggleFineScrub; // was: W (inner block)

    if (qualityCap.W) {
      for (const candidate of formatCandidates) { // was: K
        const info = candidate.getInfo(); // was: T
        const qualityOrdinal = qualityLabelToOrdinal[info.video.quality]; // was: r

        if ((!qualityCap.A || info.video.quality !== "auto") && qualityOrdinal <= qualityCap.W) {
          selectedFormat = candidate;
          break;
        }
      }
      if (!selectedFormat) {
        selectedFormat = formatCandidates[formatCandidates.length - 1];
      }
    } else {
      selectedFormat = formatCandidates[0];
    }

    self.videoData.MM = selectedFormat; // was: Q.MM = c
    SV(self, qualityCap.reason, vtW(self, self.videoData.MM));
  }

  const isPlayingCheck = self.X("html5_check_unstarted")
    ? self.playerState.isOrWillBePlaying()
    : self.isPlaying();

  if (isPlayingCheck) {
    self.installPolyfill.Y = false; // was: !1 — clear pending-play flag
    self.playVideo();
  }
}

// ---------------------------------------------------------------------------
// s2 — set audio track  (lines 98659–98727)
// ---------------------------------------------------------------------------

/**
 * Switches to the requested audio track.
 *
 * Behaviour depends on the stream type:
 * - Adaptive (loader present, format list loaded): delegates to
 *   `loader.setAudioTrack` with optional time-offset for seamless
 *   switching.
 * - HLS native (`GL7`): toggles the HTMLMediaElement's audioTracks
 *   list.
 * - Non-adaptive (YKn-based formats): updates each format's internal
 *   audio pointer and publishes an "internalaudioformatchange" event.
 *
 * Returns true if the track switch was accepted, false if the player
 * is in a terminal or error state.
 *
 * [was: s2]
 *
 * @param {Object} audioTrack           The audio track descriptor.
 * @param {boolean} seamlessSwitch      Whether to attempt seamless
 *   switching (offset-based).
 * @returns {boolean}
 */
export function setAudioTrack(self, audioTrack, seamlessSwitch) { // was: s2(Q, c)
  if (self.u0() || self.playerState.W(128)) return false; // was: !1

  const hasAdaptiveFormats = !!self.videoData.A?.W(); // was: W
  const timeOffset = hasAdaptiveFormats && seamlessSwitch // was: m
    ? self.getCurrentTime() - self.getStreamTimeOffsetNQ
    : NaN;

  // Log audio-format-info to QoE
  if (audioTrack.miniplayerIcon && audioTrack.miniplayerIcon.id) {
    const qoeTracker = self.Vp; // was: K
    if (qoeTracker.qoe) {
      const qoe = qoeTracker.qoe; // was: K (reused)
      const logParts = [audioTrack.miniplayerIcon.id, isNaN(timeOffset) ? "m" : "t"]; // was: r
      recordTimedStat(qoe, getYtNow(qoe.provider), "afi", logParts);
    }
  }

  if (hasAdaptiveFormats) {
    // Adaptive stream — seamless audio track switch
    if (seamlessSwitch) {
      const bufferHealth = xB(self.installPolyfill); // was: T
      self.RetryTimer("aswh", {
        id: audioTrack.id,
        xtags: audioTrack.xtags,
        OnLayoutSelfExitRequestedTrigger: bufferHealth.toFixed(3),
      });
    }
    self.loader.setAudioTrack(audioTrack, timeOffset, seamlessSwitch);
    return true; // was: !0
  }

  if (GL7(self)) {
    // HLS native audio tracks
    let didSwitch; // was: T (block-scoped)

    const nativeTracks = self.mediaElement.audioTracks(); // was: T (reused)
    let switched = false; // was: c (reused)

    for (let i = 0; i < nativeTracks.length; ++i) { // was: m
      const track = nativeTracks[i]; // was: W (reused)
      if ((audioTrackLabelMap[track.label] || track.label) === audioTrack.miniplayerIcon.getName()) {
        if (track.enabled) {
          didSwitch = false; // was: !1
          break;
        }
        switched = track.enabled = true; // was: !0
      } else if (track.enabled) {
        track.enabled = false; // was: !1
      }
    }

    if (didSwitch === undefined) { // was: void 0
      didSwitch = switched ? true : undefined; // was: c ? !0 : void 0
    }

    if (didSwitch) {
      self.RetryTimer("hlsaudio", { id: audioTrack.id });
    }
  } else {
    // Non-adaptive format-based audio selection
    let trackSwitched; // was: T (block-scoped)

    const videoData = self.videoData; // was: c (reused)

    if (
      (videoData.j && !videoData.j.A()) ||
      audioTrack === videoData.UR ||
      !videoData.toggleFineScrub ||
      videoData.toggleFineScrub.length <= 0
    ) {
      trackSwitched = false; // was: !1
    } else {
      for (const format of videoData.toggleFineScrub) { // was: T (reused)
        if (!(format instanceof YKn)) {
          trackSwitched = false; // was: !1
          break;
        }
        const ykn = format; // was: m (reused)
        const trackId = audioTrack.miniplayerIcon.getId(); // was: W (reused)
        if (ykn.A) {
          setActiveAudioTrack(ykn.A, trackId);
          ykn.getTraceBackend = null;
        }
      }
      if (trackSwitched !== false) {
        videoData.UR = audioTrack;
        trackSwitched = true; // was: !0
      }
    }

    if (trackSwitched && Lf(self)) {
      self.publish("internalaudioformatchange", self.videoData, true); // was: !0
      self.RetryTimer("hlsaudio", { id: audioTrack.id });
    }
  }

  return true; // was: !0
}

// ---------------------------------------------------------------------------
// getAvailableAudioTracks / getAudioTrack  (lines 98728–98738)
// ---------------------------------------------------------------------------

/**
 * Returns all available audio tracks for the current video.
 * [was: getAvailableAudioTracks]
 * @returns {Array}
 */
export function getAvailableAudioTracks(self) { // was: getAvailableAudioTracks()
  return self.videoData.getAvailableAudioTracks();
}

/**
 * Returns the currently active audio track.
 *
 * For HLS native playback (GL7), attempts to resolve the track from
 * the native media element first (PpR).
 *
 * [was: getAudioTrack]
 * @returns {Object|undefined}
 */
export function getAudioTrack(self) { // was: getAudioTrack()
  if (GL7(self)) {
    const nativeTrack = PpR(self); // was: Q
    if (nativeTrack) return nativeTrack;
  }
  return self.videoData.getAudioTrack();
}

// ---------------------------------------------------------------------------
// So, YH, Ig — format info helpers  (lines 98739–98747)
// ---------------------------------------------------------------------------

/**
 * Returns the current stream info (j) from videoData.
 * [was: So]
 */
export function getStreamInfo(self) { // was: So()
  return self.videoData.j;
}

/**
 * Returns the yield hint for a given parameter from the FZ subsystem.
 * [was: YH]
 * @param {*} param
 * @returns {number} 1 if FZ is not initialized.
 */
export function getYieldHint(self, param) { // was: YH(Q)
  return self.FZ ? self.FZ.YH(param) : 1;
}

/**
 * Signals the FZ subsystem to perform its update (Ig).
 * [was: Ig]
 */
export function signalFZUpdate(self) { // was: Ig()
  if (self.FZ) self.FZ.signalFZUpdate;
}

// ---------------------------------------------------------------------------
// hB, ew — network idle triggers  (lines 98748–98753)
// ---------------------------------------------------------------------------

/**
 * If the network is idle and the video can benefit from preloading,
 * triggers the loader's idle-network fetch (q7).
 *
 * [was: hB]
 */
export function triggerIdleNetworkFetch(self) { // was: hB()
  if (
    self.videoData.X("html5_trigger_loader_when_idle_network") &&
    !self.videoData.positionMarkerOverlays() &&
    shouldUseSabr(self.videoData)
  ) {
    self.loader?.q7();
  }
}

/**
 * If the video data indicates a windowed-live stream (wA), triggers
 * the loader's idle fetch.
 *
 * [was: ew]
 */
export function triggerWindowedLiveFetch(self) { // was: ew()
  if (isGaplessShortEligible(self.videoData)) {
    self.loader?.q7();
  }
}

// ---------------------------------------------------------------------------
// onPlayerRequestSent  (line 98754–98756)
// ---------------------------------------------------------------------------

/**
 * Forwards a player request event to the orchestration layer (sO).
 * [was: onPlayerRequestSent]
 */
export function onPlayerRequestSent(self, request) { // was: onPlayerRequestSent(Q)
  self.sO.onPlayerRequestSent(request);
}

// ---------------------------------------------------------------------------
// vM — set media prefetch policy  (lines 98757–98765)
// ---------------------------------------------------------------------------

/**
 * Configures the media prefetch policy on the loader based on the
 * current video data flags (SSDAI, server-stitched DAI, G3 manifest).
 *
 * [was: vM]
 *
 * @param {boolean} [force=false]  Force the update even if conditions
 *   are otherwise unchanged.
 */
export function setMediaPrefetchPolicy(self, force = false) { // was: vM(Q=!1)
  if (self.loader) {
    const loader = self.loader; // was: c
    const vMMethod = loader.vM; // was: W

    const videoData = self.videoData; // was: m
    const shouldPrefetch = videoData.X("html5_ssdai_use_post_for_media") && videoData.enableServerStitchedDai
      ? false // was: !1
      : G3(videoData) && videoData.wX && !videoData.isAd();

    vMMethod.call(loader, shouldPrefetch, force);
  }
}

// ---------------------------------------------------------------------------
// VH — dispose media source  (lines 98766–98771)
// ---------------------------------------------------------------------------

/**
 * Disposes of the current media source (sH) and flushes the loader's
 * prefetch state.
 *
 * [was: VH]
 *
 * @param {boolean} [force=false]  Force flush parameter passed to vM.
 */
export function disposeMediaSource(self, force = false) { // was: VH(Q=!1)
  if (self.loadVideoFromData) {
    self.loadVideoFromData.mF();       // flush
    self.vM(force);      // reset prefetch policy
    self.loadVideoFromData.dispose();   // tear down
    self.loadVideoFromData = null;
  }
}

// ---------------------------------------------------------------------------
// pK — get media source  (lines 98772–98774)
// ---------------------------------------------------------------------------

/**
 * Returns the current MediaSource wrapper (sH), or null.
 * [was: pK]
 * @returns {Object|null}
 */
export function getMediaSource(self) { // was: pK()
  return self.loadVideoFromData;
}

// ---------------------------------------------------------------------------
// GW — attach media source to element  (lines 98775–98792)
// ---------------------------------------------------------------------------

/**
 * Attaches a new media source to the player, updating the internal
 * sH reference and wiring up the open-state callback.
 *
 * If an error occurs during the ziW setup phase, it is caught and
 * surfaced as an "fmt.unplayable" error.
 *
 * [was: GW]
 *
 * @param {Object} mediaSource   The new MediaSource wrapper.
 * @param {boolean} [deferOpen]  Whether to defer the open callback.
 * @param {boolean} [flag2]      Additional setup flag.
 * @param {boolean} [flag3]      Passed to hi0.
 */
export function attachMediaSource(self, mediaSource, deferOpen = false, flag2 = false, flag3 = false) { // was: GW(Q, c=!1, W=!1, m=!1)
  hi0(self, flag3);
  self.loadVideoFromData = mediaSource;

  const onOpen = (source) => { // was: Q (reused as callback param K)
    try {
      ziW(self, source, deferOpen, flag2);
    } catch (error) { // was: T
      reportWarning(error);
      self.handleError(new PlayerError("fmt.unplayable", {
        msi: "1",
        ename: error && typeof error === "object" && "name" in error
          ? String(error.name)
          : undefined, // was: void 0
        trg: "setmediasrc",
      }, 1));
    }
  };

  if (self.ul() && self.loadVideoFromData.A() === "open") {
    onOpen(self.loadVideoFromData);
  } else {
    onMediaSourceOpen(self.loadVideoFromData, onOpen);
  }
}

// ---------------------------------------------------------------------------
// g9 — process DRM init data  (lines 98793–98797)
// ---------------------------------------------------------------------------

/**
 * Processes incoming DRM initialization data: caches it in `Mi` and
 * forwards it to the DRM adapter (Y1) if present.
 *
 * [was: g9]
 *
 * @param {Object} initDataEvent  DRM init-data event with
 *   `.initData` key.
 */
export function processDrmInitData(self, initDataEvent) { // was: g9(Q)
  self.Mi.set(initDataEvent.initData, initDataEvent);
  if (self.Y1) {
    self.Y1.g9(initDataEvent);
    if (!self.X("html5_eme_loader_sync")) {
      self.Mi.remove(initDataEvent.initData);
    }
  }
}

// ---------------------------------------------------------------------------
// MJ — set quality from auto-resolution  (lines 98798–98801)
// ---------------------------------------------------------------------------

/**
 * Overrides the current format to a specific auto-resolution value
 * and triggers adaptive bitrate re-selection.
 *
 * [was: MJ]
 *
 * @param {*} resolution  Resolution parameter (forwarded to createQualityRange).
 */
export function setAutoResolution(self, resolution) { // was: MJ(Q)
  self.videoData.R_ = createQualityRange("auto", resolution, false, "u"); // was: !1
  applyQualityConstraint(self);
}

// ---------------------------------------------------------------------------
// RE — audio format change notification  (lines 98802–98846)
// ---------------------------------------------------------------------------

/**
 * Handles an audio format change event, updating the video data's
 * stream info (j), logging it to QoE, and publishing an
 * "internalaudioformatchange" event.
 *
 * If the new stream info differs from the current one, it constructs
 * a jZn descriptor and forwards it to the QoE system.  The event
 * also triggers a yield-hint update (Ig) and a seek-timeline
 * realignment.
 *
 * [was: RE]
 *
 * @param {Object} changeEvent  Audio format change event with:
 *   - `reason` (string): "m" (manual), "t" (timed), "i" (initial),
 *     or "a" (automatic)
 *   - `W.info` — new stream info
 *   - `W.index` — segment index
 *   - `source`, `token` — provenance metadata
 */
export function onAudioFormatChange(self, changeEvent) { // was: RE(Q)
  let reason = changeEvent.reason; // was: c
  const newStreamInfo = changeEvent.W.info; // was: W
  const source = changeEvent.source; // was: m
  const token = changeEvent.token; // was: K
  const qoeTracker = self.Vp; // was: T
  const videoData = self.videoData; // was: r (const)

  if (newStreamInfo !== videoData.j) {
    const isInitial = !videoData.j; // was: U
    videoData.j = newStreamInfo;

    const isManualOrTimed = reason === "m" || reason === "t"; // was: I
    if (!isManualOrTimed) {
      reason = isInitial ? "i" : "a";
    }

    const descriptor = new RetryInfo(newStreamInfo, reason, "", source, token); // was: c (reused)

    if (qoeTracker.qoe) {
      const qoe = qoeTracker.qoe; // was: T (reused)
      const timestamp = getYtNow(qoe.provider); // was: W (reused)
      const experimentFlags = qoe.provider.FI.getExperimentFlags; // was: e
      const extraParts = []; // was: V

      if (descriptor.W.id !== qoe.MM) {
        const logParts = [descriptor.W.id, qoe.MM, descriptor.reason]; // was: m (reused)
        const pushTarget = extraParts; // was: K (reused)
        const pushMethod = pushTarget.push; // was: X
        const audioDetails = []; // was: B

        const audioInfo = descriptor.W.audio; // was: A
        if (audioInfo) {
          const fidelityClass = audioInfo?.j; // was: n
          if (fidelityClass !== undefined) { // was: void 0
            audioDetails.push(`fl.${fidelityClass}`);
          }
          let volumeGain = audioInfo?.A; // was: A (reused)
          if (volumeGain !== undefined) { // was: void 0
            volumeGain = Math.min(-volumeGain, 0);
            audioDetails.push(`vg.${volumeGain}`);
            audioDetails.push("nm.4");
          }
        }

        pushMethod.call(pushTarget, ...audioDetails);

        if (experimentFlags.W.BA(Pf) && descriptor.reason === "i") {
          extraParts.push(buildSeekSourceKey(qoe, descriptor));
        }

        if (extraParts.length > 0) {
          logParts.push(extraParts.join(";"));
        }

        if (descriptor.token) {
          logParts.push(descriptor.token);
        }

        recordTimedStat(qoe, timestamp, "afs", logParts);
        qoe.MM = descriptor.W.id;
      }
    }

    self.publish("internalaudioformatchange", videoData, !isInitial && isManualOrTimed);
  }

  self.signalFZUpdate;
  self.installPolyfill.updatePresenterState(changeEvent.W.index);
}

// ---------------------------------------------------------------------------
// FK — local media change  (line 98847–98849)
// ---------------------------------------------------------------------------

/**
 * Publishes a "localmediachange" event.
 * [was: FK]
 */
export function onLocalMediaChange(self, payload) { // was: FK(Q)
  self.publish("localmediachange", payload);
}

// ---------------------------------------------------------------------------
// Ld — trigger loader download  (lines 98850–98852)
// ---------------------------------------------------------------------------

/**
 * Asks the loader to begin downloading with the current config and
 * video data parameters.
 * [was: Ld]
 * @param {Object} [options={}]
 */
export function triggerLoaderDownload(self, options = {}) { // was: Ld(Q={})
  self.loader?.buildQueryParam(self.FI, isAv1Disabled(self.videoData), options);
}

// ---------------------------------------------------------------------------
// Px, z8, handleError, mR  (lines 98853–98866)
// ---------------------------------------------------------------------------

/** [was: Px] @returns {*} */
export function getRecoveryInfo(self) { return self.Oh.Px(); }

/**
 * Reports a stale-config condition.
 * [was: z8]
 * @param {string} reason
 */
export function reportStaleConfig(self, reason) { // was: z8(Q)
  self.I$(new PlayerError("staleconfig", { reason }));
}

/**
 * Forwards an error to the error-recovery subsystem (Oh).
 * [was: handleError]
 * @param {Object} error  PlayerError error instance.
 */
export function handleError(self, error) { // was: handleError(Q)
  self.Oh.handleError(error);
}

/**
 * Returns the current error-recovery mode.
 * [was: mR]
 */
export function getErrorRecoveryMode(self) { return self.Oh.mR(); }

// ---------------------------------------------------------------------------
// CI — update seek timeline captions  (line 98867–98869)
// ---------------------------------------------------------------------------

/**
 * Forwards a CI update to the seek timeline (UO).
 * [was: CI]
 */
export function updateSeekTimelineCaptions(self, data) { // was: CI(Q)
  self.installPolyfill.setSliderValue(data);
}

// ---------------------------------------------------------------------------
// HI — request new media element  (lines 98870–98891)
// ---------------------------------------------------------------------------

/**
 * Requests a new media element, resetting the loader and seeking to
 * the appropriate position for live or looped playback.
 *
 * Called after DRM key rotation, capability changes, or when the
 * MediaSource is irrecoverably stale.
 *
 * [was: HI]
 *
 * @param {boolean} [awaitReady=false]  If true, awaits g3 before
 *   proceeding.
 * @param {boolean} [seekToZero=false]  If true, seeks to time 0
 *   after the new element is attached.
 */
export async function requestNewElement(self, awaitReady = false, seekToZero = false) { // was: HI(Q=!1, c=!1)
  if (self.loader) self.loader.UQ();
  if (self.loader && self.loader.u0()) jV(self);

  if (self.X("html5_enable_vp9_fairplay") && self.Ir()) {
    self.videoData.W?.Fw();
  }

  self.OO(addStateBits(self.playerState, 2048));
  self.publish("newelementrequired");

  if (awaitReady) await g3(self);

  // Live stream handling
  if (self.videoData.positionMarkerOverlays() && self.loader?.Ie && !isVideoPlayerSeekDisabled(self)) {
    if (self.isAtLiveHead() && v4(self.videoData)) {
      self.seekTo(Infinity, { Z7: "videoPlayer_getNewElement" });
    } else if (self.videoData.DE && self.loader) {
      const loader = self.loader; // was: Q (reused)
      if (loader.k0.positionMarkerOverlays) {
        if (loader.k0.DE || loader.k0.isWindowedLive || loader.k0.isPremiere) {
          loader.seek(0, { Z7: "loader_resetSqless" });
          loader.videoTrack.D = true;  // was: !0
          loader.audioTrack.D = true;  // was: !0
          loader.videoTrack.j = true;  // was: !0
          loader.audioTrack.j = true;  // was: !0
        } else if (isPlayableLive(loader.k0)) {
          Qo(loader);
        }
      }
    }
  }

  if (seekToZero) {
    self.seekTo(0, { seekSource: 105 });
  }

  if (self.playerState.W(8)) self.playVideo();
}

// ---------------------------------------------------------------------------
// fL — handle "get new element" response  (lines 98892–98899)
// ---------------------------------------------------------------------------

/**
 * Handles the result of a "get new element" request.  Clears the
 * pending-element flag and, if successful, requests a new element.
 *
 * [was: fL]
 *
 * @param {boolean} success  Whether the element was obtained.
 */
export function handleGetNewElement(self, success) { // was: fL(Q)
  self.RetryTimer("hgte", { safeHtmlFrom: +success });
  self.videoData.J = false; // was: !1
  if (success) self.setBgeNetworkStatus();
  if (self.loader) VPd(self.loader);
}

// ---------------------------------------------------------------------------
// Ra — request new element with telemetry  (lines 98900–98905)
// ---------------------------------------------------------------------------

/**
 * Logs a "newelem" event with the given reason and requests a new
 * media element.
 *
 * [was: Ra]
 *
 * @param {string} reason  Reason string for the request.
 */
export function requestNewElementWithReason(self, reason) { // was: Ra(Q)
  self.RetryTimer("newelem", { r: reason });
  self.setBgeNetworkStatus();
}

// ---------------------------------------------------------------------------
// pauseVideo  (lines 98906–98917)
// ---------------------------------------------------------------------------

/**
 * Pauses video playback, handling special states such as ads (64),
 * ended (2), seeking (32), and background pausing (256).
 *
 * [was: pauseVideo]
 *
 * @param {boolean} [backgroundPause=false]  If true, applies the 256
 *   (background) state flag instead of transitioning to paused (4).
 * @param {*} [stoppageReason]  Reason metadata attached to the state
 *   transition.
 */
export function pauseVideo(self, backgroundPause = false, stoppageReason) { // was: pauseVideo(Q=!1, c)
  if ((self.playerState.W(64) || self.playerState.W(2)) && !backgroundPause) {
    if (self.playerState.W(8)) {
      self.OO(setAndClearStateBits(self.playerState, 4, 8, null, stoppageReason));
    } else if (self.SuggestedActionBadge()) {
      Lf(self);
    } else {
      return;
    }
  }

  if (!self.playerState.W(128)) {
    if (backgroundPause) {
      self.OO(addStateBits(self.playerState, 256, null, stoppageReason));
    } else {
      self.OO(setAndClearStateBits(self.playerState, 4, 8, null, stoppageReason));
    }
  }

  if (self.mediaElement) self.mediaElement.pause();

  if (g.pl(self.videoData) && self.loader) {
    self.loader?.T2(false); // was: !1
  }
}

// ---------------------------------------------------------------------------
// stopVideo  (lines 98918–98922)
// ---------------------------------------------------------------------------

/**
 * Stops video playback: pauses, disables the loader's timed text,
 * and performs a full stop on the loader.
 *
 * [was: stopVideo]
 */
export function stopVideo(self) { // was: stopVideo()
  self.pauseVideo();
  if (self.loader) {
    self.loader?.T2(false); // was: !1
    self.loader.testUrlPattern();
  }
}

// ---------------------------------------------------------------------------
// NE — full player stop / reset  (lines 98923–98929)
// ---------------------------------------------------------------------------

/**
 * Performs a full stop of the player, optionally preserving the media
 * element.
 *
 * Disposes event handlers (Fy) and clears loader state (jV).  Removes
 * the current video from the playback session cache.
 *
 * [was: NE]
 *
 * @param {boolean} [preserveElement=false]  If true, transitions to
 *   an unstarted state instead of fully resetting.
 * @param {boolean} [softStop=false]  If true and a media element
 *   exists, calls NE on it instead of stopVideo.
 */
export function fullStop(self, preserveElement = false, softStop = false) { // was: NE(Q=!1, c=!1)
  if (self.ul() && softStop) {
    self.mediaElement?.NE();
  } else {
    self.mediaElement?.stopVideo();
  }

  Fy(self);
  jV(self);

  if (!self.playerState.W(128)) {
    if (preserveElement) {
      self.OO(clearStateBits(clearStateBits(addStateBits(self.playerState, 4), 8), 16));
    } else {
      self.OO(buildNextState(self.playerState));
    }
  }

  if (self.videoData.videoId) {
    self.FI.Ka.remove(self.videoData.videoId);
  }
}

// ---------------------------------------------------------------------------
// seekTo  (lines 98930–98942)
// ---------------------------------------------------------------------------

/**
 * Seeks to the specified time.
 *
 * Clears the ended state (2) if active, optionally sets the loading
 * flag (2048), and forwards VSS (Video Stats Service) updates when
 * appropriate.  Delegates the actual seek to the seek timeline (UO).
 *
 * [was: seekTo]
 *
 * @param {number} time             Target time in seconds.
 * @param {Object} [options={}]     Seek options including
 *   `seekSource`, `UK0`, `Z7`.
 */
export function seekTo(self, time, options = {}) { // was: seekTo(Q, c={})
  if (self.playerState.W(2)) Lf(self); // clear ended state

  if (options.UK0) {
    self.OO(addStateBits(self.playerState, 2048));
  }

  if (
    (options.seekSource === 58 || options.seekSource === 60) &&
    self.X("html5_update_vss_during_gapless_seeking")
  ) {
    const qoeTracker = self.Vp; // was: W
    if (qoeTracker.W) {
      const vss = qoeTracker.W; // was: W (reused)
      if (options.seekSource === 58) {
        vss.W.update();
      } else if (vss.A) {
        vss.D();
        Cw(vss).send();
        vss.O = NaN;
      }
    }
  }

  self.installPolyfill.seekTo(time, options);
  self.ag.sync();
}

// ---------------------------------------------------------------------------
// Ts — begin seeking  (lines 98943–98950)
// ---------------------------------------------------------------------------

/**
 * Marks the beginning of a user-initiated seek.
 *
 * Records the seek-start timestamp, transitions to the 32 (UI
 * seeking) state, pauses playback if playing, publishes
 * "beginseeking", and kicks a progress update.
 *
 * [was: Ts]
 *
 * @param {Object} [seekOptions]  Optional seek-source metadata.
 */
export function beginSeeking(self, seekOptions) { // was: Ts(Q)
  self.KO.j.O = (0, g.h)(); // record seek-start time
  if (!self.playerState.W(32)) {
    self.OO(addStateBits(self.playerState, 32, seekOptions?.seekSource));
    if (self.playerState.W(8)) self.pauseVideo(true); // was: !0
    self.publish("beginseeking");
  }
  self.kx();
}

// ---------------------------------------------------------------------------
// Ym — end seeking  (lines 98951–98978)
// ---------------------------------------------------------------------------

/**
 * Marks the end of a user-initiated seek and logs telemetry.
 *
 * Transitions out of the 32 (UI seeking) state, publishes
 * "endseeking", and conditionally samples a seek-latency CSI ping
 * at a 1% rate.
 *
 * [was: Ym]
 *
 * @param {Object} [seekOptions]  Optional seek-source metadata.
 */
export function endSeeking(self, seekOptions) { // was: Ym(Q)
  let seekSource = seekOptions?.seekSource; // was: Q (reused)

  if (self.playerState.W(32)) {
    self.OO(setAndClearStateBits(self.playerState, 16, 32, seekSource));
    self.publish("endseeking");
  } else if (!self.playerState.W(2)) {
    self.OO(addStateBits(self.playerState, 16, seekSource));
  }

  const seekTimer = self.KO.j; // was: Q (reused)
  const videoData = self.videoData; // was: c
  const isPaused = self.playerState.isPaused(); // was: W

  if (videoData.clientPlaybackNonce && !isNaN(seekTimer.W)) {
    if (Math.random() < 0.01) {
      const eventName = isPaused ? "pbp" : "pbs"; // was: W (reused)
      const params = { startTime: seekTimer.W }; // was: m

      if (videoData.UG) {
        params.cttAuthInfo = {
          token: videoData.UG,
          videoId: videoData.videoId,
        };
      }

      qp("seek", params);
      g.xh({ clientPlaybackNonce: videoData.clientPlaybackNonce }, "seek");

      if (!isNaN(seekTimer.O)) {
        Bu("pl_ss", seekTimer.O, "seek");
      }

      Bu(eventName, (0, g.h)(), "seek");
    }
    seekTimer.reset();
  }
}

// ---------------------------------------------------------------------------
// uY, zA — seek aliases  (lines 98979–98984)
// ---------------------------------------------------------------------------

/**
 * Alias for endSeeking (Ym).
 * [was: uY]
 */
export function endSeekingAlias(self, options) { // was: uY(Q)
  self.hasAdPlacements(options);
}

/**
 * Publishes a "SEEK_COMPLETE" event.
 * [was: zA]
 */
export function onSeekComplete(self) { // was: zA()
  self.publish("SEEK_COMPLETE");
}

// ---------------------------------------------------------------------------
// E2 — SABR context update propagation  (lines 98985–99014)
// ---------------------------------------------------------------------------

/**
 * Propagates a SABR (Streaming ABR) context update to the
 * appropriate video data instance and triggers abnormality
 * detection when applicable.
 *
 * For scope-4 updates (player-level), the update is stored in the
 * video data's `sabrContextUpdates` map and optionally added to the
 * default-send set.  When the `html5_enable_t1_enf_on_sabr`
 * experiment is active, it checks the player response for
 * abnormalities and calls `onAbnormalityDetected` on the event bus
 * if the response is absent.
 *
 * [was: E2]
 *
 * @param {Object} contextUpdate  A SABR context update with:
 *   - `scope` (number): 4 = player scope
 *   - `type` (number): context update type enum
 *   - `writePolicy` (number): 2 = skip-if-exists
 *   - `sendByDefault` (boolean): add to jG default-send set
 */
export function propagateSabrContextUpdate(self, contextUpdate) { // was: E2(Q)
  const orchestrator = self.sO; // was: c
  const currentCpn = self.videoData.clientPlaybackNonce; // was: W
  const playerType = self.playerType; // was: m

  if (contextUpdate.scope === 4) {
    const updateType = contextUpdate.type; // was: K

    if (updateType) {
      const primaryPlayer = orchestrator.timedInvoke(); // was: T
      let targetCpn = primaryPlayer.getVideoData().clientPlaybackNonce; // was: r

      if (playerType === 1) {
        targetCpn = currentCpn;
      }

      const targetPlayer = findPlayerByCpn(orchestrator, targetCpn); // was: m (reused)

      if (targetPlayer) {
        const targetVideoData = targetPlayer.getVideoData(); // was: W (reused)

        if (targetVideoData) {
          if (!(contextUpdate.writePolicy === 2 && targetVideoData.sabrContextUpdates.has(updateType))) {
            if (contextUpdate.sendByDefault) {
              targetVideoData.jG.add(updateType);
            }
            targetVideoData.sabrContextUpdates.set(updateType, contextUpdate);
          }

          if (orchestrator.X("html5_enable_t1_enf_on_sabr")) {
            const isType5 = updateType === 5; // was: Q (reused)
            const hasPlayerResponse = GUR(targetVideoData.playerResponse); // was: K (reused)

            let enforceStatus; // was: Q (reused)
            if (isType5) {
              enforceStatus = hasPlayerResponse ? 1 : 0;
              logBiscottiStats(enforceStatus, "m.p_", {});
              setConfig("MBSTAT", enforceStatus);
            } else {
              enforceStatus = 1;
            }

            if (enforceStatus === 0) {
              publishEvent(orchestrator.ge, "onAbnormalityDetected");
            }
          }
        }
      } else {
        primaryPlayer.RetryTimer("scuset", {
          ncpf: "1",
          ccpn: targetCpn,
          crcpn: currentCpn,
        });
      }
    } else {
      reportWarning(Error("b/380308491: contextUpdateType is undefined"));
    }
  }
}

// ---------------------------------------------------------------------------
// DI — get ad DI info  (lines 99015–99018)
// ---------------------------------------------------------------------------

/**
 * Returns ad-related DI info from the orchestrator if this is a
 * type-2 (ad) player.
 *
 * [was: DI]
 *
 * @returns {*|undefined}
 */
export function getAdDIInfo(self) { // was: DI()
  if (self.playerType === 2) {
    return self.sO.DI("");
  }
}

// ---------------------------------------------------------------------------
// o$ — surface a fatal/retryable error  (lines 98338–98361)
// ---------------------------------------------------------------------------

/**
 * Builds a structured error descriptor and transitions the player
 * into the error state (128).
 *
 * Resolves the error-message key from the MpW lookup table, appends
 * the current player architecture suffix (a6s / i1), and for auth
 * or DRM errors appends the reason and sub-reason strings.
 *
 * After constructing the error object, sets `videoData.errorCode`,
 * publishes "dataloaderror", and transitions the player state to 128
 * (error).  Finally cancels the progress timer, disposes the loader
 * (jV), and fully stops the player (NE).
 *
 * [was: o$]
 *
 * @param {string} errorCode           Error code string (e.g.
 *   "fmt.unplayable", "auth", "drm.auth").
 * @param {number} severity            Severity enum (1 = warning,
 *   2 = fatal).
 * @param {string} [errorKey]          Human-readable error key from
 *   MpW / g.Tw, or a raw message string.
 * @param {string} [debugInfo]         Debug details appended to fz.
 * @param {string} [errorDetail]       Error detail code.
 * @param {string} [subReason]         Sub-reason for auth/DRM errors
 *   (nK field).
 */
export function surfaceError(self, NetworkErrorCode, severity, errorKey, debugInfo, errorDetail, subReason) { // was: o$(Q, c, W, m, K, T)
  let resolvedKey; // was: r
  let rawMessage;  // was: U

  if (containsValue(PLAYER_ERROR_CODES, errorKey)) {
    resolvedKey = errorKey;
  } else if (errorKey) {
    rawMessage = errorKey;
  } else {
    resolvedKey = "GENERIC_WITHOUT_LINK";
  }

  let CloseRequestedTrigger = (debugInfo || "") + `;a6s.${i1()}`; // was: m (reused)

  if (NetworkErrorCode === "auth" || NetworkErrorCode === "drm.auth" || NetworkErrorCode === "heartbeat.stop") {
    if (errorKey) {
      CloseRequestedTrigger += `;r.${errorKey.replaceAll(" ", "_")}`;
    }
    if (subReason) {
      CloseRequestedTrigger += `sr.${subReason.replaceAll(" ", "_")}`;
    }
  }

  const errorDescriptor = { // was: c (reused)
    NetworkErrorCode,
    errorDetail,
    errorMessage: rawMessage || ERROR_MESSAGES[resolvedKey] || "",
    restoreAudioTrackPreference: resolvedKey,
    adBadgeViewModel: subReason || "",
    CloseRequestedTrigger,
    Ia: severity,
    cpn: self.videoData.clientPlaybackNonce,
  };

  self.videoData.NetworkErrorCode = NetworkErrorCode;
  Ob(self, "dataloaderror");
  self.OO(buildNextState(self.playerState, 128, errorDescriptor));
  globalScheduler.Q$(self.IV);
  jV(self);
  self.NE();
}
