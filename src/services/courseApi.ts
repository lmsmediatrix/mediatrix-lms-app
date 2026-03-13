import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, COURSE } = API_ENDPOINTS;

class CourseService extends APIService {
  getAllCourses = async () => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${COURSE.GET_ALL}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching courses:", error);
      throw new Error("Error fetching course data");
    }
  };

  getCourseById = async (courseId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${COURSE.GET_BY_ID.replace(
          ":id",
          courseId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching course:", error);
      throw new Error("Error fetching course data");
    }
  };

  createCourse = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${COURSE.CREATE}`,
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
      console.error("Error creating course:", error);
      throw new Error(error.data.error.message || "Something went wrong!");
    }
  };

  updateCourse = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${COURSE.UPDATE}`,
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
      console.error("Error updating course:", error);
      throw new Error(error.data.error.message || "Something went wrong!");
    }
  };

  deleteCourse = async (courseId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${COURSE.REMOVE.replace(":id", courseId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting course data");
    }
  };

  searchCourse = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${COURSE.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching course:", error);
      throw new Error("Error searching course data");
    }
  };

  exportCourse = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${COURSE.EXPORT}`,
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
      throw new Error("Error exporting course");
    }
  };
}

export default new CourseService();
