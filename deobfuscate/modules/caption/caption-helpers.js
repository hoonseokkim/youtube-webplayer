/**
 * Caption Helpers -- Utility functions bridging caption data management,
 * track lookup/listing, CEA-608 closed-caption parsing, and live caption
 * segment fetching.
 *
 * Source: player_es6.vflset/en_US/caption.js, lines 68--774
 *
 * Contents (in source order):
 *   - addSegmentToSet:            lines 68--74   [was: O3o]
 *   - isCaptionExpired:           lines 75--77   [was: fYi]
 *   - fetchCaptionSegment:        lines 78--149  [was: vJ0]
 *   - getTrackById:               lines 150--152 [was: aYD]
 *   - findTrackByLanguage:        lines 153--165 [was: G01]
 *   - listAvailableTracks:        lines 166--208 [was: P6a]
 *   - classifyCea608BytePair:     lines 404--435 [was: k01]
 *   - processCea608DataPair:      lines 436--441 [was: pWo]
 *   - flushCea608EventQueue:      lines 442--452 [was: Q6a]
 *   - lookupCea608Character:      lines 453--465 [was: TDS]
 *   - readScreenContent:          lines 466--520 [was: yX]
 *   - getCurrentCell:             lines 521--523 [was: SO]
 *   - writeCharacterToScreen:     lines 524--531 [was: F8]
 *   - copyScreenRows:            lines 532--540 [was: oH9]
 *   - clearScreenRows:           lines 541--545 [was: ZG]
 *   - eraseScreenAndReset:       lines 546--550 [was: Er]
 *   - resumeCaptionLoading:      lines 551--557 [was: rsv]
 *   - switchToRollUpMode:        lines 558--579 [was: sr]
 *   - switchToTextMode:          lines 580--585 [was: Uya]
 *   - processCea608BytePairFull: lines 586--774 [was: Yg1]
 *
 * Lines 209--403 (rendering helpers: lYi, umm, h1D, z1m, i9, JCi, C64, MWv)
 * are covered in caption-renderer.js.
 */

import { deepEquals } from '../../data/gel-core.js';  // was: g.KL
import { currentCell } from './caption-internals.js';  // was: g.SO
import { sendPostRequest } from '../../network/request.js'; // was: ms
import { RetryTimer } from '../../media/grpc-parser.js'; // was: tJ
import { getCurrentTime } from '../../player/time-tracking.js';
import { serialize } from '../../proto/protobuf-writer.js';
import { clear, binarySearch } from '../../core/array-utils.js';

// ======================================================================
// addSegmentToSet -- Insert a segment index into an ordered interval set.
// [was: O3o] -- Source lines 68--74
// ======================================================================

/**
 * Add segment index `segmentIndex` to the interval set on `segmentSet`.
 * The set stores sorted [start, end] boundary pairs in a flat array.
 * Adjacent indices are merged into contiguous intervals.
 *
 * @param {Object} segmentSet [was: Q] -- has `.segments` (number[])
 * @param {number} segmentIndex [was: c]
 */
export function addSegmentToSet(segmentSet, segmentIndex) { // was: O3o
  let pos = binarySearch(segmentSet.segments, segmentIndex); // was: g.H9
  if (pos >= 0) return; // already present
  if (pos < 0 && (-pos - 1) % 2 === 1) return; // inside an existing interval

  pos = -pos - 1;

  const canMergeLeft = pos > 0 && segmentIndex - segmentSet.segments[pos - 1] === 1;
  const canMergeRight = pos < segmentSet.segments.length && segmentSet.segments[pos] - segmentIndex === 1;

  if (canMergeLeft && canMergeRight) {
    // Bridges two adjacent intervals -- remove the shared boundaries
    spliceArray(segmentSet.segments, pos);    // was: g.Ta
    spliceArray(segmentSet.segments, pos - 1); // was: g.Ta
  } else if (canMergeLeft) {
    // Extend the left interval's upper bound
    segmentSet.segments[pos - 1] = segmentIndex;
  } else if (canMergeRight) {
    // Extend the right interval's lower bound
    segmentSet.segments[pos] = segmentIndex;
  } else {
    // Insert a new single-element interval [segmentIndex, segmentIndex]
    spliceArray(segmentSet.segments, pos, 0, segmentIndex);     // was: g.q9
    spliceArray(segmentSet.segments, pos + 1, 0, segmentIndex); // was: g.q9
  }
}

// ======================================================================
// isCaptionExpired -- Check if the current caption data has expired.
// [was: fYi] -- Source lines 75--77
// ======================================================================

/**
 * Returns `true` when the caption module's current window (`Q.W`) has
 * a duration (`K`) that, added to the player's time offset (`NQ()`),
 * is less than the player's current playback time.
 *
 * @param {Object} module [was: Q] -- caption module instance
 * @returns {boolean}
 */
export function isCaptionExpired(module) { // was: fYi
  return module.captionWindow && module.captionWindow.duration // was: Q.W && Q.W.K
    ? module.captionWindow.duration + module.player.getTimeOffset() < module.player.getCurrentTime() // was: Q.W.K + Q.player.NQ() < Q.player.getCurrentTime()
    : false;
}

// ======================================================================
// fetchCaptionSegment -- Fetch a caption segment over the network.
// [was: vJ0] -- Source lines 78--149
// ======================================================================

/**
 * Build a URL from the segment descriptor `segment`, issue an XHR with
 * retry logic, and feed the response into the caption module's data
 * pipeline.  Handles POST mode (when `policy.Ka` is set), proof-of-
 * token insertion (`policy.q$`), arraybuffer responses (`module.K`),
 * redirect chains, and telemetry logging.
 *
 * @param {Object} module [was: Q] -- caption module instance
 * @param {Object} segment [was: c] -- segment descriptor with `.eh`, `.j`, etc.
 */
