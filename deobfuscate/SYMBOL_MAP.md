# Symbol Map: Obfuscated -> Readable Names

This file tracks all name mappings discovered during deobfuscation.

## Global Namespace (`g.` / `_yt_player`)

| Obfuscated | Readable | File | Confidence |
|-----------|----------|------|------------|
| `g.qK` | `Disposable` | core/disposable.js | High |
| `g.$K` | `PubSub` | core/event-target.js | High |
| `g.W1` | `ObservableTarget` | core/event-target.js | High |
| `g.db` | `EventHandler` | core/event-handler.js | High |
| `g.tG` | `DomEvent` | core/dom-event.js | High |
| `g.DE` | `Timer` | core/timer.js | High |
| `g.Uc` | `Delay` | core/timer.js | High |
| `g.H8` | `PlayerError` | core/errors.js | High |
| `g.fg` | `IdbKnownError` | core/errors.js | High |
| `g.A1` | `FetchError` | core/errors.js | High |
| `g.P8` | `PromiseWrapper` | core/promise.js | High |
| `g.RF` | `ClosurePromise` | core/promise.js | Medium |
| `g.Mu` | `UIComponent` | player/base-component.js | High |
| `g.k` | `PlayerComponent` | player/component.js | High |
| `g.KK` | `ContainerComponent` | player/container-component.js | High |
| `g.zj` | `PlayerModule` | player/base-module.js | High |
| `g.GN` | `registerModule` | player/module-registry.js | High |
| `g.C8` | `CueRange` | ui/cue-range.js | High |
| `g.ZRD` | `ProgressBar` | ui/progress-bar.js | High |
| `g.zz` | `CaptionTrack` | data/caption-track.js | High |
| `g.Ci` | `CaptionDataComponent` | player/base-data-component.js | Medium |
| `g.M0` | `EmbeddedCaptionData` | player/base-data-component.js | Medium |
| `g.Jc` | `LegacyCaptionData` | player/base-data-component.js | Medium |
| `g.$R` | `EventTargetBase` | core/event-target.js | Medium |
| `g.aY` | `XhrIo` | network/request.js | High |
| `g.$c` | `MenuPanel` | ui/controls/menu.js | High |
| `g.PL` | `Popup` | ui/controls/menu.js | High |
| `g.LH` | `BottomChrome` | ui/layout/chrome.js | High |
| `g.P` | `isExperimentEnabled` | features/experiment-flags.js | High |
| `g.v` | `getConfig` | features/experiment-flags.js | High |
| `g.Ne` | `getInnertubeConfig` | network/innertube-client.js | High |
| `g.iV` | `buildInnertubeContext` | network/innertube-client.js | High |
| `g.Oh` | `buildFullInnertubeContext` | network/innertube-client.js | High |
| `g.$h` | `sendInnertubeApiRequest` | network/innertube-client.js | High |
| `g.vu` | `buildInnertubeApiPath` | network/service-endpoints.js | High |
| `g.Wn` | `sendXhrRequest` | network/request.js | High |
| `g.o2` | `sendWithRetry` | network/retry-policy.js | High |
| `yT` | `PlayerModule` | player/account-linking.js | High |
| `Kx` | `BaseEntityActionHandler` | modules/offline/offline-orchestration.js | High |

## Utility Functions

