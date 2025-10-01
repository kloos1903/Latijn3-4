(function ($) {
    "use strict";

    let activeCol4 = null;
    let activeCol5 = null;

    function initWoordenfilter(targetTableId, containerId, options = {}) {
        const defaults = {
            col4Index: 3,  // Column 4 (0-indexed)
            col5Index: 4,  // Column 5 (0-indexed)
            col4Label: "Niveau",
            col5Label: "Thema"
        };

        const config = { ...defaults, ...options };
        const $container = $("#" + containerId);

        if (!$container.length) {
            console.error(`Container #${containerId} not found`);
            return;
        }

        // Wait for DataTable to be ready
        const checkTable = setInterval(function() {
            if ($.fn.DataTable.isDataTable("#" + targetTableId)) {
                clearInterval(checkTable);
                buildButtonFilter();
            }
        }, 100);

        function buildButtonFilter() {
            const table = $("#" + targetTableId).DataTable();

            // Collect unique values
            const col4Values = new Set();
            const col5ByCol4 = {};

            table.rows().every(function() {
                const rowData = this.data();
                const col4Val = rowData[config.col4Index];
                const col5Val = rowData[config.col5Index];

                // Skip "-" values
                if (col4Val && col4Val !== "-") {
                    col4Values.add(col4Val);

                    if (!col5ByCol4[col4Val]) {
                        col5ByCol4[col4Val] = new Set();
                    }

                    if (col5Val && col5Val !== "-") {
                        col5ByCol4[col4Val].add(col5Val);
                    }
                }
            });

            // Render filter UI
            renderFilterUI(col4Values, col5ByCol4, table);
        }

        function renderFilterUI(col4Values, col5ByCol4, table) {
            let html = '<div class="button-filter">';

            // Header with clear button
            html += `<div class="filter-header">
                        <h3>${config.col4Label}</h3>
                        <button id="clearButtonFilter" class="btn-clear">Wis filter</button>
                     </div>`;

            // Row 1: Column 4 buttons
            html += '<div class="filter-row" id="col4Buttons">';
            Array.from(col4Values).sort().forEach(val => {
                html += `<button class="filter-btn col4-btn" data-value="${escapeHtml(val)}">${escapeHtml(val)}</button>`;
            });
            html += '</div>';

            // Row 2: Column 5 buttons (initially hidden)
            html += `<div class="filter-row-wrapper" id="col5Wrapper" style="display: none;">
                        <h4 id="col5Label">${config.col5Label}</h4>
                        <div class="filter-row" id="col5Buttons"></div>
                     </div>`;

            html += '</div>';

            $container.html(html);
            attachFilterEvents(table, col5ByCol4);
        }

        function attachFilterEvents(table, col5ByCol4) {
            const $container = $("#" + containerId);

            // Column 4 button click
            $container.on("click", ".col4-btn", function() {
                const value = $(this).data("value");

                // Toggle active state
                if (activeCol4 === value) {
                    // Deselect
                    activeCol4 = null;
                    activeCol5 = null;
                    $(this).removeClass("active");
                    $("#col5Wrapper").slideUp(200);
                } else {
                    // Select new
                    activeCol4 = value;
                    activeCol5 = null;
                    $(".col4-btn").removeClass("active");
                    $(this).addClass("active");

                    // Show column 5 buttons
                    showCol5Buttons(col5ByCol4[value]);
                }

                applyFilter(table);
            });

            // Column 5 button click
            $container.on("click", ".col5-btn", function() {
                const value = $(this).data("value");

                if (activeCol5 === value) {
                    // Deselect
                    activeCol5 = null;
                    $(this).removeClass("active");
                } else {
                    // Select
                    activeCol5 = value;
                    $(".col5-btn").removeClass("active");
                    $(this).addClass("active");
                }

                applyFilter(table);
            });

            // Clear filter button
            $container.on("click", "#clearButtonFilter", function() {
                activeCol4 = null;
                activeCol5 = null;
                $(".filter-btn").removeClass("active");
                $("#col5Wrapper").slideUp(200);
                applyFilter(table);
            });
        }

        function showCol5Buttons(col5Values) {
            let html = '';

            if (col5Values && col5Values.size > 0) {
                Array.from(col5Values).sort().forEach(val => {
                    html += `<button class="filter-btn col5-btn" data-value="${escapeHtml(val)}">${escapeHtml(val)}</button>`;
                });
            } else {
                html = '<p style="color: #999; font-style: italic;">Geen subcategorieën beschikbaar</p>';
            }

            $("#col5Buttons").html(html);
            $("#col5Wrapper").slideDown(200);
        }

        function applyFilter(table) {
            // Remove old filter
            $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(function(fn) {
                return !fn.name || fn.name !== 'buttonFilter';
            });

            // Add new filter if active
            if (activeCol4 || activeCol5) {
                const filterFn = function buttonFilter(settings, data, dataIndex) {
                    if (settings.nTable.id !== targetTableId) return true;

                    const col4Val = data[config.col4Index];
                    const col5Val = data[config.col5Index];

                    // Filter by column 4
                    if (activeCol4 && col4Val !== activeCol4) {
                        return false;
                    }

                    // Filter by column 5 (if selected)
                    if (activeCol5 && col5Val !== activeCol5) {
                        return false;
                    }

                    return true;
                };

                $.fn.dataTable.ext.search.push(filterFn);
            }

            table.draw();
        }

        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    }

    // Expose to global scope
window.initWoordenfilter = initWoordenfilter;

})(jQuery);
