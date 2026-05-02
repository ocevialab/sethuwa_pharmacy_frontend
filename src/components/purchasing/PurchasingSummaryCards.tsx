import React, { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiShoppingCart,
  FiPackage,
  FiTruck,
} from "react-icons/fi";
import { purchasingService, PurchaseSummary } from "@/services/purchasingService";

const PurchasingSummaryCards = () => {
  const [summary, setSummary] = useState<PurchaseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        // Get current month and year
        const now = new Date();
        const month = now.getMonth() + 1; // getMonth() returns 0-11
        const year = now.getFullYear();
        
        const data = await purchasingService.getPurchaseSummary(month, year);
        setSummary(data);
      } catch (error) {
        console.error("Failed to fetch purchasing summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  if (loading) {
    return (
      <div className="mb-4">
        <h5 className="mb-3">Summary</h5>
        <div className="row g-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-12 col-sm-6 col-lg-3">
              <div
                className="card"
                style={{
                  background: "#17c666",
                  borderRadius: "12px",
                  border: "none",
                }}
              >
                <div className="card-body">
                  <div
                    className="spinner-border spinner-border-sm text-white"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h5 className="mb-3">Summary</h5>
      <div className="row g-3">
        {/* Pending Payments Card */}
        <div className="col-12 col-sm-6 col-lg-3 d-flex">
          <div
            className="card h-100 w-100"
            style={{
              background: "#ff9800",
              borderRadius: "12px",
              border: "none",
            }}
          >
            <div className="card-body position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="text-white" style={{ fontSize: "24px" }}>
                  <FiDollarSign />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary
                  ? `${formatCurrency(summary.pendingPayments.totalAmount)} LKR`
                  : "0 LKR"}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Pending Payments
              </p>
              {summary && (
                <p
                  className="text-white mt-1 mb-0"
                  style={{ fontSize: "12px", opacity: 0.8 }}
                >
                  {summary.pendingPayments.invoiceCount} invoice
                  {summary.pendingPayments.invoiceCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Purchases Card */}
        <div className="col-12 col-sm-6 col-lg-3 d-flex">
          <div
            className="card h-100 w-100"
            style={{
              background: "#3dc7be",
              borderRadius: "12px",
              border: "none",
            }}
          >
            <div className="card-body position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="text-white" style={{ fontSize: "24px" }}>
                  <FiShoppingCart />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary
                  ? `${formatCurrency(summary.monthlyPurchases.totalAmount)} LKR`
                  : "0 LKR"}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Monthly Purchases
              </p>
              {summary && (
                <p
                  className="text-white mt-1 mb-0"
                  style={{ fontSize: "12px", opacity: 0.8 }}
                >
                  {summary.monthlyPurchases.invoiceCount} invoice
                  {summary.monthlyPurchases.invoiceCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items Received Card */}
        <div className="col-12 col-sm-6 col-lg-3 d-flex">
          <div
            className="card h-100 w-100"
            style={{
              background: "#17c666",
              borderRadius: "12px",
              border: "none",
            }}
          >
            <div className="card-body position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="text-white" style={{ fontSize: "24px" }}>
                  <FiPackage />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary
                  ? formatNumber(summary.itemsReceived.totalQuantity)
                  : "0"}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Items Received
              </p>
              {summary && (
                <p
                  className="text-white mt-1 mb-0"
                  style={{ fontSize: "12px", opacity: 0.8 }}
                >
                  {summary.itemsReceived.batches} batch
                  {summary.itemsReceived.batches !== 1 ? "es" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Active Suppliers Card */}
        <div className="col-12 col-sm-6 col-lg-3 d-flex">
          <div
            className="card h-100 w-100"
            style={{
              background: "#ea4d4d",
              borderRadius: "12px",
              border: "none",
            }}
          >
            <div className="card-body position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="text-white" style={{ fontSize: "24px" }}>
                  <FiTruck />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary ? formatNumber(summary.activeSuppliers) : 0}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Active Suppliers
              </p>
              {summary && (
                <p
                  className="text-white mt-1 mb-0"
                  style={{ fontSize: "12px", opacity: 0.8 }}
                >
                  {summary.activeSuppliers === 1
                    ? "1 supplier"
                    : `${formatNumber(summary.activeSuppliers)} suppliers`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasingSummaryCards;



