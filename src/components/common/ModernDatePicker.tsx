import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { BellIcon } from "@/components/ui/bell-icon";

interface ModernDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  max?: string;
  min?: string;
}

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateString = (dateString?: string): Date | null => {
  if (!dateString) return null;
  const [y, m, d] = dateString.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function ModernDatePicker({
  value,
  onChange,
  max,
  min,
}: ModernDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateString(value), [value]);
  const [viewDate, setViewDate] = useState<Date>(selectedDate ?? new Date());
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const maxDate = useMemo(() => parseDateString(max), [max]);
  const minDate = useMemo(() => parseDateString(min), [min]);
  const today = new Date();

  const monthLabel = useMemo(
    () => viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [viewDate],
  );

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [viewDate]);

  const isDisabled = (date: Date) => {
    const minBlocked = minDate ? date < minDate : false;
    const maxBlocked = maxDate ? date > maxDate : false;
    return minBlocked || maxBlocked;
  };

  const goPrevMonth = () =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goNextMonth = () =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const selectDate = (date: Date) => {
    if (isDisabled(date)) return;
    onChange(toLocalDateString(date));
    setIsOpen(false);
  };

  const triggerLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select date";

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/12 px-3.5 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all backdrop-blur-md shadow-[0_8px_25px_-16px_rgba(15,23,42,0.9)]"
      >
        <BellIcon size={12} className="text-white/70 shrink-0" />
        <span>{triggerLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[308px] rounded-2xl border border-white/20 bg-slate-900/92 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10"
              aria-label="Previous month"
            >
              <FaChevronLeft className="h-3.5 w-3.5" />
            </button>
            <p className="text-sm font-semibold tracking-wide text-white">{monthLabel}</p>
            <button
              type="button"
              onClick={goNextMonth}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10"
              aria-label="Next month"
            >
              <FaChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-semibold text-white/55">
            {WEEK_DAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const inCurrentMonth = day.getMonth() === viewDate.getMonth();
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, today);
              const disabled = isDisabled(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDate(day)}
                  disabled={disabled}
                  className={[
                    "h-9 rounded-lg text-sm transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
                    selected
                      ? "bg-cyan-500 text-white font-semibold shadow-[0_6px_20px_-10px_rgba(34,211,238,0.95)]"
                      : isToday
                        ? "border border-cyan-300/60 text-cyan-200"
                        : "text-white/90 hover:bg-white/10",
                    !inCurrentMonth ? "text-white/35" : "",
                    disabled ? "opacity-35 cursor-not-allowed hover:bg-transparent" : "",
                  ].join(" ")}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                if (!isDisabled(now)) {
                  onChange(toLocalDateString(now));
                  setViewDate(now);
                  setIsOpen(false);
                }
              }}
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-white/65 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
