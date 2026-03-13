import { ReactNode } from "react";
import { FaRegClock, FaTasks, FaUser } from "react-icons/fa";
import { LuCircleDashed } from "react-icons/lu";
import { RiCheckDoubleLine } from "react-icons/ri";
import { dateFilter } from "../../types/interfaces";

interface StatItem {
  title: string;
  value: string | number;
  change: string;
  icon: ReactNode;
  bgColor: string;
  textColor: string;
  iconBgColor: string;
  iconTextColor: string;
}

type UserType = "instructor" | "student";
type MetricsData = any; // Replace with a more specific type if available from your API

export const generateStats = (
  metricsData: MetricsData,
  userType: UserType,
  selectedPeriod: dateFilter
): StatItem[] => {
  const getTrendText = (trend: string, change: number | string) => {
    const periodText = {
      today: "today",
      week: "this week",
      month: "this month",
      year: "this year",
    }[selectedPeriod] || "this period";
  
    return trend === "unchanged"
      ? `Unchanged ${periodText}`
      : `${trend === "increased" ? "Increased" : "Decreased"} by ${change} ${periodText}`;
  };

  if (!metricsData?.data) return [];

  if (userType === "instructor") {
    return [
      {
        title: "Full-time Instructors",
        value: metricsData.data.fullTime.current,
        change: getTrendText(
          metricsData.data.fullTime.trend,
          metricsData.data.fullTime.change
        ),
        icon: <RiCheckDoubleLine className="text-xl" />,
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
        iconBgColor: "bg-blue-500",
        iconTextColor: "text-white",
      },
      {
        title: "Part-time Instructors",
        value: metricsData.data.partTime.current,
        change: getTrendText(
          metricsData.data.partTime.trend,
          metricsData.data.partTime.change
        ),
        icon: <LuCircleDashed className="text-xl" />,
        bgColor: "bg-green-50",
        textColor: "text-green-600",
        iconBgColor: "bg-green-500",
        iconTextColor: "text-white",
      },
      {
        title: "Probationary Instructors",
        value: metricsData.data.probationary.current,
        change: getTrendText(
          metricsData.data.probationary.trend,
          metricsData.data.probationary.change
        ),
        icon: <FaTasks className="text-lg" />,
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
        iconBgColor: "bg-yellow-600",
        iconTextColor: "text-white",
      },
      {
        title: "Instructor - Student Ratio",
        value: metricsData.data.teacherStudentRatio.current,
        change: getTrendText(
          metricsData.data.teacherStudentRatio.trend,
          metricsData.data.teacherStudentRatio.change
        ),
        icon: <FaRegClock className="text-xl" />,
        bgColor: "bg-cyan-50",
        textColor: "text-cyan-600",
        iconBgColor: "bg-cyan-500",
        iconTextColor: "text-white",
      },
    ];
  }

  if (userType === "student") {
    return [
      {
        title: "Total Students",
        value: metricsData.data.studentCount?.current ?? 0,
        change: getTrendText(
          metricsData.data.studentCount?.trend,
          metricsData.data.studentCount?.change ?? 0
        ),
        icon: <FaUser className="text-xl" />,
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
        iconBgColor: "bg-blue-500",
        iconTextColor: "text-white",
      },
      {
        title: "Active Students",
        value: metricsData.data.activeStudent?.current ?? 0,
        change: getTrendText(
          metricsData.data.activeStudent?.trend,
          metricsData.data.activeStudent?.change ?? 0
        ),
        icon: <LuCircleDashed className="text-xl" />,
        bgColor: "bg-green-50",
        textColor: "text-green-600",
        iconBgColor: "bg-green-500",
        iconTextColor: "text-white",
      },
      {
        title: "Inactive Students",
        value: metricsData.data.inactiveStudent?.current ?? 0,
        change: getTrendText(
          metricsData.data.inactiveStudent?.trend,
          metricsData.data.inactiveStudent?.change ?? 0
        ),
        icon: <FaRegClock className="text-xl" />,
        bgColor: "bg-cyan-50",
        textColor: "text-cyan-600",
        iconBgColor: "bg-cyan-500",
        iconTextColor: "text-white",
      },
 
    ];
  }

  return [];
};