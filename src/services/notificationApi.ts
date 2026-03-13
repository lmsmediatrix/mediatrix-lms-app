
import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { ApiParams } from "../types/params";
import { APIService } from "./apiService";

const { BASE_URL, NOTIFICATION } = API_ENDPOINTS;

class NotificationService extends APIService {
  getAllNotifications = async (apiParams: ApiParams) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${NOTIFICATION.GET_ALL}`,
        {
          withCredentials: true,
          params: {
            select: "title category description metadata source",
            populateArray:
              '[{"path":"source","select":"firstName lastName"}]',
            document: true,
            ...apiParams,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  };

  updateNotification = async (data: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${NOTIFICATION.UPDATE}`,
        data,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating notification:", error);
      throw error;
    }
  };

  searchNotifications = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${NOTIFICATION.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching notifications:", error);
      throw new Error("Error searching notifications");
    }
  };

  markAsRead = async (data: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${NOTIFICATION.MARK_READ}`,
        data,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  };
}

export default new NotificationService();
