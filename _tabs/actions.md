---
title: "UK Parliament: Ukraine Schemes — actions"
layout: page
---

<!-- Tabulator CSS -->
<link href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator.min.css" rel="stylesheet">

<div class="d-flex flex-wrap gap-2 mb-3">
  <input id="search" class="form-control" style="max-width:420px" placeholder="Search (name, summary, tags)…">
  <select id="house" class="form-select" style="max-width:220px">
    <option value="">House: All</option>
    <option value="Commons">Commons</option>
    <option value="Lords">Lords</option>
  </select>
  <select id="party" class="form-select" style="max-width:220px">
    <option value="">Party: All</option>
    <option value="Labour">Labour</option>
    <option value="Conservative">Conservative</option>
    <option value="Liberal Democrat">Liberal Democrat</option>
    <option value="SNP">SNP</option>
    <option value="Crossbench">Crossbench</option>
  </select>
</div>

<div id="actions-table"></div>

<!-- 1) данные из Jekyll -->
<script>
  window.ACTIONS_DATA = {{ site.data.ukraine_actions | jsonify }};
</script>

<!-- Tabulator JS -->
<script src="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/js/tabulator.min.js"></script>

<script>
  const table = new Tabulator("#actions-table", {
    data: window.ACTIONS_DATA,
    layout: "fitColumns",
    height: "70vh",
    pagination: true,
    paginationSize: 25,
    initialSort: [{column:"date", dir:"desc"}],
    columns: [
      {title:"Name", field:"name", headerFilter:"input", widthGrow:2},
      {title:"House", field:"house", headerFilter:true, width:120},
      {title:"Party", field:"party", headerFilter:"input", widthGrow:1},
      {title:"Action", field:"action_type", headerFilter:"input", widthGrow:1},
      {title:"Date", field:"date", sorter:"date", width:120},
      {title:"Tags", field:"tags", formatter:(c)=> (c.getValue()||[]).join(", "), headerFilter:"input", widthGrow:2},
      {title:"Summary", field:"summary", headerFilter:"input", widthGrow:4},
      {title:"Link", field:"link", formatter:(cell)=>{
        const url = cell.getValue();
        return url ? `<a href="${url}" target="_blank" rel="noopener">open</a>` : "";
      }, width:90, hozAlign:"center"},
      {title:"BF status", field:"bf_status", headerFilter:"input", widthGrow:1},
      {title:"Updated", field:"last_updated", sorter:"date", width:120},
    ],
  });

  // Внешние фильтры (по select)
  const houseSel = document.getElementById("house");
  const partySel = document.getElementById("party");
  const searchInp = document.getElementById("search");

  function applyFilters(){
    table.clearFilter(true);

    const house = houseSel.value;
    const party = partySel.value;
    const q = (searchInp.value || "").toLowerCase().trim();

    if (house) table.addFilter("house", "=", house);
    if (party) table.addFilter("party", "=", party);

    if (q){
      table.addFilter((data) => {
        const hay = [
          data.name, data.party, data.house, data.action_type,
          data.summary, (data.tags||[]).join(" ")
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
  }

  houseSel.addEventListener("change", applyFilters);
  partySel.addEventListener("change", applyFilters);
  searchInp.addEventListener("input", applyFilters);
</script>
