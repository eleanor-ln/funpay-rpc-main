"use strict";

if (window.INJECTED_GREASYFORK !== 1) {
  window.INJECTED_GREASYFORK = 1;
  addEventListener("message", async function onMessage(e) {
    if (e.origin === location.origin && e.data && e.data.name && e.data.type === "style-version-query") {
      removeEventListener("message", onMessage);
      postMessage({
        type: "style-version",
        version: await API.usercss.getVersion(e.data)
      }, "*");
    }
  });
}