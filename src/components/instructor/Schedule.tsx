import React from "react";
import { useSchedule } from "../../hooks/useSection";
import {
  calculateDurationMinutes,
  convert24to12Format,
  formatDateMMMDDYYY,
} from "../../lib/dateUtils";
import { FaClock, FaCalendarAlt } from "react-icons/fa";

interface Time {
  start: string;
  end: string;
}

interface ScheduleItem {
  date: string;
  day: string;
  time: Time;
  sectionCode: string;
  sectionName: string;
}

interface ScheduleProps {
  variant?: "card" | "embedded";
  className?: string;
  showHeader?: boolean;
}

// Fixed distinct palette — hardcoded so section colors never clash
// regardless of the org's CSS variable customizations.
const SECTION_PALETTE: { bg: string; border: string; accent: string; text: string }[] = [
  { bg: "#dbeafe", border: "#93c5fd", accent: "#3b82f6", text: "#1d4ed8" }, // blue
  { bg: "#dcfce7", border: "#86efac", accent: "#22c55e", text: "#15803d" }, // green
  { bg: "#fef3c7", border: "#fcd34d", accent: "#f59e0b", text: "#b45309" }, // amber
  { bg: "#fee2e2", border: "#fca5a5", accent: "#ef4444", text: "#b91c1c" }, // red
  { bg: "#ede9fe", border: "#c4b5fd", accent: "#8b5cf6", text: "#6d28d9" }, // purple
  { bg: "#fce7f3", border: "#f9a8d4", accent: "#ec4899", text: "#be185d" }, // pink
  { bg: "#ccfbf1", border: "#5eead4", accent: "#14b8a6", text: "#0f766e" }, // teal
  { bg: "#ffedd5", border: "#fdba74", accent: "#f97316", text: "#c2410c" }, // orange
];

function getSectionColors(sectionCode: string) {
  const hash = sectionCode
    .split("")
    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const p = SECTION_PALETTE[hash % SECTION_PALETTE.length];

  return {
    cardStyle: {
      backgroundColor: p.bg,
      borderColor:     p.border,
    } as React.CSSProperties,
    accentStyle: {
      background: `linear-gradient(to bottom, ${p.accent}, ${p.text})`,
    } as React.CSSProperties,
    textStyle: {
      color: p.text,
    } as React.CSSProperties,
    iconStyle: {
      color: p.accent,
    } as React.CSSProperties,
  };
}

export default function Schedule({
  variant = "card",
  className,
  showHeader = true,
}: ScheduleProps) {
  const today = new Date().toISOString().split("T")[0];
  const { data, isPending } = useSchedule(today, today);

  const todaySchedule = data?.data[0]?.schedule || [];

  const content = (
    <>
      {showHeader && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
              }}
            >
              <FaCalendarAlt
                className="h-3.5 w-3.5"
                style={{ color: "var(--color-primary, #2563eb)" }}
              />
            </div>
            <h2 className="font-semibold text-gray-900">
              {todaySchedule.length > 0
                ? formatDateMMMDDYYY(todaySchedule[0].date, true)
                : "Today"}
            </h2>
          </div>
          <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {todaySchedule.length}{" "}
            {todaySchedule.length === 1 ? "class" : "classes"}
          </span>
        </div>
      )}

      {/* Body */}
      <div className={`flex-1 ${showHeader ? "p-4" : "p-0"}`}>
        {isPending ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Loading schedule...</p>
          </div>
        ) : todaySchedule.length > 0 ? (
          <div className="space-y-3 max-h-[340px] overflow-y-auto">
            {todaySchedule.map((classItem: ScheduleItem, index: number) => {
              const c = getSectionColors(classItem.sectionCode);
              return (
                <div
                  key={index}
                  className="group relative rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  style={c.cardStyle}
                >
                  {/* Per-section accent bar on the left */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                    style={c.accentStyle}
                  />

                  <div className="flex items-center justify-between pl-3">
                    <div className="min-w-0 flex-1">
                      <h4
                        className="font-semibold text-sm truncate"
                        style={c.textStyle}
                      >
                        {classItem.sectionName}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {classItem.sectionCode}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <FaClock className="h-3 w-3" style={c.iconStyle} />
                        <span className="text-sm font-semibold" style={c.textStyle}>
                          {convert24to12Format(classItem.time.start)} -{" "}
                          {convert24to12Format(classItem.time.end)}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {calculateDurationMinutes(
                          classItem.time.start,
                          classItem.time.end,
                        )}{" "}
                        min
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-gray-300">
            <FaCalendarAlt className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm text-gray-400">
              No classes scheduled for today
            </p>
          </div>
        )}
      </div>
    </>
  );

  if (variant === "embedded") {
    return <div className={`flex flex-col ${className || ""}`}>{content}</div>;
  }

  return (
    <div className={`lg:col-span-2 ${className || ""}`.trim()}>
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
        {content}
      </div>
    </div>
  );
}
