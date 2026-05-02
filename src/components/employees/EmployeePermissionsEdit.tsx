import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { employeeService, EmployeeWithPermissions } from "@/services/employeeService";
import { permissionService } from "@/services/permissionService";
import PermissionMatrix from "@/components/shared/PermissionMatrix";
import Swal from "sweetalert2";
import { FiShield, FiArrowLeft, FiSave } from "react-icons/fi";

// Mandatory permissions that cannot be removed
const MANDATORY_PERMISSION_IDS = ["permission:view", "employee:view_permissions", "employee:view"];

const EmployeePermissionsEdit: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const employeeId = searchParams.get("id");

  const [employee, setEmployee] = useState<EmployeeWithPermissions | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
    } else {
      navigate("/employees/list");
    }
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    if (!employeeId) return;

    try {
      setFetching(true);
      const employeeData = await employeeService.getEmployeeWithPermissions(employeeId);
      setEmployee(employeeData);
      // Set initial selected permissions from employee's current permissions
      // Ensure mandatory permissions are always included
      const currentPermissionIds = employeeData.permissions
        .filter((p) => p.isActive)
        .map((p) => p.permissionId);
      const allPermissionIds = [
        ...new Set([...currentPermissionIds, ...MANDATORY_PERMISSION_IDS]),
      ];
      setSelectedPermissionIds(allPermissionIds);
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

  const handlePermissionChange = (permissionIds: string[]) => {
    // Ensure mandatory permissions are always included
    const updatedPermissionIds = [
      ...new Set([...permissionIds, ...MANDATORY_PERMISSION_IDS]),
    ];
    setSelectedPermissionIds(updatedPermissionIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) return;

    try {
      setLoading(true);
      await employeeService.updateEmployeePermissions(employeeId, selectedPermissionIds);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Employee permissions updated successfully",
        timer: 2000,
        showConfirmButton: false,
      });

      navigate(`/employees/create?id=${employeeId}&view=true`);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to update employee permissions",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (employeeId) {
      navigate(`/employees/create?id=${employeeId}&view=true`);
    } else {
      navigate("/employees/list");
    }
  };

  if (fetching) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Employee Details Header */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <div className="d-flex align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar avatar-md bg-light-primary">
                    <FiShield size={18} className="text-primary" />
                  </div>
                  <div>
                    <h5 className="card-title mb-1 fw-bold">
                      Edit Permissions - {employee.employeeName}
                    </h5>
                    <div className="d-flex gap-4 text-muted fs-12">
                      <span>
                        <strong>ID:</strong> {employee.employeeId}
                      </span>
                      <span>
                        <strong>Role:</strong> {employee.role}
                      </span>
                      <span>
                        <strong>Status:</strong>{" "}
                        <span
                          className={
                            employee.employeeStatus === "Active"
                              ? "text-success"
                              : "text-danger"
                          }
                        >
                          {employee.employeeStatus}
                        </span>
                      </span>
                      {employee.contactNumber && (
                        <span>
                          <strong>Contact:</strong> {employee.contactNumber}
                        </span>
                      )}
                      {employee.emailAddress && (
                        <span>
                          <strong>Email:</strong> {employee.emailAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ms-auto">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={handleCancel}
                  >
                    <FiArrowLeft className="me-2" />
                    Back to View
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Form */}
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <PermissionMatrix
                  selectedPermissionIds={selectedPermissionIds}
                  onChange={handlePermissionChange}
                  disabled={loading}
                  mandatoryPermissionIds={MANDATORY_PERMISSION_IDS}
                />

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={handleCancel}
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
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiSave className="me-2" />
                        Update Permissions
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePermissionsEdit;

