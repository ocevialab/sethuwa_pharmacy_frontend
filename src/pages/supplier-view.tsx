import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supplierService, Supplier } from '@/services/supplierService';
import { purchasingService, Purchase } from '@/services/purchasingService';
import Swal from 'sweetalert2';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import { FiTruck, FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, FiCreditCard, FiEdit3, FiShoppingBag, FiEye } from 'react-icons/fi';
import Table from '@/components/shared/table/Table';

const SupplierView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const supplierId = searchParams.get('id');
    const navigate = useNavigate();

    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [purchasesLoading, setPurchasesLoading] = useState(false);

    const fetchSupplierDetails = useCallback(async () => {
        if (!supplierId) {
            setError('Supplier ID is missing.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const data = await supplierService.getSupplierById(supplierId);
            setSupplier(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load supplier details');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to load supplier details',
            });
        } finally {
            setLoading(false);
        }
    }, [supplierId]);

    useEffect(() => {
        fetchSupplierDetails();
    }, [fetchSupplierDetails]);

    // Fetch purchases for this supplier
    const fetchSupplierPurchases = useCallback(async () => {
        if (!supplierId) return;
        try {
            setPurchasesLoading(true);
            const response = await purchasingService.getPurchasesBySupplier(supplierId, {
                page: 1,
                pageSize: 100, // Fetch more to show all purchases
            });
            setPurchases(response.data);
        } catch (err) {
            console.error('Failed to load supplier purchases:', err);
            // Don't show error alert for purchases, just log it
        } finally {
            setPurchasesLoading(false);
        }
    }, [supplierId]);

    useEffect(() => {
        if (supplier) {
            fetchSupplierPurchases();
        }
    }, [supplier, fetchSupplierPurchases]);

    if (loading) {
        return (
            <>
                <PageHeader>
                    <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                        <button className="btn btn-light-brand" onClick={() => navigate('/supplier/list')}>
                            <FiArrowLeft size={16} className='me-2' />
                            <span>Back to List</span>
                        </button>
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

    if (error || !supplier) {
        return (
            <>
                <PageHeader>
                    <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                        <button className="btn btn-light-brand" onClick={() => navigate('/supplier/list')}>
                            <FiArrowLeft size={16} className='me-2' />
                            <span>Back to List</span>
                        </button>
                    </div>
                </PageHeader>
                <div className='main-content'>
                    <div className='row'>
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body text-center">
                                    <p className="text-danger">{error || 'Supplier not found'}</p>
                                    <button className="btn btn-primary" onClick={() => navigate('/supplier/list')}>
                                        Back to List
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
                html.app-skin-dark .card-body div[style*="rgba(255, 255, 255, 0.5)"] {
                    background: rgba(255, 255, 255, 0.05) !important;
                }
                html.app-skin-dark .card-body .text-muted {
                    color: #b1b4c0 !important;
                }
                html.app-skin-dark .card-body .fw-bold,
                html.app-skin-dark .card-body .fw-semibold {
                    color: #ffffff !important;
                }
                @media (max-width: 768px) {
                    .card-body div[style*="rgba(255, 255, 255, 0.5)"] {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 0.5rem;
                    }
                    .card-body .text-end {
                        text-align: left !important;
                    }
                }
            `}</style>
            <PageHeader>
                <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                    <button className="btn btn-light-brand" onClick={() => navigate('/supplier/list')}>
                        <FiArrowLeft size={16} className='me-2' />
                        <span>Back to List</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate(`/supplier/create?edit=${supplierId}`)}>
                        <FiEdit3 size={16} className='me-2' />
                        <span>Edit Supplier</span>
                    </button>
                </div>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <div className="d-flex align-items-center gap-3 my-3">
                                    <div className="avatar avatar-md bg-light-primary">
                                        <FiTruck size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <h5 className="card-title mb-1 fw-bold">{supplier.supplierName}</h5>
                                        <p className="text-muted mb-0 fs-12">Supplier ID: {supplier.supplierId}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="row g-3 mb-4">
                                    {/* Contact Information Card */}
                                    <div className="col-12 col-lg-6">
                                        <div className="card h-100" style={{
                                            background: 'rgba(52, 84, 209, 0.05)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(52, 84, 209, 0.15)'
                                        }}>
                                            <div className="card-header bg-transparent border-0 pb-2">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar avatar-sm bg-light-primary">
                                                        <FiUser size={16} className="text-primary" />
                                                    </div>
                                                    <h6 className="mb-0 fw-bold">Contact Information</h6>
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">
                                                <div className="row g-3">
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Supplier ID</span>
                                                            <span className="fw-bold">{supplier.supplierId}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Supplier Name</span>
                                                            <span className="fw-semibold text-end" style={{ maxWidth: '60%' }}>{supplier.supplierName}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Contact Person</span>
                                                            <span className="fw-semibold">{supplier.contactPerson}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">
                                                                <FiPhone size={14} className="me-1" />
                                                                Contact Number
                                                            </span>
                                                            <span className="fw-semibold">{supplier.contactNumber}</span>
                                                        </div>
                                                    </div>
                                                    {supplier.emailAddress && (
                                                        <div className="col-12">
                                                            <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                                <span className="text-muted fs-12">
                                                                    <FiMail size={14} className="me-1" />
                                                                    Email Address
                                                                </span>
                                                                <span className="fw-semibold text-end" style={{ maxWidth: '60%' }}>{supplier.emailAddress}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {supplier.address && (
                                                        <div className="col-12">
                                                            <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                                <span className="text-muted fs-12">
                                                                    <FiMapPin size={14} className="me-1" />
                                                                    Address
                                                                </span>
                                                                <span className="fw-semibold text-end" style={{ maxWidth: '60%' }}>{supplier.address}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bank Information Card */}
                                    <div className="col-12 col-lg-6">
                                        <div className="card h-100" style={{
                                            background: 'rgba(23, 198, 102, 0.05)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(23, 198, 102, 0.15)'
                                        }}>
                                            <div className="card-header bg-transparent border-0 pb-2">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar avatar-sm bg-light-success">
                                                        <FiCreditCard size={16} className="text-success" />
                                                    </div>
                                                    <h6 className="mb-0 fw-bold">Bank Information</h6>
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">
                                                <div className="row g-3">
                                                    {supplier.bankName ? (
                                                        <>
                                                            <div className="col-12">
                                                                <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                                    <span className="text-muted fs-12">Bank Name</span>
                                                                    <span className="fw-semibold">{supplier.bankName}</span>
                                                                </div>
                                                            </div>
                                                            {supplier.bankAccountName && (
                                                                <div className="col-12">
                                                                    <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                                        <span className="text-muted fs-12">Account Name</span>
                                                                        <span className="fw-semibold">{supplier.bankAccountName}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {supplier.bankAccountNumber && (
                                                                <div className="col-12">
                                                                    <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                                        <span className="text-muted fs-12">Account Number</span>
                                                                        <span className="fw-semibold">{supplier.bankAccountNumber}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {supplier.bankBranchName && (
                                                                <div className="col-12">
                                                                    <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                                        <span className="text-muted fs-12">Branch Name</span>
                                                                        <span className="fw-semibold">{supplier.bankBranchName}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="col-12">
                                                            <div className="alert alert-info mb-0">
                                                                <FiCreditCard className="me-2" />
                                                                No bank information available
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Purchasing List Section */}
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <div className="d-flex align-items-center gap-3 my-3">
                                    <div className="avatar avatar-md bg-light-success">
                                        <FiShoppingBag size={18} className="text-success" />
                                    </div>
                                    <div>
                                        <h5 className="card-title mb-1 fw-bold">Purchasing List</h5>
                                        <p className="text-muted mb-0 fs-12">{purchases.length} purchase(s) found</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                {purchasesLoading ? (
                                    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : purchases.length === 0 ? (
                                    <div className="alert alert-info mb-0">
                                        <FiShoppingBag className="me-2" />
                                        No purchases found for this supplier.
                                    </div>
                                ) : (
                                    <SupplierPurchasesTable purchases={purchases} />
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

// Component for displaying supplier purchases table
const SupplierPurchasesTable: React.FC<{ purchases: Purchase[] }> = ({ purchases }) => {
    const navigate = useNavigate();

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Get payment status badge color
    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case "Complete":
                return "bg-success";
            case "Pending":
                return "bg-warning";
            case "Overdue":
                return "bg-danger";
            default:
                return "bg-secondary";
        }
    };

    const tableData = purchases.map((purchase) => ({
        id: purchase.purchaseId,
        purchaseId: purchase.purchaseId,
        invoiceNumber: purchase.invoiceNumber,
        invoiceDate: purchase.invoiceDate,
        paymentStatus: purchase.paymentStatus,
        paymentDueDate: purchase.paymentDueDate,
        totalAmount: purchase.totalAmount,
        itemsCount: purchase.purchaseItems?.length || 0,
    }));

    const columns = [
        {
            accessorKey: "purchaseId",
            header: () => "Purchase ID",
            cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>,
        },
        {
            accessorKey: "invoiceNumber",
            header: () => "Invoice Number",
            cell: (info: any) => {
                const invoiceNumber = info.getValue();
                const purchaseId = info.row.original.purchaseId;
                return (
                    <Link
                        to={`/purchasing/view?id=${purchaseId}`}
                        className="text-decoration-none"
                    >
                        <span className="fw-semibold">{invoiceNumber}</span>
                    </Link>
                );
            },
        },
        {
            accessorKey: "invoiceDate",
            header: () => "Invoice Date",
            cell: (info: any) => <span>{formatDate(info.getValue())}</span>,
        },
        {
            accessorKey: "paymentStatus",
            header: () => "Payment Status",
            cell: (info: any) => {
                const status = info.getValue();
                return (
                    <span className={`badge ${getPaymentStatusBadge(status)}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: "paymentDueDate",
            header: () => "Payment Due Date",
            cell: (info: any) => <span>{formatDate(info.getValue())}</span>,
        },
        {
            accessorKey: "totalAmount",
            header: () => "Total Amount",
            cell: (info: any) => (
                <span className="fw-semibold">
                    {info.getValue().toLocaleString()} LKR
                </span>
            ),
        },
        {
            accessorKey: "itemsCount",
            header: () => "Items",
            cell: (info: any) => <span>{info.getValue()} item(s)</span>,
        },
        {
            accessorKey: "actions",
            header: () => "Actions",
            cell: (info: any) => {
                const purchaseId = info.row.original.purchaseId;
                return (
                    <div className="hstack gap-2 justify-content-end">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(`/purchasing/view?id=${purchaseId}`);
                            }}
                            className="avatar-text avatar-md"
                            title="View"
                        >
                            <FiEye />
                        </a>
                    </div>
                );
            },
            meta: {
                headerClassName: "text-end",
            },
        },
    ];

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
            <Table data={tableData} columns={columns} />
        </>
    );
};

export default SupplierView;

