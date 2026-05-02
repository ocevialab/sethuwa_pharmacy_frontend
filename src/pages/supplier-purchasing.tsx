import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplierService, Supplier } from '@/services/supplierService';
import { purchasingService, Purchase } from '@/services/purchasingService';
import Swal from 'sweetalert2';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import { FiShoppingCart, FiTruck, FiRefreshCw, FiSearch, FiCheck } from 'react-icons/fi';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

const SupplierPurchasing: React.FC = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supplierPagination, setSupplierPagination] = useState({
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    });
    const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [selectedSupplierName, setSelectedSupplierName] = useState<string>('');
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPurchases, setLoadingPurchases] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    });
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch suppliers with pagination and search
    const fetchSuppliers = useCallback(async (page: number, pageSize: number, search?: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await supplierService.getAllSuppliers({
                page,
                pageSize,
                supplierName: search && search.trim() ? search.trim() : undefined,
            });
            setSuppliers(response.data);
            setSupplierPagination({
                page: response.currentPage,
                pageSize: response.pageSize,
                totalItems: response.totalItems,
                totalPages: response.totalPages,
            });
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
    }, []);

    // Fetch purchases by supplier
    const fetchPurchasesBySupplier = useCallback(async (supplierId: string, page: number, pageSize: number) => {
        if (!supplierId) {
            setPurchases([]);
            setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
            return;
        }

        try {
            setLoadingPurchases(true);
            setError(null);
            const response = await purchasingService.getPurchasesBySupplier(supplierId, {
                page,
                pageSize,
            });
            setPurchases(response.data);
            setPagination({
                page: response.currentPage,
                pageSize: response.pageSize,
                totalItems: response.totalItems,
                totalPages: response.totalPages,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load purchases');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to load purchases',
            });
        } finally {
            setLoadingPurchases(false);
        }
    }, []);

    useEffect(() => {
        fetchSuppliers(supplierPagination.page, supplierPagination.pageSize, supplierSearchQuery);
    }, [supplierPagination.page, supplierPagination.pageSize]);

    // Debounce supplier search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchSuppliers(1, supplierPagination.pageSize, supplierSearchQuery);
            setSupplierPagination(prev => ({ ...prev, page: 1 }));
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [supplierSearchQuery, supplierPagination.pageSize, fetchSuppliers]);

    useEffect(() => {
        if (selectedSupplierId) {
            fetchPurchasesBySupplier(selectedSupplierId, pagination.page, pagination.pageSize);
        } else {
            setPurchases([]);
            setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSupplierId, pagination.page, pagination.pageSize]);

    const handleSupplierSelect = (supplierId: string, supplierName: string) => {
        setSelectedSupplierId(supplierId);
        setSelectedSupplierName(supplierName);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const handleSupplierPaginationChange = (newPage: number, newPageSize: number) => {
        setSupplierPagination(prev => ({
            ...prev,
            page: newPage,
            pageSize: newPageSize,
        }));
    };

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPagination(prev => ({
            ...prev,
            page: newPage,
            pageSize: newPageSize,
        }));
    };

    const handleRefresh = () => {
        if (selectedSupplierId) {
            fetchPurchasesBySupplier(selectedSupplierId, pagination.page, pagination.pageSize);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getStatusBadge = (status: string) => {
        const statusColors: { [key: string]: string } = {
            Complete: 'bg-success',
            Pending: 'bg-warning',
            Overdue: 'bg-danger',
        };
        return statusColors[status] || 'bg-secondary';
    };

    // Supplier table columns
    const supplierColumns = useMemo(() => [
        {
            accessorKey: 'supplierId',
            header: () => 'Supplier ID',
            cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>
        },
        {
            accessorKey: 'supplierName',
            header: () => 'Supplier Name',
            cell: (info: any) => <span className="fw-semibold">{info.getValue()}</span>
        },
        {
            accessorKey: 'contactPerson',
            header: () => 'Contact Person',
            cell: (info: any) => <span>{info.getValue() || 'N/A'}</span>
        },
        {
            accessorKey: 'contactNumber',
            header: () => 'Contact Number',
            cell: (info: any) => <span>{info.getValue() || 'N/A'}</span>
        },
        {
            accessorKey: 'emailAddress',
            header: () => 'Email Address',
            cell: (info: any) => {
                const email = info.getValue();
                return email ? <span>{email}</span> : <span className="text-muted">N/A</span>;
            }
        },
        {
            accessorKey: 'actions',
            header: () => 'Actions',
            cell: (info: any) => {
                const supplier = info.row.original as Supplier;
                const isSelected = selectedSupplierId === supplier.supplierId;
                return (
                    <button
                        className={`btn btn-sm ${isSelected ? 'btn-success' : 'btn-primary'}`}
                        onClick={() => handleSupplierSelect(supplier.supplierId, supplier.supplierName)}
                        title={isSelected ? 'Selected' : 'Select Supplier'}
                    >
                        {isSelected ? <FiCheck size={14} /> : 'Select'}
                    </button>
                );
            },
        },
    ], [selectedSupplierId]);

    // Purchase table columns
    const purchaseColumns = useMemo(() => [
        {
            accessorKey: 'invoiceNumber',
            header: () => 'Invoice Number',
            cell: (info: any) => (
                <span className="fw-semibold text-primary">{info.getValue()}</span>
            ),
        },
        {
            accessorKey: 'invoiceDate',
            header: () => 'Invoice Date',
            cell: (info: any) => <span>{formatDate(info.getValue())}</span>,
        },
        {
            accessorKey: 'paymentStatus',
            header: () => 'Payment Status',
            cell: (info: any) => {
                const status = info.getValue();
                return (
                    <span className={`badge ${getStatusBadge(status)}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: 'paymentDueDate',
            header: () => 'Payment Due Date',
            cell: (info: any) => <span>{formatDate(info.getValue())}</span>,
        },
        {
            accessorKey: 'totalAmount',
            header: () => 'Total Amount',
            cell: (info: any) => (
                <span className="fw-semibold">{formatCurrency(info.getValue())} LKR</span>
            ),
        },
        {
            accessorKey: 'purchaseItems',
            header: () => 'Items Count',
            cell: (info: any) => {
                const items = info.getValue() || [];
                return <span>{items.length} item(s)</span>;
            },
        },
        {
            accessorKey: 'actions',
            header: () => 'Actions',
            cell: (info: any) => {
                const purchase = info.row.original as Purchase;
                const purchaseId = purchase.purchaseId || (purchase as any).id;
                return (
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                                if (purchaseId) {
                                    navigate(`/purchasing/view?purchaseId=${purchaseId}`);
                                } else {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Purchase ID is missing',
                                    });
                                }
                            }}
                            title="View Details"
                        >
                            <FiShoppingCart size={14} />
                        </button>
                    </div>
                );
            },
        },
    ], [navigate]);

    const supplierTableData = suppliers.map((supplier) => ({
        id: supplier.supplierId,
        ...supplier,
    }));

    const purchaseTableData = purchases.map((purchase, index) => ({
        id: purchase.purchaseId || `purchase-${index}`,
        purchaseId: purchase.purchaseId,
        ...purchase,
    }));

    const supplierTable = useReactTable({
        data: supplierTableData,
        columns: supplierColumns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: supplierPagination.totalPages,
    });

    const purchaseTable = useReactTable({
        data: purchaseTableData,
        columns: purchaseColumns.map((col) => ({
            ...col,
            enableSorting: col.accessorKey !== 'actions',
        })),
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: pagination.totalPages,
    });

    // Generate page numbers helper
    const getPageNumbers = (totalPages: number, currentPage: number) => {
        const pages = [];
        
        if (totalPages <= 0) {
            return pages;
        }
        
        if (totalPages <= 9) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            pages.push(2);
            if (currentPage > 4) {
                pages.push('...');
            }
            const startPage = Math.max(3, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);
            for (let i = startPage; i <= endPage; i++) {
                if (i !== 1 && i !== 2 && !pages.includes(i)) {
                    pages.push(i);
                }
            }
            if (currentPage < totalPages - 3) {
                pages.push('...');
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

    if (loading && suppliers.length === 0) {
        return (
            <>
                <PageHeader>
                    <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                        <h5 className="mb-0 fw-bold">Supplier Purchasing</h5>
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

    return (
        <>
            <PageHeader>
                <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                    <h5 className="mb-0 fw-bold">Supplier Purchasing</h5>
                </div>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    {/* Supplier Selection Table */}
                    <div className="col-12 mb-4">
                        <div className="card">
                            <div className="card-header">
                                <div className="d-flex align-items-center justify-content-between gap-3 my-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="avatar avatar-md bg-light-primary">
                                            <FiTruck size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <h5 className="card-title mb-1 fw-bold">Select Supplier</h5>
                                            <p className="text-muted mb-0 fs-12">Choose a supplier to view their purchases</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                {/* Supplier Search */}
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <div className="position-relative">
                                            <FiSearch
                                                className="position-absolute"
                                                style={{
                                                    left: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    color: '#64748b',
                                                    pointerEvents: 'none',
                                                }}
                                                size={18}
                                            />
                                            <input
                                                type="text"
                                                value={supplierSearchQuery}
                                                onChange={(e) => setSupplierSearchQuery(e.target.value)}
                                                placeholder="Search suppliers..."
                                                className="form-control form-control-sm ps-5"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Supplier Table */}
                                <div className="table-responsive">
                                    <div className="dataTables_wrapper dt-bootstrap5 no-footer">
                                        <div className="row dt-row">
                                            <div className="col-sm-12 px-0">
                                                <table className="table table-hover dataTable no-footer">
                                                    <thead>
                                                        {supplierTable.getHeaderGroups().map((headerGroup) => (
                                                            <tr key={headerGroup.id}>
                                                                {headerGroup.headers.map((header) => (
                                                                    <th key={header.id}>
                                                                        <div className="table-head d-flex align-items-center gap-1">
                                                                            {flexRender(
                                                                                header.column.columnDef.header,
                                                                                header.getContext()
                                                                            )}
                                                                        </div>
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </thead>
                                                    <tbody>
                                                        {supplierTable.getRowModel().rows.map((row) => (
                                                            <tr 
                                                                key={row.id} 
                                                                className={`single-item chat-single-item ${selectedSupplierId === row.original.supplierId ? 'table-active' : ''}`}
                                                            >
                                                                {row.getVisibleCells().map((cell) => (
                                                                    <td key={cell.id}>
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

                                        {/* Supplier Pagination */}
                                        {supplierPagination.totalPages > 0 && (
                                            <div className="row gy-2 mt-3">
                                                <div className="col-sm-12 col-md-5 p-0">
                                                    <div className="dataTables_info text-lg-start text-center">
                                                        Showing {(supplierPagination.page - 1) * supplierPagination.pageSize + 1} to{' '}
                                                        {Math.min(
                                                            supplierPagination.page * supplierPagination.pageSize,
                                                            supplierPagination.totalItems
                                                        )}{' '}
                                                        of {supplierPagination.totalItems} entries
                                                    </div>
                                                </div>
                                                <div className="col-sm-12 col-md-7 p-0">
                                                    <div className="dataTables_paginate paging_simple_numbers d-flex justify-content-md-end justify-content-center align-items-center gap-2">
                                                        <ul className="pagination mb-0">
                                                            {(() => {
                                                                const displayPage = supplierPagination.page;
                                                                const displayTotalPages = supplierPagination.totalPages;
                                                                const displayPageSize = supplierPagination.pageSize;
                                                                const pageNumbers = getPageNumbers(displayTotalPages, displayPage);

                                                                return (
                                                                    <>
                                                                        <li
                                                                            className={`paginate_button page-item previous ${
                                                                                displayPage === 1 ? 'disabled' : ''
                                                                            }`}
                                                                        >
                                                                            <a
                                                                                href="#"
                                                                                className="page-link"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    if (displayPage > 1) {
                                                                                        handleSupplierPaginationChange(displayPage - 1, displayPageSize);
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
                                                                                    page === displayPage ? 'active' : ''
                                                                                } ${page === '...' ? 'disabled' : ''}`}
                                                                            >
                                                                                <a
                                                                                    href="#"
                                                                                    className="page-link"
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        if (typeof page === 'number') {
                                                                                            handleSupplierPaginationChange(page, displayPageSize);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    {page}
                                                                                </a>
                                                                            </li>
                                                                        ))}
                                                                        <li
                                                                            className={`paginate_button page-item next ${
                                                                                displayPage >= displayTotalPages ? 'disabled' : ''
                                                                            }`}
                                                                        >
                                                                            <a
                                                                                href="#"
                                                                                className="page-link"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    if (displayPage < displayTotalPages) {
                                                                                        handleSupplierPaginationChange(displayPage + 1, displayPageSize);
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
                                                                className="form-select form-select-sm"
                                                                value={supplierPagination.pageSize}
                                                                onChange={(e) => {
                                                                    handleSupplierPaginationChange(1, parseInt(e.target.value));
                                                                }}
                                                            >
                                                                <option value={10}>10</option>
                                                                <option value={25}>25</option>
                                                                <option value={50}>50</option>
                                                                <option value={100}>100</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchases Table */}
                    {selectedSupplierId && (
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex align-items-center justify-content-between gap-3 my-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="avatar avatar-md bg-light-success">
                                                <FiShoppingCart size={18} className="text-success" />
                                            </div>
                                            <div>
                                                <h5 className="card-title mb-1 fw-bold">Purchases - {selectedSupplierName}</h5>
                                                <p className="text-muted mb-0 fs-12">Purchases for selected supplier</p>
                                            </div>
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
                                <div className="card-body">
                                    {loadingPurchases ? (
                                        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </div>
                                    ) : purchases.length > 0 ? (
                                        <>
                                            <div className="table-responsive">
                                                <div className="dataTables_wrapper dt-bootstrap5 no-footer">
                                                    <div className="row dt-row">
                                                        <div className="col-sm-12 px-0">
                                                            <table className="table table-hover dataTable no-footer">
                                                                <thead>
                                                                    {purchaseTable.getHeaderGroups().map((headerGroup) => (
                                                                        <tr key={headerGroup.id}>
                                                                            {headerGroup.headers.map((header) => (
                                                                                <th key={header.id}>
                                                                                    <div className="table-head d-flex align-items-center gap-1">
                                                                                        {flexRender(
                                                                                            header.column.columnDef.header,
                                                                                            header.getContext()
                                                                                        )}
                                                                                    </div>
                                                                                </th>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </thead>
                                                                <tbody>
                                                                    {purchaseTable.getRowModel().rows.map((row) => (
                                                                        <tr key={row.id} className="single-item chat-single-item">
                                                                            {row.getVisibleCells().map((cell) => (
                                                                                <td key={cell.id}>
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

                                                    {/* Purchase Pagination */}
                                                    {pagination.totalPages > 0 && (
                                                        <div className="row gy-2 mt-3">
                                                            <div className="col-sm-12 col-md-5 p-0">
                                                                <div className="dataTables_info text-lg-start text-center">
                                                                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                                                                    {Math.min(
                                                                        pagination.page * pagination.pageSize,
                                                                        pagination.totalItems
                                                                    )}{' '}
                                                                    of {pagination.totalItems} entries
                                                                </div>
                                                            </div>
                                                            <div className="col-sm-12 col-md-7 p-0">
                                                                <div className="dataTables_paginate paging_simple_numbers d-flex justify-content-md-end justify-content-center align-items-center gap-2">
                                                                    <ul className="pagination mb-0">
                                                                        {(() => {
                                                                            const displayPage = pagination.page;
                                                                            const displayTotalPages = pagination.totalPages;
                                                                            const displayPageSize = pagination.pageSize;
                                                                            const pageNumbers = getPageNumbers(displayTotalPages, displayPage);

                                                                            return (
                                                                                <>
                                                                                    <li
                                                                                        className={`paginate_button page-item previous ${
                                                                                            displayPage === 1 ? 'disabled' : ''
                                                                                        }`}
                                                                                    >
                                                                                        <a
                                                                                            href="#"
                                                                                            className="page-link"
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                if (displayPage > 1) {
                                                                                                    handlePaginationChange(displayPage - 1, displayPageSize);
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
                                                                                                page === displayPage ? 'active' : ''
                                                                                            } ${page === '...' ? 'disabled' : ''}`}
                                                                                        >
                                                                                            <a
                                                                                                href="#"
                                                                                                className="page-link"
                                                                                                onClick={(e) => {
                                                                                                    e.preventDefault();
                                                                                                    if (typeof page === 'number') {
                                                                                                        handlePaginationChange(page, displayPageSize);
                                                                                                    }
                                                                                                }}
                                                                                            >
                                                                                                {page}
                                                                                            </a>
                                                                                        </li>
                                                                                    ))}
                                                                                    <li
                                                                                        className={`paginate_button page-item next ${
                                                                                            displayPage >= displayTotalPages ? 'disabled' : ''
                                                                                        }`}
                                                                                    >
                                                                                        <a
                                                                                            href="#"
                                                                                            className="page-link"
                                                                                            onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                if (displayPage < displayTotalPages) {
                                                                                                    handlePaginationChange(displayPage + 1, displayPageSize);
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
                                                                            className="form-select form-select-sm"
                                                                            value={pagination.pageSize}
                                                                            onChange={(e) => {
                                                                                handlePaginationChange(1, parseInt(e.target.value));
                                                                            }}
                                                                        >
                                                                            <option value={10}>10</option>
                                                                            <option value={25}>25</option>
                                                                            <option value={50}>50</option>
                                                                            <option value={100}>100</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="alert alert-info">
                                            <FiShoppingCart className="me-2" />
                                            No purchases found for this supplier.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default SupplierPurchasing;
