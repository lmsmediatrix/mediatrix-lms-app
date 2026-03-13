import { useState, useMemo } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import {
  formatDateMMMDDYYY,
  convert24to12Format,
  calculateDurationMinutes,
} from "../../lib/dateUtils";
import { useSchedule } from "../../hooks/useSection";
import WeeklyScheduleSkeleton from "../../components/skeleton/WeeklyScheduleSkeleton";

type ViewMode = "day" | "week" | "month";

interface Time {
  start: string;
  end: string;
}

interface ScheduleItem {
  sectionCode: string;
  sectionName: string;
  time: Time;
  displayDate?: string;
}

interface DayData {
  date: string;
  schedule: ScheduleItem[];
}

interface Section {
  code: string;
  name: string;
}

interface Colors {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getDayRange = (offset: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return { start: d, end: d, startISO: toISO(d), endISO: toISO(d) };
};

const getWeekRange = (offset: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const diff = -day;
  const start = new Date(today);
  start.setDate(today.getDate() + diff + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end, startISO: toISO(start), endISO: toISO(end) };
};

const getMonthRange = (offset: number) => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + offset + 1, 0);
  return { start, end, startISO: toISO(start), endISO: toISO(end) };
};

const SECTION_COLORS: Colors[] = [
  {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  {
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-rose-100",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
];

function getSectionColors(sectionCode: string): Colors {
  const hash = sectionCode
    .split("")
    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return SECTION_COLORS[hash % SECTION_COLORS.length];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("week");
  const [offset, setOffset] = useState(0);
  const todayISO = toISO(new Date());

  const range = useMemo(() => {
    if (view === "day") return getDayRange(offset);
    if (view === "week") return getWeekRange(offset);
    return getMonthRange(offset);
  }, [view, offset]);

  const { data, isPending } = useSchedule(range.startISO, range.endISO);

  const scheduleMap = useMemo<Record<string, ScheduleItem[]>>(() => {
    return (data?.data || []).reduce(
      (acc: Record<string, ScheduleItem[]>, dayData: DayData) => {
        acc[dayData.date] = [...(dayData.schedule || [])].sort((a, b) =>
          a.time.start.localeCompare(b.time.start),
        );
        return acc;
      },
      {},
    );
  }, [data]);

  const uniqueSections: Section[] = useMemo(
    () =>
      Array.from(
        new Map<string, Section>(
          (data?.data || [])
            .flatMap((day: DayData) => day.schedule)
            .map((item: ScheduleItem) => [
              item.sectionCode,
              { code: item.sectionCode, name: item.sectionName },
            ]),
        ).values(),
      ),
    [data],
  );

  const headerLabel = useMemo(() => {
    if (view === "day")
      return range.start.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    if (view === "week")
      return `${formatDateMMMDDYYY(range.start.toISOString(), false)} – ${formatDateMMMDDYYY(range.end.toISOString(), false)}`;
    return `${MONTH_NAMES[range.start.getMonth()]} ${range.start.getFullYear()}`;
  }, [view, range]);

  const handleViewChange = (v: ViewMode) => {
    setView(v);
    setOffset(0);
  };

  // ── Day View ──────────────────────────────────────────────
  const renderDay = () => {
    const classes = scheduleMap[range.startISO] || [];
    return (
      <div className="space-y-3">
        {classes.length ? (
          classes.map((item, i) => {
            const c = getSectionColors(item.sectionCode);
            return (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl border-l-4 px-5 py-4 ${c.bg} ${c.border}`}
              >
                <div>
                  <p className={`font-semibold ${c.text}`}>
                    {item.sectionName}
                  </p>
                  <p className={`text-sm ${c.text} opacity-70`}>
                    {item.sectionCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${c.text}`}>
                    {convert24to12Format(item.time.start)} –{" "}
                    {convert24to12Format(item.time.end)}
                  </p>
                  <p
                    className={`text-xs ${c.text} opacity-60 flex items-center justify-end gap-1 mt-0.5`}
                  >
                    <FaClock className="h-3 w-3" />
                    {calculateDurationMinutes(
                      item.time.start,
                      item.time.end,
                    )}{" "}
                    min
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaCalendarAlt className="h-10 w-10 mb-3 opacity-25" />
            <p className="text-sm">No classes scheduled for this day</p>
          </div>
        )}
      </div>
    );
  };

  // ── Week View ─────────────────────────────────────────────
  const renderWeek = () => {
    const days: Date[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(range.start);
      d.setDate(range.start.getDate() + i);
      return d;
    });
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-2">
        {days.map((day, i) => {
          const iso = toISO(day);
          const classes = scheduleMap[iso] || [];
          const isToday = iso === todayISO;
          return (
            <div
              key={i}
              className={`border rounded-xl bg-white overflow-hidden ${
                isToday ? "ring-2 ring-primary" : ""
              } ${classes.length ? "border-t-4 border-t-primary" : ""}`}
            >
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-semibold text-sm ${isToday ? "text-primary" : ""}`}
                    >
                      {DAY_NAMES[i]}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
                        Today
                      </span>
                    )}
                  </div>
                  {classes.length > 0 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      {classes.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {day.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="p-2 max-h-72 overflow-y-auto space-y-2">
                {classes.length ? (
                  classes.map((item, idx) => {
                    const c = getSectionColors(item.sectionCode);
                    return (
                      <div
                        key={idx}
                        className={`rounded-lg border p-2.5 ${c.bg} ${c.text} ${c.border}`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <div>
                            <p className="font-semibold text-xs leading-tight">
                              {item.sectionCode}
                            </p>
                            <p className="text-[11px] opacity-70 leading-tight">
                              {item.sectionName}
                            </p>
                          </div>
                          <span className="shrink-0 rounded border px-1.5 py-0.5 text-[10px]">
                            {calculateDurationMinutes(
                              item.time.start,
                              item.time.end,
                            )}
                            m
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <FaClock className="h-2.5 w-2.5 opacity-60" />
                          {convert24to12Format(item.time.start)} –{" "}
                          {convert24to12Format(item.time.end)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center py-5 text-gray-300">
                    <FaCalendarAlt className="h-5 w-5 mb-1" />
                    <p className="text-xs">No classes</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Month View ────────────────────────────────────────────
  const renderMonth = () => {
    const year = range.start.getFullYear();
    const month = range.start.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const startOffset = firstDayOfWeek;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const cells: (Date | null)[] = Array.from(
      { length: totalCells },
      (_, i) => {
        const dayNum = i - startOffset + 1;
        if (dayNum < 1 || dayNum > daysInMonth) return null;
        return new Date(year, month, dayNum);
      },
    );

    return (
      <div>
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day)
              return <div key={i} className="h-24 rounded-xl bg-gray-50/60" />;
            const iso = toISO(day);
            const classes = scheduleMap[iso] || [];
            const isToday = iso === todayISO;
            return (
              <div
                key={i}
                className={`h-24 rounded-xl border flex flex-col bg-white overflow-hidden p-1.5 ${
                  isToday
                    ? "ring-2 ring-primary border-primary/20"
                    : "border-gray-100"
                }`}
              >
                <span
                  className={`text-xs font-semibold leading-none mb-1 self-start ${
                    isToday
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px]"
                      : "text-gray-500 pl-0.5"
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="flex-1 overflow-y-auto space-y-0.5">
                  {classes.slice(0, 3).map((item, idx) => {
                    const c = getSectionColors(item.sectionCode);
                    return (
                      <div
                        key={idx}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium truncate ${c.bg} ${c.text}`}
                      >
                        {item.sectionCode}{" "}
                        {convert24to12Format(item.time.start)}
                      </div>
                    );
                  })}
                  {classes.length > 3 && (
                    <p className="text-[10px] text-gray-400 pl-1">
                      +{classes.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {view === "day" ? "Daily" : view === "week" ? "Weekly" : "Monthly"}{" "}
            Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{headerLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View switcher */}
          <div className="flex rounded-xl border bg-gray-50 p-1 text-sm">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={`rounded-lg px-4 py-1.5 font-medium capitalize transition-all ${
                  view === v
                    ? "bg-white shadow text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOffset((o) => o - 1)}
              className="rounded-lg border p-2 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <FaChevronLeft className="h-3 w-3" />
            </button>
            <button
              onClick={() => setOffset(0)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setOffset((o) => o + 1)}
              className="rounded-lg border p-2 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <FaChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      {uniqueSections.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-5">
          {uniqueSections.map((s) => (
            <div key={s.code} className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${getSectionColors(s.code).dot}`}
              />
              <span className="text-xs text-gray-600">
                {s.code} – {s.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {isPending ? (
        <WeeklyScheduleSkeleton />
      ) : view === "day" ? (
        renderDay()
      ) : view === "week" ? (
        renderWeek()
      ) : (
        renderMonth()
      )}
    </div>
  );
}
