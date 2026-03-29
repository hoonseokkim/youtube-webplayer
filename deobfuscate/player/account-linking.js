import { dispose } from '../ads/dai-cue-range.js';
import { onVideoDataChange } from './player-events.js';
import { linkIcon } from '../ui/svg-icons.js'; // was: x4
import { Disposable } from '../core/disposable.js';
import { getExperimentFlag, listen } from '../core/composition-helpers.js';
import { MenuItem } from './drm-setup.js';
import { logClick } from '../data/visual-element-tracking.js';
import { getPlayerResponse, getWatchNextResponse } from './player-api.js';
import { getAnnotationsModule } from './caption-manager.js';

/**
 * Account linking — controller, menu items, and audio settings enum.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~87719–88105
 *
 * Classes and constants:
 *   G2R  -> LinkedAccountMenuItem     — settings menu item for linked accounts
 *   yT   -> PlayerModule              — base class for player modules (line 87759)
 *   $vR  -> AccountLinkController     — manages account-linking state
 *   PJ_  -> AdPlaybackRateEnforcer    — forces playback rate to 1x during ads
 *   l3x  -> AdTrackingPingState       — holds ad tracking ping state
 *   u9d  -> AdTrackingPingController  — fires ad tracking pings at milestones
 *   hSR  -> AdsClientStateReporter    — reports PML signal to external listeners
 *   zSx  -> AccumulatedWatchTimeTracker — tracks accumulated watch time per CPN
 *   Si   -> ToggleMenuItem            — checkbox-style settings menu item
 *   CJy  -> AudioSettingsType (enum)  — audio feature types
 *   MA_  -> AnnotationsMenuItem       — annotations toggle in settings menu
 *   J$d  -> AnnotationsController     — registers the annotations menu item
 *
 * [was: G2R, yT, $vR, PJ_, l3x, u9d, hSR, zSx, Si, CJy, MA_, J$d]
 */

// import { Disposable }  from '../core/disposable.js';
// import { UIComponent } from './base-component.js';    // was: g.k
// import { MenuItem }    from '../ui/menu-item.js';     // was: g.oo

// ---------------------------------------------------------------------------
// AudioSettingsType  [was: CJy] (line 88021)
// ---------------------------------------------------------------------------

/**
 * Enum for audio settings feature types.  The object uses a bidirectional
 * mapping (numeric key -> string name, string key -> numeric value).
 *
 * [was: CJy]
 */
export const AudioSettingsType = Object.freeze({
  /** Audio track selection.  Value 2. */
  AUDIO_TRACK:   2,  // was: KM: 2
  /** Voice boost / loudness normalization.  Value 1. */
  VOICE_BOOST:   1,  // was: E4: 1
  /** Stable volume / dynamic range compression.  Value 0. */
  STABLE_VOLUME: 0,  // was: tO: 0

  // Reverse mapping (numeric -> string)
  2: "AUDIO_TRACK",
  1: "VOICE_BOOST",
  0: "STABLE_VOLUME",
});

// ---------------------------------------------------------------------------
// Supported annotation locales (line 88029)
// ---------------------------------------------------------------------------

/**
 * Locales that support annotations.
 * @type {string[]}
 *
 * was: p8
 */
export const ANNOTATION_SUPPORTED_LOCALES = ["en-CA", "en", "es-MX", "fr-CA"];
// was: var p8 = [...]

// ---------------------------------------------------------------------------
// PlayerModule  [was: yT] (line 87759)
// ---------------------------------------------------------------------------

/**
 * Minimal base class for player modules.  Stores an `api` reference
 * and provides an `X()` shorthand for reading experiment flags.
 *
 * [was: yT]
 */
export class PlayerModule /* extends Disposable */ {
  /**
   * @param {Object} api — the player API [was: Q]
   */
  constructor(api) {
    // super();
    /** Player API reference. */
    this.api = api;
  }

  /**
   * Check an experiment flag via the player API.
   *
   * @param {string} flagName [was: Q]
   * @returns {boolean}
   *
   * was: X(Q) (line 87764)
   */
  getExperimentFlag(flagName) { // was: X
    return this.api.X(flagName);
  }
}

// ---------------------------------------------------------------------------
// LinkedAccountMenuItem  [was: G2R] (line 87719)
// ---------------------------------------------------------------------------

/**
 * Settings menu item shown when the user's account is linked to a
 * third-party service.  Displays an icon, a label from the server
 * config, and opens a dialog on click.
 *
 * Extends the base MenuItem class (g.oo) with ARIA `haspopup` attribute
 * and the `ytp-linked-account-menuitem` CSS class.
 *
 * [was: G2R]
 */
