import { motion } from "framer-motion";

interface PerformanceItem {
  _id: string;
  title: string;
  type: string;
  score: number;
  totalPoints: number;
  percentage: number;
  completedAt?: string;
}

interface PerformanceChartProps {
  data?: PerformanceItem[];
}

const typeColors: Record<string, string> = {
  quiz: "#6366f1",
  exam: "#ef4444",
  assignment: "#f59e0b",
  activity: "#10b981",
};

export default function PerformanceChart({ data = [] }: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm h-full">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Performance Trend
        </h3>
        <div className="flex items-center justify-center py-12 text-gray-300">
          <p className="text-sm text-gray-400">No performance data yet</p>
        </div>
      </div>
    );
  }

  const maxPercentage = 100;
  const barWidth = Math.max(24, Math.min(40, 600 / data.length));
  const chartHeight = 160;

  // Calculate average
  const avg =
    data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.percentage, 0) / data.length)
      : 0;

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Performance Trend
        </h3>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Avg:</span>
          <span
            className={`text-sm font-bold ${
              avg >= 75
                ? "text-green-600"
                : avg >= 50
                  ? "text-amber-600"
                  : "text-red-500"
            }`}
          >
            {avg}%
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="overflow-x-auto">
        <div
          className="flex items-end gap-1.5 min-w-fit"
          style={{ height: chartHeight + 32 }}
        >
          {data.map((item, index) => {
            const barHeight = (item.percentage / maxPercentage) * chartHeight;
            const color = typeColors[item.type] || "#6b7280";

            return (
              <div
                key={item._id}
                className="flex flex-col items-center gap-1 group relative"
                style={{ width: barWidth }}
              >
                {/* Tooltip */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <div className="bg-gray-800 text-white text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                    <p className="font-medium">{item.title}</p>
                    <p>
                      {item.score}/{item.totalPoints} ({item.percentage}%)
                    </p>
                  </div>
                </div>

                {/* Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(barHeight, 4) }}
                  transition={{ duration: 0.5, delay: index * 0.03 }}
                  className="rounded-t-md w-full cursor-pointer transition-opacity hover:opacity-80"
                  style={{ backgroundColor: color }}
                />

                {/* Label */}
                <span className="text-[9px] text-gray-400 truncate w-full text-center">
                  {item.title.length > 5
                    ? item.title.slice(0, 5) + "…"
                    : item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-gray-500 capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
