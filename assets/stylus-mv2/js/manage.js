"use strict";

(self.webpackChunkStylus = self.webpackChunkStylus || []).push([ [ "manage" ], {
  9201(_, ee, ae) {
    ee.filterAndAppend = ({entry, container}, alreadySearched) => {
      if (!container && ye.isColumnable) {
        pe.fitNameColumn(void 0, entry.styleMeta);
        pe.fitSizeColumn(void 0, entry);
      }
      return reapplyFilter(container || [ entry ], alreadySearched, entry);
    };
    ee.showFiltersStats = showFiltersStats;
    ae.d(ee, {});
    var oe = ae(1154);
    var le = ae(2956);
    var ue = ae(2076);
    var pe = ae(9080);
    var fe = ae(3029);
    var he = ae(5291);
    var ye = ae(6793);
    const filtersSelector = {
      hide: "",
      unhide: "",
      numShown: -1,
      numTotal: -1
    };
    const getValue = el => el.type === "checkbox" ? el.checked : el.value.trim();
    const fltSearch = "search";
    const fltMode = "searchMode";
    const fltModePref = "manage.searchMode";
    let elSearch, elSearchMode;
    fe.watch({
      search: [ fltSearch, fltMode ]
    }, ([search, mode]) => {
      const firstRun = !elSearch;
      firstRun && initFilters();
      elSearch.value = search || "";
      elSearchMode.value = mode || le.__values[fltModePref];
      firstRun || searchStyles();
    });
    function initFilters() {
      elSearch = document.getElementById("search");
      elSearchMode = document.getElementById(fltModePref);
      elSearchMode.on("change", e => {
        elSearchMode.value === "url" && e.stopPropagation();
      }, !0);
      elSearch.oninput = () => fe.updateSearch(fltSearch, elSearch.value);
      elSearchMode.oninput = () => fe.updateSearch(fltMode, elSearchMode.value);
      for (const el of [ document.querySelector("#search-wrapper a"), document.querySelector("#sort-wrapper a") ]) el.dataset.title = el.title.replace(/.+\n?/g, "<p>$&</p>");
      document.querySelectorAll('select[id$=".invert"]').forEach(el => {
        const slave = document.getElementById(el.id.replace(".invert", ""));
        const slaveData = slave.dataset;
        const valueMap = new Map([ [ !1, slaveData.filter ], [ !0, slaveData.filterHide ] ]);
        el.oninput = () => {
          slave.checked || setTimeout(() => {
            if (!slave.checked) {
              slave.checked = !0;
              slave.dispatchEvent(new Event("change", {
                bubbles: !0
              }));
            }
          });
        };
        el.onchange = event => {
          const value = el.value === "true";
          const filter = valueMap.get(value);
          if (slaveData.filter !== filter) {
            slaveData.filter = filter;
            slaveData.filterHide = valueMap.get(!value);
            ue.debounce(filterOnChange, 0, event);
          }
        };
        el.onchange({
          target: el
        });
      });
      document.querySelectorAll("[data-filter]").forEach(el => {
        el.onchange = filterOnChange;
        el.closest(".hidden") && (el.checked = !1);
      });
      document.querySelector("#stats a").onclick = event => {
        event.preventDefault();
        if (filtersSelector.hide) {
          for (const el of document.querySelectorAll("#filters [data-filter]")) {
            let value;
            el.type === "checkbox" && el.checked ? value = el.checked = !1 : el.value && (value = el.value = "");
            if (value !== void 0) {
              el.lastValue = value;
              le.knownKeys.includes(el.id) && le.set(el.id, !1);
            }
          }
          elSearchMode.value === "url" && (elSearchMode.value = le.__values[fltModePref]);
          filterOnChange({
            force: !0
          });
          fe.updateSearch({
            [fltSearch]: "",
            [fltMode]: ""
          });
        }
      };
      buildFilters();
    }
    function filterOnChange({target, force, alreadySearched}) {
      if (!force) {
        const value = getValue(target);
        if (value === target.lastValue) return;
        target.lastValue = value;
      }
      buildFilters();
      elSearch && reapplyFilter(ye.installed, alreadySearched).then(he.updateStripes);
    }
    function buildFilters() {
      filtersSelector.hide = buildFilter(!0);
      filtersSelector.unhide = buildFilter(!1);
    }
    function buildFilter(hide) {
      return (hide ? "" : ".entry.hidden") + [ ...document.querySelectorAll("#header [data-filter]") ].map(el => getValue(el) && el.dataset[hide ? "filterHide" : "filter"].split(/,\s*/).map(s => (hide ? ".entry:not(.hidden)" : "") + s).join(",")).filter(Boolean).join(hide ? "," : "");
    }
    async function reapplyFilter(container = ye.installed, alreadySearched, entry) {
      !alreadySearched && elSearch.value.trim() && (container[0] || container.firstChild) && await searchStyles({
        immediately: !0,
        container
      });
      !entry || filtersSelector.hide && entry.matches(filtersSelector.hide) || entry.classList.add("hidden");
      let toHide = [];
      let toUnhide = [];
      filtersSelector.hide ? filterContainer({
        hide: !1
      }) : toUnhide = container;
      if (toUnhide instanceof DocumentFragment) ye.installed.appendChild(toUnhide); else {
        for (entry of toUnhide.children || toUnhide) {
          entry.parentNode || ye.installed.appendChild(entry);
          entry.classList.contains("hidden") && entry.classList.remove("hidden");
        }
        filtersSelector.hide && filterContainer({
          hide: !0
        });
        if (toHide.length) {
          for (entry of toHide) entry.classList.add("hidden");
          if (container instanceof DocumentFragment) {
            ye.installed.appendChild(container);
            showFiltersStats();
          } else {
            toHide.length === 1 && toHide[0].parentElement !== ye.installed && ye.installed.appendChild(toHide[0]);
            showFiltersStats();
          }
        } else showFiltersStats();
      }
      function filterContainer({hide}) {
        const selector = filtersSelector[hide ? "hide" : "unhide"];
        if (container.filter) {
          if (hide) return;
          for (const el of container) (el.matches(selector) ? toUnhide : toHide).push(el);
        } else hide ? toHide = [ ...container.$$(selector) ] : toUnhide = [ ...container.$$(selector) ];
      }
    }
    function showFiltersStats() {
      const active = filtersSelector.hide !== "";
      const numTotal = ye.installed.childElementCount;
      const numShown = numTotal - ye.installed.getElementsByClassName("entry hidden").length;
      document.getElementById("header").classList.toggle("filtered", active);
      if (filtersSelector.numShown !== numShown || filtersSelector.numTotal !== numTotal) {
        filtersSelector.numShown = numShown;
        filtersSelector.numTotal = numTotal;
        document.querySelector("#stats span").textContent = ue.t("filteredStyles", [ numShown, numTotal ]);
        document.body.classList.toggle("all-styles-hidden-by-filters", !numShown && numTotal && filtersSelector.hide);
      }
    }
    async function searchStyles({immediately, container} = {}) {
      const query = elSearch.value.trim();
      const mode = elSearchMode.value;
      if (query === elSearch.lastValue && mode === elSearchMode.lastValue && !immediately && !container) return;
      if (!immediately) {
        ue.debounce(searchStyles, 150, {
          immediately: !0
        });
        return;
      }
      elSearch.lastValue = query;
      elSearchMode.lastValue = mode;
      const all = ye.installed.children;
      const entries = container && container.children || container || all;
      const idsToSearch = entries !== all && [ ...entries ].map(el => el.styleId);
      const ids = entries[0] ? await oe.API.styles.searchDb({
        query,
        mode,
        ids: idsToSearch
      }) : [];
      let needsRefilter = !1;
      for (const entry of entries) {
        const isMatching = ids.includes(entry.styleId);
        if (entry.classList.contains("not-matching") !== !isMatching) {
          entry.classList.toggle("not-matching", !isMatching);
          needsRefilter = !0;
        }
      }
      needsRefilter && !container && filterOnChange({
        force: !0,
        alreadySearched: !0
      });
      return container;
    }
    ee.filtersSelector = filtersSelector;
  },
  7924(_, ee, ae) {
    ae(2431);
    var dom = ae(9298);
    var dom_error = ae(7493);
    var dom_prefs = ae(113);
    var dom_util = ae(4777);
    var msg = ae(4931);
    ae(4318);
    var prefs = ae(2956);
    var sync_util = ae(6908);
    var urls = ae(7766);
    var util = ae(2076);
    const CLS_TRANSFORMED = "draggable-list-transformed";
    function posToIndex(rects, startIndex, y, bound) {
      if (y < rects[0].top && bound) return startIndex;
      for (let i = 0; i < startIndex; i++) if (!(rects[i].bottom < y)) return i;
      if (y > rects[rects.length - 1].bottom && bound) return startIndex;
      for (let i = rects.length - 1; i > startIndex; i--) if (!(rects[i].top > y)) return i;
      return startIndex;
    }
    function applyTransform(list, startIndex, oldIndex, newIndex, len) {
      if (newIndex > oldIndex) {
        transform(!1, oldIndex, Math.min(startIndex - 1, newIndex - 1));
        startIndex < list.length - 1 && transform(!0, Math.max(oldIndex + 1, startIndex + 1), newIndex, "translateY(".concat(-len, "px)"));
      } else {
        transform(!1, Math.max(startIndex + 1, newIndex + 1), oldIndex);
        startIndex > 0 && transform(!0, newIndex, Math.min(oldIndex - 1, startIndex - 1), "translateY(".concat(len, "px)"));
      }
      function transform(state, p, q, style) {
        for (let i = p; i <= q; i++) if (state && !list[i].classList.contains(CLS_TRANSFORMED)) {
          list[i].classList.add(CLS_TRANSFORMED);
          list[i].style.transform = style;
        } else if (!state && list[i].classList.contains(CLS_TRANSFORMED)) {
          list[i].classList.remove(CLS_TRANSFORMED);
          list[i].style = "";
        }
      }
    }
    function DraggableList(el, {bound, scrollContainer} = {}) {
      for (const c of el.children) c.draggable = !0;
      new MutationObserver(records => {
        for (const r of records) for (const n of r.addedNodes) n.draggable = !0;
      }).observe(el, {
        childList: !0
      });
      let startPos = null;
      let startIndex = 0;
      let dragOverIndex = 0;
      let dragOverPos = null;
      let rects = [];
      let dragTarget = null;
      let dropped = !1;
      let itemSize = 0;
      el.addEventListener("dragstart", e => {
        if (e.target.parentNode !== el) return;
        dragTarget = e.target;
        dropped = !1;
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
        startPos = {
          x: e.pageX + (scrollContainer ? scrollContainer.scrollLeft : 0),
          y: e.pageY + scrollTop
        };
        startIndex = [ ...el.children ].indexOf(e.target);
        dragOverIndex = startIndex;
        dragOverPos = startPos;
        rects = [ ...el.children ].map(el => {
          const r = el.getBoundingClientRect();
          return {
            top: r.top + window.scrollY + scrollTop,
            bottom: r.bottom + window.scrollY + scrollTop
          };
        });
        itemSize = startIndex + 1 < rects.length ? rects[startIndex + 1].top - rects[startIndex].top : startIndex > 0 ? rects[startIndex].bottom - rects[startIndex - 1].bottom : 0;
        dragTarget.classList.add("draggable-list-target");
        el.classList.add("draggable-list-dragging");
        dispatch(e, "d:dragstart");
      });
      el.addEventListener("dragenter", e => {
        if (dragTarget) {
          e.preventDefault();
          dispatch(e, "d:dragmove");
        }
      });
      el.addEventListener("dragover", e => {
        if (!dragTarget) return;
        e.preventDefault();
        const newPos = {
          x: e.pageX + (scrollContainer ? scrollContainer.scrollLeft : 0),
          y: e.pageY + (scrollContainer ? scrollContainer.scrollTop : 0)
        };
        const newIndex = posToIndex(rects, startIndex, newPos.y, bound);
        applyTransform(el.children, startIndex, dragOverIndex, newIndex, itemSize);
        dragOverIndex = newIndex;
        dragOverPos = newPos;
        dispatch(e, "d:dragmove");
      });
      document.addEventListener("dragend", e => {
        if (dragTarget) {
          for (const c of el.children) {
            c.classList.remove(CLS_TRANSFORMED);
            c.style = "";
          }
          dragTarget.classList.remove("draggable-list-target");
          el.classList.remove("draggable-list-dragging");
          dispatch(e, "d:dragend", {
            originalIndex: startIndex,
            spliceIndex: dragOverIndex,
            insertBefore: dragOverIndex < startIndex ? el.children[dragOverIndex] : el.children[dragOverIndex + 1],
            dropped
          });
          dragTarget = null;
        }
      });
      el.addEventListener("drop", e => {
        if (dragTarget) {
          dropped = !0;
          e.preventDefault();
        }
      });
      function dispatch(e, name, props) {
        const detail = {
          origin: e,
          startPos,
          currentPos: dragOverPos,
          dragTarget
        };
        props && Object.assign(detail, props);
        el.dispatchEvent(new CustomEvent(name, {
          detail
        }));
      }
    }
    var msg_api = ae(1154);
    let ui;
    async function InjectionOrder(show, el, selector) {
      if (!show) {
        var _;
        await ((_ = ui) == null ? void 0 : _.close());
        ui = null;
        return;
      }
      const SEL_ENTRY = ".injection-order-entry";
      const groups = await msg_api.API.styles.getAllOrdered([ "_id", "id", "name", "enabled" ]);
      const ols = {};
      const parts = {};
      const entry = dom.$create("li" + SEL_ENTRY, [ parts.name = dom.$create("a", {
        target: "_blank",
        draggable: !1
      }), dom.$create("a.injection-order-toggle", {
        tabIndex: 0,
        draggable: !1,
        title: util.t("styleInjectionImportance")
      }) ]);
      await dom_util.messageBox.show({
        title: util.t("styleInjectionOrder"),
        contents: Object.entries(groups).map(([type, styles]) => {
          const ids = groups[type] = styles.map(s => s._id);
          const ol = ols[type] = dom.$create("ol.scroller");
          let maxTranslateY;
          ol.append(...styles.map(makeEntry));
          ol.on("d:dragstart", ({detail: d}) => {
            d.origin.dataTransfer.setDragImage(new Image, 0, 0);
            maxTranslateY = ol.scrollHeight + ol.offsetTop - d.dragTarget.offsetHeight - d.dragTarget.offsetTop;
          });
          ol.on("d:dragmove", ({detail: d}) => {
            d.origin.stopPropagation();
            d.origin.dataTransfer.dropEffect = "move";
            d.dragTarget.style.transform = `translateY(${Math.min(d.currentPos.y - d.startPos.y, maxTranslateY)}px)`;
          });
          ol.on("d:dragend", ({detail: d}) => {
            const [item] = ids.splice(d.originalIndex, 1);
            ids.splice(d.spliceIndex, 0, item);
            ol.insertBefore(d.dragTarget, d.insertBefore);
            msg_api.API.styles.setOrder(groups);
          });
          ol.on("click", e => {
            if (e.target.closest(".injection-order-toggle")) {
              const elEntry = e.target.closest(SEL_ENTRY);
              const i = [].indexOf.call(elEntry.parentNode.children, elEntry);
              const [item] = ids.splice(i, 1);
              const type2 = type === "main" ? "prio" : "main";
              groups[type2].push(item);
              ols[type2].appendChild(elEntry);
              msg_api.API.styles.setOrder(groups);
            }
          });
          DraggableList(ol, {
            scrollContainer: ol
          });
          return dom.$create(`section[data-${type}]`, [ dom.$create("header", util.t("styleInjectionOrderHint" + (type === "main" ? "" : "_" + type))), ol ]);
        }),
        className: "center-dialog " + selector.slice(1),
        blockScroll: !0,
        buttons: [ util.t("confirmClose") ],
        onshow() {
          ui = this;
        }
      });
      function makeEntry(style) {
        entry.classList.toggle("enabled", style.enabled);
        parts.name.href = "/edit.html?id=" + style.id;
        parts.name.textContent = style.name;
        return Object.assign(entry.cloneNode(!0), {
          styleNameLC: style.name.toLocaleLowerCase()
        });
      }
    }
    var render = ae(9080);
    var router = ae(3029);
    var sorter = ae(5291);
    var localization = ae(9293);
    var storage_util = ae(1320);
    var filters = ae(9201);
    var manage_util = ae(6793);
    const elAll = localization.template.updateAll;
    const btnApply = elAll.$("#apply-all-updates");
    const btnCheck = document.getElementById("check-all-updates");
    const btnCheckForce = elAll.$("#check-all-updates-force");
    const elNoUpdates = elAll.$("#update-all-no-updates");
    const elOnlyUpdates = document.getElementById("only-updates");
    btnCheck.onclick = btnCheckForce.onclick = function() {
      document.body.classList.add("update-in-progress");
      btnCheck.disabled = !0;
      dom.$detach(btnCheckForce);
      dom.$detach(btnApply);
      dom.$detach(elNoUpdates);
      const ignoreDigest = this === btnCheckForce;
      document.querySelectorAll(".updatable:not(.can-update)" + (ignoreDigest ? "" : ":not(.update-problem)")).forEach(checkUpdate);
      let total = 0;
      let checked = 0;
      let skippedEdited = 0;
      let updated = 0;
      msg.onConnect.updater = port => port.onMessage.addListener(observer);
      msg_api.API.updater.checkAllStyles({
        save: !1,
        observe: !0,
        ignoreDigest
      });
      function observer(info, port) {
        "count" in info && (total = info.count);
        if (info.updated) {
          ++updated === 1 && (btnApply.disabled = !0);
          btnApply.dataset.value = updated;
        }
        if (info.updated || "error" in info) {
          checked++;
          skippedEdited += !info.updated && [ info.STATES.EDITED, info.STATES.MAYBE_EDITED ].includes(info.error);
          reportUpdateState(info);
        }
        const progress = document.getElementById("update-progress");
        progress.style.width = Math.round(checked / total * progress.parentElement.clientWidth) + "px";
        if (info.done) {
          port.onMessage.removeListener(observer);
          document.body.classList.remove("update-in-progress");
          btnCheck.disabled = total === 0;
          btnApply.disabled = !1;
          renderUpdatesOnlyFilter({
            check: updated + skippedEdited > 0
          });
          if (!updated) {
            elNoUpdates.dataset.skippedEdited = skippedEdited > 0;
            dom.$detach(elNoUpdates, !1);
            dom.$detach(btnCheckForce, !skippedEdited);
          }
        }
      }
    };
    btnApply.onclick = () => {
      btnApply.disabled = !0;
      setTimeout(() => {
        dom.$detach(btnApply);
        btnApply.disabled = !1;
        renderUpdatesOnlyFilter({
          show: !1
        });
      }, 1e3);
      document.querySelectorAll(".can-update .update").forEach(button => {
        dom_util.scrollElementIntoView(button);
        button.click();
      });
    };
    let uiLog;
    for (const el of [ ...elAll.children ]) dom.$detach(el);
    for (const id of [ "updateAll" ]) document.querySelector(`template[data-id="${id}"]`).replaceWith(localization.template[id]);
    {
      const kBtns = "manage.actions.expanded";
      const kOnly = "updateOnlyEnabled";
      prefs.subscribe([ kBtns, kOnly ], () => {
        btnCheck.title = btnCheck.title.split("\n")[0] + (!prefs.__values[kBtns] && prefs.__values[kOnly] ? `\n(${util.t("manageOnlyEnabled")})` : "");
      }, !0);
    }
    function checkUpdate(entry, {single} = {}) {
      entry.$(".update-note").textContent = util.t("checkingForUpdate");
      entry.$(".check-update").title = "";
      single && msg_api.API.updater.checkStyle({
        save: !1,
        id: entry.styleId,
        ignoreDigest: entry.classList.contains("update-problem")
      }).then(reportUpdateState);
      entry.classList.remove("checking-update", "no-update", "update-problem");
      entry.classList.add("checking-update");
    }
    function reportUpdateState({updated, style, error, STATES}) {
      const isCheckAll = document.body.classList.contains("update-in-progress");
      const entry = document.getElementById("style-" + style.id);
      const newClasses = {
        updatable: 1,
        "checking-update": 0,
        "update-done": 0,
        "install-done": 0,
        "no-update": 0,
        "update-problem": 0
      };
      if (updated) {
        newClasses["can-update"] = !0;
        entry.updatedCode = style;
        entry.$(".update-note").textContent = "";
        elOnlyUpdates.parentElement.hidden = !1;
      } else if (!entry.classList.contains("can-update")) {
        const same = error === STATES.SAME_MD5 || error === STATES.SAME_CODE || error === STATES.SAME_VERSION;
        const edited = error === STATES.EDITED || error === STATES.MAYBE_EDITED;
        error ? typeof error == "number" ? error = util.t("updateCheckFailBadResponseCode", [ error ]) + "\n" + style.updateUrl : error === STATES.EDITED ? error = util.t("updateCheckSkippedLocallyEdited") + "\n" + util.t("updateCheckManualUpdateHint") : error === STATES.MAYBE_EDITED ? error = util.t("updateCheckSkippedMaybeLocallyEdited") + "\n" + util.t("updateCheckManualUpdateHint") : typeof error == "object" && error.message ? error = error.message : Array.isArray(error) && (error = error.map(e => `${e.message || e}${e.context ? "\n" + e.context.replace(/^/gm, "\t") : ""}`).join("\n")) : error = util.t("updateCheckFailServerUnreachable") + "\n" + style.updateUrl;
        entry.dataset.error = error;
        const message = same ? util.t("updateCheckSucceededNoUpdate") : error;
        newClasses["no-update"] = !0;
        newClasses["update-problem"] = !same;
        entry.$(".update-note").textContent = message;
        entry.$(".check-update").title = manage_util.UI.tableView ? message : "";
        entry.$(".update").title = util.t(edited ? "updateCheckManualUpdateForce" : "installUpdate");
        if (error === STATES.SAME_CODE) for (const view of chrome.extension.getViews({
          type: "tab"
        })) if (view.location.pathname === location.pathname) {
          const el = view["style-" + style.id];
          el && (el.styleMeta.originalDigest = style.originalDigest);
        }
        isCheckAll || renderUpdatesOnlyFilter({
          show: document.querySelector(".can-update, .update-problem")
        });
      }
      dom.$toggleClasses(entry, newClasses);
      filters.filtersSelector.hide && isCheckAll ? filters.filterAndAppend({
        entry
      }).then(sorter.updateStripes) : updated && !isCheckAll && renderUpdatesOnlyFilter();
    }
    function renderUpdatesOnlyFilter({show, check} = {}) {
      const numUpdatable = document.querySelectorAll(".can-update").length;
      const mightUpdate = numUpdatable > 0 || document.querySelector(".update-problem");
      const checkbox = elOnlyUpdates.$("input");
      show = show !== void 0 ? show : mightUpdate;
      check = check !== void 0 ? show && check : checkbox.checked && mightUpdate;
      elOnlyUpdates.parentElement.hidden = !show;
      checkbox.checked = check && show;
      checkbox.dispatchEvent(new Event("change"));
      dom.$detach(btnApply, !numUpdatable);
      btnApply.dataset.value = numUpdatable;
    }
    async function UpdateHistory(show, el, selector) {
      if (!show) {
        var _;
        await ((_ = uiLog) == null ? void 0 : _.close());
        uiLog = null;
        return;
      }
      const log = dom.$create(selector);
      let scroller, toggler;
      let deleted = !1;
      const [lines = [], states] = await Promise.all([ storage_util.chromeLocal.getValue("updateLog"), msg_api.API.updater.getStates() ]);
      const logText = lines.join("\n");
      await dom_util.messageBox.show({
        title: util.t("updateCheckHistory"),
        className: "center-dialog",
        contents: log,
        blockScroll: !0,
        buttons: [ util.t("confirmOK"), logText && {
          textContent: util.t("confirmDelete"),
          onclick: function() {
            if (deleted) {
              storage_util.chromeLocal.set({
                updateLog: logText.split("\n")
              });
              setTimeout(scrollToBottom);
            } else {
              storage_util.chromeLocal.remove("updateLog");
              log.textContent = "";
            }
            deleted = !deleted;
            toggler.onchange();
            this.textContent = util.t(deleted ? "undo" : "confirmDelete");
          }
        } ],
        onshow: logText && function(box) {
          uiLog = this;
          scroller = box._body;
          scroller.tabIndex = 0;
          setTimeout(() => scroller.focus());
          scrollToBottom();
          box._buttons.$("button").after(dom.$create("label", [ toggler = dom.$create("input", {
            type: "checkbox",
            checked: !0,
            onchange: toggleSkipped
          }), util.t("manageOnlyUpdates") ]));
          toggler.rxRemoveNOP = new RegExp("^[^#]*(" + Object.keys(states).filter(k => k.startsWith("SAME_")).map(k => states[k]).join("|") + ").*\r?\n", "gm");
          toggler.onchange();
        }
      });
      function scrollToBottom() {
        scroller.scrollTop = 1e9;
      }
      function calcScrollRatio() {
        return (scroller.scrollTop + scroller.clientHeight) / scroller.scrollHeight;
      }
      function toggleSkipped() {
        if (deleted) return;
        const scrollRatio = calcScrollRatio();
        log.textContent = this.checked ? logText.replace(this.rxRemoveNOP, "") : logText;
        Math.abs(scrollRatio - calcScrollRatio()) > .1 && (scroller.scrollTop = scrollRatio * scroller.scrollHeight - scroller.clientHeight);
      }
    }
    function handleUpdateInstalled(entry, reason) {
      const isNew = reason === "install";
      const note = util.t(isNew ? "installButtonInstalled" : "updateCompleted");
      entry.classList.add("update-done", ...isNew ? [ "install-done" ] : []);
      entry.classList.remove("can-update", "updatable");
      entry.$(".update-note").textContent = note;
      manage_util.UI.tableView && (entry.$(".updated").title = note);
      renderUpdatesOnlyFilter();
    }
    var target_icons = ae(8838);
    var util_webext = ae(5288);
    for (const a of document.querySelectorAll('#header a[href^="http"]')) a.onclick = openLink;
    manage_util.installed.on("click", onEntryClicked);
    manage_util.installed.on("contextmenu", onEntryClicked);
    manage_util.installed.on("mouseover", manage_util.lazyAddEntryTitle, {
      passive: !0
    });
    manage_util.installed.on("mouseout", manage_util.lazyAddEntryTitle, {
      passive: !0
    });
    window.on("pageshow", e => {
      if (e.persisted && (e = +util.sessionStore.justEditedStyleId)) {
        handleUpdateForId(e, {
          method: "styleUpdated"
        });
        delete util.sessionStore.justEditedStyleId;
      }
    });
    window.on("beforeunload", () => {
      history.replaceState({
        scrollY: window.scrollY
      }, document.title, location);
    });
    msg.onMessage.set(m => {
      switch (m.method) {
       case "styleUpdated":
       case "styleAdded":
       case "styleDeleted":
        manage_util.queue.push(m);
        manage_util.queue.p != null || (manage_util.queue.p = Promise.resolve().then(handleBulkChange));
      }
    });
    const SEL_EXPANDER = ".applies-to .expander";
    const ENTRY_ROUTES = {
      "input, .enable, .disable"(event, entry) {
        msg_api.API.styles.toggle(entry.styleId, this.matches(".enable") || this.checked);
      },
      ".style-name"(event, entry) {
        manage_util.UI.tableView && !event.target.closest(".homepage") && edit(event, entry);
      },
      ".homepage": openLink,
      ".check-update"(event, entry) {
        checkUpdate(entry, {
          single: !0
        });
      },
      ".update"(event, entry) {
        const json = entry.updatedCode;
        json.id = entry.styleId;
        (json.usercssData ? msg_api.API.usercss.install : msg_api.API.styles.install)(json);
      },
      async ".delete"(event, entry) {
        dom_util.animateElement(entry);
        const meta = entry.styleMeta;
        const name = meta.customName || meta.name;
        await dom_util.messageBox.confirm(name, "danger", util.t("deleteStyleConfirm"), {
          buttons: [ util.t("confirmDelete"), util.t("confirmCancel") ]
        }) && msg_api.API.styles.remove(entry.styleId);
      },
      ".configure-usercss"(event, {styleId}) {
        dom_util.configDialog(styleId);
      },
      [SEL_EXPANDER]: expandTargets
    };
    const ENTRY_ROUTES_CTX = {
      [SEL_EXPANDER]: expandTargets
    };
    async function edit(event, entry) {
      if (event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      const key = dom_util.getEventKeyName(event);
      const url = entry.$("[href]").href;
      const ownTab = await util_webext.getOwnTab();
      key === "MouseL" ? location = util.sessionStore["manageStylesHistory" + ownTab.id] = util.urlParams.has("popup") ? url + (url.includes("?") ? "&" : "?") + "popup=1" : url : util_webext.browserWindows && key === "Shift-MouseL" ? msg_api.API.tabs.openEditor({
        id: entry.styleId
      }) : msg_api.API.tabs.open({
        url,
        index: ownTab.index + 1,
        active: key === "Shift-MouseM" || key === "Shift-Ctrl-MouseL"
      });
    }
    function expandTargets(event, entry) {
      if (event.type === "contextmenu") {
        event.preventDefault();
        const ex = ".expanded";
        document.querySelectorAll(`.has-more${entry.$(ex) ? ex : `:not(${ex})`} .expander`).forEach(el => el.click());
        return;
      }
      if (!entry._allTargetsRendered) {
        render.createTargetsElement({
          entry,
          expanded: !0
        });
        manage_util.UI.favicons && target_icons.renderTargetIcons(entry);
      }
      this.closest(".applies-to").classList.toggle("expanded");
    }
    async function openLink(event) {
      if (dom_util.getEventKeyName(event) !== "Shift-MouseL") {
        event.preventDefault();
        const {index} = await util_webext.getOwnTab();
        msg_api.API.tabs.open({
          url: event.target.closest("a").href,
          index: index + 1,
          active: !event.ctrlKey || event.shiftKey
        });
      }
    }
    function onEntryClicked(event) {
      const target = event.target;
      const entry = target.closest(".entry");
      const routes = event.type === "contextmenu" ? ENTRY_ROUTES_CTX : ENTRY_ROUTES;
      for (const selector in routes) for (let el = target; el && el !== entry; el = el.parentElement) if (el.matches(selector)) return routes[selector].call(el, event, entry);
    }
    function handleBulkChange() {
      for (const msg of manage_util.queue) {
        const {id} = msg.style;
        let fullStyle;
        if (msg.method === "styleDeleted") handleDelete(id); else if (msg.reason === "import" && (fullStyle = manage_util.queue.styles.get(id))) {
          handleUpdate(fullStyle, msg);
          manage_util.queue.styles.delete(id);
        } else handleUpdateForId(id, msg);
      }
      sorter.updateStripes({
        onlyWhenColumnsChanged: !0
      });
      manage_util.queue.p = null;
      manage_util.queue.length = 0;
    }
    function handleDelete(id) {
      const node = document.getElementById("style-" + id);
      if (node) {
        node.remove();
        if (node.matches(".can-update")) {
          const btnApply = document.getElementById("apply-all-updates");
          btnApply.dataset.value = Number(btnApply.dataset.value) - 1;
        }
        filters.showFiltersStats();
        render.updateTotal(-1);
      }
    }
    function handleUpdate(style, {reason, method} = {}) {
      if (!style || reason === "editPreview" || reason === "editPreviewEnd") return;
      let entry;
      let oldEntry = document.getElementById("style-" + style.id);
      oldEntry && method === "styleUpdated" && (() => {
        const diff = manage_util.objectDiff(oldEntry.styleMeta, style).filter(({key, path}) => path || !/^_|(Date|Digest|Md5)$/.test(key));
        if (diff.length === 0) {
          entry = oldEntry;
          oldEntry = null;
        }
        if (diff.length === 1 && diff[0].key === "enabled") {
          const isOn = style.enabled;
          dom.$toggleClasses(oldEntry, {
            enabled: isOn,
            disabled: !isOn
          });
          for (const el of oldEntry.$$("input")) el.checked = isOn;
          oldEntry.styleMeta = style;
          entry = oldEntry;
          oldEntry = null;
        }
      })();
      entry = entry || render.createStyleElement(manage_util.styleToDummyEntry(style));
      oldEntry ? oldEntry.styleNameLC === entry.styleNameLC ? manage_util.installed.replaceChild(entry, oldEntry) : oldEntry.remove() : render.updateTotal(1);
      reason !== "update" && reason !== "install" || !entry.matches(".updatable") || handleUpdateInstalled(entry, reason);
      filters.filterAndAppend({
        entry
      }).then(sorter.update);
      if (!entry.matches(".hidden") && reason !== "import" && reason !== "sync") {
        dom_util.animateElement(entry);
        requestAnimationFrame(() => dom_util.scrollElementIntoView(entry));
      }
      manage_util.UI.favicons && target_icons.renderTargetIcons(entry);
    }
    async function handleUpdateForId(id, opts) {
      handleUpdate(await msg_api.API.styles.getCore({
        id,
        sections: !0,
        size: !0
      }), opts);
    }
    let prevText, focusedLink, focusedEntry;
    let prevTime = performance.now();
    let focusedName = "";
    const input = dom.$create("textarea", {
      id: "incremental-search",
      spellcheck: !1,
      tabIndex: -1,
      oninput: incrementalSearch
    });
    replaceInlineStyle({
      opacity: "0"
    });
    document.body.appendChild(input);
    window.on("keydown", event => {
      if (event.altKey || event.metaKey) return;
      const modal = document.getElementById("message-box");
      if (modal && !modal.classList.contains("injection-order")) return;
      const inTextInput = dom.$isTextInput(event.target);
      const {key, code, ctrlKey: ctrl} = event;
      if (code === "KeyF" && ctrl && !event.shiftKey || (code === "Slash" || key === "/") && !ctrl && !inTextInput) {
        event.preventDefault();
        modal || document.getElementById("search").focus();
        return;
      }
      if (ctrl || inTextInput && event.target !== input) return;
      const time = performance.now();
      if (key.length === 1) {
        time - prevTime > 1e3 && (input.value = "");
        if (key !== " " || input.value) {
          input.focus();
          prevTime = time;
        } else input.blur();
      } else if (key === "Enter" && focusedLink) focusedLink.dispatchEvent(new MouseEvent("click", {
        bubbles: !0
      })); else if ((key === "ArrowUp" || key === "ArrowDown") && !event.shiftKey && time - prevTime < 5e3 && incrementalSearch(event, !0)) prevTime = time; else if (event.target === input) {
        (focusedLink || document.body).focus();
        input.value = "";
      }
    }, !0);
    function incrementalSearch(event, immediately) {
      const {key} = event;
      if (!immediately) {
        util.debounce(incrementalSearch, 100, {}, !0);
        return;
      }
      const direction = key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0;
      const text = input.value.toLocaleLowerCase();
      direction && event.preventDefault();
      if (!text.trim() || !direction && (text === prevText || focusedName.startsWith(text))) {
        prevText = text;
        return;
      }
      let textAtPos = 1e6;
      let rotated;
      const entries = [ ...document.getElementById("message-box") ? document.querySelectorAll(".injection-order-entry") : manage_util.installed.children ];
      const focusedIndex = entries.indexOf(focusedEntry);
      focusedIndex > 0 && (direction > 0 ? rotated = entries.slice(focusedIndex + 1).concat(entries.slice(0, focusedIndex + 1)) : direction < 0 && (rotated = entries.slice(0, focusedIndex).reverse().concat(entries.slice(focusedIndex).reverse())));
      let found;
      for (const entry of rotated || entries) {
        if (entry.classList.contains("hidden")) continue;
        const pos = entry.styleNameLC.indexOf(text);
        if (pos === 0) {
          found = entry;
          break;
        }
        if (pos > 0 && (pos < textAtPos || direction)) {
          found = entry;
          textAtPos = pos;
          if (direction) break;
        }
      }
      if (found && found !== focusedEntry) {
        focusedEntry = found;
        focusedLink = found.$("a");
        focusedName = found.styleNameLC;
        dom_util.scrollElementIntoView(found, {
          invalidMarginRatio: .25
        });
        dom_util.animateElement(found, "highlight-quick");
        replaceInlineStyle({
          width: focusedLink.offsetWidth + "px",
          height: focusedLink.offsetHeight + "px",
          opacity: "1"
        });
        focusedLink.prepend(input);
        input.focus();
        return !0;
      }
    }
    function replaceInlineStyle(css) {
      for (const prop in css) input.style.setProperty(prop, css[prop], "important");
    }
    (async () => {
      const data = await prefs.clientData;
      const {badStyles} = data;
      const selectorOpts = "#manage-options-button, #sync-styles";
      dom_prefs.setupLiveDetails();
      dom_prefs.setupLivePrefs();
      manage_util.UI.render(!0);
      sorter.init();
      if (util.isSidebar) for (const el of document.querySelectorAll(selectorOpts)) el.on("click", () => location.assign(`/options.html?sidebar#${el.id}`)); else router.makeToggle(selectorOpts, "stylus-options", EmbeddedOptions);
      router.makeToggle("#injection-order-button", "injection-order", InjectionOrder);
      router.makeToggle("#update-history-button", "update-history", UpdateHistory);
      router.update();
      render.showStyles(data.styles || [], data.ids);
      if (badStyles) {
        (0, dom_error.default)(`${util.t("dbError")} (${badStyles.length} ${util.t("importReportLegendInvalid")})`);
        console.log(badStyles);
      }
      initSyncButton(data.sync || {});
      ae.e("manage_import-export_js").then(ae.bind(ae, 9052));
    })();
    document.styleSheets[0].insertRule(`:root {${[ "genericDisabledLabel", "updateAllCheckSucceededSomeEdited", "filteredStylesAllHidden" ].map(id => `--${id}:"${CSS.escape(util.t(id))}";`).join("")}}`);
    function initSyncButton(sync) {
      const el = document.getElementById("sync-styles");
      const elMsg = document.querySelector("#backup p");
      const render = val => {
        const driveId = val.drive || prefs.__values["sync.enabled"];
        const drive = sync_util.DRIVE_NAMES[driveId];
        const hasFav = drive && driveId !== "webdav";
        const img = el.$("img");
        const msg = drive ? sync_util.getStatusText(val) : "";
        el.title = util.t("optionsCustomizeSync");
        el.classList.toggle("icon", !hasFav);
        dom.$toggleDataset(el, "cloud", drive);
        elMsg.textContent = msg === "pending" || msg === "connected" ? "" : msg;
        img.hidden = !hasFav;
        img.src = hasFav ? urls.favicon(driveId + ".com") : "";
        el.$("i").hidden = hasFav;
      };
      msg.onMessage.set(e => {
        e.method === "syncStatusUpdate" && render(e.status);
      });
      prefs.subscribe("sync.enabled", (k, v) => v === "none" && render({}));
      render(sync);
    }
    async function EmbeddedOptions(show, el, selector, toggler) {
      document.title = util.t(show ? "optionsHeading" : "styleManager");
      if (show) {
        (el = dom.$root.appendChild(dom.$create("iframe" + selector, {
          src: "/options.html#" + toggler.id
        }))).focus();
        await new Promise(resolve => window.closeOptions = resolve);
      } else {
        var _;
        (_ = el.contentDocument.activeElement) == null || _.blur();
        await dom_util.animateElement(el, "fadeout");
        el.remove();
      }
    }
  },
  9080(_, ee, ae) {
    ee.createStyleElement = createStyleElement;
    ee.createTargetsElement = createTargetsElement;
    ee.fitNameColumn = fitNameColumn;
    ee.fitSizeColumn = fitSizeColumn;
    ee.showStyles = async (styles, matchUrlIds) => {
      var _;
      const num = styles.length;
      const dummies = styles.map(Ie.styleToDummyEntry);
      const sorted = Ce.sort(dummies);
      const scrollY = (_ = history.state) == null ? void 0 : _.scrollY;
      const shouldRenderAll = scrollY > window.innerHeight || Se.sessionStore.justEditedStyleId || canRenderAll;
      const perfSource = !shouldRenderAll && (ye.FIREFOX ? Date : performance);
      const t0 = perfSource && perfSource.now();
      const renderBin = document.createDocumentFragment();
      if (Ie.isColumnable) {
        fitNameColumn(styles);
        fitSizeColumn(dummies);
      }
      updateTotal(num);
      let numIconized;
      if (num) for (let entry, done, i = 0; ;i++) {
        entry = createStyleElement(sorted[i]);
        matchUrlIds && !matchUrlIds.includes(entry.styleMeta.id) && entry.classList.add("not-matching", "hidden");
        renderBin.appendChild(entry);
        done = i === num - 1;
        if (done || !(shouldRenderAll || (i & 7) < 7 || perfSource.now() - t0 < 50)) {
          if (!numIconized && Ie.UI.favicons) {
            numIconized = i;
            he.renderTargetIcons(renderBin);
          }
          Ee.filterAndAppend({
            container: renderBin
          }, matchUrlIds).then(Ce.updateStripes);
          if (done) break;
          await new Promise(requestAnimationFrame);
        }
      }
      scrollY >= 0 && (window.scrollY = scrollY);
      Se.sessionStore.justEditedStyleId && setTimeout(highlightEditedStyle);
      numIconized < numStyles && requestIdleCallback(() => he.renderTargetIcons(Ie.installed));
    };
    ee.updateTotal = updateTotal;
    ae.d(ee, {
      favsBusy: () => {},
      partEntry: () => partEntry
    });
    var oe = ae(9298);
    var le = ae(4777);
    var ue = ae(9293);
    var pe = ae(2956);
    var fe = ae(5012);
    var he = ae(8838);
    var ye = ae(9818);
    var Se = ae(2076);
    var Ee = ae(9201);
    var Ce = ae(5291);
    var Ie = ae(6793);
    const AGES = [ [ 24, "h", Se.t("dateAbbrHour", "") ], [ 30, "d", Se.t("dateAbbrDay", "") ], [ 12, "m", Se.t("dateAbbrMonth", "") ], [ 1 / 0, "y", Se.t("dateAbbrYear", "") ] ];
    const canRenderAll = CSS.supports("content-visibility", "auto");
    const groupThousands = num => `${num}`.replace(/\d(?=(\d{3})+$)/g, "$& ");
    const renderSize = size => groupThousands(Math.round(size / 1024)) + "k";
    const nameLengths = new Map;
    const partDecorations = {
      urlPrefixesAfter: "*",
      regexpsBefore: "/",
      regexpsAfter: "/"
    };
    const rxIsDateVer = /^20\d{4,6}(?:\.\d\d?){2}$/;
    const rxNonCJK = /[^\u3000-\uFE00]+/g;
    let elLinks, elLinksPrev;
    let numStyles = 0;
    let partEntry;
    let partChecker, partEditLink, partEntryClassBase, partHomepage, partInfoAge, partInfoSize, partInfoVer, partNameLink, partNewUI, partOldCheckUpdate, partOldConfigure, partTargets;
    let tplConfigureIcon, tplEverything, tplExtra, tplSep, tplTarget, tplUpdaterIcons;
    function createAgeText(el, style) {
      let val = style.updateDate || style.installDate;
      if (val) {
        val = (Date.now() - val) / 36e5;
        for (const [max, unit, text] of AGES) {
          const rounded = Math.round(val);
          if (rounded < max) {
            el.textContent = text.replace("", rounded);
            el.dataset.value = `${Math.round(rounded)}`.padStart(2) + unit;
            break;
          }
          val /= max;
        }
      } else if (el.firstChild) {
        el.textContent = "";
        delete el.dataset.value;
      }
    }
    function createParts(isNew) {
      partNewUI = isNew;
      partEntry = ue.template[isNew ? "styleNewUI" : "style"].cloneNode(!0);
      partEntryClassBase = partEntry.className;
      partChecker = partEntry.$("input") || {};
      partNameLink = partEntry.$(".style-name-link");
      partEditLink = partEntry.$(".style-edit-link") || {};
      partHomepage = partEntry.$(".homepage");
      partInfoAge = partEntry.$("[data-type=age]");
      partInfoSize = partEntry.$("[data-type=size]");
      partInfoVer = partEntry.$("[data-type=version]");
      partTargets = partEntry.$(".targets");
      partOldConfigure = !isNew && partEntry.$(".configure-usercss");
      partOldCheckUpdate = !isNew && partEntry.$(".check-update");
      return partEntry;
    }
    function createStyleElement({styleMeta: style, styleNameLC: nameLC, styleSize: size}) {
      const ud = style.usercssData;
      const {updateUrl} = style;
      const configurable = !(ud == null || !ud.vars);
      const name = style.customName || style.name;
      const version = ud ? ud.version : "";
      const isTable = Ie.UI.tableView;
      isTable !== partNewUI && createParts(isTable);
      partChecker.checked = style.enabled;
      partChecker.name = "c" + style.id;
      partNameLink.firstChild.textContent = ue.breakWord(name);
      partNameLink.href = partEditLink.href = "edit.html?id=" + style.id;
      partHomepage.href = partHomepage.title = style.url || "";
      partInfoVer.textContent = version;
      partInfoVer.dataset.value = version;
      oe.$toggleDataset(partInfoVer, "isDate", version.length >= 8 && rxIsDateVer.test(version));
      createAgeText(partInfoAge, style);
      partInfoSize.dataset.value = Math.log10(size || 1) | 0;
      partInfoSize.textContent = renderSize(size);
      partInfoSize.title = `${Se.t("genericSize")}: ${groupThousands(size)} B`;
      if (!isTable) {
        partOldConfigure.classList.toggle("hidden", !configurable);
        partOldCheckUpdate.classList.toggle("hidden", !updateUrl);
      }
      const entry = partEntry.cloneNode(!0);
      entry.id = "style-" + style.id;
      entry.styleId = style.id;
      entry.styleNameLC = nameLC;
      entry.styleMeta = style;
      entry.styleSize = size;
      entry.className = partEntryClassBase + " " + (style.enabled ? "enabled" : "disabled") + (updateUrl ? " updatable" : "") + (ud ? " usercss" : "");
      isTable && (updateUrl || configurable) && entry.$(".actions").append(...[ updateUrl && (tplUpdaterIcons != null ? tplUpdaterIcons : tplUpdaterIcons = ue.template.updaterIcons).cloneNode(!0), configurable && (tplConfigureIcon != null ? tplConfigureIcon : tplConfigureIcon = ue.template.configureIcon).cloneNode(!0) ].filter(Boolean));
      createTargetsElement({
        entry,
        style
      });
      return entry;
    }
    function createTargetsElement({entry, expanded, style = entry.styleMeta}) {
      const maxTargets = expanded ? 1e3 : Ie.UI.targets;
      if (!maxTargets) {
        entry._numTargets = 0;
        return;
      }
      const displayed = new Set;
      const entryTargets = entry.$(".targets");
      const expanderCls = entry.$(".applies-to").classList;
      const targets = partTargets.cloneNode(!0);
      const toAppend = [];
      let container = targets;
      let el = entryTargets.firstElementChild;
      let numTargets = 0;
      let allTargetsRendered = !0;
      for (const type in fe.TO_CSS) {
        const cssType = fe.TO_CSS[type];
        for (const section of style.sections) for (const targetValue of section[type] || []) {
          if (displayed.has(targetValue)) continue;
          if (++numTargets > maxTargets) {
            allTargetsRendered = expanded;
            break;
          }
          displayed.add(targetValue);
          const text = (partDecorations[type + "Before"] || "") + targetValue + (partDecorations[type + "After"] || "");
          if (el && el.dataset.type === cssType && el.lastChild.textContent === text) {
            const next = el.nextElementSibling;
            toAppend.push(el);
            el = next;
            continue;
          }
          const element = (tplTarget != null ? tplTarget : tplTarget = ue.template.appliesToTarget).cloneNode(!0);
          if (!Ie.UI.tableView) if (numTargets === maxTargets) {
            const extra = (tplExtra != null ? tplExtra : tplExtra = ue.template.extraAppliesTo).cloneNode(!0);
            toAppend.push(extra);
            container.append(...toAppend);
            container = extra;
            toAppend.length = 0;
          } else numTargets > 1 && toAppend.push((tplSep != null ? tplSep : tplSep = ue.template.appliesToSeparator).cloneNode(!0));
          element.dataset.type = cssType;
          element.append(text);
          toAppend.push(element);
        }
      }
      container.append(...toAppend);
      Ie.UI.tableView && numTargets > Ie.UI.targets && expanderCls.add("has-more");
      if (numTargets) entryTargets.parentElement.replaceChild(targets, entryTargets); else if (!entry.classList.contains("global") || !entryTargets.firstElementChild) {
        entryTargets.firstElementChild && (entryTargets.textContent = "");
        entryTargets.appendChild((tplEverything != null ? tplEverything : tplEverything = ue.template.appliesToEverything).cloneNode(!0));
      }
      entry.classList.toggle("global", !numTargets);
      entry._allTargetsRendered = allTargetsRendered;
      entry._numTargets = numTargets;
      Ie.UI.tableView && entry.style.setProperty("--num-targets", Math.min(numTargets, Ie.UI.targets));
    }
    function highlightEditedStyle() {
      if (!Se.sessionStore.justEditedStyleId) return;
      const entry = document.getElementById("style-" + Se.sessionStore.justEditedStyleId);
      delete Se.sessionStore.justEditedStyleId;
      if (entry) {
        le.scrollElementIntoView(entry);
        setTimeout(le.animateElement, 0, entry);
      }
    }
    function fitNameColumn(styles, style) {
      style && calcNameLenKey(style);
      styles = styles ? styles.map(calcNameLenKey) : [ ...nameLengths.values() ];
      const pick = Ce.columns > 1 ? .8 : .95;
      const res = nameLengths.res = styles.sort()[nameLengths.size * pick | 0] + 5 - 1e9;
      oe.$root.style.setProperty("--name-width", res + "ch");
    }
    function calcNameLenKey(style) {
      const name = style.displayName || style.name || "";
      const len = 1e9 + (style.enabled ? 1.05 : 1) * (name.length + name.replace(rxNonCJK, "").length) | 0;
      nameLengths.set(style.id, len);
      return len;
    }
    function fitSizeColumn(entries = Ie.installed.children, entry) {
      let res = entry && renderSize(entry.styleSize).length || 0;
      if (res) {
        if (res <= parseInt(oe.$root.style.getPropertyValue("--size-width"))) return;
      } else {
        for (const e of entries) res = Math.max(res, e.styleSize);
        res = renderSize(res).length;
      }
      oe.$root.style.setProperty("--size-width", res + "ch");
    }
    function updateTotal(delta) {
      numStyles += delta;
      if (+Ie.installed.dataset.total === numStyles) return;
      Ie.installed.dataset.total = numStyles;
      elLinksPrev != null || (elLinksPrev = (elLinks = document.querySelector("#links")).previousSibling);
      const det = elLinks.$("details");
      const prefId = "manage.links.expanded";
      oe.$toggleDataset(det, "pref", numStyles && prefId);
      det.open = !numStyles || pe.__values[prefId];
      numStyles ? elLinksPrev.after(elLinks) : Ie.installed.after(elLinks);
      oe.$rootCL.toggle("empty", !numStyles);
    }
  },
  3029(_, ee, ae) {
    ee.makeToggle = (toggler, hashId, showHide, loadDeps) => {
      const hash = "#" + hashId;
      const selector = "." + hashId;
      watch({
        hash
      }, async state => {
        const el = document.querySelector(selector);
        if (!state != !el) {
          state && loadDeps && (showHide != null || (showHide = await loadDeps()));
          await showHide(state, el, selector, toggler);
          state && updateHash("");
        }
      });
      for (const el of document.querySelectorAll(toggler)) el.on("click", () => {
        toggler = el;
        updateHash(hash);
      });
    };
    ee.update = update;
    ee.updateSearch = (what, value) => {
      const u = new URL(location);
      const usp = u.searchParams;
      if (typeof what == "object") for (const key in what) (value = what[key]) ? usp.set(key, value) : usp.delete(key); else value ? usp.set(what, value) : usp.delete(what);
      history.replaceState(history.state, null, `${u}`);
      buffer.pop();
      update();
    };
    ee.watch = watch;
    ae.d(ee, {});
    var oe = ae(4931);
    var le;
    const buffer = ((le = history.state) == null ? void 0 : le.buffer) || [];
    const watchers = [];
    let needInit;
    function push(url) {
      const state = history.state || {};
      state.buffer = buffer;
      history.pushState(state, null, url);
    }
    function update() {
      const len = buffer.length;
      const url = location.href;
      if (len) if (buffer[len - 1] === url) {
        if (!needInit) return;
      } else len > 1 && buffer[len - 2] === url ? buffer.pop() : buffer.push(url); else buffer.push(url);
      callWatchers();
    }
    function callWatchers() {
      for (const [options, callback] of watchers) {
        let state, serialized;
        const {hash, search} = options;
        if (hash) {
          state = hash === location.hash;
          serialized = state;
        } else if (search) {
          state = new URLSearchParams(location.search);
          state = search.map(state.get, state);
          serialized = JSON.stringify(state);
        }
        if (options.state !== serialized) {
          options.state = serialized;
          callback(state);
        }
      }
      needInit = !1;
    }
    function updateHash(hash) {
      if (buffer.length > 1 && (!hash && !buffer[buffer.length - 2].includes("#") || hash && buffer[buffer.length - 2].endsWith(hash))) history.back(); else {
        hash || (hash = " ");
        push(hash);
        update();
      }
    }
    function watch(options, callback) {
      watchers.push([ options, callback ]);
      needInit = !0;
    }
    window.on("popstate", update);
    window.on("hashchange", update);
    oe.onMessage.set(m => {
      if (m.method === "pushState" && m.url !== location.href) {
        push(m.url);
        update();
      }
    });
  },
  5291(_, ee, ae) {
    ee.init = () => {
      ue.subscribe(ID, update);
      addOptions();
      ue.subscribe("manage.minColumnWidth", updateColumnWidth, !0);
    };
    ee.sort = sort;
    ee.update = update;
    ee.updateStripes = updateStripes;
    ae.d(ee, {
      columns: () => columns
    });
    var oe = ae(9298);
    var le = ae(2378);
    var ue = ae(2956);
    var pe = ae(2076);
    var fe = ae(6793);
    const COL_PROP = "--columns";
    const sorterType = {
      alpha: (a, b) => a < b ? -1 : a === b ? 0 : 1,
      number: (a, b) => (a || 0) - (b || 0)
    };
    const tagData = {
      title: {
        text: pe.t("genericTitle"),
        parse: v => v.styleNameLC,
        sorter: sorterType.alpha
      },
      usercss: {
        text: "Usercss",
        parse: v => v.styleMeta.usercssData ? 0 : 1,
        sorter: sorterType.number
      },
      disabled: {
        text: "",
        parse: v => v.styleMeta.enabled ? 1 : 0,
        sorter: sorterType.number
      },
      dateInstalled: {
        text: pe.t("dateInstalled"),
        parse: v => v.styleMeta.installDate,
        sorter: sorterType.number
      },
      dateUpdated: {
        text: pe.t("dateUpdated"),
        parse: ({styleMeta: s}) => s.updateDate || s.installDate,
        sorter: sorterType.number
      },
      size: {
        text: pe.t("genericSize"),
        parse: v => v.styleSize,
        sorter: sorterType.number
      }
    };
    const selectOptions = [ "{groupAsc}", "title,asc", "dateInstalled,desc, title,asc", "dateInstalled,asc, title,asc", "dateUpdated,desc, title,asc", "dateUpdated,asc, title,asc", "usercss,asc, title,asc", "usercss,desc, title,asc", "disabled,asc, title,asc", "disabled,desc, title,asc", "disabled,desc, usercss,asc, title,asc", "size,desc, title,asc", "{groupDesc}", "title,desc", "usercss,asc, title,desc", "usercss,desc, title,desc", "disabled,desc, title,desc", "disabled,desc, usercss,asc, title,desc" ];
    const splitRegex = /\s*,\s*/;
    const ID = "manage.newUI.sort";
    const getPref = () => ue.__values[ID] || ue.defaults[ID];
    let columns = 1;
    let minWidth;
    function addOptions() {
      let container;
      const select = document.getElementById(ID);
      const renderBin = document.createDocumentFragment();
      const option = document.createElement("option");
      const optgroup = document.createElement("optgroup");
      const meta = {
        desc: " 🠇",
        enabled: pe.t("genericEnabledLabel"),
        disabled: pe.t("genericDisabledLabel"),
        dateNew: ` (${pe.t("sortDateNewestFirst")})`,
        dateOld: ` (${pe.t("sortDateOldestFirst")})`,
        groupAsc: pe.t("sortLabelTitleAsc"),
        groupDesc: pe.t("sortLabelTitleDesc")
      };
      selectOptions.forEach(opt => {
        if (/{\w+}/.test(opt)) {
          container && renderBin.appendChild(container);
          container = optgroup.cloneNode();
          container.label = meta[opt.substring(1, opt.length - 1)];
          return;
        }
        let lastTag = "";
        const elOpt = option.cloneNode();
        elOpt.textContent = opt.split(splitRegex).reduce((acc, val) => {
          if (tagData[val]) {
            lastTag = val;
            return acc + (acc !== "" ? " + " : "") + tagData[val].text;
          }
          return lastTag.indexOf("date") > -1 ? acc + meta[val === "desc" ? "dateNew" : "dateOld"] : lastTag === "disabled" ? acc + meta[val === "desc" ? "enabled" : "disabled"] : acc + (meta[val] || "");
        }, "");
        elOpt.value = opt;
        container.appendChild(elOpt);
      });
      renderBin.appendChild(container);
      select.appendChild(renderBin);
      select.value = getPref();
    }
    function sort(styles) {
      const sortBy = getPref().split(splitRegex);
      const len = sortBy.length;
      return styles.sort((a, b) => {
        let types, direction;
        let result = 0;
        let index = 0;
        for (;result === 0 && index < len; ) {
          types = tagData[sortBy[index++]];
          direction = sortBy[index++] === "asc" ? 1 : -1;
          result = types.sorter(types.parse(a), types.parse(b)) * direction;
        }
        return result;
      });
    }
    function update() {
      const current = [ ...fe.installed.children ];
      const sorted = sort([ ...current ]);
      current.some((el, i) => el !== sorted[i]) && fe.installed.append(...sorted);
      updateStripes();
    }
    function updateStripes({onlyWhenColumnsChanged} = {}) {
      if (onlyWhenColumnsChanged && !updateColumnCount()) return;
      let index = 0;
      let isOdd = !1;
      const flipRows = columns % 2 == 0;
      for (const {classList} of fe.installed.children) if (!classList.contains("hidden")) {
        classList.toggle("odd", isOdd);
        classList.toggle("even", !isOdd);
        flipRows && ++index >= columns ? index = 0 : isOdd = !isOdd;
      }
    }
    function updateColumnCount() {
      const v = [].some.call(oe.$root.children, el => el.tagName === "STYLE" && el.textContent.includes(COL_PROP + ":")) ? Math.max(1, getComputedStyle(oe.$root).getPropertyValue(COL_PROP) | 0) : minWidth ? onResize() : columns;
      if (columns !== v) {
        columns = v;
        return !0;
      }
    }
    function updateColumnWidth(_, val) {
      minWidth = Math.max(val, 300);
      if (val < 9999) window.on("resize", onResize); else {
        window.off("resize", onResize);
        oe.$root.style.removeProperty(COL_PROP);
      }
      updateStripes({
        onlyWhenColumnsChanged: !0
      });
    }
    function onResize(evt) {
      const c = Math.max(1, (innerWidth - le.headerWidth) / minWidth | 0);
      if (columns !== c) {
        oe.$root.style.setProperty(COL_PROP, c);
        if (evt) {
          columns = c;
          updateStripes();
        }
      }
      return c;
    }
  },
  6793(_, ee, ae) {
    ee.addEntryTitle = addEntryTitle;
    ee.lazyAddEntryTitle = ({type, target}) => {
      const cell = target.closest("h2.style-name, [data-type=age]");
      if (cell) {
        const link = cell.$(".style-name-link") || cell;
        type !== "mouseover" || link.title ? util.debounce.unregister(addEntryTitle) : util.debounce(addEntryTitle, 50, link);
      }
    };
    ee.objectDiff = function objectDiff(first, second, path = "") {
      const diff = [];
      for (const key in first) {
        const a = first[key];
        const b = second[key];
        a !== b && (b !== void 0 ? a && typeof a.filter == "function" && b && typeof b.filter == "function" ? (a.length !== b.length || a.some((el, i) => el && typeof el == "object" ? objectDiff(el, b[i], path + key + "[" + i + "].").length : el !== b[i])) && diff.push({
          path,
          key,
          values: [ a, b ],
          type: "changed"
        }) : a && b && typeof a == "object" && typeof b == "object" ? diff.push(...objectDiff(a, b, path + key + ".")) : diff.push({
          path,
          key,
          values: [ a, b ],
          type: "changed"
        }) : diff.push({
          path,
          key,
          values: [ a ],
          type: "removed"
        }));
      }
      for (const key in second) key in first || diff.push({
        path,
        key,
        values: [ second[key] ],
        type: "added"
      });
      return diff;
    };
    ee.styleToDummyEntry = style => {
      const name = style.customName || style.name || "";
      const size = style._size;
      delete style._size;
      return {
        styleMeta: style,
        styleSize: size,
        styleNameLC: name.toLocaleLowerCase() + "\n" + name
      };
    };
    ae.d(ee, {
      UI: () => ui_namespaceObject
    });
    var ui_namespaceObject = {
      render: async function ui_render(init) {
        updatePending = null;
        const tableView_ = prefs.__values["manage.newUI"];
        const favicons_ = prefs.__values["manage.newUI.favicons"];
        const faviconsGray_ = prefs.__values["manage.newUI.faviconsGray"];
        const targets_ = prefs.__values["manage.newUI.targets"];
        const enabledChanged = tableView_ !== tableView;
        const faviconsChanged = favicons_ !== favicons;
        const faviconsGrayChanged = faviconsGray_ !== faviconsGray;
        const targetsChanged = targets_ !== targets;
        if (init) prefs.subscribe([ "manage.newUI", "manage.newUI.favicons", "manage.newUI.faviconsGray", "manage.newUI.targets" ], () => {
          updatePending != null || (updatePending = Promise.resolve().then(ui_render));
        }); else if (!(enabledChanged || faviconsChanged || faviconsGrayChanged || targetsChanged)) return;
        tableView = tableView_;
        favicons = favicons_;
        faviconsGray = faviconsGray_;
        targets = targets_;
        media != null || (media = dom_util.getCssMediaRuleByName(MEDIA_NAME));
        tableView !== (media[0] === "screen") && (media.mediaText = `${tableView ? "screen" : "not all"},${MEDIA_NAME}`);
        dom.$toggleClasses(dom.$root, {
          newUI: tableView,
          oldUI: !tableView,
          "has-targets": !tableView || !!targets
        });
        let iconsMissing = favicons && !document.querySelector("#links img");
        if (iconsMissing) for (const el of document.querySelectorAll("#links a")) el.prepend(dom.$create("img", {
          src: urls.favicon(el.hostname)
        })); else favicons || init || dom.$$remove("#links img");
        if (!init) if (enabledChanged || iconsMissing && !render.favsBusy && !render.partEntry) {
          installed.textContent = "";
          msg_api.API.styles.getCore({
            sections: !0,
            size: !0
          }).then(render.showStyles);
        } else {
          targetsChanged && (iconsMissing = renderMissingFavs() || iconsMissing);
          iconsMissing && util.debounce(target_icons.renderTargetIcons, 0, installed);
        }
      }
    };
    ae.r(ui_namespaceObject);
    ae.d(ui_namespaceObject, {
      favicons: () => favicons,
      faviconsGray: () => faviconsGray,
      tableView: () => tableView,
      targets: () => targets
    });
    var dom = ae(9298);
    var localization = ae(9293);
    var util = ae(2076);
    var dom_util = ae(4777);
    var msg_api = ae(1154);
    var prefs = ae(2956);
    var target_icons = ae(8838);
    var urls = ae(7766);
    var render = ae(9080);
    const MEDIA_NAME = "table";
    let favicons;
    let faviconsGray;
    let tableView;
    let targets;
    let media;
    let updatePending;
    function renderMissingFavs() {
      let iconsMissing;
      for (const entry of installed.children) {
        entry.$(".applies-to").classList.toggle("has-more", entry._numTargets > targets);
        if (!entry._allTargetsRendered && targets > entry.$(".targets").childElementCount) {
          render.createTargetsElement({
            entry
          });
          iconsMissing = !0;
        } else (+entry.style.getPropertyValue("--num-targets") || 1e9) > targets && entry.style.setProperty("--num-targets", targets);
      }
      return iconsMissing;
    }
    const installed = document.querySelector("#installed");
    const isColumnable = screen.availWidth > 500;
    const queue = Object.assign([], {
      styles: new Map
    });
    function addEntryTitle(link, style = link.closest(".entry").styleMeta) {
      const {installDate: dIns, updateDate: dUpd, usercssData: ucd} = style;
      link.title = [ dUpd || dIns ? `${localization.formatRelativeDate(dUpd || dIns)}` : "", `${util.t("dateInstalled")}: ${localization.formatDate(dIns, !0) || "—"}`, `${util.t("dateUpdated")}: ${localization.formatDate(dUpd, !0) || "—"}`, ucd ? `UserCSS, v.${ucd.version}` : "" ].filter(Boolean).join("\n");
    }
    self.fitSelectBox = dom.cssFieldSizing ? util.NOP : ((showOpts = function(evt) {
      if (evt.button || this[1]) return;
      const opts = this._opts;
      const elems = Object.values(opts);
      const i = elems.indexOf(opts[this.value]);
      this.style.width = this.offsetWidth + "px";
      i > 0 && this.prepend(...elems.slice(0, i));
      this.append(...elems.slice(i + 1));
    }, hideOpts = function(evt) {
      for (const o of [ ...this.options ]) o.value !== this.value && o.remove();
      this.style.removeProperty("width");
      if (evt && evt.isTrusted) return this.offsetWidth;
    }, initOpts = el => {
      const opts = el._opts = {};
      for (const o of el.options) opts[o.value] = o;
      el.on("keydown", showOpts);
      el.on("mousedown", showOpts);
      el.on("blur", hideOpts);
      el.on("input", hideOpts);
      const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value");
      Object.defineProperty(el, "value", {
        get: d.get,
        set: val => {
          const opt = opts[typeof val == "string" ? val : val = `${val}`];
          opt.isConnected || (el[0] ? el[0].replaceWith(opt) : el.append(opt));
          d.set.call(el, val);
          hideOpts.call(el, {});
        }
      });
    }) => (el, value, init) => {
      init && initOpts(el);
      el.value = value;
    })();
    if (!("loading" in HTMLImageElement.prototype)) {
      const proto = HTMLImageElement.prototype;
      const pSrc = Object.getOwnPropertyDescriptor(proto, "src");
      const xo = new IntersectionObserver(entries => {
        for (const e of entries) if (e.intersectionRatio) {
          const el = e.target;
          pSrc.set.call(el, el.dataset.src);
          xo.unobserve(el);
          delete el.dataset.src;
        }
      }, {
        rootMargin: "200px"
      });
      Object.defineProperty(proto, "src", Object.assign({}, pSrc, {
        set(val) {
          if (this.loading === "lazy") {
            this.dataset.src = val;
            xo.observe(this);
          } else pSrc.set.call(this, val);
        }
      }));
    }
    ee.installed = installed;
    ee.isColumnable = isColumnable;
    ee.queue = queue;
  }
}, _ => {
  _.O(0, [ "color", "dlg_config-dialog_css-css_dom-error_css-css_global-dark_css-css_global_css-css_onoffswitch_cs-1e56de" ], () => _(_.s = 7924));
  _.O();
} ]);