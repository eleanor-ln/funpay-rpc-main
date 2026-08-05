"use strict";

(() => {
  const global = this;
  (self.webpackChunkStylus = self.webpackChunkStylus || []).push([ [ "install-usercss" ], {
    9050(_, ee, oe) {
      oe(9073);
      var cm = oe(8745);
      var cmpver = oe(9421);
      var dom = oe(7986);
      var dom_util = oe(6518);
      var localization = oe(7501);
      var msg_api = oe(4930);
      var prefs = oe(492);
      var style_util = oe(8660);
      var target_icons = oe(7046);
      var urls = oe(8982);
      var util = oe(6940);
      var util_webext = oe(1480);
      oe(8970);
      function DirectDownloader(url) {
        const opts = {
          headers: {
            "Cache-Control": "no-cache, no-store"
          }
        };
        let oldCode = null;
        return async () => {
          const code = await util.fetchText(url, opts);
          if (oldCode !== code) {
            oldCode = code;
            return code;
          }
        };
      }
      const CFG_SEL = "#message-box.config-dialog";
      let cfgShown = !0;
      let install_usercss_cm;
      let fsh;
      let fso;
      let getData;
      let initialUrl;
      let style;
      let installed;
      let dup;
      let liveReload;
      let liveReloadEnabled = !1;
      let sectionsPromise;
      let tabId;
      let vars;
      document.on("visibilitychange", () => {
        dom.$$remove("#message-box:not(.config-dialog)");
        installed && liveReload();
      });
      setTimeout(() => !install_usercss_cm && dom_util.showSpinner(document.getElementById("header")), 200);
      (async () => {
        const {hash} = location;
        if (hash) {
          util.urlParams.set("updateUrl", initialUrl = hash.slice(1));
          history.replaceState(null, "", location.pathname + "?" + util.urlParams);
        }
        fsh = window.fsh;
        tabId = +(util.urlParams.get("tabId") || -1);
        initialUrl ??= fsh ? fsh._url : util.urlParams.get("updateUrl");
        let firstGet;
        if (fsh) {
          let oldCode = null;
          getData = async () => {
            const code = await (await fsh.getFile()).text();
            if (oldCode !== code) return oldCode = code;
          };
          firstGet = getData();
        } else if (initialUrl) {
          if (tabId < 0) {
            getData = DirectDownloader(initialUrl);
            firstGet = msg_api.API.usercss.getInstallCode(initialUrl).then(code => code || getData()).catch(getData);
          }
        } else history.length > 1 ? history.back() : util_webext.closeCurrentTab();
        const hasFileAccessP = browser.extension.isAllowedFileSchemeAccess();
        const elSettings = localization.template.styleSettings;
        elSettings.$("#ss-update-url").closest("div").remove();
        elSettings.$(".buttons").remove();
        document.querySelector(".settings").append(elSettings);
        let error, sourceCode;
        try {
          sourceCode = await firstGet;
          ({dup, style} = await msg_api.API.usercss.build(sourceCode, {
            dup: !0,
            metaOnly: !0
          }));
          sectionsPromise = msg_api.API.usercss.buildCode(style);
        } catch (_) {
          error = _;
        }
        liveReload = initLiveReload();
        const [hasFileAccess] = await Promise.all([ hasFileAccessP, prefs.ready ]);
        if (!style && sourceCode == null) {
          dom_util.messageBox.alert(isNaN(error) ? `${error}` : "HTTP Error " + error, "pre");
          return;
        }
        const theme = prefs.__values[cm.THEME_KEY];
        cm.loadCmTheme(theme);
        install_usercss_cm = cm.CodeMirror(document.querySelector(".main"), {
          value: sourceCode || style.sourceCode,
          readOnly: !0,
          colorpicker: !0,
          theme
        });
        window.on("resize", adjustCodeHeight);
        error && showBuildError(error);
        if (!style) return;
        const data = style.usercssData;
        const dupData = dup && dup.usercssData;
        const versionTest = dup && (0, cmpver.default)(data.version, dupData.version);
        updateMeta();
        dup ? (document.querySelector(`[name="ss-scheme"][value="${dup.preferScheme}"]`) || {}).checked = !0 : document.querySelector(".live-reload span").textContent = util.t("liveReloadAfterInstall");
        for (let type of [ "in", "ex" ]) {
          const el = document.getElementById("ss-" + (type += "clusions"));
          const list = dup && dup[type] || [];
          el.value = list.join("\n") + (list[0] ? "\n" : "");
          el.rows = list.length + 2;
          el.onchange = () => {
            style[type] = el.value.split(/\n/).map(s => s.trim()).filter(Boolean);
          };
        }
        versionTest < 0 && document.querySelector("h1").after(dom.$create(".warning", util.t("versionInvalidOlder")));
        document.querySelector("button.install").onclick = () => {
          shouldShowConfig();
          (dup ? dom_util.messageBox.confirm(dom.$create("span", util.t("styleInstallOverwrite", [ data.name + (dup.customName ? ` (${dup.customName})` : ""), dupData.version, data.version ]))) : Promise.resolve(!0)).then(ok => ok && msg_api.API.usercss.install(style).then(install).catch(err => dom_util.messageBox.alert(util.t("styleInstallFailed", err.message || err), "pre")));
        };
        const checker = document.querySelector(".set-update-url input[type=checkbox]");
        const updateUrl = util.tryURL(style.updateUrl || initialUrl || dup && dup.updateUrl);
        if (updateUrl) {
          if (dup && dup.updateUrl === updateUrl.href) {
            checker.checked = !0;
            checker.disabled = !0;
          } else if (updateUrl.protocol !== "file:" || hasFileAccess) {
            checker.checked = !0;
            style.updateUrl = updateUrl.href;
          }
        } else checker.disabled = !0;
        checker.onchange = () => {
          style.updateUrl = checker.checked ? updateUrl.href : null;
        };
        checker.onchange();
        document.querySelector(".set-update-url p").textContent = util.clipString(updateUrl.href || "", 300);
        document.getElementById("ss-scheme").onchange = e => {
          style.preferScheme = e.target.value;
        };
        !initialUrl || urls.isLocalhost(initialUrl) ? document.querySelector(".live-reload input").onchange = liveReload : document.querySelector(".live-reload").remove();
      })();
      function updateMeta(newStyle) {
        if (newStyle) {
          Object.assign(style, newStyle);
          for (const k in style) k in newStyle || delete style[k];
        }
        const data = style.usercssData;
        const dupData = dup && dup.usercssData;
        const versionTest = dup && (0, cmpver.default)(data.version, dupData.version);
        install_usercss_cm.setPreprocessor(data);
        const installButtonLabel = util.t(installed ? "installButtonInstalled" : dup ? versionTest > 0 ? "installButtonUpdate" : "installButtonReinstall" : "installButton");
        document.title = `${installButtonLabel} ${data.name}`;
        document.querySelector(".install").textContent = installButtonLabel;
        document.querySelector(".install").classList.add(installed ? "installed" : dup ? versionTest > 0 ? "update" : "reinstall" : "install");
        dup && dup.updateUrl && (document.querySelector(".set-update-url").title = util.t("installUpdateFrom", dup.updateUrl).replace(/\S+$/, "\n$&"));
        document.querySelector(".meta-name").textContent = data.name;
        document.querySelector(".meta-version").textContent = data.version;
        document.querySelector(".meta-description").textContent = data.description;
        document.querySelectorAll("#ss-scheme input").forEach(el => {
          el.checked = el.value === (style.preferScheme || "none");
        });
        replaceChildren(document.querySelector(".meta-author"), (text => {
          const match = text && text.match(/^(.+?)(?:\s+<(.+?)>)?(?:\s+\((.+?)\))?$/);
          if (!match) return text;
          const [, name, email, url] = match;
          const elems = [];
          elems.push(email ? dom.$createLink(`mailto:${email}`, name) : dom.$create("span", name));
          url && elems.push(dom.$createLink(url, dom.$create("i.i-external")));
          return elems;
        })(data.author), !0);
        replaceChildren(document.querySelector(".meta-license"), data.license, !0);
        replaceChildren(document.querySelector(".external-link"), (() => {
          const urls = [ data.homepageURL && [ data.homepageURL, util.t("externalHomepage") ], data.supportURL && [ data.supportURL, util.t("externalSupport") ] ];
          return (data.homepageURL || data.supportURL) && dom.$create("div", [ dom.$create("h3", util.t("externalLink")), dom.$create("ul", urls.map(args => args && dom.$create("li", dom.$createLink(...args))).filter(Boolean)) ]);
        })());
        renderTargetSites();
        Object.assign(document.querySelector(".configure-usercss"), {
          hidden: !data.vars,
          onclick: openConfigDialog
        });
        if (data.vars) {
          if (!util.deepEqual(data.vars, vars)) {
            vars = data.vars;
            for (const [dk, dv] of Object.entries(dup && dupData.vars || {})) {
              const v = vars[dk];
              v && v.type === dv.type && (v.value = dv.value);
            }
          }
        } else {
          cfgShown = !1;
          dom.$$remove(CFG_SEL);
        }
        shouldShowConfig() && openConfigDialog();
        document.getElementById("header").dataset.arrivedFast = performance.now() < 500;
        document.getElementById("header").classList.add("meta-init");
        document.getElementById("header").classList.remove("meta-init-error");
        setTimeout(() => dom.$$remove(".lds-spinner"), 1e3);
        showError("");
        requestAnimationFrame(adjustCodeHeight);
        dup && enablePostActions();
        function openConfigDialog() {
          dom_util.configDialog(style);
        }
      }
      function showError(err) {
        document.querySelector(".warnings").textContent = "";
        document.querySelector(".warnings").classList.toggle("visible", Boolean(err));
        document.body.classList.toggle("has-warnings", Boolean(err));
        if ((err = Array.isArray(err) ? err : [ err ])[0]) {
          let i;
          if ((i = err[0].index) >= 0 || (i = err[0].offset) >= 0) {
            install_usercss_cm.jumpToPos(install_usercss_cm.posFromIndex(i));
            install_usercss_cm.setSelections(err.map(e => {
              const pos = e.index >= 0 && install_usercss_cm.posFromIndex(e.index) || e.offset >= 0 && {
                line: e.line - 1,
                ch: e.col - 1
              };
              return pos && {
                anchor: pos,
                head: pos
              };
            }).filter(Boolean));
            install_usercss_cm.focus();
          }
          document.querySelector(".warnings").appendChild(dom.$create(".warning", [ util.t("parseUsercssError"), "\n", ...err.map(e => e.message ? dom.$create("pre", e.message) : e || "Unknown error") ]));
        }
        adjustCodeHeight();
      }
      function showBuildError(error) {
        document.getElementById("header").classList.add("meta-init-error");
        console.error(error);
        showError(error);
      }
      function install(res) {
        installed = res;
        dom.$$remove(".warning");
        document.querySelector("button.install").disabled = !0;
        document.querySelector("button.install").classList.add("installed");
        document.getElementById("live-reload-install-hint").hidden = !liveReloadEnabled;
        document.querySelector(".set-update-url").title = style.updateUrl ? util.t("installUpdateFrom", style.updateUrl) : "";
        document.querySelectorAll(".install-disable input").forEach(el => el.disabled = !0);
        document.body.classList.add("installed");
        enablePostActions();
        updateMeta(res);
        liveReloadEnabled && liveReload();
      }
      function enablePostActions() {
        const {id} = installed || dup;
        util.sessionStore.justEditedStyleId = id;
        document.getElementById("edit").search = `?id=${id}`;
        document.getElementById("delete").onclick = async () => {
          if (await dom_util.messageBox.confirm(util.t("deleteStyleConfirm"), "danger", util.t("confirmDelete"))) {
            await msg_api.API.styles.remove(id);
            tabId < 0 && history.length > 1 ? history.back() : util_webext.closeCurrentTab();
          }
        };
      }
      async function renderTargetSites() {
        if (sectionsPromise) try {
          style.sections = (await sectionsPromise).sections;
        } catch (_) {
          showBuildError(_);
          return;
        } finally {
          sectionsPromise = null;
        }
        let numGlobals = 0;
        let targets = new Set;
        const TYPES = [ "domains", "urls", "urlPrefixes", "regexps" ];
        const favs = prefs.__values["manage.newUI.favicons"];
        const elParent = document.querySelector(".applies-to");
        const el = document.createElement("li");
        favs && (el.appendChild(document.createElement("img")).loading = "lazy");
        el.className = "target";
        el.append("");
        for (const section of style.sections) {
          if (style_util.styleCodeEmpty(section)) continue;
          let hasTargets;
          for (let arr, val, i = 0; i < TYPES.length; i++) {
            arr = section[TYPES[i]];
            if (arr) for (val of arr) val && (hasTargets = targets.add(i + val));
          }
          numGlobals += !hasTargets;
        }
        targets = [ ...targets ].sort();
        !numGlobals && targets.length || targets.unshift(" " + util.t("appliesToEverything"));
        for (let val, i = 0; val = targets[i]; i++) {
          el.dataset.type = TYPES[+val[0]].slice(0, -1);
          el.lastChild.nodeValue = val.slice(1);
          targets[i] = el.cloneNode(!0);
        }
        elParent.append(...targets);
        favs && target_icons.renderTargetIcons(elParent);
        prefs.subscribe("manage.newUI.favicons", (key, val) => {
          val && target_icons.renderTargetIcons(elParent);
        });
      }
      function adjustCodeHeight() {
        const scroller = install_usercss_cm.display.scroller;
        const prevWindowHeight = adjustCodeHeight.prevWindowHeight;
        if (scroller.scrollHeight === scroller.clientHeight || prevWindowHeight && window.innerHeight !== prevWindowHeight) {
          adjustCodeHeight.prevWindowHeight = window.innerHeight;
          install_usercss_cm.setSize(null, document.querySelector(".main").offsetHeight - document.querySelector(".warnings").offsetHeight);
        }
      }
      function initLiveReload() {
        let timer = !0;
        let sequence = Promise.resolve();
        return e => {
          e && (liveReloadEnabled = e.target.checked);
          if (installed || dup) {
            liveReloadEnabled ? start({
              force: !0
            }) : timer ? timer = clearTimeout(timer) : fso && fso.disconnect();
            document.querySelector(".install").disabled = liveReloadEnabled;
            Object.assign(document.getElementById("live-reload-install-hint"), {
              hidden: !liveReloadEnabled,
              textContent: util.t("liveReloadInstallHint" + (tabId >= 0 ? "FF" : ""))
            });
          }
        };
        async function check(opts) {
          try {
            (code = await getData(opts)) != null && (sequence = sequence.catch(console.error).then(() => {
              const {id} = installed || dup;
              const scrollInfo = install_usercss_cm.getScrollInfo();
              const cursor = install_usercss_cm.getCursor();
              install_usercss_cm.setValue(code);
              install_usercss_cm.setCursor(cursor);
              install_usercss_cm.scrollTo(scrollInfo.left, scrollInfo.top);
              return msg_api.API.usercss.install({
                id,
                sourceCode: code
              }).then(updateMeta).catch(showError);
            }));
          } catch (_) {
            console.warn(util.t("liveReloadError", _));
          }
          var code;
          timer && (timer = setTimeout(check, 500));
        }
        async function start(opts) {
          if (fsh && (fso || (fso = global.FileSystemObserver) && (fso = new fso(() => util.debounce(check, 20))))) try {
            await fso.observe(fsh);
            timer = !1;
          } catch {
            timer = !0;
          }
          check(opts);
        }
      }
      function shouldShowConfig() {
        const prev = cfgShown;
        cfgShown = document.querySelector(CFG_SEL) != null;
        return prev && !cfgShown;
      }
      function replaceChildren(el, children, toggleParent) {
        el.firstChild && (el.textContent = "");
        children && el.append(...Array.isArray(children) ? children : [ children ]);
        toggleParent && (el.parentNode.hidden = !el.firstChild);
      }
    }
  }, _ => {
    _.O(0, [ "color", "codemirror", "dlg_config-dialog_css-css_dom-error_css-css_global-dark_css-css_global_css-css_onoffswitch_cs-7b17ff" ], () => _(_.s = 9050));
    _.O();
  } ]);
})();