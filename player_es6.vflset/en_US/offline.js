(function(g) {
    var window = this;
    'use strict';
    var aj = function(Q, c, W) {
        c = c.map(m => g.WI(Q, m, W));
        return g.P8.all(c)
    }
      , GI = function(Q, c) {
        return g.cF(Q.W.objectStore("EntityStore").index("entityType"), {
            query: IDBKeyRange.only(c)
        }, W => g.P8.all([W.delete(), g.QJ(Q, W.cursor.primaryKey)]).then( () => {
            g.cI(Q, W.cursor.primaryKey, c);
            return g.Qb(W)
        }
        ))
    }
      , YSa = function(Q, c, W, m) {
        const K = g.R8(Q.O, 1);
        return g.Yf(Q, c, m).then(T => {
            if (T || g.P("web_enable_entity_upsert_on_update")) {
                T = g.Pu(T || {}, W);
                var r = {
                    key: c,
                    entityType: m,
                    data: g.MaO(K, T, c),
                    version: 1
                };
                return g.P8.all([Q.W.objectStore("EntityStore").put(r), g.Y7X(Q, T, m)])
            }
        }
        ).then( () => {
            g.cI(Q, c, m);
            return c
        }
        )
    }
      , pki = function(Q, c) {
        return g.Kr(Q, {
            mode: "readwrite",
            g3: !0
        }, W => aj(W, c, "offlineOrchestrationActionWrapperEntity"))
    }
      , Qka = function(Q) {
        return g.Kr(Q, {
            mode: "readwrite",
            g3: !0
        }, c => GI(c, "videoPlaybackPositionEntity"))
    }
      , $a = function(Q, c, W) {
        return g.Kr(Q, {
            mode: "readonly",
            g3: !0
        }, m => g.Yf(m, c, W))
    }
      , cF9 = function(Q) {
        const c = new g.$5("und",new g.Br("Default","und",!0));
        c.captionTracks = Q.captionTracks;
        return c
    }
      , WgW = function(Q) {
        return new g.RF(function(c, W) {
            let m = Q.length;
            const K = [];
            if (m) {
                var T = function(I, X) {
                    m--;
                    K[I] = X;
                    m == 0 && c(K)
                }
                  , r = function(I) {
                    W(I)
                };
                for (let I = 0; I < Q.length; I++) {
                    var U = Q[I];
                    g.KO(U, g.sO(T, I), r)
                }
            } else
                c(K)
        }
        )
    }
      , mNZ = function({type: Q, payload: c}) {
        Q = {
            type: Q
        };
        c !== void 0 && (Q.payload = c);
        return Q
    }
      , PK = function(Q) {
        return g.m7((0,
        g.RVm)(), Q)
    }
      , KgD = function(Q) {
        Q = Q.options?.persistenceOption;
        return Q === "ENTITY_PERSISTENCE_OPTION_PERSIST" || Q === "ENTITY_PERSISTENCE_OPTION_INMEMORY_AND_PERSIST"
    }
      , Tsm = async function(Q) {
        const c = await g.Iz();
        c && await g.Kr(c, "readwrite", W => {
            const m = {};
            for (const K of Q) {
                if (!K.entityKey || !KgD(K))
                    continue;
                const T = g.bD(K.payload);
                let r = void 0;
                K.type === "ENTITY_MUTATION_TYPE_REPLACE" && (r = () => g.WI(W, K.payload[T], T));
                K.type === "ENTITY_MUTATION_TYPE_DELETE" && (r = () => g.mh(W, K.entityKey));
                K.type === "ENTITY_MUTATION_TYPE_UPDATE" && (r = () => YSa(W, K.entityKey, K.payload[T], T));
                r && (m[K.entityKey] = m[K.entityKey] ? m[K.entityKey].then(r) : r())
            }
            return g.P8.all(Object.values(m))
        }
        )
    }
      , lT = async function(Q) {
        !(Q = Q.mutations) || Q.length <= 0 || (g.ib && g.ib.dispatch(mNZ({
            type: "ENTITY_LOADED",
            payload: Q
        })),
        await Tsm(Q),
        Q.length = 0)
    }
      , o8D = function(Q) {
        return Q !== void 0
    }
      , rFm = function(Q) {
        var c = g.W4();
        c = Object.assign({}, c);
        Q = Object.assign({}, Q);
        for (const W in c)
            Q[W] ? (c[W] !== 4 && (c[W] = Q[W]),
            delete Q[W]) : c[W] !== 2 && (c[W] = 4);
        Object.assign(c, Q);
        g.MKn(c);
        JSON.stringify(c);
        return c
    }
      , UNi = async function(Q) {
        const c = await g.AD();
        return c ? g.MD(await g.T3(c), ["index", "media", "captions"], {
            mode: "readwrite",
            g3: !0
        }, W => {
            const m = IDBKeyRange.bound(Q + "|", Q + "~");
            W = [W.objectStore("index").delete(m), W.objectStore("media").delete(m), W.objectStore("captions").delete(m)];
            return g.P8.all(W).then( () => {}
            )
        }
        ) : void 0
    }
      , I9W = async function() {
        const Q = await g.AD();
        if (!Q)
            throw g.$s("rvdfd");
        return g.MD(await g.T3(Q), ["index", "media"], {
            mode: "readwrite",
            g3: !0
        }, c => {
            const W = {};
            return g.pg(c.objectStore("index"), {}, m => {
                var K = m.cursor.key.match(/^([\w\-_]+)\|(a|v)$/);
                let T = g.P8.resolve(void 0);
                if (K) {
                    const r = K[1];
                    K = K[2];
                    W[r] = W[r] || {};
                    W[r][K] = g.Y53(m.getValue()?.fmts)
                } else
                    T = m.delete().then( () => {}
                    );
                return g.P8.all([g.Qb(m), T]).then( ([r]) => r)
            }
            ).then( () => {
                const m = {};
                for (const T of Object.keys(W)) {
                    const r = W[T].v;
                    m[T] = W[T].a && r ? 1 : 2
                }
                const K = rFm(m);
                return g.acW(c.objectStore("media"), {}, T => {
                    const r = T.cursor.key.match(g.Wdy);
                    r && m[r[1]] || c.objectStore("media").delete(T.cursor.key);
                    return g.L43(T)
                }
                ).then( () => K)
            }
            )
        }
        )
    }
      , Xha = async function(Q, c) {
        var W = await g.AD();
        if (!W)
            throw g.$s("wct");
        W = await g.T3(W);
        await g.MD(W, ["captions"], {
            mode: "readwrite",
            g3: !0
        }, m => {
            const K = [];
            m = m.objectStore("captions");
            for (let T = 0; T < c.length; T++) {
                const r = m.put(c[T], Q + "|" + c[T].metadata.vss_id);
                K.push(r)
            }
            return g.P8.all(K)
        }
        )
    }
      , AF9 = async function(Q) {
        Q = IDBKeyRange.bound(Q + "|", Q + "~");
        const c = await g.AD();
        if (!c)
            throw g.$s("gactfv");
        return (await g.T3(c)).getAll("captions", Q)
    }
      , eJi = async function(Q) {
        g.Kl(Q, 0);
        return UNi(Q)
    }
      , Vbi = function(Q) {
        return {
            context: g.Oh(),
            videoIds: Q
        }
    }
      , Bsm = function(Q) {
        return {
            context: g.Oh(),
            playlistIds: Q
        }
    }
      , xNm = function(Q) {
        return {
            context: g.Oh(),
            offlinePlaylistSyncChecks: Q
        }
    }
      , n8W = function() {
        uT || (uT = new qJW);
        return uT
    }
      , DNS = function(Q, c) {
        return {
            eventType: {
                flowEventNamespace: "FLOW_EVENT_NAMESPACE_OFFLINE_ORCHESTRATION",
                flowEventType: Q
            },
            metadata: c,
            statusCode: void 0,
            csn: void 0,
            can: void 0
        }
    }
      , tb9 = function(Q, c, W) {
        W || (W = Q.W.get("FLOW_TYPE_OFFLINE_ORCHESTRATION"),
        W || (W = g.Ab(16),
        Q.W.set("FLOW_TYPE_OFFLINE_ORCHESTRATION", W)));
        Q = {
            flowNonce: W,
            flowType: "FLOW_TYPE_OFFLINE_ORCHESTRATION",
            flowEventType: c.eventType
        };
        c.metadata && (Q.flowMetadata = c.metadata);
        c.statusCode !== void 0 && (Q.flowEventStatus = c.statusCode);
        c.csn && (Q.csn = c.csn);
        c.can && (Q.can = c.can);
        g.eG("flowEvent", Q, void 0)
    }
      , HjH = async function(Q) {
        var c = await g.Kr(Q, {
            mode: "readonly",
            g3: !0
        }, B => g.po(B, "playbackData").then(n => {
            var S = n.map(f => f.transfer).filter(f => !!f)
              , d = n.map(f => f.offlineVideoPolicy).filter(f => !!f)
              , b = n.filter(f => !!f.key).map(f => g.bX(g.w1(f.key).entityId, "downloadStatusEntity"));
            S = g.po(B, "transfer", S);
            d = g.po(B, "offlineVideoPolicy", d);
            b = g.po(B, "downloadStatusEntity", b);
            const w = S.then(f => {
                f = f.reduce( (G, T7) => {
                    T7?.offlineVideoStreams && G.push(...T7.offlineVideoStreams);
                    return G
                }
                , []).filter(G => !!G);
                return g.po(B, "offlineVideoStreams", f)
            }
            );
            return g.P8.all([S, d, w, b]).then( ([f,G,T7,oW]) => [n, f, G, T7, oW])
        }
        ));
        Q = await g.Kr(Q, {
            mode: "readonly",
            g3: !0
        }, B => g.po(B, "mainDownloadsListEntity").then(n => n[0]?.downloads ?? []));
        const [W,m,K,T,r] = c
          , U = {}
          , I = {}
          , X = {}
          , A = {}
          , e = {};
        c = [];
        for (var V of m)
            V && (U[V.key] = V);
        for (const B of K)
            B && (I[B.key] = B);
        for (const B of r)
            B && (X[B.key] = B);
        for (const B of T)
            B && (A[B.key] = B);
        for (const B of Q)
            e[B.videoItem ?? ""] = !0,
            B.videoItem && (V = g.w1(B.videoItem)?.entityId ?? "",
            c.push({
                externalVideoId: V
            }));
        return {
            offlineVideos: W.filter(B => {
                if (!B || !B.key || !B.offlineVideoPolicy)
                    return !1;
                B = g.w1(B.key).entityId;
                B = g.bX(B, "downloadStatusEntity");
                return !(B && X[B]?.downloadState === "DOWNLOAD_STATE_USER_DELETED")
            }
            ).map(B => {
                var n = U[B.transfer];
                const S = [];
                if (n?.offlineVideoStreams)
                    for (var d of n.offlineVideoStreams) {
                        var b = A[d];
                        b && S.push(b)
                    }
                d = I[B.offlineVideoPolicy];
                b = B?.playerResponseTimestamp;
                var w = g.w1(d.key).entityId;
                B = g.bX(w, "mainVideoEntity");
                if (d.action === "OFFLINE_VIDEO_POLICY_ACTION_DISABLE") {
                    var f = "OFFLINE_VIDEO_STATE_DISABLED";
                    d.expirationTimestamp && Number(d.expirationTimestamp) < Date.now() / 1E3 && (f = "OFFLINE_VIDEO_STATE_EXPIRED")
                } else if (d.action === "OFFLINE_VIDEO_POLICY_ACTION_DOWNLOAD_FAILED")
                    f = "OFFLINE_VIDEO_STATE_OFFLINE_FAILED";
                else {
                    switch (n?.transferState) {
                    case "TRANSFER_STATE_TRANSFER_IN_QUEUE":
                        f = "OFFLINE_VIDEO_STATE_PENDING";
                        break;
                    case "TRANSFER_STATE_TRANSFERRING":
                        f = "OFFLINE_VIDEO_STATE_TRANSFERRING";
                        break;
                    case "TRANSFER_STATE_PAUSED_BY_USER":
                        f = "OFFLINE_VIDEO_STATE_PAUSED_TRANSFER";
                        break;
                    case "TRANSFER_STATE_FAILED":
                        f = "OFFLINE_VIDEO_STATE_OFFLINE_FAILED";
                        break;
                    case "TRANSFER_STATE_COMPLETE":
                        f = "OFFLINE_VIDEO_STATE_PLAYABLE";
                        break;
                    case "TRANSFER_STATE_WAITING_FOR_PLAYER_RESPONSE_REFRESH":
                        f = "OFFLINE_VIDEO_STATE_STREAMS_OUT_OF_DATE";
                        break;
                    default:
                        f = "OFFLINE_VIDEO_STATE_UNKNOWN"
                    }
                    if (f === "OFFLINE_VIDEO_STATE_OFFLINE_FAILED")
                        switch (n?.failureReason) {
                        case "TRANSFER_FAILURE_REASON_EXTERNAL_FILESYSTEM_WRITE":
                        case "TRANSFER_FAILURE_REASON_FILESYSTEM_WRITE":
                            f = "OFFLINE_VIDEO_STATE_OUT_OF_STORAGE_ERROR";
                            break;
                        case "TRANSFER_FAILURE_REASON_STREAM_MISSING":
                            f = "OFFLINE_VIDEO_STATE_STREAMS_MISSING";
                            break;
                        case "TRANSFER_FAILURE_REASON_NETWORK":
                        case "TRANSFER_FAILURE_REASON_NETWORK_LOST":
                            f = "OFFLINE_VIDEO_STATE_NETWORK_ERROR"
                        }
                }
                w = {
                    id: w,
                    videoState: f
                };
                n?.cotn && (w.cotn = n.cotn);
                n?.maximumDownloadQuality && (w.selectedVideoQuality = n?.maximumDownloadQuality);
                n?.lastProgressTimeMs && (w.lastProgressTimeMs = n.lastProgressTimeMs);
                b && (w.playerResponseSavedTimeMs = String(Number(b) * 1E3));
                n = String;
                b = 0;
                for (const G of S)
                    if (G.streamsProgress)
                        for (const T7 of G.streamsProgress)
                            b += Number(T7.numBytesDownloaded ?? 0);
                w.downloadedBytes = n(b);
                w.selectedOfflineMode = e[B] ? "OFFLINE_MODE_TYPE_AUTO_OFFLINE" : "OFFLINE_NOW";
                d.action === "OFFLINE_VIDEO_POLICY_ACTION_DISABLE" && (w.offlinePlaybackDisabledReason = d.offlinePlaybackDisabledReason);
                return w
            }
            ),
            additionalOfflineClientState: {
                mainAppAdditionalOfflineClientState: {
                    smartDownloadVideos: c
                }
            }
        }
    }
      , ij0 = function() {
        try {
            let W = g.DR("ytglobal.locks_");
            if (W)
                return W;
            var Q;
            if (Q = navigator) {
                var c = navigator;
                Q = "locks"in c && !!c.locks
            }
            if (Q)
                return g.qX.localStorage && g.qX.localStorage.getItem("noop"),
                W = new Nsa,
                g.n7("ytglobal.locks_", W),
                W
        } catch {}
    }
      , hX = function(Q) {
        if (Q.includes(":"))
            throw Error(`Invalid user cache name: ${Q}`);
        return `${Q}:${g.Dk("CacheStorage get")}`
    }
      , yF9 = async function() {
        return zI !== void 0 ? zI : zI = new Promise(async Q => {
            try {
                await CB.open("test-only"),
                await CB.delete("test-only")
            } catch (c) {
                if (c instanceof Error && c.name === "SecurityError") {
                    Q(!1);
                    return
                }
            }
            Q("caches"in window)
        }
        )
    }
      , JX = async function() {
        if (await yF9())
            return Mk || (Mk = new SJ9),
            Mk
    }
      , Rj = function(Q, c, W) {
        g.Ty(new g.H8(`Woffle: ${Q}`,W ? {
            cotn: W
        } : ""));
        c instanceof Error && g.Ty(c)
    }
      , Fga = async function(Q) {
        Q = await HjH(Q);
        g.eG("offlineStateSnapshot", Q)
    }
      , ka = function(Q, c) {
        g.xt(Q.api, "onOfflineOperationFailure", c);
        Q.W?.postMessage(c)
    }
      , Zji = function(Q) {
        if (!Q.A && !Q.W) {
            var c = ij0();
            if (c) {
                Q.A = !0;
                var W = g.Dk("OfflineLockManager");
                c.request(`woffle_orchestration_leader:${W}`, {}, async () => {
                    try {
                        Q.O = new g.id,
                        Q.W = !0,
                        Q.A = !1,
                        await Q.L(),
                        await Q.O.promise
                    } catch (m) {
                        Q.j_(),
                        m instanceof Error && (m.args = [{
                            name: "WoLockManagerError",
                            h5: m.name
                        }],
                        g.Zf(m))
                    }
                }
                )
            }
        }
    }
      , Ya = function(Q) {
        Q.J && Q.D && Q.K && Q.visibility.isBackground() ? Q.j.cw(6E4) : Q.j.stop()
    }
      , E8a = function(Q) {
        Q.W && (Q.K = !0,
        Ya(Q))
    }
      , skv = function(Q, c) {
        Q.W && (Q.D = c,
        Ya(Q))
    }
      , dNi = function(Q, c) {
        Q.W && (Q.J = c,
        Ya(Q))
    }
      , pB = function(Q) {
        Q.offlineDeleteReason = Q.offlineDeleteReason ?? "OFFLINE_DELETE_REASON_UNKNOWN";
        Q.offlineModeType = Q.offlineModeType ?? "OFFLINE_NOW";
        g.eG("offlineDeleteEvent", Q)
    }
      , Q8 = function(Q, {videoId: c, o_: W, offlineModeType: m}) {
        Q.encryptedVideoId = c;
        Q.cotn = W?.cotn;
        Q.offlineabilityFormatType = W?.maximumDownloadQuality;
        Q.isRefresh = W?.isRefresh ?? !1;
        Q.softErrorCount = W?.transferRetryCount ?? 0;
        Q.offlineModeType = m ?? "OFFLINE_NOW";
        (Q.transferStatusType === "TRANSFER_STATUS_TYPE_UNKNOWN" && Q.statusType === "UNKNOWN_STATUS_TYPE" || !Q.transferStatusType && !Q.statusType) && g.Ty(Error("Woffle unknown transfer status"));
        g.eG("offlineTransferStatusChanged", Q)
    }
      , Lgv = function(Q, c, W, m) {
        m = {
            transferStatusType: "TRANSFER_STATUS_TYPE_PROCESSING",
            statusType: "OFFLINING_STARTED",
            transferFirstStarted: !!m
        };
        c && W && (c = Math.floor(c / 1024).toFixed(),
        W = Math.floor(W / 1024).toFixed(),
        m.alreadyDownloadedKbytes = c,
        m.totalFetchedKbytes = c,
        m.totalContentKbytes = W);
        Q8(m, Q)
    }
      , wh4 = function(Q) {
        Q8({
            transferStatusType: "TRANSFER_STATUS_TYPE_DEQUEUED_BY_USER_PAUSE",
            statusType: "SUSPENDED"
        }, Q)
    }
      , bjZ = function(Q) {
        switch (Q) {
        case "TRANSFER_FAILURE_REASON_FILESYSTEM_WRITE":
        case "TRANSFER_FAILURE_REASON_EXTERNAL_FILESYSTEM_WRITE":
            return "OFFLINE_DATABASE_ERROR";
        case "TRANSFER_FAILURE_REASON_PLAYABILITY":
            return "NOT_PLAYABLE";
        case "TRANSFER_FAILURE_REASON_TOO_MANY_RETRIES":
            return "TOO_MANY_RETRIES";
        case "TRANSFER_FAILURE_REASON_INTERNAL":
            return "OFFLINE_DOWNLOAD_CONTROLLER_ERROR";
        case "TRANSFER_FAILURE_REASON_STREAM_MISSING":
            return "STREAM_VERIFICATION_FAILED";
        case "TRANSFER_FAILURE_REASON_SERVER":
        case "TRANSFER_FAILURE_REASON_SERVER_PROPERTY_MISSING":
            return "OFFLINE_REQUEST_FAILURE";
        case "TRANSFER_FAILURE_REASON_NETWORK":
            return "OFFLINE_NETWORK_ERROR";
        default:
            return "UNKNOWN_FAILURE_REASON"
        }
    }
      , cQ = function(Q) {
        return (Q.actionMetadata?.retryScheduleIntervalsInSeconds?.length ?? 0) > 0
    }
      , WQ = function(Q) {
        return Q.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD" && !!Q.entityKey
    }
      , mJ = function(Q) {
        return Q.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH" && !!Q.entityKey
    }
      , K5 = function(Q) {
        return Q.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE" && !!Q.entityKey
    }
      , jki = function(Q) {
        return Q.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_UPDATE" && !!Q.entityKey
    }
      , TB = async function(Q, c, W, m, K=!1) {
        const T = g.bX(Q, c)
          , r = g.bX(Q, "downloadStatusEntity");
        Q = await g.Kr(W, {
            mode: "readonly",
            g3: !0
        }, I => g.P8.all([g.Yf(I, T, c), g.Yf(I, r, "downloadStatusEntity")]));
        const U = Q.length ? Q[0] : void 0;
        if (U) {
            let I = Q.length > 1 ? Q[1] : void 0;
            if (I) {
                if (I.downloadState === "DOWNLOAD_STATE_USER_DELETED" && !K)
                    return;
                I.downloadState = m
            } else
                I = {
                    key: r,
                    downloadState: m
                };
            g.OE(U, g84, I);
            await g.Kr(W, {
                mode: "readwrite",
                g3: !0
            }, X => g.P8.all([g.WI(X, U, c), g.WI(X, I, "downloadStatusEntity")]))
        }
    }
      , or = function(Q, c) {
        return Q.actionType === c.actionType && Q.entityKey === c.entityKey
    }
      , rJ = function(Q, c) {
        if (Q && Q.transferState !== "TRANSFER_STATE_COMPLETE" && Q.transferState !== "TRANSFER_STATE_FAILED") {
            const W = g.w1(Q.key).entityId;
            Q8({
                transferStatusType: "TRANSFER_STATUS_TYPE_TERMINATED_BY_USER",
                statusType: "CANCELLED"
            }, {
                videoId: W,
                o_: Q,
                offlineModeType: c
            })
        }
    }
      , UY = function(Q) {
        if (!Q || !Q.thumbnails)
            return [];
        const c = [];
        for (const W of Q.thumbnails)
            W.url && c.push(W.url);
        return c
    }
      , Ir = async function(Q, c, W=[]) {
        if (!W.length)
            return [];
        c = await g.rx(Q, c);
        Q = new Set;
        for (var m of c)
            if (c = m.id || m.key)
                c = g.w1(c).entityId,
                Q.add(c);
        m = [];
        for (const K of W)
            W = K.offlineVideoData,
            W?.videoId && !Q.has(W.videoId) && m.push(K);
        return m
    }
      , Xa = function(Q, c, W) {
        return new g.Od(Q,{
            cotn: c,
            raw_player_response: W,
            download_media: !0,
            start: Infinity,
            disable_watch_next: !0
        })
    }
      , Aa = function() {
        return {
            priority: 1,
            retryScheduleIntervalsInSeconds: [1, 2, 4]
        }
    }
      , V8 = function(Q) {
        if (!Q.key)
            throw Error("Entity key is required.");
        if (!Q.actionProto)
            throw Error("OfflineOrchestrationAction is required.");
        const c = g.w1(Q.key)
          , W = g.w1(Q.actionProto.entityKey);
        return new es(W.entityType,c.entityId,Q.actionProto,Q.parentActionId,Q.rootActionId,Q.childActionIds,Q.prereqActionId,Q.postreqActionIds,Q.retryScheduleIndex,Q.hasChildActionFailed,Number(Q.enqueueTimeSec) * 1E3)
    }
      , BQ = function(Q) {
        return {
            key: g.bX(Q.actionId, "offlineOrchestrationActionWrapperEntity"),
            actionProto: Q.action,
            parentActionId: Q.parentActionId,
            rootActionId: Q.rootActionId,
            childActionIds: Q.childActionIds,
            prereqActionId: Q.prereqActionId,
            postreqActionIds: Q.postreqActionIds,
            retryScheduleIndex: Q.retryScheduleIndex,
            hasChildActionFailed: Q.hasChildActionFailed,
            enqueueTimeSec: (Q.W / 1E3).toFixed()
        }
    }
      , OjH = async function() {
        const Q = await JX();
        return Q ? Q.delete("yt-player-local-img") : !0
    }
      , xL = async function(Q) {
        const c = await JX();
        if (!c)
            throw Error("Cache API not supported");
        if (Q.length) {
            var W = await c.open("yt-player-local-img");
            await Promise.all(Q.map(m => W.delete(m)))
        }
    }
      , qU = async function(Q) {
        const c = await JX();
        if (!c)
            throw Error("Cache API not supported");
        Q.length && await (await c.open("yt-player-local-img")).addAll(Q)
    }
      , n5 = async function(Q, c, W, m, K) {
        const T = g.bX(Q, "mainVideoEntity")
          , r = g.bX(Q, "ytMainChannelEntity")
          , U = g.bX(Q, "transfer")
          , I = g.bX(Q, "videoDownloadContextEntity");
        var X = await g.Kr(c, {
            mode: "readonly",
            g3: !0
        }, f => g.P8.all([g.Yf(f, T, "mainVideoEntity"), g.Yf(f, r, "ytMainChannelEntity"), g.Yf(f, U, "transfer"), g.Yf(f, I, "videoDownloadContextEntity"), g.po(f, "ytMainChannelEntity"), g.po(f, "offlineOrchestrationActionWrapperEntity")]));
        const [A,e,V,B,n,S] = X;
        if (A || e) {
            X = A ? UY(A.thumbnail) : [];
            var d = e ? await f9H(e, n) : [];
            await xL(X.concat(d))
        }
        const b = []
          , w = g.bX(Q, "downloadStatusEntity");
        for (const f of S)
            X = g.w1(f.key).entityId,
            d = V8(f),
            d = g.w1(d.action.entityKey).entityId,
            X !== Q && d !== Q || or(W, f.actionProto) || b.push(f.key);
        await g.Kr(c, {
            mode: "readwrite",
            g3: !0
        }, f => {
            const G = b.map(T7 => g.mh(f, T7));
            G.push(g.mh(f, T, {
                dt: !0
            }));
            G.push(g.mh(f, w, {
                dt: !0
            }));
            return g.P8.all(G)
        }
        );
        Q = B?.offlineModeType;
        K && (pB(K),
        K.offlineModeType && (Q = K.offlineModeType));
        rJ(V, Q);
        ka(m, {
            entityKey: T,
            failureReason: "OFFLINE_OPERATION_FAILURE_REASON_VIDEO_DELETED"
        })
    }
      , Ds = async function(Q, c, W, m) {
        const K = g.bX(Q, "mainPlaylistEntity")
          , T = g.bX(Q, "ytMainChannelEntity");
        var r = await g.Kr(c, {
            mode: "readonly",
            g3: !0
        }, f => g.P8.all([g.Yf(f, K, "mainPlaylistEntity"), g.Yf(f, T, "ytMainChannelEntity"), g.po(f, "mainPlaylistEntity"), g.po(f, "mainDownloadsListEntity"), g.po(f, "ytMainChannelEntity"), g.po(f, "offlineOrchestrationActionWrapperEntity")]));
        const [U,I,X,A,e,V] = r;
        if (U || I) {
            r = U ? v89(U) : [];
            var B = I ? await f9H(I, e) : [];
            await xL(r.concat(B))
        }
        r = [];
        B = new Map;
        if (U) {
            r = await a9Z(U, X, A);
            for (var n of r)
                B.set(n, {
                    videoId: n,
                    playlistId: Q,
                    offlineDeleteReason: "OFFLINE_DELETE_REASON_PARENT_LIST_DELETE"
                });
            n = await g.Kr(c, {
                mode: "readonly",
                g3: !0
            }, T7 => g.P8.all([g.po(T7, "transfer"), g.po(T7, "videoDownloadContextEntity")]));
            const [f,G] = n;
            for (var S of f)
                n = g.w1(S.key).entityId,
                (n = B.get(n)) && S && (n.cotn = S.cotn);
            for (var d of G)
                S = g.w1(d.key).entityId,
                (S = B.get(S)) && d && (S.offlineModeType = d.offlineModeType)
        }
        const b = [];
        for (const f of V)
            d = g.w1(f.key).entityId,
            S = V8(f),
            d !== Q && S.rootActionId !== Q || or(W, f.actionProto) || b.push(f.key);
        const w = g.bX(Q, "mainPlaylistEntity");
        await g.Kr(c, {
            mode: "readwrite",
            g3: !0
        }, f => {
            const G = b.map(T7 => g.mh(f, T7));
            G.push(g.mh(f, w, {
                dt: !0
            }));
            return g.P8.all(G)
        }
        );
        if (U && (r.reverse(),
        r))
            for (const f of r)
                await n5(f, c, W, m, B.get(f))
    }
      , ta = async function(Q, c, W, m) {
        const K = g.bX("DOWNLOADS_LIST_ENTITY_ID_MANUAL_DOWNLOADS", "mainDownloadsListEntity")
          , T = new Map;
        Q = await g.Kr(Q, {
            mode: "readwrite",
            g3: !0
        }, r => {
            const U = g.po(r, "transfer")
              , I = g.po(r, "offlineOrchestrationActionWrapperEntity")
              , X = g.po(r, "videoDownloadContextEntity")
              , A = g.Yf(r, K, "mainDownloadsListEntity");
            return g.P8.all([U, I, X, A]).then( ([e,V,B,n]) => {
                const S = Gd9.map(d => GI(r, d));
                for (const d of V)
                    or(c, d.actionProto) || S.push(g.mh(r, d.key, {
                        dt: !0
                    }));
                n && (n.downloads = [],
                S.push(g.WI(r, n, "mainDownloadsListEntity")));
                if (B)
                    for (const d of B)
                        V = g.w1(d.key).entityId,
                        V = g.bX(V, "transfer"),
                        T.set(V, d.offlineModeType);
                return g.P8.all(S).then( () => e)
            }
            )
        }
        );
        for (const r of Q) {
            rJ(r, T.get(r.key));
            Q = g.w1(r.key).entityId;
            const U = {
                videoId: Q,
                offlineDeleteReason: m,
                cotn: r.cotn,
                offlineModeType: T.get(r.key)
            };
            pB(U);
            Q = g.bX(Q, "mainVideoEntity");
            ka(W, {
                entityKey: Q,
                failureReason: "OFFLINE_OPERATION_FAILURE_REASON_VIDEO_DELETED"
            })
        }
        await OjH()
    }
      , v89 = function(Q, c) {
        let W = [];
        if (Q.thumbnailStyleData)
            for (const m of Q.thumbnailStyleData)
                W = W.concat(UY(m?.value?.collageThumbnail?.coverThumbnail));
        Q = UY(c);
        return W.concat(Q)
    }
      , a9Z = async function(Q, c, W) {
        const m = []
          , K = new Set;
        if (W.length)
            for (var T of W)
                if (T.downloads?.length)
                    for (const r of T.downloads)
                        r.videoItem && (W = g.w1(r.videoItem).entityId,
                        K.add(W));
        if (Q.videos) {
            for (const r of Q.videos)
                T = JSON.parse(g.w1(r).entityId),
                T.videoId && !K.has(T.videoId) && m.push(T.videoId);
            for (const r of c)
                if (r.key !== Q.key && (c = r.videos))
                    for (const U of c)
                        c = JSON.parse(g.w1(U).entityId),
                        c.videoId && (c = m.indexOf(c.videoId),
                        c !== -1 && m.splice(c, 1))
        }
        return m
    }
      , f9H = async function(Q, c) {
        const W = UY(Q.avatar);
        for (const m of c)
            if (m.id !== Q.id)
                for (const K of UY(m.avatar))
                    c = W.indexOf(K),
                    c !== -1 && W.splice(c, 1);
        return W
    }
      , $N1 = async function(Q) {
        const c = g.l(Q.frameworkUpdates, HQ);
        Q.frameworkUpdates && c && await lT(c)
    }
      , uSm = function(Q) {
        if (Q.onResponseReceivedActions?.length && (Q = g.l(g.l(Q.onResponseReceivedActions[0], P_H), l99)?.actions,
        Q?.length))
            return Q
    }
      , hJm = async function(Q) {
        if (!Q)
            return [];
        Q = await $a(Q, g.xv, "mainDownloadsListEntity");
        return Q?.downloads?.length ? Q.downloads.map(c => c.videoItem ?? "") : []
    }
      , NU = async function(Q, c) {
        const W = await zJa(Q, c);
        W && await g.Kr(Q, {
            mode: "readwrite",
            g3: !0
        }, m => {
            const K = [g.WI(m, W.mainDownloadsLibraryEntity, "mainDownloadsLibraryEntity")];
            W.mainDownloadsListEntity && K.push(g.WI(m, W.mainDownloadsListEntity, "mainDownloadsListEntity"));
            return g.P8.all(K)
        }
        )
    }
      , zJa = async function(Q, c) {
        const W = g.bX("main_downloads_library_id", "mainDownloadsLibraryEntity")
          , m = g.bX("DOWNLOADS_LIST_ENTITY_ID_MANUAL_DOWNLOADS", "mainDownloadsListEntity");
        Q = await g.Kr(Q, {
            mode: "readonly",
            g3: !0
        }, I => g.P8.all([g.Yf(I, W, "mainDownloadsLibraryEntity"), g.Yf(I, m, "mainDownloadsListEntity")]));
        let[K,T] = Q;
        Q = K;
        let r = T;
        Q || (Q = {
            id: W
        });
        for (const I of c)
            if (I === g.xv) {
                if (Q.smartDownloadsList)
                    return;
                Q.smartDownloadsList = I
            } else {
                var U = g.w1(I).entityType;
                c = {};
                U === "mainPlaylistEntity" ? c.playlistItem = I : U === "mainVideoEntity" && (c.videoItem = I);
                if (!g.P9(c)) {
                    if (r?.downloads) {
                        U = !1;
                        for (const X of r.downloads)
                            if (X.playlistItem === I || X.videoItem === I) {
                                U = !0;
                                break
                            }
                        U || r.downloads.push(c)
                    } else
                        r = {
                            id: m,
                            downloads: [c]
                        };
                    Q.downloadsList = m
                }
            }
        return {
            mainDownloadsLibraryEntity: Q,
            mainDownloadsListEntity: r
        }
    }
      , iq = async function(Q, c) {
        const W = g.bX("main_downloads_library_id", "mainDownloadsLibraryEntity")
          , m = g.bX("DOWNLOADS_LIST_ENTITY_ID_MANUAL_DOWNLOADS", "mainDownloadsListEntity");
        var K = await g.Kr(Q, {
            mode: "readonly",
            g3: !0
        }, I => g.P8.all([g.Yf(I, W, "mainDownloadsLibraryEntity"), g.Yf(I, m, "mainDownloadsListEntity"), g.Yf(I, g.xv, "mainDownloadsListEntity")]));
        const [T,r,U] = K;
        if (T) {
            if (c === g.xv && U?.downloads)
                U.downloads = [];
            else if (r?.downloads) {
                K = g.w1(c).entityType;
                for (let I = 0; I < r.downloads.length; I++) {
                    const X = r.downloads[I];
                    if (K === "mainVideoEntity" && X.videoItem === c) {
                        r.downloads.splice(I, 1);
                        break
                    } else if (K === "mainPlaylistEntity" && X.playlistItem === c) {
                        r.downloads.splice(I, 1);
                        break
                    }
                }
            }
            await g.Kr(Q, {
                mode: "readwrite",
                g3: !0
            }, I => {
                const X = [g.WI(I, T, "mainDownloadsLibraryEntity")];
                r && X.push(g.WI(I, r, "mainDownloadsListEntity"));
                U && X.push(g.WI(I, U, "mainDownloadsListEntity"));
                return g.P8.all(X)
            }
            )
        }
    }
      , y8 = async function(Q, c) {
        const W = g.bX(c, "transfer")
          , m = g.bX(c, "videoDownloadContextEntity");
        Q = await g.Kr(Q, {
            mode: "readonly",
            g3: !0
        }, r => g.P8.all([g.Yf(r, W, "transfer"), g.Yf(r, m, "videoDownloadContextEntity")]));
        const [K,T] = Q;
        return {
            videoId: c,
            cotn: K?.cotn,
            offlineModeType: T?.offlineModeType
        }
    }
      , Ss = async function(Q, c, W, m, K) {
        const T = g.bX(Q, "musicTrack")
          , r = g.bX(Q, "transfer");
        var U = await g.Kr(c, {
            mode: "readonly",
            g3: !0
        }, n => g.P8.all([g.Yf(n, T, "musicTrack"), g.Yf(n, r, "transfer"), g.po(n, "musicTrack"), g.po(n, "offlineOrchestrationActionWrapperEntity")]));
        const [I,X,A,e] = U;
        I && (U = await C_S(I, A),
        await xL(U));
        const V = [];
        for (const n of e) {
            U = g.w1(n.key).entityId;
            var B = V8(n);
            B = g.w1(B.action.entityKey).entityId;
            U !== Q && B !== Q || or(W, n.actionProto) || V.push(n.key)
        }
        await g.Kr(c, {
            mode: "readwrite",
            g3: !0
        }, n => {
            const S = V.map(d => g.mh(n, d));
            S.push(g.mh(n, T, {
                dt: !0
            }));
            return g.P8.all(S)
        }
        );
        rJ(X);
        K && pB(K);
        ka(m, {
            entityKey: T,
            failureReason: "OFFLINE_OPERATION_FAILURE_REASON_VIDEO_DELETED"
        })
    }
      , Fa = async function(Q, c, W, m, K) {
        const T = g.bX(Q, c)
          , r = g.bX("music_downloads_library_id", "musicDownloadsLibraryEntity");
        var U = await g.Kr(W, {
            mode: "readonly",
            g3: !0
        }, b => g.P8.all([g.Yf(b, T, c), g.Yf(b, r, "musicDownloadsLibraryEntity"), g.po(b, c), g.po(b, "offlineOrchestrationActionWrapperEntity")]));
        const [I,X,A,e] = U;
        I && (U = await C_S(I, A),
        await xL(U));
        let V = [];
        U = new Map;
        if (I) {
            V = await Mb4(I, A, X);
            for (var B of V) {
                const b = g.w1(B).entityId;
                U.set(b, {
                    videoId: b,
                    playlistId: Q,
                    offlineDeleteReason: "OFFLINE_DELETE_REASON_PARENT_LIST_DELETE"
                })
            }
            B = await g.rx(W, "transfer");
            for (var n of B)
                B = g.w1(n.key).entityId,
                (B = U.get(B)) && n && (B.cotn = n.cotn)
        }
        const S = [];
        for (const b of e)
            n = g.w1(b.key).entityId,
            B = V8(b),
            n !== Q && B.rootActionId !== Q || or(m, b.actionProto) || S.push(b.key);
        const d = g.bX(Q, c);
        await g.Kr(W, {
            mode: "readwrite",
            g3: !0
        }, b => {
            const w = S.map(f => g.mh(b, f));
            w.push(g.mh(b, d, {
                dt: !0
            }));
            return g.P8.all(w)
        }
        );
        if (I && (V.reverse(),
        V.length))
            for (const b of V)
                (Q = g.w1(b).entityId) && await Ss(Q, W, m, K, U.get(Q))
    }
      , Zs = async function(Q, c, W) {
        Q = await g.Kr(Q, {
            mode: "readwrite",
            g3: !0
        }, m => {
            const K = g.po(m, "transfer")
              , T = g.po(m, "offlineOrchestrationActionWrapperEntity");
            return g.P8.all([K, T]).then( ([r,U]) => {
                const I = JF9.map(X => GI(m, X));
                for (const X of U) {
                    U = g.w1(X.actionProto.entityKey).entityType === "musicTrack";
                    const A = X.actionProto.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD";
                    or(c, X.actionProto) || U && (!U || A) || I.push(g.mh(m, X.key, {
                        dt: !0
                    }))
                }
                return g.P8.all(I).then( () => r)
            }
            )
        }
        );
        for (const m of Q)
            rJ(m),
            Q = g.w1(m.key).entityId,
            pB({
                videoId: Q,
                offlineDeleteReason: void 0,
                cotn: m.cotn
            }),
            Q = g.bX(Q, "musicTrack"),
            ka(W, {
                entityKey: Q,
                failureReason: "OFFLINE_OPERATION_FAILURE_REASON_VIDEO_DELETED"
            });
        await OjH()
    }
      , RJ0 = function(Q) {
        let c;
        for (const W of Q.additionalMetadatas)
            W.offlineMusicVideoData && (c = W.offlineMusicVideoData);
        return {
            id: g.bX(Q.videoId, "musicTrack"),
            videoId: Q.videoId,
            title: Q.title,
            thumbnailDetails: Q.thumbnail,
            lengthMs: String(Number(Q.lengthSeconds) * 1E3),
            albumTitle: c?.releaseTitle,
            musicVideoType: c?.musicVideoType,
            contentRating: {
                explicitType: c?.explicitType
            },
            artistNames: c?.byline || c?.channelName,
            downloadMetadata: g.bX(Q.videoId, "musicTrackDownloadMetadataEntity")
        }
    }
      , Mb4 = async function(Q, c, W) {
        const m = []
          , K = new Set;
        if (W?.downloadedTracks?.length)
            for (const T of W.downloadedTracks)
                K.add(T);
        if (Q.tracks) {
            for (const T of Q.tracks)
                K.has(T) || m.push(T);
            for (const T of c)
                if (T.id !== Q.id && (c = T.tracks))
                    for (const r of c)
                        c = m.indexOf(r),
                        c !== -1 && m.splice(c, 1)
        }
        return m
    }
      , C_S = async function(Q, c) {
        const W = UY(Q.thumbnailDetails);
        for (const m of c)
            if (m.id !== Q.id)
                for (const K of UY(m.thumbnailDetails))
                    c = W.indexOf(K),
                    c !== -1 && W.splice(c, 1);
        return W
    }
      , EY = async function(Q, c) {
        var W = g.bX("music_downloads_library_id", "musicDownloadsLibraryEntity");
        let m = await $a(Q, W, "musicDownloadsLibraryEntity");
        m || (m = {
            id: W
        });
        W = g.w1(c).entityType;
        W === "musicTrack" ? m.downloadedTracks?.includes(c) || (m.downloadedTracks = (m.downloadedTracks ?? []).concat(c)) : W === "musicPlaylist" ? m.downloadedPlaylists?.includes(c) || (m.downloadedPlaylists = (m.downloadedPlaylists ?? []).concat(c)) : W !== "musicAlbumRelease" || m.downloadedAlbumReleases?.includes(c) || (m.downloadedAlbumReleases = (m.downloadedAlbumReleases ?? []).concat(c));
        await g.TA(Q, m, "musicDownloadsLibraryEntity")
    }
      , sY = async function(Q, c) {
        var W = g.bX("music_downloads_library_id", "musicDownloadsLibraryEntity");
        if (W = await $a(Q, W, "musicDownloadsLibraryEntity")) {
            var m = g.w1(c).entityType;
            let K;
            m === "musicTrack" ? K = W.downloadedTracks : m === "musicPlaylist" && (K = W.downloadedPlaylists);
            if (K?.length)
                for (m = 0; m < K.length; m++)
                    if (K[m] === c) {
                        K.splice(m, 1);
                        break
                    }
            await g.TA(Q, W, "musicDownloadsLibraryEntity")
        }
    }
      , kd4 = function(Q) {
        var c = Q.videos;
        Q = [];
        const W = [];
        if (c)
            for (const K of c) {
                var m = K.offlineVideoData.videoId;
                c = g.bX(m, "musicTrack");
                m = g.bX(m, "musicTrackDownloadMetadataEntity");
                Q.push(c);
                W.push(m)
            }
        return {
            gp: Q,
            kJ: W
        }
    }
      , dJ = function(Q, c, W) {
        c = {
            track: RJ0(c)
        };
        W && (c.playlistId = W);
        if (Q = g.l(Q.actionMetadata, YJa))
            c.maximumDownloadQuality = Q.maximumDownloadQuality;
        return {
            musicTrackEntityActionMetadata: c
        }
    }
      , Qw9 = async function(Q) {
        var c = g.nr();
        Q = Vbi(Q);
        const W = g.vu(phm);
        try {
            var m = await g.$h(c, Q, W, void 0, {
                dR: !0
            })
        } catch (K) {
            if (K instanceof g.A1)
                throw m = `GetOffline network manager error: ${K.message}`,
                Rj(m, K),
                Error(m);
            Rj("GetOffline fetch request error", K);
            throw Error("GetOffline fetch request error");
        }
        c = m.errorMetadata?.status;
        if (!m)
            throw Rj("Network request failed"),
            Error("Network request failed");
        if (c !== void 0)
            L5(c);
        else if (!m.videos || !m.videos.length)
            throw Rj("No data"),
            Error("No data");
        return m.videos.map(K => K.offlineVideoData)
    }
      , wJ = async function(Q) {
        var c = g.nr();
        Q = Bsm(Q);
        const W = g.vu(phm);
        try {
            var m = await g.$h(c, Q, W, void 0, {
                dR: !0
            })
        } catch (K) {
            if (K instanceof g.A1)
                throw m = `GetOffline network manager error for playlist: ${K.message}`,
                Rj(m, K),
                Error(m);
            Rj("GetOffline fetch request error for playlist", K);
            throw Error("GetOffline fetch request error for playlist");
        }
        c = m.errorMetadata?.status;
        if (!m)
            throw Rj("Network request failed for playlist"),
            Error("Network request failed for playlist");
        if (c !== void 0)
            L5(c, "playlist");
        else if (!m.playlists || !m.playlists.length)
            throw Rj("No data for playlist"),
            Error("No data for playlist");
        return m.playlists.map(K => K.offlinePlaylistData)
    }
      , Wbo = async function(Q, c, W, m) {
        const K = await g.Iz();
        if (!K)
            return [];
        var T = [];
        m?.length ? T = m : T = await g.rx(K, "mainPlaylistEntity");
        if (!T.length)
            return [];
        m = [];
        const r = Date.now() / 1E3;
        for (const A of T) {
            var U = A.downloadState ? await $a(K, A.downloadState, "mainPlaylistDownloadStateEntity") : void 0
              , I = (T = A?.entityMetadata) && T.nextAutoRefreshIntervalSeconds ? Number(T.nextAutoRefreshIntervalSeconds) : NaN;
            I = Number.isNaN(I) ? Q : I;
            var X = U?.lastSyncedTimestampMillis ? Number(U?.lastSyncedTimestampMillis) / 1E3 : 0;
            U = U?.addedTimestampMillis ? Number(U?.addedTimestampMillis) / 1E3 : 0;
            if (W || !T || X + I <= r) {
                I = [];
                if (A.videos?.length)
                    for (const e of A.videos)
                        X = JSON.parse(g.w1(e).entityId),
                        X.videoId && I.push(X.videoId);
                X = "0";
                T && (X = String(Number(T.offlineLastModifiedTimestampSeconds ?? 0).toFixed()));
                m.push({
                    playlistId: A.playlistId,
                    videoIds: I,
                    offlineLastModifiedTimestamp: X,
                    autoSync: c,
                    offlineDateAddedTimestamp: String(U.toFixed())
                })
            }
        }
        return m.length ? await cf0(m) : []
    }
      , mKo = async function() {
        var Q = await g.Iz();
        if (!Q)
            return !1;
        Q = await g.rx(Q, "refresh");
        if (!Q[0]?.refreshTime)
            return !1;
        Q = Number(Q[0].refreshTime);
        const c = Date.now() / 1E3;
        return isFinite(Q) && c >= Q
    }
      , T9v = async function(Q, c) {
        let W;
        try {
            const m = await Kbv(Q, c);
            await $N1(m);
            W = uSm(m)
        } catch (m) {
            Rj("getAndProcessSmartDownloadsResponse request or processing error", m)
        }
        return W
    }
      , oEH = async function(Q, c, W, m) {
        const K = await g.Iz();
        if (!K)
            return [];
        var T = [];
        m?.length ? T = m : T = await g.rx(K, "musicPlaylist");
        if (!T.length)
            return [];
        m = [];
        const r = Date.now() / 1E3;
        for (const X of T) {
            var U = (T = X?.entityMetadata) && T.nextAutoRefreshIntervalSeconds ? Number(T.nextAutoRefreshIntervalSeconds) : NaN;
            const A = Number.isNaN(U) ? Q : U;
            let e = U = 0;
            var I = "DOWNLOAD_SYNC_STATE_UNKNOWN";
            X.downloadMetadata && (I = await $a(K, X.downloadMetadata, "musicPlaylistDownloadMetadataEntity"),
            U = Number(I?.addedTimestampMillis ?? "0") / 1E3,
            e = Number(I?.lastModifiedTimestampMillis ?? "0") / 1E3,
            I = I?.syncState ?? "DOWNLOAD_SYNC_STATE_UNKNOWN");
            if (W || I !== "DOWNLOAD_SYNC_STATE_UP_TO_DATE" || !T || Number(T.lastSyncedTimestampSeconds ?? 0) + A <= r) {
                T = [];
                if (X.tracks?.length)
                    for (const V of X.tracks)
                        T.push(g.w1(V).entityId);
                m.push({
                    playlistId: X.playlistId,
                    videoIds: T,
                    offlineLastModifiedTimestamp: String(e.toFixed()),
                    autoSync: c,
                    offlineDateAddedTimestamp: String(U.toFixed())
                })
            }
        }
        return m.length ? await cf0(m) : []
    }
      , Kbv = async function(Q, c) {
        var W = g.nr()
          , m = await g.Iz();
        let K;
        m && (K = await HjH(m));
        m = K;
        Q = {
            context: g.Oh(),
            browseId: "FEdownloads",
            browseRequestSupportedMetadata: {
                downloadsBrowseParams: {
                    offlineFeatureSettingState: {
                        isSdEnabled: Q
                    },
                    offlineClientState: m,
                    clientStateRequestData: {
                        preferredFormatType: c
                    }
                }
            }
        };
        c = g.vu(rfD);
        try {
            var T = await g.$h(W, Q, c, void 0, {
                dR: !0
            })
        } catch (r) {
            if (r instanceof g.A1)
                throw T = `DPS network manager error for smart downloads: ${r.message}`,
                Rj(T, r),
                Error(T);
            Rj("DPS fetch request error for smart downloads", r);
            throw Error("DPS fetch request error for smart downloads");
        }
        W = T.errorMetadata?.status;
        if (T)
            W !== void 0 && L5(W, "smart downloads");
        else
            throw Rj("Network request failed for smart downloads"),
            Error("Network request failed for smart downloads");
        return T
    }
      , I5W = async function(Q, c) {
        var W = g.nr();
        Q = {
            context: g.Oh(),
            videoPlaybackPositionEntities: Q,
            lastSyncTimestampUsec: c
        };
        c = g.vu(UKD);
        try {
            var m = await g.$h(W, Q, c, void 0, {
                dR: !0
            })
        } catch (K) {
            if (K instanceof g.A1)
                throw m = `VPPS network manager error: ${K.message}`,
                Rj(m, K),
                Error(m);
            Rj("VPPS fetch request error", K);
            throw Error("VPPS fetch request error");
        }
        W = m.errorMetadata?.status;
        if (m)
            W !== void 0 && L5(W, "position sync");
        else
            throw Rj("Network request failed for position sync"),
            Error("Network request failed for position sync");
        return m
    }
      , L5 = function(Q, c) {
        c = c ? ` for ${c}` : "";
        if (Q === 0)
            throw Q = `Empty response body${c}`,
            Rj(Q),
            Error(Q);
        Q = `Response with error${c}`;
        Rj(Q);
        throw Error(Q);
    }
      , cf0 = async function(Q) {
        var c = g.nr();
        Q = xNm(Q);
        const W = g.vu(XNH);
        try {
            var m = await g.$h(c, Q, W, void 0, {
                dR: !0
            })
        } catch (K) {
            if (K instanceof g.A1)
                throw m = `offlinePlaylistSyncCheck network manager error: ${K.message}`,
                Rj(m, K),
                Error(m);
            Rj("offlinePlaylistSyncCheck fetch request error", K);
            throw Error("offlinePlaylistSyncCheck fetch request error");
        }
        c = m.errorMetadata?.status;
        if (!m)
            throw Rj("Network request failed for playlist sync"),
            Error("Network request failed for playlist sync");
        if (c !== void 0)
            L5(c, "playlist sync");
        else if (!m.offlinePlaylistSyncCheckDatas || !m.offlinePlaylistSyncCheckDatas.length)
            throw Rj("No data for playlist sync"),
            Error("No data for playlist sync");
        return m.offlinePlaylistSyncCheckDatas.map(K => K.offlinePlaylistSyncCheckData)
    }
      , Afa = async function(Q, c) {
        const W = new Map;
        for (const m of c)
            W.set(m, await Q.O(m));
        return W
    }
      , bq = function(Q, c, W, m, K, T) {
        c = g.bX(c, W);
        return {
            actionType: Q,
            entityKey: c,
            actionMetadata: {
                ...T,
                priority: m,
                retryScheduleIntervalsInSeconds: K
            }
        }
    }
      , xKS = async function(Q, c) {
        var W = c.entityKey;
        const m = g.l(c.actionMetadata, js)?.isEnqueuedForExpiredStreamUrlRefetch;
        try {
            let T = void 0;
            T = await e69(Q, c);
            let r;
            try {
                {
                    const U = g.l(c.actionMetadata, js);
                    var K = U ? {
                        maximumDownloadQuality: U.maximumDownloadQuality
                    } : void 0
                }
                r = await VN9(W, Q.FI, {
                    isEnqueuedForExpiredStreamUrlRefetch: m,
                    tS: K,
                    offlineSourceData: T
                })
            } catch (U) {
                const I = cQ(c) ? "OFFLINE_ORCHESTRATION_FAILURE_REASON_RECOVERABLE_NETWORK_ERROR" : "OFFLINE_ORCHESTRATION_FAILURE_REASON_UNRECOVERABLE_NETWORK_ERROR";
                Rj("PDE handleAdd error");
                return gJ(c, !1, void 0, "OFFLINE_OPERATION_FAILURE_REASON_NETWORK_REQUEST_FAILED", I, "DOWNLOAD_STATE_FAILED")
            }
            await B9a(Q, r, c);
            return gJ(c, !0, r.orchestrationActions)
        } catch (T) {
            return Q = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
            W = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
            T instanceof g.fg && T.type === "QUOTA_EXCEEDED" && (Q = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
            W = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
            Rj("PDE handleAdd error"),
            gJ(c, !1, void 0, Q, W, "DOWNLOAD_STATE_FAILED")
        }
    }
      , DK1 = async function(Q, c) {
        const W = c.entityKey
          , m = g.w1(W).entityId;
        var K = await g.Kr(Q.W, {
            mode: "readonly",
            g3: !0
        }, e => {
            const V = g.Yf(e, W, "playbackData")
              , B = g.Yf(e, g.bX(m, "offlineVideoPolicy"), "offlineVideoPolicy");
            e = g.Yf(e, g.bX(m, "transfer"), "transfer");
            return g.P8.all([V, B, e])
        }
        );
        const [T,r,U] = K;
        if (!T || !r)
            return gJ(c, !0);
        K = [];
        var I = T?.playerResponseJson ? JSON.parse(T.playerResponseJson) : null;
        if (U && I) {
            var X = qF9(Q, I, U);
            K = await nEv(Q, U)
        }
        K = {
            lastPlayerResponseTimestampSeconds: T.playerResponseTimestamp,
            offlineToken: r.offlineToken,
            formatIds: K
        };
        I = {};
        U?.maximumDownloadQuality && (I.maximumDownloadQuality = U.maximumDownloadQuality);
        try {
            let e = void 0;
            e = await e69(Q, c);
            try {
                var A = await VN9(W, Q.FI, {
                    refreshData: K,
                    tS: I,
                    offlineSourceData: e,
                    mediaCapabilities: X
                })
            } catch (V) {
                const B = cQ(c) ? "OFFLINE_ORCHESTRATION_FAILURE_REASON_RECOVERABLE_NETWORK_ERROR" : "OFFLINE_ORCHESTRATION_FAILURE_REASON_UNRECOVERABLE_NETWORK_ERROR";
                Rj("PDE handleRefresh error");
                return gJ(c, !1, void 0, "OFFLINE_OPERATION_FAILURE_REASON_NETWORK_REQUEST_FAILED", B, "DOWNLOAD_STATE_FAILED")
            }
            await B9a(Q, A, c);
            return gJ(c, !0, A.orchestrationActions)
        } catch (e) {
            return Q = "PDE handleRefresh error",
            e instanceof Error && (Q = `PDE handleRefresh error: ${e.message}`),
            X = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
            A = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
            e instanceof g.fg && e.type === "QUOTA_EXCEEDED" && (X = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
            A = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
            Rj(Q),
            gJ(c, !1, void 0, X, A, "DOWNLOAD_STATE_FAILED")
        }
    }
      , e69 = async function(Q, c) {
        c = g.w1(c.entityKey).entityId;
        c = g.bX(c, "videoDownloadContextEntity");
        Q = await $a(Q.W, c, "videoDownloadContextEntity");
        return Q?.offlineModeType ? {
            offlineModeType: Q.offlineModeType
        } : void 0
    }
      , gJ = function(Q, c, W, m, K, T) {
        return new OY(c ? "OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS" : "OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",cQ(Q),W,m,K,T)
    }
      , B9a = async function(Q, c, W) {
        if (c.frameworkUpdates && g.l(c.frameworkUpdates, HQ)) {
            if (g.l(c.frameworkUpdates, HQ).mutations && g.l(c.frameworkUpdates, HQ).mutations.length > 0 && g.l(c.frameworkUpdates, HQ).mutations[0].type === "ENTITY_MUTATION_TYPE_DELETE") {
                const m = g.w1(g.l(c.frameworkUpdates, HQ).mutations[0].entityKey).entityId
                  , K = await y8(Q.W, m)
                  , T = g.l(W.actionMetadata, js)?.playlistId;
                T && (K.playlistId = T);
                K.offlineDeleteReason = "OFFLINE_DELETE_REASON_UNKNOWN";
                g.rT(Q.FI) ? await n5(m, Q.W, W, Q.A, K) : g.uL(Q.FI) && await Ss(m, Q.W, W, Q.A)
            }
            await lT(g.l(c.frameworkUpdates, HQ))
        }
    }
      , qF9 = function(Q, c, W) {
        c = Xa(Q.FI, W.cotn, c);
        W = g.Ow(c);
        return g.NRR(c, W, Q.FI)
    }
      , nEv = async function(Q, c) {
        const W = [];
        if (Q = await g.Kr(Q.W, {
            mode: "readonly",
            g3: !0
        }, m => {
            const K = []
              , T = c.offlineVideoStreams;
            if (T)
                for (const r of T)
                    K.push(g.Yf(m, r, "offlineVideoStreams"));
            return g.P8.all(K)
        }
        ))
            for (const m of Q)
                if (m?.streamsProgress) {
                    Q = m.streamsProgress;
                    for (let K = 0; K < Q.length; K++) {
                        const T = JSON.parse(Q[K].formatStreamBytes);
                        W.push({
                            itag: T.itag,
                            lmt: T.lastModified,
                            xtags: T.xtags
                        })
                    }
                }
        return W
    }
      , tN1 = async function(Q, c) {
        c = cQ(c);
        const W = await g.rx(Q.W, "videoPlaybackPositionEntity");
        if (W.length === 0)
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",c);
        let m = W;
        if (Q.FI.Ty().W.BA(g.NXK)) {
            Q = await g.rx(Q.W, "mainVideoEntity");
            const K = new Set(Q.map(T => T.videoId));
            m = W.filter(T => K.has(T.videoId))
        }
        try {
            const K = await f5.getInstance();
            if (!K)
                throw Error("prefStorage is undefined");
            const T = (await K.get("psi"))?.IL ?? "0"
              , r = await I5W(m, T)
              , U = {
                isPaused: r.watchHistoryPaused,
                IL: r.syncTimestampUsec
            };
            await K.set("psi", U);
            if (!U.isPaused) {
                const I = g.l(r.frameworkUpdates, HQ);
                r.frameworkUpdates && I && await lT(I)
            }
        } catch (K) {
            return Rj("PPE handleRefresh error: " + (K instanceof Error ? K.message : "unknown error")),
            new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",c,void 0,"OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",c)
    }
      , N90 = async function(Q, c) {
        const W = cQ(c)
          , m = g.w1(c.entityKey).entityId;
        try {
            const K = await f5.getInstance();
            if (!K)
                throw Error("prefStorage is undefined");
            const T = await K.get("psi")
              , r = g.l(c.actionMetadata, H4m);
            if (T?.isPaused === !1 && r?.lastPlaybackPositionSeconds) {
                const U = {
                    key: g.bX(m, "videoPlaybackPositionEntity"),
                    videoId: m,
                    lastPlaybackPositionSeconds: r.lastPlaybackPositionSeconds
                };
                await g.TA(Q.W, U, "videoPlaybackPositionEntity")
            }
        } catch (K) {
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,"OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
    }
      , i44 = async function(Q, c) {
        const W = cQ(c);
        try {
            const m = g.w1(c.entityKey).entityId;
            if (m === "!*$_ALL_ENTITIES_!*$")
                await Qka(Q.W);
            else {
                const K = g.bX(m, "videoPlaybackPositionEntity");
                await g.oz(Q.W, K)
            }
        } catch (m) {
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,"OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
    }
      , vQ = async function(Q) {
        return eJi(Q)
    }
      , yfm = async function(Q) {
        return (await g.pIx(Q)).filter(c => !!c.url).map(c => c.url)
    }
      , ar = function(Q, c) {
        var W = g.mj(c);
        if (W === 1 || W === 0)
            return Promise.resolve();
        (W = Q.player?.getVideoData().videoId === c ? Q.player : null) && W.stopVideo();
        Q.A = 0;
        return vQ(c)
    }
      , GB = function(Q, c, W=!1, m=!0) {
        c = typeof c === "string" ? c : c.videoDetails.videoId;
        if (g.mj(c) === 2) {
            var K = Q.player?.getVideoData().videoId === c ? Q.player : null;
            K && K.stopVideo();
            g.Kl(c, 2);
            Q.A = 2;
            W ? SFS(Q.W) : m && Fba(Q.W)
        }
    }
      , EE9 = async function(Q, c) {
        const W = cQ(c);
        if (await $a(Q.W, c.entityKey, "transfer"))
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        try {
            await Z4D(Q, c)
        } catch (m) {
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,"OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
    }
      , sw9 = async function(Q, c) {
        const W = cQ(c)
          , m = await $a(Q.W, c.entityKey, "transfer");
        if (!m || m.transferState !== "TRANSFER_STATE_COMPLETE")
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        try {
            await Z4D(Q, c, !0)
        } catch (K) {
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,"OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
    }
      , dKa = async function(Q, c) {
        const W = cQ(c)
          , m = g.w1(c.entityKey).entityId
          , K = await g.Kr(Q.W, {
            mode: "readonly",
            g3: !0
        }, U => {
            const I = g.Yf(U, c.entityKey, "transfer");
            U = g.Yf(U, g.bX(m, "videoDownloadContextEntity"), "videoDownloadContextEntity");
            return g.P8.all([I, U])
        }
        )
          , [T,r] = K;
        if (!T || T.transferState !== "TRANSFER_STATE_WAITING_FOR_PLAYER_RESPONSE_REFRESH")
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        try {
            T.transferState = "TRANSFER_STATE_TRANSFER_IN_QUEUE";
            await g.TA(Q.W, T, "transfer");
            const U = g.w1(T.key).entityId;
            Q8({
                transferStatusType: "TRANSFER_STATUS_TYPE_REENQUEUED_BY_PLAYER_RESPONSE_REFRESH"
            }, {
                videoId: U,
                o_: T,
                offlineModeType: r?.offlineModeType
            })
        } catch (U) {
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,"OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
    }
      , Z4D = async function(Q, c, W=!1) {
        const m = g.l(c.actionMetadata, Lbv)
          , K = g.w1(c.entityKey).entityId
          , T = g.bX(K, "downloadStatusEntity");
        var r = await g.Kr(Q.W, {
            mode: "readonly",
            g3: !0
        }, A => {
            const e = g.Yf(A, T, "downloadStatusEntity");
            A = g.Yf(A, g.bX(K, "videoDownloadContextEntity"), "videoDownloadContextEntity");
            return g.P8.all([e, A])
        }
        );
        const [U,I] = r;
        r = "TRANSFER_STATE_TRANSFER_IN_QUEUE";
        U?.downloadState === "DOWNLOAD_STATE_USER_DELETED" && (r = "TRANSFER_STATE_PAUSED_BY_USER");
        const X = {
            key: c.entityKey,
            transferState: r,
            cotn: g.Ab(16),
            enqueuedTimestampMs: Date.now().toString(),
            maximumDownloadQuality: m?.maximumDownloadQuality,
            preferredAudioTrack: m?.preferredAudioTrack,
            transferRetryCount: 0,
            isRefresh: W,
            hasLoggedFirstStarted: !1
        };
        await g.Kr(Q.W, {
            mode: "readwrite",
            g3: !0
        }, A => {
            const e = [];
            W && e.push(g.mh(A, g.bX(K, "offlineVideoStreams")));
            e.push(g.WI(A, X, "transfer"));
            return g.P8.all(e)
        }
        );
        W && await vQ(K);
        Q8({
            transferStatusType: "TRANSFER_STATUS_TYPE_ENQUEUED",
            statusType: "ADDED_TO_QUEUE"
        }, {
            videoId: K,
            o_: X,
            offlineModeType: I?.offlineModeType
        })
    }
      , b4m = function(Q, c, W, m) {
        if (!Q.action.entityKey)
            throw Error("entityKey is missing.");
        const {O_: K, entityId: T} = g.w1(Q.action.entityKey)
          , r = {
            entityType: K,
            entityId: T,
            offlineOrchestrationActionType: Q.action.actionType,
            orchestrationAction: {
                orchestrationActionId: Q.actionId
            }
        };
        c && (r.offlineOrchestrationActionResult = c.status,
        r.isRetryable = W ? !1 : c.W,
        c.A && (r.offlineOrchestrationFailureReason = wNW(c.A, r.isRetryable)));
        Q.action.actionMetadata?.offlineLoggingData?.offlineModeType && (r.offlineModeType = Q.action.actionMetadata.offlineLoggingData.offlineModeType);
        m && (r.additionalOrchestrationActions = m.map(U => ({
            orchestrationActionId: U.actionId
        })));
        return r
    }
      , wNW = function(Q, c) {
        return Q !== "OFFLINE_ORCHESTRATION_FAILURE_REASON_RECOVERABLE_NETWORK_ERROR" || c ? Q === "OFFLINE_ORCHESTRATION_FAILURE_REASON_UNRECOVERABLE_NETWORK_ERROR" && c ? "OFFLINE_ORCHESTRATION_FAILURE_REASON_RECOVERABLE_NETWORK_ERROR" : Q : "OFFLINE_ORCHESTRATION_FAILURE_REASON_UNRECOVERABLE_NETWORK_ERROR"
    }
      , $L = function(Q, c) {
        const W = {
            offlineOrchestrationContext: b4m(Q)
        };
        c = DNS(c, W);
        tb9(n8W(), c, Q.rootActionId)
    }
      , PQ = function(Q, c, W, m=[]) {
        c = {
            offlineOrchestrationContext: b4m(Q, c, W, m)
        };
        c = DNS(3, c);
        tb9(n8W(), c, Q.rootActionId)
    }
      , jw1 = function(Q, c) {
        for (const W of c)
            $L(W, 1),
            Q.actions.push(W);
        Q.actions.sort(Q.W)
    }
      , gEv = function(Q, c) {
        if (c)
            for (let W = 0; W < Q.actions.length; W++)
                if (c === "!*$_ALL_ENTITIES_!*$" && Q.actions[W].actionId !== c || c !== "!*$_ALL_ENTITIES_!*$" && Q.actions[W].rootActionId === c && Q.actions[W].actionId !== c)
                    Q.actions.splice(W, 1),
                    W--
    }
      , O40 = function(Q, c) {
        for (const W of Q.actions)
            if (W.actionId === c)
                return !0;
        return !1
    }
      , GR0 = async function(Q, c, W, m, K) {
        Q = new f5D(Q,c,W,m,K);
        await vEi(Q);
        a5Z(Q);
        return Q
    }
      , vEi = async function(Q) {
        const c = await g.rx(Q.O, "offlineOrchestrationActionWrapperEntity");
        await lq(Q, c)
    }
      , a5Z = function(Q) {
        const c = Q.W.actions[0];
        return Q.j ? (c?.action.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE" && Q.j[0].action.actionType !== "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE" && (Q.K = !0),
        Promise.resolve()) : $KW(Q)
    }
      , $KW = async function(Q) {
        if (Q.j)
            throw Error("Already processing an action");
        if (!Q.u0()) {
            var c = Q.W.actions.shift();
            skv(Q.mF, !c);
            if (c !== void 0) {
                c.action.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH" && c.actionId === "DOWNLOADS_LIST_ENTITY_ID_SMART_DOWNLOADS" && gEv(Q.W, c.actionId);
                var W = "";
                c.action.actionType === "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE" && c.rootActionId === c.actionId && (W = c.actionId);
                var m = [c];
                Q.j = m;
                if (c = Q.b0[c.entityType]) {
                    for (const K of m)
                        $L(K, 2);
                    try {
                        const K = await Afa(c, m.map(T => T.action));
                        for (const T of m) {
                            const r = K.get(T.action);
                            await PnS(Q, T, r)
                        }
                        gEv(Q.W, W)
                    } catch (K) {
                        Rj("Orchestration error", K);
                        try {
                            await l54(Q, m)
                        } catch (T) {
                            Rj("Orchestration retry error", T);
                            for (const r of m)
                                r.retryScheduleIndex < 3 && jw1(Q.W, [r])
                        }
                    } finally {
                        Q.j = void 0
                    }
                } else
                    Q.j = void 0;
                await $KW(Q)
            }
        }
    }
      , PnS = async function(Q, c, W) {
        var m = c.retryScheduleIndex + 2 === 3;
        if (W.status === "OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS") {
            var K = void 0;
            try {
                K = W.j?.map(T => Q.createAction(T, c))
            } catch (T) {
                PQ(c, W, m);
                ka(Q.J, {
                    entityKey: c.action.entityKey,
                    failureReason: "OFFLINE_OPERATION_FAILURE_REASON_UNSUPPORTED_ENTITY_FAILED"
                });
                Rj("Orchestration subactions creation error", T);
                return
            }
            PQ(c, W, m, K);
            if (K) {
                const T = K.map(U => BQ(U));
                let r = 0;
                for (; r < K.length && !Q.K; )
                    await g.Kr(Q.O, {
                        mode: "readwrite",
                        g3: !0
                    }, U => {
                        const I = [];
                        I.push(aj(U, T.slice(r, r + 10), "offlineOrchestrationActionWrapperEntity"));
                        return g.P8.all(I)
                    }
                    ),
                    r += 10;
                if (Q.K) {
                    Q.K = !1;
                    return
                }
            }
            W = BQ(c);
            await g.oz(Q.O, W.key);
            $L(c, 4)
        } else if (W.status === "OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE")
            if (PQ(c, W, m),
            W.W && c.retryScheduleIndex + 1 < 3)
                await l54(Q, [c]);
            else {
                m = {
                    entityKey: c.action.entityKey,
                    failureReason: W?.O ? W.O : "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN"
                };
                K = void 0;
                g.rT(Q.FI) ? K = "mainVideoDownloadStateEntity" : g.uL(Q.FI) && (K = "musicTrackDownloadMetadataEntity");
                if (K && W.downloadState) {
                    const T = g.w1(c.action.entityKey).entityId;
                    await TB(T, K, Q.O, W.downloadState)
                }
                ka(Q.J, m);
                W.downloadState === "DOWNLOAD_STATE_FAILED" && Q.FI.X("html5_auto_retry_failed_pde_actions") || (Rj("Orchestration result is not retryable, deleting action"),
                await g.oz(Q.O, BQ(c).key))
            }
    }
      , l54 = async function(Q, c) {
        for (const W of c) {
            const m = W.action?.actionMetadata?.retryScheduleIntervalsInSeconds || [1, 2, 4];
            let K = 1;
            W.retryScheduleIndex < m.length && (K = m[W.retryScheduleIndex]);
            W.W = K * 1E3 + Date.now();
            W.retryScheduleIndex++
        }
        await uRZ(Q, c)
    }
      , h6D = async function(Q, c) {
        return (await g.rx(Q.O, "offlineOrchestrationActionWrapperEntity", c)).filter(o8D)
    }
      , lq = async function(Q, c) {
        let W = [];
        var m = Infinity;
        let K = 4E3;
        for (const r of c) {
            c = Number(r.enqueueTimeSec);
            const U = z6v(c);
            var T = r.retryScheduleIndex;
            T = T != null && T > 0;
            U > 0 && T ? (m = Math.min(m, c),
            K = Math.min(U, K)) : W.push(r)
        }
        isFinite(m) && (!Q.A.isActive() || m < Q.L) && (Q.L = m,
        Q.A.start(K));
        Q.D.KU() || (m = W.length,
        W = W.filter(r => !Cn9.includes(r.actionProto?.actionType || "OFFLINE_ORCHESTRATION_ACTION_TYPE_UNKNOWN")),
        m = W.length < m,
        !Q.A.isActive() && m && Q.A.start(1));
        W.length > 0 && MN9(Q, W);
        await a5Z(Q)
    }
      , z6v = function(Q) {
        Q = Q * 1E3 - Date.now();
        return Q > 4E3 ? 4E3 : Q
    }
      , MN9 = function(Q, c) {
        c.length !== 0 && c.forEach(W => {
            W = V8(W);
            W.retryScheduleIndex < 3 && jw1(Q.W, [W])
        }
        )
    }
      , Jfa = async function(Q) {
        var c = await h6D(Q);
        const W = [];
        for (const m of c)
            c = g.w1(m.key).entityId,
            O40(Q.W, c) || W.push(m);
        await lq(Q, W)
    }
      , uRZ = function(Q, c) {
        if (c.length === 0)
            return Promise.resolve([]);
        c = c.map(W => BQ(W));
        return pki(Q.O, c)
    }
      , R6D = async function(Q, c) {
        const W = c.videoId;
        let m = !0;
        if (c.captionTracks.length) {
            const K = cF9(c);
            Q.W = new g.M0(Q.ge,c,K)
        } else if (c.sC)
            Q.W = new g.Jc(Q.ge,c.sC,W,g.qUw(c),c.rX,c.eventId),
            m = c.rX;
        else
            return;
        return new Promise(K => {
            Q.W?.K({
                Kw: async () => {
                    await Q.Kw(W, m);
                    K()
                }
                ,
                Zn: () => {}
            })
        }
        )
    }
      , kRa = async function(Q) {
        Q = await AF9(Q);
        return !!Q && Q.length > 0
    }
      , YF4 = async function(Q, c) {
        if (c.length === 0)
            return [];
        const W = c.map(K => g.bX(K, "transfer"))
          , m = (await g.rx(Q.W, "transfer", W)).filter(o8D).map(K => g.w1(K.key).entityId);
        Q = c.filter(K => m.indexOf(K) === -1);
        if (Q.length === 0)
            return [];
        for (const K of Q)
            await vQ(K);
        return Q
    }
      , c_9 = async function(Q, c, W, m, K, T) {
        let r = "STREAM_TYPE_UNKNOWN";
        W.video && W.audio ? (r = "STREAM_TYPE_AUDIO_AND_VIDEO",
        Rj("unexpected stream type")) : W.video && !W.audio ? r = "STREAM_TYPE_VIDEO" : !W.video && W.audio && (r = "STREAM_TYPE_AUDIO");
        const U = g.bX(c, "offlineVideoStreams")
          , I = {
            numBytesDownloaded: K.toFixed(),
            numTotalBytes: T.toFixed(),
            streamType: r,
            streamState: "DOWNLOAD_STREAM_STATE_IN_PROGRESS",
            formatStreamBytes: JSON.stringify(m),
            itag: r === "STREAM_TYPE_AUDIO_AND_VIDEO" ? Number(W.itag) : void 0
        };
        await g.Kr(Q, {
            mode: "readwrite",
            g3: !0
        }, X => {
            const A = g.Yf(X, U, "offlineVideoStreams")
              , e = g.Yf(X, g.bX(c, "transfer"), "transfer");
            return g.P8.all([A, e]).then( ([V,B]) => {
                if (!B)
                    return g.mh(X, U).then( () => {}
                    );
                var n = pNm(V);
                V = QSD(V, m, I, U);
                const S = g.WI(X, V, "offlineVideoStreams");
                pNm(V) > n && (B.lastProgressTimeMs = Date.now().toString());
                n = [S];
                B.offlineVideoStreams || (B.offlineVideoStreams = []);
                B.offlineVideoStreams.indexOf(U) === -1 && (B.offlineVideoStreams.push(U),
                n.push(g.WI(X, B, "transfer")));
                return g.P8.all(n)
            }
            )
        }
        )
    }
      , W_0 = async function(Q, c) {
        c = g.bX(c, "offlineVideoStreams");
        if ((c = await $a(Q, c, "offlineVideoStreams")) && c.streamsProgress) {
            for (const W of c.streamsProgress)
                W.streamState = "DOWNLOAD_STREAM_STATE_COMPLETE",
                W.numTotalBytes !== W.numBytesDownloaded && (W.numBytesDownloaded = W.numTotalBytes);
            await g.TA(Q, c, "offlineVideoStreams")
        }
    }
      , QSD = function(Q, c, W, m) {
        if (Q && Q.streamsProgress) {
            m = Q;
            a: {
                c = `${c.itag};${c.xtags}`;
                var K = Q.streamsProgress;
                for (let T = 0; T < K.length; T++) {
                    const r = JSON.parse(K[T].formatStreamBytes);
                    if (`${r.itag};${r.xtags}` === c) {
                        K[T] = W;
                        W = K;
                        break a
                    }
                }
                K.push(W);
                W = K
            }
            m.streamsProgress = W
        } else
            Q = {
                key: m,
                streamsProgress: [W]
            };
        return Q
    }
      , pNm = function(Q) {
        if (Q?.streamsProgress) {
            let c = 0;
            Q = Q.streamsProgress;
            for (let W = 0; W < Q.length; W++) {
                const m = Q[W];
                isNaN(Number(m.numBytesDownloaded)) ? Rj("stream progress bytes number invalid") : c += Number(m.numBytesDownloaded)
            }
            return c
        }
        return 0
    }
      , SFS = async function(Q) {
        if (Q.W) {
            const c = Q.W;
            Q.j.stop();
            await uq(Q, "TRANSFER_STATE_PAUSED_BY_USER");
            const W = c?.key ? g.w1(c.key).entityId : "";
            W && Q.A && await TB(W, Q.A, Q.O, "DOWNLOAD_STATE_PAUSED");
            const m = await ha(Q, W);
            wh4({
                videoId: W,
                o_: c,
                offlineModeType: m
            })
        } else
            zB(Q, "onTransferPausedByUser");
        C5(Q);
        MU(Q)
    }
      , Fba = async function(Q) {
        if (Q.W) {
            Q.j.stop();
            await uq(Q, "TRANSFER_STATE_TRANSFER_IN_QUEUE");
            var c = Q.W;
            (c = c?.key ? g.w1(c.key).entityId : "") && Q.A && await TB(c, Q.A, Q.O, "DOWNLOAD_STATE_PAUSED");
            C5(Q)
        } else
            zB(Q, "onTransferPausedByNetwork")
    }
      , Ja = async function(Q) {
        if (Q.W) {
            Q.j.start(108E5);
            await uq(Q, "TRANSFER_STATE_TRANSFERRING");
            var c = Q.W;
            (c = c?.key ? g.w1(c.key).entityId : "") && Q.A && await TB(c, Q.A, Q.O, "DOWNLOAD_STATE_DOWNLOAD_IN_PROGRESS")
        } else
            zB(Q, "onTransferStart")
    }
      , m70 = async function(Q, c, W) {
        if (Q.W) {
            Q.W.transferState !== "TRANSFER_STATE_TRANSFERRING" && await Ja(Q);
            var m = Date.now();
            m - Q.Ie > 1E3 && (Q.Ie = m,
            await c_9(Q.O, W.videoId, W.O, W.CN, W.bytesDownloaded, W.W),
            !Q.Y || Q.Y && m - Q.mF > Q.XI) && (Q.mF = m,
            m = await ha(Q, c),
            Lgv({
                videoId: c,
                o_: Q.W,
                offlineModeType: m
            }, W.bytesDownloaded, W.W));
            Q.j.start(108E5)
        } else
            zB(Q, `onTransferProgress: ${c}`)
    }
      , TM0 = async function(Q) {
        if (Q.W) {
            var c = Q.W;
            Q.j.stop();
            if (c && Q.K) {
                var W = Xa(Q.api.G(), c.cotn, Q.K);
                await K_W(Q, W)
            }
            await uq(Q, "TRANSFER_STATE_COMPLETE", "DOWNLOAD_STREAM_STATE_COMPLETE");
            (W = c?.key ? g.w1(c.key).entityId : "") && Q.A && await TB(W, Q.A, Q.O, "DOWNLOAD_STATE_COMPLETE");
            await W_0(Q.O, W);
            var m = await ha(Q, W);
            Q8({
                transferStatusType: "TRANSFER_STATUS_TYPE_COMPLETED",
                statusType: "SUCCESS"
            }, {
                videoId: W,
                o_: c,
                offlineModeType: m
            });
            C5(Q);
            MU(Q)
        } else
            zB(Q, "onTransferComplete")
    }
      , okW = async function(Q) {
        await I9W();
        Q = Q.T2;
        var c = g.W4();
        c = Object.keys(c);
        await YF4(Q, c)
    }
      , IL9 = async function(Q) {
        Q = (await g.rx(Q.O, "transfer")).filter(r_1).sort(U7a);
        return Q.length === 0 ? void 0 : Q[0]
    }
      , eC4 = async function(Q, c) {
        if (!Q.L) {
            Q.L = !0;
            Q.W = c;
            var W = g.w1(Q.W.key).entityId;
            if (Q.W.transferState === "TRANSFER_STATE_TRANSFERRING") {
                var m = await ha(Q, W);
                Q8({
                    transferStatusType: "TRANSFER_STATUS_TYPE_RESUME_PROCESSING",
                    statusType: "OFFLINING_RETRIED"
                }, {
                    videoId: W,
                    o_: Q.W,
                    offlineModeType: m
                })
            } else
                Q.W.transferState !== "TRANSFER_STATE_TRANSFER_IN_QUEUE" || Q.W.transferRetryCount || Q.W.hasLoggedFirstStarted || (m = await ha(Q, W),
                Q.W.hasLoggedFirstStarted = !0,
                await X5i(Q),
                Lgv({
                    videoId: W,
                    o_: Q.W,
                    offlineModeType: m
                }, void 0, void 0, !0));
            await Ja(Q);
            W = null;
            try {
                W = await A_Z(Q, c),
                Q.K = W
            } catch (K) {
                Rj("error getting player response", K, c.cotn);
                await Q.tf("TRANSFER_FAILURE_REASON_SERVER_PROPERTY_MISSING");
                return
            }
            m = Xa(Q.api.G(), c.cotn, W);
            await K_W(Q, m);
            m.Is = await yfm(m.videoId);
            W = Q.J;
            c = c.maximumDownloadQuality;
            m.getPlayerResponse();
            g.Kl(m.videoId, 2);
            W.A = 2;
            W.O = !1;
            W.player?.dispose();
            W.player = W.api.xa(m);
            W.player.H5({
                localmediachange: W.FK,
                signatureexpired: W.F4,
                statechange: W.j
            }, W);
            W.X("html5_generate_content_po_token") && W.player.ZS();
            c = W.JC(c);
            W.player.Dw(g.ya(c, c, !0, "m"), !1);
            W.player.oy(!1);
            Q.j.start(108E5)
        }
    }
      , C5 = function(Q) {
        Q.W = void 0;
        Q.K = void 0;
        Q.j.stop()
    }
      , MU = async function(Q, c=!1) {
        if (Q.W)
            throw Error("Already downloading a video");
        Q.mF = 0;
        Q.L = !1;
        const W = await IL9(Q);
        dNi(Q.PA, !W);
        W && Q.D.KU() ? (c && await new Promise(m => {
            g.zn(m, 1E3)
        }
        ),
        await eC4(Q, W)) : !W && Q.W && C5(Q)
    }
      , ha = async function(Q, c) {
        return (await $a(Q.O, g.bX(c, "videoDownloadContextEntity"), "videoDownloadContextEntity"))?.offlineModeType ?? void 0
    }
      , Vqo = async function(Q) {
        Q.K && (await ar(Q.J, Q.K.videoDetails.videoId),
        C5(Q))
    }
      , K_W = async function(Q, c) {
        try {
            (c.captionTracks.length || c.sC) && !await kRa(c.videoId) && await R6D(Q.HA, c)
        } catch (W) {
            Rj("Caption downloading error", W, c.cotn)
        }
    }
      , X5i = async function(Q, c) {
        if (Q.W) {
            var W = Q.W;
            await g.Kr(Q.O, {
                mode: "readwrite",
                g3: !0
            }, m => {
                const K = [g.WI(m, W, "transfer")];
                c && K.push(c(m));
                return g.P8.all(K)
            }
            )
        }
    }
      , A_Z = async function(Q, c) {
        c = g.w1(c.key).entityId;
        c = g.bX(c, "playbackData");
        Q = await $a(Q.O, c, "playbackData");
        if (Q?.playerResponseJson)
            return JSON.parse(Q.playerResponseJson);
        throw Error("No PlayerResponse found");
    }
      , uq = async function(Q, c, W, m) {
        if (Q.W) {
            Q.W.transferState = c;
            Q.W.failureReason = m;
            try {
                await X5i(Q, K => W ? g.po(K, "offlineVideoStreams", Q.W.offlineVideoStreams).then(T => {
                    for (const r of T)
                        if (r && r.streamsProgress)
                            for (const U of r.streamsProgress)
                                U.streamState = W;
                    return aj(K, T.filter(r => !!r), "offlineVideoStreams")
                }
                ) : g.P8.resolve(void 0))
            } catch (K) {
                K instanceof g.fg && K.type === "QUOTA_EXCEEDED" && await Q.tf("TRANSFER_FAILURE_REASON_FILESYSTEM_WRITE")
            }
        } else
            zB(Q, `saveTransferState: ${c}`)
    }
      , zB = function(Q, c) {
        Q.api.tJ("woffle", {
            mcte: c
        });
        Rj("missing current transfer entity.")
    }
      , BM9 = function(Q) {
        const c = (Q.W.transferRetryCount || 0) < 3;
        c && (Q = Q.W,
        Q.transferRetryCount = (Q.transferRetryCount || 0) + 1);
        return c
    }
      , x7m = async function(Q, c="TRANSFER_FAILURE_REASON_UNKNOWN") {
        Q.W || zB(Q, `setTransferToFailed: ${c}`);
        var W = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN";
        c === "TRANSFER_FAILURE_REASON_NETWORK" ? W = "OFFLINE_OPERATION_FAILURE_REASON_NETWORK_REQUEST_FAILED" : c === "TRANSFER_FAILURE_REASON_FILESYSTEM_WRITE" && (W = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED");
        await uq(Q, "TRANSFER_STATE_FAILED", "DOWNLOAD_STREAM_STATE_ERROR_STREAMS_MISSING", c);
        ka(Q.S, {
            entityKey: Q.W?.key,
            failureReason: W
        });
        W = Q.W ? g.w1(Q.W.key).entityId : "";
        const m = await ha(Q, W);
        Q = {
            videoId: W,
            o_: Q.W,
            offlineModeType: m
        };
        W = {
            transferStatusType: "TRANSFER_STATUS_TYPE_TERMINATED_WITH_FAILURE",
            statusType: "FAILED"
        };
        c && (W.transferFailureReason = c,
        W.failureReason = bjZ(c));
        Q8(W, Q)
    }
      , r_1 = function(Q) {
        return Rr[Q.transferState] !== void 0
    }
      , U7a = function(Q, c) {
        const W = Rr[Q.transferState]
          , m = Rr[c.transferState];
        return W !== m ? W - m : Number(Q.enqueuedTimestampMs) - Number(c.enqueuedTimestampMs)
    }
      , qW4 = async function(Q) {
        g.xt(Q.api, "onOrchestrationBecameLeader");
        await Q.df()
    }
      , tqm = async function(Q) {
        const c = await g.Iz();
        if (c) {
            Q.O = new nkZ(c,Q.api,Q.A,Q.W);
            var W = Q.D(c);
            Q.L = await GR0(c, W, Q.A, Q.W, Q.FI);
            await D79(Q)
        } else
            Rj("PES is undefined")
    }
      , D79 = async function(Q) {
        if (Q.O) {
            Q.O.W || await MU(Q.O);
            Q.FI.X("woffle_enable_main_downloads_library") && await Q.MM();
            Q.FI.X("html5_offline_playback_position_sync") && (await Q.Ie(),
            await Q.Rn(864E5));
            await Q.refreshAllStaleEntities(43200, !0);
            await Q.Y();
            Q.FI.X("html5_retry_downloads_for_expiration") && await Q.W6();
            Q.mF = g.Ce( () => {
                Q.refreshAllStaleEntities(43200, !0);
                Q.Y()
            }
            , 9E5);
            g.iK(g.SL(), () => Q.pm());
            var c = await g.Iz();
            await Fga(c);
            E8a(Q.A)
        } else
            Rj("transferManager is undefined")
    }
      , HXW = async function() {
        const Q = await g.Iz();
        if (!Q)
            return [];
        const c = Date.now() / 1E3
          , W = await g.rx(Q, "offlineVideoPolicy");
        for (const m of W)
            m.expirationTimestamp && Number(m.expirationTimestamp) < c && (m.action = "OFFLINE_VIDEO_POLICY_ACTION_DISABLE",
            m.offlinePlaybackDisabledReason = "OFFLINE_PLAYBACK_DISABLED_REASON_CLIENT_OFFLINE_CONTENT_EXPIRED",
            await g.TA(Q, m, "offlineVideoPolicy"));
        return W.map(m => m.key)
    }
      , kL = async function(Q, c, W, m, K) {
        var T = await g.Iz();
        if (!T)
            return [];
        c = c.map(r => {
            var U = g.bX(r, W);
            U = {
                actionType: m,
                entityKey: U,
                actionMetadata: {
                    ...Aa(),
                    ...K
                }
            };
            m !== "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH" && (U.actionMetadata.priority = 0);
            r = new es(W,r,U);
            return BQ(r)
        }
        );
        T = pki(T, c);
        Zji(Q.A);
        return T
    }
      , NM4 = async function(Q, c, W, m) {
        const K = [];
        for (const T of c)
            if (!T.upToDate && (!W || T.shouldAutoSyncMetadata) && T.playlistId) {
                c = {};
                switch (m) {
                case "mainPlaylistEntity":
                    c = {
                        mainPlaylistEntityActionMetadata: {
                            nextAutoRefreshIntervalSeconds: T.checkInSeconds,
                            autoSync: W
                        }
                    };
                    break;
                case "musicPlaylist":
                    c = {
                        musicPlaylistEntityActionMetadata: {
                            autoSync: W
                        }
                    }
                }
                (c = await kL(Q, [T.playlistId], m, "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH", c)) && K.push(...c)
            }
        return K
    }
      , iXa = async function(Q, c) {
        if (c.length) {
            const W = Aa();
            g.OE(W, js, {
                isEnqueuedForExpiredStreamUrlRefetch: !0
            });
            Q.api.tJ("qrd", {
                v: c.length
            });
            return kL(Q, c, "playbackData", "OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD", W)
        }
        return []
    }
      , SWi = async function(Q, c) {
        const W = cQ(c);
        var m = g.w1(c.entityKey).entityId;
        let K = [];
        try {
            K = await y_Z(Q, m),
            Q.FI.X("woffle_enable_main_downloads_library") && K?.length && await NU(Q.W, [c.entityKey])
        } catch (r) {
            return c = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
            m = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
            r instanceof g.fg && r.type === "QUOTA_EXCEEDED" ? (c = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
            m = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE") : Rj("Playlist add error"),
            new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,c,m)
        }
        const T = [];
        Q.FI.X("html5_offline_prevent_redownload_downloaded_video") && (K = await Ir(Q.W, "mainVideoEntity", K));
        if (K?.length)
            for (const r of K)
                Q = r.offlineVideoData,
                Q?.videoId && T.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD", Q.videoId, "mainVideoEntity", Number(c.actionMetadata?.priority || 0) + 1, YL, p5(c, Q, m)));
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,T)
    }
      , ZXi = async function(Q, c) {
        const W = cQ(c);
        var m = c.entityKey
          , K = g.w1(m).entityId
          , T = []
          , r = !1;
        K === "!*$_ALL_ENTITIES_!*$" ? (r = !0,
        T = await g.rx(Q.W, "mainPlaylistEntity")) : (m = await $a(Q.W, m, "mainPlaylistEntity")) && T.push(m);
        if (!T?.length)
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        var U = g.l(c.actionMetadata, F_4);
        m = U?.nextAutoRefreshIntervalSeconds;
        const I = U?.autoSync;
        let X = []
          , A = !0;
        U = !0;
        let e = !1;
        if (r || I !== !1) {
            try {
                X = await Wbo(0, !!I, !0, T)
            } catch (S) {
                S instanceof Error && S.message === "No data" ? K === "!*$_ALL_ENTITIES_!*$" ? await ta(Q.W, c, Q.A, "OFFLINE_DELETE_REASON_UNAVAILABLE") : await Ds(K, Q.W, c, Q.A) : S instanceof Error && S.message === "Empty response body" && Rj(S.message)
            }
            if (!X.length || !r && X[0].playlistId !== K)
                return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
        }
        if (r) {
            c = [];
            for (var V of X)
                V.upToDate || I && !V.shouldAutoSyncMetadata || !V.playlistId || c.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH", V.playlistId, "mainPlaylistEntity", 0, YL, {
                    mainPlaylistEntityActionMetadata: {
                        nextAutoRefreshIntervalSeconds: V.checkInSeconds,
                        autoSync: I
                    }
                }));
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,c)
        }
        X.length && (V = X[0],
        e = !!V.upToDate,
        I && (A = V.shouldAutoSyncMetadata ?? !0,
        U = V.shouldAutoSyncVideos ?? !0,
        V.checkInSeconds && (m = V.checkInSeconds)));
        if (e || !A)
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        V = [];
        T = T[0];
        r = T.downloadState ? await $a(Q.W, T.downloadState, "mainPlaylistDownloadStateEntity") : void 0;
        r = r?.addedTimestampMillis ? String(r.addedTimestampMillis) : void 0;
        try {
            V = await y_Z(Q, K, r, m)
        } catch (S) {
            if (S instanceof Error && S.message === "No data for playlist")
                await Ds(K, Q.W, c, Q.A);
            else if (S instanceof Error && S.message === "Empty response body for playlist")
                Rj(S.message);
            else
                return c = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
                K = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
                S instanceof g.fg && S.type === "QUOTA_EXCEEDED" && (c = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
                K = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
                new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,c,K)
        }
        if (!U)
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        Q = [];
        m = new Map;
        if (V?.length)
            for (var B of V)
                U = B.offlineVideoData,
                U?.videoId && m.set(U.videoId, U);
        B = new Map;
        U = [];
        if (T?.videos?.length)
            for (var n of T.videos)
                if (T = JSON.parse(g.w1(n).entityId).videoId)
                    m.has(T) ? (B.set(T, m.get(T)),
                    m.delete(T)) : U.push(T);
        n = Number(c.actionMetadata?.priority || 0) + 1;
        for (const [S,d] of m.entries())
            Q.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD", S, "mainVideoEntity", n, YL, p5(c, d, K)));
        for (const [S,d] of B.entries())
            Q.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH", S, "mainVideoEntity", n, YL, p5(c, d, K)));
        for (const S of U)
            Q.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE", S, "mainVideoEntity", 0, YL, {
                offlineLoggingData: {
                    offlineDeleteReason: "OFFLINE_DELETE_REASON_PARENT_LIST_REFRESH"
                },
                mainVideoEntityActionMetadata: {
                    playlistId: K
                }
            }));
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,Q)
    }
      , Ekm = async function(Q, c) {
        const W = cQ(c);
        try {
            const m = g.w1(c.entityKey).entityId;
            m === "!*$_ALL_ENTITIES_!*$" ? await ta(Q.W, c, Q.A, c.actionMetadata?.offlineLoggingData?.offlineDeleteReason) : (await Ds(m, Q.W, c, Q.A),
            Q.FI.X("woffle_enable_main_downloads_library") && await iq(Q.W, c.entityKey))
        } catch (m) {
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,"OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
    }
      , y_Z = async function(Q, c, W, m) {
        c = await wJ([c]);
        const {mainPlaylistEntity: K, PR: T} = await sSv(Q, c[0], W, m);
        Q = v89(K, T?.avatar);
        try {
            await qU(Q)
        } catch (r) {
            r instanceof Error && r.message === "Failed to fetch" && Rj(r.message)
        }
        return c[0].videos
    }
      , p5 = function(Q, c, W) {
        c = {
            offlineVideoData: c,
            playlistId: W
        };
        if (Q = g.l(Q.actionMetadata, F_4))
            c.maximumDownloadQuality = Q.maximumDownloadQuality;
        return {
            mainVideoEntityActionMetadata: c
        }
    }
      , sSv = async function(Q, c, W, m) {
        const K = Date.now().toString();
        W || (W = K);
        var T = c.videos;
        const r = c.playlistId
          , U = []
          , I = [];
        if (T)
            for (const V of T) {
                T = V.offlineVideoData;
                if (!T || !T.videoId)
                    throw Rj("Invalid offlineVideoData for playlist"),
                    Error("Invalid offlineVideoData for playlist");
                T = T.videoId;
                T = {
                    id: g.bX(JSON.stringify({
                        videoId: T,
                        playlistId: r
                    }), "mainPlaylistVideoEntity"),
                    video: g.bX(T, "mainVideoEntity")
                };
                U.push(T);
                I.push(T.id)
            }
        let X;
        const A = {
            key: g.bX(r, "mainPlaylistDownloadStateEntity"),
            addedTimestampMillis: W,
            lastSyncedTimestampMillis: K
        }
          , e = {
            key: g.bX(r, "mainPlaylistEntity"),
            playlistId: r,
            videos: I,
            title: c.title,
            thumbnailStyleData: d7D(c),
            visibility: L_9(c),
            downloadState: A.key
        };
        c.channel && (W = c.channel.offlineChannelData,
        X = w5a(g.bX(r, "ytMainChannelEntity"), W),
        e.channelOwner = X.id);
        e?.entityMetadata ? (e.entityMetadata.offlineLastModifiedTimestampSeconds = c.lastModifiedTimestamp,
        m && (e.entityMetadata.nextAutoRefreshIntervalSeconds = String(m))) : e && (e.entityMetadata = {
            nextAutoRefreshIntervalSeconds: m ? String(m) : void 0,
            offlineLastModifiedTimestampSeconds: c.lastModifiedTimestamp
        });
        try {
            await g.Kr(Q.W, {
                mode: "readwrite",
                g3: !0
            }, V => {
                var B = g.WI(V, e, "mainPlaylistEntity");
                const n = g.WI(V, A, "mainPlaylistDownloadStateEntity");
                B = [B, n];
                for (const S of U)
                    B.push(g.WI(V, S, "mainPlaylistVideoEntity"));
                X && B.push(g.WI(V, X, "ytMainChannelEntity"));
                return g.P8.all(B)
            }
            )
        } catch (V) {
            throw Rj("PES failure for playlist"),
            Error("PES failure for playlist");
        }
        return {
            mainPlaylistEntity: e,
            PR: X,
            nRa: U
        }
    }
      , d7D = function(Q) {
        const c = [];
        var W = Q.videos;
        W && W.length > 0 && c.push({
            key: Number("PLAYLIST_THUMBNAIL_STYLE_FIRST_VIDEO"),
            value: {
                collageThumbnail: {
                    coverThumbnail: W[0].offlineVideoData.thumbnail
                }
            }
        });
        if ((Q = Q.additionalMetadadatas) && Q.length > 0)
            for (const m of Q)
                switch (Q = m.offlineBundleItemPlaylistData,
                W = {
                    collageThumbnail: {
                        coverThumbnail: Q?.coverThumbnail
                    }
                },
                Q?.style) {
                case "BUNDLE_ITEM_STYLE_UNSPECIFIED":
                    c.push({
                        key: Number("PLAYLIST_THUMBNAIL_STYLE_UNKNOWN"),
                        value: W
                    });
                    break;
                case "BUNDLE_ITEM_STYLE_TWO_BY_TWO":
                    c.push({
                        key: Number("PLAYLIST_THUMBNAIL_STYLE_TWO_BY_TWO"),
                        value: W
                    });
                    break;
                case "BUNDLE_ITEM_STYLE_ONE_AND_TWO_AVATAR":
                    c.push({
                        key: Number("PLAYLIST_THUMBNAIL_STYLE_ONE_AND_TWO_AVATAR"),
                        value: W
                    });
                    break;
                case "BUNDLE_ITEM_STYLE_ONE_AND_TWO":
                    c.push({
                        key: Number("PLAYLIST_THUMBNAIL_STYLE_ONE_AND_TWO"),
                        value: W
                    })
                }
        return c
    }
      , L_9 = function(Q) {
        switch (Q.privacy) {
        case "PRIVATE":
            return "PLAYLIST_VISIBILITY_PRIVATE";
        case "PUBLIC":
            return "PLAYLIST_VISIBILITY_PUBLIC";
        case "UNLISTED":
            return "PLAYLIST_VISIBILITY_UNLISTED";
        default:
            return "PLAYLIST_VISIBILITY_UNKNOWN"
        }
    }
      , w5a = function(Q, c) {
        return {
            id: Q,
            channelId: c.channelId,
            title: c.title,
            avatar: c.thumbnail
        }
    }
      , gko = async function(Q, c) {
        const W = cQ(c);
        var m = g.w1(c.entityKey).entityId;
        const K = g.l(c.actionMetadata, QE)
          , T = !K?.playlistId;
        try {
            await bXm(Q, m, void 0, K?.offlineVideoData, T)
        } catch (r) {
            return m = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
            c = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
            r instanceof g.fg && r.type === "QUOTA_EXCEEDED" && (m = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
            c = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
            new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,m,c)
        }
        Q = Number(c.actionMetadata?.priority || 0) + 1;
        c = (c = g.l(c.actionMetadata, QE)) ? {
            playbackDataActionMetadata: {
                maximumDownloadQuality: c.maximumDownloadQuality
            }
        } : void 0;
        m = bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD", m, "playbackData", Q, jS9, c);
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,[m])
    }
      , OXW = async function(Q, c) {
        const W = cQ(c)
          , m = g.w1(c.entityKey).entityId;
        var K = await $a(Q.W, c.entityKey, "mainVideoEntity")
          , T = K ? await $a(Q.W, K.downloadState, "mainVideoDownloadStateEntity") : void 0;
        if (!K || !T)
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        let r;
        try {
            await bXm(Q, m, T.addedTimestampMillis, g.l(c.actionMetadata, QE)?.offlineVideoData),
            K = 1,
            K = Number(c.actionMetadata?.priority || 0) + 1,
            r = bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH", m, "playbackData", K, jS9)
        } catch (U) {
            if (U instanceof Error && U.message === "No data") {
                K = await y8(Q.W, m);
                if (T = g.l(c.actionMetadata, QE)?.playlistId)
                    K.playlistId = T;
                K.offlineDeleteReason = "OFFLINE_DELETE_REASON_UNAVAILABLE";
                await n5(m, Q.W, c, Q.A, K)
            } else if (U instanceof Error && U.message === "Empty response body")
                Rj(U.message);
            else
                return Q = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
                c = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
                U instanceof g.fg && U.type === "QUOTA_EXCEEDED" && (Q = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
                c = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
                new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,Q,c)
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,r ? [r] : void 0)
    }
      , fLo = async function(Q, c) {
        const W = cQ(c);
        try {
            const m = g.w1(c.entityKey).entityId;
            if (m === "!*$_ALL_ENTITIES_!*$")
                await ta(Q.W, c, Q.A, c.actionMetadata?.offlineLoggingData?.offlineDeleteReason);
            else {
                const K = await y8(Q.W, m)
                  , T = g.l(c.actionMetadata, QE)?.playlistId;
                T && (K.playlistId = T);
                K.offlineDeleteReason = c.actionMetadata?.offlineLoggingData?.offlineDeleteReason;
                await n5(m, Q.W, c, Q.A, K);
                Q.FI.X("woffle_enable_main_downloads_library") && await iq(Q.W, c.entityKey)
            }
        } catch (m) {
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,"OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
    }
      , bXm = async function(Q, c, W, m, K) {
        m || (m = (await Qw9([c]))[0]);
        const {mainVideoEntity: T, channelEntity: r} = await vkv(Q, m, W, K);
        try {
            const U = UY(T.thumbnail)
              , I = UY(r.avatar);
            await qU(U.concat(I))
        } catch (U) {
            U instanceof Error && U.message === "Failed to fetch" && Rj(U.message)
        }
    }
      , vkv = async function(Q, c, W, m) {
        W || (W = Date.now().toString());
        const K = c.channel?.offlineChannelData
          , T = {
            id: g.bX(c.videoId, "ytMainChannelEntity"),
            channelId: K.channelId,
            title: K.title,
            avatar: K.thumbnail
        }
          , r = {
            key: g.bX(c.videoId, "mainVideoDownloadStateEntity"),
            playbackData: g.bX(c.videoId, "playbackData"),
            addedTimestampMillis: W,
            videoDownloadContextEntity: g.bX(c.videoId, "videoDownloadContextEntity")
        }
          , U = {
            key: g.bX(c.videoId, "videoPlaybackPositionEntity"),
            videoId: c.videoId,
            lastPlaybackPositionSeconds: "0"
        };
        let I;
        Q.FI.X("html5_offline_playback_position_sync") && (I = {
            playbackPosition: U.key
        });
        W = g.bX(c.videoId, "mainVideoEntity");
        const X = {
            key: W,
            videoId: c.videoId,
            title: c.title,
            thumbnail: c.thumbnail,
            localizedStrings: {
                viewCount: c.shortViewCountText
            },
            userState: I,
            lengthSeconds: c.lengthSeconds ? Number(c.lengthSeconds) : void 0,
            publishedTimestampMillis: c.publishedTimestamp ? (Number(c.publishedTimestamp) * 1E3).toString() : void 0,
            formattedDescription: c.description,
            owner: T.id,
            downloadState: r.key
        };
        let A, e;
        Q.FI.X("woffle_enable_main_downloads_library") && m && (m = await zJa(Q.W, [W])) && (A = m.mainDownloadsLibraryEntity,
        e = m.mainDownloadsListEntity);
        let V;
        V = {
            key: g.bX(c.videoId, "downloadStatusEntity"),
            downloadState: "DOWNLOAD_STATE_PENDING_DOWNLOAD"
        };
        g.OE(r, g84, V);
        await g.Kr(Q.W, {
            mode: "readwrite",
            g3: !0
        }, B => {
            var n = g.WI(B, T, "ytMainChannelEntity")
              , S = g.WI(B, r, "mainVideoDownloadStateEntity");
            const d = g.WI(B, X, "mainVideoEntity");
            n = [n, S, d];
            Q.FI.X("html5_offline_playback_position_sync") && (S = g.WI(B, U, "videoPlaybackPositionEntity"),
            n.push(S));
            A && (S = g.WI(B, A, "mainDownloadsLibraryEntity"),
            n.push(S));
            e && (S = g.WI(B, e, "mainDownloadsListEntity"),
            n.push(S));
            V && (B = g.WI(B, V, "downloadStatusEntity"),
            n.push(B));
            return g.P8.all(n)
        }
        );
        return {
            mainVideoEntity: X,
            channelEntity: T
        }
    }
      , G9v = async function(Q, c) {
        const W = cQ(c)
          , m = [];
        var K = await f5.getInstance();
        let T, r;
        K && (T = await K.get("sdois"),
        r = await K?.get("lmqf"));
        try {
            if (T === void 0)
                throw Error("prefStorage or opt-in state is undefined");
            K = [];
            T || (K = await hJm(Q.W),
            K.reverse());
            if (K.length)
                for (const X of K) {
                    if (!X)
                        continue;
                    const A = g.w1(X).entityId
                      , e = await y8(Q.W, A);
                    e.offlineDeleteReason = "OFFLINE_DELETE_REASON_PARENT_LIST_DELETE";
                    await n5(A, Q.W, {
                        entityKey: X,
                        actionType: c.actionType
                    }, Q.A, e)
                }
            const U = await Kbv(T, r ?? "SD");
            await $N1(U);
            const I = uSm(U);
            Q.FI.X("woffle_enable_main_downloads_library") && (T || await iq(Q.W, g.xv),
            await NU(Q.W, [g.xv]));
            if (I?.length)
                for (const X of I) {
                    const A = X.actionType
                      , e = X.entityKey
                      , V = X.actionMetadata;
                    if (A && e && V && !g.l(V, aLa)) {
                        A === "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE" && (V.offlineLoggingData = {
                            offlineDeleteReason: "OFFLINE_DELETE_REASON_PARENT_LIST_DELETE"
                        });
                        const B = g.l(X.actionMetadata, QE);
                        B && (B.playlistId = "DOWNLOADS_LIST_ENTITY_ID_SMART_DOWNLOADS",
                        X.actionMetadata = {
                            ...X.actionMetadata,
                            mainVideoEntityActionMetadata: B
                        });
                        m.push(X)
                    }
                }
        } catch (U) {
            return Q = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
            c = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
            U instanceof g.fg && U.type === "QUOTA_EXCEEDED" && (Q = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
            c = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
            new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,Q,c)
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,m)
    }
      , $79 = async function(Q, c=43200, W=!0) {
        if (!Q.J.KU())
            return [];
        let m = [];
        try {
            m = await Wbo(c, W, !1)
        } catch (K) {
            K instanceof Error && K.message === "No data" || K instanceof Error && K.message === "Empty response body" && Rj(K.message)
        }
        return NM4(Q, m, W, "mainPlaylistEntity")
    }
      , P8v = async function(Q, c, W, m=!1) {
        let K = [];
        if (!await mKo() && !m)
            return [];
        W = await T9v(c, W);
        if (!W?.length)
            return [];
        c = {
            offlineDeleteReason: "OFFLINE_DELETE_REASON_PARENT_LIST_REFRESH"
        };
        for (const r of W) {
            W = r.actionType;
            var T = r.entityKey;
            m = r.actionMetadata;
            W && T && m && !g.l(m, aLa) && (W === "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE" && (m.offlineLoggingData = c),
            {entityId: T} = g.w1(T),
            W = await kL(Q, [T], "mainVideoEntity", W, m),
            K = K.concat(W))
        }
        return K
    }
      , uHo = async function(Q, c) {
        const W = cQ(c);
        var m = g.w1(c.entityKey).entityId;
        let K = [];
        try {
            K = await lLi(Q, m),
            K?.length && await EY(Q.W, c.entityKey)
        } catch (r) {
            return c = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
            m = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
            r instanceof g.fg && r.type === "QUOTA_EXCEEDED" && (c = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
            m = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
            new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,c,m)
        }
        const T = [];
        K = await Ir(Q.W, "musicTrack", K);
        if (K.length)
            for (const r of K)
                Q = r.offlineVideoData,
                Q?.videoId && T.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD", Q.videoId, "musicTrack", Number(c.actionMetadata?.priority || 0) + 1, cg, dJ(c, Q, m)));
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,T)
    }
      , hCD = async function(Q, c) {
        const W = cQ(c);
        var m = c.entityKey
          , K = g.w1(m).entityId
          , T = []
          , r = !1;
        K === "!*$_ALL_ENTITIES_!*$" ? (r = !0,
        T = await g.rx(Q.W, "musicAlbumRelease")) : (m = await $a(Q.W, m, "musicAlbumRelease")) && T.push(m);
        if (!T?.length)
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        if (r) {
            c = [];
            for (var U of T) {
                var I = g.w1(U.id).entityId;
                c.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH", I, "musicAlbumRelease", 0, cg))
            }
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,c)
        }
        U = [];
        T = T[0];
        r = void 0;
        T.downloadMetadata && (r = await $a(Q.W, T.downloadMetadata, "musicAlbumReleaseDownloadMetadataEntity"),
        r = Number(r?.addedTimestampMillis ?? "0") / 1E3);
        try {
            U = await lLi(Q, K, r?.toString())
        } catch (e) {
            if (e instanceof Error && e.message === "No data")
                await Fa(K, "musicAlbumRelease", Q.W, c, Q.A);
            else if (e instanceof Error && e.message === "Empty response body")
                Rj(e.message);
            else
                return c = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
                I = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
                e instanceof g.fg && e.type === "QUOTA_EXCEEDED" && (c = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
                I = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
                new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,c,I)
        }
        Q = [];
        K = new Map;
        if (U?.length)
            for (var X of U)
                U = X.offlineVideoData,
                U?.videoId && K.set(U.videoId, U);
        X = new Map;
        U = [];
        if (T?.tracks?.length)
            for (var A of T.tracks)
                if (T = g.w1(A).entityId)
                    K.has(T) ? (X.set(T, K.get(T)),
                    K.delete(T)) : U.push(T);
        A = Number(c.actionMetadata?.priority || 0) + 1;
        for (const [e,V] of K.entries())
            Q.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD", e, "musicTrack", A, cg, dJ(c, V)));
        for (const [e,V] of X.entries())
            Q.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH", e, "musicTrack", A, cg, dJ(c, V)));
        for (I of U)
            Q.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE", I, "musicTrack", 0, cg));
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,Q)
    }
      , zCv = async function(Q, c) {
        const W = cQ(c);
        try {
            const m = g.w1(c.entityKey).entityId;
            m === "!*$_ALL_ENTITIES_!*$" ? await Zs(Q.W, c, Q.A) : (await Fa(m, "musicAlbumRelease", Q.W, c, Q.A),
            await sY(Q.W, c.entityKey))
        } catch (m) {
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,"OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
    }
      , lLi = async function(Q, c, W) {
        c = await wJ([c]);
        Q = await C8a(Q, c[0], W);
        Q = UY(Q.thumbnailDetails);
        await qU(Q);
        return c[0].videos
    }
      , C8a = async function(Q, c, W) {
        var m = c.additionalMetadadatas;
        let K = void 0;
        if (m && m.length > 0)
            for (var T of m)
                if (T.offlineMusicPlaylistData) {
                    K = T.offlineMusicPlaylistData;
                    break
                }
        m = c.playlistId;
        const {gp: r, kJ: U} = kd4(c);
        W = W ? (Number(W) * 1E3).toString() : Date.now().toString();
        T = c.lastModifiedTimestamp ? (Number(c.lastModifiedTimestamp) * 1E3).toString() : "0";
        const I = {
            id: g.bX(m, "musicAlbumReleaseDownloadMetadataEntity"),
            trackDownloadMetadatas: U,
            lastModifiedTimestampMillis: T,
            addedTimestampMillis: W,
            syncState: "DOWNLOAD_SYNC_STATE_UP_TO_DATE"
        }
          , X = {
            id: g.bX(m, "musicAlbumRelease"),
            title: c.title,
            audioPlaylistId: m,
            trackCount: c.totalVideoCount,
            tracks: r,
            downloadMetadata: I.id
        };
        K && (X.thumbnailDetails = K.albumHqThumbnail ?? K.albumArtistThumbnail,
        X.artistDisplayName = K.albumArtistDisplayName,
        X.releaseDate = K.albumReleaseDate,
        X.contentRating = {
            explicitType: K.albumReleaseExplicitType
        },
        X.releaseType = K.albumReleaseType);
        await g.Kr(Q.W, {
            mode: "readwrite",
            g3: !0
        }, A => {
            const e = g.WI(A, X, "musicAlbumRelease");
            A = g.WI(A, I, "musicAlbumReleaseDownloadMetadataEntity");
            return g.P8.all([e, A])
        }
        );
        return X
    }
      , J_W = async function(Q, c) {
        const W = cQ(c);
        var m = g.w1(c.entityKey).entityId;
        let K = [];
        try {
            K = await Mqo(Q, m),
            K?.length && await EY(Q.W, c.entityKey)
        } catch (r) {
            return c = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
            m = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
            r instanceof g.fg && r.type === "QUOTA_EXCEEDED" && (c = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
            m = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
            new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,c,m)
        }
        const T = [];
        K = await Ir(Q.W, "musicTrack", K);
        if (K.length)
            for (const r of K)
                Q = r.offlineVideoData,
                Q?.videoId && T.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD", Q.videoId, "musicTrack", Number(c.actionMetadata?.priority || 0) + 1, Wg, dJ(c, Q, m)));
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,T)
    }
      , RC4 = async function(Q, c) {
        const W = cQ(c);
        var m = c.entityKey
          , K = g.w1(m).entityId
          , T = []
          , r = !1;
        K === "!*$_ALL_ENTITIES_!*$" ? (r = !0,
        T = await g.rx(Q.W, "musicPlaylist")) : (m = await $a(Q.W, m, "musicPlaylist")) && T.push(m);
        if (!T?.length)
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        const U = g.l(c.actionMetadata, YJa)?.autoSync;
        let I = []
          , X = !0;
        m = !0;
        let A = !1;
        var e = void 0;
        if (r || U !== !1) {
            try {
                I = await oEH(0, !!U, !0, T)
            } catch (d) {
                d instanceof Error && d.message === "No data" ? K === "!*$_ALL_ENTITIES_!*$" ? await Zs(Q.W, c, Q.A) : await Fa(K, "musicPlaylist", Q.W, c, Q.A) : d instanceof Error && d.message === "Empty response body" && Rj(d.message)
            }
            if (!I.length || !r && I[0].playlistId !== K)
                return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
        }
        if (r) {
            c = [];
            for (var V of I)
                V.upToDate || U && !V.shouldAutoSyncMetadata || !V.playlistId || c.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH", V.playlistId, "musicPlaylist", 0, Wg, {
                    musicPlaylistEntityActionMetadata: {
                        autoSync: U
                    }
                }));
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,c)
        }
        I.length && (V = I[0],
        A = !!V.upToDate,
        U && (X = V.shouldAutoSyncMetadata ?? !0,
        m = V.shouldAutoSyncVideos ?? !0,
        V.checkInSeconds && (e = V.checkInSeconds)));
        if (A || !X)
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        V = [];
        T = T[0];
        r = void 0;
        T.downloadMetadata && (r = await $a(Q.W, T.downloadMetadata, "musicPlaylistDownloadMetadataEntity"),
        r = Number(r?.addedTimestampMillis ?? "0") / 1E3);
        try {
            V = await Mqo(Q, K, r?.toString(), e)
        } catch (d) {
            if (d instanceof Error && d.message === "No data")
                await Fa(K, "musicPlaylist", Q.W, c, Q.A);
            else if (d instanceof Error && d.message === "Empty response body")
                Rj(d.message);
            else {
                c = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN";
                var B = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED";
                d instanceof g.fg && d.type === "QUOTA_EXCEEDED" && (c = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
                B = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE");
                return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,c,B)
            }
        }
        if (!m)
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        Q = [];
        K = new Map;
        if (V?.length)
            for (var n of V)
                m = n.offlineVideoData,
                m?.videoId && K.set(m.videoId, m);
        n = new Map;
        m = [];
        if (T?.tracks?.length)
            for (var S of T.tracks)
                if (e = g.w1(S).entityId)
                    K.has(e) ? (n.set(e, K.get(e)),
                    K.delete(e)) : m.push(e);
        S = Number(c.actionMetadata?.priority || 0) + 1;
        for (const [d,b] of K.entries())
            Q.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD", d, "musicTrack", S, Wg, dJ(c, b)));
        for (const [d,b] of n.entries())
            Q.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH", d, "musicTrack", S, Wg, dJ(c, b)));
        for (B of m)
            Q.push(bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE", B, "musicTrack", 0, Wg));
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,Q)
    }
      , k9H = async function(Q, c) {
        const W = cQ(c);
        try {
            const m = g.w1(c.entityKey).entityId;
            m === "!*$_ALL_ENTITIES_!*$" ? await Zs(Q.W, c, Q.A) : (await Fa(m, "musicPlaylist", Q.W, c, Q.A),
            await sY(Q.W, c.entityKey))
        } catch (m) {
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,"OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
    }
      , Mqo = async function(Q, c, W, m) {
        c = await wJ([c]);
        Q = await YW0(Q, c[0], W, m);
        Q = UY(Q.thumbnailDetails);
        await qU(Q);
        return c[0].videos
    }
      , YW0 = async function(Q, c, W, m) {
        const K = c.playlistId
          , {gp: T, kJ: r} = kd4(c);
        W = W ? (Number(W) * 1E3).toString() : Date.now().toString();
        const U = c.lastModifiedTimestamp ? (Number(c.lastModifiedTimestamp) * 1E3).toString() : "0"
          , I = {
            id: g.bX(K, "musicPlaylistDownloadMetadataEntity"),
            trackDownloadMetadatas: r,
            lastModifiedTimestampMillis: U,
            addedTimestampMillis: W,
            syncState: "DOWNLOAD_SYNC_STATE_UP_TO_DATE"
        }
          , X = {
            id: g.bX(K, "musicPlaylist"),
            title: c.title,
            playlistId: K,
            thumbnailDetails: c.thumbnail,
            visibility: p5v(c),
            trackCount: c.totalVideoCount,
            tracks: T,
            downloadMetadata: I.id
        };
        m && (X?.entityMetadata ? X.entityMetadata.nextAutoRefreshIntervalSeconds = String(m) : X && (X.entityMetadata = {
            nextAutoRefreshIntervalSeconds: String(m)
        }));
        await g.Kr(Q.W, {
            mode: "readwrite",
            g3: !0
        }, A => {
            const e = g.WI(A, X, "musicPlaylist");
            A = g.WI(A, I, "musicPlaylistDownloadMetadataEntity");
            return g.P8.all([e, A])
        }
        );
        return X
    }
      , p5v = function(Q) {
        switch (Q.privacy) {
        case "PRIVATE":
            return "PLAYLIST_ENTITY_VISIBILITY_PRIVATE";
        case "PUBLIC":
            return "PLAYLIST_ENTITY_VISIBILITY_PUBLIC";
        case "UNLISTED":
            return "PLAYLIST_ENTITY_VISIBILITY_UNLISTED";
        default:
            return "PLAYLIST_ENTITY_VISIBILITY_UNKNOWN"
        }
    }
      , Wnv = async function(Q, c) {
        const W = cQ(c);
        var m = g.w1(c.entityKey).entityId;
        const K = g.l(c.actionMetadata, m2);
        try {
            await Qp4(Q, m, void 0, K?.track, K?.albumRelease),
            K?.playlistId || await EY(Q.W, c.entityKey)
        } catch (T) {
            return c = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
            m = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
            T instanceof g.fg && T.type === "QUOTA_EXCEEDED" && (c = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
            m = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
            new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,c,m)
        }
        Q = (Q = g.l(c.actionMetadata, m2)) ? {
            playbackDataActionMetadata: {
                maximumDownloadQuality: Q.maximumDownloadQuality
            }
        } : void 0;
        c = bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD", m, "playbackData", Number(c.actionMetadata?.priority || 0) + 1, c3i, Q);
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,[c])
    }
      , mjm = async function(Q, c) {
        const W = cQ(c)
          , m = g.w1(c.entityKey).entityId;
        var K = await $a(Q.W, c.entityKey, "musicTrack");
        const T = K ? await $a(Q.W, K.downloadMetadata, "musicTrackDownloadMetadataEntity") : void 0;
        if (!K || !T)
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W);
        let r;
        K = g.l(c.actionMetadata, m2);
        try {
            await Qp4(Q, m, T.addedTimestampMillis, K?.track, K?.albumRelease),
            r = bq("OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH", m, "playbackData", Number(c.actionMetadata?.priority || 0) + 1, c3i)
        } catch (U) {
            if (U instanceof Error && U.message === "No data")
                await Ss(m, Q.W, c, Q.A);
            else if (U instanceof Error && U.message === "Empty response body")
                Rj(U.message);
            else
                return Q = "OFFLINE_OPERATION_FAILURE_REASON_UNKNOWN",
                c = "OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED",
                U instanceof g.fg && U.type === "QUOTA_EXCEEDED" && (Q = "OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED",
                c = "OFFLINE_ORCHESTRATION_FAILURE_REASON_NO_STORAGE"),
                new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,Q,c)
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W,r ? [r] : void 0)
    }
      , Knm = async function(Q, c) {
        const W = cQ(c);
        try {
            const m = g.w1(c.entityKey).entityId;
            m === "!*$_ALL_ENTITIES_!*$" ? await Zs(Q.W, c, Q.A) : (await Ss(m, Q.W, c, Q.A),
            await sY(Q.W, c.entityKey))
        } catch (m) {
            return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_FAILURE",W,void 0,"OFFLINE_OPERATION_FAILURE_REASON_DATABASE_REQUEST_FAILED","OFFLINE_ORCHESTRATION_FAILURE_REASON_DATABASE_OPERATION_FAILED")
        }
        return new OY("OFFLINE_ORCHESTRATION_ACTION_RESULT_SUCCESS",W)
    }
      , Qp4 = async function(Q, c, W, m, K) {
        m || (m = (await Qw9([c]))[0],
        m = RJ0(m));
        const {musicTrackEntity: T, bK: r} = await T51(Q, m, c, K, W);
        Q = UY(T.thumbnailDetails);
        c = [];
        r && (c = UY(r.thumbnailDetails));
        await qU(Q.concat(c))
    }
      , VN9 = async function(Q, c, W) {
        var m = g.nr()
          , K = W.refreshData
          , T = W.isEnqueuedForExpiredStreamUrlRefetch
          , r = W.tS
          , U = W.offlineSourceData;
        W = W.mediaCapabilities;
        Q = {
            entityKey: Q
        };
        K && (Q.refreshData = K);
        T && (Q.isExpiredStreamUrlRefetch = T);
        r && (Q.downloadParameters = r);
        U && (Q.offlineSourceData = U);
        c = {
            context: g.Bt(c),
            signatureTimestamp: 20536,
            videos: [Q]
        };
        W && (c.mediaCapabilities = W);
        K = g.vu(oN9);
        try {
            var I = await g.$h(m, c, K, void 0, {
                dR: !0
            })
        } catch (X) {
            if (X instanceof g.A1)
                throw I = `GetPDE network manager error: ${X.message}`,
                Rj(I, X),
                Error(I);
            Rj("GetPDE fetch request error", X);
            throw Error("GetPDE fetch request error");
        }
        m = I.errorMetadata?.status;
        if (I)
            m !== void 0 && L5(m, "PDE");
        else
            throw Rj("Network request failed for PDE"),
            Error("Network request failed for PDE");
        return I
    }
      , T51 = async function(Q, c, W, m, K) {
        K || (K = Date.now().toString());
        const T = {
            id: g.bX(W, "musicTrackDownloadMetadataEntity"),
            playbackData: g.bX(W, "playbackData"),
            addedTimestampMillis: K,
            videoDownloadContextEntity: g.bX(W, "videoDownloadContextEntity")
        };
        m && (c.albumRelease = m.id);
        await g.Kr(Q.W, {
            mode: "readwrite",
            g3: !0
        }, r => {
            const U = [];
            var I = g.WI(r, T, "musicTrackDownloadMetadataEntity");
            U.push(I);
            I = g.WI(r, c, "musicTrack");
            U.push(I);
            m && (r = g.WI(r, m, "musicAlbumRelease"),
            U.push(r));
            return g.P8.all(U)
        }
        );
        await TB(W, "musicTrackDownloadMetadataEntity", Q.W, "DOWNLOAD_STATE_PENDING_DOWNLOAD");
        return {
            musicTrackEntity: c,
            bK: m
        }
    }
      , r39 = async function(Q, c=43200, W=!0) {
        if (!Q.J.KU())
            return [];
        let m = [];
        try {
            m = await oEH(c, W, !1)
        } catch (K) {}
        return NM4(Q, m, W, "musicPlaylist")
    }
      , Ujv = function(Q) {
        let c;
        Q = g.l(Q.getWatchNextResponse()?.currentVideoEndpoint, g.nl);
        Q?.playlistId && (c = Q.playlistId);
        return c
    }
      , IxW = async function(Q, c) {
        const W = c.clientPlaybackNonce
          , m = {
            cpn: W,
            offlineSourceVisualElement: g.Bo(c.S || "").getAsJson(),
            selectedOfflineMode: "OFFLINE_NOW",
            isPartialPlayback: !1
        };
        c.O && (m.videoFmt = Number(c.O.itag));
        c.j && (m.audioFmt = Number(c.j.itag));
        const K = Ujv(c);
        var T;
        if (T = K && c.videoId)
            c = c.videoId,
            T = await (K !== "PPSV" ? Promise.resolve(!1) : Q.W.T2(c));
        T && (m.selectedOfflineMode = "OFFLINE_MODE_TYPE_AUTO_OFFLINE");
        Q.O = W;
        g.eG("offlinePlaybackStarted", m)
    };
    g.N0.prototype.xa = g.W3(42, function(Q) {
        return this.app.xa(Q)
    });
    g.Iy.prototype.xa = g.W3(41, function(Q) {
        return g.PGw(this, 9, Q)
    });
    var rfD = ["browse", "music/browse", "streaming_browse", "unplugged/browse"]
      , XNH = ["offline/playlist_sync_check"]
      , phm = ["offline"]
      , UKD = ["offline/offline_video_playback_position_sync"]
      , oN9 = ["offline/get_playback_data_entity"]
      , f5 = class {
        constructor(Q) {
            this.token = Q
        }
        static async getInstance() {
            return new Promise(Q => {
                g.AD().then(c => {
                    c ? (f5.instance || (f5.instance = new f5(c)),
                    Q(f5.instance)) : Q(void 0)
                }
                )
            }
            )
        }
        async get(Q) {
            if (Q = await (await PK(this.token)).get("prefs", Q)) {
                var c = (0,
                g.h)();
                return Q.expirationTimestampMs <= c ? void 0 : Q.value
            }
        }
        async set(Q, c, W=31536E3) {
            const m = (0,
            g.h)();
            Q = {
                key: Q,
                value: c,
                expirationTimestampMs: m + W * 1E3
            };
            await (await PK(this.token)).put("prefs", Q)
        }
        async remove(Q) {
            await (await PK(this.token)).delete("prefs", Q)
        }
    }
      , P_H = new g.Y("elementsCommand");
    var HQ = new g.Y("entityBatchUpdate");
    var g84 = new g.Y("downloadStatusEntity");
    var F_4 = new g.Y("mainPlaylistEntityActionMetadata");
    var QE = new g.Y("mainVideoEntityActionMetadata");
    var YJa = new g.Y("musicPlaylistEntityActionMetadata");
    var m2 = new g.Y("musicTrackEntityActionMetadata");
    var l99 = new g.Y("offlineOrchestrationActionCommand");
    var aLa = new g.Y("localImageEntityActionMetadata");
    var js = new g.Y("playbackDataActionMetadata");
    var Lbv = new g.Y("transferEntityActionMetadata");
    var H4m = new g.Y("videoPlaybackPositionEntityActionMetadata");
    var qJW = class {
        constructor() {
            this.W = new Map
        }
    }
    , uT;
    new g.id;
    new g.id;
    var Nsa = class {
        constructor() {
            this.locks = navigator.locks
        }
        request(Q, c={}, W) {
            return this.locks.request(Q, c, m => W(m))
        }
    }
    ;
    var CB = g.qX.caches, zI, Mk, Xs9 = class {
        open(Q) {
            return CB.open(hX(Q))
        }
        has(Q) {
            return CB.has(hX(Q))
        }
        delete(Q) {
            return CB.delete(hX(Q))
        }
        async match(Q, c) {
            var W = await this.keys();
            for (const m of W)
                if (W = await (await this.open(m)).match(Q, c))
                    return W
        }
    }
    , SJ9 = class extends Xs9 {
        async keys() {
            const Q = []
              , c = g.Dk("CacheStorage keys");
            var W = await CB.keys();
            for (const m of W) {
                W = m.indexOf(":");
                const {h5: K, datasyncId: T} = W === -1 ? {
                    h5: m
                } : {
                    h5: m.substring(0, W),
                    datasyncId: m.substring(W + 1)
                };
                T === c && Q.push(K)
            }
            return Q
        }
    }
    ;
    var A31 = class extends g.qK {
        constructor(Q) {
            super();
            this.api = Q;
            this.Rk = {
                I50: () => this.W,
                XGG: () => this.O
            };
            typeof g.qX.BroadcastChannel !== "undefined" && (this.W = new g.qX.BroadcastChannel(`PLAYER_OFFLINE_ERROR_SYNC:${g.Dk()}`),
            this.W.onmessage = this.A.bind(this),
            this.O = new g.qX.BroadcastChannel(`PLAYER_OFFLINE_PAUSE_SYNC:${g.Dk()}`),
            this.O.onmessage = this.j.bind(this))
        }
        A(Q) {
            g.xt(this.api, "onOfflineOperationFailure", Q.data)
        }
        j(Q) {
            this.api.publish("offlinetransferpause", Q.data)
        }
        WA() {
            this.W?.close();
            this.O?.close()
        }
    }
    ;
    var e3Z = class {
        constructor(Q, c, W) {
            this.L = Q;
            this.Y = c;
            this.visibility = W;
            this.K = this.J = this.D = this.A = this.W = !1;
            this.j = new g.Uc( () => {
                this.j_()
            }
            );
            this.Rk = {
                L0: () => this.O,
                j_: () => {
                    this.j_()
                }
                ,
                cFA: () => this.j
            };
            this.visibility.subscribe("visibilitystatechange", () => {
                this.xs()
            }
            )
        }
        xs() {
            this.W && Ya(this)
        }
        j_() {
            this.O && this.O.resolve();
            this.A = this.W = !1;
            this.Y()
        }
    }
    ;
    var Cn9 = ["OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD", "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH"];
    var es = class {
        constructor(Q, c, W, m, K=c, T, r, U, I, X, A) {
            this.entityType = Q;
            this.actionId = c;
            this.action = W;
            this.parentActionId = m;
            this.rootActionId = K;
            this.childActionIds = T;
            this.prereqActionId = r;
            this.postreqActionIds = U;
            this.hasChildActionFailed = X;
            this.retryScheduleIndex = 0;
            this.W = A || Date.now();
            this.retryScheduleIndex = I || 0
        }
    }
    ;
    var Gd9 = "captionTrack downloadStatusEntity ytMainChannelEntity mainPlaylistEntity mainPlaylistDownloadStateEntity mainPlaylistVideoEntity mainVideoEntity mainVideoDownloadStateEntity offlineVideoPolicy offlineVideoStreams playbackData transfer videoDownloadContextEntity videoPlaybackPositionEntity".split(" ");
    var JF9 = "downloadStatusEntity musicAlbumRelease musicDownloadsLibraryEntity musicPlaylist musicTrack musicTrackDownloadMetadataEntity offlineVideoPolicy offlineVideoStreams playbackData transfer videoDownloadContextEntity".split(" ");
    var Kx = class {
        constructor(Q) {
            this.W = Q
        }
    }
      , OY = class {
        constructor(Q, c, W, m, K, T) {
            this.status = Q;
            this.W = c;
            this.j = W;
            this.O = m;
            this.A = K;
            this.downloadState = T
        }
    }
    ;
    var Vvm = class extends Kx {
        constructor(Q, c, W) {
            super(Q);
            this.W = Q;
            this.FI = c;
            this.A = W
        }
        O(Q) {
            return WQ(Q) ? xKS(this, Q) : mJ(Q) ? DK1(this, Q) : Promise.reject(Error(`Unsupported action type: ${Q.actionType}`))
        }
    }
    ;
    var B5a = class extends Kx {
        constructor(Q, c) {
            super(Q);
            this.W = Q;
            this.FI = c
        }
        O(Q) {
            return mJ(Q) ? tN1(this, Q) : jki(Q) ? N90(this, Q) : K5(Q) ? i44(this, Q) : Promise.reject(Error(`Unsupported action type: ${Q.actionType}`))
        }
    }
    ;
    var xj1 = class {
        constructor(Q, c) {
            this.api = Q;
            this.W = c;
            this.logger = new g.JY("woffle");
            this.O = !1;
            this.Rk = {
                JC: this.JC
            }
        }
        async j(Q) {
            if (Q.state.W(128)) {
                const c = Q.state.Dr;
                Q = c?.errorCode;
                Q = Q === "net.connect" && c?.Ia === 1 ? "TRANSFER_FAILURE_REASON_NETWORK_LOST" : Q?.startsWith("net.") ? "TRANSFER_FAILURE_REASON_NETWORK" : "TRANSFER_FAILURE_REASON_INTERNAL";
                await this.tf(this.player.getVideoData().videoId, Q)
            }
        }
        async tf(Q, c) {
            this.O || (this.O = !0,
            c === "TRANSFER_FAILURE_REASON_NETWORK_LOST" ? GB(this, Q, !1, !0) : (await ar(this, Q),
            g.Kl(Q, 4),
            await this.W.tf(c)))
        }
        FK(Q) {
            Q.status === 2 ? (Q.status !== this.A && (Ja(this.W),
            g.Kl(Q.videoId, 2)),
            Q.Em && m70(this.W, Q.videoId, Q.Em)) : Q.status === 4 ? (ar(this, Q.videoId),
            this.tf(Q.videoId, Q.yS ? "TRANSFER_FAILURE_REASON_FILESYSTEM_WRITE" : "TRANSFER_FAILURE_REASON_INTERNAL")) : Q.status === 1 && TM0(this.W);
            this.A = Q.status;
            g.xt(this.api, "localmediachange", {
                videoId: Q.videoId,
                status: Q.status
            })
        }
        async F4() {
            if (!this.O) {
                this.O = !0;
                var Q = this.player.getVideoData().videoId;
                await ar(this, Q);
                await this.W.F4()
            }
        }
        JC(Q) {
            switch (Q) {
            case "HD_1080":
                return "hd1080";
            case "HD":
                return "hd720";
            case "SD":
                return "large";
            case "LD":
                return "tiny";
            default:
                return "hd720"
            }
        }
        X(Q) {
            return this.api.G().X(Q)
        }
    }
    ;
    var qN9 = class extends Kx {
        constructor(Q, c) {
            super(Q);
            this.W = Q;
            this.FI = c
        }
        O(Q) {
            return WQ(Q) ? EE9(this, Q) : mJ(Q) ? sw9(this, Q) : jki(Q) ? dKa(this, Q) : Promise.reject(Error(`Unsupported action type: ${Q.actionType}`))
        }
    }
    ;
    var nNW = class {
        constructor() {
            this.actions = []
        }
        W(Q, c) {
            let W = Q.action.actionMetadata.priority - c.action.actionMetadata.priority;
            W === 0 && (Q.W < c.W ? W = -1 : Q.W > c.W && (W = 1));
            return W
        }
    }
    ;
    var f5D = class extends g.qK {
        constructor(Q, c, W, m, K) {
            super();
            this.O = Q;
            this.b0 = c;
            this.mF = W;
            this.J = m;
            this.FI = K;
            this.W = new nNW;
            this.D = new g.$p;
            this.A = new g.Uc( () => {
                this.retry()
            }
            );
            this.L = NaN;
            this.K = !1;
            this.Rk = {
                s8e: () => this.W,
                vH: () => this.D,
                BHI: () => this.A,
                retry: () => this.retry()
            };
            g.F(this, this.A);
            this.Y = this.O.observe(this.S.bind(this))
        }
        WA() {
            this.Y && this.Y();
            super.WA()
        }
        createAction(Q, c) {
            const W = g.w1(Q.entityKey).entityType
              , m = g.Ab(16);
            return new es(W,m,Q,c.actionId,c.rootActionId)
        }
        async S(Q) {
            if (!this.u0()) {
                var c = Q.offlineOrchestrationActionWrapperEntity ?? new Set;
                Q = [];
                for (var W of c)
                    ({entityId: c} = g.w1(W)),
                    O40(this.W, c) || Q.push(W);
                W = await h6D(this, Q);
                await lq(this, W)
            }
        }
        async retry() {
            await Jfa(this)
        }
    }
    ;
    var DjW = class {
        constructor(Q) {
            this.ge = Q;
            this.W = void 0
        }
        async Kw(Q, c=!0) {
            if (this.W) {
                var W = []
                  , m = g.H6(this.W.W, c)
                  , K = [];
                for (let T = 0; T < m.length; T++)
                    c = this.W.D(m[T], "json3"),
                    c = g.o2(c, {
                        withCredentials: !0,
                        format: "RAW"
                    }, 3, 500).then(r => {
                        r = {
                            metadata: g.H2(m[T]),
                            trackData: r.xhr.responseText
                        };
                        K.push(r)
                    }
                    ).fF(r => {
                        Rj("Caption fetch error", r)
                    }
                    ),
                    W.push(c);
                await WgW(W);
                try {
                    await Xha(Q, K)
                } catch (T) {
                    Rj("Caption DB transaction error", T)
                }
            }
        }
    }
    ;
    var tvH = class extends g.qK {
        constructor(Q) {
            super();
            this.W = Q;
            this.O = this.W.observe(this.A.bind(this))
        }
        WA() {
            this.O && this.O();
            super.WA()
        }
        async A(Q) {
            var c = Q.transfer ?? new Set;
            Q = [];
            for (const W of c)
                ({entityId: c} = g.w1(W)),
                Q.push(c);
            Q.length !== 0 && await YF4(this, Q)
        }
    }
    ;
    var nkZ = class extends g.qK {
        constructor(Q, c, W, m) {
            super();
            this.O = Q;
            this.api = c;
            this.PA = W;
            this.S = m;
            this.D = new g.$p;
            this.j = new g.Uc( () => {
                this.W && this.W.transferState === "TRANSFER_STATE_TRANSFERRING" && this.D.KU() && ((this.W.transferRetryCount || 0) < 3 ? GB(this.J, this.K, !1, !1) : ar(this.J, this.K.videoDetails.videoId),
                this.tf("TRANSFER_FAILURE_REASON_TIMEOUT_NO_PROGRESS"))
            }
            );
            this.mF = this.Ie = 0;
            this.Y = this.L = !1;
            this.XI = g.Um(this.api.G().experiments, "html5_transfer_processing_logs_interval");
            this.jG = new g.db(this);
            this.Rk = {
                ERF: () => this.j,
                qGG: () => this.S,
                vH: () => this.D
            };
            this.b0 = this.O.observe(this.UH.bind(this));
            this.J = new xj1(c,this);
            this.HA = new DjW(c);
            this.T2 = new tvH(this.O);
            this.Ka = this.D.listen("publicytnetworkstatus-online", this.jV.bind(this));
            this.MM = this.D.listen("publicytnetworkstatus-offline", this.JJ.bind(this));
            this.Y = this.api.G().X("html5_less_transfer_processing_logs");
            g.F(this, this.jG);
            this.jG.B(c, "offlinetransferpause", this.La);
            if (g.rT(this.api.G()))
                this.A = "mainVideoDownloadStateEntity";
            else if (g.uL(this.api.G()) || g.EQ(this.api.G()))
                this.A = "musicTrackDownloadMetadataEntity"
        }
        WA() {
            this.b0 && this.b0();
            this.T2.dispose();
            this.j.dispose();
            this.Ka && g.Fh(this.D.W5, this.Ka);
            this.MM && g.Fh(this.D.W5, this.MM);
            super.WA()
        }
        async La(Q) {
            const c = g.bX(Q, "transfer");
            if (this.W && c === this.W.key)
                GB(this.J, this.K, !0),
                this.j.stop();
            else {
                const W = await g.Kr(this.O, {
                    mode: "readwrite",
                    g3: !0
                }, m => g.Yf(m, c, "transfer").then(K => {
                    if (K && K.transferState !== "TRANSFER_STATE_COMPLETE" && K.transferState !== "TRANSFER_STATE_FAILED")
                        return K.transferState = "TRANSFER_STATE_PAUSED_BY_USER",
                        g.WI(m, K, "transfer").then( () => K)
                }
                ));
                if (W) {
                    Q && this.A && await TB(Q, this.A, this.O, "DOWNLOAD_STATE_PAUSED");
                    const m = await ha(this, Q);
                    wh4({
                        videoId: Q,
                        o_: W,
                        offlineModeType: m
                    })
                }
            }
        }
        JJ() {
            if (this.W && this.K) {
                GB(this.J, this.K, !1);
                const Q = this.W
                  , c = Q?.key ? g.w1(Q.key).entityId : "";
                c && this.A && (new Promise( (W, m) => {
                    TB(c, this.A, this.O, "DOWNLOAD_STATE_PAUSED").catch(K => {
                        m(K)
                    }
                    )
                }
                )).catch(W => {
                    Rj("Download state setting error", W)
                }
                )
            }
            this.j.stop()
        }
        jV() {
            this.W ? eC4(this, this.W) : MU(this)
        }
        async UH(Q) {
            if (this.W && (this.W.transferState !== "TRANSFER_STATE_COMPLETE" && this.W.transferState !== "TRANSFER_STATE_FAILED" && Q.transfer && Q.transfer.has(this.W.key) && ((this.W = await $a(this.O, this.W.key, "transfer")) || await Vqo(this)),
            this.W))
                return;
            await MU(this)
        }
        async tf(Q, c) {
            if (this.W) {
                var W = this.W;
                const K = W?.key ? g.w1(W.key).entityId : "";
                a: switch (Q) {
                case "TRANSFER_FAILURE_REASON_FILESYSTEM_WRITE":
                case "TRANSFER_FAILURE_REASON_EXTERNAL_FILESYSTEM_WRITE":
                case "TRANSFER_FAILURE_REASON_PLAYABILITY":
                case "TRANSFER_FAILURE_REASON_TOO_MANY_RETRIES":
                    var m = !1;
                    break a;
                default:
                    m = !0
                }
                m && BM9(this) ? (await uq(this, "TRANSFER_STATE_TRANSFER_IN_QUEUE"),
                Q = await ha(this, K),
                Q8({
                    transferStatusType: "TRANSFER_STATUS_TYPE_REENQUEUED_BY_RETRY"
                }, {
                    videoId: K,
                    o_: W,
                    offlineModeType: Q
                }),
                K && this.A && await TB(K, this.A, this.O, "DOWNLOAD_STATE_RETRYABLE_FAILURE")) : (await x7m(this, Q),
                K && this.A && await TB(K, this.A, this.O, "DOWNLOAD_STATE_FAILED"))
            } else
                zB(this, `onTransferFailure: ${Q}`);
            C5(this);
            W = MU(this, !0);
            c && c(W)
        }
        async F4(Q) {
            if (this.W)
                if (BM9(this)) {
                    await uq(this, "TRANSFER_STATE_WAITING_FOR_PLAYER_RESPONSE_REFRESH");
                    this.W || zB(this, "onMaybeTransferStreamsExpiredRetryAttempting");
                    var c = this.W
                      , W = c?.key ? g.w1(c.key).entityId : ""
                      , m = await ha(this, W);
                    Q8({
                        transferStatusType: "TRANSFER_STATUS_TYPE_DEQUEUED_BY_PLAYER_RESPONSE_EXPIRATION"
                    }, {
                        videoId: W,
                        o_: c,
                        offlineModeType: m
                    });
                    c = Aa();
                    g.OE(c, js, {
                        isEnqueuedForExpiredStreamUrlRefetch: !0
                    });
                    m = g.bX(W, "playbackData");
                    W = BQ(new es("playbackData",W,{
                        actionType: "OFFLINE_ORCHESTRATION_ACTION_TYPE_ADD",
                        entityKey: m,
                        actionMetadata: c
                    }));
                    await g.TA(this.O, W, "offlineOrchestrationActionWrapperEntity")
                } else
                    await x7m(this, "TRANSFER_FAILURE_REASON_STREAM_MISSING"),
                    this.A && (W = this.W,
                    (W = W?.key ? g.w1(W.key).entityId : "") && await TB(W, this.A, this.O, "DOWNLOAD_STATE_FAILED"));
            else
                zB(this, "onMaybeTransferStreamsExpired");
            C5(this);
            W = MU(this, !0);
            Q && Q(W)
        }
    }
      , Rr = {
        TRANSFER_STATE_TRANSFERRING: 1,
        TRANSFER_STATE_TRANSFER_IN_QUEUE: 2
    };
    var HdD = class {
        constructor(Q, c) {
            this.FI = Q;
            this.api = c;
            this.J = new g.$p;
            this.K = new g.id;
            this.Rk = {
                L0: () => this.A.Rk.L0(),
                vH: () => this.J,
                rFa: () => this.A,
                Jz: () => this.Jz(),
                df: () => this.df(),
                Gq: () => this.Gq(),
                pm: () => this.pm(),
                W6: () => this.W6(),
                Rn: W => this.Rn(W)
            };
            this.A = new e3Z( () => qW4(this), () => {
                this.Gq()
            }
            ,this.api.OV(),this.api.X.bind(this.api));
            this.W = new A31(this.api);
            Zji(this.A)
        }
        Jz() {
            return this.K.promise
        }
        df() {
            if (this.O && this.L)
                return this.K.promise;
            tqm(this).then(this.K.resolve).catch(this.K.reject);
            return this.K.promise
        }
        D(Q) {
            return {
                playbackData: new Vvm(Q,this.FI,this.W),
                transfer: new qN9(Q,this.FI),
                videoPlaybackPositionEntity: new B5a(Q,this.FI)
            }
        }
        async pm() {
            this.O && await okW(this.O)
        }
        async Gq() {
            if (this.O || this.L)
                await this.Jz(),
                this.mF !== void 0 && (g.Rx(this.mF),
                this.mF = void 0),
                this.j !== void 0 && (g.Rx(this.j),
                this.j = void 0),
                this.O?.dispose(),
                this.O = void 0,
                this.L?.dispose(),
                this.L = void 0,
                g.xt(this.api, "onOrchestrationLostLeader"),
                this.K = new g.id
        }
        isOrchestrationLeader() {
            return this.A.W
        }
        async T2() {
            return !1
        }
        uq(Q) {
            var c = this.W;
            c.api.publish("offlinetransferpause", Q);
            c.O?.postMessage(Q)
        }
        async jV(Q) {
            const c = await g.Iz();
            if (c) {
                var W = g.bX(Q, "transfer");
                await g.Kr(c, {
                    mode: "readwrite",
                    g3: !0
                }, m => {
                    const K = g.Yf(m, W, "transfer")
                      , T = g.Yf(m, g.bX(Q, "videoDownloadContextEntity"), "videoDownloadContextEntity");
                    return g.P8.all([K, T]).then( ([r,U]) => r && r.transferState === "TRANSFER_STATE_PAUSED_BY_USER" ? (r.transferState = "TRANSFER_STATE_TRANSFER_IN_QUEUE",
                    g.WI(m, r, "transfer").then( () => {
                        Q8({
                            transferStatusType: "TRANSFER_STATUS_TYPE_REENQUEUED_BY_USER_RESUME",
                            statusType: "USER_RESUMED"
                        }, {
                            videoId: Q,
                            o_: r,
                            offlineModeType: U?.offlineModeType
                        });
                        return g.P8.resolve(null)
                    }
                    )) : g.P8.resolve(null))
                }
                )
            }
        }
        async b0(Q=43200) {
            if (!this.J.KU())
                return HXW();
            var c = await g.Iz();
            if (!c)
                return [];
            const W = Date.now() / 1E3;
            var m = await g.rx(c, "offlineVideoPolicy");
            c = [];
            for (const K of m)
                Number(K.lastUpdatedTimestampSeconds) + Q <= W && (m = g.w1(K.key).entityId,
                c.push(m));
            return c.length ? kL(this, c, this.S, "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH") : []
        }
        deleteAll() {
            return kL(this, ["!*$_ALL_ENTITIES_!*$"], this.S, "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE", {
                offlineLoggingData: {
                    offlineDeleteReason: "OFFLINE_DELETE_REASON_USER_INITIATED"
                }
            })
        }
        async refreshAllStaleEntities(Q) {
            return await this.b0(Q)
        }
        setUpPositionSyncInterval(Q) {
            this.j !== void 0 && (g.Rx(this.j),
            this.j = void 0);
            const c = Q ?? 864E5;
            this.j = g.Ce( () => {
                this.Rn(c)
            }
            , c)
        }
        async Rn(Q) {
            try {
                const c = await f5.getInstance();
                if (!c)
                    throw Error("prefStorage is undefined");
                const W = await c.get("psi")
                  , m = W?.IL ? Number(W.IL) / 1E3 : 0
                  , K = Date.now();
                m + Q <= K && await kL(this, ["!*$_ALL_ENTITIES_!*$"], "videoPlaybackPositionEntity", "OFFLINE_ORCHESTRATION_ACTION_TYPE_REFRESH")
            } catch (c) {
                Rj("Offline manager error", c)
            }
        }
        async W6() {
            var Q = await g.Iz();
            if (!Q)
                return [];
            var c = await g.rx(Q, "transfer");
            Q = [];
            for (const W of c)
                W.transferState === "TRANSFER_STATE_WAITING_FOR_PLAYER_RESPONSE_REFRESH" && W.key && (c = g.w1(W.key).entityId,
                Q.push(c));
            return iXa(this, Q)
        }
        async Y() {
            return []
        }
        async MM() {}
        async Ie() {}
    }
    ;
    var N50 = class extends Kx {
        constructor(Q, c, W) {
            super(Q);
            this.W = Q;
            this.FI = c;
            this.A = W
        }
        O(Q) {
            return WQ(Q) ? SWi(this, Q) : mJ(Q) ? ZXi(this, Q) : K5(Q) ? Ekm(this, Q) : Promise.reject(Error(`Unsupported action type: ${Q.actionType}`))
        }
    }
      , YL = [10];
    var idm = class extends Kx {
        constructor(Q, c, W) {
            super(Q);
            this.W = Q;
            this.FI = c;
            this.A = W
        }
        O(Q) {
            return WQ(Q) ? gko(this, Q) : mJ(Q) ? OXW(this, Q) : K5(Q) ? fLo(this, Q) : Promise.reject(Error(`Unsupported action type: ${Q.actionType}`))
        }
    }
      , jS9 = [10];
    var y3Z = class extends Kx {
        constructor(Q, c, W) {
            super(Q);
            this.W = Q;
            this.FI = c;
            this.A = W
        }
        O(Q) {
            return mJ(Q) ? G9v(this, Q) : Promise.reject(Error(`Unsupported action type: ${Q.actionType}`))
        }
    }
    ;
    var SND = class extends HdD {
        constructor() {
            super(...arguments);
            this.S = "mainVideoEntity"
        }
        D(Q) {
            const c = super.D(Q);
            c.mainVideoEntity = new idm(Q,this.FI,this.W);
            c.mainPlaylistEntity = new N50(Q,this.FI,this.W);
            c.mainDownloadsListEntity = new y3Z(Q,this.FI,this.W);
            return c
        }
        async refreshAllStaleEntities(Q, c) {
            let W = [];
            this.FI.X("web_player_offline_playlist_auto_refresh") && (W = await $79(this, Q, c));
            var m = await f5.getInstance();
            const K = await m?.get("sdois");
            m = await m?.get("lmqf");
            K && (W = W.concat(await P8v(this, K, m ?? "SD", Q === 0)));
            return W = W.concat(await super.refreshAllStaleEntities(Q, c))
        }
        async T2(Q) {
            var c = await g.Iz();
            if (!c)
                return !1;
            c = await $a(c, g.xv, "mainDownloadsListEntity");
            if (c?.downloads?.length) {
                Q = g.bX(Q, "mainVideoEntity");
                for (const W of c.downloads)
                    if (W.videoItem === Q)
                        return !0
            }
            return !1
        }
        async Y() {
            var Q = await g.Iz();
            if (!Q)
                return [];
            var c = await g.rx(Q, "downloadStatusEntity");
            Q = [];
            for (const W of c)
                W.downloadState === "DOWNLOAD_STATE_USER_DELETED" && W.key && (c = g.w1(W.key).entityId,
                Q.push(c));
            return Q.length ? kL(this, Q, "mainVideoEntity", "OFFLINE_ORCHESTRATION_ACTION_TYPE_DELETE", {
                offlineLoggingData: {
                    offlineDeleteReason: "OFFLINE_DELETE_REASON_USER_INITIATED"
                }
            }) : []
        }
        async Ie() {
            const Q = await g.Iz();
            Q && await g.Kr(Q, {
                mode: "readwrite",
                g3: !0
            }, c => g.po(c, "mainVideoEntity").then(W => {
                const m = [];
                for (const K of W) {
                    if (K.userState?.playbackPosition)
                        continue;
                    W = g.w1(K.key).entityId;
                    W = {
                        key: g.bX(W, "videoPlaybackPositionEntity"),
                        videoId: W,
                        lastPlaybackPositionSeconds: "0"
                    };
                    m.push(g.WI(c, W, "videoPlaybackPositionEntity"));
                    K.userState = {
                        playbackPosition: W.key
                    };
                    m.push(g.WI(c, K, "mainVideoEntity"))
                }
                return g.P8.all(m)
            }
            ))
        }
        async MM() {
            const Q = await g.Iz();
            if (Q) {
                var c = g.bX("DOWNLOADS_LIST_ENTITY_ID_MANUAL_DOWNLOADS", "mainDownloadsListEntity")
                  , W = await g.Kr(Q, {
                    mode: "readonly",
                    g3: !0
                }, e => g.P8.all([g.Yf(e, c, "mainDownloadsListEntity"), g.Yf(e, g.xv, "mainDownloadsListEntity"), g.po(e, "mainVideoEntity"), g.po(e, "mainPlaylistEntity")]))
                  , [m,K,T,r] = W;
                W = new Set;
                if (m?.downloads?.length)
                    for (var U of m.downloads) {
                        var I = U.videoItem ?? U.playlistItem;
                        I && W.add(I)
                    }
                if (K?.downloads?.length)
                    for (var X of K.downloads)
                        X.videoItem && W.add(X.videoItem);
                U = new Set;
                X = [];
                for (var A of r) {
                    if (A.videos)
                        for (const e of A.videos)
                            (I = JSON.parse(g.w1(e).entityId).videoId) && U.add(I);
                    A.key && !W.has(A.key) && X.push(A.key)
                }
                for (const e of T)
                    e.key && !W.has(e.key) && (A = g.w1(e.key).entityId,
                    U.has(A) || X.push(e.key));
                X.length && await NU(Q, X)
            }
        }
    }
    ;
    var Fn9 = class extends Kx {
        constructor(Q, c) {
            super(Q);
            this.W = Q;
            this.A = c
        }
        O(Q) {
            return WQ(Q) ? uHo(this, Q) : mJ(Q) ? hCD(this, Q) : K5(Q) ? zCv(this, Q) : Promise.reject(Error(`Unsupported action type: ${Q.actionType}`))
        }
    }
      , cg = [10];
    var ZdZ = class extends Kx {
        constructor(Q, c) {
            super(Q);
            this.W = Q;
            this.A = c
        }
        O(Q) {
            return WQ(Q) ? J_W(this, Q) : mJ(Q) ? RC4(this, Q) : K5(Q) ? k9H(this, Q) : Promise.reject(Error(`Unsupported action type: ${Q.actionType}`))
        }
    }
      , Wg = [10];
    var END = class extends Kx {
        constructor(Q, c) {
            super(Q);
            this.W = Q;
            this.A = c
        }
        O(Q) {
            return WQ(Q) ? Wnv(this, Q) : mJ(Q) ? mjm(this, Q) : K5(Q) ? Knm(this, Q) : Promise.reject(Error(`Unsupported action type: ${Q.actionType}`))
        }
    }
      , c3i = [10];
    var sp4 = class extends HdD {
        constructor() {
            super(...arguments);
            this.S = "musicTrack"
        }
        D(Q) {
            const c = super.D(Q);
            c.musicTrack = new END(Q,this.W);
            c.musicPlaylist = new ZdZ(Q,this.W);
            c.musicAlbumRelease = new Fn9(Q,this.W);
            return c
        }
        async refreshAllStaleEntities(Q, c) {
            let W = await r39(this, Q, c);
            return W = W.concat(await super.refreshAllStaleEntities(Q, c))
        }
    }
    ;
    g.GN("offline", class extends g.zj {
        constructor() {
            super(...arguments);
            this.events = new g.db(this);
            this.FI = this.player.G();
            this.Rk = {
                uO0: () => this.W,
                Fp: () => this.Fp(),
                po: Q => this.po(Q)
            }
        }
        create() {
            g.F(this, this.events);
            if (g.rT(this.FI))
                this.W = new SND(this.FI,this.player);
            else if (g.uL(this.FI) || g.EQ(this.FI))
                this.W = new sp4(this.FI,this.player);
            this.events.B(this.player, "onPlaybackStartExternal", () => {
                this.Fp()
            }
            );
            this.events.B(this.player, "videodatachange", () => {
                this.Fp()
            }
            );
            this.FI.X("html5_offline_playback_position_sync") && this.events.B(this.player, "presentingplayerstatechange", this.po)
        }
        GS() {
            return !1
        }
        async C9(Q, c, W, m) {
            return this.W ? kL(this.W, Q, c, W, m) : Promise.reject()
        }
        deleteAll() {
            return this.W.deleteAll()
        }
        b0(Q) {
            return this.W.b0(Q)
        }
        refreshAllStaleEntities(Q) {
            return this.W.refreshAllStaleEntities(Q)
        }
        setUpPositionSyncInterval(Q) {
            this.W.setUpPositionSyncInterval(Q)
        }
        uq(Q) {
            this.W.uq(Q)
        }
        jV(Q) {
            return this.W.jV(Q)
        }
        async Fp() {
            const Q = this.player.getVideoData();
            Q.MQ() && Ujv(Q) && this.O !== Q.clientPlaybackNonce && await IxW(this, Q)
        }
        async po(Q) {
            var c = this.player.getVideoData();
            const W = c.iX;
            if (Q.Fq(2) || Q.Fq(512))
                (Q = await g.Iz()) ? (c = c.videoId,
                await $a(Q, g.bX(c, "mainVideoEntity"), "mainVideoEntity") && await this.C9([c], "videoPlaybackPositionEntity", "OFFLINE_ORCHESTRATION_ACTION_TYPE_UPDATE", {
                    videoPlaybackPositionEntityActionMetadata: {
                        lastPlaybackPositionSeconds: Math.floor(W).toString()
                    }
                })) : Rj("PES is undefined")
        }
        isOrchestrationLeader() {
            return this.W.isOrchestrationLeader()
        }
        async updateDownloadState(Q, c) {
            const W = await g.Iz();
            if (W) {
                var {entityType: m, entityId: K} = g.w1(Q);
                await TB(K, m, W, c, !0)
            } else
                Rj("PES is undefined")
        }
    }
    );
}
)(_yt_player);
