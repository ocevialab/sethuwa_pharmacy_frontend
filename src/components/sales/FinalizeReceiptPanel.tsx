import React, { useState, useEffect, useRef } from 'react';
import {
  salesService,
  Receipt,
  FinalizeReceiptRequest,
  FinalizeReceiptResponse,
  PaymentEntry,
} from '@/services/salesService';
import Swal from 'sweetalert2';
import { FiPlus, FiTrash2, FiDollarSign, FiFileText, FiX, FiCheckCircle, FiPrinter, FiDownload } from 'react-icons/fi';
import { PDFReportGenerator } from '@/utils/pdfReportGenerator';

interface FinalizeReceiptPanelProps {
  receiptNumber: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FinalizeReceiptPanel: React.FC<FinalizeReceiptPanelProps> = ({
  receiptNumber,
  onClose,
  onSuccess,
}) => {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFinalizeForm, setShowFinalizeForm] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [finalizeResponse, setFinalizeResponse] = useState<FinalizeReceiptResponse | null>(null);
  const [finalizedReceipt, setFinalizedReceipt] = useState<Receipt | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<{ received: number; change: number; payments: PaymentEntry[] } | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    contactNumber: '',
    emailAddress: '',
    customerDiscountPercent: 0,
    roundingDiscount: 0,
    paymentMethod: 'Cash' as 'Cash' | 'Card' | 'Bank Transfer' | 'PayLater',
    receivedAmount: 0,
  });
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const customerPaymentSectionRef = useRef<HTMLDivElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const paymentAmountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!receiptNumber) {
      setReceipt(null);
      setError(null);
      setShowFinalizeForm(false);
      setPayments([]);
      return;
    }
    setPaymentSummary(null);
    let cancelled = false;
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        setError(null);
        setShowFinalizeForm(false);
        const data = await salesService.getReceipt(receiptNumber);
        if (!cancelled) setReceipt(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load receipt';
        if (!cancelled) {
          setError(msg);
          setReceipt(null);
        }
        if (!msg.includes('not available')) {
          Swal.fire({ icon: 'error', title: 'Error', text: msg });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReceipt();
    return () => { cancelled = true; };
  }, [receiptNumber]);

  useEffect(() => {
    if (showFinalizeForm && receipt) {
      setFormData({
        customerName: receipt.customerName || '',
        contactNumber: '',
        emailAddress: '',
        customerDiscountPercent: receipt.customerDiscountPercent || 0,
        roundingDiscount: receipt.roundingDiscount || 0,
        paymentMethod: 'Cash',
        receivedAmount: receipt.finalAmountDue || 0,
      });
      const totalAmount = receipt.totalAmount || 0;
      const customerDiscountPercent = receipt.customerDiscountPercent || 0;
      const roundingDiscount = receipt.roundingDiscount || 0;
      const finalDue =
        totalAmount -
        (totalAmount * customerDiscountPercent) / 100 -
        roundingDiscount;
      setPayments([
        {
          paymentMethod: 'Cash',
          paymentAmount: finalDue || 0,
          paymentDate: new Date().toISOString(),
        },
      ]);
    }
  }, [showFinalizeForm, receipt]);

  // Auto-focus Customer & Payment section when Finalize Receipt is clicked
  useEffect(() => {
    if (showFinalizeForm && receipt?.saleStatus === 'Draft') {
      customerPaymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => paymentAmountInputRef.current?.focus(), 100);
    }
  }, [showFinalizeForm, receipt?.saleStatus]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-LK', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const addPayment = () => {
    setPayments([
      ...payments,
      {
        paymentMethod: 'Cash',
        paymentAmount: 0,
        paymentDate: new Date().toISOString(),
      },
    ]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (
    index: number,
    field: keyof PaymentEntry,
    value: string | number
  ) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  const getTotalPayments = () => {
    return payments.reduce((sum, payment) => sum + (payment.paymentAmount || 0), 0);
  };

  const handleFinalizePaid = async () => {
    if (!receipt || !receiptNumber) return;
    const customerDiscountAmt =
      (receipt.totalAmount || 0) * (formData.customerDiscountPercent / 100);
    const subtotalAfterDiscount = (receipt.totalAmount || 0) - customerDiscountAmt;
    const finalDue = subtotalAfterDiscount - formData.roundingDiscount;

    if (payments.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please add at least one payment method.',
      });
      return;
    }
    const totalPayments = getTotalPayments();
    const hasPayLater = payments.some((p) => p.paymentMethod === 'PayLater');
    if (hasPayLater) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Cannot complete as paid with Pay Later. Please select another payment method.',
      });
      return;
    }
    if (totalPayments < finalDue) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Total payment amount must be at least ${finalDue.toFixed(2)} LKR to complete as paid.`,
      });
      return;
    }

    const requestData: FinalizeReceiptRequest = {
      customerDiscountPercent: formData.customerDiscountPercent,
      roundingDiscount: formData.roundingDiscount,
      payments: payments.map((p) => ({
        paymentMethod: p.paymentMethod,
        paymentAmount: p.paymentAmount,
        paymentDate: p.paymentDate,
      })),
    };
    const name = formData.customerName.trim();
    if (name) requestData.customerName = name;
    const contact = formData.contactNumber.trim();
    if (contact) requestData.contactNumber = contact;
    const email = formData.emailAddress.trim();
    if (email) requestData.emailAddress = email;

    // Save what the customer physically handed over (original unadjusted amounts)
    setPaymentSummary({ received: totalPayments, change: Math.max(0, totalPayments - finalDue), payments: [...payments] });

    try {
      const response = await salesService.finalizeReceipt(receiptNumber, requestData);
      setShowFinalizeForm(false);

      // Fetch the updated receipt
      const updatedReceipt = await salesService.getReceipt(receiptNumber);
      // Merge form-entered customer name so it always appears on the receipt
      const receiptWithContact = {
        ...updatedReceipt,
        customerName: name || updatedReceipt.customerName || null,
        contactNumber: contact || undefined,
        emailAddress: email || undefined,
      } as Receipt & { contactNumber?: string; emailAddress?: string };
      setFinalizedReceipt(receiptWithContact);
      setFinalizeResponse(response);
      setShowReceiptModal(true);

      // Update local receipt state
      setReceipt((prev) =>
        prev
          ? {
              ...prev,
              finalAmountDue: response.amountDue,
              saleStatus: response.status as Receipt['saleStatus'],
              paymentMethod: payments.length === 1 ? payments[0].paymentMethod : 'Multiple',
              customerName: name,
              customerDiscountPercent: formData.customerDiscountPercent,
              roundingDiscount: formData.roundingDiscount,
            }
          : null
      );
      onSuccess();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to finalize receipt',
      });
    }
  };

  const handleFinalizeUnpaid = async () => {
    if (!receipt || !receiptNumber) return;
    const customerDiscountAmt =
      (receipt.totalAmount || 0) * (formData.customerDiscountPercent / 100);
    const subtotalAfterDiscount = (receipt.totalAmount || 0) - customerDiscountAmt;
    const finalDue = subtotalAfterDiscount - formData.roundingDiscount;
    const totalPayments = getTotalPayments();

    if (payments.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please add at least one payment method.',
      });
      return;
    }
    if (totalPayments <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Total payment amount must be greater than 0.',
      });
      return;
    }

    const requestData: FinalizeReceiptRequest = {
      paymentMethod: 'PayLater',
      receivedAmount: totalPayments,
      customerDiscountPercent: formData.customerDiscountPercent,
      roundingDiscount: formData.roundingDiscount,
      saleStatus: 'Unpaid',
      payments: payments.map((p) => ({
        paymentMethod: p.paymentMethod,
        paymentAmount: p.paymentAmount,
        paymentDate: p.paymentDate,
      })),
    };
    const name = formData.customerName.trim();
    if (name) requestData.customerName = name;
    const contact = formData.contactNumber.trim();
    if (contact) requestData.contactNumber = contact;
    const email = formData.emailAddress.trim();
    if (email) requestData.emailAddress = email;

    try {
      const response = await salesService.finalizeReceipt(receiptNumber, requestData);
      setShowFinalizeForm(false);

      // Fetch the updated receipt
      const updatedReceipt = await salesService.getReceipt(receiptNumber);
      // Merge form-entered customer name so it always appears on the receipt
      const receiptWithContact = {
        ...updatedReceipt,
        customerName: name || updatedReceipt.customerName || null,
        contactNumber: contact || undefined,
        emailAddress: email || undefined,
      } as Receipt & { contactNumber?: string; emailAddress?: string };
      setFinalizedReceipt(receiptWithContact);
      setFinalizeResponse(response);
      setShowReceiptModal(true);

      // Update local receipt state
      setReceipt((prev) =>
        prev
          ? {
              ...prev,
              saleStatus: 'Unpaid',
              paymentMethod: 'PayLater',
              customerName: name,
              customerDiscountPercent: formData.customerDiscountPercent,
              roundingDiscount: formData.roundingDiscount,
            }
          : null
      );
      onSuccess();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to finalize receipt',
      });
    }
  };

  // Receipt Modal handlers
  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setFinalizeResponse(null);
    setFinalizedReceipt(null);
    setPaymentSummary(null);
  };

  // Print receipt function using existing pattern from sales-view.tsx
  const printReceipt = () => {
    if (!finalizedReceipt) return;
    const receiptData = finalizedReceipt;
    // Calculate totals
    const grossTotal = receiptData.totalAmount;
    const customerDiscount =
      receiptData.customerDiscountPercent > 0
        ? (grossTotal * receiptData.customerDiscountPercent) / 100
        : 0;
    const roundingDiscount = receiptData.roundingDiscount || 0;
    const totalDiscount = customerDiscount + roundingDiscount;
    const grandTotal = grossTotal - totalDiscount;
    const receivedAmount = paymentSummary?.received ?? grandTotal;
    const change = paymentSummary?.change ?? 0;
    const amountDue = receiptData.finalAmountDue || 0;
    
    // Get current local date/time
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[now.getMonth()];
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;
    const formattedDateTime = `${day} ${month} ${year} ${currentTime}`;
    
    const preparedBy = receiptData.issuedBy || 'Unknown Employee';
    const issuedBy = localStorage.getItem('pharmacy_employee_name') || 'Unknown Employee';
    
    // Create printable content (same as sales-view.tsx)
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receiptData.receiptNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          @media print {
            body { margin: 0; padding: 10px; width: 80mm; font-family: Arial, sans-serif; }
          }
          body { margin: 0; padding: 10px; width: 80mm; font-family: Arial, sans-serif; font-size: 18px; text-align: center; }
          .receipt-container { width: 100%; max-width: 80mm; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 15px; }
          .pharmacy-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .pharmacy-info { font-size: 15px; line-height: 1.4; }
          .divider { border-top: 1px solid #000; margin: 10px 0; }
          .receipt-info { text-align: center; margin: 10px 0; font-size: 14px; }
          .receipt-number { font-weight: bold; font-size: 15px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
          .items-table th { text-align: center; font-weight: bold; padding: 5px 2px; border-bottom: 1px solid #000; }
          .items-table td { padding: 6px 2px; vertical-align: top; }
          .items-table .col-ln { width: 8%; text-align: center; }
          .items-table .col-item { width: 45%; text-align: left; }
          .items-table .col-price { width: 18%; text-align: right; }
          .items-table .col-qty { width: 12%; text-align: right; }
          .items-table .col-amount { width: 17%; text-align: right; }
          .totals { margin-top: 10px; font-size: 14px; }
          .total-row { display: flex; justify-content: space-between; padding: 3px 0; }
          .grand-total { font-weight: bold; font-size: 18px; margin-top: 5px; padding-top: 5px; border-top: 1px solid #000; }
          .payment-info { margin-top: 10px; font-size: 14px; }
          .footer { text-align: center; margin-top: 15px; font-size: 13px; font-style: italic; }
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
            <span class="receipt-number">Receipt Number: ${receiptData.receiptNumber}</span><br>
            Prepare by: ${preparedBy}<br>
            Issue By: ${issuedBy}${receiptData.customerName ? `<br>Customer: ${receiptData.customerName}` : ''}
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
              ${receiptData.items.map((item, index) => `
                <tr>
                  <td class="col-ln">${index + 1}</td>
                  <td class="col-item">${item.productName}</td>
                  <td class="col-price">${item.price.toFixed(2)}</td>
                  <td class="col-qty">${item.quantity}</td>
                  <td class="col-amount">${item.subTotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="totals">
            <div class="total-row">
              <span>Gross Total:</span>
              <span>${grossTotal.toFixed(2)}</span>
            </div>
            ${totalDiscount > 0 ? `
              <div class="total-row">
                <span>Discount:</span>
                <span>-${totalDiscount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Grand Total (LKR):</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          ${receiptData.saleStatus === 'Paid' ? `
            <div class="payment-info">
              ${(paymentSummary?.payments ?? []).map(p => `
                <div class="total-row">
                  <span>${p.paymentMethod} Received:</span>
                  <span>${p.paymentAmount.toFixed(2)}</span>
                </div>
              `).join('')}
              ${(paymentSummary?.payments?.length ?? 0) > 1 ? `
                <div class="total-row" style="border-top:1px dashed #000; margin-top:3px; padding-top:3px;">
                  <span>Total Received:</span>
                  <span>${receivedAmount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-row">
                <span>Change:</span>
                <span>${change.toFixed(2)}</span>
              </div>
            </div>
          ` : receiptData.paymentMethod === 'PayLater' ? `
            <div class="payment-info">
              <div class="total-row">
                <span>Payment Method:</span>
                <span>Pay Later</span>
              </div>
              <div class="total-row">
                <span>Amount Due:</span>
                <span>${amountDue.toFixed(2)}</span>
              </div>
            </div>
          ` : ''}
          <div class="footer">
            ${receiptData.customerName ? `<div>Thank You ${receiptData.customerName}!</div>` : ''}
            <div>Wish you good health.</div>
            <div>*No returns on Items*</div>
            <div>Developed by Ocevia Lab PVT LTD</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Create a hidden iframe for printing
    const printIframe = document.createElement('iframe');
    printIframe.style.display = 'none';
    printIframe.style.width = '80mm';
    printIframe.style.height = 'auto';
    printIframe.style.border = 'none';
    document.body.appendChild(printIframe);
    const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      printIframe.onload = () => {
        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (e) {
            console.error('Print failed:', e);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to print receipt. Please try again or check browser permissions.',
            });
          } finally {
            setTimeout(() => {
              document.body.removeChild(printIframe);
            }, 1000);
          }
        }, 250);
      };
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Unable to access print frame. Please try again.',
      });
      document.body.removeChild(printIframe);
    }
  };

  const handleDownloadReceipt = () => {
    if (!finalizedReceipt) return;
    const generator = new PDFReportGenerator();
    const receiptWithExtras = finalizedReceipt as Receipt & {
      contactNumber?: string;
      emailAddress?: string;
    };
    generator.generateReceiptBill(
      {
        ...receiptWithExtras,
        contactNumber: receiptWithExtras.contactNumber,
        emailAddress: receiptWithExtras.emailAddress,
      },
      finalizeResponse?.amountDue ? finalizedReceipt.finalAmountDue - (finalizeResponse.amountDue || 0) : undefined
    );
    generator.download(`Receipt_${finalizedReceipt.receiptNumber}.pdf`);
  };

  // Handle Enter key to print receipt when success modal is shown
  useEffect(() => {
    if (!showReceiptModal || !finalizedReceipt) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        handleCloseReceiptModal();
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          printReceipt();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [showReceiptModal, finalizedReceipt]);

  // Render panel content
  const renderPanel = () => {
    // No receipt selected — empty state
    if (!receiptNumber) {
      return (
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body d-flex flex-column align-items-center justify-content-center min-vh-50 py-5">
            <div className="avatar avatar-xl bg-light-primary mb-3">
              <FiFileText size={32} className="text-primary" />
            </div>
            <h6 className="fw-semibold text-muted mb-1">Finalize Bill</h6>
            <p className="text-muted small mb-0 text-center px-3">
              Click a receipt number from the list on the right to load and finalize the bill here.
            </p>
          </div>
        </div>
      );
    }

    // Loading
    if (loading) {
      return (
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 mb-0 text-muted small">Loading receipt...</p>
          </div>
        </div>
      );
    }

    // Error or not found
    if (error || !receipt) {
      return (
        <div className="card h-100 border-0 shadow-sm border-danger">
          <div className="card-header d-flex align-items-center justify-content-between bg-light">
            <h6 className="card-title mb-0 fw-bold">Finalize Bill</h6>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
              <FiX size={18} />
            </button>
          </div>
          <div className="card-body text-center text-danger">
            <p className="mb-3">{error || 'Receipt not found'}</p>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      );
    }

  const customerDiscountAmt =
    (receipt.totalAmount || 0) * (formData.customerDiscountPercent / 100);
  const subtotalAfterDiscount = (receipt.totalAmount || 0) - customerDiscountAmt;
  const finalDue = subtotalAfterDiscount - formData.roundingDiscount;
  const isDraft = receipt.saleStatus === 'Draft';

  return (
    <div className="card h-100 border-0 shadow-sm d-flex flex-column">
      <div className="card-header d-flex align-items-center justify-content-between bg-transparent border-bottom py-3 flex-shrink-0">
        <div className="d-flex align-items-center gap-2">
          <div className="avatar avatar-sm bg-light-primary">
            <FiFileText size={18} className="text-primary" />
          </div>
          <h6 className="card-title mb-0 fw-bold">Finalize Bill #{receipt.receiptNumber}</h6>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-light btn-icon"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX size={18} />
        </button>
      </div>
      {/* Scrollable: only Products */}
      <div
        className="card-body overflow-auto flex-grow-1 py-3"
        style={{ minHeight: 0 }}
      >
        {/* Receipt info */}
        <div className="mb-3 pb-3 border-bottom">
          <p className="mb-1 small text-muted">
            Sales ID: {receipt.salesId} · By {receipt.issuedBy}
          </p>
          <p className="mb-1 small">
            {formatDate(receipt.date)} · {formatTime(receipt.time)}
          </p>
          <span className={`badge ${isDraft ? 'bg-warning' : 'bg-success'}`}>
            {receipt.saleStatus}
          </span>
          {receipt.customerName && (
            <p className="mt-1 mb-0 small text-muted">Customer: {receipt.customerName}</p>
          )}
        </div>

        {/* Products */}
        <h6 className="fw-semibold mb-2">Products</h6>
        <div className="table-responsive mb-3">
          <table className="table table-sm table-bordered table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Product</th>
                <th className="text-center">Qty</th>
                <th className="text-end">Price</th>
                <th className="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <span className="fw-medium">{item.productName}</span>
                    <br />
                    <span className="small text-muted">{item.productSku}</span>
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-end">{(item.price || 0).toFixed(2)}</td>
                  <td className="text-end fw-medium">{item.subTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex flex-wrap justify-content-between gap-2 small">
          <span>Gross: {(receipt.totalAmount || 0).toFixed(2)} LKR</span>
          {receipt.customerDiscountPercent > 0 && (
            <span>Discount: {receipt.customerDiscountPercent}%</span>
          )}
          {receipt.roundingDiscount !== undefined && receipt.roundingDiscount > 0 && (
            <span>Rounding: {(receipt.roundingDiscount || 0).toFixed(2)}</span>
          )}
          <span className="fw-bold text-primary">
            Final Due: {(receipt.finalAmountDue || 0).toFixed(2)} LKR
          </span>
        </div>
      </div>

      {/* Fixed bottom: Finalize Receipt button or Customer & Payment section */}
      <div className="card-footer bg-transparent border-top flex-shrink-0 py-3">
        {!showFinalizeForm && isDraft && (
          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={() => setShowFinalizeForm(true)}
          >
            Finalize Receipt
          </button>
        )}

        {showFinalizeForm && isDraft && (
          <div ref={customerPaymentSectionRef}>
            <h6 className="fw-semibold mb-2">Customer &amp; Payment</h6>
            <div className="row g-2 mb-3">
              <div className="col-12">
                <label className="form-label small">Customer Name (Optional)</label>
                <input
                  ref={customerNameInputRef}
                  className="form-control form-control-sm"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  placeholder="Customer name"
                />
              </div>
              <div className="col-6">
                <label className="form-label small">Contact</label>
                <input
                  className="form-control form-control-sm"
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))
                  }
                  placeholder="Contact"
                />
              </div>
              <div className="col-6">
                <label className="form-label small">Email</label>
                <input
                  type="email"
                  className="form-control form-control-sm"
                  value={formData.emailAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, emailAddress: e.target.value }))
                  }
                  placeholder="Email"
                />
              </div>
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small">Customer Discount %</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    max={100}
                    value={formData.customerDiscountPercent}
                    onChange={(e) => {
                      const val = Math.max(
                        0,
                        Math.min(100, parseFloat(e.target.value) || 0)
                      );
                      setFormData((prev) => ({ ...prev, customerDiscountPercent: val }));
                    }}
                  />
                  <span className="input-group-text">%</span>
                </div>
              </div>
              <div className="col-6">
                <label className="form-label small">Rounding (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm"
                  min={0}
                  value={formData.roundingDiscount}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setFormData((prev) => ({ ...prev, roundingDiscount: val }));
                  }}
                />
              </div>
              <div className="col-6">
                <label className="form-label small">Sub Total</label>
                <input
                  className="form-control form-control-sm bg-light"
                  readOnly
                  value={`${subtotalAfterDiscount.toFixed(2)} LKR`}
                />
              </div>
              <div className="col-6">
                <label className="form-label small">Final Due</label>
                <input
                  className="form-control form-control-sm bg-light fw-bold"
                  readOnly
                  value={`${finalDue.toFixed(2)} LKR`}
                />
              </div>
            </div>
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-semibold">Payment Methods</h5>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={addPayment}
                >
                  <FiPlus size={16} className="me-1" />
                  Add
                </button>
              </div>
              {payments.length === 0 ? (
                <div className="alert alert-info d-flex align-items-center">
                  <FiDollarSign className="me-2" size={18} />
                  Add at least one payment method.
                </div>
              ) : (
                <div className="row g-3">
                  {payments.map((payment, index) => (
                    <div key={index} className="col-12">
                      <div className="card border">
                        <div className="card-body py-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-semibold fs-6">Payment #{index + 1}</span>
                            {payments.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-link text-danger p-0"
                                onClick={() => removePayment(index)}
                              >
                                <FiTrash2 size={18} />
                              </button>
                            )}
                          </div>
                          <div className="row g-2">
                            <div className="col-6">
                              <select
                                className="form-select"
                                value={payment.paymentMethod}
                                onChange={(e) =>
                                  updatePayment(
                                    index,
                                    'paymentMethod',
                                    e.target.value as PaymentEntry['paymentMethod']
                                  )
                                }
                              >
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="PayLater">Pay Later</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="col-6">
                              <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                min={0}
                                ref={index === 0 ? paymentAmountInputRef : undefined}
                                value={payment.paymentAmount || ''}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  updatePayment(
                                    index,
                                    'paymentAmount',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (getTotalPayments() >= finalDue) handleFinalizePaid();
                                  } else if (e.key === 'Tab') {
                                    e.preventDefault();
                                    setShowFinalizeForm(false);
                                    setPayments([]);
                                  }
                                }}
                                placeholder="Amount"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {payments.length > 0 && (
                <div className="mt-3 p-3 rounded bg-light">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fs-6">Total Payments:</span>
                    <span className="fw-bold fs-6">{getTotalPayments().toFixed(2)} LKR</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fs-6">Final Due:</span>
                    <span className="fw-bold fs-6">{finalDue.toFixed(2)} LKR</span>
                  </div>
                  <div
                    className={`p-3 rounded text-center fw-bold fs-5 ${
                      getTotalPayments() >= finalDue ? 'bg-success text-white' : 'bg-warning'
                    }`}
                  >
                    {getTotalPayments() >= finalDue
                      ? `Change: ${(getTotalPayments() - finalDue).toFixed(2)} LKR`
                      : `Balance: ${(finalDue - getTotalPayments()).toFixed(2)} LKR`}
                  </div>
                </div>
              )}
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowFinalizeForm(false);
                  setPayments([]);
                }}
              >
                Cancel
              </button>
              {payments.some((p) => p.paymentMethod === 'PayLater') ? (
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleFinalizeUnpaid}
                >
                  Complete as Pay Later
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleFinalizePaid}
                  disabled={getTotalPayments() < finalDue}
                >
                  Complete as Paid
                </button>
              )}
            </div>
          </div>
        )}

        {receipt.saleStatus === 'Paid' && (
          <div className="alert alert-success small mb-0">
            This receipt is already finalized (Paid).
            {receipt.paymentMethod && ` Payment: ${receipt.paymentMethod}`}
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <>
      {renderPanel()}
      {/* Receipt Success Modal */}
      {showReceiptModal && finalizeResponse && finalizedReceipt && (
        <>
          <div
            className={`modal fade ${showReceiptModal ? 'show' : ''}`}
            style={{ display: showReceiptModal ? 'block' : 'none' }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="receiptModalLabel"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title fw-bold" id="receiptModalLabel">
                    <FiCheckCircle className="me-2" />
                    Receipt Finalized Successfully
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleCloseReceiptModal}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="text-center mb-4">
                    <div className="avatar avatar-lg bg-light-success mx-auto mb-3">
                      <FiCheckCircle size={32} className="text-success" />
                    </div>
                    <h5 className="text-success mb-3">
                      {finalizeResponse.message}
                    </h5>
                  </div>
                  
                  {/* Receipt Details */}
                  <div className="card border-0 bg-light mb-3">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-12">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Receipt Number:</span>
                            <span className="fw-bold text-primary fs-5">
                              {finalizeResponse.receipt}
                            </span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Status:</span>
                            <span
                              className={`badge ${
                                finalizeResponse.status === 'Paid'
                                  ? 'bg-success'
                                  : 'bg-warning'
                              } fs-6`}
                            >
                              {finalizeResponse.status}
                            </span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Amount Due:</span>
                            <span
                              className={`fw-bold fs-5 ${
                                (finalizeResponse.amountDue || 0) === 0
                                  ? 'text-success'
                                  : 'text-warning'
                              }`}
                            >
                              {(finalizeResponse.amountDue || 0).toLocaleString()} LKR
                            </span>
                          </div>
                        </div>
                        {finalizedReceipt.customerName && (
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">Customer:</span>
                              <span className="fw-semibold">
                                {finalizedReceipt.customerName}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="col-12">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Total Amount:</span>
                            <span className="fw-bold">
                              {(finalizedReceipt.totalAmount || 0).toLocaleString()} LKR
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Items Preview */}
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Product</th>
                          <th className="text-center">Qty</th>
                          <th className="text-end">Price</th>
                          <th className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalizedReceipt.items.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div className="fw-medium">{item.productName}</div>
                              <div className="small text-muted">{item.productSku}</div>
                            </td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-end">{(item.price || 0).toFixed(2)}</td>
                            <td className="text-end fw-medium">{item.subTotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="text-end fw-bold">Total:</td>
                          <td className="text-end fw-bold">
                            {(finalizedReceipt.totalAmount || 0).toFixed(2)} LKR
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseReceiptModal}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      printReceipt();
                      handleCloseReceiptModal();
                    }}
                  >
                    <FiPrinter className="me-2" />
                    Print Receipt
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleDownloadReceipt}
                  >
                    <FiDownload className="me-2" />
                    Download Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
          {showReceiptModal && (
            <div
              className="modal-backdrop fade show"
              onClick={handleCloseReceiptModal}
              style={{ zIndex: 1040 }}
            ></div>
          )}
        </>
      )}
    </>
  );
};

export default FinalizeReceiptPanel;
