import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NotificationService from "../services/notificationApi";

interface NotificationApiParams {
  skip?: number;
  limit?: number;
  sort?: string;
  status?: "read" | "unread";
  document?: boolean;
  count?: boolean;
  searchTerm?: string;
}

export const useNotification = (
  apiParams: Partial<NotificationApiParams> = {
    skip: 0,
    limit: 10,
    sort: "-createdAt",
    status: "unread",
    document: true,
    count: true,
  }
) => {
  return useQuery({
    queryKey: ["notifications", apiParams],
    queryFn: () => NotificationService.getAllNotifications(apiParams),
  });
};

export const useSearchNotifications = (
  apiParams: Partial<NotificationApiParams> = {
    skip: 0,
    limit: 10,
    sort: "-createdAt",
    status: "unread",
  }
) => {
  return useQuery({
    queryKey: ["search-notifications", apiParams],
    queryFn: async () => {
      NotificationService.resetQuery();
      return NotificationService.select([
        "title",
        "description",
        "status",
        "category",
        "metadata",
        "recipients",
        "createdAt",
        "updatedAt",
      ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .search(
          ["title", "description", "category"],
          apiParams?.searchTerm || ""
        )
        .addFields({ status: apiParams?.status || "unread" })
        .withPagination(true)
        .withDocument(true)
        .searchNotifications();
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string }) =>
      NotificationService.markAsRead({ id: data.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["search-notifications"] });
    },
  });
};
