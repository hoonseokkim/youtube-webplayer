/**
 * Remote Player -- Remote player proxy and connection management
 *
 * Source: player_es6.vflset/en_US/remote.js
 *   - RemotePlayerState [was: sG] lines 2412-5729
 *   - RemotePlayerProxy [was: d1W] lines 5731-5998
 *   - RemoteConnection [was: xq] lines 6000-6210
 *   - QueueManager [was: Lvo] lines 6276-6517
 *   - Connection message handling [was: cdD, laa, etc.] lines 2554-2796
 *
 * Provides:
 *  - RemotePlayerState: mirrors video playback state on remote device
 *  - RemotePlayerProxy: sends play/pause/seek/volume to remote device
 *  - RemoteConnection: manages the lounge channel connection lifecycle
 *  - QueueManager: bridges remote proxy events to the local player UI
 */

import {
import { safeSetTimeout } from '../../data/idb-transactions.js'; // was: g.zn
import { CastSession } from './cast-controls.js'; // was: yl
import { startIconMorphAnimation } from '../../player/video-loader.js'; // was: nY
import { jsonSerialize } from '../../core/event-registration.js'; // was: g.bS
import { disposeApp } from '../../player/player-events.js'; // was: WA
import { listen } from '../../core/dom-listener.js'; // was: g.ph
import { getRemoteSessionScreenId } from '../../core/attestation.js'; // was: g.Xd
import { safeClearTimeout } from '../../data/idb-transactions.js'; // was: g.JB
import { getCookie } from '../../core/misc-helpers.js'; // was: g.V5
import { unlisten } from '../../core/dom-listener.js'; // was: g.Qg
import { statesMatch } from '../../media/source-buffer.js'; // was: g.xT
import { plusDecode } from '../../data/idb-transactions.js'; // was: Ni
import { PlayerStateChange } from '../../player/component-events.js'; // was: g.tS
import { getDuration, getCurrentTime, updateProgress, getVolume, isMuted } from '../../player/time-tracking.js';
import { deepClone, extendObject, isEmptyObject } from '../../core/object-utils.js';
import { Disposable } from '../../core/disposable.js';
import { getConnection, logMdx, createChannelSession, getLocationOverride } from './mdx-client.js';
import { seekTo, dispose } from '../../ads/dai-cue-range.js';
import { partial, getObjectByPath } from '../../core/type-helpers.js';
import { setVolume, getSubtitlesUserSettings, syncVolume, unMute } from '../../player/player-api.js';
import { playVideo, nextVideo } from '../../player/player-events.js';
import { clear, every } from '../../core/array-utils.js';
import { stringToUtf8ByteArray, toString } from '../../core/string-utils.js';
import { EventHandler } from '../../core/event-handler.js';
import { PlayerState } from '../../media/codec-tables.js';
import { Timer } from '../../core/timer.js';
  createChannelSession,
  logMdx,
  getConnection,
  ScreenInfo,
  MdxDevice,
  screenMatchesId,
  getLocationOverride,
} from './mdx-client.js';

// TODO: resolve g.vB -- noOp, an empty no-op callback function
// TODO: resolve g.lj -- hashString(value, algorithm), produces a hash of the input

// ---------------------------------------------------------------------------
// RemotePlayerState [was: sG] (lines 2412-5729)
// ---------------------------------------------------------------------------

/**
 * Represents the playback state of a remote (cast) device.
 * Tracks video ID, player state, volume, time, track data, etc.
 * [was: sG]
 */
export class RemotePlayerState { // was: sG
  /**
   * @param {Object} [data] -- serialized state to restore [was: Q]
   */
  constructor(data) {
    /** @type {number} [was: this.index] */
    this.index = -1;
    /** @type {string} [was: this.videoId] */
    this.videoId = '';
    /** @type {string} [was: this.listId] */
    this.listId = '';
    /** @type {number} [was: this.playerState] -- -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, -1000=error, 1081=ad playing, etc. */
    this.playerState = -1;
    /** @type {number} [was: this.volume] -- 0-100, -1=unknown */
    this.volume = -1;
    /** @type {boolean} [was: this.muted] */
    this.muted = false;
    /** @type {string|null} [was: this.audioTrackId] */
    this.audioTrackId = null;
    /**
     * Current playback time in seconds.
     * [was: this.D]
     * @type {number}
     */
    this.playerTime = 0; // was: this.D
    /**
     * Timestamp (ms) when playerTime was last recorded.
     * [was: this.K]
     * @type {number}
     */
    this.playerTimeAt = 0; // was: this.K
    /** @type {Object|null} [was: this.trackData] -- subtitle track data */
    this.trackData = null;
    /** @type {boolean} [was: this.hasPrevious] */
    this.hasPrevious = false;
    /** @type {boolean} [was: this.hasNext] */
    this.hasNext = false;
    /**
     * Seekable start time.
     * [was: this.O]
     * @type {number}
     */
    this.seekableStart = 0; // was: this.O
    /**
     * Seekable end time.
     * [was: this.J]
     * @type {number}
     */
    this.seekableEnd = 0; // was: this.J
    /**
     * Duration of the current video.
     * [was: this.A]
     * @type {number}
     */
    this.duration = 0; // was: this.A
    /** @type {number} [was: this.loadedTime] */
    this.loadedTime = 0;
    /**
     * Live stream ingestion time (NaN if not live).
     * [was: this.W]
     * @type {number}
     */
    this.liveIngestionTime = NaN; // was: this.W
    /**
     * Whether this is a live stream.
     * [was: this.j]
     * @type {boolean}
     */
    this.isLive = false; // was: this.j

    this.reset(data);
  }

  /**
   * Reset all state, optionally restoring from serialized data.
   * [was: sG.prototype.reset]
   */
  reset(data) {
    this.listId = '';
    this.index = -1;
    this.videoId = '';
    this.clearPlaybackState(); // was: dz
    this.volume = -1;
    this.muted = false;

    if (data) {
      this.index = data.index;
      this.listId = data.listId;
      this.videoId = data.videoId;
      this.playerState = data.playerState;
      this.volume = data.volume;
      this.muted = data.muted;
      this.audioTrackId = data.audioTrackId;
      this.trackData = data.trackData;
      this.hasPrevious = data.hasPrevious;
      this.hasNext = data.hasNext;
      this.playerTime = data.playerTime;
      this.playerTimeAt = data.playerTimeAt;
      this.seekableStart = data.seekableStart;
      this.seekableEnd = data.seekableEnd;
      this.duration = data.duration;
      this.loadedTime = data.loadedTime;
      this.liveIngestionTime = data.liveIngestionTime;
      this.isLive = !isNaN(this.liveIngestionTime);
    }
  }

  /**
   * Clear dynamic playback fields (state, time, etc.).
   * [was: dz]
   */
  clearPlaybackState() { // was: dz
    this.audioTrackId = null;
    this.trackData = null;
    this.playerState = -1;
    this.hasPrevious = false;
    this.hasNext = false;
    this.playerTime = 0;
    this.playerTimeAt = now();
    this.seekableStart = 0;
    this.seekableEnd = 0;
    this.duration = 0;
    this.loadedTime = 0;
    this.liveIngestionTime = NaN;
    this.isLive = false;
  }

