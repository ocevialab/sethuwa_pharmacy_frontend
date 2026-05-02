import React from 'react'
import topTost from '@/utils/topTost';
import { Customer } from '@/services/customerService';

interface TabSecurityProps {
    customer?: Customer | null;
}

const TabSecurity: React.FC<TabSecurityProps> = ({ customer }) => {
    const handleClick = () => {
        topTost()
    };
    return (
        <div className="tab-pane fade p-4" id="securityTab" role="tabpanel">
            {customer && (
                <>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-3">Customer Security Information</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="p-3 border border-dashed border-gray-3 rounded">
                                    <small className="text-muted d-block mb-1">Customer ID</small>
                                    <strong>{customer.customerId}</strong>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 border border-dashed border-gray-3 rounded">
                                    <small className="text-muted d-block mb-1">Status</small>
                                    <span className={`badge ${customer.customerStatus === 'Active' ? 'bg-success' : 'bg-warning'}`}>
                                        {customer.customerStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr />
                </>
            )}
            <SecurityFeature
                title="Data Access Control"
                description="Control who can access and modify customer information. Only authorized personnel should have access to sensitive customer data."
                label="Enable strict access control"
                checkboxId="accessControl"
                isChecked={true}
            />
            <SecurityFeature
                title="Data Encryption"
                description="Customer data is encrypted to protect sensitive information such as contact details and billing information."
                label="Data encryption enabled"
                checkboxId="dataEncryption"
                isChecked={true}
            />
            <SecurityFeature
                title="Audit Logging"
                description="All actions performed on customer data are logged for security and compliance purposes."
                label="Enable audit logging"
                checkboxId="auditLogging"
                isChecked={true}
            />
            <SecurityFeature
                title="Backup & Recovery"
                description="Regular backups ensure customer data can be recovered in case of data loss or system failure."
                label="Enable automatic backups"
                checkboxId="backupRecovery"
                isChecked={true}
            />
            {customer && (
                <>
                    <hr className="my-5" />
                    <div className="alert alert-dismissible mb-4 p-4 d-flex alert-soft-warning-message" role="alert">
                        <div className="me-4 d-none d-md-block">
                            <i className="feather feather-alert-triangle text-warning fs-1"></i>
                        </div>
                        <div>
                            <p className="fw-bold mb-0 text-truncate-1-line">Customer Data Privacy</p>
                            <p className="text-truncate-3-line mt-2 mb-4">
                                This customer's data is protected by our privacy policy. Ensure compliance with data protection regulations when handling this information.
                            </p>
                            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    </div>
                </>
            )}
            <div className="card mt-5">
                <div className="card-body">
                    <h6 className="fw-bold">Delete Account</h6>
                    <p className="fs-11 text-muted">Go to the Data & Privacy section of your profile Account. Scroll to "Your data & privacy options." Delete your Profile Account. Follow the instructions to delete your account:</p>
                    <div className="my-4 py-2">
                        <input type="password" className="form-control" placeholder="Enter your password" />
                        <div className="mt-3">
                            <div className="custom-control custom-checkbox">
                                <input type="checkbox" className="custom-control-input" id="acDeleteDeactive" />
                                <label className="custom-control-label c-pointer" htmlFor="acDeleteDeactive">I confirm my account deletations or deactivation.</label>
                            </div>
                        </div>
                    </div>
                    <div className="d-sm-flex gap-2">
                        <a href="#" className="btn btn-danger" data-action-target="#acSecctingsActionMessage">Delete Account</a>
                        <a href="#" className="btn btn-warning mt-2 mt-sm-0" onClick={handleClick}>Deactiveted Account</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TabSecurity


const SecurityFeature: React.FC<{ title: string; description: string; label: string; checkboxId: string; isChecked: boolean }> = ({ title, description, label, checkboxId, isChecked }) => {
    return (
        <div className="p-4 mb-4 border border-dashed border-gray-3 rounded-1">
            <h6 className="fw-bolder"><a href="#">{title}</a></h6>
            <div className="fs-12 text-muted text-truncate-3-line mt-2 mb-4">{description}</div>
            <div className="form-check form-switch form-switch-sm">
                <label className="form-check-label fw-500 text-dark c-pointer" htmlFor={checkboxId}>{label}</label>
                <input className="form-check-input c-pointer" type="checkbox" id={checkboxId} defaultChecked={isChecked} />
            </div>
        </div>
    );
};