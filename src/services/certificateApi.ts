import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, CERTIFICATE } = API_ENDPOINTS;

class CertificateService extends APIService {
  generateCertificate = async (body: {
    studentId: string;
    moduleId?: string;
    lessonId?: string;
    scopeId?: string;
    scopeType?: "module" | "lesson";
    sectionId?: string;
  }) => {
    const response = await apiClient.post(`${BASE_URL}${CERTIFICATE.GENERATE}`, body, {
      withCredentials: true,
    });
    return response.data;
  };

  getCertificatesByStudent = async (studentId: string, query?: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });

    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await apiClient.get(
      `${BASE_URL}${CERTIFICATE.GET_BY_STUDENT.replace(":studentId", studentId)}${suffix}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  };

  getCertificateVisibility = async (
    studentId: string,
    query: {
      moduleId?: string;
      lessonId?: string;
      scopeId?: string;
      scopeType?: "module" | "lesson";
    }
  ) => {
    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await apiClient.get(
      `${BASE_URL}${CERTIFICATE.GET_VISIBILITY.replace(":studentId", studentId)}${suffix}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  };

  getCertificateById = async (certificateId: string) => {
    const response = await apiClient.get(
      `${BASE_URL}${CERTIFICATE.GET_BY_ID.replace(":id", certificateId)}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  };

  getCertificateByNumber = async (certificateNo: string) => {
    const response = await apiClient.get(
      `${BASE_URL}${CERTIFICATE.GET_BY_NUMBER.replace(":certificateNo", certificateNo)}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  };
}

export default new CertificateService();
