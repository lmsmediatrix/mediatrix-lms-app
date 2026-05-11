import { useState } from "react";
import {
  FaCloudUploadAlt,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaFileUpload,
} from "react-icons/fa";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { toast } from "react-toastify";
import { useBulkImportCourses } from "../../hooks/useCourse";

interface BulkImportCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Include optional category column (MongoDB category id) in downloadable CSV hint row */
  includeCategoryColumn: boolean;
}

interface ImportError {
  errorMessage: string;
  errorCode: number;
  row?: number;
}

interface CourseImportSuccess {
  _id: string;
  code: string;
  title: string;
}

interface ImportResult {
  successCount: number;
  successList: CourseImportSuccess[];
  errorCount: number;
  errorList: ImportError[];
}

interface CourseImportResponse {
  message: string;
  result: ImportResult;
}

export default function BulkImportCourseModal({
  isOpen,
  onClose,
  includeCategoryColumn,
}: BulkImportCourseModalProps) {
  const { mutate: bulkImport, isPending } = useBulkImportCourses();
  const [file, setFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSuccess, setImportSuccess] = useState<CourseImportSuccess[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (selectedFile: File): boolean => {
    const allowedTypes = ["text/csv"];
    const maxSize = 10 * 1024 * 1024;
    const fileName = selectedFile.name.toLowerCase();

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

  const downloadSampleTemplate = () => {
    const baseColumns =
      "title,code,description,level,language,status,isPublished";
    const categoryCol = includeCategoryColumn ? ",category" : "";
    const header = `${baseColumns}${categoryCol}\n`;
    const sampleRow = includeCategoryColumn
      ? 'Hospital Orientation,HOSP101,Mandatory onboarding and policies overview.,beginner,English,draft,false,""'
      : "Hospital Orientation,HOSP101,Mandatory onboarding and policies overview.,beginner,English,draft,false";
    const blob = new Blob([header + sampleRow], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "courses-import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkImport = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    const importPromise = new Promise<CourseImportResponse>((resolve, reject) => {
      bulkImport(formData, {
        onSuccess: (response: CourseImportResponse) => {
          const { result } = response;
          setImportSuccess(result.successList || []);
          setImportErrors(result.errorList || []);
          setShowResults(true);

          if (result.errorCount > 0) {
            setTimeout(() => {
              toast.warning(
                `Import finished: ${result.successCount} created, ${result.errorCount} row errors`,
              );
            }, 100);
          }

          resolve(response);
        },
        onError: (error: unknown) => {
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      });
    });

    void toast.promise(importPromise, {
      pending: "Importing courses...",
      success: "Courses imported successfully",
      error: {
        render({ data }) {
          const msg =
            data instanceof Error
              ? data.message
              : typeof (data as { message?: string })?.message === "string"
                ? (data as { message: string }).message
                : "Failed to import courses";
          return msg;
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

  return (
    <Dialog
      title="Bulk import courses"
      backdrop="blur"
      isOpen={isOpen}
      onClose={handleCloseModal}
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                Upload CSV
              </h4>
              <p className="text-sm text-gray-600">
                Required columns:{" "}
                <span className="font-mono text-xs">
                  title, code, description, level
                </span>
                .                 Optional:{" "}
                <span className="font-mono text-xs">
                  category (MongoDB id), language, timezone (IANA id), status,
                  isPublished
                </span>
                .
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Level: <span className="font-mono">beginner</span>,{" "}
                <span className="font-mono">intermediate</span>, or{" "}
                <span className="font-mono">advanced</span>. Status:{" "}
                <span className="font-mono">draft</span>,{" "}
                <span className="font-mono">published</span>, or{" "}
                <span className="font-mono">archived</span>. isPublished:{" "}
                <span className="font-mono">true</span>/<span className="font-mono">
                  false
                </span>
                .
              </p>
            </div>
            <Button
              variant="outline"
              onClick={downloadSampleTemplate}
              className="text-sm whitespace-nowrap shrink-0"
              type="button"
            >
              <FaDownload className="w-4 h-4" />
              Download template
            </Button>
          </div>
        </div>

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
              <label htmlFor="course-csv-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-primary hover:text-primary/80">
                  Click to upload
                </span>
                <span className="text-sm text-gray-600"> or drag and drop</span>
              </label>
              <input
                id="course-csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>
            <p className="text-xs text-gray-500">CSV file up to 10MB</p>
            {file && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <FaCheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium text-green-800">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setImportErrors([]);
                      setImportSuccess([]);
                      setShowResults(false);
                    }}
                    className="text-green-600 hover:text-green-800 text-xs underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showResults &&
          (importSuccess.length > 0 || importErrors.length > 0) && (
            <div className="space-y-4">
              {importSuccess.length > 0 && (
                <div className="border-2 border-green-200 rounded-lg bg-green-50 overflow-hidden">
                  <div className="bg-green-100 border-b border-green-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="text-green-800 font-semibold">
                        Created ({importSuccess.length})
                      </h4>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-green-800 uppercase border-b border-green-200">
                            Code
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-green-800 uppercase border-b border-green-200">
                            Title
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-200">
                        {importSuccess.map((row, index) => (
                          <tr key={`${row._id}-${index}`}>
                            <td className="px-4 py-2 text-green-800 font-medium">
                              {row.code}
                            </td>
                            <td className="px-4 py-2 text-green-700">{row.title}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="border-2 border-red-200 rounded-lg bg-red-50 overflow-hidden">
                  <div className="bg-red-100 border-b border-red-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                      <h4 className="text-red-800 font-semibold">
                        Errors ({importErrors.length})
                      </h4>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-red-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase border-b border-red-200">
                            Row
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase border-b border-red-200">
                            Message
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-200">
                        {importErrors.map((error, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-red-800 font-medium whitespace-nowrap">
                              {error.row ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-red-700">
                              {error.errorMessage}
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

        <div className="border-t border-gray-200 pt-6 mt-6 flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="cancel"
            onClick={handleCloseModal}
            disabled={isPending}
            className="w-full sm:w-auto"
            type="button"
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkImport}
            disabled={!file || isPending}
            isLoading={isPending}
            isLoadingText="Importing..."
            className="w-full sm:w-auto"
            type="button"
          >
            <FaFileUpload className="w-4 h-4" />
            Import courses
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
