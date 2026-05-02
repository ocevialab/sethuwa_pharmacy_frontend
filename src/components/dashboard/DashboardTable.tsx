import React, { useState, useEffect } from "react";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  PaginationState,
  Updater,
  SortingState,
  Header,
} from "@tanstack/react-table";
import {
  FiFilter,
  FiMoreHorizontal,
  FiMoreVertical,
  FiSearch,
  FiRefreshCw,
} from "react-icons/fi";
import Dropdown from "@/components/shared/Dropdown";

// Extend ColumnMeta to include custom properties
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    className?: string;
    headerClassName?: string;
  }
}

interface FilterAction {
  label?: string;
  icon?: React.ReactNode;
  type?: string;
  onClick?: () => void;
}

interface SortAction {
  label: string;
  icon?: React.ReactNode;
}

interface DashboardTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  onPaginationChange?: (page: number, pageSize: number) => void;
  serverSidePagination?: boolean;
  totalItems?: number;
  currentPage?: number;
  currentPageSize?: number;
  onRefresh?: () => void;
  onFilterChange?: (filterType: string) => void;
  onSortChange?: (sortType: string) => void;
  onSearchChange?: (searchQuery: string) => void;
  title?: string;
  filterActions?: FilterAction[];
  sortActions?: SortAction[];
}

const defaultFilterActions = [
  { label: "All Sales", icon: <FiFilter /> },
  { label: "Paid", icon: <FiFilter /> },
  { label: "Due", icon: <FiFilter /> },
  { type: "divider" },
  { label: "Today", icon: <FiFilter /> },
  { label: "This Week", icon: <FiFilter /> },
  { label: "This Month", icon: <FiFilter /> },
];

const defaultSortActions = [
  { label: "Date (Newest)", icon: <FiFilter /> },
  { label: "Date (Oldest)", icon: <FiFilter /> },
  { label: "Price (High to Low)", icon: <FiFilter /> },
  { label: "Price (Low to High)", icon: <FiFilter /> },
];

