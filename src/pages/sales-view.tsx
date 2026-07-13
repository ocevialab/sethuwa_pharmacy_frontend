import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  salesService,
  Receipt,
  FinalizeReceiptRequest,
  CompletePayLaterRequest,
  FinalizeReceiptResponse,
  PaymentEntry,
} from "@/services/salesService";
import Swal from "sweetalert2";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import Footer from "@/components/shared/Footer";
import {
  FiShoppingBag,
  FiArrowLeft,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiCheckCircle,
  FiX,
  FiXCircle,
  FiEye,
  FiPrinter,
  FiPlus,
  FiTrash2,
  FiDownload,
} from "react-icons/fi";
import Table from "@/components/shared/table/Table";
import { PDFReportGenerator } from "@/utils/pdfReportGenerator";
import FinalizeReceiptModal from "@/components/sales/FinalizeReceiptModal";
const SalesView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const receiptNumber = searchParams.get("receiptNumber");
  const navigate = useNavigate();
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showFinalizeForm, setShowFinalizeForm] = useState(false);
  const [showCompletePayLaterForm, setShowCompletePayLaterForm] =
    useState(false);
  const [finalizeResponse, setFinalizeResponse] =
    useState<FinalizeReceiptResponse | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<number | null>(null);
  const [printPaymentSummary, setPrintPaymentSummary] = useState<{
    payments: PaymentEntry[];
    totalReceived: number;
    change: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    contactNumber: "",
    emailAddress: "",
    customerDiscountPercent: 0,
    roundingDiscount: 0,
    paymentMethod: "Cash" as "Cash" | "Card" | "Bank Transfer" | "PayLater",
    receivedAmount: 0,
  });
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [payLaterFormData, setPayLaterFormData] = useState({
    paymentMethod: "Cash" as "Cash" | "Card" | "Bank Transfer",
    receivedAmount: 0,
    roundingDiscount: 0,
  });
  useEffect(() => {
    // Reset flags when receiptNumber changes
    hasFetchedRef.current = false;
    isFetchingRef.current = false;
    const fetchReceiptDetails = async () => {
      if (!receiptNumber) {
        setError("Receipt number is missing.");
        setLoading(false);
        return;
      }
      // Prevent multiple simultaneous calls
      if (isFetchingRef.current || hasFetchedRef.current) {
        return;
      }
      try {
        isFetchingRef.current = true;
        hasFetchedRef.current = true;
        setLoading(true);
        setError(null);
        const data = await salesService.getReceipt(receiptNumber);
        setReceipt(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load receipt details";
        setError(errorMessage);

        // Don't show error alert if it's the "not available for payment" error
        // This is expected for finalized receipts
        if (
          !errorMessage.includes("not available for payment") &&
          !errorMessage.includes("not available")
        ) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMessage,
          });
        }
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };
    fetchReceiptDetails();
  }, [receiptNumber]); // Only depend on receiptNumber
  useEffect(() => {
    if (showFinalizeForm && receipt) {
      const receiptWithExtras = receipt as Receipt & {
        contactNumber?: string;
        emailAddress?: string;
      };
      setFormData({
        customerName: receipt.customerName || "",
        contactNumber: receiptWithExtras.contactNumber || "",
        emailAddress: receiptWithExtras.emailAddress || "",
        customerDiscountPercent: receipt.customerDiscountPercent || 0,
        roundingDiscount: receipt.roundingDiscount || 0,
        paymentMethod: "Cash",
        receivedAmount: receipt.finalAmountDue || 0,
      });
      // Initialize with one payment entry
      const totalAmount = receipt.totalAmount || 0;
      const customerDiscountPercent = receipt.customerDiscountPercent || 0;
      const roundingDiscount = receipt.roundingDiscount || 0;
      const finalDue =
        totalAmount -
        (totalAmount * customerDiscountPercent) / 100 -
        roundingDiscount;
      if (payments.length === 0) {
        setPayments([
          {
            paymentMethod: "Cash",
            paymentAmount: finalDue || 0,
            paymentDate: new Date().toISOString(),
          },
        ]);
      }
    }
  }, [showFinalizeForm, receipt]);
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-LK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A";
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString("en-LK", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };
  // Format date and time for receipt (e.g., "07 Nov 2025 13:56:23")
  const formatReceiptDateTime = (dateString: string, timeString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    const time = timeString ? formatTime(timeString) : "";
    return `${day} ${month} ${year} ${time}`;
  };
  const handleFinalize = () => {
    if (receiptNumber) {
      setShowFinalizeModal(true);
    }
  };

  const handleFinalizeSuccess = async (customerName?: string) => {
    if (receiptNumber) {
      try {
        const updatedReceipt = await salesService.getReceipt(receiptNumber);
        setReceipt({ ...updatedReceipt, customerName: customerName ?? updatedReceipt.customerName });
      } catch (err) {
        // If re-fetch fails, patch only the customerName onto existing state
        if (customerName !== undefined) {
          setReceipt((prev) => prev ? { ...prev, customerName } : prev);
        }
      }
    }
    setShowFinalizeModal(false);
  };

  // Payment management functions
  const addPayment = () => {
    setPayments([
      ...payments,
      {
        paymentMethod: "Cash",
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
    return payments.reduce(
      (sum, payment) => sum + (payment.paymentAmount || 0),
      0
    );
  };
  const handleFinalizeUnpaid = async () => {
    if (!receipt) return;
    const customerDiscountAmt =
      (receipt.totalAmount || 0) * (formData.customerDiscountPercent / 100);
    const subtotalAfterDiscount =
      (receipt.totalAmount || 0) - customerDiscountAmt;
    const finalDue = subtotalAfterDiscount - formData.roundingDiscount;

    // Validate payments
    if (payments.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please add at least one payment method.",
      });
      return;
    }

    const totalPayments = getTotalPayments();
    if (totalPayments <= 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Total payment amount must be greater than 0.",
      });
      return;
    }

    const requestData: FinalizeReceiptRequest = {
      paymentMethod: "PayLater",
      receivedAmount: totalPayments,
      customerDiscountPercent: formData.customerDiscountPercent,
      roundingDiscount: formData.roundingDiscount,
      saleStatus: "Unpaid", // When payment method is PayLater and finalized as Unpaid, status should be Unpaid
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
      const response = await salesService.finalizeReceipt(
        receiptNumber!,
        requestData
      );
      setShowFinalizeForm(false);

      // When payment method is PayLater and finalized as Unpaid, status should be Unpaid (not Paid)
      const finalStatus =
        requestData.paymentMethod === "PayLater" ? "Unpaid" : response.status;

      // For unpaid PayLater sales, the amount due should be the full final amount
      // Partial payments don't reduce the amount due for PayLater transactions
      // For other payment methods, calculate the actual amount due (final due minus payments made)
      const actualAmountDue =
        finalStatus === "Unpaid" ? finalDue : finalDue - totalPayments;

      // Update response with correct status and amount due for PayLater
      const updatedResponse = {
        ...response,
        status: finalStatus,
        amountDue:
          finalStatus === "Unpaid" ? actualAmountDue : response.amountDue,
      };

      setFinalizeResponse(updatedResponse);
      setReceivedAmount(totalPayments);

      // Update receipt state with new data
      const updatedReceipt = {
        ...receipt,
        finalAmountDue:
          finalStatus === "Unpaid" ? actualAmountDue : response.amountDue,
        saleStatus: finalStatus as any,
        paymentMethod: "PayLater",
        customerName: name,
        contactNumber: contact,
        emailAddress: email,
        customerDiscountPercent: formData.customerDiscountPercent,
        roundingDiscount: formData.roundingDiscount,
      } as Receipt & { contactNumber?: string; emailAddress?: string };
      setReceipt(updatedReceipt);
      setShowFinalizeModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to finalize receipt";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      });
    }
  };
  const handleFinalizePaid = async () => {
    if (!receipt) return;
    const customerDiscountAmt =
      (receipt.totalAmount || 0) * (formData.customerDiscountPercent / 100);
    const subtotalAfterDiscount =
      (receipt.totalAmount || 0) - customerDiscountAmt;
    const finalDue = subtotalAfterDiscount - formData.roundingDiscount;

    // Validate payments
    if (payments.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please add at least one payment method.",
      });
      return;
    }

    const totalPayments = getTotalPayments();

    // Check if any payment is PayLater
    const hasPayLater = payments.some((p) => p.paymentMethod === "PayLater");
    if (hasPayLater) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Cannot complete as paid with Pay Later. Please select another payment method.",
      });
      return;
    }

    if (totalPayments < finalDue) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Total payment amount must be at least ${finalDue.toFixed(
          2
        )} LKR to complete as paid.`,
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
    try {
      const response = await salesService.finalizeReceipt(
        receiptNumber!,
        requestData
      );
      setShowFinalizeForm(false);
      setFinalizeResponse(response);
      setReceivedAmount(totalPayments);
      setPrintPaymentSummary({
        payments: [...payments],
        totalReceived: totalPayments,
        change: Math.max(0, totalPayments - finalDue),
      });
      setReceipt((prev) =>
        prev
          ? {
              ...prev,
              finalAmountDue: response.amountDue,
              saleStatus: response.status as any,
              paymentMethod:
                payments.length === 1 ? payments[0].paymentMethod : "Multiple",
              customerName: name,
              contactNumber: contact,
              emailAddress: email,
              customerDiscountPercent: formData.customerDiscountPercent,
              roundingDiscount: formData.roundingDiscount,
            }
          : null
      );
      setShowFinalizeModal(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to finalize receipt";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      });
    }
  };
  // Handle finalize modal close
  const handleFinalizeModalClose = () => {
    setShowFinalizeModal(false);
    setFinalizeResponse(null);
  };
  const handleCompletePayLater = () => {
    if (!receipt) return;
    // Initialize form data with receipt values
    setPayLaterFormData({
      paymentMethod: "Cash",
      receivedAmount: receipt.finalAmountDue || 0,
      roundingDiscount: receipt.roundingDiscount || 0,
    });
    setShowCompletePayLaterForm(true);
  };
  const handleCompletePayLaterSubmit = async () => {
    if (!receipt) return;
    if (payLaterFormData.receivedAmount <= 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Received amount must be greater than 0",
      });
      return;
    }
    try {
      await salesService.completePayLater(receiptNumber!, {
        paymentMethod: payLaterFormData.paymentMethod,
        receivedAmount: payLaterFormData.receivedAmount,
        roundingDiscount: payLaterFormData.roundingDiscount || undefined,
      } as CompletePayLaterRequest);

      setShowCompletePayLaterForm(false);
      Swal.fire({
        icon: "success",
        title: "Completed!",
        text: "Pay-later payment has been completed.",
        timer: 2000,
        showConfirmButton: false,
      });

      // Update local state
      if (receipt) {
        setReceipt({
          ...receipt,
          finalAmountDue: 0, // Payment completed, amount due should be 0
          saleStatus: "Paid",
          paymentMethod: payLaterFormData.paymentMethod,
          roundingDiscount: payLaterFormData.roundingDiscount,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err instanceof Error ? err.message : "Failed to complete payment",
      });
    }
  };
  const handleCancel = async () => {
    if (!receipt) return;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to cancel receipt ${receipt.receiptNumber}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ea4d4d",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, cancel it!",
    });
    if (result.isConfirmed) {
      try {
        await salesService.cancelReceipt(receipt.receiptNumber);
        Swal.fire({
          icon: "success",
          title: "Cancelled!",
          text: "Receipt has been cancelled.",
          timer: 2000,
          showConfirmButton: false,
        });
        navigate("/sales/list");
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err instanceof Error ? err.message : "Failed to cancel receipt",
        });
      }
    }
  };
  // Print receipt function using hidden iframe for direct printing without download or visible window
  const printReceipt = (
    receiptToPrint?: Receipt & { contactNumber?: string; emailAddress?: string }
  ) => {
    const receiptData = receiptToPrint || receipt;
    if (!receiptData) return;
    // Calculate totals
    const grossTotal = receiptData.totalAmount;
    const customerDiscount =
      receiptData.customerDiscountPercent > 0
        ? (grossTotal * receiptData.customerDiscountPercent) / 100
        : 0;
    const roundingDiscount = receiptData.roundingDiscount || 0;
    const totalDiscount = customerDiscount + roundingDiscount;
    const grandTotal = grossTotal - totalDiscount;
    // For Pay Later, use receivedAmount from state if available, otherwise use 0
    // For paid receipts, use receivedAmount or grandTotal
    const paidAmount =
      receiptData.paymentMethod === "PayLater"
        ? receivedAmount || 0
        : receivedAmount || grandTotal;
    const change = paidAmount - grandTotal;
    const amountDue = receiptData.finalAmountDue || 0;
    // Get current local date/time without any API - uses browser's local timezone
    const now = new Date();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[now.getMonth()];
    const day = now.getDate().toString().padStart(2, "0");
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}:${seconds}`;
    const formattedDateTime = `${day} ${month} ${year} ${currentTime}`;
    // Prepare by: from API (issuedBy)
    const preparedBy = receiptData.issuedBy || "Unknown Employee";
    // Issue By: from localStorage
    const issuedBy =
      localStorage.getItem("pharmacy_employee_name") || "Unknown Employee";
    // Create printable content
    const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt ${receiptData.receiptNumber}</title>
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
                    .receipt-number {
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
                        <span class="receipt-number">Receipt Number: ${
                          receiptData.receiptNumber
                        }</span><br>
                        Prepare by: ${preparedBy}<br>
                        Issue By: ${issuedBy}${
                          receiptData.customerName
                            ? `<br>Customer: ${receiptData.customerName}`
                            : ""
                        }
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
                            ${receiptData.items
                              .map(
                                (item, index) => `
                                <tr>
                                    <td class="col-ln">${index + 1}</td>
                                    <td class="col-item">${
                                      item.productName
                                    }</td>
                                    <td class="col-price">${item.price.toFixed(
                                      2
                                    )}</td>
                                    <td class="col-qty">${item.quantity}</td>
                                    <td class="col-amount">${item.subTotal.toFixed(
                                      2
                                    )}</td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                    <div class="divider"></div>
                    <div class="totals">
                        <div class="total-row">
                            <span>Gross Total:</span>
                            <span>${grossTotal.toFixed(2)}</span>
                        </div>
                       
                        ${
                          totalDiscount > 0
                            ? `
                            <div class="total-row">
                                <span>Discount:</span>
                                <span>-${totalDiscount.toFixed(2)}</span>
                            </div>
                        `
                            : ""
                        }
                        <div class="total-row grand-total">
                            <span>Grand Total (LKR):</span>
                            <span>${grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    ${
                      receiptData.saleStatus === "Paid"
                        ? (() => {
                            const printPmts: { paymentMethod: string; paymentAmount: number }[] =
                              printPaymentSummary?.payments ??
                              (receiptData.payments ?? []).map((p) => ({
                                paymentMethod: p.paymentMethod,
                                paymentAmount: p.paymentAmount,
                              }));
                            const totalRec = printPaymentSummary?.totalReceived ?? paidAmount;
                            const chg = printPaymentSummary?.change ?? Math.max(0, change);
                            return `
                        <div class="payment-info">
                            ${printPmts.map((p) => `
                            <div class="total-row">
                                <span>${p.paymentMethod} Received:</span>
                                <span>${p.paymentAmount.toFixed(2)}</span>
                            </div>`).join('')}
                            ${printPmts.length > 1 ? `
                            <div class="total-row" style="border-top:1px dashed #000;margin-top:3px;padding-top:3px;">
                                <span>Total Received:</span>
                                <span>${totalRec.toFixed(2)}</span>
                            </div>` : ''}
                            <div class="total-row">
                                <span>Change:</span>
                                <span>${chg.toFixed(2)}</span>
                            </div>
                        </div>`;
                          })()
                        : receiptData.paymentMethod === "PayLater"
                        ? `
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
                    `
                        : ""
                    }
                    <div class="footer">
                        ${
                          receiptData.customerName
                            ? `<div>Thank You ${receiptData.customerName}!</div>`
                            : ""
                        }
                        <div>Wish you good health.</div>
                        <div>*No returns on Items*</div>
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
    const iframeDoc =
      printIframe.contentDocument || printIframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      // Wait for content to load, then trigger print
      printIframe.onload = () => {
        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
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
              document.body.removeChild(printIframe);
            }, 1000);
          }
        }, 250);
      };
      // Mark as printed in localStorage (for first-time tracking, though dialog always shows)
      const hasPrintedOnce = localStorage.getItem("hasPrintedReceiptOnce");
      if (!hasPrintedOnce) {
        localStorage.setItem("hasPrintedReceiptOnce", "true");
      }
    } else {
      // Fallback if iframe document not accessible
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to access print frame. Please try again.",
      });
      document.body.removeChild(printIframe);
    }
  };
  const receiptItemsColumns = [
    {
      accessorKey: "productName",
      header: () => "Product Name",
      cell: (info: any) => (
        <span className="fw-semibold">{info.getValue()}</span>
      ),
    },
    {
      accessorKey: "productSku",
      header: () => "Product SKU",
      cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>,
    },
    {
      accessorKey: "quantity",
      header: () => "Quantity",
      cell: (info: any) => <span>{info.getValue()}</span>,
    },
    {
      accessorKey: "price",
      header: () => "Price",
      cell: (info: any) => (
        <span>{(info.getValue() || 0).toLocaleString()} LKR</span>
      ),
    },
    {
      accessorKey: "subTotal",
      header: () => "Subtotal",
      cell: (info: any) => (
        <span className="fw-semibold text-primary">
          {(info.getValue() || 0).toLocaleString()} LKR
        </span>
      ),
    },
  ];
  const receiptItemsTableData =
    receipt?.items.map((item, index) => ({
      id: index,
      ...item,
    })) || [];
  if (loading) {
    return (
      <>
        <PageHeader>
          <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            <button
              className="btn btn-light-brand"
              onClick={() => navigate("/sales/list")}
            >
              <FiArrowLeft size={16} className="me-2" />
              <span>Back to List</span>
            </button>
          </div>
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
  if (error || !receipt) {
    return (
      <>
        <PageHeader>
          <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            <button
              className="btn btn-light-brand"
              onClick={() => navigate("/sales/list")}
            >
              <FiArrowLeft size={16} className="me-2" />
              <span>Back to List</span>
            </button>
          </div>
        </PageHeader>
        <div className="main-content">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <p className="text-danger">{error || "Receipt not found"}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/sales/list")}
                  >
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
  const customerDiscountAmt =
    (receipt.totalAmount || 0) * (formData.customerDiscountPercent / 100);
  const subtotalAfterDiscount =
    (receipt.totalAmount || 0) - customerDiscountAmt;
  const finalDue = subtotalAfterDiscount - formData.roundingDiscount;
  const totalPaymentsAmount =
    payments.length > 0
      ? payments.reduce((sum, p) => sum + (p.paymentAmount || 0), 0)
      : 0;
  const balance = finalDue - totalPaymentsAmount;

  // Calculate values for Pay-Later form
  const payLaterFinalDue =
    (receipt.finalAmountDue || 0) - (payLaterFormData.roundingDiscount || 0);
  const payLaterBalance = payLaterFormData.receivedAmount - payLaterFinalDue;
  return (
    <>
      <style>{`
                html.app-skin-dark .modal-content {
                    background-color: #1b2436 !important;
                    border-color: #2a3441 !important;
                }
                html.app-skin-dark .modal-header {
                    border-bottom-color: #2a3441 !important;
                }
                html.app-skin-dark .modal-footer {
                    border-top-color: #2a3441 !important;
                }
                html.app-skin-dark .modal-body {
                    color: #b1b4c0 !important;
                }
                html.app-skin-dark .modal-title {
                    color: #ffffff !important;
                }
                .btn-outline-primary:hover {
                    color: #000000 !important;
                    background-color: rgba(52, 84, 209, 0.1) !important;
                    border-color: #3454d1 !important;
                }
                .btn-outline-primary:focus {
                    color: #000000 !important;
                    background-color: rgba(52, 84, 209, 0.1) !important;
                    border-color: #3454d1 !important;
                }
            `}</style>
      <PageHeader>
        <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
          <button
            className="btn btn-light-brand"
            onClick={() => navigate("/sales/list")}
          >
            <FiArrowLeft size={16} className="me-2" />
            <span>Back to List</span>
          </button>
        </div>
      </PageHeader>
      <div className="main-content">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="d-flex align-items-center justify-content-between gap-3 my-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar avatar-md bg-light-primary">
                      <FiShoppingBag size={18} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="card-title mb-1 fw-bold">
                        Receipt: {receipt.receiptNumber}
                      </h5>
                      <p className="text-muted mb-0 fs-12">
                        Sales ID: {receipt.salesId}
                      </p>
                    </div>
                  </div>
                  {(receipt.saleStatus === "Paid" ||
                    receipt.saleStatus === "Cancelled") && (
                    <>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => printReceipt()}
                        title="Reprint Receipt"
                      >
                        <FiPrinter className="me-1" />
                        Reprint
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          const generator = new PDFReportGenerator();
                          const receiptWithExtras = receipt as Receipt & {
                            contactNumber?: string;
                            emailAddress?: string;
                          };
                          generator.generateReceiptBill(
                            {
                              ...receiptWithExtras,
                              contactNumber: receiptWithExtras.contactNumber,
                              emailAddress: receiptWithExtras.emailAddress,
                            },
                            receivedAmount || undefined
                          );
                          generator.download(
                            `Receipt_${receipt.receiptNumber}.pdf`
                          );
                        }}
                        title="Download PDF Bill"
                      >
                        <FiDownload className="me-1" />
                        Download PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div className="row g-3 mb-4">
                  {/* Receipt Information Card */}
                  <div className="col-12 col-lg-6">
                    <div
                      className="card h-100"
                      style={{
                        background: "rgba(52, 84, 209, 0.05)",
                        borderRadius: "12px",
                        border: "1px solid rgba(52, 84, 209, 0.15)",
                      }}
                    >
                      <div className="card-header bg-transparent border-0 pb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-sm bg-light-primary">
                            <FiShoppingBag size={16} className="text-primary" />
                          </div>
                          <h6 className="mb-0 fw-bold">Receipt Information</h6>
                        </div>
                      </div>
                      <div className="card-body pt-0">
                        <div className="row g-3">
                          <div className="col-12">
                            <div
                              className="d-flex align-items-center justify-content-between p-2 rounded"
                              style={{ background: "rgba(255, 255, 255, 0.5)" }}
                            >
                              <span className="text-muted fs-12">
                                Receipt Number
                              </span>
                              <span className="fw-bold">
                                {receipt.receiptNumber}
                              </span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div
                              className="d-flex align-items-center justify-content-between p-2 rounded"
                              style={{ background: "rgba(255, 255, 255, 0.5)" }}
                            >
                              <span className="text-muted fs-12">Date</span>
                              <span className="fw-semibold">
                                {formatDate(receipt.date)}
                              </span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div
                              className="d-flex align-items-center justify-content-between p-2 rounded"
                              style={{ background: "rgba(255, 255, 255, 0.5)" }}
                            >
                              <span className="text-muted fs-12">Time</span>
                              <span className="fw-semibold">
                                {formatTime(receipt.time)}
                              </span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div
                              className="d-flex align-items-center justify-content-between p-2 rounded"
                              style={{ background: "rgba(255, 255, 255, 0.5)" }}
                            >
                              <span className="text-muted fs-12">
                                Issued By
                              </span>
                              <span className="fw-semibold">
                                {receipt.issuedBy}
                              </span>
                            </div>
                          </div>
                          {receipt.customerName && (
                            <div className="col-12">
                              <div
                                className="d-flex align-items-center justify-content-between p-2 rounded"
                                style={{ background: "rgba(255, 255, 255, 0.5)" }}
                              >
                                <span className="text-muted fs-12">
                                  Customer
                                </span>
                                <span className="fw-semibold">
                                  {receipt.customerName}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Amount Information Card */}
                  <div className="col-12 col-lg-6">
                    <div
                      className="card h-100"
                      style={{
                        background: "rgba(23, 198, 102, 0.05)",
                        borderRadius: "12px",
                        border: "1px solid rgba(23, 198, 102, 0.15)",
                      }}
                    >
                      <div className="card-header bg-transparent border-0 pb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-sm bg-light-success">
                            <FiDollarSign size={16} className="text-success" />
                          </div>
                          <h6 className="mb-0 fw-bold">Amount Information</h6>
                        </div>
                      </div>
                      <div className="card-body pt-0">
                        <div className="row g-3">
                          <div className="col-12">
                            <div
                              className="d-flex align-items-center justify-content-between p-3 rounded"
                              style={{ background: "rgba(255, 255, 255, 0.5)" }}
                            >
                              <div>
                                <span className="text-muted fs-12 d-block mb-1">
                                  Total Amount
                                </span>
                                <span className="fw-bold fs-20 text-primary">
                                  {(receipt.totalAmount || 0).toLocaleString()}{" "}
                                  LKR
                                </span>
                              </div>
                              <div className="avatar avatar-md bg-light-primary">
                                <FiDollarSign
                                  size={20}
                                  className="text-primary"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-12">
                            <div
                              className="d-flex align-items-center justify-content-between p-2 rounded"
                              style={{ background: "rgba(255, 255, 255, 0.5)" }}
                            >
                              <span className="text-muted fs-12">
                                Final Amount Due
                              </span>
                              <span className="fw-bold text-success">
                                {(receipt.finalAmountDue || 0).toLocaleString()}{" "}
                                LKR
                              </span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div
                              className="d-flex align-items-center justify-content-between p-2 rounded"
                              style={{ background: "rgba(255, 255, 255, 0.5)" }}
                            >
                              <span className="text-muted fs-12">
                                Items Count
                              </span>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => setShowItemsModal(true)}
                              >
                                <FiEye className="me-1" />
                                View Items ({receipt.items?.length || 0})
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Action Buttons - Only show if status is Draft or Unpaid */}
                {(receipt.saleStatus === "Unpaid" ||
                  receipt.saleStatus === "Draft") && (
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-primary"
                          onClick={handleFinalize}
                        >
                          <FiCheckCircle className="me-2" />
                          Finalize Receipt
                        </button>
                        {/* <button
                                                className="btn btn-success"
                                                onClick={handleCompletePayLater}
                                            >
                                                <FiCheckCircle className="me-2" />
                                                Complete Pay-Later
                                            </button> */}
                        <button
                          className="btn btn-danger"
                          onClick={handleCancel}
                        >
                          <FiXCircle className="me-2" />
                          Cancel Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Finalize Form Modal */}
      {showFinalizeForm && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    Finalize Receipt #{receiptNumber}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowFinalizeForm(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <h5 className="mb-1">Receipt #{receipt?.receiptNumber}</h5>
                    <p className="mb-1 text-muted">
                      By {receipt?.issuedBy} | {formatDate(receipt?.date || "")}{" "}
                      {formatTime(receipt?.time || "")}
                    </p>
                    {receipt?.customerName && (
                      <p className="mb-1 text-muted">
                        Customer: {receipt.customerName}
                      </p>
                    )}
                  </div>
                  {/* Customer Info */}
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">
                        Customer Name{" "}
                        <span className="text-muted">(Optional)</span>
                      </label>
                      <input
                        className="form-control"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customerName: e.target.value,
                          }))
                        }
                        placeholder="Enter customer name if requested"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Contact Number</label>
                      <input
                        className="form-control"
                        value={formData.contactNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactNumber: e.target.value,
                          }))
                        }
                        placeholder="Contact Number"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.emailAddress}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            emailAddress: e.target.value,
                          }))
                        }
                        placeholder="Email Address"
                      />
                    </div>
                  </div>
                  {/* Items Table */}
                  <h6 className="mb-2">Products</h6>
                  <table className="table table-sm table-bordered mb-0">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Price LKR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td className="text-end">
                            {item.subTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-end mt-1 mb-3 fw-bold fs-5">
                    Total: {(receipt.totalAmount || 0).toFixed(2)} LKR
                  </div>
                  {/* Discounts & Totals */}
                  <h6 className="mb-2">Discounts & Totals</h6>
                  <div className="row">
                    <div className="col-md-3">
                      <label className="form-label">Customer Discount</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max="100"
                          value={formData.customerDiscountPercent}
                          onChange={(e) => {
                            const val = Math.max(
                              0,
                              Math.min(100, parseFloat(e.target.value) || 0)
                            );
                            setFormData((prev) => ({
                              ...prev,
                              customerDiscountPercent: val,
                            }));
                          }}
                        />
                        <span className="input-group-text">%</span>
                      </div>
                      <div className="small text-muted mt-1">
                        -${customerDiscountAmt.toFixed(2)} LKR
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Sub Total</label>
                      <input
                        className="form-control bg-light"
                        readOnly
                        value={subtotalAfterDiscount.toFixed(2) + " LKR"}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Rounding Discount</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        min="0"
                        value={formData.roundingDiscount}
                        onChange={(e) => {
                          const val = Math.max(
                            0,
                            parseFloat(e.target.value) || 0
                          );
                          setFormData((prev) => ({
                            ...prev,
                            roundingDiscount: val,
                          }));
                        }}
                      />
                      <div className="small text-muted mt-1">
                        -${formData.roundingDiscount.toFixed(2)} LKR
                      </div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Final Amount Due</label>
                      <input
                        className="form-control bg-light fw-bold"
                        readOnly
                        value={finalDue.toFixed(2) + " LKR"}
                      />
                    </div>
                  </div>
                  {/* Payment Information - Multiple Payments */}
                  <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0 fw-bold">Payment Methods</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={addPayment}
                      >
                        <FiPlus className="me-1" />
                        Add Payment
                      </button>
                    </div>

                    {payments.length === 0 ? (
                      <div className="alert alert-info d-flex align-items-center">
                        <FiDollarSign className="me-2" size={20} />
                        <span>Click "Add Payment" to add a payment method</span>
                      </div>
                    ) : (
                      <div className="row g-3">
                        {payments.map((payment, index) => {
                          const getPaymentIcon = (method: string) => {
                            switch (method) {
                              case "Cash":
                                return "💵";
                              case "Card":
                                return "💳";
                              case "Bank Transfer":
                                return "🏦";
                              case "PayLater":
                                return "⏳";
                              default:
                                return "💰";
                            }
                          };

                          return (
                            <div key={index} className="col-12">
                              <div
                                className="card border"
                                style={{
                                  background:
                                    index % 2 === 0
                                      ? "rgba(52, 84, 209, 0.03)"
                                      : "rgba(23, 198, 102, 0.03)",
                                  borderRadius: "12px",
                                  border: "1px solid rgba(0, 0, 0, 0.1)",
                                }}
                              >
                                <div className="card-body">
                                  <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="avatar avatar-sm bg-light-primary">
                                        <span style={{ fontSize: "18px" }}>
                                          {getPaymentIcon(
                                            payment.paymentMethod
                                          )}
                                        </span>
                                      </div>
                                      <h6 className="mb-0 fw-bold">
                                        Payment #{index + 1}
                                      </h6>
                                    </div>
                                    {payments.length > 1 && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => removePayment(index)}
                                        title="Remove Payment"
                                      >
                                        <FiTrash2 size={14} />
                                      </button>
                                    )}
                                  </div>

                                  <div className="row g-3">
                                    <div className="col-12">
                                      <label className="form-label small fw-semibold mb-2">
                                        Payment Method
                                      </label>
                                      <div
                                        className="btn-group w-100"
                                        role="group"
                                      >
                                        <input
                                          type="radio"
                                          className="btn-check"
                                          name={`paymentMethod_${index}`}
                                          id={`cash_${index}`}
                                          autoComplete="off"
                                          checked={
                                            payment.paymentMethod === "Cash"
                                          }
                                          onChange={() =>
                                            updatePayment(
                                              index,
                                              "paymentMethod",
                                              "Cash"
                                            )
                                          }
                                        />
                                        <label
                                          className={`btn btn-outline-primary ${
                                            payment.paymentMethod === "Cash"
                                              ? "active"
                                              : ""
                                          }`}
                                          htmlFor={`cash_${index}`}
                                        >
                                          💵 Cash
                                        </label>
                                        <input
                                          type="radio"
                                          className="btn-check"
                                          name={`paymentMethod_${index}`}
                                          id={`card_${index}`}
                                          autoComplete="off"
                                          checked={
                                            payment.paymentMethod === "Card"
                                          }
                                          onChange={() =>
                                            updatePayment(
                                              index,
                                              "paymentMethod",
                                              "Card"
                                            )
                                          }
                                        />
                                        <label
                                          className={`btn btn-outline-primary ${
                                            payment.paymentMethod === "Card"
                                              ? "active"
                                              : ""
                                          }`}
                                          htmlFor={`card_${index}`}
                                        >
                                          💳 Card
                                        </label>
                                        <input
                                          type="radio"
                                          className="btn-check"
                                          name={`paymentMethod_${index}`}
                                          id={`bank_${index}`}
                                          autoComplete="off"
                                          checked={
                                            payment.paymentMethod ===
                                            "Bank Transfer"
                                          }
                                          onChange={() =>
                                            updatePayment(
                                              index,
                                              "paymentMethod",
                                              "Bank Transfer"
                                            )
                                          }
                                        />
                                        <label
                                          className={`btn btn-outline-primary ${
                                            payment.paymentMethod ===
                                            "Bank Transfer"
                                              ? "active"
                                              : ""
                                          }`}
                                          htmlFor={`bank_${index}`}
                                        >
                                          🏦 Bank Transfer
                                        </label>
                                        <input
                                          type="radio"
                                          className="btn-check"
                                          name={`paymentMethod_${index}`}
                                          id={`paylater_${index}`}
                                          autoComplete="off"
                                          checked={
                                            payment.paymentMethod === "PayLater"
                                          }
                                          onChange={() =>
                                            updatePayment(
                                              index,
                                              "paymentMethod",
                                              "PayLater"
                                            )
                                          }
                                        />
                                        <label
                                          className={`btn btn-outline-primary ${
                                            payment.paymentMethod === "PayLater"
                                              ? "active"
                                              : ""
                                          }`}
                                          htmlFor={`paylater_${index}`}
                                        >
                                          ⏳ Pay Later
                                        </label>
                                        <input
                                          type="radio"
                                          className="btn-check"
                                          name={`paymentMethod_${index}`}
                                          id={`other_${index}`}
                                          autoComplete="off"
                                          checked={
                                            payment.paymentMethod === "Other"
                                          }
                                          onChange={() =>
                                            updatePayment(
                                              index,
                                              "paymentMethod",
                                              "Other"
                                            )
                                          }
                                        />
                                        <label
                                          className={`btn btn-outline-primary ${
                                            payment.paymentMethod === "Other"
                                              ? "active"
                                              : ""
                                          }`}
                                          htmlFor={`other_${index}`}
                                        >
                                          💰 Other
                                        </label>
                                      </div>
                                    </div>
                                    <div className="col-12">
                                      <label className="form-label small fw-semibold">
                                        Payment Amount (LKR)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        min="0"
                                        value={payment.paymentAmount || ""}
                                        onChange={(e) =>
                                          updatePayment(
                                            index,
                                            "paymentAmount",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Payment Summary */}
                    {payments.length > 0 && (
                      <div className="mt-4">
                        <div
                          className="card border-0"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(52, 84, 209, 0.1) 0%, rgba(23, 198, 102, 0.1) 100%)",
                            borderRadius: "12px",
                          }}
                        >
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-md-6">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="text-muted">
                                    Total Payments:
                                  </span>
                                  <span className="fw-bold fs-5 text-primary">
                                    {getTotalPayments().toFixed(2)} LKR
                                  </span>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="text-muted">
                                    Final Amount Due:
                                  </span>
                                  <span className="fw-bold fs-5 text-success">
                                    {finalDue.toFixed(2)} LKR
                                  </span>
                                </div>
                              </div>
                              <div className="col-12">
                                <div
                                  className={`p-3 rounded ${
                                    getTotalPayments() >= finalDue
                                      ? "bg-success text-white"
                                      : "bg-warning text-dark"
                                  }`}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">
                                      {getTotalPayments() >= finalDue
                                        ? "✓ Payment Complete"
                                        : "⚠ Insufficient Payment"}
                                    </span>
                                    <span className="fw-bold fs-5">
                                      {getTotalPayments() >= finalDue
                                        ? `Change: ${(
                                            getTotalPayments() - finalDue
                                          ).toFixed(2)} LKR`
                                        : `Balance Due: ${(
                                            finalDue - getTotalPayments()
                                          ).toFixed(2)} LKR`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
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
                  {payments.length > 0 &&
                  payments.some((p) => p.paymentMethod === "PayLater") ? (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={handleFinalizeUnpaid}
                    >
                      Complete Unpaid
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleFinalizePaid}
                      disabled={
                        payments.length === 0 || getTotalPayments() < finalDue
                      }
                    >
                      Complete as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowFinalizeForm(false)}
          ></div>
        </>
      )}
      {/* Items Modal */}
      {showItemsModal && (
        <>
          <div
            className={`modal fade ${showItemsModal ? "show" : ""}`}
            style={{ display: showItemsModal ? "block" : "none" }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="itemsModalLabel"
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold" id="itemsModalLabel">
                    <FiShoppingBag className="me-2" />
                    Receipt Items
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowItemsModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  {receipt.items && receipt.items.length > 0 ? (
                    <Table
                      data={receiptItemsTableData}
                      columns={receiptItemsColumns}
                    />
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
                    onClick={() => setShowItemsModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          {showItemsModal && (
            <div
              className="modal-backdrop fade show"
              onClick={() => setShowItemsModal(false)}
              style={{ zIndex: 1040 }}
            ></div>
          )}
        </>
      )}
      {/* Finalize Success Modal */}
      {showFinalizeModal && finalizeResponse && (
        <>
          <div
            className={`modal fade ${showFinalizeModal ? "show" : ""}`}
            style={{ display: showFinalizeModal ? "block" : "none" }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="finalizeModalLabel"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title fw-bold" id="finalizeModalLabel">
                    <FiCheckCircle className="me-2" />
                    Receipt Finalized Successfully
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleFinalizeModalClose}
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
                  <div className="card border-0 bg-light">
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
                                finalizeResponse.status === "Paid"
                                  ? "bg-success"
                                  : "bg-warning"
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
                                  ? "text-success"
                                  : "text-warning"
                              }`}
                            >
                              {(
                                finalizeResponse.amountDue || 0
                              ).toLocaleString()}{" "}
                              LKR
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleFinalizeModalClose}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      printReceipt();
                      handleFinalizeModalClose();
                    }}
                  >
                    <FiPrinter className="me-2" />
                    Print Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
          {showFinalizeModal && (
            <div
              className="modal-backdrop fade show"
              onClick={handleFinalizeModalClose}
              style={{ zIndex: 1040 }}
            ></div>
          )}
        </>
      )}
      {/* Complete Pay-Later Form Modal */}
      {showCompletePayLaterForm && receipt && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
              role="document"
            >
              <div className="modal-content" style={{ borderRadius: "12px" }}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">
                    Complete Pay-Later Payment
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCompletePayLaterForm(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-4">
                    {/* Left Panel - Receipt Details */}
                    <div className="col-lg-6">
                      <div
                        className="card border-0"
                        style={{ background: "rgba(52, 84, 209, 0.05)" }}
                      >
                        <div className="card-body">
                          {/* Receipt Header */}
                          <div className="mb-4">
                            <h5 className="fw-bold mb-3">Receipt</h5>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <p className="mb-1 text-muted small">
                                  By: {receipt.issuedBy}
                                </p>
                                {receipt.customerName && (
                                  <p className="mb-1 text-muted small">
                                    Customer: {receipt.customerName}
                                  </p>
                                )}
                              </div>
                              <div className="text-end">
                                <h3 className="fw-bold mb-0">
                                  {receipt.receiptNumber}
                                </h3>
                              </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted small">
                                {formatDate(receipt.date)}
                              </span>
                              <span className="text-muted small">
                                {formatTime(receipt.time)}
                              </span>
                            </div>
                          </div>
                          {/* Products Table */}
                          <div className="mb-3">
                            <table className="table table-sm table-bordered mb-0">
                              <thead>
                                <tr>
                                  <th className="text-start">Product Name</th>
                                  <th className="text-center">Quantity</th>
                                  <th className="text-end">Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {receipt.items.map((item, index) => (
                                  <tr key={index}>
                                    <td className="text-start">
                                      {item.productName}
                                    </td>
                                    <td className="text-center">
                                      {item.quantity}
                                    </td>
                                    <td className="text-end">
                                      {item.subTotal.toFixed(2)} LKR
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Total */}
                          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                            <span className="fw-bold">Total</span>
                            <span className="fw-bold fs-5">
                              {(receipt.totalAmount || 0).toFixed(2)} LKR
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Right Panel - Customer & Payment Info */}
                    <div className="col-lg-6">
                      <div
                        className="card border-0"
                        style={{ background: "rgba(23, 198, 102, 0.05)" }}
                      >
                        <div className="card-body">
                          {/* Customer Info */}
                          <div className="mb-4">
                            <h6 className="fw-bold mb-3">Customer Info</h6>
                            <div className="mb-3">
                              <label className="form-label small">Name</label>
                              <input
                                type="text"
                                className="form-control"
                                value={receipt.customerName || ""}
                                readOnly
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small">
                                Contact Number
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={
                                  (
                                    receipt as Receipt & {
                                      contactNumber?: string;
                                    }
                                  ).contactNumber || ""
                                }
                                readOnly
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small">
                                Email Address
                              </label>
                              <input
                                type="email"
                                className="form-control"
                                value={
                                  (
                                    receipt as Receipt & {
                                      emailAddress?: string;
                                    }
                                  ).emailAddress || ""
                                }
                                readOnly
                              />
                            </div>
                          </div>
                          {/* Payment Info */}
                          <div>
                            <h6 className="fw-bold mb-3">Payment Info</h6>

                            {/* Payment Method */}
                            <div className="mb-3">
                              <label className="form-label small mb-2 d-block">
                                Payment Method
                              </label>
                              <div className="btn-group w-100" role="group">
                                <input
                                  type="radio"
                                  className="btn-check"
                                  name="payLaterPaymentMethod"
                                  id="payLaterCash"
                                  checked={
                                    payLaterFormData.paymentMethod === "Cash"
                                  }
                                  onChange={() =>
                                    setPayLaterFormData((prev) => ({
                                      ...prev,
                                      paymentMethod: "Cash",
                                    }))
                                  }
                                />
                                <label
                                  className={`btn ${
                                    payLaterFormData.paymentMethod === "Cash"
                                      ? "btn-success"
                                      : "btn-outline-secondary"
                                  }`}
                                  htmlFor="payLaterCash"
                                >
                                  💵 Cash
                                </label>
                                <input
                                  type="radio"
                                  className="btn-check"
                                  name="payLaterPaymentMethod"
                                  id="payLaterCard"
                                  checked={
                                    payLaterFormData.paymentMethod === "Card"
                                  }
                                  onChange={() =>
                                    setPayLaterFormData((prev) => ({
                                      ...prev,
                                      paymentMethod: "Card",
                                    }))
                                  }
                                />
                                <label
                                  className={`btn ${
                                    payLaterFormData.paymentMethod === "Card"
                                      ? "btn-success"
                                      : "btn-outline-secondary"
                                  }`}
                                  htmlFor="payLaterCard"
                                >
                                  💳 Card
                                </label>
                                <input
                                  type="radio"
                                  className="btn-check"
                                  name="payLaterPaymentMethod"
                                  id="payLaterBank"
                                  checked={
                                    payLaterFormData.paymentMethod ===
                                    "Bank Transfer"
                                  }
                                  onChange={() =>
                                    setPayLaterFormData((prev) => ({
                                      ...prev,
                                      paymentMethod: "Bank Transfer",
                                    }))
                                  }
                                />
                                <label
                                  className={`btn ${
                                    payLaterFormData.paymentMethod ===
                                    "Bank Transfer"
                                      ? "btn-success"
                                      : "btn-outline-secondary"
                                  }`}
                                  htmlFor="payLaterBank"
                                >
                                  🏦 Bank Transfer
                                </label>
                              </div>
                            </div>
                            {/* Customer Discount */}
                            {receipt.customerDiscountPercent > 0 && (
                              <div className="mb-3">
                                <label className="form-label small">
                                  Customer Discount
                                </label>
                                <div className="input-group">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={receipt.customerDiscountPercent}
                                    readOnly
                                  />
                                  <span className="input-group-text">%</span>
                                </div>
                              </div>
                            )}
                            {/* New Total (after discount) */}
                            {receipt.customerDiscountPercent > 0 && (
                              <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="form-label small mb-0">
                                    New Total
                                  </span>
                                  <span className="fw-semibold">
                                    {(
                                      (receipt.totalAmount || 0) -
                                      ((receipt.totalAmount || 0) *
                                        (receipt.customerDiscountPercent ||
                                          0)) /
                                        100
                                    ).toFixed(2)}{" "}
                                    LKR
                                  </span>
                                </div>
                              </div>
                            )}
                            {/* Rounding Discount */}
                            <div className="mb-3">
                              <label className="form-label small">
                                Rounding Discount
                              </label>
                              <div className="input-group">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="form-control"
                                  min="0"
                                  value={payLaterFormData.roundingDiscount}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      0,
                                      parseFloat(e.target.value) || 0
                                    );
                                    setPayLaterFormData((prev) => ({
                                      ...prev,
                                      roundingDiscount: val,
                                    }));
                                  }}
                                />
                                <span className="input-group-text">LKR</span>
                              </div>
                            </div>
                            {/* Final Amount Due */}
                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold fs-5">
                                  Final Amount Due
                                </span>
                                <span className="fw-bold fs-4 text-primary">
                                  {payLaterFinalDue.toFixed(2)} LKR
                                </span>
                              </div>
                            </div>
                            {/* Received Amount */}
                            <div className="mb-3">
                              <label className="form-label small">
                                Received Amount
                              </label>
                              <div className="input-group">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="form-control"
                                  min="0"
                                  value={payLaterFormData.receivedAmount}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      0,
                                      parseFloat(e.target.value) || 0
                                    );
                                    setPayLaterFormData((prev) => ({
                                      ...prev,
                                      receivedAmount: val,
                                    }));
                                  }}
                                />
                                <span className="input-group-text">LKR</span>
                              </div>
                            </div>
                            {/* Balance */}
                            <div className="mb-3">
                              <label className="form-label small">
                                Balance
                              </label>
                              <div
                                className={`form-control ${
                                  payLaterBalance >= 0
                                    ? "bg-light"
                                    : "bg-warning text-dark"
                                }`}
                              >
                                {payLaterBalance >= 0
                                  ? `${payLaterBalance.toFixed(2)} LKR`
                                  : `Change: ${Math.abs(
                                      payLaterBalance
                                    ).toFixed(2)} LKR`}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => setShowCompletePayLaterForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleCompletePayLaterSubmit}
                  >
                    Complete as Paid
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowCompletePayLaterForm(false)}
          ></div>
        </>
      )}
      {/* Finalize Receipt Modal */}
      {showFinalizeModal && receiptNumber && (
        <FinalizeReceiptModal
          receiptNumber={receiptNumber}
          onClose={handleFinalizeModalClose}
          onSuccess={handleFinalizeSuccess}
        />
      )}
      <Footer />
    </>
  );
};

export default SalesView;
