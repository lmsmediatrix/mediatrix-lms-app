import { useNavigate, useLocation } from "react-router-dom";
import Button from "../../components/common/Button";
import {
  FaAngleLeft,
  FaCloudUploadAlt,
  FaPlus,
  FaSpinner,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { createOrganizationFormData } from "../../lib/formDataUtils";
import {
  useCreateOrganization,
  useUpdateOrganization,
  useGenerateCode,
  useGetOrganizationByCode,
} from "../../hooks/useOrganization";
import { useDebounce } from "../../hooks/useDebounce";
import ImageCropper from "../../components/ImageCropper";

const createSchema = z.object({
  name: z
    .string()
    .min(4, "Organization name is required")
    .max(50, "Organization name should be less than 50 characters"),
  code: z
    .string()
    .min(2, "Organization code is required")
    .max(10, "Organization code should be less than 10 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description should be less than 500 characters"),
  organizationType: z.enum(["corporate", "school"], {
    errorMap: () => ({ message: "Organization type is required" }),
  }),
  logo: z
    .custom<File>()
    .refine(
      (file) => !file || file instanceof File,
      "Logo must be a valid image file"
    )
    .refine(
      (file) => !file || file.type.startsWith("image/"),
      "Logo must be a valid image file"
    )
    .optional(),
  background: z
    .custom<File>()
    .refine(
      (file) => !file || file instanceof File,
      "Background must be a valid image file"
    )
    .refine(
      (file) => !file || file.type.startsWith("image/"),
      "Background must be a valid image file"
    )
    .optional(),
  branding: z
    .object({
      logo: z.string().optional(),
      background: z.string().optional(),
      font: z.string().optional(),
      colors: z
        .object({
          primary: z
            .string()
            .max(50, "Color code must be at most 50 characters")
            .optional(),
          secondary: z
            .string()
            .max(50, "Color code must be at most 50 characters")
            .optional(),
          accent: z
            .string()
            .max(50, "Color code must be at most 50 characters")
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

type CreateFormData = z.infer<typeof createSchema>;

interface ImageState {
  background: string | null;
  logo: string | null;
}

export default function CreateOrganization() {
  const navigate = useNavigate();
  const location = useLocation();
  const orgCode = location.pathname.split("/")[3];
  const { data: orgData, isPending } = useGetOrganizationByCode(orgCode || "");

  const [images, setImages] = useState<ImageState>({
    background: null,
    logo: null,
  });
  const [showLogoCropper, setShowLogoCropper] = useState(false);
  const [showBackgroundCropper, setShowBackgroundCropper] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const refs = {
    background: useRef<HTMLInputElement>(null),
    logo: useRef<HTMLInputElement>(null),
    skipValidation: useRef(false),
  };

  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization();
  const generateCodeHook = useGenerateCode();
  const validateCodeHook = useGenerateCode();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setError,
    watch,
    setValue,
    clearErrors,
    reset,
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      organizationType: undefined,
      branding: {
        colors: {
          primary: "#3E5B93",
          secondary: "#228AB9",
          accent: "#C0DB70",
        },
      },
    },
  });

  // Update form when org data is loaded
  useEffect(() => {
    if (orgData) {
      setValue("name", orgData.data.name);
      setValue("code", orgData.data.code);
      setValue("description", orgData.data.description);
      setValue("organizationType", orgData.data.type);
      setValue("branding.colors.primary", orgData.data.branding.colors.primary);
      setValue(
        "branding.colors.secondary",
        orgData.data.branding.colors.secondary
      );
      setValue("branding.colors.accent", orgData.data.branding.colors.accent);
      setImages({
        logo: orgData.data.branding.logo || null,
        background: orgData.data.branding.coverPhoto || null,
      });
    }
  }, [orgData, setValue]);

  const description = watch("description");
  const organizationName = watch("name");
  const organizationCode = watch("code");
  const debouncedName = useDebounce(organizationName, 500);
  const debouncedCode = useDebounce(organizationCode, 500);
  const characterCount = description?.length || 0;

  const onSubmit = async (data: CreateFormData) => {
    try {
      const formData = createOrganizationFormData({
        name: data.name,
        orgCode: data.code,
        type: data.organizationType,
        description: data.description,
        organizationType: data.organizationType,
        logo: logoFile || (orgData && orgData.data.branding.logo) || undefined,
        coverPhoto:
          backgroundFile ||
          (orgData && orgData.data.branding.coverPhoto) ||
          undefined,
        colors: data.branding?.colors,
        _id: orgData?.data._id,
      });

      if (orgData && orgCode) {
        // Update existing organization
        toast.promise(
          updateOrganization.mutateAsync(formData, {
            onSuccess: () => {
              reset();
              navigate(-1);
            },
            onError: (error) => {
              console.error("Error updating organization:", error);
            },
          }),
          {
            pending: "Updating organization...",
            success: "Organization updated successfully",
            error: {
              render({ data }) {
                return (data as { message: string }).message;
              },
            },
          }
        );
      } else {
        // Create new organization
        toast.promise(
          createOrganization.mutateAsync(formData, {
            onSuccess: () => {
              reset();
              navigate(-1);
            },
          }),
          {
            pending: "Creating organization...",
            success: "Organization created successfully",
            error: {
              render({ data }) {
                return (data as { message: string }).message;
              },
            },
          }
        );
      }
    } catch (error) {
      setError("root", {
        message: "Something went wrong. Please try again.",
      });
    }
  };

  const uploadBackground = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("background", { message: "Please upload a valid image file" });
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setImages((prev) => ({ ...prev, background: imageUrl }));
      setBackgroundFile(file);
      setShowBackgroundCropper(true);
      clearErrors("background");
    }
  };

  const uploadLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("logo", { message: "Please upload a valid image file" });
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setImages((prev) => ({ ...prev, logo: imageUrl }));
      setLogoFile(file);
      setShowLogoCropper(true);
      clearErrors("logo");
    }
  };

  const handleLogoCropComplete = (croppedImage: File | null) => {
    if (croppedImage) {
      setLogoFile(croppedImage);
      setImages((prev) => ({
        ...prev,
        logo: URL.createObjectURL(croppedImage),
      }));
      setValue("logo", croppedImage);
      clearErrors("logo");
    }
    setShowLogoCropper(false);
  };

  const handleBackgroundCropComplete = (croppedImage: File | null) => {
    if (croppedImage) {
      setBackgroundFile(croppedImage);
      setImages((prev) => ({
        ...prev,
        background: URL.createObjectURL(croppedImage),
      }));
      setValue("background", croppedImage);
      clearErrors("background");
    }
    setShowBackgroundCropper(false);
  };

  const removeBackground = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImages((prev) => ({ ...prev, background: null }));
    setBackgroundFile(null);
    setValue("background", null as unknown as File);
    if (refs.background.current) {
      refs.background.current.value = "";
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImages((prev) => ({ ...prev, logo: null }));
    setLogoFile(null);
    setValue("logo", null as unknown as File);
    if (refs.logo.current) {
      refs.logo.current.value = "";
    }
  };

  const generateCodeHandler = async (name: string) => {
    if (!name || orgData) {
      return;
    }

    try {
      const response = await generateCodeHook.mutateAsync({ name });
      const generatedCode = response.code;

      refs.skipValidation.current = true;
      setValue("code", generatedCode);
      clearErrors("code");
      refs.skipValidation.current = false;
    } catch (error: any) {
      setError("code", {
        message: error.message,
      });
    }
  };

  const validateCodeHandler = async (code: string) => {
    if (!code || refs.skipValidation.current || orgData) {
      return;
    }

    try {
      await validateCodeHook.mutateAsync({ code });
      clearErrors("code");
    } catch (error: any) {
      setError("code", {
        message: error.message,
      });
    }
  };

  useEffect(() => {
    if (debouncedName) {
      generateCodeHandler(debouncedName);
    }
  }, [debouncedName]);

  useEffect(() => {
    if (debouncedCode) {
      validateCodeHandler(debouncedCode);
    }
  }, [debouncedCode]);

  return (
    <div className="max-w-6xl mx-auto pt-12 md:pt-2">
      <Button
        variant="link"
        className="flex items-center gap-2"
        onClick={() => navigate(-1)}
      >
        <FaAngleLeft /> Go back
      </Button>
      <div className="md:p-6 max-w-6xl mx-auto">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-lg shadow p-4 md:p-6"
        >
          <div className="flex justify-between items-center border-l-8 border-accent pl-2 mb-6">
            <h2 className="text-xl font-semibold">
              {orgData ? "Update Organization" : "Create Organization"}
            </h2>
            <Button
              variant="primary"
              className="px-12 hidden md:block"
              type="submit"
              disabled={
                isSubmitting ||
                createOrganization.isPending ||
                updateOrganization.isPending ||
                (orgData && !isDirty)
              }
              isLoading={
                orgData
                  ? updateOrganization.isPending
                  : createOrganization.isPending
              }
              isLoadingText={orgData ? "Updating..." : "Creating..."}
            >
              {orgData ? "Finish Update" : "Finish Create"}
            </Button>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo Upload */}
              <div className="md:w-1/3">
                <label className="block mb-2 font-semibold">
                  Organization Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={refs.logo}
                  onChange={uploadLogo}
                />
                <div
                  className={`h-48 w-48 mx-auto bg-white border border-dashed rounded-full cursor-pointer hover:bg-gray-50 transition-all group relative ${
                    errors.logo ? "border-danger" : "border-gray-300"
                  }`}
                  onClick={() => refs.logo.current?.click()}
                >
                  {images.logo ? (
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img
                        src={images.logo}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center">
                      <FaCloudUploadAlt className="text-4xl text-gray-400" />
                      <p className="text-gray-500 mt-2 font-medium">
                        Upload Logo
                      </p>
                    </div>
                  )}
                  {images.logo && (
                    <div
                      className="absolute top-2 right-2 bg-danger text-white rounded-full p-2 rotate-45 cursor-pointer hover:bg-danger/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={removeLogo}
                    >
                      <FaPlus size={14} />
                    </div>
                  )}
                </div>
                {errors.logo && (
                  <p className="text-danger text-sm mt-1">
                    {errors.logo.message}
                  </p>
                )}
              </div>

              {/* Background Upload */}
              <div className="flex-grow">
                <label className="block mb-2 font-semibold">
                  Cover Background
                </label>
                <div
                  className={`border border-dashed rounded-lg group ${
                    errors.background ? "border-danger" : "border-gray-300"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={refs.background}
                    onChange={uploadBackground}
                  />
                  <div
                    className="h-48 overflow-hidden relative cursor-pointer"
                    onClick={() => refs.background.current?.click()}
                  >
                    {images.background ? (
                      <>
                        <img
                          src={images.background}
                          alt="Background"
                          className="w-full h-48 object-cover"
                        />
                        <div
                          className="absolute top-2 right-2 bg-danger text-white rounded-full p-2 rotate-45 cursor-pointer hover:bg-danger/80 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={removeBackground}
                        >
                          <FaPlus size={14} />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-gray-50 hover:bg-gray-100 transition-all">
                        <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
                        <p className="text-gray-500 font-medium">
                          Upload Cover Background
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Click to browse files
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {errors.background && (
                  <p className="text-danger text-sm mt-1">
                    {errors.background.message}
                  </p>
                )}
              </div>
            </div>

            {/* Organization Name and Code in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block mb-2 font-semibold">
                  Organization Name
                </label>
                <input
                  type="text"
                  className={`w-full p-2 bg-gray-100 border rounded ${
                    errors.name ? "border-danger" : "border-gray-200"
                  }`}
                  placeholder="Enter organization name"
                  {...register("name")}
                  disabled={isPending}
                />
                {errors.name && (
                  <p className="text-danger text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="col-span-1">
                <label className="block mb-2 font-semibold">
                  Organization Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className={`w-full p-2 bg-gray-100 border rounded pr-8 ${
                      errors.code ? "border-danger" : "border-gray-200"
                    }`}
                    placeholder="Enter organization code"
                    {...register("code")}
                    disabled={isPending || !!orgData}
                  />
                  {(generateCodeHook.isPending ||
                    validateCodeHook.isPending) && (
                    <FaSpinner
                      className="absolute right-2 top-[14px] transform -translate-y-1/2 text-gray-500"
                      style={{ animation: "customSpin 0.8s linear infinite" }}
                    />
                  )}
                  {watch("code") &&
                    !generateCodeHook.isPending &&
                    !validateCodeHook.isPending &&
                    !generateCodeHook.isError &&
                    !validateCodeHook.isError && (
                      <FaCheck className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" />
                    )}
                  {(generateCodeHook.isError || validateCodeHook.isError) && (
                    <FaTimes className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500" />
                  )}
                </div>
                <style>
                  {`
      @keyframes customSpin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `}
                </style>
                {errors.code && (
                  <p className="text-danger text-sm mt-1">
                    {errors.code.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Description Input */}
              <div className="col-span-2">
                <label className="block font-semibold">Description</label>
                <div className="relative">
                  <textarea
                    {...register("description")}
                    className={`w-full p-3 bg-gray-100 border rounded resize-none h-32 ${
                      errors.description ? "border-danger" : "border-gray-200"
                    }`}
                    placeholder="Enter organization description"
                    disabled={isPending}
                  />
                  <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                    {characterCount}/500
                  </div>
                </div>
                {errors.description && (
                  <p className="text-danger text-sm">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-semibold">
                  Organization Type
                </label>
                <select
                  className={`w-full p-2 bg-gray-100 border rounded ${
                    errors.organizationType
                      ? "border-danger"
                      : "border-gray-200"
                  }`}
                  {...register("organizationType")}
                  disabled={isPending}
                >
                  <option value="">Select type</option>
                  <option value="corporate">Corporate</option>
                  <option value="school">University</option>
                </select>
                {errors.organizationType && (
                  <p className="text-danger text-sm mt-1">
                    {errors.organizationType.message}
                  </p>
                )}
              </div>
            </div>

            {/* Branding Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Branding Settings</h3>

              {/* Colors */}
              <div>
                <label className="block mb-2 font-semibold">Brand Colors</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm">Primary</label>
                    <input
                      type="color"
                      className="w-full h-10 border rounded cursor-pointer"
                      {...register("branding.colors.primary")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Secondary</label>
                    <input
                      type="color"
                      className="w-full h-10 border rounded cursor-pointer"
                      {...register("branding.colors.secondary")}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Accent</label>
                    <input
                      type="color"
                      className="w-full h-10 border rounded cursor-pointer"
                      {...register("branding.colors.accent")}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {errors.root && (
            <p className="text-danger text-sm mt-4 text-center">
              {errors.root.message}
            </p>
          )}

          <div className="flex justify-end mt-8">
            <Button
              variant="primary"
              className="px-12 md:hidden"
              type="submit"
              disabled={
                isSubmitting ||
                createOrganization.isPending ||
                updateOrganization.isPending ||
                (orgData && !isDirty)
              }
              isLoading={
                orgData
                  ? updateOrganization.isPending
                  : createOrganization.isPending
              }
              isLoadingText={orgData ? "Updating..." : "Creating..."}
            >
              {orgData ? "Finish Update" : "Finish Create"}
            </Button>
          </div>
        </form>
      </div>

      {showLogoCropper && (
        <ImageCropper
          imageSrc={images.logo}
          isOpen={showLogoCropper}
          onClose={() => setShowLogoCropper(false)}
          aspectRatio={1}
          onCropComplete={handleLogoCropComplete}
        />
      )}

      {showBackgroundCropper && (
        <ImageCropper
          imageSrc={images.background}
          isOpen={showBackgroundCropper}
          onClose={() => setShowBackgroundCropper(false)}
          aspectRatio={3 / 1}
          onCropComplete={handleBackgroundCropComplete}
        />
      )}
    </div>
  );
}
