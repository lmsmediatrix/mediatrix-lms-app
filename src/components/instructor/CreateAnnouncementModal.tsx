import { useEffect, useRef, useCallback } from "react";
import Dialog from "../common/Dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../common/Button";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getMaxDate } from "../../lib/maxDateUtils";
import {
  useCreateAnnouncement,
  useGetAnnouncementById,
  useUpdateAnnouncement,
} from "../../hooks/useAnnouncement";
import { useUploadImage } from "../../hooks/useCloudinary";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { uploadCloudinary } from "../../lib/formDataUtils";
import { useAuth } from "../../context/AuthContext";

// Register custom blot for loading image
const ImageBlot = Quill.import("formats/image") as any;
class LoadingImageBlot extends ImageBlot {
  static create(value: any) {
    const node = ImageBlot.create(value.src);
    node.setAttribute("data-loading", value.loading ? "true" : "false");
    node.setAttribute("style", value.loading ? "filter: blur(4px);" : "");
    return node;
  }

  static value(node: HTMLElement) {
    return {
      src: node.getAttribute("src"),
      loading: node.getAttribute("data-loading") === "true",
    };
  }
}
LoadingImageBlot.blotName = "loadingImage";
LoadingImageBlot.tagName = "img";
Quill.register(LoadingImageBlot);

