import React, { memo, useEffect, useState, useCallback } from 'react'
import Table from '@/components/shared/table/Table';
import { FiMoreHorizontal, FiEye, FiCheckCircle, FiRotateCw, FiShoppingBag, FiX } from 'react-icons/fi'
import Dropdown from '@/components/shared/Dropdown';
import { useNavigate } from 'react-router-dom';
import { salesService, SalesListItem, CompletePayLaterRequest } from '@/services/salesService';
import Swal from 'sweetalert2';

const PayLaterTable: React.FC = () => {
    const [payLaterList, setPayLaterList] = useState<SalesListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [selectedSaleItems, setSelectedSaleItems] = useState<SalesListItem | null>(null);
    const navigate = useNavigate();

    // Fetch pay-later list from API
    const fetchPayLaterList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await salesService.getPayLaterList();
            setPayLaterList(data);
            setTotalItems(data.length);
            setTotalPages(Math.ceil(data.length / pageSize));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load pay-later list');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to load pay-later list',
            });
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchPayLaterList();
    }, [fetchPayLaterList]);

    // Handle complete pay-later payment
    const handleCompletePayment = async (receiptNumber: string) => {
        const { value: formValues } = await Swal.fire({
            title: 'Complete Pay-Later Payment',
            html: `
                <select id="paymentMethod" class="swal2-select">
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <input id="receivedAmount" class="swal2-input" type="number" step="0.01" placeholder="Received Amount" required>
                <input id="roundingDiscount" class="swal2-input" type="number" placeholder="Rounding Discount (optional)" value="0">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#3454d1',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Complete Payment',
            preConfirm: () => {
                const paymentMethod = (document.getElementById('paymentMethod') as HTMLSelectElement)?.value || '';
                const receivedAmount = parseFloat((document.getElementById('receivedAmount') as HTMLInputElement)?.value || '0');
                const roundingDiscount = parseFloat((document.getElementById('roundingDiscount') as HTMLInputElement)?.value || '0');

                if (!paymentMethod) {
                    Swal.showValidationMessage('Payment method is required');
                    return false;
                }
                if (receivedAmount <= 0) {
                    Swal.showValidationMessage('Received amount must be greater than 0');
                    return false;
                }

                return {
                    paymentMethod,
                    receivedAmount,
                    roundingDiscount: roundingDiscount || undefined,
                };
            }
        });

        if (formValues) {
            try {
                await salesService.completePayLater(receiptNumber, formValues as CompletePayLaterRequest);
                Swal.fire({
                    icon: 'success',
                    title: 'Completed!',
                    text: 'Pay-later payment has been completed.',
                    timer: 2000,
                    showConfirmButton: false,
                });
                fetchPayLaterList();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err instanceof Error ? err.message : 'Failed to complete payment',
                });
            }
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Format time
    const formatTime = (timeString: string) => {
        if (!timeString) return 'N/A';
        return timeString.split('.')[0];
    };

    // Get sale status badge color
    const getSaleStatusBadge = (status: string) => {
        switch (status) {
            case 'Paid':
                return 'bg-success';
            case 'Unpaid':
                return 'bg-warning';
            case 'PayLater':
                return 'bg-info';
            case 'Cancelled':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    // Handle view items
    const handleViewItems = (sale: SalesListItem) => {
        setSelectedSaleItems(sale);
        setShowItemsModal(true);
    };

    // Items table columns
    const itemsTableColumns = [
        {
            accessorKey: 'productName',
            header: () => 'Product Name',
            cell: (info: any) => <span className="fw-semibold">{info.getValue()}</span>,
        },
        {
            accessorKey: 'productSku',
            header: () => 'Product SKU',
            cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>,
        },
        {
            accessorKey: 'quantity',
            header: () => 'Quantity',
            cell: (info: any) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: 'price',
            header: () => 'Price',
            cell: (info: any) => <span>{(info.getValue() || 0).toLocaleString()} LKR</span>,
        },
        {
            accessorKey: 'subTotal',
            header: () => 'Subtotal',
            cell: (info: any) => <span className="fw-semibold text-primary">{(info.getValue() || 0).toLocaleString()} LKR</span>,
        },
    ];

    // Transform API data to table format
    const tableData = payLaterList.map((sale) => {
        // Since this is the PayLater list, all items should show PayLater status
        return {
            id: sale.salesId,
            salesId: sale.salesId,
            receiptNumber: sale.receiptNumber,
            date: sale.date,
            time: sale.time,
            saleStatus: 'PayLater', // All items in PayLater list should show PayLater status
            totalAmount: sale.totalAmount || 0,
            finalAmountDue: sale.finalAmountDue || 0,
            customerName: sale.customerName,
            issuedBy: sale.issuedBy,
            itemsCount: sale.items?.length || 0,
            items: sale.items, // Include items for the modal
        };
    });

    // Items table data for modal
    const itemsTableData = selectedSaleItems?.items?.map((item, index) => ({
        id: index,
        ...item,
    })) || [];

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
            cell: (info: any) => {
                const receiptNumber = info.row.original.receiptNumber;
                const actions = [
                    {
                        label: "View Details",
                        icon: <FiEye />,
                        onClick: () => {
                            navigate(`/sales/view?receiptNumber=${receiptNumber}`);
                        }
                    },
                    {
                        label: "Complete Payment",
                        icon: <FiCheckCircle />,
                        onClick: () => handleCompletePayment(receiptNumber)
                    },
                ] as any[];

                return (
                    <div className="hstack gap-2 justify-content-end">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(`/sales/view?receiptNumber=${receiptNumber}`);
                            }}
                            className="avatar-text avatar-md"
                            title="View"
                        >
                            <FiEye />
                        </a>
                        <Dropdown
                            dropdownItems={actions}
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
                headerClassName: 'text-end'
            }
        },
        {
            accessorKey: 'receiptNumber',
            header: () => 'Receipt Number',
            cell: (info: any) => {
                const receiptNumber = info.getValue();
                return (
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/sales/view?receiptNumber=${receiptNumber}`);
                        }}
                        className="text-decoration-none"
                    >
                        <span className="fw-semibold">{receiptNumber}</span>
                    </a>
                );
            }
        },
        {
            accessorKey: 'date',
            header: () => 'Date',
            cell: (info: any) => <span>{formatDate(info.getValue())}</span>
        },
        {
            accessorKey: 'time',
            header: () => 'Time',
            cell: (info: any) => <span>{formatTime(info.getValue())}</span>
        },
        {
            accessorKey: 'saleStatus',
            header: () => 'Status',
            cell: (info: any) => {
                const status = info.getValue();
                return (
                    <span className={`badge ${getSaleStatusBadge(status)}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            accessorKey: 'totalAmount',
            header: () => 'Total Amount',
            cell: (info: any) => {
                const value = info.getValue();
                return <span className="fw-semibold">{(value || 0).toLocaleString()} LKR</span>;
            }
        },
        {
            accessorKey: 'finalAmountDue',
            header: () => 'Amount Due',
            cell: (info: any) => {
                const value = info.getValue();
                return <span className="fw-semibold text-warning">{(value || 0).toLocaleString()} LKR</span>;
            }
        },
        {
            accessorKey: 'customerName',
            header: () => 'Customer',
            cell: (info: any) => <span>{info.getValue()}</span>
        },
        {
            accessorKey: 'issuedBy',
            header: () => 'Issued By',
            cell: (info: any) => <span>{info.getValue()}</span>
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
                    <button className="btn btn-primary" onClick={fetchPayLaterList}>
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
            
            {/* Items Modal */}
            {showItemsModal && selectedSaleItems && (
                <>
                    <div
                        className={`modal fade ${showItemsModal ? 'show' : ''}`}
                        style={{ display: showItemsModal ? 'block' : 'none' }}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="itemsModalLabel"
                    >
                        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold" id="itemsModalLabel">
                                        <FiShoppingBag className="me-2" />
                                        Receipt Items - {selectedSaleItems.receiptNumber}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setShowItemsModal(false);
                                            setSelectedSaleItems(null);
                                        }}
                                        aria-label="Close"
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    {selectedSaleItems.items && selectedSaleItems.items.length > 0 ? (
                                        <Table data={itemsTableData} columns={itemsTableColumns} />
                                    ) : (
                                        <div className="alert alert-info">
                                            <FiShoppingBag className="me-2" />
                                            No items found for this receipt.
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowItemsModal(false);
                                            setSelectedSaleItems(null);
                                        }}
                                    >
                                        <FiX className="me-2" />
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {showItemsModal && (
                        <div
                            className="modal-backdrop fade show"
                            onClick={() => {
                                setShowItemsModal(false);
                                setSelectedSaleItems(null);
                            }}
                            style={{ zIndex: 1040 }}
                        ></div>
                    )}
                </>
            )}
        </div>
    );
};

export default PayLaterTable;

