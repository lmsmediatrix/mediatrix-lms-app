import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
// import { TActiveTab, TAssessmentTab } from "../types/interfaces";
// import { SEARCH_SECTION_CONFIG } from "../config/common";
import { APIService } from "./apiService";

const { BASE_URL, SECTION } = API_ENDPOINTS;

class SectionService extends APIService {
  createSection = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${SECTION.CREATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error creating section:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  updateSection = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${SECTION.UPDATE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  getSectionById = async (sectionId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.GET_BY_ID.replace(
          ":id",
          sectionId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching section:", error);
      throw new Error("Error fetching section data");
    }
  };

  deleteSection = async (sectionCode: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${SECTION.REMOVE.replace(":id", sectionCode)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting section data");
    }
  };

  submitAttendance = async (sectionId: object) => {
    const body = {
      sectionId,
    };
    try {
      const response = await apiClient.post(
        `${BASE_URL}${SECTION.MARK_ATTENDANCE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.data?.error.message;
      throw new Error(errorMessage);
    }
  };

  getSectionAttendance = async (
    sectionCode: string,
    date: { from: string; to: string }
  ) => {
    try {
      const params = date;
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SECTION_ATTENDANCE.replace(
          ":sectionCode",
          sectionCode
        )}`,
        {
          withCredentials: true,
          params,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching attendance data");
    }
  };

  bulkImportStudents = async (sectionCode: string, data: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${SECTION.BULK_ADD_STUDENTS.replace(
          ":sectionCode",
          sectionCode
        )}`,
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
      throw new Error("Error bulk importing students");
    }
  };

  searchSections = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${SECTION.SEARCH}`,
        this.searchParams,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error searching sections");
    }
  };

  getStudentGrades = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SECTION_STUDENT_GRADES.replace(
          ":sectionCode",
          sectionCode
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching student grades data");
    }
  };

  getSectionAnalytics = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SECTION_STUDENT_GRADES_ANALYTICS.replace(
          ":sectionCode",
          sectionCode
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching section analytics data");
    }
  };

  exportSection = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${SECTION.EXPORT}`,
        this.searchParams,
        {
          withCredentials: true,
          headers: {
            Accept: "text/csv", // Request CSV from backend
          },
          responseType: "blob", // Treat response as a Blob
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error exporting sections");
    }
  };

  removeStudentInSection = async (sectionCode: string, studentId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${SECTION.REMOVE_STUDENT_IN_SECTION.replace(
          ":sectionCode",
          sectionCode
        ).replace(":studentId", studentId)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error removing student from section:", error);
      throw new Error("Error removing student from section");
    }
  };

  addStudentsToSection = async (sectionCode: string, studentIds: string[]) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${SECTION.ADD_STUDENTS_TO_SECTION_BY_CODE.replace(
          ":sectionCode",
          sectionCode
        )}`,
        { studentIds },
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error adding students to section:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  generateCode = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${SECTION.HELPER_CODE}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.data?.error.message);
    }
  };

  updateAttendance = async (body: object) => {
    const response = await apiClient.post(
      `${BASE_URL}${SECTION.UPDATE_ATTENDANCE}`,
      body,
      {
        withCredentials: true,
      }
    );
    return response.data;
  };

  getSectionModule = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SECTION_MODULE.replace(
          ":sectionCode",
          sectionCode
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching section module data");
    }
  };

  getSectionAnnouncement = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SECTION_ANNOUNCEMENT.replace(
          ":sectionCode",
          sectionCode
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching section announcement data");
    }
  };

  getSectionAssessment = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SECTION_ASSESSMENT.replace(
          ":sectionCode",
          sectionCode
        )}${this.getQueryString()}&assessmentId=true&pendingAssessment=true&count=true`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching section assessment data");
    }
  };

  getSectionStudent = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SECTION_STUDENT.replace(
          ":sectionCode",
          sectionCode
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching section assessment data");
    }
  };

  getSectionGradeSystem = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SECTION_GRADE_SYSTEM.replace(
          ":sectionCode",
          sectionCode
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching section grade system data");
    }
  };

  exportStudentGrades = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SECTION_STUDENT_GRADES_EXPORT.replace(
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

  exportSectionStudent = async (sectionCode: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SECTION_STUDENT_EXPORT.replace(
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
      throw new Error("Error exporting section student");
    }
  };

  getSchedule = async (startDate?: string, endDate?: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${SECTION.SCHEDULE}${this.getQueryString()}`,
        {
          withCredentials: true,
          params: { startDate, endDate },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching schedule data");
    }
  };
}

export default new SectionService();
