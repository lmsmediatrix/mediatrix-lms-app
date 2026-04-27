import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TnaService from "../services/tnaApi";

type AutoDeployPlannerCoursePayload = {
  trainingId?: string;
  title: string;
  programName?: string;
  batchName?: string;
  description?: string;
  code?: string;
};

type AutoDeployPlannerPayload = {
  programName?: string;
  batchName?: string;
  courses: AutoDeployPlannerCoursePayload[];
};

export const useGetTnaSkills = (params?: { keyword?: string; limit?: number; skip?: number }) => {
  return useQuery({
    queryKey: ["tna-skills", params],
    queryFn: () => TnaService.getSkills(params),
  });
};

export const useGetTnaRoleRequirements = (params?: {
  keyword?: string;
  limit?: number;
  skip?: number;
}) => {
  return useQuery({
    queryKey: ["tna-role-requirements", params],
    queryFn: () => TnaService.getRoleRequirements(params),
  });
};

export const useCreateTnaSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) => TnaService.createSkill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tna-skills"] });
    },
  });
};

export const useDeleteTnaSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { skillId: string }) => TnaService.removeSkill(payload.skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tna-skills"] });
      queryClient.invalidateQueries({ queryKey: ["tna-role-requirements"] });
    },
  });
};

export const useUpsertRoleRequirement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      jobRole: string;
      requiredSkills: Array<{
        skillId?: string;
        skillName?: string;
        requiredLevel: number;
        passingThreshold?: number;
      }>;
      preAssessmentThreshold?: number;
    }) => TnaService.upsertRoleRequirement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tna-role-requirements"] });
    },
  });
};

export const useDeleteTnaRoleRequirement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { roleRequirementId: string }) =>
      TnaService.removeRoleRequirement(payload.roleRequirementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tna-role-requirements"] });
    },
  });
};

export const useUpsertEmployeeSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      employeeId: string;
      jobRole: string;
      allowRoleChange?: boolean;
      skills: Array<{ skillId?: string; skillName?: string; currentLevel: number }>;
    }) => TnaService.upsertEmployeeSkill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tna-employee-skills"] });
    },
  });
};

export const useGetTnaEmployeeSkills = (params?: { limit?: number; skip?: number; employeeId?: string }) => {
  return useQuery({
    queryKey: ["tna-employee-skills", params],
    queryFn: () => TnaService.getEmployeeSkills(params),
  });
};

export const useAnalyzeTna = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      employeeId: string;
      jobRole: string;
      requiredSkillsOverride?: Array<{
        skillId?: string;
        skillName?: string;
        requiredLevel: number;
        passingThreshold?: number;
      }>;
      employeeSkillsOverride?: Array<{ skillId?: string; skillName?: string; currentLevel: number }>;
      preAssessment?: { score?: number; threshold?: number };
      performanceGaps?: string[];
      complianceRequirements?: Array<{ title: string; courseId?: string; mandatory?: boolean }>;
      managerRecommendations?: string[];
      employeeRequests?: string[];
    }) => TnaService.analyze(payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tna-recommendations"] });
      queryClient.invalidateQueries({
        queryKey: ["employee-tna-recommendations", variables.employeeId],
      });
    },
  });
};

export const useGetTnaRecommendations = (params?: {
  limit?: number;
  skip?: number;
  status?: "pending" | "assigned" | "completed";
  employeeId?: string;
}) => {
  return useQuery({
    queryKey: ["tna-recommendations", params],
    queryFn: () => TnaService.getRecommendations(params),
  });
};

export const useGetEmployeeTnaRecommendations = (
  employeeId: string,
  params?: { limit?: number; skip?: number }
) => {
  return useQuery({
    enabled: !!employeeId,
    queryKey: ["employee-tna-recommendations", employeeId, params],
    queryFn: () => TnaService.getEmployeeRecommendations(employeeId, params),
  });
};

export const useDeleteTnaRecommendation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { recommendationId: string }) =>
      TnaService.deleteRecommendation(payload.recommendationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tna-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-tna-recommendations"] });
    },
  });
};

export const useUpdateTnaRecommendationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { recommendationId: string; status: "pending" | "assigned" | "completed" }) =>
      TnaService.updateRecommendationStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tna-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-tna-recommendations"] });
    },
  });
};

export const useUpsertTnaRecommendationExecution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      recommendationId: string;
      trainingProgramTitle?: string;
      speakerName?: string;
      speakerSource?: string;
      scheduledAt?: string;
      scheduleNotes?: string;
      materialsPrepared?: boolean;
      materialsNotes?: string;
      conductedAt?: string;
      examScore?: number;
      passingScore?: number;
      examRetakeCount?: number;
      evaluationScore?: number;
      evaluationNotes?: string;
      certificateIssued?: boolean;
      certificateCode?: string;
      certificateIssuedAt?: string;
      recordsFiled?: boolean;
      recordsFiledAt?: string;
      recordsNotes?: string;
      trainingStatuses?: Array<{
        trainingId: string;
        status: "pending" | "in_progress" | "completed";
      }>;
      status?: "pending" | "assigned" | "completed";
    }) => TnaService.upsertRecommendationExecution(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tna-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-tna-recommendations"] });
    },
  });
};

export const useAutoDeployTnaRecommendations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: { recommendationIds?: string[]; planner?: AutoDeployPlannerPayload }) =>
      TnaService.autoDeployRecommendations(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tna-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["employee-tna-recommendations"] });
    },
  });
};