const DashboardTable = <TData,>({
  data,
  columns,
  onPaginationChange,
  serverSidePagination = false,
  totalItems,
  currentPage,
  currentPageSize,
  onRefresh,
  onFilterChange,
  onSortChange,
  onSearchChange,
  title = "Recent Sales List",
  filterActions = defaultFilterActions,
  sortActions = defaultSortActions,
}: DashboardTableProps<TData>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: (currentPage || 1) - 1,
    pageSize: currentPageSize || 10,
  });
  const [expandedRows, setExpandedRows] = useState({});

  // Update pagination when props change (for server-side pagination or manually managed pagination)
  useEffect(() => {
    if (
      onPaginationChange !== undefined &&
      currentPage !== undefined &&
      currentPageSize !== undefined
    ) {
      setPagination({
        pageIndex: currentPage - 1,
        pageSize: currentPageSize,
      });
    }
  }, [onPaginationChange, currentPage, currentPageSize]);

  // Handle pagination change
  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const newPagination =
      typeof updater === "function" ? updater(pagination) : updater;
    setPagination(newPagination);

    // Call onPaginationChange if provided, regardless of serverSidePagination flag
    // This allows parent components to manage pagination manually even in client-side mode
    if (onPaginationChange) {
      onPaginationChange(newPagination.pageIndex + 1, newPagination.pageSize);
    }
  };

  // If onPaginationChange is provided, use manual pagination to let parent manage it
  // Otherwise, use react-table's built-in pagination
  const useManualPagination =
    serverSidePagination || onPaginationChange !== undefined;

  // Use external search if onSearchChange is provided, otherwise use react-table's built-in filtering
  const useExternalSearch = onSearchChange !== undefined;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: useExternalSearch ? "" : globalFilter,
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: useExternalSearch ? undefined : getFilteredRowModel(),
    onGlobalFilterChange: useExternalSearch ? undefined : setGlobalFilter,
    onSortingChange: setSorting,
    getPaginationRowModel: useManualPagination
      ? undefined
      : getPaginationRowModel(),
    onPaginationChange: handlePaginationChange,
    manualPagination: useManualPagination,
    pageCount:
      useManualPagination && totalItems
        ? Math.ceil(totalItems / pagination.pageSize)
        : undefined,
  });

  const totalEntries = serverSidePagination ? totalItems : data.length;

  // Generate page numbers - matching image format: 1, 2, ..., 8, 9
  const totalPages = table.getPageCount();
  const activePage =
    currentPage !== undefined ? currentPage : pagination.pageIndex + 1;
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      pages.push(2);
      // Add ellipsis if needed
      if (activePage > 4) {
        pages.push("...");
      }
      // Show pages around current page
      const startPage = Math.max(3, activePage - 1);
      const endPage = Math.min(totalPages - 1, activePage + 1);
      for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== 2 && !pages.includes(i)) {
          pages.push(i);
        }
      }
      // Add ellipsis if needed
      if (activePage < totalPages - 3) {
        pages.push("...");
      }
      // Always show last two pages
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
    <div className="col-lg-12">
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
                html.app-skin-dark .function-table table.dataTable tbody tr a {
                    color: #3454d1 !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr a:hover {
                    color: #4d6fe8 !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr .text-success {
                    color: #17c666 !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr .text-warning {
                    color: #ffa21d !important;
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
                html.app-skin-dark .function-table .search-icon {
                    color: #b1b4c0 !important;
                }
                .function-table .filter-dropdown {
                    position: relative;
                    z-index: 10;
                }
                .function-table .filter-dropdown .dropdown-menu {
                    z-index: 1050 !important;
                    position: absolute !important;
                    min-width: 250px !important;
                    max-width: 350px !important;
                }
                .function-table .filter-dropdown .dropdown-item {
                    white-space: normal !important;
                    word-wrap: break-word !important;
                    padding: 0.5rem 1rem !important;
                    line-height: 1.5 !important;
                }
                .function-table .filter-dropdown .dropdown-item span {
                    display: inline-block;
                    width: 100%;
                }
                .function-table .card {
                    position: relative;
                    z-index: 1;
                    overflow: visible;
                }
                .function-table .card-body {
                    overflow: visible;
                }
                .function-table table tbody tr td .badge {
                    white-space: nowrap;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>
      <div className="card stretch stretch-full function-table">
        <div className="card-body p-4">
          {/* Custom Search Header */}
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3 gap-3">
            <h5 className="mb-0">{title}</h5>
            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <div
                className="position-relative"
                style={{
                  minWidth: "200px",
                  maxWidth: "300px",
                  flex: "0 0 auto",
                }}
              >
                <FiSearch
                  className="position-absolute search-icon"
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
                  value={useExternalSearch ? globalFilter : globalFilter ?? ""}
                  onChange={(e) => {
                    const searchValue = e.target.value;
                    if (useExternalSearch && onSearchChange) {
                      setGlobalFilter(searchValue);
                      onSearchChange(searchValue);
                    } else {
                      setGlobalFilter(searchValue);
                    }
                  }}
                  placeholder="Search anything"
                  className="form-control form-control-sm ps-5"
                  style={{ width: "100%" }}
                />
              </div>
              {onRefresh && (
                <button
                  type="button"
                  className="btn btn-icon btn-light-brand"
                  onClick={onRefresh}
                  title="Refresh"
                >
                  <FiRefreshCw size={16} strokeWidth={1.6} />
                </button>
              )}
              <Dropdown
                {...({
                  dropdownItems: filterActions.map((action) =>
                    action.type === "divider"
                      ? action
                      : {
                          ...action,
                          onClick: () =>
                            onFilterChange &&
                            action.label &&
                            onFilterChange(action.label),
                        }
                  ),
                  triggerPosition: "0, 12",
                  triggerClass: "btn btn-icon btn-light-brand",
                  triggerIcon: <FiFilter size={16} strokeWidth={1.6} />,
                  isAvatar: false,
                } as any)}
              />
              <Dropdown
                {...({
                  dropdownItems: sortActions.map((action) => ({
                    ...action,
                    onClick: () => onSortChange && onSortChange(action.label),
                  })),
                  triggerPosition: "0, 12",
                  triggerClass: "btn btn-icon btn-light-brand",
                  triggerIcon: <FiFilter size={16} strokeWidth={1.6} />,
                  isAvatar: false,
                } as any)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <div className="dataTables_wrapper dt-bootstrap5 no-footer">
              <div className="row dt-row">
                <div className="col-sm-12 px-0">
                  <table
                    className="table table-hover dataTable no-footer"
                    id="dashboardSalesList"
                  >
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
                              <th
                                key={header.id}
                                className={
                                  header.column.columnDef.meta?.headerClassName
                                }
                              >
                                <ArrowToggle<TData> header={header}>
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </ArrowToggle>
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
                          {row.getVisibleCells().map((cell) => {
                            return (
                              <td
                                key={cell.id}
                                className={
                                  cell.column.columnDef.meta?.className
                                }
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Custom Pagination */}
              <div className="row gy-2 mt-3">
                <div className="col-sm-12 col-md-5 p-0">
                  <div className="dataTables_info text-lg-start text-center">
                    Showing of {totalEntries} Entries
                  </div>
                </div>
                <div className="col-sm-12 col-md-7 p-0">
                  <div className="dataTables_paginate paging_simple_numbers d-flex justify-content-md-end justify-content-center align-items-center gap-2">
                    <ul className="pagination mb-0">
                      <li
                        className={`paginate_button page-item previous ${
                          !table.getCanPreviousPage() ? "disabled" : ""
                        }`}
                      >
                        <a
                          href="#"
                          className="page-link"
                          onClick={(e) => {
                            e.preventDefault();
                            if (table.getCanPreviousPage()) {
                              table.previousPage();
                            }
                          }}
                        >
                          Prev
                        </a>
                      </li>
                      {getPageNumbers().map((page, index) => (
                        <li
                          key={index}
                          className={`paginate_button page-item ${
                            page === activePage ? "active" : ""
                          } ${page === "..." ? "disabled" : ""}`}
                        >
                          <a
                            href="#"
                            className="page-link"
                            onClick={(e) => {
                              e.preventDefault();
                              if (typeof page === "number") {
                                table.setPageIndex(page - 1);
                              }
                            }}
                          >
                            {page}
                          </a>
                        </li>
                      ))}
                      <li
                        className={`paginate_button page-item next ${
                          !table.getCanNextPage() ? "disabled" : ""
                        }`}
                      >
                        <a
                          href="#"
                          className="page-link"
                          onClick={(e) => {
                            e.preventDefault();
                            if (table.getCanNextPage()) {
                              table.nextPage();
                            }
                          }}
                        >
                          Next
                        </a>
                      </li>
                    </ul>
                    <div className="ms-2">
                      <select
                        className="form-select form-select-sm w-auto"
                        value={pagination.pageSize}
                        onChange={(e) => {
                          const newPageSize = Number(e.target.value);
                          // Reset to page 1 when page size changes
                          const newPagination = {
                            pageIndex: 0,
                            pageSize: newPageSize,
                          };
                          setPagination(newPagination);

                          // If onPaginationChange is provided, call it to let parent manage pagination
                          // This works for both server-side and manually managed client-side pagination
                          if (onPaginationChange) {
                            onPaginationChange(1, newPageSize);
                          } else {
                            // Otherwise, use react-table's built-in pagination
                            table.setPageSize(newPageSize);
                            table.setPageIndex(0);
                          }
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
  );
};

interface ArrowToggleProps<TData> {
  header: Header<TData, unknown>;
  children: React.ReactNode;
}

const ArrowToggle = <TData,>({ header, children }: ArrowToggleProps<TData>) => {
  const position = header.column.getIsSorted();
  return (
    <div
      className="table-head d-flex align-items-center gap-1"
      style={{
        cursor: header.column.getCanSort() ? "pointer" : "default",
      }}
      onClick={header.column.getToggleSortingHandler()}
    >
      {children}
      {header.column.getCanSort() && (
        <>
          {position === "asc" && <FaSortUp size={13} />}
          {position === "desc" && <FaSortDown size={13} />}
          {!position && <FaSort size={13} opacity={0.125} />}
        </>
      )}
    </div>
  );
};

export default DashboardTable;
