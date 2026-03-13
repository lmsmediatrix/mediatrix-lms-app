import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaBookOpen, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

interface SummaryItem {
  _id?: string;
  value: string;
  label: string;
  title?: string;
  date?: string;
  section?: string;
  moduleId?: string;
  lessonId?: string;
}

interface SummaryProps {
  summaryData?: SummaryItem[];
}

const accentStyles = [
  {
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
    iconBg: "bg-blue-100",
    ring: "ring-blue-100",
    bar: "bg-gradient-to-b from-blue-500 to-indigo-500",
  },
  {
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
    text: "text-violet-600",
    iconBg: "bg-violet-100",
    ring: "ring-violet-100",
    bar: "bg-gradient-to-b from-violet-500 to-purple-500",
  },
  {
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
    iconBg: "bg-amber-100",
    ring: "ring-amber-100",
    bar: "bg-gradient-to-b from-amber-500 to-orange-500",
  },
];

export default function Summary({ summaryData = [] }: SummaryProps) {
  const { currentUser } = useAuth();
  const role = currentUser.user.role;
  const navigate = useNavigate();

  if (summaryData.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center shadow-sm">
        <FaBookOpen className="mx-auto mb-3 text-3xl text-gray-300" />
        <p className="text-gray-400 text-sm">No lessons in progress</p>
      </div>
    );
  }

  const gridColsClass =
    summaryData.length === 1
      ? "grid-cols-1 max-w-sm"
      : summaryData.length === 2
        ? "grid-cols-1 sm:grid-cols-2 max-w-2xl"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid ${gridColsClass} gap-4`}>
      {summaryData.map((item, index) => {
        const style = accentStyles[index % accentStyles.length];
        return (
          <motion.div
            key={`${item._id || "item"}-${index}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            onClick={() => {
              role === "student" &&
                navigate(
                  `/${currentUser.user.organization.code}/student/sections/${item.section}/lessons/${item.lessonId}?module=${item.moduleId}`,
                );
            }}
            className="group relative flex cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            {/* Accent bar */}
            <div className={`w-1 shrink-0 ${style.bar}`} />

            <div className="flex flex-1 flex-col justify-between gap-3 p-4">
              {/* Top: icon + section code */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${style.iconBg}`}
                >
                  <FaBookOpen className={`text-xs ${style.text}`} />
                </div>
                {item.section && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    {item.section}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                className={`text-base font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:${style.text} transition-colors`}
              >
                {item.value || item.title}
              </h3>

              {/* Date + arrow */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {item.label || item.date}
                </span>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${style.iconBg} opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                  <FaArrowRight className={`text-[10px] ${style.text}`} />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
