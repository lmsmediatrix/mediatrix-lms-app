import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, INSTRUCTOR } = API_ENDPOINTS;

class InstructorService extends APIService {
  getDashboard = async () => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${INSTRUCTOR.DASHBOARD}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching Dashboard:", error);
      throw new Error("Error fetching Dashboard data");
    }
  };

  getInstructorById = async (instructorId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${INSTRUCTOR.GET_BY_ID.replace(
          ":id",
          instructorId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching instructor:", error);
      throw new Error("Error fetching instructor data");
    }
  };

  searchTeachers = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${INSTRUCTOR.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching teachers:", error);
      throw new Error("Error searching teachers");
    }
  };

  createInstructor = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${INSTRUCTOR.CREATE}`,
        body,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error creating instructor:", error);
      throw new Error(error.data.error.message || "Something went wrong!");
    }
  };

  updateInstructor = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${INSTRUCTOR.UPDATE}`,
        body,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.data.details[0].message || "Something went wrong!";
    }
  };

  deleteInstructor = async (instructorId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${INSTRUCTOR.REMOVE.replace(":id", instructorId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting instructor data");
    }
  };

  bulkImport = async (data: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${INSTRUCTOR.BULK_IMPORT}`,
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
      console.error("Error bulk importing instructors:", error);
      throw new Error("Error bulk importing instructors");
    }
  };

  exportInstructor = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${INSTRUCTOR.EXPORT}`,
        this.searchParams,
        {
          withCredentials: true,
          headers: {
            Accept: "text/csv",
          },
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error exporting instructors");
    }
  };
}

export default new InstructorService();
