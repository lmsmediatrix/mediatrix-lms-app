import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";
import apiClient from "../config/apiClient";

const { BASE_URL, AUDIT_LOG } = API_ENDPOINTS;

class AuditService extends APIService {
  getAllAudits = async () => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${AUDIT_LOG.GET_ALL}${this.getQueryString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching audits:", error);
      throw new Error("Error fetching audit data");
    }
  };

  getAuditById = async (auditId: string) => {
    try {
      const response = await apiClient.get(
        `${BASE_URL}${AUDIT_LOG.GET_BY_ID.replace(
          ":id",
          auditId
        )}${this.getQueryString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching audit:", error);
      throw new Error("Error fetching audit data");
    }
  };

  searchAudit = async () => {
    const response = await apiClient.post(
      `${BASE_URL}${AUDIT_LOG.SEARCH}`,
      this.searchParams
    );
    return response.data;
  };

  exportAuditLogs = async () => {
    try {
      const response = await apiClient.post(
        `${BASE_URL}${AUDIT_LOG.EXPORT}`,
        this.searchParams,
        {
          withCredentials: true,
          headers: {
            'Accept': 'text/csv',
          },
          responseType: 'blob', 
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Error exporting audit logs");
    }
  };
}

export default new AuditService();