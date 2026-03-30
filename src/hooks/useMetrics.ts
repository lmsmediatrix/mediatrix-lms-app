import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import metricsService, {
  CreatePerformanceActionPlanPayload,
} from "../services/metricsApi";

export const useGetStudentMetrics = (userId: string, orgId: string) => {
  return useQuery({
    queryKey: ["user-metrics", userId, orgId],
    queryFn: () =>
      metricsService
        .metrics({
          model: "student",
          data: [
            "assignmentData",
            "continueWorking",
            "upComingClassSchedule",
            "announcements",
            "overallProgress",
            "recentGrades",
            "expandedStats",
            "upcomingDeadlines",
            "attendanceSummary",
            "studyStreak",
            "performanceData",
            "activityFeed",
          ],
          filter: {
            studentId: userId,
            organizationId: orgId,
          },
        })
        .searchMetrics(),
    enabled: !!userId && !!orgId,
  });
};

export const useGetAdminMetrics = (userId: string, orgId: string) => {
  return useQuery({
    queryKey: ["user-metrics", userId, orgId],
    queryFn: () =>
      metricsService
        .metrics({
          model: "Organization",
          data: ["studentByStatus", "instructorsToAssign", "coursesToAssign"],
          filter: {
            adminId: userId,
            organizationId: orgId,
          },
        })
        .searchMetrics(),
    enabled: !!userId && !!orgId,
  });
};

export const useGetInstructorMetrics = (
  userId: string,
  orgId: string,
  date?: string,
) => {
  return useQuery({
    queryKey: ["user-metrics", userId, orgId, date || ""],
    queryFn: () =>
      metricsService
        .metrics({
          model: "instructor",
          data: [
            "instructorSummary",
            "continueWorking",
            "upComingClassSchedule",
            "announcements",
            "sectionsAttendance",
            "gradingQueue",
            "gradingQueueStatusCounts",
            "lateMissingAssignments",
            "averageGradeBySection",
            "engagementTrend",
          ],
          filter: {
            instructorId: userId,
            organizationId: orgId,
            ...(date ? { date } : {}),
          },
        })
        .searchMetrics(),
    enabled: !!userId && !!orgId,
    placeholderData: (prev) => prev,
  });
};

export const useGetAttendanceByDate = (
  instructorId: string,
  orgId: string,
  date: string,
) => {
  return useQuery({
    queryKey: ["attendance-by-date", instructorId, orgId, date],
    queryFn: () =>
      metricsService
        .metrics({
          model: "instructor",
          data: ["sectionsAttendance"],
          filter: {
            instructorId,
            organizationId: orgId,
            date,
          },
        })
        .searchMetrics(),
    enabled: !!instructorId && !!orgId && !!date,
  });
};

export const useGetGradingQueueList = (userId: string, orgId: string) => {
  return useQuery({
    queryKey: ["grading-queue-list", userId, orgId],
    queryFn: () =>
      metricsService
        .metrics({
          model: "instructor",
          data: ["gradingQueueList"],
          filter: { instructorId: userId, organizationId: orgId },
        })
        .searchMetrics(),
    enabled: !!userId && !!orgId,
  });
};

export const useGetLateMissingList = (userId: string, orgId: string) => {
  return useQuery({
    queryKey: ["late-missing-list", userId, orgId],
    queryFn: () =>
      metricsService
        .metrics({
          model: "instructor",
          data: ["lateMissingList"],
          filter: { instructorId: userId, organizationId: orgId },
        })
        .searchMetrics(),
    enabled: !!userId && !!orgId,
  });
};

export const useGetNewEnrollmentsList = (
  userId: string,
  orgId: string,
  dateFrom?: string,
  dateTo?: string,
) => {
  const normalizedDateFrom = dateFrom?.trim();
  const normalizedDateTo = dateTo?.trim();

  return useQuery({
    queryKey: [
      "new-enrollments-list",
      userId,
      orgId,
      normalizedDateFrom || "",
      normalizedDateTo || "",
    ],
    queryFn: () =>
      metricsService
        .metrics({
          model: "instructor",
          data: ["newEnrollmentsList"],
          filter: {
            instructorId: userId,
            organizationId: orgId,
            ...(normalizedDateFrom && normalizedDateTo
              ? {
                  dateFrom: normalizedDateFrom,
                  dateTo: normalizedDateTo,
                }
              : {}),
          },
        })
        .searchMetrics(),
    enabled: !!userId && !!orgId,
  });
};

export const useGetAdminDashboard = () => {
  return useQuery({
    queryKey: ["user-metrics"],
    queryFn: () => metricsService.getAdminDashboard(),
  });
};

export const useGetSectionChartData = (courseId: string, orgId: string) => {
  return useQuery({
    queryKey: ["user-metrics", courseId, orgId],
    queryFn: () =>
      metricsService
        .metrics({
          model: "Section",
          data: [
            "totalSectionCount",
            "studentsPerSectionCount",
            "sectionPerStatusCount",
          ],
          filter: {
            organizationId: orgId,
            course: courseId,
          },
        })
        .searchMetrics(),
    enabled: !!orgId,
  });
};

export const useGetPerformanceDashboard = (sectionCode?: string) => {
  return useQuery({
    queryKey: ["performance-dashboard", sectionCode || ""],
    queryFn: () =>
      metricsService
        .resetQuery()
        .addFields({
          filter: sectionCode ? { sectionCode } : undefined,
        })
        .getPerformanceDashboard(),
  });
};

export const useGetStudentPerformanceDetails = (studentId: string) => {
  return useQuery({
    queryKey: ["student-performance-details", studentId],
    queryFn: () => metricsService.getStudentPerformanceDetails(studentId),
    enabled: !!studentId,
  });
};

export const useCreatePerformanceActionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreatePerformanceActionPlanPayload) =>
      metricsService.createPerformanceActionPlan(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-dashboard"] });
    },
  });
};
