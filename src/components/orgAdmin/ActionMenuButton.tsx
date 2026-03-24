import { useState, useRef, useEffect } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import { FaFileExport, FaFileImport } from "react-icons/fa6";
import Button from "../common/Button";

interface ActionMenuButtonProps {
  entityTerm: string; // e.g., "Instructor" or "Student"
  onBulkImport?: () => void; // Function to open bulk import modal (optional)
  onExport?: () => void; // Function to open export modal (optional)
}

export default function ActionMenuButton({
  entityTerm,
  onBulkImport,
  onExport,
}: ActionMenuButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render the button if no actions are provided
  if (!onBulkImport && !onExport) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="!px-2"
      >
        <FiMoreHorizontal className="w-5 h-5" />
      </Button>
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg z-10">
          <ul className="py-1">
            {onBulkImport && (
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                onClick={() => {
                  onBulkImport();
                  setIsMenuOpen(false);
                }}
              >
                <FaFileImport className="w-4 h-4" />
                Bulk Import {entityTerm}s
              </li>
            )}
            {onExport && (
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                onClick={() => {
                  onExport();
                  setIsMenuOpen(false);
                }}
              >
                <FaFileExport className="w-4 h-4" />
                Export CSV
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
