(function(g) {
    var window = this;
    'use strict';
    var djZ = function(Q, c) {
        return g.a0(Q, c)
    }
      , Ln9 = function(Q) {
        if (Q instanceof g.OF)
            return Q;
        if (typeof Q.F7 == "function")
            return Q.F7(!1);
        if (g.iw(Q)) {
            let c = 0;
            const W = new g.OF;
            W.next = function() {
                for (; ; ) {
                    if (c >= Q.length)
                        return g.KP;
                    if (c in Q)
                        return g.f4(Q[c++]);
                    c++
                }
            }
            ;
            return W
        }
        throw Error("Not implemented");
    }
      , wsH = function(Q, c, W) {
        if (g.iw(Q))
            g.lw(Q, c, W);
        else
            for (Q = Ln9(Q); ; ) {
                const {done: m, value: K} = Q.next();
                if (m)
                    break;
                c.call(W, K, void 0, Q)
            }
    }
      , T8 = function(Q) {
        g.eX(Q, "zx", Math.floor(Math.random() * 2147483648).toString(36) + Math.abs(Math.floor(Math.random() * 2147483648) ^ g.d0()).toString(36));
        return Q
    }
      , ot = function(Q, c, W) {
        Array.isArray(W) || (W = [String(W)]);
        g.nG(Q.j, c, W)
    }
      , bd1 = function(Q, c) {
        const W = [];
        wsH(c, function(m) {
            let K;
            try {
                K = g.kK.prototype.iM.call(this, m, !0)
            } catch (T) {
                if (T == "Storage: Invalid value was encountered")
                    return;
                throw T;
            }
            K === void 0 ? W.push(m) : g.R9(K) && W.push(m)
        }, Q);
        return W
    }
      , jpH = function(Q, c) {
        bd1(Q, c).forEach(function(W) {
            g.kK.prototype.remove.call(this, W)
        }, Q)
    }
      , gNZ = function(Q) {
        if (Q.WB) {
            if (Q.WB.locationOverrideToken)
                return {
                    locationOverrideToken: Q.WB.locationOverrideToken
                };
            if (Q.WB.latitudeE7 != null && Q.WB.longitudeE7 != null)
                return {
                    latitudeE7: Q.WB.latitudeE7,
                    longitudeE7: Q.WB.longitudeE7
                }
        }
        return null
    }
      , OdS = function(Q, c) {
        g.c9(Q, c) || Q.push(c)
    }
      , rp = function(Q) {
        let c = 0;
        for (const W in Q)
            c++;
        return c
    }
      , fxi = function(Q) {
        try {
            return g.qX.JSON.parse(Q)
        } catch (c) {}
        Q = String(Q);
        if (/^\s*$/.test(Q) ? 0 : /^[\],:{}\s\u2028\u2029]*$/.test(Q.replace(/\\["\\\/bfnrtu]/g, "@").replace(/(?:"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)[\s\u2028\u2029]*(?=:|,|]|}|$)/g, "]").replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, "")))
            try {
                return eval("(" + Q + ")")
            } catch (c) {}
        throw Error("Invalid JSON string: " + Q);
    }
      , UL = function(Q) {
        if (g.qX.JSON)
            try {
                return g.qX.JSON.parse(Q)
            } catch (c) {}
        return fxi(Q)
    }
      , vNm = function(Q, c, W, m) {
        const K = new g.KG(null);
        Q && g.TT(K, Q);
        c && g.oO(K, c);
        W && g.rC(K, W);
        m && (K.O = m);
        return K
    }
      , ax1 = function(Q, c) {
        return new g.gPw(Q,c)
    }
      , It = function(Q, c) {
        return Object.prototype.hasOwnProperty.call(Q, c)
    }
      , G_Z = function(Q, c) {
        return Q === c
    }
      , XO = function(Q, c) {
        this.O = {};
        this.W = [];
        this.jX = this.size = 0;
        var W = arguments.length;
        if (W > 1) {
            if (W % 2)
                throw Error("Uneven number of arguments");
            for (var m = 0; m < W; m += 2)
                this.set(arguments[m], arguments[m + 1])
        } else if (Q)
            if (Q instanceof XO)
                for (W = Q.Il(),
                m = 0; m < W.length; m++)
                    this.set(W[m], Q.get(W[m]));
            else
                for (m in Q)
                    this.set(m, Q[m])
    }
      , Ae = function(Q) {
        if (Q.size != Q.W.length) {
            for (var c = 0, W = 0; c < Q.W.length; ) {
                var m = Q.W[c];
                It(Q.O, m) && (Q.W[W++] = m);
                c++
            }
            Q.W.length = W
        }
        if (Q.size != Q.W.length) {
            c = {};
            for (m = W = 0; W < Q.W.length; ) {
                const K = Q.W[W];
                It(c, K) || (Q.W[m++] = K,
                c[K] = 1);
                W++
            }
            Q.W.length = m
        }
    }
      , ex = function(Q) {
        this.name = this.id = "";
        this.clientName = "UNKNOWN_INTERFACE";
        this.app = "";
        this.type = "REMOTE_CONTROL";
        this.ownerObfuscatedGaiaId = this.obfuscatedGaiaId = this.avatar = this.username = "";
        this.capabilities = new Set;
        this.compatibleSenderThemes = new Set;
        this.experiments = new Set;
        this.theme = "u";
        new XO;
        this.model = this.brand = "";
        this.year = 0;
        this.chipset = this.osVersion = this.os = "";
        this.mdxDialServerType = "MDX_DIAL_SERVER_TYPE_UNKNOWN";
        Q && (this.id = Q.id || Q.name,
        this.name = Q.name,
        this.clientName = Q.clientName ? Q.clientName.toUpperCase() : "UNKNOWN_INTERFACE",
        this.app = Q.app,
        this.type = Q.type || "REMOTE_CONTROL",
        this.username = Q.user || "",
        this.avatar = Q.userAvatarUri || "",
        this.obfuscatedGaiaId = Q.obfuscatedGaiaId || "",
        this.ownerObfuscatedGaiaId = Q.ownerObfuscatedGaiaId || "",
        this.theme = Q.theme || "u",
        $j9(this, Q.capabilities || ""),
        PQZ(this, Q.compatibleSenderThemes || ""),
        lx1(this, Q.experiments || ""),
        this.brand = Q.brand || "",
        this.model = Q.model || "",
        this.year = Q.year || 0,
        this.os = Q.os || "",
        this.osVersion = Q.osVersion || "",
        this.chipset = Q.chipset || "",
        this.mdxDialServerType = Q.mdxDialServerType || "MDX_DIAL_SERVER_TYPE_UNKNOWN",
        Q = Q.deviceInfo) && (Q = JSON.parse(Q),
        this.brand = Q.brand || "",
        this.model = Q.model || "",
        this.year = Q.year || 0,
        this.os = Q.os || "",
        this.osVersion = Q.osVersion || "",
        this.chipset = Q.chipset || "",
        this.clientName = Q.clientName ? Q.clientName.toUpperCase() : "UNKNOWN_INTERFACE",
        this.mdxDialServerType = Q.mdxDialServerType || "MDX_DIAL_SERVER_TYPE_UNKNOWN")
    }
      , $j9 = function(Q, c) {
        Q.capabilities.clear();
        g.uw(c.split(","), g.sO(djZ, ul0)).forEach(W => {
            Q.capabilities.add(W)
        }
        )
    }
      , PQZ = function(Q, c) {
        Q.compatibleSenderThemes.clear();
        g.uw(c.split(","), g.sO(djZ, h31)).forEach(W => {
            Q.compatibleSenderThemes.add(W)
        }
        )
    }
      , lx1 = function(Q, c) {
        Q.experiments.clear();
        c.split(",").forEach(W => {
            Q.experiments.add(W)
        }
        )
    }
      , VE = function(Q) {
        Q = Q || {};
        this.name = Q.name || "";
        this.id = Q.id || Q.screenId || "";
        this.token = Q.token || Q.loungeToken || "";
        this.uuid = Q.uuid || Q.dialId || "";
        this.idType = Q.screenIdType || "normal";
        this.secret = Q.screenIdSecret || ""
    }
      , Bg = function(Q, c) {
        return !!c && (Q.id == c || Q.uuid == c)
    }
      , z3m = function(Q) {
        return {
            name: Q.name,
            screenId: Q.id,
            loungeToken: Q.token,
            dialId: Q.uuid,
            screenIdType: Q.idType,
            screenIdSecret: Q.secret
        }
    }
      , CQ0 = function(Q) {
        return new VE(Q)
    }
      , Mva = function(Q) {
        return Array.isArray(Q) ? g.hy(Q, CQ0) : []
    }
      , xe = function(Q) {
        return Q ? `{name:"${Q.name}",id:${Q.id.substr(0, 6)}..,token:${Q.token ? ".." + Q.token.slice(-6) : "-"},uuid:${Q.uuid ? ".." + Q.uuid.slice(-6) : "-"},idType:${Q.idType},secret:${Q.secret ? ".." + Q.secret.slice(-6) : "-"}}` : "null"
    }
      , qd = function(Q) {
        return Array.isArray(Q) ? "[" + g.hy(Q, xe).join(",") + "]" : "null"
    }
      , nx = function() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(Q) {
            const c = Math.random() * 16 | 0;
            return (Q == "x" ? c : c & 3 | 8).toString(16)
        })
    }
      , J3H = function(Q) {
        return g.hy(Q, function(c) {
            return {
                key: c.id,
                name: c.name
            }
        })
    }
      , Dn = function(Q, c) {
        return g.Yx(Q, function(W) {
            return W || c ? !W != !c ? !1 : W.id == c.id : !0
        })
    }
      , te = function(Q, c) {
        return g.Yx(Q, function(W) {
            return Bg(W, c)
        })
    }
      , R3a = function() {
        const Q = g.oC.w8();
        Q && jpH(Q, Q.xl.F7(!0))
    }
      , Hg = function() {
        const Q = g.UM("yt-remote-connected-devices") || [];
        g.iD(Q);
        return Q
    }
      , k_H = function(Q) {
        if (Q.length == 0)
            return [];
        const c = Q[0].indexOf("#")
          , W = c == -1 ? Q[0] : Q[0].substring(0, c);
        return g.hy(Q, function(m, K) {
            return K == 0 ? m : m.substring(W.length)
        })
    }
      , YN9 = function(Q) {
        g.rl("yt-remote-connected-devices", Q, 86400)
    }
      , ia = function() {
        if (Nd)
            return Nd;
        let Q = g.UM("yt-remote-device-id");
        Q || (Q = nx(),
        g.rl("yt-remote-device-id", Q, 31536E3));
        const c = Hg();
        let W = 1
          , m = Q;
        for (; g.c9(c, m); )
            W++,
            m = Q + "#" + W;
        return Nd = m
    }
      , yE = function() {
        let Q = Hg();
        const c = ia();
        g.Xd() && g.S4(Q, c);
        Q = k_H(Q);
        if (Q.length == 0)
            try {
                g.Bn("remote_sid")
            } catch (W) {}
        else
            try {
                g.e$("remote_sid", Q.join(","), -1)
            } catch (W) {}
    }
      , psZ = function() {
        return g.UM("yt-remote-session-browser-channel")
    }
      , QFv = function() {
        return g.UM("yt-remote-local-screens") || []
    }
      , cGo = function() {
        g.rl("yt-remote-lounge-token-expiration", !0, 86400)
    }
      , WZo = function(Q) {
        Q.length > 5 && (Q = Q.slice(Q.length - 5));
        const c = g.hy(QFv(), function(m) {
            return m.loungeToken
        })
          , W = g.hy(Q, function(m) {
            return m.loungeToken
        });
        g.RW(W, function(m) {
            return !g.c9(c, m)
        }) && cGo();
        g.rl("yt-remote-local-screens", Q, 31536E3)
    }
      , Sx = function(Q) {
        Q || (g.IC("yt-remote-session-screen-id"),
        g.IC("yt-remote-session-video-id"));
        yE();
        Q = Hg();
        g.o0(Q, ia());
        YN9(Q)
    }
      , mHS = function() {
        if (!FO) {
            const Q = g.Ku();
            Q && (FO = new g.P7(Q))
        }
    }
      , KZv = function() {
        mHS();
        return FO ? !!FO.get("yt-remote-use-staging-server") : !1
    }
      , Zn = function(Q, c) {
        g.Yw[Q] = !0;
        const W = g.Ru();
        W && W.publish.apply(W, arguments);
        g.Yw[Q] = !1
    }
      , EL = function() {
        let Q = window.navigator.userAgent.match(/Chrome\/([0-9]+)/);
        return Q ? parseInt(Q[1], 10) : 0
    }
      , TmZ = function(Q) {
        return !!document.currentScript && (document.currentScript.src.indexOf("?" + Q) != -1 || document.currentScript.src.indexOf("&" + Q) != -1)
    }
      , oRm = function() {
        return typeof window.__onGCastApiAvailable == "function" ? window.__onGCastApiAvailable : null
    }
      , sL = function(Q) {
        Q.length ? rGW(Q.shift(), function() {
            sL(Q)
        }) : dp()
    }
      , dp = function() {
        let Q = oRm();
        Q && Q(!1, "No cast extension found")
    }
      , rGW = function(Q, c, W) {
        let m = document.createElement("script");
        m.onerror = c;
        W && (m.onload = W);
        g.eS(m, g.Dp(Q));
        (document.head || document.documentElement).appendChild(m)
    }
      , UHo = function(Q) {
        return "chrome-extension://" + Q + "/cast_sender.js"
    }
      , I4a = function() {
        const Q = EL()
          , c = [];
        if (Q > 1) {
            const W = Q - 1;
            c.push("//www.gstatic.com/eureka/clank/" + Q + "/cast_sender.js");
            c.push("//www.gstatic.com/eureka/clank/" + W + "/cast_sender.js")
        }
        return c
    }
      , Lx = function() {
        if (XOa) {
            var Q = 2
              , c = oRm()
              , W = function() {
                Q--;
                Q == 0 && c && c(!0)
            };
            window.__onGCastApiAvailable = W;
            rGW("//www.gstatic.com/cast/sdk/libs/sender/1.0/cast_framework.js", dp, W)
        }
    }
      , AGi = function() {
        Lx();
        let Q = I4a();
        Q.push("//www.gstatic.com/eureka/clank/cast_sender.js");
        sL(Q)
    }
      , VaD = function() {
        Lx();
        let Q = I4a();
        Q.push(...ewm.map(UHo));
        Q.push("//www.gstatic.com/eureka/clank/cast_sender.js");
        sL(Q)
    }
      , wp = function(Q, c, W) {
        g.qK.call(this);
        this.D = W != null ? (0,
        g.EO)(Q, W) : Q;
        this.eW = c;
        this.K = (0,
        g.EO)(this.BU, this);
        this.W = !1;
        this.O = 0;
        this.A = this.ot = null;
        this.j = []
    }
      , ba = function() {
        this.W = g.d0()
    }
      , Bm1 = function() {
        jx || (jx = new ba)
    }
      , xHo = function() {
        jx || (jx = new ba)
    }
      , gp = function() {
        g.tG.call(this, "p")
    }
      , OL = function() {
        g.tG.call(this, "o")
    }
      , fx = function() {
        return q7a = q7a || new g.$R
    }
      , nRm = function(Q) {
        g.tG.call(this, "serverreachability", Q)
    }
      , vg = function(Q) {
        const c = fx();
        c.dispatchEvent(new nRm(c,Q))
    }
      , DHm = function(Q) {
        g.tG.call(this, "statevent", Q)
    }
      , at = function(Q) {
        const c = fx();
        c.dispatchEvent(new DHm(c,Q))
    }
      , ta0 = function(Q, c, W, m) {
        g.tG.call(this, "timingevent", Q);
        this.size = c;
        this.rtt = W;
        this.retries = m
    }
      , G8 = function(Q, c) {
        if (typeof Q !== "function")
            throw Error("Fn must not be null and must be a function");
        return g.qX.setTimeout(function() {
            Q()
        }, c)
    }
      , $e = function() {}
      , Pg = function(Q, c, W, m) {
        this.A = Q;
        this.j = c;
        this.iX = W;
        this.WB = m || 1;
        this.Y0 = new g.Hx(this);
        this.JJ = 45E3;
        this.Ka = null;
        this.D = !1;
        this.Y = this.XI = this.L = this.jG = this.b0 = this.La = this.mF = null;
        this.S = [];
        this.W = null;
        this.J = 0;
        this.K = this.T2 = null;
        this.Re = -1;
        this.MM = !1;
        this.HA = 0;
        this.UH = null;
        this.Fw = this.PA = this.EC = this.Ie = !1;
        this.O = new HWm
    }
      , HWm = function() {
        this.A = null;
        this.W = "";
        this.O = !1
    }
      , la = function(Q, c, W) {
        Q.jG = 1;
        Q.L = T8(c.clone());
        Q.Y = W;
        Q.Ie = !0;
        Nmm(Q, null)
    }
      , Nmm = function(Q, c) {
        Q.b0 = Date.now();
        ua(Q);
        Q.XI = Q.L.clone();
        ot(Q.XI, "t", Q.WB);
        Q.J = 0;
        const W = Q.A.PA;
        Q.O = new HWm;
        Q.W = iWa(Q.A, W ? c : null, !Q.Y);
        Q.HA > 0 && (Q.UH = new g.F_((0,
        g.EO)(Q.UL, Q, Q.W),Q.HA));
        Q.Y0.listen(Q.W, "readystatechange", Q.vU);
        c = Q.Ka ? g.za(Q.Ka) : {};
        Q.Y ? (Q.T2 || (Q.T2 = "POST"),
        c["Content-Type"] = "application/x-www-form-urlencoded",
        Q.W.send(Q.XI, Q.T2, Q.Y, c)) : (Q.T2 = "GET",
        Q.W.send(Q.XI, Q.T2, null, c));
        vg(1)
    }
      , S71 = function(Q) {
        if (!yG0(Q))
            return g.MA(Q.W);
        const c = g.Jz(Q.W);
        if (c === "")
            return "";
        let W = "";
        const m = c.length
          , K = g.hz(Q.W) == 4;
        if (!Q.O.A) {
            if (typeof TextDecoder === "undefined")
                return he(Q),
                z8(Q),
                "";
            Q.O.A = new g.qX.TextDecoder
        }
        for (let T = 0; T < m; T++)
            Q.O.O = !0,
            W += Q.O.A.decode(c[T], {
                stream: !(K && T == m - 1)
            });
        c.length = 0;
        Q.O.W += W;
        Q.J = 0;
        return Q.O.W
    }
      , yG0 = function(Q) {
        return Q.W ? Q.T2 == "GET" && Q.jG != 2 && Q.A.gA : !1
    }
      , ZWa = function(Q, c) {
        var W = Q.J
          , m = c.indexOf("\n", W);
        if (m == -1)
            return Cx;
        W = Number(c.substring(W, m));
        if (isNaN(W))
            return FZS;
        m += 1;
        if (m + W > c.length)
            return Cx;
        c = c.slice(m, m + W);
        Q.J = m + W;
        return c
    }
      , ua = function(Q) {
        Q.La = Date.now() + Q.JJ;
        ERa(Q, Q.JJ)
    }
      , ERa = function(Q, c) {
        if (Q.mF != null)
            throw Error("WatchDog timer not null");
        Q.mF = G8((0,
        g.EO)(Q.GL, Q), c)
    }
      , Md = function(Q) {
        Q.mF && (g.qX.clearTimeout(Q.mF),
        Q.mF = null)
    }
      , z8 = function(Q) {
        Q.A.NK() || Q.MM || sFo(Q.A, Q)
    }
      , he = function(Q) {
        Md(Q);
        g.BN(Q.UH);
        Q.UH = null;
        Q.Y0.removeAll();
        if (Q.W) {
            const c = Q.W;
            Q.W = null;
            c.abort();
            c.dispose()
        }
    }
      , mF = function(Q, c) {
        try {
            var W = Q.A;
            if (W.Tf != 0 && (W.W == Q || Je(W.O, Q)))
                if (!Q.PA && Je(W.O, Q) && W.Tf == 3) {
                    try {
                        var m = W.Hw.W.parse(c)
                    } catch (X) {
                        m = null
                    }
                    if (Array.isArray(m) && m.length == 3) {
                        var K = m;
                        if (K[0] == 0)
                            a: {
                                if (!W.L) {
                                    if (W.W)
                                        if (W.W.b0 + 3E3 < Q.b0)
                                            Rt(W),
                                            ke(W);
                                        else
                                            break a;
                                    Ye(W);
                                    at(18)
                                }
                            }
                        else
                            W.QE = K[1],
                            0 < W.QE - W.jG && K[2] < 37500 && W.UH && W.S == 0 && !W.mF && (W.mF = G8((0,
                            g.EO)(W.Na, W), 6E3));
                        if (px(W.O) <= 1 && W.Re) {
                            try {
                                W.Re()
                            } catch (X) {}
                            W.Re = void 0
                        }
                    } else
                        Qx(W, 11)
                } else if ((Q.PA || W.W == Q) && Rt(W),
                !g.n9(c))
                    for (K = W.Hw.W.parse(c),
                    c = 0; c < K.length; c++) {
                        let X = K[c];
                        const A = X[0];
                        if (!(A <= W.jG))
                            if (W.jG = A,
                            X = X[1],
                            W.Tf == 2)
                                if (X[0] == "c") {
                                    W.j = X[1];
                                    W.iX = X[2];
                                    const e = X[3];
                                    e != null && (W.qn = e);
                                    const V = X[5];
                                    V != null && typeof V === "number" && V > 0 && (W.HA = 1.5 * V);
                                    m = W;
                                    const B = Q.Ew();
                                    if (B) {
                                        const n = g.ku(B, "X-Client-Wire-Protocol");
                                        if (n) {
                                            var T = m.O;
                                            !T.W && (g.D7(n, "spdy") || g.D7(n, "quic") || g.D7(n, "h2")) && (T.j = T.K,
                                            T.W = new Set,
                                            T.O && (c$(T, T.O),
                                            T.O = null))
                                        }
                                        if (m.Ie) {
                                            const S = g.ku(B, "X-HTTP-Session-Id");
                                            S && (m.yY = S,
                                            g.eX(m.Ka, m.Ie, S))
                                        }
                                    }
                                    W.Tf = 3;
                                    W.K && W.K.gI();
                                    W.qQ && (W.Xw = Date.now() - Q.b0);
                                    m = W;
                                    var r = Q;
                                    m.nO = dH1(m, m.PA ? m.iX : null, m.sC);
                                    if (r.PA) {
                                        LZa(m.O, r);
                                        var U = r
                                          , I = m.HA;
                                        I && U.setTimeout(I);
                                        U.mF && (Md(U),
                                        ua(U));
                                        m.W = r
                                    } else
                                        wO9(m);
                                    W.A.length > 0 && W$(W)
                                } else
                                    X[0] != "stop" && X[0] != "close" || Qx(W, 7);
                            else
                                W.Tf == 3 && (X[0] == "stop" || X[0] == "close" ? X[0] == "stop" ? Qx(W, 7) : W.disconnect() : X[0] != "noop" && W.K && W.K.Xl(X),
                                W.S = 0)
                    }
            vg(4)
        } catch (X) {}
    }
      , bW9 = function(Q) {
        this.K = Q || 10;
        g.qX.PerformanceNavigationTiming ? (Q = g.qX.performance.getEntriesByType("navigation"),
        Q = Q.length > 0 && (Q[0].nextHopProtocol == "hq" || Q[0].nextHopProtocol == "h2")) : Q = !!(g.qX.chrome && g.qX.chrome.loadTimes && g.qX.chrome.loadTimes() && g.qX.chrome.loadTimes().wasFetchedViaSpdy);
        this.j = Q ? this.K : 1;
        this.W = null;
        this.j > 1 && (this.W = new Set);
        this.O = null;
        this.A = []
    }
      , jFo = function(Q) {
        return Q.O ? !0 : Q.W ? Q.W.size >= Q.j : !1
    }
      , px = function(Q) {
        return Q.O ? 1 : Q.W ? Q.W.size : 0
    }
      , Je = function(Q, c) {
        return Q.O ? Q.O == c : Q.W ? Q.W.has(c) : !1
    }
      , c$ = function(Q, c) {
        Q.W ? Q.W.add(c) : Q.O = c
    }
      , LZa = function(Q, c) {
        Q.O && Q.O == c ? Q.O = null : Q.W && Q.W.has(c) && Q.W.delete(c)
    }
      , KT = function(Q) {
        if (Q.O != null)
            return Q.A.concat(Q.O.S);
        if (Q.W != null && Q.W.size !== 0) {
            let c = Q.A;
            for (const W of Q.W.values())
                c = c.concat(W.S);
            return c
        }
        return g.Xi(Q.A)
    }
      , gRa = function(Q, c) {
        const W = new $e;
        if (g.qX.Image) {
            const m = new Image;
            m.onload = g.sO(T6, W, "TestLoadImage: loaded", !0, c, m);
            m.onerror = g.sO(T6, W, "TestLoadImage: error", !1, c, m);
            m.onabort = g.sO(T6, W, "TestLoadImage: abort", !1, c, m);
            m.ontimeout = g.sO(T6, W, "TestLoadImage: timeout", !1, c, m);
            g.qX.setTimeout(function() {
                if (m.ontimeout)
                    m.ontimeout()
            }, 1E4);
            m.src = Q
        } else
            c(!1)
    }
      , OWm = function(Q, c) {
        const W = new $e
          , m = new AbortController
          , K = setTimeout( () => {
            m.abort();
            T6(W, "TestPingServer: timeout", !1, c)
        }
        , 1E4);
        fetch(Q, {
            signal: m.signal
        }).then(T => {
            clearTimeout(K);
            T.ok ? T6(W, "TestPingServer: ok", !0, c) : T6(W, "TestPingServer: server error", !1, c)
        }
        ).catch( () => {
            clearTimeout(K);
            T6(W, "TestPingServer: error", !1, c)
        }
        )
    }
      , T6 = function(Q, c, W, m, K) {
        try {
            K && (K.onload = null,
            K.onerror = null,
            K.onabort = null,
            K.ontimeout = null),
            m(W)
        } catch (T) {}
    }
      , f4W = function() {
        this.W = new oJ
    }
      , rN = function(Q, c, W) {
        return W && W.CZ ? W.CZ[Q] || c : c
    }
      , vRv = function(Q) {
        this.A = [];
        this.iX = this.nO = this.Ka = this.sC = this.W = this.yY = this.Ie = this.MM = this.J = this.EC = this.Y = null;
        this.w6 = this.XI = 0;
        this.w7 = rN("failFast", !1, Q);
        this.UH = this.mF = this.L = this.D = this.K = null;
        this.MQ = !0;
        this.QE = this.jG = -1;
        this.WB = this.S = this.b0 = 0;
        this.dA = rN("baseRetryDelayMs", 5E3, Q);
        this.AA = rN("retryDelaySeedMs", 1E4, Q);
        this.Rt = rN("forwardChannelMaxRetries", 2, Q);
        this.Ww = rN("forwardChannelRequestTimeoutMs", 2E4, Q);
        this.u3 = Q && Q.o32 || void 0;
        this.FO = Q && Q.kHe || void 0;
        this.gA = Q && Q.Nja || !1;
        this.HA = void 0;
        this.PA = Q && Q.Uj || !1;
        this.j = "";
        this.O = new bW9(Q && Q.eKy);
        this.d3 = Math.min(Q && Q.qrH || 1E3, 1E3);
        this.Hw = new f4W;
        this.Y0 = Q && Q.Hke || !1;
        this.La = Q && Q.xIA || !1;
        this.Y0 && this.La && (this.La = !1);
        this.U7 = Q && Q.SO0 || !1;
        Q && Q.lE2 && (this.MQ = !1);
        this.qQ = !this.Y0 && this.MQ && Q && Q.Q$0 || !1;
        this.Sh = void 0;
        Q && Q.WK && Q.WK > 0 && (this.Sh = Q.WK);
        this.Re = void 0;
        this.Xw = 0;
        this.JJ = !1;
        this.Fw = this.T2 = null
    }
      , ke = function(Q) {
        Q.W && (Uq(Q),
        Q.W.cancel(),
        Q.W = null)
    }
      , a41 = function(Q) {
        ke(Q);
        Q.L && (g.qX.clearTimeout(Q.L),
        Q.L = null);
        Rt(Q);
        Q.O.cancel();
        Q.D && (typeof Q.D === "number" && g.qX.clearTimeout(Q.D),
        Q.D = null)
    }
      , W$ = function(Q) {
        jFo(Q.O) || Q.D || (Q.D = !0,
        g.mN(Q.u5, Q),
        Q.b0 = 0)
    }
      , $Hm = function(Q, c) {
        if (px(Q.O) >= Q.O.j - (Q.D ? 1 : 0))
            return !1;
        if (Q.D)
            return Q.A = c.S.concat(Q.A),
            !0;
        if (Q.Tf == 1 || Q.Tf == 2 || Q.b0 >= (Q.w7 ? 0 : Q.Rt))
            return !1;
        Q.D = G8((0,
        g.EO)(Q.u5, Q, c), G$1(Q, Q.b0));
        Q.b0++;
        return !0
    }
      , l41 = function(Q, c) {
        var W;
        c ? W = c.iX : W = Q.XI++;
        const m = Q.Ka.clone();
        g.eX(m, "SID", Q.j);
        g.eX(m, "RID", W);
        g.eX(m, "AID", Q.jG);
        IJ(Q, m);
        Q.J && Q.Y && g.td(m, Q.J, Q.Y);
        W = new Pg(Q,Q.j,W,Q.b0 + 1);
        Q.J === null && (W.Ka = Q.Y);
        c && (Q.A = c.S.concat(Q.A));
        c = Pso(Q, W, Q.d3);
        W.setTimeout(Math.round(Q.Ww * .5) + Math.round(Q.Ww * .5 * Math.random()));
        c$(Q.O, W);
        la(W, m, c)
    }
      , IJ = function(Q, c) {
        Q.MM && g.ZS(Q.MM, function(W, m) {
            g.eX(c, m, W)
        });
        Q.K && g.ZS({}, function(W, m) {
            g.eX(c, m, W)
        })
    }
      , Pso = function(Q, c, W) {
        W = Math.min(Q.A.length, W);
        const m = Q.K ? (0,
        g.EO)(Q.K.oZ, Q.K, Q) : null;
        a: {
            var K = Q.A;
            let U = -1;
            for (; ; ) {
                const I = ["count=" + W];
                U == -1 ? W > 0 ? (U = K[0].W,
                I.push("ofs=" + U)) : U = 0 : I.push("ofs=" + U);
                let X = !0;
                for (let A = 0; A < W; A++) {
                    var T = K[A].W;
                    const e = K[A].map;
                    T -= U;
                    if (T < 0)
                        U = Math.max(0, K[A].W - 100),
                        X = !1;
                    else
                        try {
                            T = "req" + T + "_" || "";
                            try {
                                var r = e instanceof Map ? e : Object.entries(e);
                                for (const [V,B] of r) {
                                    let n = B;
                                    g.Sd(B) && (n = g.bS(B));
                                    I.push(T + V + "=" + encodeURIComponent(n))
                                }
                            } catch (V) {
                                throw I.push(T + "type=" + encodeURIComponent("_badmap")),
                                V;
                            }
                        } catch (V) {
                            m && m(e)
                        }
                }
                if (X) {
                    r = I.join("&");
                    break a
                }
            }
            r = void 0
        }
        Q = Q.A.splice(0, W);
        c.S = Q;
        return r
    }
      , wO9 = function(Q) {
        Q.W || Q.L || (Q.WB = 1,
        g.mN(Q.rI, Q),
        Q.S = 0)
    }
      , Ye = function(Q) {
        if (Q.W || Q.L || Q.S >= 3)
            return !1;
        Q.WB++;
        Q.L = G8((0,
        g.EO)(Q.rI, Q), G$1(Q, Q.S));
        Q.S++;
        return !0
    }
      , Uq = function(Q) {
        Q.T2 != null && (g.qX.clearTimeout(Q.T2),
        Q.T2 = null)
    }
      , uhi = function(Q) {
        Q.W = new Pg(Q,Q.j,"rpc",Q.WB);
        Q.J === null && (Q.W.Ka = Q.Y);
        Q.W.HA = 0;
        var c = Q.nO.clone();
        g.eX(c, "RID", "rpc");
        g.eX(c, "SID", Q.j);
        g.eX(c, "AID", Q.jG);
        g.eX(c, "CI", Q.UH ? "0" : "1");
        !Q.UH && Q.Sh && g.eX(c, "TO", Q.Sh);
        g.eX(c, "TYPE", "xmlhttp");
        IJ(Q, c);
        Q.J && Q.Y && g.td(c, Q.J, Q.Y);
        Q.HA && Q.W.setTimeout(Q.HA);
        var W = Q.W;
        Q = Q.iX;
        W.jG = 1;
        W.L = T8(c.clone());
        W.Y = null;
        W.Ie = !0;
        Nmm(W, Q)
    }
      , Rt = function(Q) {
        Q.mF != null && (g.qX.clearTimeout(Q.mF),
        Q.mF = null)
    }
      , sFo = function(Q, c) {
        var W = null;
        if (Q.W == c) {
            Rt(Q);
            Uq(Q);
            Q.W = null;
            var m = 2
        } else if (Je(Q.O, c))
            W = c.S,
            LZa(Q.O, c),
            m = 1;
        else
            return;
        if (Q.Tf != 0)
            if (c.D)
                if (m == 1) {
                    W = c.Y ? c.Y.length : 0;
                    c = Date.now() - c.b0;
                    var K = Q.b0;
                    m = fx();
                    m.dispatchEvent(new ta0(m,W,c,K));
                    W$(Q)
                } else
                    wO9(Q);
            else {
                var T = c.Re;
                K = c.getLastError();
                if (K == 3 || K == 0 && T > 0 || !(m == 1 && $Hm(Q, c) || m == 2 && Ye(Q)))
                    switch (W && W.length > 0 && (c = Q.O,
                    c.A = c.A.concat(W)),
                    K) {
                    case 1:
                        Qx(Q, 5);
                        break;
                    case 4:
                        Qx(Q, 10);
                        break;
                    case 3:
                        Qx(Q, 6);
                        break;
                    default:
                        Qx(Q, 2)
                    }
            }
    }
      , G$1 = function(Q, c) {
        let W = Q.dA + Math.floor(Math.random() * Q.AA);
        Q.isActive() || (W *= 2);
        return W * c
    }
      , Qx = function(Q, c) {
        if (c == 2) {
            var W = (0,
            g.EO)(Q.X5, Q)
              , m = Q.FO;
            const K = !m;
            m = new g.KG(m || "//www.google.com/images/cleardot.gif");
            g.qX.location && g.qX.location.protocol == "http" || g.TT(m, "https");
            T8(m);
            K ? gRa(m.toString(), W) : OWm(m.toString(), W)
        } else
            at(2);
        Q.Tf = 0;
        Q.K && Q.K.Da(c);
        hwv(Q);
        a41(Q)
    }
      , hwv = function(Q) {
        Q.Tf = 0;
        Q.Fw = [];
        if (Q.K) {
            const c = KT(Q.O);
            if (c.length != 0 || Q.A.length != 0)
                g.AH(Q.Fw, c),
                g.AH(Q.Fw, Q.A),
                Q.O.A.length = 0,
                g.Xi(Q.A),
                Q.A.length = 0;
            Q.K.hT()
        }
    }
      , zwo = function(Q) {
        if (Q.Tf == 0)
            return Q.Fw;
        let c = [];
        g.AH(c, KT(Q.O));
        g.AH(c, Q.A);
        return c
    }
      , dH1 = function(Q, c, W) {
        var m = g.Vt(W);
        m.W != "" ? (c && g.oO(m, c + "." + m.W),
        g.rC(m, m.A)) : (m = g.qX.location,
        m = vNm(m.protocol, c ? c + "." + m.hostname : m.hostname, +m.port, W));
        c = Q.Ie;
        W = Q.yY;
        c && W && g.eX(m, c, W);
        g.eX(m, "VER", Q.qn);
        IJ(Q, m);
        return m
    }
      , iWa = function(Q, c, W) {
        if (c && !Q.PA)
            throw Error("Can't create secondary domain capable XhrIo object.");
        c = Q.gA && !Q.u3 ? new g.aY(new g.Yd({
            Ac: W
        })) : new g.aY(Q.u3);
        c.J = Q.PA;
        return c
    }
      , Cs0 = function() {}
      , Mav = function() {}
      , Ai = function(Q, c) {
        g.$R.call(this);
        this.W = new vRv(c);
        this.D = Q;
        this.O = c && c.wc || null;
        Q = c && c.Wz || null;
        c && c.T6F && (Q ? Q["X-Client-Protocol"] = "webchannel" : Q = {
            "X-Client-Protocol": "webchannel"
        });
        this.W.Y = Q;
        Q = c && c.WnH || null;
        c && c.My && (Q ? Q["X-WebChannel-Content-Type"] = c.My : Q = {
            "X-WebChannel-Content-Type": c.My
        });
        c && c.ZG && (Q ? Q["X-WebChannel-Client-Profile"] = c.ZG : Q = {
            "X-WebChannel-Client-Profile": c.ZG
        });
        this.W.EC = Q;
        (Q = c && c.eWH) && !g.n9(Q) && (this.W.J = Q);
        this.J = c && c.Uj || !1;
        this.K = c && c.zpJ || !1;
        (c = c && c.Ok) && !g.n9(c) && (this.W.Ie = c,
        g.fm(this.O, c) && (Q = this.O,
        c in Q && delete Q[c]));
        this.A = new Xj(this)
    }
      , JGD = function(Q) {
        gp.call(this);
        Q.__headers__ && (this.headers = Q.__headers__,
        this.statusCode = Q.__status__,
        delete Q.__headers__,
        delete Q.__status__);
        const c = Q.__sm__;
        c ? this.data = (this.W = g.bD(c)) ? g.uD(c, this.W) : c : this.data = Q
    }
      , Rw9 = function(Q) {
        OL.call(this);
        this.status = 1;
        this.errorCode = Q
    }
      , Xj = function(Q) {
        this.W = Q
    }
      , ep = function(Q, c) {
        this.j = Q;
        this.W = c
    }
      , Vx = function(Q, c) {
        if (typeof Q !== "function")
            throw Error("Fn must not be null and must be a function");
        return g.qX.setTimeout(function() {
            Q()
        }, c)
    }
      , xr = function() {
        B$.dispatchEvent(new k$a)
    }
      , qW = function(Q, c, W, m) {
        this.W = Q;
        this.j = c;
        this.J = W;
        this.D = m || 1;
        this.O = 45E3;
        this.A = new g.Hx(this);
        this.K = new g.DE;
        this.K.setInterval(250)
    }
      , pO9 = function(Q, c, W) {
        Q.kD = 1;
        Q.kV = T8(c.clone());
        Q.hD = W;
        Q.Ie = !0;
        Y79(Q, null)
    }
      , nT = function(Q, c, W, m, K) {
        Q.kD = 1;
        Q.kV = T8(c.clone());
        Q.hD = null;
        Q.Ie = W;
        K && (Q.L9 = !1);
        Y79(Q, m)
    }
      , Y79 = function(Q, c) {
        Q.Jg = Date.now();
        DD(Q);
        Q.Xh = Q.kV.clone();
        ot(Q.Xh, "t", Q.D);
        Q.Hr = 0;
        Q.hI = Q.W.Yd(Q.W.sF() ? c : null);
        Q.ob > 0 && (Q.Dd = new g.F_((0,
        g.EO)(Q.H0, Q, Q.hI),Q.ob));
        Q.A.listen(Q.hI, "readystatechange", Q.nG);
        c = Q.uG ? g.za(Q.uG) : {};
        Q.hD ? (Q.gK = "POST",
        c["Content-Type"] = "application/x-www-form-urlencoded",
        Q.hI.send(Q.Xh, Q.gK, Q.hD, c)) : (Q.gK = "GET",
        Q.L9 && !g.xG && (c.Connection = "close"),
        Q.hI.send(Q.Xh, Q.gK, null, c));
        Q.W.jb(1)
    }
      , czD = function(Q, c) {
        var W = Q.Hr
          , m = c.indexOf("\n", W);
        if (m == -1)
            return ti;
        W = Number(c.substring(W, m));
        if (isNaN(W))
            return QYo;
        m += 1;
        if (m + W > c.length)
            return ti;
        c = c.slice(m, m + W);
        Q.Hr = m + W;
        return c
    }
      , DD = function(Q) {
        Q.Vx = Date.now() + Q.O;
        WN4(Q, Q.O)
    }
      , WN4 = function(Q, c) {
        if (Q.ST != null)
            throw Error("WatchDog timer not null");
        Q.ST = Vx((0,
        g.EO)(Q.Vk, Q), c)
    }
      , mAa = function(Q) {
        Q.ST && (g.qX.clearTimeout(Q.ST),
        Q.ST = null)
    }
      , H$ = function(Q) {
        Q.W.NK() || Q.gY || Q.W.Rb(Q)
    }
      , NW = function(Q) {
        mAa(Q);
        g.BN(Q.Dd);
        Q.Dd = null;
        Q.K.stop();
        Q.A.removeAll();
        if (Q.hI) {
            const c = Q.hI;
            Q.hI = null;
            c.abort();
            c.dispose()
        }
        Q.Jc && (Q.Jc = null)
    }
      , KNm = function(Q, c) {
        try {
            Q.W.JT(Q, c),
            Q.W.jb(4)
        } catch (W) {}
    }
      , ouW = function(Q, c, W, m, K) {
        if (m == 0)
            W(!1);
        else {
            var T = K || 0;
            m--;
            TVi(Q, c, function(r) {
                r ? W(!0) : g.qX.setTimeout(function() {
                    ouW(Q, c, W, m, T)
                }, T)
            })
        }
    }
      , TVi = function(Q, c, W) {
        const m = new Image;
        m.onload = function() {
            try {
                ie(m),
                W(!0)
            } catch (K) {}
        }
        ;
        m.onerror = function() {
            try {
                ie(m),
                W(!1)
            } catch (K) {}
        }
        ;
        m.onabort = function() {
            try {
                ie(m),
                W(!1)
            } catch (K) {}
        }
        ;
        m.ontimeout = function() {
            try {
                ie(m),
                W(!1)
            } catch (K) {}
        }
        ;
        g.qX.setTimeout(function() {
            if (m.ontimeout)
                m.ontimeout()
        }, c);
        m.src = Q
    }
      , ie = function(Q) {
        Q.onload = null;
        Q.onerror = null;
        Q.onabort = null;
        Q.ontimeout = null
    }
      , rzv = function(Q) {
        this.W = Q;
        this.O = new oJ
    }
      , UAi = function(Q) {
        const c = yx(Q.W, Q.Tu, "/mail/images/cleardot.gif");
        T8(c);
        ouW(c.toString(), 5E3, (0,
        g.EO)(Q.K8, Q), 3, 2E3);
        Q.jb(1)
    }
      , Fj = function(Q) {
        var c = Q.W.D;
        c != null ? (xr(),
        c ? (xr(),
        Sp(Q.W, Q, !1)) : (xr(),
        Sp(Q.W, Q, !0))) : (Q.eM = new qW(Q),
        Q.eM.uG = Q.SH,
        c = Q.W,
        c = yx(c, c.sF() ? Q.JN : null, Q.Ff),
        xr(),
        ot(c, "TYPE", "xmlhttp"),
        nT(Q.eM, c, !1, Q.JN, !1))
    }
      , ZD = function(Q, c, W) {
        this.W = 1;
        this.O = [];
        this.A = [];
        this.K = new oJ;
        this.Y = Q || null;
        this.D = c != null ? c : null;
        this.L = W || !1
    }
      , IEo = function(Q, c) {
        this.W = Q;
        this.map = c;
        this.context = null
    }
      , XJH = function(Q, c, W, m) {
        g.tG.call(this, "timingevent", Q);
        this.size = c;
        this.rtt = W;
        this.retries = m
    }
      , Aza = function(Q) {
        g.tG.call(this, "serverreachability", Q)
    }
      , eh9 = function(Q) {
        Q.YF(1, 0);
        Q.l_ = yx(Q, null, Q.m0);
        Eq(Q)
    }
      , VHD = function(Q) {
        Q.P4 && (Q.P4.abort(),
        Q.P4 = null);
        Q.eQ && (Q.eQ.cancel(),
        Q.eQ = null);
        Q.K3 && (g.qX.clearTimeout(Q.K3),
        Q.K3 = null);
        sq(Q);
        Q.UE && (Q.UE.cancel(),
        Q.UE = null);
        Q.wx && (g.qX.clearTimeout(Q.wx),
        Q.wx = null)
    }
      , dN = function(Q, c) {
        if (Q.W == 0)
            throw Error("Invalid operation: sending map when state is closed");
        Q.O.push(new IEo(Q.Sd++,c));
        Q.W != 2 && Q.W != 3 || Eq(Q)
    }
      , BV4 = function(Q) {
        let c = 0;
        Q.eQ && c++;
        Q.UE && c++;
        return c
    }
      , Eq = function(Q) {
        Q.UE || Q.wx || (Q.wx = Vx((0,
        g.EO)(Q.dI, Q), 0),
        Q.FR = 0)
    }
      , q_W = function(Q, c) {
        if (Q.W == 1) {
            if (!c) {
                Q.cQ = Math.floor(Math.random() * 1E5);
                c = Q.cQ++;
                const W = new qW(Q,"",c);
                W.uG = Q.SM;
                const m = LT(Q)
                  , K = Q.l_.clone();
                g.eX(K, "RID", c);
                g.eX(K, "CVER", "1");
                wN(Q, K);
                pO9(W, K, m);
                Q.UE = W;
                Q.W = 2
            }
        } else
            Q.W == 3 && (c ? xAH(Q, c) : Q.O.length == 0 || Q.UE || xAH(Q))
    }
      , xAH = function(Q, c) {
        if (c)
            if (Q.DR > 6) {
                Q.O = Q.A.concat(Q.O);
                Q.A.length = 0;
                var W = Q.cQ - 1;
                c = LT(Q)
            } else
                W = c.J,
                c = c.hD;
        else
            W = Q.cQ++,
            c = LT(Q);
        const m = Q.l_.clone();
        g.eX(m, "SID", Q.j);
        g.eX(m, "RID", W);
        g.eX(m, "AID", Q.Ea);
        wN(Q, m);
        W = new qW(Q,Q.j,W,Q.FR + 1);
        W.uG = Q.SM;
        W.setTimeout(1E4 + Math.round(1E4 * Math.random()));
        Q.UE = W;
        pO9(W, m, c)
    }
      , wN = function(Q, c) {
        Q.Ws && (Q = Q.Ws.Nn()) && g.ZS(Q, function(W, m) {
            g.eX(c, m, W)
        })
    }
      , LT = function(Q) {
        const c = Math.min(Q.O.length, 1E3)
          , W = ["count=" + c];
        let m;
        Q.DR > 6 && c > 0 ? (m = Q.O[0].W,
        W.push("ofs=" + m)) : m = 0;
        for (let K = 0; K < c; K++) {
            let T = Q.O[K].W;
            const r = Q.O[K].map;
            T = Q.DR <= 6 ? K : T - m;
            try {
                g.ZS(r, function(U, I) {
                    W.push("req" + T + "_" + I + "=" + encodeURIComponent(U))
                })
            } catch (U) {
                W.push("req" + T + "_type=" + encodeURIComponent("_badmap"))
            }
        }
        Q.A = Q.A.concat(Q.O.splice(0, c));
        return W.join("&")
    }
      , nuS = function(Q) {
        Q.eQ || Q.K3 || (Q.J = 1,
        Q.K3 = Vx((0,
        g.EO)(Q.Za, Q), 0),
        Q.RV = 0)
    }
      , be = function(Q) {
        if (Q.eQ || Q.K3 || Q.RV >= 3)
            return !1;
        Q.J++;
        Q.K3 = Vx((0,
        g.EO)(Q.Za, Q), DAS(Q, Q.RV));
        Q.RV++;
        return !0
    }
      , Sp = function(Q, c, W) {
        Q.jH = Q.D == null ? W : !Q.D;
        Q.Rp = c.Q_;
        Q.L || eh9(Q)
    }
      , sq = function(Q) {
        Q.XY != null && (g.qX.clearTimeout(Q.XY),
        Q.XY = null)
    }
      , DAS = function(Q, c) {
        let W = 5E3 + Math.floor(Math.random() * 1E4);
        Q.isActive() || (W *= 2);
        return W * c
    }
      , jp = function(Q, c) {
        if (c == 2 || c == 9) {
            var W = null;
            Q.Ws && (W = null);
            var m = (0,
            g.EO)(Q.Dj, Q);
            W || (W = new g.KG("//www.google.com/images/cleardot.gif"),
            T8(W));
            TVi(W.toString(), 1E4, m)
        } else
            xr();
        tHi(Q, c)
    }
      , tHi = function(Q, c) {
        Q.W = 0;
        Q.Ws && Q.Ws.LV(c);
        HOZ(Q);
        VHD(Q)
    }
      , HOZ = function(Q) {
        Q.W = 0;
        Q.Rp = -1;
        if (Q.Ws)
            if (Q.A.length == 0 && Q.O.length == 0)
                Q.Ws.b8();
            else {
                const c = g.Xi(Q.A)
                  , W = g.Xi(Q.O);
                Q.A.length = 0;
                Q.O.length = 0;
                Q.Ws.b8(c, W)
            }
    }
      , yx = function(Q, c, W) {
        let m = g.Vt(W);
        if (m.W != "")
            c && g.oO(m, c + "." + m.W),
            g.rC(m, m.A);
        else {
            const K = window.location;
            m = vNm(K.protocol, c ? c + "." + K.hostname : K.hostname, +K.port, W)
        }
        Q.ZK && g.ZS(Q.ZK, function(K, T) {
            g.eX(m, T, K)
        });
        g.eX(m, "VER", Q.DR);
        wN(Q, m);
        return m
    }
      , NVS = function() {}
      , iOS = function() {
        this.W = [];
        this.O = []
    }
      , yza = function(Q, c) {
        this.action = Q;
        this.params = c || {}
    }
      , gN = function(Q, c) {
        g.qK.call(this);
        this.W = new g.Uc(this.aj,0,this);
        g.F(this, this.W);
        this.eW = 5E3;
        this.retryCount = this.jI = 0;
        if (typeof Q === "function")
            c && (Q = (0,
            g.EO)(Q, c));
        else if (Q && typeof Q.handleEvent === "function")
            Q = (0,
            g.EO)(Q.handleEvent, Q);
        else
            throw Error("Invalid listener argument");
        this.O = Q
    }
      , Oq = function(Q, c, W=!1, m= () => "", K=!1, T=!1, r=!1, U= () => g.QU({}), I=!1, X, A) {
        this.PA = Q;
        this.b0 = c;
        this.J = new g.$K;
        this.D = A;
        this.O = (this.A = !!X) ? X( () => {
            this.Pt()
        }
        ) : new gN(this.Pt,this);
        this.W = null;
        this.Y = !1;
        this.S = null;
        this.Ie = "";
        this.T2 = this.mF = 0;
        this.j = [];
        this.Re = W;
        this.Ka = m;
        this.L = T;
        this.jG = U;
        this.EC = r;
        this.MM = null;
        this.K = g.QU();
        this.Fw = K;
        this.Y0 = I;
        this.JJ = new S_9;
        this.UH = new FND;
        this.La = new ZOS;
        this.HA = new Eum;
        this.XI = new sY4;
        this.WB = new dAi;
        this.iX = new LN0
    }
      , wJD = function(Q, c, W, m, K) {
        fT(Q);
        if (Q.W) {
            const T = g.v("ID_TOKEN")
              , r = Q.W.SM || {};
            T ? r["x-youtube-identity-token"] = T : delete r["x-youtube-identity-token"];
            Q.W.SM = r
        }
        m ? (m.getState() != 3 && BV4(m) == 0 || m.getState(),
        Q.W.connect(c, W, Q.b0, m.j, m.Ea)) : K ? Q.W.connect(c, W, Q.b0, K.sessionId, K.arrayId) : Q.W.connect(c, W, Q.b0);
        Q.A && !Q.O.isActive() && Q.O.start();
        Q.D && Q.D.lr0()
    }
      , jYS = function(Q, c) {
        return Q.Y0 ? !Object.values(bO0).includes(c) : !1
    }
      , gu0 = async function(Q) {
        try {
            await v$(Q)
        } finally {
            var c = Q.j;
            Q.j = [];
            var W = c;
            c = c.length;
            for (let m = 0; m < c; ++m)
                dN(Q.W, W[m]);
            aJ(Q);
            aJ(Q)
        }
    }
      , aJ = function(Q) {
        Q.publish("handlerOpened");
        Q.JJ.W("BROWSER_CHANNEL")
    }
      , fT = function(Q) {
        if (Q.W) {
            const c = Q.Ka()
              , W = Q.W.SM || {};
            c ? W["x-youtube-lounge-xsrf-token"] = c : delete W["x-youtube-lounge-xsrf-token"];
            Q.W.SM = W
        }
    }
      , v$ = function(Q) {
        if (!Q.EC)
            return OOm(Q);
        Q.MM === null && (Q.MM = OOm(Q));
        return Q.MM
    }
      , OOm = function(Q) {
        return g.rV(Q.jG().then(c => {
            if (Q.W) {
                let W = Q.W.SM || {};
                c && Object.keys(c).length > 0 ? W = {
                    ...W,
                    ...c
                } : delete W.Authorization;
                Q.W.SM = W
            }
        }
        ).fF( () => {}
        ), () => {
            Q.MM = null
        }
        )
    }
      , G6 = function(Q) {
        this.scheme = "https";
        this.port = this.domain = "";
        this.W = "/api/lounge";
        this.O = !0;
        Q = Q || document.location.href;
        const c = Number(g.qN(Q)[4] || null) || "";
        c && (this.port = ":" + c);
        this.domain = g.D9(Q) || "";
        Q = g.iC();
        Q.search("MSIE") >= 0 && (Q = Q.match(/MSIE ([\d.]+)/)[1],
        g.N$(Q, "10.0") < 0 && (this.O = !1))
    }
      , $r = function(Q, c) {
        let W = Q.W;
        Q.O && (W = Q.scheme + "://" + Q.domain + Q.port + Q.W);
        return g.sJ(W + c, {})
    }
      , fEa = function(Q) {
        g.s7(Q.channel, "m", () => {
            Q.D = 3;
            Q.A.reset();
            Q.L = null;
            Q.J = 0;
            for (const c of Q.S)
                Q.channel && Q.channel.send(c);
            Q.S = [];
            Q.publish("webChannelOpened");
            Q.Ka.W("WEB_CHANNEL")
        }
        );
        g.s7(Q.channel, "n", () => {
            Q.D = 0;
            Q.A.isActive() || Q.publish("webChannelClosed");
            const c = Q.channel?.j().A();
            c && (Q.S = [...c]);
            Q.T2.W("WEB_CHANNEL")
        }
        );
        g.s7(Q.channel, "p", c => {
            const W = c.data;
            W[0] === "gracefulReconnect" ? (Q.A.start(),
            Q.channel && Q.channel.close()) : Q.publish("webChannelMessage", new yza(W[0],W[1]));
            Q.XS = c.statusCode;
            Q.MM.W("WEB_CHANNEL")
        }
        );
        g.s7(Q.channel, "o", () => {
            Q.XS === 401 || Q.A.start();
            Q.publish("webChannelError");
            Q.Ie.W("WEB_CHANNEL", "")
        }
        )
    }
      , P$ = function(Q) {
        const c = Q.b0();
        c ? Q.j["x-youtube-lounge-xsrf-token"] = c : delete Q.j["x-youtube-lounge-xsrf-token"]
    }
      , $Am = function(Q, c, W= () => "", m, K) {
        const T = () => new Oq($r(Q, "/bc"),c,!1,W,m);
        return g.P("enable_mdx_web_channel_desktop") ? new vuo( () => new aEv($r(Q, "/wc"),c,W)) : new GQa(T,K)
    }
      , hha = function() {
        var Q = PSW;
        lEa();
        le.push(Q);
        un4()
    }
      , ue = function(Q, c) {
        lEa();
        const W = zhH(Q, String(c));
        le.length == 0 ? CS1(W) : (un4(),
        g.lw(le, function(m) {
            m(W)
        }))
    }
      , hi = function(Q) {
        ue("CP", Q)
    }
      , lEa = function() {
        le || (le = g.DR("yt.mdx.remote.debug.handlers_") || [],
        g.n7("yt.mdx.remote.debug.handlers_", le))
    }
      , CS1 = function(Q) {
        const c = (z6 + 1) % 50;
        z6 = c;
        CT[c] = Q;
        MW || (MW = c == 49)
    }
      , un4 = function() {
        var Q = le;
        if (CT[0]) {
            var c = MW ? z6 : -1;
            do {
                c = (c + 1) % 50;
                const W = CT[c];
                g.lw(Q, function(m) {
                    m(W)
                })
            } while (c != z6);
            CT = Array(50);
            z6 = -1;
            MW = !1
        }
    }
      , zhH = function(Q, c) {
        let W = (Date.now() - MH9) / 1E3;
        W.toFixed && (W = W.toFixed(3));
        const m = [];
        m.push("[", W + "s", "] ");
        m.push("[", "yt.mdx.remote", "] ");
        m.push(Q + ": " + c, "\n");
        return m.join("")
    }
      , Ji = function(Q) {
        g.W1.call(this);
        this.D = Q;
        this.screens = []
    }
      , Jz0 = function(Q, c) {
        const W = Q.get(c.uuid) || Q.get(c.id);
        if (W)
            return Q = W.name,
            W.id = c.id || W.id,
            W.name = c.name,
            W.token = c.token,
            W.uuid = c.uuid || W.uuid,
            W.name != Q;
        Q.screens.push(c);
        return !0
    }
      , Rho = function(Q, c) {
        let W = Q.screens.length != c.length;
        Q.screens = g.uw(Q.screens, function(K) {
            return !!Dn(c, K)
        });
        const m = c.length;
        for (let K = 0; K < m; K++)
            W = Jz0(Q, c[K]) || W;
        return W
    }
      , kQv = function(Q, c) {
        const W = Q.screens.length;
        Q.screens = g.uw(Q.screens, function(m) {
            return !(m || c ? !m != !c ? 0 : m.id == c.id : 1)
        });
        return Q.screens.length < W
    }
      , kr = function(Q) {
        Ji.call(this, "LocalScreenService");
        this.O = Q;
        this.W = NaN;
        RJ(this);
        this.info("Initializing with " + qd(this.screens))
    }
      , Y_Z = function(Q) {
        if (Q.screens.length) {
            const c = g.hy(Q.screens, function(m) {
                return m.id
            })
              , W = $r(Q.O, "/pairing/get_lounge_token_batch");
            Q.O.sendRequest("POST", W, {
                screen_ids: c.join(",")
            }, (0,
            g.EO)(Q.t9, Q), (0,
            g.EO)(Q.bH, Q))
        }
    }
      , RJ = function(Q) {
        if (g.P("deprecate_pair_servlet_enabled"))
            return Rho(Q, []);
        var c = Mva(QFv());
        c = g.uw(c, function(W) {
            return !W.uuid
        });
        return Rho(Q, c)
    }
      , Yr = function(Q, c) {
        WZo(g.hy(Q.screens, z3m));
        c && cGo()
    }
      , pT = function(Q) {
        ue("OnlineScreenService", Q)
    }
      , QQ = function(Q) {
        isNaN(Q.A) || g.JB(Q.A);
        Q.A = g.zn((0,
        g.EO)(Q.J, Q), Q.j > 0 && Q.j < g.d0() ? 2E4 : 1E4)
    }
      , cH = function(Q, c) {
        a: if (rp(c) != rp(Q.W))
            var W = !1;
        else {
            W = g.Ov(c);
            var m = W.length;
            for (let K = 0; K < m; ++K)
                if (!Q.W[W[K]]) {
                    W = !1;
                    break a
                }
            W = !0
        }
        W || (pT("Updated online screens: " + g.bS(Q.W)),
        Q.W = c,
        Q.publish("screenChange"));
        pJa(Q)
    }
      , WH = function(Q, c, W) {
        const m = $r(Q.K, "/pairing/get_screen_availability");
        Q.K.sendRequest("POST", m, {
            lounge_token: c.token
        }, (0,
        g.EO)(function(K) {
            K = K.screens || [];
            const T = K.length;
            for (let r = 0; r < T; ++r)
                if (K[r].loungeToken == c.token) {
                    W(K[r].status == "online");
                    return
                }
            W(!1)
        }, Q), (0,
        g.EO)(function() {
            W(!1)
        }, Q))
    }
      , pJa = function(Q) {
        Q = g.Ov(g.Ev(Q.W, function(c) {
            return c
        }));
        g.iD(Q);
        Q.length ? g.rl("yt-remote-online-screen-ids", Q.join(","), 60) : g.IC("yt-remote-online-screen-ids")
    }
      , QKD = function(Q) {
        const c = {};
        g.lw(Q.D(), function(W) {
            W.token ? c[W.token] = W.id : this.jB("Requesting availability of screen w/o lounge token.")
        });
        return c
    }
      , m$ = function(Q, c=!1) {
        Ji.call(this, "ScreenService");
        this.j = Q;
        this.J = c;
        this.W = this.O = null;
        this.A = [];
        this.K = {};
        cJ9(this)
    }
      , mbo = function(Q, c, W, m, K, T) {
        Q.info("getAutomaticScreenByIds " + W + " / " + c);
        W || (W = Q.K[c]);
        const r = Q.M4();
        let U = W ? te(r, W) : null;
        W && (Q.J || U) || (U = te(r, c));
        if (U) {
            U.uuid = c;
            const I = K1(Q, U);
            WH(Q.W, I, function(X) {
                K(X ? I : null)
            })
        } else
            W ? Wu9(Q, W, (0,
            g.EO)(function(I) {
                const X = K1(this, new VE({
                    name: m,
                    screenId: W,
                    loungeToken: I,
                    dialId: c || ""
                }));
                WH(this.W, X, function(A) {
                    K(A ? X : null)
                })
            }, Q), T) : K(null)
    }
      , Ku1 = function(Q, c) {
        const W = Q.screens.length;
        for (let m = 0; m < W; ++m)
            if (Q.screens[m].name == c)
                return Q.screens[m];
        return null
    }
      , Tw9 = function(Q, c, W) {
        WH(Q.W, c, W)
    }
      , Wu9 = function(Q, c, W, m) {
        Q.info("requestLoungeToken_ for " + c);
        const K = {
            postParams: {
                screen_ids: c
            },
            method: "POST",
            context: Q,
            onSuccess: function(T, r) {
                T = r && r.screens || [];
                T[0] && T[0].screenId == c ? W(T[0].loungeToken) : m(Error("Missing lounge token in token response"))
            },
            onError: function() {
                m(Error("Request screen lounge token failed"))
            }
        };
        g.Wn($r(Q.j, "/pairing/get_lounge_token_batch"), K)
    }
      , od9 = function(Q) {
        Q.screens = Q.O.M4();
        var c = Q.K;
        const W = {};
        for (var m in c)
            W[c[m]] = m;
        c = Q.screens.length;
        for (m = 0; m < c; ++m) {
            const K = Q.screens[m];
            K.uuid = W[K.id] || ""
        }
        Q.info("Updated manual screens: " + qd(Q.screens))
    }
      , cJ9 = function(Q) {
        TP(Q);
        Q.O = new kr(Q.j);
        Q.O.subscribe("screenChange", (0,
        g.EO)(Q.wb, Q));
        od9(Q);
        Q.J || (Q.A = Mva(g.UM("yt-remote-automatic-screen-cache") || []));
        TP(Q);
        Q.info("Initializing automatic screens: " + qd(Q.A));
        Q.W = new rJa(Q.j,(0,
        g.EO)(Q.M4, Q, !0));
        Q.W.subscribe("screenChange", (0,
        g.EO)(function() {
            this.publish("onlineScreenChange")
        }, Q))
    }
      , K1 = function(Q, c) {
        var W = Q.get(c.id);
        W ? (W.uuid = c.uuid,
        c = W) : ((W = te(Q.A, c.uuid)) ? (W.id = c.id,
        W.token = c.token,
        c = W) : Q.A.push(c),
        Q.J || Uba(Q));
        TP(Q);
        Q.K[c.uuid] = c.id;
        g.rl("yt-remote-device-id-map", Q.K, 31536E3);
        return c
    }
      , Uba = function(Q) {
        Q = g.uw(Q.A, c => c.idType != "shortLived");
        g.rl("yt-remote-automatic-screen-cache", g.hy(Q, z3m))
    }
      , TP = function(Q) {
        Q.K = g.UM("yt-remote-device-id-map") || {}
    }
      , oV = function(Q, c, W) {
        g.W1.call(this);
        this.Ie = W;
        this.j = Q;
        this.O = c;
        this.W = null
    }
      , rz = function(Q, c) {
        Q.W = c;
        Q.publish("sessionScreen", Q.W)
    }
      , IaW = function(Q, c) {
        Q.W && (Q.W.token = c,
        K1(Q.j, Q.W));
        Q.publish("sessionScreen", Q.W)
    }
      , UG = function(Q, c) {
        ue(Q.Ie, c)
    }
      , AJH = function(Q, c) {
        g.JB(Q.mF);
        Q.mF = 0;
        c ? Q.config_.enableCastLoungeToken && c.loungeToken ? c.deviceId ? Q.W && Q.W.uuid == c.deviceId || (c.loungeTokenRefreshIntervalMs ? XG4(Q, {
            name: Q.O.friendlyName,
            screenId: c.screenId,
            loungeToken: c.loungeToken,
            dialId: c.deviceId,
            screenIdType: "shortLived"
        }, c.loungeTokenRefreshIntervalMs) : (g.Zp(Error(`No loungeTokenRefreshIntervalMs presents in mdxSessionStatusData: ${JSON.stringify(c)}.`)),
        IV(Q, c.screenId))) : (g.Zp(Error(`No device id presents in mdxSessionStatusData: ${JSON.stringify(c)}.`)),
        IV(Q, c.screenId)) : IV(Q, c.screenId) : Q.Yq(Error("Waiting for session status timed out."))
    }
      , eTi = function(Q) {
        g.JB(Q.Y);
        Q.Y = 0;
        g.JB(Q.J);
        Q.J = 0;
        g.JB(Q.mF);
        Q.mF = 0;
        g.JB(Q.K);
        Q.K = 0;
        g.JB(Q.L);
        Q.L = 0
    }
      , Vua = function(Q, c) {
        Q.info("sendYoutubeMessage_: " + c + " " + g.bS());
        const W = {};
        W.type = c;
        Q.A ? Q.A.sendMessage("urn:x-cast:com.google.youtube.mdx", W, () => {}
        , (0,
        g.EO)(function() {
            UG(this, "Failed to send message: " + c + ".")
        }, Q)) : UG(Q, "Sending yt message without session: " + g.bS(W))
    }
      , xb1 = function(Q) {
        Vua(Q, "getLoungeToken");
        g.JB(Q.K);
        Q.K = g.zn( () => {
            Bw0(Q, null)
        }
        , 3E4)
    }
      , X2 = function(Q, c) {
        g.JB(Q.L);
        Q.L = 0;
        c == 0 ? xb1(Q) : Q.L = g.zn( () => {
            xb1(Q)
        }
        , c)
    }
      , Bw0 = function(Q, c) {
        g.JB(Q.K);
        Q.K = 0;
        let W = null;
        c ? c.loungeToken ? Q.W?.token == c.loungeToken && (W = "staleLoungeToken") : W = "missingLoungeToken" : W = "noLoungeTokenResponse";
        W ? (Q.info(`Did not receive a new lounge token in onLoungeToken_ with data: ${JSON.stringify(c)}, error: ${W}`),
        X2(Q, 3E4)) : (IaW(Q, c.loungeToken),
        X2(Q, c.loungeTokenRefreshIntervalMs))
    }
      , IV = function(Q, c) {
        c ? (Q.info("onConnectedScreenId_: Received screenId: " + c),
        Q.W && Q.W.id == c || Q.MM(c, W => {
            rz(Q, W)
        }
        , () => Q.Yq(), 5)) : Q.Yq(Error("Waiting for session status timed out."))
    }
      , q9S = function(Q, c, W, m) {
        g.JB(Q.J);
        Q.J = 0;
        Tw9(Q.j, c, K => {
            K || m < 0 ? W(K) : Q.J = g.zn( () => {
                q9S(Q, c, W, m - 1)
            }
            , 300)
        }
        )
    }
      , XG4 = function(Q, c, W) {
        Q.info(`onConnectedScreenData_: Received screenData: ${JSON.stringify(c)}`);
        const m = new VE(c);
        q9S(Q, m, K => {
            K ? (K1(Q.j, m),
            rz(Q, m),
            X2(Q, W)) : (g.Zp(Error(`CastSession, RemoteScreen from screenData: ${JSON.stringify(c)} is not online.`)),
            Q.Yq())
        }
        , 5)
    }
      , At = function(Q) {
        return new Promise(c => {
            Q.b0 = nx();
            if (Q.Ka) {
                const W = new chrome.cast.DialLaunchResponse(!0,ndo(Q));
                c(W);
                Db1(Q)
            } else
                Q.S = () => {
                    g.JB(Q.mF);
                    Q.S = () => {}
                    ;
                    Q.mF = NaN;
                    const W = new chrome.cast.DialLaunchResponse(!0,ndo(Q));
                    c(W);
                    Db1(Q)
                }
                ,
                Q.mF = g.zn( () => {
                    Q.S()
                }
                , 100)
        }
        )
    }
      , tuS = function(Q) {
        g.JB(Q.J);
        Q.J = 0;
        g.JB(Q.L);
        Q.L = 0;
        Q.K();
        Q.K = () => {}
        ;
        g.JB(Q.mF)
    }
      , e6 = function(Q) {
        return !(!Q.config_.enableDialLoungeToken || !Q.A?.getDialAppInfo)
    }
      , VQ = function(Q, c) {
        Q.info(`getDialAppInfoWithTimeout_ ${c}`);
        e6(Q) && (g.JB(Q.L),
        Q.L = 0,
        c == 0 ? HZi(Q) : Q.L = g.zn( () => {
            HZi(Q)
        }
        , c))
    }
      , Db1 = function(Q) {
        Q.K = Q.j.nV(Q.b0, Q.O.label, Q.O.friendlyName, e6(Q), (c, W) => {
            Q.K = () => {}
            ;
            rz(Q, c);
            c.idType == "shortLived" && W > 0 && VQ(Q, W)
        }
        , c => {
            Q.K = () => {}
            ;
            Q.Yq(c)
        }
        )
    }
      , ndo = function(Q) {
        var c = {};
        c.pairingCode = Q.b0;
        c.theme = Q.jG;
        KZv() && (c.env_useStageMdx = 1);
        return g.EJ(c)
    }
      , Nw1 = function(Q, c) {
        const W = Q.Y.receiver.label
          , m = Q.O.friendlyName;
        return (new Promise(K => {
            mbo(Q.j, W, c, m, T => {
                T && T.token && rz(Q, T);
                K(T)
            }
            , T => {
                UG(Q, "Failed to get DIAL screen: " + T);
                K(null)
            }
            )
        }
        )).then(K => K && K.token ? new chrome.cast.DialLaunchResponse(!1) : At(Q))
    }
      , yJa = function(Q, c, W) {
        Q.info(`initOnConnectedScreenDataPromise_: Received screenData: ${JSON.stringify(c)}`);
        const m = new VE(c);
        return (new Promise(K => {
            iZD(Q, m, T => {
                T ? (K1(Q.j, m),
                rz(Q, m),
                VQ(Q, W)) : g.Zp(Error(`DialSession, RemoteScreen from screenData: ${JSON.stringify(c)} is not online.`));
                K(T)
            }
            , 5)
        }
        )).then(K => K ? new chrome.cast.DialLaunchResponse(!1) : At(Q))
    }
      , iZD = function(Q, c, W, m) {
        g.JB(Q.J);
        Q.J = 0;
        Tw9(Q.j, c, K => {
            K || m < 0 ? W(K) : Q.J = g.zn( () => {
                iZD(Q, c, W, m - 1)
            }
            , 300)
        }
        )
    }
      , HZi = function(Q) {
        e6(Q) && Q.A.getDialAppInfo(c => {
            Q.info(`getDialAppInfo dialLaunchData: ${JSON.stringify(c)}`);
            c = c.extraData || {};
            let W = null;
            c.loungeToken ? Q.W?.token == c.loungeToken && (W = "staleLoungeToken") : W = "missingLoungeToken";
            W ? VQ(Q, 3E4) : (IaW(Q, c.loungeToken),
            VQ(Q, c.loungeTokenRefreshIntervalMs))
        }
        , c => {
            Q.info(`getDialAppInfo error: ${c}`);
            VQ(Q, 3E4)
        }
        )
    }
      , PSW = function(Q) {
        window.chrome && chrome.cast && chrome.cast.logMessage && chrome.cast.logMessage(Q)
    }
      , Fuo = function(Q) {
        const c = Q.O.VQ();
        let W = Q.W && Q.W.O;
        Q = g.hy(c, function(m) {
            W && Bg(m, W.label) && (W = null);
            const K = m.uuid ? m.uuid : m.id;
            let T = S9a(this, m);
            T ? (T.label = K,
            T.friendlyName = m.name) : (T = new chrome.cast.Receiver(K,m.name),
            T.receiverType = chrome.cast.ReceiverType.CUSTOM);
            return T
        }, Q);
        W && (W.receiverType != chrome.cast.ReceiverType.CUSTOM && (W = new chrome.cast.Receiver(W.label,W.friendlyName),
        W.receiverType = chrome.cast.ReceiverType.CUSTOM),
        Q.push(W));
        return Q
    }
      , BH = function(Q) {
        return Q.L || !!Q.A.length || !!Q.W
    }
      , x_ = function(Q) {
        ue("Controller", Q)
    }
      , qx = function(Q, c, W) {
        c != Q.W && (g.BN(Q.W),
        (Q.W = c) ? (W ? Q.publish("yt-remote-cast2-receiver-resumed", c.O) : Q.publish("yt-remote-cast2-receiver-selected", c.O),
        c.subscribe("sessionScreen", (0,
        g.EO)(Q.mF, Q, c)),
        c.subscribe("sessionFailed", () => ZZZ(Q, c)),
        c.W ? Q.publish("yt-remote-cast2-session-change", c.W) : W && Q.W.D(null)) : Q.publish("yt-remote-cast2-session-change", null))
    }
      , S9a = function(Q, c) {
        return c ? g.Yx(Q.A, function(W) {
            return Bg(c, W.label)
        }, Q) : null
    }
      , ZZZ = function(Q, c) {
        Q.W == c && Q.publish("yt-remote-cast2-session-failed")
    }
      , bZv = function(Q, c, W, m) {
        m.disableCastApi ? n1("Cannot initialize because disabled by Mdx config.") : EdH() ? sKH(c, m) && (DW(!0),
        window.chrome && chrome.cast && chrome.cast.isAvailable ? dba(Q, W) : (window.__onGCastApiAvailable = function(K, T) {
            K ? dba(Q, W) : (tt("Failed to load cast API: " + T),
            HH(!1),
            DW(!1),
            g.IC("yt-remote-cast-available"),
            g.IC("yt-remote-cast-receiver"),
            LuS(),
            W(!1))
        }
        ,
        m.loadCastApiSetupScript ? g.mD(wGS) : window.navigator.userAgent.indexOf("Android") >= 0 && window.navigator.userAgent.indexOf("Chrome/") >= 0 && window.navigator.presentation ? EL() >= 60 && AGi() : !window.chrome || !window.navigator.presentation || window.navigator.userAgent.indexOf("Edge") >= 0 ? dp() : EL() >= 89 ? VaD() : (Lx(),
        sL(ewm.map(UHo))))) : n1("Cannot initialize because not running Chrome")
    }
      , LuS = function() {
        n1("dispose");
        const Q = Nx();
        Q && Q.dispose();
        g.n7("yt.mdx.remote.cloudview.instance_", null);
        jKS(!1);
        g.cm(i$);
        i$.length = 0
    }
      , yQ = function() {
        return !!g.UM("yt-remote-cast-installed")
    }
      , gdm = function() {
        const Q = g.UM("yt-remote-cast-receiver");
        return Q ? Q.friendlyName : null
    }
      , OZ1 = function() {
        n1("clearCurrentReceiver");
        g.IC("yt-remote-cast-receiver")
    }
      , faH = function() {
        return yQ() ? Nx() ? Nx().getCastSession() : (tt("getCastSelector: Cast is not initialized."),
        null) : (tt("getCastSelector: Cast API is not installed!"),
        null)
    }
      , F2 = function() {
        yQ() ? Nx() ? S6() ? (n1("Requesting cast selector."),
        Nx().requestSession()) : (n1("Wait for cast API to be ready to request the session."),
        i$.push(g.Qp("yt-remote-cast2-api-ready", F2))) : tt("requestCastSelector: Cast is not initialized.") : tt("requestCastSelector: Cast API is not installed!")
    }
      , ZW = function(Q, c) {
        S6() ? Nx().setConnectedScreenStatus(Q, c) : tt("setConnectedScreenStatus called before ready.")
    }
      , EdH = function() {
        var Q = g.iC().search(/ (CrMo|Chrome|CriOS)\//) >= 0;
        return g.Am || Q
    }
      , vda = function(Q, c) {
        Nx().init(Q, c)
    }
      , sKH = function(Q, c) {
        let W = !1;
        Nx() || (Q = new EG(Q,c),
        Q.subscribe("yt-remote-cast2-availability-change", function(m) {
            g.rl("yt-remote-cast-available", m);
            Zn("yt-remote-cast2-availability-change", m)
        }),
        Q.subscribe("yt-remote-cast2-receiver-selected", function(m) {
            n1("onReceiverSelected: " + m.friendlyName);
            g.rl("yt-remote-cast-receiver", m);
            Zn("yt-remote-cast2-receiver-selected", m)
        }),
        Q.subscribe("yt-remote-cast2-receiver-resumed", function(m) {
            n1("onReceiverResumed: " + m.friendlyName);
            g.rl("yt-remote-cast-receiver", m);
            Zn("yt-remote-cast2-receiver-resumed", m)
        }),
        Q.subscribe("yt-remote-cast2-session-change", function(m) {
            n1("onSessionChange: " + xe(m));
            m || g.IC("yt-remote-cast-receiver");
            Zn("yt-remote-cast2-session-change", m)
        }),
        g.n7("yt.mdx.remote.cloudview.instance_", Q),
        W = !0);
        n1("cloudview.createSingleton_: " + W);
        return W
    }
      , Nx = function() {
        return g.DR("yt.mdx.remote.cloudview.instance_")
    }
      , dba = function(Q, c) {
        HH(!0);
        DW(!1);
        vda(Q, function(W) {
            W ? (jKS(!0),
            g.Wm("yt-remote-cast2-api-ready")) : (tt("Failed to initialize cast API."),
            HH(!1),
            g.IC("yt-remote-cast-available"),
            g.IC("yt-remote-cast-receiver"),
            LuS());
            c(W)
        })
    }
      , n1 = function(Q) {
        ue("cloudview", Q)
    }
      , tt = function(Q) {
        ue("cloudview", Q)
    }
      , HH = function(Q) {
        n1("setCastInstalled_ " + Q);
        g.rl("yt-remote-cast-installed", Q)
    }
      , S6 = function() {
        return !!g.DR("yt.mdx.remote.cloudview.apiReady_")
    }
      , jKS = function(Q) {
        n1("setApiReady_ " + Q);
        g.n7("yt.mdx.remote.cloudview.apiReady_", Q)
    }
      , DW = function(Q) {
        g.n7("yt.mdx.remote.cloudview.initializing_", Q)
    }
      , sG = function(Q) {
        this.index = -1;
        this.videoId = this.listId = "";
        this.volume = this.playerState = -1;
        this.muted = !1;
        this.audioTrackId = null;
        this.K = this.D = 0;
        this.trackData = null;
        this.hasNext = this.hasPrevious = !1;
        this.loadedTime = this.A = this.J = this.O = 0;
        this.W = NaN;
        this.j = !1;
        this.reset(Q)
    }
      , dz = function(Q) {
        Q.audioTrackId = null;
        Q.trackData = null;
        Q.playerState = -1;
        Q.hasPrevious = !1;
        Q.hasNext = !1;
        Q.D = 0;
        Q.K = g.d0();
        Q.O = 0;
        Q.J = 0;
        Q.A = 0;
        Q.loadedTime = 0;
        Q.W = NaN;
        Q.j = !1
    }
      , L1 = function(Q) {
        return Q.isPlaying() ? (g.d0() - Q.K) / 1E3 : 0
    }
      , wz = function(Q, c) {
        Q.D = c;
        Q.K = g.d0()
    }
      , b$ = function(Q) {
        switch (Q.playerState) {
        case 1:
        case 1081:
            return (g.d0() - Q.K) / 1E3 + Q.D;
        case -1E3:
            return 0
        }
        return Q.D
    }
      , aaD = function(Q) {
        return Q.j ? Q.J + L1(Q) : Q.J
    }
      , j6 = function(Q, c, W) {
        const m = Q.videoId;
        Q.videoId = c;
        Q.index = W;
        c != m && dz(Q)
    }
      , gz = function(Q) {
        const c = {};
        c.index = Q.index;
        c.listId = Q.listId;
        c.videoId = Q.videoId;
        c.playerState = Q.playerState;
        c.volume = Q.volume;
        c.muted = Q.muted;
        c.audioTrackId = Q.audioTrackId;
        c.trackData = g.Cm(Q.trackData);
        c.hasPrevious = Q.hasPrevious;
        c.hasNext = Q.hasNext;
        c.playerTime = Q.D;
        c.playerTimeAt = Q.K;
        c.seekableStart = Q.O;
        c.seekableEnd = Q.J;
        c.duration = Q.A;
        c.loadedTime = Q.loadedTime;
        c.liveIngestionTime = Q.W;
        return c
    }
      , GSv = function(Q) {
        g.lw("nowAutoplaying autoplayDismissed remotePlayerChange remoteQueueChange autoplayModeChange autoplayUpNext previousNextChange multiStateLoopEnabled loopModeChange".split(" "), function(c) {
            this.J.push(this.j.subscribe(c, g.sO(this.PA, c), this))
        }, Q)
    }
      , OG = function(Q, c) {
        Q.O && (Q.O.removeUpdateListener(Q.S),
        Q.O.removeMediaListener(Q.Y),
        Q.D(null));
        Q.O = c;
        Q.O && (hi("Setting cast session: " + Q.O.sessionId),
        Q.O.addUpdateListener(Q.S),
        Q.O.addMediaListener(Q.Y),
        Q.O.media.length && Q.D(Q.O.media[0]))
    }
      , f1 = function(Q) {
        return new sG(Q.j.getPlayerContextData())
    }
      , vH = function(Q) {
        return Q.getState() == 1
    }
      , GP = function(Q, c, W) {
        return (0,
        g.EO)(function(m) {
            this.jB("Failed to " + c + " with cast v2 channel. Error code: " + m.code);
            m.code != chrome.cast.ErrorCode.TIMEOUT && (this.jB("Retrying " + c + " using MDx browser channel."),
            aV(this, c, W))
        }, Q)
    }
      , aV = function(Q, c, W) {
        Q.j.sendMessage(c, W)
    }
      , PH = function(Q, c, W) {
        const m = f1(Q);
        wz(m, W);
        m.playerState != -1E3 && (m.playerState = c);
        $_(Q, m)
    }
      , l$ = function(Q, c) {
        var W = Q.K;
        W.W.length + W.O.length < 50 && Q.K.enqueue(c)
    }
      , $_ = function(Q, c) {
        $b9(Q);
        Q.j.setPlayerContextData(gz(c));
        GSv(Q)
    }
      , $b9 = function(Q) {
        g.lw(Q.J, function(c) {
            this.j.unsubscribeByKey(c)
        }, Q);
        Q.J.length = 0
    }
      , Pd9 = function(Q) {
        const c = Q.W.media
          , W = Q.W.customData;
        if (c && W) {
            var m = f1(Q);
            c.contentId != m.videoId && hi("Cast changing video to: " + c.contentId);
            m.videoId = c.contentId;
            m.playerState = W.playerState;
            wz(m, Q.W.getEstimatedTime());
            $_(Q, m)
        } else
            hi("No cast media video. Ignoring state update.")
    }
      , laa = function(Q) {
        u$("Channel opened");
        Q.MM && (Q.MM = !1,
        ht(Q),
        Q.Ie = g.zn( () => {
            u$("Timing out waiting for a screen.");
            Q.J(1)
        }
        , 15E3))
    }
      , cdD = function(Q, c) {
        c = c.message;
        c.params ? u$("Received: action=" + c.action + ", params=" + g.bS(c.params)) : u$("Received: action=" + c.action + " {}");
        switch (c.action) {
        case "loungeStatus":
            c = UL(c.params.devices);
            Q.A = g.hy(c, function(m) {
                return new ex(m)
            });
            c = !!g.Yx(Q.A, function(m) {
                return m.type == "LOUNGE_SCREEN"
            });
            usa(Q, c);
            c = Q.XI("mlm");
            Q.publish("multiStateLoopEnabled", c);
            break;
        case "loungeScreenDisconnected":
            g.rZ(Q.A, function(m) {
                return m.type == "LOUNGE_SCREEN"
            });
            usa(Q, !1);
            break;
        case "remoteConnected":
            let W = new ex(UL(c.params.device));
            g.Yx(Q.A, function(m) {
                return m.equals(W)
            }) || OdS(Q.A, W);
            break;
        case "remoteDisconnected":
            W = new ex(UL(c.params.device));
            g.rZ(Q.A, function(m) {
                return m.equals(W)
            });
            break;
        case "gracefulDisconnect":
            break;
        case "playlistModified":
            hTa(Q, c, "QUEUE_MODIFIED");
            break;
        case "nowPlaying":
            zT1(Q, c);
            break;
        case "onStateChange":
            Cd1(Q, c);
            break;
        case "onAdStateChange":
            Mu0(Q, c);
            break;
        case "onVolumeChanged":
            JJS(Q, c);
            break;
        case "onSubtitlesTrackChanged":
            RTi(Q, c);
            break;
        case "nowAutoplaying":
            kS1(Q, c);
            break;
        case "autoplayDismissed":
            Q.publish("autoplayDismissed");
            break;
        case "autoplayUpNext":
            Y9a(Q, c);
            break;
        case "onAutoplayModeChanged":
            pGS(Q, c);
            break;
        case "onHasPreviousNextChanged":
            QOD(Q, c);
            break;
        case "requestAssistedSignIn":
            Q.publish("assistedSignInRequested", c.params.authCode);
            break;
        case "onLoopModeChanged":
            Q.publish("loopModeChange", c.params.loopMode);
            break;
        default:
            u$("Unrecognized action: " + c.action)
        }
    }
      , u$ = function(Q) {
        ue("conn", Q)
    }
      , WvZ = function(Q) {
        Q.D = g.zn( () => {
            u$("Connecting timeout");
            Q.J(1)
        }
        , 2E4)
    }
      , zP = function(Q, c) {
        Q.publish("proxyStateChange", c)
    }
      , C1 = function(Q) {
        g.JB(Q.D);
        Q.D = NaN
    }
      , Mx = function(Q) {
        g.JB(Q.T2);
        Q.T2 = NaN
    }
      , ht = function(Q) {
        g.JB(Q.Ie);
        Q.Ie = NaN
    }
      , m14 = function(Q) {
        return g.Yx(Q.A, function(c) {
            return c.type == "LOUNGE_SCREEN"
        })
    }
      , Jt = function(Q, c, W) {
        W ? u$("Sending: action=" + c + ", params=" + g.bS(W)) : u$("Sending: action=" + c);
        Q.O.sendMessage(c, W)
    }
      , KvD = function(Q) {
        Mx(Q);
        Q.T2 = g.zn( () => {
            Jt(Q, "getNowPlaying")
        }
        , 2E4)
    }
      , TCZ = function(Q) {
        g.JB(Q.S);
        Q.S = g.zn( () => {
            Q.J(1)
        }
        , 864E5)
    }
      , usa = function(Q, c) {
        var W = null;
        if (c) {
            const m = m14(Q);
            m && (W = {
                clientName: m.clientName,
                deviceMake: m.brand,
                deviceModel: m.model,
                osVersion: m.osVersion
            })
        }
        g.n7("yt.mdx.remote.remoteClient_", W);
        c && (C1(Q),
        ht(Q));
        W = Q.O.Oi() && isNaN(Q.D);
        c == W ? c && (zP(Q, 1),
        Jt(Q, "getSubtitlesTrack")) : c ? (Q.UH() && Q.W.reset(),
        zP(Q, 1),
        Jt(Q, "getNowPlaying"),
        TCZ(Q)) : Q.J(1)
    }
      , RTi = function(Q, c) {
        const W = c.params.videoId;
        delete c.params.videoId;
        W == Q.W.videoId && (g.P9(c.params) ? Q.W.trackData = null : Q.W.trackData = c.params,
        Q.publish("remotePlayerChange"))
    }
      , hTa = function(Q, c, W) {
        const m = c.params.videoId || c.params.video_id
          , K = parseInt(c.params.currentIndex, 10);
        Q.W.listId = c.params.listId || Q.W.listId;
        j6(Q.W, m, K);
        Q.publish("remoteQueueChange", W)
    }
      , Cd1 = function(Q, c) {
        var W = parseInt(c.params.currentTime || c.params.current_time, 10);
        wz(Q.W, isNaN(W) ? 0 : W);
        W = parseInt(c.params.state, 10);
        W = isNaN(W) ? -1 : W;
        W == -1 && Q.W.playerState == -1E3 && (W = -1E3);
        Q.W.playerState = W;
        W = Number(c.params.loadedTime);
        Q.W.loadedTime = isNaN(W) ? 0 : W;
        Q.W.ly(Number(c.params.duration));
        W = Q.W;
        var m = Number(c.params.liveIngestionTime);
        W.W = m;
        W.j = isNaN(m) ? !1 : !0;
        W = Q.W;
        m = Number(c.params.seekableStartTime);
        c = Number(c.params.seekableEndTime);
        W.O = isNaN(m) ? 0 : m;
        W.J = isNaN(c) ? 0 : c;
        Q.W.playerState == 1 ? KvD(Q) : Mx(Q);
        Q.publish("remotePlayerChange")
    }
      , zT1 = function(Q, c) {
        c.params = c.params || {};
        hTa(Q, c, "NOW_PLAYING_MAY_CHANGE");
        Cd1(Q, c);
        Q.publish("autoplayDismissed")
    }
      , Mu0 = function(Q, c) {
        if (Q.W.playerState != -1E3) {
            var W = 1085;
            switch (parseInt(c.params.adState, 10)) {
            case 1:
                W = 1081;
                break;
            case 2:
                W = 1084;
                break;
            case 0:
                W = 1083
            }
            Q.W.playerState = W;
            c = parseInt(c.params.currentTime, 10);
            wz(Q.W, isNaN(c) ? 0 : c);
            Q.publish("remotePlayerChange")
        }
    }
      , JJS = function(Q, c) {
        const W = c.params.muted == "true";
        Q.W.volume = parseInt(c.params.volume, 10);
        Q.W.muted = W;
        Q.publish("remotePlayerChange")
    }
      , kS1 = function(Q, c) {
        Q.L = c.params.videoId;
        Q.publish("nowAutoplaying", parseInt(c.params.timeout, 10))
    }
      , Y9a = function(Q, c) {
        Q.L = c.params.videoId || null;
        Q.publish("autoplayUpNext", Q.L)
    }
      , pGS = function(Q, c) {
        Q.K = c.params.autoplayMode;
        Q.publish("autoplayModeChange", Q.K);
        Q.K == "DISABLED" && Q.publish("autoplayDismissed")
    }
      , QOD = function(Q, c) {
        const W = c.params.hasNext == "true";
        Q.W.hasPrevious = c.params.hasPrevious == "true";
        Q.W.hasNext = W;
        Q.publish("previousNextChange")
    }
      , IAi = function(Q, c) {
        mHS();
        if (!FO || !FO.get("yt-remote-disable-remote-module-for-dev")) {
            c = g.v("MDX_CONFIG") || c;
            R3a();
            yE();
            RV || (RV = new G6(c ? c.loungeApiHost : void 0),
            KZv() && (RV.W = "/api/loungedev"));
            k_ || (k_ = g.DR("yt.mdx.remote.deferredProxies_") || [],
            g.n7("yt.mdx.remote.deferredProxies_", k_));
            oF9();
            var W = Y_();
            if (!W) {
                const K = new m$(RV,c ? c.disableAutomaticScreenCache || !1 : !1);
                g.n7("yt.mdx.remote.screenService_", K);
                W = Y_();
                var m = {};
                c && (m = {
                    appId: c.appId,
                    disableDial: c.disableDial,
                    theme: c.theme,
                    loadCastApiSetupScript: c.loadCastApiSetupScript,
                    disableCastApi: c.disableCastApi,
                    enableDialLoungeToken: c.enableDialLoungeToken,
                    enableCastLoungeToken: c.enableCastLoungeToken,
                    forceMirroring: c.forceMirroring
                });
                g.n7("yt.mdx.remote.enableConnectWithInitialState_", c ? c.enableConnectWithInitialState || !1 : !1);
                bZv(Q, K, function(T) {
                    T ? p1() && ZW(p1(), "YouTube TV") : K.subscribe("onlineScreenChange", function() {
                        Zn("yt-remote-receiver-availability-change")
                    })
                }, m)
            }
            c && !g.DR("yt.mdx.remote.initialized_") && (g.n7("yt.mdx.remote.initialized_", !0),
            Ql("Initializing: " + g.bS(c)),
            ca.push(g.Qp("yt-remote-cast2-api-ready", function() {
                Zn("yt-remote-api-ready")
            })),
            ca.push(g.Qp("yt-remote-cast2-availability-change", function() {
                Zn("yt-remote-receiver-availability-change")
            })),
            ca.push(g.Qp("yt-remote-cast2-receiver-selected", function() {
                Wa(null);
                Zn("yt-remote-auto-connect", "cast-selector-receiver")
            })),
            ca.push(g.Qp("yt-remote-cast2-receiver-resumed", function() {
                Zn("yt-remote-receiver-resumed", "cast-selector-receiver")
            })),
            ca.push(g.Qp("yt-remote-cast2-session-change", rdZ)),
            ca.push(g.Qp("yt-remote-connection-change", function(K) {
                K ? ZW(p1(), "YouTube TV") : mf() || (ZW(null, null),
                OZ1())
            })),
            ca.push(g.Qp("yt-remote-cast2-session-failed", () => {
                Zn("yt-remote-connection-failed")
            }
            )),
            Q = Kn(),
            c.isAuto && (Q.id += "#dial"),
            m = c.capabilities || [],
            m.length > 0 && (Q.capabilities = m),
            Q.name = c.device,
            Q.app = c.app,
            (c = c.theme) && (Q.theme = c),
            Ql(" -- with channel params: " + g.bS(Q)),
            Q ? (g.rl("yt-remote-session-app", Q.app),
            g.rl("yt-remote-session-name", Q.name)) : (g.IC("yt-remote-session-app"),
            g.IC("yt-remote-session-name")),
            g.n7("yt.mdx.remote.channelParams_", Q),
            W.start(),
            p1() || U19())
        }
    }
      , Xxm = function() {
        var Q = Y_().AE.$_gos();
        const c = T2();
        c && o3() && (Dn(Q, c) || Q.push(c));
        return J3H(Q)
    }
      , r6 = function() {
        let Q = Ad4();
        !Q && yQ() && gdm() && (Q = {
            key: "cast-selector-receiver",
            name: gdm()
        });
        return Q
    }
      , Ad4 = function() {
        const Q = Xxm();
        let c = T2();
        c || (c = mf());
        return g.Yx(Q, function(W) {
            return c && Bg(c, W.key) ? !0 : !1
        })
    }
      , T2 = function() {
        const Q = p1();
        if (!Q)
            return null;
        const c = Y_().M4();
        return te(c, Q)
    }
      , rdZ = function(Q) {
        Ql("remote.onCastSessionChange_: " + xe(Q));
        if (Q) {
            var c = T2();
            if (c && c.id == Q.id) {
                if (ZW(c.id, "YouTube TV"),
                Q.idType == "shortLived" && (Q = Q.token))
                    Uk && (Uk.token = Q),
                    (c = o3()) && c.dN(Q)
            } else
                c && I3(),
                X9(Q, 1)
        } else
            o3() && I3()
    }
      , I3 = function() {
        S6() ? Nx().stopSession() : tt("stopSession called before API ready.");
        const Q = o3();
        Q && (Q.disconnect(1),
        A$(null))
    }
      , eA = function() {
        const Q = o3();
        return !!Q && Q.getProxyState() != 3
    }
      , Ql = function(Q) {
        ue("remote", Q)
    }
      , Y_ = function() {
        if (!Vl) {
            const Q = g.DR("yt.mdx.remote.screenService_");
            Vl = Q ? new e9m(Q) : null
        }
        return Vl
    }
      , p1 = function() {
        return g.DR("yt.mdx.remote.currentScreenId_")
    }
      , VXW = function(Q) {
        g.n7("yt.mdx.remote.currentScreenId_", Q)
    }
      , BCS = function() {
        return g.DR("yt.mdx.remote.connectData_")
    }
      , Wa = function(Q) {
        g.n7("yt.mdx.remote.connectData_", Q)
    }
      , o3 = function() {
        return g.DR("yt.mdx.remote.connection_")
    }
      , A$ = function(Q) {
        const c = o3();
        Wa(null);
        Q || VXW("");
        g.n7("yt.mdx.remote.connection_", Q);
        k_ && (g.lw(k_, function(W) {
            W(Q)
        }),
        k_.length = 0);
        c && !Q ? Zn("yt-remote-connection-change", !1) : !c && Q && Zn("yt-remote-connection-change", !0)
    }
      , mf = function() {
        const Q = g.Xd();
        if (!Q)
            return null;
        var c = Y_();
        if (!c)
            return null;
        c = c.M4();
        return te(c, Q)
    }
      , X9 = function(Q, c) {
        p1();
        T2() && T2();
        if (Ba)
            Uk = Q;
        else {
            VXW(Q.id);
            var W = g.DR("yt.mdx.remote.enableConnectWithInitialState_") || !1;
            Q = new xq(Q,W);
            Q.connect(c, BCS());
            Q.subscribe("beforeDisconnect", function(m) {
                Zn("yt-remote-before-disconnect", m)
            });
            Q.subscribe("beforeDispose", function() {
                o3() && (o3(),
                A$(null))
            });
            Q.subscribe("browserChannelAuthError", () => {
                const m = T2();
                m && m.idType == "shortLived" && (S6() ? Nx().handleBrowserChannelAuthError() : tt("refreshLoungeToken called before API ready."))
            }
            );
            A$(Q)
        }
    }
      , U19 = function() {
        const Q = mf();
        Q ? (Ql("Resume connection to: " + xe(Q)),
        X9(Q, 0)) : (Sx(),
        OZ1(),
        Ql("Skipping connecting because no session screen found."))
    }
      , oF9 = function() {
        var Q = Kn();
        if (g.P9(Q)) {
            Q = ia();
            var c = g.UM("yt-remote-session-name") || "";
            const W = g.UM("yt-remote-session-app") || "";
            Q = {
                device: "REMOTE_CONTROL",
                id: Q,
                name: c,
                app: W,
                mdxVersion: 3
            };
            Q.authuser = String(g.v("SESSION_INDEX", "0"));
            (c = g.v("DELEGATED_SESSION_ID")) && (Q.pageId = String(c));
            g.n7("yt.mdx.remote.channelParams_", Q)
        }
    }
      , Kn = function() {
        return g.DR("yt.mdx.remote.channelParams_") || {}
    }
      , x14 = function(Q, c) {
        if (qv(Q)) {
            Q.fX.unsubscribe("remotePlayerChange", Q.K, Q);
            const W = Math.round(c.volume);
            c = !!c.muted;
            const m = f1(Q.fX);
            if (W !== m.volume || c !== m.muted)
                Q.fX.setVolume(W, c),
                Q.S.start();
            Q.fX.subscribe("remotePlayerChange", Q.K, Q)
        }
    }
      , qv = function(Q) {
        return f1(Q.fX).videoId === nn(Q).videoId
    }
      , D3 = function(Q, c) {
        let W, m;
        var K = Q.U.getPlaylist();
        K?.listId && (W = K.index,
        m = K.listId.toString());
        K = nn(Q);
        Q.fX.playVideo(K.videoId, c, W, m, K.playerParams, K.S, gNZ(K));
        Q.OO(new g.In(1))
    }
      , t$ = function(Q, c) {
        if (qv(Q) && !Q.D) {
            let W = null;
            c && (W = {
                style: Q.U.getSubtitlesUserSettings()
            },
            Object.assign(W, c));
            Q.fX.L(nn(Q).videoId, W);
            Q.j = f1(Q.fX).trackData
        }
    }
      , q20 = function(Q, c) {
        if (c) {
            const W = Q.U.getOption("captions", "tracklist", {
                yK: 1
            });
            W && W.length ? (Q.U.setOption("captions", "track", c),
            Q.D = !1) : (Q.U.loadModule("captions"),
            Q.D = !0)
        } else
            Q.U.setOption("captions", "track", {})
    }
      , nFa = function(Q) {
        Q.kx(0);
        Q.O.stop();
        Q.OO(new g.In(64))
    }
      , nn = function(Q) {
        return Q.U.getVideoData({
            playerType: 1
        })
    }
      , D1m = function(Q) {
        const c = Q.player.G();
        return !c.X("mdx_enable_privacy_disclosure_ui") || Q.isLoggedIn() || Q.Nd || !Q.Uc ? !1 : g.rT(c) || g.sQ(c)
    }
      , tX4 = function(Q, c, W) {
        Q.GU = W;
        Q.player.publish("presentingplayerstatechange", new g.tS(W,c))
    }
      , Ha = function(Q, c, ...W) {
        Q.loaded && Q.c5.jZ(c, ...W)
    }
      , Nv = function(Q) {
        Q.G4 && (Q.player.removeEventListener("presentingplayerstatechange", Q.G4),
        Q.G4 = null)
    }
      , iJ = function(Q, c) {
        if (c.key !== Q.qp.key)
            if (c.key === Q.Hp.key)
                I3();
            else if (D1m(Q) && HGm(Q),
            Q.qp = c,
            !g.uL(Q.player.G())) {
                {
                    const T = Q.player.getPlaylistId();
                    var W = Q.player.getVideoData({
                        playerType: 1
                    });
                    const r = W.videoId;
                    if (!T && !r || (Q.player.getAppState() === 2 || Q.player.getAppState() === 1) && Q.player.G().X("should_clear_video_data_on_player_cued_unstarted"))
                        W = null;
                    else {
                        var m = Q.player.getPlaylist();
                        if (m) {
                            var K = [];
                            for (let U = 0; U < m.length; U++)
                                K[U] = g.fY(m, U).videoId
                        } else
                            K = [r];
                        m = Q.player.getCurrentTime(1);
                        Q = {
                            videoIds: K,
                            listId: T,
                            videoId: r,
                            playerParams: W.playerParams,
                            clickTrackingParams: W.S,
                            index: Math.max(Q.player.getPlaylistIndex(), 0),
                            currentTime: m === 0 ? void 0 : m
                        };
                        (W = gNZ(W)) && (Q.locationInfo = W);
                        W = Q
                    }
                }
                Ql("Connecting to: " + g.bS(c));
                c.key == "cast-selector-receiver" ? (Wa(W || null),
                c = W || null,
                S6() ? Nx().setLaunchParams(c) : tt("setLaunchParams called before ready.")) : !W && eA() && p1() == c.key ? Zn("yt-remote-connection-change", !0) : (I3(),
                Wa(W || null),
                W = Y_().M4(),
                (c = te(W, c.key)) && X9(c, 1))
            }
    }
      , HGm = function(Q) {
        Q.player.getPlayerStateObject().isPlaying() ? Q.player.pauseVideo() : (Q.G4 = c => {
            !Q.Nd && c.Fq(8) && (Q.player.pauseVideo(),
            Nv(Q))
        }
        ,
        Q.player.addEventListener("presentingplayerstatechange", Q.G4));
        Q.Uc && Q.Uc.Bw();
        o3() || (Ba = !0)
    };
    g.N0.prototype.WF = g.W3(46, function() {
        this.app.GH().WF()
    });
    g.K_.prototype.WF = g.W3(45, function() {
        this.BI = null
    });
    g.N0.prototype.uf = g.W3(44, function(Q) {
        this.app.GH().uf(Q)
    });
    g.K_.prototype.uf = g.W3(43, function(Q) {
        this.BI = Q
    });
    g.Bj.prototype.WY = g.W3(1, function() {
        return g.Ao(this, 3)
    });
    g.Wo.prototype.WY = g.W3(0, function() {
        return g.Ao(this, 11)
    });
    var S_9 = class {
        constructor() {
            var Q = g.Np();
            this.O = Q;
            g.SH(Q, "/client_streamz/youtube/living_room/mdx/channel/opened", g.G_("channel_type"))
        }
        W(Q) {
            g.ZE(this.O, "/client_streamz/youtube/living_room/mdx/channel/opened", Q)
        }
    }
      , FND = class {
        constructor() {
            var Q = g.Np();
            this.O = Q;
            g.SH(Q, "/client_streamz/youtube/living_room/mdx/channel/closed", g.G_("channel_type"))
        }
        W(Q) {
            g.ZE(this.O, "/client_streamz/youtube/living_room/mdx/channel/closed", Q)
        }
    }
      , Eum = class {
        constructor() {
            var Q = g.Np();
            this.O = Q;
            g.SH(Q, "/client_streamz/youtube/living_room/mdx/channel/message_received", g.G_("channel_type"))
        }
        W(Q) {
            g.ZE(this.O, "/client_streamz/youtube/living_room/mdx/channel/message_received", Q)
        }
    }
      , ZOS = class {
        constructor() {
            var Q = g.Np();
            this.O = Q;
            g.SH(Q, "/client_streamz/youtube/living_room/mdx/channel/success")
        }
        W() {
            g.ZE(this.O, "/client_streamz/youtube/living_room/mdx/channel/success")
        }
    }
      , sY4 = class {
        constructor() {
            var Q = g.Np();
            this.O = Q;
            g.SH(Q, "/client_streamz/youtube/living_room/mdx/channel/error", g.G_("channel_type"), g.G_("error_type"))
        }
        W(Q, c) {
            g.ZE(this.O, "/client_streamz/youtube/living_room/mdx/channel/error", Q, c)
        }
    }
      , dAi = class {
        constructor() {
            var Q = g.Np();
            this.O = Q;
            g.SH(Q, "/client_streamz/youtube/living_room/mdx/browser_channel/pending_maps")
        }
        W() {
            g.ZE(this.O, "/client_streamz/youtube/living_room/mdx/browser_channel/pending_maps")
        }
    }
      , LN0 = class {
        constructor() {
            var Q = g.Np();
            this.O = Q;
            g.SH(Q, "/client_streamz/youtube/living_room/mdx/browser_channel/undelivered_maps")
        }
        W() {
            g.ZE(this.O, "/client_streamz/youtube/living_room/mdx/browser_channel/undelivered_maps")
        }
    }
    ;
    g.y = XO.prototype;
    g.y.z$ = function() {
        Ae(this);
        const Q = [];
        for (let c = 0; c < this.W.length; c++)
            Q.push(this.O[this.W[c]]);
        return Q
    }
    ;
    g.y.Il = function() {
        Ae(this);
        return this.W.concat()
    }
    ;
    g.y.has = function(Q) {
        return It(this.O, Q)
    }
    ;
    g.y.equals = function(Q, c) {
        if (this === Q)
            return !0;
        if (this.size != Q.size)
            return !1;
        c = c || G_Z;
        Ae(this);
        let W;
        for (let m = 0; W = this.W[m]; m++)
            if (!c(this.get(W), Q.get(W)))
                return !1;
        return !0
    }
    ;
    g.y.isEmpty = function() {
        return this.size == 0
    }
    ;
    g.y.clear = function() {
        this.O = {};
        this.jX = this.size = this.W.length = 0
    }
    ;
    g.y.remove = function(Q) {
        return this.delete(Q)
    }
    ;
    g.y.delete = function(Q) {
        return It(this.O, Q) ? (delete this.O[Q],
        --this.size,
        this.jX++,
        this.W.length > 2 * this.size && Ae(this),
        !0) : !1
    }
    ;
    g.y.get = function(Q, c) {
        return It(this.O, Q) ? this.O[Q] : c
    }
    ;
    g.y.set = function(Q, c) {
        It(this.O, Q) || (this.size += 1,
        this.W.push(Q),
        this.jX++);
        this.O[Q] = c
    }
    ;
    g.y.forEach = function(Q, c) {
        const W = this.Il();
        for (let m = 0; m < W.length; m++) {
            const K = W[m]
              , T = this.get(K);
            Q.call(c, T, K, this)
        }
    }
    ;
    g.y.clone = function() {
        return new XO(this)
    }
    ;
    g.y.keys = function() {
        return g.bB(this.F7(!0)).W()
    }
    ;
    g.y.values = function() {
        return g.bB(this.F7(!1)).W()
    }
    ;
    g.y.entries = function() {
        const Q = this;
        return ax1(this.keys(), function(c) {
            return [c, Q.get(c)]
        })
    }
    ;
    g.y.F7 = function(Q) {
        Ae(this);
        let c = 0;
        const W = this.jX
          , m = this
          , K = new g.OF;
        K.next = function() {
            if (W != m.jX)
                throw Error("The map has changed since the iterator was created");
            if (c >= m.W.length)
                return g.KP;
            const T = m.W[c++];
            return g.f4(Q ? T : m.O[T])
        }
        ;
        return K
    }
    ;
    var ul0 = {
        yr: "atp",
        I1J: "ska",
        DMe: "que",
        jJ: "mus",
        wB0: "sus",
        y5: "dsp",
        o0J: "seq",
        W_: "mic",
        hn: "dpa",
        OW: "mlm",
        rC: "dsdtr",
        UW: "ntb",
        RZI: "vsp",
        GD: "scn",
        k2H: "rpe",
        ya: "dcn",
        PE: "dcp",
        o7: "pas",
        qg: "drq",
        gz: "opf",
        BE: "els",
        L_: "isg",
        RyJ: "svq",
        Ax: "mvp",
        CS: "ads",
        KIF: "stcp",
        mQF: "sads",
        UD: "dloc",
        XJ: "dcw",
        yl: "asw",
        xW: "apw",
        PX: "wrc",
        wAM: "pcw",
        P$: "ipv",
        D$: "ndt",
        f_: "ctops",
        AX: "gsrm"
    }
      , h31 = {
        SCG: "u",
        oA: "cl",
        De: "k",
        SL: "i",
        OD: "cr",
        Me: "m",
        eL: "g",
        gL: "up"
    }
      , bO0 = {
        rz: "nowPlaying",
        sW: "onStateChange",
        kW: "adPlaying",
        Jx: "onAdStateChange",
        uI: "nowPlayingShorts",
        lI: "onShortsStateChange"
    };
    ex.prototype.equals = function(Q) {
        return Q ? this.id == Q.id : !1
    }
    ;
    var Nd = ""
      , FO = null
      , XOa = TmZ("loadCastFramework") || TmZ("loadCastApplicationFramework")
      , ewm = ["pkedcjkdefgpdelpbcmbmeomcjbeemfm", "enhhojjnijigcajfphajepfemndkmdlo"];
    g.bw(wp, g.qK);
    g.y = wp.prototype;
    g.y.LG = function(Q) {
        this.j = arguments;
        this.W = !1;
        this.ot ? this.A = g.d0() + this.eW : this.ot = g.tz(this.K, this.eW)
    }
    ;
    g.y.stop = function() {
        this.ot && (g.qX.clearTimeout(this.ot),
        this.ot = null);
        this.A = null;
        this.W = !1;
        this.j = []
    }
    ;
    g.y.pause = function() {
        ++this.O
    }
    ;
    g.y.resume = function() {
        this.O && (--this.O,
        !this.O && this.W && (this.W = !1,
        this.D.apply(null, this.j)))
    }
    ;
    g.y.WA = function() {
        this.stop();
        wp.FS.WA.call(this)
    }
    ;
    g.y.BU = function() {
        this.ot && (g.qX.clearTimeout(this.ot),
        this.ot = null);
        this.A ? (this.ot = g.tz(this.K, this.A - g.d0()),
        this.A = null) : this.O ? this.W = !0 : (this.W = !1,
        this.D.apply(null, this.j))
    }
    ;
    var jx = null;
    ba.prototype.set = function(Q) {
        this.W = Q
    }
    ;
    ba.prototype.reset = function() {
        this.set(g.d0())
    }
    ;
    ba.prototype.get = function() {
        return this.W
    }
    ;
    g.bw(xHo, Bm1);
    var oJ = class {
        stringify(Q) {
            return g.qX.JSON.stringify(Q, void 0)
        }
        parse(Q) {
            return g.qX.JSON.parse(Q, void 0)
        }
    }
    ;
    g.bw(gp, g.tG);
    g.bw(OL, g.tG);
    var q7a = null;
    g.bw(nRm, g.tG);
    g.bw(DHm, g.tG);
    g.bw(ta0, g.tG);
    $e.prototype.debug = function() {}
    ;
    $e.prototype.info = function() {}
    ;
    $e.prototype.warning = function() {}
    ;
    var FZS = {}
      , Cx = {};
    g.y = Pg.prototype;
    g.y.setTimeout = function(Q) {
        this.JJ = Q
    }
    ;
    g.y.vU = function(Q) {
        Q = Q.target;
        const c = this.UH;
        c && g.hz(Q) == 3 ? c.j() : this.UL(Q)
    }
    ;
    g.y.UL = function(Q) {
        try {
            if (Q == this.W)
                a: {
                    const K = g.hz(this.W)
                      , T = this.W.O
                      , r = this.W.getStatus();
                    if (!(K < 3) && (K != 3 || this.W && (this.O.O || g.MA(this.W) || g.Jz(this.W)))) {
                        this.MM || K != 4 || T == 7 || (T == 8 || r <= 0 ? vg(3) : vg(2));
                        Md(this);
                        var c = this.W.getStatus();
                        this.Re = c;
                        var W = S71(this);
                        if (this.D = c == 200) {
                            if (this.EC && !this.PA) {
                                b: {
                                    if (this.W) {
                                        const U = g.ku(this.W, "X-HTTP-Initial-Response");
                                        if (U && !g.n9(U)) {
                                            var m = U;
                                            break b
                                        }
                                    }
                                    m = null
                                }
                                if (Q = m)
                                    this.PA = !0,
                                    mF(this, Q);
                                else {
                                    this.D = !1;
                                    this.K = 3;
                                    at(12);
                                    he(this);
                                    z8(this);
                                    break a
                                }
                            }
                            if (this.Ie) {
                                Q = !0;
                                let U;
                                for (; !this.MM && this.J < W.length; )
                                    if (U = ZWa(this, W),
                                    U == Cx) {
                                        K == 4 && (this.K = 4,
                                        at(14),
                                        Q = !1);
                                        break
                                    } else if (U == FZS) {
                                        this.K = 4;
                                        at(15);
                                        Q = !1;
                                        break
                                    } else
                                        mF(this, U);
                                yG0(this) && this.J != 0 && (this.O.W = this.O.W.slice(this.J),
                                this.J = 0);
                                K != 4 || W.length != 0 || this.O.O || (this.K = 1,
                                at(16),
                                Q = !1);
                                this.D = this.D && Q;
                                Q ? W.length > 0 && !this.Fw && (this.Fw = !0,
                                this.A.Nl(this)) : (he(this),
                                z8(this))
                            } else
                                mF(this, W);
                            K == 4 && he(this);
                            this.D && !this.MM && (K == 4 ? sFo(this.A, this) : (this.D = !1,
                            ua(this)))
                        } else
                            g.RY(this.W),
                            c == 400 && W.indexOf("Unknown SID") > 0 ? (this.K = 3,
                            at(12)) : (this.K = 0,
                            at(13)),
                            he(this),
                            z8(this)
                    }
                }
        } catch (K) {} finally {}
    }
    ;
    g.y.cancel = function() {
        this.MM = !0;
        he(this)
    }
    ;
    g.y.GL = function() {
        this.mF = null;
        const Q = Date.now();
        Q - this.La >= 0 ? (this.jG != 2 && (vg(3),
        at(17)),
        he(this),
        this.K = 2,
        z8(this)) : ERa(this, this.La - Q)
    }
    ;
    g.y.getLastError = function() {
        return this.K
    }
    ;
    g.y.Ew = function() {
        return this.W
    }
    ;
    var NCm = class {
        constructor(Q, c) {
            this.W = Q;
            this.map = c;
            this.context = null
        }
    }
    ;
    bW9.prototype.cancel = function() {
        this.A = KT(this);
        if (this.O)
            this.O.cancel(),
            this.O = null;
        else if (this.W && this.W.size !== 0) {
            for (const Q of this.W.values())
                Q.cancel();
            this.W.clear()
        }
    }
    ;
    g.y = vRv.prototype;
    g.y.qn = 8;
    g.y.Tf = 1;
    g.y.connect = function(Q, c, W, m) {
        at(0);
        this.sC = Q;
        this.MM = c || {};
        W && m !== void 0 && (this.MM.OSID = W,
        this.MM.OAID = m);
        this.UH = this.MQ;
        this.Ka = dH1(this, null, this.sC);
        W$(this)
    }
    ;
    g.y.disconnect = function() {
        a41(this);
        if (this.Tf == 3) {
            var Q = this.XI++
              , c = this.Ka.clone();
            g.eX(c, "SID", this.j);
            g.eX(c, "RID", Q);
            g.eX(c, "TYPE", "terminate");
            IJ(this, c);
            Q = new Pg(this,this.j,Q);
            Q.jG = 2;
            Q.L = T8(c.clone());
            c = !1;
            if (g.qX.navigator && g.qX.navigator.sendBeacon)
                try {
                    c = g.qX.navigator.sendBeacon(Q.L.toString(), "")
                } catch {}
            !c && g.qX.Image && ((new Image).src = Q.L,
            c = !0);
            c || (Q.W = iWa(Q.A, null),
            Q.W.send(Q.L));
            Q.b0 = Date.now();
            ua(Q)
        }
        hwv(this)
    }
    ;
    g.y.NK = function() {
        return this.Tf == 0
    }
    ;
    g.y.getState = function() {
        return this.Tf
    }
    ;
    g.y.u5 = function(Q) {
        if (this.D)
            if (this.D = null,
            this.Tf == 1) {
                if (!Q) {
                    this.XI = Math.floor(Math.random() * 1E5);
                    Q = this.XI++;
                    const K = new Pg(this,"",Q);
                    let T = this.Y;
                    this.EC && (T ? (T = g.za(T),
                    g.JH(T, this.EC)) : T = this.EC);
                    this.J !== null || this.La || (K.Ka = T,
                    T = null);
                    if (this.Y0)
                        a: {
                            var c = 0;
                            for (var W = 0; W < this.A.length; W++) {
                                b: {
                                    var m = this.A[W];
                                    if ("__data__"in m.map && (m = m.map.__data__,
                                    typeof m === "string")) {
                                        m = m.length;
                                        break b
                                    }
                                    m = void 0
                                }
                                if (m === void 0)
                                    break;
                                c += m;
                                if (c > 4096) {
                                    c = W;
                                    break a
                                }
                                if (c === 4096 || W === this.A.length - 1) {
                                    c = W + 1;
                                    break a
                                }
                            }
                            c = this.d3
                        }
                    else
                        c = this.d3;
                    c = Pso(this, K, c);
                    W = this.Ka.clone();
                    g.eX(W, "RID", Q);
                    g.eX(W, "CVER", 22);
                    this.Ie && g.eX(W, "X-HTTP-Session-Id", this.Ie);
                    IJ(this, W);
                    T && (this.La ? c = "headers=" + g.Hb(g.DA(T)) + "&" + c : this.J && g.td(W, this.J, T));
                    c$(this.O, K);
                    this.U7 && g.eX(W, "TYPE", "init");
                    this.Y0 ? (g.eX(W, "$req", c),
                    g.eX(W, "SID", "null"),
                    K.EC = !0,
                    la(K, W, null)) : la(K, W, c);
                    this.Tf = 2
                }
            } else
                this.Tf == 3 && (Q ? l41(this, Q) : this.A.length == 0 || jFo(this.O) || l41(this))
    }
    ;
    g.y.rI = function() {
        this.L = null;
        uhi(this);
        if (this.qQ && !(this.JJ || this.W == null || this.Xw <= 0)) {
            var Q = 4 * this.Xw;
            this.T2 = G8((0,
            g.EO)(this.DM, this), Q)
        }
    }
    ;
    g.y.DM = function() {
        this.T2 && (this.T2 = null,
        this.UH = !1,
        this.JJ = !0,
        at(10),
        ke(this),
        uhi(this))
    }
    ;
    g.y.Nl = function(Q) {
        this.W == Q && this.qQ && !this.JJ && (Uq(this),
        this.JJ = !0,
        at(11))
    }
    ;
    g.y.Na = function() {
        this.mF != null && (this.mF = null,
        ke(this),
        Ye(this),
        at(19))
    }
    ;
    g.y.X5 = function(Q) {
        Q ? at(2) : at(1)
    }
    ;
    g.y.isActive = function() {
        return !!this.K && this.K.isActive(this)
    }
    ;
    g.y = Cs0.prototype;
    g.y.gI = function() {}
    ;
    g.y.Xl = function() {}
    ;
    g.y.Da = function() {}
    ;
    g.y.hT = function() {}
    ;
    g.y.isActive = function() {
        return !0
    }
    ;
    g.y.oZ = function() {}
    ;
    g.bw(Ai, g.$R);
    Ai.prototype.open = function() {
        this.W.K = this.A;
        this.J && (this.W.PA = !0);
        this.W.connect(this.D, this.O || void 0)
    }
    ;
    Ai.prototype.close = function() {
        this.W.disconnect()
    }
    ;
    Ai.prototype.send = function(Q) {
        var c = this.W;
        if (typeof Q === "string") {
            var W = {};
            W.__data__ = Q;
            Q = W
        } else
            this.K && (W = {},
            W.__data__ = g.bS(Q),
            Q = W);
        c.A.push(new NCm(c.w6++,Q));
        c.Tf == 3 && W$(c)
    }
    ;
    Ai.prototype.WA = function() {
        this.W.K = null;
        delete this.A;
        this.W.disconnect();
        delete this.W;
        Ai.FS.WA.call(this)
    }
    ;
    g.bw(JGD, gp);
    g.bw(Rw9, OL);
    g.bw(Xj, Cs0);
    Xj.prototype.gI = function() {
        this.W.dispatchEvent("m")
    }
    ;
    Xj.prototype.Xl = function(Q) {
        this.W.dispatchEvent(new JGD(Q))
    }
    ;
    Xj.prototype.Da = function(Q) {
        this.W.dispatchEvent(new Rw9(Q))
    }
    ;
    Xj.prototype.hT = function() {
        this.W.dispatchEvent("n")
    }
    ;
    Ai.prototype.j = function() {
        return new ep(this,this.W)
    }
    ;
    ep.prototype.O = function() {
        return px(this.W.O)
    }
    ;
    ep.prototype.A = function() {
        return zwo(this.W).map(Q => {
            var c = this.j;
            Q = Q.map;
            "__data__"in Q ? (Q = Q.__data__,
            c = c.K ? fxi(Q) : Q) : c = Q;
            return c
        }
        )
    }
    ;
    ep.prototype.commit = function(Q) {
        this.W.Re = Q
    }
    ;
    var B$ = new g.$R
      , k$a = class extends g.tG {
        constructor() {
            super("statevent", B$)
        }
    }
    ;
    g.y = qW.prototype;
    g.y.uG = null;
    g.y.W4 = !1;
    g.y.ST = null;
    g.y.Vx = null;
    g.y.Jg = null;
    g.y.kD = null;
    g.y.kV = null;
    g.y.Xh = null;
    g.y.hD = null;
    g.y.hI = null;
    g.y.Hr = 0;
    g.y.Jc = null;
    g.y.gK = null;
    g.y.YC = null;
    g.y.HQ = -1;
    g.y.L9 = !0;
    g.y.gY = !1;
    g.y.ob = 0;
    g.y.Dd = null;
    var QYo = {}
      , ti = {};
    g.y = qW.prototype;
    g.y.setTimeout = function(Q) {
        this.O = Q
    }
    ;
    g.y.nG = function(Q) {
        Q = Q.target;
        const c = this.Dd;
        c && g.hz(Q) == 3 ? c.j() : this.H0(Q)
    }
    ;
    g.y.H0 = function(Q) {
        try {
            if (Q == this.hI)
                a: {
                    const c = g.hz(this.hI)
                      , W = this.hI.O
                      , m = this.hI.getStatus();
                    if (g.xG && !g.Pb("420+")) {
                        if (c < 4)
                            break a
                    } else if (c < 3 || c == 3 && !g.MA(this.hI))
                        break a;
                    this.gY || c != 4 || W == 7 || (W == 8 || m <= 0 ? this.W.jb(3) : this.W.jb(2));
                    mAa(this);
                    const K = this.hI.getStatus();
                    this.HQ = K;
                    const T = g.MA(this.hI);
                    if (this.W4 = K == 200) {
                        c == 4 && NW(this);
                        if (this.Ie) {
                            for (Q = !0; !this.gY && this.Hr < T.length; ) {
                                const r = czD(this, T);
                                if (r == ti) {
                                    c == 4 && (this.YC = 4,
                                    xr(),
                                    Q = !1);
                                    break
                                } else if (r == QYo) {
                                    this.YC = 4;
                                    xr();
                                    Q = !1;
                                    break
                                } else
                                    KNm(this, r)
                            }
                            c == 4 && T.length == 0 && (this.YC = 1,
                            xr(),
                            Q = !1);
                            this.W4 = this.W4 && Q;
                            Q || (NW(this),
                            H$(this))
                        } else
                            KNm(this, T);
                        this.W4 && !this.gY && (c == 4 ? this.W.Rb(this) : (this.W4 = !1,
                        DD(this)))
                    } else
                        this.YC = K == 400 && T.indexOf("Unknown SID") > 0 ? 3 : 0,
                        xr(),
                        NW(this),
                        H$(this)
                }
        } catch (c) {} finally {}
    }
    ;
    g.y.cancel = function() {
        this.gY = !0;
        NW(this)
    }
    ;
    g.y.Vk = function() {
        this.ST = null;
        const Q = Date.now();
        Q - this.Vx >= 0 ? (this.kD != 2 && this.W.jb(3),
        NW(this),
        this.YC = 2,
        xr(),
        H$(this)) : WN4(this, this.Vx - Q)
    }
    ;
    g.y.getLastError = function() {
        return this.YC
    }
    ;
    g.y = rzv.prototype;
    g.y.SH = null;
    g.y.eM = null;
    g.y.In = !1;
    g.y.Ff = null;
    g.y.YA = null;
    g.y.Q_ = -1;
    g.y.JN = null;
    g.y.Tu = null;
    g.y.connect = function(Q) {
        this.Ff = Q;
        Q = yx(this.W, null, this.Ff);
        xr();
        Date.now();
        const c = this.W.Y;
        c != null ? (this.JN = c[0],
        (this.Tu = c[1]) ? (this.YA = 1,
        UAi(this)) : (this.YA = 2,
        Fj(this))) : (ot(Q, "MODE", "init"),
        this.eM = new qW(this),
        this.eM.uG = this.SH,
        nT(this.eM, Q, !1, null, !0),
        this.YA = 0)
    }
    ;
    g.y.K8 = function(Q) {
        if (Q)
            this.YA = 2,
            Fj(this);
        else {
            xr();
            var c = this.W;
            c.Rp = c.P4.Q_;
            jp(c, 9)
        }
        Q && this.jb(2)
    }
    ;
    g.y.Yd = function(Q) {
        return this.W.Yd(Q)
    }
    ;
    g.y.abort = function() {
        this.eM && (this.eM.cancel(),
        this.eM = null);
        this.Q_ = -1
    }
    ;
    g.y.NK = function() {
        return !1
    }
    ;
    g.y.JT = function(Q, c) {
        this.Q_ = Q.HQ;
        if (this.YA == 0)
            if (c) {
                try {
                    var W = this.O.parse(c)
                } catch (m) {
                    Q = this.W;
                    Q.Rp = this.Q_;
                    jp(Q, 2);
                    return
                }
                this.JN = W[0];
                this.Tu = W[1]
            } else
                Q = this.W,
                Q.Rp = this.Q_,
                jp(Q, 2);
        else
            this.YA == 2 && (this.In ? (xr(),
            Date.now()) : c == "11111" ? (xr(),
            this.In = !0,
            Date.now(),
            this.Q_ = 200,
            this.eM.cancel(),
            xr(),
            Sp(this.W, this, !0)) : (xr(),
            Date.now(),
            this.In = !1))
    }
    ;
    g.y.Rb = function() {
        this.Q_ = this.eM.HQ;
        if (this.eM.W4)
            this.YA == 0 ? this.Tu ? (this.YA = 1,
            UAi(this)) : (this.YA = 2,
            Fj(this)) : this.YA == 2 && (this.In ? (xr(),
            Sp(this.W, this, !0)) : (xr(),
            Sp(this.W, this, !1)));
        else {
            this.YA == 0 ? xr() : this.YA == 2 && xr();
            var Q = this.W;
            this.eM.getLastError();
            Q.Rp = this.Q_;
            jp(Q, 2)
        }
    }
    ;
    g.y.sF = function() {
        return this.W.sF()
    }
    ;
    g.y.isActive = function() {
        return this.W.isActive()
    }
    ;
    g.y.jb = function(Q) {
        this.W.jb(Q)
    }
    ;
    g.y = ZD.prototype;
    g.y.SM = null;
    g.y.ZK = null;
    g.y.UE = null;
    g.y.eQ = null;
    g.y.m0 = null;
    g.y.l_ = null;
    g.y.l5 = null;
    g.y.Ex = null;
    g.y.cQ = 0;
    g.y.Sd = 0;
    g.y.Ws = null;
    g.y.wx = null;
    g.y.K3 = null;
    g.y.XY = null;
    g.y.P4 = null;
    g.y.jH = null;
    g.y.Ea = -1;
    g.y.sL = -1;
    g.y.Rp = -1;
    g.y.FR = 0;
    g.y.RV = 0;
    g.y.DR = 8;
    var iG1 = {
        OK: 0,
        seF: 2,
        YE: 4,
        hx: 5,
        YCH: 6,
        STOP: 7,
        jU: 8,
        Dc: 9,
        Up: 10,
        u2: 11,
        U3: 12
    };
    g.bw(XJH, g.tG);
    g.bw(Aza, g.tG);
    g.y = ZD.prototype;
    g.y.connect = function(Q, c, W, m, K) {
        xr();
        this.m0 = c;
        this.ZK = W || {};
        m && K !== void 0 && (this.ZK.OSID = m,
        this.ZK.OAID = K);
        this.L ? (Vx((0,
        g.EO)(this.B2, this, Q), 100),
        eh9(this)) : this.B2(Q)
    }
    ;
    g.y.disconnect = function() {
        VHD(this);
        if (this.W == 3) {
            var Q = this.cQ++;
            const c = this.l_.clone();
            g.eX(c, "SID", this.j);
            g.eX(c, "RID", Q);
            g.eX(c, "TYPE", "terminate");
            wN(this, c);
            Q = new qW(this,this.j,Q);
            Q.kD = 2;
            Q.kV = T8(c.clone());
            (new Image).src = Q.kV.toString();
            Q.Jg = Date.now();
            DD(Q)
        }
        HOZ(this)
    }
    ;
    g.y.B2 = function(Q) {
        this.P4 = new rzv(this);
        this.P4.SH = this.SM;
        this.P4.O = this.K;
        this.P4.connect(Q)
    }
    ;
    g.y.NK = function() {
        return this.W == 0
    }
    ;
    g.y.getState = function() {
        return this.W
    }
    ;
    g.y.dI = function(Q) {
        this.wx = null;
        q_W(this, Q)
    }
    ;
    g.y.Za = function() {
        this.K3 = null;
        this.eQ = new qW(this,this.j,"rpc",this.J);
        this.eQ.uG = this.SM;
        this.eQ.ob = 0;
        var Q = this.l5.clone();
        g.eX(Q, "RID", "rpc");
        g.eX(Q, "SID", this.j);
        g.eX(Q, "CI", this.jH ? "0" : "1");
        g.eX(Q, "AID", this.Ea);
        wN(this, Q);
        g.eX(Q, "TYPE", "xmlhttp");
        nT(this.eQ, Q, !0, this.Ex, !1)
    }
    ;
    g.y.JT = function(Q, c) {
        if (this.W != 0 && (this.eQ == Q || this.UE == Q))
            if (this.Rp = Q.HQ,
            this.UE == Q && this.W == 3)
                if (this.DR > 7) {
                    try {
                        var W = this.K.parse(c)
                    } catch (m) {
                        W = null
                    }
                    if (Array.isArray(W) && W.length == 3)
                        if (Q = W,
                        Q[0] == 0)
                            a: {
                                if (!this.K3) {
                                    if (this.eQ)
                                        if (this.eQ.Jg + 3E3 < this.UE.Jg)
                                            sq(this),
                                            this.eQ.cancel(),
                                            this.eQ = null;
                                        else
                                            break a;
                                    be(this);
                                    xr()
                                }
                            }
                        else
                            this.sL = Q[1],
                            0 < this.sL - this.Ea && Q[2] < 37500 && this.jH && this.RV == 0 && !this.XY && (this.XY = Vx((0,
                            g.EO)(this.RZ, this), 6E3));
                    else
                        jp(this, 11)
                } else
                    c != "y2f%" && jp(this, 11);
            else if (this.eQ == Q && sq(this),
            !g.n9(c))
                for (Q = this.K.parse(c),
                c = 0; c < Q.length; c++)
                    W = Q[c],
                    this.Ea = W[0],
                    W = W[1],
                    this.W == 2 ? W[0] == "c" ? (this.j = W[1],
                    this.Ex = W[2],
                    W = W[3],
                    W != null ? this.DR = W : this.DR = 6,
                    this.W = 3,
                    this.Ws && this.Ws.GY(),
                    this.l5 = yx(this, this.sF() ? this.Ex : null, this.m0),
                    nuS(this)) : W[0] == "stop" && jp(this, 7) : this.W == 3 && (W[0] == "stop" ? jp(this, 7) : W[0] != "noop" && this.Ws && this.Ws.B0(W),
                    this.RV = 0)
    }
    ;
    g.y.RZ = function() {
        this.XY != null && (this.XY = null,
        this.eQ.cancel(),
        this.eQ = null,
        be(this),
        xr())
    }
    ;
    g.y.Rb = function(Q) {
        if (this.eQ == Q) {
            sq(this);
            this.eQ = null;
            var c = 2
        } else if (this.UE == Q)
            this.UE = null,
            c = 1;
        else
            return;
        this.Rp = Q.HQ;
        if (this.W != 0)
            if (Q.W4)
                if (c == 1) {
                    c = Q.hD ? Q.hD.length : 0;
                    Q = Date.now() - Q.Jg;
                    var W = B$;
                    W.dispatchEvent(new XJH(W,c,Q,this.FR));
                    Eq(this);
                    this.Ws && this.Ws.v0(this, this.A);
                    this.A.length = 0
                } else
                    nuS(this);
            else {
                W = Q.getLastError();
                var m;
                if (!(m = W == 3 || W == 7 || W == 0 && this.Rp > 0)) {
                    if (m = c == 1)
                        this.UE || this.wx || this.W == 1 || this.FR >= 2 ? m = !1 : (this.wx = Vx((0,
                        g.EO)(this.dI, this, Q), DAS(this, this.FR)),
                        this.FR++,
                        m = !0);
                    m = !(m || c == 2 && be(this))
                }
                if (m)
                    switch (W) {
                    case 1:
                        jp(this, 5);
                        break;
                    case 4:
                        jp(this, 10);
                        break;
                    case 3:
                        jp(this, 6);
                        break;
                    case 7:
                        jp(this, 12);
                        break;
                    default:
                        jp(this, 2)
                    }
            }
    }
    ;
    g.y.YF = function(Q) {
        if (!g.c9(arguments, this.W))
            throw Error("Unexpected channel state: " + this.W);
    }
    ;
    g.y.Dj = function(Q) {
        Q ? xr() : (xr(),
        tHi(this, 8))
    }
    ;
    g.y.Yd = function(Q) {
        if (Q)
            throw Error("Can't create secondary domain capable XhrIo object.");
        Q = new g.aY;
        Q.J = !1;
        return Q
    }
    ;
    g.y.isActive = function() {
        return !!this.Ws && this.Ws.isActive(this)
    }
    ;
    g.y.jb = function(Q) {
        const c = B$;
        c.dispatchEvent(new Aza(c,Q))
    }
    ;
    g.y.sF = function() {
        return !1
    }
    ;
    new xHo;
    g.y = NVS.prototype;
    g.y.GY = function() {}
    ;
    g.y.B0 = function() {}
    ;
    g.y.v0 = function() {}
    ;
    g.y.LV = function() {}
    ;
    g.y.b8 = function() {}
    ;
    g.y.Nn = function() {
        return {}
    }
    ;
    g.y.isActive = function() {
        return !0
    }
    ;
    g.y = iOS.prototype;
    g.y.enqueue = function(Q) {
        this.O.push(Q)
    }
    ;
    g.y.isEmpty = function() {
        return this.W.length === 0 && this.O.length === 0
    }
    ;
    g.y.clear = function() {
        this.W = [];
        this.O = []
    }
    ;
    g.y.contains = function(Q) {
        return g.c9(this.W, Q) || g.c9(this.O, Q)
    }
    ;
    g.y.remove = function(Q) {
        {
            var c = this.W;
            const W = Array.prototype.lastIndexOf.call(c, Q, c.length - 1);
            W >= 0 ? (g.Ta(c, W),
            c = !0) : c = !1
        }
        return c || g.o0(this.O, Q)
    }
    ;
    g.y.z$ = function() {
        const Q = [];
        for (var c = this.W.length - 1; c >= 0; --c)
            Q.push(this.W[c]);
        c = this.O.length;
        for (let W = 0; W < c; ++W)
            Q.push(this.O[W]);
        return Q
    }
    ;
    var yda = class extends g.tG {
        constructor(Q) {
            super("channelMessage");
            this.message = Q
        }
    }
      , S2a = class extends g.tG {
        constructor(Q) {
            super("channelError");
            this.error = Q
        }
    }
    ;
    g.bw(gN, g.qK);
    g.y = gN.prototype;
    g.y.aj = function() {
        this.retryCount++;
        this.eW = Math.min(3E5, this.eW * 2);
        this.O();
        this.jI && this.start()
    }
    ;
    g.y.WY = function() {
        return this.retryCount
    }
    ;
    g.y.start = function() {
        const Q = this.eW + 15E3 * Math.random();
        this.W.cw(Q);
        this.jI = Date.now() + Q
    }
    ;
    g.y.stop = function() {
        this.W.stop();
        this.jI = 0
    }
    ;
    g.y.isActive = function() {
        return this.W.isActive()
    }
    ;
    g.y.reset = function() {
        this.W.stop();
        this.retryCount = 0;
        this.eW = 5E3
    }
    ;
    g.bw(Oq, NVS);
    g.y = Oq.prototype;
    g.y.subscribe = function(Q, c, W) {
        return this.J.subscribe(Q, c, W)
    }
    ;
    g.y.unsubscribe = function(Q, c, W) {
        return this.J.unsubscribe(Q, c, W)
    }
    ;
    g.y.bU = function(Q) {
        return this.J.bU(Q)
    }
    ;
    g.y.publish = function(Q, c) {
        return this.J.publish.apply(this.J, arguments)
    }
    ;
    g.y.dispose = function() {
        this.Y || (this.Y = !0,
        g.BN(this.J),
        this.disconnect(),
        g.BN(this.O),
        this.O = null,
        this.Ka = () => "",
        this.jG = () => g.QU({}))
    }
    ;
    g.y.u0 = function() {
        return this.Y
    }
    ;
    g.y.connect = async function(Q, c, W) {
        try {
            this.L && await this.K
        } finally {
            if (this.Y || this.W && this.W.getState() == 2 && !this.A)
                return;
            this.Ie = "";
            this.A || this.O.stop();
            this.S = Q || null;
            this.mF = c || 0;
            const m = this.PA + "/test"
              , K = this.PA + "/bind";
            Q = new ZD(W ? W.firstTestResults : null,W ? W.secondTestResults : null,this.Re);
            const T = this.W;
            T && (T.Ws = null);
            Q.Ws = this;
            this.W = Q;
            if (this.L)
                return this.K = v$(this).then( () => wJD(this, m, K, T, W)),
                this.K.then( () => {
                    this.K = g.QU()
                }
                );
            wJD(this, m, K, T, W)
        }
    }
    ;
    g.y.disconnect = function(Q) {
        try {
            this.L && (this.K.cancel(),
            this.K = g.QU())
        } finally {
            this.T2 = Q || 0,
            this.O && this.O.stop(),
            fT(this),
            this.W && (this.W.getState() == 3 && q_W(this.W),
            this.W.disconnect()),
            this.T2 = 0
        }
    }
    ;
    g.y.sendMessage = async function(Q, c) {
        try {
            this.L && await this.K
        } finally {
            if (this.Y)
                return;
            const W = {
                _sc: Q
            };
            c && g.JH(W, c);
            if (this.O.isActive() || (this.W ? this.W.getState() : 0) == 2)
                this.j.push(W);
            else if (this.Oi())
                try {
                    this.L && !jYS(this, Q) && await v$(this)
                } finally {
                    this.Oi() && (jYS(this, Q),
                    fT(this),
                    dN(this.W, W))
                }
        }
    }
    ;
    g.y.GY = function() {
        this.D && this.O && this.O.WY() > 0 && (this.D.yQF(this.O.WY(), this.A, !0),
        this.D.PxF());
        this.D && this.D.FG0();
        this.A ? (this.O.stop(),
        g.BN(this.O),
        this.O = new gN(this.Pt,this),
        this.A = !1) : this.O.reset();
        this.S = null;
        this.mF = 0;
        if (this.j.length)
            if (this.L)
                gu0(this);
            else {
                var Q = this.j;
                this.j = [];
                var c = Q.length;
                for (let W = 0; W < c; ++W)
                    dN(this.W, Q[W]);
                aJ(this);
                aJ(this)
            }
        else
            aJ(this)
    }
    ;
    g.y.LV = function(Q) {
        var c = Q == 2 && this.W.Rp == 401;
        Q == 4 || c || (this.A && !this.O.isActive() && (g.BN(this.O),
        this.O = new gN(this.Pt,this),
        this.A = !1),
        this.O.start());
        this.publish("handlerError", Q, c);
        c = Object.keys(iG1).find(W => iG1[W] === Q);
        this.XI.W("BROWSER_CHANNEL", c ?? "UNKNOWN")
    }
    ;
    g.y.b8 = function(Q, c) {
        if (!this.O.isActive())
            this.publish("handlerClosed");
        else if (c) {
            const W = c.length;
            for (let m = 0; m < W; ++m) {
                const K = c[m].map;
                K && this.j.push(K)
            }
        }
        this.UH.W("BROWSER_CHANNEL");
        Q && g.Fn(this.WB.O, "/client_streamz/youtube/living_room/mdx/browser_channel/pending_maps", Q.length);
        c && g.Fn(this.iX.O, "/client_streamz/youtube/living_room/mdx/browser_channel/undelivered_maps", c.length)
    }
    ;
    g.y.v0 = function(Q, c) {
        c != null && Q != null && this.La.W()
    }
    ;
    g.y.Nn = function() {
        const Q = {
            v: 2
        };
        this.Ie && (Q.gsessionid = this.Ie);
        this.mF != 0 && (Q.ui = "" + this.mF);
        this.T2 != 0 && (Q.ui = "" + this.T2);
        this.S && g.JH(Q, this.S);
        return Q
    }
    ;
    g.y.B0 = function(Q) {
        Q[0] == "S" ? this.Ie = Q[1] : Q[0] == "gracefulReconnect" ? (this.O.start(),
        this.W.disconnect()) : this.publish("handlerMessage", new yza(Q[0],Q[1]));
        this.HA.W("BROWSER_CHANNEL")
    }
    ;
    g.y.Oi = function() {
        return !!this.W && this.W.getState() == 3
    }
    ;
    g.y.dN = function(Q) {
        (this.b0.loungeIdToken = Q) || this.O.stop();
        if (this.Fw && this.W) {
            const c = this.W.SM || {};
            Q ? c["X-YouTube-LoungeId-Token"] = Q : delete c["X-YouTube-LoungeId-Token"];
            this.W.SM = c
        }
    }
    ;
    g.y.getDeviceId = function() {
        return this.b0.id
    }
    ;
    g.y.nY = function() {
        return this.O.isActive() ? this.O.jI - Date.now() : NaN
    }
    ;
    g.y.ip = function() {
        var Q = this.O;
        g.I9(Q.W);
        Q.start()
    }
    ;
    g.y.Pt = function() {
        this.O.isActive();
        BV4(this.W) == 0 && this.connect(this.S, this.mF)
    }
    ;
    G6.prototype.sendRequest = function(Q, c, W, m, K, T, r) {
        Q = {
            format: T ? "RAW" : "JSON",
            method: Q,
            context: this,
            timeout: 5E3,
            withCredentials: !!r,
            onSuccess: g.sO(this.j, m, !T),
            onError: g.sO(this.A, K),
            onTimeout: g.sO(this.K, K)
        };
        W && (Q.postParams = W,
        Q.headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        });
        return g.Wn(c, Q)
    }
    ;
    G6.prototype.j = function(Q, c, W, m) {
        c ? Q(m) : Q({
            text: W.responseText
        })
    }
    ;
    G6.prototype.A = function(Q, c) {
        Q(Error("Request error: " + c.status))
    }
    ;
    G6.prototype.K = function(Q) {
        Q(Error("request timed out"))
    }
    ;
    var GQa = class extends g.$R {
        constructor(Q, c) {
            super();
            this.handler = Q();
            this.handler.subscribe("handlerOpened", this.W, this);
            this.handler.subscribe("handlerClosed", this.onClosed, this);
            this.handler.subscribe("handlerError", (W, m) => {
                this.onError(m)
            }
            );
            this.handler.subscribe("handlerMessage", this.onMessage, this);
            this.O = c
        }
        connect(Q, c, W) {
            this.handler.connect(Q, c, W)
        }
        disconnect(Q) {
            this.handler.disconnect(Q)
        }
        ip() {
            this.handler.ip()
        }
        getDeviceId() {
            return this.handler.getDeviceId()
        }
        nY() {
            return this.handler.nY()
        }
        Oi() {
            return this.handler.Oi()
        }
        W() {
            this.dispatchEvent("channelOpened");
            var Q = this.handler
              , c = this.O;
            g.rl("yt-remote-session-browser-channel", {
                firstTestResults: [""],
                secondTestResults: !Q.W.jH,
                sessionId: Q.W.j,
                arrayId: Q.W.Ea
            });
            g.rl("yt-remote-session-screen-id", c);
            Q = Hg();
            c = ia();
            g.c9(Q, c) || Q.push(c);
            YN9(Q);
            yE()
        }
        onClosed() {
            this.dispatchEvent("channelClosed")
        }
        onMessage(Q) {
            this.dispatchEvent(new yda(Q))
        }
        onError(Q) {
            this.dispatchEvent(new S2a(Q ? 1 : 0))
        }
        sendMessage(Q, c) {
            this.handler.sendMessage(Q, c)
        }
        dN(Q) {
            this.handler.dN(Q)
        }
        dispose() {
            this.handler.dispose()
        }
    }
    ;
    var aEv = class {
        constructor(Q, c, W= () => "") {
            new Mav;
            var m = new g.$K;
            this.pathPrefix = Q;
            this.W = c;
            this.b0 = W;
            this.K = m;
            this.L = null;
            this.Y = this.J = 0;
            this.channel = null;
            this.D = 0;
            this.A = new gN( () => {
                this.A.isActive();
                this.channel?.j().O() === 0 && this.connect(this.L, this.J)
            }
            );
            this.j = {};
            this.O = {};
            this.mF = !1;
            this.logger = null;
            this.S = [];
            this.XS = void 0;
            this.Ka = new S_9;
            this.T2 = new FND;
            this.MM = new Eum;
            this.Ie = new sY4
        }
        connect(Q={}, c=0) {
            this.D !== 2 && (this.A.stop(),
            this.L = Q,
            this.J = c,
            P$(this),
            (Q = g.v("ID_TOKEN")) ? this.j["x-youtube-identity-token"] = Q : delete this.j["x-youtube-identity-token"],
            this.W && (this.O.device = this.W.device,
            this.O.name = this.W.name,
            this.O.app = this.W.app,
            this.O.id = this.W.id,
            this.W.tP && (this.O.mdxVersion = `${this.W.tP}`),
            this.W.theme && (this.O.theme = this.W.theme),
            this.W.capabilities && (this.O.capabilities = this.W.capabilities),
            this.W.cW && (this.O.cst = this.W.cW),
            this.W.authuser && (this.O.authuser = this.W.authuser),
            this.W.pageId && (this.O.pageId = this.W.pageId)),
            this.J !== 0 ? this.O.ui = `${this.J}` : delete this.O.ui,
            Object.assign(this.O, this.L),
            this.channel = new Ai(this.pathPrefix,{
                Ok: "gsessionid",
                Wz: this.j,
                wc: this.O
            }),
            this.channel.open(),
            this.D = 2,
            fEa(this))
        }
        disconnect(Q=0) {
            this.Y = Q;
            this.A.stop();
            P$(this);
            this.channel && (this.Y !== 0 ? this.O.ui = `${this.Y}` : delete this.O.ui,
            this.channel.close());
            this.Y = 0
        }
        nY() {
            return this.A.isActive() ? this.A.jI - Date.now() : NaN
        }
        ip() {
            var Q = this.A;
            g.I9(Q.W);
            Q.start()
        }
        sendMessage(Q, c) {
            this.channel && (P$(this),
            this.channel.send({
                _sc: Q,
                ...c
            }))
        }
        dN(Q) {
            Q || this.A.stop();
            Q ? this.j["X-YouTube-LoungeId-Token"] = Q : delete this.j["X-YouTube-LoungeId-Token"]
        }
        getDeviceId() {
            return this.W ? this.W.id : ""
        }
        publish(Q, ...c) {
            return this.K.publish(Q, ...c)
        }
        subscribe(Q, c, W) {
            return this.K.subscribe(Q, c, W)
        }
        unsubscribe(Q, c, W) {
            return this.K.unsubscribe(Q, c, W)
        }
        bU(Q) {
            return this.K.bU(Q)
        }
        dispose() {
            this.mF || (this.mF = !0,
            g.BN(this.K),
            this.disconnect(),
            g.BN(this.A),
            this.b0 = () => "")
        }
        u0() {
            return this.mF
        }
    }
    ;
    var vuo = class extends g.$R {
        constructor(Q) {
            super();
            this.W = Q();
            this.W.subscribe("webChannelOpened", this.O, this);
            this.W.subscribe("webChannelClosed", this.onClosed, this);
            this.W.subscribe("webChannelError", this.onError, this);
            this.W.subscribe("webChannelMessage", this.onMessage, this)
        }
        connect(Q, c) {
            this.W.connect(Q, c)
        }
        disconnect(Q) {
            this.W.disconnect(Q)
        }
        ip() {
            this.W.ip()
        }
        getDeviceId() {
            return this.W.getDeviceId()
        }
        nY() {
            return this.W.nY()
        }
        Oi() {
            return this.W.D === 3
        }
        O() {
            this.dispatchEvent("channelOpened")
        }
        onClosed() {
            this.dispatchEvent("channelClosed")
        }
        onMessage(Q) {
            this.dispatchEvent(new yda(Q))
        }
        onError() {
            this.dispatchEvent(new S2a(this.W.XS === 401 ? 1 : 0))
        }
        sendMessage(Q, c) {
            this.W.sendMessage(Q, c)
        }
        dN(Q) {
            this.W.dN(Q)
        }
        dispose() {
            this.W.dispose()
        }
    }
    ;
    var MH9 = Date.now()
      , le = null
      , CT = Array(50)
      , z6 = -1
      , MW = !1;
    g.bw(Ji, g.W1);
    Ji.prototype.M4 = function() {
        return this.screens
    }
    ;
    Ji.prototype.contains = function(Q) {
        return !!Dn(this.screens, Q)
    }
    ;
    Ji.prototype.get = function(Q) {
        return Q ? te(this.screens, Q) : null
    }
    ;
    Ji.prototype.info = function(Q) {
        ue(this.D, Q)
    }
    ;
    var ZG9 = class extends g.W1 {
        constructor(Q, c, W, m, K) {
            super();
            this.j = Q;
            this.S = c;
            this.L = W;
            this.mF = m;
            this.Y = K;
            this.O = 0;
            this.W = null;
            this.ot = NaN
        }
        start() {
            !this.W && isNaN(this.ot) && this.A()
        }
        stop() {
            this.W && (this.W.abort(),
            this.W = null);
            isNaN(this.ot) || (g.JB(this.ot),
            this.ot = NaN)
        }
        WA() {
            this.stop();
            super.WA()
        }
        A() {
            this.ot = NaN;
            this.W = g.Wn($r(this.j, "/pairing/get_screen"), {
                method: "POST",
                postParams: {
                    pairing_code: this.S
                },
                timeout: 5E3,
                onSuccess: (0,
                g.EO)(this.D, this),
                onError: (0,
                g.EO)(this.K, this),
                onTimeout: (0,
                g.EO)(this.J, this)
            })
        }
        D(Q, c) {
            this.W = null;
            Q = c.screen || {};
            Q.dialId = this.L;
            Q.name = this.mF;
            c = -1;
            this.Y && Q.shortLivedLoungeToken && Q.shortLivedLoungeToken.value && Q.shortLivedLoungeToken.refreshIntervalMs && (Q.screenIdType = "shortLived",
            Q.loungeToken = Q.shortLivedLoungeToken.value,
            c = Q.shortLivedLoungeToken.refreshIntervalMs);
            this.publish("pairingComplete", new VE(Q), c)
        }
        K(Q) {
            this.W = null;
            Q.status && Q.status == 404 ? this.O >= FvD.length ? this.publish("pairingFailed", Error("DIAL polling timed out")) : (Q = FvD[this.O],
            this.ot = g.zn((0,
            g.EO)(this.A, this), Q),
            this.O++) : this.publish("pairingFailed", Error("Server error " + Q.status))
        }
        J() {
            this.W = null;
            this.publish("pairingFailed", Error("Server not responding"))
        }
    }
      , FvD = [2E3, 2E3, 1E3, 1E3, 1E3, 2E3, 2E3, 5E3, 5E3, 1E4];
    g.bw(kr, Ji);
    g.y = kr.prototype;
    g.y.start = function() {
        RJ(this) && this.publish("screenChange");
        !g.UM("yt-remote-lounge-token-expiration") && Y_Z(this);
        g.JB(this.W);
        this.W = g.zn((0,
        g.EO)(this.start, this), 1E4)
    }
    ;
    g.y.add = function(Q, c) {
        RJ(this);
        Jz0(this, Q);
        Yr(this, !1);
        this.publish("screenChange");
        c(Q);
        Q.token || Y_Z(this)
    }
    ;
    g.y.remove = function(Q, c) {
        let W = RJ(this);
        kQv(this, Q) && (Yr(this, !1),
        W = !0);
        c(Q);
        W && this.publish("screenChange")
    }
    ;
    g.y.OB = function(Q, c, W, m) {
        let K = RJ(this);
        const T = this.get(Q.id);
        T ? (T.name != c && (T.name = c,
        Yr(this, !1),
        K = !0),
        W(Q)) : m(Error("no such local screen."));
        K && this.publish("screenChange")
    }
    ;
    g.y.WA = function() {
        g.JB(this.W);
        kr.FS.WA.call(this)
    }
    ;
    g.y.t9 = function(Q) {
        RJ(this);
        let c = this.screens.length;
        Q = Q && Q.screens || [];
        const W = Q.length;
        for (let m = 0; m < W; ++m) {
            const K = Q[m]
              , T = this.get(K.screenId);
            T && (T.token = K.loungeToken,
            --c)
        }
        Yr(this, !c);
        c && ue(this.D, "Missed " + c + " lounge tokens.")
    }
    ;
    g.y.bH = function(Q) {
        ue(this.D, "Requesting lounge tokens failed: " + Q)
    }
    ;
    var rJa = class extends g.W1 {
        constructor(Q, c) {
            super();
            this.D = c;
            c = (c = g.UM("yt-remote-online-screen-ids") || "") ? c.split(",") : [];
            const W = {}
              , m = this.D()
              , K = m.length;
            for (let T = 0; T < K; ++T) {
                const r = m[T].id;
                W[r] = g.c9(c, r)
            }
            this.W = W;
            this.K = Q;
            this.A = this.j = NaN;
            this.O = null;
            pT("Initialized with " + g.bS(this.W))
        }
        start() {
            const Q = parseInt(g.UM("yt-remote-fast-check-period") || "0", 10);
            (this.j = g.d0() - 144E5 < Q ? 0 : Q) ? QQ(this) : (this.j = g.d0() + 3E5,
            g.rl("yt-remote-fast-check-period", this.j),
            this.J())
        }
        isEmpty() {
            return g.P9(this.W)
        }
        update() {
            pT("Updating availability on schedule.");
            const Q = this.D()
              , c = g.Ev(this.W, function(W, m) {
                return W && !!te(Q, m)
            }, this);
            cH(this, c)
        }
        WA() {
            g.JB(this.A);
            this.A = NaN;
            this.O && (this.O.abort(),
            this.O = null);
            super.WA()
        }
        J() {
            g.JB(this.A);
            this.A = NaN;
            this.O && this.O.abort();
            const Q = QKD(this);
            if (rp(Q)) {
                var c = $r(this.K, "/pairing/get_screen_availability")
                  , W = {
                    lounge_token: g.Ov(Q).join(",")
                };
                this.O = this.K.sendRequest("POST", c, W, (0,
                g.EO)(this.Y, this, Q), (0,
                g.EO)(this.L, this))
            } else
                cH(this, {}),
                QQ(this)
        }
        Y(Q, c) {
            this.O = null;
            var W = g.Ov(QKD(this));
            if (g.y1(W, g.Ov(Q))) {
                c = c.screens || [];
                W = {};
                var m = c.length;
                for (let K = 0; K < m; ++K)
                    W[Q[c[K].loungeToken]] = c[K].status == "online";
                cH(this, W);
                QQ(this)
            } else
                this.jB("Changing Screen set during request."),
                this.J()
        }
        L(Q) {
            this.jB("Screen availability failed: " + Q);
            this.O = null;
            QQ(this)
        }
        jB(Q) {
            ue("OnlineScreenService", Q)
        }
    }
    ;
    g.bw(m$, Ji);
    g.y = m$.prototype;
    g.y.start = function() {
        this.O.start();
        this.W.start();
        this.screens.length && (this.publish("screenChange"),
        this.W.isEmpty() || this.publish("onlineScreenChange"))
    }
    ;
    g.y.add = function(Q, c, W) {
        this.O.add(Q, c, W)
    }
    ;
    g.y.remove = function(Q, c, W) {
        this.O.remove(Q, c, W);
        this.W.update()
    }
    ;
    g.y.OB = function(Q, c, W, m) {
        this.O.contains(Q) ? this.O.OB(Q, c, W, m) : (Q = "Updating name of unknown screen: " + Q.name,
        ue(this.D, Q),
        m(Error(Q)))
    }
    ;
    g.y.M4 = function(Q) {
        return Q ? this.screens : g.I0(this.screens, g.uw(this.A, function(c) {
            return !this.contains(c)
        }, this))
    }
    ;
    g.y.VQ = function() {
        return g.uw(this.M4(!0), function(Q) {
            return !!this.W.W[Q.id]
        }, this)
    }
    ;
    g.y.nV = function(Q, c, W, m, K, T) {
        this.info("getDialScreenByPairingCode " + Q + " / " + c);
        const r = new ZG9(this.j,Q,c,W,m);
        r.subscribe("pairingComplete", (U, I) => {
            g.BN(r);
            K(K1(this, U), I)
        }
        );
        r.subscribe("pairingFailed", U => {
            g.BN(r);
            T(U)
        }
        );
        r.start();
        return (0,
        g.EO)(r.stop, r)
    }
    ;
    g.y.Fb = function(Q, c, W, m) {
        g.Wn($r(this.j, "/pairing/get_screen"), {
            method: "POST",
            postParams: {
                pairing_code: Q
            },
            timeout: 5E3,
            onSuccess: (0,
            g.EO)(function(K, T) {
                K = new VE(T.screen || {});
                if (!K.name || Ku1(this, K.name)) {
                    a: {
                        T = K.name;
                        let r = 2
                          , U = c(T, r);
                        for (; Ku1(this, U); ) {
                            r++;
                            if (r > 20)
                                break a;
                            U = c(T, r)
                        }
                        T = U
                    }
                    K.name = T
                }
                W(K1(this, K))
            }, this),
            onError: (0,
            g.EO)(function(K) {
                m(Error("pairing request failed: " + K.status))
            }, this),
            onTimeout: (0,
            g.EO)(function() {
                m(Error("pairing request timed out."))
            }, this)
        })
    }
    ;
    g.y.WA = function() {
        g.BN(this.O);
        g.BN(this.W);
        m$.FS.WA.call(this)
    }
    ;
    g.y.wb = function() {
        od9(this);
        this.publish("screenChange");
        this.W.update()
    }
    ;
    m$.prototype.dispose = m$.prototype.dispose;
    g.bw(oV, g.W1);
    g.y = oV.prototype;
    g.y.Yq = function(Q) {
        this.u0() || (Q && (UG(this, "" + Q),
        this.publish("sessionFailed")),
        this.W = null,
        this.publish("sessionScreen", null))
    }
    ;
    g.y.info = function(Q) {
        ue(this.Ie, Q)
    }
    ;
    g.y.Yv = function() {
        return null
    }
    ;
    g.y.xb = function(Q) {
        const c = this.O;
        Q ? (c.displayStatus = new chrome.cast.ReceiverDisplayStatus(Q,[]),
        c.displayStatus.showStop = !0) : c.displayStatus = null;
        chrome.cast.setReceiverDisplayStatus(c, (0,
        g.EO)(function() {
            this.info("Updated receiver status for " + c.friendlyName + ": " + Q)
        }, this), (0,
        g.EO)(function() {
            UG(this, "Failed to update receiver status for: " + c.friendlyName)
        }, this))
    }
    ;
    g.y.WA = function() {
        this.xb("");
        oV.FS.WA.call(this)
    }
    ;
    var yl = class extends oV {
        constructor(Q, c, W) {
            super(Q, c, "CastSession");
            this.config_ = W;
            this.A = null;
            this.S = (0,
            g.EO)(this.Ka, this);
            this.b0 = (0,
            g.EO)(this.jG, this);
            this.mF = g.zn( () => {
                AJH(this, null)
            }
            , 12E4);
            this.L = this.K = this.J = this.Y = 0
        }
        T2(Q) {
            if (this.A) {
                if (this.A == Q)
                    return;
                UG(this, "Overriding cast session with new session object");
                eTi(this);
                this.A.removeUpdateListener(this.S);
                this.A.removeMessageListener("urn:x-cast:com.google.youtube.mdx", this.b0)
            }
            this.A = Q;
            this.A.addUpdateListener(this.S);
            this.A.addMessageListener("urn:x-cast:com.google.youtube.mdx", this.b0);
            Vua(this, "getMdxSessionStatus")
        }
        D(Q) {
            this.info("launchWithParams no-op for Cast: " + g.bS(Q))
        }
        stop() {
            this.A ? this.A.stop((0,
            g.EO)(function() {
                this.Yq()
            }, this), (0,
            g.EO)(function() {
                this.Yq(Error("Failed to stop receiver app."))
            }, this)) : this.Yq(Error("Stopping cast device without session."))
        }
        xb() {}
        WA() {
            this.info("disposeInternal");
            eTi(this);
            this.A && (this.A.removeUpdateListener(this.S),
            this.A.removeMessageListener("urn:x-cast:com.google.youtube.mdx", this.b0));
            this.A = null;
            super.WA()
        }
        jG(Q, c) {
            if (!this.u0())
                if (c)
                    if (c = UL(c),
                    g.Sd(c))
                        switch (Q = "" + c.type,
                        c = c.data || {},
                        this.info("onYoutubeMessage_: " + Q + " " + g.bS(c)),
                        Q) {
                        case "mdxSessionStatus":
                            AJH(this, c);
                            break;
                        case "loungeToken":
                            Bw0(this, c);
                            break;
                        default:
                            UG(this, "Unknown youtube message: " + Q)
                        }
                    else
                        UG(this, "Unable to parse message.");
                else
                    UG(this, "No data in message.")
        }
        MM(Q, c, W, m) {
            g.JB(this.Y);
            this.Y = 0;
            mbo(this.j, this.O.label, Q, this.O.friendlyName, (0,
            g.EO)(function(K) {
                K ? c(K) : m >= 0 ? (UG(this, "Screen " + Q + " appears to be offline. " + m + " retries left."),
                this.Y = g.zn((0,
                g.EO)(this.MM, this, Q, c, W, m - 1), 300)) : W(Error("Unable to fetch screen."))
            }, this), W)
        }
        Yv() {
            return this.A
        }
        Ka(Q) {
            this.u0() || Q || (UG(this, "Cast session died."),
            this.Yq())
        }
    }
    ;
    var EFa = class extends oV {
        constructor(Q, c, W, m) {
            super(Q, c, "DialSession");
            this.config_ = m;
            this.A = this.Y = null;
            this.b0 = "";
            this.jG = W;
            this.Ka = null;
            this.S = () => {}
            ;
            this.mF = NaN;
            this.MM = (0,
            g.EO)(this.PA, this);
            this.K = () => {}
            ;
            this.L = this.J = 0
        }
        T2(Q) {
            this.A = Q;
            this.A.addUpdateListener(this.MM)
        }
        D(Q) {
            this.Ka = Q;
            this.S()
        }
        stop() {
            tuS(this);
            this.A ? this.A.stop((0,
            g.EO)(this.Yq, this, null), (0,
            g.EO)(this.Yq, this, "Failed to stop DIAL device.")) : this.Yq()
        }
        WA() {
            tuS(this);
            this.A && this.A.removeUpdateListener(this.MM);
            this.A = null;
            super.WA()
        }
        PA(Q) {
            this.u0() || Q || (UG(this, "DIAL session died."),
            this.K(),
            this.K = () => {}
            ,
            this.Yq())
        }
    }
    ;
    var sOo = class extends oV {
        constructor(Q, c) {
            super(Q, c, "ManualSession");
            this.A = g.zn((0,
            g.EO)(this.D, this, null), 150)
        }
        stop() {
            this.Yq()
        }
        T2() {}
        D() {
            g.JB(this.A);
            this.A = NaN;
            const Q = te(this.j.M4(), this.O.label);
            Q ? rz(this, Q) : this.Yq(Error("No such screen"))
        }
        WA() {
            g.JB(this.A);
            this.A = NaN;
            super.WA()
        }
    }
    ;
    var EG = class extends g.W1 {
        constructor(Q, c) {
            super();
            this.config_ = c;
            this.O = Q;
            this.T2 = c.appId || "233637DE";
            this.j = c.theme || "cl";
            this.Ie = c.disableCastApi || !1;
            this.J = c.forceMirroring || !1;
            this.W = null;
            this.L = !1;
            this.A = [];
            this.D = (0,
            g.EO)(this.Ka, this)
        }
        init(Q, c) {
            chrome.cast.timeout.requestSession = 3E4;
            var W = new chrome.cast.SessionRequest(this.T2,[chrome.cast.Capability.AUDIO_OUT]);
            g.P("desktop_enable_cast_connect") && (W.androidReceiverCompatible = !0);
            this.Ie || (W.dialRequest = new chrome.cast.DialRequest("YouTube"));
            const m = chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED;
            Q = Q || this.J ? chrome.cast.DefaultActionPolicy.CAST_THIS_TAB : chrome.cast.DefaultActionPolicy.CREATE_SESSION;
            const K = (0,
            g.EO)(this.jG, this);
            W = new chrome.cast.ApiConfig(W,(0,
            g.EO)(this.Y, this),K,m,Q);
            W.customDialLaunchCallback = (0,
            g.EO)(this.MM, this);
            chrome.cast.initialize(W, (0,
            g.EO)(function() {
                this.u0() || (chrome.cast.addReceiverActionListener(this.D),
                hha(),
                this.O.subscribe("onlineScreenChange", (0,
                g.EO)(this.K, this)),
                this.A = Fuo(this),
                chrome.cast.setCustomReceivers(this.A, () => {}
                , (0,
                g.EO)(function(T) {
                    this.jB("Failed to set initial custom receivers: " + g.bS(T))
                }, this)),
                this.publish("yt-remote-cast2-availability-change", BH(this)),
                c(!0))
            }, this), (0,
            g.EO)(function(T) {
                this.jB("Failed to initialize API: " + g.bS(T));
                c(!1)
            }, this))
        }
        UH(Q, c) {
            x_("Setting connected screen ID: " + Q + " -> " + c);
            if (this.W) {
                var W = this.W.W;
                if (!Q || W && W.id != Q)
                    x_("Unsetting old screen status: " + this.W.O.friendlyName),
                    qx(this, null)
            }
            if (Q && c) {
                if (!this.W) {
                    Q = te(this.O.M4(), Q);
                    if (!Q) {
                        x_("setConnectedScreenStatus: Unknown screen.");
                        return
                    }
                    if (Q.idType == "shortLived") {
                        x_("setConnectedScreenStatus: Screen with id type to be short lived.");
                        return
                    }
                    W = S9a(this, Q);
                    W || (x_("setConnectedScreenStatus: Connected receiver not custom..."),
                    W = new chrome.cast.Receiver(Q.uuid ? Q.uuid : Q.id,Q.name),
                    W.receiverType = chrome.cast.ReceiverType.CUSTOM,
                    this.A.push(W),
                    chrome.cast.setCustomReceivers(this.A, () => {}
                    , (0,
                    g.EO)(function(m) {
                        this.jB("Failed to set initial custom receivers: " + g.bS(m))
                    }, this)));
                    x_("setConnectedScreenStatus: new active receiver: " + W.friendlyName);
                    qx(this, new sOo(this.O,W), !0)
                }
                this.W.xb(c)
            } else
                x_("setConnectedScreenStatus: no screen.")
        }
        XI(Q) {
            this.u0() ? this.jB("Setting connection data on disposed cast v2") : this.W ? this.W.D(Q) : this.jB("Setting connection data without a session")
        }
        b0() {
            this.u0() ? this.jB("Stopping session on disposed cast v2") : this.W ? (this.W.stop(),
            qx(this, null)) : x_("Stopping non-existing session")
        }
        requestSession() {
            chrome.cast.requestSession((0,
            g.EO)(this.Y, this), (0,
            g.EO)(this.PA, this))
        }
        WA() {
            this.O.unsubscribe("onlineScreenChange", (0,
            g.EO)(this.K, this));
            window.chrome && chrome.cast && chrome.cast.removeReceiverActionListener(this.D);
            var Q = PSW;
            const c = g.DR("yt.mdx.remote.debug.handlers_");
            g.o0(c || [], Q);
            g.BN(this.W);
            super.WA()
        }
        jB(Q) {
            ue("Controller", Q)
        }
        mF(Q, c) {
            this.W == Q && (c || qx(this, null),
            this.publish("yt-remote-cast2-session-change", c))
        }
        Ka(Q, c) {
            if (!this.u0())
                if (Q)
                    switch (Q.friendlyName = chrome.cast.unescape(Q.friendlyName),
                    x_("onReceiverAction_ " + Q.label + " / " + Q.friendlyName + "-- " + c),
                    c) {
                    case chrome.cast.ReceiverAction.CAST:
                        if (this.W)
                            if (this.W.O.label != Q.label)
                                x_("onReceiverAction_: Stopping active receiver: " + this.W.O.friendlyName),
                                this.W.stop();
                            else {
                                x_("onReceiverAction_: Casting to active receiver.");
                                this.W.W && this.publish("yt-remote-cast2-session-change", this.W.W);
                                break
                            }
                        switch (Q.receiverType) {
                        case chrome.cast.ReceiverType.CUSTOM:
                            qx(this, new sOo(this.O,Q));
                            break;
                        case chrome.cast.ReceiverType.DIAL:
                            qx(this, new EFa(this.O,Q,this.j,this.config_));
                            break;
                        case chrome.cast.ReceiverType.CAST:
                            qx(this, new yl(this.O,Q,this.config_));
                            break;
                        default:
                            this.jB("Unknown receiver type: " + Q.receiverType)
                        }
                        break;
                    case chrome.cast.ReceiverAction.STOP:
                        this.W && this.W.O.label == Q.label ? this.W.stop() : this.jB("Stopping receiver w/o session: " + Q.friendlyName)
                    }
                else
                    this.jB("onReceiverAction_ called without receiver.")
        }
        MM(Q) {
            if (this.u0())
                return Promise.reject(Error("disposed"));
            var c = Q.receiver;
            c.receiverType != chrome.cast.ReceiverType.DIAL && (this.jB("Not DIAL receiver: " + c.friendlyName),
            c.receiverType = chrome.cast.ReceiverType.DIAL);
            var W = this.W ? this.W.O : null;
            if (!W || W.label != c.label)
                return this.jB("Receiving DIAL launch request for non-clicked DIAL receiver: " + c.friendlyName),
                Promise.reject(Error("illegal DIAL launch"));
            if (W && W.label == c.label && W.receiverType != chrome.cast.ReceiverType.DIAL) {
                if (this.W.W)
                    return x_("Reselecting dial screen."),
                    this.publish("yt-remote-cast2-session-change", this.W.W),
                    Promise.resolve(new chrome.cast.DialLaunchResponse(!1));
                this.jB('Changing CAST intent from "' + W.receiverType + '" to "dial" for ' + c.friendlyName);
                qx(this, new EFa(this.O,c,this.j,this.config_))
            }
            c = this.W;
            c.Y = Q;
            c.Y.appState == chrome.cast.DialAppState.RUNNING ? (Q = c.Y.extraData || {},
            W = Q.screenId || null,
            e6(c) && Q.loungeToken ? Q.loungeTokenRefreshIntervalMs ? Q = yJa(c, {
                name: c.O.friendlyName,
                screenId: Q.screenId,
                loungeToken: Q.loungeToken,
                dialId: c.Y.receiver.label,
                screenIdType: "shortLived"
            }, Q.loungeTokenRefreshIntervalMs) : (g.Zp(Error(`No loungeTokenRefreshIntervalMs presents in additionalData: ${JSON.stringify(Q)}.`)),
            Q = Nw1(c, W)) : Q = Nw1(c, W)) : Q = At(c);
            return Q
        }
        Y(Q) {
            if (!this.u0() && !this.J) {
                x_("New cast session ID: " + Q.sessionId);
                var c = Q.receiver;
                if (c.receiverType != chrome.cast.ReceiverType.CUSTOM) {
                    if (!this.W)
                        if (c.receiverType == chrome.cast.ReceiverType.CAST)
                            x_("Got resumed cast session before resumed mdx connection."),
                            c.friendlyName = chrome.cast.unescape(c.friendlyName),
                            qx(this, new yl(this.O,c,this.config_), !0);
                        else {
                            this.jB("Got non-cast session without previous mdx receiver event, or mdx resume.");
                            return
                        }
                    var W = this.W.O
                      , m = te(this.O.M4(), W.label);
                    m && Bg(m, c.label) && W.receiverType != chrome.cast.ReceiverType.CAST && c.receiverType == chrome.cast.ReceiverType.CAST && (x_("onSessionEstablished_: manual to cast session change " + c.friendlyName),
                    g.BN(this.W),
                    this.W = new yl(this.O,c,this.config_),
                    this.W.subscribe("sessionScreen", (0,
                    g.EO)(this.mF, this, this.W)),
                    this.W.subscribe("sessionFailed", () => ZZZ(this, this.W)),
                    this.W.D(null));
                    this.W.T2(Q)
                }
            }
        }
        S() {
            return this.W ? this.W.Yv() : null
        }
        PA(Q) {
            this.u0() || (this.jB("Failed to estabilish a session: " + g.bS(Q)),
            Q.code != chrome.cast.ErrorCode.CANCEL && qx(this, null),
            this.publish("yt-remote-cast2-session-failed"))
        }
        jG(Q) {
            x_("Receiver availability updated: " + Q);
            if (!this.u0()) {
                var c = BH(this);
                this.L = Q == chrome.cast.ReceiverAvailability.AVAILABLE;
                BH(this) != c && this.publish("yt-remote-cast2-availability-change", BH(this))
            }
        }
        K() {
            this.u0() || (this.A = Fuo(this),
            x_("Updating custom receivers: " + g.bS(this.A)),
            chrome.cast.setCustomReceivers(this.A, () => {}
            , (0,
            g.EO)(function() {
                this.jB("Failed to set custom receivers.")
            }, this)),
            this.publish("yt-remote-cast2-availability-change", BH(this)))
        }
    }
    ;
    EG.prototype.setLaunchParams = EG.prototype.XI;
    EG.prototype.setConnectedScreenStatus = EG.prototype.UH;
    EG.prototype.stopSession = EG.prototype.b0;
    EG.prototype.getCastSession = EG.prototype.S;
    EG.prototype.requestSession = EG.prototype.requestSession;
    EG.prototype.init = EG.prototype.init;
    EG.prototype.dispose = EG.prototype.dispose;
    var i$ = []
      , wGS = (0,
    g.Q0)`https://www.gstatic.com/cv/js/sender/v1/cast_sender.js`;
    g.y = sG.prototype;
    g.y.reset = function(Q) {
        this.listId = "";
        this.index = -1;
        this.videoId = "";
        dz(this);
        this.volume = -1;
        this.muted = !1;
        Q && (this.index = Q.index,
        this.listId = Q.listId,
        this.videoId = Q.videoId,
        this.playerState = Q.playerState,
        this.volume = Q.volume,
        this.muted = Q.muted,
        this.audioTrackId = Q.audioTrackId,
        this.trackData = Q.trackData,
        this.hasPrevious = Q.hasPrevious,
        this.hasNext = Q.hasNext,
        this.D = Q.playerTime,
        this.K = Q.playerTimeAt,
        this.O = Q.seekableStart,
        this.J = Q.seekableEnd,
        this.A = Q.duration,
        this.loadedTime = Q.loadedTime,
        this.W = Q.liveIngestionTime,
        this.j = !isNaN(this.W))
    }
    ;
    g.y.isPlaying = function() {
        return this.playerState == 1
    }
    ;
    g.y.isBuffering = function() {
        return this.playerState == 3
    }
    ;
    g.y.ly = function(Q) {
        this.A = isNaN(Q) ? 0 : Q
    }
    ;
    g.y.getDuration = function() {
        return this.j ? this.A + L1(this) : this.A
    }
    ;
    g.y.clone = function() {
        return new sG(gz(this))
    }
    ;
    var d1W = class extends g.W1 {
        constructor() {
            var Q = o3();
            super();
            this.A = 0;
            this.j = Q;
            this.J = [];
            this.K = new iOS;
            this.O = this.W = null;
            this.S = (0,
            g.EO)(this.Ka, this);
            this.Y = (0,
            g.EO)(this.D, this);
            this.mF = (0,
            g.EO)(this.MM, this);
            this.Ie = (0,
            g.EO)(this.jG, this);
            let c = 0;
            Q ? (c = Q.getProxyState(),
            c != 3 && (Q.subscribe("proxyStateChange", this.T2, this),
            GSv(this))) : c = 3;
            c != 0 && g.zn( () => {
                this.T2(c)
            }
            , 0);
            (Q = faH()) && OG(this, Q);
            this.subscribe("yt-remote-cast2-session-change", this.Ie)
        }
        getState() {
            return this.A
        }
        nY() {
            return this.j.getReconnectTimeout()
        }
        ip() {
            this.j.reconnect()
        }
        play() {
            vH(this) ? (this.W ? this.W.play(null, g.vB, GP(this, "play")) : aV(this, "play"),
            PH(this, 1, b$(f1(this))),
            this.publish("remotePlayerChange")) : l$(this, this.play)
        }
        pause() {
            vH(this) ? (this.W ? this.W.pause(null, g.vB, GP(this, "pause")) : aV(this, "pause"),
            PH(this, 2, b$(f1(this))),
            this.publish("remotePlayerChange")) : l$(this, this.pause)
        }
        seekTo(Q) {
            if (vH(this)) {
                if (this.W) {
                    const c = f1(this)
                      , W = new chrome.cast.media.SeekRequest;
                    W.currentTime = Q;
                    c.isPlaying() || c.isBuffering() ? W.resumeState = chrome.cast.media.ResumeState.PLAYBACK_START : W.resumeState = chrome.cast.media.ResumeState.PLAYBACK_PAUSE;
                    this.W.seek(W, g.vB, GP(this, "seekTo", {
                        newTime: Q
                    }))
                } else
                    aV(this, "seekTo", {
                        newTime: Q
                    });
                PH(this, 3, Q);
                this.publish("remotePlayerChange")
            } else
                l$(this, g.sO(this.seekTo, Q))
        }
        stop() {
            if (vH(this)) {
                this.W ? this.W.stop(null, g.vB, GP(this, "stopVideo")) : aV(this, "stopVideo");
                var Q = f1(this);
                Q.index = -1;
                Q.videoId = "";
                dz(Q);
                $_(this, Q);
                this.publish("remotePlayerChange")
            } else
                l$(this, this.stop)
        }
        setVolume(Q, c) {
            if (vH(this)) {
                var W = f1(this);
                if (this.O) {
                    if (W.volume != Q) {
                        const m = Math.round(Q) / 100;
                        this.O.setReceiverVolumeLevel(m, (0,
                        g.EO)(function() {
                            hi("set receiver volume: " + m)
                        }, this), (0,
                        g.EO)(function() {
                            this.jB("failed to set receiver volume.")
                        }, this))
                    }
                    W.muted != c && this.O.setReceiverMuted(c, (0,
                    g.EO)(function() {
                        hi("set receiver muted: " + c)
                    }, this), (0,
                    g.EO)(function() {
                        this.jB("failed to set receiver muted.")
                    }, this))
                } else {
                    const m = {
                        volume: Q,
                        muted: c
                    };
                    W.volume != -1 && (m.delta = Q - W.volume);
                    aV(this, "setVolume", m)
                }
                W.muted = c;
                W.volume = Q;
                $_(this, W)
            } else
                l$(this, g.sO(this.setVolume, Q, c))
        }
        L(Q, c) {
            if (vH(this)) {
                var W = f1(this);
                Q = {
                    videoId: Q
                };
                c && (W.trackData = {
                    trackName: c.name,
                    languageCode: c.languageCode,
                    sourceLanguageCode: c.translationLanguage ? c.translationLanguage.languageCode : "",
                    languageName: c.languageName,
                    kind: c.kind
                },
                Q.style = g.bS(c.style),
                g.JH(Q, W.trackData));
                aV(this, "setSubtitlesTrack", Q);
                $_(this, W)
            } else
                l$(this, g.sO(this.L, Q, c))
        }
        setAudioTrack(Q, c) {
            vH(this) ? (c = c.getLanguageInfo().getId(),
            aV(this, "setAudioTrack", {
                videoId: Q,
                audioTrackId: c
            }),
            Q = f1(this),
            Q.audioTrackId = c,
            $_(this, Q)) : l$(this, g.sO(this.setAudioTrack, Q, c))
        }
        playVideo(Q, c, W, m=null, K=null, T=null, r=null) {
            const U = f1(this)
              , I = {
                videoId: Q
            };
            W !== void 0 && (I.currentIndex = W);
            j6(U, Q, W || 0);
            c !== void 0 && (wz(U, c),
            I.currentTime = c);
            m && (I.listId = m);
            K && (I.playerParams = K);
            T && (I.clickTrackingParams = T);
            r && (I.locationInfo = g.bS(r));
            aV(this, "setPlaylist", I);
            m || $_(this, U)
        }
        Ye(Q, c) {
            if (vH(this)) {
                if (Q && c) {
                    const W = f1(this);
                    j6(W, Q, c);
                    $_(this, W)
                }
                aV(this, "previous")
            } else
                l$(this, g.sO(this.Ye, Q, c))
        }
        nextVideo(Q, c) {
            if (vH(this)) {
                if (Q && c) {
                    const W = f1(this);
                    j6(W, Q, c);
                    $_(this, W)
                }
                aV(this, "next")
            } else
                l$(this, g.sO(this.nextVideo, Q, c))
        }
        l8() {
            if (vH(this)) {
                aV(this, "clearPlaylist");
                var Q = f1(this);
                Q.reset();
                $_(this, Q);
                this.publish("remotePlayerChange")
            } else
                l$(this, this.l8)
        }
        b0() {
            vH(this) ? aV(this, "dismissAutoplay") : l$(this, this.b0)
        }
        dispose() {
            if (this.A != 3) {
                const Q = this.A;
                this.A = 3;
                this.publish("proxyStateChange", Q, this.A)
            }
            super.dispose()
        }
        WA() {
            $b9(this);
            this.j = null;
            this.K.clear();
            OG(this, null);
            super.WA()
        }
        T2(Q) {
            if ((Q != this.A || Q == 2) && this.A != 3 && Q != 0) {
                var c = this.A;
                this.A = Q;
                this.publish("proxyStateChange", c, Q);
                if (Q == 1)
                    for (; !this.K.isEmpty(); )
                        c = Q = this.K,
                        c.W.length === 0 && (c.W = c.O,
                        c.W.reverse(),
                        c.O = []),
                        Q.W.pop().apply(this);
                else
                    Q == 3 && this.dispose()
            }
        }
        PA(Q, c) {
            this.publish(Q, c)
        }
        Ka(Q) {
            if (!Q)
                this.D(null),
                OG(this, null);
            else if (this.O.receiver.volume) {
                Q = this.O.receiver.volume;
                const c = f1(this)
                  , W = Math.round(100 * Q.level || 0);
                if (c.volume != W || c.muted != Q.muted)
                    hi("Cast volume update: " + Q.level + (Q.muted ? " muted" : "")),
                    c.volume = W,
                    c.muted = !!Q.muted,
                    $_(this, c)
            }
        }
        D(Q) {
            hi("Cast media: " + !!Q);
            this.W && this.W.removeUpdateListener(this.mF);
            if (this.W = Q)
                this.W.addUpdateListener(this.mF),
                Pd9(this),
                this.publish("remotePlayerChange")
        }
        MM(Q) {
            Q ? (Pd9(this),
            this.publish("remotePlayerChange")) : this.D(null)
        }
        Sz() {
            aV(this, "sendDebugCommand", {
                debugCommand: "stats4nerds "
            })
        }
        jG() {
            const Q = faH();
            Q && OG(this, Q)
        }
        jB(Q) {
            ue("CP", Q)
        }
    }
    ;
    var xq = class extends g.W1 {
        constructor(Q, c=!1) {
            var W = RV
              , m = Kn();
            super();
            this.D = NaN;
            this.MM = !1;
            this.S = this.mF = this.T2 = this.Ie = NaN;
            this.b0 = [];
            this.K = this.L = this.j = this.W = this.O = null;
            this.HA = W;
            this.PA = c;
            this.b0.push(g.ph(window, "beforeunload", () => {
                this.J(2)
            }
            ));
            this.A = [];
            this.W = new sG;
            this.La = Q.id;
            this.jG = Q.idType;
            this.O = $Am(this.HA, m, this.Ka, this.jG == "shortLived", this.La);
            this.O.listen("channelOpened", () => {
                laa(this)
            }
            );
            this.O.listen("channelClosed", () => {
                u$("Channel closed");
                isNaN(this.D) ? Sx(!0) : Sx();
                this.dispose()
            }
            );
            this.O.listen("channelError", K => {
                Sx();
                isNaN(this.Y()) ? (K == 1 && this.jG == "shortLived" && this.publish("browserChannelAuthError", K),
                u$(`Channel error: ${K} without reconnection`),
                this.dispose()) : (this.MM = !0,
                u$("Channel error: " + K + " with reconnection in " + this.Y() + " ms"),
                zP(this, 2))
            }
            );
            this.O.listen("channelMessage", K => {
                cdD(this, K)
            }
            );
            this.O.dN(Q.token);
            this.subscribe("remoteQueueChange", () => {
                var K = this.W.videoId;
                g.Xd() && g.rl("yt-remote-session-video-id", K)
            }
            )
        }
        connect(Q, c) {
            if (c) {
                var W = c.listId;
                const m = c.videoId
                  , K = c.videoIds
                  , T = c.playerParams
                  , r = c.clickTrackingParams
                  , U = c.index
                  , I = {
                    videoId: m
                }
                  , X = c.currentTime
                  , A = c.locationInfo;
                c = c.loopMode;
                X !== void 0 && (I.currentTime = X <= 5 ? 0 : X);
                T && (I.playerParams = T);
                A && (I.locationInfo = A);
                r && (I.clickTrackingParams = r);
                W && (I.listId = W);
                K && K.length > 0 && (I.videoIds = K.join(","));
                U !== void 0 && (I.currentIndex = U);
                this.PA && (I.loopMode = c || "LOOP_MODE_OFF");
                W && (this.W.listId = W);
                this.W.videoId = m;
                this.W.index = U || 0;
                this.W.state = 3;
                wz(this.W, X);
                this.K = "UNSUPPORTED";
                W = this.PA ? "setInitialState" : "setPlaylist";
                u$(`Connecting with ${W} and params: ${g.bS(I)}`);
                this.O.connect({
                    method: W,
                    params: g.bS(I)
                }, Q, psZ())
            } else
                u$("Connecting without params"),
                this.O.connect({}, Q, psZ());
            WvZ(this)
        }
        dN(Q) {
            this.O.dN(Q)
        }
        dispose() {
            this.u0() || (g.n7("yt.mdx.remote.remoteClient_", null),
            this.publish("beforeDispose"),
            zP(this, 3));
            super.dispose()
        }
        WA() {
            C1(this);
            Mx(this);
            ht(this);
            g.JB(this.mF);
            this.mF = NaN;
            g.JB(this.S);
            this.S = NaN;
            this.j = null;
            g.Qg(this.b0);
            this.b0.length = 0;
            this.O.dispose();
            super.WA();
            this.K = this.L = this.A = this.W = this.O = null
        }
        XI(Q) {
            if (!this.A || this.A.length === 0)
                return !1;
            for (const c of this.A)
                if (!c.capabilities.has(Q))
                    return !1;
            return !0
        }
        Fw() {
            let Q = 3;
            this.u0() || (Q = 0,
            isNaN(this.Y()) ? this.O.Oi() && isNaN(this.D) && (Q = 1) : Q = 2);
            return Q
        }
        J(Q) {
            u$("Disconnecting with " + Q);
            g.n7("yt.mdx.remote.remoteClient_", null);
            C1(this);
            this.publish("beforeDisconnect", Q);
            Q == 1 && Sx();
            this.O.disconnect(Q);
            this.dispose()
        }
        EC() {
            let Q = this.W;
            this.j && (Q = this.W.clone(),
            j6(Q, this.j, Q.index));
            return gz(Q)
        }
        iX(Q) {
            const c = new sG(Q);
            c.videoId && c.videoId != this.W.videoId && (this.j = c.videoId,
            g.JB(this.mF),
            this.mF = g.zn( () => {
                if (this.j) {
                    const m = this.j;
                    this.j = null;
                    this.W.videoId != m && Jt(this, "getNowPlaying")
                }
            }
            , 5E3));
            const W = [];
            this.W.listId == c.listId && this.W.videoId == c.videoId && this.W.index == c.index || W.push("remoteQueueChange");
            this.W.playerState == c.playerState && this.W.volume == c.volume && this.W.muted == c.muted && b$(this.W) == b$(c) && g.bS(this.W.trackData) == g.bS(c.trackData) || W.push("remotePlayerChange");
            this.W.reset(Q);
            g.lw(W, function(m) {
                this.publish(m)
            }, this)
        }
        UH() {
            const Q = this.O.getDeviceId()
              , c = g.Yx(this.A, function(W) {
                return W.type == "REMOTE_CONTROL" && W.id != Q
            });
            return c ? c.id : ""
        }
        Y() {
            return this.O.nY()
        }
        Y0() {
            return this.K || "UNSUPPORTED"
        }
        Re() {
            return this.L || ""
        }
        JJ() {
            !isNaN(this.Y()) && this.O.ip()
        }
        WB(Q, c) {
            Jt(this, Q, c);
            TCZ(this)
        }
        Ka() {
            var Q = g.V5("SAPISID", "") || g.V5("__Secure-1PAPISID") || ""
              , c = g.V5("__Secure-3PAPISID", "") || "";
            if (!Q && !c)
                return "";
            Q = g.lj(g.Gk(Q), 2);
            c = g.lj(g.Gk(c), 2);
            return g.lj(g.Gk(`,${Q},${c}`), 2)
        }
    }
    ;
    xq.prototype.subscribe = xq.prototype.subscribe;
    xq.prototype.unsubscribeByKey = xq.prototype.bU;
    xq.prototype.getProxyState = xq.prototype.Fw;
    xq.prototype.disconnect = xq.prototype.J;
    xq.prototype.getPlayerContextData = xq.prototype.EC;
    xq.prototype.setPlayerContextData = xq.prototype.iX;
    xq.prototype.getOtherConnectedRemoteId = xq.prototype.UH;
    xq.prototype.getReconnectTimeout = xq.prototype.Y;
    xq.prototype.getAutoplayMode = xq.prototype.Y0;
    xq.prototype.getAutoplayVideoId = xq.prototype.Re;
    xq.prototype.reconnect = xq.prototype.JJ;
    xq.prototype.sendMessage = xq.prototype.WB;
    xq.prototype.getXsrfToken = xq.prototype.Ka;
    xq.prototype.isCapabilitySupportedOnConnectedDevices = xq.prototype.XI;
    var e9m = class extends Ji {
        constructor(Q) {
            super("ScreenServiceProxy");
            this.AE = Q;
            this.W = [];
            this.W.push(this.AE.$_s("screenChange", (0,
            g.EO)(this.O, this)));
            this.W.push(this.AE.$_s("onlineScreenChange", (0,
            g.EO)(this.A, this)))
        }
        M4(Q) {
            return this.AE.$_gs(Q)
        }
        contains(Q) {
            return !!this.AE.$_c(Q)
        }
        get(Q) {
            return this.AE.$_g(Q)
        }
        start() {
            this.AE.$_st()
        }
        add(Q, c, W) {
            this.AE.$_a(Q, c, W)
        }
        remove(Q, c, W) {
            this.AE.$_r(Q, c, W)
        }
        OB(Q, c, W, m) {
            this.AE.$_un(Q, c, W, m)
        }
        WA() {
            const Q = this.W.length;
            for (let c = 0; c < Q; ++c)
                this.AE.$_ubk(this.W[c]);
            this.W.length = 0;
            this.AE = null;
            super.WA()
        }
        O() {
            this.publish("screenChange")
        }
        A() {
            this.publish("onlineScreenChange")
        }
    }
    ;
    m$.prototype.$_st = m$.prototype.start;
    m$.prototype.$_gspc = m$.prototype.Fb;
    m$.prototype.$_gsppc = m$.prototype.nV;
    m$.prototype.$_c = m$.prototype.contains;
    m$.prototype.$_g = m$.prototype.get;
    m$.prototype.$_a = m$.prototype.add;
    m$.prototype.$_un = m$.prototype.OB;
    m$.prototype.$_r = m$.prototype.remove;
    m$.prototype.$_gs = m$.prototype.M4;
    m$.prototype.$_gos = m$.prototype.VQ;
    m$.prototype.$_s = m$.prototype.subscribe;
    m$.prototype.$_ubk = m$.prototype.bU;
    var Uk = null
      , Ba = !1
      , RV = null
      , k_ = null
      , Vl = null
      , ca = [];
    var Lvo = class extends g.qK {
        constructor(Q, c, W) {
            super();
            this.W = Q;
            this.U = c;
            this.fX = W;
            this.events = new g.db(this);
            this.D = !1;
            this.L = new g.In(64);
            this.O = new g.Uc(this.Ka,500,this);
            this.A = new g.Uc(this.jG,1E3,this);
            this.mF = new wp(this.La,0,this);
            this.j = {};
            this.S = new g.Uc(this.UH,1E3,this);
            this.Y = new g.F_(this.seekTo,1E3,this);
            this.XI = this.events.B(this.U, "onVolumeChange", m => {
                x14(this, m)
            }
            );
            g.F(this, this.events);
            this.events.B(c, "onCaptionsTrackListChanged", this.JJ);
            this.events.B(c, "captionschanged", this.HA);
            this.events.B(c, "captionssettingschanged", this.PA);
            this.events.B(c, "videoplayerreset", this.J);
            this.events.B(c, "mdxautoplaycancel", () => {
                this.fX.b0()
            }
            );
            c.X("enable_mdx_video_play_directly") && this.events.B(c, "videodatachange", () => {
                D1m(this.W) || qv(this) || D3(this, 0)
            }
            );
            Q = this.fX;
            Q.u0();
            Q.subscribe("proxyStateChange", this.MM, this);
            Q.subscribe("remotePlayerChange", this.K, this);
            Q.subscribe("remoteQueueChange", this.J, this);
            Q.subscribe("previousNextChange", this.Ie, this);
            Q.subscribe("nowAutoplaying", this.T2, this);
            Q.subscribe("autoplayDismissed", this.b0, this);
            g.F(this, this.O);
            g.F(this, this.A);
            g.F(this, this.mF);
            g.F(this, this.S);
            g.F(this, this.Y);
            this.PA();
            this.J();
            this.K()
        }
        WA() {
            super.WA();
            this.O.stop();
            this.A.stop();
            this.mF.stop();
            const Q = this.fX;
            Q.unsubscribe("proxyStateChange", this.MM, this);
            Q.unsubscribe("remotePlayerChange", this.K, this);
            Q.unsubscribe("remoteQueueChange", this.J, this);
            Q.unsubscribe("previousNextChange", this.Ie, this);
            Q.unsubscribe("nowAutoplaying", this.T2, this);
            Q.unsubscribe("autoplayDismissed", this.b0, this);
            this.fX = this.W = null
        }
        jZ(Q, ...c) {
            if (this.fX.A != 2)
                if (qv(this)) {
                    if (f1(this.fX).playerState != 1081 || Q !== "control_seek")
                        switch (Q) {
                        case "control_toggle_play_pause":
                            f1(this.fX).isPlaying() ? this.fX.pause() : this.fX.play();
                            break;
                        case "control_play":
                            this.fX.play();
                            break;
                        case "control_pause":
                            this.fX.pause();
                            break;
                        case "control_seek":
                            this.Y.j(c[0], c[1]);
                            break;
                        case "control_subtitles_set_track":
                            t$(this, c[0]);
                            break;
                        case "control_set_audio_track":
                            this.setAudioTrack(c[0])
                        }
                } else
                    switch (Q) {
                    case "control_toggle_play_pause":
                    case "control_play":
                    case "control_pause":
                        Q = this.U.getCurrentTime();
                        D3(this, Q === 0 ? void 0 : Q);
                        break;
                    case "control_seek":
                        D3(this, c[0]);
                        break;
                    case "control_subtitles_set_track":
                        t$(this, c[0]);
                        break;
                    case "control_set_audio_track":
                        this.setAudioTrack(c[0])
                    }
        }
        HA(Q) {
            this.mF.LG(Q)
        }
        La(Q) {
            this.jZ("control_subtitles_set_track", g.P9(Q) ? null : Q)
        }
        PA() {
            const Q = this.U.getOption("captions", "track");
            g.P9(Q) || t$(this, Q)
        }
        kx(Q) {
            this.W.kx(Q, this.U.getVideoData().lengthSeconds)
        }
        JJ() {
            g.P9(this.j) || q20(this, this.j);
            this.D = !1
        }
        MM(Q, c) {
            this.A.stop();
            c === 2 && this.jG()
        }
        K() {
            if (qv(this)) {
                this.O.stop();
                var Q = f1(this.fX);
                switch (Q.playerState) {
                case 1080:
                case 1081:
                case 1084:
                case 1085:
                    this.W.Aj = 1;
                    break;
                case 1082:
                case 1083:
                    this.W.Aj = 0;
                    break;
                default:
                    this.W.Aj = -1
                }
                switch (Q.playerState) {
                case 1081:
                case 1:
                    this.OO(new g.In(8));
                    this.Ka();
                    break;
                case 1085:
                case 3:
                    this.OO(new g.In(9));
                    break;
                case 1083:
                case 0:
                    this.OO(new g.In(2));
                    this.Y.stop();
                    this.kx(this.U.getVideoData().lengthSeconds);
                    break;
                case 1084:
                    this.OO(new g.In(4));
                    break;
                case 2:
                    this.OO(new g.In(4));
                    this.kx(b$(Q));
                    break;
                case -1:
                    this.OO(new g.In(64));
                    break;
                case -1E3:
                    this.OO(new g.In(128,{
                        errorCode: "mdx.remoteerror",
                        errorMessage: "This video is not available for remote playback.",
                        Ia: 2
                    }))
                }
                const W = f1(this.fX).trackData;
                Q = W;
                var c = this.j;
                (Q || c ? Q && c && Q.trackName == c.trackName && Q.languageCode == c.languageCode && Q.languageName == c.languageName && Q.kind == c.kind : 1) || (this.j = W,
                q20(this, W));
                Q = f1(this.fX);
                Q.volume === -1 || Math.round(this.U.getVolume()) === Q.volume && this.U.isMuted() === Q.muted || this.S.isActive() || this.UH()
            } else
                nFa(this)
        }
        Ie() {
            this.U.publish("mdxpreviousnextchange")
        }
        J() {
            qv(this) || nFa(this)
        }
        T2(Q) {
            isNaN(Q) || this.U.publish("mdxnowautoplaying", Q)
        }
        b0() {
            this.U.publish("mdxautoplaycanceled")
        }
        setAudioTrack(Q) {
            qv(this) && this.fX.setAudioTrack(nn(this).videoId, Q)
        }
        seekTo(Q, c) {
            f1(this.fX).playerState === -1 ? D3(this, Q) : c && this.fX.seekTo(Q)
        }
        UH() {
            if (qv(this)) {
                var Q = f1(this.fX);
                this.events.Xd(this.XI);
                Q.muted ? this.U.mute() : this.U.unMute();
                this.U.setVolume(Q.volume);
                this.XI = this.events.B(this.U, "onVolumeChange", c => {
                    x14(this, c)
                }
                )
            }
        }
        Ka() {
            this.O.stop();
            if (!this.fX.u0()) {
                var Q = f1(this.fX);
                Q.isPlaying() && this.OO(new g.In(8));
                this.kx(b$(Q));
                this.O.start()
            }
        }
        jG() {
            this.A.stop();
            this.O.stop();
            const Q = this.fX.nY();
            this.fX.A == 2 && !isNaN(Q) && this.A.start()
        }
        OO(Q) {
            this.A.stop();
            const c = this.L;
            if (!g.xT(c, Q)) {
                const W = Q.W(2);
                W !== this.L.W(2) && this.U.Ni(W);
                this.L = Q;
                tX4(this.W, c, Q)
            }
        }
    }
    ;
    var wx9 = class extends g.WM {
        constructor(Q, c) {
            super(Q);
            this.W = c
        }
        getCurrentTime() {
            return this.W.getCurrentTime()
        }
        getDuration() {
            return this.W.getDuration()
        }
        Kk() {
            return this.W.Kk()
        }
        A6() {
            return this.W.A6()
        }
        qE() {
            return this.W.qE()
        }
        v4() {
            return this.W.v4()
        }
        getPlayerState() {
            return this.W.GU
        }
        isAtLiveHead() {
            return this.W.isAtLiveHead()
        }
        pauseVideo() {
            Ha(this.W, "control_pause")
        }
        async playVideo() {
            Ha(this.W, "control_play")
        }
        seekTo(Q, c) {
            Ha(this.W, "control_seek", Q, !c?.b_)
        }
        s2(Q) {
            Ha(this.W, "control_set_audio_track", Q);
            return !0
        }
    }
    ;
    var bG0 = class extends g.k {
        constructor() {
            super({
                C: "div",
                Z: "ytp-mdx-popup-dialog",
                N: {
                    role: "dialog"
                },
                V: [{
                    C: "div",
                    Z: "ytp-mdx-popup-dialog-inner-content",
                    V: [{
                        C: "div",
                        Z: "ytp-mdx-popup-title",
                        eG: "You're signed out"
                    }, {
                        C: "div",
                        Z: "ytp-mdx-popup-description",
                        eG: "Videos you watch may be added to the TV's watch history and influence TV recommendations. To avoid this, cancel and sign in to YouTube on your computer."
                    }, {
                        C: "div",
                        Z: "ytp-mdx-privacy-popup-buttons",
                        V: [{
                            C: "button",
                            yC: ["ytp-button", "ytp-mdx-privacy-popup-cancel"],
                            eG: "Cancel"
                        }, {
                            C: "button",
                            yC: ["ytp-button", "ytp-mdx-privacy-popup-confirm"],
                            eG: "Confirm"
                        }]
                    }]
                }]
            });
            this.fade = new g.QR(this,250);
            this.cancelButton = this.z2("ytp-mdx-privacy-popup-cancel");
            this.confirmButton = this.z2("ytp-mdx-privacy-popup-confirm");
            g.F(this, this.fade);
            this.B(this.cancelButton, "click", this.W);
            this.B(this.confirmButton, "click", this.O)
        }
        Bw() {
            this.fade.show()
        }
        HB() {
            this.fade.hide()
        }
        W() {
            Zn("mdx-privacy-popup-cancel");
            this.HB()
        }
        O() {
            Zn("mdx-privacy-popup-confirm");
            this.HB()
        }
    }
    ;
    var jOH = class extends g.k {
        constructor(Q) {
            super({
                C: "div",
                Z: "ytp-remote",
                V: [{
                    C: "div",
                    Z: "ytp-remote-display-status",
                    V: [{
                        C: "div",
                        Z: "ytp-remote-display-status-icon",
                        V: [g.$Kx()]
                    }, {
                        C: "div",
                        Z: "ytp-remote-display-status-text",
                        eG: "{{statustext}}"
                    }]
                }]
            });
            this.api = Q;
            this.fade = new g.QR(this,250);
            g.F(this, this.fade);
            this.B(Q, "presentingplayerstatechange", this.onStateChange);
            this.l3(Q.getPlayerStateObject())
        }
        onStateChange(Q) {
            this.l3(Q.state)
        }
        l3(Q) {
            if (this.api.getPresentingPlayerType() === 3) {
                const c = {
                    RECEIVER_NAME: this.api.getOption("remote", "currentReceiver").name
                };
                Q = Q.W(128) ? g.LQ("Error on $RECEIVER_NAME", c) : Q.isPlaying() || Q.isPaused() ? g.LQ("Playing on $RECEIVER_NAME", c) : g.LQ("Connected to $RECEIVER_NAME", c);
                this.updateValue("statustext", Q);
                this.fade.show()
            } else
                this.fade.hide()
        }
    }
    ;
    var gFS = class extends g.lN {
        constructor(Q, c) {
            super("Play on", 1, Q, c);
            this.U = Q;
            this.Bk = {};
            this.B(Q, "onMdxReceiversChange", this.D);
            this.B(Q, "presentingplayerstatechange", this.D);
            this.D()
        }
        D() {
            var Q = this.U.getOption("remote", "receivers");
            Q && Q.length > 1 && !this.U.getOption("remote", "quickCast") ? (this.Bk = g.Fi(Q, this.K, this),
            this.j(g.hy(Q, this.K)),
            Q = this.U.getOption("remote", "currentReceiver"),
            Q = this.K(Q),
            this.options[Q] && this.O(Q),
            this.enable(!0)) : this.enable(!1)
        }
        K(Q) {
            return Q.key
        }
        A(Q) {
            return Q === "cast-selector-receiver" ? "Cast..." : this.Bk[Q].name
        }
        W(Q) {
            super.W(Q);
            this.U.setOption("remote", "currentReceiver", this.Bk[Q]);
            this.Ik.HB()
        }
    }
    ;
    g.GN("remote", class extends g.zj {
        constructor(Q) {
            super(Q);
            this.Hp = {
                key: nx(),
                name: "This computer"
            };
            this.c5 = null;
            this.subscriptions = [];
            this.Hv = this.fX = null;
            this.Bk = [this.Hp];
            this.qp = this.Hp;
            this.GU = new g.In(64);
            this.LJ = 0;
            this.Aj = -1;
            this.Nd = !1;
            this.BI = this.G4 = this.Uc = null;
            if (!g.X7(this.player.G()) && !g.uL(this.player.G())) {
                Q = this.player;
                var c = g.ip(Q);
                c && (c = c.lU()) && (c = new gFS(Q,c),
                g.F(this, c));
                c = new jOH(Q);
                g.F(this, c);
                g.f8(Q, c.element, 4);
                this.Uc = new bG0;
                g.F(this, this.Uc);
                g.f8(Q, this.Uc.element, 4);
                this.Nd = !!mf()
            }
        }
        create() {
            var Q = this.player.G();
            const c = g.eh(Q);
            Q = {
                device: "Desktop",
                app: "youtube-desktop",
                loadCastApiSetupScript: Q.X("mdx_load_cast_api_bootstrap_script"),
                enableDialLoungeToken: Q.X("enable_dial_short_lived_lounge_token"),
                enableCastLoungeToken: Q.X("enable_cast_short_lived_lounge_token")
            };
            IAi(c, Q);
            this.subscriptions.push(g.Qp("yt-remote-before-disconnect", this.hP, this));
            this.subscriptions.push(g.Qp("yt-remote-connection-change", this.lm, this));
            this.subscriptions.push(g.Qp("yt-remote-receiver-availability-change", this.G6, this));
            this.subscriptions.push(g.Qp("yt-remote-auto-connect", this.JW, this));
            this.subscriptions.push(g.Qp("yt-remote-receiver-resumed", this.Hh, this));
            this.subscriptions.push(g.Qp("mdx-privacy-popup-confirm", this.Xj, this));
            this.subscriptions.push(g.Qp("mdx-privacy-popup-cancel", this.Dy, this));
            this.G6()
        }
        load() {
            this.player.cancelPlayback();
            super.load();
            this.BI = new wx9(this.player.G(),this);
            this.player.uf(this.BI);
            this.c5 = new Lvo(this,this.player,this.fX);
            var Q = (Q = BCS()) ? Q.currentTime : 0;
            const c = eA() ? new d1W : null;
            Q == 0 && c && (Q = b$(f1(c)));
            Q !== 0 && this.kx(Q);
            tX4(this, this.GU, this.GU);
            this.player.Eu(6)
        }
        unload() {
            this.player.publish("mdxautoplaycanceled");
            this.player.WF();
            this.qp = this.Hp;
            g.xE(this.c5, this.fX);
            this.fX = this.BI = this.c5 = null;
            super.unload();
            this.player.Eu(5);
            Nv(this)
        }
        WA() {
            g.cm(this.subscriptions);
            super.WA()
        }
        getAdState() {
            return this.Aj
        }
        hasPrevious() {
            return this.fX ? f1(this.fX).hasPrevious : !1
        }
        hasNext() {
            return this.fX ? f1(this.fX).hasNext : !1
        }
        kx(Q, c) {
            this.LJ = Q || 0;
            this.player.publish("progresssync", Q, c);
            g.tV(this.player, "onVideoProgress", Q || 0)
        }
        getCurrentTime() {
            return this.LJ
        }
        getDuration() {
            return f1(this.fX).getDuration() || 0
        }
        Kk() {
            var Q = f1(this.fX);
            return Q.j ? Q.W + L1(Q) : Q.W
        }
        A6() {
            return f1(this.fX).loadedTime
        }
        qE() {
            return aaD(f1(this.fX))
        }
        v4() {
            var Q = f1(this.fX);
            return Q.O > 0 ? Q.O + L1(Q) : Q.O
        }
        getProgressState() {
            const Q = f1(this.fX)
              , c = this.player.getVideoData();
            return {
                airingStart: 0,
                airingEnd: 0,
                allowSeeking: Q.playerState != 1081 && this.player.VY(),
                clipEnd: c.clipEnd,
                clipStart: c.clipStart,
                current: this.getCurrentTime(),
                displayedStart: -1,
                duration: this.getDuration(),
                ingestionTime: this.Kk(),
                isAtLiveHead: this.isAtLiveHead(),
                loaded: this.A6(),
                seekableEnd: this.qE(),
                seekableStart: this.v4(),
                offset: 0,
                viewerLivestreamJoinMediaTime: 0
            }
        }
        isAtLiveHead() {
            return aaD(f1(this.fX)) - this.getCurrentTime() <= 1
        }
        nextVideo() {
            this.fX && this.fX.nextVideo()
        }
        Ye() {
            this.fX && this.fX.Ye()
        }
        hP(Q) {
            Q === 1 && (this.Hv = this.fX ? f1(this.fX) : null)
        }
        lm() {
            var Q = eA() ? new d1W : null;
            if (Q) {
                const c = this.qp;
                this.loaded && this.unload();
                this.fX = Q;
                this.Hv = null;
                c.key !== this.Hp.key && (this.qp = c,
                this.load())
            } else
                g.BN(this.fX),
                this.fX = null,
                this.loaded && (this.unload(),
                (Q = this.Hv) && Q.videoId === this.player.getVideoData().videoId && this.player.cueVideoById(Q.videoId, b$(Q)));
            this.player.publish("videodatachange", "newdata", this.player.getVideoData(), 3)
        }
        G6() {
            var Q = [this.Hp]
              , c = Q.concat;
            const W = Xxm();
            yQ() && g.UM("yt-remote-cast-available") && W.push({
                key: "cast-selector-receiver",
                name: "Cast..."
            });
            this.Bk = c.call(Q, W);
            Q = r6() || this.Hp;
            iJ(this, Q);
            g.tV(this.player, "onMdxReceiversChange")
        }
        JW() {
            const Q = r6();
            iJ(this, Q)
        }
        Hh() {
            this.qp = r6()
        }
        Xj() {
            this.Nd = !0;
            Nv(this);
            Ba = !1;
            Uk && X9(Uk, 1);
            Uk = null
        }
        Dy() {
            this.Nd = !1;
            Nv(this);
            iJ(this, this.Hp);
            this.qp = this.Hp;
            Ba = !1;
            Uk = null;
            this.player.playVideo()
        }
        aI(Q, c) {
            switch (Q) {
            case "casting":
                return this.loaded;
            case "receivers":
                return this.Bk;
            case "currentReceiver":
                return c && (c.key === "cast-selector-receiver" ? F2() : iJ(this, c)),
                this.loaded ? this.qp : this.Hp;
            case "quickCast":
                return this.Bk.length === 2 && this.Bk[1].key === "cast-selector-receiver" ? (c && F2(),
                !0) : !1
            }
        }
        Sz() {
            this.fX.Sz()
        }
        GS() {
            return !1
        }
        getOptions() {
            return ["casting", "receivers", "currentReceiver", "quickCast"]
        }
        isLoggedIn() {
            return g.v("PLAYER_CONFIG")?.args?.authuser !== void 0 ? !0 : !(!g.v("SESSION_INDEX") && !g.v("LOGGED_IN"))
        }
    }
    );
}
)(_yt_player);
