# YouTube Web Player — Reverse Engineered

Reverse-engineered, readable source of YouTube's web video player (`player_es6.vflset`), deobfuscated from Google Closure Compiler advanced-mode output into 218 ES2025 modules with meaningful names, proper `class` syntax, and full import/export wiring.

## Overview

| | Original | Deobfuscated |
|---|---|---|
| **Files** | 7 minified bundles | 218 ES2025 modules |
| **Lines** | 143,062 | ~182,000 |
| **Size** | 4.9 MB | 7.1 MB |
| **Identifiers** | `g.qK`, `this.W`, `cH1` | `Disposable`, `this._engine`, `OnesieRequestHandler` |
| **Syntax** | IIFE + comma expressions + `!0`/`!1` | Classes + `import`/`export` + `true`/`false` |
| **Module system** | Flat `_yt_player` global namespace | ES module graph (4,600 exports, 4,536 imports) |

**Player version**: `youtube.player.web_20260324_03_RC00`

## Repository Structure

```
youtube-webplayer/
  player_es6.vflset/en_US/     Original minified source (READ-ONLY)
    base.js                      124,468 lines — core player engine
    remote.js                      6,918 lines — Chromecast / MDX casting
    offline.js                     4,606 lines — offline download & playback
    caption.js                     4,288 lines — captions & subtitles
    endscreen.js                   1,345 lines — endscreen & autoplay
    heartbeat.js                   1,094 lines — playback health signals
    miniplayer.js                    343 lines — picture-in-picture

  deobfuscate/                   Deobfuscated ES2025 modules
    core/          (27 files)      Utilities, base classes, events, scheduler, polyfills
    compression/    (1 file)       Zlib deflate / gzip
    proto/          (9 files)      Protobuf wire format, reader, writer, messages
    network/        (9 files)      Innertube client, XHR/fetch, retry, URI, endpoints
    media/         (40 files)      Onesie/SABR streaming, DRM/EME, codecs, MSE, ABR
    player/        (30 files)      Public API, components, modules, video element
    ui/            (20 files)      Controls, progress bar, chrome, icons, debug panel
    ads/           (24 files)      Ad lifecycle, DAI/SSDAI, triggers, pinging, preview
    features/       (7 files)      Keyboard shortcuts, Shorts, autoplay
    data/          (24 files)      GEL logging, IDB storage, metrics, BotGuard
    modules/       (27 files)      Captions, endscreen, heartbeat, miniplayer,
                                   offline, Chromecast/remote

  docs/                          Protocol documentation
    onesie-protocol.md             Onesie streaming protocol & UMP binary format

  www-player.css                 Player stylesheet (615 KB, not deobfuscated)
```

## Key Subsystems

### Media Engine (`media/`, 40 files)

The largest subsystem. Covers YouTube's **Onesie** unified streaming protocol, **SABR** (Server ABR) request pipeline, DRM/EME key management (Widevine, FairPlay, PlayReady), MediaSource/SourceBuffer lifecycle, adaptive bitrate selection, segment scheduling, codec detection, format parsing (EBML/WebM, BMFF/MP4), gapless playback for Shorts, and live-stream edge tracking.

### Ad System (`ads/`, 24 files)

Full ad delivery pipeline: layout state machine, quartile tracking (impression through complete), server-stitched DAI with cue-range management, slot adapter factory routing, 35+ trigger types, companion layouts, countdown timer, skip button, and ad preview rendering.

### Data & Telemetry (`data/`, 24 files)

Google Event Logging (GEL) with offline IndexedDB queue, visual element tracking, Client Session Nonce management, IndexedDB transaction layer with retry logic, device fingerprinting, QoE metric collection, BotGuard attestation, and experiment flag evaluation.

### Player Framework (`player/`, 30 files)

Component hierarchy (`UIComponent` -> `PlayerComponent` -> `ContainerComponent`), module registry, public player API (`seekTo`, `getCurrentTime`, `setVolume`, etc.), DRM adapter, playback state machine, video element wrapper, and application bootstrap.

### Satellite Modules (`modules/`, 27 files)

Six lazy-loaded modules: **Captions** (CEA-608, WebVTT/TTML, caption window rendering), **Endscreen** (autoplay countdown, suggestion cards), **Heartbeat** (server health pings, attestation), **Miniplayer** (PiP controls), **Offline** (Web Locks leader election, entity store, cross-tab sync), **Remote** (MDX/Chromecast protocol, BrowserChannel, cast receiver discovery).

---

## How YouTube Streams Video: Onesie Protocol

> Full documentation: [`docs/onesie-protocol.md`](docs/onesie-protocol.md)

YouTube does **not** use standard DASH or HLS. Instead, it uses a proprietary protocol called **Onesie** with **server-driven adaptive bitrate** (SABR) and a custom binary envelope format called **UMP** (Universal Media Protocol).

### Onesie vs DASH/HLS

| | DASH/HLS | Onesie |
|---|---|---|
| **Manifest** | XML MPD / M3U8 playlist | None — server-driven |
| **Who picks quality?** | Client (bandwidth estimation) | Server (SABR) |
| **Segment delivery** | Individual HTTP GET per segment | Persistent multiplexed binary stream (UMP) |
| **Connection** | Stateless (new request per segment) | Stateful persistent POST |
| **Ad insertion** | Client-stitched (separate stream) | Server-stitched (DAI — ads in same stream) |
| **Multi-video** | Separate connections | Multiplexed in single UMP stream |

