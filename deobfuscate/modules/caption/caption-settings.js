/**
 * Caption Settings — Preference management for caption display settings,
 * including language selection, font/color/opacity, and persistence.
 *
 * Source: player_es6.vflset/en_US/caption.js
 *   - parseHexColor:            lines 46–53  [was: HA]
 *   - getCaptionsInitialState:  lines 27–29  [was: tu]
 *   - getStoredDisplaySettings: lines 65–67  [was: NC]
 *   - applyDisplaySettings:     lines 1264–1332 [was: l9]
 *   - DEFAULT_CAPTION_PARAMS:   lines 3705–3723 [was: PA]
 *   - languageCodeToName map:   lines 1713–2305 [was: $S0]
 *   - hex color regex:          lines 1711–1712 [was: b3o, jU4]
 */

import { SHORT_HEX_EXPAND_REGEX, VALID_HEX_REGEX } from './caption-data.js';  // was: g.jU4, g.b3o
import { isWebExact } from '../../data/performance-profiling.js'; // was: g.rT
import { readUint8 } from './caption-internals.js'; // was: af
import { yieldValue } from '../../ads/ad-async.js'; // was: am
import { filterAndSortFormats } from '../../data/bandwidth-tracker.js'; // was: as
import { buildSlotTelemetry } from '../../network/uri-utils.js'; // was: az
import { isVideoCodec } from '../../media/codec-helpers.js'; // was: bo
import { LISTENER_MAP_KEY } from '../../data/event-logging.js'; // was: bs
import { instreamSurveyAnswer } from '../../core/misc-helpers.js'; // was: da
import { logSegmentEntryTiming } from '../../ads/ad-cue-delivery.js'; // was: de
import { createDatabaseDefinition } from '../../data/idb-transactions.js'; // was: el
import { OrchestrationAction } from '../offline/download-manager.js'; // was: es
import { ElementGeometryObserver } from '../../data/module-init.js'; // was: et
import { fetchWaaChallenge } from '../../core/event-registration.js'; // was: eu
import { slotMatchesMetadata } from '../../network/uri-utils.js'; // was: fr
import { isPlaylistLike } from '../../player/video-loader.js'; // was: gu
import { sliceBuffer } from '../../data/collection-utils.js'; // was: hr
import { notifyOperationFailure } from '../offline/download-manager.js'; // was: ka
import { unloadModuleDependencies } from '../../player/caption-manager.js'; // was: km
import { exitFullscreen } from '../../ui/layout/fullscreen.js'; // was: kn
import { recordBufferHealth } from '../../media/engine-config.js'; // was: ko
import { createTimeRanges } from '../../media/codec-helpers.js'; // was: lo
import { enumReader } from '../../proto/message-setup.js'; // was: lt
import { setAriaLabel } from '../../core/bitstream-helpers.js'; // was: mr
import { sendPostRequest } from '../../network/request.js'; // was: ms
import { isDrcTrack } from '../../ads/ad-click-tracking.js'; // was: my
import { safeHtmlFrom } from '../../core/composition-helpers.js'; // was: ne
import { readBoolField } from '../../proto/varint-decoder.js'; // was: no
import { validateLayoutTriggers } from '../../ads/ad-scheduling.js'; // was: ro
import { initializeSuggestedActionVisibility } from '../../player/video-loader.js'; // was: ru
import { logWarning } from '../../core/composition-helpers.js'; // was: si
import { enterRollUp } from './caption-internals.js'; // was: sr
import { updateClipRange } from '../../ui/seek-bar-tail.js'; // was: tg
import { isDeterministicIdGenerationEnabled } from '../../player/media-state.js'; // was: tl
import { getHttpStatus } from '../../data/idb-transactions.js'; // was: uk
import { isSubstituteAdCpnMacroEnabled } from '../../player/media-state.js'; // was: vi
import { getSubtleCrypto } from '../../proto/varint-decoder.js'; // was: zh
import { LiveStreamBreakScheduledDurationNotMatchedTrigger } from '../../ads/ad-trigger-types.js'; // was: zu
import { slice } from '../../core/array-utils.js';
import { toString } from '../../core/string-utils.js';

