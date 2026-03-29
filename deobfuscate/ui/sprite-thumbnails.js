/**
 * Sprite-Based Storyboard Thumbnail Rendering
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~33648–33727  (Kdx, rIR, Toy, g.XG — sprite sheet loading)
 *                 ~33729–33748  (Uw, UP3 — level selection & frame calculation)
 *                 ~50493–50547  ($Fx, hW, zw — thumbnail display & rendering)
 *
 * Key subsystems:
 *   - Sprite sheet level selection by viewport width (Uw)
 *   - Frame index calculation from playback time (UP3)
 *   - Sprite texture coordinate mapping and CSS scaling ($Fx)
 *   - Lazy sprite sheet image loading with priority queue (rIR, Toy, oA7)
 *   - Thumbnail tile extraction from multi-frame sheets (g.XG)
 *   - Storyboard component lifecycle: subscribes to videodatachange,
 *     progresssync, appresize events
 *   - Frame display with fade-in/out animation
 *
 * [was: Kdx, rIR, Toy, oA7, g.XG, II, Uw, UP3, $Fx, hW, zw]
 */

import { formatDuration } from '../ads/ad-async.js';  // was: g.Pq
import { createByteRange } from '../media/format-parser.js'; // was: Lk
import { isSplitScreenEligible } from '../media/audio-normalization.js'; // was: UP
import { remove } from '../core/array-utils.js';
import { createElement } from '../core/dom-utils.js';
import { getCurrentTime, getPlayerSize } from '../player/time-tracking.js';

// ---------------------------------------------------------------------------
// Sprite Sheet Page Index  (line 33729)
// ---------------------------------------------------------------------------

/**
 * Computes the sprite-sheet page index for a given frame number.
 *
 * Each page holds `columns * rows` frames. This returns which page
 * (zero-indexed) contains the requested frame.
 *
 * @param {Object} level       A storyboard level descriptor.
 *   @param {number} level.columns — columns per sprite page
 *   @param {number} level.rows    — rows per sprite page
 * @param {number} frameIndex  Zero-based frame number.
 * @returns {number}           Page index (0-based).
 *
 * [was: II]
 */
export function getSpritePageIndex(level, frameIndex) { // was: II
  return Math.floor(frameIndex / (level.columns * level.rows));
}

// ---------------------------------------------------------------------------
// Resolution Level Selection  (line 33733)
// ---------------------------------------------------------------------------

/**
 * Selects the best storyboard resolution level for the given viewport width.
 *
 * Iterates through available levels (sorted smallest-to-largest by width)
 * and returns the first level whose width is >= the viewport width.
 * Falls back to the highest resolution level if none qualify.
 * Results are cached in a Map keyed by viewport width.
 *
 * @param {Object} storyboard        Storyboard descriptor.
 *   @param {Map}   storyboard.j     — cache: viewport width -> level index  [was: j]
 *   @param {Array} storyboard.levels — array of resolution-level descriptors
 * @param {number} viewportWidth     Current player viewport width in px.
 * @returns {number}                 Index into `storyboard.levels`.
 *
 * [was: Uw]
 */
export function selectResolutionLevel(storyboard, viewportWidth) { // was: Uw
  let cached = storyboard.j.get(viewportWidth); // was: W
  if (cached) return cached;

  const levelCount = storyboard.levels.length; // was: W (reused)
  for (let i = 0; i < levelCount; i++) { // was: m
    if (storyboard.levels[i].width >= viewportWidth) {
      storyboard.j.set(viewportWidth, i);
      return i;
    }
  }

  storyboard.j.set(viewportWidth, levelCount - 1);
  return levelCount - 1;
}

// ---------------------------------------------------------------------------
// Frame Index from Time  (line 33746)
// ---------------------------------------------------------------------------

