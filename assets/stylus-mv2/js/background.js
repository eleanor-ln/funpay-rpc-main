"use strict";

(() => {
  const global = this;
  (self.webpackChunkStylus = self.webpackChunkStylus || []).push([ [ "background" ], {
    9796(_, ee, oe) {
      var sync_manager_namespaceObject = {
        getDriveOptions,
        getStatus,
        getToken,
        login,
        putDoc,
        remove: sync_manager_remove,
        setDriveOptions: async (driveName, options) => {
          const key = `secure/sync/driveOptions/${driveName}`;
          await chrome_sync.set({
            [key]: options
          });
        },
        start,
        stop,
        syncNow
      };
      oe.r(sync_manager_namespaceObject);
      var usercss_manager_namespaceObject = {
        build,
        buildCode,
        buildMeta,
        configVars: async (id, vars) => {
          const style = util.deepCopy(getById(id));
          style.usercssData.vars = vars;
          await buildCode(style);
          return (await style_manager_install(style, "config")).usercssData.vars;
        },
        editSave: async (style, msg) => {
          const logs = [];
          style = await parse(style, {}, logs);
          return {
            style: style = await style_manager_editSave(style, msg),
            logs
          };
        },
        find,
        getInstallCode: url => {
          const {code, timer} = installCodeCache[url];
          clearInstallCode(url);
          clearTimeout(timer);
          return code;
        },
        getVersion: data => {
          var _;
          return (_ = find(data)) == null ? void 0 : _.usercssData.version;
        },
        install,
        toggleUrlInstaller
      };
      oe.r(usercss_manager_namespaceObject);
      var usw_api_namespaceObject = {
        publish: async (id, code, usw) => {
          try {
            pushId(id);
            const style = getById(id);
            usw || (usw = style._usw);
            style.usercssData || (code = fakeUsercssHeader(style, usw) + code);
            usw && usw.token && usw.id || (usw = await linkStyle(style, code));
            const res = await uswFetch(`style/${usw.id}`, usw.token, {
              method: "POST",
              headers: {
                "content-type": "application/json"
              },
              body: JSON.stringify({
                code
              })
            });
            util.deepEqual(usw, style._usw) || await uswSave(style, usw);
            return res;
          } finally {
            popId(id);
          }
        },
        revoke
      };
      oe.r(usw_api_namespaceObject);
      var style_manager_namespaceObject = {
        config: async (id, prop, value) => {
          const style = styleMap.get(id);
          if (!style) return 0;
          style[prop] = value;
          (stylePreviewMap.get(id) || {})[prop] = value;
          prop !== "inclusions" && prop !== "overridden" && prop !== "exclusions" || updateSections(id);
          await save(style, "config");
        },
        editSave: style_manager_editSave,
        find: style_manager_find,
        getAllOrdered: keys => {
          const res = util.mapObj(orderWrap.value, group => group.map(getByUuid).filter(Boolean));
          if (res.main.length + res.prio.length < styleMap.size) for (const style of styleMap.values()) style.id in order.main || style.id in order.prio || res.main.push(style);
          return keys ? util.mapObj(res, group => group.map(style => util.mapObj(style, null, keys))) : res;
        },
        getByIdInTab: (id, tabId, needsOvrs) => {
          var _;
          const urlObj = ((_ = tabCache[tabId]) == null ? void 0 : _.url) || {};
          const urls = new Set;
          for (const frameId in urlObj) {
            const url = urlObj[frameId];
            if (!urls.has(url)) {
              urls.add(url);
              for (const v of getByUrl(url, id, tabId, needsOvrs)) {
                v.frameUrl = +frameId ? url : "";
                return v;
              }
            }
          }
        },
        getByUrl,
        getCore,
        getRemoteInfo: id => {
          if (id) return styleMap.has(id) ? calcRemoteId(styleMap.get(id)) : 0;
          const res = {};
          for (const style of styleMap.values()) {
            const [rid, vars] = calcRemoteId(style);
            rid && (res[rid] = [ style.id, vars ]);
          }
          return res;
        },
        getSectionsByUrl,
        importMany: async items => {
          const res = [];
          const styles = [];
          for (let style of items) try {
            style = onBeforeSave(style) || style;
            style.usercssData && await buildCode(style);
            res.push(styles.push(style) - 1);
          } catch (_) {
            res.push({
              err: _
            });
          }
          const events = await db.putMany(styles);
          const messages = [];
          for (let r, i = 0; i < res.length; i++) {
            r = res[i];
            if (!r.err) {
              const id = events[r];
              const isNew = !styleMap.has(id);
              const style = onSaved(styles[r], !1, id);
              messages.push([ style, "import", isNew ]);
              res[i] = {
                style: getCore({
                  id,
                  sections: !0,
                  size: !0
                })
              };
            }
          }
          entries.clear();
          setTimeout(() => messages.forEach(args => broadcastStyleUpdated(...args)), 100);
          return Promise.all(res);
        },
        install: style_manager_install,
        matchOverrides,
        preview: async style => {
          const {id, sourceCode} = style;
          let logs, res;
          if (sourceCode) {
            ({logs, style: res} = await build(sourceCode, {
              id,
              vars: !0,
              strict: !0
            }));
            delete res.enabled;
            res = Object.assign(style, res);
          } else style.usercssData || (res = style);
          res ? stylePreviewMap.set(id, res) : stylePreviewMap.delete(id);
          broadcastStyleUpdated(style, "editPreview");
          return logs;
        },
        remove: style_manager_remove,
        removeMany: (ids, reason) => {
          for (const item of ids) style_manager_remove(item, reason, !0);
          for (const type in orderWrap.value) {
            for (const id of ids) delete order[type][id];
            orderWrap.value[type] = orderWrap.value[type].filter(u => !ids.includes(uuidIndex.get(u)));
          }
          setOrderImpl(orderWrap, {
            calc: !1
          });
          return Promise.all([ db.deleteMany(ids), draftsDB.deleteMany(ids).catch(() => {}) ]);
        },
        save,
        searchDb,
        setOrder: async value => {
          await setOrderImpl({
            value
          }, {
            broadcast: !0,
            sync: !0
          });
        },
        toggle: async (id, enabled) => {
          const style = styleMap.get(id);
          if (!style) return 0;
          style.enabled = !!enabled;
          await save(style, "toggle");
        },
        toggleMany: async (ids, enabled) => {
          const styles = [];
          let errors;
          for (let i = 0; i < ids.length; i++) {
            const style = styleMap.get(ids[i]);
            if (style) try {
              onBeforeSave(style);
              style.enabled = !!(Array.isArray(enabled) ? enabled[i] : enabled);
              styles.push(style);
            } catch (_) {
              (errors != null ? errors : errors = {})[ids[i]] = _.message;
            }
          }
          if (styles.length) {
            await db.putMany(styles);
            for (const style of styles) onSaved(style, "toggle", style.id);
          }
          if (errors) throw errors;
        },
        toggleSiteOvr: (id, val, type, isAdd) => {
          const style = styleMap.get(id);
          if (!style) return 0;
          if (toggleSiteOvrImpl(style, val, type, isAdd) + toggleSiteOvrImpl(style, val, !type, !1)) {
            updateSections(id);
            return save(style, "config", {
              style: {
                id,
                enabled: isAdd ? type : style.enabled
              }
            });
          }
        },
        toggleTabOvrMany,
        updateIconBadge
      };
      oe.r(style_manager_namespaceObject);
      oe.d(style_manager_namespaceObject, {
        get: () => getById,
        getAll: () => getAll,
        getOrder: () => getOrder
      });
      var uso_api_namespaceObject = {
        deleteStyle: usoId => {
          const style = findStyle(usoId);
          return !!style && style_manager_remove(style.id);
        },
        getUpdatability,
        pingback: (usoId, delay) => {
          clearTimeout(pingers[usoId]);
          delete pingers[usoId];
          return delay > 0 ? new Promise(resolve => pingers[usoId] = setTimeout(ping, delay, usoId, resolve)) : delay !== !1 ? ping(usoId) : void 0;
        },
        toUsercss
      };
      oe.r(uso_api_namespaceObject);
      var update_manager_namespaceObject = {
        checkAllStyles,
        checkStyle
      };
      oe.r(update_manager_namespaceObject);
      oe.d(update_manager_namespaceObject, {
        getStates: () => getStates
      });
      oe(5803);
      oe(5682);
      var dnr = oe(9962);
      var msg = oe(4931);
      var msg_api = oe(1154);
      var prefs = oe(2956);
      var storage_util = oe(1320);
      var ua = oe(9818);
      var util = oe(2076);
      const kSites = ".sites";
      const kSitesOnly = ".sitesOnly";
      const OPT_IDS = [ "exposeIframes", "patchCsp", "styleViaASS", "styleViaXhr" ];
      const SITE_RE = /^(?:(\*)$|(-)?((?:(?:ht|f)tps?|\*):\/\/)?([-\w.*]+(?::\d+)?)(\/[^\s#]*)?)/i;
      const optionSites = {};
      const isOptionSite = ({on, off}, url) => !(on !== !0 && (on == null || !on.test(url)) || off != null && off.test(url));
      let pending;
      prefs.subscribe([ "disableAll", ...OPT_IDS.join(",").replace(/[^,]+/g, `$&,$&${kSites},$&${kSitesOnly}`).split(",") ], function onPref(key) {
        if (key) pending != null || (pending = Promise.resolve().then(onPref)); else {
          pending = null;
          prefs.__values.disableAll || update();
        }
      }, !0);
      function update() {
        for (const id of OPT_IDS) {
          var _;
          if (!prefs.__values[id]) continue;
          if (!prefs.__values[id + kSitesOnly]) {
            optionSites[id] = !1;
            continue;
          }
          const arr = prefs.__values[id + kSites].trim().toLowerCase().split(/\s+/).sort();
          const str = arr.join("\n");
          if (str === ((_ = optionSites[id]) == null ? void 0 : _.str)) continue;
          const data = optionSites[id] = {};
          const seen = new Set;
          const regexps = {};
          let hasAll;
          for (let m of arr) {
            const not = m.charCodeAt(0) === 45;
            const re = m.charCodeAt(not) === 47 && m.charCodeAt(m.length - 1) === 47 && m.slice(1 + not, -1);
            m = re ? [ re ] : SITE_RE.exec(m);
            if (m && !seen.has(m[0])) {
              seen.add(m[0]);
              if (m[1]) hasAll = data.on = !0; else if (not || !hasAll) {
                const type = not ? "off" : "on";
                data[type] != null || (data[type] = []);
                if (re) {
                  var ee;
                  ((ee = regexps[type]) != null ? ee : regexps[type] = []).push(re);
                } else data[type].push([ (m[3] || " [-a-z ] +://").toLowerCase(), m[4].replace("*.", " ( ?: [ ^:/ ] + \\ . ) ?").toLowerCase() + (m[5] || "/*") ]);
              }
            }
          }
          for (const [k, globs] of Object.entries(data)) {
            if (globs === !0) continue;
            let res;
            if (globs.length) {
              res = [ " ^" ];
              let groupFirstSite, groupScheme, multiSchemes;
              for (const [scheme, hostPath] of globs) if (groupScheme !== scheme) {
                if (groupScheme) {
                  res.push(groupFirstSite || " )", " |");
                  multiSchemes = !0;
                }
                res.push(scheme);
                groupScheme = scheme;
                groupFirstSite = hostPath;
              } else {
                if (groupFirstSite) {
                  res.push(" ( ?:", groupFirstSite);
                  groupFirstSite = "";
                }
                res.push(" |", hostPath);
              }
              res.push(groupFirstSite || groupScheme && " )" || "", multiSchemes ? " )" : "");
              multiSchemes && (res[0] += " ( ?:");
              res = util.globAsRegExpStr(res.join("")).replace(/ \\/g, "");
            }
            data[k] = util.tryRegExp((res || "") + (regexps[k] ? `${res ? "|" : ""}^(?:${regexps[k].join("|")})$` : ""));
            data.str = str;
          }
        }
      }
      var js_urls = oe(7766);
      var util_webext = oe(5288);
      const dataHub = Object.assign(new Map, {
        pop(key) {
          const val = this.get(key);
          this.delete(key);
          return val;
        }
      });
      const onSchemeChange = new Set;
      const onTabUrlChange = new Set;
      const onUnload = new Set;
      const onUrlChange = new Set;
      const uuidIndex = Object.assign(new Map, {
        custom: {},
        addCustom(obj, {get = () => obj, set}) {
          Object.defineProperty(uuidIndex.custom, obj._id, {
            get,
            set
          });
        }
      });
      let WRB = !!ua.FIREFOX;
      let WRBTest = ua.CHROME && browser.permissions.contains({
        permissions: [ "webRequestBlocking" ]
      }).then(res => {
        WRBTest = null;
        WRB = res;
        return res;
      });
      let bgPreInit = [];
      let bgInit = [];
      let bgBusy = global._busy = Object.assign(new Promise(cb => ae = cb), {
        resolve: ae
      });
      var ae;
      let isVivaldi, vivaldiTest;
      ua.CHROME && util_webext.browserWindows ? vivaldiTest = async (wnd = util_webext.browserWindows.getLastFocused()) => isVivaldi = !(!(wnd = await wnd) || !wnd.vivExtData && !wnd.extData) : isVivaldi = !1;
      bgPreInit.push(WRBTest);
      bgBusy.then(() => {
        bgBusy = bgPreInit = bgInit = null;
        delete global._busy;
      });
      class ChromeStorageDB {
        constructor(dbName, mirror) {
          this._max = dbName === "stylish" ? null : 1;
          this._mirror = mirror;
          this._prefix = dbName === "stylish" ? "style-" : `${dbName}-`;
        }
        delete(id) {
          return storage_util.chromeLocal.remove(this._prefix + id);
        }
        async get(id) {
          return (await storage_util.chromeLocal.get(id = this._prefix + id))[id];
        }
        async getAll() {
          const all = !storage_util.GET_KEYS && await storage_util.chromeLocal.get();
          const keys = storage_util.GET_KEYS ? await storage_util.chromeLocal.getKeys() : Object.keys(all);
          const res = [];
          this._max != null || (this._max = await this._getDbMax(keys));
          for (const key of keys) key.startsWith(this._prefix) && res.push(storage_util.GET_KEYS ? key : all[key]);
          return storage_util.GET_KEYS ? Object.values(await storage_util.chromeLocal.get(res)) : res;
        }
        async put(item, key) {
          var _;
          key != null || (key = (_ = item.id) != null ? _ : item.id = (this._max != null || (this._max = await this._getDbMax()), 
          this._max++));
          await storage_util.chromeLocal.set({
            [this._prefix + key]: this._mirror && item.usercssData ? {
              ...item,
              sections: void 0
            } : item
          });
          return key;
        }
        async putMany(items, keys) {
          const data = {};
          const res = [];
          for (let i = 0; i < items.length; i++) {
            var _;
            const item = items[i];
            const id = keys ? keys[i] : (_ = item.id) != null ? _ : item.id = (this._max != null || (this._max = await this._getDbMax()), 
            this._max++);
            data[this._prefix + id] = this._mirror && item.usercssData ? {
              ...item,
              sections: void 0
            } : item;
            res.push(id);
          }
          await storage_util.chromeLocal.set(data);
          return res;
        }
        async _getDbMax(keys) {
          let res = 1;
          let id;
          keys != null || (keys = storage_util.GET_KEYS ? await storage_util.chromeLocal.getKeys() : Object.keys(await storage_util.chromeLocal.get()));
          for (const key of keys) key.startsWith(this._prefix) && (id = +key.slice(this._prefix.length)) >= res && (res = id + 1);
          return res;
        }
      }
      let exec = ua.CHROME ? dbExecIndexedDB : async (...args) => {
        let err;
        if (typeof indexedDB == "undefined") err = new Error("IndexedDB is disabled in the browser"); else try {
          const [res, fallback = await testDB()] = await Promise.all([ dbExecIndexedDB(...args), storage_util.chromeLocal.getValue(FALLBACK) ]);
          if (!fallback) {
            exec = dbExecIndexedDB;
            return res;
          }
          console.warn("IndexedDB is not used due to a previous failure, but seems functional now:", {
            previousFailure: await storage_util.chromeLocal.getValue(REASON),
            currentResult: res,
            arguments: args
          });
        } catch (_) {
          err = _;
        }
        exec = useChromeStorage(err);
        return exec(...args);
      };
      const FALLBACK = "dbInChromeStorage";
      const REASON = FALLBACK + "Reason";
      const DRAFTS_DB = "drafts";
      const CACHING = {
        [DRAFTS_DB]: cachedExec,
        settings: cachedExec
      };
      const {CompressionStream} = global;
      const kApplicationGzip = "application/gzip";
      const MIRROR_INIT = CompressionStream && {
        headers: {
          "content-type": kApplicationGzip
        }
      };
      const MIRROR = {
        stylish: null,
        settings: null
      };
      const DATA_KEY = {};
      const STORES = {};
      const VERSIONS = {};
      const dataCache = {};
      const proxies = {};
      const databases = {};
      const chromeBases = {};
      const proxyHandler = {
        get: ({dbName}, cmd) => (CACHING[dbName] || exec).bind(null, dbName, cmd)
      };
      const getDbProxy = (dbName, {id, store = "data", ver = 2} = {}) => {
        var _;
        return (_ = proxies[dbName]) != null ? _ : proxies[dbName] = (DATA_KEY[dbName] = id && typeof id != "string" ? "id" : id, 
        STORES[dbName] = store, VERSIONS[dbName] = ver, new Proxy({
          dbName
        }, proxyHandler));
      };
      const db = getDbProxy("stylish", {
        id: !0,
        store: "styles"
      });
      const draftsDB = getDbProxy(DRAFTS_DB);
      const prefsDB = getDbProxy("settings");
      const stateDB = !1;
      async function cachedExec(dbName, cmd, a, b) {
        var _;
        const hub = (_ = dataCache[dbName]) != null ? _ : dataCache[dbName] = {};
        const res = cmd === "get" && a in hub ? hub[a] : await exec(...arguments);
        if (cmd === "get") hub[a] = util.deepMerge(res); else if (cmd === "put") {
          const key = DATA_KEY[dbName];
          hub[key ? a[key] : b] = util.deepMerge(a);
        } else cmd === "delete" && delete hub[a];
        return res;
      }
      async function testDB() {
        const id = `${performance.now()}.${Math.random()}.${Date.now()}`;
        await dbExecIndexedDB.call(testDB, "stylish", "put", {
          id
        });
        const e = await dbExecIndexedDB("stylish", "get", id);
        await dbExecIndexedDB.call(testDB, "stylish", "delete", e.id);
      }
      function useChromeStorage(err) {
        if (err) {
          storage_util.chromeLocal.set({
            [FALLBACK]: !0,
            [REASON]: err.message + (err.stack ? "\n" + err.stack : "")
          });
          console.warn("Failed to access IndexedDB. Switched to extension storage API.", err);
        }
        return (dbName, method, ...args) => {
          var _;
          return ((_ = chromeBases[dbName]) != null ? _ : chromeBases[dbName] = new ChromeStorageDB(dbName))[method](...args);
        };
      }
      async function dbExecIndexedDB(dbName, method, ...args) {
        var _;
        const many = method.endsWith("Many");
        if (many && !args[0].length) return [];
        const mode = method.startsWith("get") ? void 0 : "readwrite";
        const storeName = STORES[dbName];
        const store = ((_ = databases[dbName]) != null ? _ : databases[dbName] = await db_open(dbName)).transaction([ storeName ], mode).objectStore(storeName);
        mode && dbName in MIRROR && this !== testDB && execMirror(...arguments);
        return many ? storeMany(store, method.slice(0, -4), ...args) : new Promise((resolve, reject) => {
          const request = store[method](...args);
          request.onsuccess = () => resolve(request.result);
          request.onerror = reject;
        });
      }
      function storeMany(store, method, items, keys) {
        let num = 0;
        let resolve, reject;
        const p = new Promise((ok, ko) => {
          resolve = ok;
          reject = ko;
        });
        const results = [];
        const onsuccess = ({target: req}) => {
          results[req.i] = req.result;
          --num || resolve(results);
        };
        for (;num < items.length; ) {
          const req = store[method](items[num], keys == null ? void 0 : keys[num]);
          req.onerror = reject;
          req.onsuccess = onsuccess;
          req.i = num;
          results[num] = null;
          num++;
        }
        return p;
      }
      function db_open(name) {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(name, VERSIONS[name]);
          request.onsuccess = e => resolve(create(e));
          request.onerror = reject;
          request.onupgradeneeded = create;
        });
      }
      function create(event) {
        const idb = event.target.result;
        const dbName = idb.name;
        const sn = STORES[dbName];
        if (!idb.objectStoreNames.contains(sn)) {
          if (event.type === "success") {
            idb.close();
            return new Promise(resolve => {
              indexedDB.deleteDatabase(dbName).onsuccess = () => {
                resolve(db_open(dbName));
              };
            });
          }
          idb.createObjectStore(sn, DATA_KEY[dbName] ? {
            keyPath: DATA_KEY[dbName],
            autoIncrement: !0
          } : void 0);
        }
        return idb;
      }
      async function execMirror(dbName, method, a, b) {
        var _;
        const mirror = (_ = MIRROR[dbName]) != null ? _ : MIRROR[dbName] = await caches.open(dbName).catch(() => !1);
        if (mirror) switch (method) {
         case "delete":
          return mirror.delete("http://_/" + a);

         case "get":
          return (b = await execMirror(dbName, "getAll", a))[0];

         case "getAll":
          a = await mirror.matchAll(a);
          for (let i = 0; i < a.length; i++) {
            b = a[i];
            CompressionStream && b.headers.get("content-type") === kApplicationGzip && (b = new Response(b.body.pipeThrough(new DecompressionStream("gzip"))));
            a[i] = b.text();
          }
          a = await Promise.all(a);
          for (let i = 0; i < a.length; i++) a[i] = JSON.parse(a[i]);
          return a;

         case "getAllKeys":
          a = await mirror.keys();
          for (let i = 0; i < a.length; i++) {
            b = a[i].url.slice(9);
            a[i] = +b || b;
          }
          return a;

         case "put":
          await util.sleep(10);
          dbName === "stylish" && a.usercssData && delete (a = {
            ...a
          }).sections;
          b = "http://_/" + (b != null ? b : a.id);
          a = JSON.stringify(a);
          if (CompressionStream) {
            MIRROR_INIT.headers["Content-Length"] = a.length;
            a = new Response(a).body.pipeThrough(new CompressionStream("gzip"));
          }
          return mirror.put(b, new Response(a, MIRROR_INIT));

         case "putMany":
          for (let i = 0; i < a.length; i++) {
            var ee;
            await execMirror(dbName, "put", a[i], (ee = b) == null ? void 0 : ee[i]);
          }
        }
      }
      async function mirrorStorage(styleMap) {
        let val;
        let keys = await execMirror("stylish", "getAllKeys");
        if (keys) {
          keys = new Set(keys);
          for (const style of styleMap.values()) if (!keys.has(style.id)) {
            await util.sleep0();
            await execMirror("stylish", "put", style);
          }
          keys = new Set(await execMirror("settings", "getAllKeys"));
          for (const key of [ "injectionOrder" ]) if (!keys.has(key) && (val = await prefsDB.get(key))) {
            await util.sleep0();
            await execMirror("settings", "put", val, key);
          }
        }
      }
      const FILTER = ua.CHROME ? {
        url: [ {
          schemes: [ "http", "https", "file", "chrome", "chrome-extension" ]
        } ]
      } : void 0;
      const kCommitted = "committed";
      const ownPagesCommitted = {};
      let prevData = {};
      util_webext.webNavigation.onCommitted.addListener(onNavigation.bind(null, kCommitted), FILTER);
      util_webext.webNavigation.onHistoryStateUpdated.addListener(onNavigation.bind(null, "history"), FILTER);
      util_webext.webNavigation.onReferenceFragmentUpdated.addListener(onNavigation.bind(null, "hash"), FILTER);
      async function onNavigation(navType, data) {
        const {url} = data;
        if (ua.CHROME <= 143 && data.timeStamp === prevData.timeStamp && util.deepEqual(data, prevData) || data.documentLifecycle === "prerender") return;
        prevData = data;
        bgBusy && await bgBusy;
        const {tabId} = data;
        const td = tabCache[tabId];
        if (navType === kCommitted) {
          var _;
          url.startsWith(js_urls.ownRoot) ? ((_ = ownPagesCommitted[url]) != null ? _ : ownPagesCommitted[url] = []).push(tabId) : td && delete td.patchCsp;
        } else if (td) {
          var ee;
          const {frameId: f} = data;
          const {documentId: d, frameType} = data;
          sendTab(tabId, {
            method: "urlChanged",
            top: !frameType && !f || frameType === "outer_frame",
            iid: ((ee = td.iid) == null ? void 0 : ee[f]) || 0,
            url
          }, d ? {
            documentId: d
          } : {
            frameId: f
          });
        }
        for (const fn of onUrlChange) fn(data, navType);
      }
      {
        const exec = browser.tabs.executeScript;
        const urlMatches = "/scripts/\\d+[^/]*(/code)?([?#].*)?$";
        util_webext.webNavigation.onCommitted.addListener(({tabId}) => {
          exec(tabId, {
            file: "/js/install-hook-greasyfork.js",
            runAt: "document_start"
          });
        }, {
          url: [ {
            hostEquals: "greasyfork.org",
            urlMatches
          }, {
            hostEquals: "sleazyfork.org",
            urlMatches
          } ]
        });
        util_webext.webNavigation.onCommitted.addListener(({tabId}) => {
          exec(tabId, {
            file: "/js/install-hook-userstylesworld.js",
            runAt: "document_start"
          });
        }, {
          url: [ {
            hostEquals: "userstyles.world"
          } ]
        });
        ua.FIREFOX && util_webext.webNavigation.onDOMContentLoaded.addListener(async ({tabId, frameId}) => {
          if (frameId && !await pingTab(tabId, frameId)) for (const file of util_webext.MF.content_scripts[0].js) exec(tabId, {
            frameId,
            file,
            matchAboutBlank: !0
          }).catch(util.NOP);
        }, {
          url: [ {
            urlEquals: "about:blank"
          } ]
        });
      }
      const tabCache = {
        __proto__: null
      };
      const set = (tabId, ...args) => {
        if (!(+tabId > 0)) return;
        const depth = args.length - 2;
        const lastKey = args[depth];
        const value = args[depth + 1];
        const del = value === void 0;
        let obj = tabCache[tabId];
        let obj0 = obj;
        if (!obj) {
          if (del) return;
          tabCache[tabId] = obj = obj0 = {
            id: tabId
          };
        }
        for (let key, i = 0; obj && i < depth; i++) obj = obj[key = args[i]] || !del && (obj[key] = {});
        del ? obj && delete obj[lastKey] : obj[lastKey] = value;
        return value;
      };
      const remove = tabId => {
        delete tabCache[tabId];
      };
      bgInit.push(async () => {
        const [tabs, savedKeys, saved] = await Promise.all([ browser.tabs.query({}), !1, !1 ]);
        for (const {id, url} of tabs) {
          let data;
          data = {
            id,
            url: {
              0: url
            }
          };
          tabCache[id] = data;
        }
      });
      bgBusy.then(() => {
        onUrlChange.add(({tabId, frameId, url}, navType) => {
          var _, ee;
          let obj, oldUrl;
          if (obj = tabCache[tabId]) {
            var oe;
            oldUrl = (oe = obj.url) == null ? void 0 : oe[0];
            navType === kCommitted && obj.styleIds && (frameId ? delete obj.styleIds[frameId] : delete obj.styleIds);
          } else tabCache[tabId] = obj = {
            id: tabId
          };
          navType !== kCommitted || frameId ? ((ee = (_ = obj).url) != null ? ee : _.url = {})[frameId] = url : obj.url = {
            0: url
          };
          if (!frameId) for (const fn of onTabUrlChange) fn(tabId, url, oldUrl);
        });
      });
      msg.onDisconnect.apply = port => {
        var _;
        util_webext.ignoreChromeError();
        const {sender} = port;
        const tabId = (_ = sender.tab) == null ? void 0 : _.id;
        const frameId = sender.frameId;
        if (tabId != null && frameId) for (const fn of onUnload) fn(tabId, frameId, port);
      };
      chrome.tabs.onCreated.addListener(() => {});
      chrome.tabs.onRemoved.addListener(async tabId => {
        bgBusy && await bgBusy;
        remove(tabId);
        for (const fn of onUnload) fn(tabId, 0);
      });
      const worker = oe(755).createPortProxy(js_urls.workerPath);
      const rxHOST = /^('non(e|ce-.+?)'|(https?:\/\/)?[^']+?[^:'])$/;
      const rxHtmlEntity = /&(#x?)?([^;]+);/g;
      const rxQuoteSpace = / '\s+([-+/=\w]+')/g;
      const rxMetaCSP = /<meta\s+[^<>]*http-equiv\s*=\s*(["']?)Content-Security-Policy\1[^<>]*>/i;
      const rxMetaCSPVal = /(\scontent\s*=)(?:'([^']+)'|"([^"]+)"|([^<>\s]+))/i;
      const patchCspMetaTagValReplacer = (_, key, q1, q2, q0) => key + '"' + patchCsp((q1 || q2 || q0).replace(rxHtmlEntity, patchHtmlEntities).replace(rxQuoteSpace, " '$1")).replace(/"/g, "&#34;") + '"';
      const patchCspMetaTagReplacer = str => str.replace(rxMetaCSPVal, patchCspMetaTagValReplacer);
      const patchHtmlEntities = (_, hash, s) => hash ? String.fromCharCode(parseInt(s, hash === "#x" ? 16 : 10)) : htmlEntities[s] || s;
      const htmlEntities = {
        amp: "&",
        quot: '"',
        apos: "'",
        lt: "<",
        gt: ">"
      };
      const patchCsp = str => {
        const src = {};
        for (let p of str.split(/[;,]/)) {
          p = p.trim().split(/\s+/);
          src[p[0]] = p.slice(1);
        }
        patchCspSrc(src, "img-src", "data:", "*");
        patchCspSrc(src, "font-src", "data:", "*");
        patchCspSrc(src, "style-src", "'unsafe-inline'", "*");
        src.sandbox && !src.sandbox.includes("allow-same-origin") && src.sandbox.push("allow-same-origin");
        return Object.entries(src).map(([k, v]) => `${k}${v.length ? " " : ""}${v.join(" ")}`).join("; ");
      };
      const patchCspSrc = (src, name, ...values) => {
        let def = src["default-src"];
        let list = src[name];
        if (def || list) {
          def || (def = []);
          list || (list = [ ...def ]);
          values.includes("*") && (list = src[name] = list.filter(v => !rxHOST.test(v)));
          list.push(...values.filter(v => !list.includes(v)));
          list.length || delete src[name];
        }
      };
      const patchCspMetaTag = reqId => {
        const filter = browser.webRequest.filterResponseData(reqId);
        const decoder = new TextDecoder("utf-8");
        const encoder = new TextEncoder;
        let chunks = [];
        let text = "";
        filter.ondata = ({data}) => {
          if (chunks) {
            chunks.push(data);
            text += decoder.decode(data, {
              stream: !0
            });
            if (/<body\W/i.test(text)) {
              text !== (text = text.replace(rxMetaCSP, patchCspMetaTagReplacer)) && (chunks = [ encoder.encode(text + decoder.decode()) ]);
              chunks.forEach(filter.write, filter);
              chunks = text = null;
            }
          } else filter.write(data);
        };
        filter.onstop = () => {
          var _;
          (_ = chunks) == null || _.forEach(filter.write, filter);
          filter.close();
        };
      };
      let toBroadcast;
      let toBroadcastCfg;
      let toBroadcastUpdStyles;
      const OLD = Symbol("old");
      function broadcast(data, cfg) {
        toBroadcast != null || (toBroadcast = (setTimeout(doBroadcast), []));
        cfg ? toBroadcastCfg = cfg : data.method === "styleUpdated" ? (toBroadcastUpdStyles != null ? toBroadcastUpdStyles : toBroadcastUpdStyles = new Map).set(data.style.id, data) : toBroadcast.push(data);
      }
      async function doBroadcast() {
        const [clients, tabs] = await Promise.all([ !1, browser.tabs.query({}) ]);
        const data = toBroadcast;
        const cfg = toBroadcastCfg;
        const updStyles = toBroadcastUpdStyles;
        const assSites = (cfg == null ? void 0 : cfg.ass) && optionSites.styleViaASS;
        const iframeSites = (cfg == null ? void 0 : cfg.top) && optionSites.exposeIframes;
        toBroadcastCfg = toBroadcastUpdStyles = toBroadcast = null;
        cfg && data.push({
          method: "injectorConfig",
          cfg
        });
        updStyles && data.push(...updStyles.values());
        broadcastExtension(data, !0);
        let cnt = 0;
        let url;
        tabs.sort((a, b) => b.active - a.active);
        for (const t of tabs) {
          var _;
          if (t.discarded || !(url = t.url)) continue;
          const tabOverrides = (_ = tabCache[t.id]) == null ? void 0 : _.tabOvr;
          const patched = tabOverrides && Object.keys(tabOverrides).length && patchStyles(updStyles, tabOverrides);
          assSites && (cfg.ass = isOptionSite(assSites, url));
          iframeSites && (cfg.top = isOptionSite(iframeSites, url));
          sendTab(t.id, data, null, !0);
          if (patched) for (const p of patched) p.enabled = p[OLD];
          if (++cnt > 50) {
            cnt = 0;
            await util.sleep0();
          }
        }
      }
      function broadcastExtension(data, multi) {
        unwrap(browser.runtime.sendMessage({
          data,
          multi,
          broadcast: !0
        }));
      }
      function patchStyles(styleUpdates, tabOverrides) {
        let res, ovr, old;
        for (const {style} of styleUpdates.values()) if ((ovr = tabOverrides[style.id]) != null && ovr !== (old = style.enabled)) {
          style[OLD] = old;
          style.enabled = ovr;
          (res != null ? res : res = []).push(style);
        }
        return res;
      }
      function pingTab(tabId, frameId = 0) {
        return sendTab(tabId, {
          method: "ping"
        }, {
          frameId
        });
      }
      function sendTab(tabId, data, options, multi) {
        return unwrap(browser.tabs.sendMessage(tabId, {
          data,
          multi
        }, options), multi);
      }
      async function unwrap(promise, multi) {
        const err = new Error;
        let data, error;
        try {
          ({data, error} = await promise || {});
          if (!error) return data;
        } catch (_) {
          error = _;
          if (msg_api.rxIgnorableError.test(err.message = _.message)) return;
        }
        error.stack && (err.stack = error.stack + "\n" + err.stack);
        if (multi) {
          console.error(err);
          return data;
        }
        return Promise.reject(err);
      }
      let cfg;
      let sentCfg = {};
      const INJECTOR_CONFIG_MAP = {
        exposeIframes: "top",
        disableAll: "off",
        keepAlive: "wake",
        styleViaASS: "ass"
      };
      bgBusy.then(() => {
        prefs.subscribe(Object.keys(INJECTOR_CONFIG_MAP), broadcastInjectorConfig);
      });
      onSchemeChange.add(broadcastInjectorConfig.bind(null, "dark"));
      function broadcastInjectorConfig(key, val) {
        (key = INJECTOR_CONFIG_MAP[key] || key) === "keepAlive" && (val = val >= 0);
        if (cfg) sentCfg[key] === val ? delete cfg[key] : cfg[key] = val; else {
          cfg = {};
          cfg[key] = val;
          setTimeout(throttle);
        }
      }
      function throttle() {
        Object.keys(cfg).length && broadcast(null, cfg);
        sentCfg = cfg;
        cfg = null;
      }
      function initBrowserCommandsApi() {
        const browserCommands = browser.commands;
        browserCommands != null && browserCommands.update && prefs.subscribe(prefs.knownKeys.filter(k => k.startsWith("hotkey.")), async (name, value) => {
          try {
            value.trim() && await browserCommands.update({
              name: name.split(".")[1],
              shortcut: value
            });
          } catch {}
        }, !0);
      }
      const kSTART = "schemeSwitcher.nightStart";
      const kEND = "schemeSwitcher.nightEnd";
      const kLight = "light";
      const kNever = "never";
      const kSystem = "system";
      const kTime = "time";
      const map = {
        [kNever]: !1,
        dark: !0,
        [kLight]: !1,
        [kSystem]: null,
        [kTime]: !1
      };
      const SCHEMES = [ "dark", kLight ];
      const setSystemDark = color_scheme_update.bind(null, kSystem);
      let isDark = null;
      let prefState;
      let saved;
      let notified;
      chrome.alarms.onAlarm.addListener(async ({name}) => {
        if (name === kSTART || name === kEND) {
          prefState || await prefs.ready;
          updateTimePreferDark();
        }
      });
      saved = !0;
      setSystemDark(util.isCssDarkScheme());
      prefs.subscribe("schemeSwitcher.enabled", (_, val) => {
        prefState = val;
        if (val === kTime) prefs.subscribe([ kSTART, kEND ], onNightChanged, !0); else {
          prefs.unsubscribe([ kSTART, kEND ], onNightChanged);
          chrome.alarms.clear(kSTART);
          chrome.alarms.clear(kEND);
        }
        color_scheme_update();
      }, !0);
      function themeAllowsStyle({preferScheme: ps}) {
        return prefState === kNever || ps !== "dark" && ps !== kLight || isDark === (ps === "dark");
      }
      function calcTime(key) {
        const [h, m] = prefs.__values[key].split(":");
        return 1e3 * (h * 3600 + m * 60);
      }
      function createAlarm(key, value) {
        const date = new Date;
        const [h, m] = value.split(":");
        date.setHours(h, m, 0, 0);
        date.getTime() < Date.now() && date.setDate(date.getDate() + 1);
        chrome.alarms.create(key, {
          when: date.getTime(),
          periodInMinutes: 1440
        });
      }
      function onNightChanged(force) {
        if (force !== !0) return util.debounce(onNightChanged, 0, !0);
        updateTimePreferDark();
        createAlarm(kSTART, prefs.__values[kSTART]);
        createAlarm(kEND, prefs.__values[kEND]);
      }
      function updateTimePreferDark() {
        const now = Date.now() - (new Date).setHours(0, 0, 0, 0);
        const start = calcTime(kSTART);
        const end = calcTime(kEND);
        color_scheme_update(kTime, start > end ? now >= start || now < end : now >= start && now < end);
      }
      function color_scheme_update(type, val) {
        if (type) {
          if (map[type] === val) return;
          map[type] = val;
          if (!prefState) return;
        }
        if (isDark !== (val = map[prefState])) {
          isDark = val;
          isDark !== notified && util.debounce(notify, 100);
        }
      }
      function notify() {
        notified = isDark;
        broadcastExtension({
          method: "colorScheme",
          value: isDark
        });
        for (const fn of onSchemeChange) fn(isDark);
      }
      let initialized;
      async function reinjectContentScripts(targetTab) {
        const ALL_URLS = "<all_urls>";
        const SCRIPTS = util_webext.MF.content_scripts;
        const globToRe = (s, re = ".") => util.stringAsRegExpStr(s.replace(/\*/g, "\n")).replace(/\n/g, re + "*?");
        const busyTabs = new Set;
        if (!initialized) {
          initialized = !0;
          for (const cs of SCRIPTS) (cs[ALL_URLS] = cs.matches.includes(ALL_URLS)) || cs.matches.forEach((m, i) => {
            const [, scheme, host, path] = m.match(/^([^:]+):\/\/([^/]+)\/(.*)/);
            cs.matches[i] = new RegExp(`^${scheme === "*" ? "https?" : scheme}://${globToRe(host, "[^/]")}/${globToRe(path)}$`);
          });
        }
        let busyTabsTimer;
        targetTab || await util.sleep0();
        for (const tab of targetTab ? [ targetTab ] : await browser.tabs.query({})) {
          const url = tab.pendingUrl || tab.url;
          const res = tab.width && !tab.discarded && js_urls.supported(url) && (targetTab || tab.status !== "loading" ? await injectToTab(tab.id, url, targetTab) : trackBusyTab(tab.id, !0));
          if (targetTab) return res && res[0] && !0;
        }
        async function injectToTab(tabId, url, targeted) {
          const jobs = [];
          set(tabId, "url", 0, url);
          if (targeted || !await sendTab(tabId, {
            method: "backgroundReady"
          })) {
            for (const cs of SCRIPTS) if (cs[ALL_URLS] || cs.matches.some(url.match, url)) {
              const options = {
                runAt: cs.run_at,
                allFrames: cs.all_frames,
                matchAboutBlank: cs.match_about_blank
              };
              for (const file of cs.js) {
                options.file = file;
                jobs.push(browser.tabs.executeScript(tabId, options).catch(util.NOP));
              }
            }
            return Promise.all(jobs);
          }
        }
        function toggleBusyTabListeners(state) {
          const toggle = state ? "addListener" : "removeListener";
          util_webext.webNavigation.onCompleted[toggle](onBusyTabUpdated);
          util_webext.webNavigation.onErrorOccurred[toggle](onBusyTabUpdated);
          util_webext.webNavigation.onTabReplaced[toggle](onBusyTabReplaced);
          chrome.tabs.onRemoved[toggle](onBusyTabRemoved);
          state ? busyTabsTimer = setTimeout(toggleBusyTabListeners, 15e3, !1) : clearTimeout(busyTabsTimer);
        }
        function trackBusyTab(tabId, state) {
          busyTabs[state ? "add" : "delete"](tabId);
          state && busyTabs.size === 1 && toggleBusyTabListeners(!0);
          state || busyTabs.size || toggleBusyTabListeners(!1);
        }
        function onBusyTabUpdated({error, frameId, tabId, url}) {
          if (!frameId && busyTabs.has(tabId)) {
            trackBusyTab(tabId, !1);
            url && !error && js_urls.supported(url) && injectToTab(tabId, url);
          }
        }
        function onBusyTabReplaced({replacedTabId}) {
          trackBusyTab(replacedTabId, !1);
        }
        function onBusyTabRemoved(tabId) {
          trackBusyTab(tabId, !1);
        }
      }
      var consts = oe(7132);
      var style_util = oe(5012);
      var chrome_sync = oe(4143);
      var dropbox = oe(5676);
      var onedrive = oe(704);
      var google = oe(5187);
      var webdav = oe(5017);
      var db_to_cloud = oe(3985);
      const cloudDrive = {
        dropbox: dropbox.default,
        onedrive: onedrive.default,
        google: google.default,
        webdav: webdav.default
      };
      const HAS_OPENER = !(!util_webext.browserWindows || !ua.CHROME && !global.AbortController);
      const EMPTY_TAB = [ "chrome://newtab/", "chrome://startpage/", "chrome://startpageshared/", "chrome-extension://mpognobbkildjkofajifpdfhcoklimli/components/startpage/startpage.html", "chrome://vivaldi-webui/startpage", "about:home", "about:newtab" ];
      async function openTab({url, index, openerTabId, active = !0, currentWindow = !0, newWindow, newTab}) {
        url.includes("://") || (url = chrome.runtime.getURL(url));
        let tab = !newTab && (await browser.tabs.query({
          url: url.split("#")[0],
          currentWindow
        }))[0];
        if (tab) return activateTab(tab, {
          index,
          openerTabId,
          url: url !== (tab.pendingUrl || tab.url) && url.includes("#") ? url : void 0
        });
        if (newWindow && util_webext.browserWindows) return (await util_webext.browserWindows.create(Object.assign({
          url
        }, newWindow))).tabs[0];
        tab = await util_webext.getActiveTab() || {
          url: ""
        };
        if (tab && EMPTY_TAB.includes((tab.pendingUrl || tab.url || "").replace("edge://", "chrome://")) && (!tab.incognito || !url.startsWith("chrome"))) return activateTab(tab, {
          url,
          openerTabId
        });
        const id = openerTabId == null ? tab.id : openerTabId;
        return browser.tabs.create(Object.assign({
          url,
          index,
          active
        }, id != null && !tab.incognito && HAS_OPENER && {
          openerTabId: id,
          windowId: tab.windowId
        }));
      }
      async function activateTab(tab, {url, index, openerTabId} = {}) {
        const options = {
          active: !0
        };
        url && (options.url = url);
        openerTabId != null && HAS_OPENER && (options.openerTabId = openerTabId);
        await Promise.all([ browser.tabs.update(tab.id, options), util_webext.browserWindows == null ? void 0 : util_webext.browserWindows.update(tab.windowId, {
          focused: !0
        }).catch(util.NOP), index != null && browser.tabs.move(tab.id, {
          index
        }) ]);
        return tab;
      }
      function getUrlOrigin(url = "") {
        return url.substring(0, url.indexOf("/", url.indexOf(":") + 3));
      }
      function setUrlParams(url, opts) {
        const u = new URL(url);
        for (const key of [ "search", "searchMode" ]) key in opts ? u.searchParams.set(key, opts[key]) : u.searchParams.delete(key);
        u.hash = opts.options ? "#stylus-options" : "";
        return u.href;
      }
      function waitForTabUrl(tabId) {
        return new Promise(resolve => {
          browser.tabs.onUpdated.addListener(function onUpdated(updatedId, info, updatedTab) {
            if (info.url && updatedId === tabId) {
              browser.tabs.onUpdated.removeListener(onUpdated);
              resolve(updatedTab);
            }
          }, ..."UpdateFilter" in browser.tabs ? [ {
            tabId
          } ] : []);
        });
      }
      const popups = new Map;
      const onTabUpdated = async (tabId, {url}) => {
        if (url && popups.has(tabId)) {
          const data = await makePopupData(tabId);
          for (const port of popups.get(tabId) || []) port.postMessage(data);
        }
      };
      const toggleObserver = enable => util_webext.toggleListener(chrome.tabs.onUpdated, enable, onTabUpdated);
      msg.onConnect.popup = port => {
        popups.size || toggleObserver(!0);
        const tabId = +port.name.split(":")[1];
        const ports = popups.get(tabId);
        ports ? ports.add(port) : popups.set(tabId, new Set([ port ]));
      };
      msg.onDisconnect.popup = port => {
        const tabId = +port.name.split(":")[1];
        const ports = popups.get(tabId);
        ports != null && ports.delete(port) && !ports.size && popups.delete(tabId) && !popups.size && toggleObserver(!1);
      };
      async function makePopupData(tabId) {
        let tmp;
        let tab = await (tabId != null ? browser.tabs.get(tabId).catch(util.NOP) : util_webext.getActiveTab());
        if (!tab) return;
        tabId != null || (tabId = tab.id);
        ua.FIREFOX && tab.status === "loading" && tab.url === "about:blank" && (tab = await waitForTabUrl(tabId));
        const url = tab.url || tab.pendingUrl || "";
        const td = tabCache[tabId] || !1;
        const isOwn = url.startsWith(js_urls.ownRoot);
        const [ping0 = ua.FIREFOX >= 153 && await reinjectContentScripts(tab), frames] = await Promise.all([ isOwn || js_urls.supported(url) && pingTab(tabId), isOwn && ua.CHROME && getAllFrames(url, tab) || browser.webNavigation.getAllFrames({
          tabId
        }) ]);
        const unknown = new Map(frames.map(f => [ f.frameId, f ]));
        const known = new Map;
        const urls = new Set([ "about:blank" ]);
        const styleMap = td.styleIds;
        if (styleMap) for (let id in styleMap) unknown.has(id = +id) || ((tmp = td.url[id]) ? unknown.set(id, {
          frameId: id,
          parentFrameId: 0,
          styles: getByUrl(tmp, void 0, tabId),
          url: tmp
        }) : delete styleMap[id]);
        known.set(0, unknown.get(0) || {
          frameId: 0,
          url: ""
        });
        unknown.delete(0);
        let lastSize = 0;
        for (;unknown.size !== lastSize; ) {
          for (const [frameId, f] of unknown) if (known.has(f.parentFrameId)) {
            unknown.delete(frameId);
            f.errorOccurred || known.set(frameId, f);
            f.url === "about:blank" && (f.url = known.get(f.parentFrameId).url);
          }
          lastSize = unknown.size;
        }
        frames.length = 0;
        for (const sortedFrames of [ known, unknown ]) for (const f of sortedFrames.values()) {
          var _;
          const u = (_ = f.url) != null ? _ : f.url = "";
          f.isDupe = f.frameId && urls.has(u);
          urls.add(u);
          frames.push(f);
        }
        frames[0].url = url;
        const urlSupported = js_urls.supported(url);
        if (urlSupported) {
          bgBusy && await bgBusy;
          for (const f of frames) f.url && !f.isDupe && (f.styles != null || (f.styles = getByUrl(f.url, void 0, tabId)));
        }
        return {
          frames,
          ping0,
          tab,
          urlSupported,
          [consts.kTabOvrToggle]: td[consts.kTabOvrToggle]
        };
      }
      async function getAllFrames(url, {id: tabId}) {
        let res;
        var _;
        res = (_ = chrome.extension.getViews({
          tabId
        })[0]) == null || (_ = _[0]) == null ? void 0 : _.location.href;
        return [ {
          frameId: 0,
          url
        }, res && {
          frameId: 1,
          parentFrameId: 0,
          url: res
        } ].filter(Boolean);
      }
      const kRuleIds = "ruleIds";
      const rxNONCE = /(?:^|[;,])\s*style-src\s+[^;,]*?'nonce-([-+/=\w]+)'/;
      const BLOB_URL_PREFIX = "blob:" + js_urls.ownRoot;
      const WR_FILTER = {
        urls: [ "*://*/*" ],
        types: [ "main_frame", "sub_frame" ]
      };
      const makeBlob = data => new Blob([ JSON.stringify(data) ], {
        type: "application/json"
      });
      const makeXhrCookie = blobId => `${util_webext.ownId}=${blobId}; SameSite=Lax`;
      const req2key = req => req.tabId + ":" + req.frameId;
      const revokeObjectURL = blobId => blobId && URL.revokeObjectURL(BLOB_URL_PREFIX + blobId);
      const toSend = {};
      const ruleIdKeys = {};
      let ruleIds;
      let curOFF = !0;
      let flushPending;
      prefs.subscribe("disableAll", async function(_, OFF) {
        if (curOFF !== OFF) {
          curOFF = OFF;
          util_webext.toggleListener(chrome.webRequest.onBeforeRequest, !OFF, prepareStyles, WR_FILTER);
          util_webext.toggleListener(chrome.webRequest.onHeadersReceived, !OFF, modifyHeaders, WR_FILTER, !OFF && [ "responseHeaders", (WRBTest ? await WRBTest : WRB) && "blocking", chrome.webRequest.OnHeadersReceivedOptions.EXTRA_HEADERS ].filter(Boolean));
        }
      }, !0);
      bgBusy.then(() => {
        const tabIds = [];
        for (let key in ruleIdKeys) tabCache[key = parseInt(key)] || tabIds.push(key);
        tabIds.length && removeTabData(tabIds);
      });
      onUnload.add((tabId, frameId, port) => {
        var _;
        const key = tabId + ":" + frameId;
        const data = toSend[key];
        if (data) data.timer = setTimeout(removePreloadedStyles, 1e4, null, key); else if (frameId && (_ = tabCache[tabId]) != null && _.styleIds) {
          updateIconBadge.call(port, [], !0);
          frameId || removeTabData([ tabId ]);
        }
      });
      util_webext.webNavigation.onErrorOccurred.addListener(removePreloadedStyles, {
        url: [ {
          urlPrefix: "http"
        } ]
      });
      ua.CHROME && chrome.webRequest.onBeforeRequest.addListener(req => {
        if (!req.url.includes("?")) {
          chrome.tabs.update(req.tabId, {
            url: "edit.html?id=" + req.url.split("#")[1]
          });
          return {
            cancel: !0
          };
        }
      }, {
        urls: [ js_urls.ownRoot + "*.user.css" ],
        types: [ "main_frame" ]
      }, [ "blocking" ]);
      ua.CHROME && chrome.webRequest.onBeforeRequest.addListener(req => {
        dataHub.set("popup", req.tabId < 0 && makePopupData());
      }, {
        urls: [ js_urls.actionPopupUrl ],
        types: [ "main_frame" ]
      });
      async function prepareStyles(req) {
        const init = bgBusy;
        init && await init;
        let v;
        const {tabId, frameId, url} = req;
        const key = tabId + ":" + frameId;
        prefs.__values.styleViaXhr && (!(v = optionSites.styleViaXhr) || isOptionSite(v, url));
        if (tabId < 0 || init) return;
        const oldData = toSend[key];
        const data = oldData || {};
        const payload = getSectionsByUrl.call({
          sender: req
        }, url, {
          init: "styleViaXhr"
        });
        const samePayload = oldData && util.deepEqual(payload, data.payload);
        data.payload = payload;
        data.url = url;
        samePayload ? data.timer = clearTimeout(data.timer) : oldData && removePreloadedStyles(null, key, data);
        toSend[key] = data;
      }
      function modifyHeaders(req) {
        var _;
        const key = req2key(req);
        const data = toSend[key];
        if (!data) return;
        let v;
        const {responseHeaders} = req;
        const {payload} = data;
        const styled = payload.sections.length;
        const cspOn = prefs.__values.patchCsp && (!(v = optionSites.patchCsp) || isOptionSite(v, req.url));
        let csp = (ua.FIREFOX || cspOn) && findHeader(responseHeaders, "content-security-policy");
        cspOn && ua.FIREFOX && (v = findHeader(responseHeaders, "content-type")) && /^text\/html|^application\/xhtml/i.test(v.value) && patchCspMetaTag(req.requestId);
        if (csp) {
          const m = (v = csp.value).match(rxNONCE);
          m && set(req.tabId, "nonce", req.frameId, payload.cfg.nonce = m[1]);
          csp = cspOn && styled && (csp.value = patchCsp(v));
        }
        if (!styled) {
          removePreloadedStyles(req, key, data);
          return;
        }
        let blobId;
        if (prefs.__values.styleViaXhr && (!(v = optionSites.styleViaXhr) || isOptionSite(v, req.url)) && (blobId = (_ = data.blobId) != null ? _ : data.blobId = URL.createObjectURL(makeBlob(payload)).slice(BLOB_URL_PREFIX.length))) {
          blobId = makeXhrCookie(blobId);
          responseHeaders.push({
            name: "set-cookie",
            value: blobId
          });
        }
        return blobId || csp ? {
          responseHeaders
        } : void 0;
      }
      function removePreloadedStyles(req, key = req2key(req), data = toSend[key], keep) {
        let v;
        if (data) {
          delete toSend[key];
          if (v = data.blobId) {
            req ? setTimeout(revokeObjectURL, 1e4, v) : revokeObjectURL(v);
            data.blobId = "";
          }
          (v = data.timer) && (data.timer = clearTimeout(v));
        }
      }
      function removeTabData(tabIds) {
        tabIds = new RegExp(`^(?:${tabIds.join("|")}):`);
        const ids = [];
        for (const key in ruleIdKeys) if (tabIds.test(key)) {
          const id = ruleIdKeys[key];
          ids.push(id);
          delete ruleIds[id];
          delete ruleIdKeys[key];
        }
        if (ids.length) {
          dnr.updateSessionRules(void 0, ids);
          flushPending != null || (flushPending = setTimeout(flushState));
        }
        for (const key in toSend) tabIds.test(key) && removePreloadedStyles(null, key);
      }
      function findHeader(headers, name, value) {
        for (const h of headers) if (h.name.toLowerCase() === name && (value == null || h.value === value)) return h;
      }
      function flushState() {
        flushPending = null;
        util.isEmptyObj(ruleIds) ? stateDB.delete(kRuleIds) : stateDB.put(ruleIds, kRuleIds);
      }
      const staleBadges = new Set;
      const imageDataCache = {};
      const badgeOvr = {
        color: "",
        text: ""
      };
      const ICON_SIZES = ua.VIVALDI ? [ 19, 38 ] : ua.FIREFOX ? ua.MOBILE ? [ 32, 38 ] : [ 16, 32, 38 ] : [ 16, 32 ];
      const kBadgeDisabled = "badgeDisabled";
      const kBadgeNormal = "badgeNormal";
      const kIconset = "iconset";
      const kShowBadge = "show-badge";
      let hasCanvas = !(ua.FIREFOX && ua.MOBILE) && null;
      if (util_webext.browserAction) {
        bgInit.push(initIcons);
        util_webext.browserSidebar && prefs.subscribe("popup.sidePanel", (key, val) => {
          try {
            util_webext.browserAction.setPopup({
              popup: val ? "" : "popup.html"
            });
            util_webext.toggleListener(util_webext.browserAction.onClicked, val, openPopupInSidebar);
          } catch (_) {
            console.error(_);
          }
        }, !0);
      }
      onSchemeChange.add(() => {
        if (prefs.__values[kIconset] === -1) {
          util.debounce(refreshGlobalIcon);
          util.debounce(refreshAllIcons);
        }
      });
      async function refreshIconsWhenReady() {
        if (util_webext.browserAction) {
          if (bgBusy) {
            bgInit[bgInit.indexOf(initIcons)] = 0;
            await bgBusy;
          }
          initIcons(!0);
        }
      }
      function initIcons(runNow = !0) {
        prefs.subscribe([ "disableAll", kBadgeDisabled, kBadgeNormal ], () => util.debounce(refreshIconBadgeColor), runNow);
        prefs.subscribe([ kShowBadge ], () => util.debounce(refreshAllIconsBadgeText), runNow);
        prefs.subscribe([ "disableAll", kIconset ], () => util.debounce(refreshAllIcons), runNow);
      }
      function updateIconBadge(styleIds, lazyBadge, iid) {
        const {tab: {id: tabId}, TDM} = this.sender;
        const frameId = TDM > 0 ? 0 : this.sender.frameId;
        const value = styleIds.length ? styleIds.map(Number) : void 0;
        if (tabId != null) {
          set(tabId, "styleIds", frameId, value);
          iid && set(tabId, "iid", frameId, iid);
          util.debounce(refreshStaleBadges, frameId && lazyBadge ? 250 : 0);
          staleBadges.add(tabId);
          frameId || refreshIcon(tabId, !0);
          removePreloadedStyles(null, tabId + ":" + frameId);
        }
      }
      function overrideBadge({text = "", color = "", title = ""} = {}) {
        if (badgeOvr.text !== text) {
          badgeOvr.text = text;
          badgeOvr.color = color;
          refreshIconBadgeColor();
          setBadgeText({
            text
          });
          for (let tabId in tabCache) {
            tabId = +tabId;
            text ? setBadgeText({
              tabId,
              text
            }) : refreshIconBadgeText(tabId);
          }
          util_webext.browserAction.setTitle({
            title: title && util.t(title, "", !1) || title || ""
          }).catch(util.NOP);
        }
      }
      function refreshIconBadgeText(tabId) {
        badgeOvr.text || setBadgeText({
          tabId,
          text: prefs.__values[kShowBadge] ? `${getStyleCount(tabId)}` : ""
        });
      }
      function getIconName(hasStyles = !1) {
        const i = prefs.__values[kIconset];
        return `${i === 0 || i === -1 && isDark ? "" : "light/"}$SIZE$${prefs.__values.disableAll ? "x" : hasStyles ? "" : "w"}`;
      }
      function refreshIcon(tabId, force = !1) {
        var _, ee;
        const td = (_ = tabCache[tabId]) != null ? _ : tabCache[tabId] = {
          id: tabId
        };
        const oldIcon = td.icon;
        const newIcon = getIconName((ee = td.styleIds) == null ? void 0 : ee[0]);
        if (force || oldIcon !== newIcon) {
          set(tabId, "icon", newIcon);
          setIcon({
            path: getIconPath(newIcon),
            tabId
          });
        }
      }
      function getIconPath(icon) {
        return ICON_SIZES.reduce((obj, size) => {
          obj[size] = util_webext.MF_ICON_PATH + icon.replace("$SIZE$", size) + util_webext.MF_ICON_EXT;
          return obj;
        }, {});
      }
      function getStyleCount(tabId) {
        const allIds = new Set;
        for (const frameData of Object.values(((_ = tabCache[tabId]) == null ? void 0 : _.styleIds) || {})) {
          var _;
          frameData.forEach(allIds.add, allIds);
        }
        return allIds.size || "";
      }
      async function loadImage(url) {
        const img = ua.CHROME ? await createImageBitmap(await (await fetch(url)).blob()) : await new Promise((resolve, reject) => Object.assign(new Image, {
          src: url,
          onload: e => resolve(e.target),
          onerror: reject
        }));
        const {width: w, height: h} = img;
        const result = util_webext.paintCanvas(w, h, ctx => ctx.drawImage(img, 0, 0, w, h));
        imageDataCache[url] = result;
        return result;
      }
      function openPopupInSidebar(tab) {
        util_webext.openSidebar("popup.html?sidebar", !1, {
          tabId: tab.id
        });
      }
      function refreshGlobalIcon() {
        setIcon({
          path: getIconPath(getIconName())
        });
      }
      function refreshIconBadgeColor() {
        util_webext.browserAction.setBadgeBackgroundColor({
          color: badgeOvr.color || prefs.__values[prefs.__values.disableAll ? kBadgeDisabled : kBadgeNormal]
        }).catch(util.NOP);
      }
      function refreshAllIcons() {
        for (const tabId in tabCache) refreshIcon(+tabId);
        refreshGlobalIcon();
      }
      function refreshAllIconsBadgeText() {
        for (const tabId in tabCache) refreshIconBadgeText(+tabId);
      }
      function refreshStaleBadges() {
        for (const tabId of staleBadges) refreshIconBadgeText(tabId);
        staleBadges.clear();
      }
      async function setIcon(data) {
        if (hasCanvas == null) {
          const url = util_webext.MF_ICON_PATH + ICON_SIZES[0] + util_webext.MF_ICON_EXT;
          hasCanvas = imageDataCache[url] = loadImage(url);
          hasCanvas = (await hasCanvas).data.some(b => b !== 255);
        } else hasCanvas.then && await hasCanvas;
        if (hasCanvas) {
          data.imageData = {};
          for (const [key, url] of Object.entries(data.path)) {
            const val = imageDataCache[url] || (imageDataCache[url] = loadImage(url));
            data.imageData[key] = val.then ? await val : val;
          }
          delete data.path;
        }
        util_webext.browserAction.setIcon(data).catch(util.NOP);
      }
      function setBadgeText(data) {
        util_webext.browserAction.setBadgeText(data).catch(util.NOP);
      }
      const styleMap = new Map;
      const stylePreviewMap = new Map;
      const order = {
        main: {},
        prio: {}
      };
      const orderWrap = {
        id: "injectionOrder",
        value: util.mapObj(order, () => []),
        _id: `${chrome.runtime.id}-injectionOrder`,
        _rev: 0
      };
      function calcRemoteId({md5Url, updateUrl, usercssData: ucd} = {}) {
        let id;
        id = (id = /\d+/.test(md5Url) || js_urls.extractUsoaId(updateUrl)) && `uso-${id}` || (id = js_urls.extractUswId(updateUrl)) && `usw-${id}` || "";
        return id && [ id, !(ucd == null || !ucd.vars) ];
      }
      const getById = id => styleMap.get(+id);
      const getByUuid = uuid => styleMap.get(uuidIndex.get(uuid));
      const mergeWithMapped = style => ({
        ...styleMap.get(style.id) || {
          enabled: !0,
          installDate: Date.now()
        },
        ...style
      });
      function broadcastStyleUpdated({enabled, id}, reason, isNew, msg) {
        updateSections(id);
        return broadcast({
          method: isNew ? "styleAdded" : "styleUpdated",
          style: {
            id,
            enabled
          },
          reason,
          ...msg
        });
      }
      async function setOrderImpl(data, {broadcast: broadcastAllowed, calc = !0, store = !0, sync} = {}) {
        const groups = data == null ? void 0 : data.value;
        if (groups && !util.deepEqual(groups, orderWrap.value)) {
          Object.assign(orderWrap, data, sync && {
            _rev: Date.now()
          });
          if (calc) for (const type in groups) {
            const src = groups[type];
            const dst = order[type] = {};
            let uniq = !0;
            for (let styleId, iDup, i = 0; i < src.length; i++) if (styleId = uuidIndex.get(src[i])) {
              (iDup = dst[styleId]) >= 0 && (uniq = src[iDup] = !1);
              dst[styleId] = i;
            }
            uniq || (groups[type] = src.filter(Boolean));
          }
          broadcastAllowed && broadcastInjectorConfig("order", order);
          store && await prefsDB.put(orderWrap, orderWrap.id);
          sync && putDoc(orderWrap);
        }
      }
      function storeInMap(style) {
        const {id} = style;
        styleMap.set(id, style);
        stylePreviewMap.delete(id);
        uuidIndex.set(style._id, id);
      }
      function toggleSiteOvrImpl(style, val, type, add) {
        let list = style[type = type ? "inclusions" : "exclusions"];
        add ? list ? list.includes(val) || list.push(val) : list = style[type] = [ val ] : list && (val = list.indexOf(val)) >= 0 ? list.length > 1 ? list.splice(val, 1) : style[type] = null : type = !1;
        return !!type;
      }
      uuidIndex.addCustom(orderWrap, {
        set: setOrderImpl
      });
      const BAD_MATCHER = /^$/;
      const EXT_RE = /\bextension\b/;
      const GLOB_RE = /^(\*|[\w-]+):\/\/(\*\.)?([\w.]+\/.*)/;
      const cache = new Map;
      let trimmed;
      function buildOverrideRe(text) {
        const slashed = text.startsWith("/");
        const match = text.match(slashed ? util.RX_MAYBE_REGEXP : GLOB_RE);
        return match ? slashed ? match : "^" + (match[1] === "*" ? "[\\w-]+" : match[1]) + "://" + (match[2] ? "(?:[\\w.]+\\.)?" : "") + util.globAsRegExpStr(match[3]) + "$" : "^" + util.globAsRegExpStr(text) + "$";
      }
      function compile(text) {
        let re;
        try {
          if (typeof text == "string") re = new RegExp(text); else {
            re = text;
            text = text[0];
            re = new RegExp(re[1], re[2]);
          }
        } catch {
          re = BAD_MATCHER;
        }
        cache.set(text, re);
        if (!trimmed) {
          trimmed = new Set;
          setInterval(trimCache, 3e5);
        }
        return re;
      }
      function matchOverrides(what, url) {
        var _, ee;
        +what && (what = styleMap.get(what));
        if (!what) return "";
        url = {
          url
        };
        const inc = (_ = what.inclusions) == null ? void 0 : _.filter(urlMatchOverride, url).join("\n+");
        const exc = (ee = what.exclusions) == null ? void 0 : ee.filter(urlMatchOverride, url).join("\n-");
        return (inc ? "+" + inc : "") + (exc ? `${inc ? "\n" : ""}-${exc}` : "");
      }
      function trimCache() {
        let num = cache.size / 10;
        for (const key of trimmed) cache.has(key) ? --num : trimmed.delete(key);
        num = Math.max(0, num) | 0;
        if (num) for (const key of cache.keys()) {
          trimmed.add(key);
          cache.delete(key);
          if (--num) break;
        }
      }
      function urlMatchSection(query, section, skipEmptyGlobal) {
        var _, ee;
        let dd, ddL, pp, ppL, rr, rrL, uu, uuL;
        return !!((dd = section.domains) && (ddL = dd.length) && dd.some(urlMatchDomain, query) || (pp = section.urlPrefixes) && (ppL = pp.length) && pp.some(urlMatchPrefix, query) || (uu = section.urls) && (uuL = uu.length) && (uu.includes(query.url) || uu.includes((_ = query.urlWithoutHash) != null ? _ : query.urlWithoutHash = query.url.split("#", 1)[0])) || (rr = section.regexps) && (rrL = rr.length) && rr.some(urlMatchRegexp, query)) || (rrL && rr.some(urlMatchRegexpSloppy, query) ? "sloppy" : !(rrL || ppL || uuL || ddL || ((ee = query.isOwnPage) != null ? ee : query.isOwnPage = query.url.startsWith(js_urls.ownRoot)) || skipEmptyGlobal && style_util.styleCodeEmpty(section)));
      }
      function urlMatchDomain(d) {
        var _;
        const ee = (_ = this.domain) != null ? _ : this.domain = util.tryURL(this.url).hostname;
        return d === ee || ee[ee.length - d.length - 1] === "." && ee.endsWith(d);
      }
      function urlMatchOverride(e) {
        var _;
        return (cache.get(e) || compile(buildOverrideRe(e))).test((_ = this.urlWithoutParams) != null ? _ : this.urlWithoutParams = this.url.split(/[?#]/, 1)[0]);
      }
      function urlMatchPrefix(p) {
        return p && this.url.startsWith(p);
      }
      function urlMatchRegexp(r) {
        var _;
        return (!((_ = this.isOwnPage) != null ? _ : this.isOwnPage = this.url.startsWith(js_urls.ownRoot)) || EXT_RE.test(r)) && (cache.get(r) || compile(`^(${r})$`)).test(this.url);
      }
      function urlMatchRegexpSloppy(r) {
        var _;
        return (!((_ = this.isOwnPage) != null ? _ : this.isOwnPage = this.url.startsWith(js_urls.ownRoot)) || EXT_RE.test(r)) && (cache.get(r) || compile(`^${r}$`)).test(this.url);
      }
      const entries = new Map;
      function add(url, val) {
        entries.delete(url);
        entries.set(url, val);
        entries.size >= 1e3 && prune();
      }
      function cache_create(url, cache, maybe, tabOvr) {
        const query = {
          url
        };
        for (let style of maybe || styleMap.values()) {
          let forced, id, isIncluded, v;
          if (maybe) {
            id = style;
            maybe.delete(id) && !maybe.size && (cache.maybe = null);
            if (!(style = styleMap.get(id))) continue;
          } else id = style.id;
          style = stylePreviewMap.get(id) || style;
          if ((!style.enabled || !themeAllowsStyle(style) || (v = style.exclusions) && v.length && v.some(urlMatchOverride, query) || (v = style.inclusions) && v.length && !(isIncluded = v.some(urlMatchOverride, query)) && style.overridden) && !(forced = tabOvr == null ? void 0 : tabOvr[id])) cache.delete(id); else {
            v = [];
            for (const section of style.sections) !isIncluded && urlMatchSection(query, section) !== !0 || style_util.styleCodeEmpty(section) || v.push(section.code);
            v.length ? cache.set(id, {
              id,
              code: v,
              name: style.customName || style.name,
              tabOvr: forced
            }) : cache.delete(id);
          }
        }
      }
      function updateSections(id, removed) {
        for (const entry of entries.values()) if (removed) entry.delete(id); else {
          var _;
          ((_ = entry.maybe) != null ? _ : entry.maybe = new Set).add(id);
        }
      }
      function prune() {
        let num = entries.size / 10;
        for (const url of entries.keys()) {
          entries.delete(url);
          if (--num <= 0) break;
        }
      }
      var le;
      const hex4 = num => (num < 4096 ? num + 65536 : num).toString(16).slice(-4);
      const MISSING_PROPS = {
        name: style => `ID: ${style.id}`,
        _id: ((le = crypto.randomUUID) == null ? void 0 : le.bind(crypto)) || (() => {
          const seeds = crypto.getRandomValues(new Uint16Array(8));
          return hex4(seeds[0]) + hex4(seeds[1]) + "-" + hex4(seeds[2]) + "-" + hex4(seeds[3] & 4095 | 16384) + "-" + hex4(seeds[4] & 16383 | 32768) + "-" + hex4(seeds[5]) + hex4(seeds[6]) + hex4(seeds[7]);
        })
      };
      function fixKnownProblems(style, revive) {
        let res = 0;
        let v;
        res += fixRevision(style) || 0;
        for (const key in MISSING_PROPS) if (!style[key]) {
          style[key] = MISSING_PROPS[key](style);
          res = 1;
        }
        for (const key in style) {
          v = style[key];
          if (v == null || typeof v == "object" && util.isEmptyObj(v)) {
            res < 2 && !revive && (style = {
              ...style
            });
            delete style[key];
            res = 2;
          }
        }
        res += inferHomepage(style);
        const {originalName} = style;
        if (originalName) {
          if (originalName !== style.name) {
            style.customName = style.name;
            style.name = originalName;
          }
          delete style.originalName;
          res = 1;
        }
        for (const key of [ "url", "installationUrl" ]) {
          const url = style[key];
          const fixedUrl = url && url.replace(/([^:]\/)\//, "$1");
          if (fixedUrl !== url) {
            res = 1;
            style[key] = fixedUrl;
          }
        }
        (v = style.md5Url) && v.includes("update.update.userstyles") && (res = style.md5Url = v.replace("update.update.userstyles", "update.userstyles"));
        if (`${style.url}${style.installationUrl}`.includes("https://33kk.github.io/uso-archive/")) {
          delete style.url;
          delete style.installationUrl;
        }
        return res && style;
      }
      function fixRevision(style) {
        const upd = style.updateDate || style.installDate;
        if (upd > (style._rev || 0)) {
          style._rev = upd;
          return !0;
        }
      }
      function inferHomepage(style) {
        let res, v;
        if ((!style.url || !style.installationUrl) && (v = style.updateUrl) && (v = js_urls.makeInstallUrl(v) || (v = /\d+/.exec(style.md5Url)) && `${js_urls.uso}styles/${v[0]}`)) {
          style.url || (res = style.url = v);
          style.installationUrl || (res = style.installationUrl = v);
        }
        return !!res;
      }
      async function inferHomepages() {
        const toWrite = [];
        let skip, style;
        for (style of styleMap.values()) inferHomepage(style) && toWrite.push([ style.id, style._rev ]);
        for (const [id, rev] of toWrite) {
          skip || await util.sleep(50);
          (skip = !(style = styleMap.get(id))) || rev !== style._rev && !inferHomepage(style) || await save(style, !1, void 0, !0);
        }
      }
      function onBeforeSave(style) {
        style.id || delete style.id;
        return fixKnownProblems(style);
      }
      function onSaved(style, reason, id = style.id, msg) {
        const isNew = !styleMap.has(id);
        style.id != null || (style.id = id);
        storeInMap(style);
        reason !== !1 ? broadcastStyleUpdated(style, reason, isNew, msg) : updateSections(id);
        reason !== "sync" && putDoc(style);
        return style;
      }
      var webext_launch_web_auth_flow = oe(875);
      const AUTH = {
        dropbox: {
          flow: "token",
          clientId: "zg52vphuapvpng9",
          authURL: "https://www.dropbox.com/oauth2/authorize",
          tokenURL: "https://api.dropboxapi.com/oauth2/token",
          revoke: token => fetch("https://api.dropboxapi.com/2/auth/token/revoke", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        },
        google: {
          flow: "code",
          clientId: "283762574871-d4u58s4arra5jdan2gr00heasjlttt1e.apps.googleusercontent.com",
          clientSecret: "J0nc5TlR_0V_ex9-sZk-5faf",
          authURL: "https://accounts.google.com/o/oauth2/v2/auth",
          authQuery: {
            access_type: "offline",
            prompt: "consent"
          },
          tokenURL: "https://oauth2.googleapis.com/token",
          scopes: [ "https://www.googleapis.com/auth/drive.appdata" ]
        },
        onedrive: {
          flow: "code",
          clientId: "3864ce03-867c-4ad8-9856-371a097d47b1",
          clientSecret: "9Pj=TpsrStq8K@1BiwB9PIWLppM:@s=w",
          authURL: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
          tokenURL: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
          scopes: [ "Files.ReadWrite.AppFolder", "offline_access" ]
        },
        userstylesworld: {
          flow: "code",
          clientId: "zeDmKhJIfJqULtcrGMsWaxRtWHEimKgS",
          clientSecret: "wqHsvTuThQmXmDiVvOpZxPwSIbyycNFImpAOTxjaIRqDbsXcTOqrymMJKsOMuibFaijZZAkVYTDbLkQuYFKqgpMsMlFlgwQOYHvHFbgxQHDTwwdOroYhOwFuekCwXUlk",
          authURL: js_urls.usw + "api/oauth/style/link",
          tokenURL: js_urls.usw + "api/oauth/token",
          redirect_uri: "https://gusted.xyz/callback_helper/"
        }
      };
      let alwaysUseTab = !util_webext.browserWindows || !ua.FIREFOX && null;
      class TokenError extends Error {
        constructor(provider, message) {
          super(`[${provider}] ${message}`);
          this.name = "TokenError";
          this.provider = provider;
          Error.captureStackTrace && Error.captureStackTrace(this, TokenError);
        }
      }
      function buildKeys(name, hooks) {
        const prefix = `secure/token/${hooks ? hooks.keyName(name) : name}/`;
        const k = {
          TOKEN: `${prefix}token`,
          EXPIRE: `${prefix}expire`,
          REFRESH: `${prefix}refresh`
        };
        k.LIST = Object.values(k);
        return k;
      }
      async function getToken(name, interactive, hooks) {
        const k = buildKeys(name, hooks);
        const obj = await storage_util.chromeLocal.get(k.LIST);
        if (obj[k.TOKEN]) {
          if (!obj[k.EXPIRE] || Date.now() < obj[k.EXPIRE]) return obj[k.TOKEN];
          if (obj[k.REFRESH]) return refreshToken(name, k, obj);
        }
        if (!interactive) throw new TokenError(name, "Token is missing");
        return authUser(k, name, interactive, hooks);
      }
      async function revokeToken(name, hooks) {
        const provider = AUTH[name];
        const k = buildKeys(name, hooks);
        if (provider.revoke) try {
          const token = await storage_util.chromeLocal.getValue(k.TOKEN);
          token && await provider.revoke(token);
        } catch (_) {
          console.error(_);
        }
        await storage_util.chromeLocal.remove(k.LIST);
      }
      async function refreshToken(name, k, obj) {
        if (!obj[k.REFRESH]) throw new TokenError(name, "No refresh token");
        const provider = AUTH[name];
        const body = {
          client_id: provider.clientId,
          refresh_token: obj[k.REFRESH],
          grant_type: "refresh_token",
          scope: provider.scopes.join(" ")
        };
        provider.clientSecret && (body.client_secret = provider.clientSecret);
        const result = await postQuery(provider.tokenURL, body);
        result.refresh_token || (result.refresh_token = obj[k.REFRESH]);
        return handleTokenResult(result, k);
      }
      async function authUser(keys, name, interactive = !1, hooks = null) {
        const provider = AUTH[name];
        const state = Math.random().toFixed(8).slice(2);
        const redirectUri = provider.redirect_uri || "https://clngdbkpkpeebahjckkjfobafhncgmne.chromiumapp.org/";
        const query = {
          response_type: provider.flow,
          client_id: provider.clientId,
          redirect_uri: redirectUri,
          state
        };
        provider.scopes && (query.scope = provider.scopes.join(" "));
        provider.authQuery && Object.assign(query, provider.authQuery);
        hooks == null || hooks.query(query);
        const url = `${provider.authURL}?${new URLSearchParams(query)}`;
        const finalUrl = await authUserMV2(url, interactive, redirectUri);
        const params = new URLSearchParams(provider.flow === "token" ? new URL(finalUrl).hash.slice(1) : new URL(finalUrl).search.slice(1));
        if (params.get("state") !== state) throw new TokenError(name, `Unexpected state: ${params.get("state")}, expected: ${state}`);
        let result;
        if (provider.flow === "token") {
          const obj = {};
          for (const [key, value] of params) obj[key] = value;
          result = obj;
        } else {
          const body = {
            code: params.get("code"),
            grant_type: "authorization_code",
            client_id: provider.clientId,
            redirect_uri: query.redirect_uri,
            state
          };
          provider.clientSecret && (body.client_secret = provider.clientSecret);
          result = await postQuery(provider.tokenURL, body);
        }
        return handleTokenResult(result, keys);
      }
      async function authUserMV2(url, interactive, redirectUri) {
        alwaysUseTab != null || (alwaysUseTab = isVivaldi != null ? isVivaldi : await vivaldiTest());
        const width = util.clamp(screen.availWidth - 100, 400, 800);
        const height = util.clamp(screen.availHeight - 100, 200, 800);
        const wnd = !alwaysUseTab && await util_webext.browserWindows.getLastFocused();
        return (0, webext_launch_web_auth_flow.default)({
          url,
          alwaysUseTab,
          interactive,
          redirect_uri: redirectUri,
          windowOptions: wnd && Object.assign({
            state: "normal",
            width,
            height
          }, wnd.state !== "minimized" && {
            top: Math.ceil(wnd.top + (wnd.height - width) / 2),
            left: Math.ceil(wnd.left + (wnd.width - width) / 2)
          })
        });
      }
      async function handleTokenResult(result, k) {
        await storage_util.chromeLocal.set({
          [k.TOKEN]: result.access_token,
          [k.EXPIRE]: result.expires_in ? Date.now() + 1e3 * (result.expires_in - 30) : void 0,
          [k.REFRESH]: result.refresh_token
        });
        return result.access_token;
      }
      async function postQuery(url, body) {
        const options = {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded"
          },
          body: body ? new URLSearchParams(body) : null
        };
        const r = await fetch(url, options);
        if (r.ok) return r.json();
        const text = await r.text();
        const err = new Error(`Failed to fetch (${r.status}): ${text}`);
        err.code = r.status;
        throw err;
      }
      const ALARM_ID = "syncNow";
      const PREF_ID = "sync.enabled";
      const SYNC_INIT_DELAY = 10 / 60;
      const STORAGE_KEY = "sync/state/";
      const NO_LOGIN = [ "webdav" ];
      const sync_manager_status = {
        state: "pending"
      };
      const compareRevision = (rev1, rev2) => rev1 - rev2;
      let lastError = null;
      let ctrl;
      let curDrive;
      let curDriveName;
      let delayedInit;
      let scheduling;
      let starting;
      let syncingNow;
      chrome.alarms.onAlarm.addListener(async a => {
        if (a.name === ALARM_ID) {
          bgBusy && await bgBusy;
          syncNow();
        }
      });
      prefs.subscribe(PREF_ID, schedule, !0);
      async function sync_manager_remove(...args) {
        delayedInit && await start();
        if (curDrive) {
          schedule();
          return ctrl.delete(...args);
        }
      }
      function getStatus(sneaky) {
        delayedInit && !sneaky && start();
        return sync_manager_status;
      }
      async function login(name) {
        delayedInit && await start();
        name || (name = curDriveName);
        await revokeToken(name);
        try {
          await getToken(name, !0);
          sync_manager_status.login = !0;
        } catch (_) {
          sync_manager_status.login = !1;
          throw _;
        } finally {
          emitStatusChange();
        }
      }
      async function putDoc({_id: _, _rev: ee}) {
        delayedInit && await start();
        if (curDrive) {
          schedule();
          return ctrl.put(_, ee);
        }
      }
      async function getDriveOptions(driveName) {
        const key = `secure/sync/driveOptions/${driveName}`;
        return (await chrome_sync.get(key))[key] || {};
      }
      function start(name = delayedInit) {
        return starting != null ? starting : starting = doStart(name).finally(() => {
          starting = null;
        });
      }
      async function doStart(name) {
        const isInit = name && name === delayedInit;
        const isStop = sync_manager_status.state === "disconnecting";
        delayedInit = !1;
        (ctrl != null ? ctrl : ctrl = db_to_cloud.dbToCloud({
          onGet: _ => getByUuid(_) || uuidIndex.custom[_] || Promise.reject("No such style UUID: " + _),
          async onPut(doc) {
            if (!doc) return;
            const id = uuidIndex.get(doc._id);
            const oldCust = !id && uuidIndex.custom[doc._id];
            const oldDoc = oldCust || getById(id);
            const diff = oldDoc ? compareRevision(oldDoc._rev, doc._rev) : -1;
            if (diff) if (diff > 0) putDoc(oldDoc); else if (oldCust) uuidIndex.custom[doc._id] = doc; else {
              delete doc.id;
              id && (doc.id = id);
              doc.id = await db.put(doc);
              await onSaved(doc, "sync");
            }
          },
          onDelete(_, rev) {
            const id = uuidIndex.get(_);
            const oldDoc = getById(id);
            return oldDoc && compareRevision(oldDoc._rev, rev) <= 0 && style_manager_remove(id, "sync");
          },
          onFirstSync() {
            for (const i of Object.values(uuidIndex.custom).concat([ ...styleMap.values() ])) ctrl.put(i._id, i._rev);
          },
          onProgress(e) {
            if (e.phase === "start") sync_manager_status.syncing = !0; else if (e.phase === "end") {
              sync_manager_status.syncing = !1;
              sync_manager_status.progress = null;
            } else sync_manager_status.progress = e;
            lastError && setError();
            emitStatusChange();
          },
          compareRevision,
          getState: drive => storage_util.chromeLocal.getValue(STORAGE_KEY + drive.name),
          setState: (drive, state) => storage_util.chromeLocal.set({
            [STORAGE_KEY + drive.name]: state
          }),
          retryMaxAttempts: 10,
          retryExp: 1.2,
          retryDelay: 6
        })).then && (ctrl = await ctrl);
        if (!curDrive) {
          curDriveName = name;
          curDrive = getDrive(name).catch(console.error);
          curDrive = await curDrive;
          ctrl.use(curDrive);
          sync_manager_status.state = "connecting";
          sync_manager_status.drive = curDriveName;
          emitStatusChange();
          if (isInit || NO_LOGIN.includes(curDriveName)) sync_manager_status.login = !0; else try {
            await login(name);
          } catch (_) {
            console.error(_);
            setError(_);
            emitStatusChange();
            return stop();
          }
          await ctrl.init();
          if (!isStop) {
            await syncNow();
            prefs.set(PREF_ID, name);
            sync_manager_status.state = "connected";
            emitStatusChange();
          }
        }
      }
      async function stop() {
        if (delayedInit) {
          sync_manager_status.state = "disconnecting";
          try {
            await start();
          } catch {}
        }
        if (curDrive) {
          sync_manager_status.state = "disconnecting";
          emitStatusChange();
          try {
            await ctrl.uninit();
            await revokeToken(curDriveName);
            await storage_util.chromeLocal.remove(STORAGE_KEY + curDriveName);
          } catch {}
          curDrive = curDriveName = null;
          prefs.set(PREF_ID, "none");
          sync_manager_status.state = "disconnected";
          sync_manager_status.drive = null;
          sync_manager_status.login = !1;
          emitStatusChange();
        }
      }
      async function syncNow() {
        if (!syncingNow) {
          syncingNow = !0;
          delayedInit && await start();
          if (curDrive && sync_manager_status.login) {
            try {
              await ctrl.syncNow();
              setError();
            } catch (_) {
              _.message = translateErrorMessage(_);
              setError(_);
              isGrantError(_) && (sync_manager_status.login = !1);
            }
            syncingNow = !1;
            emitStatusChange();
          } else console.warn("cannot sync when disconnected");
        }
      }
      function emitStatusChange() {
        broadcastExtension({
          method: "syncStatusUpdate",
          status: sync_manager_status
        });
        overrideBadge(getErrorBadge());
      }
      function isGrantError(err) {
        return err.code === 401 || !(err.code !== 400 || !/invalid_grant/.test(err.message)) || err.name === "TokenError";
      }
      function getErrorBadge() {
        if (sync_manager_status.state === "connected" && (!sync_manager_status.login || lastError && !(err = lastError, 
        err.name === "TypeError" && /networkerror|failed to fetch/i.test(err.message) || err.code === 502))) return {
          text: "x",
          color: "#F00",
          title: sync_manager_status.login ? `${util.t("syncError")}\n---------------------\n${lastError.message.replace(/.{60,}?\s(?=.{30,})/g, "$&\n")}` : "syncErrorRelogin"
        };
        var err;
      }
      async function getDrive(name) {
        if (!util.hasOwn(cloudDrive, name)) throw new Error(`Unknown cloud provider: ${name}`);
        const opts = await getDriveOptions(name);
        const webdav = name === "webdav";
        if (webdav && !util.tryURL(opts.url)) {
          prefs.set(PREF_ID, "none");
          throw new Error("Broken options: WebDAV server URL is missing");
        }
        opts.getAccessToken = () => getToken(name);
        webdav && (opts.fetch = util.fetchWebDAV.bind(opts));
        return cloudDrive[name](opts);
      }
      async function schedule(prefKey, prefVal = curDriveName, isInit) {
        if (scheduling) return;
        scheduling = !0;
        const alarm = isInit && await browser.alarms.get(ALARM_ID);
        delayedInit = util.hasOwn(cloudDrive, prefVal) && prefVal;
        if (delayedInit) (!alarm || Math.abs((alarm.periodInMinutes || 1e99) - 30) > 1e-6 || ((alarm.scheduledTime - Date.now()) / 6e4 + 30) % 30 > (isInit ? 30 : 1)) && chrome.alarms.create(ALARM_ID, {
          delayInMinutes: isInit ? SYNC_INIT_DELAY : 1,
          periodInMinutes: 30
        }); else {
          sync_manager_status.state = "disconnected";
          alarm && chrome.alarms.clear(ALARM_ID);
          (isInit || prefVal === "none") && emitStatusChange();
        }
        scheduling = !1;
      }
      function setError(err) {
        sync_manager_status.errorMessage = err == null ? void 0 : err.message;
        lastError = err;
      }
      function translateErrorMessage(err) {
        return err.name === "LockError" ? util.t("syncErrorLock", new Date(err.expire).toLocaleString([], {
          timeStyle: "short"
        })) : err.message || JSON.stringify(err);
      }
      const jobs = {};
      function download(url, params = {}) {
        var _;
        const key = arguments[1] ? url + "\0" + JSON.stringify(params) : url;
        const job = (_ = jobs[key]) != null ? _ : jobs[key] = {
          req: doDownload(url, params, key)
        };
        if (params.port) {
          const ports = job.ports || (job.ports = new Set);
          const p = chrome.runtime.connect({
            name: params.port
          });
          p.onDisconnect.addListener(() => {
            util_webext.ignoreChromeError();
            ports.delete(p);
          });
          ports.add(p);
        }
        return job.req;
      }
      async function doDownload(url, {method = "GET", body, responseType = "text", requiredStatusCode = 200, timeout = 6e4, loadTimeout = 12e4, headers, responseHeaders, port, ...opts}, jobKey) {
        let abort, data, usoVars;
        try {
          if (url.startsWith(js_urls.uso) && url.includes("?")) {
            const i = url.indexOf("?");
            if (body == null) {
              method = "POST";
              body = url.slice(i);
              url = url.slice(0, i);
            } else method === "GET" && url.length >= 2e3 && url.startsWith(js_urls.usoJson) && (url = collapseUsoVars(usoVars = [], url, i));
            headers != null || (headers = {
              "content-type": "application/x-www-form-urlencoded"
            });
          }
          const resp = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest;
            xhr.open(method, url);
            abort = reject;
            xhr.onerror = () => abort(xhr.status);
            xhr.onload = () => resolve(xhr);
            xhr.onprogress = e => reportProgress(jobKey, [ e.loaded, e.total ]);
            xhr.onreadystatechange = () => {
              if (!(xhr.readyState < 2)) {
                xhr.onreadystatechange = null;
                xhr.timeout = loadTimeout;
                resolve(xhr);
              }
            };
            xhr.responseType = responseType;
            if (headers) for (const k in headers) xhr.setRequestHeader(k, headers[k]);
            (timeout || loadTimeout) && (xhr.ontimeout = () => abort(new Error("Timeout fetching " + url)));
            xhr.send(body);
          });
          if (requiredStatusCode && resp.status !== requiredStatusCode && !url.startsWith("file:")) throw new Error(`Bad status code ${resp.status} for ${url}`);
          data = await new Promise((resolve, reject) => {
            abort = reject;
            resp.onload = () => resolve(resp.response);
          });
          data && usoVars && (data = expandUsoVars(usoVars, url, data));
          responseHeaders && (data = {
            response: data,
            headers: extractHeaders(resp, responseHeaders)
          });
          return data;
        } finally {
          var _;
          (_ = jobs[jobKey].ports) == null || _.forEach(p => p.disconnect());
          delete jobs[jobKey];
        }
      }
      function collapseUsoVars(usoVars, url, queryPos) {
        const params = new URLSearchParams(url.slice(queryPos + 1));
        for (const [k, v] of params.entries()) if (!(v.length < 10 || v.startsWith("ik-"))) {
          usoVars.push(v);
          params.set(k, `${usoVars.length}`);
        }
        return url.slice(0, queryPos + 1) + params;
      }
      function expandUsoVars(usoVars, url, response) {
        const isText = typeof response == "string";
        const json = isText && util.tryJSONparse(response) || response;
        json.updateUrl = url;
        for (const section of json.sections || []) {
          const {code} = section;
          code.includes("") && (section.code = code.replace(/\x01(\d+)\x02/g, (_, num) => usoVars[num - 1] || ""));
        }
        return isText ? JSON.stringify(json) : json;
      }
      function extractHeaders(src, headers) {
        const res = {};
        for (const h of headers) res[h] = src.getResponseHeader(h);
        return res;
      }
      function reportProgress(jobKey, msg) {
        var _;
        (_ = jobs[jobKey]) == null || (_ = _.ports) == null || _.forEach(p => p.postMessage(msg));
      }
      const installCodeCache = {};
      const MIME = "mime";
      bgBusy.then(() => {
        prefs.subscribe("urlInstaller", toggle, !0);
      });
      function toggle(key, val, isInit) {
        val ? onTabUrlChange.add(maybeInstall) : onTabUrlChange.delete(maybeInstall);
        toggleUrlInstaller(val);
      }
      function toggleUrlInstaller(val = prefs.__values.urlInstaller) {
        const urls = val ? [ "" ] : [ js_urls.usw, ...js_urls.usoaRaw, ...[ "greasy", "sleazy" ].map(h => `https://update.${h}fork.org/`) ];
        try {
          chrome.webRequest.onHeadersReceived.removeListener(maybeInstallByMime);
        } catch {}
        chrome.webRequest.onHeadersReceived.addListener(maybeInstallByMime, {
          urls: urls.reduce(reduceUsercssGlobs, []),
          types: [ "main_frame" ]
        }, [ "responseHeaders", WRB && "blocking" ].filter(Boolean));
      }
      function clearInstallCode(url) {
        delete installCodeCache[url];
      }
      async function loadFromFile(tabId) {
        return (await browser.tabs.executeScript(tabId, {
          file: "/js/install-hook-usercss.js"
        }))[0];
      }
      async function loadFromUrl(tabId, url) {
        var _;
        return (url.startsWith("file:") || ((_ = tabCache[tabId]) == null ? void 0 : _[MIME])) && download(url);
      }
      function makeInstallerUrl(url) {
        return `${js_urls.ownRoot}${js_urls.installUsercss}?updateUrl=${encodeURIComponent(url)}`;
      }
      function reduceUsercssGlobs(res, host) {
        res.push(..."%css,%less,%styl".replace(/%\w+/g, host ? "$&*" : "$&,$&?*").replace(/%/g, `${host || "*://*/"}*.user.`).split(","));
        return res;
      }
      async function maybeInstall(tabId, url, oldUrl = "") {
        var _;
        if (url.includes(".user.") && ((_ = tabCache[tabId]) == null ? void 0 : _[MIME]) !== !1 && /^(https?|file|ftps?):/.test(url) && /\.user\.(css|less|styl)$/.test(url.split(/[#?]/, 1)[0]) && !oldUrl.startsWith(makeInstallerUrl(url))) {
          const inTab = ua.FIREFOX && url.startsWith("file:");
          const code = await (inTab ? loadFromFile : loadFromUrl)(tabId, url).catch(util.NOP);
          !/^\s*</.test(code) && style_util.getMetaComment(code, "?") && await openInstallerPage(tabId, url, {
            code,
            inTab
          });
        }
      }
      function maybeInstallByMime({tabId, url, responseHeaders}) {
        const h = findHeader(responseHeaders, "content-type");
        const isText = h && /^text\/(?!html)/i.test(h.value);
        set(tabId, MIME, isText);
        if (isText) {
          openInstallerPage(tabId, url, {});
          return {
            cancel: !0
          };
        }
      }
      async function openInstallerPage(tabId, url, {code, inTab} = {}) {
        const newUrl = makeInstallerUrl(url);
        if (inTab) {
          const tab = await browser.tabs.get(tabId);
          return openTab({
            url: `${newUrl}&tabId=${tabId}`,
            active: tab.active,
            index: tab.index + 1,
            openerTabId: tabId,
            currentWindow: null
          });
        }
        const timer = setTimeout(clearInstallCode, 1e4, url);
        installCodeCache[url] = {
          code,
          timer
        };
        try {
          await browser.tabs.update(tabId, {
            url: newUrl
          });
        } catch (_) {
          if (/Tabs cannot be edited right now/i.test(_.message)) return browser.tabs.create({
            url: newUrl
          });
          throw _;
        }
      }
      const GLOBAL_META = Object.entries({
        author: null,
        description: null,
        homepageURL: "url",
        updateURL: "updateUrl",
        name: null
      });
      async function build(sourceCode, {id, dup, metaOnly, strict, vars} = {}) {
        const logs = [];
        const style = await buildMeta({}, sourceCode);
        dup = (dup || vars) && (id ? styleMap.get(id) : find(style));
        metaOnly || await buildCode(style, vars && dup, logs, strict);
        return {
          style,
          dup,
          logs
        };
      }
      async function buildCode(style, oldStyleWithVars, logs, strict) {
        const {id, usercssData: ucd} = style;
        const {preprocessor: pp, vars} = ucd;
        vars && util.reuseStyleVars(vars, oldStyleWithVars);
        const [res, log, warn] = await worker.compileUsercss(style.sourceCode, pp, vars, id, strict);
        if (!res.length) throw util.t("emptyStyle");
        log && (logs == null || logs.push(log, warn));
        style.sections = res;
        return style;
      }
      async function buildMeta(style, sourceCode) {
        if (!sourceCode && style && style.usercssData) return style;
        const code = (sourceCode || (style == null ? void 0 : style.sourceCode)).replace(/\r\n?/g, "\n");
        const match = style_util.getMetaComment(code, "match");
        if (!match) throw new Error("Could not find metadata.");
        try {
          const {metadata} = await worker.metaParse(match[0]);
          const res = style ? {
            enabled: !0,
            sections: [],
            ...style,
            sourceCode: code,
            usercssData: metadata
          } : metadata;
          for (const [key, globalKey] of GLOBAL_META) {
            const val = metadata[key];
            val !== void 0 && (res[globalKey || key] = val);
          }
          return res;
        } catch (_) {
          if (_.code) {
            const args = _.code === "missingMandatory" || _.code === "missingChar" ? _.args.map(e => e.length === 1 ? JSON.stringify(e) : e).join(", ") : _.args;
            const msg = util.t(`meta_${_.code}`, args);
            _.message = msg || `${_.code}${args ? `: ${args}` : ""}`;
            _.index = (_.index || 0) + match.index;
          }
          throw _;
        }
      }
      function find(data, returnBoolean) {
        const res = data.id ? styleMap.get(data.id) : style_manager_find(util.makeUserCssFindFilter(data.usercssData || data), "usercssData");
        return returnBoolean ? !!res : res;
      }
      async function install(style, opts) {
        return style_manager_install(await parse(style, opts));
      }
      async function parse(style, {dup, vars} = {}, logs) {
        var _, ee;
        style.usercssData || (style = await buildMeta(style));
        dup || (dup = find(style));
        (_ = style).id || (_.id = (ee = dup) == null ? void 0 : ee.id);
        return buildCode(style, vars || dup, logs);
      }
      const KEYS_OUT = [ "description", "homepage", "license", "name" ];
      const KEYS_IN = [ ...KEYS_OUT, "id", "namespace", "username" ];
      const pushId = (id, val = !0) => dataHub.set("usw" + id, val);
      const popId = id => dataHub.delete("usw" + id);
      class TokenHooks {
        constructor(id) {
          this.id = id;
        }
        keyName(name) {
          return `${name}/${this.id}`;
        }
        query(query) {
          return Object.assign(query, {
            vendor_data: this.id
          });
        }
      }
      function fakeUsercssHeader(style, usw) {
        const {namespace: ns, username: user} = usw || (usw = {});
        const meta = [ "name", [ "@version", (new Date).toISOString().replace(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+).+/, "$1$2$3.$4.$5") ], [ "@namespace", ns !== "?" && ns || user && `https://userstyles.world/user/${user}` || "?" ], "description", [ "@homepage", util.tryURL(ns).href ], [ "@author", user ], "license" ].map((k, _) => k.map ? k[1] && k : (_ = usw[k] || style[k]) && [ "@" + k, _ ]).filter(Boolean);
        const maxKeyLen = meta.reduce((res, [k]) => Math.max(res, k.length), 0);
        return "/* ==UserStyle==\n" + meta.map(([k, v]) => `${k}${" ".repeat(maxKeyLen - k.length + 2)}${v}\n`).join("") + "==/UserStyle== */\n\n";
      }
      async function linkStyle(style, sourceCode) {
        const {id, name} = style;
        const {metadata} = await worker.metaParse(style_util.getMetaComment(sourceCode));
        const out = {
          name,
          sourceCode,
          usercssData: {}
        };
        for (const k of KEYS_OUT) out[k] = out.usercssData[k] = metadata[k] || "";
        pushId(id, out);
        try {
          const token = await getToken("userstylesworld", !0, new TokenHooks(id));
          const info = await uswFetch("style", token);
          const data = util.mapObj(info, null, style.usercssData ? [ "id" ] : KEYS_IN);
          data.token = token;
          style.url = style.url || info.homepage || `${js_urls.usw}style/${data.id}`;
          return data;
        } finally {
          popId(id);
        }
      }
      async function uswFetch(path, token, opts) {
        (opts = Object.assign({
          credentials: "omit"
        }, opts)).headers = Object.assign({
          Authorization: `Bearer ${token}`
        }, opts.headers);
        return (await (await fetch(`${js_urls.usw}api/${path}`, opts)).json()).data;
      }
      async function uswSave(style, _) {
        const {id} = style;
        _ ? style._usw = _ : _ = style._usw;
        await save(style, !1);
        broadcastExtension({
          method: "uswData",
          style: {
            id,
            _usw: _
          }
        });
      }
      async function revoke(id) {
        try {
          pushId(id);
          await revokeToken("userstylesworld", new TokenHooks(id));
          const style = getById(id);
          if (style) {
            delete style._usw.token;
            await uswSave(style);
          }
        } finally {
          popId(id);
        }
      }
      const badStyles = [];
      const rxVarsAndImport = /^:root\s*{\s+--[\s\S].*?@import\s/i;
      const hasVarsAndImport = ({code}) => rxVarsAndImport.test(code);
      bgInit.push(async () => {
        var _;
        let [orderFromDb, styles] = await Promise.all([ prefsDB.get("injectionOrder"), db.getAll() ]);
        let mirror;
        orderFromDb || (orderFromDb = await execMirror("settings", "get", "injectionOrder").catch(console.error));
        !styles.length && (mirror = await execMirror("stylish", "getAll").catch(console.error)) && (styles = mirror);
        for (const style of styles) {
          let err;
          try {
            var ee;
            fixKnownProblems(style, !0);
            err = (!Array.isArray(style.sections) || ((ee = style.usercssData) == null ? void 0 : ee.vars) && style.sections.some(hasVarsAndImport)) && (style.sourceCode ? !await buildCode(style) : "No sourceCode") || !style_util.styleJSONseemsValid(style) && "No name/code";
          } catch (_) {
            err = _;
          }
          err ? badStyles.push([ err, style ]) : storeInMap(style);
        }
        badStyles.length && console.warn(badStyles);
        (_ = mirror) != null && _.length && setTimeout(db.putMany, 100, mirror);
        setOrderImpl(orderFromDb, {
          store: !1
        });
      });
      onSchemeChange.add(() => {
        for (const style of styleMap.values()) SCHEMES.includes(style.preferScheme) && broadcastStyleUpdated(style, "colorScheme");
      });
      msg.onDisconnect.draft = port => {
        util_webext.ignoreChromeError();
        const id = port.name.split(":")[1];
        draftsDB.delete(+id || id).catch(util.NOP);
      };
      msg.onDisconnect.livePreview = port => {
        util_webext.ignoreChromeError();
        const id = +port.name.split(":")[1];
        const style = styleMap.get(id);
        if (style) {
          stylePreviewMap.delete(id);
          broadcastStyleUpdated(style, "editPreviewEnd");
        }
      };
      const style_search_db_cache = new Map;
      const METAKEYS = [ "customName", "name", "url", "installationUrl", "updateUrl" ];
      const extractMeta = style => style.usercssData ? style_util.getMetaComment(style.sourceCode) : null;
      const stripMeta = style => style.usercssData ? style_util.getMetaComment(style.sourceCode, "del") : null;
      const MODES = Object.assign(Object.create(null), {
        code: (style, test) => style.usercssData ? test(stripMeta(style)) : searchSections(style, test, "code"),
        meta: (style, test, part) => METAKEYS.some(key => test(style[key])) || test(part === "all" ? style.sourceCode : extractMeta(style)) || searchSections(style, test, "funcs"),
        name: (style, test) => test(style.customName) || test(style.name),
        all: (style, test) => MODES.meta(style, test, "all") || !style.usercssData && MODES.code(style, test)
      });
      function searchDb({query, mode, ids}) {
        mode != null || (mode = "all");
        let res = [];
        if (mode === "url" && query) res = getByUrl(query).map(r => r.style.id); else if (mode in MODES) {
          const modeHandler = MODES[mode];
          const m = /^\/(.+?)\/([gimsuy]*)$/.exec(query);
          const rx = m && util.tryRegExp(m[1], m[2]);
          const test = rx ? rx.test.bind(rx) : createTester(query);
          for (let style of ids || styleMap.values()) ids && !(style = styleMap.get(style)) || query && !modeHandler(style, test) || res.push(style.id);
          style_search_db_cache.size && util.debounce(clearCache, 6e4);
        }
        return res;
      }
      function createTester(query) {
        const flags = "u" + (lower(query) === query ? "i" : "");
        const words = query.split(/(".*?")|\s+/).filter(Boolean).map(w => w.startsWith('"') && w.endsWith('"') ? w.slice(1, -1) : w).filter(w => w.length > 1);
        const rxs = (words.length ? words : [ query ]).map(w => util.stringAsRegExp(w, flags));
        return text => rxs.every(rx => rx.test(text));
      }
      function searchSections({sections}, test, part) {
        const inCode = part === "code" || part === "all";
        const inFuncs = part === "funcs" || part === "all";
        for (const section of sections) for (const prop in section) {
          const value = section[prop];
          if (inCode && prop === "code" && test(value) || inFuncs && Array.isArray(value) && value.some(str => test(str))) return !0;
        }
      }
      function lower(text) {
        let result = style_search_db_cache.get(text);
        result || style_search_db_cache.set(text, result = text.toLocaleLowerCase());
        return result;
      }
      function clearCache() {
        style_search_db_cache.clear();
      }
      function style_manager_editSave(style, msg) {
        (style = mergeWithMapped(style)).updateDate = style._rev = Date.now();
        draftsDB.delete(style.id).catch(util.NOP);
        return save(style, "editSave", msg);
      }
      function style_manager_find(filter, subkey) {
        for (const style of styleMap.values()) {
          let obj = subkey ? style[subkey] : style;
          if (obj) {
            for (const key in filter) if (filter[key] !== obj[key]) {
              obj = null;
              break;
            }
            if (obj) return style;
          }
        }
      }
      const getAll = () => [ ...styleMap.values() ];
      const getOrder = () => orderWrap.value;
      function getByUrl(url, id, tabId, needsOvrs) {
        const results = [];
        const query = {
          url
        };
        const td = tabCache[tabId];
        const tabOverrides = td == null ? void 0 : td.tabOvr;
        const tabCSP = td == null ? void 0 : td.patchCsp;
        for (const style of id ? [ styleMap.get(id) ].filter(Boolean) : styleMap.values()) {
          var _, ee;
          let ovr;
          let matching;
          const res = {
            excluded: !!(ovr = style.exclusions) && ovr.some(urlMatchOverride, query),
            excludedScheme: !themeAllowsStyle(style),
            included: matching = !!(ovr = style.inclusions) && ovr.some(urlMatchOverride, query),
            tabOvr: (_ = tabOverrides == null ? void 0 : tabOverrides[style.id]) != null ? _ : null,
            patchCsp: (tabCSP == null ? void 0 : tabCSP[style.id]) || null,
            incOvr: !(matching || !style.overridden || (ee = ovr) == null || !ee.length),
            matchedOvrs: needsOvrs ? matchOverrides(style, url) : null
          };
          const isIncluded = matching;
          let empty = !0;
          let sloppy = !1;
          let arr = style.sections;
          if (!arr) {
            arr = [];
            console.error("No sections:", style);
          }
          for (let i = 0; i < arr.length && (!matching || empty || !sloppy); i++) {
            const sec = arr[i];
            const secMatch = isIncluded || urlMatchSection(query, sec, !0);
            if (secMatch) {
              matching = !0;
              sloppy || (sloppy = secMatch === "sloppy");
              empty && (empty = style_util.styleCodeEmpty(sec));
            }
          }
          if (matching) {
            res.empty = empty;
            res.sloppy = sloppy;
            res.style = getCore({
              id: style.id
            });
            results.push(res);
          }
        }
        return results;
      }
      function getCore({id, sections, size, src, vars} = {}) {
        const res = [];
        for (let style of id ? [ styleMap.get(id) ].filter(Boolean) : styleMap.values()) {
          style = {
            ...style
          };
          let tmp;
          size && (style._size = util.calcObjSize(style));
          sections && (tmp = style.sections.map(sec => ({
            ...sec,
            code: void 0
          })));
          (!src || !sections && style.usercssData) && (style.sections = tmp);
          src || (style.sourceCode = void 0);
          !vars && (tmp = style.usercssData) && tmp.vars && (style.usercssData = {
            ...tmp,
            vars: Object.keys(tmp.vars).length
          });
          res.push(style);
        }
        return id ? res[0] : res;
      }
      function getSectionsByUrl(url, {id, init, dark} = {}) {
        var _, ee, oe;
        dark != null && isDark == null && setSystemDark(dark);
        if (init && prefs.__values.disableAll) return {
          cfg: {
            off: !0
          }
        };
        let v;
        const res = {};
        const {sender = {}} = this || {};
        const {tab = {}, frameId, TDM} = sender;
        const isTop = !frameId || TDM || sender.type === "main_frame";
        const td = tabCache[sender.tabId || tab.id] || {};
        res.cfg = !id && {
          ass: prefs.__values.styleViaASS && (!(v = optionSites.styleViaASS) || isOptionSite(v, url)),
          dark: isTop && isDark,
          name: prefs.__values.exposeStyleName,
          nonce: (_ = td.nonce) == null ? void 0 : _[frameId],
          top: prefs.__values.exposeIframes && (!(v = optionSites.exposeIframes) || isOptionSite(v, url)),
          topUrl: isTop ? "" : getUrlOrigin(tab.url || ((ee = td.url) == null ? void 0 : ee[0])),
          wake: prefs.__values.keepAlive >= 0,
          order
        };
        if (init === "cfg") return res;
        frameId === 0 && init !== "styleViaXhr" && (v = td.url) && (v = v[0]) !== url && ((oe = v) == null ? void 0 : oe.split("#", 1)[0]) === url.split("#", 1)[0] && (url = v || url);
        const cache = (v = entries.get(url)) || new Map;
        const tabOvr = td.tabOvr || !1;
        const secsArr = [];
        let {maybe} = cache;
        if (v && tabOvr) for (const styleId in tabOvr) tabOvr[styleId] && !cache.has(+styleId) && (maybe != null ? maybe : maybe = new Set).add(+styleId);
        v && !maybe || cache_create(url, cache, maybe, tabOvr);
        add(url, cache);
        for (const sec of id ? (v = cache.get(id)) ? [ v ] : [] : cache.values()) {
          var ae;
          ((ae = tabOvr[sec.id]) != null ? ae : !sec.tabOvr) && secsArr.push(sec);
        }
        if (init === !0 && secsArr.length) {
          var le, ue;
          (le = (ue = td.url) != null ? ue : td.url = {})[frameId] != null || (le[frameId] = url);
        }
        res.sections = secsArr;
        return res;
      }
      async function style_manager_install(style, reason = (styleMap.has(style.id) ? "update" : "install")) {
        (style = mergeWithMapped(style)).originalDigest = await style_util.calcStyleDigest(style);
        return save(style, reason);
      }
      function style_manager_remove(id, reason, many) {
        if (!styleMap.has(id)) return 0;
        const style = styleMap.get(id);
        const uuid = style._id;
        reason !== "sync" && sync_manager_remove(uuid, Date.now());
        updateSections(id, !0);
        dataHub.delete("editorScrollInfo" + id);
        styleMap.delete(id);
        stylePreviewMap.delete(id);
        uuidIndex.delete(uuid);
        if (!many) {
          db.delete(id);
          draftsDB.delete(id).catch(() => {});
          for (const [type, group] of Object.entries(orderWrap.value)) {
            delete order[type][id];
            const i = group.indexOf(uuid);
            i >= 0 && group.splice(i, 1);
          }
          setOrderImpl(orderWrap, {
            calc: !1
          });
        }
        style._usw && style._usw.token && revoke(id);
        broadcast({
          method: "styleDeleted",
          style: {
            id
          }
        });
        return id;
      }
      async function save(style, reason, msg, alreadyFixed) {
        return onSaved(style, reason, await db.put(!alreadyFixed && onBeforeSave(style) || style), msg);
      }
      function toggleTabOvrMany(tabId, overrides) {
        const messages = [];
        const td = tabCache[tabId];
        const cache = entries.get(td.url[0]);
        let tabOvr = td.tabOvr || {};
        for (const key in overrides) {
          var _;
          const id = +key;
          const val = overrides[key];
          const style = styleMap.get(id);
          if (style && tabOvr[key] != val) {
            val == null ? delete tabOvr[key] : tabOvr[key] = val;
            cache && ((_ = cache.maybe) != null ? _ : cache.maybe = new Set).add(id);
            messages.push({
              method: "styleUpdated",
              reason: "tabOvr",
              style: {
                id,
                enabled: val != null ? val : style.enabled
              }
            });
          }
        }
        (td.tabOvr || !util.isEmptyObj(tabOvr) || (tabOvr = void 0, 1)) && set(tabId, "tabOvr", tabOvr);
        if (messages.length) {
          sendTab(tabId, messages, null, !0);
          broadcastExtension(messages, !0);
        }
      }
      const kOpenManage = "openManage";
      const kOpenOptions = "openOptions";
      const kReload = "reload";
      const kStyleDisableAll = "styleDisableAll";
      const kToggleTab = "toggleTab";
      const COMMANDS = {
        [kOpenManage]: (info, {windowId} = {}) => util_webext.openDashboard({}, null, !1, {
          windowId
        }),
        [kOpenOptions]: (info, {windowId} = {}) => util_webext.openDashboard(null, null, !1, {
          windowId
        }),
        [kReload]: () => chrome.runtime.reload(),
        [kStyleDisableAll]: info => prefs.ready.then(() => prefs.set("disableAll", info ? info.checked : !prefs.__values.disableAll)),
        [kToggleTab]: async (info, tab) => {
          const td = (tab != null ? tab : tab = await util_webext.getActiveTab()) && tabCache[tab.id];
          if (!td) return;
          let [state, skip, ovrs] = td[consts.kTabOvrToggle] || [];
          let ids;
          state = state == null || state ? 0 : 2;
          if (!state && (ids = td.styleIds) && (ids = [].concat(...Object.values(ids))).length) {
            if (!ovrs) {
              td[consts.kTabOvrToggle] = [ state, skip, ovrs = {
                ...td.tabOvr
              } ];
              for (const id of ids) {
                var _;
                (_ = ovrs)[id] != null || (_[id] = null);
              }
            }
            ovrs = {};
            for (const id of ids) ovrs[id] = !1;
          } else if (!ovrs) return;
          td[consts.kTabOvrToggle][0] = state;
          toggleTabOvrMany(tab.id, ovrs);
        }
      };
      const chromeCommands = chrome.commands;
      const chromeMenus = chrome.contextMenus;
      const MENUS = !!chromeMenus && {
        "show-badge": [ info => {
          prefs.set(info.menuItemId, info.checked);
        }, {
          title: util.t("menuShowBadge")
        } ]
      };
      if (MENUS) for (const [menuId, cmdId = menuId] of [ [ kToggleTab ], [ "disableAll", kStyleDisableAll ], [ "styleManager", kOpenManage ], [ kOpenOptions ], [ kReload ] ]) {
        var ue;
        MENUS[menuId] = [ COMMANDS[cmdId], {
          title: ((ue = util_webext.MF.commands[cmdId]) == null ? void 0 : ue.description) || util.t(cmdId)
        } ];
      }
      MENUS && ua.CHROME && (MENUS["editor.contextDelete"] = [ (info, tab) => {
        sendTab(tab.id, {
          method: "editDeleteText"
        });
      }, {
        title: util.t("editDeleteText"),
        type: "normal",
        contexts: [ "editable" ],
        documentUrlPatterns: [ js_urls.ownRoot + "*" ]
      } ]);
      chromeCommands == null || chromeCommands.onCommand.addListener(id => COMMANDS[id]());
      chromeMenus == null || chromeMenus.onClicked.addListener((info, tab) => MENUS[info.menuItemId][0](info, tab));
      const context_menus = chromeMenus ? () => {
        createContextMenus(Object.keys(MENUS), !0);
        function createContextMenus(ids, isInit) {
          for (const id of ids) {
            const item = MENUS[id][1];
            if (isInit) {
              var _;
              item.id = id;
              item.contexts != null || (item.contexts = [ "browser_action" ]);
              item.title = (_ = item.title) != null ? _ : util.t(id);
            }
            if (typeof prefs.__defaults[id] == "boolean") if (item.type) {
              if (isInit) {
                prefs.subscribe(id, togglePresence, !0);
                continue;
              }
            } else {
              item.type = "checkbox";
              item.checked = prefs.__values[id];
              isInit && prefs.subscribe(id, toggleCheckmark);
            }
            chromeMenus.create(item, util_webext.ignoreChromeError);
          }
        }
        function toggleCheckmark(id, checked) {
          chromeMenus.update(id, {
            checked
          }, util_webext.ignoreChromeError);
        }
        function togglePresence(id, checked) {
          checked ? createContextMenus([ id ]) : chromeMenus.remove(id, util_webext.ignoreChromeError);
        }
      } : util.NOP;
      const nondefaults = {};
      const updateStorage = () => chrome_sync.set({
        settings: nondefaults
      });
      prefs.set._bgSet = (key, val) => {
        const def = prefs.__defaults[key];
        if (val === def || val && typeof def == "object" && util.deepEqual(val, def)) {
          if (!(key in nondefaults)) return;
          delete nondefaults[key];
        } else nondefaults[key] = val;
        bgBusy || util.debounce(updateStorage);
        return !0;
      };
      bgPreInit.push(chrome_sync.get("settings").then(orig => {
        (orig = orig.settings) && util.isObject(orig) || (orig = {});
        if (orig["editor.linter"] === "") {
          delete orig["editor.linter"];
          orig[consts.pEditorLinterOn] = !1;
        }
        prefs.ready.set(util.deepMerge(orig), {});
        util.deepEqual(orig, nondefaults) || bgBusy.then(updateStorage);
        return prefs.ready;
      }));
      let value;
      const key = chrome_sync.LZ_KEY.usercssTemplate;
      const DEFAULT = "/* ==UserStyle==\n@name           \n@namespace      github.com/openstyles/stylus\n@version        1.0.0\n@description    A new userstyle\n@author         Me\n==/UserStyle== */\n\n";
      const parseTemplate = async (str = DEFAULT) => value = [ DEFAULT, str, await buildMeta(null, str).catch(util.NOP) || !1 ];
      prefs.onStorageChanged.add(changes => {
        changes[key] && (value = null);
      });
      const CM_THEMES_TEXT = {};
      const PROVIDERS = {
        edit(url) {
          var _, ee;
          const id = +url.searchParams.get("id");
          const style = getById(id);
          const isUsercss = style ? "usercssData" in style : prefs.__values.newStyleAsUsercss;
          let v;
          v = {
            style,
            isUsercss,
            si: style && dataHub.get("editorScrollInfo" + id),
            state: storage_util.chromeLocal.getValue("editor"),
            template: isUsercss && (value != null ? value : value = chrome_sync.getLZValue(key).then(parseTemplate)),
            theme: v = prefs.__values["editor.theme"],
            themeText: v !== prefs.__defaults["editor.theme"] && ((ee = CM_THEMES_TEXT[_ = v = `css/cm-themes/${v}.css`]) != null ? ee : CM_THEMES_TEXT[_] = util.fetchText(v).catch(util.NOP))
          };
          return v;
        },
        manage(url) {
          const sp = url.searchParams;
          const query = sp.get("search") || void 0;
          const styles = getCore({
            sections: !0,
            size: !0
          });
          return {
            ids: query && searchDb({
              query,
              mode: sp.get("searchMode") || prefs.__values["manage.searchMode"]
            }),
            badStyles: badStyles.length && badStyles,
            styles,
            sync: getStatus(!0)
          };
        },
        options: () => {
          const status = getStatus();
          const {drive} = status;
          return {
            sync: status,
            syncOpts: drive ? getDriveOptions(drive) : {},
            wrb: WRBTest || WRB
          };
        },
        popup: () => ({
          popup: dataHub.pop("popup") || makePopupData()
        })
      };
      var cmpver = oe(2365);
      const pingers = {};
      const getMd5Url = usoId => `https://update.userstyles.org/${usoId}.md5`;
      async function getUpdatability(usoId, asObject) {
        const md5Url = getMd5Url(usoId);
        const md5 = await util.fetchText(md5Url);
        const dup = findStyle(usoId, md5Url);
        const state = dup ? dup.usercssData || dup.originalMd5 === md5 ? 2 : 1 : 0;
        return asObject ? {
          dup,
          md5,
          md5Url,
          state
        } : state;
      }
      async function toUsercss(usoId, varsUrl, css, dup, md5, md5Url) {
        var _, ee;
        let v;
        const updateUrl = ((_ = dup) == null ? void 0 : _.updateUrl) || js_urls.makeUpdateUrl("usoa", usoId);
        const jobs = [ !dup && getUpdatability(usoId, !0).then(res => ({dup, md5, md5Url} = res)), !css && download(updateUrl).then(res => css = res) ].filter(Boolean);
        jobs[0] && await Promise.all(jobs);
        const style = await buildMeta({}, css);
        const vars = (v = varsUrl || ((ee = dup) == null ? void 0 : ee.updateUrl)) && useVars(style, v, {});
        if (dup) return style;
        style.md5Url = md5Url;
        style.originalMd5 = md5;
        style.updateUrl = updateUrl;
        await install(style, {
          dup,
          vars
        });
      }
      function useVars(style, src, cfg) {
        src = typeof src == "string" ? new URLSearchParams(src.split("?")[1]) : Object.entries(src);
        const {vars} = style.usercssData;
        if (vars) {
          for (let [key, val] of src) {
            if (!key.startsWith("ik-")) continue;
            key = makeKey(key.slice(3), cfg);
            const v = vars[key];
            if (v) if (v.options) {
              let sel = val.startsWith("ik-") && optByName(v, makeKey(val.slice(3), cfg));
              if (!sel) {
                key += "-custom";
                sel = optByName(v, key + "-dropdown");
                sel && (vars[key].value = val);
              }
              sel && (v.value = sel.name);
            } else v.value = val;
          }
          return style;
        }
      }
      function findStyle(usoId, md5Url = getMd5Url(usoId)) {
        return style_manager_find({
          md5Url
        }) || style_manager_find({
          installationUrl: js_urls.makeInstallUrl("usoa", usoId)
        });
      }
      async function ping(id, resolve) {
        await fetch(`${js_urls.uso}styles/install/${id}?source=stylish-ch`);
        resolve && resolve(!0);
        return !0;
      }
      function makeKey(key, varMap) {
        let res = varMap[key];
        if (!res && key !== (res = key.replace(/[^-\w]/g, "-"))) {
          for (;res in varMap; ) res += "-";
          varMap[key] = res;
        }
        return res;
      }
      function optByName(v, name) {
        return v.options.find(o => o.name === name);
      }
      const STATES = {
        UPDATED: "updated",
        SKIPPED: "skipped",
        UNREACHABLE: "server unreachable",
        EDITED: "locally edited",
        MAYBE_EDITED: "may be locally edited",
        SAME_MD5: "up-to-date: MD5 is unchanged",
        SAME_CODE: "up-to-date: code sections are unchanged",
        SAME_VERSION: "up-to-date: version is unchanged",
        ERROR_MD5: "error: MD5 is invalid",
        ERROR_JSON: "error: JSON is invalid",
        ERROR_VERSION: "error: version is older than installed style"
      };
      const getStates = () => STATES;
      const safeSleep = util.sleep;
      const RH_ETAG = {
        responseHeaders: [ "etag" ]
      };
      const RX_DATE2VER = new RegExp([ /^(\d{4})/, /(0[1-9]|1(?:0|[12](?=\d\d))?|[2-9])/, /(0[1-9]|[1-2][0-9]?|3[0-1]?|[4-9])/, /\.([01][0-9]?|2[0-3]?|[3-9])/, /\.([0-5][0-9]?|[6-9])$/ ].map(rx => rx.source).join(""));
      const ALARM_NAME = "scheduledUpdate";
      const RETRY_ERRORS = [ 503, 429 ];
      const hostJobs = {};
      let lastUpdateTime;
      let checkingAll = !1;
      let logQueue = [];
      let logLastWriteTime = 0;
      bgBusy.then(async () => {
        lastUpdateTime = await storage_util.chromeLocal.getValue("lastUpdateTime");
        lastUpdateTime || rememberNow();
        prefs.subscribe("updateInterval", update_manager_schedule, !0);
        chrome.alarms.onAlarm.addListener(update_manager_onAlarm);
      });
      async function checkAllStyles({save = !0, ignoreDigest, observe, onlyEnabled = prefs.__values.updateOnlyEnabled} = {}) {
        rememberNow();
        update_manager_schedule();
        checkingAll = !0;
        const port = observe && chrome.runtime.connect({
          name: "updater"
        });
        const styles = [ ...styleMap.values() ].filter(s => s.updateUrl && s.updatable !== !1 && (!onlyEnabled || s.enabled));
        port && port.postMessage({
          count: styles.length
        });
        log("");
        log(`${save ? "Scheduled" : "Manual"} update check for ${styles.length} styles`);
        await Promise.all(styles.map(style => checkStyle({
          style,
          port,
          save,
          ignoreDigest
        })));
        port && port.postMessage({
          done: !0
        });
        port && port.disconnect();
        log("");
        checkingAll = !1;
      }
      async function checkStyle(opts) {
        let {id} = opts;
        const {style = getById(id), ignoreDigest, port, save} = opts;
        id || (id = style.id);
        const {md5Url} = style;
        let {usercssData: ucd, updateUrl} = style;
        let res, state;
        try {
          await (async () => {
            if (!ignoreDigest && style.originalDigest && style.originalDigest !== await style_util.calcStyleDigest(style)) return Promise.reject(STATES.EDITED);
          })();
          res = {
            style: await (ucd && !md5Url ? updateUsercss : async () => {
              const md5 = await tryDownload(md5Url);
              if (!md5 || md5.length !== 32) return Promise.reject(STATES.ERROR_MD5);
              if (md5 === style.originalMd5 && style.originalDigest && !ignoreDigest) return Promise.reject(STATES.SAME_MD5);
              const usoId = +md5Url.match(/\/(\d+)/)[1];
              let varsUrl = "";
              if (!ucd) {
                ucd = {};
                varsUrl = updateUrl;
              }
              updateUrl = style.updateUrl = `${js_urls.usoApi}Css/${usoId}`;
              const {result: css} = await tryDownload(updateUrl, {
                responseType: "json"
              });
              const json = await updateUsercss(css) || await toUsercss(usoId, varsUrl, css, style, md5, md5Url);
              json.originalMd5 = md5;
              return json;
            })().then(async json => {
              json.id = id;
              delete json.customName;
              delete json.enabled;
              const newStyle = Object.assign({}, style, json);
              newStyle.updateDate = getDateFromVer(newStyle) || Date.now();
              if (!ucd && style_util.styleSectionsEqual(json, style)) {
                style.originalDigest = (await style_manager_install(newStyle)).originalDigest;
                return Promise.reject(STATES.SAME_CODE);
              }
              return style.originalDigest || ignoreDigest ? save ? ucd ? install(newStyle, {
                dup: style
              }) : style_manager_install(newStyle) : newStyle : Promise.reject(STATES.MAYBE_EDITED);
            }),
            updated: !0
          };
          state = STATES.UPDATED;
        } catch (_) {
          const error = _ === 0 && STATES.UNREACHABLE || _ && _.message || _;
          res = {
            error,
            style,
            STATES
          };
          state = `${STATES.SKIPPED} (${Array.isArray(_) ? _[0].message : error})`;
        }
        log(`${state} #${id} ${style.customName || style.name}`);
        port && port.postMessage(res);
        return res;
        async function updateUsercss(css) {
          let oldVer = ucd.version;
          let oldEtag = style.etag;
          let m;
          if ((css || js_urls.extractUsoaId(updateUrl)) && (m = css || style_util.getMetaComment(style.sourceCode, "del")).includes("@updateURL") && (m = style_util.getMetaComment(m)) && (m = await buildMeta(null, m).catch(util.NOP)) && m.updateUrl) {
            updateUrl = m.updateUrl;
            oldVer = m.version || "0";
            oldEtag = "";
          } else if (css) return;
          (m = updateUrl.match(js_urls.rxGF))[5] === "meta" && (updateUrl = m[1] + "user" + m[6]);
          if (oldEtag && oldEtag === await downloadEtag(updateUrl)) return Promise.reject(STATES.SAME_CODE);
          const {headers: {etag}, response} = await tryDownload(updateUrl, RH_ETAG);
          const json = await buildMeta({
            etag,
            updateUrl
          }, response);
          const delta = (0, cmpver.default)(json.usercssData.version, oldVer);
          let err;
          delta || ignoreDigest || (err = response === style.sourceCode ? STATES.SAME_CODE : !js_urls.isLocalhost(updateUrl) && STATES.SAME_VERSION);
          delta < 0 && (err = STATES.ERROR_VERSION);
          if (err && etag && !style.etag) {
            style.etag = etag;
            await db.put(style);
          }
          return err ? Promise.reject(err) : json;
        }
      }
      async function tryDownload(url, params, {retryDelay = 1e3} = {}) {
        for (;;) {
          let host, job;
          try {
            params = util.deepMerge(params || {}, {
              headers: {
                "Cache-Control": "no-cache"
              }
            });
            host = util.getHost(url);
            job = hostJobs[host];
            job = hostJobs[host] = (job ? job.catch(util.NOP).then(() => safeSleep(1e3 / (js_urls.isCdnUrl(url) ? 4 : 1))) : Promise.resolve()).then(() => download(url, params));
            return await job;
          } catch (_) {
            if (!RETRY_ERRORS.includes(_) || retryDelay > 6e4) throw _;
          } finally {
            hostJobs[host] === job && delete hostJobs[host];
          }
          retryDelay *= 1.25;
          await safeSleep(retryDelay);
        }
      }
      async function downloadEtag(url) {
        return (await tryDownload(url, {
          method: "HEAD",
          ...RH_ETAG
        })).headers.etag;
      }
      function getDateFromVer(style) {
        var _;
        const m = RX_DATE2VER.exec((_ = style.usercssData) == null ? void 0 : _.version);
        if (m) {
          m[2]--;
          return new Date(...m.slice(1)).getTime();
        }
      }
      function update_manager_schedule() {
        const interval = prefs.__values.updateInterval * 60 * 60 * 1e3;
        if (interval > 0) {
          const elapsed = Math.max(0, Date.now() - lastUpdateTime);
          chrome.alarms.create(ALARM_NAME, {
            when: Date.now() + Math.max(6e4, interval - elapsed)
          });
        } else browser.alarms.clear(ALARM_NAME).catch(util.NOP);
      }
      async function update_manager_onAlarm({name}) {
        if (name === ALARM_NAME) {
          bgBusy && await bgBusy;
          checkAllStyles();
        }
      }
      function rememberNow() {
        storage_util.chromeLocal.set({
          lastUpdateTime: lastUpdateTime = Date.now()
        });
      }
      function log(text) {
        logQueue.push({
          text,
          time: (new Date).toLocaleString()
        });
        util.debounce(flushQueue, text && checkingAll ? 1e3 : 0);
      }
      async function flushQueue(lines) {
        if (!lines) {
          flushQueue(await storage_util.chromeLocal.getValue("updateLog") || []);
          return;
        }
        const time = Date.now() - logLastWriteTime > 11e3 ? logQueue[0].time + " " : "";
        if (logQueue[0] && !logQueue[0].text) {
          logQueue.shift();
          lines[lines.length - 1] && lines.push("");
        }
        lines.splice(0, lines.length - 1e3);
        lines.push(time + (logQueue[0] && logQueue[0].text || ""));
        lines.push(...logQueue.slice(1).map(item => item.text));
        storage_util.chromeLocal.set({
          updateLog: lines
        });
        logLastWriteTime = Date.now();
        logQueue = [];
      }
      Object.assign(msg_api.API, {
        data: {
          get: dataHub.get.bind(dataHub),
          has: dataHub.has.bind(dataHub)
        },
        draftsDB,
        prefs: {
          set(data) {
            for (const k in data) prefs.set(k, data[k]);
          }
        },
        prefsDB,
        state: {
          set: (key, val) => {
            dataHub.set(key, val);
          }
        },
        styles: style_manager_namespaceObject,
        sync: sync_manager_namespaceObject,
        tabs: {
          openEditor: async params => {
            const u = new URL(chrome.runtime.getURL("edit.html"));
            const usp = new URLSearchParams(params);
            const wnd = util_webext.browserWindows && prefs.__values.openEditInWindow;
            const wndPos = wnd && prefs.__values.windowPosition;
            const wndPopup = wnd && prefs.__values["openEditInWindow.popup"] && {
              type: "popup"
            };
            const ffBug = wnd && ua.FIREFOX;
            wndPopup && usp.set("popup", "1");
            u.search = usp;
            for (let tab, retry = 0; retry < (wndPos ? 2 : 1); ++retry) try {
              tab = tab || await openTab({
                url: `${u}`,
                currentWindow: null,
                newWindow: wnd && Object.assign({}, wndPopup, !ffBug && !retry && wndPos)
              });
              ffBug && !retry && await util_webext.browserWindows.update(tab.windowId, wndPos);
              return tab;
            } catch {}
          },
          openManager: async (opts = {}) => {
            const base = chrome.runtime.getURL("manage.html");
            const url = setUrlParams(base, opts);
            const tabs = await browser.tabs.query({
              url: base + "*"
            });
            const same = tabs.find(_ => _.url === url);
            let tab = same || tabs[0];
            if (tab) same || await sendTab(tab.id, {
              method: "pushState",
              url: setUrlParams(tab.url, opts)
            }); else {
              prefsDB.get("badFavs");
              tab = await openTab({
                url,
                newTab: !0
              });
            }
            return activateTab(tab);
          },
          open: openTab,
          ping: pingTab,
          get: (tabId, ...keyPath) => {
            let res = tabCache[tabId];
            for (let i = 0; res && i < keyPath.length; i++) res = res[keyPath[i]];
            return res;
          },
          set(tabId, ...args) {
            var _, ee;
            ((_ = args[args.length - 1]) == null ? void 0 : _.undef) === tabId && (args[args.length - 1] = void 0);
            set(tabId != null ? tabId : (ee = this.sender.tab) == null ? void 0 : ee.id, ...args);
          }
        },
        updater: update_manager_namespaceObject,
        usercss: usercss_manager_namespaceObject,
        uso: uso_api_namespaceObject,
        usw: usw_api_namespaceObject,
        util: {
          download,
          setClientData: async ({dark: pageDark, url: pageUrl, frameId} = {}) => {
            var _;
            setSystemDark(pageDark);
            bgBusy && await bgBusy;
            const url = new URL(pageUrl);
            const page = url.pathname.slice(1, -5);
            const pagesForUrl = ownPagesCommitted[pageUrl];
            const tabId = pagesForUrl == null ? void 0 : pagesForUrl.shift();
            const jobs = Object.assign({
              apply: getSectionsByUrl.call({
                sender: {
                  frameId,
                  tab: tabId >= 0 ? {
                    id: tabId,
                    url: pageUrl
                  } : {}
                }
              }, pageUrl, {
                init: !0
              }),
              dark: isDark,
              favicon: ua.FIREFOX || (isVivaldi != null ? isVivaldi : vivaldiTest()),
              prefs: nondefaults,
              tabId: tabId != null ? tabId : -1,
              badFavs: (page === "edit" || page === "install-usercss" || page === "manage") && prefs.__values["manage.newUI.favicons"] && prefs.getDbArray("badFavs")
            }, (_ = PROVIDERS[page]) == null ? void 0 : _.call(PROVIDERS, url));
            const results = await Promise.all(Object.values(jobs));
            pagesForUrl && !pagesForUrl.length && delete ownPagesCommitted[url];
            Object.keys(jobs).forEach((id, i) => jobs[id] = results[i]);
            return jobs;
          },
          setSystemDark
        }
      }, !1);
      ua.FIREFOX && function() {
        const ACTIONS = {
          styleApply,
          styleDeleted,
          styleUpdated: async ({style}, sender) => {
            if (!style.enabled) return styleDeleted({
              style
            }, sender);
            const {tab, frameId} = sender;
            const {frameStyles, styleSections} = getCachedData(tab.id, frameId, style.id);
            const code = styleSections.join("\n");
            await styleApply(style, sender);
            code && !duplicateCodeExists({
              frameStyles,
              code,
              id: null
            }) && await removeCSS(tab.id, frameId, code);
          },
          styleAdded: ({style}, sender) => {
            if (style.enabled) return styleApply(style, sender);
          },
          urlChanged: async (request, sender) => {
            const {tab, frameId} = sender;
            const oldStylesCode = getFrameStylesJoined(sender);
            await styleApply({
              ignoreUrlCheck: !0
            }, sender);
            const newStylesCode = getFrameStylesJoined(sender);
            return Promise.all(oldStylesCode.map(code => !newStylesCode.includes(code) && removeCSS(tab.id, frameId, code)).filter(Boolean));
          },
          injectorConfig: async ({cfg: {off}}, sender) => {
            if (off) {
              const {tab, frameId} = sender;
              const {tabFrames, frameStyles} = getCachedData(tab.id, frameId);
              if (!util.isEmptyObj(frameStyles)) {
                removeFrameIfEmpty(tab.id, frameId, tabFrames, {});
                await Promise.all(Object.keys(frameStyles).map(id => removeCSS(tab.id, frameId, frameStyles[id].join("\n"))));
              }
            } else if (off != null) return styleApply({}, sender);
          },
          updateCount
        };
        const onError = util.NOP;
        const calcOrder = ({id}) => (order.prio[id] || 0) * 1e6 || order.main[id] || id + 5e5;
        const cache = new Map;
        let observingTabs = !1;
        Object.assign(msg_api.API.util, {
          async styleViaAPI(request) {
            try {
              const fn = ACTIONS[request.method];
              fn && await fn(request, this.sender);
            } finally {
              maybeToggleObserver();
            }
          }
        });
        function updateCount(request, sender) {
          const {tab, frameId} = sender;
          if (frameId) throw new Error("we do not count styles for frames");
          const {frameStyles} = getCachedData(tab.id, frameId);
          updateIconBadge.call({
            sender
          }, Object.keys(frameStyles));
        }
        async function styleApply({id = null, ignoreUrlCheck = !1}, sender) {
          if (prefs.__values.disableAll) return;
          const {tab, frameId, url} = sender;
          const {tabFrames, frameStyles} = getCachedData(tab.id, frameId);
          if (id === null && !ignoreUrlCheck && frameStyles.url === url) return;
          const {sections} = getSectionsByUrl.call({
            sender
          }, url, {
            id
          });
          const tasks = [];
          for (const sec of sections.sort((a, b) => calcOrder(a) - calcOrder(b))) {
            const styleId = sec.id;
            const code = sec.code.join("\n");
            if (code !== (frameStyles[styleId] || []).join("\n")) {
              frameStyles[styleId] = sec.code;
              tasks.push(browser.tabs.insertCSS(tab.id, {
                code,
                frameId,
                runAt: "document_start",
                matchAboutBlank: !0
              }).catch(onError));
            }
          }
          if (!removeFrameIfEmpty(tab.id, frameId, tabFrames, frameStyles)) {
            Object.defineProperty(frameStyles, "url", {
              value: url,
              configurable: !0
            });
            tabFrames[frameId] = frameStyles;
            cache.set(tab.id, tabFrames);
          }
          await Promise.all(tasks);
          return updateCount(0, {
            tab,
            frameId
          });
        }
        async function styleDeleted({style: {id}}, {tab, frameId}) {
          const {tabFrames, frameStyles, styleSections} = getCachedData(tab.id, frameId, id);
          const code = styleSections.join("\n");
          if (code && !duplicateCodeExists({
            frameStyles,
            id,
            code
          })) {
            delete frameStyles[id];
            removeFrameIfEmpty(tab.id, frameId, tabFrames, frameStyles);
            await removeCSS(tab.id, frameId, code);
            updateCount(0, {
              tab,
              frameId
            });
          }
        }
        function maybeToggleObserver() {
          let method;
          if (!observingTabs && cache.size) method = "addListener"; else {
            if (!observingTabs || cache.size) return;
            method = "removeListener";
          }
          observingTabs = !observingTabs;
          util_webext.webNavigation.onCommitted[method](onNavigationCommitted);
          chrome.tabs.onRemoved[method](onTabRemoved);
          chrome.tabs.onReplaced[method](onTabReplaced);
        }
        function onNavigationCommitted({tabId, frameId}) {
          if (frameId === 0) {
            onTabRemoved(tabId);
            return;
          }
          const tabFrames = cache.get(tabId);
          if (tabFrames && frameId in tabFrames) {
            delete tabFrames[frameId];
            util.isEmptyObj(tabFrames) && onTabRemoved(tabId);
          }
        }
        function onTabRemoved(tabId) {
          cache.delete(tabId);
          maybeToggleObserver();
        }
        function onTabReplaced(addedTabId, removedTabId) {
          onTabRemoved(removedTabId);
        }
        function removeFrameIfEmpty(tabId, frameId, tabFrames, frameStyles) {
          if (util.isEmptyObj(frameStyles)) {
            delete tabFrames[frameId];
            util.isEmptyObj(tabFrames) && cache.delete(tabId);
            return !0;
          }
        }
        function getCachedData(tabId, frameId, styleId) {
          const tabFrames = cache.get(tabId) || {};
          const frameStyles = tabFrames[frameId] || {};
          return {
            tabFrames,
            frameStyles,
            styleSections: styleId && frameStyles[styleId] || []
          };
        }
        function getFrameStylesJoined({tab, frameId, frameStyles = getCachedData(tab.id, frameId).frameStyles}) {
          return Object.keys(frameStyles).map(id => frameStyles[id].join("\n"));
        }
        function duplicateCodeExists({tab, frameId, frameStyles = getCachedData(tab.id, frameId).frameStyles, frameStylesCode = {}, id, code = frameStylesCode[id] || frameStyles[id].join("\n")}) {
          id = String(id);
          for (const styleId in frameStyles) if (id !== styleId && code === (frameStylesCode[styleId] || frameStyles[styleId].join("\n"))) return !0;
        }
        function removeCSS(tabId, frameId, code) {
          return browser.tabs.removeCSS(tabId, {
            frameId,
            code,
            matchAboutBlank: !0
          }).catch(onError);
        }
      }();
      chrome.runtime.onInstalled.addListener(({reason, previousVersion}) => {
        if (ua.CHROME) {
          reinjectContentScripts();
          context_menus();
        }
        if (reason === "install") {
          ua.MOBILE && prefs.set("manage.newUI", !1);
          ua.WINDOWS && prefs.set("editor.keyMap", "sublime");
        }
        previousVersion === "1.5.30" && prefsDB.delete("badFavs");
        /^[23]\.3\.(1[89]|2[0-3])$/.test(previousVersion) && (bgInit != null && bgInit.length ? bgInit.push(inferHomepages) : inferHomepages());
        onStartup();
      });
      chrome.runtime.onStartup.addListener(onStartup);
      async function onStartup() {
        await refreshIconsWhenReady();
        await util.sleep(1e3);
        const minDate = Date.now() - 432e5;
        for (const id of await draftsDB.getAllKeys()) {
          const {date} = await draftsDB.get(id) || {};
          date < minDate && draftsDB.delete(id);
        }
        bgBusy && await bgBusy;
        mirrorStorage(styleMap);
      }
      msg.onMessage.set((m, sender) => {
        if (m.method === "invokeAPI") {
          let res = msg_api.API;
          for (const p of m.path.split(".")) res = res && res[p];
          if (!res) throw new Error(`Unknown API.${m.path}`);
          res = res.apply({
            msg: m,
            sender
          }, m.args);
          return res != null ? res : null;
        }
      }, !0);
      (async () => {
        const numPreInit = bgPreInit.length;
        await Promise.all(bgPreInit);
        await Promise.all(bgPreInit.slice(numPreInit));
        bgPreInit.length = 0;
        await Promise.all(bgInit.splice(0).map(v => typeof v == "function" ? v() : v));
        bgBusy.resolve();
        if (ua.FIREFOX) {
          initBrowserCommandsApi();
          context_menus();
        }
        global._msgExec = msg._execute;
        broadcast({
          method: "backgroundReady"
        });
      })();
    },
    5803() {
      global._bg = !0;
    },
    8916(_, ee, oe) {
      ee.basename = path => path.match(/([^/\\]+)[/\\]?$|$/)[1] || path;
      ee.dirname = path => {
        const dir = path.replace(/[/\\][^/\\]+[/\\]?$/, "");
        return dir === path ? "." : dir;
      };
    }
  }, _ => {
    _.O(0, [ "vendors-node_modules_pnpm_db-to-cloud_0_8_1_node_modules_db-to-cloud_lib_db-to-cloud_js-node_-88f1ba" ], () => _(_.s = 9796));
    _.O();
  } ]);
})();