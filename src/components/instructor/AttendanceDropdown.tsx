import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoChevronDown,
} from "react-icons/io5";
import { TAttendanceStatus } from "../../types/interfaces";
import { MdOutlineWatchLater } from "react-icons/md";

interface AttendanceDropdownProps {
  studentId: string;
  currentStatus: TAttendanceStatus;
  index: number;
  handleAttendanceUpdate: (
    studentId: string,
    dateIndex: number,
    status: TAttendanceStatus
  ) => void;
}

export default function AttendanceDropdown({
  studentId,
  currentStatus,
  index,
  handleAttendanceUpdate,
}: AttendanceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen((prev) => !prev);
  }, [isOpen, updateDropdownPosition]);

  // Update dropdown position on resize/scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => updateDropdownPosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isOpen, updateDropdownPosition]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const getAttendanceIcon = (status: TAttendanceStatus): JSX.Element | null => {
    switch (status) {
      case "present":
        return (
          <IoCheckmarkCircleOutline className="w-5 h-5 text-green-500 mx-2" />
        );
      case "absent":
        return <IoCloseCircleOutline className="w-5 h-5 text-red-500 mx-2" />;
      case "late":
        return <MdOutlineWatchLater className="w-5 h-5 text-yellow-500 mx-2" />;
      case "noClass":
      case "class not started yet":
        return <span className="text-gray-300">-</span>;
      default:
        return null;
    }
  };

  const dropdownMenu = useMemo(
    () =>
      isOpen && dropdownPos
        ? createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: `${dropdownPos.top}px`,
                left: `${dropdownPos.left}px`,
                transform: "translateX(-50%)",
                minWidth: 120,
                zIndex: 1000,
              }}
              className="bg-white border border-gray-200 rounded shadow-lg mt-1"
            >
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  handleAttendanceUpdate(studentId, index, "present");
                  setIsOpen(false);
                }}
              >
                <IoCheckmarkCircleOutline className="w-5 h-5 text-green-500" />
                Present
              </button>
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  handleAttendanceUpdate(studentId, index, "absent");
                  setIsOpen(false);
                }}
              >
                <IoCloseCircleOutline className="w-5 h-5 text-red-500" />
                Absent
              </button>
            </div>,
            document.body
          )
        : null,
    [isOpen, dropdownPos, studentId, index, handleAttendanceUpdate]
  );

  return (
    <td className="px-4 py-3 md:px-6 md:py-4 text-center relative">
      <div className="flex items-center justify-center">
        {getAttendanceIcon(currentStatus)}
        {currentStatus !== "noClass" && (
          <button
            ref={btnRef}
            onClick={toggleDropdown}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <IoChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>
      {dropdownMenu}
    </td>
  );
}