export class LinkedAccountMenuItem /* extends MenuItem */ {
  /**
   * @param {Object} api — the player API [was: Q]
   */
  constructor(api) {
    // super(g.up({ "aria-haspopup": "true" }, ["ytp-linked-account-menuitem"]), 2);

    /** @private  Player API. [was: this.U] */
    this.playerApi = api;

    /** @private  Whether the item is currently shown. [was: this.W] */
    this.isShown = false; // was: this.W = !1

    /** @private  Whether tracking params are set. [was: this.O] */
    this.hasTracking = false; // was: this.O = !1

    /** @private  Settings menu controller ref. [was: this.Ik] */
    this.settingsMenu = api.lU(); // was: Q.lU()

    // Register the element for server-side visual elements
    api.createServerVe(this.element, this, true);
    // was: Q.createServerVe(this.element, this, !0)

    // Listen for settings menu visibility changes
    this.listen(this.playerApi, "settingsMenuVisibilityChanged", (visible) => {
      this.onMenuVisibilityChanged(visible); // was: this.z7(c)
    });

    // Listen for video data changes to update linked state
    this.listen(this.playerApi, "videodatachange", () => this.refresh());

    // Listen for click events
    this.listenSelf("click", () => this.onClick());

    // Initial refresh
    this.refresh();
  }

  /**
   * Handle settings-menu visibility change — log visibility if applicable.
   * @param {boolean} visible
   *
   * was: z7(Q) (line 87736)
   */
  onMenuVisibilityChanged(visible) { // was: z7
    if (this.hasTracking) {
      this.playerApi.logVisibility(this.element, this.isShown && visible);
    }
  }

  /**
   * Refresh the menu item based on the current video data's
   * `accountLinkingConfig.linked` state.
   *
   * was: j() (line 87739)
   */
  refresh() { // was: j
    const linked = this.playerApi.getVideoData()?.accountLinkingConfig?.linked;

    if (linked && !this.isShown) {
      const config = this.playerApi.getVideoData()?.accountLinkingConfig;

      // Set icon (linked-account icon)
      this.setIcon(/* linkIcon() */); // was: this.setIcon(x4())

      // Set label from server config
      this.setLabel(config?.menuData?.connectedMenuLabel); // was: g.hV(this, zL(...))

      // Create the confirmation dialog
      this.dialog = /* new LinkedAccountDialog(
        this.playerApi,
        config?.menuData?.connectedDialogTitle,
        config?.menuData?.connectedDialogMessage,
        config?.menuData?.confirmButtonText,
      ) */; // was: new a3O(...)
      // g.F(this, this.A) — register for disposal

      // Set tracking params if available
      const trackingParams = config?.menuData?.trackingParams || null;
      this.hasTracking = !!trackingParams; // was: this.O = !!Q
      if (this.hasTracking) {
        this.playerApi.setTrackingParams(this.element, trackingParams);
      }

      // Add to settings menu
      this.settingsMenu.T7(this); // was: this.Ik.T7(this)
      this.isShown = true;
    } else if (!linked && this.isShown) {
      // Remove from settings menu
      this.settingsMenu.yj(this); // was: this.Ik.yj(this)
      this.isShown = false;
    }
  }

  /**
   * Handle click — log the click and open the confirmation dialog.
   *
   * was: onClick() (line 87752)
   */
  onClick() {
    if (this.hasTracking) {
      this.playerApi.logClick(this.element);
    }
    this.settingsMenu.HB(); // was: this.Ik.HB() — close the menu
    if (this.dialog) {
      this.dialog.Bw(); // was: this.A.Bw() — show the dialog
    }
  }
}

// ---------------------------------------------------------------------------
// AccountLinkController  [was: $vR] (line 87769)
// ---------------------------------------------------------------------------

/**
 * Player module that manages the account-linking feature.  Listens for
 * `setAccountLinkState` and `updateAccountLinkingConfig` commands, and
 * reacts to `videodatachange` to extract the `accountLinkingConfig` from
 * player responses.
 *
 * When the settings menu initialises, it creates a `LinkedAccountMenuItem`.
 *
 * [was: $vR]
 */
export class AccountLinkController extends PlayerModule {
  /**
   * @param {Object} api — the player API [was: Q]
   */
  constructor(api) {
    super(api);

    /** @private  The linked-account menu item (created lazily). [was: this.menuItem] */
    this.menuItem = null;

    // Register command handlers
    api.registerCommand("setAccountLinkState", (state) => {
      this.setAccountLinkState(state);
    });
    // was: R(Q, "setAccountLinkState", c => { this.setAccountLinkState(c) })

    api.registerCommand("updateAccountLinkingConfig", (config) => {
      this.updateAccountLinkingConfig(config);
    });
    // was: R(Q, "updateAccountLinkingConfig", c => { this.updateAccountLinkingConfig(c) })

    // Listen for video data changes
    api.addEventListener("videodatachange", (_event, videoData) => {
      this.onVideoDataChange(videoData);
    });

    // When settings menu initialises, create the menu item
    api.addEventListener("settingsMenuInitialized", () => {
      this.menuItem = new LinkedAccountMenuItem(this.api);
      // g.F(this, this.menuItem) — register for disposal
    });
  }

