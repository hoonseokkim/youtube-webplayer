/**
 * Caption Translation — Track translation support, device enumeration, and
 * language name formatting for caption data.
 *
 * Source: player_es6.vflset/en_US/base.js, lines 29005–29074
 *
 * Handles:
 *  - Device interface enumeration for caption track data
 *  - Display-name formatting (ASR vs regular captions)
 *  - Track metadata normalization (languageCode, kind, vssId, etc.)
 *  - Effective language code extraction (handles translation overrides)
 *  - VSS ID generation for translated tracks
 *  - Quality range creation from enum labels
 *  - Auto-quality detection and label mapping
 *  - Quality range membership checking
 */

import { qualityLabelToOrdinal } from '../../media/codec-tables.js';  // was: g.EU
import { onInternalAudioFormatChange } from '../../player/player-events.js'; // was: mp
import { handleBackgroundSuspend } from '../../media/quality-constraints.js'; // was: w3
import { ordinalToQualityLabel } from '../../media/codec-tables.js'; // was: ZV

// ══════════════════════════════════════════════════════════════════════
// getDeviceInterfaces — Map internal device descriptors to public form.
// [was: tG7] — Source lines 29005–29011
// ══════════════════════════════════════════════════════════════════════

/**
 * Convert raw device descriptors returned by `mp()` into a normalized array
 * of `{ deviceInterface, deviceVersion, isSleeping }` objects.
 *
 * The `deviceInterface` value is resolved through the `DEw` / `K9` lookup
 * tables, defaulting to `0` when the entry is unknown.
 *
 * @param {Object} captionData [was: Q]
 * @returns {Array<{deviceInterface: number, deviceVersion: string, isSleeping: *}>}
 */
export function getDeviceInterfaces(captionData) { // was: tG7
  return onInternalAudioFormatChange(captionData).map(({ fE: deviceKind, deviceVersion, xp: isSleeping }) => ({
    deviceInterface: DEw[K9[deviceKind]] || 0,
    deviceVersion: deviceVersion || "",
    isSleeping,
  }));
}

// ══════════════════════════════════════════════════════════════════════
// formatTrackDisplayName — Build a human-readable caption track label.
// [was: g.tR] — Source lines 29013–29025
// ══════════════════════════════════════════════════════════════════════

/**
 * Build the display name for a caption track.
 *
 * Rules:
 *  1. If `track.displayName` is already set, use it as-is.
 *  2. Otherwise start with the `languageName`.
 *     - If the track `kind` is `"asr"` and the language name does not
 *       already contain parentheses, append `" (Automatic Captions)"`.
 *     - If a custom `name` field exists, append ` - <name>`.
 *  3. If the track has a `translationLanguage`, append
 *     ` >> <translationLanguage.languageName>`.
 *
 * @param {Object} track [was: Q] — caption track metadata
 * @returns {string} formatted display name
 */
export function formatTrackDisplayName(track) { // was: g.tR
  const parts = []; // was: c
  if (track.displayName) {
    parts.push(track.displayName);
  } else {
    const languageName = track.languageName || ""; // was: W
    parts.push(languageName);
    if (track.kind === "asr" && languageName.indexOf("(") === -1) {
      parts.push(" (Automatic Captions)");
    }
    if (track.name) {
      parts.push(` - ${track.name}`);
    }
  }
  if (track.translationLanguage) {
    parts.push(` >> ${track.translationLanguage.languageName}`);
  }
  return parts.join("");
}

// ══════════════════════════════════════════════════════════════════════
// normalizeTrackMetadata — Create a normalized caption-track object.
// [was: g.H2] — Source lines 29027–29044
// ══════════════════════════════════════════════════════════════════════

/**
 * Project raw caption-track data into a canonical metadata shape, calling
 * {@link formatTrackDisplayName} to populate `displayName`.
 *
 * Optional fields (`xtags`, `captionId`, `translationLanguage`) are only
 * copied when present on the source object.
 *
 * @param {Object} track [was: Q] — raw caption track
 * @returns {Object} normalized metadata
 */
export function normalizeTrackMetadata(track) { // was: g.H2
  const normalized = { // was: c
    languageCode: track.languageCode,
    languageName: track.languageName,
    displayName: formatTrackDisplayName(track), // was: g.tR(Q)
    kind: track.kind,
    name: track.name,
    id: track.id,
    is_servable: track.W, // was: Q.W
    is_default: track.isDefault,
    is_translateable: track.isTranslateable,
    vss_id: track.vssId,
  };
  if (track.xtags) normalized.xtags = track.xtags;
  if (track.captionId) normalized.captionId = track.captionId;
  if (track.translationLanguage) normalized.translationLanguage = track.translationLanguage;
  return normalized;
}

