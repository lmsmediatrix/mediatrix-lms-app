import { useLocation, useSearchParams } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoPerson } from "react-icons/io5";
import { SiTarget } from "react-icons/si";
import { FaCalendarDays } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useSectionByCode } from "../../hooks/useSection";
import { useAuth } from "../../context/AuthContext";
import { convert24to12Format } from "../../lib/dateUtils";
import { TActiveTab } from "../../types/interfaces";
import Button from "../../components/common/Button";
import SectionPageSkeleton from "../../components/skeleton/SectionPageSkeleton";
import ModuleTab from "./ModuleTab";
import AnnouncementTab from "./AnnouncementTab";
import AssessmentTab from "./AssessmentTab";
import GradeTab from "./GradeTab";
import { useSubmitAttendance } from "../../hooks/useStudent";
import ScheduleModal from "../../components/common/ScheduleModal";
import InstructorModal from "../../components/instructor/InstructorModal";

export default function StudentSectionPage() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionCode = location.pathname.split("/").pop() as string;
  const activeTab = (searchParams.get("tab") || "modules") as TActiveTab;
  const orgType = currentUser.user.organization.type;
  const submitAttendance = useSubmitAttendance();
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const instructorId = searchParams.get("instructor");

  const tabs = [
    { name: "Modules", value: "modules" },
    { name: "Assessments", value: "assessments" },
    { name: "Grades", value: "grades" },
    { name: "Announcements", value: "announcements" },
  ];

  const [currentMobileTabIndex, setCurrentMobileTabIndex] = useState(0);
  const { data, isPending } = useSectionByCode({ sectionCode });
  const sectionData = data?.sections?.[0];

  // Sync currentMobileTabIndex with activeTab from URL on mount
  useEffect(() => {
    const tabIndex = tabs.findIndex((tab) => tab.value === activeTab);
    if (tabIndex !== -1) {
      setCurrentMobileTabIndex(tabIndex);
    }
  }, [activeTab]);

  const handleTabClick = (tabValue: string) => {
    setSearchParams({ tab: tabValue });
  };

  const handlePreviousTab = () => {
    setCurrentMobileTabIndex((prevIndex) =>
      prevIndex === 0 ? tabs.length - 1 : prevIndex - 1
    );
    setSearchParams({
      tab: tabs[
        currentMobileTabIndex === 0
          ? tabs.length - 1
          : currentMobileTabIndex - 1
      ].value,
    });
  };

  const handleNextTab = () => {
    setCurrentMobileTabIndex((prevIndex) =>
      prevIndex === tabs.length - 1 ? 0 : prevIndex + 1
    );
    setSearchParams({
      tab: tabs[
        currentMobileTabIndex === tabs.length - 1
          ? 0
          : currentMobileTabIndex + 1
      ].value,
    });
  };

  const isClassDay = () => {
    if (!sectionData?.schedule?.breakdown) return false;
    const today = new Date()
      .toLocaleString("en-us", { weekday: "short" })
      .toLowerCase();
    const scheduledDays = sectionData.schedule.breakdown.map(
      (schedule: any) => schedule.day.toLowerCase()
    );
    return scheduledDays.includes(today);
  };

  const onSubmitAttendance = async () => {
    if (!sectionData?._id) return;
    submitAttendance.mutate(sectionData._id, {
      onSuccess: () => {
        toast.success("Attendance Submitted Successfully");
        setIsAttendanceMarked(true);
      },
      onError: (error) => {
        if (
          error.message ===
          "You have already marked attendance for this section today"
        ) {
          setIsAttendanceMarked(true);
        }
        toast.error(error.message);
      },
    });
  };

  const renderTabContent = () => {
    if (isPending || !sectionData) return null;
    switch (activeTab) {
      case "modules":
        return (
          <ModuleTab
            sectionCode={sectionCode}
            sectionId={sectionData?._id}
            sectionName={sectionData?.name}
          />
        );
      case "announcements":
        return <AnnouncementTab sectionCode={sectionCode} />;
      case "assessments":
        return <AssessmentTab sectionCode={sectionCode} />;
      case "grades":
        return <GradeTab sectionCode={sectionCode} />;
      default:
        return (
          <ModuleTab
            sectionCode={sectionCode}
            sectionId={sectionData?._id}
            sectionName={sectionData?.name}
          />
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 md:py-10 px-4">
      {isPending || !sectionData ? (
        <SectionPageSkeleton />
      ) : (
        <>
          <div className="flex justify-between gap-2 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold">
              {sectionData.name}
            </h1>
          </div>

          <div className="bg-white border rounded-lg shadow-sm mb-2 md:mb-6">
            <div className="w-full h-[200px] relative rounded-t-md overflow-hidden">
              <img
                src={sectionData.course.thumbnail}
                alt="Course thumbnail"
                className="w-full h-full object-cover rounded-t-md"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/10" />
            </div>

            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl md:text-2xl font-semibold pb-4">
                    {sectionData.course.title}
                  </h2>
                  <p className="text-gray-700 bg-gray-100 p-2 rounded-md flex-1">
                    {sectionData.course.description}
                  </p>
                </div>
                <div className="md:w-1/5 flex flex-col gap-4">
                  <div
                    className="group flex items-center gap-3 cursor-pointer group"
                    onClick={() =>
                      setSearchParams({
                        instructor: sectionData.instructor._id,
                      })
                    }
                  >
                    <div className="w-8 flex justify-center">
                      {sectionData.instructor.avatar ? (
                        <img
                          src={sectionData.instructor.avatar}
                          alt="Instructor Avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <IoPerson className="text-primary text-lg" />
                      )}
                    </div>
                    <p className="text-left font-medium group-hover:underline">
                      {sectionData.instructor.firstName}{" "}
                      {sectionData.instructor.lastName}
                    </p>
                  </div>
                  {orgType === "school" && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex justify-center">
                        <SiTarget className="text-primary text-lg" />
                      </div>
                      <p className="text-left">
                        {sectionData.instructor.faculty?.name}
                      </p>
                    </div>
                  )}
                  <div
                    className="flex items-start gap-3 cursor-pointer rounded-md transition-colors"
                    onClick={() => setIsScheduleModalOpen(true)}
                  >
                    <div className="w-8 flex justify-center">
                      <FaCalendarDays className="text-primary text-lg" />
                    </div>
                    <div className="text-gray-600 text-left">
                      {sectionData.schedule.breakdown &&
                      sectionData.schedule.breakdown.length > 0 ? (
                        (() => {
                          // Get the current day in lowercase to match the schedule format (e.g., "mon")
                          const currentDay = new Date()
                            .toLocaleString("en-US", { weekday: "short" })
                            .toLowerCase();
                          // Find the schedule for the current day
                          const todaySchedule =
                            sectionData.schedule.breakdown.find(
                              (schedule: any) =>
                                schedule.day.toLowerCase() === currentDay
                            );

                          return todaySchedule ? (
                            <div className="flex items-center gap-1">
                              <span>
                                {convert24to12Format(todaySchedule.time.start)}{" "}
                                - {convert24to12Format(todaySchedule.time.end)}
                              </span>
                            </div>
                          ) : (
                            <p>No schedule for today</p>
                          );
                        })()
                      ) : (
                        <p>No schedule available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 px-4 md:px-10 lg:px-16">
              {/* Desktop View: Show all tabs and attendance button */}
              <div className="hidden md:flex text-sm font-medium gap-2">
                {tabs.map(({ name, value }) => (
                  <button
                    key={value}
                    onClick={() => handleTabClick(value)}
                    className={`py-4 md:px-4 lg:px-8 relative ${
                      value === activeTab
                        ? "text-primary border-b-4 border-primary"
                        : "border-b-4 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Mobile View: Show one tab with Previous/Next buttons */}
              <div className="flex md:hidden items-center justify-between w-full text-sm font-medium">
                <button
                  onClick={handlePreviousTab}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full border-2 border-gray-500 active:bg-gray-500"
                >
                  <FaChevronLeft />
                </button>

                <button
                  onClick={() =>
                    handleTabClick(tabs[currentMobileTabIndex].value)
                  }
                  className={`py-4 px-8 relative ${
                    tabs[currentMobileTabIndex].value === activeTab
                      ? "text-[#3E5B93] border-b-4 border-[#3E5B93]"
                      : "border-b-4 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
                  }`}
                >
                  {tabs[currentMobileTabIndex].name}
                </button>

                <button
                  onClick={handleNextTab}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full border-2 border-gray-500 active:bg-gray-500"
                >
                  <FaChevronRight />
                </button>
              </div>

              <div className="hidden md:block">
                <Button
                  onClick={
                    isClassDay() ? () => onSubmitAttendance() : undefined
                  }
                  variant="primary"
                  className="px-8 py-2 rounded-lg transition-colors"
                  disabled={
                    submitAttendance.isPending ||
                    !isClassDay() ||
                    isAttendanceMarked
                  }
                  isLoadingText="Submitting..."
                  isLoading={submitAttendance.isPending}
                >
                  Mark Attendance
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile view attendance button */}
          <div className="flex justify-end md:hidden mb-2">
            <Button
              onClick={isClassDay() ? () => onSubmitAttendance() : undefined}
              variant="primary"
              className="px-8 py-2 rounded-lg transition-colors"
              disabled={
                submitAttendance.isPending ||
                !isClassDay() ||
                isAttendanceMarked
              }
              isLoadingText="Submitting..."
              isLoading={submitAttendance.isPending}
            >
              Mark Attendance
            </Button>
          </div>

          {!isPending && (
            <div className="bg-white p-2 md:p-4 border rounded-lg min-h-[500px]">
              {renderTabContent()}
            </div>
          )}
        </>
      )}
      {instructorId && <InstructorModal />}
      {isScheduleModalOpen && (
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          schedule={sectionData?.schedule}
        />
      )}
    </div>
  );
}