  /**
   * Handle video data changes.  If the video data does not already have
   * `accountLinkingConfig`, extract it from the player response.
   * Also propagate the ALS param.
   *
   * @param {Object} videoData [was: Q]
   *
   * was: onVideoDataChange(Q) (line 87790)
   */
  onVideoDataChange(videoData) {
    if (!videoData.accountLinkingConfig) {
      const config = videoData.getPlayerResponse()?.accountLinkingConfig;
      videoData.accountLinkingConfig = config;
    }

    const alsParam = videoData.accountLinkingConfig?.alsParam;
    if (alsParam) {
      videoData.Lf = alsParam; // was: Q.Lf = c
    }
  }

  /**
   * Set the account link state (ALS param) on the current video data
   * and trigger a force-publish to notify listeners.
   *
   * @param {*} state [was: Q]
   *
   * was: setAccountLinkState(Q) (line 87798)
   */
  setAccountLinkState(state) {
    this.api.getVideoData().Lf = state; // was: this.api.getVideoData().Lf = Q
    this.api.FP(); // was: this.api.FP() — force publish
  }

  /**
   * Update the `linked` property on the account-linking config and
   * publish a `videodatachange` event to trigger UI refresh.
   *
   * @param {*} linkedState [was: Q]
   *
   * was: updateAccountLinkingConfig(Q) (line 87802)
   */
  updateAccountLinkingConfig(linkedState) {
    const videoData = this.api.getVideoData(); // was: c
    const config = videoData.accountLinkingConfig;    // was: W
    if (config) {
      config.linked = linkedState;
    }
    this.api.publish(
      "videodatachange",
      "dataupdated",
      videoData,
      this.api.getPresentingPlayerType()
    );
  }
}

// ---------------------------------------------------------------------------
// ToggleMenuItem  [was: Si] (line 87992)
// ---------------------------------------------------------------------------

/**
 * A checkbox-style menu item for the settings panel.  Renders a toggle
 * checkbox and publishes `"select"` when toggled.
 *
 * Uses ARIA role `menuitemcheckbox` with `aria-checked`.
 *
 * [was: Si]
 */
export class ToggleMenuItem /* extends MenuItem */ {
  /**
   * @param {string} label   — display label [was: Q]
   * @param {*}      iconDef — icon definition [was: c → g.iN.jd]
   */
  constructor(label, iconDef) {
    // super(g.up({ role: "menuitemcheckbox", "aria-checked": "false" }), c, Q,
    //       { C: "div", Z: "ytp-menuitem-toggle-checkbox" });

    /** Whether the item is currently checked. [was: this.checked] */
    this.checked = false; // was: this.checked = !1

    /** Whether the item is enabled (clickable). [was: this.enabled] */
    this.enabled = true; // was: this.enabled = !0

    // this.listen("click", this.onClick);
  }

  /**
   * Handle click — toggle checked state if enabled.
   *
   * was: onClick() (line 88005)
   */
  onClick() {
    if (!this.enabled) return;
    this.setChecked(!this.checked); // was: this.W(!this.checked)
    this.publish("select", this.checked);
  }

  /**
   * @returns {boolean} current checked state
   * was: getValue() (line 88009)
   */
  getValue() {
    return this.checked;
  }

  /**
   * Set the checked state and update the ARIA attribute.
   * @param {boolean} checked
   *
   * was: W(Q) (line 88012)
   */
  setChecked(checked) {
    this.checked = checked;
    this.element?.setAttribute("aria-checked", String(this.checked));
  }

