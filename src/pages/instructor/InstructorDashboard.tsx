import { FaAngleRight } from "react-icons/fa";
import { ChartLineIcon } from "@/components/ui/chart-line-icon";
import { BellIcon } from "@/components/ui/bell-icon";
import Button from "../../components/common/Button";
import DashboardHeader from "../../components/common/DashboardHeader";
import ModernDatePicker from "../../components/common/ModernDatePicker";
import StatCard from "../../components/common/StatCard";
import SidePanel from "../../components/common/SidePanel";
import DashboardSkeleton from "../../components/skeleton/DashboardSkeleton";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import IsPasswordChangedModal from "../../components/common/IsPasswordChangedModal";
import { useState, useRef, useEffect } from "react";
import { useInstructorSections } from "../../hooks/useSection";
import {
  useGetInstructorMetrics,
  useGetPerformanceDashboard,
} from "../../hooks/useMetrics";
import { getTerm } from "../../lib/utils";

function RefetchCard({
  loading,
  delay = 0,
  className,
  children,
}: {
  loading: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`transition-opacity duration-500 ease-out ${loading ? "opacity-40" : "opacity-100"} ${className ?? ""}`}
      style={{ transitionDelay: loading ? "0ms" : `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// â”€â”€ Animated icon helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface AnimIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

function AnimatedCardIcon({
  Icon,
  isHovered,
  size = 14,
}: {
  Icon: React.ComponentType<{ size?: number }>;
  isHovered: boolean;
  size?: number;
}) {
  const iconRef = useRef<AnimIconHandle>(null);
  useEffect(() => {
    if (isHovered) iconRef.current?.startAnimation();
    else iconRef.current?.stopAnimation();
  }, [isHovered]);
  const IconWithRef = Icon as React.ForwardRefExoticComponent<
    { size?: number } & React.RefAttributes<AnimIconHandle>
  >;
  return <IconWithRef ref={iconRef} size={size} />;
}

import Schedule from "../../components/instructor/Schedule";
import AttendanceChart from "../../components/instructor/AttendanceChart";
import CompletionTracker from "../../components/common/CompletionTracker";

const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function InstructorDashboard() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    toLocalDateString(new Date()),
  );
  const [scheduleCardHovered, setScheduleCardHovered] = useState(false);
  const [summaryCardHovered, setSummaryCardHovered] = useState(false);
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const orgCode = currentUser.user.organization.code;
  const navigate = useNavigate();
  const today = toLocalDateString(new Date());

  // Define dynamic terms
  const learnersTerm = getTerm("learner", orgType, true); // "Students" or "Employees"
  const sectionTerm = getTerm("group", orgType, false); // "Section" or "Department"
  const sectionsTerm = getTerm("group", orgType, true); // "Sections" or "Departments"

  const {
    data: dashboardData,
    isPending: isDashboardPending,
    isFetching: isDashboardFetching,
  } = useGetInstructorMetrics(
    currentUser.user.id,
    currentUser.user.organization._id,
    selectedDate,
  );

  // True only when refetching with existing data (date change), not on first load
  const isRefetching = isDashboardFetching && !isDashboardPending;

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
    gradingQueue,
    gradingQueueStatusCounts,
    lateMissingAssignments,
  } = dashboardMetrics;

  if (isDashboardPending) {
    return <DashboardSkeleton />;
  }

  const activeSections = instructorSections?.sections.length || 0;
  const getSummaryValue = (label: string) =>
    instructorSummary?.find(
      (item: { label: string; value: string }) => item.label === label,
    )?.value;
  const totalEnrolled =
    getSummaryValue("Total Enrolled Students") ||
    getSummaryValue("Total Enrolled Employees") ||
    "0";
  const newEnrollments = getSummaryValue("New Enrollment This Month") || "0";
  const retentionRate =
    getSummaryValue("Retention Rate (Last 3 Months)") || "0%";

  const activeLearners = Number(totalEnrolled) || 0;
  const pendingSubmissions = gradingQueue?.[0]?.pendingSubmissions ?? 0;
  // Use the same definition as the Late Submissions page: late AND still pending grading.
  const lateCount = gradingQueueStatusCounts?.[0]?.late ?? 0;
  const missingCount = lateMissingAssignments?.[0]?.missing ?? 0;

  const performanceStudents = performanceDashboard?.students || [];
  const totalPerformanceStudents = performanceStudents.length;
  const completedLessonsStudents = performanceStudents.filter(
    (student: any) => {
      const progress = student.progress;
      return progress && progress.completedLessons > 0;
    },
  ).length;
  const completedModulesStudents = performanceStudents.filter(
    (student: any) => {
      const progress = student.progress;
      if (!progress) return false;
      return (progress.completedModules ?? 0) > 0;
    },
  ).length;
  const completedSectionsStudents = performanceStudents.filter(
    (student: any) => {
      const progress = student.progress;
      if (!progress) return false;
      const totalItems =
        (progress.totalLessons || 0) + (progress.totalAssessments || 0);
      return totalItems > 0 && progress.percent === 100;
    },
  ).length;
  const upcomingCount = upComingClassSchedule?.length ?? 0;
  const heroPrimaryAction =
    pendingSubmissions > 0
      ? {
          label: `Review ${pendingSubmissions} Submission${pendingSubmissions > 1 ? "s" : ""}`,
          href: `/${orgCode}/instructor/grading`,
        }
      : {
          label: `Manage ${sectionsTerm}`,
          href: `/${orgCode}/instructor/sections`,
        };
  const nextAction =
    pendingSubmissions > 0
      ? {
          title: "Grade pending submissions",
          description:
            "Clear your queue so learners get feedback before the next session.",
          cta: "Open Grading Queue",
          href: `/${orgCode}/instructor/grading`,
        }
      : upcomingCount > 0
        ? {
            title: "Prepare your next class",
            description:
              "Review upcoming items and align instructions before class starts.",
            cta: "Open Schedule",
            href: `/${orgCode}/instructor/schedule`,
          }
        : {
            title: "Set your next learning activities",
            description: `Create or update ${sectionTerm.toLowerCase()} content so ${learnersTerm.toLowerCase()} can continue progress.`,
          };
  const showNextActionCta =
    !!nextAction.cta &&
    !!nextAction.href &&
    nextAction.href !== heroPrimaryAction.href;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
      <DashboardHeader
        coverPhoto={
          currentUser.user.organization.branding?.coverPhoto || undefined
        }
        statCard={
          <div className="flex md:flex gap-2 md:gap-4 mt-6">
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
        dateFilter={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(heroPrimaryAction.href)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition-all hover:bg-white"
            >
              {heroPrimaryAction.label}
              <FaAngleRight className="text-[10px]" />
            </button>
            <ModernDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              max={today}
            />
            {selectedDate !== today && (
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/30 px-2.5 py-2 text-xs font-medium text-white/70 hover:border-white/50 hover:text-white transition-all"
              >
                Today
              </button>
            )}
          </div>
        }
      />

      {/* Content area â€” fills the rest of the viewport */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-1 min-w-0 max-w-[1400px] mx-auto w-full">
          {/* Main scrollable column */}
          <div className="no-scrollbar min-w-0 flex-1 overflow-y-auto">
            {/* Main Panel */}
            <div className="p-4 lg:p-0">
              <RefetchCard loading={isRefetching} delay={0}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-4 lg:py-8 pr-4 items-stretch">
                  <div
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full"
                    onMouseEnter={() => setScheduleCardHovered(true)}
                    onMouseLeave={() => setScheduleCardHovered(false)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
                            color: "var(--color-primary, #2563eb)",
                          }}
                        >
                          <AnimatedCardIcon
                            Icon={BellIcon}
                            isHovered={scheduleCardHovered}
                            size={16}
                          />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                          Today's Schedule
                        </h3>
                      </div>
                      <Button
                        onClick={() =>
                          navigate(
                            `/${currentUser.user.organization.code}/instructor/schedule`,
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

                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                      Tasks
                    </h4>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      {[
                        {
                          value: pendingSubmissions,
                          label: "Submissions to review",
                          color: "text-gray-900",
                          href: `/${orgCode}/instructor/grading`,
                        },
                        {
                          value: lateCount,
                          label: "Late work to check",
                          color: "text-amber-500",
                          href: `/${orgCode}/instructor/grading?filter=late`,
                        },
                        {
                          value: missingCount,
                          label: "Missing work to resolve",
                          color: "text-red-500",
                          href: `/${orgCode}/instructor/late-missing?filter=missing`,
                        },
                        {
                          value: upcomingCount,
                          label: "Classes to prepare",
                          color: "text-blue-600",
                          href: `/${orgCode}/instructor/schedule`,
                        },
                      ].map(({ value, label, color, href }) => (
                        <button
                          key={label}
                          onClick={() => navigate(href)}
                          className="rounded-xl border p-4 flex flex-col justify-center text-left transition-all hover:shadow-sm hover:brightness-95 cursor-pointer"
                          style={{
                            backgroundColor:
                              "color-mix(in srgb, var(--color-primary, #3b82f6) 6%, white 94%)",
                            borderColor:
                              "color-mix(in srgb, var(--color-primary, #3b82f6) 18%, white 82%)",
                          }}
                        >
                          <p className={`text-2xl font-bold ${color}`}>
                            {value}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {label} <span aria-hidden="true">&#8599;</span>
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </RefetchCard>

              <RefetchCard loading={isRefetching} delay={120}>
                <div className="pr-4 mb-8">
                  <CompletionTracker
                    title="Completion Tracker"
                    items={[
                      {
                        label: `${learnersTerm} Completed Lessons`,
                        value: completedLessonsStudents,
                        total: totalPerformanceStudents,
                        onClick: () =>
                          navigate(
                            `/${orgCode}/instructor/completion?type=lessons`,
                          ),
                      },
                      {
                        label: `${learnersTerm} Completed Modules`,
                        value: completedModulesStudents,
                        total: totalPerformanceStudents,
                        onClick: () =>
                          navigate(
                            `/${orgCode}/instructor/completion?type=modules`,
                          ),
                      },
                      {
                        label: `${learnersTerm} Completed ${sectionsTerm}`,
                        value: completedSectionsStudents,
                        total: totalPerformanceStudents,
                        onClick: () =>
                          navigate(
                            `/${orgCode}/instructor/completion?type=sections`,
                          ),
                      },
                    ]}
                  />
                </div>
              </RefetchCard>

              <RefetchCard loading={isRefetching} delay={240}>
                <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 pr-4 mb-8 items-stretch">
                  <div
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full"
                    onMouseEnter={() => setSummaryCardHovered(true)}
                    onMouseLeave={() => setSummaryCardHovered(false)}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
                          color: "var(--color-primary, #2563eb)",
                        }}
                      >
                        <AnimatedCardIcon
                          Icon={ChartLineIcon}
                          isHovered={summaryCardHovered}
                          size={16}
                        />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                        Instructor Summary
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-1 auto-rows-fr">
                      <div
                        className="rounded-xl border p-4 flex flex-col justify-center"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 6%, white 94%)",
                          borderColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 18%, white 82%)",
                        }}
                      >
                        <p className="text-2xl font-bold text-gray-900">
                          {totalEnrolled}
                        </p>
                        <p className="text-xs text-gray-500">Total Enrolled</p>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/${orgCode}/instructor/enrollments`)
                        }
                        className="rounded-xl border p-4 text-left transition-all flex flex-col justify-center hover:shadow-sm hover:brightness-95"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 6%, white 94%)",
                          borderColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 18%, white 82%)",
                        }}
                      >
                        <p className="text-2xl font-bold text-gray-900">
                          {newEnrollments}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-primary, #2563eb)" }}
                        >
                          New Enrollments{" "}
                          <span aria-hidden="true">&#8599;</span>
                        </p>
                      </button>
                      <div
                        className="rounded-xl border p-4 flex flex-col justify-center"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 6%, white 94%)",
                          borderColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 18%, white 82%)",
                        }}
                      >
                        <p className="text-2xl font-bold text-gray-900">
                          {retentionRate}
                        </p>
                        <p className="text-xs text-gray-500">Retention Rate</p>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/${orgCode}/instructor/grading`)
                        }
                        className="rounded-xl border p-4 text-left transition-all flex flex-col justify-center hover:shadow-sm hover:brightness-95"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 6%, white 94%)",
                          borderColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 18%, white 82%)",
                        }}
                      >
                        <p className="text-2xl font-bold text-gray-900">
                          {pendingSubmissions}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-primary, #2563eb)" }}
                        >
                          Pending Grading{" "}
                          <span aria-hidden="true">&#8599;</span>
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                      Attendance Overview
                    </h4>
                    <AttendanceChart
                      variant="embedded"
                      heightClass="h-[240px]"
                      date={selectedDate}
                    />
                  </div>
                </div>
              </RefetchCard>

              {/* Side Panel in Mobile View */}
              <div className="lg:hidden pt-4">
                <SidePanel
                  comingUpData={upComingClassSchedule}
                  announcements={announcements}
                />
              </div>
            </div>
          </div>
          {/* end main scrollable column */}

          {/* Sidebar â€” stays visible, only main column scrolls */}
          <div className="hidden h-full min-h-0 w-[360px] shrink-0 px-4 pb-8 pt-8 lg:block">
            <div className="flex h-full min-h-0 flex-col gap-4">
              <div className="min-h-0 flex-1">
                <SidePanel
                  comingUpData={upComingClassSchedule}
                  announcements={announcements}
                  fitToColumn
                />
              </div>
              <div
                className="shrink-0 rounded-2xl border p-4 shadow-sm"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-primary, #3b82f6) 4%, white 96%)",
                  borderColor:
                    "color-mix(in srgb, var(--color-primary, #3b82f6) 14%, white 86%)",
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Next Action
                </p>
                <h4 className="mt-1 text-sm font-semibold text-gray-900">
                  {nextAction.title}
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  {nextAction.description}
                </p>
                {showNextActionCta && (
                  <button
                    type="button"
                    onClick={() => navigate(nextAction.href)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--color-primary,#3b82f6)_30%,white_70%)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary,#2563eb)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary,#3b82f6)_8%,white_92%)]"
                  >
                    {nextAction.cta}
                    <FaAngleRight className="text-[10px]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* end inner flex */}
      </div>
      {/* end content area */}

      {isChangePasswordOpen && (
        <IsPasswordChangedModal
          onClose={() => setIsChangePasswordOpen(false)}
        />
      )}
    </div>
  );
}
