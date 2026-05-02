import { apiService } from "./api";
import { API_ENDPOINTS } from "@/utils/constants";

export interface RevenueTrendData {
  month?: string;
  year?: number;
  revenue: number;
  costOfSold: number;
  grossProfit: number;
}

export interface RevenueTrendResponse {
  period: "monthly" | "yearly";
  year?: number;
  startYear?: number;
  endYear?: number;
  data: RevenueTrendData[];
}

export interface SupplierExpense {
  supplierName: string;
  totalExpense: number;
  invoiceCount: number;
}

export interface SupplierExpensesResponse {
  period: "monthly" | "yearly";
  month?: number;
  year?: number;
  startYear?: number;
  endYear?: number;
  data: SupplierExpense[];
}

export interface MostSellingItem {
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface MostSellingItemsResponse {
  period: "monthly" | "yearly";
  month?: number;
  year?: number;
  startYear?: number;
  endYear?: number;
  data: MostSellingItem[];
}

export interface UnpaidPurchases {
  pending: {
    count: number;
    amount: number;
  };
  overdue: {
    count: number;
    amount: number;
  };
  total: {
    count: number;
    amount: number;
  };
}

export interface FinanceSummaryResponse {
  period: string;
  month?: number;
  year?: number;
  startYear?: number;
  endYear?: number;
  summary: {
    totalRevenue: number;
    costOfSold: number;
    grossProfit: number;
    pendingPayments: number;
    unpaidPurchases: UnpaidPurchases;
  };
}

// Interface for backward compatibility (extracted from summary)
export interface FinanceSummary {
  totalRevenue: number;
  costOfSold: number;
  grossProfit: number;
  pendingPayments: number;
  unpaidPurchases?: UnpaidPurchases;
}

// Report Interfaces
export interface DailyBreakdown {
  date: string;
  revenue?: number;
  salesCount?: number;
  amount?: number;
  count?: number;
}

export interface RevenueDetails {
  totalRevenue: number;
  totalDiscounts: number;
  totalRoundingDiscounts: number;
  netRevenue: number;
  paidSalesCount: number;
  unpaidSalesCount: number;
  dailyBreakdown: DailyBreakdown[];
}

export interface PurchaseDetails {
  totalPurchaseAmount: number;
  totalPurchaseCount: number;
  paidPurchasesAmount: number;
  paidPurchasesCount: number;
  unpaidPurchasesAmount: number;
  unpaidPurchasesCount: number;
  dailyBreakdown: DailyBreakdown[];
}

export interface FinancialSummary {
  totalRevenue: number;
  totalCostOfGoodsSold: number;
  grossProfit: number;
  grossProfitMargin: number;
  totalPurchaseExpenses: number;
  netProfit: number;
  totalSalesCount: number;
  totalPurchaseCount: number;
}

export interface PaymentMethodBreakdown {
  cashAmount: number;
  cashCount: number;
  cardAmount: number;
  cardCount: number;
  bankAmount: number;
  bankCount: number;
  payLaterAmount: number;
  payLaterCount: number;
  otherAmount: number;
  otherCount: number;
}

export interface FinanceReport {
  reportType: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate: string;
  generatedAt: string;
  financialSummary: FinancialSummary;
  revenueDetails: RevenueDetails;
  purchaseDetails: PurchaseDetails;
  topSellingItems: MostSellingItem[];
  supplierExpenses: SupplierExpense[];
  paymentMethodBreakdown: PaymentMethodBreakdown;
  unpaidPurchases: UnpaidPurchases;
}

class FinanceService {
  async getRevenueTrend(
    year: number,
    period: "monthly" | "yearly" = "monthly",
    startYear?: number,
    endYear?: number
  ): Promise<RevenueTrendData[]> {
    try {
      const data = await apiService.get<RevenueTrendResponse>(
        API_ENDPOINTS.FINANCE.REVENUE_TREND(period, year, startYear, endYear)
      );
      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch revenue trend data");
    }
  }

  async getSupplierExpenses(
    month: number,
    year: number,
    period: "monthly" | "yearly" = "monthly",
    startYear?: number,
    endYear?: number
  ): Promise<SupplierExpense[]> {
    try {
      const data = await apiService.get<SupplierExpensesResponse>(
        API_ENDPOINTS.FINANCE.SUPPLIER_EXPENSES(
          period,
          month,
          year,
          startYear,
          endYear
        )
      );
      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch supplier expenses");
    }
  }

  async getMostSellingItems(
    month: number,
    year: number,
    period: "monthly" | "yearly" = "monthly",
    startYear?: number,
    endYear?: number
  ): Promise<MostSellingItem[]> {
    try {
      const data = await apiService.get<MostSellingItemsResponse>(
        API_ENDPOINTS.FINANCE.MOST_SELLING_ITEMS(
          period,
          month,
          year,
          startYear,
          endYear
        )
      );
      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch most selling items");
    }
  }

  async getSummary(
    month: number,
    year: number,
    period: "monthly" | "yearly" = "monthly",
    startYear?: number,
    endYear?: number
  ): Promise<FinanceSummary> {
    try {
      const data = await apiService.get<FinanceSummaryResponse>(
        API_ENDPOINTS.FINANCE.SUMMARY(period, month, year, startYear, endYear)
      );
      // Extract summary from response and return in legacy format
      return {
        totalRevenue: data.summary.totalRevenue,
        costOfSold: data.summary.costOfSold,
        grossProfit: data.summary.grossProfit,
        pendingPayments: data.summary.pendingPayments,
        unpaidPurchases: data.summary.unpaidPurchases,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch finance summary");
    }
  }

  // Report Methods
  async getDailyReport(date?: string): Promise<FinanceReport> {
    try {
      const data = await apiService.get<FinanceReport>(
        API_ENDPOINTS.FINANCE.DAILY_REPORT(date)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch daily report");
    }
  }

  async getWeeklyReport(startDate?: string): Promise<FinanceReport> {
    try {
      const data = await apiService.get<FinanceReport>(
        API_ENDPOINTS.FINANCE.WEEKLY_REPORT(startDate)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch weekly report");
    }
  }

  async getMonthlyReport(month: number, year: number): Promise<FinanceReport> {
    try {
      const data = await apiService.get<FinanceReport>(
        API_ENDPOINTS.FINANCE.MONTHLY_REPORT(month, year)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch monthly report");
    }
  }

  async getYearlyReport(year: number): Promise<FinanceReport> {
    try {
      const data = await apiService.get<FinanceReport>(
        API_ENDPOINTS.FINANCE.YEARLY_REPORT(year)
      );
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to fetch yearly report");
    }
  }
}

export const financeService = new FinanceService();
