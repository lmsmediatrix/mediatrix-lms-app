import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useUpdateStudent } from "../../hooks/useStudent";
import { FaEdit, FaRegUser, FaCamera, FaFileUpload } from "react-icons/fa";
import {
  FaEllipsisVertical,
  FaLinkedin,
  FaTwitter,
  FaGlobe,
  FaHashtag,
  FaBook,
} from "react-icons/fa6";
import { createStudentFormData } from "../../lib/formDataUtils";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import { ICertificate, ICurrentUser, IStudent } from "../../types/interfaces";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Button from "../../components/common/Button";
import ProfilePageSkeleton from "../../components/skeleton/ProfilePage";
import { useGetStudentProfile } from "../../hooks/useStudent";
import { getTerm } from "../../lib/utils";
import CameraModal from "../instructor/CameraModal";
import ImageCropper from "../../components/ImageCropper";
import { useStudentCertificates } from "../../hooks/useCertificate";
import CertificateDisplayCard from "../../components/student/CertificateDisplayCard";
import { downloadCertificatePdf } from "../../lib/certificatePdf";
import CertificatePreviewModal from "../../components/student/CertificatePreviewModal";
import EmployeeProfilePage from "./EmployeeProfilePage";

const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50),
  email: z.string().email("Invalid email address").max(100),
  yearLevel: z.number().min(1, "Year level must be between 1 and 5").max(5),
  socialLinks: z
    .object({
      linkedIn: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      website: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface InputFieldProps {
  field: keyof ProfileFormData | string;
  register: any;
  error?: string;
  placeholder: string;
  type?: "text" | "email" | "number";
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
    <div>
      <input
        type={type}
        {...register(field, { valueAsNumber: type === "number" })}
        className={`border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full text-sm md:text-base ${className} ${
          error ? "border-red-500" : ""
        }`}
        placeholder={placeholder}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function StudentProfilePage() {
  const { currentUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<ICertificate | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const changePassword = searchParams.get("change-password");

  const { id } = currentUser.user as ICurrentUser["user"];
  const { data, isPending } = useGetStudentProfile(id);
  const { data: certificatesData, isPending: isCertificatesLoading } = useStudentCertificates(id, {
    enabled: !!id,
  });
  const updateStudent = useUpdateStudent();
  const orgType = currentUser.user.organization.type;
  const isEmployee =
    currentUser.user.role === "employee" || orgType === "corporate";
  const learnerTerm = getTerm("learner", orgType);

  if (isEmployee) {
    return <EmployeeProfilePage />;
  }

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
      email: "",
      yearLevel: 1,
      socialLinks: {
        linkedIn: "",
        twitter: "",
        website: "",
      },
    },
  });

  useEffect(() => {
    if (data?.data) {
      const userData = data.data as IStudent;
      reset({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        yearLevel: userData.yearLevel || 1,
        socialLinks: {
          linkedIn: userData.socialLinks?.linkedIn || "",
          twitter: userData.socialLinks?.twitter || "",
          website: userData.socialLinks?.website || "",
        },
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

  const userData = data?.data as IStudent;

  const socialIcons = {
    linkedIn: <FaLinkedin className="text-blue-600 text-lg" />,
    twitter: <FaTwitter className="text-blue-400 text-lg" />,
    website: <FaGlobe className="text-gray-600 text-lg" />,
  };

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
      email: userData?.email,
      yearLevel: userData?.yearLevel || 1,
      socialLinks: {
        linkedIn: userData?.socialLinks?.linkedIn || "",
        twitter: userData?.socialLinks?.twitter || "",
        website: userData?.socialLinks?.website || "",
      },
    });
  };

  const handleUpdate = (formData: ProfileFormData) => {
    const _id = currentUser.user.id;
    const orgCode = currentUser.user.organization.code;

    // Filter out empty social links
    const filteredSocialLinks = formData.socialLinks
      ? Object.fromEntries(
          Object.entries(formData.socialLinks).filter(
            ([_, value]) => value && value.trim() !== ""
          )
        )
      : {};

    const updatedData = createStudentFormData({
      ...formData,
      _id,
      orgCode,
      socialLinks: isEmployee ? undefined : filteredSocialLinks,
      ...(avatar && { avatar }),
    });

    toast.promise(
      updateStudent.mutateAsync(updatedData, {
        onSuccess: () => {
          setAvatar(null);
          setIsEditing(false);
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

  const yearLevelOptions = [
    { label: "1st year", value: 1 },
    { label: "2nd year", value: 2 },
    { label: "3rd year", value: 3 },
    { label: "4th year", value: 4 },
    { label: "5th year", value: 5 },
  ];
  const certificates = (certificatesData?.data || []) as ICertificate[];
  const learnerName = `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() || "Learner";
  const handlePreviewCertificate = (certificate: ICertificate) => {
    setPreviewCertificate(certificate);
  };

  const handleDownloadCertificate = async () => {
    if (!previewCertificate) return;
    await downloadCertificatePdf({
      certificate: previewCertificate,
      learnerName,
      organizationName: currentUser.user.organization.name,
    });
    setPreviewCertificate(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="capitalize">{learnerTerm}</span> Profile
          </h1>
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
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <FaRegUser className="size-8 text-gray-400" />
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <InputField
                        field="email"
                        register={register}
                        error={errors.email?.message}
                        placeholder="Email"
                        type="email"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Year Level
                      </label>
                      <select
                        {...register("yearLevel", { valueAsNumber: true })}
                        className={`border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full text-sm md:text-base ${
                          errors.yearLevel ? "border-red-500" : ""
                        }`}
                      >
                        {yearLevelOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.yearLevel && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.yearLevel.message}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-start">
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
                  {userData?.gpa && !isEditing && orgType === "school" && (
                    <div className="mt-1 py-1 px-3 bg-gray-100 rounded-full text-center">
                      <p className="texterythronium text-gray-800 text-sm">
                        GPA: <span className="font-bold">{userData?.gpa}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Details Section */}
        {orgType === "school" && (
          <div className="p-6">
            <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
              <FaRegUser className="text-gray-500 text-lg" />
              <span>Student Details</span>
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <FaHashtag className="text-gray-400 text-sm mt-1" />
                <div className="flex flex-col">
                  <span className="text-gray-800 font-semibold">
                    Student ID
                  </span>
                  <span className="text-gray-500">
                    {userData?.studentId || "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <FaBook className="text-gray-400 text-sm mt-1" />
                <div className="flex flex-col">
                  <span className="text-gray-800 font-semibold">Program</span>
                  <span className="text-gray-500">
                    {userData?.program?.name || "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <FaBook className="text-gray-400 text-sm mt-1" />
                <div className="flex flex-col">
                  <span className="text-gray-800 font-semibold">
                    Year Level
                  </span>
                  <span className="text-gray-500">
                    {userData?.yearLevel
                      ? `${userData.yearLevel}${
                          userData.yearLevel === 1
                            ? "st"
                            : userData.yearLevel === 2
                            ? "nd"
                            : userData.yearLevel === 3
                            ? "rd"
                            : "th"
                        } year`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isEmployee && (
          <div className="p-6">
            <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
              <FaRegUser className="text-gray-500 text-lg" />
              <span>Social Links</span>
            </h3>
            <div className="space-y-2">
              {isEditing ? (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 flex items-center justify-center">
                      {socialIcons.linkedIn}
                    </span>
                    <div className="flex-1">
                      <InputField
                        field="socialLinks.linkedIn"
                        register={register}
                        error={errors.socialLinks?.linkedIn?.message}
                        placeholder="Enter LinkedIn URL"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 flex items-center justify-center">
                      {socialIcons.twitter}
                    </span>
                    <div className="flex-1">
                      <InputField
                        field="socialLinks.twitter"
                        register={register}
                        error={errors.socialLinks?.twitter?.message}
                        placeholder="Enter Twitter URL"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 flex items-center justify-center">
                      {socialIcons.website}
                    </span>
                    <div className="flex-1">
                      <InputField
                        field="socialLinks.website"
                        register={register}
                        error={errors.socialLinks?.website?.message}
                        placeholder="Enter Website URL"
                      />
                    </div>
                  </div>
                </>
              ) : !userData?.socialLinks ||
                Object.values(userData.socialLinks).every((url) => !url) ? (
                <p className="text-gray-600 text-sm">No social links available</p>
              ) : (
                Object.entries(userData.socialLinks).map(([platform, url]) =>
                  url ? (
                    <div key={platform} className="flex items-center space-x-2">
                      <span className="w-6 h-6 flex items-center justify-center">
                        {socialIcons[platform as keyof typeof socialIcons]}
                      </span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm truncate"
                      >
                        {url}
                      </a>
                    </div>
                  ) : null
                )
              )}
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-800">All Certificates</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {certificates.length}
            </span>
          </div>

          {isCertificatesLoading ? (
            <p className="text-sm text-slate-500">Loading certificates...</p>
          ) : certificates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No certificates yet. Complete lessons/modules with certificate enabled to unlock them.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {certificates.map((certificate) => (
                <CertificateDisplayCard
                  key={certificate._id}
                  certificate={certificate}
                  learnerName={learnerName}
                  onDownload={handlePreviewCertificate}
                />
              ))}
            </div>
          )}
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
            disabled={updateStudent.isPending}
            isLoading={updateStudent.isPending}
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
      <CertificatePreviewModal
        isOpen={!!previewCertificate}
        onClose={() => setPreviewCertificate(null)}
        onDownload={handleDownloadCertificate}
        certificate={previewCertificate}
        learnerName={learnerName}
        organizationName={currentUser.user.organization.name}
      />
    </div>
  );
}
