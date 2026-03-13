import { FaArrowUp, FaCalendarAlt } from "react-icons/fa";
import { ComingUpCardProps } from "../../types/interfaces";
import { convert24to12Format } from "../../lib/dateUtils";

const statusConfig = {
  Today: {
    pill: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60",
    accent: "from-emerald-400 to-emerald-500",
    bar: "bg-emerald-400",
  },
  Tomorrow: {
    pill: "bg-blue-50 text-blue-600 ring-1 ring-blue-200/60",
    accent: "from-blue-400 to-blue-500",
    bar: "bg-blue-400",
  },
  Upcoming: {
    pill: "bg-gray-50 text-gray-500 ring-1 ring-gray-200/60",
    accent: "from-gray-300 to-gray-400",
    bar: "bg-gray-300",
  },
};

const ComingUpCard = ({
  type,
  title,
  points,
  dueDate,
  status,
}: ComingUpCardProps) => {
  const config = statusConfig[status] || statusConfig.Upcoming;

  return (
    <div className="group relative rounded-xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-full overflow-hidden">
      {/* Accent bar */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b ${config.accent}`}
      />

      <div className="pl-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            {type}
          </span>
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${config.pill}`}
          >
            {status}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-3 line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          {points && (
            <div className="flex items-center gap-1.5">
              <FaArrowUp className="h-2.5 w-2.5 text-amber-400" />
              <span className="font-medium">{points} pts</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <FaCalendarAlt className="h-2.5 w-2.5" />
            <span>{convert24to12Format(dueDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingUpCard;
