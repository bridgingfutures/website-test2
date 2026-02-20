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
  .mentions-quote{
    display:flex;
    gap:.5rem;
    align-items:flex-start;
    justify-content:space-between;
  }
  .mentions-quote-text{
    white-space: normal;
    word-break: break-word;
    line-height: 1.35;
    flex: 1 1 auto;
    min-width: 0;
  }
  .mentions-open{
    flex: 0 0 auto;
    opacity: .75;
    text-decoration: none !important;
  }
  .mentions-open:hover{ opacity: 1; }

  /* Reduce header height a bit */
  .tabulator .tabulator-header .tabulator-col{ padding-top: 6px; padding-bottom: 6px; }

  /* Avoid cell ellipsis */
  .tabulator .tabulator-cell{ white-space: normal; text-overflow: clip; }

  /* ===== BF: header popup filters (Tabulator) ===== */
  /* prevent Tabulator popup from stretching full width */
  .tabulator-popup, .tabulator-menu, .tabulator-popup-container {
    width: auto !important;
    min-width: 0 !important;
    max-width: 340px !important;
  }

  .bf-hpop{
    box-sizing: border-box;
    padding: .75rem;
    width: 260px;
    max-width: 85vw;
  }

  .bf-hpop .bf-title{
    font-weight: 600;
    margin-bottom: .5rem;
  }

  .bf-hpop .bf-input{
    width: 100%;
    padding: .4rem .5rem;
    border-radius: .5rem;
    border: 1px solid rgba(127,127,127,.25);
    background: transparent;
    color: inherit;
    outline: none;
  }

  .bf-hpop .bf-actions{
    display: flex;
    gap: .5rem;
    margin-top: .5rem;
  }

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
    display: flex;
    flex-direction: column;
    gap: .15rem;
  }

  .bf-hpop .bf-item{
    display: flex;
    gap: .5rem;
    align-items: center;
    padding: .25rem .35rem;
    border-radius: .4rem;
    user-select: none;
  }

  .bf-hpop .bf-item:hover{
    background: rgba(127,127,127,.10);
  }

  /* highlight icon when filter is active */
  .tabulator .tabulator-col.bf-filtered .tabulator-header-popup-button{
    opacity: 1;
  }

  .tabulator .tabulator-header-popup-button{
    opacity: .65;
  }

</style>

## Parliamentary mentions tracker
Here we collect parliamentary mentions and actions related to the UK Ukraine schemes.

{% include mentions-table.html %}

<!-- Tabulator themes: light + dark. Chirpy will switch which one is enabled -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator_simple.min.css" />
<link id="tabulator-css-light" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator.min.css" />
<link id="tabulator-css-dark" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator_midnight.min.css" disabled />

<script src="https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/js/tabulator.min.js"></script>

<!-- bump v=... to bust GitHub Pages caching when you change JS -->
<script src="/assets/js/mentions-table.js?v=17"></script>
