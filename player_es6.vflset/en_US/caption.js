(function(g) {
    var window = this;
    'use strict';
    var EJo = async function(Q, c, W) {
        Q.O = g.Wn(c, W)
    }
      , DG = function(Q) {
        Q.isActive() || Q.start()
    }
      , sUa = function(Q, c) {
        const W = new g.zz;
        W.languageCode = Q.languageCode;
        W.languageName = Q.languageName;
        W.name = Q.name;
        W.displayName = Q.displayName;
        W.kind = Q.kind;
        W.isDefault = !1;
        W.W = Q.W;
        W.isTranslateable = Q.isTranslateable;
        W.vssId = Q.vssId;
        W.url = Q.url;
        W.translationLanguage = c;
        Q.xtags && (W.xtags = Q.xtags);
        Q.captionId && (W.captionId = Q.captionId);
        return W
    }
      , tu = function(Q, c) {
        return c ? Q.captionsInitialState : "CAPTIONS_INITIAL_STATE_UNKNOWN"
    }
      , dSm = function(Q) {
        return g.rT(Q) || Q.X("web_enable_caption_language_preference_stickiness")
    }
      , LSS = async function(Q, c) {
        Q = Q + "|" + c;
        c = await g.AD();
        if (!c)
            throw g.$s("gct");
        return (await g.T3(c)).get("captions", Q)
    }
      , wW1 = function(Q, c, W) {
        LSS(Q, c).then(m => {
            m && W(m.trackData, new g.zz(m.metadata))
        }
        )
    }
      , HA = function(Q) {
        if (!b3o.test(Q))
            throw Error("'" + Q + "' is not a valid hex color");
        Q.length == 4 && (Q = Q.replace(jU4, "#$1$1$2$2$3$3"));
        Q = Q.toLowerCase();
        Q = parseInt(Q.slice(1), 16);
        return [Q >> 16, Q >> 8 & 255, Q & 255]
    }
      , gJS = function() {
        var Q = {};
        let c = "suggest_correction"in g.Ge ? g.Ge.suggest_correction : "Edit caption";
        c = c || "";
        for (let W in Q) {
            const m = () => String(Q[W]);
            c = c.replace(new RegExp("\\$\\{" + W + "\\}","gi"), m);
            c = c.replace(new RegExp("\\$" + W,"gi"), m)
        }
        return c
    }
      , NC = function() {
        return g.UM("yt-player-caption-display-settings")
    }
      , O3o = function(Q, c) {
        let W = g.H9(Q.segments, c);
        W >= 0 || W < 0 && (-W - 1) % 2 === 1 || (W = -W - 1,
        W > 0 && c - Q.segments[W - 1] === 1 && W < Q.segments.length && Q.segments[W] - c === 1 ? (g.Ta(Q.segments, W),
        g.Ta(Q.segments, W - 1)) : W > 0 && c - Q.segments[W - 1] === 1 ? Q.segments[W - 1] = c : W < Q.segments.length && Q.segments[W] - c === 1 ? Q.segments[W] = c : (g.q9(Q.segments, W, 0, c),
        g.q9(Q.segments, W + 1, 0, c)))
    }
      , fYi = function(Q) {
        return Q.W && Q.W.K ? Q.W.K + Q.player.NQ() < Q.player.getCurrentTime() : !1
    }
      , vJ0 = function(Q, c) {
        if (Q.policy.q$ && Q.player.tp()) {
            var W = g.Pd(c, Q.policy, {});
            W.set("pot", Q.player.tp());
            W = W.Lk()
        } else
            W = g.Pd(c, Q.policy, {}).Lk();
        const m = {
            format: "RAW",
            withCredentials: !0
        };
        if (Q.policy.Ka) {
            m.method = "POST";
            const r = c.j;
            r && Object.keys(r).length > 0 ? m.postBody = g.yu(r, g.yc) : m.postBody = (0,
            g.t6)([120, 0])
        }
        Q.K && (m.responseType = "arraybuffer");
        let K = ++Q.b0;
        const T = (0,
        g.h)();
        Q.O = g.o2(W, m, 3, 100, -1, r => {
            r.errorCode === "net.timeout" && Q.player.tJ("capnt", {
                rn: K++
            })
        }
        ).then(r => {
            if (Q.policy.W0 && K % 100 === 1) {
                var U = (0,
                g.h)();
                Q.player.tJ("caprsp", {
                    rn: K,
                    ms: U - T,
                    kb: (r.xhr.responseText.length / 1024).toFixed()
                })
            }
            a: {
                r = r.xhr;
                Q.u0();
                if (Q.A) {
                    var I = !(Q.K ? r.response : r.responseText) || r.status >= 400;
                    if (U = g.oh7(r)) {
                        r = g.Pd(Q.A, Q.policy, {});
                        Q.A.jZ(r, U);
                        vJ0(Q, Q.A);
                        break a
                    }
                    I ? Q.player.tJ("capfail", {
                        status: r.status
                    }) : (g.N5("fcb_r", (0,
                    g.h)(), Q.player.getVideoData()?.Y || ""),
                    U = Q.A.eh[0],
                    I = U.DF,
                    Q.L != null && Q.D !== I && (Q.K ? Q.L(r.response, (U.startTime + Q.player.NQ()) * 1E3) : Q.L(r.responseText, (U.startTime + Q.player.NQ()) * 1E3),
                    Q.D = I))
                }
                Q.A = null;
                Q.O = null
            }
        }
        ).fF(r => {
            Q.A = null;
            Q.O = null;
            Q.player.tJ("capfail", {
                rn: K,
                status: r.xhr?.status
            })
        }
        );
        Q.A = c;
        O3o(Q.j, Q.A.eh[0].DF)
    }
      , aYD = function(Q, c) {
        return c != null && c in Q.O.W ? Q.O.W[c] : null
    }
      , G01 = function(Q, c, W) {
        const m = [];
        for (const K in Q.O.W) {
            if (!Q.O.W.hasOwnProperty(K))
                continue;
            const T = Q.O.W[K];
            if (g.l2(T, W || null)) {
                const r = T.info.captionTrack;
                r && r.languageCode === c && m.push(T)
            }
        }
        return m.length ? m[0] : null
    }
      , P6a = function(Q, c) {
        const W = [];
        for (const K in Q.O.W) {
            if (!Q.O.W.hasOwnProperty(K))
                continue;
            var m = Q.O.W[K];
            if (g.l2(m, c || null)) {
                let T = m.info.id
                  , r = T
                  , U = `.${T}`
                  , I = ""
                  , X = "";
                if (m = m.info.captionTrack)
                    T = m.languageCode,
                    r = m.displayName,
                    U = m.vssId,
                    I = m.kind,
                    X = m.id;
                else {
                    {
                        m = T;
                        let A = g.NTm.get(m);
                        A == null && (A = $S0[m] || $S0[m.replace(/-/g, "_")],
                        g.NTm.set(m, A));
                        m = A
                    }
                    r = m || r
                }
                W.push(new g.zz({
                    id: K,
                    languageCode: T,
                    languageName: r,
                    is_servable: !0,
                    is_default: !0,
                    is_translateable: !1,
                    vss_id: U,
                    kind: I,
                    captionId: X
                }))
            }
        }
        return W
    }
      , lYi = function(Q, c, W, m) {
        let K = c / 360 * 16;
        c >= Q && (Q = 640,
        m > W * 1.3 && (Q = 480),
        K = W / Q * 16);
        return K
    }
      , umm = function(Q) {
        let c = 1 + .25 * (Q.fontSizeIncrement || 0);
        if (Q.offset === 0 || Q.offset === 2)
            c *= .8;
        return c
    }
      , h1D = function(Q, c) {
        let W = "vertical-rl";
        Q.W.Yb === 1 && (W = "vertical-lr");
        g.Fr && (W = W === "vertical-lr" ? "tb-lr" : "tb-rl");
        g.JA(c, "-o-writing-mode", W);
        g.JA(c, "-webkit-writing-mode", W);
        g.JA(c, "writing-mode", W);
        g.JA(c, "text-orientation", "upright");
        g.xK(c, "ytp-vertical-caption");
        Q.O.params.oI === 3 && (g.JA(c, "text-orientation", ""),
        g.JA(c, "transform", "rotate(180deg)"))
    }
      , z1m = function(Q, c) {
        const W = {};
        var m = c.background ? c.background : Q.W.T1.background;
        if (c.backgroundOpacity != null || c.background) {
            var K = c.backgroundOpacity != null ? c.backgroundOpacity : Q.W.T1.backgroundOpacity;
            m = HA(m);
            W.background = "rgba(" + m[0] + "," + m[1] + "," + m[2] + "," + K + ")";
            Q.nO && (W["box-decoration-break"] = "clone",
            W["border-radius"] = `${Q.HA / 8}px`)
        }
        if (c.fontSizeIncrement != null || c.offset != null)
            W["font-size"] = `${Q.JJ * umm(c)}px`;
        m = 1;
        K = c.color || Q.W.T1.color;
        if (c.color || c.textOpacity != null)
            K = HA(K),
            m = c.textOpacity == null ? Q.W.T1.textOpacity : c.textOpacity,
            K = "rgba(" + K[0] + "," + K[1] + "," + K[2] + "," + m + ")",
            W.color = K,
            W.fill = K;
        var T = c.charEdgeStyle;
        T === 0 && (T = void 0);
        if (T) {
            K = `rgba(34, 34, 34, ${m})`;
            let I = `rgba(204, 204, 204, ${m})`;
            c.Xf && (I = K = c.Xf);
            const X = Q.JJ / 16 / 2
              , A = Math.max(X, 1);
            var r = Math.max(2 * X, 1)
              , U = Math.max(3 * X, 1);
            const e = Math.max(5 * X, 1);
            m = [];
            switch (T) {
            case 4:
                for (; U <= e; U += X)
                    m.push(`${r}px ${r}px ${U}px ${K}`);
                break;
            case 1:
                r = window.devicePixelRatio >= 2 ? .5 : 1;
                for (T = A; T <= U; T += r)
                    m.push(`${T}px ${T}px ${K}`);
                break;
            case 2:
                m.push(`${A}px ${A}px ${I}`);
                m.push(`-${A}px -${A}px ${K}`);
                break;
            case 3:
                for (U = 0; U < 5; U++)
                    m.push(`0 0 ${r}px ${K}`)
            }
            W["text-shadow"] = m.join(", ")
        }
        K = "";
        switch (c.fontFamily) {
        case 1:
            K = '"Courier New", Courier, "Nimbus Mono L", "Cutive Mono", monospace';
            break;
        case 2:
            K = '"Times New Roman", Times, Georgia, Cambria, "PT Serif Caption", serif';
            break;
        case 3:
            K = '"Deja Vu Sans Mono", "Lucida Console", Monaco, Consolas, "PT Mono", monospace';
            break;
        case 5:
            K = '"Comic Sans MS", Impact, Handlee, fantasy';
            break;
        case 6:
            K = '"Monotype Corsiva", "URW Chancery L", "Apple Chancery", "Dancing Script", cursive';
            break;
        case 7:
            K = g.i0() ? '"Carrois Gothic SC", sans-serif-smallcaps' : 'Arial, Helvetica, Verdana, "Marcellus SC", sans-serif';
            break;
        case 0:
        case 4:
            K = '"YouTube Noto", Roboto, Arial, Helvetica, Verdana, "PT Sans Caption", sans-serif'
        }
        K && (W["font-family"] = K);
        K = c.offset;
        K == null && (K = Q.W.T1.offset);
        switch (K) {
        case 0:
            W["vertical-align"] = "sub";
            break;
        case 2:
            W["vertical-align"] = "super"
        }
        c.fontFamily === 7 && (W["font-variant"] = "small-caps");
        c.bold && (W["font-weight"] = "bold");
        c.italic && (W["font-style"] = "italic");
        c.underline && (W["text-decoration"] = "underline");
        c.iH && (W.visibility = "hidden");
        c.QK === 1 && Q.j && (W["text-combine-upright"] = "all",
        W["text-orientation"] = "mixed",
        K = g.LD || g.v8,
        Q.O.params.oI === 3 ? W.transform = K ? "rotate(90deg)" : "rotate(180deg)" : K && (W.transform = "rotate(-90deg)"));
        if (c.textEmphasis === 1 || c.textEmphasis === 2 || c.textEmphasis === 3 || c.textEmphasis === 4 || c.textEmphasis === 5)
            if (g.LD)
                W["font-weight"] = "bold";
            else
                switch (W["text-emphasis-style"] = "filled circle",
                W["text-emphasis-color"] = "currentcolor",
                W["webkit-text-emphasis"] = "filled circle",
                c.textEmphasis) {
                case 4:
                case 3:
                    W["text-emphasis-position"] = "under left";
                    W["webkit-text-emphasis-position"] = "under left";
                    break;
                case 5:
                case 2:
                    W["text-emphasis-position"] = "over right",
                    W["webkit-text-emphasis-position"] = "over right"
                }
        return W
    }
      , i9 = function(Q) {
        Q = Q.split("px");
        return Q.length > 0 ? (Q = Number(Q[0])) ? Q : 0 : 0
    }
      , JCi = function(Q, c, W) {
        Q.Ka = Q.Ka || !!W;
        const m = {};
        Object.assign(m, Q.W.T1);
        Object.assign(m, W || c.W);
        Object.assign(m, Q.u3.T1);
        (W = !Q.J) && C64(Q);
        let K = Q.jG && Q.PA && g.hH(m, Q.PA) ? Q.jG : MWv(Q, m);
        const T = typeof c.text === "string"
          , r = T ? c.text.split("\n") : [c.text];
        for (let I = 0; I < r.length; I++) {
            var U = I > 0 || !c.append;
            const X = r[I];
            U && !W ? (C64(Q),
            K = MWv(Q, m)) : U && W && (W = !1);
            X && (K.appendChild(T ? g.Nn(X) : X),
            T || X.tagName !== "RUBY" || X.childElementCount !== 4 || g.LD || !g.ps(X.children[2], "text-emphasis") || (U = Q.j ? "padding-right" : "padding-top",
            g.ps(X.children[2], "text-emphasis-position") && (U = Q.j ? "padding-left" : "padding-bottom"),
            g.xG ? g.JA(K, U, "1em") : g.JA(K, U, "0.5em")))
        }
        Q.PA = m;
        Q.jG = K;
        Q.D.push(c)
    }
      , C64 = function(Q) {
        Q.J = g.HB("SPAN");
        g.JA(Q.J, {
            display: "block"
        });
        g.xK(Q.J, "caption-visual-line");
        Q.A.appendChild(Q.J)
    }
      , MWv = function(Q, c) {
        const W = g.HB("SPAN");
        g.JA(W, {
            display: "inline-block",
            "white-space": "pre-wrap"
        });
        g.JA(W, z1m(Q, c));
        W.classList.add("ytp-caption-segment");
        Q.J.appendChild(W);
        W.previousElementSibling && (g.JA(W.previousElementSibling, {
            "border-top-right-radius": "0",
            "border-bottom-right-radius": "0"
        }),
        g.JA(W, {
            "border-top-left-radius": "0",
            "border-bottom-left-radius": "0"
        }));
        return W
    }
      , k01 = function(Q, c, W) {
        if (Q === 255 && c === 255 || !Q && !c)
            return {
                JD: Q,
                CY: c,
                result: 0
            };
        Q = R19[Q];
        c = R19[c];
        if (Q & 128) {
            var m;
            if (m = !(c & 128))
                m = c,
                m = W.Xq() && W.CY === m;
            if (m)
                return {
                    JD: Q,
                    CY: c,
                    result: 1
                }
        } else if (c & 128 && 1 <= Q && Q <= 31)
            return {
                JD: Q,
                CY: c,
                result: 2
            };
        return {
            JD: Q,
            CY: c,
            result: 3
        }
    }
      , pWo = function(Q, c, W, m) {
        c === 255 && W === 255 || !c && !W ? (++Q.A === 45 && Q.reset(),
        Q.j.O.clear(),
        Q.K.O.clear()) : (Q.A = 0,
        Yg1(Q.j, c, W, m))
    }
      , Q6a = function(Q, c) {
        Q.W.sort( (W, m) => {
            const K = W.time - m.time;
            return K === 0 ? W.order - m.order : K
        }
        );
        for (const W of Q.W)
            Q.time = W.time,
            W.type === 0 ? pWo(Q, W.gZ, W.H2, c) : W.type === 1 && Q.O & 496 && Yg1(Q.K, W.gZ, W.H2, c);
        Q.W.length = 0
    }
      , TDS = function(Q, c) {
        switch (Q) {
        case 0:
            return csZ[(c & 127) - 32];
        case 1:
            return W44[c & 15];
        case 2:
            return myo[c & 31];
        case 3:
            return K4H[c & 31]
        }
        return 0
    }
      , yX = function(Q, c) {
        if (Q.style.type === 3) {
            var W = 0
              , m = 0
              , K = Q.K.time + 0
              , T = ""
              , r = ""
              , U = K;
            for (var I = 1; I <= 15; ++I) {
                var X = !1;
                for (var A = m ? m : 1; A <= 32; ++A) {
                    var e = Q.A[I][A];
                    if (e.W !== 0) {
                        W === 0 && (W = I,
                        m = A);
                        X = String.fromCharCode(e.W);
                        var V = e.timestamp;
                        V < K && (K = V);
                        e.timestamp = U;
                        r && (T += r,
                        r = "");
                        T += X;
                        X = !0
                    }
                    if ((e.W === 0 || A === 32) && X) {
                        r = "\n";
                        break
                    } else if (m && !X)
                        break
                }
                if (W && !X)
                    break
            }
            T && c.j(W, m, K, U, T)
        } else
            for (m = W = 0,
            T = K = Q.K.time + 0,
            r = 1; r <= 15; ++r)
                for (U = "",
                I = 1; I <= 32; ++I)
                    if (A = Q.A[r][I],
                    e = A.W,
                    e !== 0 && (W === 0 && (W = r,
                    m = I),
                    X = String.fromCharCode(e),
                    V = A.timestamp,
                    V <= K && (K = V),
                    U += X,
                    A.reset()),
                    I === 32 || e === 0)
                        U && c.j(W, m, K, T, U),
                        K = T,
                        U = "",
                        m = W = 0
    }
      , SO = function(Q) {
        return Q.A[Q.row][Q.O]
    }
      , F8 = function(Q, c, W) {
        c >= 2 && Q.O > 1 && (--Q.O,
        SO(Q).W = 0);
        const m = SO(Q);
        m.timestamp = Q.K.time + 0;
        m.W = TDS(c, W);
        Q.O < 32 && Q.O++
    }
      , oH9 = function(Q, c, W, m) {
        for (let r = 0; r < m; r++)
            for (let U = 0; U <= 32; U++) {
                var K = Q.A[c + r][U]
                  , T = Q.A[W + r][U];
                K.W = T.W;
                K.timestamp = T.timestamp
            }
    }
      , ZG = function(Q, c, W) {
        for (let m = 0; m < W; m++)
            for (let K = 0; K <= 32; K++)
                Q.A[c + m][K].reset()
    }
      , Er = function(Q) {
        Q.row = Q.W > 0 ? Q.W : 1;
        Q.O = 1;
        ZG(Q, 0, 15)
    }
      , rsv = function(Q) {
        Q.style.set(1);
        Q.W = Q.j;
        Q.W.W = 0;
        Q.W.style = Q.style;
        Q.A.mode = 1 << Q.W.j
    }
      , sr = function(Q, c, W) {
        const m = Q.O;
        let K = !1;
        switch (Q.style.get()) {
        case 4:
        case 1:
        case 2:
            Q.style.get() === 4 && m.W > 0 || (yX(m, W),
            Er(Q.O),
            Er(Q.j),
            m.row = 15,
            m.W = c,
            K = !0)
        }
        Q.style.set(3);
        Q.W = m;
        Q.W.style = Q.style;
        Q.A.mode = 1 << m.j;
        K ? m.O = 1 : m.W !== c && (m.W > c ? (yX(m, W),
        ZG(m, m.row - m.W, c)) : m.row < c && (c = m.W),
        m.W = c)
    }
      , Uya = function(Q) {
        Q.style.set(4);
        Q.W = Q.text;
        Q.W.style = Q.style;
        Q.A.mode = 1 << Q.W.j
    }
      , Yg1 = function(Q, c, W, m) {
        Q.O.update();
        c = k01(c, W, Q.O);
        switch (c.result) {
        case 0:
            return;
        case 1:
        case 2:
            return
        }
        var K = c.JD;
        c = c.CY;
        if (32 <= K || !K)
            Q.W.mode & Q.W.O && (W = K,
            W & 128 && (W = 127),
            c & 128 && (c = 127),
            Q = Q.j.W,
            W & 96 && F8(Q, 0, W),
            c & 96 && F8(Q, 0, c),
            W !== 0 && c !== 0 && Q.style.type === 3 && yX(Q, m));
        else if (K & 16)
            a: if (!Q.O.matches(K, c) && (W = Q.O,
            W.JD = K,
            W.CY = c,
            W.state = 2,
            W = K & 8 ? Q.D : Q.A,
            Q.j = W,
            Q.W.mode = 1 << (Q.K << 2) + (W.K << 1) + (W.style.type === 4 ? 1 : 0),
            (Q.W.mode | 1 << (Q.K << 2) + (W.K << 1) + (W.style.type !== 4 ? 1 : 0)) & Q.W.O))
                if (c & 64) {
                    m = [11, 11, 1, 2, 3, 4, 12, 13, 14, 15, 5, 6, 7, 8, 9, 10][(K & 7) << 1 | c >> 5 & 1];
                    Q = c & 16 ? ((c & 14) >> 1) * 4 : 0;
                    c = W.W;
                    switch (W.style.get()) {
                    case 4:
                        m = c.row;
                        break;
                    case 3:
                        if (m !== c.row) {
                            if (m < c.W && (m = c.W,
                            m === c.row))
                                break;
                            var T = 1 + c.row - c.W;
                            const r = 1 + m - c.W;
                            oH9(c, r, T, c.W);
                            W = T;
                            K = c.W;
                            r < T ? (T = r + K - T,
                            T > 0 && (W += T,
                            K -= T)) : (T = T + K - r,
                            T > 0 && (K -= T));
                            ZG(c, W, K)
                        }
                    }
                    c.row = m;
                    c.O = Q + 1
                } else
                    switch (K & 7) {
                    case 1:
                        switch (c & 112) {
                        case 32:
                            F8(W.W, 0, 32);
                            break a;
                        case 48:
                            c === 57 ? (m = W.W,
                            SO(m).W = 0,
                            m.O < 32 && m.O++) : F8(W.W, 1, c & 15)
                        }
                        break;
                    case 2:
                        c & 32 && F8(W.W, 2, c & 31);
                        break;
                    case 3:
                        c & 32 && F8(W.W, 3, c & 31);
                        break;
                    case 4:
                    case 5:
                        if (32 <= c && c <= 47)
                            switch (c) {
                            case 32:
                                rsv(W);
                                break;
                            case 33:
                                m = W.W;
                                m.O > 1 && (--m.O,
                                SO(m).W = 0);
                                break;
                            case 36:
                                m = W.W;
                                Q = SO(m);
                                for (c = 0; c <= 15; c++)
                                    for (W = 0; W <= 32; W++)
                                        if (m.A[c][W] === Q) {
                                            for (; W <= 32; W++)
                                                m.A[c][W].reset();
                                            break
                                        }
                                break;
                            case 37:
                                sr(W, 2, m);
                                break;
                            case 38:
                                sr(W, 3, m);
                                break;
                            case 39:
                                sr(W, 4, m);
                                break;
                            case 40:
                                F8(W.W, 0, 32);
                                break;
                            case 41:
                                m = W;
                                m.style.set(2);
                                m.W = m.O;
                                m.W.W = 0;
                                m.W.style = m.style;
                                m.A.mode = 1 << m.W.j;
                                break;
                            case 42:
                                m = W;
                                Q = m.text;
                                Q.W = 15;
                                Q.style.set(4);
                                Er(Q);
                                Uya(m);
                                break;
                            case 43:
                                Uya(W);
                                break;
                            case 44:
                                Q = W;
                                c = Q.O;
                                switch (Q.style.get()) {
                                case 1:
                                case 2:
                                case 3:
                                    yX(c, m)
                                }
                                ZG(c, 0, 15);
                                break;
                            case 45:
                                b: {
                                    c = W;
                                    Q = c.W;
                                    switch (c.style.get()) {
                                    default:
                                    case 2:
                                    case 1:
                                        break b;
                                    case 4:
                                        if (Q.row < 15) {
                                            ++Q.row;
                                            Q.O = 1;
                                            break b
                                        }
                                        break;
                                    case 3:
                                    }
                                    Q.W < 2 && (Q.W = 2,
                                    Q.row < Q.W && (Q.row = Q.W));
                                    c = Q.row - Q.W + 1;
                                    yX(Q, m);
                                    oH9(Q, c, c + 1, Q.W - 1);
                                    ZG(Q, Q.row, 1)
                                }
                                break;
                            case 46:
                                ZG(W.j, 0, 15);
                                break;
                            case 47:
                                Q = W,
                                yX(Q.O, m),
                                Q.j.updateTime(Q.A.time + 0),
                                m = Q.j,
                                Q.j = Q.O,
                                Q.O = m,
                                rsv(Q)
                            }
                        break;
                    case 7:
                        switch (c) {
                        case 33:
                        case 34:
                        case 35:
                            m = W.W,
                            (m.O += c & 3) > 32 && (m.O = 32)
                        }
                    }
    }
      , Xw4 = function(Q, c, W, m, K, T, r) {
        var U = T[0];
        let I = r[U.getAttribute("p")];
        if (I.AQ === 1) {
            var X = T[1]
              , A = T[2];
            T = T[3];
            U.getAttribute("t");
            X.getAttribute("t");
            A.getAttribute("t");
            T.getAttribute("t");
            U.getAttribute("p");
            X.getAttribute("p");
            T.getAttribute("p");
            r = r[A.getAttribute("p")];
            U = IcH(U.textContent, X.textContent, A.textContent, T.textContent, r);
            return new dE(Q,c,K,W,U,m,I)
        }
        switch (I.AQ) {
        case 9:
        case 10:
            I.textEmphasis = 1;
            break;
        case 11:
            I.textEmphasis = 2;
            break;
        case 12:
            I.textEmphasis = 3;
            break;
        case 13:
            I.textEmphasis = 4;
            break;
        case 14:
            I.textEmphasis = 5
        }
        return new dE(Q,c,K,W,U.textContent || "",m,I)
    }
      , IcH = function(Q, c, W, m, K) {
        var T = g.i0();
        const r = T ? g.HB("DIV") : g.HB("RUBY")
          , U = g.HB("SPAN");
        U.textContent = Q;
        r.appendChild(U);
        Q = T ? g.HB("DIV") : g.HB("RP");
        Q.textContent = c;
        r.appendChild(Q);
        c = T ? g.HB("DIV") : g.HB("RT");
        c.textContent = W;
        r.appendChild(c);
        W = K.AQ;
        if (W === 10 || W === 11 || W === 12 || W === 13 || W === 14)
            if (g.JA(c, "text-emphasis-style", "filled circle"),
            g.JA(c, "text-emphasis-color", "currentcolor"),
            g.JA(c, "webkit-text-emphasis", "filled circle"),
            K.AQ === 11 || K.AQ === 13)
                g.JA(c, "webkit-text-emphasis-position", "under left"),
                g.JA(c, "text-emphasis-position", "under left");
        W = !0;
        if (K.AQ === 4 || K.AQ === 7 || K.AQ === 12 || K.AQ === 14)
            g.JA(r, "ruby-position", "over"),
            g.JA(r, "-webkit-ruby-position", "before");
        else if (K.AQ === 5 || K.AQ === 6 || K.AQ === 11 || K.AQ === 13)
            g.JA(r, "ruby-position", "under"),
            g.JA(r, "-webkit-ruby-position", "after"),
            W = !1;
        K = T ? g.HB("DIV") : g.HB("RP");
        K.textContent = m;
        r.appendChild(K);
        T && (m = W,
        g.JA(r, {
            display: "inline-block",
            position: "relative"
        }),
        T = r.firstElementChild.nextElementSibling,
        g.JA(T, "display", "none"),
        T = T.nextElementSibling,
        g.JA(T, {
            "font-size": "0.5em",
            "line-height": "1.2em",
            "text-align": "center",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: "400%"
        }),
        g.JA(r.lastElementChild, "display", "none"),
        m ? (g.JA(r, "padding-top", "0.6em"),
        g.JA(T, "top", "0")) : (g.JA(r, "padding-bottom", "0.6em"),
        g.JA(T, "bottom", "0")));
        return r
    }
      , As4 = function(Q) {
        const c = "_" + Ly++;
        return new wE(0,0x8000000000000,0,c,Q)
    }
      , b9 = function(Q, c) {
        Q = Q.getAttribute(c);
        if (Q != null)
            return Number(Q)
    }
      , jO = function(Q, c) {
        Q = Q.getAttribute(c);
        if (Q != null)
            return Q === "1"
    }
      , gE = function(Q, c) {
        Q = b9(Q, c);
        return Q !== void 0 ? Q : null
    }
      , fy = function(Q, c) {
        Q = Q.getAttribute(c);
        if (Q != null)
            return Or.test(Q),
            Q
    }
      , eBm = function(Q, c) {
        const W = {}
          , m = c.getAttribute("ws");
        Object.assign(W, m ? Q.Y[m] : Q.j);
        Q = gE(c, "mh");
        Q != null && (W.R1 = Q);
        Q = gE(c, "ju");
        Q != null && (W.textAlign = Q);
        Q = gE(c, "pd");
        Q != null && (W.oI = Q);
        Q = gE(c, "sd");
        Q != null && (W.Yb = Q);
        Q = fy(c, "wfc");
        Q != null && (W.windowColor = Q);
        c = b9(c, "wfo");
        c !== void 0 && (W.windowOpacity = c / 255);
        return W
    }
      , Vy4 = function(Q, c) {
        const W = {}
          , m = c.getAttribute("wp");
        m && Object.assign(W, Q.L[m]);
        Q = gE(c, "ap");
        Q != null && (W.bW = Q);
        Q = b9(c, "cc");
        Q != null && (W.y4 = Q);
        Q = b9(c, "ah");
        Q != null && (W.kc = Q);
        Q = b9(c, "rc");
        Q != null && (W.lS = Q);
        c = b9(c, "av");
        c != null && (W.ZB = c);
        return W
    }
      , BD1 = function(Q, c, W, m) {
        let K = {};
        Object.assign(K, Vy4(Q, c));
        Object.assign(K, eBm(Q, c));
        m ? g.hH(K, Q.j) ? (m = Q.K,
        K = Q.j) : m = "_" + Ly++ : m = c.getAttribute("id") || "_" + Ly++;
        Q = b9(c, "t") + W;
        c = b9(c, "d") || 0x8000000000000;
        if (K.oI === 2 || K.oI === 3)
            W = K.lS,
            K.lS = K.y4,
            K.y4 = W;
        return new wE(Q,c,0,m,K)
    }
      , vA = function(Q) {
        Q = g.lm(Math.round(Q), 0, 16777215).toString(16).toUpperCase();
        return "#000000".substring(0, 7 - Q.length) + Q
    }
      , xy0 = function(Q, c, W, m, K) {
        m === 0 && (m = 0x8000000000000);
        const T = {};
        c.wpWinPosId && Object.assign(T, Q.j.get(c.wpWinPosId));
        c.wsWinStyleId && Object.assign(T, Q.K.get(c.wsWinStyleId));
        Q = c.rcRowCount;
        Q !== void 0 && (T.lS = Q);
        c = c.ccColCount;
        c !== void 0 && (T.y4 = c);
        if (T.oI === 2 || T.oI === 3)
            c = T.lS,
            T.lS = T.y4,
            T.y4 = c;
        return new wE(W,m,0,K,T)
    }
      , af = function(Q) {
        const c = Q.byteOffset;
        Q.byteOffset += 1;
        return Q.W.getUint8(c)
    }
      , Gl = function(Q) {
        const c = Q.byteOffset;
        Q.byteOffset += 4;
        return Q.W.getUint32(c)
    }
      , DyH = function(Q) {
        if (typeof Q === "string")
            return !1;
        Q = new qV9(Q,0);
        return nHD(Q)
    }
      , nHD = function(Q) {
        if (!(Q.byteOffset < Q.W.byteLength) || Gl(Q) !== 1380139777)
            return !1;
        Q.version = af(Q);
        if (Q.version > 1)
            return !1;
        af(Q);
        af(Q);
        af(Q);
        return !0
    }
      , tyW = function(Q, c) {
        if (!c)
            return "";
        Q.j && Q.O.params.Yb !== 1 && (c *= -1);
        return `translate${Q.j ? "X" : "Y"}(${c}px)`
    }
      , HUH = function(Q) {
        Q.Ie = Array.from(Q.element.getElementsByClassName("caption-visual-line"));
        for (var c = Q.O.params.lS, W = 0, m = 0, K = Q.Ie.length - 1; W < c && K > -1; ) {
            var T = Q.Ie[K];
            m += Q.j ? T.offsetWidth : T.offsetHeight;
            W++;
            K--
        }
        Q.S = m;
        c = Math;
        W = c.max;
        isNaN(Q.MM) && ((m = Q.W.y4) ? (K = g.HB("SPAN"),
        g.EZ(K, "\u2013".repeat(m)),
        g.JA(K, z1m(Q, Q.W.T1)),
        Q.A.appendChild(K),
        Q.MM = K.offsetWidth,
        Q.A.removeChild(K)) : Q.MM = 0);
        m = Q.A;
        Q.b0 = W.call(c, Q.MM, Q.Xw, (Q.j ? m.offsetHeight : m.offsetWidth) + 1)
    }
      , NDa = function(Q, c) {
        HUH(Q);
        var W = Q.Ie.reduce( (m, K) => (Q.j ? K.offsetWidth : K.offsetHeight) + m, 0);
        W = Q.S - W;
        if (W !== Q.UH) {
            const m = W > 0 && Q.UH === 0
              , K = W < Q.UH;
            c || isNaN(W) || m || !K || (g.xK(Q.element, "ytp-rollup-mode"),
            Q.B(Q.element, "transitionend", Q.Y0));
            g.JA(Q.A, "transform", tyW(Q, W));
            Q.UH = W
        }
        HUH(Q)
    }
      , ysD = function(Q, c, W, m) {
        const {formatId: K, DF: T, startTimeMs: r, durationMs: U} = Q.aH(c)
          , I = {
            formatId: K,
            startTimeMs: r,
            durationMs: U,
            MF: T,
            bx: T
        };
        let X = iUm(Q.h3, I.startTimeMs);
        const A = X >= 0 ? Q.h3[X] : null
          , e = A ? A.startTimeMs + A.durationMs : 0
          , V = I.startTimeMs + I.durationMs;
        !A || I.startTimeMs - e > Q.j ? Q.h3.splice(X + 1, 0, I) : (A.durationMs = Math.max(e, V) - A.startTimeMs,
        A.bx = Math.max(A.bx, I.bx));
        m(Q.h3);
        m = g.kV(c);
        Q = Q.K;
        m = m.buffer.slice(m.byteOffset, m.byteLength + m.byteOffset);
        c = c.info.j;
        Q.b0 ? Q.L == null ? g.RX(Q.logger, 350058965, "Null loaded track meta data at captions data received") : W.Zn(m, Q.L, c * 1E3) : g.RX(Q.logger, 350058965, "Null Representation at captions data received")
    }
      , ZUZ = function(Q, c) {
        Q.O = (W, m) => {
            if (Q.U.G().experiments.SG("html5_sabr_live_support_subfragmented_captions"))
                (Q.W ? Q.W = Q.W.D(W) : (Q.W = W,
                SVS(Q.W)),
                Q.W) ? W.info.A && (F4a(Q.W),
                ysD(Q, Q.W, c, m),
                Q.W = null) : g.RX(Q.logger, 350058965, "Empty slice");
            else if (W.info.A) {
                var K = W;
                if (Q.U8.length > 0) {
                    for (K = Q.U8.shift(); Q.U8.length > 0; )
                        K = K.D(Q.U8.shift());
                    K = K.D(W)
                }
                K ? (SVS(K),
                F4a(K),
                ysD(Q, K, c, m)) : g.RX(Q.logger, 350058965, "Empty slice")
            } else
                Q.U8.push(W)
        }
        ;
        Q.U.addEventListener("sabrCaptionsDataLoaded", Q.O)
    }
      , iUm = function(Q, c) {
        Q = g.H9(Q, {
            startTimeMs: c
        }, (W, m) => W.startTimeMs - m.startTimeMs);
        return Q >= 0 ? Q : -Q - 2
    }
      , SVS = function(Q) {
        let c;
        try {
            c = g.QP(Q) * 1E3
        } catch (W) {
            c = Q.info.startTime * 1E3
        }
        c < 0 && (c = Q.info.startTime * 1E3);
        Q.info.startTime = c / 1E3;
        Q.info.j = c / 1E3
    }
      , F4a = function(Q) {
        let c;
        try {
            c = g.Y8x(Q) * 1E3
        } catch (W) {
            c = Q.info.duration * 1E3
        }
        c < 0 && (c = Q.info.duration * 1E3);
        Q.info.duration = c / 1E3;
        Q.info.L = c / 1E3
    }
      , EHi = function(Q, c) {
        if (!g.VTW(Q) || Q.W != null && g.P6(c, Q.W) && Q.W.W.rawcc != null)
            return !1;
        c = !!Q.W && Q.W.isManifestless && Object.values(Q.W.W).some(W => g.l2(W, "386"));
        Q = !!Q.W && !Q.W.isManifestless && g.yrK(Q.W);
        return c || Q
    }
      , s6W = function(Q, c, W) {
        const m = [];
        for (const K in Q.O.W) {
            if (!Q.O.W.hasOwnProperty(K))
                continue;
            const T = Q.O.W[K];
            if (g.l2(T, W || null)) {
                const r = T.info.captionTrack;
                r && r.languageCode === c && m.push(T)
            }
        }
        return m.length ? m[0] : null
    }
      , dy9 = function(Q, c) {
        const W = [];
        for (const K in Q.O.W) {
            if (!Q.O.W.hasOwnProperty(K))
                continue;
            var m = Q.O.W[K];
            if (g.l2(m, c || null)) {
                let T = m.info.id
                  , r = T
                  , U = `.${T}`
                  , I = ""
                  , X = "";
                if (m = m.info.captionTrack)
                    T = m.languageCode,
                    r = m.displayName,
                    U = m.vssId,
                    I = m.kind,
                    X = m.id;
                W.push(new g.zz({
                    id: K,
                    languageCode: T,
                    languageName: r,
                    is_servable: !0,
                    is_default: !0,
                    is_translateable: !1,
                    vss_id: U,
                    kind: I,
                    captionId: X
                }))
            }
        }
        return W
    }
      , wwa = function(Q) {
        const c = L49.length;
        if (Q.byteLength < c)
            return !1;
        Q = new Uint8Array(Q,0,c);
        for (let W = 0; W < c; W++)
            if (L49[W] !== Q[W])
                return !1;
        return !0
    }
      , $X = function(Q) {
        Q = Q.split(":");
        let c = 0;
        for (const W of Q)
            c = c * 60 + Number(W);
        return c * 1E3
    }
      , bU4 = function(Q, c, W, m) {
        m = Object.assign({
            R1: 0
        }, m);
        return new wE(Q,c,W,"_" + Ly++,m)
    }
      , j6D = function(Q, c, W, m, K, T, r, U, I) {
        switch (r.tagName) {
        case "b":
            U.bold = !0;
            break;
        case "i":
            U.italic = !0;
            break;
        case "u":
            U.underline = !0
        }
        for (let A = 0; A < r.childNodes.length; A++) {
            var X = r.childNodes[A];
            if (X.nodeType === 3)
                X = new dE(c,W,m,K.id,X.nodeValue,T || A > 0,g.P9(U) ? void 0 : U),
                I.push(X),
                K.W.push(X);
            else {
                const e = {};
                Object.assign(e, U);
                j6D(Q, c, W, m, K, !0, X, e, I)
            }
        }
    }
      , OUi = function(Q, c, W) {
        if (typeof c === "string" || DyH(c))
            return [{
                trackData: c,
                VF: W
            }];
        if (typeof c === "string" && c.substring(0, 6) === "WEBVTT" || typeof c !== "string" && wwa(c))
            return [{
                trackData: c,
                VF: W
            }];
        const m = new DataView(c);
        if (m.byteLength <= 8 || m.getUint32(4) !== 1718909296)
            return [];
        var K = g.mQm(m);
        if (Q.Z1 && K) {
            var T = g.MGm(K)
              , r = g.JZ0(K);
            K = K.segmentNumber;
            T && K && Q.Z1.tN(K, T, r)
        }
        Q = g.Wd(m, 1835295092);
        if (!Q || !Q.length || !Q[0].size)
            return [];
        T = [];
        for (r = 0; r < Q.length; r++)
            K = Q[r],
            K = new Uint8Array(c,K.dataOffset,K.size - (K.dataOffset - K.offset)),
            K = g.o8(K),
            T.push({
                trackData: K,
                VF: W + r * 1E3
            });
        gHm(m, T, W);
        return T = T.filter(U => !!U.trackData)
    }
      , vHa = function(Q, c, W) {
        Q.W || (Q.W = new fcm);
        Q = Q.W.A(c, W);
        Math.random() < .01 && g.Ty(Error("Deprecated subtitles format in web player: WebVTT"));
        return Q
    }
      , gHm = function(Q, c, W) {
        var m = g.YD(Q, 0, 1836476516);
        let K = 9E4;
        m && (K = g.pc(m) || 9E4);
        m = 0;
        const T = g.Wd(Q, 1836019558);
        for (let U = 0; U < T.length; U++) {
            var r = T[U];
            U < c.length && (r = g.YD(Q, r.dataOffset, 1953653094)) && (r = g.YD(Q, r.dataOffset, 1952867444)) && (r = g.cd(r) / K * 1E3,
            U === 0 && (m = r),
            c[U].VF = r - m + W || W * U * 1E3)
        }
    }
      , ac0 = function(Q) {
        const c = {};
        if (Q = g.Na(Q))
            c.lang = Q,
            g.vPn.test(Q) && (c.oI = 1);
        return c
    }
      , Gs4 = function(Q) {
        const c = !!Q.U.Yx()?.T2();
        return Q.A === "HLS" && c ? !0 : Q.XI && c && Q.A !== "LIVE" && Q.A !== "SABR_LIVE"
    }
      , l9 = function(Q, c, W=!1) {
        const m = PA.T1;
        Q.K = {};
        Object.assign(Q.K, PA);
        Q.K.T1 = {};
        Object.assign(Q.K.T1, m);
        Q.D = {
            T1: {}
        };
        var K = c.backgroundOverride ? Q.D : Q.K
          , T = c.background || m.background;
        Or.test(T);
        K.T1.background = T;
        K = c.colorOverride ? Q.D : Q.K;
        T = c.color || m.color;
        Or.test(T);
        K.T1.color = T;
        K = c.windowColorOverride ? Q.D : Q.K;
        T = c.windowColor || PA.windowColor;
        Or.test(T);
        K.windowColor = T;
        K = c.backgroundOpacityOverride ? Q.D : Q.K;
        T = c.backgroundOpacity;
        T == null && (T = m.backgroundOpacity);
        K.T1.backgroundOpacity = T;
        K = c.fontSizeIncrementOverride ? Q.D : Q.K;
        T = c.fontSizeIncrement;
        T == null && (T = m.fontSizeIncrement);
        K.T1.fontSizeIncrement = T;
        T = c.fontStyleOverride ? Q.D : Q.K;
        K = c.fontStyle;
        K == null && (K = m.bold && m.italic ? 3 : m.bold ? 1 : m.italic ? 2 : 0);
        T = T.T1;
        switch (K) {
        case 1:
            T.bold = !0;
            delete T.italic;
            break;
        case 2:
            delete T.bold;
            T.italic = !0;
            break;
        case 3:
            T.bold = !0;
            T.italic = !0;
            break;
        default:
            delete T.bold,
            delete T.italic
        }
        K = c.textOpacityOverride ? Q.D : Q.K;
        T = c.textOpacity;
        T == null && (T = m.textOpacity);
        K.T1.textOpacity = T;
        K = c.windowOpacityOverride ? Q.D : Q.K;
        T = c.windowOpacity;
        T == null && (T = PA.windowOpacity);
        K.windowOpacity = T;
        K = c.charEdgeStyleOverride ? Q.D : Q.K;
        T = c.charEdgeStyle;
        T == null && (T = m.charEdgeStyle);
        K.T1.charEdgeStyle = T;
        K = c.fontFamilyOverride ? Q.D : Q.K;
        T = c.fontFamily;
        T == null && (T = m.fontFamily);
        K.T1.fontFamily = T;
        Q.loaded && Q.Fw();
        W && g.rl("yt-player-caption-display-settings", c, 2592E3)
    }
      , u9 = function(Q, c, W) {
        c && !Q.mF ? (c = As4({
            oI: 0,
            lang: "en"
        }),
        Q.mF = [c, new dE(c.start,c.end - c.start,0,c.id,W ?? "Captions look like this")],
        Q.player.mV(Q.mF)) : !c && Q.mF && ($ya(Q, Q.mF),
        Q.mF = null)
    }
      , PFi = function(Q) {
        if (!Q.U.isInline())
            return g.UM("yt-player-sticky-caption")
    }
      , hu = function(Q) {
        let c = void 0;
        const W = g.pm().BA(65);
        if (g.rT(Q.FI) && W != null) {
            if (PFi(Q) != null)
                return !1;
            c = !W
        }
        return c
    }
      , lcZ = function(Q) {
        if (Q.FI.zT === 1 || Q.videoData.C3 === 1 || g.YQ(Q.videoData, "yt:cc") === "alwayson")
            return !0;
        let c;
        Q.videoData.captionTracks.length && (c = Q.getAudioTrack().O);
        if (Q.FI.zT === 2) {
            if (g.rT(Q.FI))
                var W = Q.FI.X("enable_player_captions_persistence_state_machine") ? Q.FI.X("enable_player_captions_persistence_state_machine") ? g.UM("yt-player-caption-persistence") : void 0 : PFi(Q);
            else if (Q.storage)
                try {
                    W = Q.storage.get("module-enabled")
                } catch (K) {
                    Q.storage.remove("module-enabled")
                }
            else
                W = null;
            if (W != null)
                return !!W
        }
        W = tu(Q.player.getAudioTrack(), g.rT(Q.FI));
        const m = g.YQ(Q.videoData, "yt:cc");
        if (hu(Q) === void 0) {
            if (W === "CAPTIONS_INITIAL_STATE_ON_RECOMMENDED")
                return m ? m === "on" : !0;
            if (W === "CAPTIONS_INITIAL_STATE_OFF_RECOMMENDED")
                return m === "on"
        } else
            return m === "on";
        return c === "ON" || g.YQ(Q.videoData, "yt:cc") === "on"
    }
      , zl = function(Q, c=!1) {
        if (Q.O && !c || !Q.videoData.captionTracks.length)
            return !1;
        Q = Q.getAudioTrack();
        return !!Q.W || Q.O === "FORCED_ON"
    }
      , uvo = function(Q, c) {
        if (Q.O) {
            var W = Q.U.Yx().Ae().textTracks
              , m = null;
            Q.A === "HLS" ? m = Q.O.getId() : m = Q.O.toString();
            for (let T = 0; T < W.length; T++) {
                var K = W[T];
                K.id === m && (c ? K.mode !== "showing" && (K.mode = "showing",
                K = Q.O,
                Q.q6(K, !!K, Cy(Q) ? "g" : Q.J ? "m" : "s")) : K.mode === "showing" && (K.mode = "disabled"))
            }
        }
    }
      , Cy = function(Q) {
        const c = MC(Q);
        return !!c && Q.O === c
    }
      , hBa = function(Q, c) {
        if (Q.A === "HLS")
            return !1;
        g.oZ(Q.videoData) && (c = !0);
        c || (c = Q.A === "TTS" ? !1 : Q.A === "INNERTUBE" ? !1 : !0);
        return c || Q.FI.X("web_watch_disable_account_level_captions_settings") && g.rT(Q.FI) ? !0 : !!g.pm().BA(66)
    }
      , MC = function(Q) {
        return Q.Y && Q.Y.W
    }
      , Ju = function(Q, c) {
        if (!Q.W)
            return null;
        if (Q.Y && Q.Y.j)
            return Q.Y.j;
        c = hBa(Q, c);
        c = g.H6(Q.W.W, c);
        let W = null;
        if (dSm(Q.FI)) {
            var m = Q.U.isInline() ? void 0 : g.UM("yt-player-caption-sticky-language");
            var K = [m, Q.videoData.captionsLanguagePreference, Q.FI.captionsLanguagePreference, g.YQ(Q.videoData, "yt:cc_default_lang")];
            let U = !1;
            for (let I = 0; I < K.length; I++) {
                const X = K[I];
                if (X) {
                    U = !0;
                    for (var T = 0; T < c.length; T++)
                        if (g.Na(c[T]) === X)
                            return c[T];
                    for (T = 0; T < c.length; T++)
                        if (g.Na(c[T]).split("-")[0] === X.split("-")[0])
                            return c[T]
                }
            }
            if (U && Q.W && (K = Q.W.Y,
            K.length))
                for (var r of K)
                    if (r.languageCode === m) {
                        W = r;
                        break
                    }
        } else
            for (r = [Q.videoData.captionsLanguagePreference, Q.FI.captionsLanguagePreference, g.YQ(Q.videoData, "yt:cc_default_lang")],
            m = 0; m < r.length; m++)
                for (K = 0; K < c.length; K++)
                    if (g.Na(c[K]) === r[m])
                        return c[K];
        r = null;
        Q.Y && Q.Y.A && (r = Q.Y.A);
        r || (r = c.find(U => U.isDefault) || null);
        r || (r = c[0] || MC(Q));
        r && W && g.Na(r).split("-")[0] !== W.languageCode.split("-")[0] && (r = sUa(r, W));
        return r
    }
      , QY = function(Q, c, W) {
        Q.loaded && Q.unload();
        W != null && (Q.J = W,
        Q.J && (Q.FI.X("enable_player_captions_persistence_state_machine") ? Rf(Q, !!c) : g.rT(Q.FI) ? kX(Q, !!c) : YX(Q, !!c)));
        c !== null || zl(Q, !0) || Q.q6(c, !!c, Q.J ? "m" : "s");
        Q.O = c;
        zl(Q) && (Q.O = MC(Q));
        py(Q, Q.O ?? void 0);
        Q.load()
    }
      , Rf = function(Q, c) {
        Q.FI.X("enable_player_captions_persistence_state_machine") && g.rl("yt-player-caption-persistence", c, 3122064E3)
    }
      , kX = function(Q, c) {
        Q.U.isInline() || g.rl("yt-player-sticky-caption", c, 2592E3)
    }
      , YX = function(Q, c) {
        if (Q.storage)
            try {
                Q.storage.set("module-enabled", c)
            } catch (W) {}
    }
      , py = function(Q, c) {
        Q.FI.X("html5_modify_caption_vss_logging") && (Q.videoData.OJ = c)
    }
      , CF9 = function(Q, c) {
        var W = Q.b0[c.id];
        W && W.O !== c && (W.dispose(),
        delete Q.b0[c.id],
        W = null);
        W || (W = zBm(Q, c)) && (Q.b0[c.id] = W)
    }
      , MyD = function(Q, c) {
        const W = c.windowId;
        Q.UH[W] || (Q.UH[W] = []);
        Q.UH[W].push(c)
    }
      , zBm = function(Q, c) {
        const W = Js1(Q);
        if (!W)
            return null;
        var m = Q.O ? g.Na(Q.O) : null;
        m && g.vPn.test(m) && (c.params.oI = 1);
        var K = Q.Re.getPlayerSize();
        m = K.height * Q.S.height;
        K = K.width * Q.S.width;
        Q.FI.playerStyle !== "google-live" || Q.K.isDefault || Object.assign(c.params, Q.K);
        switch (c.params.R1 != null ? c.params.R1 : c.W.length > 1 ? 1 : 0) {
        case 1:
            return new RBa(c,Q.K,Q.D,W.width,W.height,K,m,Q.FI.experiments,Q.JJ.bind(Q),Q.U);
        case 2:
            return new ks9(c,Q.K,Q.D,W.width,W.height,K,m,Q.FI.experiments,Q.JJ.bind(Q),Q.U);
        default:
            return new cK(c,Q.K,Q.D,W.width,W.height,K,m,Q.FI.experiments,Q.JJ.bind(Q),Q.U)
        }
    }
      , Js1 = function(Q) {
        let c = Q.Re.getVideoContentRect(!0).height
          , W = Q.Re.getVideoContentRect(!0).width;
        if (!c || !W)
            return null;
        c *= Q.S.height;
        W *= Q.S.width;
        return {
            width: W,
            height: c
        }
    }
      , $ya = function(Q, c) {
        Q.player.bc(c);
        for (const W of c)
            g.o0(Q.MM, W);
        DG(Q.Ka)
    }
      , YVa = function(Q, c) {
        if (!Q.W)
            return {};
        if (c) {
            g.P9(c) || Q.SQ(c.vss_id, "m");
            if (Q.j && Q.A !== "HLS" || !g.Sd(c))
                return;
            if (g.P9(c)) {
                QY(Q, null, !0);
                return
            }
            let m;
            var W = g.H6(Q.W.W, !0);
            for (let K = 0; K < W.length; K++) {
                const T = W[K];
                T.languageCode !== c.languageCode || m && (T.languageName !== c.languageName || (T.captionId || "") !== (c.captionId || "") || g.tR(T) !== c.displayName) || (m = c.translationLanguage ? sUa(T, c.translationLanguage) : T)
            }
            Q.iz(c.position);
            !m || m === Q.O && Q.loaded || (c = g.Us(),
            W = g.Na(m),
            c.length && W === c[c.length - 1] || (c.push(W),
            g.rl("yt-player-caption-language-preferences", c)),
            dSm(Q.FI) && !Q.U.isInline() && g.rl("yt-player-caption-sticky-language", W, 2592E3),
            QY(Q, m, !0))
        } else
            return Q.loaded && Q.O && !Cy(Q) ? g.H2(Q.O) : {};
        return ""
    };
    g.oy.prototype.tN = g.W3(65, function(Q, c, W) {
        this.O.set(Q, {
            n7: c,
            nf: W
        })
    });
    g.rX.prototype.tN = g.W3(64, function(Q, c, W) {
        this.S.tN(Q, c, W)
    });
    g.Ci.prototype.S = g.W3(63, function() {
        return !1
    });
    g.Ci.prototype.j = g.W3(62, function() {});
    g.M0.prototype.j = g.W3(61, function(Q, c, W) {
        this.u0();
        c = this.D(Q, c);
        const m = this.ge.G().X("html5_report_captions_ctmp_qoe")
          , K = (0,
        g.h)();
        this.A();
        EJo(this, c, {
            format: "RAW",
            onSuccess: T => {
                this.O = null;
                if (m) {
                    var r = (T.responseText.length / 1024).toFixed();
                    const U = (0,
                    g.h)();
                    this.videoData.tJ("capresp", {
                        ms: U - K,
                        kb: r
                    })
                }
                r = T.getResponseHeader && T.getResponseHeader("Content-Length") ? Number(T.getResponseHeader("Content-Length")) : 0;
                W.Zn(T.responseText, Q, void 0, void 0, r)
            }
            ,
            onError: m ? T => {
                this.videoData.tJ("capfail", {
                    status: T?.status ?? 0
                })
            }
            : void 0,
            withCredentials: !0
        })
    });
    g.Jc.prototype.j = g.W3(60, function(Q, c, W) {
        this.u0();
        c = this.D(Q, c);
        this.A();
        this.O = g.Wn(c, {
            format: "RAW",
            onSuccess: m => {
                this.O = null;
                const K = m.getResponseHeader && m.getResponseHeader("Content-Length") ? Number(m.getResponseHeader("Content-Length")) : 0;
                W.Zn(m.responseText, Q, void 0, void 0, K)
            }
            ,
            withCredentials: !0
        })
    });
    g.Yg.prototype.J = g.W3(59, function() {
        const Q = g.UZ(document, "track", void 0, this.W);
        for (let c = 0; c < Q.length; c++)
            g.FQ(Q[c])
    });
    g.cZ.prototype.J = g.W3(58, function() {
        this.mediaElement.J()
    });
    g.Yg.prototype.Ie = g.W3(57, function() {
        return !(!this.W.textTracks || !this.W.textTracks.addEventListener)
    });
    g.cZ.prototype.Ie = g.W3(56, function() {
        return this.mediaElement.Ie()
    });
    g.Yg.prototype.T2 = g.W3(55, function() {
        return !!this.W.textTracks
    });
    g.cZ.prototype.T2 = g.W3(54, function() {
        return this.mediaElement.T2()
    });
    g.Yg.prototype.mF = g.W3(53, function(Q) {
        for (let c = 0; c < Q.length; c++)
            this.W.appendChild(Q[c])
    });
    g.cZ.prototype.mF = g.W3(52, function(Q) {
        this.mediaElement.mF(Q)
    });
    g.N0.prototype.h2 = g.W3(40, function(Q) {
        return this.app.uX({
            playerType: void 0
        }).h2(Q)
    });
    g.DX.prototype.h2 = g.W3(39, function(Q) {
        return this.EH.ag.h2(Q)
    });
    g.vL.prototype.h2 = g.W3(38, function(Q) {
        return this.gj().some(c => c.namespace === Q)
    });
    g.WM.prototype.h2 = g.W3(37, function() {
        return !1
    });
    g.N0.prototype.SQ = g.W3(35, function(Q, c) {
        this.app.oe().SQ(Q, c)
    });
    g.DX.prototype.SQ = g.W3(34, function(Q, c) {
        this.EH.SQ(Q, c)
    });
    g.ji.prototype.SQ = g.W3(33, function(Q, c) {
        Q = [Q, c];
        g.J8(this, g.Yo(this.provider), "cfi", Q)
    });
    g.fi.prototype.SQ = g.W3(32, function(Q, c) {
        this.qoe && this.qoe.SQ(Q, c)
    });
    g.Ff.prototype.SQ = g.W3(31, function(Q, c) {
        this.Vp.SQ(Q, c)
    });
    g.WM.prototype.SQ = g.W3(30, function() {});
    g.N0.prototype.q6 = g.W3(29, function(Q, c, W) {
        this.app.oe().q6(Q, c, W)
    });
    g.DX.prototype.q6 = g.W3(28, function(Q, c, W) {
        this.EH.q6(Q, c, W)
    });
    g.ji.prototype.q6 = g.W3(27, function(Q, c, W) {
        if (this.Ka !== Q || this.WB !== c)
            c = c === "rawcc" ? "" : c,
            W = [Q, c, this.Ka, W],
            g.J8(this, g.Yo(this.provider), "cfs", W),
            this.Ka = Q,
            this.WB = c
    });
    g.fi.prototype.q6 = g.W3(26, function(Q, c, W) {
        this.qoe && this.qoe.q6(Q, c, W)
    });
    g.Ff.prototype.q6 = g.W3(25, function(Q, c, W) {
        this.Vp.q6(Q, c, W)
    });
    g.WM.prototype.q6 = g.W3(24, function() {});
    g.X4.prototype.NN = g.W3(3, function(Q) {
        return (Q = this.A(Q)) ? Q.W : 0
    });
    g.ei.prototype.NN = g.W3(2, function() {
        return 0
    });
    var jU4 = /#(.)(.)(.)/
      , b3o = /^#(?:[0-9a-f]{3}){1,2}$/i
      , $S0 = {
        aa: "Afar",
        ab: "Abkhazian",
        ace: "Acehnese",
        ach: "Acoli",
        ada: "Adangme",
        ady: "Adyghe",
        ae: "Avestan",
        aeb: "Tunisian Arabic",
        af: "Afrikaans",
        afh: "Afrihili",
        agq: "Aghem",
        ain: "Ainu",
        ak: "Akan",
        akk: "Akkadian",
        akz: "Alabama",
        ale: "Aleut",
        aln: "Gheg Albanian",
        alt: "Southern Altai",
        am: "Amharic",
        an: "Aragonese",
        ang: "Old English",
        anp: "Angika",
        ar: "Arabic",
        ar_001: "Arabic (world)",
        arc: "Aramaic",
        arn: "Mapuche",
        aro: "Araona",
        arp: "Arapaho",
        arq: "Algerian Arabic",
        ars: "Najdi Arabic",
        arw: "Arawak",
        ary: "Moroccan Arabic",
        arz: "Egyptian Arabic",
        as: "Assamese",
        asa: "Asu",
        ase: "American Sign Language",
        ast: "Asturian",
        av: "Avaric",
        avk: "Kotava",
        awa: "Awadhi",
        ay: "Aymara",
        az: "Azerbaijani",
        az_Cyrl: "Azerbaijani (Cyrillic)",
        az_Latn: "Azerbaijani (Latin)",
        ba: "Bashkir",
        bal: "Baluchi",
        ban: "Balinese",
        bar: "Bavarian",
        bas: "Basaa",
        bax: "Bamun",
        bbc: "Batak Toba",
        bbj: "Ghomala",
        be: "Belarusian",
        bej: "Beja",
        bem: "Bemba",
        bew: "Betawi",
        bez: "Bena",
        bfd: "Bafut",
        bfq: "Badaga",
        bg: "Bulgarian",
        bgc: "Haryanvi",
        bgn: "Western Balochi",
        bho: "Bhojpuri",
        bi: "Bislama",
        bik: "Bikol",
        bin: "Bini",
        bjn: "Banjar",
        bkm: "Kom",
        bla: "Siksik\u00e1",
        blo: "Anii",
        bm: "Bambara",
        bn: "Bangla",
        bo: "Tibetan",
        bpy: "Bishnupriya",
        bqi: "Bakhtiari",
        br: "Breton",
        bra: "Braj",
        brh: "Brahui",
        brx: "Bodo",
        bs: "Bosnian",
        bs_Cyrl: "Bosnian (Cyrillic)",
        bs_Latn: "Bosnian (Latin)",
        bss: "Akoose",
        bua: "Buriat",
        bug: "Buginese",
        bum: "Bulu",
        byn: "Blin",
        byv: "Medumba",
        ca: "Catalan",
        cad: "Caddo",
        car: "Carib",
        cay: "Cayuga",
        cch: "Atsam",
        ccp: "Chakma",
        ce: "Chechen",
        ceb: "Cebuano",
        cgg: "Chiga",
        ch: "Chamorro",
        chb: "Chibcha",
        chg: "Chagatai",
        chk: "Chuukese",
        chm: "Mari",
        chn: "Chinook Jargon",
        cho: "Choctaw",
        chp: "Chipewyan",
        chr: "Cherokee",
        chy: "Cheyenne",
        ckb: "Central Kurdish",
        co: "Corsican",
        cop: "Coptic",
        cps: "Capiznon",
        cr: "Cree",
        crh: "Crimean Tatar",
        cs: "Czech",
        csb: "Kashubian",
        csw: "Swampy Cree",
        cu: "Church Slavic",
        cv: "Chuvash",
        cy: "Welsh",
        da: "Danish",
        dak: "Dakota",
        dar: "Dargwa",
        dav: "Taita",
        de: "German",
        de_AT: "German (Austria)",
        de_CH: "German (Switzerland)",
        del: "Delaware",
        den: "Slave",
        dgr: "Dogrib",
        din: "Dinka",
        dje: "Zarma",
        doi: "Dogri",
        dsb: "Lower Sorbian",
        dua: "Duala",
        dum: "Middle Dutch",
        dv: "Divehi",
        dyo: "Jola-Fonyi",
        dyu: "Dyula",
        dz: "Dzongkha",
        dzg: "Dazaga",
        ebu: "Embu",
        ee: "Ewe",
        efi: "Efik",
        egy: "Ancient Egyptian",
        eka: "Ekajuk",
        el: "Greek",
        elx: "Elamite",
        en: "English",
        en_AU: "English (Australia)",
        en_CA: "English (Canada)",
        en_GB: "English (United Kingdom)",
        en_US: "English (United States)",
        enm: "Middle English",
        eo: "Esperanto",
        es: "Spanish",
        es_419: "Spanish (Latin America)",
        es_ES: "Spanish (Spain)",
        es_MX: "Spanish (Mexico)",
        et: "Estonian",
        eu: "Basque",
        ewo: "Ewondo",
        fa: "Persian",
        fa_AF: "Persian (Afghanistan)",
        fan: "Fang",
        fat: "Fanti",
        ff: "Fula",
        ff_Adlm: "Fula (Adlam)",
        ff_Latn: "Fula (Latin)",
        fi: "Finnish",
        fil: "Filipino",
        fj: "Fijian",
        fo: "Faroese",
        fon: "Fon",
        fr: "French",
        fr_CA: "French (Canada)",
        fr_CH: "French (Switzerland)",
        frm: "Middle French",
        fro: "Old French",
        frr: "Northern Frisian",
        frs: "Eastern Frisian",
        fur: "Friulian",
        fy: "Western Frisian",
        ga: "Irish",
        gaa: "Ga",
        gay: "Gayo",
        gba: "Gbaya",
        gd: "Scottish Gaelic",
        gez: "Geez",
        gil: "Gilbertese",
        gl: "Galician",
        gmh: "Middle High German",
        gn: "Guarani",
        goh: "Old High German",
        gon: "Gondi",
        gor: "Gorontalo",
        got: "Gothic",
        grb: "Grebo",
        grc: "Ancient Greek",
        gsw: "Swiss German",
        gu: "Gujarati",
        guz: "Gusii",
        gv: "Manx",
        gwi: "Gwich\u02bcin",
        ha: "Hausa",
        hai: "Haida",
        haw: "Hawaiian",
        he: "Hebrew",
        hi: "Hindi",
        hi_Latn: "Hindi (Latin)",
        hil: "Hiligaynon",
        hit: "Hittite",
        hmn: "Hmong",
        ho: "Hiri Motu",
        hr: "Croatian",
        hsb: "Upper Sorbian",
        ht: "Haitian Creole",
        hu: "Hungarian",
        hup: "Hupa",
        hy: "Armenian",
        hz: "Herero",
        ia: "Interlingua",
        iba: "Iban",
        ibb: "Ibibio",
        id: "Indonesian",
        ie: "Interlingue",
        ig: "Igbo",
        ii: "Sichuan Yi",
        ik: "Inupiaq",
        ilo: "Iloko",
        "in": "Indonesian",
        inh: "Ingush",
        io: "Ido",
        is: "Icelandic",
        it: "Italian",
        iu: "Inuktitut",
        iw: "Hebrew",
        ja: "Japanese",
        jbo: "Lojban",
        jgo: "Ngomba",
        jmc: "Machame",
        jpr: "Judeo-Persian",
        jrb: "Judeo-Arabic",
        jv: "Javanese",
        ka: "Georgian",
        kaa: "Kara-Kalpak",
        kab: "Kabyle",
        kac: "Kachin",
        kaj: "Jju",
        kam: "Kamba",
        kaw: "Kawi",
        kbd: "Kabardian",
        kbl: "Kanembu",
        kcg: "Tyap",
        kde: "Makonde",
        kea: "Kabuverdianu",
        kfo: "Koro",
        kg: "Kongo",
        kgp: "Kaingang",
        kha: "Khasi",
        kho: "Khotanese",
        khq: "Koyra Chiini",
        ki: "Kikuyu",
        kj: "Kuanyama",
        kk: "Kazakh",
        kk_Arab: "Kazakh (Arabic)",
        kk_Cyrl: "Kazakh (Cyrillic)",
        kkj: "Kako",
        kl: "Kalaallisut",
        kln: "Kalenjin",
        km: "Khmer",
        kmb: "Kimbundu",
        kn: "Kannada",
        ko: "Korean",
        kok: "Konkani",
        kok_Deva: "Konkani (Devanagari)",
        kok_Latn: "Konkani (Latin)",
        kos: "Kosraean",
        kpe: "Kpelle",
        kr: "Kanuri",
        krc: "Karachay-Balkar",
        krl: "Karelian",
        kru: "Kurukh",
        ks: "Kashmiri",
        ks_Arab: "Kashmiri (Arabic)",
        ks_Deva: "Kashmiri (Devanagari)",
        ksb: "Shambala",
        ksf: "Bafia",
        ksh: "Colognian",
        ku: "Kurdish",
        ku_Latn: "Kurdish (Latin)",
        kum: "Kumyk",
        kut: "Kutenai",
        kv: "Komi",
        kw: "Cornish",
        kxv: "Kuvi",
        kxv_Deva: "Kuvi (Devanagari)",
        kxv_Latn: "Kuvi (Latin)",
        kxv_Orya: "Kuvi (Odia)",
        kxv_Telu: "Kuvi (Telugu)",
        ky: "Kyrgyz",
        la: "Latin",
        lad: "Ladino",
        lag: "Langi",
        lah: "Western Panjabi",
        lam: "Lamba",
        lb: "Luxembourgish",
        lez: "Lezghian",
        lg: "Ganda",
        li: "Limburgish",
        lij: "Ligurian",
        lkt: "Lakota",
        lmo: "Lombard",
        ln: "Lingala",
        lo: "Lao",
        lol: "Mongo",
        loz: "Lozi",
        lrc: "Northern Luri",
        lt: "Lithuanian",
        lu: "Luba-Katanga",
        lua: "Luba-Lulua",
        lui: "Luiseno",
        lun: "Lunda",
        luo: "Luo",
        lus: "Mizo",
        luy: "Luyia",
        lv: "Latvian",
        mad: "Madurese",
        maf: "Mafa",
        mag: "Magahi",
        mai: "Maithili",
        mak: "Makasar",
        man: "Mandingo",
        mas: "Masai",
        mde: "Maba",
        mdf: "Moksha",
        mdr: "Mandar",
        men: "Mende",
        mer: "Meru",
        mfe: "Morisyen",
        mg: "Malagasy",
        mga: "Middle Irish",
        mgh: "Makhuwa-Meetto",
        mgo: "Meta\u02bc",
        mh: "Marshallese",
        mi: "M\u0101ori",
        mic: "Mi'kmaw",
        min: "Minangkabau",
        mk: "Macedonian",
        ml: "Malayalam",
        mn: "Mongolian",
        mnc: "Manchu",
        mni: "Manipuri",
        mni_Beng: "Manipuri (Bangla)",
        mo: "Romanian",
        moh: "Mohawk",
        mos: "Mossi",
        mr: "Marathi",
        ms: "Malay",
        mt: "Maltese",
        mua: "Mundang",
        mul: "Multiple languages",
        mus: "Muscogee",
        mwl: "Mirandese",
        mwr: "Marwari",
        my: "Burmese",
        mye: "Myene",
        myv: "Erzya",
        mzn: "Mazanderani",
        na: "Nauru",
        nap: "Neapolitan",
        naq: "Nama",
        nb: "Norwegian Bokm\u00e5l",
        nd: "North Ndebele",
        nds: "Low German",
        nds_NL: "Low German (Netherlands)",
        ne: "Nepali",
        "new": "Newari",
        ng: "Ndonga",
        nia: "Nias",
        niu: "Niuean",
        nl: "Dutch",
        nl_BE: "Dutch (Belgium)",
        nmg: "Kwasio",
        nn: "Norwegian Nynorsk",
        nnh: "Ngiemboon",
        no: "Norwegian",
        nog: "Nogai",
        non: "Old Norse",
        nqo: "N\u2019Ko",
        nr: "South Ndebele",
        nso: "Northern Sotho",
        nus: "Nuer",
        nv: "Navajo",
        nwc: "Classical Newari",
        ny: "Nyanja",
        nym: "Nyamwezi",
        nyn: "Nyankole",
        nyo: "Nyoro",
        nzi: "Nzima",
        oc: "Occitan",
        oj: "Ojibwa",
        om: "Oromo",
        or: "Odia",
        os: "Ossetic",
        osa: "Osage",
        ota: "Ottoman Turkish",
        pa: "Punjabi",
        pa_Arab: "Punjabi (Arabic)",
        pa_Guru: "Punjabi (Gurmukhi)",
        pag: "Pangasinan",
        pal: "Pahlavi",
        pam: "Pampanga",
        pap: "Papiamento",
        pau: "Palauan",
        pcm: "Nigerian Pidgin",
        peo: "Old Persian",
        phn: "Phoenician",
        pi: "Pali",
        pl: "Polish",
        pms: "Piedmontese",
        pon: "Pohnpeian",
        prg: "Prussian",
        pro: "Old Proven\u00e7al",
        ps: "Pashto",
        pt: "Portuguese",
        pt_BR: "Portuguese (Brazil)",
        pt_PT: "Portuguese (Portugal)",
        qu: "Quechua",
        raj: "Rajasthani",
        rap: "Rapanui",
        rar: "Rarotongan",
        rm: "Romansh",
        rn: "Rundi",
        ro: "Romanian",
        ro_MD: "Romanian (Moldova)",
        rof: "Rombo",
        rom: "Romany",
        ru: "Russian",
        rup: "Aromanian",
        rw: "Kinyarwanda",
        rwk: "Rwa",
        sa: "Sanskrit",
        sad: "Sandawe",
        sah: "Yakut",
        sam: "Samaritan Aramaic",
        saq: "Samburu",
        sas: "Sasak",
        sat: "Santali",
        sat_Olck: "Santali (Ol Chiki)",
        sba: "Ngambay",
        sbp: "Sangu",
        sc: "Sardinian",
        scn: "Sicilian",
        sco: "Scots",
        sd: "Sindhi",
        sd_Arab: "Sindhi (Arabic)",
        sd_Deva: "Sindhi (Devanagari)",
        se: "Northern Sami",
        see: "Seneca",
        seh: "Sena",
        sel: "Selkup",
        ses: "Koyraboro Senni",
        sg: "Sango",
        sga: "Old Irish",
        sh: "Serbo-Croatian",
        shi: "Tachelhit",
        shi_Latn: "Tachelhit (Latin)",
        shi_Tfng: "Tachelhit (Tifinagh)",
        shn: "Shan",
        shu: "Chadian Arabic",
        si: "Sinhala",
        sid: "Sidamo",
        sk: "Slovak",
        sl: "Slovenian",
        sm: "Samoan",
        sma: "Southern Sami",
        smj: "Lule Sami",
        smn: "Inari Sami",
        sms: "Skolt Sami",
        sn: "Shona",
        snk: "Soninke",
        so: "Somali",
        sog: "Sogdien",
        sq: "Albanian",
        sr: "Serbian",
        sr_Cyrl: "Serbian (Cyrillic)",
        sr_Latn: "Serbian (Latin)",
        srn: "Sranan Tongo",
        srr: "Serer",
        ss: "Swati",
        ssy: "Saho",
        st: "Southern Sotho",
        su: "Sundanese",
        su_Latn: "Sundanese (Latin)",
        suk: "Sukuma",
        sus: "Susu",
        sux: "Sumerian",
        sv: "Swedish",
        sw: "Swahili",
        sw_CD: "Swahili (Congo - Kinshasa)",
        swb: "Comorian",
        syc: "Classical Syriac",
        syr: "Syriac",
        szl: "Silesian",
        ta: "Tamil",
        te: "Telugu",
        tem: "Timne",
        teo: "Teso",
        ter: "Tereno",
        tet: "Tetum",
        tg: "Tajik",
        th: "Thai",
        ti: "Tigrinya",
        tig: "Tigre",
        tiv: "Tiv",
        tk: "Turkmen",
        tkl: "Tokelauan",
        tl: "Tagalog",
        tlh: "Klingon",
        tli: "Tlingit",
        tmh: "Tamashek",
        tn: "Tswana",
        to: "Tongan",
        tog: "Nyasa Tonga",
        tok: "Toki Pona",
        tpi: "Tok Pisin",
        tr: "Turkish",
        trv: "Taroko",
        ts: "Tsonga",
        tsi: "Tsimshian",
        tt: "Tatar",
        tum: "Tumbuka",
        tvl: "Tuvalu",
        tw: "Twi",
        twq: "Tasawaq",
        ty: "Tahitian",
        tyv: "Tuvinian",
        tzm: "Central Atlas Tamazight",
        udm: "Udmurt",
        ug: "Uyghur",
        uga: "Ugaritic",
        uk: "Ukrainian",
        umb: "Umbundu",
        ur: "Urdu",
        uz: "Uzbek",
        uz_Arab: "Uzbek (Arabic)",
        uz_Cyrl: "Uzbek (Cyrillic)",
        uz_Latn: "Uzbek (Latin)",
        vai: "Vai",
        vai_Latn: "Vai (Latin)",
        vai_Vaii: "Vai (Vai)",
        ve: "Venda",
        vec: "Venetian",
        vi: "Vietnamese",
        vmw: "Makhuwa",
        vo: "Volap\u00fck",
        vot: "Votic",
        vun: "Vunjo",
        wa: "Walloon",
        wae: "Walser",
        wal: "Wolaytta",
        war: "Waray",
        was: "Washo",
        wo: "Wolof",
        xal: "Kalmyk",
        xh: "Xhosa",
        xnr: "Kangri",
        xog: "Soga",
        yao: "Yao",
        yap: "Yapese",
        yav: "Yangben",
        ybb: "Yemba",
        yi: "Yiddish",
        yo: "Yoruba",
        yrl: "Nheengatu",
        yue: "Cantonese",
        yue_Hans: "Cantonese (Simplified)",
        yue_Hant: "Cantonese (Traditional)",
        za: "Zhuang",
        zap: "Zapotec",
        zbl: "Blissymbols",
        zen: "Zenaga",
        zgh: "Standard Moroccan Tamazight",
        zh: "Chinese",
        zh_Hans: "Chinese (Simplified)",
        zh_Hant: "Chinese (Traditional)",
        zh_TW: "Chinese (Taiwan)",
        zu: "Zulu",
        zun: "Zuni",
        zxx: "No linguistic content",
        zza: "Zaza"
    }
      , pw0 = {
        en: "English"
    }
      , QPa = class extends g.Ci {
        constructor(Q) {
            super(Q);
            this.O = new Set
        }
        K(Q) {
            var c = this.ge.Yx();
            if (c && c.Ae()) {
                c = c.Ae().textTracks;
                for (const W of c)
                    W.kind === "subtitles" && !this.O.has(W.language) && W.language && (g.$m(this.W, new g.zz({
                        languageCode: W.language,
                        languageName: W.language,
                        kind: W.kind,
                        id: W.id,
                        displayName: pw0[W.label] || W.label,
                        vss_id: `.${W.language}`
                    })),
                    this.O.add(W.language))
            }
            g.H6(this.W).length > 0 && Q.Kw()
        }
    }
      , co9 = class {
        constructor() {
            this.segments = []
        }
        contains(Q) {
            Q = g.H9(this.segments, Q);
            return Q >= 0 || Q < 0 && (-Q - 1) % 2 === 1
        }
        length() {
            return this.segments.length / 2
        }
    }
      , WKv = class extends g.qK {
        constructor(Q, c, W, m, K, T) {
            super();
            this.policy = Q;
            this.player = c;
            this.OH = W;
            this.L = m;
            this.K = K;
            this.S = T;
            this.j = new co9;
            this.D = -1;
            this.O = this.A = this.W = null;
            this.b0 = 0;
            this.J = new g.Uc(this.mF,1E3,this);
            this.events = new g.db(this);
            g.F(this, this.J);
            g.F(this, this.events);
            this.events.B(c, "SEEK_COMPLETE", this.Y);
            this.Y();
            this.mF()
        }
        WA() {
            super.WA();
            this.O && this.O.cancel()
        }
        Y() {
            this.seekTo(this.player.getCurrentTime())
        }
        seekTo(Q) {
            Q -= this.player.NQ();
            const c = this.W;
            this.W = g.v3(this.OH.D(Q).eh);
            c !== this.W && this.S && this.S()
        }
        reset() {
            this.j = new co9;
            this.D = -1;
            this.O && (this.O.cancel(),
            this.O = null)
        }
        mF() {
            this.u0();
            var Q;
            if (Q = this.W != null)
                Q = this.W,
                Q = Q.OH.j(Q);
            if (Q && !this.O && !(this.W && this.W.startTime - this.player.getCurrentTime() > 30)) {
                Q = this.W;
                Q = Q.OH.Ka(Q);
                const K = Q.eh[0];
                if (this.player.getVideoData()?.enableServerStitchedDai) {
                    var c = this.player.ej();
                    if (c) {
                        var W = K.OH.info.id;
                        const T = K.DF;
                        var m = Q.eh[0].j;
                        if (this.policy.Ka) {
                            if (c = g.wqw(c, m, T, W, 3))
                                Q.j = c
                        } else if (W = c.hv(m, T, W, 3))
                            if (m = 2,
                            c.v5.has(T) ? m = 0 : g.iM(c, T) && (m = 1),
                            c = m,
                            c === 0)
                                W && (Q.W = new g.lB(W));
                            else if (c === 2) {
                                this.J.start();
                                fYi(this) && this.seekTo(this.player.getCurrentTime());
                                return
                            }
                    }
                }
                K.OH.index.Wb(K.DF) ? (this.j.contains(Q.eh[0].DF) || vJ0(this, Q),
                this.W = g.v3(Q.eh)) : fYi(this) && this.seekTo(this.player.getCurrentTime())
            }
            this.J.start()
        }
    }
      , m6v = class extends g.Ci {
        constructor(Q, c) {
            super(c);
            this.O = Q;
            this.U = c;
            this.L = null;
            this.mF = !1;
            this.logger = new g.JY("caps");
            this.b0 = g.P6(this.U, this.O)
        }
        j(Q, c, W) {
            this.A();
            c = aYD(this, Q.getId());
            c || (c = Q.languageCode,
            c = this.O.isManifestless ? G01(this, c, "386") : G01(this, c));
            if (c) {
                var m = (c.index.NN(c.index.E$()) - c.index.getStartTime(c.index.E$())) * 1E3
                  , K = new g.d3n(this.U.G());
                this.L = new WKv(K,this.U,c, (T, r) => {
                    W.Zn(T, Q, r, m)
                }
                ,this.b0 || g.Gb(c.info), () => {
                    this.L && this.L.reset();
                    this.mF = !0
                }
                )
            }
        }
        S() {
            const Q = this.mF;
            this.mF = !1;
            return Q
        }
        K(Q) {
            var c = this.U.G().X("html5_fallback_if_rawcc_missing");
            const W = this.O.W.rawcc != null;
            if (!this.b0 || !W && c)
                c = this.O.isManifestless ? P6a(this, "386") : P6a(this);
            else {
                if (!W) {
                    g.RX(this.logger, 386248249, "rawcc used but unavailable");
                    return
                }
                c = [new g.zz({
                    id: "rawcc",
                    languageCode: "rawcc",
                    languageName: "CC1",
                    is_servable: !0,
                    is_default: !0,
                    is_translateable: !1,
                    vss_id: ".en"
                }), new g.zz({
                    id: "rawcc",
                    languageCode: "rawcc",
                    languageName: "CC3",
                    is_servable: !0,
                    is_default: !0,
                    is_translateable: !1,
                    vss_id: ".en"
                })]
            }
            for (const m of c)
                g.$m(this.W, m);
            Q.Kw()
        }
        A() {
            this.L && (this.L.dispose(),
            this.L = null)
        }
        D() {
            return ""
        }
    }
      , Or = /^#(?:[0-9a-f]{3}){1,2}$/i;
    var KKm = ["left", "right", "center", "justify"];
    var cK = class extends g.k {
        constructor(Q, c, W, m, K, T, r, U, I, X) {
            const A = X.isInline() && !0
              , e = {};
            Object.assign(e, c);
            Object.assign(e, Q.params);
            Object.assign(e, W);
            const V = {};
            Object.assign(V, c.T1);
            Q.params.T1 && Object.assign(V, Q.params.T1);
            Object.assign(V, W.T1);
            A && (e.windowOpacity = .6,
            V.backgroundOpacity = 0);
            e.T1 = V;
            const B = e.oI === 1
              , n = [{
                C: "span",
                Z: "captions-text",
                N: {
                    style: "word-wrap: normal; display: block;"
                }
            }]
              , S = U.SG("caption_edit_on_hover") && X.getVideoData().getPlayerResponse()?.captions?.playerCaptionsTracklistRenderer?.openTranscriptCommand;
            S && n.unshift({
                C: "button",
                Z: "caption-edit",
                N: {
                    tabindex: "0",
                    "aria-label": gJS()
                },
                V: [{
                    C: "svg",
                    N: {
                        fill: "#e3e3e3",
                        height: "100%",
                        viewBox: "5 5 38 38",
                        width: "100%"
                    },
                    V: [{
                        C: "path",
                        N: {
                            d: "M9 39h2.2l24.25-24.25-1.1-1.1-1.1-1.1L9 36.8Zm-3 3v-6.4L35.4 6.2q.85-.85 2.12-.82 1.27.02 2.12.87L41.8 8.4q.85.85.85 2.1t-.85 2.1L12.4 42Zm33.5-31.55L37.45 8.4Zm-4.05 4.3-1.1-1.1-1.1-1.1 2.2 2.2Z"
                        }
                    }]
                }]
            });
            super({
                C: "div",
                Z: "caption-window",
                N: {
                    id: `caption-window-${Q.id}`,
                    dir: B ? "rtl" : "ltr",
                    tabindex: "0",
                    lang: e.lang
                },
                V: n
            });
            this.D = [];
            this.Ka = !1;
            this.O = Q;
            this.PA = this.jG = null;
            this.w6 = T;
            this.Rt = r;
            this.J = null;
            this.maxWidth = T * .96;
            this.maxHeight = r * .96;
            this.W = e;
            this.u3 = W;
            this.T2 = c;
            this.A = this.z2("captions-text");
            this.nO = this.A.style.getPropertyValue("box-decoration-break") !== "" || this.A.style.getPropertyValue("-webkit-box-decoration-break") !== "";
            this.JJ = lYi(m, K, T, r);
            this.QE = I;
            S && (this.K = this.z2("caption-edit"),
            this.B(this.K, "click", () => {
                this.QE()
            }
            ));
            this.type = 0;
            this.HA = this.JJ * umm(V);
            this.iX = A;
            this.La = U.SG("enable_centered_caption_for_tvfilm_video") && X.getVideoData().isTvfilmVideo;
            this.Y = X.G().Ty().W.BA(g.GjR);
            Q = new g.iG(this.element,!0);
            g.F(this, Q);
            Q.subscribe("dragstart", this.dA, this);
            Q.subscribe("dragmove", this.Hw, this);
            Q.subscribe("dragend", this.gA, this);
            this.EC = this.Re = this.WB = this.Fw = 0;
            Q = "";
            this.W.windowOpacity && (Q = HA(this.W.windowColor),
            Q = "rgba(" + Q[0] + "," + Q[1] + "," + Q[2] + "," + this.W.windowOpacity + ")");
            c = {
                "background-color": Q,
                display: this.W.isVisible === !1 ? "none" : "",
                "text-align": KKm[this.W.textAlign]
            };
            this.nO && (c["border-radius"] = Q ? `${this.HA / 8}px` : "");
            (this.j = this.O.params.oI === 2 || this.O.params.oI === 3) && h1D(this, this.element);
            g.JA(this.element, c);
            A && this.element.parentElement?.style.setProperty("--caption-window-color", Q);
            switch (this.W.bW) {
            case 0:
            case 1:
            case 2:
                g.xK(this.element, "ytp-caption-window-top");
                break;
            case 6:
            case 7:
            case 8:
                g.xK(this.element, "ytp-caption-window-bottom")
            }
        }
        dA(Q, c) {
            this.Re = Q;
            this.EC = c;
            const W = g.Ia(this.element, this.element.parentElement);
            this.Fw = Q - W.x;
            this.WB = c - W.y
        }
        Hw(Q, c) {
            if (Q !== this.Re || c !== this.EC) {
                g.B7(this.element, "ytp-dragging") || g.xK(this.element, "ytp-dragging");
                var W = g.A4(this.element);
                Q = Q - this.Fw - .02 * this.w6;
                var m = c - this.WB - .02 * this.Rt
                  , K = (Q + W.width / 2) / this.maxWidth * 3;
                K = Math.floor(g.lm(K, 0, 2));
                var T = (m + W.height / 2) / this.maxHeight * 3;
                T = Math.floor(g.lm(T, 0, 2));
                c = K + T * 3;
                Q = (Q + K / 2 * W.width) / this.maxWidth;
                Q = g.lm(Q, 0, 1) * 100;
                W = (m + T / 2 * W.height) / this.maxHeight;
                W = g.lm(W, 0, 1) * 100;
                this.O.params.bW = c;
                this.O.params.ZB = W;
                this.O.params.kc = Q;
                this.O.params.isDefault = !1;
                this.W.bW = c;
                this.W.ZB = W;
                this.W.kc = Q;
                this.W.isDefault = !1;
                this.T2.bW = c;
                this.T2.ZB = W;
                this.T2.kc = Q;
                this.T2.isDefault = !1;
                this.Sh()
            }
        }
        gA() {
            g.n6(this.element, "ytp-dragging")
        }
        Sh() {
            this.L(this.D)
        }
        L(Q) {
            var c = this.iX ? 0 : Math.min(this.qQ(), this.maxWidth)
              , W = this.MQ()
              , m = this.iX;
            if (m) {
                var K = getComputedStyle(this.A.parentNode);
                K = i9(K.borderLeftWidth) + i9(K.borderRightWidth) + i9(K.paddingLeft) + i9(K.paddingRight)
            } else
                K = 0;
            const T = K;
            K = "";
            this.O.params.oI === 3 && (K = "rotate(180deg)");
            var r = m ? `calc(96% - ${T}px)` : "96%";
            g.JA(this.element, {
                top: 0,
                left: 0,
                right: "",
                bottom: "",
                width: c ? `${c}px` : "",
                height: W ? `${W}px` : "",
                "max-width": r,
                "max-height": r,
                margin: "",
                transform: ""
            });
            this.XI(Q);
            K = {
                transform: K,
                top: "",
                left: "",
                width: c ? `${c}px` : "",
                height: W ? `${W}px` : "",
                "max-width": "",
                "max-height": ""
            };
            r = this.W.bW;
            var U = this.W.kc;
            const I = this.W.ZB;
            this.La && r != null && (U = 50,
            r = Math.floor(r / 3) * 3 + 1);
            U = U * .96 + 2;
            switch (r) {
            case 0:
            case 3:
            case 6:
                (m = this.W.T1.fontSizeIncrement) && m > 0 && this.W.oI !== 2 && this.W.oI !== 3 && (U = Math.max(U / (1 + m * 2), 2));
                K.left = `${U}%`;
                break;
            case 1:
            case 4:
            case 7:
                K.left = `${U}%`;
                U = 0;
                this.Y || (U = this.A.offsetWidth);
                c || U ? (c = c || U + 1,
                K.width = `${c}px`,
                K["margin-left"] = m ? `${c / -2 - T / 2}px` : `${c / -2}px`) : (this.Y && (K.width = "max-content"),
                K.transform += " translateX(-50%)");
                break;
            case 2:
            case 5:
            case 8:
                K.right = `${100 - U}%`
            }
            m = I * .96 + 2;
            switch (r) {
            case 0:
            case 1:
            case 2:
                K.top = `${m}%`;
                break;
            case 3:
            case 4:
            case 5:
                K.top = `${m}%`;
                m = 0;
                this.Y || (m = this.element.clientHeight);
                (W = W || m) ? (K.height = `${W}px`,
                K["margin-top"] = `${W / -2}px`) : K.transform += " translateY(-50%)";
                break;
            case 6:
            case 7:
            case 8:
                K.bottom = `${100 - m}%`
            }
            g.JA(this.element, K);
            if (this.K) {
                if (this.Y)
                    W = this.HA;
                else {
                    if (this.La && Q.length === 0)
                        Q = 0;
                    else {
                        W = 1;
                        for (m = 0; m < Q.length; m++)
                            K = Q[m],
                            typeof K.text === "string" && (W += K.text.split("\n").length - 1,
                            K.append || m === 0 || W++);
                        Q = W
                    }
                    W = this.La ? Q > 0 ? this.A.offsetHeight / Q : 0 : this.A.offsetHeight / Q
                }
                this.K.style.height = `${W}px`;
                this.K.style.width = `${W}px`;
                this.element.style.paddingLeft = `${W + 5}px`;
                this.element.style.paddingRight = `${W + 5}px`;
                this.Y || (Q = Number(this.element.style.marginLeft.replace("px", "")) - W - 5,
                W = Number(this.element.style.marginRight.replace("px", "")) - W - 5,
                this.element.style.marginLeft = `${Q}px`,
                this.element.style.marginRight = `${W}px`)
            }
        }
        XI(Q) {
            let c;
            for (c = 0; c < Q.length && Q[c] === this.D[c]; c++)
                ;
            if (this.Ka || this.D.length > c)
                c = 0,
                this.Ka = !1,
                this.D = [],
                this.J = this.PA = this.jG = null,
                g.y0(this.A);
            for (; c < Q.length; c++)
                JCi(this, Q[c])
        }
        qQ() {
            return 0
        }
        MQ() {
            return 0
        }
        toString() {
            return super.toString()
        }
    }
    ;
    var oCW = class {
        constructor() {
            this.A = this.time = this.mode = this.O = 0;
            this.j = new Tyv(this);
            this.K = new Tyv(this);
            this.W = [];
            this.clear()
        }
        clear() {
            this.A = this.time = this.mode = 0;
            this.W = [];
            this.reset()
        }
        reset() {
            this.mode = 0;
            this.j.reset(0);
            this.K.reset(1)
        }
    }
      , R19 = [128, 1, 2, 131, 4, 133, 134, 7, 8, 137, 138, 11, 140, 13, 14, 143, 16, 145, 146, 19, 148, 21, 22, 151, 152, 25, 26, 155, 28, 157, 158, 31, 32, 161, 162, 35, 164, 37, 38, 167, 168, 41, 42, 171, 44, 173, 174, 47, 176, 49, 50, 179, 52, 181, 182, 55, 56, 185, 186, 59, 188, 61, 62, 191, 64, 193, 194, 67, 196, 69, 70, 199, 200, 73, 74, 203, 76, 205, 206, 79, 208, 81, 82, 211, 84, 213, 214, 87, 88, 217, 218, 91, 220, 93, 94, 223, 224, 97, 98, 227, 100, 229, 230, 103, 104, 233, 234, 107, 236, 109, 110, 239, 112, 241, 242, 115, 244, 117, 118, 247, 248, 121, 122, 251, 124, 253, 254, 127, 0, 129, 130, 3, 132, 5, 6, 135, 136, 9, 10, 139, 12, 141, 142, 15, 144, 17, 18, 147, 20, 149, 150, 23, 24, 153, 154, 27, 156, 29, 30, 159, 160, 33, 34, 163, 36, 165, 166, 39, 40, 169, 170, 43, 172, 45, 46, 175, 48, 177, 178, 51, 180, 53, 54, 183, 184, 57, 58, 187, 60, 189, 190, 63, 192, 65, 66, 195, 68, 197, 198, 71, 72, 201, 202, 75, 204, 77, 78, 207, 80, 209, 210, 83, 212, 85, 86, 215, 216, 89, 90, 219, 92, 221, 222, 95, 96, 225, 226, 99, 228, 101, 102, 231, 232, 105, 106, 235, 108, 237, 238, 111, 240, 113, 114, 243, 116, 245, 246, 119, 120, 249, 250, 123, 252, 125, 126, 255]
      , roZ = class {
        constructor() {
            this.type = 0
        }
        set(Q) {
            this.type = Q
        }
        get() {
            return this.type
        }
    }
      , U60 = class {
        constructor() {
            this.state = this.CY = this.JD = 0
        }
        clear() {
            this.state = 0
        }
        update() {
            this.state = this.state === 2 ? 1 : 0
        }
        Xq() {
            return this.state !== 0
        }
        matches(Q, c) {
            return this.Xq() && Q === this.JD && c === this.CY
        }
    }
      , IZa = class {
        constructor() {
            this.timestamp = this.W = 0
        }
        reset() {
            this.timestamp = this.W = 0
        }
    }
      , WK = class {
        constructor(Q) {
            this.K = Q;
            this.A = [];
            this.W = this.O = this.row = 0;
            this.style = new roZ;
            this.j = 0;
            for (Q = 0; Q <= 15; Q++) {
                this.A[Q] = [];
                for (let c = 0; c <= 32; c++)
                    this.A[Q][c] = new IZa
            }
        }
        updateTime(Q) {
            for (let c = 1; c <= 15; ++c)
                for (let W = 1; W <= 32; ++W)
                    this.A[c][W].timestamp = Q
        }
        debugString() {
            let Q = "\n";
            for (let c = 1; c <= 15; ++c) {
                for (let W = 1; W <= 32; ++W) {
                    const m = this.A[c][W];
                    Q = m.W === 0 ? Q + "_" : Q + String.fromCharCode(m.W)
                }
                Q += "\n"
            }
            return Q
        }
        reset(Q) {
            for (let c = 0; c <= 15; c++)
                for (let W = 0; W <= 32; W++)
                    this.A[c][W].reset();
            this.j = Q;
            this.W = 0;
            this.O = this.row = 1
        }
    }
      , csZ = [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 225, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 233, 93, 237, 243, 250, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 231, 247, 209, 241, 9632]
      , W44 = [174, 176, 189, 191, 8482, 162, 163, 9834, 224, 32, 232, 226, 234, 238, 244, 251]
      , myo = [193, 201, 211, 218, 220, 252, 8216, 161, 42, 39, 9473, 169, 8480, 183, 8220, 8221, 192, 194, 199, 200, 202, 203, 235, 206, 207, 239, 212, 217, 249, 219, 171, 187]
      , K4H = [195, 227, 205, 204, 236, 210, 242, 213, 245, 123, 125, 92, 94, 95, 124, 126, 196, 228, 214, 246, 223, 165, 164, 9475, 197, 229, 216, 248, 9487, 9491, 9495, 9499]
      , X_a = class {
        constructor(Q) {
            this.A = Q;
            this.K = 0;
            this.style = new roZ;
            this.D = new WK(this.A);
            this.J = new WK(this.A);
            this.text = new WK(this.A);
            this.O = this.D;
            this.j = this.J;
            this.W = this.O
        }
        reset(Q, c) {
            this.K = c;
            this.style.set(2);
            this.O = this.D;
            this.j = this.J;
            this.W = this.O;
            const W = (Q << 2) + (c << 1);
            this.D.reset(W);
            this.J.reset(W);
            this.text.reset((Q << 2) + (c << 1) + 1)
        }
    }
      , Tyv = class {
        constructor(Q) {
            this.W = Q;
            this.K = 0;
            this.A = new X_a(this.W);
            this.D = new X_a(this.W);
            this.O = new U60;
            this.j = this.A
        }
        reset(Q) {
            this.K = Q;
            this.O.clear();
            this.j = this.A;
            this.A.reset(Q, 0);
            this.D.reset(Q, 1)
        }
    }
    ;
    var Aom = class {
        j() {}
    }
    ;
    var dE = class extends g.C8 {
        constructor(Q, c, W, m, K, T=!1, r=null) {
            super(Q, Q + c, {
                priority: W,
                namespace: "captions"
            });
            this.windowId = m;
            this.text = K;
            this.append = T;
            this.W = r
        }
        toString() {
            return super.toString()
        }
    }
    ;
    var mo = class extends g.qK {
        reset() {}
    }
    ;
    var wE = class extends g.C8 {
        constructor(Q, c, W, m, K) {
            super(Q, Q + c, {
                priority: W,
                namespace: "captions"
            });
            this.id = m;
            this.params = K;
            this.W = []
        }
        toString() {
            return super.toString()
        }
    }
      , Ly = 0;
    var eQ1 = class extends mo {
        constructor(Q) {
            super();
            this.j = Q;
            this.pens = {};
            this.L = {};
            this.Y = {};
            this.K = "_" + Ly++;
            this.J = {};
            this.O = this.W = null;
            this.D = !0
        }
        reset() {
            this.J = {};
            this.O = this.W = null;
            this.D = !0
        }
        A(Q, c) {
            Q = Q.firstChild;
            Q.getAttribute("format");
            c = c || 0;
            Number.isFinite(c);
            Q = Array.from(Q.childNodes);
            for (var W of Q)
                if (W.nodeType === 1)
                    switch (W.tagName) {
                    case "head":
                        var m = W;
                        break;
                    case "body":
                        var K = W
                    }
            if (m) {
                m = Array.from(m.childNodes);
                for (var T of m)
                    if (T.nodeType === 1)
                        switch (T.tagName) {
                        case "pen":
                            W = T.getAttribute("id");
                            m = this.pens;
                            Q = {};
                            var r = T.getAttribute("p");
                            r && Object.assign(Q, this.pens[r]);
                            r = jO(T, "b");
                            r != null && (Q.bold = r);
                            r = jO(T, "i");
                            r != null && (Q.italic = r);
                            r = jO(T, "u");
                            r != null && (Q.underline = r);
                            r = gE(T, "et");
                            r != null && (Q.charEdgeStyle = r);
                            r = gE(T, "of");
                            r != null && (Q.offset = r);
                            r = fy(T, "bc");
                            r != null && (Q.background = r);
                            r = fy(T, "ec");
                            r != null && (Q.Xf = r);
                            r = fy(T, "fc");
                            r != null && (Q.color = r);
                            r = gE(T, "fs");
                            r != null && r !== 0 && (Q.fontFamily = r);
                            r = b9(T, "sz");
                            r !== void 0 && (Q.fontSizeIncrement = r / 100 - 1);
                            r = b9(T, "bo");
                            r !== void 0 && (Q.backgroundOpacity = r / 255);
                            r = b9(T, "fo");
                            r !== void 0 && (Q.textOpacity = r / 255);
                            r = gE(T, "rb");
                            r != null && r !== 10 && r !== 0 && (Q.AQ = r > 10 ? r - 1 : r);
                            r = gE(T, "hg");
                            r != null && (Q.QK = r);
                            m[W] = Q;
                            break;
                        case "ws":
                            m = T.getAttribute("id");
                            this.Y[m] = eBm(this, T);
                            break;
                        case "wp":
                            m = T.getAttribute("id"),
                            this.L[m] = Vy4(this, T)
                        }
            }
            if (K) {
                T = [];
                K = Array.from(K.childNodes);
                for (S of K)
                    if (S.nodeType === 1)
                        switch (S.tagName) {
                        case "w":
                            this.W = BD1(this, S, c, !1);
                            (K = this.J[this.W.id]) && K.end > this.W.start && (K.end = this.W.start);
                            this.J[this.W.id] = this.W;
                            T.push(this.W);
                            break;
                        case "p":
                            var U = S;
                            Q = c;
                            K = [];
                            m = U.getAttribute("w") || this.K;
                            W = !!jO(U, "a");
                            Q = (b9(U, "t") || 0) + Q;
                            r = b9(U, "d") || 5E3;
                            W || (!this.D && this.O && this.O.windowId === m && this.O.end > Q && (this.O.end = Q),
                            this.O && this.O.text === "\n" && (this.O.text = ""));
                            const d = W ? 6 : 5;
                            var I = U.getAttribute("p");
                            I = I ? this.pens[I] : null;
                            const b = Array.from(U.childNodes);
                            b.length && (this.D = U.getAttribute("d") != null);
                            for (U = 0; U < b.length; U++) {
                                var X = b[U]
                                  , A = void 0;
                                U > 0 && (W = !0);
                                let w;
                                X.nodeType === 1 && (w = X);
                                if (w && w.tagName === "s") {
                                    if ((X = (X = w.getAttribute("p")) ? this.pens[X] : null) && X.AQ && (X.AQ === 1 ? (X = b.slice(U, U + 4),
                                    X.length === 4 && (A = Xw4(Q, r, m, W, d, X, this.pens),
                                    U += 3)) : A = Xw4(Q, r, m, W, d, [w], this.pens)),
                                    !A) {
                                        var e = w;
                                        A = Q;
                                        X = r;
                                        var V = m
                                          , B = W;
                                        const f = e.textContent ? e.textContent : "";
                                        var n = e.getAttribute("p");
                                        n = n ? this.pens[n] : null;
                                        e = b9(e, "t") || 0;
                                        A = new dE(A + e,X - e,d,V,f,B,n)
                                    }
                                } else
                                    A = new dE(Q,r,d,m,X.textContent || "",W,I);
                                K.push(A);
                                this.O = A
                            }
                            if (K.length > 0) {
                                K[0].windowId === this.K && (this.W = BD1(this, S, c, !0),
                                T.push(this.W));
                                for (const w of K)
                                    w.windowId = this.W.id,
                                    this.W.W.push(w),
                                    T.push(w)
                            }
                        }
                var S = T
            } else
                S = [];
            return S
        }
    }
    ;
    var V04 = new Map([[9, 1], [10, 1], [11, 2], [12, 3], [13, 4], [14, 5]])
      , ByH = class extends mo {
        constructor(Q) {
            super();
            this.D = Q;
            this.W = new Map;
            this.j = new Map;
            this.K = new Map;
            this.O = new Map
        }
        reset() {
            this.O.clear()
        }
        A(Q, c) {
            Q = JSON.parse(Q);
            if (!Q)
                return [];
            if (Q.pens) {
                var W = Q.pens
                  , m = 0;
                for (var K of W) {
                    W = {};
                    var T = K.pParentId;
                    T && Object.assign(W, this.W.get(T));
                    K.bAttr && (W.bold = !0);
                    K.iAttr && (W.italic = !0);
                    K.uAttr && (W.underline = !0);
                    T = K.ofOffset;
                    T != null && (W.offset = T);
                    K.szPenSize !== void 0 && (W.fontSizeIncrement = K.szPenSize / 100 - 1);
                    T = K.etEdgeType;
                    T != null && (W.charEdgeStyle = T);
                    K.ecEdgeColor !== void 0 && (W.Xf = vA(K.ecEdgeColor));
                    T = K.fsFontStyle;
                    T != null && T !== 0 && (W.fontFamily = T);
                    K.fcForeColor !== void 0 && (W.color = vA(K.fcForeColor));
                    K.foForeAlpha !== void 0 && (W.textOpacity = K.foForeAlpha / 255);
                    K.bcBackColor !== void 0 && (W.background = vA(K.bcBackColor));
                    K.boBackAlpha !== void 0 && (W.backgroundOpacity = K.boBackAlpha / 255);
                    (T = K.rbRuby) && T !== 10 && (W.AQ = T > 10 ? T - 1 : T,
                    W.textEmphasis = V04.get(W.AQ));
                    K.hgHorizGroup && (W.QK = K.hgHorizGroup);
                    this.W.set(m++, W)
                }
            }
            if (Q.wsWinStyles) {
                m = Q.wsWinStyles;
                K = 0;
                for (var r of m)
                    m = {},
                    (W = r.wsParentId) ? Object.assign(m, this.K.get(W)) : Object.assign(m, this.D),
                    r.mhModeHint !== void 0 && (m.R1 = r.mhModeHint),
                    r.juJustifCode !== void 0 && (m.textAlign = r.juJustifCode),
                    r.pdPrintDir !== void 0 && (m.oI = r.pdPrintDir),
                    r.sdScrollDir !== void 0 && (m.Yb = r.sdScrollDir),
                    r.wfcWinFillColor !== void 0 && (m.windowColor = vA(r.wfcWinFillColor)),
                    r.wfoWinFillAlpha !== void 0 && (m.windowOpacity = r.wfoWinFillAlpha / 255),
                    this.K.set(K++, m)
            }
            if (Q.wpWinPositions) {
                K = Q.wpWinPositions;
                r = 0;
                for (var U of K)
                    K = {},
                    (m = U.wpParentId) && Object.assign(K, this.j.get(m)),
                    U.ahHorPos !== void 0 && (K.kc = U.ahHorPos),
                    U.apPoint !== void 0 && (K.bW = U.apPoint),
                    U.avVerPos !== void 0 && (K.ZB = U.avVerPos),
                    U.ccCols !== void 0 && (K.y4 = U.ccCols),
                    U.rcRows !== void 0 && (K.lS = U.rcRows),
                    this.j.set(r++, K)
            }
            if (Q.events) {
                Q = Q.events;
                U = [];
                for (const G of Q)
                    if (r = (G.tStartMs || 0) + c,
                    K = G.dDurationMs || 0,
                    G.id)
                        m = String(G.id),
                        Q = xy0(this, G, r, K, m),
                        U.push(Q),
                        this.O.set(m, Q);
                    else {
                        G.wWinId ? m = G.wWinId.toString() : (m = "_" + Ly++,
                        Q = xy0(this, G, r, K, m),
                        U.push(Q),
                        this.O.set(m, Q));
                        Q = U;
                        var I = G;
                        K === 0 && (K = 5E3);
                        W = this.O.get(m);
                        const T7 = (T = !!I.aAppend) ? 6 : 5
                          , oW = I.segs;
                        let G7 = null;
                        I.pPenId && (G7 = this.W.get(I.pPenId));
                        for (I = 0; I < oW.length; I++) {
                            var X = oW[I]
                              , A = X.utf8;
                            if (A) {
                                var e = X.tOffsetMs || 0;
                                let yn = null;
                                X.pPenId && (yn = this.W.get(X.pPenId));
                                if ((W.params.R1 != null ? W.params.R1 : W.W.length > 1 ? 1 : 0) === 2 && T && A === "\n")
                                    continue;
                                X = null;
                                var V = [], B;
                                if (B = yn && yn.AQ === 1)
                                    a: {
                                        B = oW;
                                        var n = I;
                                        if (n + 3 >= B.length || !B[n + 1].pPenId || !B[n + 2].pPenId || !B[n + 3].pPenId) {
                                            B = !1;
                                            break a
                                        }
                                        var S = B[n + 1].pPenId;
                                        (S = this.W.get(S)) && S.AQ && S.AQ === 2 ? (S = B[n + 2].pPenId,
                                        S = this.W.get(S),
                                        !S || !S.AQ || S.AQ < 3 ? B = !1 : (S = B[n + 3].pPenId,
                                        B = (S = this.W.get(S)) && S.AQ && S.AQ === 2 ? !0 : !1)) : B = !1
                                    }
                                if (B)
                                    e = oW[I + 1].utf8,
                                    X = oW[I + 3].utf8,
                                    B = oW[I + 2].utf8,
                                    n = this.W.get(oW[I + 2].pPenId),
                                    A = IcH(A, e, B, X, n),
                                    X = new dE(r,K,T7,m,A,T,yn),
                                    I += 3;
                                else {
                                    if (A.indexOf("<") > -1) {
                                        V = yn;
                                        B = G7;
                                        n = r;
                                        S = K;
                                        var d = e
                                          , b = T7
                                          , w = T;
                                        const $x = [];
                                        var f = g.yd(`<html>${A}</html>`);
                                        if (!f.getElementsByTagName("parsererror").length && f.firstChild?.childNodes.length)
                                            for (const z7 of f.firstChild.childNodes) {
                                                f = z7.textContent?.replace(/\n/g, "") ?? "";
                                                if (z7.nodeType === 3 && (!f || f.match(/^ *$/) != null))
                                                    continue;
                                                const wT = {};
                                                Object.assign(wT, V || B);
                                                switch (z7?.tagName) {
                                                case "b":
                                                    wT.bold = !0;
                                                    break;
                                                case "i":
                                                    wT.italic = !0;
                                                    break;
                                                case "u":
                                                    wT.underline = !0
                                                }
                                                $x.push(new dE(n + d,S - d,b,W.id,f,w,wT))
                                            }
                                        V = $x
                                    }
                                    V.length || (V = [new dE(r + e,K - e,T7,W.id,A,T,yn || G7)])
                                }
                                if (V.length)
                                    for (const $x of V)
                                        Q.push($x),
                                        W.W.push($x);
                                else
                                    X && (Q.push(X),
                                    W.W.push(X))
                            }
                            T = !0
                        }
                    }
                c = U
            } else
                c = [];
            return c
        }
    }
    ;
    var x6v = class extends g.Ci {
        constructor(Q, c, W) {
            super(Q);
            this.videoData = c;
            this.audioTrack = W;
            this.Y = c.Hf
        }
        j(Q, c, W) {
            wW1(this.videoData.videoId, Q.vssId, W.Zn)
        }
        K(Q) {
            if (this.audioTrack)
                for (const c of this.audioTrack.captionTracks)
                    g.$m(this.W, c);
            Q.Kw()
        }
    }
    ;
    var RBa = class extends cK {
        constructor(Q, c, W, m, K, T, r, U, I, X) {
            super(Q, c, W, m, K, T, r, U, I, X);
            this.type = 1
        }
        XI(Q) {
            const c = this.O.W;
            super.XI(Q);
            let W, m;
            for (Q = Q.length; Q < c.length; Q++) {
                const K = c[Q];
                let T;
                m && K.W === W ? T = m : (T = {},
                Object.assign(T, K.W),
                Object.assign(T, qBH),
                W = K.W,
                m = T);
                JCi(this, K, T)
            }
        }
    }
      , qBH = {
        iH: !0
    };
    var qV9 = class extends Aom {
        constructor(Q, c) {
            super();
            this.trackData = Q;
            this.D = c;
            this.version = this.K = this.A = this.byteOffset = 0;
            this.O = [];
            this.W = new DataView(this.trackData)
        }
        j(Q, c, W, m, K) {
            if (W < m) {
                const T = "_" + Ly++;
                W = W / 1E3 - this.D;
                m = m / 1E3 - this.D;
                Q = new wE(W,m - W,5,T,{
                    textAlign: 0,
                    bW: 0,
                    kc: c * 2.5,
                    ZB: Q * 5.33
                });
                K = new dE(W,m - W,5,T,K);
                this.O.push(Q);
                this.O.push(K)
            }
        }
    }
      , nCv = class extends mo {
        constructor(Q, c) {
            super();
            this.O = Q;
            this.j = c;
            this.track = this.j.languageName === "CC3" ? 4 : 0;
            this.W = new oCW;
            this.W.O = 1 << this.track
        }
        A(Q) {
            Q = new qV9(Q,this.O);
            if (nHD(Q)) {
                for (; Q.byteOffset < Q.W.byteLength; )
                    for (Q.version === 0 ? Q.A = Gl(Q) * (1E3 / 45) : Q.version === 1 && (Q.A = Gl(Q) * 4294967296 + Gl(Q)),
                    Q.K = af(Q); Q.K > 0; Q.K--) {
                        var c = af(Q);
                        const W = af(Q)
                          , m = af(Q);
                        c & 4 && (c & 3) === this.track && (this.track === 0 || this.track === 1) && (c = this.W,
                        c.W.push({
                            time: Q.A,
                            type: this.track,
                            gZ: W,
                            H2: m,
                            order: c.W.length
                        }))
                    }
                Q6a(this.W, Q);
                return Q.O
            }
            return []
        }
        reset() {
            this.W.clear()
        }
    }
    ;
    var ks9 = class extends cK {
        constructor(Q, c, W, m, K, T, r, U, I, X) {
            super(Q, c, W, m, K, T, r, U, I, X);
            this.type = 2;
            this.Ie = [];
            this.b0 = this.S = this.UH = 0;
            this.MM = NaN;
            this.Xw = 0;
            this.Ww = null;
            this.d3 = new g.Uc(this.Y0,433,this);
            this.K && (X.createClientVe(this.K, this, 167342),
            this.B(this.K, "click", () => {
                X.logClick(this.K)
            }
            ),
            Q = new g.iG(this.element,!0),
            g.F(this, Q),
            Q.subscribe("hoverstart", () => {
                X.logVisibility(this.K, !0)
            }
            , this));
            g.xK(this.element, "ytp-caption-window-rollup");
            g.F(this, this.d3);
            g.JA(this.element, "overflow", "hidden")
        }
        Sh() {
            g.I9(this.d3)
        }
        Y0() {
            this.element.removeEventListener("transitionend", this.Y0, !1);
            g.n6(this.element, "ytp-rollup-mode");
            this.L(this.Ww, !0)
        }
        MQ() {
            return this.j ? this.b0 : this.S
        }
        qQ() {
            return this.j ? this.S : this.b0
        }
        L(Q, c) {
            this.Ww = Q;
            if (this.O.params.lS) {
                var W = 0;
                for (let m = 0; m < this.D.length && W < Q.length; m++)
                    this.D[m] === Q[W] && W++;
                W > 0 && W < Q.length && (Q = this.D.concat(Q.slice(W)));
                this.Xw = this.b0;
                this.S = this.b0 = 0;
                super.L(Q);
                NDa(this, c)
            }
            super.L(Q)
        }
    }
    ;
    var D6D = class {
        constructor(Q, c, W, m) {
            this.U = Q;
            this.K = c;
            this.logger = W;
            this.UC = m;
            this.h3 = [];
            this.W = null;
            this.A = [];
            this.U8 = [];
            this.O = null;
            this.Rk = {
                hJa: () => this.O,
                pU: () => this.h3,
                U6e: K => {
                    this.A = K
                }
                ,
                DYe: () => this.A
            };
            Q = g.Um(this.U.G().experiments, "html5_override_micro_discontinuities_threshold_ms");
            this.j = Q > 0 ? Q : 10
        }
        unload() {
            this.O != null && (this.U.removeEventListener("sabrCaptionsDataLoaded", this.O),
            this.O = null);
            this.h3 = [];
            this.W = null;
            this.A = [];
            this.U.publish("sabrCaptionsBufferedRangesUpdated", this.h3)
        }
        aH(Q) {
            return {
                formatId: g.PT(Q.info.OH.info, this.UC),
                DF: Q.info.DF + (this.UC ? 0 : 1),
                startTimeMs: Q.info.j * 1E3,
                durationMs: Q.info.L * 1E3
            }
        }
    }
    ;
    var t0a = class extends g.Ci {
        constructor(Q, c) {
            super(c);
            this.O = Q;
            this.U = c;
            this.logger = new g.JY("caps");
            this.L = this.b0 = null;
            this.mF = new D6D(this.U,this,this.logger,this.O.UC)
        }
        j(Q, c, W) {
            this.A();
            c = Q.getId();
            c = c != null && c in this.O.W ? this.O.W[c] : null;
            c || (c = Q.languageCode,
            c = this.O.isManifestless ? s6W(this, c, "386") : s6W(this, c));
            c && (this.L = Q,
            this.b0 = c,
            ZUZ(this.mF, W),
            this.U.publish("sabrCaptionsTrackChanged", g.PT(c.info, this.O.UC)))
        }
        K(Q) {
            var c = this.O.isManifestless ? dy9(this, "386") : dy9(this);
            for (const W of c)
                g.$m(this.W, W);
            Q.Kw()
        }
        A() {
            this.L && (this.L = this.b0 = null,
            this.mF.unload(),
            this.U.publish("sabrCaptionsTrackChanged", null))
        }
        D() {
            return ""
        }
    }
    ;
    var L49 = "WEBVTT".split("").map(Q => Q.charCodeAt(0))
      , fcm = class extends mo {
        constructor() {
            super()
        }
        A(Q, c) {
            Q instanceof ArrayBuffer && (Q = g.o8(new Uint8Array(Q)));
            const W = [];
            Q = Q.split(HVD);
            for (let n = 1; n < Q.length; n++) {
                var m = Q[n]
                  , K = c;
                if (m !== "" && !NyS.test(m)) {
                    var T = KB.exec(m);
                    if (T && T.length >= 4) {
                        var r = $X(T[1])
                          , U = $X(T[2]) - r;
                        r += K;
                        var I = (T = T[3]) ? T.split(" ") : [];
                        T = {};
                        var X = null;
                        var A = "";
                        var e = null
                          , V = "";
                        for (const S of I) {
                            I = S.split(":");
                            if (I.length !== 2)
                                continue;
                            var B = I[1];
                            switch (I[0]) {
                            case "line":
                                I = B.split(",");
                                I[0].endsWith("%") && (X = I[0],
                                T.ZB = Number.parseInt(X, 10),
                                I.length === 2 && (A = I[1].trim()));
                                break;
                            case "position":
                                I = B.split(",");
                                e = I[0];
                                T.kc = Number.parseInt(e, 10);
                                I.length === 2 && (V = I[1].trim());
                                break;
                            case "align":
                                switch (B) {
                                case "start":
                                    T.textAlign = 0;
                                    break;
                                case "middle":
                                    T.textAlign = 2;
                                    break;
                                case "end":
                                    T.textAlign = 1
                                }
                            }
                        }
                        X || A || (A = "end");
                        if (!e)
                            switch (T.textAlign) {
                            case 0:
                                T.kc = 0;
                                break;
                            case 1:
                                T.kc = 100;
                                break;
                            case 2:
                                T.kc = 50
                            }
                        if (T.textAlign != null) {
                            X = 0;
                            switch (A) {
                            case "center":
                                X += 3;
                                break;
                            case "end":
                                X += 6;
                                break;
                            default:
                                X += 0
                            }
                            switch (V) {
                            case "line-left":
                                X += 0;
                                break;
                            case "center":
                                X += 1;
                                break;
                            case "line-right":
                                X += 2;
                                break;
                            default:
                                switch (T.textAlign) {
                                case 0:
                                    X += 0;
                                    break;
                                case 2:
                                    X += 1;
                                    break;
                                case 1:
                                    X += 2
                                }
                            }
                            A = X < 0 || X > 8 ? 7 : X;
                            T.bW = A
                        }
                        m = m.substring(KB.lastIndex).replace(/[\x01-\x09\x0b-\x1f]/g, "");
                        V = T;
                        T = m;
                        m = {};
                        if (T.indexOf("<") < 0 && T.indexOf("&") < 0)
                            K = bU4(r, U, 5, V),
                            U = new dE(r,U,5,K.id,T,!1,g.P9(m) ? void 0 : m),
                            W.push(K),
                            W.push(U),
                            K.W.push(U);
                        else
                            for (A = T.split(iVW),
                            A.length === 1 ? (T = 5,
                            V = bU4(r, U, T, V)) : (X = T = 6,
                            V = Object.assign({
                                y4: 32
                            }, V),
                            V = new wE(r,U,X,"_" + Ly++,V)),
                            W.push(V),
                            X = r,
                            e = 0; e < A.length; e++)
                                if (I = A[e],
                                e % 2 === 0) {
                                    B = g.yd(`<html>${I}</html>`);
                                    let S;
                                    B.getElementsByTagName("parsererror").length ? (S = B.createElement("span"),
                                    S.appendChild(B.createTextNode(I))) : S = B.firstChild;
                                    j6D(this, X, U - (X - r), T, V, e > 0, S, m, W)
                                } else
                                    X = $X(I) + K
                    }
                    KB.lastIndex = 0
                }
            }
            return W
        }
    }
      , NyS = /^NOTE/
      , HVD = /(?:\r\n|\r|\n){2,}/
      , KB = RegExp("^((?:[\\d]{2}:)?[\\d]{2}:[\\d]{2}\\.[\\d]{3})[\\t ]+--\x3e[\\t ]+((?:[\\d]{2}:)?[\\d]{2}:[\\d]{2}\\.[\\d]{3})(?:[\\t ]*)(.*)(?:\\r\\n|\\r|\\n)", "gm")
      , iVW = RegExp("<((?:[\\d]{2}:)?[\\d]{2}:[\\d]{2}\\.[\\d]{3})>");
    var yom = class extends g.qK {
        constructor(Q, c) {
            super();
            this.U = Q;
            this.FI = c;
            this.W = null;
            this.Z1 = this.U.ej();
            this.logger = new g.JY("caps")
        }
        clear() {
            this.W && this.W.dispose();
            this.W = null
        }
        reset() {
            this.W && this.W.reset()
        }
        WA() {
            super.WA();
            this.clear()
        }
    }
    ;
    var PA = {
        windowColor: "#080808",
        windowOpacity: 0,
        textAlign: 2,
        bW: 7,
        kc: 50,
        ZB: 100,
        isDefault: !0,
        T1: {
            background: "#080808",
            backgroundOpacity: .75,
            charEdgeStyle: 0,
            color: "#fff",
            fontFamily: 4,
            fontSizeIncrement: 0,
            textOpacity: 1,
            offset: 1
        }
    };
    g.GN("captions", class extends g.zj {
        constructor(Q) {
            super(Q);
            this.U = Q;
            this.MM = [];
            this.b0 = {};
            this.UH = {};
            this.J = !1;
            this.A = "NONE";
            this.W = this.Y = this.mF = this.PA = this.La = null;
            this.EC = {
                Kw: () => {
                    this.Kw()
                }
                ,
                Zn: (m, K, T, r, U=0) => {
                    const I = Number(this.videoData.G().Ty().W.BA(g.Jc7) ?? 0);
                    U > 0 && I > 0 && this.videoData.lengthSeconds > 0 && U / this.videoData.lengthSeconds > I ? this.U.tJ("tts", {
                        dropcap: U
                    }) : this.Zn(m, K, T, r)
                }
            };
            this.O = null;
            this.FI = this.U.G();
            this.videoData = this.U.getVideoData();
            this.Re = this.U.bX();
            this.K = {
                T1: {}
            };
            this.D = {
                T1: {}
            };
            this.videoData.MQ() ? this.A = "OFFLINE" : g.Cr7(this.videoData, this.U) ? this.A = "HLS" : EHi(this.videoData, this.U) ? this.A = "SABR_LIVE" : g.MJX(this.videoData, this.U) ? this.A = "LIVE" : this.videoData.captionTracks.length ? this.A = "INNERTUBE" : this.videoData.sC && (this.A = "TTS");
            this.XI = this.FI.controlsType === "3";
            this.HA = new yom(this.U,this.FI);
            this.T2 = new g.db(this);
            this.L = new g.k({
                C: "div",
                Z: "ytp-caption-window-container",
                N: {
                    id: "ytp-caption-window-container"
                }
            });
            this.S = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                width: 1,
                height: 1
            };
            let c = null;
            const W = g.Ku("yt-html5-player-modules::subtitlesModuleData");
            W && (c = new g.P7(W));
            this.storage = c;
            this.Y0 = !!Q.Yx()?.Ie();
            this.j = Gs4(this);
            this.Ie = !this.j && this.XI && this.Y0 && (this.A === "LIVE" || this.A === "SABR_LIVE");
            g.F(this, this.HA);
            this.j ? this.jG = this.Ka = null : (this.Ka = new g.T5(this.iX,void 0,this),
            g.F(this, this.Ka),
            this.jG = new g.Uc(this.Sh,2E3,this),
            g.F(this, this.jG));
            g.F(this, this.T2);
            g.f8(this.player, this.L.element, 4);
            g.F(this, this.L);
            this.j || this.T2.B(Q, "resize", this.Fw);
            (this.WB = g.Ax(this.FI) && !g.JE() && !this.U.isFullscreen() && !this.j && !this.Ie) && this.T2.B(Q, "resize", this.MQ);
            this.T2.B(Q, "onPlaybackAudioChange", this.sC);
            this.T2.B(Q, g.Sr("captions"), m => {
                this.onCueRangeEnter(m)
            }
            );
            this.T2.B(Q, g.FC("captions"), m => {
                this.onCueRangeExit(m)
            }
            );
            l9(this, NC() || {});
            g.tV(this.player, "onCaptionsModuleAvailable");
            this.A === "HLS" && this.j && (Q = this.U.Yx().Ae(),
            this.Y0 && this.T2.B(Q.textTracks, "addtrack", this.qQ))
        }
        WA() {
            if (this.j || this.Ie) {
                const Q = this.U.Yx();
                Q && !Q.u0() && Q.J()
            } else
                u9(this, !1);
            super.WA()
        }
        h1() {
            return this.FI.X("html5_honor_caption_availabilities_in_audio_track") && this.A !== "LIVE" && this.A !== "SABR_LIVE"
        }
        B1() {
            if (this.XI)
                return this.j || this.Ie;
            if (this.A === "HLS")
                return this.j;
            var Q = this.getAudioTrack();
            if (this.h1()) {
                if (!Q.captionTracks.length)
                    return !1;
                if (!this.W)
                    return !0
            }
            Q = tu(Q, g.rT(this.FI));
            return Q === "CAPTIONS_INITIAL_STATE_ON_REQUIRED" ? !0 : Q === "CAPTIONS_INITIAL_STATE_OFF_REQUIRED" ? zl(this) : hu(this) || zl(this) ? !0 : lcZ(this)
        }
        load() {
            super.load();
            this.Y = this.getAudioTrack();
            if (this.W)
                this.O && (this.HA.clear(),
                this.j ? uvo(this, !0) : this.player.getPresentingPlayerType() !== 3 && this.W.j(this.O, "json3", this.EC),
                this.A !== "HLS" && this.j || this.Ie || Cy(this) || g.tV(this.player, "captionschanged", g.H2(this.O)));
            else {
                let Q;
                this.A === "OFFLINE" ? Q = new x6v(this.player,this.videoData,this.getAudioTrack()) : this.A === "SABR_LIVE" ? Q = new t0a(this.videoData.W,this.player) : this.A === "HLS" ? Q = new QPa(this.player) : this.A === "LIVE" ? Q = new m6v(this.videoData.W,this.player) : this.A === "INNERTUBE" ? Q = new g.M0(this.player,this.videoData,this.getAudioTrack()) : Q = new g.Jc(this.player,this.videoData.sC,this.videoData.videoId,g.qUw(this.videoData),this.videoData.rX,this.videoData.eventId);
                this.W = Q;
                g.F(this, this.W);
                this.W.K(this.EC)
            }
        }
        unload() {
            this.j && this.O ? uvo(this, !1) : (this.jG && this.jG.fB(),
            this.player.qI("captions"),
            this.MM = [],
            this.W && this.W.A(),
            this.HA.clear(),
            this.mF && this.player.mV(this.mF),
            this.Fw());
            super.unload();
            this.player.FP();
            g.tV(this.player, "captionschanged", {})
        }
        create() {
            this.B1() && this.load();
            var Q;
            a: {
                if (this.FI.X("web_player_nitrate_promo_tooltip") && this.videoData.getPlayerResponse()?.captions?.playerCaptionsTracklistRenderer?.enableTouchCaptionsNitrate && (Q = this.videoData.getPlayerResponse()?.captions?.playerCaptionsTracklistRenderer?.captionTracks))
                    for (const c of Q)
                        if (c.kind === "asr" && c.languageCode === "en") {
                            Q = !0;
                            break a
                        }
                Q = !1
            }
            Q && this.U.publish("showpromotooltip", this.L.element)
        }
        Kw() {
            var Q = tu(this.player.getAudioTrack(), g.rT(this.FI));
            var c = Q === "CAPTIONS_INITIAL_STATE_ON_REQUIRED" ? Ju(this, this.J) : Q === "CAPTIONS_INITIAL_STATE_OFF_REQUIRED" && zl(this) ? MC(this) : hu(this) || this.J || lcZ(this) ? Ju(this, this.J) : zl(this) ? MC(this) : null;
            if (this.A !== "HLS" && this.j || this.Ie) {
                const W = g.H6(this.W.W, !0);
                Q = [];
                for (let m = 0; m < W.length; m++) {
                    const K = W[m]
                      , T = g.HB("TRACK");
                    T.setAttribute("kind", "subtitles");
                    T.setAttribute("label", g.tR(K));
                    T.setAttribute("srclang", g.Na(K));
                    T.setAttribute("id", K.toString());
                    this.Ie || T.setAttribute("src", this.W.D(K, "vtt"));
                    K === c && T.setAttribute("default", "1");
                    Q.push(T)
                }
                c = this.U.Yx();
                c.mF(Q);
                Q = c.Ae();
                this.Y0 && this.T2.B(Q.textTracks, "change", this.Xw)
            } else
                !this.O && c && QY(this, c),
                g.tV(this.player, "onCaptionsTrackListChanged"),
                g.Ht(this.player, "onApiChange")
        }
        getTrackById(Q) {
            const c = g.H6(this.W.W, !0);
            for (let W = 0; W < c.length; W++)
                if (c[W].toString() === Q)
                    return c[W];
            return null
        }
        Xw() {
            const Q = this.U.Yx().Ae().textTracks;
            let c = null;
            for (let W = 0; W < Q.length; W++)
                Q[W].mode === "showing" && (c = this.getTrackById(Q[W].id));
            (this.loaded ? this.O : null) !== c && QY(this, c, !0)
        }
        qQ() {
            this.W?.K(this.EC)
        }
        FW() {
            !this.O && this.j || this.unload()
        }
        Zn(Q, c, W, m) {
            if (Q) {
                py(this, this.O ?? void 0);
                this.W.S() && (this.MM = [],
                this.U.qI("captions"),
                DG(this.Ka),
                this.HA.reset());
                a: {
                    var K = this.HA;
                    m = m || 0;
                    W = OUi(K, Q, W || 0);
                    Q = [];
                    try {
                        for (const b of W) {
                            const w = b.trackData
                              , f = b.VF
                              , G = K.FI.X("safari_live_drm_captions_fix");
                            if (typeof w !== "string") {
                                W = Q;
                                var T = W.concat;
                                if (G && wwa(w))
                                    var r = vHa(K, w, f);
                                else {
                                    var U = K
                                      , I = c
                                      , X = w
                                      , A = f
                                      , e = m;
                                    if (!DyH(X))
                                        throw Error("Invalid binary caption track data");
                                    U.W || (U.W = new nCv(e,I));
                                    r = U.W.A(X, A)
                                }
                                var V = T.call(W, r)
                            } else {
                                if (w.substring(0, 6) === "WEBVTT")
                                    var B = Q.concat(vHa(K, w, f));
                                else {
                                    W = Q;
                                    var n = W.concat;
                                    b: {
                                        I = K;
                                        U = c;
                                        if (w[0] === "{")
                                            try {
                                                I.W || (I.W = new ByH(ac0(U)));
                                                var S = I.W.A(w, f);
                                                break b
                                            } catch (G7) {
                                                g.Zf(G7);
                                                S = [];
                                                break b
                                            }
                                        const T7 = g.yd(w);
                                        if (!T7 || !T7.firstChild) {
                                            const G7 = Error("Invalid caption track data");
                                            G7.params = w;
                                            throw G7;
                                        }
                                        if (T7.firstChild.tagName === "timedtext") {
                                            if (Number(T7.firstChild.getAttribute("format")) === 3) {
                                                X = T7;
                                                I.W || (I.W = new eQ1(ac0(U)));
                                                S = I.W.A(X, f);
                                                break b
                                            }
                                            const G7 = Error("Unsupported subtitles format in web player (Format2)");
                                            G7.params = w;
                                            throw G7;
                                        }
                                        if (T7.firstChild.tagName === "transcript") {
                                            const G7 = Error("Unsupported subtitles format in web player (Format1)");
                                            G7.params = w;
                                            throw G7;
                                        }
                                        const oW = Error("Invalid caption track data");
                                        oW.params = w;
                                        throw oW;
                                    }
                                    B = n.call(W, S)
                                }
                                V = B
                            }
                            Q = V
                        }
                        var d = Q;
                        break a
                    } catch (b) {
                        g.RX(K.logger, 187101178, `Captions parsing failed: ${b.message}. `);
                        K.clear();
                        d = [];
                        break a
                    }
                    d = void 0
                }
                this.FI.X("html5_sabr_live_support_subfragmented_captions") && this.W instanceof t0a && (c = this.W.mF,
                K = [],
                d.length > 0 && (K = d.slice(c.A.length)),
                c.A = !c.W || c.W.info.A ? [] : d,
                d = K);
                d.length > 0 && (c = this.O,
                this.q6(c, !!c, Cy(this) ? "g" : this.J ? "m" : "s"));
                this.player.mV(d, void 0, this.A === "LIVE" || this.A === "SABR_LIVE");
                !this.J || this.Ie || Cy(this) || g.AI(this.FI) || g.X7(this.FI) || g.uL(this.FI) || this.FI.b0 === "shortspage" || this.player.isInline() || (this.jG.fB(),
                d = As4({
                    bW: 0,
                    kc: 5,
                    ZB: 5,
                    lS: 2,
                    textAlign: 0,
                    oI: 0,
                    lang: "en"
                }),
                this.PA = [d],
                c = ["Click ", " for settings"],
                this.La || (K = new g.Mu(g.iL()),
                g.F(this, K),
                this.La = K.element),
                K = d.end - d.start,
                (V = g.tR(this.O)) && this.PA.push(new dE(d.start,K,0,d.id,V)),
                this.PA.push(new dE(d.start,K,0,d.id,c[0]), new dE(d.start,K,0,d.id,this.La,!0), new dE(d.start,K,0,d.id,c[1],!0)),
                this.player.mV(this.PA),
                this.jG.cw());
                !this.J || this.Ie || Cy(this) || (this.FI.X("enable_player_captions_persistence_state_machine") ? Rf(this, !0) : g.rT(this.FI) ? kX(this, !0) : YX(this, !0),
                this.Y && (this.Y.j = this.O),
                this.player.FP());
                this.J = !1
            }
        }
        onCueRangeEnter(Q) {
            this.MM.push(Q);
            DG(this.Ka)
        }
        onCueRangeExit(Q) {
            g.o0(this.MM, Q);
            this.W instanceof m6v && this.W.b0 && this.player.bc([Q]);
            DG(this.Ka)
        }
        getCaptionWindowContainerId() {
            return this.L.element.id
        }
        Sh() {
            $ya(this, this.PA);
            this.PA = null
        }
        iX() {
            if (!this.WB || !this.j) {
                this.Ka.stop();
                g.lD(this.UH);
                this.MM.sort(g.yq);
                var Q = this.MM;
                if (this.mF) {
                    const c = g.uw(Q, function(W) {
                        return this.mF.indexOf(W) === -1
                    }, this);
                    c.length && (Q = c)
                }
                for (const c of Q)
                    c instanceof wE ? CF9(this, c) : MyD(this, c);
                for (const [c,W] of Object.entries(this.b0)) {
                    const m = c
                      , K = W;
                    this.UH[m] ? (K.element.parentNode || (K instanceof ks9 || K instanceof RBa || g.Lm(this.b0, (T, r) => {
                        r !== m && T.O.params.bW === K.O.params.bW && T.O.params.kc === K.O.params.kc && T.O.params.ZB === K.O.params.ZB && (T.dispose(),
                        delete this.b0[r]);
                        return r === m
                    }
                    , this),
                    this.L.element.appendChild(K.element)),
                    K.L(this.UH[m])) : (K.dispose(),
                    delete this.b0[m])
                }
            }
        }
        Vb() {
            l9(this, {}, !0);
            g.tV(this.player, "captionssettingschanged")
        }
        oi() {
            var Q = PA.T1;
            Q = {
                background: Q.background,
                backgroundOpacity: Q.backgroundOpacity,
                charEdgeStyle: Q.charEdgeStyle,
                color: Q.color,
                fontFamily: Q.fontFamily,
                fontSizeIncrement: Q.fontSizeIncrement,
                fontStyle: Q.bold && Q.italic ? 3 : Q.bold ? 1 : Q.italic ? 2 : 0,
                textOpacity: Q.textOpacity,
                windowColor: PA.windowColor,
                windowOpacity: PA.windowOpacity
            };
            const c = NC() || {};
            c.background != null && (Q.background = c.background);
            c.backgroundOverride != null && (Q.backgroundOverride = c.backgroundOverride);
            c.backgroundOpacity != null && (Q.backgroundOpacity = c.backgroundOpacity);
            c.backgroundOpacityOverride != null && (Q.backgroundOpacityOverride = c.backgroundOpacityOverride);
            c.charEdgeStyle != null && (Q.charEdgeStyle = c.charEdgeStyle);
            c.charEdgeStyleOverride != null && (Q.charEdgeStyleOverride = c.charEdgeStyleOverride);
            c.color != null && (Q.color = c.color);
            c.colorOverride != null && (Q.colorOverride = c.colorOverride);
            c.fontFamily != null && (Q.fontFamily = c.fontFamily);
            c.fontFamilyOverride != null && (Q.fontFamilyOverride = c.fontFamilyOverride);
            c.fontSizeIncrement != null && (Q.fontSizeIncrement = c.fontSizeIncrement);
            c.fontSizeIncrementOverride != null && (Q.fontSizeIncrementOverride = c.fontSizeIncrementOverride);
            c.fontStyle != null && (Q.fontStyle = c.fontStyle);
            c.fontStyleOverride != null && (Q.fontStyleOverride = c.fontStyleOverride);
            c.textOpacity != null && (Q.textOpacity = c.textOpacity);
            c.textOpacityOverride != null && (Q.textOpacityOverride = c.textOpacityOverride);
            c.windowColor != null && (Q.windowColor = c.windowColor);
            c.windowColorOverride != null && (Q.windowColorOverride = c.windowColorOverride);
            c.windowOpacity != null && (Q.windowOpacity = c.windowOpacity);
            c.windowOpacityOverride != null && (Q.windowOpacityOverride = c.windowOpacityOverride);
            return Q
        }
        RJ(Q, c) {
            const W = {};
            Object.assign(W, NC());
            Object.assign(W, Q);
            l9(this, W, c);
            g.tV(this.player, "captionssettingschanged")
        }
        Fw() {
            !this.j && this.loaded && (g.ZS(this.b0, function(Q, c) {
                Q.dispose();
                delete this.b0[c]
            }, this),
            this.iX())
        }
        aI(Q, c) {
            switch (Q) {
            case "fontSize":
                if (isNaN(c))
                    break;
                Q = g.lm(c, -2, 4);
                this.RJ({
                    fontSizeIncrement: Q
                });
                return Q;
            case "reload":
                c && !this.j && QY(this, this.O, !0);
                break;
            case "stickyLoading":
                c !== void 0 && this.FI.L && (this.FI.X("enable_player_captions_persistence_state_machine") ? Rf(this, !(!c || !c.userInitiated)) : g.rT(this.FI) ? kX(this, !!c) : YX(this, !!c));
                break;
            case "track":
                return YVa(this, c);
            case "tracklist":
                return this.W ? g.hy(g.H6(this.W.W, !(!c || !c.includeAsr)), W => g.H2(W)) : [];
            case "translationLanguages":
                return this.W ? this.W.Y.map(W => Object.assign({}, W)) : [];
            case "sampleSubtitles":
                this.j || c === void 0 || u9(this, !!c);
                break;
            case "sampleSubtitlesCustomized":
                this.j || u9(this, !!c, c);
                break;
            case "recommendedTranslationLanguages":
                return g.Us();
            case "defaultTranslationSourceTrackIndices":
                return this.W ? this.W.T2 : []
            }
        }
        getOptions() {
            const Q = "reload fontSize track tracklist translationLanguages sampleSubtitle".split(" ");
            this.FI.L && Q.push("stickyLoading");
            return Q
        }
        N$() {
            let Q = this.O;
            if (this.U.h2("captions")) {
                if (this.FI.X("html5_modify_caption_vss_logging"))
                    return (Q = this.videoData.OJ ?? null) ? {
                        cc: g.Haw(Q)
                    } : {};
                if (Q) {
                    let c = Q.vssId;
                    Q.translationLanguage && c && (c = `t${c}.${g.Na(Q)}`);
                    return {
                        cc: c
                    }
                }
            }
            return {}
        }
        sj(Q) {
            this.isSubtitlesOn() ? (this.FI.X("enable_player_captions_persistence_state_machine") && Q ? Rf(this, !1) : g.rT(this.FI) ? kX(this, !1) : YX(this, !1),
            py(this),
            QY(this, null, !0)) : this.D8(Q)
        }
        D8(Q) {
            const c = Cy(this) || !this.O ? Ju(this, !0) : this.O;
            c && this.SQ(c.vssId, "m");
            this.isSubtitlesOn() || QY(this, c, this.FI.X("enable_player_captions_persistence_state_machine") ? Q : !0)
        }
        isSubtitlesOn() {
            return !!this.loaded && !!this.O && !Cy(this)
        }
        sC() {
            const Q = Cy(this);
            zl(this, Q) ? QY(this, this.getAudioTrack().W, !1) : this.videoData.captionTracks.length && (this.loaded && this.unload(),
            this.h1() && (this.J = !1,
            this.O = null,
            this.W && (this.W.dispose(),
            this.W = null)),
            this.B1() && (Q ? QY(this, Ju(this, !1), !1) : this.load()))
        }
        iz(Q) {
            Q && (this.S = {
                top: Q.top,
                right: Q.right,
                bottom: Q.bottom,
                left: Q.left,
                width: 1 - Q.left - Q.right,
                height: 1 - Q.top - Q.bottom
            },
            this.L.element.style.top = `${this.S.top * 100}%`,
            this.L.element.style.left = `${this.S.left * 100}%`,
            this.L.element.style.width = `${this.S.width * 100}%`,
            this.L.element.style.height = `${this.S.height * 100}%`,
            this.L.element.style.position = "absolute",
            Q = Js1(this)) && (this.L.element.style.width = `${Q.width}px`,
            this.L.element.style.height = `${Q.height}px`)
        }
        onVideoDataChange(Q, c) {
            Q === "newdata" && (this.videoData = c,
            this.loaded && this.unload(),
            this.J = !1,
            this.O = null,
            this.W && (this.W.dispose(),
            this.W = null,
            g.tV(this.player, "captionschanged", {})),
            this.B1() && this.load())
        }
        getAudioTrack() {
            return this.player.getAudioTrack()
        }
        MQ() {
            const Q = this.U.Yx();
            Q && !Q.u0() && Q.J();
            this.U.isFullscreen() ? (this.j = this.XI = !0,
            this.loaded && this.Kw()) : (this.XI = this.FI.controlsType === "3",
            this.j = Gs4(this));
            QY(this, this.O)
        }
        JJ() {
            const Q = this.videoData.getPlayerResponse()?.captions?.playerCaptionsTracklistRenderer?.openTranscriptCommand;
            Q && g.xt(this.player, "innertubeCommand", Q)
        }
        q6(Q, c, W) {
            const m = /&|,|:|;|(\n)|(\s)|(\/)|(\\)/gm;
            let K = "";
            Q && (K = Q.vssId,
            K = K.replace(m, ""));
            let T = "";
            Q && Q.getId() && (T = Q.getId() || "");
            Q && Q.getXtags() && (Q = Q.getXtags(),
            Q = Q.replace(m, ""),
            T = T.concat(`;${Q}`));
            this.A === "HLS" && (T = "");
            this.U.q6(c ? K : "", c ? T : "", W)
        }
        SQ(Q, c) {
            Q = (Q || "").replace(/&|,|:|;|(\n)|(\s)|(\/)|(\\)/gm, "");
            Q.length > 0 && this.U.SQ(Q, c)
        }
    }
    );
}
)(_yt_player);
