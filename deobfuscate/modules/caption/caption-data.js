/**
 * Caption Data — Language name resolution, prototype extensions for caption
 * infrastructure classes, hex-color regex constants, and HLS label overrides.
 *
 * Source: player_es6.vflset/en_US/caption.js
 *   - Prototype extensions (g.W3 decorator pattern): lines 1565–1710
 *   - Hex color regex constants:                     lines 1711–1712 [was: jU4, b3o]
 *   - Language name map (complete):                  lines 1713–2305 [was: $S0]
 *   - HLS language label overrides:                  lines 2306–2308 [was: pw0]
 *   - Hex color validation regex (duplicate):        line 2495       [was: Or]
 *   - Text-align keyword array:                      line 2496       [was: KKm]
 *
 * Lines 2309–2331 (QPa), 2332–2343 (co9), 2344–2421 (WKv), 2422–2494 (m6v),
 * and 2497–2787 (cK) are covered by caption-track-list.js / caption-renderer.js.
 */

import { getConfig } from '../../core/composition-helpers.js';  // was: g.v
import { hasDatasyncId } from '../../core/attestation.js'; // was: tN
import { sendPostRequest } from '../../network/request.js'; // was: ms
import { FormatInfo } from '../../media/codec-tables.js'; // was: OU
import { readUint8 } from './caption-internals.js'; // was: af
import { yieldValue } from '../../ads/ad-async.js'; // was: am
import { filterAndSortFormats } from '../../data/bandwidth-tracker.js'; // was: as
import { buildSlotTelemetry } from '../../network/uri-utils.js'; // was: az
import { tryAsync } from '../../ads/ad-async.js'; // was: bi
import { isVideoCodec } from '../../media/codec-helpers.js'; // was: bo
import { LISTENER_MAP_KEY } from '../../data/event-logging.js'; // was: bs
import { createDeferredModules } from '../../player/caption-manager.js'; // was: cv
import { instreamSurveyAnswer } from '../../core/misc-helpers.js'; // was: da
import { logSegmentEntryTiming } from '../../ads/ad-cue-delivery.js'; // was: de
import { parseByteRange } from '../../media/format-parser.js'; // was: dv
import { createDatabaseDefinition } from '../../data/idb-transactions.js'; // was: el
import { OrchestrationAction } from '../offline/download-manager.js'; // was: es
import { ElementGeometryObserver } from '../../data/module-init.js'; // was: et
import { fetchWaaChallenge } from '../../core/event-registration.js'; // was: eu
import { SimpleError } from '../../proto/message-defs.js'; // was: fj
import { slotMatchesMetadata } from '../../network/uri-utils.js'; // was: fr
import { getColorAttr } from './caption-internals.js'; // was: fy
import { unwrapCommand } from '../../data/gel-params.js'; // was: gn
import { isPlaylistLike } from '../../player/video-loader.js'; // was: gu
import { sliceBuffer } from '../../data/collection-utils.js'; // was: hr
import { LayoutIdActiveAndSlotIdExitedTrigger } from '../../ads/ad-trigger-types.js'; // was: ii
import { IntFlag } from '../../data/session-storage.js'; // was: iu
import { notifyOperationFailure } from '../offline/download-manager.js'; // was: ka
import { clipTimeRanges } from '../../media/codec-helpers.js'; // was: ki
import { unloadModuleDependencies } from '../../player/caption-manager.js'; // was: km
import { exitFullscreen } from '../../ui/layout/fullscreen.js'; // was: kn
import { recordBufferHealth } from '../../media/engine-config.js'; // was: ko
import { createIndex } from '../../data/idb-transactions.js'; // was: ks
import { resetFocus } from '../../data/collection-utils.js'; // was: lg
import { extractPlainText } from '../../ads/ad-async.js'; // was: li
import { createTimeRanges } from '../../media/codec-helpers.js'; // was: lo
import { enumReader } from '../../proto/message-setup.js'; // was: lt
import { updateHostLocations } from '../../media/drm-signature.js'; // was: mad
import { serializeMessage } from '../../proto/message-setup.js'; // was: mg
import { ChromeFactory } from '../../features/shorts-player.js'; // was: mni
import { setAriaLabel } from '../../core/bitstream-helpers.js'; // was: mr
import { isDrcTrack } from '../../ads/ad-click-tracking.js'; // was: my
import { findBufferedSeekPoint } from '../../media/segment-request.js'; // was: nb
import { safeHtmlFrom } from '../../core/composition-helpers.js'; // was: ne
import { assertWordCharsOnly } from '../../core/attestation.js'; // was: ng
import { readBoolField } from '../../proto/varint-decoder.js'; // was: no
import { updateClipPath } from '../../ui/seek-bar-tail.js'; // was: nv
import { validateLayoutTriggers } from '../../ads/ad-scheduling.js'; // was: ro
import { initializeSuggestedActionVisibility } from '../../player/video-loader.js'; // was: ru
import { generateSlotId } from '../../ads/trigger-config.js'; // was: sa
import { updateGridState } from '../../player/video-loader.js'; // was: sd
import { logWarning } from '../../core/composition-helpers.js'; // was: si
import { enterRollUp } from './caption-internals.js'; // was: sr
import { updateClipRange } from '../../ui/seek-bar-tail.js'; // was: tg
import { isDeterministicIdGenerationEnabled } from '../../player/media-state.js'; // was: tl
import { instreamSurveySingleSelect } from '../../core/misc-helpers.js'; // was: tn
import { teardownEndscreen } from '../../player/playback-mode.js'; // was: tw
import { appendBuffer } from '../../data/collection-utils.js'; // was: ug
import { getHttpStatus } from '../../data/idb-transactions.js'; // was: uk
import { isSubstituteAdCpnMacroEnabled } from '../../player/media-state.js'; // was: vi
import { PlayerFacade } from '../../player/bootstrap.js'; // was: yi
import { getSubtleCrypto } from '../../proto/varint-decoder.js'; // was: zh
import { LiveStreamBreakScheduledDurationNotMatchedTrigger } from '../../ads/ad-trigger-types.js'; // was: zu
import { remove } from '../../core/array-utils.js';
import { appendChild } from '../../core/dom-utils.js';