| Obfuscated | Readable | Signature | Confidence |
|-----------|----------|-----------|------------|
| `g.lw` | `forEach` | `(arr, fn, ctx)` | High |
| `g.uw` | `filter` | `(arr, fn, ctx)` | High |
| `g.RW` | `every` | `(arr, fn, ctx)` | High |
| `g.hy` | `map` | `(arr, fn, ctx)` | High |
| `g.Yx` | `find` | `(arr, fn, ctx)` | High |
| `g.p7` | `findLastIndex` | `(arr, fn, ctx)` | High |
| `g.v3` | `lastElement` | `(arr)` | High |
| `g.Ta` | `removeAt` | `(arr, idx)` | High |
| `g.q9` | `splice` | `(arr, idx, deleteCount, ...items)` | High |
| `g.xE` | `clear` | `(arr)` | High |
| `g.iw` | `isArrayLike` | `(val)` | High |
| `g.Sd` | `isObject` | `(val)` | High |
| `g.ZR` | `getUid` | `(obj)` | High |
| `g.sO` | `partial` | `(fn, ...args)` | High |
| `g.d0` | `now` | `()` | High |
| `g.bw` | `inherits` | `(child, parent)` | High |
| `g.lm` | `clamp` | `(val, min, max)` | High |
| `g.um` | `flooredModulo` | `(a, b)` | High |
| `g.N$` | `compareVersions` | `(a, b)` | High |
| `g.ZS` | `forEachObject` | `(obj, fn, ctx)` | High |
| `g.Ev` | `filterObject` | `(obj, fn, ctx)` | High |
| `g.Lm` | `someObject` | `(obj, fn, ctx)` | High |
| `g.bD` | `firstKey` | `(obj)` | High |
| `g.P9` | `isEmptyObject` | `(obj)` | High |
| `g.lD` | `clearObject` | `(obj)` | High |
| `g.uD` | `getWithDefault` | `(obj, key, def)` | High |
| `g.hH` | `shallowEquals` | `(a, b)` | High |
| `g.za` | `shallowClone` | `(obj)` | High |
| `g.Cm` | `deepClone` | `(obj)` | High |
| `g.JH` | `extendObject` | `(target, ...srcs)` | High |
| `g.HB` | `createElement` | `(tag, attrs)` | High |
| `g.VN` | `setClassName` | `(el, cls)` | High |
| `g.EZ` | `setTextContent` | `(el, text)` | High |
| `g.y0` | `removeChildren` | `(el)` | High |
| `g.Nn` | `createTextNode` | `(text)` | High |
| `g.JA` | `setStyle` | `(el, styles)` | High |
| `g.L` | `toggleClass` | `(el, cls, on)` | High |
| `g.B7` | `hasClass` | `(el, cls)` | High |
| `g.xK` | `addClass` | `(el, cls)` | High |
| `g.n6` | `removeClass` | `(el, cls)` | High |
| `g.FQ` | `removeNode` | `(el)` | High |
| `g.ZJ` | `containsNode` | `(parent, child)` | High |
| `g.iI` | `appendChild` | `(parent, child)` | High |
| `g.ee` | `showElement` | `(el, visible)` | High |
| `g.ml` | `setPosition` | `(el, x, y)` | High |
| `g.XI` | `setSize` | `(el, w, h)` | High |
| `g.Tk` | `getPageOffset` | `(el)` | High |
| `g.ps` | `getStyle` | `(el, prop)` | High |
| `g.qN` | `parseUri` | `(uri)` | High |
| `g.D9` | `getDomain` | `(uri)` | High |
| `g.Hh` | `getOrigin` | `(uri)` | High |
| `g.EJ` | `buildQueryFromObject` | `(obj)` | High |
| `g.sJ` | `appendParamsToUrl` | `(url, params)` | High |
| `g.eX` | `setUriQueryParam` | `(uri, key, val)` | High |
| `g.Hb` | `encodeParam` | `(val)` | High |
| `g.iC` | `getUserAgent` | `()` | High |
| `g.JE` | `isFullscreenEnabled` | `()` | High |
| `g.xt` | `triggerEvent` | `(target, name, val)` | High |
| `g.n9` | `isEmptyOrWhitespace` | `(str)` | High |
| `g.D7` | `contains` | `(str, substr)` | High |
| `g.yC` | `toString` | `(val)` | High |
| `g.Gk` | `stringToUtf8ByteArray` | `(str)` | High |
| `g.DR` | `getObjectByPath` | `(path, obj)` | High |
| `g.EO` | `bind` | `(fn, ctx)` | High |
| `g.Ov` | `objectKeys` | `(obj)` | High |
| `g.fm` | `hasKey` | `(obj, key)` | High |
| `g.a0` | `containsValue` | `(obj, val)` | High |

## Protobuf

| Obfuscated | Readable | File | Confidence |
|-----------|----------|------|------------|
| `Jjx` | `BinaryReader` | proto/protobuf-reader.js | High |
| `Omx` | `ProtoDecoder` | proto/protobuf-reader.js | High |
| `kVK` | `BufferWriter` | proto/protobuf-writer.js | High |
| `YRO` | `ProtoEncoder` | proto/protobuf-writer.js | High |
| `ZZ` | `readVarint32` | proto/protobuf-reader.js | High |
| `S0` | `readVarint64` | proto/protobuf-reader.js | High |
| `Gp` | `nextTag` | proto/protobuf-reader.js | High |
| `$C` | `skipField` | proto/protobuf-reader.js | High |
| `P_` | `readMessage` | proto/protobuf-reader.js | High |
| `ho` | `readString` | proto/protobuf-reader.js | High |
| `zp` | `readBytes` | proto/protobuf-reader.js | High |
| `Sj` | `buildDescriptorTable` | proto/proto-helpers.js | High |
| `n0` | `FieldDescriptor` | proto/proto-helpers.js | High |

## Compression (zlib)

