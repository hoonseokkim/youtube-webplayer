(function(g) {
    var window = this;
    'use strict';
    var Mj9 = function(Q) {
        const c = g.B7(Q.player.getRootNode(), "ad-showing");
        g.L(Q.player.getRootNode(), "ytp-exp-fix-ad-miniplayer-controls-rendering", c);
        g.L(Q.element, "ytp-exp-fix-ad-miniplayer-controls-rendering", c);
        Q.zS && g.L(Q.zS.element, "ytp-exp-fix-ad-miniplayer-controls-rendering", c)
    }
      , JQS = function(Q, c) {
        g.L(Q.player.getRootNode(), "ytp-player-minimized", c)
    }
      , RKv = class extends g.k {
        constructor(Q, c) {
            super({
                C: "button",
                yC: ["ytp-miniplayer-expand-watch-page-button", "ytp-button", "ytp-miniplayer-button-top-left"],
                N: {
                    title: "{{title}}",
                    "data-tooltip-target-id": "ytp-miniplayer-expand-watch-page-button",
                    "aria-keyshortcuts": "i",
                    "data-title-no-tooltip": "{{data-title-no-tooltip}}"
                },
                V: [Q.X("delhi_modern_web_player_icons") ? {
                    C: "svg",
                    N: {
                        height: "24",
                        viewBox: "0 0 24 24",
                        width: "24"
                    },
                    V: [{
                        C: "path",
                        N: {
                            d: "M21.20 3.01C21.69 3.06 22.15 3.29 22.48 3.65C22.81 4.02 23.00 4.50 23 5V11H21V5H3V19H13V21H3L2.79 20.99C2.33 20.94 1.91 20.73 1.58 20.41C1.26 20.08 1.05 19.66 1.01 19.20L1 19V5C0.99 4.50 1.18 4.02 1.51 3.65C1.84 3.29 2.30 3.06 2.79 3.01L3 3H21L21.20 3.01ZM12.10 6.00L12 6H5L4.89 6.00C4.65 6.03 4.42 6.14 4.25 6.33C4.09 6.51 3.99 6.75 4 7V12L4.00 12.10C4.02 12.33 4.12 12.54 4.29 12.70C4.45 12.86 4.66 12.97 4.89 12.99L5 13H12L12.10 12.99C12.33 12.97 12.54 12.87 12.70 12.70C12.87 12.54 12.97 12.33 12.99 12.10L13 12V7C13.00 6.75 12.90 6.51 12.74 6.32C12.57 6.14 12.34 6.03 12.10 6.00ZM6 11V8H11V11H6ZM21 13H15V19C15 19.26 15.10 19.51 15.29 19.70C15.48 19.89 15.73 20 16 20C16.26 20 16.51 19.89 16.70 19.70C16.89 19.51 17 19.26 17 19V16.41L21.29 20.70C21.38 20.80 21.49 20.87 21.61 20.93C21.73 20.98 21.87 21.01 22.00 21.01C22.13 21.01 22.26 20.98 22.39 20.93C22.51 20.88 22.62 20.81 22.71 20.71C22.81 20.62 22.88 20.51 22.93 20.39C22.98 20.26 23.01 20.13 23.01 20.00C23.01 19.87 22.98 19.73 22.93 19.61C22.87 19.49 22.80 19.38 22.70 19.29L18.41 15H21C21.26 15 21.51 14.89 21.70 14.70C21.89 14.51 22 14.26 22 14C22 13.73 21.89 13.48 21.70 13.29C21.51 13.10 21.26 13 21 13Z",
                            fill: "white"
                        }
                    }]
                } : {
                    C: "svg",
                    N: {
                        height: "24px",
                        version: "1.1",
                        viewBox: "0 0 24 24",
                        width: "24px"
                    },
                    V: [{
                        C: "g",
                        N: {
                            fill: "none",
                            "fill-rule": "evenodd",
                            stroke: "none",
                            "stroke-width": "1"
                        },
                        V: [{
                            C: "g",
                            N: {
                                transform: "translate(12.000000, 12.000000) scale(-1, 1) translate(-12.000000, -12.000000) "
                            },
                            V: [{
                                C: "path",
                                N: {
                                    d: "M19,19 L5,19 L5,5 L12,5 L12,3 L5,3 C3.89,3 3,3.9 3,5 L3,19 C3,20.1 3.89,21 5,21 L19,21 C20.1,21 21,20.1 21,19 L21,12 L19,12 L19,19 Z M14,3 L14,5 L17.59,5 L7.76,14.83 L9.17,16.24 L19,6.41 L19,10 L21,10 L21,3 L14,3 Z",
                                    fill: "#fff",
                                    "fill-rule": "nonzero"
                                }
                            }]
                        }]
                    }]
                }]
            });
            this.U = Q;
            this.listen("click", this.onClick, this);
            this.updateValue("title", g.sP(Q, "Expand", "i"));
            this.update({
                "data-title-no-tooltip": "Expand"
            });
            this.addOnDisposeCallback(g.Zr(c.d6(), this.element))
        }
        onClick() {
            g.xt(this.U, "onExpandMiniplayer")
        }
    }
    ;
    var kO9 = class extends g.k {
        constructor(Q) {
            super({
                C: "div",
                Z: "ytp-miniplayer-ui"
            });
            this.D = this.j = !1;
            this.Rk = {
                zS: () => this.zS,
                B6: c => {
                    this.B6(c)
                }
                ,
                VB: () => this.VB,
                nextButton: () => this.nextButton,
                Yy: () => this.Yy
            };
            this.player = Q;
            this.B(Q, "minimized", this.Qf);
            this.B(Q, "onStateChange", this.B6);
            this.B(Q, "documentpictureinpicturechange", this.S)
        }
        show() {
            this.W = new g.T5(this.L,null,this);
            this.W.start();
            if (!this.j) {
                this.tooltip = new g.Q_S(this.player,this);
                g.F(this, this.tooltip);
                g.f8(this.player, this.tooltip.element, 4);
                this.tooltip.scale = .6;
                this.r6 = new g.Lp1(this.player);
                g.F(this, this.r6);
                this.progressBar = new g.ZRD(this.player,this);
                g.F(this, this.progressBar);
                g.f8(this.player, this.progressBar.element, 4);
                this.O = new g.k({
                    C: "div",
                    Z: "ytp-miniplayer-scrim"
                });
                g.F(this, this.O);
                this.O.x0(this.element);
                this.B(this.O.element, "click", this.J);
                var Q = new g.k({
                    C: "button",
                    yC: ["ytp-miniplayer-close-button", "ytp-button"],
                    N: {
                        "aria-label": "Close"
                    },
                    V: [g.e_()]
                });
                g.F(this, Q);
                Q.x0(this.O.element);
                this.B(Q.element, "click", this.K);
                Q = new RKv(this.player,this);
                g.F(this, Q);
                Q.x0(this.O.element);
                this.A = new g.k({
                    C: "div",
                    Z: "ytp-miniplayer-controls"
                });
                g.F(this, this.A);
                this.A.x0(this.O.element);
                this.B(this.A.element, "click", this.J);
                var c = new g.k({
                    C: "div",
                    Z: "ytp-miniplayer-button-container"
                });
                g.F(this, c);
                c.x0(this.A.element);
                Q = new g.k({
                    C: "div",
                    Z: "ytp-miniplayer-play-button-container"
                });
                g.F(this, Q);
                Q.x0(this.A.element);
                const W = new g.k({
                    C: "div",
                    Z: "ytp-miniplayer-button-container"
                });
                g.F(this, W);
                W.x0(this.A.element);
                this.VB = new g.pi(this.player,this,!1);
                g.F(this, this.VB);
                this.VB.x0(c.element);
                c = new g.yP1(this.player,this);
                g.F(this, c);
                c.x0(Q.element);
                this.nextButton = new g.pi(this.player,this,!0);
                g.F(this, this.nextButton);
                this.nextButton.x0(W.element);
                this.Yy = new g.MSo(this.player,this,0);
                g.F(this, this.Yy);
                this.Yy.x0(this.O.element);
                this.zS = new g.k({
                    C: "div",
                    Z: "ytp-miniplayer-buttons"
                });
                g.F(this, this.zS);
                g.f8(this.player, this.zS.element, 4);
                Q = new g.k({
                    C: "button",
                    yC: ["ytp-miniplayer-close-button", "ytp-button"],
                    N: {
                        "aria-label": "Close"
                    },
                    V: [g.e_()]
                });
                g.F(this, Q);
                Q.x0(this.zS.element);
                this.B(Q.element, "click", this.K);
                Q = new g.k({
                    C: "button",
                    yC: ["ytp-miniplayer-replay-button", "ytp-button"],
                    N: {
                        "aria-label": "Close"
                    },
                    V: [g.NQ()]
                });
                g.F(this, Q);
                Q.x0(this.zS.element);
                this.B(Q.element, "click", this.b0);
                Q = new RKv(this.player,this);
                g.F(this, Q);
                Q.x0(this.zS.element);
                this.B(this.player, "presentingplayerstatechange", this.Y);
                this.B(this.player, "appresize", this.b3);
                this.B(this.player, "fullscreentoggled", this.b3);
                this.player.X("fix_ad_miniplayer_controls_rendering") && Mj9(this);
                this.b3();
                this.j = !0
            }
            this.player.getPlayerState() !== 0 && super.show();
            this.progressBar.show();
            this.player.unloadModule("annotations_module")
        }
        hide() {
            this.W && (this.W.dispose(),
            this.W = void 0);
            super.hide();
            this.player.isMinimized() || (this.j && this.progressBar.hide(),
            this.player.loadModule("annotations_module"))
        }
        WA() {
            this.W && (this.W.dispose(),
            this.W = void 0);
            super.WA()
        }
        K() {
            this.player.X("kevlar_watch_while_v2") || this.player.stopVideo();
            g.xt(this.player, "onCloseMiniplayer")
        }
        b0() {
            this.player.playVideo()
        }
        J(Q) {
            if (Q.target === this.O.element || Q.target === this.A.element)
                this.player.getPlayerStateObject().isOrWillBePlaying() ? this.player.pauseVideo() : this.player.playVideo()
        }
        Qf() {
            JQS(this, this.player.isMinimized())
        }
        S() {
            JQS(this, this.player.Zh());
            g.L(this.player.getRootNode(), "ytp-player-document-picture-in-picture", this.player.Zh());
            this.D = this.player.Zh()
        }
        onProgress() {
            this.progressBar.kx();
            this.Yy.kx()
        }
        L() {
            this.onProgress();
            this.W && this.W.start()
        }
        Y(Q) {
            Q.state.W(32) && this.tooltip.hide()
        }
        b3() {
            const Q = this.player.bX().getPlayerSize().width;
            g.CA7(this.progressBar, 0, Q, !1);
            g.oi(this.progressBar)
        }
        B6(Q) {
            this.player.X("fix_ad_miniplayer_controls_rendering") && Mj9(this);
            if (this.player.isMinimized() || this.player.X("web_watch_pip") && this.D)
                Q === 0 ? this.hide() : this.show()
        }
        d6() {
            return this.tooltip
        }
        wS(Q, c, W, m, K) {
            var T = 0
              , r = 0
              , U = 0
              , I = g.A4(Q);
            m = c && (g.B7(c, "ytp-prev-button") || g.B7(c, "ytp-next-button"));
            if (c) {
                W = g.B7(c, "ytp-play-button");
                const X = g.B7(c, "ytp-miniplayer-expand-watch-page-button");
                m ? T = U = 12 : W ? (c = g.Ia(c, this.element),
                U = c.x,
                T = c.y - 12) : X && (U = g.B7(c, "ytp-miniplayer-button-top-left"),
                T = g.Ia(c, this.element),
                c = g.A4(c),
                U ? (U = 8,
                T = T.y + 40) : (U = T.x - I.width + c.width,
                T = T.y - 20))
            } else
                U = W - I.width / 2,
                r = 25 + (K || 0);
            c = this.player.bX().getPlayerSize();
            K = T + (K || 0);
            I = g.lm(U, 0, c.width - I.width - 12);
            K ? (Q.style.top = `${K}px`,
            Q.style.bottom = "") : (Q.style.top = "",
            Q.style.bottom = `${r}px`);
            Q.style.left = `${I}px`;
            r = g.B7(Q, "ytp-preview");
            Q.style.visibility = m && r && c.height < 225 ? "hidden" : ""
        }
    }
    ;
    g.GN("miniplayer", class extends g.zj {
        constructor(Q) {
            super(Q);
            this.O = new g.db(this);
            this.W = new kO9(this.player);
            this.W.hide();
            g.f8(this.player, this.W.element, 4);
            Q.isMinimized() && (this.load(),
            g.L(Q.getRootNode(), "ytp-player-minimized", !0))
        }
        onVideoDataChange() {
            if (this.player.getVideoData()) {
                var Q = this.player.getVideoAspectRatio()
                  , c = 16 / 9;
                Q = Q > c + .1 || Q < c - .1;
                g.L(this.player.getRootNode(), "ytp-rounded-miniplayer-not-regular-wide-video", Q)
            }
        }
        create() {
            super.create();
            this.O.B(this.player, "videodatachange", this.onVideoDataChange);
            this.onVideoDataChange()
        }
        GS() {
            return !1
        }
        load() {
            this.player.hideControls();
            this.W.show()
        }
        unload() {
            this.player.showControls();
            this.W.hide()
        }
    }
    );
}
)(_yt_player);