/**
 * Computes the frame index for a given playback time within a storyboard.
 *
 * Delegates to the selected resolution level's `.j(time)` method, which
 * maps seconds to a zero-based frame index.
 *
 * @param {Object} storyboard   Storyboard descriptor.
 *   @param {Array} storyboard.levels — resolution-level descriptors
 * @param {number} levelIndex   Index from `selectResolutionLevel`.
 * @param {number} currentTime  Playback position in seconds.
 * @returns {number}            Frame index, or -1 if the level is missing.
 *
 * [was: UP3]
 */
export function getFrameIndexAtTime(storyboard, levelIndex, currentTime) { // was: UP3
  const level = storyboard.levels[levelIndex]; // was: Q (param reassigned)
  return level ? level.j(currentTime) : -1;
}

// ---------------------------------------------------------------------------
// Sprite Sheet Tile Extraction  (line 33706)
// ---------------------------------------------------------------------------

/**
 * Extracts the tile descriptor for a specific frame within a sprite sheet.
 *
 * Handles edge cases at the end of the sheet where the last page may have
 * fewer columns and/or rows than the standard page layout.
 *
 * @param {Object} level   A storyboard resolution level.
 *   @param {number}   level.columns   — columns per page
 *   @param {number}   level.rows      — rows per page
 *   @param {number}   level.width     — tile width in px
 *   @param {number}   level.height    — tile height in px
 *   @param {Function} level.Lk        — returns sprite-sheet URL for page index  [was: Lk]
 *   @param {Function} level.O         — returns total frame count minus 1       [was: O]
 *   @param {Function} level.D         — returns total frame count               [was: D]
 *   @param {Function} level.K         — returns total frame count               [was: K]
 * @param {number} frameIndex  Zero-based frame number.
 * @returns {{url:string, column:number, columns:number, row:number, rows:number, Ab:number, lL:number}}
 *   Tile descriptor with the sprite URL, cell coordinates, effective
 *   column/row counts, and total sheet pixel dimensions (`Ab`=width, `lL`=height).
 *
 * [was: g.XG]
 */
export function extractSpriteTile(level, frameIndex) { // was: g.XG
  if (frameIndex >= level.D()) level.O();

  const pageIndex = getSpritePageIndex(level, frameIndex); // was: W
  const framesPerPage = level.columns * level.rows; // was: m
  let positionInPage = frameIndex % framesPerPage; // was: K
  const column = positionInPage % level.columns; // was: c (reused)
  const row = Math.floor(positionInPage / level.columns); // was: K (reused)

  let effectiveColumns; // was: T
  const remainingFrames = level.O() + 1 - framesPerPage * pageIndex; // was: r

  if (remainingFrames < level.columns) {
    effectiveColumns = remainingFrames;
    positionInPage = 1; // effective rows
  } else {
    effectiveColumns = level.columns;
    positionInPage = remainingFrames < framesPerPage
      ? Math.ceil(remainingFrames / level.columns)
      : level.rows;
  }

  return {
    url: level.createByteRange(pageIndex),
    column,
    columns: effectiveColumns,
    row,
    rows: positionInPage,
    Ab: level.width * effectiveColumns, // was: Ab — total sheet pixel width
    lL: level.height * positionInPage,  // was: lL — total sheet pixel height
  };
}

// ---------------------------------------------------------------------------
// Fallback Tile Lookup  (line 33648)
// ---------------------------------------------------------------------------

/**
 * Finds the best-available loaded tile for a frame, falling back to
 * lower-resolution levels when the preferred level is not yet loaded.
 *
 * Starts at the preferred resolution level for `viewportWidth` and walks
 * downward until a loaded page is found. As a last resort, returns the
 * tile from the lowest-resolution level.
 *
 * @param {Object} storyboard   Storyboard descriptor.
 * @param {number} frameIndex   Zero-based frame number.
 * @param {number} viewportWidth  Player width in px (used to pick preferred level).
 * @returns {Object}            Tile descriptor from `extractSpriteTile`.
 *
 * [was: Kdx]
 */
