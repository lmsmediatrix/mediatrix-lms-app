import { motion } from "framer-motion";
import {
  FaClock,
  FaClipboardList,
  FaFileAlt,
  FaPencilAlt,
  FaTasks,
} from "react-icons/fa";

interface DeadlineItem {
  _id: string;
  title: string;
  type: string;
  totalPoints: number;
  endDate: string;
  daysLeft: number;
  sectionCode: string;
  sectionName: string;
}

interface UpcomingDeadlinesProps {
  data?: DeadlineItem[];
}

const typeIcons: Record<string, React.ReactNode> = {
  quiz: <FaPencilAlt className="text-blue-600 text-xs" />,
  exam: <FaFileAlt className="text-red-600 text-xs" />,
  assignment: <FaTasks className="text-amber-600 text-xs" />,
  activity: <FaClipboardList className="text-green-600 text-xs" />,
};

const typeIconBg: Record<string, string> = {
  quiz: "bg-blue-100",
  exam: "bg-red-100",
  assignment: "bg-amber-100",
  activity: "bg-green-100",
};

export default function UpcomingDeadlines({
  data = [],
}: UpcomingDeadlinesProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FaClock className="text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Upcoming Deadlines
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-gray-300">
          <FaClock className="text-3xl mb-2" />
          <p className="text-sm text-gray-400">No upcoming deadlines</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FaClock className="text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Upcoming Deadlines
        </h3>
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          {data.length}
        </span>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 group hover:bg-gray-100 transition-colors"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                typeIconBg[item.type] || "bg-gray-100"
              }`}
            >
              {typeIcons[item.type] || (
                <FaClipboardList className="text-gray-500 text-xs" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-400 uppercase">
                  {item.type}
                </span>
                <span className="text-[10px] text-gray-300">|</span>
                <span className="text-[10px] text-gray-400">
                  {item.sectionCode}
                </span>
                <span className="text-[10px] text-gray-300">|</span>
                <span className="text-[10px] text-gray-400">
                  {item.totalPoints} pts
                </span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500">{item.endDate}</p>
              <p
                className={`text-xs font-semibold ${
                  item.daysLeft <= 1
                    ? "text-red-500"
                    : item.daysLeft <= 3
                      ? "text-amber-500"
                      : "text-green-600"
                }`}
              >
                {item.daysLeft === 0
                  ? "Due today"
                  : item.daysLeft === 1
                    ? "Due tomorrow"
                    : `${item.daysLeft} days left`}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
