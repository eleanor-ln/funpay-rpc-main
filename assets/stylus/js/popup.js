"use strict";

(self.webpackChunkStylus = self.webpackChunkStylus || []).push([ [ "popup" ], {
  3220(_, ee, oe) {
    ee.configure = configure;
    ee.openEditor = openEditor;
    ee.openStyleFinder = openStyleFinder;
    ee.openURLandHide = openURLandHide;
    oe.d(ee, {});
    oe(7986);
    var le = oe(6518);
    var ae = oe(7501);
    var ue = oe(3619);
    var pe = oe(4930);
    var ye = oe(492);
    var fe = oe(8970);
    var he = oe(6940);
    var Se = oe(1480);
    var Ie = oe(8825);
    var $e = oe(6598);
    var xe = oe(4222);
    var Ce = oe(9609);
    const selConfig = ".configure";
    const selEdit = ".style-edit-link";
    const selFinder = "#find-styles-btn";
    const selManager = "#popup-manage-button";
    const selOptions = "#options-btn";
    const selUnstylable = "#unstylable";
    const EntryClick = {
      input: nameRouter,
      ".style-name": Object.assign(nameRouter, {
        btn: 3
      }),
      [selConfig]: Object.assign(configure, {
        btn: 3
      }),
      ".menu-button": Object.assign((event, entry) => xe.openMenu(entry), {
        btn: 2
      }),
      [selEdit]: openEditor
    };
    const GlobalClick = {
      'a[href*="edit.html"]': openEditor,
      [selFinder]: openStyleFinder,
      [selManager]: openManager,
      [selOptions]: (event, entry, button) => Se.openDashboard(null, button === 2, close, {
        windowId: Ie.windowId
      })
    };
    const styleFinder = {};
    const tSideHint = "\n" + he.t("popupSidePanelOpenHint");
    const pSideConfig = "popup.sidePanel.config";
    const pSideFinder = "popup.sidePanel.finder";
    const pSideEditor = "popup.sidePanel.editor";
    const sideTitleMap = {
      [pSideEditor]: selEdit + ", #write-wrapper a",
      "popup.sidePanel.manager": selManager,
      "popup.sidePanel.options": selOptions,
      ...!he.isSidebar && {
        [pSideConfig]: selConfig,
        [pSideFinder]: selFinder
      }
    };
    for (const sel in GlobalClick) GlobalClick[sel].btn = 2;
    document.querySelector(selUnstylable + " a").onShowNote = box => {
      box.classList.add("inline");
      document.querySelector(selUnstylable).after(box);
    };
    document.querySelector(selFinder).on("split-btn", async e => {
      styleFinder.on || await oe.e("popup_search_js").then(oe.bind(oe, 6445));
      styleFinder.inSite(e);
    });
    document.querySelector(selManager).title += "\n<Shift>: " + he.t("popupManageSiteStyles");
    document.querySelector(selManager).on("split-btn", openManager);
    ye.subscribe(Object.keys(sideTitleMap), (id, alwaysSidebar) => {
      typeof alwaysSidebar == "number" && (alwaysSidebar = alwaysSidebar === 0);
      id === pSideEditor && updateTitle(ae.template.style.$(selEdit), alwaysSidebar);
      for (const el of document.querySelectorAll(sideTitleMap[id])) updateTitle(el, alwaysSidebar);
    }, !0);
    ue.onMessage.set(({method, reason, style}) => {
      if (!Ie.tabUrl) return;
      const del = method === "styleDeleted";
      const busy = (del || method === "styleAdded" || method === "styleUpdated") && !/^editPreview/.test(reason) && Ce.updateStyleEntry(style.id, del);
      busy && styleFinder.on?.(method, style.id, busy);
    });
    let hideContextMenu;
    window.on("auxclick", clickRouter, !0);
    window.on("click", clickRouter, !0);
    Se.browserSidebar && window.on("contextmenu", evt => hideContextMenu ? evt.preventDefault() : clickRouter(evt, 2), !0);
    function clickRouter(event, btn = event.button) {
      hideContextMenu = !1;
      const elClick = event.target;
      const entry = elClick.closest(".entry");
      const scope = entry ? EntryClick : GlobalClick;
      let el = elClick;
      let fn = entry ? scope["." + el.className] || scope[el.localName] : scope["#" + el.id] || scope["." + el.className] || scope[el.localName];
      for (const selector in scope) if ((fn || (fn = (el = elClick.closest(selector)) && scope[selector])) && (!btn || fn.btn & btn)) {
        event.preventDefault();
        fn.call(el, event, entry, btn);
        hideContextMenu = event.type !== "contextmenu";
        return;
      }
    }
    function nameRouter(event, entry, button) {
      event.altKey || button && this.localName === "input" ? $e.toggleStateInTab([ entry ], null) : button || event.ctrlKey || fe.MAC && event.metaKey ? openEditor(0, entry) : button || event.shiftKey || pe.API.styles.toggle(entry.styleId, !entry.styleMeta.enabled);
    }
    async function configure(event, entry, button) {
      if (this.target) openURLandHide.call(this, event); else {
        let mode;
        if (!he.isSidebar && Se.browserSidebar && (button || !(mode = ye.__values[pSideConfig]) || mode > 0 && entry.styleMeta.usercssData.vars >= mode)) return Se.openSidebar(`sidepanel.html?id=${entry.styleId}`, close, {
          tabId: Ie.tabId
        });
        $e.pause(() => le.configDialog(entry.styleId, entry.getBoundingClientRect().bottom));
      }
    }
    async function openEditor(event, entry, button) {
      const params = entry ? "?id=" + entry.styleId : this.search;
      if (Se.browserSidebar && (button === 2 || ye.__values[pSideEditor])) return Se.openSidebar("edit.html" + params, close, {
        tabId: Ie.tabId
      });
      await pe.API.tabs.openEditor(params);
      he.isSidebar || close();
    }
    function openManager(event, entry, button) {
      event?.preventDefault();
      return Se.openDashboard(event.shiftKey || event.detail === "site" ? {
        search: Ie.tabUrl,
        searchMode: "url"
      } : {}, button === 2, close, {
        windowId: Ie.windowId
      });
    }
    async function openStyleFinder(event, entry, button) {
      if (Se.browserSidebar && (button === 2 || ye.__values[pSideFinder])) return Se.openSidebar(`popup.html?${pSideFinder}`, close, {
        tabId: Ie.tabId
      });
      this.disabled = !0;
      styleFinder.on || await oe.e("popup_search_js").then(oe.bind(oe, 6445));
      styleFinder.inline();
    }
    async function openURLandHide(event) {
      event.preventDefault();
      const tab = await Se.getActiveTab();
      await pe.API.tabs.open({
        url: this.href || this.dataset.href,
        index: tab && tab.index + 1
      });
      he.isSidebar || close();
    }
    function updateTitle(el, alwaysSidebar) {
      const title = el.title;
      const i = title.indexOf(tSideHint);
      !alwaysSidebar && i < 0 ? el.title = title + tSideHint : alwaysSidebar && i > 0 && (el.title = title.slice(0, i));
    }
    ee.pSideConfig = pSideConfig;
    ee.pSideFinder = pSideFinder;
    ee.selUnstylable = selUnstylable;
    ee.styleFinder = styleFinder;
    ee.tSideHint = tSideHint;
  },
  6598(_, ee, oe) {
    ee.initHotkeys = ({[le.kTabOvrToggle]: ovrData}) => {
      Array.isArray(ovrData) && ([toggledTab, toggledTabSkip, savedTabOvrs] = ovrData);
      getTogglables();
      const el = document.querySelector("#help");
      const tAll = fe.t("popupHotkeysInfo");
      const tMain = tAll.replace(/\n.+$/, "");
      const tWiki = tAll.match(/(.+)?$/)[0];
      const tMenu = fe.t("popupHotkeysInfoMenu");
      const tSide = fe.t("popupHotkeysInfoSide", fe.t("optionSidePanelActions"));
      let tTab = fe.t("popupHotkeysInfoTab");
      ye.MAC && (tTab = tTab.replace("<Alt>", "<⌥>"));
      el.onShowNote = showInfo;
      el.onHideNote = hideInfo;
      el.title = [ tMain, tTab, tMenu, tSide ].join("\n");
      el.dataset.title = el.title.replace(/\n/g, "<hr>");
      wikiText = tWiki || fe.t("linkStylusWiki");
    };
    ee.pause = async (fn, ...args) => {
      window.off("keydown", onKeyDown);
      await fn(...args);
      window.on("keydown", onKeyDown);
    };
    ee.toggleStateInTab = toggleStateInTab;
    oe.d(ee, {});
    var le = oe(4188);
    var ae = oe(7986);
    var ue = oe(6518);
    var pe = oe(4930);
    var ye = oe(8970);
    var fe = oe(6940);
    var he = oe(3220);
    var Se = oe(8825);
    var Ie = oe(4222);
    const entries = document.getElementsByClassName("entry");
    const MENU_KEYS = {
      ContextMenu: 1,
      Enter: 1
    };
    const isEnabled = () => {
      let el = togglables[0];
      if (el && (el.id || (el = document.getElementById("style-" + el)))) return el.styleMeta.enabled;
    };
    let infoOn;
    let menuKey = 0;
    let oldBodyStyle;
    let savedTabOvrs;
    let togglables;
    let toggledTab;
    let toggledTabSkip;
    let transform;
    let wikiText;
    window.on("keydown", onKeyDown);
    window.on("keyup", evt => {
      if (menuKey && !evt.repeat && MENU_KEYS[evt.key]) {
        menuKey > 1 && evt.preventDefault();
        menuKey = 0;
      }
    });
    document.querySelector("#toggler").on("click", evt => {
      const cmd = evt.target.dataset.toggle;
      if (!cmd) return;
      evt.preventDefault();
      const cycle = cmd[0] === "*";
      const enable = cmd[0] === "+";
      const list = cycle ? togglables : entries;
      cmd[1] ? toggleStateInTab(list, cycle ? null : enable) : toggleState(list, cycle ? !isEnabled() : enable);
    });
    function onKeyDown(evt) {
      if (evt.metaKey) return;
      let entry;
      let {code, key, altKey, ctrlKey, shiftKey} = evt;
      const mods = (altKey ? "!" : "") + (ctrlKey ? "^" : "") + (shiftKey ? "+" : "");
      const mkey = mods + key;
      if (infoOn) {
        if (mkey === "Escape") {
          evt.preventDefault();
          hideInfo();
        }
      } else if (Ie.menu.isConnected) {
        if (mkey === "Escape") Ie.closeMenu(); else if (mkey === "Tab" || mkey === "+Tab") ue.moveFocus(Ie.menu, shiftKey ? -1 : 1); else if (mkey === "F2") he.openEditor(null, Ie.menu); else if (mkey === "Delete") Ie.btnDel.click(); else {
          if (mods && mods !== "+" || !((key === "`" || code === "Backquote") && (key = "0") || key >= "0" && key <= "3" || code >= "Digit0" && code <= "Digit3" && (key = code.slice(-1)))) return;
          Ie.menu.$(`[data-index="${key}"] label:nth-of-type(${mods ? 2 : 1}) input`).click();
        }
        evt.preventDefault();
      } else if (ctrlKey) {
        if (mkey === "^f") {
          evt.preventDefault();
          he.openStyleFinder();
        }
      } else if (!he.styleFinder.on || !ae.$isTextInput()) {
        if (key === "`" || key === "*" || code === "Backquote") {
          togglables.length || getTogglables(!0);
          if (!togglables.length) return;
          altKey ? (toggledTab = transform[toggledTab]) < 2 ? toggleStateInTab(togglables, !!toggledTab) : pe.API.styles.toggleTabOvrMany(Se.tabId, savedTabOvrs) : toggleState(togglables, !isEnabled());
        } else if (key === "-") (altKey ? toggleStateInTab : toggleState)(entries, !1); else if (key === "+") (altKey ? toggleStateInTab : toggleState)(entries, !0); else if (key >= "0" && key <= "9" || code >= "Digit0" && code <= "Digit9" && (key = code.slice(-1))) entry = entries[(+key || 10) - 1]; else if (key !== "?" || altKey) {
          if (MENU_KEYS[key]) menuKey = 1; else if (key.length === 1) {
            shiftKey = !1;
            key = key.toLocaleLowerCase();
            entry = [ ...entries ].find(e => e.innerText.toLocaleLowerCase().startsWith(key));
          }
        } else document.querySelector("#help").click();
        entry && (menuKey && ++menuKey ? Ie.openMenu(entry) : altKey ? toggleStateInTab([ entry ], null) : shiftKey ? he.openEditor(null, entry) : pe.API.styles.toggle(entry.styleId, !entry.$("input").checked));
      }
    }
    function getTogglables(force) {
      if (!savedTabOvrs || !(togglables = Object.keys(savedTabOvrs).map(id => document.getElementById("style-" + id)).filter(Boolean))[0]) {
        const numOn = (togglables = [ ...document.querySelectorAll(".entry.enabled") ]).length;
        !numOn && force && (togglables = [ ...entries ]);
        savedTabOvrs = {};
        let off = 0;
        for (let el, id, i = 0; el = togglables[i]; i++) {
          id = togglables[i] = el.styleId;
          savedTabOvrs[id] = el.styleMeta.tabOvr;
          off += el.classList.contains("not-applied");
        }
        toggledTab = off === numOn ? 0 : off ? 2 : 1;
        toggledTabSkip = off === numOn ? 0 : off ? -1 : 1;
        pe.API.tabs.set(Se.tabId, le.kTabOvrToggle, togglables[0] ? [ toggledTab, toggledTabSkip, savedTabOvrs ] : {
          undef: Se.tabId
        });
      }
      transform = toggledTabSkip === 0 ? [ 1, 2, 1 ] : toggledTabSkip === 1 ? [ 2, 0, 0 ] : [ 1, 2, 0 ];
    }
    function toggleState(list, enable) {
      const ids = [];
      for (let el of list) (el.id || (el = document.getElementById("style-" + el))) && enable !== el.styleMeta.enabled && ids.push(el.styleId);
      ids.length && pe.API.styles.toggleMany(ids, enable);
    }
    function toggleStateInTab(list, enable) {
      let ids;
      for (let el of list) if (el.id || (el = document.getElementById("style-" + el))) {
        const style = el.styleMeta;
        const ovr = style.tabOvr;
        const siteOn = !style.incOvr && style.enabled;
        const tabOn = ovr ?? siteOn;
        enable !== tabOn && ((ids ??= {})[style.id] = ovr == null || (ovr ? siteOn : !siteOn) ? enable ?? !tabOn : null);
      }
      ids && pe.API.styles.toggleTabOvrMany(Se.tabId, ids);
    }
    function hideInfo() {
      document.body.style.cssText = oldBodyStyle;
      infoOn = !1;
    }
    function showInfo(box) {
      const el = box.firstChild;
      const wikiUrl = "https://github.com/openstyles/stylus/wiki/Popup";
      const a = ae.$createLink({
        href: wikiUrl,
        title: wikiUrl
      }, wikiText);
      const width = "23em";
      box._buttons.append(a);
      box.classList.add("hotkeys");
      oldBodyStyle = document.body.style.cssText;
      el.setAttribute("style", `min-width:${width}; max-height:none !important;`);
      document.body.style.minWidth = width;
      document.body.style.minHeight = el.clientHeight + 24 + "px";
      el.style.maxHeight = "";
      infoOn = !0;
    }
  },
  8825(_, ee, oe) {
    oe.d(ee, {
      isBlocked: () => isBlocked,
      tabId: () => tabId,
      tabUrl: () => tabUrl,
      tabUrlSupported: () => tabUrlSupported,
      windowId: () => windowId
    });
    oe(9073);
    var le = oe(7986);
    var ae = oe(7393);
    var ue = oe(7501);
    var pe = oe(4930);
    var ye = oe(6990);
    var fe = oe(492);
    var he = oe(1949);
    var Se = oe(8970);
    var Ie = oe(6940);
    var $e = oe(1480);
    var xe = oe(3220);
    var Ce = oe(6598);
    var Ee = oe(9609);
    const UNREACHABLE = "unreachable";
    const isFullscreenPopup = Se.MOBILE && innerWidth > screen.availWidth - 200 && innerHeight > screen.availHeight - 200;
    let tabId;
    let tabUrl;
    let tabUrlSupported;
    let windowId;
    let isBlocked;
    let prevHeight = Math.max(innerHeight, 150);
    isFullscreenPopup || window !== top || window.on("resize", function onWindowResize() {
      const h = innerHeight;
      if (h > prevHeight && document.body.clientHeight > h + 1) {
        window.off("resize", onWindowResize);
        document.body.style.maxHeight = h - (Se.CHROME < 125) + "px";
      }
      prevHeight = h;
    });
    !async function init(data, port) {
      data ??= (ye.swController ? fe.clientData : await fe.clientData).popup || {};
      initPopup(data);
      Ee.showStyles(data);
      Ce.initHotkeys(data);
      if (!port) {
        Ie.urlParams.has(xe.pSideFinder) && xe.openStyleFinder();
        !function connectPort() {
          $e.ignoreChromeError();
          (port = chrome.runtime.connect({
            name: "popup:" + tabId
          })).onMessage.addListener(init);
          port.onDisconnect.addListener(connectPort);
        }();
      }
    }();
    Ee.updateStateIcon(he.isDark);
    he.onDarkChanged.add(val => Ee.updateStateIcon(val, null));
    fe.subscribe("popup.stylesFirst", (key, stylesFirst) => {
      le.$rootCL.toggle("styles-first", stylesFirst);
      le.$rootCL.toggle("styles-last", !stylesFirst);
    }, !0);
    fe.subscribe("disableAll", (key, val) => {
      Ee.updateStateIcon(null, val);
      document.getElementById("disableAll-label").title = Ie.t("masterSwitch") + ":\n" + Ie.t(val ? "disableAllStylesOff" : "genericEnabledLabel");
    }, !0);
    async function initPopup({frames, ping0, tab, urlSupported}) {
      let el;
      if (tabUrl) {
        blockPopup(!1);
        le.$rootCL.remove(UNREACHABLE, "search-results-shown");
        document.querySelector("#write-style").textContent = "";
      } else {
        if (isFullscreenPopup || Ie.isSidebar) le.$rootCL.add("maximized"); else {
          const kPopupWidth = "popupWidth";
          fe.subscribe([ kPopupWidth, "popupWidthMax" ], (key, val) => {
            document.body.style[(key === kPopupWidth ? "min" : "max") + "-width"] = Ie.clamp(val, 200, 800) + "px";
          }, !0);
        }
        ae.setupLivePrefs();
        fe.__values["popup.toggler.expanded"] && (document.querySelector("#toggler details").open = !0);
        el = document.querySelectorAll("#toggler label")[1];
        el.title = el.title.replace("<", Se.MAC ? "<⌥" : "<Alt-");
        for (el of document.querySelectorAll("link[media=print]")) el.removeAttribute("media");
      }
      tabId = tab.id;
      tabUrl = frames[0].url;
      tabUrlSupported = urlSupported;
      windowId = tab.windowId;
      frames.forEach(Ee.createWriterElement);
      document.querySelector('.match .match:not(.dupe),.match:not([data-frame-id="0"]):not(.dupe)') && document.getElementById("write-style").append(Object.assign(ue.template.writeForFrames, {
        onclick() {
          this.remove();
          document.getElementById("write-style").classList.add("expanded");
        }
      }));
      if (ping0) return;
      const isStore = Se.OPERA ? tabUrl.startsWith("https://addons.opera.com/") : tabUrl.startsWith("https://chrome.google.com/webstore/") || tabUrl.startsWith("https://chromewebstore.google.com/");
      blockPopup();
      if (isStore || !urlSupported) return;
      for (let t2 = performance.now() + 1e3; performance.now() < t2; ) {
        if (await pe.API.tabs.ping(tabId)) {
          blockPopup(!1);
          return;
        }
        if (tab.status === "complete") break;
        await Ie.sleep0();
        tab = await $e.getActiveTab();
      }
      let info;
      info = ue.template.unreachableInfo;
      let fileHint = tabUrl.startsWith("file:") ? (!Se.FIREFOX || Se.FIREFOX >= 153) && "unreachableFileHint" : Se.OPERA && "unreachableOpera";
      if (fileHint) {
        fileHint = Ie.t(fileHint);
        Se.FIREFOX && (fileHint = fileHint.replace("chrome://extensions", "about:addons"));
        info.append(le.$create("div", fileHint));
      }
      le.$rootCL.add(UNREACHABLE);
      document.querySelector(".blocked-info").replaceWith(info);
    }
    function blockPopup(val = !0) {
      isBlocked = val;
      le.$rootCL.toggle("blocked", isBlocked);
    }
  },
  4222(_, ee, oe) {
    ee.closeMenu = closeMenu;
    ee.openMenu = async entry => {
      ITEMS || initMenu();
      bodyStyle || (bodyStyle = document.body.style.cssText);
      const menuCL = menu.classList;
      const be = entry.getBoundingClientRect();
      const style = entry.styleMeta;
      const {enabled, id, url} = style;
      const [elTitle, elHome] = menu.$("header").children;
      const inc = style.inclusions || [];
      const exc = style.exclusions || [];
      const ovr = style.tabOvr;
      elMatched.textContent = style.matchedOvrs ?? await pe.API.styles.matchOverrides(id, fe.tabUrl);
      let prevRule;
      for (const {el, elInc, elExc, rule} of ITEMS) {
        el.title = rule;
        el.hidden = rule === prevRule;
        el.classList.toggle("enabled", elInc.checked = rule ? inc.includes(rule) : !!ovr);
        el.classList.toggle("disabled", elExc.checked = rule ? exc.includes(rule) : ovr === !1);
        prevRule = rule;
      }
      menu.styleId = id;
      menuCL.remove("delete");
      menuCL.toggle("enabled", enabled);
      chkOvr.checked = style.overridden;
      chkStyle.styleId = id;
      chkStyle.checked = enabled;
      btnEdit.search = "?id=" + id;
      elTitle.children[1].textContent = style.customName || style.name;
      elHome.hidden = !url;
      url && Object.assign(elHome, {
        href: url,
        title: ye.t("externalHomepage") + "\n" + url
      });
      menuCL.add("measure");
      document.body.append(menu);
      const menuH = menu.firstElementChild.offsetHeight + 1;
      const popupH = le.$root.clientHeight;
      menuH > popupH ? document.body.style.minHeight = menuH + "px" : menu.style.paddingTop = Math.min(be.bottom, popupH - menuH - 8) + "px";
      menuCL.remove("measure");
      ae.moveFocus(menu, 0);
    };
    oe.d(ee, {
      btnDel: () => btnDel
    });
    var le = oe(7986);
    var ae = oe(6518);
    var ue = oe(7501);
    var pe = oe(4930);
    oe(8970);
    var ye = oe(6940);
    var fe = oe(8825);
    var he = oe(3220);
    const menu = ue.template.menu;
    let ITEMS;
    let btnEdit;
    let btnDel;
    let chkStyle, chkOvr;
    let elMatched;
    let bodyStyle = "";
    function closeMenu() {
      menu.remove();
      document.body.style.cssText = bodyStyle;
      bodyStyle = "";
    }
    function initMenu() {
      const u = new URL(fe.tabUrl);
      const tplOvr = ue.template.incOvr;
      menu.$("p br").replaceWith(tplOvr);
      menu.onclick = ({target}) => {
        target === menu && closeMenu();
      };
      (chkOvr = tplOvr.$("input")).onclick = () => {
        pe.API.styles.config(menu.styleId, "overridden", chkOvr.checked);
        return !1;
      };
      (chkStyle = menu.$("input")).onclick = () => pe.API.styles.toggle(menu.styleId, chkStyle.checked);
      (btnEdit = menu.$('[data-cmd="edit"]')).onclick = he.openEditor;
      btnEdit.title = "<F2>: " + ye.t("styleSitesPopupEdit");
      menu.$('[data-cmd="cancel"]').onclick = closeMenu;
      (btnDel = menu.$('[data-cmd="delete"]')).onclick = () => {
        if (!menu.classList.toggle("delete")) {
          pe.API.styles.remove(menu.styleId);
          closeMenu();
        }
      };
      elMatched = menu.$("#matchedOvr");
      ITEMS = [];
      for (const el of menu.$$("[data-ovr]")) {
        const [elInc, elExc] = el.$$("input");
        const type = el.dataset.ovr;
        const item = {
          el,
          elInc,
          elExc,
          rule: type === "tab" ? "" : type === "domain" ? u.origin + "/*" : u.origin + u.pathname.replace(/\*/g, "\\*") + (type === "url" ? "" : "*"),
          handleEvent: onOvrChanged
        };
        ITEMS.push(item);
        el.on("change", item);
        let i = +el.dataset.index;
        i = `<${i}>` + (i ? "" : ", <`>") + ": ";
        elInc.title = `${i}${ye.t("include")}`;
        elExc.title = `${i.replace(/</g, "<Shift-")}${ye.t("exclude")}`;
      }
    }
    function onOvrChanged(evt) {
      const id = menu.styleId;
      const rule = this.rule;
      const ctl = evt.target;
      const isInc = ctl === this.elInc;
      const val = ctl.checked;
      (rule ? pe.API.styles.toggleSiteOvr(id, rule, isInc, val) : pe.API.styles.toggleTabOvrMany(fe.tabId, {
        [id]: val ? isInc : null
      })).catch(ye.NOP);
    }
    ee.menu = menu;
  },
  9609(_, ee, oe) {
    ee.createWriterElement = (frame, index) => {
      const {frameId, parentFrameId, isDupe} = frame;
      const url = Ie.tabUrlSupported || frameId ? frame.url.split("#")[0] : "https://www.example.com/abcd";
      const isAbout = url.startsWith("about:");
      const crumbs = [];
      if (!url) return;
      let el;
      if (isAbout) {
        el = document.createElement("span");
        el.textContent = url;
      } else {
        el = (url.startsWith(fe.ownRoot) ? makeExtCrumbs : makeWebCrumbs)(crumbs, url);
        el.onmouseenter = el.onmouseleave = el.onfocus = el.onblur = toggleUrlLink;
        if (!index) {
          writerIcon.href = el.href;
          writerIcon.title = el.title;
        }
      }
      crumbs.push(el);
      const root = document.getElementById("write-style");
      const parent = root.$(`[data-frame-id="${parentFrameId}"]`) || root;
      const child = le.$create(`.match${isDupe ? ".dupe" : ""}${isAbout ? ".about-blank" : ""}`, le.$create(".breadcrumbs", crumbs));
      child.dataset.frameId = frameId;
      parent.appendChild(child);
      parent.dataset.children = (Number(parent.dataset.children) || 0) + 1;
    };
    ee.showStyles = ({frames}) => {
      installed.textContent = "";
      const entries = new Map;
      for (let i = 0; i < frames.length; i++) {
        if (Ie.isBlocked && !i) continue;
        const frame = frames[i];
        for (let fs of frame.styles || []) {
          const id = fs.style.id;
          if (!entries.has(id)) {
            fs = Object.assign(fs.style, fs);
            fs.frameUrl = i ? frame.url : "";
            entries.set(id, createStyleElement(fs));
          }
        }
      }
      reSort([ ...entries.values() ]);
    };
    ee.updateStateIcon = (newDark, newDisabled) => {
      const el = document.querySelector("#disableAll-label img");
      let srcset = el.srcset;
      newDark != null && (srcset = srcset.replace(/\/\D*/g, newDark ? "/" : "/light/"));
      newDisabled != null && (srcset = srcset.replace(/x?\./g, newDisabled ? "x." : "."));
      el.srcset = srcset;
    };
    ee.updateStyleEntry = async (id, del) => {
      const entry = document.getElementById("style-" + id);
      const inMenu = id === xe.menu.styleId && xe.menu.isConnected;
      const res = !del && await pe.API.styles.getByIdInTab(id, Ie.tabId, inMenu);
      if (res) {
        const el = createStyleElement(Object.assign(res.style, res), entry);
        el.isConnected || installed.append(el);
        reSort();
        inMenu && xe.openMenu(el);
      } else {
        if (entry) {
          entry.remove();
          reSort();
        }
        inMenu && xe.closeMenu();
      }
    };
    oe.d(ee, {});
    oe(9073);
    var le = oe(7986);
    var ae = oe(963);
    var ue = oe(7501);
    var pe = oe(4930);
    var ye = oe(492);
    oe(8970);
    var fe = oe(8982);
    var he = oe(6940);
    var Se = oe(1480);
    var Ie = oe(8825);
    var $e = oe(3220);
    var xe = oe(4222);
    const EXT_NAME = `<${Se.MF.name}>`;
    const TPL_STYLE = ue.template.style;
    const xo = new IntersectionObserver(results => {
      for (const {target: $name, boundingClientRect: r} of results) {
        const style = $name.$entry.styleMeta;
        const tabOvr = style.tabOvr;
        $name.title = [ $name.scrollWidth > r.width + 1 && $name.textContent, style.sloppy && he.t("styleNotAppliedRegexpProblemTooltip"), style.excluded && he.t("styleNotAppliedExcluded", he.t("styleSitesExclude")), style.excludedScheme && he.t(`styleNotAppliedScheme${he.capitalize(style.preferScheme)}`), style.included && he.t("styleForceApplied", he.t("styleSitesInclude")), tabOvr ? he.t("styleForceAppliedTab") : tabOvr === !1 && he.t("styleNotAppliedExcludedTab"), style.incOvr && he.t("styleNotAppliedOverridden", he.t("styleSitesInclude")) ].filter(Boolean).join("\n") || "";
      }
    });
    const installed = document.getElementById("installed");
    const writerIcon = document.querySelector("#write-wrapper .icon");
    const disabler = document.querySelector("#disableAll-label");
    let titleCSP;
    let initNoStyles = () => {
      initNoStyles = null;
      const el = document.querySelector("#no-styles");
      el.on("click", () => {
        $e.openStyleFinder();
        el.style.pointerEvents = "none";
        el.$("b").remove();
      }, {
        once: !0
      });
    };
    function sortStyles(entries) {
      const enabledFirst = ye.__values["popup.enabledFirst"];
      return entries.sort(({styleMeta: a}, {styleMeta: b}) => Boolean(a.frameUrl) - Boolean(b.frameUrl) || enabledFirst && Boolean(b.enabled) - Boolean(a.enabled) || (a.customName || a.name).localeCompare(b.customName || b.name));
    }
    function reSort(entries) {
      (entries || ye.__values["popup.autoResort"]) && installed.append(...sortStyles(entries || [ ...installed.children ]));
      if (le.$rootCL.toggle("no-styles", !installed.firstChild)) {
        initNoStyles?.();
        document.querySelector("#main-actions").append(disabler);
      } else document.querySelector("#toggler").append(disabler);
    }
    function makeExtCrumbs(crumbs, url) {
      const key = "regexp";
      const all = "^\\w+-extension://";
      const page = url.slice(fe.ownRoot.length, url.indexOf(".html"));
      crumbs.push(makeCrumb(key, all + ".+", EXT_NAME, EXT_NAME, !0));
      return makeCrumb(key, `${all}[^/]+/${he.stringAsRegExpStr(page)}.*`, EXT_NAME, page + ".*");
    }
    function makeWebCrumbs(crumbs, url) {
      const u = new URL(url);
      const h = u.hostname;
      const host = h || url;
      const tail = h && (u.port ? ":" + u.port : "") + u.pathname + u.search + u.hash;
      for (let domain, d, j = 0; (domain = host.slice(j)) && ((d = domain.split("."))[1] || !j); ) {
        d = d[2] ? d[0] : domain;
        crumbs.push(makeCrumb("domain", domain, "", d, !0));
        j = host.indexOf(".", j + 1) + 1 || host.length;
      }
      return makeCrumb("url-prefix", url, "", he.clipString(tail) || he.t("writeStyleForURL"));
    }
    function makeCrumb(key, val, name, body, isDomain) {
      const sp = {
        [key]: val
      };
      name && (sp.name = name);
      return le.$create("a.write-style-link" + (isDomain ? "[subdomain]" : ""), {
        href: "edit.html?" + new URLSearchParams(sp),
        title: `${he.t("writeStyleFor")}\n${key}("${val}")`
      }, body);
    }
    function createStyleElement(style, entry) {
      const oldEntry = entry;
      if (entry) style = Object.assign(entry.styleMeta, style); else {
        entry = TPL_STYLE.cloneNode(!0);
        Object.assign(entry, {
          id: "style-" + style.id,
          styleId: style.id,
          styleMeta: style
        });
      }
      const {enabled, frameUrl, url, empty, sloppy, patchCsp: csp, usercssData: ucd} = style;
      const name = entry.$(".style-name");
      const cfg = entry.$(".configure");
      const hasVars = ucd ? ucd.vars : url && /\?[^#=]/.test(style.updateUrl);
      const tabOvr = entry.dataset.tab = style.tabOvr;
      const elEmpty = oldEntry?.$(".i-empty");
      const elSloppy = oldEntry?.$(".regexp-problem-indicator");
      const elCsp = oldEntry?.$(".csp-problem-indicator");
      le.$toggleClasses(entry, {
        empty,
        enabled,
        disabled: !enabled,
        "force-applied": style.included || !!tabOvr,
        "not-applied": style.excluded || sloppy || style.excludedScheme || style.incOvr || tabOvr === !1,
        "regexp-partial": sloppy,
        frame: frameUrl
      });
      (enabled || oldEntry) && (entry.$("input").checked = enabled);
      name.$entry = entry;
      name.lastChild.textContent = style.customName || style.name;
      if (hasVars) if (ucd) cfg.title = he.t("configureStyle"); else {
        cfg.href = url;
        cfg.target = "_blank";
        cfg.title = he.t("configureStyleOnHomepage") + "\n" + url;
        cfg.$("i").className = "i-external";
      } else cfg.hidden = !0;
      !he.isSidebar && ye.__values[$e.pSideConfig] && (cfg.title += $e.tSideHint);
      if (frameUrl) {
        const sel = "span.frame-url";
        (entry.$(sel) || name.insertBefore(le.$create(sel), name.lastChild)).title = frameUrl;
      }
      empty ? elEmpty || entry.$(".main-controls").append(ue.template.errEmpty.cloneNode(!0)) : elEmpty?.remove();
      csp ? renderErrCsp(entry, elCsp, csp) : elCsp?.remove();
      sloppy ? elSloppy || (entry.$(".main-controls").appendChild(ue.template.errRegexp.cloneNode(!0)).onShowNote = onShowNotePartial) : elSloppy?.remove();
      oldEntry && xo.unobserve(name);
      xo.observe(name);
      return entry;
    }
    function renderErrCsp(entry, elCsp, csp) {
      titleCSP ??= `${he.t("styleAssetsCSP", he.t("optionsAdvancedPatchCsp"))}\n<pre>`;
      elCsp ??= entry.$(".main-controls").appendChild(ue.template.errCsp.cloneNode(!0));
      elCsp.title = titleCSP + Object.keys(csp).map(k => he.clipString(k, 50)).join("\n") + "</pre>";
      elCsp.dataset.title = titleCSP + Object.keys(csp).join("\n") + "</pre>";
      elCsp.onShowNote = onShowNoteCsp;
      ae.splitLongTooltips([ elCsp ]);
    }
    function onShowNoteCsp({_buttons: el}) {
      el.append(le.$create("button#options-btn", he.t("openOptions")));
    }
    function onShowNotePartial({_body: el}) {
      el.append("\n\n", ue.sanitizeHtml(he.t("styleRegexpPartialExplanation")));
      if (el = el.$("a")) {
        el.href = "https://developer.mozilla.org/docs/Web/CSS/@document";
        el.title = el.href;
      }
    }
    function toggleUrlLink({type}) {
      this.parentElement.classList.toggle("url()", type === "mouseenter" || type === "focus");
    }
    ee.installed = installed;
  }
}, _ => {
  _.O(0, [ "color", "dlg_config-dialog_css-css_dom-error_css-css_global-dark_css-css_global_css-css_onoffswitch_cs-7b17ff" ], () => _(_.s = 8825));
  _.O();
} ]);