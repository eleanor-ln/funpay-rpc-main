"use strict";

(() => {
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
  let bgReadying = !1;
  let TDM = 1;
  const NOP = () => {};
  function mapObj(obj, fn, keys) {
    if (!obj) return obj;
    const res = {};
    for (const k of keys || Object.keys(obj)) keys && !(k in obj) || (res[k] = fn ? fn(obj[k], k, obj) : obj[k]);
    return res;
  }
  function fetchWebDAV(url, init = {}) {
    return fetch(url, {
      ...init,
      credentials: "omit",
      headers: {
        ...init.headers,
        Authorization: `Basic ${btoa(`${this.username || ""}:${this.password || ""}`)}`
      }
    });
  }
  const COMMANDS = {
    __proto__: null
  };
  const PATH = location.pathname;
  const TTL = 3e5;
  const navLocks = navigator.locks;
  const SharedWorker = !/Apple/.test(navigator.vendor) && global.SharedWorker;
  let numJobs = 0;
  let lastBusy = 0;
  let bgLock;
  let timer;
  navLocks && navLocks.request(PATH, () => new Promise(NOP));
  navigator.serviceWorker.onmessage = function(evt, silent) {
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
      } catch (_) {
        res = void 0;
        if (_ instanceof Error) {
          delete _.origin;
          err = [ _, {
            ..._
          } ];
        } else err = [ _ ];
      }
      silent || port.postMessage({
        id,
        res,
        err
      }, portEvent._transfer);
      --numJobs || bgLock || autoClose(TTL);
      lastBusy = performance.now();
    }
  }.bind(COMMANDS);
  Object.assign(COMMANDS, {
    getWorkerPort(url) {
      const p = getWorkerPort(url);
      this._transfer = [ p ];
      return p;
    }
  });
  Object.assign(COMMANDS, {
    keepAlive(val) {
      if (val) {
        if (!bgLock) {
          timer && (timer = clearTimeout(timer));
          bgLock = navLocks.request("/sw.js", () => autoClose());
        }
      } else autoClose();
    }
  });
  function autoClose(delay) {
    !delay && bgLock && (bgLock = null);
    bgLock || numJobs || timer || (timer = setTimeout(close, delay ||= Math.max(0, lastBusy + TTL - performance.now())));
  }
  function getWorkerPort(url, onerror) {
    let worker;
    if (SharedWorker) {
      worker = new SharedWorker(url, "Stylus");
      onerror && (worker.onerror = onerror);
      return worker.port;
    }
    if (!worker) {
      worker = global._worker = new global.Worker(url);
      onerror && (worker.onerror = onerror);
    }
    return initChannelPort(worker, null);
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
  let webdavInstance;
  Object.assign(COMMANDS, {
    isDark: () => matchMedia("(prefers-color-scheme:dark)").matches,
    createObjectURL: URL.createObjectURL,
    revokeObjectURL: URL.revokeObjectURL,
    webdav: (cmd, ...args) => webdavInstance[cmd](...args),
    webdavInit: async cfg => {
      webdavInstance || await new Promise((resolve, reject) => document.head.appendChild(Object.assign(document.createElement("script"), {
        src: "js/webdav.js",
        onload: resolve,
        onerror: reject
      })));
      cfg.fetch = fetchWebDAV.bind(cfg);
      cfg.getAccessToken = () => API.sync.getToken("webdav");
      webdavInstance = global.webdav(cfg);
      return mapObj(webdavInstance, v => typeof v == "function" ? null : v);
    }
  });
})();