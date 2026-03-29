/**
 * Seek Overlay
 *
 * Manages the seek-arrow animation overlay, state resets, and opacity
 * reading from computed styles for the double-tap / arrow-key seek UI.
 *
 * Source: base.js lines 50001-50066
 * @module seek-overlay
 */
import { youtubePremiumBadgeIcon } from '../ui/svg-icons.js'; // was: okx
import { premiumStandaloneIcon } from '../ui/svg-icons.js'; // was: r_n
import { remove } from '../core/array-utils.js';
import { appendChild } from '../core/dom-utils.js';

// ---------------------------------------------------------------------------
// Seek arrow animation  [was: Nim]
// ---------------------------------------------------------------------------

/**
 * Clones the persistent seek arrow element, appends it to the overlay
 * container, animates it, and removes it on animation finish.
 *
 * The persistent arrow lives under `.ytp-seek-overlay-arrow-persistent`.
 * Each invocation produces a transient clone with the class
 * `.ytp-seek-overlay-arrow-additional` which is removed after its
 * animation completes.
 *
 * @param {Object} overlay - The seek overlay controller.
 *   overlay.j - The overlay DOM container element.
 */
export function animateSeekArrow(overlay) { // was: Nim
  const persistentArrow = overlay.j.querySelector(
    ".ytp-seek-overlay-arrow-persistent",
  );
  const clone = persistentArrow.cloneNode(true);

  clone.classList.add("ytp-seek-overlay-arrow-additional");
  clone.classList.remove("ytp-seek-overlay-arrow-persistent");

  overlay.j.appendChild(clone);

  // Hw7 drives the CSS / Web-Animations-API animation
  Hw7(overlay, clone, true, true).addEventListener("finish", () => {
    clone.remove();
  });
}

// ---------------------------------------------------------------------------
// Seek overlay state reset  [was: nz7]
// ---------------------------------------------------------------------------

/**
 * Resets the seek overlay to its idle / hidden state.
 *
 * Clears:
 *   - seek count       (`K`)   -> 0
 *   - visibility state (`W`)   -> "hidden"
 *   - direction        (`O`)   -> undefined
 *   - container ref    (`j`)   -> undefined
 *   - fade timer       (`D`)   -> stopped
 *   - animation ref    (`A`)   -> undefined
 *
 * @param {Object} overlay - The seek overlay controller.
 */
export function resetSeekOverlay(overlay) { // was: nz7
  overlay.K = 0;
  overlay.W = "hidden";
  overlay.O = undefined; // was: void 0
  overlay.j = undefined; // was: void 0
  overlay.D.stop();
  overlay.A = undefined; // was: void 0
}

// ---------------------------------------------------------------------------
// Get current opacity from computed styles  [was: iwm]
// ---------------------------------------------------------------------------

/**
 * Reads the current computed opacity of the overlay container, cancels any
 * running Web Animation on it, and returns the numeric opacity value.
 *
 * This is used to smoothly hand off between a CSS transition and a new
 * Web Animation starting from the current visual state.
 *
 * @param {Object} overlay - The seek overlay controller.
 * @returns {number} The current opacity (0-1).
 */
export function getOverlayOpacity(overlay) { // was: iwm
  const currentOpacity = Number(getComputedStyle(overlay.j).opacity);

  overlay.A?.cancel();
  overlay.A = undefined; // was: void 0

  return currentOpacity;
}

// ---------------------------------------------------------------------------
// Speed badge animation  [was: y63]  (contextually adjacent)
// ---------------------------------------------------------------------------

/**
 * Displays a transient text/icon badge (e.g. "2x") with a fade-in/out
 * keyframe animation lasting 1400 ms, then clears both values.
 *
 * @param {Object} badge  - The badge element controller.
 * @param {string} text   - Display text (e.g. "2x").
 * @param {string} [type] - Optional icon type ("PREMIUM_STANDALONE" | "PREMIUM_STANDALONE_CAIRO").
 */
export function showSpeedBadge(badge, text, type) { // was: y63
  badge.updateValue("text", text);

  if (type) {
    let icon;
    switch (type) {
      case "PREMIUM_STANDALONE":
        icon = youtubePremiumBadgeIcon(); // was: okx  (premium icon SVG)
        break;
      case "PREMIUM_STANDALONE_CAIRO":
        icon = premiumStandaloneIcon(); // was: r_n  (premium Cairo icon SVG)
        break;
      default:
        icon = undefined;
    }
    badge.updateValue("icon", icon);
  }

  // Cancel any in-progress animations on the badge element
  for (const anim of badge.Y.getAnimations()) {
    anim.cancel();
  }

  badge.Y.animate(
    [
      { offset: 0, opacity: 0 },
      { offset: 0.3, opacity: 1 },
      { offset: 0.7, opacity: 1 },
      { offset: 1, opacity: 0 },
    ],
    { duration: 1400 },
  ).addEventListener("finish", () => {
    badge.updateValue("text", "");
    badge.updateValue("icon", "");
  });
}
