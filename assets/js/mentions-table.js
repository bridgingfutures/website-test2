(function () {
  var TAB_VER = "6.2.5";

  var CSS_DARK_ID = "tabulator-theme-dark";
  var CSS_LIGHT_ID = "tabulator-theme-light";

  var CSS_DARK =
    "https://cdn.jsdelivr.net/npm/tabulator-tables@" +
    TAB_VER +
    "/dist/css/tabulator_midnight.min.css";
  var CSS_LIGHT =
    "https://cdn.jsdelivr.net/npm/tabulator-tables@" +
    TAB_VER +
    "/dist/css/tabulator_simple.min.css";

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isDarkMode() {
    var html = document.documentElement;
    var body = document.body;

    // Chirpy usually uses data-mode
    var mode = html.getAttribute("data-mode");
    if (mode === "dark") return true;
    if (mode === "light") return false;

    // fallback by class
    var htmlClass = (html.className || "").toLowerCase();
    var bodyClass = (body && body.className ? body.className : "").toLowerCase();
    if (htmlClass.includes("dark") || htmlClass.includes("dark-mode")) return true;
    if (bodyClass.includes("dark") || bodyClass.includes("dark-mode")) return true;

    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  function ensureThemeCssLinks() {
    var darkLink = document.getElementById(CSS_DARK_ID);
    var lightLink = document.getElementById(CSS_LIGHT_ID);

    if (!darkLink) {
      darkLink = document.createElement("link");
      darkLink.id = CSS_DARK_ID;
      darkLink.rel = "stylesheet";
      darkLink.href = CSS_DARK;
      darkLink.media = "all";
      document.head.appendChild(darkLink);
    }

    if (!lightLink) {
      lightLink = document.createElement("link");
      lightLink.id = CSS_LIGHT_ID;
      lightLink.rel = "stylesheet";
      lightLink.href = CSS_LIGHT;
      lightLink.media = "all";
      document.head.appendChild(lightLink);
    }

    return { darkLink: darkLink, lightLink: lightLink };
  }

  function applyThemeCss() {
    var links = ensureThemeCssLinks();
    var dark = isDarkMode();

    // both are loaded; just enable the right one
    links.darkLink.disabled = !dark;
    links.lightLink.disabled = dark;
    return links;
  }

  function whenCssReady(linkEl) {
    return new Promise(function (resolve) {
      if (!linkEl) return resolve();

      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }

      linkEl.addEventListener("load", finish, { once: true });
      linkEl.addEventListener("error", finish, { once: true });

      // Poll as fallback (cached CSS may not fire load)
      var tries = 0;
      var timer = setInterval(function () {
        tries += 1;
        if (tries > 25) {
          clearInterval(timer);
          finish();
          return;
        }
        try {
          if (linkEl.sheet) {
            clearInterval(timer);
            finish();
          }
        } catch (e) {}
      }, 40);

      setTimeout(function () {
        clearInterval(timer);
        finish();
      }, 1500);
    });
  }

  function waitForTabulator(timeoutMs) {
    timeoutMs = timeoutMs || 3000;
    return new Promise(function (resolve, reject) {
      var start = Date.now();
      (function tick() {
        if (typeof Tabulator === "function") return resolve();
        if (Date.now() - start > timeoutMs)
          return reject(new Error("Tabulator not available"));
        setTimeout(tick, 40);
      })();
    });
  }

  function injectCssOnce() {
    if (document.getElementById("mentions-table-css")) return;

    var css =
      "#mentions-table .tabulator-cell{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.35;padding-top:10px;padding-bottom:10px;}\n" +
      "#mentions-table .tabulator-row{height:auto!important;}\n" +
      "#mentions-table .tabulator-tableholder{overflow-x:hidden!important;}\n" +

      "#mentions-table .mention-quote{display:flex;gap:10px;align-items:flex-start;}\n" +
      "#mentions-table .mention-quote-text{flex:1 1 auto;min-width:0;}\n" +
      "#mentions-table .mention-quote-link{flex:0 0 auto;opacity:.75;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;}\n" +
      "#mentions-table .mention-quote-link:hover{opacity:1;}\n" +

      "html[data-mode='dark'] #mentions-table .mention-quote-link{background:rgba(255,255,255,.06);}\n" +
      "html[data-mode='light'] #mentions-table .mention-quote-link{background:rgba(0,0,0,.05);}\n" +

      "#mentions-table .tabulator-responsive-collapse{padding:12px 12px 14px!important;}\n" +
      "#mentions-table .mention-collapse-card{border-radius:12px;padding:12px 12px 10px;}\n" +
      "html[data-mode='dark'] #mentions-table .mention-collapse-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);}\n" +
      "html[data-mode='light'] #mentions-table .mention-collapse-card{background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.08);}\n" +
      "#mentions-table .mention-collapse-row{display:flex;gap:10px;margin:6px 0;}\n" +
      "#mentions-table .mention-collapse-key{flex:0 0 90px;opacity:.75;font-size:.85rem;}\n" +
      "#mentions-table .mention-collapse-val{flex:1 1 auto;min-width:0;}\n";

    var style = document.createElement("style");
    style.id = "mentions-table-css";
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function buildNow() {
    var tableEl = document.getElementById("mentions-table");
    var dataEl = document.getElementById("mentions-data");
    if (!tableEl || !dataEl) return;

    injectCssOnce();
    applyThemeCss();

    var raw = (dataEl.textContent || "").trim();
    var data;
    try {
      data = JSON.parse(raw || "[]");
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      return;
    }
    if (!Array.isArray(data)) data = [];

    if (tableEl._tab) {
      tableEl._tab.destroy();
      tableEl._tab = null;
    }

    tableEl._tab = new Tabulator(tableEl, {
      data: data,
      layout: "fitColumns",
      placeholder: "No mentions yet.",

      // newest -> oldest by default
      initialSort: [{ column: "date", dir: "desc" }],

      // avoid horizontal scroll (collapse on narrow)
      responsiveLayout: "collapse",
      responsiveLayoutCollapseStartOpen: false,

      responsiveLayoutCollapseFormatter: function (rows) {
        var html = rows
          .map(function (item) {
            return (
              '<div class="mention-collapse-row">' +
              '<div class="mention-collapse-key">' +
              escapeHtml(item.title) +
              "</div>" +
              '<div class="mention-collapse-val">' +
              (item.value == null || item.value === "" ? "—" : String(item.value)) +
              "</div>" +
              "</div>"
            );
          })
          .join("");
        return '<div class="mention-collapse-card">' + html + "</div>";
      },

      columns: [
        { title: "Name", field: "name", sorter: "string", widthGrow: 2, minWidth: 140, responsive: 0 },
        { title: "House", field: "house", sorter: "string", width: 78, minWidth: 70, responsive: 4 },
        { title: "Party", field: "party", sorter: "string", width: 95, minWidth: 80, responsive: 3 },
        { title: "Action", field: "action_type", sorter: "string", width: 120, minWidth: 90, responsive: 2 },
        { title: "Date", field: "date", sorter: "string", headerSortStartingDir: "desc", width: 110, minWidth: 105, responsive: 1 },
        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          widthGrow: 10,
          minWidth: 260,
          responsive: 0,
          formatter: function (cell) {
            var row = cell.getRow().getData() || {};
            var quote = escapeHtml(cell.getValue() || "");
            var url = row.link;

            var iconHtml = "";
            if (url) {
              iconHtml =
                '<a class="mention-quote-link" href="' +
                escapeHtml(url) +
                '" target="_blank" rel="noopener" aria-label="Open source" title="Open source">' +
                '<i class="fa-solid fa-arrow-up-right-from-square"></i>' +
                "</a>";
            }

            return (
              '<div class="mention-quote">' +
              '<div class="mention-quote-text">' +
              quote +
              "</div>" +
              iconHtml +
              "</div>"
            );
          },
        },
      ],
    });

    // Critical: force proper layout after fonts/CSS settle
    // This fixes "header only" / empty body on first load.
    var t = tableEl._tab;

    function forceRedraw() {
      if (!t) return;
      try {
        t.redraw(true);
        t.setSort([{ column: "date", dir: "desc" }]); // re-apply default sort after redraw
      } catch (e) {}
    }

    // Several passes: immediate, after layout, after fonts, after images
    setTimeout(forceRedraw, 0);
    setTimeout(forceRedraw, 80);
    setTimeout(forceRedraw, 250);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        setTimeout(forceRedraw, 30);
      });
    }

    window.addEventListener(
      "load",
      function () {
        setTimeout(forceRedraw, 30);
      },
      { once: true }
    );
  }

  function buildSafely() {
    var links = applyThemeCss();

    // Wait for Tabulator + both CSS to be "ready enough"
    Promise.all([
      waitForTabulator(4000),
      whenCssReady(links.darkLink),
      whenCssReady(links.lightLink),
    ])
      .then(function () {
        applyThemeCss();
        // extra tick so browser can apply style recalcs
        requestAnimationFrame(function () {
          requestAnimationFrame(buildNow);
        });
      })
      .catch(function () {
        // still try
        setTimeout(buildNow, 150);
      });
  }

  function hookThemeChanges() {
    if (window.__mentionsThemeHooked) return;
    window.__mentionsThemeHooked = true;

    // React to Chirpy mode changes (attribute/class)
    var obs = new MutationObserver(function () {
      applyThemeCss();
      var tableEl = document.getElementById("mentions-table");
      if (tableEl && tableEl._tab) {
        setTimeout(function () { tableEl._tab.redraw(true); }, 60);
        setTimeout(function () { tableEl._tab.redraw(true); }, 180);
      }
    });

    obs.observe(document.documentElement, { attributes: true });
    if (document.body) obs.observe(document.body, { attributes: true });

    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("#mode-toggle") : null;
      if (btn) {
        applyThemeCss();
        var tableEl = document.getElementById("mentions-table");
        if (tableEl && tableEl._tab) {
          setTimeout(function () { tableEl._tab.redraw(true); }, 80);
          setTimeout(function () { tableEl._tab.redraw(true); }, 220);
        }
      }
    });
  }

  function init() {
    hookThemeChanges();
    buildSafely();
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
