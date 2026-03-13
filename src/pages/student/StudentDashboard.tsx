import { FaAngleRight, FaBookOpen, FaCalendarAlt } from "react-icons/fa";
import Button from "../../components/common/Button";
import DashboardHeader from "../../components/common/DashboardHeader";
import StatCard from "../../components/common/StatCard";
import Summary from "../../components/common/Summary";
import SidePanel from "../../components/common/SidePanel";
import DashboardSkeleton from "../../components/skeleton/DashboardSkeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import IsPasswordChangedModal from "../../components/common/IsPasswordChangedModal";
import Schedule from "../../components/instructor/Schedule";
import { useStudentSections } from "../../hooks/useSection";
import { useGetStudentMetrics } from "../../hooks/useMetrics";
import { useStudentCompletedAssessments } from "../../hooks/useStudentAssessmentGrade";
import OverallProgress from "../../components/student/OverallProgress";
import RecentGrades from "../../components/student/RecentGrades";
import AttendanceSummary from "../../components/student/AttendanceSummary";
import StudyStreak from "../../components/student/StudyStreak";
import PerformanceChart from "../../components/student/PerformanceChart";
import CompletionTracker from "../../components/common/CompletionTracker";

interface Section {
  _id: string;
  code: string;
  name: string;
  course: {
    _id: string;
    thumbnail: string;
  };
  instructor: {
    firstName: string;
    lastName: string;
  };
  modules?: Array<{
    _id: string;
    lessons: Array<{
      _id: string;
      status?: string;
      progress?: Array<{
        userId: string;
        status: string;
      }>;
    }>;
  }>;
  assessments?: Array<{ _id: string }>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentDashboard() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;

  const { data: dashboardMetrics, isPending: isMetricsPending } =
    useGetStudentMetrics(
      currentUser.user.id,
      currentUser.user.organization._id,
    );

  const { data: studentSections } = useStudentSections({
    studentId: currentUser.user.id,
    limit: 3,
  });

  const { data: completedAssessmentIds } = useStudentCompletedAssessments(
    currentUser.user.id,
  );

  const computeSectionProgress = (section: Section) => {
    const userId = currentUser.user.id;
    let totalLessons = 0;
    let completedLessons = 0;
    (section.modules || []).forEach((mod) => {
      (mod.lessons || []).forEach((lesson) => {
        totalLessons++;
        if (
          (lesson.progress || []).some(
            (p) => p.userId?.toString() === userId && p.status === "completed",
          )
        ) {
          completedLessons++;
        }
      });
    });
    const totalAssessments = (section.assessments || []).length;
    const completedAssessments = completedAssessmentIds
      ? (section.assessments || []).filter((a) =>
          completedAssessmentIds.has(a._id?.toString()),
        ).length
      : 0;
    const totalItems = totalLessons + totalAssessments;
    const completedItems = completedLessons + completedAssessments;
    const percent =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return {
      percent,
      completedLessons,
      totalLessons,
      completedAssessments,
      totalAssessments,
    };
  };

  // Destructure the first element of dashboardMetrics since it's an array
  const {
    assignmentData,
    continueWorking,
    upComingClassSchedule,
    announcements,
    overallProgress,
    recentGrades,
    expandedStats,
    upcomingDeadlines,
    attendanceSummary,
    studyStreak,
    performanceData,
  } = dashboardMetrics?.[0] || {};
  const averageGrade =
    expandedStats?.[0]?.averageGrade ?? expandedStats?.[0]?.avgGrade;

  const completionTotals = (studentSections?.sections || []).reduce(
    (acc, section) => {
      acc.totalSections += 1;

      (section.modules || []).forEach((mod) => {
        const lessons = (mod.lessons || []).filter((lesson) =>
          lesson.status ? lesson.status === "published" : true,
        );
        if (lessons.length === 0) return;
        acc.totalModules += 1;

        let moduleCompletedLessons = 0;
        lessons.forEach((lesson) => {
          const isCompleted = (lesson.progress || []).some(
            (p) =>
              p.userId?.toString() === currentUser.user.id &&
              p.status === "completed",
          );
          if (isCompleted) moduleCompletedLessons += 1;
        });

        acc.totalLessons += lessons.length;
        acc.completedLessons += moduleCompletedLessons;
        if (moduleCompletedLessons === lessons.length) {
          acc.completedModules += 1;
        }
      });

      const sectionProgress = computeSectionProgress(section);
      if (
        sectionProgress.percent === 100 &&
        sectionProgress.totalLessons + sectionProgress.totalAssessments > 0
      ) {
        acc.completedSections += 1;
      }

      return acc;
    },
    {
      totalLessons: 0,
      completedLessons: 0,
      totalModules: 0,
      completedModules: 0,
      totalSections: 0,
      completedSections: 0,
    },
  );