| Obfuscated | Readable | File | Confidence |
|-----------|----------|------|------------|
| `cz` | `Deflate` | compression/zlib.js | High |
| `Ui` | `gzip` | compression/zlib.js | High |
| `YTd` | `DeflateState` | compression/zlib.js | High |
| `Wz` | `ZStream` | compression/zlib.js | High |
| `MV` | `adler32` | compression/zlib.js | High |
| `J9` | `crc32` | compression/zlib.js | High |
| `Cu` | `longest_match` | compression/zlib.js | High |
| `Rd` | `fill_window` | compression/zlib.js | High |
| `pSm` | `deflate` | compression/zlib.js | High |

## Media Engine

| Obfuscated | Readable | File | Confidence |
|-----------|----------|------|------------|
| `Kk` | `EbmlReader` | media/format-parser.js | High |
| `UI` | `readVint` | media/format-parser.js | High |
| `sI` | `ByteRange` | media/format-parser.js | High |
| `hY` | `SegmentTimelineAccumulator` | media/format-parser.js | High |
| `Xc` | `buildVp9MimeType` | media/codec-detection.js | High |
| `P5w` | `isFormatPlayable` | media/codec-detection.js | High |
| `Cg7` | `buildKeySystemOrder` | media/codec-detection.js | High |
| `MEO` | `buildMediaKeySystemConfig` | media/codec-detection.js | High |
| `xU` | `DashSegmentRequest` | media/playback-controller.js | High |
| `Cb` | `SabrRequest` | media/playback-controller.js | High |
| `sWa` | `RequestTimeoutMonitor` | media/playback-controller.js | High |
| `h_D` | `TrackState` | media/playback-controller.js | High |
| `Xu` | `ChunkedByteBuffer` | media/segment-request.js | High |
| `MB` | `PESEncoderError` | proto/varint-decoder.js | High |

## Network

| Obfuscated | Readable | File | Confidence |
|-----------|----------|------|------------|
| `g.aY` | `XhrIo` | network/request.js | High |
| `pZ` | `FetchXhr` | network/request.js | High |
| `cn` | `sendRawXhr` | network/request.js | High |
| `H3W` | `sendFetchRequest` | network/request.js | High |
| `aQ` | `InnerTubeTransportService` | network/innertube-client.js | High |
| `Vaw` | `CachedResponse` | network/innertube-client.js | High |
| `fZ7` | `buildAuthHeaders` | network/innertube-client.js | High |
| `YN3` | `buildDefaultInnertubeHeaders` | network/innertube-client.js | High |
| `QFO` | `resolveEndpointPath` | network/service-endpoints.js | High |

## Ad System

| Obfuscated | Readable | File | Confidence |
|-----------|----------|------|------------|
| `MzH` | `AdModule` | ads/ad-module.js | High |
| `Dno` | `AdProgressTracker` | ads/ad-module.js | High |
| `ZXK` | `AdFeedbackDialog` | ads/ad-renderer.js | High |
| `OXx` | `AdInfoDialog` | ads/ad-renderer.js | High |
| `jtX` | `SkipButton` | ads/ad-renderer.js | High |
| `CI9` | `AdUIContainer` | ads/ad-renderer.js | High |
| `MuW` | `ControlFlowManager` | ads/ad-triggers.js | High |
| `TNW` | `SlotState` | ads/ad-triggers.js | High |
| `PI` | `MetadataCollection` | ads/ad-triggers.js | High |
| `RL` | `FulfilledLayoutMetadata` | ads/slot-id-generator.js | High |
| `Tv` | `InteractionsProgressMetadata` | ads/slot-id-generator.js | High |
| `IL` | `VideoLengthSecondsMetadata` | ads/slot-id-generator.js | High |
| `XT` | `PlayerVarsMetadata` | ads/slot-id-generator.js | High |
| `VM` | `InstreamOverlayRendererMetadata` | ads/slot-id-generator.js | High |
| `Bc` | `PlayerOverlayLayoutMetadata` | ads/slot-id-generator.js | High |
| `Pc` | `AdPodSkipIndexMetadata` | ads/slot-id-generator.js | High |
| `Ut` | `ContentCpnMetadata` | ads/slot-id-generator.js | High |
| `DI` | `SodarExtensionMetadata` | ads/slot-id-generator.js | High |
| `NZ` | `ActiveViewTrafficTypeMetadata` | ads/slot-id-generator.js | High |

## UI Components

