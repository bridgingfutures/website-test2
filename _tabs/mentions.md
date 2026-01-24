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

  /* Make Tabulator fit Chirpy better */
  #mentions-table {
    margin-top: 0.75rem;
    border-radius: 0.75rem;
    overflow: hidden;
  }

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
  .mentions-open:hover{
    opacity: 1;
  }

  /* Reduce header height a bit */
  .tabulator .tabulator-header .tabulator-col{
    padding-top: 6px;
    padding-bottom: 6px;
  }

  /* Avoid cell ellipsis */
  .tabulator .tabulator-cell{
    white-space: normal;
    text-overflow: clip;
  }
</style>

## Parliamentary mentions tracker
Here we collect parliamentary mentions and actions related to the UK Ukraine schemes.

{% include mentions-table.html %}

<!-- Tabulator themes: light + dark -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator_simple.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator_midnight.min.css">

<script src="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/js/tabulator.min.js"></script>
<script src="{{ '/assets/js/mentions-table.js' | relative_url }}?v=10"></script>
