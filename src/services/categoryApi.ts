import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, CATEGORY } = API_ENDPOINTS;

class CategoryService extends APIService {

  getCategoryById = async (categoryId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${CATEGORY.GET_BY_ID.replace(
          ":id",
          categoryId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching category:", error);
      throw new Error("Error fetching category data");
    }
  };

  createCategory = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${CATEGORY.CREATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error creating category:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  updateCategory = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${CATEGORY.UPDATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating category:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  deleteCategory = async (categoryId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${CATEGORY.REMOVE.replace(":id", categoryId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting category data");
    }
  };

  searchCategory = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${CATEGORY.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching category:", error);
      throw new Error("Error searching category data");
    }
  };
}

export default new CategoryService();