// Zod schema with refined validation for textBody to handle HTML content
const announcementSchema = z.object({
  title: z
    .string()
    .min(1, "Announcement title must be at least 1 characters")
    .max(100, "Announcement title must be at most 100 characters"),
  publishDate: z.string().min(1, "Publish date is required"),
  textBody: z
    .string()
    .min(1, "Message must be at least 1 character")
    .max(5000, "Message cannot exceed 5000 characters")
    .refine(
      (val) => {
        // Strip HTML tags to validate plain text length
        const plainText = val.replace(/<[^>]+>/g, "").trim();
        return plainText.length >= 1 && plainText.length <= 5000;
      },
      {
        message: "Message must be between 1 and 5000 characters (plain text)",
      }
    ),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName?: string;
}

export default function CreateAnnouncementModal({
  isOpen,
  onClose,
  sectionName,
}: CreateAnnouncementModalProps) {
  const {currentUser} = useAuth();
  const [searchParams] = useSearchParams();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const location = useLocation()
  const uploadImage = useUploadImage();
  const sectionId = searchParams.get("sectionId");
  const announcementId = searchParams.get("announcementId");
  const quillRef = useRef<ReactQuill>(null);
  const sectionCode = location.pathname.split("/")[4];
  const orgCode = currentUser.user.organization.code
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      publishDate: "",
      textBody: "",
    },
  });

  const { data: announcement, isPending: isAnnouncementLoading } =
    useGetAnnouncementById(announcementId ? announcementId : "");

  const shouldShowLoading = announcementId && isAnnouncementLoading;

  const textBody = watch("textBody");

  useEffect(() => {
    if (announcement) {
      setValue("title", announcement.title);
      setValue("textBody", announcement.textBody);

      const publishDate = new Date(announcement.publishDate)
        .toISOString()
        .split("T")[0];
      setValue("publishDate", publishDate);
    }
  }, [announcement, setValue]);

  // Custom image handler for React Quill
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        // Insert temporary loading image
        const range = quill.getSelection(true);
        const placeholderSrc = URL.createObjectURL(file);
        quill.insertEmbed(range.index, "loadingImage", {
          src: placeholderSrc,
          loading: true,
        });

        // Add loading spinner overlay
        const loadingSpinner = document.createElement("div");
        loadingSpinner.style.position = "absolute";
        loadingSpinner.style.top = "0";
        loadingSpinner.style.left = "0";
        loadingSpinner.style.width = "100%";
        loadingSpinner.style.height = "100%";
        loadingSpinner.style.display = "flex";
        loadingSpinner.style.alignItems = "center";
        loadingSpinner.style.justifyContent = "center";
        loadingSpinner.innerHTML = `
          <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite;"></div>
          <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
        quill.container.appendChild(loadingSpinner);

        try {
          const formData = uploadCloudinary({
            file,
            sectionCode,
            orgCode
          })
          const response = await uploadImage.mutateAsync(formData);
          const imageUrl = response.url;

          // Replace loading image with uploaded image
          quill.deleteText(range.index, 1);
          quill.insertEmbed(range.index, "image", imageUrl);
          URL.revokeObjectURL(placeholderSrc);
        } catch (error) {
          console.error("Image upload failed:", error);
          toast.error("Failed to upload image");
          quill.deleteText(range.index, 1);
        } finally {
          quill.container.removeChild(loadingSpinner);
        }
      }
    };
  }, [uploadImage]);

  // Initialize Quill image handler
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      (quill.getModule("toolbar") as any).addHandler("image", imageHandler);
    }
  }, [imageHandler]);

  const onSubmit = async (data: AnnouncementFormData) => {
    const formData = {
      ...data,
      scope: "section",
      scopeId: sectionId,
      ...(announcementId && { _id: announcementId }),
    };
    const mutation = announcementId ? updateAnnouncement : createAnnouncement;

    toast.promise(
      mutation.mutateAsync(formData, {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (error) => {
          console.error("Announcement error:", error);
        },
      }),
      {
        pending: sectionId
          ? "Updating announcement..."
          : "Creating announcement...",
        success: sectionId
          ? "Announcement updated successfully"
          : "Announcement created successfully",
        error: sectionId
          ? "Failed to update announcement"
          : "Failed to create announcement",
      }
    );
  };

  // React Quill toolbar configuration
  const quillModules = {
    toolbar: [
      ["undo", "redo"],
      [{ font: [] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline"],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["image"],
    ],
  };

  const quillFormats = [
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "align",
    "list",
    "bullet",
    "image",
    "loadingImage",
  ];

  return (
    <Dialog
      title="Add announcement"
      subTitle={sectionName}
      backdrop="blur"
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      contentClassName="w-[50vw] min-w-[350px] max-w-[800px]"
    >
      {shouldShowLoading ? (
        <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[76px] bg-gray-200 rounded"></div>
              <div className="h-[76px] bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-[200px] bg-gray-200 rounded"></div>
          <div className="flex justify-end space-x-4">
            <div className="w-24 h-10 bg-gray-200 rounded"></div>
            <div className="w-24 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 max-w-6xl mx-auto"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Announcement Title
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.title ? "border-red-500 border" : ""
                  }`}
                  type="text"
                  id="title"
                  {...register("title")}
                  minLength={1}
                  maxLength={100}
                  disabled={isSubmitting}
                  placeholder="Welcome"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="publishDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Publish Date
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.publishDate ? "border-red-500 border" : ""
                  }`}
                  type="date"
                  id="publishDate"
                  {...register("publishDate")}
                  max={getMaxDate()}
                  onChange={(e) => {
                    if (new Date(e.target.value) > new Date(getMaxDate())) {
                      e.target.value = getMaxDate();
                    }
                    setValue("publishDate", e.target.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  disabled={isSubmitting}
                />
                {errors.publishDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.publishDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label
              htmlFor="textBody"
              className="block text-sm font-medium text-gray-700"
            >
              Text Body
            </label>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={textBody}
              onChange={(content) => setValue("textBody", content)}
              modules={quillModules}
              formats={quillFormats}
              className={`bg-gray-100 rounded-md ${
                errors.textBody ? "border-red-500 border" : ""
              }`}
              readOnly={isSubmitting}
              placeholder="Important: Class schedule updates and upcoming deadlines. Please review carefully."
            />
            {errors.textBody && (
              <p className="mt-1 text-sm text-red-600">
                {errors.textBody.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              onClick={() => {
                onClose();
                reset();
              }}
              variant="cancel"
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                isSubmitting ||
                createAnnouncement.isPending ||
                updateAnnouncement.isPending ||
                !isDirty
              }
              isLoadingText={announcementId ? "Updating..." : "Saving..."}
              isLoading={
                announcementId
                  ? updateAnnouncement.isPending
                  : createAnnouncement.isPending
              }
            >
              {announcementId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
