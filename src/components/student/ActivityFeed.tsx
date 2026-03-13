import { motion } from "framer-motion";
import {
  FaHistory,
  FaBookOpen,
  FaClipboardCheck,
  FaSignInAlt,
  FaEdit,
  FaEye,
} from "react-icons/fa";

interface ActivityItem {
  _id: string;
  action: string;
  description: string;
  entityType?: string;
  timeAgo: string;
}

interface ActivityFeedProps {
  data?: ActivityItem[];
}

const actionIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
  create: {
    icon: <FaEdit className="text-blue-600 text-[10px]" />,
    bg: "bg-blue-100",
  },
  update: {
    icon: <FaEdit className="text-violet-600 text-[10px]" />,
    bg: "bg-violet-100",
  },
  getAll: {
    icon: <FaEye className="text-gray-600 text-[10px]" />,
    bg: "bg-gray-100",
  },
  getById: {
    icon: <FaEye className="text-gray-600 text-[10px]" />,
    bg: "bg-gray-100",
  },
  search: {
    icon: <FaEye className="text-indigo-600 text-[10px]" />,
    bg: "bg-indigo-100",
  },
  delete: {
    icon: <FaClipboardCheck className="text-red-600 text-[10px]" />,
    bg: "bg-red-100",
  },
  custom: {
    icon: <FaSignInAlt className="text-green-600 text-[10px]" />,
    bg: "bg-green-100",
  },
};

export default function ActivityFeed({ data = [] }: ActivityFeedProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm h-full">
        <div className="flex items-center gap-2 mb-4">
          <FaHistory className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Recent Activity
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-gray-300">
          <FaHistory className="text-3xl mb-2" />
          <p className="text-sm text-gray-400">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm h-full overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <FaHistory className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Recent Activity
        </h3>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />

        <div className="space-y-3">
          {data.map((item, index) => {
            const config = actionIcons[item.action] || {
              icon: <FaBookOpen className="text-gray-500 text-[10px]" />,
              bg: "bg-gray-100",
            };

            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="flex items-start gap-3 relative pl-1"
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${config.bg} z-10 flex-shrink-0`}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs text-gray-700 truncate">
                    {item.description || item.action}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.entityType && (
                      <span className="text-[10px] text-gray-400 capitalize">
                        {item.entityType}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-300">
                      {item.timeAgo}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
