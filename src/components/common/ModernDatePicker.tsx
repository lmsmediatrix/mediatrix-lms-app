import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePopoverPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const popoverWidth = 308;
      const popoverHeight = 356;
      const viewportPadding = 8;

      let left = rect.right - popoverWidth;
      left = Math.max(
        viewportPadding,
        Math.min(left, window.innerWidth - popoverWidth - viewportPadding),
      );

      const shouldOpenUp =
        rect.bottom + popoverHeight + viewportPadding > window.innerHeight &&
        rect.top - popoverHeight - viewportPadding > viewportPadding;

      const top = shouldOpenUp
        ? rect.top - popoverHeight - 8
        : rect.bottom + 8;

      setPopoverPosition({ top, left });
    };

    updatePopoverPosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTriggerArea =
        rootRef.current && rootRef.current.contains(target);
      const clickedPopover =
        popoverRef.current && popoverRef.current.contains(target);
      if (!clickedTriggerArea && !clickedPopover) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  const popoverContent = (
    <div
      ref={popoverRef}
      className="z-[1000] w-[308px] rounded-2xl border border-white/20 p-3 shadow-[0_24px_60px_-16px_rgba(2,6,23,0.9)]"
      style={{
        position: "fixed",
        top: popoverPosition.top,
        left: popoverPosition.left,
        background:
          "linear-gradient(155deg, color-mix(in srgb, var(--color-primary, #3b82f6) 35%, #020617 65%) 0%, #020617 55%, color-mix(in srgb, var(--color-primary, #3b82f6) 28%, #020617 72%) 100%)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white/85 hover:bg-white/10"
          aria-label="Previous month"
        >
          <FaChevronLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-sm font-semibold tracking-wide text-white">{monthLabel}</p>
        <button
          type="button"
          onClick={goNextMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white/85 hover:bg-white/10"
          aria-label="Next month"
        >
          <FaChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-semibold text-white/65">
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
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                selected
                  ? "text-white font-semibold shadow-[0_8px_20px_-10px_rgba(59,130,246,0.95)]"
                  : isToday
                    ? "border text-white"
                    : "text-white/90 hover:bg-white/12",
                !inCurrentMonth ? "text-white/45" : "",
                disabled ? "opacity-35 cursor-not-allowed hover:bg-transparent" : "",
              ].join(" ")}
              style={
                selected
                  ? {
                      backgroundColor:
                        "color-mix(in srgb, var(--color-primary, #3b82f6) 84%, white 16%)",
                    }
                  : isToday
                    ? {
                        borderColor:
                          "color-mix(in srgb, var(--color-primary, #3b82f6) 72%, white 28%)",
                        backgroundColor:
                          "color-mix(in srgb, var(--color-primary, #3b82f6) 24%, transparent 76%)",
                      }
                    : undefined
              }
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
          className="text-xs font-medium text-white/85 hover:text-white"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs font-medium text-white/70 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/12 px-3.5 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all backdrop-blur-md shadow-[0_8px_25px_-16px_rgba(15,23,42,0.9)]"
      >
        <BellIcon size={12} className="text-white/70 shrink-0" />
        <span>{triggerLabel}</span>
      </button>

      {isOpen && createPortal(popoverContent, document.body)}
    </div>
  );
}
