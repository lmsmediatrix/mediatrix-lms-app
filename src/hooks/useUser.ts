import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import UserService from "../services/userApi";
import { TRole } from "../types/interfaces";

export const useGetAdminUserById = (userId: string) => {
  return useQuery({
    queryKey: ["user-by-id", userId],
    queryFn: () => UserService.getUserById(userId),
    enabled: !!userId,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return UserService.updateUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-by-id"] });
    },
  });
};

export const useGetUserMetrics = (
  type: TRole,
  filter: "today" | "week" | "month" | "year"
) => {
  return useQuery({
    queryKey: ["user-metrics", filter, type],
    queryFn: () => UserService.getUserMetrics(type, filter),
    enabled: !!filter,
  });
};

export const useCreateOrgAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return UserService.register(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-by-code"] });
    },
    onError: (error) => {
      console.error("Failed to update organization:", error);
    },
  });
};

export const useDeleteOrgAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => {
      return UserService.deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-by-code"] });
    },
    onError: (error) => {
      console.error("Failed to update organization:", error);
    },
  });
};

export const useResetPassword = () => {

  return useMutation({
    mutationFn: (data: object) => {
      return UserService.resetPassword(data);
    },
  });
};
