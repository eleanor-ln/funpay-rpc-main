"use strict";

this["apply.js"] !== 1 && (() => {
  this["apply.js"] = 1;
  const global = this;
  const apiHandler = {
    get: (me, key, instance) => instance[key] = me.name ? apiHandler.apply.bind(null, me.name + "." + key) : Object.create(new Proxy({
      name: key
    }, apiHandler)),
    apply: async (path, ...args) => {
      const localErr = new Error;
      const msg = {
        data: {
          method: "invokeAPI",
          path,
          args
        },
        TDM
      };
      for (let res, err, retry = 0; retry < 1; retry++) try {
        res = await chrome.runtime.sendMessage(msg);
        if (res) {
          if (err = res.error) {
            err.stack += "\n" + localErr.stack;
            throw err;
          }
          return res.data;
        }
      } catch (_) {
        if (!bgReadying) {
          _.stack = localErr.stack;
          throw _;
        }
      }
    }
  };
  const API = global.API = Object.create(new Proxy({
    name: ""
  }, apiHandler));
  const isFrame = window !== top;
  let isTab;
  let bgReadying = !1;
  let TDM = isFrame ? 0 : document.prerendering ? -1 : 1;
  isTab = !0;
  const onMessage = new Map;
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
  function _execute(data, sender, multi, broadcast) {
    let result;
    let res;
    let i = 0;
    if (multi) {
      multi = data.length > 1 && data;
      data = data[0];
    }
    do {
      for (const [fn, replyAllowed] of onMessage) {
        try {
          data.broadcast = broadcast;
          res = fn(data, sender, !!multi);
        } catch (_) {
          res = Promise.reject(_);
        }
        replyAllowed && res !== result && result === void 0 && (result = res);
      }
    } while (multi && (data = multi[++i]));
    return result;
  }
  const style_injector_FF = !1;
  const CLASS = "stylus";
  const PREFIX = CLASS + "-";
  const MEDIA = "screen, " + PREFIX;
  const kAss = "adoptedStyleSheets";
  const kViolation = "securitypolicyviolation";
  const own = {
    cfg: {
      off: !1,
      top: ""
    }
  };
  const runtime = chrome.runtime;
  const ownId = runtime.id;
  const isXml = document instanceof XMLDocument;
  const assDoc = document;
  const docRewriteObserver = (check => {
    let observing = !1;
    let timer;
    const observer = new MutationObserver(check);
    return {
      start: () => {
        if (!observing && !ass) {
          root = document.documentElement;
          timer = setTimeout(check);
          observer.observe(document, {
            childList: !0
          });
          observing = !0;
        }
      },
      stop: () => {
        if (observing) {
          clearTimeout(timer);
          observer.disconnect();
          observing = !1;
        }
      }
    };
  })(updateRoot);
  const docRootObserver = (onChange => {
    let observing = !1;
    const observer = new MutationObserver(onChange);
    return {
      start,
      stop,
      restart: () => {
        if (observing) {
          stop();
          start();
        }
      }
    };
    function start() {
      if (!observing && !ass) {
        observer.observe(root, {
          childList: !0
        });
        observing = !0;
      }
    }
    function stop() {
      if (observing) {
        observer.disconnect();
        observing = !1;
      }
    }
  })(restoreOrder);
  const toSafeChar = c => String.fromCharCode(65280 + c.charCodeAt(0) - 32);
  const list = [];
  const randomIds = {};
  const calcOrder = ({id}) => orderPrio[id] * 1e6 || orderMain[id] || id + 5e5;
  const compare = (a, b) => calcOrder(a) - calcOrder(b);
  const table = new Map;
  let ass;
  let assV2;
  let assIndexOf;
  let root = document.documentElement;
  let isEnabled = !0;
  let isTransitionPatched;
  let exposeStyleName;
  let ffCsp;
  let nonce = "";
  let reorderCnt = 0;
  let reorderStart = 0;
  let creationDoc, createElement, createElementNS;
  let orderPrio, orderMain;
  let checkCSP;
  let onInjectorUpdate, selfDestruct;
  function shutdown() {
    if (list.length) {
      checkCSP && removeEventListener(kViolation, checkCSP, !0);
      toggleObservers(!1);
      removeAllElements();
      list.length = 0;
      table.clear();
    }
  }
  function removeId(id) {
    removeStyle(table.get(id)) && emitUpdate();
  }
  function toggle(enable) {
    if (isEnabled !== (enable = !!enable)) {
      isEnabled = enable;
      enable ? addAllElements() : removeAllElements();
    }
  }
  function addElement(el, before) {
    if (ass) {
      const sheets = assV2 || !1;
      let i = assIndexOf(sheets, el);
      i >= 0 && (el = sheets.splice(i, 1)[0]);
      i = before ? assIndexOf(sheets, before) : -1;
      i >= 0 ? sheets.splice(i, 0, el) : sheets.push(el);
    } else updateRoot().insertBefore(el, before);
    return el;
  }
  function addAllElements() {
    if (list.length) {
      if (!checkCSP) {
        checkCSP = evt => {
          let sent, src, u, what;
          if (evt.isTrusted && (u = evt.blockedURI) && /(default|style|img|font)-src/.test(what = evt.violatedDirective) && !(sent ??= new Set).has(what = u + ` (${what})`) && (!(src = evt.sourceFile) || /^(\w+-)?extension$/.test(src))) for (const style of list) if (nonCommentIncludes(style.code, u === "inline" ? u = "data:" : u)) {
            API.tabs.set(null, "patchCsp", style.id, what, !0);
            sent.add(what);
          }
        };
        addEventListener(kViolation, checkCSP, !0);
      }
      toggleObservers(!1);
      ass ? replaceAss(!0) : updateRoot().append(...list.map(s => s.el));
      toggleObservers(!0);
    }
  }
  function removeElement(el) {
    if (el.remove) el.remove(); else if (ass) {
      const sheets = assV2 || !1;
      const i = assIndexOf(sheets, el);
      i >= 0 && sheets.splice(i, 1);
    }
  }
  function removeAllElements() {
    toggleObservers(!1);
    if (ass) replaceAss(); else for (const {el} of list) removeElement(el);
  }
  function replaceAss(readd) {
    const elems = list.map(s => s.el);
    const res = [];
    for (let el, arr = assV2 || !1, i = 0; i < arr.length && (el = arr[i]); i++) assIndexOf(elems, el) < 0 && res.push(el);
    readd && res.push(...elems);
    assDoc[kAss] = res;
  }
  function apply({cfg, sections}, isReplace) {
    cfg && updateConfig(cfg);
    if (!sections) return;
    const ids = isReplace && new Set;
    let old;
    for (const style of sections) {
      const {id, code} = style;
      const codeStr = Array.isArray(code) ? style.code = code.join("") : code;
      old = table.get(id);
      if (old) {
        if (old.code !== codeStr || exposeStyleName && old.name !== style.name) {
          old.code = codeStr;
          setTextAndName(old.el, style);
          old.el.disabled = !1;
        }
      } else {
        style.el = createStyle(style);
        table.set(id, style);
        const i = list.findIndex(item => calcOrder(item) > calcOrder(style));
        list.splice(i < 0 ? list.length : i, 0, style);
      }
      isReplace && ids.add(id);
    }
    toggleObservers(!1);
    if (isReplace && list.length > ids.size) for (let s, i = list.length; --i >= 0; ) ids.has((s = list[i]).id) || removeStyle(s);
    if (isEnabled) {
      isTransitionPatched || applyTransitionPatch(sections);
      restoreOrder();
    }
    emitUpdate();
  }
  function applyTransitionPatch(styles) {
    isTransitionPatched = !0;
    if (document.readyState === "complete" || document.visibilityState === "hidden" || !styles.some(s => s.code.includes("transition"))) return;
    const el = createStyle({
      id: "transition-patch",
      code: ":not(#\\0):not(#\\0) { transition: none !important }"
    });
    addElement(el);
    requestAnimationFrame(() => setTimeout(removeElement, 0, el));
  }
  function createStyle(style) {
    let el;
    let {id} = style;
    if (ass) {
      exposeStyleName || (id = randomIds[id] ??= Math.random().toString(36).slice(2));
      id = MEDIA + id;
      el = new CSSStyleSheet({
        media: id
      });
      setTextAndName(el, style);
      for (let m, arr = assV2 || !1, i = 0; i < arr.length; i++) (m = arr[i].media).mediaText === id && (m.mediaText += "-old");
      return el;
    }
    if (!creationDoc && (el = initCreationDoc())) return el;
    el = root instanceof SVGSVGElement ? createElementNS("http://www.w3.org/2000/svg", "style") : isXml ? createElementNS("http://www.w3.org/1999/xhtml", "style") : createElement("style");
    nonce && (el.nonce = nonce);
    id && exposeStyleName && (id = el.id = `${PREFIX}${id}`);
    el.classList.add(CLASS);
    setTextAndName(el, style);
    return el;
  }
  function setTextAndName(el, {id, code, name}) {
    if (ass) try {
      el.replaceSync(code);
    } catch {
      el.replace(code);
    } else {
      if (exposeStyleName && name) {
        el.dataset.name !== name && (el.dataset.name = name);
        name = encodeURIComponent(name.replace(/[?#/']/g, toSafeChar));
        code += `\n/*# sourceURL=${runtime.getURL(name)}.user.css#${id}${window !== top ? "#" + Math.random().toString(36).slice(2) : ""} */`;
      }
      (el.firstChild || el).textContent = code;
    }
  }
  function toggleObservers(shouldStart) {
    if (ass && shouldStart) return;
    const onOff = shouldStart && isEnabled ? "start" : "stop";
    docRewriteObserver[onOff]();
    docRootObserver[onOff]();
  }
  function emitUpdate() {
    toggleObservers(list.length);
    onInjectorUpdate();
  }
  function initAss() {
    if (!assIndexOf) {
      Object.isExtensible(ass) && (assV2 = ass);
      assIndexOf = Object.call.bind([].indexOf);
    }
  }
  function initCreationDoc(style) {
    creationDoc = document;
    for (let ok, retry = 0; !ok && retry < 2; retry++) {
      createElement = creationDoc.createElement.bind(creationDoc);
      createElementNS = creationDoc.createElementNS.bind(creationDoc);
      return;
    }
  }
  function removeStyle(style) {
    if (style) {
      table.delete(style.id);
      list.splice(list.indexOf(style), 1);
      removeElement(style.el);
      return !0;
    }
  }
  function restoreOrder(mutations) {
    if (!runtime.id) return selfDestruct();
    let bad;
    let el = list.length && list[0].el;
    if (el) if (ass) {
      for (let len = list.length, base = ass.length - len, i = 0; i < len; i++) if (base < 0 || ass[base + i] !== list[i].el) {
        bad = !0;
        break;
      }
    } else if (el.parentNode !== creationDoc.documentElement) bad = !0; else {
      let i = 0;
      let tag;
      for (;el; ) {
        if (i < list.length && el === list[i].el) i++; else if ((tag = el.localName) && (tag === "link" ? el.relList.contains("stylesheet") : tag === "head" || tag === "body" || tag === "frameset" || tag === "style" || el.firstElementChild && el.querySelector('style, link[rel~="stylesheet"]'))) {
          bad = !0;
          break;
        }
        el = el.nextElementSibling;
      }
      i < list.length && (bad = !0);
    } else bad = !1;
    if (!bad) return;
    !mutations || ++reorderCnt < 10 ? addAllElements() : console.debug("Stylus ignored wrong order of styles to avoid an infinite loop of mutations.");
    const t = performance.now();
    if (t - reorderStart > 250) {
      reorderCnt = 0;
      reorderStart = t;
    }
  }
  function sort() {
    list.sort(compare);
    isEnabled && addAllElements();
  }
  function nonCommentIncludes(str, needle) {
    let i, j, cStart, cEnd;
    for (;(i = cEnd) !== -1 && (i = str.indexOf(needle, i)) >= 0; ) if (!(i > cStart && i < cEnd)) {
      for (;(cStart = str.indexOf("/*", cEnd)) >= 0 && (cStart < i || cStart >= (j = i + needle.length) || (cStart = str.indexOf("/*", j)) >= 0) && (cEnd = str.indexOf("*/", cStart)) >= 0 && cEnd < i; ) ;
      if (cStart < 0 || cStart > i) return !0;
    }
  }
  function updateConfig(cfg) {
    exposeStyleName = cfg.name;
    nonce = cfg.nonce || nonce;
    ffCsp = !nonce && style_injector_FF;
    ({main: orderMain = {}, prio: orderPrio = {}} = cfg.order || {});
    if (!ass != !cfg.ass) {
      removeAllElements();
      ass = ass ? null : assDoc[kAss];
      ass && initAss();
      for (const s of list) s.el = createStyle(s);
      addAllElements();
    }
  }
  function updateRoot() {
    if (!runtime.id) return selfDestruct();
    if (root !== document.documentElement) {
      root = document.documentElement;
      addAllElements();
      docRootObserver.restart();
    }
    return root;
  }
  const SYM_ID = "styles";
  const kPageShow = "pageshow";
  const {parent: apply_parent} = window;
  const isFrameSameOrigin = isFrame && !!frameElement;
  const isFrameNoUrl = isFrameSameOrigin && !location.host;
  const xoEventId = `${Math.random()}`;
  const NAV_ID = "url:" + runtime.id;
  const navHub = global[NAV_ID] = new EventTarget;
  const navHubParent = isFrameNoUrl && apply_parent[NAV_ID] || null;
  let mqDark;
  let offscreen;
  let port;
  let throttled;
  let throttledCount;
  let lazyBadge = isFrame;
  let xo;
  let matchUrl;
  if (isFrameNoUrl) {
    let p = apply_parent;
    for (;!p.location.host && p.frameElement; ) p = p.parent;
    matchUrl = p.location.href.split("#", 1)[0];
  } else matchUrl = location.href;
  global[Symbol.for("xo")] = (el, cb) => {
    xo || (xo = new IntersectionObserver(onIntersect, {
      rootMargin: "100%"
    }));
    el.addEventListener(xoEventId, cb, {
      once: !0
    });
    xo.observe(el);
  };
  navHubParent?.addEventListener(NAV_ID, onUrlChanged, !0);
  TDM < 0 && (document.onprerenderingchange = e => {
    if (!runtime.id) return apply_selfDestruct();
    if (e.isTrusted) {
      TDM = 2;
      document.onprerenderingchange = null;
      getStyles({
        init: "cfg"
      }).then(apply_updateConfig);
      updateCount();
    }
  });
  onInjectorUpdate = () => {
    updateCount();
    isFrame && updateExposeIframes();
    (isFrame || own.cfg.wake) && updatePort();
  };
  selfDestruct = apply_selfDestruct;
  isFrame || (() => {
    mqDark = matchMedia("(prefers-color-scheme: dark)");
    isFrameSameOrigin || (mqDark.onchange = ({matches: m}) => {
      m !== own.cfg.dark && API.util.setSystemDark(own.cfg.dark = m);
    });
  })();
  init();
  onMessage.set(applyOnMessage, !0);
  addEventListener(kPageShow, onBFCache);
  async function init() {
    let data;
    (data = isFrameNoUrl && (typeof (val = apply_parent[apply_parent.Symbol.for(SYM_ID)]) == "object" && val ? JSON.parse(JSON.stringify(val)) : val)) ? await new Promise(onFrameElementInView) : data = getStylesViaXhr();
    var val;
    if (!runtime.id) return apply_selfDestruct();
    await applyStyles(data, !0);
  }
  async function applyStyles(data, isInitial = !own.sections) {
    data || (data = await getStyles({
      init: isInitial
    }));
    data.cfg || (data.cfg = own.cfg);
    Object.assign(own, global[Symbol.for(SYM_ID)] = data);
    isFrame || own.cfg.topUrl !== "" || (own.cfg.topUrl = location.origin);
    list.length ? apply(own, !0) : own.cfg.off || apply(own);
    toggle(!own.cfg.off);
  }
  function getStyles(opts) {
    mqDark && (opts.dark = mqDark.matches);
    return API.styles.getSectionsByUrl(matchUrl, opts);
  }
  function getStylesViaXhr() {
    try {
      const blobId = (document.cookie.split(ownId + "=")[1] || "").split(";")[0];
      if (!blobId) return;
      const url = !isXml && "blob:" + runtime.getURL(blobId);
      document.cookie = `${ownId}=1; max-age=0; SameSite=Lax`;
      if (!url || isFrameSameOrigin && frameElement.tagName === "FRAME") return;
      const xhr = new XMLHttpRequest;
      xhr.open("GET", url, !1);
      xhr.send();
      return JSON.parse(xhr.response);
    } catch {}
  }
  function applyOnMessage(req, sender, multi) {
    if (multi) {
      throttled ??= Promise.resolve().then(processThrottled) && [];
      throttled.push(req);
      return;
    }
    const {style} = req;
    switch (req.method) {
     case "ping":
      return !0;

     case "styleDeleted":
      removeId(style.id);
      break;

     case "styleUpdated":
      if (req.broadcast || !own.sections && own.cfg.off) break;
      style.enabled ? getStyles({
        id: style.id
      }).then(res => res.sections.length ? apply(res) : removeId(style.id)) : removeId(style.id);
      break;

     case "styleAdded":
      !own.sections && own.cfg.off || !style.enabled || getStyles({
        id: style.id
      }).then(apply);
      break;

     case "urlChanged":
      req.iid === 0 && updateUrl(req.url);
      break;

     case "injectorConfig":
      apply_updateConfig(req);
      break;

     case "backgroundReady":
      own.sections && updateCount();
      return !0;
    }
  }
  function processThrottled() {
    for (const req of throttled) applyOnMessage(req);
    throttled = null;
    updateCount();
  }
  function apply_updateConfig({cfg}) {
    for (const k in cfg) {
      const v = cfg[k];
      if (v !== own.cfg[k] && (isFrame || k !== "top" && k !== "topUrl")) {
        own.cfg[k] = v;
        k === "off" ? updateDisableAll() : k === "order" ? sort() : k === "top" ? updateExposeIframes() : k === "wake" ? updatePort() : updateConfig(own.cfg);
      }
    }
  }
  function updateDisableAll() {
    own.sections || own.cfg.off ? toggle(!own.cfg.off) : offscreen || init();
  }
  function updateExposeIframes() {
    const attr = "stylus-iframe";
    const el = document.documentElement;
    el && (own.cfg.top && list.length ? el.getAttribute(attr) !== own.cfg.topUrl && el.setAttribute(attr, own.cfg.topUrl) : el.hasAttribute(attr) && el.removeAttribute(attr));
  }
  function updateCount() {
    let ids, str;
    if (!(TDM < 0)) {
      isFrame && lazyBadge && performance.now() > 1e3 && (lazyBadge = !1);
      if (!throttled && throttledCount !== (str = (ids = [ ...table.keys() ]).join(","))) {
        API.styles.updateIconBadge(ids, lazyBadge, 0);
        throttledCount = str;
      }
    }
  }
  function updatePort() {
    if (own.cfg.wake || list.length) {
      if (!port && (isFrame || own.cfg.wake)) {
        port = runtime.connect({
          name: "apply"
        });
        port.onDisconnect.addListener(onPortDisconnected);
      }
    } else {
      port?.disconnect();
      port = null;
    }
  }
  function updateUrl(url) {
    if (url !== matchUrl) {
      throttledCount = matchUrl = url;
      own.sections && applyStyles(own.cfg.off && {});
      navHub.dispatchEvent(new Event(NAV_ID));
    }
  }
  function onFrameElementInView(cb) {
    apply_parent[apply_parent.Symbol.for("xo")](frameElement, cb);
    (offscreen ??= []).push(cb);
  }
  function onIntersect(entries) {
    if (!runtime.id) return apply_selfDestruct();
    for (const e of entries) if (e.intersectionRatio) {
      xo.unobserve(e.target);
      e.target.dispatchEvent(new Event(xoEventId));
    }
  }
  function onBFCache(e) {
    if (!runtime.id) return apply_selfDestruct();
    if (e.isTrusted && e.persisted) {
      throttledCount = "";
      init();
    }
  }
  function onPortDisconnected() {
    own.cfg.wake && addEventListener("mousedown", wakeUpSW, !0);
    port = null;
  }
  function wakeUpSW(e) {
    if (!runtime.id) return apply_selfDestruct();
    !port && e.target.closest("a")?.href && updatePort();
  }
  function onUrlChanged() {
    updateUrl(apply_parent.location.href);
  }
  function apply_selfDestruct() {
    removeEventListener(kPageShow, onBFCache);
    mqDark && (mqDark = mqDark.onchange = null);
    if (offscreen) for (const fn of offscreen) fn();
    TDM < 0 && (document.onprerenderingchange = null);
    removeEventListener("mousedown", wakeUpSW, !0);
    navHubParent?.removeEventListener(NAV_ID, onUrlChanged, !0);
    offscreen = null;
    shutdown();
    onMessage.delete(applyOnMessage);
    port?.disconnect();
  }
})();