export function fetchCaptionSegment(module, segment) { // was: vJ0
  let url;
  if (module.policy.requiresProofOfToken && module.player.getProofOfToken()) { // was: Q.policy.q$ && Q.player.tp()
    const builder = buildUrl(segment, module.policy, {}); // was: g.Pd
    builder.set('pot', module.player.getProofOfToken()); // was: Q.player.tp()
    url = builder.serialize(); // was: W.Lk()
  } else {
    url = buildUrl(segment, module.policy, {}).serialize(); // was: g.Pd(c, Q.policy, {}).Lk()
  }

  const fetchOptions = {
    format: 'RAW',
    withCredentials: true, // was: !0
  };

  if (module.policy.usePost) { // was: Q.policy.Ka
    fetchOptions.method = 'POST';
    const postData = segment.postBody; // was: c.j
    if (postData && Object.keys(postData).length > 0) {
      fetchOptions.postBody = serializeToBytes(postData, encodeString); // was: g.yu(r, g.yc)
    } else {
      fetchOptions.postBody = serializeToBytes([120, 0]); // was: (0, g.t6)([120, 0])
    }
  }

  if (module.useArrayBuffer) { // was: Q.K
    fetchOptions.responseType = 'arraybuffer';
  }

  let requestNumber = ++module.requestCounter; // was: K = ++Q.b0
  const startTimestamp = now(); // was: (0, g.h)()

  module.pendingRequest = fetchWithRetry(url, fetchOptions, 3, 100, -1, (error) => { // was: g.o2
    if (error.NetworkErrorCode === 'net.timeout') {
      module.player.logTelemetry('capnt', { rn: requestNumber++ }); // was: Q.player.tJ("capnt", ...)
    }
  }).then((response) => {
    if (module.policy.enableResponseLogging && requestNumber % 100 === 1) { // was: Q.policy.W0
      const elapsed = now(); // was: (0, g.h)()
      module.player.logTelemetry('caprsp', {
        rn: requestNumber,
        sendPostRequest: elapsed - startTimestamp,
        kb: (response.xhr.responseText.length / 1024).toFixed(),
      });
    }

    handleFetchResponse: {
      const xhr = response.xhr; // was: r = r.xhr
      module.clearRetryTimer(); // was: Q.u0()

      if (module.nextSegment) { // was: Q.A
        const isEmpty = !(module.useArrayBuffer ? xhr.response : xhr.responseText) || xhr.status >= 400; // was: I
        const redirectUrl = getRedirectUrl(xhr); // was: g.oh7(r)

        if (redirectUrl) {
          const redirectBuilder = buildUrl(module.nextSegment, module.policy, {}); // was: g.Pd(Q.A, Q.policy, {})
          module.nextSegment.applyRedirect(redirectBuilder, redirectUrl); // was: Q.A.jZ(r, U)
          fetchCaptionSegment(module, module.nextSegment); // was: vJ0(Q, Q.A)
          break handleFetchResponse;
        }

        if (isEmpty) {
          module.player.logTelemetry('capfail', { status: xhr.status }); // was: Q.player.tJ("capfail", ...)
        } else {
          logEvent('fcb_r', now(), module.player.getVideoData()?.videoId || ''); // was: g.N5("fcb_r", ...)
          const firstEntry = module.nextSegment.entries[0]; // was: U = Q.A.eh[0]
          const entryId = firstEntry.segmentFormatId; // was: I = U.DF

          if (module.dataCallback != null && module.lastProcessedId !== entryId) { // was: Q.L != null && Q.D !== I
            if (module.useArrayBuffer) {
              module.dataCallback(xhr.response, (firstEntry.startTime + module.player.getTimeOffset()) * 1E3); // was: Q.L(r.response, ...)
            } else {
              module.dataCallback(xhr.responseText, (firstEntry.startTime + module.player.getTimeOffset()) * 1E3); // was: Q.L(r.responseText, ...)
            }
            module.lastProcessedId = entryId; // was: Q.D = I
          }
        }
      }

      module.nextSegment = null; // was: Q.A = null
      module.pendingRequest = null; // was: Q.O = null
    }
  }).catch((error) => { // was: .fF(r => { ... })
    module.nextSegment = null; // was: Q.A = null
    module.pendingRequest = null; // was: Q.O = null
    module.player.logTelemetry('capfail', {
      rn: requestNumber,
      status: error.xhr?.status,
    });
  });

  module.nextSegment = segment; // was: Q.A = c
  addSegmentToSet(module.segmentSet, module.nextSegment.entries[0].segmentFormatId); // was: O3o(Q.j, Q.A.eh[0].DF)
}

// ======================================================================
// getTrackById -- Look up a track in the module's track map by its ID.
// [was: aYD] -- Source lines 150--152
// ======================================================================

/**
 * @param {Object} module [was: Q] -- caption module with `.O.W` track map
 * @param {string|null} trackId [was: c]
 * @returns {Object|null} the track object, or null
 */
export function getTrackById(module, trackId) { // was: aYD
  return trackId != null && trackId in module.trackManager.tracks // was: Q.O.W
    ? module.trackManager.tracks[trackId]
    : null;
}

// ======================================================================
// findTrackByLanguage -- Find a track matching a given language code.
// [was: G01] -- Source lines 153--165
// ======================================================================

/**
 * Search the module's track map for the first track whose language code
 * matches `languageCode`.  An optional `filter` parameter restricts
 * results via `deepEquals`.
 *
 * @param {Object} module [was: Q] -- caption module
 * @param {string} languageCode [was: c]
 * @param {*} [filter] [was: W] -- passed to g.l2 for filtering
 * @returns {Object|null}
 */
export function findTrackByLanguage(module, languageCode, filter) { // was: G01
  const matches = [];
  for (const id in module.trackManager.tracks) { // was: Q.O.W
    if (!module.trackManager.tracks.hasOwnProperty(id)) continue;
    const track = module.trackManager.tracks[id];
    if (deepEquals(track, filter || null)) { // was: g.l2(T, W || null)
      const captionTrack = track.info.captionTrack; // was: T.info.captionTrack
      if (captionTrack && captionTrack.languageCode === languageCode) {
        matches.push(track);
      }
    }
  }
  return matches.length ? matches[0] : null;
}

// ======================================================================
// listAvailableTracks -- Build an array of CaptionTrack for all tracks.
// [was: P6a] -- Source lines 166--208
// ======================================================================

/**
 * Iterate the module's track map and construct a `CaptionTrack` descriptor
 * for each entry that passes the optional filter.  For tracks without an
 * explicit `captionTrack` descriptor, the language name is resolved from
 * the `LANGUAGE_NAMES` table (with caching in `languageNameCache`).
 *
 * @param {Object} module [was: Q] -- caption module
 * @param {*} [filter] [was: c] -- optional filter for g.l2 matching
 * @returns {CaptionTrack[]}
 */
