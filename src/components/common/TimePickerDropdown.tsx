import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaTimes } from "react-icons/fa";

interface TimePickerDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  options: string[];
  isOptionDisabled?: (option: string) => boolean;
  placeholder?: string;
  hasError?: boolean;
  className?: string;
  disabled?: boolean;
}

interface TimeParts {
  clock: string;
  meridiem: "AM" | "PM";
  label: string;
}

const parse12HourClock = (value: string) => {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) return null;

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (hour < 1 || hour > 12) return null;

  return { hour, minute };
};

const to24HourTime = (clock12: string, meridiem: "AM" | "PM") => {
  const parsed = parse12HourClock(clock12);
  if (!parsed) return null;

  let hour24 = parsed.hour % 12;
  if (meridiem === "PM") {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`;
};

const formatManualClockInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 4);

  if (digitsOnly.length <= 2) return digitsOnly;
  return `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2)}`;
};

const parseTimeParts = (value: string): TimeParts | null => {
  const [hourValue, minuteValue] = value.split(":");
  const hour = Number.parseInt(hourValue, 10);
  const minute = Number.parseInt(minuteValue, 10);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const meridiem: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  const clock = `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return {
    clock,
    meridiem,
    label: `${clock} ${meridiem}`,
  };
};

export default function TimePickerDropdown({
  value = "",
  onChange,
  options,
  isOptionDisabled,
  placeholder = "Select time",
  hasError = false,
  className = "",
  disabled = false,
}: TimePickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<"up" | "down">("down");
  const [manualClock, setManualClock] = useState("");
  const [manualMeridiem, setManualMeridiem] = useState<"AM" | "PM">("AM");
  const [manualError, setManualError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedTime = useMemo(
    () => (value ? parseTimeParts(value) : null),
    [value]
  );

  useEffect(() => {
    if (!isOpen) return;

    const panelHeight = 340;
    const viewportPadding = 12;
    const wrapperRect = wrapperRef.current?.getBoundingClientRect();

    if (wrapperRect) {
      const availableSpaceBelow = window.innerHeight - wrapperRect.bottom;
      const availableSpaceAbove = wrapperRect.top;
      const shouldOpenUp =
        availableSpaceBelow < panelHeight &&
        availableSpaceAbove > availableSpaceBelow + viewportPadding;

      setOpenDirection(shouldOpenUp ? "up" : "down");
    }

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !value || !listRef.current) return;

    const selectedOption = Array.from(
      listRef.current.querySelectorAll<HTMLButtonElement>("button[data-time]")
    ).find((option) => option.dataset.time === value);

    selectedOption?.scrollIntoView({ block: "center" });
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;

    const parsedCurrentValue = value ? parseTimeParts(value) : null;
    if (parsedCurrentValue) {
      setManualClock(parsedCurrentValue.clock);
      setManualMeridiem(parsedCurrentValue.meridiem);
    } else {
      setManualClock("");
      setManualMeridiem("AM");
    }

    setManualError("");
  }, [isOpen, value]);

  const applyManualValue = () => {
    if (!manualClock) {
      setManualError("Please enter a time.");
      return;
    }

    const manual24hValue = to24HourTime(manualClock, manualMeridiem);
    if (!manual24hValue) {
      setManualError("Please enter a valid time (00:00).");
      return;
    }

    if (isOptionDisabled?.(manual24hValue)) {
      setManualError("This time is not allowed.");
      return;
    }

    onChange(manual24hValue);
    setManualError("");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#60B2F0] ${
          hasError ? "border-red-500" : "border-gray-300"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-100 text-gray-500"
            : "bg-white text-gray-700 hover:border-gray-400"
        }`}
      >
        <span className={selectedTime ? "text-gray-800" : "text-gray-500"}>
          {selectedTime?.label || placeholder}
        </span>
        <FaChevronDown
          className={`h-3 w-3 shrink-0 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 z-50 w-[240px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.45)] ${
            openDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-900">Select time:</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
              aria-label="Close time picker"
            >
              <FaTimes className="h-3 w-3" />
            </button>
          </div>

          <div className="mb-3 border-t border-gray-200" />

          <div
            ref={listRef}
            role="listbox"
            className="max-h-64 space-y-1 overflow-y-auto pr-1"
          >
            {options.map((option) => {
              const time = parseTimeParts(option);
              const isSelected = option === value;
              const optionIsDisabled = isOptionDisabled?.(option) ?? false;

              if (!time) return null;

              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={optionIsDisabled}
                  disabled={optionIsDisabled}
                  data-time={option}
                  onClick={() => {
                    if (optionIsDisabled) return;
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    optionIsDisabled
                      ? "cursor-not-allowed text-gray-300"
                      : isSelected
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium">{time.clock}</span>
                  <span className="ml-3 text-gray-500">{time.meridiem}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="text-xs font-medium text-gray-500">Manual input</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="00:00"
                maxLength={5}
                value={manualClock}
                onChange={(event) => {
                  setManualClock(formatManualClockInput(event.target.value));
                  if (manualError) setManualError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyManualValue();
                  }
                }}
                className={`h-9 w-full rounded-md border px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#60B2F0] ${
                  manualError ? "border-red-500" : "border-gray-300"
                }`}
              />
              <select
                value={manualMeridiem}
                onChange={(event) =>
                  setManualMeridiem(event.target.value as "AM" | "PM")
                }
                className="h-9 rounded-md border border-gray-300 px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#60B2F0]"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
              <button
                type="button"
                onClick={applyManualValue}
                className="h-9 shrink-0 rounded-md border border-primary/35 bg-primary/5 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                Set
              </button>
            </div>
            {manualError && (
              <p className="mt-1 text-xs text-red-500">{manualError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
