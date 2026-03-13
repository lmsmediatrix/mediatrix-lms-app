import { useMutation } from "@tanstack/react-query";
import CloudinaryService from "../services/cloudinaryApi";


export const useUploadImage = () => {
  return useMutation({
    mutationFn: (data: object) => {
        CloudinaryService.resetQuery();
      return CloudinaryService.uploadImage(data);
    },
  });
};

export const useDeleteImage = () => { 
  return useMutation({
    mutationFn: (url: object) => CloudinaryService.deleteImage(url),

  });
};
