(function () {
  // Match your Tabulator version in URLs
  var TAB_VER = "6.2.5";

  // We load BOTH themes and toggle them
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

  function ensureThemeCss() {
    var darkLink = document.getElementById(CSS_DARK_ID);
    var lightLink = document.getElementById(CSS_LIGHT_ID);

    if (!darkLink) {
      darkLink = document.createElement("link");
      darkLink.id = CSS_DARK_ID;
      darkLink.rel = "stylesheet";
      darkLink.href = CSS_DARK;
      document.head.appendChild(darkLink);
    }

    if (!lightLink) {
      lightLink = document.createElement("link");
      lightLink.id = CSS_LIGHT_ID;
      lightLink.rel = "stylesheet";
      lightLink.href = CSS_LIGHT;
      document.head.appendChild(lightLink);
    }

    var dark = isDarkMode();
    darkLink.disabled = !dark;
    lightLink.disabled = dark;
  }

  function injectCssOnce() {
    if (document.getElementById("mentions-table-css")) return;

    // A few CSS vars so dark/light look coherent with Chirpy
    var css =
      ":root{--mtn-border:rgba(127,127,127,.25);--mtn-muted:rgba(127,127,127,.75);}\n" +
      "html[data-mode='light']{--mtn-border:rgba(0,0,0,.12);--mtn-muted:rgba(0,0,0,.55);}\n" +

      /* Make cells wrap & rows auto-height */
      "#mentions-table .tabulator-cell{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.35;padding-top:10px;padding-bottom:10px;}\n" +
      "#mentions-table .tabulator-row{height:auto!important;}\n" +

      /* No horizontal scroll inside Tabulator */
      "#mentions-table .tabulator-tableholder{overflow-x:hidden!important;}\n" +

      /* Quote cell layout + actions */
      "#mentions-table .mention-quote{display:flex;gap:10px;align-items:flex-start;}\n" +
      "#mentions-table .mention-quote-text{flex:1 1 auto;min-width:0;}\n" +
      "#mentions-table .mention-actions{display:flex;gap:8px;align-items:center;flex:0 0 auto;}\n" +
      "#mentions-table .mention-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;border:1px solid var(--mtn-border);background:transparent;color:inherit;opacity:.85;cursor:pointer;}\n" +
      "#mentions-table .mention-icon-btn:hover{opacity:1;}\n" +
      "#mentions-table .mention-icon-btn:active{transform:translateY(1px);}\n" +
      "#mentions-table .mention-icon-btn i{font-size:13px;}\n" +

      /* Collapsed row content styled like Chirpy cards */
      "#mentions-table .tabulator-responsive-collapse{padding:12px!important;}\n" +
      "#mentions-table .mtn-collapse{border:1px solid var(--mtn-border);border-radius:14px;padding:12px 12px 10px;background:rgba(127,127,127,.06);}\n" +
      "html[data-mode='light'] #mentions-table .mtn-collapse{background:rgba(0,0,0,.03);}\n" +
      "#mentions-table .mtn-collapse-grid{display:grid;grid-template-columns:140px 1fr;gap:8px 12px;align-items:start;}\n" +
      "#mentions-table .mtn-k{font-size:12px;letter-spacing:.02em;text-transform:uppercase;color:var(--mtn-muted);}\n" +
      "#mentions-table .mtn-v{font-size:14px;}\n" +
      "#mentions-table .mtn-v a{text-decoration:none;border-bottom:1px dashed var(--mtn-border);}\n" +
      "#mentions-table .mtn-v a:hover{border-bottom-style:solid;}\n" +
      "#mentions-table .mtn-quote{grid-column:1/-1;margin-top:8px;padding-top:10px;border-top:1px solid var(--mtn-border);}\n" +

      /* Tiny toast */
      ".mtn-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9999;pointer-events:none;opacity:0;transition:opacity .18s ease, transform .18s ease;}\n" +
      ".mtn-toast.show{opacity:1;transform:translateX(-50%) translateY(-4px);}\n" +
      ".mtn-toast .mtn-toast-inner{border:1px solid var(--mtn-border);border-radius:12px;padding:10px 12px;background:rgba(30,30,34,.92);color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:13px;}\n" +
      "html[data-mode='light'] .mtn-toast .mtn-toast-inner{background:rgba(255,255,255,.95);color:#111;}\n";

    var style = document.createElement("style");
    style.id = "mentions-table-css";
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function toast(msg) {
    var id = "mtn-toast";
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.className = "mtn-toast";
      el.innerHTML = '<div class="mtn-toast-inner"></div>';
      document.body.appendChild(el);
    }
    el.querySelector(".mtn-toast-inner").textContent = msg || "";
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.classList.remove("show");
    }, 1100);
  }

  function copyToClipboard(text) {
    var t = String(text || "").trim();
    if (!t) return Promise.resolve(false);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(t).then(
        function () {
          return true;
        },
        function () {
          return false;
        }
      );
    }

    // Fallback
    return new Promise(function (resolve) {
      try {
        var ta = document.createElement("textarea");
        ta.value = t;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        resolve(!!ok);
      } catch (e) {
        resolve(false);
      }
    });
  }

  function build() {
    var tableEl = document.getElementById("mentions-table");
    var dataEl = document.getElementById("mentions-data");
    if (!tableEl || !dataEl) return;

    if (typeof Tabulator !== "function") {
      console.error("[Mentions] Tabulator not loaded");
      return;
    }

    ensureThemeCss();
    injectCssOnce();

    var raw = (dataEl.textContent || "").trim();
    var data;
    try {
      data = JSON.parse(raw || "[]");
    } catch (e) {
      console.error("[Mentions] JSON parse failed", e);
      return;
    }
    if (!Array.isArray(data)) data = [];

    // Re-init safe for Turbo
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

      // IMPORTANT: removes horizontal scroll on narrow widths by collapsing columns
      responsiveLayout: "collapse",
      responsiveLayoutCollapseStartOpen: false,

      // Make collapse look like a Chirpy-ish card
      responsiveLayoutCollapseFormatter: function (data) {
        // "data" is an array of {title, value, field}
        // We'll build a compact card and treat "link" specially.
        var map = {};
        for (var i = 0; i < data.length; i++) {
          map[data[i].field] = { title: data[i].title, value: data[i].value };
        }

        var link = map.link && map.link.value ? String(map.link.value) : "";
        var name = map.name ? String(map.name.value || "") : "";
        var house = map.house ? String(map.house.value || "") : "";
        var party = map.party ? String(map.party.value || "") : "";
        var action = map.action_type ? String(map.action_type.value || "") : "";
        var date = map.date ? String(map.date.value || "") : "";
        var quote = map.quote ? String(map.quote.value || "") : "";

        var sourceHtml = link
          ? '<a href="' +
            escapeHtml(link) +
            '" target="_blank" rel="noopener">Open source</a>'
          : "<span style='color:var(--mtn-muted)'>—</span>";

        // Copy button in collapsed block
        var copyBtn =
          '<button class="mention-icon-btn" type="button" data-mtn-copy="1" title="Copy quote" aria-label="Copy quote">' +
          '<i class="fa-solid fa-copy"></i></button>';

        var openBtn = link
          ? '<a class="mention-icon-btn" href="' +
            escapeHtml(link) +
            '" target="_blank" rel="noopener" title="Open source" aria-label="Open source">' +
            '<i class="fa-solid fa-arrow-up-right-from-square"></i></a>'
          : "";

        // Quote section with actions on the right
        var quoteHtml =
          '<div class="mtn-quote">' +
          '<div class="mention-quote">' +
          '<div class="mention-quote-text">' +
          escapeHtml(quote) +
          "</div>" +
          '<div class="mention-actions">' +
          copyBtn +
          openBtn +
          "</div>" +
          "</div>" +
          "</div>";

        return (
          '<div class="mtn-collapse">' +
          '<div class="mtn-collapse-grid">' +
          '<div class="mtn-k">Name</div><div class="mtn-v">' +
          escapeHtml(name) +
          "</div>" +
          '<div class="mtn-k">House</div><div class="mtn-v">' +
          escapeHtml(house) +
          "</div>" +
          '<div class="mtn-k">Party</div><div class="mtn-v">' +
          escapeHtml(party) +
          "</div>" +
          '<div class="mtn-k">Action</div><div class="mtn-v">' +
          escapeHtml(action) +
          "</div>" +
          '<div class="mtn-k">Date</div><div class="mtn-v">' +
          escapeHtml(date) +
          "</div>" +
          '<div class="mtn-k">Source</div><div class="mtn-v">' +
          sourceHtml +
          "</div>" +
          quoteHtml +
          "</div>" +
          "</div>"
        );
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
          width: 80,
          responsive: 4,
        },
        {
          title: "Party",
          field: "party",
          sorter: "string",
          width: 95,
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
          sorter: "string", // ISO YYYY-MM-DD sorts correctly as string
          headerSortStartingDir: "desc",
          width: 110,
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
            var quote = String(cell.getValue() || "");
            var url = row.link ? String(row.link) : "";

            var openBtn = url
              ? '<a class="mention-icon-btn" href="' +
                escapeHtml(url) +
                '" target="_blank" rel="noopener" title="Open source" aria-label="Open source">' +
                '<i class="fa-solid fa-arrow-up-right-from-square"></i></a>'
              : "";

            var copyBtn =
              '<button class="mention-icon-btn" type="button" data-mtn-copy="1" title="Copy quote" aria-label="Copy quote">' +
              '<i class="fa-solid fa-copy"></i></button>';

            return (
              '<div class="mention-quote">' +
              '<div class="mention-quote-text">' +
              escapeHtml(quote) +
              "</div>" +
              '<div class="mention-actions">' +
              copyBtn +
              openBtn +
              "</div>" +
              "</div>"
            );
          },
        },

        // Hidden fields for collapse formatter (still available in row data)
        { title: "Source", field: "link", visible: false },
      ],
    });

    // Event delegation for copy buttons (works for normal + collapsed)
    tableEl.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("[data-mtn-copy]") : null;
      if (!btn) return;

      var cellEl = btn.closest(".tabulator-cell");
      var quote = "";

      // If click happened inside a regular cell, we can read row data from Tabulator
      try {
        var rowEl = btn.closest(".tabulator-row");
        if (rowEl && tableEl._tab) {
          var row = tableEl._tab.getRow(rowEl);
          if (row) quote = (row.getData() || {}).quote || "";
        }
      } catch (_) {}

      // Fallback: grab visible text
      if (!quote) {
        var textEl = btn.closest(".mention-quote")?.querySelector(".mention-quote-text");
        quote = textEl ? textEl.textContent : "";
      }

      copyToClipboard(quote).then(function (ok) {
        toast(ok ? "Copied" : "Copy failed");
      });
    });

    // redraw after layout settles
    setTimeout(function () {
      if (tableEl._tab) tableEl._tab.redraw(true);
    }, 60);
  }

  function hookThemeChanges() {
    if (window.__mentionsThemeHooked) return;
    window.__mentionsThemeHooked = true;

    function apply() {
      ensureThemeCss();
      var tableEl = document.getElementById("mentions-table");
      if (tableEl && tableEl._tab) tableEl._tab.redraw(true);
    }

    // observe attribute/class changes on html/body
    var obs = new MutationObserver(function () {
      apply();
    });
    obs.observe(document.documentElement, { attributes: true });
    if (document.body) obs.observe(document.body, { attributes: true });

    // if user clicks the Chirpy toggle button
    document.addEventListener("click", function (e) {
      var t = e.target;
      var btn = t && t.closest ? t.closest("#mode-toggle") : null;
      if (btn) {
        setTimeout(apply, 60);
        setTimeout(apply, 220);
      }
    });

    // prefers-color-scheme changes
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq && mq.addEventListener) mq.addEventListener("change", apply);
    }
  }

  function init() {
    hookThemeChanges();
    setTimeout(build, 0);
    setTimeout(build, 160);
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("turbo:load", init);
})();
