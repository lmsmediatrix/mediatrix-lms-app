import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaClipboardList } from "react-icons/fa";

interface GradeItem {
  _id: string;
  title: string;
  type: string;
  score: number;
  totalPoints: number;
  percentage: number;
  isPassed: boolean;
  sectionCode?: string;
  completedAt?: string;
}

interface RecentGradesProps {
  data?: GradeItem[];
}

const typeColors: Record<string, string> = {
  quiz: "bg-blue-100 text-blue-700",
  exam: "bg-red-100 text-red-700",
  assignment: "bg-amber-100 text-amber-700",
  activity: "bg-green-100 text-green-700",
};

export default function RecentGrades({ data = [] }: RecentGradesProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm h-full">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Recent Grades
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-300">
          <FaClipboardList className="text-3xl mb-2" />
          <p className="text-sm text-gray-400">No grades yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm h-full overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Recent Grades
      </h3>
      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
        {data.map((grade, index) => (
          <motion.div
            key={grade._id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  grade.isPassed ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {grade.isPassed ? (
                  <FaCheckCircle className="text-green-600 text-xs" />
                ) : (
                  <FaTimesCircle className="text-red-500 text-xs" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {grade.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                      typeColors[grade.type] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {grade.type}
                  </span>
                  {grade.sectionCode && (
                    <span className="text-[10px] text-gray-400">
                      {grade.sectionCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-sm font-bold text-gray-800">
                {grade.score}/{grade.totalPoints}
              </p>
              <p
                className={`text-xs font-medium ${
                  grade.percentage >= 75
                    ? "text-green-600"
                    : grade.percentage >= 50
                      ? "text-amber-600"
                      : "text-red-500"
                }`}
              >
                {grade.percentage}%
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
