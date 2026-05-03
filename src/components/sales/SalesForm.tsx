import React, { useState, FormEvent, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  salesService,
  CreateReceiptRequest,
  SalesItem,
} from "@/services/salesService";
import { inventoryService, InventoryItem, StockBatch } from "@/services/inventoryService";
import Swal from "sweetalert2";
import {
  FiShoppingBag,
  FiPlus,
  FiTrash2,
  FiMinus,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiCopy,
  FiPackage,
} from "react-icons/fi";

interface SalesFormProps {
  onSuccess?: () => void;
}

interface CartItem extends SalesItem {
  productName?: string;
  sellingPrice?: number;
  totalQuantityOnHand?: number;
  stockId?: number;
  lotNumber?: string;
  supplierName?: string;
}

type SaleSearchRow = InventoryItem & { stockBatch?: StockBatch };

const STORAGE_KEY = "sales_cart_items";

const SalesForm: React.FC<SalesFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();

  const [items, setItems] = useState<CartItem[]>([]);
  const [currentItem, setCurrentItem] = useState<CartItem>({
    productSku: "",
    quantity: 1,
    subTotal: 0,
  });

  const [productSearch, setProductSearch] = useState<{
    query: string;
    results: SaleSearchRow[];
    showDropdown: boolean;
    selectedProduct: InventoryItem | null;
    highlightedIndex: number;
  }>({
    query: "",
    results: [],
    showDropdown: false,
    selectedProduct: null,
    highlightedIndex: -1,
  });

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const quantityInputRef = useRef<HTMLInputElement | null>(null);
  const productSearchInputRef = useRef<HTMLInputElement | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Batch picker modal state
  const [batchPicker, setBatchPicker] = useState<{
    show: boolean;
    productName: string;
    productSku: string;
    batches: StockBatch[];
    loading: boolean;
  }>({ show: false, productName: "", productSku: "", batches: [], loading: false });

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    message: string;
    salesId: number;
    receiptNumber: string;
  } | null>(null);

  // Load items from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem(STORAGE_KEY);
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        setItems(parsedItems);
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }
  }, []);

  // Save items to localStorage whenever items change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [items]);

  // Product search handler
  const handleProductSearch = async (query: string) => {
    setProductSearch((prev) => ({
      ...prev,
      query,
      showDropdown: query.length >= 2,
      highlightedIndex: -1,
    }));

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is too short
    if (query.trim().length < 2) {
      setProductSearch((prev) => ({
        ...prev,
        results: [],
        showDropdown: false,
        highlightedIndex: -1,
      }));
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await inventoryService.getInventoryList({
          page: 1,
          pageSize: 20,
          q: query.trim(),
        });

        const skus = response.data.map((i) => i.productSku);
        const batchesBySku =
          skus.length > 0
            ? await inventoryService.getStockBatchesForSale(skus)
            : {};

        const expandedResults: SaleSearchRow[] = [];

        response.data.forEach((item) => {
          const batches = batchesBySku[item.productSku] ?? [];

          if (batches.length === 0) {
            expandedResults.push({
              ...item,
              stock: item.stock,
            });
            return;
          }

          batches.forEach((batch) => {
            expandedResults.push({
              ...item,
              stock: batch.quantityOnHand,
              unitPrice: batch.sellingPrice,
              stockBatch: batch,
            });
          });
        });

        setProductSearch((prev) => ({
          ...prev,
          results: expandedResults,
          showDropdown: expandedResults.length > 0,
          highlightedIndex: -1,
        }));
      } catch (error) {
        console.error("Error searching products:", error);
        setProductSearch((prev) => ({
          ...prev,
          results: [],
          showDropdown: false,
          highlightedIndex: -1,
        }));
      }
    }, 300);
  };

  // Handle product selection — when a batch row was chosen in search, apply it directly; otherwise load batches (fallback)
  const handleProductSelect = async (product: SaleSearchRow) => {
    setProductSearch({
      query: product.stockBatch
        ? `${product.name} (${product.stockBatch.lotNumber || `Lot #${product.stockBatch.stockId}`})`
        : product.name,
      results: [],
      showDropdown: false,
      selectedProduct: product,
      highlightedIndex: -1,
    });

    if (product.stockBatch) {
      const b = product.stockBatch;
      setCurrentItem({
        productSku: product.productSku,
        quantity: 1,
        subTotal: 0,
        productName: product.name,
        sellingPrice: b.sellingPrice,
        totalQuantityOnHand: b.quantityOnHand,
        stockId: b.stockId,
        lotNumber: b.lotNumber,
        supplierName: b.supplierName ?? undefined,
      });
      setBatchPicker((prev) => ({ ...prev, loading: false, show: false }));
      setTimeout(() => quantityInputRef.current?.focus(), 100);
      return;
    }

    // No batch on row (out of stock line): still allow flow but stock must be validated
    setCurrentItem({
      productSku: product.productSku,
      quantity: 1,
      subTotal: 0,
      productName: product.name,
      sellingPrice: product.unitPrice || 0,
      totalQuantityOnHand: product.stock,
    });

    setBatchPicker((prev) => ({ ...prev, loading: true, show: false }));
    try {
      const batches = await inventoryService.getStockBatches(product.productSku);
      const available = batches.filter((b) => b.quantityOnHand > 0);

      if (available.length === 0) {
        setTimeout(() => quantityInputRef.current?.focus(), 100);
        setBatchPicker((prev) => ({ ...prev, loading: false }));
      } else if (available.length === 1) {
        const b = available[0];
        setCurrentItem((prev) => ({
          ...prev,
          stockId: b.stockId,
          sellingPrice: b.sellingPrice,
          totalQuantityOnHand: b.quantityOnHand,
          lotNumber: b.lotNumber,
          supplierName: b.supplierName ?? undefined,
        }));
        setBatchPicker((prev) => ({ ...prev, loading: false }));
        setTimeout(() => quantityInputRef.current?.focus(), 100);
      } else {
        setBatchPicker({
          show: true,
          productName: product.name,
          productSku: product.productSku,
          batches: available,
          loading: false,
        });
      }
    } catch {
      setBatchPicker((prev) => ({ ...prev, loading: false }));
      setTimeout(() => quantityInputRef.current?.focus(), 100);
    }
  };

  const handleBatchSelect = (batch: StockBatch) => {
    setCurrentItem(prev => ({
      ...prev,
      stockId: batch.stockId,
      sellingPrice: batch.sellingPrice,
      totalQuantityOnHand: batch.quantityOnHand,
      lotNumber: batch.lotNumber,
      supplierName: batch.supplierName ?? undefined,
    }));
    setBatchPicker(prev => ({ ...prev, show: false }));
    setTimeout(() => quantityInputRef.current?.focus(), 100);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProductSearch((prev) => ({
          ...prev,
          showDropdown: false,
          highlightedIndex: -1,
        }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll highlighted item into view when using keyboard navigation
  useEffect(() => {
    if (productSearch.highlightedIndex >= 0 && dropdownRef.current) {
      const dropdownElement = dropdownRef.current.querySelector(
        `[data-highlighted-index="true"]`
      ) as HTMLElement;
      if (dropdownElement) {
        dropdownElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [productSearch.highlightedIndex]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    items.forEach((item, index) => {
      if (!item.productSku.trim()) {
        newErrors[`item_${index}_productSku`] = "Product SKU is required";
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = "Quantity must be greater than 0";
      }
      if (item.subTotal <= 0) {
        newErrors[`item_${index}_subTotal`] = "Subtotal must be greater than 0";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.subTotal, 0);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare items for API (remove display-only fields, keep stockId for batch-specific deduction)
      const apiItems: SalesItem[] = items.map(
        ({ productName, sellingPrice, totalQuantityOnHand, lotNumber, supplierName, ...item }) => item
      );

      const receiptData: CreateReceiptRequest = {
        items: apiItems,
        totalAmount: calculateTotalAmount(),
      };

      const receipt = await salesService.createReceipt(receiptData);

      // Clear local storage after successful creation
      localStorage.removeItem(STORAGE_KEY);
      setItems([]);

      // Set receipt data and show modal
      // The API returns: { message, salesId, receiptNumber }
      setReceiptData({
        message: "Receipt created successfully",
        salesId: receipt.salesId,
        receiptNumber: receipt.receiptNumber,
      });
      setShowReceiptModal(true);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error ? error.message : "Failed to create receipt",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle current item changes
  const handleCurrentItemChange = (
    field: keyof CartItem,
    value: string | number
  ) => {
    const updatedItem = {
      ...currentItem,
      [field]: value,
    };

    // Recalculate subtotal when quantity or price changes
    if (field === "quantity" || field === "sellingPrice") {
      const qty =
        field === "quantity" ? (value as number) : updatedItem.quantity;
      const price =
        field === "sellingPrice"
          ? (value as number)
          : updatedItem.sellingPrice || 0;
      updatedItem.subTotal = (qty || 0) * price;
    }

    setCurrentItem(updatedItem);
  };

  // Add current item to cart
  const addItemToCart = () => {
    if (!currentItem.productSku.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Product Required",
        text: "Please select a product",
      });
      return;
    }
    if (!currentItem.quantity || currentItem.quantity <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Quantity Required",
        text: "Quantity must be greater than 0",
      });
      quantityInputRef.current?.focus();
      return;
    }

    // Validate stock availability
    const availableStock = currentItem.totalQuantityOnHand || 0;
    if (availableStock <= 0) {
      Swal.fire({
        icon: "error",
        title: "Out of Stock",
        text: `${
          currentItem.productName || currentItem.productSku
        } is currently out of stock. Available stock: ${availableStock}`,
      });
      return;
    }
    if (currentItem.quantity > availableStock) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Stock",
        text: `Requested quantity (${
          currentItem.quantity
        }) exceeds available stock (${availableStock}) for ${
          currentItem.productName || currentItem.productSku
        }`,
      });
      quantityInputRef.current?.focus();
      return;
    }

    if (currentItem.subTotal <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Subtotal",
        text: "Subtotal must be greater than 0",
      });
      return;
    }

    setItems([...items, { ...currentItem }]);

    // Reset current item
    setCurrentItem({
      productSku: "",
      quantity: 0,
      subTotal: 0,
      totalQuantityOnHand: undefined,
    });
    setProductSearch({
      query: "",
      results: [],
      showDropdown: false,
      selectedProduct: null,
      highlightedIndex: -1,
    });

    // Auto-focus product search input after adding item
    setTimeout(() => {
      productSearchInputRef.current?.focus();
    }, 100);
  };

  // Update item quantity
  const updateItemQuantity = (index: number, change: number) => {
    const newItems = [...items];
    const item = newItems[index];
    const newQuantity = item.quantity + change;
    const availableStock = item.totalQuantityOnHand || 0;

    if (newQuantity <= 0) {
      return;
    }

    // Validate against stock
    if (newQuantity > availableStock) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Stock",
        text: `Cannot increase quantity. Available stock: ${availableStock}, Requested: ${newQuantity} for ${
          item.productName || item.productSku
        }`,
      });
      return;
    }

    newItems[index] = {
      ...item,
      quantity: newQuantity,
      subTotal: (item.sellingPrice || 0) * newQuantity,
    };
    setItems(newItems);
  };

  // Update item quantity manually
  const updateItemQuantityManual = (index: number, newQuantity: number) => {
    const newItems = [...items];
    const item = newItems[index];
    const availableStock =
      item.totalQuantityOnHand !== undefined
        ? item.totalQuantityOnHand
        : Infinity;

    if (newQuantity <= 0) {
      // Don't allow zero or negative - set to 1
      newQuantity = 1;
    }

    // Validate against stock
    if (
      item.totalQuantityOnHand !== undefined &&
      newQuantity > availableStock
    ) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Stock",
        text: `Cannot set quantity to ${newQuantity}. Available stock: ${availableStock} for ${
          item.productName || item.productSku
        }. Setting to maximum available.`,
        timer: 2000,
        showConfirmButton: false,
      });
      // Set to max available stock instead
      newQuantity = availableStock;
    }

    newItems[index] = {
      ...item,
      quantity: newQuantity,
      subTotal: (item.sellingPrice || 0) * newQuantity,
    };
    setItems(newItems);
  };

  // Remove item from cart
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Clear all items from cart
  const clearAllItems = () => {
    Swal.fire({
      title: "Clear All Items?",
      text: "Are you sure you want to remove all items from the cart?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, clear all",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setItems([]);
        localStorage.removeItem(STORAGE_KEY);
        Swal.fire({
          icon: "success",
          title: "Cleared",
          text: "All items have been removed from the cart",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  // Handle receipt modal close
  const handleReceiptModalClose = () => {
    const receiptNumber = receiptData?.receiptNumber;
    const userRole = localStorage.getItem("pharmacy_role");

    setShowReceiptModal(false);
    setReceiptData(null);

    // If role is DISPENSER, stay on Create New Receipt page (reset form)
    if (userRole === "DISPENSER") {
      // Reset form state to allow creating a new receipt
      setItems([]);
      setCurrentItem({
        productSku: "",
        quantity: 0,
        subTotal: 0,
        totalQuantityOnHand: undefined,
        lotNumber: undefined,
        supplierName: undefined,
      });
      setProductSearch({
        query: "",
        results: [],
        showDropdown: false,
        selectedProduct: null,
        highlightedIndex: -1,
      });
      // Stay on the same page (Create New Receipt page)
      return;
    }

    // For other roles, use existing behavior
    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/sales/create");
    }
  };

  // Tab closes the receipt success modal
  useEffect(() => {
    if (!showReceiptModal) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        handleReceiptModalClose();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReceiptModal]);

  // Copy receipt number to clipboard
  const copyReceiptNumber = () => {
    if (receiptData) {
      navigator.clipboard.writeText(receiptData.receiptNumber);
      Swal.fire({
        icon: "success",
        title: "Copied!",
        text: "Receipt number copied to clipboard",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="col-lg-12">
      <div className="card">
        <div className="card-header">
          <div className="d-flex align-items-center gap-3 my-3">
            <div className="avatar avatar-md bg-light-primary">
              <FiShoppingBag size={18} className="text-primary" />
            </div>
            <div>
              <h5 className="card-title mb-1 fw-bold">Create New Receipt</h5>
              <p className="text-muted mb-0 fs-12">
                Create a new sales receipt with items
              </p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Left Side - Add Items Form */}
              <div className="col-lg-7">
                <h6 className="mb-3 fw-bold">Add</h6>

                {/* Product Search */}
                <div className="mb-3">
                  <label className="form-label">
                    Product SKU <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative" ref={dropdownRef}>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FiSearch />
                      </span>
                      <input
                        ref={productSearchInputRef}
                        type="text"
                        className="form-control"
                        placeholder="Search product — each stock batch is listed separately (oldest expiry first)..."
                        value={productSearch.query}
                        onChange={(e) => {
                          handleProductSearch(e.target.value);
                          setCurrentItem((prev) => ({
                            ...prev,
                            productSku: "",
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            // Always prevent Enter from submitting the form on this input.
                            // Barcode scanners send Enter immediately after the barcode
                            // characters, before the 300ms debounce resolves — without this
                            // the Enter falls through to <form onSubmit> and submits the sale.
                            e.preventDefault();
                            if (
                              productSearch.showDropdown &&
                              productSearch.results.length > 0
                            ) {
                              if (
                                productSearch.highlightedIndex >= 0 &&
                                productSearch.highlightedIndex <
                                  productSearch.results.length
                              ) {
                                handleProductSelect(
                                  productSearch.results[
                                    productSearch.highlightedIndex
                                  ]
                                );
                              } else {
                                handleProductSelect(productSearch.results[0]);
                              }
                            }
                          } else if (
                            productSearch.showDropdown &&
                            productSearch.results.length > 0
                          ) {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setProductSearch((prev) => ({
                                ...prev,
                                highlightedIndex:
                                  prev.highlightedIndex <
                                  prev.results.length - 1
                                    ? prev.highlightedIndex + 1
                                    : prev.highlightedIndex,
                              }));
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              setProductSearch((prev) => ({
                                ...prev,
                                highlightedIndex:
                                  prev.highlightedIndex > 0
                                    ? prev.highlightedIndex - 1
                                    : 0,
                              }));
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              setProductSearch((prev) => ({
                                ...prev,
                                showDropdown: false,
                                highlightedIndex: -1,
                              }));
                            }
                          }
                        }}
                        disabled={loading}
                      />
                    </div>

                    {/* Dropdown Results */}
                    {productSearch.showDropdown &&
                      productSearch.results.length > 0 && (
                        <div
                          className="position-absolute w-100 bg-white border rounded shadow-lg"
                          style={{
                            zIndex: 1000,
                            maxHeight: "300px",
                            overflowY: "auto",
                            marginTop: "2px",
                          }}
                        >
                          {productSearch.results.map((product, index) => {
                            const batch = product.stockBatch;
                            const displayKey = batch 
                              ? `${product.productSku}-${batch.stockId}` 
                              : product.productSku;
                            
                            return (
                              <div
                                key={displayKey}
                                data-highlighted-index={
                                  productSearch.highlightedIndex === index
                                    ? "true"
                                    : undefined
                                }
                                className="border-bottom"
                                style={{
                                  padding: "8px 12px",
                                  cursor: "pointer",
                                  transition: "background-color 0.2s",
                                  backgroundColor:
                                    productSearch.highlightedIndex === index
                                      ? "#e7f3ff"
                                      : "white",
                                }}
                                onMouseEnter={() => {
                                  setProductSearch((prev) => ({
                                    ...prev,
                                    highlightedIndex: index,
                                  }));
                                }}
                                onMouseLeave={() => {
                                  // Keep highlighted index on mouse leave for keyboard navigation
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleProductSelect(product);
                                }}
                              >
                                <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: "4px" }}>
                                  <div className="d-flex flex-column flex-grow-1" style={{ minWidth: "200px" }}>
                                    <div className="fw-bold" style={{ lineHeight: "1.2", marginBottom: "2px" }}>{product.name}</div>
                                    <div className="d-flex flex-wrap align-items-center" style={{ gap: "8px" }}>
                                      <span className="text-muted small">SKU: <span className="text-dark">{product.productSku}</span></span>
                                      {batch && (
                                        <>
                                          {batch.supplierName && (
                                            <span className="text-muted small">Supplier: <span className="text-primary fw-semibold">{batch.supplierName}</span></span>
                                          )}
                                          <span className="text-muted small">Lot: <span className="text-dark">{batch.lotNumber}</span></span>
                                          <span className="text-muted small">Exp: <span className="text-dark">{new Date(batch.expireDate).toLocaleDateString()}</span></span>
                                        </>
                                      )}
                                      {!batch && product.supplierSummary && (
                                        <span className="text-muted small">Supplier: <span className="text-primary fw-semibold">{product.supplierSummary}</span></span>
                                      )}
                                      <span className="text-muted small">{product.productType}</span>
                                      <span
                                        className={`small ${
                                          product.stock <= 0
                                            ? "text-danger fw-bold"
                                            : product.stock < 10
                                            ? "text-warning fw-semibold"
                                            : "text-success"
                                        }`}
                                      >
                                        Stock: {product.stock}
                                        {product.stock <= 0 ? " (Out)" : ""}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="fw-bold text-primary" style={{ whiteSpace: "nowrap" }}>
                                    {product.unitPrice.toLocaleString()} LKR
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                </div>

                {/* Selected Product Info */}
                {currentItem.productSku && (
                  <div
                    className={`alert mb-3 ${
                      (currentItem.totalQuantityOnHand || 0) <= 0
                        ? "alert-danger"
                        : (currentItem.totalQuantityOnHand || 0) < 10
                        ? "alert-warning"
                        : "alert-info"
                    }`}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <strong>{currentItem.productName}</strong>
                        <div className="small text-muted">SKU: {currentItem.productSku}</div>
                        {currentItem.supplierName && (
                          <div className="small mt-1">
                            <FiPackage size={12} className="me-1" />
                            <span className="fw-semibold">Supplier:</span> {currentItem.supplierName}
                          </div>
                        )}
                        {currentItem.lotNumber && (
                          <div className="small">
                            <span className="fw-semibold">Batch/Lot:</span> {currentItem.lotNumber}
                          </div>
                        )}
                        <div
                          className={`small mt-1 ${
                            (currentItem.totalQuantityOnHand || 0) <= 0
                              ? "text-danger fw-bold"
                              : (currentItem.totalQuantityOnHand || 0) < 10
                              ? "text-warning fw-semibold"
                              : "text-success"
                          }`}
                        >
                          Available Stock: {currentItem.totalQuantityOnHand || 0}{" "}
                          {(currentItem.totalQuantityOnHand || 0) <= 0 ? "(Out of Stock)" : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => {
                          setCurrentItem({
                            productSku: "",
                            quantity: 0,
                            subTotal: 0,
                            totalQuantityOnHand: undefined,
                          });
                          setProductSearch({
                            query: "",
                            results: [],
                            showDropdown: false,
                            selectedProduct: null,
                            highlightedIndex: -1,
                          });
                        }}
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Quantity and Price Inputs */}
                <div className="row mb-3">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Quantity <span className="text-danger">*</span>
                    </label>
                    <input
                      ref={quantityInputRef}
                      type="number"
                      className={`form-control ${
                        currentItem.productSku &&
                        currentItem.quantity > 0 &&
                        currentItem.totalQuantityOnHand !== undefined &&
                        currentItem.quantity > currentItem.totalQuantityOnHand
                          ? "is-invalid"
                          : ""
                      }`}
                      placeholder="Enter quantity"
                      min="1"
                      max={currentItem.totalQuantityOnHand || undefined}
                      value={currentItem.quantity || ""}
                      onChange={(e) =>
                        handleCurrentItemChange(
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItemToCart();
                        }
                      }}
                      disabled={loading || !currentItem.productSku}
                    />
                    {currentItem.productSku &&
                      currentItem.totalQuantityOnHand !== undefined && (
                        <>
                          {currentItem.quantity > 0 &&
                          currentItem.quantity >
                            currentItem.totalQuantityOnHand ? (
                            <div className="invalid-feedback d-block">
                              <strong>Insufficient stock!</strong> Available:{" "}
                              {currentItem.totalQuantityOnHand}, Requested:{" "}
                              {currentItem.quantity}
                            </div>
                          ) : currentItem.totalQuantityOnHand <= 0 ? (
                            <div className="text-danger small mt-1">
                              <strong>Out of stock!</strong> Available:{" "}
                              {currentItem.totalQuantityOnHand}
                            </div>
                          ) : currentItem.totalQuantityOnHand < 10 ? (
                            <div className="text-warning small mt-1">
                              Low stock: {currentItem.totalQuantityOnHand}{" "}
                              remaining
                            </div>
                          ) : (
                            <div className="text-success small mt-1">
                              Available stock: {currentItem.totalQuantityOnHand}
                            </div>
                          )}
                        </>
                      )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Unit Price (LKR) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="0.00"
                      value={currentItem.sellingPrice || ""}
                      onChange={(e) =>
                        handleCurrentItemChange(
                          "sellingPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={loading || !currentItem.productSku}
                    />
                  </div>
                </div>

                {/* Subtotal Display */}
                {currentItem.productSku && (
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                      <span className="fw-bold">Subtotal:</span>
                      <span className="fw-bold text-primary">
                        {(currentItem.subTotal || 0).toLocaleString()} LKR
                      </span>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  type="button"
                  className="btn btn-primary w-100 mb-4"
                  onClick={addItemToCart}
                  disabled={
                    loading ||
                    !currentItem.productSku ||
                    !currentItem.quantity ||
                    currentItem.quantity <= 0 ||
                    currentItem.subTotal <= 0
                  }
                >
                  <FiPlus className="me-2" />
                  Add
                </button>

                {errors.items && (
                  <div className="alert alert-danger">{errors.items}</div>
                )}
              </div>

              {/* Right Side - Cart */}
              <div className="col-lg-5">
                <div
                  className="card border-primary"
                  style={{ position: "sticky", top: "20px" }}
                >
                  <div className="card-header bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <h6
                        className="mb-0 fw-bold text-white"
                        style={{ color: "#ffffff" }}
                      >
                        <FiShoppingBag className="me-2" />
                        Busket ({items.length})
                      </h6>
                      {items.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-danger"
                          onClick={clearAllItems}
                          disabled={loading}
                          title="Clear all items"
                          style={{ marginLeft: "auto" }}
                        >
                          <FiTrash2 className="me-1" />
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className="card-body"
                    style={{ maxHeight: "500px", overflowY: "auto" }}
                  >
                    {items.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <FiShoppingBag size={48} className="mb-3 opacity-50" />
                        <p>Your cart is empty</p>
                        <p className="small">Add products to get started</p>
                      </div>
                    ) : (
                      <>
                        {items.map((item, index) => (
                          <div key={index} className="card mb-3 border">
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1 fw-bold">
                                    {item.productName || item.productSku}
                                  </h6>
                                  <div className="small text-muted">
                                    SKU: {item.productSku}
                                  </div>
                                  {item.supplierName && (
                                    <div className="small text-primary">
                                      <FiPackage size={11} className="me-1" />
                                      {item.supplierName}
                                      {item.lotNumber ? ` · ${item.lotNumber}` : ""}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-danger p-0"
                                  onClick={() => removeItem(index)}
                                  disabled={loading}
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>

                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="small text-muted">
                                  Unit Price:
                                </span>
                                <span className="small">
                                  {(item.sellingPrice || 0).toLocaleString()}{" "}
                                  LKR
                                </span>
                              </div>

                              <div className="mb-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="small text-muted">
                                    Quantity:
                                  </span>
                                  {item.totalQuantityOnHand !== undefined && (
                                    <span
                                      className={`small ${
                                        item.totalQuantityOnHand <= 0
                                          ? "text-danger fw-bold"
                                          : item.totalQuantityOnHand < 10
                                          ? "text-warning fw-semibold"
                                          : "text-success"
                                      }`}
                                    >
                                      Stock: {item.totalQuantityOnHand}{" "}
                                      {item.totalQuantityOnHand <= 0
                                        ? "(Out of Stock)"
                                        : ""}
                                    </span>
                                  )}
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() =>
                                      updateItemQuantity(index, -1)
                                    }
                                    disabled={loading || item.quantity <= 1}
                                    title="Decrease quantity"
                                  >
                                    <FiMinus size={14} />
                                  </button>
                                  <input
                                    type="number"
                                    className={`form-control form-control-sm text-center ${
                                      item.totalQuantityOnHand !== undefined &&
                                      item.quantity > item.totalQuantityOnHand
                                        ? "is-invalid"
                                        : ""
                                    }`}
                                    style={{
                                      maxWidth: "auto",
                                      width: "auto",
                                      minWidth: "60px",
                                    }}
                                    min="1"
                                    max={item.totalQuantityOnHand || undefined}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const value =
                                        parseInt(e.target.value) || 0;
                                      updateItemQuantityManual(index, value);
                                    }}
                                    onBlur={(e) => {
                                      const value =
                                        parseInt(e.target.value) || 1;
                                      if (value < 1) {
                                        updateItemQuantityManual(index, 1);
                                      }
                                    }}
                                    disabled={
                                      loading ||
                                      (item.totalQuantityOnHand !== undefined &&
                                        item.totalQuantityOnHand <= 0)
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => updateItemQuantity(index, 1)}
                                    disabled={
                                      loading ||
                                      (item.totalQuantityOnHand !== undefined &&
                                        item.quantity >=
                                          item.totalQuantityOnHand)
                                    }
                                    title={
                                      item.totalQuantityOnHand !== undefined &&
                                      item.quantity >= item.totalQuantityOnHand
                                        ? "Insufficient stock"
                                        : "Increase quantity"
                                    }
                                  >
                                    <FiPlus size={14} />
                                  </button>
                                </div>
                                {item.totalQuantityOnHand !== undefined &&
                                  item.quantity > item.totalQuantityOnHand && (
                                    <div className="invalid-feedback d-block small">
                                      <strong>Insufficient stock!</strong>{" "}
                                      Available: {item.totalQuantityOnHand},
                                      Requested: {item.quantity}
                                    </div>
                                  )}
                              </div>

                              <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                <span className="fw-bold">Subtotal:</span>
                                <span className="fw-bold text-primary">
                                  {item.subTotal.toLocaleString()} LKR
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  {items.length > 0 && (
                    <div className="card-footer bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 fw-bold">Total Amount:</h6>
                        <h5 className="mb-0 text-primary fw-bold">
                          {calculateTotalAmount().toLocaleString()} LKR
                        </h5>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {items.length > 0 && (
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => navigate("/sales/list")}
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
                    "Create Receipt"
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Batch loading indicator */}
      {batchPicker.loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: "rgba(0,0,0,0.3)" }}>
          <div className="bg-white rounded p-4 text-center shadow">
            <div className="spinner-border text-primary mb-2" role="status" />
            <div className="small">Loading batches...</div>
          </div>
        </div>
      )}

      {/* Batch Picker Modal */}
      {batchPicker.show && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    <FiPackage className="me-2" />
                    Select Batch — {batchPicker.productName}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setBatchPicker(prev => ({ ...prev, show: false }))}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <p className="text-muted small mb-3">
                    Multiple supplier batches are available for this product. Select which batch to sell from.
                  </p>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Supplier</th>
                          <th>Batch / Lot</th>
                          <th>Available</th>
                          <th>Expiry</th>
                          <th>Price (LKR)</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchPicker.batches.map((batch) => {
                          const expiry = new Date(batch.expireDate);
                          const daysUntilExpiry = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
                          const expiryClass = daysUntilExpiry < 30 ? "text-danger fw-bold" : daysUntilExpiry < 90 ? "text-warning" : "text-dark";
                          return (
                            <tr key={batch.stockId}>
                              <td>
                                <span className="fw-semibold">{batch.supplierName ?? "Unknown"}</span>
                              </td>
                              <td><code>{batch.lotNumber}</code></td>
                              <td>
                                <span className={batch.quantityOnHand < 10 ? "text-warning fw-semibold" : "text-success fw-semibold"}>
                                  {batch.quantityOnHand} units
                                </span>
                              </td>
                              <td className={expiryClass}>
                                {expiry.toLocaleDateString()}
                                {daysUntilExpiry < 30 && <div className="small">(expires soon)</div>}
                              </td>
                              <td>{batch.sellingPrice.toLocaleString()}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleBatchSelect(batch)}
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setBatchPicker(prev => ({ ...prev, show: false }))} />
        </>
      )}

      {/* Receipt Success Modal */}
      {showReceiptModal && receiptData && (
        <>
          <div
            className={`modal fade ${showReceiptModal ? "show" : ""}`}
            style={{ display: showReceiptModal ? "block" : "none" }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="receiptModalLabel"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title fw-bold" id="receiptModalLabel">
                    <FiCheckCircle className="me-2" />
                    Receipt Created Successfully
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleReceiptModalClose}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="text-center mb-4">
                    <div className="avatar avatar-lg bg-light-success mx-auto mb-3">
                      <FiCheckCircle size={32} className="text-success" />
                    </div>
                    <h5 className="text-success mb-3">{receiptData.message}</h5>
                  </div>

                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-12">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Receipt Number:</span>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-primary fs-5">
                                {receiptData.receiptNumber}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={copyReceiptNumber}
                                title="Copy receipt number"
                              >
                                <FiCopy size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Sales ID:</span>
                            <span className="fw-bold">
                              {receiptData.salesId}
                            </span>
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
                    onClick={handleReceiptModalClose}
                  >
                    Close
                  </button>
                  {/* <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            const receiptNumber = receiptData?.receiptNumber;
                                            if (receiptNumber) {
                                                setShowReceiptModal(false);
                                                setReceiptData(null);
                                                navigate(`/sales/view?receiptNumber=${receiptNumber}`);
                                            }
                                        }}
                                    >
                                        View Receipt
                                    </button> */}
                </div>
              </div>
            </div>
          </div>
          {showReceiptModal && (
            <div
              className="modal-backdrop fade show"
              onClick={handleReceiptModalClose}
              style={{ zIndex: 1040 }}
            ></div>
          )}
        </>
      )}
    </div>
  );
};

export default SalesForm;