// ══════════════════════════════════════════════════════════════════════
// getEffectiveLanguageCode — Resolve the effective language code.
// [was: g.Na] — Source lines 29046–29048
// ══════════════════════════════════════════════════════════════════════

/**
 * If the track carries a `translationLanguage`, return its language code;
 * otherwise fall back to the track's own `languageCode`.
 *
 * @param {Object} track [was: Q]
 * @returns {string}
 */
export function getEffectiveLanguageCode(track) { // was: g.Na
  return track.translationLanguage
    ? track.translationLanguage.languageCode
    : track.languageCode;
}

// ══════════════════════════════════════════════════════════════════════
// getTranslatedVssId — Build the VSS-ID for a (possibly translated) track.
// [was: g.Haw] — Source lines 29050–29054
// ══════════════════════════════════════════════════════════════════════

/**
 * For translated tracks the VSS ID is prefixed with `"t"` and suffixed
 * with `".<effectiveLanguageCode>"`.  Non-translated tracks return the
 * plain `vssId`.
 *
 * @param {Object} track [was: Q]
 * @returns {string|undefined}
 */
export function getTranslatedVssId(track) { // was: g.Haw
  let vssId = track.vssId; // was: c
  if (track.translationLanguage && vssId) {
    vssId = `t${vssId}.${getEffectiveLanguageCode(track)}`; // was: g.Na(Q)
  }
  return vssId;
}

// ══════════════════════════════════════════════════════════════════════
// createQualityRange — Construct an iH quality range from enum labels.
// [was: g.ya] — Source lines 29056–29058
// ══════════════════════════════════════════════════════════════════════

/**
 * Convert two quality label strings (e.g. `"hd720"`, `"hd1080"`) into
 * their numeric ordinals via the `qualityLabelToOrdinal` lookup table, then create a new
 * `iH` quality-range object.
 *
 * @param {string} minQualityLabel [was: Q] — lower bound quality label
 * @param {string} maxQualityLabel [was: c] — upper bound quality label
 * @param {*} param3 [was: W]
 * @param {*} param4 [was: m]
 * @returns {iH} quality range instance
 */
export function createQualityRange(minQualityLabel, maxQualityLabel, param3, param4) { // was: g.ya
  return new iH(
    qualityLabelToOrdinal[minQualityLabel] || 0,
    qualityLabelToOrdinal[maxQualityLabel] || 0,
    param3,
    param4,
  );
}

// ══════════════════════════════════════════════════════════════════════
// isAutoQuality — Check whether a quality range represents "auto".
// [was: FU] — Source lines 29060–29065
// ══════════════════════════════════════════════════════════════════════

/**
 * A quality range is considered "auto" when both its minimum and maximum
 * ordinals equal the `"auto"` sentinel in `qualityLabelToOrdinal`.
 *
 * An early exit returns `false` when the global `SQ` flag is set and
 * the range carries a `w3` (bitrate cap) field.
 *
 * @param {Object} qualityRange [was: Q]
 * @returns {boolean}
 */
export function isAutoQuality(qualityRange) { // was: FU
  if (SQ && qualityRange.handleBackgroundSuspend) {
    return false; // was: !1
  }
  const autoOrdinal = qualityLabelToOrdinal.auto; // was: c
  return qualityRange.O === autoOrdinal && qualityRange.W === autoOrdinal;
}

// ══════════════════════════════════════════════════════════════════════
// getQualityLabel — Map a quality range to its string label.
// [was: Em] — Source lines 29067–29069
// ══════════════════════════════════════════════════════════════════════

/**
 * Look up the string label (e.g. `"hd720"`) for the dominant ordinal
 * in a quality range.  Falls back to `"auto"` when no mapping exists.
 *
 * @param {Object} qualityRange [was: Q]
 * @returns {string}
 */
export function getQualityLabel(qualityRange) { // was: Em
  return ordinalToQualityLabel[qualityRange.W || qualityRange.O] || "auto";
}

// ══════════════════════════════════════════════════════════════════════
// isQualityInRange — Test whether a quality label falls within a range.
// [was: Nny] — Source lines 29071–29074
// ══════════════════════════════════════════════════════════════════════

/**
 * Returns `true` when the quality ordinal for `label` is at or above the
 * range minimum (`O`) and, if a maximum (`W`) is set, at or below it.
 *
 * @param {Object} qualityRange [was: Q]
 * @param {string} qualityLabel [was: c] — e.g. `"hd1080"`
 * @returns {boolean}
 */
export function isQualityInRange(qualityRange, qualityLabel) { // was: Nny
  const ordinal = qualityLabelToOrdinal[qualityLabel]; // was: c (reassigned)
  return qualityRange.O <= ordinal && (!qualityRange.W || qualityRange.W >= ordinal);
}
