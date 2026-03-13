import axios from "axios";
import { API_ENDPOINTS } from "../config/endpoints";
import { APIService } from "./apiService";

const { BASE_URL, CLOUDINARY } = API_ENDPOINTS;

class CloudinaryService extends APIService {
  uploadImage = async (body: object) => {
    const response = await axios.post(`${BASE_URL}${CLOUDINARY.UPLOAD_IMAGE}`, body, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  };

  deleteImage = async (url: object) => {
    const response = await axios.delete(
      `${BASE_URL}${CLOUDINARY.DELETE}`,
      {
        withCredentials: true,
        data: {url},
      }
    );
    return response.data;
  };
}

export default new CloudinaryService();
