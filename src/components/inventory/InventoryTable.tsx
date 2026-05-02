import React, {
  memo,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Table from "@/components/shared/table/Table";
import {
  FiEye,
  FiMoreHorizontal,
  FiShoppingCart,
  FiFilter,
} from "react-icons/fi";
import Dropdown from "@/components/shared/Dropdown";
import { useNavigate } from "react-router-dom";
import { inventoryService, InventoryItem } from "@/services/inventoryService";
import Swal from "sweetalert2";
import { FiRotateCw } from "react-icons/fi";
import {
  useReactTable,
  getCoreRowModel,
  Table as TanstackTable,
  Row,
} from "@tanstack/react-table";
import CustomTableSearch from "./CustomTableSearch";

type ProductTypeFilter = "All" | "Medicine" | "Glossary";
type StockStatusFilter = "All" | "In Stock" | "Out of Stock";

const InventoryTable: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productTypeFilter, setProductTypeFilter] =
    useState<ProductTypeFilter>("All");
  const [stockStatusFilter, setStockStatusFilter] =
    useState<StockStatusFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Fetch inventory items from API with pagination
  const fetchInventoryItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build search query - use debounced search query
      let query = debouncedSearchQuery.trim();
      if (productTypeFilter !== "All" && !query) {
        // If we have a filter but no search, we might need to handle it differently
        // For now, we'll just use the search query as the API might not support productType filter
        // You may need to adjust this based on your API
      }

      const response = await inventoryService.getInventoryList({
        page: currentPage,
        pageSize: pageSize,
        q: query || undefined,
      });

      setInventoryItems(response.data);
      setCurrentPage(response.currentPage);
      setPageSize(response.pageSize); // Update pageSize from API response
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load inventory items"
      );
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err instanceof Error ? err.message : "Failed to load inventory items",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchQuery, productTypeFilter]);

  // Debounce search query
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only set debounced query if searchQuery has actually changed
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch data when page, pageSize, debouncedSearchQuery, or filter changes
  useEffect(() => {
    fetchInventoryItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, debouncedSearchQuery, productTypeFilter]);

  // Handle filter change - reset to page 1
  const handleFilterChange = useCallback((filter: ProductTypeFilter) => {
    setProductTypeFilter(filter);
    setCurrentPage(1);
  }, []);

  // Handle stock status filter change - reset to page 1
  const handleStockStatusFilterChange = useCallback(
    (filter: StockStatusFilter) => {
      setStockStatusFilter(filter);
      setCurrentPage(1);
    },
    []
  );

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "I";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get stock status badge
  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) {
      return <span className="badge bg-danger">Out of Stock</span>;
    } else if (stock <= threshold) {
      return <span className="badge bg-warning">Low Stock</span>;
    } else {
      return <span className="badge bg-success">In Stock</span>;
    }
  };

  // Transform API data to table format
  // Note: Filtering is now done server-side via API
  const tableData = useMemo(() => {
    // Ensure inventoryItems is an array
    if (!inventoryItems || !Array.isArray(inventoryItems)) {
      return [];
    }

    // Client-side filter by productType and stockStatus if needed (if API doesn't support it)
    let filtered = inventoryItems;
    if (productTypeFilter !== "All") {
      filtered = filtered.filter(
        (item) => item.productType === productTypeFilter
      );
    }

    // Filter by stock status
    if (stockStatusFilter !== "All") {
      filtered = filtered.filter((item) => {
        if (stockStatusFilter === "Out of Stock") {
          return item.stock === 0;
        } else if (stockStatusFilter === "In Stock") {
          return item.stock > 0;
        }
        return true;
      });
    }

    return filtered.map((item) => ({
      id: item.productSku,
      productSku: item.productSku,
      name: item.name,
      stock: item.stock,
      unitPrice: item.unitPrice,
      lowStockThreshold: item.lowStockThreshold,
      productType: item.productType,
    }));
  }, [inventoryItems, productTypeFilter, stockStatusFilter]);

  // Product type filter dropdown actions
  const productTypeFilterActions = [
    {
      label: "All",
      onClick: () => handleFilterChange("All"),
    },
    {
      label: "Medicine",
      onClick: () => handleFilterChange("Medicine"),
    },
    {
      label: "Groceries",
      onClick: () => handleFilterChange("Glossary"),
    },
  ] as any[];

  // Stock status filter dropdown actions
  const stockStatusFilterActions = [
    {
      label: "All",
      onClick: () => handleStockStatusFilterChange("All"),
    },
    {
      label: "In Stock",
      onClick: () => handleStockStatusFilterChange("In Stock"),
    },
    {
      label: "Out of Stock",
      onClick: () => handleStockStatusFilterChange("Out of Stock"),
    },
  ] as any[];

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const columns = [
    {
      accessorKey: "id",
      header: ({ table }: { table: TanstackTable<any> }) => {
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
      cell: ({ row }: { row: Row<any> }) => (
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
        const productSku = info.row.original.productSku;
        const actions: Array<{
          label: string;
          icon: React.ReactNode;
          onClick: () => void;
        }> = [
          {
            label: "Make new purchase",
            icon: <FiShoppingCart />,
            onClick: () => {
              navigate("/purchasing/create");
            },
          },
        ];

        return (
          <div className="hstack gap-2 justify-content-end">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/inventory/view?sku=${productSku}`);
              }}
              className="avatar-text avatar-md"
              title="View Details"
            >
              <FiEye />
            </a>
            <Dropdown
              dropdownItems={actions as any}
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
      accessorKey: "productSku",
      header: () => "Product SKU",
      cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>,
    },
    {
      accessorKey: "name",
      header: () => "Product Name",
      cell: (info: any) => {
        const name = info.getValue();
        const productSku = info.row.original.productSku;
        return (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/inventory/view?sku=${productSku}`);
            }}
            className="hstack gap-3 text-decoration-none"
          >
            <div className="text-white avatar-text user-avatar-text avatar-md">
              {getInitials(name)}
            </div>
            <div>
              <span className="text-truncate-1-line">{name}</span>
            </div>
          </a>
        );
      },
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
      accessorKey: "stock",
      header: () => "Stock",
      cell: (info: any) => {
        const stock = info.getValue();
        const threshold = info.row.original.lowStockThreshold;
        return (
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold">{stock}</span>
            {getStockStatus(stock, threshold)}
          </div>
        );
      },
    },
    {
      accessorKey: "lowStockThreshold",
      header: () => "Low Stock Threshold",
      cell: (info: any) => (
        <span className="fw-semibold">{info.getValue()}</span>
      ),
    },
    {
      accessorKey: "unitPrice",
      header: () => "Unit Price",
      cell: (info: any) => (
        <span className="fw-semibold text-success">
          {info.getValue().toLocaleString()} LKR
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
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
      <div className="card">
        <div className="card-body text-center">
          <p className="text-danger">{error}</p>
          <button className="btn btn-primary" onClick={fetchInventoryItems}>
            <FiRotateCw className="me-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
                /* Hide default TableSearch from nested Table component and unwrap structure */
                .inventory-table-wrapper .inventory-table-content .col-lg-12 .dataTables_wrapper > .row:first-child {
                    display: none !important;
                }
                /* Hide default TablePagination from nested Table component */
                .inventory-table-wrapper .inventory-table-content .col-lg-12 .dataTables_wrapper > .row:last-child {
                    display: none !important;
                }
                .inventory-table-wrapper .inventory-table-content .col-lg-12 {
                    display: contents;
                }
                .inventory-table-wrapper .inventory-table-content .col-lg-12 .card {
                    display: contents;
                }
                .inventory-table-wrapper .inventory-table-content .col-lg-12 .card .card-body {
                    display: contents;
                }
                .inventory-table-wrapper .inventory-table-content .col-lg-12 .card .card-body .table-responsive {
                    display: contents;
                }
                .inventory-table-wrapper .inventory-table-content .col-lg-12 .card .card-body .table-responsive .dataTables_wrapper {
                    display: contents;
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
      <div className="col-lg-12">
        <div className="card stretch stretch-full function-table">
          <div className="card-body p-0">
            <div className="table-responsive">
              <div className="dataTables_wrapper dt-bootstrap5 no-footer inventory-table-wrapper">
                <CustomTableSearch
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  productTypeFilter={productTypeFilter}
                  productTypeFilterActions={productTypeFilterActions}
                  stockStatusFilter={stockStatusFilter}
                  stockStatusFilterActions={stockStatusFilterActions}
                  loading={loading}
                />
                <div className="inventory-table-content">
                  <Table data={tableData} columns={columns} />
                </div>
                {/* Custom Server-Side Pagination */}
                <div className="row gy-2 mt-3 px-3">
                  <div className="col-sm-12 col-md-5">
                    <div className="dataTables_info text-lg-start text-center">
                      Showing{" "}
                      {tableData.length > 0
                        ? (currentPage - 1) * pageSize + 1
                        : 0}{" "}
                      to {Math.min(currentPage * pageSize, totalItems)} of{" "}
                      {totalItems} entries
                    </div>
                  </div>
                  <div className="col-sm-12 col-md-7">
                    <div className="dataTables_paginate paging_simple_numbers">
                      <ul className="pagination mb-0 justify-content-md-end justify-content-center">
                        <li
                          className={`paginate_button page-item previous ${
                            currentPage <= 1 ? "disabled" : ""
                          }`}
                          onClick={() =>
                            currentPage > 1 && handlePageChange(currentPage - 1)
                          }
                        >
                          <a
                            href="#"
                            className="page-link"
                            onClick={(e) => e.preventDefault()}
                          >
                            Previous
                          </a>
                        </li>
                        {Array.from(
                          { length: Math.min(totalPages, 7) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 7) {
                              pageNum = i + 1;
                            } else if (currentPage <= 4) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 3) {
                              pageNum = totalPages - 6 + i;
                            } else {
                              pageNum = currentPage - 3 + i;
                            }

                            return (
                              <li
                                key={pageNum}
                                className={`paginate_button page-item ${
                                  currentPage === pageNum ? "active" : ""
                                }`}
                                onClick={() => handlePageChange(pageNum)}
                              >
                                <a
                                  href="#"
                                  className="page-link"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  {pageNum}
                                </a>
                              </li>
                            );
                          }
                        )}
                        <li
                          className={`paginate_button page-item next ${
                            currentPage >= totalPages ? "disabled" : ""
                          }`}
                          onClick={() =>
                            currentPage < totalPages &&
                            handlePageChange(currentPage + 1)
                          }
                        >
                          <a
                            href="#"
                            className="page-link"
                            onClick={(e) => e.preventDefault()}
                          >
                            Next
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* Page Size Selector */}
                <div className="row gy-2 px-3 pb-3">
                  <div className="col-sm-12 col-md-6">
                    <div className="dataTables_length d-flex justify-content-md-start justify-content-center">
                      <label className="d-flex align-items-center gap-1">
                        Show
                        <select
                          className="form-select form-select-sm w-auto pe-4"
                          value={pageSize}
                          onChange={(e) =>
                            handlePageSizeChange(Number(e.target.value))
                          }
                        >
                          {[10, 20, 30, 40, 50].map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                        entries
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;
