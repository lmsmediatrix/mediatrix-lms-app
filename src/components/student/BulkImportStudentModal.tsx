import { useBulkImportStudent } from "../../hooks/useStudent";
import Dialog from "../common/Dialog";
import Button from "../common/Button";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  FaFileUpload,
  FaDownload,
  FaCloudUploadAlt,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

interface BulkImportStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportError {
  errorMessage: string;
  errorCode: number;
  row?: number;
}

interface ImportResult {
  successCount: number;
  successList: any[];
  errorCount: number;
  errorList: ImportError[];
}

interface StudentImportResponse {
  message: string;
  result: ImportResult;
}

const BulkImportStudentModal = ({
  isOpen,
  onClose,
}: BulkImportStudentModalProps) => {
  const { mutate: bulkImport, isPending } = useBulkImportStudent();
  const [file, setFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSuccess, setImportSuccess] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;

  const validateFile = (selectedFile: File): boolean => {
    const allowedTypes = ["text/csv"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const fileName = selectedFile.name.toLowerCase();

    // Check file extension as well since MIME type might not always be reliable
    if (
      !allowedTypes.includes(selectedFile.type) &&
      !fileName.endsWith(".csv")
    ) {
      toast.error("Please select a valid CSV file only");
      return false;
    }

    if (selectedFile.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return false;
    }

    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setImportErrors([]);
      setImportSuccess([]);
      setShowResults(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setImportErrors([]);
      setImportSuccess([]);
      setShowResults(false);
    }
  };

  const handleBulkImport = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // Create a promise that wraps the mutation
    const importPromise = new Promise((resolve, reject) => {
      bulkImport(formData, {
        onSuccess: (response: StudentImportResponse) => {
          const { result } = response;
          // Always set both success and error data
          setImportSuccess(result.successList || []);
          setImportErrors(result.errorList || []);
          setShowResults(true);

          if (result.errorList.length > 0) {
            // Don't show success toast if there are errors, let the warning show instead
            setTimeout(() => {
              toast.warning(
                `Import completed: ${result.successCount} successful, ${result.errorCount} errors`
              );
            }, 100);
            resolve(response);
          } else {
            // Only close modal if no errors and no need to show results
            if (result.successCount === 0) {
              handleCloseModal();
            }
            resolve(response);
          }
        },
        onError: (error: any) => {
          console.error("Error importing students:", error);
          reject(error);
        },
      });
    });

    toast.promise(importPromise, {
      pending: "Importing students...",
      success: "Students imported successfully",
      error: {
        render({ data }) {
          return (
            (data as { message: string }).message || "Failed to import students"
          );
        },
      },
    });
  };

  const handleCloseModal = () => {
    setFile(null);
    setImportErrors([]);
    setImportSuccess([]);
    setShowResults(false);
    setIsDragOver(false);
    onClose();
  };

  const downloadSampleTemplate = () => {
    const templateUrl =
      orgType === "school"
        ? "https://res.cloudinary.com/dyal0wstg/raw/upload/v1748419071/IMPORT-STUDENTS-TEMPLATE_bireng.csv"
        : "https://res.cloudinary.com/dyal0wstg/raw/upload/v1748419041/IMPORT-EMPLOYEE-TEMPLATE.csv_deufpc.xlsx";
    const link = document.createElement("a");
    link.href = templateUrl;
    link.download = "students-import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog
      title="Bulk Import Students"
      backdrop="blur"
      isOpen={isOpen}
      onClose={handleCloseModal}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                Upload Student Data
              </h4>
              <p className="text-sm text-gray-600">
                Upload a CSV file containing student information
              </p>
            </div>
            <Button
              variant="outline"
              onClick={downloadSampleTemplate}
              className="text-sm whitespace-nowrap"
            >
              <FaDownload className="w-4 h-4" />
              Download Template
            </Button>
          </div>
        </div>

        {/* File Upload Section */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.02]"
              : file
              ? "border-green-300 bg-green-50"
              : "border-gray-300 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <FaCloudUploadAlt
              className={`mx-auto h-12 w-12 mb-4 transition-colors ${
                isDragOver
                  ? "text-primary"
                  : file
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            />
            <div className="mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-primary hover:text-primary/80">
                  Click to upload
                </span>
                <span className="text-sm text-gray-600"> or drag and drop</span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>
            <p className="text-xs text-gray-500">CSV file up to 10MB</p>
            {file && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-center gap-2">
                  <FaCheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-800">
                    {file.name}
                  </span>
                  <button
                    onClick={() => {
                      setFile(null);
                      setImportErrors([]);
                      setImportSuccess([]);
                      setShowResults(false);
                    }}
                    className="ml-2 text-green-600 hover:text-green-800 text-xs underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Import Results Section */}
        {showResults &&
          (importSuccess.length > 0 || importErrors.length > 0) && (
            <div className="space-y-4">
              {/* Success Results */}
              {importSuccess.length > 0 && (
                <div className="border-2 border-green-200 rounded-lg bg-green-50 overflow-hidden">
                  <div className="bg-green-100 border-b border-green-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="text-green-800 font-semibold">
                        Successfully Imported ({importSuccess.length})
                      </h4>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      The following students were imported successfully:
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-green-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider border-b border-green-200">
                            Student ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider border-b border-green-200">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-green-800 uppercase tracking-wider border-b border-green-200">
                            Email
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-200">
                        {importSuccess.map((student, index) => (
                          <tr key={index} className="hover:bg-green-75">
                            <td className="px-4 py-3 text-sm text-green-800 font-medium">
                              {student.studentId}
                            </td>
                            <td className="px-4 py-3 text-sm text-green-700">
                              {student.firstName} {student.lastName}
                            </td>
                            <td className="px-4 py-3 text-sm text-green-600">
                              {student.email}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error Results */}
              {importErrors.length > 0 && (
                <div className="border-2 border-red-200 rounded-lg bg-red-50 overflow-hidden">
                  <div className="bg-red-100 border-b border-red-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                      <h4 className="text-red-800 font-semibold">
                        Import Errors ({importErrors.length})
                      </h4>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      The following errors were encountered during import:
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-red-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider border-b border-red-200">
                            Row
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider border-b border-red-200">
                            Error Message
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider border-b border-red-200">
                            Code
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-200">
                        {importErrors.map((error, index) => (
                          <tr key={index} className="hover:bg-red-75">
                            <td className="px-4 py-3 text-sm text-red-800 font-medium">
                              {error.row !== undefined ? error.row : "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-red-700">
                              {error.errorMessage}
                            </td>
                            <td className="px-4 py-3 text-sm text-red-600 font-mono">
                              {error.errorCode}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="cancel"
              onClick={handleCloseModal}
              disabled={isPending}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkImport}
              disabled={!file || isPending}
              isLoading={isPending}
              isLoadingText="Importing..."
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              <FaFileUpload className="w-4 h-4" />
              Import Students
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default BulkImportStudentModal;
