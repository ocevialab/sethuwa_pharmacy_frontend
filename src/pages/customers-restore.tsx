import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import { customerService, Customer } from '@/services/customerService'
import { FiRotateCw, FiRefreshCw, FiEye, FiEdit3, FiMoreHorizontal } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import Dropdown from '@/components/shared/Dropdown'
import CustomerViewModal from '@/components/customers/CustomerViewModal'
import Table from '@/components/shared/table/Table'

const CustomersRestore = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch customers from API
    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await customerService.getAllCustomers();
            
            // Debug: Log all customers and their statuses
            console.log('All customers from API:', data);
            console.log('Customer statuses:', data.map((c: Customer) => ({ 
                id: c.customerId, 
                name: c.customerName,
                status: c.customerStatus, 
                statusType: typeof c.customerStatus,
                statusString: String(c.customerStatus)
            })));
            
            // Filter only inactive customers (case-insensitive comparison)
            const inactiveCustomers = data.filter((customer: Customer) => {
                const status = String(customer.customerStatus || '').trim();
                const isInactive = status.toLowerCase() === 'inactive';
                console.log(`Customer ${customer.customerId} (${customer.customerName}): status="${status}", isInactive=${isInactive}`);
                return isInactive;
            });
            
            console.log('Filtered inactive customers:', inactiveCustomers);
            console.log('Total inactive customers found:', inactiveCustomers.length);
            
            setCustomers(inactiveCustomers);
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

    // Handle restore - Update status to Active
    const handleRestore = async (customerId: string, customerName: string) => {
        const result = await Swal.fire({
            title: 'Restore Customer?',
            text: `Do you want to restore ${customerName} and set status to Active?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#17c666',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, restore it!',
        });

        if (result.isConfirmed) {
            try {
                const customer = customers.find(c => c.customerId === customerId);
                if (!customer) {
                    throw new Error('Customer not found');
                }

                // Update customer status to Active
                await customerService.updateCustomer(customerId, {
                    ...customer,
                    customerStatus: 'Active',
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Restored!',
                    text: 'Customer has been restored and status set to Active successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                });
                fetchCustomers(); // Refresh the list (inactive customers only)
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

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCustomerId(null);
    };

    const columns: any[] = [
        {
            accessorKey: 'customerId',
            header: () => 'Customer ID',
            cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>
        },
        {
            accessorKey: 'customerName',
            header: () => 'Customer',
            cell: (info: any) => {
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
            cell: (info: any) => <span className="text-truncate-1-line">{info.getValue()}</span>
        },
        {
            accessorKey: 'actions',
            header: () => "Actions",
            cell: (info: any) => {
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
                ] as any;

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
                        <button
                            onClick={() => handleRestore(customerId, customerName)}
                            className="avatar-text avatar-md btn btn-link p-0"
                            title="Restore"
                            style={{ border: 'none', background: 'none' }}
                        >
                            <FiRefreshCw />
                        </button>
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
    ];

    if (loading) {
        return (
            <>
                <PageHeader>
                    <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                        <h5 className="mb-0">Restore Customers</h5>
                    </div>
                </PageHeader>
                <div className='main-content'>
                    <div className='row'>
                        <div className="col-12">
                            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
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
                    <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                        <h5 className="mb-0">Restore Customers</h5>
                    </div>
                </PageHeader>
                <div className='main-content'>
                    <div className='row'>
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body text-center">
                                    <p className="text-danger">{error}</p>
                                    <button className="btn btn-primary" onClick={fetchCustomers}>
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
            <PageHeader>
                <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                    <h5 className="mb-0">Restore Customers</h5>
                    <button className="btn btn-primary" onClick={fetchCustomers}>
                        <FiRefreshCw className="me-2" size={16} />
                        Refresh
                    </button>
                </div>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <div className="col-12">
                        <div className="mb-3">
                            <p className="text-muted">
                                Restore inactive customers by updating their status to Active. Click on the restore button to activate a customer.
                            </p>
                            {customers.length === 0 && !loading && (
                                <div className="alert alert-info mt-3">
                                    <strong>No Inactive Customers</strong>
                                    <p className="mb-0">There are no inactive customers to restore at this time.</p>
                                </div>
                            )}
                        </div>
                        {customers.length > 0 && (
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
                            <Table data={customers} columns={columns} />
                        </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
            <CustomerViewModal
                customerId={selectedCustomerId}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </>
    );
}

export default CustomersRestore;

