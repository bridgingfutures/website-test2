(function () {
  // -----------------------------
  // Theme sync (Chirpy <-> Tabulator)
  // -----------------------------
  function getChirpyMode() {
    const html = document.documentElement;

    // Chirpy обычно ставит data-mode="dark|light"
    const attr = html.getAttribute("data-mode");
    if (attr === "dark" || attr === "light") return attr;

    // запасные варианты (на случай кастомов/будущих версий)
    if (html.classList.contains("dark")) return "dark";
    if (html.classList.contains("light")) return "light";

    // последний fallback
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTabulatorTheme() {
    const lightCss = document.getElementById("tabulator-css-light");
    const darkCss = document.getElementById("tabulator-css-dark");
    if (!lightCss || !darkCss) return;

    const mode = getChirpyMode();
    const isDark = mode === "dark";

    // Включаем ровно один файл, второй отключаем
    lightCss.disabled = isDark;
    darkCss.disabled = !isDark;
  }

  // -----------------------------
  // Table build
  // -----------------------------
  function build() {
    const tableEl = document.getElementById("mentions-table");
    const dataEl = document.getElementById("mentions-data");

    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    // применим тему ДО построения таблицы (важно для первого рендера)
    applyTabulatorTheme();

    const raw = (dataEl.textContent || "").trim();
    let data = [];
    try {
      data = JSON.parse(raw || "[]");
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      return;
    }

    // на случай повторной инициализации
    if (tableEl._tab) {
      tableEl._tab.destroy();
      tableEl._tab = null;
    }

/* =========================
   BF: header popup filters
   ========================= */

const BF_FILTER_STATE = {
  name: "",
  house: null,
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
  // "all" — чтобы значения не зависели от текущей фильтрации
  const data = table.getData("all"); // Tabulator поддерживает row ranges :contentReference[oaicite:1]{index=1}
  return bfUniqSorted(data.map((r) => bfDisplayVal(r[field])));
}

function bfApplyFilters(table) {
  const filters = [];

  const q = (BF_FILTER_STATE.name || "").trim().toLowerCase();
  if (q) {
    filters.push({
      field: "name",
      type: (filterVal, rowVal) =>
        bfDisplayVal(rowVal).toLowerCase().includes(filterVal),
      value: q,
    });
  }

  ["house", "party", "action_type"].forEach((field) => {
    const selected = BF_FILTER_STATE[field];
    if (Array.isArray(selected)) {
      filters.push({
        field,
        type: (filterVal, rowVal) => filterVal.includes(bfDisplayVal(rowVal)),
        value: selected,
      });
    }
  });

  if (filters.length) table.setFilter(filters);
  else table.clearFilter();

  // визуально отметим, где фильтр активен
  ["name", "house", "party", "action_type"].forEach((field) => {
    const col = table.getColumn(field);
    if (!col) return;

    const active =
      field === "name"
        ? !!q
        : Array.isArray(BF_FILTER_STATE[field]) &&
          BF_FILTER_STATE[field].length !== bfGetAllValues(table, field).length;

    col.getElement()?.classList.toggle("bf-filtered", active);
  });
}

function bfNamePopup(e, column, onRendered) {
  const table = column.getTable(); // Column component умеет получить table :contentReference[oaicite:2]{index=2}

  const wrap = document.createElement("div");
  wrap.className = "bf-hpop";

  const title = document.createElement("div");
  title.className = "bf-title";
  title.textContent = "Search in Name";

  const input = document.createElement("input");
  input.className = "bf-input";
  input.type = "text";
  input.placeholder = "Type name or surname...";
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

    const search = document.createElement("input");
    search.className = "bf-input";
    search.type = "text";
    search.placeholder = "Search values...";

    const actions = document.createElement("div");
    actions.className = "bf-actions";

    const btnAll = document.createElement("button");
    btnAll.type = "button";
    btnAll.className = "bf-btn";
    btnAll.textContent = "All";

    const btnNone = document.createElement("button");
    btnNone.type = "button";
    btnNone.className = "bf-btn";
    btnNone.textContent = "None";

    actions.appendChild(btnAll);
    actions.appendChild(btnNone);

    const list = document.createElement("div");
    list.className = "bf-list";

    function commitAndApply() {
      // Если выбраны ВСЕ — фильтр снимаем (null).
      // Иначе — сохраняем массив выбранных (включая пустой => таблица станет пустой)
      BF_FILTER_STATE[field] =
        selected.size === values.length ? null : Array.from(selected);

      bfApplyFilters(table);
    }

    function renderList() {
      const q = search.value.trim().toLowerCase();
      list.innerHTML = "";

      values.forEach((v) => {
        if (q && !v.toLowerCase().includes(q)) return;

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
    }

    search.addEventListener("input", renderList);

    btnAll.addEventListener("click", () => {
      values.forEach((v) => selected.add(v));
      renderList();
      commitAndApply();
    });

    btnNone.addEventListener("click", () => {
      selected.clear();
      renderList();
      commitAndApply();
    });

    wrap.appendChild(title);
    wrap.appendChild(search);
    wrap.appendChild(actions);
    wrap.appendChild(list);

    renderList();
    onRendered(() => search.focus());

    return wrap;
  };
}



    
    tableEl._tab = new Tabulator(tableEl, {
      data: Array.isArray(data) ? data : [],
      layout: "fitColumns",
      // по умолчанию: новые сверху
      initialSort: [{ column: "date", dir: "desc" }],

      columns: [
        { title: "Name", field: "name", sorter: "string", width: 100, minWidth: 100 },
        { title: "House", field: "house", sorter: "string", width: 70, minWidth: 70 },
        { title: "Party", field: "party", sorter: "string", width: 85, minWidth: 85 },
        { title: "Action", field: "action_type", sorter: "string", width: 90, minWidth: 90 },

        // сортировка по ISO-дате будет работать корректно
        { title: "Date", field: "date", sorter: "string", width: 75, minWidth: 75 },

        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          widthGrow: 5,
          minWidth: 260,     // ← поставь сколько хочешь (например 240–320)
          widthShrink: 0,    // ← не даём этой колонке “схлопываться” первой
          formatter: (cell) => {
            const row = cell.getRow().getData();
            const text = cell.getValue() || "";
            const url = row.link || "";

            // "Open source" иконка вместо ↗ (FontAwesome уже есть)
            const icon = url
              ? `<a class="ms-2 text-decoration-none" href="${url}" target="_blank" rel="noopener" aria-label="Open source">
                   <i class="fas fa-up-right-from-square"></i>
                 </a>`
              : "";

            // Не обрезаем текст многоточиями: пусть переносится
            // (Tabulator сам держит высоту строки; переносы разрешим CSS ниже)
            return `<div class="mentions-quote-cell d-flex align-items-start justify-content-between gap-2">
                      <span class="mentions-quote-text">${escapeHtml(text)}</span>
                      ${icon}
                    </div>`;
          },
        },
      ],
    });

    // после построения — ещё раз применим тему и принудительно перерисуем
    // (иначе при первой загрузке Chirpy может позже поменять data-mode)
    setTimeout(() => {
      applyTabulatorTheme();
      tableEl._tab && tableEl._tab.redraw(true);
    }, 0);
    setTimeout(() => {
      applyTabulatorTheme();
      tableEl._tab && tableEl._tab.redraw(true);
    }, 150);
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureQuoteField() {
    // если в YAML ещё осталось summary — пусть не ломается
    const dataEl = document.getElementById("mentions-data");
    if (!dataEl) return;
    try {
      const arr = JSON.parse((dataEl.textContent || "").trim() || "[]");
      if (!Array.isArray(arr)) return;
      let changed = false;
      for (const r of arr) {
        if (r && typeof r === "object") {
          if (!("quote" in r) && "summary" in r) {
            r.quote = r.summary;
            changed = true;
          }
        }
      }
      if (changed) dataEl.textContent = JSON.stringify(arr);
    } catch (_) {}
  }

  // -----------------------------
  // Init + react to theme toggles
  // -----------------------------
  function init() {
    ensureQuoteField();
    build();

    // Следим за сменой темы (Chirpy меняет data-mode/class на <html>)
    const mo = new MutationObserver(() => {
      applyTabulatorTheme();
      const tableEl = document.getElementById("mentions-table");
      if (tableEl && tableEl._tab) tableEl._tab.redraw(true);
    });

    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode", "class"],
    });

    // Подстрахуем переключение кнопкой режима
    const modeBtn = document.getElementById("mode-toggle");
    if (modeBtn) {
      modeBtn.addEventListener("click", () => {
        setTimeout(() => {
          applyTabulatorTheme();
          const tableEl = document.getElementById("mentions-table");
          if (tableEl && tableEl._tab) tableEl._tab.redraw(true);
        }, 50);
      });
    }

    // CSS фикс: разрешаем перенос текста в Quote, чтобы не было "двух слов"
    injectQuoteWrapCss();
  }

  function injectQuoteWrapCss() {
    if (document.getElementById("mentions-quote-wrap-css")) return;
    const s = document.createElement("style");
    s.id = "mentions-quote-wrap-css";
    s.textContent = `
      #mentions-table .tabulator-cell {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
        line-height: 1.35;
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
