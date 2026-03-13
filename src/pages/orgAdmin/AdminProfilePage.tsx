import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaEdit, FaRegUser, FaCamera, FaFileUpload } from "react-icons/fa";
import { FaEllipsisVertical } from "react-icons/fa6";
import { createAdminFormData } from "../../lib/formDataUtils";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { ICurrentUser, orgAdmiUser } from "../../types/interfaces";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Button from "../../components/common/Button";
import ProfilePageSkeleton from "../../components/skeleton/ProfilePage";
import { useGetAdminUserById, useUpdateUser } from "../../hooks/useUser";
import { IoCalendarOutline } from "react-icons/io5";
import { HiOutlinePencil } from "react-icons/hi";
import CameraModal from "../instructor/CameraModal";
import ImageCropper from "../../components/ImageCropper";

const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface InputFieldProps {
  field: keyof ProfileFormData;
  register: any;
  error?: string;
  placeholder: string;
  type?: "text" | "email";
  className?: string;
}

function InputField({
  field,
  register,
  error,
  placeholder,
  type = "text",
  className = "",
}: InputFieldProps) {
  return (
    <div className="flex flex-col">
      <input
        type={type}
        {...register(field)}
        className={`border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm ${className} ${
          error ? "border-red-500" : ""
        }`}
        placeholder={placeholder}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function AdminProfilePage() {
  const { currentUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const changePassword = searchParams.get("change-password");

  const { id } = currentUser.user as ICurrentUser["user"];
  const { data, isPending } = useGetAdminUserById(id);
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  useEffect(() => {
    if (data?.data) {
      const userData = data.data as orgAdmiUser;
      reset({
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      setAvatarPreview(userData.avatar || "");
    }
  }, [data, reset]);

  // Handle outside click for popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setShowImageOptions(false);
      }
    };

    if (showImageOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showImageOptions]);

  if (isPending) return <ProfilePageSkeleton />;

  const userData = data?.data as orgAdmiUser;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setAvatar(file);
      setAvatarPreview(imageUrl);
      setShowCropper(true);
      setShowImageOptions(false);
    }
  };

  const handleCropComplete = (croppedImage: File | null) => {
    if (croppedImage) {
      setAvatar(croppedImage);
      setAvatarPreview(URL.createObjectURL(croppedImage));
    }
    setShowCropper(false);
  };

  const handleCameraCapture = (imageData: string) => {
    const byteString = atob(imageData.split(",")[1]);
    const mimeString = imageData.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], "camera-capture.jpg", { type: mimeString });

    setAvatar(file);
    setAvatarPreview(imageData);
    setShowCameraModal(false);
    setShowImageOptions(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatar(null);
    setAvatarPreview(userData?.avatar || "");
    reset({
      firstName: userData?.firstName,
      lastName: userData?.lastName,
    });
  };

  const handleUpdate = (formData: ProfileFormData) => {
    const userId = currentUser.user.id;
    const orgCode = currentUser.user.organization.code;

    const updatedData = createAdminFormData({
      ...formData,
      email: userData.email,
      userId,
      orgCode,
      ...(avatar && { avatar }),
    });

    toast.promise(
      updateUser.mutateAsync(updatedData, {
        onSuccess: () => {
          setAvatar(null);
          setIsEditing(false);
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to update profile");
        },
      }),
      {
        pending: "Updating profile...",
        success: "Profile updated successfully",
        error: {
          render({ data }) {
            return (data as { message: string }).message;
          },
        },
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 lg:py-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Profile</h1>
          <p className="text-sm text-gray-500">
            Manage your account information
          </p>
        </div>
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <FaEllipsisVertical className="text-lg text-gray-700" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                onClick={() => {
                  setIsEditing(true);
                  setIsDropdownOpen(false);
                }}
              >
                Edit Profile
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setSearchParams({ "change-password": "true" });
                }}
              >
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        <div className="bg-[#F5F8FF] rounded-t-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {avatarPreview || userData?.avatar ? (
                <img
                  src={avatarPreview || userData?.avatar}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <FaRegUser className="size-10 text-gray-400" />
                </div>
              )}
              {isEditing && (
                <div className="relative">
                  <button
                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full cursor-pointer"
                    onClick={() => setShowImageOptions(!showImageOptions)}
                  >
                    <FaEdit className="text-xs" />
                  </button>
                  {showImageOptions && (
                    <div
                      ref={popoverRef}
                      className="absolute bottom-12 right-0 w-48 bg-white bg-opacity-90 border rounded-lg shadow-lg z-20"
                    >
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2"
                        onClick={() => {
                          setShowCameraModal(true);
                          setShowImageOptions(false);
                        }}
                      >
                        <FaCamera /> Capture Photo
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FaFileUpload /> Upload Image
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                  />
                </div>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <form
                  id="profile-form"
                  onSubmit={handleSubmit(handleUpdate)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <InputField
                        field="firstName"
                        register={register}
                        error={errors.firstName?.message}
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <InputField
                        field="lastName"
                        register={register}
                        error={errors.lastName?.message}
                        placeholder="Last Name"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-sm text-gray-600">{userData?.email}</p>
                    </div>
                  </div>
                </form>
              ) : (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">{`${userData?.firstName} ${userData?.lastName}`}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-600">
                      {userData?.email}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="p-6">
          <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
            <FaRegUser className="text-gray-500 text-lg" />
            <span>Account Details</span>
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <IoCalendarOutline className="text-gray-400 text mt-1 size-5" />
              <div className="flex flex-col">
                <span className="text-gray-800 font-semibold">Created At</span>
                <span className="text-gray-500">
                  {formatDateMMMDDYYY(userData?.createdAt || "")}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <HiOutlinePencil className="text-gray-400 text mt-1 size-5" />
              <div className="flex flex-col">
                <span className="text-gray-800 font-semibold">Updated At</span>
                <span className="text-gray-500">
                  {formatDateMMMDDYYY(userData?.updatedAt || "")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Buttons */}
      {isEditing && (
        <div className="flex justify-end mt-4 gap-3">
          <Button
            variant="cancel"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(handleUpdate)}
            disabled={updateUser.isPending}
            isLoading={updateUser.isPending}
            isLoadingText="Updating..."
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Update Profile
          </Button>
        </div>
      )}

      {/* Change Password Modal */}
      {changePassword && (
        <ChangePasswordModal onClose={() => setSearchParams({})} />
      )}
      {showCameraModal && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCameraModal(false)}
        />
      )}
      <ImageCropper
        imageSrc={avatarPreview}
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        aspectRatio={1}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
