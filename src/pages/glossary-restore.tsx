import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { glossaryService, Glossary } from "@/services/glossaryService";
import Swal from "sweetalert2";
import Table from "@/components/shared/table/Table";
import { FiMoreHorizontal, FiRotateCw } from "react-icons/fi";
import Dropdown from "@/components/shared/Dropdown";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import Footer from "@/components/shared/Footer";

const GlossaryRestore: React.FC = () => {
  const [glossaries, setGlossaries] = useState<Glossary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch deleted glossaries
  const fetchDeletedGlossaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const deletedItems = await glossaryService.getDeletedGlossaries();
      setGlossaries(deletedItems);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load deleted groceries"
      );
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to load deleted groceries",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedGlossaries();
  }, [fetchDeletedGlossaries]);

  // Handle restore
  const handleRestore = async (glossaryId: string, name: string) => {
    const result = await Swal.fire({
      title: "Restore Groceries?",
      text: `Do you want to restore ${name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#17c666",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, restore it!",
    });


    
    if (result.isConfirmed) {
      try {
        await glossaryService.restoreGlossary(glossaryId);
        Swal.fire({
          icon: "success",
          title: "Restored!",
          text: "Grocery has been restored.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchDeletedGlossaries();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            err instanceof Error ? err.message : "Failed to restore grocery",
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
      accessorKey: "actions",
      header: () => "Actions",
      cell: (info: any) => {
        const glossaryId = info.row.original.glossaryId;
        const name = info.row.original.name;
        const actions = [
          {
            label: "Restore",
            icon: <FiRotateCw />,
            onClick: () => handleRestore(glossaryId, name),
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
      <>
        <PageHeader>
          <div></div>
        </PageHeader>
        <div className="main-content">
          <div className="row">
            <div className="col-12">
              <div
                className="d-flex align-items-center justify-content-center"
                style={{ minHeight: "400px" }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader>
          <div></div>
        </PageHeader>
        <div className="main-content">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <p className="text-danger">{error}</p>
                  <button
                    className="btn btn-primary"
                    onClick={fetchDeletedGlossaries}
                  >
                    <FiRotateCw className="me-2" />
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
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
      <PageHeader>
        <div></div>
      </PageHeader>
      <div className="main-content">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Restore Groceries</h5>
              </div>
              <div className="card-body">
                {glossaries.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">
                      There are no deleted groceries to restore at this time.
                    </p>
                  </div>
                ) : (
                  <Table data={tableData} columns={columns} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default GlossaryRestore;
