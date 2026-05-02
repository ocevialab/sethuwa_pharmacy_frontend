import React from "react";
import { FiLogOut, FiSettings, FiUser } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import UserAvatar from "../UserAvatar";

const ProfileModal = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color based on user
  const getAvatarColor = (): string => {
    if (!user?.employeeName) return "bg-primary";
    const colors = [
      "bg-primary",
      "bg-success",
      "bg-info",
      "bg-warning",
      "bg-danger",
    ];
    const index = user.employeeName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="dropdown nxl-h-item">
      <a
        href="#"
        data-bs-toggle="dropdown"
        role="button"
        data-bs-auto-close="outside"
      >
        {user?.employeeName ? (
          <div
            className={`text-white avatar-text user-avatar-text avatar-md me-0 ${getAvatarColor()}`}
          >
            {getInitials(user.employeeName)}
          </div>
        ) : (
          <div className="text-white avatar-text user-avatar-text avatar-md me-0 bg-primary d-flex align-items-center justify-content-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        )}
      </a>
      <div
        className="dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-user-dropdown"
        style={{ marginTop: "-10px" }}
      >
        <div className="dropdown-header">
          <div className="d-flex align-items-center">
            {user?.employeeName ? (
              <div
                className={`text-white avatar-text user-avatar-text avatar-md me-2 ${getAvatarColor()}`}
              >
                {getInitials(user.employeeName)}
              </div>
            ) : (
              <div className="text-white avatar-text user-avatar-text avatar-md me-2 bg-primary d-flex align-items-center justify-content-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
            <div>
              <h6 className="text-dark mb-0">
                {user?.employeeName || "User"}
                {user?.role && (
                  <span className="badge bg-soft-success text-success ms-1">
                    {user.role}
                  </span>
                )}
              </h6>
              <span className="fs-12 fw-medium text-muted">
                {user?.employeeId || "Employee ID"}
              </span>
            </div>
          </div>
        </div>
        <div className="dropdown-divider"></div>
        <Link
          to="/profile-setting"
          className="dropdown-item"
          //   onClick={(e) => e.preventDefault()}
        >
          <FiUser className="me-3" size={16} />
          <span>Profile</span>
        </Link>
        <Link
          to="#"
          className="dropdown-item"
          onClick={(e) => e.preventDefault()}
        >
          <FiSettings className="me-3" size={16} />
          <span>Settings</span>
        </Link>
        <div className="dropdown-divider"></div>
        <Link
          to="#"
          className="dropdown-item"
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
          }}
        >
          <FiLogOut className="me-3" size={16} />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
};

export default ProfileModal;

const getColor = (item) => {
  switch (item) {
    case "Always":
      return "always_clr";
    case "Bussy":
      return "bussy_clr";
    case "Inactive":
      return "inactive_clr";
    case "Disabled":
      return "disabled_clr";
    case "Cutomization":
      return "cutomization_clr";
    default:
      return "active-clr";
  }
};
