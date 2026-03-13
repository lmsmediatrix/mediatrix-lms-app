import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import OrganizationService from "../services/OrganizationApi";
import { ApiParams } from "../types/params";

export const useGetOrganizationById = (orgId: string) => {
  return useQuery({
    enabled: !!orgId,
    queryKey: ["organization-by-id", orgId],
    queryFn: async () => {
      OrganizationService.select([
        "name",
        "code",
        "description",
        "type",
        "admin",
        "users",
        "status",
        "branding",
        "isDeleted",
        "createdAt",
        "updatedAt",
      ]).populate([
        {
          path: "admins",
          select: "avatar firstName lastName email role status",
        },
      ]);

      return OrganizationService.getOrganizationById(orgId);
    },
  });
};

export const useGetOrganizationByCode = (orgCode: string) => {
  return useQuery({
    enabled: !!orgCode,
    queryKey: ["organization-by-code", orgCode],
    queryFn: async () => {
      OrganizationService.select([
        "name",
        "code",
        "description",
        "type",
        "admin",
        "users",
        "status",
        "branding",
        "isDeleted",
        "createdAt",
        "updatedAt",
      ]).populate([
        {
          path: "admins",
          select: "avatar firstName lastName email role status",
        },
      ]);
      return OrganizationService.getOrganizationByCode(orgCode);
    },
  });
};

export const useGetAllOrganization = (apiParams?: Partial<ApiParams>) => {
  return useQuery({
    queryKey: ["all-organization"],
    queryFn: async () => {
      OrganizationService.select([
        "name",
        "code",
        "updatedAt",
        "branding.logo",
        "type",
      ])
        .withDocument(true)
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .sort(apiParams?.sort || "-createdAt")
        .withPagination(true);
      return OrganizationService.getAllOrganizations();
    },
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return OrganizationService.createOrganization(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-organization"] });
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orgId: string) =>
      OrganizationService.deleteOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-organization"] });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return OrganizationService.updateOrganization(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-organization"] });
      queryClient.invalidateQueries({ queryKey: ["organization-by-code"] });
    },
    onError: (error) => {
      console.error("Failed to update organization:", error);
    },
  });
};

export const useSearchOrganization = (apiParams?: Partial<ApiParams>) => {
  return useQuery({
    queryKey: ["search-organization", apiParams],
    queryFn: async () => {
      OrganizationService.resetQuery();
      return OrganizationService.select([
        "name",
        "code",
        "updatedAt",
        "branding.logo",
      ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where(
          apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}
        )
        .search(["name", "code"], apiParams?.searchTerm || "")
        .withDocument(true)
        .withPagination(true)
        .searchOrganization();
    },
  });
};

export const useInfiniteOrganizations = (apiParams?: Partial<ApiParams>) => {
  const limit = apiParams?.limit || 8;

  return useInfiniteQuery({
    queryKey: ["infinite-organizations", apiParams],
    queryFn: async ({ pageParam = 0 }) => {
      const skip = pageParam;

      OrganizationService.resetQuery();
      const result = await OrganizationService.select([
        "name",
        "code",
        "updatedAt",
        "branding.logo",
        "type",
      ])
        .limit(limit)
        .skip(skip)
        .where(
          apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}
        )
        .search(["name", "code"], apiParams?.searchTerm || "")
        .withDocument(true)
        .withPagination(true)
        .searchOrganization();

      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      const { pagination } = lastPage;
      if (pagination.hasNextPage) {
        const currentSkip = allPages.length > 0 ? allPages.length - 1 : 0;
        const nextSkip = currentSkip + 1;
        return nextSkip;
      }
      return undefined;
    },
    initialPageParam: 0,
  });
};

export const useGenerateCode = () => {
  return useMutation({
    mutationFn: (data: object) => {
      return OrganizationService.generateCode(data);
    },
  });
};

export const useGetOrganizationName = (orgId: string) => {
  return useQuery({
    queryKey: ["organization-name", orgId],
    queryFn: async () => {
      OrganizationService.select(["name", "code", "description", "branding"]);
      return OrganizationService.getOrganizationById(orgId);
    },
  });
};

export const useImportOrgSetup = () => {
  return useMutation({
    mutationFn: (data: object) => {
      return OrganizationService.orgSetup(data);
    },
  });
};
