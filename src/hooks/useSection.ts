import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { ApiParams } from "../types/params";
import sectionService from "../services/sectionApi";

type SectionApiParams = Partial<ApiParams> & {
  filters?: Array<{ key: string; value: string }>;
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      sectionService.resetQuery();
      return sectionService.createSection(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-sections"] });
    },
  });
};

export const useGetSectionById = (sectionId: string) => {
  return useQuery({
    queryKey: ["section-by-id", sectionId],
    queryFn: async () => {
      sectionService.resetQuery();
      return sectionService
        .select([
          "name",
          "code",
          "course",
          "instructor",
          "schedule",
          "status",
          "createdAt",
          "updatedAt",
        ])
        .populate([
          {
            path: "course",
            select: "_id title",
          },
          {
            path: "instructor",
            select: "_id firstName lastName",
          },
        ])
        .getSectionById(sectionId);
    },
    enabled: !!sectionId,
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      sectionService.resetQuery();
      return sectionService.updateSection(data);
    },
    onSuccess: () => {
      // Invalidate the specific section queries
      queryClient.invalidateQueries({ queryKey: ["section-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["search-section-by-code"] });

      // Invalidate list views that would show the updated section
      queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-sections"] });
      queryClient.invalidateQueries({ queryKey: ["student-sections"] });
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionCode: string) => {
      sectionService.resetQuery();
      return sectionService.deleteSection(sectionCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-sections"] });
    },
  });
};

export const useAdminSections = (apiParams?: SectionApiParams) => {
  return useQuery({
    queryKey: ["admin-sections", apiParams],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      sectionService.resetQuery();
      return sectionService
        .select(["code", "name", "totalStudent", "status"])
        .populate([
          {
            path: "instructor",
            select: "firstName lastName",
          },
          {
            path: "course",
            select: "title",
          },
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where({
          ...((apiParams?.filters || []).reduce((acc, filter) => {
            acc[filter.key] = filter.value;
            return acc;
          }, {} as Record<string, string>)),
          ...(apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}),
        })
        .search(["code", "title", "name"], apiParams?.searchTerm || "")
        .withArchive(apiParams?.archiveStatus || "none")
        .withPagination(true)
        .withDocument(true)
        .searchSections();
    },
  });
};

export const useInstructorSections = (
  apiParams?: Partial<ApiParams> & { instructorId: string },
) => {
  return useQuery({
    queryKey: ["instructor-sections", apiParams],
    queryFn: async () => {
      sectionService.resetQuery();
      return sectionService
        .select(["code", "name", "status", "createdAt", "updatedAt"])
        .populate([
          {
            path: "course",
            select: "_id title thumbnail description",
          },
          {
            path: "modules",
            select: "_id lessons",
            populate: {
              path: "lessons",
              select: "_id",
            },
          },
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where({
          ...(apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}),
          ...(apiParams?.instructorId
            ? { instructor: apiParams.instructorId }
            : {}),
        })
        .search(["code", "title", "name"], apiParams?.searchTerm || "")
        .match({})
        .withPagination(true)
        .withDocument(true)
        .searchSections();
    },
  });
};

export const useInfiniteInstructorSections = (
  apiParams?: Partial<ApiParams> & { instructorId: string },
) => {
  const limit = apiParams?.limit || 8;

  return useInfiniteQuery({
    queryKey: ["infinite-instructor-sections", apiParams],
    queryFn: async ({ pageParam = 0 }) => {
      const skip = pageParam;

      sectionService.resetQuery();
      const result = await sectionService
        .select(["code", "name", "status", "createdAt", "updatedAt"])
        .populate([
          {
            path: "course",
            select: "thumbnail",
          },
        ])
        .limit(limit)
        .skip(skip)
        .where({
          ...(apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}),
          ...(apiParams?.instructorId
            ? { instructor: apiParams.instructorId }
            : {}),
        })
        .search(["code", "title", "name"], apiParams?.searchTerm || "")
        .match({})
        .withPagination(true)
        .withDocument(true)
        .searchSections();

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

export const useStudentSections = (
  apiParams?: Partial<ApiParams> & { studentId: string },
) => {
  return useQuery({
    queryKey: ["student-sections", apiParams],
    queryFn: async () => {
      sectionService.resetQuery();
      return sectionService
        .select(["code", "title", "name", "status"])
        .populate([
          {
            path: "course",
            select: "thumbnail title description",
          },
          {
            path: "instructor",
            select: "firstName lastName",
          },
            {
              path: "modules",
              select: "_id lessons",
              populate: {
                path: "lessons",
                select: "_id progress status",
              },
            },
          {
            path: "assessments",
            select: "_id",
          },
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where({
          ...(apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}),
          ...(apiParams?.studentId ? { students: apiParams.studentId } : {}),
        })
        .search(["code", "title", "name"], apiParams?.searchTerm || "")
        .withPagination(true)
        .withDocument(true)
        .searchSections();
    },
  });
};

export const useInfiniteStudentSections = (
  apiParams?: Partial<ApiParams> & { studentId: string },
) => {
  const limit = apiParams?.limit || 8;

  return useInfiniteQuery({
    queryKey: ["infinite-student-sections", apiParams],
    queryFn: async ({ pageParam = 0 }) => {
      const skip = pageParam;

      sectionService.resetQuery();
      const result = await sectionService
        .select(["code", "title", "name", "status"])
        .populate([
          {
            path: "course",
            select: "thumbnail",
          },
          {
            path: "instructor",
            select: "firstName lastName",
          },
          {
            path: "modules",
            select: "_id lessons",
            populate: {
              path: "lessons",
              select: "_id progress",
            },
          },
          {
            path: "assessments",
            select: "_id",
          },
        ])
        .limit(limit)
        .skip(skip)
        .where({
          ...(apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}),
          ...(apiParams?.studentId ? { students: apiParams.studentId } : {}),
        })
        .search(["code", "title", "name"], apiParams?.searchTerm || "")
        .withPagination(true)
        .withDocument(true)
        .searchSections();

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

export const useSectionByCode = (
  apiParams?: Partial<ApiParams> & { sectionCode: string },
) => {
  return useQuery({
    queryKey: ["section-by-code", apiParams],
    queryFn: async () => {
      sectionService.resetQuery();
      return sectionService
        .select(["code", "title", "name", "schedule", "totalStudent"])
        .populate([
          {
            path: "course",
            select: "title code description thumbnail",
          },
          {
            path: "instructor",
            select: "firstName lastName avatar",
            populate: {
              path: "faculty",
              select: "name",
            },
          },
        ])

        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where({
          ...(apiParams?.sectionCode ? { code: apiParams.sectionCode } : {}),
        })
        .search(["code", "title", "name"], apiParams?.searchTerm || "")
        .withDocument(true)
        .searchSections();
    },
  });
};

export const useBulkStudentAdd = (sectionCode: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) =>
      await sectionService.bulkImportStudents(sectionCode, data),
    onSuccess: () => {
      // Invalidate all section-related queries
      queryClient.invalidateQueries({ queryKey: ["section-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["search-section-by-code"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
    },
  });
};

export const useStudentGrades = (sectionCode: string) => {
  return useQuery({
    queryKey: ["student-grades", sectionCode],
    queryFn: () => sectionService.getStudentGrades(sectionCode),
    enabled: !!sectionCode,
  });
};

export const useSectionAnalytics = (sectionCode: string) => {
  return useQuery({
    queryKey: ["section-analytics", sectionCode],
    queryFn: () => sectionService.getSectionAnalytics(sectionCode),
    enabled: !!sectionCode,
  });
};

export interface InfiniteSectionParams extends Partial<ApiParams> {
  sectionCode: string;
  activeTab: string;
  nestedLimit?: number; // Limit for nested objects (modules, announcements, assessments)
  nestedSkip?: number; // Skip for nested objects
}

export const useExportSectionToCsv = () => {
  return useMutation({
    mutationFn: async (apiParams?: SectionApiParams) => {
      sectionService.resetQuery();
      return sectionService
        .select(["code", "name", "totalStudent", "status"])
        .populate([
          { path: "instructor", select: "firstName lastName" },
          { path: "course", select: "title" },
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where({
          ...((apiParams?.filters || []).reduce((acc, filter) => {
            acc[filter.key] = filter.value;
            return acc;
          }, {} as Record<string, string>)),
          ...(apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}),
        })
        .exportSection();
    },
  });
};

export const useAdminCompletionOverview = (organizationId?: string) => {
  return useQuery({
    queryKey: ["admin-completion-overview", organizationId],
    queryFn: async () => {
      sectionService.resetQuery();
      return sectionService
        .select(["_id", "code", "name", "status", "instructor", "students", "modules"])
        .populate([
          {
            path: "instructor",
            select: "_id firstName lastName",
          },
          {
            path: "students",
            select: "_id firstName lastName email",
          },
          {
            path: "modules",
            select: "_id title lessons",
            populate: {
              path: "lessons",
              select: "_id title progress",
            },
          },
        ])
        .where(organizationId ? { organizationId } : {})
        .limit(200)
        .skip(0)
        .withArchive("none")
        .withDocument(true)
        .searchSections();
    },
    enabled: !!organizationId,
  });
};

export const useRemoveStudentInSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sectionCode: string; studentId: string }) => {
      return sectionService.removeStudentInSection(
        data.sectionCode,
        data.studentId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["section-student"] });
    },
  });
};

export const useAddStudentsToSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sectionCode: string; studentIds: string[] }) => {
      return sectionService.addStudentsToSection(
        data.sectionCode,
        data.studentIds,
      );
    },
    onSuccess: () => {
      // Invalidate all section-related queries
      queryClient.invalidateQueries({ queryKey: ["section-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
      queryClient.invalidateQueries({ queryKey: ["section-student"] });
    },
  });
};

export const useGenerateCode = () => {
  return useMutation({
    mutationFn: (data: object) => {
      return sectionService.generateCode(data);
    },
  });
};

export const useSearchSectionByCode = (sectionCode: string) => {
  return useQuery({
    queryKey: ["search-section-by-code", sectionCode],
    queryFn: async () => {
      sectionService.resetQuery();
      const result = await sectionService
        .select([
          "code",
          "course",
          "title",
          "name",
          "schedule",
          "status",
          "totalStudent",
          "instructor",
          "organizationId",
          "createdAt",
          "updatedAt",
        ])
        .populate([
          {
            path: "course",
            select: "thumbnail",
          },
          {
            path: "instructor",
            select: "firstName lastName email faculty avatar",
            populate: {
              path: "faculty",
              select: "name",
            },
          },
        ])
        .where({ code: sectionCode })
        .limit(1)
        .withDocument(true)
        .searchSections();

      // Return the first section from the results
      return { data: result.sections[0] };
    },
    enabled: !!sectionCode,
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      sectionService.resetQuery();
      return sectionService.updateAttendance(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-attendance"] });
    },
  });
};

export const useSectionModule = (sectionCode: string) => {
  return useQuery({
    queryKey: ["section-module", sectionCode],
    queryFn: () => {
      sectionService.resetQuery();
      return sectionService
        .sort("createdAt")
        .limit(100)
        .getSectionModule(sectionCode);
    },
    enabled: !!sectionCode,
  });
};

export const useSectionAnnouncement = (sectionCode: string) => {
  return useQuery({
    queryKey: ["section-announcement", sectionCode],
    queryFn: () => {
      sectionService.resetQuery();
      return sectionService
        .sort("createdAt")
        .withDocument(true)
        .limit(100)
        .getSectionAnnouncement(sectionCode);
    },
    enabled: !!sectionCode,
  });
};

export const useSectionAssessment = (sectionCode: string) => {
  return useQuery({
    queryKey: ["section-assessment", sectionCode],
    queryFn: () => {
      sectionService.resetQuery();
      return sectionService
        .sort("createdAt")
        .withDocument(true)
        .limit(100)
        .getSectionAssessment(sectionCode);
    },
    enabled: !!sectionCode,
  });
};

export const useSectionStudent = (
  apiParams?: Partial<ApiParams> & {
    sectionCode?: string;
    withPagination?: boolean;
  },
) => {
  return useQuery({
    queryKey: ["section-student", apiParams],
    queryFn: () => {
      sectionService.resetQuery();
      return sectionService
        .sort("createdAt")
        .limit(apiParams?.limit || 1000)
        .skip(apiParams?.skip || 0)
        .withArchive(apiParams?.archiveStatus || "include")
        .withDocument(true)
        .withPagination(!!apiParams?.withPagination)
        .getSectionStudent(apiParams?.sectionCode as string);
    },
    enabled: !!apiParams?.sectionCode,
  });
};

export const useSectionGradeSystem = (sectionCode: string) => {
  return useQuery({
    queryKey: ["section-grade-system", sectionCode],
    queryFn: () => {
      sectionService.resetQuery();
      return sectionService
        .sort("createdAt")
        .withDocument(true)
        .getSectionGradeSystem(sectionCode);
    },
    enabled: !!sectionCode,
  });
};

export const useExportStudentGrades = () => {
  return useMutation({
    mutationFn: async (sectionCode: string) => {
      sectionService.resetQuery();
      return sectionService.exportStudentGrades(sectionCode);
    },
  });
};

export const useExportSectionStudent = () => {
  return useMutation({
    mutationFn: async (sectionCode: string) => {
      sectionService.resetQuery();
      return sectionService.exportSectionStudent(sectionCode);
    },
  });
};

export const useSchedule = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ["schedule", startDate, endDate],
    queryFn: () => {
      sectionService.resetQuery();
      return sectionService.getSchedule(startDate, endDate);
    },
    enabled: !!startDate && !!endDate,
  });
};
