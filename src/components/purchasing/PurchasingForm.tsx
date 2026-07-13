import React, { useState, FormEvent, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  purchasingService,
  CreatePurchaseRequest,
  PurchaseItem,
  Purchase,
} from "@/services/purchasingService";
import { inventoryService, InventoryItem } from "@/services/inventoryService";
import BarcodeLabelActions from "@/components/medicine/BarcodeLabelActions";
import BarcodeInput from "@/components/shared/BarcodeInput";
import {
  supplierService,
  SupplierSearchResult,
} from "@/services/supplierService";
import Swal from "sweetalert2";
import {
  FiShoppingCart,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiX,
  FiPrinter,
  FiCheckCircle,
} from "react-icons/fi";

interface PurchasingFormProps {
  onSuccess?: () => void;
}

const STORAGE_KEY = "purchasing_form_draft";

const PurchasingForm: React.FC<PurchasingFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();

  // Helper function to get initial form data (either from localStorage or defaults)
  const getInitialFormData = (): Omit<CreatePurchaseRequest, "items"> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) {
          return parsed.formData;
        }
      }
    } catch (error) {
      console.error("Error loading form data from localStorage:", error);
    }
    return {
      invoiceNumber: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      paymentStatus: "Pending",
      paymentDueDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Bank Transfer",
      totalAmount: 0,
      supplierId: "",
    };
  };

  const [formData, setFormData] = useState<
    Omit<CreatePurchaseRequest, "items">
  >(getInitialFormData());

  // Helper function to get initial items (either from localStorage or empty array)
  const getInitialItems = (): PurchaseItem[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items)) {
          return parsed.items;
        }
      }
    } catch (error) {
      console.error("Error loading items from localStorage:", error);
    }
    return [];
  };

  const [items, setItems] = useState<PurchaseItem[]>(getInitialItems());

  // Current item being added (input form)
  const [currentItem, setCurrentItem] = useState<PurchaseItem>({
    productSKU: "",
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    expireDate: new Date().toISOString().split("T")[0],
  });

  // Search state for current item
  const [currentItemSearch, setCurrentItemSearch] = useState<{
    query: string;
    results: InventoryItem[];
    showDropdown: boolean;
    selectedProduct: InventoryItem | null;
  }>({
    query: "",
    results: [],
    showDropdown: false,
    selectedProduct: null,
  });

  const currentItemSearchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const currentItemDropdownRef = useRef<HTMLDivElement | null>(null);

  // Helper function to get initial supplier search state
  const getInitialSupplierSearch = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          query: parsed.supplierQuery || "",
          results: [],
          showDropdown: false,
          selectedSupplier: parsed.selectedSupplier || null,
        };
      }
    } catch (error) {
      console.error("Error loading supplier search from localStorage:", error);
    }
    return {
      query: "",
      results: [],
      showDropdown: false,
      selectedSupplier: null,
    };
  };

  // Supplier search state
  const [supplierSearch, setSupplierSearch] = useState<{
    query: string;
    results: SupplierSearchResult[];
    showDropdown: boolean;
    selectedSupplier: SupplierSearchResult | null;
  }>(getInitialSupplierSearch());

  const supplierSearchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const supplierDropdownRef = useRef<HTMLDivElement | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [createdPurchase, setCreatedPurchase] = useState<Purchase | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [submittedPurchaseData, setSubmittedPurchaseData] =
    useState<CreatePurchaseRequest | null>(null);
  // Store supplier info and items before clearing form (for print receipt)
  const [savedSupplierInfo, setSavedSupplierInfo] = useState<SupplierSearchResult | null>(null);
  const [savedItems, setSavedItems] = useState<PurchaseItem[]>([]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = "Invoice number is required";
    }

    if (!formData.invoiceDate) {
      newErrors.invoiceDate = "Invoice date is required";
    }

    // Only require payment due date if payment status is Pending
    if (formData.paymentStatus === "Pending" && !formData.paymentDueDate) {
      newErrors.paymentDueDate = "Payment due date is required";
    }

    if (!formData.paymentMethod.trim()) {
      newErrors.paymentMethod = "Payment method is required";
    }

    if (!formData.supplierId.trim()) {
      newErrors.supplierId = "Supplier ID is required";
    }

    if (items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalAmount = (itemsArray?: PurchaseItem[]) => {
    const itemsToCalculate = itemsArray || items;
    const total = itemsToCalculate.reduce(
      (sum, item) => sum + item.costPrice * item.quantity,
      0
    );
    setFormData((prev) => ({ ...prev, totalAmount: total }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Remove productName before sending to API (it's only for UI display)
      // Set paymentDueDate based on payment status:
      // - Pending: use selected payment due date
      // - Complete: use current date
      // - Overdue: null
      const purchaseData: CreatePurchaseRequest = {
        ...formData,
        paymentDueDate:
          formData.paymentStatus === "Pending"
            ? formData.paymentDueDate
            : formData.paymentStatus === "Complete"
            ? new Date().toISOString().split("T")[0]
            : null,
        items: items.map(({ productName, ...item }) => item),
      };

      // Keep a snapshot of what we submitted for display/print fallbacks
      setSubmittedPurchaseData(purchaseData);

      const createdPurchaseData = await purchasingService.createPurchase(
        purchaseData
      );
      
      // Store supplier info and items BEFORE showing modal (for print receipt)
      setSavedSupplierInfo(supplierSearch.selectedSupplier);
      setSavedItems([...items]);
      
      setCreatedPurchase(createdPurchaseData);
      // Don't clear form data here - let it be cleared when modal closes or cancel is clicked
      setShowPrintModal(true);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error ? error.message : "Failed to save purchase",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // If payment status changes and it's not "Pending", clear payment due date
    if (name === "paymentStatus") {
      setFormData((prev) => ({
        ...prev,
        [name]: value as "Complete" | "Pending" | "Overdue",
        paymentDueDate: value === "Pending" ? prev.paymentDueDate : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "totalAmount" ? parseFloat(value) || 0 : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setItems(newItems);
    calculateTotalAmount(newItems);

    const errorKey = `item_${index}_${String(field)}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Search products for current item
  const handleCurrentItemProductSearch = async (query: string) => {
    setCurrentItemSearch((prev) => ({
      ...prev,
      query,
      showDropdown: query.length > 0,
    }));

    // Clear previous timeout
    if (currentItemSearchTimeoutRef.current) {
      clearTimeout(currentItemSearchTimeoutRef.current);
    }

    // Don't search if query is too short
    if (query.trim().length < 2) {
      setCurrentItemSearch((prev) => ({
        ...prev,
        results: [],
        showDropdown: false,
      }));
      return;
    }

    // Debounce search
    currentItemSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await inventoryService.getInventoryList({
          page: 1,
          pageSize: 20,
          q: query.trim(),
        });
        setCurrentItemSearch((prev) => ({
          ...prev,
          results: response.data,
          showDropdown: response.data.length > 0,
        }));
      } catch (error) {
        console.error("Error searching products:", error);
        setCurrentItemSearch((prev) => ({
          ...prev,
          results: [],
          showDropdown: false,
        }));
      }
    }, 300);
  };

  // Handle current item product selection
  const handleCurrentItemProductSelect = (product: InventoryItem) => {
    setCurrentItem((prev: PurchaseItem) => ({
      ...prev,
      productSKU: product.productSku,
      sellingPrice: product.unitPrice || 0,
    }));

    setCurrentItemSearch({
      query: product.name,
      results: [],
      showDropdown: false,
      selectedProduct: product,
    });
  };

  // Search suppliers
  const handleSupplierSearch = async (query: string) => {
    setSupplierSearch((prev) => ({
      ...prev,
      query,
      showDropdown: query.length > 0,
    }));

    // Clear previous timeout
    if (supplierSearchTimeoutRef.current) {
      clearTimeout(supplierSearchTimeoutRef.current);
    }

    // Don't search if query is too short
    if (query.trim().length < 2) {
      setSupplierSearch((prev) => ({
        ...prev,
        results: [],
        showDropdown: false,
      }));
      return;
    }

    // Debounce search
    supplierSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await supplierService.searchSuppliers(query.trim(), 20);
        setSupplierSearch((prev) => ({
          ...prev,
          results,
          showDropdown: results.length > 0,
        }));
      } catch (error) {
        console.error("Error searching suppliers:", error);
        setSupplierSearch((prev) => ({
          ...prev,
          results: [],
          showDropdown: false,
        }));
      }
    }, 300);
  };

  // Handle supplier selection
  const handleSupplierSelect = (supplier: SupplierSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      supplierId: supplier.supplierId,
    }));

    setSupplierSearch({
      query: supplier.supplierName,
      results: [],
      showDropdown: false,
      selectedSupplier: supplier,
    });

    // Clear supplier error if any
    if (errors.supplierId) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.supplierId;
        return newErrors;
      });
    }
  };

  // Handle current item field changes
  const handleCurrentItemChange = (
    field: keyof PurchaseItem,
    value: string | number
  ) => {
    setCurrentItem((prev: PurchaseItem) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add current item to items list
  const addCurrentItemToList = () => {
    if (!currentItem.productSKU.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Product Required",
        text: "Please select a product",
      });
      return;
    }
    if (currentItem.costPrice <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Cost Price Required",
        text: "Cost price must be greater than 0",
      });
      return;
    }
    if (currentItem.sellingPrice <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Selling Price Required",
        text: "Selling price must be greater than 0",
      });
      return;
    }
    if (currentItem.quantity <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Quantity Required",
        text: "Quantity must be greater than 0",
      });
      return;
    }
    if (!currentItem.expireDate) {
      Swal.fire({
        icon: "warning",
        title: "Expire Date Required",
        text: "Please select an expire date",
      });
      return;
    }

    // Add product name from selected product
    const itemToAdd: PurchaseItem = {
      ...currentItem,
      productName:
        currentItemSearch.selectedProduct?.name || currentItem.productSKU,
    };

    const newItems = [...items, itemToAdd];
    setItems(newItems);
    calculateTotalAmount(newItems);

    // Reset current item
    setCurrentItem({
      productSKU: "",
      costPrice: 0,
      sellingPrice: 0,
      quantity: 0,
      expireDate: new Date().toISOString().split("T")[0],
    });
    setCurrentItemSearch({
      query: "",
      results: [],
      showDropdown: false,
      selectedProduct: null,
    });
  };

  // Restore supplierId from selectedSupplier on mount if formData doesn't have it
  useEffect(() => {
    if (
      supplierSearch.selectedSupplier &&
      supplierSearch.selectedSupplier.supplierId !== formData.supplierId
    ) {
      setFormData((prev) => ({
        ...prev,
        supplierId: supplierSearch.selectedSupplier!.supplierId,
      }));
    }
  }, []); // Only run on mount

  // Save form data to localStorage whenever formData, items, or supplierSearch changes
  useEffect(() => {
    try {
      const dataToSave = {
        formData,
        items,
        supplierQuery: supplierSearch.query,
        selectedSupplier: supplierSearch.selectedSupplier,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving form data to localStorage:", error);
    }
  }, [formData, items, supplierSearch.query, supplierSearch.selectedSupplier]);

  // Clear localStorage and reset form function
  const clearFormData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setFormData({
        invoiceNumber: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        paymentStatus: "Pending",
        paymentDueDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Bank Transfer",
        totalAmount: 0,
        supplierId: "",
      });
      setItems([]);
      setSupplierSearch({
        query: "",
        results: [],
        showDropdown: false,
        selectedSupplier: null,
      });
      setCurrentItem({
        productSKU: "",
        costPrice: 0,
        sellingPrice: 0,
        quantity: 0,
        expireDate: new Date().toISOString().split("T")[0],
      });
      setCurrentItemSearch({
        query: "",
        results: [],
        showDropdown: false,
        selectedProduct: null,
      });
      setErrors({});
      setSubmittedPurchaseData(null);
    } catch (error) {
      console.error("Error clearing form data:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currentItemDropdownRef.current &&
        !currentItemDropdownRef.current.contains(event.target as Node)
      ) {
        setCurrentItemSearch((prev) => ({
          ...prev,
          showDropdown: false,
        }));
      }
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target as Node)
      ) {
        setSupplierSearch((prev) => ({
          ...prev,
          showDropdown: false,
        }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calculateTotalAmount(newItems);
  };

  // Print purchase receipt function
  const printReceipt = () => {
    // Use savedSupplierInfo instead of supplierSearch.selectedSupplier
    if (!createdPurchase || !savedSupplierInfo) return;

    // Prefer API response; fallback to submitted data for fields the API may omit
    const invoiceNumber =
      createdPurchase.invoiceNumber ||
      submittedPurchaseData?.invoiceNumber ||
      "N/A";
    const invoiceDate =
      createdPurchase.invoiceDate || submittedPurchaseData?.invoiceDate;
    const paymentMethod =
      createdPurchase.paymentMethod ||
      submittedPurchaseData?.paymentMethod ||
      "N/A";
    const paymentStatus =
      createdPurchase.paymentStatus ||
      submittedPurchaseData?.paymentStatus ||
      "Pending";
    const totalAmount =
      createdPurchase.totalAmount ||
      submittedPurchaseData?.totalAmount ||
      0;
    const paymentDueDate =
      createdPurchase.paymentDueDate ||
      submittedPurchaseData?.paymentDueDate ||
      null;

    // Use saved items (which have productName) or from API response
    const printItems = savedItems.length > 0 ? savedItems : createdPurchase.purchaseItems || [];

    // Get current local date/time
    const now = new Date();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[now.getMonth()];
    const day = now.getDate().toString().padStart(2, "0");
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}:${seconds}`;
    const formattedDateTime = `${day} ${month} ${year} ${currentTime}`;
    const employeeName =
      localStorage.getItem("pharmacy_employee_name") || "Unknown Employee";

    // Format invoice date
    const invoiceDateObj = invoiceDate ? new Date(invoiceDate) : new Date();
    const invoiceDateFormatted = `${invoiceDateObj
      .getDate()
      .toString()
      .padStart(2, "0")} ${
      monthNames[invoiceDateObj.getMonth()]
    } ${invoiceDateObj.getFullYear()}`;

    // Create printable content
    const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Purchase ${invoiceNumber}</title>
                <style>
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 10px;
                            width: 80mm;
                            font-family: Arial, sans-serif;
                        }
                    }
                    body {
                        margin: 0;
                        padding: 10px;
                        width: 80mm;
                        font-family: Arial, sans-serif;
                        font-size: 18px;
                        text-align: center;
                    }
                    .receipt-container {
                        width: 100%;
                        max-width: 80mm;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    .pharmacy-name {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .pharmacy-info {
                        font-size: 15px;
                        line-height: 1.4;
                    }
                    .divider {
                        border-top: 1px solid #000;
                        margin: 10px 0;
                    }
                    .receipt-info {
                        text-align: center;
                        margin: 10px 0;
                        font-size: 14px;
                    }
                    .invoice-number {
                        font-weight: bold;
                        font-size: 15px;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                        font-size: 13px;
                    }
                    .items-table th {
                        text-align: center;
                        font-weight: bold;
                        padding: 5px 2px;
                        border-bottom: 1px solid #000;
                    }
                    .items-table td {
                        padding: 6px 2px;
                        vertical-align: top;
                    }
                    .items-table .col-ln {
                        width: 8%;
                        text-align: center;
                    }
                    .items-table .col-item {
                        width: 45%;
                        text-align: left;
                    }
                    .items-table .col-price {
                        width: 18%;
                        text-align: right;
                    }
                    .items-table .col-qty {
                        width: 12%;
                        text-align: right;
                    }
                    .items-table .col-amount {
                        width: 17%;
                        text-align: right;
                    }
                    .totals {
                        margin-top: 10px;
                        font-size: 14px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 3px 0;
                    }
                    .grand-total {
                        font-weight: bold;
                        font-size: 18px;
                        margin-top: 5px;
                        padding-top: 5px;
                        border-top: 1px solid #000;
                    }
                    .payment-info {
                        margin-top: 10px;
                        font-size: 14px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 15px;
                        font-size: 13px;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        <div class="pharmacy-name">SETHSUWA PHARMACY</div>
                        <div class="pharmacy-info">
                            No 47/A, Main Street, Kotiyakumbura<br>
                            035 2289351 | 078 20 20 157
                        </div>
                    </div>
                    <div class="divider"></div>
                    <div class="receipt-info">
                        ${formattedDateTime}<br>
                        <span class="invoice-number">Invoice Number: ${invoiceNumber}</span><br>
                        Invoice Date: ${invoiceDateFormatted}<br>
                        Issued By: ${employeeName}
                    </div>
                    <div class="divider"></div>
                    <div class="receipt-info" style="text-align: left; font-size: 13px;">
                        <strong>Supplier:</strong> ${
                          savedSupplierInfo.supplierName
                        }<br>
                        ${
                          savedSupplierInfo.contactNumber
                            ? `<strong>Contact:</strong> ${savedSupplierInfo.contactNumber}<br>`
                            : ""
                        }
                        ${
                          savedSupplierInfo.emailAddress
                            ? `<strong>Email:</strong> ${savedSupplierInfo.emailAddress}<br>`
                            : ""
                        }
                    </div>
                    <div class="divider"></div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th class="col-ln"></th>
                                <th class="col-item">Item</th>
                                <th class="col-price">Price</th>
                                <th class="col-qty">Qty</th>
                                <th class="col-amount">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${printItems
                              .map((item, index) => {
                                const quantity = item.quantity || 0;
                                const costPrice = item.costPrice || 0;
                                const subtotal = costPrice * quantity;
                                const productName =
                                  item.productName || item.productSKU || "N/A";
                                return `
                                <tr>
                                    <td class="col-ln">${index + 1}</td>
                                    <td class="col-item">${productName}</td>
                                    <td class="col-price">${costPrice.toFixed(
                                      2
                                    )}</td>
                                    <td class="col-qty">${quantity}</td>
                                    <td class="col-amount">${subtotal.toFixed(
                                      2
                                    )}</td>
                                </tr>
                              `;
                              })
                              .join("")}
                        </tbody>
                    </table>
                    <div class="divider"></div>
                    <div class="totals">
                        <div class="total-row grand-total">
                            <span>Total Amount (LKR):</span>
                            <span>${totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="payment-info">
                        <div class="total-row">
                            <span>Payment Status:</span>
                            <span>${paymentStatus}</span>
                        </div>
                        <div class="total-row">
                            <span>Payment Method:</span>
                            <span>${paymentMethod}</span>
                        </div>
                        ${
                          paymentDueDate
                            ? `
                            <div class="total-row">
                                <span>Payment Due Date:</span>
                                <span>${new Date(
                                  paymentDueDate
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}</span>
                            </div>
                        `
                            : ""
                        }
                    </div>
                    <div class="footer">
                        <div>Thank You!</div>
                        <div>Developed by Ocevia Lab PVT LTD</div>
                    </div>
                </div>
            </body>
            </html>
        `;

    // Create a hidden iframe for printing
    const printIframe = document.createElement("iframe");
    printIframe.style.display = "none";
    printIframe.style.width = "80mm";
    printIframe.style.height = "auto";
    printIframe.style.border = "none";
    document.body.appendChild(printIframe);
    const iframeDoc =
      printIframe.contentDocument || printIframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      // Wait for content to load, then trigger print
      printIframe.onload = () => {
        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (e) {
            console.error("Print failed:", e);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to print receipt. Please try again or check browser permissions.",
            });
          } finally {
            // Cleanup: remove iframe after a delay to allow print dialog to open
            setTimeout(() => {
              document.body.removeChild(printIframe);
            }, 1000);
          }
        }, 250);
      };
    } else {
      // Fallback if iframe document not accessible
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to access print frame. Please try again.",
      });
      document.body.removeChild(printIframe);
    }
  };

  const handlePrintModalClose = () => {
    setShowPrintModal(false);
    setCreatedPurchase(null);
    // Clear saved supplier info and items when modal closes
    setSavedSupplierInfo(null);
    setSavedItems([]);
    // Ensure form is cleared (in case user navigates back)
    clearFormData();
    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/purchasing/list");
    }
  };

  // Tab closes the print success modal
  useEffect(() => {
    if (!showPrintModal) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        handlePrintModalClose();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPrintModal]);

  return (
    <>
      <style>{`
        html.app-skin-dark .modal-content {
          background-color: #1b2436 !important;
          border-color: #2a3441 !important;
        }
        html.app-skin-dark .modal-header {
          border-bottom-color: #2a3441 !important;
        }
        html.app-skin-dark .modal-footer {
          border-top-color: #2a3441 !important;
        }
        html.app-skin-dark .modal-body {
          color: #b1b4c0 !important;
        }
        html.app-skin-dark .modal-title {
          color: #ffffff !important;
        }
      `}</style>
      <div className="col-lg-12">
        <div className="card">
          <div className="card-header">
            <div className="d-flex align-items-center gap-3 my-3">
              <div className="avatar avatar-md bg-light-primary">
                <FiShoppingCart size={18} className="text-primary" />
              </div>
              <div>
                <h5 className="card-title mb-1 fw-bold">Create New Purchase</h5>
                <p className="text-muted mb-0 fs-12">
                  Add a new purchase order to the system
                </p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row mb-4">
                <h6 className="mb-3">Invoice Information</h6>
                <div className="col-md-6 mb-3">
                  <label htmlFor="invoiceNumber" className="form-label">
                    Invoice Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="invoiceNumber"
                    name="invoiceNumber"
                    className={`form-control ${
                      errors.invoiceNumber ? "is-invalid" : ""
                    }`}
                    placeholder="Enter invoice number"
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {errors.invoiceNumber && (
                    <div className="invalid-feedback">
                      {errors.invoiceNumber}
                    </div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="invoiceDate" className="form-label">
                    Invoice Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    id="invoiceDate"
                    name="invoiceDate"
                    className={`form-control ${
                      errors.invoiceDate ? "is-invalid" : ""
                    }`}
                    value={formData.invoiceDate}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {errors.invoiceDate && (
                    <div className="invalid-feedback">{errors.invoiceDate}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label htmlFor="supplierId" className="form-label mb-0">
                      Supplier <span className="text-danger">*</span>
                    </label>
                    <Link
                      to="/supplier/create"
                      className="text-primary text-decoration-none font-sm"
                      style={{
                        fontSize: "12px",
                        opacity: 0.8,
                        paddingRight: "10px",
                      }}
                    >
                      Add Supplier
                    </Link>
                  </div>
                  <div className="position-relative" ref={supplierDropdownRef}>
                    <div className="position-relative">
                      <FiSearch
                        className="position-absolute"
                        style={{
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#64748b",
                          pointerEvents: "none",
                        }}
                        size={18}
                      />
                      <input
                        type="text"
                        className={`form-control ps-5 ${
                          errors.supplierId ? "is-invalid" : ""
                        }`}
                        placeholder="Search by supplier name..."
                        value={supplierSearch.query}
                        onChange={(e) => handleSupplierSearch(e.target.value)}
                        onFocus={() => {
                          if (supplierSearch.results.length > 0) {
                            setSupplierSearch((prev) => ({
                              ...prev,
                              showDropdown: true,
                            }));
                          }
                        }}
                        disabled={loading}
                        autoComplete="off"
                      />
                    </div>
                    {supplierSearch.showDropdown &&
                      supplierSearch.results.length > 0 && (
                        <div
                          className="dropdown-menu show position-absolute w-100"
                          style={{
                            maxHeight: "300px",
                            overflowY: "auto",
                            zIndex: 1000,
                            marginTop: "4px",
                          }}
                        >
                          {supplierSearch.results.map((supplier) => (
                            <button
                              key={supplier.supplierId}
                              type="button"
                              className="dropdown-item"
                              onClick={() => handleSupplierSelect(supplier)}
                              style={{ textAlign: "left" }}
                            >
                              <div>
                                <div className="fw-semibold">
                                  {supplier.supplierName}
                                </div>
                                <div className="text-muted small">
                                  ID: {supplier.supplierId}
                                  {supplier.contactNumber &&
                                    ` | ${supplier.contactNumber}`}
                                  {supplier.emailAddress &&
                                    ` | ${supplier.emailAddress}`}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    {supplierSearch.showDropdown &&
                      supplierSearch.results.length === 0 &&
                      supplierSearch.query.trim().length >= 2 && (
                        <div
                          className="dropdown-menu show position-absolute w-100"
                          style={{
                            zIndex: 1000,
                            marginTop: "4px",
                          }}
                        >
                          <div className="dropdown-item text-muted">
                            No suppliers found
                          </div>
                        </div>
                      )}
                  </div>
                  {errors.supplierId && (
                    <div className="invalid-feedback d-block">
                      {errors.supplierId}
                    </div>
                  )}
                  {supplierSearch.selectedSupplier && (
                    <small className="text-muted">
                      Selected: {supplierSearch.selectedSupplier.supplierName}{" "}
                      (ID: {formData.supplierId})
                    </small>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="paymentStatus" className="form-label">
                    Payment Status <span className="text-danger">*</span>
                  </label>
                  <select
                    id="paymentStatus"
                    name="paymentStatus"
                    className={`form-control ${
                      errors.paymentStatus ? "is-invalid" : ""
                    }`}
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                  {errors.paymentStatus && (
                    <div className="invalid-feedback">
                      {errors.paymentStatus}
                    </div>
                  )}
                </div>

                {formData.paymentStatus === "Pending" && (
                  <div className="col-md-6 mb-3">
                    <label htmlFor="paymentDueDate" className="form-label">
                      Payment Due Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="paymentDueDate"
                      name="paymentDueDate"
                      className={`form-control ${
                        errors.paymentDueDate ? "is-invalid" : ""
                      }`}
                      value={formData.paymentDueDate || ""}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    {errors.paymentDueDate && (
                      <div className="invalid-feedback">
                        {errors.paymentDueDate}
                      </div>
                    )}
                  </div>
                )}

                <div className="col-md-6 mb-3">
                  <label htmlFor="paymentMethod" className="form-label">
                    Payment Method <span className="text-danger">*</span>
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    className={`form-control ${
                      errors.paymentMethod ? "is-invalid" : ""
                    }`}
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select payment method</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                  </select>
                  {errors.paymentMethod && (
                    <div className="invalid-feedback">
                      {errors.paymentMethod}
                    </div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="totalAmount" className="form-label">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    id="totalAmount"
                    name="totalAmount"
                    className="form-control"
                    value={formData.totalAmount}
                    readOnly
                    disabled={loading}
                  />
                  <small className="text-muted">
                    Calculated automatically from items
                  </small>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="mb-3">Item Received</h6>

                  {/* Input Form Row */}
                  <div
                    className="card mb-4"
                    style={{ backgroundColor: "#e8f4f8" }}
                  >
                    <div className="card-body p-3">
                      <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0">
                              Product <span className="text-danger">*</span>
                            </label>
                            <Link
                              to="/medicine/create"
                              className="text-primary text-decoration-none"
                              style={{
                                fontSize: "12px",
                                opacity: 0.8,
                                paddingRight: "10px",
                              }}
                            >
                              Add Product
                            </Link>
                          </div>
                          <div
                            className="position-relative"
                            ref={(el) => {
                              currentItemDropdownRef.current = el;
                            }}
                          >
                            <div className="position-relative">
                              <FiSearch
                                className="position-absolute"
                                style={{
                                  left: "12px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  color: "#64748b",
                                  pointerEvents: "none",
                                  zIndex: 1,
                                }}
                                size={18}
                              />
                              <input
                                type="text"
                                className="form-control ps-5"
                                placeholder="eg: Panadol 500mg Tablets"
                                value={currentItemSearch.query}
                                onChange={(e) =>
                                  handleCurrentItemProductSearch(e.target.value)
                                }
                                onFocus={() => {
                                  if (currentItemSearch.results.length > 0) {
                                    setCurrentItemSearch((prev) => ({
                                      ...prev,
                                      showDropdown: true,
                                    }));
                                  }
                                }}
                                disabled={loading}
                                autoComplete="off"
                              />
                            </div>
                            {currentItemSearch.showDropdown &&
                              currentItemSearch.results.length > 0 && (
                                <div
                                  className="dropdown-menu show position-absolute w-100"
                                  style={{
                                    maxHeight: "300px",
                                    overflowY: "auto",
                                    zIndex: 1000,
                                    marginTop: "4px",
                                  }}
                                >
                                  {currentItemSearch.results.map((product) => (
                                    <button
                                      key={product.productSku}
                                      type="button"
                                      className="dropdown-item"
                                      onClick={() =>
                                        handleCurrentItemProductSelect(product)
                                      }
                                      style={{ textAlign: "left" }}
                                    >
                                      <div>
                                        <div className="fw-semibold">
                                          {product.name}
                                        </div>
                                        <div className="text-muted small">
                                          SKU: {product.productSku}
                                          {` | ${product.productType}`}
                                          {product.supplierSummary &&
                                            ` | Supplier: ${product.supplierSummary}`}
                                          {product.unitPrice > 0 &&
                                            ` | LKR ${product.unitPrice.toFixed(
                                              2
                                            )}`}
                                          {` | Stock: ${product.stock}`}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            {currentItemSearch.showDropdown &&
                              currentItemSearch.results.length === 0 &&
                              currentItemSearch.query.trim().length >= 2 && (
                                <div
                                  className="dropdown-menu show position-absolute w-100"
                                  style={{
                                    zIndex: 1000,
                                    marginTop: "4px",
                                  }}
                                >
                                  <div className="dropdown-item text-muted">
                                    No products found
                                  </div>
                                </div>
                              )}
                          </div>
                          {currentItemSearch.selectedProduct && (
                            <div className="mt-2">
                              <label className="form-label mb-1">Barcode</label>
                              <BarcodeInput
                                value={currentItemSearch.selectedProduct.barcode ?? ""}
                                onChange={(value) => {
                                  setCurrentItemSearch((prev) =>
                                    prev.selectedProduct
                                      ? {
                                          ...prev,
                                          selectedProduct: {
                                            ...prev.selectedProduct,
                                            barcode: value,
                                          },
                                        }
                                      : prev
                                  );
                                }}
                                placeholder="Scan or enter product barcode"
                                disabled={loading}
                              />
                              <BarcodeLabelActions
                                productSku={
                                  currentItemSearch.selectedProduct.productSku
                                }
                                medicineName={
                                  currentItemSearch.selectedProduct.name
                                }
                                barcode={
                                  currentItemSearch.selectedProduct.barcode
                                }
                                onBarcodeChange={(value) => {
                                  setCurrentItemSearch((prev) =>
                                    prev.selectedProduct
                                      ? {
                                          ...prev,
                                          selectedProduct: {
                                            ...prev.selectedProduct,
                                            barcode: value,
                                          },
                                        }
                                      : prev
                                  );
                                }}
                                disabled={loading}
                              />
                            </div>
                          )}
                        </div>

                        <div className="col-md-2">
                          <label className="form-label mb-1">
                            Selling Price (LKR){" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            placeholder="eg: 15.00"
                            value={currentItem.sellingPrice || ""}
                            onChange={(e) =>
                              handleCurrentItemChange(
                                "sellingPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={loading}
                          />
                        </div>

                        <div className="col-md-2">
                          <label className="form-label mb-1">
                            Cost Price (LKR){" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            placeholder="eg: 15.00"
                            value={currentItem.costPrice || ""}
                            onChange={(e) =>
                              handleCurrentItemChange(
                                "costPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            disabled={loading}
                          />
                        </div>

                        <div className="col-md-1">
                          <label className="form-label mb-1">
                            Quantity <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="eg: 100"
                            value={currentItem.quantity || ""}
                            onChange={(e) =>
                              handleCurrentItemChange(
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            disabled={loading}
                          />
                        </div>

                        <div className="col-md-2">
                          <label className="form-label mb-1">
                            Expire Date <span className="text-danger">*</span>
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={currentItem.expireDate}
                            onChange={(e) =>
                              handleCurrentItemChange(
                                "expireDate",
                                e.target.value
                              )
                            }
                            disabled={loading}
                          />
                        </div>

                        <div className="col-md-2 d-flex align-items-end">
                          <button
                            type="button"
                            className="btn btn-primary rounded-circle"
                            style={{
                              width: "50px",
                              height: "50px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#0d9488",
                              borderColor: "#0d9488",
                            }}
                            onClick={addCurrentItemToList}
                            disabled={loading}
                          >
                            <FiPlus size={24} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  {items.length > 0 && (
                    <>
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Cost Price (LKR)</th>
                              <th>Selling Price (LKR)</th>
                              <th>Quantity</th>
                              <th>Expire Date</th>
                              <th>Sub - Total</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, index) => {
                              const subTotal = item.costPrice * item.quantity;

                              return (
                                <tr key={index}>
                                  <td className="align-middle">
                                    <span className="fw-semibold">
                                      {item.productName || item.productSKU}
                                    </span>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="form-control form-control-sm"
                                      value={item.costPrice || ""}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "costPrice",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      disabled={loading}
                                      min="0"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="form-control form-control-sm"
                                      value={item.sellingPrice || ""}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "sellingPrice",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      disabled={loading}
                                      min="0"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={item.quantity || ""}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "quantity",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      disabled={loading}
                                      min="1"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="date"
                                      className="form-control form-control-sm"
                                      value={item.expireDate || ""}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "expireDate",
                                          e.target.value
                                        )
                                      }
                                      disabled={loading}
                                    />
                                  </td>
                                  <td className="align-middle">
                                    <span className="fw-semibold">
                                      {subTotal.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}{" "}
                                      LKR
                                    </span>
                                  </td>
                                  <td className="align-middle">
                                    <button
                                      type="button"
                                      className="btn btn-link text-danger p-0"
                                      onClick={() => removeItem(index)}
                                      disabled={loading}
                                      title="Remove item"
                                    >
                                      <FiX size={20} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Total */}
                      <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                        <h6 className="mb-0 fw-bold">Total</h6>
                        <h6 className="mb-0 fw-bold">
                          {formData.totalAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          LKR
                        </h6>
                      </div>
                    </>
                  )}

                  {items.length === 0 && (
                    <div className="text-center text-muted py-5">
                      No items added yet. Add items using the form above.
                    </div>
                  )}
                  {errors.items && (
                    <div className="text-danger mb-3">{errors.items}</div>
                  )}
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    // Clear form data before navigating
                    clearFormData();
                    setSavedSupplierInfo(null);
                    setSavedItems([]);
                    navigate("/purchasing/list");
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Creating...
                    </>
                  ) : (
                    "Create Purchase"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        {/* Print Success Modal */}
        {showPrintModal && createdPurchase && (
          <>
            <div
              className={`modal fade ${showPrintModal ? "show" : ""}`}
              style={{ display: showPrintModal ? "block" : "none" }}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="printModalLabel"
            >
              <div
                className="modal-dialog modal-dialog-centered"
                role="document"
              >
                <div className="modal-content">
                  <div className="modal-header bg-success text-white">
                    <h5 className="modal-title fw-bold" id="printModalLabel">
                      <FiCheckCircle className="me-2" />
                      Purchase Created Successfully
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={handlePrintModalClose}
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="text-center mb-4">
                      <div className="avatar avatar-lg bg-light-success mx-auto mb-3">
                        <FiCheckCircle size={32} className="text-success" />
                      </div>
                      <h5 className="text-success mb-3">
                        Purchase created successfully!
                      </h5>
                    </div>
                    <div className="card border-0 bg-light">
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">
                                Invoice Number:
                              </span>
                              <span className="fw-bold text-primary fs-5">
                                {createdPurchase.invoiceNumber ||
                                  submittedPurchaseData?.invoiceNumber ||
                                  "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">Total Amount:</span>
                              <span className="fw-bold fs-5 text-success">
                                {(
                                  createdPurchase.totalAmount ||
                                  submittedPurchaseData?.totalAmount ||
                                  0
                                ).toLocaleString()}{" "}
                                LKR
                              </span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted">
                                Payment Status:
                              </span>
                              {(() => {
                                const status =
                                  createdPurchase.paymentStatus ||
                                  submittedPurchaseData?.paymentStatus ||
                                  "Pending";
                                return (
                                  <span
                                    className={`badge ${
                                      status === "Complete"
                                        ? "bg-success"
                                        : status === "Pending"
                                        ? "bg-warning"
                                        : "bg-danger"
                                    } fs-6`}
                                  >
                                    {status}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handlePrintModalClose}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        printReceipt();
                        // Clear form and saved data after printing
                        clearFormData();
                        setSavedSupplierInfo(null);
                        setSavedItems([]);
                        handlePrintModalClose();
                      }}
                    >
                      <FiPrinter className="me-2" />
                      Print Receipt
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {showPrintModal && (
              <div
                className="modal-backdrop fade show"
                onClick={handlePrintModalClose}
                style={{ zIndex: 1040 }}
              ></div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default PurchasingForm;
