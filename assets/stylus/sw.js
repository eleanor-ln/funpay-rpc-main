"use strict";

(() => {
  const global = this;
  var l = {
    499() {},
    458() {
      global.browser = chrome;
    }
  };
  var y = {};
  function I(_) {
    var E = y[_];
    if (E !== void 0) return E.exports;
    var module = y[_] = {
      exports: {}
    };
    l[_](module, module.exports, I);
    return module.exports;
  }
  I.d = (exports, definition) => {
    for (var key in definition) I.o(definition, key) && !I.o(exports, key) && Object.defineProperty(exports, key, {
      enumerable: !0,
      get: definition[key]
    });
  };
  I.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
  I.r = exports => Object.defineProperties(exports, {
    [Symbol.toStringTag]: {
      value: "Module"
    },
    __esModule: {
      value: !0
    }
  });
  (() => {
    var sync_manager_namespaceObject = {
      getDriveOptions,
      getStatus,
      getToken,
      login,
      putDoc,
      remove: sync_manager_remove,
      setDriveOptions: async (driveName, options) => {
        const key = `secure/sync/driveOptions/${driveName}`;
        await chrome_sync_set({
          [key]: options
        });
      },
      start,
      stop,
      syncNow
    };
    I.r(sync_manager_namespaceObject);
    var usercss_manager_namespaceObject = {
      build,
      buildCode,
      buildMeta,
      configVars: async (id, vars) => {
        const style = deepCopy(getById(id));
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
      getVersion: data => find(data)?.usercssData.version,
      install,
      toggleUrlInstaller
    };
    I.r(usercss_manager_namespaceObject);
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
          deepEqual(usw, style._usw) || await uswSave(style, usw);
          return res;
        } finally {
          popId(id);
        }
      },
      revoke
    };
    I.r(usw_api_namespaceObject);
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
        const res = mapObj(orderWrap.value, group => group.map(getByUuid).filter(Boolean));
        if (res.main.length + res.prio.length < styleMap.size) for (const style of styleMap.values()) style.id in order.main || style.id in order.prio || res.main.push(style);
        return keys ? mapObj(res, group => group.map(style => mapObj(style, null, keys))) : res;
      },
      getByIdInTab: (id, tabId, needsOvrs) => {
        const urlObj = tabCache[tabId]?.url || {};
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
        } catch (l) {
          res.push({
            err: l
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
          } catch (l) {
            (errors ??= {})[ids[i]] = l.message;
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
    I.r(style_manager_namespaceObject);
    I.d(style_manager_namespaceObject, {
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
        return delay > 0 ? global.keepAlive(new Promise(resolve => pingers[usoId] = setTimeout(ping, delay, usoId, resolve))) : delay !== !1 ? ping(usoId) : void 0;
      },
      toUsercss
    };
    I.r(uso_api_namespaceObject);
    var update_manager_namespaceObject = {
      checkAllStyles,
      checkStyle
    };
    I.r(update_manager_namespaceObject);
    I.d(update_manager_namespaceObject, {
      getStates: () => getStates
    });
    I(499);
    const kTabOvrToggle = "tabOvr*";
    const pEditorLinterOn = "editor.linter.on";
    const rxIgnorableError = /(R)eceiving end does not exist|The message (port|channel) closed|moved into back\/forward cache/;
    const API = global.API = {};
    I(458);
    const onMessage = new Map;
    const onConnect = {};
    const onDisconnect = {};
    const wrapData = data => ({
      data
    });
    const wrapError = error => ({
      error: Object.assign({
        message: error.message || `${error}`,
        stack: error.stack
      }, error)
    });
    chrome.runtime.onMessage.addListener(({data, multi, TDM, broadcast}, sender, sendResponse) => {
      sender.TDM = TDM;
      const res = _execute(data, sender, multi, broadcast);
      if (!broadcast) {
        if (res instanceof Promise) {
          res.then(wrapData, wrapError).then(sendResponse);
          return !0;
        }
        res !== void 0 && sendResponse(wrapData(res));
      }
    });
    chrome.runtime.onConnect.addListener(async port => {
      global._busy && await global._busy;
      const name = port.name.split(":", 1)[0];
      const fnOn = onConnect[name];
      const fnOff = onDisconnect[name];
      fnOn && fnOn(port);
      port.onDisconnect.addListener(fnOff || (() => chrome.runtime.lastError));
    });
    function _execute(data, sender, multi, broadcast) {
      let result;
      let res;
      if (res = global._busy) return res.then(_execute.bind(null, data, sender, multi, broadcast));
      for (const [fn, replyAllowed] of onMessage) {
        try {
          data.broadcast = broadcast;
          res = fn(data, sender, !!multi);
        } catch (l) {
          res = Promise.reject(l);
        }
        replyAllowed && res !== result && result === void 0 && (result = res);
      }
      return result;
    }
    const getHost = url => url.split("/", 3)[2];
    const hasOwn = Object.call.bind({}.hasOwnProperty);
    const makeUserCssFindFilter = ucd => mapObj(ucd, null, [ "name", "namespace" ]);
    const NOP = () => {};
    const sleep = ms => new Promise(ms > 0 ? cb => setTimeout(cb, ms) : setTimeout);
    const sleep0 = () => global.scheduler?.yield?.() || new Promise(setTimeout);
    const stringAsRegExpStr = s => s.replace(/[{}()[\]\\.+*?^$|]/g, "\\$&");
    const stringAsRegExp = (s, flags) => new RegExp(stringAsRegExpStr(s), flags);
    const globAsRegExpStr = s => s.replace(/[{}()[\]\\.+*?^$|]/g, "\\$&").replace(/(^|[^\\])\\\*/g, "$1.*").replace(/\\\\\\\*/g, "\\*");
    const RX_MAYBE_REGEXP = /^\s*\/(.+?)\/([simguy]*)\s*$/;
    const tCache = new Map;
    const t = (key, params, strict = !0) => {
      const s = !params && tCache.get(key) || chrome.i18n.getMessage(key, params);
      if (!s && strict) throw `Missing string "${key}"`;
      params || tCache.set(key, s);
      return s;
    };
    const debounce = (() => {
      const timers = new Map;
      const clearTimer = data => clearTimeout(data.timer);
      const run = async (fn, args) => {
        timers.delete(fn);
        fn(...args);
      };
      return Object.assign((fn, delay, ...args) => {
        delay = +delay || 0;
        let time;
        let old = timers.get(fn);
        if (old) {
          if (delay && old.time < (time = performance.now() + delay)) clearTimer(old); else if (old.args.length === args.length && old.args.every((a, i) => a === args[i])) return;
        } else timers.set(fn, old = {});
        old.args = args;
        old.time = delay && (time ?? performance.now() + delay);
        old.timer = setTimeout(run, delay, fn, args);
      }, {
        timers,
        run,
        unregister: fn => {
          const data = timers.get(fn);
          if (data) {
            clearTimer(data);
            timers.delete(fn);
          }
        }
      });
    })();
    function calcObjSize(obj) {
      if (obj === !0 || obj == null) return 4;
      if (obj === !1) return 5;
      let v = typeof obj;
      if (v === "string") return obj.length + 2;
      if (v === "number") return (v = obj) >= 0 && v < 10 ? 1 : Math.ceil(Math.log10(v < 0 ? -v : v));
      if (v !== "object") return `${obj}`.length;
      let sum = 1;
      if (Array.isArray(obj)) for (v of obj) sum += calcObjSize(v) + 1; else for (const k in obj) sum += k.length + 3 + calcObjSize(obj[k]) + 1;
      return sum;
    }
    function isEmptyObj(obj) {
      if (obj) for (const k in obj) if (hasOwn(obj, k)) return !1;
      return !0;
    }
    function mapObj(obj, fn, keys) {
      if (!obj) return obj;
      const res = {};
      for (const k of keys || Object.keys(obj)) keys && !(k in obj) || (res[k] = fn ? fn(obj[k], k, obj) : obj[k]);
      return res;
    }
    function reuseStyleVars(vars, src) {
      let old;
      if (vars && src && (src = src.usercssData.vars)) for (const key in vars) (old = src[key]) && (old = old.value) != null && (vars[key].value = old);
    }
    function tryRegExp(regexp, flags) {
      try {
        return new RegExp(regexp, flags);
      } catch {}
    }
    function tryJSONparse(jsonString) {
      try {
        if (jsonString) return JSON.parse(jsonString);
      } catch {}
    }
    function tryURL(url) {
      try {
        if (url) return new URL(url);
      } catch {}
      return "";
    }
    function deepMerge(src, dst, mergeArrays) {
      if (!src || typeof src != "object") return src;
      if (Array.isArray(src)) if (dst && mergeArrays) for (const v of src) dst.push(deepMerge(v)); else dst = Array.prototype.map.call(src, deepCopy); else {
        dst || (dst = {});
        for (const [k, v] of Object.entries(src)) dst[k] = deepMerge(v, dst[k]);
      }
      return dst;
    }
    function deepCopy(src) {
      return deepMerge(src);
    }
    function deepEqual(a, b, ignoredKeys) {
      if (!a || !b || a === b) return a === b;
      const type = typeof a;
      if (type !== typeof b) return !1;
      if (type !== "object") return a === b;
      if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i], ignoredKeys));
      for (const key in a) if (!(!hasOwn(a, key) || ignoredKeys && ignoredKeys.includes(key))) {
        if (!hasOwn(b, key)) return !1;
        if (!deepEqual(a[key], b[key], ignoredKeys)) return !1;
      }
      for (const key in b) if (!(!hasOwn(b, key) || ignoredKeys && ignoredKeys.includes(key) || hasOwn(a, key))) return !1;
      return !0;
    }
    async function fetchText(url, opts) {
      return (await fetch(url, opts)).text();
    }
    const CLIENT = Symbol("client");
    const PATH = location.pathname;
    const TTL = 3e5;
    const navLocks = navigator.locks;
    let numJobs = 0;
    let lastBusy = 0;
    let timer;
    navLocks && navLocks.request(PATH, () => new Promise(NOP));
    function createPortProxy(getTarget, opts) {
      let exec;
      return new Proxy({}, {
        get: (me, cmd) => cmd === CLIENT ? exec?.[CLIENT] : function(...args) {
          exec ??= createPortExec(getTarget, opts, me[CLIENT]);
          return exec.call(this, cmd, ...args);
        }
      });
    }
    function createPortExec(getTarget, {lock, once} = {}, target) {
      let queue;
      let port;
      let initPending;
      let tracking;
      let lastId = 0;
      return exec;
      async function exec(...args) {
        const ctx = {
          args,
          stack: (new Error).stack
        };
        const promise = new Promise((resolve, reject) => ctx.rr = [ resolve, reject ]);
        port || initPending || (initPending = initPort());
        initPending && (initPending = !exec[CLIENT] && await initPending);
        (once ? target : port).postMessage({
          args,
          id: ++lastId
        }, once || (Array.isArray(this) ? this : void 0));
        queue.set(lastId, ctx);
        ctx.p = promise.catch(NOP);
        return promise;
      }
      async function initPort() {
        exec[CLIENT] = null;
        target || (target = typeof getTarget == "function" ? getTarget() : getTarget).then && (target = await target);
        port = target instanceof MessagePort ? target : once ? initChannelPort(target, null, once = []) : initChannelPort(target, {
          lock
        });
        port.onmessage = onMessage;
        port.onmessageerror = onMessageError;
        queue = new Map;
        lastId = 0;
        exec[CLIENT] = target;
        tracking || once || !navLocks || trackTarget(queue);
      }
      function onMessage({data}) {
        const {id, res, err} = data.id ? data : JSON.parse(data);
        const {stack, rr: [resolve, reject]} = queue.get(id);
        queue.delete(id);
        lastId > 1e9 && (lastId = 0);
        err ? reject(err[1] ? Object.assign(...err, {
          stack: err[0].stack + "\n" + stack
        }) : err[0]) : resolve(res);
        once && queue.size && discard(queue, !0);
      }
      async function discard(myQ, wait) {
        for (;wait && myQ.size; ) await Promise.all(Array.from(myQ.values(), ctx => ctx.p));
        if (myQ === queue) {
          wait && port?.close();
          exec[CLIENT] = queue = port = target = null;
        }
      }
      async function trackTarget(myQ) {
        tracking = !0;
        for (;!(await navLocks.query()).held.some(v => v.name === lock); ) await sleep(10);
        await navLocks.request(lock, NOP);
        tracking = !1;
        for (const {stack, rr: [, reject]} of myQ.values()) {
          const msg = "Target disconnected";
          const err = new Error(msg);
          err.stack = msg + "\n" + stack;
          reject(err);
        }
        myQ.clear();
        queue === myQ && discard(myQ);
      }
    }
    function autoClose(delay) {
      numJobs || timer || (timer = setTimeout(close, delay ||= Math.max(0, lastBusy + TTL - performance.now())));
    }
    function initChannelPort(target, msg, transfer) {
      const mc = new MessageChannel;
      const port2 = mc.port2;
      transfer ? transfer[0] = port2 : target.postMessage(msg, [ port2 ]);
      return mc.port1;
    }
    function onMessageError({data, source}) {
      console.warn("Non-cloneable data", data);
      source.postMessage(JSON.stringify(data));
    }
    const ownRoot = chrome.runtime.getURL("");
    const actionPopupUrl = ownRoot + "popup.html";
    const installUsercss = "install-usercss.html";
    const workerPath = "/js/worker.js";
    const rxGF = /^((https:\/\/)(?:update\.)?((?:greasy|sleazy)fork\.org\/scripts\/)(\d+)\/.*?\.)(meta|user)(\.css)$|$/;
    const uso = "https://userstyles.org/";
    const usoApi = "https://gateway.userstyles.org/styles/getStyle";
    const usoJson = "https://userstyles.org/styles/chrome/";
    const usoaRaw = [ "https://cdn.jsdelivr.net/gh/uso-archive/data@flomaster/data/", "https://raw.githubusercontent.com/uso-archive/data/flomaster/data/", "https://cdn.jsdelivr.net/gh/33kk/uso-archive@flomaster/data/", "https://raw.githubusercontent.com/33kk/uso-archive/flomaster/data/" ];
    const usw = "https://userstyles.world/";
    const extractUsoaId = url => url && usoaRaw.some(u => url.startsWith(u)) && +url.match(/\/(\d+)\.user\.css|$/)[1];
    const extractUswId = url => url && url.startsWith(usw) && +url.match(/\/(\d+)\.user\.css|$/)[1];
    const makeInstallUrl = (url, id) => url === "usoa" || !id && (id = extractUsoaId(url)) ? `https://uso.kkx.one/style/${id}` : url === "usw" || !id && (id = extractUswId(url)) ? `${usw}style/${id}` : url === "gf" || !id && (id = rxGF.exec(url)) ? id[2] + id[3] + id[4] : "";
    const makeUpdateUrl = (url, id) => url === "usoa" || !id && (id = extractUsoaId(url)) ? `${usoaRaw[0]}usercss/${id}.user.css` : url === "usw" || !id && (id = extractUswId(url)) ? `${usw}api/style/${id}.user.css` : "";
    const regExpTest = RegExp.prototype.test;
    const supported = regExpTest.bind(new RegExp(`^(?:(?:ht|f)tps?:|file:|${ownRoot})`));
    const isLocalhost = regExpTest.bind(/^file:|^https?:\/\/([^/]+@)?(localhost|127\.0\.0\.1)(:\d+)?\//);
    const isCdnUrl = regExpTest.bind(/^https:\/\/((\w+-)?cdn(js)?(-\w+)?\.[^/]+|[^/]+?\.github(usercontent)?\.(io|com))\//i);
    const uad = navigator.userAgentData;
    const ua = uad || navigator.userAgent;
    const brands = uad ? uad.brands.map(l => `${l.brand}/${l.version}`).join(" ") : ua;
    const platform = uad ? uad.platform || navigator.platform : ua;
    const chromeVer = +brands.match(/Chrom\w*\/(\d+)|$/)[1];
    const CHROME = chromeVer;
    chromeVer || brands.match(/Firefox\w*\/(\d+)|$/);
    brands.match(/(?:Opera|OPR)\w*\/(\d+)|$/);
    const MOBILE = uad ? uad.mobile : /Android/.test(ua);
    const WINDOWS = /Windows/.test(platform);
    brands.match(/Vivaldi\w*\/(\d+)|$/);
    const ownId = chrome.runtime.id;
    const MF = chrome.runtime.getManifest();
    const MF_ICON = MF.icons[16].replace(ownRoot, "");
    const MF_ICON_PATH = MF_ICON.slice(0, MF_ICON.lastIndexOf("/") + 1);
    const MF_ICON_EXT = MF_ICON.slice(MF_ICON.lastIndexOf("."));
    const browserAction = chrome.action;
    const browserWindows = browser.windows;
    const browserSidepanel = chrome.sidePanel;
    const browserSidebar = browserSidepanel || browser.sidebarAction;
    const webNavigation = browser.webNavigation;
    const getActiveTab = async () => {
      let [v] = await browser.tabs.query({
        currentWindow: !0,
        active: !0
      });
      !v && browserWindows && (v = await browserWindows.getCurrent().catch(NOP)) && ([v] = await browser.tabs.query({
        windowId: v.id,
        active: !0
      }).catch(NOP));
      return v;
    };
    const ignoreChromeError = () => chrome.runtime.lastError;
    const openDashboard = (mgr, side, close, where) => browserSidebar && (side || values[mgr ? "popup.sidePanel.manager" : "popup.sidePanel.options"]) ? openSidebar(mgr ? "manage.html?" + new URLSearchParams(mgr) : "options.html", close, where) : API.tabs.openManager(mgr || {
      options: !0
    }).then(close);
    const openSidebar = async (path, close, where) => {
      path += (path.includes("?") ? "&" : "?") + "sidebar";
      return (browserSidepanel ? (browserSidepanel.setOptions({
        tabId: where.tabId,
        path
      }), browserSidepanel.open(where)) : (browserSidebar.setPanel({
        ...where,
        panel: path
      }), browserSidebar.open())).then(!1);
    };
    const paintCanvas = (w, h, cb) => {
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d");
      cb(ctx, canvas);
      return ctx.getImageData(0, 0, w, h);
    };
    const toggleListener = (evt, add, ...args) => add ? evt.addListener(...args) : evt.removeListener(args[0]);
    global._deepCopy = deepCopy;
    self;
    let busy, ready, setReady;
    const defaults = {
      __proto__: null,
      disableAll: !1,
      exposeIframes: !1,
      "exposeIframes.sites": "",
      "exposeIframes.sitesOnly": !1,
      exposeStyleName: !1,
      keepAlive: 0,
      keepAliveIdle: !1,
      newStyleAsUsercss: !1,
      openEditInWindow: !1,
      "openEditInWindow.popup": !1,
      patchCsp: !1,
      "patchCsp.sites": "",
      "patchCsp.sitesOnly": !1,
      "show-badge": !0,
      styleViaASS: !1,
      "styleViaASS.sites": "",
      "styleViaASS.sitesOnly": !1,
      styleViaXhr: !1,
      "styleViaXhr.sites": "",
      "styleViaXhr.sitesOnly": !1,
      urlInstaller: !0,
      windowPosition: {},
      compactWidth: 850,
      "config.autosave": !0,
      "schemeSwitcher.enabled": "system",
      "schemeSwitcher.nightStart": "18:00",
      "schemeSwitcher.nightEnd": "06:00",
      "popup.enabledFirst": !0,
      "popup.stylesFirst": !0,
      "popup.autoResort": !1,
      "popup.borders": !1,
      "popup.findSort": "w",
      "manage.onlyEnabled": !1,
      "manage.onlyLocal": !1,
      "manage.onlyUsercss": !1,
      "manage.onlyEnabled.invert": !1,
      "manage.onlyLocal.invert": !1,
      "manage.onlyUsercss.invert": !1,
      "manage.actions.expanded": !1,
      "manage.backup.expanded": !0,
      "manage.filters.expanded": !0,
      "manage.links.expanded": !0,
      "manage.minColumnWidth": 750,
      "manage.newUI": !0,
      "manage.newUI.favicons": !0,
      "manage.newUI.faviconsGray": !1,
      "manage.newUI.targets": 3,
      "manage.newUI.sort": "title,asc",
      "manage.searchMode": "meta",
      "editor.options": {},
      "editor.toc.expanded": !0,
      "editor.options.expanded": !0,
      "editor.options.style.expanded": !0,
      "editor.general.expanded": !0,
      "editor.lint.expanded": !0,
      "editor.publish.expanded": !0,
      "editor.lineWrapping": !0,
      "editor.smartIndent": !0,
      "editor.indentWithTabs": !1,
      "editor.tabSize": 4,
      "editor.keyMap": "default",
      "editor.theme": "default",
      "editor.beautify": {
        selector_separator_newline: !0,
        newline_before_open_brace: !1,
        newline_after_open_brace: !0,
        newline_between_properties: !0,
        newline_before_close_brace: !0,
        newline_between_rules: !1,
        preserve_newlines: !0,
        end_with_newline: !1,
        indent_conditional: !0,
        indent_mozdoc: !0,
        space_around_combinator: !0,
        space_around_cmp: !1
      },
      "editor.beautify.hotkey": "",
      "editor.toggle.hotkey": "Alt-Enter",
      "editor.toggle.save": !1,
      "editor.linter": "csslint",
      [pEditorLinterOn]: !0,
      "editor.lintReportDelay": 500,
      "editor.matchHighlight": "token",
      "editor.autoCloseBrackets": !0,
      "editor.autocompleteOnTyping": !1,
      "editor.contextDelete": !1,
      "editor.selectByTokens": !0,
      "editor.arrowKeysTraverse": !0,
      "editor.appliesToLineWidget": !0,
      "editor.autosaveDraft": 10,
      "editor.livePreview": !0,
      "editor.livePreview.delay": .2,
      "editor.targetsFirst": !0,
      "editor.colorpicker": !0,
      "editor.colorpicker.hexUppercase": 0,
      "editor.colorpicker.hotkey": "",
      "editor.colorpicker.color": "",
      "editor.colorpicker.maxHeight": 300,
      "hotkey._execute_browser_action": "",
      "hotkey.openManage": "",
      "hotkey.styleDisableAll": "",
      "hotkey.toggleTab": "",
      "sync.enabled": "none",
      iconset: -1,
      badgeDisabled: "#8B0000",
      badgeNormal: "#006666",
      "headerWidth.edit": 280,
      "headerWidth.install": 280,
      "headerWidth.manage": 280,
      "popup.search.globals": !1,
      "popup.sidePanel": !1,
      "popup.sidePanel.config": -1,
      "popup.sidePanel.editor": !1,
      "popup.sidePanel.finder": !1,
      "popup.sidePanel.manager": !1,
      "popup.sidePanel.options": !0,
      "popup.toggler.expanded": !1,
      popupWidth: 246,
      popupWidthMax: 280,
      updateInterval: 24,
      updateOnlyEnabled: !1
    };
    const warnUnknown = console.warn.bind(console, 'Unknown preference "%s"');
    const values = deepCopy(defaults);
    const onChange = {};
    const onStorageChanged = new Set;
    Object.keys(defaults);
    const getDbArray = async key => {
      key = await API.prefsDB.get(key);
      return Array.isArray(key) ? key : null;
    };
    const set = (key, val, isSynced, ...onChangeArgs) => {
      if (!val && key === "editor.linter") {
        key = pEditorLinterOn;
        val = !1;
      }
      const old = values[key];
      const def = defaults[key];
      const type = typeof def;
      if (def === void 0) return warnUnknown(key);
      type !== typeof val && (val = type === "string" ? `${val}` : type === "number" ? +val || 0 : type === "boolean" ? val === "true" || val !== "false" && !!val : null);
      if (!(val === old || type === "object" && deepEqual(val, old))) {
        values[key] = val;
        global._busy || onChange[key]?.forEach(fn => fn(key, val, void 0, ...onChangeArgs));
        return set._bgSet(key, val);
      }
    };
    const subscribe = (keys, fn, runNow) => {
      if (!fn) return;
      let toRun;
      for (const key of Array.isArray(keys) ? new Set(keys) : [ keys ]) if (key in defaults) {
        (onChange[key] ??= new Set).add(fn);
        runNow && (busy ? (toRun ??= []).push(key) : fn(key, values[key], !0));
      } else warnUnknown(key);
      return toRun ? busy.then(() => {
        for (const key of toRun) fn(key, values[key], !0);
      }) : void 0;
    };
    const unsubscribe = (keys, fn) => {
      for (const key of Array.isArray(keys) ? keys : [ keys ]) {
        const fns = onChange[key];
        if (fns) {
          fns.delete(fn);
          fns.size || delete onChange[key];
        }
      }
    };
    function setAll(data, fromStorage) {
      busy = !1;
      if (fromStorage) {
        for (const key in fromStorage) !(key in data) && key in defaults && set(key, defaults[key], !0);
        for (const key in data || (data = {})) set(key, data[key], !0) || delete data[key];
      } else Object.assign(values, data);
    }
    busy = ready = new Promise(cb => setReady = cb);
    busy.set = (...args) => setReady(setAll(...args));
    (chrome.storage.sync.onChanged || chrome.storage.onChanged).addListener((changes, area) => {
      if (busy) return;
      const data = (!area || area === "sync") && changes.settings;
      data && setAll(data.newValue, data.oldValue);
      for (const fn of onStorageChanged) fn(changes, area);
    });
    const clientDataJobs = new Map;
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
    let WRB = null;
    let WRBTest = browser.permissions.contains({
      permissions: [ "webRequestBlocking" ]
    }).then(res => {
      WRBTest = null;
      WRB = res;
      return res;
    });
    let bgPreInit = [];
    let bgInit = [];
    let bgBusy = global._busy = Object.assign(new Promise(cb => l = cb), {
      resolve: l
    });
    var l;
    let isVivaldi, vivaldiTest;
    browserWindows ? vivaldiTest = async (wnd = browserWindows.getLastFocused()) => isVivaldi = !(!(wnd = await wnd) || !wnd.vivExtData && !wnd.extData) : isVivaldi = !1;
    bgPreInit.push(WRBTest);
    bgBusy.then(() => {
      bgBusy = bgPreInit = bgInit = null;
      delete global._busy;
    });
    let keep_alive_busy;
    let lastBusyTime = 0;
    let pulse;
    let keep_alive_TTL;
    let idleDuration;
    keepAlive(bgBusy);
    global.keepAlive = keepAlive;
    subscribe("keepAlive", (l, val) => {
      idleDuration = Math.max(30, val * 60 | 0 || 0);
      keep_alive_TTL = val * 6e4;
      pulse && (keep_alive_TTL || keep_alive_busy) || reschedule();
    }, !0);
    function keepAlive(job) {
      job instanceof Promise ? keep_alive_busy ? keep_alive_busy.push(job) : keepAliveUntilSettled([ job ]) : lastBusyTime = performance.now();
      return job;
    }
    async function keepAliveUntilSettled(promises) {
      keep_alive_busy = promises;
      keep_alive_TTL == null && bgBusy && await bgBusy;
      pulse || reschedule();
      do {
        await Promise.allSettled(keep_alive_busy);
      } while (keep_alive_busy?.splice(0, promises.length) && keep_alive_busy.length);
      keep_alive_busy = null;
      lastBusyTime = performance.now();
    }
    async function reschedule() {
      if (keep_alive_busy || keep_alive_TTL < 0 ? isUserActiveInBrowser(!0) : keep_alive_TTL && performance.now() < lastBusyTime + keep_alive_TTL && await isUserActiveInBrowser(values.keepAliveIdle)) pulse ??= setInterval(reschedule, 25e3); else if (pulse) {
        clearInterval(pulse);
        pulse = null;
      }
    }
    async function isUserActiveInBrowser(yes) {
      return (await chrome.idle.queryState(idleDuration) !== "idle" || yes) && (yes || (await chrome.windows.getAll({})).some(wnd => wnd.focused));
    }
    function createLock({maxActiveReader = 1 / 0} = {}) {
      let firstTask;
      let lastTask;
      let activeReader = 0;
      const self = {
        read: fn => que(fn, !1),
        write: fn => que(fn, !0),
        length: 0
      };
      return self;
      function que(fn, block) {
        const task = createTask({
          fn,
          block
        });
        if (lastTask) {
          lastTask.next = task;
          task.prev = lastTask;
          lastTask = task;
          firstTask || (firstTask = lastTask);
        } else firstTask = lastTask = task;
        self.length++;
        deque();
        return task.q.promise;
      }
      function defer() {
        const o = {};
        o.promise = new Promise((resolve, reject) => {
          o.resolve = resolve;
          o.reject = reject;
        });
        return o;
      }
      function createTask({fn, block = !1, prev, next, q = defer(), q2 = fn.length ? defer() : null}) {
        return {
          fn,
          block,
          prev,
          next,
          q,
          q2
        };
      }
      function deque() {
        const task = firstTask;
        if (!task || task.block && task.prev || task.prev && task.prev.block || activeReader >= maxActiveReader) return;
        task.block || activeReader++;
        firstTask = task.next;
        let result;
        try {
          result = task.fn(task.q2 && task.q2.resolve);
        } catch (l) {
          task.q.reject(l);
          onDone();
          return;
        }
        task.q2 && task.q2.promise.then(_onDone);
        if (result && result.then) {
          const pending = result.then(task.q.resolve, task.q.reject);
          task.q2 || pending.then(onDone);
        } else {
          task.q.resolve(result);
          if (!task.q2) {
            onDone();
            return;
          }
        }
        deque();
        function onDone() {
          _onDone();
        }
        function _onDone(afterDone) {
          task.prev && (task.prev.next = task.next);
          task.next && (task.next.prev = task.prev);
          lastTask === task && (lastTask = task.prev);
          task.block || activeReader--;
          self.length--;
          afterDone && afterDone();
          deque();
        }
      }
    }
    function percentToByte(p) {
      return String.fromCharCode(parseInt(p.slice(1), 16));
    }
    function debounced(fn) {
      let timer = 0;
      let q;
      return () => {
        timer && clearTimeout(timer);
        timer = setTimeout(run);
        q || (q = defer());
        return q.promise;
      };
      function run() {
        Promise.resolve(fn()).then(q.resolve, q.reject);
        timer = 0;
        q = null;
      }
      function defer() {
        const o = {};
        o.promise = new Promise((resolve, reject) => {
          o.resolve = resolve;
          o.reject = reject;
        });
        return o;
      }
    }
    function delay(time) {
      return new Promise(resolve => setTimeout(resolve, time));
    }
    class RequestError extends Error {
      constructor(message, origin, code = origin && origin.status) {
        super(message);
        this.code = code;
        this.origin = origin;
        Error.captureStackTrace && Error.captureStackTrace(this, RequestError);
      }
    }
    function createRequest({fetch, cooldown = 0, getAccessToken, username, password}) {
      const lock = createLock();
      const basicAuth = username || password ? `Basic ${str = `${username}:${password}`, 
      btoa(encodeURIComponent(str).replace(/%[0-9A-F]{2}/g, percentToByte))}` : null;
      var str;
      return args => lock.write(async done => {
        try {
          return await doRequest(args);
        } finally {
          cooldown && args.method && args.method !== "GET" ? setTimeout(done, cooldown) : done();
        }
      });
      async function doRequest({path, contentType, headers: l, format, raw = !1, ...args}) {
        const headers = {};
        getAccessToken && (headers.Authorization = `Bearer ${await getAccessToken()}`);
        basicAuth && (headers.Authorization = basicAuth);
        contentType && (headers["Content-Type"] = contentType);
        Object.assign(headers, l);
        for (;;) {
          const res = await fetch(path, {
            headers,
            ...args
          });
          if (!res.ok) {
            const retry = res.headers.get("Retry-After");
            if (retry) {
              const time = Number(retry);
              if (time) {
                await delay(time * 1e3);
                continue;
              }
            }
            const text = await res.text();
            throw new RequestError(`failed to fetch [${res.status}]: ${text}`, res);
          }
          if (raw) return res;
          if (format) return await res[format]();
          const resContentType = res.headers.get("Content-Type");
          return /application\/json/.test(resContentType) ? await res.json() : await res.text();
        }
      }
    }
    class LockError extends Error {
      constructor(expire) {
        super(`The database is locked. Will expire at ${new Date(expire).toLocaleString()}`);
        this.expire = expire;
        this.name = "LockError";
        Error.captureStackTrace && Error.captureStackTrace(this, LockError);
      }
    }
    function buildDrive(l) {
      const drive = Object.create(l);
      drive.get = async path => JSON.parse(await l.get(path));
      drive.put = async (path, data) => await l.put(path, JSON.stringify(data));
      drive.post = async (path, data) => await l.post(path, JSON.stringify(data));
      drive.isInit = !1;
      if (!drive.acquireLock) {
        drive.acquireLock = async function(expire) {
          try {
            await this.post("lock.json", {
              expire: Date.now() + expire * 60 * 1e3
            });
          } catch (l) {
            if (l.code !== "EEXIST") throw l;
            const data = await this.get("lock.json");
            if (Date.now() > data.expire) {
              await this.delete("lock.json");
              throw new Error("Found expired lock, please try again");
            }
            throw new LockError(data.expire);
          }
        };
        drive.releaseLock = async function() {
          await this.delete("lock.json");
        };
      }
      if (!drive.getMeta) {
        drive.getMeta = async function() {
          try {
            return await this.get("meta.json");
          } catch (l) {
            if (l.code === "ENOENT" || l.code === 404) return {};
            throw l;
          }
        };
        drive.putMeta = async function(data) {
          await this.put("meta.json", data);
        };
      }
      drive.peekChanges || (drive.peekChanges = async function(oldMeta) {
        return (await this.getMeta()).lastChange !== oldMeta.lastChange;
      });
      return drive;
    }
    function dbToCloud({onGet, onPut, onDelete, onFirstSync, onWarn = console.error, onProgress, compareRevision, getState, setState, lockExpire = 60, retryMaxAttempts = 5, retryExp = 1.5, retryDelay = 10}) {
      let drive;
      let state;
      let meta;
      const changeCache = new Map;
      const saveState = debounced(() => setState(drive, state));
      const revisionCache = new Map;
      const lock = createLock();
      return {
        use: newDrive => {
          drive = buildDrive(newDrive);
        },
        init: () => lock.write(async () => {
          if (!state || !state.enabled) {
            if (!drive) throw new Error("cloud drive is undefined");
            state = await getState(drive) || {};
            state.enabled = !0;
            state.queue || (state.queue = []);
          }
        }),
        uninit: () => lock.write(async () => {
          if (state && state.enabled) {
            state = meta = null;
            changeCache.clear();
            revisionCache.clear();
            if (drive.uninit && drive.isInit) {
              await drive.uninit();
              drive.isInit = !1;
            }
            await saveState();
          }
        }),
        put: (l, y) => {
          if (state && state.enabled) {
            state.queue.push({
              _id: l,
              _rev: y,
              action: "put"
            });
            saveState();
          }
        },
        delete: (l, y) => {
          if (state && state.enabled) {
            state.queue.push({
              _id: l,
              _rev: y,
              action: "delete"
            });
            saveState();
          }
        },
        syncNow: peek => lock.write(async () => {
          if (!state || !state.enabled) throw new Error("Cannot sync now, the sync is not enabled");
          if (drive.init && !drive.isInit) {
            await drive.init();
            drive.isInit = !0;
          }
          state.lastChange == null && await onFirstSync();
          await _syncNow(peek);
        }),
        drive: () => drive,
        isInit: () => Boolean(state && state.enabled)
      };
      async function syncPull() {
        meta = await drive.getMeta();
        if (!meta.lastChange || meta.lastChange === state.lastChange) return;
        let changes = [];
        if (state.lastChange) {
          const end = Math.floor((meta.lastChange - 1) / 100);
          let i = Math.floor(state.lastChange / 100);
          for (;i <= end; ) {
            const newChanges = await drive.get(`changes/${i}.json`);
            changeCache.set(i, newChanges);
            changes = changes.concat(newChanges);
            i++;
          }
          changes = changes.slice(state.lastChange % 100);
        } else changes = (await drive.list("docs")).map(name => ({
          action: "put",
          _id: name.slice(0, -5)
        }));
        const idx = new Map;
        for (const change of changes) idx.set(change._id, change);
        let loaded = 0;
        for (const [id, change] of idx) {
          let doc, l;
          onProgress && onProgress({
            phase: "pull",
            total: idx.size,
            loaded,
            change
          });
          if (change.action === "delete") await onDelete(id, change._rev); else if (change.action === "put") {
            try {
              ({doc, _rev: l} = await drive.get(`docs/${id}.json`));
            } catch (l) {
              if (l.code === "ENOENT" || l.code === 404) {
                onWarn(`Cannot find ${id}. Is it deleted without updating the history?`);
                loaded++;
                continue;
              }
              throw l;
            }
            await onPut(doc);
          }
          const rev = change._rev || l;
          rev && revisionCache.set(id, rev);
          loaded++;
        }
        state.lastChange = meta.lastChange;
        await saveState();
      }
      async function syncPush() {
        if (!state.queue.length) return;
        const changes = state.queue.slice();
        const idx = new Map;
        for (const change of changes) idx.set(change._id, change);
        const newChanges = [];
        for (const change of idx.values()) {
          const remoteRev = revisionCache.get(change._id);
          remoteRev !== void 0 && compareRevision(change._rev, remoteRev) <= 0 || newChanges.push(change);
        }
        let loaded = 0;
        for (const change of newChanges) {
          onProgress && onProgress({
            phase: "push",
            loaded,
            total: newChanges.length,
            change
          });
          if (change.action === "delete") await drive.delete(`docs/${change._id}.json`); else if (change.action === "put") {
            const doc = await onGet(change._id, change._rev);
            await drive.put(`docs/${change._id}.json`, {
              doc,
              _rev: change._rev
            });
          }
          revisionCache.set(change._id, change._rev);
          loaded++;
        }
        let lastChanges;
        let index;
        if (meta.lastChange) {
          index = Math.floor(meta.lastChange / 100);
          const len = meta.lastChange % 100;
          lastChanges = len ? changeCache.get(index) || await drive.get(`changes/${index}.json`) : [];
          lastChanges = lastChanges.slice(0, len).concat(newChanges);
        } else {
          index = 0;
          lastChanges = newChanges;
        }
        for (let i = 0; i * 100 < lastChanges.length; i++) {
          const window = lastChanges.slice(i * 100, (i + 1) * 100);
          await drive.put(`changes/${index + i}.json`, window);
          changeCache.set(index + i, window);
        }
        meta.lastChange = (meta.lastChange || 0) + newChanges.length;
        await drive.putMeta(meta);
        state.queue = state.queue.slice(changes.length);
        state.lastChange = meta.lastChange;
        await saveState();
      }
      async function sync() {
        let tried = 0;
        let wait = retryDelay;
        let lastErr;
        for (;;) {
          try {
            await drive.acquireLock(lockExpire);
            break;
          } catch (l) {
            if (l.name !== "LockError") throw l;
            lastErr = l;
          }
          tried++;
          if (tried >= retryMaxAttempts) throw lastErr;
          await delay(wait * 1e3);
          wait *= retryExp;
        }
        try {
          await syncPull();
          await syncPush();
        } finally {
          await drive.releaseLock();
        }
      }
      async function _syncNow(peek = !0) {
        onProgress && onProgress({
          phase: "start"
        });
        try {
          if (!state.queue.length && peek && meta && !await drive.peekChanges(meta)) return;
          await sync();
        } finally {
          onProgress && onProgress({
            phase: "end"
          });
        }
      }
    }
    const cloudDrive = {
      dropbox: ({getAccessToken, fetch = (typeof self != "undefined" ? self : global).fetch}) => {
        const request = createRequest({
          fetch,
          getAccessToken
        });
        return {
          name: "dropbox",
          get: async file => {
            const params = {
              path: `/${file}`
            };
            try {
              return await request({
                path: `https://content.dropboxapi.com/2/files/download?${stringifyParams(params)}`,
                format: "text"
              });
            } catch (l) {
              l.code === 409 && l.message.includes("not_found") && (l.code = "ENOENT");
              throw l;
            }
          },
          put,
          post: async (file, data) => {
            try {
              return await put(file, data, "add");
            } catch (l) {
              l.code === 409 && l.message.includes("conflict") && (l.code = "EEXIST");
              throw l;
            }
          },
          delete: async file => {
            try {
              await requestRPC({
                path: "files/delete_v2",
                body: {
                  path: `/${file}`
                }
              });
            } catch (l) {
              if (l.code === 409 && l.message.includes("not_found")) return;
              throw l;
            }
          },
          list: async file => {
            const names = [];
            let result = await requestRPC({
              path: "files/list_folder",
              body: {
                path: `/${file}`
              }
            });
            for (const entry of result.entries) names.push(entry.name);
            if (!result.has_more) return names;
            for (;result.has_more; ) {
              result = await requestRPC({
                path: "files/list_folder/continue",
                body: {
                  cursor: result.cursor
                }
              });
              for (const entry of result.entries) names.push(entry.name);
            }
            return names;
          }
        };
        function requestRPC({path, body, ...args}) {
          return request({
            method: "POST",
            path: `https://api.dropboxapi.com/2/${path}`,
            contentType: "application/json",
            body: JSON.stringify(body),
            ...args
          });
        }
        function stringifyParams(obj) {
          const params = new URLSearchParams;
          params.set("arg", JSON.stringify(obj));
          return params.toString();
        }
        async function put(file, data, mode = "overwrite") {
          const params = {
            path: `/${file}`,
            mode,
            autorename: !1,
            mute: !0
          };
          await request({
            path: `https://content.dropboxapi.com/2/files/upload?${stringifyParams(params)}`,
            method: "POST",
            contentType: "application/octet-stream",
            body: data
          });
        }
      },
      onedrive: ({getAccessToken, fetch = (typeof self != "undefined" ? self : global).fetch}) => {
        const request = createRequest({
          fetch,
          getAccessToken
        });
        return {
          name: "onedrive",
          get: async file => await query({
            path: `:/${file}:/content`,
            format: "text"
          }),
          put: async (file, data) => {
            await query({
              method: "PUT",
              path: `:/${file}:/content`,
              headers: {
                "Content-Type": "text/plain"
              },
              body: data
            });
          },
          post: async (file, data) => {
            try {
              await query({
                method: "PUT",
                path: `:/${file}:/content?@microsoft.graph.conflictBehavior=fail`,
                headers: {
                  "Content-Type": "text/plain"
                },
                body: data
              });
            } catch (l) {
              l.code === 409 && l.message.includes("nameAlreadyExists") && (l.code = "EEXIST");
              throw l;
            }
          },
          delete: async file => {
            try {
              await query({
                method: "DELETE",
                path: `:/${file}:`
              });
            } catch (l) {
              if (l.code === 404) return;
              throw l;
            }
          },
          list: async file => {
            file && (file = `:/${file}:`);
            let result = await query({
              path: `${file}/children?select=name`
            });
            let files = result.value.map(i => i.name);
            for (;result["@odata.nextLink"]; ) {
              result = await request({
                path: result["@odata.nextLink"]
              });
              files = files.concat(result.value.map(i => i.name));
            }
            return files;
          }
        };
        async function query(args) {
          args.path = `https://graph.microsoft.com/v1.0/me/drive/special/approot${args.path}`;
          return await request(args);
        }
      },
      google: ({getAccessToken, fetch = (typeof self != "undefined" ? self : global).fetch, FormData = (typeof self != "undefined" ? self : global).FormData, Blob = (typeof self != "undefined" ? self : global).Blob}) => {
        const request = createRequest({
          fetch,
          getAccessToken
        });
        const fileMetaCache = new Map;
        let lockRev;
        return {
          name: "google",
          get: async file => {
            let meta = fileMetaCache.get(file);
            if (!meta) {
              await updateMeta(`name = '${file}'`);
              meta = fileMetaCache.get(file);
              if (!meta) throw new RequestError(`metaCache doesn't contain ${file}`, null, "ENOENT");
            }
            try {
              return await request({
                path: `https://www.googleapis.com/drive/v3/files/${meta.id}?alt=media`
              });
            } catch (l) {
              l.code === 404 && (l.code = "ENOENT");
              throw l;
            }
          },
          put: async (file, data) => {
            if (!fileMetaCache.has(file)) return await post(file, data);
            const meta = fileMetaCache.get(file);
            const result = await queryPatch(meta.id, data);
            meta.headRevisionId = result.headRevisionId;
          },
          post,
          delete: async file => {
            const meta = fileMetaCache.get(file);
            if (meta) try {
              await request({
                method: "DELETE",
                path: `https://www.googleapis.com/drive/v3/files/${meta.id}`
              });
            } catch (l) {
              if (l.code === 404) return;
              throw l;
            }
          },
          list: async file => [ ...fileMetaCache.values() ].filter(f => f.name.startsWith(file + "/")).map(f => f.name.split("/")[1]),
          init: async () => {
            await updateMeta();
            fileMetaCache.has("lock.json") || await post("lock.json", "{}");
            fileMetaCache.has("meta.json") || await post("meta.json", "{}");
          },
          acquireLock: async expire => {
            const lock = fileMetaCache.get("lock.json");
            const {headRevisionId} = await queryPatch(lock.id, JSON.stringify({
              expire: Date.now() + expire * 60 * 1e3
            }), {
              keepRevisionForever: !0
            });
            try {
              const result = await request({
                path: `https://www.googleapis.com/drive/v3/files/${lock.id}/revisions?fields=revisions(id)`
              });
              for (let i = 1; i < result.revisions.length; i++) {
                const revId = result.revisions[i].id;
                if (revId === headRevisionId) {
                  lockRev = headRevisionId;
                  return;
                }
                const rev = JSON.parse(await request({
                  path: `https://www.googleapis.com/drive/v3/files/${lock.id}/revisions/${revId}?alt=media`
                }));
                if (rev.expire > Date.now()) throw new LockError(rev.expire);
                await revDelete(lock.id, revId);
              }
              throw new Error("cannot find lock revision");
            } catch (l) {
              await revDelete(lock.id, headRevisionId);
              throw l;
            }
          },
          releaseLock: async () => {
            const lock = fileMetaCache.get("lock.json");
            await revDelete(lock.id, lockRev);
            lockRev = null;
          },
          fileMetaCache
        };
        async function revDelete(fileId, revId) {
          await request({
            method: "DELETE",
            path: `https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${revId}`
          });
        }
        async function queryList(path, onPage) {
          path = "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=nextPageToken,files(id,name,headRevisionId)" + (path ? "&" + path : "");
          let result = await request({
            path
          });
          onPage(result);
          for (;result.nextPageToken; ) {
            result = await request({
              path: `${path}&pageToken=${result.nextPageToken}`
            });
            onPage(result);
          }
        }
        async function queryPatch(id, text, query) {
          let path = `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media&fields=headRevisionId`;
          query && (path += `&${new URLSearchParams(query).toString()}`);
          return await request({
            method: "PATCH",
            path,
            headers: {
              "Content-Type": "text/plain"
            },
            body: text
          });
        }
        async function updateMeta(query) {
          query && (query = `q=${encodeURIComponent(query)}`);
          await queryList(query, result => {
            for (const file of result.files) fileMetaCache.set(file.name, file);
          });
        }
        async function post(file, data) {
          const body = new FormData;
          body.append("metadata", new Blob([ JSON.stringify({
            name: file,
            parents: [ "appDataFolder" ]
          }) ], {
            type: "application/json; charset=UTF-8"
          }));
          body.append("media", new Blob([ data ], {
            type: "text/plain"
          }));
          const result = await request({
            method: "POST",
            path: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,headRevisionId",
            body
          });
          fileMetaCache.set(result.name, result);
        }
      },
      webdav: !1
    };
    const StorageExtras = {
      async getValue(key) {
        return (await this.get(key))[key];
      }
    };
    const chromeLocal = Object.assign(browser.storage.local, StorageExtras);
    const chromeSession = browser.storage.session;
    const kSites = ".sites";
    const kSitesOnly = ".sitesOnly";
    const OPT_IDS = [ "exposeIframes", "patchCsp", "styleViaASS", "styleViaXhr" ];
    const SITE_RE = /^(?:(\*)$|(-)?((?:(?:ht|f)tps?|\*):\/\/)?([-\w.*]+(?::\d+)?)(\/[^\s#]*)?)/i;
    const optionSites = {};
    const isOptionSite = ({on, off}, url) => !(on !== !0 && !on?.test(url) || off?.test(url));
    let pending;
    subscribe([ "disableAll", ...OPT_IDS.join(",").replace(/[^,]+/g, `$&,$&${kSites},$&${kSitesOnly}`).split(",") ], function onPref(key) {
      if (key) pending ??= Promise.resolve().then(onPref); else {
        pending = null;
        values.disableAll || update();
      }
    }, !0);
    function update() {
      for (const id of OPT_IDS) {
        if (!values[id]) continue;
        if (!values[id + kSitesOnly]) {
          optionSites[id] = !1;
          continue;
        }
        const arr = values[id + kSites].trim().toLowerCase().split(/\s+/).sort();
        const str = arr.join("\n");
        if (str === optionSites[id]?.str) continue;
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
              data[type] ??= [];
              re ? (regexps[type] ??= []).push(re) : data[type].push([ (m[3] || " [-a-z ] +://").toLowerCase(), m[4].replace("*.", " ( ?: [ ^:/ ] + \\ . ) ?").toLowerCase() + (m[5] || "/*") ]);
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
            res = globAsRegExpStr(res.join("")).replace(/ \\/g, "");
          }
          data[k] = tryRegExp((res || "") + (regexps[k] ? `${res ? "|" : ""}^(?:${regexps[k].join("|")})$` : ""));
          data.str = str;
        }
      }
    }
    let exec = async function(dbName, method, ...args) {
      const many = method.endsWith("Many");
      if (many && !args[0].length) return [];
      const mode = method.startsWith("get") ? void 0 : "readwrite";
      const storeName = STORES[dbName];
      const store = (databases[dbName] ??= await db_open(dbName)).transaction([ storeName ], mode).objectStore(storeName);
      mode && dbName in MIRROR && execMirror(...arguments);
      return many ? storeMany(store, method.slice(0, -4), ...args) : new Promise((resolve, reject) => {
        const request = store[method](...args);
        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
      });
    };
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
    const proxyHandler = {
      get: ({dbName}, cmd) => (CACHING[dbName] || exec).bind(null, dbName, cmd)
    };
    const getDbProxy = (dbName, {id, store = "data", ver = 2} = {}) => proxies[dbName] ??= (DATA_KEY[dbName] = id && typeof id != "string" ? "id" : id, 
    STORES[dbName] = store, VERSIONS[dbName] = ver, new Proxy({
      dbName
    }, proxyHandler));
    getDbProxy("cache", {
      id: "url"
    });
    const db = getDbProxy("stylish", {
      id: !0,
      store: "styles"
    });
    const draftsDB = getDbProxy(DRAFTS_DB);
    const prefsDB = getDbProxy("settings");
    const stateDB = getDbProxy("state", {
      store: "kv"
    });
    async function cachedExec(dbName, cmd, a, b) {
      const hub = dataCache[dbName] ??= {};
      const res = cmd === "get" && a in hub ? hub[a] : await exec(...arguments);
      if (cmd === "get") hub[a] = deepMerge(res); else if (cmd === "put") {
        const key = DATA_KEY[dbName];
        hub[key ? a[key] : b] = deepMerge(a);
      } else cmd === "delete" && delete hub[a];
      return res;
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
        const req = store[method](items[num], keys?.[num]);
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
      const mirror = MIRROR[dbName] ??= await caches.open(dbName).catch(() => !1);
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
        await sleep(10);
        dbName === "stylish" && a.usercssData && delete (a = {
          ...a
        }).sections;
        b = "http://_/" + (b ?? a.id);
        a = JSON.stringify(a);
        if (CompressionStream) {
          MIRROR_INIT.headers["Content-Length"] = a.length;
          a = new Response(a).body.pipeThrough(new CompressionStream("gzip"));
        }
        return mirror.put(b, new Response(a, MIRROR_INIT));

       case "putMany":
        for (let i = 0; i < a.length; i++) await execMirror(dbName, "put", a[i], b?.[i]);
      }
    }
    async function mirrorStorage(styleMap) {
      let val;
      let keys = await execMirror("stylish", "getAllKeys");
      if (keys) {
        keys = new Set(keys);
        for (const style of styleMap.values()) if (!keys.has(style.id)) {
          await sleep0();
          await execMirror("stylish", "put", style);
        }
        keys = new Set(await execMirror("settings", "getAllKeys"));
        for (const key of [ "injectionOrder" ]) if (!keys.has(key) && (val = await prefsDB.get(key))) {
          await sleep0();
          await execMirror("settings", "put", val, key);
        }
      }
    }
    const FILTER = {
      url: [ {
        schemes: [ "http", "https", "file", "chrome", "chrome-extension" ]
      } ]
    };
    const kCommitted = "committed";
    const ownPagesCommitted = {};
    let prevData = {};
    webNavigation.onCommitted.addListener(onNavigation.bind(null, kCommitted), FILTER);
    webNavigation.onHistoryStateUpdated.addListener(onNavigation.bind(null, "history"), FILTER);
    webNavigation.onReferenceFragmentUpdated.addListener(onNavigation.bind(null, "hash"), FILTER);
    async function onNavigation(navType, data) {
      const {url} = data;
      if (CHROME <= 143 && data.timeStamp === prevData.timeStamp && deepEqual(data, prevData) || data.documentLifecycle === "prerender") return;
      prevData = data;
      bgBusy && await bgBusy;
      const {tabId} = data;
      const td = tabCache[tabId];
      if (navType === kCommitted) url.startsWith(ownRoot) ? (ownPagesCommitted[url] ??= []).push(tabId) : td && delete td.patchCsp; else if (td) {
        const {frameId: f} = data;
        const {documentId: d, frameType} = data;
        sendTab(tabId, {
          method: "urlChanged",
          top: !frameType && !f || frameType === "outer_frame",
          iid: 0,
          url
        }, {
          documentId: d
        });
      }
      for (const fn of onUrlChange) fn(data, navType);
    }
    const tabCache = {
      __proto__: null
    };
    const tab_manager_set = (tabId, ...args) => {
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
      bgMortal && stateDB.put(obj0, tabId);
      return value;
    };
    const someInjectable = () => {
      for (let v in tabCache) {
        v = tabCache[v];
        if (v.styleIds || (v = v.url) && supported(v[0])) return !0;
      }
    };
    const remove = tabId => {
      delete tabCache[tabId];
      bgMortal && stateDB.delete(tabId);
    };
    const putObject = obj => stateDB.putMany(Object.values(obj), Object.keys(obj).map(Number));
    const bgMortalChanged = new Set;
    let bgMortal;
    bgInit.push(async () => {
      bgMortal = values.keepAlive >= 0;
      const numericKeys = IDBKeyRange.bound(0, 1e99);
      const [tabs, savedKeys, saved] = await Promise.all([ browser.tabs.query({}), bgMortal && stateDB.getAllKeys(numericKeys), bgMortal && stateDB.getAll(numericKeys) ]);
      let toPut;
      for (const {id, url} of tabs) {
        let data, v;
        if (!saved || (v = savedKeys.indexOf(id)) < 0 || !(data = saved[v]) || (v = data.url?.[0]) !== url || isNaN(data.id)) {
          data = {
            id,
            url: {
              0: url
            }
          };
          saved && ((toPut ??= {})[id] = data);
        }
        tabCache[id] = data;
      }
      if (bgMortal) {
        stateDB.deleteMany(savedKeys.filter(k => !tabCache[k]));
        toPut && putObject(toPut);
      }
      subscribe("keepAlive", (key, val) => {
        if (bgMortal !== (val = val >= 0)) {
          bgMortal = val;
          val ? putObject(tabCache) : stateDB.delete(numericKeys);
          for (const fn of bgMortalChanged) fn(val);
        }
      });
    });
    bgBusy.then(() => {
      onUrlChange.add(({tabId, frameId, url}, navType) => {
        let obj, oldUrl;
        if (obj = tabCache[tabId]) {
          oldUrl = obj.url?.[0];
          navType === kCommitted && obj.styleIds && (frameId ? delete obj.styleIds[frameId] : delete obj.styleIds);
        } else tabCache[tabId] = obj = {
          id: tabId
        };
        navType !== kCommitted || frameId ? (obj.url ??= {})[frameId] = url : obj.url = {
          0: url
        };
        bgMortal && stateDB.put(obj, tabId);
        if (!frameId) for (const fn of onTabUrlChange) fn(tabId, url, oldUrl);
      });
    });
    onDisconnect.apply = port => {
      ignoreChromeError();
      const {sender} = port;
      const tabId = sender.tab?.id;
      const frameId = sender.frameId;
      if (tabId != null && frameId) for (const fn of onUnload) fn(tabId, frameId, port);
    };
    chrome.tabs.onCreated.addListener(() => {});
    chrome.tabs.onRemoved.addListener(async tabId => {
      bgBusy && await bgBusy;
      remove(tabId);
      for (const fn of onUnload) fn(tabId, 0);
    });
    const FILENAME = "offscreen.html";
    const DOC_URL = ownRoot + FILENAME;
    const background_offscreen = createPortProxy(() => creating ??= offscreen_create().finally(done), {
      lock: "/" + FILENAME
    });
    let creating;
    async function findOffscreenClient() {
      for (const c of await getWindowClients()) if (c.url === DOC_URL) return c;
    }
    async function offscreen_create() {
      try {
        await chrome.offscreen.createDocument({
          url: DOC_URL,
          reasons: [ "BLOBS", "DOM_PARSER", "MATCH_MEDIA", "WORKERS" ],
          justification: "ManifestV3 requirement"
        });
      } catch (l) {
        if (!l.message.startsWith("Only a single offscreen")) throw l;
      }
      return findOffscreenClient();
    }
    function done() {
      creating = null;
    }
    const getWindowClients = () => self.clients.matchAll({
      includeUncontrolled: !0,
      type: "window"
    });
    const worker = createPortProxy(async () => {
      let proxy;
      if (!background_offscreen[CLIENT]) for (const client of await getWindowClients()) if (!clientDataJobs.has(client.url)) {
        proxy = createPortProxy(client, {
          once: !0
        });
        break;
      }
      return (proxy || background_offscreen).getWorkerPort(workerPath);
    }, {
      lock: workerPath
    });
    const rxHOST = /^('non(e|ce-.+?)'|(https?:\/\/)?[^']+?[^:'])$/;
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
    let toBroadcast;
    let toBroadcastCfg;
    let toBroadcastUpdStyles;
    const OLD = Symbol("old");
    const channel = new BroadcastChannel("sw");
    function broadcast(data, cfg) {
      toBroadcast ??= (setTimeout(doBroadcast), []);
      cfg ? toBroadcastCfg = cfg : data.method === "styleUpdated" ? (toBroadcastUpdStyles ??= new Map).set(data.style.id, data) : toBroadcast.push(data);
    }
    async function doBroadcast() {
      const [clients, tabs] = await Promise.all([ getWindowClients(), browser.tabs.query({}) ]);
      const data = toBroadcast;
      const cfg = toBroadcastCfg;
      const updStyles = toBroadcastUpdStyles;
      const assSites = cfg?.ass && optionSites.styleViaASS;
      const iframeSites = cfg?.top && optionSites.exposeIframes;
      toBroadcastCfg = toBroadcastUpdStyles = toBroadcast = null;
      cfg && data.push({
        method: "injectorConfig",
        cfg
      });
      updStyles && data.push(...updStyles.values());
      clients[0] && broadcastExtension(data, !0);
      let cnt = 0;
      let url;
      tabs.sort((a, b) => b.active - a.active);
      for (const t of tabs) {
        if (t.discarded || !(url = t.url)) continue;
        const tabOverrides = tabCache[t.id]?.tabOvr;
        const patched = tabOverrides && Object.keys(tabOverrides).length && patchStyles(updStyles, tabOverrides);
        assSites && (cfg.ass = isOptionSite(assSites, url));
        iframeSites && (cfg.top = isOptionSite(iframeSites, url));
        sendTab(t.id, data, null, !0);
        if (patched) for (const p of patched) p.enabled = p[OLD];
        if (++cnt > 50) {
          cnt = 0;
          await sleep0();
        }
      }
    }
    function broadcastExtension(data, multi) {
      channel.postMessage({
        id: 1,
        args: [ data, {}, multi, !0 ]
      });
    }
    function patchStyles(styleUpdates, tabOverrides) {
      let res, ovr, old;
      for (const {style} of styleUpdates.values()) if ((ovr = tabOverrides[style.id]) != null && ovr !== (old = style.enabled)) {
        style[OLD] = old;
        style.enabled = ovr;
        (res ??= []).push(style);
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
      } catch (l) {
        error = l;
        if (rxIgnorableError.test(err.message = l.message)) return;
      }
      error.stack && (err.stack = error.stack + "\n" + err.stack);
      if (multi) {
        console.error(err);
        return data;
      }
      return Promise.reject(err);
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
    let color_scheme_timer;
    chrome.alarms.onAlarm.addListener(async ({name}) => {
      if (name === kSTART || name === kEND) {
        prefState || await ready;
        updateTimePreferDark();
      }
    });
    bgPreInit.push(stateDB.get("dark").then(val => {
      saved = +val;
      if (typeof val == "number") {
        notified = isDark = !!(val & 1);
        map[kSystem] ??= !!(val & 2);
        color_scheme_update();
      }
    }));
    subscribe("schemeSwitcher.enabled", (l, val) => {
      prefState = val;
      if (val === kTime) subscribe([ kSTART, kEND ], onNightChanged, !0); else {
        unsubscribe([ kSTART, kEND ], onNightChanged);
        chrome.alarms.clear(kSTART);
        chrome.alarms.clear(kEND);
      }
      color_scheme_update();
    }, !0);
    function themeAllowsStyle({preferScheme: ps}) {
      return prefState === kNever || ps !== "dark" && ps !== kLight || isDark === (ps === "dark");
    }
    function calcTime(key) {
      const [h, m] = values[key].split(":");
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
      if (force !== !0) return debounce(onNightChanged, 0, !0);
      updateTimePreferDark();
      createAlarm(kSTART, values[kSTART]);
      createAlarm(kEND, values[kEND]);
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
        type === kSystem && (color_scheme_timer ??= setTimeout(writeState));
        map[type] = val;
        if (!prefState) return;
      }
      if (isDark !== (val = map[prefState])) {
        isDark = val;
        isDark !== notified && saved != null && debounce(notify, 100);
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
    async function writeState() {
      bgBusy && await bgBusy;
      const val = (isDark ? 1 : 0) + (map[kSystem] ? 2 : 0);
      saved !== val && stateDB.put(saved = val, "dark");
      color_scheme_timer = null;
    }
    let initialized;
    async function reinjectContentScripts(targetTab) {
      const ALL_URLS = "<all_urls>";
      const SCRIPTS = MF.content_scripts;
      const globToRe = (s, re = ".") => stringAsRegExpStr(s.replace(/\*/g, "\n")).replace(/\n/g, re + "*?");
      if (!initialized) {
        initialized = !0;
        for (const cs of SCRIPTS) (cs[ALL_URLS] = cs.matches.includes(ALL_URLS)) || cs.matches.forEach((m, i) => {
          const [, scheme, host, path] = m.match(/^([^:]+):\/\/([^/]+)\/(.*)/);
          cs.matches[i] = new RegExp(`^${scheme === "*" ? "https?" : scheme}://${globToRe(host, "[^/]")}/${globToRe(path)}$`);
        });
      }
      targetTab || await sleep0();
      for (const tab of targetTab ? [ targetTab ] : await browser.tabs.query({})) {
        const url = tab.pendingUrl || tab.url;
        const res = tab.width && !tab.discarded && supported(url) && await injectToTab(tab.id, url, targetTab);
        if (targetTab) return res && res[0] && !res[0].message && res[0].frameId === 0;
      }
      async function injectToTab(tabId, url, targeted) {
        const jobs = [];
        tab_manager_set(tabId, "url", 0, url);
        if (targeted || !await sendTab(tabId, {
          method: "backgroundReady"
        })) {
          for (const cs of SCRIPTS) (cs[ALL_URLS] || cs.matches.some(url.match, url)) && jobs.push(chrome.scripting.executeScript({
            injectImmediately: cs.run_at === "document_start",
            target: {
              allFrames: cs.all_frames,
              tabId
            },
            files: cs.js
          }).catch(NOP));
          return Promise.all(jobs);
        }
      }
    }
    const TO_CSS = {
      domains: "domain",
      urlPrefixes: "url-prefix",
      urls: "url",
      regexps: "regexp"
    };
    const RX_META1 = /\/\*!?\s*==userstyle==/gi;
    const RX_META2 = /(==\/userstyle==\s*)?\*\//gi;
    const STYLE_CODE_EMPTY_RE = /\s+|\/\*([^*]+|\*(?!\/))*(\*\/|$)|@namespace[^;]+;|@charset[^;]+;/iuy;
    function styleCodeEmpty(sec) {
      const {code} = sec;
      let res = !code;
      if (res || (res = sec._empty) != null) return res;
      const len = code.length;
      const rx = STYLE_CODE_EMPTY_RE;
      rx.lastIndex = 0;
      let i = 0;
      for (;rx.exec(code) && (i = rx.lastIndex) !== len; ) ;
      Object.defineProperty(sec, "_empty", {
        value: res = i === len,
        configurable: !0
      });
      styleCodeEmpty.lastIndex = i;
      return res;
    }
    function styleSectionsEqual({sections: a}, {sections: b}) {
      return a && b && a.length === b.length && a.every(sameSection, b);
    }
    function sameSection(secA, i) {
      const secB = this[i];
      if (equalOrEmpty(secA.code, secB.code, !0)) {
        for (const target in TO_CSS) if (!equalOrEmpty(secA[target], secB[target], !1)) return;
        return !0;
      }
    }
    function equalOrEmpty(a, b, isStr) {
      const typeA = isStr ? typeof a == "string" : Array.isArray(a);
      const typeB = isStr ? typeof b == "string" : Array.isArray(b);
      return typeA && typeB && (isStr ? a === b : a.length === b.length && arrayEquals(a, b)) || (a == null || typeA && !a.length) && (b == null || typeB && !b.length);
    }
    function arrayEquals(a, b) {
      return a.every(thisIncludes, b) && b.every(thisIncludes, a);
    }
    function thisIncludes(el) {
      return this.includes(el);
    }
    async function calcStyleDigest(style) {
      const src = style.usercssData ? style.sourceCode : JSON.stringify((style.sections || []).map(section => ({
        code: section.code || "",
        urls: section.urls || [],
        urlPrefixes: section.urlPrefixes || [],
        domains: section.domains || [],
        regexps: section.regexps || []
      })));
      const srcBytes = (new TextEncoder).encode(src);
      const res = await crypto.subtle.digest("SHA-1", srcBytes);
      return Array.from(new Uint8Array(res), b => (256 + b).toString(16).slice(1)).join("");
    }
    function styleJSONseemsValid(json) {
      return json && typeof json.name == "string" && json.name.trim() && Array.isArray(json.sections) && typeof json.sections[0]?.code == "string";
    }
    function getMetaComment(str, action) {
      let a, b, res;
      let i = 0;
      for (;(RX_META1.lastIndex = i, a = RX_META1.exec(str)) && (RX_META2.lastIndex = RX_META1.lastIndex, 
      b = RX_META2.exec(str)); ) {
        i = RX_META2.lastIndex;
        if (b[1]) break;
      }
      if (action === "del") res = a && b?.[1] ? str.slice(0, a.index) + str.slice(i) : str; else if (a && b && (b = b[1])) if (action === "?") res = !0; else {
        a = a.index;
        res = str.slice(a, i);
        action === "match" && ((res = [ res ]).index = a);
      }
      return res || "";
    }
    var i = 0, reverseDict = {}, fromCharCode = String.fromCharCode, base = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+", Base64CharArray = (base + "/=").split(""), UriSafeCharArray = (base + "-$").split("");
    for (;i < 65; ) {
      i > 62 && (reverseDict[UriSafeCharArray[i].charCodeAt(0)] = i);
      reverseDict[Base64CharArray[i].charCodeAt(0)] = i++;
    }
    function _decompress(length, resetBits, getNextValue) {
      var c, dictionary = [ 0, 1, 2 ], enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], w = "", bits = 0, maxpower = 2, power = 0, data_val = getNextValue(0), data_position = resetBits, data_index = 1;
      for (;power != maxpower; ) {
        bits += (data_val >> --data_position & 1) << power++;
        if (data_position == 0) {
          data_position = resetBits;
          data_val = getNextValue(data_index++);
        }
      }
      if (bits == 2) return "";
      maxpower = bits * 8 + 8;
      bits = power = 0;
      for (;power != maxpower; ) {
        bits += (data_val >> --data_position & 1) << power++;
        if (data_position == 0) {
          data_position = resetBits;
          data_val = getNextValue(data_index++);
        }
      }
      c = fromCharCode(bits);
      dictionary[3] = c;
      w = c;
      result.push(c);
      for (;data_index <= length; ) {
        maxpower = numBits;
        bits = power = 0;
        for (;power != maxpower; ) {
          bits += (data_val >> --data_position & 1) << power++;
          if (data_position == 0) {
            data_position = resetBits;
            data_val = getNextValue(data_index++);
          }
        }
        if (bits < 2) {
          maxpower = 8 + 8 * bits;
          bits = power = 0;
          for (;power != maxpower; ) {
            bits += (data_val >> --data_position & 1) << power++;
            if (data_position == 0) {
              data_position = resetBits;
              data_val = getNextValue(data_index++);
            }
          }
          dictionary[dictSize] = fromCharCode(bits);
          bits = dictSize++;
          --enlargeIn == 0 && (enlargeIn = 1 << numBits++);
        } else if (bits == 2) return result.join("");
        if (bits > dictionary.length) return null;
        entry = bits < dictionary.length ? dictionary[bits] : w + w.charAt(0);
        result.push(entry);
        dictionary[dictSize++] = w + entry.charAt(0);
        w = entry;
        --enlargeIn == 0 && (enlargeIn = 1 << numBits++);
      }
      return "";
    }
    const syncApi = browser.storage.sync;
    const kMAX = "MAX_WRITE_OPERATIONS_PER_MINUTE";
    const chrome_sync_get = syncApi.get.bind(syncApi);
    const chrome_sync_set = async function(...args) {
      for (;;) try {
        if (!chrome_sync_busy) return await (chrome_sync_busy = this.apply(syncApi, args));
        await chrome_sync_busy.catch(() => 0);
      } catch (l) {
        if (!l.message.includes(kMAX)) throw l;
        chrome_sync_busy = sleep(6e4 / (syncApi[kMAX] || 120) * (Math.random() * 2 + 1));
        await global.keepAlive(chrome_sync_busy);
      } finally {
        chrome_sync_busy = null;
      }
    }.bind(syncApi.set);
    const getLZValue = async key => {
      return val = (await chrome_sync_get(key))[key], tryJSONparse((compressed = val) == null ? "" : compressed == "" ? null : _decompress(compressed.length, 15, index => compressed.charCodeAt(index) - 32));
      var val, compressed;
    };
    let chrome_sync_busy;
    const DNR_ID_IDENTITY = 1e6;
    const DNR_ID_INSTALLER = 1;
    const DNR = chrome.declarativeNetRequest;
    const updateDynamicRules = updateDNR.bind(DNR.updateDynamicRules);
    const updateSessionRules = updateDNR.bind(DNR.updateSessionRules);
    const getRuleId = r => r.id;
    const getRuleIds = rules => rules.map(getRuleId);
    function updateDNR(addRules, removeRuleIds = getRuleIds(addRules)) {
      return this({
        addRules,
        removeRuleIds
      });
    }
    const REVOKE_TIMEOUT = 1e4;
    const kRuleIds = "ruleIds";
    const kSetCookie = "set-cookie";
    const rxNONCE = /(?:^|[;,])\s*style-src\s+[^;,]*?'nonce-([-+/=\w]+)'/;
    const BLOB_URL_PREFIX = "blob:" + ownRoot;
    const WR_FILTER = {
      urls: [ "*://*/*" ],
      types: [ "main_frame", "sub_frame" ]
    };
    const makeBlob = data => new Blob([ JSON.stringify(data) ], {
      type: "application/json"
    });
    const makeXhrCookie = blobId => `${ownId}=${blobId}; SameSite=Lax`;
    const req2key = req => req.tabId + ":" + req.frameId;
    const revokeObjectURL = blobId => blobId && background_offscreen.revokeObjectURL(BLOB_URL_PREFIX + blobId);
    const toSend = {};
    const ruleIdKeys = {};
    let ruleIds;
    let curOFF = !0;
    let flushPending;
    setup();
    bgPreInit.push((async () => {
      ruleIds = await stateDB.get(kRuleIds) || {};
      for (const id in ruleIds) ruleIdKeys[ruleIds[id]] = +id;
    })());
    bgBusy.then(() => setTimeout(() => {
      subscribe("styleViaXhr", (key, val) => {
        (val || background_offscreen[CLIENT]) && background_offscreen.keepAlive(val);
      }, !0);
    }, clientDataJobs.size ? 1e3 : 0));
    subscribe("disableAll", setup, !0);
    bgBusy.then(() => {
      const tabIds = [];
      for (let key in ruleIdKeys) tabCache[key = parseInt(key)] || tabIds.push(key);
      tabIds.length && removeTabData(tabIds);
    });
    onUnload.add((tabId, frameId, port) => {
      const key = tabId + ":" + frameId;
      const data = toSend[key];
      if (data) data.timer = setTimeout(removePreloadedStyles, REVOKE_TIMEOUT, null, key); else if (frameId && tabCache[tabId]?.styleIds) {
        updateIconBadge.call(port, [], !0);
        frameId || removeTabData([ tabId ]);
      }
    });
    webNavigation.onErrorOccurred.addListener(removePreloadedStyles, {
      url: [ {
        urlPrefix: "http"
      } ]
    });
    chrome.webRequest.onBeforeRequest.addListener(req => {
      dataHub.set("popup", req.tabId < 0 && makePopupData());
    }, {
      urls: [ actionPopupUrl ],
      types: [ "main_frame" ]
    });
    async function setup(l, OFF) {
      if (curOFF !== OFF) {
        curOFF = OFF;
        toggleListener(chrome.webRequest.onBeforeRequest, !OFF, prepareStyles, WR_FILTER);
        toggleListener(chrome.webRequest.onHeadersReceived, !OFF, modifyHeaders, WR_FILTER, !OFF && [ "responseHeaders", (WRBTest ? await WRBTest : WRB) && "blocking", chrome.webRequest.OnHeadersReceivedOptions.EXTRA_HEADERS ].filter(Boolean));
      }
    }
    async function prepareStyles(req) {
      const init = bgBusy;
      init && await init;
      let v;
      const {tabId, frameId, url} = req;
      const key = tabId + ":" + frameId;
      const xhrOn = values.styleViaXhr && (!(v = optionSites.styleViaXhr) || isOptionSite(v, url));
      xhrOn && prefState === kSystem && !someInjectable() && await (prefState === kSystem && background_offscreen.isDark().then(setSystemDark));
      if (tabId < 0 || init) return;
      const oldData = toSend[key];
      const data = oldData || {};
      const payload = getSectionsByUrl.call({
        sender: req
      }, url, {
        init: "styleViaXhr"
      });
      const samePayload = oldData && deepEqual(payload, data.payload);
      const willStyle = payload.sections.length;
      data.payload = payload;
      data.url = url;
      samePayload ? data.timer = clearTimeout(data.timer) : oldData && removePreloadedStyles(null, key, data, willStyle);
      toSend[key] = data;
      if (!xhrOn || !willStyle) return;
      let blobId;
      if (!samePayload) for (const k in toSend) {
        if (key === k) continue;
        const val = toSend[k];
        if (val.url === url && deepEqual(payload, val.payload)) {
          clearTimeout(val.timer);
          val.timer = setTimeout(removeTemporaryTab, REVOKE_TIMEOUT, tabId);
          Object.assign(payload, val.payload);
          blobId = val.blobId;
          break;
        }
      }
      blobId || (blobId = (await background_offscreen.createObjectURL(makeBlob(payload))).slice(BLOB_URL_PREFIX.length));
      data.blobId = blobId;
      const cookie = makeXhrCookie(blobId);
      let {ruleId = 0} = data;
      if (!ruleId) {
        for (;++ruleId in ruleIds; ) ;
        data.ruleId = ruleId;
      }
      ruleIds[ruleId] = key;
      ruleIdKeys[key] = ruleId;
      flushPending ??= setTimeout(flushState);
      await updateSessionRules([ {
        id: ruleId,
        condition: {
          tabIds: [ tabId ],
          urlFilter: "|" + url + "|",
          resourceTypes: [ frameId ? "sub_frame" : "main_frame" ],
          excludedResponseHeaders: [ {
            header: "content-type",
            values: [ "*/xml*" ]
          } ]
        },
        action: {
          type: "modifyHeaders",
          responseHeaders: [ {
            header: kSetCookie,
            value: cookie,
            operation: "append"
          } ]
        }
      } ]);
    }
    function modifyHeaders(req) {
      const key = req2key(req);
      const data = toSend[key];
      if (!data) return;
      let v;
      const {responseHeaders} = req;
      const {payload} = data;
      const styled = payload.sections.length;
      const cspOn = values.patchCsp && (!(v = optionSites.patchCsp) || isOptionSite(v, req.url));
      let csp = cspOn && findHeader(responseHeaders, "content-security-policy");
      if (csp) {
        const m = (v = csp.value).match(rxNONCE);
        m && tab_manager_set(req.tabId, "nonce", req.frameId, payload.cfg.nonce = m[1]);
        csp = cspOn && styled && (csp.value = patchCsp(v));
      }
      if (!styled) {
        removePreloadedStyles(req, key, data);
        return;
      }
      let blobId;
      if (values.styleViaXhr && (!(v = optionSites.styleViaXhr) || isOptionSite(v, req.url)) && (blobId = data.blobId ??= !1)) {
        blobId = makeXhrCookie(blobId);
        findHeader(responseHeaders, kSetCookie, blobId) ? blobId = !1 : responseHeaders.push({
          name: kSetCookie,
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
          req ? setTimeout(revokeObjectURL, REVOKE_TIMEOUT, v) : revokeObjectURL(v);
          data.blobId = "";
        }
        (v = data.timer) && (data.timer = clearTimeout(v));
      }
      if (!keep && (data ? ruleIds[v = data.ruleId] : v = ruleIdKeys[key])) {
        delete ruleIds[v];
        delete ruleIdKeys[key];
        flushPending ??= setTimeout(flushState);
        updateSessionRules(void 0, [ v ]);
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
        updateSessionRules(void 0, ids);
        flushPending ??= setTimeout(flushState);
      }
      for (const key in toSend) tabIds.test(key) && removePreloadedStyles(null, key);
    }
    async function removeTemporaryTab(tabId) {
      try {
        await chrome.tabs.get(tabId);
      } catch {
        remove(tabId);
        removeTabData([ tabId ]);
      }
    }
    function findHeader(headers, name, value) {
      for (const h of headers) if (h.name.toLowerCase() === name && (value == null || h.value === value)) return h;
    }
    function flushState() {
      flushPending = null;
      isEmptyObj(ruleIds) ? stateDB.delete(kRuleIds) : stateDB.put(ruleIds, kRuleIds);
    }
    const staleBadges = new Set;
    const imageDataCache = {};
    const badgeOvr = {
      color: "",
      text: ""
    };
    const ICON_SIZES = [ 16, 32 ];
    const kBadgeDisabled = "badgeDisabled";
    const kBadgeNormal = "badgeNormal";
    const kIconset = "iconset";
    const kShowBadge = "show-badge";
    let hasCanvas = null;
    if (browserAction) {
      bgInit.push(initIcons);
      if (browserSidebar) {
        try {
          toggleListener(browserAction.onClicked, !0, openPopupInSidebar);
        } catch (l) {
          console.error(l);
        }
        subscribe("popup.sidePanel", (key, val) => {
          try {
            browserAction.setPopup({
              popup: val ? "" : "popup.html"
            });
            toggleListener(browserAction.onClicked, val, openPopupInSidebar);
          } catch (l) {
            console.error(l);
          }
        }, !0);
      }
    }
    onSchemeChange.add(() => {
      if (values[kIconset] === -1) {
        debounce(refreshGlobalIcon);
        debounce(refreshAllIcons);
      }
    });
    async function refreshIconsWhenReady() {
      if (browserAction) {
        if (bgBusy) {
          bgInit[bgInit.indexOf(initIcons)] = 0;
          await bgBusy;
        }
        initIcons(!0);
      }
    }
    function initIcons(runNow = !1) {
      subscribe([ "disableAll", kBadgeDisabled, kBadgeNormal ], () => debounce(refreshIconBadgeColor), runNow);
      subscribe([ kShowBadge ], () => debounce(refreshAllIconsBadgeText), runNow);
      subscribe([ "disableAll", kIconset ], () => debounce(refreshAllIcons), runNow);
    }
    function updateIconBadge(styleIds, lazyBadge, iid) {
      const {tab: {id: tabId}, TDM} = this.sender;
      const frameId = TDM > 0 ? 0 : this.sender.frameId;
      const value = styleIds.length ? styleIds.map(Number) : void 0;
      if (tabId != null) {
        tab_manager_set(tabId, "styleIds", frameId, value);
        iid && tab_manager_set(tabId, "iid", frameId, value && iid);
        debounce(refreshStaleBadges, frameId && lazyBadge ? 250 : 0);
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
        browserAction.setTitle({
          title: title && t(title, "", !1) || title || ""
        }).catch(NOP);
      }
    }
    function refreshIconBadgeText(tabId) {
      badgeOvr.text || setBadgeText({
        tabId,
        text: values[kShowBadge] ? `${getStyleCount(tabId)}` : ""
      });
    }
    function getIconName(hasStyles = !1) {
      const i = values[kIconset];
      return `${i === 0 || i === -1 && isDark ? "" : "light/"}$SIZE$${values.disableAll ? "x" : hasStyles ? "" : "w"}`;
    }
    function refreshIcon(tabId, force = !1) {
      const td = tabCache[tabId] ??= {
        id: tabId
      };
      const oldIcon = td.icon;
      const newIcon = getIconName(td.styleIds?.[0]);
      if (force || oldIcon !== newIcon) {
        tab_manager_set(tabId, "icon", newIcon);
        setIcon({
          path: getIconPath(newIcon),
          tabId
        });
      }
    }
    function getIconPath(icon) {
      return ICON_SIZES.reduce((obj, size) => {
        obj[size] = MF_ICON_PATH + icon.replace("$SIZE$", size) + MF_ICON_EXT;
        return obj;
      }, {});
    }
    function getStyleCount(tabId) {
      const allIds = new Set;
      for (const frameData of Object.values(tabCache[tabId]?.styleIds || {})) frameData.forEach(allIds.add, allIds);
      return allIds.size || "";
    }
    async function loadImage(url) {
      const img = await createImageBitmap(await (await fetch(url)).blob());
      const {width: w, height: h} = img;
      const result = paintCanvas(w, h, ctx => ctx.drawImage(img, 0, 0, w, h));
      imageDataCache[url] = result;
      return result;
    }
    function openPopupInSidebar(tab) {
      openSidebar("popup.html?sidebar", !1, {
        tabId: tab.id
      });
    }
    function refreshGlobalIcon() {
      setIcon({
        path: getIconPath(getIconName())
      });
    }
    function refreshIconBadgeColor() {
      browserAction.setBadgeBackgroundColor({
        color: badgeOvr.color || values[values.disableAll ? kBadgeDisabled : kBadgeNormal]
      }).catch(NOP);
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
        const url = MF_ICON_PATH + ICON_SIZES[0] + MF_ICON_EXT;
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
      browserAction.setIcon(data).catch(NOP);
    }
    function setBadgeText(data) {
      browserAction.setBadgeText(data).catch(NOP);
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
      subscribe(Object.keys(INJECTOR_CONFIG_MAP), broadcastInjectorConfig);
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
    const styleMap = new Map;
    const stylePreviewMap = new Map;
    const order = {
      main: {},
      prio: {}
    };
    const orderWrap = {
      id: "injectionOrder",
      value: mapObj(order, () => []),
      _id: `${chrome.runtime.id}-injectionOrder`,
      _rev: 0
    };
    function calcRemoteId({md5Url, updateUrl, usercssData: ucd} = {}) {
      let id;
      id = (id = /\d+/.test(md5Url) || extractUsoaId(updateUrl)) && `uso-${id}` || (id = extractUswId(updateUrl)) && `usw-${id}` || "";
      return id && [ id, !!ucd?.vars ];
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
      const groups = data?.value;
      if (groups && !deepEqual(groups, orderWrap.value)) {
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
      const match = text.match(slashed ? RX_MAYBE_REGEXP : GLOB_RE);
      return match ? slashed ? match : "^" + (match[1] === "*" ? "[\\w-]+" : match[1]) + "://" + (match[2] ? "(?:[\\w.]+\\.)?" : "") + globAsRegExpStr(match[3]) + "$" : "^" + globAsRegExpStr(text) + "$";
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
      +what && (what = styleMap.get(what));
      if (!what) return "";
      url = {
        url
      };
      const inc = what.inclusions?.filter(urlMatchOverride, url).join("\n+");
      const exc = what.exclusions?.filter(urlMatchOverride, url).join("\n-");
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
      let dd, ddL, pp, ppL, rr, rrL, uu, uuL;
      return !!((dd = section.domains) && (ddL = dd.length) && dd.some(urlMatchDomain, query) || (pp = section.urlPrefixes) && (ppL = pp.length) && pp.some(urlMatchPrefix, query) || (uu = section.urls) && (uuL = uu.length) && (uu.includes(query.url) || uu.includes(query.urlWithoutHash ??= query.url.split("#", 1)[0])) || (rr = section.regexps) && (rrL = rr.length) && rr.some(urlMatchRegexp, query)) || (rrL && rr.some(urlMatchRegexpSloppy, query) ? "sloppy" : !(rrL || ppL || uuL || ddL || (query.isOwnPage ??= query.url.startsWith(ownRoot)) || skipEmptyGlobal && styleCodeEmpty(section)));
    }
    function urlMatchDomain(d) {
      const l = this.domain ??= tryURL(this.url).hostname;
      return d === l || l[l.length - d.length - 1] === "." && l.endsWith(d);
    }
    function urlMatchOverride(e) {
      return (cache.get(e) || compile(buildOverrideRe(e))).test(this.urlWithoutParams ??= this.url.split(/[?#]/, 1)[0]);
    }
    function urlMatchPrefix(p) {
      return p && this.url.startsWith(p);
    }
    function urlMatchRegexp(r) {
      return (!(this.isOwnPage ??= this.url.startsWith(ownRoot)) || EXT_RE.test(r)) && (cache.get(r) || compile(`^(${r})$`)).test(this.url);
    }
    function urlMatchRegexpSloppy(r) {
      return (!(this.isOwnPage ??= this.url.startsWith(ownRoot)) || EXT_RE.test(r)) && (cache.get(r) || compile(`^${r}$`)).test(this.url);
    }
    const MAX = 1e3;
    const entries = new Map;
    function add(url, val) {
      entries.delete(url);
      entries.set(url, val);
      entries.size >= MAX && prune();
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
        if ((!style.enabled || !themeAllowsStyle(style) || (v = style.exclusions) && v.length && v.some(urlMatchOverride, query) || (v = style.inclusions) && v.length && !(isIncluded = v.some(urlMatchOverride, query)) && style.overridden) && !(forced = tabOvr?.[id])) cache.delete(id); else {
          v = [];
          for (const section of style.sections) !isIncluded && urlMatchSection(query, section) !== !0 || styleCodeEmpty(section) || v.push(section.code);
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
      for (const entry of entries.values()) removed ? entry.delete(id) : (entry.maybe ??= new Set).add(id);
    }
    function prune() {
      let num = entries.size / 10;
      for (const url of entries.keys()) {
        entries.delete(url);
        if (--num <= 0) break;
      }
    }
    const MISSING_PROPS = {
      name: style => `ID: ${style.id}`,
      _id: crypto.randomUUID?.bind(crypto) || !1
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
        if (v == null || typeof v == "object" && isEmptyObj(v)) {
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
      if ((!style.url || !style.installationUrl) && (v = style.updateUrl) && (v = makeInstallUrl(v) || (v = /\d+/.exec(style.md5Url)) && `${uso}styles/${v[0]}`)) {
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
        skip || await sleep(50);
        (skip = !(style = styleMap.get(id))) || rev !== style._rev && !inferHomepage(style) || await save(style, !1, void 0, !0);
      }
    }
    function onBeforeSave(style) {
      style.id || delete style.id;
      return fixKnownProblems(style);
    }
    function onSaved(style, reason, id = style.id, msg) {
      const isNew = !styleMap.has(id);
      style.id ??= id;
      storeInMap(style);
      reason !== !1 ? broadcastStyleUpdated(style, reason, isNew, msg) : updateSections(id);
      reason !== "sync" && putDoc(style);
      return style;
    }
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
        authURL: usw + "api/oauth/style/link",
        tokenURL: usw + "api/oauth/token",
        redirect_uri: "https://gusted.xyz/callback_helper/"
      }
    };
    const NETWORK_LATENCY = 30;
    const DEFAULT_REDIRECT_URI = "https://clngdbkpkpeebahjckkjfobafhncgmne.chromiumapp.org/";
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
      const obj = await chromeLocal.get(k.LIST);
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
        const token = await chromeLocal.getValue(k.TOKEN);
        token && await provider.revoke(token);
      } catch (l) {
        console.error(l);
      }
      await chromeLocal.remove(k.LIST);
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
      const redirectUri = provider.redirect_uri || DEFAULT_REDIRECT_URI;
      const query = {
        response_type: provider.flow,
        client_id: provider.clientId,
        redirect_uri: redirectUri,
        state
      };
      provider.scopes && (query.scope = provider.scopes.join(" "));
      provider.authQuery && Object.assign(query, provider.authQuery);
      hooks?.query(query);
      const url = `${provider.authURL}?${new URLSearchParams(query)}`;
      const finalUrl = await authUserMV3(url, interactive, redirectUri);
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
    async function authUserMV3(url, interactive, redirectUri) {
      const apiUrl = chrome.identity.getRedirectURL();
      apiUrl !== redirectUri && await updateSessionRules([ {
        id: DNR_ID_IDENTITY,
        condition: {
          urlFilter: "|" + redirectUri,
          resourceTypes: [ "main_frame" ]
        },
        action: {
          type: "redirect",
          redirect: {
            transform: {
              host: getHost(apiUrl)
            }
          }
        }
      } ]);
      try {
        return await chrome.identity.launchWebAuthFlow({
          interactive,
          url
        });
      } finally {
        redirectUri && await updateSessionRules(void 0, [ DNR_ID_IDENTITY ]);
      }
    }
    async function handleTokenResult(result, k) {
      await chromeLocal.set({
        [k.TOKEN]: result.access_token,
        [k.EXPIRE]: result.expires_in ? Date.now() + 1e3 * (result.expires_in - NETWORK_LATENCY) : void 0,
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
    const SYNC_DELAY = 1;
    const SYNC_INTERVAL = 30;
    const sync_manager_STORAGE_KEY = "sync/state/";
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
    let resolveOnSync;
    let scheduling;
    let starting;
    let syncingNow;
    chrome.alarms.onAlarm.addListener(async a => {
      if (a.name === ALARM_ID) {
        bgBusy && await bgBusy;
        global.keepAlive(syncNow());
      }
    });
    subscribe(PREF_ID, schedule, !0);
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
      } catch (l) {
        sync_manager_status.login = !1;
        throw l;
      } finally {
        emitStatusChange();
      }
    }
    async function putDoc({_id: l, _rev: y}) {
      delayedInit && await start();
      if (curDrive) {
        schedule();
        return ctrl.put(l, y);
      }
    }
    async function getDriveOptions(driveName) {
      const key = `secure/sync/driveOptions/${driveName}`;
      return (await chrome_sync_get(key))[key] || {};
    }
    function start(name = delayedInit) {
      return starting ??= doStart(name).finally(() => {
        starting = null;
      });
    }
    async function doStart(name) {
      const isInit = name && name === delayedInit;
      const isStop = sync_manager_status.state === "disconnecting";
      delayedInit = !1;
      (ctrl ??= dbToCloud({
        onGet: l => getByUuid(l) || uuidIndex.custom[l] || Promise.reject("No such style UUID: " + l),
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
        onDelete(l, rev) {
          const id = uuidIndex.get(l);
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
        getState: drive => chromeLocal.getValue(sync_manager_STORAGE_KEY + drive.name),
        setState: (drive, state) => chromeLocal.set({
          [sync_manager_STORAGE_KEY + drive.name]: state
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
        } catch (l) {
          console.error(l);
          setError(l);
          emitStatusChange();
          return stop();
        }
        await ctrl.init();
        if (!isStop) {
          await syncNow();
          set(PREF_ID, name);
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
          await chromeLocal.remove(sync_manager_STORAGE_KEY + curDriveName);
        } catch {}
        curDrive = curDriveName = null;
        set(PREF_ID, "none");
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
          } catch (l) {
            l.message = translateErrorMessage(l);
            setError(l);
            isGrantError(l) && (sync_manager_status.login = !1);
          }
          if (resolveOnSync) {
            resolveOnSync();
            resolveOnSync = null;
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
        title: sync_manager_status.login ? `${t("syncError")}\n---------------------\n${lastError.message.replace(/.{60,}?\s(?=.{30,})/g, "$&\n")}` : "syncErrorRelogin"
      };
      var err;
    }
    async function getDrive(name) {
      if (!hasOwn(cloudDrive, name)) throw new Error(`Unknown cloud provider: ${name}`);
      const opts = await getDriveOptions(name);
      const webdav = name === "webdav";
      if (webdav && !tryURL(opts.url)) {
        set(PREF_ID, "none");
        throw new Error("Broken options: WebDAV server URL is missing");
      }
      webdav || (opts.getAccessToken = () => getToken(name));
      return cloudDrive[name](opts);
    }
    async function schedule(prefKey, prefVal = curDriveName, isInit) {
      if (scheduling) return;
      scheduling = !0;
      const alarm = isInit && await browser.alarms.get(ALARM_ID);
      delayedInit = hasOwn(cloudDrive, prefVal) && prefVal;
      if (delayedInit) {
        if (!alarm || Math.abs((alarm.periodInMinutes || 1e99) - SYNC_INTERVAL) > 1e-6 || ((alarm.scheduledTime - Date.now()) / 6e4 + SYNC_INTERVAL) % SYNC_INTERVAL > (isInit ? SYNC_INTERVAL : SYNC_DELAY)) {
          chrome.alarms.create(ALARM_ID, {
            delayInMinutes: isInit ? SYNC_INIT_DELAY : SYNC_DELAY,
            periodInMinutes: SYNC_INTERVAL
          });
          resolveOnSync || global.keepAlive(new Promise(cb => resolveOnSync = cb));
        }
      } else {
        sync_manager_status.state = "disconnected";
        alarm && chrome.alarms.clear(ALARM_ID);
        (isInit || prefVal === "none") && emitStatusChange();
      }
      scheduling = !1;
    }
    function setError(err) {
      sync_manager_status.errorMessage = err?.message;
      lastError = err;
    }
    function translateErrorMessage(err) {
      return err.name === "LockError" ? t("syncErrorLock", new Date(err.expire).toLocaleString([], {
        timeStyle: "short"
      })) : err.message || JSON.stringify(err);
    }
    const HAS_OPENER = !!browserWindows;
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
      if (newWindow && browserWindows) return (await browserWindows.create(Object.assign({
        url
      }, newWindow))).tabs[0];
      tab = await getActiveTab() || {
        url: ""
      };
      if (tab && EMPTY_TAB.includes((tab.pendingUrl || tab.url || "").replace("edge://", "chrome://")) && (!tab.incognito || !url.startsWith("chrome"))) return activateTab(tab, {
        url,
        openerTabId
      });
      const id = openerTabId ?? tab.id;
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
      await Promise.all([ browser.tabs.update(tab.id, options), browserWindows?.update(tab.windowId, {
        focused: !0
      }).catch(NOP), index != null && browser.tabs.move(tab.id, {
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
    const jobs = {};
    const callAbort = (ctl, url) => ctl.abort("Timeout fetching " + url);
    function download(url, params = {}) {
      const key = arguments[1] ? url + "\0" + JSON.stringify(params) : url;
      const job = jobs[key] ??= {
        req: global.keepAlive(doDownload(url, params, key))
      };
      if (params.port) {
        const ports = job.ports || (job.ports = new Set);
        const p = chrome.runtime.connect({
          name: params.port
        });
        p.onDisconnect.addListener(() => {
          ignoreChromeError();
          ports.delete(p);
        });
        ports.add(p);
      }
      return job.req;
    }
    async function doDownload(url, {method = "GET", body, responseType = "text", requiredStatusCode = 200, timeout = 6e4, loadTimeout = 12e4, headers, responseHeaders, port, ...opts}, jobKey) {
      let abort, data, timer, usoVars;
      try {
        if (url.startsWith(uso) && url.includes("?")) {
          const i = url.indexOf("?");
          if (body == null) {
            method = "POST";
            body = url.slice(i);
            url = url.slice(0, i);
          } else method === "GET" && url.length >= 2e3 && url.startsWith(usoJson) && (url = collapseUsoVars(usoVars = [], url, i));
          headers ??= {
            "content-type": "application/x-www-form-urlencoded"
          };
        }
        const resp = await fetch(url, {
          ...opts,
          body,
          method,
          headers,
          signal: timeout ? (abort = new AbortController, timer = setTimeout(callAbort, timeout, abort, url), 
          abort.signal) : null
        });
        timer && clearTimeout(timer);
        timer = loadTimeout && setTimeout(callAbort, loadTimeout, abort, url);
        if (requiredStatusCode && resp.status !== requiredStatusCode && !url.startsWith("file:")) throw new Error(`Bad status code ${resp.status} for ${url}`);
        if (port) {
          data = "";
          for await (const value of resp.body.pipeThrough(new TextDecoderStream)) reportProgress(jobKey, [ (data += value).length ]);
        } else data = await resp[responseType === "arraybuffer" ? "arrayBuffer" : responseType]();
        data && usoVars && (data = expandUsoVars(usoVars, url, data));
        responseHeaders && (data = {
          response: data,
          headers: extractHeaders(resp, responseHeaders)
        });
        return data;
      } finally {
        timer && clearTimeout(timer);
        jobs[jobKey].ports?.forEach(p => p.disconnect());
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
      const json = isText && tryJSONparse(response) || response;
      json.updateUrl = url;
      for (const section of json.sections || []) {
        const {code} = section;
        code.includes("") && (section.code = code.replace(/\x01(\d+)\x02/g, (l, num) => usoVars[num - 1] || ""));
      }
      return isText ? JSON.stringify(json) : json;
    }
    function extractHeaders(src, headers) {
      const res = {};
      for (const h of headers) res[h] = src.headers.get(h);
      return res;
    }
    function reportProgress(jobKey, msg) {
      jobs[jobKey]?.ports?.forEach(p => p.postMessage(msg));
    }
    const installCodeCache = {};
    const MIME = "mime";
    bgBusy.then(() => {
      subscribe("urlInstaller", toggle, !0);
    });
    function toggle(key, val, isInit) {
      val ? onTabUrlChange.add(maybeInstall) : onTabUrlChange.delete(maybeInstall);
      isInit || toggleUrlInstaller(val);
    }
    function toggleUrlInstaller(val = values.urlInstaller) {
      const urls = val ? [ "" ] : [ usw, ...usoaRaw, ...[ "greasy", "sleazy" ].map(h => `https://update.${h}fork.org/`) ];
      updateDynamicRules([ {
        id: DNR_ID_INSTALLER,
        condition: {
          regexFilter: (val ? /^.*\.user\.(?:css|less|styl)(?:\?.*)?$/ : /^.*\.user\.css$/).source,
          requestDomains: val ? void 0 : [ ...new Set(urls.map(getHost)) ],
          resourceTypes: [ "main_frame" ],
          responseHeaders: [ {
            header: "content-type",
            values: [ "text/*" ],
            excludedValues: [ "text/html*" ]
          } ]
        },
        action: {
          type: "redirect",
          redirect: {
            regexSubstitution: chrome.runtime.getURL(installUsercss + "#\\0")
          }
        }
      } ]);
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
      return (url.startsWith("file:") || tabCache[tabId]?.[MIME]) && download(url);
    }
    function makeInstallerUrl(url) {
      return `${ownRoot}${installUsercss}?updateUrl=${encodeURIComponent(url)}`;
    }
    async function maybeInstall(tabId, url, oldUrl = "") {
      if (url.includes(".user.") && tabCache[tabId]?.[MIME] !== !1 && /^(https?|file|ftps?):/.test(url) && /\.user\.(css|less|styl)$/.test(url.split(/[#?]/, 1)[0]) && !oldUrl.startsWith(makeInstallerUrl(url))) {
        const inTab = !1;
        const code = await (inTab ? loadFromFile : loadFromUrl)(tabId, url).catch(NOP);
        !/^\s*</.test(code) && getMetaComment(code, "?") && await openInstallerPage(tabId, url, {
          code,
          inTab
        });
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
      } catch (l) {
        if (/Tabs cannot be edited right now/i.test(l.message)) return browser.tabs.create({
          url: newUrl
        });
        throw l;
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
      vars && reuseStyleVars(vars, oldStyleWithVars);
      const [res, log, warn] = await worker.compileUsercss(style.sourceCode, pp, vars, id, strict);
      if (!res.length) throw t("emptyStyle");
      log && logs?.push(log, warn);
      style.sections = res;
      return style;
    }
    async function buildMeta(style, sourceCode) {
      if (!sourceCode && style && style.usercssData) return style;
      const code = (sourceCode || style?.sourceCode).replace(/\r\n?/g, "\n");
      const match = getMetaComment(code, "match");
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
      } catch (l) {
        if (l.code) {
          const args = l.code === "missingMandatory" || l.code === "missingChar" ? l.args.map(e => e.length === 1 ? JSON.stringify(e) : e).join(", ") : l.args;
          const msg = t(`meta_${l.code}`, args);
          l.message = msg || `${l.code}${args ? `: ${args}` : ""}`;
          l.index = (l.index || 0) + match.index;
        }
        throw l;
      }
    }
    function find(data, returnBoolean) {
      const res = data.id ? styleMap.get(data.id) : style_manager_find(makeUserCssFindFilter(data.usercssData || data), "usercssData");
      return returnBoolean ? !!res : res;
    }
    async function install(style, opts) {
      return style_manager_install(await parse(style, opts));
    }
    async function parse(style, {dup, vars} = {}, logs) {
      style.usercssData || (style = await buildMeta(style));
      dup ||= find(style);
      style.id ||= dup?.id;
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
      const meta = [ "name", [ "@version", (new Date).toISOString().replace(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+).+/, "$1$2$3.$4.$5") ], [ "@namespace", ns !== "?" && ns || user && `https://userstyles.world/user/${user}` || "?" ], "description", [ "@homepage", tryURL(ns).href ], [ "@author", user ], "license" ].map((k, l) => k.map ? k[1] && k : (l = usw[k] || style[k]) && [ "@" + k, l ]).filter(Boolean);
      const maxKeyLen = meta.reduce((res, [k]) => Math.max(res, k.length), 0);
      return "/* ==UserStyle==\n" + meta.map(([k, v]) => `${k}${" ".repeat(maxKeyLen - k.length + 2)}${v}\n`).join("") + "==/UserStyle== */\n\n";
    }
    async function linkStyle(style, sourceCode) {
      const {id, name} = style;
      const {metadata} = await worker.metaParse(getMetaComment(sourceCode));
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
        const data = mapObj(info, null, style.usercssData ? [ "id" ] : KEYS_IN);
        data.token = token;
        style.url = style.url || info.homepage || `${usw}style/${data.id}`;
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
      return (await (await fetch(`${usw}api/${path}`, opts)).json()).data;
    }
    async function uswSave(style, l) {
      const {id} = style;
      l ? style._usw = l : l = style._usw;
      await save(style, !1);
      broadcastExtension({
        method: "uswData",
        style: {
          id,
          _usw: l
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
      let [orderFromDb, styles] = await Promise.all([ prefsDB.get("injectionOrder"), db.getAll() ]);
      let mirror;
      orderFromDb || (orderFromDb = await execMirror("settings", "get", "injectionOrder").catch(console.error));
      !styles.length && (mirror = await execMirror("stylish", "getAll").catch(console.error)) && (styles = mirror);
      for (const style of styles) {
        let err;
        try {
          fixKnownProblems(style, !0);
          err = (!Array.isArray(style.sections) || style.usercssData?.vars && style.sections.some(hasVarsAndImport)) && (style.sourceCode ? !await buildCode(style) : "No sourceCode") || !styleJSONseemsValid(style) && "No name/code";
        } catch (l) {
          err = l;
        }
        err ? badStyles.push([ err, style ]) : storeInMap(style);
      }
      badStyles.length && console.warn(badStyles);
      mirror?.length && setTimeout(db.putMany, 100, mirror);
      setOrderImpl(orderFromDb, {
        store: !1
      });
    });
    onSchemeChange.add(() => {
      for (const style of styleMap.values()) SCHEMES.includes(style.preferScheme) && broadcastStyleUpdated(style, "colorScheme");
    });
    onDisconnect.draft = port => {
      ignoreChromeError();
      port.resolve();
      const id = port.name.split(":")[1];
      draftsDB.delete(+id || id).catch(NOP);
    };
    onDisconnect.livePreview = port => {
      ignoreChromeError();
      port.resolve();
      const id = +port.name.split(":")[1];
      const style = styleMap.get(id);
      if (style) {
        stylePreviewMap.delete(id);
        broadcastStyleUpdated(style, "editPreviewEnd");
      }
    };
    onConnect.draft = onConnect.livePreview = port => {
      global.keepAlive(new Promise(resolve => {
        port.resolve = resolve;
      }));
    };
    const style_search_db_cache = new Map;
    const METAKEYS = [ "customName", "name", "url", "installationUrl", "updateUrl" ];
    const extractMeta = style => style.usercssData ? getMetaComment(style.sourceCode) : null;
    const stripMeta = style => style.usercssData ? getMetaComment(style.sourceCode, "del") : null;
    const MODES = Object.assign(Object.create(null), {
      code: (style, test) => style.usercssData ? test(stripMeta(style)) : searchSections(style, test, "code"),
      meta: (style, test, part) => METAKEYS.some(key => test(style[key])) || test(part === "all" ? style.sourceCode : extractMeta(style)) || searchSections(style, test, "funcs"),
      name: (style, test) => test(style.customName) || test(style.name),
      all: (style, test) => MODES.meta(style, test, "all") || !style.usercssData && MODES.code(style, test)
    });
    function searchDb({query, mode, ids}) {
      mode ??= "all";
      let res = [];
      if (mode === "url" && query) res = getByUrl(query).map(r => r.style.id); else if (mode in MODES) {
        const modeHandler = MODES[mode];
        const m = /^\/(.+?)\/([gimsuy]*)$/.exec(query);
        const rx = m && tryRegExp(m[1], m[2]);
        const test = rx ? rx.test.bind(rx) : createTester(query);
        for (let style of ids || styleMap.values()) ids && !(style = styleMap.get(style)) || query && !modeHandler(style, test) || res.push(style.id);
        style_search_db_cache.size && debounce(clearCache, 6e4);
      }
      return res;
    }
    function createTester(query) {
      const flags = "u" + (lower(query) === query ? "i" : "");
      const words = query.split(/(".*?")|\s+/).filter(Boolean).map(w => w.startsWith('"') && w.endsWith('"') ? w.slice(1, -1) : w).filter(w => w.length > 1);
      const rxs = (words.length ? words : [ query ]).map(w => stringAsRegExp(w, flags));
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
      draftsDB.delete(style.id).catch(NOP);
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
      const tabOverrides = td?.tabOvr;
      const tabCSP = td?.patchCsp;
      for (const style of id ? [ styleMap.get(id) ].filter(Boolean) : styleMap.values()) {
        let ovr;
        let matching;
        const res = {
          excluded: !!(ovr = style.exclusions) && ovr.some(urlMatchOverride, query),
          excludedScheme: !themeAllowsStyle(style),
          included: matching = !!(ovr = style.inclusions) && ovr.some(urlMatchOverride, query),
          tabOvr: tabOverrides?.[style.id] ?? null,
          patchCsp: tabCSP?.[style.id] || null,
          incOvr: !(matching || !style.overridden || !ovr?.length),
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
            sloppy ||= secMatch === "sloppy";
            empty &&= styleCodeEmpty(sec);
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
        size && (style._size = calcObjSize(style));
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
      dark != null && isDark == null && setSystemDark(dark);
      if (init && values.disableAll) return {
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
        ass: values.styleViaASS && (!(v = optionSites.styleViaASS) || isOptionSite(v, url)),
        dark: isTop && isDark,
        name: values.exposeStyleName,
        nonce: td.nonce?.[frameId],
        top: values.exposeIframes && (!(v = optionSites.exposeIframes) || isOptionSite(v, url)),
        topUrl: isTop ? "" : getUrlOrigin(tab.url || td.url?.[0]),
        wake: values.keepAlive >= 0,
        order
      };
      if (init === "cfg") return res;
      frameId === 0 && init !== "styleViaXhr" && (v = td.url) && (v = v[0]) !== url && v?.split("#", 1)[0] === url.split("#", 1)[0] && (url = v || url);
      const cache = (v = entries.get(url)) || new Map;
      const tabOvr = td.tabOvr || !1;
      const secsArr = [];
      let {maybe} = cache;
      if (v && tabOvr) for (const styleId in tabOvr) tabOvr[styleId] && !cache.has(+styleId) && (maybe ??= new Set).add(+styleId);
      v && !maybe || cache_create(url, cache, maybe, tabOvr);
      add(url, cache);
      for (const sec of id ? (v = cache.get(id)) ? [ v ] : [] : cache.values()) (tabOvr[sec.id] ?? !sec.tabOvr) && secsArr.push(sec);
      init === !0 && secsArr.length && ((td.url ??= {})[frameId] ??= url);
      res.sections = secsArr;
      return res;
    }
    async function style_manager_install(style, reason = (styleMap.has(style.id) ? "update" : "install")) {
      (style = mergeWithMapped(style)).originalDigest = await calcStyleDigest(style);
      return save(style, reason);
    }
    function style_manager_remove(id, reason, many) {
      if (!styleMap.has(id)) return 0;
      const style = styleMap.get(id);
      const uuid = style._id;
      reason !== "sync" && sync_manager_remove(uuid, Date.now());
      updateSections(id, !0);
      stateDB.delete("editorScrollInfo" + id);
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
        const id = +key;
        const val = overrides[key];
        const style = styleMap.get(id);
        if (style && tabOvr[key] != val) {
          val == null ? delete tabOvr[key] : tabOvr[key] = val;
          cache && (cache.maybe ??= new Set).add(id);
          messages.push({
            method: "styleUpdated",
            reason: "tabOvr",
            style: {
              id,
              enabled: val ?? style.enabled
            }
          });
        }
      }
      (td.tabOvr || !isEmptyObj(tabOvr) || (tabOvr = void 0, 1)) && tab_manager_set(tabId, "tabOvr", tabOvr);
      if (messages.length) {
        sendTab(tabId, messages, null, !0);
        broadcastExtension(messages, !0);
      }
    }
    const popups = new Map;
    const onTabUpdated = async (tabId, {url}) => {
      if (url && popups.has(tabId)) {
        const data = await makePopupData(tabId);
        for (const port of popups.get(tabId) || []) port.postMessage(data);
      }
    };
    const toggleObserver = enable => toggleListener(chrome.tabs.onUpdated, enable, onTabUpdated);
    onConnect.popup = port => {
      popups.size || toggleObserver(!0);
      const tabId = +port.name.split(":")[1];
      const ports = popups.get(tabId);
      ports ? ports.add(port) : popups.set(tabId, new Set([ port ]));
    };
    onDisconnect.popup = port => {
      const tabId = +port.name.split(":")[1];
      const ports = popups.get(tabId);
      ports?.delete(port) && !ports.size && popups.delete(tabId) && !popups.size && toggleObserver(!1);
    };
    async function makePopupData(tabId) {
      let tmp;
      let tab = await (tabId != null ? browser.tabs.get(tabId).catch(NOP) : getActiveTab());
      if (!tab) return;
      tabId ??= tab.id;
      const url = tab.url || tab.pendingUrl || "";
      const td = tabCache[tabId] || !1;
      const isOwn = url.startsWith(ownRoot);
      const [ping0 = await reinjectContentScripts(tab), frames] = await Promise.all([ isOwn || supported(url) && pingTab(tabId), isOwn && getAllFrames(url, tab) || browser.webNavigation.getAllFrames({
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
        const u = f.url ??= "";
        f.isDupe = f.frameId && urls.has(u);
        urls.add(u);
        frames.push(f);
      }
      frames[0].url = url;
      const urlSupported = supported(url);
      if (urlSupported) {
        bgBusy && await bgBusy;
        for (const f of frames) f.url && !f.isDupe && (f.styles ??= getByUrl(f.url, void 0, tabId));
      }
      return {
        frames,
        ping0,
        tab,
        urlSupported,
        [kTabOvrToggle]: td[kTabOvrToggle]
      };
    }
    async function getAllFrames(url, {id: tabId}) {
      let res;
      res = await chrome.runtime.getContexts({
        tabIds: [ tabId ]
      });
      res = res[1]?.documentUrl;
      return [ {
        frameId: 0,
        url
      }, res && {
        frameId: 1,
        parentFrameId: 0,
        url: res
      } ].filter(Boolean);
    }
    const nondefaults = {};
    const updateStorage = () => chrome_sync_set({
      settings: nondefaults
    });
    set._bgSet = (key, val) => {
      const def = defaults[key];
      if (val === def || val && typeof def == "object" && deepEqual(val, def)) {
        if (!(key in nondefaults)) return;
        delete nondefaults[key];
      } else nondefaults[key] = val;
      bgBusy || debounce(updateStorage);
      return !0;
    };
    bgPreInit.push(chrome_sync_get("settings").then(orig => {
      (orig = orig.settings) && typeof (val = orig) == "object" && val || (orig = {});
      var val;
      if (orig["editor.linter"] === "") {
        delete orig["editor.linter"];
        orig[pEditorLinterOn] = !1;
      }
      ready.set(deepMerge(orig), {});
      deepEqual(orig, nondefaults) || bgBusy.then(updateStorage);
      return ready;
    }));
    let value;
    const key = "usercssTemplate";
    const DEFAULT = "/* ==UserStyle==\n@name           \n@namespace      github.com/openstyles/stylus\n@version        1.0.0\n@description    A new userstyle\n@author         Me\n==/UserStyle== */\n\n";
    const parseTemplate = async (str = DEFAULT) => value = [ DEFAULT, str, await buildMeta(null, str).catch(NOP) || !1 ];
    onStorageChanged.add(changes => {
      changes[key] && (value = null);
    });
    const CM_THEMES_TEXT = {};
    const PROVIDERS = {
      edit(url) {
        const id = +url.searchParams.get("id");
        const style = getById(id);
        const isUsercss = style ? "usercssData" in style : values.newStyleAsUsercss;
        let v;
        v = {
          style,
          isUsercss,
          si: style && stateDB.get("editorScrollInfo" + id),
          state: chromeLocal.getValue("editor"),
          template: isUsercss && (value ??= getLZValue(key).then(parseTemplate)),
          theme: v = values["editor.theme"],
          themeText: v !== defaults["editor.theme"] && (CM_THEMES_TEXT[v = `css/cm-themes/${v}.css`] ??= fetchText(v).catch(NOP))
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
            mode: sp.get("searchMode") || values["manage.searchMode"]
          }),
          badStyles: badStyles.length && badStyles,
          styles: JSON.stringify(styles),
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
    async function setClientData({dark: pageDark, url: pageUrl, frameId} = {}) {
      setSystemDark(pageDark);
      bgBusy && await bgBusy;
      const url = new URL(pageUrl);
      const page = url.pathname.slice(1, -5);
      const pagesForUrl = ownPagesCommitted[pageUrl];
      const tabId = pagesForUrl?.shift();
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
        favicon: isVivaldi ?? vivaldiTest(),
        prefs: nondefaults,
        tabId: tabId ?? -1,
        badFavs: (page === "edit" || page === "install-usercss" || page === "manage") && values["manage.newUI.favicons"] && getDbArray("badFavs")
      }, PROVIDERS[page]?.(url));
      const results = await Promise.all(Object.values(jobs));
      pagesForUrl && !pagesForUrl.length && delete ownPagesCommitted[url];
      Object.keys(jobs).forEach((id, i) => jobs[id] = results[i]);
      return jobs;
    }
    const kOpenManage = "openManage";
    const kOpenOptions = "openOptions";
    const kReload = "reload";
    const kStyleDisableAll = "styleDisableAll";
    const kToggleTab = "toggleTab";
    const context_menus_COMMANDS = {
      [kOpenManage]: (info, {windowId} = {}) => openDashboard({}, null, !1, {
        windowId
      }),
      [kOpenOptions]: (info, {windowId} = {}) => openDashboard(null, null, !1, {
        windowId
      }),
      [kReload]: () => chrome.runtime.reload(),
      [kStyleDisableAll]: info => ready.then(() => set("disableAll", info ? info.checked : !values.disableAll)),
      [kToggleTab]: async (info, tab) => {
        const td = (tab ??= await getActiveTab()) && tabCache[tab.id];
        if (!td) return;
        let [state, skip, ovrs] = td[kTabOvrToggle] || [];
        let ids;
        state = state ?? 2 ? 0 : 2;
        if (!state && (ids = td.styleIds) && (ids = [].concat(...Object.values(ids))).length) {
          if (!ovrs) {
            td[kTabOvrToggle] = [ state, skip, ovrs = {
              ...td.tabOvr
            } ];
            for (const id of ids) ovrs[id] ??= null;
          }
          ovrs = {};
          for (const id of ids) ovrs[id] = !1;
        } else if (!ovrs) return;
        td[kTabOvrToggle][0] = state;
        toggleTabOvrMany(tab.id, ovrs);
      }
    };
    const chromeCommands = chrome.commands;
    const chromeMenus = chrome.contextMenus;
    const MENUS = !!chromeMenus && {
      "show-badge": [ info => {
        set(info.menuItemId, info.checked);
      }, {
        title: t("menuShowBadge")
      } ]
    };
    if (MENUS) for (const [menuId, cmdId = menuId] of [ [ kToggleTab ], [ "disableAll", kStyleDisableAll ], [ "styleManager", kOpenManage ], [ kOpenOptions ], [ kReload ] ]) MENUS[menuId] = [ context_menus_COMMANDS[cmdId], {
      title: MF.commands[cmdId]?.description || t(cmdId)
    } ];
    MENUS && (MENUS["editor.contextDelete"] = [ (info, tab) => {
      sendTab(tab.id, {
        method: "editDeleteText"
      });
    }, {
      title: t("editDeleteText"),
      type: "normal",
      contexts: [ "editable" ],
      documentUrlPatterns: [ ownRoot + "*" ]
    } ]);
    chromeCommands?.onCommand.addListener(id => context_menus_COMMANDS[id]());
    chromeMenus?.onClicked.addListener((info, tab) => MENUS[info.menuItemId][0](info, tab));
    const context_menus = chromeMenus ? () => {
      createContextMenus(Object.keys(MENUS), !0);
      function createContextMenus(ids, isInit) {
        for (const id of ids) {
          const item = MENUS[id][1];
          if (isInit) {
            item.id = id;
            item.contexts ??= [ "action" ];
            item.title = item.title ?? t(id);
          }
          if (typeof defaults[id] == "boolean") if (item.type) {
            if (isInit) {
              subscribe(id, togglePresence, !0);
              continue;
            }
          } else {
            item.type = "checkbox";
            item.checked = values[id];
            isInit && subscribe(id, toggleCheckmark);
          }
          chromeMenus.create(item, ignoreChromeError);
        }
      }
      function toggleCheckmark(id, checked) {
        chromeMenus.update(id, {
          checked
        }, ignoreChromeError);
      }
      function togglePresence(id, checked) {
        checked ? createContextMenus([ id ]) : chromeMenus.remove(id, ignoreChromeError);
      }
    } : NOP;
    const VERSION_RE = /^(.*?)-([-.0-9a-z]+)|$/i;
    const DIGITS_RE = /^\d+$/;
    function compareVersion(ver1, ver2) {
      const [, main1 = ver1 || "", pre1] = VERSION_RE.exec(ver1);
      const [, main2 = ver2 || "", pre2] = VERSION_RE.exec(ver2);
      const delta = compareVersionChunk(main1, main2) || !pre1 - !pre2 || pre1 && compareVersionChunk(pre1, pre2, !0);
      return Math.sign(delta || 0);
    }
    function compareVersionChunk(ver1, ver2, isSemverMode) {
      const parts1 = ver1.split(".");
      const parts2 = ver2.split(".");
      const len1 = parts1.length;
      const len2 = parts2.length;
      const len = (isSemverMode ? Math.min : Math.max)(len1, len2);
      let delta;
      for (let i = 0; !delta && i < len; i += 1) {
        const a = parts1[i];
        const b = parts2[i];
        delta = isSemverMode ? DIGITS_RE.test(a) && DIGITS_RE.test(b) ? a - b : a > b || a < b && -1 : (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0);
      }
      return delta || isSemverMode && len1 - len2;
    }
    const pingers = {};
    const getMd5Url = usoId => `https://update.userstyles.org/${usoId}.md5`;
    async function getUpdatability(usoId, asObject) {
      const md5Url = getMd5Url(usoId);
      const md5 = await fetchText(md5Url);
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
      let v;
      const updateUrl = dup?.updateUrl || makeUpdateUrl("usoa", usoId);
      const jobs = [ !dup && getUpdatability(usoId, !0).then(res => ({dup, md5, md5Url} = res)), !css && download(updateUrl).then(res => css = res) ].filter(Boolean);
      jobs[0] && await Promise.all(jobs);
      const style = await buildMeta({}, css);
      const vars = (v = varsUrl || dup?.updateUrl) && useVars(style, v, {});
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
        installationUrl: makeInstallUrl("usoa", usoId)
      });
    }
    async function ping(id, resolve) {
      await fetch(`${uso}styles/install/${id}?source=stylish-ch`);
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
    const safeSleep = ms => global.keepAlive(sleep(ms));
    const RH_ETAG = {
      responseHeaders: [ "etag" ]
    };
    const RX_DATE2VER = new RegExp([ /^(\d{4})/, /(0[1-9]|1(?:0|[12](?=\d\d))?|[2-9])/, /(0[1-9]|[1-2][0-9]?|3[0-1]?|[4-9])/, /\.([01][0-9]?|2[0-3]?|[3-9])/, /\.([0-5][0-9]?|[6-9])$/ ].map(rx => rx.source).join(""));
    const ALARM_NAME = "scheduledUpdate";
    const MIN_INTERVAL_MS = 6e4;
    const RETRY_ERRORS = [ 503, 429 ];
    const HOST_THROTTLE = 1e3;
    const hostJobs = {};
    let lastUpdateTime;
    let checkingAll = !1;
    let logQueue = [];
    let logLastWriteTime = 0;
    bgBusy.then(async () => {
      lastUpdateTime = await chromeLocal.getValue("lastUpdateTime");
      lastUpdateTime || rememberNow();
      subscribe("updateInterval", update_manager_schedule, !0);
      chrome.alarms.onAlarm.addListener(update_manager_onAlarm);
    });
    async function checkAllStyles({save = !0, ignoreDigest, observe, onlyEnabled = values.updateOnlyEnabled} = {}) {
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
          if (!ignoreDigest && style.originalDigest && style.originalDigest !== await calcStyleDigest(style)) return Promise.reject(STATES.EDITED);
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
            updateUrl = style.updateUrl = `${usoApi}Css/${usoId}`;
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
            if (!ucd && styleSectionsEqual(json, style)) {
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
      } catch (l) {
        const error = l === 0 && STATES.UNREACHABLE || l && l.message || l;
        res = {
          error,
          style,
          STATES
        };
        state = `${STATES.SKIPPED} (${Array.isArray(l) ? l[0].message : error})`;
      }
      log(`${state} #${id} ${style.customName || style.name}`);
      port && port.postMessage(res);
      return res;
      async function updateUsercss(css) {
        let oldVer = ucd.version;
        let oldEtag = style.etag;
        let m;
        if ((css || extractUsoaId(updateUrl)) && (m = css || getMetaComment(style.sourceCode, "del")).includes("@updateURL") && (m = getMetaComment(m)) && (m = await buildMeta(null, m).catch(NOP)) && m.updateUrl) {
          updateUrl = m.updateUrl;
          oldVer = m.version || "0";
          oldEtag = "";
        } else if (css) return;
        (m = updateUrl.match(rxGF))[5] === "meta" && (updateUrl = m[1] + "user" + m[6]);
        if (oldEtag && oldEtag === await downloadEtag(updateUrl)) return Promise.reject(STATES.SAME_CODE);
        const {headers: {etag}, response} = await tryDownload(updateUrl, RH_ETAG);
        const json = await buildMeta({
          etag,
          updateUrl
        }, response);
        const delta = compareVersion(json.usercssData.version, oldVer);
        let err;
        delta || ignoreDigest || (err = response === style.sourceCode ? STATES.SAME_CODE : !isLocalhost(updateUrl) && STATES.SAME_VERSION);
        delta < 0 && (err = STATES.ERROR_VERSION);
        if (err && etag && !style.etag) {
          style.etag = etag;
          await db.put(style);
        }
        return err ? Promise.reject(err) : json;
      }
    }
    async function tryDownload(url, params, {retryDelay = HOST_THROTTLE} = {}) {
      for (;;) {
        let host, job;
        try {
          params = deepMerge(params || {}, {
            headers: {
              "Cache-Control": "no-cache"
            }
          });
          host = getHost(url);
          job = hostJobs[host];
          job = hostJobs[host] = (job ? job.catch(NOP).then(() => safeSleep(HOST_THROTTLE / (isCdnUrl(url) ? 4 : 1))) : Promise.resolve()).then(() => download(url, params));
          return await job;
        } catch (l) {
          if (!RETRY_ERRORS.includes(l) || retryDelay > MIN_INTERVAL_MS) throw l;
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
      const m = RX_DATE2VER.exec(style.usercssData?.version);
      if (m) {
        m[2]--;
        return new Date(...m.slice(1)).getTime();
      }
    }
    function update_manager_schedule() {
      const interval = values.updateInterval * 60 * 60 * 1e3;
      if (interval > 0) {
        const elapsed = Math.max(0, Date.now() - lastUpdateTime);
        chrome.alarms.create(ALARM_NAME, {
          when: Date.now() + Math.max(MIN_INTERVAL_MS, interval - elapsed)
        });
      } else browser.alarms.clear(ALARM_NAME).catch(NOP);
    }
    async function update_manager_onAlarm({name}) {
      if (name === ALARM_NAME) {
        bgBusy && await bgBusy;
        global.keepAlive(checkAllStyles());
      }
    }
    function rememberNow() {
      chromeLocal.set({
        lastUpdateTime: lastUpdateTime = Date.now()
      });
    }
    function log(text) {
      logQueue.push({
        text,
        time: (new Date).toLocaleString()
      });
      debounce(flushQueue, text && checkingAll ? 1e3 : 0);
    }
    async function flushQueue(lines) {
      if (!lines) {
        flushQueue(await chromeLocal.getValue("updateLog") || []);
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
      chromeLocal.set({
        updateLog: lines
      });
      logLastWriteTime = Date.now();
      logQueue = [];
    }
    Object.assign(API, {
      data: {
        get: dataHub.get.bind(dataHub),
        has: dataHub.has.bind(dataHub)
      },
      draftsDB,
      prefs: {
        set(data) {
          for (const k in data) set(k, data[k]);
        }
      },
      prefsDB,
      state: {
        set: (key, val) => {
          stateDB.put(val, key);
        }
      },
      styles: style_manager_namespaceObject,
      sync: sync_manager_namespaceObject,
      tabs: {
        openEditor: async params => {
          const u = new URL(chrome.runtime.getURL("edit.html"));
          const usp = new URLSearchParams(params);
          const wnd = browserWindows && values.openEditInWindow;
          const wndPos = wnd && values.windowPosition;
          const wndPopup = wnd && values["openEditInWindow.popup"] && {
            type: "popup"
          };
          const ffBug = wnd && !1;
          wndPopup && usp.set("popup", "1");
          u.search = usp;
          for (let tab, retry = 0; retry < (wndPos ? 2 : 1); ++retry) try {
            tab = tab || await openTab({
              url: `${u}`,
              currentWindow: null,
              newWindow: wnd && Object.assign({}, wndPopup, !ffBug && !retry && wndPos)
            });
            ffBug && !retry && await browserWindows.update(tab.windowId, wndPos);
            return tab;
          } catch {}
        },
        openManager: async (opts = {}) => {
          const base = chrome.runtime.getURL("manage.html");
          const url = setUrlParams(base, opts);
          const tabs = await browser.tabs.query({
            url: base + "*"
          });
          const same = tabs.find(l => l.url === url);
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
          args[args.length - 1]?.undef === tabId && (args[args.length - 1] = void 0);
          tab_manager_set(tabId ?? this.sender.tab?.id, ...args);
        }
      },
      updater: update_manager_namespaceObject,
      usercss: usercss_manager_namespaceObject,
      uso: uso_api_namespaceObject,
      usw: usw_api_namespaceObject,
      util: {
        download,
        setClientData,
        setSystemDark
      }
    }, !1);
    chrome.runtime.onInstalled.addListener(({reason, previousVersion}) => {
      reinjectContentScripts();
      context_menus();
      if (reason === "install") {
        MOBILE && set("manage.newUI", !1);
        WINDOWS && set("editor.keyMap", "sublime");
      }
      previousVersion === "1.5.30" && prefsDB.delete("badFavs");
      /^[23]\.3\.(1[89]|2[0-3])$/.test(previousVersion) && (bgInit?.length ? bgInit.push(inferHomepages) : inferHomepages());
      (bgPreInit?.length ? bgPreInit : bgInit || []).push(DNR.getDynamicRules().then(rules => updateDynamicRules(void 0, getRuleIds(rules))).then(() => ready).then(() => toggleUrlInstaller()), DNR.getSessionRules().then(rules => updateSessionRules(void 0, getRuleIds(rules))));
      onStartup();
    });
    chromeSession.get("init", async ({init}) => {
      if (!init) {
        chromeSession.set({
          init: !0
        });
        onStartup();
        await bgBusy;
        reinjectContentScripts();
      }
    });
    async function onStartup() {
      await refreshIconsWhenReady();
      await sleep(1e3);
      const minDate = Date.now() - 432e5;
      for (const id of await draftsDB.getAllKeys()) {
        const {date} = await draftsDB.get(id) || {};
        date < minDate && draftsDB.delete(id);
      }
      bgBusy && await bgBusy;
      mirrorStorage(styleMap);
    }
    onMessage.set((m, sender) => {
      if (m.method === "invokeAPI") {
        let res = API;
        for (const p of m.path.split(".")) res = res && res[p];
        if (!res) throw new Error(`Unknown API.${m.path}`);
        res = res.apply({
          msg: m,
          sender
        }, m.args);
        return res ?? null;
      }
    }, !0);
    (async () => {
      const numPreInit = bgPreInit.length;
      await Promise.all(bgPreInit);
      await Promise.all(bgPreInit.slice(numPreInit));
      bgPreInit.length = 0;
      await Promise.all(bgInit.splice(0).map(v => typeof v == "function" ? v() : v));
      bgBusy.resolve();
    })();
    const CLIENT_DATA_PREFIX_URL = ownRoot + "data?";
    const RESPONSE_INIT = {
      headers: {
        "cache-control": "no-cache"
      }
    };
    global.oninstall = evt => {
      evt.addRoutes({
        condition: {
          urlPattern: `${CLIENT_DATA_PREFIX_URL}*`
        },
        source: "fetch-event"
      });
      evt.addRoutes({
        condition: {
          not: {
            urlPattern: `${ownRoot}*.user.css`,
            requestDestination: "document"
          }
        },
        source: "network"
      });
    };
    global.onfetch = evt => {
      const url = evt.request.url;
      if (url.startsWith(ownRoot)) if (url.startsWith(CLIENT_DATA_PREFIX_URL)) {
        const sp = new URL(url).searchParams;
        const pageUrl = sp.get("url");
        const job = setClientData({
          dark: !!+sp.get("dark"),
          frameId: +sp.get("frameId"),
          url: pageUrl
        }).catch(err => {
          err.message = "Internal failure.\n" + err.message;
          return {
            err
          };
        }).then(res => new Response(`clientData=${JSON.stringify(res)}`, RESPONSE_INIT));
        clientDataJobs.set(pageUrl, job);
        job.finally(() => clientDataJobs.delete(pageUrl));
        evt.respondWith(job);
      } else /\.user.css#(\d+)$/.test(url) && evt.respondWith(Response.redirect("edit.html?id=" + RegExp.$1));
    };
    global.onmessage = function(evt, silent) {
      const {id: once} = evt.data || {};
      const exec = this;
      const port = evt.ports[0];
      port.onerror = console.error;
      port.onmessage = onMessage;
      port.onmessageerror = onMessageError;
      once && onMessage(evt);
      async function onMessage(portEvent) {
        const data = portEvent.data;
        const {args, id} = data.id ? data : JSON.parse(data);
        let res, err;
        numJobs++;
        timer && (timer = clearTimeout(timer));
        try {
          res = (typeof exec == "function" ? exec : exec[args.shift()]).apply(portEvent, args);
          res instanceof Promise && (res = await res);
        } catch (l) {
          res = void 0;
          if (l instanceof Error) {
            delete l.origin;
            err = [ l, {
              ...l
            } ];
          } else err = [ l ];
        }
        silent || port.postMessage({
          id,
          res,
          err
        }, portEvent._transfer);
        (--numJobs, 0) && autoClose(TTL);
        lastBusy = performance.now();
      }
    }.bind(_execute);
    cloudDrive.webdav = async cfg => {
      const res = await background_offscreen.webdavInit(cfg);
      const webdav = background_offscreen.webdav;
      for (const k in res) res[k] ??= webdav.bind(null, k);
      return res;
    };
    chrome.webRequest.onBeforeRequest.addListener(() => {}, {
      urls: [ ownRoot + "*.html*" ],
      types: [ "main_frame", "sub_frame" ]
    });
  })();
})();