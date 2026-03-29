/**
 * SVG Icon Factory Functions — player control and ad UI icons.
 *
 * Source: base.js lines ~16256–17274
 *
 * Each function returns an element-spec object consumed by the player's
 * virtual-DOM renderer.  The spec shape is:
 *
 *   { C: tagName, N: attributes, V: children[], rA?: boolean, Z?: cssClass }
 *
 * Where `C` = "svg"|"path"|"rect"|"defs"|…, `N` = attribute map,
 * `V` = child specs, `rA` = SVG-namespace flag [was: rA → true],
 * and `Z` = CSS class applied to the element.
 *
 * CSS class "ytp-svg-fill" is used on paths that inherit the player
 * theme colour via `fill: currentColor` or from a parent rule.
 *
 * [was: g.$Kx, IH, g.X6, PnR, g.AK, l5d, uR0, h6w, g.e_, Vj, z6O,
 *        CnX, MNX, B1, Jf7, R6w, kRm, x4, YFd, pN7, qQ, QSw, g.c_3,
 *        W_W, n2, m7W, K_x, TMW, D1, tK, H1, okx, r_n, U7m, ILX,
 *        g.NQ, g.iL, g.yj, X5K, A_0, eCd, S_, F6]
 */
import { OptionalDep } from '../network/innertube-config.js'; // was: x1

// ---------------------------------------------------------------------------
// 36 x 36 icons (player chrome)
// ---------------------------------------------------------------------------

/**
 * Airplay / cast icon (36 x 36).
 * @returns {Object} SVG element spec
 * [was: g.$Kx]
 */
export function airplayIcon() { // was: g.$Kx
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      N: {
        d: 'M7,24 L7,27 L10,27 C10,25.34 8.66,24 7,24 L7,24 Z M7,20 L7,22 C9.76,22 12,24.24 12,27 L14,27 C14,23.13 10.87,20 7,20 L7,20 Z M25,13 L11,13 L11,14.63 C14.96,15.91 18.09,19.04 19.37,23 L25,23 L25,13 L25,13 Z M7,16 L7,18 C11.97,18 16,22.03 16,27 L18,27 C18,20.92 13.07,16 7,16 L7,16 Z M27,9 L9,9 C7.9,9 7,9.9 7,11 L7,14 L9,14 L9,11 L27,11 L27,25 L20,25 L20,27 L27,27 C28.1,27 29,26.1 29,25 L29,11 C29,9.9 28.1,9 27,9 L27,9 Z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Checkmark icon (36 x 36).
 * @returns {Object} SVG element spec
 * [was: IH]
 */
export function checkmarkIcon() { // was: IH
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'm 14.8,21.9 -4.2,-4.2 -1.4,1.4 5.6,5.6 12,-12 -1.4,-1.4 -10.6,10.6 z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Chevron-left icon (32 x 32).
 * @returns {Object} SVG element spec
 * [was: g.X6]
 */
export function chevronLeftIcon() { // was: g.X6
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 32 32',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M 19.41,20.09 14.83,15.5 19.41,10.91 18,9.5 l -6,6 6,6 z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Chevron-down / expand icon (24 x 24).
 * @returns {Object} SVG element spec
 * [was: PnR]
 */
export function chevronDownIcon() { // was: PnR
  return {
    C: 'svg',
    N: {
      height: '100%',
      viewBox: '0 0 24 24',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M7.41,8.59L12,13.17l4.59-4.58L18,10l-6,6l-6-6L7.41,8.59z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Chevron-right icon (32 x 32).
 * @returns {Object} SVG element spec
 * [was: g.AK]
 */
export function chevronRightIcon() { // was: g.AK
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 32 32',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'm 12.59,20.34 4.58,-4.59 -4.58,-4.59 1.41,-1.41 6,6 -6,6 z',
        fill: '#fff',
      },
    }],
  };
}

// ---------------------------------------------------------------------------
// 14 x 14 icons (chapter / segment markers)
// ---------------------------------------------------------------------------

/**
 * Close-X badge icon (14 x 14) — used for chapter dismissal.
 * Two-path: background fill + X.
 * @returns {Object} SVG element spec
 * [was: l5d]
 */
export function closeBadgeIcon() { // was: l5d
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 14 14',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M14,14 L14,0 L0,0 L0,14 L14,14 Z',
      },
    }, {
      C: 'path',
      N: {
        d: 'M7.15,8.35 L9.25,10.45 L10.65,9.05 L8.55,6.95 L10.7,4.8 L9.3,3.4 L7.15,5.55 L5,3.4 L3.6,4.8 L5.75,6.95 L3.65,9.05 L5.05,10.45 L7.15,8.35 Z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Previous-chapter marker icon (14 x 14) — left-pointing flag.
 * @returns {Object} SVG element spec
 * [was: uR0]
 */
export function previousChapterIcon() { // was: uR0
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 14 14',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      N: {
        d: 'M2,14 L5,11 L5,3 L2,0 L9,0 L9,14 L2,14 L2,14 Z',
        fill: '#eaeaea',
      },
    }],
  };
}

/**
 * Next-chapter marker icon (14 x 14) — right-pointing flag.
 * @returns {Object} SVG element spec
 * [was: h6w]
 */
export function nextChapterIcon() { // was: h6w
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 14 14',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      N: {
        d: 'M12,14 L9,11 L9,3 L12,0 L5,0 L5,14 L12,14 Z',
        fill: '#eaeaea',
      },
    }],
  };
}

/**
 * Pause-chapter marker icon (14 x 14) — two vertical bars.
 * @returns {Object} SVG element spec
 * [was: YFd]
 */
export function pauseChapterIcon() { // was: YFd
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 14 14',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      N: {
        d: 'M5,0 L9,0 L9,14 L5,14 L5,0 Z',
        fill: '#eaeaea',
      },
    }],
  };
}

// ---------------------------------------------------------------------------
// 24 x 24 icons (overlay / ad UI)
// ---------------------------------------------------------------------------

