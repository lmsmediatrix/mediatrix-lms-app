import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, LESSON, SECTION } = API_ENDPOINTS;

class LessonService extends APIService {
  getLessonById = async (lessonId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${LESSON.GET_BY_ID.replace(
          ":id",
          lessonId,
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching lesson data");
    }
  };

  createLesson = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${LESSON.CREATE}`,
        body,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error("Error creating lesson");
    }
  };

  updateLesson = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${LESSON.UPDATE}`,
        body,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error("Error updating lesson");
    }
  };

  deleteLesson = async (lessonId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${LESSON.REMOVE.replace(":id", lessonId)}`,
        {
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting lesson");
    }
  };

  updateLessonProgress = async (
    lessonId: string,
    data: { status: "completed" | "in-progress" | "not-started" },
  ) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${LESSON.UPDATE_PROGRESS.replace(":id", lessonId)}`,
        data,
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      throw new Error("Error updating lesson progress");
    }
  };

  getLessonBySectionCode = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${SECTION.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching lesson by section code");
    }
  };
}

export default new LessonService();
