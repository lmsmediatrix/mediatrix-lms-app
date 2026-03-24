import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useSectionByCode } from "../../hooks/useSection";
import { FaCalendarDays } from "react-icons/fa6";
import { TActiveTab } from "../../types/interfaces";
import { IoPerson } from "react-icons/io5";
import { SiTarget } from "react-icons/si";
import { getTerm } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import SectionPageSkeleton from "../../components/skeleton/SectionPageSkeleton";
import StudentAttendance from "./AttendanceTab";
import InstructorModal from "../../components/instructor/InstructorModal";
import AnnouncementTab from "../student/AnnouncementTab";
import AssessmentTab from "../student/AssessmentTab";
import AnalyticsTab from "./AnalyticsTab";
import GradesPage from "./GradesTab";
import ModuleTab from "../student/ModuleTab";
import Button from "../../components/common/Button";
import StudentsTab from "./StudentsTab";
import ScheduleModal from "../../components/common/ScheduleModal";
import CompletionTracker from "../../components/common/CompletionTracker";
import { useGetPerformanceDashboard } from "../../hooks/useMetrics";

export default function InstructorSectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const instructorId = searchParams.get("instructor");
  const sectionCode = location.pathname.split("/").pop() as string;
  const activeTab = (searchParams.get("tab") || "modules") as TActiveTab;
  const orgType = currentUser.user.organization.type;
  const orgCode = currentUser.user.organization.code;

  const sectionTerm = getTerm("group", orgType);
  const learnerTerm = getTerm("learner", orgType);

  const tabs = [
    { name: "Modules", value: "modules" },
    { name: "Announcements", value: "announcements" },
    { name: "Assessments", value: "assessments" },
    { name: "Attendance", value: "attendance" },
    { name: "Grades", value: "grades" },
    { name: "Analytics", value: "analytics" },
    { name: learnerTerm, value: "students" },
  ];

  const [currentMobileTabIndex, setCurrentMobileTabIndex] = useState(0);
  const { data, isPending } = useSectionByCode({
    sectionCode,
  });
  const sectionData = data?.sections?.[0];
  const { data: sectionPerformance } = useGetPerformanceDashboard(sectionCode);

  const performanceStudents = sectionPerformance?.students || [];
  const totalPerformanceStudents = performanceStudents.length;
  const completedModulesStudents = performanceStudents.filter((student: any) => {
    const progress = student.progress;
    if (!progress) return false;
    const completedModules = progress.completedModules ?? 0;
    if (completedModules > 0) return true;
    return progress.completedLessons > 0;
  }).length;
  const completedAssessmentsStudents = performanceStudents.filter((student: any) => {
    const progress = student.progress;
    return progress && progress.completedAssessments > 0;
  }).length;

  const completionItems =
    activeTab === "modules"
      ? [
          {
            label: "Students Completed Modules",
            value: completedModulesStudents,
            total: totalPerformanceStudents,
            onClick: () =>
              navigate(
                `/${orgCode}/instructor/completion?type=modules&sectionCode=${sectionCode}`
              ),
          },
        ]
      : activeTab === "assessments"
        ? [
            {
              label: "Students Completed Assessments",
              value: completedAssessmentsStudents,
              total: totalPerformanceStudents,
              onClick: () =>
                navigate(
                  `/${orgCode}/instructor/completion?type=assessments&sectionCode=${sectionCode}`
                ),
            },
          ]
        : [];

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

  const renderTabContent = () => {
    if (!isPending) {
      switch (activeTab) {
        case "modules":
          return <ModuleTab sectionCode={sectionCode} />;
        case "announcements":
          return <AnnouncementTab sectionCode={sectionCode} />;
        case "assessments":
          return <AssessmentTab sectionCode={sectionCode} />;
        case "attendance":
          return <StudentAttendance sectionSchedule={sectionData.schedule} />;
        case "grades":
          return <GradesPage />;
        case "analytics":
          return <AnalyticsTab />;
        case "students":
          return <StudentsTab sectionCode={sectionCode} />;
        default:
          return <ModuleTab sectionCode={sectionCode} />;
      }
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
            <Button
              onClick={() => navigate("manage")}
              variant="primary"
              className="px-2 md:px-6 py-2 rounded-lg"
            >
              Manage <span className="hidden md:block">{sectionTerm}</span>
            </Button>
          </div>

          <div className="bg-white border rounded-lg shadow-sm mb-6">
            <div className="w-full h-[200px] relative rounded-t-md overflow-hidden">
              {sectionData.course.thumbnail ? (
                <img
                  src={sectionData.course.thumbnail}
                  alt="Course thumbnail"
                  className="w-full h-full object-cover rounded-t-md"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-t-md"></div>
              )}
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
                  <div className="group flex items-center gap-3">
                    <div
                      className="w-8 flex justify-center cursor-pointer"
                      onClick={() =>
                        setSearchParams({
                          instructor: sectionData.instructor._id,
                        })
                      }
                    >
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
                    <p
                      className="text-left font-medium group-hover:underline cursor-pointer"
                      onClick={() =>
                        setSearchParams({
                          instructor: sectionData.instructor._id,
                        })
                      }
                    >
                      {sectionData.instructor.firstName}{" "}
                      {sectionData.instructor.lastName}
                    </p>
                  </div>
                  {orgType === "school" && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex justify-center">
                        <SiTarget className="text-primary text-lg" />
                      </div>
                      <p className="text-left font-medium text-gray-600">
                        {sectionData.instructor.faculty?.name}
                      </p>
                    </div>
                  )}
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => setIsScheduleModalOpen(true)}
                  >
                    <div className="w-8 flex justify-center">
                      <FaCalendarDays className="text-primary text-lg" />
                    </div>
                    <p className="font-medium text-gray-600">
                      View {sectionTerm} Schedule
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 px-4 ">
              {/* Desktop View: Show all tabs */}
              <div className="hidden lg:flex text-sm font-medium gap-2 mx-auto">
                {tabs.map(({ name, value }) => (
                  <button
                    key={value}
                    onClick={() => handleTabClick(value)}
                    className={`py-4 px-8 relative ${
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
              <div className="flex lg:hidden items-center justify-between w-full text-sm font-medium">
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
            </div>
          </div>
        </>
      )}

      {!isPending && (
        <div className="bg-white p-2 md:p-4 border rounded-lg min-h-[500px]">
          {completionItems.length > 0 && (
            <div className="mb-4">
              <CompletionTracker title="Completion Tracker" items={completionItems} />
            </div>
          )}
          {renderTabContent()}
        </div>
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
