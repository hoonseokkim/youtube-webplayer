/**
 * Timed marker tail code: chapter hover container, progress position tracker,
 * timed marker element, and progress bar container (ZRD) setup.
 * Source: base.js lines 111562–111799
 *
 * [was: (anon class)] ChapterHoverSegment — individual chapter segment in progress bar
 * [was: Fk1] ProgressBarPosition — tracks mouse/touch position on progress bar
 * [was: ZfO] TimedMarker — a single timed marker on the progress bar
 * [was: g.ZRD] ProgressBarContainer — full progress bar with chapters, markers, scrubber, heat map, fine scrubbing
 */

import { cueRangeStartId } from '../ads/ad-scheduling.js';  // was: g.Sr
import { registerDisposable } from '../core/event-system.js';  // was: g.F
import { updateVideoData } from '../features/autoplay.js';  // was: g.Sm
import { invokeUnaryRpc } from '../media/bitstream-reader.js'; // was: BG
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { isCompressedDomainComposite } from '../media/audio-normalization.js'; // was: gA
import { skipNextIcon } from './svg-icons.js'; // was: qQ
import { EXP_748402147 } from '../proto/messages-core.js'; // was: Hw
import { toggleFineScrub } from './seek-bar-tail.js'; // was: EC
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { resetBufferPosition } from '../modules/caption/caption-internals.js'; // was: Er
import { showSampleSubtitles } from '../modules/caption/caption-internals.js'; // was: u9
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { SLOT_MESSAGE_MARKER } from '../proto/messages-core.js'; // was: Ww
import { captureBandwidthSnapshot } from '../ads/ad-prebuffer.js'; // was: x$
import { RemoteConnection } from '../modules/remote/remote-player.js'; // was: xq
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { appendInitSegment } from '../media/mse-internals.js'; // was: qF
import { ensureSingleChapter } from './progress-bar-impl.js'; // was: DGm
import { onVideoDataChange } from '../player/player-events.js'; // was: Qq
import { unwrapTrustedResourceUrl } from '../core/composition-helpers.js'; // was: x3
import { SIGNAL_TRACKING } from '../data/session-storage.js'; // was: zT
import { getFieldSentinel } from '../core/bitstream-helpers.js'; // was: $F
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { shouldShowProgressBar } from './progress-bar-impl.js'; // was: Kv
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { registerAdTimelinePlayback } from '../ads/dai-cue-range.js'; // was: Rt
import { PlayerComponent } from '../player/component.js';
import { clamp } from '../core/math-utils.js';
import { ContainerComponent } from '../player/container-component.js';
import { getLoopRange } from '../player/player-api.js';
import { getPageOffset } from '../core/dom-utils.js';
import { registerTooltip } from './progress-bar-impl.js';
// TODO: resolve g.iG
// TODO: resolve g.zY

// === lines 111562–111605: ChapterHoverSegment (anonymous class) ===

/**
 * A single chapter segment within the progress bar.
 * Contains play progress, live buffer, load progress, hover progress, and ad progress layers.
 * Constructor is anonymous (inline class expression).
 */
export class ChapterHoverSegment extends PlayerComponent {
  constructor() {
    super({
      C: "div",
      Z: "ytp-chapter-hover-container",
      V: [
        { C: "div", Z: "ytp-progress-bar-padding" },
        {
          C: "div",
          Z: "ytp-progress-list",
          V: [
            { C: "div", yC: ["ytp-play-progress", "ytp-swatch-background-color"] },
            { C: "div", Z: "ytp-progress-linear-live-buffer" },
            { C: "div", Z: "ytp-load-progress" },
            { C: "div", Z: "ytp-hover-progress" },
            { C: "div", Z: "ytp-ad-progress-list" },
          ],
        },
      ],
    });
    this.startTime = NaN;
    this.title = "";
    this.index = NaN;
    this.width = 0;
    this.O = this.z2("ytp-progress-list"); // progress list container
    this.K = this.z2("ytp-progress-linear-live-buffer"); // live buffer bar
    this.j = this.z2("ytp-ad-progress-list"); // ad progress overlay
    this.D = this.z2("ytp-load-progress"); // load progress bar
    this.J = this.z2("ytp-play-progress"); // play progress bar
    this.A = this.z2("ytp-hover-progress"); // hover progress bar
    this.W = this.z2("ytp-chapter-hover-container"); // root container
  }

  /**
   * Get the DOM element for a specific progress type.
   * [was: Ae]
   * @param {string} type - "PLAY_PROGRESS" | "LOAD_PROGRESS" | "LIVE_BUFFER" | default (hover)
   */
  Ae(type) { // was: Q
    return type === "PLAY_PROGRESS"
      ? this.J
      : type === "LOAD_PROGRESS"
        ? this.D
        : type === "LIVE_BUFFER"
          ? this.K
          : this.A;
  }
}

