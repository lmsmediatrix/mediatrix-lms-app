import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AnnouncementService from "../services/announcementApi";

export const useGetAnnouncementById = (announcementId: string) => {
  return useQuery({
    queryKey: ["announcement-by-id", announcementId],
    queryFn: async () => {
      AnnouncementService.select(["title", "textBody", "publishDate"]);
      return AnnouncementService.getAnnouncementById(announcementId);
    },
    enabled: !!announcementId,
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return AnnouncementService.createAnnouncement(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-announcement"] });
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return AnnouncementService.updateAnnouncement(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-announcement"] });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (announcementId: string) =>
      AnnouncementService.deleteAnnouncement(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-announcement"] });
    },
  });
};