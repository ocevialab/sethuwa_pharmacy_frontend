import React, { memo, useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  FiMoreHorizontal,
  FiRotateCw,
  FiSearch,
  FiRefreshCw,
  FiEye,
} from "react-icons/fi";
import Dropdown from "@/components/shared/Dropdown";
import { useNavigate } from "react-router-dom";
import { inventoryService, InventoryItem } from "@/services/inventoryService";
import Swal from "sweetalert2";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";

// Separate component for checkbox header to avoid hooks issues
const CheckboxHeader = ({ table }: any) => {
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
};

const StockTable: React.FC = () => {
  const [stockItems, setStockItems] = useState<InventoryItem[]>([]);
  const [allStockItems, setAllStockItems] = useState<InventoryItem[]>([]); // Store all items for searching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<string>("name");
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch stock items from API
  const fetchStockItems = useCallback(
    async (page: number, pageSize: number, search?: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await inventoryService.getInventoryList({
          page,
          pageSize,
          q: search && search.trim() ? search.trim() : undefined,
        });

        setStockItems(response.data);
        setPagination({
          page: response.currentPage,
          pageSize: response.pageSize,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load stock items"
        );
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err instanceof Error ? err.message : "Failed to load stock items",
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch all stock items for searching (with large page size)
  const fetchAllStockItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data with a very large page size
      const response = await inventoryService.getInventoryList({
        page: 1,
        pageSize: 10000, // Large page size to get all items
      });

      setAllStockItems(response.data);
      // Update pagination info
      setPagination((prev) => ({
        ...prev,
        page: 1,
        totalItems: response.totalItems,
        totalPages: Math.ceil(response.totalItems / prev.pageSize),
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load stock items"
      );
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err instanceof Error ? err.message : "Failed to load stock items",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch - fetch all data for searching
  useEffect(() => {
    fetchAllStockItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch all data when search query is cleared
  useEffect(() => {
    if (!searchQuery.trim() && allStockItems.length === 0) {
      fetchAllStockItems();
    }
  }, [searchQuery, allStockItems.length, fetchAllStockItems]);

  // Handle pagination change
  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    if (searchQuery.trim()) {
      // Client-side pagination for filtered results
      setPagination({
        ...pagination,
        page: newPage,
        pageSize: newPageSize,
      });
    } else {
      // When no search, we still use allStockItems but paginate client-side
      // Or we could fetch specific page - but for consistency, let's use client-side pagination
      setPagination({
        ...pagination,
        page: newPage,
        pageSize: newPageSize,
      });
    }
  };

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handle search field change
  const handleSearchFieldChange = useCallback((field: string) => {
    setSearchField(field);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Client-side filtering based on search field and query
  // Always use allStockItems to search across all data
  const filteredStockItems = useMemo(() => {
    // Use allStockItems if available, otherwise fallback to stockItems
    const itemsToFilter = allStockItems.length > 0 ? allStockItems : stockItems;
    
    if (!searchQuery.trim()) {
      // When no search, return all items (will be paginated later)
      return itemsToFilter;
    }

    // When searching, filter from all items
    const query = searchQuery.trim().toLowerCase();
    
    return itemsToFilter.filter((item) => {
      let fieldValue: string | number | undefined;
      
      switch (searchField) {
        case "name":
          fieldValue = item.name;
          break;
        case "productSku":
          fieldValue = item.productSku;
          break;
        case "productType":
          fieldValue = item.productType;
          break;
        case "stock":
          fieldValue = item.stock;
          break;
        case "unitPrice":
          fieldValue = item.unitPrice;
          break;
        default:
          fieldValue = item.name;
      }

      if (fieldValue === null || fieldValue === undefined) {
        return false;
      }
      return String(fieldValue).toLowerCase().includes(query);
    });
  }, [stockItems, allStockItems, searchQuery, searchField]);

  // Transform filtered data to table format and paginate
  const displayData = useMemo(() => {
    const totalFiltered = filteredStockItems.length;
    const totalPages = Math.ceil(totalFiltered / pagination.pageSize) || 1;
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedData = filteredStockItems.slice(startIndex, endIndex);

    return paginatedData.map((item) => ({
      id: item.productSku,
      productSku: item.productSku,
      name: item.name,
      productType: item.productType,
      stock: item.stock,
      unitPrice: item.unitPrice,
      lowStockThreshold: item.lowStockThreshold,
    }));
  }, [filteredStockItems, pagination.page, pagination.pageSize]);

  // Calculate pagination info for filtered data
  const displayPagination = useMemo(() => {
    const totalFiltered = filteredStockItems.length;
    const totalPages = Math.ceil(totalFiltered / pagination.pageSize) || 1;
    
    return {
      totalItems: totalFiltered,
      totalPages,
      currentPage: pagination.page,
      pageSize: pagination.pageSize,
    };
  }, [filteredStockItems.length, pagination.page, pagination.pageSize]);

  // Memoize columns to prevent recreation on every render
  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: ({ table }: any) => <CheckboxHeader table={table} />,
        cell: ({ row }: any) => (
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
          const actions = [
            {
              label: "View Details",
              icon: <FiEye />,
              onClick: () => {
                navigate(`/inventory/view?productSku=${productSku}`);
              },
            },
          ] as any[];

          return (
            <div className="hstack gap-2 justify-content-end">
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
        header: () => "Name",
        cell: (info: any) => {
          const name = info.getValue();
          return (
            <div className="hstack gap-3">
              <div className="text-white avatar-text user-avatar-text avatar-md">
                {getInitials(name)}
              </div>
              <div>
                <span className="text-truncate-1-line">{name}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "productType",
        header: () => "Product Type",
        cell: (info: any) => (
          <span className="badge bg-info">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "stock",
        header: () => "Quantity",
        cell: (info: any) => {
          const stock = info.getValue();
          const lowStockThreshold = info.row.original.lowStockThreshold;
          const isLowStock = stock <= lowStockThreshold;
          return (
            <span className={`fw-semibold ${isLowStock ? 'text-danger' : 'text-success'}`}>
              {stock.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "unitPrice",
        header: () => "Price (LKR)",
        cell: (info: any) => (
          <span className="fw-semibold">{info.getValue().toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "lowStockThreshold",
        header: () => "Low Stock Threshold",
        cell: (info: any) => (
          <span className="fw-semibold">{info.getValue()}</span>
        ),
      },
    ],
    [navigate, getInitials]
  );

  const table = useReactTable({
    data: displayData,
    columns: columns.map((col) => ({
      ...col,
      enableSorting: col.accessorKey !== "id" && col.accessorKey !== "actions",
    })),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: displayPagination.totalPages,
  });

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
          <button
            className="btn btn-primary"
            onClick={() => fetchAllStockItems()}
          >
            <FiRotateCw className="me-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    fetchAllStockItems();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchQuery("");
  };

  // Generate page numbers
  const totalPages = displayPagination.totalPages;
  const currentPageNum = displayPagination.currentPage;
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push(2);
      if (currentPageNum > 4) {
        pages.push("...");
      }
      const startPage = Math.max(3, currentPageNum - 1);
      const endPage = Math.min(totalPages - 1, currentPageNum + 1);
      for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== 2 && !pages.includes(i)) {
          pages.push(i);
        }
      }
      if (currentPageNum < totalPages - 3) {
        pages.push("...");
      }
      if (!pages.includes(totalPages - 1)) {
        pages.push(totalPages - 1);
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div>
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
      <div className="col-lg-12">
        <div className="card stretch stretch-full function-table">
          <div className="card-body p-4">
            {/* Search and Actions Header */}
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3 gap-3">
              <h5 className="mb-0">Stock List</h5>
              <div className="d-flex align-items-center gap-2 flex-nowrap">
                <select
                  className="form-select form-select-sm"
                  value={searchField}
                  onChange={(e) => handleSearchFieldChange(e.target.value)}
                  style={{ width: "auto", minWidth: "150px" }}
                >
                  <option value="name">Name</option>
                  <option value="productSku">Product SKU</option>
                  <option value="productType">Product Type</option>
                  <option value="stock">Quantity</option>
                  <option value="unitPrice">Price</option>
                </select>
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
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search stock..."
                    className="form-control form-control-sm ps-5"
                    style={{ width: "100%" }}
                  />
                </div>
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

            {/* Table */}
            <div className="table-responsive">
              <div className="dataTables_wrapper dt-bootstrap5 no-footer">
                <div className="row dt-row">
                  <div className="col-sm-12 px-0">
                    <table className="table table-hover dataTable no-footer">
                      <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                              return (
                                <th
                                  key={header.id}
                                  className={
                                    (header.column.columnDef.meta as any)
                                      ?.headerClassName
                                  }
                                >
                                  {header.id === "id" ? (
                                    <div className="d-flex gap-2">
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                    </div>
                                  ) : (
                                    <div className="table-head d-flex align-items-center gap-1">
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                    </div>
                                  )}
                                </th>
                              );
                            })}
                          </tr>
                        ))}
                      </thead>
                      <tbody>
                        {table.getRowModel().rows.map((row) => (
                          <tr
                            key={row.id}
                            className="single-item chat-single-item"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td
                                key={cell.id}
                                className={
                                  (cell.column.columnDef.meta as any)?.className
                                }
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                <div className="row gy-2 mt-3">
                  <div className="col-sm-12 col-md-5 p-0">
                    <div className="dataTables_info text-lg-start text-center">
                      Showing{" "}
                      {displayPagination.totalItems > 0
                        ? (displayPagination.currentPage - 1) *
                            displayPagination.pageSize +
                          1
                        : 0}{" "}
                      to{" "}
                      {Math.min(
                        displayPagination.currentPage *
                          displayPagination.pageSize,
                        displayPagination.totalItems
                      )}{" "}
                      of {displayPagination.totalItems} entries
                      {searchQuery.trim() && displayPagination.totalItems !== allStockItems.length && (
                        <span className="text-muted">
                          {" "}
                          (filtered from {allStockItems.length} total)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-sm-12 col-md-7 p-0">
                    <div className="dataTables_paginate paging_simple_numbers d-flex justify-content-md-end justify-content-center align-items-center gap-2">
                      <ul className="pagination mb-0">
                        {(() => {
                          const displayPage = displayPagination.currentPage;
                          const displayTotalPages = displayPagination.totalPages;
                          const displayPageSize = displayPagination.pageSize;
                          const pageNumbers = getPageNumbers();

                          return (
                            <>
                              <li
                                className={`paginate_button page-item previous ${
                                  displayPage === 1 ? "disabled" : ""
                                }`}
                              >
                                <a
                                  href="#"
                                  className="page-link"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (displayPage > 1) {
                                      handlePaginationChange(
                                        displayPage - 1,
                                        displayPageSize
                                      );
                                    }
                                  }}
                                >
                                  Prev
                                </a>
                              </li>
                              {pageNumbers.map((page, index) => (
                                <li
                                  key={index}
                                  className={`paginate_button page-item ${
                                    page === displayPage ? "active" : ""
                                  } ${page === "..." ? "disabled" : ""}`}
                                >
                                  <a
                                    href="#"
                                    className="page-link"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (typeof page === "number") {
                                        handlePaginationChange(
                                          page,
                                          displayPageSize
                                        );
                                      }
                                    }}
                                  >
                                    {page}
                                  </a>
                                </li>
                              ))}
                              <li
                                className={`paginate_button page-item next ${
                                  displayPage >= displayTotalPages ? "disabled" : ""
                                }`}
                              >
                                <a
                                  href="#"
                                  className="page-link"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (displayPage < displayTotalPages) {
                                      handlePaginationChange(
                                        displayPage + 1,
                                        displayPageSize
                                      );
                                    }
                                  }}
                                >
                                  Next
                                </a>
                              </li>
                            </>
                          );
                        })()}
                      </ul>
                      <div className="ms-2">
                        <select
                          className="form-select form-select-sm w-auto"
                          value={pagination.pageSize}
                          onChange={(e) => {
                            const newPageSize = Number(e.target.value);
                            handlePaginationChange(1, newPageSize);
                          }}
                        >
                          {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                              Show {pageSize}
                            </option>
                          ))}
                        </select>
                      </div>
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

export default StockTable;

