import React, { useState, useEffect, useCallback } from "react";
import { FiFilter } from "react-icons/fi";
import DashboardTable from "./DashboardTable";
import { inventoryService, InventoryItem, InventoryListResponse } from "@/services/inventoryService";

interface LowStockData {
  id: string;
  productSku: string;
  productName: string;
  productType: string;
  currentStock: number;
  lowStockThreshold: number;
  unitPrice: number;
  stockStatus: "Out of Stock" | "Low Stock";
}

const LowStockList = () => {
  const [allLowStockItems, setAllLowStockItems] = useState<LowStockData[]>([]); // Store all filtered items
  const [lowStockItems, setLowStockItems] = useState<LowStockData[]>([]); // Current page items
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
    stockStatus?: "Out of Stock" | "Low Stock";
  }>({});
  const [sorting, setSorting] = useState<{
    sortBy: string;
    sortDirection: string;
  }>({
    sortBy: "currentStock",
    sortDirection: "asc",
  });

  // Fetch all inventory items once (only called on mount or refresh)
  const fetchAllInventoryItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch inventory list - fetch all pages to get all items
      // Based on InventoryTable.tsx pattern: response.data contains the items array
      let allInventoryItems: InventoryItem[] = [];
      const fetchPageSize = 100;
      let currentPage = 1;
      let totalPages = 1;
      let hasMorePages = true;

      // Fetch all pages sequentially - fetch ALL items once
      while (hasMorePages) {
        try {
          const response = await inventoryService.getInventoryList({
            page: currentPage,
            pageSize: fetchPageSize,
          });

          // Check if response exists
          if (!response) {
            throw new Error("No response received from inventory API");
          }

          // Handle response structure - check both array and object formats
          let pageItems: InventoryItem[] = [];
          
          // Check if response is an array directly (unexpected but handle it)
          if (Array.isArray(response)) {
            pageItems = response;
            hasMorePages = false; // If array, assume it's all data
            console.log(`Page ${currentPage}: API returned array directly with ${pageItems.length} items`);
          } 
          // Check if response has data property (expected format)
          else if (response && typeof response === 'object' && 'data' in response) {
            const paginatedResponse = response as InventoryListResponse;
            if (Array.isArray(paginatedResponse.data)) {
              pageItems = paginatedResponse.data;
              totalPages = paginatedResponse.totalPages || 1;
              hasMorePages = currentPage < totalPages;
              console.log(`Page ${currentPage}/${totalPages}: Got ${pageItems.length} items`);
            } else {
              throw new Error("Response.data is not an array");
            }
          } else {
            // Log for debugging
            console.error("Unexpected response structure:", {
              type: typeof response,
              isArray: Array.isArray(response),
              keys: response && typeof response === 'object' ? Object.keys(response) : [],
              responseSample: JSON.stringify(response).substring(0, 200)
            });
            throw new Error(`Invalid response structure. Expected array or object with data property`);
          }

          // Add items to collection
          if (pageItems.length > 0) {
            allInventoryItems = [...allInventoryItems, ...pageItems];
          }

          // Stop if no more pages or no items returned
          if (!hasMorePages || pageItems.length === 0) {
            hasMorePages = false;
          } else {
            currentPage++;
          }

          // Safety check to prevent infinite loops
          if (currentPage > 1000) {
            console.warn("Reached maximum page limit, stopping");
            hasMorePages = false;
          }
        } catch (err) {
          console.error(`Error fetching page ${currentPage}:`, err);
          // If it's the first page, throw the error
          if (currentPage === 1) {
            throw err;
          }
          // Otherwise, stop fetching and use what we have
          hasMorePages = false;
        }
      }

      const inventoryItems = allInventoryItems;
      
      console.log(`✅ Fetched ${inventoryItems.length} total inventory items across ${totalPages} page(s)`);
      
      // Debug: Count items that should be included
      const outOfStockItems = inventoryItems.filter(i => (i.stock ?? 0) === 0);
      const lowStockItems = inventoryItems.filter(i => {
        const stock = i.stock ?? 0;
        const threshold = i.lowStockThreshold ?? 0;
        return stock > 0 && threshold > 0 && stock <= threshold;
      });
      console.log(`📊 Analysis: ${outOfStockItems.length} out of stock items, ${lowStockItems.length} low stock items expected`);

      // Filter items where stock <= lowStockThreshold
      // CRITICAL: Always include ALL items with stock = 0 (out of stock) regardless of threshold
      // Include ALL items where stock > 0 but stock <= lowStockThreshold
      const lowStockData: LowStockData[] = inventoryItems
        .filter(item => {
          if (!item) {
            return false;
          }
          
          const stock = typeof item.stock === 'number' ? item.stock : 0;
          const threshold = typeof item.lowStockThreshold === 'number' ? item.lowStockThreshold : 0;
          
          // ALWAYS include out of stock items (stock = 0) - this is critical
          if (stock === 0) {
            return true;
          }
          
          // Include items where stock is at or below threshold (and stock > 0)
          // This is the main low stock condition: stock > 0 AND stock <= threshold
          if (threshold > 0 && stock > 0 && stock <= threshold) {
            return true;
          }
          
          // If threshold is 0 or undefined but stock exists, don't include it
          // (only include if stock is actually 0, which is handled above)
          
          return false;
        })
        .map(item => ({
          id: item.productSku,
          productSku: item.productSku,
          productName: item.name || 'Unknown',
          productType: item.productType || 'Unknown',
          currentStock: item.stock ?? 0,
          lowStockThreshold: item.lowStockThreshold ?? 0,
          unitPrice: item.unitPrice ?? 0,
          stockStatus: (item.stock ?? 0) === 0 ? "Out of Stock" : "Low Stock",
        }));

      const outOfStockCount = lowStockData.filter(i => i.stockStatus === "Out of Stock").length;
      const lowStockCount = lowStockData.filter(i => i.stockStatus === "Low Stock").length;
      console.log(`Found ${lowStockData.length} low stock items (Out of Stock: ${outOfStockCount}, Low Stock: ${lowStockCount})`);

      // Store all low stock items (no filtering yet - will be done in applyFiltersAndPagination)
      setAllLowStockItems(lowStockData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch low stock items");
      console.error("Error fetching low stock items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters, sorting, and pagination to already-fetched data (client-side only)
  const applyFiltersAndPagination = useCallback((
    page: number,
    pageSize: number,
    filterParams?: { searchQuery?: string; stockStatus?: "Out of Stock" | "Low Stock" },
    sortParams?: { sortBy: string; sortDirection: string }
  ) => {
    const currentFilters = filterParams || filters;
    const currentSort = sortParams || sorting;

    // Start with all low stock items
    let filteredData = [...allLowStockItems];
    
    // Filter by stock status if specified
    if (currentFilters.stockStatus) {
      filteredData = filteredData.filter(item => item.stockStatus === currentFilters.stockStatus);
    }

    // Filter by search query if provided (client-side search)
    if (currentFilters.searchQuery && currentFilters.searchQuery.trim()) {
      const searchLower = currentFilters.searchQuery.toLowerCase().trim();
      filteredData = filteredData.filter(item => 
        item.productSku.toLowerCase().includes(searchLower) ||
        item.productName.toLowerCase().includes(searchLower) ||
        item.productType.toLowerCase().includes(searchLower)
      );
    }

    // Sort the data
    const sortedData = filteredData.sort((a, b) => {
      if (currentSort.sortBy === "currentStock") {
        return currentSort.sortDirection === "asc" 
          ? a.currentStock - b.currentStock 
          : b.currentStock - a.currentStock;
      } else if (currentSort.sortBy === "productName") {
        return currentSort.sortDirection === "asc"
          ? a.productName.localeCompare(b.productName)
          : b.productName.localeCompare(a.productName);
      } else if (currentSort.sortBy === "lowStockThreshold") {
        return currentSort.sortDirection === "asc"
          ? a.lowStockThreshold - b.lowStockThreshold
          : b.lowStockThreshold - a.lowStockThreshold;
      }
      // Default: sort by current stock ascending (lowest first)
      return a.currentStock - b.currentStock;
    });

    // Apply pagination (client-side)
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    setLowStockItems(paginatedData);
    setPagination({
      page,
      pageSize,
      totalItems: sortedData.length,
      totalPages: Math.ceil(sortedData.length / pageSize),
    });
  }, [allLowStockItems, filters, sorting]);

  // Initial fetch - get all items once
  useEffect(() => {
    fetchAllInventoryItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters, sorting, and pagination when data is loaded or filters/sorting change
  useEffect(() => {
    if (allLowStockItems.length > 0 && !loading) {
      applyFiltersAndPagination(pagination.page, pagination.pageSize, filters, sorting);
    }
  }, [allLowStockItems, filters, sorting, pagination.page, pagination.pageSize, applyFiltersAndPagination, loading]);

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
    if (filterType === "All") {
      setFilters({});
    } else if (filterType === "Out of Stock") {
      setFilters({ ...filters, stockStatus: "Out of Stock" });
    } else if (filterType === "Low Stock") {
      setFilters({ ...filters, stockStatus: "Low Stock" });
    }
  };

  // Handle sort change
  const handleSortChange = (sortType: string) => {
    if (sortType === "Stock (Low to High)") {
      setSorting({ sortBy: "currentStock", sortDirection: "asc" });
    } else if (sortType === "Stock (High to Low)") {
      setSorting({ sortBy: "currentStock", sortDirection: "desc" });
    } else if (sortType === "Name (A-Z)") {
      setSorting({ sortBy: "productName", sortDirection: "asc" });
    } else if (sortType === "Name (Z-A)") {
      setSorting({ sortBy: "productName", sortDirection: "desc" });
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
      accessorKey: "productType",
      header: () => "Type",
      cell: (info: any) => {
        const type = info.getValue();
        const color = type === "Medicine" ? "primary" : "info";
        return <span className={`badge bg-${color}`}>{type}</span>;
      },
    },
    {
      accessorKey: "currentStock",
      header: () => "Current Stock",
      cell: (info: any) => {
        const stock = info.getValue();
        return <span className="fw-semibold">{stock}</span>;
      },
    },
    {
      accessorKey: "lowStockThreshold",
      header: () => "Low Stock Threshold",
      cell: (info: any) => <span className="text-muted">{info.getValue()}</span>,
    },
    {
      accessorKey: "stockStatus",
      header: () => "Status",
      cell: (info: any) => {
        const status = info.getValue();
        const badgeClass = status === "Out of Stock" ? "bg-danger" : "bg-warning";
        return (
          <span className={`badge ${badgeClass}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "unitPrice",
      header: () => "Unit Price",
      cell: (info: any) => {
        const price = info.getValue();
        return <span>{price.toLocaleString()} LKR</span>;
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
        Error loading low stock items: {error}
      </div>
    );
  }

  const handleRefresh = () => {
    // Refetch all data from API
    fetchAllInventoryItems();
  };

  // Custom filter actions for low stock
  const filterActions = [
    { label: "All", icon: <FiFilter /> },
    { label: "Out of Stock", icon: <FiFilter /> },
    { label: "Low Stock", icon: <FiFilter /> },
  ];

  // Custom sort actions
  const sortActions = [
    { label: "Stock (Low to High)", icon: <FiFilter /> },
    { label: "Stock (High to Low)", icon: <FiFilter /> },
    { label: "Name (A-Z)", icon: <FiFilter /> },
    { label: "Name (Z-A)", icon: <FiFilter /> },
  ];

  return (
    <div>
      <DashboardTable
        data={lowStockItems}
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
        title="Low Stock Items"
        filterActions={filterActions}
        sortActions={sortActions}
      />
    </div>
  );
};

export default LowStockList;

