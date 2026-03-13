import { toast } from "react-toastify";
import { useResetPassword } from "../hooks/useUser";
import { IInstructor, IStudent, orgAdmiUser } from "../types/interfaces";
import Dialog from "./common/Dialog";

interface ResetUserPasswordProps {
  isOpen: IInstructor | boolean;
  onClose: () => void;
  user: IInstructor | IStudent | orgAdmiUser;
}

export default function ResetUserPassword({
  isOpen,
  onClose,
  user,
}: ResetUserPasswordProps) {
  const resetPassword = useResetPassword();

  const onSubmit = async (id: string, firstName: string, lastName: string) => {
    toast.promise(
      resetPassword.mutateAsync(
        { id, firstName, lastName },
        {
          onSuccess: () => {
            onClose();
          },
        }
      ),
      {
        pending: "Updating...",
        success: "Password updated successfully",
        error: "Failed to update password",
      }
    );
  };

  return (
    <Dialog
      isOpen={!!isOpen}
      onClose={onClose}
      title="Reset User Password"
      backdrop="blur"
      animation="pop"
    >
      <div className="p-2">
        <p className="text-gray-700">
          Are you sure you want to reset to the default password for{" "}
          <span className="font-bold">
            {user.firstName} {user.lastName}
          </span>
          ? This action cannot be undone.
        </p>
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        <button
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="bg-primary text-white px-4 py-2 rounded mr-2"
          onClick={() => {
            onSubmit(user._id, user.firstName, user.lastName);
            onClose();
          }}
        >
          Reset Password
        </button>
      </div>
    </Dialog>
  );
}