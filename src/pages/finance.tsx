import React, { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import FinanceHeader from "@/components/finance/FinanceHeader";
import Footer from "@/components/shared/Footer";
import {
  financeService,
  RevenueTrendData,
  SupplierExpense,
  MostSellingItem,
  FinanceSummary,
  FinanceReport,
} from "@/services/financeService";
import { salesService, SalesSummaryToday } from "@/services/salesService";
import { PDFReportGenerator } from "@/utils/pdfReportGenerator";
import {
  FiDollarSign,
  FiTrendingUp,
  FiShoppingCart,
  FiPackage,
  FiRotateCw,
  FiAlertCircle,
  FiMoreVertical,
  FiDownload,
  FiTrendingDown,
  FiCreditCard,
  FiCalendar,
  FiBarChart,
  FiShoppingBag,
} from "react-icons/fi";
import Swal from "sweetalert2";
import Chart from "react-apexcharts";
import Table from "@/components/shared/table/Table";
import Dropdown from "@/components/shared/Dropdown";

const Finance: React.FC = () => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [salesSummaryToday, setSalesSummaryToday] =
    useState<SalesSummaryToday | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendData[]>([]);
  const [supplierExpenses, setSupplierExpenses] = useState<SupplierExpense[]>(
    []
  );
  const [mostSellingItems, setMostSellingItems] = useState<MostSellingItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportStartDate, setReportStartDate] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split("T")[0];
  });

  const fetchData = useCallback(async () => {
    try {
      const [
        summaryData,
        revenueData,
        expensesData,
        sellingItemsData,
        salesSummaryData,
      ] = await Promise.all([
        financeService.getSummary(month, year, "monthly"),
        financeService.getRevenueTrend(year),
        financeService.getSupplierExpenses(month, year),
        financeService.getMostSellingItems(month, year),
        salesService.getSummaryToday(),
      ]);
      setSummary(summaryData);
      setRevenueTrend(Array.isArray(revenueData) ? revenueData : []);
      setSupplierExpenses(Array.isArray(expensesData) ? expensesData : []);
      setMostSellingItems(
        Array.isArray(sellingItemsData) ? sellingItemsData : []
      );
      setSalesSummaryToday(salesSummaryData);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to load finance data",
      });
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // State to force chart re-render on theme change
  const [chartKey, setChartKey] = useState(0);
  const isDarkTheme =
    document.documentElement.classList.contains("app-skin-dark");

  // Revenue Trend Chart Options - memoized to update when theme changes
  const revenueChartOptions: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        height: 350,
        toolbar: {
          show: false, // Hide default toolbar - we'll use custom menu
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100],
        },
      },
      xaxis: {
        categories: Array.isArray(revenueTrend)
          ? revenueTrend.map((item) => item.month)
          : [],
        labels: {
          style: {
            colors: isDarkTheme ? "#b1b4c0" : "#64748b",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: isDarkTheme ? "#b1b4c0" : "#64748b",
          },
          formatter: (value: number) => `${value.toLocaleString()} LKR`,
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
      },
      colors: ["#3454d1", "#ea4d4d", "#17c666"],
      tooltip: {
        y: {
          formatter: (value: number) => `${value.toLocaleString()} LKR`,
        },
      },
      theme: {
        mode: isDarkTheme ? "dark" : "light",
      },
    }),
    [isDarkTheme, revenueTrend]
  );

  const revenueChartSeries = [
    {
      name: "Revenue",
      data: Array.isArray(revenueTrend)
        ? revenueTrend.map((item) => item.revenue)
        : [],
    },
    {
      name: "Cost of Sold",
      data: Array.isArray(revenueTrend)
        ? revenueTrend.map((item) => item.costOfSold)
        : [],
    },
    {
      name: "Gross Profit",
      data: Array.isArray(revenueTrend)
        ? revenueTrend.map((item) => item.grossProfit)
        : [],
    },
  ];

  // Supplier Expenses Table Columns
  const supplierExpensesColumns = [
    {
      accessorKey: "supplierName",
      header: () => "Supplier Name",
      cell: (info: any) => (
        <span className="fw-semibold">{info.getValue()}</span>
      ),
    },
    {
      accessorKey: "totalExpense",
      header: () => "Total Expense",
      cell: (info: any) => (
        <span className="fw-semibold">
          {(info.getValue() ?? 0).toLocaleString()} LKR
        </span>
      ),
    },
    {
      accessorKey: "invoiceCount",
      header: () => "Invoice Count",
      cell: (info: any) => (
        <span className="badge bg-primary">{info.getValue()}</span>
      ),
    },
  ];

  const supplierExpensesTableData = Array.isArray(supplierExpenses)
    ? supplierExpenses.map((expense, index) => ({
        id: index + 1,
        supplierName: expense.supplierName,
        totalExpense: expense.totalExpense,
        invoiceCount: expense.invoiceCount,
      }))
    : [];

  // Most Selling Items Table Columns
  const mostSellingItemsColumns = [
    {
      accessorKey: "productName",
      header: () => "Product Name",
      cell: (info: any) => (
        <span className="fw-semibold">{info.getValue()}</span>
      ),
    },
    {
      accessorKey: "totalQuantitySold",
      header: () => "Quantity Sold",
      cell: (info: any) => <span>{info.getValue()}</span>,
    },
    {
      accessorKey: "totalRevenue",
      header: () => "Total Revenue",
      cell: (info: any) => (
        <span className="fw-semibold text-success">
          {(info.getValue() ?? 0).toLocaleString()} LKR
        </span>
      ),
    },
  ];

  const mostSellingItemsTableData = Array.isArray(mostSellingItems)
    ? mostSellingItems.map((item, index) => ({
        id: index + 1,
        productName: item.productName,
        totalQuantitySold: item.totalQuantitySold,
        totalRevenue: item.totalRevenue,
      }))
    : [];

  // Chart ref for export functionality
  const chartRef = React.useRef<any>(null);

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setChartKey((prev) => prev + 1);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Handle chart export
  const handleChartExport = (format: string) => {
    // Wait for chart to be mounted if not ready
    const tryExport = () => {
      if (chartRef.current?.chart) {
        const chart = chartRef.current.chart;
        switch (format) {
          case "SVG":
            chart.dataURI().then((uri: string) => {
              const link = document.createElement("a");
              link.download = `revenue-trend-${year}.svg`;
              link.href = uri;
              link.click();
            });
            break;
          case "PNG":
            chart.dataURI({ scale: 2 }).then((uri: string) => {
              const link = document.createElement("a");
              link.download = `revenue-trend-${year}.png`;
              link.href = uri;
              link.click();
            });
            break;
          case "CSV":
            // Generate CSV from revenueTrend data
            const csvContent = [
              ["Month", "Revenue", "Cost of Sold", "Gross Profit"],
              ...(Array.isArray(revenueTrend)
                ? revenueTrend.map((item) => [
                    item.month,
                    item.revenue.toString(),
                    item.costOfSold.toString(),
                    item.grossProfit.toString(),
                  ])
                : []),
            ]
              .map((row) => row.join(","))
              .join("\n");
            const blob = new Blob([csvContent], {
              type: "text/csv;charset=utf-8;",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `revenue-trend-${year}.csv`;
            link.href = url;
            link.click();
            window.URL.revokeObjectURL(url);
            break;
        }
      } else {
        // Retry after a short delay
        setTimeout(tryExport, 100);
      }
    };
    tryExport();
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    try {
      setReportLoading(true);
      let report: FinanceReport;

      switch (reportType) {
        case "daily":
          report = await financeService.getDailyReport(reportDate);
          break;
        case "weekly":
          report = await financeService.getWeeklyReport(reportStartDate);
          break;
        case "monthly":
          report = await financeService.getMonthlyReport(month, year);
          break;
        case "yearly":
          report = await financeService.getYearlyReport(year);
          break;
        default:
          throw new Error("Invalid report type");
      }

      // Generate PDF
      const generator = new PDFReportGenerator();
      generator.generateReport(report);

      // Generate filename
      let filename = "";
      switch (reportType) {
        case "daily":
          filename = `daily-report-${reportDate}.pdf`;
          break;
        case "weekly":
          filename = `weekly-report-${reportStartDate}.pdf`;
          break;
        case "monthly":
          filename = `monthly-report-${year}-${month
            .toString()
            .padStart(2, "0")}.pdf`;
          break;
        case "yearly":
          filename = `yearly-report-${year}.pdf`;
          break;
      }

      generator.download(filename);
      setShowReportModal(false);

      Swal.fire({
        icon: "success",
        title: "Report Generated",
        text: "The report has been downloaded successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error ? error.message : "Failed to generate report",
      });
    } finally {
      setReportLoading(false);
    }
  };

  // Handle PDF download for current view
  const handleDownloadPDF = async () => {
    try {
      setReportLoading(true);
      const report = await financeService.getMonthlyReport(month, year);
      const generator = new PDFReportGenerator();
      generator.generateReport(report);
      const filename = `finance-report-${year}-${month
        .toString()
        .padStart(2, "0")}.pdf`;
      generator.download(filename);

      Swal.fire({
        icon: "success",
        title: "Report Downloaded",
        text: "The PDF report has been downloaded successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to download PDF report",
      });
    } finally {
      setReportLoading(false);
    }
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    try {
      const monthName = new Date(year, month - 1).toLocaleString("default", {
        month: "long",
      });
      const filename = `finance-report-${monthName}-${year}.csv`;

      // Prepare CSV content
      const csvRows: string[] = [];

      // Add header
      csvRows.push(`Finance Report - ${monthName} ${year}`);
      csvRows.push("");

      // Add summary section
      if (summary) {
        csvRows.push("Summary");
        csvRows.push(
          `Total Revenue,${summary.totalRevenue.toLocaleString()} LKR`
        );
        csvRows.push(`Cost of Sold,${summary.costOfSold.toLocaleString()} LKR`);
        csvRows.push(
          `Gross Profit,${summary.grossProfit.toLocaleString()} LKR`
        );
        csvRows.push(
          `Pending Purchases,${summary.unpaidPurchases?.pending.count || 0}`
        );
        csvRows.push("");
      }

      // Add revenue trend section
      if (revenueTrend.length > 0) {
        csvRows.push("Revenue Trend");
        csvRows.push("Month,Revenue,Cost of Sold,Gross Profit");
        revenueTrend.forEach((item) => {
          csvRows.push(
            `${item.month || ""},${item.revenue},${item.costOfSold},${
              item.grossProfit
            }`
          );
        });
        csvRows.push("");
      }

      // Add supplier expenses section
      if (supplierExpenses.length > 0) {
        csvRows.push("Supplier Expenses");
        csvRows.push("Supplier Name,Total Expense,Invoice Count");
        supplierExpenses.forEach((expense) => {
          csvRows.push(
            `${expense.supplierName},${expense.totalExpense},${expense.invoiceCount}`
          );
        });
        csvRows.push("");
      }

      // Add most selling items section
      if (mostSellingItems.length > 0) {
        csvRows.push("Most Selling Items");
        csvRows.push("Product Name,Quantity Sold,Total Revenue");
        mostSellingItems.forEach((item) => {
          csvRows.push(
            `${item.productName},${item.totalQuantitySold},${item.totalRevenue}`
          );
        });
      }

      // Create and download file
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "CSV Downloaded",
        text: "The CSV report has been downloaded successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to download CSV report",
      });
    }
  };

  // Handle Excel download (CSV format with .xlsx extension)
  const handleDownloadExcel = () => {
    try {
      const monthName = new Date(year, month - 1).toLocaleString("default", {
        month: "long",
      });
      const filename = `finance-report-${monthName}-${year}.xlsx`;

      // Prepare CSV content (Excel can open CSV files)
      const csvRows: string[] = [];

      // Add header
      csvRows.push(`Finance Report - ${monthName} ${year}`);
      csvRows.push("");

      // Add summary section
      if (summary) {
        csvRows.push("Summary");
        csvRows.push(
          `Total Revenue,${summary.totalRevenue.toLocaleString()} LKR`
        );
        csvRows.push(`Cost of Sold,${summary.costOfSold.toLocaleString()} LKR`);
        csvRows.push(
          `Gross Profit,${summary.grossProfit.toLocaleString()} LKR`
        );
        csvRows.push(
          `Pending Purchases,${summary.unpaidPurchases?.pending.count || 0}`
        );
        csvRows.push("");
      }

      // Add revenue trend section
      if (revenueTrend.length > 0) {
        csvRows.push("Revenue Trend");
        csvRows.push("Month,Revenue,Cost of Sold,Gross Profit");
        revenueTrend.forEach((item) => {
          csvRows.push(
            `${item.month || ""},${item.revenue},${item.costOfSold},${
              item.grossProfit
            }`
          );
        });
        csvRows.push("");
      }

      // Add supplier expenses section
      if (supplierExpenses.length > 0) {
        csvRows.push("Supplier Expenses");
        csvRows.push("Supplier Name,Total Expense,Invoice Count");
        supplierExpenses.forEach((expense) => {
          csvRows.push(
            `${expense.supplierName},${expense.totalExpense},${expense.invoiceCount}`
          );
        });
        csvRows.push("");
      }

      // Add most selling items section
      if (mostSellingItems.length > 0) {
        csvRows.push("Most Selling Items");
        csvRows.push("Product Name,Quantity Sold,Total Revenue");
        mostSellingItems.forEach((item) => {
          csvRows.push(
            `${item.productName},${item.totalQuantitySold},${item.totalRevenue}`
          );
        });
      }

      // Create and download file (using CSV format with .xlsx extension)
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Excel Downloaded",
        text: "The Excel report has been downloaded successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to download Excel report",
      });
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader>
          <FinanceHeader />
        </PageHeader>
        <div className="main-content">
          <div className="row">
            <div className="col-12">
              <div
                className="d-flex align-items-center justify-content-center"
                style={{ minHeight: "400px" }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <style>{`
                html.app-skin-dark .function-table table.dataTable tbody tr td {
                    color: #b1b4c0 !important;
                    background-color: transparent;
                    border-color: #1b2436 !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr {
                    background-color: transparent;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr:hover td {
                    color: #ffffff !important;
                    background-color: #121b2e !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr:nth-of-type(odd) td {
                    color: #ffffff !important;
                    background-color: #121b2e !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr:nth-of-type(odd):hover td {
                    color: #ffffff !important;
                    background-color: #1c2438 !important;
                }
                html.app-skin-dark .function-table table.dataTable tbody tr .text-success {
                    color: #17c666 !important;
                }
                html.app-skin-dark .function-table table.dataTable thead th {
                    color: #ffffff !important;
                    border-color: #1b2436 !important;
                    background-color: transparent !important;
                }
                html.app-skin-dark .function-table table.dataTable thead th * {
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .dataTables_filter input {
                    background-color: #1b2436 !important;
                    border-color: #1b2436 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .dataTables_filter input:focus {
                    background-color: #1b2436 !important;
                    border-color: #3454d1 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .dataTables_length select {
                    background-color: #1b2436 !important;
                    border-color: #1b2436 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .dataTables_length select:focus {
                    background-color: #1b2436 !important;
                    border-color: #3454d1 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .pagination .page-link {
                    background-color: #1b2436 !important;
                    border-color: #1b2436 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .pagination .page-link:hover {
                    background-color: #121b2e !important;
                    border-color: #3454d1 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .pagination .page-item.active .page-link {
                    background-color: #3454d1 !important;
                    border-color: #3454d1 !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .function-table .dataTables_info {
                    color: #b1b4c0 !important;
                }
                /* Chart toolbar menu icon styles */
                .apexcharts-menu-icon {
                    width: 32px !important;
                    height: 32px !important;
                    border-radius: 4px !important;
                    transition: all 0.3s ease !important;
                }
                .apexcharts-menu-icon:hover {
                    background-color: rgba(52, 84, 209, 0.1) !important;
                }
                html.app-skin-dark .apexcharts-menu-icon {
                    color: #b1b4c0 !important;
                }
                html.app-skin-dark .apexcharts-menu-icon:hover {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                    color: #ffffff !important;
                }
                html.app-skin-dark .apexcharts-menu-icon svg {
                    fill: #b1b4c0 !important;
                }
                html.app-skin-dark .apexcharts-menu-icon:hover svg {
                    fill: #ffffff !important;
                }
                
                /* Chart menu dropdown styles */
                .apexcharts-menu {
                    background-color: #ffffff !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 8px !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                    padding: 4px !important;
                    min-width: 150px !important;
                }
                html.app-skin-dark .apexcharts-menu {
                    background-color: #1b2436 !important;
                    border-color: #2a3441 !important;
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5) !important;
                }
                .apexcharts-menu-item {
                    padding: 8px 12px !important;
                    border-radius: 4px !important;
                    font-size: 14px !important;
                    color: #374151 !important;
                    transition: all 0.2s ease !important;
                    cursor: pointer !important;
                }
                .apexcharts-menu-item:hover {
                    background-color: #f3f4f6 !important;
                    color: #3454d1 !important;
                }
                html.app-skin-dark .apexcharts-menu-item {
                    color: #b1b4c0 !important;
                }
                html.app-skin-dark .apexcharts-menu-item:hover {
                    background-color: #2a3441 !important;
                    color: #4d6fe8 !important;
                }
                
                /* Responsive chart container and toolbar */
                @media (max-width: 768px) {
                    .apexcharts-toolbar {
                        position: absolute !important;
                        top: 10px !important;
                        right: 10px !important;
                    }
                    .apexcharts-menu-icon {
                        width: 28px !important;
                        height: 28px !important;
                    }
                    .apexcharts-menu-icon svg {
                        width: 18px !important;
                        height: 18px !important;
                    }
                    .apexcharts-menu {
                        min-width: 140px !important;
                        font-size: 13px !important;
                    }
                    .apexcharts-menu-item {
                        padding: 6px 10px !important;
                        font-size: 13px !important;
                    }
                    .apexcharts-legend {
                        font-size: 12px !important;
                    }
                }
                @media (max-width: 480px) {
                    .apexcharts-menu-icon {
                        width: 24px !important;
                        height: 24px !important;
                    }
                    .apexcharts-menu-icon svg {
                        width: 16px !important;
                        height: 16px !important;
                    }
                    .apexcharts-menu {
                        min-width: 120px !important;
                        font-size: 12px !important;
                    }
                    .apexcharts-menu-item {
                        padding: 5px 8px !important;
                        font-size: 12px !important;
                    }
                }
            `}</style>
      <PageHeader>
        <FinanceHeader
          onRefresh={fetchData}
          onGenerateReport={() => setShowReportModal(true)}
          onDownloadPDF={handleDownloadPDF}
          onDownloadCSV={handleDownloadCSV}
          onDownloadExcel={handleDownloadExcel}
        />
      </PageHeader>
      <div className="main-content">
        <div className="row">
          {/* Summary Cards - Hidden */}
          {/* {summary && (
            <div className="col-12 mb-4">
              <h5 className="mb-3">Finance Summary</h5>
              <div className="row g-3">
                <div className="col-12 col-sm-6 col-lg-3">
                  <div
                    className="card"
                    style={{
                      background: "rgba(52, 84, 209, 0.1)",
                      borderRadius: "12px",
                      border: "1px solid rgba(52, 84, 209, 0.2)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="avatar avatar-md bg-light-primary">
                          <FiDollarSign size={20} className="text-primary" />
                        </div>
                      </div>
                      <h4 className="mb-1 fw-bold">
                        {summary.totalRevenue.toLocaleString()} LKR
                      </h4>
                      <p className="text-muted mb-0 fs-12">Total Revenue</p>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-lg-3">
                  <div
                    className="card"
                    style={{
                      background: "rgba(234, 77, 77, 0.1)",
                      borderRadius: "12px",
                      border: "1px solid rgba(234, 77, 77, 0.2)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="avatar avatar-md bg-light-danger">
                          <FiShoppingCart size={20} className="text-danger" />
                        </div>
                      </div>
                      <h4 className="mb-1 fw-bold">
                        {summary.costOfSold.toLocaleString()} LKR
                      </h4>
                      <p className="text-muted mb-0 fs-12">Cost of Sold</p>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-lg-3">
                  <div
                    className="card"
                    style={{
                      background: "rgba(23, 198, 102, 0.1)",
                      borderRadius: "12px",
                      border: "1px solid rgba(23, 198, 102, 0.2)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="avatar avatar-md bg-light-success">
                          <FiTrendingUp size={20} className="text-success" />
                        </div>
                      </div>
                      <h4 className="mb-1 fw-bold">
                        {summary.grossProfit.toLocaleString()} LKR
                      </h4>
                      <p className="text-muted mb-0 fs-12">Gross Profit</p>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-lg-3">
                  <div
                    className="card"
                    style={{
                      background: "rgba(255, 162, 29, 0.1)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 162, 29, 0.2)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="avatar avatar-md bg-light-warning">
                          <FiAlertCircle size={20} className="text-warning" />
                        </div>
                      </div>
                      <h4 className="mb-1 fw-bold">
                        {summary.unpaidPurchases?.pending.count || 0}
                      </h4>
                      <p className="text-muted mb-0 fs-12">Pending Purchases</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* Sales Summary Today Cards */}
          {salesSummaryToday && (
            <div className="col-12 mb-4">
              <h5 className="mb-3">Today's Sales Summary</h5>
              <div className="row g-3">
                {/* Total Sales Today Card */}
                <div className="col-12 col-sm-6 col-lg-3">
                  <div
                    className="card"
                    style={{
                      background: "rgba(23, 198, 102, 0.1)",
                      borderRadius: "12px",
                      border: "1px solid rgba(23, 198, 102, 0.2)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="avatar avatar-md bg-light-success">
                          <FiDollarSign size={20} className="text-success" />
                        </div>
                      </div>
                      <h4 className="mb-1 fw-bold">
                        {(salesSummaryToday.totalSalesToday ?? 0).toLocaleString()} LKR
                      </h4>
                      <p className="text-muted mb-0 fs-12">Total Sales Today</p>
                    </div>
                  </div>
                </div>

                {/* Total Receipts Today Card */}
                <div className="col-12 col-sm-6 col-lg-3">
                  <div
                    className="card"
                    style={{
                      background: "rgba(61, 199, 190, 0.1)",
                      borderRadius: "12px",
                      border: "1px solid rgba(61, 199, 190, 0.2)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="avatar avatar-md bg-light-info">
                          <FiShoppingBag size={20} className="text-info" />
                        </div>
                      </div>
                      <h4 className="mb-1 fw-bold">
                        {salesSummaryToday.totalReceiptsToday}
                      </h4>
                      <p className="text-muted mb-0 fs-12">Total Receipts Today</p>
                    </div>
                  </div>
                </div>

                {/* Cash Total Card */}
                <div className="col-12 col-sm-6 col-lg-3">
                  <div
                    className="card"
                    style={{
                      background: "rgba(255, 152, 0, 0.1)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 152, 0, 0.2)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="avatar avatar-md bg-light-warning">
                          <FiDollarSign size={20} className="text-warning" />
                        </div>
                      </div>
                      <h4 className="mb-1 fw-bold">
                        {(salesSummaryToday.cashTotal ?? 0).toLocaleString()} LKR
                      </h4>
                      <p className="text-muted mb-0 fs-12">Cash Total</p>
                    </div>
                  </div>
                </div>

                {/* Card Total Card */}
                <div className="col-12 col-sm-6 col-lg-3">
                  <div
                    className="card"
                    style={{
                      background: "rgba(234, 77, 77, 0.1)",
                      borderRadius: "12px",
                      border: "1px solid rgba(234, 77, 77, 0.2)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="avatar avatar-md bg-light-danger">
                          <FiCreditCard size={20} className="text-danger" />
                        </div>
                      </div>
                      <h4 className="mb-1 fw-bold">
                        {(salesSummaryToday.cardTotal ?? 0).toLocaleString()} LKR
                      </h4>
                      <p className="text-muted mb-0 fs-12">Card Total</p>
                    </div>
                  </div>
                </div>

                {/* Average Sales per Receipt Card */}
                <div className="col-12 col-sm-6 col-lg-3">
                  <div
                    className="card"
                    style={{
                      background: "rgba(255, 87, 34, 0.1)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 87, 34, 0.2)",
                    }}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="avatar avatar-md bg-light-warning">
                          <FiDollarSign size={20} className="text-warning" />
                        </div>
                      </div>
                      <h4 className="mb-1 fw-bold">
                        {salesSummaryToday.totalReceiptsToday > 0
                          ? (
                              salesSummaryToday.totalSalesToday /
                              salesSummaryToday.totalReceiptsToday
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "0.00"}{" "}
                        LKR
                      </h4>
                      <p className="text-muted mb-0 fs-12">Avg. per Receipt</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Trend Chart */}
          <div className="col-12 col-lg-8 mb-4">
            <div className="card">
              <div className="card-header">
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="card-title mb-0">Trend</h5>
                    <Dropdown
                      dropdownItems={
                        [
                          {
                            label: "Download as SVG",
                            icon: <FiDownload />,
                            onClick: () => handleChartExport("SVG"),
                          },
                          {
                            label: "Download as PNG",
                            icon: <FiDownload />,
                            onClick: () => handleChartExport("PNG"),
                          },
                          {
                            label: "Download as CSV",
                            icon: <FiDownload />,
                            onClick: () => handleChartExport("CSV"),
                          },
                        ] as any
                      }
                      triggerPosition={"0, 12"}
                      triggerClass="btn btn-icon btn-light-brand p-1"
                      triggerIcon={<FiMoreVertical size={18} />}
                      triggerText=""
                      isAvatar={false}
                      dropdownAutoClose={true}
                      dropdownParentStyle=""
                      tooltipTitle=""
                      dropdownMenuStyle=""
                      iconStrokeWidth={1.7}
                      isItemIcon={true}
                      onClick={() => {}}
                      active=""
                      id=""
                    />
                  </div>
                  <div className="d-flex align-items-center gap-2 w-100 w-sm-auto">
                    <label
                      className="form-label mb-0 d-none d-sm-block"
                      style={{ whiteSpace: "nowrap", fontSize: "14px" }}
                    >
                      Year:
                    </label>
                    <select
                      className="form-select form-select-sm"
                      style={{
                        minWidth: "120px",
                        width: "100%",
                        maxWidth: "180px",
                      }}
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                    >
                      {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - i
                      ).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                  }}
                >
                  {revenueTrend.length > 0 ? (
                    <div style={{ minWidth: "100%" }}>
                      <Chart
                        key={chartKey}
                        options={revenueChartOptions}
                        series={revenueChartSeries}
                        type="area"
                        height={350}
                        ref={chartRef}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-muted">No revenue data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Month/Year Filter */}
          <div className="col-12 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Filter Options</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label">Month</label>
                    <select
                      className="form-select"
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {new Date(year, m - 1).toLocaleString("default", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Year</label>
                    <select
                      className="form-select"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                    >
                      {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - i
                      ).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Expenses Table */}
          <div className="col-12 col-lg-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  Supplier Expenses (
                  {new Date(year, month - 1).toLocaleString("default", {
                    month: "long",
                  })}{" "}
                  {year})
                </h5>
              </div>
              <div className="card-body p-0">
                {supplierExpenses.length > 0 ? (
                  <Table
                    data={supplierExpensesTableData}
                    columns={supplierExpensesColumns}
                  />
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted mb-0">
                      No supplier expenses data available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Most Selling Items Table */}
          <div className="col-12 col-lg-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  Most Selling Items (
                  {new Date(year, month - 1).toLocaleString("default", {
                    month: "long",
                  })}{" "}
                  {year})
                </h5>
              </div>
              <div className="card-body p-0">
                {mostSellingItems.length > 0 ? (
                  <Table
                    data={mostSellingItemsTableData}
                    columns={mostSellingItemsColumns}
                  />
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted mb-0">
                      No selling items data available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Modal */}
      {showReportModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Generate Finance Report</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowReportModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Report Type</label>
                  <select
                    className="form-select"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                  >
                    <option value="daily">Daily Report</option>
                    <option value="weekly">Weekly Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="yearly">Yearly Report</option>
                  </select>
                </div>

                {reportType === "daily" && (
                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                    />
                  </div>
                )}

                {reportType === "weekly" && (
                  <div className="mb-3">
                    <label className="form-label">Start Date (Monday)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                    />
                  </div>
                )}

                {reportType === "monthly" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Month</label>
                      <select
                        className="form-select"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (m) => (
                            <option key={m} value={m}>
                              {new Date(2000, m - 1).toLocaleString("default", {
                                month: "long",
                              })}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Year</label>
                      <select
                        className="form-select"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                      >
                        {Array.from(
                          { length: 5 },
                          (_, i) => new Date().getFullYear() - i
                        ).map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {reportType === "yearly" && (
                  <div className="mb-3">
                    <label className="form-label">Year</label>
                    <select
                      className="form-select"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                      {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - i
                      ).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiDownload className="me-2" />
                      Generate & Download
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Finance;
