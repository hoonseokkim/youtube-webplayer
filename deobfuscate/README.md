# YouTube Web Player — Deobfuscated

Reverse-engineered, readable ES2025 source of YouTube's web video player (`player_es6.vflset`).

## Overview

| Metric | Value |
|--------|-------|
| Original source | `player_es6.vflset/en_US/` (7 files, 143,062 lines, 4.9 MB) |
| Player version | `youtube.player.web_20260324_03_RC00` |
| Deobfuscated output | **218 files, ~182,000 lines** |
| Exported symbols | 4,600 |
| Import statements | 4,536 across 208 files |
| Cross-file wiring | **100% complete** (0 executable `g.XX` references remain) |
| Build system | Google Closure Compiler (advanced mode) |

The original player is a single minified IIFE bundle with obfuscated identifiers (`g.qK`, `this.W`, `!0`), comma expressions, and a flat `_yt_player` global namespace. This project splits it into well-organized ES2025 modules with meaningful names, proper `class` syntax, JSDoc comments, and explicit `import`/`export` declarations. All cross-file references are wired with proper ES module imports.

## Original Source Files

| File | Lines | Domain |
|------|-------|--------|
| `base.js` | 124,468 | Core player engine — everything |
| `remote.js` | 6,918 | Chromecast / MDX casting |
| `offline.js` | 4,606 | Offline download & playback |
| `caption.js` | 4,288 | Captions & subtitles |
| `endscreen.js` | 1,345 | Endscreen & autoplay countdown |
| `heartbeat.js` | 1,094 | Playback health & keep-alive |
| `miniplayer.js` | 343 | Picture-in-picture controls |

## Directory Structure

```
deobfuscate/
  index.js                  Barrel re-exports for all 217 modules
  SYMBOL_MAP.md             Obfuscated-to-readable name dictionary
  _export-registry.js       Machine-readable export/g. mapping (4,302 + 3,186 entries)
  README.md                 This file

  core/           (26 files,  15,155 lines)  Utilities, base classes, polyfills, scheduler, events
  compression/     (1 file,    2,211 lines)  Zlib deflate / gzip
  proto/           (9 files,  10,935 lines)  Protobuf wire format, reader, writer, message classes
  network/         (9 files,   6,632 lines)  Innertube client, XHR/fetch, retry, URI, endpoints
  media/          (40 files,  31,409 lines)  Onesie streaming, DRM/EME, codecs, MSE, ABR, segments
  player/         (29 files,  23,438 lines)  Public API, components, modules, video element, bootstrap
  ui/             (20 files,  16,001 lines)  Controls, chrome, icons, progress bar, debug panel
  ads/            (24 files,  22,649 lines)  Ad lifecycle, DAI, triggers, pinging, countdown, preview
  features/        (7 files,   2,584 lines)  Keyboard shortcuts, Shorts, autoplay
  data/           (24 files,  24,714 lines)  GEL logging, IDB storage, metrics, device context
  modules/        (27 files,  24,217 lines)  Satellite modules (caption, endscreen, heartbeat,
                                             miniplayer, offline, remote)
```

## Module Wiring

All 217 files are connected through a proper ES module import/export graph:

- **207 files** have explicit `import` statements (10 are dependency-free leaf modules)
- **4,449 import statements** wire functions/classes across files
- **0 missing cross-file imports** — every class used via `new XXX()` or `extends XXX` from another file has a matching import
- **0 remaining `g.XXX` references** in executable code — all replaced with deobfuscated names

Example of a fully wired call chain:
```
player/module-setup.js
  └─ import { applyAudioTrackPreference } from './video-loader.js'
       └─ PlayerSettingsSyncFeature listens for "internalaudioformatchange"
            └─ calls applyAudioTrackPreference(this, trackId, mode)

media/perf-continuation.js
  └─ import { OnesieRequestHandler } from './onesie-request.js'
       └─ DashLoader creates: new OnesieRequestHandler(engine, this, policy, ...)

media/onesie-request.js
  └─ import { encryptSignatureAsync } from './drm-signature.js'
       └─ OnesieRequest calls: encryptSignatureAsync(request, keyState, config, ...)
```

## Key Subsystems

### Media Engine (`media/`, 40 files, 31K lines)
The largest subsystem. Covers the Onesie unified streaming protocol, SABR (Server ABR) request pipeline, DRM/EME key management (Widevine, FairPlay, PlayReady), MediaSource/SourceBuffer lifecycle, adaptive bitrate selection, segment scheduling, codec detection, format parsing (EBML/WebM, BMFF/MP4), gapless playback for Shorts, and live-stream edge tracking.

