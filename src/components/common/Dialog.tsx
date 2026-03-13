import React, { useLayoutEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// First, create a type for the size options
type DialogSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "full";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subTitle?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  size?: DialogSize;
  position?: "center" | "top";
  backdrop?: "none" | "blur" | "dark" | "darkBlur";
  animation?: "pop";
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "w-auto",
};

const positionClasses = {
  center: "items-center",
  top: "items-start pt-16",
};

const backdropClasses = {
  none: "bg-black bg-opacity-20",
  blur: "backdrop-blur-sm",
  dark: "bg-black bg-opacity-50",
  darkBlur: "bg-black bg-opacity-50 backdrop-blur-sm",
};

// Define pop animation variants
const popVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// Dialog stack counter to manage scroll lock
let openDialogCount = 0;
let originalBodyOverflow = "";
let originalBodyPaddingRight = "";

export default function Dialog({
  isOpen,
  onClose,
  title,
  subTitle,
  children,
  className = "",
  contentClassName = "",
  showCloseButton = true,
  size = "md",
  position = "center",
  backdrop = "none",
  animation,
}: DialogProps) {
  useLayoutEffect(() => {
    if (isOpen) {
      if (openDialogCount === 0) {
        const originalStyle = window.getComputedStyle(document.body);
        originalBodyOverflow = originalStyle.overflow;
        originalBodyPaddingRight = originalStyle.paddingRight;
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = "var(--scrollbar-width)";
      }
      openDialogCount++;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("keydown", handleEscape);
        openDialogCount--;
        if (openDialogCount === 0) {
          document.body.style.overflow = originalBodyOverflow;
          document.body.style.paddingRight = originalBodyPaddingRight;
        }
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            backdrop === "dark"
              ? "bg-black bg-opacity-70"
              : backdrop === "blur"
                ? "bg-black bg-opacity-50 backdrop-blur-sm"
                : backdrop === "darkBlur"
                  ? "bg-black bg-opacity-70 backdrop-blur-sm"
                  : "bg-transparent"
          } ${className}`}
        >
          {/* Backdrop */}
          <motion.div
            className={`fixed inset-0 ${backdropClasses[backdrop]}`}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Dialog position wrapper */}
          <div className={`fixed inset-0 overflow-y-auto`}>
            <div
              className={`flex min-h-full justify-center p-4 ${positionClasses[position]}`}
            >
              {/* Dialog panel with animation */}
              <motion.div
                variants={animation === "pop" ? popVariants : undefined}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`
                  relative transform overflow-hidden rounded-lg bg-white shadow-xl 
                  ${size === "full" ? "w-full sm:w-auto" : "w-full"} ${
                    sizeClasses[size]
                  } max-h-[90vh]
                  ${contentClassName}
                `}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-start justify-between p-4 border-b border-gray-200">
                    <div>
                      {title && (
                        <h3 className="text-lg font-semibold text-gray-900">
                          {title}
                        </h3>
                      )}
                      {subTitle && (
                        <h3 className="text-sm text-gray-400">{subTitle}</h3>
                      )}
                    </div>
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        <span className="sr-only">Close</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
