"use strict";

if (typeof window.oldCode != "string") {
  window.oldCode = (document.querySelector("body > pre") || document.body).textContent;
  chrome.runtime.onConnect.addListener(port => {
    if (port.name === "downloadSelf") {
      port.onMessage.addListener(async ({id, force}) => {
        const msg = {
          id
        };
        try {
          const code = await (await fetch(location.href, {
            mode: "same-origin"
          })).text();
          (code !== window.oldCode || force) && (msg.code = window.oldCode = code);
        } catch (_) {
          msg.error = _.message || `${_}`;
        }
        port.postMessage(msg);
      });
      addEventListener("pagehide", () => port.disconnect(), {
        once: !0
      });
    }
  });
}

oldCode;