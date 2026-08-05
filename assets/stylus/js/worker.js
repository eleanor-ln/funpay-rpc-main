"use strict";

(() => {
  const global = this;
  const NOP = () => {};
  const COMMANDS = {
    __proto__: null
  };
  const PATH = location.pathname;
  const TTL = 3e5;
  const navLocks = navigator.locks;
  let numJobs = 0;
  let lastBusy = 0;
  let timer;
  navLocks && navLocks.request(PATH, () => new Promise(NOP));
  function autoClose(delay) {
    numJobs || timer || (timer = setTimeout(close, delay ||= Math.max(0, lastBusy + TTL - performance.now())));
  }
  function onMessageError({data, source}) {
    console.warn("Non-cloneable data", data);
    source.postMessage(JSON.stringify(data));
  }
  const FROM_CSS = {
    domain: "domains",
    "url-prefix": "urlPrefixes",
    url: "urls",
    regexp: "regexps"
  };
  const RX_META1 = /\/\*!?\s*==userstyle==/gi;
  const RX_META2 = /(==\/userstyle==\s*)?\*\//gi;
  const STYLE_CODE_EMPTY_RE = /\s+|\/\*([^*]+|\*(?!\/))*(\*\/|$)|@namespace[^;]+;|@charset[^;]+;/iuy;
  function styleCodeEmpty(sec) {
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
  }
  function getMetaComment(str, action) {
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
  }
  let parserlib, stylusLang;
  const {importScripts} = global;
  const load = (file, name) => importScripts(file) || global[name];
  const loadParserlib = () => parserlib = load("parserlib.js", "parserlib");
  const loadStylusLang = () => stylusLang = load("stylus-lang.js", "stylus");
  function extractSections(code, styleId, metaStr, strict) {
    parserlib || loadParserlib();
    const hasSingleEscapes = /([^\\]|^)\\([^\\]|$)/;
    const opts = {
      noValidation: !0,
      starHack: !0,
      styleId
    };
    const parser = new parserlib.css.Parser(opts);
    const sectionStack = [ {
      code: "",
      start: 0
    } ];
    const sections = [];
    let parseError;
    parser.addListener("startstylesheet", () => {
      code = parser.stream.source.string;
    });
    parser.addListener("startdocument", e => {
      const lastSection = sectionStack[sectionStack.length - 1];
      const lastCmt = e.start.comment?.text || "";
      const section = {
        code: "",
        start: e.brace.offset + 1
      };
      let outerText = code.slice(lastSection.start, e.offset);
      if (lastCmt && (!(metaStr ??= getMetaComment(code)) || !lastCmt.includes(metaStr))) {
        section.code = lastCmt + "\n";
        outerText = outerText.slice(0, -lastCmt.length);
      }
      outerText = outerText.replace(metaStr ??= getMetaComment(code), "").trim();
      if (outerText) {
        lastSection.code = outerText;
        doAddSection(lastSection);
        lastSection.code = "";
      }
      for (const fn of e.functions) {
        const {name, expr} = fn;
        const aType = FROM_CSS[name.toLowerCase()];
        const p0 = expr && expr.parts[0];
        const {uri: val = (p0 && aType === "regexps" && hasSingleEscapes.test(p0.text) ? p0.text.slice(1, -1) : p0.string)} = fn;
        (section[aType] = section[aType] || []).push(val || "");
      }
      sectionStack.push(section);
    });
    parser.addListener("enddocument", e => {
      const section = sectionStack.pop();
      const lastSection = sectionStack[sectionStack.length - 1];
      section.code += code.slice(section.start, e.offset);
      lastSection.start = e.offset + 1;
      doAddSection(section);
    });
    parser.addListener("endstylesheet", () => {
      const lastSection = sectionStack[sectionStack.length - 1];
      lastSection.code += code.slice(lastSection.start);
      sectionStack.forEach(doAddSection);
    });
    parser.addListener("error", e => {
      if (parseError) return;
      const i = e.offset;
      const a = Math.max(code.lastIndexOf("\n", i - 5) + 1, i - 100);
      const b = Math.min(code.indexOf("\n", i - a > 5 ? i : i + 5) + 1 || 1e9, i + 100);
      e.context = code.slice(a, b).trim();
      if (strict && (!e.recoverable || e.name === "ParseError")) {
        parser.stream.source.offset = 1e9;
        parseError ||= e;
      }
    });
    try {
      parser.parse(code, {
        reuseCache: JSON.stringify(opts)
      });
    } catch (_) {
      parseError ||= _;
    }
    if (parseError) {
      for (const k in parseError) typeof parseError[k] == "object" && delete parseError[k];
      parseError.message = `${parseError.line}:${parseError.col} ${parseError.message}`;
      throw parseError;
    }
    return sections;
    function doAddSection(section) {
      section.code = section.code.trim();
      (section.code || section.urls || section.urlPrefixes || section.domains || section.regexps) && section.code !== "@namespace url(http://www.w3.org/1999/xhtml);" && sections.push(Object.assign({}, section));
    }
  }
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
  const color_converter = Color;
  class ParseError extends Error {
    constructor(err) {
      super(err.message);
      delete err.message;
      this.name = "ParseError";
      Object.assign(this, err);
    }
  }
  class MissingCharError extends ParseError {
    constructor(chars, index) {
      super({
        code: "missingChar",
        args: chars,
        message: `Missing character: ${chars.map(c => `'${c}'`).join(", ")}`,
        index
      });
    }
  }
  class EOFError extends ParseError {
    constructor(index) {
      super({
        code: "EOF",
        message: "Unexpected end of file",
        index
      });
    }
  }
  const RX_EOT = /<<<EOT([\s\S]+?)EOT;/y;
  const RX_LINE = /.*/y;
  const RX_NUMBER = /-?(\d+(\.\d+)?|\.\d+)([eE]-?\d+)?\s*/y;
  const RX_WHITESPACE = /\s*/y;
  const RX_WHITESPACE_SAMELINE = /[^\S\n]*/y;
  const RX_WORD = /([\w-]+)\s*/y;
  const RX_STRING_BACKTICK = /(`(?:\\`|[\s\S])*?`)/y;
  const RX_STRING_QUOTED = /((['"])(?:\\\2|[^\n])*?\2|\w+)/y;
  const RX_STRING_UNQUOTED = /[^"]*/y;
  const RX_VERSION = /^v?\d+(\.\d+)*(?:-(\w[-\w]*(\.[-\w]+)*))?(?:\+(\w[-\w]*(\.[-\w]+)*))?$/;
  const JSON_PRIME = {
    __proto__: null,
    null: null,
    true: !0,
    false: !1
  };
  function unescapeComment(s) {
    return s.replace(/\*\\\//g, "*/");
  }
  function unquote(s) {
    const q = s[0];
    return q !== s[s.length - 1] || q !== '"' && q !== "'" && q !== "`" ? unescapeComment(s) : s.slice(1, -1).replace(new RegExp(`\\\\([${q}\\\\/bfnrt]|u[0-9a-fA-F]{4})`, "g"), s => s[1] === q ? q : JSON.parse(`"${s}"`));
  }
  function eatLine(state) {
    RX_LINE.lastIndex = state.lastIndex;
    RX_LINE.exec(state.text);
    state.lastIndex = RX_LINE.lastIndex;
  }
  function eatWhitespace(state) {
    RX_WHITESPACE.lastIndex = state.lastIndex;
    state.lastIndex += RX_WHITESPACE.exec(state.text)[0].length;
  }
  function eatSameLineWhitespace(state) {
    RX_WHITESPACE_SAMELINE.lastIndex = state.lastIndex;
    state.lastIndex += RX_WHITESPACE_SAMELINE.exec(state.text)[0].length;
  }
  function parseWord(state) {
    const pos = state.lastIndex;
    RX_WORD.lastIndex = pos;
    const match = RX_WORD.exec(state.text);
    if (!match) throw new ParseError({
      code: "invalidWord",
      message: "Invalid word",
      index: pos
    });
    state.index = pos;
    state.value = match[1];
    state.lastIndex += match[0].length;
  }
  function parseJSON(state) {
    const pos = state.lastIndex;
    try {
      parseJSONValue(state);
    } catch (_) {
      _.message = `Invalid JSON: ${_.message}`;
      throw _;
    }
    state.index = pos;
  }
  function parseEOT(state) {
    const pos = state.lastIndex;
    RX_EOT.lastIndex = pos;
    const match = RX_EOT.exec(state.text);
    if (!match) throw new ParseError({
      code: "missingEOT",
      message: "Missing EOT",
      index: pos
    });
    state.index = pos;
    state.lastIndex += match[0].length;
    state.value = unescapeComment(match[1].trim());
    eatWhitespace(state);
  }
  function parseStringUnquoted(state) {
    RX_STRING_UNQUOTED.lastIndex = state.lastIndex;
    const match = RX_STRING_UNQUOTED.exec(state.text);
    state.index = state.lastIndex;
    state.lastIndex = RX_STRING_UNQUOTED.lastIndex;
    state.value = match[0].trim().replace(/\s+/g, "-");
  }
  function parseString(state, sameLine = !1) {
    const pos = state.lastIndex;
    const rx = state.text[pos] === "`" ? RX_STRING_BACKTICK : RX_STRING_QUOTED;
    rx.lastIndex = pos;
    const match = rx.exec(state.text);
    if (!match) throw new ParseError({
      code: "invalidString",
      message: "Invalid string",
      index: pos
    });
    state.index = pos;
    state.lastIndex += match[0].length;
    state.value = unquote(match[1]);
    sameLine ? eatSameLineWhitespace(state) : eatWhitespace(state);
  }
  function parseJSONValue(state) {
    const {text} = state;
    if (text[state.lastIndex] === "{") {
      const object = {};
      state.lastIndex++;
      eatWhitespace(state);
      for (;text[state.lastIndex] !== "}"; ) {
        parseString(state);
        const key = state.value;
        if (text[state.lastIndex] !== ":") throw new MissingCharError([ ":" ], state.lastIndex);
        state.lastIndex++;
        eatWhitespace(state);
        parseJSONValue(state);
        object[key] = state.value;
        if (text[state.lastIndex] === ",") {
          state.lastIndex++;
          eatWhitespace(state);
        } else if (text[state.lastIndex] !== "}") throw new MissingCharError([ ",", "}" ], state.lastIndex);
      }
      state.lastIndex++;
      eatWhitespace(state);
      state.value = object;
    } else if (text[state.lastIndex] === "[") {
      const array = [];
      state.lastIndex++;
      eatWhitespace(state);
      for (;text[state.lastIndex] !== "]"; ) {
        parseJSONValue(state);
        array.push(state.value);
        if (text[state.lastIndex] === ",") {
          state.lastIndex++;
          eatWhitespace(state);
        } else if (text[state.lastIndex] !== "]") throw new MissingCharError([ ",", "]" ], state.lastIndex);
      }
      state.lastIndex++;
      eatWhitespace(state);
      state.value = array;
    } else if (text[state.lastIndex] === '"' || text[state.lastIndex] === "'" || text[state.lastIndex] === "`") parseString(state); else if (/[-\d.]/.test(text[state.lastIndex])) parseNumber(state); else {
      parseWord(state);
      if (!(state.value in JSON_PRIME)) throw new ParseError({
        code: "unknownJSONLiteral",
        args: [ state.value ],
        message: `Unknown literal '${state.value}'`,
        index: state.index
      });
      state.value = JSON_PRIME[state.value];
    }
  }
  function parseNumber(state) {
    const pos = state.lastIndex;
    RX_NUMBER.lastIndex = pos;
    const match = RX_NUMBER.exec(state.text);
    if (!match) throw new ParseError({
      code: "invalidNumber",
      message: "Invalid number",
      index: pos
    });
    state.index = pos;
    state.value = Number(match[0].trim());
    state.lastIndex += match[0].length;
  }
  function parseStringToEnd(state) {
    RX_LINE.lastIndex = state.lastIndex;
    const value = RX_LINE.exec(state.text)[0].trim();
    if (!value) throw new ParseError({
      code: "missingValue",
      message: "Missing value",
      index: RX_LINE.lastIndex
    });
    state.index = state.lastIndex;
    state.value = unquote(value);
    state.lastIndex = RX_LINE.lastIndex;
  }
  const _ = self.URL;
  function range(amount) {
    const range = Array(amount);
    for (let i = 0; i < amount; i++) range[i] = i;
    return range;
  }
  function LevenshteinDistanceWithMax(firstString, secondString, maxEdit) {
    const lenOne = firstString.length;
    const lenTwo = secondString.length;
    if (Math.abs(lenOne - lenTwo) > maxEdit) return !1;
    let prevRowDistance = range(lenOne + 1);
    let currentRowDistance = Array(lenOne + 1);
    for (let i = 1; i <= lenTwo; i++) {
      currentRowDistance[0] = i;
      let minDistance = i;
      for (let j = 1; j <= lenOne; j++) {
        currentRowDistance[j] = Math.min(prevRowDistance[j] + 1, currentRowDistance[j - 1] + 1, prevRowDistance[j - 1] + (firstString[j - 1] === secondString[i - 1] ? 0 : 1));
        currentRowDistance[j] < minDistance && (minDistance = currentRowDistance[j]);
      }
      if (minDistance > maxEdit) return !1;
      const vtemp = currentRowDistance;
      currentRowDistance = prevRowDistance;
      prevRowDistance = vtemp;
    }
    return prevRowDistance[lenOne] <= maxEdit;
  }
  const UNITS_SET = new Set([ "em", "ex", "cap", "ch", "ic", "rem", "lh", "rlh", "vw", "vh", "vi", "vb", "vmin", "vmax", "cm", "mm", "Q", "in", "pt", "pc", "px", "deg", "grad", "rad", "turn", "s", "ms", "Hz", "kHz", "dpi", "dpcm", "dppx", "%" ]);
  const DEFAULT_PARSER = {
    name: parseStringToEnd,
    version: parseStringToEnd,
    namespace: parseStringToEnd,
    author: parseStringToEnd,
    description: parseStringToEnd,
    homepageURL: parseStringToEnd,
    supportURL: parseStringToEnd,
    updateURL: parseStringToEnd,
    license: parseStringToEnd,
    preprocessor: parseStringToEnd
  };
  const DEFAULT_VALIDATOR = {
    version: state => {
      if (!(version = state.value, RX_VERSION.test(version))) throw new ParseError({
        code: "invalidVersion",
        args: [ state.value ],
        message: `Invalid version: ${state.value}`,
        index: state.valueIndex
      });
      var version;
      state.value = normalizeVersion(state.value);
    },
    homepageURL: validateURL,
    supportURL: validateURL,
    updateURL: validateURL
  };
  const DEFAULT_VAR_PARSER = {
    text: parseStringToEnd,
    color: parseStringToEnd,
    checkbox: function(state) {
      if (state.lastIndex >= state.text.length) throw new EOFError(state.lastIndex);
      state.index = state.lastIndex;
      state.value = state.text[state.lastIndex];
      state.lastIndex++;
      eatWhitespace(state);
    },
    select: parseSelect,
    dropdown: {
      advanced: parseVarXStyle
    },
    image: {
      var: parseSelect,
      advanced: parseVarXStyle
    },
    number: parseRange,
    range: parseRange
  };
  const DEFAULT_VAR_VALIDATOR = {
    checkbox: state => {
      if (state.value !== "1" && state.value !== "0") throw new ParseError({
        code: "invalidCheckboxDefault",
        message: "value must be 0 or 1",
        index: state.valueIndex
      });
    },
    number: validateRange,
    range: validateRange
  };
  const MANDATORY_META = [ "name", "namespace", "version" ];
  const RANGE_PROPS = [ "default", "min", "max", "step" ];
  function parseRange(state) {
    parseJSON(state);
    const result = {
      min: null,
      max: null,
      step: null,
      units: null
    };
    if (typeof state.value == "number") result.default = state.value; else {
      if (!Array.isArray(state.value)) throw new ParseError({
        code: "invalidRange",
        message: "the default value must be an array or a number",
        index: state.valueIndex,
        args: [ state.type ]
      });
      {
        let i = 0;
        for (const item of state.value) if (typeof item == "string") {
          if (result.units != null) throw new ParseError({
            code: "invalidRangeMultipleUnits",
            message: "units is alredy defined",
            args: [ state.type ],
            index: state.valueIndex
          });
          result.units = item;
        } else {
          if (typeof item != "number" && item !== null) throw new ParseError({
            code: "invalidRangeValue",
            message: "value must be number, string, or null",
            args: [ state.type ],
            index: state.valueIndex
          });
          if (i >= RANGE_PROPS.length) throw new ParseError({
            code: "invalidRangeTooManyValues",
            message: "the array contains too many values",
            args: [ state.type ],
            index: state.valueIndex
          });
          result[RANGE_PROPS[i++]] = item;
        }
      }
    }
    state.value = result.default;
    Object.assign(state.varResult, result);
  }
  function parseSelect(state) {
    parseJSON(state);
    if (typeof state.value != "object" || !state.value) throw new ParseError({
      code: "invalidSelect",
      message: "The value must be an array or object"
    });
    const options = Array.isArray(state.value) ? state.value.map(key => createOption(key)) : Object.keys(state.value).map(key => createOption(key, state.value[key]));
    if (new Set(options.map(o => o.name)).size < options.length) throw new ParseError({
      code: "invalidSelectNameDuplicated",
      message: "Option name is duplicated"
    });
    if (options.length === 0) throw new ParseError({
      code: "invalidSelectEmptyOptions",
      message: "Option list is empty"
    });
    const defaults = options.filter(o => o.isDefault);
    if (defaults.length > 1) throw new ParseError({
      code: "invalidSelectMultipleDefaults",
      message: "multiple default values"
    });
    options.forEach(o => {
      delete o.isDefault;
    });
    state.varResult.options = options;
    state.value = (defaults.length > 0 ? defaults[0] : options[0]).name;
  }
  function parseVarXStyle(state) {
    const pos = state.lastIndex;
    if (state.text[state.lastIndex] !== "{") throw new MissingCharError([ "{" ], pos);
    const options = [];
    state.lastIndex++;
    for (;state.text[state.lastIndex] !== "}"; ) {
      const option = {};
      parseStringUnquoted(state);
      option.name = state.value;
      parseString(state);
      option.label = state.value;
      state.type === "dropdown" ? parseEOT(state) : parseString(state);
      option.value = state.value;
      options.push(option);
    }
    state.lastIndex++;
    eatWhitespace(state);
    if (options.length === 0) throw new ParseError({
      code: "invalidSelectEmptyOptions",
      message: "Option list is empty",
      index: pos
    });
    if (state.type === "dropdown") {
      state.varResult.type = "select";
      state.type = "select";
    }
    state.varResult.options = options;
    state.value = options[0].name;
  }
  function createOption(label, value) {
    if (typeof label != "string" || value && typeof value != "string") throw new ParseError({
      code: "invalidSelectValue",
      message: "Values in the object/array must be strings"
    });
    let isDefault = !1;
    if (label.endsWith("*")) {
      isDefault = !0;
      label = label.slice(0, -1);
    }
    let name;
    const match = label.match(/^(\w+):(.*)/);
    match && ([, name, label] = match);
    name || (name = label);
    if (!label) throw new ParseError({
      code: "invalidSelectLabel",
      message: "Option label is empty"
    });
    value == null && (value = name);
    return {
      name,
      label,
      value,
      isDefault
    };
  }
  function collectErrors(fn, errors) {
    if (errors) try {
      fn();
    } catch (_) {
      errors.push(_);
    } else fn();
  }
  function validateURL(state) {
    let url;
    try {
      url = new _(state.value);
    } catch (_) {
      _.args = [ state.value ];
      _.index = state.valueIndex;
      throw _;
    }
    if (!/^https?:/.test(url.protocol)) throw new ParseError({
      code: "invalidURLProtocol",
      args: [ url.protocol ],
      message: `Invalid protocol: ${url.protocol}`,
      index: state.valueIndex
    });
  }
  function validateRange(state) {
    const value = state.value;
    if (typeof value != "number") throw new ParseError({
      code: "invalidRangeDefault",
      message: `the default value of @var ${state.type} must be a number`,
      index: state.valueIndex,
      args: [ state.type ]
    });
    const result = state.varResult;
    if (result.min != null && value < result.min) throw new ParseError({
      code: "invalidRangeMin",
      message: "the value is smaller than the minimum",
      index: state.valueIndex,
      args: [ state.type ]
    });
    if (result.max != null && value > result.max) throw new ParseError({
      code: "invalidRangeMax",
      message: "the value is larger than the maximum",
      index: state.valueIndex,
      args: [ state.type ]
    });
    if (result.step != null && [ value, result.min, result.max ].some(n => n != null && !isMultipleOf(n, result.step))) throw new ParseError({
      code: "invalidRangeStep",
      message: "the value is not a multiple of the step",
      index: state.valueIndex,
      args: [ state.type ]
    });
    if (result.units && !UNITS_SET.has(result.units)) throw new ParseError({
      code: "invalidRangeUnits",
      message: `Invalid CSS unit: ${result.units}`,
      index: state.valueIndex,
      args: [ state.type, result.units ]
    });
  }
  function isMultipleOf(value, step) {
    const n = Math.abs(value / step);
    const nInt = Math.round(n);
    return Math.abs(n - nInt) < Math.pow(10, `${nInt}`.length - 16);
  }
  function createParser({unknownKey = "ignore", mandatoryKeys = MANDATORY_META, parseKey: userParseKey, parseVar: userParseVar, validateKey: userValidateKey, validateVar: userValidateVar, allowErrors = !1} = {}) {
    if (![ "ignore", "assign", "throw" ].includes(unknownKey)) throw new TypeError("unknownKey must be 'ignore', 'assign', or 'throw'");
    const parser = Object.assign(Object.create(null), DEFAULT_PARSER, userParseKey);
    const keysOfParser = [ ...Object.keys(parser), "advanced", "var" ];
    const varParser = Object.assign({}, DEFAULT_VAR_PARSER, userParseVar);
    const validator = Object.assign({}, DEFAULT_VALIDATOR, userValidateKey);
    const varValidator = Object.assign({}, DEFAULT_VAR_VALIDATOR, userValidateVar);
    return {
      parse: text => {
        if (text.includes("\r")) throw new TypeError("metadata includes invalid character: '\\r'");
        const usercssData = {};
        const errors = [];
        const re = /@([\w-]+)[^\S\r\n]*/gm;
        const state = {
          index: 0,
          lastIndex: 0,
          text,
          usercssData,
          warn: err => errors.push(err)
        };
        let match;
        for (;match = re.exec(text); ) {
          state.index = match.index;
          state.lastIndex = re.lastIndex;
          state.key = match[1];
          state.shouldIgnore = !1;
          collectErrors(() => {
            try {
              state.key === "var" || state.key === "advanced" ? parseVar(state) : parseKey(state);
            } catch (_) {
              _.index === void 0 && (_.index = state.index);
              throw _;
            }
            state.key === "var" || state.key === "advanced" || state.shouldIgnore || (usercssData[state.key] = state.value);
          }, allowErrors && errors);
          re.lastIndex = state.lastIndex;
        }
        state.maybeUSO && !usercssData.preprocessor && (usercssData.preprocessor = "uso");
        collectErrors(() => {
          const missing = mandatoryKeys.filter(k => !Object.prototype.hasOwnProperty.call(usercssData, k) || !usercssData[k]);
          if (missing.length > 0) throw new ParseError({
            code: "missingMandatory",
            args: missing,
            message: `Missing metadata: ${missing.map(k => `@${k}`).join(", ")}`
          });
        }, allowErrors && errors);
        return {
          metadata: usercssData,
          errors
        };
      },
      validateVar: varObject => {
        _validateVar({
          key: "var",
          type: varObject.type,
          value: varObject.value,
          varResult: varObject
        });
      }
    };
    function _validateVar(state) {
      const validate = typeof varValidator[state.type] == "object" ? varValidator[state.type][state.key] : varValidator[state.type];
      validate && validate(state);
    }
    function parseVar(state) {
      const result = {
        type: null,
        label: null,
        name: null,
        value: null,
        default: null,
        options: null
      };
      state.varResult = result;
      parseWord(state);
      state.type = state.value;
      result.type = state.type;
      const doParse = typeof varParser[state.type] == "object" ? varParser[state.type][state.key] : varParser[state.type];
      if (!doParse) throw new ParseError({
        code: "unknownVarType",
        message: `Unknown @${state.key} type: ${state.type}`,
        args: [ state.key, state.type ],
        index: state.index
      });
      parseWord(state);
      result.name = state.value;
      parseString(state, !0);
      result.label = state.value;
      state.valueIndex = state.lastIndex;
      doParse(state);
      _validateVar(state);
      result.default = state.value;
      state.usercssData.vars || (state.usercssData.vars = {});
      state.usercssData.vars[result.name] = result;
      state.key === "advanced" && (state.maybeUSO = !0);
    }
    function parseKey(state) {
      let doParse = parser[state.key];
      if (!doParse) {
        if (unknownKey !== "assign") {
          eatLine(state);
          if (unknownKey === "ignore") {
            state.shouldIgnore = !0;
            return;
          }
          const MAX_EDIT = Math.log2(state.key.length);
          const maybeSuggestion = keysOfParser.find(metaKey => LevenshteinDistanceWithMax(metaKey, state.key, MAX_EDIT));
          throw new ParseError({
            code: "unknownMeta",
            args: [ state.key, maybeSuggestion ],
            message: `Unknown metadata: @${state.key}${maybeSuggestion ? `, did you mean @${maybeSuggestion}?` : ""}`,
            index: state.index
          });
        }
        doParse = parseStringToEnd;
      }
      state.valueIndex = state.lastIndex;
      doParse(state);
      validator[state.key] && validator[state.key](state);
    }
  }
  function normalizeVersion(version) {
    return version[0] === "v" || version[0] === "=" ? version.slice(1) : version;
  }
  const PREPROCESSORS = new Set([ "default", "uso", "stylus", "less" ]);
  const options = {
    validateKey: {
      preprocessor: state => {
        if (!PREPROCESSORS.has(state.value)) throw new ParseError({
          code: "unknownPreprocessor",
          args: [ state.value ],
          index: state.valueIndex
        });
      }
    },
    validateVar: {
      select: state => {
        if (state.varResult.options.every(o => o.name !== state.value)) throw new ParseError({
          code: "invalidSelectValueMismatch",
          index: state.valueIndex
        });
      },
      color: state => {
        if (!color_converter.parse(state.value)) throw new ParseError({
          code: "invalidColor",
          args: [ state.value ],
          index: state.valueIndex
        });
      }
    }
  };
  const parser = createParser(options);
  const metaLint = createParser(Object.assign({}, options, {
    allowErrors: !0,
    unknownKey: "throw"
  })).parse;
  const metaParse = parser.parse;
  const nullifyInvalidVars = vars => {
    for (const va of Object.values(vars)) if (va.value !== null) try {
      parser.validateVar(va);
    } catch {
      va.value = null;
    }
  };
  let CSSLint, stylelint;
  const loadCSSLint = () => (parserlib || loadParserlib()) && load("csslint.js", "CSSLint");
  const loadStylelint = mode => (stylusLang || mode === "stylus" && loadStylusLang() || (global.stylus = Object.create(new Proxy({}, {
    get: (obj, key) => obj[key] ||= (stylusLang || loadStylusLang())[key]
  })))) && load("stylelint.js", "stylelint");
  const rxVarsLessDecl = /"@[-\w]+:"/;
  const rxVendorPrefix = /(?:^|[^-\w])-(?:moz|webkit|o|ms)-\w/;
  const LintWorkerAPI = {
    csslint(code, config) {
      CSSLint ||= loadCSSLint();
      config.import = 1;
      const results = CSSLint.verify(code, config).messages;
      let len = 0;
      let line, col;
      for (const r of results) if (line = r.line) {
        line--;
        col = r.col;
        results[len++] = {
          message: r.message,
          from: {
            line,
            ch: col - 1
          },
          to: {
            line,
            ch: col
          },
          rule: r.rule.id,
          severity: r.type
        };
      }
      results.length = len;
      return results;
    },
    getCssPropsValues() {
      parserlib || loadParserlib();
      const {css: {GlobalKeywords, NamedColors, Parser: {AT}, Properties}, util: {describeProp, VTFunctions}} = parserlib;
      const atKeys = [ "@-moz-document", "@starting-style" ];
      const keys = Object.keys(Properties).sort();
      const COLOR = "<color>";
      const rxColor = RegExp(`${COLOR}|${describeProp(COLOR).replace(/[()|]/g, "\\$&")}|~~~`, "g");
      const rxFunc = /([-\w]+\().*?\)/g;
      const rxNonWord = /(?:<.+?>|[^-\w<(]+\d*)+/g;
      const res = {};
      const cmp = (a, b) => a[0] === "-" && b[0] !== "-" ? 1 : a < b ? -1 : a > b;
      for (const k in AT) k !== "document" && atKeys.push("@" + k);
      for (let k, v, i = 0; i < keys.length; i++) {
        k = keys[i];
        v = Properties[k];
        if (typeof v == "string") {
          let last = "";
          const uniq = [];
          const vNoColor = v.replace(rxColor, "~~~");
          const desc = describeProp(vNoColor);
          const descNoColors = desc.replace(rxColor, "");
          const words = descNoColors.replace(rxFunc, "z-$1").split(rxNonWord).sort(cmp);
          for (let w of words) {
            w.startsWith("z-") && (w = w.slice(2));
            w !== last && uniq.push(last = w);
          }
          desc === descNoColors && v === vNoColor || uniq.push(COLOR);
          v = uniq.join("\n");
        } else v === -1 ? k = "" : v = "";
        k && (res[k += ": "] = v);
        keys[i] = k;
      }
      return {
        all: res,
        ats: atKeys.sort(),
        colors: NamedColors.join("\n") + "\n" + Object.keys(VTFunctions.color).join("(\n") + "(",
        global: GlobalKeywords,
        keys: keys.filter(Boolean)
      };
    },
    getRules: linter => ruleRetriever[linter](),
    metalint(code) {
      const result = metaLint(code);
      result.errors = result.errors.map(err => ({
        code: err.code,
        args: err.args,
        message: err.message,
        index: err.index
      }));
      return result;
    },
    async stylelint(code, config, mode) {
      stylelint ||= loadStylelint(mode);
      for (const r in config.rules) stylelint.rules[r] || delete config.rules[r];
      const {results: [res]} = await stylelint.lint({
        code,
        config,
        customSyntax: stylelint.syntax[mode]
      });
      const messages = res._postcssResult?.messages || res.warnings;
      messages.push(...res.parseErrors);
      collectStylelintResults(messages, code, mode);
      return messages;
    }
  };
  const ruleRetriever = {
    csslint() {
      CSSLint ||= loadCSSLint();
      return CSSLint.getRuleList().map(rule => {
        const output = {};
        for (const [key, value] of Object.entries(rule)) typeof value != "function" && (output[key] = value);
        return output;
      });
    },
    stylelint() {
      stylelint ||= loadStylelint();
      const options = {};
      const rxPossible = /\bpossible:("[^"]*?"|\[[^\]]*?]|\{[^}]*?})/g;
      const rxString = /"([-\w\s]{3,}?)"/g;
      for (const [id, rule] of Object.entries(stylelint.rules)) {
        const ruleCode = `${rule()}`;
        const sets = [];
        let m, mStr;
        for (;m = rxPossible.exec(ruleCode); ) {
          const possible = m[1];
          const set = [];
          for (;mStr = rxString.exec(possible); ) {
            const s = mStr[1];
            s.includes(" ") ? set.push(...s.split(/\s+/)) : set.push(s);
          }
          possible.includes("ignoreAtRules") && set.push("ignoreAtRules");
          possible.includes("ignoreShorthands") && set.push("ignoreShorthands");
          set.length && sets.push(set);
        }
        options[id] = sets;
      }
      return options;
    }
  };
  function getRawValue(code, n, end) {
    let res = code.slice(n.source.start.offset + n.prop.length + n.raws.between.length, end);
    !res.trim() && (res = n.parent.nodes, n = res[res.indexOf(n) + 1]) && n.type === "comment" && (res = "/*" + n.text);
    return res;
  }
  const collectStylelintResults = (messages, code, mode) => {
    let prev, pL, pC, pL2, pC2, v;
    let len = 0;
    for (const m of messages) {
      const {rule, line: L, column: C, endLine: L2 = L, endColumn: C2 = C} = m;
      const {start: {offset: a} = {}, end: {offset: b} = {}} = m;
      const msg = m.text.replace(/^Unexpected\s+/, "").replace(` (${rule})`, "");
      if (msg === prev && L === pL && C === pC && L2 === pL2 && C2 === pC2 || mode === "less" && rule === "at-rule-no-unknown" && rxVarsLessDecl.test(msg) || mode === "stylus" && /^Invalid selector.*[&/~^\\]|^Cannot parse selector.*[&/~^()[\]]/.test(msg) || (rule === "declaration-property-value-no-unknown" || rule === "function-linear-gradient-no-nonstandard-direction") && (rxVendorPrefix.test(m) || rule === "declaration-property-value-no-unknown" && mode === "css" && (v = m.node) && (v = v.value.trim() || getRawValue(code, v, b)) && v.includes("/*[["))) continue;
      const isImport = msg.includes('at-rule "@import"');
      messages[len++] = {
        message: isImport ? "@import prevents parallel downloads and may be blocked by CSP." : msg,
        from: {
          line: L - 1,
          ch: C - 1,
          offset: a
        },
        to: {
          line: L2 - 1,
          ch: C2 - 1,
          offset: b
        },
        rule: isImport ? "" : rule,
        severity: isImport ? "warning" : m.severity
      };
      prev = msg;
      pL = L;
      pC = C;
      pL2 = L2;
      pC2 = C2;
    }
    messages.length = len;
  };
  const lint_worker = LintWorkerAPI;
  let less;
  function preLess(code, metaStr, vars, sections) {
    let resolve, reject;
    less ||= load("less.js", "less");
    less.render(code, {
      math: "parens-division",
      modifyVars: vars && Object.fromEntries(Object.keys(vars).map(k => [ "@" + k, vars[k].value ]))
    }, (err, ...res) => err ? reject ? reject(err) : reject = err : resolve ? resolve(extractSectionsFromLess(...res, metaStr, sections)) : resolve = res);
    if (reject) throw reject;
    if (!resolve) return new Promise((ok, ko) => {
      resolve = ok;
      reject = ko;
    });
    extractSectionsFromLess(...resolve, metaStr, sections);
  }
  function extractSectionsFromLess({css}, docs, metaStr, sections) {
    let v;
    let prevEnd = 0;
    for (let [cmt, prelude, body, start, end] of docs) {
      cmt && cmt !== metaStr && (body = cmt + "\n" + body);
      v = css.slice(prevEnd, start - cmt.length - (css.charCodeAt(start - 1) === 10)).replace(metaStr, "").trim();
      v && sections.push({
        code: v
      });
      const sec = {
        code: body
      };
      if (prelude && (prelude = Array.isArray(v = prelude.value) ? v : [ prelude ])) for (const node of prelude) {
        let k, quote;
        typeof (v = node.value) != "string" && (k = node.name || node.type) && (k = FROM_CSS[k.toLowerCase()]) && (v ||= node.args?.[0]) && typeof (({quote} = v), 
        v = v.value) == "string" && (sec[k] ||= []).push(quote ? v.replace(/\\\\/g, "\\") : v);
      }
      sections.push(sec);
      prevEnd = end;
    }
    (v = css.slice(prevEnd).replace(metaStr, "").trim()) && sections.push({
      code: v
    });
  }
  let sectionsTmp;
  let metaStrTmp, varsSep, varsUsed;
  function preStylus(code, metaStr, vars, sections, log, warn) {
    stylusLang || loadStylusLang();
    if (!varsSep) {
      varsSep = "sep" + Math.random().toString(36).slice(2);
      stylusLang.Compiler.prototype.visitRoot = extractSectionsFromStylus;
    }
    if (vars) {
      vars = Object.keys(vars).map(k => `${k}=${vars[k].value};\n`).join("") + "@" + varsSep + ";\n";
      code = vars + code;
    }
    metaStrTmp = metaStr;
    sectionsTmp = sections;
    varsUsed = !!vars;
    stylusLang(code, {
      cache: !1,
      functions: {
        p: node => log.push(node.val || node) && stylusLang.nodes.null,
        warn: node => warn.push(node.val || node) && stylusLang.nodes.null
      }
    }).render((err, css) => {
      if (err) {
        vars && (err.message = err.message.replace(/:(\d+)(?=:)/, (s, line) => ":" + (line - vars.match(/^/gm).length - 1)));
        throw err;
      }
      code = css;
    });
    metaStrTmp = sectionsTmp = null;
    return code;
  }
  function extractSectionsFromStylus(block) {
    let cmt, k, v, sepSkipped;
    this.buf = "";
    for (const node of block.nodes) if (!((v = node.str) && v !== metaStrTmp && v.charCodeAt(0) === 47 && (cmt = v) || varsUsed && !sepSkipped && (node.type !== varsSep || (sepSkipped = !0)) || node.suppress)) if (node.type === "-moz-document") {
      if (v = this.buf) {
        sectionsTmp.push({
          code: v
        });
        this.buf = "";
      }
      this.visitBlock(node.block);
      v = this.buf;
      const sec = {
        code: cmt ? cmt + v : v
      };
      for (const seg of node.segments) (k = FROM_CSS[seg.name.toLowerCase()]) && (v = seg.args.first) && (sec[k] ||= []).push((v.val || `${v}`).replace(/\\\\/g, "\\"));
      sectionsTmp.push(sec);
      this.buf = cmt = "";
    } else (v = this.visit(node)) && (this.buf += v + "\n");
    (v = this.buf) && sectionsTmp.push({
      code: v
    });
    return "";
  }
  function preUso(code, metaStr, vars) {
    const pool = Object.create(null);
    const reCmt = /\/\*\[\[([\w-]+)]]\*\/([0-9a-f]{2}(?=\W)|)/gi;
    const doReplace = text => text.replace(reCmt, (s, name, hexAlpha) => {
      const key = hexAlpha ? name + "[A]" : name;
      return (key in pool ? pool[key] : pool[key] = getValue(name, hexAlpha)) ?? s;
    });
    const getValue = (name, hexAlpha) => {
      let rgb;
      let v = vars[name] || (rgb = name.endsWith("-rgb")) && vars[name.slice(0, -4)];
      let {type, value} = v || {};
      if (type === "dropdown" || type === "select") {
        pool[name] = "";
        value = doReplace(value);
      } else if (type === "color" && (hexAlpha || rgb) && (v = color_converter.parse(value))) {
        hexAlpha && (v.a = 1);
        value = v.toString(rgb ? 2 : 1, {
          uso: hexAlpha || rgb
        }) + hexAlpha;
      }
      return value;
    };
    return vars ? doReplace(code) : code;
  }
  function spliceCssVars(sections, vars) {
    vars = `:root {\n${Object.keys(vars).map(k => `  --${k}: ${vars[k].value};\n`).join("")}}\n`;
    for (const section of sections) styleCodeEmpty(section) || spliceCssAfterGlobals(section, vars, styleCodeEmpty.lastIndex);
  }
  function spliceCssAfterGlobals(section, newText, after) {
    const {code} = section;
    const rx = /@import\s/gi;
    if (rx.lastIndex = after, rx.test(code)) {
      parserlib || loadParserlib();
      const P = new parserlib.css.Parser({
        globalsOnly: !0
      });
      P.parse(code);
      const {col, line, offset} = P.stream.token || P.stream.peekCached();
      after = (code.indexOf("\r") + 1 || 1e99) - 1 < offset ? col + code.split("\n", line).reduce((len, s) => len + s.length + 1, 0) : offset + 1;
    }
    section.code = (after ? code.slice(0, after) + "\n" : "") + newText + code.slice(after);
  }
  let builderChain;
  function simplifyUsercssVars(vars) {
    for (const va of Object.values(vars)) {
      let value = va.value != null ? va.value : va.default;
      switch (va.type) {
       case "select":
       case "dropdown":
       case "image":
        for (const opt of va.options) if (opt.name === value) {
          value = opt.value;
          break;
        }
        break;

       case "number":
       case "range":
        value += va.units || "";
      }
      va.value = value;
    }
  }
  global.onconnect = global.onmessage = function(evt, silent) {
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
      --numJobs || autoClose(TTL);
      lastBusy = performance.now();
    }
  }.bind(COMMANDS);
  Object.assign(COMMANDS, {
    compileUsercss: async (code, preprocessor, vars, styleId, strict) => {
      if (vars) {
        nullifyInvalidVars(vars);
        simplifyUsercssVars(vars);
      }
      const fn = preprocessor === "stylus" ? preStylus : preprocessor === "less" ? preLess : preprocessor === "uso" && preUso;
      const metaStr = getMetaComment(code);
      const log = fn === preStylus && [];
      const warn = log && [];
      let sections = (fn === preLess || fn === preStylus) && [];
      if (fn && (code = fn(code, metaStr, vars, sections, log, warn)) && code.then) {
        const me = builderChain = builderChain?.catch(() => {}).then(code) || code;
        code = await builderChain;
        builderChain === me && (builderChain = null);
      }
      sections ||= extractSections(code, styleId, metaStr, strict);
      vars && !fn && sections.length && spliceCssVars(sections, vars);
      !fn && preprocessor && preprocessor !== "default" && console.warn(`Unknown preprocessor "${preprocessor}" in style #${styleId}`);
      return [ sections, log, warn ];
    },
    extractSections,
    metaParse
  }, lint_worker);
})();