// ── Regex patterns for hex colors ───────────────────────────────────
// [was: jU4] — Source line 1711
const SHORT_HEX_EXPAND_REGEX = /#(.)(.)(.)/;

// [was: b3o] — Source line 1712
const VALID_HEX_REGEX = /^#(?:[0-9a-f]{3}){1,2}$/i;

// ── Also used in caption-renderer.js for validation ─────────────────
// [was: Or] — Source line 2495
export const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3}){1,2}$/i;

/**
 * Parse a hex color string into an [r, g, b] array.
 *
 * [was: HA] — Source lines 46–53
 *
 * @param {string} hex — e.g. "#fff" or "#080808"
 * @returns {number[]} — [red, green, blue] each 0–255
 * @throws {Error} if the input is not a valid hex color
 */
export function parseHexColor(hex) { // was: HA
  if (!VALID_HEX_REGEX.test(hex)) {
    throw Error(`'${hex}' is not a valid hex color`);
  }
  // Expand shorthand #abc -> #aabbcc
  if (hex.length === 4) {
    hex = hex.replace(SHORT_HEX_EXPAND_REGEX, '#$1$1$2$2$3$3');
  }
  hex = hex.toLowerCase();
  const value = parseInt(hex.slice(1), 16);
  return [value >> 16, (value >> 8) & 255, value & 255];
}

/**
 * Convert a numeric color value (0–16777215) to a hex string like "#RRGGBB".
 *
 * [was: vA] — Source lines 938–941
 *
 * @param {number} colorValue
 * @returns {string}
 */
export function numberToHexColor(colorValue) { // was: vA
  let hex = Math.max(0, Math.min(Math.round(colorValue), 16777215)).toString(16).toUpperCase();
  return '#000000'.substring(0, 7 - hex.length) + hex;
}

/**
 * Get the initial caption state from the audio track metadata.
 *
 * [was: tu] — Source lines 27–29
 *
 * @param {Object} audioTrack — the current audio track object
 * @param {boolean} isFeatureEnabled — whether the player feature flag is on
 * @returns {string} — one of "CAPTIONS_INITIAL_STATE_ON_RECOMMENDED",
 *   "CAPTIONS_INITIAL_STATE_OFF_RECOMMENDED", "CAPTIONS_INITIAL_STATE_ON_REQUIRED",
 *   "CAPTIONS_INITIAL_STATE_OFF_REQUIRED", or "CAPTIONS_INITIAL_STATE_UNKNOWN"
 */
export function getCaptionsInitialState(audioTrack, isFeatureEnabled) { // was: tu
  return isFeatureEnabled
    ? audioTrack.captionsInitialState
    : 'CAPTIONS_INITIAL_STATE_UNKNOWN';
}

/**
 * Check whether language-preference stickiness is enabled.
 *
 * [was: dSm] — Source lines 30–32
 *
 * @param {Object} config — player config
 * @returns {boolean}
 */
export function isLanguageStickinessEnabled(config) { // was: dSm
  return /* isWebExact(config) || */ config.experimentEnabled('web_enable_caption_language_preference_stickiness');
}

/**
 * Retrieve the user's stored caption display settings from local storage.
 *
 * [was: NC] — Source lines 65–67
 *
 * @returns {?Object} — the stored settings object, or null
 */
export function getStoredDisplaySettings() { // was: NC
  return getStoredPreference('yt-player-caption-display-settings');
}

/**
 * Get the suggest-correction label text (for edit-caption button).
 *
 * [was: gJS] — Source lines 54–64
 *
 * @returns {string}
 */
export function getSuggestCorrectionLabel() { // was: gJS
  // g.Ge is the global localization map
  let text = 'Edit caption'; // default fallback
  // (template interpolation omitted — original replaces ${key} patterns)
  return text;
}