export function listAvailableTracks(module, filter) { // was: P6a
  const result = []; // was: W

  for (const id in module.trackManager.tracks) { // was: Q.O.W
    if (!module.trackManager.tracks.hasOwnProperty(id)) continue;

    let track = module.trackManager.tracks[id]; // was: m
    if (!deepEquals(track, filter || null)) continue; // was: g.l2(m, c || null)

    let languageCode = track.info.id; // was: T
    let displayName = languageCode; // was: r
    let vssId = `.${languageCode}`; // was: U
    let kind = ''; // was: I
    let captionId = ''; // was: X

    const captionTrack = track.info.captionTrack; // was: m = m.info.captionTrack
    if (captionTrack) {
      languageCode = captionTrack.languageCode; // was: T = m.languageCode
      displayName = captionTrack.displayName; // was: r = m.displayName
      vssId = captionTrack.vssId; // was: U = m.vssId
      kind = captionTrack.kind; // was: I = m.kind
      captionId = captionTrack.id; // was: X = m.id
    } else {
      // Resolve display name from language name lookup table
      let resolvedName = languageNameCache.get(languageCode); // was: g.NTm.get(m)
      if (resolvedName == null) {
        resolvedName = LANGUAGE_NAMES[languageCode] // was: $S0[m]
          || LANGUAGE_NAMES[languageCode.replace(/-/g, '_')]; // was: $S0[m.replace(/-/g, "_")]
        languageNameCache.set(languageCode, resolvedName); // was: g.NTm.set(m, A)
      }
      displayName = resolvedName || displayName; // was: r = m || r
    }

    result.push(new CaptionTrack({
      id,
      languageCode,
      languageName: displayName,
      is_servable: true,    // was: !0
      is_default: true,     // was: !0
      is_translateable: false, // was: !1
      vss_id: vssId,
      kind,
      captionId,
    }));
  }

  return result;
}

// ======================================================================
//
// CEA-608 Closed Caption Parsing Helpers
//
// The following functions implement the state machine and data
// structures for decoding EIA/CEA-608 closed captions embedded in
// NTSC video signals.  They operate on a virtual 15-row x 32-column
// character screen, processing byte pairs into displayable text.
//
// ======================================================================

// ======================================================================
// classifyCea608BytePair -- Classify a CEA-608 control/data byte pair.
// [was: k01] -- Source lines 404--435
// ======================================================================

/**
 * Apply the CEA-608 parity-strip table (`R19`) to both bytes and
 * determine whether the pair represents a null pair (result 0),
 * a duplicate control code (result 1), a mid-row/extended character
 * code (result 2), or printable/control data (result 3).
 *
 * @param {number} byte1 [was: Q] -- first byte of the pair
 * @param {number} byte2 [was: c] -- second byte of the pair
 * @param {Object} controlState [was: W] -- tracks previous control codes
 *   with `.Xq()` (isControlPending) and `.CY` (last second byte)
 * @returns {{ highByte: number, lowByte: number, result: number }}
 *   [was: { JD, CY, result }]
 */
export function classifyCea608BytePair(byte1, byte2, controlState) { // was: k01
  // Null pair -- both are padding
  if (byte1 === 255 && byte2 === 255 || !byte1 && !byte2) {
    return { highByte: byte1, lowByte: byte2, result: 0 }; // was: { JD: Q, CY: c, result: 0 }
  }

  byte1 = CEA608_PARITY_TABLE[byte1]; // was: R19[Q]
  byte2 = CEA608_PARITY_TABLE[byte2]; // was: R19[c]

  if (byte1 & 128) {
    // byte1 has high bit set -- check for duplicate control code
    let isDuplicate;
    if (isDuplicate = !(byte2 & 128)) { // was: m = !(c & 128)
      isDuplicate = controlState.isControlPending() && controlState.lastLowByte === byte2; // was: W.Xq() && W.CY === m
    }
    if (isDuplicate) {
      return { highByte: byte1, lowByte: byte2, result: 1 }; // was: { JD: Q, CY: c, result: 1 }
    }
  } else if (byte2 & 128 && 1 <= byte1 && byte1 <= 31) {
    // byte2 has high bit, byte1 is a control code range
    return { highByte: byte1, lowByte: byte2, result: 2 }; // was: { JD: Q, CY: c, result: 2 }
  }

  return { highByte: byte1, lowByte: byte2, result: 3 }; // was: { JD: Q, CY: c, result: 3 }
}

// ======================================================================
// processCea608DataPair -- Handle a raw CEA-608 data pair for channel 1.
// [was: pWo] -- Source lines 436--441
// ======================================================================

/**
 * Process a raw byte pair into the primary CEA-608 channel (`channel1`).
 * A null pair (both 255 or both 0) increments the null counter and resets
 * after 45 consecutive nulls.  Otherwise, delegates to
 * `processCea608BytePairFull`.
 *
 * @param {Object} decoder [was: Q] -- CEA-608 decoder state
 *   `.nullCount` [was: A], `.channel1` [was: j], `.channel2` [was: K]
 * @param {number} byte1 [was: c]
 * @param {number} byte2 [was: W]
 * @param {Object} outputCallback [was: m] -- receives decoded captions
 */
export function processCea608DataPair(decoder, byte1, byte2, outputCallback) { // was: pWo
  if (byte1 === 255 && byte2 === 255 || !byte1 && !byte2) {
    if (++decoder.nullCount === 45) decoder.reset(); // was: ++Q.A === 45 && Q.reset()
    decoder.channel1.controlState.clear(); // was: Q.j.O.clear()
    decoder.channel2.controlState.clear(); // was: Q.K.O.clear()
  } else {
    decoder.nullCount = 0; // was: Q.A = 0
    processCea608BytePairFull(decoder.channel1, byte1, byte2, outputCallback); // was: Yg1(Q.j, c, W, m)
  }
}

// ======================================================================
// flushCea608EventQueue -- Sort and process buffered CEA-608 events.
// [was: Q6a] -- Source lines 442--452
// ======================================================================

/**
 * Sort the decoder's pending event queue by time (then order), then
 * process each event.  Type-0 events go to `processCea608DataPair`;
 * type-1 events go to channel 2 when the mode flags indicate it.
 *
 * @param {Object} decoder [was: Q] -- CEA-608 decoder
 *   `.pendingEvents` [was: W], `.time`, `.modeFlags` [was: O]
 * @param {Object} outputCallback [was: c]
 */