| Obfuscated | Readable | File | Confidence |
|-----------|----------|------|------------|
| `f_w` | `NotificationToggleButton` | ui/controls/button.js | High |
| `BOZ` | `ExpandControlsButton` | ui/controls/button.js | High |
| `njS` | `JumpButton` | ui/controls/button.js | High |
| `wK` | `AdButtonRenderer` | ui/controls/button.js | High |
| `kp` | `AdToggleButton` | ui/controls/toggle-button.js | High |
| `gjS` | `GenericSlider` | ui/controls/slider.js | High |
| `JPo` | `VolumeSliderPanel` | ui/controls/slider.js | High |
| `Gj` | `Panel` | ui/controls/menu.js | High |
| `APW` | `BottomGradient` | ui/layout/chrome.js | High |
| `kY1` | `BottomChrome` | ui/layout/chrome.js | High |
| `W1H` | `EmbedChrome` | ui/layout/chrome.js | High |
| `qy1` | `FullscreenButton` | ui/layout/fullscreen.js | High |
| `nBW` | `ChapterProgressSegment` | ui/progress-bar.js | High |
| `Fk1` | `ScrubberPosition` | ui/progress-bar.js | High |
| `Z6` | `MarkerStyle` | ui/cue-range.js | High |
| `UWK` | `CueRangeCallback` | ui/cue-range.js | High |
| `MY` | `PopupWidget` | ui/menu-base.js | High |

## Satellite Modules

| Obfuscated | Readable | File | Confidence |
|-----------|----------|------|------------|
| `cK` | `CaptionWindow` | modules/caption/caption-renderer.js | High |
| `WKv` | `LiveCaptionFetcher` | modules/caption/caption-track-list.js | High |
| `m6v` | `ManifestCaptionProvider` | modules/caption/caption-track-list.js | High |
| `t0a` | `SabrCaptionProvider` | modules/caption/caption-track-list.js | High |
| `iT` | `AutoplayCountdownOverlay` | modules/endscreen/autoplay-countdown.js | High |
| `Q$W` | `CompactAutoplayWidget` | modules/endscreen/autoplay-countdown.js | High |
| `mqW` | `VideowallStill` | modules/endscreen/suggestion-card.js | High |
| `SND` | `YouTubeOfflineManager` | modules/offline/offline-module.js | High |
| `nkZ` | `TransferManager` | modules/offline/download-manager.js | High |
| `e3Z` | `OrchestrationControl` | modules/offline/download-manager.js | High |
| `A31` | `OfflineBroadcastChannels` | modules/offline/download-manager.js | High |
| `yQS` | `OfflineSlate` | modules/heartbeat/health-monitor.js | High |
| `RKv` | `ExpandWatchPageButton` | modules/miniplayer/miniplayer-controls.js | High |
| `kO9` | `MiniplayerUI` | modules/miniplayer/miniplayer-controls.js | High |
| `GQa` | `BrowserChannelSession` | modules/remote/mdx-client.js | High |
| `vuo` | `WebChannelSession` | modules/remote/mdx-client.js | High |
| `rJa` | `OnlineScreenService` | modules/remote/mdx-client.js | High |
| `d1W` | `RemotePlayerProxy` | modules/remote/remote-player.js | High |
| `xq` | `RemoteConnection` | modules/remote/remote-player.js | High |
| `Lvo` | `QueueManager` | modules/remote/remote-player.js | High |
| `EG` | `CastController` | modules/remote/cast-controls.js | High |
| `yl` | `CastSession` | modules/remote/cast-controls.js | High |
| `gFS` | `CastDevicePicker` | modules/remote/cast-controls.js | High |
| `bG0` | `PrivacyPopupDialog` | modules/remote/cast-controls.js | High |
| `jOH` | `RemoteDisplayStatus` | modules/remote/cast-controls.js | High |

## Disposable Class Properties

| Obfuscated | Readable | Context | Confidence |
|-----------|----------|---------|------------|
| `w7` | `isDisposed_` | Disposable field | High |
| `yY` | `onDisposeCallbacks_` | Disposable field | High |
| `u0()` | `isDisposed()` | Disposable method | High |
| `WA()` | `disposeInternal()` | Disposable method | High |
| `Hw` | `pubsub_` | ObservableTarget field | High |

## EventTarget/PubSub Properties

| Obfuscated | Readable | Context | Confidence |
|-----------|----------|---------|------------|
| `D` | `nextSlot_` | PubSub field | High |
| `A` | `pendingRemoval_` | PubSub field | High |
| `j` | `publishDepth_` | PubSub field | High |
| `W` | `slots_` | PubSub field | High |
| `O` | `topics_` | PubSub field | High |
| `bU()` | `unsubscribeByKey()` | PubSub method | High |
