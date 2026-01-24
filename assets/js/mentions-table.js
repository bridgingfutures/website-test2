(function () {
  // --- Tabulator themes (v6+) ---
  var TABULATOR_CSS_DARK_ID = "tabulator-theme-dark";
  var TABULATOR_CSS_LIGHT_ID = "tabulator-theme-light";

  var TABULATOR_CSS_DARK =
    "https://cdn.jsdelivr.net/npm/tabulator-tables@6.3.1/dist/css/tabulator_midnight.min.css";
  var TABULATOR_CSS_LIGHT =
    "https://cdn.jsdelivr.net/npm/tabulator-tables@6.3.1/dist/css/tabulator_simple.min.css";

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectLocalCssOnce() {
    if (document.getElementById("mentions-table-css")) return;

    var css =
      "#mentions-table-wrap { width: 100%; }\n" +
      "\n" +
      "/* Full width by default on this page */\n" +
      "body.mentions-fullwidth main[aria-label='Main Content']{\n" +
      "  max-width: 100% !important;\n" +
      "  flex: 0 0 100% !important;\n" +
      "  width: 100% !important;\n" +
      "}\n" +
      "body.mentions-fullwidth main[aria-label='Main Content']{ padding-right: 0 !important; }\n" +
      "\n" +
      "#mentions-table { width: 100%; }\n" +
      "#mentions-table .tabulator-cell {\n" +
      "  white-space: normal !important;\n" +
      "  overflow: visible !important;\n" +
      "  text-overflow: clip !important;\n" +
      "  line-height: 1.35;\n" +
      "  padding-top: 10px;\n" +
      "  padding-bottom: 10px;\n" +
      "}\n" +
      "#mentions-table .tabulator-row { height: auto !important; }\n" +
      "#mentions-table .mention-quote {\n" +
      "  display: flex;\n" +
      "  gap: 10px;\n" +
      "  align-items: flex-start;\n" +
      "}\n" +
      "#mentions-table .mention-quote-text { flex: 1 1 auto; min-width: 0; }\n" +
      "#mentions-table .mention-quote-link {\n" +
      "  flex: 0 0 auto;\n" +
      "  opacity: 0.75;\n" +
      "  text-decoration: none;\n" +
      "}\n" +
      "#mentions-table .mention-quote-link:hover { opacity: 1; }\n";

    var style = document.createElement("style");
    style.id = "mentions-table-css";
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function isDarkMode() {
    var html = document.documentElement;
    var body = document.body;

    // 1) Chirpy can set html[data-mode="dark|light"]
    var mode = html.getAttribute("data-mode");
    if (mode === "dark") return true;
    if (mode === "light") return false;

    // 2) Fallback: some builds toggle classes instead
    var htmlClass = (html.className || "").toLowerCase();
    var bodyClass = (body && body.className ? body.className : "").toLowerCase();

    if (htmlClass.includes("dark") || htmlClass.includes("dark-mode")) return true;
    if (bodyClass.includes("dark") || bodyClass.includes("dark-mode")) return true;

    // 3) Last resort: prefers-color-scheme
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function ensureTabulatorThemeCss() {
    var darkLink = document.getElementById(TABULATOR_CSS_DARK_ID);
    var lightLink = document.getElementById(TABULATOR_CSS_LIGHT_ID);

    if (!darkLink) {
      darkLink = document.createElement("link");
      darkLink.id = TABULATOR_CSS_DARK_ID;
      darkLink.rel = "stylesheet";
      darkLink.href = TABULATOR_CSS_DARK;
      document.head.appendChild(darkLink);
    }

    if (!lightLink) {
      lightLink = document.createElement("link");
      lightLink.id = TABULATOR_CSS_LIGHT_ID;
      lightLink.rel = "stylesheet";
      lightLink.href = TABULATOR_CSS_LIGHT;
      document.head.appendChild(lightLink);
    }

    var dark = isDarkMode();
    darkLink.disabled = !dark;
    lightLink.disabled = dark;
  }

  function forceFullWidthDefault() {
    // Always expanded on Mentions page
    if (!document.body.classList.contains("mentions-fullwidth")) {
      document.body.classList.add("mentions-fullwidth");
    }
  }

  function build() {
    var tableEl = document.getElementById("mentions-table");
    var dataEl = document.getElementById("mentions-data");
    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    forceFullWidthDefault();
    ensureTabulatorThemeCss();
    injectLocalCssOnce();

    // Wrap once (optional but safe)
    if (!document.getElementById("mentions-table-wrap")) {
      var wrap = document.createElement("div");
      wrap.id = "mentions-table-wrap";
      tableEl.parentNode.insertBefore(wrap, tableEl);
      wrap.appendChild(tableEl);
    }

    var raw = (dataEl.textContent || "").trim();
    var data = [];
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

      // New -> Old by default
      initialSort: [{ column: "date", dir: "desc" }],

      columns: [
        { title: "Name", field: "name", sorter: "string", widthGrow: 2, minWidth: 150 },
        { title: "House", field: "house", sorter: "string", width: 85 },
        { title: "Party", field: "party", sorter: "string", width: 105 },

        // Action narrowable
        { title: "Action", field: "action_type", sorter: "string", width: 140 },

        {
          title: "Date",
          field: "date",
          sorter: "string", // ISO YYYY-MM-DD sorts correctly
          headerSortStartingDir: "desc",
          width: 115,
        },

        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          widthGrow: 10,
          minWidth: 520,
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

    setTimeout(function () {
      if (tableEl._tab) tableEl._tab.redraw(true);
    }, 50);
  }

  function hookThemeChanges() {
    if (window.__mentionsThemeHooked) return;
    window.__mentionsThemeHooked = true;

    function apply() {
      ensureTabulatorThemeCss();
      var tableEl = document.getElementById("mentions-table");
      if (tableEl && tableEl._tab) tableEl._tab.redraw(true);
    }

    // 1) If Chirpy changes attributes/classes
    var obs = new MutationObserver(function () {
      apply();
    });

    obs.observe(document.documentElement, { attributes: true });
    if (document.body) obs.observe(document.body, { attributes: true });

    // 2) If user clicks the toggle button
    document.addEventListener("click", function (e) {
      var t = e.target;
      var btn = t && t.closest ? t.closest("#mode-toggle") : null;
      if (btn) {
        // give Chirpy a moment to switch mode then apply
        setTimeout(apply, 50);
        setTimeout(apply, 200);
      }
    });

    // 3) prefers-color-scheme changes
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
