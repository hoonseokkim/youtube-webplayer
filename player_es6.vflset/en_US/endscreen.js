(function(g) {
    var window = this;
    'use strict';
    var C7o = function(Q, c) {
        g.xt(Q, "onAutonavCoundownStarted", c)
    }
      , M0S = function(Q) {
        return Q.isBackground() && Q.Zh()
    }
      , JoS = function(Q, c) {
        c = c.getWatchNextResponse()?.playerOverlays?.playerOverlayRenderer?.autoplay?.playerOverlayAutoplayRenderer?.nextButton?.buttonRenderer;
        Q.S = c?.navigationEndpoint;
        c = c?.trackingParams;
        Q.playButton && c && Q.U.setTrackingParams(Q.playButton.element, c)
    }
      , xa = function(Q) {
        const c = VY(Q);
        var W = Math
          , m = W.min;
        var K = Q.J ? Date.now() - Q.J : 0;
        W = m.call(W, K, c);
        BK(Q, Math.ceil((c - W) / 1E3));
        c - W <= 500 && Q.W() ? Q.select(!0) : Q.W() && Q.L.start()
    }
      , qk = function(Q) {
        var c = Q.U.O8(!0, Q.U.isFullscreen());
        g.L(Q.container.element, "ytp-autonav-endscreen-small-mode", Q.dj(c));
        g.L(Q.container.element, "ytp-autonav-endscreen-is-premium", !!Q.suggestion && !!Q.suggestion.pC);
        g.L(Q.U.getRootNode(), "ytp-autonav-endscreen-cancelled-state", !Q.U.nx());
        g.L(Q.U.getRootNode(), "countdown-running", Q.W());
        g.L(Q.container.element, "ytp-player-content", Q.U.nx());
        g.JA(Q.overlay.element, {
            width: `${c.width}px`
        });
        if (!Q.W()) {
            Q.U.nx() ? BK(Q, Math.round(VY(Q) / 1E3)) : BK(Q);
            c = !!Q.suggestion && !!Q.suggestion.KY;
            const W = Q.U.nx() || !c;
            g.L(Q.container.element, "ytp-autonav-endscreen-upnext-alternative-header-only", !W && c);
            g.L(Q.container.element, "ytp-autonav-endscreen-upnext-no-alternative-header", W && !c);
            Q.D.BB(Q.U.nx())
        }
    }
      , BK = function(Q, c=-1) {
        Q = Q.A.z2("ytp-autonav-endscreen-upnext-header");
        g.y0(Q);
        if (c >= 0) {
            c = String(c);
            const W = "Up next in $SECONDS".match(RegExp("\\$SECONDS", "gi"))[0]
              , m = "Up next in $SECONDS".indexOf(W);
            if (m >= 0) {
                Q.appendChild(g.Nn("Up next in $SECONDS".slice(0, m)));
                const K = g.HB("span");
                g.VN(K, "ytp-autonav-endscreen-upnext-header-countdown-number");
                g.EZ(K, c);
                Q.appendChild(K);
                Q.appendChild(g.Nn("Up next in $SECONDS".slice(m + W.length)));
                return
            }
        }
        g.EZ(Q, "Up next")
    }
      , VY = function(Q) {
        return Q.U.isFullscreen() ? (Q = Q.U.getVideoData()?.I4,
        Q === -1 || Q === void 0 ? 8E3 : Q) : Q.U.LY() >= 0 ? Q.U.LY() : g.Um(Q.U.G().experiments, "autoplay_time") || 1E4
    }
      , nB = function(Q, c) {
        c = RQ4(Q, c);
        var W = Math
          , m = W.min;
        var K = (0,
        g.h)() - Q.J;
        W = m.call(W, K, c);
        c = c === 0 ? 1 : Math.min(W / c, 1);
        Q.MM.setAttribute("stroke-dashoffset", `${-211 * (c + 1)}`);
        c >= 1 && Q.W() && Q.api.getPresentingPlayerType() !== 3 ? Q.select(!0) : Q.W() && Q.A.start()
    }
      , RQ4 = function(Q, c) {
        return c ? c : Q.api.isFullscreen() ? (Q = Q.api.getVideoData()?.I4,
        Q === -1 || Q === void 0 ? 8E3 : Q) : Q.api.LY() >= 0 ? Q.api.LY() : g.Um(Q.api.G().experiments, "autoplay_time") || 1E4
    }
      , DH = function(Q) {
        return g.vt(Q.player) && Q.L() && !Q.j
    }
      , tX = function(Q) {
        const c = Q.nx();
        c !== Q.Y && (Q.Y = c,
        Q.player.publish("autonavvisibility"))
    }
      , HK = function(Q) {
        return g.vt(Q.player) && Q.L() && !Q.K
    }
      , Nk = function(Q) {
        const c = Q.nx();
        c !== Q.b0 && (Q.b0 = c,
        Q.player.publish("autonavvisibility"))
    }
      , kp9 = function(Q) {
        Q = Q.G();
        return Q.d3 && !Q.qY && !Q.disableOrganicUi
    }
      , YB9 = function(Q) {
        const c = Q.player.getVideoData();
        if (!c || Q.W === c.Xw)
            return !1;
        Q.W = c.Xw;
        return !0
    }
      , p_Z = function(Q) {
        Q.player.qI("endscreen");
        var c = Q.player.getVideoData();
        c = new g.C8(Math.max((c.lengthSeconds - 10) * 1E3, 0),0x8000000000000,{
            id: "preload",
            namespace: "endscreen"
        });
        const W = new g.C8(0x8000000000000,0x8000000000000,{
            id: "load",
            priority: 8,
            namespace: "endscreen"
        });
        Q.player.mV([c, W])
    };
    g.N0.prototype.LY = g.W3(9, function() {
        return this.app.LY()
    });
    g.Iy.prototype.LY = g.W3(8, function() {
        return this.getVideoData().BC
    });
    g.HL.prototype.vl = g.W3(7, function(Q) {
        this.l9().vl(Q)
    });
    g.LH.prototype.vl = g.W3(6, function(Q) {
        this.y9 !== Q && (this.y9 = Q,
        this.zO())
    });
    var iT = class extends g.k {
        constructor(Q) {
            super({
                C: "div",
                Z: "ytp-autonav-endscreen-countdown-overlay"
            });
            this.cancelCommand = this.S = void 0;
            this.J = 0;
            this.container = new g.k({
                C: "div",
                Z: "ytp-autonav-endscreen-countdown-container"
            });
            g.F(this, this.container);
            this.container.x0(this.element);
            var c = Q.G();
            const W = c.j;
            this.U = Q;
            this.suggestion = null;
            this.onVideoDataChange("newdata", this.U.getVideoData());
            this.B(Q, "videodatachange", this.onVideoDataChange);
            this.A = new g.k({
                C: "div",
                Z: "ytp-autonav-endscreen-upnext-container",
                N: {
                    "aria-label": "{{aria_label}}",
                    "data-is-live": "{{is_live}}",
                    "data-is-list": "{{is_list}}",
                    "data-is-mix": "{{is_mix}}",
                    "data-is-upcoming": "{{is_upcoming}}"
                },
                V: [{
                    C: "div",
                    Z: "ytp-autonav-endscreen-upnext-header"
                }, {
                    C: "div",
                    Z: "ytp-autonav-endscreen-upnext-alternative-header",
                    eG: "{{autoplayAlternativeHeader}}"
                }, {
                    C: "a",
                    Z: "ytp-autonav-endscreen-link-container",
                    N: {
                        href: "{{url}}",
                        target: W ? c.Y : ""
                    },
                    V: [{
                        C: "div",
                        Z: "ytp-autonav-endscreen-upnext-thumbnail",
                        N: {
                            style: "{{background}}"
                        },
                        V: [{
                            C: "div",
                            N: {
                                "aria-label": "{{timestamp}}"
                            },
                            yC: ["ytp-autonav-timestamp"],
                            eG: "{{duration}}"
                        }, {
                            C: "div",
                            yC: ["ytp-autonav-live-stamp"],
                            eG: "Live"
                        }, {
                            C: "div",
                            yC: ["ytp-autonav-upcoming-stamp"],
                            eG: "Upcoming"
                        }]
                    }, {
                        C: "div",
                        Z: "ytp-autonav-endscreen-video-info",
                        V: [{
                            C: "div",
                            Z: "ytp-autonav-endscreen-premium-badge"
                        }, {
                            C: "div",
                            Z: "ytp-autonav-endscreen-upnext-title",
                            eG: "{{title}}"
                        }, {
                            C: "div",
                            Z: "ytp-autonav-endscreen-upnext-author",
                            eG: "{{author}}"
                        }, {
                            C: "div",
                            Z: "ytp-autonav-view-and-date",
                            eG: "{{views_and_publish_time}}"
                        }, {
                            C: "div",
                            Z: "ytp-autonav-author-and-view",
                            eG: "{{author_and_views}}"
                        }]
                    }]
                }]
            });
            g.F(this, this.A);
            this.A.x0(this.container.element);
            W || this.B(this.A.z2("ytp-autonav-endscreen-link-container"), "click", this.T2);
            this.U.createClientVe(this.container.element, this, 115127);
            this.U.createClientVe(this.A.z2("ytp-autonav-endscreen-link-container"), this, 115128);
            this.overlay = new g.k({
                C: "div",
                Z: "ytp-autonav-overlay"
            });
            g.F(this, this.overlay);
            this.overlay.x0(this.container.element);
            this.D = new g.k({
                C: "div",
                Z: "ytp-autonav-endscreen-button-container"
            });
            g.F(this, this.D);
            this.D.x0(this.container.element);
            this.cancelButton = new g.k({
                C: "button",
                yC: ["ytp-autonav-endscreen-upnext-button", "ytp-autonav-endscreen-upnext-cancel-button", "ytp-autonav-endscreen-upnext-button-rounded"],
                N: {
                    "aria-label": "Cancel autoplay"
                },
                eG: "Cancel"
            });
            g.F(this, this.cancelButton);
            this.cancelButton.x0(this.D.element);
            this.cancelButton.listen("click", this.Ie, this);
            this.U.createClientVe(this.cancelButton.element, this, 115129);
            this.playButton = new g.k({
                C: "a",
                yC: ["ytp-autonav-endscreen-upnext-button", "ytp-autonav-endscreen-upnext-play-button", "ytp-autonav-endscreen-upnext-button-rounded"],
                N: {
                    href: "{{url}}",
                    role: "button",
                    "aria-label": "Play next video"
                },
                eG: "Play Now"
            });
            g.F(this, this.playButton);
            this.playButton.x0(this.D.element);
            this.playButton.listen("click", this.T2, this);
            this.U.createServerVe(this.playButton.element, this.playButton, !0);
            (c = this.U.getVideoData()) && JoS(this, c);
            this.L = new g.Uc( () => {
                xa(this)
            }
            ,500);
            g.F(this, this.L);
            this.b0();
            this.B(Q, "autonavvisibility", this.b0)
        }
        Y(Q) {
            this.suggestion !== Q && (this.suggestion = Q,
            g.Zz(this.A, Q),
            this.playButton.updateValue("url", this.suggestion.L2()),
            qk(this))
        }
        W() {
            return this.J > 0
        }
        K() {
            this.W() || (this.J = Date.now(),
            xa(this),
            C7o(this.U, VY(this)),
            g.L(this.U.getRootNode(), "countdown-running", this.W()))
        }
        j() {
            this.O();
            xa(this);
            const Q = this.A.z2("ytp-autonav-endscreen-upnext-header");
            Q && g.EZ(Q, "Up next")
        }
        O() {
            this.W() && (this.L.stop(),
            this.J = 0)
        }
        select(Q=!1) {
            this.U.nextVideo(!1, Q);
            this.O()
        }
        T2(Q) {
            g.kt(Q, this.U) && (Q.currentTarget === this.playButton.element ? this.U.logClick(this.playButton.element) : Q.currentTarget === this.A.z2("ytp-autonav-endscreen-link-container") && (Q = this.A.z2("ytp-autonav-endscreen-link-container"),
            this.U.logVisibility(Q, !0),
            this.U.logClick(Q)),
            this.S ? (g.xt(this.U, "innertubeCommand", this.S),
            this.O()) : this.select())
        }
        Ie() {
            this.U.logClick(this.cancelButton.element);
            g.d7(this.U, !0);
            this.cancelCommand && g.xt(this.U, "innertubeCommand", this.cancelCommand)
        }
        onVideoDataChange(Q, c) {
            JoS(this, c);
            this.cancelCommand = c.getWatchNextResponse()?.playerOverlays?.playerOverlayRenderer?.autoplay?.playerOverlayAutoplayRenderer?.cancelButton?.buttonRenderer?.command
        }
        b0() {
            const Q = this.U.nx();
            this.OC !== Q && this.BB(Q);
            qk(this);
            this.U.logVisibility(this.container.element, Q);
            this.U.logVisibility(this.cancelButton.element, Q);
            this.U.logVisibility(this.A.z2("ytp-autonav-endscreen-link-container"), Q);
            this.U.logVisibility(this.playButton.element, Q)
        }
        dj(Q) {
            return Q.width < 400 || Q.height < 459
        }
    }
    ;
    var yY = class extends g.k {
        constructor(Q, c) {
            super({
                C: "div",
                yC: ["html5-endscreen", "ytp-player-content", c || "base-endscreen"]
            });
            this.created = !1;
            this.player = Q
        }
        create() {
            this.created = !0
        }
        destroy() {
            this.created = !1
        }
        L() {
            return !1
        }
        nx() {
            return !1
        }
        S() {
            return !1
        }
    }
    ;
    var Q$W = class extends g.k {
        constructor(Q) {
            super({
                C: "div",
                yC: ["ytp-upnext", "ytp-player-content"],
                N: {
                    "aria-label": "{{aria_label}}"
                },
                V: [{
                    C: "div",
                    Z: "ytp-cued-thumbnail-overlay-image",
                    N: {
                        style: "{{background}}"
                    }
                }, {
                    C: "span",
                    Z: "ytp-upnext-top",
                    V: [{
                        C: "span",
                        Z: "ytp-upnext-header",
                        eG: "Up Next"
                    }, {
                        C: "span",
                        Z: "ytp-upnext-title",
                        eG: "{{title}}"
                    }, {
                        C: "span",
                        Z: "ytp-upnext-author",
                        eG: "{{author}}"
                    }]
                }, {
                    C: "a",
                    Z: "ytp-upnext-autoplay-icon",
                    N: {
                        role: "button",
                        href: "{{url}}",
                        "aria-label": "Play next video"
                    },
                    V: [{
                        C: "svg",
                        N: {
                            height: "100%",
                            version: "1.1",
                            viewBox: "0 0 72 72",
                            width: "100%"
                        },
                        V: [{
                            C: "circle",
                            Z: "ytp-svg-autoplay-circle",
                            N: {
                                cx: "36",
                                cy: "36",
                                fill: "#fff",
                                "fill-opacity": "0.3",
                                r: "31.5"
                            }
                        }, {
                            C: "circle",
                            Z: "ytp-svg-autoplay-ring",
                            N: {
                                cx: "-36",
                                cy: "36",
                                "fill-opacity": "0",
                                r: "33.5",
                                stroke: "#FFFFFF",
                                "stroke-dasharray": "211",
                                "stroke-dashoffset": "-211",
                                "stroke-width": "4",
                                transform: "rotate(-90)"
                            }
                        }, {
                            C: "path",
                            Z: "ytp-svg-fill",
                            N: {
                                d: "M 24,48 41,36 24,24 V 48 z M 44,24 v 24 h 4 V 24 h -4 z"
                            }
                        }]
                    }]
                }, {
                    C: "span",
                    Z: "ytp-upnext-bottom",
                    V: [{
                        C: "span",
                        Z: "ytp-upnext-cancel"
                    }, {
                        C: "span",
                        Z: "ytp-upnext-paused",
                        eG: "Autoplay is paused"
                    }]
                }]
            });
            this.api = Q;
            this.cancelButton = null;
            this.MM = this.z2("ytp-svg-autoplay-ring");
            this.L = this.notification = this.A = this.suggestion = null;
            this.S = new g.Uc(this.D,5E3,this);
            this.J = 0;
            var c = this.z2("ytp-upnext-cancel");
            this.cancelButton = new g.k({
                C: "button",
                yC: ["ytp-upnext-cancel-button", "ytp-button"],
                N: {
                    tabindex: "0",
                    "aria-label": "Cancel autoplay"
                },
                eG: "Cancel"
            });
            g.F(this, this.cancelButton);
            this.cancelButton.listen("click", this.T2, this);
            this.cancelButton.x0(c);
            this.cancelButton && this.api.createClientVe(this.cancelButton.element, this, 115129);
            g.F(this, this.S);
            this.api.createClientVe(this.element, this, 18788);
            c = this.z2("ytp-upnext-autoplay-icon");
            this.B(c, "click", this.Ie);
            this.api.createClientVe(c, this, 115130);
            this.b0();
            this.B(Q, "autonavvisibility", this.b0);
            this.B(Q, "mdxnowautoplaying", this.Ka);
            this.B(Q, "mdxautoplaycanceled", this.jG);
            g.L(this.element, "ytp-upnext-mobile", this.api.G().O)
        }
        D() {
            this.notification && (this.S.stop(),
            this.Xd(this.L),
            this.L = null,
            this.notification.close(),
            this.notification = null)
        }
        Y(Q) {
            this.suggestion = Q;
            g.Zz(this, Q, "hqdefault.jpg")
        }
        b0() {
            this.BB(this.api.nx());
            this.api.logVisibility(this.element, this.api.nx());
            this.api.logVisibility(this.z2("ytp-upnext-autoplay-icon"), this.api.nx());
            this.cancelButton && this.api.logVisibility(this.cancelButton.element, this.api.nx())
        }
        PA() {
            window.focus();
            this.D()
        }
        K(Q) {
            this.W() || (g.Wm("a11y-announce", `Up Next ${this.suggestion.title}`),
            this.J = (0,
            g.h)(),
            this.A = new g.Uc( () => {
                nB(this, Q)
            }
            ,25),
            nB(this, Q),
            C7o(this.api, RQ4(this, Q)));
            g.n6(this.element, "ytp-upnext-autoplay-paused")
        }
        hide() {
            super.hide()
        }
        W() {
            return !!this.A
        }
        j() {
            this.O();
            this.J = (0,
            g.h)();
            nB(this);
            g.xK(this.element, "ytp-upnext-autoplay-paused")
        }
        O() {
            this.W() && (this.A.dispose(),
            this.A = null)
        }
        select(Q=!1) {
            if (this.api.G().X("autonav_notifications") && Q && window.Notification && typeof document.hasFocus === "function") {
                const c = Notification.permission;
                c === "default" ? Notification.requestPermission() : c !== "granted" || document.hasFocus() || (this.D(),
                this.notification = new Notification("Up Next",{
                    body: this.suggestion.title,
                    icon: this.suggestion.ux()
                }),
                this.L = this.B(this.notification, "click", this.PA),
                this.S.start())
            }
            this.O();
            this.api.nextVideo(!1, Q)
        }
        Ie(Q) {
            !g.ZJ(this.cancelButton.element, Q.target) && g.kt(Q, this.api) && (this.api.nx() && this.api.logClick(this.z2("ytp-upnext-autoplay-icon")),
            this.select())
        }
        T2() {
            this.api.nx() && this.cancelButton && this.api.logClick(this.cancelButton.element);
            g.d7(this.api, !0)
        }
        Ka(Q) {
            this.api.getPresentingPlayerType();
            this.show();
            this.K(Q)
        }
        jG() {
            this.api.getPresentingPlayerType();
            this.O();
            this.hide()
        }
        WA() {
            this.O();
            this.D();
            super.WA()
        }
    }
    ;
    var cQi = class extends yY {
        constructor(Q) {
            super(Q, "videowall-endscreen");
            this.U = Q;
            this.stills = [];
            this.j = this.videoData = null;
            this.K = this.Y = !1;
            this.b0 = null;
            g.xK(this.element, "modern-videowall-endscreen");
            this.O = new g.db(this);
            g.F(this, this.O);
            this.D = new g.Uc( () => {
                g.xK(this.element, "ytp-show-tiles")
            }
            ,0);
            g.F(this, this.D);
            this.table = new g.Mu({
                C: "div",
                Z: "ytp-modern-endscreen-content"
            });
            g.F(this, this.table);
            this.table.x0(this.element);
            Q.getVideoData().Xw ? this.W = new iT(Q) : this.W = new Q$W(Q);
            g.F(this, this.W);
            g.f8(this.player, this.W.element, 4);
            Q.createClientVe(this.element, this, 158789);
            this.hide()
        }
        create() {
            super.create();
            var Q = this.player.getVideoData();
            Q && (this.videoData = Q);
            this.A();
            this.O.B(this.player, "appresize", this.A);
            this.O.B(this.player, "onVideoAreaChange", this.A);
            this.O.B(this.player, "videodatachange", this.onVideoDataChange);
            this.O.B(this.player, "autonavchange", this.J);
            this.O.B(this.player, "onAutonavCancelled", this.T2);
            Q = this.videoData.autonavState;
            Q !== this.b0 && this.J(Q);
            this.O.B(this.element, "transitionend", this.Ie)
        }
        destroy() {
            this.O.O();
            g.xE(this.stills);
            this.stills = [];
            super.destroy();
            g.n6(this.element, "ytp-show-tiles");
            this.D.stop();
            this.b0 = this.videoData.autonavState
        }
        L() {
            return this.videoData.autonavState !== 1
        }
        show() {
            const Q = this.OC;
            super.show();
            g.n6(this.element, "ytp-show-tiles");
            this.player.G().O ? g.I9(this.D) : this.D.start();
            (this.K || this.j && this.j !== this.videoData.clientPlaybackNonce) && g.d7(this.player, !1);
            DH(this) ? (tX(this),
            this.videoData.autonavState === 2 ? this.player.getVisibilityState() === 3 || M0S(this.player.OV()) && this.player.X("web_player_pip_logging_fix") ? this.W.select(!0) : this.W.K() : this.videoData.autonavState === 3 && this.W.j()) : (g.d7(this.player, !0),
            tX(this));
            Q !== this.OC && this.player.logVisibility(this.element, !0)
        }
        hide() {
            const Q = this.OC;
            super.hide();
            this.W.j();
            tX(this);
            Q !== this.OC && this.player.logVisibility(this.element, !1)
        }
        Ie(Q) {
            Q.target === this.element && this.A()
        }
        A() {
            const Q = this.videoData?.suggestions?.length ? this.videoData?.suggestions : [this.videoData?.mF()];
            if (Q.length) {
                var c = this.U.O8(!0, this.U.isFullscreen())
                  , W = Math.floor((c.width - 64 + 16) / (g.lm(c.width * .27, 250, 450) + 16));
                c = Math.min(3, Math.floor((c.height - 64) / ((c.width - 64 - (W - 1) * 16) / W * .5625 + 70)));
                g.De(this.element, ["ytp-modern-endscreen-limit-rows-1", "ytp-modern-endscreen-limit-rows-2", "ytp-modern-endscreen-limit-rows-3"]);
                g.xK(this.element, `ytp-modern-endscreen-limit-rows-${c}`);
                g.L(this.element, "ytp-modern-endscreen-single-item", W === 1);
                g.L(this.element, "ytp-modern-endscreen-row-0", c === 0);
                W = this.table.element;
                W.ariaLive = "polite";
                this.W.Y(this.videoData.mF());
                this.W instanceof iT && qk(this.W);
                g.L(this.element, "ytp-endscreen-takeover", DH(this));
                tX(this);
                c = 0;
                W.ariaBusy = "true";
                var m = Q.length;
                for (let K = 0; K < m; K++) {
                    const T = K % m;
                    let r = this.stills[K];
                    r || (r = new g.x$9(this.player),
                    this.stills[K] = r,
                    W.appendChild(r.element));
                    g.E2d(r, Q[T]);
                    c++
                }
                this.stills.length = c
            }
        }
        onVideoDataChange() {
            const Q = this.player.getVideoData({
                playerType: 1
            });
            this.videoData !== Q && (Q?.mF() ? (this.videoData = Q,
            this.A()) : this.player.tJ("missg", {
                vid: Q?.videoId || "",
                cpn: Q?.clientPlaybackNonce || ""
            }))
        }
        S() {
            return this.W.W()
        }
        J(Q) {
            Q === 1 ? (this.K = !1,
            this.j = this.videoData.clientPlaybackNonce,
            this.W.O(),
            this.OC && this.A()) : (this.K = !0,
            this.OC && DH(this) && (Q === 2 ? this.W.K() : Q === 3 && this.W.j()))
        }
        T2(Q) {
            if (Q) {
                for (Q = 0; Q < this.stills.length; Q++)
                    this.U.logVisibility(this.stills[Q].element, !0);
                this.J(1)
            } else
                this.j = null,
                this.K = !1;
            this.A()
        }
        nx() {
            return this.OC && DH(this)
        }
    }
    ;
    var WE9 = class extends yY {
        constructor(Q) {
            super(Q, "subscribecard-endscreen");
            this.W = new g.k({
                C: "div",
                Z: "ytp-subscribe-card",
                V: [{
                    C: "img",
                    Z: "ytp-author-image",
                    N: {
                        src: "{{profilePicture}}"
                    }
                }, {
                    C: "div",
                    Z: "ytp-subscribe-card-right",
                    V: [{
                        C: "div",
                        Z: "ytp-author-name",
                        eG: "{{author}}"
                    }, {
                        C: "div",
                        Z: "html5-subscribe-button-container"
                    }]
                }]
            });
            g.F(this, this.W);
            this.W.x0(this.element);
            const c = Q.getVideoData();
            this.subscribeButton = new g.tW("Subscribe",null,"Unsubscribe",null,!0,!1,c.nB,c.subscribed,"trailer-endscreen",null,Q,!1);
            g.F(this, this.subscribeButton);
            this.subscribeButton.x0(this.W.z2("html5-subscribe-button-container"));
            this.B(Q, "videodatachange", this.ZF);
            this.ZF();
            this.hide()
        }
        ZF() {
            const Q = this.player.getVideoData();
            this.W.update({
                profilePicture: Q.profilePicture,
                author: Q.author
            });
            this.subscribeButton.channelId = Q.nB;
            var c = this.subscribeButton;
            Q.subscribed ? c.W() : c.O()
        }
    }
    ;
    var mqW = class extends g.k {
        constructor(Q) {
            const c = Q.G()
              , W = g.Am || g.d8 ? {
                style: "will-change: opacity"
            } : void 0
              , m = c.j
              , K = ["ytp-videowall-still"];
            c.O && K.push("ytp-videowall-show-text");
            super({
                C: "a",
                yC: K,
                N: {
                    href: "{{url}}",
                    target: m ? c.Y : "",
                    "aria-label": "{{aria_label}}",
                    "data-is-live": "{{is_live}}",
                    "data-is-list": "{{is_list}}",
                    "data-is-mix": "{{is_mix}}"
                },
                V: [{
                    C: "div",
                    Z: "ytp-videowall-still-image",
                    N: {
                        style: "{{background}}"
                    }
                }, {
                    C: "span",
                    Z: "ytp-videowall-still-info",
                    N: {
                        "aria-hidden": "true"
                    },
                    V: [{
                        C: "span",
                        Z: "ytp-videowall-still-info-bg",
                        V: [{
                            C: "span",
                            Z: "ytp-videowall-still-info-content",
                            N: W,
                            V: [{
                                C: "span",
                                Z: "ytp-videowall-still-info-title",
                                eG: "{{title}}"
                            }, {
                                C: "span",
                                Z: "ytp-videowall-still-info-author",
                                eG: "{{author_and_views}}"
                            }, {
                                C: "span",
                                Z: "ytp-videowall-still-info-live",
                                eG: "Live"
                            }, {
                                C: "span",
                                Z: "ytp-videowall-still-info-duration",
                                eG: "{{duration}}"
                            }]
                        }]
                    }]
                }, {
                    C: "span",
                    yC: ["ytp-videowall-still-listlabel-regular", "ytp-videowall-still-listlabel"],
                    N: {
                        "aria-hidden": "true"
                    },
                    V: [{
                        C: "span",
                        Z: "ytp-videowall-still-listlabel-icon"
                    }, "Playlist", {
                        C: "span",
                        Z: "ytp-videowall-still-listlabel-length",
                        V: [" (", {
                            C: "span",
                            eG: "{{playlist_length}}"
                        }, ")"]
                    }]
                }, {
                    C: "span",
                    yC: ["ytp-videowall-still-listlabel-mix", "ytp-videowall-still-listlabel"],
                    N: {
                        "aria-hidden": "true"
                    },
                    V: [{
                        C: "span",
                        Z: "ytp-videowall-still-listlabel-mix-icon"
                    }, "Mix", {
                        C: "span",
                        Z: "ytp-videowall-still-listlabel-length",
                        eG: " (50+)"
                    }]
                }]
            });
            this.suggestion = null;
            this.O = m;
            this.api = Q;
            this.W = new g.db(this);
            g.F(this, this.W);
            this.listen("click", this.onClick);
            this.listen("keypress", this.onKeyPress);
            this.W.B(Q, "videodatachange", this.onVideoDataChange);
            Q.createServerVe(this.element, this);
            this.onVideoDataChange()
        }
        select() {
            this.api.SF(this.suggestion.videoId, this.suggestion.sessionData, this.suggestion.playlistId, void 0, void 0, this.suggestion.Li || void 0) && this.api.logClick(this.element)
        }
        onClick(Q) {
            if (g.oc(this.api.G()) && this.api.X("web_player_log_click_before_generating_ve_conversion_params")) {
                this.api.logClick(this.element);
                let c = this.suggestion.L2();
                const W = {};
                g.jo(this.api, W);
                c = g.sJ(c, W);
                g.Yt(c, this.api, Q)
            } else
                g.kt(Q, this.api, this.O, this.suggestion.sessionData || void 0) && this.select()
        }
        onKeyPress(Q) {
            switch (Q.keyCode) {
            case 13:
            case 32:
                Q.defaultPrevented || (this.select(),
                Q.preventDefault())
            }
        }
        onVideoDataChange() {
            const Q = this.api.getVideoData()
              , c = this.api.G();
            this.O = Q.er ? !1 : c.j
        }
    }
    ;
    var KEi = class extends yY {
        constructor(Q) {
            super(Q, "videowall-endscreen");
            this.U = Q;
            this.j = 0;
            this.stills = [];
            this.K = this.videoData = null;
            this.D = this.b0 = !1;
            this.T2 = null;
            this.A = new g.db(this);
            g.F(this, this.A);
            this.J = new g.Uc( () => {
                g.xK(this.element, "ytp-show-tiles")
            }
            ,0);
            g.F(this, this.J);
            var c = new g.k({
                C: "button",
                yC: ["ytp-button", "ytp-endscreen-previous"],
                N: {
                    "aria-label": "Previous"
                },
                V: [g.X6()]
            });
            g.F(this, c);
            c.x0(this.element);
            c.listen("click", this.Ka, this);
            this.table = new g.Mu({
                C: "div",
                Z: "ytp-endscreen-content"
            });
            g.F(this, this.table);
            this.table.x0(this.element);
            c = new g.k({
                C: "button",
                yC: ["ytp-button", "ytp-endscreen-next"],
                N: {
                    "aria-label": "Next"
                },
                V: [g.AK()]
            });
            g.F(this, c);
            c.x0(this.element);
            c.listen("click", this.MM, this);
            Q.getVideoData().Xw ? this.W = new iT(Q) : this.W = new Q$W(Q);
            g.F(this, this.W);
            g.f8(this.player, this.W.element, 4);
            Q.createClientVe(this.element, this, 158789);
            this.hide()
        }
        create() {
            super.create();
            var Q = this.player.getVideoData();
            Q && (this.videoData = Q);
            this.O();
            this.A.B(this.player, "appresize", this.O);
            this.A.B(this.player, "onVideoAreaChange", this.O);
            this.A.B(this.player, "videodatachange", this.onVideoDataChange);
            this.A.B(this.player, "autonavchange", this.Y);
            this.A.B(this.player, "onAutonavCancelled", this.Ie);
            Q = this.videoData.autonavState;
            Q !== this.T2 && this.Y(Q);
            this.A.B(this.element, "transitionend", this.jG)
        }
        destroy() {
            this.A.O();
            g.xE(this.stills);
            this.stills = [];
            super.destroy();
            g.n6(this.element, "ytp-show-tiles");
            this.J.stop();
            this.T2 = this.videoData.autonavState
        }
        L() {
            return this.videoData.autonavState !== 1
        }
        show() {
            const Q = this.OC;
            super.show();
            g.n6(this.element, "ytp-show-tiles");
            this.player.G().O ? g.I9(this.J) : this.J.start();
            (this.D || this.K && this.K !== this.videoData.clientPlaybackNonce) && g.d7(this.player, !1);
            HK(this) ? (Nk(this),
            this.videoData.autonavState === 2 ? this.player.getVisibilityState() === 3 || M0S(this.player.OV()) && this.player.X("web_player_pip_logging_fix") ? this.W.select(!0) : this.W.K() : this.videoData.autonavState === 3 && this.W.j()) : (g.d7(this.player, !0),
            Nk(this));
            Q !== this.OC && this.player.logVisibility(this.element, !0)
        }
        hide() {
            const Q = this.OC;
            super.hide();
            this.W.j();
            Nk(this);
            Q !== this.OC && this.player.logVisibility(this.element, !1)
        }
        jG(Q) {
            Q.target === this.element && this.O()
        }
        O() {
            var Q = this.videoData?.suggestions?.length ? this.videoData?.suggestions : [this.videoData?.mF()];
            if (Q.length) {
                g.xK(this.element, "ytp-endscreen-paginate");
                var c = this.U.O8(!0, this.U.isFullscreen())
                  , W = g.ip(this.U);
                W && (W = W.Qh() ? 48 : 32,
                c.width -= W * 2);
                var m = c.width / c.height
                  , K = 96 / 54
                  , T = W = 2
                  , r = Math.max(c.width / 96, 2)
                  , U = Math.max(c.height / 54, 2)
                  , I = Q.length;
                var X = I * 4;
                for (X -= 4; X > 0 && (W < r || T < U); ) {
                    var A = W / 2
                      , e = T / 2
                      , V = W <= r - 2 && X >= e * 4
                      , B = T <= U - 2 && X >= A * 4;
                    if ((A + 1) / e * K / m > m / (A / (e + 1) * K) && B)
                        X -= A * 4,
                        T += 2;
                    else if (V)
                        X -= e * 4,
                        W += 2;
                    else if (B)
                        X -= A * 4,
                        T += 2;
                    else
                        break
                }
                K = !1;
                X >= 12 && I * 4 - X <= 6 && (T >= 4 || W >= 4) && (K = !0);
                X = W * 96;
                r = T * 54;
                m = X / r < m ? c.height / r : c.width / X;
                m = Math.min(m, 2);
                X = Math.floor(Math.min(c.width, X * m));
                r = Math.floor(Math.min(c.height, r * m));
                c = this.table.element;
                c.ariaLive = "polite";
                g.XI(c, X, r);
                g.JA(c, {
                    marginLeft: `${X / -2}px`,
                    marginTop: `${r / -2}px`
                });
                this.W.Y(this.videoData.mF());
                this.W instanceof iT && qk(this.W);
                g.L(this.element, "ytp-endscreen-takeover", HK(this));
                Nk(this);
                X += 4;
                r += 4;
                m = 0;
                c.ariaBusy = "true";
                for (U = 0; U < W; U++)
                    for (A = 0; A < T; A++)
                        if (V = m,
                        B = 0,
                        K && U >= W - 2 && A >= T - 2 ? B = 1 : A % 2 === 0 && U % 2 === 0 && (A < 2 && U < 2 ? A === 0 && U === 0 && (B = 2) : B = 2),
                        V = g.um(V + this.j, I),
                        B !== 0) {
                            e = this.stills[m];
                            e || (e = new mqW(this.player),
                            this.stills[m] = e,
                            c.appendChild(e.element));
                            var n = Math.floor(r * A / T);
                            const S = Math.floor(X * U / W)
                              , d = Math.floor(r * (A + B) / T) - n - 4
                              , b = Math.floor(X * (U + B) / W) - S - 4;
                            g.ml(e.element, S, n);
                            g.XI(e.element, b, d);
                            g.JA(e.element, "transitionDelay", (A + U) / 20 + "s");
                            g.L(e.element, "ytp-videowall-still-mini", B === 1);
                            g.L(e.element, "ytp-videowall-still-large", B > 2);
                            B = Math.max(b, d);
                            g.L(e.element, "ytp-videowall-still-round-large", B >= 256);
                            g.L(e.element, "ytp-videowall-still-round-medium", B > 96 && B < 256);
                            g.L(e.element, "ytp-videowall-still-round-small", B <= 96);
                            V = Q[V];
                            e.suggestion !== V && (e.suggestion = V,
                            B = e.api.G(),
                            n = g.B7(e.element, "ytp-videowall-still-large") ? "hqdefault.jpg" : "mqdefault.jpg",
                            g.Zz(e, V, n),
                            g.oc(B) && !e.api.X("web_player_log_click_before_generating_ve_conversion_params") && (B = V.L2(),
                            n = {},
                            g.Dr(e.api, "addEmbedsConversionTrackingParams", [n]),
                            B = g.sJ(B, n),
                            e.updateValue("url", B)),
                            (V = (V = V.sessionData) && V.itct) && e.api.setTrackingParams(e.element, V));
                            m++
                        }
                c.ariaBusy = "false";
                g.L(this.element, "ytp-endscreen-paginate", m < I);
                for (Q = this.stills.length - 1; Q >= m; Q--)
                    W = this.stills[Q],
                    g.FQ(W.element),
                    g.BN(W);
                this.stills.length = m
            }
        }
        onVideoDataChange() {
            const Q = this.player.getVideoData({
                playerType: 1
            });
            this.videoData !== Q && (Q?.mF() ? (this.j = 0,
            this.videoData = Q,
            this.O()) : this.player.tJ("missg", {
                vid: Q?.videoId || "",
                cpn: Q?.clientPlaybackNonce || ""
            }))
        }
        MM() {
            this.j += this.stills.length;
            this.O()
        }
        Ka() {
            this.j -= this.stills.length;
            this.O()
        }
        S() {
            return this.W.W()
        }
        Y(Q) {
            Q === 1 ? (this.D = !1,
            this.K = this.videoData.clientPlaybackNonce,
            this.W.O(),
            this.OC && this.O()) : (this.D = !0,
            this.OC && HK(this) && (Q === 2 ? this.W.K() : Q === 3 && this.W.j()))
        }
        Ie(Q) {
            if (Q) {
                for (Q = 0; Q < this.stills.length; Q++)
                    this.U.logVisibility(this.stills[Q].element, !0);
                this.Y(1)
            } else
                this.K = null,
                this.D = !1;
            this.O()
        }
        nx() {
            return this.OC && HK(this)
        }
    }
    ;
    var TGi = class extends g.k {
        constructor(Q) {
            super({
                C: "button",
                yC: ["ytp-watch-on-youtube-button", "ytp-button"],
                eG: "{{content}}"
            });
            this.U = Q;
            this.buttonType = this.buttonType = 1;
            this.W();
            this.buttonType === 2 && g.xK(this.element, "ytp-continue-watching-button");
            this.listen("click", this.onClick);
            this.listen("videodatachange", this.W);
            this.BB(!0)
        }
        W() {
            let Q, c;
            switch (this.buttonType) {
            case 1:
                Q = "Watch again on YouTube";
                c = 156915;
                break;
            case 2:
                Q = "Continue watching on YouTube";
                c = 156942;
                break;
            default:
                Q = "Continue watching on YouTube",
                c = 156942
            }
            this.update({
                content: Q
            });
            this.U.hasVe(this.element) && this.U.destroyVe(this.element);
            this.U.createClientVe(this.element, this, c)
        }
        onClick(Q) {
            this.U.X("web_player_log_click_before_generating_ve_conversion_params") && this.U.logClick(this.element);
            g.Yt(this.getVideoUrl(), this.U, Q);
            this.U.X("web_player_log_click_before_generating_ve_conversion_params") || this.U.logClick(this.element)
        }
        getVideoUrl() {
            var Q = !0;
            switch (this.buttonType) {
            case 1:
                Q = !0;
                break;
            case 2:
                Q = !1
            }
            Q = this.U.getVideoUrl(Q, !1, !1, !0);
            const c = this.U.G();
            if (g.oc(c)) {
                const W = {};
                g.oc(c) && g.Dr(this.U, "addEmbedsConversionTrackingParams", [W]);
                Q = g.sJ(Q, W)
            }
            return Q
        }
        logVisibility() {
            this.U.logVisibility(this.element, this.OC && this.mF)
        }
        show() {
            super.show();
            this.logVisibility()
        }
        hide() {
            super.hide();
            this.logVisibility()
        }
        z7(Q) {
            super.z7(Q);
            this.logVisibility()
        }
    }
    ;
    var olv = class extends yY {
        constructor(Q) {
            super(Q, "watch-again-on-youtube-endscreen");
            this.watchButton = new TGi(Q);
            g.F(this, this.watchButton);
            this.watchButton.x0(this.element);
            g.D_O(Q) && (this.W = new g.kCD(Q),
            g.F(this, this.W),
            this.O = new g.k({
                C: "div",
                yC: ["ytp-watch-again-on-youtube-endscreen-more-videos-container"],
                N: {
                    tabIndex: "-1"
                },
                V: [this.W]
            }),
            g.F(this, this.O),
            this.W.x0(this.O.element),
            this.O.x0(this.element));
            Q.createClientVe(this.element, this, 156914);
            this.hide()
        }
        hasSuggestions() {
            return this.W?.hasSuggestions()
        }
        show() {
            if (this.player.getPlayerState() !== 3) {
                super.show();
                const c = this.O;
                if (c) {
                    var Q = this.W.hasSuggestions();
                    g.L(this.element, "ytp-shorts-branded-ui", Q);
                    Q ? c.show() : c.hide()
                }
                g.ip(this.player)?.vl(!0);
                this.player.logVisibility(this.element, !0);
                this.watchButton.z7(!0)
            }
        }
        hide() {
            super.hide();
            g.ip(this.player)?.vl(!1);
            this.player.logVisibility(this.element, !1);
            this.watchButton.z7(!1)
        }
    }
    ;
    g.GN("endscreen", class extends g.zj {
        constructor(Q) {
            super(Q);
            this.endScreen = null;
            this.W = this.O = !1;
            this.listeners = new g.db(this);
            g.F(this, this.listeners);
            const c = Q.G();
            Q.isEmbedsShortsMode() ? this.endScreen = new olv(Q) : kp9(Q) ? (this.O = !0,
            YB9(this),
            c.X("delhi_modern_endscreen") ? this.endScreen = new cQi(Q) : this.endScreen = new KEi(Q)) : c.qY ? this.endScreen = new WE9(Q) : this.endScreen = new yY(Q);
            g.F(this, this.endScreen);
            g.f8(Q, this.endScreen.element, 4);
            p_Z(this);
            this.listeners.B(Q, "videodatachange", this.onVideoDataChange, this);
            this.listeners.B(Q, g.Sr("endscreen"), W => {
                this.onCueRangeEnter(W)
            }
            );
            this.listeners.B(Q, g.FC("endscreen"), W => {
                this.onCueRangeExit(W)
            }
            )
        }
        B1() {
            var Q = this.player.getVideoData();
            const c = Q.mutedAutoplay && (Q.limitedPlaybackDurationInSeconds > 0 || Q.endSeconds > 0 || Q.mutedAutoplayDurationMode !== 2);
            if (this.player.isEmbedsShortsMode() && !c)
                return !0;
            var W = !(!Q?.mF() && !Q?.suggestions?.length);
            W = !kp9(this.player) || W;
            Q = Q.Bi;
            const m = this.player.Rv();
            return W && !Q && !m && !c
        }
        nx() {
            return this.endScreen.nx()
        }
        P3() {
            return this.nx() ? this.endScreen.S() : !1
        }
        WA() {
            this.player.qI("endscreen");
            super.WA()
        }
        load() {
            {
                const W = this.player.getVideoData()
                  , m = W.transitionEndpointAtEndOfStream;
                if (m && m.videoId) {
                    var Q = this.player.CO().Cx.get("heartbeat");
                    var c = W.mF();
                    !c || m.videoId !== c.videoId || W.Zd ? (this.player.SF(m.videoId, void 0, void 0, !0, !0, m),
                    Q && Q.JG("HEARTBEAT_ACTION_TRIGGER_AT_STREAM_END", "HEARTBEAT_ACTION_TRANSITION_REASON_HAS_NEW_STREAM_TRANSITION_ENDPOINT"),
                    Q = !0) : Q = !1
                } else
                    Q = !1
            }
            Q || (super.load(),
            this.endScreen.show())
        }
        unload() {
            super.unload();
            this.endScreen.hide();
            this.endScreen.destroy()
        }
        onCueRangeEnter(Q) {
            this.B1() && (this.endScreen.created || this.endScreen.create(),
            Q.getId() === "load" && this.load())
        }
        onCueRangeExit(Q) {
            Q.getId() === "load" && this.loaded && this.unload()
        }
        onVideoDataChange() {
            p_Z(this);
            this.O && YB9(this) && (this.endScreen && (this.endScreen.hide(),
            this.endScreen.created && this.endScreen.destroy(),
            this.endScreen.dispose()),
            this.endScreen = new KEi(this.player),
            g.F(this, this.endScreen),
            g.f8(this.player, this.endScreen.element, 4))
        }
    }
    );
}
)(_yt_player);
