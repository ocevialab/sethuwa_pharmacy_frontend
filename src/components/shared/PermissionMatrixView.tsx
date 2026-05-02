import React from "react";
import { PERMISSION_MATRIX, Permission } from "@/utils/permissionMatrix";

interface PermissionMatrixViewProps {
  className?: string;
}

/**
 * Permission Matrix View Component
 * Displays all permissions organized by module in a compact format
 * Format: Module: Employee
 *         create, View All, Update, etc.
 */
const PermissionMatrixView: React.FC<PermissionMatrixViewProps> = ({ 
  className = "" 
}) => {
  // Extract simplified permission names from permission names
  const getPermissionLabels = (permissions: Permission[]): string[] => {
    return permissions.map(permission => {
      const name = permission.permissionName;
      const lowerName = name.toLowerCase();
      
      // Check for specific patterns in order of specificity
      if (lowerName.includes('view all') || lowerName.includes('list all')) {
        return 'View All';
      }
      if (lowerName.includes('change password')) {
        return 'Change Password';
      }
      if (lowerName.includes('view deleted')) {
        return 'View Deleted';
      }
      if (lowerName.includes('view summary') || lowerName.includes('get summary')) {
        return 'View Summary';
      }
      if (lowerName.includes('view reports')) {
        return 'View Reports';
      }
      if (lowerName.includes('get by id') || lowerName.includes('get_by_id')) {
        return 'View';
      }
      if (lowerName.includes('view permissions')) {
        return 'View Permissions';
      }
      if (lowerName.includes('update payment status')) {
        return 'Update Payment Status';
      }
      if (lowerName.includes('complete pay later')) {
        return 'Complete Pay Later';
      }
      if (lowerName.includes('view pay later')) {
        return 'View Pay Later';
      }
      if (lowerName.startsWith('create')) {
        return 'Create';
      }
      if (lowerName.startsWith('view')) {
        return 'View';
      }
      if (lowerName.startsWith('update')) {
        return 'Update';
      }
      if (lowerName.startsWith('delete')) {
        return 'Delete';
      }
      if (lowerName.startsWith('restore')) {
        return 'Restore';
      }
      if (lowerName.startsWith('search')) {
        return 'Search';
      }
      if (lowerName.startsWith('assign')) {
        return 'Assign';
      }
      if (lowerName.includes('remove')) {
        return 'Remove';
      }
      if (lowerName.startsWith('complete')) {
        return 'Complete';
      }
      if (lowerName.startsWith('finalize')) {
        return 'Finalize';
      }
      if (lowerName.startsWith('cancel')) {
        return 'Cancel';
      }
      if (lowerName.includes('get')) {
        return 'View';
      }
      
      // Return a simplified version of the permission name
      return name;
    });
  };

  // Get unique permission labels for a module
  const getUniquePermissions = (permissions: Permission[]): string[] => {
    const labels = getPermissionLabels(permissions);
    const uniqueLabels = Array.from(new Set(labels));
    return uniqueLabels.sort();
  };

  const modules = Object.keys(PERMISSION_MATRIX).sort();

  return (
    <div className={`permission-matrix-view ${className}`}>
      <div className="row g-4">
        {modules.map((module) => {
          const permissions = PERMISSION_MATRIX[module];
          const permissionLabels = getUniquePermissions(permissions);

          return (
            <div key={module} className="col-12 col-md-6 col-lg-4">
              <div className="card border h-100">
                <div className="card-body p-4">
                  {/* Module Header */}
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2 text-capitalize">
                      Module: {module}
                    </h6>
                    {/* Permissions List - comma separated */}
                    <div className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                      {permissionLabels.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionMatrixView;