### Data & Telemetry (`data/`, 24 files, 25K lines)
Google Event Logging (GEL) with offline IndexedDB queue, visual element tracking, Client Session Nonce management, IndexedDB transaction layer with retry logic, localStorage/sessionStorage abstraction, device fingerprinting, QoE metric collection, BotGuard attestation, and experiment flag evaluation (hot/cold config from IDB).

### Satellite Modules (`modules/`, 27 files, 24K lines)
Six lazy-loaded modules registered via `registerModule("name", class extends PlayerModule)`:
- **Caption** (8 files): CEA-608 decoder, WebVTT/TTML/srv3 parsing, caption window rendering, language preference persistence
- **Endscreen** (4 files): Autoplay countdown (SVG ring), videowall grid packing, subscribe/watch-again cards
- **Heartbeat** (2 files): Server health pings with exponential backoff, attestation, offline slate
- **Miniplayer** (2 files): PiP controls, expand button, tooltip positioning
- **Offline** (5 files): Download orchestration with Web Locks leader election, entity store CRUD, cross-tab sync
- **Remote** (6 files): MDX/Chromecast protocol, BrowserChannel session, cast receiver discovery, remote player proxy

### Player Framework (`player/`, 29 files, 23K lines)
Component hierarchy (UIComponent -> PlayerComponent -> ContainerComponent), module registry with `registerModule()`, public player API (seekTo, getCurrentTime, setVolume, etc.), DRM adapter, playback state machine, video element wrapper, multi-player presenter coordination, and application bootstrap.

### Ad System (`ads/`, 24 files, 23K lines)
Full ad delivery pipeline: layout state machine (not_rendering -> rendering -> exit), quartile tracking (impression, first_quartile, midpoint, third_quartile, complete), server-stitched DAI with cue-range management, slot adapter factory routing (DAI, live-infra, generic), 35+ trigger types, companion layouts, countdown timer (SVG pie), skip button, and ad preview/interstitial rendering.

### UI Components (`ui/`, 20 files, 16K lines)
Player chrome (top bar, bottom controls, gradient), progress bar with chapter segments and heat maps, seek overlay with arrow animations, volume slider, fullscreen management, SVG icon library (42 icons), debug/stats-for-nerds panel, featured product banner, context menu, timed markers, and fine-scrubbing.

### Core Infrastructure (`core/`, 26 files, 15K lines)
Disposable base class, PubSub/ObservableTarget event system, EventHandler lifecycle manager, DOM event normalization, Timer/Delay with drift correction, Promise wrapper for IDB transactions, polyfills (Symbol.dispose, Array.at, Promise.withResolvers), UTF-8 codec, SHA-1/HMAC-SHA256 for SAPISID auth, exponential backoff, and Closure Promise.

### Protobuf (`proto/`, 9 files, 11K lines)
Full protobuf binary wire format: varint/zigzag encoding, BinaryReader/BufferWriter, ProtoDecoder/ProtoEncoder with field descriptor tables, 20+ built-in field types, message base class with JSON serialization, and ~100 concrete message definitions for GEL, streamz, and player telemetry.

### Network (`network/`, 9 files, 7K lines)
Innertube API client with DI container, XHR/fetch transport with streaming response support, gRPC-Web JSPB transport, service endpoint registry, retry with exponential backoff, URI utilities, and error classification.

### Features (`features/`, 7 files, 3K lines)
Keyboard shortcut handler (Space/K=play, J/L=seek, M=mute, F=fullscreen, C=captions, 0-9=percentage), Shorts player with gapless loop, autoplay with next-video selection, and experiment flag system.

## Conventions

### Naming
| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `Disposable`, `OnesieRequestHandler` |
| Functions | camelCase | `registerModule`, `parseHexColor` |
| Constants | SCREAMING_SNAKE | `QUALITY_LABELS`, `EBML_IDS` |
| Private fields | `_` prefix | `this._isDisposed` |
| Files | kebab-case | `seek-state-machine.js` |

### Annotations
Every renamed symbol carries an inline comment showing its original obfuscated name:

```js
import { Disposable } from '../core/disposable.js';           // was: g.qK
import { encryptSignatureAsync } from './drm-signature.js';    // was: w2x

export class OnesieRequestHandler extends Disposable { // was: cH1
  constructor(engine, policy) {
    super();
    this._engine = engine;   // was: this.EH
    this._policy = policy;   // was: this.k0
  }

  getProtocolId() {           // was: Gl
    return 'ONESIE';
  }
}
```

### Mechanical Transforms
- `!0` -> `true`, `!1` -> `false`, `void 0` -> `undefined`
- Comma expressions expanded into separate statements
- `g.` namespace references replaced with ES module imports (7,708 replacements)
- Constructor + prototype blocks merged into single `class` bodies

