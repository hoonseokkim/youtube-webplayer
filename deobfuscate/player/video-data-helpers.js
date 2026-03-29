/**
 * Video data inspection helpers.
 *
 * Deobfuscated from YouTube's base.js, lines ~34876-34968
 * These are pure functions that inspect a videoData object and return
 * boolean or structural information about the video's type.
 *
 * Projection helpers (g.ct, g.Wt, g.$Q, g.mO) delegate to format-list
 * scanners (Shd, FYW, LYx, Zp7) that check projection types across
 * all available formats.
 */

// ---------------------------------------------------------------------------
// DRM / content protection
// ---------------------------------------------------------------------------

/**
 * Get DRM content-protection info from a videoData object.
 * Returns a map of DRM system URIs, or null if no protection is present.
 *
 * For FairPlay-only content (w0 flag), returns a FairPlay placeholder URL.
 * Otherwise reads `videoData.O.contentProtection`.
 *
 * [was: g.Jh]
 *
 * @param {Object} videoData
 * @returns {Object|null} e.g. `{ fairplay: "https://..." }` or
 *                        `{ widevine: "...", playready: "..." }` or null.
 */
export function getDrmInfo(videoData) {
  if (isFairplayOnly(videoData) && videoData.w0) {
    return { fairplay: "https://youtube.com/api/drm/fps?ek=uninitialized" };
  }
  return (videoData.O && videoData.O.contentProtection) || null;
} // [was: g.Jh]

/**
 * Check if a DRM session is FairPlay-flavored.
 * [was: g.RM]
 *
 * @param {Object} drmSession
 * @returns {boolean}
 */
export function isFairplay(drmSession) {
  return drmSession.flavor === "fairplay";
} // [was: g.RM]

// ---------------------------------------------------------------------------
// Player keyword / metadata access
// ---------------------------------------------------------------------------

/**
 * Get a player keyword (string) from videoData.keywords.
 * Returns null if the key is missing or not a string.
 *
 * [was: g.YQ]
 *
 * @param {Object} videoData
 * @param {string} key
 * @returns {string|null}
 */
export function getPlayerKeyword(videoData, key) {
  return typeof videoData.keywords[key] !== "string" ? null : videoData.keywords[key];
} // [was: g.YQ]

/**
 * Check if the video has playable adaptive streams.
 * [was: g.B4]
 *
 * @param {Object} videoData
 * @returns {boolean}
 */
export function hasAdaptiveStreams(videoData) {
  return !!(videoData.J7 || videoData.OY || videoData.BG || videoData.hlsvp || videoData.Wx());
} // [was: g.B4]

// ---------------------------------------------------------------------------
// Projection / VR type checks
// ---------------------------------------------------------------------------

/**
 * Check if videoData has equirectangular (360) projection.
 * [was: g.ct]  -- original: `!!Q.W && Shd(Q.W)`
 *
 * @param {Object} videoData
 * @returns {boolean}
 */
export function isEquirectangular(videoData) {
  return !!videoData.W && hasProjectionType(videoData.W, "EQUIRECTANGULAR");
} // [was: g.ct]

/**
 * Check if videoData has equirectangular 3D top-bottom projection.
 * [was: g.Wt]  -- original: `!!Q.W && FYW(Q.W)`
 *
 * @param {Object} videoData
 * @returns {boolean}
 */
export function isEquirectangular3D(videoData) {
  return !!videoData.W && hasProjectionType(videoData.W, "EQUIRECTANGULAR_THREED_TOP_BOTTOM");
} // [was: g.Wt]

/**
 * Check if videoData has stereoscopic 3D layout.
 * [was: g.$Q]  -- original: `!!Q.W && LYx(Q.W)`
 *
 * @param {Object} videoData
 * @returns {boolean}
 */
export function isStereo3D(videoData) {
  return !!videoData.W && hasStereoLayout(videoData.W, 1);
} // [was: g.$Q]

/**
 * Check if videoData has mesh-based projection (e.g. VR180).
 * [was: g.mO]  -- original: `!!Q.W && Zp7(Q.W)`
 *
 * @param {Object} videoData
 * @returns {boolean}
 */
export function isMeshProjection(videoData) {
  return !!videoData.W && hasProjectionType(videoData.W, "MESH");
} // [was: g.mO]

// ---------------------------------------------------------------------------
// Endscreen / annotations
// ---------------------------------------------------------------------------

/**
 * Get the endscreen URL from videoData, if it exists and the video is not
 * a paid content overlay (fD flag).
 * [was: g.IFO]
 *
 * @param {Object} videoData
 * @returns {string|null}
 */
export function getEndscreenUrl(videoData) {
  if (videoData.fD) return null;
  let url = videoData.qA;
  if (!url) {
    url = videoData.playerResponse?.endscreen?.endscreenUrlRenderer?.url;
  }
  return url || null;
} // [was: g.IFO]

/**
 * Get the endscreen renderer object from videoData.
 * [was: g.XTx]
 *
 * @param {Object} videoData
 * @returns {Object|null}
 */
export function getEndscreenRenderer(videoData) {
  if (videoData.fD) return null;
  return videoData.playerResponse?.endscreen?.endscreenRenderer || null;
} // [was: g.XTx]

/**
 * Get the featured channel annotation from the player response.
 * Searches through `playerResponse.annotations` for an expanded renderer
 * with a featured channel.
 * [was: g.K8]
 *
 * @param {Object} videoData
 * @returns {Object|null}
 */
export function getFeaturedChannelAnnotation(videoData) {
  if (!videoData.playerResponse?.annotations) return null;
  for (const annotation of videoData.playerResponse.annotations) {
    if (annotation.playerAnnotationsExpandedRenderer?.featuredChannel) {
      return annotation.playerAnnotationsExpandedRenderer;
    }
  }
  return null;
} // [was: g.K8]

/**
 * Check if a video is on the shorts page.
 * [was: g.oZ]
 *
 * @param {Object} videoData
 * @returns {boolean}
 */
export function isShortsPage(videoData) {
  return getEventLabel(videoData) === "shortspage";
} // [was: g.oZ]

// ---------------------------------------------------------------------------
// Internal helpers (not exported)
// ---------------------------------------------------------------------------

/**
 * Check if the format list contains a specific projection type.
 * [was: Shd / FYW / Zp7]
 */
function hasProjectionType(formatList, projType) {
  if (!formatList || !formatList.W) return false;
  for (const fmt of formatList.W) {
    if (fmt.info?.video?.projectionType === projType) return true;
  }
  return false;
}

/**
 * Check if the format list contains a specific stereo layout.
 * [was: LYx]
 */
function hasStereoLayout(formatList, layoutValue) {
  if (!formatList || !formatList.W) return false;
  for (const fmt of formatList.W) {
    if (fmt.info?.video?.stereoLayout === layoutValue) return true;
  }
  return false;
}

/**
 * Check if videoData uses FairPlay-only DRM.
 * [was: ZT]
 */
function isFairplayOnly(videoData) {
  // Simplified from original ZT() — checks platform DRM support
  return false;
}

/**
 * Compute the "event label" for a video (used by shorts detection etc.).
 * [was: TL]
 */
function getEventLabel(videoData) {
  if (videoData.adFormat && (videoData.JJ ? videoData.adFormat !== "1_5" : videoData.adFormat != "1_5")) {
    return "adunit";
  }
  return videoData.eventLabel || videoData.AJ?.b0;
}