export function flushCea608EventQueue(decoder, outputCallback) { // was: Q6a
  decoder.pendingEvents.sort((a, b) => { // was: Q.W.sort(...)
    const timeDiff = a.time - b.time;
    return timeDiff === 0 ? a.order - b.order : timeDiff;
  });

  for (const event of decoder.pendingEvents) { // was: for (const W of Q.W)
    decoder.time = event.time;
    if (event.type === 0) {
      processCea608DataPair(decoder, event.highByte, event.lowByte, outputCallback); // was: pWo(Q, W.gZ, W.H2, c)
    } else if (event.type === 1 && decoder.modeFlags & 496) { // was: Q.O & 496
      processCea608BytePairFull(decoder.channel2, event.highByte, event.lowByte, outputCallback); // was: Yg1(Q.K, W.gZ, W.H2, c)
    }
  }

  decoder.pendingEvents.length = 0; // was: Q.W.length = 0
}

// ======================================================================
// lookupCea608Character -- Map a character set + byte to a Unicode code point.
// [was: TDS] -- Source lines 453--465
// ======================================================================

/**
 * Look up the Unicode code point for a character in one of the four
 * CEA-608 character sets:
 *   0 = Basic North American (csZ)
 *   1 = Special North American (W44)
 *   2 = Spanish/French extended (myo)
 *   3 = Portuguese/German extended (K4H)
 *
 * @param {number} charSet [was: Q] -- character set index (0--3)
 * @param {number} charByte [was: c] -- the raw byte value
 * @returns {number} Unicode code point, or 0 if not found
 */
export function lookupCea608Character(charSet, charByte) { // was: TDS
  switch (charSet) {
    case 0:
      return CEA608_BASIC_CHARS[(charByte & 127) - 32]; // was: csZ[(c & 127) - 32]
    case 1:
      return CEA608_SPECIAL_CHARS[charByte & 15]; // was: W44[c & 15]
    case 2:
      return CEA608_EXTENDED_SPANISH[charByte & 31]; // was: myo[c & 31]
    case 3:
      return CEA608_EXTENDED_PORTUGUESE[charByte & 31]; // was: K4H[c & 31]
  }
  return 0;
}

// ======================================================================
// readScreenContent -- Extract text from a CEA-608 screen buffer.
// [was: yX] -- Source lines 466--520
// ======================================================================

/**
 * Walk the 15x32 character grid and extract all non-empty text,
 * tracking the earliest timestamp for each line.  In paint-on mode
 * (style type 3), characters are read but NOT cleared from the grid.
 * In other modes, each cell is reset after reading.
 *
 * @param {Object} screen [was: Q] -- screen buffer with `.A` (grid),
 *   `.K` (timing), `.style` (display style)
 * @param {Object} outputCallback [was: c] -- has `.j(row, col, startTime, endTime, text)` method
 */
export function readScreenContent(screen, outputCallback) { // was: yX
  if (screen.style.type === 3) {
    // Paint-on mode: read without clearing
    let firstRow = 0; // was: W
    let firstCol = 0; // was: m
    let earliestTimestamp = screen.timing.time + 0; // was: K = Q.K.time + 0
    let textBuffer = ''; // was: T
    let pendingNewline = ''; // was: r
    const currentTime = earliestTimestamp; // was: U = K

    for (let row = 1; row <= 15; ++row) { // was: I
      let hasContent = false; // was: X
      for (let col = firstCol ? firstCol : 1; col <= 32; ++col) { // was: A = m ? m : 1
        const cell = screen.grid[row][col]; // was: Q.A[I][A]
        if (cell.charCode !== 0) { // was: e.W !== 0
          if (firstRow === 0) {
            firstRow = row;
            firstCol = col;
          }
          const charStr = String.fromCharCode(cell.charCode); // was: String.fromCharCode(e.W)
          const cellTimestamp = cell.timestamp; // was: V = e.timestamp
          if (cellTimestamp < earliestTimestamp) earliestTimestamp = cellTimestamp; // was: V < K && (K = V)
          cell.timestamp = currentTime; // was: e.timestamp = U
          if (pendingNewline) {
            textBuffer += pendingNewline;
            pendingNewline = '';
          }
          textBuffer += charStr;
          hasContent = true;
        }
        if ((cell.charCode === 0 || col === 32) && hasContent) {
          pendingNewline = '\n';
          break;
        } else if (firstCol && !hasContent) {
          break;
        }
      }
      if (firstRow && !hasContent) break;
    }

    if (textBuffer) {
      outputCallback.emit(firstRow, firstCol, earliestTimestamp, currentTime, textBuffer); // was: c.j(W, m, K, U, T)
    }
  } else {
    // Pop-on / roll-up mode: read and clear
    let firstCol = 0; // was: m
    let firstRow = 0; // was: W
    let earliestTimestamp = screen.timing.time + 0; // was: K
    const currentTime = earliestTimestamp; // was: T = K

    for (let row = 1; row <= 15; ++row) { // was: r
      let lineText = ''; // was: U
      for (let col = 1; col <= 32; ++col) { // was: I
        const cell = screen.grid[row][col]; // was: A = Q.A[r][I]
        const charCode = cell.charCode; // was: e = A.W

        if (charCode !== 0) {
          if (firstRow === 0) {
            firstRow = row;
            firstCol = col;
          }
          const charStr = String.fromCharCode(charCode); // was: X = String.fromCharCode(e)
          const cellTimestamp = cell.timestamp; // was: V = A.timestamp
          if (cellTimestamp <= earliestTimestamp) earliestTimestamp = cellTimestamp; // was: V <= K && (K = V)
          lineText += charStr;
          cell.reset(); // was: A.reset()
        }

        if (col === 32 || charCode === 0) {
          if (lineText) {
            outputCallback.emit(firstRow, firstCol, earliestTimestamp, currentTime, lineText); // was: c.j(W, m, K, T, U)
          }
          earliestTimestamp = currentTime;
          lineText = '';
          firstCol = 0;
          firstRow = 0;
        }
      }
    }
  }
}

// ======================================================================
// getCurrentCell -- Get the cell at the cursor's current position.
// [was: SO] -- Source lines 521--523
// ======================================================================

/**
 * @param {Object} screen [was: Q] -- screen buffer with `.grid` [was: A],
 *   `.row`, and `.cursorCol` [was: O]
 * @returns {Object} the cell object at the current cursor position
 */
export function getCurrentCell(screen) { // was: SO
  return screen.grid[screen.row][screen.cursorCol]; // was: Q.A[Q.row][Q.O]
}

// ======================================================================
// writeCharacterToScreen -- Write a character to the screen at the cursor.
// [was: F8] -- Source lines 524--531
// ======================================================================

