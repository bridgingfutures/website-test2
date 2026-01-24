(function () {
  const TABLE_ID = "mentions-table";
  const DATA_ID = "mentions-data";

  // Tabulator themes we include via <link> tags in the page:
  const THEME_DARK = "tabulator_midnight";
  const THEME_LIGHT = "tabulator_simple"; // you will include simple theme css too

  function getChirpyMode() {
    // Chirpy stores mode in localStorage("mode") = "dark" | "light"
    // Also sets <html data-mode="dark|light">
    const htmlMode = document.documentElement.getAttribute("data-mode");
    const lsMode = window.localStorage ? localStorage.getItem("mode") : null;
    return (htmlMode || lsMode || "dark").toLowerCase();
  }

  function applyThemeClass(tableEl) {
    const mode = getChirpyMode();
    tableEl.classList.remove(THEME_DARK, THEME_LIGHT);
    tableEl.classList.add(mode === "light" ? THEME_LIGHT : THEME_DARK);
  }

  function parseData() {
    const dataEl = document.getElementById(DATA_ID);
    if (!dataEl) return [];
    const raw = (dataEl.textContent || "").trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      return [];
    }
  }

  function buildTable() {
    const tableEl = document.getElementById(TABLE_ID);
    const dataEl = document.getElementById(DATA_ID);

    if (!tableEl || !dataEl) return;
    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    // Ensure correct theme class BEFORE init
    applyThemeClass(tableEl);

    const data = parseData();

    // Destroy previous instance (turbo/theme changes)
    if (tableEl._tab) {
      try {
        tableEl._tab.destroy();
      } catch (_) {}
      tableEl._tab = null;
      tableEl.innerHTML = "";
    }

    tableEl._tab = new Tabulator(tableEl, {
      data,
      layout: "fitColumns",
      responsiveLayout: false,
      height: "auto",
      // Default: newest -> oldest
      initialSort: [{ column: "date", dir: "desc" }],

      columns: [
        { title: "Name", field: "name", sorter: "string", widthGrow: 2, minWidth: 140 },
        { title: "House", field: "house", sorter: "string", width: 90, minWidth: 70 },
        { title: "Party", field: "party", sorter: "string", width: 90, minWidth: 70 },

        // Make Action narrower and allow it to shrink:
        {
          title: "Action",
          field: "action_type",
          sorter: "string",
          width: 140,
          minWidth: 110,
          widthShrink: 2,
        },

        // ISO date sorts correctly as string; also show as-is
        { title: "Date", field: "date", sorter: "string", width: 110, minWidth: 95 },

        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          widthGrow: 6,
          minWidth: 320,
          formatter: (cell) => {
            const row = cell.getRow().getData();
            const text = row.quote || "";
            const url = row.link || "";

            // Icon: "Open source" using FontAwesome external-link icon
            const icon = url
              ? `<a class="mentions-open" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Open source">
                   <i class="fa-solid fa-arrow-up-right-from-square"></i>
                 </a>`
              : "";

            // No truncation here – let the cell wrap
            const safeText = String(text)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");

            return `<div class="mentions-quote">
                      <div class="mentions-quote-text">${safeText}</div>
                      ${icon}
                    </div>`;
          },
        },
      ],
    });

    // Force layout recalculation after fonts/theme applied
    requestAnimationFrame(() => {
      try {
        tableEl._tab.redraw(true);
      } catch (_) {}
    });
  }

  function safeRebuildSequence() {
    // Chirpy/Turbo + theme mode can settle after DOMContentLoaded
    // Do several attempts — cheap and reliable.
    buildTable();
    setTimeout(buildTable, 80);
    setTimeout(buildTable, 220);
    setTimeout(buildTable, 600);
  }

  function onThemeToggle() {
    const tableEl = document.getElementById(TABLE_ID);
    if (!tableEl || !tableEl._tab) {
      safeRebuildSequence();
      return;
    }

    applyThemeClass(tableEl);

    // Redraw after mode switch (CSS changes)
    setTimeout(() => {
      try {
        tableEl._tab.redraw(true);
      } catch (_) {
        safeRebuildSequence();
      }
    }, 50);
  }

  function init() {
    safeRebuildSequence();

    // Chirpy mode toggle button
    const toggle = document.getElementById("mode-toggle");
    if (toggle && !toggle._mentionsBound) {
      toggle._mentionsBound = true;
      toggle.addEventListener("click", () => {
        // Chirpy applies mode asynchronously, so wait a bit
        setTimeout(onThemeToggle, 60);
        setTimeout(onThemeToggle, 180);
      });
    }

    // Also observe html[data-mode] changes (covers other ways of switching)
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "attributes" && m.attributeName === "data-mode") {
          onThemeToggle();
        }
      }
    });
    mo.observe(document.documentElement, { attributes: true });
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