  /** Whether the player is currently playing. [was: isPlaying] */
  isPlaying() {
    return this.playerState === 1;
  }

  /** Whether the player is buffering. [was: isBuffering] */
  isBuffering() {
    return this.playerState === 3;
  }

  /**
   * Set the duration.
   * [was: ly]
   */
  setDuration(value) { // was: ly
    this.duration = isNaN(value) ? 0 : value;
  }

  /**
   * Get the effective duration (accounts for live elapsed time).
   * [was: getDuration]
   */
  getDuration() {
    return this.isLive ? this.duration + getElapsedPlayTime(this) : this.duration;
  }

  /** Clone this state. [was: clone] */
  clone() {
    return new RemotePlayerState(serializeState(this));
  }
}

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

/**
 * Elapsed time since playerTimeAt if playing.
 * [was: L1]
 */
export function getElapsedPlayTime(state) { // was: L1
  return state.isPlaying() ? (now() - state.playerTimeAt) / 1000 : 0;
}

/**
 * Update playerTime and reset the timestamp.
 * [was: wz]
 */
export function setPlayerTime(state, time) { // was: wz
  state.playerTime = time;
  state.playerTimeAt = now();
}

/**
 * Get estimated current playback position.
 * [was: b$]
 */
export function getEstimatedTime(state) { // was: b$
  switch (state.playerState) {
    case 1:    // playing
    case 1081: // ad playing
      return (now() - state.playerTimeAt) / 1000 + state.playerTime;
    case -1000: // error
      return 0;
  }
  return state.playerTime;
}

/**
 * Get seekable end time (accounts for live elapsed).
 * [was: aaD]
 */
export function getSeekableEnd(state) { // was: aaD
  return state.isLive ? state.seekableEnd + getElapsedPlayTime(state) : state.seekableEnd;
}

/**
 * Set the video and index, clearing playback state if video changed.
 * [was: j6]
 */
function setVideo(state, videoId, index) { // was: j6
  const previousVideoId = state.videoId;
  state.videoId = videoId;
  state.index = index;
  if (videoId !== previousVideoId) state.clearPlaybackState();
}

/**
 * Serialize the state to a plain object.
 * [was: gz]
 */
export function serializeState(state) { // was: gz
  return {
    index: state.index,
    listId: state.listId,
    videoId: state.videoId,
    playerState: state.playerState,
    volume: state.volume,
    muted: state.muted,
    audioTrackId: state.audioTrackId,
    trackData: deepClone(state.trackData),
    hasPrevious: state.hasPrevious,
    hasNext: state.hasNext,
    playerTime: state.playerTime,
    playerTimeAt: state.playerTimeAt,
    seekableStart: state.seekableStart,
    seekableEnd: state.seekableEnd,
    duration: state.duration,
    loadedTime: state.loadedTime,
    liveIngestionTime: state.liveIngestionTime,
  };
}

// ---------------------------------------------------------------------------
// RemotePlayerProxy [was: d1W] (lines 5731-5998)
// ---------------------------------------------------------------------------

/**
 * Proxy for a remote cast player. Sends commands (play, pause, seek, etc.)
 * via the lounge channel and mirrors state from the remote device.
 *
 * Uses the Chrome Cast SDK when available, falls back to MDX browser channel.
 * [was: d1W]
 */
export class RemotePlayerProxy extends Disposable { // was: d1W extends g.W1
  constructor() {
    const connection = getConnection(); // was: o3()
    super();

    /** @type {number} [was: this.A] -- current proxy state: 0=connecting, 1=connected, 2=reconnecting, 3=disconnected */
    this.proxyState = 0; // was: this.A

    /** @type {RemoteConnection} [was: this.j] */
    this.connection = connection; // was: this.j

    /** @type {Array<number>} [was: this.J] -- subscription keys */
    this.subscriptionKeys = []; // was: this.J

    /** @type {Queue} [was: this.K] -- pending command queue */
    this.pendingCommands = new iOS(); // was: this.K (Queue class)

    /** @type {Object|null} [was: this.O] -- cast session (chrome.cast.Session) */
    this.castSession = null; // was: this.O

    /** @type {Object|null} [was: this.W] -- cast media (chrome.cast.media.Media) */
    this.castMedia = null; // was: this.W

    /** @type {Function} [was: this.S] -- cast session update listener */
    this.onCastSessionUpdate = this.handleCastSessionUpdate.bind(this); // was: (0, g.EO)(this.Ka, this)

    /** @type {Function} [was: this.Y] -- cast media listener */
    this.onCastMediaAdded = this.handleCastMediaAdded.bind(this); // was: (0, g.EO)(this.D, this)

    /** @type {Function} [was: this.mF] -- media update listener */
    this.onCastMediaUpdate = this.handleCastMediaUpdate.bind(this); // was: (0, g.EO)(this.MM, this)

    /** @type {Function} [was: this.Ie] -- session change listener */
    this.onCastSessionChange = this.handleCastSessionChange.bind(this); // was: (0, g.EO)(this.jG, this)

    // Initialize state from connection
    let initialState = 3; // disconnected
    if (connection) {
      initialState = connection.getProxyState();
      if (initialState !== 3) {
        connection.subscribe('proxyStateChange', this.onProxyStateChange, this);
        this.subscribeToPlayerEvents(); // was: GSv
      }
    }

    if (initialState !== 0) {
      safeSetTimeout(() => this.onProxyStateChange(initialState), 0);
    }

    // Attach to any existing Cast session
    const castSession = getCastSession(); // was: faH
    if (castSession) this.setCastSession(castSession); // was: OG

    this.subscribe('yt-remote-cast2-session-change', this.onCastSessionChange);
  }

  /** @returns {number} current proxy state [was: getState] */
  getState() {
    return this.proxyState;
  }

  /** Get reconnect timeout from the connection. [was: nY] */
  startIconMorphAnimation() {
    return this.connection.getReconnectTimeout();
  }

  /** Reconnect the channel. [was: ip] */
  ip() {
    this.connection.reconnect();
  }

  // -----------------------------------------------------------------------
  // Playback controls
  // -----------------------------------------------------------------------

  /** Resume playback on remote device. [was: play] */
  play() {
    if (isProxyActive(this)) {
      if (this.castMedia) {
        this.castMedia.play(null, g.vB, createCastFallback(this, 'play'));
      } else {
        sendViaBrowserChannel(this, 'play');
      }
      updatePlayerTimeAndState(this, 1, getEstimatedTime(getState(this)));
      this.publish('remotePlayerChange');
    } else {
      enqueueCommand(this, this.play);
    }
  }

  /** Pause playback on remote device. [was: pause] */
  pause() {
    if (isProxyActive(this)) {
      if (this.castMedia) {
        this.castMedia.pause(null, g.vB, createCastFallback(this, 'pause'));
      } else {
        sendViaBrowserChannel(this, 'pause');
      }
      updatePlayerTimeAndState(this, 2, getEstimatedTime(getState(this)));
      this.publish('remotePlayerChange');
    } else {
      enqueueCommand(this, this.pause);
    }
  }

