import React from "react";
import { FaFileUpload } from "react-icons/fa";
import Button from "./Button";
import { useNavigate } from "react-router-dom";

interface TableEmptyStateProps {
  title: string;
  description: string;
  secondaryActionLabel?: string;
  secondaryActionPath?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  colSpan?: number;
  type?:
    | "course"
    | "instructor"
    | "student"
    | "section"
    | "category"
    | "faculty";
  isFiltered?: boolean;
}

const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  title,
  description,
  secondaryActionLabel,
  secondaryActionPath,
  onSecondaryAction,
  colSpan = 6,
  type = "course",
  isFiltered = false,
}) => {
  const navigate = useNavigate();
  void colSpan;

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else if (secondaryActionPath && secondaryActionPath.startsWith("?")) {
      // If it's a search param, use navigate with the current path
      const searchParams = new URLSearchParams(
        secondaryActionPath.substring(1)
      );
      const currentPath = window.location.pathname;
      navigate({ pathname: currentPath, search: searchParams.toString() });
    } else if (secondaryActionPath) {
      navigate(secondaryActionPath);
    }
  };

  // Render the appropriate illustration based on type
  const renderIllustration = () => {
    switch (type) {
      case "course":
        return (
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="40"
              y="30"
              width="120"
              height="100"
              rx="8"
              fill="#F2F9FD"
              stroke="#60B2F0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <rect
              x="60"
              y="50"
              width="80"
              height="40"
              rx="4"
              fill="#60B2F0"
              fillOpacity="0.3"
            />
            <rect
              x="60"
              y="100"
              width="80"
              height="10"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="60"
              y="115"
              width="40"
              height="5"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <path d="M100 20L110 35H90L100 20Z" fill="#C0DB70" />
          </svg>
        );
      case "instructor":
        return (
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="100"
              cy="60"
              r="30"
              fill="#F2F9FD"
              stroke="#60B2F0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <circle cx="100" cy="50" r="12" fill="#3E5B93" fillOpacity="0.3" />
            <rect
              x="80"
              y="65"
              width="40"
              height="30"
              rx="15"
              fill="#3E5B93"
              fillOpacity="0.3"
            />
            <rect
              x="60"
              y="100"
              width="80"
              height="10"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="70"
              y="115"
              width="60"
              height="5"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
          </svg>
        );
      case "student":
        return (
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="70"
              cy="60"
              r="20"
              fill="#F2F9FD"
              stroke="#60B2F0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <circle cx="70" cy="55" r="8" fill="#60B2F0" fillOpacity="0.3" />
            <rect
              x="58"
              y="65"
              width="24"
              height="20"
              rx="10"
              fill="#60B2F0"
              fillOpacity="0.3"
            />

            <circle
              cx="130"
              cy="60"
              r="20"
              fill="#F2F9FD"
              stroke="#60B2F0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <circle cx="130" cy="55" r="8" fill="#60B2F0" fillOpacity="0.3" />
            <rect
              x="118"
              y="65"
              width="24"
              height="20"
              rx="10"
              fill="#60B2F0"
              fillOpacity="0.3"
            />

            <rect
              x="60"
              y="100"
              width="80"
              height="10"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="70"
              y="115"
              width="60"
              height="5"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
          </svg>
        );
      case "section":
        return (
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="40"
              y="40"
              width="120"
              height="80"
              rx="8"
              fill="#F2F9FD"
              stroke="#60B2F0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Course icon */}
            <rect
              x="50"
              y="50"
              width="30"
              height="20"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />

            {/* Instructor icon */}
            <circle cx="100" cy="60" r="10" fill="#60B2F0" fillOpacity="0.3" />
            <rect
              x="95"
              y="72"
              width="10"
              height="8"
              rx="4"
              fill="#60B2F0"
              fillOpacity="0.3"
            />

            {/* Students icon */}
            <circle cx="130" cy="55" r="5" fill="#C0DB70" fillOpacity="0.5" />
            <circle cx="140" cy="55" r="5" fill="#C0DB70" fillOpacity="0.5" />
            <circle cx="135" cy="65" r="5" fill="#C0DB70" fillOpacity="0.5" />

            {/* Calendar */}
            <rect
              x="60"
              y="90"
              width="80"
              height="20"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.1"
            />
            <rect
              x="65"
              y="95"
              width="10"
              height="10"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="80"
              y="95"
              width="10"
              height="10"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="95"
              y="95"
              width="10"
              height="10"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="110"
              y="95"
              width="10"
              height="10"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="125"
              y="95"
              width="10"
              height="10"
              rx="1"
              fill="#C0DB70"
              fillOpacity="0.5"
            />
          </svg>
        );
      case "category":
        return (
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="40"
              y="30"
              width="120"
              height="100"
              rx="8"
              fill="#F2F9FD"
              stroke="#60B2F0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Tag icon */}
            <path
              d="M70 50L90 50L110 70L90 90L70 90L50 70L70 50Z"
              fill="#60B2F0"
              fillOpacity="0.3"
            />
            <circle cx="80" cy="65" r="4" fill="#3E5B93" fillOpacity="0.5" />

            {/* Category list */}
            <rect
              x="60"
              y="100"
              width="80"
              height="8"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="60"
              y="115"
              width="60"
              height="8"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="120"
              y="40"
              width="20"
              height="20"
              rx="4"
              fill="#C0DB70"
              fillOpacity="0.5"
            />
          </svg>
        );
      case "faculty":
        return (
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="40"
              y="30"
              width="120"
              height="100"
              rx="8"
              fill="#F2F9FD"
              stroke="#60B2F0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Building icon */}
            <rect
              x="70"
              y="50"
              width="60"
              height="60"
              rx="4"
              fill="#60B2F0"
              fillOpacity="0.3"
            />
            <rect
              x="80"
              y="60"
              width="8"
              height="8"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.5"
            />
            <rect
              x="92"
              y="60"
              width="8"
              height="8"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.5"
            />
            <rect
              x="104"
              y="60"
              width="8"
              height="8"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.5"
            />
            <rect
              x="116"
              y="60"
              width="8"
              height="8"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.5"
            />
            <rect
              x="80"
              y="75"
              width="8"
              height="8"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.5"
            />
            <rect
              x="92"
              y="75"
              width="8"
              height="8"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.5"
            />
            <rect
              x="104"
              y="75"
              width="8"
              height="8"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.5"
            />
            <rect
              x="116"
              y="75"
              width="8"
              height="8"
              rx="1"
              fill="#3E5B93"
              fillOpacity="0.5"
            />
            <rect
              x="95"
              y="90"
              width="10"
              height="20"
              rx="2"
              fill="#C0DB70"
              fillOpacity="0.7"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full px-4 py-8">
      <div className="mx-auto flex min-h-[340px] w-full max-w-3xl flex-col items-center justify-center">
        {/* Illustration */}
        <div className="mb-6">{renderIllustration()}</div>

        {/* Title and Description */}
        <div className="mb-6 text-center">
          <h3 className="mb-2 text-xl font-bold text-gray-800">
            {isFiltered ? "No Results Found" : title}
          </h3>
          <p className="mx-auto max-w-lg text-gray-600">
            {isFiltered
              ? "Try adjusting your search or filter criteria to find what you're looking for."
              : description}
          </p>
        </div>

        {/* Actions - Only show actions if not in filtered state */}
        {!isFiltered && (
          <div className="flex flex-col gap-3 sm:flex-row">
            {secondaryActionLabel && (
              <Button
                variant="outline"
                onClick={handleSecondaryAction}
                className="flex items-center justify-center gap-2"
              >
                {secondaryActionLabel.includes("Bulk") ? (
                  <FaFileUpload />
                ) : null}{" "}
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableEmptyState;
