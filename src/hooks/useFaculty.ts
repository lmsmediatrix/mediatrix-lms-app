import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import facultyService from "../services/facultyApi";
import { ApiParams } from "../types/interfaces";

export const useGetAllFaculties = (apiParams?: Partial<ApiParams>) => {
  return useQuery({
    queryKey: ["all-faculties", apiParams],
    queryFn: () =>
      facultyService
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
        .getAllFaculties(),
  });
};

export const useFaculties = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["search-faculty", apiParams],
    queryFn: async () => {
      facultyService.resetQuery();
      return facultyService
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
        .searchFaculty();
    },
  });
};

export const useGetFacultyById = (facultyId: string) => {
  return useQuery({
    queryKey: ["faculty", facultyId],
    queryFn: () => {
      facultyService.resetQuery();
      return facultyService
        .select(["name", "code", "description", "isActive"])
        .getFacultyById(facultyId);
    },
    enabled: !!facultyId,
  });
};

export const useViewFacultyById = (facultyId: string) => {
  return useQuery({
    queryKey: ["view-faculty", facultyId],
    queryFn: () =>
      facultyService
        .select([
          "name",
          "code",
          "description",
          "isActive",
          "organizationId",
          "createdAt",
          "updatedAt",
        ])
        .getFacultyById(facultyId),
    enabled: !!facultyId,
  });
};

export const useCreateFaculty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return facultyService.createFaculty(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-faculty"] });
      queryClient.invalidateQueries({ queryKey: ["all-faculties"] });
    },
  });
};

export const useUpdateFaculty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return facultyService.updateFaculty(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-faculty"] });
      queryClient.invalidateQueries({ queryKey: ["all-faculties"] });
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      queryClient.invalidateQueries({ queryKey: ["view-faculty"] });
    },
  });
};

export const useDeleteFaculty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (facultyId: string) => {
      return facultyService.deleteFaculty(facultyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-faculty"] });
      queryClient.invalidateQueries({ queryKey: ["all-faculties"] });
    },
  });
};

export const useFacultiesForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["faculties-dropdown", apiParams],
    queryFn: async () => {
      facultyService.resetQuery();
      return facultyService
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
        .searchFaculty();
    },
  });
};

export const useInfiniteFacultiesForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  const limit = apiParams?.limit || 10;

  return useInfiniteQuery({
    queryKey: ["infinite-faculties-dropdown", apiParams],
    queryFn: async ({ pageParam = 0 }) => {
      const skip = pageParam;

      facultyService.resetQuery();
      const result = await facultyService
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
        .searchFaculty();

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

export const useGenerateCode = () => {
  return useMutation({
    mutationFn: (data: object) => {
      return facultyService.generateCode(data);
    },
  });
};
