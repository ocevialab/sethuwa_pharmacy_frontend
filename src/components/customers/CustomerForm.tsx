import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { customerService, Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/services/customerService';
import { customerListStatusOptions } from '@/utils/options';
import Swal from 'sweetalert2';
import Input from '@/components/shared/Input';
import SelectDropdown from '@/components/shared/SelectDropdown';
import { FiUserPlus, FiEdit3 } from 'react-icons/fi';

interface CustomerFormProps {
    onSuccess?: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onSuccess }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const customerId = searchParams.get('id');
    const isEditMode = !!customerId;

    const [formData, setFormData] = useState<CreateCustomerRequest>({
        customerName: '',
        contactNumber: '',
        emailAddress: '',
        address: '',
        discount: 0,
        customerStatus: 'Active',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CreateCustomerRequest, string>>>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    // Fetch customer data if in edit mode
    useEffect(() => {
        if (isEditMode && customerId) {
            fetchCustomerData();
        }
    }, [customerId, isEditMode]);

    const fetchCustomerData = async () => {
        if (!customerId) return;

        try {
            setFetching(true);
            const customer = await customerService.getCustomerById(customerId);
            setFormData({
                customerName: customer.customerName,
                contactNumber: customer.contactNumber,
                emailAddress: customer.emailAddress || '',
                address: customer.address,
                discount: customer.discount,
                customerStatus: customer.customerStatus,
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error instanceof Error ? error.message : 'Failed to load customer data',
            });
            navigate('/customers/list');
        } finally {
            setFetching(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof CreateCustomerRequest, string>> = {};

        if (!formData.customerName.trim()) {
            newErrors.customerName = 'Customer name is required';
        }

        if (!formData.contactNumber.trim()) {
            newErrors.contactNumber = 'Contact number is required';
        } else if (!/^[0-9+\-\s()]+$/.test(formData.contactNumber)) {
            newErrors.contactNumber = 'Invalid contact number format';
        }

        if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
            newErrors.emailAddress = 'Invalid email address';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (formData.discount < 0 || formData.discount > 100) {
            newErrors.discount = 'Discount must be between 0 and 100';
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

            const submitData = {
                ...formData,
                emailAddress: formData.emailAddress || null,
            };

            if (isEditMode && customerId) {
                await customerService.updateCustomer(customerId, submitData);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Customer updated successfully',
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                await customerService.createCustomer(submitData);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Customer created successfully',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/customers/list');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error instanceof Error ? error.message : 'Failed to save customer',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: CreateCustomerRequest) => ({
            ...prev,
            [name]: name === 'discount' ? parseFloat(value) || 0 : value,
        }));

        // Clear error when user starts typing
        if (errors[name as keyof typeof errors]) {
            setErrors((prev: Partial<Record<keyof CreateCustomerRequest, string>>) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const handleStatusChange = (option: any) => {
        // Ensure status is only Active or Inactive
        const status = option.value === 'active' ? 'Active' : 'Inactive';
        setFormData((prev: CreateCustomerRequest) => ({
            ...prev,
            customerStatus: status as 'Active' | 'Inactive',
        }));
    };

    if (fetching) {
        return (
            <div className="col-lg-12">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
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
                                <FiUserPlus size={18} className="text-primary" />
                            )}
                        </div>
                        <div>
                            <h5 className="card-title mb-1 fw-bold">
                                {isEditMode ? 'Edit Customer' : 'Create New Customer'}
                            </h5>
                            <p className="text-muted mb-0 fs-12">
                                {isEditMode 
                                    ? 'Update customer information and details' 
                                    : 'Add a new customer to the system'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="customerName" className="form-label">
                                    Customer Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="customerName"
                                    name="customerName"
                                    className={`form-control ${errors.customerName ? 'is-invalid' : ''}`}
                                    placeholder="Enter customer name"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                                {errors.customerName && (
                                    <div className="invalid-feedback">{errors.customerName}</div>
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
                                    value={formData.emailAddress || ''}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                {errors.emailAddress && (
                                    <div className="invalid-feedback">{errors.emailAddress}</div>
                                )}
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="discount" className="form-label">
                                    Discount (%)
                                </label>
                                <input
                                    type="number"
                                    id="discount"
                                    name="discount"
                                    className={`form-control ${errors.discount ? 'is-invalid' : ''}`}
                                    placeholder="Enter discount percentage"
                                    value={formData.discount}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    disabled={loading}
                                />
                                {errors.discount && (
                                    <div className="invalid-feedback">{errors.discount}</div>
                                )}
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="address" className="form-label">
                                    Address <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                    placeholder="Enter address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={3}
                                    required
                                    disabled={loading}
                                />
                                {errors.address && (
                                    <div className="invalid-feedback">{errors.address}</div>
                                )}
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="customerStatus" className="form-label">
                                    Status
                                </label>
                                <SelectDropdown
                                    options={customerListStatusOptions}
                                    defaultSelect={formData.customerStatus.toLowerCase()}
                                    selectedOption={customerListStatusOptions.find(
                                        opt => opt.value === formData.customerStatus.toLowerCase()
                                    )}
                                    onSelectOption={handleStatusChange}
                                    className=""
                                />
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={() => navigate('/customers/list')}
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
                                    isEditMode ? 'Update Customer' : 'Create Customer'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomerForm;

