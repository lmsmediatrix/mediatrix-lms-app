import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, DEPARTMENT } = API_ENDPOINTS;

class DepartmentService extends APIService {
  getAllDepartments = async () => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${DEPARTMENT.GET_ALL}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw new Error("Error fetching department data");
    }
  };

  getDepartmentById = async (departmentId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${DEPARTMENT.GET_BY_ID.replace(
          ":id",
          departmentId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching department:", error);
      throw new Error("Error fetching department data");
    }
  };

  createDepartment = async (body: object) => {
    try {
      const response = await apiClient.post(`${BASE_URL}${DEPARTMENT.CREATE}`, body, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error creating department:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  updateDepartment = async (body: object) => {
    try {
      const response = await apiClient.put(`${BASE_URL}${DEPARTMENT.UPDATE}`, body, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error updating department:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  deleteDepartment = async (departmentId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${DEPARTMENT.REMOVE.replace(":id", departmentId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting department data");
    }
  };

  searchDepartment = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${DEPARTMENT.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching department:", error);
      throw new Error("Error searching department data");
    }
  };
}

export default new DepartmentService();
