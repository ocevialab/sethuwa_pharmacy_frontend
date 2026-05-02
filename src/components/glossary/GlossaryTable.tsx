import React, { memo, useEffect, useState, useCallback } from "react";
import Table from "@/components/shared/table/Table";
import {
  FiMoreHorizontal,
  FiTrash2,
  FiRotateCw,
  FiEdit3,
} from "react-icons/fi";
import Dropdown from "@/components/shared/Dropdown";
import { useNavigate } from "react-router-dom";
import { glossaryService, Glossary } from "@/services/glossaryService";
import Swal from "sweetalert2";

const GlossaryTable: React.FC = () => {
  const [glossaries, setGlossaries] = useState<Glossary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  // Fetch glossaries from API
  const fetchGlossaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await glossaryService.getAllGlossaries({
        page: currentPage,
        pageSize: pageSize,
      });
      setGlossaries(response.data);
      setCurrentPage(response.currentPage);
      setTotalItems(response.totalItems);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groceries");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err instanceof Error ? err.message : "Failed to load groceries",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchGlossaries();
  }, [fetchGlossaries]);

  // Handle delete
  const handleDelete = async (glossaryId: string, name: string) => {
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
        await glossaryService.deleteGlossary(glossaryId);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Grocery has been deleted.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchGlossaries();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err instanceof Error ? err.message : "Failed to delete grocery",
        });
      }
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "G";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Transform API data to table format
  const tableData = glossaries.map((glossary) => ({
    id: glossary.glossaryId,
    glossaryId: glossary.glossaryId,
    name: glossary.name,
    brandName: glossary.brandName,
    lowStockThreshold: glossary.lowStockThreshold,
    productSku: glossary.productSku,
    isDeleted: glossary.isDeleted,
  }));

  const columns = [
    {
      accessorKey: "id",
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
        headerClassName: "width-30",
      },
    },
    {
      accessorKey: "glossaryId",
      header: () => "Grocery ID",
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
      accessorKey: "brandName",
      header: () => "Brand Name",
      cell: (info: any) => <span>{info.getValue()}</span>,
    },
    {
      accessorKey: "productSku",
      header: () => "Product SKU",
      cell: (info: any) => (
        <span className="badge bg-primary">{info.getValue() || "N/A"}</span>
      ),
    },
    {
      accessorKey: "lowStockThreshold",
      header: () => "Low Stock Threshold",
      cell: (info: any) => (
        <span className="fw-semibold">{info.getValue()}</span>
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
    {
      accessorKey: "actions",
      header: () => "Actions",
      cell: (info: any) => {
        const glossaryId = info.row.original.glossaryId;
        const name = info.row.original.name;
        const actions = [
          {
            label: "Edit",
            icon: <FiEdit3 />,
            onClick: () => {
              navigate(`/glossary/create?edit=${glossaryId}`);
            },
          },
          {
            label: "Delete",
            icon: <FiTrash2 />,
            onClick: () => handleDelete(glossaryId, name),
          },
        ] as any[];

        return (
          <div className="hstack gap-2 justify-content-end">
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
          <button className="btn btn-primary" onClick={fetchGlossaries}>
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
      <Table data={tableData} columns={columns} />
    </div>
  );
};

export default GlossaryTable;
