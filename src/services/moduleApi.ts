import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, MODULE } = API_ENDPOINTS;

class ModuleService extends APIService {
  private normalizePayload(body: Record<string, unknown>) {
    return {
      ...body,
      ...(body.certificateEnabled !== undefined
        ? { certificateEnabled: Boolean(body.certificateEnabled) }
        : {}),
    };
  }

  getModuleById = async (moduleId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${MODULE.GET_BY_ID.replace(
          ":id",
          moduleId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching module data");
    }
  };

  createModule = async (body: Record<string, unknown>) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${MODULE.CREATE}`,
        this.normalizePayload(body),
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error creating module data");
    }
  };

  updateModule = async (body: Record<string, unknown>) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${MODULE.UPDATE}`,
        this.normalizePayload(body),
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error updating module data");
    }
  };

  deleteModule = async (moduleId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${MODULE.REMOVE.replace(":id", moduleId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting module data");
    }
  };

  populateModuleAssessments = async (moduleId: string) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${MODULE.POPULATE_ASSESSMENTS.replace(":id", moduleId)}`,
        {},
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error populating module assessments");
    }
  };

  getModuleAssessmentDraft = async (moduleId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${MODULE.ASSESSMENT_DRAFT.replace(":id", moduleId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error generating module assessment draft");
    }
  };
}

export default new ModuleService();
