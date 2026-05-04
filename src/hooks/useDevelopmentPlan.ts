import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DevelopmentPlanService, {
  DevelopmentPlanActivityStatus,
  DevelopmentPlanQuarter,
} from "../services/developmentPlanApi";

export const useGetDevelopmentPlans = (params?: {
  employeeId?: string;
  recommendationId?: string;
  keyword?: string;
  limit?: number;
  skip?: number;
}) => {
  return useQuery({
    queryKey: ["development-plans", params],
    queryFn: () => DevelopmentPlanService.getPlans(params),
  });
};

export const useUpsertDevelopmentPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      DevelopmentPlanService.upsertPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
    },
  });
};

export const useUpsertDevelopmentPlanQuarter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { planId: string; quarter: Record<string, unknown> }) =>
      DevelopmentPlanService.upsertQuarter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
    },
  });
};

export const useRemoveDevelopmentPlanQuarter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { planId: string; quarter: DevelopmentPlanQuarter }) =>
      DevelopmentPlanService.removeQuarter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
    },
  });
};

export const useUpsertDevelopmentPlanActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      planId: string;
      quarter: DevelopmentPlanQuarter;
      activity: Record<string, unknown>;
    }) => DevelopmentPlanService.upsertActivity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
    },
  });
};

export const useRemoveDevelopmentPlanActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      planId: string;
      quarter: DevelopmentPlanQuarter;
      activityId: string;
    }) => DevelopmentPlanService.removeActivity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
    },
  });
};

export const useUpdateDevelopmentPlanActivityStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      planId: string;
      quarter: DevelopmentPlanQuarter;
      activityId: string;
      status: DevelopmentPlanActivityStatus;
    }) => DevelopmentPlanService.updateActivityStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
    },
  });
};

export const useUpsertDevelopmentPlanActivityFromTnaExecution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      employeeId: string;
      recommendationId?: string;
      reviewYear?: number;
      quarter?: DevelopmentPlanQuarter;
      activity: Record<string, unknown>;
    }) => DevelopmentPlanService.upsertActivityFromTnaExecution(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
    },
  });
};
