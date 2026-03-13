import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";
import apiClient from "../config/apiClient";

const { BASE_URL, ACTIVITY_LOG } = API_ENDPOINTS;

class ActivityService extends APIService {

  getActivityById = async (activityId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${ACTIVITY_LOG.GET_BY_ID.replace(
          ":id",
          activityId
        )}${this.getQueryString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching activity:", error);
      throw new Error("Error fetching activity data");
    }
  };

  searchActivity = async () => {
    const response = await apiClient.post(
      `${BASE_URL}${ACTIVITY_LOG.SEARCH}`,
      this.searchParams
    );
    return response.data;
  };

  exportActivityLogs = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${ACTIVITY_LOG.EXPORT}`,
        this.searchParams,
        {
          withCredentials: true,
          headers: {
            'Accept': 'text/csv',
          },
          responseType: 'blob', 
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error exporting activity logs");
    }
  };
}

export default new ActivityService();
