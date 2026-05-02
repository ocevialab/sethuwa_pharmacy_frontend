import React, { useState, useEffect } from "react";
import { customerService, Customer } from "@/services/customerService";
import { FiEdit3 } from "react-icons/fi";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import TabOverviewContent from "@/components/customersView/TabOverviewContent";
import TabBillingContent from "@/components/customersView/TabBillingContent";
// import TabSecurity from "@/components/customersView/TabSecurity";

interface CustomerViewModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerViewModal: React.FC<CustomerViewModalProps> = ({
  customerId,
  isOpen,
  onClose,
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerData();
    } else {
      setCustomer(null);
    }
  }, [isOpen, customerId]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const fetchCustomerData = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      const data = await customerService.getCustomerById(customerId);
      setCustomer(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to load customer data",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
                .customer-view-modal .modal-dialog {
                    max-width: 90%;
                    width: 1200px;
                    margin: 1.75rem auto;
                }
                .customer-view-modal .modal-header {
                    background: #f8f9fa;
                    border-bottom: 1px solid #dee2e6;
                    padding: 1.25rem 1.5rem;
                }
                .customer-view-modal .nav-tabs {
                    border-bottom: 1px solid #dee2e6;
                }
                .customer-view-modal .nav-tabs .nav-link {
                    color: #6c757d;
                    border: none;
                    border-bottom: 2px solid transparent;
                    padding: 1rem 1.5rem;
                    transition: all 0.2s ease;
                }
                .customer-view-modal .nav-tabs .nav-link:hover {
                    color: #495057;
                    background-color: #f8f9fa;
                }
                .customer-view-modal .nav-tabs .nav-link.active {
                    color: #212529;
                    background-color: transparent;
                    border-bottom-color: #212529;
                    font-weight: 600;
                }
                .customer-view-modal .card {
                    border: 1px solid #dee2e6;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }
                .customer-view-modal .card-header {
                    background: #f8f9fa;
                    border-bottom: 1px solid #dee2e6;
                }
                @media (max-width: 1200px) {
                    .customer-view-modal .modal-dialog {
                        max-width: 95%;
                        width: 100%;
                    }
                }
                @media (max-width: 768px) {
                    .customer-view-modal .modal-dialog {
                        max-width: 100%;
                        margin: 0.5rem;
                        height: calc(100vh - 1rem);
                    }
                    .customer-view-modal .modal-content {
                        height: 100%;
                        border-radius: 0.5rem;
                    }
                    .customer-view-modal .modal-body {
                        overflow-y: auto;
                        max-height: calc(100vh - 200px);
                    }
                }
                html.app-skin-dark .customer-view-modal .modal-content {
                    background-color: #1b2436 !important;
                    border-color: #1b2436 !important;
                }
                html.app-skin-dark .customer-view-modal .modal-header {
                    background: #1b2436 !important;
                    border-bottom-color: #2a3441 !important;
                }
                html.app-skin-dark .customer-view-modal .modal-header .btn-close {
                    filter: invert(1);
                }
                html.app-skin-dark .customer-view-modal .modal-footer {
                    border-top-color: #1b2436 !important;
                }
                html.app-skin-dark .customer-view-modal .card {
                    background-color: #121b2e !important;
                    border-color: #1b2436 !important;
                }
                html.app-skin-dark .customer-view-modal .card-header {
                    background: #1b2436 !important;
                }
                html.app-skin-dark .customer-view-modal .nav-tabs {
                    border-bottom-color: #2a3441 !important;
                }
                html.app-skin-dark .customer-view-modal .nav-tabs .nav-link {
                    color: #b1b4c0 !important;
                }
                html.app-skin-dark .customer-view-modal .nav-tabs .nav-link:hover {
                    color: #ffffff !important;
                    background-color: rgba(255, 255, 255, 0.05) !important;
                }
                html.app-skin-dark .customer-view-modal .nav-tabs .nav-link.active {
                    color: #ffffff !important;
                    background-color: transparent !important;
                    border-bottom-color: #ffffff !important;
                }
            `}</style>
      <div
        className={`modal fade customer-view-modal ${isOpen ? "show" : ""}`}
        style={{ display: isOpen ? "block" : "none" }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customerViewModalLabel"
      >
        <div
          className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5
                className="modal-title fw-bold mb-0"
                id="customerViewModalLabel"
              >
                Customer Details
              </h5>
              <div className="d-flex align-items-center gap-2">
                {customer && (
                  <Link
                    to={`/customers/create?id=${customer.customerId}`}
                    className="btn btn-primary btn-sm"
                    onClick={onClose}
                  >
                    <FiEdit3 className="me-2" size={16} />
                    Edit Customer
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="modal-body">
              {loading ? (
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{ minHeight: "400px" }}
                >
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : customer ? (
                <div className="row g-3">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header p-0">
                        <ul
                          className="nav nav-tabs flex-wrap w-100 text-center customers-nav-tabs"
                          id="customerViewTab"
                          role="tablist"
                        >
                          <li
                            className="nav-item flex-fill border-top"
                            role="presentation"
                          >
                            <a
                              href="#"
                              className="nav-link active"
                              data-bs-toggle="tab"
                              data-bs-target="#overviewTab"
                              role="tab"
                            >
                              Overview
                            </a>
                          </li>
                          <li
                            className="nav-item flex-fill border-top"
                            role="presentation"
                          >
                            <a
                              href="#"
                              className="nav-link"
                              data-bs-toggle="tab"
                              data-bs-target="#billingTab"
                              role="tab"
                            >
                              Billing
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="tab-content">
                        <TabOverviewContent customer={customer} />
                        <div
                          className="tab-pane fade"
                          id="billingTab"
                          role="tabpanel"
                        >
                          <TabBillingContent
                            billingHistoryshow={true}
                            customer={customer}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">Customer not found</p>
                  <button className="btn btn-primary" onClick={onClose}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isOpen && (
        <div
          className="modal-backdrop fade show"
          onClick={onClose}
          style={{ zIndex: 1040 }}
        ></div>
      )}
    </>
  );
};

export default CustomerViewModal;
