/**
 * Shorts and autoplay logic continuation: skip intro, AirPlay, gradient, chapter display,
 * expand button, storyboard preview, fullscreen button, jump buttons.
 * Source: base.js lines 109953–110549
 *
 * [was: IQS] SkipIntroButton — "Skip Intro" overlay button
 * [was: Xbi] AirPlayButton — AirPlay cast button
 * [was: APW] BottomGradient — dynamic bottom gradient using canvas
 * [was: eA9] ChapterContainer — chapter title display in controls
 * [was: VSi] VideoChapterContainer — extends ChapterContainer for video chapters
 * [was: BOZ] ExpandRightBottomButton — small-mode expand right controls button
 * [was: xio] StoryboardFramePreview — storyboard thumbnail preview on seek
 * [was: qy1] FullscreenButton — fullscreen toggle button
 * [was: njS] JumpButton — seek forward/backward N seconds button
 */

import { publishEvent } from '../ads/ad-click-tracking.js';  // was: g.xt
import { cueRangeEndId, cueRangeStartId } from '../ads/ad-scheduling.js';  // was: g.FC, g.Sr
import { onVideoDataChange } from '../player/player-events.js'; // was: Qq
import { StateFlag } from '../player/component-events.js'; // was: mV
import { CueRange } from '../ui/cue-range.js';
import { PlayerComponent } from '../player/component.js';
import { getPlayerSize } from '../player/time-tracking.js';
import { ContainerComponent } from '../player/container-component.js';

// === lines 109953–110021: SkipIntroButton [was: IQS] ===

/**
 * "Skip Intro" button that appears during a video's intro segment.
 * Uses cue ranges to show/hide at configured timestamps.
 * [was: IQS]
 */
export class SkipIntroButton extends PopupWidget { // was: IQS
  constructor(api) { // was: Q
    // super(api, {...}) — builds "Skip Intro" button
    // Listens to videodatachange for intro timing (iL, Wk)
    // Schedules cue range with priority 9, namespace "intro"
    // Click seeks to end of intro (this.Wk / 1000)
  }

  show() {
    super.show();
    this.W.start(); // auto-hide after 5 seconds
  }

  hide() {
    super.hide();
    this.W.stop();
  }

  /** Handle video data loaded — register/unregister intro cue range. [was: Qq] */
  onVideoDataChange(reason, videoData) { // was: Q, c
    if (reason === "dataloaded") {
      this.iL = videoData.iL; // start time ms
      this.Wk = videoData.Wk; // end time ms
      if (isNaN(this.iL) || isNaN(this.Wk)) {
        // Remove existing cue range if times are invalid
        if (this.O) {
          this.U.qI("intro");
          this.U.removeEventListener(cueRangeStartId("intro"), this.J);
          this.U.removeEventListener(cueRangeEndId("intro"), this.j);
          this.U.removeEventListener("onShowControls", this.A);
          this.hide();
          this.O = false; // was: !1
        }
      } else {
        // Register intro cue range
        this.U.addEventListener(cueRangeStartId("intro"), this.J);
        this.U.addEventListener(cueRangeEndId("intro"), this.j);
        this.U.addEventListener("onShowControls", this.A);
        const cueRange = new CueRange(this.iL, this.Wk, {
          priority: 9,
          namespace: "intro",
        });
        this.U.StateFlag([cueRange]);
        this.O = true; // was: !0
      }
    }
  }
}

// === lines 110023–110117: AirPlayButton [was: Xbi] ===

/**
 * AirPlay button with active/inactive icon variants.
 * Visibility gated by player width on embedded players.
 * [was: Xbi]
 */
export class AirPlayButton extends PlayerComponent { // was: Xbi
  constructor(api) { // was: Q
    // super({...}) — builds button with AirPlay SVG icon
    // onClick: triggers api.Hb() (AirPlay)
    // ZF: toggles active/inactive icon based on api.M6()
    // Visibility: width >= 480 for embeds
  }
}

// === lines 110119–110137: BottomGradient [was: APW] ===

/**
 * Dynamic bottom gradient rendered via canvas for controls background.
 * [was: APW]
 */
