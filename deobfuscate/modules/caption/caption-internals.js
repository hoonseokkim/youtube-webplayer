/**
 * Caption Internals — CEA-608 closed caption decoding, timed-text XML parsing,
 * ruby/emphasis text building, binary SMPTE-TT detection, SABR caption data
 * management, format parsing helpers, track state queries, native track mode
 * helpers, renderer management, and prototype method patches.
 *
 * Source: player_es6.vflset/en_US/caption.js, lines 404–1710
 *
 * Functions covered (in source order):
 *   k01              → classifyControlPair        (line 404)
 *   pWo              → processCea608Pair          (line 436)
 *   Q6a              → drainCea608Queue           (line 442)
 *   TDS              → lookupCharCode             (line 453)
 *   yX               → extractWindowText          (line 466)
 *   SO               → currentCell                (line 521)
 *   F8               → writeCharacter             (line 524)
 *   oH9              → copyRows                   (line 532)
 *   ZG               → clearRows                  (line 541)
 *   Er               → resetBufferPosition        (line 546)
 *   rsv              → enterResumeCaption         (line 551)
 *   sr               → enterRollUp                (line 558)
 *   Uya              → enterPaintOn               (line 580)
 *   Yg1              → dispatchCea608Byte         (line 586)
 *   Xw4              → buildRubySegment           (line 775)
 *   IcH              → createRubyElement          (line 812)
 *   b9               → getNumericAttr             (line 870)
 *   jO               → getBooleanAttr             (line 875)
 *   gE               → getNumericAttrOrNull       (line 880)
 *   fy               → getColorAttr               (line 884)
 *   eBm              → parseWindowStyle           (line 890)
 *   Vy4              → parseWindowPosition        (line 908)
 *   BD1              → buildWindowCueFromXml      (line 924)
 *   xy0              → buildWindowCueFromProto    (line 942)
 *   af               → readUint8                  (line 957)
 *   Gl               → readUint32                 (line 962)
 *   DyH              → isSmpteData               (line 967)
 *   nHD              → parseSmpteHeader           (line 973)
 *   tyW              → buildScrollTransform       (line 984)
 *   HUH              → measureVisualLines         (line 990)
 *   NDa              → measureAndScrollWindow     (line 1010)
 *   ysD              → onSabrCaptionSegment       (line 1024)
 *   ZUZ              → subscribeSabrCaptionEvents (line 1046)
 *   iUm              → findBufferedRangeIndex     (line 1070)
 *   SVS              → fixSegmentStartTime        (line 1076)
 *   F4a              → fixSegmentDuration         (line 1087)
 *   EHi              → isSabrLiveCaptions         (line 1098)
 *   s6W              → findTrackByLanguage        (line 1105)
 *   dy9              → listAvailableTracks        (line 1118)
 *   wwa              → isWebVttHeader             (line 1151)
 *   $X               → parseColonTimestamp        (line 1161)
 *   j6D              → parseFormattedTextNodes    (line 1174)
 *   OUi              → splitTrackDataByFormat     (line 1198)
 *   vHa              → parseWebVttFallback        (line 1234)
 *   gHm              → extractMoofTimestamps      (line 1240)
 *   ac0              → detectLanguageParams       (line 1253)
 *   u9               → showSampleSubtitles        (line 1333)
 *   uvo              → setNativeTrackMode         (line 1392)
 *   Cy               → isForcedTrackActive        (line 1405)
 *   hBa              → shouldIncludeAsrTracks     (line 1409)
 *   py               → updateVssLogging           (line 1485)
 *   CF9              → ensureRendererForWindow    (line 1488)
 *   MyD              → addCueToWindow             (line 1495)
 *   zBm              → createWindowRenderer       (line 1500)
 *   Js1              → getVideoContentSize        (line 1519)
 *   YVa              → handleTrackOption          (line 1537)
 *
 *   Prototype patches (lines 1565–1710):
 *     g.oy.tN, g.rX.tN, g.Ci.S, g.Ci.j, g.M0.j, g.Jc.j,
 *     g.YcreateRouterWrapper, g.cZ.J, g.YisUnpluggedPlatform, g.cZ.Ie, g.Yg.T2, g.cZ.T2,
 *     g.Yg.mF, g.cZ.mF, g.N0.h2, g.DX.h2, g.vL.h2, g.WM.h2,
 *     g.N0.SQ, g.DX.SQ, g.ji.SQ, g.fi.SQ, g.Ff.SQ, g.WM.SQ,
 *     g.N0.q6, g.DX.q6, g.ji.q6, g.fi.q6, g.Ff.q6, g.WM.q6,
 *     g.X4.NN, g.ei.NN
 */

// ── Imports (would come from peer modules in a real build) ──────────
// These reference the global `g` namespace and sibling module exports.
// Actual import paths depend on the broader deobfuscation project structure.

import { createElement, setStyle } from '../../core/dom.js'; // was: g.HB, g.JA
import { isAndroid } from '../../core/browser.js'; // was: g.i0
import { clamp } from '../../core/math.js'; // was: g.lm
import { CaptionEvent, CaptionWindowCue } from './caption-track-list.js'; // was: dE, wE
import { HEX_COLOR_REGEX } from './caption-settings.js'; // was: Or
import { buildSegmentStyles } from './caption-renderer.js'; // was: z1m
import { getCreatorEndscreenModule } from '../../player/caption-manager.js'; // was: CY
import { CEA608_PARITY_TABLE } from './caption-helpers.js'; // was: R19
import { CEA608_BASIC_CHARS } from './caption-helpers.js'; // was: csZ
import { CEA608_SPECIAL_CHARS } from './caption-helpers.js'; // was: W44
import { CEA608_EXTENDED_SPANISH } from './caption-helpers.js'; // was: myo
import { CEA608_EXTENDED_PORTUGUESE } from './caption-helpers.js'; // was: K4H
import { createTimeRanges } from '../../media/codec-helpers.js'; // was: lo
import { PlayerStateMode } from '../../media/codec-tables.js'; // was: wb
import { PLAY_ICON_CENTER } from '../../ui/timed-markers.js'; // was: R1
import { registerInstreamRenderers } from '../../ads/companion-layout.js'; // was: Yb
import { startPoTokenGeneration } from '../../player/video-loader.js'; // was: y4
import { reportFulfillmentError } from '../../ads/ad-scheduling.js'; // was: T1
import { isSamsungSmartTV } from '../../core/composition-helpers.js'; // was: b0
import { detectStateTransition } from '../../data/interaction-logging.js'; // was: aH
import { getAdPlacementConfig } from '../../ads/dai-layout.js'; // was: bx
import { shouldUseNativePlatformCaptions } from '../../player/caption-manager.js'; // was: g.P6
import { isAdaptiveMultiVideo } from '../../media/audio-normalization.js'; // was: g.VTW
import { isCaptionMimeTypeStream } from '../../player/caption-manager.js'; // was: g.l2
import { VisualElementBuilder } from '../../data/idb-operations.js'; // was: VF
import { parseEmsgMetadata } from '../../media/format-setup.js'; // was: g.mQm
import { getSerializedState } from '../../media/format-setup.js'; // was: g.MGm
import { getAdBreakFinished } from '../../media/format-setup.js'; // was: g.JZ0
import { hasDatasyncId } from '../../core/attestation.js'; // was: tN
import { findAllBoxes } from '../../media/format-setup.js'; // was: g.Wd
import { decodeUTF8 } from '../../core/utf8.js'; // was: g.o8
import { reportWarning } from '../../data/gel-params.js'; // was: g.Ty
import { findBox } from '../../media/format-setup.js'; // was: g.YD
import { readMediaHeaderTimescale } from '../../media/format-setup.js'; // was: g.pc
import { readFragmentDecodeTime } from '../../media/format-setup.js'; // was: g.cd
import { getEffectiveLanguageCode } from './caption-translation.js'; // was: g.Na
import { StateFlag } from '../../player/component-events.js'; // was: mV
import { isShortsPage } from '../../features/autoplay.js'; // was: g.oZ
import { isWebExact } from '../../data/performance-profiling.js'; // was: g.rT
import { getPlayerConfig } from '../../core/attestation.js'; // was: g.pm
import { instreamAdPlayerOverlayRenderer } from '../../core/misc-helpers.js'; // was: Re
import { getCaptionTracks } from '../../player/caption-manager.js'; // was: g.H6
import { formatTrackDisplayName } from './caption-translation.js'; // was: g.tR
import { createTranslatedTrack } from './caption-track-list.js'; // was: sUa
import { getCaptionLanguagePreferences } from '../../ads/ad-async.js'; // was: g.Us
import { storageSet } from '../../core/attestation.js'; // was: g.rl
import { isLanguageStickinessEnabled } from './caption-settings.js'; // was: dSm
import { normalizeTrackMetadata } from './caption-translation.js'; // was: g.H2
import { RetryTimer } from '../../media/grpc-parser.js'; // was: tJ
import { sendPostRequest } from '../../network/request.js'; // was: ms
import { sendXhrRequest } from '../../network/request.js'; // was: g.Wn
import { recordTimedStat } from '../../media/engine-config.js'; // was: g.J8
import { isInAdPlayback } from '../../ads/dai-cue-range.js'; // was: WB
import { clear, splice, slice, filter } from '../../core/array-utils.js';
import { appendChild, removeNode } from '../../core/dom-utils.js';
import { shallowEquals, isEmptyObject } from '../../core/object-utils.js';
import { createDefaultWindowCue, initCaptionOverlay } from './caption-track-list.js';
import { toString } from '../../core/string-utils.js';
import { dispose } from '../../ads/dai-cue-range.js';
import { logWarning } from '../../data/logger-init.js'; // was: g.RX
import { getYtNow } from '../../player/time-tracking.js'; // was: g.Yo
import { binarySearch } from '../../core/array-utils.js'; // was: g.H9
import { getPlayerSize } from '../../player/time-tracking.js';
import { isObject } from '../../core/type-helpers.js';

// ═══════════════════════════════════════════════════════════════════════
//  CEA-608 Closed Caption Decoding (lines 404–774)
// ═══════════════════════════════════════════════════════════════════════

// External lookup tables referenced but defined elsewhere in caption.js:
//   R19   — byte parity stripping table
//   csZ   — basic character set (printable chars, indices 0–95)
//   W44   — special character set (16 entries)
//   myo   — extended Spanish/French set (32 entries)
//   K4H   — extended Portuguese/German/Danish set (32 entries)

/**
 * Classify a pair of CEA-608 bytes after parity stripping.
 *
 * Returns an object with `{ JD, CY, result }` where `result` is:
 *   0 — null pair (both 0xFF or both 0x00): ignore
 *   1 — repeat of a valid extended character
 *   2 — two-byte extended character
 *   3 — normal character / control code
 *
 * [was: k01] — Source lines 404–435
 *
 * @param {number} byte1 [was: Q] — first raw byte
 * @param {number} byte2 [was: c] — second raw byte
 * @param {Object} state [was: W] — decoder state with `Xq()` and `CY`
 * @returns {{ JD: number, CY: number, result: number }}
 */
export function classifyControlPair(byte1, byte2, state) { // was: k01
  if ((byte1 === 255 && byte2 === 255) || (!byte1 && !byte2)) {
    return { JD: byte1, getCreatorEndscreenModule: byte2, result: 0 };
  }

  byte1 = CEA608_PARITY_TABLE[byte1]; // was: Q = R19[Q]
  byte2 = CEA608_PARITY_TABLE[byte2]; // was: c = R19[c]

  if (byte1 & 128) {
    let isRepeat; // was: m
    if ((isRepeat = !(byte2 & 128))) {
      isRepeat = byte2;
      isRepeat = state.Xq() && state.getCreatorEndscreenModule === isRepeat; // was: W.Xq() && W.CY === m
    }
    if (isRepeat) {
      return { JD: byte1, getCreatorEndscreenModule: byte2, result: 1 };
    }
  } else if ((byte2 & 128) && 1 <= byte1 && byte1 <= 31) {
    return { JD: byte1, getCreatorEndscreenModule: byte2, result: 2 };
  }

  return { JD: byte1, getCreatorEndscreenModule: byte2, result: 3 };
}

/**
 * Process a CEA-608 byte pair through the decoder.
 *
 * Null pairs (0xFF/0xFF or 0x00/0x00) increment a counter;
 * after 45 consecutive nulls the decoder resets. Otherwise the
 * pair is dispatched to the primary field decoder.
 *
 * [was: pWo] — Source lines 436–441
 *
 * @param {Object} decoder [was: Q] — CEA-608 decoder state
 * @param {number} byte1   [was: c]
 * @param {number} byte2   [was: W]
 * @param {Object} output  [was: m] — caption output sink
 */
export function processCea608Pair(decoder, byte1, byte2, output) { // was: pWo
  if ((byte1 === 255 && byte2 === 255) || (!byte1 && !byte2)) {
    ++decoder.A;
    if (decoder.A === 45) decoder.reset();
    decoder.j.O.clear(); // was: Q.j.O.clear()
    decoder.K.O.clear(); // was: Q.K.O.clear()
  } else {
    decoder.A = 0;
    dispatchCea608Byte(decoder.j, byte1, byte2, output); // was: Yg1(Q.j, c, W, m)
  }
}

