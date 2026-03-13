import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import programService from "../services/programApi";
import { ApiParams } from "../types/interfaces";

export const useGetAllPrograms = (apiParams?: Partial<ApiParams>) => {
  return useQuery({
    queryKey: ["all-programs", apiParams],
    queryFn: () =>
      programService
        .select([
          "name",
          "code",
          "description",
          "organizationId",
          "createdAt",
          "updatedAt",
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .withPagination(true)
        .withDocument(true)
        .getAllPrograms(),
  });
};

export const usePrograms = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["search-program", apiParams],
    queryFn: async () => {
      programService.resetQuery();
      return programService
        .select([
          "name",
          "code",
          "description",
          "organizationId",
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
        .searchProgram();
    },
  });
};

export const useGetProgramById = (programId: string) => {
  return useQuery({
    queryKey: ["program", programId],
    queryFn: () =>
      programService
        .select([
          "name",
          "code",
          "description",
          "organizationId",
          "createdAt",
          "updatedAt",
        ])
        .getProgramById(programId),
    enabled: !!programId,
  });
};

export const useViewProgramById = (programId: string) => {
  return useQuery({
    queryKey: ["view-program", programId],
    queryFn: () =>
      programService
        .select([
          "name",
          "code",
          "description",
          "organizationId",
          "createdAt",
          "updatedAt",
        ])
        .getProgramById(programId),
    enabled: !!programId,
  });
};

export const useCreateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: programService.createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-program"] });
      queryClient.invalidateQueries({ queryKey: ["all-programs"] });
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: programService.updateProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-program"] });
      queryClient.invalidateQueries({ queryKey: ["all-programs"] });
      queryClient.invalidateQueries({ queryKey: ["program"] });
      queryClient.invalidateQueries({ queryKey: ["view-program"] });
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: programService.deleteProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-program"] });
      queryClient.invalidateQueries({ queryKey: ["all-programs"] });
    },
  });
};

export const useProgramsForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["programs-dropdown", apiParams],
    queryFn: async () => {
      programService.resetQuery();
      return programService
        .select(["_id", "name", "code"])
        .limit(10)
        .sort("name")
        .where({
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
        .searchProgram();
    },
  });
};

export const useInfiniteProgramsForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  const limit = apiParams?.limit || 10;

  return useInfiniteQuery({
    queryKey: ["infinite-programs-dropdown", apiParams],
    queryFn: async ({ pageParam = 0 }) => {
      const skip = pageParam;

      programService.resetQuery();
      const result = await programService
        .select(["_id", "name", "code"])
        .limit(limit)
        .skip(skip)
        .where({
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
        .searchProgram();

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
