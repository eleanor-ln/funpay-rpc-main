"use strict";

(self.webpackChunkStylus = self.webpackChunkStylus || []).push([ [ "options" ], {
  4126(_, ee, oe) {
    oe(2431);
    oe(5682);
    var dom = oe(9298);
    var dom_prefs = oe(113);
    var dom_util = oe(4777);
    var localization = oe(9293);
    var msg_api = oe(1154);
    oe(4318);
    var prefs = oe(2956);
    var ua = oe(9818);
    var urls = oe(7766);
    var util = oe(2076);
    var util_webext = oe(5288);
    var msg = oe(4931);
    var sync_util = oe(6908);
    (async () => {
      let {sync: status, syncOpts} = await prefs.clientData;
      const elSync = document.querySelector(".sync-options");
      const elCloud = elSync.$(".cloud-name");
      const elToggle = elSync.$(".connect");
      const elSyncNow = elSync.$(".sync-now");
      const elStatus = elSync.$(".sync-status");
      const elLogin = elSync.$(".sync-login");
      const elDriveOptions = elSync.$$(".drive-options");
      const $$driveOptions = () => elSync.$$(`[data-drive="${elCloud.value}"] [data-option]`);
      elCloud.append(...Object.entries(sync_util.DRIVE_NAMES).map(([id, name]) => dom.$create("option", {
        value: id
      }, name)));
      updateButtons();
      msg.onMessage.set(e => {
        e.method === "syncStatusUpdate" && setStatus(e.status);
      });
      elCloud.on("change", updateButtons);
      elToggle.onclick = async () => {
        if (elToggle.dataset.cmd === "start") {
          await msg_api.API.sync.setDriveOptions(elCloud.value, getDriveOptions());
          await msg_api.API.sync.start(elCloud.value);
        } else await msg_api.API.sync.stop();
      };
      elSyncNow.onclick = msg_api.API.sync.syncNow;
      elLogin.onclick = async () => {
        await msg_api.API.sync.login();
        await msg_api.API.sync.syncNow();
      };
      function getDriveOptions() {
        const result = {};
        for (const el of $$driveOptions()) result[el.dataset.option] = el.value;
        return result;
      }
      function setStatus(newStatus) {
        status = newStatus;
        updateButtons();
      }
      async function updateButtons(evt) {
        const state = status.state;
        const isConnected = state === "connected";
        const off = state === "disconnected";
        const drv = status.drive;
        drv && (elCloud.value = drv);
        elCloud.disabled = !off;
        elToggle.disabled = status.syncing;
        elToggle.textContent = util.t("optionsSync" + (off ? "Connect" : "Disconnect"));
        elToggle.dataset.cmd = off ? "start" : "stop";
        elSyncNow.disabled = !isConnected || status.syncing || !status.login;
        elStatus.textContent = sync_util.getStatusText(status, !0);
        elLogin.hidden = !isConnected || status.login;
        for (const el of elDriveOptions) {
          el.hidden = el.dataset.drive !== elCloud.value;
          el.disabled = !off;
        }
        dom.$toggleDataset(elSync, "enabled", !!drv || off && elCloud.value !== "none");
        syncOpts != null || (syncOpts = await msg_api.API.sync.getDriveOptions(elCloud.value));
        for (const el of $$driveOptions()) el.value = syncOpts[el.dataset.option] || "";
        evt && !drv && prefs.set("sync.enabled", "none");
        syncOpts = null;
      }
    })();
    var ae;
    document.querySelectorAll("input[min], input[max]").forEach(element => {
      const min = Number(element.min);
      const max = Number(element.max);
      const doNotify = () => element.dispatchEvent(new Event("change", {
        bubbles: !0
      }));
      const onChange = ({type}) => {
        if (type === "input" && element.checkValidity()) doNotify(); else if (type === "change" && !element.checkValidity()) {
          element.value = util.clamp(Number(element.value), min, max);
          doNotify();
        }
      };
      element.on("change", onChange);
      element.on("input", onChange);
    });
    location.hash === "#sync-styles" && document.querySelector(".cloud-name").focus();
    document.querySelector("#FOUC .items").textContent = util.t("optionFOUCMV2", [ util.t("optionsAdvancedStyleViaXhr"), util.t("optionKeepAlive") ]);
    document.getElementById("keepAlive").previousElementSibling.firstChild.textContent += (/^(zh|ja|ko)/.test(dom.$root.lang) ? "" : " ") + util.t("optionKeepAlive2").trim();
    document.querySelector("#favs-note").title = util.t("optionTargetIconsNote", util.getHost(urls.favicon("")));
    document.querySelector("#installer-note").dataset.title = util.t("optionsUrlInstallerNote", [ urls.usw + "explore", urls.usoa + "browse/categories", "https://greasyfork.org/scripts?language=css" ].map(u => `<a href="${u}">${util.getHost(u)}</a>`).join(", "));
    window.on("keydown", event => {
      dom_util.getEventKeyName(event) === "Escape" && tellTopToCloseOptions();
    });
    top.on("beforeunload", () => {
      var _;
      (_ = document.activeElement) == null || _.blur();
    });
    document.querySelector("header i").onclick = tellTopToCloseOptions;
    document.getElementById("manage").onclick = () => {
      top === window ? closeOrGoBack() : msg_api.API.tabs.openManager();
    };
    document.getElementById("manage.newUI.favicons").onclick = () => {
      msg_api.API.prefsDB.delete("badFavs");
    };
    document.getElementById("shortcuts").onclick = () => {
      if (ua.FIREFOX) {
        var _, ee;
        (_ = browser.commands) != null && (ee = _.openShortcutSettings) != null && ee.call(_) || customizeHotkeys();
      } else msg_api.API.tabs.open({
        url: (ua.OPERA ? "opera://settings" : "chrome://extensions") + "/configureCommands"
      });
    };
    document.getElementById("shortcuts").hidden = ua.FIREFOX && !((ae = browser.commands) != null && ae.update);
    document.getElementById("reset").onclick = async () => {
      if (await dom_util.messageBox.confirm(util.t("confirmDiscardChanges"))) for (const el of document.querySelectorAll("input")) {
        const id = el.id || el.name;
        prefs.knownKeys.includes(id) && prefs.reset(id);
      }
    };
    {
      const t1 = util.t("optionsAdvancedSitesNote");
      const t2 = util.t("sitesNoteRe");
      localization.template.sites.$("a").dataset.title = `${t1.replace(/(?:^|\n)<.+(?=\n|$)/g, "").trim()}<table>${t1.replace(/(?:^|\n)[^<].+(?=\n|$)/g, "").replace(/^<([^>]+)>(.+)/gm, (_, a, b) => `<tr><td><code>${a}</code></td><td>${b}</td></tr>`)}</table>\n${t2.replace(/<([^>]+)>/g, "<code>$1</code>")}`;
    }
    for (const el of document.querySelectorAll("[data-clickable]")) {
      const parts = el.textContent.split(new RegExp(`(${el.dataset.clickable})(?=\\W)`, "g"));
      parts && el.firstChild.replaceWith(...parts.map((p, i) => i % 2 ? dom.$create("span.clickable", {
        onclick: clickableValue
      }, p) : p));
    }
    dom_prefs.setupConditionalPrefs(({el}, id, mode) => {
      mode === "radio" && el.$("input").on("click", {
        handleEvent: toggleAlter,
        id
      });
      if (el.matches(".sites")) {
        el.appendChild(localization.template.sites.cloneNode(!0));
        for (const elDep of el.$$('[id*="$"]')) {
          elDep.id = elDep.id.replace("$", id);
          if (elDep.localName === "textarea") {
            elDep.on("keydown", onTextKey);
            elDep.on("input", onTextInput);
            onTextInput.call(elDep);
          }
        }
      }
    });
    util_webext.browserSidebar && dom.$rootCL.add("has-sidebar");
    dom_prefs.setupLivePrefs();
    (async () => {
      const {wrb} = await prefs.clientData;
      if (wrb) return;
      const id = chrome.runtime.id;
      const title = util.t("webRequestBlockingMV3Note", [ '<a href="https://chromeenterprise.google/policies/?policy=ExtensionInstallForcelist">ExtensionInstallForcelist</a>', `<code>${id}</code>`, `<nobr><code>--allowlisted-extension-id=${id}</code></nobr>` ]);
      const icon = dom.$create("a.broken[data-cmd=note]", {
        title,
        tabIndex: 0
      }, "⚒");
      icon.dataset.title = title;
      for (const el of document.querySelectorAll(".webRequestBlocking")) {
        el.classList.add("disabled");
        el.$("p").append(icon.isConnected ? icon.cloneNode(!0) : icon);
      }
    })();
    function clickableValue() {
      dom_util.setInputValue(this.closest("label").$("input"), this.textContent);
    }
    function customizeHotkeys() {
      const CTRL = ua.MAC ? "metaKey" : "ctrlKey";
      const SKIP = [ "Control", "Alt", "Shift", "Meta", "CapsLock", "Tab", "Escape", "OS" ];
      dom_util.messageBox.alert(localization.template.shortcutsFF.cloneNode(!0), "", util.t("shortcutsNote"), {
        className: "center-dialog pre-line",
        onshow(box) {
          const inputs = box.$$("input");
          for (const el of inputs) el.onkeydown = onInput;
          dom_prefs.setupLivePrefs(inputs);
        }
      });
      async function onInput(evt) {
        if (SKIP.includes(evt.key)) return;
        evt.preventDefault();
        const key = (evt[CTRL] ? "Ctrl+" : "") + (evt.altKey ? "Alt+" : "") + (evt.shiftKey ? "Shift+" : "") + evt.key.slice(0, 1).toUpperCase() + evt.key.slice(1);
        const el = evt.target;
        const name = el.id.split(".")[1];
        const shortcut = el.value = key === "Delete" || key === "Backspace" ? "" : key;
        let err;
        if (shortcut) try {
          await browser.commands.update({
            name,
            shortcut
          });
        } catch (_) {
          err = _;
        } else browser.commands.reset(name).catch(util.NOP);
        el.setCustomValidity(err || "");
        err || el.dispatchEvent(new Event("change", {
          bubbles: !0
        }));
      }
    }
    function onTextInput() {
      const rows = this.value.match(/^/gm).length;
      this.rows !== rows && (this.rows = rows);
    }
    function onTextKey(e) {
      if (e.key === "s" && e.metaKey === ua.MAC && e.ctrlKey === !ua.MAC && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        this.dispatchEvent(new Event("change"));
      }
    }
    function toggleAlter(evt) {
      evt.target.checked && document.getElementById(this.id).checked && document.getElementById(this.id).click();
    }
    function tellTopToCloseOptions() {
      top === window ? closeOrGoBack() : top.closeOptions();
    }
    function closeOrGoBack() {
      history.length > 1 ? history.back() : close();
    }
  }
}, _ => {
  _.O(0, [ "color", "dlg_config-dialog_css-css_dom-error_css-css_global-dark_css-css_global_css-css_onoffswitch_cs-1e56de" ], () => _(_.s = 4126));
  _.O();
} ]);