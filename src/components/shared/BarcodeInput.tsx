import React, { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { FiCamera, FiX } from "react-icons/fi";

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

const BarcodeInput: React.FC<BarcodeInputProps> = ({
  value,
  onChange,
  placeholder = "Enter barcode or scan",
  disabled = false,
  className = "",
  id,
  name,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle barcode scanner input (typically sends data quickly followed by Enter)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // If user is typing in the input, let it handle normally
      if (document.activeElement === inputRef.current) {
        return;
      }

      // Barcode scanners typically send data very quickly
      // We detect rapid input that ends with Enter
      if (e.key === "Enter" && inputRef.current) {
        // If input has value and Enter is pressed, it might be from scanner
        // This is handled by the input's onKeyDown
        return;
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, []);

  const startScanning = async () => {
    try {
      setError("");
      setIsScanning(true);

      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          "Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge."
        );
        setIsScanning(false);
        return;
      }

      // Check if running on HTTPS (required for camera access)
      if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        setError(
          "Camera access requires HTTPS. Please access this site over a secure connection (https://)."
        );
        setIsScanning(false);
        return;
      }

      // Step 1: Force permission request manually (IMPORTANT for mobile)
      let permissionStream: MediaStream | null = null;
      try {
        permissionStream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Immediately stop the stream - we just needed permission
        permissionStream.getTracks().forEach(track => track.stop());
      } catch (permErr) {
        const errMsg = permErr instanceof Error ? permErr.message.toLowerCase() : '';
        if (errMsg.includes("notallowed") || errMsg.includes("permission denied")) {
          setError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (errMsg.includes("notfound")) {
          setError("No camera found on this device.");
        } else {
          setError("Failed to access camera. Please check permissions and try again.");
        }
        setIsScanning(false);
        return;
      }

      // Step 2: Get available cameras and select the best one
      const scannerId = "barcode-scanner";
      scannerRef.current = new Html5Qrcode(scannerId);

      let cameras: any[] = [];
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (camErr) {
        setError("Failed to enumerate cameras. Please try again.");
        setIsScanning(false);
        return;
      }

      if (!cameras || cameras.length === 0) {
        setError("No camera found on this device.");
        setIsScanning(false);
        return;
      }

      // Prefer back camera (environment), fallback to first available
      let selectedCameraId = cameras[0].id;
      const backCamera = cameras.find((cam: any) => 
        cam.label?.toLowerCase().includes("back") || 
        cam.label?.toLowerCase().includes("rear") ||
        cam.label?.toLowerCase().includes("environment")
      );
      if (backCamera) {
        selectedCameraId = backCamera.id;
      }

      // Mobile-friendly scan config
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const scanConfig = isMobile
        ? {
            fps: 5,
            qrbox: { width: 250, height: 250 },
          }
        : {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

      // Step 3: Start scanning with selected camera ID
      await scannerRef.current.start(
        selectedCameraId, // Use camera ID instead of facingMode constraint
        scanConfig,
        (decodedText) => {
          onChange(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Ignore frequent scanning errors, only show critical ones
          if (
            errorMessage.includes("NotAllowedError") ||
            errorMessage.includes("Permission denied")
          ) {
            setError("Camera access denied. Please allow camera permissions and try again.");
            stopScanning();
          } else if (
            errorMessage.includes("NotFoundError") ||
            errorMessage.includes("No camera found")
          ) {
            setError("Camera not found. Please check your device.");
            stopScanning();
          } else if (
            errorMessage.includes("NotReadableError") ||
            errorMessage.includes("already in use")
          ) {
            setError("Camera is already in use. Please close other applications.");
            stopScanning();
          }
          // Ignore other scanning errors (they're normal during scanning)
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start camera.";
      setError(errorMessage);
      setIsScanning(false);
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch {
          // Ignore cleanup errors
        }
        scannerRef.current = null;
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch(() => {});
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Barcode scanners typically send data very quickly
    // If Enter is pressed and we have a value, it's likely from a scanner
    if (e.key === "Enter" && value.trim()) {
      e.preventDefault();
      // Value is already set via onChange, so we just need to prevent form submission
      // The parent form will handle submission
    }
  };

  return (
    <div className="position-relative">
      <div className="input-group">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          className={`form-control ${className} ${error ? "is-invalid" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isScanning}
          autoComplete="off"
        />
        <button
          type="button"
          className={`btn ${isScanning ? "btn-danger" : "btn-outline-primary"}`}
          onClick={isScanning ? stopScanning : startScanning}
          disabled={disabled}
          title={isScanning ? "Stop scanning" : "Scan barcode with camera"}
        >
          {isScanning ? (
            <>
              <FiX className="me-1" />
              Stop
            </>
          ) : (
            <>
              <FiCamera className="me-1" />
              Scan
            </>
          )}
        </button>
      </div>

      {isScanning && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 9999,
          }}
        >
          <div className="bg-white rounded p-4" style={{ maxWidth: "90%" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Scanning Barcode</h5>
              <button
                type="button"
                className="btn-close"
                onClick={stopScanning}
                aria-label="Close"
              ></button>
            </div>
            <div
              id="barcode-scanner"
              style={{ width: "100%", maxWidth: "400px" }}
            ></div>
            <p className="text-muted mt-3 mb-0 text-center">
              Point your camera at the barcode
            </p>
            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {error && !isScanning && (
        <div className="invalid-feedback d-block">{error}</div>
      )}
    </div>
  );
};

export default BarcodeInput;

