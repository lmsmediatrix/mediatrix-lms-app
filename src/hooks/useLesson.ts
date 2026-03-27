import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LessonService from "../services/lessonApi";
import SectionService from "../services/sectionApi";

export const useGetLessonById = (lessonId: string) => {
  return useQuery({
    enabled: !!lessonId,
    queryKey: ["lesson-by-id", lessonId],
    queryFn: async () => {
      LessonService.select([
        "title",
        "description",
        "mainContent",
        "mainContentUrl",
        "information",
        "category",
        "videoUrl",
        "startDate",
        "endDate",
        "time",
        "duration",
        "author",
        "files",
        "createdAt",
        "updatedAt",
      ]);
      return LessonService.getLessonById(lessonId);
    },
  });
};

export const useGetLessonBySectionCode = (
  sectionCode: string,
  lessonId: string,
  moduleId: string,
) => {
  return useQuery({
    queryKey: ["student-section-by-code", sectionCode, lessonId, moduleId],
    queryFn: async () => {
      SectionService.resetQuery();
      return SectionService.select(["_id", "code", "title", "name", "schedule"])
        .populate([
          { path: "instructor", select: "firstName lastName avatar" },
          {
            path: "modules",
            select: "title lessons",
            populate: {
              path: "lessons",
              select:
                "title description mainContent information category videoUrl startDate endDate time isPublished liveDiscussion duration author files progress assessments createdAt updatedAt",
              populate: {
                path: "assessments",
                select:
                  "_id title type assessmentNo endDate numberOfItems totalPoints lesson",
              },
              match: { _id: lessonId },
            } as any,
            match: { _id: moduleId },
          },
        ])
        .where({
          ...(sectionCode ? { code: sectionCode } : {}),
        })
        .sort("-createdAt")
        .withDocument(true)
        .searchSections();
    },
  });
};

export const useCreateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return LessonService.createLesson(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-module"] });
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return LessonService.updateLesson(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-module"] });
    },
    onError: (error) => {
      console.error("Failed to update lesson:", error);
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => {
      return LessonService.deleteLesson(lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-module"] });
    },
  });
};

export const useUpdateLessonProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lessonId,
      status,
    }: {
      lessonId: string;
      status: "completed" | "in-progress" | "not-started";
    }) => {
      return LessonService.updateLessonProgress(lessonId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-module"] });
      queryClient.invalidateQueries({ queryKey: ["student-sections"] });
      queryClient.invalidateQueries({
        queryKey: ["infinite-student-sections"],
      });
      queryClient.invalidateQueries({ queryKey: ["student-section-by-code"] });
    },
  });
};