export function findLoadedTile(storyboard, frameIndex, viewportWidth) { // was: Kdx
  let levelIdx = selectResolutionLevel(storyboard, viewportWidth); // was: W (param reassigned)

  for (; levelIdx >= 0; ) {
    const level = storyboard.levels[levelIdx]; // was: m
    if (
      level.isLoaded(getSpritePageIndex(level, frameIndex)) &&
      (level = extractSpriteTile(level, frameIndex)) // was: m = g.XG(...)
    ) {
      return level;
    }
    levelIdx--;
  }

  return extractSpriteTile(storyboard.levels[0], frameIndex);
}

// ---------------------------------------------------------------------------
// Sprite Sheet Request Enqueuing  (line 33665)
// ---------------------------------------------------------------------------

/**
 * Enqueues image-load requests for a frame's sprite sheet at every
 * resolution level that is not yet loaded, starting from the preferred
 * level and walking down.
 *
 * Each request is deduplicated by a `"level-page"` key stored in the
 * storyboard's `D` Set. Queued requests are prioritised by level index.
 *
 * After enqueuing, triggers the next pending load via `processLoadQueue`.
 *
 * @param {Object} storyboard      Storyboard descriptor.
 *   @param {Set}       storyboard.D  — set of "level-page" keys already queued  [was: D]
 *   @param {Object}    storyboard.A  — priority queue for pending loads          [was: A]
 * @param {number} frameIndex       Zero-based frame number.
 * @param {number} viewportWidth    Player width in px.
 *
 * [was: rIR]
 */
export function enqueueSpritesheetLoads(storyboard, frameIndex, viewportWidth) { // was: rIR
  let levelIdx = selectResolutionLevel(storyboard, viewportWidth); // was: W

  for (let level, pageIndex; levelIdx >= 0; levelIdx--) { // was: r, U
    level = storyboard.levels[levelIdx];
    pageIndex = getSpritePageIndex(level, frameIndex);

    if (!level.isLoaded(pageIndex)) {
      const dedupeKey = `${levelIdx}-${pageIndex}`; // was: I
      if (!storyboard.D.has(dedupeKey)) {
        storyboard.D.add(dedupeKey);
        storyboard.A.enqueue(levelIdx, {
          RT: levelIdx, // was: RT — resolution tier (level index)
          isSplitScreenEligible: pageIndex, // was: UP — spritesheet page index
        });
      }
    }
  }

  processLoadQueue(storyboard); // was: oA7(Q)
}

// ---------------------------------------------------------------------------
// Load Queue Processor  (line 33658)
// ---------------------------------------------------------------------------

/**
 * If no image is currently loading, dequeues the next pending request
 * and starts fetching the sprite sheet image.
 *
 * @param {Object} storyboard  Storyboard descriptor.
 *   @param {HTMLImageElement|null} storyboard.W  — currently-loading <img>  [was: W]
 *   @param {Object}               storyboard.A  — priority queue            [was: A]
 *
 * [was: oA7]
 */
export function processLoadQueue(storyboard) { // was: oA7
  if (!storyboard.W && !storyboard.A.isEmpty()) {
    const request = storyboard.A.remove(); // was: c
    storyboard.W = createSpriteImage(storyboard, request); // was: Toy(Q, c)
  }
}

// ---------------------------------------------------------------------------
// Sprite Image Creation  (line 33684)
// ---------------------------------------------------------------------------

/**
 * Creates an `<img>` element that loads a single sprite-sheet page.
 *
 * On successful load, marks the page as loaded in the level, then
 * re-triggers the load queue. Publishes an `"l"` event with the
 * range of frame indices now available.
 *
 * @param {Object} storyboard  Storyboard descriptor.
 *   @param {string|null} storyboard.crossOrigin — crossOrigin attribute value  [was: crossOrigin]
 *   @param {Array}       storyboard.levels      — resolution levels
 * @param {Object} request  Load request `{ RT, UP }`.
 * @returns {HTMLImageElement}  The image element being loaded.
 *
 * [was: Toy]
 */
