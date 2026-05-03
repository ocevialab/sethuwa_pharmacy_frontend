import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { inventoryService, InventoryItemDetails, StockBatch } from '@/services/inventoryService';
import Swal from 'sweetalert2';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import Footer from '@/components/shared/Footer';
import { FiPackage, FiArrowLeft, FiCalendar, FiDollarSign, FiLayers, FiAlertCircle, FiCheckCircle, FiTag, FiBox, FiInfo, FiEdit2, FiX } from 'react-icons/fi';

const InventoryView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const productSku = searchParams.get('sku');
    const [itemDetails, setItemDetails] = useState<InventoryItemDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditPriceModal, setShowEditPriceModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<StockBatch | null>(null);
    const [priceFormData, setPriceFormData] = useState({
        costPrice: 0,
        sellingPrice: 0,
    });

    useEffect(() => {
        if (productSku) {
            fetchItemDetails();
        } else {
            setError('Product SKU is required');
            setLoading(false);
        }
    }, [productSku]);

    const fetchItemDetails = async () => {
        if (!productSku) return;

        try {
            setLoading(true);
            setError(null);
            const data = await inventoryService.getItemDetails(productSku);
            setItemDetails(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load item details');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to load item details',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getStockStatus = (stock: number, threshold: number) => {
        if (stock === 0) {
            return { badge: 'bg-danger', text: 'Out of Stock', icon: <FiAlertCircle /> };
        } else if (stock <= threshold) {
            return { badge: 'bg-warning', text: 'Low Stock', icon: <FiAlertCircle /> };
        } else {
            return { badge: 'bg-success', text: 'In Stock', icon: <FiCheckCircle /> };
        }
    };

    const handleEditPrice = (batch: StockBatch) => {
        setSelectedBatch(batch);
        setPriceFormData({
            costPrice: batch.costPrice,
            sellingPrice: batch.sellingPrice,
        });
        setShowEditPriceModal(true);
    };

    const handleUpdatePrice = async () => {
        if (!selectedBatch) return;

        // Validate prices
        if (priceFormData.costPrice < 0 || priceFormData.sellingPrice < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Price',
                text: 'Prices cannot be negative',
            });
            return;
        }

        try {
            await inventoryService.updateStockPrice(selectedBatch.stockId, {
                costPrice: priceFormData.costPrice,
                sellingPrice: priceFormData.sellingPrice,
            });

            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Stock prices updated successfully',
                timer: 2000,
                showConfirmButton: false,
            });

            // Refresh item details
            await fetchItemDetails();
            setShowEditPriceModal(false);
            setSelectedBatch(null);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Failed to update stock prices',
            });
        }
    };

    // Tab closes the edit price modal
    useEffect(() => {
        if (!showEditPriceModal) return;
        const handleTab = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                setShowEditPriceModal(false);
                setSelectedBatch(null);
            }
        };
        document.addEventListener('keydown', handleTab);
        return () => document.removeEventListener('keydown', handleTab);
    }, [showEditPriceModal]);

    if (loading) {
        return (
            <>
                <PageHeader>
                    <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-light-brand" onClick={() => navigate('/inventory/list')}>
                            <FiArrowLeft className="me-2" />
                            Back to List
                        </button>
                    </div>
                </PageHeader>
                <div className='main-content'>
                    <div className='row'>
                        <div className="col-12">
                            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
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

    if (error || !itemDetails) {
        return (
            <>
                <PageHeader>
                    <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-light-brand" onClick={() => navigate('/inventory/list')}>
                            <FiArrowLeft className="me-2" />
                            Back to List
                        </button>
                    </div>
                </PageHeader>
                <div className='main-content'>
                    <div className='row'>
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body text-center">
                                    <p className="text-danger">{error || 'Item not found'}</p>
                                    <button className="btn btn-primary" onClick={() => navigate('/inventory/list')}>
                                        Back to List
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const stockStatus = getStockStatus(itemDetails.totalQuantityOnHand, itemDetails.lowStockThreshold);

    return (
        <>
            <style>{`
                /* Dark theme for cards */
                html.app-skin-dark .card[style*="rgba(52, 84, 209, 0.05)"] {
                    background: rgba(52, 84, 209, 0.1) !important;
                    border-color: rgba(52, 84, 209, 0.3) !important;
                }
                html.app-skin-dark .card[style*="rgba(23, 198, 102, 0.05)"] {
                    background: rgba(23, 198, 102, 0.1) !important;
                    border-color: rgba(23, 198, 102, 0.3) !important;
                }
                html.app-skin-dark .card-body div[style*="rgba(255, 255, 255, 0.5)"] {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                html.app-skin-dark .card-body .text-muted {
                    color: #b1b4c0 !important;
                }
                html.app-skin-dark .card-body .fw-bold,
                html.app-skin-dark .card-body .fw-semibold {
                    color: #ffffff !important;
                }
                html.app-skin-dark .card-header h6 {
                    color: #ffffff !important;
                }
                
                /* Dark theme for table */
                html.app-skin-dark .table thead th {
                    color: #ffffff !important;
                    border-color: #1b2436 !important;
                    background-color: transparent !important;
                }
                html.app-skin-dark .table tbody td {
                    color: #b1b4c0 !important;
                    border-color: #1b2436 !important;
                    background-color: transparent !important;
                }
                html.app-skin-dark .table tbody tr:hover td {
                    color: #ffffff !important;
                    background-color: #121b2e !important;
                }
                html.app-skin-dark .table tbody tr .text-success {
                    color: #17c666 !important;
                }
                
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .card-body div[style*="rgba(255, 255, 255, 0.5)"] {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 0.5rem;
                    }
                    .card-body .text-end {
                        text-align: left !important;
                    }
                }
            `}</style>
            <PageHeader>
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-light-brand" onClick={() => navigate('/inventory/list')}>
                        <FiArrowLeft className="me-2" />
                        Back to List
                    </button>
                </div>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <div className="d-flex align-items-center gap-3 my-3">
                                    <div className="avatar avatar-md bg-light-primary">
                                        <FiPackage size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <h5 className="card-title mb-1 fw-bold">{itemDetails.name}</h5>
                                        <p className="text-muted mb-0 fs-12">Product SKU: {itemDetails.productSku}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="row g-3 mb-4">
                                    {/* Product Information Card */}
                                    <div className="col-12 col-lg-6">
                                        <div className="card h-100" style={{
                                            background: 'rgba(52, 84, 209, 0.05)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(52, 84, 209, 0.15)'
                                        }}>
                                            <div className="card-header bg-transparent border-0 pb-2">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar avatar-sm bg-light-primary">
                                                        <FiPackage size={16} className="text-primary" />
                                                    </div>
                                                    <h6 className="mb-0 fw-bold">Product Information</h6>
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">
                                                <div className="row g-3">
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Product SKU</span>
                                                            <span className="fw-bold">{itemDetails.productSku}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Product Name</span>
                                                            <span className="fw-semibold text-end" style={{ maxWidth: '60%' }}>{itemDetails.name}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Brand Name</span>
                                                            <span className="fw-semibold">{itemDetails.brandName}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Product Type</span>
                                                            <span className={`badge bg-${itemDetails.productType === 'Medicine' ? 'primary' : 'info'}`}>
                                                                {itemDetails.productType}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {itemDetails.genericName && (
                                                        <div className="col-12">
                                                            <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                                <span className="text-muted fs-12">Generic Name</span>
                                                                <span className="fw-semibold text-end" style={{ maxWidth: '60%' }}>{itemDetails.genericName}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {itemDetails.strength && (
                                                        <div className="col-12">
                                                            <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                                <span className="text-muted fs-12">Strength</span>
                                                                <span className="fw-semibold">{itemDetails.strength}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Requires Prescription</span>
                                                            {itemDetails.requiredPrescription ? (
                                                                <span className="badge bg-danger">Yes</span>
                                                            ) : (
                                                                <span className="badge bg-success">No</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Information Card */}
                                    <div className="col-12 col-lg-6">
                                        <div className="card h-100" style={{
                                            background: 'rgba(23, 198, 102, 0.05)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(23, 198, 102, 0.15)'
                                        }}>
                                            <div className="card-header bg-transparent border-0 pb-2">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar avatar-sm bg-light-success">
                                                        <FiLayers size={16} className="text-success" />
                                                    </div>
                                                    <h6 className="mb-0 fw-bold">Stock Information</h6>
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">
                                                <div className="row g-3">
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <div>
                                                                <span className="text-muted fs-12 d-block mb-1">Total Quantity on Hand</span>
                                                                <span className="fw-bold fs-20 text-primary">{itemDetails.totalQuantityOnHand}</span>
                                                            </div>
                                                            <div className="avatar avatar-md bg-light-primary">
                                                                <FiLayers size={20} className="text-primary" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Low Stock Threshold</span>
                                                            <span className="fw-bold">{itemDetails.lowStockThreshold}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                                                            <span className="text-muted fs-12">Stock Status</span>
                                                            <span className={`badge ${stockStatus.badge} d-inline-flex align-items-center gap-1`}>
                                                                {stockStatus.icon}
                                                                {stockStatus.text}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Batches */}
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <h6 className="mb-3 fw-bold">Stock Batches</h6>
                                    {itemDetails.stockBatches && itemDetails.stockBatches.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Supplier</th>
                                                        <th>Lot Number</th>
                                                        <th>Quantity</th>
                                                        <th>Expire Date</th>
                                                        <th>Cost Price</th>
                                                        <th>Selling Price</th>
                                                        <th className="text-end">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {itemDetails.stockBatches.map((batch) => (
                                                        <tr key={batch.stockId}>
                                                            <td>
                                                                <span className="fw-semibold text-primary">
                                                                    {batch.supplierName ?? <span className="text-muted fst-italic">Unknown</span>}
                                                                </span>
                                                            </td>
                                                            <td className="fw-semibold">{batch.lotNumber}</td>
                                                            <td>{batch.quantityOnHand}</td>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-1">
                                                                    <FiCalendar size={14} />
                                                                    {formatDate(batch.expireDate)}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-1">
                                                                    <FiDollarSign size={14} />
                                                                    {batch.costPrice.toLocaleString()} LKR
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-1 text-success">
                                                                    <FiDollarSign size={14} />
                                                                    {batch.sellingPrice.toLocaleString()} LKR
                                                                </div>
                                                            </td>
                                                            <td className="text-end">
                                                                <button
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={() => handleEditPrice(batch)}
                                                                    title="Edit Prices"
                                                                >
                                                                    <FiEdit2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="alert alert-info">
                                            <FiLayers className="me-2" />
                                            No stock batches available
                                        </div>
                                    )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Edit Price Modal */}
            {showEditPriceModal && selectedBatch && (
                <>
                    <div
                        className={`modal fade ${showEditPriceModal ? 'show' : ''}`}
                        style={{ display: showEditPriceModal ? 'block' : 'none' }}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="editPriceModalLabel"
                    >
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold" id="editPriceModalLabel">
                                        <FiDollarSign className="me-2" />
                                        Edit Stock Prices - Lot {selectedBatch.lotNumber}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setShowEditPriceModal(false);
                                            setSelectedBatch(null);
                                        }}
                                        aria-label="Close"
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Cost Price (LKR)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            step="0.01"
                                            min="0"
                                            value={priceFormData.costPrice}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => setPriceFormData({
                                                ...priceFormData,
                                                costPrice: parseFloat(e.target.value) || 0
                                            })}
                                            placeholder="Enter cost price"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Selling Price (LKR)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            step="0.01"
                                            min="0"
                                            value={priceFormData.sellingPrice}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => setPriceFormData({
                                                ...priceFormData,
                                                sellingPrice: parseFloat(e.target.value) || 0
                                            })}
                                            placeholder="Enter selling price"
                                        />
                                    </div>
                                    <div className="alert alert-info">
                                        <FiInfo className="me-2" />
                                        <small>Current: Cost Price: {selectedBatch.costPrice.toLocaleString()} LKR | Selling Price: {selectedBatch.sellingPrice.toLocaleString()} LKR</small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowEditPriceModal(false);
                                            setSelectedBatch(null);
                                        }}
                                    >
                                        <FiX className="me-2" />
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleUpdatePrice}
                                    >
                                        <FiDollarSign className="me-2" />
                                        Update Prices
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {showEditPriceModal && (
                        <div
                            className="modal-backdrop fade show"
                            onClick={() => {
                                setShowEditPriceModal(false);
                                setSelectedBatch(null);
                            }}
                            style={{ zIndex: 1040 }}
                        ></div>
                    )}
                </>
            )}
            
            <Footer />
        </>
    );
};

export default InventoryView;

