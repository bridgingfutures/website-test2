(function () {
  function build() {
    const tableEl = document.getElementById("mentions-table");
    const dataEl = document.getElementById("mentions-data");

    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    const raw = (dataEl.textContent || "").trim();

    let data = [];
    try {
      data = JSON.parse(raw || "[]");
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      return;
    }

    // На случай повторной инициализации (Chirpy/Turbo)
    if (tableEl._tab) {
      tableEl._tab.destroy();
      tableEl._tab = null;
    }

    // CSS только для этой таблицы: убираем "..." и разрешаем перенос строк
    // (Tabulator иногда ставит nowrap/ellipsis)
    if (!document.getElementById("mentions-table-css")) {
      const style = document.createElement("style");
      style.id = "mentions-table-css";
      style.textContent = `
        #mentions-table .tabulator-cell {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          line-height: 1.35;
          padding-top: 10px;
          padding-bottom: 10px;
        }
        #mentions-table .tabulator-row {
          height: auto !important;
        }
        #mentions-table .quote-cell {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        #mentions-table .quote-text {
          flex: 1 1 auto;
          min-width: 0;
        }
        #mentions-table .quote-link {
          flex: 0 0 auto;
          opacity: 0.75;
          text-decoration: none;
        }
        #mentions-table .quote-link:hover {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }

    tableEl._tab = new Tabulator(tableEl, {
      data: Array.isArray(data) ? data : [],
      layout: "fitColumns",
      initialSort: [{ column: "date", dir: "desc" }],

      // чтобы строки автоматически подстраивались под высоту текста
      responsiveLayout: false,

      columns: [
        { title: "Name", field: "name", sorter: "string", widthGrow: 2 },
        { title: "House", field: "house", sorter: "string", width: 120 },
        { title: "Party", field: "party", sorter: "string", widthGrow: 1 },
        { title: "Action", field: "action_type", sorter: "string", widthGrow: 1 },

        {
          title: "Date",
          field: "date",
          sorter: "string", // ISO YYYY-MM-DD сортируется правильно
          headerSortStartingDir: "desc",
          width: 120,
        },

        // ✅ Quote вместо Summary
        // ✅ ссылка стрелочкой в конце, берётся из поля link
        {
          title: "Quote",
          field: "summary",
          sorter: "string",
          widthGrow: 6,
          formatter: (cell) => {
            const row = cell.getRow().getData() || {};
