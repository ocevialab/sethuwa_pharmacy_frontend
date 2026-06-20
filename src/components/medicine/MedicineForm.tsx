import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  medicineService,
  CreateMedicineRequest,
  UpdateMedicineRequest,
} from "@/services/medicineService";
import Swal from "sweetalert2";
import { FiPackage, FiEdit3 } from "react-icons/fi";
import BarcodeInput from "@/components/shared/BarcodeInput";
import BarcodeLabelActions from "@/components/medicine/BarcodeLabelActions";

interface MedicineFormProps {
  onSuccess?: () => void;
}

const MedicineForm: React.FC<MedicineFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [formData, setFormData] = useState<CreateMedicineRequest>({
    name: "",
    brandName: "",
    genericName: "",
    manufacture: "",
    category: "",
    strength: "",
    requiredPrescription: false,
    lowStockThreshold: 0,
    isDeleted: false,
    barcode: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateMedicineRequest, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [savedMedicineId, setSavedMedicineId] = useState<string | null>(editId);

  useEffect(() => {
    if (editId) setSavedMedicineId(editId);
  }, [editId]);

  // Fetch medicine data in edit mode
  useEffect(() => {
    if (isEditMode && editId) {
      fetchMedicineData();
    }
  }, [isEditMode, editId]);

  const fetchMedicineData = async () => {
    if (!editId) return;
    try {
      setFetching(true);
      const medicine = await medicineService.getMedicineById(editId);
      setFormData({
        name: medicine.name || "",
        brandName: medicine.brandName || "",
        genericName: medicine.genericName || "",
        manufacture: medicine.manufacture || "",
        category: medicine.category || "",
        strength: medicine.strength || "",
        requiredPrescription: medicine.requiredPrescription || false,
        lowStockThreshold: medicine.lowStockThreshold || 0,
        isDeleted: medicine.isDeleted || false,
        barcode: medicine.barcode || "",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to load medicine data",
      });
      navigate("/medicine/list");
    } finally {
      setFetching(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateMedicineRequest, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.lowStockThreshold < 0) {
      newErrors.lowStockThreshold = "Low stock threshold must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildSubmitData = (): CreateMedicineRequest => ({
    ...formData,
    barcode: formData.barcode?.trim() || undefined,
  });

  /** Save or create medicine; used by barcode actions and returns medicine id */
  const ensureMedicineSaved = async (): Promise<string> => {
    if (!validateForm()) {
      throw new Error("Medicine name is required before saving a barcode.");
    }

    const submitData = buildSubmitData();

    if (savedMedicineId) {
      await medicineService.updateMedicine(
        savedMedicineId,
        submitData as UpdateMedicineRequest
      );
      return savedMedicineId;
    }

    const created = await medicineService.createMedicine(submitData);
    const newId = created.medicineId;
    if (!newId) {
      throw new Error("Medicine was saved but no ID was returned.");
    }

    setSavedMedicineId(newId);
    window.history.replaceState(
      null,
      "",
      `/medicine/create?edit=${encodeURIComponent(newId)}`
    );
    return newId;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = buildSubmitData();

      if (savedMedicineId) {
        await medicineService.updateMedicine(
          savedMedicineId,
          submitData as UpdateMedicineRequest
        );
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Medicine updated successfully",
          timer: 2000,
          showConfirmButton: false,
        });

        if (onSuccess) {
          onSuccess();
        }
        return;
      } else {
        const created = await medicineService.createMedicine(submitData);
        const newId = created.medicineId ?? null;
        if (newId) {
          setSavedMedicineId(newId);
        }
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Medicine created successfully",
          timer: 2000,
          showConfirmButton: false,
        });

        if (onSuccess) {
          onSuccess();
        } else if (newId) {
          navigate(`/medicine/create?edit=${newId}`, { replace: true });
        } else {
          navigate("/medicine/list");
        }
        return;
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditMode ? "update" : "save"} medicine`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev: CreateMedicineRequest) => ({
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
        (prev: Partial<Record<keyof CreateMedicineRequest, string>>) => ({
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
                {isEditMode ? "Edit Medicine" : "Create New Medicine"}
              </h5>
              <p className="text-muted mb-0 fs-12">
                {isEditMode
                  ? "Update medicine information"
                  : "Add a new medicine to the system"}
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
                  placeholder="Enter medicine name"
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
                  Brand Name
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
                  disabled={loading}
                />
                {errors.brandName && (
                  <div className="invalid-feedback">{errors.brandName}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="genericName" className="form-label">
                  Generic Name
                </label>
                <input
                  type="text"
                  id="genericName"
                  name="genericName"
                  className={`form-control ${
                    errors.genericName ? "is-invalid" : ""
                  }`}
                  placeholder="Enter generic name"
                  value={formData.genericName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.genericName && (
                  <div className="invalid-feedback">{errors.genericName}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="manufacture" className="form-label">
                  Manufacture
                </label>
                <input
                  type="text"
                  id="manufacture"
                  name="manufacture"
                  className={`form-control ${
                    errors.manufacture ? "is-invalid" : ""
                  }`}
                  placeholder="Enter manufacture"
                  value={formData.manufacture}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.manufacture && (
                  <div className="invalid-feedback">{errors.manufacture}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="category" className="form-label">
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  className={`form-control ${
                    errors.category ? "is-invalid" : ""
                  }`}
                  placeholder="Enter category (e.g., Tablets, Caplets)"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.category && (
                  <div className="invalid-feedback">{errors.category}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="strength" className="form-label">
                  Strength
                </label>
                <input
                  type="text"
                  id="strength"
                  name="strength"
                  className={`form-control ${
                    errors.strength ? "is-invalid" : ""
                  }`}
                  placeholder="Enter strength (e.g., 200 mg)"
                  value={formData.strength}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.strength && (
                  <div className="invalid-feedback">{errors.strength}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="lowStockThreshold" className="form-label">
                  Low Stock Threshold
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
                  disabled={loading}
                />
                {errors.lowStockThreshold && (
                  <div className="invalid-feedback">
                    {errors.lowStockThreshold}
                  </div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="barcode" className="form-label">
                  Barcode
                </label>
                <BarcodeInput
                  id="barcode"
                  name="barcode"
                  value={formData.barcode || ""}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, barcode: value }))
                  }
                  placeholder="Enter barcode or scan with camera"
                  disabled={loading}
                  className={errors.barcode ? "is-invalid" : ""}
                />
                {errors.barcode && (
                  <div className="invalid-feedback">{errors.barcode}</div>
                )}
                <small className="form-text text-muted">
                  Scan with camera, type manually, or use a USB scanner — the value
                  appears in this field.
                </small>
                <BarcodeLabelActions
                  medicineId={savedMedicineId}
                  medicineName={formData.name}
                  barcode={formData.barcode}
                  onBarcodeChange={(value) =>
                    setFormData((prev) => ({ ...prev, barcode: value }))
                  }
                  onEnsureSaved={ensureMedicineSaved}
                  disabled={loading || fetching}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Required Prescription <span className="text-danger">*</span>
                </label>
                <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="requiredPrescription"
                    name="requiredPrescription"
                    checked={formData.requiredPrescription}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="requiredPrescription"
                  >
                    {formData.requiredPrescription ? "Yes" : "No"}
                  </label>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => navigate("/medicine/list")}
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
                  "Update Medicine"
                ) : (
                  "Create Medicine"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MedicineForm;