  /**
   * Seek to a time on the remote device.
   * [was: seekTo]
   * @param {number} time -- seconds
   */
  seekTo(time) {
    if (isProxyActive(this)) {
      if (this.castMedia) {
        const state = getState(this);
        const seekRequest = new chrome.cast.media.SeekRequest();
        seekRequest.currentTime = time;
        seekRequest.resumeState = state.isPlaying() || state.isBuffering()
          ? chrome.cast.media.ResumeState.PLAYBACK_START
          : chrome.cast.media.ResumeState.PLAYBACK_PAUSE;
        this.castMedia.seek(seekRequest, g.vB, createCastFallback(this, 'seekTo', { newTime: time }));
      } else {
        sendViaBrowserChannel(this, 'seekTo', { newTime: time });
      }
      updatePlayerTimeAndState(this, 3, time);
      this.publish('remotePlayerChange');
    } else {
      enqueueCommand(this, partial(this.seekTo, time));
    }
  }

  /** Stop video on remote device. [was: stop] */
  stop() {
    if (isProxyActive(this)) {
      if (this.castMedia) {
        this.castMedia.stop(null, g.vB, createCastFallback(this, 'stopVideo'));
      } else {
        sendViaBrowserChannel(this, 'stopVideo');
      }
      const state = getState(this);
      state.index = -1;
      state.videoId = '';
      state.clearPlaybackState();
      applyState(this, state);
      this.publish('remotePlayerChange');
    } else {
      enqueueCommand(this, this.stop);
    }
  }

  /**
   * Set volume on remote device.
   * [was: setVolume]
   * @param {number} volume -- 0-100
   * @param {boolean} muted
   */
  setVolume(volume, muted) {
    if (isProxyActive(this)) {
      const state = getState(this);
      if (this.castSession) {
        if (state.volume !== volume) {
          const level = Math.round(volume) / 100;
          this.castSession.setReceiverVolumeLevel(level, () => {}, () => {});
        }
        if (state.muted !== muted) {
          this.castSession.setReceiverMuted(muted, () => {}, () => {});
        }
      } else {
        const params = { volume, muted };
        if (state.volume !== -1) params.delta = volume - state.volume;
        sendViaBrowserChannel(this, 'setVolume', params);
      }
      state.muted = muted;
      state.volume = volume;
      applyState(this, state);
    } else {
      enqueueCommand(this, partial(this.setVolume, volume, muted));
    }
  }

  /**
   * Set subtitle track on remote device.
   * [was: L]
   * @param {string} videoId
   * @param {Object|null} track
   */
  setSubtitleTrack(videoId, track) { // was: L
    if (isProxyActive(this)) {
      const state = getState(this);
      const params = { videoId };
      if (track) {
        state.trackData = {
          trackName: track.name,
          languageCode: track.languageCode,
          sourceLanguageCode: track.translationLanguage ? track.translationLanguage.languageCode : '',
          languageName: track.languageName,
          kind: track.kind,
        };
        params.style = jsonSerialize(track.style);
        extendObject(params, state.trackData);
      }
      sendViaBrowserChannel(this, 'setSubtitlesTrack', params);
      applyState(this, state);
    } else {
      enqueueCommand(this, partial(this.setSubtitleTrack, videoId, track));
    }
  }

  /**
   * Set audio track on remote device.
   * [was: setAudioTrack]
   */
  setAudioTrack(videoId, audioTrack) {
    if (isProxyActive(this)) {
      const trackId = audioTrack.getLanguageInfo().getId();
      sendViaBrowserChannel(this, 'setAudioTrack', { videoId, audioTrackId: trackId });
      const state = getState(this);
      state.audioTrackId = trackId;
      applyState(this, state);
    } else {
      enqueueCommand(this, partial(this.setAudioTrack, videoId, audioTrack));
    }
  }

  /**
   * Play a video (or playlist) on the remote device.
   * [was: playVideo]
   */
  playVideo(videoId, startTime, index, listId = null, playerParams = null, clickTrackingParams = null, locationInfo = null) {
    const state = getState(this);
    const params = { videoId };

    if (index !== undefined) params.currentIndex = index;
    setVideo(state, videoId, index || 0);

    if (startTime !== undefined) {
      setPlayerTime(state, startTime);
      params.currentTime = startTime;
    }
    if (listId) params.listId = listId;
    if (playerParams) params.playerParams = playerParams;
    if (clickTrackingParams) params.clickTrackingParams = clickTrackingParams;
    if (locationInfo) params.locationInfo = jsonSerialize(locationInfo);

    sendViaBrowserChannel(this, 'setPlaylist', params);
    if (!listId) applyState(this, state);
  }

  /** Go to previous video. [was: Ye] */
  Ye(videoId, index) { // was: Ye (previousVideo)
    if (isProxyActive(this)) {
      if (videoId && index) {
        const state = getState(this);
        setVideo(state, videoId, index);
        applyState(this, state);
      }
      sendViaBrowserChannel(this, 'previous');
    } else {
      enqueueCommand(this, partial(this.Ye, videoId, index));
    }
  }

  /** Go to next video. [was: nextVideo] */
  nextVideo(videoId, index) {
    if (isProxyActive(this)) {
      if (videoId && index) {
        const state = getState(this);
        setVideo(state, videoId, index);
        applyState(this, state);
      }
      sendViaBrowserChannel(this, 'next');
    } else {
      enqueueCommand(this, partial(this.nextVideo, videoId, index));
    }
  }

  /** Clear the remote playlist. [was: l8] */
  clearPlaylist() { // was: l8
    if (isProxyActive(this)) {
      sendViaBrowserChannel(this, 'clearPlaylist');
      const state = getState(this);
      state.reset();
      applyState(this, state);
      this.publish('remotePlayerChange');
    } else {
      enqueueCommand(this, this.clearPlaylist);
    }
  }

  /** Dismiss autoplay suggestion. [was: b0] */
  dismissAutoplay() { // was: b0
    if (isProxyActive(this)) {
      sendViaBrowserChannel(this, 'dismissAutoplay');
    } else {
      enqueueCommand(this, this.dismissAutoplay);
    }
  }

  /** Send a debug command to the remote device. [was: Sz] */
  Sz() {
    sendViaBrowserChannel(this, 'sendDebugCommand', { debugCommand: 'stats4nerds ' });
  }

  // -----------------------------------------------------------------------
  // Internal state management
  // -----------------------------------------------------------------------

  /** [was: dispose] */
  dispose() {
    if (this.proxyState !== 3) {
      const oldState = this.proxyState;
      this.proxyState = 3;
      this.publish('proxyStateChange', oldState, this.proxyState);
    }
    super.dispose();
  }

  /** [was: WA] */
  disposeApp() {
    unsubscribePlayerEvents(this); // was: $b9
    this.connection = null;
    this.pendingCommands.clear();
    this.setCastSession(null);
    super.disposeApp();
  }

