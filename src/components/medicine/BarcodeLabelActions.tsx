import React, { useRef, useState } from "react";
import { FiDownload } from "react-icons/fi";
import Swal from "sweetalert2";
import { medicineService } from "@/services/medicineService";

interface BarcodeLabelActionsProps {
  /** Current medicine id if already saved; may be null on create until first save */
  medicineId?: string | null;
  medicineName?: string;
  barcode?: string | null;
  onBarcodeChange?: (barcode: string) => void;
  /** Save/create medicine and return its id (required before generate/download) */
  onEnsureSaved?: () => Promise<string>;
  disabled?: boolean;
}

const BarcodeLabelActions: React.FC<BarcodeLabelActionsProps> = ({
  medicineId,
  medicineName,
  barcode,
  onBarcodeChange,
  onEnsureSaved,
  disabled = false,
}) => {
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const actionInFlight = useRef(false);

  const runOnce = async (fn: () => Promise<void>) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    try {
      await fn();
    } finally {
      actionInFlight.current = false;
    }
  };

  const resolveMedicineId = async (): Promise<string> => {
    if (medicineId) return medicineId;
    if (!onEnsureSaved) {
      throw new Error("Save the medicine first (name is required).");
    }
    return onEnsureSaved();
  };

  const handleGenerate = async () => {
    if (barcode?.trim()) {
      await Swal.fire({
        icon: "info",
        title: "Barcode already set",
        text: "Use Save & download label PDF for the current barcode, or clear the field to generate a new one.",
      });
      return;
    }

    await runOnce(async () => {
      try {
        setGenerating(true);
        const id = await resolveMedicineId();
        const result = await medicineService.generateBarcode(id);
        onBarcodeChange?.(result.barcode);

        await medicineService.downloadBarcodeLabelsPdf(
          id,
          medicineName ?? result.medicineName ?? "medicine"
        );

        await Swal.fire({
          icon: "success",
          title: "Barcode ready",
          text: `Barcode ${result.barcode} was saved and the label PDF was downloaded.`,
          timer: 3000,
          showConfirmButton: false,
        });
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Could not generate barcode",
          text: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setGenerating(false);
      }
    });
  };

  const handleDownload = async () => {
    if (!barcode?.trim()) {
      await Swal.fire({
        icon: "info",
        title: "No barcode",
        text: "Scan or enter a barcode, or use Generate barcode to create one.",
      });
      return;
    }

    await runOnce(async () => {
      try {
        setDownloading(true);
        const id = await resolveMedicineId();
        await medicineService.downloadBarcodeLabelsPdf(
          id,
          medicineName ?? "medicine"
        );
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Download failed",
          text: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setDownloading(false);
      }
    });
  };

  const hasBarcode = Boolean(barcode?.trim());

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
      {!hasBarcode ? (
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleGenerate}
          disabled={disabled || generating || downloading}
        >
          {generating ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-1"
                role="status"
              />
              Saving & generating…
            </>
          ) : (
            "Generate barcode"
          )}
        </button>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleDownload}
            disabled={disabled || downloading || generating}
            title="Save medicine and download A4 label sheet"
          >
            {downloading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                />
                Saving & downloading…
              </>
            ) : (
              <>
                <FiDownload className="me-1" size={14} />
                Save & download label PDF
              </>
            )}
          </button>
        </>
      )}
      <span className="text-muted small">
        {hasBarcode
          ? "Scan or type above, then download labels (medicine is saved automatically)."
          : "No barcode yet — generate one or scan into the field above."}
      </span>
    </div>
  );
};

export default BarcodeLabelActions;
