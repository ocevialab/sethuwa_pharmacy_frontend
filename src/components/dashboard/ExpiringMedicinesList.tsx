import React, { useState, useEffect, useCallback } from "react";
import { FiFilter } from "react-icons/fi";
import DashboardTable from "./DashboardTable";
import {
  inventoryService,
  InventoryItem,
  InventoryItemDetails,
  StockBatch,
} from "@/services/inventoryService";

interface ExpiringMedicineData {
  id: string;
  productSku: string;
  productName: string;
  expireDate: string;
  remainingDays: number;
  quantity: number;
  lotNumber: string;
}

const ExpiringMedicinesList = () => {
  const [allExpiringMedicines, setAllExpiringMedicines] = useState<
    ExpiringMedicineData[]
  >([]); // Store all items
  const [expiringMedicines, setExpiringMedicines] = useState<
    ExpiringMedicineData[]
  >([]); // Current page items
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
    maxDays?: number;
    expired?: boolean;
  }>({});
  const [sorting, setSorting] = useState<{
    sortBy: string;
    sortDirection: string;
  }>({
    sortBy: "remainingDays",
    sortDirection: "desc",
  });

  // Calculate remaining days until expiration
  const calculateRemainingDays = (expireDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expire = new Date(expireDate);
    expire.setHours(0, 0, 0, 0);
    const diffTime = expire.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  // Fetch all expiring medicines (only called on mount or refresh)
  const fetchAllExpiringMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch inventory list - get all items
      const inventoryResponse = await inventoryService.getInventoryList({
        page: 1,
        pageSize: 100,
      });

      // Check if response has data - with better error handling
      if (!inventoryResponse) {
        console.error(
          "Inventory response is null or undefined:",
          inventoryResponse
        );
        throw new Error("No response received from inventory API");
      }

      // Handle different possible response structures
      let inventoryItems: InventoryItem[] = [];

      if (Array.isArray(inventoryResponse)) {
        // If response is directly an array
        inventoryItems = inventoryResponse;
      } else if (
        inventoryResponse.data &&
        Array.isArray(inventoryResponse.data)
      ) {
        // If response has a data property with array
        inventoryItems = inventoryResponse.data;
      } else {
        console.error(
          "Unexpected inventory response structure:",
          inventoryResponse
        );
        throw new Error(
          `Invalid inventory response structure. Expected data array, got: ${JSON.stringify(
            inventoryResponse
          ).substring(0, 200)}`
        );
      }

      // Fetch details for items with stock > 0
      const allExpiringMedicines: ExpiringMedicineData[] = [];

      // Process items in batches to avoid too many simultaneous API calls
      const itemsWithStock = inventoryItems.filter(
        (item) => item && item.stock > 0
      );

      if (itemsWithStock.length === 0) {
        // No items with stock found
        setAllExpiringMedicines([]);
        setExpiringMedicines([]);
        setPagination({
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
        });
        setLoading(false);
        return;
      }

      // Limit to first 50 items to avoid too many API calls (can be increased if needed)
      const itemsToProcess = itemsWithStock.slice(0, 50);

      // Process items in parallel batches of 5 to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < itemsToProcess.length; i += batchSize) {
        const batch = itemsToProcess.slice(i, i + batchSize);
        const batchPromises = batch.map(async (item) => {
          try {
            const itemDetails: InventoryItemDetails =
              await inventoryService.getItemDetails(item.productSku);

            // Extract stock batches with expire dates
            if (
              itemDetails &&
              itemDetails.stockBatches &&
              Array.isArray(itemDetails.stockBatches) &&
              itemDetails.stockBatches.length > 0
            ) {
              const batches: ExpiringMedicineData[] = [];
              itemDetails.stockBatches.forEach((batch: StockBatch) => {
                if (batch && batch.expireDate && batch.quantityOnHand > 0) {
                  try {
                    const remainingDays = calculateRemainingDays(
                      batch.expireDate
                    );

                    // Include items expiring within 90 days or expired within last 30 days
                    if (remainingDays <= 90 && remainingDays >= -30) {
                      batches.push({
                        id: `${item.productSku}-${batch.stockId}`,
                        productSku: item.productSku,
                        productName: itemDetails.name || "Unknown",
                        expireDate: batch.expireDate,
                        remainingDays: remainingDays,
                        quantity: batch.quantityOnHand,
                        lotNumber: batch.lotNumber || "N/A",
                      });
                    }
                  } catch (dateErr) {
                    console.error(
                      `Error calculating remaining days for batch ${batch.stockId}:`,
                      dateErr
                    );
                  }
                }
              });
              return batches;
            }
            return [];
          } catch (err) {
            console.error(
              `Error fetching details for ${item.productSku}:`,
              err
            );
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((batches) => {
          allExpiringMedicines.push(...batches);
        });
      }

      // Store all expiring medicines (no filtering yet - will be done in applyFiltersAndPagination)
      setAllExpiringMedicines(allExpiringMedicines);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch expiring medicines"
      );
      console.error("Error fetching expiring medicines:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters, sorting, and pagination to already-fetched data (client-side only)
  const applyFiltersAndPagination = useCallback(
    (
      page: number,
      pageSize: number,
      filterParams?: {
        searchQuery?: string;
        maxDays?: number;
        expired?: boolean;
      },
      sortParams?: { sortBy: string; sortDirection: string }
    ) => {
      const currentFilters = filterParams || filters;
      const currentSort = sortParams || sorting;

      // Start with all expiring medicines
      let filteredData = [...allExpiringMedicines];

      // Apply filters
      if (
        currentFilters.maxDays !== undefined &&
        currentFilters.maxDays !== null
      ) {
        filteredData = filteredData.filter(
          (item) =>
            item.remainingDays >= 0 &&
            item.remainingDays <= currentFilters.maxDays!
        );
      }

      if (currentFilters.expired === true) {
        filteredData = filteredData.filter((item) => item.remainingDays < 0);
      }

      // Filter by search query if provided (client-side search)
      if (currentFilters.searchQuery && currentFilters.searchQuery.trim()) {
        const searchLower = currentFilters.searchQuery.toLowerCase().trim();
        filteredData = filteredData.filter(
          (item) =>
            item.productSku.toLowerCase().includes(searchLower) ||
            item.productName.toLowerCase().includes(searchLower) ||
            item.lotNumber.toLowerCase().includes(searchLower)
        );
      }

      // Sort the data
      const sortedData = filteredData.sort((a, b) => {
        if (currentSort.sortBy === "remainingDays") {
          if (a.remainingDays < 0 && b.remainingDays >= 0) return -1;
          if (a.remainingDays >= 0 && b.remainingDays < 0) return 1;
          if (a.remainingDays < 0 && b.remainingDays < 0) {
            return currentSort.sortDirection === "asc"
              ? b.remainingDays - a.remainingDays
              : a.remainingDays - b.remainingDays;
          }
          return currentSort.sortDirection === "asc"
            ? a.remainingDays - b.remainingDays
            : b.remainingDays - a.remainingDays;
        } else if (currentSort.sortBy === "expireDate") {
          return currentSort.sortDirection === "asc"
            ? new Date(a.expireDate).getTime() -
                new Date(b.expireDate).getTime()
            : new Date(b.expireDate).getTime() -
                new Date(a.expireDate).getTime();
        } else if (currentSort.sortBy === "productName") {
          return currentSort.sortDirection === "asc"
            ? a.productName.localeCompare(b.productName)
            : b.productName.localeCompare(a.productName);
        }
        // Default: sort by remaining days ascending
        if (a.remainingDays < 0 && b.remainingDays >= 0) return -1;
        if (a.remainingDays >= 0 && b.remainingDays < 0) return 1;
        return a.remainingDays - b.remainingDays;
      });

      // Apply pagination (client-side)
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = sortedData.slice(startIndex, endIndex);

      setExpiringMedicines(paginatedData);
      setPagination({
        page,
        pageSize,
        totalItems: sortedData.length,
        totalPages: Math.ceil(sortedData.length / pageSize),
      });
    },
    [allExpiringMedicines, filters, sorting]
  );

  // Initial fetch - get all items once
  useEffect(() => {
    fetchAllExpiringMedicines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters, sorting, and pagination when data is loaded or filters/sorting change
  useEffect(() => {
    if (allExpiringMedicines.length > 0 && !loading) {
      applyFiltersAndPagination(
        pagination.page,
        pagination.pageSize,
        filters,
        sorting
      );
    }
  }, [
    allExpiringMedicines,
    filters,
    sorting,
    pagination.page,
    pagination.pageSize,
    applyFiltersAndPagination,
    loading,
  ]);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [filters, sorting]);

  // Handle pagination change from DashboardTable (client-side only, no API call)
  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    applyFiltersAndPagination(newPage, newPageSize, filters, sorting);
  };

  // Handle filter change
  const handleFilterChange = (filterType: string) => {
    // For now, filters are handled via search
    setFilters({});
  };

  // Handle sort change
  const handleSortChange = (sortType: string) => {
    if (sortType === "Date (Newest)") {
      setSorting({ sortBy: "expireDate", sortDirection: "desc" });
    } else if (sortType === "Date (Oldest)") {
      setSorting({ sortBy: "expireDate", sortDirection: "asc" });
    } else if (sortType === "Remaining Days (Low to High)") {
      setSorting({ sortBy: "remainingDays", sortDirection: "asc" });
    } else if (sortType === "Remaining Days (High to Low)") {
      setSorting({ sortBy: "remainingDays", sortDirection: "desc" });
    }
  };

  // Handle search change - search across all records
  const handleSearchChange = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim() || undefined;
    setFilters((prev) => ({
      ...prev,
      searchQuery: trimmedQuery,
    }));
    // Reset to page 1 when search changes
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const columns: any[] = [
    {
      accessorKey: "productSku",
      header: () => "Product SKU",
      cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>,
    },
    {
      accessorKey: "productName",
      header: () => "Product Name",
      cell: (info: any) => info.getValue(),
    },
    {
      accessorKey: "lotNumber",
      header: () => "Lot Number",
      cell: (info: any) => (
        <span className="text-muted">{info.getValue()}</span>
      ),
    },
    {
      accessorKey: "quantity",
      header: () => "Quantity",
      cell: (info: any) => <span>{info.getValue()}</span>,
    },
    {
      accessorKey: "expireDate",
      header: () => "Expire Date",
      cell: (info: any) => formatDate(info.getValue()),
    },
    {
      accessorKey: "remainingDays",
      header: () => "Remaining Days",
      cell: (info: any) => {
        const days = info.getValue();
        let colorClass = "text-success";
        let badgeClass = "bg-success";

        if (days < 0) {
          colorClass = "text-danger";
          badgeClass = "bg-danger";
        } else if (days <= 7) {
          colorClass = "text-danger";
          badgeClass = "bg-danger";
        } else if (days <= 30) {
          colorClass = "text-warning";
          badgeClass = "bg-warning";
        }

        return (
          <span className={`badge ${badgeClass}`}>
            {days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days`}
          </span>
        );
      },
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
        Error loading expiring medicines: {error}
      </div>
    );
  }

  const handleRefresh = () => {
    // Refetch all data from API
    fetchAllExpiringMedicines();
  };

  // Custom filter actions for expiring medicines
  const filterActions = [
    { label: "All", icon: <FiFilter /> },
    { label: "Expiring Soon (≤7 days)", icon: <FiFilter /> },
    { label: "Expiring This Month (≤30 days)", icon: <FiFilter /> },
    { type: "divider" },
    { label: "Expired", icon: <FiFilter /> },
  ];

  // Custom sort actions
  const sortActions = [
    { label: "Remaining Days (Low to High)", icon: <FiFilter /> },
    { label: "Remaining Days (High to Low)", icon: <FiFilter /> },
    { label: "Date (Newest)", icon: <FiFilter /> },
    { label: "Date (Oldest)", icon: <FiFilter /> },
  ];

  // Update handleFilterChange to actually filter the data
  const handleFilterChangeWithLogic = (filterType: string) => {
    // Reset to page 1 when filter changes
    setPagination((prev) => ({ ...prev, page: 1 }));

    if (filterType === "All") {
      // Clear all filters - preserve search query if exists
      setFilters((prev) => {
        const newFilters: { searchQuery?: string } = {};
        if (prev.searchQuery) {
          newFilters.searchQuery = prev.searchQuery;
        }
        return newFilters;
      });
    } else if (filterType === "Expiring Soon (≤7 days)") {
      // Set maxDays to 7, clear expired filter
      setFilters((prev) => ({
        ...prev,
        maxDays: 7,
        expired: undefined,
      }));
    } else if (filterType === "Expiring This Month (≤30 days)") {
      // Set maxDays to 30, clear expired filter
      setFilters((prev) => ({
        ...prev,
        maxDays: 30,
        expired: undefined,
      }));
    } else if (filterType === "Expired") {
      // Set expired to true, clear maxDays filter
      setFilters((prev) => ({
        ...prev,
        expired: true,
        maxDays: undefined,
      }));
    } else {
      handleFilterChange(filterType);
    }
  };

  return (
    <div>
      <DashboardTable
        data={expiringMedicines}
        columns={columns}
        serverSidePagination={false}
        totalItems={pagination.totalItems}
        currentPage={pagination.page}
        currentPageSize={pagination.pageSize}
        onPaginationChange={handlePaginationChange}
        onRefresh={handleRefresh}
        onFilterChange={handleFilterChangeWithLogic}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        title="Expiring Medicines"
        filterActions={filterActions}
        sortActions={sortActions}
      />
    </div>
  );
};

export default ExpiringMedicinesList;
