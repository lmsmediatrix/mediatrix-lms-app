import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, ASSESSMENT } = API_ENDPOINTS;

class AssessmentService extends APIService {
  getAssessmentById = async (assessmentId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${ASSESSMENT.GET_BY_ID.replace(
          ":id",
          assessmentId
        )}${this.getQueryString()}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.data.error.message);
    }
  };

  createAssessment = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${ASSESSMENT.CREATE}`,
        body,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error:any) {
      throw new Error(error.data?.details[0].message || "Something went wrong!");
    }
  };

  updateAssessment = async (body: object) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${ASSESSMENT.UPDATE}`,
        body,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error updating assessment data");
    }
  };

  deleteAssessment = async (assessmentId: string) => {
    try {
      const response = await apiClient.delete(
        `${BASE_URL}${ASSESSMENT.REMOVE.replace(":id", assessmentId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting assessment data");
    }
  };

  submitAssessment = async (body: object) => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${ASSESSMENT.SUBMIT_ASSESSMENT}`,
        body,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error submitting assessment data");
    }
  };

  getStudentsAssessment = async (sectionCode: string, assessmentId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${ASSESSMENT.GET_SECTION_ASSESSMENT_STUDENTS.replace(
          ":sectionCode",
          sectionCode
        ).replace(":assessmentId", assessmentId)}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching assessment data");
    }
  };

  getStudentsAssessmentResult = async (
    studentId: string,
    assessmentNo: string,
    assessmentType: string,
    sectionCode: string
  ) => {
    try {
      const params = { type: assessmentType, code: sectionCode };
      const response = await apiClient.get(
        `${BASE_URL}${ASSESSMENT.GET_STUDENT_ASSESSMENT_RESULT.replace(
          ":studentId",
          studentId
        ).replace(":assessmentNo", assessmentNo)}`,
        {
          withCredentials: true,
          params,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching assessment result data");
    }
  };

  updateAssessmentResult = async (
    assessmentId: string,
    studentId: string,
    answers: object
  ) => {
    try {
      const response = await apiClient.put(
        `${BASE_URL}${ASSESSMENT.UPDATE_STUDENT_RESULT.replace(
          ":studentId",
          studentId
        ).replace(":assessmentId", assessmentId)}`,
        { answers },
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error updating assessment result");
    }
  };
}

export default new AssessmentService();
