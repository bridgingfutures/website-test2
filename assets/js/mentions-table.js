(function () {
  // Match your Tabulator version in URLs
  var TAB_VER = "6.2.5";

  // We load BOTH themes and toggle them
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

    // Chirpy often uses html[data-mode="dark|light"]
    var mode = html.getAttribute("data-mode");
    if (mode === "dark") return true;
    if (mode === "light") return false;

    // Fallback: class-based (some builds)
    var htmlClass = (html.className || "").toLowerCase();
    var bodyClass = (body && body.className ? body.className : "").toLowerCase();
    if (htmlClass.includes("dark") || htmlClass.includes("dark-mode")) return true;
    if (bodyClass.includes("dark") || bodyClass.includes("dark-mode")) return true;

    // Last resort
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function ensureThemeCss() {
    var darkLink = document.getElementById(CSS_DARK_ID);
    var lightLink = document.getElementById(CSS_LIGHT_ID);

    if (!darkLink) {
      darkLink = document.createElement("link");
      darkLink.id = CSS_DARK_ID;
      darkLink.rel = "stylesheet";
      darkLink.href = CSS_DARK;
      document.head.appendChild(darkLink);
    }

    if (!lightLink) {
      lightLink = document.createElement("link");
      lightLink.id = CSS_LIGHT_ID;
      lightLink.rel = "stylesheet";
      lightLink.href = CSS_LIGHT;
      document.head.appendChild(lightLink);
    }

    var dark = isDarkMode();
    darkLink.disabled = !dark;
    lightLink.disabled = dark;
  }

  function injectCssOnce() {
    if (document.getElementById("mentions-table-css")) return;

    var css =
      /* Make cells wrap & rows auto-height */
      "#mentions-table .tabulator-cell{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.35;padding-top:10px;padding-bottom:10px;}\n" +
      "#mentions-table .tabulator-row{height:auto!important;}\n" +
      /* Quote cell layout with arrow */
      "#mentions-table .mention-quote{display:flex;gap:10px;align-items:flex-start;}\n" +
      "#mentions-table .mention-quote-text{flex:1 1 auto;min-width:0;}\n" +
      "#mentions-table .mention-quote-link{flex:0 0 auto;opacity:.75;text-decoration:none;}\n" +
      "#mentions-table .mention-quote-link:hover{opacity:1;}\n" +
      /* Remove horizontal scroll bar inside Tabulator */
      "#mentions-table .tabulator-tableholder{overflow-x:hidden!important;}\n";

    var style = document.createElement("style");
    style.id = "mentions-table-css";
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function build() {
    var tableEl = document.getElementById("mentions-table");
    var dataEl = document.getElementById("mentions-data");
    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    ensureThemeCss();
    injectCssOnce();

    var raw = (dataEl.textContent || "").trim();
    var data;
    try {
      data = JSON.parse(raw || "[]");
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      return;
    }
    if (!Array.isArray(data)) data = [];

    // Re-init safe for Turbo
    if (tableEl._tab) {
      tableEl._tab.destroy();
      tableEl._tab = null;
    }

    tableEl._tab = new Tabulator(tableEl, {
      data: data,
      layout: "fitColumns",
      placeholder: "No mentions yet.",

      // default: newest -> oldest
      initialSort: [{ column: "date", dir: "desc" }],

      // IMPORTANT: removes horizontal scroll on narrow widths by collapsing columns
      responsiveLayout: "collapse",
      responsiveLayoutCollapseStartOpen: false,

      columns: [
        {
          title: "Name",
          field: "name",
          sorter: "string",
          widthGrow: 2,
          minWidth: 140,
          responsive: 0,
        },
        {
          title: "House",
          field: "house",
          sorter: "string",
          width: 80,
          responsive: 4,
        },
        {
          title: "Party",
          field: "party",
          sorter: "string",
          width: 95,
          responsive: 3,
        },
        {
          title: "Action",
          field: "action_type",
          sorter: "string",
          width: 130,     // <= теперь можно ужать
          minWidth: 100,  // <= минималка небольшая
          responsive: 2,
        },
        {
          title: "Date",
          field: "date",
          sorter: "string", // ISO YYYY-MM-DD сортируется правильно как строка
          headerSortStartingDir: "desc",
          width: 110,
          responsive: 1,
        },
        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          widthGrow: 10,
          minWidth: 240,  // <= больше НЕ огромная, чтобы не ломать fitColumns
          responsive: 0,
          formatter: function (cell) {
            var row = cell.getRow().getData() || {};
            var quote = escapeHtml(cell.getValue() || "");
            var url = row.link;

            var arrow = "";
            if (url) {
              arrow =
                '<a class="mention-quote-link" href="' +
                escapeHtml(url) +
                '" target="_blank" rel="noopener" aria-label="Open source">↗</a>';
            }

            return (
              '<div class="mention-quote">' +
              '<div class="mention-quote-text">' +
              quote +
              "</div>" +
              arrow +
              "</div>"
            );
          },
        },
      ],
    });

    // redraw after layout settles
    setTimeout(function () {
      if (tableEl._tab) tableEl._tab.redraw(true);
    }, 50);
  }

  function hookThemeChanges() {
    if (window.__mentionsThemeHooked) return;
    window.__mentionsThemeHooked = true;

    function apply() {
      ensureThemeCss();
      var tableEl = document.getElementById("mentions-table");
      if (tableEl && tableEl._tab) tableEl._tab.redraw(true);
    }

    // observe attribute/class changes on html/body
    var obs = new MutationObserver(function () {
      apply();
    });
    obs.observe(document.documentElement, { attributes: true });
    if (document.body) obs.observe(document.body, { attributes: true });

    // if user clicks the Chirpy toggle button
    document.addEventListener("click", function (e) {
      var t = e.target;
      var btn = t && t.closest ? t.closest("#mode-toggle") : null;
      if (btn) {
        setTimeout(apply, 50);
        setTimeout(apply, 200);
      }
    });

    // prefers-color-scheme changes
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq && mq.addEventListener) mq.addEventListener("change", apply);
    }
  }

  function init() {
    hookThemeChanges();
    // Chirpy/Turbo can render after events
    setTimeout(build, 0);
    setTimeout(build, 150);
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
