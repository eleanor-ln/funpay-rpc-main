"use strict";

this["hook-uso.js"] !== 1 && (() => {
  this["hook-uso.js"] = 1;
  const pageId = `${performance.now()}${Math.random()}`;
  const STATE_EVENTS = [ [ "uninstalled", "styleCanBeInstalledChrome" ], [ "canBeUpdate", "styleCanBeUpdatedChrome" ], [ "installed", "styleAlreadyInstalledChrome" ] ];
  const getUsoId = () => Number(location.pathname.match(/^\/styles\/(\d+)|$/)[1]);
  let gesture = NaN;
  let pageLoading;
  addEventListener("stylus-uso", () => dispatchEvent(new CustomEvent("stylus-uso*", {
    detail: pageId
  })), {
    once: !0
  });
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