import { ReactNode, useState } from "react";
import { IoChevronDown } from "react-icons/io5";

interface AccordionProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  actionButton?: ReactNode;
  updateDeleteBtn?: ReactNode;
}

export default function Accordion({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  actionButton,
  updateDeleteBtn,
}: AccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-gray-100 rounded-lg border border-gray-200">
      <div className="flex items-stretch w-full">
        <div className="flex-1 flex items-center gap-2 ">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-4 pl-2 md:pl-4 flex-1 w-full flex h-full items-center gap-2 hover:underline text-left"
          >
            <IoChevronDown
              className={`text-gray-400 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
            <span className="text-sm md:text-base font-medium text-gray-900 line-clamp-1 flex-1">
              {title}
            </span>
            {subtitle && (
              <div className="hidden md:block text-sm md:text-base text-gray-600">
                {subtitle}
              </div>
            )}
          </button>
          {updateDeleteBtn && (
            <div className="flex items-center gap-3">{updateDeleteBtn}</div>
          )}
        </div>
        {actionButton && (
          <div className="flex items-stretch">{actionButton}</div>
        )}
      </div>

      {isExpanded && <div className="border-t border-gray-200">{children}</div>}
    </div>
  );
}
