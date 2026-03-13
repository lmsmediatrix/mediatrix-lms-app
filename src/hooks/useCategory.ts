import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import categoryService from "../services/categoryApi";
import { ApiParams } from "../types/interfaces";

export const useCategories = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["search-category", apiParams],
    queryFn: async () => {
      categoryService.resetQuery();
      return categoryService
        .select([
          "name",
          "isActive",
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
        .search(["name"], apiParams?.searchTerm || "")
        .withPagination(true)
        .withDocument(true)
        .withArchive(apiParams?.archiveStatus || "none")
        .searchCategory();
    },
  });
};

export const useGetCategoryById = (categoryId: string) => {
  return useQuery({
    queryKey: ["category", categoryId],
    queryFn: () => categoryService.getCategoryById(categoryId),
    enabled: !!categoryId,
  });
};

export const useViewCategoryById = (categoryId: string) => {
  return useQuery({
    queryKey: ["view-category", categoryId],
    queryFn: () =>
      categoryService
        .select([
          "name",
          "isActive",
          "organizationId",
          "createdAt",
          "updatedAt",
        ])
        .getCategoryById(categoryId),
    enabled: !!categoryId,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-category"] });
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryService.updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-category"] });
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      queryClient.invalidateQueries({ queryKey: ["category"] });
      queryClient.invalidateQueries({ queryKey: ["view-category"] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-category"] });
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
    },
  });
};

export const useCategoriesForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["categories-dropdown", apiParams],
    queryFn: async () => {
      categoryService.resetQuery();
      return categoryService
        .select(["_id", "name"])
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
        .search(["name"], apiParams?.searchTerm || "")
        .withDocument(true)
        .withPagination(false)
        .withArchive("none")
        .searchCategory();
    },
  });
};

export const useInfiniteCategoriesForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  const limit = apiParams?.limit || 10;

  return useInfiniteQuery({
    queryKey: ["infinite-categories-dropdown", apiParams],
    queryFn: async ({ pageParam = 0 }) => {
      const skip = pageParam;

      categoryService.resetQuery();
      const result = await categoryService
        .select(["_id", "name"])
        .limit(limit)
        .skip(skip)
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
        .search(["name"], apiParams?.searchTerm || "")
        .withDocument(true)
        .withPagination(true)
        .withArchive("none")
        .searchCategory();

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