/**
 * Close-X icon (24 x 24) — e.g. dismiss overlay.
 * @returns {Object} SVG element spec
 * [was: g.e_]
 */
export function closeIcon() { // was: g.e_
  return {
    C: 'svg',
    N: {
      height: '100%',
      viewBox: '0 0 24 24',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Closed-captions (CC) badge icon (24 x 24).
 * @returns {Object} SVG element spec
 * [was: Vj]
 */
export function closedCaptionsBadgeIcon() { // was: Vj
  return {
    C: 'svg',
    N: {
      height: '24',
      viewBox: '0 0 24 24',
      width: '24',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M21.20 3.01L21 3H3L2.79 3.01C2.30 3.06 1.84 3.29 1.51 3.65C1.18 4.02 .99 4.50 1 5V19L1.01 19.20C1.05 19.66 1.26 20.08 1.58 20.41C1.91 20.73 2.33 20.94 2.79 20.99L3 21H21L21.20 20.98C21.66 20.94 22.08 20.73 22.41 20.41C22.73 20.08 22.94 19.66 22.99 19.20L23 19V5C23.00 4.50 22.81 4.02 22.48 3.65C22.15 3.29 21.69 3.06 21.20 3.01ZM3 19V5H21V19H3ZM6.97 8.34C6.42 8.64 5.96 9.09 5.64 9.63L5.50 9.87C5.16 10.53 4.99 11.26 5 12L5.00 12.27C5.04 12.92 5.21 13.55 5.50 14.12L5.64 14.36C5.96 14.90 6.42 15.35 6.97 15.65L7.21 15.77C7.79 16.01 8.43 16.06 9.03 15.91L9.29 15.83C9.88 15.61 10.39 15.23 10.77 14.73C10.93 14.53 11.00 14.27 10.97 14.02C10.94 13.77 10.82 13.53 10.63 13.37C10.44 13.20 10.19 13.11 9.93 13.12C9.68 13.13 9.44 13.24 9.26 13.43L9.19 13.50C9.05 13.70 8.85 13.85 8.62 13.94L8.54 13.97C8.35 14.02 8.16 14.00 7.99 13.92L7.91 13.88C7.67 13.75 7.48 13.56 7.35 13.32L7.28 13.20C7.11 12.88 7.02 12.52 7.00 12.16L7 12C6.99 11.58 7.09 11.16 7.28 10.79L7.35 10.67C7.48 10.43 7.67 10.24 7.91 10.11C8.10 10.00 8.32 9.97 8.54 10.02L8.62 10.05C8.81 10.12 8.98 10.24 9.11 10.39L9.19 10.49L9.26 10.57C9.43 10.74 9.66 10.85 9.91 10.87C10.15 10.89 10.40 10.81 10.59 10.66C10.79 10.51 10.92 10.29 10.96 10.05C11.01 9.80 10.96 9.55 10.83 9.34L10.77 9.26L10.60 9.05C10.24 8.65 9.79 8.35 9.29 8.16L9.03 8.08C8.34 7.91 7.60 8.00 6.97 8.34ZM14.97 8.34C14.42 8.64 13.96 9.09 13.64 9.63L13.50 9.87C13.16 10.53 12.99 11.26 13 12L13.00 12.27C13.04 12.92 13.21 13.55 13.50 14.12L13.64 14.36C13.96 14.90 14.42 15.35 14.97 15.65L15.21 15.77C15.79 16.01 16.43 16.06 17.03 15.91L17.29 15.83C17.88 15.61 18.39 15.23 18.77 14.73C18.93 14.53 19.00 14.27 18.97 14.02C18.94 13.77 18.82 13.53 18.63 13.37C18.44 13.20 18.19 13.11 17.93 13.12C17.68 13.13 17.44 13.24 17.26 13.43L17.19 13.50C17.05 13.70 16.85 13.85 16.62 13.94L16.54 13.97C16.35 14.02 16.16 14.00 15.99 13.92L15.91 13.88C15.67 13.75 15.48 13.56 15.35 13.32L15.28 13.20C15.11 12.88 15.02 12.52 15.00 12.16L15 12C14.99 11.58 15.09 11.16 15.28 10.79L15.35 10.67C15.48 10.43 15.67 10.24 15.91 10.11C16.10 10.00 16.32 9.97 16.54 10.02L16.62 10.05C16.81 10.12 16.98 10.24 17.11 10.39L17.19 10.49L17.26 10.57C17.43 10.74 17.66 10.85 17.91 10.87C18.15 10.89 18.40 10.81 18.59 10.66C18.79 10.51 18.92 10.29 18.96 10.05C19.01 9.80 18.96 9.55 18.83 9.34L18.77 9.26L18.60 9.05C18.24 8.65 17.79 8.35 17.29 8.16L17.03 8.08C16.34 7.91 15.60 8.00 14.97 8.34Z',
        fill: 'white',
      },
    }],
  };
}

/**
 * Source-code / developer-tools icon (36 x 36) — angle-brackets.
 * @returns {Object} SVG element spec
 * [was: z6O]
 */
export function sourceCodeIcon() { // was: z6O
  return {
    C: 'svg',
    N: {
      height: '100%',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M14.1 24.9L7.2 18.0l6.9-6.9L12.0 9.0l-9.0 9.0 9.0 9.0 2.1-2.1zm7.8 .0l6.9-6.9-6.9-6.9L24.0 9.0l9.0 9.0-9.0 9.0-2.1-2.1z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Thumbs-down / dislike icon (24 x 24).
 * @returns {Object} SVG element spec
 * [was: CnX]
 */
export function dislikeIcon() { // was: CnX
  return {
    C: 'svg',
    N: {
      viewBox: '0 0 24 24',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M0 0h24v24H0z',
        fill: 'none',
      },
    }, {
      C: 'path',
      N: {
        d: 'M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Fast-forward icon (36 x 36, currentColor fill).
 * @returns {Object} SVG element spec
 * [was: MNX]
 */
export function fastForwardIcon() { // was: MNX
  return {
    C: 'svg',
    N: {
      fill: 'currentColor',
      height: '100%',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M 10.00 13.37 v 9.24 c .00 1.12 1.15 1.76 1.98 1.11 L 18.33 18.66 v 3.95 c .00 1.12 1.15 1.77 1.98 1.11 L 27.50 18.00 l -7.18 -5.73 C 19.49 11.60 18.33 12.25 18.33 13.37 v 3.95 l -6.34 -5.06 C 11.15 11.60 10.00 12.25 10.00 13.37 Z',
      },
    }],
  };
}

// ---------------------------------------------------------------------------
// Info / help icons
// ---------------------------------------------------------------------------

/**
 * Info circle / question-mark icon (24 x 24, outlined).
 * Used for "more info" overlays and help buttons.
 * @returns {Object} SVG element spec
 * [was: B1]
 */
export function infoCircleIcon() { // was: B1
  return {
    C: 'svg',
    N: {
      fill: 'none',
      height: '24',
      viewBox: '0 0 24 24',
      width: '24',
    },
    V: [{
      C: 'path',
      N: {
        'clip-rule': 'evenodd',
        d: 'M2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12ZM13 16V18H11V16H13ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM8 10C8 7.79 9.79 6 12 6C14.21 6 16 7.79 16 10C16 11.28 15.21 11.97 14.44 12.64C13.71 13.28 13 13.90 13 15H11C11 13.17 11.94 12.45 12.77 11.82C13.42 11.32 14 10.87 14 10C14 8.9 13.1 8 12 8C10.9 8 10 8.9 10 10H8Z',
        fill: 'white',
        'fill-rule': 'evenodd',
      },
    }],
  };
}

/**
 * Large info circle icon (48 x 48, filled).
 * Used for the INFO_OUTLINE icon type in ad overlays.
 * @returns {Object} SVG element spec
 * [was: Jf7]
 */
export function infoCircleLargeIcon() { // was: Jf7
  return {
    C: 'svg',
    N: {
      fill: '#fff',
      height: '100%',
      version: '1.1',
      viewBox: '0 0 48 48',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M0 0h48v48H0z',
        fill: 'none',
      },
    }, {
      C: 'path',
      N: {
        d: 'M22 34h4V22h-4v12zm2-30C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.82 0-16-7.18-16-16S15.18 8 24 8s16 7.18 16 16-7.18 16-16 16zm-2-22h4v-4h-4v4z',
      },
    }],
  };
}

/**
 * Info circle icon (36 x 36, ytp-svg-fill themed).
 * @returns {Object} SVG element spec
 * [was: R6w]
 */
export function infoCircleThemedIcon() { // was: R6w
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      Z: 'ytp-svg-fill',
      N: {
        d: 'm 17,23 h 2 V 17 H 17 Z M 18,8 C 12.47,8 8,12.47 8,18 8,23.52 12.47,28 18,28 23.52,28 28,23.52 28,18 28,12.47 23.52,8 18,8 Z m 0,18 c -4.41,0 -8,-3.59 -8,-8 0,-4.41 3.59,-8 8,-8 4.41,0 8,3.59 8,8 0,4.41 -3.59,8 -8,8 z M 17,15 h 2 v -2 h -2 z',
      },
    }],
  };
}

