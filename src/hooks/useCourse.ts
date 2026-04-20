import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import courseService from "../services/courseApi";
import { ApiParams } from "../types/interfaces";

export const useGetCourseById = (courseId: string) => {
  return useQuery({
    queryKey: ["course-by-id", courseId],
    queryFn: async () => {
      courseService.resetQuery();
      courseService.select([
        "title",
        "description",
        "organizationId",
        "category",
        "level",
        "status",
        "thumbnail",
        "language",
        "createdAt",
        "updatedAt",
        "code",
      ]);

      return courseService.getCourseById(courseId);
    },
    enabled: !!courseId,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      courseService.resetQuery();
      return courseService.createCourse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-course"] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      courseService.resetQuery();
      return courseService.updateCourse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-course"] });
      queryClient.invalidateQueries({ queryKey: ["course-by-id"] });
    },
  });
};

export const useGetAllCourses = (apiParams?: Partial<ApiParams>) => {
  return useQuery({
    queryKey: ["all-courses", apiParams],
    queryFn: () =>
      courseService
        .select(["code", "title", "description", "category", "level", "status"])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .withPagination(true)
        .withDocument(true)
        .getAllCourses(),
  });
};

export const useCourses = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["search-course", apiParams],
    queryFn: async () => {
      courseService.resetQuery();
      return courseService
        .select(["code", "title", "description", "level", "status"])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where({
          ...(apiParams?.filters
            ? apiParams.filters.reduce((acc, filter) => {
                acc[filter.key] = filter.value;
                return acc;
              }, {} as Record<string, string>)
            : {}),
          ...(apiParams?.organizationId
            ? { organizationId: apiParams.organizationId }
            : {}),
        })
        .search(["code", "title", "description"], apiParams?.searchTerm || "")
        .populate([
          {
            path: "category",
            select: "name",
          },
        ])
        .withPagination(true)
        .withDocument(true)
        .withArchive(apiParams?.archiveStatus || "none")
        .searchCourse();
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => courseService.deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-course"] });
    },
  });
};

export const useCourseArchiveImpact = (
  courseId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["course-archive-impact", courseId],
    queryFn: () => courseService.getCourseArchiveImpact(courseId),
    enabled: Boolean(courseId) && (options?.enabled ?? true),
  });
};

export const useArchiveCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      courseId: string;
      confirm?: boolean;
      cascade?: boolean;
    }) =>
      courseService.archiveCourse(params.courseId, {
        confirm: params.confirm,
        cascade: params.cascade,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-course"] });
      queryClient.invalidateQueries({ queryKey: ["course-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["course-archive-impact"] });
    },
  });
};

export const useExportCourseToCsv = () => {
  return useMutation({
    mutationFn: async (apiParams?: Partial<ApiParams>) => {
      courseService.resetQuery();
      return courseService
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .select([
          "_id",
          "title",
          "description",
          "category",
          "level",
          "code",
          "status",
        ])
        .where({
          ...(apiParams?.filter
            ? { [apiParams.filter.key]: apiParams.filter.value }
            : {}),
        })
        .populate([
          {
            path: "category",
            select: "name",
          },
        ])
        .exportCourse();
    },
  });
};

export const useCoursesForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["courses-dropdown", apiParams],
    queryFn: async () => {
      courseService.resetQuery();
      return courseService
        .select(["_id", "code", "title"])
        .limit(5)
        .sort("title")
        .where({
          ...(apiParams?.filters
            ? apiParams.filters.reduce((acc, filter) => {
                acc[filter.key] = filter.value;
                return acc;
              }, {} as Record<string, string>)
            : {}),
          ...(apiParams?.organizationId
            ? { organizationId: apiParams.organizationId }
            : {}),
        })
        .search(["code", "title"], apiParams?.searchTerm || "")
        .withDocument(true)
        .withPagination(false)
        .withArchive("none")
        .searchCourse();
    },
  });
};

export const useInfiniteCoursesForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  const limit = apiParams?.limit || 10;

  return useInfiniteQuery({
    queryKey: ["infinite-courses-dropdown", apiParams],
    queryFn: async ({ pageParam = 0 }) => {
      const skip = pageParam;

      courseService.resetQuery();
      const result = await courseService
        .select(["_id", "code", "title"])
        .limit(limit)
        .skip(skip)
        .sort("title")
        .where({
          ...(apiParams?.filters
            ? apiParams.filters.reduce((acc, filter) => {
                acc[filter.key] = filter.value;
                return acc;
              }, {} as Record<string, string>)
            : {}),
          ...(apiParams?.organizationId
            ? { organizationId: apiParams.organizationId }
            : {}),
        })
        .search(["code", "title"], apiParams?.searchTerm || "")
        .withDocument(true)
        .withPagination(true)
        .withArchive("none")
        .searchCourse();

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

export const useViewCourseById = (courseId: string) => {
  return useQuery({
    queryKey: ["view-course-by-id", courseId],
    queryFn: async () => {
      courseService.resetQuery();
      courseService
        .select([
          "title",
          "description",
          "organizationId",
          "level",
          "language",
          "timezone",
          "code",
          "thumbnail",
          "status",
          "isPublished",
          "createdAt",
          "updatedAt",
        ])
        .populate([
          {
            path: "category",
            select: "name",
          },
        ]);

      return courseService.getCourseById(courseId);
    },
  });
};
