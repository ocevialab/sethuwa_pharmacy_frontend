import React, { useState, useEffect } from 'react'
import { FiAlertOctagon, FiCheck, FiEye, FiMoreVertical, FiSend } from 'react-icons/fi';
import { Customer } from '@/services/customerService';
import { salesService, CustomerSalesResponse } from '@/services/salesService';

interface TabBillingContentProps {
    billingHistoryshow?: boolean;
    customer?: Customer | null;
}

const TabBillingContent: React.FC<TabBillingContentProps> = ({ billingHistoryshow = false, customer }) => {
    const [billingData, setBillingData] = useState<CustomerSalesResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (customer?.customerId && billingHistoryshow) {
            fetchBillingHistory();
        }
    }, [customer?.customerId, billingHistoryshow]);

    const fetchBillingHistory = async () => {
        if (!customer?.customerId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await salesService.getCustomerSales(customer.customerId);
            setBillingData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch billing history');
            console.error('Error fetching billing history:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid':
                return 'success';
            case 'Unpaid':
                return 'warning';
            case 'Cancelled':
                return 'danger';
            case 'Draft':
                return 'secondary';
            default:
                return 'secondary';
        }
    };
    return (
        <>
            <div className="payment-history px-4 pt-4">
                <div className="mb-4 d-flex align-items-center justify-content-between">
                    <h5 className="fw-bold mb-0">Billing Information:</h5>
                </div>
                {customer && (
                    <div className="mb-4">
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <div className="p-3 border rounded bg-light">
                                    <small className="text-muted d-block mb-1">Customer Discount</small>
                                    <strong className="fs-18">{customer.discount}%</strong>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 border rounded bg-light">
                                    <small className="text-muted d-block mb-1">Total Orders</small>
                                    <strong className="fs-18">{billingData?.totalSales || 0}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 border rounded bg-light mb-3">
                            <small className="text-muted d-block mb-1">Billing Address</small>
                            <strong>{customer.address}</strong>
                        </div>
                    </div>
                )}
            </div>
            <hr className="mt-2" />
            {billingHistoryshow && (
                <>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-5">
                            <p className="text-danger">{error}</p>
                        </div>
                    ) : billingData && billingData.sales.length > 0 ? (
                        <BillingHistory sales={billingData.sales} formatDate={formatDate} getStatusColor={getStatusColor} />
                    ) : (
                        <div className="text-center py-5">
                            <h5 className="text-muted">No billing history found</h5>
                        </div>
                    )}
                </>
            )}
        </>

    )
}

export default TabBillingContent


interface BillingHistoryProps {
    sales: Array<{
        salesId: number;
        receiptNumber: string;
        date: string;
        time: string;
        saleStatus: string;
        paymentMethod: string | null;
        finalAmountDue: number;
    }>;
    formatDate: (dateString: string) => string;
    getStatusColor: (status: string) => string;
}

const BillingHistory: React.FC<BillingHistoryProps> = ({ sales, formatDate, getStatusColor }) => {
    return (
        <div className="payment-history">
            <div className="mb-4 px-4 d-flex align-items-center justify-content-between">
                <h5 className="fw-bold mb-0">Billing History:</h5>
            </div>
            <div className="table-responsive">
                <table className="table mb-0">
                    <thead>
                        <tr className="border-top">
                            <th>Receipt Number</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale) => {
                            const statusColor = getStatusColor(sale.saleStatus);
                            return (
                                <tr key={sale.salesId}>
                                    <td><a href="#">{sale.receiptNumber}</a></td>
                                    <td>{formatDate(sale.date)}</td>
                                    <td className="fw-semibold">{sale.finalAmountDue.toFixed(2)} LKR</td>
                                    <td>{sale.paymentMethod || 'N/A'}</td>
                                    <td>
                                        <span className={`badge bg-soft-${statusColor} text-${statusColor}`}>
                                            {sale.saleStatus}
                                        </span>
                                    </td>
                                    <td className="hstack justify-content-end gap-4 text-end">
                                        <a href="#" data-bs-toggle="tooltip" data-bs-trigger="hover" title="Sent Mail">
                                            <FiSend className='fs-12' />
                                        </a>
                                        <a href="#" data-bs-toggle="tooltip" data-bs-trigger="hover" title="Invoice Details">
                                            <FiEye className='fs-12' />
                                        </a>
                                        <a href="#" data-bs-toggle="tooltip" data-bs-trigger="hover" title="More Options">
                                            <FiMoreVertical className='fs-12' />
                                        </a>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

