import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Dialog from "./Dialog";
import { useAuth } from "../../context/AuthContext";
import { getRouteRoleSegment } from "../../lib/utils";

export default function IsPasswordChangedModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { currentUser } = useAuth();
  const { organization, role } = currentUser.user;
  const routeRole = getRouteRoleSegment(role);
  const navigate = useNavigate();

  const handleCloseModal = () => {
    onClose();
  };

  return (
    <Dialog
      title="Change Password"
      backdrop="dark"
      isOpen={true}
      onClose={handleCloseModal}
      size="full"
      contentClassName="w-[30vw] min-w-[350px]"
      animation="pop"
    >
      <div>
        <p className="text-gray-700">
          For your security, we recommend updating your password. Would you like
          to change it now?
        </p>
        <div className="flex justify-end gap-4 mt-8">
          <Button
            onClick={() => {
              handleCloseModal();
            }}
            variant="cancel"
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              navigate(
                `/${organization.code}/${routeRole}/profile?change-password=true`
              )
            }
            variant="primary"
          >
            Proceed
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
