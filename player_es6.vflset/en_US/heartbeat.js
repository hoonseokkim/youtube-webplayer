(function(g) {
    var window = this;
    'use strict';
    var S2 = function(Q, c) {
        if (!Number.isFinite(Q))
            return String(Q);
        Q = String(Q);
        let W = Q.indexOf(".");
        W === -1 && (W = Q.length);
        const m = Q[0] === "-" ? "-" : "";
        m && (Q = Q.substring(1));
        c = "0".repeat(Math.max(0, c - W));
        return m + c + Q
    }
      , ZH = function(Q) {
        typeof Q === "number" ? (this.date = rQ4(Q, 0, 1),
        FP(this, 1)) : g.Sd(Q) ? (this.date = rQ4(Q.getFullYear(), Q.getMonth(), Q.getDate()),
        FP(this, Q.getDate())) : (this.date = new Date(g.d0()),
        Q = this.date.getDate(),
        this.date.setHours(0),
        this.date.setMinutes(0),
        this.date.setSeconds(0),
        this.date.setMilliseconds(0),
        FP(this, Q))
    }
      , rQ4 = function(Q, c, W) {
        c = new Date(Q,c,W);
        Q >= 0 && Q < 100 && c.setFullYear(c.getFullYear() - 1900);
        return c
    }
      , FP = function(Q, c) {
        Q.getDate() != c && Q.date.setUTCHours(Q.date.getUTCHours() + (Q.getDate() < c ? 1 : -1))
    }
      , E0 = function(Q) {
        if (Q.toggleButtonRenderer) {
            var c = Q.toggleButtonRenderer;
            if (c.isToggled) {
                var W = c.toggledText ? g.rK(c.toggledText) : "";
                Q.update({
                    text: W,
                    icon: UqH(c.toggledIcon)
                })
            } else
                W = c.defaultText ? g.rK(c.defaultText) : "",
                Q.update({
                    text: W,
                    icon: UqH(c.defaultIcon)
                });
            Q.show()
        } else
            Q.hide()
    }
      , IdW = function(Q, c) {
        !Q.toggleButtonRenderer && c && c.toggleButtonRenderer ? Q.toggleButtonRenderer = c.toggleButtonRenderer : c && c.toggleButtonRenderer || (Q.toggleButtonRenderer = null);
        E0(Q)
    }
      , UqH = function(Q) {
        if (!Q)
            return null;
        switch (Q.iconType) {
        case "NOTIFICATIONS":
            return {
                C: "svg",
                N: {
                    fill: "#fff",
                    height: "24px",
                    viewBox: "0 0 24 24",
                    width: "24px"
                },
                V: [{
                    C: "path",
                    N: {
                        d: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                    }
                }]
            };
        case "NOTIFICATIONS_NONE":
            return {
                C: "svg",
                N: {
                    fill: "#fff",
                    height: "24px",
                    viewBox: "0 0 24 24",
                    width: "24px"
                },
                V: [{
                    C: "path",
                    N: {
                        d: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
                    }
                }]
            };
        case "NOTIFICATIONS_ACTIVE":
            return g.c_3();
        default:
            return null
        }
    }
      , Vjm = function(Q, c) {
        const W = g.l(c, Xka)
          , m = g.l(c, AQH);
        if (c && (W || m)) {
            if (W) {
                var K = W;
                var T = "notification/add_upcoming_event_reminder"
            } else
                m && (K = m,
                T = "notification/remove_upcoming_event_reminder");
            T && K && K.params && eKo(Q, T, K.params)
        }
    }
      , eKo = function(Q, c, W) {
        Q.W || (Q.W = new g.AZ(Q.U.G().UR));
        const m = {
            context: g.iV(Q.W.config_ || g.Ne())
        };
        g.Df() && (m.context.clientScreenNonce = g.Df());
        m.params = W;
        g.JD(Q.W, c, m, {
            timeout: 5E3,
            onError: () => {
                BGo(Q)
            }
            ,
            onTimeout: () => {
                BGo(Q)
            }
        })
    }
      , BGo = function(Q) {
        Q.toggleButtonRenderer && (Q.toggleButtonRenderer.isToggled = !Q.toggleButtonRenderer.isToggled,
        E0(Q))
    }
      , s0 = function(Q, c, W) {
        if (c) {
            var m = c.subtitleText != null ? g.rK(c.subtitleText) : "";
            W = W ? W : c.mainText != null ? g.rK(c.mainText) : "";
            Q.update({
                mainText: W,
                subtitleText: m,
                label: c.mainText?.accessibility?.accessibilityData?.label ?? W
            });
            g.L(Q.element, "ytp-offline-slate-single-text-line", !m);
            g.L(Q.A, "ytp-offline-slate-bar-hidden", !W && !m)
        }
    }
      , xqH = function(Q) {
        try {
            const c = JSON.parse(Q);
            return c != null ? c : void 0
        } catch (c) {}
    }
      , H0H = async function(Q) {
        const c = Q.player.G()
          , W = Q.getVideoData();
        dI(Q) && (qSv(Q) ? nlS(Q, c, W) : (Dq0(Q),
        await tj4(Q, c, W)))
    }
      , Dq0 = function(Q) {
        var c = Q.getVideoData();
        if (c.DL)
            if (c.X("use_rta_for_player"))
                Q.attestationResponse = NGv(Q);
            else {
                const T = new g.P$W(c);
                if (g.Tg.isInitialized() || Q.sequenceNumber >= 3) {
                    c = Promise;
                    var W = c.resolve;
                    let r = null;
                    if (T.videoData.Ds) {
                        var m = g.uxW(T);
                        if (m) {
                            r = {};
                            const U = {};
                            m = m.split("&");
                            for (K of m)
                                m = K.split("="),
                                m.length === 2 && (U[m[0]] = m[1]);
                            var K = U;
                            K.r1a && (r.webResponse = K.r1a);
                            K.r1c && (r.error = i0a[Number(K.r1c)]);
                            r.challenge = T.videoData.Ds
                        }
                    }
                    Q.attestationResponse = W.call(c, r || void 0)
                }
            }
    }
      , FE9 = function(Q) {
        var c = Q.getVideoData();
        const W = Q.player.G();
        if (c.isLivePlayback)
            if (g.KD(W.K)) {
                Q.j = !0;
                Q.J = !0;
                if (!g.AI(W) || g.Ie(W))
                    Q.offlineSlate = new yQS(Q.player),
                    g.F(Q, Q.offlineSlate),
                    g.f8(Q.player, Q.offlineSlate.element, 4);
                (c = c.getPlayerResponse()) && c.playabilityStatus && (Q.W = c.playabilityStatus);
                Q.W?.status !== "UNPLAYABLE" && (Q.W ? (c = SSi(void 0, Q.W.liveStreamability && Q.W.liveStreamability.liveStreamabilityRenderer)) ? LB(Q, c) : LB(Q, 7500) : LB(Q, wI(Q, !0)))
            } else
                Q.player.o$("html5.unsupportedlive", 2, "HTML5_NO_AVAILABLE_FORMATS_FALLBACK", "nolive.1");
        else
            g.c9(c.RR, "heartbeat") && Q.player.qP("heartbeat", Q.getPlayerType())
    }
      , s$W = function(Q, c, W) {
        var m = W.liveStreamability && W.liveStreamability.liveStreamabilityRenderer
          , K = !(!m || !(m.switchStreamsImmediately || m.transitionTiming && m.transitionTiming === "STREAM_TRANSITION_TIMING_IMMEDIATELY"));
        c = SSi(c, m);
        var T = Q.getVideoData();
        const r = Q.player.getPlayerStateObject(Q.getPlayerType())
          , U = r.isPlaying() && !g.pl(T) && !Q.player.isAtLiveHead(Q.getPlayerType());
        if (T.G().cB()) {
            var I = Q.player.Yx()?.wA() || {};
            I.status = W.status || "";
            I.dvr = `${+U}`;
            I["switch"] = `${+K}`;
            I.ended = `${+!(!m || !m.displayEndscreen)}`;
            Q.player.tJ("heartbeat", I)
        }
        I = m && m.broadcastId;
        const X = Q.W && Q.W.liveStreamability && Q.W.liveStreamability.liveStreamabilityRenderer && Q.W.liveStreamability.liveStreamabilityRenderer.broadcastId
          , A = I !== X && I != null;
        A && Q.player.tJ("lbidh", {
            broadcastId: I
        }, !0);
        if (g.AI(T.G()) && m && m.streamTransitionEndpoint) {
            var e = g.l(m.streamTransitionEndpoint, g.GW)?.commands || [];
            for (var V of e)
                if (g.l(V, g.CD)?.signal === "RELOAD_PLAYER") {
                    Q.player.o$("qoe.restart", 0, void 0, "sa.reload", "7");
                    break
                }
        }
        V = Q.player.X("always_cache_redirect_endpoint");
        if (U && !K && !V)
            return c;
        e = m && m.streamTransitionEndpoint && g.l(m.streamTransitionEndpoint, g.nl);
        if ((m && m.transitionTiming) === "STREAM_TRANSITION_TIMING_AT_STREAM_END")
            Q.getVideoData().transitionEndpointAtEndOfStream = e;
        else {
            if (e && Z0v(Q, e, W))
                return c;
            V && !e && Q.getVideoData().transitionEndpointAtEndOfStream && (Q.getVideoData().transitionEndpointAtEndOfStream = void 0)
        }
        if (U && !K && V)
            return c;
        if (W.status.toUpperCase() === "OK") {
            if (!g.B4(T) || A)
                return m = {
                    video_id: T.videoId
                },
                T.t8 && (m.is_live_destination = "1"),
                m.disable_watch_next = !0,
                m.raw_watch_next_response = T.getWatchNextResponse(),
                m.autonav_state = T.autonavState,
                m.oauth_token = T.oauthToken,
                m.xH = T.xH,
                T.UG && (m.vss_credentials_token = T.UG,
                m.vss_credentials_token_type = T.s8),
                T.b0 && (m.vvt = T.b0),
                K = void 0,
                g.B4(T) ? A && (K = new ElH("broadcastIdChanged",`${X},${I}`),
                Q.JG("HEARTBEAT_ACTION_TRIGGER_IMMEDIATE", "HEARTBEAT_ACTION_TRANSITION_REASON_BROADCAST_ID_CHANGED", W)) : (I && (K = new ElH("formatsReceived",`${I}`)),
                Q.JG("HEARTBEAT_ACTION_TRIGGER_IMMEDIATE", "HEARTBEAT_ACTION_TRANSITION_REASON_LIVE_STREAM_WENT_ONLINE", W)),
                A && Q.player.tJ("lbidr", {
                    broadcastId: I
                }),
                Q.player.loadVideoByPlayerVars(m, void 0, void 0, void 0, K),
                c;
            Q.player.qP("heartbeat", Q.getPlayerType())
        }
        m && m.displayEndscreen && (Q.offlineSlate ? (Q = Q.offlineSlate,
        Q.D = !0,
        Q.OC && Q.api.Ni()) : r.isBuffering() && (T = Q.player.Yx()?.wA() || {},
        Q.player.tJ("hbse", T, !0),
        Q.player.Ni(!0, "h"),
        g.xt(Q.player, "onLiveMediaEnded", W)));
        return c
    }
      , wI = function(Q, c=!1) {
        Q = Q.getVideoData();
        return Q.X("html5_use_server_init_heartbeat_delay") ? isNaN(Q.tG) ? 15E3 : Q.tG : c ? 1E3 : 2E3
    }
      , dqm = function(Q) {
        var c = Q.getVideoData();
        !c.X("use_rta_for_player") && c.DL && (c = c.botguardData) && g.Il(c, Q.player.G())
    }
      , bT = function(Q) {
        Q.L = 0;
        Q.O.stop();
        Q.K = !1;
        Q.sequenceNumber = 0
    }
      , NGv = async function(Q) {
        if (await g.lE7())
            return Q = Q.getVideoData(),
            g.PSx({
                cpn: Q.clientPlaybackNonce,
                encryptedVideoId: Q.videoId || ""
            }, 1500);
        if (Q.sequenceNumber >= 3)
            return {
                error: "ATTESTATION_ERROR_VM_INTERNAL_ERROR"
            }
    }
      , LB = function(Q, c) {
        if (!Q.O.isActive() && Q.J) {
            var W = Q.getVideoData();
            if (j2(Q) || W.isLivePlayback)
                c === void 0 && (c = Q.K ? Q.j ? 7500 : Q.heartbeatParams?.interval ? Q.heartbeatParams.interval * 1E3 : Q.getVideoData().tG || 6E4 : 1E3),
                Q.O.start(c)
        }
    }
      , qSv = function(Q) {
        var c = Q.getVideoData();
        if (!g.Jh(Q.getVideoData()) || c.uQ)
            return !1;
        if (c.K) {
            Q = c.K.flavor === "playready";
            const W = c.K.flavor === "widevine" && c.X("html5_innertube_heartbeats_for_widevine");
            c = g.RM(c.K) && c.X("html5_innertube_heartbeats_for_fairplay");
            return !(Q || W || c)
        }
        return !0
    }
      , j2 = function(Q) {
        if (qSv(Q))
            return !!Q.heartbeatParams;
        const c = Q.getVideoData();
        return !g.Jh(Q.getVideoData()) || c.SX || c.AD ? !!c.heartbeatToken : !1
    }
      , b0D = function(Q, c, W) {
        c.EJ && (W = g.sJ(W, {
            internalipoverride: c.EJ
        }));
        const m = {
            cpn: c.clientPlaybackNonce
        };
        c.contextParams && (m.context_params = c.contextParams);
        c.Y0 && (m.kpt = c.Y0);
        W = g.sJ(W, m);
        g.Wn(W, {
            format: "RAW",
            method: "GET",
            timeout: 3E4,
            onSuccess: K => {
                if (!Q.O.isActive() && dI(Q)) {
                    Q.D.reset();
                    Q.sequenceNumber++;
                    K = K.responseText;
                    var T = xqH(K);
                    if (T) {
                        g.xt(Q.player, "onHeartbeat", T);
                        var r = T.status === "ok" ? T.stop_heartbeat ? 2 : 0 : T.status === "stop" ? 1 : T.status === "live_stream_offline" ? 0 : -1
                    } else
                        r = (r = K.match(LEZ)) ? r[1] === "0" ? 0 : 1 : -1;
                    wkm(Q, void 0, T, K, r)
                }
            }
            ,
            onError: K => {
                dI(Q) && gI(Q, !0, `net-${K.status}`)
            }
            ,
            onTimeout: () => {
                dI(Q) && gI(Q, !0, "timeout")
            }
            ,
            withCredentials: !0
        })
    }
      , dI = function(Q) {
        const c = Q.getVideoData();
        return Q.player.getPresentingPlayerType() === 3 || !Q.player.G().experiments.Ty().W.BA(g.y27) && Q.player.getPlayerStateObject(Q.getPlayerType()).W(4) ? !1 : j2(Q) || c.isLivePlayback ? !0 : (bT(Q),
        !1)
    }
      , nlS = function(Q, c, W) {
        if (Q.heartbeatParams?.url) {
            var m = g.sJ(Q.heartbeatParams.url, {
                request_id: g.fd7()
            });
            W.b0 && (m = g.sJ(m, {
                vvt: W.b0
            }),
            W.mdxEnvironment && (m = g.sJ(m, {
                mdx_environment: W.mdxEnvironment
            })));
            g.OQ(c, W.oauthToken).then(K => {
                K && (m = g.sJ(m, {
                    access_token: K
                }));
                b0D(Q, W, m)
            }
            )
        }
    }
      , tj4 = async function(Q, c, W) {
        const m = {
            videoId: W.videoId,
            sequenceNumber: Q.sequenceNumber,
            heartbeatServerData: Q.T2 ?? W.heartbeatServerData
        };
        Q.Y = Q.attestationResponse;
        W.DL && (m.attestationResponse = await Q.Y);
        var K = g.kW(W)
          , T = K.client ?? {};
        T.utcOffsetMinutes = Q.utcOffsetMinutes;
        m.context = K;
        m.cpn = W.clientPlaybackNonce;
        if (K = typeof Intl !== "undefined" ? (new Intl.DateTimeFormat).resolvedOptions().timeZone : null)
            T.timeZone = K;
        T = {
            heartbeatChecks: []
        };
        if (K = W.getPlayerResponse())
            W.heartbeatToken && (m.heartbeatToken = W.heartbeatToken),
            (K = K.playabilityStatus) && (K = K.liveStreamability) && K.liveStreamabilityRenderer && T.heartbeatChecks.push("HEARTBEAT_CHECK_TYPE_LIVE_STREAM_STATUS");
        W.heartbeatToken && T.heartbeatChecks.push("HEARTBEAT_CHECK_TYPE_YPC");
        if (g.Ie(c)) {
            T.heartbeatChecks.push("HEARTBEAT_CHECK_TYPE_UNPLUGGED");
            var r = j$D(Q);
            K = {};
            r !== null && (K.clientPlayerPositionUtcMillis = r);
            r = Q.player.CO()?.Vw()?.cg() || 0;
            r > 0 && (K.freePreviewWatchedDuration = {
                seconds: `${r}`
            });
            T.unpluggedParams = K
        }
        m.heartbeatRequestParams = T;
        W.isLivePlayback ? (T = j$D(Q),
        T !== null && (m.playbackState || (m.playbackState = {}),
        m.playbackState.playbackPosition = {
            utcTimeMillis: T
        })) : c.X("enable_heartbeat_vod_playback_position") && (T = gli(Q),
        T !== null && (m.playbackState || (m.playbackState = {}),
        m.playbackState.playbackPosition = {
            streamTimeMillis: T
        }));
        Q.player.publish("heartbeatRequest", m);
        const U = {
            timeout: 3E4,
            onSuccess: I => {
                if (!Q.O.isActive() && dI(Q)) {
                    var X = Q.getVideoData()
                      , A = X.DL && Q.Y == null;
                    X.DL = !!I.heartbeatAttestationConfig?.requiresAttestation || A;
                    A = I.playabilityStatus;
                    var e = JSON.stringify(A) || "{}";
                    I.authenticationMismatch && Q.player.tJ("authshear", {});
                    var V = -1;
                    var B = I.playabilityStatus;
                    B && (g.xt(Q.player, "onHeartbeat", B),
                    B.status === "OK" ? V = I.stopHeartbeat ? 2 : 0 : B.status === "UNPLAYABLE" ? V = 1 : B.status === "LIVE_STREAM_OFFLINE" && (V = 0));
                    Q.sequenceNumber && V === -1 || Q.D.reset();
                    Q.sequenceNumber++;
                    I.heartbeatServerData && (Q.T2 = I.heartbeatServerData);
                    X.xo = I;
                    (B = I.playerCueRangeSet) && g.DT(X, B);
                    I.playerCueRanges && I.playerCueRanges.length > 0 && (X.cueRanges = I.playerCueRanges);
                    I.progressBarConfig?.progressBarStartPosition && I.progressBarConfig?.progressBarEndPosition && (X.progressBarStartPosition = I.progressBarConfig.progressBarStartPosition,
                    X.progressBarEndPosition = I.progressBarConfig.progressBarEndPosition);
                    X.compositeLiveIngestionOffsetToken = I.compositeLiveIngestionOffsetToken;
                    I.compositeLiveStatusToken !== X.compositeLiveStatusToken && (X.compositeLiveStatusToken = I.compositeLiveStatusToken);
                    X.heartbeatLoggingToken = I.heartbeatLoggingToken;
                    X.publish("dataupdated");
                    wkm(Q, I, A, e, V)
                }
            }
            ,
            onError: I => {
                dI(Q) && gI(Q, !0, `net-${I.status}`)
            }
            ,
            onTimeout: () => {
                dI(Q) && gI(Q, !0, "timeout")
            }
        };
        g.OQ(c, W.D()).then(I => {
            I && (U.MX = `Bearer ${I}`);
            g.JD(Q.b0, "player/heartbeat", m, U)
        }
        )
    }
      , j$D = function(Q) {
        return (Q = Q.player.getProgressState(Q.getPlayerType()).ingestionTime) && isFinite(Q) ? `${Math.floor(Q * 1E3)}` : null
    }
      , gli = function(Q) {
        return (Q = Q.player.getCurrentTime({
            playerType: Q.getPlayerType()
        })) && isFinite(Q) ? `${Math.floor(Q * 1E3)}` : null
    }
      , wkm = function(Q, c, W, m, K) {
        K === -1 ? (W = `decode ${g.uj(m, 3)}`,
        gI(Q, !1, W)) : K === 2 ? (bT(Q),
        Q.K = !0) : (Q.L = 0,
        Q.O.stop(),
        K === 1 ? (Q.K = !1,
        W && W.errorCode === "PLAYABILITY_ERROR_CODE_EMBARGOED" && Q.player.F9(!0),
        K = `pe.${W?.errorCode};ps.${W?.status}`,
        Q.player.o$("heartbeat.stop", 2, Q.eB(m), K),
        g.eG("heartbeatActionPlayerHalted", O0H(W)),
        c?.videoTransitionEndpoint && W && (c = c.videoTransitionEndpoint,
        (m = g.l(c, g.nl)) && Z0v(Q, m, W, {
            itct: c?.clickTrackingParams
        }))) : (Q.K = !0,
        m = 0,
        Q.j && W && (m = s$W(Q, c, W),
        Q.player.publish("livestatedata", W)),
        m ? LB(Q, m) : LB(Q)))
    }
      , gI = function(Q, c, W) {
        if (!Q.O.isActive()) {
            Q.O.stop();
            Q.L++;
            var m = c ? "heartbeat.net" : "heartbeat.servererror";
            {
                const T = Q.getVideoData();
                if (T.Mv || c && !g.Jh(Q.getVideoData()) && !j2(Q) && T.isLivePlayback)
                    var K = !1;
                else
                    Q.heartbeatParams?.retries ? K = Q.heartbeatParams.retries : K = T.jD || 5,
                    K = Q.L >= K
            }
            K ? (g.eG("heartbeatActionPlayerHalted", c ? {
                enforcedPolicyToHaltOnNetworkFailure: !0
            } : O0H()),
            (c = Q.getVideoData()) && c.isLivePlayback ? Q.player.o$(m, 1, "Video playback interrupted. Please try again.", W) : Q.player.o$(m, 1, "Sorry, there was an error licensing this video.", W)) : (LB(Q, Q.D.getValue()),
            g.BO(Q.D))
        }
    }
      , O0H = function(Q) {
        const c = {
            enforcedPolicyToHaltOnNetworkFailure: !1
        };
        Q && (c.serializedServerContext = Q.additionalLoggingData);
        return c
    }
      , SSi = function(Q, c) {
        return (Q = Number(Q?.pollDelayMs)) ? Q : (c = Number(c?.pollDelayMs)) ? c : 0
    }
      , Z0v = function(Q, c, W, m) {
        const K = c && c.videoId;
        return K ? (Q.player.SF(K, {
            autonav: "1",
            ...(m || {})
        }, void 0, !0, !0, c, Q.getVideoData().D()),
        Q.JG("HEARTBEAT_ACTION_TRIGGER_IMMEDIATE", "HEARTBEAT_ACTION_TRANSITION_REASON_HAS_NEW_STREAM_TRANSITION_ENDPOINT", W),
        !0) : !1
    }
      , fda = {
        ERAS: ["BC", "AD"],
        ERANAMES: ["Before Christ", "Anno Domini"],
        NARROWMONTHS: "JFMAMJJASOND".split(""),
        STANDALONENARROWMONTHS: "JFMAMJJASOND".split(""),
        MONTHS: "January February March April May June July August September October November December".split(" "),
        STANDALONEMONTHS: "January February March April May June July August September October November December".split(" "),
        SHORTMONTHS: "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "),
        STANDALONESHORTMONTHS: "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "),
        WEEKDAYS: "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
        STANDALONEWEEKDAYS: "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
        SHORTWEEKDAYS: "Sun Mon Tue Wed Thu Fri Sat".split(" "),
        STANDALONESHORTWEEKDAYS: "Sun Mon Tue Wed Thu Fri Sat".split(" "),
        NARROWWEEKDAYS: "SMTWTFS".split(""),
        STANDALONENARROWWEEKDAYS: "SMTWTFS".split(""),
        SHORTQUARTERS: ["Q1", "Q2", "Q3", "Q4"],
        QUARTERS: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"],
        AMPMS: ["AM", "PM"],
        DATEFORMATS: ["EEEE, MMMM d, y", "MMMM d, y", "MMM d, y", "M/d/yy"],
        TIMEFORMATS: ["h:mm:ss\u202fa zzzz", "h:mm:ss\u202fa z", "h:mm:ss\u202fa", "h:mm\u202fa"],
        DATETIMEFORMATS: ["{1} 'at' {0}", "{1} 'at' {0}", "{1}, {0}", "{1}, {0}"],
        FIRSTDAYOFWEEK: 6,
        WEEKENDRANGE: [5, 6],
        FIRSTWEEKCUTOFFDAY: 5
    }
      , O0 = fda;
    O0 = fda;
    var i0a = ["ATTESTATION_ERROR_UNKNOWN", "ATTESTATION_ERROR_VM_NOT_INITIALIZED", "ATTESTATION_ERROR_VM_NO_RESPONSE", "ATTESTATION_ERROR_VM_TIMEOUT", "ATTESTATION_ERROR_VM_INTERNAL_ERROR"]
      , vlZ = {
        300: "STREAMING_DEVICES_QUOTA_PER_24H_EXCEEDED",
        301: "ALREADY_PINNED_ON_A_DEVICE",
        303: "STOPPED_BY_ANOTHER_PLAYBACK",
        304: "TOO_MANY_STREAMS_PER_USER",
        305: "TOO_MANY_STREAMS_PER_ENTITLEMENT",
        400: "VIDEO_NOT_FOUND",
        401: "GEO_FAILURE",
        402: "STREAMING_NOT_ALLOWED",
        403: "UNSUPPORTED_DEVICE",
        405: "VIDEO_FORBIDDEN",
        500: "PURCHASE_NOT_FOUND",
        501: "RENTAL_EXPIRED",
        502: "PURCHASE_REFUNDED",
        5E3: "BAD_REQUEST",
        5001: "CGI_PARAMS_MISSING",
        5002: "CGI_PARAMS_MALFORMED",
        5100: "AUTHENTICATION_MISSING",
        5101: "AUTHENTICATION_MALFORMED",
        5102: "AUTHENTICATION_EXPIRED",
        5200: "CAST_TOKEN_MALFORMED",
        5201: "CAST_TOKEN_EXPIRED",
        5202: "CAST_TOKEN_FAILED",
        5203: "CAST_SESSION_VIDEO_MISMATCHED",
        5204: "CAST_SESSION_DEVICE_MISMATCHED",
        6E3: "INVALID_DRM_MESSAGE",
        7E3: "SERVER_ERROR",
        8E3: "RETRYABLE_ERROR"
    };
    g.y = ZH.prototype;
    g.y.y8 = O0.FIRSTDAYOFWEEK;
    g.y.PH = O0.FIRSTWEEKCUTOFFDAY;
    g.y.clone = function() {
        const Q = new ZH(this.date);
        Q.y8 = this.y8;
        Q.PH = this.PH;
        return Q
    }
    ;
    g.y.getFullYear = function() {
        return this.date.getFullYear()
    }
    ;
    g.y.getYear = function() {
        return this.getFullYear()
    }
    ;
    g.y.getMonth = function() {
        return this.date.getMonth()
    }
    ;
    g.y.getDate = function() {
        return this.date.getDate()
    }
    ;
    g.y.getTime = function() {
        return this.date.getTime()
    }
    ;
    g.y.getDay = function() {
        return this.date.getDay()
    }
    ;
    g.y.getUTCFullYear = function() {
        return this.date.getUTCFullYear()
    }
    ;
    g.y.getUTCMonth = function() {
        return this.date.getUTCMonth()
    }
    ;
    g.y.getUTCDate = function() {
        return this.date.getUTCDate()
    }
    ;
    g.y.getUTCDay = function() {
        return this.date.getDay()
    }
    ;
    g.y.getUTCHours = function() {
        return this.date.getUTCHours()
    }
    ;
    g.y.getUTCMinutes = function() {
        return this.date.getUTCMinutes()
    }
    ;
    g.y.getTimezoneOffset = function() {
        return this.date.getTimezoneOffset()
    }
    ;
    g.y.set = function(Q) {
        this.date = new Date(Q.getFullYear(),Q.getMonth(),Q.getDate())
    }
    ;
    g.y.setFullYear = function(Q) {
        this.date.setFullYear(Q)
    }
    ;
    g.y.setYear = function(Q) {
        this.setFullYear(Q)
    }
    ;
    g.y.setMonth = function(Q) {
        this.date.setMonth(Q)
    }
    ;
    g.y.setDate = function(Q) {
        this.date.setDate(Q)
    }
    ;
    g.y.setTime = function(Q) {
        this.date.setTime(Q)
    }
    ;
    g.y.setUTCFullYear = function(Q) {
        this.date.setUTCFullYear(Q)
    }
    ;
    g.y.setUTCMonth = function(Q) {
        this.date.setUTCMonth(Q)
    }
    ;
    g.y.setUTCDate = function(Q) {
        this.date.setUTCDate(Q)
    }
    ;
    g.y.add = function(Q) {
        if (Q.years || Q.months) {
            var c = this.getMonth() + Q.months + Q.years * 12
              , W = this.getYear() + Math.floor(c / 12);
            c %= 12;
            c < 0 && (c += 12);
            a: {
                switch (c) {
                case 1:
                    var m = W % 4 != 0 || W % 100 == 0 && W % 400 != 0 ? 28 : 29;
                    break a;
                case 5:
                case 8:
                case 10:
                case 3:
                    m = 30;
                    break a
                }
                m = 31
            }
            m = Math.min(m, this.getDate());
            this.setDate(1);
            this.setFullYear(W);
            this.setMonth(c);
            this.setDate(m)
        }
        Q.days && (W = this.getYear(),
        c = W >= 0 && W <= 99 ? -1900 : 0,
        Q = new Date((new Date(W,this.getMonth(),this.getDate(),12)).getTime() + Q.days * 864E5),
        this.setDate(1),
        this.setFullYear(Q.getFullYear() + c),
        this.setMonth(Q.getMonth()),
        this.setDate(Q.getDate()),
        FP(this, Q.getDate()))
    }
    ;
    g.y.equals = function(Q) {
        return !(!Q || this.getYear() != Q.getYear() || this.getMonth() != Q.getMonth() || this.getDate() != Q.getDate())
    }
    ;
    g.y.toString = function() {
        var Q = this.getFullYear();
        const c = Q < 0 ? "-" : Q >= 1E4 ? "+" : "";
        return [c + S2(Math.abs(Q), c ? 6 : 4), S2(this.getMonth() + 1, 2), S2(this.getDate(), 2)].join("") + ""
    }
    ;
    g.y.valueOf = function() {
        return this.date.valueOf()
    }
    ;
    var Xka = new g.Y("addUpcomingEventReminderEndpoint");
    var AQH = new g.Y("removeUpcomingEventReminderEndpoint");
    var adS = class extends g.k {
        constructor(Q) {
            super({
                C: "div",
                V: [{
                    C: "button",
                    yC: ["ytp-offline-slate-button", "ytp-button"],
                    V: [{
                        C: "div",
                        Z: "ytp-offline-slate-button-icon",
                        eG: "{{icon}}"
                    }, {
                        C: "div",
                        Z: "ytp-offline-slate-button-text",
                        eG: "{{text}}"
                    }]
                }]
            });
            this.U = Q;
            this.W = this.toggleButtonRenderer = null;
            (this.O = this.z2("ytp-offline-slate-button")) && this.B(this.O, "click", this.A);
            this.hide()
        }
        A() {
            if (this.toggleButtonRenderer) {
                const Q = this.toggleButtonRenderer;
                Q.isToggled ? Vjm(this, Q.toggledServiceEndpoint) : Vjm(this, Q.defaultServiceEndpoint);
                Q.isToggled = !Q.isToggled;
                E0(this)
            }
        }
    }
    ;
    var yQS = class extends g.k {
        constructor(Q) {
            super({
                C: "div",
                Z: "ytp-offline-slate",
                V: [{
                    C: "div",
                    Z: "ytp-offline-slate-background"
                }, {
                    C: "div",
                    Z: "ytp-offline-slate-bar",
                    V: [{
                        C: "span",
                        Z: "ytp-offline-slate-icon",
                        V: [{
                            C: "svg",
                            N: {
                                fill: "#fff",
                                height: "100%",
                                viewBox: "0 0 24 24",
                                width: "100%"
                            },
                            V: [{
                                C: "path",
                                N: {
                                    d: "M16.94 6.91l-1.41 1.45c.9.94 1.46 2.22 1.46 3.64s-.56 2.71-1.46 3.64l1.41 1.45c1.27-1.31 2.05-3.11 2.05-5.09s-.78-3.79-2.05-5.09zM19.77 4l-1.41 1.45C19.98 7.13 21 9.44 21 12.01c0 2.57-1.01 4.88-2.64 6.54l1.4 1.45c2.01-2.04 3.24-4.87 3.24-7.99 0-3.13-1.23-5.96-3.23-8.01zM7.06 6.91c-1.27 1.3-2.05 3.1-2.05 5.09s.78 3.79 2.05 5.09l1.41-1.45c-.9-.94-1.46-2.22-1.46-3.64s.56-2.71 1.46-3.64L7.06 6.91zM5.64 5.45L4.24 4C2.23 6.04 1 8.87 1 11.99c0 3.13 1.23 5.96 3.23 8.01l1.41-1.45C4.02 16.87 3 14.56 3 11.99s1.01-4.88 2.64-6.54z"
                                }
                            }, {
                                C: "circle",
                                N: {
                                    cx: "12",
                                    cy: "12",
                                    r: "3"
                                }
                            }]
                        }]
                    }, {
                        C: "span",
                        Z: "ytp-offline-slate-messages",
                        V: [{
                            C: "div",
                            Z: "ytp-offline-slate-main-text",
                            N: {
                                "aria-label": "{{label}}"
                            },
                            eG: "{{mainText}}"
                        }, {
                            C: "div",
                            Z: "ytp-offline-slate-subtitle-text",
                            eG: "{{subtitleText}}"
                        }]
                    }, {
                        C: "span",
                        Z: "ytp-offline-slate-buttons"
                    }]
                }, {
                    C: "button",
                    yC: ["ytp-offline-slate-close-button", "ytp-button"],
                    V: [g.AK()]
                }, {
                    C: "button",
                    yC: ["ytp-offline-slate-open-button", "ytp-button"],
                    V: [g.X6()]
                }]
            });
            this.api = Q;
            this.W = this.O = null;
            this.background = this.z2("ytp-offline-slate-background");
            this.A = this.z2("ytp-offline-slate-bar");
            this.K = new g.Uc( () => {
                g.xK(this.A, "ytp-offline-slate-bar-fade")
            }
            ,15E3);
            this.D = !1;
            this.j = new g.Uc( () => {
                g.xK(this.element, "ytp-offline-slate-collapsed")
            }
            ,15E3);
            g.F(this, this.j);
            g.F(this, this.K);
            this.countdownTimer = new g.Uc(this.J,1E3,this);
            this.B(Q, "presentingplayerstatechange", this.L);
            this.B(Q, "livestatedata", this.ZF);
            this.B(this.z2("ytp-offline-slate-close-button"), "click", () => {
                g.xK(this.element, "ytp-offline-slate-collapsed")
            }
            );
            this.B(this.z2("ytp-offline-slate-open-button"), "click", () => {
                g.n6(this.element, "ytp-offline-slate-collapsed")
            }
            );
            this.hide();
            Q = this.getVideoData();
            Q.getPlayerResponse() && (Q = Q.getPlayerResponse().playabilityStatus) && this.ZF(Q);
            Q = this.api.getPresentingPlayerType() === 8 && !this.getVideoData().Cf;
            const c = this.api.getPresentingPlayerType() === 8;
            g.L(this.element, "ytp-offline-slate-premiere-trailer", Q);
            g.L(this.element, "ytp-offline-slate-hide-background", c)
        }
        getPlayerType() {
            if (this.api.getPresentingPlayerType() === 8)
                return 1
        }
        getVideoData() {
            return this.api.getVideoData({
                playerType: this.getPlayerType()
            })
        }
        ZF(Q) {
            var c = Q?.liveStreamability?.liveStreamabilityRenderer?.offlineSlate;
            if (c) {
                this.O = Q;
                c = c.liveStreamOfflineSlateRenderer;
                c.canShowCountdown ? this.J() : s0(this, c);
                var W = Q?.liveStreamability?.liveStreamabilityRenderer?.offlineSlate?.liveStreamOfflineSlateRenderer?.thumbnail;
                if (W) {
                    let m = 0
                      , K = null;
                    W = W.thumbnails;
                    for (let T = 0; T < W.length; T++)
                        W[T].width > m && (m = W[T].width || 0,
                        K = W[T].url);
                    K && (this.background.style.backgroundImage = `url(${K})`)
                } else
                    this.background.style.backgroundImage = "";
                c.actionButtons ? (this.W || (this.W = new adS(this.api),
                this.W.x0(this.z2("ytp-offline-slate-buttons")),
                g.F(this, this.W)),
                IdW(this.W, c.actionButtons && c.actionButtons[0])) : this.W && IdW(this.W, null);
                this.O = Q
            } else
                this.O = null;
            this.L()
        }
        L(Q) {
            if (this.api.getPresentingPlayerType() === 8)
                var c = !0;
            else {
                var W = this.api.getPlayerStateObject()
                  , m = this.getVideoData();
                c = m.isLivePlayback && (W.isBuffering() || W.W(2) || W.W(64));
                var K = m.autonavState === 2 && W.W(2);
                W = W.isPlaying() && !g.pl(m) && !this.api.isAtLiveHead(void 0, !0);
                c = c && !W && !K
            }
            c && this.O ? this.OC ? Q?.Fq(2) && !this.getVideoData().Cf && (g.n6(this.element, "ytp-offline-slate-collapsed"),
            this.j.stop(),
            g.n6(this.A, "ytp-offline-slate-bar-fade"),
            this.K.start()) : (this.show(),
            this.j.start(),
            this.api.publish("offlineslatestatechange"),
            this.D && this.api.Ni()) : this.OC && (this.hide(),
            this.api.publish("offlineslatestatechange"))
        }
        J() {
            const Q = this.O?.liveStreamability?.liveStreamabilityRenderer?.offlineSlate?.liveStreamOfflineSlateRenderer;
            if (Q) {
                var c = Math.floor(g.d0() / 1E3)
                  , W = Q.canShowCountdown && Number(Q.scheduledStartTime);
                !W || W <= c ? (s0(this, Q),
                this.countdownTimer.stop()) : (s0(this, Q, g.$4(W - c)),
                this.countdownTimer.cw())
            }
        }
        WA() {
            this.countdownTimer.dispose();
            this.countdownTimer = null;
            super.WA()
        }
    }
    ;
    var ElH = class {
        constructor(Q, c) {
            var W = (0,
            g.h)();
            this.trigger = Q;
            this.W = c;
            this.A = W
        }
        O(Q) {
            return this.trigger && Q.trigger ? this.trigger === Q.trigger && this.W === Q.W : !1
        }
        isExpired() {
            return (0,
            g.h)() - this.A > 6E4
        }
        toString() {
            return `heartbeat:${this.trigger}:${this.W}`
        }
    }
    ;
    var LEZ = /^GLS\/1.0 (\d+) (\w+).*?\r\n\r\n([\S\s]*)$/;
    g.GN("heartbeat", class extends g.zj {
        constructor(Q) {
            super(Q);
            this.J = !1;
            this.L = 0;
            this.K = !1;
            this.O = new g.Uc( () => {
                H0H(this)
            }
            ,0);
            this.W = this.heartbeatParams = null;
            this.j = !1;
            this.D = new g.V2(1E3,6E4,1);
            this.sequenceNumber = 0;
            this.offlineSlate = null;
            this.b0 = new g.AZ(void 0);
            this.attestationResponse = Promise.resolve(void 0);
            this.Y = Promise.resolve(void 0);
            this.utcOffsetMinutes = -(new ZH).getTimezoneOffset();
            this.A = new g.db(this);
            g.F(this, this.O);
            g.F(this, this.A);
            Dq0(this);
            FE9(this);
            this.A.B(Q, "heartbeatparams", this.Yk);
            this.A.B(Q, "presentingplayerstatechange", this.mF);
            this.A.B(Q, "videoplayerreset", this.S);
            this.A.B(Q, g.Sr("heartbeat"), this.onCueRangeEnter);
            this.j && this.W && s$W(this, void 0, this.W);
            const c = new g.C8(wI(this, !0),0x7ffffffffffff,{
                priority: 1,
                namespace: "heartbeat"
            })
              , W = new g.C8(0x8000000000000,0x8000000000000,{
                id: "stream_end",
                priority: 1,
                namespace: "heartbeat"
            });
            Q.mV([c, W]);
            dqm(this)
        }
        WA() {
            bT(this);
            this.player.qI("heartbeat");
            super.WA()
        }
        onCueRangeEnter() {
            this.J = !0;
            LB(this, wI(this))
        }
        Yk(Q) {
            this.heartbeatParams = Q;
            LB(this, wI(this))
        }
        mF(Q) {
            if (this.player.getPresentingPlayerType() !== 8 && this.W?.status !== "UNPLAYABLE")
                if (Q.state.W(2) || Q.state.W(64))
                    bT(this),
                    this.j && (this.J = !0,
                    LB(this, wI(this, !0)));
                else {
                    const c = this.player.G().experiments.Ty().W.BA(g.y27);
                    (Q.state.W(1) || Q.state.W(8) || c && Q.state.W(4)) && LB(this, wI(this))
                }
        }
        S() {
            this.player.getPresentingPlayerType() !== 3 && LB(this, wI(this))
        }
        getPlayerType() {
            if (this.player.getPresentingPlayerType() === 8)
                return 1
        }
        getVideoData() {
            return this.player.getVideoData({
                playerType: this.getPlayerType()
            })
        }
        GS(Q) {
            switch (Q) {
            case 4:
            case 3:
                return !1
            }
            return !0
        }
        JG(Q, c, W) {
            Q = {
                trigger: Q,
                reason: c
            };
            W && (Q.serializedServerContext = W.additionalLoggingData);
            g.eG("heartbeatActionPlayerTransitioned", Q)
        }
        eB(Q) {
            var c = "LICENSE";
            const W = xqH(Q);
            if (W)
                return W.reason || g.Tw[c] || "";
            if (Q = Q.match(LEZ))
                if (Q = Number(Q[1]))
                    c = (c = vlZ[Q.toString()]) ? c : "LICENSE";
            return g.Tw[c] || ""
        }
        Lt() {
            return !!this.offlineSlate && this.offlineSlate.OC
        }
    }
    );
}
)(_yt_player);
