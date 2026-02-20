(function () {
  // -----------------------------
  // Theme sync (Chirpy <-> Tabulator)
  // -----------------------------
  function getChirpyMode() {
    const html = document.documentElement;

    // Chirpy stores current mode in the data attribute (theme.min.js)
    // possible values: "dark" / "light"
    const modeAttr = html.getAttribute("data-mode");
    if (modeAttr) return modeAttr;

    // fallback: check prefers-color-scheme
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTabulatorTheme() {
    const mode = getChirpyMode();
    const light = document.getElementById("tabulator-css-light");
    const dark = document.getElementById("tabulator-css-dark");

    if (!light || !dark) return;

    if (mode === "dark") {
      dark.removeAttribute("disabled");
      light.setAttribute("disabled", "");
    } else {
      light.removeAttribute("disabled");
      dark.setAttribute("disabled", "");
    }
  }

  // -----------------------------
  // Mentions table
  // -----------------------------
  function init() {
    const tableEl = document.getElementById("mentions-table");
    const dataEl = document.getElementById("mentions-data");
    if (!tableEl || !dataEl || !window.Tabulator) return;

    applyTabulatorTheme();

    // if table was already created (turbo/soft reload), destroy it
    if (tableEl._tab) {
      tableEl._tab.destroy();
      tableEl._tab = null;
    }

    /* =========================
       BF: header popup filters
       ========================= */

    const BF_FILTER_STATE = {
      name: "",
      house: null,        // null = no filter (all selected), array = selected values
      party: null,
      action_type: null,
    };

    function bfDisplayVal(v) {
      const s = (v ?? "").toString().trim();
      return s === "" ? "(blank)" : s;
    }

    function bfUniqSorted(arr) {
      return [...new Set(arr)].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    }

    function bfGetAllValues(table, field) {
      // "all" — чтобы список значений не зависел от текущей фильтрации
      const allData = table.getData("all");
      return bfUniqSorted(allData.map((r) => bfDisplayVal(r[field])));
    }

    function bfIsAnyFilterActive() {
      if ((BF_FILTER_STATE.name || "").trim()) return true;
      return ["house", "party", "action_type"].some((f) => Array.isArray(BF_FILTER_STATE[f]));
    }

    function bfRowMatches(data) {
      // Name: substring match
      const q = (BF_FILTER_STATE.name || "").trim().toLowerCase();
      if (q) {
        const nameVal = bfDisplayVal(data.name).toLowerCase();
        if (!nameVal.includes(q)) return false;
      }

      // Checklist fields
      for (const field of ["house", "party", "action_type"]) {
        const selected = BF_FILTER_STATE[field];
        if (Array.isArray(selected)) {
          const v = bfDisplayVal(data[field]);
          if (!selected.includes(v)) return false;
        }
      }

      return true;
    }

    function bfUpdateHeaderState(table) {
      const q = (BF_FILTER_STATE.name || "").trim();

      ["name", "house", "party", "action_type"].forEach((field) => {
        const col = table.getColumn(field);
        if (!col) return;

        const active = field === "name" ? !!q : Array.isArray(BF_FILTER_STATE[field]);
        col.getElement().classList.toggle("bf-filtered", active);
      });
    }

    function bfApplyFilters(table) {
      if (bfIsAnyFilterActive()) {
        table.setFilter(bfRowMatches);
      } else {
        table.clearFilter();
      }

      bfUpdateHeaderState(table);
    }

    // --------- Popups ---------

    function bfNamePopup(e, column, onRendered) {
      const table = column.getTable();

      const wrap = document.createElement("div");
      wrap.className = "bf-hpop";

      const title = document.createElement("div");
      title.className = "bf-title";
      title.textContent = "Search in Name";

      const input = document.createElement("input");
      input.className = "bf-input";
      input.type = "text";
      input.placeholder = "Type name or surname…";
      input.value = BF_FILTER_STATE.name || "";

      const actions = document.createElement("div");
      actions.className = "bf-actions";

      const btnClear = document.createElement("button");
      btnClear.type = "button";
      btnClear.className = "bf-btn";
      btnClear.textContent = "Clear";

      actions.appendChild(btnClear);

      input.addEventListener("input", () => {
        BF_FILTER_STATE.name = input.value;
        bfApplyFilters(table);
      });

      btnClear.addEventListener("click", () => {
        BF_FILTER_STATE.name = "";
        input.value = "";
        bfApplyFilters(table);
        input.focus();
      });

      wrap.appendChild(title);
      wrap.appendChild(input);
      wrap.appendChild(actions);

      onRendered(() => input.focus());
      return wrap;
    }

    function bfChecklistPopup(field, titleText) {
      return function (e, column, onRendered) {
        const table = column.getTable();
        const values = bfGetAllValues(table, field);

        // если фильтра нет — считаем, что выбраны все
        const selected = new Set(
          Array.isArray(BF_FILTER_STATE[field]) ? BF_FILTER_STATE[field] : values
        );

        const wrap = document.createElement("div");
        wrap.className = "bf-hpop";

        const title = document.createElement("div");
        title.className = "bf-title";
        title.textContent = titleText;

        const list = document.createElement("div");
        list.className = "bf-list";

        // "All" checkbox (still "pure checkboxes", no buttons/search)
        const allLabel = document.createElement("label");
        allLabel.className = "bf-item";

        const allCb = document.createElement("input");
        allCb.type = "checkbox";

        const allText = document.createElement("span");
        allText.textContent = "All";

        allLabel.appendChild(allCb);
        allLabel.appendChild(allText);
        list.appendChild(allLabel);

        function updateAllCheckbox() {
          const total = values.length;
          const count = selected.size;

          allCb.indeterminate = count > 0 && count < total;
          allCb.checked = count === total;
        }

        function commitAndApply() {
          // If all selected -> no filter (null); otherwise store array
          BF_FILTER_STATE[field] = selected.size === values.length ? null : Array.from(selected);
          bfApplyFilters(table);
          updateAllCheckbox();
        }

        allCb.addEventListener("change", () => {
          if (allCb.checked) {
            values.forEach((v) => selected.add(v));
          } else {
            selected.clear();
          }
          commitAndApply();
          renderItems(); // reflect state
        });

        function renderItems() {
          // remove old items except the "All" line
          [...list.querySelectorAll("label.bf-item")]
            .slice(1)
            .forEach((n) => n.remove());

          values.forEach((v) => {
            const label = document.createElement("label");
            label.className = "bf-item";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = selected.has(v);

            const text = document.createElement("span");
            text.textContent = v;

            cb.addEventListener("change", () => {
              if (cb.checked) selected.add(v);
              else selected.delete(v);
              commitAndApply();
            });

            label.appendChild(cb);
            label.appendChild(text);
            list.appendChild(label);
          });

          updateAllCheckbox();
        }

        wrap.appendChild(title);
        wrap.appendChild(list);

        renderItems();
        onRendered(() => {});

        return wrap;
      };
    }

    const data = JSON.parse(dataEl.textContent);

    tableEl._tab = new Tabulator(tableEl, {
      data,
      layout: "fitColumns",
      responsiveLayout: "collapse",
      pagination: "local",
      paginationSize: 25,
      paginationSizeSelector: [10, 25, 50, 100],

      initialSort: [{ column: "date", dir: "desc" }],

      columns: [
        {
          title: "Name",
          field: "name",
          sorter: "string",
          width: 100,
          minWidth: 100,
          headerPopup: bfNamePopup,
          headerPopupIcon: '<i class="fa-solid fa-magnifying-glass"></i>',
        },
        {
          title: "House",
          field: "house",
          sorter: "string",
          width: 70,
          minWidth: 70,
          headerPopup: bfChecklistPopup("house", "House"),
          headerPopupIcon: '<i class="fa-solid fa-filter"></i>',
        },
        {
          title: "Party",
          field: "party",
          sorter: "string",
          width: 85,
          minWidth: 85,
          headerPopup: bfChecklistPopup("party", "Party"),
          headerPopupIcon: '<i class="fa-solid fa-filter"></i>',
        },
        {
          title: "Action",
          field: "action_type",
          sorter: "string",
          width: 90,
          minWidth: 90,
          headerPopup: bfChecklistPopup("action_type", "Action"),
          headerPopupIcon: '<i class="fa-solid fa-filter"></i>',
        },

        // сортировка по ISO-дате будет работать корректно
        { title: "Date", field: "date", sorter: "string", width: 75, minWidth: 75 },

        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          widthGrow: 5,
          minWidth: 260,
          formatter: function (cell) {
            const row = cell.getRow().getData();
            const quote = escapeHtml(row.quote || "");
            const link = row.link ? `<a class="mentions-open" href="${escapeAttr(row.link)}" target="_blank" rel="noopener" aria-label="Open source"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : "";
            return `
              <div class="mentions-quote">
                <div class="mentions-quote-text">${quote}</div>
                ${link}
              </div>
            `;
          },
        },
      ],
    });

    // apply initial header state (no filters active)
    bfUpdateHeaderState(tableEl._tab);

    injectMentionsTableTweaks();
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  function escapeHtml(str) {
    return (str ?? "")
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/`/g, "&#096;");
  }

  // -----------------------------
  // Small CSS tweaks for Chirpy
  // -----------------------------
  function injectMentionsTableTweaks() {
    if (document.getElementById("mentions-table-tweaks")) return;

    const s = document.createElement("style");
    s.id = "mentions-table-tweaks";
    s.textContent = `
      #mentions-table .tabulator {
        border: none;
        background: transparent;
      }
      #mentions-table .tabulator-header {
        border-bottom: 1px solid rgba(127,127,127,.25);
      }
      #mentions-table .tabulator-row {
        height: auto !important;
      }
      #mentions-table .mentions-quote-text {
        display: inline-block;
        white-space: normal !important;
        overflow-wrap: anywhere;
      }
    `;
    document.head.appendChild(s);
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
