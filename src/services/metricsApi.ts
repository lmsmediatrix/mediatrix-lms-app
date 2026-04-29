import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, METRICS } = API_ENDPOINTS;

class MetricsService extends APIService {
  searchMetrics = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${METRICS.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error searching metrics:", error);
      throw new Error("Error searching metrics data");
    }
  };
  getAdminDashboard = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${METRICS.GET_ORGANIZATION_DASHBOARD}`,
        this.searchParams,
        {
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching admin dashboard metrics:", error);
      throw new Error("Error fetching admin dashboard metrics");
    }
  };

  getPerformanceDashboard = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${METRICS.GET_PERFORMANCE_DASHBOARD}`,
        this.searchParams,
        {
          withCredentials: true,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching performance dashboard metrics:", error);
      throw new Error("Error fetching performance dashboard metrics");
    }
  };

  getStudentPerformanceDetails = async (studentId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${METRICS.GET_STUDENT_PERFORMANCE_DETAILS}/${studentId}`,
        { withCredentials: true },
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching student performance details:", error);
      throw new Error(
        error?.response?.data?.error ||
          "Error fetching student performance details",
      );
    }
  };
}

export default new MetricsService();
