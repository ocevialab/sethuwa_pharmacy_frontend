import React, { memo, useEffect, useState, useCallback, useMemo, useRef } from "react";
import DashboardTable from "@/components/dashboard/DashboardTable";
import { FiMoreHorizontal, FiEye, FiEdit3, FiRotateCw, FiFilter, FiSearch, FiRefreshCw } from "react-icons/fi";
import Dropdown from "@/components/shared/Dropdown";
import { useNavigate, Link } from "react-router-dom";
import { purchasingService, Purchase } from "@/services/purchasingService";
import Swal from "sweetalert2";

const PurchasingTable: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]); // Store all fetched purchases for searching
  const [loading, setLoading] = useState(true); // Initial loading state
  /** After first successful/failed fetch — avoids treating "0 rows" refetches as initial full-page load */
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false); // Loading state for search/filter operations
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<{
    paymentStatus?: string;
    fromDate?: string;
    toDate?: string;
  }>({});
  const [sorting, setSorting] = useState<{
    sortBy: string;
    sortDirection: string;
  }>({
    sortBy: "invoiceDate",
    sortDirection: "desc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<string>("invoiceNumber");
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Custom filter actions for purchasing
  const purchasingFilterActions = [
    { label: "All Purchases", icon: <FiFilter /> },
    { label: "Complete", icon: <FiFilter /> },
    { label: "Pending", icon: <FiFilter /> },
    { type: "divider" },
    { label: "Today", icon: <FiFilter /> },
    { label: "This Week", icon: <FiFilter /> },
    { label: "This Month", icon: <FiFilter /> },
  ];

  /** Default list range when From/To are not set: current calendar year */
  const getDefaultPurchasingDateRange = useCallback(() => {
    const y = new Date().getFullYear();
    return { fromDate: `${y}-01-01`, toDate: `${y}-12-31` };
  }, []);

  // Fetch purchases from API with server-side pagination
  const fetchPurchases = useCallback(
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

        // Default date range = current year; custom From/To in filters override
        const dateRange = getDefaultPurchasingDateRange();
        const apiParams: any = {
          page,
          pageSize,
          sortBy: currentSort.sortBy,
          sortDirection: currentSort.sortDirection,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
        };

        // Add filters to API params
        if (currentFilters.paymentStatus) {
          apiParams.paymentStatus = currentFilters.paymentStatus;
        }
        if (currentFilters.fromDate) {
          apiParams.fromDate = currentFilters.fromDate;
        }
        if (currentFilters.toDate) {
          apiParams.toDate = currentFilters.toDate;
        }

        const response = await purchasingService.getAllPurchases(apiParams);

        setPurchases(response.data);
        setPagination({
          page: response.currentPage,
          pageSize: response.pageSize,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load purchases");
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err instanceof Error ? err.message : "Failed to load purchases",
        });
      } finally {
        setLoading(false);
        setInitialLoadDone(true);
      }
    },
    [filters, sorting, getDefaultPurchasingDateRange]
  );

  // Fetch all purchases for searching (fetches all pages)
  const fetchAllPurchases = useCallback(async () => {
    try {
      setSearchLoading(true);
      setError(null);

      // When searching, fetch all data without date filters (we'll filter client-side)
      // Only apply paymentStatus filter if set
      const firstPageResponse = await purchasingService.getAllPurchases({
        page: 1,
        pageSize: 1000, // Use large page size to minimize requests
        sortBy: sorting.sortBy,
        sortDirection: sorting.sortDirection,
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
        // Don't send fromDate/toDate - we'll filter client-side by selected range
      });

      let allPurchasesData = [...firstPageResponse.data];
      const totalItems = firstPageResponse.totalItems;
      const pageSize = 1000;
      const totalPages = Math.ceil(totalItems / pageSize);

      // If there are more pages, fetch them all
      if (totalPages > 1) {
        const remainingPages = [];
        for (let page = 2; page <= totalPages; page++) {
          remainingPages.push(
            purchasingService.getAllPurchases({
              page,
              pageSize,
              sortBy: sorting.sortBy,
              sortDirection: sorting.sortDirection,
              ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
              // Don't send fromDate/toDate - we'll filter client-side by selected range
            })
          );
        }

        // Fetch all remaining pages in parallel
        const remainingResponses = await Promise.all(remainingPages);

        // Combine all data
        remainingResponses.forEach((response) => {
          allPurchasesData = [...allPurchasesData, ...response.data];
        });
      }

      const dateRange =
        filters.fromDate && filters.toDate
          ? { fromDate: filters.fromDate, toDate: filters.toDate }
          : getDefaultPurchasingDateRange();
      allPurchasesData = allPurchasesData.filter((purchase) => {
        if (!purchase.invoiceDate) return false;
        const invoiceDateStr = purchase.invoiceDate.split("T")[0];
        return invoiceDateStr >= dateRange.fromDate && invoiceDateStr <= dateRange.toDate;
      });

      setAllPurchases(allPurchasesData);
      setPagination({
        page: 1,
        pageSize: pagination.pageSize,
        totalItems: allPurchasesData.length,
        totalPages: Math.ceil(allPurchasesData.length / pagination.pageSize),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load purchases"
      );
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err instanceof Error ? err.message : "Failed to load purchases",
      });
    } finally {
      setSearchLoading(false);
    }
  }, [filters, sorting, pagination.pageSize, getDefaultPurchasingDateRange]);

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

  // Fetch all purchases when search query changes (for searching across all data)
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      // When searching, fetch all purchases for client-side filtering
      // Maintain focus on input after search completes
      fetchAllPurchases().then(() => {
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
      fetchPurchases(pagination.page, pagination.pageSize, filters, sorting);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sorting]);

  // Initial fetch
  useEffect(() => {
    fetchPurchases(pagination.page, pagination.pageSize, filters, sorting);
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
      fetchPurchases(newPage, newPageSize, filters, sorting);
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
      fetchAllPurchases();
    } else {
      fetchPurchases(pagination.page, pagination.pageSize, filters, sorting);
    }
  };

  /** Custom invoice date range (from/to). When cleared, list uses current calendar year. */
  const updateCustomDateRange = (nextFrom: string, nextTo: string) => {
    const from = nextFrom.trim();
    const to = nextTo.trim();

    if (!from && !to) {
      setFilters((prev) => {
        const { fromDate: _f, toDate: _t, ...rest } = prev;
        return Object.keys(rest).length ? rest : {};
      });
      setPagination((prev) => ({ ...prev, page: 1 }));
      return;
    }

    let f = from;
    let t = to || from;
    if (!from && to) f = to;

    if (f > t) {
      void Swal.fire({
        icon: "warning",
        title: "Invalid range",
        text: "From date must be on or before To date.",
        confirmButtonColor: "#3454d1",
      });
      return;
    }

    setFilters((prev) => {
      const { fromDate: _f, toDate: _t, ...rest } = prev;
      return { ...rest, fromDate: f, toDate: t };
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearCustomDateRange = () => {
    setFilters((prev) => {
      const { fromDate, toDate, ...rest } = prev;
      return Object.keys(rest).length ? rest : {};
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (filterType: string) => {
    if (filterType === "All Purchases") {
      setFilters({});
    } else if (filterType === "Complete") {
      setFilters({ ...filters, paymentStatus: "Complete" });
    } else if (filterType === "Pending") {
      setFilters({ ...filters, paymentStatus: "Pending" });
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
      setSorting({ sortBy: "invoiceDate", sortDirection: "desc" });
    } else if (sortType === "Date (Oldest)") {
      setSorting({ sortBy: "invoiceDate", sortDirection: "asc" });
    } else if (sortType === "Price (High to Low)") {
      setSorting({ sortBy: "totalAmount", sortDirection: "desc" });
    } else if (sortType === "Price (Low to High)") {
      setSorting({ sortBy: "totalAmount", sortDirection: "asc" });
    }
    // Reset to page 1 when sort changes
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle update payment status
  const handleUpdatePaymentStatus = async (
    purchaseId: string,
    currentStatus: string
  ) => {
    const { value: newStatus } = await Swal.fire({
      title: "Update Payment Status",
      text: `Current status: ${currentStatus}`,
      input: "select",
      inputOptions: {
        Complete: "Complete",
        Pending: "Pending",
        Overdue: "Overdue",
      },
      inputValue: currentStatus,
      showCancelButton: true,
      confirmButtonColor: "#3454d1",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Update",
      inputValidator: (value) => {
        if (!value) {
          return "You need to select a status!";
        }
      },
    });

    if (newStatus && newStatus !== currentStatus) {
      try {
        await purchasingService.updatePaymentStatus(purchaseId, {
          paymentStatus: newStatus as "Complete" | "Pending" | "Overdue",
        });
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Payment status has been updated.",
          timer: 2000,
          showConfirmButton: false,
        });
        handleRefresh();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            err instanceof Error
              ? err.message
              : "Failed to update payment status",
        });
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get payment status badge color
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Complete":
        return "bg-success";
      case "Pending":
        return "bg-warning";
      case "Overdue":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  // Client-side filtering based on search field and query
  const filteredPurchases = useMemo(() => {
    // Use allPurchases if searching, otherwise use purchases from current page
    const purchasesToFilter = debouncedSearchQuery.trim() ? allPurchases : purchases;

    if (!debouncedSearchQuery.trim()) {
      return purchasesToFilter;
    }

    const query = debouncedSearchQuery.trim().toLowerCase();
    return purchasesToFilter.filter((purchase) => {
      let fieldValue: string | number | undefined;

      switch (searchField) {
        case "invoiceNumber":
          fieldValue = purchase.invoiceNumber;
          break;
        case "purchaseId":
          fieldValue = purchase.purchaseId;
          break;
        case "supplierId":
          fieldValue = purchase.supplierId;
          break;
        case "totalAmount":
          fieldValue = purchase.totalAmount;
          break;
        default:
          fieldValue = purchase.invoiceNumber;
      }

      if (fieldValue === null || fieldValue === undefined) {
        return false;
      }
      return String(fieldValue).toLowerCase().includes(query);
    });
  }, [purchases, allPurchases, debouncedSearchQuery, searchField]);

  // Transform API data to table format
  const tableData = filteredPurchases.map((purchase) => ({
    id: purchase.purchaseId,
    purchaseId: purchase.purchaseId,
    invoiceNumber: purchase.invoiceNumber,
    invoiceDate: purchase.invoiceDate,
    paymentStatus: purchase.paymentStatus,
    paymentDueDate: purchase.paymentDueDate,
    totalAmount: purchase.totalAmount,
    supplierId: purchase.supplierId,
    itemsCount: purchase.purchaseItems?.length || 0,
  }));

  // Calculate pagination for filtered data (only when searching)
  const filteredPagination = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return null;
    }
    const totalFiltered = filteredPurchases.length;
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
  }, [tableData, filteredPurchases.length, pagination.page, pagination.pageSize, debouncedSearchQuery]);

  // Use filtered data when searching, otherwise use all purchases from current page
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
      accessorKey: "id",
      header: ({ table }) => {
        const checkboxRef = React.useRef<HTMLInputElement>(null);

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
        headerClassName: "width-30",
      },
    },
    {
      accessorKey: "actions",
      header: () => "Actions",
      cell: (info: any) => {
        const purchaseId = info.row.original.purchaseId;
        const paymentStatus = info.row.original.paymentStatus;
        const actions = [
          {
            label: "View Details",
            icon: <FiEye />,
            onClick: () => {
              navigate(`/purchasing/view?id=${purchaseId}`);
            },
          },
          {
            label: "Update Payment Status",
            icon: <FiEdit3 />,
            onClick: () => handleUpdatePaymentStatus(purchaseId, paymentStatus),
          },
        ] as any[];

        return (
          <div className="hstack gap-2 justify-content-end">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/purchasing/view?id=${purchaseId}`);
              }}
              className="avatar-text avatar-md"
              title="View"
            >
              <FiEye />
            </a>
            <Dropdown
              dropdownItems={actions}
              triggerClass="avatar-md"
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
        headerClassName: "text-end",
      },
    },
    {
      accessorKey: "purchaseId",
      header: () => "Purchase ID",
      cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>,
    },
    {
      accessorKey: "invoiceNumber",
      header: () => "Invoice Number",
      cell: (info: any) => {
        const invoiceNumber = info.getValue();
        const purchaseId = info.row.original.purchaseId;
        return (
          <Link
            to={`/purchasing/view?id=${purchaseId}`}
            className="text-decoration-none"
          >
            <span className="fw-semibold">{invoiceNumber}</span>
          </Link>
        );
      },
    },
    {
      accessorKey: "invoiceDate",
      header: () => "Invoice Date",
      cell: (info: any) => <span>{formatDate(info.getValue())}</span>,
    },
    {
      accessorKey: "paymentStatus",
      header: () => "Payment Status",
      cell: (info: any) => {
        const status = info.getValue();
        return (
          <span className={`badge ${getPaymentStatusBadge(status)}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "paymentDueDate",
      header: () => "Payment Due Date",
      cell: (info: any) => <span>{formatDate(info.getValue())}</span>,
    },
    {
      accessorKey: "totalAmount",
      header: () => "Total Amount",
      cell: (info: any) => (
        <span className="fw-semibold">
          {info.getValue().toLocaleString()} LKR
        </span>
      ),
    },
    {
      accessorKey: "supplierId",
      header: () => "Supplier ID",
      cell: (info: any) => (
        <span className="badge bg-info">{info.getValue()}</span>
      ),
    },
    {
      accessorKey: "itemsCount",
      header: () => "Items",
      cell: (info: any) => <span>{info.getValue()} item(s)</span>,
    },
  ];

  const isInitialEmptyState =
    purchases.length === 0 && allPurchases.length === 0;
  const showInitialLoading =
    loading && !initialLoadDone && isInitialEmptyState;
  const showInitialError = error && isInitialEmptyState && initialLoadDone;

  return (
    <div>
      <style>{`
        /* No transition on Filter Options card (theme .card uses transition: all 0.3s) */
        .purchasing-filter-options-static.card,
        .purchasing-filter-options-static.card:hover {
          transition: none !important;
        }
        .purchasing-filter-options-static .form-select,
        .purchasing-filter-options-static .form-control {
          transition: none !important;
        }
      `}</style>
      <div className="card mb-4 purchasing-filter-options-static">
        <div className="card-header">
          <h5 className="card-title mb-0">Filter Options</h5>
        </div>
        <div className="card-body">
          <p className="text-muted small mb-3">
            Optional <strong>From / To</strong> invoice dates. When cleared, the list uses the{" "}
            <strong>current calendar year</strong>.
          </p>
          <div className="row g-3 align-items-end">
            <div className="col-md-4 col-lg-3">
              <label className="form-label" htmlFor="purchasing-filter-from-date">
                From date
              </label>
              <input
                id="purchasing-filter-from-date"
                type="date"
                className="form-control"
                value={filters.fromDate ?? ""}
                onChange={(e) =>
                  updateCustomDateRange(e.target.value, filters.toDate ?? "")
                }
              />
            </div>
            <div className="col-md-4 col-lg-3">
              <label className="form-label" htmlFor="purchasing-filter-to-date">
                To date
              </label>
              <input
                id="purchasing-filter-to-date"
                type="date"
                className="form-control"
                value={filters.toDate ?? ""}
                onChange={(e) =>
                  updateCustomDateRange(filters.fromDate ?? "", e.target.value)
                }
              />
            </div>
            <div className="col-md-4 col-lg-3">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={clearCustomDateRange}
                disabled={!filters.fromDate && !filters.toDate}
              >
                Clear dates
              </button>
            </div>
          </div>
        </div>
      </div>

      {showInitialLoading && (
        <div
          className="d-flex align-items-center justify-content-center text-muted mb-4"
          style={{ minHeight: "240px" }}
          role="status"
        >
          Loading purchases…
        </div>
      )}

      {showInitialError && (
        <div className="card mb-4">
          <div className="card-body text-center">
            <p className="text-danger">{error}</p>
            <button className="btn btn-primary" onClick={handleRefresh}>
              <FiRotateCw className="me-2" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Search Header + table — only after first successful load */}
      {!showInitialLoading && !showInitialError && (
        <>
      {/* Search Header - similar to MedicineTable */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <h5 className="mb-0">Purchasing List</h5>
            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <select
                className="form-select form-select-sm"
                value={searchField}
                onChange={(e) => handleSearchFieldChange(e.target.value)}
                style={{ width: "auto", minWidth: "150px" }}
              >
                <option value="invoiceNumber">Invoice Number</option>
                <option value="purchaseId">Purchase ID</option>
                <option value="supplierId">Supplier ID</option>
                <option value="totalAmount">Total Amount</option>
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
                    placeholder="Search purchases..."
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
                /* Fix z-index for dropdowns */
                .function-table .filter-dropdown {
                    position: relative;
                    z-index: 10;
                }
                .function-table .filter-dropdown .dropdown-menu {
                    z-index: 1050 !important;
                }
                .function-table .card {
                    overflow: visible;
                }
                .function-table .card-body {
                    overflow: visible;
                }
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
        filterActions={purchasingFilterActions}
      />
        </>
      )}
    </div>
  );
};

export default PurchasingTable;
