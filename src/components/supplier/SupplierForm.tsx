import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supplierService, CreateSupplierRequest, UpdateSupplierRequest } from '@/services/supplierService';
import Swal from 'sweetalert2';
import { FiTruck, FiEdit3 } from 'react-icons/fi';

interface SupplierFormProps {
    onSuccess?: () => void;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ onSuccess }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const supplierId = searchParams.get('edit');
    const isEditMode = !!supplierId;

    const [formData, setFormData] = useState<CreateSupplierRequest>({
        supplierName: '',
        contactPerson: '',
        contactNumber: '',
        emailAddress: '',
        address: '',
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: '',
        bankBranchName: '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CreateSupplierRequest, string>>>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    // Fetch supplier data if in edit mode
    useEffect(() => {
        if (isEditMode && supplierId) {
            fetchSupplierData();
        }
    }, [supplierId, isEditMode]);

    const fetchSupplierData = async () => {
        if (!supplierId) return;

        try {
            setFetching(true);
            const supplier = await supplierService.getSupplierById(supplierId);
            setFormData({
                supplierName: supplier.supplierName || '',
                contactPerson: supplier.contactPerson || '',
                contactNumber: supplier.contactNumber || '',
                emailAddress: supplier.emailAddress || '',
                address: supplier.address || '',
                bankName: supplier.bankName || '',
                bankAccountName: supplier.bankAccountName || '',
                bankAccountNumber: supplier.bankAccountNumber || '',
                bankBranchName: supplier.bankBranchName || '',
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error instanceof Error ? error.message : 'Failed to load supplier data',
            });
            navigate('/supplier/list');
        } finally {
            setFetching(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof CreateSupplierRequest, string>> = {};

        if (!formData.supplierName.trim()) {
            newErrors.supplierName = 'Supplier name is required';
        }

        if (!formData.contactPerson.trim()) {
            newErrors.contactPerson = 'Contact person is required';
        }

        if (!formData.contactNumber.trim()) {
            newErrors.contactNumber = 'Contact number is required';
        } else if (!/^\d{10}$/.test(formData.contactNumber.trim())) {
            newErrors.contactNumber = 'Contact number must be exactly 10 digits';
        }

        if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
            newErrors.emailAddress = 'Invalid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            // Prepare form data with default email if empty
            const submitData = {
                ...formData,
                emailAddress: (formData.emailAddress || '').trim() || 'default@gmail.com',
            };

            if (isEditMode && supplierId) {
                await supplierService.updateSupplier(supplierId, submitData);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Supplier updated successfully',
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                await supplierService.createSupplier(submitData);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Supplier created successfully',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/supplier/list');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} supplier`,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name as keyof CreateSupplierRequest]) {
            setErrors((prev) => ({ ...prev, [name as keyof CreateSupplierRequest]: undefined }));
        }
    };

    if (fetching) {
        return (
            <div className="col-lg-12">
                <div className="card">
                    <div className="card-body text-center" style={{ minHeight: '400px' }}>
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="col-lg-12">
            <div className="card">
                <div className="card-header">
                    <div className="d-flex align-items-center gap-3 my-3">
                        <div className="avatar avatar-md bg-light-primary">
                            {isEditMode ? (
                                <FiEdit3 size={18} className="text-primary" />
                            ) : (
                                <FiTruck size={18} className="text-primary" />
                            )}
                        </div>
                        <div>
                            <h5 className="card-title mb-1 fw-bold">
                                {isEditMode ? 'Edit Supplier' : 'Create New Supplier'}
                            </h5>
                            <p className="text-muted mb-0 fs-12">
                                {isEditMode
                                    ? 'Update supplier information and details'
                                    : 'Add a new supplier to the system'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row mb-4">
                            <h6 className="mb-3">Basic Information</h6>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="supplierName" className="form-label">
                                    Supplier Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="supplierName"
                                    name="supplierName"
                                    className={`form-control ${errors.supplierName ? 'is-invalid' : ''}`}
                                    placeholder="Enter supplier name"
                                    value={formData.supplierName}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                                {errors.supplierName && (
                                    <div className="invalid-feedback">{errors.supplierName}</div>
                                )}
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="contactPerson" className="form-label">
                                    Contact Person<span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="contactPerson"
                                    name="contactPerson"
                                    className={`form-control ${errors.contactPerson ? 'is-invalid' : ''}`}
                                    placeholder="Enter contact person name"
                                    value={formData.contactPerson}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                                {errors.contactPerson && (
                                    <div className="invalid-feedback">{errors.contactPerson}</div>
                                )}
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="contactNumber" className="form-label">
                                    Contact Number <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="contactNumber"
                                    name="contactNumber"
                                    className={`form-control ${errors.contactNumber ? 'is-invalid' : ''}`}
                                    placeholder="Enter contact number"
                                    value={formData.contactNumber}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                                {errors.contactNumber && (
                                    <div className="invalid-feedback">{errors.contactNumber}</div>
                                )}
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="emailAddress" className="form-label">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="emailAddress"
                                    name="emailAddress"
                                    className={`form-control ${errors.emailAddress ? 'is-invalid' : ''}`}
                                    placeholder="Enter email address"
                                    value={formData.emailAddress}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                {errors.emailAddress && (
                                    <div className="invalid-feedback">{errors.emailAddress}</div>
                                )}
                            </div>

                            <div className="col-12 mb-3">
                                <label htmlFor="address" className="form-label">
                                    Address
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    className="form-control"
                                    rows={3}
                                    placeholder="Enter address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="row mb-4">
                            <h6 className="mb-3">Bank Information</h6>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="bankName" className="form-label">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    id="bankName"
                                    name="bankName"
                                    className="form-control"
                                    placeholder="Enter bank name"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="bankAccountName" className="form-label">
                                    Bank Account Name
                                </label>
                                <input
                                    type="text"
                                    id="bankAccountName"
                                    name="bankAccountName"
                                    className="form-control"
                                    placeholder="Enter bank account name"
                                    value={formData.bankAccountName}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="bankAccountNumber" className="form-label">
                                    Bank Account Number
                                </label>
                                <input
                                    type="text"
                                    id="bankAccountNumber"
                                    name="bankAccountNumber"
                                    className="form-control"
                                    placeholder="Enter bank account number"
                                    value={formData.bankAccountNumber}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="bankBranchName" className="form-label">
                                    Bank Branch Name
                                </label>
                                <input
                                    type="text"
                                    id="bankBranchName"
                                    name="bankBranchName"
                                    className="form-control"
                                    placeholder="Enter bank branch name"
                                    value={formData.bankBranchName}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={() => navigate('/supplier/list')}
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
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Update Supplier' : 'Create Supplier'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SupplierForm;