// ══════════════════════════════════════════════════════════════════════
// Prototype extensions — caption-related methods injected via g.W3
// decorator onto player infrastructure classes.
//
// g.W3(priority, fn) wraps `fn` in a priority-ordered dispatch decorator
// so that multiple modules can extend the same prototype method.
//
// Source lines 1565–1710
// ══════════════════════════════════════════════════════════════════════

/**
 * Register a caption track notification with the QoE subsystem.
 * [was: g.oy.prototype.tN = g.W3(65, ...)] — Source lines 1565–1570
 *
 * @param {string} trackId   [was: Q]
 * @param {*} n7Value        [was: c] — notification value
 * @param {*} nfValue        [was: W] — notification flags
 */
export function qoeSetTrackNotification(qoe, trackId, n7Value, nfValue) { // was: g.oy.prototype.tN
  qoe.captionMap.set(trackId, { // was: this.O
    n7: n7Value,
    nf: nfValue,
  });
}

/**
 * Delegate tN to the inner service.
 * [was: g.rX.prototype.tN = g.W3(64, ...)] — Source lines 1571–1573
 */
export function serviceProxySetTrackNotification(proxy, trackId, n7Value, nfValue) { // was: g.rX.prototype.tN
  proxy.innerService.hasDatasyncId(trackId, n7Value, nfValue); // was: this.S.tN(Q, c, W)
}

/**
 * Base caption provider: hasNewData — always returns false.
 * [was: g.Ci.prototype.S = g.W3(63, ...)] — Source lines 1574–1576
 *
 * @returns {boolean}
 */
export function baseProviderHasNewData() { // was: g.Ci.prototype.S
  return false; // was: !1
}

/**
 * Base caption provider: fetchTrack — no-op.
 * [was: g.Ci.prototype.j = g.W3(62, ...)] — Source line 1577
 */
export function baseProviderFetchTrack() {} // was: g.Ci.prototype.j

/**
 * XHR-based caption provider: fetchTrack — fetches raw caption data via XHR
 * with QoE timing metrics.
 *
 * [was: g.M0.prototype.j = g.W3(61, ...)] — Source lines 1578–1610
 *
 * @param {Object} track      [was: Q] — caption track metadata
 * @param {*} formatArg       [was: c] — format parameter (reused for URL)
 * @param {Object} callbacks  [was: W] — { Zn: onTrackDataReceived }
 */
export function xhrProviderFetchTrack(provider, track, formatArg, callbacks) { // was: g.M0.prototype.j
  provider.cancelPending(); // was: this.u0()
  const url = provider.buildUrl(track, formatArg); // was: this.D(Q, c)
  const reportQoe = provider.playerApi.getConfig().isEnabled('html5_report_captions_ctmp_qoe'); // was: this.ge.G().X(...)
  const startTime = Date.now(); // was: (0, g.h)()
  provider.cancelFetch(); // was: this.A()
  provider.startXhr(url, { // was: EJo(this, c, {...})
    format: 'RAW',
    onSuccess: (response) => { // was: T
      provider.pendingXhr = null; // was: this.O = null
      if (reportQoe) {
        const sizeKb = (response.responseText.length / 1024).toFixed(); // was: r
        const endTime = Date.now(); // was: U = (0, g.h)()
        provider.videoData.reportTiming('capresp', { // was: this.videoData.tJ(...)
          sendPostRequest: endTime - startTime,
          kb: sizeKb,
        });
      }
      const contentLength = response.getResponseHeader?.('Content-Length')
        ? Number(response.getResponseHeader('Content-Length'))
        : 0; // was: r
      callbacks.onTrackDataReceived(response.responseText, track, undefined, undefined, contentLength); // was: W.Zn(...)
    },
    onError: reportQoe
      ? (error) => { // was: T
        provider.videoData.reportTiming('capfail', { // was: this.videoData.tJ(...)
          status: error?.status ?? 0,
        });
      }
      : undefined, // was: void 0
    withCredentials: true, // was: !0
  });
}

/**
 * Simple XHR caption provider: fetchTrack — fetches raw caption data.
 * [was: g.Jc.prototype.j = g.W3(60, ...)] — Source lines 1611–1625
 *
 * @param {Object} track      [was: Q]
 * @param {*} formatArg       [was: c]
 * @param {Object} callbacks  [was: W]
 */
export function simpleXhrProviderFetchTrack(provider, track, formatArg, callbacks) { // was: g.Jc.prototype.j
  provider.cancelPending(); // was: this.u0()
  const url = provider.buildUrl(track, formatArg); // was: this.D(Q, c)
  provider.cancelFetch(); // was: this.A()
  provider.pendingXhr = provider.makeXhr(url, { // was: this.O = g.Wn(c, {...})
    format: 'RAW',
    onSuccess: (response) => { // was: m
      provider.pendingXhr = null; // was: this.O = null
      const contentLength = response.getResponseHeader?.('Content-Length')
        ? Number(response.getResponseHeader('Content-Length'))
        : 0; // was: K
      callbacks.onTrackDataReceived(response.responseText, track, undefined, undefined, contentLength); // was: W.Zn(...)
    },
    withCredentials: true, // was: !0
  });
}

/**
 * Native media element: removeTrackElements — remove all <track> children.
 * [was: g.Yg.prototype.J = g.W3(59, ...)] — Source lines 1626–1630
 */
export function nativeMediaRemoveTrackElements(mediaEl) { // was: g.Yg.prototype.J
  const tracks = document.querySelectorAll('track'); // was: g.UZ(document, "track", void 0, this.W)
  for (let i = 0; i < tracks.length; i++) {
    tracks[i].remove(); // was: g.FQ(Q[c])
  }
}

/**
 * Wrapped media element: removeTrackElements — delegates to inner.
 * [was: g.cZ.prototype.J = g.W3(58, ...)] — Source lines 1631–1633
 */
