---
title: Mentions
icon: fas fa-at
order: 2
permalink: /mentions/
layout: page
render_with_liquid: true
---

<!-- Tabulator: midnight theme (better for dark sites) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator_midnight.min.css">

<style>
  /* Make it blend with Chirpy typography a bit better */
  #mentions-table .tabulator { font-size: 0.95rem; }
  #mentions-table a { text-decoration: underline; }
</style>

<div class="d-flex flex-wrap gap-2 mb-3">
  <input id="mentions-search" class="form-control" style="max-width:420px"
         placeholder="Search (name, summary, tags)…">
  <select id="mentions-house" class="form-select" style="max-width:220px">
    <option value="">House: All</option>
    <option value="Commons">Commons</option>
    <option value="Lords">Lords</option>
  </select>
  <select id="mentions-party" class="form-select" style="max-width:240px">
    <option value="">Party: All</option>
    <option value="Labour">Labour</option>
    <option value="Conservative">Conservative</option>
    <option value="Liberal Democrat">Liberal Democrat</option>
    <option value="SNP">SNP</option>
    <option value="Crossbench">Crossbench</option>
  </select>
</div>

<div id="mentions-table"></div>

<script>
  // If this prints "null" — Jekyll не видит файл _data/mentions_table.yml
  window.MENTIONS_DATA = {{ site.data.mentions_table | jsonify }};
  console.log("Mentions rows:", Array.isArray(window.MENTIONS_DATA) ? window.MENTIONS_DATA.length : window.MENTIONS_DATA);
</script>

<script src="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/js/tabulator.min.js"></script>

<script>
  const table = new Tabulator("#mentions-table", {
    data: window.MENTIONS_DATA || [],
    layout: "fitColumns",
    height: "70vh",
    pagination: true,
    paginationSize: 25,
    initialSort: [{ column: "date", dir: "desc" }],
    columns: [
      { title: "Name", field: "name", headerFilter: "input", widthGrow: 2 },
      { title: "House", field: "house", headerFilter: true, width: 120 },
      { title: "Party", field: "party", headerFilter: "input", widthGrow: 1 },
      { title: "Action", field: "action_type", headerFilter: "input", widthGrow: 1 },
      { title: "Date", field: "date", sorter: "date", width: 120 },
      {
        title: "Tags",
        field: "tags",
        headerFilter: "input",
        widthGrow: 2,
        formatter: (cell) => (cell.getValue() || []).join(", "),
      },
      { title: "Summary", field: "summary", headerFilter: "input", widthGrow: 4 },
      {
        title: "Link",
        field: "link",
        width: 90,
        hozAlign: "center",
        formatter: (cell) => {
          const url = cell.getValue();
          return url ? `<a href="${url}" target="_blank" rel="noopener">open</a>` : "";
        },
      },
    ],
  });

  const elSearch = document.getElementById("mentions-search");
  const elHouse  = document.getElementById("mentions-house");
  const elParty  = document.getElementById("mentions-party");

  function applyFilters() {
    table.clearFilter(true);

    const house = elHouse.value;
    const party = elParty.value;
    const q = (elSearch.value || "").toLowerCase().trim();

    if (house) table.addFilter("house", "=", house);
    if (party) table.addFilter("party", "=", party);

    if (q) {
      table.addFilter((row) => {
        const hay = [
          row.name, row.house, row.party, row.action_type,
          row.summary, (row.tags || []).join(" ")
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
  }

  elHouse.addEventListener("change", applyFilters);
  elParty.addEventListener("change", applyFilters);
  elSearch.addEventListener("input", applyFilters);
</script>
