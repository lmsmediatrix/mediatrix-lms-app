import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, ANNOUNCEMENT } = API_ENDPOINTS;

class AnnouncementService extends APIService {
  getAnnouncementById = async (announcementId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${ANNOUNCEMENT.GET_BY_ID.replace(
          ":id",
          announcementId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching announcement:", error);
      throw new Error("Error fetching announcement data");
    }
  };

  createAnnouncement = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${ANNOUNCEMENT.CREATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating announcement:", error);
      throw new Error("Error creating announcement data");
    }
  };

  updateAnnouncement = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${ANNOUNCEMENT.UPDATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating announcement:", error);
      throw new Error("Error updating announcement data");
    }
  };

  deleteAnnouncement = async (announcementId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${ANNOUNCEMENT.REMOVE.replace(":id", announcementId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting announcement:", error);
      throw new Error("Error deleting announcement data");
    }
  };
}

export default new AnnouncementService();