export function wrappedMediaRemoveTrackElements(wrappedMedia) { // was: g.cZ.prototype.J
  wrappedMedia.mediaElement.removeTrackElements(); // was: this.mediaElement.J()
}

/**
 * Native media element: supportsTextTrackEvents — checks for textTracks.addEventListener.
 * [was: g.Yg.prototype.Ie = g.W3(57, ...)] — Source lines 1634–1636
 *
 * @returns {boolean}
 */
export function nativeMediaSupportsTextTrackEvents(mediaEl) { // was: g.Yg.prototype.Ie
  return !!(mediaEl.nativeElement.textTracks && mediaEl.nativeElement.textTracks.addEventListener); // was: this.W
}

/**
 * Wrapped media element: supportsTextTrackEvents — delegates.
 * [was: g.cZ.prototype.Ie = g.W3(56, ...)] — Source lines 1637–1639
 *
 * @returns {boolean}
 */
export function wrappedMediaSupportsTextTrackEvents(wrappedMedia) { // was: g.cZ.prototype.Ie
  return wrappedMedia.mediaElement.supportsTextTrackEvents(); // was: this.mediaElement.Ie()
}

/**
 * Native media element: hasTextTracks — checks for textTracks API.
 * [was: g.Yg.prototype.T2 = g.W3(55, ...)] — Source lines 1640–1642
 *
 * @returns {boolean}
 */
export function nativeMediaHasTextTracks(mediaEl) { // was: g.Yg.prototype.T2
  return !!mediaEl.nativeElement.textTracks; // was: this.W.textTracks
}

/**
 * Wrapped media element: hasTextTracks — delegates.
 * [was: g.cZ.prototype.T2 = g.W3(54, ...)] — Source lines 1643–1645
 *
 * @returns {boolean}
 */
export function wrappedMediaHasTextTracks(wrappedMedia) { // was: g.cZ.prototype.T2
  return wrappedMedia.mediaElement.hasTextTracks(); // was: this.mediaElement.T2()
}

/**
 * Native media element: appendTrackElements — append <track> elements.
 * [was: g.Yg.prototype.mF = g.W3(53, ...)] — Source lines 1646–1649
 *
 * @param {Array<HTMLElement>} trackElements [was: Q]
 */
export function nativeMediaAppendTrackElements(mediaEl, trackElements) { // was: g.Yg.prototype.mF
  for (let i = 0; i < trackElements.length; i++) {
    mediaEl.nativeElement.appendChild(trackElements[i]); // was: this.W.appendChild(Q[c])
  }
}

/**
 * Wrapped media element: appendTrackElements — delegates.
 * [was: g.cZ.prototype.mF = g.W3(52, ...)] — Source lines 1650–1652
 *
 * @param {Array<HTMLElement>} trackElements [was: Q]
 */
export function wrappedMediaAppendTrackElements(wrappedMedia, trackElements) { // was: g.cZ.prototype.mF
  wrappedMedia.mediaElement.appendTrackElements(trackElements); // was: this.mediaElement.mF(Q)
}

/**
 * App controller: hasCueRangeNamespace — checks via the uX dispatch.
 * [was: g.N0.prototype.h2 = g.W3(40, ...)] — Source lines 1653–1657
 *
 * @param {string} namespace [was: Q]
 * @returns {boolean}
 */
export function appControllerHasCueRangeNamespace(controller, namespace) { // was: g.N0.prototype.h2
  return controller.app.getPlayerByType({ playerType: undefined }).hasCueRangeNamespace(namespace); // was: this.app.uX({playerType: void 0}).h2(Q)
}

/**
 * Data-exchange proxy: hasCueRangeNamespace — delegates to inner.
 * [was: g.DX.prototype.h2 = g.W3(39, ...)] — Source lines 1658–1660
 *
 * @param {string} namespace [was: Q]
 * @returns {boolean}
 */
export function dataExchangeHasCueRangeNamespace(proxy, namespace) { // was: g.DX.prototype.h2
  return proxy.innerHandler.cueRangeManager.hasCueRangeNamespace(namespace); // was: this.EH.ag.h2(Q)
}

/**
 * Video lifecycle: hasCueRangeNamespace — checks active cue ranges.
 * [was: g.vL.prototype.h2 = g.W3(38, ...)] — Source lines 1661–1663
 *
 * @param {string} namespace [was: Q]
 * @returns {boolean}
 */
export function videoLifecycleHasCueRangeNamespace(lifecycle, namespace) { // was: g.vL.prototype.h2
  return lifecycle.getActiveCueRanges().some(cue => cue.namespace === namespace); // was: this.gj().some(c => c.namespace === Q)
}

/**
 * Base player: hasCueRangeNamespace — always returns false.
 * [was: g.WM.prototype.h2 = g.W3(37, ...)] — Source lines 1664–1666
 *
 * @returns {boolean}
 */
export function basePlayerHasCueRangeNamespace() { // was: g.WM.prototype.h2
  return false; // was: !1
}

/**
 * App controller: reportCaptionFormatInfo — delegates to oe().
 * [was: g.N0.prototype.SQ = g.W3(35, ...)] — Source lines 1667–1669
 *
 * @param {string} vssId [was: Q]
 * @param {string} mode  [was: c]
 */
export function appControllerReportCaptionFormatInfo(controller, vssId, mode) { // was: g.N0.prototype.SQ
  controller.app.getQoeService().reportCaptionFormatInfo(vssId, mode); // was: this.app.oe().SQ(Q, c)
}

/**
 * Data-exchange proxy: reportCaptionFormatInfo — delegates to inner.
 * [was: g.DX.prototype.SQ = g.W3(34, ...)] — Source lines 1670–1672
 *
 * @param {string} vssId [was: Q]
 * @param {string} mode  [was: c]
 */
export function dataExchangeReportCaptionFormatInfo(proxy, vssId, mode) { // was: g.DX.prototype.SQ
  proxy.innerHandler.reportCaptionFormatInfo(vssId, mode); // was: this.EH.SQ(Q, c)
}

/**
 * QoE instrumentation proxy: reportCaptionFormatInfo — logs "cfi" event.
 * [was: g.ji.prototype.SQ = g.W3(33, ...)] — Source lines 1673–1676
 *
 * @param {string} vssId [was: Q]
 * @param {string} mode  [was: c]
 */
