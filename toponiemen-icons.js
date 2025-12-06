(function () {
  function renderIcon(cellEl, url, type) {
    if (!url) { cellEl.innerHTML = ""; return; }
    url = String(url).trim();
    const title = type === "wiki" ? "Wikipedia" : "Maps";
    const svg = type === "wiki"
      ? `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 4h16v16H4z" fill="none"/><text x="12" y="16" text-anchor="middle" font-family="Georgia, Times" font-size="12">W</text></svg>`
      : `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M2 12h20" stroke="currentColor" stroke-width="1"/></svg>`;
    cellEl.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="link-icon" title="${title}">${svg}</a>`;
  }

  window.attachToponiemenIcons = function (tableSelector = "#csvTable", wikiIndex = 3, mapsIndex = 4) {
    const $table = $(tableSelector);
    if (!$table.length) return;
    const dt = $table.DataTable ? $table.DataTable() : null;
    if (!dt) return;

    // Update existing cells (works for current rows)
    const wikiNodes = dt.column(wikiIndex).nodes();
    const mapsNodes = dt.column(mapsIndex).nodes();

    $(wikiNodes).each(function (i, td) {
      renderIcon(td, $(td).text(), "wiki");
    });
    $(mapsNodes).each(function (i, td) {
      renderIcon(td, $(td).text(), "maps");
    });

    // Optional: if new rows will be added later, hook draw event
    dt.on('draw', function () {
      $(dt.column(wikiIndex).nodes()).each(function (i, td) { renderIcon(td, $(td).text(), "wiki"); });
      $(dt.column(mapsIndex).nodes()).each(function (i, td) { renderIcon(td, $(td).text(), "maps"); });
    });
  };
})();