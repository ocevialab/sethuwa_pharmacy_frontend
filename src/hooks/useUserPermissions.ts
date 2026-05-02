import { useState, useEffect } from "react";
import { tokenManager } from "@/utils/tokenManager";
import { permissionService } from "@/services/permissionService";
import { hasAnyModulePermission } from "@/utils/menuPermissions";

/**
 * Hook to fetch and check user permissions
 */
export const useUserPermissions = () => {
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const user = tokenManager.getUser();
        if (user?.employeeId) {
          const permissions = await permissionService.getEmployeePermissions(
            user.employeeId
          );
          const activePermissionIds = permissions
            .filter((p) => p?.isActive)
            .map((p) => p?.permissionId)
            .filter((id) => id);
          setUserPermissions(activePermissionIds);
        }
      } catch (error) {
        console.error("Failed to fetch user permissions:", error);
        setUserPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, []);

  /**
   * Check if user has any permission for a module
   */
  const hasModulePermission = (module: string): boolean => {
    return hasAnyModulePermission(userPermissions, module);
  };

  return {
    userPermissions,
    loading,
    hasModulePermission,
  };
};













