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
