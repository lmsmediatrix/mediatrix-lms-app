import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, FACULTY } = API_ENDPOINTS;

class FacultyService extends APIService {
  getAllFaculties = async () => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${FACULTY.GET_ALL}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching faculties:", error);
      throw new Error("Error fetching faculty data");
    }
  };

  getFacultyById = async (facultyId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${FACULTY.GET_BY_ID.replace(
          ":id",
          facultyId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching faculty:", error);
      throw new Error("Error fetching faculty data");
    }
  };

  createFaculty = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${FACULTY.CREATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error creating faculty:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  updateFaculty = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${FACULTY.UPDATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating faculty:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  deleteFaculty = async (facultyId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${FACULTY.REMOVE.replace(":id", facultyId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting faculty data");
    }
  };

  searchFaculty = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${FACULTY.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching faculty:", error);
      throw new Error("Error searching faculty data");
    }
  };

  generateCode = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${FACULTY.CODE}`,
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
}

export default new FacultyService();