// === lines 111607–111619: ProgressBarPosition [was: Fk1] ===

/**
 * Tracks the current mouse/touch position within the progress bar,
 * computing relative position within the usable width area.
 * [was: Fk1]
 */
export class ProgressBarPosition { // was: Fk1
  constructor() {
    this.O = NaN; // normalized position (0–1) // was: this.O
    this.position = NaN; // clamped pixel position // was: this.position
    this.A = NaN; // position minus left padding // was: this.A
    this.W = NaN; // usable width // was: this.W
    this.j = NaN; // left padding // was: this.j
    this.width = NaN; // total width // was: this.width
  }

  /**
   * Update position tracking from raw pixel value.
   * [was: update]
   * @param {number} rawPosition - raw pixel position [was: Q]
   * @param {number} totalWidth - total progress bar width [was: c]
   * @param {number} leftPadding - left padding offset [was: W]
   * @param {number} rightPadding - right padding offset [was: m]
   */
  update(rawPosition, totalWidth, leftPadding = 0, rightPadding = 0) { // was: Q, c, W=0, m=0
    this.width = totalWidth;
    this.j = leftPadding;
    this.W = totalWidth - leftPadding - rightPadding;
    this.position = clamp(rawPosition, leftPadding, leftPadding + this.W);
    this.A = this.position - leftPadding;
    this.O = this.A / this.W;
  }
}

// === lines 111621–111631: TimedMarker [was: ZfO] ===

/**
 * A single timed marker displayed on the progress bar.
 * [was: ZfO]
 */
export class TimedMarker extends PlayerComponent { // was: ZfO
  constructor() {
    super({
      C: "div",
      Z: "ytp-timed-marker",
    });
    this.W = NaN; // was: this.W
    this.timeRangeStartMillis = NaN;
    this.title = "";
    this.onActiveCommand = undefined; // was: void 0
  }
}

// === lines 111633–111799: ProgressBarContainer [was: g.ZRD] ===

/**
 * The complete progress bar container including:
 * - Chapter segments
 * - Timed markers
 * - Clip start/end handles
 * - Scrubber with pull indicator and decorated button
 * - Heat map overlay
 * - Fine scrubbing panel
 * - Bound time labels
 * [was: g.ZRD]
 */
