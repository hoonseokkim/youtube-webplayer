# YouTube Onesie Streaming Protocol & UMP

> Reverse-engineered from YouTube's web player (`player_es6.vflset`, version `web_20260324_03_RC00`).
> All code references point to the deobfuscated source in `deobfuscate/`.

## Table of Contents

1. [Overview](#1-overview)
2. [Onesie vs DASH/HLS](#2-onesie-vs-dashhls)
3. [Architecture](#3-architecture)
4. [Connection Lifecycle](#4-connection-lifecycle)
5. [SABR (Server ABR)](#5-sabr-server-abr)
6. [UMP (Universal Media Protocol)](#6-ump-universal-media-protocol)
7. [Segment Flow: Network to Playback](#7-segment-flow-network-to-playback)
8. [DRM Integration](#8-drm-integration)
9. [Quality Selection](#9-quality-selection)
10. [Ad Integration (DAI/SSDAI)](#10-ad-integration-daissdai)
11. [Gapless Playback (Shorts)](#11-gapless-playback-shorts)
12. [Live Streams](#12-live-streams)
13. [Experiment Flags](#13-experiment-flags)
14. [Source File Map](#14-source-file-map)

---

## 1. Overview

**Onesie** is YouTube's proprietary streaming protocol that replaces traditional DASH manifest-based streaming. Instead of the player parsing an MPD manifest and independently selecting segments and bitrates, Onesie uses a **server-driven** model where:

- The **server** decides which quality/format to deliver (via SABR — Server ABR)
- Segments are wrapped in a **binary envelope** called UMP (Universal Media Protocol)
- The player maintains a **persistent connection** to the CDN, receiving multiplexed segments
- No traditional DASH manifest (`.mpd`) or HLS playlist (`.m3u8`) is fetched

The player's role shifts from "parse manifest, pick quality, fetch segments" to "report buffer state, receive segments, append to MSE."

### Key Classes

| Class | Original | File | Role |
|-------|----------|------|------|
| `OnesieRequest` | `j3` | `media/onesie-request.js:117` | Transport lifecycle — URL resolution, encryption, XHR dispatch |
| `OnesieRequestHandler` | `cH1` | `media/onesie-request.js:1016` | SABR orchestrator — builds next-request payloads, processes server directives |
| `UmpFeed` | `dF` | `base.js:89555` | UMP binary demuxer — parses varint-framed envelope |
| `DecryptionPipeline` | `Q0a` | `base.js:93169` | Message router — dispatches UMP messages by type, handles decryption |
| `DashLoader` | in `perf-continuation.js` | `media/perf-continuation.js` | Playback orchestrator — creates OnesieRequestHandler, coordinates tracks |
| `SourceBufferWriter` | `Fao` | `media/segment-writer.js` | MSE integration — appends segments to SourceBuffer |

---

## 2. Onesie vs DASH/HLS

| Feature | DASH/HLS | Onesie |
|---------|----------|--------|
| **Manifest** | XML MPD / M3U8 playlist | None — server-driven |
| **Quality selection** | Client-side ABR (bandwidth estimation) | Server-side ABR (SABR) |
| **Segment delivery** | Individual HTTP GET per segment | Persistent multiplexed stream (UMP envelope) |
| **Connection model** | Stateless (new TCP per segment) | Stateful persistent connection |
| **Ad insertion** | Client-stitched (separate ad stream) | Server-stitched (DAI — ads in same stream) |
| **Multi-video** | Separate connections per video | Multiplexed in single UMP stream (mosaic) |
| **Live metadata** | In-band EMSG boxes | SABR context update messages |
| **Format info** | In manifest | Pre-loaded from Innertube `player` API response |

### Hybrid Approach

Onesie is not *fully* manifestless. Format metadata (itag, codecs, bitrate, dimensions) is obtained from the initial Innertube `/player` API response — the same response that would normally contain the DASH manifest URL. In Onesie mode, the player uses this format list as **candidates** to send to the server via SABR, and the server selects which formats to deliver.

**Reference**: `onesie-request.js:1202-1260` — `buildNextRequest()` gathers video format candidates (`descriptor.CT`) and audio format candidates (`descriptor.PF`) from the local format list.

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       YouTube Player                         │
│                                                              │
│  ┌──────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │ DashLoader│───▶│OnesieRequestHandler│──▶│ OnesieRequest │  │
│  │(orchestrate)│  │  (SABR builder)    │   │  (transport)  │  │
│  └──────────┘    └──────────────────┘    └───────┬───────┘  │
│                                                   │          │
│                                          XHR POST │          │
│  ┌───────────────────────────────────────────────┐│          │
│  │              CDN (googlevideo.com)             ││          │
│  │  /videoplayback?...                           ◀┘          │
│  │                                                │          │
│  │  Returns: UMP binary envelope                  │          │
│  └───────────────────────────────┬───────────────┘          │
│                                   │                          │
│                          UMP bytes│                          │
│                                   ▼                          │
│  ┌─────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │ UmpFeed │───▶│DecryptionPipeline│───▶│ SegmentQueues │  │
│  │ (demux) │    │ (route+decrypt)  │    │  (per-video)  │  │
│  └─────────┘    └──────────────────┘    └───────┬───────┘  │
│                                                   │          │
│                                                   ▼          │
│  ┌──────────────────┐    ┌───────────────────────────────┐  │
│  │ SourceBufferWriter│───▶│ MediaSource (SourceBuffer)    │  │
│  │ (append logic)    │    │          ↓                    │  │
│  └──────────────────┘    │   <video> element playback    │  │
│                           └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Connection Lifecycle

### Phase 1: Initialization

```
OnesieRequest.fetch()                    [onesie-request.js:514]
  │
  ├─ Resolve redirector URL              [line 525-537]
  │   └─ Zc0() tries cache first
  │   └─ EDn() async resolve with timeout (html5_onesie_redirector_timeout_ms)
  │   └─ Extract endpoint: uB(28, 7440, redirectorUrl)
  │
  ├─ Resolve OAuth token                 [line 541-547]
  │   └─ resolveOAuthToken(playerConfig, videoData)
  │   └─ Log 'no_token' QoE if missing
  │
  ├─ Build request body                  [line 550]
  │   └─ buildInnertubePlayerRequest(playerRequest, config, videoData, oauthToken, endpoint)
  │
  ├─ Encrypt request body                [line 571-637]
  │   ├─ Try 1: encryptSignatureCached()    (WebCrypto, fast path)
  │   ├─ Try 2: encryptSignatureAsync()     (async fallback)
  │   └─ Try 3: encryptSignatureSync()      (sync fallback)
  │
  ├─ Set query params                    [line 655]
  │   └─ setOnesieQueryParams(url, videoData, state, mediaCapabilities)
  │   └─ url.set('rn', requestNumber)
  │
  └─ Dispatch XHR                        [line 672]
      └─ POST to {cdn}.googlevideo.com/videoplayback?...
      └─ Content-Type: text/plain
      └─ Body: serialized encrypted payload
```

### Phase 2: Active Streaming

```
processResponseChunk()                   [onesie-request.js:953]
  │
  ├─ transport.rS()                      // Get raw byte stream from XHR
  ├─ umpFeed.feed(bytes)                 // Feed into UMP demuxer
  │   └─ Parse varint headers
  │   └─ Extract framed segments
  │   └─ Route to DecryptionPipeline
  │
  └─ For each videoId in segmentQueues:
      └─ queue.flush()                   // Push segments to consumer
      └─ notifySubscribers(videoId)
```

### Phase 3: Completion

```
State transitions:
  1 (INIT) → 3 (COMPLETE) → 4 (FINISHED_OK) or 5 (FAILED) → -1 (DISPOSED)
```

### Timeouts

| Timer | Duration | Purpose |
|-------|----------|---------|
| Health check | 500 ms interval | Detect stalled connections |
| Hard timeout | 10 seconds | Maximum total request time |
| Soft timeout | 1 second | Fallback if health check disabled |

**Reference**: `onesie-request.js:225-239`

### Error Domains

| Error | Meaning |
|-------|---------|
| `onesie.unavailable.hotconfig` | No redirector URL resolved |
| `onesie.request` | Generic request timeout/failure |
| `onesie.net` | Network error |
| `onesie.net.badstatus` | HTTP 4xx/5xx |
| `onesie.net.connect` | Connection failure |
| `onesie.net.nocontent` | HTTP 204 No Content |
| `onesie.response.noplayerresponse` | Body parsed but no player response |

**Reference**: `onesie-request.js:100-114`

---

## 5. SABR (Server ABR)

SABR = **Server Adaptive Bitrate**. Instead of the player running a bandwidth estimation algorithm and picking the best quality (traditional client-side ABR), the player sends a buffer state snapshot to the server, and the **server decides** which quality/segments to deliver next.

### SABR Request (Client → Server)

Built by `OnesieRequestHandler.buildNextRequest()` at `onesie-request.js:1160-1314`:

```
SABR Next-Request Descriptor
├── Timing / Position
│   ├── vp:  currentTimeMs           // Current media position (ms)
│   ├── X7:  livePointer * 1000      // Live playback pointer (if live)
│   └── Sp:  queuedSeekMs            // Queued seek target (ms)
│
├── Format Candidates
│   ├── CT:  videoFormats[]           // Available video formats (itag, codec, resolution)
│   ├── PF:  audioFormats[]           // Available audio formats
│   ├── D_:  currentAudioItag        // Currently playing audio itag
│   └── qV:  currentVideoItag        // Currently playing video itag
│
├── Segment Lists
│   ├── h3:  timestamps[]            // Segment start times from all tracks
│   ├── playerOverlayLayoutRenderer: durations[]  // Segment durations
│   └── yd:  captionData             // Caption track info
│
├── Buffer Metrics
│   ├── recordActivity: audioByteRange  // Audio buffer byte estimate
│   └── Wq:  videoByteRange             // Video buffer byte estimate
│
├── Network / State
│   ├── Qp:  networkSession           // Network config
│   ├── k0:  networkManager           // Host/network manager
│   ├── Ck:  policy                   // Playback policy
│   └── BN:  suspendedState           // 4=suspended, undefined=playing
│
├── Scheduling Hints
│   ├── Yc:  adaptiveSchedule         // Schedule hint
│   ├── Yl:  liveSeekSchedule         // Live seek schedule
│   └── E1:  nextChunkSize            // Next chunk size
│
└── State Flags
    ├── jj:  isJoinable               // Mosaic joinability
    ├── Hd:  hasHeadData              // Head data availability
    └── nI:  hasStreamStarted         // Stream start flag
```

### SABR Response (Server → Client)

The server responds through UMP messages (see [Section 6](#6-ump-universal-media-protocol)):

| UMP Field ID | Directive | Handler |
|-------------|-----------|---------|
| 35 | Next-request policy | `dW()` — backoff timing, retry strategy |
| 45 | SABR seek directive | `Bp()` — server-initiated seek to specific time |
| 47 | Server playback start policy | `RL()` — when to begin playback |
| 60 | Playback start policy | Policy override |
| Context updates | Live metadata, caption data | `E2()` — logged as `sabrctxt` QoE event |

**Reference**: `onesie-request.js:1325-1480`

---

## 6. UMP (Universal Media Protocol)

UMP is the binary envelope format that wraps all data in Onesie responses — media segments, metadata headers, control messages, and SABR directives are all multiplexed into a single byte stream.

### Binary Frame Format

```
┌────────────────┬──────────────────┬─────────────────────────┐
│ varint: feedId │ varint: length   │ length bytes: payload   │
│ (message type) │ (payload size)   │ (segment/control data)  │
└────────────────┴──────────────────┴─────────────────────────┘
```

Each UMP frame consists of:
1. **feedId** — variable-length integer identifying the message type
2. **length** — variable-length integer specifying payload byte count
3. **payload** — raw binary data (media segment, protobuf message, etc.)

### Varint Encoding

UMP uses a custom variable-length integer encoding (not standard protobuf varint):

| Byte Range | Encoding | Value Range |
|-----------|----------|-------------|
| `0x00-0x7F` | 1 byte: `0xxxxxxx` | 0 – 127 |
| `0x80-0xBF` | 2 bytes: `10xxxxxx BBBBBBBB` | 128 – 16,511 |
| `0xC0-0xDF` | 3 bytes: `110xxxxx BBBBBBBB BBBBBBBB` | 16,512 – 2,113,663 |
| `0xE0-0xEF` | 4 bytes: `1110xxxx BBBB...` | Up to ~268M |
| `0xF0-0xF7` | 5 bytes: `11110xxx` + 4-byte LE uint32 | Up to ~4.3B |

**Reference**: Varint decoder `JS0` at `base.js:36732-36764`

### UMP Message Types (feedId values)

| feedId | Type | Description |
|--------|------|-------------|
| 10 | Init header | Encryption config (IV, encryption flag), mosaic signals |
| 11 | Media segment | Raw audio/video segment data |
| 12 | Segment control | Segment routing control (headerId + payload) |
| 20 | Segment metadata header | Format ID, timing, encryption key, bitrate |
| 21 | Segment continuation | Continuation of segment data |
| 22 | End-of-stream | Signals end of segments for a format |
| 35 | Next-request policy | SABR backoff/retry configuration |
| 37 | Supplementary config | Per-video supplementary configuration |
| 45 | SABR seek directive | Server-initiated seek command |
| 47 | Playback start policy | When to begin playback |
| 60 | Playback policy | General playback directives |
| 66 | Debug info | Server diagnostic data |

**Reference**: `DecryptionPipeline.K()` dispatch at `base.js:93169-93375`

### UMP Demuxing Flow

```
XHR bytes
    │
    ▼
UmpFeed.feed(bytes)                         [base.js:89555]
    │
    ├─ Append to ChunkBuffer (Xu)
    │
    └─ JF() — main demux loop:
        │
        ├─ Phase 1: Complete partial frame from previous call
        │   └─ If this.j (partial feedId) exists:
        │       └─ Split buffer, deliver via OnesieRequest.CA()
        │       └─ Clear partial state when frame complete
        │
        └─ Phase 2: Parse new complete frames
            └─ Loop:
                ├─ Read varint → feedId
                ├─ Read varint → frameLength
                │
                ├─ If buffer has frameLength bytes:
                │   └─ Extract payload, deliver via OnesieRequest.zW(feedId, payload)
                │
                └─ If buffer incomplete:
                    └─ If partial delivery enabled (CA callback):
                        └─ Deliver available bytes, mark frame as partial
                    └─ Else: break, wait for more data
```

### Segment Metadata Header (feedId=20)

When the server sends a new segment, it first sends a metadata header:

```
SegmentHeader {
  wB:  headerId          // Unique header ID for routing
  O$:  isMediaSegment    // true=media, false=init segment
  ZL:  encryptionKeyId   // DRM encryption key reference
  TT:  encryptionMethod  // Algorithm (AES-128-CTR, etc.)
  Rg:  segmentNumber     // Sequence number
  startMs: startTime     // Media timestamp (ms)
  durationMs: duration   // Segment duration (ms)
  s5:  skipBytes         // Bytes to skip in payload
  timeRange: timeRange   // Valid time range
  tb:  bitrate           // Bitrate indicator
  itag: formatItag       // YouTube format ID
  videoId: videoId       // Video ID (for multi-video)
}
```

The `headerId` is used to route subsequent segment data (feedId=11,12) to the correct format queue.

**Reference**: `DecryptionPipeline.J()` at `base.js:93280-93343`

### Init Header (feedId=10) Sub-types

| Type (Aa field) | Meaning |
|-----------------|---------|
| 0 | Proxy status — sets encryption flag (`W.wV.rb`) and caches IV (`W.wV.iv`) |
| 2 | Placeholder |
| 23 | Mosaic partial header — new video ID for multiplexing |
| 24 | Mosaic complete — finalize per-video segment queue |

### Multi-Video Multiplexing (Mosaic Mode)

Onesie supports streaming segments for **multiple videos** through a single connection. This is used for:
- Gapless Shorts playback (pre-buffer next video)
- Picture-in-picture
- Ad-to-content transitions

Each video gets its own queue in `OnesieRequest.segmentQueues` (`Map<videoId, SegmentQueue>`):

```javascript
// onesie-request.js:258-263
const umpAvailable = mi();  // Check UMP multiplexing availability
if (enableMultiplexing && umpAvailable) {
  this.segmentQueues = new Map();  // Map<videoId → queue>
}
```

Segments are routed by `videoId` from the metadata header.

---

## 7. Segment Flow: Network to Playback

### Complete Data Path

```
1. OnesieRequest dispatches XHR POST to CDN
   └─ onesie-request.js:672

2. XHR receives bytes progressively
   └─ processResponseChunk() polls every ~100ms
   └─ onesie-request.js:953

3. UmpFeed demuxes binary envelope
   └─ Extracts [feedId, length, payload] frames
   └─ base.js:89555

4. DecryptionPipeline routes by feedId
   ├─ feedId=20 → Segment metadata header → maps headerId→formatId→videoId
   ├─ feedId=11 → Media segment data → queue for decryption
   ├─ feedId=12 → Segment control → enqueue segment with metadata
   └─ feedId=22 → End-of-stream → finalize format
   └─ base.js:93169

5. Per-video SegmentQueue accumulates segments
   └─ onesie-request.js:260-310

6. DRM decryption (if encrypted)
   └─ AES-GCM via WebCrypto or fallback
   └─ IV from init header (feedId=10, type 0)

7. SourceBufferWriter appends to MSE
   ├─ maybeAppendInitSegment() — handle moov/WebM header
   ├─ appendMediaSegment() — check readahead, flatten data
   └─ appendToSourceBuffer() → SourceBuffer.appendBuffer()
   └─ segment-writer.js

8. HTMLMediaElement plays
   └─ <video> element renders decoded frames
```

### Buffer Management

The player tracks buffer health to inform SABR requests:

| Metric | Description | Source |
|--------|-------------|--------|
| `audioReadahead` | Seconds of audio buffered ahead of playhead | `buffer-manager.js` |
| `videoReadahead` | Seconds of video buffered ahead of playhead | `buffer-manager.js` |
| `bufferHealth` | Overall buffer health score | `buffer-manager.js` |
| `readaheadMet` | Request blocking — enough buffer | `buffer-manager.js:176-254` |

**Request blocking reasons** (from `shouldCreateSabrRequest()`):
- `readaheadmet` — buffer target reached
- `shortsbufferedtoend` — Shorts video fully buffered
- `vodbufferedtoend` — VOD fully buffered

**QuotaExceeded handling**: When `SourceBuffer.appendBuffer()` throws `QuotaExceededError`, the player reduces buffer sizes and may seek to recover. Reference: `media/media-source.js`

---

## 8. DRM Integration

### Encryption Envelope

The request body is encrypted before sending:

```
fetch() encryption chain:                  [onesie-request.js:571-637]
  │
  ├─ Try 1: encryptSignatureCached()       // WebCrypto (fast, cached key)
  ├─ Try 2: encryptSignatureAsync()        // Async WebCrypto fallback
  └─ Try 3: encryptSignatureSync()         // Sync fallback (software AES)
```

**Reference**: `media/drm-signature.js` — `encryptSignatureAsync()` [was: `w2x`]

### Segment Decryption

Encrypted segments in the UMP stream are decrypted using:
- **IV** extracted from init header (feedId=10, type 0): `W.wV.iv`
- **Encryption flag**: `W.wV.rb` (false=plaintext, true=encrypted)
- **Method**: AES-GCM via WebCrypto API, with software fallback

### DRM Systems

| System | Key System ID | Reference |
|--------|--------------|-----------|
| Widevine | `com.youtube.widevine.l3`, `com.widevine.alpha` | `media/codec-detection.js` |
| PlayReady | `com.youtube.playready`, `com.microsoft.playready` | `media/codec-detection.js` |
| FairPlay | (detected via `isFairplay()`) | `player/video-data-helpers.js` |

### License Flow

```
1. Init segment → extract PSSH box (Protection System Specific Header)
2. MediaKeySession.generateRequest(initDataType, initData)
3. 'message' event → POST license request to Widevine/PlayReady server
4. Response → MediaKeySession.update(license)
5. 'keystatuseschange' → verify key status
```

**Reference**: `media/drm-manager.js` — `LicenseConstraintManager` [was: `Zj`], `MediaKeySessionManager` [was: `sZw`]

---

## 9. Quality Selection

### SABR Mode (Onesie)

In Onesie mode, the **server** selects quality. The player's role is to:
1. Report available formats as candidates (`buildNextRequest()` → `CT` and `PF` fields)
2. Report current buffer health and bandwidth estimates
3. Accept and apply the server's format selection

### Client-Side ABR (Traditional DASH Fallback)

When Onesie/SABR is not available, the player uses client-side ABR:

```javascript
// segment-request.js:110-241
selectNextQuality(abrState) {
  const bandwidth = getAvailableBandwidth();
  // Downshift threshold: bandwidth / policy.S
  // Upshift threshold: bandwidth / policy.Y
  // Find format index that fits within thresholds
}
```

### Quality Constraints

Quality can be constrained by:
- **Manual lock** — user selected a specific quality
- **DRM lock** — DRM requires specific format (`reason: "drm"`)
- **Performance cap** — device can't decode at high bitrate (`reason: "perf"`)
- **Codec constraint** — hardware acceleration limits (`reason: "codec"`)
- **Resolution cap** — experiment flag `html5_hard_cap_max_vertical_resolution_for_shorts`

**Reference**: `media/quality-constraints.js:43-156` — `applyQualityConstraint()` [was: `d3`]

### Quality Labels

```javascript
// media/quality-manager.js
['tiny', 'small', 'medium', 'large', 'hd720', 'hd1080', 'hd1440', 'hd2160', 'hd2880', 'highres']
```

---

## 10. Ad Integration (DAI/SSDAI)

### Server-Stitched Dynamic Ad Insertion (SSDAI)

In Onesie mode, ads can be **stitched server-side** into the segment stream. The player doesn't fetch separate ad streams — instead:

1. Server inserts ad segments directly into the UMP stream
2. Ad metadata arrives as context updates (feedId=37, supplementary config)
3. Player tracks ad state via `SsdaiCueRangeManager` in `ads/dai-cue-range.js`
4. Cue ranges define ad boundaries (start time, end time, ad break ID)

### Ad URL Parameters

Ad segments include additional query parameters:
- `daistate` — DAI state token
- `skipsq` — Skip sequence number
- `cpn` — Content Playback Nonce (separate CPN for ad tracking)

**Reference**: `ads/dai-cue-range.js`, `ads/ad-cue-delivery.js`

---

## 11. Gapless Playback (Shorts)

YouTube Shorts use gapless playback to loop videos seamlessly. The Onesie mosaic mode pre-buffers the next video while the current one plays.

### Compatibility Checks

Before gapless transition, the player verifies format compatibility:

```javascript
// media/gapless-playback.js
// Checks: container type, codec, aspect ratio, DRM status,
// audio sample rate, audio channel count, resolution
```

Incompatibility reasons that block gapless:
- Container mismatch (MP4 vs WebM)
- Codec mismatch
- DRM status change
- Audio sample rate mismatch (except on Chrome)
- Aspect ratio change
- Resolution change beyond threshold

### Transition States

```
0: NOT_STARTED
1: PREPARING
2: READY
3: TRANSITIONING
4: COMPLETED
5: FAILED
```

**Reference**: `media/gapless-playback.js`, `media/ad-prebuffer.js`

---

## 12. Live Streams

Live streams have additional SABR fields:

| Field | Purpose |
|-------|---------|
| `X7` | Live playback pointer (ms) — how far behind live edge |
| `Yl` | Live seek schedule — server-directed seek to live edge |
| `liveEdgeMs` | Current live edge position |

Live-specific behavior:
- More frequent SABR requests (server needs up-to-date buffer state)
- Server may issue SABR seek directives to jump to live edge
- Head sequence number (`headSeqnum`) and time (`headTimeMillis`) track the latest available segment

**Reference**: `onesie-request.js:1186-1237`, `media/live-playback.js`, `media/live-state.js`

---

## 13. Experiment Flags

Key experiments controlling Onesie behavior:

| Flag | Default | Purpose |
|------|---------|---------|
| `html5_onesie_check_timeout` | false | Enable 500ms health checks |
| `html5_onesie_redirector_timeout_ms` | — | Timeout for CDN URL resolution |
| `html5_onesie_verbose_timing` | false | Enable detailed timing logs |
| `html5_onesie_wait_for_media_availability` | false | Wait for media before completing |
| `html5_onesie_media_capabilities` | false | Include device capabilities in request |
| `html5_log_onesie_empty_oauth` | false | Log missing OAuth token |
| `onesie_cdm_mosaic_send_audio_tracks_from_client` | false | Mosaic audio handling |
| `html5_server_playback_start_policy` | false | Use server's playback start policy |
| `html5_use_ump_request_slicer` | false | Async UMP segment processing |
| `html5_shorts_gapless_restart_on_init_seg_retries` | false | Restart on stuck init segments |

---

## 14. Source File Map

### Core Onesie

| File | Lines | Description |
|------|-------|-------------|
| `media/onesie-request.js` | ~1,600 | OnesieRequest + OnesieRequestHandler — transport, SABR, UMP integration |
| `media/perf-continuation.js` | ~900 | DashLoader — creates OnesieRequestHandler, coordinates playback |
| `media/drm-signature.js` | ~800 | Encryption pipeline — encryptSignatureAsync/Cached/Sync |

### Segment Pipeline

| File | Lines | Description |
|------|-------|-------------|
| `media/segment-loader.js` | ~700 | Segment scheduling, buffer checks, pipeline depth |
| `media/segment-request.js` | ~900 | DashSegmentRequest, format selection, ABR |
| `media/segment-writer.js` | ~800 | SourceBufferWriter — MSE append, seek, timestamps |
| `media/playback-controller.js` | ~700 | DashSegmentRequest transport, XHR setup |

### Media Pipeline

| File | Lines | Description |
|------|-------|-------------|
| `media/media-source.js` | ~600 | MediaSource/SourceBuffer lifecycle |
| `media/source-buffer.js` | ~800 | Dual source buffer management |
| `media/buffer-manager.js` | ~600 | Buffer health, readahead, seek |
| `media/quality-manager.js` | ~800 | Bandwidth estimation, quality labels |
| `media/format-parser.js` | ~600 | EBML/WebM and BMFF/MP4 container parsing |

### Format & Codec

| File | Lines | Description |
|------|-------|-------------|
| `media/codec-tables.js` | ~700 | itag↔codec maps, quality ordinals |
| `media/codec-detection.js` | ~600 | Codec capability probing, HDR support |
| `media/codec-helpers.js` | ~600 | Container type, buffer checks, codec switching |
| `media/format-setup.js` | ~600 | Format selection, family preference |
| `media/format-mappings.js` | ~900 | Ad params, DAI config, format descriptors |

### DRM

| File | Lines | Description |
|------|-------|-------------|
| `media/drm-manager.js` | ~800 | EME session lifecycle, license management |
| `media/drm-segment.js` | ~400 | DRM segment handling |

### Live & Gapless

| File | Lines | Description |
|------|-------|-------------|
| `media/live-playback.js` | ~400 | Live stream seeking, edge tracking |
| `media/live-state.js` | ~400 | Live state machine |
| `media/gapless-playback.js` | ~300 | Shorts gapless loop, format compatibility |

---

## Timing Telemetry Tags

The player logs detailed timing marks for Onesie requests:

| Tag | Event |
|-----|-------|
| `or_i` | Onesie request init |
| `oloc_ss` | Location resolution start |
| `oloc_e` | Location resolution end |
| `orqb_w` | WebCrypto encryption |
| `orqb_a` | Async encryption |
| `orqb_s` | Sync encryption |
| `orqb_e` | Encryption end |
| `osor` | Start of request (XHR dispatched) |
| `or_p` | XHR pending |
| `or100k` | First 100 KB received |
| `or_fs` | Finished successfully |
| `or_fe` | Finished with error |
| `ombup` | UMP buffer update |
| `oafs_r` | Audio format segment received |
| `ovfs_r` | Video format segment received |
| `omp_r` / `omp_c` | Mosaic partial received/complete |

**Reference**: `onesie-request.js:516-957`