/**
 * Thumbs-up / like icon (24 x 24).
 * @returns {Object} SVG element spec
 * [was: kRm]
 */
export function likeIcon() { // was: kRm
  return {
    C: 'svg',
    N: {
      viewBox: '0 0 24 24',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M0 0h24v24H0z',
        fill: 'none',
      },
    }, {
      C: 'path',
      N: {
        d: 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Link / chain icon (36 x 36).
 * @returns {Object} SVG element spec
 * [was: x4]
 */
export function linkIcon() { // was: x4
  return {
    C: 'svg',
    N: {
      height: '100%',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M5.85 18.0c0.0-2.56 2.08-4.65 4.65-4.65h6.0V10.5H10.5c-4.14 .0-7.5 3.36-7.5 7.5s3.36 7.5 7.5 7.5h6.0v-2.85H10.5c-2.56 .0-4.65-2.08-4.65-4.65zM12.0 19.5h12.0v-3.0H12.0v3.0zm13.5-9.0h-6.0v2.85h6.0c2.56 .0 4.65 2.08 4.65 4.65s-2.08 4.65-4.65 4.65h-6.0V25.5h6.0c4.14 .0 7.5-3.36 7.5-7.5s-3.36-7.5-7.5-7.5z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Picture-in-picture icon (24 x 24).
 * @returns {Object} SVG element spec
 * [was: pN7]
 */
export function pictureInPictureIcon() { // was: pN7
  return {
    C: 'svg',
    N: {
      height: '24',
      viewBox: '0 0 24 24',
      width: '24',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M21.20 3.01C21.66 3.05 22.08 3.26 22.41 3.58C22.73 3.91 22.94 4.33 22.98 4.79L23 5V19C23.00 19.49 22.81 19.97 22.48 20.34C22.15 20.70 21.69 20.93 21.20 20.99L21 21H3L2.79 20.99C2.30 20.93 1.84 20.70 1.51 20.34C1.18 19.97 .99 19.49 1 19V13H3V19H21V5H11V3H21L21.20 3.01ZM1.29 3.29C1.10 3.48 1.00 3.73 1.00 4C1.00 4.26 1.10 4.51 1.29 4.70L5.58 9H3C2.73 9 2.48 9.10 2.29 9.29C2.10 9.48 2 9.73 2 10C2 10.26 2.10 10.51 2.29 10.70C2.48 10.89 2.73 11 3 11H9V5C9 4.73 8.89 4.48 8.70 4.29C8.51 4.10 8.26 4 8 4C7.73 4 7.48 4.10 7.29 4.29C7.10 4.48 7 4.73 7 5V7.58L2.70 3.29C2.51 3.10 2.26 3.00 2 3.00C1.73 3.00 1.48 3.10 1.29 3.29ZM19.10 11.00L19 11H12L11.89 11.00C11.66 11.02 11.45 11.13 11.29 11.29C11.13 11.45 11.02 11.66 11.00 11.89L11 12V17C10.99 17.24 11.09 17.48 11.25 17.67C11.42 17.85 11.65 17.96 11.89 17.99L12 18H19L19.10 17.99C19.34 17.96 19.57 17.85 19.74 17.67C19.90 17.48 20.00 17.24 20 17V12L19.99 11.89C19.97 11.66 19.87 11.45 19.70 11.29C19.54 11.13 19.33 11.02 19.10 11.00ZM13 16V13H18V16H13Z',
        fill: 'white',
      },
    }],
  };
}

// ---------------------------------------------------------------------------
// Playback controls (36 x 36, ytp-svg-fill)
// ---------------------------------------------------------------------------

/**
 * Skip-next icon (36 x 36, ytp-svg-fill) — play triangle + end bar.
 * @returns {Object} SVG element spec
 * [was: qQ]
 */
export function skipNextIcon() { // was: qQ
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      Z: 'ytp-svg-fill',
      N: {
        d: 'M 12,24 20.5,18 12,12 V 24 z M 22,12 v 12 h 2 V 12 h -2 z',
      },
    }],
  };
}

/**
 * Skip-next "new" style icon (24 x 24, filled white).
 * @returns {Object} SVG element spec
 * [was: QSw]
 */
export function skipNextNewIcon() { // was: QSw
  return {
    C: 'svg',
    N: {
      fill: 'none',
      height: '24',
      viewBox: '0 0 24 24',
      width: '24',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M20 20C20.26 20 20.51 19.89 20.70 19.70C20.89 19.51 21 19.26 21 19V5C21 4.73 20.89 4.48 20.70 4.29C20.51 4.10 20.26 4 20 4C19.73 4 19.48 4.10 19.29 4.29C19.10 4.48 19 4.73 19 5V19C19 19.26 19.10 19.51 19.29 19.70C19.48 19.89 19.73 20 20 20ZM5.04 19.77L18 12L5.04 4.22C4.84 4.10 4.60 4.03 4.36 4.03C4.12 4.03 3.89 4.09 3.68 4.21C3.47 4.32 3.30 4.49 3.18 4.70C3.06 4.91 2.99 5.14 3 5.38V18.61C2.99 18.85 3.06 19.08 3.18 19.29C3.30 19.50 3.47 19.67 3.68 19.79C3.89 19.90 4.12 19.96 4.36 19.96C4.60 19.96 4.84 19.89 5.04 19.77Z',
        fill: 'white',
      },
    }],
  };
}

