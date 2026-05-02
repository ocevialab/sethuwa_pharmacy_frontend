import React, { memo, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import DashboardTable from '@/components/dashboard/DashboardTable';
import { FiMoreHorizontal, FiEye, FiX, FiRotateCw, FiSearch, FiRefreshCw } from 'react-icons/fi'
import Dropdown from '@/components/shared/Dropdown';
import { useNavigate } from 'react-router-dom';
import { salesService, SalesListItem } from '@/services/salesService';
import Swal from 'sweetalert2';

const SalesTable: React.FC = () => {
    const [sales, setSales] = useState<SalesListItem[]>([]);
    const [allSales, setAllSales] = useState<SalesListItem[]>([]); // Store all fetched sales for searching
    const [loading, setLoading] = useState(true); // Initial loading state
    const [searchLoading, setSearchLoading] = useState(false); // Loading state for search/filter operations
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    });
    const [filters, setFilters] = useState<{
        saleStatus?: string;
        fromDate?: string;
        toDate?: string;
    }>({});
    const [sorting, setSorting] = useState<{
        sortBy: string;
        sortDirection: string;
    }>({
        sortBy: "date",
        sortDirection: "desc",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [searchField, setSearchField] = useState<string>("receiptNumber");
    const navigate = useNavigate();
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Custom filter actions for sales
    const salesFilterActions = [
        { label: "All Sales", icon: <FiRotateCw /> },
        { label: "Paid", icon: <FiRotateCw /> },
        { label: "Unpaid", icon: <FiRotateCw /> },
        { label: "PayLater", icon: <FiRotateCw /> },
        { type: "divider" },
        { label: "Today", icon: <FiRotateCw /> },
        { label: "This Week", icon: <FiRotateCw /> },
        { label: "This Month", icon: <FiRotateCw /> },
    ];

    // Fetch sales from API with server-side pagination
    const fetchSales = useCallback(
        async (
            page: number,
            pageSize: number,
            filterParams?: typeof filters,
            sortParams?: typeof sorting
        ) => {
            try {
                setLoading(true);
                setError(null);

                const currentFilters = filterParams || filters;
                const currentSort = sortParams || sorting;

                // Build API params
                const apiParams: any = {
                    page,
                    pageSize,
                    sortBy: currentSort.sortBy,
                    sortDirection: currentSort.sortDirection,
                };

                // Add filters to API params
                if (currentFilters.saleStatus) {
                    apiParams.saleStatus = currentFilters.saleStatus;
                }
                if (currentFilters.fromDate) {
                    apiParams.fromDate = currentFilters.fromDate;
                }
                if (currentFilters.toDate) {
                    apiParams.toDate = currentFilters.toDate;
                }

                const response = await salesService.getAllSales(apiParams);

                setSales(response.data);
                setPagination({
                    page: response.currentPage,
                    pageSize: response.pageSize,
                    totalItems: response.totalItems,
                    totalPages: response.totalPages,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load sales');
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err instanceof Error ? err.message : 'Failed to load sales',
                });
            } finally {
                setLoading(false);
            }
        },
        [filters, sorting]
    );

    // Fetch all sales for searching (fetches all pages)
    const fetchAllSales = useCallback(async () => {
        try {
            setSearchLoading(true);
            setError(null);

            // When searching, fetch all data without date filters (we'll filter client-side)
            // Only apply saleStatus filter if set
            const firstPageResponse = await salesService.getAllSales({
                page: 1,
                pageSize: 1000, // Use large page size to minimize requests
                sortBy: sorting.sortBy,
                sortDirection: sorting.sortDirection,
                ...(filters.saleStatus && { saleStatus: filters.saleStatus }),
                // Don't send fromDate/toDate - we'll filter client-side if needed
            });

            let allSalesData = [...firstPageResponse.data];
            const totalItems = firstPageResponse.totalItems;
            const pageSize = 1000;
            const totalPages = Math.ceil(totalItems / pageSize);

            // If there are more pages, fetch them all
            if (totalPages > 1) {
                const remainingPages = [];
                for (let page = 2; page <= totalPages; page++) {
                    remainingPages.push(
                        salesService.getAllSales({
                            page,
                            pageSize,
                            sortBy: sorting.sortBy,
                            sortDirection: sorting.sortDirection,
                            ...(filters.saleStatus && { saleStatus: filters.saleStatus }),
                            // Don't send fromDate/toDate - we'll filter client-side
                        })
                    );
                }

                // Fetch all remaining pages in parallel
                const remainingResponses = await Promise.all(remainingPages);

                // Combine all data
                remainingResponses.forEach((response) => {
                    allSalesData = [...allSalesData, ...response.data];
                });
            }

            // Apply date filtering client-side if filters are set
            if (filters.fromDate || filters.toDate) {
                allSalesData = allSalesData.filter((sale) => {
                    if (!sale.date) return false;
                    const saleDateStr = sale.date.split("T")[0];
                    if (filters.fromDate && saleDateStr < filters.fromDate) {
                        return false;
                    }
                    if (filters.toDate && saleDateStr > filters.toDate) {
                        return false;
                    }
                    return true;
                });
            }

            setAllSales(allSalesData);
            setPagination({
                page: 1,
                pageSize: pagination.pageSize,
                totalItems: allSalesData.length,
                totalPages: Math.ceil(allSalesData.length / pagination.pageSize),
            });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load sales"
            );
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err instanceof Error ? err.message : "Failed to load sales",
            });
        } finally {
            setSearchLoading(false);
        }
    }, [filters, sorting, pagination.pageSize]);

    // Debounce search query
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on search
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    // Fetch all sales when search query changes (for searching across all data)
    useEffect(() => {
        if (debouncedSearchQuery.trim()) {
            // When searching, fetch all sales for client-side filtering
            // Maintain focus on input after search completes
            fetchAllSales().then(() => {
                // Small delay to ensure DOM is updated
                setTimeout(() => {
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                    }
                }, 100);
            }).catch(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery]);

    // Refetch when filters or sorting change (only if not searching)
    useEffect(() => {
        if (!debouncedSearchQuery.trim()) {
            // When not searching, use normal pagination
            fetchSales(pagination.page, pagination.pageSize, filters, sorting);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, sorting]);

    // Initial fetch
    useEffect(() => {
        fetchSales(pagination.page, pagination.pageSize, filters, sorting);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle pagination change
    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPagination({
            ...pagination,
            page: newPage,
            pageSize: newPageSize,
        });

        // Only fetch from server if not searching (client-side pagination when searching)
        if (!debouncedSearchQuery.trim()) {
            fetchSales(newPage, newPageSize, filters, sorting);
        }
    };

    // Handle search change
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
    }, []);

    // Handle search field change
    const handleSearchFieldChange = useCallback((field: string) => {
        setSearchField(field);
        // Reset to page 1 when search field changes
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    // Handle refresh
    const handleRefresh = () => {
        if (debouncedSearchQuery.trim()) {
            fetchAllSales();
        } else {
            fetchSales(pagination.page, pagination.pageSize, filters, sorting);
        }
    };

    // Handle filter change
    const handleFilterChange = (filterType: string) => {
        if (filterType === "All Sales") {
            setFilters({});
        } else if (filterType === "Paid") {
            setFilters({ ...filters, saleStatus: "Paid" });
        } else if (filterType === "Unpaid") {
            setFilters({ ...filters, saleStatus: "Unpaid" });
        } else if (filterType === "PayLater") {
            setFilters({ ...filters, saleStatus: "PayLater" });
        } else if (filterType === "Today") {
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];
            setFilters({ ...filters, fromDate: todayStr, toDate: todayStr });
        } else if (filterType === "This Week") {
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            setFilters({
                ...filters,
                fromDate: weekStart.toISOString().split("T")[0],
                toDate: weekEnd.toISOString().split("T")[0],
            });
        } else if (filterType === "This Month") {
            const today = new Date();
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setFilters({
                ...filters,
                fromDate: monthStart.toISOString().split("T")[0],
                toDate: monthEnd.toISOString().split("T")[0],
            });
        }
        // Reset to page 1 when filter changes
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    // Handle sort change
    const handleSortChange = (sortType: string) => {
        if (sortType === "Date (Newest)") {
            setSorting({ sortBy: "date", sortDirection: "desc" });
        } else if (sortType === "Date (Oldest)") {
            setSorting({ sortBy: "date", sortDirection: "asc" });
        } else if (sortType === "Price (High to Low)") {
            setSorting({ sortBy: "finalAmountDue", sortDirection: "desc" });
        } else if (sortType === "Price (Low to High)") {
            setSorting({ sortBy: "finalAmountDue", sortDirection: "asc" });
        }
        // Reset to page 1 when sort changes
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    // Handle cancel receipt
    const handleCancel = async (receiptNumber: string, salesId: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to cancel receipt ${receiptNumber}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ea4d4d',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, cancel it!',
        });
        if (result.isConfirmed) {
            try {
                await salesService.cancelReceipt(receiptNumber);
                Swal.fire({
                    icon: 'success',
                    title: 'Cancelled!',
                    text: 'Receipt has been cancelled.',
                    timer: 2000,
                    showConfirmButton: false,
                });
                handleRefresh();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err instanceof Error ? err.message : 'Failed to cancel receipt',
                });
            }
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Format time
    const formatTime = (timeString: string) => {
        if (!timeString) return 'N/A';
        return timeString.split('.')[0]; // Remove milliseconds
    };

    // Get sale status badge color
    const getSaleStatusBadge = (status: string) => {
        switch (status) {
            case 'Paid':
                return 'bg-success';
            case 'Unpaid':
                return 'bg-warning';
            case 'PayLater':
                return 'bg-info';
            case 'Cancelled':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    // Client-side filtering based on search field and query
    const filteredSales = useMemo(() => {
        // Use allSales if searching, otherwise use sales from current page
        const salesToFilter = debouncedSearchQuery.trim() ? allSales : sales;

        if (!debouncedSearchQuery.trim()) {
            return salesToFilter;
        }

        const query = debouncedSearchQuery.trim().toLowerCase();
        return salesToFilter.filter((sale) => {
            let fieldValue: string | number | undefined;

            switch (searchField) {
                case "receiptNumber":
                    fieldValue = sale.receiptNumber;
                    break;
                case "salesId":
                    fieldValue = sale.salesId;
                    break;
                case "customerName":
                    fieldValue = sale.customerName;
                    break;
                case "finalAmountDue":
                    fieldValue = sale.finalAmountDue;
                    break;
                default:
                    fieldValue = sale.receiptNumber;
            }

            if (fieldValue === null || fieldValue === undefined) {
                return false;
            }
            return String(fieldValue).toLowerCase().includes(query);
        });
    }, [sales, allSales, debouncedSearchQuery, searchField]);

    // Transform API data to table format
    const tableData = filteredSales.map((sale) => ({
        id: sale.salesId,
        salesId: sale.salesId,
        receiptNumber: sale.receiptNumber,
        date: sale.date,
        time: sale.time,
        saleStatus: sale.saleStatus,
        paymentMethod: sale.paymentMethod,
        totalAmount: sale.totalAmount,
        finalAmountDue: sale.finalAmountDue,
        customerName: sale.customerName,
        issuedBy: sale.issuedBy,
        itemsCount: sale.items?.length || 0,
    }));

    // Calculate pagination for filtered data (only when searching)
    const filteredPagination = useMemo(() => {
        if (!debouncedSearchQuery.trim()) {
            return null;
        }
        const totalFiltered = filteredSales.length;
        const totalPages = Math.ceil(totalFiltered / pagination.pageSize) || 1;
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedData = tableData.slice(startIndex, endIndex);

        return {
            data: paginatedData,
            totalItems: totalFiltered,
            totalPages,
            currentPage: pagination.page,
            pageSize: pagination.pageSize,
        };
    }, [tableData, filteredSales.length, pagination.page, pagination.pageSize, debouncedSearchQuery]);

    // Use filtered data when searching, otherwise use all sales from current page
    const displayData = useMemo(() => {
        if (debouncedSearchQuery.trim() && filteredPagination) {
            return filteredPagination.data;
        }
        return tableData;
    }, [debouncedSearchQuery, filteredPagination, tableData]);

    // Calculate display pagination
    const displayPagination = useMemo(() => {
        if (debouncedSearchQuery.trim() && filteredPagination) {
            return {
                totalItems: filteredPagination.totalItems,
                totalPages: filteredPagination.totalPages,
                page: filteredPagination.currentPage,
                pageSize: filteredPagination.pageSize,
            };
        }
        return pagination;
    }, [debouncedSearchQuery, filteredPagination, pagination]);

    const columns = [
        {
            accessorKey: 'id',
            header: ({ table }) => {
                const checkboxRef = React.useRef(null);
                useEffect(() => {
                    if (checkboxRef.current) {
                        checkboxRef.current.indeterminate = table.getIsSomeRowsSelected();
                    }
                }, [table.getIsSomeRowsSelected()]);
                return (
                    <input
                        type="checkbox"
                        className="custom-table-checkbox"
                        ref={checkboxRef}
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                    />
                );
            },
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    className="custom-table-checkbox"
                    checked={row.getIsSelected()}
                    disabled={!row.getCanSelect()}
                    onChange={row.getToggleSelectedHandler()}
                />
            ),
            meta: {
                headerClassName: 'width-30',
            },
        },
        {
            accessorKey: 'actions',
            header: () => "Actions",
            cell: (info: any) => {
                const receiptNumber = info.row.original.receiptNumber;
                const salesId = info.row.original.salesId;
                const saleStatus = info.row.original.saleStatus;
                const actions = [
                    {
                        label: "View Details",
                        icon: <FiEye />,
                        onClick: () => {
                            navigate(`/sales/view?receiptNumber=${receiptNumber}`);
                        }
                    },
                ] as any[];
                // Only show cancel for non-cancelled receipts
                if (saleStatus !== 'Cancelled') {
                    actions.push({
                        label: "Cancel Receipt",
                        icon: <FiX />,
                        onClick: () => handleCancel(receiptNumber, salesId)
                    });
                }
                return (
                    <div className="hstack gap-2 justify-content-end">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(`/sales/view?receiptNumber=${receiptNumber}`);
                            }}
                            className="avatar-text avatar-md"
                            title="View"
                        >
                            <FiEye />
                        </a>
                        <Dropdown
                            dropdownItems={actions}
                            triggerClass='avatar-md'
                            triggerPosition={"0,21"}
                            triggerIcon={<FiMoreHorizontal />}
                            isAvatar={true}
                            dropdownAutoClose={true}
                            triggerText=""
                            dropdownParentStyle=""
                            tooltipTitle=""
                            dropdownMenuStyle=""
                            iconStrokeWidth={1.7}
                            isItemIcon={true}
                            onClick={() => {}}
                            active=""
                            id=""
                        />
                    </div>
                );
            },
            meta: {
                headerClassName: 'text-end'
            }
        },
        {
            accessorKey: 'receiptNumber',
            header: () => 'Receipt Number',
            cell: (info: any) => {
                const receiptNumber = info.getValue();
                const salesId = info.row.original.salesId;
                return (
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/sales/view?receiptNumber=${receiptNumber}`);
                        }}
                        className="text-decoration-none"
                    >
                        <span className="fw-semibold">{receiptNumber}</span>
                    </a>
                );
            }
        },
        {
            accessorKey: 'date',
            header: () => 'Date',
            cell: (info: any) => <span>{formatDate(info.getValue())}</span>
        },
        {
            accessorKey: 'time',
            header: () => 'Time',
            cell: (info: any) => <span>{formatTime(info.getValue())}</span>
        },
        {
            accessorKey: 'saleStatus',
            header: () => 'Status',
            cell: (info: any) => {
                const status = info.getValue();
                return (
                    <span className={`badge ${getSaleStatusBadge(status)}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            accessorKey: 'paymentMethod',
            header: () => 'Payment Method',
            cell: (info: any) => {
                const method = info.getValue();
                return method ? <span className="badge bg-info">{method}</span> : <span className="text-muted">N/A</span>;
            }
        },
        {
            accessorKey: 'totalAmount',
            header: () => 'Total Amount',
            cell: (info: any) => <span className="fw-semibold">{info.getValue().toLocaleString()} LKR</span>
        },
        {
            accessorKey: 'finalAmountDue',
            header: () => 'Final Amount',
            cell: (info: any) => <span className="fw-semibold text-primary">{info.getValue().toLocaleString()} LKR</span>
        },
        {
            accessorKey: 'customerName',
            header: () => 'Customer',
            cell: (info: any) => <span>{info.getValue()}</span>
        },
        {
            accessorKey: 'issuedBy',
            header: () => 'Issued By',
            cell: (info: any) => <span>{info.getValue()}</span>
        },
        {
            accessorKey: 'itemsCount',
            header: () => 'Items',
            cell: (info: any) => <span>{info.getValue()} item(s)</span>
        },
    ];

    // Only show full loading spinner on initial load (when no data exists)
    if (loading && sales.length === 0 && allSales.length === 0) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error && sales.length === 0 && allSales.length === 0) {
        return (
            <div className="card">
                <div className="card-body text-center">
                    <p className="text-danger">{error}</p>
                    <button className="btn btn-primary" onClick={handleRefresh}>
                        <FiRotateCw className="me-2" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Search Header - similar to PurchasingTable */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                        <h5 className="mb-0">Sales List</h5>
                        <div className="d-flex align-items-center gap-2 flex-nowrap">
                            <select
                                className="form-select form-select-sm"
                                value={searchField}
                                onChange={(e) => handleSearchFieldChange(e.target.value)}
                                style={{ width: "auto", minWidth: "150px" }}
                            >
                                <option value="receiptNumber">Receipt Number</option>
                                <option value="salesId">Sales ID</option>
                                <option value="customerName">Customer Name</option>
                                <option value="finalAmountDue">Final Amount</option>
                            </select>
                            <form onSubmit={(e) => e.preventDefault()} noValidate style={{ display: 'contents' }}>
                                <div
                                    className="position-relative"
                                    style={{
                                        minWidth: "200px",
                                        maxWidth: "300px",
                                        flex: "0 0 auto",
                                    }}
                                >
                                    <FiSearch
                                        className="position-absolute"
                                        style={{
                                            left: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: "#64748b",
                                            pointerEvents: "none",
                                        }}
                                        size={18}
                                    />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                        }}
                                        placeholder="Search sales..."
                                        className="form-control form-control-sm ps-5"
                                        style={{ width: "100%", paddingRight: searchLoading ? "35px" : "12px" }}
                                        autoComplete="off"
                                    />
                                    {searchLoading && (
                                        <div
                                            className="position-absolute"
                                            style={{
                                                right: "12px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: "14px", height: "14px", borderWidth: "2px" }}>
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>
                            <button
                                type="button"
                                className="btn btn-icon btn-light-brand"
                                onClick={handleRefresh}
                                title="Refresh"
                            >
                                <FiRefreshCw size={16} strokeWidth={1.6} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                html.app-skin-dark .function-table table.dataTable tbody tr td {
                    color: #b1b4c0 !important;
                    background-color: transparent;
                    border-color: #1b2436 !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr {
                    background-color: transparent;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr:hover td {
                    color: #ffffff !important;
                    background-color: #121b2e !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr:nth-of-type(odd) td {
                    color: #ffffff !important;
                    background-color: #121b2e !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr:nth-of-type(odd):hover td {
                    color: #ffffff !important;
                    background-color: #1c2438 !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr .text-success {
                    color: #17c666 !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr .text-warning {
                    color: #ffa21d !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr .text-muted {
                    color: #b1b4c0 !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr a {
                    color: #3454d1 !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr a:hover {
                    color: #4d6fe8 !important;
                }
                html.app-skin-dark .function-table table.dataTable thead th {
                    color: #ffffff !important;
                    border-color: #1b2436 !important;
                    background-color: transparent !important;
                }
                html.app-skin-dark .function-table table.dataTable thead th * {
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table table.dataTable thead th .table-head {
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table table.dataTable thead th .table-head * {
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table table.dataTable thead th svg {
                    color: #ffffff !important;
                    fill: #ffffff !important;
                    stroke: #ffffff !important;
                }
                html.app-skin-dark .function-table table.dataTable thead {
                    background-color: transparent !important;
                }
                html.app-skin-dark .function-table table.dataTable thead tr {
                    background-color: transparent !important;
                }
                html.app-skin-dark .function-table .dataTables_filter input {
                    background-color: #1b2436 !important;
                    border-color: #1b2436 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .dataTables_filter input:focus {
                    background-color: #1b2436 !important;
                    border-color: #3454d1 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .dataTables_length select {
                    background-color: #1b2436 !important;
                    border-color: #1b2436 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .dataTables_length select:focus {
                    background-color: #1b2436 !important;
                    border-color: #3454d1 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .pagination .page-link {
                    background-color: #1b2436 !important;
                    border-color: #1b2436 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .pagination .page-link:hover {
                    background-color: #121b2e !important;
                    border-color: #3454d1 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .pagination .page-item.active .page-link {
                    background-color: #3454d1 !important;
                    border-color: #3454d1 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .pagination .page-item.disabled .page-link {
                    background-color: #1b2436 !important;
                    border-color: #1b2436 !important;
                    color: #64748b !important;
                    opacity: 0.5;
                }
                html.app-skin-dark .function-table .dataTables_info {
                    color: #b1b4c0 !important;
                }
            `}</style>
            <DashboardTable
                data={displayData}
                columns={columns}
                serverSidePagination={!debouncedSearchQuery.trim()}
                totalItems={displayPagination.totalItems}
                currentPage={displayPagination.page}
                currentPageSize={displayPagination.pageSize}
                onPaginationChange={handlePaginationChange}
                onRefresh={handleRefresh}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                title=""
                filterActions={salesFilterActions}
            />
        </div>
    );
};

export default SalesTable;
