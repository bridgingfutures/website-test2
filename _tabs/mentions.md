---
title: Mentions
icon: fas fa-at
order: 2
permalink: /mentions/
layout: page
---

<!-- Tabulator dependencies -->
<link rel="stylesheet" href="https://unpkg.com/tabulator-tables@6.2.5/dist/css/tabulator_simple.min.css">
<link id="tabulator-css-light" rel="stylesheet" href="https://unpkg.com/tabulator-tables@6.2.5/dist/css/tabulator.min.css">
<link id="tabulator-css-dark" rel="stylesheet" href="https://unpkg.com/tabulator-tables@6.2.5/dist/css/tabulator_midnight.min.css" disabled>

<script src="https://unpkg.com/luxon@3.5.0/build/global/luxon.min.js"></script>
<script src="https://unpkg.com/tabulator-tables@6.2.5/dist/js/tabulator.min.js"></script>
<script src="{{ '/assets/js/mentions-table.js' | relative_url }}?v=15"></script>

<style>
  /* Hide title in the sidebar / page header */
  h1.dynamic-title { display: none; }
  header .post-title { display: none; }

  /* Make table full width */
  .post-content { max-width: 100% !important; }

  /* Quote cell layout + open icon */
  .mentions-quote {
    display: flex;
    align-items: flex-start;
    gap: .5rem;
  }

  .mentions-quote-text {
    flex: 1;
    white-space: normal;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .mentions-open {
    flex: 0 0 auto;
    opacity: .8;
    text-decoration: none;
    transform: translateY(2px);
  }

  .mentions-open:hover { opacity: 1; }

  /* Make the icon button visually consistent */
  .mentions-open i {
    font-size: .95rem;
  }

  /* ===== BF: header popup filters (Tabulator) ===== */
  .bf-hpop{ padding:.75rem; width:280px; max-width:80vw; }
  .bf-hpop .bf-title{ font-weight:600; margin-bottom:.5rem; }
  .bf-hpop .bf-input{
    width:100%;
    padding:.4rem .5rem;
    border-radius:.5rem;
    border:1px solid rgba(127,127,127,.25);
    background:transparent;
    color:inherit;
    outline:none;
  }
  .bf-hpop .bf-actions{ display:flex; gap:.5rem; margin-top:.5rem; }
  .bf-hpop .bf-btn{
    padding:.25rem .5rem;
    border-radius:.5rem;
    border:1px solid rgba(127,127,127,.25);
    background:transparent;
    color:inherit;
    cursor:pointer;
  }
  .bf-hpop .bf-list{
    margin-top:.5rem;
    max-height:240px;
    overflow:auto;
    border:1px solid rgba(127,127,127,.18);
    border-radius:.5rem;
    padding:.25rem;
  }
  .bf-hpop .bf-item{
    display:flex;
    gap:.5rem;
    align-items:center;
    padding:.25rem .35rem;
    border-radius:.4rem;
    user-select:none;
  }
  .bf-hpop .bf-item:hover{ background: rgba(127,127,127,.10); }
  .bf-hpop .bf-item input{ margin:0; }
  /* icon visibility */
  .tabulator .tabulator-header-popup-button{ opacity:.65; }
  .tabulator .tabulator-col.bf-filtered .tabulator-header-popup-button{ opacity:1; }
</style>

# Parliamentary mentions tracker

Here we collect parliamentary mentions and actions related to the UK Ukraine schemes.

{% include mentions-table.html %}
