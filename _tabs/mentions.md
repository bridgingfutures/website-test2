---
title: Mentions
icon: fas fa-at
order: 2
permalink: /mentions/
layout: page
---

<style>
  /* скрыть дублирующийся заголовок Chirpy */
  h1.dynamic-title { display: none; }

  /* убрать правую панель ТОЛЬКО на этой странице */
  #panel-wrapper { display: none !important; }
  /* растянуть main на всю ширину */
  main[aria-label="Main Content"]{
    max-width: 100% !important;
    flex: 0 0 100% !important;
    width: 100% !important;
  }
  /* чтобы контейнер не ограничивал ширину */
  #main-wrapper .container { max-width: 100% !important; }

  /* убираем горизонтальный скролл контейнера (таблица будет переносить/коллапсить) */
  #mentions-table { width: 100%; }
</style>

## Parliamentary mentions tracker
Here we collect parliamentary mentions and actions related to the UK Ukraine schemes.

{% include mentions-table.html %}

<!-- ВАЖНО: больше НЕ подключаем tabulator_midnight тут.
     Табуляторные CSS будут подключаться и переключаться внутри mentions-table.js -->

<script src="https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/js/tabulator.min.js"></script>
<script src="{{ '/assets/js/mentions-table.js' | relative_url }}?v=12"></script>



