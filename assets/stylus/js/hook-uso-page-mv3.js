"use strict";

this["hook-uso-page-mv3.js"] !== 1 && (() => {
  this["hook-uso-page-mv3.js"] = 1;
  function hookUsoPage(eventId) {
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
  }
  addEventListener("stylus-uso*", e => hookUsoPage(e.detail), {
    once: !0
  });
  dispatchEvent(new Event("stylus-uso"));
})();