/**
 * Notification bell icon (24 x 24, filled white).
 * @returns {Object} SVG element spec
 * [was: g.c_3]
 */
export function notificationBellIcon() { // was: g.c_3
  return {
    C: 'svg',
    N: {
      fill: '#fff',
      height: '24px',
      viewBox: '0 0 24 24',
      width: '24px',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.42 1.43c2.02 1.45 3.39 3.77 3.54 6.42zM18 11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2v-5zm-6 11c.14 0 .27-.01.4-.04.65-.14 1.18-.58 1.44-1.18.1-.24.15-.5.15-.78h-4c.01 1.1.9 2 2.01 2z',
      },
    }],
  };
}

/**
 * Speedometer / playback-rate icon (24 x 24, currentColor).
 * @returns {Object} SVG element spec
 * [was: W_W]
 */
export function speedometerIcon() { // was: W_W
  return {
    C: 'svg',
    N: {
      fill: 'currentColor',
      height: '24',
      viewBox: '0 0 24 24',
      width: '24',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M12 1c1.44 0 2.87.28 4.21.83a11 11 0 0 1 3.45 2.27l-1.81 1.05A9 9 0 0 0 3 12a9 9 0 0 0 18-.00l-.01-.44a8.99 8.99 0 0 0-.14-1.20l1.81-1.05A11.00 11.00 0 0 1 10.51 22.9 11 11 0 0 1 12 1Zm7.08 6.25-7.96 3.25a1.74 1.74 0 1 0 1.73 2.99l6.8-5.26a.57.57 0 0 0-.56-.98Z',
      },
    }],
  };
}

/**
 * External-link / open-in-new icon (48 x 48).
 * @returns {Object} SVG element spec
 * [was: n2]
 */
export function externalLinkIcon() { // was: n2
  return {
    C: 'svg',
    N: {
      fill: '#fff',
      height: '100%',
      version: '1.1',
      viewBox: '0 0 48 48',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M0 0h48v48H0z',
        fill: 'none',
      },
    }, {
      C: 'path',
      N: {
        d: 'M38 38H10V10h14V6H10c-2.21 0-4 1.79-4 4v28c0 2.21 1.79 4 4 4h28c2.21 0 4-1.79 4-4V24h-4v14zM28 6v4h7.17L15.51 29.66l2.83 2.83L38 12.83V20h4V6H28z',
      },
    }],
  };
}

/**
 * Pause icon (36 x 36, ytp-svg-fill) — two vertical bars.
 * @returns {Object} SVG element spec
 * [was: m7W]
 */
export function pauseIcon() { // was: m7W
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      Z: 'ytp-svg-fill',
      N: {
        d: 'M 12,26 16,26 16,10 12,10 z M 21,26 25,26 25,10 21,10 z',
      },
    }],
  };
}

/**
 * Pause icon "new" style (36 x 36, rounded bars).
 * @returns {Object} SVG element spec
 * [was: K_x]
 */