export function qoeReportCaptionFormatInfo(qoe, vssId, mode) { // was: g.ji.prototype.SQ
  const payload = [vssId, mode]; // was: Q = [Q, c]
  qoe.logEvent(qoe.getProvider(), 'cfi', payload); // was: g.J8(this, g.Yo(this.provider), "cfi", Q)
}

/**
 * Playback quality tracker: reportCaptionFormatInfo — delegates to QoE if present.
 * [was: g.fi.prototype.SQ = g.W3(32, ...)] — Source lines 1677–1679
 *
 * @param {string} vssId [was: Q]
 * @param {string} mode  [was: c]
 */
export function playbackQualityReportCaptionFormatInfo(tracker, vssId, mode) { // was: g.fi.prototype.SQ
  if (tracker.qoe) tracker.qoe.reportCaptionFormatInfo(vssId, mode); // was: this.qoe && this.qoe.SQ(Q, c)
}

/**
 * Format factory: reportCaptionFormatInfo — delegates to inner Vp.
 * [was: g.Ff.prototype.SQ = g.W3(31, ...)] — Source lines 1680–1682
 *
 * @param {string} vssId [was: Q]
 * @param {string} mode  [was: c]
 */
export function formatFactoryReportCaptionFormatInfo(factory, vssId, mode) { // was: g.Ff.prototype.SQ
  factory.innerProxy.reportCaptionFormatInfo(vssId, mode); // was: this.Vp.SQ(Q, c)
}

/**
 * Base player: reportCaptionFormatInfo — no-op.
 * [was: g.WM.prototype.SQ = g.W3(30, ...)] — Source line 1683
 */
export function basePlayerReportCaptionFormatInfo() {} // was: g.WM.prototype.SQ

/**
 * App controller: reportCaptionFormatSwitch — delegates to oe().
 * [was: g.N0.prototype.q6 = g.W3(29, ...)] — Source lines 1684–1686
 *
 * @param {*} track  [was: Q]
 * @param {string} languageCode [was: c]
 * @param {string} source [was: W]
 */
export function appControllerReportCaptionFormatSwitch(controller, track, languageCode, source) { // was: g.N0.prototype.q6
  controller.app.getQoeService().reportCaptionFormatSwitch(track, languageCode, source); // was: this.app.oe().q6(Q, c, W)
}

/**
 * Data-exchange proxy: reportCaptionFormatSwitch — delegates to inner.
 * [was: g.DX.prototype.q6 = g.W3(28, ...)] — Source lines 1687–1689
 *
 * @param {*} track  [was: Q]
 * @param {string} languageCode [was: c]
 * @param {string} source [was: W]
 */
export function dataExchangeReportCaptionFormatSwitch(proxy, track, languageCode, source) { // was: g.DX.prototype.q6
  proxy.innerHandler.reportCaptionFormatSwitch(track, languageCode, source); // was: this.EH.q6(Q, c, W)
}

/**
 * QoE instrumentation proxy: reportCaptionFormatSwitch — logs "cfs" event.
 * Tracks the previous track/language and only logs on change.
 *
 * [was: g.ji.prototype.q6 = g.W3(27, ...)] — Source lines 1690–1697
 *
 * @param {*} track         [was: Q]
 * @param {string} languageCode [was: c]
 * @param {string} source   [was: W]
 */
export function qoeReportCaptionFormatSwitch(qoe, track, languageCode, source) { // was: g.ji.prototype.q6
  if (qoe.previousTrack !== track || qoe.previousLanguage !== languageCode) { // was: this.Ka !== Q || this.WB !== c
    const normalizedLang = languageCode === 'rawcc' ? '' : languageCode; // was: c = c === "rawcc" ? "" : c
    const payload = [track, normalizedLang, qoe.previousTrack, source]; // was: W = [Q, c, this.Ka, W]
    qoe.logEvent(qoe.getProvider(), 'cfs', payload); // was: g.J8(this, g.Yo(this.provider), "cfs", W)
    qoe.previousTrack = track; // was: this.Ka = Q
    qoe.previousLanguage = normalizedLang; // was: this.WB = c
  }
}

/**
 * Playback quality tracker: reportCaptionFormatSwitch — delegates to QoE.
 * [was: g.fi.prototype.q6 = g.W3(26, ...)] — Source lines 1698–1700
 *
 * @param {*} track         [was: Q]
 * @param {string} languageCode [was: c]
 * @param {string} source   [was: W]
 */
export function playbackQualityReportCaptionFormatSwitch(tracker, track, languageCode, source) { // was: g.fi.prototype.q6
  if (tracker.qoe) tracker.qoe.reportCaptionFormatSwitch(track, languageCode, source); // was: this.qoe && this.qoe.q6(Q, c, W)
}

/**
 * Format factory: reportCaptionFormatSwitch — delegates to inner Vp.
 * [was: g.Ff.prototype.q6 = g.W3(25, ...)] — Source lines 1701–1703
 *
 * @param {*} track         [was: Q]
 * @param {string} languageCode [was: c]
 * @param {string} source   [was: W]
 */
export function formatFactoryReportCaptionFormatSwitch(factory, track, languageCode, source) { // was: g.Ff.prototype.q6
  factory.innerProxy.reportCaptionFormatSwitch(track, languageCode, source); // was: this.Vp.q6(Q, c, W)
}

/**
 * Base player: reportCaptionFormatSwitch — no-op.
 * [was: g.WM.prototype.q6 = g.W3(24, ...)] — Source line 1704
 */
export function basePlayerReportCaptionFormatSwitch() {} // was: g.WM.prototype.q6

/**
 * Segment index: getSegmentDuration — returns the duration of a segment.
 * [was: g.X4.prototype.NN = g.W3(3, ...)] — Source lines 1705–1707
 *
 * @param {number} segmentIndex [was: Q]
 * @returns {number} — duration in seconds, or 0 if not found
 */
