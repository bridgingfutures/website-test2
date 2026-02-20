(function () {
  "use strict";

  let table = null;
  let themeObserver = null;

  // ==========================================================
  // Theme sync (Chirpy <-> Tabulator)
  // ==========================================================
  function getChirpyMode() {
    const html = document.documentElement;

    const attr = html.getAttribute("data-mode");
    if (attr === "dark" || attr === "light") return attr;

    if (html.classList.contains("dark")) return "dark";
    if (html.classList.contains("light")) return "light";

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
    const s = String(v || "").trim().toLowerCase();
    // Disable ONLY exact "Letter" and exact "EDM"
    return s === "letter" || s === "edm";
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

    function render() {
      list.innerHTML = "";
      checkboxes.length = 0;

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
    }

    // ---- auto height: grow until 20 items, then scroll ----
    function adjustListHeight() {
      const LIMIT = 20;

      const needsScroll = allValues.length > LIMIT;

      // Toggle class (your CSS uses .bf-list.bf-scroll for overflow)
      list.classList.toggle("bf-scroll", needsScroll);

      // Also set inline styles as a safety net (in case CSS is cached / old)
      if (!needsScroll) {
        list.style.maxHeight = "none";
        list.style.overflowY = "visible";
        return;
      }

      // Measure row height from DOM (more reliable than guessing)
      const firstItem = list.querySelector(".bf-item");
      const rowH = firstItem ? firstItem.getBoundingClientRect().height : 32;

      const targetRows = Math.min(LIMIT, allValues.length);

      // a bit of padding so last row isn't clipped
      const desiredPx = Math.ceil(targetRows * rowH + 12);

      // Cap to 60% of viewport height so popup stays usable
      const capPx = Math.floor(window.innerHeight * 0.6);

      list.style.maxHeight = Math.min(desiredPx, capPx) + "px";
      list.style.overflowY = "auto";
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

    render();

    // Wait a tick so DOM is laid out, then measure
    requestAnimationFrame(adjustListHeight);

    return wrap;
  }

  // ==========================================================
  // Build table
  // ==========================================================
  function buildMentionsTable() {
    const tableEl = document.getElementById("mentions-table");
    const dataEl = document.getElementById("mentions-data");
    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    // Theme BEFORE first render
    applyTabulatorTheme();

    // Parse data
    let data = [];
    try {
      const raw = (dataEl.textContent || "").trim();
      data = JSON.parse(raw || "[]");
      if (!Array.isArray(data)) data = [];
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      return;
    }

    // Back-compat: summary -> quote
    for (const r of data) {
      if (r && typeof r === "object" && !("quote" in r) && "summary" in r) r.quote = r.summary;
    }

    // Domains for filters
    const houseValues = uniqueSorted(data.map((d) => d.house));
    const partyValues = uniqueSorted(data.map((d) => d.party));
    const actionValues = uniqueSorted(data.map((d) => d.action_type));

    // State
    const state = {
      nameQuery: "",
      house: new Set(houseValues),
      party: new Set(partyValues),
      action: new Set(actionValues.filter((v) => !isDefaultExcludedAction(v))), // Letter/EDM off by default
    };

    // Row filter
    function rowFilter(rowData) {
      if (!rowData) return false;

      if (state.nameQuery && !norm(rowData.name).includes(norm(state.nameQuery))) return false;

      if (houseValues.length && !state.house.has(String(rowData.house || "").trim())) return false;
      if (partyValues.length && !state.party.has(String(rowData.party || "").trim())) return false;
      if (actionValues.length && !state.action.has(String(rowData.action_type || "").trim()))
        return false;

      return true;
    }

    function updateFilteredIndicators() {
      if (!table) return;

      const mark = (field, isFiltered) => {
        const col = table.getColumn(field);
        if (!col) return;
        const el = col.getElement && col.getElement();
        if (!el) return;
        el.classList.toggle("bf-filtered", !!isFiltered);
      };

      mark("name", !!state.nameQuery);
      mark("house", state.house.size !== houseValues.length);
      mark("party", state.party.size !== partyValues.length);
      mark("action_type", state.action.size !== actionValues.length);
    }

    function applyFilters() {
      if (!table) return;
      table.setFilter(rowFilter);
      updateFilteredIndicators();
    }

    // Kill previous table / observer if any
    if (table) {
      try {
        table.destroy();
      } catch (_) {}
      table = null;
    }
    if (themeObserver) {
      try {
        themeObserver.disconnect();
      } catch (_) {}
      themeObserver = null;
    }

    // Quote formatter (text + open icon)
    function quoteFormatter(cell) {
      const row = cell.getRow().getData();
      const text = escapeHtml(cell.getValue() || "");
      const url = row.link ? String(row.link) : "";
      const icon = url
        ? `<a class="mentions-open" href="${escapeHtml(url)}" target="_blank" rel="noopener" aria-label="Open source">
             <i class="fas fa-up-right-from-square"></i>
           </a>`
        : "";

      return `<div class="mentions-quote">
                <span class="mentions-quote-text">${text}</span>
                ${icon}
              </div>`;
    }

    // Build Tabulator
    table = new Tabulator(tableEl, {
      data,
      layout: "fitColumns",
      placeholder: "No matching entries",
      initialSort: [{ column: "date", dir: "desc" }],

      responsiveLayout: false,
      movableColumns: false,

      columns: [
        {
          title: "Name",
          field: "name",
          sorter: "string",
          width: 105,
          minWidth: 105,
          widthGrow: 0,
          widthShrink: 0,
          headerPopup: () => makeNamePopup(state, applyFilters),
          headerPopupIcon: () => "<i class='fas fa-magnifying-glass'></i>",
        },
        {
          title: "House",
          field: "house",
          sorter: "string",
          width: 110,
          minWidth: 110,
          widthGrow: 0,
          widthShrink: 0,
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
          width: 105,
          minWidth: 105,
          widthGrow: 0,
          widthShrink: 0,
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
          width: 110,
          minWidth: 110,
          widthGrow: 0,
          widthShrink: 0,
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
          sorter: "string", // ISO yyyy-mm-dd sorts fine as string
          width: 75,
          minWidth: 75,
          widthGrow: 0,
          widthShrink: 0,
        },
        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          minWidth: 340,
          widthGrow: 10, // take all remaining space
          widthShrink: 1,
          formatter: quoteFormatter,
          headerSort: false,
        },
      ],
    });

    // Initial filter: hides Letter/EDM by default when present
    applyFilters();

    // Re-apply theme (Chirpy may update mode after render)
    setTimeout(() => {
      applyTabulatorTheme();
      table && table.redraw(true);
    }, 0);
    setTimeout(() => {
      applyTabulatorTheme();
      table && table.redraw(true);
    }, 150);

    // Watch theme changes on <html>
    themeObserver = new MutationObserver(() => {
      applyTabulatorTheme();
      table && table.redraw(true);
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode", "class"],
    });

    // Extra safety: Chirpy mode button
    const modeBtn = document.getElementById("mode-toggle");
    if (modeBtn) {
      modeBtn.addEventListener("click", () => {
        setTimeout(() => {
          applyTabulatorTheme();
          table && table.redraw(true);
        }, 50);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", buildMentionsTable);
  document.addEventListener("turbo:load", buildMentionsTable);
})();
