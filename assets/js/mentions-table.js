(function () {
  // --- SETTINGS (можешь менять тут при желании) ---
  var TABULATOR_CSS_DARK_ID = "tabulator-theme-dark";
  var TABULATOR_CSS_LIGHT_ID = "tabulator-theme-light";

  // CDN темы Tabulator (v6+)
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
      "#mentions-table-toolbar {\n" +
      "  display: flex;\n" +
      "  justify-content: flex-end;\n" +
      "  gap: 8px;\n" +
      "  margin: 8px 0 10px 0;\n" +
      "}\n" +
      "#mentions-expand-btn {\n" +
      "  border: 1px solid rgba(255,255,255,0.15);\n" +
      "  background: transparent;\n" +
      "  color: inherit;\n" +
      "  padding: 6px 10px;\n" +
      "  border-radius: 8px;\n" +
      "  font-size: 0.9rem;\n" +
      "  opacity: 0.85;\n" +
      "}\n" +
      "#mentions-expand-btn:hover { opacity: 1; }\n" +
      "html[data-mode='light'] #mentions-expand-btn { border-color: rgba(0,0,0,0.15); }\n" +
      "\n" +
      /* Full width mode: растягиваем main-content на всю ширину контейнера */
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
    // Chirpy обычно выставляет html[data-mode="dark|light"]
    var html = document.documentElement;
    var mode = html.getAttribute("data-mode");
    if (mode === "dark") return true;
    if (mode === "light") return false;

    // fallback: если атрибута нет — смотрим prefers-color-scheme
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function ensureTabulatorThemeCss() {
    // Загружаем оба линка один раз, потом только включаем/выключаем
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

  function mountToolbarOnce() {
    if (document.getElementById("mentions-table-toolbar")) return;

    var wrap = document.getElementById("mentions-table-wrap");
    var table = document.getElementById("mentions-table");
    if (!wrap || !table) return;

    var toolbar = document.createElement("div");
    toolbar.id = "mentions-table-toolbar";

    var btn = document.createElement("button");
    btn.id = "mentions-expand-btn";
    btn.type = "button";
    btn.textContent = document.body.classList.contains("mentions-fullwidth")
      ? "Collapse"
      : "Expand";

    btn.addEventListener("click", function () {
      document.body.classList.toggle("mentions-fullwidth");
      btn.textContent = document.body.classList.contains("mentions-fullwidth")
        ? "Collapse"
        : "Expand";

      // Табулятору надо пересчитать размеры колонок
      setTimeout(function () {
        var tableEl = document.getElementById("mentions-table");
        if (tableEl && tableEl._tab) {
          tableEl._tab.redraw(true);
        }
      }, 50);
    });

    toolbar.appendChild(btn);
    wrap.insertBefore(toolbar, table);
  }

  function build() {
    var tableEl = document.getElementById("mentions-table");
    var dataEl = document.getElementById("mentions-data");

    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    ensureTabulatorThemeCss();
    injectLocalCssOnce();

    // Обернём таблицу в wrap, чтобы было куда вставить toolbar
    if (!document.getElementById("mentions-table-wrap")) {
      var wrap = document.createElement("div");
      wrap.id = "mentions-table-wrap";
      tableEl.parentNode.insertBefore(wrap, tableEl);
      wrap.appendChild(tableEl);
    }

    mountToolbarOnce();

    var raw = (dataEl.textContent || "").trim();
    var data = [];
    try {
      data = JSON.parse(raw || "[]");
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      return;
    }
    if (!Array.isArray(data)) data = [];

    // Turbo/повторная инициализация
    if (tableEl._tab) {
      tableEl._tab.destroy();
      tableEl._tab = null;
    }

    tableEl._tab = new Tabulator(tableEl, {
      data: data,
      layout: "fitColumns",
      placeholder: "No mentions yet.",

      // ✅ по умолчанию: новые -> старые
      initialSort: [{ column: "date", dir: "desc" }],

      columns: [
        { title: "Name", field: "name", sorter: "string", widthGrow: 2, minWidth: 150 },

        // уже
        { title: "House", field: "house", sorter: "string", width: 85 },

        { title: "Party", field: "party", sorter: "string", width: 105 },

        // ✅ Action теперь можно сужать: minWidth убран
        { title: "Action", field: "action_type", sorter: "string", width: 140 },

        {
          title: "Date",
          field: "date",
          sorter: "string", // ISO YYYY-MM-DD сортируется корректно
          headerSortStartingDir: "desc",
          width: 115,
        },

        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          widthGrow: 10,
          minWidth: 420,
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

    // если после отрисовки надо поджать/пересчитать
    setTimeout(function () {
      if (tableEl._tab) tableEl._tab.redraw(true);
    }, 50);
  }

  function init() {
    setTimeout(build, 0);
    setTimeout(build, 150);

    // ✅ реагируем на переключение темы (Chirpy)
    // следим за атрибутом data-mode у <html>
    if (!window.__mentionsThemeObserver) {
      window.__mentionsThemeObserver = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].type === "attributes" && mutations[i].attributeName === "data-mode") {
            ensureTabulatorThemeCss();
            var tableEl = document.getElementById("mentions-table");
            if (tableEl && tableEl._tab) tableEl._tab.redraw(true);
          }
        }
      });

      window.__mentionsThemeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-mode"],
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
