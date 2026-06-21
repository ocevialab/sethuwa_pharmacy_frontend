import React, { useRef, useState } from "react";
import { FiDownload } from "react-icons/fi";
import Swal from "sweetalert2";
import { medicineService } from "@/services/medicineService";
import { inventoryService } from "@/services/inventoryService";

interface BarcodeLabelActionsProps {
  /** When set, uses Inventory product barcode APIs (purchasing, any product type). */
  productSku?: string | null;
  /** Medicine id for medicine create/edit flows. Ignored when productSku is set. */
  medicineId?: string | null;
  medicineName?: string;
  barcode?: string | null;
  onBarcodeChange?: (barcode: string) => void;
  /** Save/create medicine and return its id (medicine form create flow). */
  onEnsureSaved?: () => Promise<string>;
  disabled?: boolean;
}

const BarcodeLabelActions: React.FC<BarcodeLabelActionsProps> = ({
  productSku,
  medicineId,
  medicineName,
  barcode,
  onBarcodeChange,
  onEnsureSaved,
  disabled = false,
}) => {
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const actionInFlight = useRef(false);

  const useProductApi = Boolean(productSku?.trim());
  const displayName = medicineName ?? "product";

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

  const persistBarcode = async (value: string, sku: string): Promise<void> => {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("Barcode cannot be empty.");
    }
    await inventoryService.updateProductBarcode(sku, trimmed);
  };

  const downloadLabels = async (skuOrId: string, name: string) => {
    if (useProductApi) {
      await inventoryService.downloadProductBarcodeLabelsPdf(skuOrId, name);
      return;
    }
    await medicineService.downloadBarcodeLabelsPdf(skuOrId, name);
  };

  const handleSaveBarcode = async () => {
    if (!barcode?.trim()) {
      await Swal.fire({
        icon: "info",
        title: "No barcode",
        text: "Enter or scan a barcode first, or use Generate barcode.",
      });
      return;
    }

    await runOnce(async () => {
      try {
        setSaving(true);
        const sku = useProductApi ? productSku! : await resolveMedicineId();
        await persistBarcode(barcode, sku);
        await Swal.fire({
          icon: "success",
          title: "Barcode saved",
          text: `Barcode ${barcode.trim()} was saved to the product.`,
          timer: 2500,
          showConfirmButton: false,
        });
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Could not save barcode",
          text: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setSaving(false);
      }
    });
  };

  const handleGenerate = async () => {
    if (barcode?.trim()) {
      await Swal.fire({
        icon: "info",
        title: "Barcode already set",
        text: "Save the current barcode or clear the field to generate a new one.",
      });
      return;
    }

    await runOnce(async () => {
      try {
        setGenerating(true);
        const sku = useProductApi ? productSku! : await resolveMedicineId();
        const result = useProductApi
          ? await inventoryService.generateProductBarcode(sku)
          : await medicineService.generateBarcode(sku);

        const newBarcode = result.barcode ?? "";
        onBarcodeChange?.(newBarcode);
        await downloadLabels(sku, displayName);

        await Swal.fire({
          icon: "success",
          title: "Barcode ready",
          text: `Barcode ${newBarcode} was saved and the label PDF was downloaded.`,
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
        const sku = useProductApi ? productSku! : await resolveMedicineId();
        await persistBarcode(barcode, sku);
        await downloadLabels(sku, displayName);
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
  const busy = generating || downloading || saving;

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
      {!hasBarcode ? (
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleGenerate}
          disabled={disabled || busy}
        >
          {generating ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-1"
                role="status"
              />
              Generating…
            </>
          ) : (
            "Generate barcode"
          )}
        </button>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleSaveBarcode}
            disabled={disabled || busy}
          >
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                />
                Saving…
              </>
            ) : (
              "Save barcode"
            )}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleDownload}
            disabled={disabled || busy}
            title="Save barcode and download A4 label sheet"
          >
            {downloading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                />
                Downloading…
              </>
            ) : (
              <>
                <FiDownload className="me-1" size={14} />
                Download label PDF
              </>
            )}
          </button>
        </>
      )}
      <span className="text-muted small">
        {hasBarcode
          ? "Update the barcode above, then save or download labels."
          : "No barcode yet — generate one or enter/scan above."}
      </span>
    </div>
  );
};

export default BarcodeLabelActions;
