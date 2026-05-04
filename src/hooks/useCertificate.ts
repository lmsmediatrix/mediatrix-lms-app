import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import certificateService from "../services/certificateApi";

export const useGenerateCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      studentId: string;
      moduleId?: string;
      lessonId?: string;
      scopeId?: string;
      scopeType?: "module" | "lesson";
      sectionId?: string;
    }) =>
      certificateService.generateCertificate(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["student-certificates", variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "certificate-visibility",
          variables.studentId,
          variables.scopeType || (variables.lessonId ? "lesson" : "module"),
          variables.scopeId || variables.lessonId || variables.moduleId,
        ],
      });
      queryClient.invalidateQueries({ queryKey: ["student-section-by-code"] });
      queryClient.invalidateQueries({ queryKey: ["section-module"] });
    },
  });
};

export const useStudentCertificates = (
  studentId: string,
  options?: {
    moduleId?: string;
    sectionId?: string;
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: ["student-certificates", studentId, options?.moduleId, options?.sectionId],
    queryFn: () =>
      certificateService.getCertificatesByStudent(studentId, {
        ...(options?.moduleId ? { moduleId: options.moduleId } : {}),
        ...(options?.sectionId ? { sectionId: options.sectionId } : {}),
        document: true,
        count: true,
      }),
    enabled: !!studentId && (options?.enabled ?? true),
  });
};

export const useCertificateVisibility = (
  studentId: string,
  options?: {
    moduleId?: string;
    lessonId?: string;
    scopeId?: string;
    scopeType?: "module" | "lesson";
    enabled?: boolean;
  }
) => {
  const resolvedScopeType = options?.scopeType || (options?.lessonId ? "lesson" : "module");
  const resolvedScopeId = options?.scopeId || options?.lessonId || options?.moduleId;

  return useQuery({
    queryKey: ["certificate-visibility", studentId, resolvedScopeType, resolvedScopeId],
    queryFn: () =>
      certificateService.getCertificateVisibility(studentId, {
        scopeType: resolvedScopeType,
        scopeId: options?.scopeId,
        moduleId: options?.moduleId,
        lessonId: options?.lessonId,
      }),
    enabled: !!studentId && !!resolvedScopeId && (options?.enabled ?? true),
  });
};
