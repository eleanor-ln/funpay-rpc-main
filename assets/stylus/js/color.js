"use strict";

(self.webpackChunkStylus = self.webpackChunkStylus || []).push([ [ "color" ], {
  2928(_, ee, oe) {
    ee.parseColorFunc = parseColorFunc;
    const mathRound = Math.round;
    const RX_ANGLE = /(?:deg|y?rad|turn|)$/;
    const ANGLE_TO_DEG = {
      __proto__: null,
      grad: .9,
      rad: 180 / Math.PI,
      turn: 360
    };
    const constrainHue = x => x < 0 ? x % 360 + 360 : x >= 360 ? x % 360 : x;
    class Color {
      constructor(type, x, y, z, a, mod) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.z = z;
        this.a = a;
        this.mod = mod;
      }
      toString(type, {hexUppercase: upper, uso, round} = {}) {
        type ||= this.type;
        const {a, mod, type: src} = this;
        const hex = type === 1;
        const rgb = type === 2;
        const comma = mod & 1;
        const sep = comma || uso ? ", " : " ";
        const dstConv = hex ? 2 : type;
        let color = (src === 1 ? 2 : src) === dstConv ? this : this.to(dstConv);
        let aa, pctX, pctY, pctZ, pctA;
        let {x, y, z} = color;
        if (hex || uso) {
          x = mathRound(x);
          y = mathRound(y);
          z = mathRound(z);
        } else {
          x = !x && mod & 64 ? "none" : ((pctX = mod & 4) && rgb && (x /= 2.55), round || rgb && comma ? mathRound(x) : x);
          y = !y && mod & 128 ? "none" : ((pctY = mod & 8) && rgb && (y /= 2.55), round || rgb && comma ? mathRound(y) : y);
          z = !z && mod & 256 ? "none" : ((pctZ = mod & 16) && rgb && (z /= 2.55), round || rgb && comma ? mathRound(z) : z);
          aa = a <= 0 ? mod & 512 ? "none" : "0" : a < 1 ? (aa = (pctA = mod & 32) ? a * 100 : a, 
          round || rgb && comma ? pctA ? mathRound(aa) : formatAlpha(aa) : aa) : "";
        }
        if (uso) color = x + sep + y + sep + z; else if (hex) {
          aa = a < 1 ? mathRound(a * 255) : 255;
          color = (type = uso || x % 17 || y % 17 || z % 17 || aa % 17) ? 4294967296 + x * 16777216 + (y << 16) + (z << 8) + aa : 65536 + (x / 17 << 12) + (y / 17 << 8) + (z / 17 << 4) + aa / 17;
          color = "#" + color.toString(16).slice(1, a < 1 ? void 0 : type ? -2 : -1);
          (upper == null || upper === 2 ? mod : upper) && (x & !0 || x >= 160 || y & !0 || y >= 160 || z & !0 || z >= 160 || a < 1 && (aa & !0 || aa >= 160)) && (color = color.toUpperCase());
        } else (color = type === 2 ? "rgb" : type === 3 ? "hsl" : type === 4 ? "hwb" : "") && (color += (mod & 2 ? "a(" : "(") + x + (pctX ? "%" : "") + sep + y + (pctY ? "%" : "") + sep + z + (pctZ ? "%" : "") + (aa && (comma ? sep : " / ")) + aa + (aa && pctA ? "%" : "") + ")");
        return color;
      }
      static parse(str, len = typeof str == "string" && (str = str.trim()).length, hex) {
        if (!len) return;
        let i, v;
        v = str;
        str = str.toLowerCase();
        if (hex ?? str.charCodeAt(0) === 35) {
          const isUpperCase = v !== str;
          v = len === 4 || len === 5 || len === 7 || len === 9;
          return v ? parseHex(str, len, isUpperCase) : void 0;
        }
        if (str.charCodeAt(str.length - 1) !== 41) {
          v = NAMED_COLORS.get(str);
          +v && NAMED_COLORS.set(str, v = new Color(1, v >> 16, v >> 8 & 255, v & 255));
          return v;
        }
        let type, a;
        i = str.charCodeAt(3);
        return (i = i === 40 ? 4 : (a = i === 97) && str.charCodeAt(4) === 40 && 5) && (type = (v = str.charCodeAt(0)) === 114 ? str.charCodeAt(1) === 103 && str.charCodeAt(2) === 98 && 2 : v === 104 && ((v = str.charCodeAt(1)) === 115 ? str.charCodeAt(2) === 108 && 3 : v === 119 && str.charCodeAt(2) === 98 && 4)) && (str = str.slice(i, -1).trim()) ? parseColorFunc(type, str, a) : void 0;
      }
      to(type) {
        if (type === this.type) return this;
        let res = this.type !== 5 && this.toHSV();
        let {x, y, z} = res || this;
        x = constrainHue(x);
        if (type === 3) {
          const l = (2 - y) * z / 2;
          const t = l < .5 ? l * 2 : 2 - l * 2;
          y = t ? y * z / t * 100 : 0;
          z = l * 100;
        } else if (type === 4) {
          y = (1 - y) * z * 100;
          z = 100 * (1 - z);
        } else {
          const C = y * z;
          const V = C * (1 - Math.abs(x / 60 % 2 - 1));
          const m = z - C;
          z = x < 60 ? (x = C, y = V, 0) : x < 120 ? (x = V, y = C, 0) : x < 180 ? (x = 0, 
          y = C, V) : x < 240 ? (x = 0, y = V, C) : x < 300 ? (x = V, y = 0, C) : x < 360 ? (x = C, 
          y = 0, V) : x = y = NaN;
          x = (x + m) * 255;
          y = (y + m) * 255;
          z = (z + m) * 255;
        }
        if (res) {
          res.x = x;
          res.y = y;
          res.z = z;
        } else res = new Color(type, x, y, z, this.a, this.mod);
        return res;
      }
      toHSV() {
        let {type, x, y, z, a, mod} = this;
        if (type === 3) {
          const t = y * (z < 50 ? z : 100 - z) / 100;
          y = t + z ? 200 * t / (t + z) / 100 : 0;
          z = (t + z) / 100;
        } else if (type === 4) {
          y = y < 0 ? 0 : y > 100 ? 1 : y / 100;
          z = z < 0 ? 0 : z > 100 ? 1 : z / 100;
          y = z === 1 ? 0 : 1 - y / (1 - z);
          z = 1 - z;
        } else {
          x /= 255;
          y /= 255;
          z /= 255;
          const MaxC = Math.max(x, y, z);
          const DeltaC = MaxC - Math.min(x, y, z);
          x = DeltaC === 0 ? 0 : MaxC === x ? (y - z) / DeltaC % 6 * 60 : MaxC === y ? 60 * ((z - x) / DeltaC + 2) : MaxC === z ? 60 * ((x - y) / DeltaC + 4) : 0;
          y = MaxC === 0 ? 0 : DeltaC / MaxC;
          z = MaxC;
        }
        return new Color(5, constrainHue(x), y, z, a, mod);
      }
    }
    function parseHex(str, len, isUpperCase) {
      for (let alpha, c, i = 1, rgb = 0; ;) {
        c = str.charCodeAt(i);
        if (!((c -= 48) >= 0 && c <= 9 || (c -= 39) >= 10 && c <= 15)) break;
        i === 7 ? alpha = c : i === 8 ? alpha = (alpha << 4 | c) / 255 : i === 4 && len < 7 ? alpha = c * 17 / 255 : rgb = rgb << 4 | c;
        if (++i === len) return new Color(1, len < 7 ? 17 * (rgb >> 8) : rgb >> 16, len < 7 ? 17 * (rgb >> 4 & 15) : rgb >> 8 & 255, len < 7 ? 17 * (rgb & 15) : rgb & 255, alpha, +isUpperCase);
      }
    }
    function parseColorFunc(type, val, mod = 0) {
      let sA, x, y, z, a, v, pct, units;
      const rgb = type === 2;
      const slash = val.indexOf("/") + 1;
      const space = slash || type === 4 || !val.includes(",");
      if (slash) {
        sA = val.slice(slash).trimStart();
        val = val.slice(0, slash - 1).trimEnd();
      }
      mod && (mod |= 2);
      space || (mod |= 1);
      const parts = val.split(space ? /\s+/ : /\s*,\s*/);
      const len = parts.length;
      const [s1, s2, s3] = parts;
      if ((slash ? len === 3 : len === 3 || len === 4 && (sA = parts[3])) && (x = space && s1 === "none" ? (mod |= 64, 
      0) : (v = s1.charCodeAt(s1.length - 1), rgb ? (pct = v === 37) ? (mod |= 4, +s1.slice(0, -1)) : +s1 : v !== 100 && v !== 103 && v !== 110 || !(units = RX_ANGLE.exec(s1)[0]) ? +s1 : +s1.slice(0, -units.length))) === x && (y = space && s2 === "none" ? (mod |= 64, 
      0) : (y = s2.charCodeAt(s2.length - 1) === 37) !== (!rgb || pct) ? NaN : y ? (mod |= 8, 
      +s2.slice(0, -1)) : +s2) === y && (z = space && s3 === "none" ? (mod |= 64, 0) : (z = s3.charCodeAt(s3.length - 1) === 37) !== (!rgb || pct) ? NaN : z ? (mod |= 16, 
      +s3.slice(0, -1)) : +s3) === z && (sA == null || (a = slash && sA === "none" ? (mod |= 512, 
      0) : sA.charCodeAt(sA.length - 1) === 37 ? (mod |= 32, +sA.slice(0, -1) / 100) : +sA) === a)) {
        a < 0 ? a = 0 : a > 1 && (a = 1);
        if (rgb) {
          x = (x = pct ? x * 2.55 : x) < 0 ? 0 : x > 255 ? 255 : x;
          y = (y = pct ? y * 2.55 : y) < 0 ? 0 : y > 255 ? 255 : y;
          z = (z = pct ? z * 2.55 : z) < 0 ? 0 : z > 255 ? 255 : z;
        } else {
          units && (x *= ANGLE_TO_DEG[units]);
          y < 0 ? y = 0 : y > 100 && (y = 100);
          z < 0 ? z = 0 : z > 100 && (z = 100);
        }
        return new Color(type, x, y, z, a, mod);
      }
    }
    const formatAlpha = (a, precision = 3) => a <= 0 ? "0" : a >= 1 ? "1" : a > 0 && a < 1 ? (precision = +a.toFixed(precision)) && precision < 1 ? "" + precision : "" + a : "";
    const NAMED_COLORS = new Map([ [ "transparent", new Color(2, 0, 0, 0, 0) ], [ "aliceblue", 15792383 ], [ "antiquewhite", 16444375 ], [ "aqua", 65535 ], [ "aquamarine", 8388564 ], [ "azure", 15794175 ], [ "beige", 16119260 ], [ "bisque", 16770244 ], [ "black", 0 ], [ "blanchedalmond", 16772045 ], [ "blue", 255 ], [ "blueviolet", 9055202 ], [ "brown", 10824234 ], [ "burlywood", 14596231 ], [ "cadetblue", 6266528 ], [ "chartreuse", 8388352 ], [ "chocolate", 13789470 ], [ "coral", 16744272 ], [ "cornflowerblue", 6591981 ], [ "cornsilk", 16775388 ], [ "crimson", 14423100 ], [ "cyan", 65535 ], [ "darkblue", 139 ], [ "darkcyan", 35723 ], [ "darkgoldenrod", 12092939 ], [ "darkgray", 11119017 ], [ "darkgrey", 11119017 ], [ "darkgreen", 25600 ], [ "darkkhaki", 12433259 ], [ "darkmagenta", 9109643 ], [ "darkolivegreen", 5597999 ], [ "darkorange", 16747520 ], [ "darkorchid", 10040012 ], [ "darkred", 9109504 ], [ "darksalmon", 15308410 ], [ "darkseagreen", 9419919 ], [ "darkslateblue", 4734347 ], [ "darkslategray", 3100495 ], [ "darkslategrey", 3100495 ], [ "darkturquoise", 52945 ], [ "darkviolet", 9699539 ], [ "deeppink", 16716947 ], [ "deepskyblue", 49151 ], [ "dimgray", 6908265 ], [ "dimgrey", 6908265 ], [ "dodgerblue", 2003199 ], [ "firebrick", 11674146 ], [ "floralwhite", 16775920 ], [ "forestgreen", 2263842 ], [ "fuchsia", 16711935 ], [ "gainsboro", 14474460 ], [ "ghostwhite", 16316671 ], [ "gold", 16766720 ], [ "goldenrod", 14329120 ], [ "gray", 8421504 ], [ "grey", 8421504 ], [ "green", 32768 ], [ "greenyellow", 11403055 ], [ "honeydew", 15794160 ], [ "hotpink", 16738740 ], [ "indianred", 13458524 ], [ "indigo", 4915330 ], [ "ivory", 16777200 ], [ "khaki", 15787660 ], [ "lavender", 15132410 ], [ "lavenderblush", 16773365 ], [ "lawngreen", 8190976 ], [ "lemonchiffon", 16775885 ], [ "lightblue", 11393254 ], [ "lightcoral", 15761536 ], [ "lightcyan", 14745599 ], [ "lightgoldenrodyellow", 16448210 ], [ "lightgray", 13882323 ], [ "lightgrey", 13882323 ], [ "lightgreen", 9498256 ], [ "lightpink", 16758465 ], [ "lightsalmon", 16752762 ], [ "lightseagreen", 2142890 ], [ "lightskyblue", 8900346 ], [ "lightslategray", 7833753 ], [ "lightslategrey", 7833753 ], [ "lightsteelblue", 11584734 ], [ "lightyellow", 16777184 ], [ "lime", 65280 ], [ "limegreen", 3329330 ], [ "linen", 16445670 ], [ "magenta", 16711935 ], [ "maroon", 8388608 ], [ "mediumaquamarine", 6737322 ], [ "mediumblue", 205 ], [ "mediumorchid", 12211667 ], [ "mediumpurple", 9662683 ], [ "mediumseagreen", 3978097 ], [ "mediumslateblue", 8087790 ], [ "mediumspringgreen", 64154 ], [ "mediumturquoise", 4772300 ], [ "mediumvioletred", 13047173 ], [ "midnightblue", 1644912 ], [ "mintcream", 16121850 ], [ "mistyrose", 16770273 ], [ "moccasin", 16770229 ], [ "navajowhite", 16768685 ], [ "navy", 128 ], [ "oldlace", 16643558 ], [ "olive", 8421376 ], [ "olivedrab", 7048739 ], [ "orange", 16753920 ], [ "orangered", 16729344 ], [ "orchid", 14315734 ], [ "palegoldenrod", 15657130 ], [ "palegreen", 10025880 ], [ "paleturquoise", 11529966 ], [ "palevioletred", 14381203 ], [ "papayawhip", 16773077 ], [ "peachpuff", 16767673 ], [ "peru", 13468991 ], [ "pink", 16761035 ], [ "plum", 14524637 ], [ "powderblue", 11591910 ], [ "purple", 8388736 ], [ "rebeccapurple", 6697881 ], [ "red", 16711680 ], [ "rosybrown", 12357519 ], [ "royalblue", 4286945 ], [ "saddlebrown", 9127187 ], [ "salmon", 16416882 ], [ "sandybrown", 16032864 ], [ "seagreen", 3050327 ], [ "seashell", 16774638 ], [ "sienna", 10506797 ], [ "silver", 12632256 ], [ "skyblue", 8900331 ], [ "slateblue", 6970061 ], [ "slategray", 7372944 ], [ "slategrey", 7372944 ], [ "snow", 16775930 ], [ "springgreen", 65407 ], [ "steelblue", 4620980 ], [ "tan", 13808780 ], [ "teal", 32896 ], [ "thistle", 14204888 ], [ "tomato", 16737095 ], [ "turquoise", 4251856 ], [ "violet", 15631086 ], [ "wheat", 16113331 ], [ "white", 16777215 ], [ "whitesmoke", 16119285 ], [ "yellow", 16776960 ], [ "yellowgreen", 10145074 ] ]);
    const ae = Color;
    ee.NAMED_COLORS = NAMED_COLORS;
    ee.constrain = (min, max, value) => value < min ? min : value > max ? max : value;
    ee.constrainHue = constrainHue;
    ee.default = ae;
    ee.formatAlpha = formatAlpha;
  },
  8872(_, ee, oe) {
    ee.default = (el, targets, dummyContainer = document.body) => {
      (targets = targets || {}).fore = "color";
      const colors = {};
      const done = {};
      let numDone = 0;
      let numTotal = 0;
      const rootStyle = getStyle(document.documentElement);
      for (const k in targets) {
        const base = {
          r: 0,
          g: 0,
          b: 0,
          a: 0
        };
        blend(base, rootStyle[targets[k]]);
        colors[k] = base;
        numTotal++;
      }
      const isDummy = typeof el == "string";
      isDummy && (el = dummyContainer.appendChild(ae.$create(el, {
        style: "display: none"
      })));
      for (let current = el; current; current = current && current.parentElement) {
        const style = getStyle(current);
        for (const k in targets) if (!done[k]) {
          done[k] = blend(colors[k], style[targets[k]]);
          numDone += done[k] ? 1 : 0;
          if (numDone === numTotal) {
            current = null;
            break;
          }
        }
        colors.style = colors.style || style;
      }
      isDummy && el.remove();
      for (const k in targets) {
        const c = colors[k];
        isOpaque(c) || blend(colors[k] = {
          r: 255,
          g: 255,
          b: 255,
          a: 1
        }, c);
        const {r, g, b, a} = colors[k];
        colors[k] = `rgba(${r}, ${g}, ${b}, ${a})`;
        colors[k + "Luma"] = (r * .299 + g * .587 + b * .114) / 256;
      }
      le.debounce(clearCache);
      return colors;
    };
    var ae = oe(7986);
    var le = oe(6940);
    const styleCache = new Map;
    function blend(base, color) {
      let r, g, b, a;
      typeof color == "string" ? [r, g, b, a = 255] = (color.match(/\d+/g) || []).map(Number) : ({r, g, b, a = 255} = color);
      if (a === 255) {
        base.r = r;
        base.g = g;
        base.b = b;
        base.a = 1;
      } else if (a) {
        const mixedA = 1 - (1 - a / 255) * (1 - base.a);
        const q1 = a / 255 / mixedA;
        const q2 = base.a * (1 - mixedA) / mixedA;
        base.r = Math.round(r * q1 + base.r * q2);
        base.g = Math.round(g * q1 + base.g * q2);
        base.b = Math.round(b * q1 + base.b * q2);
        base.a = mixedA;
      }
      return isOpaque(base);
    }
    function getStyle(el) {
      let style = styleCache.get(el);
      if (!style) {
        style = getComputedStyle(el);
        styleCache.set(el, style);
      }
      return style;
    }
    function clearCache() {
      styleCache.clear();
    }
    function isOpaque({a}) {
      return Math.abs(a - 1) < .001;
    }
  },
  8976(_, ee, oe) {
    ee.default = function(cm) {
      const CSS_PREFIX = "colorpicker-";
      const HUE_COLORS = [ {
        hex: "#ff0000",
        start: 0
      }, {
        hex: "#ffff00",
        start: .17
      }, {
        hex: "#00ff00",
        start: .33
      }, {
        hex: "#00ffff",
        start: .5
      }, {
        hex: "#0000ff",
        start: .67
      }, {
        hex: "#ff00ff",
        start: .83
      }, {
        hex: "#ff0000",
        start: 1
      } ];
      let maxHeight = "0px";
      let HSV = {};
      let currentFormat;
      const prevHSV = {};
      let initialized = !1;
      let shown = !1;
      let options = {};
      let $root;
      let $sat;
      let $satPointer;
      let $hue;
      let $hueKnob;
      let $opacity;
      let $opacityBar;
      let $opacityKnob;
      let $swatch;
      let $formatChangeButton;
      let $hexCode;
      let $palette;
      const $inputGroups = {};
      const $inputs = {};
      const $hexLettercase = {};
      const allowInputFocus = !("ontouchstart" in document) || window.innerHeight > 800;
      const dragging = {
        saturationPointerPos: {
          x: 0,
          y: 0
        },
        hueKnobPos: 0,
        saturation: !1,
        hue: !1,
        opacity: !1,
        popup: !1
      };
      let prevFocusedElement;
      let lastOutputColor;
      let userActivity;
      const PUBLIC_API = {
        $root,
        show: opt => {
          initialized || init();
          HSV = {};
          currentFormat = "";
          options = PUBLIC_API.options = opt;
          opt.round !== !1 && (opt.round = !0);
          prevFocusedElement = document.activeElement;
          userActivity = !1;
          lastOutputColor = opt.color || "";
          $formatChangeButton.title = opt.tooltipForSwitcher || "";
          maxHeight = `${opt.maxHeight || 300}px`;
          $root.className = [ ...$root.classList ].filter(c => !c.startsWith(`${CSS_PREFIX}theme-`)).concat(CSS_PREFIX + "theme-" + (opt.theme === "dark" || opt.theme === "light" ? opt.theme : (0, 
          ue.default)(options.guessBrightness || cm && (cm.display.renderedView?.[0]?.text || cm.display.lineDiv), {
            bg: "backgroundColor"
          }).bgLuma < .5 ? "dark" : "light")).join(" ");
          document.body.appendChild($root);
          shown = !0;
          registerEvents();
          setFromColor(opt.color);
          setFromHexLettercaseElement();
          Array.isArray(options.palette) && renderPalette();
          (opt.left || opt.top || opt.right || opt.bottom) && reposition();
        },
        hide,
        setColor,
        getColor: type => {
          if (!initialized) return;
          readCurrentColorFromRamps();
          const color = HSV.to(type);
          return type ? color.toString(0, options) : color;
        },
        options
      };
      return PUBLIC_API;
      function init() {
        function $(cls, props = {}, children = []) {
          if (Array.isArray(props) || typeof props == "string" || props instanceof Node) {
            children = props;
            props = {};
          }
          const el = document.createElement(props.tag || "div");
          el.className = toArray(cls).map(c => c ? CSS_PREFIX + c : "").join(" ");
          el.append(...toArray(children).filter(Boolean));
          props && delete props.tag;
          return Object.assign(el, props);
        }
        const alphaPattern = /^\s*(0+\.?|0*\.\d+|0*1\.?|0*1\.0*)?\s*$/.source;
        const makeNum = (type, name, channel, channelName, props, min, max) => $([ "input-field", `${name}-${channelName}` ], [ ($inputs[type] ||= {})[channel] = $("input", props || {
          tag: "input",
          type: "number",
          min,
          max,
          step: 1
        }), $("title", channelName.toUpperCase()) ]);
        $root = $("popup", {
          oninput: setFromInputs,
          onkeydown: setFromKeyboard
        }, [ $sat = $("saturation-container", {
          onmousedown: onSaturationMouseDown,
          onmouseup: onSaturationMouseUp
        }, [ $("saturation", [ $("value", [ $satPointer = $("drag-pointer") ]) ]) ]), $("popup-mover", {
          onmousedown: onPopupMoveStart
        }), $("sliders", [ $("hue", {
          onmousedown: onHueMouseDown
        }, [ $hue = $("hue-container", [ $hueKnob = $("hue-knob", {
          onmousedown: onHueKnobMouseDown
        }) ]) ]), $("opacity", [ $opacity = $("opacity-container", {
          onmousedown: onOpacityMouseDown
        }, [ $opacityBar = $("opacity-bar"), $opacityKnob = $("opacity-knob", {
          onmousedown: onOpacityKnobMouseDown
        }) ]) ]), $("empty"), $swatch = $("swatch") ]), $([ "input-container", "hex" ], [ $inputGroups[1] = $([ "input-group", "hex" ], [ $([ "input-field", "hex" ], [ $hexCode = $("input", {
          tag: "input",
          type: "text",
          spellcheck: !1,
          pattern: /^\s*#([a-fA-F\d]{3}([a-fA-F\d]([a-fA-F\d]{2}([a-fA-F\d]{2})?)?)?)\s*$/.source
        }), $("title", [ [ 1, "HEX" ], [], [ 2, " ✱ " ], [], [ 0, "hex" ] ].map(([val, label]) => label ? $hexLettercase[val] = $("title-action", {
          onclick: onHexLettercaseClicked,
          upper: val
        }, label) : " / ")) ]) ]), ...[ [ 2, "rgb", [ [ 0, 255 ], [ 0, 255 ], [ 0, 255 ] ] ], [ 3, "hsl", [ [], [ 0, 100 ], [ 0, 100 ] ] ], [ 4, "hwb", [ [], [ 0, 100 ], [ 0, 100 ] ] ] ].map(([type, format, channels]) => $inputGroups[type] = $([ "input-group", format.toUpperCase() ], channels.map((v, i) => makeNum(type, format, "xyz"[i], format[i], null, v[0], v[1])).concat(makeNum(type, format, "a", "a", {
          tag: "input",
          type: "text",
          pattern: alphaPattern,
          spellcheck: !1
        })))), $("format-change", [ $formatChangeButton = $("format-change-button", {
          onclick: setFromFormatElement
        }, "↔") ]), window.EyeDropper && $("dropper", {
          tag: "img",
          srcset: "icon/eyedropper/16px.png, icon/eyedropper/32px.png 2x",
          async onclick() {
            try {
              const c = await (new window.EyeDropper).open();
              userActivity = !0;
              setFromColor(c.sRGBHex);
              colorpickerCallback();
            } catch {}
          }
        }) ]), $palette = $("palette", {
          onclick: onPaletteClicked,
          oncontextmenu: onPaletteClicked
        }) ]);
        const inputsToColor = type => new le.default(+type, +(type = $inputs[type]).x.value, +type.y.value, +type.z.value, +type.a.value);
        for (const [key, val] of Object.entries($inputs)) Object.defineProperty(val, "color", {
          get: inputsToColor.bind(null, key)
        });
        Object.defineProperty($inputs[1] = [ $hexCode ], "color", {
          get: () => $hexCode.value.trim()
        });
        Object.defineProperty($inputs, "color", {
          get: () => $inputs[currentFormat].color
        });
        Object.defineProperty($inputs, "colorString", {
          get: () => currentFormat && $inputs[currentFormat].color.toString(0, {
            round: !0
          })
        });
        HUE_COLORS.forEach(color => Object.assign(color, le.default.parse(color.hex)));
        $root.style.setProperty("--margin", "8px");
        initialized = !0;
      }
      function hide() {
        if (shown) {
          colorpickerCallback("");
          unregisterEvents();
          focusNoScroll(prevFocusedElement);
          $root.remove();
          shown = !1;
        }
      }
      function setColor(color) {
        typeof color == "string" && (color = le.default.parse(color) || computeColor(color));
        if (!color || !color.type) return !1;
        initialized || init();
        setFromColor(color);
        return !0;
      }
      function readCurrentColorFromRamps() {
        if ($sat.offsetWidth === 0) HSV.x = HSV.y = HSV.z = 0; else {
          const {x, y} = dragging.saturationPointerPos;
          HSV.x = Math.round(dragging.hueKnobPos / $hue.offsetWidth * 36e4) / 1e3;
          HSV.y = x / $sat.offsetWidth;
          HSV.z = ($sat.offsetHeight - y) / $sat.offsetHeight;
        }
      }
      function setFromSaturationElement(event) {
        event.preventDefault();
        const w = $sat.offsetWidth;
        const h = $sat.offsetHeight;
        const bb = $root.getBoundingClientRect();
        const deltaY = event.clientY - bb.top;
        const x = dragging.saturationPointerPos.x = le.constrain(0, w, event.clientX - bb.left);
        const y = dragging.saturationPointerPos.y = le.constrain(0, h, deltaY);
        $satPointer.style.left = x - 5 + "px";
        $satPointer.style.top = y - 5 + "px";
        readCurrentColorFromRamps();
        renderInputs();
      }
      function setFromHueElement(event) {
        const {left, width} = getScreenBounds($hue);
        const currentX = event ? getTouchPosition(event).clientX : left + width * le.constrainHue(HSV.x) / 360;
        const normalizedHue = le.constrain(0, 1, (currentX - left) / width);
        const x = dragging.hueKnobPos = width * normalizedHue;
        $hueKnob.style.left = x - Math.round($hueKnob.offsetWidth / 2) + "px";
        $sat.style.backgroundColor = hueDistanceToColorString(normalizedHue);
        event && (HSV.x = Math.round(normalizedHue * 360));
        renderInputs();
      }
      function setFromOpacityElement(event) {
        const {left, width} = getScreenBounds($opacity);
        const normalized = le.constrain(0, 1, (getTouchPosition(event).clientX - left) / width);
        $opacityKnob.style.left = width * normalized - Math.ceil($opacityKnob.offsetWidth / 2) + "px";
        HSV.a = Math.round(normalized * 100) / 100;
        renderInputs();
      }
      function setFromFormatElement({shiftKey}) {
        userActivity = !0;
        HSV.a = isNaN(HSV.a) ? 1 : HSV.a;
        const types = Object.keys($inputGroups).map(Number);
        const dir = shiftKey ? -1 : 1;
        const total = types.length;
        $inputs.colorString === $inputs.prevColorString && Object.assign(HSV, prevHSV);
        switchInputGroup(types[(types.indexOf(currentFormat) + dir + total) % total]);
        renderInputs();
      }
      function setFromHexLettercaseElement(event) {
        const upper = +options.hexUppercase || 0;
        for (const t in $hexLettercase) $hexLettercase[t].toggleAttribute("data-active", +t === upper);
        upper !== 2 && ($hexCode.value = $hexCode.value[upper ? "toUpperCase" : "toLowerCase"]());
        event && setFromInputs();
      }
      function setFromInputs(event) {
        event && (userActivity = !0);
        Object.values($inputs[currentFormat]).every(validateInput) && setFromColor($inputs.color);
      }
      function setFromKeyboard(event) {
        const {key, ctrlKey: ctrl, altKey: alt, shiftKey: shift, metaKey: meta} = event;
        switch (key) {
         case "Tab":
         case "PageUp":
         case "PageDown":
          if (!ctrl && !alt && !meta) {
            const el = document.activeElement;
            const inputs = Object.values($inputs[currentFormat]);
            const lastInput = inputs[inputs.length - 1];
            if (key === "Tab" && shift && el === inputs[0]) maybeFocus(lastInput); else if (key !== "Tab" || shift || el !== lastInput) {
              if (key === "Tab" || shift) return;
              setFromFormatElement({
                shift: key === "PageUp" || shift
              });
            } else maybeFocus(inputs[0]);
            event.preventDefault();
          }
          return;

         case "ArrowUp":
         case "ArrowDown":
          !event.metaKey && document.activeElement.localName === "input" && document.activeElement.checkValidity() && setFromKeyboardIncrement(event);
          return;
        }
      }
      function setFromKeyboardIncrement(event) {
        const el = document.activeElement;
        const {key, ctrlKey: ctrl, altKey: alt, shiftKey: shift} = event;
        const dir = key === "ArrowUp" ? 1 : -1;
        let value, newValue;
        if (currentFormat === 1) {
          value = el.value.trim();
          const isShort = value.length <= 5;
          const [x, y, z, a = ""] = el.value.match(isShort ? /[\da-f]/gi : /[\da-f]{2}/gi);
          let ceiling, data;
          if (ctrl || shift || alt) {
            ceiling = isShort ? 15 : 255;
            data = [ [ ctrl, x ], [ shift, y ], [ alt, z ] ];
          } else {
            ceiling = isShort ? 4095 : 16777215;
            data = [ [ !0, x + y + z ] ];
          }
          newValue = "#" + data.map(([affected, part]) => ((part = le.constrain(0, ceiling, parseInt(part, 16) + dir * (affected ? 1 : 0))) + ceiling + 1).toString(16).slice(1)).join("") + a;
          options.hexUppercase !== 2 && (newValue = newValue[options.hexUppercase ? "toUpperCase" : "toLowerCase"]());
        } else if (!alt) {
          value = parseFloat(el.value);
          const isHue = el.title === "H";
          const isAlpha = el === $inputs[currentFormat].a;
          const isRGB = currentFormat === 2;
          newValue = le.constrain(isHue ? -360 : 0, isHue ? 360 : isAlpha ? 1 : isRGB ? 255 : 100, value + (shift && !ctrl ? 10 : ctrl && !shift ? isHue || isRGB ? 100 : 50 : 1) * (isAlpha ? .01 : 1) * dir);
          newValue = isAlpha ? alphaToString(newValue) : newValue;
        }
        event.preventDefault();
        userActivity = !0;
        if (newValue !== void 0 && newValue !== value) {
          el.value = newValue;
          setFromColor($inputs.color);
        }
      }
      function validateInput(el) {
        const isAlpha = el === $inputs[currentFormat].a;
        let isValid = (isAlpha || el.value.trim()) && el.checkValidity();
        isAlpha || isValid || currentFormat !== 2 ? isAlpha && !isValid && (isValid = parseAs(el, parseFloat)) : isValid = parseAs(el, parseInt);
        isAlpha && isValid && (isValid = lastOutputColor !== $inputs.color.toString(currentFormat, options));
        return isValid;
      }
      function setFromColor(color) {
        typeof color == "string" && (color = le.default.parse(color) || computeColor(color));
        color ||= le.default.parse("#f00");
        const HSV2 = color.toHSV();
        if (!(Math.abs(HSV2.x - HSV.x) < .001 && Math.abs(HSV2.y - HSV.y) < .001 && Math.abs(HSV2.z - HSV.z) < .001 && Math.abs(HSV2.a - HSV.a) < .001)) {
          HSV = HSV2;
          renderKnobs(color);
          switchInputGroup(color.type);
          setFromHueElement();
        }
      }
      function switchInputGroup(type) {
        if (currentFormat !== type) {
          if (currentFormat) delete $inputGroups[currentFormat].dataset.active; else for (const el of Object.values($inputGroups)) delete el.dataset.active;
          $inputGroups[type].dataset.active = "";
          maybeFocus(Object.values($inputs[type])[0]);
          currentFormat = type;
        }
      }
      function renderKnobs(color) {
        const x = $sat.offsetWidth * HSV.y;
        const y = $sat.offsetHeight * (1 - HSV.z);
        $satPointer.style.left = x - 5 + "px";
        $satPointer.style.top = y - 5 + "px";
        dragging.saturationPointerPos = {
          x,
          y
        };
        const hueX = $hue.offsetWidth * le.constrain(0, 1, HSV.x / 360);
        $hueKnob.style.left = hueX - 7.5 + "px";
        dragging.hueKnobPos = hueX;
        $opacityKnob.style.left = $opacity.offsetWidth * (isNaN(HSV.a) ? 1 : HSV.a) - 7.5 + "px";
        $sat.style.backgroundColor = color.toString(2);
      }
      function renderInputs() {
        const rgb = HSV.to(2);
        if (currentFormat === 1) $hexCode.value = rgb.toString(1, options); else for (const [k, v] of Object.entries(HSV.to(currentFormat))) {
          const el = $inputs[currentFormat][k];
          el && (el.value = k === "a" ? alphaToString() || 1 : Math.round(v));
        }
        $swatch.style.backgroundColor = rgb.toString(2);
        $opacityBar.style.background = "linear-gradient(to right," + (rgb.a = 0, rgb).toString(2) + "," + (rgb.a = 1, 
        rgb).toString(2) + ")";
        colorpickerCallback();
        const colorString = $inputs.colorString;
        if ($inputs.prevColorString === colorString) Object.assign(HSV, prevHSV); else {
          $inputs.prevColorString = colorString;
          Object.assign(prevHSV, HSV);
        }
      }
      function onPopupMoveStart(event) {
        if (!event.button && !hasModifiers(event)) {
          captureMouse(event, "popup");
          $root.dataset.moving = "";
          const [x, y] = ($root.style.transform.match(/[-.\d]+/g) || []).map(parseFloat);
          dragging.popupX = event.clientX - (x || 0);
          dragging.popupY = event.clientY - (y || 0);
          document.addEventListener("mouseup", onPopupMoveEnd);
        }
      }
      function onPopupMove({clientX: x, clientY: y}) {
        $root.style.transform = `translate(${x - dragging.popupX}px, ${y - dragging.popupY}px)`;
      }
      function onPopupMoveEnd(event) {
        if (!event.button) {
          document.addEventListener("mouseup", onPopupMoveEnd);
          delete $root.dataset.moving;
        }
      }
      function onPopupResizeStart(event) {
        if (event.target === $root && !event.button && !hasModifiers(event)) {
          document.addEventListener("mouseup", onPopupResizeEnd);
          $root.dataset.resizing = "";
        }
      }
      function onPopupResizeEnd(event) {
        if (!event.button) {
          delete $root.dataset.resizing;
          document.removeEventListener("mouseup", onPopupResizeEnd);
          if (maxHeight !== $root.style.height) {
            maxHeight = $root.style.height;
            PUBLIC_API.options.maxHeight = parseFloat(maxHeight);
            fitPaletteHeight();
          }
        }
      }
      function onHexLettercaseClicked(event) {
        options.hexUppercase = le.constrain(0, 2, +this.upper);
        setFromHexLettercaseElement(event);
      }
      function onSaturationMouseDown(event) {
        captureMouse(event, "saturation") && setFromSaturationElement(event);
      }
      function onSaturationMouseUp(event) {
        releaseMouse(event, "saturation");
      }
      function onHueKnobMouseDown(event) {
        captureMouse(event, "hue");
      }
      function onOpacityKnobMouseDown(event) {
        captureMouse(event, "opacity");
      }
      function onHueMouseDown(event) {
        captureMouse(event, "hue") && setFromHueElement(event);
      }
      function onOpacityMouseDown(event) {
        captureMouse(event, "opacity") && setFromOpacityElement(event);
      }
      function onPaletteClicked(e) {
        if (e.target !== e.currentTarget && e.target.__color) if (!e.button && setColor(e.target.__color)) {
          userActivity = !0;
          colorpickerCallback();
        } else if (e.button && options.paletteCallback) {
          e.preventDefault();
          options.paletteCallback(e.target);
        }
      }
      function onMouseUp(event) {
        releaseMouse(event, [ "saturation", "hue", "opacity", "popup" ]);
        onMouseDown.outsideClick && (prevFocusedElement || hide());
      }
      function onMouseDown(event) {
        if (onMouseDown.outsideClick = !event.button && !event.target.closest(".colorpicker-popup")) {
          prevFocusedElement = null;
          captureMouse(event);
        }
      }
      function onMouseMove(event) {
        if (!event.button) {
          dragging.saturation && setFromSaturationElement(event);
          dragging.hue && setFromHueElement(event);
          dragging.opacity && setFromOpacityElement(event);
          dragging.popup && onPopupMove(event);
        }
      }
      function onKeyDown(e) {
        if (!hasModifiers(e)) switch (e.key) {
         case "Enter":
         case "Escape":
          e.preventDefault();
          e.stopPropagation();
          hide();
        }
      }
      function onCloseRequest(event) {
        event.detail !== PUBLIC_API ? hide() : !prevFocusedElement && cm && (prevFocusedElement = cm.display.input);
      }
      function colorpickerCallback(colorString = currentColorToString()) {
        const isCallable = typeof options.callback == "function";
        if (colorString || !isCallable) {
          if (userActivity && Object.values($inputs[currentFormat]).every(el => el.checkValidity())) {
            lastOutputColor = colorString.replace(/\b0\./g, ".");
            isCallable && options.callback(lastOutputColor);
          }
        } else options.callback("");
      }
      function captureMouse({button}, mode) {
        if (button === 0) {
          document.addEventListener("mouseup", onMouseUp);
          document.addEventListener("mousemove", onMouseMove);
          if (mode) {
            for (const m of toArray(mode)) dragging[m] = !0;
            userActivity = !0;
            return !0;
          }
        }
      }
      function hasModifiers(e) {
        return e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;
      }
      function releaseMouse(event, mode) {
        if (!event || event.button === 0) {
          document.removeEventListener("mouseup", onMouseUp);
          document.removeEventListener("mousemove", onMouseMove);
          if (mode) {
            for (const m of toArray(mode)) dragging[m] = !1;
            userActivity = !0;
            return !0;
          }
        }
      }
      function getTouchPosition(event) {
        return event.touches && event.touches[0] || event;
      }
      function registerEvents() {
        window.addEventListener("keydown", onKeyDown, !0);
        window.addEventListener("mousedown", onMouseDown, !0);
        window.addEventListener("close-colorpicker-popup", onCloseRequest, !0);
      }
      function unregisterEvents() {
        window.removeEventListener("keydown", onKeyDown, !0);
        window.removeEventListener("mousedown", onMouseDown, !0);
        window.removeEventListener("close-colorpicker-popup", onCloseRequest, !0);
        releaseMouse();
      }
      function computeColor(color) {
        const el = document.createElement("div");
        const [x, y, z, a] = ae.paintCanvas(1, 1, ctx => {
          el.style.cssText = `color:${color};position:absolute;opacity:0;`.replace(/;/y, "!important;");
          $root.append(el);
          ctx.fillStyle = getComputedStyle(el).color;
          ctx.fillRect(0, 0, 1, 1);
          el.remove();
        }).data;
        return new le.default(2, x, y, z, a / 255);
      }
      function alphaToString(a = HSV.a) {
        return le.formatAlpha(a);
      }
      function currentColorToString(type = currentFormat, alpha = HSV.a) {
        const converted = HSV.to(type);
        converted.a = isNaN(alpha) || alpha === 1 ? void 0 : alpha;
        return converted.toString(type, options);
      }
      function mixColorToString(start, end, amount) {
        return new le.default(2, start.x + (end.x - start.x) * amount, start.y + (end.y - start.y) * amount, start.z + (end.z - start.z) * amount).toString(1);
      }
      function hueDistanceToColorString(hueRatio) {
        let prevColor;
        for (const color of HUE_COLORS) {
          if (prevColor && color.start >= hueRatio) return mixColorToString(prevColor, color, (hueRatio - prevColor.start) / (color.start - prevColor.start));
          prevColor = color;
        }
        return HUE_COLORS[0].hex;
      }
      function reposition() {
        const {offsetWidth: W, offsetHeight: H} = $root;
        const {top: T, left: L, right: R, bottom: B} = options;
        const maxX = innerWidth - W;
        const maxY = innerHeight - H;
        const s = $root.style;
        isNaN(L) ? isNaN(R) || (s.right = le.constrain(0, Math.max(0, R <= maxX ? maxX : R - W), R) + "px") : s.left = le.constrain(0, Math.max(0, L <= maxX ? maxX : L - W), L) + "px";
        isNaN(T) ? isNaN(B) || (s.bottom = le.constrain(0, Math.max(0, B <= maxY ? maxY : B - H - 20), B) + "px") : s.top = le.constrain(0, Math.max(0, T <= maxY ? maxY : T - H - 20), T) + "px";
        s.transform = "";
      }
      function renderPalette() {
        for (;$palette.firstChild; ) $palette.firstChild.remove();
        $palette.append(...options.palette);
        if (options.palette.length) {
          $root.dataset.resizable = "";
          $root.addEventListener("mousedown", onPopupResizeStart);
          fitPaletteHeight();
        } else {
          delete $root.dataset.resizable;
          $root.removeEventListener("mousedown", onPopupResizeStart);
        }
      }
      function fitPaletteHeight() {
        $root.style.setProperty("--fit-height", Math.min(220 + $palette.scrollHeight + 8, parseFloat(maxHeight)) + "px");
      }
      function maybeFocus(el) {
        allowInputFocus && el.focus();
      }
      function focusNoScroll(el) {
        if (el) {
          const {scrollY: y, scrollX: x} = window;
          el.focus({
            preventScroll: !0
          });
          el = null;
          window.scrollY === y && window.scrollX === x || setTimeout(window.scrollTo, 0, x, y);
        }
      }
      function getScreenBounds(el) {
        const bounds = el.getBoundingClientRect();
        const {scrollTop, scrollLeft} = document.scrollingElement;
        return {
          top: bounds.top + scrollTop,
          left: bounds.left + scrollLeft,
          width: bounds.width,
          height: bounds.height
        };
      }
      function parseAs(el, parser) {
        const num = parser(el.value);
        if (!isNaN(num) && (!el.min || num >= parseFloat(el.min)) && (!el.max || num <= parseFloat(el.max))) {
          el.value = num;
          return !0;
        }
      }
      function toArray(val) {
        return val ? Array.isArray(val) ? val : [ val ] : [];
      }
    };
    var ae = oe(1480);
    var le = oe(2928);
    var ue = oe(8872);
  },
  5483(_, ee, oe) {
    var ae = oe(8745);
    var le = oe(4188);
    oe(8970);
    var ue = oe(2928);
    var pe = oe(8976);
    const DUMB = "Modern color support is not implemented yet...";
    const DUMB_ATTRS = {
      title: DUMB
    };
    const jobsChanges = [];
    const jobsInvisible = [];
    const cmHighlightWorkers = new WeakMap;
    const rxNonWord = /\W|$/iy;
    let timerChanges, timerInvisible;
    let generation = 0;
    let maxRenderChunkSize = 100;
    const CM_EVENTS = {
      changes(cm, info) {
        const state = cm.state.colorpicker;
        info.length === 1 && info[0].origin === "setValue" ? colorizeAll(state) : colorizeChanges(state, info);
      },
      update(cm) {
        const state = cm.state.colorpicker;
        const {cachedTextHeight, lastWrapHeight} = cm.display;
        if (lastWrapHeight && cachedTextHeight) {
          cm.off("update", CM_EVENTS.update);
          maxRenderChunkSize = Math.max(20, Math.ceil(lastWrapHeight / cachedTextHeight));
          if (state.colorizeOnUpdate) {
            state.colorizeOnUpdate = !1;
            colorizeAll(state);
          }
        }
      },
      mousedown(cm, event) {
        const state = cm.state.colorpicker;
        const swatch = hitTest(event);
        dispatchEvent(new CustomEvent("close-colorpicker-popup", {
          detail: swatch && state.popup
        }));
        if (swatch) {
          event.preventDefault();
          openPopupForSwatch(state, swatch);
        }
      }
    };
    class ColorSwatcher {
      constructor(cm, options = {}) {
        this.cm = cm;
        this.options = options;
        this.markersToRemove = [];
        this.markersToRepaint = [];
        this.popup = (0, pe.default)(cm);
        this.colorize();
        for (const name in CM_EVENTS) cm.on(name, CM_EVENTS[name]);
        cm.state.highlight.set = (time, fn) => {
          cmHighlightWorkers.set(cm, fn);
          jobsInvisible.includes(this) || jobsInvisible.push(this);
          timerInvisible ||= setTimeout(colorizeInvisible, time);
        };
      }
      colorize() {
        colorizeAll(this);
      }
      openPopup() {
        this.popup && openPopupForCursor(this);
      }
      destroy() {
        const {cm} = this;
        const {curOp} = cm;
        for (const name in CM_EVENTS) cm.off(name, CM_EVENTS[name]);
        delete cm.state.highlight.set;
        curOp || cm.startOperation();
        cm.getAllMarks().forEach(m => m.className === "colorview-swatch" && m.clear());
        curOp || cm.endOperation();
        cm.state.colorpicker = null;
      }
    }
    ae.CodeMirror.defineOption("colorpicker", !1, (cm, value, oldValue) => {
      oldValue && oldValue !== ae.CodeMirror.Init && cm.state.colorpicker && cm.state.colorpicker.destroy();
      value && (cm.state.colorpicker = new ColorSwatcher(cm, value));
    });
    function colorizeAll(state) {
      const {cm} = state;
      const {curOp} = cm;
      const {viewFrom, viewTo} = cm.display;
      if (!viewTo) {
        state.colorizeOnUpdate = !0;
        return;
      }
      curOp || cm.startOperation();
      state.cnt = 0;
      state.stopAt = 0;
      generation++;
      let line = viewFrom;
      cm.eachLine(viewFrom, viewTo, lh => colorizeLineViaStyles(state, line++, lh));
      updateMarkers(state);
      curOp || cm.endOperation();
      if (viewFrom > 0 || viewTo < cm.doc.size) {
        state.line = viewFrom ? 0 : line;
        jobsInvisible.includes(state) || jobsInvisible.push(state);
        timerInvisible ||= cmHighlightWorkers.has(cm) && setTimeout(colorizeInvisible, 100);
      }
    }
    function colorizeInvisible() {
      timerInvisible = 0;
      const cmsStarted = [];
      for (;jobsInvisible.length; ) {
        const state = jobsInvisible.shift();
        const {cm} = state;
        const {display, doc} = cm;
        const {viewFrom, viewTo} = display;
        const size = doc.size;
        const hlw = cmHighlightWorkers.get(cm);
        let line = state.line || 0;
        let stopped;
        if (!cm.curOp) {
          cmsStarted.push(cm);
          cm.startOperation();
        }
        generation++;
        state.stopAt = performance.now() + cm.options.workTime;
        cm.eachLine(line--, size, lh => {
          ++line;
          if (line < viewFrom || line >= viewTo || line > doc.highlightFrontier) return (lh.styles || (stopped = hlw())) && colorizeLineViaStyles(state, line, lh) && (stopped = !0);
        });
        updateMarkers(state);
        if (stopped) {
          state.line = line;
          const i = jobsInvisible.indexOf(state);
          i > 0 && jobsInvisible.splice(i, 1);
          i && jobsInvisible.unshift(state);
          timerInvisible = hlw && setTimeout(colorizeInvisible);
          break;
        }
      }
      for (const cm of cmsStarted) cm.endOperation();
    }
    function colorizeChanges(state, changes) {
      const queue = [];
      const postponed = [];
      const display = state.cm.display;
      const viewFrom = display.viewFrom || 0;
      const viewTo = display.viewTo || viewFrom + maxRenderChunkSize;
      for (let change of changes) {
        const {from} = change;
        const to = ae.CodeMirror.changeEnd(change);
        if (from.line > viewTo || to.line < viewFrom) postponed.push(change); else {
          if (from.line < viewFrom) {
            postponed.push(Object.assign({}, change, {
              to: {
                line: viewFrom - 1
              }
            }));
            change = Object.assign({}, change, {
              from: {
                line: viewFrom
              }
            });
          }
          if (to.line > viewTo) {
            postponed.push(Object.assign({}, change, {
              from: {
                line: viewTo + 1
              }
            }));
            change = Object.assign({}, change, {
              to: {
                line: viewTo
              }
            });
          }
          queue.push(change);
        }
      }
      queue.length && colorizeChangesNow(state, queue);
      if (postponed.length) {
        jobsChanges.push(state, postponed);
        timerChanges ||= setTimeout(colorizeChangesLater);
      }
    }
    function colorizeChangesNow(state, changes, canPostpone) {
      const {cm} = state;
      const {curOp} = cm;
      curOp || cm.startOperation();
      state.stopAt = canPostpone && performance.now() + cm.options.workTime;
      generation++;
      let stopped;
      let change, changeFromLine;
      let changeToLine = -1;
      let queueIndex = -1;
      let line = (changes = changes.sort((a, b) => a.from.line - b.from.line || a.from.ch - b.from.ch))[0].from.line;
      cm.eachLine(line--, ae.CodeMirror.changeEnd(changes[changes.length - 1]).line + 1, lh => {
        ++line;
        if (line > changeToLine) {
          change = changes[++queueIndex];
          if (!change) return !0;
          changeFromLine = change.from.line;
          changeToLine = ae.CodeMirror.changeEnd(change).line;
        }
        if (changeFromLine <= line && line <= changeToLine) {
          lh.styles || state.cm.getTokenTypeAt({
            line,
            ch: 0
          });
          colorizeLineViaStyles(state, line, lh) && (stopped = !0);
        }
        return stopped && canPostpone;
      });
      updateMarkers(state);
      curOp || cm.endOperation();
      if (stopped) {
        if (line >= changeFromLine && line <= changeToLine) {
          changes.splice(0, queueIndex);
          changes[0] = Object.assign({}, changes[0], {
            from: {
              line
            }
          });
        } else changes.splice(0, queueIndex + 1);
        jobsChanges.push(state, changes);
        timerChanges ||= setTimeout(colorizeChangesLater);
      }
      return stopped;
    }
    function colorizeChangesLater() {
      timerChanges = 0;
      for (;!colorizeChangesNow(jobsChanges.shift(), jobsChanges.shift(), !0) && jobsChanges.length; ) ;
    }
    function colorizeLineViaStyles(state, line, lineHandle) {
      const {styles, text} = lineHandle;
      const stylesLen = styles.length;
      let spanIndex = 0;
      let span, style;
      let {markedSpans} = lineHandle;
      let spansSorted;
      let spansZombies = markedSpans && markedSpans.length;
      e: for (let v, spanState, marker, start, end, len, hex, funcType, i = 1; i + 1 < stylesLen; i += 2) {
        style = styles[i + 1];
        if (!style || !(v = style.indexOf("overlay "))) continue;
        v > 0 && (style = style.slice(0, v));
        if (style !== "atom" && style !== "keyword" && style !== "variable callee") continue;
        start = i > 2 ? styles[i - 2] : 0;
        for (;i + 3 < stylesLen && (end = styles[i + 3]) && end.startsWith(style); ) i += 2;
        end = styles[i];
        len = end - start;
        if (len < 3) continue;
        let func = !(hex = text.charCodeAt(start) === 35) && text.charCodeAt(end) === 40;
        if (func) {
          const hasA = len === 4 && text.charCodeAt(end - 1) === 97;
          func = len >= 3 && len <= 10 && (v = text.charCodeAt(start)) && (len === 3 || hasA ? v === 114 || v === 104 || v === 108 : len === 5 ? v === 111 || v === 99 : len === 9 ? v === 99 : len === 10 && v === 108) && text.slice(start, end - hasA).toLowerCase();
          if (!func || !(hasA || len === 3 ? (funcType = func === "rgb" ? 2 : func === "hsl" ? 3 : func === "hwb" && !hasA && 4) || !hasA && (func === "lab" || func === "lch") : len === 5 ? func === "color" || func === "oklab" || func === "oklch" : len === 9 ? func === "color-mix" : len === 10 && func === "light-dark")) continue;
          let num = 1;
          let a = end;
          let b = end;
          for (;num && ~a && ~(b = text.indexOf(")", b + 1)); ) {
            num--;
            for (;~(v = text.indexOf("(", a + 1)) && v < b; ) {
              a = v;
              num++;
            }
          }
          if (b < 0) continue;
          end = b + 1;
        }
        let color = text.slice(start, end);
        if (!hex && !func && (v = color.indexOf("!")) > 0) {
          color = color.slice(0, v);
          end = start + v;
          len = end - start;
        }
        if (markedSpans) {
          spansSorted ||= markedSpans = markedSpans.sort((a, b) => a.from - b.from);
          for (;spanIndex < markedSpans.length; ) {
            span = markedSpans[spanIndex];
            if (span.from > start) break;
            spanIndex++;
            if (span.from === start && span.marker.className === "colorview-swatch") {
              spansZombies--;
              span.generation = generation;
              if (color === span.marker.color && (func || (rxNonWord.lastIndex = start + color.length, 
              rxNonWord.test(text)))) continue e;
              state.markersToRemove.push(span.marker);
              spanState = !0;
              break;
            }
          }
        }
        const parsedColor = func ? (v = color.slice(len + 1, -1).trim()) && (!funcType || ue.parseColorFunc(funcType, funcType === 2 ? v : v.toLowerCase())) : ue.default.parse(color, end - start, hex);
        if (parsedColor || func) {
          if (spanState) {
            ++spansZombies;
            state.markersToRemove.pop();
            state.markersToRepaint.push(span);
            span.to = start + len;
            span.line = line;
            span.index = spanIndex - 1;
            marker = span.marker;
          } else marker = {
            className: "colorview-swatch"
          };
          marker.attributes = func && !parsedColor && DUMB_ATTRS;
          marker.color = color;
          marker.css = le.SWATCH_PROP + ":" + color;
          marker.len = end - start;
          spanState || state.cm.markText({
            line,
            ch: start
          }, {
            line,
            ch: start + 1
          }, marker);
        }
      }
      if (spansZombies) for (const m of markedSpans) m.generation !== generation && m.marker.className === "colorview-swatch" && state.markersToRemove.push(m.marker);
      if (state.stopAt && (state.cnt += stylesLen) > 200 && (state.cnt = 0, performance.now() > state.stopAt)) return !0;
    }
    function openPopupForCursor(state) {
      const {line, ch} = state.cm.getCursor();
      const lineHandle = state.cm.getLineHandle(line);
      let distance = 1e9;
      let marker, markerStart;
      for (const {from, marker: m} of lineHandle.markedSpans || []) if (m.className === "colorview-swatch") {
        const gapL = from - ch;
        const gapR = ch - from - m.color.length;
        if (gapL <= 0 && gapR < 0) {
          marker = m;
          markerStart = from;
          break;
        }
        if (gapL < distance || gapR < distance) {
          marker = m;
          markerStart = from;
          distance = gapL < gapR ? gapL : gapR;
        }
      }
      doOpenPopup(state, line, markerStart ?? ch, marker);
    }
    function openPopupForSwatch(state, swatch) {
      const lineDiv = swatch.closest("div");
      const {renderedView, viewFrom} = state.cm.display;
      const line = renderedView.findIndex(rv => rv.node === lineDiv);
      let v;
      if (line >= 0 && (v = renderedView[line].line.markedSpans) && (swatch = [].indexOf.call(lineDiv.getElementsByClassName("colorview-swatch"), swatch)) >= 0 && (v = v.filter(ms => ms.marker.className === "colorview-swatch")).length > swatch) {
        v = v.sort((a, b) => a.from - b.from)[swatch];
        doOpenPopup(state, viewFrom + line, v.from, v.marker);
      }
    }
    function doOpenPopup(state, line, ch, marker) {
      const {cm} = state;
      const data = Object.assign(state.options.popup, {
        line,
        ch
      });
      const {left, bottom: top} = cm.charCoords(data, "window");
      const color = marker?.color || data.defaultColor;
      state.popup.show(Object.assign(data, {
        cm,
        top,
        left,
        color: color || data.defaultColor,
        prevColor: color || "",
        callback: popupOnChange,
        palette: makePalette(state),
        paletteCallback
      }));
      highlightColor(cm, line, 0, data);
    }
    function popupOnChange(newColor) {
      if (!newColor) return;
      const {cm, line, ch, embedderCallback} = this;
      const to = {
        line,
        ch: ch + this.prevColor.length
      };
      const from = {
        line,
        ch
      };
      if (cm.getRange(from, to) !== newColor) {
        cm.replaceRange(newColor, from, to, "*colorpicker");
        this.prevColor = newColor;
      }
      typeof embedderCallback == "function" && embedderCallback(this);
    }
    function makePalette({cm, options}) {
      const palette = new Map;
      let i = 0;
      let nums;
      cm.eachLine(({markedSpans}) => {
        ++i;
        if (markedSpans) for (const {from, marker: m} of markedSpans) {
          if (from == null || m.className !== "colorview-swatch") continue;
          const color = m.color.toLowerCase();
          nums = palette.get(color);
          nums || palette.set(color, nums = []);
          nums.push(i);
        }
      });
      const res = [];
      if (palette.size > 1 || nums && nums.length > 1) {
        const old = new Map(options.popup.palette?.map(el => [ el.__color, el ]));
        for (const [color, data] of palette) {
          const str = data.join(", ");
          let el = old.get(color);
          if (!el) {
            el = document.createElement("div");
            el.__color = color;
            el.className = "colorview-swatch";
            el.style.setProperty(le.SWATCH_PROP, color);
          }
          if (el.__str !== str) {
            el.__str = str;
            el.title = `${color}\n${options.popup.paletteLine} ${str.length > 50 ? str.replace(/([^,]+,\s){10}/g, "$&\n") : str}`;
          }
          res.push(el);
        }
        res.push(Object.assign(document.createElement("span"), {
          className: "colorpicker-palette-hint",
          title: options.popup.paletteHint,
          textContent: "?"
        }));
      }
      return res;
    }
    function paletteCallback(el) {
      const {cm} = this;
      const lines = el.title.split("\n")[1].match(/\d+/g).map(Number);
      const i = lines.indexOf(cm.getCursor().line + 1) + 1;
      cm.jumpToPos({
        line: (lines[i] || lines[0]) - 1,
        ch: 0
      });
    }
    function updateMarkers(state) {
      for (const m of state.markersToRemove) m.clear();
      state.markersToRemove.length = 0;
      const {cm: {display: {viewFrom, viewTo, view}}} = state;
      let viewIndex = 0;
      let lineView = view[0];
      let lineViewLine = viewFrom;
      let el;
      for (const {line, index, marker} of state.markersToRepaint) if (!(line < viewFrom || line >= viewTo)) {
        for (;lineViewLine < line && lineView; ) {
          lineViewLine += lineView.size;
          lineView = view[++viewIndex];
        }
        if (lineView && (el = lineView.text.getElementsByClassName("colorview-swatch")[index])) {
          el.style = marker.css;
          el.title = marker.attributes ? DUMB : "";
        }
      }
      state.markersToRepaint.length = 0;
    }
    function highlightColor(cm, line, ch, data) {
      const {viewFrom, viewTo} = cm.display;
      if (line < viewFrom || line > viewTo) return;
      const first = cm.charCoords(data);
      let last = cm.charCoords({
        line,
        ch: data.ch + data.len - 1
      });
      if (last.top !== first.top) {
        const funcEnd = data.ch + data.color.indexOf("(") - 1;
        last = cm.charCoords({
          line,
          ch: funcEnd
        });
      }
      const el = document.createElement("div");
      el.style = `\n    position: absolute;\n    display: block;\n    top: ${first.top}px;\n    left: ${first.left}px;\n    width: ${last.right - first.left}px;\n    height: ${last.bottom - first.top}px;\n    animation: highlight 0.5s;\n  `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 500);
    }
    function hitTest({button, target, offsetX, offsetY}) {
      if (button) return;
      const swatch = target.closest(".colorview-swatch");
      if (!swatch) return;
      const {left, width, height} = getComputedStyle(swatch, "::before");
      const bounds = swatch.getBoundingClientRect();
      return offsetX >= parseFloat(left) - 1 && offsetX <= parseFloat(left) + parseFloat(width) + 1 && offsetY >= parseFloat(height) / 2 - bounds.height / 2 - 1 && offsetY <= parseFloat(height) / 2 + bounds.height / 2 + 1 && swatch;
    }
  }
} ]);