// ── Default caption display parameters ──────────────────────────────
// Exported from caption-module.js as well — re-exported here for convenience.
// [was: PA] — Source lines 3705–3723
export const DEFAULT_CAPTION_PARAMS = {
  windowColor: '#080808',
  windowOpacity: 0,
  textAlign: 2,
  anchorPoint: 7, // was: bW
  horizontalAnchor: 50, // was: kc
  verticalAnchor: 100, // was: ZB
  isDefault: true,
  textStyle: { // was: T1
    background: '#080808',
    backgroundOpacity: 0.75,
    charEdgeStyle: 0,
    color: '#fff',
    fontFamily: 4,
    fontSizeIncrement: 0,
    textOpacity: 1,
    offset: 1,
  },
};

// ── Language code to display name mapping ────────────────────────────
// [was: $S0] — Source lines 1713–2305  (only a subset shown here)
//
// The full mapping contains ~600 entries. The player also looks up
// names via g.NTm (a Map cache) at runtime.
export const LANGUAGE_NAMES = {
  aa: 'Afar',
  ab: 'Abkhazian',
  af: 'Afrikaans',
  am: 'Amharic',
  ar: 'Arabic',
  as: 'Assamese',
  az: 'Azerbaijani',
  be: 'Belarusian',
  bg: 'Bulgarian',
  bn: 'Bangla',
  bo: 'Tibetan',
  bs: 'Bosnian',
  ca: 'Catalan',
  cs: 'Czech',
  cy: 'Welsh',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  en_US: 'English (United States)',
  en_GB: 'English (United Kingdom)',
  eo: 'Esperanto',
  es: 'Spanish',
  et: 'Estonian',
  eu: 'Basque',
  fa: 'Persian',
  fi: 'Finnish',
  fil: 'Filipino',
  fr: 'French',
  ga: 'Irish',
  gl: 'Galician',
  gu: 'Gujarati',
  ha: 'Hausa',
  he: 'Hebrew',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  hy: 'Armenian',
  id: 'Indonesian',
  ig: 'Igbo',
  is: 'Icelandic',
  it: 'Italian',
  ja: 'Japanese',
  jv: 'Javanese',
  ka: 'Georgian',
  kk: 'Kazakh',
  km: 'Khmer',
  kn: 'Kannada',
  ko: 'Korean',
  ku: 'Kurdish',
  ky: 'Kyrgyz',
  la: 'Latin',
  lo: 'Lao',
  lt: 'Lithuanian',
  lv: 'Latvian',
  mk: 'Macedonian',
  ml: 'Malayalam',
  mn: 'Mongolian',
  mr: 'Marathi',
  ms: 'Malay',
  mt: 'Maltese',
  my: 'Burmese',
  ne: 'Nepali',
  nl: 'Dutch',
  no: 'Norwegian',
  or: 'Odia',
  pa: 'Punjabi',
  pl: 'Polish',
  pt: 'Portuguese',
  pt_BR: 'Portuguese (Brazil)',
  ro: 'Romanian',
  ru: 'Russian',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovenian',
  so: 'Somali',
  sq: 'Albanian',
  sr: 'Serbian',
  su: 'Sundanese',
  sv: 'Swedish',
  sw: 'Swahili',
  ta: 'Tamil',
  te: 'Telugu',
  tg: 'Tajik',
  th: 'Thai',
  tl: 'Tagalog',
  tr: 'Turkish',
  uk: 'Ukrainian',
  ur: 'Urdu',
  uz: 'Uzbek',
  vi: 'Vietnamese',
  yo: 'Yoruba',
  zh: 'Chinese',
  zh_Hans: 'Chinese (Simplified)',
  zh_Hant: 'Chinese (Traditional)',
  zu: 'Zulu',
  // ... remaining entries from source lines 1713–2305 (approx 600 total)
};

// [was: pw0] — Source lines 2306–2308
export const HLS_LANGUAGE_LABELS = {
  en: 'English',
};
