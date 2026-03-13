import React from "react";
import { ApiError } from "../config/apiClient";

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

// Custom SVG icons
const ErrorIcons = {
  General: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8V12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
  Timeout: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 6V12L16 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Server: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="16" r="1" fill="currentColor" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="16" cy="8" r="1" fill="currentColor" />
    </svg>
  ),
  Connection: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 4C4.5 4 2 12 2 12C2 12 4.5 20 12 20C19.5 20 22 12 22 12C22 12 19.5 4 12 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  // Check if it's our custom ApiError

  const isApiError = error instanceof ApiError;

  // Default values
  let title = "An error occurred";
  let message = error.message || "Something went wrong";
  let Icon = ErrorIcons.General;
  let errorType = "general";

  // Customize based on error type
  if (isApiError) {
    const apiError = error as ApiError;

    console.log(apiError);

    if (apiError.code === "ECONNABORTED") {
      title = "Request Timeout";
      message = "The request took too long to complete. Please try again.";
      Icon = ErrorIcons.Timeout;
      errorType = "timeout";
    } else if (apiError.status) {
      title = `Server Error (${apiError.status})`;
      message = apiError.message;
      Icon = ErrorIcons.Server;
      errorType = "server";
    } else if (apiError.originalError?.request) {
      title = "Connection Error";
      message =
        "Unable to connect to the server. Please check your internet connection.";
      Icon = ErrorIcons.Connection;
      errorType = "connection";
    }
  }

  // Get error type specific colors
  const getErrorTypeStyles = () => {
    switch (errorType) {
      case "timeout":
        return "border-warning bg-warning/10 text-warning";
      case "server":
        return "border-danger bg-danger/10 text-danger";
      case "connection":
        return "border-secondary bg-secondary/10 text-secondary";
      default:
        return "border-primary bg-primary/10 text-primary";
    }
  };

  return (
    <div
      className={`p-6 border rounded-lg shadow-md ${getErrorTypeStyles()} transition-all duration-300 backdrop-blur-[2px] bg-opacity-95`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-full">
          <Icon />
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>

      <div className="bg-white bg-opacity-10 p-4 rounded-md mb-5">
        <p className="opacity-90">{message}</p>
      </div>

      <div className="flex justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 4V10H7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.51 15C4.15839 17.3304 5.6292 19.3307 7.61019 20.6127C9.59118 21.8947 11.9488 22.3654 14.2443 21.9249C16.5399 21.4844 18.5951 20.1623 19.9831 18.2134C21.3712 16.2646 22 13.8226 22 11.3C22 8.77744 21.3712 6.33541 19.9831 4.38658C18.5951 2.43774 16.5399 1.11562 14.2443 0.675115C11.9488 0.234609 9.59118 0.705283 7.61019 1.98729C5.6292 3.2693 4.15839 5.26958 3.51 7.6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
