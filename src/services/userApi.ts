import { API_ENDPOINTS } from "../config/endpoints";
import { TRole } from "../types/interfaces";
import apiClient from "../config/apiClient";

const { BASE_URL, USER } = API_ENDPOINTS;

const UserService = {
  getCurrentUser: async () => {
    const response = await apiClient.get(`${BASE_URL}${USER.CHECKLOGIN}`, {
      withCredentials: true,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post(
      `${BASE_URL}${USER.LOGIN}`,
      { email, password },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.get(`${BASE_URL}${USER.LOGOUT}`, {
      withCredentials: true,
    });
    return response.data;
  },

  register: async (data: object) => {
    const response = await apiClient.post(`${BASE_URL}${USER.CREATE}`, data, {
      withCredentials: true,
    });
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(
      `${BASE_URL}${USER.REMOVE.replace(":id", userId)}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  getUserById: async (userId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${USER.GET_BY_ID.replace(":id", userId)}`,
        {
          withCredentials: true,
          params: {
            select:
              "firstName lastName email avatar status updatedAt createdAt",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw new Error("Error fetching user by ID");
    }
  },

  updateUser: async (body: object) => {
    try {
      const response = await apiClient.put(`${BASE_URL}${USER.UPDATE}`, body, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.data?.error.message || "Error updating user";
      throw new Error(errorMessage);
    }
  },

  getUserMetrics: async (
    type: TRole,
    filter: "today" | "week" | "month" | "year"
  ) => {
    try {
      const response = await apiClient.get(`${BASE_URL}${USER.METRICS}`, {
        withCredentials: true,
        params: {
          type,
          filter,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching metrics:", error);
      throw new Error("Error fetching metrics");
    }
  },

  resetPassword: async (body: object) => {
    const response = await apiClient.post(
      `${BASE_URL}${USER.RESET_PASSWORD}`,
      body,
      {
        withCredentials: true,
      }
    );
    return response.data;
  },
};

export default UserService;