  if (isMetricsPending) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="bg-gray-50 min-h-screen overflow-x-hidden">
      <DashboardHeader
        subTitle={
          <div className="flex flex-col">
            {/* <h2 className="md:text-lg text-white md:font-medium">
              Program BSIT
            </h2> */}
          </div>
        }
        statCard={
          <div className="flex md:flex gap-2 md:gap-4 md:mt-6">
            <StatCard
              label="Total Assignments"
              value={assignmentData?.[0]?.total || 0}
              icon="courses"
              loading={isMetricsPending}
              size="sm"
            />
            <StatCard
              label="Critical Assignments"
              value={assignmentData?.[0]?.critical || 0}
              icon="critical"
              loading={isMetricsPending}
              size="sm"
            />
          </div>
        }
      />

      {/* Main Layout */}
      <div className="lg:grid lg:grid-cols-[1fr_300px] max-w-[1400px] mx-auto w-full p-4 lg:p-0">
        {/* Main Panel */}
        <div>
          {/* Continue Working + Today's Schedule (side-by-side) */}
          {continueWorking?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-4 lg:py-8 lg:mr-4 items-stretch">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                    <FaBookOpen className="text-blue-600 text-sm" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                    Continue Working
                  </h3>
                </div>
                <div className="flex-1 min-h-0">
                  <Summary summaryData={continueWorking} />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                      <FaCalendarAlt className="text-blue-600 text-sm" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                      Today&apos;s Schedule
                    </h3>
                  </div>
                  <Button
                    onClick={() =>
                      navigate(
                        `/${currentUser.user.organization.code}/student/calendar`,
                      )
                    }
                    variant="link"
                    className="flex items-center gap-2"
                  >
                    View More
                    <FaAngleRight />
                  </Button>
                </div>
                <Schedule
                  variant="embedded"
                  showHeader={false}
                  className="flex-1 min-h-0"
                />
              </div>
            </div>
          ) : (
            <div className="py-4 lg:py-8 lg:mr-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                      <FaCalendarAlt className="text-blue-600 text-sm" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                      Today&apos;s Schedule
                    </h3>
                  </div>
                  <Button
                    onClick={() =>
                      navigate(
                        `/${currentUser.user.organization.code}/student/calendar`,
                      )
                    }
                    variant="link"
                    className="flex items-center gap-2"
                  >
                    View More
                    <FaAngleRight />
                  </Button>
                </div>
                <Schedule variant="embedded" showHeader={false} />
              </div>
            </div>
          )}

          {/* Insights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 lg:py-8 lg:mr-4 items-stretch">
            <OverallProgress
              data={overallProgress?.[0]}
              loading={isMetricsPending}
            />
            <StudyStreak data={studyStreak?.[0]} loading={isMetricsPending} />
            <AttendanceSummary
              data={attendanceSummary?.[0]}
              loading={isMetricsPending}
            />
          </div>


          <div className="py-2 lg:py-4 lg:mr-4">
            <CompletionTracker
              title="Completion Tracker"
              items={[
                {
                  label: "Lessons Completed",
                  value: completionTotals.completedLessons,
                  total: completionTotals.totalLessons,
                },
                {
                  label: "Modules Completed",
                  value: completionTotals.completedModules,
                  total: completionTotals.totalModules,
                },
                {
                  label: "Sections Completed",
                  value: completionTotals.completedSections,
                  total: completionTotals.totalSections,
                },
              ]}
            />
          </div>
          {/* Performance · Grades · Activity — 3-column row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:mr-4 mb-4">
            <PerformanceChart
              data={performanceData}
              loading={isMetricsPending}
            />
            <RecentGrades data={recentGrades} loading={isMetricsPending} />
          </div>

          {/* Side Panel in Mobile View */}
          <div className="lg:hidden pt-4 ">
            <SidePanel
              comingUpData={upComingClassSchedule}
              announcements={announcements}
              upcomingDeadlines={upcomingDeadlines}
            />
          </div>

        </div>

        {/* Side Panel in Desktop View */}
        <div className="hidden lg:block min-h-screen bg-white p-4 w-[380px]">
          <SidePanel
            comingUpData={upComingClassSchedule}
            announcements={announcements}
            upcomingDeadlines={upcomingDeadlines}
          />
        </div>
      </div>

      {isChangePasswordOpen && (
        <IsPasswordChangedModal
          onClose={() => setIsChangePasswordOpen(false)}
        />
      )}
    </div>
  );
}