export function pauseNewIcon() { // was: K_x
  return {
    C: 'svg',
    N: {
      fill: 'none',
      height: '36',
      viewBox: '0 0 36 36',
      width: '36',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M 12.75 4.5 L 9.75 4.5 C 9.15 4.5 8.58 4.73 8.15 5.15 C 7.73 5.58 7.5 6.15 7.5 6.75 L 7.5 29.25 C 7.5 29.84 7.73 30.41 8.15 30.84 C 8.58 31.26 9.15 31.5 9.75 31.5 L 12.75 31.5 C 13.34 31.5 13.91 31.26 14.34 30.84 C 14.76 30.41 15 29.84 15 29.25 L 15 6.75 C 15 6.15 14.76 5.58 14.34 5.15 C 13.91 4.73 13.34 4.5 12.75 4.5 Z M 26.25 4.5 L 23.25 4.5 C 22.65 4.5 22.08 4.73 21.65 5.15 C 21.23 5.58 21 6.15 21 6.75 V 29.25 C 21 29.84 21.23 30.41 21.65 30.84 C 22.08 31.26 22.65 31.5 23.25 31.5 L 26.25 31.5 C 26.84 31.5 27.41 31.26 27.84 30.84 C 28.26 30.41 28.5 29.84 28.5 29.25 V 6.75 L 28.5 6.75 C 28.5 6.15 28.26 5.58 27.84 5.15 C 27.41 4.73 26.84 4.5 26.25 4.5 Z',
        fill: 'white',
      },
    }],
  };
}

/**
 * Account / person icon (24 x 24, ytp-svg-fill).
 * @returns {Object} SVG element spec
 * [was: TMW]
 */
export function accountIcon() { // was: TMW
  return {
    C: 'svg',
    N: {
      fill: 'none',
      height: '24',
      viewBox: '0 0 24 24',
      width: '24',
    },
    V: [{
      C: 'path',
      Z: 'ytp-svg-fill',
      N: {
        'clip-rule': 'evenodd',
        d: 'M12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4ZM14 8C14 6.9 13.1 6 12 6C10.9 6 10 6.9 10 8C10 9.1 10.9 10 12 10C13.1 10 14 9.1 14 8ZM18 17C17.8 16.29 14.7 15 12 15C9.3 15 6.2 16.29 6 17.01V18H18V17ZM4 17C4 14.34 9.33 13 12 13C14.67 13 20 14.34 20 17V20H4V17Z',
        'fill-rule': 'evenodd',
      },
    }],
  };
}

/**
 * PIP / miniplayer icon (36 x 36).
 * @returns {Object} SVG element spec
 * [was: D1]
 */
export function miniplayerIcon() { // was: D1
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      N: {
        d: 'M25,17 imul,17 imul,23 L25,23 L25,17 L25,17 Z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 Z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 Z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Play icon (36 x 36, ytp-svg-fill) — right-pointing triangle.
 * @returns {Object} SVG element spec
 * [was: tK]
 */
export function playIcon() { // was: tK
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      Z: 'ytp-svg-fill',
      N: {
        d: 'M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z',
      },
    }],
  };
}

/**
 * Play "new" style icon (36 x 36, filled white triangle).
 * @returns {Object} SVG element spec
 * [was: H1]
 */
export function playNewIcon() { // was: H1
  return {
    C: 'svg',
    N: {
      fill: 'none',
      height: '36',
      viewBox: '0 0 36 36',
      width: '36',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M 17 8.6 L 10.89 4.99 C 9.39 4.11 7.5 5.19 7.5 6.93 C 7.5 6.93 7.5 6.93 7.5 6.93 L 7.5 29.06 C 7.5 30.8 9.39 31.88 10.89 31 C 10.89 31 10.89 31 10.89 31 L 17 27.4 C 17 27.4 17 27.4 17 27.4 C 17 27.4 17 27.4 17 27.4 L 17 8.6 C 17 8.6 17 8.6 17 8.6 C 17 8.6 17 8.6 17 8.6 Z M 17 8.6 L 17 8.6 C 17 8.6 17 8.6 17 8.6 C 17 8.6 17 8.6 17 8.6 V 27.4 C 17 27.4 17 27.4 17 27.4 C 17 27.4 17 27.4 17 27.4 L 33 18 C 33 18 33 18 33 18 C 33 18 33 18 33 18 V 18 L 17 8.6 C 17 8.6 17 8.6 17 8.6 C 17 8.6 17 8.6 17 8.6 Z',
        fill: 'white',
      },
    }],
  };
}

/**
 * YouTube Premium "P" badge icon (24 x 24).
 * Uses a red-to-pink linear gradient background.
 * @returns {Object} SVG element spec
 * [was: okx]
 */
export function youtubePremiumBadgeIcon() { // was: okx
  return {
    C: 'svg',
    N: {
      height: '24px',
      version: '1.1',
      viewBox: '-2 -2 24 24',
      width: '24px',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M 0 1.43 C 0 .64 .64 0 1.43 0 L 18.56 0 C 19.35 0 20 .64 20 1.43 L 20 18.56 C 20 19.35 19.35 20 18.56 20 L 1.43 20 C .64 20 0 19.35 0 18.56 Z M 0 1.43 ',
        fill: '#c00',
      },
    }, {
      C: 'path',
      N: {
        d: 'M 7.88 11.42 L 7.88 15.71 L 5.37 15.71 L 5.37 3.52 L 10.12 3.52 C 11.04 3.52 11.84 3.69 12.54 4.02 C 13.23 4.36 13.76 4.83 14.14 5.45 C 14.51 6.07 14.70 6.77 14.70 7.56 C 14.70 8.75 14.29 9.69 13.48 10.38 C 12.66 11.07 11.53 11.42 10.08 11.42 Z M 7.88 9.38 L 10.12 9.38 C 10.79 9.38 11.30 9.23 11.64 8.91 C 11.99 8.60 12.17 8.16 12.17 7.57 C 12.17 6.98 11.99 6.5 11.64 6.12 C 11.29 5.76 10.80 5.57 10.18 5.56 L 7.88 5.56 Z M 7.88 9.38 ',
        fill: '#fff',
        'fill-rule': 'nonzero',
      },
    }],
  };
}

/**
 * Premium standalone "P" icon (24 x 24) with gradient defs.
 * @returns {Object} SVG element spec
 * [was: r_n]
 */
