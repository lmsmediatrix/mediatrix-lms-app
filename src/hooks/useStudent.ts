import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import studentService from "../services/studentApi";
import sectionService from "../services/sectionApi";
import { TActiveView, ApiParams } from "../types/interfaces";

export const useGetCalendar = (view: TActiveView) => {
  return useQuery({
    queryKey: ["calendar", view],
    queryFn: () => studentService.getCalendar(view),
  });
};

export const useSubmitAttendance = () => {
  return useMutation({
    mutationFn: (sectionId: object) => {
      return sectionService.submitAttendance(sectionId);
    },
  });
};

export const useBulkImportStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return studentService.bulkImport(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["search-students"] });
    },
  });
};

export const useGetStudentProfile = (
  studentId: string,
  options?: { includeArchived?: boolean }
) => {
  return useQuery({
    queryKey: ["student-profile", studentId, options?.includeArchived],
    queryFn: async () => {
      studentService.resetQuery();
      const query = studentService
        .select([
          "role",
          "studentId",
          "subrole",
          "directTo",
          "program",
          "person",
          "firstName",
          "lastName",
          "email",
          "avatar",
          "status",
          "archive",
          "gpa",
          "lastLogin",
          "updatedAt",
          "createdAt",
          "socialLinks",
          "yearLevel",
        ])
        .populate([
          {
            path: "program",
            select: "name",
          },
          {
            path: "person.department",
            select: "name",
          },
          {
            path: "directTo",
            select: "firstName lastName subrole",
          },
        ]);

      if (options?.includeArchived) {
        query.withArchive("include");
      }

      return query.getStudentById(studentId);
    },
    enabled: !!studentId,
  });
};

export const useGetStudentById = (studentId: string) => {
  return useQuery({
    queryKey: ["student-by-id", studentId],
    queryFn: async () => {
      studentService.resetQuery();
      return studentService
        .select([
          "studentId",
          "subrole",
          "directTo",
          "program",
          "firstName",
          "lastName",
          "email",
          "avatar",
          "status",
          "gpa",
          "updatedAt",
          "createdAt",
        ])
        .populate([
          {
            path: "program",
            select: "name",
          },
        ])
        .getStudentById(studentId);
    },
    enabled: !!studentId,
  });
};

export const useStudentArchiveImpact = (
  studentId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["student-archive-impact", studentId],
    queryFn: () => studentService.getStudentArchiveImpact(studentId),
    enabled: Boolean(studentId) && (options?.enabled ?? true),
  });
};

export const useSearchStudents = (
  apiParams?: Partial<ApiParams> & { organizationId?: string; enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["search-students", apiParams],
    placeholderData: keepPreviousData,
    enabled: apiParams?.enabled ?? true,
    queryFn: async () => {
      studentService.resetQuery();
      return studentService
        .select([
          "avatar",
          "firstName",
          "lastName",
          "email",
          "role",
          "studentId",
          "subrole",
          "person",
          "directTo",
          "status",
          "program",
          "createdAt",
          "updatedAt",
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where({
          ...(apiParams?.filters
            ? apiParams.filters.reduce((acc, filter) => {
                acc[filter.key] = filter.value;
                return acc;
              }, {} as Record<string, string>)
            : {}),
          ...(apiParams?.filter
            ? { [apiParams.filter.key]: apiParams.filter.value }
            : {}),
          ...(apiParams?.organizationId
            ? { organizationId: apiParams.organizationId }
            : {}),
        })
        .search(
          ["firstName", "lastName", "email", "studentId"],
          apiParams?.searchTerm || ""
        )
        .populate([
          {
            path: "program",
            select: "code",
          },
          {
            path: "person.department",
            select: "name",
          },
          {
            path: "directTo",
            select: "firstName lastName subrole",
          },
        ])
        .withPagination(true)
        .withDocument(true)
        .withArchive(apiParams?.archiveStatus || "include")
        .searchStudents();
    },
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      studentService.resetQuery();
      return studentService.createStudent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["search-students"] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      studentService.resetQuery();
      return studentService.updateStudent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["search-students"] });
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => {
      studentService.resetQuery();
      return studentService.deleteStudent(studentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["search-students"] });
    },
  });
};

export const useGetStudentCalendar = (view: TActiveView) => {
  return useQuery({
    queryKey: ["student-calendar", view],
    queryFn: () => studentService.getCalendar(view),
  });
};

export const useGetStudentGradeBySection = (sectionCode: string) => {
  return useQuery({
    queryKey: ["student-grade", sectionCode],
    queryFn: () => studentService.getStudentGradeBySection(sectionCode),
  });
};

export const useGetStudentDetails = (studentId: string) => {
  return useQuery({
    queryKey: ["student-details", studentId],
    queryFn: async () => {
      studentService.resetQuery();
      return studentService
        .select([
          "avatar",
          "studentId",
          "firstName",
          "lastName",
          "email",
          "socialLinks",
          "lastLogin",
          "yearLevel"
        ])
        .getStudentDetails(studentId);
    },
    enabled: !!studentId,
  });
};

export const useExportStudentToCsv = () => {
  return useMutation({
    mutationFn: async (apiParams?: Partial<ApiParams>) => {
      studentService.resetQuery();
      return studentService
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .select(["studentId program firstName lastName email status createdAt"])
        .where({
          ...(apiParams?.filters
            ? apiParams.filters.reduce((acc, filter) => {
                acc[filter.key] = filter.value;
                return acc;
              }, {} as Record<string, string>)
            : {}),
          ...(apiParams?.filter
            ? { [apiParams.filter.key]: apiParams.filter.value }
            : {}),
        })
        .populate([
          {
            path: "program",
            select: "name",
          },
        ])
        .exportStudent();
    },
  });
};

export const useExportStudentGrades = () => {
  return useMutation({
    mutationFn: async (sectionCode: string) => {
      sectionService.resetQuery();
      return studentService.exportStudentGrades(sectionCode);
    },
  });
};
