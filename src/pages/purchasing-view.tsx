import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { purchasingService, Purchase } from '@/services/purchasingService';
import { supplierService, Supplier } from '@/services/supplierService';
import Swal from 'sweetalert2';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import { FiShoppingCart, FiArrowLeft, FiCalendar, FiDollarSign, FiTag, FiBox, FiEdit3, FiPrinter } from 'react-icons/fi';
import Table from '@/components/shared/table/Table';

const PurchasingView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const purchaseId = searchParams.get('id');
    const navigate = useNavigate();

    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPurchaseDetails = useCallback(async () => {
        if (!purchaseId) {
            setError('Purchase ID is missing.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const data = await purchasingService.getPurchaseById(purchaseId);
            setPurchase(data);
            
            // Fetch supplier details for printing
            if (data.supplierId) {
                try {
                    const supplierData = await supplierService.getSupplierById(data.supplierId);
                    setSupplier(supplierData);
                } catch (supplierErr) {
                    console.error('Failed to fetch supplier details:', supplierErr);
                    // Don't show error for supplier fetch failure, just continue without supplier info
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load purchase details');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to load purchase details',
            });
        } finally {
            setLoading(false);
        }
    }, [purchaseId]);

    useEffect(() => {
        fetchPurchaseDetails();
    }, [fetchPurchaseDetails]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'Complete':
                return 'bg-success';
            case 'Pending':
                return 'bg-warning';
            case 'Overdue':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    const handleUpdatePaymentStatus = async () => {
        if (!purchase) return;
        
        const { value: newStatus } = await Swal.fire({
            title: 'Update Payment Status',
            text: `Current status: ${purchase.paymentStatus}`,
            input: 'select',
            inputOptions: {
                'Complete': 'Complete',
                'Pending': 'Pending',
                'Overdue': 'Overdue'
            },
            inputValue: purchase.paymentStatus,
            showCancelButton: true,
            confirmButtonColor: '#3454d1',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Update',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to select a status!';
                }
            }
        });

        if (newStatus && newStatus !== purchase.paymentStatus) {
            try {
                await purchasingService.updatePaymentStatus(purchase.purchaseId!, { paymentStatus: newStatus as 'Complete' | 'Pending' | 'Overdue' });
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Payment status has been updated.',
                    timer: 2000,
                    showConfirmButton: false,
                });
                fetchPurchaseDetails();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err instanceof Error ? err.message : 'Failed to update payment status',
                });
            }
        }
    };

    // Print purchase receipt function
    const printReceipt = () => {
        if (!purchase) return;

        const invoiceNumber = purchase.invoiceNumber || "N/A";
        const invoiceDate = purchase.invoiceDate;
        const paymentMethod = purchase.paymentMethod || "N/A";
        const paymentStatus = purchase.paymentStatus || "Pending";
        const totalAmount = purchase.totalAmount || 0;
        const paymentDueDate = purchase.paymentDueDate;

        // Use purchase items from API
        const printItems = purchase.purchaseItems || [];

        // Get current local date/time
        const now = new Date();
        const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const month = monthNames[now.getMonth()];
        const day = now.getDate().toString().padStart(2, "0");
        const year = now.getFullYear();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const seconds = now.getSeconds().toString().padStart(2, "0");
        const currentTime = `${hours}:${minutes}:${seconds}`;
        const formattedDateTime = `${day} ${month} ${year} ${currentTime}`;
        const employeeName =
            localStorage.getItem("pharmacy_employee_name") || "Unknown Employee";

        // Format invoice date
        const invoiceDateObj = invoiceDate ? new Date(invoiceDate) : new Date();
        const invoiceDateFormatted = `${invoiceDateObj
            .getDate()
            .toString()
            .padStart(2, "0")} ${
            monthNames[invoiceDateObj.getMonth()]
        } ${invoiceDateObj.getFullYear()}`;

        // Create printable content
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Purchase ${invoiceNumber}</title>
                <style>
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 10px;
                            width: 80mm;
                            font-family: Arial, sans-serif;
                        }
                    }
                    body {
                        margin: 0;
                        padding: 10px;
                        width: 80mm;
                        font-family: Arial, sans-serif;
                        font-size: 18px;
                        text-align: center;
                    }
                    .receipt-container {
                        width: 100%;
                        max-width: 80mm;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    .pharmacy-name {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .pharmacy-info {
                        font-size: 15px;
                        line-height: 1.4;
                    }
                    .divider {
                        border-top: 1px solid #000;
                        margin: 10px 0;
                    }
                    .receipt-info {
                        text-align: center;
                        margin: 10px 0;
                        font-size: 14px;
                    }
                    .invoice-number {
                        font-weight: bold;
                        font-size: 15px;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                        font-size: 13px;
                    }
                    .items-table th {
                        text-align: center;
                        font-weight: bold;
                        padding: 5px 2px;
                        border-bottom: 1px solid #000;
                    }
                    .items-table td {
                        padding: 6px 2px;
                        vertical-align: top;
                    }
                    .items-table .col-ln {
                        width: 8%;
                        text-align: center;
                    }
                    .items-table .col-item {
                        width: 45%;
                        text-align: left;
                    }
                    .items-table .col-price {
                        width: 18%;
                        text-align: right;
                    }
                    .items-table .col-qty {
                        width: 12%;
                        text-align: right;
                    }
                    .items-table .col-amount {
                        width: 17%;
                        text-align: right;
                    }
                    .totals {
                        margin-top: 10px;
                        font-size: 14px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 3px 0;
                    }
                    .grand-total {
                        font-weight: bold;
                        font-size: 18px;
                        margin-top: 5px;
                        padding-top: 5px;
                        border-top: 1px solid #000;
                    }
                    .payment-info {
                        margin-top: 10px;
                        font-size: 14px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 15px;
                        font-size: 13px;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        <div class="pharmacy-name">SETHSUWA PHARMACY</div>
                        <div class="pharmacy-info">
                            No 47/A, Main Street, Kotiyakumbura<br>
                            035 2289351 | 078 20 20 157
                        </div>
                    </div>
                    <div class="divider"></div>
                    <div class="receipt-info">
                        ${formattedDateTime}<br>
                        <span class="invoice-number">Invoice Number: ${invoiceNumber}</span><br>
                        Invoice Date: ${invoiceDateFormatted}<br>
                        Issued By: ${employeeName}
                    </div>
                    <div class="divider"></div>
                    <div class="receipt-info" style="text-align: left; font-size: 13px;">
                        <strong>Supplier:</strong> ${supplier?.supplierName || purchase.supplierId || "N/A"}<br>
                        ${supplier?.contactNumber ? `<strong>Contact:</strong> ${supplier.contactNumber}<br>` : ""}
                        ${supplier?.emailAddress ? `<strong>Email:</strong> ${supplier.emailAddress}<br>` : ""}
                    </div>
                    <div class="divider"></div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th class="col-ln"></th>
                                <th class="col-item">Item</th>
                                <th class="col-price">Price</th>
                                <th class="col-qty">Qty</th>
                                <th class="col-amount">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${printItems
                                .map((item, index) => {
                                    const quantity = item.quantity || 0;
                                    const costPrice = item.costPrice || 0;
                                    const subtotal = costPrice * quantity;
                                    const productName = item.productName || item.productSKU || "N/A";
                                    return `
                                    <tr>
                                        <td class="col-ln">${index + 1}</td>
                                        <td class="col-item">${productName}</td>
                                        <td class="col-price">${costPrice.toFixed(2)}</td>
                                        <td class="col-qty">${quantity}</td>
                                        <td class="col-amount">${subtotal.toFixed(2)}</td>
                                    </tr>
                                `;
                                })
                                .join("")}
                        </tbody>
                    </table>
                    <div class="divider"></div>
                    <div class="totals">
                        <div class="total-row grand-total">
                            <span>Total Amount (LKR):</span>
                            <span>${totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="payment-info">
                        <div class="total-row">
                            <span>Payment Status:</span>
                            <span>${paymentStatus}</span>
                        </div>
                        <div class="total-row">
                            <span>Payment Method:</span>
                            <span>${paymentMethod}</span>
                        </div>
                        ${paymentDueDate
                            ? `
                            <div class="total-row">
                                <span>Payment Due Date:</span>
                                <span>${new Date(paymentDueDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}</span>
                            </div>
                        `
                            : ""}
                    </div>
                    <div class="footer">
                        <div>Thank You!</div>
                        <div>Developed by Ocevia Lab PVT LTD</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Create a hidden iframe for printing
        const printIframe = document.createElement("iframe");
        printIframe.style.display = "none";
        printIframe.style.width = "80mm";
        printIframe.style.height = "auto";
        printIframe.style.border = "none";
        document.body.appendChild(printIframe);
        
        const triggerPrint = () => {
            setTimeout(() => {
                try {
                    if (printIframe.contentWindow) {
                        printIframe.contentWindow.focus();
                        printIframe.contentWindow.print();
                    }
                } catch (e) {
                    console.error("Print failed:", e);
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Failed to print receipt. Please try again or check browser permissions.",
                    });
                } finally {
                    // Cleanup: remove iframe after a delay to allow print dialog to open
                    setTimeout(() => {
                        if (document.body.contains(printIframe)) {
                            document.body.removeChild(printIframe);
                        }
                    }, 1000);
                }
            }, 250);
        };

        const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(printContent);
            iframeDoc.close();
            
            // Wait for content to load, then trigger print
            printIframe.onload = triggerPrint;
            
            // Fallback: trigger print after a short delay if onload doesn't fire
            setTimeout(() => {
                if (document.body.contains(printIframe)) {
                    triggerPrint();
                }
            }, 500);
        } else {
            // Fallback if iframe document not accessible
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Unable to access print frame. Please try again.",
            });
            if (document.body.contains(printIframe)) {
                document.body.removeChild(printIframe);
            }
        }
    };

    const purchaseItemsColumns = [
        {
            accessorKey: 'productName',
            header: () => 'Product Name',
            cell: (info: any) => {
                const productName = info.getValue();
                return (
                    <span className="fw-semibold">
                        {productName || 'N/A'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'productSKU',
            header: () => 'Product SKU',
            cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>,
        },
        {
            accessorKey: 'quantity',
            header: () => 'Quantity',
            cell: (info: any) => <span>{info.getValue()}</span>,
        },
        {
            accessorKey: 'costPrice',
            header: () => 'Cost Price',
            cell: (info: any) => <span>{info.getValue().toLocaleString()} LKR</span>,
        },
        {
            accessorKey: 'sellingPrice',
            header: () => 'Selling Price',
            cell: (info: any) => <span>{info.getValue().toLocaleString()} LKR</span>,
        },
        {
            accessorKey: 'expireDate',
            header: () => 'Expire Date',
            cell: (info: any) => <span>{formatDate(info.getValue())}</span>,
        },
        {
            accessorKey: 'total',
            header: () => 'Total',
            cell: (info: any) => {
                const costPrice = info.row.original.costPrice;
                const quantity = info.row.original.quantity;
                return <span className="fw-semibold">{(costPrice * quantity).toLocaleString()} LKR</span>;
            },
        },
    ];

    const purchaseItemsTableData = purchase?.purchaseItems.map((item, index) => ({
        id: index,
        ...item,
    })) || [];

    if (loading) {
        return (
            <>
                <PageHeader>
                    <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                        <button className="btn btn-light-brand" onClick={() => navigate('/purchasing/list')}>
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

    if (error || !purchase) {
        return (
            <>
                <PageHeader>
                    <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                        <button className="btn btn-light-brand" onClick={() => navigate('/purchasing/list')}>
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
                                    <p className="text-danger">{error || 'Purchase not found'}</p>
                                    <button className="btn btn-primary" onClick={() => navigate('/purchasing/list')}>
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
                <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
                    <button className="btn btn-light-brand" onClick={() => navigate('/purchasing/list')}>
                        <FiArrowLeft size={16} className='me-2' />
                        <span>Back to List</span>
                    </button>
                </div>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <div className="d-flex align-items-center justify-content-between gap-3 my-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="avatar avatar-md bg-light-primary">
                                            <FiShoppingCart size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <h5 className="card-title mb-1 fw-bold">Purchase Details: {purchase.invoiceNumber}</h5>
                                            <p className="text-muted mb-0 fs-12">Purchase ID: {purchase.purchaseId}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={printReceipt}
                                        title="Print Purchase Receipt"
                                    >
                                        <FiPrinter className="me-1" />
                                        Print Receipt
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="row g-3 mb-4">
                                    {/* Purchase Information Card */}
                                    <div className="col-12 col-lg-6">
                                        <div className="card h-100" style={{
                                            background: 'rgba(52, 84, 209, 0.05)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(52, 84, 209, 0.15)'
                                        }}>
                                            <div className="card-header bg-transparent border-0 pb-2">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar avatar-sm bg-light-primary">
                                                        <FiShoppingCart size={16} className="text-primary" />
                                                    </div>
                                                    <h6 className="mb-0 fw-bold">Purchase Information</h6>
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">
                                                <div className="row g-3">
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Purchase ID</span>
                                                            <span className="fw-bold">{purchase.purchaseId}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Invoice Number</span>
                                                            <span className="fw-semibold">{purchase.invoiceNumber}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Supplier ID</span>
                                                            <span className="badge bg-info">{purchase.supplierId}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Invoice Date</span>
                                                            <span className="fw-semibold">{formatDate(purchase.invoiceDate)}</span>
                                                        </div>
                                                    </div>
                                                    {purchase.paymentMethod && (
                                                        <div className="col-12">
                                                            <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                                <span className="text-muted fs-12">Payment Method</span>
                                                                <span className="fw-semibold">{purchase.paymentMethod}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Information Card */}
                                    <div className="col-12 col-lg-6">
                                        <div className="card h-100" style={{
                                            background: 'rgba(23, 198, 102, 0.05)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(23, 198, 102, 0.15)'
                                        }}>
                                            <div className="card-header bg-transparent border-0 pb-2">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar avatar-sm bg-light-success">
                                                        <FiDollarSign size={16} className="text-success" />
                                                    </div>
                                                    <h6 className="mb-0 fw-bold">Payment Information</h6>
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">
                                                <div className="row g-3">
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <div>
                                                                <span className="text-muted fs-12 d-block mb-1">Total Amount</span>
                                                                <span className="fw-bold fs-20 text-primary">{purchase.totalAmount.toLocaleString()} LKR</span>
                                                            </div>
                                                            <div className="avatar avatar-md bg-light-primary">
                                                                <FiDollarSign size={20} className="text-primary" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Payment Status</span>
                                                            <span className={`badge ${getPaymentStatusBadge(purchase.paymentStatus)}`}>
                                                                {purchase.paymentStatus}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Payment Due Date</span>
                                                            <span className="fw-semibold">{formatDate(purchase.paymentDueDate)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <button
                                                            className="btn btn-sm btn-primary w-100"
                                                            onClick={handleUpdatePaymentStatus}
                                                        >
                                                            <FiEdit3 className="me-1" />
                                                            Update Payment Status
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase Items */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <h6 className="mb-3 fw-bold">Purchase Items</h6>
                                        {purchase.purchaseItems && purchase.purchaseItems.length > 0 ? (
                                            <Table data={purchaseItemsTableData} columns={purchaseItemsColumns} />
                                        ) : (
                                            <div className="alert alert-info">
                                                <FiBox className="me-2" />
                                                No items found for this purchase.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PurchasingView;

