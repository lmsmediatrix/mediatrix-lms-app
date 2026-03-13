import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { TActiveView } from "../../types/interfaces";

interface WholeMonthCalendarProps {
  setCurrentWeekStart?: (date: Date) => void;
  currentWeekStart?: Date;
  monthControl?: boolean;
  mode: "mini" | "large";
  activeView: TActiveView;
  currentMonth?: Date;
  setActiveView?: (activeView: TActiveView) => void;
  monthData?: any;
}

export default function WholeMonthCalendar({
  setCurrentWeekStart,
  currentWeekStart,
  activeView,
  monthControl = true,
  mode,
  currentMonth,
  setActiveView,
  monthData,
}: WholeMonthCalendarProps) {
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());

  // Use currentMonth prop if provided (for month view), otherwise use internal state
  const currentDate = currentMonth || internalCurrentDate;
  const setCurrentDate = currentMonth ? undefined : setInternalCurrentDate;

  // Format the month and year
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc)
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    if (setCurrentDate) {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
      );
    }
  };

  const handleNextMonth = () => {
    if (setCurrentDate) {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
      );
    }
  };

  const dateCellClick = (dateForDay: Date) => {
    if (setActiveView) setActiveView("week");
    setCurrentWeekStart?.(dateForDay);
  };

  // Helper function to check if a date is in the current week view
  const isInCurrentWeekView = (date: Date) => {
    if (!currentWeekStart) return false;

    const weekViewDates = Array.from({ length: 5 }, (_, i) => {
      const weekDate = new Date(currentWeekStart);
      weekDate.setDate(currentWeekStart.getDate() + i);
      return weekDate.toDateString();
    });
    return weekViewDates.includes(date.toDateString());
  };

  // Generate calendar days
  const generateDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="text-center" />);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateForDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );

      // Format date as YYYY-MM-DD with padded zeros
      const dateString = `${dateForDay.getFullYear()}-${String(
        dateForDay.getMonth() + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Check if monthData and events exist before accessing
      const eventsForDay = monthData?.events?.[dateString] ?? [];
      const numberOfEvents = eventsForDay[0]?.numberOfEvents ?? 0;

      const isToday = new Date().toDateString() === dateForDay.toDateString();
      const isInWeekView = isInCurrentWeekView(dateForDay);

      days.push(
        <div
          key={day}
          onClick={() => dateCellClick(dateForDay)}
          className={`text-center relative ${
            mode === "large"
              ? `w-full h-32 border rounded hover:border-2 hover:border-gray-400 cursor-pointer ${
                  isToday
                    ? "border-[#3B5998] border-2"
                    : numberOfEvents > 0
                    ? "border-red-500 border-2"
                    : "border-gray-200"
                } p-2`
              : `py-2 rounded-full ${
                  setCurrentWeekStart ? "cursor-pointer hover:bg-[#c9d0df]" : ""
                } ${isToday ? "bg-[#3B5998] text-white" : ""} ${
                  !isToday && isInWeekView && activeView === "week"
                    ? "bg-[#ecf1fb]"
                    : ""
                } ${!isToday && !isInWeekView ? "text-gray-600" : ""}`
          }`}
        >
          <span>{day}</span>
          {numberOfEvents > 0 && (
            <div className="absolute bottom-1 left-0 right-0 text-sm text-red-500">
              {numberOfEvents} events
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="mb-6">
      {monthControl && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-800 text-lg font-semibold">
            {formatMonth(currentDate)}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all rounded"
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all rounded"
            >
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Calendar Header */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className={`text-center ${
              mode === "large"
                ? "w-12 h-12 text-xl font-semibold rounded-full mx-auto mb-2 flex items-center justify-center mt-2"
                : "text-gray-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Mini Calendar Days */}
      <div className="grid grid-cols-7 gap-1">{generateDays()}</div>
    </div>
  );
}
