import { TActiveView } from "../../types/interfaces";
import CalendarEvent from "./CalendarEvent";
import WholeMonthCalendar from "./WholeMonthCalendar";

interface Event {
  id: number;
  title?: string;
  startTime?: string;
  endTime?: string;
  participants?: {
    id: number;
    name: string;
    avatar: string;
  }[];
  numberOfEvents?: number;
}

interface EventsData {
  events: {
    [key: string]: Event[];
  };
}

interface MainCalendarProps {
  data?: EventsData;
  setCurrentWeekStart?: (date: Date) => void;
  currentWeekStart: Date;
  activeView: string;
  currentMonth: Date;
  setActiveView: (activeView: TActiveView) => void;
}

export default function MainCalendar({
  data,
  setCurrentWeekStart,
  currentWeekStart,
  activeView,
  currentMonth,
  setActiveView,
}: MainCalendarProps) {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const weekDates = Array.from(
    { length: activeView === "day" ? 1 : 5 },
    (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      return date;
    }
  );

  const currentDate = new Date();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Get Sunday

  // Helper function to get hours from time string
  const getHour = (timeStr: string) => parseInt(timeStr.split(":")[0]);

  // Find earliest and latest hours from events
  const findTimeRange = () => {
    let earliest = 23;
    let latest = 0;

    Object.values(data?.events || {}).forEach((dayEvents) => {
      dayEvents.forEach((event) => {
        if (event.startTime && event.endTime) {
          const startHour = getHour(event.startTime);
          const endHour = getHour(event.endTime);
          earliest = Math.min(earliest, startHour);
          latest = Math.max(latest, endHour);
        }
      });
    });

    return {
      start: earliest === 23 ? 8 : earliest,
      end: latest === 0 ? 17 : latest,
    };
  };

  const { start, end } = findTimeRange();
  const timeSlots = Array.from({ length: end - start + 1 }, (_, i) => {
    const hour = i + start;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  // Helper function to calculate event position and height
  const calculateEventPosition = (startTime: string) => {
    const [hours] = startTime.split(":").map(Number);
    const top = (hours - 8) * 160;
    return top;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return data?.events[dateStr] || [];
  };

  return (
    <div className="rounded-lg bg-white border">
      {activeView === "month" ? (
        <WholeMonthCalendar
          setCurrentWeekStart={setCurrentWeekStart}
          activeView={activeView}
          monthControl={false}
          mode={"large"}
          currentMonth={currentMonth}
          setActiveView={setActiveView}
          monthData={activeView === "month" && data}
        />
      ) : (
        <>
          {/* Calendar Header */}
          <div
            className={`grid ${
              activeView === "day"
                ? "grid-cols-[60px_1fr]"
                : "grid-cols-[60px_repeat(5,1fr)]"
            }`}
          >
            <div className="p-4"></div>
            {weekDates.map((date, index) => (
              <div key={index} className="p-4 text-center">
                <div
                  className={`w-12 h-12 text-xl font-semibold rounded-full mx-auto mb-2 flex items-center justify-center ${
                    date.toDateString() === currentDate.toDateString()
                      ? "bg-primary text-white"
                      : "bg-[#F0FBFE]"
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="text-gray-600">{daysOfWeek[date.getDay()]}</div>
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div
            className={`relative grid ${
              activeView === "day"
                ? "grid-cols-[60px_1fr]"
                : "grid-cols-[60px_repeat(5,1fr)]"
            } min-h-[780px] h-full overflow-y-auto p-4`}
          >
            {/* Time markers */}
            <div className="relative">
              {timeSlots.map((time, index) => (
                <div
                  key={index}
                  className="absolute w-full text-sm text-gray-400 text-center"
                  style={{ top: `${index * 160}px` }}
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Event columns */}
            {weekDates.map((date, index) => (
              <div
                key={index}
                className="relative border-r border-gray-100 last:border-r-0 h-full"
                style={{ minHeight: `${timeSlots.length * 160}px` }}
              >
                {/* Hour grid lines */}
                {timeSlots.map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-full"
                    style={{ top: `${i * 160}px` }}
                  />
                ))}

                {/* Events */}
                {getEventsForDate(date).map((event, eventIndex) => {
                  // Skip events without start or end times
                  if (!event.startTime || !event.endTime) return null;

                  const topPosition = calculateEventPosition(event.startTime);
                  const [startHour] = event.startTime.split(":").map(Number);
                  const [endHour] = event.endTime.split(":").map(Number);
                  const height = (endHour - startHour) * 160;

                  return (
                    <CalendarEvent
                      key={eventIndex}
                      title={event.title || ""}
                      startTime={event.startTime}
                      endTime={event.endTime}
                      location="Room 01"
                      participants={event.participants || []}
                      style={{
                        top: `${topPosition}px`,
                        height: `${height}px`,
                        left: "12px",
                        right: "12px",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
