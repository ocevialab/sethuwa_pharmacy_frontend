import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  FormEvent,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  employeeService,
  Employee,
  EmployeeWithPermissions,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "@/services/employeeService";
import {
  employeeListStatusOptions,
  getEmployeeRoleOptions,
} from "@/utils/options";
import Swal from "sweetalert2";
import SelectDropdown from "@/components/shared/SelectDropdown";
import PermissionMatrix from "@/components/shared/PermissionMatrix";
import EmployeePermissionsView from "@/components/shared/EmployeePermissionsView";
import { FiUserPlus, FiEdit3, FiEye, FiEyeOff, FiShield } from "react-icons/fi";
import { permissionService, Permission } from "@/services/permissionService";
import { useAuth } from "@/context/AuthContext";

function isOwnerRole(role: unknown): boolean {
  if (role == null) return false;
  return String(role).trim().toLowerCase() === "owner";
}

interface EmployeeFormProps {
  onSuccess?: () => void;
}

// Mandatory permissions that cannot be removed
const MANDATORY_PERMISSION_IDS = [
  "permission:view",
  "employee:view_permissions",
  "employee:view", // View Employee (themself info)
];

// Default permission IDs that should be selected for all new employees
const getDefaultPermissionIds = async (): Promise<string[]> => {
  try {
    const allPermissions = await permissionService.getAllPermissions();

    // Helper function to check if permission ID matches any pattern
    const matchesPattern = (permissionId: string): boolean => {
      // Employee: change password, view employee
      if (permissionId === "employee:change_password") return true;
      if (
        permissionId === "employee:view" ||
        permissionId === "employee:get_by_id"
      )
        return true;

      // Glossary: view glossary, view deleted glossary (user mentioned "gallery" which is likely "glossary")
      if (
        permissionId === "glossary:view" ||
        permissionId === "glossary:get_by_id"
      )
        return true;
      if (
        permissionId === "glossary:view_deleted" ||
        permissionId === "glossary:get_deleted"
      )
        return true;

      // Inventory: all three inventory permissions
      if (
        permissionId.startsWith("inventory:view_all") ||
        permissionId.startsWith("inventory:get_all_inventory")
      )
        return true;
      if (
        permissionId.startsWith("inventory:view_details") ||
        permissionId.startsWith("inventory:get_item_details")
      )
        return true;
      if (
        permissionId.startsWith("inventory:view_list") ||
        permissionId.startsWith("inventory:get_product_list")
      )
        return true;

      // Medicine: view medicine, view deleted medicine, view medicine summary
      if (
        permissionId === "medicine:view" ||
        permissionId === "medicine:get_by_id"
      )
        return true;
      if (
        permissionId === "medicine:view_deleted" ||
        permissionId === "medicine:get_deleted"
      )
        return true;
      if (
        permissionId === "medicine:view_summary" ||
        permissionId === "medicine:get_summary"
      )
        return true;

      // Sales: all sales permissions
      if (permissionId.startsWith("sales:")) return true;

      return false;
    };

    // Filter permissions that match the criteria
    const defaultPermissionIds = allPermissions
      .filter((permission) => matchesPattern(permission.permissionId))
      .map((permission) => permission.permissionId);

    return defaultPermissionIds;
  } catch (error) {
    console.error("Failed to fetch default permissions:", error);
    return [];
  }
};

