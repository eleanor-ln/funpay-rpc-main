"use strict";

(self.webpackChunkStylus = self.webpackChunkStylus || []).push([ [ "edit-lazy" ], {
  6932(_, ee, oe) {
    var src_cm = oe(2715);
    var util = oe(6161);
    var prefs = oe(2956);
    var js_util = oe(2076);
    var color_converter = oe(3696);
    var consts = oe(7132);
    const MARK = document.createElement("b");
    const SWATCH = Object.assign(document.createElement("span"), {
      className: "colorview-swatch"
    });
    const USO_VAR = "uso-variable";
    const USO_VALID_VAR = "variable-3 " + USO_VAR;
    const USO_INVALID_VAR = "error " + USO_VAR;
    const kCompleteSingle = "completeSingle";
    const pickedCms = new WeakSet;
    const addSuffix = (obj, suffix) => ([ ...obj.keys() ].sort().join(suffix + "\n") + suffix).split("\n");
    class Completion {
      constructor(i, text, val) {
        this.i = i;
        this.text = text;
        this.val = val;
      }
      hint(cm, {from, to}, {text}) {
        pickedCms.add(cm);
        text === cm.getRange(from, to) ? cm.setCursor(to) : cm.replaceRange(text, from, to, "complete");
        text.endsWith(": ") && setTimeout(execAutocomplete, 0, cm);
      }
      render(el, {len}, {i, text, val}) {
        let color, mark;
        color_converter.NAMED_COLORS.has(val || text) && (color = SWATCH.cloneNode()).style.setProperty(consts.SWATCH_PROP, val || text);
        len && (mark = MARK.cloneNode()).append((val || text).slice(i, i + len));
        el.className += (val ? " hint-value" : " hint-name") + (i ? " hint-start" : " hint-inside");
        color || mark ? el.append(...[ val && text, color, (val || text).slice(0, i), mark, (val || text).slice(i + len) ].filter(Boolean)) : el.textContent = text + (val || "");
      }
    }
    function autocompleteOnTyping(cm, [info], debounced) {
      const lastLine = info.text[info.text.length - 1];
      cm.state.completionActive || info.origin && !info.origin.includes("input") || !lastLine || (pickedCms.has(cm) ? pickedCms.delete(cm) : debounced ? lastLine.match(/[-a-z!]+$/i) && execAutocomplete(cm) : js_util.debounce(autocompleteOnTyping, 100, cm, [ info ], !0));
    }
    async function execAutocomplete(cm) {
      pickedCms.delete(cm);
      const ho = cm.options.hintOptions;
      const old = ho[kCompleteSingle];
      ho[kCompleteSingle] = !1;
      cm.execCommand("autocomplete");
      await 0;
      ho[kCompleteSingle] = old;
    }
    function findAllCssVars(cm, leftPart, rightPart = "") {
      const [, prefixed, named] = leftPart.match(/^(--|@)?(\S)?/);
      const rx = new RegExp("(?:^|[\\s/;{])(" + (prefixed ? leftPart : "--") + (named ? "" : "[a-zA-Z_-￿]") + "[-0-9a-zA-Z_-￿]*)" + rightPart, "g");
      const list = new Set;
      cm.eachLine(({text}) => {
        for (let m; m = rx.exec(text); ) list.add(m[1]);
      });
      return [ ...list ].sort();
    }
    function getTokenState(cm, pos, type) {
      const token = cm.getTokenAt(pos, !0);
      return token.type ? token.state.state : type;
    }
    function execAt(rx, index, text) {
      rx.lastIndex = index;
      return rx.exec(text);
    }
    var codemirror_factory = oe(4160);
    var editor = oe(6767);
    var edit_util = oe(4165);
    const rxCmAnyProp = /^(prop(erty)?|variable-2|string-2)\b/;
    const rxCmProp = /prop/;
    const rxCmTopFunc = /^(top|documentTypes|atBlock)/;
    const rxCmVarTagColor = /^(variable|tag|error)/;
    const rxConsume = /([-\w]*\s*:\s?)?/uy;
    const rxCruftAtStart = /^[^\w\s]\s*/;
    const rxFilterable = /(--|[#.\w])\S*\s*$|@|!(i(m(p(o(r(t(a(nt?)?)?)?)?)?)?)?)?/i;
    const rxHexColor = /[0-9a-f]+\b|$|\s/iy;
    const rxMaybeProp1 = /^(prop(erty|\?)|atom|error|tag)/;
    const rxMaybeProp2 = /^(block|atBlock_parens|maybeprop)/;
    const rxNamedColors = /<color>$/;
    const rxNonSpace = /\S/;
    const rxNonWord = /[^-\w]/u;
    const rxNonWordEnd = /[^-\w]$/u;
    const rxPropOrEnd = /^([-a-z]*)(: ?|\()?$/i;
    const rxPropChars = /(\s*[-a-z(]+)?/iy;
    const rxPropChars1 = /[-a-z(!]/iy;
    const rxPropChars2 = /[-a-z(]*/iy;
    const rxPropEnd = /[\s:()]*/y;
    const rxSupports = /(^|[\s()])supports\(\s*$/i;
    const rxVarEnv = /(?:^|[^-.\w\u0080-\uFFFF])(?:var|(e)nv)\(-?/iuy;
    const rxWord = js_util.tryRegExp("(?<![-\\w]|#[0-9a-f]*)") ? js_util.tryRegExp("(?<![-\\w]|#[0-9a-f]*)[a-z][-a-z]+", "gi") : /\b[a-z][-a-z]+/gi;
    const cssMime = src_cm.CodeMirror.mimeModes["text/css"];
    const docFuncs = addSuffix(cssMime.documentTypes, "(");
    const docFuncsStr = "\n" + docFuncs.join("\n");
    const {tokenHooks} = cssMime;
    const originalHelper = src_cm.CodeMirror.hint.css || (() => ({
      list: []
    }));
    const AOT_ID = "autocompleteOnTyping";
    const AOT_PREF_ID = "editor." + AOT_ID;
    const aot = prefs.__values[AOT_PREF_ID];
    let cssAts, cssColors, cssMedia, cssProps, cssPropsLC, cssPropNames;
    let cssSpecData;
    let prevData, prevMatch, prevLine, prevCh;
    src_cm.CodeMirror.defineOption(AOT_ID, aot, (cm, value) => {
      cm[value ? "on" : "off"]("changes", autocompleteOnTyping);
    });
    prefs.subscribe(AOT_PREF_ID, (key, val) => codemirror_factory.default.globalSetOption(AOT_ID, val), aot);
    src_cm.CodeMirror.registerHelper("hint", "css", helper);
    src_cm.CodeMirror.registerHelper("hint", "stylus", helper);
    tokenHooks.set(47, (stream, state, str, pos) => {
      let res;
      if (str.charCodeAt(pos) === 42 && str.charCodeAt(pos + 1) === 91 && str.charCodeAt(pos + 2) === 91 && (pos = str.indexOf("]]*/", pos)) > 0) {
        var _;
        res = (_ = editor.default.style.usercssData) == null ? void 0 : _.vars;
        res = res && js_util.hasOwn(res, str.slice(stream.start + 4, pos).replace(/-rgb$/, "")) ? USO_VALID_VAR : USO_INVALID_VAR;
        res = [ res, "comment" ];
        stream.pos = pos + 4;
      } else res = !1;
      return res;
    });
    async function helper(cm) {
      const pos = cm.getCursor();
      const {line, ch} = pos;
      const {styles, text} = cm.getLineHandle(line);
      let i, end, leftLC, list, prev, prop, state, str, type;
      if (prevData && prevLine === line && prevCh <= ch && (prev = prevData.from.ch) < ch && prevMatch === text.slice(prevCh - prevMatch.length, prevCh) && (i = text.slice(prevCh, ch).match(rxPropOrEnd)) && (prevMatch += i[1], 
      !i[2])) {
        list = prevData.list;
        end = 0;
        for (let v, a = 0; a < list.length; a++) {
          v = list[a];
          if ((v.text || v).indexOf(prevMatch) === v.i) {
            end < a && (list[end] = v);
            end++;
          }
        }
        list.length = end;
        prevLine = line;
        prevData.from.ch = prev += text.slice(prev, ch).match(/^\s*/)[0].length;
        prevCh = prevData.to.ch = end !== 1 ? ch : prev + (end && (i = list[0]).text || i).length;
        prevData.len = prevMatch.length;
        return prevData;
      }
      prev = prevData = null;
      if (i) {
        prop = prevMatch;
        prev = end = ch;
        str = leftLC = "";
      } else {
        const [style, styleIndex] = util.getStyleAtPos(styles, ch) || [];
        type = style && style.split(" ", 1)[0] || "prop?";
        if (!type || type === "comment" || type === "string") return originalHelper(cm);
        i = styleIndex;
        prev = styleIndex > 2 ? styles[styleIndex - 2] : 0;
        for (;prev && (rxPropChars1.lastIndex = prev - 1, rxPropChars1.test(text)); ) --prev;
        if (text[prev] === "#" && (rxHexColor.lastIndex = prev + 1, rxHexColor.test(text))) return;
        end = styles[styleIndex];
        rxPropChars2.lastIndex = end;
        rxPropChars2.exec(text);
        end = rxPropChars2.lastIndex;
        rxFilterable.lastIndex = prev;
        prev = Math.max(prev, text.slice(0, end).search(rxFilterable));
        str = text.slice(prev, end);
        const left = text.slice(prev, ch).trim();
        const L = (leftLC = left.toLowerCase())[0];
        if (L === "!") list = "!important".startsWith(leftLC) ? [ "!important" ] : []; else if (L === "@") {
          list = cssAts || (await initCssProps(), cssAts);
          cm.doc.mode.helperType === "less" && (list = findAllCssVars(cm, left, "\\s*:").concat(list));
        } else if (L === "." || L === "#") list = !1; else if (L === "-" || L === "(") {
          list = str.startsWith("--") ? findAllCssVars(cm, left) : (rxVarEnv.lastIndex = ch - 5 - left.endsWith("-"), 
          rxVarEnv.test(text) ? RegExp.$1 ? [ "preferred-text-scale", "safe-area-inset-top", "safe-area-inset-bottom", "safe-area-inset-right", "safe-area-inset-left", "safe-area-max-inset-top", "safe-area-max-inset-bottom", "safe-area-max-inset-right", "safe-area-max-inset-left", "viewport-segment-width", "viewport-segment-height", "viewport-segment-top", "viewport-segment-bottom", "viewport-segment-left", "viewport-segment-right" ] : findAllCssVars(cm, left) : []);
          if (str.startsWith("(")) {
            prev++;
            leftLC = left.slice(1);
          } else leftLC = left;
        } else if (L === "/") {
          if (str.startsWith("/*[[") && str.endsWith("]]*/")) {
            var _;
            prev += 4;
            end -= 4;
            end -= text.slice(end - 4, end) === "-rgb" ? 4 : 0;
            list = Object.keys(((_ = editor.default.style.usercssData) == null ? void 0 : _.vars) || {}).sort();
            leftLC = left.slice(4);
          }
        } else if ((L === "u" || L === "d" || L === "r") && rxCmVarTagColor.test(type) && docFuncsStr.includes("\n" + leftLC) && rxCmTopFunc.test(state != null ? state : state = getTokenState(cm, pos, type))) {
          end++;
          list = docFuncs;
        }
      }
      if (list == null) {
        if (!prop && (cm.doc.mode.name === "stylus" || rxCmProp.test(state != null ? state : state = getTokenState(cm, pos, type)))) {
          for (;i > 0 && !rxCmAnyProp.test(styles[i + 1]); ) i -= 2;
          const propEnd = styles[i];
          if (propEnd > text.lastIndexOf(";", ch - 1)) {
            for (;i > 0 && rxCmAnyProp.test(styles[i + 1]); ) i -= 2;
            prop = (i < 2 || styles[i] < ch) && text.slice(styles[i] || 0, propEnd).toLowerCase().match(/([-\w]+)?$/u)[1];
          }
        }
        if (prop) {
          if (rxNonWord.test(leftLC)) {
            prev += execAt(rxPropEnd, prev, text)[0].length;
            leftLC = leftLC.replace(rxCruftAtStart, "");
          }
          prop.startsWith("--") ? prop = "color" : leftLC && prop.startsWith(leftLC) && (prop = "");
        }
        if (prop) {
          cssPropNames || await initCssProps();
          list = cssProps[prop + ": "];
          if (list != null) {
            list = list ? list.replace(rxNamedColors, cssColors).split("\n") : [];
            list.push(...cssSpecData.global);
          }
          end = prev + execAt(rxPropChars, prev, text)[0].length;
        }
        if (!list && rxMaybeProp1.test(type) && rxMaybeProp2.test(state != null ? state : state = getTokenState(cm, pos, type))) {
          cssPropNames || await initCssProps();
          if (type === "prop?") {
            prev += leftLC.length;
            leftLC = "";
          }
          list = state !== "atBlock_parens" || rxSupports.test(text.slice(0, prev)) ? cssPropNames : cssMedia;
          end -= rxNonWordEnd.test(str);
          end += execAt(rxConsume, end, text)[0].length;
        }
      }
      if (!list) {
        const simple = cm.doc.mode.name === "stylus" ? src_cm.CodeMirror.hint.fromList(cm, {
          words: src_cm.CodeMirror.hintWords.stylus
        }) : originalHelper(cm);
        const word = leftLC ? RegExp(js_util.stringAsRegExpStr(leftLC) + "[-a-z]+", "gi") : rxWord;
        const any = src_cm.CodeMirror.hint.anyword(cm, {
          word
        }).list;
        cssColors || await initCssProps();
        list = [ ...new Set([].concat((simple == null ? void 0 : simple.list) || [], any, cssColors.split("\n"))) ];
        list.sort();
      }
      const len = leftLC.length;
      const names1 = new Map;
      const names2 = new Map;
      for (const v of list) {
        i = leftLC ? v.toLowerCase().indexOf(leftLC) : 0;
        i >= 0 && (i ? names2 : names1).set(v, new Completion(i, v));
      }
      list = [ ...names1.values(), ...names2.values() ];
      if (!prop) {
        const values1 = new Map;
        const values2 = new Map;
        cssPropNames || await initCssProps();
        for (const name of cssPropNames) if (leftLC !== "-" || name.charCodeAt(0) === 45) {
          i = 0;
          for (let a, b, v, lc = cssPropsLC[name]; i >= 0 && (!leftLC || (i = lc.indexOf(leftLC, i)) >= 0); i = leftLC ? b : b + 1 || b) {
            a = leftLC ? lc.lastIndexOf("\n", i) + 1 : i;
            b = lc.indexOf("\n", i + len);
            v = cssProps[name].slice(a, b < 0 ? 1e9 : b);
            (i === a ? values1 : values2).set(name + v, new Completion(i - a, name, v));
          }
        }
        list.push(...values1.values(), ...values2.values());
      }
      i = str.search(rxNonSpace);
      prev += i < 0 ? str.length : i;
      end < prev && (end = prev);
      prevMatch = text.slice(prev, ch);
      prevLine = line;
      prevCh = ch;
      prevData = {
        len,
        list,
        from: {
          line,
          ch: prev
        },
        to: {
          line,
          ch: end
        }
      };
      return prevData;
    }
    async function initCssProps() {
      cssSpecData = await edit_util.worker.getCssPropsValues();
      cssAts = cssSpecData.ats;
      cssColors = cssSpecData.colors;
      cssProps = cssSpecData.all;
      cssPropsLC = {};
      for (const k in cssProps) cssPropsLC[k] = cssProps[k].toLowerCase();
      cssPropNames = cssSpecData.keys;
      cssMedia = [].concat(...Object.entries(cssMime).map(getMediaKeys).filter(Boolean)).sort();
    }
    function getMediaKeys([k, v]) {
      return k === "mediaFeatures" && addSuffix(v, ": ") || k.startsWith("media") && Object.keys(v);
    }
    var dom = oe(9298);
    var localization = oe(9293);
    var msg_api = oe(1154);
    var style_util = oe(5012);
    const makeId = () => editor.default.style.id || "new";
    let delay;
    let port;
    (async () => {
      const draft = await msg_api.API.draftsDB.get(makeId());
      let resolve, style, value;
      if (!draft || !(style = draft.style) || !(value = draft.isUsercss ? style.sourceCode : style_util.styleToCss(style)) || draft.isUsercss !== editor.default.isUsercss || editor.default.isSame(draft.style)) return;
      const onYes = () => resolve(!0);
      const onNo = () => resolve(!1);
      const info = js_util.t("draftTitle", localization.formatRelativeDate(draft.date));
      const popup = edit_util.showCodeMirrorPopup(info, "", {
        value,
        readOnly: !0
      });
      const buttons = [ js_util.t("confirmYes"), js_util.t("confirmNo") ].map((btn, i) => dom.$create("button", {
        onclick: i ? onNo : onYes
      }, btn));
      popup.className += " danger";
      popup.onClose.add(onNo);
      popup._contents.append(dom.$create("p", js_util.t("draftAction")), dom.$create(".buttons", buttons));
      if (await new Promise(r => resolve = r)) {
        style.id = editor.default.style.id;
        buttons.forEach(b => b.disabled = !0);
        await editor.default.replaceStyle(style, draft);
      } else msg_api.API.draftsDB.delete(makeId()).catch(js_util.NOP);
      edit_util.helpPopup.close();
    })().then(() => {
      editor.default.dirty.onChange(isDirty => {
        var _;
        return isDirty ? !port && connectPort() : (_ = port) == null ? void 0 : _.disconnect();
      });
      editor.default.dirty.onDataChange(isDirty => js_util.debounce(updateDraft, isDirty ? delay : 0));
      prefs.subscribe("editor.autosaveDraft", (key, val) => {
        delay = js_util.clamp(val * 1e3 | 0, 1e3, 2 ** 32 - 1);
        const timer = js_util.debounce.timers.get(updateDraft);
        timer && js_util.debounce(updateDraft, timer.delay ? delay : 0);
      }, !0);
    });
    function connectPort() {
      port = chrome.runtime.connect({
        name: "draft:" + makeId()
      });
      port.onDisconnect.addListener(() => port = null);
    }
    function updateDraft(isDirty = editor.default.dirty.isDirty()) {
      isDirty && msg_api.API.draftsDB.put({
        date: new Date,
        isUsercss: editor.default.isUsercss,
        style: editor.default.getValue(!0),
        si: editor.default.makeScrollInfo()
      }, makeId());
    }
    var dom_util = oe(4777);
    var storage_util = oe(1320);
    var load_style = oe(6421);
    const ANNOTATE_SCROLLBAR_OPTIONS = {
      maxMatches: 1e4
    };
    const TARGET_CLASS = "search-target-editor";
    const MATCH_CLASS = "search-target-match";
    const APPLIES_VALUE_CLASS = "applies-value";
    let stateFirstRun = !0;
    let stateFind = "";
    let stateRX;
    let stateRX2;
    let stateLooseSpaces = !0;
    let stateIcase = !0;
    let stateReverse = !1;
    let stateLastFind = "";
    let stateNumFound = 0;
    let stateNumApplies = -1;
    let stateReplace = "";
    let stateLastReplace;
    let stateActiveAppliesTo;
    let stateCm;
    let stateCmStart;
    let stateCursorOptions;
    let stateDialog;
    let stateEditors;
    let lazyEditors;
    let stateInput2;
    let stateInput;
    let stateMarker;
    let stateOriginalFocus;
    let stateReplaceHasRefs;
    let stateReplaceValue;
    let stateScrollX;
    let stateScrollY;
    let stateTally;
    const stateUndoHistory = [];
    const stateSearchInApplies = !editor.default.isUsercss;
    const toggleActionEnabled = (el, state, now) => {
      dom.$toggleDataset(el, "enabled", state);
      if (now) {
        stateLastFind = "";
        doSearch({
          canAdvance: !1
        });
      }
    };
    const ACTIONS = {
      key: {
        Enter: () => {
          switch (document.activeElement) {
           case stateInput:
           case stateInput2:
            stateDialog.dataset.type === "find" ? doSearch({
              reverse: !1
            }) : doReplace();
          }
        },
        Esc: () => {
          destroyDialog({
            restoreFocus: !0
          });
        }
      },
      click: {
        next: () => doSearch({
          reverse: !1
        }),
        prev: () => doSearch({
          reverse: !0
        }),
        close: () => destroyDialog({
          restoreFocus: !0
        }),
        replace: () => doReplace(),
        replaceAll: () => doReplaceAll(),
        undo: () => doUndo(),
        clear() {
          dom_util.setInputValue(this._input, "");
        },
        spaces() {
          toggleActionEnabled(this, stateLooseSpaces = !stateLooseSpaces, !0);
        },
        case() {
          toggleActionEnabled(this, stateIcase = !stateIcase, !0);
        }
      }
    };
    const EVENTS = {
      oninput() {
        stateFind = stateInput.value;
        js_util.debounce(doSearch, 0, {
          canAdvance: !1
        });
        dom.cssFieldSizing || adjustTextareaSize(this);
        stateFind || enableReplaceButtons(!1);
      },
      onkeydown(event) {
        const action = ACTIONS.key[src_cm.CodeMirror.keyName(event)];
        action && action(event) !== !1 && event.preventDefault();
      },
      onclick(event) {
        const el = event.target.closest("[data-action]");
        const action = el && ACTIONS.click[el.dataset.action];
        action && action.call(el, event) !== !1 && event.preventDefault();
      },
      onfocusout() {
        if (!stateDialog.contains(document.activeElement)) {
          stateDialog.on("focusin", EVENTS.onfocusin);
          stateDialog.off("focusout", EVENTS.onfocusout);
        }
      },
      onfocusin() {
        stateDialog.on("focusout", EVENTS.onfocusout);
        stateDialog.off("focusin", EVENTS.onfocusin);
        trimUndoHistory();
        enableUndoButton(stateUndoHistory.length);
      }
    };
    const DIALOG_PROPS = {
      onclick: EVENTS.onclick,
      onkeydown: EVENTS.onkeydown
    };
    const INPUT_PROPS = {
      oninput: EVENTS.oninput
    };
    const INPUT2_PROPS = {
      oninput() {
        stateReplace = this.value;
        dom.cssFieldSizing || adjustTextareaSize(this);
        js_util.debounce(writeStorage, 500);
      }
    };
    const COMMANDS = {
      find(cm, {reverse = !1} = {}) {
        stateReverse = reverse;
        focusDialog("find", cm);
      },
      findNext: cm => doSearch({
        reverse: !1,
        cm
      }),
      findPrev: cm => doSearch({
        reverse: !0,
        cm
      }),
      replace(cm) {
        stateReverse = !1;
        focusDialog("replace", cm);
      }
    };
    COMMANDS.replaceAll = COMMANDS.replace;
    Object.assign(src_cm.CodeMirror.commands, COMMANDS);
    function initState({initReplace} = {}) {
      const text = stateFind;
      if (text !== stateLastFind) {
        stateNumFound = 0;
        stateNumApplies = -1;
        stateLastFind = text;
        const match = text && text.match(js_util.RX_MAYBE_REGEXP);
        const string2regexpFlags = stateIcase ? "gi" : "g";
        let rxStr;
        stateRX = match && js_util.tryRegExp(match[1], "g" + match[2].replace(/[guy]/g, "")) || text && (rxStr = stateIcase || text.includes("\n"));
        if (rxStr || text && !stateRX) {
          rxStr = js_util.stringAsRegExpStr(text);
          rxStr = new RegExp(stateLooseSpaces ? rxStr.replace(/\s+/g, "\\s+") : rxStr, string2regexpFlags);
          stateRX = rxStr;
        }
        stateRX2 = stateRX || rxStr;
        stateCursorOptions = {
          caseFold: !stateRX && stateIcase,
          multiline: !0
        };
        js_util.debounce(writeStorage, 500);
      }
      if (initReplace && stateReplace !== stateLastReplace) {
        stateLastReplace = stateReplace;
        stateReplaceValue = stateReplace.replace(/(\\r)?\\n/g, "\n").replace(/\\t/g, "\t");
        stateReplaceHasRefs = /\$[$&`'\d]/.test(stateReplaceValue);
      }
      const cmFocused = document.activeElement && document.activeElement.closest(".CodeMirror");
      stateActiveAppliesTo = document.querySelector(`.${APPLIES_VALUE_CLASS}:focus, .${APPLIES_VALUE_CLASS}.${TARGET_CLASS}`);
      stateCmStart = editor.default.closestVisible(cmFocused && document.activeElement || stateActiveAppliesTo || stateCm);
      const cmExtra = document.querySelector("body > :not(#sections) .CodeMirror");
      stateEditors = cmExtra ? [ cmExtra.CodeMirror ] : editor.default.getEditors();
      lazyEditors = stateEditors.lazy && editor.default.sections;
    }
    function doSearch({reverse = stateReverse, canAdvance = !0, inApplies = !0, cm} = {}) {
      cm && setActiveEditor(cm);
      stateReverse = reverse;
      if (!stateFind && !dialogShown()) {
        focusDialog("find", stateCm);
        return;
      }
      initState();
      const cmStart = stateCmStart;
      const {index, found, foundInCode} = stateFind && doSearchInEditors({
        cmStart,
        canAdvance,
        inApplies
      }) || {};
      foundInCode || clearMarker();
      found || makeTargetVisible(null);
      setupOverlay(radiateArray(foundInCode ? index : lazyEditors ? lazyEditors.indexOf(cmStart.editorSection) : 0));
      enableReplaceButtons(foundInCode);
      stateFind ? js_util.debounce(showTally, 0, foundInCode && !stateNumFound ? 1 : void 0) : showTally(0, 0);
      stateFirstRun = !1;
      return found;
    }
    function doSearchInEditors({cmStart, canAdvance, inApplies}) {
      const query = stateRX || stateFind;
      const reverse = stateReverse;
      const BOF = {
        line: 0,
        ch: 0
      };
      const EOF = getEOF(cmStart);
      const start = lazyEditors ? lazyEditors.indexOf(cmStart.editorSection) : 0;
      const total = stateEditors.length;
      let i = 0;
      let wrapAround = 0;
      let pos, index, cm;
      if (inApplies && stateActiveAppliesTo) {
        if (doSearchInApplies(stateCmStart, canAdvance)) return {
          found: !0
        };
        reverse ? pos = EOF : i++;
      } else {
        pos = getContinuationPos({
          cm: cmStart,
          reverse: !canAdvance || reverse
        });
        wrapAround = reverse ? src_cm.CodeMirror.cmpPos(pos, EOF) < 0 : src_cm.CodeMirror.cmpPos(pos, BOF) > 0;
      }
      for (;i < total + wrapAround; i++) {
        index = (start + i * (reverse ? -1 : 1) + total) % total;
        if (lazyEditors && (cm = lazyEditors[index]).init && !(stateRX ? stateRX.test(cm.init.code) : cm.init.code.includes(stateFind))) continue;
        cm = stateEditors[index];
        i && (pos = reverse ? {
          line: cm.doc.size,
          ch: 0
        } : BOF);
        const cursor = cm.getSearchCursor(query, pos, stateCursorOptions);
        if (cursor.find(reverse)) {
          makeMatchVisible(cm, cursor);
          return {
            found: !0,
            foundInCode: !0,
            index
          };
        }
        if (inApplies && doSearchInApplies(reverse ? stateEditors[index ? index - 1 : total - 1] : cm)) return {
          found: !0
        };
      }
    }
    function doSearchInApplies(cm, canAdvance) {
      if (!stateSearchInApplies) return;
      const inputs = editor.default.getSearchableInputs(cm);
      stateReverse && inputs.reverse();
      inputs.splice(0, inputs.indexOf(stateActiveAppliesTo));
      for (const input of inputs) {
        const value = input.value;
        stateRX2.lastIndex = input === stateActiveAppliesTo ? input.selectionStart + canAdvance : 0;
        const match = stateRX2.exec(value);
        if (!match) continue;
        const end = match.index + match[0].length;
        setTimeout(() => {
          input.setSelectionRange(end, end);
          input.setSelectionRange(match.index, end);
        });
        const canFocus = !stateDialog || !stateDialog.contains(document.activeElement);
        makeTargetVisible(!canFocus && input);
        editor.default.scrollToEditor(cm);
        canFocus && input.focus();
        stateCm = cm;
        clearMarker();
        return !0;
      }
    }
    function doReplace() {
      initState({
        initReplace: !0
      });
      const cm = stateCmStart;
      const generation = cm.changeGeneration();
      const cursor = doReplaceInEditor({
        cm,
        pos: getContinuationPos({
          cm,
          reverse: !0
        })
      });
      if (cursor) {
        if (cursor.findNext()) {
          clearMarker();
          makeMatchVisible(cm, cursor);
        } else doSearchInEditors({
          cmStart: getNextEditor(cm)
        });
        getStateSafe(cm).unclosedOp = !1;
        cm.curOp && cm.endOperation();
        if (cursor) {
          stateUndoHistory.push([ [ cm, generation ] ]);
          enableUndoButton(!0);
        }
      }
    }
    function doReplaceAll() {
      initState({
        initReplace: !0
      });
      clearMarker();
      const found = [];
      const generations = [];
      for (let cm of lazyEditors || stateEditors) {
        if (lazyEditors) {
          if (cm.init && !(stateRX ? !stateRX.test(cm.init.code) : !cm.init.code.includes(stateFind))) continue;
          cm = cm.cm;
        }
        const gen = cm.history.generation;
        if (doReplaceInEditor({
          cm,
          all: !0
        })) {
          generations.push([ cm, gen ]);
          found.push(cm);
        }
      }
      if (found.length) {
        stateLastFind = null;
        stateUndoHistory.push(generations);
        enableUndoButton(!0);
        doSearch({
          canAdvance: !1
        });
      }
    }
    function doReplaceInEditor({cm, pos, all = !1}) {
      const cursor = cm.getSearchCursor(stateRX || stateFind, pos, stateCursorOptions);
      const replace = stateReplaceValue;
      let found;
      cursor.find();
      for (;cursor.atOccurrence; ) {
        found = !0;
        if (!cm.curOp) {
          cm.startOperation();
          getStateSafe(cm).unclosedOp = !0;
        }
        if (stateRX) {
          const text = cm.getRange(cursor.pos.from, cursor.pos.to);
          cursor.replace(stateReplaceHasRefs ? text.replace(stateRX, replace) : replace);
        } else cursor.replace(replace);
        if (!all) {
          makeMatchVisible(cm, cursor);
          return cursor;
        }
        cursor.findNext();
      }
      all && (getStateSafe(cm).searchPos = null);
      return found;
    }
    function doUndo() {
      let undoneSome;
      saveWindowScrollPos();
      for (const [cm, generation] of stateUndoHistory.pop() || []) if (document.body.contains(cm.display.wrapper) && !cm.isClean(generation)) {
        cm.undo();
        cm.getAllMarks().forEach(marker => marker !== stateMarker && marker.className === MATCH_CLASS && marker.clear());
        undoneSome = !0;
      }
      enableUndoButton(stateUndoHistory.length);
      stateUndoHistory.length ? focusUndoButton() : stateInput.focus();
      if (undoneSome) {
        stateLastFind = null;
        restoreWindowScrollPos();
        doSearch({
          reverse: !1,
          canAdvance: !1,
          inApplies: !1
        });
      }
    }
    function setupOverlay(queue, debounced) {
      if (!queue.length) return;
      if (queue.length > 1 || !debounced) {
        js_util.debounce(setupOverlay, 0, queue, !0);
        if (!debounced) return;
      }
      let canContinue = !0;
      for (;queue.length && canContinue; ) {
        var _;
        let cm = queue.shift();
        lazyEditors && (cm = !cm.init && cm.cm);
        if (!cm || !document.body.contains(cm.display.wrapper)) continue;
        const cmState = getStateSafe(cm);
        const query = stateRX2;
        if (((_ = cmState.overlay) == null ? void 0 : _.query) === query) {
          cmState.unclosedOp && cm.curOp && cm.endOperation();
          cmState.unclosedOp = !1;
          continue;
        }
        if (cmState.overlay) {
          cm.curOp || cm.startOperation();
          cm.removeOverlay(cmState.overlay);
          cmState.overlay = null;
          canContinue = !1;
        }
        const hasMatches = query && cm.getSearchCursor(query, null, stateCursorOptions).find();
        if (hasMatches) {
          cm.curOp || cm.startOperation();
          cmState.overlay = {
            query,
            token: tokenize,
            numFound: 0,
            tallyShownTime: 0
          };
          cm.addOverlay(cmState.overlay);
          canContinue = !1;
        }
        if (cmState.annotate) {
          cm.curOp || cm.startOperation();
          cmState.annotate.clear();
          cmState.annotate = null;
          canContinue = !1;
        }
        if (cmState.annotateTimer) {
          clearTimeout(cmState.annotateTimer);
          cmState.annotateTimer = 0;
        }
        hasMatches && (cmState.annotateTimer = setTimeout(annotateScrollbar, 350, cm, query, stateIcase));
        cmState.unclosedOp = !1;
        cm.curOp && cm.endOperation();
      }
      queue.length || js_util.debounce.unregister(setupOverlay);
    }
    function tokenize(stream) {
      this.query.lastIndex = stream.pos;
      const match = this.query.exec(stream.string);
      if (match && match.index === stream.pos) {
        this.numFound++;
        const now = performance.now();
        if (now - this.tallyShownTime > 10) {
          this.tallyShownTime = now;
          js_util.debounce(showTally);
        }
        stream.pos += match[0].length || 1;
        return "searching";
      }
      match ? stream.pos = match.index : stream.skipToEnd();
    }
    function annotateScrollbar(cm, query, icase) {
      getStateSafe(cm).annotate = cm.showMatchesOnScrollbar(query, icase, ANNOTATE_SCROLLBAR_OPTIONS);
      js_util.debounce(showTally);
    }
    function focusDialog(type, cm) {
      setActiveEditor(cm);
      let sel = stateDialog && stateDialog.contains(document.activeElement) ? "" : getSelection().toString() || cm && cm.getSelection();
      sel = !sel.includes("\n") && !sel.includes("\r") && sel;
      sel && (stateFind = sel);
      if (dialogShown(type)) sel && dom_util.setInputValue(stateInput, sel); else {
        destroyDialog();
        createDialog(type);
        stateTally.textContent === "0" && (stateTally.textContent = "");
      }
      stateInput.focus();
      stateInput.select();
      stateFind && doSearch({
        canAdvance: !1
      });
      stateFirstRun = !1;
    }
    function dialogShown(type) {
      return document.body.contains(stateInput) && (!type || stateDialog.dataset.type === type);
    }
    function createDialog(type) {
      stateOriginalFocus = document.activeElement;
      stateFirstRun = !0;
      const dialog = stateDialog = localization.template.searchReplaceDialog.cloneNode(!0);
      Object.assign(dialog, DIALOG_PROPS);
      dialog.on("focusout", EVENTS.onfocusout);
      dialog.dataset.type = type;
      dialog.style.pointerEvents = "auto";
      const content = dialog.$('[data-type="content"]');
      content.parentNode.replaceChild(localization.template[type].cloneNode(!0), content);
      stateInput = createInput(0, INPUT_PROPS, stateFind);
      stateInput2 = createInput(1, INPUT2_PROPS, stateReplace);
      toggleActionEnabled(dialog.$('[data-action="case"]'), !stateIcase);
      toggleActionEnabled(dialog.$('[data-action="spaces"]'), stateLooseSpaces);
      stateTally = dialog.$('[data-type="tally"]');
      document.body.appendChild(dialog);
      dispatchEvent(new Event("showHotkeyInTooltip"));
      dom.cssFieldSizing || adjustTextareaSize(stateInput);
      if (type === "replace") {
        dom.cssFieldSizing || adjustTextareaSize(stateInput2);
        enableReplaceButtons(stateFind !== "");
        enableUndoButton(stateUndoHistory.length);
      }
      return dialog;
    }
    function createInput(index, props, value) {
      const input = stateDialog.$$("textarea")[index];
      if (input) {
        input.value = value;
        Object.assign(input, props);
        input.parentElement.appendChild(localization.template.clearSearch.cloneNode(!0));
        input.parentElement.$("[data-action]")._input = input;
        return input;
      }
    }
    function destroyDialog({restoreFocus = !1} = {}) {
      var _;
      stateInput = null;
      (_ = document.getElementById("search-replace-dialog")) == null || _.remove();
      js_util.debounce.unregister(doSearch);
      makeTargetVisible(null);
      if (restoreFocus) setTimeout(focusNoScroll, 0, stateOriginalFocus); else {
        saveWindowScrollPos();
        restoreWindowScrollPos({
          immediately: !1
        });
      }
    }
    function adjustTextareaSize(el) {
      const sw = el.scrollWidth;
      const cw = el.clientWidth;
      const w = sw > cw && 50 * (1 + (sw / 50 | 0));
      if (!w || w === cw) return;
      el.style.width = w + "px";
      const ovrX = el.scrollWidth > el.clientWidth;
      const numLines = el.value.split("\n").length + ovrX;
      numLines !== Number(el.rows) && (el.rows = numLines);
      el.style.overflowX = ovrX ? "" : "hidden";
    }
    function enableReplaceButtons(enabled) {
      if (stateDialog && stateDialog.dataset.type === "replace") for (const el of stateDialog.$$('[data-action^="replace"]')) el.disabled = !enabled;
    }
    function enableUndoButton(enabled) {
      if (stateDialog && stateDialog.dataset.type === "replace") for (const el of stateDialog.$$('[data-action="undo"]')) el.disabled = !enabled;
    }
    function focusUndoButton() {
      for (const btn of stateDialog.$$('[data-action="undo"]')) if (getComputedStyle(btn).display !== "none") {
        btn.focus();
        break;
      }
    }
    function getStateSafe(cm) {
      return cm.stateSearch || (cm.stateSearch = {});
    }
    function getContinuationPos({cm, reverse}) {
      var _;
      const cmSearchState = getStateSafe(cm);
      const posType = reverse ? "from" : "to";
      const searchPos = (_ = cmSearchState.searchPos) == null ? void 0 : _[posType];
      const cursorPos = cm.getCursor(posType);
      return !searchPos || src_cm.CodeMirror.cmpPos(cursorPos, cmSearchState.cursorPos[posType]) ? cursorPos : searchPos;
    }
    function getEOF(cm) {
      const line = cm.doc.size - 1;
      return {
        line,
        ch: cm.getLine(line).length
      };
    }
    function getNextEditor(cm, step = 1) {
      return lazyEditors ? editor.default.getEditorSibling(cm, step) : cm;
    }
    function setActiveEditor(cm) {
      if (cm.display.wrapper.contains(document.activeElement)) {
        stateCm = cm;
        stateOriginalFocus = cm;
      }
    }
    function makeTargetVisible(element) {
      const old = document.querySelector("." + TARGET_CLASS);
      if (old !== element) {
        if (old) {
          old.classList.remove(TARGET_CLASS);
          document.body.classList.remove("find-open");
        }
        if (element) {
          element.classList.add(TARGET_CLASS);
          document.body.classList.add("find-open");
        }
      }
    }
    function makeMatchVisible(cm, searchCursor) {
      const canFocus = !(stateFirstRun || stateDialog && stateDialog.contains(document.activeElement));
      stateCm = cm;
      const pos = searchCursor.pos;
      Object.assign(getStateSafe(cm), {
        cursorPos: {
          from: cm.getCursor("from"),
          to: cm.getCursor("to")
        },
        searchPos: pos,
        unclosedOp: !cm.curOp
      });
      cm.curOp || cm.startOperation();
      stateFirstRun || cm.jumpToPos(pos.from, pos.to);
      clearMarker();
      if (canFocus) {
        cm.focus();
        makeTargetVisible(null);
      } else {
        makeTargetVisible(cm.display.wrapper);
        stateMarker = cm.stateSearch.marker = cm.markText(pos.from, pos.to, {
          className: MATCH_CLASS,
          clearOnEnter: !0
        });
      }
    }
    function clearMarker() {
      stateMarker && stateMarker.clear();
    }
    function showTally(num, numApplies) {
      if (!stateTally) return;
      if (num === void 0) {
        num = 0;
        for (let cm of lazyEditors || stateEditors) {
          var _;
          if (lazyEditors) {
            if (cm.init) continue;
            cm = cm.cm;
          }
          const {annotate, overlay} = getStateSafe(cm);
          num += (annotate == null || (_ = annotate.matches) == null ? void 0 : _.length) || (overlay == null ? void 0 : overlay.numFound) || 0;
        }
        stateNumFound = num;
      }
      if (numApplies === void 0 && stateSearchInApplies && stateNumApplies < 0) {
        numApplies = 0;
        const elements = stateFind ? document.getElementsByClassName(APPLIES_VALUE_CLASS) : [];
        for (const el of elements) {
          const value = el.value;
          if (stateRX) {
            stateRX.lastIndex = 0;
            for (let m; (m = stateRX.exec(value)) && ++numApplies && stateRX.lastIndex > m.index; ) ;
          } else {
            let i = -1;
            for (;(i = value.indexOf(stateFind, i + 1)) >= 0; ) numApplies++;
          }
        }
        stateNumApplies = numApplies;
      } else numApplies = stateNumApplies;
      const newText = num + (numApplies > 0 ? "+" + numApplies : "");
      if (stateTally.textContent !== newText) {
        stateTally.textContent = newText;
        const newTitle = js_util.t("searchNumberOfResults" + (numApplies ? "2" : ""));
        stateTally.title !== newTitle && (stateTally.title = newTitle);
      }
    }
    function trimUndoHistory() {
      const history = stateUndoHistory;
      for (let last; last = history[history.length - 1]; ) {
        const undoables = last.filter(([cm, generation]) => document.body.contains(cm.display.wrapper) && !cm.isClean(generation));
        if (undoables.length) {
          history[history.length - 1] = undoables;
          break;
        }
        history.length--;
      }
    }
    function focusNoScroll(el) {
      if (el) {
        saveWindowScrollPos();
        el.focus({
          preventScroll: !0
        });
        restoreWindowScrollPos({
          immediately: !1
        });
      }
    }
    function saveWindowScrollPos() {
      stateScrollX = scrollX;
      stateScrollY = scrollY;
    }
    function restoreWindowScrollPos({immediately = !0} = {}) {
      immediately ? scrollX === stateScrollX && scrollY === stateScrollY || scrollTo(stateScrollX, stateScrollY) : Promise.resolve().then(restoreWindowScrollPos);
    }
    function radiateArray(focalIndex) {
      const arr = lazyEditors || stateEditors;
      if (focalIndex < 0 || focalIndex >= arr.length) return arr;
      const result = [ arr[focalIndex] ];
      const len = arr.length;
      for (let i = 1; i < len; i++) {
        focalIndex + i < len && result.push(arr[focalIndex + i]);
        focalIndex - i >= 0 && result.push(arr[focalIndex - i]);
      }
      return result;
    }
    function writeStorage() {
      storage_util.chromeLocal.getValue("editor").then((val = {}) => {
        val.find = stateFind;
        val.replace = stateReplace;
        val.icase = stateIcase;
        storage_util.chromeLocal.set({
          editor: val
        });
      });
    }
    (async () => {
      load_style.loading && await load_style.loading;
      ({find: stateFind = stateFind, replace: stateReplace = stateReplace, icase: stateIcase = stateIcase} = editor.default.state || {});
    })();
    var windowed_mode = oe(3160);
    window.on("beforeunload", e => {
      windowed_mode.isWindowed && (js_util.sessionStore.windowPos = JSON.stringify(dom_util.saveWindowPosition("openEditInWindow") || {}));
      msg_api.API.state.set("editorScrollInfo" + editor.default.style.id, editor.default.makeScrollInfo());
      const activeElement = document.activeElement;
      if (activeElement) {
        activeElement.blur();
        setTimeout(() => activeElement.focus());
      }
      (editor.default.dirty.isDirty() || [].some.call(document.$$(edit_util.helpPopup.SEL + " .CodeMirror"), el => !el.CodeMirror.isClean())) && (e.returnValue = js_util.t("styleChangesNotSaved"));
    });
    oe(5682);
    var js_urls = oe(7766);
    var util_webext = oe(5288);
    const cachedRegexps = new Map;
    const inputs = editor.default.regexps;
    const observe = (el, on) => el[on ? "on" : "off"]("input", update);
    let isWatching = !1;
    let popup;
    let note;
    [ "add", "delete" ].forEach((key, i) => {
      const fn = inputs[key];
      inputs[key] = el => {
        const res = fn.call(inputs, el);
        if (isWatching) {
          observe(el, !i);
          update();
        }
        return res;
      };
    });
    function toggle(state = !popup) {
      if (state && !popup) {
        if (!isWatching) {
          isWatching = !0;
          chrome.tabs.onRemoved.addListener(onTabRemoved);
          chrome.tabs.onUpdated.addListener(onTabUpdated);
          for (const el of inputs) observe(el, !0);
        }
        popup = edit_util.helpPopup.show(js_util.t("styleRegexpTestTitle"), " ", {
          className: "regexp-report"
        });
        popup.onClose.add(() => toggle(!1));
        update();
      } else if (!state && popup) {
        unwatch();
        popup._close.click();
        popup = null;
      }
    }
    async function update() {
      if (!popup) {
        unwatch();
        return;
      }
      const regexps = new Map;
      const ael = document.activeElement;
      for (const el of inputs) {
        const text = el.value;
        const old = regexps.get(text);
        const rxData = old || Object.assign({
          text
        }, cachedRegexps.get(text));
        rxData.urls || cachedRegexps.set(text, Object.assign(rxData, {
          rx: js_util.tryRegExp("^" + text + "$"),
          urls: new Map
        }));
        old && el !== ael || (rxData.el = el);
        old || regexps.set(text, rxData);
      }
      const getMatchInfo = m => m && {
        text: m[0],
        pos: m.index
      };
      const supported = (await browser.tabs.query({})).map(tab => tab.pendingUrl || tab.url).filter(js_urls.supported);
      const unique = [ ...new Set(supported).values() ];
      for (const rxData of regexps.values()) {
        const {rx, urls} = rxData;
        if (rx) {
          const urlsNow = new Map;
          for (const url of unique) {
            const match = urls.get(url) || getMatchInfo(url.match(rx));
            match && urlsNow.set(url, match);
          }
          rxData.urls = urlsNow;
        }
      }
      const stats = {
        full: {
          data: [],
          label: js_util.t("styleRegexpTestFull")
        },
        partial: {
          data: [],
          label: [ js_util.t("styleRegexpTestPartial"), localization.template.regexpTestPartial.cloneNode(!0) ]
        },
        none: {
          data: [],
          label: js_util.t("styleRegexpTestNone")
        },
        invalid: {
          data: [],
          label: js_util.t("styleRegexpTestInvalid")
        }
      };
      for (const {el, text, rx, urls} of regexps.values()) {
        if (!rx) {
          stats.invalid.data.push({
            el,
            text
          });
          continue;
        }
        if (!urls.size) {
          stats.none.data.push({
            el,
            text
          });
          continue;
        }
        const full = [];
        const partial = [];
        for (const [url, match] of urls.entries()) {
          const faviconUrl = url.startsWith(js_urls.ownRoot) ? util_webext.MF_ICON : js_urls.favicon(new URL(url).hostname);
          const icon = dom.$create("img", {
            src: faviconUrl
          });
          match.text.length === url.length ? full.push(dom.$create("a", {
            tabIndex: 0
          }, [ icon, url ])) : partial.push(dom.$create("a", {
            tabIndex: 0
          }, [ icon, url.substr(0, match.pos), dom.$create("mark", match.text), url.substr(match.pos + match.text.length) ]));
        }
        full.length && stats.full.data.push({
          el,
          text,
          urls: full
        });
        partial.length && stats.partial.data.push({
          el,
          text,
          urls: partial
        });
      }
      const report = document.createElement("div");
      for (const type in stats) {
        const {label, data} = stats[type];
        if (!data.length) continue;
        const h3 = document.createElement("h3");
        const block = document.createElement("details");
        report.appendChild(block).appendChild(document.createElement("summary")).appendChild(h3);
        block.open = !report.firstChild;
        block.dataset.type = type;
        h3.textContent = label;
        h3.dataset.num = data.length;
        for (const {el, text, urls} of data) block.appendChild(urls ? dom.$create("article", [ dom.$create("h4", {
          _source: el
        }, text), ...urls ]) : dom.$create("a", {
          tabIndex: 0,
          _source: el
        }, text));
      }
      note || (note = dom.$create("div.regexp-report-note", `${js_util.t("styleRegexpTestNoteStar")} ${js_util.t("styleRegexpTestNote")}`.split(/(<[^>]+>|\\+)/).map((s, i) => i % 2 ? dom.$create("code", s[0] === "<" ? s.slice(1, -1) : s) : s)));
      popup._contents.firstChild.replaceWith(report);
      report.onclick = onClick;
      report.contains(note) || report.append(note);
    }
    function onClick(event) {
      let el = event.target;
      if (el._source) el._source.focus(); else if (el = el.closest("a")) {
        event.preventDefault();
        msg_api.API.tabs.open({
          url: el.href || el.textContent,
          currentWindow: null
        });
      }
    }
    function onTabRemoved() {
      update();
    }
    function onTabUpdated(tabId, info) {
      info.url && update();
    }
    function unwatch() {
      if (isWatching) {
        chrome.tabs.onRemoved.removeListener(onTabRemoved);
        chrome.tabs.onUpdated.removeListener(onTabUpdated);
        for (const el of inputs) observe(el, !1);
        isWatching = !1;
      }
    }
    document.getElementById("testRE").onclick = () => toggle();
  },
  1320(_, ee, oe) {
    oe(5682);
    const chromeLocal = Object.assign(browser.storage.local, {
      async getValue(key) {
        return (await this.get(key))[key];
      }
    });
    const chromeSession = browser.storage.session;
    ee.GET_KEYS = !!chromeLocal.getKeys;
    ee.chromeLocal = chromeLocal;
    ee.chromeSession = chromeSession;
  }
} ]);