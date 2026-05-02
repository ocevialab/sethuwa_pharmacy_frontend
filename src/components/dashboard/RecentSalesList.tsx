import React, { useState, useEffect, useRef, useCallback } from "react";
import DashboardTable from "./DashboardTable";
// @ts-ignore - TypeScript may need recompilation
import { salesService, Sale, SaleItem } from "@/services/salesService";

interface ExpandedRows {
  [key: string]: boolean;
}

interface MappedSaleData {
  id: string;
  refNo: string;
  date: string;
  dateTimestamp: number; // For sorting purposes
  customer: string;
  medicines: Array<{ name: string; quantity: number }>;
  quantity: number;
  finalPrice: string;
  discount: string;
  method: string;
  status: string;
  issuedBy: string;
}

const RecentSalesList = () => {
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({});
  const [salesData, setSalesData] = useState<MappedSaleData[]>([]);
  const [allSalesData, setAllSalesData] = useState<MappedSaleData[]>([]); // Store all fetched sales for client-side filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<{
    searchQuery?: string;
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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef(filters);
  const sortingRef = useRef(sorting);
  const paginationRef = useRef(pagination);

  // Keep refs in sync with state
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    sortingRef.current = sorting;
  }, [sorting]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  // Map API sale data to component format
  const mapSaleToComponentFormat = (sale: Sale): MappedSaleData => {
    // Format date and time: "Apr 22, 2025 12.00pm"
    const dateObj = new Date(`${sale.date}T${sale.time}`);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = dateObj
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase()
      .replace(" ", ".");
    const dateTime = `${formattedDate} ${formattedTime}`;

    // Map items to medicines format
    const medicines = sale.items.map((item: SaleItem) => ({
      name: item.productName,
      quantity: item.quantity,
    }));

    // Calculate total quantity
    const totalQuantity = sale.items.reduce(
      (sum: number, item: SaleItem) => sum + item.quantity,
      0
    );

    // Format discount percentage
    const discountPercent = sale.customerDiscountPercent || 0;
    const discount = discountPercent > 0 ? `${discountPercent}%` : "0%";

    // Map saleStatus to component status (Paid/Unpaid -> Paid/Due)
    let status = "Pending";
    if (sale.saleStatus === "Paid") {
      status = "Paid";
    } else if (sale.saleStatus === "Unpaid") {
      status = "Due";
    } else if (sale.saleStatus === "Draft") {
      status = "Due";
    } else if (sale.saleStatus === "Cancelled") {
      status = "Cancelled";
    }

    // Map payment method
    const method = sale.paymentMethod || "N/A";

    return {
      id: sale.salesId,
      refNo: sale.receiptNumber,
      date: dateTime,
      dateTimestamp: dateObj.getTime(), // Store timestamp for sorting
      customer: sale.customerName || "Walk-in Customer",
      medicines: medicines,
      quantity: totalQuantity,
      finalPrice: sale.finalAmountDue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      discount: discount,
      method: method,
      status: status,
      issuedBy: sale.issuedBy,
    };
  };

  // Fetch sales data from API (without search query - for hybrid approach)
  // Fetches a large batch for client-side search filtering
  const fetchSalesForSearch = async (
    filterParams?: {
      searchQuery?: string;
      saleStatus?: string;
      fromDate?: string;
      toDate?: string;
    },
    sortParams?: { sortBy: string; sortDirection: string }
  ) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = filterParams || filters;
      const currentSort = sortParams || sorting;

      // Calculate date ranges
      let fromDate: string | undefined;
      let toDate: string | undefined;

      if (currentFilters.fromDate || currentFilters.toDate) {
        fromDate = currentFilters.fromDate;
        toDate = currentFilters.toDate;
      }

      // Fetch a large batch (1000 records) for client-side search
      // Note: We don't include the search query (q) parameter here
      const response = await salesService.getAllSales({
        page: 1,
        pageSize: 1000, // Fetch up to 1000 records for client-side filtering
        sortBy: currentSort.sortBy,
        sortDirection: currentSort.sortDirection,
        saleStatus: currentFilters.saleStatus,
        fromDate,
        toDate,
        // q parameter is NOT included - we'll filter client-side
      });

      const mappedData = response.data.map(mapSaleToComponentFormat);
      setAllSalesData(mappedData);

      // Apply client-side filtering and pagination with the newly fetched data
      applyFiltersAndPagination(
        1,
        pagination.pageSize,
        currentFilters,
        currentSort,
        mappedData // Pass data directly to avoid stale state
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sales");
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters, search, sorting, and pagination client-side
  const applyFiltersAndPagination = useCallback(
    (
      page: number,
      pageSize: number,
      filterParams?: {
        searchQuery?: string;
        saleStatus?: string;
        fromDate?: string;
        toDate?: string;
      },
      sortParams?: { sortBy: string; sortDirection: string },
      dataToFilter?: MappedSaleData[] // Optional: pass data directly to avoid stale state
    ) => {
      const currentFilters = filterParams || filters;
      const currentSort = sortParams || sorting;

      // Start with provided data or all fetched sales data
      let filteredData = [...(dataToFilter || allSalesData)];

      // Apply client-side search filter
      if (currentFilters.searchQuery && currentFilters.searchQuery.trim()) {
        const searchLower = currentFilters.searchQuery.toLowerCase().trim();
        filteredData = filteredData.filter(
          (sale) =>
            sale.refNo.toLowerCase().includes(searchLower) ||
            sale.customer.toLowerCase().includes(searchLower) ||
            sale.medicines.some((med) =>
              med.name.toLowerCase().includes(searchLower)
            ) ||
            sale.issuedBy.toLowerCase().includes(searchLower) ||
            sale.finalPrice.replace(/,/g, "").includes(searchLower) ||
            sale.status.toLowerCase().includes(searchLower) ||
            sale.method.toLowerCase().includes(searchLower)
        );
      }

      // Sort the data client-side
      filteredData.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (currentSort.sortBy) {
          case "date":
            // Use the timestamp for accurate date comparison
            aValue = a.dateTimestamp;
            bValue = b.dateTimestamp;
            break;
          case "finalAmountDue":
            aValue = parseFloat(a.finalPrice.replace(/,/g, ""));
            bValue = parseFloat(b.finalPrice.replace(/,/g, ""));
            break;
          case "refNo":
            aValue = a.refNo;
            bValue = b.refNo;
            break;
          case "customer":
            aValue = a.customer;
            bValue = b.customer;
            break;
          default:
            aValue = a[currentSort.sortBy as keyof MappedSaleData];
            bValue = b[currentSort.sortBy as keyof MappedSaleData];
        }

        if (aValue < bValue)
          return currentSort.sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue)
          return currentSort.sortDirection === "asc" ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      setSalesData(paginatedData);
      setPagination({
        page,
        pageSize,
        totalItems: filteredData.length,
        totalPages: Math.ceil(filteredData.length / pageSize),
      });
    },
    [allSalesData, filters, sorting]
  );

  // Initial fetch
  useEffect(() => {
    fetchSalesForSearch(filters, sorting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when non-search filters or sorting change (reset to page 1)
  // Note: searchQuery changes are handled directly in handleSearchChange with client-side filtering
  useEffect(() => {
    fetchSalesForSearch(filters, sorting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.saleStatus, filters.fromDate, filters.toDate, sorting]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  // Handle pagination change from DashboardTable (client-side pagination)
  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    applyFiltersAndPagination(newPage, newPageSize, filters, sorting);
  };

  // Handle filter change
  const handleFilterChange = (filterType: string, value?: string) => {
    if (filterType === "All Sales") {
      setFilters({});
    } else if (filterType === "Paid") {
      setFilters({ ...filters, saleStatus: "Paid" });
    } else if (filterType === "Due") {
      setFilters({ ...filters, saleStatus: "Unpaid" });
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
  };

  // Handle search change - client-side filtering with debouncing
  const handleSearchChange = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim() || undefined;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Update filters state immediately for UI responsiveness
    const newFilters = {
      ...filtersRef.current,
      searchQuery: trimmedQuery,
    };
    setFilters(newFilters);
    filtersRef.current = newFilters;

    // Debounce the client-side filtering - wait 300ms after user stops typing
    // This prevents filtering on every keystroke
    // Use refs to get latest values when timeout executes
    searchTimeoutRef.current = setTimeout(() => {
      applyFiltersAndPagination(
        1, // Reset to page 1 when search changes
        paginationRef.current.pageSize,
        filtersRef.current,
        sortingRef.current
      );
    }, 300); // Shorter debounce since it's client-side (no network delay)
  };

  const columns: any[] = [
    {
      accessorKey: "refNo",
      header: () => "Ref No",
      cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>,
    },
    {
      accessorKey: "date",
      header: () => "Date",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "customer",
      header: () => "Customer",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "medicines",
      header: () => "Item",
      cell: (info: any) => {
        const medicines = info.getValue() as Array<{
          name: string;
          quantity: number;
        }>;
        const rowId = info.row.original.id as string;
        const isExpanded = expandedRows[rowId] || false;
        const displayCount = 2;
        const visibleMedicines = isExpanded
          ? medicines
          : medicines.slice(0, displayCount);
        const remainingCount = medicines.length - displayCount;

        return (
          <div>
            {visibleMedicines.map(
              (medicine: { name: string; quantity: number }, index: number) => (
                <div key={index} className="mb-1">
                  {medicine.name}
                </div>
              )
            )}
            {!isExpanded && remainingCount > 0 && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleRowExpansion(rowId);
                }}
                className="text-primary text-decoration-none"
              >
                ✓ See {remainingCount} more
              </a>
            )}
            {isExpanded && remainingCount > 0 && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleRowExpansion(rowId);
                }}
                className="text-primary text-decoration-none"
              >
                Show less
              </a>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: () => "Quantity",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "finalPrice",
      header: () => "Final Price",
      cell: (info: any) => {
        const status = info.row.original.status;
        const colorClass = status === "Paid" ? "text-success" : "text-warning";
        return <span className={colorClass}>{info.getValue()} LKR</span>;
      },
    },
    {
      accessorKey: "discount",
      header: () => "Discount",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "method",
      header: () => "Method",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "status",
      header: () => "Status",
      cell: (info: any) => {
        const status = info.getValue();
        const colorClass = status === "Paid" ? "text-success" : "text-warning";
        const dotColor = status === "Paid" ? "#17c666" : "#ffa21d";
        return (
          <span className={colorClass}>
            <span style={{ color: dotColor }}>•</span> {status}
          </span>
        );
      },
    },
    {
      accessorKey: "issuedBy",
      header: () => "Issued By",
      cell: (info: any) => info.getValue(),
    },
  ];

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Error loading sales: {error}
      </div>
    );
  }

  const handleRefresh = () => {
    fetchSalesForSearch(filters, sorting);
  };

  return (
    <div>
      <DashboardTable
        data={salesData}
        columns={columns}
        serverSidePagination={false}
        totalItems={pagination.totalItems}
        currentPage={pagination.page}
        currentPageSize={pagination.pageSize}
        onPaginationChange={handlePaginationChange}
        onRefresh={handleRefresh}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
      />
    </div>
  );
};

export default RecentSalesList;
