(function () {
  function init() {
    const tableEl = document.getElementById("mentions-table");
    const dataEl = document.getElementById("mentions-data");
    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    const data = JSON.parse((dataEl.textContent || "[]").trim());

    new Tabulator(tableEl, {
      data,
      layout: "fitColumns",
      initialSort: [{ column: "date", dir: "desc" }],
      columns: [
        { title: "Name", field: "name", sorter: "string", widthGrow: 2 },
        { title: "House", field: "house", sorter: "string", width: 120 },
        { title: "Party", field: "party", sorter: "string", widthGrow: 1 },
        { title: "Action", field: "action_type", sorter: "string", widthGrow: 1 },
        { title: "Date", field: "date", sorter: "date", width: 120 },
        {
          title: "Tags",
          field: "tags",
          widthGrow: 2,
          formatter: (cell) => (cell.getValue() || []).join(", "),
          sorter: (a, b) => (a || []).join(", ").localeCompare((b || []).join(", ")),
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
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