export function segmentIndexGetDuration(index, segmentIndex) { // was: g.X4.prototype.NN
  const segment = index.getSegment(segmentIndex); // was: Q = this.A(Q)
  return segment ? segment.duration : 0; // was: Q ? Q.W : 0
}

/**
 * Empty index: getSegmentDuration — always returns 0.
 * [was: g.ei.prototype.NN = g.W3(2, ...)] — Source lines 1708–1710
 *
 * @returns {number}
 */
export function emptyIndexGetDuration() { // was: g.ei.prototype.NN
  return 0;
}

// ══════════════════════════════════════════════════════════════════════
// Hex color regex constants
// [was: jU4, b3o] — Source lines 1711–1712
// ══════════════════════════════════════════════════════════════════════

/**
 * Regex to expand a 3-char hex shorthand (#abc) into capture groups.
 * [was: jU4] — Source line 1711
 */
export const SHORT_HEX_EXPAND_REGEX = /#(.)(.)(.)/; // was: jU4

/**
 * Regex to validate a 3- or 6-digit hex color string.
 * [was: b3o] — Source line 1712
 */
export const VALID_HEX_REGEX = /^#(?:[0-9a-f]{3}){1,2}$/i; // was: b3o

// ══════════════════════════════════════════════════════════════════════
// LANGUAGE_CODE_TO_NAME — Complete ISO 639 language code to English
// display name mapping. Used to resolve human-readable names when
// the server does not provide a languageName.
//
// [was: $S0] — Source lines 1713–2305 (~590 entries)
// ══════════════════════════════════════════════════════════════════════

