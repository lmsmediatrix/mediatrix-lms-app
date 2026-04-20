import { IoAdd } from "react-icons/io5";
import { AiOutlineEdit, AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import Accordion from "../../components/common/Accordion";
import CreateLessonModal from "../../components/instructor/CreateLessonModal";
import Button from "../../components/common/Button";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ILesson, IModule } from "../../types/interfaces";
import CreateModuleModal from "../../components/instructor/CreateModuleModal";
import { toast } from "react-toastify";
import Dialog from "../../components/common/Dialog";
import {
  useDeleteModule,
  usePopulateModuleAssessments,
} from "../../hooks/useModule";
import { useDeleteLesson } from "../../hooks/useLesson";
import { useSectionModule } from "../../hooks/useSection";
import ModuleTabSkeleton from "../../components/skeleton/ModuleTabSkeleton";

interface CreateModuleTabProps {
  sectionName?: string;
  sectionCode: string;
}

export default function CreateModuleTab({
  sectionName,
  sectionCode,
}: CreateModuleTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const moduleId = searchParams.get("moduleId");
  const lessonId = searchParams.get("lessonId");

  const navigate = useNavigate();
  const location = useLocation();
  const deleteModule = useDeleteModule();
  const populateModuleAssessments = usePopulateModuleAssessments();
  const deleteLesson = useDeleteLesson();
  const { data, isPending } = useSectionModule(sectionCode);
  const modules = data?.modules.data;

  // Render skeleton while data is pending
  if (isPending) {
    return <ModuleTabSkeleton />;
  }

  const onDeleteModule = (moduleId: string) => {
    toast.promise(
      deleteModule.mutateAsync(moduleId, {
        onSuccess: () => {
          handleCloseModal();
        },
      }),
      {
        pending: "Deleting module...",
        success: "Module deleted successfully",
        error: "Failed to delete module",
      },
    );
  };

  const onDeleteLesson = (lessonId: string) => {
    toast.promise(
      deleteLesson.mutateAsync(lessonId, {
        onSuccess: () => {
          handleCloseModal();
        },
        onError: (error) => {
          console.error("Error deleting lesson:", error);
        },
      }),
      {
        pending: "Deleting lesson...",
        success: "Lesson deleted successfully",
        error: "Failed to delete lesson",
      },
    );
  };

  const onPopulateModuleAssessments = (moduleId: string) => {
    toast.promise(populateModuleAssessments.mutateAsync(moduleId), {
      pending: "Syncing module assessments...",
      success: "Module assessments synced successfully",
      error: "Failed to sync module assessments",
    });
  };

  const openEditModule = (moduleId: string) => {
    setSearchParams({
      tab: "modules",
      modal: "edit-module",
      moduleId: moduleId,
    });
  };

  const openDeleteModule = (moduleId: string) => {
    setSearchParams({
      tab: "modules",
      modal: "delete-module",
      moduleId: moduleId,
    });
  };

  const openCreateLesson = (moduleId: string) => {
    setSearchParams({
      tab: "modules",
      modal: "create-lesson",
      moduleId: moduleId,
    });
  };

  const openEditLesson = (lessonId: string, moduleId: string) => {
    setSearchParams({
      tab: "modules",
      modal: "edit-lesson",
      moduleId: moduleId,
      lessonId: lessonId,
    });
  };

  const openDeleteLesson = (lessonId: string) => {
    setSearchParams({
      tab: "modules",
      modal: "delete-lesson",
      lessonId: lessonId,
    });
  };

  const handleCloseModal = () => {
    setSearchParams({ tab: "modules" });
  };

  // Find the module and lesson for the delete modals
  const module = modules?.find((module: IModule) => module._id === moduleId);
  const lesson = modules
    ?.flatMap((module: IModule) => module.lessons)
    .find((lesson: ILesson) => lesson._id === lessonId);

  return (
    <div className="bg-white md:shadow rounded-lg max-w-5xl mx-auto">
      <div className="flex justify-between border-b p-4">
        <div className="flex gap-2 items-center">
          <div className="bg-accent w-1.5 md:w-2 h-8 md:h-12" />
          <h2 className="text-lg md:text-xl font-bold">Modules</h2>
        </div>
        <button
          onClick={() =>
            setSearchParams({ tab: "modules", modal: "create-module" })
          }
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-600 border border-yellow-600 rounded-lg hover:bg-yellow-50"
        >
          <IoAdd className="text-lg" />
          Module
        </button>
      </div>
      <div className="space-y-2 py-2 md:p-6">
        {modules?.length > 0 ? (
          modules.map((module: IModule, index: number) => (
            <Accordion
              key={module._id}
              title={`Module ${index + 1}: ${module.title}`}
              defaultExpanded={true}
              updateDeleteBtn={
                <div className="flex items-center ">
                  <button
                    onClick={() => openEditModule(module._id)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <AiOutlineEdit className="text-lg" />
                  </button>
                  <button
                    onClick={() => openDeleteModule(module._id)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <AiOutlineDelete className="text-lg" />
                  </button>
                </div>
              }
              actionButton={
                <div className="flex items-stretch">
                  <button
                    onClick={() => onPopulateModuleAssessments(module._id)}
                    disabled={populateModuleAssessments.isPending}
                    className="px-2 md:px-3 text-xs md:text-sm font-medium text-primary border-l border-gray-200 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Module Assessment
                  </button>
                  <button
                    onClick={() => openCreateLesson(module._id)}
                    className="flex items-center gap-1 md:gap-2 px-2 md:px-4 text-sm font-medium text-primary transition-all hover:font-bold border-l border-gray-200"
                  >
                    <IoAdd className="text-lg" />
                    <span className="hidden md:inline">Add</span> Lesson
                  </button>
                </div>
              }
            >
              <div className="divide-y divide-gray-200">
                {module.lessons.map((lesson, index) => (
                  <div
                    key={lesson._id}
                    className="flex items-center justify-between px-2 md:px-16 py-4 bg-white hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs md:text-sm">
                        Lesson {index + 1}:
                      </span>
                      <span className="text-xs md:text-sm text-gray-900">
                        {lesson.title}
                      </span>
                    </div>
                    <div className="flex items-center md:gap-4">
                      <span
                        className={`text-xs md:mr-10 ${
                          lesson.status === "published"
                            ? "text-green-600 bg-green-50"
                            : "text-gray-600 bg-gray-100"
                        } px-2 py-1 rounded`}
                      >
                        {lesson.status}
                      </span>
                      <div className="flex items-center md:gap-4">
                        <button
                          onClick={() => openEditLesson(lesson._id, module._id)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <AiOutlineEdit className="text-lg" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              location.pathname.replace(
                                `manage`,
                                `lessons/${lesson._id}?module=${module._id}`,
                              ),
                              {
                                state: {
                                  previousPage: module.title,
                                  path: location.pathname,
                                },
                              },
                            )
                          }
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <AiOutlineEye className="text-base md:text-lg" />
                        </button>
                        <button
                          onClick={() => openDeleteLesson(lesson._id)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <AiOutlineDelete className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Accordion>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No modules available
          </div>
        )}
      </div>
      <div className="border-t flex justify-between p-2 md:p-4">
        <Button onClick={() => navigate("?")} variant="cancel">
          <FaArrowLeft />
          Back
        </Button>
        <Button
          onClick={() => navigate("?tab=announcements")}
          variant="outline"
        >
          Next <FaArrowRight />
        </Button>
      </div>

      {(modal === "create-module" || modal === "edit-module") && (
        <CreateModuleModal
          isOpen={true}
          onClose={handleCloseModal}
          sectionName={sectionName}
        />
      )}

      {(modal === "create-lesson" || modal === "edit-lesson") && (
        <CreateLessonModal
          isOpen={true}
          onClose={handleCloseModal}
          sectionName={sectionName}
        />
      )}

      {modal === "delete-module" && moduleId && (
        <Dialog
          isOpen={true}
          onClose={handleCloseModal}
          title="Delete Module"
          contentClassName="w-[50vw]"
          backdrop="blur"
        >
          <>
            <p>
              Are you sure you want to delete the module{" "}
              <span className="font-semibold">
                "{module?.title || "this module"}"
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={handleCloseModal}
                variant="cancel"
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onDeleteModule(moduleId);
                }}
                variant="destructive"
                isLoading={deleteModule.isPending}
                isLoadingText="Deleting Module..."
              >
                Delete
              </Button>
            </div>
          </>
        </Dialog>
      )}

      {modal === "delete-lesson" && lessonId && (
        <Dialog
          isOpen={true}
          onClose={handleCloseModal}
          title="Delete Lesson"
          contentClassName="w-[50vw]"
          backdrop="blur"
        >
          <>
            <p>
              Are you sure you want to delete the lesson{" "}
              <span className="font-semibold">
                "{lesson?.title || "this lesson"}"
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={handleCloseModal}
                variant="cancel"
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onDeleteLesson(lessonId);
                }}
                variant="destructive"
                isLoading={deleteLesson.isPending}
                isLoadingText="Deleting Lesson..."
              >
                Delete
              </Button>
            </div>
          </>
        </Dialog>
      )}
    </div>
  );
}
