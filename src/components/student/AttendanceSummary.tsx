import { motion } from "framer-motion";
import { FaUserCheck } from "react-icons/fa";

interface AttendanceSummaryProps {
  data?: {
    total: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    attendanceRate: number;
  };
}

export default function AttendanceSummary({ data }: AttendanceSummaryProps) {
  const rate = data?.attendanceRate ?? 0;
  const total = data?.total ?? 0;

  const items = [
    {
      label: "Present",
      count: data?.present ?? 0,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      label: "Late",
      count: data?.late ?? 0,
      color: "bg-amber-500",
      textColor: "text-amber-600",
    },
    {
      label: "Absent",
      count: data?.absent ?? 0,
      color: "bg-red-500",
      textColor: "text-red-500",
    },
    {
      label: "Excused",
      count: data?.excused ?? 0,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
  ];

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <FaUserCheck className="text-green-500" />
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Attendance
        </h3>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-gray-300">
          <FaUserCheck className="text-2xl mb-2" />
          <p className="text-sm text-gray-400">No attendance records</p>
        </div>
      ) : (
        <>
          {/* Rate display */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`text-3xl font-bold ${
                rate >= 90
                  ? "text-green-600"
                  : rate >= 75
                    ? "text-amber-600"
                    : "text-red-500"
              }`}
            >
              {rate}%
            </div>
            <div className="text-xs text-gray-400">
              Attendance rate
              <br />
              <span className="text-gray-500 font-medium">
                {total} total records
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-gray-100 mb-4">
            {items.map(
              (item) =>
                item.count > 0 && (
                  <motion.div
                    key={item.label}
                    className={`${item.color} h-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / total) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                ),
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-gray-500">{item.label}</span>
                <span
                  className={`text-xs font-semibold ${item.textColor} ml-auto`}
                >
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