/** @type {Record<string, string>} */
export const LANGUAGE_CODE_TO_NAME = { // was: $S0
  aa: 'Afar',
  ab: 'Abkhazian',
  ace: 'Acehnese',
  ach: 'Acoli',
  ada: 'Adangme',
  ady: 'Adyghe',
  ae: 'Avestan',
  aeb: 'Tunisian Arabic',
  af: 'Afrikaans',
  afh: 'Afrihili',
  agq: 'Aghem',
  ain: 'Ainu',
  ak: 'Akan',
  akk: 'Akkadian',
  akz: 'Alabama',
  ale: 'Aleut',
  aln: 'Gheg Albanian',
  alt: 'Southern Altai',
  am: 'Amharic',
  an: 'Aragonese',
  ang: 'Old English',
  anp: 'Angika',
  ar: 'Arabic',
  ar_001: 'Arabic (world)',
  arc: 'Aramaic',
  arn: 'Mapuche',
  aro: 'Araona',
  arp: 'Arapaho',
  arq: 'Algerian Arabic',
  ars: 'Najdi Arabic',
  arw: 'Arawak',
  ary: 'Moroccan Arabic',
  arz: 'Egyptian Arabic',
  as: 'Assamese',
  asa: 'Asu',
  ase: 'American Sign Language',
  ast: 'Asturian',
  av: 'Avaric',
  avk: 'Kotava',
  awa: 'Awadhi',
  ay: 'Aymara',
  az: 'Azerbaijani',
  az_Cyrl: 'Azerbaijani (Cyrillic)',
  az_Latn: 'Azerbaijani (Latin)',
  ba: 'Bashkir',
  bal: 'Baluchi',
  ban: 'Balinese',
  bar: 'Bavarian',
  bas: 'Basaa',
  bax: 'Bamun',
  bbc: 'Batak Toba',
  bbj: 'Ghomala',
  be: 'Belarusian',
  bej: 'Beja',
  bem: 'Bemba',
  bew: 'Betawi',
  bez: 'Bena',
  bfd: 'Bafut',
  bfq: 'Badaga',
  bg: 'Bulgarian',
  bgc: 'Haryanvi',
  bgn: 'Western Balochi',
  bho: 'Bhojpuri',
  bi: 'Bislama',
  bik: 'Bikol',
  bin: 'Bini',
  bjn: 'Banjar',
  bkm: 'Kom',
  bla: 'Siksik\u00e1',
  blo: 'Anii',
  bm: 'Bambara',
  bn: 'Bangla',
  bo: 'Tibetan',
  bpy: 'Bishnupriya',
  bqi: 'Bakhtiari',
  br: 'Breton',
  bra: 'Braj',
  brh: 'Brahui',
  brx: 'Bodo',
  bs: 'Bosnian',
  bs_Cyrl: 'Bosnian (Cyrillic)',
  bs_Latn: 'Bosnian (Latin)',
  bss: 'Akoose',
  bua: 'Buriat',
  bug: 'Buginese',
  bum: 'Bulu',
  byn: 'Blin',
  byv: 'Medumba',
  ca: 'Catalan',
  cad: 'Caddo',
  car: 'Carib',
  cay: 'Cayuga',
  cch: 'Atsam',
  ccp: 'Chakma',
  ce: 'Chechen',
  ceb: 'Cebuano',
  cgg: 'Chiga',
  ch: 'Chamorro',
  chb: 'Chibcha',
  chg: 'Chagatai',
  chk: 'Chuukese',
  chm: 'Mari',
  chn: 'Chinook Jargon',
  cho: 'Choctaw',
  chp: 'Chipewyan',
  chr: 'Cherokee',
  chy: 'Cheyenne',
  ckb: 'Central Kurdish',
  co: 'Corsican',
  cop: 'Coptic',
  cps: 'Capiznon',
  cr: 'Cree',
  crh: 'Crimean Tatar',
  cs: 'Czech',
  csb: 'Kashubian',
  csw: 'Swampy Cree',
  cu: 'Church Slavic',
  cv: 'Chuvash',
  cy: 'Welsh',
  da: 'Danish',
  dak: 'Dakota',
  dar: 'Dargwa',
  dav: 'Taita',
  de: 'German',
  de_AT: 'German (Austria)',
  de_CH: 'German (Switzerland)',
  del: 'Delaware',
  den: 'Slave',
  dgr: 'Dogrib',
  din: 'Dinka',
  dje: 'Zarma',
  doi: 'Dogri',
  dsb: 'Lower Sorbian',
  dua: 'Duala',
  dum: 'Middle Dutch',
  dv: 'Divehi',
  dyo: 'Jola-Fonyi',
  dyu: 'Dyula',
  dz: 'Dzongkha',
  dzg: 'Dazaga',
  ebu: 'Embu',
  ee: 'Ewe',
  efi: 'Efik',
  egy: 'Ancient Egyptian',
  eka: 'Ekajuk',
  el: 'Greek',
  elx: 'Elamite',
  en: 'English',
  en_AU: 'English (Australia)',
  en_CA: 'English (Canada)',
  en_GB: 'English (United Kingdom)',
  en_US: 'English (United States)',
  enm: 'Middle English',
  eo: 'Esperanto',
  es: 'Spanish',
  es_419: 'Spanish (Latin America)',
  es_ES: 'Spanish (Spain)',
  es_MX: 'Spanish (Mexico)',
  et: 'Estonian',
  eu: 'Basque',
  ewo: 'Ewondo',
  fa: 'Persian',
  fa_AF: 'Persian (Afghanistan)',
  fan: 'Fang',
  fat: 'Fanti',
  ff: 'Fula',
  ff_Adlm: 'Fula (Adlam)',
  ff_Latn: 'Fula (Latin)',
  fi: 'Finnish',
  fil: 'Filipino',
  fj: 'Fijian',
  fo: 'Faroese',
  fon: 'Fon',
  fr: 'French',
  fr_CA: 'French (Canada)',
  fr_CH: 'French (Switzerland)',
  frm: 'Middle French',
  fro: 'Old French',
  frr: 'Northern Frisian',
  frs: 'Eastern Frisian',
  fur: 'Friulian',
  fy: 'Western Frisian',
  ga: 'Irish',
  gaa: 'Ga',
  gay: 'Gayo',
  gba: 'Gbaya',
  gd: 'Scottish Gaelic',
  gez: 'Geez',
  gil: 'Gilbertese',
  gl: 'Galician',
  gmh: 'Middle High German',
  gn: 'Guarani',
  goh: 'Old High German',
  gon: 'Gondi',
  gor: 'Gorontalo',
  got: 'Gothic',
  grb: 'Grebo',
  grc: 'Ancient Greek',
  gsw: 'Swiss German',
  gu: 'Gujarati',
  guz: 'Gusii',
  gv: 'Manx',
  gwi: 'Gwich\u02bcin',
  ha: 'Hausa',
  hai: 'Haida',
  haw: 'Hawaiian',
  he: 'Hebrew',
  hi: 'Hindi',
  hi_Latn: 'Hindi (Latin)',
  hil: 'Hiligaynon',
  hit: 'Hittite',
  hmn: 'Hmong',
  ho: 'Hiri Motu',
  hr: 'Croatian',
  hsb: 'Upper Sorbian',
  ht: 'Haitian Creole',
  hu: 'Hungarian',
  hup: 'Hupa',
  hy: 'Armenian',
  hz: 'Herero',
  ia: 'Interlingua',
  iba: 'Iban',
  ibb: 'Ibibio',
  id: 'Indonesian',
  ie: 'Interlingue',
  ig: 'Igbo',
  ii: 'Sichuan Yi',
  ik: 'Inupiaq',
  ilo: 'Iloko',
  'in': 'Indonesian',
  inh: 'Ingush',
  io: 'Ido',
  is: 'Icelandic',
  it: 'Italian',
  iu: 'Inuktitut',
  iw: 'Hebrew',
  ja: 'Japanese',
  jbo: 'Lojban',
  jgo: 'Ngomba',
  jmc: 'Machame',
  jpr: 'Judeo-Persian',
  jrb: 'Judeo-Arabic',
  jv: 'Javanese',
  ka: 'Georgian',
  kaa: 'Kara-Kalpak',
  kab: 'Kabyle',
  kac: 'Kachin',
  kaj: 'Jju',
  kam: 'Kamba',
  kaw: 'Kawi',
  kbd: 'Kabardian',
  kbl: 'Kanembu',
  kcg: 'Tyap',
  kde: 'Makonde',
  kea: 'Kabuverdianu',
  kfo: 'Koro',
  kg: 'Kongo',
  kgp: 'Kaingang',
  kha: 'Khasi',
  kho: 'Khotanese',
  khq: 'Koyra Chiini',
  ki: 'Kikuyu',
  kj: 'Kuanyama',
  kk: 'Kazakh',
  kk_Arab: 'Kazakh (Arabic)',
  kk_Cyrl: 'Kazakh (Cyrillic)',
  kkj: 'Kako',
  kl: 'Kalaallisut',
  kln: 'Kalenjin',
  km: 'Khmer',
  kmb: 'Kimbundu',
  kn: 'Kannada',
  ko: 'Korean',
  kok: 'Konkani',
  kok_Deva: 'Konkani (Devanagari)',
  kok_Latn: 'Konkani (Latin)',
  kos: 'Kosraean',
  kpe: 'Kpelle',
  kr: 'Kanuri',
  krc: 'Karachay-Balkar',
  krl: 'Karelian',
  kru: 'Kurukh',
  ks: 'Kashmiri',
  ks_Arab: 'Kashmiri (Arabic)',
  ks_Deva: 'Kashmiri (Devanagari)',
  ksb: 'Shambala',
  ksf: 'Bafia',
  ksh: 'Colognian',
  ku: 'Kurdish',
  ku_Latn: 'Kurdish (Latin)',
  kum: 'Kumyk',
  kut: 'Kutenai',
  kv: 'Komi',
  kw: 'Cornish',
  kxv: 'Kuvi',
  kxv_Deva: 'Kuvi (Devanagari)',
  kxv_Latn: 'Kuvi (Latin)',
  kxv_Orya: 'Kuvi (Odia)',
  kxv_Telu: 'Kuvi (Telugu)',
  ky: 'Kyrgyz',
  la: 'Latin',
  lad: 'Ladino',
  lag: 'Langi',
  lah: 'Western Panjabi',
  lam: 'Lamba',
  lb: 'Luxembourgish',
  lez: 'Lezghian',
  lg: 'Ganda',
  li: 'Limburgish',
  lij: 'Ligurian',
  lkt: 'Lakota',
  lmo: 'Lombard',
  ln: 'Lingala',
  lo: 'Lao',
  lol: 'Mongo',
  loz: 'Lozi',
  lrc: 'Northern Luri',
  lt: 'Lithuanian',
  lu: 'Luba-Katanga',
  lua: 'Luba-Lulua',
  lui: 'Luiseno',
  lun: 'Lunda',
  luo: 'Luo',
  lus: 'Mizo',
  luy: 'Luyia',
  lv: 'Latvian',
  mad: 'Madurese',
  maf: 'Mafa',
  mag: 'Magahi',
  mai: 'Maithili',
  mak: 'Makasar',
  man: 'Mandingo',
  mas: 'Masai',
  mde: 'Maba',
  mdf: 'Moksha',
  mdr: 'Mandar',
  men: 'Mende',
  mer: 'Meru',
  mfe: 'Morisyen',
  mg: 'Malagasy',
  mga: 'Middle Irish',
  mgh: 'Makhuwa-Meetto',
  mgo: 'Meta\u02bc',
  mh: 'Marshallese',
  mi: 'M\u0101ori',
  mic: "Mi'kmaw",
  min: 'Minangkabau',
  mk: 'Macedonian',
  ml: 'Malayalam',
  mn: 'Mongolian',
  mnc: 'Manchu',
  mni: 'Manipuri',
  mni_Beng: 'Manipuri (Bangla)',
  mo: 'Romanian',
  moh: 'Mohawk',
  mos: 'Mossi',
  mr: 'Marathi',
  ms: 'Malay',
  mt: 'Maltese',
  mua: 'Mundang',
  mul: 'Multiple languages',
  mus: 'Muscogee',
  mwl: 'Mirandese',
  mwr: 'Marwari',
  my: 'Burmese',
  mye: 'Myene',
  myv: 'Erzya',
  mzn: 'Mazanderani',
  na: 'Nauru',
  nap: 'Neapolitan',
  naq: 'Nama',
  nb: 'Norwegian Bokm\u00e5l',
  nd: 'North Ndebele',
  nds: 'Low German',
  nds_NL: 'Low German (Netherlands)',
  ne: 'Nepali',
  'new': 'Newari',
  ng: 'Ndonga',
  nia: 'Nias',
  niu: 'Niuean',
  nl: 'Dutch',
  nl_BE: 'Dutch (Belgium)',
  nmg: 'Kwasio',
  nn: 'Norwegian Nynorsk',
  nnh: 'Ngiemboon',
  no: 'Norwegian',
  nog: 'Nogai',
  non: 'Old Norse',
  nqo: 'N\u2019Ko',
  nr: 'South Ndebele',
  nso: 'Northern Sotho',
  nus: 'Nuer',
  nv: 'Navajo',
  nwc: 'Classical Newari',
  ny: 'Nyanja',
  nym: 'Nyamwezi',
  nyn: 'Nyankole',
  nyo: 'Nyoro',
  nzi: 'Nzima',
  oc: 'Occitan',
  oj: 'Ojibwa',
  om: 'Oromo',
  or: 'Odia',
  os: 'Ossetic',
  osa: 'Osage',
  ota: 'Ottoman Turkish',
  pa: 'Punjabi',
  pa_Arab: 'Punjabi (Arabic)',
  pa_Guru: 'Punjabi (Gurmukhi)',
  pag: 'Pangasinan',
  pal: 'Pahlavi',
  pam: 'Pampanga',
  pap: 'Papiamento',
  pau: 'Palauan',
  pcm: 'Nigerian Pidgin',
  peo: 'Old Persian',
  phn: 'Phoenician',
  pi: 'Pali',
  pl: 'Polish',
  pms: 'Piedmontese',
  pon: 'Pohnpeian',
  prg: 'Prussian',
  pro: 'Old Proven\u00e7al',
  ps: 'Pashto',
  pt: 'Portuguese',
  pt_BR: 'Portuguese (Brazil)',
  pt_PT: 'Portuguese (Portugal)',
  qu: 'Quechua',
  raj: 'Rajasthani',
  rap: 'Rapanui',
  rar: 'Rarotongan',
  rm: 'Romansh',
  rn: 'Rundi',
  ro: 'Romanian',
  ro_MD: 'Romanian (Moldova)',
  rof: 'Rombo',
  rom: 'Romany',
  ru: 'Russian',
  rup: 'Aromanian',
  rw: 'Kinyarwanda',
  rwk: 'Rwa',
  sa: 'Sanskrit',
  sad: 'Sandawe',
  sah: 'Yakut',
  sam: 'Samaritan Aramaic',
  saq: 'Samburu',
  sas: 'Sasak',
  sat: 'Santali',
  sat_Olck: 'Santali (Ol Chiki)',
  sba: 'Ngambay',
  sbp: 'Sangu',
  sc: 'Sardinian',
  scn: 'Sicilian',
  sco: 'Scots',
  sd: 'Sindhi',
  sd_Arab: 'Sindhi (Arabic)',
  sd_Deva: 'Sindhi (Devanagari)',
  se: 'Northern Sami',
  see: 'Seneca',
  seh: 'Sena',
  sel: 'Selkup',
  ses: 'Koyraboro Senni',
  sg: 'Sango',
  sga: 'Old Irish',
  sh: 'Serbo-Croatian',
  shi: 'Tachelhit',
  shi_Latn: 'Tachelhit (Latin)',
  shi_Tfng: 'Tachelhit (Tifinagh)',
  shn: 'Shan',
  shu: 'Chadian Arabic',
  si: 'Sinhala',
  sid: 'Sidamo',
  sk: 'Slovak',
  sl: 'Slovenian',
  sm: 'Samoan',
  sma: 'Southern Sami',
  smj: 'Lule Sami',
  smn: 'Inari Sami',
  sms: 'Skolt Sami',
  sn: 'Shona',
  snk: 'Soninke',
  so: 'Somali',
  sog: 'Sogdien',
  sq: 'Albanian',
  sr: 'Serbian',
  sr_Cyrl: 'Serbian (Cyrillic)',
  sr_Latn: 'Serbian (Latin)',
  srn: 'Sranan Tongo',
  srr: 'Serer',
  ss: 'Swati',
  ssy: 'Saho',
  st: 'Southern Sotho',
  su: 'Sundanese',
  su_Latn: 'Sundanese (Latin)',
  suk: 'Sukuma',
  sus: 'Susu',
  sux: 'Sumerian',
  sv: 'Swedish',
  sw: 'Swahili',
  sw_CD: 'Swahili (Congo - Kinshasa)',
  swb: 'Comorian',
  syc: 'Classical Syriac',
  syr: 'Syriac',
  szl: 'Silesian',
  ta: 'Tamil',
  te: 'Telugu',
  tem: 'Timne',
  teo: 'Teso',
  ter: 'Tereno',
  tet: 'Tetum',
  tg: 'Tajik',
  th: 'Thai',
  ti: 'Tigrinya',
  tig: 'Tigre',
  tiv: 'Tiv',
  tk: 'Turkmen',
  tkl: 'Tokelauan',
  tl: 'Tagalog',
  tlh: 'Klingon',
  tli: 'Tlingit',
  tmh: 'Tamashek',
  tn: 'Tswana',
  to: 'Tongan',
  tog: 'Nyasa Tonga',
  tok: 'Toki Pona',
  tpi: 'Tok Pisin',
  tr: 'Turkish',
  trv: 'Taroko',
  ts: 'Tsonga',
  tsi: 'Tsimshian',
  tt: 'Tatar',
  tum: 'Tumbuka',
  tvl: 'Tuvalu',
  tw: 'Twi',
  twq: 'Tasawaq',
  ty: 'Tahitian',
  tyv: 'Tuvinian',
  tzm: 'Central Atlas Tamazight',
  udm: 'Udmurt',
  ug: 'Uyghur',
  uga: 'Ugaritic',
  uk: 'Ukrainian',
  umb: 'Umbundu',
  ur: 'Urdu',
  uz: 'Uzbek',
  uz_Arab: 'Uzbek (Arabic)',
  uz_Cyrl: 'Uzbek (Cyrillic)',
  uz_Latn: 'Uzbek (Latin)',
  vai: 'Vai',
  vai_Latn: 'Vai (Latin)',
  vai_Vaii: 'Vai (Vai)',
  ve: 'Venda',
  vec: 'Venetian',
  vi: 'Vietnamese',
  vmw: 'Makhuwa',
  vo: 'Volap\u00fck',
  vot: 'Votic',
  vun: 'Vunjo',
  wa: 'Walloon',
  wae: 'Walser',
  wal: 'Wolaytta',
  war: 'Waray',
  was: 'Washo',
  wo: 'Wolof',
  xal: 'Kalmyk',
  xh: 'Xhosa',
  xnr: 'Kangri',
  xog: 'Soga',
  yao: 'Yao',
  yap: 'Yapese',
  yav: 'Yangben',
  ybb: 'Yemba',
  yi: 'Yiddish',
  yo: 'Yoruba',
  yrl: 'Nheengatu',
  yue: 'Cantonese',
  yue_Hans: 'Cantonese (Simplified)',
  yue_Hant: 'Cantonese (Traditional)',
  za: 'Zhuang',
  zap: 'Zapotec',
  zbl: 'Blissymbols',
  zen: 'Zenaga',
  zgh: 'Standard Moroccan Tamazight',
  zh: 'Chinese',
  zh_Hans: 'Chinese (Simplified)',
  zh_Hant: 'Chinese (Traditional)',
  zh_TW: 'Chinese (Taiwan)',
  zu: 'Zulu',
  zun: 'Zuni',
  zxx: 'No linguistic content',
  zza: 'Zaza',
};

