import { useSchedule } from "../../hooks/useSection";
import {
  calculateDurationMinutes,
  convert24to12Format,
  formatDateMMMDDYYY,
} from "../../lib/dateUtils";
import { FaClock, FaCalendarAlt } from "react-icons/fa";

interface Colors {
  bg: string;
  text: string;
  border: string;
  dot: string;
  gradient: string;
  icon: string;
}

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

function getSectionColors(sectionCode: string): Colors {
  const colors: Colors[] = [
    {
      bg: "bg-blue-50/80",
      text: "text-blue-700",
      border: "border-blue-200/60",
      dot: "bg-blue-500",
      gradient: "from-blue-500 to-blue-600",
      icon: "text-blue-400",
    },
    {
      bg: "bg-emerald-50/80",
      text: "text-emerald-700",
      border: "border-emerald-200/60",
      dot: "bg-emerald-500",
      gradient: "from-emerald-500 to-emerald-600",
      icon: "text-emerald-400",
    },
    {
      bg: "bg-violet-50/80",
      text: "text-violet-700",
      border: "border-violet-200/60",
      dot: "bg-violet-500",
      gradient: "from-violet-500 to-violet-600",
      icon: "text-violet-400",
    },
    {
      bg: "bg-amber-50/80",
      text: "text-amber-700",
      border: "border-amber-200/60",
      dot: "bg-amber-500",
      gradient: "from-amber-500 to-amber-600",
      icon: "text-amber-400",
    },
    {
      bg: "bg-rose-50/80",
      text: "text-rose-700",
      border: "border-rose-200/60",
      dot: "bg-rose-500",
      gradient: "from-rose-500 to-rose-600",
      icon: "text-rose-400",
    },
  ];
  const hash = sectionCode
    .split("")
    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
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
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <FaCalendarAlt className="h-3.5 w-3.5 text-primary" />
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
                  className={`group relative rounded-xl border ${c.border} ${c.bg} p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                >
                  {/* Accent bar */}
                  <div
                    className={`absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b ${c.gradient}`}
                  />

                  <div className="flex items-center justify-between pl-3">
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`font-semibold text-sm ${c.text} truncate`}
                      >
                        {classItem.sectionName}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {classItem.sectionCode}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <FaClock className={`h-3 w-3 ${c.icon}`} />
                        <span className={`text-sm font-semibold ${c.text}`}>
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
