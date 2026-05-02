import React, { memo, useEffect, useState, useCallback } from 'react'
import Table from '@/components/shared/table/Table';
import { FiMoreHorizontal, FiEye, FiEdit3, FiRotateCw, FiUserCheck, FiUserX } from 'react-icons/fi'
import Dropdown from '@/components/shared/Dropdown';
import { useNavigate } from 'react-router-dom';
import { supplierService, Supplier } from '@/services/supplierService';
import Swal from 'sweetalert2';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/context/AuthContext';

/** Matches API: "Active", "Inactive", case-insensitive */
function isSupplierActive(status: unknown): boolean {
    if (status == null || String(status).trim() === '') return true;
    return String(status).trim().toLowerCase() === 'active';
}

function isOwnerRole(role: unknown): boolean {
    if (role == null) return false;
    return String(role).trim().toLowerCase() === 'owner';
}

/** Backend activate/deactivate require supplier:update; UI also allows owner and common supplier manage perms */
function userCanSupplierUpdate(permissions: string[]): boolean {
    const normalized = permissions.map((p) => String(p).toLowerCase());
    const patterns = ['supplier:update', 'supplier:create', 'supplier:*', '*'];
    return patterns.some((pattern) => {
        const p = pattern.toLowerCase();
        if (p === '*') return normalized.includes('*');
        if (normalized.includes(p)) return true;
        if (pattern.endsWith('*')) {
            const prefix = p.slice(0, -1);
            return normalized.some((perm) => perm.startsWith(prefix));
        }
        return false;
    });
}

