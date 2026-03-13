import { useMutation, useQuery } from "@tanstack/react-query";
import activityService from "../services/activityApi";
import { ApiParams } from "../types/params";

export const useGetActivityById = (activityId: string) => {
  return useQuery({
    queryKey: ["activity-by-id", activityId],
    queryFn: async () => {
      activityService.resetQuery();
      return activityService
        .select([
          "userId",
          "headers",
          "ip",
          "path",
          "method",
          "page",
          "action",
          "description",
          "createdAt",
          // "organizationId",
          "entityType",
          "archive",
        ])
        .populate([
          {
            path: "userId",
            select: "",
          },
          // {
          //   path: "organizationId",
          //   select: "",
          // },
        ])
        .getActivityById(activityId);
    },
    enabled: !!activityId,
  });
};


export const useSearchActivity = (apiParams?: Partial<ApiParams>) => {
  return useQuery({
    queryKey: ["search-activities", apiParams],
    queryFn: async () => {
      activityService.resetQuery();
      const searchParams = {
        query: apiParams?.filter
          ? { [apiParams.filter.key as string]: apiParams.filter.value }
          : {},
        search: apiParams?.searchTerm
          ? {
              fields: ["path", "method", "action", "description"],
              term: apiParams.searchTerm,
            }
          : undefined,
        populateArray: [
          {
            path: "userId",
            select: "firstName lastName email",
          },
          // {
          //   path: "organizationId",
          //   select: "",
          // },
        ],
        sort: apiParams?.sort || "-createdAt",
        select:
          "user headers ip path method page action description createdAt organizationId entityType archive",
        skip: apiParams?.skip || 0,
        limit: apiParams?.limit || 10,
        count: true,
        pagination: true,
        document: true,
      };

      // No try-catch needed - errors will be handled by the axios interceptor
      // and passed to React Query's error handling
      return await activityService.addFields(searchParams).searchActivity();
    },
    // No need to specify retry: false here as we've set it globally in QueryClient config
  });
};

export const useExportActivityLog = () => {
  return useMutation({
    mutationFn: async (apiParams?: Partial<ApiParams>) => {
      activityService.resetQuery();
      return activityService
        .select([
          "user",
          "headers",
          "ip",
          "path",
          "method",
          "page",
          "action",
          "description",
          "createdAt",
          "organizationId",
          "entityType",
          "archive",
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .populate([
          { path: "userId", select: "" },
          { path: "organizationId", select: "" },
        ])

        .exportActivityLogs();
    },
  });
};
