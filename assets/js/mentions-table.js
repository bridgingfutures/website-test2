(function () {
  function initMentionsTable() {
    const tableEl = document.getElementById("mentions-table");
    const dataEl = document.getElementById("mentions-data");
    if (!tableEl || !dataEl) return;

    let data = [];
    try {
      data = JSON.parse(dataEl.textContent || "[]");
    } catch (e) {
      console.error("Mentions: failed to parse JSON data", e);
      return;
    }

    // если уже инициализировали — пересоздадим (на случай повторных заходов)
    if (tableEl._mentionsTabulator) {
      tableEl._mentionsTabulator.destroy();
      tableEl._mentionsTabulator = null;
    }

    const table = new Tabulator(tableEl, {
      data,
      layout: "fitColumns",
      initialSort: [{ column: "date", dir: "desc" }],

      // ВАЖНО: без height и без pagination => одна длинная страница со всем списком
      // height: "70vh",
      // pagination: true,

      columns: [
        { title: "Name", field: "name", sorter: "string", widthGrow: 2 },
        { title: "House", field: "house", sorter: "string", width: 120 },
        { title: "Party", field: "party", sorter: "string", widthGrow: 1 },
        { title: "Action", field: "action_type", sorter: "string", widthGrow: 1 },
        { title: "Date", field: "date", sorter: "date", width: 120 },
        {
          title: "Tags",
          field: "tags",
          sorter: (a, b) => (a || []).join(", ").localeCompare((b || []).join(", ")),
          formatter: (cell) => (cell.getValue() || []).join(", "),
          widthGrow: 2,
        },
        { title: "Summary", field: "summary", sorter: "string", widthGrow: 4 },
        {
          title: "Link",
          field: "link",
          sorter: false,
          width: 90,
          hozAlign: "center",
          formatter: (cell) => {
            const url = cell.getValue();
            return url ? `<a href="${url}" target="_blank" rel="noopener">open</a>` : "";
          },
        },
      ],
    });

    tableEl._mentionsTabulator = table;
    console.log("Mentions: rendered rows =", table.getDataCount());
  }

  // Chirpy часто подгружает страницы без полного reload:
  // turbo:load сработает и при первом заходе, и при переходах
  document.addEventListener("turbo:load", initMentionsTable);

  // запасной вариант, если turbo отключён
  document.addEventListener("DOMContentLoaded", initMentionsTable);
})();