/** Create flow: OWNER → all permissions; other roles → default subset + mandatory. */
async function getPermissionIdsForNewEmployeeRole(
  role: string
): Promise<string[]> {
  if (isOwnerRole(role)) {
    const all = await permissionService.getAllPermissions();
    return [
      ...new Set([
        ...all.map((p) => p.permissionId),
        ...MANDATORY_PERMISSION_IDS,
      ]),
    ];
  }
  const defaultIds = await getDefaultPermissionIds();
  return [...new Set([...defaultIds, ...MANDATORY_PERMISSION_IDS])];
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const employeeId = searchParams.get("id");
  const isViewMode = searchParams.get("view") === "true";
  const isEditMode = !!employeeId && !isViewMode;

  // Get initial role from localStorage
  const getInitialRole = () => {
    try {
      const role = localStorage.getItem("pharmacy_role");
      return role === "OWNER" ? "OWNER" : "";
    } catch {
      return "";
    }
  };

  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    employeeName: "",
    role: getInitialRole(),
    contactNumber: "",
    emailAddress: "",
    address: "",
    employeeStatus: "Active",
    password: "",
    permissionIds: [],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateEmployeeRequest, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [roleOptions, setRoleOptions] = useState(getEmployeeRoleOptions());
  const [showPassword, setShowPassword] = useState(false);
  const [defaultPermissionIds, setDefaultPermissionIds] = useState<string[]>(
    []
  );
  const [employeePermissions, setEmployeePermissions] = useState<
    EmployeeWithPermissions["permissions"]
  >([]);

  // Set default permissions and role when component mounts (only for new employees)
  useEffect(() => {
    const initializeDefaults = async () => {
      if (!isEditMode) {
        const options = getEmployeeRoleOptions();
        setRoleOptions(options);

        let effectiveRole = formData.role;
        if (options.length > 0 && !effectiveRole) {
          effectiveRole = options[0].value.toUpperCase();
        }

        const permissionIds = await getPermissionIdsForNewEmployeeRole(
          effectiveRole
        );
        const patternDefaults = await getDefaultPermissionIds();
        setDefaultPermissionIds(
          isOwnerRole(effectiveRole) ? permissionIds : patternDefaults
        );

        setFormData((prev) => ({
          ...prev,
          role: effectiveRole,
          permissionIds,
        }));
      } else {
        const options = getEmployeeRoleOptions();
        setRoleOptions(options);
      }
    };

    initializeDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch employee data if in edit or view mode
  useEffect(() => {
    if ((isEditMode || isViewMode) && employeeId) {
      if (isViewMode) {
        fetchEmployeeWithPermissions();
      } else {
        fetchEmployeeData();
      }
    }
  }, [employeeId, isEditMode, isViewMode]);

  const fetchEmployeeData = async () => {
    if (!employeeId) return;

    try {
      setFetching(true);
      const employee = await employeeService.getEmployeeById(employeeId);
      setFormData({
        employeeName: employee.employeeName,
        role: employee.role,
        contactNumber: employee.contactNumber,
        emailAddress: employee.emailAddress || "",
        address: employee.address || "",
        employeeStatus: employee.employeeStatus,
        password: "", // Don't fetch password
        permissionIds: [], // Permissions are managed separately in edit mode
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to load employee data",
      });
      navigate("/employees/list");
    } finally {
      setFetching(false);
    }
  };

  const fetchEmployeeWithPermissions = async () => {
    if (!employeeId) return;

    try {
      setFetching(true);
      const employeeWithPermissions =
        await employeeService.getEmployeeWithPermissions(employeeId);
      setFormData({
        employeeName: employeeWithPermissions.employeeName,
        role: employeeWithPermissions.role,
        contactNumber: employeeWithPermissions.contactNumber,
        emailAddress: employeeWithPermissions.emailAddress || "",
        address: employeeWithPermissions.address || "",
        employeeStatus: employeeWithPermissions.employeeStatus,
        password: "", // Don't fetch password
        permissionIds: [], // Not needed in view mode
      });
      setEmployeePermissions(employeeWithPermissions.permissions || []);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to load employee data",
      });
      navigate("/employees/list");
    } finally {
      setFetching(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateEmployeeRequest, string>> = {};

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = "Employee name is required";
    }

    if (!formData.role.trim()) {
      newErrors.role = "Role is required";
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^[0-9+\-\s()]+$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Invalid contact number format";
    }

    if (formData.emailAddress && formData.emailAddress.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.emailAddress.trim())) {
        newErrors.emailAddress = "Invalid email address format";
      }
    }

    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (!isEditMode && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (
      isEditMode &&
      employeeId &&
      formData.employeeStatus === "Inactive" &&
      user?.employeeId === employeeId &&
      isOwnerRole(user.role)
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Not allowed",
        text: "You cannot deactivate your own owner account.",
        confirmButtonColor: "#3454d1",
      });
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && employeeId) {
        // Update employee - exclude password from update
        const updateData: UpdateEmployeeRequest = {
          employeeName: formData.employeeName,
          role: formData.role,
          contactNumber: formData.contactNumber,
          emailAddress: formData.emailAddress || null,
          address: formData.address || null,
          employeeStatus: formData.employeeStatus,
        };
        await employeeService.updateEmployee(employeeId, updateData);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Employee updated successfully",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Create employee
        await employeeService.createEmployee(formData);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Employee created successfully",
          timer: 2000,
          showConfirmButton: false,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/employees/list");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : isEditMode
            ? "Failed to update employee"
            : "Failed to create employee",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: CreateEmployeeRequest) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(
        (prev: Partial<Record<keyof CreateEmployeeRequest, string>>) => ({
          ...prev,
          [name]: undefined,
        })
      );
    }
  };

  const handleStatusChange = (option: any) => {
    const status: "Active" | "Inactive" =
      option.value === "active" ? "Active" : "Inactive";
    if (
      status === "Inactive" &&
      employeeId &&
      user?.employeeId === employeeId &&
      isOwnerRole(user.role)
    ) {
      void Swal.fire({
        icon: "warning",
        title: "Not allowed",
        text: "You cannot deactivate your own owner account.",
        confirmButtonColor: "#3454d1",
      });
      return;
    }
    setFormData((prev: CreateEmployeeRequest) => ({
      ...prev,
      employeeStatus: status,
    }));
  };

  const employeeStatusFieldOptions = useMemo(() => {
    const isSelfOwner =
      isEditMode &&
      !!employeeId &&
      user?.employeeId === employeeId &&
      isOwnerRole(user.role);
    const currentIsActive = formData.employeeStatus === "Active";
    if (!isSelfOwner || !currentIsActive) return employeeListStatusOptions;
    return employeeListStatusOptions.map((opt) =>
      opt.value === "inactive"
        ? {
            ...opt,
            disabled: true,
            disabledReason: "You cannot deactivate your own owner account.",
          }
        : opt
    );
  }, [
    isEditMode,
    employeeId,
    user?.employeeId,
    user?.role,
    formData.employeeStatus,
  ]);

  const handleRoleChange = useCallback(
    (option: any) => {
      const newRole = option.value.toUpperCase();
      setFormData((prev: CreateEmployeeRequest) => ({
        ...prev,
        role: newRole,
      }));

      if (isEditMode || isViewMode) return;

      void (async () => {
        try {
          const permissionIds = await getPermissionIdsForNewEmployeeRole(
            newRole
          );
          const patternDefaults = await getDefaultPermissionIds();
          setDefaultPermissionIds(
            isOwnerRole(newRole) ? permissionIds : patternDefaults
          );
          setFormData((prev) => ({
            ...prev,
            role: newRole,
            permissionIds,
          }));
        } catch (e) {
          console.error("Failed to load permissions for role", e);
        }
      })();
    },
    [isEditMode, isViewMode]
  );

  const handlePermissionChange = (permissionIds: string[]) => {
    // Ensure mandatory permissions are always included
    const updatedPermissionIds = [
      ...new Set([...permissionIds, ...MANDATORY_PERMISSION_IDS]),
    ];
    setFormData((prev: CreateEmployeeRequest) => ({
      ...prev,
      permissionIds: updatedPermissionIds,
    }));
  };

  if (fetching) {
    return (
      <div className="col-lg-12">
        <div className="card">
          <div className="card-body">
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
    );
  }

  return (
    <div className="col-lg-12">
      <div className="card">
        <div className="card-header">
          <div className="d-flex align-items-center justify-content-between w-100 my-3">
            <div className="d-flex align-items-center gap-3">
              <div className="avatar avatar-md bg-light-primary">
                {isViewMode ? (
                  <FiEye size={18} className="text-primary" />
                ) : isEditMode ? (
                  <FiEdit3 size={18} className="text-primary" />
                ) : (
                  <FiUserPlus size={18} className="text-primary" />
                )}
              </div>
              <div>
                <h5 className="card-title mb-1 fw-bold">
                  {isViewMode
                    ? "View Employee"
                    : isEditMode
                    ? "Edit Employee"
                    : "Create New Employee"}
                </h5>
                <p className="text-muted mb-0 fs-12">
                  {isViewMode
                    ? "View employee information and permissions"
                    : isEditMode
                    ? "Update employee information and details"
                    : "Add a new employee to the system"}
                </p>
              </div>
            </div>
            {isViewMode && employeeId && (
              <div className="ms-auto d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() =>
                    navigate(`/employees/permissions/edit?id=${employeeId}`)
                  }
                >
                  <FiShield className="me-2" />
                  Edit Permissions
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate(`/employees/create?id=${employeeId}`)}
                >
                  <FiEdit3 className="me-2" />
                  Edit Employee
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="employeeName" className="form-label">
                  Employee Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="employeeName"
                  name="employeeName"
                  className={`form-control ${
                    errors.employeeName ? "is-invalid" : ""
                  }`}
                  placeholder="Enter employee name"
                  value={formData.employeeName}
                  onChange={handleChange}
                  required
                  disabled={loading || isViewMode}
                  readOnly={isViewMode}
                />
                {errors.employeeName && (
                  <div className="invalid-feedback">{errors.employeeName}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="role" className="form-label">
                  Role <span className="text-danger">*</span>
                </label>
                {roleOptions.length > 0 ? (
                  <SelectDropdown
                    options={roleOptions}
                    defaultSelect={
                      formData.role
                        ? formData.role.toLowerCase()
                        : roleOptions[0].value.toLowerCase()
                    }
                    selectedOption={
                      roleOptions.find(
                        (opt) =>
                          opt.value.toUpperCase() ===
                          formData.role.toUpperCase()
                      ) || roleOptions[0]
                    }
                    onSelectOption={handleRoleChange}
                    className={isViewMode ? "disabled" : ""}
                  />
                ) : (
                  <div className="alert alert-warning py-2">
                    <small>
                      No role options available. Please ensure you are logged in
                      as OWNER.
                    </small>
                  </div>
                )}
                {errors.role && (
                  <div className="text-danger fs-12 mt-1">{errors.role}</div>
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
                  className={`form-control ${
                    errors.contactNumber ? "is-invalid" : ""
                  }`}
                  placeholder="Enter contact number"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  disabled={loading || isViewMode}
                  readOnly={isViewMode}
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
                  className={`form-control ${
                    errors.emailAddress ? "is-invalid" : ""
                  }`}
                  placeholder="Enter email address"
                  value={formData.emailAddress || ""}
                  onChange={handleChange}
                  disabled={loading || isViewMode}
                  readOnly={isViewMode}
                />
                {errors.emailAddress && (
                  <div className="invalid-feedback">{errors.emailAddress}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="address" className="form-label">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  className={`form-control ${
                    errors.address ? "is-invalid" : ""
                  }`}
                  placeholder="Enter address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  rows={3}
                  disabled={loading || isViewMode}
                  readOnly={isViewMode}
                />
                {errors.address && (
                  <div className="invalid-feedback">{errors.address}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="employeeStatus" className="form-label">
                  Status
                </label>
                <SelectDropdown
                  options={employeeStatusFieldOptions}
                  defaultSelect={formData.employeeStatus.toLowerCase()}
                  selectedOption={employeeStatusFieldOptions.find(
                    (opt) => opt.value === formData.employeeStatus.toLowerCase()
                  )}
                  onSelectOption={isViewMode ? () => {} : handleStatusChange}
                  className={isViewMode ? "disabled" : ""}
                />
              </div>

              {!isEditMode && (
                <div className="col-md-6 mb-3">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      className={`form-control ${
                        errors.password ? "is-invalid" : ""
                      }`}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      style={{ paddingRight: "45px" }}
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      style={{
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        padding: "0",
                        border: "none",
                        background: "transparent",
                        color: "#64748b",
                        textDecoration: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                </div>
              )}
            </div>

            {/* Permissions Section */}
            {isViewMode && employeePermissions.length >= 0 ? (
              <div className="row mt-4">
                <div className="col-12">
                  <EmployeePermissionsView
                    permissions={employeePermissions}
                    loading={fetching}
                    error={null}
                  />
                </div>
              </div>
            ) : !isEditMode ? (
              <div className="row mt-4">
                <div className="col-12">
                  <PermissionMatrix
                    selectedPermissionIds={formData.permissionIds}
                    onChange={handlePermissionChange}
                    disabled={loading}
                    defaultPermissionIds={defaultPermissionIds}
                    mandatoryPermissionIds={MANDATORY_PERMISSION_IDS}
                  />
                </div>
              </div>
            ) : null}

            {!isViewMode && (
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => navigate("/employees/list")}
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
                    "Update Employee"
                  ) : (
                    "Create Employee"
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
