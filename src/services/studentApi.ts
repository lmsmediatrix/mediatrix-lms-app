import { API_ENDPOINTS } from "../config/endpoints";
import { TActiveView } from "../types/interfaces";
import { APIService } from "./apiService";
import apiClient from "../config/apiClient";

const { BASE_URL, STUDENT } = API_ENDPOINTS;

class StudentService extends APIService {
  getDashboard = async () => {
    try {
      const response = await apiClient.get(`${BASE_URL}${STUDENT.DASHBOARD}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching Dashboard:", error);
      throw new Error("Error fetching Dashboard data");
    }
  };

  getStudentById = async (studentId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${STUDENT.GET_BY_ID.replace(
          ":id",
          studentId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student:", error);
      throw new Error("Error fetching student data");
    }
  };

  searchStudents = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${STUDENT.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching students:", error);
      throw new Error("Error searching students");
    }
  };

  createStudent = async (data: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${STUDENT.CREATE}`,
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.data.error.message || "Something went wrong!");
    }
  };

  updateStudent = async (data: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${STUDENT.UPDATE}`,
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating student:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  deleteStudent = async (studentId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${STUDENT.REMOVE.replace(":id", studentId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error deleting student:", error);
      throw new Error(
        error?.response?.data?.message ||
          error?.data?.error?.message ||
          "Error deleting student"
      );
    }
  };

  getStudentArchiveImpact = async (studentId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${STUDENT.ARCHIVE_IMPACT.replace(":id", studentId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching student archive impact:", error);
      throw new Error(error?.data?.error?.message || "Error fetching archive impact");
    }
  };

  getCalendar = async (view: TActiveView) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${STUDENT.STUDENT_CALENDAR}`,
        {
          withCredentials: true,
          params: { view },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching Calendar:", error);
      throw new Error("Error fetching Calendar data");
    }
  };

  bulkImport = async (data: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${STUDENT.BULK_IMPORT}`,
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk importing students:", error);
      throw new Error("Error bulk importing students");
    }
  };

  getStudentGradeBySection = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${STUDENT.STUDENT_GRADE_BY_SECTION.replace(
          ":sectionCode",
          sectionCode
        )}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Something went wrong!");
    }
  };

  getStudentDetails = async (studentId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${STUDENT.GET_BY_ID.replace(
          ":id",
          studentId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student details:", error);
      throw new Error("Error fetching student details");
    }
  };

  exportStudent = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${STUDENT.EXPORT}`,
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
      throw new Error("Error exporting students");
    }
  };

  exportStudentGrades = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${STUDENT.EXPORT_STUDENT_GRADE.replace(
          ":sectionCode",
          sectionCode
        )}`,
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
      throw new Error("Error exporting student grades");
    }
  };
}

export default new StudentService();
