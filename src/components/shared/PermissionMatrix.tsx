import React, { useState, useEffect } from "react";
import { permissionService, Permission } from "@/services/permissionService";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface PermissionMatrixProps {
  selectedPermissionIds: string[];
  onChange: (permissionIds: string[]) => void;
  disabled?: boolean;
  defaultPermissionIds?: string[];
  mandatoryPermissionIds?: string[]; // Permissions that cannot be removed
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  selectedPermissionIds,
  onChange,
  disabled = false,
  defaultPermissionIds = [],
  mandatoryPermissionIds = [],
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupedPermissions, setGroupedPermissions] = useState<
    Record<string, Permission[]>
  >({});
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (permissions.length > 0) {
      groupPermissionsByModule();
      // Expand all modules by default
      const allModules = new Set(
        permissions.map((p) => p.module || "Other")
      );
      setExpandedModules(allModules);
    }
  }, [permissions]);

  // Ensure mandatory permissions are always included
  useEffect(() => {
    if (mandatoryPermissionIds.length > 0) {
      const hasAllMandatory = mandatoryPermissionIds.every((id) =>
        selectedPermissionIds.includes(id)
      );
      if (!hasAllMandatory) {
        const updatedPermissions = [
          ...new Set([...selectedPermissionIds, ...mandatoryPermissionIds]),
        ];
        onChange(updatedPermissions);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mandatoryPermissionIds, selectedPermissionIds]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await permissionService.getAllPermissions();
      setPermissions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load permissions"
      );
    } finally {
      setLoading(false);
    }
  };

  const groupPermissionsByModule = () => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach((permission) => {
      // Use the module field directly from the API response
      const moduleName = permission.module || "Other";
      if (!grouped[moduleName]) {
        grouped[moduleName] = [];
      }
      grouped[moduleName].push(permission);
    });
    setGroupedPermissions(grouped);
  };

  const handlePermissionToggle = (permissionId: string) => {
    if (disabled) return;
    
    // Prevent removing mandatory permissions
    if (mandatoryPermissionIds.includes(permissionId)) {
      return;
    }

    const isSelected = selectedPermissionIds.includes(permissionId);
    if (isSelected) {
      // Ensure mandatory permissions are always included
      const newPermissions = selectedPermissionIds.filter((id) => id !== permissionId);
      onChange([...new Set([...newPermissions, ...mandatoryPermissionIds])]);
    } else {
      onChange([...selectedPermissionIds, permissionId]);
    }
  };

  const handleSelectAllInModule = (module: string) => {
    if (disabled) return;

    const modulePermissions = groupedPermissions[module] || [];
    const modulePermissionIds = modulePermissions.map((p) => p.permissionId);
    const allSelected = modulePermissionIds.every((id) =>
      selectedPermissionIds.includes(id)
    );

    if (allSelected) {
      // Deselect all in module, but keep mandatory permissions
      const newPermissions = selectedPermissionIds.filter(
        (id) => !modulePermissionIds.includes(id) || mandatoryPermissionIds.includes(id)
      );
      onChange([...new Set([...newPermissions, ...mandatoryPermissionIds])]);
    } else {
      // Select all in module
      const newSelected = [
        ...selectedPermissionIds.filter((id) => !modulePermissionIds.includes(id)),
        ...modulePermissionIds,
      ];
      onChange([...new Set([...newSelected, ...mandatoryPermissionIds])]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;

    const allPermissionIds = permissions.map((p) => p.permissionId);
    const nonMandatoryIds = allPermissionIds.filter(
      (id) => !mandatoryPermissionIds.includes(id)
    );
    const allNonMandatorySelected = nonMandatoryIds.every((id) =>
      selectedPermissionIds.includes(id)
    );

    if (allNonMandatorySelected) {
      // Deselect all except mandatory permissions
      onChange([...mandatoryPermissionIds]);
    } else {
      // Select all permissions (mandatory are already selected)
      onChange([...new Set([...allPermissionIds, ...mandatoryPermissionIds])]);
    }
  };

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading permissions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <strong>Error:</strong> {error}
        <button
          className="btn btn-sm btn-outline-danger ms-2"
          onClick={fetchPermissions}
        >
          Retry
        </button>
      </div>
    );
  }

  // Sort modules alphabetically
  const moduleNames = Object.keys(groupedPermissions).sort();
  const allPermissionIds = permissions.map((p) => p.permissionId);
  const allSelected = allPermissionIds.every((id) =>
    selectedPermissionIds.includes(id)
  );

  const selectBtnClass =
    "btn btn-sm btn-outline-primary permission-matrix-select-btn";

  return (
    <div className="permission-matrix">
      {/* Override theme .btn rules that force white text on outline buttons (unreadable on white bg) */}
      <style>{`
        .permission-matrix .permission-matrix-select-btn.btn-outline-primary {
          color: var(--bs-primary, #3454d1) !important;
          background-color: #ffffff !important;
          border-color: var(--bs-primary, #3454d1) !important;
        }
        .permission-matrix .permission-matrix-select-btn.btn-outline-primary:hover:not(:disabled),
        .permission-matrix .permission-matrix-select-btn.btn-outline-primary:focus:not(:disabled) {
          color: #ffffff !important;
          background-color: var(--bs-primary, #3454d1) !important;
          border-color: var(--bs-primary, #3454d1) !important;
        }
        .permission-matrix .permission-matrix-select-btn.btn-outline-primary:disabled {
          opacity: 0.65;
          color: var(--bs-primary, #3454d1) !important;
          background-color: #f8f9fa !important;
        }
      `}</style>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <h5 className="mb-0 fw-bold">Permissions</h5>
            <span className="badge bg-primary px-3 py-2">
              {selectedPermissionIds.length} / {permissions.length}
            </span>
          </div>
          <p className="text-muted mb-0 small">
            Select permissions to assign to the employee by module
          </p>
        </div>
        <button
          type="button"
          className={selectBtnClass}
          onClick={handleSelectAll}
          disabled={disabled}
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* Module Sections */}
      <div className="module-sections">
        {moduleNames.map((moduleName, index) => {
          const modulePermissions = groupedPermissions[moduleName] || [];
          const modulePermissionIds = modulePermissions.map(
            (p) => p.permissionId
          );
          const allModuleSelected = modulePermissionIds.every((id) =>
            selectedPermissionIds.includes(id)
          );
          const selectedCount = modulePermissionIds.filter((id) =>
            selectedPermissionIds.includes(id)
          ).length;
          const isExpanded = expandedModules.has(moduleName);

          return (
            <div key={moduleName} className="module-section mb-3">
              {/* Module Card */}
              <div className="card border">
                {/* Module Header - Clickable to expand/collapse */}
                <div
                  className="module-header bg-white border-bottom"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleModule(moduleName)}
                >
                  <div className="d-flex justify-content-between align-items-center p-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center">
                        {isExpanded ? (
                          <FiChevronDown className="text-primary" size={20} />
                        ) : (
                          <FiChevronUp className="text-primary" size={20} />
                        )}
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold">
                          {moduleName}
                        </h6>
                        <small className="text-muted">
                          {modulePermissions.length} permission
                          {modulePermissions.length !== 1 ? "s" : ""}
                          {selectedCount > 0 && (
                            <span className="ms-2">
                              • <strong className="text-primary">{selectedCount}</strong> selected
                            </span>
                          )}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      {selectedCount > 0 && (
                        <span className="badge bg-primary rounded-pill px-3 py-2">
                          {selectedCount} / {modulePermissions.length}
                        </span>
                      )}
                      <button
                        type="button"
                        className={selectBtnClass}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAllInModule(moduleName);
                        }}
                        disabled={disabled}
                      >
                        {allModuleSelected ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Module Content - Permissions List */}
                {isExpanded && (
                  <div className="module-content p-4">
                    <div className="row g-3">
                      {modulePermissions.map((permission) => {
                        const isSelected = selectedPermissionIds.includes(
                          permission.permissionId
                        );
                        const isDefault = defaultPermissionIds.includes(
                          permission.permissionId
                        );
                        const isMandatory = mandatoryPermissionIds.includes(
                          permission.permissionId
                        );
                        const isDefaultAndSelected = isSelected && isDefault;
                        const isMandatoryAndSelected = isSelected && isMandatory;

                        return (
                          <div
                            key={permission.permissionId}
                            className="col-12 col-md-6 col-lg-4"
                          >
                            <div
                              className={`permission-item form-check p-3 border rounded bg-white ${
                                isMandatoryAndSelected
                                  ? "border-warning shadow-sm"
                                  : isDefaultAndSelected
                                  ? "border-success shadow-sm"
                                  : isSelected
                                  ? "border-primary shadow-sm"
                                  : "border-gray-3"
                              }`}
                              style={{
                                cursor: disabled || isMandatory ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease",
                                backgroundColor: isMandatoryAndSelected 
                                  ? "#fff7ed" 
                                  : isDefaultAndSelected 
                                  ? "#f0fdf4" 
                                  : "white",
                                opacity: isMandatory ? 0.9 : 1,
                              }}
                              onClick={() =>
                                !isMandatory && handlePermissionToggle(permission.permissionId)
                              }
                              onMouseEnter={(e) => {
                                if (!disabled && !isSelected && !isMandatory) {
                                  e.currentTarget.style.borderColor = isDefault ? "#10b981" : "#3454d1";
                                  e.currentTarget.style.boxShadow = isDefault 
                                    ? "0 2px 4px rgba(16, 185, 129, 0.1)"
                                    : "0 2px 4px rgba(52, 84, 209, 0.1)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = "";
                                  e.currentTarget.style.boxShadow = "";
                                  e.currentTarget.style.backgroundColor = isMandatory ? "#fff7ed" : "white";
                                } else if (isMandatoryAndSelected) {
                                  e.currentTarget.style.backgroundColor = "#fff7ed";
                                } else if (isDefaultAndSelected) {
                                  e.currentTarget.style.backgroundColor = "#f0fdf4";
                                }
                              }}
                            >
                              <div className="d-flex align-items-start">
                                <input
                                  className="form-check-input mt-1"
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    handlePermissionToggle(permission.permissionId)
                                  }
                                  disabled={disabled || isMandatory}
                                  id={`permission-${permission.permissionId}`}
                                  style={{
                                    accentColor: isMandatoryAndSelected 
                                      ? "#f59e0b" 
                                      : isDefaultAndSelected 
                                      ? "#10b981" 
                                      : undefined,
                                  }}
                                />
                                <label
                                  className="form-check-label w-100 ms-3"
                                  htmlFor={`permission-${permission.permissionId}`}
                                  style={{
                                    cursor: disabled || isMandatory ? "not-allowed" : "pointer",
                                  }}
                                >
                                  <div className={`fw-semibold mb-1 ${
                                    isMandatoryAndSelected
                                      ? "text-warning"
                                      : isDefaultAndSelected 
                                      ? "text-success" 
                                      : isSelected 
                                      ? "text-primary" 
                                      : ""
                                  }`}>
                                    {permission.permissionName}
                                    {isMandatory && (
                                      <span className="badge bg-warning text-dark ms-2" style={{ fontSize: "0.7rem" }}>
                                        Required
                                      </span>
                                    )}
                                    {!isMandatory && isDefault && (
                                      <span className="badge bg-soft-success text-success ms-2" style={{ fontSize: "0.7rem" }}>
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  {permission.description && (
                                    <small className="text-muted d-block">
                                      {permission.description}
                                    </small>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      {selectedPermissionIds.length > 0 && (
        <div className="mt-4 pt-4 border-top">
          <div className="p-3 bg-soft-primary rounded border border-primary">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong className="text-primary fs-5">
                  {selectedPermissionIds.length}
                </strong>
                <span className="text-muted ms-2">
                  permission{selectedPermissionIds.length !== 1 ? "s" : ""}{" "}
                  selected across all modules
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-primary p-0 fw-semibold"
                onClick={() => onChange([...mandatoryPermissionIds])}
                disabled={disabled}
              >
                Clear All Selections
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionMatrix;
