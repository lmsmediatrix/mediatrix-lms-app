import { FaPlus, FaEdit, FaSearch, FaGraduationCap } from "react-icons/fa";
import Button from "../../components/common/Button";
import DashboardHeader from "../../components/common/DashboardHeader";
import { MdDeleteForever } from "react-icons/md";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { formatDate } from "../../lib/dateUtils";
import { toast } from "react-toastify";
import { orgAdmiUser } from "../../types/interfaces";
import CreateAdminModal from "../../components/superadmin/CreateAdminModal";
import Dialog from "../../components/common/Dialog";
import { useGetOrganizationByCode } from "../../hooks/useOrganization";
import { useDeleteOrgAdmin } from "../../hooks/useUser";
import { OrganizationPageSkeleton } from "../../components/skeleton/OrganizationPageSkeleton";
import { MdLockReset } from "react-icons/md";
import ResetUserPassword from "../../components/ResetUserPassword";
import { useState } from "react";

export default function OrganizationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resetUserPassword, setResetUserPassword] = useState<orgAdmiUser | null>(null);
  const modal = searchParams.get("modal");
  const orgCode = location.pathname.split("/").pop();
  const { data, isPending } = useGetOrganizationByCode(orgCode || "");
  const orgData = !isPending ? data.data : null;
  const deleteOrgAdmin = useDeleteOrgAdmin();

  const openDeleteModal = (userId: string) => {
    setSearchParams({
      modal: "delete-admin",
      adminId: userId,
    });
  };

  const handleDelete = (userId: string) => {
    toast.promise(
      deleteOrgAdmin.mutateAsync(userId, {
        onSuccess: () => {
          handleCloseModal();
        },
        onError: (error) => {
          console.error("Error deleting admin:", error);
        },
      }),
      {
        pending: "Deleting admin...",
        success: "Admin deleted successfully",
        error: {
          render({ data }) {
            return (data as { message: string }).message;
          },
        },
      }
    );
  };

  const handleCloseModal = () => {
    setSearchParams({});
  };

  if (isPending) {
    return <OrganizationPageSkeleton />;
  }

  return (
    <div>
      <DashboardHeader
        coverPhoto={orgData.branding?.coverPhoto}
        noGreetings={true}
      >
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="h-[200px] w-[250px] overflow-hidden rounded-lg">
            {orgData.branding?.logo ? (
              <img
                src={orgData.branding?.logo}
                alt={orgData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <FaGraduationCap className="size-20 text-primary" />
              </div>
            )}
          </div>
          <div className="space-y-4 w-full">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <h1 className="text-2xl md:text-4xl text-white font-bold">
                {orgData.name}
              </h1>
              <FaEdit
                onClick={() =>
                  navigate(`/admin/organization/${orgData.code}/edit`, {
                    state: { data: orgData },
                  })
                }
                className="text-white cursor-pointer hover:text-gray-200 text-lg md:text-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <p className="text-white text-sm md:text-base">Code:</p>
                <p className="text-white font-semibold text-sm md:text-base">
                  {orgData.code}
                </p>
              </div>
              <div className="flex gap-2">
                <p className="text-white text-sm md:text-base">Type:</p>
                <p className="text-white font-semibold text-sm md:text-base capitalize">
                  {orgData.type}
                </p>
              </div>
              <div className="flex gap-2">
                <p className="text-white text-sm md:text-base">Created:</p>
                <p className="text-white font-semibold text-sm md:text-base">
                  {formatDate(orgData.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardHeader>

      <div className=" py-8 px-4">
        <div className="flex flex-col items-center rounded-lg shadow md:flex-row justify-between mb-7 gap-4 bg-white p-4">
          <h3 className="text-lg md:text-xl font-semibold">All Admins</h3>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Search user"
                className="border rounded-md px-2 py-2 pl-8 w-full"
              />
              <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <Button
              onClick={() =>
                setSearchParams({
                  modal: "register-admin",
                })
              }
              className="bg-secondary border border-secondary text-white hover:bg-white hover:text-primary hover:border-primary transition-all duration-300 w-full md:w-auto"
            >
              <FaPlus /> Add admin
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orgData.admins?.length > 0 ? (
                  orgData.admins.map((user: orgAdmiUser) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={`${user.firstName}'s avatar`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-600">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            user.role === "admin"
                              ? "text-red-800"
                              : "text-green-800"
                          }`}
                        >
                          {user.role?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.status === "active"
                              ? "bg-green-100 text-green-800"
                              : user.status === "inactive"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <span className="capitalize">{user.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setResetUserPassword(user)}
                            className="text-lg text-gray-600 hover:text-red-900"
                          >
                            <MdLockReset size={24} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(user._id)}
                            className="text-xl text-gray-600 hover:text-red-900"
                          >
                            <MdDeleteForever />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500 mb-4">
                        No admins found in this organization
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-gray-200">
            {orgData.admins?.length > 0 ? (
              orgData.admins.map((user: orgAdmiUser) => (
                <div key={user._id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName}'s avatar`}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-600">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary rounded border-gray-300"
                      />
                    </div>
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          user.role === "admin"
                            ? "text-red-800"
                            : "text-green-800"
                        }`}
                      >
                        {user.role?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : user.status === "inactive"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        <span className="capitalize">{user.status}</span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                            onClick={() => setResetUserPassword(user)}
                        className="text-lg text-gray-600 hover:text-red-900"
                      >
                        <MdLockReset size={24} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(user._id)}
                        className="text-lg text-gray-600 hover:text-red-900"
                      >
                        <MdDeleteForever />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-500 mb-4">
                  No admins found in this organization
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modal === "register-admin" && <CreateAdminModal orgId={orgData._id} />}

      {modal === "delete-admin" && searchParams.get("adminId") && (
        <Dialog
          isOpen={true}
          onClose={handleCloseModal}
          title="Delete Admin"
          contentClassName="w-[90vw] md:w-[50vw]"
          backdrop="blur"
        >
          <>
            <p className="text-sm md:text-base">
              Are you sure you want to delete this admin?
            </p>
            <div className="flex flex-col md:flex-row justify-end gap-3 mt-6">
              <Button
                onClick={handleCloseModal}
                variant="cancel"
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 w-full md:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(searchParams.get("adminId")!)}
                variant="destructive"
                isLoading={deleteOrgAdmin.isPending}
                isLoadingText="Processing..."
                className="w-full md:w-auto"
              >
                Delete
              </Button>
            </div>
          </>
        </Dialog>
      )}

      {resetUserPassword && (
        <ResetUserPassword
          isOpen={!!resetUserPassword}
          onClose={() => setResetUserPassword(null)}
          user={resetUserPassword}
        />
      )}
    </div>
  );
}
