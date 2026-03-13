import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, STUDENT_ASSESSMENT_GRADE } = API_ENDPOINTS;

class StudentAssessmentGradeService extends APIService {
  getAllStudentAssessmentGrades = async () => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${STUDENT_ASSESSMENT_GRADE.GET_ALL}${this.getQueryString()}`,
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student assessment grades:", error);
      throw new Error("Error fetching student assessment grade data");
    }
  };

  getStudentAssessmentGradeById = async (id: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${STUDENT_ASSESSMENT_GRADE.GET_BY_ID.replace(
          ":id",
          id,
        )}${this.getQueryString()}`,
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student assessment grade:", error);
      throw new Error("Error fetching student assessment grade data");
    }
  };

  getGradesByAssessment = async (assessmentId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${STUDENT_ASSESSMENT_GRADE.GET_BY_ASSESSMENT.replace(
          ":assessmentId",
          assessmentId,
        )}`,
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching grades by assessment:", error);
      throw new Error("Error fetching grades for assessment");
    }
  };

  getGradesByStudentSection = async (studentId: string, sectionId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${STUDENT_ASSESSMENT_GRADE.GET_BY_STUDENT_SECTION.replace(
          ":studentId",
          studentId,
        ).replace(":sectionId", sectionId)}`,
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching grades by student section:", error);
      throw new Error("Error fetching student grades for section");
    }
  };

  createStudentAssessmentGrade = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${STUDENT_ASSESSMENT_GRADE.CREATE}`,
        body,
        { withCredentials: true },
      );
      return response.data;
    } catch (error: any) {
      console.error("Error creating student assessment grade:", error);
      throw new Error(
        error?.response?.data?.message || "Something went wrong!",
      );
    }
  };

  updateStudentAssessmentGrade = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${STUDENT_ASSESSMENT_GRADE.UPDATE}`,
        body,
        { withCredentials: true },
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating student assessment grade:", error);
      throw new Error(
        error?.response?.data?.message || "Something went wrong!",
      );
    }
  };

  deleteStudentAssessmentGrade = async (id: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${STUDENT_ASSESSMENT_GRADE.REMOVE.replace(":id", id)}`,
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting student assessment grade");
    }
  };

  archiveStudentAssessmentGrade = async (id: string) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${STUDENT_ASSESSMENT_GRADE.ARCHIVE.replace(":id", id)}`,
        {},
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      throw new Error("Error archiving student assessment grade");
    }
  };

  searchStudentAssessmentGrades = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${STUDENT_ASSESSMENT_GRADE.SEARCH}`,
        body,
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      throw new Error("Error searching student assessment grades");
    }
  };
}

export default new StudentAssessmentGradeService();