export function premiumStandaloneIcon() { // was: r_n
  return {
    C: 'svg',
    N: {
      fill: 'none',
      height: '24',
      viewBox: '0 0 24 24',
      width: '24',
    },
    V: [{
      C: 'rect',
      N: {
        fill: 'white',
        height: '20',
        rx: '5',
        width: '20',
        x: '2',
        y: '2',
      },
    }, {
      C: 'rect',
      N: {
        fill: 'url(#ytp-premium-standalone-gradient)',
        height: '20',
        rx: '5',
        width: '20',
        x: '2',
        y: '2',
      },
    }, {
      C: 'path',
      N: {
        d: 'M12.75 13.02H9.98V11.56H12.75C13.24 11.56 13.63 11.48 13.93 11.33C14.22 11.17 14.44 10.96 14.58 10.68C14.72 10.40 14.79 10.09 14.79 9.73C14.79 9.39 14.72 9.08 14.58 8.78C14.44 8.49 14.22 8.25 13.93 8.07C13.63 7.89 13.24 7.80 12.75 7.80H10.54V17H8.70V6.33H12.75C13.58 6.33 14.28 6.48 14.86 6.77C15.44 7.06 15.88 7.46 16.18 7.97C16.48 8.48 16.64 9.06 16.64 9.71C16.64 10.40 16.48 10.99 16.18 11.49C15.88 11.98 15.44 12.36 14.86 12.62C14.28 12.89 13.58 13.02 12.75 13.02Z',
        fill: 'white',
      },
    }, {
      C: 'defs',
      V: [{
        C: 'linearGradient',
        N: {
          gradientUnits: 'userSpaceOnUse',
          id: 'ytp-premium-standalone-gradient',
          OptionalDep: '2',
          x2: '22',
          y1: '22',
          y2: '2',
        },
        V: [{
          C: 'stop',
          N: {
            offset: '0.3',
            'stop-color': '#E1002D',
          },
        }, {
          C: 'stop',
          N: {
            offset: '0.9',
            'stop-color': '#E01378',
          },
        }],
      }],
    }],
  };
}

/**
 * Previous-track icon (36 x 36, ytp-svg-fill) — bar + left triangle.
 * @returns {Object} SVG element spec
 * [was: U7m]
 */
export function previousTrackIcon() { // was: U7m
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      Z: 'ytp-svg-fill',
      N: {
        d: 'm 12,12 h 2 v 12 h -2 z m 3.5,6 8.5,6 V 12 z',
      },
    }],
  };
}

/**
 * Loop / repeat icon (24 x 24).
 * @returns {Object} SVG element spec
 * [was: ILX]
 */
export function loopIcon() { // was: ILX
  return {
    C: 'svg',
    N: {
      fill: 'none',
      height: '24',
      viewBox: '0 0 24 24',
      width: '24',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M7 7H17V10L21 6L17 2V5H5V11H7V7ZM17 17H7V14L3 18L7 22V19H19V13H17V17Z',
        fill: 'white',
      },
    }],
  };
}

/**
 * Refresh / reload arrow icon (36 x 36, ytp-svg-fill).
 * @returns {Object} SVG element spec
 * [was: g.NQ]
 */
export function refreshArrowIcon() { // was: g.NQ
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      Z: 'ytp-svg-fill',
      N: {
        d: 'M 18,11 V 7 l -5,5 5,5 v -4 c 3.3,0 6,2.7 6,6 0,3.3 -2.7,6 -6,6 -3.3,0 -6,-2.7 -6,-6 h -2 c 0,4.4 3.6,8 8,8 4.4,0 8,-3.6 8,-8 0,-4.4 -3.6,-8 -8,-8 z',
      },
    }],
  };
}

/**
 * Settings gear icon (36 x 36).
 * @returns {Object} SVG element spec
 * [was: g.iL]
 */
export function settingsGearIcon() { // was: g.iL
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      N: {
        d: 'm 23.94,18.78 c .03,-0.25 .05,-0.51 .05,-0.78 0,-0.27 -0.02,-0.52 -0.05,-0.78 l 1.68,-1.32 c .15,-0.12 .19,-0.33 .09,-0.51 l -1.6,-2.76 c -0.09,-0.17 -0.31,-0.24 -0.48,-0.17 l -1.99,.8 c -0.41,-0.32 -0.86,-0.58 -1.35,-0.78 l -0.30,-2.12 c -0.02,-0.19 -0.19,-0.33 -0.39,-0.33 l -3.2,0 c -0.2,0 -0.36,.14 -0.39,.33 l -0.30,2.12 c -0.48,.2 -0.93,.47 -1.35,.78 l -1.99,-0.8 c -0.18,-0.07 -0.39,0 -0.48,.17 l -1.6,2.76 c -0.10,.17 -0.05,.39 .09,.51 l 1.68,1.32 c -0.03,.25 -0.05,.52 -0.05,.78 0,.26 .02,.52 .05,.78 l -1.68,1.32 c -0.15,.12 -0.19,.33 -0.09,.51 l 1.6,2.76 c .09,.17 .31,.24 .48,.17 l 1.99,-0.8 c .41,.32 .86,.58 1.35,.78 l .30,2.12 c .02,.19 .19,.33 .39,.33 l 3.2,0 c .2,0 .36,-0.14 .39,-0.33 l .30,-2.12 c .48,-0.2 .93,-0.47 1.35,-0.78 l 1.99,.8 c .18,.07 .39,0 .48,-0.17 l 1.6,-2.76 c .09,-0.17 .05,-0.39 -0.09,-0.51 l -1.68,-1.32 0,0 z m -5.94,2.01 c -1.54,0 -2.8,-1.25 -2.8,-2.8 0,-1.54 1.25,-2.8 2.8,-2.8 1.54,0 2.8,1.25 2.8,2.8 0,1.54 -1.25,2.8 -2.8,2.8 l 0,0 z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Small close-X icon (16 x 16) — for tooltips / panels.
 * @returns {Object} SVG element spec
 * [was: g.yj]
 */
export function closeSmallIcon() { // was: g.yj
  return {
    C: 'svg',
    N: {
      height: '100%',
      viewBox: '0 0 16 16',
      width: '100%',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M13 4L12 3 8 7 4 3 3 4 7 8 3 12 4 13 8 9 12 13 13 12 9 8z',
        fill: '#fff',
      },
    }],
  };
}

