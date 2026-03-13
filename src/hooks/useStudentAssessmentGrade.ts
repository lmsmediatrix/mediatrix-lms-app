import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import studentAssessmentGradeService from "../services/studentAssessmentGradeApi";
import studentService from "../services/studentApi";

export const useStudentCompletedAssessments = (studentId: string) => {
  return useQuery({
    queryKey: ["student-completed-assessments", studentId],
    queryFn: async () => {
      studentService.resetQuery();
      const result = await studentService
        .select(["studentAssessmentResults"])
        .getStudentById(studentId);
      const student = result?.data || result;
      const results = student?.studentAssessmentResults || [];
      return new Set(
        results
          .filter((r: any) => r.isFinished)
          .map((r: any) => r.assessmentId?.toString()),
      );
    },
    enabled: !!studentId,
  });
};

export const useGetStudentAssessmentGrades = (params?: {
  assessmentId?: string;
  studentId?: string;
  sectionId?: string;
}) => {
  return useQuery({
    queryKey: ["student-assessment-grades", params],
    queryFn: async () => {
      studentAssessmentGradeService.resetQuery();
      return studentAssessmentGradeService.getAllStudentAssessmentGrades();
    },
  });
};

export const useGetStudentAssessmentGradeById = (id: string) => {
  return useQuery({
    queryKey: ["student-assessment-grade-by-id", id],
    queryFn: async () => {
      studentAssessmentGradeService.resetQuery();
      return studentAssessmentGradeService.getStudentAssessmentGradeById(id);
    },
    enabled: !!id,
  });
};

export const useGetGradesByAssessment = (assessmentId: string) => {
  return useQuery({
    queryKey: ["grades-by-assessment", assessmentId],
    queryFn: async () => {
      studentAssessmentGradeService.resetQuery();
      return studentAssessmentGradeService.getGradesByAssessment(assessmentId);
    },
    enabled: !!assessmentId,
  });
};

export const useGetGradesByStudentSection = (
  studentId: string,
  sectionId: string,
) => {
  return useQuery({
    queryKey: ["grades-by-student-section", studentId, sectionId],
    queryFn: async () => {
      studentAssessmentGradeService.resetQuery();
      return studentAssessmentGradeService.getGradesByStudentSection(
        studentId,
        sectionId,
      );
    },
    enabled: !!studentId && !!sectionId,
  });
};

export const useCreateStudentAssessmentGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      studentAssessmentGradeService.resetQuery();
      return studentAssessmentGradeService.createStudentAssessmentGrade(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-assessment-grades"],
      });
      queryClient.invalidateQueries({ queryKey: ["grades-by-assessment"] });
      queryClient.invalidateQueries({
        queryKey: ["grades-by-student-section"],
      });
    },
  });
};

export const useUpdateStudentAssessmentGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      studentAssessmentGradeService.resetQuery();
      return studentAssessmentGradeService.updateStudentAssessmentGrade(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-assessment-grades"],
      });
      queryClient.invalidateQueries({ queryKey: ["grades-by-assessment"] });
      queryClient.invalidateQueries({
        queryKey: ["student-assessment-grade-by-id"],
      });
      queryClient.invalidateQueries({
        queryKey: ["grades-by-student-section"],
      });
    },
  });
};

export const useDeleteStudentAssessmentGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      studentAssessmentGradeService.resetQuery();
      return studentAssessmentGradeService.deleteStudentAssessmentGrade(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-assessment-grades"],
      });
      queryClient.invalidateQueries({ queryKey: ["grades-by-assessment"] });
      queryClient.invalidateQueries({
        queryKey: ["grades-by-student-section"],
      });
    },
  });
};