  /**
   * Handle proxy state transitions.
   * [was: T2]
   */
  onProxyStateChange(newState) { // was: T2
    if ((newState !== this.proxyState || newState === 2) && this.proxyState !== 3 && newState !== 0) {
      const oldState = this.proxyState;
      this.proxyState = newState;
      this.publish('proxyStateChange', oldState, newState);

      if (newState === 1) {
        // Flush pending commands
        while (!this.pendingCommands.isEmpty()) {
          const cmd = this.pendingCommands; // dequeue pattern
          if (cmd.W.length === 0) { cmd.W = cmd.O; cmd.W.reverse(); cmd.O = []; }
          cmd.W.pop().apply(this);
        }
      } else if (newState === 3) {
        this.dispose();
      }
    }
  }

  /**
   * Forward remote player/queue events to listeners.
   * [was: PA]
   */
  forwardEvent(eventName, data) { // was: PA
    this.publish(eventName, data);
  }

  /**
   * Subscribe to player events from the connection.
   * [was: GSv]
   */
  subscribeToPlayerEvents() { // was: GSv -- inline of GSv
    const events = [
      'nowAutoplaying', 'autoplayDismissed', 'remotePlayerChange',
      'remoteQueueChange', 'autoplayModeChange', 'autoplayUpNext',
      'previousNextChange', 'multiStateLoopEnabled', 'loopModeChange',
    ];
    for (const evt of events) {
      this.subscriptionKeys.push(
        this.connection.subscribe(evt, (data) => this.forwardEvent(evt, data), this)
      );
    }
  }

  // -----------------------------------------------------------------------
  // Cast SDK integration
  // -----------------------------------------------------------------------

  /**
   * Attach or detach a Cast session.
   * [was: OG (free function)]
   */
  setCastSession(session) { // was: OG
    if (this.castSession) {
      this.castSession.removeUpdateListener(this.onCastSessionUpdate);
      this.castSession.removeMediaListener(this.onCastMediaAdded);
      this.handleCastMediaAdded(null);
    }
    this.castSession = session;
    if (this.castSession) {
      this.castSession.addUpdateListener(this.onCastSessionUpdate);
      this.castSession.addMediaListener(this.onCastMediaAdded);
      if (this.castSession.media.length) {
        this.handleCastMediaAdded(this.castSession.media[0]);
      }
    }
  }

  /** [was: Ka -- cast session update] */
  handleCastSessionUpdate(isAlive) {
    if (!isAlive) {
      this.handleCastMediaAdded(null);
      this.setCastSession(null);
    } else if (this.castSession?.receiver?.volume) {
      const volume = this.castSession.receiver.volume;
      const state = getState(this);
      const level = Math.round(100 * volume.level || 0);
      if (state.volume !== level || state.muted !== volume.muted) {
        state.volume = level;
        state.muted = !!volume.muted;
        applyState(this, state);
      }
    }
  }

  /** [was: D -- new cast media] */
  handleCastMediaAdded(media) {
    if (this.castMedia) this.castMedia.removeUpdateListener(this.onCastMediaUpdate);
    this.castMedia = media;
    if (this.castMedia) {
      this.castMedia.addUpdateListener(this.onCastMediaUpdate);
      syncCastMediaState(this); // was: Pd9
      this.publish('remotePlayerChange');
    }
  }

  /** [was: MM -- cast media update] */
  handleCastMediaUpdate(isAlive) {
    if (isAlive) {
      syncCastMediaState(this);
      this.publish('remotePlayerChange');
    } else {
      this.handleCastMediaAdded(null);
    }
  }

  /** [was: jG -- cast session change event] */
  handleCastSessionChange() {
    const session = getCastSession(); // was: faH
    if (session) this.setCastSession(session);
  }
}

// ---------------------------------------------------------------------------
// Proxy internal helpers
// ---------------------------------------------------------------------------

function isProxyActive(proxy) { // was: vH
  return proxy.getState() === 1;
}

function getState(proxy) { // was: f1
  return new RemotePlayerState(proxy.connection.getPlayerContextData());
}

function applyState(proxy, state) { // was: $_
  unsubscribePlayerEvents(proxy); // was: $b9
  proxy.connection.setPlayerContextData(serializeState(state));
  proxy.subscribeToPlayerEvents(); // was: GSv
}

function unsubscribePlayerEvents(proxy) { // was: $b9
  for (const key of proxy.subscriptionKeys) {
    proxy.connection.unsubscribeByKey(key);
  }
  proxy.subscriptionKeys.length = 0;
}

function updatePlayerTimeAndState(proxy, playerState, time) { // was: PH
  const state = getState(proxy);
  setPlayerTime(state, time);
  if (state.playerState !== -1000) state.playerState = playerState;
  applyState(proxy, state);
}

function enqueueCommand(proxy, command) { // was: l$
  const queue = proxy.pendingCommands;
  if (queue.W.length + queue.O.length < 50) {
    queue.enqueue(command);
  }
}

function sendViaBrowserChannel(proxy, action, params) { // was: aV
  proxy.connection.sendMessage(action, params);
}

function createCastFallback(proxy, action, params) { // was: GP
  return (error) => {
    if (error.code !== chrome.cast.ErrorCode.TIMEOUT) {
      sendViaBrowserChannel(proxy, action, params);
    }
  };
}

function syncCastMediaState(proxy) { // was: Pd9
  const media = proxy.castMedia.media;
  const customData = proxy.castMedia.customData;
  if (media && customData) {
    const state = getState(proxy);
    if (media.contentId !== state.videoId) {
      logMdx('CP', 'Cast changing video to: ' + media.contentId);
    }
    state.videoId = media.contentId;
    state.playerState = customData.playerState;
    setPlayerTime(state, proxy.castMedia.getEstimatedTime());
    applyState(proxy, state);
  }
}

function getCastSession() { // was: faH
  if (!isCastInstalled()) return null;
  const cast = getCastInstance();
  return cast ? cast.getCastSession() : null;
}

// Forward imports to avoid circular reference
function isCastInstalled() { return !!getData('yt-remote-cast-installed'); }
function getCastInstance() { return getObjectByPath('yt.mdx.remote.cloudview.instance_'); }  -> getGlobalByPath
// Note: getData is now imported from '../../core/storage.js'

// ---------------------------------------------------------------------------
// RemoteConnection [was: xq] (lines 6000-6210)
// ---------------------------------------------------------------------------

/**
 * Manages the lounge browser/web channel connection to a remote screen.
 * Handles connecting, disconnecting, message routing, and lounge token refresh.
 * [was: xq]
 */
