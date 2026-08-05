"use strict";

(self.webpackChunkStylus = self.webpackChunkStylus || []).push([ [ "edit" ], {
  8544(_, ee, oe) {
    ee.addEditorCommands = () => {
      for (const cmd of [ "nextEditor", "prevEditor", "save", "toggleStyle" ]) cmCommands[cmd] = ye.default[cmd];
    };
    var le = oe(8745);
    var ae = oe(1025);
    var ue = oe(6990);
    var pe = oe(492);
    var fe = oe(8660);
    var he = oe(6940);
    var ye = oe(9920);
    var Ce = oe(4869);
    const cms = new Set;
    const cmCommands = le.CodeMirror.commands;
    const cmDefaults = le.CodeMirror.defaults;
    const cmFactory = {
      create(place, options, finishInit) {
        finishInit && ((options ??= {}).finishInit = finishInit);
        const cm = le.CodeMirror(place, options);
        cm.display.lineDiv.on("mousewheel", plusMinusOnWheel.bind(cm), !0);
        cm.lastActive = 0;
        cm.options.value = "";
        cms.add(cm);
        return cm;
      },
      destroy(cm) {
        cms.delete(cm);
      },
      globalSetOption(key, value) {
        cmDefaults[key] = value;
        cms.size > 4 && lazyOpt.names.includes(key) ? lazyOpt.set(key, value) : cms.forEach(cm => cm.setOption(key, value));
      }
    };
    const kLineWrapping = "lineWrapping";
    const onCmFocus = cm => {
      Ce.rerouteHotkeys.toggle(!1);
      cm.display.wrapper.classList.add("CodeMirror-active");
      cm.lastActive = Date.now();
    };
    const onCmBlur = cm => {
      setTimeout(() => {
        Ce.rerouteHotkeys.toggle(!0);
        const {wrapper} = cm.display;
        wrapper.classList.toggle("CodeMirror-active", wrapper.contains(document.activeElement));
      });
    };
    const onCmBeforeChange = (cm, {text}) => {
      const max = Math.max(cm.options.maxHighlightLength, 1e5);
      for (const line of text) if (line.length > max) {
        const el = document.querySelector("#lineWrapping-label + a");
        el.hidden = !1;
        el.title = (line.length / 1e3 | 0) + "k long line detected, text wrapping was disabled to ensure the browser doesn't crash or hang";
        el.parentElement.on("change", evt => !evt.target.checked && (el.hidden = !0), {
          once: !0
        });
        cm.setOption(kLineWrapping, !1);
        break;
      }
    };
    const onCmOption = (cm, name) => {
      name === kLineWrapping && cm[cm.options[name] ? "on" : "off"]("beforeChange", onCmBeforeChange);
    };
    const maybeImportOnPaste = (cm, evt) => {
      let v, ucText;
      let text = evt.clipboardData.getData("text") || "";
      /^\s*{\s*"doc"\s*:\s*{\s*"/.test(text) && (v = he.tryJSONparse(text)) && fe.styleJSONseemsValid(v = v.doc) ? (ucText = v.sourceCode) || (text = fe.styleToCss(v)) : v = null;
      if (ye.default.isUsercss) {
        if (v) {
          evt.preventDefault();
          cm.setValue(ucText || text);
        }
      } else ye.default.importOnPaste(cm, evt, ucText || text, !ucText && v?.sections);
    };
    le.CodeMirror.defineInitHook(cm => {
      cm.on("focus", onCmFocus);
      cm.on("blur", onCmBlur);
      cm.on("optionChange", onCmOption);
      cm.on("paste", maybeImportOnPaste);
      cm.options[kLineWrapping] && cm.on("beforeChange", onCmBeforeChange);
    });
    const prefToCmOpt = k => k.startsWith("editor.") && k.slice(7);
    const prefKeys = pe.knownKeys.filter(k => k !== "editor.colorpicker" && k !== "editor.arrowKeysTraverse" && prefToCmOpt(k) in le.CodeMirror.defaults);
    const {insertTab, insertSoftTab} = cmCommands;
    (async () => {
      ue.swController || await pe.ready;
      for (const key of prefKeys) cmDefaults[prefToCmOpt(key)] = pe.__values[key];
      for (const [key, fn] of Object.entries({
        "editor.tabSize"(cm, value) {
          cm.setOption("indentUnit", Number(value));
        },
        "editor.indentWithTabs"(cm, value) {
          cmCommands.insertTab = value ? insertTab : insertSoftTab;
        },
        "editor.matchHighlight"(cm, value) {
          const showToken = value === "token" && /[#.\-\w]/;
          cm.setOption("highlightSelectionMatches", (showToken || value === "selection") && {
            showToken,
            annotateScrollbar: !0,
            delay: 0,
            onUpdate: updateMatchHighlightCount
          } || null);
        },
        "editor.selectByTokens"(cm, value) {
          cm.setOption("configureMouse", value ? configureMouseFn : null);
        }
      })) {
        le.CodeMirror.defineOption(prefToCmOpt(key), pe.__values[key], fn);
        prefKeys.push(key);
      }
    })();
    pe.subscribe(prefKeys, async (key, val) => {
      key === le.THEME_KEY && await le.loadCmTheme(val);
      cmFactory.globalSetOption(prefToCmOpt(key), val);
    });
    const lazyOpt = {
      names: [ "theme", kLineWrapping ],
      set(key, value) {
        const {observer, queue} = lazyOpt;
        for (const cm of cms) {
          let opts = queue.get(cm);
          opts || queue.set(cm, opts = {});
          opts[key] = value;
          observer.observe(cm.display.wrapper);
        }
      },
      setNow({cm, data}) {
        cm.operation(() => data.forEach(kv => cm.setOption(...kv)));
      },
      onView(entries) {
        const {queue, observer} = lazyOpt;
        const delayed = [];
        for (const e of entries) {
          const r = e.intersectionRatio && e.intersectionRect;
          if (!r) continue;
          const cm = e.target.CodeMirror;
          const data = Object.entries(queue.get(cm) || {});
          queue.delete(cm);
          observer.unobserve(e.target);
          data.every(([key, val]) => cm.getOption(key) === val) || (r.bottom > 0 && r.top < window.innerHeight ? lazyOpt.setNow({
            cm,
            data
          }) : delayed.push({
            cm,
            data
          }));
        }
        delayed.length && setTimeout(() => delayed.forEach(lazyOpt.setNow));
      },
      get observer() {
        if (!lazyOpt._observer) {
          lazyOpt._observer = new IntersectionObserver(lazyOpt.onView, {
            rootMargin: "150%"
          });
          lazyOpt.queue = new WeakMap;
        }
        return lazyOpt._observer;
      }
    };
    Object.assign(cmCommands, {
      commentSelection(cm) {
        cm.blockComment(cm.getCursor("from"), cm.getCursor("to"), {
          fullLines: !1
        });
      },
      minus1: plusMinus.bind(null, -1),
      minus10: plusMinus.bind(null, -10),
      minus100: plusMinus.bind(null, -100),
      plus1: plusMinus.bind(null, 1),
      plus10: plusMinus.bind(null, 10),
      plus100: plusMinus.bind(null, 100),
      toggleEditorFocus(cm) {
        cm && (cm.hasFocus() ? setTimeout(() => cm.display.input.blur()) : cm.focus());
      }
    });
    function plusMinusOne(delta, cm, pos = cm.getCursor(), inOp) {
      const {line, ch} = pos;
      const {text} = cm.getLineHandle(line);
      let m = /[-+\d.%a-z]/iy;
      let i = m.lastIndex = ch;
      m.test(text) || (i += !i || (m.lastIndex = i - 1, m.test(text)) ? -1 : 1);
      do {
        m.lastIndex = i;
      } while (i > ch - 20 && (m.test(text) ? --i >= 0 : (++i, 0)));
      m = /[-+]?(\d*\.)?(\d+)/y;
      m.lastIndex = i;
      m = m.exec(text);
      if (m) {
        m[0].includes(".") && (delta /= 10);
        inOp = inOp && (cm.curOp || (cm.startOperation(), !0));
        cm.replaceRange((+m[0] + delta).toFixed(m[1] ? m[2].length : 0), {
          line,
          ch: i
        }, {
          line,
          ch: i + m[0].length
        }, "*incdec" + line + ":" + i);
        return inOp;
      }
    }
    function plusMinus(delta, cm) {
      let op;
      for (const sel of cm.doc.sel.ranges) plusMinusOne(delta, cm, sel.head, !op) && (op = !0);
      op === !0 && cm.endOperation();
    }
    function plusMinusOnWheel(e) {
      if (e.altKey) {
        e.preventDefault();
        plusMinusOne((e.ctrlKey ? 100 : e.shiftKey ? 10 : 1) * (e.wheelDeltaY > 0 ? 1 : -1), this, this.coordsChar({
          left: e.clientX,
          top: e.clientY
        }, "window"));
      }
    }
    function updateMatchHighlightCount(cm, state) {
      cm.display.wrapper.dataset.matchHighlightCount = state.matchesonscroll.matches.length;
    }
    function configureMouseFn(cm, repeat) {
      return repeat === "double" ? {
        unit: selectTokenOnDoubleclick
      } : {};
    }
    let rxNonIdent1, rxNonIdentMany, rxQualifier, rxWord, rxWordDashed, rxsrcUniBody;
    function selectTokenOnDoubleclick(cm, {ch, line}) {
      const {styles, text} = cm.getLineHandle(line);
      const getB = () => (ae.rxUniBody.lastIndex = ch) + ae.rxUniBody.exec(text)[0].length;
      let [style, i] = ch ? ae.getStyleAtPos(styles, ch) : [ styles[2], 2 ];
      let a = ch;
      let b, rx;
      rxsrcUniBody ??= ae.rxUniBody.source;
      for (;style && !(style = style.split("overlay ", 1)[0].trim()) && i > 2; ) style = styles[1 + (i -= 2)];
      if (!style || style && (rx = /^(?:comment|string|(uso-variable))/.exec(style))) {
        rx = rx?.[1] ? rxWordDashed ??= RegExp(rxsrcUniBody.slice(0, -1), "yu") : rxWord ??= RegExp("[" + rxsrcUniBody.slice(2, -1), "yu");
        for (;a && (rx.lastIndex = a - 1, rx.test(text)); ) --a;
        b = getB();
        for (let retry = 0; a === ch && b === ch && retry < 2; ++retry) {
          rx = retry ? /\s/y : rxNonIdent1 ??= RegExp(`[^${rxsrcUniBody.slice(2, -2)}\\s]`, "yu");
          for (;a && (rx.lastIndex = a - 1, rx.test(text)); ) --a;
          rx = retry ? /\s*/y : rxNonIdentMany ??= RegExp(rxNonIdent1.source + "*", "yu");
          rx.lastIndex = ch;
          b += rx.exec(text)[0].length;
        }
        a && /[#@]/.test(text[a - 1]) && --a;
      } else {
        /^(?:qualifier|builtin)/.test(style) || (b = styles[i]);
        for (;(i -= 2) > 1 && (styles[i + 1] || "").startsWith(style); ) ;
        a = i > 0 ? styles[i] : 0;
        b || (a += text.slice(a, b = getB()).search(rxQualifier ??= RegExp(`[#.]?${rxsrcUniBody}%?$`, "u")));
        a && !styles[i + 1] && text[a - 1] === ":" && /callee|variable-3/.test(style) && !/^prop/.test(styles[i - 1]) && (a -= text[a - 2] === ":" ? 2 : 1);
      }
      return {
        from: {
          line,
          ch: a
        },
        to: {
          line,
          ch: b
        }
      };
    }
    const BM_BRAND = "sublimeBookmark";
    const BM_CLICKER = "CodeMirror-linenumbers";
    const BM_DATA = Symbol("data");
    const tmProto = le.CodeMirror.TextMarker.prototype;
    const tmProtoOvr = {};
    for (const k of [ "clear", "attachLine", "detachLine" ]) tmProtoOvr[k] = function(line) {
      const {cm} = this.doc;
      const withOp = !cm.curOp;
      withOp && cm.startOperation();
      tmProto[k].apply(this, arguments);
      cm.curOp.ownsGroup.delayedCallbacks.push(toggleMark.bind(this, this.lines[0], line));
      withOp && cm.endOperation();
    };
    for (const name of [ "prevBookmark", "nextBookmark" ]) {
      const cmdFn = cmCommands[name];
      cmCommands[name] = cm => {
        cm.setSelection = cm.jumpToPos;
        cmdFn(cm);
        delete cm.setSelection;
      };
    }
    le.CodeMirror.defineInitHook(cm => {
      cm.on("gutterClick", onGutterClick);
      cm.on("gutterContextMenu", onGutterContextMenu);
      cm.on("markerAdded", onMarkAdded);
    });
    function onGutterClick(cm, line, name, e) {
      switch (name === BM_CLICKER && e.button) {
       case 0:
        {
          const [mark] = cm.findMarks({
            line,
            ch: 0
          }, {
            line,
            ch: 1e9
          }, m => m[BM_BRAND]);
          cm.setCursor(mark ? mark.find(-1) : {
            line,
            ch: 0
          });
          cm.execCommand("toggleBookmark");
          break;
        }

       case 1:
        cm.execCommand("selectBookmarks");
      }
    }
    function onGutterContextMenu(cm, line, name, e) {
      if (name === BM_CLICKER) {
        cm.execCommand(e.ctrlKey ? "prevBookmark" : "nextBookmark");
        e.preventDefault();
      }
    }
    function onMarkAdded(cm, mark) {
      if (mark[BM_BRAND]) {
        mark.inclusiveRight = !0;
        Object.assign(mark, tmProtoOvr);
        toggleMark.call(mark, !0, mark[BM_DATA] = mark.lines[0]);
      }
    }
    function toggleMark(state, line = this[BM_DATA]) {
      this.doc[state ? "addLineClass" : "removeLineClass"](line, "gutter", "gutter-bookmark");
      if (state) {
        const bms = this.doc.cm.state.sublimeBookmarks;
        bms.includes(this) || bms.push(this);
      }
    }
    ee.default = cmFactory;
  },
  8304(_, ee, oe) {
    ee.default = () => {
      const {isUsercss} = pe.default;
      const sensor = le.$create("div", {
        style: ue.important("\n      top: 0;\n      height: 1px;\n      position: absolute;\n      visibility: hidden;\n    ")
      });
      const scroller = isUsercss ? document.querySelector(".CodeMirror-scroll") : document.body;
      const xo = new IntersectionObserver(([e]) => {
        sticky = !e.intersectionRatio;
        toggleSticky(sticky);
      }, {
        root: isUsercss ? scroller : void 0
      });
      const elIconized = document.querySelectorAll("#header .i");
      document.querySelector("#new-as").onclick = () => {
        pe.default.style.id || pe.default.dirty.isDirty() || location.reload();
      };
      scroller.appendChild(sensor);
      ae.mqCompact(val => {
        val ? xo.observe(sensor) : xo.disconnect();
        for (const el of elIconized) el.title = val ? el.textContent : "";
      });
    };
    oe.d(ee, {
      sticky: () => sticky
    });
    var le = oe(7986);
    var ae = oe(9073);
    var ue = oe(6518);
    var pe = oe(9920);
    const h = document.querySelector("#header");
    const toggleSticky = val => h.classList.toggle("sticky", val);
    let sticky;
    ee.toggleSticky = toggleSticky;
  },
  9920(_, ee, oe) {
    ee.failRegexp = failRegexp;
    oe.d(ee, {
      default: () => edit_editor
    });
    var dom = oe(7986);
    var msg_api = oe(4930);
    var prefs = oe(492);
    var util = oe(6940);
    var compact_header = oe(8304);
    var live_preview = oe(4230);
    var windowed_mode = oe(3365);
    const dirty = function() {
      const data = new Map;
      const listeners = new Set;
      const dataListeners = new Set;
      const notifyChange = wasDirty => {
        const isDirty = data.size > 0;
        const flipped = isDirty !== wasDirty;
        flipped && listeners.forEach(cb => cb(isDirty));
        (flipped || isDirty) && dataListeners.forEach(cb => cb(isDirty));
      };
      return {
        data,
        add(obj, value) {
          if (this.paused) return;
          const wasDirty = data.size > 0;
          const saved = data.get(obj);
          if (saved) {
            if (saved.type !== "remove") return;
            if (saved.savedValue === value) data.delete(obj); else {
              saved.newValue = value;
              saved.type = "modify";
            }
          } else data.set(obj, {
            type: "add",
            newValue: value
          });
          notifyChange(wasDirty);
        },
        clear(id) {
          data.size && (id ? data.delete(id) : (data.clear(), 1)) && notifyChange(!0);
        },
        has: key => data.has(key),
        isDirty: () => data.size > 0,
        modify(obj, oldValue, newValue) {
          if (this.paused) return;
          const wasDirty = data.size > 0;
          const saved = data.get(obj);
          if (saved) if (saved.type === "modify") saved.savedValue === newValue ? data.delete(obj) : saved.newValue = newValue; else {
            if (saved.type !== "add") return;
            saved.newValue = newValue;
          } else {
            if (oldValue === newValue) return;
            data.set(obj, {
              type: "modify",
              savedValue: oldValue,
              newValue
            });
          }
          notifyChange(wasDirty);
        },
        onChange(cb, add = !0) {
          listeners[add ? "add" : "delete"](cb);
        },
        onDataChange(cb, add = !0) {
          dataListeners[add ? "add" : "delete"](cb);
        },
        remove(obj, value) {
          const wasDirty = data.size > 0;
          const saved = data.get(obj);
          if (saved) if (saved.type === "add") data.delete(obj); else {
            if (saved.type !== "modify") return;
            saved.type = "remove";
          } else data.set(obj, {
            type: "remove",
            savedValue: value
          });
          notifyChange(wasDirty);
        }
      };
    }();
    const regexps = new Set;
    const style = {};
    const toc = [];
    const scrollInfo = {};
    toc.cls = "current";
    let wasDirty = !1;
    const editor = self.editor = {
      dirty,
      isUsercss: !1,
      msg: !1,
      nameTarget: "name",
      ppDemo: {
        stylus: "https://stylus-lang.com/try.html",
        less: "https://lesscss.org/less-preview/"
      },
      regexps,
      style,
      toc,
      applyScrollInfo(cm, si = scrollInfo.cms?.[0]) {
        if (si && si.sel) try {
          const bmOpts = {
            sublimeBookmark: !0,
            clearWhenEmpty: !1
          };
          const bms = [];
          cm.state.sublimeBookmarks = bms;
          for (const b of si.bookmarks) bms.push(cm.markText(b.from, b.to, bmOpts));
          cm.setSelections(...si.sel, {
            scroll: !1
          });
          Object.assign(cm.display.scroller, si.scroll);
          Object.assign(cm.doc, si.scroll);
          return si;
        } catch {}
      },
      cancel: () => location.assign("/manage.html" + (windowed_mode.isWindowed ? "?popup" : "")),
      makeScrollInfo: () => ({
        sticky: compact_header.sticky,
        scrollY,
        cms: editor.getEditors(!0).map((cm, i) => cm ? {
          bookmarks: (cm.state.sublimeBookmarks || []).map(b => b.find()).filter(Boolean),
          focus: cm.hasFocus(),
          height: cm.display.wrapper.style.height.replace("100vh", ""),
          parentHeight: cm.display.wrapper.parentElement.offsetHeight,
          scroll: util.mapObj(cm.doc, null, [ "scrollLeft", "scrollTop" ]),
          sel: [ cm.doc.sel.ranges, cm.doc.sel.primIndex ],
          viewTo: cm.display.viewTo
        } : editor.sections[i].si)
      }),
      save() {
        if (dirty.isDirty()) {
          editor.msg ||= {
            editorId: performance.now() + Math.random()
          };
          return editor.saveImpl();
        }
      },
      toggleRegexp(el, type) {
        let hide;
        if (type === "regexp") {
          el.on("input", validateRegexp);
          regexps.add(el).size === 1 && (hide = !1);
        } else {
          el.setCustomValidity("");
          el.off("input", validateRegexp);
          regexps.delete(el) && !regexps.size && (hide = !0);
        }
        hide != null && (document.getElementById("testRE").hidden = hide);
      },
      toggleStyle(cm, enabled = !style.enabled) {
        document.getElementById("enabled").checked = enabled;
        editor.updateEnabledness(enabled, cm && prefs.__values["editor.toggle.save"], !cm);
      },
      updateClass() {
        dom.$rootCL.toggle("is-new-style", !editor.style.id);
        document.querySelector("h1").textContent = util.t(editor.style.id ? "editStyleHeading" : "addStyleTitle");
      },
      updateDirty() {
        const isDirty = dirty.isDirty();
        if (wasDirty !== isDirty) {
          wasDirty = isDirty;
          document.body.classList.toggle("dirty", isDirty);
          document.getElementById("save-button").disabled = !isDirty;
        }
        editor.updateTitle();
      },
      updateEnabledness(enabled, autosave, external) {
        if (enabled !== style.enabled) {
          autosave || external || style.id ? dirty.clear("enabled") : dirty.modify("enabled", style.enabled, enabled);
          style.enabled = enabled;
          (0, live_preview.default)();
          autosave && editor.save() || !style.id || msg_api.API.styles.toggle(style.id, enabled);
        }
      },
      updateName(isUserInput) {
        if (editor) {
          if (isUserInput) {
            const {value} = document.getElementById("name");
            dirty.modify("name", style[editor.nameTarget] || style.name, value);
            style[editor.nameTarget] = value;
          }
          editor.updateTitle();
        }
      },
      updateTitle(isDirty = editor.dirty.isDirty()) {
        const {customName, name} = editor.style;
        document.title = `${isDirty ? "* " : ""}${customName || name || util.t("styleMissingName")} - Stylus`;
      },
      updateToc(added) {
        const liveSections = editor.sections;
        const sections = editor.sectionsRaw || liveSections;
        if (!toc.el) {
          toc.el = document.getElementById("toc");
          toc.elDetails = toc.el.closest("details");
          toc.title = document.getElementById("toc-title").dataset;
        }
        toc.title.num = liveSections.length;
        if (!toc.elDetails.open) return;
        added || (added = sections);
        const first = sections.indexOf(added[0]);
        const elFirst = toc.el.children[first];
        if (first >= 0 && (!added.focus || !elFirst)) for (let el = elFirst, i = first; i < sections.length; i++) {
          const sec = sections[i];
          const entry = sec.tocEntry;
          if (!util.deepEqual(entry, toc[i])) {
            el || (el = toc.el.appendChild(dom.$create("li", {
              tabIndex: 0
            })));
            el.tabIndex = sec.removed ? -1 : 0;
            toc[i] = Object.assign({}, entry);
            const s = el.textContent = util.clipString(entry.label) || (entry.target == null ? util.t("appliesToEverything") : util.clipString(entry.target) + (entry.numTargets > 1 ? ", ..." : ""));
            s.length > 30 && (el.title = s);
          }
          el = el?.nextElementSibling;
        }
        for (;toc.length > sections.length; ) {
          toc.el.lastElementChild.remove();
          toc.length--;
        }
        if (added.focus) {
          toc.i = first;
          const cls = toc.cls;
          const old = toc.el.$("." + cls);
          const el = elFirst || toc.el.children[first];
          old && old !== el && old.classList.remove(cls);
          el.classList.add(cls);
        }
      },
      useSavedStyle(newStyle) {
        style.id !== newStyle.id && history.replaceState({}, "", `?id=${newStyle.id}`);
        util.sessionStore.justEditedStyleId = newStyle.id;
        Object.assign(style, newStyle);
        editor.updateClass();
        editor.updateMeta();
      }
    };
    function failRegexp(r) {
      try {
        new RegExp(r);
        r = "";
      } catch (_) {
        r = _.message.split("/:").pop().trim();
      }
      return r;
    }
    function validateRegexp({target: el}) {
      let err = failRegexp(el.value);
      err && (err = util.t("styleBadRegexp") + "\n" + err);
      if (el.title !== err) {
        el.title = err;
        el.setCustomValidity(err);
      }
    }
    const edit_editor = editor;
    ee.scrollInfo = scrollInfo;
  },
  5670(_, ee, oe) {
    oe(9073);
    var src_cm = oe(8745);
    var consts = oe(4188);
    var dom = oe(7986);
    var prefs = oe(492);
    var codemirror_factory = oe(8544);
    var compact_header = oe(8304);
    var editor = oe(9920);
    var dom_prefs = oe(7393);
    var dom_util = oe(6518);
    var util = oe(6940);
    var edit_util = oe(4869);
    let cssBeautifyMod;
    src_cm.CodeMirror.commands.beautify = cm => {
      beautify(cm.display.wrapper.parentElement.contains(document.activeElement) ? [ cm ] : editor.default.getEditors(), !1);
    };
    async function beautify(scope, ui = !0) {
      cssBeautifyMod || (cssBeautifyMod = (await oe.e("vendor-overwrites_beautify_beautify-css-mod_js").then(oe.bind(oe, 3256))).default);
      const tabs = prefs.__values["editor.indentWithTabs"];
      const options = Object.assign(prefs.defaults["editor.beautify"], prefs.__values["editor.beautify"]);
      options.indent_size = tabs ? 1 : prefs.__values["editor.tabSize"];
      options.indent_char = tabs ? "\t" : " ";
      ui && (ui = createBeautifyUI(scope, options));
      for (const cm of scope) setTimeout(beautifyEditor, 0, cm, options, ui);
    }
    function beautifyEditor(cm, options, ui) {
      const pos = options.translate_positions = [].concat.apply([], cm.doc.sel.ranges.map(r => [ Object.assign({}, r.anchor), Object.assign({}, r.head) ]));
      const text = cm.getValue();
      const newText = cssBeautifyMod(text, options);
      if (newText !== text) {
        cm.beautifyChange && cm.beautifyChange[cm.changeGeneration()] || (cm.beautifyChange = {});
        cm.setValue(newText);
        const selections = [];
        for (let i = 0; i < pos.length; i += 2) selections.push({
          anchor: pos[i],
          head: pos[i + 1]
        });
        const {scrollX, scrollY} = window;
        cm.setSelections(selections);
        window.scrollTo(scrollX, scrollY);
        cm.beautifyChange[cm.changeGeneration()] = !0;
        ui && (ui.$('button[role="close"]').disabled = !1);
      }
    }
    function createBeautifyUI(scope, options) {
      const popup = edit_util.helpPopup.show(util.t("styleBeautify"), dom.$create("div", [ dom.$create(".beautify-options", [ $createOption(".selector1,", "selector_separator_newline"), $createOption(".selector2", "newline_before_open_brace"), $createOption("{", "newline_after_open_brace"), $createOption("border: none;", "newline_between_properties", !0), $createOption("display: block;", "newline_before_close_brace", !0), $createOption("}", "newline_between_rules"), $createLabeledCheckbox("space_around_combinator", "", "selector + selector", "selector+selector"), $createLabeledCheckbox("space_around_cmp", "", '[attribute = "1"]', '[attribute="1"]'), $createLabeledCheckbox("preserve_newlines", "styleBeautifyPreserveNewlines"), $createLabeledCheckbox("indent_conditional", "styleBeautifyIndentConditional"), editor.default.isUsercss && $createLabeledCheckbox("indent_mozdoc", "", "... @-moz-document") ].filter(Boolean)), dom.$create("p.beautify-hint", [ dom.$create("span", util.t("styleBeautifyHint") + " "), edit_util.createHotkeyInput("editor.beautify.hotkey", {
        buttons: !1,
        onDone: () => dom_util.moveFocus(popup, 0)
      }) ]), dom.$create(".buttons", [ dom.$create("button[role=close]", {
        onclick: edit_util.helpPopup.close
      }, util.t("confirmClose")), dom.$create("button[role=undo]", {
        onclick() {
          let undoable = !1;
          for (const cm of scope) {
            const data = cm.beautifyChange;
            if (!data || !data[cm.changeGeneration()]) continue;
            delete data[cm.changeGeneration()];
            const {scrollX, scrollY} = window;
            cm.undo();
            cm.scrollIntoView(cm.getCursor());
            window.scrollTo(scrollX, scrollY);
            undoable |= data[cm.changeGeneration()];
          }
          this.disabled = !undoable;
        }
      }, util.t(scope.length === 1 ? "undo" : "undoGlobal")) ]) ]), {
        className: "wide"
      });
      document.querySelector(".beautify-options").onchange = ({target}) => {
        const value = target.type === "checkbox" ? target.checked : target.selectedIndex > 0;
        const elLine = target.closest("[newline]");
        elLine ? elLine.setAttribute("newline", value) : target._ && (target._.node.textContent = target._[value ? "text" : "textOff"]);
        options[target.dataset.option] = value;
        prefs.set("editor.beautify", Object.assign({}, options, {
          translate_positions: void 0
        }));
        beautify(scope, !1);
      };
      return popup;
      function $createOption(label, optionName, indent) {
        const value = options[optionName];
        return dom.$create(`div[newline=${value}]`, [ dom.$create("span" + (indent ? "[indent]" : ""), label), dom.$create("div.select-wrapper", [ dom.$create(`select[data-option=${optionName}]`, [ dom.$create("option", {
          selected: !value
        }, " "), dom.$create("option", {
          selected: value
        }, "\\n") ]) ]) ]);
      }
      function $createLabeledCheckbox(optionName, i18nKey, text, textOff) {
        const checked = options[optionName] !== !1;
        const textNode = textOff && document.createTextNode(checked ? text : textOff);
        return dom.$create("label", {
          style: "display: block; clear: both;"
        }, [ dom.$create(`input[data-option=${optionName}]`, {
          type: "checkbox",
          _: textOff && {
            node: textNode,
            text,
            textOff
          },
          checked
        }), i18nKey ? util.t(i18nKey) : textNode || text ]);
      }
    }
    function initBeautifyButton(btn, scope) {
      btn.onclick = btn.oncontextmenu = e => {
        e.preventDefault();
        beautify(scope || editor.default.getEditors(), e.type === "click");
      };
    }
    function EditorHeader() {
      initBeautifyButton(document.getElementById("beautify"));
      initNameArea();
      dom_prefs.setupLiveDetails();
      dom_prefs.setupLivePrefs();
      dom_prefs.setupConditionalPrefs();
      document.querySelector("#header").on("wheel", headerOnScroll, {
        passive: !0
      });
      window.on("load", () => {
        prefs.subscribe("editor.keyMap", showHotkeyInTooltip, !0);
        window.on("showHotkeyInTooltip", showHotkeyInTooltip);
      }, {
        once: !0
      });
      for (const el of document.querySelectorAll("#header summary")) el.on("contextmenu", peekDetails);
    }
    function findKeyForCommand(command, map) {
      typeof map == "string" && (map = src_cm.CodeMirror.keyMap[map]);
      let key = Object.keys(map).find(k => map[k] === command);
      if (key) return key;
      for (const ft of Array.isArray(map.fallthrough) ? map.fallthrough : [ map.fallthrough ]) {
        key = ft && findKeyForCommand(command, ft);
        if (key) return key;
      }
      return "";
    }
    function headerOnScroll({target: el, deltaY, deltaMode, shiftKey}) {
      for (;el !== this && (el = el.parentElement); ) if (el.scrollHeight > el.clientHeight) return;
      (el = editor.default.isUsercss ? editor.default.cm.display.scroller : document.scrollingElement).scrollTop += deltaMode === 1 ? deltaY * editor.default.cm.defaultTextHeight() : deltaMode === 2 || shiftKey ? Math.sign(deltaY) * el.clientHeight : deltaY;
    }
    function initNameArea() {
      const nameEl = document.getElementById("name");
      const resetEl = document.getElementById("reset-name");
      const isCustomName = editor.default.style.updateUrl || editor.default.isUsercss;
      editor.default.nameTarget = isCustomName ? "customName" : "name";
      nameEl.placeholder = util.t(editor.default.isUsercss ? "usercssEditorNamePlaceholder" : "styleMissingName");
      nameEl.title = util.t(isCustomName ? "customNameHint" : "styleName");
      nameEl.on("input", () => {
        editor.default.updateName(!0);
        resetEl.hidden = !editor.default.style.customName;
      });
      resetEl.hidden = !editor.default.style.customName;
      resetEl.onclick = () => {
        dom_util.setInputValue(nameEl, editor.default.style.name);
        editor.default.style.customName = null;
        resetEl.hidden = !0;
      };
      const enabledEl = document.getElementById("enabled");
      enabledEl.onchange = () => editor.default.updateEnabledness(enabledEl.checked);
    }
    async function peekDetails(evt) {
      evt.preventDefault();
      const el = this.parentElement;
      if ((el.open = !el.open) && !("peek" in el.dataset)) {
        el.dataset.peek = "";
        for (;el.open && el.matches(":hover, :active"); ) {
          await new Promise(cb => el.on("mouseleave", cb, {
            once: !0
          }));
          await util.sleep(1e3);
        }
        el.open = !1;
        delete el.dataset.peek;
      }
    }
    function showHotkeyInTooltip(_, mapName = prefs.__values["editor.keyMap"]) {
      for (const el of document.querySelectorAll("[data-hotkey-tooltip]")) if (el._hotkeyTooltipKeyMap !== mapName) {
        el._hotkeyTooltipKeyMap = mapName;
        const title = el._hotkeyTooltipTitle = el._hotkeyTooltipTitle || el.title;
        const cmd = el.dataset.hotkeyTooltip;
        const key = cmd[0] === "=" ? cmd.slice(1) : findKeyForCommand(cmd, mapName) || findKeyForCommand(cmd, src_cm.extraKeys);
        const newTitle = title + (title && key ? "\n" : "") + (key || "");
        el.title !== newTitle && (el.title = newTitle);
      }
    }
    var chrome_sync = oe(7033);
    const WARNING = {
      severity: "warning"
    };
    const ENABLED_AS_WARNING = [ !0, WARNING ];
    const kNoInvalidPositionDeclaration = "no-invalid-position-declaration";
    const kPropertyNoUnknown = "property-no-unknown";
    const DEFAULTS = {
      stylelint: {
        "rules:less": {
          "at-rule-no-unknown": null,
          "declaration-property-value-no-unknown": null
        },
        "rules:stylus": {
          "at-rule-no-unknown": null,
          "declaration-property-value-no-unknown": null,
          [kNoInvalidPositionDeclaration]: null,
          [kPropertyNoUnknown]: null
        },
        rules: {
          "at-rule-descriptor-no-unknown": ENABLED_AS_WARNING,
          "at-rule-descriptor-value-no-unknown": ENABLED_AS_WARNING,
          "at-rule-no-unknown": ENABLED_AS_WARNING,
          "block-no-empty": ENABLED_AS_WARNING,
          "color-no-invalid-hex": ENABLED_AS_WARNING,
          "declaration-block-no-duplicate-properties": [ !0, {
            ignore: [ "consecutive-duplicates-with-different-values" ],
            ...WARNING
          } ],
          "declaration-block-no-shorthand-property-overrides": ENABLED_AS_WARNING,
          "declaration-property-value-no-unknown": ENABLED_AS_WARNING,
          "font-family-no-duplicate-names": ENABLED_AS_WARNING,
          "function-calc-no-unspaced-operator": ENABLED_AS_WARNING,
          "function-linear-gradient-no-nonstandard-direction": ENABLED_AS_WARNING,
          "keyframe-declaration-no-important": ENABLED_AS_WARNING,
          "media-feature-name-no-unknown": ENABLED_AS_WARNING,
          "nesting-selector-no-missing-scoping-root": ENABLED_AS_WARNING,
          "no-invalid-double-slash-comments": ENABLED_AS_WARNING,
          [kNoInvalidPositionDeclaration]: ENABLED_AS_WARNING,
          [kPropertyNoUnknown]: ENABLED_AS_WARNING,
          "selector-no-invalid": ENABLED_AS_WARNING,
          "selector-pseudo-class-no-unknown": ENABLED_AS_WARNING,
          "selector-pseudo-element-no-unknown": ENABLED_AS_WARNING,
          "string-no-newline": ENABLED_AS_WARNING,
          "unit-no-unknown": ENABLED_AS_WARNING
        }
      },
      csslint: {
        "display-property-grouping": 1,
        "duplicate-properties": 1,
        "empty-rules": 1,
        errors: 1,
        "globals-in-document": 1,
        "known-properties": 1,
        "known-pseudos": 1,
        "selector-newline-no-indent": 1,
        "shorthand-overrides": 1,
        warnings: 1
      }
    };
    const cms = new Map;
    const linters = new Set;
    const lintingUpdatedListeners = new Set;
    const onLinterPref = new Set;
    const unhookListeners = new Set;
    var localization = oe(7501);
    const tables = new Map;
    let tplReport, tplRow, rowSeverityIcon, rowSeverity, rowLine, rowCol, rowMessage;
    lintingUpdatedListeners.add((annotationsNotSorted, annotations, cm) => {
      let table = tables.get(cm);
      if (!table) {
        table = createTable(cm);
        tables.set(cm, table);
        const container = document.querySelector(".lint-report-container");
        const nextSibling = container.firstChild && !editor.default.isUsercss ? findNextSibling(cm) : null;
        container.insertBefore(table.element, nextSibling && tables.get(nextSibling).element);
      }
      table.updateCaption();
      table.updateAnnotations(annotations);
      updateCount();
    });
    unhookListeners.add(cm => {
      const table = tables.get(cm);
      if (table) {
        table.element.remove();
        tables.delete(cm);
      }
      updateCount();
    });
    function getIssues() {
      const issues = new Set;
      for (const table of tables.values()) for (const tr of table.trs) issues.add(tr._anno);
      return issues;
    }
    function refreshReport() {
      for (const table of tables.values()) table.updateCaption();
    }
    function updateCount() {
      const issueCount = Array.from(tables.values()).reduce((sum, table) => sum + table.trs.length, 0);
      document.getElementById("lint").hidden = !issueCount;
      document.getElementById("issue-count").textContent = issueCount;
    }
    function findNextSibling(cm) {
      for (let v, secs = editor.default.sections, i = secs.indexOf(cm.editorSection) + 1; i < secs.length; i++) if (!(v = secs[i]).init && tables.has(v = v.cm)) return v;
    }
    function createTable(cm) {
      if (!tplReport) {
        tplReport = localization.template.linterReport;
        tplRow = tplReport.$("tr");
        tplRow.remove();
      }
      const report = tplReport.cloneNode(!0);
      const caption = report.$(".caption");
      const table = report.$("table");
      const trs = [];
      table._cm = cm;
      table.onclick = gotoLintIssue;
      return {
        element: report,
        trs,
        updateAnnotations: lines => {
          let i = 0;
          for (const anno of function*() {
            for (const line of lines) line && (yield* line);
          }()) {
            const tr = createTr(anno);
            if (i < trs.length) trs[i].replaceWith(trs[i] = tr); else {
              trs.push(tr);
              table.appendChild(tr);
            }
            i++;
          }
          if (i) for (;trs.length > i; ) trs.pop().remove(); else {
            trs.length = 0;
            table.textContent = "";
          }
          report.classList.toggle("empty", !i);
        },
        updateCaption: () => {
          const t = editor.default.getEditorTitle(cm);
          typeof t == "string" ? caption.textContent = t : Object.assign(caption, t);
        }
      };
      function createTr(anno) {
        if (!rowCol) {
          [rowSeverity, rowLine, , rowCol, rowMessage] = tplRow.children;
          rowSeverityIcon = rowSeverity.firstChild;
        }
        const {message, from, rule, severity} = anno;
        rowSeverity.dataset.rule = rule;
        rowSeverityIcon.className = "CodeMirror-lint-marker CodeMirror-lint-marker-" + severity;
        rowSeverityIcon.textContent = severity;
        rowLine.textContent = from.line + 1;
        rowCol.textContent = from.ch + 1;
        rowMessage.title = util.clipString(message, 1e3) + (rule ? `\n(${rule})` : "");
        rowMessage.textContent = util.clipString(message, 100).replace(/ at line.*/, "");
        const tr = tplRow.cloneNode(!0);
        tr.className = severity;
        tr._anno = anno;
        return tr;
      }
    }
    function gotoLintIssue(e) {
      const tr = e.target.closest("tr");
      const cm = this._cm;
      editor.default.scrollToEditor(cm);
      cm.focus();
      cm.jumpToPos(tr._anno.from);
    }
    function disableForEditor(cm) {
      setCmLintOption(cm, !1);
      cms.delete(cm);
      for (const cb of unhookListeners) cb(cm);
    }
    function setCmLintOption(cm, fn) {
      cm.setOption("lint", fn && {
        delay: prefs.__values["editor.lintReportDelay"],
        getAnnotations: fn,
        onUpdateLinting
      });
    }
    function enableForEditor(cm, code, force) {
      if (!cms.has(cm)) {
        cms.set(cm, null);
        code ? enableOnProblems(cm, code, force) : setCmLintOption(cm, getAnnotations);
      }
    }
    function run() {
      for (const cm of cms.keys()) cm.performLint();
    }
    async function enableOnProblems(cm, code, force) {
      const results = await getAnnotations(code, {}, cm);
      if (force || results.length || cm.display.renderedView) {
        cms.set(cm, results);
        setCmLintOption(cm, getCachedAnnotations);
      } else cms.delete(cm);
    }
    function getAnnotations(code, options, cm) {
      const jobs = Array.from(linters, fn => fn(code, options, cm)).filter(Boolean);
      return jobs.length ? Promise.all(jobs).then(results => results.filter(Boolean).flat()) : jobs;
    }
    function getCachedAnnotations(code, opt, cm) {
      const results = cms.get(cm);
      cms.set(cm, null);
      cm.state.lint.options.getAnnotations = getAnnotations;
      return results;
    }
    function onUpdateLinting(...args) {
      for (const fn of lintingUpdatedListeners) fn(...args);
    }
    let curLinter;
    let linterOn;
    const kAtRuleDisallowedList = "at-rule-disallowed-list";
    const configs = new Map;
    const configHandlers = {
      __proto__: null,
      csslint: config => ({
        ...config,
        doc: !editor.default.isUsercss
      }),
      stylelint: (config, mode) => {
        const rules = {
          ...config.rules
        };
        const ats = rules[kAtRuleDisallowedList];
        rules[kAtRuleDisallowedList] = [ "import", ...Array.isArray(ats) ? ats : [] ];
        Object.assign(rules, config["rules:" + mode]);
        return {
          rules
        };
      }
    };
    const runLinter = async (text, _, cm) => {
      const mode = cm.options.mode.replace("text/x-less", "less");
      const cfgBase = configs.get(curLinter) || await getConfig(curLinter);
      const cfg = configHandlers[curLinter](cfgBase, mode);
      return edit_util.worker[curLinter](text, cfg, mode);
    };
    const linterPrefSubscriber = (key, val) => {
      if (key === "editor.linter") curLinter = configHandlers[val] ? val : prefs.__defaults[key]; else {
        linterOn = val;
        linters[val ? "add" : "delete"](runLinter);
      }
      for (const fn of onLinterPref) fn();
      run();
    };
    prefs.onStorageChanged.add(changes => {
      for (const name of Object.keys(configHandlers)) chrome_sync.LZ_KEY[name] in changes && getConfig(name).then(run);
    });
    async function getConfig(name) {
      const rawCfg = await chrome_sync.getLZValue(chrome_sync.LZ_KEY[name]);
      const cfg = {
        ...DEFAULTS[name],
        ...rawCfg
      };
      configs.set(name, cfg);
      return cfg;
    }
    const RULES = {};
    const KNOWN_RULES = {};
    const defaultConfig = {};
    const linterTitles = [ "CSSLint-mod", "Stylelint" ];
    const linterLinks = [ "https://github.com/CSSLint/csslint/wiki/Rules", "https://stylelint.io/user-guide/rules/" ];
    let cmDlg;
    let knownRules;
    let isStylelint;
    let popup;
    async function showLintConfig() {
      RULES[curLinter] ||= await edit_util.worker.getRules(curLinter);
      await oe.e("jsonlint").then(oe.bind(oe, 40));
      isStylelint = curLinter === "stylelint";
      const config = await chrome_sync.getLZValue(chrome_sync.LZ_KEY[curLinter]);
      const defaults = DEFAULTS[curLinter];
      const title = util.t("linterConfigPopupTitle", linterTitles[+isStylelint]);
      const activeRules = new Set(getActiveRules());
      knownRules = KNOWN_RULES[curLinter] || (KNOWN_RULES[curLinter] = new Set((isStylelint ? Object.keys(RULES[curLinter]) : RULES[curLinter].map(r => r.id)).sort()));
      for (const cfg of [ config, !defaultConfig[curLinter] && defaults ].filter(Boolean).map(getConfigRules)) {
        const missingRules = new Set(knownRules);
        for (const id in cfg) cfg[id] && knownRules.has(id) ? missingRules.delete(id) : /^[a-z]+(-[a-z]+)*$/.test(id) && delete cfg[id];
        if (!isStylelint) for (const id of missingRules) cfg[id] = 0;
      }
      defaultConfig[curLinter] = stringifyConfig(defaults);
      popup = edit_util.showCodeMirrorPopup(title, dom.$create("p", [ dom.$createLink(linterLinks[+isStylelint], util.t("linterRulesLink")), isStylelint ? "" : " " + util.t("linterCSSLintSettings") ]), {
        extraKeys: {
          "Ctrl-Enter": onConfigSave
        },
        hintOptions: {
          hint
        },
        lint: !0,
        mode: "application/json",
        value: config ? stringifyConfig({
          ...defaults,
          ...config
        }) : defaultConfig[curLinter]
      });
      popup._contents.appendChild(dom.$create("div", [ dom.$create(".buttons", [ dom.$create("button.save", {
        onclick: onConfigSave,
        title: "Ctrl-Enter"
      }, util.t("styleSaveLabel")), dom.$create("button.cancel", {
        onclick: onConfigCancel
      }, util.t("confirmClose")), dom.$create("button.reset", {
        onclick: onConfigReset,
        title: util.t("linterResetMessage")
      }, util.t("genericResetLabel")) ]) ]));
      cmDlg = popup.codebox;
      cmDlg.focus();
      cmDlg.addOverlay({
        token(stream) {
          const tok = stream.baseToken();
          if (tok && tok.type === "string property") {
            const id = stream.string.substr(stream.pos + 1, tok.size - 2);
            if (knownRules.has(id)) {
              stream.pos += tok.size;
              return "string-2 known-linter-rule" + (activeRules.has(id) ? " active-linter-rule" : "");
            }
          }
          stream.pos += tok ? tok.size : 1e9;
        }
      });
      cmDlg.on("changes", updateConfigButtons);
      updateConfigButtons();
      popup.onClose.add(onConfigClose);
    }
    async function showLintHelp() {
      RULES[curLinter] ||= await edit_util.worker.getRules(curLinter);
      isStylelint = curLinter === "stylelint";
      let baseUrl, makeItem;
      if (isStylelint) {
        baseUrl = linterLinks[1];
        makeItem = rule => dom.$create("li", rule === "CssSyntaxError" ? rule : dom.$createLink(baseUrl + rule, rule));
      } else {
        baseUrl = linterLinks[0];
        makeItem = ruleID => {
          for (const rule of RULES.csslint) if (rule.id === ruleID) return dom.$create("li", [ dom.$create("b", ruleID + ": "), rule.url ? dom.$createLink(rule.url, rule.name) : dom.$create("span", `"${rule.name}"`), dom.$create("p", rule.desc) ]);
        };
      }
      const header = util.t("linterIssuesHelp", "").split("");
      edit_util.helpPopup.show(dom.$createFragment([ header[0], dom.$createLink(baseUrl, linterTitles[+isStylelint]), header[1] ]), dom.$create("div", [ dom.$create("ul.rules", getActiveRules().map(makeItem)), dom.$create("button", {
        onclick: showLintConfig
      }, util.t("configureStyle")) ]));
    }
    function getActiveRules() {
      const all = [ ...getIssues() ].map(issue => issue.rule);
      return [ ...new Set(all) ];
    }
    function getLexicalDepth(lexicalState) {
      let depth = 0;
      for (;lexicalState = lexicalState.prev; ) depth++;
      return depth;
    }
    function hint(cm) {
      const rules = RULES[curLinter];
      let ruleIds, options;
      if (isStylelint) {
        ruleIds = Object.keys(rules);
        options = rules;
      } else {
        ruleIds = rules.map(r => r.id);
        options = {};
      }
      const cursor = cm.getCursor();
      const {start, end, string, type, state: {lexical}} = cm.getTokenAt(cursor);
      const {line, ch} = cursor;
      const quoted = string.startsWith('"');
      const leftPart = string.slice(quoted ? 1 : 0, ch - start).trim();
      const depth = getLexicalDepth(lexical);
      const search = cm.getSearchCursor(/"([-\w]+)"/, {
        line,
        ch: start - 1
      });
      let [, prevWord] = search.find(!0) || [];
      let words = [];
      if (depth === 1 && isStylelint) words = quoted ? [ "rules" ] : []; else if ((depth === 1 || depth === 2) && type && type.includes("property")) words = ruleIds; else if (depth === 2 || depth === 3 && lexical.type === "]") words = quoted ? ruleIds.includes(prevWord) && options[prevWord]?.[0] || [] : [ "true", "false", "null" ]; else if (depth === 4 && prevWord === "severity") words = [ "error", "warning" ]; else if (depth === 4) words = [ "ignore", "ignoreAtRules", "except", "severity" ]; else if (depth === 5 && lexical.type === "]" && quoted) {
        for (;prevWord && !ruleIds.includes(prevWord); ) prevWord = (search.find(!0) || [])[1];
        words = options[prevWord]?.slice(-1)[0] || ruleIds;
      }
      return {
        list: words.filter(word => word.startsWith(leftPart)),
        from: {
          line,
          ch: start + (quoted ? 1 : 0)
        },
        to: {
          line,
          ch: string.endsWith('"') ? end - 1 : end
        }
      };
    }
    function onConfigCancel() {
      edit_util.helpPopup.close();
      editor.default.closestVisible().focus();
    }
    function onConfigClose() {
      cmDlg = null;
    }
    function onConfigReset(event) {
      event.preventDefault();
      cmDlg.setValue(defaultConfig[curLinter]);
      cmDlg.focus();
      updateConfigButtons();
    }
    async function onConfigSave(event) {
      event instanceof Event && event.preventDefault();
      const json = util.tryJSONparse(cmDlg.getValue());
      if (!json) {
        showLinterErrorMessage(curLinter, util.t("linterJSONError"));
        cmDlg.focus();
        return;
      }
      const cfg = getConfigRules(json);
      const defaults = getConfigRules(DEFAULTS[curLinter]);
      for (const id in defaults) id in cfg ? cfg[id] || defaults[id] || delete cfg[id] : cfg[id] = !isStylelint && 0;
      chrome_sync.setLZValue(chrome_sync.LZ_KEY[curLinter], json);
      cmDlg.markClean();
      cmDlg.focus();
      updateConfigButtons();
    }
    function getConfigRules(c) {
      return isStylelint ? c.rules || (c.rules = {}) : c;
    }
    function stringifyConfig(config) {
      return JSON.stringify(config, null, 2).replace(/\[\s*(\w+)\s*,\s*{\s*("severity":\s*"\w+")\s*}\s*]/g, "[$1, {$2}]");
    }
    async function showLinterErrorMessage(title, contents) {
      await dom_util.messageBox.alert(contents, "danger lint-config", title, {
        buttons: [ util.t("confirmOK") ]
      });
      popup?.codebox?.focus();
    }
    function updateConfigButtons() {
      popup.$(".save").disabled = cmDlg.isClean();
      popup.$(".reset").disabled = cmDlg.getValue() === defaultConfig[curLinter];
      popup.$(".cancel").textContent = util.t(cmDlg.isClean() ? "confirmClose" : "confirmCancel");
    }
    var load_style = oe(981);
    var msg = oe(3619);
    var msg_api = oe(4930);
    var util_webext = oe(1480);
    var live_preview = oe(4230);
    let replacing, replaceQueue;
    msg.onMessage.set(request => {
      if (!request.broadcast) return;
      const {style} = request;
      switch (request.method) {
       case "styleUpdated":
        editor.default.style.id === style.id && handleExternalUpdate(style, request.reason, request.editorId);
        break;

       case "styleDeleted":
        editor.default.style.id === style.id && util_webext.closeCurrentTab();
      }
    });
    function handleExternalUpdate(style, reason, editorId) {
      if (reason !== "editPreview" && reason !== "editPreviewEnd" && (reason !== "editSave" || editor.default.msg.editorId !== editorId)) if (reason !== "toggle") {
        (replaceQueue ??= []).push([ style, reason ]);
        replacing = replacing ? replacing.then(onReplaced, onReplaced) : onReplaced();
      } else {
        if (editor.default.dirty.isDirty()) editor.default.toggleStyle(null, style.enabled); else {
          Object.assign(editor.default.style, style);
          (0, live_preview.default)();
        }
        editor.default.updateMeta?.();
      }
    }
    async function onReplaced() {
      let [style, reason] = replaceQueue.shift();
      style = await msg_api.API.styles.getCore({
        id: style.id,
        src: !0,
        vars: !0
      });
      if (style) {
        if (reason === "config") {
          for (const key in editor.default.style) key === "sourceCode" || key === "sections" || key in style || delete editor.default.style[key];
          delete style.name;
          delete style.enabled;
          Object.assign(editor.default.style, style);
          (0, live_preview.default)();
        } else await editor.default.replaceStyle(style);
        window.dispatchEvent(new Event("styleSettings"));
      }
    }
    let inputs;
    let tableBody;
    function keymapHelp() {
      const PREF = "editor.keyMap";
      const keyMap = mergeKeyMaps({}, prefs.__values[PREF], src_cm.extraKeys);
      const keyMapSorted = Object.keys(keyMap).map(key => ({
        key,
        cmd: keyMap[key]
      })).sort((a, b) => a.cmd < b.cmd || a.cmd === b.cmd && a.key < b.key ? -1 : 1);
      const table = localization.template.keymapHelp.cloneNode(!0);
      const row = (tableBody = table.tBodies[0]).rows[0];
      const cellA = row.children[0];
      const cellB = row.children[1];
      tableBody.textContent = "";
      for (const {key, cmd} of keyMapSorted) {
        cellA.textContent = key;
        cellB.textContent = cmd;
        tableBody.appendChild(row.cloneNode(!0));
      }
      edit_util.helpPopup.show(util.t("cm_keyMap") + ": " + prefs.__values[PREF], table, {}, PREF);
      inputs = table.$$("input");
      inputs[0].on("keydown", hotkeyHandler);
      inputs[1].focus();
      table.oninput = filterTable;
    }
    function hotkeyHandler(event) {
      const keyName = src_cm.CodeMirror.keyName(event);
      if (keyName === "Esc" || keyName === "Tab" || keyName === "Shift-Tab") return;
      event.preventDefault();
      event.stopPropagation();
      const keyMap = {};
      keyMap[keyName.replace(/(Shift|Ctrl|Alt|Cmd)$/, "$&-dummy")] = "";
      const normalizedKey = Object.keys(src_cm.CodeMirror.normalizeKeyMap(keyMap))[0];
      this.value = normalizedKey.replace("-dummy", "");
      filterTable(event);
    }
    function filterTable(event) {
      const input = event.target;
      const col = input.parentNode.cellIndex;
      inputs[1 - col].value = "";
      for (const row of tableBody.rows) {
        const cell = row.children[col];
        const text = cell.textContent;
        const query = util.stringAsRegExp(input.value, "gi");
        const test = query.test(text);
        row.style.display = input.value && test === !1 ? "none" : "";
        if (input.value && test) {
          cell.textContent = "";
          let offset = 0;
          text.replace(query, (match, index) => {
            index > offset && cell.appendChild(document.createTextNode(text.substring(offset, index)));
            cell.appendChild(dom.$create("mark", match));
            offset = index + match.length;
          });
          offset < text.length && cell.appendChild(document.createTextNode(text.substring(offset)));
        } else cell.textContent = text;
        const otherCell = row.children[1 - col];
        otherCell.children.length && (otherCell.textContent = otherCell.innerText);
      }
    }
    function mergeKeyMaps(merged, ...more) {
      more.forEach(keyMap => {
        typeof keyMap == "string" && (keyMap = src_cm.CodeMirror.keyMap[keyMap]);
        Object.keys(keyMap).forEach(key => {
          let cmd = keyMap[key];
          if (!merged[key] && !key.match(/^[a-z]/) && cmd !== "...") if (typeof cmd == "function") {
            cmd = cmd.toString().replace(/^function.*?{[\s\r\n]*([\s\S]+?)[\s\r\n]*}$/, "$1");
            merged[key] = util.clipString(cmd, 200);
          } else merged[key] = cmd;
        });
        keyMap.fallthrough && (merged = mergeKeyMaps(merged, keyMap.fallthrough));
      });
      return merged;
    }
    for (const [id, init, tpl] of [ [ "#options", ui => {
      const maps = Object.keys(src_cm.CodeMirror.keyMap).map(name => ({
        value: name,
        name: name.replace(/^(pc|mac)(.+)/, (s, arch, baseName) => baseName.toLowerCase() + "-" + (arch === "mac" ? "Mac" : "PC"))
      })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name && 1);
      const fragment = document.createDocumentFragment();
      let bin = fragment;
      let groupName;
      maps.forEach(({value, name}, i) => {
        groupName = name.includes("-") ? groupName : name;
        const groupWithNext = maps[i + 1] && maps[i + 1].name.startsWith(groupName);
        groupWithNext && bin === fragment && (bin = fragment.appendChild(dom.$create("optgroup", {
          label: name.split("-")[0]
        })));
        const el = bin.appendChild(dom.$create("option", {
          value
        }, name));
        if (value === prefs.__defaults["editor.keyMap"]) {
          el.dataset.default = "";
          el.title = util.t("defaultTheme");
        }
        groupWithNext || (bin = fragment);
      });
      const selector = ui.$("#editor\\.keyMap");
      selector.textContent = "";
      selector.appendChild(fragment);
      ui.$("#editor\\.theme").append(dom.$create("option", {
        value: "default"
      }, util.t("defaultTheme")), ...Object.keys(src_cm.THEMES).map(s => dom.$create("option", s)));
      ui.$("#colorpicker-settings").onclick = edit_util.openHotkeyPopup;
      dom_prefs.setupLivePrefs(ui);
      ui.$("#keyMap-help").onclick = keymapHelp;
    }, "editorSettings" ], [ "#styleOpts", ui => {
      const PASS = val => val;
      const {style} = editor.default;
      const elAuto = ui.$("#config\\.autosave");
      const elSave = ui.$("#ss-save");
      const elUpd = ui.$("#ss-updatable");
      const pendingSetters = new Map;
      const updaters = [ initCheckbox(elUpd, "updatable", util.tryURL(style.updateUrl).href), initCheckbox("#ss-overridden", "overridden", !1), initInput("#ss-update-url", "updateUrl", "", {
        validate(el) {
          elUpd.disabled = !el.value || !el.validity.valid;
          return el.validity.valid;
        }
      }), function(name, key, defVal) {
        ui.$(`#${name}`).oninput = e => {
          e.target.checked && autosave(e.target, {
            key
          });
        };
        return () => {
          ui.$(`[name="${name}"][value="${style[key] || defVal}"]`).checked = !0;
        };
      }("ss-scheme", "preferScheme", "none"), initArea("inclusions"), initArea("exclusions") ];
      update();
      prefs.subscribe("schemeSwitcher.enabled", (_, val) => {
        ui.$("#ss-scheme-off").hidden = val !== "never";
      }, !0);
      window.on("styleSettings", update);
      elSave.onclick = save;
      dom_prefs.setupLivePrefs(ui);
      function autosave(el, setter) {
        pendingSetters.set(el, setter);
        ui.classList.add("dirty");
        elSave.disabled = !1;
        elAuto.checked && util.debounce(save, 500);
      }
      function initArea(type) {
        return initInput(`#ss-${type}`, type, [], {
          get: textToList,
          set: list => list.join("\n"),
          validate(el) {
            const val = el.value;
            el.rows = val.match(/^/gm).length + !val.endsWith("\n");
          }
        });
      }
      function initCheckbox(el, key, defVal) {
        return initInput(el, key, Boolean(defVal), {
          dom: "checked"
        });
      }
      function initInput(el, key, defVal, {dom = "value", get = PASS, set = PASS, validate = PASS} = {}) {
        typeof el == "string" && (el = ui.$(el));
        el.oninput = () => {
          validate(el) !== !1 && autosave(el, {
            dom,
            get,
            key
          });
        };
        return () => {
          let val = style[key];
          val = set(val != null ? val : defVal);
          if (el[dom] !== val) {
            el[dom] = val;
            validate(el);
          }
        };
      }
      function save() {
        pendingSetters.forEach(saveValue);
        pendingSetters.clear();
        ui.classList.remove("dirty");
        elSave.disabled = !0;
      }
      function saveValue({dom = "value", get = PASS, key}, el) {
        if (style.id) return msg_api.API.styles.config(style.id, key, get(el[dom]));
        style[key] = get(el[dom]);
      }
      function textToList(text) {
        return text.split(/\n/).map(s => s.trim()).filter(Boolean);
      }
      function update() {
        updaters.forEach(fn => fn());
      }
    }, "styleSettings" ] ]) {
      const el = document.querySelector(id);
      const onPref = (key, val) => {
        if (val && dom_util.onDetailsToggled.delete(el)) {
          prefs.unsubscribe(key, onPref);
          localization.template[tpl] = el.appendChild(dom.$create("main", localization.template[tpl]));
          init(el);
        }
      };
      dom_util.onDetailsToggled.set(el, onPref);
      prefs.subscribe(el.dataset.pref, onPref, !0);
    }
    var style_util = oe(8660);
    var target_icons = oe(7046);
    const C_CONTAINER = ".applies-to";
    const C_LIST = ".applies-to-list";
    const C_ITEM = ".applies-to-item";
    const C_TYPE = ".applies-type";
    const C_VALUE = ".applies-value";
    const tplAppliesTo = localization.template.appliesTo;
    const tplAppliesToItem = tplAppliesTo.$(C_ITEM);
    let queue, timer;
    tplAppliesToItem.remove();
    function iconize(what, throttle) {
      timer && (timer = clearTimeout(timer));
      if (what) {
        queue ??= new Set;
        what.forEach ? what.forEach(queue.add, queue) : queue.add(what);
      }
      throttle && (timer = setTimeout(iconize, 500));
      if (queue) {
        target_icons.renderTargetIcons(queue, C_VALUE, "value");
        queue = null;
      }
    }
    let headerOffset;
    let cmExtrasHeight;
    const ACTIONS = {
      __proto__: null
    };
    class EditorSection {
      constructor(sectionData, genId, si) {
        const me = this;
        const el = me.el = localization.template.section.cloneNode(!0);
        const elLabel = me.elLabel = el.$(".code-label");
        const elTargets = this.elTargets = tplAppliesTo.cloneNode(!0);
        const wrapper = document.createElement("div");
        wrapper.className = "CodeMirror";
        elLabel.after(elTargets);
        elTargets[prefs.__values["editor.targetsFirst"] ? "after" : "before"](wrapper);
        el.me = me;
        me.id = genId();
        me.genId = genId;
        me.elLabelText = elLabel.lastChild;
        me.init = sectionData;
        me.si = si;
        me.targets = [];
        me.targetsListEl = el.$(C_LIST);
        me.tocEntry = {
          label: ""
        };
        for (const propName in style_util.TO_CSS) {
          const arr = sectionData[propName];
          const cssName = style_util.TO_CSS[propName];
          if (cssName && arr) for (const v of arr) me.addTarget(cssName, v);
        }
        this.updateTocEntry();
      }
      get cm() {
        return this.create();
      }
      create(inView) {
        const {el, elTargets, si, init} = this;
        const {code} = init;
        const cm = el.CodeMirror = codemirror_factory.default.create(wrapper => {
          const ws = wrapper.style;
          const h = editor.default.loading ? ws.height = si ? si.height : "100vh" : ws.height;
          el.style.setProperty("--cm-height", h);
          el.$(".CodeMirror").replaceWith(wrapper);
        }, {
          value: code
        }, _ => editor.default.applyScrollInfo(_, si));
        Object.defineProperty(this, "cm", {
          value: cm
        });
        cm.el = el;
        cm.editorSection = this;
        cm.setSize = EditorSection.onSetSize;
        this.changeGeneration = cm.changeGeneration();
        this.removed = !1;
        el.$(".edit-actions").on("click", this);
        elTargets.on("change", this);
        elTargets.on("input", this);
        elTargets.on("click", this);
        cm.on("changes", EditorSection.onCmChanges);
        this.targets.length ? prefs.__values["manage.newUI.favicons"] && iconize(this.targetsListEl) : this.addTarget();
        initBeautifyButton(el.$(".beautify-section"), [ cm ]);
        prefs.subscribe("editor.toc.expanded", this.updateTocPrefToggled.bind(this), !0);
        prefs.__values["editor.arrowKeysTraverse"] && this.toggleTraverse(!0);
        setTimeout(enableForEditor, prefs.__values["editor.lintReportDelay"], cm, code);
        new ResizeGrip(cm);
        !inView || si && si.height || resizeCM(cm);
        this.si = this.init = null;
        return cm;
      }
      getModel() {
        const res = {
          code: this.cm.getValue()
        };
        for (const {type, value} of this.targets) type && (res[style_util.FROM_CSS[type]] ??= []).push(value);
        return res;
      }
      toggle(restore) {
        (restore ? enableForEditor : disableForEditor)(this.cm);
        this.el.classList.toggle("removed", !restore);
        this.removed = this.tocEntry.removed = !restore;
        this.targets.forEach(t => restore ? t.restore() : t.remove());
        restore && this.cm.refresh();
      }
      render() {
        this.cm.refresh();
      }
      destroy() {
        codemirror_factory.default.destroy(this.cm);
      }
      updateTocEntry(origin, sec = this) {
        const te = sec.tocEntry;
        let changed;
        if (origin === "code" || !origin) {
          const label = sec.getLabelFromComment();
          if (te.label !== label) {
            te.label = sec.elLabelText.textContent = label;
            changed = !0;
          }
        }
        if (!te.label) {
          const first = sec.targets[0];
          const target = first?.type ? first.value : null;
          if (te.target !== target) {
            te.target = target;
            changed = !0;
          }
          if (te.numTargets !== sec.targets.length) {
            te.numTargets = sec.targets.length;
            changed = !0;
          }
        }
        changed && editor.default.updateToc([ sec ]);
      }
      updateTocEntryLazy() {
        util.debounce(this.updateTocEntry, 0, "", this);
      }
      updateTocFocus(evt) {
        editor.default.updateToc({
          focus: !0,
          0: evt ? this.me : this
        });
      }
      updateTocPrefToggled(key, val) {
        this.el[val ? "on" : "off"]("focusin", this.updateTocFocus);
        val && this.el.contains(document.activeElement) && this.updateTocFocus();
      }
      getLabelFromComment() {
        let cmt = "";
        let inCmt;
        let elUC;
        (this.init ? {
          eachLine: fn => fn({
            text: this.init.code
          })
        } : this.cm).eachLine(({text}) => {
          let i = 0;
          if (!inCmt) {
            i = text.search(/\S/);
            if (i < 0) return;
            inCmt = text[i] === "/" && text[i + 1] === "*";
            if (!inCmt) return !0;
          }
          const j = text.indexOf("*/", i + 2);
          text = text.slice(i, j >= 0 ? j : text.length);
          cmt = edit_util.trimCommentLabel(text.slice(2));
          elUC = this.elUC;
          if (cmt && style_util.RX_META1.test(text)) {
            cmt = "UserCSS";
            if (elUC) elUC = null; else {
              elUC = this.elUC = localization.template.usercssSection.cloneNode(!0);
              this.elLabelText.after(elUC);
            }
          } else if (elUC) {
            elUC.remove();
            elUC = this.elUC = !1;
          }
          elUC != null && this.elLabel.classList.toggle("warn", elUC);
          return j >= 0 || cmt;
        });
        return cmt;
      }
      handleEvent(evt) {
        const el = evt.target;
        const cls = el.classList.item(0);
        const actionFn = ACTIONS[cls];
        const trg = !actionFn && el.closest(C_ITEM)?.me;
        let tmp;
        switch (evt.type) {
         case "click":
          if (actionFn) actionFn(this); else if (cls === "add-applies-to") this.addTarget(trg.type, "", trg).el.$(C_VALUE).focus(); else if (cls === "remove-applies-to") this.removeTarget(trg); else if (!this.ati && (tmp = el.closest("label"))) {
            const chkLabel = localization.template.editorSettings.$("#editor\\.targetsFirst").closest("label").cloneNode(!0);
            (this.ati = edit_util.helpPopup.show(chkLabel, tmp.title, {}, "ati")).onClose.add(() => delete this.ati);
            dom_prefs.setupLivePrefs(chkLabel);
          }
          break;

         case "change":
          el === trg.selectEl && trg.onSelectChange();
          break;

         case "input":
          el === trg.valueEl && trg.onValueChange();
        }
      }
      addTarget(type, value, base) {
        const {targets} = this;
        const res = new SectionTarget(this, type, value);
        targets.splice(base ? targets.indexOf(base) + 1 : targets.length, 0, res);
        this.targetsListEl.insertBefore(res.el, base ? base.el.nextSibling : null);
        this.init || editor.default.dirty.add(res, res);
        targets.length > 1 && !targets[0].type && this.removeTarget(targets[0]);
        base && requestAnimationFrame(() => this.shrinkBy1());
        this.el.style.setProperty("--targets", targets.length);
        (0, live_preview.default)();
        return res;
      }
      removeTarget(target) {
        const {targets} = this;
        targets.splice(targets.indexOf(target), 1);
        editor.default.dirty.remove(target, target);
        target.remove();
        target.el.remove();
        targets.length || this.addTarget();
        this.el.style.setProperty("--targets", targets.length);
        (0, live_preview.default)();
      }
      toggleTraverse(state) {
        this.cm.display.wrapper[state ? "on" : "off"]("keydown", traverse, !0);
      }
      shrinkBy1() {
        const {cm, el} = this;
        const cmEl = cm.display.wrapper;
        const cmH = cmEl.offsetHeight;
        const viewH = el.parentElement.offsetHeight;
        el.offsetHeight > viewH && cmH > Math.min(viewH / 2, cm.display.sizer.offsetHeight + 30) && (cmEl.style.height = (cmH - this.elTargets.offsetHeight / (this.targets.length || 1) | 0) + "px");
      }
      static onCmChanges(cm) {
        const cur = cm.changeGeneration();
        const sec = cm.editorSection;
        editor.default.dirty.modify(`section.${sec.id}.code`, sec.changeGeneration, cur);
        sec.changeGeneration = cur;
        sec.updateTocEntryLazy();
        (0, live_preview.default)();
      }
      static onSetSize(w, h) {
        const cm = this;
        src_cm.CodeMirror.prototype.setSize.call(cm, w, h);
        cm.el.style.setProperty("--cm-height", cm.display.wrapper.style.height);
      }
    }
    class SectionTarget {
      constructor(section, type = "", value = "") {
        this.id = section.genId();
        this.el = tplAppliesToItem.cloneNode(!0);
        this.el.me = this;
        dom.$toggleDataset(this.el, "type", type);
        this.section = section;
        this.dirt = `section.${section.id}.apply.${this.id}`;
        this.selectEl = this.el.$(C_TYPE);
        this.valueEl = this.el.$(C_VALUE);
        editor.default.toggleRegexp(this.valueEl, type);
        this.type = this.selectEl.value = type;
        this.value = this.valueEl.value = value;
        section.init || this.restore();
      }
      remove() {
        if (this.type) {
          editor.default.toggleRegexp(this.valueEl);
          editor.default.dirty.remove(`${this.dirt}.type`, this.type);
          editor.default.dirty.remove(`${this.dirt}.value`, this.value);
        }
      }
      restore() {
        if (this.type) {
          editor.default.dirty.add(`${this.dirt}.type`, this.type);
          editor.default.dirty.add(`${this.dirt}.value`, this.value);
        }
      }
      onSelectChange() {
        const sec = this.section;
        const val = this.selectEl.value;
        editor.default.dirty.modify(`${this.dirt}.type`, this.type, val);
        editor.default.toggleRegexp(this.valueEl, val);
        dom.$toggleDataset(this.el, "type", val);
        this.type = val;
        sec.updateTocEntry("apply");
        prefs.__values["manage.newUI.favicons"] && iconize(this.el, !0);
        (0, live_preview.default)();
      }
      onValueChange() {
        const val = this.valueEl.value;
        editor.default.dirty.modify(`${this.dirt}.value`, this.value, val);
        this.value = val;
        this.section.updateTocEntry("apply");
        prefs.__values["manage.newUI.favicons"] && iconize(this.el, !0);
        (0, live_preview.default)();
      }
    }
    class ResizeGrip {
      constructor(cm) {
        const wrapper = this.wrapper = cm.display.wrapper;
        const el = localization.template.resizeGrip.cloneNode(!0);
        const elTop = el.cloneNode(!0);
        elTop.me = el.me = this;
        elTop.dataset.top = "";
        wrapper.classList.add("resize-grip-enabled");
        wrapper.append(el, elTop);
        this.cm = cm;
        this.lastClickTime = 0;
        this.lastHeight = 0;
        this.minHeight = 0;
        this.lastY = 0;
        this.dir = 1;
        elTop.on("mousedown", this);
        el.on("mousedown", this);
      }
      handleEvent(evt) {
        switch (evt.type) {
         case "mousedown":
          this.onMouseDown(evt);
          break;

         case "mousemove":
          this.onMouseMove(evt);
          break;

         case "mouseup":
          this.onMouseUp(evt);
        }
      }
      onMouseDown(evt) {
        if (evt.button === 0) {
          evt.preventDefault();
          this.lastHeight = this.wrapper.offsetHeight;
          this.lastY = evt.y;
          if (Date.now() - this.lastClickTime < 500) {
            this.lastClickTime = 0;
            this.toggleSectionHeight();
          } else {
            this.lastClickTime = Date.now();
            this.minHeight = this.cm.defaultTextHeight() + this.cm.display.lineDiv.offsetParent.offsetTop + this.wrapper.offsetHeight - this.wrapper.clientHeight;
            this.dir = "top" in evt.target.dataset ? -1 : 1;
            dom.$rootCL.add("resizing-v");
            document.on("mousemove", this);
            document.on("mouseup", this);
          }
        }
      }
      onMouseMove(evt) {
        const height = Math.max(this.minHeight, this.lastHeight + (evt.y - this.lastY) * this.dir);
        const delta = height - this.lastHeight;
        if (delta) {
          this.cm.setSize(null, height);
          this.lastHeight = height;
          this.lastY = evt.y;
          this.dir < 0 && dom.$root.scrollBy(0, delta);
        }
      }
      onMouseUp() {
        document.off("mouseup", this);
        document.off("mousemove", this);
        dom.$rootCL.remove("resizing-v");
      }
      toggleSectionHeight() {
        const {cm, wrapper} = this;
        if (cm.state.toggleHeightSaved) {
          cm.setSize(null, cm.state.toggleHeightSaved);
          cm.state.toggleHeightSaved = 0;
        } else {
          const pageExtrasHeight = document.getElementById("sections").getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(document.getElementById("sections")).paddingBottom);
          const sectionEl = wrapper.parentNode;
          const sectionExtrasHeight = sectionEl.clientHeight - wrapper.offsetHeight;
          cm.state.toggleHeightSaved = wrapper.clientHeight;
          cm.setSize(null, window.innerHeight - sectionExtrasHeight - pageExtrasHeight);
          const bounds = sectionEl.getBoundingClientRect();
          (bounds.top < 0 || bounds.bottom > window.innerHeight) && window.scrollBy(0, bounds.top);
        }
      }
    }
    function traverse(event) {
      if (event.shiftKey || event.altKey || event.metaKey || event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      let pos;
      let cm = this.CodeMirror;
      const {line, ch} = cm.getCursor();
      if (event.key === "ArrowUp") {
        cm = line === 0 && editor.default.prevEditor(cm, !0);
        pos = cm && [ cm.doc.size - 1, ch ];
      } else {
        cm = line === cm.doc.size - 1 && editor.default.nextEditor(cm, !0);
        pos = cm && [ 0, 0 ];
      }
      if (cm) {
        cm.setCursor(...pos);
        event.preventDefault();
        event.stopPropagation();
      }
    }
    function resizeCM(cm) {
      const {display: {wrapper, sizer}} = cm;
      const lineHeight = cm.defaultTextHeight();
      let contentHeight = sizer.offsetHeight;
      if (contentHeight < lineHeight) return;
      headerOffset == null && (headerOffset = Math.ceil(document.querySelector("#sections").getBoundingClientRect().top + scrollY));
      cmExtrasHeight == null && (cmExtrasHeight = wrapper.offsetHeight - wrapper.clientHeight);
      contentHeight += cmExtrasHeight + lineHeight;
      const cmHeight = wrapper.offsetHeight;
      const appliesToHeight = Math.min(wrapper.parentNode.offsetHeight - cmHeight, innerHeight / 2);
      const maxHeight = Math.floor(window.innerHeight - headerOffset - appliesToHeight);
      const fit = Math.min(contentHeight, maxHeight);
      Math.abs(fit - cmHeight) > 1 && cm.setSize(null, fit);
    }
    function SectionsEditor() {
      const {style, dirty} = editor.default;
      const container = document.getElementById("sections");
      const sections = [];
      const liveSections = [];
      const getLineHeight = () => liveSections.find(s => !s.init).cm.defaultTextHeight();
      const xo = new IntersectionObserver(entries => {
        for (const e of entries) {
          const r = e.intersectionRatio && e.intersectionRect;
          if (r) {
            const el = e.target;
            const section = el.me;
            xo.unobserve(el);
            r.bottom > 0 && r.top < innerHeight ? refreshOnViewNow(section) : setTimeout(refreshOnViewNow, 0, section);
          }
        }
      }, {
        rootMargin: "100%"
      });
      const reifySection = {
        get(obj, i) {
          const sec = this.src[i];
          return obj[i] = sec.init ? sec.create() : sec.cm;
        }
      };
      let INC_ID = 0;
      let arrayProps;
      let sectionOrder = "";
      updateMeta();
      edit_util.rerouteHotkeys.toggle(!0);
      document.getElementById("to-mozilla").on("click", () => {
        const value = editor.default.getValue();
        const popup = edit_util.showCodeMirrorPopup(util.t("styleToMozillaFormatTitle"), util.t("styleToMozillaFormatHelp"), {
          readOnly: !0,
          value
        });
        const cm = popup.codebox;
        popup._contents.append(dom.$create(".buttons", [ dom.$create("button", {
          onclick: () => {
            navigator.clipboard.writeText(value);
            edit_util.helpPopup.close();
          }
        }, util.t("copy")), dom.$create("button", {
          onclick: edit_util.helpPopup.close
        }, util.t("confirmClose")) ]));
        cm.execCommand("selectAll");
      });
      document.getElementById("from-mozilla").on("click", () => showMozillaFormatImport());
      document.on("wheel", event => {
        if (event.shiftKey && event.ctrlKey && !event.altKey && !event.metaKey) {
          window.scrollBy(0, event.deltaX || event.deltaY);
          event.preventDefault();
        }
      }, {
        passive: !1
      });
      src_cm.extraKeys["Shift-Ctrl-Wheel"] = "scrollWindow";
      prefs.subscribe("editor.arrowKeysTraverse", (_, val) => {
        for (const s of sections) s.toggleTraverse(val);
      }, !0);
      prefs.subscribe("editor.targetsFirst", (_, val) => {
        for (const sec of sections) (val ? sec.elLabel : sec.targetsEl.nextSibling).after(sec.targetsEl);
      });
      prefs.subscribe("manage.newUI.favicons", (key, val) => {
        val && iconize(sections.map(sec => sec.targetsEl));
      });
      container.moveBefore ||= container.insertBefore;
      ACTIONS["remove-section"] = section => {
        if (liveSections.length === 1) throw new Error("Cannot remove last section");
        if (section.cm.isBlank()) {
          sections.splice(sections.indexOf(section), 1);
          section.el.remove();
          section.toggle();
          section.destroy();
        } else {
          const lines = [];
          const MAX_LINES = 10;
          section.cm.doc.iter(0, MAX_LINES + 1, ({text}) => lines.push(text) && !1);
          const title = util.t("sectionCode") + "\n" + "-".repeat(20) + "\n" + lines.slice(0, MAX_LINES).map(s => util.clipString(s, 100)).join("\n") + (lines.length > MAX_LINES ? "\n..." : "");
          const del = section.elDel = localization.template.deletedSection.cloneNode(!0);
          del.$("button").onclick = () => restoreSection(section);
          del.title = title;
          section.el.prepend(del);
          section.toggle();
        }
        liveSections.splice(liveSections.indexOf(section), 1);
        dirty.remove(section, section);
        updateSectionOrder();
        (0, live_preview.default)();
      };
      ACTIONS["add-section"] = section => insertSectionAfter(void 0, section);
      ACTIONS["clone-section"] = section => insertSectionAfter(section.getModel(), section);
      ACTIONS["move-section-up"] = moveSection.bind(null, -1);
      ACTIONS["move-section-down"] = moveSection.bind(null, 1);
      Object.assign(editor.default, {
        cm: {
          defaultTextHeight: getLineHeight
        },
        sections: liveSections,
        sectionsRaw: sections,
        closestVisible: el => {
          const lineHeight = getLineHeight();
          const margin = 2 * lineHeight;
          const cm = el instanceof src_cm.CodeMirror ? el : el instanceof Node && getAssociatedEditor(el) || getLastActivatedEditor();
          el === cm && (el = document.body);
          if (el instanceof Node && cm) {
            const {wrapper} = cm.display;
            if (!container.contains(el) || wrapper.closest(".section").contains(el)) {
              const rect = wrapper.getBoundingClientRect();
              if (rect.top < window.innerHeight - margin && rect.bottom > margin) return cm;
            }
          }
          const scrollY = window.scrollY;
          const windowBottom = scrollY + window.innerHeight - margin;
          const allSectionsContainerTop = scrollY + container.getBoundingClientRect().top;
          const distances = [];
          return cm && offscreenDistance() === 0 ? cm : (() => {
            const editors = editor.default.getEditors();
            const last = editors.length - 1;
            let a = 0;
            let b = last;
            let c;
            let distance;
            for (;a < b - 1; ) {
              c = (a + b) / 2 | 0;
              distance = offscreenDistance(c);
              if (!distance || !c) break;
              const distancePrev = offscreenDistance(c - 1);
              const distanceNext = c < last ? offscreenDistance(c + 1) : 1e20;
              distancePrev <= distance && distance <= distanceNext ? b = c : a = c;
            }
            for (;b && offscreenDistance(b - 1) <= offscreenDistance(b); ) b--;
            const closest = editors[b];
            distances[b] > 0 && editor.default.scrollToEditor(closest);
            return closest;
          })();
          function offscreenDistance(index) {
            if (index >= 0 && distances[index] !== void 0) return distances[index];
            const section = cm && cm.display.wrapper.closest(".section");
            if (!section) return 1e9;
            const top = allSectionsContainerTop + section.offsetTop;
            if (top < scrollY + lineHeight) return Math.max(0, scrollY - top - lineHeight);
            if (top < windowBottom) return 0;
            const distance = top - windowBottom + section.offsetHeight;
            index >= 0 && (distances[index] = distance);
            return distance;
          }
        },
        importOnPaste: (cm, event, text) => {
          if (/@-moz-document/i.test(text) && /@-moz-document\s+(url|url-prefix|domain|regexp)\(/i.test(text.replace(/\/\*([^*]+|\*(?!\/))*(\*\/|$)/g, ""))) {
            event.preventDefault();
            showMozillaFormatImport(text);
          }
        },
        updateMeta,
        getEditors(liveOnly) {
          if (liveOnly) return liveSections.map(s => !s.init && s.cm);
          let lazy;
          const res = Array(liveSections.length);
          for (let sec, i = 0; i < liveSections.length; i++) {
            sec = sections[i];
            sec.init ? lazy = !0 : res[i] = sec.cm;
          }
          if (lazy) {
            if (!arrayProps) {
              arrayProps = Object.getOwnPropertyDescriptors(Array.prototype);
              delete arrayProps.length;
            }
            Object.setPrototypeOf(res, new Proxy([], {
              ...reifySection,
              src: [ ...liveSections ]
            }));
            Object.defineProperties(res, arrayProps);
            res.lazy = !0;
          }
          return res;
        },
        getEditorSibling: (cm, direction) => liveSections[(liveSections.indexOf(cm.editorSection) + direction + liveSections.length) % liveSections.length].cm,
        getEditorTitle(cm) {
          const index = liveSections.indexOf(cm.editorSection) + 1;
          return {
            textContent: `#${index}`,
            title: `${util.t("sectionCode")} ${index}`
          };
        },
        getValue(asObject) {
          const st = getModel();
          return asObject ? st : style_util.styleToCss(st);
        },
        getSearchableInputs(cm) {
          const sec = cm.editorSection;
          return sec ? sec.targets.map(a => a.valueEl).filter(Boolean) : [];
        },
        isSame: styleObj => style_util.styleSectionsEqual(styleObj, getModel()),
        jumpToEditor(i) {
          const {cm} = liveSections[i] || {};
          editor.default.scrollToEditor(cm);
          cm.focus();
        },
        nextEditor: (cm, upDown) => upDown && cm.editorSection === liveSections[liveSections.length - 1] ? null : nextPrevEditor(cm, 1, upDown),
        prevEditor: (cm, upDown) => upDown && cm.editorSection === liveSections[0] ? null : nextPrevEditor(cm, -1, upDown),
        async replaceStyle(newStyle, draft) {
          const sameCode = editor.default.isSame(newStyle);
          if (sameCode || draft || await dom_util.messageBox.confirm(util.t("styleUpdateDiscardChanges"))) {
            draft || dirty.clear();
            sameCode || await initSections(newStyle.sections, {
              keepDirty: draft,
              replace: !0,
              si: draft && draft.si
            });
            editor.default.useSavedStyle(newStyle);
            (0, live_preview.default)();
          }
        },
        async saveImpl() {
          try {
            if (!document.getElementById("name").reportValidity()) throw util.t("styleMissingName");
            const res = await msg_api.API.styles.editSave(getModel(), editor.default.msg);
            dirty.clear();
            editor.default.useSavedStyle(res);
          } catch (_) {
            dom_util.messageBox.alert(_.message || _);
          }
        },
        scrollToEditor(cm, partial) {
          const cc = partial && cm.cursorCoords(!0, "window");
          const {top: y1, bottom: y2} = cm.el.getBoundingClientRect();
          const rc = container.getBoundingClientRect();
          const rcY1 = Math.max(rc.top, 0);
          const rcY2 = Math.min(rc.bottom, innerHeight);
          (partial ? cc.top < rcY1 || cc.top > rcY2 - 30 : y1 >= rcY1 ^ y2 <= rcY2) && window.scrollBy(0, (y1 + y2 - rcY2 + rcY1) / 2 | 0);
        }
      });
      return initSections(style.sections);
      function fitToAvailableSpace() {
        const lastSectionBottom = Math.ceil(container.getBoundingClientRect().bottom);
        const delta = Math.floor((window.innerHeight - lastSectionBottom) / sections.length);
        delta > 1 && sections.forEach(s => {
          s.init || s.cm.setSize(null, s.cm.display.lastWrapHeight + delta);
        });
      }
      function genId() {
        return INC_ID++;
      }
      function getAssociatedEditor(nearbyElement) {
        for (let el = nearbyElement; el; el = el.parentElement) if (el.CodeMirror) return el.CodeMirror;
      }
      function nextPrevEditor(cm, direction, upDown) {
        cm = editor.default.getEditorSibling(cm, direction);
        editor.default.scrollToEditor(cm, upDown);
        cm.focus();
        return cm;
      }
      function getLastActivatedEditor() {
        let result;
        for (const s of liveSections) (!result || !s.init && s.cm.lastActive > result.lastActive) && (result = s.cm);
        return result;
      }
      function showMozillaFormatImport(text, newSections) {
        const popup = edit_util.showCodeMirrorPopup(util.t("styleFromMozillaFormatPrompt"), "", {
          readOnly: !!text
        });
        const cm = popup.codebox;
        popup._contents.append(dom.$create(".buttons", [ dom.$create("button", {
          title: "Ctrl-Shift-Enter:\n" + util.t("importReplaceTooltip"),
          onclick: () => doImport({
            replaceOldStyle: !0
          })
        }, util.t("importReplaceLabel")), dom.$create("button", {
          title: "Ctrl-Enter:\n" + util.t("importAppendTooltip"),
          onclick: doImport
        }, util.t("importAppendLabel")) ]));
        cm.focus();
        cm.on("changes", () => {
          popup.classList.toggle("ready", !cm.isBlank());
          cm.markClean();
        });
        if (text) {
          cm.setValue(text);
          cm.clearHistory();
          cm.markClean();
        }
        cm.options.extraKeys = {
          "Ctrl-Enter": doImport,
          "Shift-Ctrl-Enter": () => doImport({
            replaceOldStyle: !0
          })
        };
        async function doImport({replaceOldStyle = !1}) {
          lockPageUI(!0);
          try {
            const code = text || cm.getValue().trim();
            const meta = style_util.getMetaComment(code);
            if (!meta.match(/[\r\n]\s*@preprocessor\s+\S/) || await dom_util.messageBox.alert(util.t("importPreprocessor"))) {
              let name;
              newSections ||= await edit_util.worker.extractSections(code);
              if (!newSections.length) throw util.t("emptyStyle");
              if (meta && (replaceOldStyle || !style.id) && (name = meta.match(/[\r\n]\s*@name\s+(.+)|$/)[1].trim())) {
                dom_util.setInputValue(document.getElementById("name"), name);
                editor.default.updateName(!0);
              }
              await initSections(newSections, {
                replace: replaceOldStyle,
                focusOn: replaceOldStyle ? 0 : sections.length,
                keepDirty: !0
              });
              edit_util.helpPopup.close();
            }
          } catch (_) {
            _ && dom_util.messageBox.alert(dom.$create("pre", (e = _).message || `${e}`), "danger", util.t("styleFromMozillaFormatError"));
          }
          var e;
          lockPageUI(!1);
        }
        function lockPageUI(locked) {
          dom.$root.style.pointerEvents = locked ? "none" : "";
          if (popup.codebox === cm) {
            popup.classList.toggle("ready", !locked && !cm.isBlank());
            cm.options.readOnly = locked;
            cm.display.wrapper.style.opacity = locked ? ".5" : "";
          }
        }
      }
      function updateSectionOrder() {
        const oldOrder = sectionOrder;
        sectionOrder = liveSections.map(s => s.id).join(",");
        dirty.modify("sectionOrder", oldOrder, sectionOrder);
        container.dataset.sectionCount = liveSections.length;
        refreshReport();
        editor.default.updateToc();
      }
      function getModel() {
        return {
          ...style,
          sections: liveSections.map(s => s.getModel())
        };
      }
      function updateMeta() {
        document.getElementById("name").value = style.customName || style.name || "";
        document.getElementById("enabled").checked = style.enabled !== !1;
        document.getElementById("url").href = style.url || "";
        editor.default.updateName();
      }
      async function initSections(src, {focusOn = 0, replace = !1, keepDirty = !1, si = editor.scrollInfo} = {}) {
        if (replace) {
          for (const s of liveSections) s.toggle();
          liveSections.length = sections.length = 0;
          container.textContent = "";
        }
        if (si.cms && si.cms.length === src.length) {
          si.scrollY2 = si.scrollY + window.innerHeight;
          container.style.height = si.scrollY2 + "px";
          scrollTo(0, si.scrollY);
          focusOn = si.cms[0].focus && 0;
        } else si = null;
        let forceRefresh = !0;
        let y = 0;
        let tPrev;
        editor.default.loading = dirty.paused = !keepDirty;
        for (let i = 0, iSec = sections.length; i < src.length; i++, iSec++) {
          const now = performance.now();
          if (tPrev) {
            if (now - tPrev > 100) {
              tPrev = 0;
              forceRefresh = !1;
              await util.sleep0();
            }
          } else tPrev = now;
          si && (forceRefresh = y < si.scrollY2 && (y += si.cms[i].parentHeight) > si.scrollY);
          insertSectionAfter(src[i], null, forceRefresh, si && si.cms[i]);
          iSec === focusOn && setTimeout(editor.default.jumpToEditor, 0, iSec);
        }
        si && !si.cms.every(cm => !cm?.height) || requestAnimationFrame(fitToAvailableSpace);
        forceRefresh || updateSectionOrder();
        container.style.removeProperty("height");
        editor.default.loading = dirty.paused = !1;
      }
      function restoreSection(section) {
        section.elDel.remove();
        section.toggle(!0);
        updateSectionOrder();
        (0, live_preview.default)();
      }
      function insertSectionAfter(init, base, forceRefresh, si) {
        init || (init = {
          code: "",
          urlPrefixes: [ "https://example.com/" ]
        });
        forceRefresh ||= base;
        const section = new EditorSection(init, genId, si);
        const {code} = init;
        sections.splice(base ? sections.indexOf(base) + 1 : sections.length, 0, section);
        liveSections.splice(base ? liveSections.indexOf(base) + 1 : liveSections.length, 0, section);
        container.insertBefore(section.el, base ? base.el.nextSibling : null);
        if (forceRefresh) {
          section.fit = !(si && si.height || base && !code);
          refreshOnViewNow(section);
        } else xo.observe(section.el);
        if (base) {
          section.cm.focus();
          editor.default.scrollToEditor(section.cm);
        }
        if (forceRefresh) {
          updateSectionOrder();
          (0, live_preview.default)();
        }
      }
      function moveSection(dir, section) {
        let index = sections.indexOf(section);
        if (index !== (dir < 0 ? 0 : sections.length - 1)) {
          container.moveBefore(section.el, sections[index + (dir < 0 ? -1 : 2)]?.el);
          sections[index] = sections[index + dir];
          sections[index + dir] = section;
          index = liveSections.indexOf(section);
          liveSections[index] = liveSections[index + dir];
          liveSections[index + dir] = section;
          updateSectionOrder();
          editor.default.scrollToEditor(section.cm);
          section.cm.focus();
        }
      }
      async function refreshOnViewNow(section) {
        section.init && section.create(!0);
      }
    }
    var dom_error = oe(8421);
    function MozSectionFinder(cm) {
      const KEY = "MozSectionFinder";
      const rxDOC = /@-moz-document(?:\s+|(\s*)({)|$)/gi;
      const rxVOID = /\s*}/y;
      const rxFUNC = /([-a-z]+)\(/iy;
      const rxNEXT = /(\s*)(?:(.)\s*)?/y;
      const rxSPACE = /\s+/y;
      const rxTokDOC = /^(?!comment|string)/;
      const rxTokCOMMENT = /^comment(\s|$)/;
      const rxTokSTRING = /^string(\s|$)/;
      const {cmpPos} = src_cm.CodeMirror;
      const minPos = (a, b) => cmpPos(a, b) < 0 ? a : b;
      const maxPos = (a, b) => cmpPos(a, b) > 0 ? a : b;
      const keptAlive = new Map;
      const state = {
        listeners: new Set,
        sections: []
      };
      let updFrom;
      let updTo;
      let scheduled;
      const finder = {
        IGNORE_ORIGIN: KEY,
        EQ_SKIP_KEYS: [ "mark", "valueStart", "valueEnd", "sticky" ],
        sections: state.sections,
        keepAliveFor(id, ms) {
          let data = keptAlive.get(id);
          if (data) clearTimeout(data.timer); else {
            const NOP = () => 0;
            data = {
              fn: NOP
            };
            keptAlive.set(id, data);
            finder.on(NOP);
          }
          data.timer = setTimeout(() => keptAlive.delete(id), ms);
        },
        on(fn) {
          const {listeners} = state;
          const needsInit = !listeners.size;
          listeners.add(fn);
          if (needsInit) {
            cm.on("changes", onCmChanges);
            update();
          }
        },
        off(fn) {
          const {listeners, sections} = state;
          if (listeners.size) {
            listeners.delete(fn);
            if (!listeners.size) {
              cm.off("changes", onCmChanges);
              cm.operation(() => sections.forEach(sec => sec.mark.clear()));
              sections.length = 0;
            }
          }
        },
        onOff(fn, enable) {
          finder[enable ? "on" : "off"](fn);
        },
        updatePositions(section) {
          (section ? [ section ] : state.sections).forEach(setPositionFromMark);
        }
      };
      function onCmChanges(_, changes) {
        updFrom || (updFrom = {
          line: 1 / 0,
          ch: 0
        });
        updTo || (updTo = {
          line: -1,
          ch: 0
        });
        for (const c of changes) if (c.origin !== finder.IGNORE_ORIGIN) {
          updFrom = minPos(c.from, updFrom);
          updTo = maxPos(src_cm.CodeMirror.changeEnd(c), updTo);
        }
        updTo.line >= 0 && !scheduled && (scheduled = requestAnimationFrame(update));
      }
      function update() {
        const {sections, listeners} = state;
        let from = updFrom ? {
          line: updFrom.line,
          ch: updFrom.ch
        } : {
          line: 0,
          ch: 0
        };
        let to = updTo ? {
          line: updTo.line,
          ch: updTo.ch
        } : {
          line: cm.doc.size,
          ch: 0
        };
        let cutAt = -1;
        let cutTo = -1;
        scheduled = updFrom = updTo = null;
        for (let i = 0; i < sections.length; i++) {
          const sec = sections[i];
          if (cmpPos(sec.end, from) >= 0) {
            if (cutAt < 0) {
              cutAt = i;
              from = minPos(from, sec.start);
            }
            if (setPositionFromMark(sec)) {
              if (cmpPos(sec.start, to) > 0) {
                cutTo = i;
                break;
              }
              to = maxPos(sec.end, to);
            }
          }
        }
        if (cutAt < 0) {
          from.ch = Math.max(0, from.ch - 14);
          cutAt = sections.length;
        }
        if (cutTo < 0) {
          to.ch += 14;
          cutTo = sections.length;
        }
        let op;
        let reusedAtStart = 0;
        let reusedAtEnd = 0;
        const added = findSections(from, to);
        const removed = sections.slice(cutAt, cutTo);
        for (const sec of added) {
          const i = removed.findIndex(isSameSection, sec);
          if (i >= 0) {
            const r = removed[i];
            r.funcs = sec.funcs;
            sec.mark = r.mark;
            removed[i] = null;
            reusedAtEnd++;
            op || reusedAtStart++;
          } else {
            op || (op = cm.curOp || (cm.startOperation(), !0));
            sec.mark = cm.markText(sec.start, sec.end, {
              clearWhenEmpty: !1,
              inclusiveRight: !0,
              [KEY]: sec
            });
            reusedAtEnd = 0;
          }
        }
        added.length -= reusedAtEnd;
        cutTo -= reusedAtEnd;
        if (reusedAtStart) {
          cutAt += reusedAtStart;
          added.splice(0, reusedAtStart);
        }
        for (const sec of removed) if (sec) {
          op || (op = cm.curOp || (cm.startOperation(), !0));
          sec.mark.clear();
        }
        if (op) {
          sections.splice(cutAt, cutTo - cutAt, ...added);
          for (const fn of listeners) fn.call(cm, added, removed, cutAt, cutTo);
        }
        op === !0 && cm.endOperation();
      }
      function findSections(from, to) {
        const found = [];
        let line = from.line - 1;
        let goal = "";
        let section, func, funcPos, url;
        let funcs;
        cm.eachLine(from.line, cm.doc.size, handle => {
          ++line;
          const {text} = handle;
          const len = text.length;
          if (!len) return;
          let ch = line === from.line ? from.ch : 0;
          for (;;) {
            let m, nullSection;
            if (!goal) {
              if ((line - to.line || ch - to.ch) >= 0) return !0;
              if ((ch = text.indexOf("@-", ch)) < 0 || !(rxDOC.lastIndex = ch, m = rxDOC.exec(text))) return;
              ch = m.index + m[0].length;
              section = {
                funcs: funcs = [],
                start: {
                  line,
                  ch: m.index
                },
                end: null,
                mark: null,
                tocEntry: {
                  label: "",
                  target: null,
                  numTargets: 0
                }
              };
              if (!rxTokDOC.test(cm.getTokenTypeAt(section.start))) continue;
              found.push(section);
              if (m[2]) {
                nullSection = !m[1];
                goal = "";
              } else goal = "_func";
            }
            handle.styles || cm.getTokenTypeAt({
              line,
              ch: 0
            });
            const {styles} = handle;
            let j = 1;
            if (ch) {
              j += styles.length * ch / len & -2;
              for (;styles[j - 2] >= ch; ) j -= 2;
              for (;styles[j] <= ch; ) j += 2;
            }
            let type, chPrev;
            for (;goal && j < styles.length; (type || ch >= styles[j] || ch === chPrev) && (j += 2), 
            chPrev = ch) {
              let s;
              type = styles[j + 1];
              type && type.startsWith("overlay ") && (type = "");
              if (goal.startsWith("_")) {
                if (!type && (rxSPACE.lastIndex = ch, rxSPACE.test(text))) {
                  ch = rxSPACE.lastIndex;
                  if (ch === styles[j]) continue;
                }
                const isCmt = type && rxTokCOMMENT.test(type);
                if (goal === "_cmt") {
                  const cmt = isCmt && edit_util.trimCommentLabel(text.slice(ch, ch = styles[j]));
                  cmt && (section.tocEntry.label = cmt);
                  (!isCmt && type || cmt) && (goal = "");
                  continue;
                }
                if (isCmt) {
                  ch = styles[j];
                  continue;
                }
                goal = goal.slice(1);
                if (!type && goal.length > 1) continue;
              }
              if (goal === "func") {
                if (!type || !(rxFUNC.lastIndex = ch, m = rxFUNC.exec(text))) {
                  goal = "error";
                  break;
                }
                func = m[1];
                funcPos = {
                  line,
                  ch
                };
                ch += func.length + 1;
                url = !1;
                goal = "_str";
                for (;styles[j + 2] <= ch; ) j += 2;
              }
              if (goal === "str") {
                if (!url) {
                  s = (s = text[ch]) === '"' || s === "'" ? s : "";
                  url = {
                    chunks: [],
                    start: {
                      line,
                      ch: ch += !!s
                    },
                    end: null,
                    quote: s
                  };
                }
                if (rxTokSTRING.test(type)) {
                  let end = styles[j];
                  if (end > ch) {
                    if (text[end - 1] === url.quote && text[end - 2] !== "\\") {
                      end--;
                      goal = "_)";
                    }
                    url.chunks.push(text.slice(ch, end));
                    url.end = {
                      line,
                      ch: end
                    };
                  }
                  ch = styles[j];
                } else {
                  if (type) {
                    goal = "error";
                    break;
                  }
                  goal = text[ch] === ")" ? (j += 2, ")") : "_)";
                  url.end = {
                    line,
                    ch
                  };
                }
              }
              if (goal === ")") {
                if (text[ch] !== ")") {
                  goal = "error";
                  break;
                }
                ch++;
                s = url ? url.chunks.join("") : "";
                funcs.length || (section.tocEntry.target = s);
                section.tocEntry.numTargets++;
                funcs.push({
                  type: func,
                  value: s,
                  isQuoted: url.quote,
                  start: funcPos,
                  end: {
                    line,
                    ch
                  },
                  valueStart: url.start,
                  valueEnd: url.end
                });
                rxNEXT.lastIndex = ch;
                s = text.match(rxNEXT);
                goal = s[2];
                goal = goal === "," ? "_func" : goal === "{" ? "_cmt" : goal ? "" : ",";
                if (!goal) {
                  goal = "error";
                  break;
                }
                ch += s[0].length;
                if (s[2] === "{" && (rxVOID.lastIndex = ch, rxVOID.test(text))) {
                  goal = "";
                  break;
                }
              }
              goal === "," && (goal = text[ch] === "," ? "_func" : "");
            }
            section.end = {
              line,
              ch: styles[j + 2] || len
            };
            goal === "error" && (goal = "");
            if (goal) return;
            funcs.length || (funcs[0] = {
              type: "",
              value: nullSection ? " " : "",
              start: {
                line,
                ch: section.end.ch - 1
              }
            });
          }
        });
        return found;
      }
      function setPositionFromMark(obj) {
        const pos = obj.mark.find();
        obj.start = pos && pos.from;
        obj.end = pos && pos.to;
        return pos;
      }
      function isSameSection(old) {
        return old && old.start && old.tocEntry.label === this.tocEntry.label && !cmpPos(old.start, this.start) && !cmpPos(old.end, this.end) && old.funcs.length === this.funcs.length && old.funcs.every(isSameFunc, this.funcs);
      }
      function isSameFunc(func, i) {
        return util.deepEqual(func, this[i], finder.EQ_SKIP_KEYS);
      }
      return finder;
    }
    var color_mimicry = oe(8872);
    function MozSectionWidget(cm, finder = MozSectionFinder(cm)) {
      let EVENTS, CLICK_ROUTE;
      const KEY = "MozSectionWidget";
      const C_LABEL = "label";
      const getFuncsFor = el => el.closest(C_LIST)[KEY];
      const getSectionFor = el => el.closest(C_CONTAINER)[KEY];
      const {cmpPos} = src_cm.CodeMirror;
      let enabled = !1;
      let funcHeight = 0;
      let actualStyle;
      return {
        toggle(enable) {
          Boolean(enable) !== enabled && (enable ? init : destroy)();
        }
      };
      function init() {
        enabled = !0;
        tplAppliesToItem.$(C_TYPE).title = util.t("appliesHelp");
        CLICK_ROUTE = {
          ".remove-applies-to"(elItem, func) {
            const funcs = getFuncsFor(elItem);
            if (funcs.length < 2) {
              dom_util.messageBox.alert(util.t("appliesRemoveError"));
              return;
            }
            const i = funcs.indexOf(func);
            const next = funcs[i + 1];
            const from = i ? funcs[i - 1].item.find(1) : func.item.find(-1);
            const to = next ? next.item.find(-1) : func.item.find(1);
            cm.replaceRange(i && next ? ", " : "", from, to);
          },
          async ".add-applies-to"(elItem, func) {
            const pos = func.item.find(1);
            const type = func.str.type;
            const elList = !type && elItem.parentElement;
            cm.replaceRange(type ? `, ${type}("")` : func.str.value + 'domain("") ', pos, pos);
            await util.sleep0();
            (elList || elItem.nextElementSibling).$("input").focus();
          }
        };
        EVENTS = {
          onchange({target: el}) {
            EVENTS.oninput({
              target: el.closest(C_TYPE) || el
            });
          },
          oninput({target: el}) {
            const part = el.matches(C_VALUE) ? "value" : el.matches(C_TYPE) && "type";
            if (!part) return;
            const elItem = el.closest(C_ITEM);
            const func = elItem[KEY];
            const pos = func[part].find();
            const {value} = el;
            if (value !== func.str[part]) {
              func.str[part] = value;
              if (part === "type") {
                func.item[KEY].dataset.type = value;
                editor.default.toggleRegexp(func.value[KEY], value);
              } else if (func === getFuncsFor(el)[0]) {
                const sec = getSectionFor(el);
                sec.tocEntry.target = value;
                sec.tocEntry.label || editor.default.updateToc([ sec ]);
              }
              cm.replaceRange(fromDoubleslash(value).replace(/\\/g, "\\\\"), pos.from, pos.to, finder.IGNORE_ORIGIN);
              prefs.__values["manage.newUI.favicons"] && iconize(elItem, !0);
            }
          },
          onclick(event) {
            const {target} = event;
            for (const selector in CLICK_ROUTE) {
              const routed = target.closest(selector);
              if (routed) {
                const elItem = routed.closest(C_ITEM);
                CLICK_ROUTE[selector](elItem, elItem[KEY], event);
                return;
              }
            }
          }
        };
        actualStyle = document.createElement("style");
        cm.on("optionChange", onCmOption);
        msg.onMessage.set(onRuntimeMessage);
        finder.sections.length && update(finder.sections, []);
        finder.on(update);
        updateWidgetStyle();
        cm.display.wrapper.style.setProperty("--cm-bar-width", cm.display.barWidth + "px");
        prefs.subscribe("manage.newUI.favicons", onFaviconsEnabled);
      }
      function destroy() {
        enabled = !1;
        cm.off("optionChange", onCmOption);
        msg.onMessage.delete(onRuntimeMessage);
        actualStyle.remove();
        actualStyle = null;
        cm.operation(() => finder.sections.forEach(killWidget));
        finder.off(update);
        prefs.unsubscribe("manage.newUI.favicons", onFaviconsEnabled);
      }
      function onCmOption(_, option) {
        option === "theme" && updateWidgetStyle();
      }
      function onFaviconsEnabled(key, val) {
        val && iconize(cm.display.wrapper);
      }
      function onRuntimeMessage(m) {
        (m.reason !== "editPreview" || document.getElementById(`stylus-${m.style.id}`)) && (m.style || m.styles || m.prefs && "disableAll" in m.prefs || m.method === "colorScheme" || m.method === "styleDeleted") && requestAnimationFrame(updateWidgetStyle);
      }
      function updateWidgetStyle() {
        funcHeight = 0;
        const color = {
          wrapper: (0, color_mimicry.default)(cm.display.wrapper, {
            bg: "backgroundColor",
            fore: "color"
          }),
          gutter: (0, color_mimicry.default)(cm.display.gutters, {
            bg: "backgroundColor",
            border: "borderRightColor"
          }),
          line: (0, color_mimicry.default)(".CodeMirror-linenumber", null, cm.display.lineDiv),
          comment: (0, color_mimicry.default)("span.cm-comment", null, cm.display.lineDiv)
        };
        const hasBorder = color.gutter.style.borderRightWidth !== "0px" && !/transparent|\b0\)/g.test(color.gutter.style.borderRightColor);
        const _ = Math.abs(color.gutter.bgLuma - color.wrapper.foreLuma), ee = Math.abs(color.gutter.bgLuma - color.line.foreLuma);
        const fore = ee > _ || ee > .4 ? color.line.fore : color.wrapper.fore;
        const border = fore.replace(/[\d.]+(?=\))/, .2);
        const borderStyleForced = `1px ${hasBorder ? color.gutter.style.borderRightStyle : "solid"} ${border}`;
        actualStyle.textContent = `\n      ${C_CONTAINER} {\n        background-color: ${color.gutter.bg};\n        border-top: ${borderStyleForced};\n        border-bottom: ${borderStyleForced};\n      }\n      ${C_CONTAINER} ${C_LABEL} {\n        color: ${fore};\n      }\n      ${C_CONTAINER} input,\n      ${C_CONTAINER} select {\n        background: ${color.wrapper.bg};\n        border: ${borderStyleForced};\n        transition: none;\n        color: ${fore};\n      }\n      ${C_CONTAINER} .select-wrapper::after {\n        color: ${fore};\n        transition: none;\n      }\n    `;
        dom.$root.appendChild(actualStyle);
      }
      function update(added, removed, cutAt = finder.sections.indexOf(added[0])) {
        const {curOp} = cm;
        const {isDelayed} = added;
        const toDelay = [];
        const t0 = performance.now();
        const elemsToIconize = prefs.__values["manage.newUI.favicons"] && [];
        let viewTo = editor.default.viewTo || cm.display.viewTo;
        curOp || cm.startOperation();
        for (const sec of added) {
          const i = removed.findIndex(isReusableWidget, sec);
          const old = removed[i];
          if (isDelayed || old || sec.start.line < viewTo) {
            const el = renderWidget(sec, old);
            elemsToIconize && sec.funcs.length && elemsToIconize.push(el);
            viewTo -= (sec.funcs.length || 1) * 1.25;
            old && (removed[i] = null);
            if (performance.now() - t0 > 50) {
              toDelay.push(...added.slice(added.indexOf(sec) + 1));
              break;
            }
          } else toDelay.push(sec);
        }
        for (let sec, i = Math.max(0, cutAt), {sections} = finder; i < sections.length; i++) if (!toDelay.includes(sec = sections[i])) {
          const data = sec.widget.node.$(C_LABEL).dataset;
          const di = `${i + 1}`;
          data.index !== di && (data.index = di);
        }
        if (toDelay.length) {
          toDelay.isDelayed = !0;
          setTimeout(update, 0, toDelay, removed);
        } else removed.forEach(killWidget);
        curOp || cm.endOperation();
        elemsToIconize.length && iconize(elemsToIconize);
      }
      function isReusableWidget(r) {
        return r && r.widget && r.widget.line.parent && r.start && !cmpPos(r.start, this.start);
      }
      function renderWidget(sec, old) {
        let widget = old && old.widget;
        const height = Math.round(funcHeight * (sec.funcs.length || 1)) || void 0;
        const node = renderContainer(sec, widget);
        if (widget && widget.line.lineNo() === sec.start.line) {
          widget.node = node;
          if (height && height !== widget.height) {
            widget.height = height;
            widget.changed();
          }
        } else {
          widget && widget.clear();
          widget = cm.addLineWidget(sec.start.line, node, {
            coverGutter: !0,
            noHScroll: !0,
            above: !0,
            height
          });
          widget.on("redraw", () => {
            const value = cm.display.barWidth + "px";
            if (widget[KEY] !== value) {
              widget[KEY] = value;
              node.style.setProperty("--cm-bar-width", value);
            }
          });
        }
        funcHeight || (funcHeight = node.offsetHeight / (sec.funcs.length || 1));
        setProp(sec, "widget", widget);
        return node;
      }
      function renderContainer(sec, oldWidget) {
        const container = oldWidget ? oldWidget.node : tplAppliesTo.cloneNode(!0);
        const elList = container.$(C_LIST);
        const {funcs} = sec;
        const oldItems = elList[KEY] || !1;
        const items = funcs.map((f, i) => renderFunc(f, oldItems[i]));
        let slot = elList.firstChild;
        for (const {item} of items) {
          const el = item[KEY];
          if (el !== slot) {
            elList.insertBefore(el, slot);
            slot && slot.remove();
            slot = el;
          }
          slot = slot.nextSibling;
        }
        for (let i = funcs.length; oldItems && i < oldItems.length; i++) {
          killFunc(oldItems[i]);
          if (slot) {
            const el = slot.nextSibling;
            slot.remove();
            slot = el;
          }
        }
        setProp(sec, "widgetFuncs", items);
        elList[KEY] = items;
        container[KEY] = sec;
        container.classList.toggle("error", !sec.funcs.length);
        return Object.assign(container, EVENTS);
      }
      function renderFunc(func, old = {}) {
        const {start} = func;
        const {line} = start;
        const {type, value, isQuoted = !1, typeEnd = type ? {
          line,
          ch: start.ch + type.length
        } : start, valuePos = type ? {
          line,
          ch: typeEnd.ch + 1 + Boolean(isQuoted)
        } : start, valueEnd = type ? {
          line,
          ch: valuePos.ch + value.length
        } : start, end = type ? {
          line,
          ch: valueEnd.ch + Boolean(isQuoted) + 1
        } : start} = func;
        const el = old.item?.[KEY] || tplAppliesToItem.cloneNode(!0);
        const elVal = el.$(C_VALUE);
        const elType = el.$(C_TYPE);
        const res = el[KEY] = {
          str: {
            type,
            value
          },
          item: markFuncPart(start, end, old.item, el),
          type: markFuncPart(start, typeEnd, old.type, elType, type, toLowerCase),
          value: markFuncPart(valuePos, valueEnd, old.value, elVal, value, fromDoubleslash)
        };
        if (el.dataset.type !== type) {
          dom.$toggleDataset(el, "type", type);
          type && !elType.disabled || (elType.disabled = !type);
          elVal.focus = focusRegexp;
          editor.default.toggleRegexp(elVal, type);
        }
        return res;
      }
      function markFuncPart(start, end, marker, el, text, textTransform) {
        if (marker) {
          const pos = marker.find();
          if (!pos || cmpPos(pos.from, start) || cmpPos(pos.to, end) || text != null && text !== cm.getRange(start, end)) {
            marker.clear();
            marker = null;
          }
        }
        marker || (marker = cm.markText(start, end, {
          clearWhenEmpty: !1,
          inclusiveLeft: !0,
          inclusiveRight: !0,
          [KEY]: el
        }));
        if (text != null) {
          text = textTransform(text);
          el.value !== text && (el.value = text);
        }
        return marker;
      }
      function killWidget(sec) {
        const w = sec && sec.widget;
        if (w) {
          w.clear();
          w.node[KEY].widgetFuncs.forEach(killFunc);
        }
      }
      function killFunc(f) {
        editor.default.toggleRegexp(f.value[KEY]);
        f.item.clear();
        f.type.clear();
        f.value.clear();
      }
      function focusRegexp() {
        cm.display.lineDiv.contains(this) || cm.jumpToPos(getSectionFor(this).start);
        Object.getPrototypeOf(this).focus.apply(this, arguments);
      }
      function fromDoubleslash(s) {
        return /([^\\]|^)\\([^\\]|$)/.test(s) ? s : s.replace(/\\\\/g, "\\");
      }
      function toLowerCase(s) {
        return s.toLowerCase();
      }
      function setProp(obj, name, value) {
        return Object.defineProperty(obj, name, {
          value,
          configurable: !0
        });
      }
    }
    let pendingMeta;
    let cm;
    let onUpdated;
    let prevRes = [];
    let meta, iFrom, lineTo, chTo;
    const isAfterMeta = ({from, removed}) => (from.line - lineTo - removed.length + 1 || from.ch - chTo) >= 0;
    const initMetaCompiler = (codemirror, cb) => {
      cm = codemirror;
      onUpdated = cb;
      return metaCompiler;
    };
    const metaCompiler = async (text, linterOptions, linterCM, force) => {
      if (!force && (pendingMeta || (linterCM ? linterCM !== cm : meta && text.every(isAfterMeta)))) return;
      let iFromNew = 0;
      let ok, done;
      if (linterCM || force) {
        if (text = style_util.getMetaComment(text, "match")) {
          iFromNew = text.index;
          text = text[0];
        }
      } else {
        let m;
        let line = -1;
        text = "";
        cm.eachLine(({text: str}) => {
          ++line;
          text += str + "\n";
          return str.includes("*/") && (m = style_util.getMetaComment(text, "match"));
        });
        text = m && m[0];
        lineTo = m && line;
        chTo = m && text.length + (iFromNew = m.index);
      }
      if (!text) return [];
      if (text !== meta || force) {
        pendingMeta = new Promise(cb => done = cb);
        const {metadata, errors} = await edit_util.worker.metalint(text);
        pendingMeta = null;
        if (force) return metadata;
        ok = !0;
        meta = text;
        prevRes = errors;
        for (let i = 0; i < errors.length; i++) {
          const {code, index, args, message} = errors[i];
          const isUnknownMeta = code === "unknownMeta" || (ok = !1);
          const typo = isUnknownMeta && args[1] ? "Typo" : "";
          const offset = (index || 0) + iFromNew;
          const pos = cm.posFromIndex(offset);
          errors[i] = {
            i: offset,
            from: pos,
            to: pos,
            message: code && util.t(`meta_${code}${typo}`, args, !1) || message,
            severity: isUnknownMeta ? "warning" : "error",
            rule: code
          };
        }
        done(errors);
        ok && onUpdated(metadata);
      } else {
        if (force) return;
        if (iFromNew !== iFrom) for (const r of prevRes) {
          r.from = r.to = cm.posFromIndex(r.i - iFrom + iFromNew);
          r.i = iFromNew;
        }
      }
      iFrom = iFromNew;
      ({line: lineTo, ch: chTo} = cm.posFromIndex(iFromNew + text.length));
      return prevRes;
    };
    function SourceEditor() {
      const style = editor.default.style;
      const dirty = editor.default.dirty;
      let savedGeneration;
      let prevMode = NaN;
      let prevSel;
      let saving;
      let updateTocFocusPending;
      document.getElementById("save-button").on("split-btn", async () => {
        const res = await dom_util.messageBox.alert(util.t("usercssReplaceTemplateConfirmation"), {
          buttons: [ util.t("confirmYes"), util.t("confirmNo"), {
            textContent: util.t("genericResetLabel"),
            title: util.t("restoreTemplate")
          } ]
        });
        if (res.enter || res.button !== 1) {
          const key = chrome_sync.LZ_KEY.usercssTemplate;
          const code = res.button === 2 ? DEFAULT_TEMPLATE : cm.getValue();
          await chrome_sync.setLZValue(key, code);
          await chrome_sync.getLZValue(key) !== code && dom_util.messageBox.alert(util.t("syncStorageErrorSaving"));
        }
      });
      const cmpPos = src_cm.CodeMirror.cmpPos;
      const [DEFAULT_TEMPLATE, TEMPLATE, TEMPLATE_DATA] = editor.default.template;
      const initialCode = style.id ? style.sourceCode : (code => {
        const comment = `/* ${util.t("usercssReplaceTemplateSectionBody")} */`;
        const sec0 = style.sections[0];
        sec0.code = " ".repeat(prefs.__values["editor.tabSize"]) + comment;
        Object.keys(sec0).length === 1 && (sec0.domains = [ "example.com" ]);
        return style.sourceCode = code.replace(/(@name)(?:([\t\x20]+).*|\n)/, (_, k, space) => `${k}${space || " "}${style.name}`).replace(/\s*@-moz-document[^{]*{([^}]*)}\s*$/g, (s, body) => body.trim() === comment ? "\n\n" : s).trim() + "\n\n" + style_util.styleToCss(style);
      })(TEMPLATE || DEFAULT_TEMPLATE);
      const cm = codemirror_factory.default.create(document.querySelector("#sections").appendChild(dom.$create(".single-editor")), {
        mode: style_util.getPreprocessorMode(style.usercssData ||= TEMPLATE_DATA),
        value: initialCode
      }, me => {
        const si = editor.default.applyScrollInfo(me) || {};
        editor.default.viewTo = si.viewTo;
        Object.assign(me.curOp, si.scroll);
        editor.default.viewTo = 0;
      });
      const getStyleValue = asObject => asObject ? {
        ...style,
        sourceCode: typeof asObject == "string" ? asObject : cm.getValue(),
        sections: void 0,
        usercssData: void 0
      } : cm.getValue();
      const kToc = "editor.toc.expanded";
      const kWidget = "editor.appliesToLineWidget";
      const sectionFinder = MozSectionFinder(cm);
      const sectionWidget = MozSectionWidget(cm, sectionFinder);
      const mozSections = editor.default.sections = sectionFinder.sections;
      const pvErr = document.getElementById("preview-error");
      prevSel = cm.doc.sel;
      live_preview.default._then = showLog;
      live_preview.default._catch = showError;
      prefs.subscribe([ kToc, kWidget ], (k, val) => {
        sectionFinder.onOff(updateToc, prefs.__values[kToc] || prefs.__values[kWidget]);
        mozSections.length || editor.default.updateToc([]);
        k === kWidget && sectionWidget.toggle(val);
        k === kToc && cm[val ? "on" : "off"]("cursorActivity", onCursorActivity);
      }, !0);
      initMetaCompiler(cm, meta => {
        const {vars} = meta;
        vars && util.reuseStyleVars(vars, style);
        style.usercssData = meta;
        style.name = meta.name;
        style.url = meta.homepageURL || style.installationUrl;
        updateMeta();
      });
      updateMeta(!0);
      linters.add(metaCompiler);
      onLinterPref.add(updateLinterSwitch);
      Object.assign(editor.default, {
        cm,
        replaceStyle,
        updateMeta,
        closestVisible: () => cm,
        getEditors: () => [ cm ],
        getEditorTitle: () => "",
        getValue: getStyleValue,
        getSearchableInputs: () => [],
        isSame: styleObj => styleObj.sourceCode === cm.getValue(),
        prevEditor: nextPrevSection.bind(null, -1),
        nextEditor: nextPrevSection.bind(null, 1),
        jumpToEditor(i) {
          const sec = sectionFinder.sections[i];
          if (sec) {
            sectionFinder.updatePositions(sec);
            cm.jumpToPos(sec.start);
            cm.focus();
          }
        },
        async saveImpl() {
          pendingMeta && await pendingMeta;
          let savedStyle;
          saving = !0;
          try {
            if (!style.id && await msg_api.API.usercss.find({
              id: style.id,
              usercssData: util.makeUserCssFindFilter(style.usercssData)
            })) dom_util.messageBox.alert(util.t("usercssAvoidOverwriting"), "danger", util.t("genericError")); else {
              const res = await msg_api.API.usercss.editSave(getStyleValue(!0), editor.default.msg);
              const badRe = (savedStyle = res.style).sections.flatMap(sec => sec.regexps || []).map((r, _) => (_ = editor.failRegexp(r)) && `${_}: ${r}`).filter(Boolean).join("\n\n");
              badRe && dom_util.messageBox.alert(badRe, "danger pre", util.t("styleBadRegexp"));
              showLog(res.logs);
              await replaceStyle(savedStyle);
            }
            dom_error.elError?.remove();
          } catch (_) {
            showError(_);
          }
          saving = !1;
        },
        scrollToEditor: util.NOP
      });
      savedGeneration = cm.changeGeneration();
      cm.on("changes", (_, changes) => {
        dirty.modify("sourceGeneration", savedGeneration, cm.changeGeneration());
        (0, live_preview.default)();
        metaCompiler(changes).then(!linterOn && spoofLinter);
      });
      src_cm.CodeMirror.commands.foldAll = cm2 => {
        const {curOp} = cm2;
        curOp || cm2.startOperation();
        let line = 0;
        cm.eachLine(lh => {
          /@-moz-document/i.test(lh.text) || cm.foldCode({
            line,
            ch: 0
          }, {
            scanUp: !1
          }, "fold");
          line++;
        });
        curOp || cm2.endOperation();
      };
      setTimeout(enableForEditor, 0, cm, initialCode, !0);
      dom.$isTextInput() || cm.focus();
      function showLog([log, warn]) {
        pvErr.hidden = !0;
        if (log) for (const v of log) console.log(v);
        if (warn) for (const v of warn) console.warn(v);
      }
      function updateLinterSwitch() {
        const select = document.querySelector('[id="editor.linter"]');
        const option = select.$('[value="csslint"]');
        const fancyCss = prevMode !== "css";
        const ovr = fancyCss && "stylelint";
        option.disabled = fancyCss;
        option.title = fancyCss ? util.t("linterCSSLintIncompatible", fancyCss) : "";
        select.value = ovr || curLinter;
        ovr && (curLinter = ovr);
      }
      function updateMeta(init) {
        document.getElementById("name").value = style.customName || style.name;
        document.getElementById("enabled").checked = style.enabled;
        document.getElementById("url").href = style.url;
        editor.default.updateName();
        const mode = cm.setPreprocessor(style.usercssData);
        if (mode !== prevMode) {
          prevMode = mode;
          if (!init) {
            updateLinterSwitch();
            run();
          }
        }
      }
      async function replaceStyle(newStyle, draft) {
        dirty.clear("name");
        const code = newStyle.sourceCode;
        const sameCode = editor.default.isSame(newStyle);
        if (sameCode) {
          savedGeneration = cm.changeGeneration();
          editor.default.useSavedStyle(newStyle);
          dirty.clear("sourceGeneration");
          dirty.clear("enabled");
          return (0, live_preview.default)(code);
        }
        if (draft || await dom_util.messageBox.confirm(util.t("styleUpdateDiscardChanges"))) {
          newStyle.usercssData ||= await metaCompiler(code, {}, cm, !0);
          editor.default.useSavedStyle(newStyle);
          if (!sameCode) {
            const si0 = draft && draft.si.cms[0];
            const cursor = !si0 && cm.getCursor();
            cm.setValue(style.sourceCode);
            si0 ? editor.default.applyScrollInfo(cm, si0) : cm.setCursor(cursor);
            savedGeneration = cm.changeGeneration();
          }
          draft || dirty.clear();
          sameCode && await (0, live_preview.default)(code);
        }
      }
      function showError(err) {
        const pp = style.usercssData.preprocessor;
        let pos, line, ch;
        typeof err == "string" && (err = pos = new Error(err));
        pos ||= (err.line ??= err.lineno) && (err.col ??= err.column) ? {
          line: line = err.line - 1,
          ch: ch = err.col - 1
        } : err.index ?? err.offset;
        let str = err.message || `${err}`;
        if (pos >= 0) ({line, ch} = pos = cm.posFromIndex(pos)); else if (!pos && pp === "stylus" && (pos = str.match(/^\w+:(\d+):(\d+)(?:\n.+)+\s+(.+)/))) {
          str = pos[3];
          line = pos[1] - 1;
          ch = pos[2] - 1;
        }
        if (!pos || saving) {
          err.stack = "";
          (0, dom_error.default)(err);
        }
        if (!pos) return;
        pvErr.title = str;
        const url = editor.default.ppDemo[pp];
        pvErr[(url ? "set" : "remove") + "Attribute"]("href", url);
        pvErr.hidden = !1;
        linterOn || spoofLinter([ {
          message: str.replace(/^\d+:\d+\s*/, ""),
          from: pos,
          to: {
            line,
            ch: ch + 1
          },
          severity: "error"
        } ]);
      }
      function spoofLinter(annos) {
        const {options} = cm.state.lint;
        const fnKey = "getAnnotations";
        const fn = options[fnKey];
        const inOp = cm.curOp || cm.startOperation();
        options[fnKey] = () => annos;
        cm.getValue = util.NOP;
        cm.performLint();
        options[fnKey] = fn;
        delete cm.getValue;
        inOp || cm.endOperation();
      }
      function nextPrevSection(dir) {
        sectionFinder.keepAliveFor(nextPrevSection, 1e4);
        sectionFinder.updatePositions();
        const num = mozSections.length;
        if (!num) return;
        dir = dir < 0 ? -1 : 0;
        const pos = cm.getCursor();
        let i = mozSections.findIndex(sec => src_cm.CodeMirror.cmpPos(sec.start, pos) > Math.min(dir, 0));
        i < 0 && (!dir || src_cm.CodeMirror.cmpPos(mozSections[num - 1].start, pos) < 0) && (i = 0);
        cm.jumpToPos(mozSections[(i + dir + num) % num].start);
      }
      function onCursorActivity() {
        if (prevSel !== cm.doc.sel) {
          prevSel = cm.doc.sel;
          updateTocFocusPending ??= Promise.resolve().then(updateTocFocus);
        }
      }
      function updateToc(...args) {
        editor.default.updateToc(...args);
        updateTocFocus();
      }
      function updateTocFocus() {
        updateTocFocusPending = null;
        const pos = prevSel.ranges[0].head;
        const toc = editor.default.toc;
        let end = mozSections.length;
        let a = 0;
        let b = end--;
        let c = pos.line && Math.min(toc.i ?? a + b >> 1, end);
        let c0, sec;
        for (;a < b && c0 !== c; ) {
          sec = mozSections[c];
          if (cmpPos(sec.start, pos) > 0) b = c; else {
            if (!(c < end && cmpPos(mozSections[c + 1].start, pos) <= 0)) return c !== toc.i && editor.default.updateToc({
              focus: !0,
              0: sec
            });
            a = c;
          }
          c0 = c;
          c = a + b >> 1;
        }
        toc.el.$("." + toc.cls)?.classList.remove(toc.cls);
        toc.i = null;
      }
    }
    oe(5483);
    const {defaults} = src_cm.CodeMirror;
    const ECP = "editor.colorpicker.";
    const kColor = "color";
    const kMaxHeight = "maxHeight";
    edit_util.HOTKEYS[ECP + "hotkey"] = "colorpicker";
    src_cm.CodeMirror.commands.colorpicker = cm => cm.state.colorpicker?.openPopup();
    prefs.subscribe(ECP.slice(0, -1), (id, enabled) => {
      defaults.colorpicker = enabled && {
        tooltip: util.t("colorpickerTooltip"),
        popup: {
          tooltipForSwitcher: util.t("colorpickerSwitchFormatTooltip"),
          paletteLine: util.t("numberedLine"),
          paletteHint: util.t("colorpickerPaletteHint"),
          get hexUppercase() {
            return prefs.__values[ECP + "hexUppercase"];
          },
          set hexUppercase(val) {
            prefs.set(ECP + "hexUppercase", val);
          },
          embedderCallback(state) {
            state[kColor] !== prefs.__values[ECP + kColor] && prefs.set(ECP + kColor, state[kColor]);
          },
          get [kMaxHeight]() {
            return prefs.__values[ECP + kMaxHeight];
          },
          set [kMaxHeight](h) {
            prefs.set(ECP + kMaxHeight, h);
          },
          get defaultColor() {
            return prefs.__values[ECP + kColor];
          }
        }
      };
      codemirror_factory.default.globalSetOption("colorpicker", defaults.colorpicker);
    }, !0);
    var urls = oe(8982);
    function USWIntegration() {
      const ERROR_TITLE = "UserStyles.world " + util.t("genericError");
      const META_KEYS = [ "name", "description", "license", "username>author", "homepage", "namespace" ];
      const elProgress = document.getElementById("usw-progress");
      const UI = document.getElementById("publish");
      const btnPublish = document.getElementById("usw-publish-style");
      const style = editor.default.style;
      let spinner;
      let spinnerTimer = 0;
      let prevCode = "";
      msg.onMessage.set(request => {
        if (request.method === "uswData" && request.style.id === style.id) {
          Object.assign(style, request.style);
          for (const el of document.querySelectorAll("#usw-data input")) editor.default.dirty.clear(el.id);
          updateUI();
        }
      });
      updateUI();
      btnPublish.onclick = document.getElementById("usw-disconnect").onclick = async function() {
        this.disabled = !0;
        timerOn();
        await (this === btnPublish ? publishStyle : disconnect)().catch(console.error);
        timerOff();
        this.disabled = !1;
      };
      async function publishStyle() {
        const {id, _usw: _} = style;
        if (await msg_api.API.data.has("usw" + id) && !await dom_util.messageBox.confirm(util.t("publishRetry"), "danger", ERROR_TITLE)) return;
        let error;
        const code = editor.default.getValue();
        const isDiff = code !== prevCode;
        const res = isDiff ? await msg_api.API.usw.publish(id, code, _).catch(e => error = e.message) : util.t("importReportUnchanged");
        const title = `${(new Date).toLocaleString()}\n${res}`;
        const failed = error || /^Error:/.test(res);
        elProgress.append(...failed ? [ dom.$create("a.error[data-cmd=note]", {
          title,
          tabIndex: 0
        }, res), _ && _.token && dom.$create("div", util.t("publishReconnect")) ].filter(Boolean) : [ dom.$create("span." + (isDiff ? "success" : "unchanged"), {
          title
        }) ]);
        failed || (prevCode = code);
      }
      async function disconnect() {
        await msg_api.API.usw.revoke(style.id);
        prevCode = null;
      }
      function updateUI() {
        const usw = style._usw || !1;
        const elUrl = document.getElementById("usw-url");
        const elData = document.getElementById("usw-data");
        const isOn = !!usw.token;
        dom.$toggleDataset(UI, "connected", isOn);
        UI.classList.toggle("ignore-pref", !isOn);
        isOn || (UI.open = !1);
        elUrl.href = `${urls.usw}${usw.id ? `style/${usw.id}` : ""}`;
        elUrl.textContent = util.t("publishUsw").replace(/<(.+)>/, "$1" + (usw.id ? `#${usw.id}` : ""));
        if (!(elData.hidden = editor.default.isUsercss)) for (const key of META_KEYS) {
          const [from, to = from] = key.split(">");
          const value = usw[from] || "";
          const id = "usw-data-" + to;
          let el = document.getElementById(id);
          if (!el) {
            el = dom.$create("input", {
              id,
              _from: from,
              placeholder: key === "name" ? style[key] : ""
            });
            el.on("input", onDataChanged);
            elData.appendChild(document.createElement("div")).append(dom.$create("label", {
              htmlFor: id
            }, "@" + to), el);
          }
          el.value = value;
          onDataChanged.call(el);
        }
      }
      function onDataChanged() {
        const val = this.value.trim();
        const usw = style._usw || val && (style._usw = {});
        const key = this._from;
        editor.default.dirty.modify(this.id, usw && usw[key] || "", val);
        usw && (val ? usw[key] = val : delete usw[key] && util.isEmptyObj(usw) && (style._usw = null));
        this.parentElement.classList.toggle("empty", !val);
      }
      function timerOn() {
        if (!spinnerTimer) {
          elProgress.textContent = "";
          spinnerTimer = setTimeout(() => spinner = dom_util.showSpinner(elProgress), 250);
        }
      }
      function timerOff() {
        spinner?.remove();
        clearTimeout(spinnerTimer);
        spinnerTimer = 0;
        spinner = null;
      }
    }
    oe(3365);
    (async () => {
      load_style.loading && await load_style.loading;
      editor.scrollInfo.sticky && compact_header.toggleSticky(!0);
      const uc = editor.default.isUsercss;
      EditorHeader();
      USWIntegration();
      dom.$rootCL.add(uc ? "usercss" : "sectioned");
      (uc ? SourceEditor : SectionsEditor)();
      editor.default.dirty.onChange(editor.default.updateDirty);
      prefs.subscribe([ "editor.linter", consts.pEditorLinterOn ], linterPrefSubscriber, !0);
      codemirror_factory.addEditorCommands();
      (0, compact_header.default)();
      document.getElementById("name").required = !uc;
      document.getElementById("save-button").onclick = editor.default.save;
      document.getElementById("cancel-button").onclick = editor.default.cancel;
      document.querySelector("#toggle-save a").onclick = edit_util.openHotkeyPopup;
      document.querySelector("#lint-help").onclick = showLintHelp;
      document.querySelector("#linter-settings").onclick = document.querySelector("#lint .config").onclick = showLintConfig;
      const elSec = document.getElementById("sections-list");
      const elToc = document.getElementById("toc");
      const moDetails = new MutationObserver(([{target: sec}]) => {
        if (!sec.open) return;
        sec === elSec && editor.default.updateToc();
        const el = sec.lastElementChild;
        const s = el.style;
        sec.getBoundingClientRect().left + el.getBoundingClientRect().width > innerWidth - 30 ? s.right = "0" : s.right && s.removeProperty("right");
      });
      elSec.open && editor.default.updateToc();
      for (const el of document.querySelectorAll("#details-wrapper > details")) moDetails.observe(el, {
        attributes: !0,
        attributeFilter: [ "open" ]
      });
      elToc.onclick = e => editor.default.jumpToEditor([].indexOf.call(elToc.children, e.target));
      prefs.subscribe(Object.keys(edit_util.HOTKEYS), (id, val) => {
        for (const key in src_cm.extraKeys) if (src_cm.extraKeys[key] === edit_util.HOTKEYS[id]) {
          delete src_cm.extraKeys[key];
          break;
        }
        val && (src_cm.extraKeys[val] = edit_util.HOTKEYS[id]);
      }, !0);
    })();
  },
  4230(_, ee, oe) {
    ee.default = livePreview;
    var le = oe(4930);
    var ae = oe(492);
    var ue = oe(6940);
    var pe = oe(9920);
    let data;
    let port;
    let enabled;
    ae.subscribe("editor.livePreview", (key, value, init) => {
      enabled = value;
      init || (value ? livePreview() : port &&= port.disconnect());
    }, !0);
    function livePreview(now) {
      if (enabled && pe.default.style.id && (pe.default.style.enabled || data && data.enabled || pe.default.dirty.has("enabled")) && (port || pe.default.dirty.isDirty())) {
        if (now) {
          if (!port) {
            port = chrome.runtime.connect({
              name: "livePreview:" + pe.default.style.id
            });
            port.onDisconnect.addListener(() => port = null);
          }
          data = pe.default.getValue(now);
          return le.API.styles.preview(data).then(livePreview._then, livePreview._catch);
        }
        ue.debounce(livePreview, ae.__values["editor.livePreview.delay"] * 1e3, !0);
      }
    }
  },
  981(_, ee, oe) {
    oe.d(ee, {});
    var le = oe(8745);
    var ae = oe(6990);
    var ue = oe(492);
    var pe = oe(8660);
    var fe = oe(6940);
    var he = oe(9920);
    location.hash && history.replaceState(history.state, "", location.href.split("#")[0]);
    let id = +fe.urlParams.get("id");
    const loading = ae.swController ? loadStyle(ue.clientData) : ue.clientData.then(loadStyle);
    oe.e("edit-lazy").then(oe.bind(oe, 9334));
    function loadStyle({style, si, theme, themeText, ...props}) {
      Object.assign(he.default, props);
      Object.assign(he.default.style, style ||= makeNewStyleObj());
      Object.assign(he.scrollInfo, si);
      he.default.updateClass();
      he.default.updateTitle(!1);
      document.getElementById("toc-title").dataset.num = style.sections.length;
      document.getElementById("testRE").hidden = !style.sections.some(({regexps}) => regexps?.length);
      fe.sessionStore.justEditedStyleId = id || "";
      if (id === null) {
        fe.urlParams.delete("id");
        const str = `${fe.urlParams}`;
        history.replaceState({}, "", location.pathname + (str ? "?" : "") + str);
      }
      le.loadCmTheme(theme, themeText);
    }
    function makeNewStyleObj() {
      id = null;
      const prefix = fe.tryURL(fe.urlParams.get("url-prefix"));
      const name = fe.urlParams.get("name") || prefix.hostname;
      const p = prefix.pathname || "/";
      let section;
      for (let [k, v] of fe.urlParams) (k = pe.FROM_CSS[k]) && ((section ??= {})[k] = [ v ]);
      section ??= {
        domains: [ "example.com" ]
      };
      section.code = "";
      return {
        id,
        enabled: !0,
        name: name ? name + (p === "/" ? "" : fe.clipString(p.replace(/\.(html?|aspx?|cgi|php)$/, ""))) : fe.urlParams.get("domain") || "?",
        sections: [ section ]
      };
    }
    ee.loading = loading;
  },
  4869(_, ee, oe) {
    ee.createHotkeyInput = createHotkeyInput;
    ee.openHotkeyPopup = function(evt) {
      evt.preventDefault();
      const bounds = this.getBoundingClientRect();
      const input = createHotkeyInput(this.dataset.pref, {
        onDone: helpPopup.close
      });
      const popup = helpPopup.show(ye.t("helpKeyMapHotkey"), input);
      popup.style = `top: ${bounds.bottom}px; left: ${bounds.left}px; right: auto;`;
      popup.$("input").focus();
    };
    ee.showCodeMirrorPopup = (title, html, options) => {
      const popup = helpPopup.show(title, html, {
        className: "big"
      });
      let cm = popup.codebox = le.CodeMirror(popup._contents, Object.assign({
        mode: "css",
        lineNumbers: !0,
        lineWrapping: he.__values["editor.lineWrapping"],
        foldGutter: !0,
        gutters: [ "CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers" ],
        matchBrackets: !0,
        styleActiveLine: !0,
        theme: he.__values[le.THEME_KEY],
        keyMap: he.__values["editor.keyMap"]
      }, options));
      cm.focus();
      ae.$root.style.pointerEvents = "none";
      popup.style.pointerEvents = "auto";
      const onKeyDown = event => {
        if (event.key === "Tab" && !event.ctrlKey && !event.altKey && !event.metaKey) {
          const search = document.getElementById("search-replace-dialog");
          const area = search && search.contains(document.activeElement) ? search : popup;
          ue.moveFocus(area, event.shiftKey ? -1 : 1);
          event.preventDefault();
        }
      };
      window.on("keydown", onKeyDown, !0);
      popup.onClose.add(() => {
        window.off("keydown", onKeyDown, !0);
        ae.$root.style.removeProperty("pointer-events");
        cm = popup.codebox = null;
      });
      return popup;
    };
    ee.trimCommentLabel = (str, limit = 1e3) => ye.clipString(str.replace(/^[!-/:;=\s]*|[-#$&(+,./:;<=>\s*]*$/g, ""), limit);
    var le = oe(8745);
    var ae = oe(7986);
    var ue = oe(6518);
    var pe = oe(7501);
    var fe = oe(5619);
    var he = oe(492);
    var ye = oe(6940);
    var Ce = oe(8982);
    var Se = oe(9920);
    const helpPopup = {
      SEL: "#help-popup",
      show(title = "", body, props, id = title) {
        const div = ae.$create(helpPopup.SEL, props);
        const old = id && document.querySelector(`${helpPopup.SEL}[data-id="${CSS.escape(id)}"] > .i-close`);
        old && old.click();
        div.dataset.id = id;
        div.append(div._close = ae.$create("i.i-close", {
          onclick: helpPopup.close
        }), div._title = ae.$create("h2.title", title), div._contents = ae.$create(".contents", body && pe.tHTML(body)));
        document.body.append(div);
        div.onClose = new Set;
        window.on("keydown", helpPopup.close, !0);
        helpPopup.originalFocus = document.activeElement;
        ue.moveFocus(div, 0);
        return div;
      },
      close(event) {
        let el;
        const canClose = !(event && event.type !== "click" && (ue.getEventKeyName(event) !== "Escape" || document.querySelector(".CodeMirror-hints, #message-box") || (el = document.activeElement) && el.closest("#search-replace-dialog")));
        const div = event && event.target.closest(helpPopup.SEL) || [ ...document.querySelectorAll(helpPopup.SEL) ].pop();
        if (canClose && div) {
          if (!event || !(el = div.codebox) || el.options.readOnly || el.isClean()) {
            div.contains(document.activeElement) && (el = helpPopup.originalFocus) && el.focus();
            div.remove();
            for (const fn of div.onClose) fn();
            document.querySelector(helpPopup.SEL) || window.off("keydown", helpPopup.close, !0);
            return !0;
          }
          setTimeout(async () => await ue.messageBox.confirm(ye.t("confirmDiscardChanges")) && helpPopup.close());
        }
      }
    };
    const rerouteHotkeys = {
      commands: [ "beautify", "colorpicker", "find", "findNext", "findPrev", "jumpToLine", "nextEditor", "prevEditor", "replace", "replaceAll", "save", "toggleEditorFocus", "toggleStyle" ],
      toggle(enable) {
        document[enable ? "on" : "off"]("keydown", rerouteHotkeys.handler);
      },
      handler(event) {
        const keyName = le.CodeMirror.keyName(event);
        if (!keyName) return;
        const rerouteCommand = name => {
          if (rerouteHotkeys.commands.includes(name)) {
            le.CodeMirror.commands[name](Se.default.closestVisible(event.target));
            return !0;
          }
        };
        if (le.CodeMirror.lookupKey(keyName, le.CodeMirror.defaults.keyMap, rerouteCommand) === "handled" || le.CodeMirror.lookupKey(keyName, le.extraKeys, rerouteCommand) === "handled") {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };
    const worker = fe.createPortProxy(Ce.workerPath);
    function createHotkeyInput(prefId, {buttons = !0, onDone}) {
      const RX_ERR = new RegExp("^(" + [ /Space/, /(Shift-)?./, /(?=.)(Shift-?|Ctrl-?|Control-?|Alt-?|Meta-?)*(Escape|Tab|Page(Up|Down)|Arrow(Up|Down|Left|Right)|Home|End)?/ ].map(r => r.source || r).join("|") + ")$", "i");
      const initialValue = he.__values[prefId];
      const input = ae.$create("input", {
        spellcheck: !1,
        onpaste: e => onkeydown(e, e.clipboardData.getData("text")),
        onkeydown
      });
      buttons = buttons && [ [ "confirmOK", "Enter" ], [ "undo", initialValue ], [ "genericResetLabel", "" ] ].map(([label, val]) => ae.$create("button", {
        onclick: e => onkeydown(e, val)
      }, ye.t(label)));
      const [btnOk, btnUndo, btnReset] = buttons || [];
      onkeydown(null, initialValue);
      return buttons ? ae.$createFragment([ input, ae.$create(".buttons", buttons) ]) : input;
      function onkeydown(e, key) {
        let newValue;
        e && e.type === "keydown" && (key = ue.getEventKeyName(e));
        switch (e && key) {
         case "Tab":
         case "Shift-Tab":
          return;

         case "BackSpace":
         case "Delete":
          newValue = "";
          break;

         case "Enter":
          input.checkValidity() && onDone && onDone(e);
          break;

         case "Escape":
          onDone && onDone(e);
          break;

         default:
          newValue = key.replace(/\b.$/, c => c.toUpperCase());
        }
        if (newValue != null) {
          const error = RX_ERR.test(newValue) ? ye.t("genericError") : "";
          e && !error && he.set(prefId, newValue);
          input.setCustomValidity(error);
          input.value = newValue;
          input.focus();
          if (buttons) {
            btnOk.disabled = Boolean(error);
            btnUndo.disabled = newValue === initialValue;
            btnReset.disabled = !newValue;
          }
        }
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
    ee.HOTKEYS = {
      "editor.beautify.hotkey": "beautify",
      "editor.toggle.hotkey": "toggleStyle"
    };
    ee.helpPopup = helpPopup;
    ee.rerouteHotkeys = rerouteHotkeys;
    ee.worker = worker;
  },
  3365(_, ee, oe) {
    oe.d(ee, {
      isWindowed: () => isWindowed
    });
    oe(9458);
    var msg_init = oe(6990);
    var prefs = oe(492);
    oe(8970);
    var util = oe(6940);
    var util_webext = oe(1480);
    var editor = oe(9920);
    var cm = oe(8745);
    var dom = oe(7986);
    var dom_util = oe(6518);
    var urls = oe(8982);
    function EmbeddedPopup() {
      const ID = "popup-iframe";
      const POPUP_HOTKEY = "Shift-Ctrl-Alt-S";
      let frame;
      let fBody;
      let isLoaded;
      let fw;
      let sensor;
      let mo;
      let xo;
      const btn = dom.$create("img", {
        id: "popup-button",
        title: util.t("optionsCustomizePopup") + "\n" + POPUP_HOTKEY,
        onclick: embedPopup
      });
      document.querySelector("#header").append(btn);
      dom.$rootCL.add("popup-window");
      cm.extraKeys[POPUP_HOTKEY] = "openStylusPopup";
      prefs.subscribe("iconset", (_, val) => {
        const prefix = `${util_webext.MF_ICON_PATH}${val ? "light/" : ""}`;
        btn.srcset = `${prefix}16${util_webext.MF_ICON_EXT} 1x,${prefix}32${util_webext.MF_ICON_EXT} 2x`;
      }, !0);
      window.on("keydown", e => {
        dom_util.getEventKeyName(e) === POPUP_HOTKEY && embedPopup();
      });
      function embedPopup() {
        if (!document.getElementById(ID)) {
          isLoaded = !1;
          frame = dom.$create("iframe", {
            id: ID,
            src: urls.actionPopupUrl,
            width: prefs.__values.popupWidth,
            onload: initFrame
          });
          window.on("mousedown", removePopup);
          window.on("resize", onEditorResized);
          document.body.appendChild(frame);
        }
      }
      function initFrame() {
        frame = this;
        frame.focus();
        fw = frame.contentWindow;
        fBody = fw.document.body;
        onEditorResized();
        fw.on("keydown", removePopupOnEsc);
        fw.close = removePopup;
        sensor ||= dom.$create("div", {
          style: "height: 1px; margin-top: 0px;"
        });
        xo = new IntersectionObserver(onIntersect, {
          threshold: [ 0, 1 ]
        });
        xo.observe(fBody.appendChild(sensor));
        mo = new fw.MutationObserver(onMutation);
        mo.observe(fBody, {
          attributes: !0,
          attributeFilter: [ "style" ]
        });
      }
      function onEditorResized() {
        fBody.style.maxHeight = innerHeight + "px";
      }
      function onMutation() {
        frame.width = fBody.clientWidth + "px";
        onIntersect();
      }
      function onIntersect() {
        frame.height = Math.max(sensor.getBoundingClientRect().y | 0, sensor.nextSibling && fBody.clientHeight || 0);
        if (!isLoaded) {
          isLoaded = !0;
          frame.dataset.loaded = "";
        }
      }
      function removePopup() {
        mo.disconnect();
        xo.disconnect();
        mo = xo = frame = null;
        document.getElementById(ID)?.remove();
        window.off("mousedown", removePopup);
        window.off("resize", onEditorResized);
      }
      function removePopupOnEsc(e) {
        dom_util.getEventKeyName(e) === "Escape" && removePopup();
      }
    }
    let isWindowed;
    if (util_webext.browserWindows) {
      (async () => {
        chrome.tabs.onAttached.addListener(onTabAttached);
        isWindowed = util.urlParams.has("popup");
        isWindowed ? EmbeddedPopup() : isWindowed = history.length === 1 && (msg_init.swController || await prefs.ready, 
        prefs.__values.openEditInWindow) && (await util_webext.browserWindows.getAll()).length > 1 && (await browser.tabs.query({
          currentWindow: !0
        })).length === 1;
      })();
      const pos = util.tryJSONparse(util.sessionStore.windowPos);
      delete util.sessionStore.windowPos;
      pos && pos.left != null && util_webext.browserWindows.update(util_webext.browserWindows.WINDOW_ID_CURRENT, pos);
    }
    util_webext.getOwnTab().then(tab => {
      util.sessionStore["manageStylesHistory" + tab.id] === location.href && (editor.default.cancel = () => history.back());
    });
    async function onTabAttached(tabId, info) {
      if (tabId !== util_webext.ownTab.id) return;
      if (info.newPosition !== 0) {
        prefs.set("openEditInWindow", !1);
        return;
      }
      const openEditInWindow = (await util_webext.browserWindows.get(info.newWindowId, {
        populate: !0
      })).tabs.length === 1;
      prefs.set("openEditInWindow", openEditInWindow);
    }
  }
}, _ => {
  _.O(0, [ "color", "codemirror", "dlg_config-dialog_css-css_dom-error_css-css_global-dark_css-css_global_css-css_onoffswitch_cs-7b17ff" ], () => _(_.s = 5670));
  _.O();
} ]);