/**
 * Drain the CEA-608 queued events, sorting by time and dispatching.
 *
 * Events of type 0 go through `processCea608Pair`; events of type 1
 * (when the channel's mode flag has bits in 496 set) go through the
 * secondary field decoder.
 *
 * [was: Q6a] — Source lines 442–452
 *
 * @param {Object} decoder [was: Q] — CEA-608 decoder with `.W` queue
 * @param {Object} output  [was: c] — caption output sink
 */
export function drainCea608Queue(decoder, output) { // was: Q6a
  decoder.W.sort((a, b) => { // was: Q.W.sort(...)
    const timeDiff = a.time - b.time;
    return timeDiff === 0 ? a.order - b.order : timeDiff;
  });

  for (const event of decoder.W) {
    decoder.time = event.time;
    if (event.type === 0) {
      processCea608Pair(decoder, event.gZ, event.H2, output); // was: pWo(Q, W.gZ, W.H2, c)
    } else if (event.type === 1 && (decoder.O & 496)) {
      dispatchCea608Byte(decoder.K, event.gZ, event.H2, output); // was: Yg1(Q.K, W.gZ, W.H2, c)
    }
  }
  decoder.W.length = 0;
}

/**
 * Look up a character code from one of the four CEA-608 character sets.
 *
 * [was: TDS] — Source lines 453–465
 *
 * @param {number} charSet [was: Q] — character set index (0–3)
 * @param {number} code    [was: c] — raw character code
 * @returns {number} — Unicode code point, or 0 if not found
 */
export function lookupCharCode(charSet, code) { // was: TDS
  switch (charSet) {
    case 0:
      return CEA608_BASIC_CHARS[(code & 127) - 32];
    case 1:
      return CEA608_SPECIAL_CHARS[code & 15];
    case 2:
      return CEA608_EXTENDED_SPANISH[code & 31];
    case 3:
      return CEA608_EXTENDED_PORTUGUESE[code & 31];
  }
  return 0;
}

/**
 * Extract all text from a CEA-608 window buffer and emit it to the
 * output sink.
 *
 * In paint-on mode (style type 3), text is collected with timestamps
 * and emitted in a single call. In other modes, each row is emitted
 * separately with per-row timestamps, and cells are reset after reading.
 *
 * [was: yX] — Source lines 466–520
 *
 * @param {Object} buffer [was: Q] — window buffer with `.A[][]` grid,
 *   `.K.time`, `.style`
 * @param {Object} output [was: c] — sink with `.j(row, col, start, end, text)`
 */
export function extractWindowText(buffer, output) { // was: yX
  if (buffer.style.type === 3) {
    // Paint-on mode: scan for first non-empty cell, collect all text
    let firstRow = 0;      // was: W
    let firstCol = 0;      // was: m
    let earliestTime = buffer.K.time + 0; // was: K
    let text = '';          // was: T
    let pendingNewline = ''; // was: r
    const endTime = earliestTime; // was: U

    for (let row = 1; row <= 15; ++row) { // was: I
      let hasContent = false; // was: X
      for (let col = firstCol ? firstCol : 1; col <= 32; ++col) { // was: A
        const cell = buffer.A[row][col]; // was: e
        if (cell.W !== 0) {
          if (firstRow === 0) {
            firstRow = row;
            firstCol = col;
          }
          const ch = String.fromCharCode(cell.W); // was: X (reused)
          const timestamp = cell.timestamp; // was: V
          if (timestamp < earliestTime) earliestTime = timestamp;
          cell.timestamp = endTime;
          if (pendingNewline) {
            text += pendingNewline;
            pendingNewline = '';
          }
          text += ch;
          hasContent = true;
        }
        if ((cell.W === 0 || col === 32) && hasContent) {
          pendingNewline = '\n';
          break;
        } else if (firstCol && !hasContent) {
          break;
        }
      }
      if (firstRow && !hasContent) break;
    }

    if (text) {
      output.j(firstRow, firstCol, earliestTime, endTime, text);
    }
  } else {
    // Pop-on / roll-up modes: emit each row individually
    let firstRow = 0;      // was: W (reused in else)
    let firstCol = 0;      // was: m
    let earliestTime = buffer.K.time + 0; // was: K (reused)
    const endTime = earliestTime; // was: T

    for (let row = 1; row <= 15; ++row) { // was: r
      let rowText = '';      // was: U
      for (let col = 1; col <= 32; ++col) { // was: I
        const cell = buffer.A[row][col]; // was: A
        const charCode = cell.W;         // was: e

        if (charCode !== 0) {
          if (firstRow === 0) {
            firstRow = row;
            firstCol = col;
          }
          const ch = String.fromCharCode(charCode); // was: X
          const timestamp = cell.timestamp;          // was: V
          if (timestamp <= earliestTime) earliestTime = timestamp;
          rowText += ch;
          cell.reset();
        }

        if (col === 32 || charCode === 0) {
          if (rowText) {
            output.j(firstRow, firstCol, earliestTime, endTime, rowText);
          }
          earliestTime = endTime;
          rowText = '';
          firstCol = 0;
          firstRow = 0;
        }
      }
    }
  }
}

/**
 * Return the cell at the current cursor position.
 *
 * [was: SO] — Source line 521–523
 *
 * @param {Object} buffer [was: Q] — window buffer
 * @returns {Object} — the cell object at `buffer.A[row][cursor]`
 */
export function currentCell(buffer) { // was: SO
  return buffer.A[buffer.row][buffer.O];
}

/**
 * Write a character into the current cell of the window buffer,
 * handling backspace behavior for extended characters (charSet >= 2).
 *
 * [was: F8] — Source lines 524–531
 *
 * @param {Object} buffer  [was: Q]
 * @param {number} charSet [was: c] — character set index
 * @param {number} code    [was: W] — raw character code
 */
export function writeCharacter(buffer, charSet, code) { // was: F8
  // Extended chars (set >= 2) replace previous character (backspace)
  if (charSet >= 2 && buffer.O > 1) {
    --buffer.O;
    currentCell(buffer).W = 0;
  }
  const cell = currentCell(buffer);
  cell.timestamp = buffer.K.time + 0;
  cell.W = lookupCharCode(charSet, code); // was: TDS(c, W)
  if (buffer.O < 32) buffer.O++;
}

/**
 * Copy `count` rows from source position to destination position.
 *
 * [was: oH9] — Source lines 532–540
 *
 * @param {Object} buffer [was: Q]
 * @param {number} destRow [was: c] — destination start row
 * @param {number} srcRow  [was: W] — source start row
 * @param {number} count   [was: m] — number of rows to copy
 */
export function copyRows(buffer, destRow, srcRow, count) { // was: oH9
  for (let r = 0; r < count; r++) {
    for (let col = 0; col <= 32; col++) {
      const dest = buffer.A[destRow + r][col]; // was: K
      const src = buffer.A[srcRow + r][col];   // was: T
      dest.W = src.W;
      dest.timestamp = src.timestamp;
    }
  }
}

/**
 * Clear `count` rows starting at `startRow`.
 *
 * [was: ZG] — Source lines 541–545
 *
 * @param {Object} buffer   [was: Q]
 * @param {number} startRow [was: c]
 * @param {number} count    [was: W]
 */
export function clearRows(buffer, startRow, count) { // was: ZG
  for (let row = 0; row < count; row++) {
    for (let col = 0; col <= 32; col++) {
      buffer.A[startRow + row][col].reset();
    }
  }
}

/**
 * Reset the buffer cursor to the top and clear all rows.
 *
 * [was: Er] — Source lines 546–550
 *
 * @param {Object} buffer [was: Q]
 */
export function resetBufferPosition(buffer) { // was: Er
  buffer.row = buffer.W > 0 ? buffer.W : 1;
  buffer.O = 1;
  clearRows(buffer, 0, 15); // was: ZG(Q, 0, 15)
}

/**
 * Enter "Resume Caption Loading" (pop-on) mode.
 *
 * Sets the channel style to pop-on (1), assigns the off-screen buffer
 * as the working buffer, resets scroll count, sets the style on the
 * buffer, and updates the decoder mode mask.
 *
 * [was: rsv] — Source lines 551–557
 *
 * @param {Object} channel [was: Q] — caption channel state
 */
export function enterResumeCaption(channel) { // was: rsv
  channel.style.set(1);
  channel.W = channel.j;     // was: Q.W = Q.j — set working buffer to off-screen
  channel.W.W = 0;           // was: Q.W.W = 0 — reset scroll count
  channel.W.style = channel.style;
  channel.A.mode = 1 << channel.W.j; // was: Q.A.mode = 1 << Q.W.j
}

/**
 * Enter roll-up mode with a given visible row count.
 *
 * If currently in pop-on or resume mode, extracts text from the
 * on-screen buffer first and resets both buffers. Adjusts the
 * visible window height.
 *
 * [was: sr] — Source lines 558–579
 *
 * @param {Object} channel    [was: Q] — caption channel state
 * @param {number} rowCount   [was: c] — visible row count (2, 3, or 4)
 * @param {Object} output     [was: W] — caption output sink
 */
export function enterRollUp(channel, rowCount, output) { // was: sr
  const onScreen = channel.O; // was: m
  let didReset = false;       // was: K

  switch (channel.style.get()) {
    case 4: // paint-on
    case 1: // pop-on (resume caption loading)
    case 2: // pop-on (resume direct captioning)
      if (!(channel.style.get() === 4 && onScreen.W > 0)) {
        extractWindowText(onScreen, output); // was: yX(m, W)
        resetBufferPosition(channel.O);      // was: Er(Q.O)
        resetBufferPosition(channel.j);      // was: Er(Q.j)
        onScreen.row = 15;
        onScreen.W = rowCount;
        didReset = true;
      }
  }

  channel.style.set(3); // roll-up mode
  channel.W = onScreen;
  channel.W.style = channel.style;
  channel.A.mode = 1 << onScreen.j;

  if (didReset) {
    onScreen.O = 1; // cursor to column 1
  } else if (onScreen.W !== rowCount) {
    if (onScreen.W > rowCount) {
      extractWindowText(onScreen, output); // was: yX(m, W)
      clearRows(onScreen, onScreen.row - onScreen.W, rowCount); // was: ZG(m, m.row - m.W, c)
    } else if (onScreen.row < rowCount) {
      rowCount = onScreen.W;
    }
    onScreen.W = rowCount;
  }
}

/**
 * Enter paint-on mode.
 *
 * [was: Uya] — Source lines 580–585
 *
 * @param {Object} channel [was: Q] — caption channel state
 */
export function enterPaintOn(channel) { // was: Uya
  channel.style.set(4);
  channel.W = channel.text;       // was: Q.W = Q.text
  channel.W.style = channel.style;
  channel.A.mode = 1 << channel.W.j;
}

/**
 * Main CEA-608 byte-pair dispatcher.
 *
 * Handles printable characters, preamble address codes (PAC),
 * mid-row codes, extended characters, and control codes (backspace,
 * delete-to-end, roll-up captions, carriage return, erase, flip, etc.).
 *
 * [was: Yg1] — Source lines 586–774
 *
 * @param {Object} field  [was: Q] — field decoder state
 * @param {number} byte1  [was: c] — first byte (after parity strip)
 * @param {number} byte2  [was: W] — second byte
 * @param {Object} output [was: m] — caption output sink
 */
