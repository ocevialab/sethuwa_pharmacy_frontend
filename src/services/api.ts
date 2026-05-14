import { API_BASE_URL } from "@/utils/constants";
import { tokenManager } from "@/utils/tokenManager";

/**
 * API Service - Centralized HTTP client for API requests
 * Handles authentication, error handling, and request/response interceptors
 */

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): HeadersInit {
    const token = tokenManager.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response, skipAuth: boolean = false): Promise<T> {
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = response.statusText || "An error occurred";

      try {
        // First try to get response as text (might be plain text)
        const text = await response.clone().text();

        if (text && text.trim()) {
          // Try to parse as JSON
          try {
            const errorData = JSON.parse(text);

            if (errorData.errors && typeof errorData.errors === "object") {
              // ASP.NET Core ModelState / ProblemDetails validation errors
              const fieldErrors = Object.entries(errorData.errors)
                .filter(([key]) => key !== "$" && key !== "dto") // skip JSON-level parse errors
                .flatMap(([, msgs]) => msgs as string[]);

              errorMessage = fieldErrors.length > 0
                ? fieldErrors.join(" ")
                : errorData.title || "Validation failed. Please check your input.";
            } else {
              errorMessage = errorData.message || errorData.error || errorData.detail || errorData.title || text;
            }
          } catch {
            // If not JSON, use the text directly (remove leading numbers if present)
            errorMessage = text.trim().replace(/^\d+\s*/, "");
          }
        }
      } catch {
        // If reading response fails, use default message
        errorMessage = response.statusText || "An error occurred";
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // If this is a login attempt (skipAuth = true), just throw the error message
        // Otherwise, it's a session expiration for authenticated requests
        if (skipAuth) {
          // Login failed - throw the error message from server
          throw new Error(errorMessage);
        } else {
          // Session expired - clear auth and notify
          tokenManager.clearAuthData();
          
          // Store session expired message in sessionStorage
          const expiredMessage = "Session expired. Please login again.";
          sessionStorage.setItem("sessionExpired", "true");
          sessionStorage.setItem("sessionExpiredMessage", expiredMessage);
          
          // Dispatch event to notify AuthContext to update state
          // ProtectedRoute will automatically redirect when isAuthenticated becomes false
          window.dispatchEvent(new CustomEvent("sessionExpired"));
          
          throw new Error(expiredMessage);
        }
      }

      // Handle 403 Forbidden - Insufficient permissions
      if (response.status === 403) {
        throw new Error(
          "You do not have permission to access this resource. Please contact your administrator."
        );
      }

      throw new Error(errorMessage);
    }

    // Check if response has content
    const contentType = response.headers.get("content-type");
    const text = await response.text();

    // If empty response, return empty object for void operations
    if (!text || text.trim() === "") {
      return {} as T;
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      // If not JSON, return text as is
      return text as unknown as T;
    }
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const url = `${this.baseURL}${endpoint}`;
    const headers = skipAuth
      ? { "Content-Type": "application/json" }
      : this.getAuthHeader();

    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        ...headers,
        ...fetchOptions.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return this.handleResponse<T>(response, skipAuth);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * POST multipart/form-data (e.g. file upload). Do not set Content-Type manually.
   */
  async postMultipart<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions
  ): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options ?? {};
    const token = tokenManager.getToken();
    const url = `${this.baseURL}${endpoint}`;
    const { headers: extraHeaders, ...restFetch } = fetchOptions;
    const headers: HeadersInit = {
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders ?? {}),
    };
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      ...restFetch,
    });
    return this.handleResponse<T>(response, skipAuth);
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
