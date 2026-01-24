(function () {
  function build() {
    const tableEl = document.getElementById("mentions-table");
    const dataEl = document.getElementById("mentions-data");

    console.log("[Mentions] tableEl:", !!tableEl, "dataEl:", !!dataEl);

    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    const raw = (dataEl.textContent || "").trim();
    console.log("[Mentions] raw length:", raw.length);

    let data = [];
    try {
      data = JSON.parse(raw || "[]");
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      console.log("[Mentions] raw preview:", raw.slice(0, 200));
      return;
    }

    console.log("[Mentions] rows:", Array.isArray(data) ? data.length : data);

    // на случай повторной инициализации
    if (tableEl._tab) {
      tableEl._tab.destroy();
      tableEl._tab = null;
    }

    tableEl._tab = new Tabulator(tableEl, {
      data: Array.isArray(data) ? data : [],
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

  function init() {
    // Chirpy/Turbo иногда дорисовывает контент после события
    setTimeout(build, 0);
    setTimeout(build, 150);
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
