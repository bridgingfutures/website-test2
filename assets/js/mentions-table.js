(function () {
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectCssOnce() {
    if (document.getElementById("mentions-table-css")) return;

    var css =
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

  function build() {
    var tableEl = document.getElementById("mentions-table");
    var dataEl = document.getElementById("mentions-data");

    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
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

    // Turbo/повторная инициализация
    if (tableEl._tab) {
      tableEl._tab.destroy();
      tableEl._tab = null;
    }

    injectCssOnce();

    tableEl._tab = new Tabulator(tableEl, {
      data: data,
      layout: "fitColumns",
      placeholder: "No mentions yet.",
      initialSort: [{ column: "date", dir: "desc" }],

      columns: [
        { title: "Name", field: "name", sorter: "string", widthGrow: 2, minWidth: 160 },

        // Уже
        { title: "House", field: "house", sorter: "string", width: 95 },

        { title: "Party", field: "party", sorter: "string", width: 110 },

        // Шире
        { title: "Action", field: "action_type", sorter: "string", width: 170, minWidth: 170 },

        {
          title: "Date",
          field: "date",
          sorter: "string", // ISO YYYY-MM-DD сортируется правильно
          headerSortStartingDir: "desc",
          width: 120,
        },

        // ✅ Quote берём из поля quote (не summary)
        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          widthGrow: 8,
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
  }

  function init() {
    setTimeout(build, 0);
    setTimeout(build, 150);
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