/**
 * Write a character (looked up from the given character set) to the
 * current cursor position.  For extended character sets (charSet >= 2),
 * the previous character is first erased (backspace behavior per spec).
 *
 * @param {Object} screen [was: Q]
 * @param {number} charSet [was: c] -- character set index (0--3)
 * @param {number} charByte [was: W] -- raw byte value
 */
export function writeCharacterToScreen(screen, charSet, charByte) { // was: F8
  // Extended characters replace the previous character (backspace)
  if (charSet >= 2 && screen.cursorCol > 1) {
    --screen.cursorCol; // was: --Q.O
    getCurrentCell(screen).charCode = 0; // was: SO(Q).W = 0
  }

  const cell = getCurrentCell(screen); // was: m = SO(Q)
  cell.timestamp = screen.timing.time + 0; // was: m.timestamp = Q.K.time + 0
  cell.charCode = lookupCea608Character(charSet, charByte); // was: m.W = TDS(c, W)

  if (screen.cursorCol < 32) screen.cursorCol++; // was: Q.O < 32 && Q.O++
}

// ======================================================================
// copyScreenRows -- Copy a block of rows from one position to another.
// [was: oH9] -- Source lines 532--540
// ======================================================================

/**
 * Copy `count` rows starting at `srcRow` to `destRow`, cell by cell.
 *
 * @param {Object} screen [was: Q] -- screen buffer
 * @param {number} destRow [was: c]
 * @param {number} srcRow [was: W]
 * @param {number} count [was: m] -- number of rows to copy
 */
export function copyScreenRows(screen, destRow, srcRow, count) { // was: oH9
  for (let r = 0; r < count; r++) {
    for (let col = 0; col <= 32; col++) {
      const dest = screen.grid[destRow + r][col]; // was: K = Q.A[c + r][U]
      const src = screen.grid[srcRow + r][col]; // was: T = Q.A[W + r][U]
      dest.charCode = src.charCode; // was: K.W = T.W
      dest.timestamp = src.timestamp; // was: K.timestamp = T.timestamp
    }
  }
}

// ======================================================================
// clearScreenRows -- Clear (reset) a block of rows on the screen.
// [was: ZG] -- Source lines 541--545
// ======================================================================

/**
 * Reset all cells in `count` rows starting at `startRow`.
 *
 * @param {Object} screen [was: Q] -- screen buffer
 * @param {number} startRow [was: c]
 * @param {number} count [was: W] -- number of rows to clear
 */
export function clearScreenRows(screen, startRow, count) { // was: ZG
  for (let r = 0; r < count; r++) {
    for (let col = 0; col <= 32; col++) {
      screen.grid[startRow + r][col].reset(); // was: Q.A[c + m][K].reset()
    }
  }
}

// ======================================================================
// eraseScreenAndReset -- Erase the entire screen and reset cursor.
// [was: Er] -- Source lines 546--550
// ======================================================================

/**
 * Set the cursor row to the base row (minimum 1) and column to 1,
 * then clear all 15 rows.
 *
 * @param {Object} screen [was: Q] -- screen buffer with `.baseRow` [was: W]
 */
export function eraseScreenAndReset(screen) { // was: Er
  screen.row = screen.baseRow > 0 ? screen.baseRow : 1; // was: Q.row = Q.W > 0 ? Q.W : 1
  screen.cursorCol = 1; // was: Q.O = 1
  clearScreenRows(screen, 0, 15); // was: ZG(Q, 0, 15)
}

// ======================================================================
// resumeCaptionLoading -- Resume caption loading (pop-on mode init).
// [was: rsv] -- Source lines 551--557
// ======================================================================

/**
 * Set the display style to pop-on (1), assign the non-displayed buffer
 * as the active write target, reset its base row, attach the current
 * style, and update the channel's mode flags.
 *
 * @param {Object} channel [was: Q] -- CEA-608 channel state
 *   `.style` (mode tracker), `.nonDisplayedBuffer` [was: j],
 *   `.activeBuffer` [was: W], `.modeState` [was: A]
 */
export function resumeCaptionLoading(channel) { // was: rsv
  channel.style.set(1); // was: Q.style.set(1)
  channel.activeBuffer = channel.nonDisplayedBuffer; // was: Q.W = Q.j
  channel.activeBuffer.baseRow = 0; // was: Q.W.W = 0
  channel.activeBuffer.style = channel.style; // was: Q.W.style = Q.style
  channel.modeState.mode = 1 << channel.activeBuffer.channelIndex; // was: Q.A.mode = 1 << Q.W.j
}

// ======================================================================
// switchToRollUpMode -- Switch to roll-up caption mode.
// [was: sr] -- Source lines 558--579
// ======================================================================

/**
 * Transition the channel to roll-up mode (style 3) with the given
 * number of visible rows.  If already in pop-on or a different state,
 * the displayed buffer is flushed first.
 *
 * @param {Object} channel [was: Q] -- CEA-608 channel state
 * @param {number} visibleRows [was: c] -- number of visible rows (2, 3, or 4)
 * @param {Object} outputCallback [was: W] -- receives decoded captions
 */
export function switchToRollUpMode(channel, visibleRows, outputCallback) { // was: sr
  const displayedBuffer = channel.displayedBuffer; // was: m = Q.O
  let needsInit = false; // was: K

  switch (channel.style.get()) {
    case 4: // text mode
    case 1: // pop-on
    case 2: // paint-on
      if (channel.style.get() === 4 && displayedBuffer.baseRow > 0) break; // was: Q.style.get() === 4 && m.W > 0
      readScreenContent(displayedBuffer, outputCallback); // was: yX(m, W)
      eraseScreenAndReset(channel.displayedBuffer); // was: Er(Q.O)
      eraseScreenAndReset(channel.nonDisplayedBuffer); // was: Er(Q.j)
      displayedBuffer.row = 15; // was: m.row = 15
      displayedBuffer.baseRow = visibleRows; // was: m.W = c
      needsInit = true; // was: K = !0
      break;
  }

  channel.style.set(3); // was: Q.style.set(3)
  channel.activeBuffer = displayedBuffer; // was: Q.W = m
  channel.activeBuffer.style = channel.style; // was: Q.W.style = Q.style
  channel.modeState.mode = 1 << displayedBuffer.channelIndex; // was: Q.A.mode = 1 << m.j

  if (needsInit) {
    displayedBuffer.cursorCol = 1; // was: m.O = 1
  } else if (displayedBuffer.baseRow !== visibleRows) { // was: m.W !== c
    if (displayedBuffer.baseRow > visibleRows) {
      // Shrinking visible area
      readScreenContent(displayedBuffer, outputCallback); // was: yX(m, W)
      clearScreenRows(displayedBuffer, displayedBuffer.row - displayedBuffer.baseRow, visibleRows); // was: ZG(m, m.row - m.W, c)
    } else if (displayedBuffer.row < visibleRows) {
      // Expanding but constrained by current row
      visibleRows = displayedBuffer.baseRow; // was: c = m.W
    }
    displayedBuffer.baseRow = visibleRows; // was: m.W = c
  }
}

