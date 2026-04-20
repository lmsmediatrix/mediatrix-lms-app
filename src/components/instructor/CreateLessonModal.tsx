import Dialog from "../common/Dialog";
import { useForm } from "react-hook-form";
import Button from "../common/Button";
import { IoCloudUploadOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLessonFormData } from "../../lib/formDataUtils";
import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  FaAlignCenter,
  FaAlignJustify,
  FaAlignLeft,
  FaAlignRight,
  FaBold,
  FaCode,
  FaFile,
  FaFilePowerpoint,
  FaHighlighter,
  FaImage,
  FaItalic,
  FaLink,
  FaListOl,
  FaListUl,
  FaQuoteRight,
  FaRedo,
  FaRegFileAlt,
  FaStrikethrough,
  FaSubscript,
  FaSuperscript,
  FaUnderline,
  FaUnlink,
  FaUndo,
  FaYoutube,
} from "react-icons/fa";
import { getMaxDate } from "../../lib/maxDateUtils";
import {
  useCreateLesson,
  useGetLessonById,
  useUpdateLesson,
} from "../../hooks/useLesson";
import LessonModalSkeleton from "../skeleton/LessonModalSkeleton";
import { useAuth } from "../../context/AuthContext";

const lessonSchema = z.object({
  title: z
    .string()
    .min(1, "Lesson title must be at least 1 characters")
    .max(100, "Lesson title must be at most 100 characters"),
  startDate: z.string().min(1, "Publish date is required"),
  endDate: z.string().min(1, "Due date is required"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  information: z.string().optional(),
  mainContent: z.any().optional(),
  additionalFiles: z.any().optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface CreateLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName?: string;
}

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());
const isYouTubeUrl = (value: string) => /(youtube\.com|youtu\.be)/i.test(value);
const isFileLikeUrl = (value: string) => {
  const normalizedValue = value.toLowerCase().split("?")[0];
  return [".mp4", ".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx", ".txt"].some(
    (extension) => normalizedValue.endsWith(extension)
  );
};
const isEditorEmpty = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length === 0;

const toolbarButtonBaseClass =
  "rounded-md border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const getToolbarButtonClass = (isActive = false) =>
  `${toolbarButtonBaseClass} ${
    isActive
      ? "border-primary bg-primary/10 text-primary"
      : "border-gray-200 text-gray-700 hover:bg-gray-100"
  }`;

export default function CreateLessonModal({
  isOpen,
  onClose,
  sectionName,
}: CreateLessonModalProps) {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const location = useLocation();
  const moduleId = searchParams.get("moduleId");
  const lessonId = searchParams.get("lessonId");
  const { data: lessonData, isPending } = useGetLessonById(lessonId || "");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mainContentFile, setMainContentFile] = useState<File | null>(null);
  const [existingMainContentUrl, setExistingMainContentUrl] = useState<
    string | null
  >(null);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [isFileUpload, setIsFileUpload] = useState(true);
  const [richTextContent, setRichTextContent] = useState("<p></p>");
  const [textColor, setTextColor] = useState("#111827");
  const sectionCode = location.pathname.split("/")[4];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      description: "",
      information: "",
      mainContent: "",
    },
  });

  const startDate = watch("startDate");
  const mainContent = watch("mainContent");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: "Write lesson reading content here...",
      }),
    ],
    content: richTextContent,
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] max-h-[320px] overflow-y-auto rounded-b-md border border-t-0 border-gray-200 bg-white p-3 text-sm text-gray-700 focus:outline-none [&_p]:my-2 [&_h1]:my-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:my-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:my-2 [&_h3]:text-base [&_h3]:font-semibold [&_ul]:my-2 [&_ul]:ml-6 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:ml-6 [&_ol]:list-decimal [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-blue-600 [&_a]:underline [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-md [&_mark]:rounded [&_mark]:px-0.5",
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      const html = tiptapEditor.getHTML();
      setRichTextContent(html);
      setValue("information", html, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
  });

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();

  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    if (currentContent !== richTextContent) {
      editor.commands.setContent(richTextContent || "<p></p>", {
        emitUpdate: false,
      });
    }
  }, [editor, richTextContent]);

  useEffect(() => {
    if (lessonData?.data) {
      const startDate = new Date(lessonData.data.startDate)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(lessonData.data.endDate)
        .toISOString()
        .split("T")[0];
      const incomingMainContent = lessonData.data.mainContent || "";
      const incomingInformation = lessonData.data.information || "";

      setValue("title", lessonData.data.title);
      setValue("startDate", startDate);
      setValue("endDate", endDate);
      setValue("description", lessonData.data.description);
      setValue("information", incomingInformation);

      if (incomingInformation) {
        setRichTextContent(incomingInformation);
      } else {
        setRichTextContent("<p></p>");
      }
      setTextColor("#111827");

      if (!incomingMainContent) {
        setIsFileUpload(true);
        setExistingMainContentUrl(null);
      } else if (isHttpUrl(incomingMainContent) && isFileLikeUrl(incomingMainContent)) {
        setIsFileUpload(true);
        setExistingMainContentUrl(incomingMainContent);
        setValue("mainContent", "");
      } else if (isHttpUrl(incomingMainContent) && isYouTubeUrl(incomingMainContent)) {
        setIsFileUpload(false);
        setExistingMainContentUrl(null);
        setValue("mainContent", incomingMainContent);
      } else if (isHttpUrl(incomingMainContent)) {
        setIsFileUpload(true);
        setExistingMainContentUrl(incomingMainContent);
        setValue("mainContent", "");
      } else {
        // Backward compatibility for old lessons that stored text in mainContent
        setIsFileUpload(true);
        setExistingMainContentUrl(null);
        setValue("mainContent", "");
        if (!incomingInformation) {
          setValue("information", incomingMainContent);
          setRichTextContent(incomingMainContent);
        }
      }

      setExistingFiles(lessonData.data.files || []);
    }
  }, [lessonData, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleMainContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainContentFile(e.target.files[0]);
      setExistingMainContentUrl(null);
      setIsFileUpload(true);
      setValue("mainContent", e.target.files[0]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeMainContent = () => {
    setMainContentFile(null);
    setExistingMainContentUrl(null);
    setValue("mainContent", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const openFile = (file: File | string) => {
    const fileURL = typeof file === "string" ? file : URL.createObjectURL(file);
    window.open(fileURL, "_blank");
  };

  const isVideoFile = (file: File | string) => {
    return typeof file === "string"
      ? file.toLowerCase().endsWith(".mp4")
      : file.type.includes("video");
  };

  const switchToYouTubeLink = () => {
    const nextValue = isYouTubeUrl(mainContent || "") ? mainContent : "";
    setValue("mainContent", nextValue || "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const applyHeading = (value: string) => {
    if (!editor) return;
    const headingLevel = Number(value);
    if (headingLevel === 0) {
      editor.chain().focus().setParagraph().run();
      return;
    }
    if ([1, 2, 3].includes(headingLevel)) {
      editor
        .chain()
        .focus()
        .toggleHeading({ level: headingLevel as 1 | 2 | 3 })
        .run();
    }
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL", previousUrl);
    if (url === null) return;

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const normalizedUrl =
      trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")
        ? trimmedUrl
        : `https://${trimmedUrl}`;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalizedUrl })
      .run();
  };

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt("Enter image URL");
    if (!url) return;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    editor.chain().focus().setImage({ src: trimmedUrl }).run();
  };

  const onSubmit = async (data: LessonFormData) => {
    const resolvedMainContent = isFileUpload
      ? mainContentFile
      : data.mainContent;
    const resolvedInformation = isEditorEmpty(richTextContent) ? "" : richTextContent;

    const formData = createLessonFormData({
      ...data,
      moduleId,
      lessonId,
      mainContent: resolvedMainContent,
      information: resolvedInformation,
      additionalFiles: uploadedFiles,
      orgCode: currentUser.user.organization.code,
      sectionCode: sectionCode,
    });

    const mutation = lessonId ? updateLesson : createLesson;

    toast.promise(
      mutation.mutateAsync(formData, {
        onSuccess: () => {
          reset();
          setUploadedFiles([]);
          setMainContentFile(null);
          setExistingMainContentUrl(null);
          setExistingFiles([]);
          setIsFileUpload(true);
          setRichTextContent("<p></p>");
          setTextColor("#111827");
          editor?.commands.setContent("<p></p>", {
            emitUpdate: false,
          });
          onClose();
        },
      }),
      {
        pending: lessonId ? "Updating lesson..." : "Creating lesson...",
        success: lessonId
          ? "Lesson updated successfully"
          : "Lesson created successfully",
        error: {
          render({ data }) {
            return (data as { message: string }).message;
          },
        },
      }
    );
  };

  if (lessonId && isPending) {
    return <LessonModalSkeleton isOpen={isOpen} onClose={onClose} />;
  }

  const selectedHeadingValue = editor?.isActive("heading", { level: 1 })
    ? "1"
    : editor?.isActive("heading", { level: 2 })
    ? "2"
    : editor?.isActive("heading", { level: 3 })
    ? "3"
    : "0";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={lessonId ? "Edit Lesson" : "Create Lesson"}
      subTitle={sectionName}
      size="full"
      backdrop="blur"
      contentClassName=" "
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-[40vw]">
        {/* File Upload Section */}
        <div className="space-y-6">
          {/* Main Content */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Main Content
            </label>
            <div className="flex items-center bg-gray-200 rounded-md p-1 mb-2">
              <button
                type="button"
                onClick={() => setIsFileUpload(true)}
                className={`flex-1 flex items-center justify-center px-4 py-1 text-sm font-medium transition-colors duration-200 ${
                  isFileUpload
                    ? "bg-white rounded-md shadow-sm"
                    : "bg-transparent text-gray-700 "
                }`}
                disabled={isSubmitting}
              >
                <span className="mr-1">
                  <FaYoutube />
                </span>{" "}
                File Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFileUpload(false);
                  setMainContentFile(null);
                  setExistingMainContentUrl(null);
                  switchToYouTubeLink();
                }}
                className={`flex-1 flex items-center justify-center px-4 py-1 text-sm font-medium transition-colors duration-200 ${
                  !isFileUpload
                    ? "bg-white rounded-md shadow-sm"
                    : "bg-transparent text-gray-700 "
                }`}
                disabled={isSubmitting}
              >
                <span className="mr-1">
                  <FaFile />
                </span>{" "}
                YouTube Link
              </button>
            </div>

            <div className="mt-2">
              {isFileUpload ? (
                mainContentFile ? (
                  isVideoFile(mainContentFile) ? (
                    <div className="flex flex-col items-center">
                      <video
                        src={URL.createObjectURL(mainContentFile)}
                        controls
                        className="w-full max-w-full h-auto rounded-md mb-2"
                        style={{ maxHeight: "200px" }}
                      />
                      <span
                        className="text-sm text-gray-700 truncate max-w-[80%] cursor-pointer hover:underline"
                        onClick={() => openFile(mainContentFile)}
                        title={mainContentFile.name}
                      >
                        {mainContentFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeMainContent}
                        className="mt-2 text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6">
                      <FaFilePowerpoint className="w-6 h-6 text-primary mb-2" />
                      <span
                        className="text-sm text-gray-700 truncate max-w-[80%] cursor-pointer hover:underline"
                        onClick={() => openFile(mainContentFile)}
                        title={mainContentFile.name}
                      >
                        {mainContentFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeMainContent}
                        className="mt-2 text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  )
                ) : existingMainContentUrl ? (
                  isVideoFile(existingMainContentUrl) ? (
                    <div className="flex flex-col items-center">
                      <video
                        src={existingMainContentUrl}
                        controls
                        className="w-full max-w-full h-auto rounded-md mb-2"
                        style={{ maxHeight: "200px" }}
                      />
                      <span
                        className="text-sm text-gray-700 truncate max-w-[80%] cursor-pointer hover:underline"
                        onClick={() => openFile(existingMainContentUrl)}
                        title={existingMainContentUrl.split("/").pop()}
                      >
                        {existingMainContentUrl.split("/").pop()}
                      </span>
                      <button
                        type="button"
                        onClick={removeMainContent}
                        className="mt-2 text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6">
                      <FaFilePowerpoint className="w-6 h-6 text-primary mb-2" />
                      <span
                        className="text-sm text-gray-700 truncate max-w-[80%] cursor-pointer hover:underline"
                        onClick={() => openFile(existingMainContentUrl)}
                        title={existingMainContentUrl.split("/").pop()}
                      >
                        {existingMainContentUrl.split("/").pop()}
                      </span>
                      <button
                        type="button"
                        onClick={removeMainContent}
                        className="mt-2 text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  )
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <IoCloudUploadOutline className="w-6 h-6 text-gray-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Drag and drop your file here
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Supported formats: MP4, PPTX, DOCX (max 500MB)
                    </p>
                    <div className="max-w-[200px] mx-auto">
                      <input
                        type="file"
                        id="mainContentFileInput"
                        {...register("mainContent")}
                        onChange={handleMainContentChange}
                        className="hidden"
                        accept=".mp4,.pptx,.docx"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById("mainContentFileInput")
                            ?.click()
                        }
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        disabled={isSubmitting}
                      >
                        Browse Files
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600">
                      <FaYoutube />
                    </span>
                    <input
                      type="url"
                      {...register("mainContent")}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-500 placeholder-gray-500"
                      placeholder="Paste YouTube URL here"
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Example: https://www.youtube.com/watch?v=example
                  </p>
                  {mainContent && (
                    <div className="flex flex-col items-center mt-2">
                      <span
                        className="text-sm text-gray-700 truncate max-w-[100%] cursor-pointer hover:underline"
                        onClick={() => openFile(mainContent)}
                        title={mainContent}
                      >
                        {mainContent.split("/").pop()}
                      </span>
                      <button
                        type="button"
                        onClick={removeMainContent}
                        className="mt-2 text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {errors.mainContent && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">
                      {errors.mainContent.message?.toString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Downloadable Files */}
          <div className="border-y-2 py-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Downloadable Files
              </label>
              <div>
                <input
                  type="file"
                  id="additionalFilesInput"
                  {...register("additionalFiles")}
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.mp4"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("additionalFilesInput")?.click()
                  }
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={isSubmitting}
                >
                  + Add File
                </button>
              </div>
            </div>

            {(existingFiles.length > 0 || uploadedFiles.length > 0) && (
              <div className="space-y-2">
                {existingFiles.map((fileUrl, index) => (
                  <div
                    key={`existing-${index}`}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-2 text-sm text-gray-600"
                  >
                    <div className="flex items-center">
                      <span className="mr-2 text-primary">
                        <FaRegFileAlt />
                      </span>
                      <span className="truncate max-w-[70%]">
                        {fileUrl.split("/").pop()}
                      </span>
                      <span className="ml-2 text-gray-500">0.04 MB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <IoClose className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`new-${index}`}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-2 text-sm text-gray-600"
                  >
                    <div className="flex items-center">
                      <span className="mr-2 text-primary">
                        <FaRegFileAlt />
                      </span>
                      <span className="truncate max-w-[70%]">{file.name}</span>
                      <span className="ml-2 text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <IoClose className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.additionalFiles && (
              <p className="mt-1.5 text-sm text-red-600 font-medium">
                {errors.additionalFiles.message?.toString()}
              </p>
            )}
          </div>
        </div>

        {/* Form Grid */}
        <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Title
              </label>
              <input
                {...register("title")}
                minLength={1}
                maxLength={100}
                className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
                placeholder="Social Media Marketing"
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">
                  {errors.title.message}
                </p>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publish Date
              </label>
              <input
                type="date"
                {...register("startDate")}
                max={getMaxDate()}
                className={`w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base ${
                  errors.startDate ? "border-red-500 border" : ""
                }`}
                onChange={(e) => {
                  if (new Date(e.target.value) > new Date(getMaxDate())) {
                    e.target.value = getMaxDate();
                  }
                  setValue("startDate", e.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                disabled={isSubmitting}
              />
              {errors.startDate && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                {...register("endDate")}
                max={getMaxDate()}
                min={startDate}
                className={`w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base ${
                  errors.endDate ? "border-red-500 border" : ""
                }`}
                onChange={(e) => {
                  if (new Date(e.target.value) > new Date(getMaxDate())) {
                    e.target.value = getMaxDate();
                  }
                  setValue("endDate", e.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                disabled={isSubmitting}
              />
              {errors.endDate && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={4}
                minLength={10}
                maxLength={500}
                className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base"
                placeholder="Master social media marketing to grow your business or personal brand..."
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reading Content (Optional)
              </label>
              <div className="rounded-md border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-2">
                  <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().undo().run()}
                      className={getToolbarButtonClass()}
                      disabled={isSubmitting || !editor?.can().undo()}
                      title="Undo"
                    >
                      <FaUndo />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().redo().run()}
                      className={getToolbarButtonClass()}
                      disabled={isSubmitting || !editor?.can().redo()}
                      title="Redo"
                    >
                      <FaRedo />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                    <select
                      value={selectedHeadingValue}
                      onChange={(e) => applyHeading(e.target.value)}
                      className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      disabled={isSubmitting}
                      title="Heading"
                    >
                      <option value="0">Paragraph</option>
                      <option value="1">Heading 1</option>
                      <option value="2">Heading 2</option>
                      <option value="3">Heading 3</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={getToolbarButtonClass(editor?.isActive("bold"))}
                      disabled={isSubmitting}
                      title="Bold"
                    >
                      <FaBold />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={getToolbarButtonClass(editor?.isActive("italic"))}
                      disabled={isSubmitting}
                      title="Italic"
                    >
                      <FaItalic />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      className={getToolbarButtonClass(editor?.isActive("underline"))}
                      disabled={isSubmitting}
                      title="Underline"
                    >
                      <FaUnderline />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleStrike().run()}
                      className={getToolbarButtonClass(editor?.isActive("strike"))}
                      disabled={isSubmitting}
                      title="Strikethrough"
                    >
                      <FaStrikethrough />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleCode().run()}
                      className={getToolbarButtonClass(editor?.isActive("code"))}
                      disabled={isSubmitting}
                      title="Inline code"
                    >
                      <FaCode />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleSubscript().run()}
                      className={getToolbarButtonClass(editor?.isActive("subscript"))}
                      disabled={isSubmitting}
                      title="Subscript"
                    >
                      <FaSubscript />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                      className={getToolbarButtonClass(editor?.isActive("superscript"))}
                      disabled={isSubmitting}
                      title="Superscript"
                    >
                      <FaSuperscript />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleHighlight().run()}
                      className={getToolbarButtonClass(editor?.isActive("highlight"))}
                      disabled={isSubmitting}
                      title="Highlight"
                    >
                      <FaHighlighter />
                    </button>
                    <label
                      className={`${toolbarButtonBaseClass} flex cursor-pointer items-center gap-1 border-gray-200 text-gray-700 hover:bg-gray-100`}
                      title="Text color"
                    >
                      A
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => {
                          setTextColor(e.target.value);
                          editor?.chain().focus().setColor(e.target.value).run();
                        }}
                        className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={getToolbarButtonClass(editor?.isActive("bulletList"))}
                      disabled={isSubmitting}
                      title="Bullet list"
                    >
                      <FaListUl />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      className={getToolbarButtonClass(editor?.isActive("orderedList"))}
                      disabled={isSubmitting}
                      title="Numbered list"
                    >
                      <FaListOl />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                      className={getToolbarButtonClass(editor?.isActive("blockquote"))}
                      disabled={isSubmitting}
                      title="Blockquote"
                    >
                      <FaQuoteRight />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                      className={getToolbarButtonClass(editor?.isActive({ textAlign: "left" }))}
                      disabled={isSubmitting}
                      title="Align left"
                    >
                      <FaAlignLeft />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                      className={getToolbarButtonClass(editor?.isActive({ textAlign: "center" }))}
                      disabled={isSubmitting}
                      title="Align center"
                    >
                      <FaAlignCenter />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                      className={getToolbarButtonClass(editor?.isActive({ textAlign: "right" }))}
                      disabled={isSubmitting}
                      title="Align right"
                    >
                      <FaAlignRight />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
                      className={getToolbarButtonClass(editor?.isActive({ textAlign: "justify" }))}
                      disabled={isSubmitting}
                      title="Justify"
                    >
                      <FaAlignJustify />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                    <button
                      type="button"
                      onClick={setLink}
                      className={getToolbarButtonClass(editor?.isActive("link"))}
                      disabled={isSubmitting}
                      title="Insert link"
                    >
                      <FaLink />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().unsetLink().run()}
                      className={getToolbarButtonClass()}
                      disabled={isSubmitting || !editor?.isActive("link")}
                      title="Remove link"
                    >
                      <FaUnlink />
                    </button>
                    <button
                      type="button"
                      onClick={addImage}
                      className={getToolbarButtonClass()}
                      disabled={isSubmitting}
                      title="Add image"
                    >
                      <FaImage />
                    </button>
                  </div>

                  <div className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
                      className={getToolbarButtonClass()}
                      disabled={isSubmitting}
                      title="Clear formatting"
                    >
                      Clear Format
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRichTextContent("<p></p>");
                        setValue("information", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        editor?.commands.setContent("<p></p>", {
                          emitUpdate: false,
                        });
                      }}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      Clear Content
                    </button>
                  </div>
                </div>
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="w-full md:w-auto bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm md:text-base"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={
              isSubmitting ||
              createLesson.isPending ||
              updateLesson.isPending ||
              !isDirty
            }
            isLoading={
              lessonId ? updateLesson.isPending : createLesson.isPending
            }
            isLoadingText={lessonId ? "Updating..." : "Creating..."}
          >
            {lessonId ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
