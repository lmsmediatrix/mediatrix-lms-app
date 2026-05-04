import React from "react";

interface ButtonProps {
  variant?:
    | "primary"
    | "outline"
    | "ghost"
    | "destructive"
    | "success"
    | "link"
    | "secondary"
    | "next"
    | "cancel"
    | "";
  className?: string;
  isLoading?: boolean;
  isLoadingText?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  children?: React.ReactNode;
}

export default function Button({
  variant,
  className,
  isLoading,
  isLoadingText = "Loading...",
  disabled,
  onClick,
  type = "button",
  children,
}: ButtonProps) {
  const baseClasses =
    "cb-button-pill flex justify-center items-center gap-2 px-4 py-2.5 transition-all duration-300";
  const variantClasses = {
    primary: "cb-button-primary",
    secondary: "cb-button-dark",
    outline: `cb-button-blue-outline`,
    ghost: `bg-transparent text-black ${
      !disabled && !isLoading ? "hover:bg-gray-100" : ""
    }`,
    destructive: `bg-red-500 text-white ${
      !disabled && !isLoading ? "hover:bg-red-600" : ""
    }`,
    success: `bg-green-500 text-white ${
      !disabled && !isLoading ? "hover:bg-green-600" : ""
    }`,
    link: `bg-transparent text-coinbase-link ${
      !disabled && !isLoading ? "hover:underline" : ""
    }`,
    next: "cb-button-primary",
    cancel: `bg-[#F3F4F6] border border-[#F3F4F6] text-[#565D6D] ${
      !disabled && !isLoading ? "hover:border-coinbase-blue" : ""
    }`,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${
        variant ? variantClasses[variant] : ""
      } ${className} ${
        disabled || isLoading
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer"
      }`}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {isLoadingText}
        </span>
      ) : (
        <>{children}</>
      )}
    </button>
  );
}
