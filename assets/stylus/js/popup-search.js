"use strict";

(self.webpackChunkStylus = self.webpackChunkStylus || []).push([ [ "popup_search_js" ], {
  6445(_, ee, oe) {
    oe.r(ee);
    var ae = oe(7986);
    var le = oe(7393);
    var ue = oe(6518);
    var he = oe(7501);
    var pe = oe(3619);
    var ye = oe(4930);
    var fe = oe(492);
    var $e = oe(8982);
    var Ie = oe(6940);
    var xe = oe(8825);
    var _e = oe(3220);
    document.body.append(he.template.searchUI);
    const RESULT_TPL = he.template.searchResult;
    const RESULT_ID_PREFIX = RESULT_TPL.className + "-";
    const RESULT_SEL = "." + RESULT_TPL.className;
    const INDEX_URL = $e.usoaRaw[0] + "search-index.json";
    const USW_INDEX_URL = $e.usw + "api/index/uso-format";
    const USW_ICON = ae.$create("img", {
      src: `${$e.usw}favicon.ico`,
      title: $e.usw
    });
    const STYLUS_CATEGORY = "chrome-extension";
    const PAGE_LENGTH = Ie.isSidebar ? 250 : 100;
    const USO_AUTO_PIC_SUFFIX = "-after.png";
    const GLOBAL = "global";
    const dom = {};
    const $searchGlobals = document.getElementById("popup.search.globals");
    if (xe.tabUrlSupported) {
      le.setupLivePrefs([ $searchGlobals.id ]);
      $searchGlobals.onchange = () => {
        searchGlobals = $searchGlobals.checked;
        ready = ready.then(start);
      };
    } else $searchGlobals.checked = $searchGlobals.disabled = !0;
    let results, resultsAllYears;
    let index;
    let host3 = "";
    let category = "";
    let rxCategory;
    let searchGlobals = !xe.tabUrlSupported || $searchGlobals.checked;
    let query = [];
    let order = fe.__values["popup.findSort"];
    let scrollToFirstResult = !0;
    let displayedPage = 1;
    let totalPages = 1;
    let ready;
    let indexing;
    let imgType = ".jpeg";
    ae.$create("img", {
      src: "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=",
      onload: () => imgType = ".webp"
    });
    const $resultEntry = el => {
      const entry = el.closest(RESULT_SEL);
      return {
        entry,
        result: entry && entry._result
      };
    };
    const rid2id = rid => rid.split("-")[1];
    const eventMap = {
      styleAdded: onStyleInstalled,
      styleUpdated: onStyleInstalled,
      styleDeleted: id => {
        const r = results.find(_ => _._styleId === id);
        if (r) {
          r.f && ye.API.uso.pingback(rid2id(r.i), !1);
          delete r._styleId;
          renderActionButtons(r.i);
        }
      }
    };
    _e.styleFinder.on = async (method, styleId, busy) => {
      const fn = eventMap[method];
      if (fn) {
        busy && await busy;
        await fn(styleId);
      }
    };
    _e.styleFinder.inline = () => {
      calcCategory();
      ready = start();
    };
    _e.styleFinder.inSite = event => {
      category || calcCategory({
        retry: 1
      });
      const add = (prefix, str) => str ? prefix + str : "";
      const where = event.detail;
      const q = encodeURIComponent(document.getElementById("search-query").value.trim());
      const isStylus = category === STYLUS_CATEGORY;
      const cat = isStylus ? "Stylus" : category;
      const andQ = add("&q=", q);
      const catQ = cat + add("+", q);
      const href = where === "uso" && `${$e.uso}styles/browse${q ? `?search_terms=${catQ}` : category === GLOBAL ? "" : `/${category}`}` || where === "usoa" && `${$e.usoa}browse/styles?search=%23${catQ}` || where === "usw" && `${$e.usw}search?${isStylus ? "q=" + cat : "category=" + cat + andQ}` || where === "gf" && `https://greasyfork.org/scripts${xe.tabUrlSupported ? Ie.tryURL(xe.tabUrl).hostname.replace(/^(www\.)?/, "/by-site/") : ""}?language=css${andQ}`;
      _e.openURLandHide.call({
        href
      }, event);
    };
    document.getElementById("search-query").oninput = function() {
      query = [];
      const text = this.value.trim();
      for (let m, re = /(")(.+?)"|((\/)?(\S+?)(\/\w*)?)(?=\s|$)/g; m = re.exec(text); ) {
        const [all, q, qt, rawText, rx1 = "", rx, rx2 = ""] = m;
        query.push(rx1 && rx2 && Ie.tryRegExp(rx, rx2.slice(1)) || Ie.stringAsRegExp(q ? qt : rawText, all === all.toLocaleLowerCase() ? "i" : ""));
      }
      category === STYLUS_CATEGORY && query.push(/\bStylus\b/);
      ready = ready.then(start);
    };
    document.getElementById("search-years").onchange = () => {
      ready = ready.then(() => start({
        keepYears: !0
      }));
    };
    document.getElementById("search-order").value = order;
    document.getElementById("search-order").onchange = function() {
      order = this.value;
      fe.set("popup.findSort", order);
      results.sort(comparator);
      render();
    };
    dom.list = document.getElementById("search-results-list");
    dom.container = document.getElementById("search-results");
    dom.container.dataset.empty = "";
    dom.error = document.getElementById("search-results-error");
    dom.nav = {};
    const navOnClick = {
      prev: () => {
        displayedPage = Math.max(1, displayedPage - 1);
        scrollToFirstResult = !0;
        render();
      },
      next: () => {
        displayedPage = Math.min(totalPages, displayedPage + 1);
        scrollToFirstResult = !0;
        render();
      }
    };
    for (const place of [ "top", "bottom" ]) {
      const nav = document.querySelector(`.search-results-nav[data-type="${place}"]`);
      nav.appendChild(he.template.searchNav.cloneNode(!0));
      dom.nav[place] = nav;
      for (const child of nav.$$("[data-type]")) {
        const type = child.dataset.type;
        child.onclick = navOnClick[type];
        nav["_" + type] = child;
      }
    }
    async function onStyleInstalled(id) {
      const ri = await ye.API.styles.getRemoteInfo(id);
      const r = ri && results.find(_ => ri[0] === _.i);
      if (r) {
        r._styleId = id;
        r._styleVars = ri[1];
        renderActionButtons(ri[0]);
      }
    }
    function error(err) {
      dom.error.textContent = err && err.message || `${err}`;
      dom.error.hidden = !1;
      dom.list.hidden = !0;
      ae.$rootCL.add("search-results-shown");
      dom.error.getBoundingClientRect().bottom < 0 && dom.error.scrollIntoView(!0);
    }
    function errorIfNoneFound() {
      if (!results.length && !document.getElementById("search-query").value) return indexing ? indexing.then(errorIfNoneFound) : Promise.reject(Ie.t("searchResultNoneFound"));
    }
    async function start({keepYears} = {}) {
      try {
        results = [];
        for (let retry = 0; !results.length && retry <= 2; retry++) results = await search({
          retry
        });
        if (results.length) {
          const info = await ye.API.styles.getRemoteInfo();
          for (const r of results) [r._styleId, r._styleVars] = info[r.i] || [];
        }
        keepYears || (resultsAllYears = results);
        renderYears();
        render();
        dom.list.hidden = !results.length;
        await errorIfNoneFound();
        resetUI();
        results.length && doScrollToFirstResult();
      } catch (_) {
        error(_);
      }
    }
    function resetUI() {
      ae.$rootCL.add("search-results-shown");
      dom.container.hidden = !1;
      dom.list.hidden = !1;
      dom.error.hidden = !0;
    }
    function renderYears() {
      const BASE = new Date(0).getFullYear();
      const SAFETY = 1 / 365.2425;
      const years = [];
      for (const r of resultsAllYears) {
        let y = r._year;
        if (!y) {
          y = r.u / 31556952 + BASE;
          r._year = y = Math.abs(y % 1 - 1) <= SAFETY ? new Date(r.u * 1e3).getFullYear() : y | 0;
        }
        years[y] = (years[y] || 0) + 1;
      }
      const texts = years.reduceRight((res, num, y) => res.push(`${y} (${num})`) && res, []);
      const selects = [ ...document.querySelectorAll("#search-years select") ];
      selects.forEach((sel, selNum) => {
        if (texts.length !== sel.length || texts.some((v, i) => v !== sel[i].text)) {
          const i = sel.selectedIndex;
          const value = i && i < sel.length - 1 && sel.value;
          sel.textContent = "";
          sel.append(...texts.map(_ => ae.$create("option", {
            value: _.split(" ")[0]
          }, _)));
          sel.value = value || sel[(selNum ? "first" : "last") + "Child"]?.value;
        }
      });
      const [y1, y2] = selects.map(el => Number(el.value)).sort();
      results = y1 ? resultsAllYears.filter(r => (r = r._year) >= y1 && r <= y2) : resultsAllYears;
    }
    function render() {
      totalPages = Math.ceil(results.length / PAGE_LENGTH);
      displayedPage = Math.min(displayedPage, totalPages) || 1;
      let startAt = (displayedPage - 1) * PAGE_LENGTH;
      const end = displayedPage * PAGE_LENGTH;
      let plantAt = 0;
      let slot = dom.list.children[0];
      for (;plantAt < PAGE_LENGTH && slot && slot.id === RESULT_ID_PREFIX + results[startAt]?.i; ) {
        slot = slot.nextElementSibling;
        plantAt++;
        startAt++;
      }
      for (;startAt < Math.min(end, results.length); ) {
        const entry = createSearchResultNode(results[startAt++]);
        if (slot) {
          dom.list.replaceChild(entry, slot);
          slot = entry.nextElementSibling;
        } else dom.list.appendChild(entry);
        plantAt++;
      }
      const pageLen = end > results.length && results.length % PAGE_LENGTH || Math.min(results.length, PAGE_LENGTH);
      for (;dom.list.children.length > pageLen; ) dom.list.lastElementChild.remove();
      results.length && "empty" in dom.container.dataset && delete dom.container.dataset.empty;
      scrollToFirstResult && Ie.debounce(doScrollToFirstResult);
      for (const place in dom.nav) {
        const nav = dom.nav[place];
        nav._prev.disabled = displayedPage <= 1;
        nav._next.disabled = displayedPage >= totalPages;
        nav._page.textContent = displayedPage;
        nav._total.textContent = totalPages;
        nav._num.textContent = results.length;
      }
    }
    function doScrollToFirstResult() {
      if (dom.container.scrollHeight > window.innerHeight * 2) {
        scrollToFirstResult = !1;
        dom.container.scrollIntoView(!0);
      }
    }
    function createSearchResultNode(result) {
      const entry = RESULT_TPL.cloneNode(!0);
      const {i: rid, n: name, r: rating, u: updateTime, w: weeklyInstalls, t: totalInstalls, ai: authorId, an: author, sa: shotArchived, sn: shot, f: fmt} = entry._result = result;
      const id = rid2id(rid);
      entry.id = RESULT_ID_PREFIX + rid;
      Object.assign(entry.$(".search-result-title"), {
        onclick: _e.openURLandHide,
        href: `${fmt ? $e.usoa : $e.usw}style/${id}`
      });
      fmt || entry.$(".search-result-title").prepend(USW_ICON.cloneNode(!0));
      entry.$(".search-result-title span").textContent = he.breakWord(Ie.clipString(name, 300));
      const elShot = entry.$(".search-result-screenshot");
      let shotSrc;
      if (fmt) {
        elShot._src = $e.uso + `auto_style_screenshots/${id}${USO_AUTO_PIC_SUFFIX}`;
        shotSrc = shot && !shot.endsWith(USO_AUTO_PIC_SUFFIX) ? `${shotArchived ? $e.usoaRaw[0] : $e.uso + "style_"}screenshots/${shot}` : elShot._src;
      } else shotSrc = /^https?:/i.test(shot) && shot.replace(/\.\w+$/, imgType);
      if (shotSrc) {
        elShot._entry = entry;
        elShot.src = shotSrc;
        elShot.onerror = fixScreenshot;
      } else entry.dataset.noImage = "";
      Object.assign(entry.$('[data-type="author"] a'), {
        textContent: author,
        title: author,
        href: fmt ? `${$e.usoa}browse/styles?search=%40${authorId}` : `${$e.usw}user/${encodeURIComponent(author)}`,
        onclick: _e.openURLandHide
      });
      entry.$('[data-type="rating"]').dataset.class = rating ? rating >= 2.5 ? "good" : rating >= 1.5 ? "okay" : "bad" : "none";
      entry.$('[data-type="rating"] dd').textContent = rating && rating.toFixed(1) || "";
      Object.assign(entry.$('[data-type="updated"] time'), {
        dateTime: updateTime * 1e3,
        textContent: he.formatDate(updateTime * 1e3)
      });
      entry.$('[data-type="weekly"] dd').textContent = formatNumber(weeklyInstalls);
      entry.$('[data-type="total"] dd').textContent = formatNumber(totalInstalls);
      renderActionButtons(entry);
      return entry;
    }
    function formatNumber(num) {
      return num > 1e9 ? (num / 1e9).toFixed(1) + "B" : num > 1e7 ? (num / 1e6).toFixed(0) + "M" : num > 1e6 ? (num / 1e6).toFixed(1) + "M" : num > 1e4 ? (num / 1e3).toFixed(0) + "k" : num > 1e3 ? (num / 1e3).toFixed(1) + "k" : num;
    }
    function fixScreenshot() {
      const {_src: _} = this;
      if (_ && _ !== this.src) {
        this.src = _;
        delete this._src;
      } else {
        this.onerror = null;
        this.removeAttribute("src");
        this._entry.dataset.noImage = "";
        renderActionButtons(this._entry);
      }
    }
    function renderActionButtons(entry) {
      typeof entry != "object" && (entry = document.getElementById(RESULT_ID_PREFIX + entry));
      if (!entry) return;
      const result = entry._result;
      const installedId = result._styleId;
      const isInstalled = installedId > 0;
      const status = entry.$(".search-result-status").textContent = isInstalled ? Ie.t("clickToUninstall") : entry.dataset.noImage != null ? Ie.t("installButton") : "";
      const notMatching = isInstalled && !document.getElementById("style-" + installedId);
      if (notMatching !== entry.classList.contains("not-matching")) {
        entry.classList.toggle("not-matching");
        notMatching ? entry.prepend(he.template.searchResultNotMatching.cloneNode(!0)) : entry.firstElementChild.remove();
      }
      Object.assign(entry.$(".search-result-screenshot"), {
        onclick: isInstalled ? uninstall : install,
        title: status ? "" : Ie.t("installButton")
      });
      entry.$(".search-result-uninstall").onclick = uninstall;
      entry.$(".search-result-install").onclick = install;
      Object.assign(entry.$(".search-result-customize"), {
        onclick: customize,
        disabled: notMatching
      });
      ae.$toggleDataset(entry, "installed", isInstalled);
      ae.$toggleDataset(entry, "customizable", result._styleVars);
    }
    function renderFullInfo(entry, style) {
      let {description, vars} = style.usercssData;
      description = (description || "").replace(/<[^>]*>/g, " ").replace(/([^.][.。?!]|[\s,].{50,70})\s+/g, "$1\n").replace(/([\r\n]\s*){3,}/g, "\n\n");
      entry.$(".search-result-description").textContent = description;
      vars = !!vars;
      entry._result._styleVars = vars;
      ae.$toggleDataset(entry, "customizable", vars);
    }
    function customize() {
      _e.configure.call(this, {}, document.getElementById("style-" + $resultEntry(this).result._styleId));
    }
    async function install() {
      const {entry, result} = $resultEntry(this);
      const {f: fmt} = result;
      const id = rid2id(result.i);
      const installButton = entry.$(".search-result-install");
      const spinner = ue.showSpinner(entry);
      installButton.disabled = !0;
      entry.style.setProperty("pointer-events", "none", "important");
      delete entry.dataset.error;
      fmt && ye.API.uso.pingback(id, 5e3);
      const updateUrl = $e.makeUpdateUrl(fmt ? "usoa" : "usw", id);
      try {
        const sourceCode = await (await fetch(updateUrl)).text();
        renderFullInfo(entry, await ye.API.usercss.install({
          sourceCode,
          updateUrl
        }));
      } catch (_) {
        entry.dataset.error = `${Ie.t("genericError")}: ${_ && _.message || _}`;
        entry.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
      spinner.remove();
      installButton.disabled = !1;
      entry.style.pointerEvents = "";
    }
    function uninstall() {
      const {result} = $resultEntry(this);
      ye.API.styles.remove(result._styleId);
    }
    function calcCategory({retry} = {}) {
      const old = category;
      const u = xe.tabUrlSupported && Ie.tryURL(xe.tabUrl);
      if (u?.href) if (u.protocol === "file:") category = "file:"; else if (u.protocol === location.protocol) category = STYLUS_CATEGORY; else {
        const parts = u.hostname.replace(/\.(?:com?|org)(\.\w{2,3})$/, "$1").split(".");
        const [tld, main = u.hostname, third, fourth] = parts.reverse();
        const keepThird = !retry && (fourth || third && third !== "www" && third !== "m");
        category = (keepThird && `${third}.` || "") + main + (retry !== 1 && tld !== "com" && (tld !== "org" || main === "userstyles") || keepThird ? `.${tld}` : "");
        host3 || (host3 = keepThird && category);
      } else category = GLOBAL;
      rxCategory = new RegExp(`\\b${Ie.stringAsRegExpStr(category)}\\b`, "i");
      return category !== old;
    }
    async function fetchIndex() {
      const elNote = document.getElementById("pct").firstChild;
      const jobs = [ [ INDEX_URL, "uso", json => json.filter(v => v.f === "uso") ], [ USW_INDEX_URL, "usw", json => json.data ] ].map(fetchIndexJob);
      indexing = Promise.all(jobs).then(() => {
        indexing = null;
        elNote.style.opacity = 0;
        start();
      });
      await new Promise((resolve, reject) => {
        for (const job of jobs) job.then(resolve, reject);
      });
      return index;
    }
    async function fetchIndexJob([url, prefix, transform]) {
      let el = ae.$create("div", {
        title: url
      });
      document.getElementById("pct").append(el);
      pe.onConnect[prefix] = port => {
        port.onMessage.addListener(([done, total]) => {
          el && (el.textContent = total ? (done / total * 100 | 0) + "%" : formatNumber(done) + "...");
        });
      };
      for (let triesLeft = 3; triesLeft--; ) try {
        const res = transform(JSON.parse(await ye.API.util.download(url, {
          port: prefix
        })));
        for (const v of res) v.i = `${prefix}-${v.i}`;
        index = index ? index.concat(res) : res;
        break;
      } catch (_) {
        triesLeft ? await Ie.sleep(250) : error(_.message);
      }
      el = el.style.opacity = 0;
    }
    async function search({retry} = {}) {
      return !retry || query.length || calcCategory({
        retry
      }) ? (index || await fetchIndex()).filter(isResultMatching).sort(comparator) : [];
    }
    function isResultMatching(res) {
      const {c} = res;
      let bias;
      return (bias = c === category || host3 && (c.includes(".") ? host3.charCodeAt(host3.length - c.length - 1) === 46 && host3.endsWith(c) : host3.includes(`.${c}.`)) && 2 + !res.n.includes(host3) || (category === STYLUS_CATEGORY ? c === "stylus" : c === GLOBAL && searchGlobals && (query.length || rxCategory.test(res.n)))) && query.every(isInHaystack, res) && (res._bias = bias);
    }
    function isInHaystack(q) {
      return q.test(this.n);
    }
    function comparator(a, b) {
      return a._bias - b._bias || (order === "n" ? a.n < b.n ? -1 : a.n > b.n : b[order] - a[order]) || b.t - a.t;
    }
  }
} ]);