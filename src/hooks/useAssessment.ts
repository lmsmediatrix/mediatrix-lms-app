import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import AssessmentService from "../services/assessmentApi";

export const useGetAssessmentById = (
  assessmentId: string,
  hasStarted?: boolean,
  isStudent?: boolean,
) => {
  return useQuery({
    enabled: !!assessmentId,
    queryKey: ["assessment-by-id", assessmentId, hasStarted],
    queryFn: async () => {
      AssessmentService.select([
        "attemptsAllowed",
        "gradeMethod",
        "title",
        "type",
        "lesson",
        "description",
        "numberOfItems",
        "startDate",
        "endDate",
        "timeLimit",
        // "totalPoints",
        "passingScore",
        "isShuffled",
        "numberOfQuestionsToShow",
        "totalPoints",
        ...(hasStarted ? ["questions.type",] : []),
        ...(hasStarted ? ["questions.questionText",] : []),
        ...(hasStarted ? ["questions.options.option",] : []),
        ...(hasStarted ? ["questions.questionImage",] : []),
        ...(hasStarted ? ["questions.options.image",] : []),
        ...(hasStarted ? ["questions.options.text",] : []),
        ...(hasStarted ? ["questions.points",] : []),
        ...(hasStarted ? ["questions._id",] : []),
        ...(!isStudent ? ["questions.options.isCorrect"] : []),
      ]);

      return AssessmentService.getAssessmentById(assessmentId);
    },
  });
};

export const useGetAssessmentHeader = (
  assessmentId: string,
) => {
  return useQuery({
    enabled: !!assessmentId,
    queryKey: ["assessment-header", assessmentId],
    queryFn: async () => {
      AssessmentService.select([
        "attemptsAllowed",
        "gradeMethod",
        "title",
        "type",
        "description",
        "numberOfItems",
        "startDate",
        "endDate",
        "timeLimit",
        "totalPoints",
        "passingScore",
      ]);
      return AssessmentService.getAssessmentById(assessmentId);
    },
  });
};

export const useGetTakeAssessment = (assessmentId: string) => {
  return useQuery({
    enabled: !!assessmentId,
    queryKey: ["take-assessment-by-id", assessmentId],
    queryFn: async () => {
      AssessmentService.select([
        "title",
        "type",
        "description",
        "numberOfItems",
        "startDate",
        "endDate",
        "timeLimit",
        "totalPoints",
        "passingScore",
        "attemptsAllowed",
        "gradeMethod",
      ]);

      return AssessmentService.getAssessmentById(assessmentId);
    },
  });
};

export const useCreateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return AssessmentService.createAssessment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["student-section-by-code"] });
      queryClient.invalidateQueries({ queryKey: ["section-module"] });
    },
  });
};

export const useUpdateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return AssessmentService.updateAssessment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-assessment"] });
    },
  });
};

export const useDeleteAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) =>
      AssessmentService.deleteAssessment(assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-assessment"] });
    },
  });
};

export const useSubmitAssessment = () => {
  return useMutation({
    mutationFn: (data: object) => {
      return AssessmentService.submitAssessment(data);
    },
  });
};

export const useGetStudentAssessment = (
  sectionCode: string,
  assessmentId: string
) => {
  return useQuery({
    queryKey: ["student-assessment", sectionCode, assessmentId],
    queryFn: () =>
      AssessmentService.getStudentsAssessment(sectionCode, assessmentId),
    enabled: !!sectionCode && !!assessmentId,
  });
};

export const useGetStudentsAssessmentResult = (
  studentId: string,
  assessmentNo: string,
  assessmentType: string,
  sectionCode: string
) => {
  return useQuery({
    queryKey: ["student-assessment-result", studentId, assessmentNo],
    queryFn: () =>
      AssessmentService.getStudentsAssessmentResult(
        studentId,
        assessmentNo,
        assessmentType,
        sectionCode
      ),
    enabled: !!studentId && !!assessmentNo,
  });
};

export const useUpdateAssessmentResult = () => {
  const queryClient = useQueryClient(); 

  return useMutation({
    mutationFn: (data: {
      assessmentId: string;
      studentId: string;
      answers: object;
    }) => {
      return AssessmentService.updateAssessmentResult(
        data.assessmentId,
        data.studentId,
        data.answers
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-assessment-result"],
      });
    },
  });
};