export class ProgressBarContainer extends ContainerComponent { // was: g.ZRD
  constructor(api, chrome) { // was: Q, c
    super({
      C: "div",
      Z: "ytp-progress-bar-container",
      N: { "aria-disabled": "true" },
      V: [
        { C: "div", yC: ["ytp-heat-map-container"], V: [{ C: "div", Z: "ytp-heat-map-edu" }] },
        {
          C: "div",
          yC: ["ytp-progress-bar"],
          N: {
            tabindex: "0",
            role: "slider",
            "aria-label": "Seek slider",
            "aria-valuemin": "{{ariamin}}",
            "aria-valuemax": "{{ariamax}}",
            "aria-valuenow": "{{arianow}}",
            "aria-valuetext": "{{arianowtext}}",
          },
          V: [
            { C: "div", Z: "ytp-chapters-container" },
            { C: "div", Z: "ytp-timed-markers-container" },
            { C: "div", Z: "ytp-clip-start-exclude" },
            { C: "div", Z: "ytp-clip-end-exclude" },
            {
              C: "div",
              Z: "ytp-scrubber-container",
              V: [{
                C: "div",
                yC: ["ytp-scrubber-button", "ytp-swatch-background-color"],
                V: [
                  { C: "div", Z: "ytp-scrubber-pull-indicator" },
                  { C: "img", yC: ["ytp-decorated-scrubber-button"] },
                ],
              }],
            },
          ],
        },
        { C: "div", yC: ["ytp-fine-scrubbing-container"], V: [{ C: "div", Z: "ytp-fine-scrubbing-edu" }] },
        { C: "div", Z: "ytp-bound-time-left", eG: "{{boundTimeLeft}}" },
        { C: "div", Z: "ytp-bound-time-right", eG: "{{boundTimeRight}}" },
        { C: "div", Z: "ytp-clip-start", N: { title: "{{clipstarttitle}}" }, eG: "{{clipstarticon}}" },
        { C: "div", Z: "ytp-clip-end", N: { title: "{{clipendtitle}}" }, eG: "{{clipendicon}}" },
      ],
    });

    this.api = api;
    this.YR = false; // was: !1 — is scrubbing active
    this.pF = 0; // was: this.pF — various progress state values
    this.J = 0;
    this.T2 = 0;
    this.JJ = 0;
    this.r_ = 0;
    this.qY = 0;
    this.invokeUnaryRpc = null;
    this.FO = false; // was: !1
    this.XI = {};
    this.Xw = {};
    this.clipEnd = Infinity;
    this.MQ = this.z2("ytp-clip-end");
    this.u3 = new g.iG(this.MQ, true); // was: !0 — hover tracker for clip end
    this.mainVideoEntityActionMetadataKey = this.z2("ytp-clip-end-exclude");
    this.isCompressedDomainComposite = this.z2("ytp-clip-start-exclude");
    this.clipStart = 0;
    this.skipNextIcon = this.z2("ytp-clip-start");
    this.EXP_748402147 = new g.iG(this.skipNextIcon, true); // was: !0 — hover tracker for clip start
    this.toggleFineScrub = 0; // was: this.S
    this.S = 0;
    this.progressBar = this.z2("ytp-progress-bar");
    this.isInAdPlayback = {};
    this.parseHexColor = {};
    this.La = this.z2("ytp-chapters-container");
    this.UR = this.z2("ytp-timed-markers-container");
    this.W = []; // chapter segments
    this.L = []; // timed markers
    this.tQ = {};
    this.xi = null;
    this.Ka = -1;
    this.jG = 0;
    this.Fw = 0;
    this.AA = null; // was: this.Y
    this.Y = null;
    this.resetBufferPosition = this.z2("ytp-scrubber-button");
    this.Ie = this.z2("ytp-decorated-scrubber-button");
    this.showSampleSubtitles = this.z2("ytp-scrubber-container");
    this.instreamAdPlayerOverlayRenderer = new g.zY(); // scrubber position
    this.SLOT_MESSAGE_MARKER = 0;
    this.OR = new ProgressBarPosition(); // was: new Fk1
    this.A = new qc(0, 0);
    this.captureBandwidthSnapshot = null; // loop range
    this.vj = false; // was: this.D — dragging state
    this.D = false;
    this.RemoteConnection = null;
    this.isSamsungSmartTV = this.z2("ytp-heat-map-container");
    this.w6 = this.z2("ytp-heat-map-edu");
    this.j = []; // heat map data
    this.heatMarkersDecorations = [];
    this.Y0 = this.z2("ytp-fine-scrubbing-container");
    this.dA = this.z2("ytp-fine-scrubbing-edu");
    this.O = undefined; // was: void 0 — fine scrubbing panel
    this.UH = false; // was: !1
    this.U7 = false;
    this.PA = false;

    // Set up tooltip, clip handle hover/click, event listeners
    this.tooltip = chrome.d6();
    this.addOnDisposeCallback(registerTooltip(this.tooltip, this.MQ));
    registerDisposable(this, this.u3);
    this.u3.subscribe("hoverstart", this.Is, this);
    this.u3.subscribe("hoverend", this.appendInitSegment, this);
    this.B(this.MQ, "click", this.nO);
    this.addOnDisposeCallback(registerTooltip(this.tooltip, this.skipNextIcon));
    registerDisposable(this, this.EXP_748402147);
    this.EXP_748402147.subscribe("hoverstart", this.Is, this);
    this.EXP_748402147.subscribe("hoverend", this.appendInitSegment, this);
    this.B(this.skipNextIcon, "click", this.nO);
    ensureSingleChapter(this); // initialize drag tracking

    // Event bindings
    this.B(api, "resize", this.b3);
    this.B(api, "presentingplayerstatechange", this.aq);
    this.B(api, "videodatachange", this.onVideoDataChange);
    this.B(api, "videoplayerreset", this.FN);
    this.B(api, "cuerangesadded", this.pB);
    this.B(api, "cuerangesremoved", this.I_);
    this.B(api, "onLoopRangeChange", this.unwrapTrustedResourceUrl);
    this.B(api, "innertubeCommand", this.onClickCommand);
    this.B(api, "onRetroModeChanged", this.ws);
    this.B(api, cueRangeStartId("timedMarkerCueRange"), this.a_);
    this.B(api, "updatemarkervisibility", this.SIGNAL_TRACKING);
    this.B(api, getFieldSentinel(api.G().getExperimentFlags) ? "playbackChange" : "serverstitchedvideochange", this.R_);

    this.updateVideoData(api.getVideoData(), true); // was: !0
    this.unwrapTrustedResourceUrl(api.getLoopRange());

    // Fine scrubbing setup
    if (shouldShowProgressBar(this) && !this.O) {
      this.O = new SyZ(this.api, this.tooltip);
      const progressBarLeft = getPageOffset(this.element).x || 0; // was: Q
      this.O.b3(progressBarLeft, this.J);
      this.O.createVisualElement(this.Y0);
      registerDisposable(this, this.O);
      this.B(this.O.dismissButton, "click", this.Ei);
      this.B(this.O.playButton, "click", this.registerAdTimelinePlayback);
      this.B(this.O.element, "dblclick", this.registerAdTimelinePlayback);
    }

    this.api.createClientVe(this.isSamsungSmartTV, this, 139609, true); // was: !0
    this.api.createClientVe(this.w6, this, 140127, true); // was: !0
  }
}
