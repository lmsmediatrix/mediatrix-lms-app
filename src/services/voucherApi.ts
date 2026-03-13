import apiClient from "../config/apiClient";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { VOUCHER } = API_ENDPOINTS;

class VoucherService extends APIService {
  getAllVouchers = async () => {
    try {
      const response = await apiClient.get(
        `${VOUCHER.GET_ALL}${this.getQueryString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching voucher data");
    }
  };

  getVoucherById = async (voucherId: string) => {
    try {
      const response = await apiClient.get(
        `${VOUCHER.GET_BY_ID.replace(":id", voucherId)}${this.getQueryString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error("Error fetching voucher data");
    }
  };

  createVoucher = async (body: object) => {
    try {
      const response = await apiClient.post(VOUCHER.CREATE, body);
      return response.data;
    } catch (error: any) {
      console.error("Error creating voucher:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  updateVoucher = async (body: object) => {
    try {
      const response = await apiClient.put(VOUCHER.UPDATE, body);
      return response.data;
    } catch (error: any) {
      console.error("Error updating voucher:", error);
      throw new Error(error.data?.error?.message || "Something went wrong!");
    }
  };

  deleteVoucher = async (voucherId: string) => {
    try {
      const response = await apiClient.delete(
        VOUCHER.REMOVE.replace(":id", voucherId)
      );
      return response.data;
    } catch (error) {
      throw new Error("Error deleting voucher");
    }
  };

  searchVoucher = async () => {
    try {
      const response = await apiClient.post(VOUCHER.SEARCH, this.searchParams);
      return response.data;
    } catch (error) {
      throw new Error("Error searching voucher");
    }
  };

  bulkCreateVoucher = async (data: object) => {
    try {
      const response = await apiClient.post(VOUCHER.BULK_CREATE, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk importing students:", error);
      throw new Error("Error bulk importing students");
    }
  };
}

export default new VoucherService();
