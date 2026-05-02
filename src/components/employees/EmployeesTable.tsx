import React, { memo, useEffect, useState, useCallback, useMemo } from 'react'
import Table from '@/components/shared/table/Table';
import { FiEdit3, FiMoreHorizontal, FiTrash2, FiRotateCw, FiUserCheck } from 'react-icons/fi'
import Dropdown from '@/components/shared/Dropdown';
import SelectDropdown from '@/components/shared/SelectDropdown';
import { Link, useNavigate } from 'react-router-dom';
import { employeeService, Employee } from '@/services/employeeService';
import { employeeListStatusOptions } from '@/utils/options';
import Swal from 'sweetalert2';
import { tokenManager } from '@/utils/tokenManager';
import { useAuth } from '@/context/AuthContext';

interface TableCellProps {
    options: any[];
    defaultSelect: string;
    onStatusChange?: (employeeId: string, newStatus: string) => void;
    employeeId?: string;
}

const TableCell: React.FC<TableCellProps> = memo(({ options, defaultSelect, onStatusChange, employeeId }) => {
    const [selectedOption, setSelectedOption] = useState(
        options?.find(opt => opt.value === defaultSelect?.toLowerCase()) || null
    );

    const handleStatusChange = (option: any) => {
        setSelectedOption(option);
        if (onStatusChange && employeeId) {
            onStatusChange(employeeId, option.value);
        }
    };

    return (
        <SelectDropdown
            options={options}
            defaultSelect={defaultSelect}
            selectedOption={selectedOption}
            onSelectOption={handleStatusChange}
        />
    );
});

TableCell.displayName = 'TableCell';

/** Match API / JSON variants: "Inactive", "inactive", trimmed, etc. */
function isInactiveEmployeeStatus(status: unknown): boolean {
    if (status == null) return false;
    return String(status).trim().toLowerCase() === 'inactive';
}

function isOwnerRole(role: unknown): boolean {
    if (role == null) return false;
    return String(role).trim().toLowerCase() === 'owner';
}

