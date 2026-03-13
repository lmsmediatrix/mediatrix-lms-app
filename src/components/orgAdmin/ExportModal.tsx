import { useState } from "react";
import Button from "../common/Button";
import Dialog from "../common/Dialog";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (exportType: "all" | "current") => void;
}

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
}: ExportModalProps) {
  const [exportType, setExportType] = useState<"all" | "current">("all");

  const handleExport = async () => {
    try {
      await onExport(exportType); // Call onExport, which triggers exportToCSVUtil
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      onClose(); // Close the modal regardless of success or failure
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export Data"
      backdrop="blur"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">Please select the export type:</p>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="exportType"
              value="current"
              checked={exportType === "current"}
              onChange={() => setExportType("current")}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-gray-700">Export Current</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="exportType"
              value="all"
              checked={exportType === "all"}
              onChange={() => setExportType("all")}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-gray-700">Export All</span>
          </label>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button type="button" variant="cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleExport}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Export
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
