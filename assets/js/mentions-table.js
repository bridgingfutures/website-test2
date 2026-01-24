(function () {
  var TAB_VER = "6.2.5";

  var CSS_DARK_ID = "tabulator-theme-dark";
  var CSS_LIGHT_ID = "tabulator-theme-light";

  var CSS_DARK =
    "https://cdn.jsdelivr.net/npm/tabulator-tables@" +
    TAB_VER +
    "/dist/css/tabulator_midnight.min.css";
  var CSS_LIGHT =
    "https://cdn.jsdelivr.net/npm/tabulator-tables@" +
    TAB_VER +
    "/dist/css/tabulator_simple.min.css";

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isDarkMode() {
    var html = document.documentElement;
    var body = document.body;

    var mode = html.getAttribute("data-mode");
    if (mode === "dark") return true;
    if (mode === "light") return false;

    var htmlClass = (html.className || "").toLowerCase();
    var bodyClass = (body && body.className ? body.className : "").toLowerCase();
    if (htmlClass.includes("dark") || htmlClass.includes("dark-mode")) return true;
    if (bodyClass.includes("dark") || bodyClass.includes("dark-mode")) return true;

    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  // Create <link> elements for BOTH themes once, so first toggle won't "break"
  function ensureThemeCssLinks() {
    var darkLink = document.getElementById(CSS_DARK_ID);
    var lightLink = document.getElementById(CSS_LIGHT_ID);

    if (!darkLink) {
      darkLink = document.createElement("link");
      darkLink.id = CSS_DARK_ID;
      darkLink.rel = "stylesheet";
      darkLink.href = CSS_DARK;
      darkLink.media = "all";
      document.head.appendChild(darkLink);
    }

    if (!lightLink) {
      lightLink = document.createElement("link");
      lightLink.id = CSS_LIGHT_ID;
      lightLink.rel = "stylesheet";
      lightLink.href = CSS_LIGHT;
      lightLink.media = "all";
      document.head.appendChild(lightLink);
    }

    return { darkLink: darkLink, lightLink: lightLink };
  }

  function applyThemeCss() {
    var links = ensureThemeCssLinks();
    var dark = isDarkMode();

    // enable/disable (both are already loaded)
    links.darkLink.disabled = !dark;
    links.lightLink.disabled = dark;
  }

  function whenCssLoaded(linkEl) {
    return new Promise(function (resolve) {
      if (!linkEl) return resolve();
      // If already loaded (cached), this usually resolves quickly
      var done = false;

      function finish() {
        if (done) return;
        done = true;
        resolve();
      }

      // Some browsers don't reliably fire onload for cached CSS.
      linkEl.addEventListener("load", finish, { once: true });
      linkEl.addEventListener("error", finish, { once: true });

      // Fallback: poll a few times
      var tries = 0;
      var timer = setInterval(function () {
        tries += 1;
        if (tries > 20) {
          clearInterval(timer);
          finish();
          return;
        }
        try {
          // Accessing sheet/cssRules can throw until loaded
          if (linkEl.sheet) {
            clearInterval(timer);
            finish();
          }
        } catch (e) {
          // keep trying
        }
      }, 50);

      // absolute fallback
      setTimeout(function () {
        clearInterval(timer);
        finish();
      }, 1500);
    });
  }

  function injectCssOnce() {
    if (document.getElementById("mentions-table-css")) return;

    var css =
      /* Cells wrap & rows auto-height */
      "#mentions-table .tabulator-cell{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.35;padding-top:10px;padding-bottom:10px;}\n" +
      "#mentions-table .tabulator-row{height:auto!important;}\n" +
      "#mentions-table .tabulator-tableholder{overflow-x:hidden!important;}\n" +

      /* Quote cell: text + icon */
      "#mentions-table .mention-quote{display:flex;gap:10px;align-items:flex-start;}\n" +
      "#mentions-table .mention-quote-text{flex:1 1 auto;min-width:0;}\n" +
      "#mentions-table .mention-quote-link{flex:0 0 auto;opacity:.75;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;}\n" +
      "#mentions-table .mention-quote-link:hover{opacity:1;}\n" +

      /* Make the icon look like Chirpy buttons (subtle) */
      "html[data-mode='dark'] #mentions-table .mention-quote-link{background:rgba(255,255,255,.06);}\n" +
      "html[data-mode='light'] #mentions-table .mention-quote-link{background:rgba(0,0,0,.05);}\n" +

      /* Responsive collapse area - style it like Chirpy */
      "#mentions-table .tabulator-responsive-collapse{padding:12px 12px 14px!important;}\n" +
      "#mentions-table .mention-collapse-card{border-radius:12px;padding:12px 12px 10px;}\n" +
      "html[data-mode='dark'] #mentions-table .mention-collapse-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);}\n" +
      "html[data-mode='light'] #mentions-table .mention-collapse-card{background:rgba(0,0,0,.03);border:1px solid rgba(0,0,0,.08);}\n" +
      "#mentions-table .mention-collapse-row{display:flex;gap:10px;margin:6px 0;}\n" +
      "#mentions-table .mention-collapse-key{flex:0 0 90px;opacity:.75;font-size:.85rem;}\n" +
      "#mentions-table .mention-collapse-val{flex:1 1 auto;min-width:0;}\n" +
      "#mentions-table .mention-collapse-val a{text-decoration:none;}\n";

    var style = document.createElement("style");
    style.id = "mentions-table-css";
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function build() {
    var tableEl = document.getElementById("mentions-table");
    var dataEl = document.getElementById("mentions-data");
    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    injectCssOnce();
    applyThemeCss();

    var raw = (dataEl.textContent || "").trim();
    var data;
    try {
      data = JSON.parse(raw || "[]");
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      return;
    }
    if (!Array.isArray(data)) data = [];

    if (tableEl._tab) {
      tableEl._tab.destroy();
      tableEl._tab = null;
    }

    tableEl._tab = new Tabulator(tableEl, {
      data: data,
      layout: "fitColumns",
      placeholder: "No mentions yet.",

      // default: newest -> oldest
      initialSort: [{ column: "date", dir: "desc" }],

      // avoid horizontal scroll
      responsiveLayout: "collapse",
      responsiveLayoutCollapseStartOpen: false,

      // Pretty collapse formatter
      responsiveLayoutCollapseFormatter: function (data) {
        // `data` = array of {title, value} for hidden columns
        var rowsHtml = data
          .map(function (item) {
            var key = escapeHtml(item.title);
            var val =
              item.value == null || item.value === ""
                ? "—"
                : String(item.value);

            return (
              '<div class="mention-collapse-row">' +
              '<div class="mention-collapse-key">' +
              key +
              "</div>" +
              '<div class="mention-collapse-val">' +
              val +
              "</div>" +
              "</div>"
            );
          })
          .join("");

        return '<div class="mention-collapse-card">' + rowsHtml + "</div>";
      },

      columns: [
        {
          title: "Name",
          field: "name",
          sorter: "string",
          widthGrow: 2,
          minWidth: 140,
          responsive: 0,
        },
        {
          title: "House",
          field: "house",
          sorter: "string",
          width: 78,
          minWidth: 70,
          responsive: 4,
        },
        {
          title: "Party",
          field: "party",
          sorter: "string",
          width: 95,
          minWidth: 80,
          responsive: 3,
        },
        {
          title: "Action",
          field: "action_type",
          sorter: "string",
          width: 120,
          minWidth: 90,
          responsive: 2,
        },
        {
          title: "Date",
          field: "date",
          sorter: "string", // ISO YYYY-MM-DD sorts correctly
          headerSortStartingDir: "desc",
          width: 110,
          minWidth: 105,
          responsive: 1,
        },
        {
          title: "Quote",
          field: "quote",
          sorter: "string",
          widthGrow: 10,
          minWidth: 260,
          responsive: 0,
          formatter: function (cell) {
            var row = cell.getRow().getData() || {};
            var quote = escapeHtml(cell.getValue() || "");
            var url = row.link;

            var iconHtml = "";
            if (url) {
              // FontAwesome icon (already loaded by Chirpy)
              iconHtml =
                '<a class="mention-quote-link" href="' +
                escapeHtml(url) +
                '" target="_blank" rel="noopener" aria-label="Open source" title="Open source">' +
                '<i class="fa-solid fa-arrow-up-right-from-square"></i>' +
                "</a>";
            }

            return (
              '<div class="mention-quote">' +
              '<div class="mention-quote-text">' +
              quote +
              "</div>" +
              iconHtml +
              "</div>"
            );
          },
        },
      ],
    });

    // redraw after layout settles (prevents "one-column" glitch)
    setTimeout(function () {
      if (tableEl._tab) tableEl._tab.redraw(true);
    }, 80);
    setTimeout(function () {
      if (tableEl._tab) tableEl._tab.redraw(true);
    }, 250);
  }

  function applyThemeAndRedraw() {
    applyThemeCss();
    var tableEl = document.getElementById("mentions-table");
    if (tableEl && tableEl._tab) {
      // multiple redraws to survive CSS timing
      setTimeout(function () {
        tableEl._tab.redraw(true);
      }, 50);
      setTimeout(function () {
        tableEl._tab.redraw(true);
      }, 180);
      setTimeout(function () {
        tableEl._tab.redraw(true);
      }, 350);
    }
  }

  function hookThemeChanges() {
    if (window.__mentionsThemeHooked) return;
    window.__mentionsThemeHooked = true;

    // Watch html/body attributes so custom theme toggles are caught
    var obs = new MutationObserver(function () {
      applyThemeAndRedraw();
    });
    obs.observe(document.documentElement, { attributes: true });
    if (document.body) obs.observe(document.body, { attributes: true });

    // Mode toggle button
    document.addEventListener("click", function (e) {
      var t = e.target;
      var btn = t && t.closest ? t.closest("#mode-toggle") : null;
      if (btn) applyThemeAndRedraw();
    });

    // prefers-color-scheme changes
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq && mq.addEventListener) mq.addEventListener("change", applyThemeAndRedraw);
    }
  }

  function init() {
    hookThemeChanges();

    // Preload both CSS before first build (reduces first-toggle glitch)
    var links = ensureThemeCssLinks();
    Promise.all([whenCssLoaded(links.darkLink), whenCssLoaded(links.lightLink)])
      .then(function () {
        // After both are ready, apply correct one and build
        applyThemeCss();
        setTimeout(build, 0);
        setTimeout(build, 120);
      })
      .catch(function () {
        // even if something fails, try to build
        setTimeout(build, 0);
        setTimeout(build, 120);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
