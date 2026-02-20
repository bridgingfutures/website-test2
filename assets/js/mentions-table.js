/* Bridging Futures — Mentions table (Tabulator)

   Features
   - Name: popup with text input (filters as you type)
   - House / Party / Action: popup with checkbox list (no input), vertical layout
   - Date / Quote: no popup

   Data source
   - Reads JSON from <script id="mentions-data" type="application/json"> ... </script>
*/

(() => {
  'use strict';

  // ---------- utils ----------
  const norm = (v) => {
    const s = (v ?? '').toString().trim();
    return s.length ? s : '(blank)';
  };

  const escapeHtml = (str) =>
    (str ?? '')
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const uniqSorted = (arr) => {
    const set = new Set(arr.map(norm));
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  };

  const readMentionsData = () => {
    const el = document.getElementById('mentions-data');
    if (!el) return [];
    try {
      return JSON.parse(el.textContent || '[]');
    } catch (err) {
      console.error('[BF] Failed to parse #mentions-data JSON:', err);
      return [];
    }
  };

  // ---------- theme (Chirpy) ----------
  const syncTabulatorTheme = () => {
    const isDark = document.documentElement.getAttribute('data-mode') === 'dark';
    const light = document.getElementById('tabulator-css-light');
    const dark = document.getElementById('tabulator-css-dark');
    if (!light || !dark) return;
    light.disabled = isDark;
    dark.disabled = !isDark;
  };

  // ---------- popup UI ----------
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const makeButton = (label, onClick) => {
    const b = el('button', 'bf-btn', label);
    b.type = 'button';
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return b;
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Guard: only run on Mentions page
    const tableHost = document.getElementById('mentions-table');
    if (!tableHost) return;
    if (!window.Tabulator) {
      console.error('[BF] Tabulator not loaded');
      return;
    }

    syncTabulatorTheme();
    // keep theme in sync when user toggles mode
    new MutationObserver(syncTabulatorTheme).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode'],
    });

    const data = readMentionsData();

    // values for checklist columns (computed once from full dataset)
    const values = {
      house: uniqSorted(data.map((d) => d.house)),
      party: uniqSorted(data.map((d) => d.party)),
      action_type: uniqSorted(data.map((d) => d.action_type)),
    };

    // filter state
    const state = {
      nameQuery: '',
      house: new Set(values.house),
      party: new Set(values.party),
      action_type: new Set(values.action_type),
    };

    const isChecklistActive = (field) =>
      state[field].size !== values[field].length;

    const isNameActive = () => state.nameQuery.trim().length > 0;

    // Tabulator instance (declared here so helpers can use it)
    let table;

    const updateHeaderIndicators = () => {
      const nameCol = table.getColumn('name');
      if (nameCol) nameCol.getElement().classList.toggle('bf-filtered', isNameActive());

      for (const f of ['house', 'party', 'action_type']) {
        const col = table.getColumn(f);
        if (!col) continue;
        col.getElement().classList.toggle('bf-filtered', isChecklistActive(f));
      }
    };

    const rowFilter = (rowData) => {
      // name text query
      const q = state.nameQuery.trim().toLowerCase();
      if (q) {
        const name = norm(rowData.name).toLowerCase();
        if (!name.includes(q)) return false;
      }

      // checklists: if a set is empty => show nothing (Excel "None")
      if (!state.house.has(norm(rowData.house))) return false;
      if (!state.party.has(norm(rowData.party))) return false;
      if (!state.action_type.has(norm(rowData.action_type))) return false;

      return true;
    };

    const applyFilters = () => {
      table.setFilter(rowFilter);
      updateHeaderIndicators();
    };

    const checklistPopupFactory = (field, title) => (e, column, onRendered) => {
      const wrap = el('div', 'bf-hpop');

      wrap.appendChild(el('div', 'bf-title', title));

      const actions = el('div', 'bf-actions');
      wrap.appendChild(actions);

      const list = el('div', 'bf-list');
      wrap.appendChild(list);

      const renderList = () => {
        list.innerHTML = '';
        for (const v of values[field]) {
          const label = el('label', 'bf-item');
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = state[field].has(v);

          cb.ad
