import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FaEllipsisVertical,
  FaLinkedin,
  FaTwitter,
  FaGlobe,
} from "react-icons/fa6";
import {
  FaEdit,
  FaTimes,
  FaUserCircle,
  FaCamera,
  FaFileUpload,
} from "react-icons/fa";
import { createInstructorFormData } from "../../lib/formDataUtils";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import { ICurrentUser, IInstructor } from "../../types/interfaces";
import { z } from "zod";
import Button from "../../components/common/Button";
import ProfilePageSkeleton from "../../components/skeleton/ProfilePage";
import {
  useGetInstructorById,
  useUpdateInstructor,
} from "../../hooks/useInstructor";
import CameraModal from "./CameraModal";
import ImageCropper from "../../components/ImageCropper";

const profileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email().max(100),
});

interface InputFieldProps {
  field: string;
  value: string;
  placeholder: string;
  type?: "text" | "email";
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function InputField({
  value,
  placeholder,
  type = "text",
  className = "",
  onChange,
}: InputFieldProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={`border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full text-sm md:text-base ${className}`}
      placeholder={placeholder}
    />
  );
}

export default function InstructorProfilePage() {
  const { currentUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newExpertise, setNewExpertise] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [editData, setEditData] = useState<IInstructor | null>(null);
  const [avatar, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const changePassword = searchParams.get("change-password");

  const { id } = currentUser.user as ICurrentUser["user"];
  const { data, isPending } = useGetInstructorById(id);
  const updateInstructor = useUpdateInstructor();

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

  const userData = data?.data as IInstructor;

  if (!editData && userData) {
    setEditData({
      ...userData,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      faculty: userData.faculty,
      expertise: userData.expertise,
      qualifications: userData.qualifications,
      socialLinks: {
        linkedIn: userData.socialLinks?.linkedIn,
        twitter: userData.socialLinks?.twitter,
        website: userData.socialLinks?.website,
      },
      bio: userData.bio,
      employmentType: userData.employmentType,
      avatar: userData.avatar,
    });
    setAvatarPreview(userData.avatar || "");
  }

  const socialIcons = {
    linkedIn: <FaLinkedin className="text-blue-600 text-lg md:text-xl" />,
    twitter: <FaTwitter className="text-blue-400 text-lg md:text-xl" />,
    website: <FaGlobe className="text-gray-600 text-lg md:text-xl" />,
  };

  const handleInputChange = (field: keyof IInstructor, value: string) => {
    setEditData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setAvatarFile(file);
      setAvatarPreview(imageUrl);
      setShowCropper(true);
      setShowImageOptions(false);
    }
  };

  const handleCropComplete = (croppedImage: File | null) => {
    if (croppedImage) {
      setAvatarFile(croppedImage);
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

    setAvatarFile(file);
    setAvatarPreview(imageData);
    setShowCameraModal(false);
    setShowImageOptions(false);
  };

  const handleSocialLinkChange = (
    platform: keyof IInstructor["socialLinks"],
    value: string
  ) => {
    setEditData((prev) =>
      prev
        ? { ...prev, socialLinks: { ...prev.socialLinks, [platform]: value } }
        : prev
    );
  };

  const handleAddItem = (
    field: "expertise" | "qualifications",
    value: string,
    setValue: (val: string) => void
  ) => {
    if (value.trim()) {
      setEditData((prev) =>
        prev
          ? { ...prev, [field]: [...(prev[field] || []), value.trim()] }
          : prev
      );
      setValue("");
    }
  };

  const handleRemoveItem = (
    field: "expertise" | "qualifications",
    index: number
  ) => {
    setEditData((prev) =>
      prev
        ? {
            ...prev,
            [field]: (prev[field] || []).filter(
              (_: string, i: number) => i !== index
            ),
          }
        : prev
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null); // Reset editData to force reload from userData
    setAvatarFile(null); // Clear avatar file
    setAvatarPreview(userData?.avatar || ""); // Reset to original avatar
    setNewExpertise(""); // Clear expertise input
    setNewQualification(""); // Clear qualification input
  };

  const handleUpdate = () => {
    const userId = currentUser.user.id;
    const orgCode = currentUser.user.organization.code;
    if (!editData) return;

    const validationResult = profileSchema.safeParse(editData);
    if (!validationResult.success) {
      validationResult.error.errors.forEach((error) =>
        toast.error(error.message)
      );
      return;
    }

    // Filter out empty social links
    const filteredSocialLinks = editData.socialLinks
      ? Object.fromEntries(
          Object.entries(editData.socialLinks).filter(
            ([_, value]) => value && value.trim() !== ""
          )
        )
      : {};

    const { faculty, ...formDataFields } = editData;
    const formData = createInstructorFormData({
      ...formDataFields,
      socialLinks: filteredSocialLinks,
      orgCode,
      userId,
      ...(avatar && { avatar }),
    });

    toast.promise(
      updateInstructor.mutateAsync(formData, {
        onSuccess: () => {
          setAvatarFile(null);
          setIsEditing(false);
        },
      }),
      {
        pending: "Updating profile...",
        success: "Profile updated successfully",
        error: {
          render({ data }) {
            if (typeof data === "string") {
              return data;
            }
            return "An error occurred while updating the profile.";
          },
        },
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center pb-6 sm:pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Instructor Profile</h1>
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <FaEllipsisVertical className="text-xl sm:text-2xl" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm sm:text-base"
                onClick={() => {
                  setIsEditing(true);
                  setIsDropdownOpen(false);
                }}
              >
                Edit Profile
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm sm:text-base"
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

      <div className="max-w-3xl mx-auto space-y-4">
        <div className="border rounded-xl p-4 sm:p-6 space-y-6 sm:space-y-8 bg-green-50">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              {avatarPreview || userData?.avatar ? (
                <img
                  src={avatarPreview || userData?.avatar}
                  alt="Profile"
                  className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover"
                />
              ) : (
                <FaUserCircle className="w-24 h-24 sm:w-36 sm:h-36 text-gray-400" />
              )}
              {isEditing && (
                <div className="relative">
                  <button
                    className="absolute bottom-0 right-0 bg-primary text-white p-1.5 sm:p-2 rounded-full cursor-pointer"
                    onClick={() => setShowImageOptions(!showImageOptions)}
                  >
                    <FaEdit className="text-sm sm:text-base" />
                  </button>
                  {showImageOptions && (
                    <div
                      ref={popoverRef}
                      className="absolute bottom-12 right-0 w-48 bg-white bg-opacity-90 border rounded-lg shadow-lg z-20"
                    >
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm sm:text-base flex items-center gap-2"
                        onClick={() => {
                          setShowCameraModal(true);
                          setShowImageOptions(false);
                        }}
                      >
                        <FaCamera /> Capture Photo
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm sm:text-base flex items-center gap-2"
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
            <div className="flex flex-col sm:flex-row justify-between flex-1 w-full sm:w-auto">
              <div className="flex-1 pt-2 text-center sm:text-left">
                {isEditing && editData ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <InputField
                      field="firstName"
                      value={editData.firstName}
                      placeholder="First Name"
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                    />
                    <InputField
                      field="lastName"
                      value={editData.lastName}
                      placeholder="Last Name"
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                    />
                    <InputField
                      field="email"
                      value={editData.email}
                      placeholder="Email"
                      type="email"
                      className="sm:col-span-2"
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                    {userData?.faculty && (
                      <p className="sm:col-span-2 mt-2 text-gray-600 font-semibold text-sm sm:text-base">
                        Faculty of {userData?.faculty?.name}
                      </p>
                    )}
                    <div className="sm:col-span-2">
                      <div className="flex flex-wrap gap-2">
                        {(editData.expertise || []).map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center bg-gray-100 text-primary text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full border"
                          >
                            <span>{item}</span>
                            <button
                              onClick={() =>
                                handleRemoveItem("expertise", index)
                              }
                              className="ml-2 text-red-500"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                        <InputField
                          field="expertise"
                          value={newExpertise}
                          placeholder="Add new expertise"
                          onChange={(e) => setNewExpertise(e.target.value)}
                        />
                        <Button
                          variant="primary"
                          onClick={() =>
                            handleAddItem(
                              "expertise",
                              newExpertise,
                              setNewExpertise
                            )
                          }
                          className="w-full sm:w-auto"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">{`${userData?.firstName} ${userData?.lastName}`}</h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {userData?.email}
                    </p>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Faculty of{" "}
                      <span className="font-semibold">
                        {userData.faculty?.name}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(userData?.expertise || []).map((item, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-primary text-xs sm:text-sm px-2 py-1 rounded"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {!isEditing && (
                <div className="mt-4 sm:mt-0 sm:ml-2 py-2 px-4 bg-blue-100 rounded-full h-fit text-center sm:text-left">
                  <p className="text-blue-600 capitalize text-sm sm:text-base">
                    {(userData?.employmentType).replace("_", " ")}
                  </p>
                </div>
              )}
            </div>
          </div>
          {(userData?.bio || isEditing) && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Bio</h2>
              {isEditing && editData ? (
                <textarea
                  value={editData.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  className="mt-2 text-gray-600 bg-white p-3 sm:p-4 rounded-lg border w-full min-h-[100px] text-sm sm:text-base"
                  placeholder="Tell us about yourself"
                />
              ) : (
                <p className="mt-2 text-gray-600 bg-gray-100 p-3 sm:p-4 rounded-lg text-sm sm:text-base">
                  {userData?.bio}
                </p>
              )}
            </div>
          )}
        </div>

        {(userData?.socialLinks && userData?.qualifications) || isEditing ? (
          <div className="bg-gray-100 rounded-xl p-4 sm:p-6 border">
            <div>
              <p className="font-bold text-base sm:text-lg">Qualifications</p>
              {isEditing && editData ? (
                <div className="mt-2">
                  <ul className="text-gray-600 list-disc pl-5 text-sm sm:text-base">
                    {(editData.qualifications || []).map((qual, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <span>{qual}</span>
                        <button
                          onClick={() =>
                            handleRemoveItem("qualifications", index)
                          }
                          className="text-red-500"
                        >
                          <FaTimes className="text-xs sm:text-sm" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                    <InputField
                      field="qualifications"
                      value={newQualification}
                      placeholder="Add new qualification"
                      onChange={(e) => setNewQualification(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      onClick={() =>
                        handleAddItem(
                          "qualifications",
                          newQualification,
                          setNewQualification
                        )
                      }
                      className="w-full sm:w-auto"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <ul className="text-gray-600 list-disc pl-5 mt-2 text-sm sm:text-base">
                  {(userData?.qualifications || []).map((qual, index) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 sm:mt-8">
              <p className="font-bold text-base sm:text-lg">Social Links</p>
              <div className="space-y-2 mt-2">
                {isEditing && editData ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 flex items-center justify-center">
                        {socialIcons.linkedIn}
                      </span>
                      <InputField
                        field="linkedIn"
                        value={editData.socialLinks?.linkedIn || ""}
                        placeholder="Enter LinkedIn URL"
                        onChange={(e) =>
                          handleSocialLinkChange("linkedIn", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 flex items-center justify-center">
                        {socialIcons.twitter}
                      </span>
                      <InputField
                        field="twitter"
                        value={editData.socialLinks?.twitter || ""}
                        placeholder="Enter Twitter URL"
                        onChange={(e) =>
                          handleSocialLinkChange("twitter", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 flex items-center justify-center">
                        {socialIcons.website}
                      </span>
                      <InputField
                        field="website"
                        value={editData.socialLinks?.website || ""}
                        placeholder="Enter Website URL"
                        onChange={(e) =>
                          handleSocialLinkChange("website", e.target.value)
                        }
                      />
                    </div>
                  </>
                ) : (
                  userData?.socialLinks &&
                  Object.entries(userData.socialLinks).map(
                    ([platform, url]) =>
                      url && (
                        <div
                          key={platform}
                          className="flex items-center space-x-2"
                        >
                          <span className="w-6 h-6 flex items-center justify-center">
                            {
                              socialIcons[
                                platform as keyof IInstructor["socialLinks"]
                              ]
                            }
                          </span>
                          <a
                            href={url || ""}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm sm:text-base truncate"
                          >
                            {url}
                          </a>
                        </div>
                      )
                  )
                )}
              </div>
            </div>
          </div>
        ) : null}

        {isEditing && (
          <div className="flex flex-col sm:flex-row justify-end mt-4 gap-3 sm:gap-4">
            <Button
              variant="cancel"
              onClick={handleCancelEdit}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdate}
              disabled={updateInstructor.isPending}
              isLoading={updateInstructor.isPending}
              isLoadingText="Updating..."
              className="w-full sm:w-auto"
            >
              Update Profile
            </Button>
          </div>
        )}
      </div>

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
