import React, { useState, useEffect } from 'react';
import {
  salesService,
  Receipt,
  FinalizeReceiptRequest,
  PaymentEntry,
} from '@/services/salesService';
import Swal from 'sweetalert2';
import { FiPlus, FiTrash2, FiDollarSign } from 'react-icons/fi';

interface FinalizeReceiptModalProps {
  receiptNumber: string;
  onClose: () => void;
  onSuccess: (customerName?: string) => void;
}

const FinalizeReceiptModal: React.FC<FinalizeReceiptModalProps> = ({
  receiptNumber,
  onClose,
  onSuccess,
}) => {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFinalizeForm, setShowFinalizeForm] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await salesService.getReceipt(receiptNumber);
        if (!cancelled) setReceipt(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load receipt';
        if (!cancelled) setError(msg);
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

  // Tab closes the modal (whole popup)
  useEffect(() => {
    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [onClose]);

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
    if (!receipt) return;
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

    // Adjust payment amounts if customer gave more than final due (there's change)
    // The total payment saved should equal finalDue, not the amount customer gave
    let adjustedPayments: PaymentEntry[];
    if (totalPayments > finalDue) {
      // There's change - adjust payments proportionally to sum to finalDue
      const ratio = finalDue / totalPayments;
      adjustedPayments = payments.map((p) => ({
        ...p,
        paymentAmount: Math.round((p.paymentAmount * ratio) * 100) / 100, // Round to 2 decimals
      }));
      // Ensure the sum is exactly finalDue (handle rounding errors)
      const adjustedSum = adjustedPayments.reduce((sum, p) => sum + p.paymentAmount, 0);
      const difference = finalDue - adjustedSum;
      if (Math.abs(difference) > 0.01) {
        // Adjust the first payment to account for rounding differences
        adjustedPayments[0].paymentAmount = Math.round((adjustedPayments[0].paymentAmount + difference) * 100) / 100;
      }
    } else {
      // No change - use payments as is
      adjustedPayments = payments;
    }

    const requestData: FinalizeReceiptRequest = {
      customerDiscountPercent: formData.customerDiscountPercent,
      roundingDiscount: formData.roundingDiscount,
      payments: adjustedPayments.map((p) => ({
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
      Swal.fire({
        icon: 'success',
        title: 'Finalized!',
        text: 'Receipt has been finalized successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess(name || undefined);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to finalize receipt',
      });
    }
  };

  const handleFinalizeUnpaid = async () => {
    if (!receipt) return;
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
      await salesService.finalizeReceipt(receiptNumber, requestData);
      setShowFinalizeForm(false);
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
      Swal.fire({
        icon: 'success',
        title: 'Finalized!',
        text: 'Receipt has been finalized as Pay Later.',
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess(name || undefined);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to finalize receipt',
      });
    }
  };

  if (loading) {
    return (
      <>
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 mb-0">Loading receipt...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" onClick={onClose} />
      </>
    );
  }

  if (error || !receipt) {
    return (
      <>
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Finalize Receipt</h5>
                <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
              </div>
              <div className="modal-body text-center text-danger">
                {error || 'Receipt not found'}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" onClick={onClose} />
      </>
    );
  }

  const customerDiscountAmt =
    (receipt.totalAmount || 0) * (formData.customerDiscountPercent / 100);
  const subtotalAfterDiscount = (receipt.totalAmount || 0) - customerDiscountAmt;
  const finalDue = subtotalAfterDiscount - formData.roundingDiscount;
  const isDraft = receipt.saleStatus === 'Draft';

  return (
    <>
      <style>{`
        html.app-skin-dark .modal-content { background-color: #1b2436 !important; border-color: #2a3441 !important; }
        html.app-skin-dark .modal-header { border-bottom-color: #2a3441 !important; }
        html.app-skin-dark .modal-footer { border-top-color: #2a3441 !important; }
        html.app-skin-dark .modal-body { color: #b1b4c0 !important; }
        html.app-skin-dark .modal-title { color: #ffffff !important; }
      `}</style>
      <div
        className="modal fade show"
        style={{ display: 'block' }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">
                Finalize Receipt #{receiptNumber}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              {/* Receipt details */}
              <div className="mb-3">
                <h6 className="fw-bold">Receipt Information</h6>
                <p className="mb-1">
                  Receipt #{receipt.receiptNumber} | Sales ID: {receipt.salesId}
                </p>
                <p className="mb-1 text-muted">
                  By {receipt.issuedBy} | {formatDate(receipt.date)} {formatTime(receipt.time)}
                </p>
                <p className="mb-1">Status: {receipt.saleStatus}</p>
                {receipt.customerName && (
                  <p className="mb-1 text-muted">Customer: {receipt.customerName}</p>
                )}
              </div>

              {/* Items table */}
              <h6 className="mb-2">Products</h6>
              <table className="table table-sm table-bordered mb-3">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Price (LKR)</th>
                    <th>Subtotal (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>{item.productSku}</td>
                      <td>{item.quantity}</td>
                      <td className="text-end">{item.price.toFixed(2)}</td>
                      <td className="text-end">{item.subTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="d-flex justify-content-end gap-3 mb-3">
                <span>Gross Total: {(receipt.totalAmount || 0).toFixed(2)} LKR</span>
                {receipt.customerDiscountPercent > 0 && (
                  <span>
                    Customer Discount: {receipt.customerDiscountPercent}%
                  </span>
                )}
                {receipt.roundingDiscount !== undefined && receipt.roundingDiscount > 0 && (
                  <span>Rounding: {(receipt.roundingDiscount || 0).toFixed(2)} LKR</span>
                )}
                <span className="fw-bold">Final Amount Due: {(receipt.finalAmountDue || 0).toFixed(2)} LKR</span>
              </div>

              {!showFinalizeForm && isDraft && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowFinalizeForm(true)}
                  >
                    Finalize Receipt
                  </button>
                </div>
              )}

              {showFinalizeForm && isDraft && (
                <>
                  <hr />
                  <h6 className="mb-2">Customer &amp; Payment</h6>
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Customer Name (Optional)</label>
                      <input
                        className="form-control"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                        }
                        placeholder="Customer name"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Contact Number</label>
                      <input
                        className="form-control"
                        value={formData.contactNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))
                        }
                        placeholder="Contact"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.emailAddress}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, emailAddress: e.target.value }))
                        }
                        placeholder="Email"
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-3">
                      <label className="form-label">Customer Discount %</label>
                      <div className="input-group">
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
                    <div className="col-md-3">
                      <label className="form-label">Rounding Discount (LKR)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        min={0}
                        value={formData.roundingDiscount}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setFormData((prev) => ({ ...prev, roundingDiscount: val }));
                        }}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Sub Total</label>
                      <input
                        className="form-control bg-light"
                        readOnly
                        value={`${subtotalAfterDiscount.toFixed(2)} LKR`}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Final Due</label>
                      <input
                        className="form-control bg-light fw-bold"
                        readOnly
                        value={`${finalDue.toFixed(2)} LKR`}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Payment Methods</h6>
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
                        Add at least one payment method.
                      </div>
                    ) : (
                      <div className="row g-2">
                        {payments.map((payment, index) => (
                          <div key={index} className="col-12">
                            <div className="card border">
                              <div className="card-body py-2">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="fw-semibold">Payment #{index + 1}</span>
                                  {payments.length > 1 && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => removePayment(index)}
                                    >
                                      <FiTrash2 size={14} />
                                    </button>
                                  )}
                                </div>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <select
                                      className="form-select form-select-sm"
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
                                      className="form-control form-control-sm"
                                      min={0}
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
                                          onClose();
                                        }
                                      }}
                                      placeholder="Amount (LKR)"
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
                      <div className="mt-2 p-2 rounded bg-light">
                        <div className="d-flex justify-content-between">
                          <span>Total Payments:</span>
                          <span className="fw-bold">{getTotalPayments().toFixed(2)} LKR</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Final Due:</span>
                          <span className="fw-bold">{finalDue.toFixed(2)} LKR</span>
                        </div>
                        <div
                          className={`mt-1 p-2 rounded ${
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
                </>
              )}

              {receipt.saleStatus === 'Paid' && (
                <div className="mt-3">
                  <p className="text-muted mb-0">
                    This receipt is already finalized (Paid).
                    {receipt.paymentMethod && ` Payment: ${receipt.paymentMethod}`}
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {showFinalizeForm && isDraft && payments.length > 0 ? (
                <>
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
                      className="btn btn-outline-warning"
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
                </>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
};

export default FinalizeReceiptModal;
