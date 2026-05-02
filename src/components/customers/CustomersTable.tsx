import React, { memo, useEffect, useState, useCallback } from 'react'
import Table from '@/components/shared/table/Table';
import { FiEdit3, FiEye, FiMoreHorizontal, FiTrash2, FiRotateCw, FiRefreshCw } from 'react-icons/fi'
import Dropdown from '@/components/shared/Dropdown';
import SelectDropdown from '@/components/shared/SelectDropdown';
import { Link, useNavigate } from 'react-router-dom';
import { customerService, Customer } from '@/services/customerService';
import { customerListStatusOptions } from '@/utils/options';
import Swal from 'sweetalert2';
import CustomerViewModal from './CustomerViewModal';


interface TableCellProps {
    options: any[];
    defaultSelect: string;
    onStatusChange?: (customerId: string, newStatus: string) => void;
    customerId?: string;
}

const TableCell: React.FC<TableCellProps> = memo(({ options, defaultSelect, onStatusChange, customerId }) => {
    const [selectedOption, setSelectedOption] = useState(
        options?.find(opt => opt.value === defaultSelect?.toLowerCase()) || null
    );

    const handleStatusChange = (option: any) => {
        setSelectedOption(option);
        if (onStatusChange && customerId) {
            onStatusChange(customerId, option.value);
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

const CustomersTable: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    // Fetch customers from API
    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await customerService.getAllCustomers();
            setCustomers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load customers');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to load customers',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Handle status change
    const handleStatusChange = async (customerId: string, newStatus: string) => {
        try {
            const customer = customers.find(c => c.customerId === customerId);
            if (!customer) return;

            // Ensure status is only Active or Inactive
            const status: 'Active' | 'Inactive' = newStatus === 'active' ? 'Active' : 'Inactive';

            await customerService.updateCustomer(customerId, {
                ...customer,
                customerStatus: status,
            });

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Customer status updated successfully',
                timer: 2000,
                showConfirmButton: false,
            });

            fetchCustomers();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to update customer status',
            });
        }
    };

    // Handle delete
    const handleDelete = async (customerId: string, customerName: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete ${customerName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ea4d4d',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            try {
                await customerService.deleteCustomer(customerId);
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Customer has been deleted.',
                    timer: 2000,
                    showConfirmButton: false,
                });
                fetchCustomers();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err instanceof Error ? err.message : 'Failed to delete customer',
                });
            }
        }
    };

    // Handle restore
    const handleRestore = async (customerId: string, customerName: string) => {
        const result = await Swal.fire({
            title: 'Restore Customer?',
            text: `Do you want to restore ${customerName}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#17c666',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, restore it!',
        });

        if (result.isConfirmed) {
            try {
                await customerService.restoreCustomer(customerId);
                Swal.fire({
                    icon: 'success',
                    title: 'Restored!',
                    text: 'Customer has been restored.',
                    timer: 2000,
                    showConfirmButton: false,
                });
                fetchCustomers();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err instanceof Error ? err.message : 'Failed to restore customer',
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

    // Transform API data to table format
    const tableData = customers.map((customer) => ({
        id: customer.customerId,
        customerId: customer.customerId,
        customerName: customer.customerName,
        contactNumber: customer.contactNumber,
        emailAddress: customer.emailAddress,
        address: customer.address,
        discount: customer.discount,
        status: customer.customerStatus,
    }));

    const columns = [
        {
            accessorKey: 'id',
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
                headerClassName: 'width-30',
            },
        },
        {
            accessorKey: 'actions',
            header: () => "Actions",
            cell: (info) => {
                const customerId = info.row.original.customerId;
                const customerName = info.row.original.customerName;
                const actions = [
                    {
                        label: "View",
                        icon: <FiEye />,
                        onClick: () => {
                            setSelectedCustomerId(customerId);
                            setIsModalOpen(true);
                        }
                    },
                    {
                        label: "Edit",
                        icon: <FiEdit3 />,
                        link: `/customers/create?id=${customerId}`
                    },
                    { type: "divider" },
                    {
                        label: "Restore",
                        icon: <FiRefreshCw />,
                        onClick: () => handleRestore(customerId, customerName)
                    },
                    {
                        label: "Delete",
                        icon: <FiTrash2 />,
                        onClick: () => handleDelete(customerId, customerName)
                    },
                ];

                return (
                    <div className="hstack gap-2 justify-content-end">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedCustomerId(customerId);
                                setIsModalOpen(true);
                            }}
                            className="avatar-text avatar-md"
                            title="View"
                        >
                            <FiEye />
                        </a>
                        <Link
                            to={`/customers/create?id=${customerId}`}
                            className="avatar-text avatar-md"
                            title="Edit"
                        >
                            <FiEdit3 />
                        </Link>
                        <Dropdown
                            dropdownItems={actions}
                            triggerClass='avatar-md'
                            triggerPosition={"0,21"}
                            triggerIcon={<FiMoreHorizontal />}
                        />
                    </div>
                );
            },
            meta: {
                headerClassName: 'text-end'
            }
        },
        {
            accessorKey: 'customerId',
            header: () => 'Customer ID',
            cell: (info) => <span className="fw-bold">{info.getValue()}</span>
        },
        {
            accessorKey: 'customerName',
            header: () => 'Customer',
            cell: (info) => {
                const name = info.getValue();
                const customerId = info.row.original.customerId;
                return (
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setSelectedCustomerId(customerId);
                            setIsModalOpen(true);
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
            accessorKey: 'emailAddress',
            header: () => 'Email',
            cell: (info) => {
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
            cell: (info) => <a href={`tel:${info.getValue()}`} className="text-decoration-none">{info.getValue()}</a>
        },
        {
            accessorKey: 'address',
            header: () => 'Address',
            cell: (info) => <span className="text-truncate-1-line">{info.getValue()}</span>
        },
        {
            accessorKey: 'discount',
            header: () => 'Discount',
            cell: (info) => <span>{info.getValue()}%</span>
        },
        {
            accessorKey: 'status',
            header: () => 'Status',
            cell: (info) => (
                <TableCell
                    options={customerListStatusOptions}
                    defaultSelect={info.getValue()}
                    onStatusChange={handleStatusChange}
                    customerId={info.row.original.customerId}
                />
            )
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
                    <button className="btn btn-primary" onClick={fetchCustomers}>
                        <FiRotateCw className="me-2" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCustomerId(null);
    };

    return (
        <div>
            <CustomerViewModal
                customerId={selectedCustomerId}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
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
            <Table data={tableData} columns={columns} />
        </div>
    );
};

export default CustomersTable;