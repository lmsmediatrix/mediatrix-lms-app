import { useAuth } from "../../context/AuthContext";
import Button from "./Button";
import Dialog from "./Dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useUpdateUser } from "../../hooks/useUser";
import { useNavigate } from "react-router-dom";

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(24, "New password must not exceed 24 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ChangePasswordModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { currentUser, setCurrentUser, logout } = useAuth(); // Add setCurrentUser here
  const { id } = currentUser.user;
  const updateUser = useUpdateUser();
  const [showPasswords, setShowPasswords] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onChange",
  });

  const handleClose = async () => {
    if (currentUser.user.isPasswordChanged === false) {
      await logout();
      navigate("/login", { replace: true });
    } else {
      onClose();
      reset();
    }
  };

  const onSubmit = async (data: PasswordFormData) => {
    if (!updateUser) return;

    const updateData = {
      _id: id,
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
      isPasswordChanged: true,
    };

    toast.promise(
      updateUser.mutateAsync(updateData, {
        onSuccess: () => {
          setCurrentUser({
            ...currentUser,
            user: {
              ...currentUser.user,
              isPasswordChanged: true,
            },
          });
          reset();
          onClose();
        },
        onError: (error: unknown) => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to update password";
          toast.error(errorMessage);
        },
      }),
      {
        pending: "Updating password...",
        success: "Password updated successfully",
      }
    );
  };

  return (
    <Dialog
      isOpen={true}
      onClose={handleClose}
      size="full"
      title="Change Password"
      backdrop="dark"
      contentClassName="w-full md:w-[30vw] md:min-w-[400px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {!currentUser.user.isPasswordChanged && (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <div className="text-yellow-800 font-semibold mb-2">
              Important Notice
            </div>
            <p className="text-yellow-700 text-sm">
              For your security, you are required to change your password upon
              your first login. Please set a new password to continue using your
              account.
            </p>
          </div>
        )}
        <div className="space-y-4">
          {/* Old Password */}
          <div>
            <label
              htmlFor="oldPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Old Password
            </label>
            <div className="relative">
              <input
                className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.oldPassword ? "border-red-500 border" : ""
                }`}
                type={showPasswords ? "text" : "password"}
                id="oldPassword"
                {...register("oldPassword")}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.oldPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.newPassword ? "border-red-500 border" : ""
              }`}
              type={showPasswords ? "text" : "password"}
              id="newPassword"
              {...register("newPassword")}
              disabled={isSubmitting}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <div>
              <input
                className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.confirmNewPassword ? "border-red-500 border" : ""
                }`}
                type={showPasswords ? "text" : "password"}
                id="confirmNewPassword"
                {...register("confirmNewPassword")}
                disabled={isSubmitting}
              />
            </div>
            {errors.confirmNewPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmNewPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button onClick={handleClose} variant="cancel" type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || updateUser.isPending}
            isLoadingText="Updating..."
            isLoading={isSubmitting || updateUser.isPending}
          >
            Update Password
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