/**
 * Side-by-side / vertical-split icon (36 x 36, ytp-svg-fill).
 * @returns {Object} SVG element spec
 * [was: X5K]
 */
export function sideBySideIcon() { // was: X5K
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      Z: 'ytp-svg-fill',
      N: {
        d: 'M 12,25 19,25 19,11 12,11 z M 19,25 26,25 26,11 19,11 z',
      },
    }],
  };
}

/**
 * Side-by-side / vertical-split "new" style icon (36 x 36).
 * @returns {Object} SVG element spec
 * [was: A_0]
 */
export function sideBySideNewIcon() { // was: A_0
  return {
    C: 'svg',
    N: {
      fill: 'none',
      height: '36',
      viewBox: '0 0 36 36',
      width: '36',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M 18 6 L 9 6 C 8.20 6 7.44 6.31 6.87 6.87 C 6.31 7.44 6 8.20 6 9 L 6 27 C 6 27.79 6.31 28.55 6.87 29.12 C 7.44 29.68 8.20 30 9 30 L 18 30 C 18 30 18 30 18 30 C 18 30 18 30 18 30 L 18 6 C 18 30 18 30 18 30 C 18 30 18 30 18 30 Z M 27 6 L 18 6 C 18 6 18 6 18 6 C 18 6 18 6 18 6 V 30 C 18 30 18 30 18 30 C 18 30 18 30 18 30 L 27 30 C 27.79 30 28.55 29.68 29.12 29.12 C 29.68 28.55 30 27.79 30 27 V 9 L 30 9 C 30 8.20 29.68 7.44 29.12 6.87 C 28.55 6.31 27.79 6 27 6 Z',
        fill: 'white',
      },
    }],
  };
}

/**
 * Subtitles / captions icon (24 x 24).
 * @returns {Object} SVG element spec
 * [was: eCd]
 */
export function subtitlesIcon() { // was: eCd
  return {
    C: 'svg',
    N: {
      fill: 'none',
      height: '24',
      viewBox: '0 0 24 24',
      width: '24',
    },
    V: [{
      C: 'path',
      N: {
        d: 'M21.20 3.01L21 3H3L2.79 3.01C2.30 3.06 1.84 3.29 1.51 3.65C1.18 4.02 .99 4.50 1 5V19L1.01 19.20C1.05 19.66 1.26 20.08 1.58 20.41C1.91 20.73 2.33 20.94 2.79 20.99L3 21H21L21.20 20.98C21.66 20.94 22.08 20.73 22.41 20.41C22.73 20.08 22.94 19.66 22.99 19.20L23 19V5C23.00 4.50 22.81 4.02 22.48 3.65C22.15 3.29 21.69 3.06 21.20 3.01ZM3 19V5H21V19H3ZM8 11H6C5.73 11 5.48 11.10 5.29 11.29C5.10 11.48 5 11.73 5 12C5 12.26 5.10 12.51 5.29 12.70C5.48 12.89 5.73 13 6 13H8C8.26 13 8.51 12.89 8.70 12.70C8.89 12.51 9 12.26 9 12C9 11.73 8.89 11.48 8.70 11.29C8.51 11.10 8.26 11 8 11ZM18 11H12C11.73 11 11.48 11.10 11.29 11.29C11.10 11.48 11 11.73 11 12C11 12.26 11.10 12.51 11.29 12.70C11.48 12.89 11.73 13 12 13H18C18.26 13 18.51 12.89 18.70 12.70C18.89 12.51 19 12.26 19 12C19 11.73 18.89 11.48 18.70 11.29C18.51 11.10 18.26 11 18 11ZM18 15H16C15.73 15 15.48 15.10 15.29 15.29C15.10 15.48 15 15.73 15 16C15 16.26 15.10 16.51 15.29 16.70C15.48 16.89 15.73 17 16 17H18C18.26 17 18.51 16.89 18.70 16.70C18.89 16.51 19 16.26 19 16C19 15.73 18.89 15.48 18.70 15.29C18.51 15.10 18.26 15 18 15ZM12 15H6C5.73 15 5.48 15.10 5.29 15.29C5.10 15.48 5 15.73 5 16C5 16.26 5.10 16.51 5.29 16.70C5.48 16.89 5.73 17 6 17H12C12.26 17 12.51 16.89 12.70 16.70C12.89 16.51 13 16.26 13 16C13 15.73 12.89 15.48 12.70 15.29C12.51 15.10 12.26 15 12 15Z',
        fill: 'white',
      },
    }],
  };
}

/**
 * Volume-muted icon (36 x 36, ytp-svg-fill) — speaker with strike-through.
 * @returns {Object} SVG element spec
 * [was: S_]
 */
export function volumeMutedIcon() { // was: S_
  return {
    C: 'svg',
    N: {
      height: '100%',
      version: '1.1',
      viewBox: '0 0 36 36',
      width: '100%',
    },
    V: [{
      C: 'path',
      rA: true, // was: !0
      Z: 'ytp-svg-fill',
      N: {
        d: 'm 21.48,17.98 c 0,-1.77 -1.02,-3.29 -2.5,-4.03 v 2.21 l 2.45,2.45 c .03,-0.2 .05,-0.41 .05,-0.63 z m 2.5,0 c 0,.94 -0.2,1.82 -0.54,2.64 l 1.51,1.51 c .66,-1.24 1.03,-2.65 1.03,-4.15 0,-4.28 -2.99,-7.86 -7,-8.76 v 2.05 c 2.89,.86 5,3.54 5,6.71 z M 9.25,8.98 l -1.27,1.26 4.72,4.73 H 7.98 v 6 H 11.98 l 5,5 v -6.73 l 4.25,4.25 c -0.67,.52 -1.42,.93 -2.25,1.18 v 2.06 c 1.38,-0.31 2.63,-0.95 3.69,-1.81 l 2.04,2.05 1.27,-1.27 -9,-9 -7.72,-7.72 z m 7.72,.99 -2.09,2.08 2.09,2.09 V 9.98 z',
      },
    }],
  };
}

