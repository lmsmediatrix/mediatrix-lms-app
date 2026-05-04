import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, TNA } = API_ENDPOINTS;

export type DevelopmentPlanQuarter = "Q1" | "Q2" | "Q3" | "Q4";
export type DevelopmentPlanActivityStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

class DevelopmentPlanService extends APIService {
  getPlans = async (params?: {
    employeeId?: string;
    recommendationId?: string;
    keyword?: string;
    limit?: number;
    skip?: number;
  }) => {
    const response = await apiClient.get(`${BASE_URL}${TNA.DEVELOPMENT_PLAN_GET_ALL}`, {
      withCredentials: true,
      params,
    });
    return response.data;
  };

  upsertPlan = async (body: Record<string, unknown>) => {
    const response = await apiClient.put(`${BASE_URL}${TNA.DEVELOPMENT_PLAN_UPSERT}`, body, {
      withCredentials: true,
    });
    return response.data;
  };

  upsertQuarter = async (body: { planId: string; quarter: Record<string, unknown> }) => {
    const response = await apiClient.put(
      `${BASE_URL}${TNA.DEVELOPMENT_PLAN_QUARTER_UPSERT}`,
      body,
      {
        withCredentials: true,
      },
    );
    return response.data;
  };

  removeQuarter = async (body: { planId: string; quarter: DevelopmentPlanQuarter }) => {
    const response = await apiClient.delete(
      `${BASE_URL}${TNA.DEVELOPMENT_PLAN_QUARTER_REMOVE}`,
      {
        withCredentials: true,
        data: body,
      },
    );
    return response.data;
  };

  upsertActivity = async (body: {
    planId: string;
    quarter: DevelopmentPlanQuarter;
    activity: Record<string, unknown>;
  }) => {
    const response = await apiClient.put(
      `${BASE_URL}${TNA.DEVELOPMENT_PLAN_ACTIVITY_UPSERT}`,
      body,
      {
        withCredentials: true,
      },
    );
    return response.data;
  };

  removeActivity = async (body: {
    planId: string;
    quarter: DevelopmentPlanQuarter;
    activityId: string;
  }) => {
    const response = await apiClient.delete(
      `${BASE_URL}${TNA.DEVELOPMENT_PLAN_ACTIVITY_REMOVE}`,
      {
        withCredentials: true,
        data: body,
      },
    );
    return response.data;
  };

  updateActivityStatus = async (body: {
    planId: string;
    quarter: DevelopmentPlanQuarter;
    activityId: string;
    status: DevelopmentPlanActivityStatus;
  }) => {
    const response = await apiClient.put(
      `${BASE_URL}${TNA.DEVELOPMENT_PLAN_ACTIVITY_STATUS_UPDATE}`,
      body,
      {
        withCredentials: true,
      },
    );
    return response.data;
  };

  upsertActivityFromTnaExecution = async (body: {
    employeeId: string;
    recommendationId?: string;
    reviewYear?: number;
    quarter?: DevelopmentPlanQuarter;
    activity: Record<string, unknown>;
  }) => {
    const response = await apiClient.put(
      `${BASE_URL}${TNA.DEVELOPMENT_PLAN_ACTIVITY_TNA_UPSERT}`,
      body,
      {
        withCredentials: true,
      },
    );
    return response.data;
  };
}

export default new DevelopmentPlanService();