export class RemoteConnection extends Disposable { // was: xq extends g.W1
  /**
   * @param {ScreenInfo} screen [was: Q]
   * @param {boolean} enableInitialState [was: c]
   */
  constructor(screen, enableInitialState = false) {
    const apiClient = loungeApiClient; // was: RV
    const channelParams = getChannelParams(); // was: Kn()
    super();

    /** @type {number} [was: this.D] -- connecting timeout */
    this.connectingTimeout = NaN;
    /** @type {boolean} [was: this.MM] -- needs reconnect */
    this.needsReconnect = false;
    /** @type {number} [was: this.Ie, this.T2, this.mF, this.S] -- various timers */
    this.screenWaitTimeout = NaN;   // was: this.Ie
    this.getNowPlayingTimer = NaN;  // was: this.T2
    this.videoChangeTimer = NaN;    // was: this.mF
    this.idleTimeout = NaN;         // was: this.S
    /** @type {Array} [was: this.b0] -- event listeners */
    this.eventListeners = [];
    /** @type {string|null} [was: this.K] -- autoplay mode */
    this.autoplayMode = null;       // was: this.K
    /** @type {string|null} [was: this.L] -- autoplay video ID */
    this.autoplayVideoId = null;    // was: this.L
    /** @type {string|null} [was: this.j] -- pending video ID for sync check */
    this.pendingVideoId = null;     // was: this.j
    /** @type {RemotePlayerState} [was: this.W] */
    this.playerState = new RemotePlayerState(); // was: this.W
    /** @type {Array<MdxDevice>} [was: this.A] */
    this.connectedDevices = [];     // was: this.A
    /** @type {string} [was: this.La] -- screen ID */
    this.screenId = screen.id;      // was: this.La
    /** @type {string} [was: this.jG] -- screen ID type */
    this.screenIdType = screen.idType; // was: this.jG
    /** @type {boolean} [was: this.PA] -- enable connect with initial state */
    this.enableInitialState = enableInitialState; // was: this.PA
    /** @type {Object} [was: this.HA] -- lounge API client */
    this.apiClient = apiClient;
    /** @type {BrowserChannelSession|WebChannelSession} [was: this.O] */
    this.channel = createChannelSession(
      this.apiClient, channelParams,
      this.getXsrfToken, this.screenIdType === 'shortLived', this.screenId
    );

    // Wire channel events
    this.channel.listen('channelOpened', () => this.onChannelOpened());
    this.channel.listen('channelClosed', () => this.onChannelClosed());
    this.channel.listen('channelError', (evt) => this.onChannelError(evt));
    this.channel.listen('channelMessage', (evt) => this.onChannelMessage(evt));

    this.channel.setLoungeToken(screen.token); // was: this.O.dN(Q.token)

    // Register beforeunload to gracefully disconnect
    this.eventListeners.push(listen(window, 'beforeunload', () => this.disconnect(2)));

    // Sync remote queue changes to session storage
    this.subscribe('remoteQueueChange', () => {
      if (getRemoteSessionScreenId()) setData('yt-remote-session-video-id', this.playerState.videoId);
    });
  }

  /**
   * Connect to the remote screen.
   * [was: connect]
   * @param {number} disconnectReason [was: Q]
   * @param {Object|null} connectData [was: c] -- initial video/playlist data
   */
  connect(disconnectReason, connectData) {
    if (connectData) {
      // Build connection params with video info
      const params = { videoId: connectData.videoId };
      if (connectData.currentTime !== undefined) {
        params.currentTime = connectData.currentTime <= 5 ? 0 : connectData.currentTime;
      }
      if (connectData.playerParams) params.playerParams = connectData.playerParams;
      if (connectData.locationInfo) params.locationInfo = connectData.locationInfo;
      if (connectData.clickTrackingParams) params.clickTrackingParams = connectData.clickTrackingParams;
      if (connectData.listId) params.listId = connectData.listId;
      if (connectData.videoIds?.length > 0) params.videoIds = connectData.videoIds.join(',');
      if (connectData.index !== undefined) params.currentIndex = connectData.index;
      if (this.enableInitialState) params.loopMode = connectData.loopMode || 'LOOP_MODE_OFF';

      // Update local state
      if (connectData.listId) this.playerState.listId = connectData.listId;
      this.playerState.videoId = connectData.videoId;
      this.playerState.index = connectData.index || 0;
      this.playerState.state = 3; // buffering
      setPlayerTime(this.playerState, connectData.currentTime);
      this.autoplayMode = 'UNSUPPORTED';

      const method = this.enableInitialState ? 'setInitialState' : 'setPlaylist';
      this.channel.connect({ method, params: jsonSerialize(params) }, disconnectReason, getSavedBrowserChannel());
    } else {
      this.channel.connect({}, disconnectReason, getSavedBrowserChannel());
    }
    // Set connecting timeout
    this.connectingTimeout = safeSetTimeout(() => { this.disconnect(1); }, 20000);
  }

  /** Update the lounge ID token. [was: dN] */
  setLoungeToken(token) { // was: dN
    this.channel.setLoungeToken(token);
  }

  /** Get proxy state. [was: Fw -- getProxyState] */
  getProxyState() {
    let state = 3; // disconnected
    if (!this.u0()) {
      state = 0; // connecting
      if (!isNaN(this.getReconnectTimeout())) {
        state = 2; // reconnecting
      } else if (this.channel.isConnected() && isNaN(this.connectingTimeout)) {
        state = 1; // connected
      }
    }
    return state;
  }

  /**
   * Disconnect from the remote screen.
   * [was: J -- disconnect]
   * @param {number} reason -- 1=screen gone, 2=beforeunload
   */
  disconnect(reason) {
    setGlobal('yt.mdx.remote.remoteClient_', null);
    clearTimeout(this.connectingTimeout);
    this.connectingTimeout = NaN;
    this.publish('beforeDisconnect', reason);
    if (reason === 1) clearSession(); // was: Sx
    this.channel.disconnect(reason);
    this.dispose();
  }

  /** @returns {Object} serialized player context [was: EC -- getPlayerContextData] */
  getPlayerContextData() {
    let state = this.playerState;
    if (this.pendingVideoId) {
      state = this.playerState.clone();
      setVideo(state, this.pendingVideoId, state.index);
    }
    return serializeState(state);
  }

  /** Set player context from serialized data. [was: iX -- setPlayerContextData] */
  setPlayerContextData(data) {
    const newState = new RemotePlayerState(data);
    // Detect video change and schedule sync
    if (newState.videoId && newState.videoId !== this.playerState.videoId) {
      this.pendingVideoId = newState.videoId;
      safeClearTimeout(this.videoChangeTimer);
      this.videoChangeTimer = safeSetTimeout(() => {
        if (this.pendingVideoId) {
          const vid = this.pendingVideoId;
          this.pendingVideoId = null;
          if (this.playerState.videoId !== vid) {
            this.sendMessage('getNowPlaying');
          }
        }
      }, 5000);
    }

    // Determine which events to fire
    const events = [];
    if (this.playerState.listId !== newState.listId ||
        this.playerState.videoId !== newState.videoId ||
        this.playerState.index !== newState.index) {
      events.push('remoteQueueChange');
    }
    if (this.playerState.playerState !== newState.playerState ||
        this.playerState.volume !== newState.volume ||
        this.playerState.muted !== newState.muted ||
        getEstimatedTime(this.playerState) !== getEstimatedTime(newState) ||
        jsonSerialize(this.playerState.trackData) !== jsonSerialize(newState.trackData)) {
      events.push('remotePlayerChange');
    }

    this.playerState.reset(data);
    for (const evt of events) {
      this.publish(evt);
    }
  }

  /** Get ID of another connected remote control. [was: UH -- getOtherConnectedRemoteId] */
  getOtherConnectedRemoteId() {
    const myId = this.channel.getDeviceId();
    const other = find(this.connectedDevices, (d) => d.type === 'REMOTE_CONTROL' && d.id !== myId);
    return other ? other.id : '';
  }

