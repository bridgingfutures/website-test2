---
title: Mentions
icon: fas fa-at
order: 2
permalink: /mentions/
layout: page
render_with_liquid: true
---

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator_midnight.min.css">

<style>
  /* чуть ближе к Chirpy */
  #mentions-table .tabulator { font-size: 0.95rem; border-radius: 10px; overflow: hidden; }
  #mentions-table a { text-decoration: underline; }
</style>

<div id="mentions-table"></div>

<script>
  window.MENTIONS_DATA = {{ site.data.mentions_table | jsonify }};
  console.log("Mentions rows:", Array.isArray(window.MENTIONS_DATA) ? window.MENTIONS_DATA.length : window.MENTIONS_DATA);
</script>

<script src="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/js/tabulator.min.js"></script>

<script>
  function initMentionsTable() {
    // на случай повторного вызова (Chirpy иногда делает soft-nav)
    if (window.__mentionsTableInited) return;
    window.__mentionsTableInited = true;

    const data = Array.isArray(window.MENTIONS_DATA) ? window.MENTIONS_DATA : [];

    const table = new Tabulator("#mentions-table", {
      data,
      layout: "fitColumns",

      // ВАЖНО: без height и без pagination → таблица растёт вниз и показывает всё
      // height: "70vh",      // НЕ НУЖНО
      // pagination: true,    // НЕ НУЖНО

      initialSort: [{ column: "date", dir: "desc" }],

      columns: [
        { title: "Name", field: "name", widthGrow: 2, sorter: "string" },
        { title: "House", field: "house", width: 120, sorter: "string" },
        { title: "Party", field: "party", widthGrow: 1, sorter: "string" },
        { title: "Action", field: "action_type", widthGrow: 1, sorter: "string" },
        { title: "Date", field: "date", width: 120, sorter: "date" },
        {
          title: "Tags",
          field: "tags",
          widthGrow: 2,
          sorter: (a, b) => (a || []).join(", ").localeCompare((b || []).join(", ")),
          formatter: (cell) => (cell.getValue() || []).join(", "),
        },
        { title: "Summary", field: "summary", widthGrow: 4, sorter: "string" },
        {
          title: "Link",
          field: "link",
          width: 90,
          hozAlign: "center",
          sorter: false, // сортировка по ссылке обычно не нужна
          formatter: (cell) => {
            const url = cell.getValue();
            return url ? `<a href="${url}" target="_blank" rel="noopener">open</a>` : "";
          },
        },
      ],
    });

    console.log("Tabulator rendered rows:", table.getDataCount());
  }

  // Инициализация после полной загрузки страницы
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMentionsTable);
  } else {
    initMentionsTable();
  }
</script>
