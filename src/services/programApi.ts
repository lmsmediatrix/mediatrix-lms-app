import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, PROGRAM } = API_ENDPOINTS;

class ProgramService extends APIService {
  getAllPrograms = async () => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${PROGRAM.GET_ALL}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching programs:", error);
      throw new Error("Error fetching program data");
    }
  };

  getProgramById = async (programId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${PROGRAM.GET_BY_ID.replace(
          ":id",
          programId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching program:", error);
      throw new Error("Error fetching program data");
    }
  };

  createProgram = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${PROGRAM.CREATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error creating program:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  updateProgram = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${PROGRAM.UPDATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating program:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  deleteProgram = async (programId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${PROGRAM.REMOVE.replace(":id", programId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting program data");
    }
  };

  searchProgram = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${PROGRAM.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching program:", error);
      throw new Error("Error searching program data");
    }
  };

  exportProgram = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${PROGRAM.EXPORT}`,
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
      console.error("Error exporting programs:", error);
      throw new Error("Error exporting programs");
    }
  };

  bulkImportPrograms = async (data: FormData) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${PROGRAM.BULK_CREATE}`,
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data as {
        message: string;
        result: {
          successCount: number;
          successList: Array<{ _id: string; code: string; name: string }>;
          errorCount: number;
          errorList: Array<{
            errorMessage: string;
            errorCode: number;
            row?: number;
          }>;
        };
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Error importing programs";
      console.error("Error bulk importing programs:", error);
      throw new Error(typeof msg === "string" ? msg : "Error importing programs");
    }
  };
}

export default new ProgramService();
