import { PlusIcon } from "@/components/ui/plus-icon";
import { UserIcon } from "@/components/ui/user-icon";
import { UsersIcon } from "@/components/ui/users-icon";
import { BookOpenIcon } from "@/components/ui/book-open-icon";
import { LayoutGridIcon } from "@/components/ui/layout-grid-icon";
import Button from "../../components/common/Button";
import DashboardHeader from "../../components/common/DashboardHeader";
import StatCard from "../../components/common/StatCard";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import SectionStatus from "../../components/orgAdmin/SectionStatus";
import SectionChart from "../../components/orgAdmin/SectionChart";
import SummaryListCard from "../../components/orgAdmin/SummaryListCard";
import DashboardStatCard from "../../components/orgAdmin/DashboardStatCard";
import {
  useGetAdminDashboard,
  useGetPerformanceDashboard,
  useGetSectionChartData,
} from "../../hooks/useMetrics";
import OrgAdminDashboardSkeleton from "../../components/skeleton/OrgAdminDashboardSkeleton";
import { useGetAllCourses } from "../../hooks/useCourse";
import { useState } from "react";
import { ICourse } from "../../types/interfaces";
import SectionAnalyticsSkeleton from "../../components/skeleton/SectionAnalyticsSkeleton";
import CompletionTracker from "../../components/common/CompletionTracker";

const iconMap = {
  FaBook: BookOpenIcon,
  FaUserTie: UserIcon,
  FaUserGraduate: UsersIcon,
  FaThLarge: LayoutGridIcon,
};

type DashboardApiResponse = {
  organizationMetrics: {
    instructorsToAssign: number;
    coursesToAssign: {
      courses: {
        _id: string;
        title: string;
        description: string;
        code: string;
      }[];
      total: number;
    };
  };
  courseMetrics: {
    totalCourseCount: { total: number }[];
    courseCountPerCategory: { total: number; category: string }[];
  };
  userMetrics: {
    totalInstructorCount: { total: number }[];
    totalStudentCount: { total: number }[];
    instructorCountPerFaculty: { total: number; faculty: string }[];
    studentCountPerProgram: { total: number; program: string }[];
  };
  sectionMetrics: {
    totalSectionCount: { total: number }[];
    studentsPerSectionCount: { _id: string; section: string; total: number }[];
    sectionPerStatusCount: { total: number; status: string }[];
  };
};

type SectionChartApiResponse = {
  totalSectionCount: { total: number }[];
  studentsPerSectionCount: { _id: string; section: string; total: number }[];
  sectionPerStatusCount: { total: number; status: string }[];
}[];