## How It Was Built

The deobfuscation was performed in 61+ phases over multiple sessions using Claude Code with parallel subagents:

1. **Phases 0-10**: Core utilities, infrastructure classes, compression, protobuf, network, media engine skeleton, UI components, ads, features, satellite modules, and initial refinement
2. **Phases 11-17**: Onesie streaming protocol, player public API, ad layout lifecycle, playback control, event logging, video metadata, DAI
3. **Phases 18-27**: Low-level infrastructure, UTF-8/config/metrics, storage/stream reader, media pipeline, ad scheduling, ad system deep dive, video loading, playback state, UI components
4. **Phases 28-38**: Protobuf wire format, event system core, IDB transactions, media pipeline gaps, UI/playback state, plugin/logger, ad interaction, device/DRM, playback controller, final UI and bootstrap
5. **Phases 39-44**: Gap closure for satellite modules (caption, remote, offline), remaining base.js scattered gaps, final integration and verification
6. **Phases 45-56**: Module wiring — built export registry (4,302 exports + 3,186 g. mappings), added import statements, replaced obfuscated names in code bodies
7. **Phases 57-61**: Full verification pass — replaced remaining obfuscated class names (PI->MetadataCollection, RL->FulfilledLayoutMetadata, etc.), added 1,411 missing import statements, verified 0 cross-file gaps

Each phase used 2-3 parallel agents reading specific line ranges from the original, extracting and renaming functions/classes, and writing clean ES2025 output files. The original source files were never modified.

### Verification Results

| Check | Result |
|-------|--------|
| Missing cross-file imports | **0** |
| `g.XXX` in code bodies | **0** (all replaced) |
| Fused identifier corruptions (`getg.In`, `backChannelg.RetryTimer`) | **0** (136 fixed) |
| Corrupted `filterAndSortFormats` import injections | **0** (196 fixed across 7 satellite module files) |
| Corrupted language code maps | **0** (95 ISO codes restored in caption files) |
| Live `g.XX` references in executable code | **0** (169+ resolved, 57 symbols researched + exported) |
| Obfuscated base classes in `extends` | **0** (RW0→TypeDescriptorBase, MtR→ViewabilitySessionBase, Fma→RequestTimingBase) |
| Obfuscated class names in `new`/`extends` | ~81 remaining (file-local, no cross-file wiring needed) |
| `inherits()` prototype patterns | **0** (all 11 converted to class syntax or redirected) |
| Malformed proto import blocks | **0** (3 fixed) |
| Key call chains verified | applyAudioTrackPreference, OnesieRequestHandler, encryptSignatureAsync, MetadataCollection, Disposable (45 importers), EventHandler (19 importers), CueRange (14 importers) |

## Searching the Codebase

Find where a function is defined:
```bash
grep -r "export function functionName\|export class ClassName" deobfuscate/
```

Find all callers of a function:
```bash
grep -r "functionName" deobfuscate/ | grep -v "export function\|// was:"
```

Find by original obfuscated name:
```bash
grep -r "was: obfuscatedName" deobfuscate/
```

Trace a call chain from original source:
```bash
# 1. Find the obfuscated name's definition
grep "var obfName = class\|var obfName = function" player_es6.vflset/en_US/base.js

# 2. Find all callers in original
grep "obfName(" player_es6.vflset/en_US/base.js

# 3. Find the deobfuscated equivalent
grep "was: obfName" deobfuscate/ -r
```

## Limitations

- ~81 file-local class names remain as short obfuscated identifiers (2-4 chars). These are internal to their defining file and not referenced cross-file.
- ~45 `config.XX` property names retain short obfuscated identifiers (e.g., `config.Qp`, `config.Ie`) — these are experiment flags and internal config keys that require per-object context analysis to rename.
- ~215 `// TODO: resolve g.XX` comments remain for lower-frequency symbols not yet researched — these are cosmetic annotations, not code errors.
- Some per-class property renames (e.g., `this.K`, `this.W`) remain as original single-letter names where the meaning could not be confidently determined from context.
- A small number of functions are stubbed with placeholder implementations where the logic was too deeply intertwined with runtime state to extract cleanly.
- The code is not designed to run as-is — it serves as a readable reference for studying YouTube's player architecture.
- The `www-player.css` stylesheet (615 KB) was not deobfuscated (CSS class names like `ytp-ad-skip-button` are already readable).

## License

This is a reverse-engineering project for educational and research purposes. The original YouTube web player is proprietary software owned by Google LLC. The deobfuscated source is provided as-is for study of web video player architecture, streaming protocols, and ad delivery systems.
