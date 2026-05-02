import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FiCamera, FiEye, FiEyeOff } from "react-icons/fi";
import PageHeader from "@/components/shared/pageHeader/PageHeader";
import Footer from "@/components/shared/Footer";
import EmployeePermissionsView from "@/components/shared/EmployeePermissionsView";
import { useAuth } from "../context/AuthContext";
import {
  employeeService,
  Employee,
  EmployeeWithPermissions,
  ChangePasswordRequest,
} from "../services/employeeService";

const ProfileSetting = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employeePermissions, setEmployeePermissions] = useState<EmployeeWithPermissions["permissions"]>([]);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user?.employeeId) {
        setEmployee(null);
        return;
      }
      try {
        setIsLoadingEmployee(true);
        setEmployeeError(null);
        const data = await employeeService.getEmployeeById(user.employeeId);
        setEmployee(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load profile";
        setEmployeeError(message);
        setEmployee(null);
      } finally {
        setIsLoadingEmployee(false);
      }
    };

    fetchEmployee();
  }, [user?.employeeId]);

  useEffect(() => {
    const fetchEmployeePermissions = async () => {
      if (!user?.employeeId) {
        setEmployeePermissions([]);
        return;
      }
      try {
        setIsLoadingPermissions(true);
        setPermissionsError(null);
        const employeeWithPermissions = await employeeService.getEmployeeWithPermissions(user.employeeId);
        setEmployeePermissions(employeeWithPermissions.permissions);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load permissions";
        setPermissionsError(message);
        setEmployeePermissions([]);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchEmployeePermissions();
  }, [user?.employeeId]);

  const profile = useMemo(
    () => ({
      name: employee?.employeeName ?? user?.employeeName ?? "User",
      employeeId: employee?.employeeId ?? user?.employeeId ?? "—",
      role: employee?.role ?? user?.role ?? "—",
      email: employee?.emailAddress ?? "—",
      contact: employee?.contactNumber ?? "—",
      status: employee?.employeeStatus ?? "Active",
    }),
    [employee, user]
  );

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const togglePassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!profile.employeeId || profile.employeeId === "—") {
      setPasswordError("Employee ID is missing.");
      return;
    }

    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (passwordForm.new.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    const payload: ChangePasswordRequest = {
      currentPassword: passwordForm.current,
      newPassword: passwordForm.new,
    };

    try {
      setIsChangingPassword(true);
      await employeeService.changePassword(profile.employeeId, payload);
      Swal.fire({
        icon: "success",
        title: "Password changed",
        timer: 2000,
        showConfirmButton: false,
      });
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 400) {
        setPasswordError("Old password is incorrect.");
      } else {
        const message =
          error instanceof Error ? error.message : "Failed to change password.";
        setPasswordError(message);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const infoCardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.92)",
    borderRadius: 18,
    boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
  };

  const badgeStyle: React.CSSProperties = {
    background: "#e8fff3",
    color: "#1e9a5f",
    padding: "10px 16px",
    borderRadius: 24,
    fontWeight: 600,
  };

  const handlePasswordFieldChange = (
    key: keyof typeof passwordForm,
    value: string
  ) => setPasswordForm((prev) => ({ ...prev, [key]: value }));

  const field = (
    key: keyof typeof showPassword,
    label: string,
    placeholder: string,
    value: string
  ) => (
    <div className="mb-3">
      <label className="form-label fw-semibold text-muted">
        {label} <span className="text-danger">*</span>
      </label>
      <div className="position-relative">
        <input
          type={showPassword[key] ? "text" : "password"}
          className="form-control form-control-lg"
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            handlePasswordFieldChange(key as any, e.target.value)
          }
          disabled={isChangingPassword}
          style={{ paddingRight: 50, background: "#f8fafc" }}
        />
        <button
          type="button"
          className="btn btn-link text-muted position-absolute top-50 end-0 translate-middle-y"
          style={{ paddingRight: 18 }}
          onClick={() => togglePassword(key)}
        >
          {showPassword[key] ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader />
      <div className="main-content">
        <div className="row">
          <div className="col-12">
            <div
              className="p-3 p-md-4"
              style={{
                background:
                  "linear-gradient(120deg, #e9f7ff 0%, #f3fff7 45%, #f6f8ff 100%)",
                borderRadius: 24,
                minHeight: "calc(100vh - 140px)",
              }}
            >
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                <div>
                  <h5 className="mb-1 fw-semibold">Settings</h5>
                  <span className="text-muted">Personal Settings</span>
                </div>
                <span style={badgeStyle}>{profile.status}</span>
              </div>

              <div className="row g-4">
                <div className="col-lg-4">
                  <div style={infoCardStyle} className="h-100 p-4 text-center">
                    <div className="position-relative d-inline-block mb-3">
                      <div
                        className="rounded-circle overflow-hidden"
                        style={{
                          width: 160,
                          height: 160,
                          background: "#e9f3ff",
                          border: "6px solid #fff",
                          boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
                        }}
                      >
                        <img
                          src="/images/profile/profile.png"
                          alt="Profile"
                          className="img-fluid w-100 h-100"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-dark rounded-circle position-absolute"
                        style={{
                          width: 42,
                          height: 42,
                          bottom: 8,
                          right: -4,
                          boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                        }}
                      >
                        <FiCamera size={18} />
                      </button>
                    </div>
                    <h5 className="mb-1">{profile.name}</h5>
                    <span className="text-muted">{profile.role}</span>
                  </div>
                </div>

                <div className="col-lg-8">
                  <div style={infoCardStyle} className="h-100 p-4">
                    <div className="d-flex flex-wrap gap-4 mb-4">
                      <div>
                        <small className="text-muted d-block">
                          Employee ID
                        </small>
                        <span className="fw-semibold">
                          {profile.employeeId}
                        </span>
                      </div>
                      <div>
                        <small className="text-muted d-block">Contact No</small>
                        <span className="fw-semibold">{profile.contact}</span>
                      </div>
                      <div>
                        <small className="text-muted d-block">Email</small>
                        <span className="fw-semibold">{profile.email}</span>
                      </div>
                    </div>

                    <div className="mb-1 d-flex align-items-center justify-content-between">
                      <h6 className="fw-semibold mb-0">Change Password</h6>
                      {isLoadingEmployee && (
                        <small className="text-muted">Loading profile…</small>
                      )}
                      {employeeError && (
                        <small className="text-danger">{employeeError}</small>
                      )}
                    </div>

                    <form onSubmit={handlePasswordSubmit}>
                      {field(
                        "current",
                        "Current Password",
                        "Enter Current Password",
                        passwordForm.current
                      )}
                      {field(
                        "new",
                        "New Password",
                        "Enter New Password",
                        passwordForm.new
                      )}
                      {field(
                        "confirm",
                        "Confirm New Password",
                        "Re-Enter New Password",
                        passwordForm.confirm
                      )}

                      {passwordError && (
                        <div className="text-danger small mb-2">
                          {passwordError}
                        </div>
                      )}

                      <div className="text-end pt-2">
                        <button
                          type="submit"
                          className="btn btn-primary px-4"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword
                            ? "Changing..."
                            : "Change Password"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="row mt-4">
                <div className="col-12">
                  <div style={infoCardStyle} className="p-4">
                    <EmployeePermissionsView
                      permissions={employeePermissions}
                      loading={isLoadingPermissions}
                      error={permissionsError}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfileSetting;
