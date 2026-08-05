"use strict";

(self.webpackChunkStylus = self.webpackChunkStylus || []).push([ [ "manage_import-export_js" ], {
  9052(_, ee, ae) {
    ae.r(ee);
    var oe = ae(4143);
    var le = ae(9298);
    var ue = ae(4777);
    var pe = ae(1154);
    var fe = ae(2956);
    var ye = ae(5012);
    var he = ae(9818);
    var Oe = ae(2076);
    var Ce = ae(6793);
    const btnImport = document.getElementById("import");
    Object.assign(document.getElementById("export"), {
      onclick: exportToFile,
      oncontextmenu: exportToFile
    }).on("split-btn", exportToFile);
    btnImport.onclick = () => importFromFile();
    Object.assign(document.body, {
      ondragover(event) {
        const hasFiles = event.dataTransfer.types.includes("Files");
        event.dataTransfer.dropEffect = hasFiles || event.target.type === "search" ? "copy" : "none";
        this.classList.toggle("dropzone", hasFiles);
        if (hasFiles) {
          event.preventDefault();
          this.classList.remove("fadeout");
        }
      },
      ondragend() {
        ue.animateElement(this, "fadeout", "dropzone");
      },
      ondragleave(event) {
        try {
          event.target === this && this.ondragend();
        } catch {
          this.ondragend();
        }
      },
      ondrop(event) {
        if (event.dataTransfer.files.length) {
          event.preventDefault();
          const elOnly = document.querySelector("#only-updates input");
          elOnly != null && elOnly.checked && elOnly.click();
          importFromFile(event.dataTransfer.files[0]);
        }
        setTimeout(() => this.ondragend(), 250);
      }
    });
    async function collectSettings() {
      const [order, lz] = await Promise.all([ pe.API.styles.getOrder(), oe.getLZValues() ]);
      const prefsObj = Oe.deepCopy(fe.__values);
      for (const key in prefsObj) Oe.hasOwn(fe.__defaults, key) || delete prefsObj[key];
      return {
        settings: prefsObj,
        order,
        ...lz
      };
    }
    async function importFromFile(file) {
      let resolve, reject;
      const el = document.createElement("input");
      const textPromise = new Promise((...args) => [resolve, reject] = args);
      try {
        if (file) readFile(); else {
          el.style.display = "none";
          el.type = "file";
          el.accept = "application/json" + (he.MOBILE ? ",text/plain,.json" : "");
          el.acceptCharset = "utf-8";
          document.body.appendChild(el);
          el.initialValue = el.value;
          el.onchange = readFile;
          el.click();
        }
        const text = await textPromise;
        el.remove();
        if (/^\s*[[{]/.test(text)) {
          await importFromString(text);
          setTimeout(() => Ce.queue.styles.clear(), 200);
        } else if (ye.getMetaComment(text, "?")) throw Oe.t("dragDropUsercssTabstrip");
      } catch (_) {
        ue.messageBox.alert(_.message || _);
      }
      function readFile() {
        if (!file) {
          if (el.value === el.initialValue) return resolve("");
          file = el.files[0];
        }
        if (file.size > 1e9) return reject((file.size / 1e9).toFixed(1).replace(".0", "") + "GB backup? I don't believe you.");
        const fr = new FileReader;
        fr.onloadend = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsText(file, "utf-8");
      }
    }
    async function importFromString(jsonString) {
      var _;
      let json = JSON.parse(jsonString) || [];
      json._rev && json._rev === ((_ = json.doc) == null ? void 0 : _._rev) && (json = [ json.doc ]);
      const oldStyles = Array.isArray(json) && json.length ? await pe.API.styles.getAll() : [];
      const oldStylesSet = new Set(oldStyles.sort((a, b) => (a = a.customName || a.name).toLowerCase() < (b = b.customName || b.name).toLowerCase() ? -1 : a > b));
      const oldStylesById = new Map(oldStyles.map(style => [ style.id, style ]));
      const oldStylesByUuid = new Map(oldStyles.map(style => [ style._id, style ]));
      const oldStylesByCustomName = new Map(oldStyles.map(style => style.customName && [ style.customName.trim(), style ]).filter(Boolean));
      const oldStylesByName = new Map(oldStyles.map(style => [ style.name.trim(), style ]));
      const {order: oldOrder, settings: oldPrefs, ...oldLZ} = await collectSettings();
      const items = [];
      const INFO = Symbol("info");
      const stats = {
        options: {
          names: [],
          isOptions: !0,
          legend: "optionsHeading"
        },
        added: {
          names: [],
          ids: [],
          legend: "importReportLegendAdded",
          dirty: !0
        },
        unchanged: {
          names: [],
          ids: [],
          legend: "importReportLegendIdentical"
        },
        metaAndCode: {
          names: [],
          ids: [],
          legend: "importReportLegendUpdatedBoth",
          dirty: !0
        },
        metaOnly: {
          names: [],
          ids: [],
          legend: "importReportLegendUpdatedMeta",
          dirty: !0
        },
        codeOnly: {
          names: [],
          ids: [],
          legend: "importReportLegendUpdatedCode",
          dirty: !0
        },
        invalid: {
          names: [],
          legend: "importReportLegendInvalid"
        }
      };
      let order;
      btnImport.disabled = !0;
      btnImport.dataset.after = "...";
      await Promise.all(json.map((item, index) => {
        if (item && !item.id && item.settings) return analyzeStorage(item);
        if (!item || typeof item != "object" || (Oe.isEmptyObj(item.usercssData) ? !ye.styleJSONseemsValid(item) : typeof item.sourceCode != "string")) {
          stats.invalid.names.push(`#${index}: ${Oe.clipString(item && (item.customName || item.name) || "")}`);
          return;
        }
        item.name = item.name.trim();
        const byId = oldStylesById.get(item.id);
        const byUuid = oldStylesByUuid.get(item._id);
        const byName = oldStylesByCustomName.get(item.customName) || oldStylesByName.get(item.name);
        let oldStyle = byUuid;
        !oldStyle && byId && (sameStyle(byId, item) ? oldStyle = byId : delete item.id);
        if (!oldStyle && byName) {
          item.id = byName.id;
          oldStyle = byName;
        }
        oldStylesByCustomName.delete(item.customName);
        oldStylesByName.delete(item.name);
        oldStylesSet.delete(oldStyle);
        const metaEqual = oldStyle && Oe.deepEqual(oldStyle, item, [ "sections", "sourceCode", "_rev" ]);
        const codeEqual = oldStyle && sameCode(oldStyle, item);
        if (metaEqual && codeEqual) {
          stats.unchanged.names.push(oldStyle.name);
          stats.unchanged.ids.push(oldStyle.id);
        } else {
          const i = items.length - 1;
          const group = items[i];
          (!group || group.length >= 30 ? items[i + 1] = [] : group).push(item);
          item[INFO] = {
            oldStyle,
            metaEqual,
            codeEqual
          };
        }
      }));
      for (const group of items) {
        const styles = await pe.API.styles.importMany(group);
        for (let j = 0; j < styles.length; j++) {
          const {style, err} = styles[j];
          const item = group[j];
          style && Ce.queue.styles.set(style.id, style);
          updateStats(style || item, item[INFO], err);
        }
      }
      await pe.API.styles.setOrder(order);
      btnImport.disabled = !1;
      delete btnImport.dataset.after;
      return (async () => {
        oldStylesSet.size && renderOrphans();
        scrollTo(0, 0);
        const entries = Object.entries(stats);
        const numChanged = entries.reduce((sum, [, val]) => sum + (val.dirty ? val.names.length : 0), 0);
        const report = entries.map(renderStats).filter(Boolean);
        const {button} = await ue.messageBox.show({
          title: Oe.t("importReportTitle"),
          contents: le.$create("#import", report.length ? report : Oe.t("importReportUnchanged")),
          buttons: [ Oe.t("confirmClose"), numChanged && Oe.t("undo") ],
          onshow: bindClick
        });
        button === 1 && undo();
      })();
      async function analyzeStorage(storage) {
        analyzePrefs(storage.settings, fe.knownKeys, fe.__values, !0);
        delete storage.settings;
        order = storage.order;
        delete storage.order;
        Oe.isEmptyObj(storage) || analyzePrefs(storage, Object.values(oe.LZ_KEY), await oe.getLZValues());
      }
      function analyzePrefs(obj, validKeys, values, isPref) {
        for (const [key, val] of Object.entries(obj || {})) {
          const isValid = validKeys.includes(key);
          isValid && Oe.deepEqual(val, values[key]) || stats.options.names.push({
            name: key,
            val,
            isValid,
            isPref
          });
        }
      }
      function sameCode(oldStyle, newStyle) {
        const d1 = oldStyle.usercssData;
        const d2 = newStyle.usercssData;
        return !d1 + !d2 ? ye.styleSectionsEqual(oldStyle, newStyle) : oldStyle.sourceCode === newStyle.sourceCode && Oe.deepEqual(d1.vars, d2.vars);
      }
      function sameStyle(oldStyle, newStyle) {
        return oldStyle.name.trim() === newStyle.name.trim() || [ "updateUrl", "originalMd5", "originalDigest" ].some(field => oldStyle[field] && oldStyle[field] === newStyle[field]);
      }
      function updateStats(style, {oldStyle, metaEqual, codeEqual}, err) {
        if (err) {
          err = (Array.isArray(err) ? err : [ err ]).map(e => e.message || e).join(", ");
          stats.invalid.names.push(style.name + " - " + err);
        } else if (oldStyle) if (metaEqual || codeEqual) if (codeEqual) {
          stats.metaOnly.names.push(reportNameChange(oldStyle, style));
          stats.metaOnly.ids.push(style.id);
        } else {
          stats.codeOnly.names.push(style.name);
          stats.codeOnly.ids.push(style.id);
        } else {
          stats.metaAndCode.names.push(reportNameChange(oldStyle, style));
          stats.metaAndCode.ids.push(style.id);
        } else {
          stats.added.names.push(style.name);
          stats.added.ids.push(style.id);
        }
      }
      function renderStats([id, {ids, names, legend, isOptions, render}]) {
        if (!names.length) return;
        let btn;
        if (isOptions && names.some(_ => _.isValid)) {
          btn = le.$create("button", Oe.t("importLabel"));
          importOptions.call(btn);
        }
        return le.$create(`details[data-id=${id}]`, {
          open: names.length < 10
        }, [ le.$create("summary", le.$create("b", (isOptions ? "" : names.length + " ") + Oe.t(legend))), render == null ? void 0 : render(...arguments), le.$create("p", ids ? le.$create("table", names.map(listItemsWithId, ids)) : names.map(isOptions ? listOptions : listItems, ids)), btn ].filter(Boolean));
      }
      function renderOrphans() {
        const ids = Array.from(oldStylesSet, o => o.id);
        const buttons = [ [ "exportLabel", () => {
          exportToFile(null, [ ...oldStylesSet ], "-extras");
        } ], [ "disableStyleLabel", () => {
          off = !off;
          updateDOM(elToggle, off, "off", pe.API.styles.toggleMany(ids, !off && Array.from(oldStylesSet, s => s.enabled)));
        } ], [ "deleteStyleLabel", () => {
          del = !del;
          elToggle.disabled = del;
          updateDOM(elDel, del, "del", del ? pe.API.styles.removeMany(ids) : pe.API.styles.importMany([ ...oldStylesSet ]));
        } ] ].map(([key, fn]) => Object.assign(document.createElement("button"), {
          onclick: fn,
          innerText: Oe.t(key)
        }));
        const [, elToggle, elDel] = buttons;
        const elRow = document.createElement("p");
        elRow.append(...buttons);
        stats.orphans = {
          ids,
          names: Array.from(oldStylesSet, o => o.customName || o.name),
          legend: "importReportLegendOrphans",
          render: () => elRow
        };
        let del, off;
        async function updateDOM(btn, state, name, promise) {
          btn.disabled = !0;
          le.$toggleDataset(btn, "undo", state && Oe.t("undo"));
          le.$toggleDataset(elRow.closest("details"), name, state);
          await promise.catch(console.warn);
          btn.disabled = !1;
        }
      }
      function listOptions({name, isValid}) {
        const el = document.createElement(isValid ? "div" : "del");
        el.textContent = name + (isValid ? "" : ` (${Oe.t(stats.invalid.legend)})`);
        return el;
      }
      function listItems(name) {
        const el = document.createElement("div");
        el.textContent = name;
        return el;
      }
      function listItemsWithId(name, i) {
        const id = this[i];
        return le.$create("tr", [ le.$create("td", `#${id}`), le.$create(`a[data-id=${id}][href=edit.html?id=${id}]`, name) ]);
      }
      async function importOptions() {
        const oldStorage = await oe.get();
        const lz = {};
        for (const {name, val, isValid, isPref} of stats.options.names) isValid && (isPref ? fe.set(name, val) : lz[name] = val);
        oe.setLZValues(lz);
        const label = this.textContent;
        this.textContent = Oe.t("undo");
        this.onclick = async () => {
          const keysToRemove = Object.keys(await oe.get()).filter(k => !Oe.hasOwn(oldStorage, k));
          await oe.set(oldStorage);
          await oe.remove(keysToRemove);
          this.textContent = label;
          this.onclick = importOptions;
        };
        return this;
      }
      async function undo() {
        const newIds = [ ...stats.metaAndCode.ids, ...stats.metaOnly.ids, ...stats.codeOnly.ids, ...stats.added.ids ];
        await pe.API.prefs.set(oldPrefs);
        await pe.API.styles.removeMany(newIds);
        await pe.API.styles.importMany(newIds.map(oldStylesById.get, oldStylesById).filter(Boolean));
        await pe.API.styles.setOrder(oldOrder);
        await oe.setLZValues(oldLZ);
        await ue.messageBox.alert(newIds.length + " " + Oe.t("importReportUndone"), "", Oe.t("importReportUndoneTitle"));
      }
      function bindClick(box) {
        for (const block of box.$$("details table")) {
          block.onclick = highlightElement;
          block.onmouseover = addTitle;
        }
        function addTitle(evt, el) {
          if (el) {
            const style = oldStylesById.get(+el.dataset.id);
            style && Ce.addEntryTitle(el, style);
          } else (el = evt.target).href && !el.title && Oe.debounce(addTitle, 50, null, evt.target);
        }
        function highlightElement(event) {
          event.preventDefault();
          const styleElement = document.getElementById("style-" + event.target.dataset.id);
          if (styleElement) {
            ue.scrollElementIntoView(styleElement);
            ue.animateElement(styleElement);
          }
        }
      }
      function reportNameChange(oldStyle, newStyle) {
        return newStyle.name !== oldStyle.name ? oldStyle.name + " —> " + newStyle.name : oldStyle.name;
      }
    }
    async function exportToFile(e, styles, suffix = "") {
      e == null || e.preventDefault();
      const keepDupSections = e && (e.type === "contextmenu" || e.shiftKey || e.detail === "compat");
      const data = [ await collectSettings(), ...(styles || await pe.API.styles.getAll()).map(style => {
        const copy = {};
        for (let [key, val] of Object.entries(style)) (key === "sections" ? !style.usercssData || keepDupSections || (val = [ {
          code: ""
        } ]) : typeof val != "object" || !Oe.isEmptyObj(val)) && (copy[key] = val);
        return copy;
      }) ];
      const text = JSON.stringify(data, null, "  ");
      const type = "application/json";
      const today = new Date;
      le.$create("a", {
        href: URL.createObjectURL(new Blob([ text ], {
          type
        })),
        download: "stylus-" + today.toLocaleString("sv").replace(/[\s:]/g, "-").slice(0, -3) + suffix + ".json",
        type
      }).dispatchEvent(new MouseEvent("click"));
    }
  }
} ]);