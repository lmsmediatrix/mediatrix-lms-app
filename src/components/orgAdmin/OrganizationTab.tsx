import { useState } from "react";
import {
  FaDownload,
  FaUpload,
  FaCloudUploadAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useImportOrgSetup } from "../../hooks/useOrganization";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";

interface ErrorData {
  field: string;
  name: string;
  code: string;
  description: string;
}

interface ImportError {
  type: string;
  data: ErrorData;
  error: string;
}

interface ImportResponse {
  success: boolean;
  results: Record<string, any>;
  errors: {
    category?: ImportError[];
    faculty?: ImportError[];
    program?: ImportError[];
    department?: ImportError[];
  };
}

export default function OrganizationTab() {
  const { currentUser } = useAuth();
  const orgType = currentUser?.user?.organization?.type || "school";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { mutate: importOrgSetup, isPending } = useImportOrgSetup();

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const validExtensions = [".csv", ".xls", ".xlsx"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;

    if (
      !allowedTypes.includes(file.type) &&
      !validExtensions.includes(fileExtension)
    ) {
      toast.error(
        "Please select a valid CSV or Excel file (.csv, .xls, .xlsx)"
      );
      return false;
    }

    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return false;
    }

    return true;
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setImportErrors([]);
      setShowResults(false);
    } else {
      event.target.value = "";
      setSelectedFile(null);
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
      setSelectedFile(droppedFile);
      setImportErrors([]);
      setShowResults(false);
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    const importPromise = new Promise((resolve, reject) => {
      importOrgSetup(formData, {
        onSuccess: (response: ImportResponse) => {
          // Combine all error arrays into a single list for display
          const allErrors = Object.values(response.errors || {}).flat();
          setImportErrors(allErrors);
          setShowResults(true);

          if (allErrors.length > 0) {
            toast.warning(`Import completed with ${allErrors.length} errors`);
            resolve(response);
          } else if (response.success) {
            toast.success("Organization data imported successfully");
            setSelectedFile(null);
            setImportErrors([]);
            setShowResults(false);
            resolve(response);
          } else {
            toast.error("No data was imported");
            resolve(response);
          }
        },
        onError: (error: any) => {
          reject(error);
        },
      });
    });

    toast.promise(importPromise, {
      pending: "Importing organization data...",
      success: "Organization data imported successfully",
      error: {
        render({ data }) {
          return (
            (data as { message?: string })?.message ||
            "Failed to import organization data"
          );
        },
      },
    });
  };

  const handleDownloadTemplate = () => {
    const csvTemplate =
      orgType === "corporate"
        ? [
            "field,name,code,description,isActive,archive_status,archive_date",
            "program,Sample Program,PRG01,Optional description,true,false,",
            "department,Sample Department,DPT01,Optional description,true,false,",
          ].join("\n")
        : [
            "field,name,code,description,isActive,archive_status,archive_date",
            "category,Sample Category,,,true,false,",
            "faculty,Sample Faculty,FAC01,Optional description,true,false,",
            "program,Sample Program,PRG01,Optional description,true,false,",
          ].join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      orgType === "corporate"
        ? "ORG_SETUP_TEMPLATE_CORPORATE.csv"
        : "ORG_SETUP_TEMPLATE_SCHOOL.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-gray-900">
        Organization Settings
      </h2>
      <p className="text-gray-600 mb-6">
        Import and manage your organization's data.
      </p>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          CSV Data Import
        </h3>
        <p className="text-gray-600 mb-6">
          Import your organization's data using CSV files. Download the template
          first to ensure proper formatting.
        </p>

        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium mb-2 text-gray-900">
              Step 1: Download CSV Template
            </h4>
            <p className="text-gray-600 mb-4">
              Download our CSV template to ensure your data is formatted
              correctly for import.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-900 flex items-center"
            >
              <FaDownload className="w-4 h-4 mr-2" />
              Download CSV Template
            </button>
          </div>

          <div>
            <h4 className="text-md font-medium mb-2 text-gray-900">
              Step 2: Upload Your CSV File
            </h4>
            <p className="text-gray-600 mb-4">
              Fill in the template with your data and upload it here. The system
              will process and import your data.
            </p>
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 text-center ${
                isDragOver
                  ? "border-blue-500 bg-blue-50"
                  : selectedFile
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 hover:border-blue-500"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FaCloudUploadAlt
                className={`mx-auto mb-2 w-6 h-6 ${
                  isDragOver
                    ? "text-blue-500"
                    : selectedFile
                    ? "text-green-500"
                    : "text-gray-600"
                }`}
              />
              <p className="mb-2 text-gray-600">
                Drag and drop your CSV file here
              </p>
              <p className="text-gray-400 mb-4">or</p>
              <label className="mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                Browse Files
              </label>
              {selectedFile && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-center gap-2">
                    <FaCloudUploadAlt className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-800">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setImportErrors([]);
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

          {showResults && importErrors.length > 0 && (
            <div className="space-y-4">
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
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider border-b border-red-200">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider border-b border-red-200">
                          Code
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-800 uppercase tracking-wider border-b border-red-200">
                          Error Message
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-200">
                      {importErrors.map((error, index) => (
                        <tr key={index} className="hover:bg-red-75">
                          <td className="px-4 py-3 text-sm text-red-800 font-medium capitalize">
                            {error.type}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-700">
                            {error.data.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-600 font-mono">
                            {error.data.code || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-700">
                            {error.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setImportErrors([]);
                  setShowResults(false);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-900"
                disabled={isPending}
              >
                Cancel
              </button>
              <Button
                variant="primary"
                onClick={handleImport}
                className="flex items-center"
                disabled={!selectedFile || isPending}
                isLoading={isPending}
                isLoadingText="Importing..."
              >
                {!isPending && (
                  <>
                    <FaUpload className="w-4 h-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