export class BottomGradient extends PlayerComponent { // was: APW
  constructor(api) { // was: Q
    // super({...}) — div.ytp-gradient-bottom
    // Creates offscreen canvas (1px wide) for gradient rendering
    // vzw() sets gradient height based on player height
  }
}

// === lines 110139–110214: ChapterContainer [was: eA9] ===

/**
 * Chapter title display in the bottom controls bar.
 * Shows current chapter name with chevron for expandable chapter panel.
 * [was: eA9]
 */
export class ChapterContainer extends PlayerComponent { // was: eA9
  constructor(api, progressBar, cueRangeName, tooltipTitle) { // was: Q, c, W, m
    // super({...}) — builds chapter container with title, prefix dot, chevron
    // B listeners: videodatachange, resize, click, cue range enter, loop range change
  }

  onClick() {
    publishEvent(this.U, "innertubeCommand", this.O); // fire chapter navigation command
  }

  /** Update max width based on player size. [was: L] */
  L() {
    if (this.U.X("delhi_modern_web_player")) {
      const size = this.U.getPlayerSize(); // was: Q
      if (size.width) this.element.style.maxWidth = `${size.width * 0.25}px`;
    }
  }
}

// === lines 110216–110248: VideoChapterContainer [was: VSi] ===

/**
 * Concrete chapter container for video chapters (extends ChapterContainer).
 * Tracks chapter index changes and fires onActiveCommand.
 * [was: VSi]
 */
export class VideoChapterContainer extends ChapterContainer { // was: VSi
  constructor(api, progressBar) { // was: Q, c
    super(api, progressBar, "chapterCueRange", "View chapter");
  }
  // onClickCommand(command) — handles chapter panel navigation
  // updateVideoData(reason, videoData) — reads decorated player bar renderer
  // kx() — update chapter title from current time position
}

// === lines 110250–110274: ExpandRightBottomButton [was: BOZ] ===

/**
 * Small-mode toggle button that expands/collapses the right bottom control section.
 * [was: BOZ]
 */
export class ExpandRightBottomButton extends ContainerComponent { // was: BOZ
  constructor(api) { // was: Q
    // super({...}) — builds expand button with arrow icon
    // Click toggles expanded state, publishes small-mode-expand/collapse events
  }
  isExpanded() {
    return this.W;
  }
}

// === lines 110276–110319: StoryboardFramePreview [was: xio] ===

/**
 * Storyboard thumbnail preview shown while seeking.
 * Displays frame from storyboard sprite sheet with timestamp.
 * [was: xio]
 */
export class StoryboardFramePreview extends PlayerComponent { // was: xio
  // constructor: builds frame preview container with timestamp and image
  // A(stateChange) — show/hide on seek/buffer states
  // onProgress() — update displayed frame
  // j() — reset frame index
}

// === lines 110321–110468: FullscreenButton [was: qy1] ===

/**
 * Fullscreen toggle button with enter/exit icons.
 * Handles fullscreen API errors, disabled state message, and keyboard shortcut 'f'.
 * [was: qy1]
 */
export class FullscreenButton extends PlayerComponent { // was: qy1
  constructor(api, chrome) { // was: Q, c
    // super({...}) — builds button with fullscreen icon, aria-keyshortcuts="f"
    // onClick: toggle fullscreen with error catching
    // disable(): shows "fullscreen unavailable" message popup
    // ZF(): visibility based on pTK() and player width
    // Z0(isFullscreen): update icon and tooltip
  }
}

// === lines 110470–110549: JumpButton [was: njS] ===

/**
 * Seek forward/backward button (e.g., +10s / -10s) with circular arrow icon.
 * Shows seek seconds in SVG text element. Spin animation on click.
 * [was: njS]
 */
export class JumpButton extends PlayerComponent { // was: njS
  constructor(api, seconds) { // was: Q, c
    // super({...}) — builds button with circular arrow SVG (forward or back)
    // c > 0 ? forward icon : backward icon
    // Tooltip: "Seek forward/backwards $SECONDS seconds. (arrow)"
    // Text element shows absolute value of seconds
  }
}
