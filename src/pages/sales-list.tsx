import React, { useState, useCallback } from 'react';
import SalesHeader from '@/components/sales/SalesHeader';
import SalesDashboardList from '@/components/sales/SalesDashboardList';
import FinalizeReceiptPanel from '@/components/sales/FinalizeReceiptPanel';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';

const SalesList = () => {
  const [selectedReceiptNumber, setSelectedReceiptNumber] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleClosePanel = useCallback(() => {
    setSelectedReceiptNumber(null);
  }, []);

  const handleFinalizeSuccess = useCallback(() => {
    setSelectedReceiptNumber(null);
    setRefreshTrigger((t) => t + 1);
  }, []);

  return (
    <div className="sales-dashboard-layout">
      <style>{`
        .sales-dashboard-layout {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 140px);
        }
        .sales-dashboard-layout .main-content {
          flex: 1;
        }
        .sales-dashboard-layout .footer {
          margin-top: auto;
        }
      `}</style>
      <PageHeader>
        <SalesHeader />
      </PageHeader>
      <div className="main-content">
        <div className="row g-3">
          <div className="col-12">
            <h4 className="mb-0 fw-bold">Sales Dashboard</h4>
            <p className="text-muted small mb-0">View and finalize receipts from the list.</p>
          </div>
          {/* Left: Sales List with pagination */}
          <div className="col-12 col-lg-5 col-xl-6 order-1 order-lg-1">
            <SalesDashboardList
              selectedReceiptNumber={selectedReceiptNumber}
              onSelectReceipt={setSelectedReceiptNumber}
              refreshTrigger={refreshTrigger}
            />
          </div>
          {/* Right: Finalize Bill panel */}
          <div className="col-12 col-lg-7 col-xl-6 order-2 order-lg-2">
            <FinalizeReceiptPanel
              receiptNumber={selectedReceiptNumber}
              onClose={handleClosePanel}
              onSuccess={handleFinalizeSuccess}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SalesList;
