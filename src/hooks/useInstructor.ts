import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import instructorService from "../services/instructorApi";
import sectionService from "../services/sectionApi";
import gradeService from "../services/gradesApi";
import studentService from "../services/studentApi";
import { ApiParams } from "../types/params";

export const useCreateGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return gradeService.createGrade(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-by-code"] });
    },
  });
};

export const useUpdateGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return gradeService.updateGrade(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-by-code"] });
    },
  });
};

export const useDeleteGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) =>
      gradeService.deleteGrade(assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-by-code"] });
    },
  });
};

export const useGetSectionAttendance = (
  sectionCode: string,
  date: { from: string; to: string }
) => {
  return useQuery({
    queryKey: ["section-attendance", sectionCode, date],
    queryFn: () => sectionService.getSectionAttendance(sectionCode, date),
    enabled: !!sectionCode || !!date,
  });
};

export const useGetStudentGradeBySection = (sectionCode: string) => {
  return useQuery({
    queryKey: ["section-grades", sectionCode],
    queryFn: () => studentService.getStudentGradeBySection(sectionCode),
    enabled: !!sectionCode,
  });
};

export const useGetInstructorById = (instructorId: string) => {
  return useQuery({
    queryKey: ["instructor-by-id", instructorId],
    queryFn: async () => {
      instructorService.resetQuery();
      return instructorService
        .select([
          "firstName",
          "lastName",
          "avatar",
          "email",
          "faculty",
          "employmentType",
          "bio",
          "expertise",
          "qualifications",
          "socialLinks",
          "experienceYears",
          "isVerified",
          "faculty",
          "createdAt",
          "updatedAt",
        ])
        .populate([
          {
            path: "faculty",
            select: "name",
          },
        ])
        .getInstructorById(instructorId);
    },
    enabled: !!instructorId,
  });
};

export const useSearchInstructors = (
  apiParams?: Partial<ApiParams> & {
    organizationId?: string;
    archiveStatus?: "only" | "none";
  }
) => {
  return useQuery({
    queryKey: ["search-instructors", apiParams],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      instructorService.resetQuery();
      return instructorService
        .select([
          "avatar",
          "firstName",
          "lastName",
          "email",
          "faculty",
          "employmentType",
          "createdAt",
          "updatedAt",
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where({
          ...(apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}),
          ...(apiParams?.organizationId
            ? { organizationId: apiParams.organizationId }
            : {}),
        })
        .search(["firstName", "lastName", "email"], apiParams?.searchTerm || "")
        .populate([
          {
            path: "faculty",
            select: "name",
          },
        ])
        .withPagination(true)
        .withDocument(true)
        .withArchive(apiParams?.archiveStatus || "none")
        .searchTeachers();
    },
  });
};

export const useCreateInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      instructorService.resetQuery();
      return instructorService.createInstructor(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-instructors"] });
      queryClient.invalidateQueries({ queryKey: ["user-metrics"] });
    },
  });
};

export const useUpdateInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      instructorService.resetQuery();
      return instructorService.updateInstructor(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-instructors"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["user-metrics"] });
    },
  });
};

export const useDeleteInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (instructorId: string) => {
      instructorService.resetQuery();
      return instructorService.deleteInstructor(instructorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-instructors"] });
      queryClient.invalidateQueries({ queryKey: ["search-instructors"] });
    },
  });
};

export const useBulkImportInstructor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      instructorService.resetQuery();
      return instructorService.bulkImport(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-instructors"] });
      queryClient.invalidateQueries({ queryKey: ["search-instructors"] });
    },
  });
};

export const useExportInstructorToCsv = () => {
  return useMutation({
    mutationFn: async (apiParams?: Partial<ApiParams>) => {
      instructorService.resetQuery();
      return instructorService
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .select(["firstName", "lastName", "email", "faculty", "employmentType"])
        .where({
          ...(apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}),
        })
        .populate([
          {
            path: "faculty",
            select: "name",
          },
        ])
        .exportInstructor();
    },
  });
};

export const useInstructorsForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  return useQuery({
    queryKey: ["instructors-dropdown", apiParams],
    queryFn: async () => {
      instructorService.resetQuery();
      return instructorService
        .select(["_id", "firstName", "lastName", "email", "faculty"])
        .limit(5) // Increased limit to ensure we get more instructors
        .skip(0)
        .sort("firstName")
        .where({
          ...(apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}),
          ...(apiParams?.organizationId
            ? { organizationId: apiParams.organizationId }
            : {}),
          role: "instructor",
        })
        .search(["firstName", "lastName", "email"], apiParams?.searchTerm || "")
        .populate([
          {
            path: "faculty",
            select: "name",
          },
        ])
        .withDocument(true)
        .withPagination(false)
        .withArchive("none")
        .searchTeachers();
    },
  });
};

export const useInfiniteInstructorsForDropdown = (
  apiParams?: Partial<ApiParams> & { organizationId?: string }
) => {
  const limit = apiParams?.limit || 10;

  return useInfiniteQuery({
    queryKey: ["infinite-instructors-dropdown", apiParams],
    queryFn: async ({ pageParam = 0 }) => {
      const skip = pageParam;

      instructorService.resetQuery();
      const result = await instructorService
        .select(["_id", "firstName", "lastName", "email", "faculty"])
        .limit(limit)
        .skip(skip)
        .sort("firstName")
        .where({
          ...(apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}),
          ...(apiParams?.organizationId
            ? { organizationId: apiParams.organizationId }
            : {}),
          role: "instructor",
        })
        .search(["firstName", "lastName", "email"], apiParams?.searchTerm || "")
        .populate([
          {
            path: "faculty",
            select: "name",
          },
        ])
        .withDocument(true)
        .withPagination(true)
        .withArchive("none")
        .searchTeachers();

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
