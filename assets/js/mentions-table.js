(function () {
  "use strict";

  // ==========================================================
  // Theme sync (Chirpy <-> Tabulator)
  // ==========================================================
  function getChirpyMode() {
    const html = document.documentElement;

    // Chirpy normally sets data-mode="dark|light"
    const attr = html.getAttribute("data-mode");
    if (attr === "dark" || attr === "light") return attr;

    // fallbacks (in case Chirpy changes internals)
    if (html.classList.contains("dark")) return "dark";
    if (html.classList.contains("light")) return "light";

    // last fallback
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTabulatorTheme() {
    const lightCss = document.getElementById("tabulator-css-light");
    const darkCss = document.getElementById("tabulator-css-dark");
    if (!lightCss || !darkCss) return;

    const isDark = getChirpyMode() === "dark";

    // Enable exactly one stylesheet (property + attribute for max compatibility)
    lightCss.disabled = isDark;
    darkCss.disabled = !isDark;

    if (isDark) {
      lightCss.setAttribute("disabled", "");
      darkCss.removeAttribute("disabled");
    } else {
      darkCss.setAttribute("disabled", "");
      lightCss.removeAttribute("disabled");
    }
  }

  // ==========================================================
  // Helpers
  // ==========================================================
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function norm(str) {
    return String(str || "").trim().toLowerCase();
  }

  function uniqueSorted(values) {
    const set = new Set();
    for (const v of values) {
      const s = String(v || "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  function isDefaultExcludedAction(v) {
    const s = String(v || "").trim();
    // exclude "Letter", "Letter (...)" and "EDM" by default
    return /^letter\b/i.test(s) || /^edm\b/i.test(s);
  }

  // ==========================================================
  // Header popups
  // ==========================================================
  function makeNamePopup(state, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "bf-hpop";

    const title = document.createElement("div");
    title.className = "bf-title";
    title.textContent = "Name";

    const input = document.createElement("input");
    input.className = "bf-input";
    input.type = "text";
    input.placeholder = "Type a name…";
    input.value = state.nameQuery || "";

    input.addEventListener("input", () => {
      state.nameQuery = input.value || "";
      onChange();
    });

    const actions = document.createElement("div");
    actions.className = "bf-actions";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "bf-btn";
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", () => {
      state.nameQuery = "";
      input.value = "";
      onChange();
      input.focus();
    });

    actions.appendChild(clearBtn);

    wrap.appendChild(title);
    wrap.appendChild(input);
    wrap.appendChild(actions);

    // focus after render
    setTimeout(() => input.focus(), 0);

    return wrap;
  }

  function makeChecklistPopup(opts) {
    const { titleText, allValues, selectedSet, onApply } = opts;

    const wrap = document.createElement("div");
    wrap.className = "bf-hpop";

    const title = document.createElement("div");
    title.className = "bf-title";
    title.textContent = titleText;

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

    const checkboxes = [];

    for (const v of allValues) {
      const row = document.createElement("label");
      row.className = "bf-item";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = selectedSet.has(v);
      cb.addEventListener("change", () => {
        if (cb.checked) selectedSet.add(v);
        else selectedSet.delete(v);
        onApply();
      });

      const text = document.createElement("span");
      text.textContent = v;

      row.appendChild(cb);
      row.appendChild(text);
      list.appendChild(row);

      checkboxes.push({ v, cb });
    }

    btnAll.addEventListener("click", () => {
      selectedSet.clear();
      for (const v of allValues) selectedSet.add(v);
      for (const x of checkboxes) x.cb.checked = true;
      onApply();
    });

    btnNone.addEventListener("click", () => {
      selectedSet.clear();
      for (const x of checkboxes) x.cb.checked = false;
      onApply();
    });

    wrap.appendChild(title);
    wrap.appendChild(actions);
    wrap.appendChild(list);
    return wrap;
  }

  // ==========================================================
  // Build table
  // ==========================================================
  function build() {
    const tableEl = document.getElementById("mentions-table");
    const dataEl = document.getElementById("mentions-data");
    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    // Apply theme BEFORE first render
    applyTabulatorTheme();

    // Parse data
    const raw = (dataEl.textContent || "").trim();
    let data = [];
    try {
      data = JSON.parse(raw || "[]");
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      return;
    }
    if (!Array.isArray(data)) data = [];

    // Backward compat: if YAML had "summary", map it to "quote"
    for (const r of data) {
      if (r && typeof r === "object" && !("quote" in r) && "summary" in r) r.quote = r.summary;
    }

    // Filter values
    const houseValues = uniqueSorted(data.map((d) => d.house));
    const partyValues = uniqueSorted(data.map((d) => d.party));
    const actionValues = uniqueSorted(data.map((d) => d.action_type));

    // State (Sets are stable references; we mutate them, don't reassign)
    const state = {
      nameQuery: "",
      house: new Set(houseValues),
      party: new Set(partyValues),
      action: new Set(actionValues.filter((v) => !isDefaultExcludedAction(v))),
    };

    // Row filter
    function rowFilter(rowData) {
      if (!rowData) return false;

      if (state.nameQuery && !norm(rowData.name).includes(norm(state.nameQuery))) return false;

      if (houseValues.length && !state.house.has(String(rowData.house || "").trim())) return false;
      if (partyValues.length && !state.party.has(String(rowData.party || "").trim())) return false;
      if (actionValues.length && !state.action.has(String(rowData.action_type || "").trim())) return false;

      return true;
    }

    // Apply filter + update header indicators
    function applyFilters() {
      if (!tableEl._tab) return;
      tableEl._tab.setFilter(rowFilter);
      updateFilteredIndicators();
    }

    function updateFilteredIndicators() {
      if (!tableEl._tab) return;

      const mark = (field, isFiltered) => {
        const col = tableEl._tab.getColumn(field);
        if (!col) return;
        const el = col.getElement && col.getElement();
        if (!el) return;
        el.classList.toggle("bf-filtered", !!isFiltered);
      };

      mark("house", state.house.size !== houseValues.length);
      mark("party", state.party.size !== partyValues.length);
      mark("action_type", state.action.size !== actionValues.length);
      mark("name", !!state.nameQuery);
    }

    // Destroy old table if any
    if (tableEl._tab) {
      tableEl._tab.destroy();
      tableEl._tab = null;
    }

    tableEl._tab = new Tabulator(tableEl, {
      data,
      layout: "fitColumns",
      initialSort: [{ column: "date", dir: "desc" }],

      columns: [
        {
          title: "Name",
          field: "name",
          sorter: "string",
          width: 100,
          minWidth: 100,
          headerPopup: () => makeNamePopup(state, applyFilters),
          headerPopupIcon: () => "<i class='fas fa-search'></i>",
        },
        {
          title: "House",
          field: "house",
          sorter: "string",
          width: 70,
          minWidth: 70,
          headerPopup: () =>
            makeChecklistPopup({
              titleText: "House",
              allValues: houseValues,
              selectedSet: state.house,
              onApply: applyFilters,
            }),
          headerPopupIcon: () => "<i class='fas fa-filter'></i>",
        },
        {
          title: "Party",
          field: "party",
          sorter: "string",
          width: 85,
          minWidth: 85,
          headerPopup: () =>
            makeChecklistPopup({
              titleText: "Party",
              allValues: partyValues,
              selectedSet: state.party,
              onApply: applyFilters,
            }),
          headerPopupIcon: () => "<i class='fas fa-filter'></i>",
        },
        {
          title: "Action",
          field: "action_type",
          sorter: "string",
          width: 90,
          minWidth: 90,
          headerPopup: () =>
            makeChecklistPopup({
              titleText: "Action",
              allValues: actionValues,
              selectedSet: state.action,
              onApply: applyFilters,
            }),
          headerPopupIcon: () => "<i class='fas fa-filter'></i>",
        },
        {
          title: "Date",
          field: "date",
          sorter: "string",
          width: 75,
          minWidth: 75,
        },
        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          widthGrow: 5,
          minWidth: 260,
          widthShrink: 0,
          formatter: (cell) => {
            const row = cell.getRow().getData();
            const text = cell.getValue() || "";
            const url = row.link || "";

            const icon = url
              ? `<a class="mentions-open" href="${url}" target="_blank" rel="noopener" aria-label="Open source">
                   <i class="fas fa-up-right-from-square"></i>
                 </a>`
              : "";

            return `<div class="mentions-quote">
                      <span class="mentions-quote-text">${escapeHtml(text)}</span>
                      ${icon}
                    </div>`;
          },
        },
      ],
    });

    // Initial filter (hides Letter/EDM by default when present)
    applyFilters();

    // Chirpy may update data-mode slightly later; re-apply theme
    setTimeout(() => {
      applyTabulatorTheme();
      tableEl._tab && tableEl._tab.redraw(true);
    }, 0);
    setTimeout(() => {
      applyTabulatorTheme();
      tableEl._tab && tableEl._tab.redraw(true);
    }, 150);
  }

  // ==========================================================
  // Init + react to theme toggles (Chirpy)
  // ==========================================================
  function init() {
    build();

    // Watch for theme changes on <html>
    const mo = new MutationObserver(() => {
      applyTabulatorTheme();
      const tableEl = document.getElementById("mentions-table");
      if (tableEl && tableEl._tab) tableEl._tab.redraw(true);
    });

    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode", "class"],
    });

    // Extra safety: Chirpy's mode toggle button
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
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
