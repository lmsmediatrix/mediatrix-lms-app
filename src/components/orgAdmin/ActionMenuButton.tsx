import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { FiEdit2, FiEye, FiMoreHorizontal, FiPlus, FiTrash2, FiUpload } from "react-icons/fi";
import { FaFileExport } from "react-icons/fa6";
import { createPortal } from "react-dom";

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface ActionMenuButtonProps {
  entityTerm?: string; // e.g., "Instructor" or "Student"
  onBulkImport?: () => void; // Function to open bulk import modal (optional)
  onExport?: () => void; // Function to open export modal (optional)
  onAdd?: () => void; // Optional add action for toolbar menus
  items?: ActionMenuItem[]; // Custom actions (row-level or toolbar)
  align?: "left" | "right";
  buttonClassName?: string;
  menuClassName?: string;
}

export default function ActionMenuButton({
  entityTerm,
  onBulkImport,
  onExport,
  onAdd,
  items,
  align = "right",
  buttonClassName = "",
  menuClassName = "",
}: ActionMenuButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const fallbackItems: ActionMenuItem[] = [
    ...(onAdd
      ? [
          {
            key: "add",
            label: `Add ${entityTerm || "Item"}`,
            icon: <FiPlus className="w-4 h-4" />,
            onClick: onAdd,
          },
        ]
      : []),
    ...(onBulkImport
      ? [
          {
            key: "import",
            label: `Import ${entityTerm || "Item"}${entityTerm ? "s" : ""}`,
            icon: <FiUpload className="w-4 h-4" />,
            onClick: onBulkImport,
          },
        ]
      : []),
    ...(onExport
      ? [
          {
            key: "export",
            label: "Export CSV",
            icon: <FaFileExport className="w-4 h-4" />,
            onClick: onExport,
          },
        ]
      : []),
  ];

  const actionItems =
    items && items.length > 0
      ? items
      : fallbackItems.filter(
          (item, index, all) =>
            all.findIndex((candidate) => candidate.key === item.key) === index,
        );

  const getDefaultIcon = (label: string) => {
    const normalized = label.toLowerCase();
    if (normalized.includes("view")) return <FiEye className="w-4 h-4" />;
    if (normalized.includes("edit") || normalized.includes("update")) {
      return <FiEdit2 className="w-4 h-4" />;
    }
    if (normalized.includes("import")) return <FiUpload className="w-4 h-4" />;
    if (normalized.includes("export")) return <FaFileExport className="w-4 h-4" />;
    if (normalized.includes("delete")) return <FiTrash2 className="w-4 h-4" />;
    return null;
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth ?? 224; // fallback to w-56
      const menuHeight = menuRef.current?.offsetHeight ?? 0;
      const gap = 8;
      const viewportPadding = 8;

      let left =
        align === "left"
          ? triggerRect.left
          : triggerRect.right - menuWidth;

      left = Math.max(
        viewportPadding,
        Math.min(left, window.innerWidth - menuWidth - viewportPadding),
      );

      const spaceBelow = window.innerHeight - triggerRect.bottom - gap;
      const shouldOpenUpwards =
        menuHeight > 0 &&
        spaceBelow < menuHeight &&
        triggerRect.top > menuHeight + gap;

      const top = shouldOpenUpwards
        ? triggerRect.top - menuHeight - gap
        : triggerRect.bottom + gap;

      setMenuPosition({ top, left });
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    updatePosition();
    const rafId = window.requestAnimationFrame(updatePosition);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, isMenuOpen]);

  // Don't render the button if no actions are provided
  if (!actionItems.length) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef} data-row-click-stop="true">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 ${buttonClassName}`}
        data-row-click-stop="true"
      >
        <FiMoreHorizontal className="w-5 h-5" />
      </button>
      {isMenuOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={`fixed w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-[9999] ${menuClassName}`}
            style={{ top: menuPosition.top, left: menuPosition.left }}
            data-row-click-stop="true"
          >
            <ul className="py-1 divide-y divide-slate-200">
              {actionItems.map((item) => (
                <li
                  key={item.key}
                  className={`px-4 py-2.5 text-sm flex items-center gap-2 ${
                    item.disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : item.danger
                      ? "text-red-600 hover:bg-red-50 cursor-pointer"
                      : "text-slate-700 hover:bg-slate-50 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onClick();
                    setIsMenuOpen(false);
                  }}
                  data-row-click-stop="true"
                >
                  {item.icon || getDefaultIcon(item.label)}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
