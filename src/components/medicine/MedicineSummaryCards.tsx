import React, { useState, useEffect } from "react";
import {
  FiPackage,
  FiCheckCircle,
  FiTrash2,
  FiFileText,
  FiShield,
} from "react-icons/fi";
import { medicineService, MedicineSummary } from "@/services/medicineService";

const MedicineSummaryCards = () => {
  const [summary, setSummary] = useState<MedicineSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await medicineService.getSummary();
        setSummary(data);
      } catch (error) {
        console.error("Failed to fetch medicine summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  if (loading) {
    return (
      <div className="mb-4">
        <h5 className="mb-3">Medicine Summary</h5>
        <div className="row g-3">
          {[1, 2, 3, 4, 5].map((i) => (
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
      <h5 className="mb-3">Medicine Summary</h5>
      <div className="row g-3">
        {/* Total Medicines Card */}
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
                  <FiPackage />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary ? formatNumber(summary.totalMedicines) : 0}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Total Medicines
              </p>
            </div>
          </div>
        </div>

        {/* Active Medicines Card */}
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
                  <FiCheckCircle />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary ? formatNumber(summary.activeMedicines) : 0}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Active Medicines
              </p>
            </div>
          </div>
        </div>

        {/* Deleted Medicines Card */}
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
                  <FiTrash2 />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary ? formatNumber(summary.deletedMedicines) : 0}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Deleted Medicines
              </p>
            </div>
          </div>
        </div>

        {/* Prescription Required Card */}
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
                  <FiShield />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary ? formatNumber(summary.prescriptionRequired) : 0}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Prescription Required
              </p>
            </div>
          </div>
        </div>

        {/* Non-Prescription Card */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card"
            style={{
              background: "#9c27b0",
              borderRadius: "12px",
              border: "none",
            }}
          >
            <div className="card-body position-relative">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="text-white" style={{ fontSize: "24px" }}>
                  <FiFileText />
                </div>
              </div>
              <h3 className="text-white mb-1 fw-bold">
                {summary ? formatNumber(summary.nonPrescription) : 0}
              </h3>
              <p
                className="text-white mb-0"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                Non-Prescription
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineSummaryCards;