// ======================================================================
// switchToTextMode -- Switch to text/direct caption mode.
// [was: Uya] -- Source lines 580--585
// ======================================================================

/**
 * Set the display style to text mode (4) and assign the text buffer
 * as the active write target.
 *
 * @param {Object} channel [was: Q] -- CEA-608 channel state
 *   `.text` (text buffer), `.style`, `.modeState` [was: A]
 */
export function switchToTextMode(channel) { // was: Uya
  channel.style.set(4); // was: Q.style.set(4)
  channel.activeBuffer = channel.textBuffer; // was: Q.W = Q.text
  channel.activeBuffer.style = channel.style; // was: Q.W.style = Q.style
  channel.modeState.mode = 1 << channel.activeBuffer.channelIndex; // was: Q.A.mode = 1 << Q.W.j
}

// ======================================================================
// processCea608BytePairFull -- Full CEA-608 byte-pair processing state machine.
// [was: Yg1] -- Source lines 586--774
// ======================================================================

/**
 * Core state machine for processing a single CEA-608 byte pair on a
 * specific channel.  Handles:
 *   - Printable character pairs (basic charset, charCode >= 32)
 *   - Control codes (Preamble Address Codes, mid-row codes, misc codes)
 *   - Extended characters (Spanish/French, Portuguese/German sets)
 *   - Mode-switching commands (RCL, BS, DER, RU2/3/4, FON, RDC, TR, RTD, EDM, CR, ENM, EOC)
 *   - Cursor movement (tab offsets)
 *
 * The function first calls `classifyCea608BytePair` to strip parity
 * and classify the pair.  Null and duplicate pairs are ignored.
 * Printable pairs write characters to the active buffer.  Control
 * codes dispatch through a nested switch tree.
 *
 * @param {Object} channel [was: Q] -- CEA-608 channel state
 * @param {number} byte1 [was: c] -- first byte
 * @param {number} byte2 [was: W] -- second byte
 * @param {Object} outputCallback [was: m] -- receives decoded captions
 */