  /** @returns {number} ms until reconnect [was: Y -- getReconnectTimeout] */
  getReconnectTimeout() {
    return this.channel.getReconnectTimeout();
  }

  /** @returns {string} autoplay mode [was: Y0 -- getAutoplayMode] */
  getAutoplayMode() {
    return this.autoplayMode || 'UNSUPPORTED';
  }

  /** @returns {string} autoplay video ID [was: Re -- getAutoplayVideoId] */
  getAutoplayVideoId() {
    return this.autoplayVideoId || '';
  }

  /** Trigger immediate reconnect. [was: JJ -- reconnect] */
  reconnect() {
    if (!isNaN(this.getReconnectTimeout())) {
      this.channel.reconnectNow();
    }
  }

  /** Send a message to the remote device. [was: WB -- sendMessage] */
  sendMessage(action, params) {
    logMdx('conn', params ? `Sending: action=${action}, params=${jsonSerialize(params)}` : `Sending: action=${action}`);
    this.channel.sendMessage(action, params);
    // Reset idle timeout
    safeClearTimeout(this.idleTimeout);
    this.idleTimeout = safeSetTimeout(() => this.disconnect(1), 864e5); // 24 hours
  }

  /**
   * Whether a capability is supported on all connected screen devices.
   * [was: XI -- isCapabilitySupportedOnConnectedDevices]
   */
  isCapabilitySupportedOnConnectedDevices(capability) {
    if (!this.connectedDevices || this.connectedDevices.length === 0) return false;
    return this.connectedDevices.every((d) => d.capabilities.has(capability));
  }

  /**
   * Get XSRF token for lounge requests.
   * [was: Ka -- getXsrfToken]
   */
  getXsrfToken() {
    const sapisid = getCookie('SAPISID', '') || getCookie('__Secure-1PAPISID') || '';
    const sapisid3 = getCookie('__Secure-3PAPISID', '') || '';
    if (!sapisid && !sapisid3) return '';
    const hash1 = g.lj(stringToUtf8ByteArray(sapisid), 2);
    const hash3 = g.lj(stringToUtf8ByteArray(sapisid3), 2);
    return g.lj(stringToUtf8ByteArray(`,${hash1},${hash3}`), 2);
  }

  /** @private [was: onChannelOpened -- via laa] */
  onChannelOpened() {
    logMdx('conn', 'Channel opened');
    if (this.needsReconnect) {
      this.needsReconnect = false;
      clearTimeout(this.screenWaitTimeout);
      this.screenWaitTimeout = safeSetTimeout(() => {
        logMdx('conn', 'Timing out waiting for a screen.');
        this.disconnect(1);
      }, 15000);
    }
  }

  /** @private [was: onChannelClosed] */
  onChannelClosed() {
    logMdx('conn', 'Channel closed');
    clearSession();
    this.dispose();
  }

  /** @private [was: onChannelError] */
  onChannelError(event) {
    clearSession();
    const NetworkErrorCode = event.error !== undefined ? event.error : event;
    if (isNaN(this.getReconnectTimeout())) {
      if (NetworkErrorCode === 1 && this.screenIdType === 'shortLived') {
        this.publish('browserChannelAuthError', NetworkErrorCode);
      }
      this.dispose();
    } else {
      this.needsReconnect = true;
      this.publish('proxyStateChange', 2);
    }
  }

  /** @private -- dispatch lounge messages [was: cdD] */
  onChannelMessage(event) {
    const msg = event.message;
    // Route message to appropriate handler
    switch (msg.action) {
      case 'loungeStatus':
        this.onLoungeStatus(msg);
        break;
      case 'nowPlaying':
        this.onNowPlaying(msg);
        break;
      case 'onStateChange':
        this.onStateChange(msg);
        break;
      case 'onAdStateChange':
        this.onAdStateChange(msg);
        break;
      case 'onVolumeChanged':
        this.onVolumeChanged(msg);
        break;
      case 'onSubtitlesTrackChanged':
        this.onSubtitlesTrackChanged(msg);
        break;
      case 'playlistModified':
        this.onPlaylistModified(msg);
        break;
      case 'nowAutoplaying':
        this.onNowAutoplaying(msg);
        break;
      case 'autoplayDismissed':
        this.publish('autoplayDismissed');
        break;
      case 'autoplayUpNext':
        this.onAutoplayUpNext(msg);
        break;
      case 'onAutoplayModeChanged':
        this.onAutoplayModeChanged(msg);
        break;
      case 'onHasPreviousNextChanged':
        this.onHasPreviousNextChanged(msg);
        break;
      case 'onLoopModeChanged':
        this.publish('loopModeChange', msg.params.loopMode);
        break;
      case 'loungeScreenDisconnected':
      case 'remoteConnected':
      case 'remoteDisconnected':
      case 'gracefulDisconnect':
        // Device list management -- handled inline
        break;
      default:
        logMdx('conn', 'Unrecognized action: ' + msg.action);
    }
  }

  // Message handlers are abbreviated -- see source lines 2567-2796
  // for the full onLoungeStatus/onNowPlaying/onStateChange/etc. logic.

  /** @private */
  dispose() {
    if (!this.u0()) {
      setGlobal('yt.mdx.remote.remoteClient_', null);
      this.publish('beforeDispose');
      this.publish('proxyStateChange', 3);
    }
    super.dispose();
  }

  disposeApp() {
    clearTimeout(this.connectingTimeout);
    clearTimeout(this.getNowPlayingTimer);
    clearTimeout(this.screenWaitTimeout);
    safeClearTimeout(this.videoChangeTimer);
    safeClearTimeout(this.idleTimeout);
    this.pendingVideoId = null;
    unlisten(this.eventListeners);
    this.eventListeners.length = 0;
    this.channel.dispose();
    super.disposeApp();
    this.autoplayMode = null;
    this.autoplayVideoId = null;
    this.connectedDevices = null;
    this.playerState = null;
    this.channel = null;
  }
}

// Expose public API methods
RemoteConnection.prototype.subscribe = RemoteConnection.prototype.subscribe;
RemoteConnection.prototype.unsubscribeByKey = RemoteConnection.prototype.bU;
RemoteConnection.prototype.getProxyState = RemoteConnection.prototype.getProxyState;
RemoteConnection.prototype.disconnect = RemoteConnection.prototype.disconnect;
RemoteConnection.prototype.getPlayerContextData = RemoteConnection.prototype.getPlayerContextData;
RemoteConnection.prototype.setPlayerContextData = RemoteConnection.prototype.setPlayerContextData;
RemoteConnection.prototype.getOtherConnectedRemoteId = RemoteConnection.prototype.getOtherConnectedRemoteId;
RemoteConnection.prototype.getReconnectTimeout = RemoteConnection.prototype.getReconnectTimeout;
RemoteConnection.prototype.getAutoplayMode = RemoteConnection.prototype.getAutoplayMode;
RemoteConnection.prototype.getAutoplayVideoId = RemoteConnection.prototype.getAutoplayVideoId;
RemoteConnection.prototype.reconnect = RemoteConnection.prototype.reconnect;
RemoteConnection.prototype.sendMessage = RemoteConnection.prototype.sendMessage;
RemoteConnection.prototype.getXsrfToken = RemoteConnection.prototype.getXsrfToken;
RemoteConnection.prototype.isCapabilitySupportedOnConnectedDevices = RemoteConnection.prototype.isCapabilitySupportedOnConnectedDevices;

