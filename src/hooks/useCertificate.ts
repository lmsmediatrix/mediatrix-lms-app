import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import certificateService from "../services/certificateApi";

export const useGenerateCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { studentId: string; moduleId: string; sectionId?: string }) =>
      certificateService.generateCertificate(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["student-certificates", variables.studentId],
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
