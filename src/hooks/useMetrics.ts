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

export const useGetInstructorMetrics = (userId: string, orgId: string) => {
  return useQuery({
    queryKey: ["user-metrics", userId, orgId],
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
            "lateMissingAssignments",
            "averageGradeBySection",
            "engagementTrend",
          ],
          filter: {
            instructorId: userId,
            organizationId: orgId,
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
