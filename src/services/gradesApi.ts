import { API_ENDPOINTS } from "../config/endpoints";
import apiClient from "../config/apiClient";

const { BASE_URL, GRADE } = API_ENDPOINTS;

const gradeService = {
  getAllGrades: async () => {
    try {
      const params = {
        select: "title thumbnail status updatedAt code",
      };
      const response = await apiClient.get(`${BASE_URL}${GRADE.GET_ALL}`, {
        withCredentials: true,
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching grade:", error);
      throw new Error("Error fetching grade data");
    }
  },


  createGrade: async (body: object) => {
    const response = await apiClient.post(`${BASE_URL}${GRADE.CREATE}`, body, {
      withCredentials: true,
    });
    return response.data;
  },

  updateGrade: async (body: object) => {
    const response = await apiClient.put(`${BASE_URL}${GRADE.UPDATE}`, body, {
      withCredentials: true,
    });
    return response.data;
  },

  deleteGrade: async (gradeId: string) => {
    const response = await apiClient.delete(
      `${BASE_URL}${GRADE.REMOVE.replace(":id", gradeId)}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  },
};

export default gradeService;