// ══════════════════════════════════════════════════════════════════════
// HLS_LANGUAGE_LABELS — Override display labels for HLS native text tracks.
// [was: pw0] — Source lines 2306–2308
// ══════════════════════════════════════════════════════════════════════

/** @type {Record<string, string>} */
export const HLS_LANGUAGE_LABELS = { // was: pw0
  en: 'English',
};

// ══════════════════════════════════════════════════════════════════════
// Lines 2309–2494 covered by caption-track-list.js:
//   - QPa (HlsCaptionProvider):      lines 2309–2331
//   - co9 (TrackSegmentSet):         lines 2332–2343
//   - WKv (LiveCaptionFetcher):      lines 2344–2421
//   - m6v (ManifestCaptionProvider): lines 2422–2494
// ══════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════
// HEX_COLOR_VALIDATION_REGEX — Duplicate hex color validation regex
// used by caption renderer for inline color validation.
// [was: Or] — Source line 2495
// ══════════════════════════════════════════════════════════════════════

/**
 * Validates a 3- or 6-digit hex color string (case-insensitive).
 * Identical to VALID_HEX_REGEX (b3o) at line 1712 but declared separately
 * in the source as a module-scoped `var`.
 *
 * [was: Or] — Source line 2495
 */
export const HEX_COLOR_VALIDATION_REGEX = /^#(?:[0-9a-f]{3}){1,2}$/i; // was: Or

// ══════════════════════════════════════════════════════════════════════
// TEXT_ALIGN_KEYWORDS — CSS text-align keyword array indexed by the
// numeric textAlign property of caption window params.
// [was: KKm] — Source line 2496
// ══════════════════════════════════════════════════════════════════════

/**
 * Maps numeric text-align indices to CSS keyword strings.
 *   0 = 'left', 1 = 'right', 2 = 'center', 3 = 'justify'
 *
 * [was: KKm] — Source line 2496
 * @type {string[]}
 */
export const TEXT_ALIGN_KEYWORDS = ['left', 'right', 'center', 'justify']; // was: KKm

// ══════════════════════════════════════════════════════════════════════
// Lines 2497–2787 covered by caption-renderer.js:
//   - cK (CaptionWindow): lines 2497–2787
// ══════════════════════════════════════════════════════════════════════
