import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  glossaryService,
  CreateGlossaryRequest,
  UpdateGlossaryRequest,
} from "@/services/glossaryService";
import Swal from "sweetalert2";
import { FiPackage, FiEdit3 } from "react-icons/fi";

interface GlossaryFormProps {
  onSuccess?: () => void;
}

const GlossaryForm: React.FC<GlossaryFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [formData, setFormData] = useState<CreateGlossaryRequest>({
    name: "",
    brandName: "",
    lowStockThreshold: 0,
    isDeleted: false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateGlossaryRequest, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch glossary data in edit mode
  useEffect(() => {
    if (isEditMode && editId) {
      fetchGlossaryData();
    }
  }, [isEditMode, editId]);

  const fetchGlossaryData = async () => {
    if (!editId) return;
    try {
      setFetching(true);
      const glossary = await glossaryService.getGlossaryById(editId);
      setFormData({
        name: glossary.name || "",
        brandName: glossary.brandName || "",
        lowStockThreshold: glossary.lowStockThreshold || 0,
        isDeleted: glossary.isDeleted || false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to load grocery data",
      });
      navigate("/glossary/list");
    } finally {
      setFetching(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateGlossaryRequest, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.brandName.trim()) {
      newErrors.brandName = "Brand name is required";
    }

    if (formData.lowStockThreshold < 0) {
      newErrors.lowStockThreshold = "Low stock threshold must be 0 or greater";
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

      if (isEditMode && editId) {
        const updateData: UpdateGlossaryRequest = {
          name: formData.name,
          brandName: formData.brandName,
          lowStockThreshold: formData.lowStockThreshold,
        };
        await glossaryService.updateGlossary(editId, updateData);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Grocery updated successfully",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await glossaryService.createGlossary(formData);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Grocery created successfully",
          timer: 2000,
          showConfirmButton: false,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/glossary/list");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditMode ? "update" : "save"} grocery`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: CreateGlossaryRequest) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "lowStockThreshold"
          ? parseInt(value) || 0
          : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(
        (prev: Partial<Record<keyof CreateGlossaryRequest, string>>) => ({
          ...prev,
          [name]: undefined,
        })
      );
    }
  };

  if (fetching) {
    return (
      <div className="col-lg-12">
        <div className="card">
          <div
            className="card-body text-center"
            style={{
              minHeight: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
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
                <FiPackage size={18} className="text-primary" />
              )}
            </div>
            <div>
              <h5 className="card-title mb-1 fw-bold">
                {isEditMode ? "Edit Groceries" : "Create New Groceries"}
              </h5>
              <p className="text-muted mb-0 fs-12">
                {isEditMode
                  ? "Update grocery information"
                  : "Add a new grocery item to the system"}
              </p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="name" className="form-label">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  placeholder="Enter grocery name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                {errors.name && (
                  <div className="invalid-feedback">{errors.name}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="brandName" className="form-label">
                  Brand Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="brandName"
                  name="brandName"
                  className={`form-control ${
                    errors.brandName ? "is-invalid" : ""
                  }`}
                  placeholder="Enter brand name"
                  value={formData.brandName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                {errors.brandName && (
                  <div className="invalid-feedback">{errors.brandName}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="lowStockThreshold" className="form-label">
                  Low Stock Threshold <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  className={`form-control ${
                    errors.lowStockThreshold ? "is-invalid" : ""
                  }`}
                  placeholder="Enter low stock threshold"
                  value={formData.lowStockThreshold}
                  onChange={handleChange}
                  min="0"
                  required
                  disabled={loading}
                />
                {errors.lowStockThreshold && (
                  <div className="invalid-feedback">
                    {errors.lowStockThreshold}
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => navigate("/glossary/list")}
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
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : isEditMode ? (
                  "Update Groceries"
                ) : (
                  "Create Groceries"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GlossaryForm;
