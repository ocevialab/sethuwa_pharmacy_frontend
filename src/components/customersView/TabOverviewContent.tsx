import React from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import { Customer } from '@/services/customerService';

interface TabOverviewContentProps {
    customer?: Customer | null;
}

const TabOverviewContent: React.FC<TabOverviewContentProps> = ({ customer }) => {
    const informationData = customer ? [
        { label: 'Customer ID', value: customer.customerId || 'N/A' },
        { label: 'Customer Name', value: customer.customerName },
        { label: 'Contact Number', value: customer.contactNumber },
        { label: 'Email Address', value: customer.emailAddress || 'N/A' },
        { label: 'Address', value: customer.address },
        { label: 'Discount', value: `${customer.discount}%` },
        { label: 'Status', value: customer.customerStatus },
    ] : [
        { label: 'Full Name', value: 'Ocevia Lab' },
        { label: 'Surname', value: 'Della' },
        { label: 'Company', value: 'Theme Ocean' },
        { label: 'Date of Birth', value: '26 May, 2000' },
        { label: 'Mobile Number', value: '+01 (375) 5896 3214' },
        { label: 'Email Address', value: 'ocevialab@gmail.com' },
        { label: 'Location', value: 'California, United States' },
        { label: 'Joining Date', value: '20 Dec, 2023' },
        { label: 'Country', value: 'United States' },
        { label: 'Communication', value: 'Email, Phone' },
        { label: 'Allow Changes', value: 'YES' },
        { label: 'Website', value: 'https://themeforest.net/user/theme_ocean' },
    ];
    return (
        <div
            className="tab-pane fade show active p-4"
            id="overviewTab"
            role="tabpanel"
        >
            {customer && (
                <div className="about-section mb-5">
                    <div className="mb-4 d-flex align-items-center justify-content-between">
                        <h5 className="fw-bold mb-0">Customer Information:</h5>
                        <a href={`/customers/create?id=${customer.customerId}`} className="btn btn-sm btn-outline-primary">
                            Edit
                        </a>
                    </div>
                    <div className="p-3 border rounded bg-light mb-3">
                        <p className="mb-2">
                            <strong>{customer.customerName}</strong> is a 
                            <span className={`badge ms-2 ${customer.customerStatus === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                {customer.customerStatus}
                            </span> customer
                            {customer.emailAddress ? ` with email ${customer.emailAddress}` : ''}. 
                            {customer.discount > 0 && ` This customer has a ${customer.discount}% discount.`}
                        </p>
                        <p className="mb-2">
                            <strong>Contact Information:</strong> {customer.contactNumber}
                            {customer.emailAddress && ` | ${customer.emailAddress}`}
                        </p>
                        <p className="mb-0">
                            <strong>Address:</strong> {customer.address}
                        </p>
                    </div>
                </div>
            )}
            <div className="profile-details mb-5">
                <div className="mb-4 d-flex align-items-center justify-content-between">
                    <h5 className="fw-bold mb-0">Profile Details:</h5>
                    <a href="#" className="btn btn-sm btn-outline-primary">
                        Edit Profile
                    </a>
                </div>
                <div className="row g-3">
                    {informationData.map((item, index) => (
                        <div key={index} className="col-sm-6">
                            <div className="p-3 border rounded bg-light h-100">
                                <div className="text-muted small mb-1">{item.label}:</div>
                                <div className="fw-semibold">{item.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* <div
                className="alert alert-dismissible mb-4 p-4 d-flex alert-soft-warning-message profile-overview-alert"
                role="alert"
            >
                <div className="me-4 d-none d-md-block">
                    <FiAlertTriangle className='fs-1' />
                </div>
                <div>
                    <p className="fw-bold mb-1 text-truncate-1-line">
                        Your profile has not been updated yet!!!
                    </p>
                    <p className="fs-10 fw-medium text-uppercase text-truncate-1-line">
                        Last Update: <strong>26 Dec, 2023</strong>
                    </p>
                    <a
                        href="#"
                        className="btn btn-sm bg-soft-warning text-warning d-inline-block"
                    >
                        Update Now
                    </a>
                    <button
                        type="button"
                        className="btn-close"
                        data-bs-dismiss="alert"
                        aria-label="Close"
                    />
                </div>
            </div> */}
        </div>

    )
}

export default TabOverviewContent