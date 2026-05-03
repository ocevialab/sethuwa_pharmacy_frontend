import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface LoginFormProps {
  initialError?: string;
}

const LoginForm = ({ initialError }: LoginFormProps) => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeId: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    employeeId: "",
    password: "",
  });
  const [loginError, setLoginError] = useState(initialError || "");
  const [showPassword, setShowPassword] = useState(false);

  // Set initial error if provided
  useEffect(() => {
    if (initialError) {
      setLoginError(initialError);
    }
  }, [initialError]);

  const validateForm = (): boolean => {
    const newErrors = {
      employeeId: "",
      password: "",
    };

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }

    setErrors(newErrors);
    return !newErrors.employeeId && !newErrors.password;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear previous login error
    setLoginError("");

    if (!validateForm()) {
      return;
    }

    try {
      await login({
        employeeId: formData.employeeId.trim(),
        password: formData.password,
      });

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome back!",
        timer: 2000,
        showConfirmButton: false,
      });

      // Navigate to dashboard after successful login
      navigate("/");
    } catch (error) {
      // Set error message to display inline
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid employee ID or password. Please try again.";
      
      setLoginError(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    
    // Clear login error when user starts typing
    if (loginError) {
      setLoginError("");
    }
  };

  return (
    <>
      <div className="mb-4 d-flex justify-content-center">
        <img
          src="/images/logo/lgo.png"
          alt="Pharmacy Logo"
          className="img-fluid"
          style={{ maxHeight: "60px", width: "auto" }}
        />
      </div>
      <h2 className="fs-20 fw-bolder mb-4">Login</h2>
      <h4 className="fs-13 fw-bold mb-2">Login to your account</h4>
      <p className="fs-12 fw-medium text-muted">
        Welcome to <strong>Sethuwa Pharmacy</strong> Management System. Please
        enter your credentials to access the system.
      </p>
      <form onSubmit={handleSubmit} className="w-100 mt-4 pt-2">
        <div className="mb-4">
          <label
            htmlFor="employeeId"
            className="form-label fs-12 fw-medium mb-2"
          >
            Employee ID
          </label>
          <input
            type="text"
            id="employeeId"
            name="employeeId"
            className={`form-control ${errors.employeeId ? "is-invalid" : ""}`}
            placeholder="Enter Employee ID"
            value={formData.employeeId}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          {errors.employeeId && (
            <div className="invalid-feedback">{errors.employeeId}</div>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="form-label fs-12 fw-medium mb-2">
            Password
          </label>
          <div className="position-relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              style={{ paddingRight: "45px" }}
            />
            <button
              type="button"
              className="btn btn-link position-absolute"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              style={{
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "0",
                border: "none",
                background: "transparent",
                color: "#64748b",
                textDecoration: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.password && (
            <div className="invalid-feedback">{errors.password}</div>
          )}
        </div>
        {loginError && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {loginError}
          </div>
        )}
        <div className="mt-5">
          <button
            type="submit"
            className="btn btn-lg btn-primary w-100"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default LoginForm;
