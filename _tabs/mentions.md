---
title: Mentions
icon: fas fa-at
order: 2
permalink: /mentions/
layout: page
render_with_liquid: true
---

<div id="mentions-table"></div>

<script id="mentions-data" type="application/json">
{{ site.data.mentions_table | jsonify }}
</script>