export function processCea608BytePairFull(channel, byte1, byte2, outputCallback) { // was: Yg1
  channel.controlState.update(); // was: Q.O.update()
  const classified = classifyCea608BytePair(byte1, byte2, channel.controlState); // was: c = k01(c, W, Q.O)

  switch (classified.result) {
    case 0: // null pair
      return;
    case 1: // duplicate control
    case 2: // mid-row / extended (handled via duplicate filter)
      return;
  }

  let highByte = classified.highByte; // was: K = c.JD
  let lowByte = classified.lowByte; // was: c = c.CY

  if (highByte >= 32 || !highByte) {
    // ---- Printable character pair ----
    // Only write when the channel mode allows it
    if (!(channel.activeBuffer.mode & channel.activeBuffer.displayedBuffer)) return; // was: Q.W.mode & Q.W.O

    let h = highByte; // was: W = K
    if (h & 128) h = 127; // was: W & 128 && (W = 127)
    if (lowByte & 128) lowByte = 127; // was: c & 128 && (c = 127)

    const screen = channel.nonDisplayedBuffer.activeScreen; // was: Q = Q.j.W
    if (h & 96) writeCharacterToScreen(screen, 0, h); // was: W & 96 && F8(Q, 0, W)
    if (lowByte & 96) writeCharacterToScreen(screen, 0, lowByte); // was: c & 96 && F8(Q, 0, c)

    // In paint-on mode, flush after each printable pair
    if (h !== 0 && lowByte !== 0 && screen.style.type === 3) {
      readScreenContent(screen, outputCallback); // was: yX(Q, m)
    }
  } else if (highByte & 16) {
    // ---- Control code pair ----
    // Check for duplicate control code
    if (channel.controlState.matches(highByte, lowByte)) return; // was: Q.O.matches(K, c)

    // Store control code for duplicate detection
    const state = channel.controlState; // was: W = Q.O
    state.lastHighByte = highByte; // was: W.JD = K
    state.lastLowByte = lowByte; // was: W.CY = c
    state.state = 2; // was: W.state = 2

    // Select the appropriate buffer based on field bit
    const buffer = highByte & 8 ? channel.alternateBuffer : channel.primaryBuffer; // was: W = K & 8 ? Q.D : Q.A
    channel.nonDisplayedBuffer = buffer; // was: Q.j = W
    channel.activeBuffer.mode = 1 << (channel.fieldIndex << 2) + (buffer.fieldBit << 1) + (buffer.style.type === 4 ? 1 : 0); // was: Q.W.mode = 1 << (Q.K << 2) + (W.K << 1) + (W.style.type === 4 ? 1 : 0)

    // Check if mode is valid for display
    if (!((channel.activeBuffer.mode | 1 << (channel.fieldIndex << 2) + (buffer.fieldBit << 1) + (buffer.style.type !== 4 ? 1 : 0)) & channel.activeBuffer.displayedBuffer)) return; // was: (Q.W.mode | ...) & Q.W.O

    if (lowByte & 64) {
      // ---- Preamble Address Code (PAC) ----
      const targetRow = [11, 11, 1, 2, 3, 4, 12, 13, 14, 15, 5, 6, 7, 8, 9, 10][(highByte & 7) << 1 | lowByte >> 5 & 1]; // was: m
      const indent = lowByte & 16 ? ((lowByte & 14) >> 1) * 4 : 0; // was: Q = c & 16 ? ((c & 14) >> 1) * 4 : 0
      const screen = buffer.activeScreen; // was: c = W.W

      switch (buffer.style.get()) {
        case 4: // text mode -- keep current row
          // targetRow is overridden by current row
          break; // was: m = c.row

        case 3: // roll-up mode
          if (targetRow !== screen.row) {
            if (targetRow < screen.baseRow) {
              // Target is above the visible window -- clamp
              if (targetRow === screen.row) break; // was: m = c.W; if (m === c.row) break
            }
            const visibleCount = 1 + screen.row - screen.baseRow; // was: T
            const newVisibleCount = 1 + targetRow - screen.baseRow; // was: r
            copyScreenRows(screen, newVisibleCount, visibleCount, screen.baseRow); // was: oH9(c, r, T, c.W)

            // Clear leftover rows
            let clearStart = visibleCount; // was: W = T
            let clearCount = screen.baseRow; // was: K = c.W
            if (newVisibleCount < visibleCount) {
              const overlap = newVisibleCount + clearCount - visibleCount;
              if (overlap > 0) {
                clearStart += overlap;
                clearCount -= overlap;
              }
            } else {
              const overlap = visibleCount + clearCount - newVisibleCount;
              if (overlap > 0) {
                clearCount -= overlap;
              }
            }
            clearScreenRows(screen, clearStart, clearCount); // was: ZG(c, W, K)
          }
          screen.row = targetRow; // was: c.row = m
          screen.cursorCol = indent + 1; // was: c.O = Q + 1
          break;

        default:
          screen.row = targetRow;
          screen.cursorCol = indent + 1;
      }
    } else {
      // ---- Non-PAC control codes ----
      switch (highByte & 7) {
        case 1: // Mid-row codes & special characters
          switch (lowByte & 112) {
            case 32: // Mid-row style change -- insert space
              writeCharacterToScreen(buffer.activeScreen, 0, 32); // was: F8(W.W, 0, 32)
              break;
            case 48: // Special/extended character
              if (lowByte === 57) {
                // Transparent space
                const screen = buffer.activeScreen; // was: m = W.W
                getCurrentCell(screen).charCode = 0; // was: SO(m).W = 0
                if (screen.cursorCol < 32) screen.cursorCol++; // was: m.O < 32 && m.O++
              } else {
                writeCharacterToScreen(buffer.activeScreen, 1, lowByte & 15); // was: F8(W.W, 1, c & 15)
              }
              break;
          }
          break;

        case 2: // Extended Spanish/French characters
          if (lowByte & 32) {
            writeCharacterToScreen(buffer.activeScreen, 2, lowByte & 31); // was: F8(W.W, 2, c & 31)
          }
          break;

        case 3: // Extended Portuguese/German characters
          if (lowByte & 32) {
            writeCharacterToScreen(buffer.activeScreen, 3, lowByte & 31); // was: F8(W.W, 3, c & 31)
          }
          break;

        case 4: // Miscellaneous control codes (field 1)
        case 5: // Miscellaneous control codes (field 2)
          if (lowByte >= 32 && lowByte <= 47) {
            switch (lowByte) {
              case 32: // RCL -- Resume Caption Loading
                resumeCaptionLoading(buffer); // was: rsv(W)
                break;

              case 33: // BS -- Backspace
                {
                  const screen = buffer.activeScreen; // was: m = W.W
                  if (screen.cursorCol > 1) {
                    --screen.cursorCol; // was: --m.O
                    getCurrentCell(screen).charCode = 0; // was: SO(m).W = 0
                  }
                }
                break;

              case 36: // DER -- Delete to End of Row
                {
                  const screen = buffer.activeScreen; // was: m = W.W
                  const currentCell = getCurrentCell(screen); // was: Q = SO(m)
                  for (let r = 0; r <= 15; r++) {
                    for (let c = 0; c <= 32; c++) {
                      if (screen.grid[r][c] === currentCell) {
                        for (; c <= 32; c++) {
                          screen.grid[r][c].reset(); // was: m.A[c][W].reset()
                        }
                        break;
                      }
                    }
                  }
                }
                break;

              case 37: // RU2 -- Roll-Up 2 rows
                switchToRollUpMode(buffer, 2, outputCallback); // was: sr(W, 2, m)
                break;

              case 38: // RU3 -- Roll-Up 3 rows
                switchToRollUpMode(buffer, 3, outputCallback); // was: sr(W, 3, m)
                break;

              case 39: // RU4 -- Roll-Up 4 rows
                switchToRollUpMode(buffer, 4, outputCallback); // was: sr(W, 4, m)
                break;

              case 40: // FON -- Flash On (insert space)
                writeCharacterToScreen(buffer.activeScreen, 0, 32); // was: F8(W.W, 0, 32)
                break;

              case 41: // RDC -- Resume Direct Captioning (paint-on)
                {
                  const ch = buffer; // was: m = W
                  ch.style.set(2); // was: m.style.set(2)
                  ch.activeBuffer = ch.displayedBuffer; // was: m.W = m.O
                  ch.activeBuffer.baseRow = 0; // was: m.W.W = 0
                  ch.activeBuffer.style = ch.style; // was: m.W.style = m.style
                  ch.modeState.mode = 1 << ch.activeBuffer.channelIndex; // was: m.A.mode = 1 << m.W.j
                }
                break;

              case 42: // TR -- Text Restart
                {
                  const ch = buffer; // was: m = W
                  const textBuf = ch.textBuffer; // was: Q = m.text
                  textBuf.baseRow = 15; // was: Q.W = 15
                  textBuf.style.set(4); // was: Q.style.set(4)
                  eraseScreenAndReset(textBuf); // was: Er(Q)
                  switchToTextMode(ch); // was: Uya(m)
                }
                break;

              case 43: // RTD -- Resume Text Display
                switchToTextMode(buffer); // was: Uya(W)
                break;

              case 44: // EDM -- Erase Displayed Memory
                {
                  const ch = buffer; // was: Q = W
                  const displayed = ch.displayedBuffer; // was: c = Q.O
                  switch (ch.style.get()) {
                    case 1: // pop-on
                    case 2: // paint-on
                    case 3: // roll-up
                      readScreenContent(displayed, outputCallback); // was: yX(c, m)
                  }
                  clearScreenRows(displayed, 0, 15); // was: ZG(c, 0, 15)
                }
                break;

              case 45: // CR -- Carriage Return
                {
                  const ch = buffer; // was: c = W
                  const screen = ch.activeScreen; // was: Q = c.W

                  switch (ch.style.get()) {
                    default:
                    case 2: // paint-on
                    case 1: // pop-on
                      break; // no-op for these modes

                    case 4: // text mode
                      if (screen.row < 15) {
                        ++screen.row;
                        screen.cursorCol = 1; // was: Q.O = 1
                        break;
                      }
                      // fall through to roll behavior

                    case 3: // roll-up mode
                      if (screen.baseRow < 2) {
                        screen.baseRow = 2; // was: Q.W = 2
                        if (screen.row < screen.baseRow) screen.row = screen.baseRow;
                      }
                      {
                        const scrollSrc = screen.row - screen.baseRow + 1; // was: c
                        readScreenContent(screen, outputCallback); // was: yX(Q, m)
                        copyScreenRows(screen, scrollSrc, scrollSrc + 1, screen.baseRow - 1); // was: oH9(Q, c, c + 1, Q.W - 1)
                        clearScreenRows(screen, screen.row, 1); // was: ZG(Q, Q.row, 1)
                      }
                  }
                }
                break;

              case 46: // ENM -- Erase Non-Displayed Memory
                clearScreenRows(buffer.nonDisplayedBuffer, 0, 15); // was: ZG(W.j, 0, 15)
                break;

              case 47: // EOC -- End of Caption (flip buffers)
                {
                  const ch = buffer; // was: Q = W
                  readScreenContent(ch.displayedBuffer, outputCallback); // was: yX(Q.O, m)
                  ch.nonDisplayedBuffer.updateTime(ch.modeState.time + 0); // was: Q.j.updateTime(Q.A.time + 0)
                  const temp = ch.nonDisplayedBuffer; // was: m = Q.j
                  ch.nonDisplayedBuffer = ch.displayedBuffer; // was: Q.j = Q.O
                  ch.displayedBuffer = temp; // was: Q.O = m
                  resumeCaptionLoading(ch); // was: rsv(Q)
                }
                break;
            }
          }
          break;

        case 7: // Tab offsets
          switch (lowByte) {
            case 33: // TO1
            case 34: // TO2
            case 35: // TO3
              {
                const screen = buffer.activeScreen; // was: m = W.W
                screen.cursorCol += (lowByte & 3); // was: (m.O += c & 3)
                if (screen.cursorCol > 32) screen.cursorCol = 32; // was: > 32 && (m.O = 32)
              }
              break;
          }
          break;
      }
    }
  }
}

