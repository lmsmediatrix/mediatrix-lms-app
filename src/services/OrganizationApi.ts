import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, ORGANIZATION } = API_ENDPOINTS;

class OrganizationService extends APIService {
  getAllOrganizations = async () => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${ORGANIZATION.GET_ALL}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching organizations data");
    }
  };

  getOrganizationById = async (orgId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${ORGANIZATION.GET_BY_ID.replace(
          ":id",
          orgId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching organization data");
    }
  };

  getOrganizationByCode = async (orgCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${ORGANIZATION.GET_BY_CODE.replace(
          ":code",
          orgCode
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching organization data");
    }
  };

  createOrganization = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${ORGANIZATION.CREATE}`,
        body,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error creating organization");
    }
  };

  updateOrganization = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${ORGANIZATION.UPDATE}`,
        body,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error updating organization");
    }
  };

  deleteOrganization = async (orgId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${ORGANIZATION.REMOVE.replace(":id", orgId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting organization");
    }
  };

  searchOrganization = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${ORGANIZATION.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error searching organizations");
    }
  };

  generateCode = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${ORGANIZATION.CODE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.data?.error.message);
    }
  };

  orgSetup = async (data: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${ORGANIZATION.ORG_SETUP}`,
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk importing Organizations data:", error);
      throw new Error("Error bulk importing Organizations data");
    }
  };
}

export default new OrganizationService();
