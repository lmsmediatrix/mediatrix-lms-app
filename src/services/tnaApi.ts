import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, TNA } = API_ENDPOINTS;

class TnaService extends APIService {
  createSkill = async (body: { name: string; description?: string }) => {
    const response = await apiClient.post(`${BASE_URL}${TNA.SKILL_CREATE}`, body, {
      withCredentials: true,
    });
    return response.data;
  };

  getSkills = async (params?: { keyword?: string; limit?: number; skip?: number }) => {
    const response = await apiClient.get(`${BASE_URL}${TNA.SKILL_GET_ALL}`, {
      withCredentials: true,
      params,
    });
    return response.data;
  };

  removeSkill = async (skillId: string) => {
    const response = await apiClient.delete(
      `${BASE_URL}${TNA.SKILL_REMOVE.replace(":id", skillId)}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  };

  getRoleRequirements = async (params?: {
    keyword?: string;
    limit?: number;
    skip?: number;
  }) => {
    const response = await apiClient.get(
      `${BASE_URL}${TNA.ROLE_REQUIREMENT_GET_ALL}`,
      {
        withCredentials: true,
        params,
      },
    );
    return response.data;
  };

  upsertRoleRequirement = async (body: {
    jobRole: string;
    requiredSkills: Array<{ skillId?: string; skillName?: string; requiredLevel: number }>;
    preAssessmentThreshold?: number;
  }) => {
    const response = await apiClient.put(`${BASE_URL}${TNA.ROLE_REQUIREMENT_UPSERT}`, body, {
      withCredentials: true,
    });
    return response.data;
  };

  removeRoleRequirement = async (roleRequirementId: string) => {
    const response = await apiClient.delete(
      `${BASE_URL}${TNA.ROLE_REQUIREMENT_REMOVE.replace(":id", roleRequirementId)}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  };

  upsertEmployeeSkill = async (body: {
    employeeId: string;
    jobRole: string;
    allowRoleChange?: boolean;
    skills: Array<{ skillId?: string; skillName?: string; currentLevel: number }>;
  }) => {
    const response = await apiClient.put(`${BASE_URL}${TNA.EMPLOYEE_SKILL_UPSERT}`, body, {
      withCredentials: true,
    });
    return response.data;
  };

  getEmployeeSkills = async (params?: { limit?: number; skip?: number; employeeId?: string }) => {
    const response = await apiClient.get(`${BASE_URL}${TNA.EMPLOYEE_SKILL_GET_ALL}`, {
      withCredentials: true,
      params,
    });
    return response.data;
  };

  analyze = async (body: {
    employeeId: string;
    jobRole: string;
    requiredSkillsOverride?: Array<{ skillId?: string; skillName?: string; requiredLevel: number }>;
    employeeSkillsOverride?: Array<{ skillId?: string; skillName?: string; currentLevel: number }>;
    preAssessment?: { score?: number; threshold?: number };
    performanceGaps?: string[];
    complianceRequirements?: Array<{ title: string; courseId?: string; mandatory?: boolean }>;
    managerRecommendations?: string[];
    employeeRequests?: string[];
  }) => {
    const response = await apiClient.post(`${BASE_URL}${TNA.ANALYZE}`, body, {
      withCredentials: true,
    });
    return response.data;
  };

  getRecommendations = async (params?: {
    limit?: number;
    skip?: number;
    status?: "pending" | "assigned" | "completed";
    employeeId?: string;
  }) => {
    const response = await apiClient.get(`${BASE_URL}${TNA.RECOMMENDATION_GET_ALL}`, {
      withCredentials: true,
      params,
    });
    return response.data;
  };

  getEmployeeRecommendations = async (employeeId: string, params?: { limit?: number; skip?: number }) => {
    const response = await apiClient.get(
      `${BASE_URL}${TNA.RECOMMENDATION_BY_EMPLOYEE.replace(":employeeId", employeeId)}`,
      {
        withCredentials: true,
        params,
      }
    );
    return response.data;
  };

  deleteRecommendation = async (recommendationId: string) => {
    const response = await apiClient.delete(
      `${BASE_URL}${TNA.RECOMMENDATION_REMOVE.replace(":id", recommendationId)}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  };

  updateRecommendationStatus = async (body: {
    recommendationId: string;
    status: "pending" | "assigned" | "completed";
  }) => {
    const response = await apiClient.put(`${BASE_URL}${TNA.RECOMMENDATION_UPDATE_STATUS}`, body, {
      withCredentials: true,
    });
    return response.data;
  };

  upsertRecommendationExecution = async (body: {
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
  }) => {
    const response = await apiClient.put(
      `${BASE_URL}${TNA.RECOMMENDATION_EXECUTION_UPSERT}`,
      body,
      {
        withCredentials: true,
      }
    );
    return response.data;
  };

  autoDeployRecommendations = async (body?: { recommendationIds?: string[] }) => {
    const response = await apiClient.post(
      `${BASE_URL}${TNA.RECOMMENDATION_AUTO_DEPLOY}`,
      body || {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  };
}

export default new TnaService();
