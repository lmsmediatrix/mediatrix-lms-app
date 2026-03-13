import { motion } from "framer-motion";
import { FaFire, FaCalendarCheck } from "react-icons/fa";

interface StudyStreakProps {
  data?: {
    totalActiveDays: number;
    allDates: string[];
    today: string;
    isActiveToday: boolean;
  };
}

export default function StudyStreak({ data }: StudyStreakProps) {
  const dates = data?.allDates ?? [];
  const isActiveToday = data?.isActiveToday ?? false;

  // Calculate consecutive streak from today/yesterday backward
  const streak = (() => {
    if (dates.length === 0) return 0;
    const sorted = [...dates].sort().reverse();
    const today = data?.today ?? "";
    // Allow starting from today or yesterday
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();

    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

    let count = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diffDays =
        (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diffDays) === 1) {
        count++;
      } else {
        break;
      }
    }
    return count;
  })();

  // Show last 7 days as dots
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d
      .toLocaleDateString("en-US", { weekday: "short" })
      .slice(0, 2);
    return {
      date: dateStr,
      label: dayLabel,
      active: dates.includes(dateStr),
    };
  });

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <FaFire
          className={`${streak > 0 ? "text-orange-500" : "text-gray-300"}`}
        />
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Study Streak
        </h3>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
            streak > 0
              ? "bg-gradient-to-br from-orange-400 to-red-500"
              : "bg-gray-100"
          }`}
        >
          <span
            className={`text-2xl font-bold ${
              streak > 0 ? "text-white" : "text-gray-400"
            }`}
          >
            {streak}
          </span>
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {streak === 0
              ? "No active streak"
              : streak === 1
                ? "1 day streak"
                : `${streak} day streak`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {data?.totalActiveDays ?? 0} total active days
          </p>
          {isActiveToday && (
            <div className="flex items-center gap-1 mt-1">
              <FaCalendarCheck className="text-green-500 text-[10px]" />
              <span className="text-[10px] font-medium text-green-600">
                Active today
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Last 7 days */}
      <div className="flex justify-between">
        {last7.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1.5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`h-3 w-3 rounded-full ${
                day.active
                  ? "bg-gradient-to-br from-orange-400 to-red-500"
                  : "bg-gray-200"
              }`}
            />
            <span className="text-[10px] text-gray-400">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