export default function OrgAdminDashboard() {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const sectionTerm = getTerm("group", orgType);
  const sectionsTerm = getTerm("group", orgType, true);
  const navigate = useNavigate();
  const location = useLocation();
  const orgCode = currentUser.user?.organization.code;
  const coverPhoto = currentUser.user?.organization?.branding?.coverPhoto;
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const { data: dashboardData1, isPending: isDashboardPending } =
    useGetAdminDashboard(); // Removed selectedCourseId since it shouldn't depend on course filter

  const { data: performanceDashboard } = useGetPerformanceDashboard();

  const { data: courseData, isPending: isCourseDataPending } =
    useGetAllCourses();

  const { data: sectionChartData, isPending: isSectionChartPending } =
    useGetSectionChartData(selectedCourseId, currentUser.user.organization._id);

  const performanceStudents = performanceDashboard?.students || [];
  const totalPerformanceStudents = performanceStudents.length;
  const completedSectionsStudents = performanceStudents.filter(
    (student: any) => {
      const progress = student.progress;
      if (!progress) return false;
      const totalItems =
        (progress.totalLessons || 0) + (progress.totalAssessments || 0);
      return totalItems > 0 && progress.percent === 100;
    },
  ).length;

  // Transform API data to match expected structure
  const transformDashboardData = (
    apiData: DashboardApiResponse,
    sectionData: SectionChartApiResponse,
  ) => {
    // Consolidate duplicate faculties
    const facultyMap = new Map<string, number>();
    apiData.userMetrics.instructorCountPerFaculty.forEach((item) => {
      facultyMap.set(
        item.faculty,
        (facultyMap.get(item.faculty) || 0) + item.total,
      );
    });
    const consolidatedFaculties = Array.from(facultyMap.entries()).map(
      ([faculty, total]) => ({
        faculty,
        total,
      }),
    );

    // Use sectionChartData for section-related metrics
    const sectionMetrics = sectionData[0] || {
      totalSectionCount: [{ total: 0 }],
      studentsPerSectionCount: [],
      sectionPerStatusCount: [],
    };

    return {
      stats: [
        {
          label: "Courses",
          value: apiData.courseMetrics.totalCourseCount[0]?.total || 0,
          icon: "FaBook",
        },
        {
          label: "Instructors",
          value: apiData.userMetrics.totalInstructorCount[0]?.total || 0,
          icon: "FaUserTie",
        },
        {
          label: "Students",
          value: apiData.userMetrics.totalStudentCount[0]?.total || 0,
          icon: "FaUserGraduate",
        },
        {
          label: sectionsTerm,
          value: sectionMetrics.totalSectionCount[0]?.total || 0,
          icon: "FaThLarge",
        },
      ],
      sectionChart: {
        labels: sectionMetrics.studentsPerSectionCount.map(
          (item: { section: string }) => item.section,
        ),
        values: sectionMetrics.studentsPerSectionCount.map(
          (item: { total: number }) => item.total,
        ),
        totalStudents: sectionMetrics.studentsPerSectionCount.reduce(
          (sum: number, item: { total: number }) => sum + item.total,
          0,
        ),
      },
      sectionStatus: [
        {
          label: `Upcoming ${sectionsTerm}`,
          value:
            sectionMetrics.sectionPerStatusCount.find(
              (item: { status: string }) => item.status === "upcoming",
            )?.total || 0,
          status: "upcoming" as const,
        },
        {
          label: `Active ${sectionsTerm}`,
          value:
            sectionMetrics.sectionPerStatusCount.find(
              (item: { status: string }) => item.status === "ongoing",
            )?.total || 0,
          status: "active" as const,
        },
        {
          label: `Completed ${sectionsTerm}`,
          value:
            sectionMetrics.sectionPerStatusCount.find(
              (item: { status: string }) => item.status === "completed",
            )?.total || 0,
          status: "completed" as const,
        },
      ],
      summaryCards: {
        courseCategories: apiData.courseMetrics.courseCountPerCategory.map(
          (item: { category: string; total: number }) => ({
            label: item.category,
            value: item.total,
            valueLabel: "courses",
          }),
        ),
        facultyInstructors: consolidatedFaculties.map(
          (item: { faculty: string; total: number }) => ({
            label: item.faculty,
            value: item.total,
            valueLabel: "instructors",
          }),
        ),
        programStudents: apiData.userMetrics.studentCountPerProgram.map(
          (item: { program: string; total: number }) => ({
            label: item.program,
            value: item.total,
            valueLabel: "students",
          }),
        ),
      },
      instructorsToAssign: apiData.organizationMetrics.instructorsToAssign || 0,
      coursesToAssign: {
        total: apiData.organizationMetrics.coursesToAssign.total || 0,
      },
    };
  };

  // Use transformed data or fallback to empty structure only if dashboard data is pending
  const dashboardData = isDashboardPending
    ? {
        stats: [],
        sectionChart: { labels: [], values: [], totalStudents: 0 },
        sectionStatus: [],
        summaryCards: {
          courseCategories: [],
          facultyInstructors: [],
          programStudents: [],
        },
        instructorsToAssign: 0,
        coursesToAssign: { total: 0 },
      }
    : transformDashboardData(dashboardData1, sectionChartData || []);

  // Handle loading state for full dashboard
  if (isDashboardPending) {
    return <OrgAdminDashboardSkeleton />;
  }

  return (
    <div className="bg-gray-50">
      <DashboardHeader
        coverPhoto={coverPhoto}
        subTitle={
          orgType !== "corporate" ? (
            <Button
              onClick={() => navigate(`/${orgCode}/admin/section/new`)}
              className="hidden mt-4 xl:flex bg-secondary w-fit justify-center text-white hover:bg-white hover:text-secondary transition-all duration-300"
            >
              <PlusIcon size={14} /> Create New {getTerm("group", orgType)}
            </Button>
          ) : null
        }
        statCard={
          <div className="flex md:flex gap-2 md:gap-4 md:mt-6">
            <StatCard
              label="Courses to assign"
              value={dashboardData.coursesToAssign.total}
              icon="critical"
              onClick={() =>
                navigate(location.pathname.replace("dashboard", "course"))
              }
            />
            <StatCard
              label="Instructors to assign"
              value={dashboardData.instructorsToAssign}
              icon="students"
              onClick={() =>
                navigate(location.pathname.replace("dashboard", "instructor"))
              }
            />
          </div>
        }
      />

      {/* Main Layout */}
      <div className="w-full p-4">
        {/* Main Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {dashboardData.stats.map(
            (
              stat: { label: string; value: number; icon: string },
              idx: number,
            ) => (
              <DashboardStatCard
                key={idx}
                label={stat.label}
                value={stat.value}
                icon={iconMap[stat.icon as keyof typeof iconMap]}
                index={idx}
                onClick={() => navigate(stat.label)}
              />
            ),
          )}
        </div>
        <div className="mb-4">
          <CompletionTracker
            title="Completion Tracker"
            items={[
              {
                label: `Students Completed ${sectionsTerm}`,
                value: completedSectionsStudents,
                total: totalPerformanceStudents,
              },
            ]}
          />
        </div>
        {/* Section Chart and Status */}
        {isSectionChartPending ? (
          <SectionAnalyticsSkeleton />
        ) : (
          <div className="bg-white border rounded-xl p-6 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {sectionTerm} Analytics
                </h2>
                <p className="text-gray-600">
                  View metrics and status across all course {sectionsTerm.toLowerCase()}
                </p>
              </div>
              <div className="w-full md:w-72">
                <label
                  htmlFor="course-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Course Filter
                </label>
                <select
                  id="course-select"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  disabled={isCourseDataPending}
                >
                  <option value="">All Courses</option>
                  {courseData?.data?.map((course: ICourse) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {isCourseDataPending && (
                  <p className="mt-1 text-xs text-gray-500">
                    Loading courses...
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SectionChart data={dashboardData.sectionChart} xAxisLabel={sectionsTerm} />
              </div>
              <div>
                <SectionStatus statusData={dashboardData.sectionStatus} />
              </div>
            </div>
          </div>
        )}
        {/* Summary Cards */}
        <div className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryListCard
            title="Course Categories"
            items={dashboardData.summaryCards.courseCategories}
            buttonText="View All Categories"
            onButtonClick={() =>
              navigate(location.pathname.replace("dashboard", "category"))
            }
          />
          <SummaryListCard
            title="Instructor Faculties"
            items={dashboardData.summaryCards.facultyInstructors}
            buttonText="View All Faculties"
            onButtonClick={() =>
              navigate(location.pathname.replace("dashboard", "faculty"))
            }
          />
          <SummaryListCard
            title="Student Programs"
            items={dashboardData.summaryCards.programStudents}
            buttonText="View All Programs"
            onButtonClick={() =>
              navigate(location.pathname.replace("dashboard", "program"))
            }
          />
        </div>
      </div>
    </div>
  );
}
