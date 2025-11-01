(function ($) {
    // Normalize string for accent-insensitive search
    function normalizeStr(s) {
        if (!s && s !== 0) return "";
        return String(s)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
    }

    // Custom sorting for DataTables
    jQuery.extend(jQuery.fn.dataTable.ext.type.order, {
        "string-normal-asc": (a, b) => normalizeStr(a).localeCompare(normalizeStr(b)),
        "string-normal-desc": (a, b) => normalizeStr(b).localeCompare(normalizeStr(a))
    });

    // Store search filter ID to allow cleanup
    let currentSearchFilterIndex = null;

    function initWoordenlijst(csvPath, options = {}) {
        Papa.parse(csvPath, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                if (!results.data || results.data.length === 0) {
                    console.error("No data found in CSV");
                    return;
                }

                const allColumns = Object.keys(results.data[0]);
                const columns = allColumns.map((c, i) => ({
                    title: c,
                    visible: i < 3,
                    type: "string-normal"
                }));

                const data = results.data.map(row => Object.values(row));

                // Clean up old search filter if exists
                if (currentSearchFilterIndex !== null) {
                    $.fn.dataTable.ext.search.splice(currentSearchFilterIndex, 1);
                    currentSearchFilterIndex = null;
                }

                // Destroy existing table
                if ($.fn.DataTable.isDataTable("#csvTable")) {
                    $("#csvTable").DataTable().clear().destroy();
                }

                // Apply prefilter if specified - filter the DATA, not during search
                let tableData = data;
                if (options.prefilterCol6) {
                    tableData = data.filter(row => row[5] === options.prefilterCol6);
                }

                // Initialize DataTable with filtered data as base
                const table = $("#csvTable").DataTable({
                    data: tableData,
                    columns: columns,
                    paging: false,
                    searching: true, // Critical: Enable searching for filters to work
                    info: false,
                    dom: 't', // Hide default search box but keep search functionality
                    autoWidth: false, // Don't force inline widths
                    language: {
                        emptyTable: "Geen gegevens beschikbaar",
                        zeroRecords: "Geen overeenkomende records gevonden"
                    }
                });

                table.columns.adjust();

                // Add custom search box with styling
                const searchHtml = `
                    <div class="custom-search screen-only" style="margin-bottom: 1rem;">
                        <input type="text" id="customSearchInput" placeholder="Zoeken ..."
                               style="width: 100%; max-width: 400px; padding: 0.8rem; border: 1px solid var(--border);
                                      border-radius: 8px; background: var(--bg); color: var(--text); font-size: 1rem;" />
                    </div>
                `;

                $("#csvTable").before(searchHtml);

                // Custom search filter function using DataTables search system
                const searchFilterFunction = function (settings, rowData, dataIndex) {
                    if (settings.nTable.id !== "csvTable") return true;

                    // Custom search box filter (first 3 columns only)
                    const query = normalizeStr($("#customSearchInput").val() || "");
                    if (!query) return true;

                    for (let i = 0; i < 3; i++) {
                        if (normalizeStr(rowData[i]).includes(query)) {
                            return true;
                        }
                    }

                    return false;
                };

                // Add the search filter to DataTables search system
                $.fn.dataTable.ext.search.push(searchFilterFunction);
                currentSearchFilterIndex = $.fn.dataTable.ext.search.length - 1;

                // Setup search input event
                $("#customSearchInput").off("input keyup").on("input keyup", function() {
                    table.draw(); // This now works with ALL filters including button filters
                });

                // Trigger callback after everything is set up
                if (typeof options.onComplete === "function") {
                    console.log("Calling onComplete callback");
                    options.onComplete();
                }
            },
            error: function (error) {
                console.error("Error loading CSV:", error);
            }
        });
    }

    // Expose to global scope
    window.initWoordenlijst = initWoordenlijst;

})(jQuery);