// ---------------------------------------------------------------------------
// QueueManager [was: Lvo] (lines 6276-6517)
// ---------------------------------------------------------------------------

/**
 * Bridges the remote player proxy and the local player UI.
 * Forwards control commands, syncs subtitle/volume/progress state.
 * [was: Lvo]
 */
export class QueueManager extends Disposable { // was: Lvo extends g.qK
  /**
   * @param {Object} module -- RemoteModule instance [was: Q]
   * @param {Object} playerApi -- local player API [was: c]
   * @param {RemotePlayerProxy} proxy [was: W]
   */
  constructor(module, playerApi, proxy) {
    super();
    /** @type {Object} [was: this.W] -- remote module ref */
    this.module = module;
    /** @type {Object} [was: this.U] -- local player API */
    this.playerApi = playerApi;
    /** @type {RemotePlayerProxy} [was: this.fX] */
    this.proxy = proxy;
    /** @type {EventHandler} [was: this.events] */
    this.events = new EventHandler(this);
    /** @type {boolean} [was: this.D] -- waiting for caption track list */
    this.waitingForCaptionsList = false;
    /** @type {PlayerState} [was: this.L] */
    this.lastPlayerState = new PlayerState(64);
    /** @type {Timer} [was: this.O] -- progress update timer */
    this.progressTimer = new Timer(this.updateProgress, 500, this); // was: g.Uc
    /** @type {Timer} [was: this.A] -- reconnect state timer */
    this.reconnectTimer = new Timer(this.checkReconnect, 1000, this); // was: g.Uc
    /** @type {Throttle} [was: this.mF] -- caption change throttle */
    this.captionThrottle = new Throttle(this.onCaptionChange, 0, this); // was: wp
    /** @type {Object} [was: this.j] -- last known track data */
    this.lastTrackData = {};
    /** @type {Timer} [was: this.S] -- volume sync timer */
    this.volumeSyncTimer = new Timer(this.syncVolume, 1000, this); // was: g.Uc
    /** @type {DelayedCall} [was: this.Y] -- seek debounce */
    this.seekDebounce = new DelayedCall(this.doSeek, 1000, this); // was: g.F_

    // Volume change listener
    this.volumeListenerKey = this.events.B(this.playerApi, 'onVolumeChange', (vol) => {
      this.onLocalVolumeChange(vol);
    });

    ownDisposable(this, this.events);
    this.events.B(playerApi, 'onCaptionsTrackListChanged', this.onCaptionTrackListChanged);
    this.events.B(playerApi, 'captionschanged', this.onCaptionsChanged);
    this.events.B(playerApi, 'captionssettingschanged', this.onCaptionSettingsChanged);
    this.events.B(playerApi, 'videoplayerreset', this.onVideoReset);
    this.events.B(playerApi, 'mdxautoplaycancel', () => this.proxy.dismissAutoplay());

    // Subscribe to remote proxy events
    proxy.subscribe('proxyStateChange', this.onProxyStateChange, this);
    proxy.subscribe('remotePlayerChange', this.onRemotePlayerChange, this);
    proxy.subscribe('remoteQueueChange', this.onVideoReset, this);
    proxy.subscribe('previousNextChange', this.onPreviousNextChange, this);
    proxy.subscribe('nowAutoplaying', this.onNowAutoplaying, this);
    proxy.subscribe('autoplayDismissed', this.onAutoplayDismissed, this);

    ownDisposable(this, this.progressTimer);
    ownDisposable(this, this.reconnectTimer);
    ownDisposable(this, this.captionThrottle);
    ownDisposable(this, this.volumeSyncTimer);
    ownDisposable(this, this.seekDebounce);

    // Initial sync
    this.onCaptionSettingsChanged();
    this.onVideoReset();
    this.onRemotePlayerChange();
  }

  disposeApp() {
    super.disposeApp();
    this.progressTimer.stop();
    this.reconnectTimer.stop();
    this.captionThrottle.stop();

    this.proxy.unsubscribe('proxyStateChange', this.onProxyStateChange, this);
    this.proxy.unsubscribe('remotePlayerChange', this.onRemotePlayerChange, this);
    this.proxy.unsubscribe('remoteQueueChange', this.onVideoReset, this);
    this.proxy.unsubscribe('previousNextChange', this.onPreviousNextChange, this);
    this.proxy.unsubscribe('nowAutoplaying', this.onNowAutoplaying, this);
    this.proxy.unsubscribe('autoplayDismissed', this.onAutoplayDismissed, this);
    this.proxy = null;
    this.module = null;
  }

  /**
   * Handle a control command from the player UI.
   * [was: jZ]
   */
  handleCommand(command, ...args) { // was: jZ
    if (this.proxy.proxyState === 2) return; // reconnecting

    const isVideoMatch = this.isVideoMatched();
    const state = getState(this.proxy);

    if (isVideoMatch) {
      if (state.playerState === 1081 && command === 'control_seek') return; // no seek during ads

      switch (command) {
        case 'control_toggle_play_pause':
          state.isPlaying() ? this.proxy.pause() : this.proxy.play();
          break;
        case 'control_play':
          this.proxy.play();
          break;
        case 'control_pause':
          this.proxy.pause();
          break;
        case 'control_seek':
          this.seekDebounce.j(args[0], args[1]);
          break;
        case 'control_subtitles_set_track':
          this.setSubtitleTrack(args[0]);
          break;
        case 'control_set_audio_track':
          this.setAudioTrack(args[0]);
          break;
      }
    } else {
      // Video not matching -- need to start playback on remote
      switch (command) {
        case 'control_toggle_play_pause':
        case 'control_play':
        case 'control_pause': {
          const time = this.playerApi.getCurrentTime();
          this.playOnRemote(time === 0 ? undefined : time);
          break;
        }
        case 'control_seek':
          this.playOnRemote(args[0]);
          break;
        case 'control_subtitles_set_track':
          this.setSubtitleTrack(args[0]);
          break;
        case 'control_set_audio_track':
          this.setAudioTrack(args[0]);
          break;
      }
    }
  }

  /** Whether the remote video matches the local video. [was: qv] */
  isVideoMatched() { // was: qv (free function)
    return getState(this.proxy).videoId === this.getLocalVideoData().videoId;
  }

  /** Get local video data. [was: nn] */
  getLocalVideoData() { // was: nn (free function)
    return this.playerApi.getVideoData({ playerType: 1 });
  }

  /** Play the current local video on the remote device. [was: D3] */
  playOnRemote(startTime) { // was: D3
    const playlist = this.playerApi.getPlaylist();
    let index, listId;
    if (playlist?.listId) {
      index = playlist.index;
      listId = playlist.listId.toString();
    }
    const videoData = this.getLocalVideoData();
    this.proxy.playVideo(
      videoData.videoId, startTime, index, listId,
      videoData.playerParams, videoData.S, getLocationOverride(videoData)
    );
    this.updatePresentingState(new PlayerState(1)); // playing
  }