const EmployeesTable: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    /** Set while DELETE /Employee/{id} is in progress (row UX + modal loading) */
    const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
    /** Rows selected via table checkboxes (table row shape) */
    const [selectedRows, setSelectedRows] = useState<
        { employeeId: string; status: string; employeeName: string }[]
    >([]);
    /** Increment to clear table row selection (passed to Table) */
    const [selectionResetKey, setSelectionResetKey] = useState(0);
    const [bulkActivating, setBulkActivating] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Fetch employees from API
    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await employeeService.getAllEmployees();
            setEmployees(data);
            setSelectionResetKey((k) => k + 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load employees');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to load employees',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // Handle status change
    const handleStatusChange = async (employeeId: string, newStatus: string) => {
        try {
            const employee = employees.find(e => e.employeeId === employeeId);
            if (!employee) return;

            const status: 'Active' | 'Inactive' = newStatus === 'active' ? 'Active' : 'Inactive';

            if (
                status === 'Inactive' &&
                user?.employeeId === employeeId &&
                isOwnerRole(user.role)
            ) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Not allowed',
                    text: 'You cannot deactivate your own owner account.',
                    confirmButtonColor: '#3454d1',
                });
                return;
            }

            await employeeService.updateEmployee(employeeId, {
                ...employee,
                employeeStatus: status,
            });

            // Check if the deactivated employee is the current user
            const currentUser = tokenManager.getUser();
            if (status === 'Inactive' && currentUser && currentUser.employeeId === employeeId) {
                // Current user was deactivated - log them out immediately
                Swal.fire({
                    icon: 'warning',
                    title: 'Account Deactivated',
                    text: 'Your account has been deactivated. You will be logged out.',
                    timer: 3000,
                    showConfirmButton: false,
                }).then(() => {
                    logout();
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Employee status updated successfully',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }

            fetchEmployees();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to update employee status',
            });
        }
    };

    // Handle delete — DELETE /api/Employee/{id} (204 = success; 404/500 = plain text body)
    const handleDelete = async (employeeId: string, employeeName: string) => {
        const confirm = await Swal.fire({
            title: 'Delete employee?',
            html: `This will remove <strong>${employeeName}</strong> from the list.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ea4d4d',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
        });

        if (!confirm.isConfirmed) return;

        setDeletingEmployeeId(employeeId);
        Swal.fire({
            title: 'Deleting employee...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            await employeeService.deleteEmployee(employeeId);
            Swal.close();
            setDeletingEmployeeId(null);
            await Swal.fire({
                icon: 'success',
                title: 'Employee deleted',
                text: 'The employee has been removed successfully.',
                timer: 2500,
                showConfirmButton: true,
            });
            fetchEmployees();
        } catch (err) {
            Swal.close();
            setDeletingEmployeeId(null);
            const message =
                err instanceof Error
                    ? err.message
                    : 'An unexpected error occurred while deleting the employee.';
            await Swal.fire({
                icon: 'error',
                title: 'Delete failed',
                text: message,
                confirmButtonColor: '#3454d1',
            });
        }
    };

    const onSelectedRowsChange = useCallback(
        (rows: { employeeId: string; status: string; employeeName: string }[]) => {
            setSelectedRows(rows);
        },
        []
    );

    const getRowId = useCallback((row: { employeeId: string }) => row.employeeId, []);

    /** Selected IDs — use `employees` for status (API truth), not row copies */
    const selectedEmployeeIds = useMemo(
        () => new Set(selectedRows.map((r) => r.employeeId).filter(Boolean)),
        [selectedRows]
    );

    /** At least one selected employee is inactive → show bulk Activate */
    const hasInactiveSelected = useMemo(
        () =>
            employees.some(
                (e) =>
                    e.employeeId != null &&
                    selectedEmployeeIds.has(e.employeeId) &&
                    isInactiveEmployeeStatus(e.employeeStatus)
            ),
        [employees, selectedEmployeeIds]
    );

    const inactiveSelectedCount = useMemo(
        () =>
            employees.filter(
                (e) =>
                    e.employeeId != null &&
                    selectedEmployeeIds.has(e.employeeId) &&
                    isInactiveEmployeeStatus(e.employeeStatus)
            ).length,
        [employees, selectedEmployeeIds]
    );

    // Bulk activate selected inactive employees
    const handleBulkActivate = async () => {
        const toActivate = employees.filter(
            (e) =>
                e.employeeId != null &&
                selectedEmployeeIds.has(e.employeeId) &&
                isInactiveEmployeeStatus(e.employeeStatus)
        );
        if (toActivate.length === 0) return;

        const confirm = await Swal.fire({
            title: 'Activate employees?',
            html: `Set <strong>${toActivate.length}</strong> inactive employee(s) to <strong>Active</strong>?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#17c666',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, activate',
            cancelButtonText: 'Cancel',
        });

        if (!confirm.isConfirmed) return;

        setBulkActivating(true);
        Swal.fire({
            title: 'Activating employees...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            await Promise.all(
                toActivate.map(async (emp) => {
                    if (!emp.employeeId) return;
                    await employeeService.updateEmployee(emp.employeeId, {
                        ...emp,
                        employeeStatus: 'Active',
                    });
                })
            );
            Swal.close();
            setBulkActivating(false);
            await Swal.fire({
                icon: 'success',
                title: 'Employees activated',
                text: `${toActivate.length} employee(s) are now Active.`,
                timer: 2500,
                showConfirmButton: true,
            });
            fetchEmployees();
        } catch (err) {
            Swal.close();
            setBulkActivating(false);
            await Swal.fire({
                icon: 'error',
                title: 'Activation failed',
                text:
                    err instanceof Error
                        ? err.message
                        : 'Failed to activate selected employees.',
                confirmButtonColor: '#3454d1',
            });
        }
    };

    // Handle deactivate all except owner
    const handleDeactivateAll = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will deactivate all active employees except OWNER. This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ea4d4d',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, deactivate all!',
        });

        if (result.isConfirmed) {
            try {
                const currentUser = tokenManager.getUser();
                const currentUserRole = currentUser?.role;
                
                await employeeService.deactivateAllExceptOwner();
                
                // Check if current user was deactivated (not OWNER)
                if (currentUser && currentUserRole !== 'OWNER') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Account Deactivated',
                        text: 'Your account has been deactivated. You will be logged out.',
                        timer: 3000,
                        showConfirmButton: false,
                    }).then(() => {
                        logout();
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'All active employees (except OWNER) have been deactivated.',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                }
                
                fetchEmployees();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err instanceof Error ? err.message : 'Failed to deactivate employees',
                });
            }
        }
    };

    // Get user initials for avatar
    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Transform API data to table format (stable ref for row selection)
    const tableData = useMemo(
        () =>
            employees.map((employee) => ({
                id: employee.employeeId,
                employeeId: employee.employeeId,
                employeeName: employee.employeeName,
                role: employee.role,
                contactNumber: employee.contactNumber,
                emailAddress: employee.emailAddress,
                address: employee.address,
                status: employee.employeeStatus,
            })),
        [employees]
    );

    const columns = [
        {
            accessorKey: 'select',
            header: ({ table }: { table: any }) => {
                const checkboxRef = React.useRef<HTMLInputElement | null>(null);

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
                        aria-label="Select all rows"
                    />
                );
            },
            cell: ({ row }: { row: any }) => (
                <input
                    type="checkbox"
                    className="custom-table-checkbox"
                    checked={row.getIsSelected()}
                    disabled={!row.getCanSelect()}
                    onChange={row.getToggleSelectedHandler()}
                    aria-label={`Select ${row.original.employeeName}`}
                />
            ),
            meta: {
                headerClassName: 'width-30',
                noSort: true,
            },
            enableSorting: false,
        },
        {
            accessorKey: 'actions',
            header: () => "Actions",
            cell: (info: any) => {
                const employeeId = info.row.original.employeeId;
                const employeeName = info.row.original.employeeName;
                const isDeleting = deletingEmployeeId === employeeId;

                if (isDeleting) {
                    return (
                        <div className="hstack gap-2 justify-content-end align-items-center">
                            <div
                                className="spinner-border spinner-border-sm text-primary"
                                role="status"
                                aria-label="Deleting"
                            >
                                <span className="visually-hidden">Deleting...</span>
                            </div>
                        </div>
                    );
                }

                const actions = [
                    {
                        label: "Edit",
                        icon: <FiEdit3 />,
                        link: `/employees/create?id=${employeeId}&view=true`
                    },
                    { type: "divider" },
                    {
                        label: "Delete",
                        icon: <FiTrash2 />,
                        onClick: () => handleDelete(employeeId, employeeName)
                    },
                ] as any;

                return (
                    <div className="hstack gap-2 justify-content-end">
                        <Dropdown
                            dropdownItems={actions as any}
                            triggerClass='avatar-md'
                            triggerPosition={"0,21"}
                            triggerIcon={<FiMoreHorizontal />}
                            isAvatar={true}
                            dropdownAutoClose={true}
                        />
                    </div>
                );
            },
            meta: {
                headerClassName: 'text-end'
            }
        },
        {
            accessorKey: 'id',
            header: () => 'Employee ID',
            cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>
        },
        {
            accessorKey: 'employeeName',
            header: () => 'Employee',
            cell: (info: any) => {
                const name = info.getValue();
                return (
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/employees/create?id=${info.row.original.employeeId}`);
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
            }
        },
        {
            accessorKey: 'role',
            header: () => 'Role',
            cell: (info: any) => <span className="badge bg-primary">{info.getValue()}</span>
        },
        {
            accessorKey: 'emailAddress',
            header: () => 'Email',
            cell: (info: any) => {
                const email = info.getValue();
                return email ? (
                    <a href={`mailto:${email}`} className="text-decoration-none">{email}</a>
                ) : (
                    <span className="text-muted">N/A</span>
                );
            }
        },
        {
            accessorKey: 'contactNumber',
            header: () => 'Phone',
            cell: (info: any) => <a href={`tel:${info.getValue()}`} className="text-decoration-none">{info.getValue()}</a>
        },
        {
            accessorKey: 'address',
            header: () => 'Address',
            cell: (info: any) => {
                const address = info.getValue();
                return address ? (
                    <span className="text-truncate-1-line">{address}</span>
                ) : (
                    <span className="text-muted">N/A</span>
                );
            }
        },
        {
            accessorKey: 'status',
            header: () => 'Status',
            cell: (info: any) => {
                const status = info.getValue();
                const employeeId = info.row.original.employeeId;
                const isSelfOwner =
                    user?.employeeId === employeeId && isOwnerRole(user.role);
                const currentIsActive = !isInactiveEmployeeStatus(status);
                const statusOptions = employeeListStatusOptions.map((opt) =>
                    opt.value === 'inactive' && isSelfOwner && currentIsActive
                        ? {
                              ...opt,
                              disabled: true,
                              disabledReason:
                                  'You cannot deactivate your own owner account.',
                          }
                        : opt
                );
                return (
                    <TableCell
                        options={statusOptions}
                        defaultSelect={status.toLowerCase()}
                        onStatusChange={handleStatusChange}
                        employeeId={employeeId}
                    />
                );
            }
        },
    ];

    if (loading) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="card-body text-center">
                    <p className="text-danger">{error}</p>
                    <button className="btn btn-primary" onClick={fetchEmployees}>
                        <FiRotateCw className="me-2" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-3 d-flex flex-wrap align-items-center gap-2">
                {hasInactiveSelected && (
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleBulkActivate}
                        disabled={bulkActivating || loading}
                    >
                        <FiUserCheck size={16} className="me-2" />
                        Activate selected
                        {inactiveSelectedCount > 0 && (
                            <span className="badge bg-light text-success ms-2">
                                {inactiveSelectedCount}
                            </span>
                        )}
                    </button>
                )}
                {selectedRows.length > 0 && (
                    <span className="text-muted small">
                        {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''} selected
                    </span>
                )}
                <button
                    className="btn btn-danger ms-auto"
                    onClick={handleDeactivateAll}
                    disabled={loading || bulkActivating}
                >
                    Deactivate All
                </button>
            </div>
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
                html.app-skin-dark .function-table table.dataTable tbody tr .text-muted {
                    color: #b1b4c0 !important;
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
            <Table
                data={tableData}
                columns={columns}
                enableRowSelection
                getRowId={getRowId}
                onSelectedRowsChange={onSelectedRowsChange}
                selectionResetKey={selectionResetKey}
            />
        </div>
    );
};

export default EmployeesTable;

