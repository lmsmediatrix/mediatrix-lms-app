import { useState, useMemo } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useGetSectionAttendance } from "../../hooks/useInstructor";
import { useLocation } from "react-router-dom";
import { TableSkeleton } from "../../components/skeleton/TableSkeleton";
import { ISchedule, TAttendanceStatus } from "../../types/interfaces";
import { useUpdateAttendance } from "../../hooks/useSection";
import { toast } from "react-toastify";
import AttendanceDropdown from "../../components/instructor/AttendanceDropdown";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";

interface AttendanceEntry {
  label: TAttendanceStatus;
  day: number;
  weekday: string;
}

interface Student {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar: string;
  attendance: AttendanceEntry[];
}

export default function AttendanceTab({
  sectionSchedule,
}: {
  sectionSchedule: ISchedule;
}) {
  const location = useLocation();
  const sectionCode = location.pathname.split("/")[4];
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);
  const learnersTerm = getTerm("learner", orgType, true);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(today.getDate()).padStart(2, "0")}`;
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const updateAttendance = useUpdateAttendance();

  const getFromDate = () => {
    const toDate = new Date(selectedDate);
    const fromDate = new Date(toDate);
    fromDate.setDate(toDate.getDate() - 6);
    return `${fromDate.getFullYear()}-${String(
      fromDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(fromDate.getDate()).padStart(2, "0")}`;
  };

  const { data: attendanceData, isPending: isAttendancePending } =
    useGetSectionAttendance(sectionCode, {
      from: getFromDate(),
      to: selectedDate,
    });

  const weekFullDates = useMemo(() => {
    const endDate = new Date(selectedDate);
    const week: { date: string; day: number; weekday: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - i);
      week.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(d.getDate()).padStart(2, "0")}`,
        day: d.getDate(),
        weekday: d.toLocaleString("en-US", { weekday: "short" }),
      });
    }
    return week;
  }, [selectedDate]);

  // Handle attendance status update
  const handleAttendanceUpdate = async (
    studentId: string,
    dateIndex: number,
    status: TAttendanceStatus,
  ) => {
    const selectedAttendanceDate = weekFullDates[dateIndex].date;
    const body = {
      sectionCode: sectionCode,
      userId: studentId,
      status: status,
      date: selectedAttendanceDate,
    };
    toast.promise(
      updateAttendance.mutateAsync(body, {
        onSuccess: () => {
          // Optionally handle success
        },
        onError: (error) => {
          console.error("Attendance update error:", error);
        },
      }),
      {
        pending: "Updating attendance...",
        success: "Attendance updated successfully",
        error: "Failed to update attendance",
      },
    );
  };

  // Parse startDate from sectionSchedule
  const scheduleStartDate = new Date(sectionSchedule.startDate);

  // Check if navigating to the previous week is allowed
  const isPreviousDisabled = () => {
    const newFromDate = new Date(selectedDate);
    newFromDate.setDate(newFromDate.getDate() - 7);
    return newFromDate < scheduleStartDate;
  };

  const handlePreviousDay = () => {
    if (isPreviousDisabled()) return;
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 7);
    setSelectedDate(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(current.getDate()).padStart(2, "0")}`,
    );
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 7);
    setSelectedDate(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(current.getDate()).padStart(2, "0")}`,
    );
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLastDate = new Date(e.target.value);
    if (newLastDate >= scheduleStartDate) {
      setSelectedDate(
        `${newLastDate.getFullYear()}-${String(
          newLastDate.getMonth() + 1,
        ).padStart(2, "0")}-${String(newLastDate.getDate()).padStart(2, "0")}`,
      );
    }
    setShowCalendar(false);
  };

  const getDateRangeDisplay = () => {
    const endDate = new Date(selectedDate);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    return `${startDate.getDate()} ${startDate.toLocaleString("en-US", {
      month: "short",
    })} - ${endDate.getDate()} ${endDate.toLocaleString("en-US", {
      month: "short",
    })}, ${endDate.getFullYear()}`;
  };

  const getInitialsFromName = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="md:p-4 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm md:text-base">
            Total {learnersTerm} Enrolled:
          </span>
          <span className="font-medium text-sm md:text-base">
            {attendanceData?.totalEnrolled || 0}
          </span>
        </div>
        <div className="flex items-center gap-2 relative justify-center">
          <button
            className={`p-2 rounded ${
              isPreviousDisabled()
                ? "cursor-not-allowed text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            onClick={handlePreviousDay}
            disabled={isPreviousDisabled()}
          >
            <IoChevronBack className="w-5 h-5" />
          </button>
          <button
            className="text-gray-900 border font-medium px-3 py-1 text-sm md:text-base md:px-4 md:py-1 hover:bg-gray-300 rounded z-10"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            {getDateRangeDisplay()}
          </button>
          {showCalendar && (
            <input
              type="date"
              className="absolute top-10 left-1/2 transform -translate-x-1/2 z-10 p-2 border rounded shadow"
              value={selectedDate}
              onChange={handleDateChange}
              onBlur={() => setShowCalendar(false)}
              min={sectionSchedule.startDate.split("T")[0]}
              autoFocus
            />
          )}
          <button
            className="p-2 hover:bg-gray-100 rounded"
            onClick={handleNextDay}
          >
            <IoChevronForward className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        {isAttendancePending ? (
          <TableSkeleton />
        ) : attendanceData?.data?.data?.length > 0 ? (
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs md:text-sm text-gray-500 font-medium bg-[#F9FAFB] sticky left-0">
                  {learnerTerm} Name
                </th>
                {weekFullDates.map((date) => (
                  <th
                    key={date.date}
                    className="px-4 py-3 md:px-6 md:py-4 text-center text-xs md:text-sm text-gray-500 font-medium bg-[#F9FAFB]"
                  >
                    {date.weekday}
                    <br />
                    {date.day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceData?.data?.data.map((student: Student) => (
                <tr
                  key={student._id}
                  className="border-b border-gray-200 last:border-b-0"
                >
                  <td className="px-4 py-3 md:px-6 md:py-4 sticky left-0 z-10 bg-white border-r">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 hidden md:block">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium text-sm">
                            {student.firstName && student.lastName
                              ? `${student.firstName[0]}${student.lastName[0]}`
                              : getInitialsFromName(student.name)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs md:text-sm font-medium text-gray-900">
                        {student.name}
                      </span>
                    </div>
                  </td>
                  {student.attendance.map(
                    (entry: AttendanceEntry, index: number) =>
                      entry.label === "class not started yet" ? (
                        <td
                          key={index}
                          className="px-4 py-3 md:px-6 md:py-4 text-center text-gray-300"
                        >
                          -
                        </td>
                      ) : (
                        <AttendanceDropdown
                          key={index}
                          studentId={student._id}
                          currentStatus={entry.label}
                          index={index}
                          handleAttendanceUpdate={handleAttendanceUpdate}
                        />
                      ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            No attendance data available
          </div>
        )}
      </div>
    </div>
  );
}
