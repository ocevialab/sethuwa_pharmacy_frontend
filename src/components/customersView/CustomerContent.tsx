import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { customerService, Customer } from '@/services/customerService'
import CustomerSocalMedia from './CustomerSocalMedia'
import TabOverviewContent from './TabOverviewContent'
import TabBillingContent from './TabBillingContent'
import TabActivityContent from './TabActivityContent'
import TabNotificationsContent from './TabNotificationsContent'
import TabConnections from './TabConnections'
import TabSecurity from './TabSecurity'
import CustomerSocalFlower from './CustomerSocalFlower'
import Swal from 'sweetalert2'

const CustomerContent = () => {
    const [searchParams] = useSearchParams();
    const customerId = searchParams.get('id');
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (customerId) {
            fetchCustomerData();
        }
    }, [customerId]);

    const fetchCustomerData = async () => {
        if (!customerId) return;

        try {
            setLoading(true);
            const data = await customerService.getCustomerById(customerId);
            setCustomer(data);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error instanceof Error ? error.message : 'Failed to load customer data',
            });
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div className="col-12">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="col-12">
                <div className="card">
                    <div className="card-body text-center">
                        <p className="text-muted">Customer not found</p>
                        <Link to="/customers/list" className="btn btn-primary">
                            Back to List
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="col-xxl-4 col-xl-6">
                <div className="card">
                    <div className="card-body text-center">
                        <div className="avatar avatar-lg mx-auto mb-3">
                            <div className="text-white avatar-text user-avatar-text avatar-lg">
                                {getInitials(customer.customerName)}
                            </div>
                        </div>
                        <h5 className="card-title mb-1">{customer.customerName}</h5>
                        <p className="text-muted mb-2">{customer.customerId}</p>
                        <span className={`badge ${customer.customerStatus === 'Active' ? 'bg-success' : 'bg-warning'}`}>
                            {customer.customerStatus}
                        </span>
                        <div className="mt-4 text-start">
                            <div className="mb-2">
                                <strong>Contact:</strong> <a href={`tel:${customer.contactNumber}`}>{customer.contactNumber}</a>
                            </div>
                            {customer.emailAddress && (
                                <div className="mb-2">
                                    <strong>Email:</strong> <a href={`mailto:${customer.emailAddress}`}>{customer.emailAddress}</a>
                                </div>
                            )}
                            <div className="mb-2">
                                <strong>Address:</strong> {customer.address}
                            </div>
                            <div className="mb-2">
                                <strong>Discount:</strong> {customer.discount}%
                            </div>
                        </div>
                    </div>
                </div>
                <CustomerSocalMedia />
                <CustomerSocalFlower />
            </div>
            <div className="col-xxl-8 col-xl-6">
                <div className="card border-top-0">
                    <div className="card-header p-0">
                        <ul className="nav nav-tabs flex-wrap w-100 text-center customers-nav-tabs" id="myTab" role="tablist">
                            <li className="nav-item flex-fill border-top" role="presentation">
                                <a href="#" className="nav-link active" data-bs-toggle="tab" data-bs-target="#overviewTab" role="tab">Overview</a>
                            </li>
                            <li className="nav-item flex-fill border-top" role="presentation">
                                <a href="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#billingTab" role="tab">Billing</a>
                            </li>
                            <li className="nav-item flex-fill border-top" role="presentation">
                                <a href="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#activityTab" role="tab">Activity</a>
                            </li>
                            <li className="nav-item flex-fill border-top" role="presentation">
                                <a href="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#notificationsTab" role="tab">Notifications</a>
                            </li>
                            <li className="nav-item flex-fill border-top" role="presentation">
                                <a href="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#connectionTab" role="tab">Connection</a>
                            </li>
                            <li className="nav-item flex-fill border-top" role="presentation">
                                <a href="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#securityTab" role="tab">Security</a>
                            </li>
                        </ul>
                    </div>
                    <div className="tab-content">
                        <TabOverviewContent customer={customer} />
                        <div className="tab-pane fade" id="billingTab" role="tabpanel">
                            <TabBillingContent billingHistoryshow={true} customer={customer} />
                        </div>
                        <TabActivityContent />
                        <TabNotificationsContent />
                        <TabConnections />
                        <TabSecurity />
                    </div>
                </div>
            </div>
        </>
    )
}

export default CustomerContent