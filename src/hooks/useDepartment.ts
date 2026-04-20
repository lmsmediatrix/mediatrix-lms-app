import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import departmentService from "../services/departmentApi";
import { ApiParams } from "../types/interfaces";

export const useGetAllDepartments = (apiParams?: Partial<ApiParams>) => {
  return useQuery({
    queryKey: ["all-departments", apiParams],
    queryFn: () =>
      departmentService
        .select([
          "name",
          "code",
          "description",
          "isActive",
          "organizationId",
          "archive",
          "createdAt",
          "updatedAt",
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .withPagination(true)
        .withDocument(true)
        .getAllDepartments(),
  });
};

export const useDepartments = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["search-department", apiParams],
    queryFn: async () => {
      departmentService.resetQuery();
      return departmentService
        .select([
          "name",
          "code",
          "description",
          "isActive",
          "organizationId",
          "archive",
          "createdAt",
          "updatedAt",
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where({
          ...(apiParams?.filter
            ? { [apiParams.filter.key]: apiParams.filter.value }
            : {}),
          ...(apiParams?.organizationId
            ? { organizationId: apiParams.organizationId }
            : {}),
        })
        .search(["name", "code", "description"], apiParams?.searchTerm || "")
        .withPagination(true)
        .withDocument(true)
        .withArchive(apiParams?.archiveStatus || "none")
        .searchDepartment();
    },
  });
};

export const useGetDepartmentById = (departmentId: string) => {
  return useQuery({
    queryKey: ["department", departmentId],
    queryFn: () => {
      departmentService.resetQuery();
      return departmentService
        .select(["name", "code", "description", "isActive"])
        .getDepartmentById(departmentId);
    },
    enabled: !!departmentId,
  });
};

export const useViewDepartmentById = (departmentId: string) => {
  return useQuery({
    queryKey: ["view-department", departmentId],
    queryFn: () =>
      departmentService
        .select([
          "name",
          "code",
          "description",
          "isActive",
          "organizationId",
          "createdAt",
          "updatedAt",
        ])
        .getDepartmentById(departmentId),
    enabled: !!departmentId,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return departmentService.createDepartment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-department"] });
      queryClient.invalidateQueries({ queryKey: ["all-departments"] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return departmentService.updateDepartment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-department"] });
      queryClient.invalidateQueries({ queryKey: ["all-departments"] });
      queryClient.invalidateQueries({ queryKey: ["department"] });
      queryClient.invalidateQueries({ queryKey: ["view-department"] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentId: string) => {
      return departmentService.deleteDepartment(departmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-department"] });
      queryClient.invalidateQueries({ queryKey: ["all-departments"] });
    },
  });
};

export const useDepartmentsForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["departments-dropdown", apiParams],
    queryFn: async () => {
      departmentService.resetQuery();
      return departmentService
        .select(["_id", "name", "code"])
        .limit(10)
        .sort("name")
        .where({
          isActive: true,
          ...(apiParams?.filter
            ? { [apiParams.filter.key]: apiParams.filter.value }
            : {}),
          ...(apiParams?.organizationId
            ? { organizationId: apiParams.organizationId }
            : {}),
        })
        .search(["name", "code"], apiParams?.searchTerm || "")
        .withDocument(true)
        .withPagination(false)
        .withArchive("none")
        .searchDepartment();
    },
  });
};

export const useInfiniteDepartmentsForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  const limit = apiParams?.limit || 10;

  return useInfiniteQuery({
    queryKey: ["infinite-departments-dropdown", apiParams],
    queryFn: async ({ pageParam = 0 }) => {
      const skip = pageParam;

      departmentService.resetQuery();
      const result = await departmentService
        .select(["_id", "name", "code"])
        .limit(limit)
        .skip(skip)
        .where({
          isActive: true,
          ...(apiParams?.filter
            ? { [apiParams.filter.key]: apiParams.filter.value }
            : {}),
          ...(apiParams?.organizationId
            ? { organizationId: apiParams.organizationId }
            : {}),
        })
        .search(["name", "code"], apiParams?.searchTerm || "")
        .withDocument(true)
        .withPagination(true)
        .withArchive("none")
        .searchDepartment();

      return result;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      if (pagination && pagination.hasNextPage) {
        const nextSkip = pagination.currentPage;
        return nextSkip;
      }
      return undefined;
    },
    initialPageParam: 0,
  });
};
