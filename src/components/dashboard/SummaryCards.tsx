import React, { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
} from "react-icons/fi";
import { financeService, FinanceSummary } from "@/services/financeService";

const SummaryCards = () => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const data = await financeService.getSummary(month, year, "monthly");
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch finance summary:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Silent fetch for polling (no loading state)
  const fetchSummarySilent = async () => {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const data = await financeService.getSummary(month, year, "monthly");
      setSummary(data);
    } catch (error) {
      // Silently fail during polling
      console.error("Error polling summary:", error);
    }
  };

  useEffect(() => {
    // Initial load with loading state
    fetchSummary(true);

    // Polling for real-time updates (silent, no loading state)
    const POLLING_INTERVAL = 10000; // 10 seconds for summary (less frequent)
    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const pollSummary = async () => {
      if (!isMounted) return;
      try {
        await fetchSummarySilent();
      } catch (error) {
        // Silently handle errors during polling
        console.error("Error polling summary:", error);
      }
    };

    // Start polling after initial load (wait a bit to avoid immediate refresh)
    const startPolling = setTimeout(() => {
      if (isMounted) {
        pollInterval = setInterval(pollSummary, POLLING_INTERVAL);
      }
    }, POLLING_INTERVAL);

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(startPolling);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
        {/* Total Revenue Card */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card"
            style={{
              background: "#17c666",
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
                  ? `${formatCurrency(summary.totalRevenue)} LKR`
                  : "0 LKR"}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Total Revenue
              </p>
            </div>
          </div>
        </div>

        {/* Gross Profit Card */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card"
            style={{
              background: "#3dc7be",
              borderRadius: "12px",
              border: "none",
            }}
          >
            <div className="card-body position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="text-white" style={{ fontSize: "24px" }}>
                  <FiTrendingUp />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary
                  ? `${formatCurrency(summary.grossProfit)} LKR`
                  : "0 LKR"}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Gross Profit
              </p>
            </div>
          </div>
        </div>

        {/* Cost of Sold Card */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card"
            style={{
              background: "#ea4d4d",
              borderRadius: "12px",
              border: "none",
            }}
          >
            <div className="card-body position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="text-white" style={{ fontSize: "24px" }}>
                  <FiTrendingDown />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary
                  ? `${formatCurrency(Math.abs(summary.costOfSold))} LKR`
                  : "0 LKR"}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Cost of Sold
              </p>
            </div>
          </div>
        </div>

        {/* Unpaid Purchases Card */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card"
            style={{
              background: "#ff9800",
              borderRadius: "12px",
              border: "none",
            }}
          >
            <div className="card-body position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="text-white" style={{ fontSize: "24px" }}>
                  <FiAlertCircle />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary?.unpaidPurchases
                  ? summary.unpaidPurchases.pending.count
                  : 0}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Pending Purchases
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