### How It Works

1. **Player reports state** — sends buffer health, current position, and format candidates to the server via SABR
2. **Server decides** — picks the optimal quality/format based on CDN load, bandwidth, and engagement models
3. **Server delivers segments** — wrapped in UMP binary frames through a persistent connection
4. **Player demuxes and appends** — UMP frames are parsed, decrypted (if DRM), and appended to MSE SourceBuffers

```
Player                                CDN (googlevideo.com)
  │                                        │
  │─── POST /videoplayback ───────────────▶│
  │    (SABR: buffer state + format list)  │
  │                                        │
  │◀── UMP binary stream ─────────────────│
  │    [varint:feedId][varint:len][payload] │
  │    [varint:feedId][varint:len][payload] │
  │    ...                                 │
  │                                        │
  ├─ UmpFeed demuxes frames                │
  ├─ DecryptionPipeline routes by type     │
  ├─ Per-video SegmentQueues buffer data   │
  ├─ DRM decryption (Widevine/FairPlay)    │
  └─ SourceBuffer.appendBuffer() → <video> │
```

### UMP Binary Frame Format

Every piece of data in an Onesie response — media segments, metadata, control messages, SABR directives — is wrapped in UMP frames:

```
┌────────────────┬──────────────────┬─────────────────────────┐
│ varint: feedId │ varint: length   │ length bytes: payload   │
│ (message type) │ (payload size)   │ (segment/control data)  │
└────────────────┴──────────────────┴─────────────────────────┘
```

Key message types:

| feedId | Type | Description |
|--------|------|-------------|
| 10 | Init header | Encryption config (IV, flags), mosaic signals |
| 11 | Media segment | Raw audio/video segment data |
| 20 | Segment metadata | Format ID, timing, encryption key, bitrate |
| 22 | End-of-stream | Signals completion for a format |
| 35 | Next-request policy | SABR backoff/retry configuration |
| 45 | SABR seek | Server-initiated seek command |

### SABR (Server ABR)

The player sends a descriptor with ~20 fields including:
- Current playback position and buffer byte ranges
- Video/audio format candidates (itag, codec, resolution)
- Suspended state, live pointer, stream-started flags

The server responds with format selection, seek directives, error actions (stop, soft-reload, host fallback), and playback start policy — all delivered as UMP messages within the same binary stream.

### DRM

Onesie encrypts the request body using a 3-step fallback:
1. `encryptSignatureCached()` — WebCrypto with cached key (fast path)
2. `encryptSignatureAsync()` — async WebCrypto fallback
3. `encryptSignatureSync()` — software AES fallback

Segment decryption uses AES-GCM with IV from the UMP init header. Supported DRM systems: Widevine (`com.widevine.alpha`), PlayReady (`com.microsoft.playready`), FairPlay.

---

## What Makes YouTube's Player Unique

Compared to open-source players like hls.js or dash.js:

1. **Server-driven ABR (SABR)** — the server picks quality using CDN-wide signals that no client-side algorithm can access
2. **UMP binary multiplexing** — one persistent connection streams multiple videos (gapless Shorts, ad transitions, PiP)
3. **BotGuard attestation** — playback requires proof-of-browser via a server-provided challenge program
4. **Server-stitched ads (SSDAI)** — ads are injected into the segment stream server-side, sharing the same connection as content
5. **Full offline system** — IndexedDB-backed download orchestration with Web Locks leader election and cross-tab sync (~6,000 lines of IDB code alone)

---

## Searching the Codebase

```bash
# Find where a function/class is defined
grep -r "export function functionName\|export class ClassName" deobfuscate/

# Find all callers of a function
grep -r "functionName" deobfuscate/ | grep -v "export function\|// was:"

# Find by original obfuscated name
grep -r "was: obfuscatedName" deobfuscate/

# Trace a call chain from original source
grep "var obfName = class\|var obfName = function" player_es6.vflset/en_US/base.js
grep "was: obfName" deobfuscate/ -r
```

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `Disposable`, `OnesieRequestHandler` |
| Functions | camelCase | `registerModule`, `parseHexColor` |
| Constants | SCREAMING_SNAKE | `QUALITY_LABELS`, `EBML_IDS` |
| Private fields | `_` prefix | `this._isDisposed` |
| Files | kebab-case | `seek-state-machine.js` |

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
}
```

## Limitations

- ~81 file-local class names remain as short obfuscated identifiers (internal to their files, no cross-file impact)
- ~45 `config.XX` property names retain obfuscated identifiers (experiment flags requiring per-object context analysis)
- Some per-class properties (e.g., `this.K`, `this.W`) remain as original single-letter names where meaning could not be confidently determined
- The code is not designed to run as-is — it serves as a readable reference for studying YouTube's player architecture
- The `www-player.css` stylesheet was not deobfuscated (CSS class names like `ytp-ad-skip-button` are already readable)

## License

This is a reverse-engineering project for educational and research purposes. The original YouTube web player is proprietary software owned by Google LLC. The deobfuscated source is provided as-is for study of web video player architecture, streaming protocols, and ad delivery systems.