export function createSpriteImage(storyboard, request) { // was: Toy
  const img = document.createElement('img'); // was: W
  if (storyboard.crossOrigin) {
    img.crossOrigin = storyboard.crossOrigin;
  }
  img.src = storyboard.levels[request.RT].createByteRange(request.isSplitScreenEligible);

  img.onload = () => {
    let levelIdx = request.RT; // was: m
    let pageIndex = request.isSplitScreenEligible; // was: K

    if (storyboard.W !== null) {
      storyboard.W.onload = null;
      storyboard.W = null;
    }

    const level = storyboard.levels[levelIdx]; // was: m (reused)
    level.loaded.add(pageIndex);
    processLoadQueue(storyboard); // was: oA7(Q)

    const framesPerPage = level.columns * level.rows; // was: T
    const firstFrame = pageIndex * framesPerPage; // was: K (reused)
    const lastFrame = Math.min(firstFrame + framesPerPage - 1, level.K() - 1); // was: m (reused)

    storyboard.publish('l', firstFrame, lastFrame); // was: K = [K, m]; Q.publish("l", ...)
  };

  return img;
}

// ---------------------------------------------------------------------------
// Sprite Texture Coordinate Mapping  (line 50493)
// ---------------------------------------------------------------------------

/**
 * Applies CSS background positioning and sizing to render one tile from
 * a sprite sheet into a thumbnail element.
 *
 * Handles centering margins when the tile does not fill the entire
 * display area, and special-cases very small source tiles (height <= 45)
 * by subtracting a sub-pixel correction.
 *
 * @param {HTMLElement} element         Target DOM element to style.          [was: Q]
 * @param {Object}      tile           Tile descriptor from `extractSpriteTile`.
 *   @param {number} tile.Ab       — full sheet pixel width                   [was: Ab]
 *   @param {number} tile.lL       — full sheet pixel height                  [was: lL]
 *   @param {number} tile.columns  — effective column count
 *   @param {number} tile.rows     — effective row count
 *   @param {number} tile.column   — column index of this tile
 *   @param {number} tile.row      — row index of this tile
 *   @param {string} tile.url      — sprite-sheet image URL
 * @param {number}      maxWidth       Maximum display width in px.           [was: W]
 * @param {number}      maxHeight      Maximum display height in px.          [was: m]
 * @param {boolean}     [isInline=false] If true, skip centering margins      [was: K]
 *                       and apply small-tile height correction.
 *
 * [was: $Fx]
 */
export function applySpriteTextureCoordinates(element, tile, maxWidth, maxHeight, isInline = false) { // was: $Fx
  const tileSourceHeight = tile.lL / tile.rows; // was: T
  let scale = Math.min(maxWidth / (tile.Ab / tile.columns), maxHeight / tileSourceHeight); // was: r

  let sheetWidth = tile.Ab * scale;  // was: U
  let sheetHeight = tile.lL * scale; // was: I

  // Snap to integer multiples of tile count to avoid sub-pixel seams
  sheetWidth = Math.floor(sheetWidth / tile.columns) * tile.columns;
  sheetHeight = Math.floor(sheetHeight / tile.rows) * tile.rows;

  let displayWidth = sheetWidth / tile.columns;   // was: X
  let displayHeight = sheetHeight / tile.rows;     // was: A

  const backgroundX = -tile.column * displayWidth; // was: e
  const backgroundY = -tile.row * displayHeight;   // was: V

  // Small-tile height correction
  if (isInline && tileSourceHeight <= 45) {
    displayHeight -= 1 / scale;
  }
  // Width always gets a sub-pixel trim
  displayWidth -= 2 / scale;

  const style = element.style; // was: Q (reused)
  style.width = `${displayWidth}px`;
  style.height = `${displayHeight}px`;

  if (!isInline) {
    const verticalMargin = (maxHeight - displayHeight) / 2; // was: m (reused)
    const horizontalMargin = (maxWidth - displayWidth) / 2; // was: W (reused)
    style.marginTop = Math.floor(verticalMargin) + 'px';
    style.marginBottom = Math.ceil(verticalMargin) + 'px';
    style.marginLeft = Math.floor(horizontalMargin) + 'px';
    style.marginRight = Math.ceil(horizontalMargin) + 'px';
  }

  style.background = `url(${tile.url}) ${backgroundX}px ${backgroundY}px/${sheetWidth}px ${sheetHeight}px`;
}

