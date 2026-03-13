import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import AnnouncementCard from "./AnnouncementCard";
import Button from "./Button";
import {
  ComingUpCardProps,
  AnnouncementsCardProps,
} from "../../types/interfaces";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { useLocation, useNavigate } from "react-router-dom";
import { itemVariants } from "../../lib/animations";
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

export default function SidePanel({
  comingUpData,
  announcements,
  upcomingDeadlines = [],
  showComingUp = true,
}: {
  comingUpData: ComingUpCardProps[];
  announcements: AnnouncementsCardProps[];
  upcomingDeadlines?: DeadlineItem[];
  showComingUp?: boolean;
}) {
  const [showAllComingUp, setShowAllComingUp] = useState(false);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

  // Merge comingUp + deadlines into a single unified list
  const mergedComingUp = [
    ...(comingUpData || []).map((item: any) => ({
      id: `cu-${item.sectionCode}-${item.title}`,
      kind: "comingUp" as const,
      title: item.title,
      type: item.type,
      points: item.points,
      date: formatDateMMMDDYYY(item.dueDate),
      status: item.status,
      sectionCode: item.sectionCode,
      daysLeft:
        item.status === "Today" ? 0 : item.status === "Tomorrow" ? 1 : 2,
    })),
    ...(upcomingDeadlines || []).map((item) => ({
      id: `dl-${item._id}`,
      kind: "deadline" as const,
      title: item.title,
      type: item.type,
      points: item.totalPoints,
      date: item.endDate,
      status:
        item.daysLeft <= 0
          ? ("Today" as const)
          : item.daysLeft === 1
            ? ("Tomorrow" as const)
            : ("Upcoming" as const),
      sectionCode: item.sectionCode,
      daysLeft: item.daysLeft,
    })),
  ].sort((a, b) => a.daysLeft - b.daysLeft);

  const totalComingUp = mergedComingUp.length;
  const displayedItems = showAllComingUp
    ? mergedComingUp
    : mergedComingUp.slice(0, 4);
  const displayedAnnouncements = showAllAnnouncements
    ? announcements
    : announcements.slice(0, 3);
  const navigate = useNavigate();
  const location = useLocation();

  // Animation variants for container sliding
  const containerVariants: Variants = {
    collapsed: {
      opacity: 1,
      transition: { duration: 0.4, ease: "easeInOut" },
    },
    expanded: {
      opacity: 1,
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  };

  return (
    <div className="lg:pr-4 space-y-5">
      {/* Coming Up Section */}
      {showComingUp && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
              <svg
                className="h-3.5 w-3.5 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Coming Up</h3>
          </div>
          {comingUpData?.length > 0 && (
            <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-600 rounded-full">
              {totalComingUp}
            </span>
          )}
        </div>
        <div className="p-4">
          {totalComingUp > 0 ? (
            <motion.div
              className="lg:overflow-hidden"
              variants={containerVariants}
              initial="collapsed"
              animate={showAllComingUp ? "expanded" : "collapsed"}
            >
              <motion.div
                className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-hidden snap-x snap-mandatory pb-2 lg:pb-0"
                initial={false}
              >
                <AnimatePresence>
                  {displayedItems.map((item, index) => {
                    const typeIcons: Record<string, React.ReactNode> = {
                      quiz: (
                        <FaPencilAlt className="text-blue-600 text-[10px]" />
                      ),
                      exam: <FaFileAlt className="text-red-600 text-[10px]" />,
                      assignment: (
                        <FaTasks className="text-amber-600 text-[10px]" />
                      ),
                      activity: (
                        <FaClipboardList className="text-green-600 text-[10px]" />
                      ),
                      lesson: (
                        <FaClock className="text-indigo-600 text-[10px]" />
                      ),
                    };
                    const typeIconBg: Record<string, string> = {
                      quiz: "bg-blue-100",
                      exam: "bg-red-100",
                      assignment: "bg-amber-100",
                      activity: "bg-green-100",
                      lesson: "bg-indigo-100",
                    };
                    const typeLower = item.type?.toLowerCase() || "";
                    const urgencyColor =
                      item.daysLeft <= 0
                        ? "text-red-500"
                        : item.daysLeft <= 1
                          ? "text-red-500"
                          : item.daysLeft <= 3
                            ? "text-amber-500"
                            : "text-green-600";
                    const urgencyLabel =
                      item.daysLeft <= 0
                        ? "Due today"
                        : item.daysLeft === 1
                          ? "Due tomorrow"
                          : `${item.daysLeft} days left`;

                    return (
                      <motion.div
                        key={item.id}
                        className="snap-start min-w-[260px] lg:min-w-0 rounded-xl border border-gray-100 bg-white p-3 transition-all hover:shadow-sm hover:cursor-pointer"
                        onClick={() => {
                          navigate(
                            location.pathname.replace(
                              "dashboard",
                              `sections/${item.sectionCode}`,
                            ),
                          );
                        }}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.3, delay: index * 0.06 }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                              typeIconBg[typeLower] || "bg-gray-100"
                            }`}
                          >
                            {typeIcons[typeLower] || (
                              <FaClipboardList className="text-gray-500 text-[10px]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-gray-400 uppercase font-medium">
                                {item.type}
                              </span>
                              {item.sectionCode && (
                                <>
                                  <span className="text-[10px] text-gray-300">
                                    •
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {item.sectionCode}
                                  </span>
                                </>
                              )}
                              {item.points > 0 && (
                                <>
                                  <span className="text-[10px] text-gray-300">
                                    •
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {item.points} pts
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[11px] text-gray-400">
                                {item.date}
                              </span>
                              <span
                                className={`text-[11px] font-semibold ${urgencyColor}`}
                              >
                                {urgencyLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center py-8 text-gray-300">
              <svg
                className="h-8 w-8 mb-2 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-400">No upcoming tasks yet</p>
            </div>
          )}

          {totalComingUp > 4 && (
            <Button
              variant="link"
              className="w-fit hidden md:block mt-3 text-sm"
              onClick={() => setShowAllComingUp(!showAllComingUp)}
            >
              {showAllComingUp ? "Show Less" : `View All (${totalComingUp})`}
            </Button>
          )}
        </div>
        </div>
      )}

      {/* Announcements Section */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
              <svg
                className="h-3.5 w-3.5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Announcements</h3>
          </div>
          {announcements?.length > 0 && (
            <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
              {announcements.length}
            </span>
          )}
        </div>
        <div className="p-4">
          {announcements?.length > 0 ? (
            <motion.div
              className="lg:overflow-hidden"
              variants={containerVariants}
              initial="collapsed"
              animate={showAllAnnouncements ? "expanded" : "collapsed"}
            >
              <motion.div
                className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-hidden snap-x snap-mandatory pb-2 lg:pb-0"
                initial={false}
              >
                <AnimatePresence>
                  {displayedAnnouncements.map((item: any, index: number) => {
                    const plainText = item.content
                      .replace(/<[^>]+>/g, "")
                      .trim();

                    return (
                      <motion.div
                        key={index}
                        className="snap-start min-w-[260px] max-w-[260px] lg:max-w-none lg:w-full"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <AnnouncementCard
                          onClick={() =>
                            navigate(
                              location.pathname.replace(
                                "dashboard",
                                `sections/${item.sectionCode}?tab=announcements&id=${item._id}`,
                              ),
                            )
                          }
                          authorName={item.authorName}
                          authorImage={item.authorImage}
                          content={plainText}
                          postedAt={formatDateMMMDDYYY(item.postedAt)}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center py-8 text-gray-300">
              <svg
                className="h-8 w-8 mb-2 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              <p className="text-sm text-gray-400">No announcements yet</p>
            </div>
          )}
          {announcements?.length > 3 && (
            <Button
              variant="link"
              className="w-fit mt-3 hidden md:block text-sm"
              onClick={() => setShowAllAnnouncements(!showAllAnnouncements)}
            >
              {showAllAnnouncements ? "Show Less" : "View More"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
