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

                // Initialize DataTable
                const table = $("#csvTable").DataTable({
                    data: data,
                    columns: columns,
                    paging: false,
                    searching: true,
                    info: false,
                    dom: 't',  // Hide default search box
                    language: {
                        search: "",
                        searchPlaceholder: "Zoeken in kolommen 1-3...",
                        emptyTable: "Geen gegevens beschikbaar",
                        zeroRecords: "Geen overeenkomende records gevonden"
                    }
                });

                // Setup custom search functionality
                if (!options.disableSearch) {
                    $("#tableSearchContainer").show();
                    $("#tableSearch").val("").off("keyup").on("keyup", function () {
                        table.draw();
                    });

                    // Add custom search filter
                    const filterFunction = function (settings, rowData, dataIndex) {
                        if (settings.nTable.id !== "csvTable") return true;

                        // Column 6 prefilter (index 5)
                        if (options.prefilterCol6 && rowData[5] !== options.prefilterCol6) {
                            return false;
                        }

                        // Search box filter (first 3 columns only)
                        const query = normalizeStr($("#tableSearch").val() || "");
                        if (!query) return true;

                        for (let i = 0; i < 3; i++) {
                            if (normalizeStr(rowData[i]).includes(query)) {
                                return true;
                            }
                        }

                        return false;
                    };

                    $.fn.dataTable.ext.search.push(filterFunction);
                    currentSearchFilterIndex = $.fn.dataTable.ext.search.length - 1;

                    // Initial filter application
                    table.draw();
                } else {
                    $("#tableSearchContainer").hide();
                }

                // ✅ CRITICAL: Trigger the callback
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
