---
title: Mentions
icon: fas fa-at
order: 2
permalink: /mentions/
layout: page
---

<style>
  /* Hide auto page title (we use our own heading) */
  h1.dynamic-title { display: none; }

  /* ===== Mentions page: remove right panel and widen content ===== */
  #panel-wrapper { display: none !important; }

  /* Make main content take the space that used to be main + panel */
  main.col-xl-9 { width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; }
  main.col-lg-11 { width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; }
  main.col-12 { width: 100% !important; max-width: 100% !important; }

  /* Also widen the wrapper that holds footer */
  #tail-wrapper.col-xl-9 { width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; }
  #tail-wrapper.col-lg-11 { width: 100% !important; max-width: 100% !important; flex: 0 0 100% !important; }

  /* Slightly reduce side padding on very wide screens */
  @media (min-width: 1200px) {
    .container.px-xxl-5 { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
  }

  /* ===== Make Tabulator fit Chirpy better ===== */
  #mentions-table { margin-top: 0.75rem; border-radius: 0.75rem; overflow: hidden; }

  /* Quote cell layout */
  .mentions-quote{ display:flex; gap:.5rem; align-items:flex-start; justify-content:space-between; }
  .mentions-quote-text{ white-space: normal; word-break: break-word; line-height: 1.35; flex: 1 1 auto; min-width: 0; }
  .mentions-open{ flex: 0 0 auto; opacity: .75; text-decoration: none !important; }
  .mentions-open:hover{ opacity: 1; }

  /* Reduce header height a bit */
  .tabulator .tabulator-header .tabulator-col{ padding-top: 6px; padding-bottom: 6px; }

  /* Avoid cell ellipsis */
  .tabulator .tabulator-cell{ white-space: normal; text-overflow: clip; }

  /* ===== BF: header popup filters (Tabulator) ===== */
  .bf-hpop{ padding: .75rem; width: 280px; max-width: 80vw; }
  .bf-hpop .bf-title{ font-weight: 600; margin-bottom: .5rem; }
  .bf-hpop .bf-input{
    width: 100%;
    padding: .4rem .55rem;
    border-radius: .5rem;
    border: 1px solid rgba(127,127,127,.25);
    background: transparent;
    color: inherit;
    outline: none;
  }

  .bf-hpop .bf-actions{ display:flex; gap: .5rem; margin-top: .5rem; }
  .bf-hpop .bf-btn{
    padding: .25rem .5rem;
    border-radius: .5rem;
    border: 1px solid rgba(127,127,127,.25);
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .bf-hpop .bf-list{
    margin-top: .5rem;
    max-height: 260px;
    overflow: auto;
    border: 1px solid rgba(127,127,127,.18);
    border-radius: .5rem;
    padding: .25rem;
  }

  /* vertical list */
  .bf-hpop .bf-item{
    display: flex;
    gap: .5rem;
    align-items: flex-start;
    padding: .25rem .35rem;
    border-radius: .4rem;
    user-select: none;
  }
  .bf-hpop .bf-item:hover{ background: rgba(127,127,127,.10); }
  .bf-hpop .bf-item input{ margin-top: .15rem; }
  .bf-hpop .bf-item-text{ white-space: normal; line-height: 1.25; }

  /* highlight icon if filter active */
  .tabulator .tabulator-header-popup-button{ opacity: .65; }
  .tabulator .tabulator-col.bf-filtered .tabulator-header-popup-button{ opacity: 1; }

  /* slightly constrain popup width in general */
  .tabulator-popup{ max-width: 86vw; }
</style>

## Parliamentary mentions tracker

Here we collect parliamentary mentions and actions related to the UK Ukraine schemes.

<div id="mentions-table"></div>

<script id="mentions-data" type="application/json">
{{ site.data.mentions_table | jsonify }}
</script>

<link id="tabulator-css-light" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator.min.css" />
<link id="tabulator-css-dark" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator_midnight.min.css" disabled />

<script src="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/js/tabulator.min.js" defer></script>
<script src="{{ '/assets/js/mentions-table.js' | relative_url }}?v=18" defer></script>
