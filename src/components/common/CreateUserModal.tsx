import { FaPlus } from "react-icons/fa";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useRef, useState } from "react";

type RegisterOrgAdminProps = {
  register: any;
  handleSubmit: any;
  errors: any;
  isSubmitting: boolean;
  onSubmit: any;
  isModalOpen: boolean;
  setIsModalOpen: any;
  onAvatarChange?: (file: File) => void;
};

export default function RegisterOrgAdmin({
  register,
  handleSubmit,
  errors,
  isSubmitting,
  onSubmit,
  isModalOpen,
  setIsModalOpen,
  onAvatarChange,
}: RegisterOrgAdminProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
      onAvatarChange?.(file);
    }
  };

  return (
    <Dialog
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
      }}
      title="Register New admin"
      backdrop="blur"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500">Upload</span>
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
          <input
            {...register("password")}
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            {...register("role")}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select a role</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          {errors.role && (
            <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-white hover:bg-primary/90"
            isLoading={isSubmitting}
            isLoadingText="Processing..."
          >
             Register Admin
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
