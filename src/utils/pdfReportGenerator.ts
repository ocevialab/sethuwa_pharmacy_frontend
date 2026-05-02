import jsPDF from "jspdf";
import { FinanceReport } from "@/services/financeService";

export class PDFReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private lineHeight: number;

  constructor() {
    this.doc = new jsPDF("p", "mm", "a4");
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 15;
    this.currentY = this.margin;
    this.lineHeight = 7;
  }

  private addHeader(title: string, subtitle?: string) {
    // Pharmacy Name
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("THILANKA PHARMACY", this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    this.currentY += 8;

    // Pharmacy Info
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("SPC Franchise Osusala", this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    this.currentY += 5;
    this.doc.text(
      "Ambagaha Junction, Dharga Town",
      this.pageWidth / 2,
      this.currentY,
      { align: "center" }
    );
    this.currentY += 5;
    this.doc.text(
      "034 2274976 | Registration No.: KKK-663",
      this.pageWidth / 2,
      this.currentY,
      { align: "center" }
    );
    this.currentY += 8;

    // Divider
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margin,
      this.currentY,
      this.pageWidth - this.margin,
      this.currentY
    );
    this.currentY += 8;

    // Report Title
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    this.currentY += 6;

    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(subtitle, this.pageWidth / 2, this.currentY, {
        align: "center",
      });
      this.currentY += 6;
    }

    // Generated At
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "italic");
    const generatedAt = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    this.doc.text(
      `Generated: ${generatedAt}`,
      this.pageWidth / 2,
      this.currentY,
      { align: "center" }
    );
    this.currentY += 10;
  }

  private addSection(title: string) {
    if (this.currentY > this.pageHeight - 40) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 6;
    this.doc.setLineWidth(0.3);
    this.doc.line(
      this.margin,
      this.currentY,
      this.pageWidth - this.margin,
      this.currentY
    );
    this.currentY += 5;
  }

  private addKeyValue(
    key: string,
    value: string | number,
    x: number = this.margin
  ) {
    if (this.currentY > this.pageHeight - 20) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(`${key}:`, x, this.currentY);

    this.doc.setFont("helvetica", "normal");
    const valueStr =
      typeof value === "number"
        ? value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : value;
    this.doc.text(valueStr, x + 50, this.currentY);
    this.currentY += this.lineHeight;
  }

  private addTable(
    headers: string[],
    rows: string[][],
    columnWidths: number[]
  ) {
    if (this.currentY > this.pageHeight - 40) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    const startX = this.margin;
    let x = startX;

    // Table Header
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(
      startX,
      this.currentY - 5,
      this.pageWidth - 2 * this.margin,
      8,
      "F"
    );

    headers.forEach((header, index) => {
      this.doc.text(header, x + columnWidths[index] / 2, this.currentY, {
        align: "center",
      });
      x += columnWidths[index];
    });
    this.currentY += 8;

    // Table Rows
    this.doc.setFont("helvetica", "normal");
    rows.forEach((row) => {
      if (this.currentY > this.pageHeight - 20) {
        this.doc.addPage();
        this.currentY = this.margin;
        // Redraw header on new page
        this.doc.setFont("helvetica", "bold");
        this.doc.setFillColor(240, 240, 240);
        this.doc.rect(
          startX,
          this.currentY - 5,
          this.pageWidth - 2 * this.margin,
          8,
          "F"
        );
        x = startX;
        headers.forEach((header, index) => {
          this.doc.text(header, x + columnWidths[index] / 2, this.currentY, {
            align: "center",
          });
          x += columnWidths[index];
        });
        this.currentY += 8;
        this.doc.setFont("helvetica", "normal");
      }

      x = startX;
      row.forEach((cell, index) => {
        this.doc.text(cell, x + columnWidths[index] / 2, this.currentY, {
          align: "center",
        });
        x += columnWidths[index];
      });
      this.currentY += 6;
    });
    this.currentY += 3;
  }

  private formatCurrency(amount: number): string {
    return `${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} LKR`;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  generateReport(report: FinanceReport) {
    // Determine title and subtitle based on report type
    let title = "";
    let subtitle = "";

    switch (report.reportType) {
      case "daily":
        title = "Daily Finance Report";
        subtitle = this.formatDate(report.startDate);
        break;
      case "weekly":
        title = "Weekly Finance Report";
        subtitle = `${this.formatDate(report.startDate)} - ${this.formatDate(
          report.endDate
        )}`;
        break;
      case "monthly":
        title = "Monthly Finance Report";
        const monthDate = new Date(report.startDate);
        subtitle = monthDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        break;
      case "yearly":
        title = "Yearly Finance Report";
        const yearDate = new Date(report.startDate);
        subtitle = yearDate.getFullYear().toString();
        break;
    }

    this.addHeader(title, subtitle);

    // Financial Summary Section
    this.addSection("Financial Summary");
    const summary = report.financialSummary;
    this.addKeyValue(
      "Total Revenue",
      this.formatCurrency(summary.totalRevenue)
    );
    this.addKeyValue(
      "Total Cost of Goods Sold",
      this.formatCurrency(summary.totalCostOfGoodsSold)
    );
    this.addKeyValue("Gross Profit", this.formatCurrency(summary.grossProfit));
    this.addKeyValue(
      "Gross Profit Margin",
      `${summary.grossProfitMargin.toFixed(2)}%`
    );
    this.addKeyValue(
      "Total Purchase Expenses",
      this.formatCurrency(summary.totalPurchaseExpenses)
    );
    this.addKeyValue("Net Profit", this.formatCurrency(summary.netProfit));
    this.addKeyValue("Total Sales Count", summary.totalSalesCount);
    this.addKeyValue("Total Purchase Count", summary.totalPurchaseCount);
    this.currentY += 3;

    // Revenue Details Section
    this.addSection("Revenue Details");
    const revenue = report.revenueDetails;
    this.addKeyValue(
      "Total Revenue",
      this.formatCurrency(revenue.totalRevenue)
    );
    this.addKeyValue(
      "Total Discounts",
      this.formatCurrency(revenue.totalDiscounts)
    );
    this.addKeyValue(
      "Total Rounding Discounts",
      this.formatCurrency(revenue.totalRoundingDiscounts)
    );
    this.addKeyValue("Net Revenue", this.formatCurrency(revenue.netRevenue));
    this.addKeyValue("Paid Sales Count", revenue.paidSalesCount);
    this.addKeyValue("Unpaid Sales Count", revenue.unpaidSalesCount);
    this.currentY += 3;

    // Purchase Details Section
    this.addSection("Purchase Details");
    const purchase = report.purchaseDetails;
    this.addKeyValue(
      "Total Purchase Amount",
      this.formatCurrency(purchase.totalPurchaseAmount)
    );
    this.addKeyValue("Total Purchase Count", purchase.totalPurchaseCount);
    this.addKeyValue(
      "Paid Purchases Amount",
      this.formatCurrency(purchase.paidPurchasesAmount)
    );
    this.addKeyValue("Paid Purchases Count", purchase.paidPurchasesCount);
    this.addKeyValue(
      "Unpaid Purchases Amount",
      this.formatCurrency(purchase.unpaidPurchasesAmount)
    );
    this.addKeyValue("Unpaid Purchases Count", purchase.unpaidPurchasesCount);
    this.currentY += 3;

    // Payment Method Breakdown
    this.addSection("Payment Method Breakdown");
    const payment = report.paymentMethodBreakdown;
    this.addKeyValue("Cash Amount", this.formatCurrency(payment.cashAmount));
    this.addKeyValue("Cash Count", payment.cashCount);
    this.addKeyValue("Card Amount", this.formatCurrency(payment.cardAmount));
    this.addKeyValue("Card Count", payment.cardCount);
    this.addKeyValue("Bank Amount", this.formatCurrency(payment.bankAmount));
    this.addKeyValue("Bank Count", payment.bankCount);
    this.addKeyValue(
      "Pay Later Amount",
      this.formatCurrency(payment.payLaterAmount)
    );
    this.addKeyValue("Pay Later Count", payment.payLaterCount);
    this.currentY += 3;

    // Unpaid Purchases
    this.addSection("Unpaid Purchases");
    const unpaid = report.unpaidPurchases;
    this.addKeyValue("Pending Count", unpaid.pending.count);
    this.addKeyValue(
      "Pending Amount",
      this.formatCurrency(unpaid.pending.amount)
    );
    this.addKeyValue("Overdue Count", unpaid.overdue.count);
    this.addKeyValue(
      "Overdue Amount",
      this.formatCurrency(unpaid.overdue.amount)
    );
    this.addKeyValue("Total Count", unpaid.total.count);
    this.addKeyValue("Total Amount", this.formatCurrency(unpaid.total.amount));
    this.currentY += 3;

    // Top Selling Items
    if (report.topSellingItems && report.topSellingItems.length > 0) {
      this.addSection("Top Selling Items");
      const headers = ["#", "Product Name", "Quantity Sold", "Revenue"];
      const rows = report.topSellingItems
        .slice(0, 20)
        .map((item, index) => [
          (index + 1).toString(),
          item.productName,
          item.totalQuantitySold.toString(),
          this.formatCurrency(item.totalRevenue),
        ]);
      const columnWidths = [15, 80, 40, 55];
      this.addTable(headers, rows, columnWidths);
    }

    // Supplier Expenses
    if (report.supplierExpenses && report.supplierExpenses.length > 0) {
      this.addSection("Supplier Expenses");
      const headers = ["#", "Supplier Name", "Total Expense", "Invoice Count"];
      const rows = report.supplierExpenses.map((expense, index) => [
        (index + 1).toString(),
        expense.supplierName,
        this.formatCurrency(expense.totalExpense),
        expense.invoiceCount.toString(),
      ]);
      const columnWidths = [15, 100, 50, 25];
      this.addTable(headers, rows, columnWidths);
    }

    // Footer
    this.currentY = this.pageHeight - 15;
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "italic");
    this.doc.text(
      "This is a computer-generated report.",
      this.pageWidth / 2,
      this.currentY,
      { align: "center" }
    );
    this.currentY += 4;
    this.doc.text(
      "For any discrepancies, please contact the administrator.",
      this.pageWidth / 2,
      this.currentY,
      { align: "center" }
    );

    return this.doc;
  }

  download(filename: string) {
    this.doc.save(filename);
  }

  print() {
    // Open PDF in new window for printing
    const pdfBlob = this.doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  // Generate PDF bill for a receipt
  generateReceiptBill(
    receipt: {
      receiptNumber: string;
      date: string;
      time: string;
      saleStatus: string;
      paymentMethod: string | null;
      totalAmount: number;
      finalAmountDue: number;
      customerDiscountPercent: number;
      roundingDiscount: number;
      issuedBy: string;
      customerName: string | null;
      items: Array<{
        productName: string;
        productSku: string;
        quantity: number;
        price: number;
        subTotal: number;
      }>;
      contactNumber?: string;
      emailAddress?: string;
    },
    receivedAmount?: number
  ) {
    // Reset document
    this.doc = new jsPDF("p", "mm", "a4");
    this.currentY = this.margin;

    // Header
    this.addHeader("INVOICE", `Receipt #${receipt.receiptNumber}`);

    // Receipt Information
    this.addSection("Receipt Information");
    this.addKeyValue("Receipt Number", receipt.receiptNumber);
    this.addKeyValue("Date", this.formatDate(receipt.date));
    this.addKeyValue("Time", receipt.time);
    this.addKeyValue("Status", receipt.saleStatus);
    this.addKeyValue("Issued By", receipt.issuedBy);
    if (receipt.customerName) {
      this.addKeyValue("Customer Name", receipt.customerName);
    }
    if (receipt.contactNumber) {
      this.addKeyValue("Contact Number", receipt.contactNumber);
    }
    if (receipt.emailAddress) {
      this.addKeyValue("Email Address", receipt.emailAddress);
    }
    this.currentY += 3;

    // Items Section
    this.addSection("Items");
    const headers = ["#", "Product Name", "SKU", "Qty", "Price", "Subtotal"];
    const columnWidths = [10, 70, 30, 20, 30, 30];
    const rows = receipt.items.map((item, index) => [
      (index + 1).toString(),
      item.productName,
      item.productSku,
      item.quantity.toString(),
      this.formatCurrency(item.price),
      this.formatCurrency(item.subTotal),
    ]);
    this.addTable(headers, rows, columnWidths);

    // Totals Section
    this.addSection("Totals");
    const grossTotal = receipt.totalAmount;
    const customerDiscount =
      receipt.customerDiscountPercent > 0
        ? (grossTotal * receipt.customerDiscountPercent) / 100
        : 0;
    const roundingDiscount = receipt.roundingDiscount || 0;
    const totalDiscount = customerDiscount + roundingDiscount;
    const grandTotal = grossTotal - totalDiscount;

    this.addKeyValue("Gross Total", this.formatCurrency(grossTotal));
    if (customerDiscount > 0) {
      this.addKeyValue(
        `Customer Discount (${receipt.customerDiscountPercent}%)`,
        this.formatCurrency(customerDiscount)
      );
    }
    if (roundingDiscount > 0) {
      this.addKeyValue(
        "Rounding Discount",
        this.formatCurrency(roundingDiscount)
      );
    }
    if (totalDiscount > 0) {
      this.addKeyValue("Total Discount", this.formatCurrency(totalDiscount));
    }
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Grand Total", this.margin, this.currentY);
    this.doc.text(
      this.formatCurrency(grandTotal),
      this.pageWidth - this.margin,
      this.currentY,
      { align: "right" }
    );
    this.currentY += 8;

    // Payment Information
    if (receipt.paymentMethod && receipt.saleStatus === "Paid") {
      this.addSection("Payment Information");
      this.addKeyValue("Payment Method", receipt.paymentMethod);
      const paidAmount = receivedAmount || grandTotal;
      this.addKeyValue("Paid Amount", this.formatCurrency(paidAmount));
      const change = paidAmount - grandTotal;
      if (change > 0) {
        this.addKeyValue("Change", this.formatCurrency(change));
      }
      this.currentY += 3;
    } else if (receipt.paymentMethod === "PayLater") {
      this.addSection("Payment Information");
      this.addKeyValue("Payment Method", "Pay Later");
      this.addKeyValue(
        "Amount Due",
        this.formatCurrency(receipt.finalAmountDue)
      );
      this.currentY += 3;
    }

    // Footer
    this.currentY = this.pageHeight - 20;
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "italic");
    if (receipt.customerName) {
      this.doc.text(
        `Thank You ${receipt.customerName}!`,
        this.pageWidth / 2,
        this.currentY,
        { align: "center" }
      );
      this.currentY += 5;
    }
    this.doc.text("Wish you good health.", this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    this.currentY += 4;
    this.doc.text("*No returns on Items*", this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    this.currentY += 4;
    this.doc.text(
      "Developed by Ocevia Lab PVT LTD",
      this.pageWidth / 2,
      this.currentY,
      { align: "center" }
    );

    return this.doc;
  }
}
