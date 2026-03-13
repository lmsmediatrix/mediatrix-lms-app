import { FaAngleRight, FaCalendarAlt, FaChartLine } from "react-icons/fa";
import Button from "../../components/common/Button";
import DashboardHeader from "../../components/common/DashboardHeader";
import StatCard from "../../components/common/StatCard";
import SidePanel from "../../components/common/SidePanel";
import DashboardSkeleton from "../../components/skeleton/DashboardSkeleton";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import IsPasswordChangedModal from "../../components/common/IsPasswordChangedModal";
import { useState } from "react";
import { useInstructorSections } from "../../hooks/useSection";
import {
  useGetInstructorMetrics,
  useGetPerformanceDashboard,
} from "../../hooks/useMetrics";
import { getTerm } from "../../lib/utils";

import Schedule from "../../components/instructor/Schedule";
import AttendanceChart from "../../components/instructor/AttendanceChart";
import CompletionTracker from "../../components/common/CompletionTracker";

export default function InstructorDashboard() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const orgCode = currentUser.user.organization.code;
  const navigate = useNavigate();

  // Define dynamic terms
  const learnersTerm = getTerm("learner", orgType, true); // "Students" or "Employees"
  const sectionsTerm = getTerm("group", orgType, true); // "Sections" or "Departments"

  const { data: dashboardData, isPending: isDashboardPending } =
    useGetInstructorMetrics(
      currentUser.user.id,
      currentUser.user.organization._id
    );

  const { data: instructorSections } = useInstructorSections({
    instructorId: currentUser.user.id,
    limit: 3,
  });

  const { data: performanceDashboard } = useGetPerformanceDashboard();

  const dashboardMetrics = dashboardData?.[0] || {};
  const {
    instructorSummary,
    upComingClassSchedule,
    announcements,
    sectionsAttendance,
    gradingQueue,
    lateMissingAssignments,
    averageGradeBySection,
    engagementTrend,
  } = dashboardMetrics;

  if (isDashboardPending) {
    return <DashboardSkeleton />;
  }

  const activeSections = instructorSections?.sections.length || 0;
  const getSummaryValue = (label: string) =>
    instructorSummary?.find((item: { label: string; value: string }) => item.label === label)
      ?.value;
  const totalEnrolled = getSummaryValue("Total Enrolled Students") || "0";
  const newEnrollments = getSummaryValue("New Enrollment This Month") || "0";
  const retentionRate = getSummaryValue("Retention Rate (Last 3 Months)") || "0%";

  const activeLearners = Number(totalEnrolled) || 0;
  const pendingSubmissions = gradingQueue?.[0]?.pendingSubmissions ?? 0;
  const lateMissingTotal = lateMissingAssignments?.[0]?.total ?? 0;
  const lateCount = lateMissingAssignments?.[0]?.late ?? 0;
  const missingCount = lateMissingAssignments?.[0]?.missing ?? 0;

  const averageGrades = averageGradeBySection || [];
  const engagementDays = engagementTrend?.[0]?.days || [];
  const engagementMap = new Map(
    engagementDays.map((d: { day: string; activeStudents: number }) => [
      d.day,
      d.activeStudents,
    ])
  );
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayKey = d.toLocaleDateString("en-CA");
    const label = d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
    return {
      dayKey,
      label,
      count: engagementMap.get(dayKey) || 0,
    };
  });
  const maxEngagement = Math.max(...last7.map((d) => d.count), 1);
  const totalEngagement = last7.reduce((sum, d) => sum + d.count, 0);

  const performanceStudents = performanceDashboard?.students || [];
  const totalPerformanceStudents = performanceStudents.length;
  const completedLessonsStudents = performanceStudents.filter((student: any) => {
    const progress = student.progress;
    return progress && progress.completedLessons > 0;
  }).length;
  const completedModulesStudents = performanceStudents.filter((student: any) => {
    const progress = student.progress;
    if (!progress) return false;
    return (progress.completedModules ?? 0) > 0;
  }).length;
  const completedSectionsStudents = performanceStudents.filter((student: any) => {
    const progress = student.progress;
    if (!progress) return false;
    const totalItems = (progress.totalLessons || 0) + (progress.totalAssessments || 0);
    return totalItems > 0 && progress.percent === 100;
  }).length;

  return (
    <div className="bg-gray-50 min-h-screen overflow-x-hidden">
      <DashboardHeader
        statCard={
          <div className="flex md:flex gap-2 md:gap-4">
            <StatCard
              label={`Active ${sectionsTerm}`}
              value={activeSections}
              icon="courses"
              loading={isDashboardPending}
            />
            <StatCard
              label={`Active ${learnersTerm}`}
              value={activeLearners}
              icon="students"
              loading={isDashboardPending}
            />
          </div>
        }
      />

      {/* Main Layout with Grid */}
      <div className="lg:grid lg:grid-cols-[1fr_300px] max-w-[1400px] mx-auto w-full p-4 lg:p-0">
        {/* Main Panel */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-4 lg:py-8 pr-4 items-stretch">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                    <FaCalendarAlt className="text-blue-600 text-sm" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                    Today's Schedule
                  </h3>
                </div>
                <Button
                  onClick={() =>
                    navigate(
                      `/${currentUser.user.organization.code}/instructor/schedule`
                    )
                  }
                  variant="link"
                  className="flex items-center gap-2"
                >
                  View More
                  <FaAngleRight />
                </Button>
              </div>
              <Schedule variant="embedded" showHeader={false} className="flex-1 min-h-0" />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                  <FaChartLine className="text-blue-600 text-sm" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                  Instructor Summary
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-2xl font-bold text-gray-900">{totalEnrolled}</p>
                  <p className="text-xs text-gray-500">Total Enrolled</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-2xl font-bold text-gray-900">{newEnrollments}</p>
                  <p className="text-xs text-gray-500">New Enrollments</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-2xl font-bold text-gray-900">{retentionRate}</p>
                  <p className="text-xs text-gray-500">Retention Rate</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-2xl font-bold text-gray-900">{pendingSubmissions}</p>
                  <p className="text-xs text-gray-500">Pending Grading</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pr-4 mb-8">
            <CompletionTracker
              title="Completion Tracker"
              items={[
                {
                  label: "Students Completed Lessons",
                  value: completedLessonsStudents,
                  total: totalPerformanceStudents,
                  onClick: () =>
                    navigate(`/${orgCode}/instructor/completion?type=lessons`),
                },
                {
                  label: "Students Completed Modules",
                  value: completedModulesStudents,
                  total: totalPerformanceStudents,
                  onClick: () =>
                    navigate(`/${orgCode}/instructor/completion?type=modules`),
                },
                {
                  label: "Students Completed Sections",
                  value: completedSectionsStudents,
                  total: totalPerformanceStudents,
                  onClick: () =>
                    navigate(`/${orgCode}/instructor/completion?type=sections`),
                },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-4 mb-8 items-stretch">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Grading Queue
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-lg font-bold text-gray-900">{pendingSubmissions}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-lg font-bold text-gray-900">{lateCount}</p>
                  <p className="text-xs text-gray-500">Late</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-lg font-bold text-gray-900">{missingCount}</p>
                  <p className="text-xs text-gray-500">Missing</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-lg font-bold text-gray-900">{lateMissingTotal}</p>
                  <p className="text-xs text-gray-500">Late + Missing</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Attendance Overview
              </h4>
              <AttendanceChart
                data={sectionsAttendance?.[0]}
                variant="embedded"
                heightClass="h-[220px]"
              />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Engagement (7 days)
                </h4>
                <span className="text-xs text-gray-400">
                  {totalEngagement} total
                </span>
              </div>
              <div className="flex items-end justify-between h-20">
                {last7.map((day) => {
                  const barHeight =
                    Math.round((day.count / maxEngagement) * 44) + 6;
                  return (
                    <div
                      key={day.dayKey}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-4 h-16 flex items-end">
                        <div
                          className={`w-4 rounded-full ${
                            day.count > 0 ? "bg-blue-500" : "bg-gray-200"
                          }`}
                          style={{ height: `${barHeight}px` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                <span>{lateCount} late</span>
                <span>{missingCount} missing</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm pr-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Average Grade by Section
              </h4>
              <span className="text-xs text-gray-400">
                {averageGrades.length > 0
                  ? `Top ${Math.min(5, averageGrades.length)} sections`
                  : "No data yet"}
              </span>
            </div>
            {averageGrades.length > 0 ? (
              <div className="space-y-3">
                {averageGrades.map(
                  (
                    item: {
                      section: string;
                      sectionCode: string;
                      average: number;
                      gradedCount: number;
                    },
                    idx: number
                  ) => (
                    <div key={`${item.sectionCode}-${idx}`} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {item.section}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.sectionCode} - {item.gradedCount} graded
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">
                          {Math.round(item.average)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round(item.average))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No graded assessments yet.
              </p>
            )}
          </div>

          {/* Side Panel in Mobile View */}
          <div className="lg:hidden pt-4">
            <SidePanel
              comingUpData={upComingClassSchedule}
              announcements={announcements}
            />
          </div>

        </div>

        {/* Side Panel in Desktop View */}
        <div className="hidden lg:block min-h-screen bg-white p-4 w-[380px]">
          <SidePanel
            comingUpData={upComingClassSchedule}
            announcements={announcements}
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
