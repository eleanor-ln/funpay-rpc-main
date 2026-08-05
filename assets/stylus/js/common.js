"use strict";

(() => {
  const global = this;
  var _ = {
    9458() {
      global.browser = chrome;
    },
    7033(_, ee, oe) {
      ee.getLZValues = async (keys = Object.values(LZ_KEY)) => {
        const data = await get(keys);
        for (const key of keys) {
          const value = data[key];
          data[key] = value && unLZ(value);
        }
        return data;
      };
      var streamData, streamDataVal, streamDataPosition, streamBitsPerChar, streamGetCharFromInt, i = 0, reverseDict = {}, fromCharCode = String.fromCharCode, base = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+", Base64CharArray = (base + "/=").split(""), UriSafeCharArray = (base + "-$").split("");
      for (;i < 65; ) {
        i > 62 && (reverseDict[UriSafeCharArray[i].charCodeAt(0)] = i);
        reverseDict[Base64CharArray[i].charCodeAt(0)] = i++;
      }
      function streamBits(value, numBitsMask) {
        for (var i = 0; numBitsMask >>= 1; i++) {
          streamDataVal = value >> i & 1 | streamDataVal << 1;
          if (++streamDataPosition === streamBitsPerChar) {
            streamDataPosition = 0;
            streamData.push(streamGetCharFromInt(streamDataVal));
            streamDataVal = 0;
          }
        }
      }
      function getCharFromUTF16(a) {
        return fromCharCode(a + 32);
      }
      function _compress(uncompressed, bitsPerChar, getCharFromInt) {
        streamData = [];
        if (uncompressed != null) {
          streamDataVal = 0;
          streamDataPosition = 0;
          streamBitsPerChar = bitsPerChar;
          streamGetCharFromInt = getCharFromInt;
          var j = 0, k = 0, value = 0, node = [ 3 ], dictionary = [ 2, 2, node ], freshNode = !0, c = 0, dictSize = 3, numBitsMask = 4;
          if (uncompressed.length) {
            streamBits(value = (c = uncompressed.charCodeAt(0)) < 256 ? 0 : 1, numBitsMask);
            streamBits(c, value ? 65536 : 256);
            dictionary[1] = c;
            e: for (j = 1; j < uncompressed.length; j++) {
              c = uncompressed.charCodeAt(j);
              for (k = 1; k < node.length; k += 2) if (node[k] == c) {
                node = node[k + 1];
                continue e;
              }
              freshNode ? freshNode = !1 : streamBits(node[0], numBitsMask);
              k = 1;
              for (;dictionary[k] != c && k < dictionary.length; ) k += 2;
              if (k == dictionary.length) {
                ++dictSize >= numBitsMask && (numBitsMask <<= 1);
                streamBits(value = c < 256 ? 0 : 1, numBitsMask);
                streamBits(c, value ? 65536 : 256);
                dictionary.push(c);
                dictionary.push([ dictSize ]);
                freshNode = !0;
              }
              node.push(c);
              node.push([ ++dictSize ]);
              dictSize >= numBitsMask && (numBitsMask <<= 1);
              node = dictionary[k + 1];
            }
            freshNode ? freshNode = !1 : streamBits(node[0], numBitsMask);
            k = 1;
            for (;dictionary[k] != c && k < dictionary.length; ) k += 2;
            if (k == dictionary.length) {
              ++dictSize >= numBitsMask && (numBitsMask <<= 1);
              streamBits(value = c < 256 ? 0 : 1, numBitsMask);
              streamBits(c, value ? 65536 : 256);
            }
            ++dictSize >= numBitsMask && (numBitsMask <<= 1);
          }
          streamBits(2, numBitsMask);
          streamData.push(streamGetCharFromInt(streamDataVal <<= streamBitsPerChar - streamDataPosition));
        }
        return streamData;
      }
      function _decompress(length, resetBits, getNextValue) {
        var c, dictionary = [ 0, 1, 2 ], enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], w = "", bits = 0, maxpower = 2, power = 0, data_val = getNextValue(0), data_position = resetBits, data_index = 1;
        for (;power != maxpower; ) {
          bits += (data_val >> --data_position & 1) << power++;
          if (data_position == 0) {
            data_position = resetBits;
            data_val = getNextValue(data_index++);
          }
        }
        if (bits == 2) return "";
        maxpower = bits * 8 + 8;
        bits = power = 0;
        for (;power != maxpower; ) {
          bits += (data_val >> --data_position & 1) << power++;
          if (data_position == 0) {
            data_position = resetBits;
            data_val = getNextValue(data_index++);
          }
        }
        c = fromCharCode(bits);
        dictionary[3] = c;
        w = c;
        result.push(c);
        for (;data_index <= length; ) {
          maxpower = numBits;
          bits = power = 0;
          for (;power != maxpower; ) {
            bits += (data_val >> --data_position & 1) << power++;
            if (data_position == 0) {
              data_position = resetBits;
              data_val = getNextValue(data_index++);
            }
          }
          if (bits < 2) {
            maxpower = 8 + 8 * bits;
            bits = power = 0;
            for (;power != maxpower; ) {
              bits += (data_val >> --data_position & 1) << power++;
              if (data_position == 0) {
                data_position = resetBits;
                data_val = getNextValue(data_index++);
              }
            }
            dictionary[dictSize] = fromCharCode(bits);
            bits = dictSize++;
            --enlargeIn == 0 && (enlargeIn = 1 << numBits++);
          } else if (bits == 2) return result.join("");
          if (bits > dictionary.length) return null;
          entry = bits < dictionary.length ? dictionary[bits] : w + w.charAt(0);
          result.push(entry);
          dictionary[dictSize++] = w + entry.charAt(0);
          w = entry;
          --enlargeIn == 0 && (enlargeIn = 1 << numBits++);
        }
        return "";
      }
      function compressToUTF16(input) {
        if (input == null) return "";
        var compressed = _compress(input, 15, getCharFromUTF16);
        compressed.push(" ");
        return compressed.join("");
      }
      oe(9458);
      var util = oe(6940);
      const syncApi = browser.storage.sync;
      const kMAX = "MAX_WRITE_OPERATIONS_PER_MINUTE";
      const LZ_KEY = {
        csslint: "editorCSSLintConfig",
        stylelint: "editorStylelintConfig",
        usercssTemplate: "usercssTemplate"
      };
      const remove = run.bind(syncApi.remove);
      const get = syncApi.get.bind(syncApi);
      const set = run.bind(syncApi.set);
      const toLZ = value => value && compressToUTF16(JSON.stringify(value));
      const unLZ = val => {
        return util.tryJSONparse((compressed = val) == null ? "" : compressed == "" ? null : _decompress(compressed.length, 15, index => compressed.charCodeAt(index) - 32));
        var compressed;
      };
      let busy;
      async function run(...args) {
        for (;;) try {
          if (!busy) return await (busy = this.apply(syncApi, args));
          await busy.catch(() => 0);
        } catch (_) {
          if (!_.message.includes(kMAX)) throw _;
          busy = util.sleep(6e4 / (syncApi[kMAX] || 120) * (Math.random() * 2 + 1));
          await 1;
        } finally {
          busy = null;
        }
      }
      ee.LZ_KEY = LZ_KEY;
      ee.get = get;
      ee.getLZValue = async key => unLZ((await get(key))[key]);
      ee.remove = remove;
      ee.set = set;
      ee.setLZValue = (key, value) => set({
        [key]: toLZ(value)
      });
      ee.setLZValues = data => set(util.mapObj(data, toLZ, Object.values(LZ_KEY)));
    },
    9421(_, ee, oe) {
      ee.default = (ver1, ver2) => {
        const [, main1 = ver1 || "", pre1] = VERSION_RE.exec(ver1);
        const [, main2 = ver2 || "", pre2] = VERSION_RE.exec(ver2);
        const delta = compareVersionChunk(main1, main2) || !pre1 - !pre2 || pre1 && compareVersionChunk(pre1, pre2, !0);
        return Math.sign(delta || 0);
      };
      const VERSION_RE = /^(.*?)-([-.0-9a-z]+)|$/i;
      const DIGITS_RE = /^\d+$/;
      function compareVersionChunk(ver1, ver2, isSemverMode) {
        const parts1 = ver1.split(".");
        const parts2 = ver2.split(".");
        const len1 = parts1.length;
        const len2 = parts2.length;
        const len = (isSemverMode ? Math.min : Math.max)(len1, len2);
        let delta;
        for (let i = 0; !delta && i < len; i += 1) {
          const a = parts1[i];
          const b = parts2[i];
          delta = isSemverMode ? DIGITS_RE.test(a) && DIGITS_RE.test(b) ? a - b : a > b || a < b && -1 : (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0);
        }
        return delta || isSemverMode && len1 - len2;
      }
    },
    4188(_, ee, oe) {
      oe.d(ee, {});
      ee.SWATCH_PROP = "--colorview-swatch";
      ee.kTabOvrToggle = "tabOvr*";
      ee.pEditorLinterOn = "editor.linter.on";
    },
    4429(_, ee, oe) {
      ee.default = async function(style, y) {
        let saving, savingScheduled;
        let bodyStyle;
        let vars;
        let ucd, varsHash, varNames, varsInitial;
        if (typeof style == "number" && !(style = await he.API.styles.getCore({
          id: style,
          vars: !0
        }))) return;
        init(!1, !1);
        const isPopup = document.body.id === "stylus-popup";
        const colorpicker = vars.some(v => v.type === "color") ? (0, ae.default)() : null;
        const elBody = le.$create(".config-body");
        const btnSave = le.$create("button[data-cmd=save]", {
          disabled: !0,
          onclick: save
        }, xe.t("confirmSave"));
        const btnDefault = le.$create("button[data-cmd=default]", {
          disabled: !0,
          onclick: () => {
            for (const va of vars) {
              va.value = null;
              onchange({
                target: va.input
              });
            }
            renderValues();
          },
          title: xe.t("optionsReset")
        }, xe.t("genericResetLabel"));
        const btnClose = le.$create("button[data-cmd=close]", xe.t("confirmClose"));
        let elCfg;
        return pe.messageBox.show({
          title: `${style.customName || style.name} v${ucd.version}`,
          className: "config-dialog" + (isPopup ? " center-dialog" : ""),
          contents: [ le.$create(".config-heading", ucd.supportURL && le.$createLink({
            className: ".external-support",
            href: ucd.supportURL
          }, xe.t("externalFeedback"))), elBody ],
          buttons: [ btnSave, btnDefault, btnClose ],
          onshow: box => {
            elCfg = box;
            elCfg.dataset.styleName = style.name;
            box._buttons.$("button").after(le.$create("label#config-autosave-wrapper", {
              title: xe.t("configOnChangeTooltip")
            }, [ le.$create("input", {
              id: "config.autosave",
              type: "checkbox"
            }), xe.t("configOnChange") ]));
            ue.setupLivePrefs([ "config.autosave" ]);
            box.on("change", onchange);
            init(null, box);
          }
        }).then(onhide);
        function getInitialValues(source) {
          const data = {};
          for (const name of varNames) {
            const va = source[name];
            data[name] = isDefault(va) ? va.default : va.value;
          }
          return data;
        }
        function init(newUCD, box = elCfg) {
          if (newUCD || !ucd) {
            ucd = newUCD || style.usercssData;
            Object.defineProperty(style, "usercssData", {
              get: () => ucd,
              set: init
            });
            varsHash = xe.deepCopy(ucd.vars) || {};
            varNames = Object.keys(varsHash);
            vars = varNames.map(name => varsHash[name]);
            varsInitial = getInitialValues(varsHash);
          }
          if (box) {
            elBody.textContent = "";
            buildConfigForm();
            renderValues();
            vars.forEach(renderValueState);
            box.style.setProperty("--num", vars.length);
            isPopup && adjustSizeForPopup(box);
            updateButtons();
            (el = document.getElementById("message-box-contents")).classList.toggle("sb-overlay", el.offsetWidth === el.clientWidth && el.scrollHeight > el.clientHeight);
          }
          var el;
        }
        function onhide() {
          Object.defineProperty(style, "usercssData", {
            value: ucd,
            writable: !0
          });
          bodyStyle != null && (document.body.style.cssText = bodyStyle);
          colorpicker?.hide();
        }
        function onchange({target, justSaved = !1}) {
          const va = target.va;
          if (va) {
            va.dirty = varsInitial[va.name] !== (isDefault(va) ? va.default : va.value);
            if (ye.__values["config.autosave"] && !justSaved) {
              savingScheduled ||= xe.debounce(save, 400, {
                anyChangeIsDirty: !0
              });
              return;
            }
            renderValueState(va);
            justSaved || updateButtons();
          }
        }
        function updateButtons() {
          const someDirty = vars.some(va => va.dirty);
          btnSave.disabled = !someDirty;
          btnDefault.disabled = vars.every(isDefault);
          btnClose.textContent = xe.t(someDirty ? "confirmCancel" : "confirmClose");
        }
        async function save({anyChangeIsDirty = !1} = {}) {
          saving && await saving;
          savingScheduled = !1;
          if (!vars.some(va => va.dirty || anyChangeIsDirty && va.value !== va.savedValue)) return;
          const {id} = style;
          const bgStyle = id ? await he.API.styles.getCore({
            id,
            vars: !0
          }).catch(xe.NOP) : {};
          if (!bgStyle) {
            btnClose.click();
            return;
          }
          style.enabled = !0;
          const styleVars = style.usercssData.vars;
          const bgVars = id ? bgStyle.usercssData?.vars || {} : styleVars;
          const invalid = [];
          let numValid = 0;
          for (const va of vars) {
            const bgva = bgVars[va.name];
            let error;
            if (bgva) if (bgva.type !== va.type) error = [ "type ", "*" + va.type, " != ", "*" + bgva.type ]; else {
              if (va.type !== "select" && va.type !== "dropdown" || isDefault(va) || !bgva.options.every(o => o.name !== va.value)) {
                if (va.dirty || anyChangeIsDirty && va.value !== va.savedValue) {
                  styleVars[va.name].value = va.value;
                  va.savedValue = va.value;
                  numValid++;
                  continue;
                }
                continue;
              }
              error = `'${va.value}' not in the updated '${va.type}' list`;
            } else {
              error = "deleted";
              delete styleVars[va.name];
            }
            invalid.push([ "*" + va.name, ": ", ...error ].map(e => e[0] === "*" && le.$create("b", e.slice(1)) || e));
            bgva && (styleVars[va.name].value = xe.deepCopy(bgva));
          }
          if (invalid.length) {
            onhide();
            pe.messageBox.alert([ le.$create("div", {
              style: "max-width: 34em"
            }, xe.t("usercssConfigIncomplete")), le.$create("ol", {
              style: "text-align: left"
            }, invalid.map(msg => le.$create("li", msg))) ], "pre");
          }
          if (numValid) {
            try {
              const newVars = id ? await (saving = he.API.usercss.configVars(id, styleVars)) : styleVars;
              varsInitial = getInitialValues(newVars);
              vars.forEach(va => onchange({
                target: va.input,
                justSaved: !0
              }));
              renderValues();
              updateButtons();
              elCfg.$(".config-error")?.remove();
            } catch (_) {
              const el = elCfg.$(".config-error") || elCfg._buttons.insertAdjacentElement("afterbegin", le.$create(".config-error"));
              el.textContent = el.title = (Array.isArray(_) ? _ : [ _ ]).map(e => e.stack || e.message || `${e}`).join("\n");
            }
            saving = !1;
          }
        }
        function isDefault(va) {
          return va.value === null || va.value === void 0 || va.value === va.default;
        }
        function buildConfigForm() {
          const elements = [];
          let resetter = le.$create("a.config-reset-icon", {
            tabIndex: 0,
            title: xe.t("genericResetLabel")
          }, le.$create("i.i-close"));
          for (const va of vars) {
            let children;
            switch (va.type) {
             case "color":
              children = [ le.$create(".colorview-swatch.config-value", [ va.input = le.$create("a.color-swatch", {
                va,
                tabIndex: 0,
                onclick: showColorpicker
              }) ]) ];
              break;

             case "checkbox":
              children = [ va.input = le.$create("input.slider.config-value", {
                va,
                type: "checkbox",
                onchange: updateVarOnChange
              }) ];
              break;

             case "select":
             case "dropdown":
             case "image":
              children = [ le.$create(".select-wrapper.config-value", [ va.input = le.$create("select", {
                va,
                onchange: updateVarOnChange
              }, va.options.map(o => le.$create("option", {
                value: o.name
              }, o.label))) ]) ];
              break;

             case "range":
             case "number":
              {
                const options = {
                  va,
                  type: va.type,
                  onfocus: va.type === "number" ? selectAllOnFocus : null,
                  onblur: va.type === "number" ? updateVarOnBlur : null,
                  onchange: updateVarOnChange,
                  oninput: updateVarOnChange,
                  required: !0
                };
                typeof va.min == "number" && (options.min = va.min);
                typeof va.max == "number" && (options.max = va.max);
                typeof va.step == "number" && isFinite(va.step) && (options.step = va.step);
                children = [ va.type === "range" && le.$create("span.current-value"), va.input = le.$create("input.config-value", options) ].filter(Boolean);
                break;
              }

             default:
              children = [ va.input = le.$create("input.config-value", {
                va,
                type: va.type,
                onchange: updateVarOnChange,
                oninput: updateVarOnChange,
                onfocus: selectAllOnFocus
              }) ];
            }
            resetter = resetter.cloneNode(!0);
            resetter.va = va;
            resetter.onclick = resetOnClick;
            const {label} = va;
            const i = label.indexOf("\n");
            const labelGuts = [ fe.breakWord(i > 0 ? label.slice(0, i).trim() : label) ];
            i > 0 && labelGuts.push(le.$create("a.icon[data-cmd=note][tabindex=0]", {
              title: label.slice(i + 1).trim()
            }, le.$create("i.i-info")));
            elements.push(le.$create(`label.config-${va.type}[data-var=${va.name}]`, [ le.$create("span.config-name", labelGuts), ...children, resetter ]));
            va.savedValue = va.value;
          }
          elBody.append(...elements);
        }
        function updateVarOnBlur() {
          this.value = isDefault(this.va) ? this.va.default : this.va.value;
        }
        function updateVarOnChange(ev) {
          let val;
          if (this.type === "text") val = this.value; else if (this.type === "range") {
            val = this.valueAsNumber;
            updateRangeCurrentValue(this.va, this.value);
          } else {
            if (this.type !== "number") {
              this.va.value = this.type !== "checkbox" ? this.value : this.checked ? "1" : "0";
              return;
            }
            if (!this.reportValidity()) return;
            val = this.valueAsNumber;
          }
          if (!Number.isNaN(val)) {
            this.va.value = val;
            ev.type === "input" && onchange(ev);
          }
        }
        function updateRangeCurrentValue(va, value) {
          const span = va.input.closest(".config-range").$(".current-value");
          span && (span.textContent = value + (va.units || ""));
        }
        function selectAllOnFocus() {
          this.select();
        }
        function renderValues(varsToRender = vars) {
          for (const va of varsToRender) {
            if (va.input === document.activeElement) continue;
            const value = isDefault(va) ? va.default : va.value;
            if (va.type === "color") {
              va.input.style.backgroundColor = value;
              colorpicker.options.va === va && colorpicker.setColor(value);
            } else if (va.type === "checkbox") va.input.checked = Number(value); else if (va.type === "range") {
              va.input.value = value;
              updateRangeCurrentValue(va, va.input.value);
            } else va.input.value = value;
            ye.__values["config.autosave"] || renderValueState(va);
          }
        }
        function renderValueState(va) {
          const el = va.input.closest("label");
          el.classList.toggle("dirty", Boolean(va.dirty));
          el.classList.toggle("nondefault", !isDefault(va));
          el.$(".config-reset-icon").disabled = isDefault(va);
        }
        function resetOnClick(event) {
          event.preventDefault();
          this.va.value = null;
          renderValues([ this.va ]);
          onchange({
            target: this.va.input
          });
        }
        function showColorpicker(event) {
          event.preventDefault();
          pe.messageBox.pauseAll();
          const r = this.getBoundingClientRect();
          colorpicker.show({
            va: this.va,
            color: this.va.value || this.va.default,
            top: Math.min(r.bottom, innerHeight - 220),
            right: innerWidth - r.left - 10,
            guessBrightness: elCfg._body,
            callback: onColorChanged
          });
        }
        function onColorChanged(newColor) {
          if (newColor) {
            this.va.value = newColor;
            this.va.input.style.backgroundColor = newColor;
            this.va.input.dispatchEvent(new Event("change", {
              bubbles: !0
            }));
          }
          xe.debounce(restoreEscInDialog);
        }
        function restoreEscInDialog() {
          document.querySelector(".colorpicker-popup") || pe.messageBox.pauseAll(!1);
        }
        function adjustSizeForPopup(box) {
          const contents = box.firstElementChild;
          contents.style = pe.important("max-width: none; max-height: none;");
          let {offsetWidth: width, offsetHeight: height} = contents;
          contents.style = "";
          if (Ce.MOBILE || xe.isSidebar) {
            y + height < innerHeight && (box.style.cssText = `padding-top:${y}px; justify-content: center;`);
            return;
          }
          const dpr = devicePixelRatio;
          const elPicker = document.body.appendChild(le.$create(".colorpicker-popup", {
            style: "display: none!important"
          }));
          const PADDING = 50 / dpr;
          const MIN_WIDTH = parseFloat(getComputedStyle(elPicker).width) || 350 / dpr;
          const MIN_HEIGHT = 250 / dpr + PADDING;
          elPicker.remove();
          const bs = document.body.style;
          width = xe.clamp(width + PADDING, MIN_WIDTH, 798 / dpr);
          height = xe.clamp(height + PADDING, MIN_HEIGHT, parseInt(bs.maxHeight) || 598 / dpr);
          bodyStyle = bs.cssText;
          bs.cssText = bodyStyle.replace(/((min|max)-width|min-height)\s*:[^;]+|;\s*$/g, "") + `;\n      min-width:${width}px !important;\n      min-height:${height}px !important;`;
          box.classList.add("center-dialog");
        }
      };
      var ae = oe(8976);
      var le = oe(7986);
      var ue = oe(7393);
      var pe = oe(6518);
      var fe = oe(7501);
      var he = oe(4930);
      var ye = oe(492);
      var xe = oe(6940);
      var Ce = oe(8970);
    },
    8421(_, ee, oe) {
      oe.d(ee, {
        elError: () => elError
      });
      var ae = oe(7986);
      var le = oe(8982);
      var ue = oe(6940);
      var pe = oe(1480);
      const fe = showUnhandledError;
      let elError;
      let elEntry;
      window.onerror = window.onunhandledrejection = showUnhandledError;
      function showUnhandledError(a, b, c, d, err = a) {
        err = err.reason || err;
        if (!elError) {
          elError = ae.$create("#unhandledError", [ ae.$create("a", {
            title: ue.t("copy"),
            tabIndex: 0
          }, ae.$create("i.i-copy")), ae.$create("a", {
            title: ue.t("confirmClose"),
            tabIndex: 0
          }, ae.$create("i.i-close")) ]);
          elEntry = ae.$create("details", [ ae.$create("summary", [ document.createElement("span"), ae.$create("a", {
            target: "_blank",
            rel: "noopener",
            tabIndex: 0
          }, ue.t("reportBug")) ]), document.createElement("pre") ]);
          const formatText = target => "```\n" + [].map.call((target?.closest("details") || elError).$$("span, pre"), (_, i) => _.textContent + (i % 2 ? "\n" : "")).join("\n").trim() + "\n```\n\n- UA: " + navigator.userAgent.replace(/\(KHTML.+?\) |(Mozilla|AppleWebKit|Gecko)\S+ | Safari\/537\.36/g, "") + `\n- Stylus: ${pe.MF.version} (MV3)\n`;
          const onauxclick = elError.onauxclick = async (evt, target = evt.target) => {
            if (target.href !== "") return;
            evt.preventDefault();
            target.disabled = !0;
            const title = location.pathname.slice(1, -5) + ": " + target.parentElement.$("span").innerText;
            let url;
            try {
              url = "https://api.github.com/search/issues?q=" + encodeURIComponent(title) + "+in:title+repo:openstyles/stylus+is:issue&sort=created&order=asc&per_page=1";
              url = (await (await fetch(url, {
                headers: {
                  Accept: "application/vnd.github+json"
                }
              })).json()).items[0].html_url;
            } catch {
              url = "https://github.com/openstyles/stylus/issues/new?" + new URLSearchParams({
                title,
                labels: "bug",
                body: formatText(target)
              });
            }
            target.href = url;
            target.disabled = !1;
            evt.button < 2 && target.click();
          };
          elError.onclick = evt => {
            const {target} = evt;
            if (target.rel) return onauxclick(evt, target);
            if (target !== elError && !target.closest("details")) {
              target.$(".i-copy") && navigator.clipboard.writeText(formatText());
              elError.remove();
            }
          };
        }
        const msg = `${err.message || err}`.trim().split(le.ownRoot).join("");
        let el = [].find.call(elError.$$("summary span"), s => s.innerText === msg);
        if (el) el.dataset.num = (+el.dataset.num || 1) + 1; else {
          el = (a = err.stack) ? elEntry.cloneNode(!0) : document.createElement("b");
          elError.append(el);
          if (a) {
            el.$("pre").textContent = a.replace(msg, "").replace(/^(?!\s)/gm, "  ") || "";
            el = el.$("span");
          }
          el.innerText = msg;
        }
        ae.$root.appendChild(elError);
      }
      ee.default = fe;
    },
    9073(_, ee, oe) {
      oe.d(ee, {
        mqCompact: () => mqCompact
      });
      var msg_api = oe(4930);
      var util = oe(6940);
      var dom = oe(7986);
      var dom_util = oe(6518);
      var header_resizer = oe(8346);
      var localization = oe(7501);
      var prefs = oe(492);
      var ua = oe(8970);
      oe(8421);
      oe(963);
      oe(6990);
      oe(1949);
      oe(1480);
      var msg = oe(3619);
      const CLASS = "stylus";
      const PREFIX = CLASS + "-";
      const MEDIA = "screen, " + PREFIX;
      const kAss = "adoptedStyleSheets";
      const own = {
        cfg: {
          off: !1,
          top: ""
        }
      };
      const runtime = chrome.runtime;
      const assDoc = document;
      const docRootObserver = (onChange => {
        let observing = !1;
        const observer = new MutationObserver(onChange);
        return {
          start,
          stop,
          restart: () => {
            if (observing) {
              stop();
              start();
            }
          }
        };
        function start() {
          if (!observing && !ass) {
            observer.observe(root, {
              childList: !0
            });
            observing = !0;
          }
        }
        function stop() {
          if (observing) {
            observer.disconnect();
            observing = !1;
          }
        }
      })(restoreOrder);
      const toSafeChar = c => String.fromCharCode(65280 + c.charCodeAt(0) - 32);
      const list = [];
      const randomIds = {};
      const calcOrder = ({id}) => orderPrio[id] * 1e6 || orderMain[id] || id + 5e5;
      const compare = (a, b) => calcOrder(a) - calcOrder(b);
      const table = new Map;
      let ass;
      let assV2;
      let assIndexOf;
      let root = document.documentElement;
      let isEnabled = !0;
      let isTransitionPatched;
      let exposeStyleName;
      let ffCsp;
      let nonce = "";
      let reorderCnt = 0;
      let reorderStart = 0;
      let creationDoc, createElement, createElementNS;
      let orderPrio, orderMain;
      let onInjectorUpdate, selfDestruct;
      function shutdown() {
        if (list.length) {
          toggleObservers(!1);
          removeAllElements();
          list.length = 0;
          table.clear();
        }
      }
      function removeId(id) {
        removeStyle(table.get(id)) && emitUpdate();
      }
      function toggle(enable) {
        if (isEnabled !== (enable = !!enable)) {
          isEnabled = enable;
          enable ? addAllElements() : removeAllElements();
        }
      }
      function addElement(el, before) {
        if (ass) {
          const sheets = assV2 || !1;
          let i = assIndexOf(sheets, el);
          i >= 0 && (el = sheets.splice(i, 1)[0]);
          i = before ? assIndexOf(sheets, before) : -1;
          i >= 0 ? sheets.splice(i, 0, el) : sheets.push(el);
        } else updateRoot().insertBefore(el, before);
        return el;
      }
      function addAllElements() {
        if (list.length) {
          toggleObservers(!1);
          ass ? replaceAss(!0) : updateRoot().append(...list.map(s => s.el));
          toggleObservers(!0);
        }
      }
      function removeElement(el) {
        if (el.remove) el.remove(); else if (ass) {
          const sheets = assV2 || !1;
          const i = assIndexOf(sheets, el);
          i >= 0 && sheets.splice(i, 1);
        }
      }
      function removeAllElements() {
        toggleObservers(!1);
        if (ass) replaceAss(); else for (const {el} of list) removeElement(el);
      }
      function replaceAss(readd) {
        const elems = list.map(s => s.el);
        const res = [];
        for (let el, arr = assV2 || !1, i = 0; i < arr.length && (el = arr[i]); i++) assIndexOf(elems, el) < 0 && res.push(el);
        readd && res.push(...elems);
        assDoc[kAss] = res;
      }
      function apply({cfg, sections}, isReplace) {
        cfg && updateConfig(cfg);
        if (!sections) return;
        const ids = isReplace && new Set;
        let old;
        for (const style of sections) {
          const {id, code} = style;
          const codeStr = Array.isArray(code) ? style.code = code.join("") : code;
          old = table.get(id);
          if (old) {
            if (old.code !== codeStr || exposeStyleName && old.name !== style.name) {
              old.code = codeStr;
              setTextAndName(old.el, style);
              old.el.disabled = !1;
            }
          } else {
            style.el = createStyle(style);
            table.set(id, style);
            const i = list.findIndex(item => calcOrder(item) > calcOrder(style));
            list.splice(i < 0 ? list.length : i, 0, style);
          }
          isReplace && ids.add(id);
        }
        toggleObservers(!1);
        if (isReplace && list.length > ids.size) for (let s, i = list.length; --i >= 0; ) ids.has((s = list[i]).id) || removeStyle(s);
        if (isEnabled) {
          isTransitionPatched || applyTransitionPatch(sections);
          restoreOrder();
        }
        emitUpdate();
      }
      function applyTransitionPatch(styles) {
        isTransitionPatched = !0;
        if (document.readyState === "complete" || document.visibilityState === "hidden" || !styles.some(s => s.code.includes("transition"))) return;
        const el = createStyle({
          id: "transition-patch",
          code: ":not(#\\0):not(#\\0) { transition: none !important }"
        });
        addElement(el);
        requestAnimationFrame(() => setTimeout(removeElement, 0, el));
      }
      function createStyle(style) {
        let el;
        let {id} = style;
        if (ass) {
          exposeStyleName || (id = randomIds[id] ??= Math.random().toString(36).slice(2));
          id = MEDIA + id;
          el = new CSSStyleSheet({
            media: id
          });
          setTextAndName(el, style);
          for (let m, arr = assV2 || !1, i = 0; i < arr.length; i++) (m = arr[i].media).mediaText === id && (m.mediaText += "-old");
          return el;
        }
        if (!creationDoc && (el = initCreationDoc())) return el;
        el = createElement("style");
        nonce && (el.nonce = nonce);
        id && exposeStyleName && (id = el.id = `${PREFIX}${id}`);
        el.classList.add(CLASS);
        setTextAndName(el, style);
        return el;
      }
      function setTextAndName(el, {id, code, name}) {
        if (ass) try {
          el.replaceSync(code);
        } catch {
          el.replace(code);
        } else {
          if (exposeStyleName && name) {
            el.dataset.name !== name && (el.dataset.name = name);
            name = encodeURIComponent(name.replace(/[?#/']/g, toSafeChar));
            code += `\n/*# sourceURL=${runtime.getURL(name)}.user.css#${id}${window !== top ? "#" + Math.random().toString(36).slice(2) : ""} */`;
          }
          (el.firstChild || el).textContent = code;
        }
      }
      function toggleObservers(shouldStart) {
        if (ass && shouldStart) return;
        docRootObserver[shouldStart && isEnabled ? "start" : "stop"]();
      }
      function emitUpdate() {
        toggleObservers(list.length);
        onInjectorUpdate();
      }
      function initAss() {
        if (!assIndexOf) {
          Object.isExtensible(ass) && (assV2 = ass);
          assIndexOf = Object.call.bind([].indexOf);
        }
      }
      function initCreationDoc(style) {
        creationDoc = document;
        for (let ok, retry = 0; !ok && retry < 2; retry++) {
          createElement = creationDoc.createElement.bind(creationDoc);
          createElementNS = creationDoc.createElementNS.bind(creationDoc);
          return;
        }
      }
      function removeStyle(style) {
        if (style) {
          table.delete(style.id);
          list.splice(list.indexOf(style), 1);
          removeElement(style.el);
          return !0;
        }
      }
      function restoreOrder(mutations) {
        if (!runtime.id) return selfDestruct();
        let bad;
        let el = list.length && list[0].el;
        if (el) if (ass) {
          for (let len = list.length, base = ass.length - len, i = 0; i < len; i++) if (base < 0 || ass[base + i] !== list[i].el) {
            bad = !0;
            break;
          }
        } else if (el.parentNode !== creationDoc.documentElement) bad = !0; else {
          let i = 0;
          let tag;
          for (;el; ) {
            if (i < list.length && el === list[i].el) i++; else if ((tag = el.localName) && (tag === "link" ? el.relList.contains("stylesheet") : tag === "head" || tag === "body" || tag === "frameset" || el.firstElementChild && el.querySelector('style, link[rel~="stylesheet"]'))) {
              bad = !0;
              break;
            }
            el = el.nextElementSibling;
          }
          i < list.length && (bad = !0);
        } else bad = !1;
        if (!bad) return;
        !mutations || ++reorderCnt < 10 ? addAllElements() : console.debug("Stylus ignored wrong order of styles to avoid an infinite loop of mutations.");
        const t = performance.now();
        if (t - reorderStart > 250) {
          reorderCnt = 0;
          reorderStart = t;
        }
      }
      function sort() {
        list.sort(compare);
        isEnabled && addAllElements();
      }
      function updateConfig(cfg) {
        exposeStyleName = cfg.name;
        nonce = cfg.nonce || nonce;
        ffCsp = !nonce && !1;
        ({main: orderMain = {}, prio: orderPrio = {}} = cfg.order || {});
        if (!ass != !cfg.ass) {
          removeAllElements();
          ass = ass ? null : assDoc[kAss];
          ass && initAss();
          for (const s of list) s.el = createStyle(s);
          addAllElements();
        }
      }
      function updateRoot() {
        if (!runtime.id) return selfDestruct();
        if (root !== document.documentElement) {
          root = document.documentElement;
          addAllElements();
          docRootObserver.restart();
        }
        return root;
      }
      const kPageShow = "pageshow";
      const {parent: apply_parent} = window;
      const isFrameSameOrigin = msg_api.isFrame && !!frameElement;
      const isFrameNoUrl = isFrameSameOrigin && !location.host;
      const xoEventId = `${Math.random()}`;
      const NAV_ID = "url:" + runtime.id;
      const navHub = global[NAV_ID] = new EventTarget;
      const navHubParent = isFrameNoUrl && apply_parent[NAV_ID] || null;
      let mqDark;
      let offscreen;
      let port;
      let throttled;
      let throttledCount;
      let lazyBadge = msg_api.isFrame;
      let xo;
      let matchUrl;
      if (isFrameNoUrl) {
        let p = apply_parent;
        for (;!p.location.host && p.frameElement; ) p = p.parent;
        matchUrl = p.location.href.split("#", 1)[0];
      } else matchUrl = location.href;
      global[Symbol.for("xo")] = (el, cb) => {
        xo || (xo = new IntersectionObserver(onIntersect, {
          rootMargin: "100%"
        }));
        el.addEventListener(xoEventId, cb, {
          once: !0
        });
        xo.observe(el);
      };
      navHubParent?.addEventListener(NAV_ID, onUrlChanged, !0);
      msg_api.TDM < 0 && (document.onprerenderingchange = e => {
        if (!runtime.id) return apply_selfDestruct();
        if (e.isTrusted) {
          msg_api.updateTDM(2);
          document.onprerenderingchange = null;
          getStyles({
            init: "cfg"
          }).then(apply_updateConfig);
          updateCount();
        }
      });
      onInjectorUpdate = () => {
        updateCount();
        msg_api.isFrame && updateExposeIframes();
        (msg_api.isFrame || own.cfg.wake) && updatePort();
      };
      selfDestruct = apply_selfDestruct;
      msg_api.isFrame || (() => {
        mqDark = matchMedia("(prefers-color-scheme: dark)");
        isFrameSameOrigin || (mqDark.onchange = ({matches: m}) => {
          m !== own.cfg.dark && msg_api.API.util.setSystemDark(own.cfg.dark = m);
        });
      })();
      init();
      msg.onMessage.set(applyOnMessage, !0);
      addEventListener(kPageShow, onBFCache);
      async function init() {
        let data;
        data = (data = global.clientData) && (data.then ? await data : data).apply;
        if (!runtime.id) return apply_selfDestruct();
        await applyStyles(data, !0);
      }
      async function applyStyles(data, isInitial = !own.sections) {
        data || (data = await getStyles({
          init: isInitial
        }));
        data.cfg || (data.cfg = own.cfg);
        Object.assign(own, global[Symbol.for("styles")] = data);
        msg_api.isFrame || own.cfg.topUrl !== "" || (own.cfg.topUrl = location.origin);
        list.length ? apply(own, !0) : own.cfg.off || apply(own);
        toggle(!own.cfg.off);
      }
      function getStyles(opts) {
        mqDark && (opts.dark = mqDark.matches);
        return msg_api.API.styles.getSectionsByUrl(matchUrl, opts);
      }
      function applyOnMessage(req, sender, multi) {
        if (multi) {
          throttled ??= Promise.resolve().then(processThrottled) && [];
          throttled.push(req);
          return;
        }
        const {style} = req;
        switch (req.method) {
         case "ping":
          return !0;

         case "styleDeleted":
          removeId(style.id);
          break;

         case "styleUpdated":
          if (req.broadcast && msg_api.isTab || !own.sections && own.cfg.off) break;
          style.enabled ? getStyles({
            id: style.id
          }).then(res => res.sections.length ? apply(res) : removeId(style.id)) : removeId(style.id);
          break;

         case "styleAdded":
          !own.sections && own.cfg.off || !style.enabled || getStyles({
            id: style.id
          }).then(apply);
          break;

         case "urlChanged":
          req.iid === 0 && updateUrl(req.url);
          break;

         case "injectorConfig":
          apply_updateConfig(req);
          break;

         case "backgroundReady":
          own.sections && updateCount();
          return !0;
        }
      }
      function processThrottled() {
        for (const req of throttled) applyOnMessage(req);
        throttled = null;
        updateCount();
      }
      function apply_updateConfig({cfg}) {
        for (const k in cfg) {
          const v = cfg[k];
          if (v !== own.cfg[k] && (msg_api.isFrame || k !== "top" && k !== "topUrl")) {
            own.cfg[k] = v;
            k === "off" ? updateDisableAll() : k === "order" ? sort() : k === "top" ? updateExposeIframes() : k === "wake" ? updatePort() : updateConfig(own.cfg);
          }
        }
      }
      function updateDisableAll() {
        own.sections || own.cfg.off ? toggle(!own.cfg.off) : offscreen || init();
      }
      function updateExposeIframes() {
        const attr = "stylus-iframe";
        const el = document.documentElement;
        el && (own.cfg.top && list.length ? el.getAttribute(attr) !== own.cfg.topUrl && el.setAttribute(attr, own.cfg.topUrl) : el.hasAttribute(attr) && el.removeAttribute(attr));
      }
      function updateCount() {
        let ids, str;
        if (!(msg_api.TDM < 0) && msg_api.isTab) {
          msg_api.isFrame && lazyBadge && performance.now() > 1e3 && (lazyBadge = !1);
          if (!throttled && throttledCount !== (str = (ids = [ ...table.keys() ]).join(","))) {
            msg_api.API.styles.updateIconBadge(ids, lazyBadge, 0);
            throttledCount = str;
          }
        }
      }
      function updatePort() {
        if (own.cfg.wake || list.length) {
          if (!port && (msg_api.isFrame || own.cfg.wake)) {
            port = runtime.connect({
              name: "apply"
            });
            port.onDisconnect.addListener(onPortDisconnected);
          }
        } else {
          port?.disconnect();
          port = null;
        }
      }
      function updateUrl(url) {
        if (url !== matchUrl) {
          throttledCount = matchUrl = url;
          own.sections && applyStyles(own.cfg.off && {});
          navHub.dispatchEvent(new Event(NAV_ID));
        }
      }
      function onIntersect(entries) {
        if (!runtime.id) return apply_selfDestruct();
        for (const e of entries) if (e.intersectionRatio) {
          xo.unobserve(e.target);
          e.target.dispatchEvent(new Event(xoEventId));
        }
      }
      function onBFCache(e) {
        if (!runtime.id) return apply_selfDestruct();
        if (e.isTrusted && e.persisted) {
          throttledCount = "";
          init();
        }
      }
      function onPortDisconnected() {
        own.cfg.wake && addEventListener("mousedown", wakeUpSW, !0);
        port = null;
      }
      function wakeUpSW(e) {
        if (!runtime.id) return apply_selfDestruct();
        !port && e.target.closest("a")?.href && updatePort();
      }
      function onUrlChanged() {
        updateUrl(apply_parent.location.href);
      }
      function apply_selfDestruct() {
        removeEventListener(kPageShow, onBFCache);
        mqDark && (mqDark = mqDark.onchange = null);
        if (offscreen) for (const fn of offscreen) fn();
        msg_api.TDM < 0 && (document.onprerenderingchange = null);
        removeEventListener("mousedown", wakeUpSW, !0);
        navHubParent?.removeEventListener(NAV_ID, onUrlChanged, !0);
        offscreen = null;
        shutdown();
        msg.onMessage.delete(applyOnMessage);
        port?.disconnect();
      }
      let mqCompact;
      global.prefs = prefs;
      prefs.subscribe("disableAll", (_, val) => {
        dom.$rootCL.toggle("all-disabled", val);
      }, !0);
      prefs.subscribe([ "manage.newUI.favicons", "manage.newUI.faviconsGray" ], (key, val) => {
        dom.$rootCL.toggle(key === "manage.newUI.favicons" ? "has-favicons" : "favicons-grayed", val);
      }, !0);
      dom.$rootCL.add("mv3", ua.MOBILE ? "mobile" : "desktop", ua.WINDOWS ? "windows" : "non-windows", "chromium", ...ua.OPERA ? [ "opera" ] : ua.VIVALDI ? [ "vivaldi" ] : [], ...util.isSidebar ? [ "sidebar" ] : msg_api.isTab ? [ "tab" ] : [], dom.isTouch ? "touch" : "non-touch");
      dom.$root.lang = chrome.i18n.getUILanguage();
      if (dom.$rootCL.contains("normal-layout")) {
        let mq;
        const listeners = new Set;
        const toggleCompact = ({matches: val}) => {
          dom.$toggleClasses(dom.$root, {
            "compact-layout": val,
            "normal-layout": !val
          });
          for (const fn of listeners) fn(val);
        };
        mqCompact = fn => {
          listeners.add(fn);
          mq && fn(mq.matches);
        };
        prefs.subscribe("compactWidth", (k, val) => {
          mq = matchMedia(`(max-width: ${val}px)`);
          (mq.onchange = toggleCompact)(mq);
          dom_util.getCssMediaRuleByName("compact", m => {
            const s1 = m.mediaText;
            const s2 = s1.replace(/((?:(min-)|max-)?width\W+)\d+/g, (s, prop, min) => prop + (min ? val + 1 : val));
            s1 !== s2 && (m.mediaText = s2);
          });
        }, !0);
      }
      localization.tBody();
      document.getElementById("header") && (0, header_resizer.default)();
    },
    963(_, ee, oe) {
      ee.splitLongTooltips = splitLongTooltips;
      var ae = oe(7986);
      var le = oe(6518);
      var ue = oe(7501);
      var pe = oe(3619);
      var fe = oe(492);
      oe(8970);
      var he = oe(8982);
      var ye = oe(6940);
      const SPLIT_BTN_MENU = ".split-btn-menu";
      const tooltips = new WeakMap;
      const noteBoxes = new WeakMap;
      const rxTag = /<(?:\/[a-z]+|[a-z]+(?:\s+[^>]*)?)>/g;
      const rxLong1 = /([.?!]\s+|[．。？！]\s*|(?:<[^\s<>][^<>]*>)?.{55,70},)\s+/gu;
      const rxLong2 = /((?:<[^\s<>][^<>]*>)?.{55,70}(?=.{50,}))\s+/gu;
      const elOff = document.getElementById("disableAll-label");
      const getFSH = DataTransferItem.prototype.getAsFileSystemHandle;
      window.on("mousedown", ({target}) => {
        le.setLastHocus(le.closestFocusable(target), !0);
      }, {
        passive: !0
      });
      window.on("keydown", event => {
        if (event.key === "Tab" && !event.ctrlKey && !event.altKey && !event.metaKey) {
          le.setLastHocus(!1);
          setTimeout(() => le.setHocus(le.closestHocused(document.activeElement), !1));
        }
      }, {
        passive: !0
      });
      window.on("keypress", e => {
        if (le.getEventKeyName(e) === "Enter") {
          const a = e.target.closest("a");
          a && !a.href && a.tabIndex === 0 && a.dispatchEvent(new MouseEvent("click", {
            bubbles: !0
          }));
        }
      });
      window.on("wheel", event => {
        const el = document.activeElement;
        if (!el || el !== event.target && !el.contains(event.target)) return;
        const isSelect = el.tagName === "SELECT";
        if (isSelect || el.tagName === "INPUT" && el.type === "range") {
          const key = isSelect ? "selectedIndex" : "valueAsNumber";
          const old = el[key];
          el[key] = ye.clamp(old + Math.sign(event.deltaY) * (el.step || 1), el.min || 0, el.max || el.length - 1);
          el[key] !== old && el.dispatchEvent(new Event("change", {
            bubbles: !0
          }));
          event.preventDefault();
        }
        event.stopImmediatePropagation();
      }, {
        capture: !0,
        passive: !1
      });
      window.on("click", splitMenu);
      window.on("click", event => {
        const note = event.target.closest('[data-cmd="note"]');
        (note || event.target.closest("summary a")) && event.preventDefault();
        if (note) {
          event.stopPropagation();
          showTooltipNote(note);
        }
      }, !0);
      window.on("resize", () => ye.debounce(addTooltipsToEllipsized, 100));
      pe.onMessage.set(request => {
        request.method === "editDeleteText" && document.execCommand("delete");
      });
      window.on("load", () => {
        splitLongTooltips();
        addTooltipsToEllipsized();
      }, {
        once: !0
      });
      elOff && fe.subscribe("disableAll", () => elOff.dataset.persist = "");
      if (getFSH) {
        addEventListener("dragover", e => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, !0);
        addEventListener("drop", async e => {
          const dt = e.dataTransfer;
          const file = dt.files[0];
          if (!file || !/\.(css|styl|less)$/i.test(file.name)) return;
          e.preventDefault();
          e.stopPropagation();
          const path = he.installUsercss;
          const url = ye.tryURL(dt.getData("text")).href;
          const handle = await getFSH.call([].find.call(dt.items, v => v.kind === "file"));
          const wnd = window.open(path);
          const {structuredClone} = wnd;
          (wnd.fsh = structuredClone ? structuredClone(handle) : handle)._url = url;
        }, !0);
      }
      function addTooltipsToEllipsized() {
        const xo = new IntersectionObserver(entries => {
          for (const e of entries) {
            const btn = e.target;
            const w = e.boundingClientRect.width;
            if (w && btn.preresizeClientWidth !== w) {
              btn.preresizeClientWidth = w;
              if (btn.scrollWidth > w) {
                const text = btn.textContent;
                btn.title = text.includes("­") ? text.replace(/\u00AD/g, "") : text;
                btn.titleIsForEllipsis = !0;
              } else btn.title && (btn.title = "");
            }
          }
          xo.disconnect();
        });
        for (const el of document.querySelectorAll("button, h2")) el.title && !el.titleIsForEllipsis || xo.observe(el);
      }
      function splitMenu(event) {
        const prevMenu = document.querySelector(".split-btn.active " + SPLIT_BTN_MENU) || document.querySelector(SPLIT_BTN_MENU);
        const prevPedal = prevMenu?.previousElementSibling;
        const pedal = event && event.target.closest(".split-btn-pedal, .dropdown");
        const entry = event && prevMenu && event.target.closest(SPLIT_BTN_MENU + ">*");
        if (prevMenu) {
          prevMenu.onfocusout = null;
          prevMenu.remove();
          prevPedal.parentElement.classList.remove("active");
          window.off("keydown", splitMenuEscape);
          event || prevPedal.focus();
        }
        if (pedal && pedal !== prevPedal) {
          const menu = ae.$create(SPLIT_BTN_MENU, {
            style: "opacity:0"
          }, Array.from(pedal.attributes, ({name, value}) => name.startsWith("menu-") && ae.$create("a", {
            tabIndex: 0,
            __cmd: name.split("-").pop()
          }, value)).filter(Boolean));
          const wrapper = pedal.parentElement;
          const xo = new IntersectionObserver(splitMenuIntersect);
          window.on("keydown", splitMenuEscape);
          menu.onfocusout = e => {
            menu.contains(e.relatedTarget) || setTimeout(splitMenu);
          };
          pedal.on("mousedown", e => e.preventDefault());
          wrapper.classList.toggle("active");
          pedal.after(menu);
          le.moveFocus(menu, 0);
          le.setHocus(menu.firstChild, le.isHocused(pedal));
          xo.observe(menu);
        }
        entry && prevPedal.previousElementSibling.dispatchEvent(new CustomEvent("split-btn", {
          detail: entry.__cmd,
          bubbles: !0
        }));
      }
      function splitMenuEscape(e) {
        if (le.getEventKeyName(e) === "Escape") {
          e.preventDefault();
          splitMenu();
        }
      }
      function splitMenuIntersect(entries, observer) {
        observer.disconnect();
        const menu = entries[0].target;
        let width = 1e6;
        let x, ir;
        for ({intersectionRect: ir} of entries) width = Math.min(width, ir.width - (x != null ? x : (x = ir.x, 
        0)));
        x = width - entries[0].boundingClientRect.width;
        x < 0 && (menu.style.transform = `translateX(calc(${x}px - var(--menu-pad)))`);
        menu.style.opacity = "";
      }
      function showTooltipNote(note) {
        if (noteBoxes.has(note)) {
          noteBoxes.get(note).close();
          noteBoxes.delete(note);
          return;
        }
        const internal = note.dataset.title;
        const text = internal || tooltips.get(note) || note.title;
        const {onShowNote, onHideNote} = note;
        le.messageBox.show({
          className: "note",
          contents: text.includes("<") ? ue.sanitizeHtml(text, internal) : text,
          buttons: [ ye.t("confirmClose") ],
          onshow(box) {
            noteBoxes.set(note, this);
            onShowNote?.call(this, box);
          }
        }).then(res => {
          noteBoxes.delete(note);
          onHideNote?.(res);
        });
      }
      function splitLongTooltips(elems) {
        for (const el of elems || document.querySelectorAll("[title], [data-title]")) {
          if (!elems && tooltips.has(el)) continue;
          const old = el.title || (el.title = el.dataset.title || "");
          if (!old) continue;
          tooltips.set(el, old);
          let res = old.includes("</") ? old.replace(rxTag, "") : old;
          if (res.length > 60) for (let b, cut, arr = res.split(/\n+/), a = res = "", i = 0; i < arr.length; i++) {
            a = arr[i];
            b = a.length <= 60 ? a : a.replace(rxLong1, "$1\n").replace(rxLong2, "$1\n");
            res && (res += cut || i && b !== a ? "\n\n" : "\n");
            res += b;
            cut = b !== a;
          }
          res !== old && (el.title = res);
        }
      }
    },
    7393(_, ee, oe) {
      ee.setupConditionalPrefs = cb => {
        const showIf = {
          __proto__: null
        };
        for (const el of document.querySelectorAll("[show-if]")) {
          const m = el.getAttribute("show-if").match(/^\s*(!\s*)?([.\w]+)\s*(?:(!?=)\s*(\S*)|:(\w+))?/);
          const [, not, id, op, opVal, mode] = m;
          const data = {
            el,
            not,
            op,
            opVal
          };
          (showIf[id] ||= []).push(data);
          cb?.(data, id, mode);
        }
        ue.subscribe(Object.keys(showIf), (key, val) => {
          for (const {el, not, op, opVal} of showIf[key]) el.classList.toggle("disabled", !(not ? !val : op ? op === "=" ? val == opVal : val != opVal : val));
        }, !0);
      };
      ee.setupLiveDetails = () => {
        const mo = new MutationObserver(([{target: el}]) => {
          const {open} = el;
          const key = el.dataset.pref;
          const fn = le.onDetailsToggled.get(el);
          el.matches(SEL_NO_SAVE) || ue.set(key, open);
          fn?.(key, open);
        });
        const moCfg = {
          attributes: !0,
          attributeFilter: [ "open" ]
        };
        const SEL = "details[data-pref]";
        const SEL_NO_SAVE = "[data-peek], .compact-layout .ignore-pref-if-compact";
        for (const el of document.querySelectorAll(SEL)) {
          ue.subscribe(el.dataset.pref, updateOnPrefChange, !0);
          mo.observe(el, moCfg);
        }
        ae.mqCompact?.(val => {
          for (const el of document.querySelectorAll(SEL)) el.matches(".ignore-pref") || (el.open = (!val || !el.classList.contains("ignore-pref-if-compact")) && ue.__values[el.dataset.pref]);
        });
        function updateOnPrefChange(key, value) {
          const el = document.querySelector(`details[data-pref="${key}"]`);
          el.open === value || el.matches(SEL_NO_SAVE) || (el.open = value);
        }
      };
      ee.setupLivePrefs = function(ids) {
        const all = (ids instanceof Element ? ids : document).getElementsByTagName("*");
        ids = ids?.forEach ? [ ...ids ] : ue.knownKeys.filter(id => id in all);
        ue.subscribe(ids, function updateElement(id, value, init, initiator) {
          if (initiator === onChange) return;
          const byId = all[id];
          const els = byId && byId.id ? [ byId ] : document.getElementsByName(id);
          if (els[0]) for (const el of els) {
            const oldValue = getValue(el);
            const diff = !isSame(el, oldValue, value);
            const type = el.type;
            if (type === "select-one" && el.$(`option[value="${value}"]`)?.disabled) return;
            if (diff) {
              type === "radio" ? el.checked = value === oldValue : type === "checkbox" ? el.checked = value : el.value = value;
              el.dispatchEvent(new Event("change", {
                bubbles: !0
              }));
            }
            init && el.on("change", onChange);
          } else ue.unsubscribe(id, updateElement);
        }, !0);
        function onChange() {
          this.checkValidity() && (this.type !== "radio" || this.checked) && ue.set(this.id || this.name, getValue(this), void 0, onChange);
        }
        function getValue(el) {
          const type = el.dataset.valueType || el.type;
          return type === "checkbox" ? el.checked : type === "number" ? parseFloat(el.value) : el.value;
        }
        function isSame(el, oldValue, value) {
          return el.type === "radio" ? el.checked === (oldValue === value) : el.localName === "select" && typeof value == "boolean" && oldValue === `${value}` || oldValue === value;
        }
      };
      oe(7986);
      var ae = oe(9073);
      var le = oe(6518);
      var ue = oe(492);
    },
    6518(_, ee, oe) {
      ee.animateElement = animateElement;
      ee.getCssMediaRuleByName = (name, cb) => {
        for (const sheet of document.styleSheets) for (const {media: m} of sheet.cssRules) if (m && m[1] === name && (!cb || cb(m) === !1)) return m;
      };
      ee.getEventKeyName = (e, letterAsCode) => {
        const mods = (e.shiftKey ? "Shift-" : "") + (e.ctrlKey ? "Ctrl-" : "") + (e.altKey ? "Alt-" : "") + (e.metaKey ? "Meta-" : "");
        return `${mods === e.key + "-" ? "" : mods}${e.key ? !e.key[1] && letterAsCode ? e.code : e.key[1] ? e.key : e.key.toUpperCase() : "Mouse" + ("LMR"[e.button] || e.button)}`;
      };
      ee.important = str => str.replace(/;/g, "!important;");
      ee.moveFocus = moveFocus;
      ee.saveWindowPosition = prefKey => {
        let v;
        if (prefs.__values[prefKey] && document.visibilityState === "visible" && (v = screenX) !== -32e3 && (v > 0 || v <= -10 || (v = screenY) > 0 || v <= -10 || (v = outerWidth - screen.availWidth) < 0 || v >= 10 || (v = outerHeight - screen.availHeight) < 0 || v >= 10)) {
          prefs.set("windowPosition", v = {
            left: screenX,
            top: screenY,
            width: outerWidth,
            height: outerHeight
          });
          return v;
        }
      };
      ee.scrollElementIntoView = (element, {invalidMarginRatio = 0} = {}) => {
        if (!element.isConnected) return;
        const {top, height} = element.getBoundingClientRect();
        const {top: parentTop, bottom: parentBottom} = element.parentNode.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (top < Math.max(parentTop, windowHeight * invalidMarginRatio) || top > Math.min(parentBottom, windowHeight) - height - windowHeight * invalidMarginRatio) {
          const scroller = element.closest(".scroller") || window;
          scroller.scrollBy(0, top - (scroller.clientHeight || windowHeight) / 2 + height);
        }
      };
      ee.setInputValue = (input, value) => {
        input.focus();
        input.select();
        document.execCommand(value ? "insertText" : "delete", !1, value);
        if (input.value !== value) {
          input.value = value;
          input.dispatchEvent(new Event("input", {
            bubbles: !0
          }));
        }
      };
      ee.showSpinner = parent => (parent = parent instanceof Node ? parent : document.querySelector(parent)).appendChild(dom.$create(".lds-spinner", new Array(12).fill(dom.$create("div")).map(e => e.cloneNode())));
      oe.d(ee, {
        configDialog: () => config_dialog.default,
        messageBox: () => message_box_namespaceObject
      });
      var message_box_namespaceObject = {
        alert: (contents, className, title, opts) => show({
          title,
          contents,
          className: `center ${className || ""}`,
          buttons: [ util.t("confirmClose") ],
          ...opts
        }),
        confirm: async (contents, className, title, opts) => {
          const res = await show({
            title,
            contents,
            className: `center ${className || ""}`,
            buttons: [ util.t("confirmYes"), util.t("confirmNo") ],
            ...opts
          });
          return res.button === 0 || res.enter;
        },
        pauseAll,
        show
      };
      oe.r(message_box_namespaceObject);
      oe.d(message_box_namespaceObject, {
        MessageBox: () => MessageBox
      });
      var util = oe(6940);
      var dom = oe(7986);
      var config_dialog = oe(4429);
      var localization = oe(7501);
      const boxes = new Set;
      function pauseAll(paused = !0) {
        for (const b of boxes) b.paused = paused;
      }
      class MessageBox {
        el;
        originalFocus;
        paused;
        _blockScroll;
        _moving;
        _resolve;
        _resolveAsClosed;
        _clickX;
        _clickY;
        _offsetX=0;
        _offsetY=0;
        constructor({title, contents, className = "", buttons = [], buttons2, blockScroll}) {
          buttons2 && buttons.push(...buttons2);
          this._blockScroll = blockScroll;
          this.el = dom.$create("#message-box", {
            className
          });
          this.el.appendChild(document.createElement("div")).append(dom.$create("#message-box-title.ellipsis", {
            on: {
              mousedown: this
            }
          }, title), dom.$create("#message-box-close-icon", {
            on: {
              click: this._resolveAsClosed = this._resolveWith.bind(this, {
                button: -1
              })
            }
          }, dom.$create("i.i-close")), this.el._body = dom.$create("#message-box-contents", localization.tHTML(contents)), this.el._buttons = dom.$create("#message-box-buttons", buttons.filter(Boolean).map((btn, buttonIndex) => {
            btn.localName !== "button" && (btn = dom.$create("button", btn));
            btn.buttonIndex = buttonIndex;
            btn.on("click", this._resolveWith.bind(this, {
              button: buttonIndex
            }));
            return btn;
          })));
        }
        open(onshow) {
          const el = this.el;
          document.body.appendChild(el);
          window.on("keydown", this, !0);
          if (this._blockScroll) {
            window.on("scroll", this, {
              passive: !1
            });
            this._blockScroll = {
              x: scrollX,
              y: scrollY
            };
          }
          el.matches(".note") && el.on("click", this);
          boxes.delete(this);
          pauseAll();
          this.paused = !1;
          boxes.add(this);
          this.originalFocus = document.activeElement;
          moveFocus(el, 0)?.target === "_blank" && el.classList.contains("config-dialog") && moveFocus(el, 1);
          document.activeElement === this.originalFocus && document.body.focus();
          typeof onshow == "function" && onshow.call(this, el);
          return new Promise(resolve => {
            this._resolve = resolve;
          });
        }
        async close(isAnimated) {
          if (this._resolve) {
            this.el.contains(document.activeElement) && this.originalFocus.focus();
            this._resolve = this.originalFocus = null;
            window.off("keydown", this, !0);
            window.off("scroll", this);
            window.off("mouseup", this);
            window.off("mousemove", this);
            boxes.delete(this);
            pauseAll(!1);
            this.paused = !0;
            isAnimated && await animateElement(this.el, "fadeout");
            this.el.remove();
          }
        }
        _resolveWith(value) {
          if (this._resolve) {
            setTimeout(this._resolve, 0, value);
            this.close(!0);
          }
        }
        handleEvent(evt) {
          if (!this.paused) switch (evt.type) {
           case "click":
            return evt.target === this.el && this._resolveAsClosed();

           case "keydown":
            return this._onKey(evt);

           case "mousedown":
            return this._onMouseDown(evt);

           case "mousemove":
            return this._onMouseMove(evt);

           case "mouseup":
            return this._onMouseUp(evt);

           case "scroll":
            return this._onScroll(evt);
          }
        }
        _onKey(evt) {
          const {key, shiftKey, ctrlKey, altKey, metaKey, target} = evt;
          if (!(shiftKey && key !== "Tab" || ctrlKey || altKey || metaKey)) {
            switch (key) {
             case "Enter":
              if (closestFocusable(target)) return;
              break;

             case "Escape":
              evt.preventDefault();
              evt.stopPropagation();
              break;

             case "Tab":
              moveFocus(this.el, shiftKey ? -1 : 1);
              evt.preventDefault();
              return;

             default:
              return;
            }
            this._resolveWith(key === "Enter" ? {
              enter: !0
            } : {
              esc: !0
            });
          }
        }
        _onMouseDown(evt) {
          if (!evt.button) {
            if (!this._moving) {
              window.on("mouseup", this, {
                passive: !0
              });
              window.on("mousemove", this, {
                passive: !0
              });
              this._moving = !0;
            }
            if (!this.el.style.padding && this.el.matches(".note, .center, .center-dialog")) {
              const b = this.el.firstChild.getBoundingClientRect();
              this.el.style.padding = `${b.y | 0}px 0 0 ${b.x | 0}px`;
            }
            this._clickX = evt.x - this._offsetX;
            this._clickY = evt.y - this._offsetY;
          }
        }
        _onMouseMove(evt) {
          evt.buttons ? this.el.firstChild.style.transform = `translate(${this._offsetX = util.clamp(evt.x, 30, innerWidth - 30) - this._clickX}px,${this._offsetY = util.clamp(evt.y, 30, innerHeight - 30) - this._clickY}px)` : this._onMouseUp();
        }
        _onMouseUp(evt) {
          if (!evt || evt.button === 0) {
            window.off("mouseup", this);
            window.off("mousemove", this);
            this._moving = !1;
          }
        }
        _onScroll() {
          scrollTo(this._blockScroll.x, this._blockScroll.y);
        }
      }
      function show(params) {
        return new MessageBox(params).open(params.onshow);
      }
      var prefs = oe(492);
      let lastHocus = !1;
      const onDetailsToggled = new WeakMap;
      const setHocus = (el, state) => el && dom.$toggleDataset(el, "focusedViaClick", state);
      function animateElement(el, cls = "highlight", ...removeExtraClasses) {
        return el ? new Promise(resolve => {
          let onDone = () => {
            el.classList.remove(cls, ...removeExtraClasses);
            onDone = null;
            resolve();
          };
          requestAnimationFrame(() => {
            if (onDone) {
              const style = getComputedStyle(el);
              if (style.animationName === "none" || !parseFloat(style.animationDuration)) {
                el.off("animationend", onDone);
                onDone();
              }
            }
          });
          el.on("animationend", onDone, {
            once: !0
          });
          el.classList.add(cls);
        }) : Promise.resolve(el);
      }
      const closestFocusable = el => {
        let labelSeen;
        for (;el; el = el.parentElement) {
          if (el.localName === "label" && el.control && !labelSeen) {
            el = el.control;
            labelSeen = !0;
          }
          if (el.tabIndex >= 0) return el;
        }
      };
      function moveFocus(rootElement, step) {
        const elements = [ ...rootElement.getElementsByTagName("*") ];
        const activeEl = document.activeElement;
        const activeIndex = step ? Math.max(step < 0 ? 0 : -1, elements.indexOf(activeEl)) : -1;
        const num = elements.length;
        step || (step = 1);
        for (let i = 1; i <= num; i++) {
          const el = elements[(activeIndex + i * step + num) % num];
          if (!el.disabled && el.tabIndex >= 0 && el.getBoundingClientRect().width) {
            el.focus();
            setHocus(el, lastHocus);
            return activeEl !== el && el;
          }
        }
      }
      ee.closestFocusable = closestFocusable;
      ee.closestHocused = el => el?.closest("[data-focused-via-click]");
      ee.isHocused = el => el && "focusedViaClick" in el.dataset;
      ee.onDetailsToggled = onDetailsToggled;
      ee.setHocus = setHocus;
      ee.setLastHocus = (el, state) => el && dom.$toggleDataset(el, "focusedViaClick", lastHocus = state);
    },
    7986(_, ee, oe) {
      ee.$$remove = (selector, base = document) => {
        for (const el of base.$$(selector)) el.remove();
      };
      ee.$create = $create;
      ee.$createFragment = nodes => {
        const bin = document.createDocumentFragment();
        bin.append(...nodes);
        return bin;
      };
      ee.$createLink = (href, content) => {
        const opt = {
          target: "_blank",
          rel: "noopener"
        };
        href && (typeof href == "string" ? opt.href = href : Object.assign(opt, href));
        return $create("a", opt, content);
      };
      ee.$detach = (el, state = !0) => {
        let cmt = detachments.get(el);
        state ??= !cmt;
        if (state) {
          if (!cmt) {
            cmt = document.createComment((cmt = el.id) ? "#" + cmt : (cmt = el.className) ? "." + cmt : el.outerHTML);
            detachments.set(el, cmt);
            el.replaceWith(cmt);
          }
        } else if (cmt) {
          cmt.replaceWith(el);
          detachments.delete(el);
        }
        return state;
      };
      ee.$toggleClasses = (el, newClasses) => {
        const list = new Set(el.className.split(/\s+/));
        for (const c in newClasses) newClasses[c] ? list.add(c) : list.delete(c);
        const res = [ ...list ].join(" ");
        res !== el.className && (el.className = res);
      };
      ee.$toggleDataset = (el, prop, state) => {
        if (!el) return;
        const ds = el.dataset;
        const wasEnabled = ds[prop] != null;
        state ? wasEnabled || (ds[prop] = typeof state == "string" ? state : "") : wasEnabled && delete ds[prop];
      };
      Object.assign(EventTarget.prototype, {
        on: addEventListener,
        off: removeEventListener
      });
      for (const {prototype} of [ Document, DocumentFragment, Element ]) {
        prototype.$ = prototype.querySelector;
        prototype.$$ = prototype.querySelectorAll;
      }
      const $root = document.documentElement;
      const $rootCL = $root.classList;
      const detachments = new WeakMap;
      const getObjectType = Object.call.bind({}.toString);
      const isTouch = navigator.maxTouchPoints;
      function $create(selector, props, guts) {
        let el;
        if (/\W/.test(selector)) {
          const tica = selector.split("[");
          const tic = tica[0].split(".");
          const ti = tic[0].split("#");
          el = document.createElement(ti[0] || "div");
          ti[1] && (el.id = ti[1]);
          tic.length > 1 && (el.className = tic.length > 2 ? tic.slice(1).join(" ") : tic[1]);
          for (let a, i = 1; a = tica[i++]; ) el.setAttribute((a = a.split("]")[0].split("="))[0], a[1] || "");
        } else el = document.createElement(selector);
        if (getObjectType(props) === "[object Object]") {
          const {on} = props;
          if (on) for (const k in on) el.on(k, on[k]);
          Object.assign(el, props);
          on && delete el.on;
        } else props != null && (guts = props);
        guts != null && (typeof guts == "string" ? el.textContent = guts : Array.isArray(guts) ? el.append(...guts) : guts instanceof Node && el.appendChild(guts));
        return el;
      }
      ee.$isTextInput = ({localName, type} = document.activeElement || {}) => localName === "textarea" || localName === "input" && (type === "text" || type === "search" || type === "number" || type === "url");
      ee.$root = $root;
      ee.$rootCL = $rootCL;
      ee.cssFieldSizing = !0;
      ee.isTouch = isTouch;
    },
    8346(_, ee, oe) {
      ee.default = async () => {
        const prefId = "headerWidth." + location.pathname.match(/^.(\w*)/)[1];
        if (!le.__defaults[prefId]) return;
        let offset, perPage;
        le.subscribe(prefId, setWidth, !0);
        document.getElementById("header-resizer").onmousedown = e => {
          if (!e.button) {
            offset = headerWidth - e.clientX;
            perPage = e.shiftKey;
            document.body.classList.add("resizing-h");
            document.on("mousemove", resize);
            document.on("mouseup", resizeStop);
          }
        };
        function resize(e) {
          setWidth(0, offset + e.clientX);
        }
        function resizeStop() {
          document.off("mouseup", resizeStop);
          document.off("mousemove", resize);
          document.body.classList.remove("resizing-h");
          save();
        }
        function save() {
          if (perPage) le.set(prefId, headerWidth); else for (const k of le.knownKeys) k.startsWith("headerWidth.") && le.set(k, headerWidth);
        }
        function setWidth(k, width) {
          const max = (outerWidth < 850 ? screen.availWidth : outerWidth) / 3;
          const delta = (width = Math.round(Math.max(200, Math.min(max, +width || 0)))) - headerWidth;
          !delta && headerWidth || ae.$root.style.setProperty("--header-width", width + "px");
          if (delta) for (const el of document.querySelectorAll('.CodeMirror-linewidget[style*="width:"]')) el.style.width = parseFloat(el.style.width) - delta + "px";
          headerWidth = width;
        }
      };
      oe.d(ee, {
        headerWidth: () => headerWidth
      });
      var ae = oe(7986);
      var le = oe(492);
      let headerWidth;
    },
    7501(_, ee, oe) {
      ee.formatDate = (date, needsTime) => {
        if (!date) return "";
        try {
          const now = new Date;
          const newDate = new Date(Number(date) || date);
          const needsYear = newDate.getYear() !== now.getYear();
          const needsWeekDay = needsTime && now - newDate <= 6048e5;
          const intlKey = (needsWeekDay ? "W" : "") + (needsYear ? "Y" : "") + (needsTime ? "HM" : "");
          const string = (intlCache[intlKey] || (intlCache[intlKey] = new Intl.DateTimeFormat([ chrome.i18n.getUILanguage(), "en" ], {
            day: "numeric",
            month: "short",
            year: needsTime ? "numeric" : needsYear ? "2-digit" : void 0,
            hour: needsTime ? "numeric" : void 0,
            minute: needsTime ? "2-digit" : void 0,
            weekday: needsWeekDay ? "long" : void 0
          }))).format(newDate);
          return string === "Invalid Date" ? "" : string;
        } catch {
          return "";
        }
      };
      ee.formatRelativeDate = (date, style) => {
        let delta = (Date.now() - date) / 1e3;
        if (delta >= 0 && Intl.RelativeTimeFormat) for (const [span, unit, frac] of RELATIVE_UNITS) {
          if (delta < span) return (intlCache.R || (intlCache.R = new Intl.RelativeTimeFormat([ chrome.i18n.getUILanguage(), "en" ], {
            style
          }))).format(-delta.toFixed(frac), unit);
          delta /= span;
        }
        return "";
      };
      ee.sanitizeHtml = sanitizeHtml;
      ee.tBody = () => {
        tElements(document);
        const tpl = template.body;
        tpl && tpl !== document.body && (template.body = document.body).append(tpl);
      };
      var ae = oe(6940);
      const template = Object.create(new Proxy({
        __proto__: null
      }, {
        get: (obj, k) => createTemplate(document.querySelector(`template[data-id="${k}"]`))
      }));
      const RX_BAD_TAGS = /<script[^<>]*[^<]*<\/script[^>]*>/gi;
      const RX_PARTS = /<(?:(br|hr)|(\/)?(a(\s+href=[^>]*)?|b|code|nobr|p|pre|table|tr|td)|([^\s<>][^<>]*))>|(?:[^<]+|<\s+)+|$/g;
      const RX_WORD_BREAK = /([\w{-\uFFFF]{10}|[\w{-\uFFFF]{5,10}[!'")*,./]|((?!\s)\W){10})(?!\s|$)/gu;
      const SELECTOR = "[i18n]";
      const RELATIVE_UNITS = [ [ 60, "second", 0 ], [ 60, "minute", 0 ], [ 24, "hour", 1 ], [ 7, "day", 1 ], [ 4, "week", 1 ], [ 12, "month", 1 ], [ 1e99, "year", 1 ] ];
      const intlCache = {};
      const breakWord = text => text.length <= 10 ? text : text.replace(RX_WORD_BREAK, "$&­");
      function tElements(elems) {
        for (const el of elems.$$ ? elems.tagName ? [ elems, ...elems.$$(SELECTOR) ] : elems.$$(SELECTOR) : elems) {
          const attr = el.getAttribute("i18n");
          if (attr) {
            for (let item of attr.split(",")) {
              item = item.trim();
              const add = item.charCodeAt(0) === 43;
              const fn = add ? "append" : "prepend";
              const i = item.indexOf(":");
              const j = i > 0 && (item.indexOf("?", i + 1) + 1 || NaN) - 1 || void 0;
              const params = j && [ ae.t(item.slice(j + 1)) ];
              const key = i > 0 && item.slice(add, i);
              const val = ae.t(item.slice(i + 1 || add, j), params);
              key === "html" || !key && val.includes("<") ? el[fn](sanitizeHtml(val)) : key ? el.setAttribute(key, add ? el.getAttribute(key) + val : val) : el[fn](val.length <= 10 ? val : val.replace(RX_WORD_BREAK, "$&­"));
            }
            el.removeAttribute("i18n");
          }
        }
      }
      function createTemplate(el) {
        if (!el) return;
        const {content = el, dataset: {id} = {}} = el;
        const first = content.firstChild;
        const res = first.nextSibling ? content : first;
        id && (template[id] = res);
        tElements(res);
        return res;
      }
      function sanitizeHtml(str, safe) {
        RX_PARTS.lastIndex = 0;
        str = str.replace(RX_BAD_TAGS, "");
        for (let m, v, res = document.createDocumentFragment(), el = res; m = RX_PARTS.exec(str); ) {
          if (!m[0]) return res;
          if (v = m[1]) el.append(document.createElement(v)); else if (m[2]) el !== res && (v = el.closest(m[3])) && (el = v.parentNode); else if (v = m[4]) {
            el = el.appendChild(document.createElement("a"));
            if (safe) {
              el.href = v.split(/['"]/)[1];
              el.target = "_blank";
            }
          } else (v = m[3]) ? el = el.appendChild(document.createElement(v)) : (v = m[5]) ? el.appendChild(document.createElement("code")).append(v) : el.append(m[0]);
        }
      }
      ee.breakWord = breakWord;
      ee.tHTML = html => typeof html != "string" ? html : html.includes("<") ? sanitizeHtml(html) : document.createTextNode(breakWord(html));
      ee.template = template;
    },
    4930(_, ee, oe) {
      ee.apiSendProxy = apiSendProxy;
      ee.apiSendProxyDebugLog = function(path, args) {
        console.trace("%cAPI.%s", "color:darkorange;font-weight:bold", path, ...args, ...isFrame ? [ "FRAME:", document ] : []);
      };
      ee.updateTDM = value => {
        TDM = value;
      };
      oe.d(ee, {
        TDM: () => TDM,
        bgReadySignal: () => {},
        isTab: () => isTab
      });
      const apiHandler = {
        get: (me, key, instance) => instance[key] = me.name ? apiHandler.apply.bind(null, me.name + "." + key) : Object.create(new Proxy({
          name: key
        }, apiHandler)),
        apply: apiSendProxy
      };
      const API = global.API = Object.create(new Proxy({
        name: ""
      }, apiHandler));
      const isFrame = window !== top;
      let isTab;
      let TDM = isFrame ? 0 : document.prerendering ? -1 : 1;
      (isTab = global.clientData) ? isTab = isTab.tabId >= 0 : new URLSearchParams(location.search).has("sidebar") ? isTab = !1 : (isTab = location.pathname !== "/popup.html") || chrome.tabs.getCurrent(tab => {
        isTab = !!tab;
      });
      async function apiSendProxy(path, ...args) {
        args[0] instanceof Event && (args[0] = "Event");
        const localErr = new Error;
        const msg = {
          data: {
            method: "invokeAPI",
            path,
            args
          },
          TDM
        };
        for (let res, err, retry = 0; retry < 1; retry++) try {
          res = await chrome.runtime.sendMessage(msg);
          if (res) {
            if (err = res.error) {
              err.stack += "\n" + localErr.stack;
              throw err;
            }
            return res.data;
          }
        } catch (_) {
          _.stack = localErr.stack;
          throw _;
        }
      }
      ee.API = API;
      ee.FF = !1;
      ee.apiHandler = apiHandler;
      ee.isFrame = isFrame;
    },
    6990(_, ee, oe) {
      oe.d(ee, {});
      oe(9458);
      var ae = oe(3619);
      var le = oe(4930);
      var ue = oe(5619);
      var pe = oe(8982);
      oe(6940);
      var fe = oe(1480);
      const needsTab = {
        __proto__: null,
        "styles.getSectionsByUrl": 0,
        "styles.updateIconBadge": 1,
        "util.styleViaAPI": 1
      };
      const navSW = navigator.serviceWorker;
      const swController = navSW.controller;
      const swExec = ue.createPortExec(swController || navSW.ready.then(reg => reg.active), {
        lock: pe.swPath
      });
      let workerProxy;
      ue.initRemotePort.call(ae._execute, {
        ports: [ new BroadcastChannel("sw") ]
      }, !0);
      le.apiHandler.apply = async function(path, ...args) {
        args[0] instanceof Event && (args[0] = "Event");
        if (path.startsWith("worker.")) {
          workerProxy ??= ue.createPortProxy(pe.workerPath);
          return workerProxy[path.slice(7)](...args);
        }
        const frameId = window === top ? 0 : 1;
        const tab = le.isTab && path in needsTab && (!needsTab[path] && fe.ownTab || await fe.getOwnTab());
        const sender = {
          url: location.href,
          tab,
          frameId
        };
        return swExec({
          method: "invokeAPI",
          path,
          args
        }, sender);
      };
      ee.swController = swController;
    },
    3619(_, ee, oe) {
      ee._execute = _execute;
      oe.d(ee, {});
      oe(4930);
      const onMessage = new Map;
      const onConnect = {};
      const onDisconnect = {};
      const wrapData = data => ({
        data
      });
      const wrapError = error => ({
        error: Object.assign({
          message: error.message || `${error}`,
          stack: error.stack
        }, error)
      });
      chrome.runtime.onMessage.addListener(({data, multi, TDM, broadcast}, sender, sendResponse) => {
        if (data.method === "invokeAPI") return;
        sender.TDM = TDM;
        const res = _execute(data, sender, multi, broadcast);
        if (!broadcast) {
          if (res instanceof Promise) {
            res.then(wrapData, wrapError).then(sendResponse);
            return !0;
          }
          res !== void 0 && sendResponse(wrapData(res));
        }
      });
      chrome.runtime.onConnect.addListener(async port => {
        const name = port.name.split(":", 1)[0];
        const fnOn = onConnect[name];
        const fnOff = onDisconnect[name];
        fnOn && fnOn(port);
        port.onDisconnect.addListener(fnOff || (() => chrome.runtime.lastError));
      });
      function _execute(data, sender, multi, broadcast) {
        let result;
        let res;
        let i = 0;
        if (multi) {
          multi = data.length > 1 && data;
          data = data[0];
        }
        do {
          for (const [fn, replyAllowed] of onMessage) {
            try {
              data.broadcast = broadcast;
              res = fn(data, sender, !!multi);
            } catch (_) {
              res = Promise.reject(_);
            }
            replyAllowed && res !== result && result === void 0 && (result = res);
          }
        } while (multi && (data = multi[++i]));
        return result;
      }
      ee.onConnect = onConnect;
      ee.onMessage = onMessage;
    },
    5619(_, ee, oe) {
      ee.createPortExec = createPortExec;
      ee.createPortProxy = function(getTarget, opts) {
        let exec;
        return new Proxy({}, {
          get: (me, cmd) => cmd === CLIENT ? exec?.[CLIENT] : function(...args) {
            exec ??= createPortExec(getTarget, opts, me[CLIENT]);
            return exec.call(this, cmd, ...args);
          }
        });
      };
      ee.initRemotePort = initRemotePort;
      oe.d(ee, {});
      var ae = oe(6940);
      const CLIENT = Symbol("client");
      const COMMANDS = {
        __proto__: null
      };
      const PATH = location.pathname;
      const TTL = 3e5;
      const navLocks = navigator.locks;
      const SharedWorker = !/Apple/.test(navigator.vendor) && global.SharedWorker;
      const kWorker = "_worker";
      let numJobs = 0;
      let lastBusy = 0;
      let timer;
      navLocks && navLocks.request(PATH, () => new Promise(ae.NOP));
      navigator.serviceWorker.onmessage = initRemotePort.bind(COMMANDS);
      Object.assign(COMMANDS, {
        getWorkerPort(url) {
          const p = getWorkerPort(url);
          this._transfer = [ p ];
          return p;
        }
      });
      function createPortExec(getTarget, {lock, once} = {}, target) {
        let queue;
        let port;
        let initPending;
        let tracking;
        let lastId = 0;
        return exec;
        async function exec(...args) {
          const ctx = {
            args,
            stack: (new Error).stack
          };
          const promise = new Promise((resolve, reject) => ctx.rr = [ resolve, reject ]);
          port || initPending || (initPending = initPort());
          initPending && (initPending = !exec[CLIENT] && await initPending);
          (once ? target : port).postMessage({
            args,
            id: ++lastId
          }, once || (Array.isArray(this) ? this : void 0));
          queue.set(lastId, ctx);
          ctx.p = promise.catch(ae.NOP);
          return promise;
        }
        async function initPort() {
          exec[CLIENT] = null;
          if (typeof getTarget == "string") {
            lock = getTarget;
            target = getWorkerPort(getTarget, console.error);
          } else target || (target = typeof getTarget == "function" ? getTarget() : getTarget).then && (target = await target);
          port = target instanceof MessagePort ? target : once ? initChannelPort(target, null, once = []) : initChannelPort(target, {
            lock
          });
          port.onmessage = onMessage;
          port.onmessageerror = onMessageError;
          queue = new Map;
          lastId = 0;
          exec[CLIENT] = target;
          tracking || once || !navLocks || trackTarget(queue);
        }
        function onMessage({data}) {
          const {id, res, err} = data.id ? data : JSON.parse(data);
          const {stack, rr: [resolve, reject]} = queue.get(id);
          queue.delete(id);
          lastId > 1e9 && (lastId = 0);
          err ? reject(err[1] ? Object.assign(...err, {
            stack: err[0].stack + "\n" + stack
          }) : err[0]) : resolve(res);
          once && queue.size && discard(queue, !0);
        }
        async function discard(myQ, wait) {
          for (;wait && myQ.size; ) await Promise.all(Array.from(myQ.values(), ctx => ctx.p));
          if (myQ === queue) {
            wait && port?.close();
            exec[CLIENT] = queue = port = target = null;
          }
        }
        async function trackTarget(myQ) {
          tracking = !0;
          for (;!(await navLocks.query()).held.some(v => v.name === lock); ) await ae.sleep(10);
          await navLocks.request(lock, ae.NOP);
          tracking = !1;
          for (const {stack, rr: [, reject]} of myQ.values()) {
            const msg = "Target disconnected";
            const err = new Error(msg);
            err.stack = msg + "\n" + stack;
            reject(err);
          }
          myQ.clear();
          queue === myQ && discard(myQ);
        }
      }
      function initRemotePort(evt, silent) {
        const {id: once} = evt.data || {};
        const exec = this;
        const port = evt.ports[0];
        port.onerror = console.error;
        port.onmessage = onMessage;
        port.onmessageerror = onMessageError;
        once && onMessage(evt);
        async function onMessage(portEvent) {
          const data = portEvent.data;
          const {args, id} = data.id ? data : JSON.parse(data);
          let res, err;
          numJobs++;
          timer && (timer = clearTimeout(timer));
          try {
            res = (typeof exec == "function" ? exec : exec[args.shift()]).apply(portEvent, args);
            res instanceof Promise && (res = await res);
          } catch (_) {
            res = void 0;
            if (_ instanceof Error) {
              delete _.origin;
              err = [ _, {
                ..._
              } ];
            } else err = [ _ ];
          }
          silent || port.postMessage({
            id,
            res,
            err
          }, portEvent._transfer);
          (--numJobs, 0) && autoClose(TTL);
          lastBusy = performance.now();
        }
      }
      function autoClose(delay) {
        numJobs || timer || (timer = setTimeout(close, delay ||= Math.max(0, lastBusy + TTL - performance.now())));
      }
      function getWorkerPort(url, onerror) {
        let worker;
        if (SharedWorker) {
          worker = new SharedWorker(url, "Stylus");
          onerror && (worker.onerror = onerror);
          return worker.port;
        }
        let target = global;
        for (const view of chrome.extension.getViews()) {
          if (worker = view[kWorker]) break;
          view.location.pathname === "/offscreen.html" && (target = view);
        }
        if (!worker) {
          worker = target[kWorker] = new target.Worker(url);
          onerror && (worker.onerror = onerror);
        }
        return initChannelPort(worker, null);
      }
      function initChannelPort(target, msg, transfer) {
        const mc = new MessageChannel;
        const port2 = mc.port2;
        transfer ? transfer[0] = port2 : target.postMessage(msg, [ port2 ]);
        return mc.port1;
      }
      function onMessageError({data, source}) {
        console.warn("Non-cloneable data", data);
        source.postMessage(JSON.stringify(data));
      }
    },
    492(_, ee, oe) {
      oe.r(ee);
      oe.d(ee, {
        ready: () => ready
      });
      var ae = oe(4188);
      var le = oe(4930);
      var ue = oe(6990);
      var pe = oe(6940);
      let busy, ready;
      let toUpload;
      const clientData = ue.swController ? pe.makePropertyPopProxy(global.clientData) : global.clientData = le.API.util.setClientData(pe.describeClient()).then(data => {
        data.err && onerror(data.err);
        setBadFavs(data = pe.makePropertyPopProxy(data));
        setAll(data.prefs);
        return data;
      });
      const defaults = {
        __proto__: null,
        disableAll: !1,
        exposeIframes: !1,
        "exposeIframes.sites": "",
        "exposeIframes.sitesOnly": !1,
        exposeStyleName: !1,
        keepAlive: 0,
        keepAliveIdle: !1,
        newStyleAsUsercss: !1,
        openEditInWindow: !1,
        "openEditInWindow.popup": !1,
        patchCsp: !1,
        "patchCsp.sites": "",
        "patchCsp.sitesOnly": !1,
        "show-badge": !0,
        styleViaASS: !1,
        "styleViaASS.sites": "",
        "styleViaASS.sitesOnly": !1,
        styleViaXhr: !1,
        "styleViaXhr.sites": "",
        "styleViaXhr.sitesOnly": !1,
        urlInstaller: !0,
        windowPosition: {},
        compactWidth: 850,
        "config.autosave": !0,
        "schemeSwitcher.enabled": "system",
        "schemeSwitcher.nightStart": "18:00",
        "schemeSwitcher.nightEnd": "06:00",
        "popup.enabledFirst": !0,
        "popup.stylesFirst": !0,
        "popup.autoResort": !1,
        "popup.borders": !1,
        "popup.findSort": "w",
        "manage.onlyEnabled": !1,
        "manage.onlyLocal": !1,
        "manage.onlyUsercss": !1,
        "manage.onlyEnabled.invert": !1,
        "manage.onlyLocal.invert": !1,
        "manage.onlyUsercss.invert": !1,
        "manage.actions.expanded": !1,
        "manage.backup.expanded": !0,
        "manage.filters.expanded": !0,
        "manage.links.expanded": !0,
        "manage.minColumnWidth": 750,
        "manage.newUI": !0,
        "manage.newUI.favicons": !0,
        "manage.newUI.faviconsGray": !1,
        "manage.newUI.targets": 3,
        "manage.newUI.sort": "title,asc",
        "manage.searchMode": "meta",
        "editor.options": {},
        "editor.toc.expanded": !0,
        "editor.options.expanded": !0,
        "editor.options.style.expanded": !0,
        "editor.general.expanded": !0,
        "editor.lint.expanded": !0,
        "editor.publish.expanded": !0,
        "editor.lineWrapping": !0,
        "editor.smartIndent": !0,
        "editor.indentWithTabs": !1,
        "editor.tabSize": 4,
        "editor.keyMap": "default",
        "editor.theme": "default",
        "editor.beautify": {
          selector_separator_newline: !0,
          newline_before_open_brace: !1,
          newline_after_open_brace: !0,
          newline_between_properties: !0,
          newline_before_close_brace: !0,
          newline_between_rules: !1,
          preserve_newlines: !0,
          end_with_newline: !1,
          indent_conditional: !0,
          indent_mozdoc: !0,
          space_around_combinator: !0,
          space_around_cmp: !1
        },
        "editor.beautify.hotkey": "",
        "editor.toggle.hotkey": "Alt-Enter",
        "editor.toggle.save": !1,
        "editor.linter": "csslint",
        [ae.pEditorLinterOn]: !0,
        "editor.lintReportDelay": 500,
        "editor.matchHighlight": "token",
        "editor.autoCloseBrackets": !0,
        "editor.autocompleteOnTyping": !1,
        "editor.contextDelete": !1,
        "editor.selectByTokens": !0,
        "editor.arrowKeysTraverse": !0,
        "editor.appliesToLineWidget": !0,
        "editor.autosaveDraft": 10,
        "editor.livePreview": !0,
        "editor.livePreview.delay": .2,
        "editor.targetsFirst": !0,
        "editor.colorpicker": !0,
        "editor.colorpicker.hexUppercase": 0,
        "editor.colorpicker.hotkey": "",
        "editor.colorpicker.color": "",
        "editor.colorpicker.maxHeight": 300,
        "hotkey._execute_browser_action": "",
        "hotkey.openManage": "",
        "hotkey.styleDisableAll": "",
        "hotkey.toggleTab": "",
        "sync.enabled": "none",
        iconset: -1,
        badgeDisabled: "#8B0000",
        badgeNormal: "#006666",
        "headerWidth.edit": 280,
        "headerWidth.install": 280,
        "headerWidth.manage": 280,
        "popup.search.globals": !1,
        "popup.sidePanel": !1,
        "popup.sidePanel.config": -1,
        "popup.sidePanel.editor": !1,
        "popup.sidePanel.finder": !1,
        "popup.sidePanel.manager": !1,
        "popup.sidePanel.options": !0,
        "popup.toggler.expanded": !1,
        popupWidth: 246,
        popupWidthMax: 280,
        updateInterval: 24,
        updateOnlyEnabled: !1
      };
      const warnUnknown = console.warn.bind(console, 'Unknown preference "%s"');
      const values = pe.deepCopy(defaults);
      const onChange = {};
      const onStorageChanged = new Set;
      const defaultsClone = new Proxy({}, {
        get: (_, key) => pe.deepCopy(defaults[key])
      });
      const knownKeys = Object.keys(defaults);
      const set = (key, val, isSynced, ...onChangeArgs) => {
        if (!val && key === "editor.linter") {
          key = ae.pEditorLinterOn;
          val = !1;
        }
        const old = values[key];
        const def = defaults[key];
        const type = typeof def;
        if (def === void 0) return warnUnknown(key);
        type !== typeof val && (val = type === "string" ? `${val}` : type === "number" ? +val || 0 : type === "boolean" ? val === "true" || val !== "false" && !!val : null);
        if (!(val === old || type === "object" && pe.deepEqual(val, old))) {
          values[key] = val;
          onChange[key]?.forEach(fn => fn(key, val, void 0, ...onChangeArgs));
          isSynced || ((toUpload ??= Promise.resolve().then(upload) && {})[key] = val);
          return !0;
        }
      };
      function upload() {
        le.API.prefs.set(toUpload);
        toUpload = null;
      }
      function setAll(data, fromStorage) {
        busy = !1;
        if (fromStorage) {
          for (const key in fromStorage) !(key in data) && key in defaults && set(key, defaults[key], !0);
          for (const key in data || (data = {})) set(key, data[key], !0);
        } else Object.assign(values, data);
      }
      function setBadFavs(data) {
        global.badFavs = new Set(data.badFavs || []);
      }
      if (ue.swController) {
        clientData.err && onerror(clientData.err);
        setBadFavs(clientData);
        setAll(clientData.prefs);
        ready = Promise.resolve();
        ready.then = fn => fn();
      } else busy = ready = clientData;
      (chrome.storage.sync.onChanged || chrome.storage.onChanged).addListener((changes, area) => {
        if (busy) return;
        const data = (!area || area === "sync") && changes.settings;
        data && setAll(data.newValue, data.oldValue);
        for (const fn of onStorageChanged) fn(changes, area);
      });
      ee.__defaults = defaults;
      ee.__values = values;
      ee.clientData = clientData;
      ee.defaults = defaultsClone;
      ee.get = key => {
        const {[key]: res = warnUnknown(key)} = values;
        return res && typeof res == "object" ? pe.deepCopy(res) : res;
      };
      ee.getDbArray = async key => {
        key = await le.API.prefsDB.get(key);
        return Array.isArray(key) ? key : null;
      };
      ee.knownKeys = knownKeys;
      ee.onStorageChanged = onStorageChanged;
      ee.reset = key => {
        set(key, pe.deepCopy(defaults[key]));
      };
      ee.set = set;
      ee.subscribe = (keys, fn, runNow) => {
        if (!fn) return;
        let toRun;
        for (const key of Array.isArray(keys) ? new Set(keys) : [ keys ]) if (key in defaults) {
          (onChange[key] ??= new Set).add(fn);
          runNow && (busy ? (toRun ??= []).push(key) : fn(key, values[key], !0));
        } else warnUnknown(key);
        return toRun ? busy.then(() => {
          for (const key of toRun) fn(key, values[key], !0);
        }) : void 0;
      };
      ee.unsubscribe = (keys, fn) => {
        for (const key of Array.isArray(keys) ? keys : [ keys ]) {
          const fns = onChange[key];
          if (fns) {
            fns.delete(fn);
            fns.size || delete onChange[key];
          }
        }
      };
    },
    5880(_, ee, oe) {
      oe.d(ee, {});
      oe(9458);
      const chromeLocal = Object.assign(browser.storage.local, {
        async getValue(key) {
          return (await this.get(key))[key];
        }
      });
      browser;
      ee.chromeLocal = chromeLocal;
    },
    8660(_, ee, oe) {
      ee.getMetaComment = (str, action) => {
        let a, b, res;
        let i = 0;
        for (;(RX_META1.lastIndex = i, a = RX_META1.exec(str)) && (RX_META2.lastIndex = RX_META1.lastIndex, 
        b = RX_META2.exec(str)); ) {
          i = RX_META2.lastIndex;
          if (b[1]) break;
        }
        if (action === "del") res = a && b?.[1] ? str.slice(0, a.index) + str.slice(i) : str; else if (a && b && (b = b[1])) if (action === "?") res = !0; else {
          a = a.index;
          res = str.slice(a, i);
          action === "match" && ((res = [ res ]).index = a);
        }
        return res || "";
      };
      ee.styleCodeEmpty = function styleCodeEmpty(sec) {
        const {code} = sec;
        let res = !code;
        if (res || (res = sec._empty) != null) return res;
        const len = code.length;
        const rx = STYLE_CODE_EMPTY_RE;
        rx.lastIndex = 0;
        let i = 0;
        for (;rx.exec(code) && (i = rx.lastIndex) !== len; ) ;
        Object.defineProperty(sec, "_empty", {
          value: res = i === len,
          configurable: !0
        });
        styleCodeEmpty.lastIndex = i;
        return res;
      };
      ee.styleJSONseemsValid = json => json && typeof json.name == "string" && json.name.trim() && Array.isArray(json.sections) && typeof json.sections[0]?.code == "string";
      ee.styleSectionsEqual = ({sections: a}, {sections: b}) => a && b && a.length === b.length && a.every(sameSection, b);
      oe.d(ee, {});
      const TO_CSS = {
        domains: "domain",
        urlPrefixes: "url-prefix",
        urls: "url",
        regexps: "regexp"
      };
      const RX_META1 = /\/\*!?\s*==userstyle==/gi;
      const RX_META2 = /(==\/userstyle==\s*)?\*\//gi;
      const STYLE_CODE_EMPTY_RE = /\s+|\/\*([^*]+|\*(?!\/))*(\*\/|$)|@namespace[^;]+;|@charset[^;]+;/iuy;
      const rxEscape = /[\\"]/g;
      function sameSection(secA, i) {
        const secB = this[i];
        if (equalOrEmpty(secA.code, secB.code, !0)) {
          for (const target in TO_CSS) if (!equalOrEmpty(secA[target], secB[target], !1)) return;
          return !0;
        }
      }
      function equalOrEmpty(a, b, isStr) {
        const typeA = isStr ? typeof a == "string" : Array.isArray(a);
        const typeB = isStr ? typeof b == "string" : Array.isArray(b);
        return typeA && typeB && (isStr ? a === b : a.length === b.length && arrayEquals(a, b)) || (a == null || typeA && !a.length) && (b == null || typeB && !b.length);
      }
      function arrayEquals(a, b) {
        return a.every(thisIncludes, b) && b.every(thisIncludes, a);
      }
      function thisIncludes(el) {
        return this.includes(el);
      }
      ee.FROM_CSS = {
        domain: "domains",
        "url-prefix": "urlPrefixes",
        url: "urls",
        regexp: "regexps"
      };
      ee.RX_META1 = RX_META1;
      ee.TO_CSS = TO_CSS;
      ee.getPreprocessorMode = (u, omitVanilla) => (u = typeof u == "string" ? u : u.preprocessor) === "less" ? "text/x-less" : u === "stylus" ? u : !omitVanilla && "css";
      ee.styleToCss = style => {
        const res = [];
        for (const section of style.sections) {
          let funcs, arr, cssName;
          for (const propName in TO_CSS) if (arr = section[propName]) {
            cssName = TO_CSS[propName];
            for (const v of arr) {
              res.push(funcs ? ", " : res.length ? "\n\n@-moz-document " : "@-moz-document ", cssName, '("', v.replace(rxEscape, "\\$&"), '")');
              funcs = !0;
            }
          }
          res.push(funcs ? " {\n" : "", section.code, funcs ? "\n}" : "");
        }
        return res.join("");
      };
    },
    1807(_, ee, oe) {
      oe.d(ee, {});
      var ae = oe(6940);
      const connected = "connected";
      const getPhaseText = (phase, loaded, total) => ae.t(`optionsSyncStatus${ae.capitalize(phase)}`, total && [ loaded + 1, total ], !1);
      ee.DRIVE_NAMES = {
        dropbox: "Dropbox",
        google: "Google Drive",
        onedrive: "OneDrive",
        webdav: "WebDAV"
      };
      ee.getStatusText = (status, verbose) => {
        if (status.syncing) {
          const {phase, loaded, total} = status.progress || {};
          return phase ? getPhaseText(phase, loaded, total) || `${phase} ${loaded} / ${total}` : ae.t("optionsSyncStatusSyncing");
        }
        const {state, errorMessage} = status;
        return !errorMessage || state !== connected && state !== "disconnected" ? state !== connected || status.login ? verbose && getPhaseText(state) || state : ae.t("optionsSyncStatusRelogin") : errorMessage;
      };
    },
    7046(_, ee, oe) {
      ee.renderTargetIcons = async (what, valueSel, valueProp) => {
        const reentry = queue.size;
        what.forEach ? what.forEach(queue.add, queue) : queue.add(what);
        if (!reentry) {
          badFavs ??= global.badFavs;
          for (;what = queue.values().next().value; ) {
            for (const el of what.matches?.(TARGET_SEL) ? [ what ] : what.$$(TARGET_SEL)) {
              let val = valueSel ? el.$(valueSel)[valueProp] : el.textContent;
              if (!val || !(val = guessSite(el.dataset.type, val)) || badFavs.has(val)) continue;
              val !== pe.MF_ICON && (val = le.favicon(val));
              if (!detecting) {
                detecting = !0;
                setupBadFavsDetector((pe.ownTab ?? await pe.getOwnTab()).id);
              }
              let img = el.$("img");
              if (img) (img.dataset.src || img.src) !== val && (img.src = val); else {
                img = document.createElement("img");
                img.loading = "lazy";
                img.src = val;
                el.prepend(img);
              }
            }
            queue.delete(what);
          }
        }
      };
      var ae = oe(4930);
      var le = oe(8982);
      var ue = oe(6940);
      var pe = oe(1480);
      const rxDrop = /(?:\?!([^)]+\))|\(\?![\w(]+[^)]+[\w|)]+)|(?:\|[^)]+)+\)/g;
      const rxHostFromRE = /(?:[^-\w\\](?!https?)(\w[-\w]*)(?:[^\w.]|\\\w\b)*(\.)[^\w\\]*)?(\w[-\w]*)[^\w.]*(\.)[^\w\\]*([a-z]{2,10})(?:[^-\w]*(-)[^\w\\]*([a-z]{2,10}))?(?=\W|$)/;
      const rxHostFromUrl = /^(?:ht|f)tps?:\/\/(?:[^@/]*@)?([-.\w]+)/;
      const rxIsExtensionUrl = /-extension:\\?\//;
      const TARGET_SEL = ".target";
      const queue = new Set;
      let badFavs;
      let detecting;
      function guessSite(type, val) {
        if (type === "domain") val === pe.ownId && (val = pe.MF_ICON); else if (rxIsExtensionUrl.test(val)) val = pe.MF_ICON; else if (type === "regexp") {
          if (val = val.replace(rxDrop, "").match(rxHostFromRE)) {
            val[0] = "";
            val = val.filter(Boolean).join("");
          }
        } else (val = val.match(rxHostFromUrl)) && (val = val[1]);
        return val;
      }
      function setupBadFavsDetector(tabId) {
        const faviconGlob = le.favicon("*");
        const a = faviconGlob.indexOf("*");
        const b = a - faviconGlob.length + 1 || void 0;
        const fn = e => {
          const code = e.statusCode;
          const host = code && code !== 200 && e.url.slice(a, b);
          if (host && !badFavs.has(host)) {
            badFavs.add(host);
            ue.debounce(ae.API.prefsDB.put, 250, [ ...badFavs ], "badFavs");
            for (const v of chrome.extension.getViews()) if (v.badFavs) {
              v.badFavs.add(host);
              for (const img of v.document.$$(`img[src="${e.url}"]`)) img.removeAttribute("src");
            }
          }
        };
        const filter = {
          urls: [ faviconGlob ],
          types: [ "image" ],
          tabId
        };
        chrome.webRequest.onCompleted.addListener(fn, filter);
        chrome.webRequest.onErrorOccurred.addListener(fn, filter);
      }
    },
    1949(_, ee, oe) {
      oe.d(ee, {
        isDark: () => isDark
      });
      var ae = oe(7986);
      var le = oe(6518);
      var ue = oe(3619);
      var pe = oe(6990);
      var fe = oe(492);
      var he = oe(8982);
      var ye = oe(1480);
      const onDarkChanged = new Set;
      const MEDIA_ON = "screen";
      const MEDIA_OFF = "not all";
      const MEDIA_NAME = "dark";
      const map = {
        [MEDIA_ON]: !0,
        [MEDIA_OFF]: !1
      };
      let isDark;
      (async () => {
        let favicon;
        window === top ? ({dark: isDark, favicon} = pe.swController ? fe.clientData : await fe.clientData) : isDark = parent.document.documentElement.dataset.uiTheme === "dark";
        updateDOM();
        ue.onMessage.set(e => {
          if (e.method === "colorScheme" && isDark !== e.value) {
            isDark = e.value;
            updateDOM();
          }
        });
        favicon && window === top && !location.href.startsWith(he.actionPopupUrl) && document.head.append(...[ 32, 16 ].map(size => ae.$create("link", {
          rel: "icon",
          href: `${ye.MF_ICON_PATH}${isDark ? "" : "light/"}${size}${ye.MF_ICON_EXT}`,
          sizes: size + "x" + size
        })));
      })();
      function updateDOM() {
        ae.$root.dataset.uiTheme = isDark ? "dark" : "light";
        le.getCssMediaRuleByName(MEDIA_NAME, m => {
          map[m[0]] !== isDark && (m.mediaText = `${isDark ? MEDIA_ON : MEDIA_OFF},${MEDIA_NAME}`);
        });
        for (const fn of onDarkChanged) fn(isDark);
      }
      ee.onDarkChanged = onDarkChanged;
    },
    8970(_, ee, oe) {
      const uad = navigator.userAgentData;
      const ua = uad || navigator.userAgent;
      const brands = uad ? uad.brands.map(_ => `${_.brand}/${_.version}`).join(" ") : ua;
      const platform = uad ? uad.platform || navigator.platform : ua;
      const chromeVer = +brands.match(/Chrom\w*\/(\d+)|$/)[1];
      const CHROME = chromeVer;
      const FIREFOX = chromeVer ? NaN : +brands.match(/Firefox\w*\/(\d+)|$/)[1];
      const OPERA = +brands.match(/(?:Opera|OPR)\w*\/(\d+)|$/)[1];
      const MAC = /mac/i.test(platform);
      const MOBILE = uad ? uad.mobile : /Android/.test(ua);
      const WINDOWS = /Windows/.test(platform);
      const VIVALDI = +brands.match(/Vivaldi\w*\/(\d+)|$/)[1];
      ee.CHROME = CHROME;
      ee.FIREFOX = FIREFOX;
      ee.MAC = MAC;
      ee.MOBILE = MOBILE;
      ee.OPERA = OPERA;
      ee.VIVALDI = VIVALDI;
      ee.WINDOWS = WINDOWS;
    },
    8982(_, ee, oe) {
      oe.d(ee, {});
      const ownRoot = chrome.runtime.getURL("");
      const actionPopupUrl = ownRoot + "popup.html";
      const usoaRaw = [ "https://cdn.jsdelivr.net/gh/uso-archive/data@flomaster/data/", "https://raw.githubusercontent.com/uso-archive/data/flomaster/data/", "https://cdn.jsdelivr.net/gh/33kk/uso-archive@flomaster/data/", "https://raw.githubusercontent.com/33kk/uso-archive/flomaster/data/" ];
      const usw = "https://userstyles.world/";
      const extractUsoaId = url => url && usoaRaw.some(u => url.startsWith(u)) && +url.match(/\/(\d+)\.user\.css|$/)[1];
      const extractUswId = url => url && url.startsWith(usw) && +url.match(/\/(\d+)\.user\.css|$/)[1];
      const regExpTest = RegExp.prototype.test;
      const supported = regExpTest.bind(new RegExp(`^(?:(?:ht|f)tps?:|file:|${ownRoot})`));
      const isLocalhost = regExpTest.bind(/^file:|^https?:\/\/([^/]+@)?(localhost|127\.0\.0\.1)(:\d+)?\//);
      ee.actionPopupUrl = actionPopupUrl;
      ee.favicon = host => `https://icons.duckduckgo.com/ip3/${host}.ico`;
      ee.installUsercss = "install-usercss.html";
      ee.isLocalhost = isLocalhost;
      ee.makeUpdateUrl = (url, id) => url === "usoa" || !id && (id = extractUsoaId(url)) ? `${usoaRaw[0]}usercss/${id}.user.css` : url === "usw" || !id && (id = extractUswId(url)) ? `${usw}api/style/${id}.user.css` : "";
      ee.ownRoot = ownRoot;
      ee.supported = supported;
      ee.swPath = "/sw.js";
      ee.uso = "https://userstyles.org/";
      ee.usoa = "https://uso.kkx.one/";
      ee.usoaRaw = usoaRaw;
      ee.usw = usw;
      ee.workerPath = "/js/worker.js";
    },
    1480(_, ee, oe) {
      oe.d(ee, {
        ownTab: () => ownTab
      });
      oe(9458);
      var ae = oe(4930);
      var le = oe(492);
      oe(8970);
      var ue = oe(8982);
      var pe = oe(6940);
      let ownTab;
      const ownId = chrome.runtime.id;
      const MF = chrome.runtime.getManifest();
      const MF_ICON = MF.icons[devicePixelRatio > 3 ? 128 : 16 * Math.max(1, Math.round(devicePixelRatio))].replace(ue.ownRoot, "");
      const MF_ICON_PATH = MF_ICON.slice(0, MF_ICON.lastIndexOf("/") + 1);
      const MF_ICON_EXT = MF_ICON.slice(MF_ICON.lastIndexOf("."));
      chrome;
      const browserWindows = browser.windows;
      const browserSidepanel = chrome.sidePanel;
      const browserSidebar = browserSidepanel || browser.sidebarAction;
      browser;
      const getOwnTab = async () => ownTab = await browser.tabs.getCurrent() || !1;
      const openSidebar = async (path, close, where) => {
        path += (path.includes("?") ? "&" : "?") + "sidebar";
        return pe.isSidebar ? location.assign(path) : (browserSidepanel ? (browserSidepanel.setOptions({
          tabId: where.tabId,
          path
        }), browserSidepanel.open(where)) : (browserSidebar.setPanel({
          ...where,
          panel: path
        }), browserSidebar.open())).then(!pe.isSidebar && close && global.close);
      };
      global._deepCopy = pe.deepCopy;
      ee.MF = MF;
      ee.MF_ICON = MF_ICON;
      ee.MF_ICON_EXT = MF_ICON_EXT;
      ee.MF_ICON_PATH = MF_ICON_PATH;
      ee.browserSidebar = browserSidebar;
      ee.browserWindows = browserWindows;
      ee.closeCurrentTab = async () => {
        if (ownTab ??= await getOwnTab()) return chrome.tabs.remove(ownTab.id);
      };
      ee.getActiveTab = async () => {
        let [v] = await browser.tabs.query({
          currentWindow: !0,
          active: !0
        });
        !v && browserWindows && (v = await browserWindows.getCurrent().catch(pe.NOP)) && ([v] = await browser.tabs.query({
          windowId: v.id,
          active: !0
        }).catch(pe.NOP));
        return v;
      };
      ee.getOwnTab = getOwnTab;
      ee.ignoreChromeError = () => chrome.runtime.lastError;
      ee.openDashboard = (mgr, side, close, where) => browserSidebar && (side || le.__values[mgr ? "popup.sidePanel.manager" : "popup.sidePanel.options"]) ? openSidebar(mgr ? "manage.html?" + new URLSearchParams(mgr) : "options.html", close, where) : ae.API.tabs.openManager(mgr || {
        options: !0
      }).then(close);
      ee.openSidebar = openSidebar;
      ee.ownId = ownId;
      ee.paintCanvas = (w, h, cb) => {
        const canvas = new OffscreenCanvas(w, h);
        const ctx = canvas.getContext("2d");
        cb(ctx, canvas);
        return ctx.getImageData(0, 0, w, h);
      };
    },
    6940(_, ee, oe) {
      ee.deepCopy = deepCopy;
      ee.deepEqual = function deepEqual(a, b, ignoredKeys) {
        if (!a || !b || a === b) return a === b;
        const type = typeof a;
        if (type !== typeof b) return !1;
        if (type !== "object") return a === b;
        if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i], ignoredKeys));
        for (const key in a) if (!(!hasOwn(a, key) || ignoredKeys && ignoredKeys.includes(key))) {
          if (!hasOwn(b, key)) return !1;
          if (!deepEqual(a[key], b[key], ignoredKeys)) return !1;
        }
        for (const key in b) if (!(!hasOwn(b, key) || ignoredKeys && ignoredKeys.includes(key) || hasOwn(a, key))) return !1;
        return !0;
      };
      ee.deepMerge = deepMerge;
      ee.fetchText = async (url, opts) => (await fetch(url, opts)).text();
      ee.isEmptyObj = obj => {
        if (obj) for (const k in obj) if (hasOwn(obj, k)) return !1;
        return !0;
      };
      ee.mapObj = mapObj;
      ee.reuseStyleVars = (vars, src) => {
        let old;
        if (vars && src && (src = src.usercssData.vars)) for (const key in vars) (old = src[key]) && (old = old.value) != null && (vars[key].value = old);
      };
      ee.tryJSONparse = jsonString => {
        try {
          if (jsonString) return JSON.parse(jsonString);
        } catch {}
      };
      ee.tryRegExp = (regexp, flags) => {
        try {
          return new RegExp(regexp, flags);
        } catch {}
      };
      ee.tryURL = url => {
        try {
          if (url) return new URL(url);
        } catch {}
        return "";
      };
      oe.d(ee, {
        sessionStore: () => sessionStore
      });
      const hasOwn = Object.call.bind({}.hasOwnProperty);
      const stringAsRegExpStr = s => s.replace(/[{}()[\]\\.+*?^$|]/g, "\\$&");
      const urlParams = new URLSearchParams(location.search);
      const isSidebar = urlParams.has("sidebar");
      const tCache = new Map;
      const debounce = (() => {
        const timers = new Map;
        const clearTimer = data => clearTimeout(data.timer);
        const run = async (fn, args) => {
          timers.delete(fn);
          fn(...args);
        };
        return Object.assign((fn, delay, ...args) => {
          delay = +delay || 0;
          let time;
          let old = timers.get(fn);
          if (old) {
            if (delay && old.time < (time = performance.now() + delay)) clearTimer(old); else if (old.args.length === args.length && old.args.every((a, i) => a === args[i])) return;
          } else timers.set(fn, old = {});
          old.args = args;
          old.time = delay && (time ?? performance.now() + delay);
          old.timer = setTimeout(run, delay, fn, args);
        }, {
          timers,
          run,
          unregister: fn => {
            const data = timers.get(fn);
            if (data) {
              clearTimer(data);
              timers.delete(fn);
            }
          }
        });
      })();
      function mapObj(obj, fn, keys) {
        if (!obj) return obj;
        const res = {};
        for (const k of keys || Object.keys(obj)) keys && !(k in obj) || (res[k] = fn ? fn(obj[k], k, obj) : obj[k]);
        return res;
      }
      function deepMerge(src, dst, mergeArrays) {
        if (!src || typeof src != "object") return src;
        if (Array.isArray(src)) if (dst && mergeArrays) for (const v of src) dst.push(deepMerge(v)); else dst = Array.prototype.map.call(src, deepCopy); else {
          dst || (dst = {});
          for (const [k, v] of Object.entries(src)) dst[k] = deepMerge(v, dst[k]);
        }
        return dst;
      }
      function deepCopy(src) {
        return deepMerge(src);
      }
      let sessionStore = new Proxy({}, {
        get(target, name) {
          try {
            const api = sessionStorage;
            sessionStore = api;
            return api[name];
          } catch {
            sessionStore = target;
          }
        },
        set(target, name, value) {
          try {
            const api = sessionStorage;
            api[name] = `${value}`;
            sessionStore = api;
          } catch {
            sessionStore = target;
            target[name] = `${value}`;
          }
          return !0;
        },
        deleteProperty(target, name) {
          try {
            const api = sessionStorage;
            return delete api[name] && !!(sessionStore = api);
          } catch {
            sessionStore = target;
            return !0;
          }
        }
      });
      ee.NOP = () => {};
      ee.RX_MAYBE_REGEXP = /^\s*\/(.+?)\/([simguy]*)\s*$/;
      ee.capitalize = s => s.slice(0, 1).toUpperCase() + s.slice(1);
      ee.clamp = (value, min, max) => value < min ? min : value > max ? max : value;
      ee.clipString = (str, limit = 100) => str.length > limit ? str.substr(0, limit) + "..." : str;
      ee.debounce = debounce;
      ee.describeClient = () => ({
        dark: +matchMedia("(prefers-color-scheme:dark)").matches,
        frameId: window === top ? 0 : 1,
        url: location.href
      });
      ee.getHost = url => url.split("/", 3)[2];
      ee.hasOwn = hasOwn;
      ee.isSidebar = isSidebar;
      ee.makePropertyPopProxy = data => new Proxy(data, {
        get: (obj, k, v) => (v = obj[k], delete obj[k], v)
      });
      ee.makeUserCssFindFilter = ucd => mapObj(ucd, null, [ "name", "namespace" ]);
      ee.sleep = ms => new Promise(ms > 0 ? cb => setTimeout(cb, ms) : setTimeout);
      ee.sleep0 = () => global.scheduler?.yield?.() || new Promise(setTimeout);
      ee.stringAsRegExp = (s, flags) => new RegExp(stringAsRegExpStr(s), flags);
      ee.stringAsRegExpStr = stringAsRegExpStr;
      ee.t = (key, params, strict = !0) => {
        const s = !params && tCache.get(key) || chrome.i18n.getMessage(key, params);
        if (!s && strict) throw `Missing string "${key}"`;
        params || tCache.set(key, s);
        return s;
      };
      ee.urlParams = urlParams;
    }
  };
  var ee = {};
  function oe(ae) {
    var le = ee[ae];
    if (le !== void 0) return le.exports;
    var module = ee[ae] = {
      exports: {}
    };
    _[ae](module, module.exports, oe);
    return module.exports;
  }
  oe.m = _;
  deferred = [], oe.O = (result, chunkIds, fn, priority) => {
    if (!chunkIds) {
      var notFulfilled = 1 / 0;
      for (i = 0; i < deferred.length; i++) {
        var [chunkIds, fn, priority] = deferred[i];
        var fulfilled = !0;
        for (var j = 0; j < chunkIds.length; j++) if ((priority & !1 || notFulfilled >= priority) && Object.keys(oe.O).every(key => oe.O[key](chunkIds[j]))) chunkIds.splice(j--, 1); else {
          fulfilled = !1;
          priority < notFulfilled && (notFulfilled = priority);
        }
        if (fulfilled) {
          deferred.splice(i--, 1);
          var r = fn();
          r !== void 0 && (result = r);
        }
      }
      return result;
    }
    priority = priority || 0;
    for (var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
    deferred[i] = [ chunkIds, fn, priority ];
  };
  var deferred;
  oe.n = module => {
    var getter = module && module.__esModule ? () => module.default : () => module;
    oe.d(getter, {
      a: getter
    });
    return getter;
  };
  oe.d = (exports, definition) => {
    for (var key in definition) oe.o(definition, key) && !oe.o(exports, key) && Object.defineProperty(exports, key, {
      enumerable: !0,
      get: definition[key]
    });
  };
  (() => {
    oe.f = {};
    oe.e = chunkId => Promise.all(Object.keys(oe.f).reduce((promises, key) => {
      oe.f[key](chunkId, promises);
      return promises;
    }, []));
  })();
  oe.u = chunkId => chunkId === "vendor-overwrites_beautify_beautify-css-mod_js" ? "js/beautify-mod.js" : chunkId === "jsonlint" ? "js/jsonlint.js" : chunkId === "edit-lazy" ? "js/edit-lazy.js" : chunkId === "manage_import-export_js" ? "js/manage-import-export.js" : chunkId === "popup_search_js" ? "js/popup-search.js" : void 0;
  oe.miniCssF = chunkId => chunkId === "edit-lazy" ? "css/edit-lazy.css" : chunkId === "popup_search_js" ? "css/popup-search.css" : void 0;
  oe.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
  inProgress = {}, ae = "Stylus:", oe.l = (url, done, key, chunkId) => {
    if (inProgress[url]) inProgress[url].push(done); else {
      var script, needAttach;
      if (key !== void 0) {
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
          var s = scripts[i];
          if (s.getAttribute("src") == url || s.getAttribute("data-webpack") == ae + key) {
            script = s;
            break;
          }
        }
      }
      if (!script) {
        needAttach = !0;
        (script = document.createElement("script")).charset = "utf-8";
        oe.nc && script.setAttribute("nonce", oe.nc);
        script.setAttribute("data-webpack", ae + key);
        script.src = url;
      }
      inProgress[url] = [ done ];
      var onScriptComplete = (prev, event) => {
        script.onerror = script.onload = null;
        clearTimeout(timeout);
        var doneFns = inProgress[url];
        delete inProgress[url];
        script.parentNode && script.parentNode.removeChild(script);
        doneFns && doneFns.forEach(fn => fn(event));
        if (prev) return prev(event);
      };
      var timeout = setTimeout(onScriptComplete.bind(null, void 0, {
        type: "timeout",
        target: script
      }), 12e4);
      script.onerror = onScriptComplete.bind(null, script.onerror);
      script.onload = onScriptComplete.bind(null, script.onload);
      needAttach && document.head.appendChild(script);
    }
  };
  var inProgress, ae;
  oe.r = exports => Object.defineProperties(exports, {
    [Symbol.toStringTag]: {
      value: "Module"
    },
    __esModule: {
      value: !0
    }
  });
  oe.p = "/";
  (() => {
    if (typeof document != "undefined") {
      var createStylesheet = (chunkId, fullhref, oldTag, resolve, reject) => {
        var linkTag = document.createElement("link");
        linkTag.rel = "stylesheet";
        linkTag.type = "text/css";
        oe.nc && (linkTag.nonce = oe.nc);
        linkTag.onerror = linkTag.onload = event => {
          linkTag.onerror = linkTag.onload = null;
          if (event.type === "load") resolve(); else {
            var errorType = event && event.type;
            var realHref = event && event.target && event.target.href || fullhref;
            var err = new Error("Loading CSS chunk " + chunkId + " failed.\n(" + errorType + ": " + realHref + ")");
            err.name = "ChunkLoadError";
            err.code = "CSS_CHUNK_LOAD_FAILED";
            err.type = errorType;
            err.request = realHref;
            linkTag.parentNode && linkTag.parentNode.removeChild(linkTag);
            reject(err);
          }
        };
        linkTag.href = fullhref;
        oldTag ? oldTag.parentNode.insertBefore(linkTag, oldTag.nextSibling) : document.head.appendChild(linkTag);
        return linkTag;
      };
      var findStylesheet = (href, fullhref) => {
        var existingLinkTags = document.getElementsByTagName("link");
        for (var i = 0; i < existingLinkTags.length; i++) {
          var dataHref = (tag = existingLinkTags[i]).getAttribute("data-href") || tag.getAttribute("href");
          if (tag.rel === "stylesheet" && (dataHref === href || dataHref === fullhref)) return tag;
        }
        var existingStyleTags = document.getElementsByTagName("style");
        for (i = 0; i < existingStyleTags.length; i++) {
          var tag;
          if ((dataHref = (tag = existingStyleTags[i]).getAttribute("data-href")) === href || dataHref === fullhref) return tag;
        }
      };
      var loadStylesheet = chunkId => new Promise((resolve, reject) => {
        var href = oe.miniCssF(chunkId);
        var fullhref = oe.p + href;
        if (findStylesheet(href, fullhref)) return resolve();
        createStylesheet(chunkId, fullhref, null, resolve, reject);
      });
      var _ = {
        common: 0
      };
      oe.f.miniCss = (chunkId, promises) => {
        _[chunkId] ? promises.push(_[chunkId]) : _[chunkId] !== 0 && {
          "edit-lazy": 1,
          popup_search_js: 1
        }[chunkId] && promises.push(_[chunkId] = loadStylesheet(chunkId).then(() => {
          _[chunkId] = 0;
        }, e => {
          delete _[chunkId];
          throw e;
        }));
      };
    }
  })();
  (() => {
    var _ = {
      common: 0,
      "dlg_config-dialog_css-css_dom-error_css-css_global-dark_css-css_global_css-css_onoffswitch_cs-7b17ff": 0
    };
    oe.f.j = (chunkId, promises) => {
      var ee = oe.o(_, chunkId) ? _[chunkId] : void 0;
      if (ee !== 0) if (ee) promises.push(ee[2]); else if ("dlg_config-dialog_css-css_dom-error_css-css_global-dark_css-css_global_css-css_onoffswitch_cs-7b17ff" != chunkId) {
        var promise = new Promise((resolve, reject) => ee = _[chunkId] = [ resolve, reject ]);
        promises.push(ee[2] = promise);
        var url = oe.p + oe.u(chunkId);
        var error = new Error;
        oe.l(url, event => {
          if (oe.o(_, chunkId)) {
            (ee = _[chunkId]) !== 0 && (_[chunkId] = void 0);
            if (ee) {
              var errorType = event && (event.type === "load" ? "missing" : event.type);
              var realSrc = event && event.target && event.target.src;
              error.message = "Loading chunk " + chunkId + " failed.\n(" + errorType + ": " + realSrc + ")";
              error.name = "ChunkLoadError";
              error.type = errorType;
              error.request = realSrc;
              ee[1](error);
            }
          }
        }, "chunk-" + chunkId, chunkId);
      } else _[chunkId] = 0;
    };
    oe.O.j = chunkId => _[chunkId] === 0;
    var ee = (ee, data) => {
      var [chunkIds, moreModules, runtime] = data;
      var ae, chunkId, i = 0;
      if (chunkIds.some(id => _[id] !== 0)) {
        for (ae in moreModules) oe.o(moreModules, ae) && (oe.m[ae] = moreModules[ae]);
        if (runtime) var result = runtime(oe);
      }
      ee && ee(data);
      for (;i < chunkIds.length; i++) {
        oe.o(_, chunkId = chunkIds[i]) && _[chunkId] && _[chunkId][0]();
        _[chunkId] = 0;
      }
      return oe.O(result);
    };
    var ae = self.webpackChunkStylus = self.webpackChunkStylus || [];
    ae.forEach(ee.bind(null, 0));
    ae.push = ee.bind(null, ae.push.bind(ae));
  })();
})();