// ======================================================================
// CEA-608 Lookup Tables (referenced by the functions above)
// ======================================================================

/**
 * Parity-strip table for CEA-608 byte processing.
 * [was: R19] -- Source line 2808
 *
 * Maps raw bytes (0--255) to their parity-stripped equivalents,
 * used by `classifyCea608BytePair` to validate and decode bytes.
 */
export const CEA608_PARITY_TABLE = [ // was: R19
  128, 1, 2, 131, 4, 133, 134, 7, 8, 137, 138, 11, 140, 13, 14, 143,
  16, 145, 146, 19, 148, 21, 22, 151, 152, 25, 26, 155, 28, 157, 158, 31,
  32, 161, 162, 35, 164, 37, 38, 167, 168, 41, 42, 171, 44, 173, 174, 47,
  176, 49, 50, 179, 52, 181, 182, 55, 56, 185, 186, 59, 188, 61, 62, 191,
  64, 193, 194, 67, 196, 69, 70, 199, 200, 73, 74, 203, 76, 205, 206, 79,
  208, 81, 82, 211, 84, 213, 214, 87, 88, 217, 218, 91, 220, 93, 94, 223,
  224, 97, 98, 227, 100, 229, 230, 103, 104, 233, 234, 107, 236, 109, 110, 239,
  112, 241, 242, 115, 244, 117, 118, 247, 248, 121, 122, 251, 124, 253, 254, 127,
  0, 129, 130, 3, 132, 5, 6, 135, 136, 9, 10, 139, 12, 141, 142, 15,
  144, 17, 18, 147, 20, 149, 150, 23, 24, 153, 154, 27, 156, 29, 30, 159,
  160, 33, 34, 163, 36, 165, 166, 39, 40, 169, 170, 43, 172, 45, 46, 175,
  48, 177, 178, 51, 180, 53, 54, 183, 184, 57, 58, 187, 60, 189, 190, 63,
  192, 65, 66, 195, 68, 197, 198, 71, 72, 201, 202, 75, 204, 77, 78, 207,
  80, 209, 210, 83, 212, 85, 86, 215, 216, 89, 90, 219, 92, 221, 222, 95,
  96, 225, 226, 99, 228, 101, 102, 231, 232, 105, 106, 235, 108, 237, 238, 111,
  240, 113, 114, 243, 116, 245, 246, 119, 120, 249, 250, 123, 252, 125, 126, 255,
];

/**
 * Basic North American character set (printable ASCII + special chars).
 * [was: csZ] -- Source line 2883
 *
 * Maps byte values 32--127 (after subtracting 32) to Unicode code points.
 * Most are standard ASCII; notable exceptions include accented characters
 * at positions that differ from standard ASCII (e.g., 225 for a-acute at
 * position 10, replacing the '+' sign).
 */
export const CEA608_BASIC_CHARS = [ // was: csZ
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 225, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
  64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
  80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 233, 93, 237, 243,
  250, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111,
  112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 231, 247, 209, 241, 9632,
];

/**
 * Special North American character set (16 special characters).
 * [was: W44] -- Source line 2884
 *
 * Includes: registered sign, degree, 1/2, inverted ?, trademark, cent,
 * pound, music note, a-grave, space, e-grave, a-circumflex, e-circumflex,
 * i-circumflex, o-circumflex, u-circumflex.
 */
export const CEA608_SPECIAL_CHARS = [ // was: W44
  174, 176, 189, 191, 8482, 162, 163, 9834, 224, 32, 232, 226, 234, 238, 244, 251,
];

/**
 * Extended Spanish/French character set (32 characters).
 * [was: myo] -- Source line 2885
 */
export const CEA608_EXTENDED_SPANISH = [ // was: myo
  193, 201, 211, 218, 220, 252, 8216, 161, 42, 39, 9473, 169, 8480, 183, 8220, 8221,
  192, 194, 199, 200, 202, 203, 235, 206, 207, 239, 212, 217, 249, 219, 171, 187,
];

/**
 * Extended Portuguese/German/Danish character set (32 characters).
 * [was: K4H] -- Source line 2886
 */
export const CEA608_EXTENDED_PORTUGUESE = [ // was: K4H
  195, 227, 205, 204, 236, 210, 242, 213, 245, 123, 125, 92, 94, 95, 124, 126,
  196, 228, 214, 246, 223, 165, 164, 9475, 197, 229, 216, 248, 9487, 9491, 9495, 9499,
];
