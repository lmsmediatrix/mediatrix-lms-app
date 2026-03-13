import { motion } from "framer-motion";
import { FaBookOpen, FaClipboardCheck } from "react-icons/fa";

interface OverallProgressProps {
  data?: {
    totalLessons: number;
    completedLessons: number;
    totalAssessments: number;
    completedAssessments: number;
    totalItems: number;
    completedItems: number;
    percent: number;
  };
}

export default function OverallProgress({ data }: OverallProgressProps) {
  const percent = data?.percent ?? 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Overall Progress
      </h3>
      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" className="-rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="10"
            />
            <motion.circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <defs>
              <linearGradient
                id="progressGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-800">{percent}%</span>
            <span className="text-[10px] text-gray-400">Complete</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <FaBookOpen className="text-indigo-600 text-xs" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {data?.completedLessons ?? 0}/{data?.totalLessons ?? 0}
              </p>
              <p className="text-xs text-gray-500">Lessons</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-violet-50 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <FaClipboardCheck className="text-violet-600 text-xs" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {data?.completedAssessments ?? 0}/{data?.totalAssessments ?? 0}
              </p>
              <p className="text-xs text-gray-500">Assessments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
