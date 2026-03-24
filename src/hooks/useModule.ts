import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ModuleService from "../services/moduleApi";

export const useGetModuleById = (moduleId: string) => {
  return useQuery({
    queryKey: ["module-by-id", moduleId],
    queryFn: () => {
      ModuleService.select(["title", "description"]);
      return ModuleService.getModuleById(moduleId);
    },
    enabled: !!moduleId,
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return ModuleService.createModule(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-module"] });
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return ModuleService.updateModule(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-module"] });
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) => ModuleService.deleteModule(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-module"] });
    },
  });
};
