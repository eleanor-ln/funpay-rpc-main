"use strict";

this["hook-uso.js"] !== 1 && (() => {
  this["hook-uso.js"] = 1;
  const pageId = `${performance.now()}${Math.random()}`;
  const STATE_EVENTS = [ [ "uninstalled", "styleCanBeInstalledChrome" ], [ "canBeUpdate", "styleCanBeUpdatedChrome" ], [ "installed", "styleAlreadyInstalledChrome" ] ];
  const getUsoId = () => Number(location.pathname.match(/^\/styles\/(\d+)|$/)[1]);
  let gesture = NaN;
  let pageLoading;
  ((fn, ...args) => {
    const div = document.createElement("div");
    div.attachShadow({
      mode: "closed"
    }).appendChild(document.createElement("script")).textContent = `(${fn})(${JSON.stringify(args).slice(1, -1)})`;
    document.documentElement.appendChild(div).remove();
  })(eventId => {
    let orphaned;
    window.chrome || (window.chrome = {});
    chrome.runtime || (chrome.runtime = {
      sendMessage: () => {}
    });
    const EXT_ID = "fjnbnpbmkenffdnngjfgmeleoegfcffe";
    const {call, defineProperty} = Object;
    const {dispatchEvent, CustomEvent, Promise, Response, removeEventListener} = window;
    const getDetail = call.bind(Object.getOwnPropertyDescriptor(CustomEvent.prototype, "detail").get);
    const apply = call.bind(Object.apply);
    const mathRandom = Math.random;
    const promiseResolve = async val => val;
    const startsWith = call.bind("".startsWith);
    const callbacks = {
      __proto__: null
    };
    const OVR = [ [ chrome.runtime, "sendMessage", (fn, me, args) => {
      if (args[0] !== EXT_ID) return apply(fn, me, args);
      const msg = args[1];
      let cb = args[args.length - 1];
      let res;
      typeof cb != "function" && (res = new Promise(resolve => cb = resolve));
      send("msg", msg, cb);
      return res;
    } ], [ window, "fetch", (fn, me, args) => startsWith(`${args[0]}`, `chrome-extension://${EXT_ID}/`) ? promiseResolve(new Response('<!doctype html><html lang="en"></html>')) : apply(fn, me, args) ] ];
    for (let i = 0; i < OVR.length; i++) {
      const [obj, name, caller] = OVR[i];
      const orig = obj[name];
      const ovr = new Proxy(orig, {
        __proto__: null,
        apply(fn, me, args) {
          orphaned && restore(obj, name, ovr, fn);
          return (orphaned ? apply : caller)(fn, me, args);
        }
      });
      defineProperty(obj, name, {
        value: ovr
      });
      OVR[i] = [ obj, name, ovr, orig ];
    }
    addEventListener(eventId, function onCommand(e) {
      let v = getDetail(e);
      if (v.cmd === "quit") {
        orphaned = !0;
        removeEventListener(eventId, onCommand, !0);
        for (v = 0; v < OVR.length; v++) restore(OVR[v]);
      } else {
        callbacks[v.id](v.data);
        delete callbacks[v.id];
      }
    }, !0);
    window.isInstalled = !0;
    function restore(obj, name, ovr, orig) {
      obj[name] === ovr && defineProperty(obj, name, {
        __proto__: null,
        value: orig
      });
    }
    function send(cmd, data, cb) {
      let id;
      cb && (callbacks[id = mathRandom()] = cb);
      dispatchEvent(new CustomEvent(eventId + "*", {
        __proto: null,
        detail: {
          id,
          cmd,
          data
        }
      }));
    }
  }, pageId);
  addEventListener("click", onGesture, !0);
  addEventListener("keydown", onGesture, !0);
  addEventListener(pageId + "*", onPageEvent, !0);
  addEventListener(chrome.runtime.id, function orphanCheck(e) {
    if (chrome.runtime.id) return !0;
    removeEventListener(e.type, orphanCheck, !0);
    removeEventListener(pageId + "*", onPageEvent, !0);
    removeEventListener("click", onGesture, !0);
    removeEventListener("keydown", onGesture, !0);
    sendPageEvent({
      cmd: "quit"
    });
  }, !0);
  if (pageLoading = !document.head && location.href) {
    addEventListener("DOMContentLoaded", () => {
      postMessage({
        direction: "from-content-script",
        message: "StylishInstalled"
      }, "*");
    }, {
      once: !0
    });
    addEventListener("load", () => {
      pageLoading = "";
    }, {
      once: !0
    });
  }
  function onGesture(e) {
    e.isTrusted && (gesture = performance.now());
  }
  function isTrusted(data) {
    return pageLoading === location.href || performance.now() - gesture < 1e3 || console.warn("Stylus is ignoring request not initiated by the user:", data);
  }
  async function onPageEvent({detail: {id, cmd, data}}) {
    if (cmd === "msg") {
      let res = !0;
      switch (data.type) {
       case "stylishUpdateChrome":
       case "stylishInstallChrome":
        isTrusted(data) && await API.uso.toUsercss(getUsoId(), data.customOptions || {});
        res = {
          success: !0
        };
        gesture = NaN;
        break;

       case "deleteStylishStyle":
        isTrusted(data) && (res = await API.uso.deleteStyle(getUsoId()));
        gesture = NaN;
        break;

       case "getStyleInstallStatus":
        isTrusted(data) && (res = (await getStyleState() || [])[0]);
        break;

       case "GET_OPEN_TABS":
       case "GET_TOP_SITES":
        res = [];
      }
      sendPageEvent({
        id,
        data: res
      });
    }
  }
  async function getStyleState(usoId = getUsoId()) {
    return STATE_EVENTS[usoId ? await API.uso.getUpdatability(usoId) : -1];
  }
  function sendPageEvent(data) {
    typeof cloneInto == "function" && (data = cloneInto(data, document));
    dispatchEvent(new CustomEvent(pageId, {
      detail: data
    }));
  }
})();