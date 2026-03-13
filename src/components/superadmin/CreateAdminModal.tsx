import { FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdminFormData } from "../../lib/formDataUtils";
import { toast } from "react-toastify";
import { useLocation, useSearchParams } from "react-router-dom";
import { useCreateOrgAdmin } from "../../hooks/useUser";
import { GoPerson } from "react-icons/go";
import ImageCropper from "../ImageCropper";

const addAdminSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be less than 100 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must be less than 50 characters"),
});

type AddAdminFormData = z.infer<typeof addAdminSchema>;

export default function CreateAdminModal({ orgId }: { orgId: string }) {
  const [_, setSearchParams] = useSearchParams();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createAdmin = useCreateOrgAdmin();
  const location = useLocation();
  const orgCode = location.pathname.split("/").pop();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<AddAdminFormData>({
    resolver: zodResolver(addAdminSchema),
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
      setAvatarFile(file);
      setAvatarChanged(true);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedImage: File | null) => {
    if (croppedImage) {
      setAvatarFile(croppedImage);
      setPreviewUrl(URL.createObjectURL(croppedImage));
      setAvatarChanged(true);
    }
    setShowCropper(false);
  };

  const onFormSubmit = (data: AddAdminFormData) => {
    if (!orgCode) {
      toast.error("Organization Code is missing");
      return;
    }

    const formData = createAdminFormData({
      ...data,
      orgCode: orgCode,
      orgId: orgId,
      avatar: avatarFile || undefined,
    });

    toast.promise(
      createAdmin.mutateAsync(formData, {
        onSuccess: () => {
          reset();
          setPreviewUrl(null);
          setAvatarFile(null);
          setAvatarChanged(false);
          setShowCropper(false);
          handleCloseModal();
        },
      }),
      {
        pending: "Creating an admin...",
        success: "Admin created successfully",
        error: {
          render({ data }) {
            return (data as { message: string }).message;
          },
        },
      }
    );
  };

  const handleCloseModal = () => {
    reset();
    setPreviewUrl(null);
    setAvatarFile(null);
    setAvatarChanged(false);
    setShowCropper(false);
    setSearchParams({});
  };

  return (
    <>
      <Dialog
        isOpen={true}
        onClose={handleCloseModal}
        title="Create New Admin"
        backdrop="blur"
        size="full"
        contentClassName="w-full md:w-[30vw] md:min-w-[500px] max-w-[400px]"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <div
                className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500">
                    <GoPerson className="size-12" />
                  </span>
                )}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-primary/80"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaPlus size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                minLength={2}
                maxLength={50}
                {...register("firstName")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                minLength={2}
                maxLength={50}
                {...register("lastName")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              maxLength={100}
              {...register("email")}
              type="email"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                minLength={6}
                maxLength={50}
                {...register("password")}
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 border rounded-md pr-10"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              onClick={handleCloseModal}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAdmin.isPending || (!isDirty && !avatarChanged)}
              className="bg-primary text-white hover:bg-primary/90"
              isLoading={createAdmin.isPending}
              isLoadingText="Processing..."
            >
              Create Admin
            </Button>
          </div>
        </form>
      </Dialog>

      <ImageCropper
        imageSrc={previewUrl}
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        aspectRatio={1}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}