export function dispatchCea608Byte(field, byte1, byte2, output) { // was: Yg1
  field.O.update();
  const classified = classifyControlPair(byte1, byte2, field.O); // was: c = k01(c, W, Q.O)

  switch (classified.result) {
    case 0: // null pair — ignore
      return;
    case 1: // repeat — ignore
    case 2: // extended repeat — ignore
      return;
  }

  let hi = classified.JD; // was: K
  let createTimeRanges = classified.getCreatorEndscreenModule; // was: c (reused)

  if (hi >= 32 || !hi) {
    // ── Printable characters ──────────────────────────────────────
    if (field.W.mode & field.W.O) {
      let ch1 = hi; // was: W (reused)
      if (ch1 & 128) ch1 = 127;
      if (createTimeRanges & 128) createTimeRanges = 127;
      const channel = field.j.W; // was: Q = Q.j.W
      if (ch1 & 96) writeCharacter(channel, 0, ch1); // was: F8(Q, 0, W)
      if (createTimeRanges & 96) writeCharacter(channel, 0, createTimeRanges);   // was: F8(Q, 0, c)
      // In paint-on mode, emit text immediately
      if (ch1 !== 0 && createTimeRanges !== 0 && channel.style.type === 3) {
        extractWindowText(channel, output); // was: yX(Q, m)
      }
    }
  } else if (hi & 16) {
    // ── Preamble Address Code (PAC) or mid-row code ───────────────
    if (!field.O.matches(hi, createTimeRanges)) {
      const controlState = field.O; // was: W (reused)
      controlState.JD = hi;
      controlState.getCreatorEndscreenModule = createTimeRanges;
      controlState.state = 2;

      const activeChannel = (hi & 8) ? field.D : field.A; // was: W = K & 8 ? Q.D : Q.A
      field.j = activeChannel;
      field.W.mode = 1 << (field.K << 2) + (activeChannel.K << 1) + (activeChannel.style.type === 4 ? 1 : 0);

      const altMode = (field.W.mode | (1 << (field.K << 2) + (activeChannel.K << 1) + (activeChannel.style.type !== 4 ? 1 : 0)));
      if (!(altMode & field.W.O)) {
        // Mode not active — skip
      } else if (createTimeRanges & 64) {
        // ── PAC: set row and indent ────────────────────────────────
        const row = [11, 11, 1, 2, 3, 4, 12, 13, 14, 15, 5, 6, 7, 8, 9, 10][(hi & 7) << 1 | (createTimeRanges >> 5) & 1]; // was: m
        const indent = (createTimeRanges & 16) ? ((createTimeRanges & 14) >> 1) * 4 : 0; // was: Q (reused)
        const workingBuffer = activeChannel.W; // was: c (reused)

        switch (activeChannel.style.get()) {
          case 4: // paint-on: keep current row
            // row = workingBuffer.row; (effectively a no-op assignment)
            break;
          case 3: { // roll-up: scroll if needed
            if (row !== workingBuffer.row) {
              if (row < workingBuffer.W) {
                // Clamp row to minimum visible
                if (workingBuffer.W === workingBuffer.row) break;
                // else row stays as workingBuffer.W
              }
              const srcStart = 1 + workingBuffer.row - workingBuffer.W;      // was: T
              const destStart = 1 + row - workingBuffer.W;                    // was: r
              copyRows(workingBuffer, destStart, srcStart, workingBuffer.W);  // was: oH9(c, r, T, c.W)

              // Clear leftover rows
              let clearStart = srcStart;                                       // was: W (reused)
              let clearCount = workingBuffer.W;                                // was: K (reused)
              if (destStart < srcStart) {
                const overlap = destStart + clearCount - srcStart;
                if (overlap > 0) {
                  clearStart += overlap;
                  clearCount -= overlap;
                }
              } else {
                const overlap = srcStart + clearCount - destStart;
                if (overlap > 0) {
                  clearCount -= overlap;
                }
              }
              clearRows(workingBuffer, clearStart, clearCount); // was: ZG(c, W, K)
            }
            break;
          }
        }
        workingBuffer.row = row;
        workingBuffer.O = indent + 1;

      } else {
        // ── Mid-row / special character codes ──────────────────────
        switch (hi & 7) {
          case 1:
            switch (createTimeRanges & 112) {
              case 32:
                writeCharacter(activeChannel.W, 0, 32); // non-breaking transparent space
                break;
              case 48:
                if (createTimeRanges === 57) {
                  // Transparent space
                  const PlayerStateMode = activeChannel.W; // was: m (reused)
                  currentCell(PlayerStateMode).W = 0;
                  if (PlayerStateMode.O < 32) PlayerStateMode.O++;
                } else {
                  writeCharacter(activeChannel.W, 1, createTimeRanges & 15); // special character
                }
                break;
            }
            break;
          case 2:
            if (createTimeRanges & 32) writeCharacter(activeChannel.W, 2, createTimeRanges & 31); // extended Spanish/French
            break;
          case 3:
            if (createTimeRanges & 32) writeCharacter(activeChannel.W, 3, createTimeRanges & 31); // extended Portuguese/German
            break;
          case 4:
          case 5:
            if (createTimeRanges >= 32 && createTimeRanges <= 47) {
              switch (createTimeRanges) {
                case 32: // Resume Caption Loading
                  enterResumeCaption(activeChannel); // was: rsv(W)
                  break;
                case 33: { // Backspace
                  const PlayerStateMode = activeChannel.W; // was: m (reused)
                  if (PlayerStateMode.O > 1) {
                    --PlayerStateMode.O;
                    currentCell(PlayerStateMode).W = 0;
                  }
                  break;
                }
                case 36: { // Delete to End of Row
                  const PlayerStateMode = activeChannel.W; // was: m (reused)
                  const cursorCell = currentCell(PlayerStateMode); // was: Q (reused)
                  for (let r = 0; r <= 15; r++) {
                    for (let c = 0; c <= 32; c++) {
                      if (PlayerStateMode.A[r][c] === cursorCell) {
                        for (; c <= 32; c++) PlayerStateMode.A[r][c].reset();
                        break;
                      }
                    }
                  }
                  break;
                }
                case 37: // Roll-Up 2 rows
                  enterRollUp(activeChannel, 2, output); // was: sr(W, 2, m)
                  break;
                case 38: // Roll-Up 3 rows
                  enterRollUp(activeChannel, 3, output); // was: sr(W, 3, m)
                  break;
                case 39: // Roll-Up 4 rows
                  enterRollUp(activeChannel, 4, output); // was: sr(W, 4, m)
                  break;
                case 40: // Flash On
                  writeCharacter(activeChannel.W, 0, 32); // was: F8(W.W, 0, 32)
                  break;
                case 41: { // Resume Direct Captioning
                  const ch = activeChannel; // was: m (reused)
                  ch.style.set(2);
                  ch.W = ch.O;           // set on-screen as working buffer
                  ch.W.W = 0;
                  ch.W.style = ch.style;
                  ch.A.mode = 1 << ch.W.j;
                  break;
                }
                case 42: { // Text Restart
                  const ch = activeChannel; // was: m (reused)
                  const textBuf = ch.text;  // was: Q (reused)
                  textBuf.W = 15;
                  textBuf.style.set(4);
                  resetBufferPosition(textBuf); // was: Er(Q)
                  enterPaintOn(ch);             // was: Uya(m)
                  break;
                }
                case 43: // Resume Text Display
                  enterPaintOn(activeChannel); // was: Uya(W)
                  break;
                case 44: { // Erase Displayed Memory
                  const ch = activeChannel;     // was: Q (reused)
                  const onScreen = ch.O;        // was: c (reused)
                  switch (ch.style.get()) {
                    case 1: // pop-on
                    case 2: // direct captioning
                    case 3: // roll-up
                      extractWindowText(onScreen, output); // was: yX(c, m)
                  }
                  clearRows(onScreen, 0, 15); // was: ZG(c, 0, 15)
                  break;
                }
                case 45: { // Carriage Return
                  const ch = activeChannel;   // was: c (reused)
                  const PlayerStateMode = ch.W;            // was: Q (reused)
                  switch (ch.style.get()) {
                    default:
                    case 2: // direct captioning
                    case 1: // pop-on
                      break; // no-op for these modes
                    case 4: // paint-on
                      if (PlayerStateMode.row < 15) {
                        ++PlayerStateMode.row;
                        PlayerStateMode.O = 1;
                        break;
                      }
                      // fall through to scroll if at bottom
                    case 3: // roll-up
                      if (PlayerStateMode.W < 2) {
                        PlayerStateMode.W = 2;
                        if (PlayerStateMode.row < PlayerStateMode.W) PlayerStateMode.row = PlayerStateMode.W;
                      }
                      {
                        const scrollSrc = PlayerStateMode.row - PlayerStateMode.W + 1;
                        extractWindowText(PlayerStateMode, output); // was: yX(Q, m)
                        copyRows(PlayerStateMode, scrollSrc, scrollSrc + 1, PlayerStateMode.W - 1); // was: oH9(Q, c, c + 1, Q.W - 1)
                        clearRows(PlayerStateMode, PlayerStateMode.row, 1); // was: ZG(Q, Q.row, 1)
                      }
                      break;
                  }
                  break;
                }
                case 46: // Erase Non-Displayed Memory
                  clearRows(activeChannel.j, 0, 15); // was: ZG(W.j, 0, 15)
                  break;
                case 47: { // End of Caption (Flip Memories)
                  const ch = activeChannel; // was: Q (reused)
                  extractWindowText(ch.O, output); // was: yX(Q.O, m)
                  ch.j.updateTime(ch.A.time + 0);  // was: Q.j.updateTime(Q.A.time + 0)
                  // Swap on-screen and off-screen buffers
                  const temp = ch.j;                // was: m (reused)
                  ch.j = ch.O;
                  ch.O = temp;
                  enterResumeCaption(ch);           // was: rsv(Q)
                  break;
                }
              }
            }
            break;
          case 7:
            switch (createTimeRanges) {
              case 33: // Tab Offset 1
              case 34: // Tab Offset 2
              case 35: { // Tab Offset 3
                const PlayerStateMode = activeChannel.W; // was: m (reused)
                PlayerStateMode.O += (createTimeRanges & 3);
                if (PlayerStateMode.O > 32) PlayerStateMode.O = 32;
                break;
              }
            }
            break;
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Ruby / Text Emphasis Segment Building (lines 775–865)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build a caption segment that may contain ruby (furigana) annotation
 * or text emphasis marks.
 *
 * When the pen style `AQ` is 1, constructs a full ruby element from
 * four XML nodes. Otherwise, applies text-emphasis CSS for styles 9–14.
 *
 * [was: Xw4] — Source lines 775–811
 *
 * @param {number} startTime     [was: Q]
 * @param {number} duration      [was: c]
 * @param {number} priority      [was: W]
 * @param {string} windowId      [was: m]
 * @param {Array}  xmlNodes      [was: K] — 1 or 4 XML text nodes
 * @param {boolean} append       [was: T]
 * @param {Array}  penStyleArray [was: r] — array of pen style definitions
 * @param {Object} penStyleMap   [was: U] — map from pen id to pen style
 * @returns {CaptionEvent}
 */
export function buildRubySegment(startTime, duration, priority, windowId, xmlNodes, append, penStyleArray, penStyleMap) { // was: Xw4
  const firstNode = xmlNodes[0]; // was: U
  let penStyle = penStyleMap[firstNode.getAttribute('p')]; // was: I

  if (penStyle.AQ === 1) {
    // Full ruby annotation from 4 nodes
    const rpOpen = xmlNodes[1];  // was: X
    const rtNode = xmlNodes[2];  // was: A
    const rpClose = xmlNodes[3]; // was: T (reused)

    // Read timestamps (unused but present in original)
    firstNode.getAttribute('t');
    rpOpen.getAttribute('t');
    rtNode.getAttribute('t');
    rpClose.getAttribute('t');

    // Read pen IDs
    firstNode.getAttribute('p');
    rpOpen.getAttribute('p');
    rpClose.getAttribute('p');

    const rtPenStyle = penStyleMap[rtNode.getAttribute('p')]; // was: r (reused)
    const rubyElement = createRubyElement(
      firstNode.textContent,
      rpOpen.textContent,
      rtNode.textContent,
      rpClose.textContent,
      rtPenStyle
    ); // was: IcH(...)
    return new CaptionEvent(startTime, duration, priority, windowId, rubyElement, append, penStyle); // was: new dE(...)
  }

  // Text emphasis styling for pen types 9–14
  switch (penStyle.AQ) {
    case 9:
    case 10:
      penStyle.textEmphasis = 1;
      break;
    case 11:
      penStyle.textEmphasis = 2;
      break;
    case 12:
      penStyle.textEmphasis = 3;
      break;
    case 13:
      penStyle.textEmphasis = 4;
      break;
    case 14:
      penStyle.textEmphasis = 5;
      break;
  }

  return new CaptionEvent(startTime, duration, priority, windowId, firstNode.textContent || '', append, penStyle); // was: new dE(...)
}

/**
 * Create an HTML ruby element with fallback for Android (no native ruby).
 *
 * Applies ruby-position and text-emphasis CSS based on the pen style.
 * On Android, emulates ruby with positioned `<div>` elements.
 *
 * [was: IcH] — Source lines 812–865
 *
 * @param {string} baseText   [was: Q] — main text
 * @param {string} rpOpen     [was: c] — opening parenthesis for rp
 * @param {string} rubyText   [was: W] — annotation text
 * @param {string} rpClose    [was: m] — closing parenthesis for rp
 * @param {Object} penStyle   [was: K] — pen style with AQ property
 * @returns {HTMLElement} — the assembled ruby (or div) element
 */
export function createRubyElement(baseText, rpOpen, rubyText, rpClose, penStyle) { // was: IcH
  const isAndroidDevice = isAndroid(); // was: T = g.i0()
  const container = isAndroidDevice ? createElement('DIV') : createElement('RUBY'); // was: r
  const baseSpan = createElement('SPAN'); // was: U
  baseSpan.textContent = baseText;
  container.appendChild(baseSpan);

  const rpOpenEl = isAndroidDevice ? createElement('DIV') : createElement('RP'); // was: Q (reused)
  rpOpenEl.textContent = rpOpen;
  container.appendChild(rpOpenEl);

  const rtEl = isAndroidDevice ? createElement('DIV') : createElement('RT'); // was: c (reused)
  rtEl.textContent = rubyText;
  container.appendChild(rtEl);

  // Text emphasis marks for styles 10–14
  const aqType = penStyle.AQ; // was: W (reused)
  if (aqType === 10 || aqType === 11 || aqType === 12 || aqType === 13 || aqType === 14) {
    setStyle(rtEl, 'text-emphasis-style', 'filled circle');
    setStyle(rtEl, 'text-emphasis-color', 'currentcolor');
    setStyle(rtEl, 'webkit-text-emphasis', 'filled circle');
    if (aqType === 11 || aqType === 13) {
      setStyle(rtEl, 'webkit-text-emphasis-position', 'under left');
      setStyle(rtEl, 'text-emphasis-position', 'under left');
    }
  }

  // Ruby position
  let isAbove = true; // was: W (reused)
  if (aqType === 4 || aqType === 7 || aqType === 12 || aqType === 14) {
    setStyle(container, 'ruby-position', 'over');
    setStyle(container, '-webkit-ruby-position', 'before');
  } else if (aqType === 5 || aqType === 6 || aqType === 11 || aqType === 13) {
    setStyle(container, 'ruby-position', 'under');
    setStyle(container, '-webkit-ruby-position', 'after');
    isAbove = false;
  }

  // Closing rp
  const rpCloseEl = isAndroidDevice ? createElement('DIV') : createElement('RP'); // was: K (reused)
  rpCloseEl.textContent = rpClose;
  container.appendChild(rpCloseEl);

  // Android fallback: emulate ruby with absolutely positioned divs
  if (isAndroidDevice) {
    const posAbove = isAbove; // was: m (reused)
    setStyle(container, {
      display: 'handleNoSelectableFormats-block',
      position: 'relative',
    });
    // Hide rp elements
    const rpOpenHidden = container.firstElementChild.nextElementSibling;
    setStyle(rpOpenHidden, 'display', 'none');
    // Position rt
    const rtPositioned = rpOpenHidden.nextElementSibling;
    setStyle(rtPositioned, {
      'font-size': '0.5em',
      'line-height': '1.2em',
      'text-align': 'center',
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '400%',
    });
    // Hide closing rp
    setStyle(container.lastElementChild, 'display', 'none');
    if (posAbove) {
      setStyle(container, 'padding-top', '0.6em');
      setStyle(rtPositioned, 'top', '0');
    } else {
      setStyle(container, 'padding-bottom', '0.6em');
      setStyle(rtPositioned, 'bottom', '0');
    }
  }

  return container;
}

// ═══════════════════════════════════════════════════════════════════════
//  XML / Timed Text Attribute Helpers (lines 870–937)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Read a numeric attribute from an XML element.
 * Returns `undefined` if the attribute is not present.
 *
 * [was: b9] — Source lines 870–874
 *
 * @param {Element} element [was: Q]
 * @param {string} attrName [was: c]
 * @returns {number|undefined}
 */
export function getNumericAttr(element, attrName) { // was: b9
  const value = element.getAttribute(attrName);
  if (value != null) return Number(value);
}

/**
 * Read a boolean ("1" / not "1") attribute from an XML element.
 * Returns `undefined` if the attribute is not present.
 *
 * [was: jO] — Source lines 875–879
 *
 * @param {Element} element [was: Q]
 * @param {string} attrName [was: c]
 * @returns {boolean|undefined}
 */
export function getBooleanAttr(element, attrName) { // was: jO
  const value = element.getAttribute(attrName);
  if (value != null) return value === '1';
}

/**
 * Read a numeric attribute, returning `null` instead of `undefined`
 * when not present.
 *
 * [was: gE] — Source lines 880–883
 *
 * @param {Element} element [was: Q]
 * @param {string} attrName [was: c]
 * @returns {number|null}
 */
export function getNumericAttrOrNull(element, attrName) { // was: gE
  const value = getNumericAttr(element, attrName); // was: b9(Q, c)
  return value !== undefined ? value : null;
}

/**
 * Read a color attribute (hex string), validating against `HEX_COLOR_REGEX`.
 * Returns `undefined` if the attribute is not present.
 *
 * [was: fy] — Source lines 884–889
 *
 * @param {Element} element [was: Q]
 * @param {string} attrName [was: c]
 * @returns {string|undefined}
 */
export function getColorAttr(element, attrName) { // was: fy
  const value = element.getAttribute(attrName);
  if (value != null) {
    HEX_COLOR_REGEX.test(value); // validation (result unused in original)
    return value;
  }
}

/**
 * Parse window style attributes from a timed-text XML element.
 *
 * Merges defaults from the window-style map (`Q.Y[ws]`) or the global
 * default (`Q.j`), then overlays any inline overrides.
 *
 * [was: eBm] — Source lines 890–907
 *
 * @param {Object} parserState [was: Q] — parser with `.Y` (window styles) and `.j` (defaults)
 * @param {Element} element    [was: c] — XML element
 * @returns {Object} — merged style parameters
 */
export function parseWindowStyle(parserState, element) { // was: eBm
  const result = {};
  const wsId = element.getAttribute('ws');
  Object.assign(result, wsId ? parserState.Y[wsId] : parserState.j);

  let val;
  val = getNumericAttrOrNull(element, 'mh'); // was: gE(c, "mh")
  if (val != null) result.PLAY_ICON_CENTER = val;          // modeHint

  val = getNumericAttrOrNull(element, 'ju'); // was: gE(c, "ju")
  if (val != null) result.textAlign = val;

  val = getNumericAttrOrNull(element, 'pd'); // was: gE(c, "pd")
  if (val != null) result.oI = val;          // printDirection

  val = getNumericAttrOrNull(element, 'sd'); // was: gE(c, "sd")
  if (val != null) result.registerInstreamRenderers = val;          // scrollDirection

  val = getColorAttr(element, 'wfc');        // was: fy(c, "wfc")
  if (val != null) result.windowColor = val;

  val = getNumericAttr(element, 'wfo');      // was: b9(c, "wfo")
  if (val !== undefined) result.windowOpacity = val / 255;

  return result;
}

/**
 * Parse window position attributes from a timed-text XML element.
 *
 * Merges defaults from the window-position map (`Q.L[wp]`), then
 * overlays any inline overrides.
 *
 * [was: Vy4] — Source lines 908–923
 *
 * @param {Object} parserState [was: Q] — parser with `.L` (window positions)
 * @param {Element} element    [was: c] — XML element
 * @returns {Object} — merged position parameters
 */
export function parseWindowPosition(parserState, element) { // was: Vy4
  const result = {};
  const wpId = element.getAttribute('wp');
  if (wpId) Object.assign(result, parserState.L[wpId]);

  let val;
  val = getNumericAttrOrNull(element, 'ap'); // was: gE(c, "ap")
  if (val != null) result.bW = val;          // anchorPoint

  val = getNumericAttr(element, 'cc');       // was: b9(c, "cc")
  if (val != null) result.startPoTokenGeneration = val;          // columnCount

  val = getNumericAttr(element, 'ah');       // was: b9(c, "ah")
  if (val != null) result.kc = val;          // horizontalAnchor

  val = getNumericAttr(element, 'rc');       // was: b9(c, "rc")
  if (val != null) result.lS = val;          // rowCount

  val = getNumericAttr(element, 'av');       // was: b9(c, "av")
  if (val != null) result.ZB = val;          // verticalAnchor

  return result;
}

/**
 * Build a `CaptionWindowCue` from a timed-text XML `<w>` or `<ws>` element.
 *
 * Merges position and style attributes, handles RTL column/row swap
 * for print-direction 2 or 3, and generates a unique window ID if
 * the parameters match the parser defaults.
 *
 * [was: BD1] — Source lines 924–937
 *
 * @param {Object} parserState [was: Q]
 * @param {Element} element    [was: c]
 * @param {number} timeOffset  [was: W] — base time offset in ms
 * @param {*} mergeDefault     [was: m] — truthy to merge with defaults
 * @returns {CaptionWindowCue}
 */
export function buildWindowCueFromXml(parserState, element, timeOffset, mergeDefault) { // was: BD1
  let params = {};
  Object.assign(params, parseWindowPosition(parserState, element)); // was: Vy4(Q, c)
  Object.assign(params, parseWindowStyle(parserState, element));    // was: eBm(Q, c)

  let windowId;
  if (mergeDefault) {
    // If params match defaults, reuse the global window ID
    if (shallowEquals(params, parserState.j)) { // was: g.hH(K, Q.j) — deep-equal check
      windowId = parserState.K;        // was: m = Q.K
      params = parserState.j;
    } else {
      windowId = '_' + Ly++;           // was: m = "_" + Ly++
    }
  } else {
    windowId = element.getAttribute('id') || '_' + Ly++; // was: c.getAttribute("id") || "_" + Ly++
  }

  const startTime = getNumericAttr(element, 't') + timeOffset; // was: b9(c, "t") + W
  const duration = getNumericAttr(element, 'd') || 0x8000000000000; // was: b9(c, "d") || ...

  // Swap row/column counts for vertical writing modes
  if (params.oI === 2 || params.oI === 3) {
    const temp = params.lS;
    params.lS = params.startPoTokenGeneration;
    params.startPoTokenGeneration = temp;
  }

  return new CaptionWindowCue(startTime, duration, 0, windowId, params); // was: new wE(Q, c, 0, m, K)
}

/**
 * Build a `CaptionWindowCue` from a protobuf-like caption window descriptor.
 *
 * [was: xy0] — Source lines 942–956
 *
 * @param {Object} parserState [was: Q] — parser with `.j` (winPos map), `.K` (winStyle map)
 * @param {Object} descriptor  [was: c] — window descriptor with wpWinPosId, wsWinStyleId, rcRowCount, ccColCount
 * @param {number} startTime   [was: W]
 * @param {number} duration    [was: m] — 0 means infinite
 * @param {string} windowId    [was: K]
 * @returns {CaptionWindowCue}
 */
export function buildWindowCueFromProto(parserState, descriptor, startTime, duration, windowId) { // was: xy0
  if (duration === 0) duration = 0x8000000000000; // was: m === 0 && (m = ...)
  const params = {};

  if (descriptor.wpWinPosId) Object.assign(params, parserState.j.get(descriptor.wpWinPosId));
  if (descriptor.wsWinStyleId) Object.assign(params, parserState.K.get(descriptor.wsWinStyleId));

  let rowCount = descriptor.rcRowCount;
  if (rowCount !== undefined) params.lS = rowCount;

  let colCount = descriptor.ccColCount;
  if (colCount !== undefined) params.startPoTokenGeneration = colCount;

  // Swap for vertical writing
  if (params.oI === 2 || params.oI === 3) {
    const temp = params.lS;
    params.lS = params.startPoTokenGeneration;
    params.startPoTokenGeneration = temp;
  }

  return new CaptionWindowCue(startTime, duration, 0, windowId, params); // was: new wE(W, m, 0, K, T)
}

// ═══════════════════════════════════════════════════════════════════════
//  Binary / SMPTE-TT Detection (lines 957–983)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Read a single unsigned byte from a byte-stream reader and advance
 * the offset by 1.
 *
 * [was: af] — Source lines 957–961
 *
 * @param {Object} reader [was: Q] — `{ W: DataView, byteOffset: number }`
 * @returns {number}
 */
export function readUint8(reader) { // was: af
  const offset = reader.byteOffset;
  reader.byteOffset += 1;
  return reader.W.getUint8(offset);
}

/**
 * Read an unsigned 32-bit integer (big-endian) and advance by 4.
 *
 * [was: Gl] — Source lines 962–966
 *
 * @param {Object} reader [was: Q]
 * @returns {number}
 */
export function readUint32(reader) { // was: Gl
  const offset = reader.byteOffset;
  reader.byteOffset += 4;
  return reader.W.getUint32(offset);
}

/**
 * Test whether an `ArrayBuffer` contains SMPTE-TT caption data by
 * checking the magic number and version.
 *
 * [was: DyH] — Source lines 967–972
 *
 * @param {ArrayBuffer|string} data [was: Q]
 * @returns {boolean}
 */
export function isSmpteData(data) { // was: DyH
  if (typeof data === 'string') return false;
  const reader = new qV9(data, 0); // was: new qV9(Q, 0)
  return parseSmpteHeader(reader);  // was: nHD(Q)
}

/**
 * Parse and validate the SMPTE-TT header from a byte-stream reader.
 *
 * Checks for the magic number `0x52414900` (1380139777) and version <= 1.
 * Skips 3 reserved bytes after the version.
 *
 * [was: nHD] — Source lines 973–983
 *
 * @param {Object} reader [was: Q]
 * @returns {boolean} — true if valid SMPTE-TT header
 */
export function parseSmpteHeader(reader) { // was: nHD
  if (!(reader.byteOffset < reader.W.byteLength) || readUint32(reader) !== 1380139777) {
    return false;
  }
  reader.version = readUint8(reader);
  if (reader.version > 1) return false;
  readUint8(reader); // reserved
  readUint8(reader); // reserved
  readUint8(reader); // reserved
  return true;
}

// ═══════════════════════════════════════════════════════════════════════
//  Caption Window Scroll / Layout Helpers (lines 984–1023)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Build a CSS `translate` transform string for scrolling a caption window.
 *
 * The direction depends on the writing mode (vertical vs horizontal)
 * and the scroll direction. A negative offset is applied when the
 * scroll direction (`Yb`) is not 1.
 *
 * [was: tyW] — Source lines 984–989
 *
 * @param {Object} renderer [was: Q] — caption window renderer
 * @param {number} offset   [was: c] — pixel offset
 * @returns {string} — CSS transform string, or empty if offset is 0
 */
export function buildScrollTransform(renderer, offset) { // was: tyW
  if (!offset) return '';
  if (renderer.j && renderer.O.params.registerInstreamRenderers !== 1) offset *= -1; // was: Q.j && Q.O.params.Yb !== 1
  return `translate${renderer.j ? 'X' : 'Y'}(${offset}px)`;
}

/**
 * Measure the visual lines of a caption window to determine the
 * content size and column width.
 *
 * Counts the offset dimensions of visual-line elements from the
 * bottom up (up to `rowCount` lines). Also computes the `columnWidth`
 * based on the column-count specification (`y4`) using an em-dash
 * measuring span if needed.
 *
 * [was: HUH] — Source lines 990–1009
 *
 * @param {Object} renderer [was: Q] — caption window renderer
 */
export function measureVisualLines(renderer) { // was: HUH
  renderer.Ie = Array.from(renderer.element.getElementsByClassName('caption-visual-line')); // was: Q.Ie

  let rowCount = renderer.O.params.lS; // was: c
  let measuredHeight = 0;              // was: m
  let lineIndex = renderer.Ie.length - 1; // was: K
  let linesProcessed = 0;                 // was: W

  while (linesProcessed < rowCount && lineIndex > -1) {
    const line = renderer.Ie[lineIndex]; // was: T
    measuredHeight += renderer.j ? line.offsetWidth : line.offsetHeight;
    linesProcessed++;
    lineIndex--;
  }
  renderer.S = measuredHeight;

  // Column width measurement
  if (isNaN(renderer.MM)) {
    const colCount = renderer.W.startPoTokenGeneration; // was: m (reused)
    if (colCount) {
      const measureSpan = createElement('SPAN'); // was: K (reused)
      measureSpan.textContent = '\u2013'.repeat(colCount); // was: g.EZ(K, "\u2013".repeat(m))
      setStyle(measureSpan, buildSegmentStyles(renderer, renderer.W.reportFulfillmentError)); // was: g.JA(K, z1m(Q, Q.W.T1))
      renderer.A.appendChild(measureSpan);
      renderer.MM = measureSpan.offsetWidth;
      renderer.A.removeChild(measureSpan);
    } else {
      renderer.MM = 0;
    }
  }

  const container = renderer.A;
  renderer.isSamsungSmartTV = Math.max(
    renderer.MM,
    renderer.Xw,
    (renderer.j ? container.offsetHeight : container.offsetWidth) + 1
  );
}

/**
 * Measure visual lines and apply scroll transform if the content
 * size has changed. In roll-up mode, triggers a CSS transition.
 *
 * [was: NDa] — Source lines 1010–1023
 *
 * @param {Object} renderer     [was: Q] — caption window renderer
 * @param {boolean} isAnimating [was: c] — whether currently in transition
 */
export function measureAndScrollWindow(renderer, isAnimating) { // was: NDa
  measureVisualLines(renderer); // was: HUH(Q)

  const totalHeight = renderer.Ie.reduce(
    (sum, line) => (renderer.j ? line.offsetWidth : line.offsetHeight) + sum,
    0
  );
  const scrollOffset = renderer.S - totalHeight; // was: W

  if (scrollOffset !== renderer.UH) {
    const isNewlyScrollable = scrollOffset > 0 && renderer.UH === 0; // was: m
    const isScrollingLess = scrollOffset < renderer.UH;              // was: K

    if (!isAnimating && !isNaN(scrollOffset) && !isNewlyScrollable && isScrollingLess) {
      // Apply roll-up transition class
      // was: g.xK(Q.element, "ytp-rollup-mode")
      renderer.element.classList.add('ytp-rollup-mode');
      renderer.B(renderer.element, 'transitionend', renderer.Y0); // was: Q.B(Q.element, "transitionend", Q.Y0)
    }

    setStyle(renderer.A, 'transform', buildScrollTransform(renderer, scrollOffset)); // was: g.JA(Q.A, "transform", tyW(Q, W))
    renderer.UH = scrollOffset;
  }

  measureVisualLines(renderer); // was: HUH(Q) — re-measure after transform
}

// ═══════════════════════════════════════════════════════════════════════
//  SABR Caption Data Handling (lines 1024–1097)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Process a SABR caption data segment: extract timing, merge buffered
 * ranges, and deliver the raw data to the track provider.
 *
 * [was: ysD] — Source lines 1024–1045
 *
 * @param {Object} manager   [was: Q] — SabrCaptionDataManager
 * @param {Object} slice     [was: c] — media slice with info
 * @param {Object} callbacks [was: W] — provider callbacks with `.Zn()`
 * @param {Function} onRangesUpdated [was: m] — called with updated buffered ranges
 */
export function onSabrCaptionSegment(manager, slice, callbacks, onRangesUpdated) { // was: ysD
  const { formatId, DF: dataFormat, startTimeMs, durationMs } = manager.detectStateTransition(slice); // was: Q.aH(c)

  const segmentInfo = {
    formatId,
    startTimeMs,
    durationMs,
    MF: dataFormat,
    getAdPlacementConfig: dataFormat,
  };

  let rangeIndex = findBufferedRangeIndex(manager.h3, segmentInfo.startTimeMs); // was: iUm(Q.h3, I.startTimeMs)
  const existingRange = rangeIndex >= 0 ? manager.h3[rangeIndex] : null;
  const existingEnd = existingRange ? existingRange.startTimeMs + existingRange.durationMs : 0;
  const segmentEnd = segmentInfo.startTimeMs + segmentInfo.durationMs;

  if (!existingRange || (segmentInfo.startTimeMs - existingEnd > manager.j)) {
    // New discontinuous range
    manager.h3.splice(rangeIndex + 1, 0, segmentInfo);
  } else {
    // Extend existing range
    existingRange.durationMs = Math.max(existingEnd, segmentEnd) - existingRange.startTimeMs;
    existingRange.getAdPlacementConfig = Math.max(existingRange.getAdPlacementConfig, segmentInfo.getAdPlacementConfig);
  }

  onRangesUpdated(manager.h3);

  // Deliver raw bytes to the track parser
  const rawData = g.kV(slice); // was: m = g.kV(c)
  const buffer = rawData.buffer.slice(rawData.byteOffset, rawData.byteLength + rawData.byteOffset);
  const timeSeconds = slice.info.j; // was: c = c.info.j
  const provider = manager.K;       // was: Q = Q.K

  if (provider.isSamsungSmartTV) {
    if (provider.L == null) {
      logWarning(provider.logger, 350058965, 'Null loaded track meta data at captions data received');
    } else {
      callbacks.Zn(buffer, provider.L, timeSeconds * 1000);
    }
  } else {
    logWarning(provider.logger, 350058965, 'Null Representation at captions data received');
  }
}

/**
 * Subscribe to SABR caption data events from the player.
 *
 * Handles both sub-fragmented and non-sub-fragmented caption modes.
 * In sub-fragmented mode, fragments are accumulated until a complete
 * segment boundary (`.info.A` is true), then delivered.
 *
 * [was: ZUZ] — Source lines 1046–1069
 *
 * @param {Object} manager   [was: Q] — SabrCaptionDataManager
 * @param {Object} callbacks [was: c] — provider callbacks with `.Zn()`
 */
export function subscribeSabrCaptionEvents(manager, callbacks) { // was: ZUZ
  manager.O = (slice, onRangesUpdated) => { // was: Q.O = (W, m) => { ... }
    if (manager.U.G().experiments.SG('html5_sabr_live_support_subfragmented_captions')) {
      // Sub-fragmented mode
      if (manager.W) {
        manager.W = manager.W.D(slice); // was: Q.W = Q.W.D(W) — append fragment
      } else {
        manager.W = slice;
        fixSegmentStartTime(manager.W); // was: SVS(Q.W)
      }

      if (manager.W) {
        if (slice.info.A) { // segment boundary
          fixSegmentDuration(manager.W);  // was: F4a(Q.W)
          onSabrCaptionSegment(manager, manager.W, callbacks, onRangesUpdated); // was: ysD(Q, Q.W, c, m)
          manager.W = null;
        }
      } else {
        logWarning(manager.logger, 350058965, 'Empty slice');
      }
    } else if (slice.info.A) {
      // Non-sub-fragmented: accumulate pending fragments
      let merged = slice; // was: K
      if (manager.U8.length > 0) {
        merged = manager.U8.shift();
        while (manager.U8.length > 0) {
          merged = merged.D(manager.U8.shift());
        }
        merged = merged.D(slice);
      }
      if (merged) {
        fixSegmentStartTime(merged); // was: SVS(K)
        fixSegmentDuration(merged);  // was: F4a(K)
        onSabrCaptionSegment(manager, merged, callbacks, onRangesUpdated); // was: ysD(Q, K, c, m)
      } else {
        logWarning(manager.logger, 350058965, 'Empty slice');
      }
    } else {
      // Accumulate sub-fragment
      manager.U8.push(slice);
    }
  };
  manager.U.addEventListener('sabrCaptionsDataLoaded', manager.O);
}

/**
 * Binary-search for the buffered range containing `startTimeMs`.
 *
 * Returns the index of the matching range, or `-index - 2` if between
 * ranges (the index of the range immediately before).
 *
 * [was: iUm] — Source lines 1070–1075
 *
 * @param {Array} ranges      [was: Q] — sorted buffered ranges
 * @param {number} startTimeMs [was: c]
 * @returns {number}
 */
export function findBufferedRangeIndex(ranges, startTimeMs) { // was: iUm
  const index = binarySearch(ranges, { startTimeMs }, (a, b) => a.startTimeMs - b.startTimeMs); // was: g.H9(Q, { startTimeMs: c }, ...)
  return index >= 0 ? index : -index - 2;
}

/**
 * Fix the start time of a media slice by reading the actual presentation
 * timestamp from the container. Falls back to `info.startTime` on error.
 *
 * [was: SVS] — Source lines 1076–1086
 *
 * @param {Object} slice [was: Q] — media slice
 */
export function fixSegmentStartTime(slice) { // was: SVS
  let timeMs;
  try {
    timeMs = g.QP(slice) * 1000; // was: g.QP(Q) * 1E3
  } catch (_) {
    timeMs = slice.info.startTime * 1000;
  }
  if (timeMs < 0) timeMs = slice.info.startTime * 1000;
  slice.info.startTime = timeMs / 1000;
  slice.info.j = timeMs / 1000;
}

/**
 * Fix the duration of a media slice by reading the actual duration
 * from the container. Falls back to `info.duration` on error.
 *
 * [was: F4a] — Source lines 1087–1097
 *
 * @param {Object} slice [was: Q] — media slice
 */
export function fixSegmentDuration(slice) { // was: F4a
  let durationMs;
  try {
    durationMs = g.Y8x(slice) * 1000; // was: g.Y8x(Q) * 1E3
  } catch (_) {
    durationMs = slice.info.duration * 1000;
  }
  if (durationMs < 0) durationMs = slice.info.duration * 1000;
  slice.info.duration = durationMs / 1000;
  slice.info.L = durationMs / 1000;
}

// ═══════════════════════════════════════════════════════════════════════
//  Track State Queries (lines 1098–1167)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Determine whether the current video data supports SABR live captions.
 *
 * Checks for rawcc in the caption format map and the presence of
 * type "386" representations when manifestless, or `g.yrK` otherwise.
 *
 * [was: EHi] — Source lines 1098–1104
 *
 * @param {Object} videoData [was: Q]
 * @param {Object} track     [was: c] — caption track metadata
 * @returns {boolean}
 */
export function isSabrLiveCaptions(videoData, track) { // was: EHi
  if (!isAdaptiveMultiVideo(videoData) || (videoData.W != null && shouldUseNativePlatformCaptions(track, videoData.W) && videoData.W.W.rawcc != null)) {
    return false;
  }
  const manifestless = !!videoData.W && videoData.W.isManifestless && Object.values(videoData.W.W).some(rep => isCaptionMimeTypeStream(rep, '386'));
  const manifest = !!videoData.W && !videoData.W.isManifestless && g.yrK(videoData.W);
  return manifestless || manifest;
}

/**
 * Find a track representation matching a given language code
 * and optional format filter.
 *
 * [was: s6W] — Source lines 1105–1117
 *
 * @param {Object} module       [was: Q] — caption module
 * @param {string} languageCode [was: c]
 * @param {string} [formatFilter] [was: W] — optional format type string
 * @returns {?Object} — matching track, or null
 */
export function findTrackByLanguage(module, languageCode, formatFilter = undefined) { // was: s6W
  const matches = [];
  for (const key in module.O.W) {
    if (!module.O.W.hasOwnProperty(key)) continue;
    const track = module.O.W[key];
    if (isCaptionMimeTypeStream(track, formatFilter || null)) {
      const captionTrack = track.info.captionTrack;
      if (captionTrack && captionTrack.languageCode === languageCode) {
        matches.push(track);
      }
    }
  }
  return matches.length ? matches[0] : null;
}

/**
 * Build a list of available caption tracks from the manifest.
 *
 * Creates `CaptionTrack` objects for each representation matching the
 * optional format filter, extracting language, name, kind, and id.
 *
 * [was: dy9] — Source lines 1118–1150
 *
 * @param {Object} module       [was: Q] — caption module
 * @param {string} [formatFilter] [was: c] — optional format type string
 * @returns {Array<CaptionTrack>}
 */
export function listAvailableTracks(module, formatFilter = undefined) { // was: dy9
  const tracks = [];
  for (const key in module.O.W) {
    if (!module.O.W.hasOwnProperty(key)) continue;
    const rep = module.O.W[key];
    if (isCaptionMimeTypeStream(rep, formatFilter || null)) {
      let languageCode = rep.info.id;
      let languageName = languageCode;
      let vssId = `.${languageCode}`;
      let kind = '';
      let captionId = '';

      const captionTrack = rep.info.captionTrack;
      if (captionTrack) {
        languageCode = captionTrack.languageCode;
        languageName = captionTrack.displayName;
        vssId = captionTrack.vssId;
        kind = captionTrack.kind;
        captionId = captionTrack.id;
      }

      tracks.push(new g.zz({ // was: new g.zz(...)
        id: key,
        languageCode,
        languageName,
        is_servable: true,   // was: !0
        is_default: true,    // was: !0
        is_translateable: false, // was: !1
        vss_id: vssId,
        kind,
        captionId,
      }));
    }
  }
  return tracks;
}

/**
 * Check whether a binary buffer starts with the WebVTT magic header.
 *
 * Compares the first bytes against the `L49` constant array (which
 * holds the ASCII bytes of "WEBVTT").
 *
 * [was: wwa] — Source lines 1151–1160
 *
 * @param {ArrayBuffer} buffer [was: Q]
 * @returns {boolean}
 */
export function isWebVttHeader(buffer) { // was: wwa
  const headerLength = L49.length; // was: c
  if (buffer.byteLength < headerLength) return false;
  const bytes = new Uint8Array(buffer, 0, headerLength);
  for (let i = 0; i < headerLength; i++) {
    if (L49[i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Parse a colon-separated timestamp string (e.g. "00:01:30") into
 * milliseconds.
 *
 * [was: $X] — Source lines 1161–1167
 *
 * @param {string} timestampStr [was: Q]
 * @returns {number} — time in milliseconds
 */
export function parseColonTimestamp(timestampStr) { // was: $X
  const parts = timestampStr.split(':');
  let seconds = 0;
  for (const part of parts) {
    seconds = seconds * 60 + Number(part);
  }
  return seconds * 1000;
}

// ═══════════════════════════════════════════════════════════════════════
//  Format Parsing Helpers (lines 1174–1259)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Recursively parse HTML-like formatted text nodes (`<b>`, `<i>`, `<u>`)
 * into `CaptionEvent` objects.
 *
 * Collects text nodes and applies cumulative bold/italic/underline
 * styling from wrapper elements. Each text node becomes a separate
 * `CaptionEvent` appended to the output arrays.
 *
 * [was: j6D] — Source lines 1174–1197
 *
 * @param {Object} parserState    [was: Q] — (unused in this function)
 * @param {number} startTime      [was: c]
 * @param {number} duration       [was: W]
 * @param {number} priority       [was: m]
 * @param {CaptionWindowCue} windowCue [was: K] — parent window cue
 * @param {boolean} append        [was: T]
 * @param {Element} node          [was: r] — HTML element to parse
 * @param {Object} currentStyle   [was: U] — accumulated style state
 * @param {Array} outputCues      [was: I] — output array for CaptionEvent objects
 */
export function parseFormattedTextNodes(parserState, startTime, duration, priority, windowCue, append, node, currentStyle, outputCues) { // was: j6D
  switch (node.tagName) {
    case 'b':
      currentStyle.bold = true;
      break;
    case 'i':
      currentStyle.italic = true;
      break;
    case 'u':
      currentStyle.underline = true;
      break;
  }

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i]; // was: X
    if (child.nodeType === 3) {
      // Text node
      const cue = new CaptionEvent(
        startTime,
        duration,
        priority,
        windowCue.id,
        child.nodeValue,
        append || i > 0,
        isEmptyObject(currentStyle) ? undefined : currentStyle // was: g.P9(U) ? void 0 : U — empty object check
      );
      outputCues.push(cue);
      windowCue.W.push(cue); // was: K.W.push(X)
    } else {
      // Element node — recurse with cloned style
      const childStyle = {};
      Object.assign(childStyle, currentStyle);
      parseFormattedTextNodes(parserState, startTime, duration, priority, windowCue, true, child, childStyle, outputCues);
    }
  }
}

/**
 * Split raw track data by container format.
 *
 * Handles three cases:
 *   1. String data or valid SMPTE-TT → return as-is
 *   2. WebVTT header detected → return as-is
 *   3. ISO BMFF (MP4) → extract mdat payloads, parse moof timestamps
 *
 * [was: OUi] — Source lines 1198–1233
 *
 * @param {Object} parserState [was: Q] — parser with `.Z1` DAI manager
 * @param {ArrayBuffer|string} data [was: c]
 * @param {number} timeOffset [was: W] — base time offset in ms
 * @returns {Array<{ trackData: *, VF: number }>}
 */
export function splitTrackDataByFormat(parserState, data, timeOffset) { // was: OUi
  // Case 1: string or SMPTE-TT binary
  if (typeof data === 'string' || isSmpteData(data)) { // was: typeof c === "string" || DyH(c)
    return [{ trackData: data, VisualElementBuilder: timeOffset }];
  }

  // Case 2: WebVTT (string prefix or binary header)
  if ((typeof data === 'string' && data.substring(0, 6) === 'WEBVTT') || (typeof data !== 'string' && isWebVttHeader(data))) {
    return [{ trackData: data, VisualElementBuilder: timeOffset }];
  }

  // Case 3: ISO BMFF container
  const view = new DataView(data);
  if (view.byteLength <= 8 || view.getUint32(4) !== 1718909296) { // "ftyp" magic
    return [];
  }

  let segmentInfo = parseEmsgMetadata(view); // was: K = g.mQm(m)
  if (parserState.Z1 && segmentInfo) {
    const mapTimestamp = getSerializedState(segmentInfo); // was: T
    const nfTimestamp = getAdBreakFinished(segmentInfo);  // was: r
    const segmentNumber = segmentInfo.segmentNumber; // was: K (reused)
    if (mapTimestamp && segmentNumber) {
      parserState.Z1.hasDatasyncId(segmentNumber, mapTimestamp, nfTimestamp);
    }
  }

  const mdatBoxes = findAllBoxes(view, 1835295092); // was: Q = g.Wd(m, 1835295092) — "mdat"
  if (!mdatBoxes || !mdatBoxes.length || !mdatBoxes[0].size) return [];

  const results = [];
  for (let i = 0; i < mdatBoxes.length; i++) {
    const box = mdatBoxes[i];
    const payload = new Uint8Array(data, box.dataOffset, box.size - (box.dataOffset - box.offset));
    const decoded = decodeUTF8(payload); // was: g.o8(K) — decode UTF-8
    results.push({
      trackData: decoded,
      VisualElementBuilder: timeOffset + i * 1000,
    });
  }

  extractMoofTimestamps(view, results, timeOffset); // was: gHm(m, T, W)
  return results.filter(entry => !!entry.trackData);
}

/**
 * Parse WebVTT data using the deprecated fallback parser.
 *
 * Logs a sampling error for telemetry.
 *
 * [was: vHa] — Source lines 1234–1239
 *
 * @param {Object} parserState [was: Q]
 * @param {string} data        [was: c]
 * @param {number} timeOffset  [was: W]
 * @returns {Array} — parsed cues
 */
export function parseWebVttFallback(parserState, data, timeOffset) { // was: vHa
  if (!parserState.W) parserState.W = new fcm(); // was: Q.W || (Q.W = new fcm)
  const result = parserState.W.A(data, timeOffset); // was: Q = Q.W.A(c, W)
  if (Math.random() < 0.01) {
    reportWarning(Error('Deprecated subtitles format in web player: WebVTT'));
  }
  return result;
}

/**
 * Extract timestamps from moof (movie fragment) boxes within an
 * ISO BMFF container and assign them to the corresponding track
 * data entries.
 *
 * Uses the movie timescale from the `mvhd` box (defaulting to 90000)
 * to convert ticks to milliseconds.
 *
 * [was: gHm] — Source lines 1240–1252
 *
 * @param {DataView} view        [was: Q] — MP4 data view
 * @param {Array} trackEntries   [was: c] — array of `{ trackData, VF }` entries
 * @param {number} baseTimeMs    [was: W] — fallback base time in ms
 */
export function extractMoofTimestamps(view, trackEntries, baseTimeMs) { // was: gHm
  const mvhdBox = findBox(view, 0, 1836476516); // was: m = g.YD(Q, 0, 1836476516) — "mvhd"
  let timescale = 90000; // was: K
  if (mvhdBox) timescale = readMediaHeaderTimescale(mvhdBox) || 90000;

  let firstTimestamp = 0; // was: m (reused)
  const moofBoxes = findAllBoxes(view, 1836019558); // was: T = g.Wd(Q, 1836019558) — "moof"

  for (let i = 0; i < moofBoxes.length; i++) {
    const moofBox = moofBoxes[i]; // was: r
    if (i < trackEntries.length) {
      const trunBox = findBox(view, moofBox.dataOffset, 1953653094); // "trun"
      if (trunBox) {
        const tfdtBox = findBox(view, trunBox.dataOffset, 1952867444); // "tfdt"
        if (tfdtBox) {
          const timestampMs = readFragmentDecodeTime(tfdtBox) / timescale * 1000; // was: r = g.cd(r) / K * 1E3
          if (i === 0) firstTimestamp = timestampMs;
          trackEntries[i].VisualElementBuilder = (timestampMs - firstTimestamp + baseTimeMs) || (baseTimeMs * i * 1000);
        }
      }
    }
  }
}

/**
 * Detect language parameters from a track metadata object.
 *
 * Extracts the language code and sets the `oI` (print direction)
 * flag to 1 (RTL) if the language code matches an RTL pattern.
 *
 * [was: ac0] — Source lines 1253–1259
 *
 * @param {Object} trackMeta [was: Q] — track metadata
 * @returns {Object} — `{ lang?, oI? }`
 */
export function detectLanguageParams(trackMeta) { // was: ac0
  const result = {};
  const langCode = getEffectiveLanguageCode(trackMeta); // was: Q = g.Na(Q) — get language code
  if (langCode) {
    result.lang = langCode;
    if (g.vPn.test(langCode)) result.oI = 1; // RTL language
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════
//  Sample Subtitle Display (lines 1333–1341)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Show or hide sample subtitle text (used in the settings preview).
 *
 * When `show` is true and no sample cues exist, creates a default
 * window cue and text cue with "Captions look like this". When `show`
 * is false, removes the sample cues from the player.
 *
 * [was: u9] — Source lines 1333–1341
 *
 * @param {Object} module    [was: Q] — caption module
 * @param {boolean} show     [was: c] — true to show, false to hide
 * @param {string} [text]    [was: W] — optional override text
 */
export function showSampleSubtitles(module, show, text) { // was: u9
  if (show && !module.mF) {
    const windowCue = createDefaultWindowCue({ oI: 0, lang: 'en' }); // was: As4({ oI: 0, lang: "en" })
    module.mF = [
      windowCue,
      new CaptionEvent(windowCue.start, windowCue.end - windowCue.start, 0, windowCue.id, text ?? 'Captions look like this'),
    ];
    module.player.StateFlag(module.mF); // was: Q.player.mV(Q.mF) — add cue ranges
  } else if (!show && module.mF) {
    removeCaptionCues(module, module.mF); // was: $ya(Q, Q.mF)
    module.mF = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Native Track Mode Helpers (lines 1392–1418)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Enable or disable the native `<track>` element corresponding to the
 * active caption track.
 *
 * Sets `track.mode` to "showing" or "disabled" and fires the caption
 * state reporting callback.
 *
 * [was: uvo] — Source lines 1392–1404
 *
 * @param {Object} module  [was: Q] — caption module
 * @param {boolean} enable [was: c] — true to show, false to disable
 */
export function setNativeTrackMode(module, enable) { // was: uvo
  if (!module.O) return; // no active track

  const textTracks = module.U.Yx().Ae().textTracks; // was: Q.U.Yx().Ae().textTracks
  let trackId = null;
  if (module.A === 'HLS') {
    trackId = module.O.getId(); // was: Q.O.getId()
  } else {
    trackId = module.O.toString(); // was: Q.O.toString()
  }

  for (let i = 0; i < textTracks.length; i++) {
    const nativeTrack = textTracks[i]; // was: K
    if (nativeTrack.id === trackId) {
      if (enable) {
        if (nativeTrack.mode !== 'showing') {
          nativeTrack.mode = 'showing';
          const track = module.O;
          module.q6(track, !!track, isForcedTrackActive(module) ? 'g' : module.J ? 'm' : 's');
        }
      } else {
        if (nativeTrack.mode === 'showing') {
          nativeTrack.mode = 'disabled';
        }
      }
    }
  }
}

/**
 * Check whether the currently active track is the forced/generated track.
 *
 * [was: Cy] — Source lines 1405–1408
 *
 * @param {Object} module [was: Q] — caption module
 * @returns {boolean}
 */
export function isForcedTrackActive(module) { // was: Cy
  const forced = getForcedTrack(module); // was: MC(Q)
  return !!forced && module.O === forced;
}

/**
 * Determine whether ASR (auto-generated) tracks should be included
 * in the track list.
 *
 * Returns true for HLS (never), or when conditions around external
 * controls mode, experiment flags, and the global experiment value 66
 * are met.
 *
 * [was: hBa] — Source lines 1409–1415
 *
 * @param {Object} module  [was: Q] — caption module
 * @param {boolean} forceInclude [was: c]
 * @returns {boolean}
 */
export function shouldIncludeAsrTracks(module, forceInclude) { // was: hBa
  if (module.A === 'HLS') return false;
  if (isShortsPage(module.videoData)) forceInclude = true; // was: g.oZ(Q.videoData) && (c = !0)
  if (!forceInclude) {
    forceInclude = module.A === 'TTS'
      ? false
      : module.A === 'INNERTUBE'
        ? false
        : true;
  }
  return (forceInclude || (module.FI.X('web_watch_disable_account_level_captions_settings') && isWebExact(module.FI)))
    ? true
    : !!getPlayerConfig().BA(66);
}

// ═══════════════════════════════════════════════════════════════════════
//  VSS Logging Update (lines 1485–1487)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Update the video data's VSS logging field with the active track.
 *
 * [was: py] — Source lines 1485–1487
 *
 * @param {Object} module [was: Q] — caption module
 * @param {*} track       [was: c] — active track (or undefined)
 */
export function updateVssLogging(module, track) { // was: py
  if (module.FI.X('html5_modify_caption_vss_logging')) {
    module.videoData.OJ = track;
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  Renderer Management (lines 1488–1536)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Ensure a renderer exists for the given window cue, creating one
 * if needed. If a renderer exists but references a different window
 * cue, it is disposed and replaced.
 *
 * [was: CF9] — Source lines 1488–1494
 *
 * @param {Object} module  [was: Q] — caption module
 * @param {CaptionWindowCue} windowCue [was: c]
 */
export function ensureRendererForWindow(module, windowCue) { // was: CF9
  let renderer = module.isSamsungSmartTV[windowCue.id]; // was: W
  if (renderer && renderer.O !== windowCue) {
    renderer.dispose();
    delete module.isSamsungSmartTV[windowCue.id];
    renderer = null;
  }
  if (!renderer) {
    renderer = createWindowRenderer(module, windowCue); // was: zBm(Q, c)
    if (renderer) {
      module.isSamsungSmartTV[windowCue.id] = renderer;
    }
  }
}

/**
 * Add a caption event (text cue) to its parent window's pending queue.
 *
 * [was: MyD] — Source lines 1495–1499
 *
 * @param {Object} module [was: Q] — caption module
 * @param {CaptionEvent} cue [was: c]
 */
export function addCueToWindow(module, cue) { // was: MyD
  const windowId = cue.windowId; // was: W
  if (!module.UH[windowId]) module.UH[windowId] = [];
  module.UH[windowId].push(cue);
}

/**
 * Create a caption window renderer of the appropriate type.
 *
 * The `R1` (modeHint) parameter determines the renderer class:
 *   0 (default) → CaptionWindow (pop-on)
 *   1           → PaintOnWindow
 *   2           → RollUpWindow
 *
 * Returns null if the video content rect has zero dimensions.
 *
 * [was: zBm] — Source lines 1500–1518
 *
 * @param {Object} module        [was: Q] — caption module
 * @param {CaptionWindowCue} windowCue [was: c]
 * @returns {?CaptionWindow}
 */
export function createWindowRenderer(module, windowCue) { // was: zBm
  const contentSize = getVideoContentSize(module); // was: Js1(Q)
  if (!contentSize) return null;

  // Apply RTL print direction if track language is RTL
  let langCode = module.O ? getEffectiveLanguageCode(module.O) : null;
  if (langCode && g.vPn.test(langCode)) {
    windowCue.params.oI = 1;
  }

  const playerSize = module.instreamAdPlayerOverlayRenderer.getPlayerSize();
  const containerHeight = playerSize.height * module.S.height;
  const containerWidth = playerSize.width * module.S.width;

  // In non-default player style, merge base params into window cue
  if (module.FI.playerStyle !== 'google-live' || module.K.isDefault) {
    // skip
  } else {
    Object.assign(windowCue.params, module.K);
  }

  const modeHint = windowCue.params.PLAY_ICON_CENTER != null ? windowCue.params.PLAY_ICON_CENTER : (windowCue.W.length > 1 ? 1 : 0);

  switch (modeHint) {
    case 1:
      return new RBa(windowCue, module.K, module.D, contentSize.width, contentSize.height, containerWidth, containerHeight, module.FI.experiments, module.JJ.bind(module), module.U);
    case 2:
      return new ks9(windowCue, module.K, module.D, contentSize.width, contentSize.height, containerWidth, containerHeight, module.FI.experiments, module.JJ.bind(module), module.U);
    default:
      return new cK(windowCue, module.K, module.D, contentSize.width, contentSize.height, containerWidth, containerHeight, module.FI.experiments, module.JJ.bind(module), module.U);
  }
}

/**
 * Get the effective video content size, accounting for caption insets.
 *
 * Returns `null` if the video content rect has zero dimensions.
 *
 * [was: Js1] — Source lines 1519–1530
 *
 * @param {Object} module [was: Q] — caption module
 * @returns {?{ width: number, height: number }}
 */
export function getVideoContentSize(module) { // was: Js1
  let height = module.instreamAdPlayerOverlayRenderer.getVideoContentRect(true).height;
  let width = module.instreamAdPlayerOverlayRenderer.getVideoContentRect(true).width;
  if (!height || !width) return null;
  height *= module.S.height;
  width *= module.S.width;
  return { width, height };
}

/**
 * Handle a track selection option from the UI.
 *
 * When a track option is provided, validates it against the available
 * tracks, stores the language preference, and activates the track.
 * When called without an option, returns the serialized active track.
 *
 * [was: YVa] — Source lines 1537–1564
 *
 * @param {Object} module    [was: Q] — caption module
 * @param {?Object} option   [was: c] — track selection option, or falsy for query
 * @returns {Object|string|undefined}
 */
export function handleTrackOption(module, option) { // was: YVa
  if (!module.W) return {};

  if (option) {
    if (!isEmptyObject(option)) {
      module.SQ(option.vss_id, 'm'); // was: Q.SQ(c.vss_id, "m") — report caption format info
    }

    if ((module.j && module.A !== 'HLS') || !isObject(option)) {
      return;
    }

    if (isEmptyObject(option)) {
      setActiveTrack(module, null, true); // was: QY(Q, null, !0)
      return;
    }

    let matchedTrack;
    const allTracks = getCaptionTracks(module.W.W, true); // was: W = g.H6(Q.W.W, !0)
    for (let i = 0; i < allTracks.length; i++) {
      const candidate = allTracks[i];
      if (candidate.languageCode !== option.languageCode) continue;
      if (matchedTrack && (candidate.languageName !== option.languageName || (candidate.captionId || '') !== (option.captionId || '') || formatTrackDisplayName(candidate) !== option.displayName)) continue;
      matchedTrack = option.translationLanguage
        ? createTranslatedTrack(candidate, option.translationLanguage) // was: sUa(T, c.translationLanguage)
        : candidate;
    }

    module.iz(option.position); // was: Q.iz(c.position) — update caption position

    if (!matchedTrack || (matchedTrack === module.O && module.loaded)) return;

    // Store language preference
    const langPrefs = getCaptionLanguagePreferences(); // was: c = g.Us()
    const langCode = getEffectiveLanguageCode(matchedTrack); // was: W = g.Na(m)
    if (!(langPrefs.length && langCode === langPrefs[langPrefs.length - 1])) {
      langPrefs.push(langCode);
      storageSet('yt-player-caption-language-preferences', langPrefs);
    }

    if (isLanguageStickinessEnabled(module.FI) && !module.U.isInline()) {
      storageSet('yt-player-caption-sticky-language', langCode, 2592000);
    }

    setActiveTrack(module, matchedTrack, true); // was: QY(Q, m, !0)
  } else {
    // Query mode: return serialized active track
    if (module.loaded && module.O && !isForcedTrackActive(module)) {
      return normalizeTrackMetadata(module.O); // was: g.H2(Q.O)
    }
    return {};
  }
  return '';
}

// ═══════════════════════════════════════════════════════════════════════
//  Prototype Method Patches (lines 1565–1710)
//
//  These patches extend various player infrastructure classes with
//  caption-related functionality. Each uses `g.W3(priority, fn)` to
//  register a method override at a given priority level.
// ═══════════════════════════════════════════════════════════════════════

/**
 * SegmentIndex.prototype.tN — Store a segment timing entry.
 *
 * [was: g.oy.prototype.tN] — Source lines 1565–1570
 * Priority: 65
 *
 * @param {number} segmentNumber [was: Q]
 * @param {number} n7Timestamp   [was: c] — normalized timestamp
 * @param {number} nfTimestamp   [was: W] — non-fragment timestamp
 */
// g.oy.prototype.tN = g.W3(65, function(segmentNumber, n7Timestamp, nfTimestamp) {
//   this.O.set(segmentNumber, { n7: n7Timestamp, nf: nfTimestamp });
// });

/**
 * MediaSourceEngine.prototype.tN — Delegate segment timing to SegmentIndex.
 *
 * [was: g.rX.prototype.tN] — Source lines 1571–1573
 * Priority: 64
 */
// g.rX.prototype.tN = g.W3(64, function(segmentNumber, n7Timestamp, nfTimestamp) {
//   this.S.tN(segmentNumber, n7Timestamp, nfTimestamp);
// });

/**
 * PlayerBase.prototype.S — Always returns false (no caption support at base level).
 *
 * [was: g.Ci.prototype.S] — Source lines 1574–1576
 * Priority: 63
 */
// g.Ci.prototype.S = g.W3(63, function() { return false; });

/**
 * PlayerBase.prototype.j — No-op at base level.
 *
 * [was: g.Ci.prototype.j] — Source line 1577
 * Priority: 62
 */
// g.Ci.prototype.j = g.W3(62, function() {});

/**
 * XhrCaptionFetcher.prototype.j — Fetch captions via authenticated XHR.
 *
 * Builds the request URL, sends the XHR with RAW format and
 * credentials, reports timing telemetry (capresp/capfail) when
 * the experiment flag `html5_report_captions_ctmp_qoe` is on.
 *
 * [was: g.M0.prototype.j] — Source lines 1578–1610
 * Priority: 61
 *
 * @param {Object} trackMeta    [was: Q] — track metadata
 * @param {*} formatParam       [was: c] — format parameter
 * @param {Object} callbacks    [was: W] — with `.Zn()` for data delivery
 */
export function xhrCaptionFetcherFetch(trackMeta, formatParam, callbacks) { // was: g.M0.prototype.j
  // this.u0(); — cancel previous request
  const url = this.D(trackMeta, formatParam); // was: c = this.D(Q, c)
  const reportQoe = this.ge.G().X('html5_report_captions_ctmp_qoe'); // was: m
  const startTime = g.h(); // was: K = (0, g.h)()
  this.A(); // was: this.A() — mark request pending

  initCaptionOverlay(this, url, { // was: EJo(this, c, { ... })
    format: 'RAW',
    onSuccess: (response) => { // was: T
      this.O = null;
      if (reportQoe) {
        const sizeKb = (response.responseText.length / 1024).toFixed(); // was: r
        const elapsed = g.h(); // was: U
        this.videoData.RetryTimer('capresp', { sendPostRequest: elapsed - startTime, kb: sizeKb });
      }
      const contentLength = (response.getResponseHeader && response.getResponseHeader('Content-Length'))
        ? Number(response.getResponseHeader('Content-Length'))
        : 0; // was: r (reused)
      callbacks.Zn(response.responseText, trackMeta, undefined, undefined, contentLength);
    },
    onError: reportQoe
      ? (response) => {
          this.videoData.RetryTimer('capfail', { status: response?.status ?? 0 });
        }
      : undefined,
    withCredentials: true, // was: !0
  });
}

/**
 * SimpleCaptionFetcher.prototype.j — Fetch captions via simple XHR (no QoE).
 *
 * [was: g.Jc.prototype.j] — Source lines 1611–1625
 * Priority: 60
 *
 * @param {Object} trackMeta [was: Q]
 * @param {*} formatParam    [was: c]
 * @param {Object} callbacks [was: W]
 */
export function simpleCaptionFetcherFetch(trackMeta, formatParam, callbacks) { // was: g.Jc.prototype.j
  // this.u0();
  const url = this.D(trackMeta, formatParam);
  this.A();
  this.O = sendXhrRequest(url, {
    format: 'RAW',
    onSuccess: (response) => { // was: m
      this.O = null;
      const contentLength = (response.getResponseHeader && response.getResponseHeader('Content-Length'))
        ? Number(response.getResponseHeader('Content-Length'))
        : 0; // was: K
      callbacks.Zn(response.responseText, trackMeta, undefined, undefined, contentLength);
    },
    withCredentials: true, // was: !0
  });
}

/**
 * NativeMediaElement.prototype.J — Remove all `<track>` child elements.
 *
 * [was: g.Yg.prototype.J] — Source lines 1626–1630
 * Priority: 59
 */
export function nativeMediaElementRemoveTrackElements() { // was: g.Yg.prototype.J
  const tracks = g.UZ(document, 'track', undefined, this.W); // was: g.UZ(document, "track", void 0, this.W)
  for (let i = 0; i < tracks.length; i++) {
    removeNode(tracks[i]); // was: g.FQ(Q[c]) — remove element
  }
}

/**
 * MediaElementProxy.prototype.J — Delegate to NativeMediaElement.
 *
 * [was: g.cZ.prototype.J] — Source lines 1631–1633
 * Priority: 58
 */
// g.cZ.prototype.J = g.W3(58, function() { this.mediaElement.J(); });

/**
 * NativeMediaElement.prototype.Ie — Check if text track listeners are supported.
 *
 * [was: g.Yg.prototype.Ie] — Source lines 1634–1636
 * Priority: 57
 *
 * @returns {boolean}
 */
export function nativeMediaElementSupportsTextTrackListeners() { // was: g.Yg.prototype.Ie
  return !(!this.W.textTracks || !this.W.textTracks.addEventListener);
}

/**
 * MediaElementProxy.prototype.Ie — Delegate to NativeMediaElement.
 *
 * [was: g.cZ.prototype.Ie] — Source lines 1637–1639
 * Priority: 56
 */
// g.cZ.prototype.Ie = g.W3(56, function() { return this.mediaElement.Ie(); });

/**
 * NativeMediaElement.prototype.T2 — Check if textTracks API exists.
 *
 * [was: g.Yg.prototype.T2] — Source lines 1640–1642
 * Priority: 55
 *
 * @returns {boolean}
 */
export function nativeMediaElementHasTextTracks() { // was: g.Yg.prototype.T2
  return !!this.W.textTracks;
}

/**
 * MediaElementProxy.prototype.T2 — Delegate to NativeMediaElement.
 *
 * [was: g.cZ.prototype.T2] — Source lines 1643–1645
 * Priority: 54
 */
// g.cZ.prototype.T2 = g.W3(54, function() { return this.mediaElement.T2(); });

/**
 * NativeMediaElement.prototype.mF — Append `<track>` elements to the video.
 *
 * [was: g.Yg.prototype.mF] — Source lines 1646–1649
 * Priority: 53
 *
 * @param {Array<HTMLElement>} trackElements [was: Q]
 */
export function nativeMediaElementAppendTrackElements(trackElements) { // was: g.Yg.prototype.mF
  for (let i = 0; i < trackElements.length; i++) {
    this.W.appendChild(trackElements[i]);
  }
}

/**
 * MediaElementProxy.prototype.mF — Delegate to NativeMediaElement.
 *
 * [was: g.cZ.prototype.mF] — Source lines 1650–1652
 * Priority: 52
 */
// g.cZ.prototype.mF = g.W3(52, function(trackElements) { this.mediaElement.mF(trackElements); });

/**
 * PlayerApiV1.prototype.h2 — Check if a caption namespace is active.
 *
 * [was: g.N0.prototype.h2] — Source lines 1653–1657
 * Priority: 40
 *
 * @param {string} namespace [was: Q]
 * @returns {boolean}
 */
export function playerApiV1HasNamespace(namespace) { // was: g.N0.prototype.h2
  return this.app.uX({ playerType: undefined }).h2(namespace);
}

/**
 * PlayerCore.prototype.h2 — Delegate to the module manager.
 *
 * [was: g.DX.prototype.h2] — Source lines 1658–1660
 * Priority: 39
 */
// g.DX.prototype.h2 = g.W3(39, function(namespace) { return this.EH.ag.h2(namespace); });

/**
 * ModuleManager.prototype.h2 — Check if any module uses a namespace.
 *
 * [was: g.vL.prototype.h2] — Source lines 1661–1663
 * Priority: 38
 *
 * @param {string} namespace [was: Q]
 * @returns {boolean}
 */
export function moduleManagerHasNamespace(namespace) { // was: g.vL.prototype.h2
  return this.gj().some(module => module.namespace === namespace);
}

/**
 * EmbedPlayer.prototype.h2 — Always returns false (no namespaces).
 *
 * [was: g.WM.prototype.h2] — Source lines 1664–1666
 * Priority: 37
 */
// g.WM.prototype.h2 = g.W3(37, function() { return false; });

/**
 * PlayerApiV1.prototype.SQ — Report caption format info.
 *
 * [was: g.N0.prototype.SQ] — Source lines 1667–1669
 * Priority: 35
 *
 * @param {string} vssId [was: Q]
 * @param {string} source [was: c] — "m" for manual, "s" for auto, etc.
 */
export function playerApiV1ReportCaptionFormat(vssId, source) { // was: g.N0.prototype.SQ
  this.app.oe().SQ(vssId, source);
}

/**
 * PlayerCore.prototype.SQ — Delegate to the player engine.
 *
 * [was: g.DX.prototype.SQ] — Source lines 1670–1672
 * Priority: 34
 */
// g.DX.prototype.SQ = g.W3(34, function(vssId, source) { this.EH.SQ(vssId, source); });

/**
 * QoeTracker.prototype.SQ — Report caption format info via QoE tracking.
 *
 * [was: g.ji.prototype.SQ] — Source lines 1673–1676
 * Priority: 33
 *
 * @param {string} vssId  [was: Q]
 * @param {string} source [was: c]
 */
export function qoeTrackerReportCaptionFormat(vssId, source) { // was: g.ji.prototype.SQ
  const payload = [vssId, source];
  recordTimedStat(this, getYtNow(this.provider), 'cfi', payload);
}

/**
 * PlayerStats.prototype.SQ — Delegate to QoE tracker.
 *
 * [was: g.fi.prototype.SQ] — Source lines 1677–1679
 * Priority: 32
 */
// g.fi.prototype.SQ = g.W3(32, function(vssId, source) { this.qoe && this.qoe.SQ(vssId, source); });

/**
 * PlayerStatsProxy.prototype.SQ — Delegate to inner stats.
 *
 * [was: g.Ff.prototype.SQ] — Source lines 1680–1682
 * Priority: 31
 */
// g.Ff.prototype.SQ = g.W3(31, function(vssId, source) { this.Vp.SQ(vssId, source); });

/**
 * EmbedPlayer.prototype.SQ — No-op.
 *
 * [was: g.WM.prototype.SQ] — Source line 1683
 * Priority: 30
 */
// g.WM.prototype.SQ = g.W3(30, function() {});

/**
 * PlayerApiV1.prototype.q6 — Report caption state change.
 *
 * [was: g.N0.prototype.q6] — Source lines 1684–1686
 * Priority: 29
 *
 * @param {?Object} track   [was: Q] — caption track (or null)
 * @param {boolean} enabled [was: c]
 * @param {string} trigger  [was: W] — "m" manual, "s" auto, "g" generated
 */
export function playerApiV1ReportCaptionState(track, enabled, trigger) { // was: g.N0.prototype.q6
  this.app.oe().q6(track, enabled, trigger);
}

/**
 * PlayerCore.prototype.q6 — Delegate to the player engine.
 *
 * [was: g.DX.prototype.q6] — Source lines 1687–1689
 * Priority: 28
 */
// g.DX.prototype.q6 = g.W3(28, function(track, enabled, trigger) { this.EH.q6(track, enabled, trigger); });

/**
 * QoeTracker.prototype.q6 — Report caption state change via QoE.
 *
 * Only fires when the track or enabled state actually changes.
 * Normalizes the "rawcc" trigger to an empty string.
 *
 * [was: g.ji.prototype.q6] — Source lines 1690–1697
 * Priority: 27
 *
 * @param {?Object} track   [was: Q]
 * @param {boolean} enabled [was: c]
 * @param {string} trigger  [was: W]
 */
export function qoeTrackerReportCaptionState(track, enabled, trigger) { // was: g.ji.prototype.q6
  if (this.Ka !== track || this.isInAdPlayback !== enabled) {
    const normalizedEnabled = enabled === 'rawcc' ? '' : enabled;
    const payload = [track, normalizedEnabled, this.Ka, trigger];
    recordTimedStat(this, getYtNow(this.provider), 'cfs', payload);
    this.Ka = track;
    this.isInAdPlayback = enabled;
  }
}

/**
 * PlayerStats.prototype.q6 — Delegate to QoE tracker.
 *
 * [was: g.fi.prototype.q6] — Source lines 1698–1700
 * Priority: 26
 */
// g.fi.prototype.q6 = g.W3(26, function(track, enabled, trigger) { this.qoe && this.qoe.q6(track, enabled, trigger); });

/**
 * PlayerStatsProxy.prototype.q6 — Delegate to inner stats.
 *
 * [was: g.Ff.prototype.q6] — Source lines 1701–1703
 * Priority: 25
 */
// g.Ff.prototype.q6 = g.W3(25, function(track, enabled, trigger) { this.Vp.q6(track, enabled, trigger); });

/**
 * EmbedPlayer.prototype.q6 — No-op.
 *
 * [was: g.WM.prototype.q6] — Source line 1704
 * Priority: 24
 */
// g.WM.prototype.q6 = g.W3(24, function() {});

/**
 * CaptionTrackList.prototype.NN — Get the number of children for a track.
 *
 * [was: g.X4.prototype.NN] — Source lines 1705–1707
 * Priority: 3
 *
 * @param {*} trackKey [was: Q]
 * @returns {number}
 */
export function captionTrackListGetChildCount(trackKey) { // was: g.X4.prototype.NN
  const track = this.A(trackKey); // was: Q = this.A(Q)
  return track ? track.W : 0;
}

/**
 * EmptyTrackList.prototype.NN — Always returns 0.
 *
 * [was: g.ei.prototype.NN] — Source lines 1708–1710
 * Priority: 2
 */
// g.ei.prototype.NN = g.W3(2, function() { return 0; });

// ═══════════════════════════════════════════════════════════════════════
//  Prototype Patch Registration
//
//  The original code applies these as:
//    g.<Class>.prototype.<method> = g.W3(<priority>, function(...) { ... });
//
//  In the deobfuscated module system, these would be applied during
//  module initialization. The exported functions above serve as the
//  implementations; the commented-out lines show the original
//  registration pattern.
//
//  Registration table (source lines 1565–1710):
//
//  | Priority | Class              | Method | Deobfuscated export                           |
//  |----------|--------------------|--------|-----------------------------------------------|
//  | 65       | g.oy (SegmentIndex)| tN     | (inline — stores { n7, nf } in .O map)        |
//  | 64       | g.rX (MSE)         | tN     | delegates to this.S.tN(...)                   |
//  | 63       | g.Ci (PlayerBase)  | S      | () => false                                   |
//  | 62       | g.Ci (PlayerBase)  | j      | () => {} (no-op)                              |
//  | 61       | g.M0 (XhrFetcher)  | j      | xhrCaptionFetcherFetch                        |
//  | 60       | g.Jc (SimpleFetch) | j      | simpleCaptionFetcherFetch                     |
//  | 59       | g.Yg (NativeMedia) | J      | nativeMediaElementRemoveTrackElements         |
//  | 58       | g.cZ (MediaProxy)  | J      | delegates to this.mediaElement.J()            |
//  | 57       | g.Yg (NativeMedia) | Ie     | nativeMediaElementSupportsTextTrackListeners  |
//  | 56       | g.cZ (MediaProxy)  | Ie     | delegates to this.mediaElement.Ie()           |
//  | 55       | g.Yg (NativeMedia) | T2     | nativeMediaElementHasTextTracks               |
//  | 54       | g.cZ (MediaProxy)  | T2     | delegates to this.mediaElement.T2()           |
//  | 53       | g.Yg (NativeMedia) | mF     | nativeMediaElementAppendTrackElements         |
//  | 52       | g.cZ (MediaProxy)  | mF     | delegates to this.mediaElement.mF(...)        |
//  | 40       | g.N0 (PlayerApiV1) | h2     | playerApiV1HasNamespace                       |
//  | 39       | g.DX (PlayerCore)  | h2     | delegates to this.EH.ag.h2(...)               |
//  | 38       | g.vL (ModuleMgr)   | h2     | moduleManagerHasNamespace                     |
//  | 37       | g.WM (EmbedPlayer) | h2     | () => false                                   |
//  | 35       | g.N0 (PlayerApiV1) | SQ     | playerApiV1ReportCaptionFormat                |
//  | 34       | g.DX (PlayerCore)  | SQ     | delegates to this.EH.SQ(...)                  |
//  | 33       | g.ji (QoeTracker)  | SQ     | qoeTrackerReportCaptionFormat                 |
//  | 32       | g.fi (PlayerStats) | SQ     | delegates to this.qoe.SQ(...)                 |
//  | 31       | g.Ff (StatsProxy)  | SQ     | delegates to this.Vp.SQ(...)                  |
//  | 30       | g.WM (EmbedPlayer) | SQ     | () => {} (no-op)                              |
//  | 29       | g.N0 (PlayerApiV1) | q6     | playerApiV1ReportCaptionState                 |
//  | 28       | g.DX (PlayerCore)  | q6     | delegates to this.EH.q6(...)                  |
//  | 27       | g.ji (QoeTracker)  | q6     | qoeTrackerReportCaptionState                  |
//  | 26       | g.fi (PlayerStats) | q6     | delegates to this.qoe.q6(...)                 |
//  | 25       | g.Ff (StatsProxy)  | q6     | delegates to this.Vp.q6(...)                  |
//  | 24       | g.WM (EmbedPlayer) | q6     | () => {} (no-op)                              |
//  | 3        | g.X4 (TrackList)   | NN     | captionTrackListGetChildCount                 |
//  | 2        | g.ei (EmptyList)   | NN     | () => 0                                       |
// ═══════════════════════════════════════════════════════════════════════