  /** @private [was: doSeek / seekTo callback] */
  doSeek(time, commit) {
    const state = getState(this.proxy);
    if (state.playerState === -1) {
      this.playOnRemote(time);
    } else if (commit) {
      this.proxy.seekTo(time);
    }
  }

  /** @private */
  setSubtitleTrack(track) { // was: t$
    if (!this.isVideoMatched() || this.waitingForCaptionsList) return;
    let fullTrack = null;
    if (track) {
      fullTrack = { style: this.playerApi.getSubtitlesUserSettings() };
      Object.assign(fullTrack, track);
    }
    this.proxy.setSubtitleTrack(this.getLocalVideoData().videoId, fullTrack);
    this.lastTrackData = getState(this.proxy).trackData;
  }

  /** @private */
  setAudioTrack(track) {
    if (this.isVideoMatched()) {
      this.proxy.setAudioTrack(this.getLocalVideoData().videoId, track);
    }
  }

  // -----------------------------------------------------------------------
  // Event handlers (abbreviated -- see source for full detail)
  // -----------------------------------------------------------------------

  /** @private [was: K] */
  onRemotePlayerChange() {
    if (!this.isVideoMatched()) {
      this.resetToIdle(); // was: nFa
      return;
    }
    this.progressTimer.stop();
    const state = getState(this.proxy);

    // Map remote player state to presenting player state
    switch (state.playerState) {
      case 1081: case 1:
        this.updatePresentingState(new PlayerState(8)); // playing
        this.updateProgress();
        break;
      case 1085: case 3:
        this.updatePresentingState(new PlayerState(9)); // buffering
        break;
      case 1083: case 0:
        this.updatePresentingState(new PlayerState(2)); // ended
        break;
      case 1084: case 2:
        this.updatePresentingState(new PlayerState(4)); // paused
        break;
      case -1:
        this.updatePresentingState(new PlayerState(64)); // idle
        break;
      case -1000:
        this.updatePresentingState(new PlayerState(128, {
          NetworkErrorCode: 'mdx.remoteerror',
          errorMessage: 'This video is not available for remote playback.',
          Ia: 2,
        }));
        break;
    }

    // Sync volume from remote
    if (state.volume !== -1) {
      if (Math.round(this.playerApi.getVolume()) !== state.volume || this.playerApi.isMuted() !== state.muted) {
        if (!this.volumeSyncTimer.isActive()) this.syncVolume();
      }
    }
  }

  /** @private [was: MM] */
  onProxyStateChange(oldState, newState) {
    this.reconnectTimer.stop();
    if (newState === 2) this.checkReconnect();
  }

  /** @private [was: Ie] */
  onPreviousNextChange() {
    this.playerApi.publish('mdxpreviousnextchange');
  }

  /** @private [was: J] */
  onVideoReset() {
    if (!this.isVideoMatched()) this.resetToIdle();
  }

  /** @private [was: T2] */
  onNowAutoplaying(timeout) {
    if (!isNaN(timeout)) this.playerApi.publish('mdxnowautoplaying', timeout);
  }

  /** @private [was: b0] */
  onAutoplayDismissed() {
    this.playerApi.publish('mdxautoplaycanceled');
  }

  /** @private */
  resetToIdle() { // was: nFa
    this.module.kx(0);
    this.progressTimer.stop();
    this.updatePresentingState(new PlayerState(64));
  }

  /** @private [was: Ka] */
  updateProgress() {
    this.progressTimer.stop();
    if (this.proxy?.u0()) return;
    const state = getState(this.proxy);
    if (state.isPlaying()) this.updatePresentingState(new PlayerState(8));
    this.module.kx(getEstimatedTime(state));
    this.progressTimer.start();
  }

  /** @private [was: UH] */
  syncVolume() {
    if (!this.isVideoMatched()) return;
    const state = getState(this.proxy);
    this.events.Xd(this.volumeListenerKey);
    state.muted ? this.playerApi.mute() : this.playerApi.unMute();
    this.playerApi.setVolume(state.volume);
    this.volumeListenerKey = this.events.B(this.playerApi, 'onVolumeChange', (vol) => {
      this.onLocalVolumeChange(vol);
    });
  }

  /** @private [was: x14 free function] */
  onLocalVolumeChange(volumeData) {
    if (!this.isVideoMatched()) return;
    this.proxy.unsubscribe('remotePlayerChange', this.onRemotePlayerChange, this);
    const vol = Math.round(volumeData.volume);
    const muted = !!volumeData.muted;
    const state = getState(this.proxy);
    if (vol !== state.volume || muted !== state.muted) {
      this.proxy.setVolume(vol, muted);
      this.volumeSyncTimer.start();
    }
    this.proxy.subscribe('remotePlayerChange', this.onRemotePlayerChange, this);
  }

  /** @private [was: OO] */
  updatePresentingState(newState) {
    this.reconnectTimer.stop();
    const oldState = this.lastPlayerState;
    if (!statesMatch(oldState, newState)) {  -> playerStatesEqual(stateA, stateB)
      const stateValue = newState.W(2);
      if (stateValue !== this.lastPlayerState.W(2)) {
        this.playerApi.plusDecode(stateValue);
      }
      this.lastPlayerState = newState;
      // Notify module
      this.module.presentingState = newState;
      this.module.player.publish('presentingplayerstatechange', new PlayerStateChange(newState, oldState));  -> PlayerStateChange constructor
    }
  }

  /** @private */
  checkReconnect() { // was: jG
    this.reconnectTimer.stop();
    this.progressTimer.stop();
    const timeout = this.proxy.startIconMorphAnimation();
    if (this.proxy.proxyState === 2 && !isNaN(timeout)) {
      this.reconnectTimer.start();
    }
  }

  /** @private [was: JJ] */
  onCaptionTrackListChanged() {
    if (!isEmptyObject(this.lastTrackData)) {
      // Re-apply subtitle track if list reloaded
      this.playerApi.setOption('captions', 'track', this.lastTrackData);
    }
    this.waitingForCaptionsList = false;
  }

  /** @private [was: HA] */
  onCaptionsChanged(track) {
    this.captionThrottle.LG(track);
  }

  /** @private [was: La -- caption throttle callback] */
  onCaptionChange(track) {
    this.handleCommand('control_subtitles_set_track', isEmptyObject(track) ? null : track);
  }

  /** @private [was: PA] */
  onCaptionSettingsChanged() {
    const track = this.playerApi.getOption('captions', 'track');
    if (!isEmptyObject(track)) this.setSubtitleTrack(track);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getSavedBrowserChannel() {
  return getData('yt-remote-session-browser-channel');
}

function getChannelParams() { // was: Kn
  return getObjectByPath('yt.mdx.remote.channelParams_') || {};  -> getGlobalByPath(path)
}

function clearSession() { // was: Sx
  removeData('yt-remote-session-screen-id');
  removeData('yt-remote-session-video-id');
  // Update connected devices
}

/** @type {LoungeApiClient} imported from mdx-client */
let loungeApiClient = null; // Set during init
