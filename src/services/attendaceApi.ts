import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";

const { BASE_URL, ATTENDANCE } = API_ENDPOINTS;

const attendanceService = {
  updateAttendance: async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${ATTENDANCE.UPDATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating attendance:", error);
      throw new Error("Error updating attendance data");
    }
  },
};

export default attendanceService;