// ---------------------------------------------------------------------------
// Icon resolver (iconType string -> element spec)
// ---------------------------------------------------------------------------

/**
 * Resolve an icon-type descriptor to its SVG element spec.
 *
 * This is the main dispatch function used by ad overlays and button
 * renderers.  The `iconType` string comes from InnerTube responses.
 *
 * @param {Object|null} iconDescriptor  Object with `.iconType` string.
 * @param {boolean}     [isCompact=false]  Whether a compact variant is desired.
 *                                         [was: c]
 * @param {boolean}     [isSmall=false]    Whether a 24px variant is desired.
 *                                         [was: W]
 * @param {boolean}     [useNewStyle=false] Whether to use the "new" filled style.
 *                                         [was: m]
 * @returns {Object|null} SVG element spec, or null if unrecognized.
 * [was: F6]
 */
export function resolveIconType(iconDescriptor, isCompact = false, isSmall = false, useNewStyle = false) { // was: F6
  if (!iconDescriptor) return null;

  switch (iconDescriptor.iconType) {
    case 'OPEN_IN_NEW':
    case 'EXTERNAL_LINK':
      return isSmall
        ? {
            C: 'svg',
            N: {
              fill: '#fff',
              height: '100%',
              version: '1.1',
              viewBox: '0 0 24 24',
              width: '100%',
            },
            V: [{
              C: 'path',
              N: {
                d: 'M21 21H3V3h9v1H4v16h16v-8h1v9zM15 3v1h4.32l-8.03 8.03.71.71 8-8V9h1V3h-6z',
              },
            }],
          }
        : externalLinkIcon(); // was: n2()

    case 'CHECK_BOX':
      return {
        C: 'svg',
        N: {
          height: '100%',
          viewBox: '0 0 24 24',
          width: '100%',
        },
        V: [{
          C: 'path',
          N: {
            d: 'M0 0h24v24H0z',
            fill: 'none',
          },
        }, {
          C: 'path',
          N: {
            d: 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
            fill: '#d4d4d4',
          },
        }],
      };

    case 'CHECK_BOX_OUTLINE_BLANK':
      return {
        C: 'svg',
        N: {
          height: '100%',
          viewBox: '0 0 24 24',
          width: '100%',
        },
        V: [{
          C: 'path',
          N: {
            d: 'M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
            fill: '#d4d4d4',
          },
        }, {
          C: 'path',
          N: {
            d: 'M0 0h24v24H0z',
            fill: 'none',
          },
        }],
      };

    case 'CLOSE':
      return closeIcon(); // was: g.e_()

    case 'INFO_OUTLINE':
      return isCompact
        ? {
            C: 'svg',
            N: {
              fill: '#fff',
              height: '12px',
              style: 'padding-top: 8px',
              viewBox: '0 -960 960 960',
              width: '12px',
            },
            V: [{
              C: 'path',
              N: {
                d: 'M430.09-270.8h101.34V-528H430.09v257.2Zm49.52-338.03q20.94 0 35.34-14.01 14.4-14.01 14.4-34.95 0-20.94-14.01-35.34-14.01-14.39-34.95-14.39-20.94 0-35.34 14.01-14.4 14.01-14.4 34.95 0 20.94 14.01 35.34 14.01 14.39 34.95 14.39Zm.67 548.18q-86.64 0-163.19-32.66-76.56-32.66-133.84-89.94t-89.94-133.8q-32.66-76.51-32.66-163.41 0-87.15 32.72-163.31t90.14-133.61q57.42-57.44 133.79-89.7 76.38-32.27 163.16-32.27 87.14 0 163.31 32.26 76.16 32.26 133.61 89.71 57.45 57.45 89.71 133.86 32.26 76.42 32.26 163.33 0 86.91-32.27 163.08-32.26 76.18-89.7 133.6-57.45 57.42-133.83 90.14-76.39 32.72-163.27 32.72Zm-.33-105.18q131.13 0 222.68-91.49 91.54-91.49 91.54-222.63 0-131.13-91.49-222.68-91.49-91.54-222.63-91.54-131.13 0-222.68 91.49-91.54 91.49-91.54 222.63 0 131.13 91.49 222.68 91.49 91.54 222.63 91.54ZM480-480Z',
              },
            }],
          }
        : infoCircleLargeIcon(); // was: Jf7()

    case 'REMOVE_CIRCLE':
      return {
        C: 'svg',
        N: {
          fill: '#fff',
          height: '100%',
          version: '1.1',
          viewBox: '0 0 24 24',
          width: '100%',
        },
        V: [{
          C: 'path',
          N: {
            d: 'M0 0h24v24H0z',
            fill: 'none',
          },
        }, {
          C: 'path',
          N: {
            d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z',
            fill: '#757575',
          },
        }],
      };

    case 'SKIP_NEXT':
      return skipNextIcon(); // was: qQ()

    case 'SKIP_NEXT_NEW':
      return useNewStyle
        ? skipNextNewIcon() // was: QSw()
        : {
            C: 'svg',
            N: {
              height: '100%',
              viewBox: '-6 -6 36 36',
              width: '100%',
            },
            V: [{
              C: 'path',
              N: {
                d: 'M5,18l10-6L5,6V18L5,18z M19,6h-2v12h2V6z',
                fill: '#fff',
              },
            }],
          };

    case 'LIKE':
      return likeIcon(); // was: kRm()

    case 'DISLIKE':
      return dislikeIcon(); // was: CnX()

    default:
      // Unknown icon type — caller should handle null.
      return null;
  }
}