// ---------------------------------------------------------------------------
// Storyboard Thumbnail Setup  (line 50518)
// ---------------------------------------------------------------------------

/**
 * Initialises or tears down the storyboard thumbnail component.
 *
 * When a valid storyboard is provided, subscribes to three player events:
 *   - `videodatachange` — re-fetches storyboard on video data change
 *   - `progresssync`    — updates thumbnail on playback progress
 *   - `appresize`       — re-renders thumbnail when player is resized
 *
 * Immediately triggers an initial render via `renderStoryboardFrame`,
 * then shows the thumbnail with a 200 ms fade-in.
 *
 * When called with a falsy storyboard, unsubscribes events and hides
 * the thumbnail.
 *
 * @param {Object}      component   Thumbnail UI component.
 *   @param {boolean}       component.W           — previous storyboard presence flag  [was: W]
 *   @param {Object}        component.api         — player API reference
 *   @param {Object}        component.events      — event subscription helper
 *   @param {Function}      component.onProgress  — progress callback
 *   @param {Function}      component.j           — resize callback                   [was: j]
 *   @param {number}        component.frameIndex  — currently displayed frame index
 *   @param {Object}        component.fade        — fade animation controller
 * @param {Object|null} storyboard  Storyboard descriptor (null to disable).  [was: c]
 *
 * [was: hW]
 */
export function setupStoryboardThumbnail(component, storyboard) { // was: hW
  const hadStoryboard = !!component.W; // was: W
  component.W = storyboard;

  if (component.W) {
    if (!hadStoryboard) {
      component.events.B(component.api, 'videodatachange', () => {
        setupStoryboardThumbnail(component, component.api.sV());
      });
      component.events.B(component.api, 'progresssync', component.onProgress);
      component.events.B(component.api, 'appresize', component.j);
    }
    component.frameIndex = NaN;
    renderStoryboardFrame(component); // was: zw(Q)
    component.fade.show(200);
  } else {
    if (hadStoryboard) component.events.O();
    component.fade.hide();
    component.fade.stop();
  }
}

// ---------------------------------------------------------------------------
// Storyboard Frame Rendering  (line 50534)
// ---------------------------------------------------------------------------

/**
 * Renders the sprite-sheet thumbnail for the current playback position.
 *
 * 1. Selects the best resolution level for the current player width.
 * 2. Computes the frame index from the current playback time.
 * 3. Updates the displayed timestamp text.
 * 4. If the frame has changed, enqueues the sprite-sheet load,
 *    finds the best loaded tile, and applies texture coordinates.
 *
 * @param {Object} component  Storyboard thumbnail component.
 *   @param {Object}        component.W          — storyboard descriptor       [was: W]
 *   @param {Object}        component.api        — player API reference
 *   @param {number}        component.frameIndex — last displayed frame index
 *   @param {HTMLElement}   component.O          — <img> element for display    [was: O]
 *
 * [was: zw]
 */
export function renderStoryboardFrame(component) { // was: zw
  const storyboard = component.W; // was: c
  const currentTime = component.api.getCurrentTime(); // was: W
  const playerSize = component.api.bX().getPlayerSize(); // was: m

  let levelIndex = selectResolutionLevel(storyboard, playerSize.width); // was: K
  const frameIndex = getFrameIndexAtTime(storyboard, levelIndex, currentTime); // was: K (reused via UP3)

  component.update({
    timestamp: formatDuration(currentTime), // was: g.$4(W)
  });

  if (frameIndex !== component.frameIndex) {
    component.frameIndex = frameIndex;
    enqueueSpritesheetLoads(storyboard, frameIndex, playerSize.width); // was: rIR(c, K, m.width)

    const tile = findLoadedTile(storyboard, frameIndex, playerSize.width); // was: c = Kdx(c, K, m.width)
    applySpriteTextureCoordinates(component.O, tile, playerSize.width, playerSize.height);
  }
}
