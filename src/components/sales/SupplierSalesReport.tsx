import React, { useState, useEffect, useCallback } from "react";
import { salesService, SupplierSalesSummaryItem } from "@/services/salesService";
import { FiPackage, FiRefreshCw, FiDownload } from "react-icons/fi";

const SupplierSalesReport: React.FC = () => {
  const [data, setData] = useState<SupplierSalesSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await salesService.getSalesBySupplier(
        fromDate || undefined,
        toDate || undefined
      );
      setData(result.data);
    } catch (err) {
      console.error("Failed to fetch supplier sales report:", err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchReport();
  }, []);

  const exportCsv = () => {
    if (data.length === 0) return;
    const headers = ["Supplier", "Batches Used", "Units Sold", "Total Revenue (LKR)"];
    const rows = data.map((row) => [
      row.supplierName,
      row.batchCount,
      row.totalUnitsSold,
      row.totalRevenue.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supplier-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = data.reduce((s, d) => s + d.totalRevenue, 0);
  const totalUnits = data.reduce((s, d) => s + d.totalUnitsSold, 0);

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="avatar avatar-sm bg-light-primary">
              <FiPackage size={16} className="text-primary" />
            </div>
            <h6 className="mb-0 fw-bold">Sales by Supplier</h6>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: "auto" }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="From"
            />
            <span className="text-muted small">to</span>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: "auto" }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="To"
            />
            <button
              className="btn btn-sm btn-primary"
              onClick={fetchReport}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" />
              ) : (
                <FiRefreshCw size={14} />
              )}
            </button>
            <button
              className="btn btn-sm btn-light-brand"
              onClick={exportCsv}
              disabled={data.length === 0}
              title="Export to CSV"
            >
              <FiDownload size={14} />
            </button>
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            No sales with batch tracking found for this period.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Supplier</th>
                  <th className="text-center">Batches Used</th>
                  <th className="text-center">Units Sold</th>
                  <th className="text-end">Revenue (LKR)</th>
                  <th className="text-end">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.supplierId}>
                    <td className="fw-semibold">{row.supplierName}</td>
                    <td className="text-center">{row.batchCount}</td>
                    <td className="text-center">{row.totalUnitsSold.toLocaleString()}</td>
                    <td className="text-end fw-semibold text-success">
                      {row.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-end" style={{ minWidth: "100px" }}>
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <div
                          className="progress flex-grow-1"
                          style={{ height: "6px", maxWidth: "60px" }}
                        >
                          <div
                            className="progress-bar bg-primary"
                            style={{
                              width: totalRevenue > 0
                                ? `${(row.totalRevenue / totalRevenue) * 100}%`
                                : "0%",
                            }}
                          />
                        </div>
                        <span className="small text-muted">
                          {totalRevenue > 0
                            ? `${((row.totalRevenue / totalRevenue) * 100).toFixed(1)}%`
                            : "0%"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light fw-bold">
                <tr>
                  <td>Total</td>
                  <td />
                  <td className="text-center">{totalUnits.toLocaleString()}</td>
                  <td className="text-end text-success">
                    {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-end">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierSalesReport;
