import React, { memo, useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  FiMoreHorizontal,
  FiTrash2,
  FiRotateCw,
  FiEdit3,
  FiSearch,
  FiRefreshCw,
} from "react-icons/fi";
import Dropdown from "@/components/shared/Dropdown";
import { useNavigate, Link } from "react-router-dom";
import { medicineService, Medicine } from "@/services/medicineService";
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

const MedicineTable: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]); // Store all medicines for searching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<{
    name?: string;
    brandName?: string;
    genericName?: string;
    category?: string;
    medicineId?: string;
    productSku?: string;
  }>({});
  const [sorting, setSorting] = useState<{
    sortBy: string;
    sortDirection: string;
  }>({
    sortBy: "name",
    sortDirection: "asc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<string>("name");
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch medicines from API
  const fetchMedicines = useCallback(
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

        const response = await medicineService.getAllMedicines({
          page,
          pageSize,
          sortBy: currentSort.sortBy,
          sortDirection: currentSort.sortDirection,
          ...currentFilters,
        });

        setMedicines(response.data);
        setPagination({
          page: response.currentPage,
          pageSize: response.pageSize,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load medicines"
        );
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err instanceof Error ? err.message : "Failed to load medicines",
        });
      } finally {
        setLoading(false);
      }
    },
    [filters, sorting]
  );

  // Fetch all medicines for searching (fetches all pages)
  const fetchAllMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, fetch the first page to get totalItems
      const firstPageResponse = await medicineService.getAllMedicines({
        page: 1,
        pageSize: 1000, // Use large page size to minimize requests
        sortBy: sorting.sortBy,
        sortDirection: sorting.sortDirection,
        ...filters,
      });
      
      let allMedicinesData = [...firstPageResponse.data];
      const totalItems = firstPageResponse.totalItems;
      const pageSize = 1000;
      const totalPages = Math.ceil(totalItems / pageSize);
      
      // If there are more pages, fetch them all
      if (totalPages > 1) {
        const remainingPages = [];
        for (let page = 2; page <= totalPages; page++) {
          remainingPages.push(
            medicineService.getAllMedicines({
              page,
              pageSize,
              sortBy: sorting.sortBy,
              sortDirection: sorting.sortDirection,
              ...filters,
            })
          );
        }
        
        // Fetch all remaining pages in parallel
        const remainingResponses = await Promise.all(remainingPages);
        
        // Combine all data
        remainingResponses.forEach((response) => {
          allMedicinesData = [...allMedicinesData, ...response.data];
        });
      }
      
      setAllMedicines(allMedicinesData);
      // Update pagination info
      setPagination({
        page: 1,
        pageSize: pagination.pageSize,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / pagination.pageSize),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load medicines"
      );
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err instanceof Error ? err.message : "Failed to load medicines",
      });
    } finally {
      setLoading(false);
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

  // Fetch all medicines when search query changes (for searching across all data)
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      // When searching, fetch all medicines for client-side filtering
      fetchAllMedicines();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

  // Refetch when filters or sorting change (only if not searching)
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      // When not searching, use normal pagination
      fetchMedicines(
        pagination.page,
        pagination.pageSize,
        filters,
        sorting
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sorting]);

  // Initial fetch
  useEffect(() => {
    fetchMedicines(
      pagination.page,
      pagination.pageSize,
      filters,
      sorting
    );
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
      fetchMedicines(newPage, newPageSize, filters, sorting);
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

  // Handle delete
  const handleDelete = useCallback(
    async (medicineId: string, name: string) => {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `Do you want to delete ${name}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ea4d4d",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        try {
          await medicineService.deleteMedicine(medicineId);
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Medicine has been deleted.",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchMedicines(
            pagination.page,
            pagination.pageSize,
            filters,
            sorting
          );
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text:
              err instanceof Error ? err.message : "Failed to delete medicine",
          });
        }
      }
    },
    [
      pagination.page,
      pagination.pageSize,
      filters,
      sorting,
      fetchMedicines,
    ]
  );

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "M";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Client-side filtering based on search field and query
  // Use allMedicines when searching, otherwise use medicines from current page
  const filteredMedicines = useMemo(() => {
    // Use allMedicines if searching, otherwise use medicines from current page
    const medicinesToFilter = debouncedSearchQuery.trim() ? allMedicines : medicines;
    
    if (!debouncedSearchQuery.trim()) {
      return medicinesToFilter;
    }

    const query = debouncedSearchQuery.trim().toLowerCase();
    return medicinesToFilter.filter((medicine) => {
      const fieldValue = medicine[searchField as keyof Medicine];
      if (fieldValue === null || fieldValue === undefined) {
        return false;
      }
      return String(fieldValue).toLowerCase().includes(query);
    });
  }, [medicines, allMedicines, debouncedSearchQuery, searchField]);

  // Transform API data to table format
  const tableData = filteredMedicines.map((medicine) => ({
    id: medicine.medicineId,
    medicineId: medicine.medicineId,
    name: medicine.name,
    brandName: medicine.brandName,
    genericName: medicine.genericName,
    manufacture: medicine.manufacture,
    category: medicine.category,
    strength: medicine.strength,
    requiredPrescription: medicine.requiredPrescription,
    lowStockThreshold: medicine.lowStockThreshold,
    productSku: medicine.productSku,
    isDeleted: medicine.isDeleted,
  }));

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
          const medicineId = info.row.original.medicineId;
          const name = info.row.original.name;
          const actions = [
            {
              label: "Edit",
              icon: <FiEdit3 />,
              onClick: () => {
                navigate(`/medicine/create?edit=${medicineId}`);
              },
            },
            {
              label: "Delete",
              icon: <FiTrash2 />,
              onClick: () => handleDelete(medicineId, name),
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
        accessorKey: "medicineId",
        header: () => "Medicine ID",
        cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>,
      },
      {
        accessorKey: "name",
        header: () => "Name",
        cell: (info: any) => {
          const name = info.getValue();
          const medicineId = info.row.original.medicineId;
          return (
            <Link
              to={`/medicine/create?edit=${medicineId}`}
              className="hstack gap-3 text-decoration-none"
            >
              <div className="text-white avatar-text user-avatar-text avatar-md">
                {getInitials(name)}
              </div>
              <div>
                <span className="text-truncate-1-line">{name}</span>
              </div>
            </Link>
          );
        },
      },
      {
        accessorKey: "brandName",
        header: () => "Brand Name",
        cell: (info: any) => <span>{info.getValue()}</span>,
      },
      {
        accessorKey: "genericName",
        header: () => "Generic Name",
        cell: (info: any) => <span>{info.getValue() || "N/A"}</span>,
      },
      {
        accessorKey: "category",
        header: () => "Category",
        cell: (info: any) => (
          <span className="badge bg-info">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "strength",
        header: () => "Strength",
        cell: (info: any) => <span>{info.getValue()}</span>,
      },
      {
        accessorKey: "requiredPrescription",
        header: () => "Prescription",
        cell: (info: any) => {
          const required = info.getValue();
          return (
            <span className={`badge ${required ? "bg-danger" : "bg-success"}`}>
              {required ? "Required" : "Not Required"}
            </span>
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
        accessorKey: "productSku",
        header: () => "Product SKU",
        cell: (info: any) => (
          <span className="badge bg-primary">{info.getValue() || "N/A"}</span>
        ),
      },
      {
        accessorKey: "isDeleted",
        header: () => "Status",
        cell: (info: any) => {
          const isDeleted = info.getValue();
          return (
            <span className={`badge ${isDeleted ? "bg-danger" : "bg-success"}`}>
              {isDeleted ? "Deleted" : "Active"}
            </span>
          );
        },
      },
    ],
    [navigate, handleDelete, getInitials]
  );

  // Map column IDs to API field names
  const getApiSortField = (columnId: string): string => {
    const fieldMap: { [key: string]: string } = {
      medicineId: "medicineId",
      name: "name",
      brandName: "brandName",
      genericName: "genericName",
      category: "category",
      strength: "strength",
      lowStockThreshold: "lowStockThreshold",
      productSku: "productSku",
    };
    return fieldMap[columnId] || columnId;
  };

  // Handle column sorting click
  const handleColumnSort = (columnId: string) => {
    const apiField = getApiSortField(columnId);
    const currentSortBy = sorting.sortBy;
    const currentDirection = sorting.sortDirection;

    if (currentSortBy === apiField) {
      // Toggle direction
      setSorting({
        sortBy: apiField,
        sortDirection: currentDirection === "asc" ? "desc" : "asc",
      });
    } else {
      // New column, default to asc
      setSorting({
        sortBy: apiField,
        sortDirection: "asc",
      });
    }
  };

  // Calculate pagination for filtered data (only when searching)
  const filteredPagination = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return null;
    }
    const totalFiltered = filteredMedicines.length;
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
  }, [tableData, filteredMedicines.length, pagination.page, pagination.pageSize, debouncedSearchQuery]);

  // Use filtered data when searching, otherwise use all medicines from current page
  const displayData = useMemo(() => {
    if (debouncedSearchQuery.trim() && filteredPagination) {
      return filteredPagination.data;
    }
    return tableData;
  }, [debouncedSearchQuery, filteredPagination, tableData]);

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
    pageCount: debouncedSearchQuery.trim() && filteredPagination 
      ? filteredPagination.totalPages 
      : pagination.totalPages,
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
            onClick={() =>
              fetchMedicines(
                pagination.page,
                pagination.pageSize,
                filters,
                sorting
              )
            }
          >
            <FiRotateCw className="me-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    fetchMedicines(
      pagination.page,
      pagination.pageSize,
      filters,
      sorting
    );
  };

  // Generate page numbers
  const totalPages = pagination.totalPages;
  const currentPageNum = pagination.page;
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
              <h5 className="mb-0">Medicine List</h5>
              <div className="d-flex align-items-center gap-2 flex-nowrap">
                <select
                  className="form-select form-select-sm"
                  value={searchField}
                  onChange={(e) => handleSearchFieldChange(e.target.value)}
                  style={{ width: "auto", minWidth: "150px" }}
                >
                  <option value="name">Name</option>
                  <option value="medicineId">Medicine ID</option>
                  <option value="brandName">Brand Name</option>
                  <option value="genericName">Generic Name</option>
                  <option value="category">Category</option>
                  <option value="productSku">Product SKU</option>
                  <option value="strength">Strength</option>
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
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }
                      }}
                      placeholder="Search medicines..."
                      className="form-control form-control-sm ps-5"
                      style={{ width: "100%" }}
                      autoComplete="off"
                      autoFocus
                    />
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
                              const columnId = header.column.id;
                              const isSortable =
                                columnId !== "id" && columnId !== "actions";
                              const apiField = getApiSortField(columnId);
                              const isSorted = sorting.sortBy === apiField;
                              const sortDirection = isSorted
                                ? sorting.sortDirection
                                : null;

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
                                    <div
                                      className="table-head d-flex align-items-center gap-1"
                                      style={{
                                        cursor: isSortable
                                          ? "pointer"
                                          : "default",
                                      }}
                                      onClick={() =>
                                        isSortable && handleColumnSort(columnId)
                                      }
                                    >
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                      {isSortable && (
                                        <>
                                          {sortDirection === "asc" && (
                                            <FaSortUp size={13} />
                                          )}
                                          {sortDirection === "desc" && (
                                            <FaSortDown size={13} />
                                          )}
                                          {!isSorted && (
                                            <FaSort size={13} opacity={0.125} />
                                          )}
                                        </>
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
                      {debouncedSearchQuery.trim() && filteredPagination ? (
                        <>
                          Showing{" "}
                          {filteredPagination.totalItems > 0
                            ? (filteredPagination.currentPage - 1) *
                                filteredPagination.pageSize +
                              1
                            : 0}{" "}
                          to{" "}
                          {Math.min(
                            filteredPagination.currentPage *
                              filteredPagination.pageSize,
                            filteredPagination.totalItems
                          )}{" "}
                          of {filteredPagination.totalItems} entries
                          {filteredPagination.totalItems !== pagination.totalItems && (
                            <span className="text-muted">
                              {" "}
                              (filtered from {pagination.totalItems} total)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          Showing {(pagination.page - 1) * pagination.pageSize + 1}{" "}
                          to{" "}
                          {Math.min(
                            pagination.page * pagination.pageSize,
                            pagination.totalItems
                          )}{" "}
                          of {pagination.totalItems} entries
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-sm-12 col-md-7 p-0">
                    <div className="dataTables_paginate paging_simple_numbers d-flex justify-content-md-end justify-content-center align-items-center gap-2">
                      <ul className="pagination mb-0">
                        {(() => {
                          const isFiltered = debouncedSearchQuery.trim() && filteredPagination;
                          const displayPagination = isFiltered
                            ? filteredPagination
                            : pagination;
                          const displayPage = isFiltered
                            ? filteredPagination!.currentPage
                            : pagination.page;
                          const displayTotalPages = displayPagination.totalPages;
                          const displayPageSize = displayPagination.pageSize;
                          const pageNumbers = isFiltered
                            ? (() => {
                                const pages = [];
                                if (displayTotalPages <= 9) {
                                  for (let i = 1; i <= displayTotalPages; i++) {
                                    pages.push(i);
                                  }
                                } else {
                                  pages.push(1);
                                  pages.push(2);
                                  if (displayPage > 4) {
                                    pages.push("...");
                                  }
                                  const startPage = Math.max(3, displayPage - 1);
                                  const endPage = Math.min(displayTotalPages - 1, displayPage + 1);
                                  for (let i = startPage; i <= endPage; i++) {
                                    if (i !== 1 && i !== 2 && !pages.includes(i)) {
                                      pages.push(i);
                                    }
                                  }
                                  if (displayPage < displayTotalPages - 3) {
                                    pages.push("...");
                                  }
                                  if (!pages.includes(displayTotalPages - 1)) {
                                    pages.push(displayTotalPages - 1);
                                  }
                                  if (!pages.includes(displayTotalPages)) {
                                    pages.push(displayTotalPages);
                                  }
                                }
                                return pages;
                              })()
                            : getPageNumbers();

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

export default MedicineTable;
