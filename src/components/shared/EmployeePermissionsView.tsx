import React, { useState, useEffect } from "react";
import { EmployeePermission } from "@/services/permissionService";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface EmployeePermissionsViewProps {
  permissions: EmployeePermission[];
  loading?: boolean;
  error?: string | null;
}

const EmployeePermissionsView: React.FC<EmployeePermissionsViewProps> = ({
  permissions,
  loading = false,
  error = null,
}) => {
  const [groupedPermissions, setGroupedPermissions] = useState<
    Record<string, EmployeePermission[]>
  >({});
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (permissions.length > 0) {
      const grouped: Record<string, EmployeePermission[]> = {};
      permissions.forEach((permission) => {
        const moduleName = permission.module || "Other";
        if (!grouped[moduleName]) {
          grouped[moduleName] = [];
        }
        grouped[moduleName].push(permission);
      });
      setGroupedPermissions(grouped);
      
      // Expand all modules by default
      const allModules = new Set(
        permissions.map((p) => p.module || "Other")
      );
      setExpandedModules(allModules);
    } else {
      setGroupedPermissions({});
      setExpandedModules(new Set());
    }
  }, [permissions]);

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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
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
      </div>
    );
  }

  // Sort modules alphabetically
  const moduleNames = Object.keys(groupedPermissions).sort();

  return (
    <div className="employee-permissions-view">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h5 className="mb-1 fw-bold">Employee Permissions</h5>
          <p className="text-muted mb-0 small">
            {permissions.length} permission{permissions.length !== 1 ? "s" : ""} assigned
          </p>
        </div>
      </div>

      {/* Module Sections */}
      <div className="module-sections">
        {moduleNames.length === 0 ? (
          <div className="alert alert-info">
            No permissions assigned to this employee.
          </div>
        ) : (
          moduleNames.map((moduleName) => {
            const modulePermissions = groupedPermissions[moduleName] || [];
            const activePermissions = modulePermissions.filter((p) => p.isActive);
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
                          <h6 className="mb-0 fw-bold">{moduleName}</h6>
                          <small className="text-muted">
                            {modulePermissions.length} permission
                            {modulePermissions.length !== 1 ? "s" : ""}
                            {activePermissions.length !== modulePermissions.length && (
                              <span className="ms-2">
                                • <strong className="text-success">{activePermissions.length}</strong> active
                              </span>
                            )}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span className="badge bg-primary rounded-pill px-3 py-2">
                          {modulePermissions.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Module Content - Permissions List */}
                  {isExpanded && (
                    <div className="module-content p-4">
                      <div className="row g-3">
                        {modulePermissions.map((permission) => {
                          return (
                            <div
                              key={permission.permissionId}
                              className="col-12 col-md-6 col-lg-4"
                            >
                              <div
                                className={`permission-item p-3 border rounded bg-white ${
                                  permission.isActive
                                    ? "border-success"
                                    : "border-gray-3 border-dashed"
                                }`}
                                style={{
                                  opacity: permission.isActive ? 1 : 0.7,
                                }}
                              >
                                <div className="d-flex align-items-start">
                                  <div className="form-check mt-1">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={permission.isActive}
                                      disabled
                                      readOnly
                                      style={{
                                        accentColor: permission.isActive
                                          ? "#10b981"
                                          : undefined,
                                      }}
                                    />
                                  </div>
                                  <div className="ms-3 flex-grow-1">
                                    <div
                                      className={`fw-semibold mb-1 ${
                                        permission.isActive
                                          ? "text-success"
                                          : "text-muted"
                                      }`}
                                    >
                                      {permission.permissionName}
                                    </div>
                                    {permission.grantedAt && (
                                      <small className="text-muted d-block">
                                        Granted: {formatDate(permission.grantedAt)}
                                      </small>
                                    )}
                                    {!permission.isActive && (
                                      <small className="text-danger d-block mt-1">
                                        Inactive
                                      </small>
                                    )}
                                  </div>
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
          })
        )}
      </div>
    </div>
  );
};

export default EmployeePermissionsView;