  /**
   * Enable or disable the item.
   * @param {boolean} enabled
   *
   * was: setEnabled(Q) (line 88016)
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.element?.removeAttribute("aria-disabled");
    } else {
      this.element?.setAttribute("aria-disabled", "true");
    }
  }
}

// ---------------------------------------------------------------------------
// AnnotationsMenuItem  [was: MA_] (line 88030)
// ---------------------------------------------------------------------------

/**
 * Toggle menu item for annotations / annotated overlays.  Extends
 * `ToggleMenuItem` and manages visibility based on whether the
 * annotations module is loaded and the current video supports annotations.
 *
 * When toggled on, loads the `annotations_module`; when toggled off,
 * unloads it.
 *
 * [was: MA_]
 */
export class AnnotationsMenuItem extends ToggleMenuItem {
  /**
   * @param {Object} api          — the player API [was: Q]
   * @param {Object} settingsMenu — settings menu controller [was: c]
   */
  constructor(api, settingsMenu) {
    const label = api.X("web_fix_annotations")
      ? "Annotated Overlays"
      : "Annotations";
    super(label, /* g.iN.jd */);

    /** @private  Player API. [was: this.U] */
    this.playerApi = api;

    /** @private  Settings menu controller. [was: this.Ik] */
    this.settingsMenu = settingsMenu;

    /** @private  Whether currently added to the settings menu. [was: this.O] */
    this.isInMenu = false; // was: this.O = !1

    // Set icon if web_settings_menu_icons experiment is enabled
    if (api.X("web_settings_menu_icons")) {
      const iconSvg = api.X("delhi_modern_web_player_icons")
        ? /* modern annotations SVG path data */  null
        : /* classic annotations SVG path data */ null;
      // was: this.setIcon(c)
      if (iconSvg) this.setIcon(iconSvg);
    }

    // Listen for video data changes and API changes
    this.listen(api, "videodatachange", () => this.refreshVisibility());
    this.listen(api, "onApiChange", () => this.refreshVisibility());

    // Subscribe to toggle events
    this.subscribe("select", (checked) => this.onSelect(checked));

    // Initial visibility check
    this.refreshVisibility();
  }

  /**
   * Check if the annotations module is loaded.
   * @returns {boolean}
   *
   * was: isLoaded() (line 88072)
   */
  isLoaded() {
    const module = this.playerApi.CO()?.getAnnotationsModule();
    // was: g.zN(this.U.CO())
    return module !== undefined && module.loaded;
  }

  /**
   * Refresh the visibility of this menu item in the settings panel.
   * Hides when annotations are not available or when in ad player mode
   * (playerType 3).
   *
   * was: ZF() (line 88076)
   */
  refreshVisibility() { // was: ZF
    const noAnnotationsModule =
      !this.playerApi.X("web_fix_annotations") &&
      this.playerApi.CO()?.getAnnotationsModule() === undefined;
    const isAdPlayer = this.playerApi.getPresentingPlayerType() === 3;

    if (noAnnotationsModule || isAdPlayer) {
      // Remove from menu if currently shown
      if (this.isInMenu) {
        this.settingsMenu.yj(this); // was: this.Ik.yj(this)
        this.isInMenu = false;
      }
    } else if (!this.isInMenu) {
      // Add to menu
      this.settingsMenu.T7(this); // was: this.Ik.T7(this)
      this.isInMenu = true;
    }

    // Update checked state
    if (this.playerApi.X("web_fix_annotations")) {
      const isEnabled =
        this.playerApi.X("web_fix_annotations") &&
        !!this.playerApi.getWatchNextResponse()?.playerOverlays
          ?.playerOverlayRenderer?.isAnnotationsEnabled;
      this.setChecked(isEnabled);
    } else {
      this.setChecked(this.isLoaded());
    }
  }

  /**
   * Handle the toggle selection.  Loads or unloads the annotations module.
   * @param {boolean} checked
   *
   * was: onSelect(Q) (line 88082)
   */
  onSelect(checked) {
    if (!this.playerApi.X("web_fix_annotations")) {
      this.isLoaded(); // side-effect check
    }

    if (checked) {
      this.playerApi.loadModule("annotations_module");
    } else {
      this.playerApi.unloadModule("annotations_module");
    }

    this.playerApi.publish("annotationvisibility", checked);
  }

  /**
   * Clean up: remove from settings menu on disposal.
   *
   * was: WA() (line 88087)
   */
  dispose() {
    if (this.isInMenu) {
      this.settingsMenu.yj(this); // was: this.Ik.yj(this)
    }
    // super.dispose();  // was: super.WA()
  }
}

// ---------------------------------------------------------------------------
// AnnotationsController  [was: J$d] (line 88093)
// ---------------------------------------------------------------------------

/**
 * Controller module that creates the `AnnotationsMenuItem` once the
 * settings menu is initialised.
 *
 * [was: J$d]
 */
export class AnnotationsController extends PlayerModule {
  /**
   * @param {Object} api — the player API [was: Q]
   */
  constructor(api) {
    super(api);

    /** @private  Event handler group. [was: this.events] */
    this.events = api.createEventHandler(); // was: new g.db(Q)
    // g.F(this, this.events)

    api.addEventListener("settingsMenuInitialized", () => {
      const menuItem = new AnnotationsMenuItem(this.api, this.api.lU());
      // was: new MA_(this.api, this.api.lU())
      // g.F(this, c) — register for disposal
    });
  }
}