const SupplierTable: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [statusChangingId, setStatusChangingId] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { userPermissions } = useUserPermissions();

    const canUpdateStatus =
        isOwnerRole(user?.role) || userCanSupplierUpdate(userPermissions);

    // Fetch suppliers from API
    const fetchSuppliers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await supplierService.getAllSuppliers({
                page: currentPage,
                pageSize: pageSize,
            });
            setSuppliers(response.data);
            setCurrentPage(response.currentPage);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load suppliers');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to load suppliers',
            });
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleActivateSupplier = useCallback(
        async (supplierId: string, supplierName: string) => {
            const confirm = await Swal.fire({
                title: 'Activate supplier?',
                text: `Activate "${supplierName}"?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, activate',
                confirmButtonColor: '#3454d1',
            });
            if (!confirm.isConfirmed) return;
            try {
                setStatusChangingId(supplierId);
                await supplierService.activateSupplier(supplierId);
                await Swal.fire({
                    icon: 'success',
                    title: 'Supplier activated',
                    timer: 1600,
                    showConfirmButton: false,
                });
                await fetchSuppliers();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err instanceof Error ? err.message : 'Failed to activate supplier',
                });
            } finally {
                setStatusChangingId(null);
            }
        },
        [fetchSuppliers]
    );

    const handleDeactivateSupplier = useCallback(
        async (supplierId: string, supplierName: string) => {
            const confirm = await Swal.fire({
                title: 'Deactivate supplier?',
                text: `Deactivate "${supplierName}"? They may be hidden from purchasing until reactivated.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, deactivate',
                confirmButtonColor: '#dc3545',
            });
            if (!confirm.isConfirmed) return;
            try {
                setStatusChangingId(supplierId);
                await supplierService.deactivateSupplier(supplierId);
                await Swal.fire({
                    icon: 'success',
                    title: 'Supplier deactivated',
                    timer: 1600,
                    showConfirmButton: false,
                });
                await fetchSuppliers();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err instanceof Error ? err.message : 'Failed to deactivate supplier',
                });
            } finally {
                setStatusChangingId(null);
            }
        },
        [fetchSuppliers]
    );

    // Get initials for avatar
    const getInitials = (name: string) => {
        if (!name) return 'S';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Transform API data to table format
    const tableData = suppliers.map((supplier) => ({
        id: supplier.supplierId,
        supplierId: supplier.supplierId,
        supplierName: supplier.supplierName,
        contactPerson: supplier.contactPerson,
        contactNumber: supplier.contactNumber,
        emailAddress: supplier.emailAddress,
        address: supplier.address,
        bankName: supplier.bankName,
        supplierStatus: supplier.supplierStatus,
    }));

    const columns = [
        {
            accessorKey: 'actions',
            header: () => "Actions",
            cell: (info: any) => {
                const supplierId = info.row.original.supplierId as string;
                const supplierName = info.row.original.supplierName as string;
                const supplierStatus = info.row.original.supplierStatus;
                const active = isSupplierActive(supplierStatus);
                const busy = statusChangingId === supplierId;

                const actions = [
                    {
                        label: "View Details",
                        icon: <FiEye />,
                        onClick: () => {
                            navigate(`/supplier/view?id=${supplierId}`);
                        }
                    },
                    {
                        label: "Edit",
                        icon: <FiEdit3 />,
                        onClick: () => {
                            navigate(`/supplier/create?edit=${supplierId}`);
                        }
                    },
                ] as any[];

                if (canUpdateStatus && !busy) {
                    if (!active) {
                        actions.push({
                            label: "Activate",
                            icon: <FiUserCheck />,
                            onClick: () => {
                                void handleActivateSupplier(supplierId, supplierName);
                            },
                        });
                    } else {
                        actions.push({
                            label: "Deactivate",
                            icon: <FiUserX />,
                            onClick: () => {
                                void handleDeactivateSupplier(supplierId, supplierName);
                            },
                        });
                    }
                }

                return (
                    <div className="hstack gap-2 justify-content-start">
                        {busy && (
                            <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
                        )}
                        <Dropdown
                            dropdownItems={actions as any}
                            triggerClass='avatar-md'
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
                headerClassName: 'text-start',
                className: 'text-start',
                /** No sort UI — keeps "Actions" label left-aligned with the ⋮ menu below */
                noSort: true,
            },
        },
        {
            accessorKey: 'supplierId',
            header: () => 'Supplier ID',
            cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>
        },
        {
            accessorKey: 'supplierName',
            header: () => 'Supplier Name',
            cell: (info: any) => {
                const supplierName = info.getValue();
                const supplierId = info.row.original.supplierId;
                return (
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/supplier/view?id=${supplierId}`);
                        }}
                        className="text-decoration-none"
                    >
                        <span className="fw-semibold">{supplierName}</span>
                    </a>
                );
            }
        },
        {
            accessorKey: 'supplierStatus',
            header: () => 'Status',
            cell: (info: any) => {
                const raw = info.getValue();
                const active = isSupplierActive(raw);
                const label = raw != null && String(raw).trim() !== ''
                    ? String(raw).trim()
                    : (active ? 'Active' : 'Inactive');
                const supplierId = info.row.original.supplierId as string;
                const supplierName = info.row.original.supplierName as string;
                const busy = statusChangingId === supplierId;
                return (
                    <div className="d-flex flex-column align-items-start gap-1">
                        <span className={`badge ${active ? 'bg-success' : 'bg-secondary'}`}>
                            {label}
                        </span>
                        {canUpdateStatus && !busy && (
                            active ? (
                                <button
                                    type="button"
                                    className="btn btn-link btn-sm p-0 text-danger text-decoration-none"
                                    onClick={() => {
                                        void handleDeactivateSupplier(supplierId, supplierName);
                                    }}
                                >
                                    Deactivate
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-link btn-sm p-0 text-decoration-none"
                                    onClick={() => {
                                        void handleActivateSupplier(supplierId, supplierName);
                                    }}
                                >
                                    Activate
                                </button>
                            )
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'contactPerson',
            header: () => 'Contact Person',
            cell: (info: any) => <span>{info.getValue()}</span>
        },
        {
            accessorKey: 'contactNumber',
            header: () => 'Contact Number',
            cell: (info: any) => <span>{info.getValue()}</span>
        },
        {
            accessorKey: 'emailAddress',
            header: () => 'Email Address',
            cell: (info: any) => {
                const email = info.getValue();
                if (!email) return <span className="text-muted">N/A</span>;
                return (
                    <span 
                        className="text-truncate d-inline-block" 
                        style={{ maxWidth: '200px' }}
                        title={email}
                    >
                        {email}
                    </span>
                );
            }
        },
        {
            accessorKey: 'address',
            header: () => 'Address',
            cell: (info: any) => {
                const address = info.getValue();
                if (!address) return <span className="text-muted">N/A</span>;
                return (
                    <span 
                        className="text-truncate d-inline-block" 
                        style={{ maxWidth: '250px' }}
                        title={address}
                    >
                        {address}
                    </span>
                );
            }
        },
        {
            accessorKey: 'bankName',
            header: () => 'Bank Name',
            cell: (info: any) => {
                const bankName = info.getValue();
                return bankName ? <span>{bankName}</span> : <span className="text-muted">N/A</span>;
            }
        },
    ];

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
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
                    <button className="btn btn-primary" onClick={fetchSuppliers}>
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
                /* Custom scrollbar styling for supplier table */
                .function-table .table-responsive::-webkit-scrollbar {
                    width: 14px;
                    height: 14px;
                }
                .function-table .table-responsive::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 7px;
                }
                .function-table .table-responsive::-webkit-scrollbar-thumb {
                    background: #6c757d;
                    border-radius: 7px;
                    border: 2px solid #f1f1f1;
                }
                .function-table .table-responsive::-webkit-scrollbar-thumb:hover {
                    background: #5a6268;
                }
                /* Firefox scrollbar */
                .function-table .table-responsive {
                    scrollbar-width: thick;
                    scrollbar-color: #6c757d #f1f1f1;
                }
                /* Dark mode scrollbar */
                html.app-skin-dark .function-table .table-responsive::-webkit-scrollbar-track {
                    background: #1b2436;
                }
                html.app-skin-dark .function-table .table-responsive::-webkit-scrollbar-thumb {
                    background: #6c757d;
                    border: 2px solid #1b2436;
                }
                html.app-skin-dark .function-table .table-responsive::-webkit-scrollbar-thumb:hover {
                    background: #5a6268;
                }
                html.app-skin-dark .function-table .table-responsive {
                    scrollbar-color: #6c757d #1b2436;
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
            <Table data={tableData} columns={columns} />
        </div>
    );
};

export default SupplierTable;

