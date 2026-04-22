import Dialog from "../common/Dialog";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useUpdateSection, useGetSectionById } from "../../hooks/useSection";
import { useInfiniteCoursesForDropdown } from "../../hooks/useCourse";
import { useInfiniteInstructorsForDropdown } from "../../hooks/useInstructor";
import { SearchableSelect } from "../SearchableSelect";
import { getMaxDate, getMinDate } from "../../lib/maxDateUtils";
import { getTerm } from "../../lib/utils";
import { calculateDurationMinutes } from "../../lib/dateUtils";
import { ICourseBasic, IInstructorBasic } from "../../types/interfaces";
import { useSearchParams } from "react-router-dom";
import TimePickerDropdown from "../common/TimePickerDropdown";

// Updated schema to match the create section schema
const editSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  course: z.string().min(1, "Course is required"),
  instructor: z.string().min(1, "Instructor is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  schedules: z
    .array(
      z.object({
        day: z.string(),
        startTime: z.string().min(1, "Start time is required").optional(),
        endTime: z.string().min(1, "End time is required").optional(),
      })
    )
    .optional(),
});

interface FormValues {
  name: string;
  course: string;
  instructor: string;
  startDate: string;
  endDate: string;
  schedules: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

interface SectionData {
  _id: string;
  name: string;
  course?: {
    _id: string;
    title: string;
  };
  instructor?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  schedule?: {
    startDate: string;
    endDate: string;
    breakdown?: Array<{
      day: string;
      time: {
        start: string;
        end: string;
      };
    }>;
  };
}

interface UpsertSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UpsertSectionModal({
  isOpen,
  onClose,
  onSuccess,
}: UpsertSectionModalProps) {
  const minDate = getMinDate();
  const { currentUser } = useAuth();
  const orgType = currentUser?.user?.organization?.type;
  const orgCode = currentUser?.user?.organization?.code;
  const sectionTerm = getTerm("group", orgType);
  const instructorTerm = getTerm("instructor", orgType);

  const [searchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const sectionId = searchParams.get("id");

  const isEditMode = modal === "edit-section";
  const { data: response } = useGetSectionById(sectionId || "");
  const sectionData = response?.data as SectionData;

  const [instructorSearchTerm, setInstructorSearchTerm] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    fetchNextPage: fetchNextCoursePage,
    hasNextPage: hasNextCoursePage,
    isFetchingNextPage: isFetchingNextCoursePage,
  } = useInfiniteCoursesForDropdown({
    organizationId: currentUser?.user?.organization?._id,
    searchTerm: courseSearchTerm,
    limit: 5,
  });

  const {
    data: instructorsData,
    isLoading: isLoadingInstructors,
    fetchNextPage: fetchNextInstructorPage,
    hasNextPage: hasNextInstructorPage,
    isFetchingNextPage: isFetchingNextInstructorPage,
  } = useInfiniteInstructorsForDropdown({
    organizationId: currentUser?.user?.organization?._id,
    searchTerm: instructorSearchTerm,
    limit: 5,
  });

  // Flatten the paginated data
  const courses =
    coursesData?.pages.flatMap((page) => page.courses || []) || [];
  const instructors =
    instructorsData?.pages.flatMap((page) => page.instructors || []) || [];

  // Get pagination info from the latest page
  const coursesPaginationInfo =
    coursesData?.pages[coursesData.pages.length - 1]?.pagination;
  const instructorsPaginationInfo =
    instructorsData?.pages[instructorsData.pages.length - 1]?.pagination;
  const updateSection = useUpdateSection();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(editSectionSchema),
    defaultValues: {
      name: "",
      course: "",
      instructor: "",
      startDate: "",
      endDate: "",
      schedules: [],
    },
  });

  const startDate = watch("startDate");
  const schedules = watch("schedules") || [];

  // Generate time options (every 30 minutes from 5:00 AM to 11:00 PM)
  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 4; hour <= 23; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour < 23) {
        times.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();
  const applySourceDay = selectedDays.find((selectedDay) => {
    const schedule = schedules.find((s: any) => s.day === selectedDay);
    if (!schedule?.startTime || !schedule?.endTime) return false;
    return calculateDurationMinutes(schedule.startTime, schedule.endTime) > 0;
  });

  // Initialize form with section data
  useEffect(() => {
    if (sectionData && isOpen) {
      const initialDays =
        sectionData.schedule?.breakdown?.map((sched: any) =>
          sched.day.toUpperCase()
        ) || [];
      setSelectedDays(initialDays);
      reset({
        name: sectionData.name,
        course: sectionData.course?._id || "",
        instructor: sectionData.instructor?._id || "",
        startDate: sectionData.schedule?.startDate?.split("T")[0] || "",
        endDate: sectionData.schedule?.endDate?.split("T")[0] || "",
        schedules:
          sectionData.schedule?.breakdown?.map((sched: any) => ({
            day: sched.day.toUpperCase(),
            startTime: sched.time.start,
            endTime: sched.time.end,
          })) || [],
      });
    } else if (!sectionId && isOpen) {
      // Reset form for create mode
      reset({
        name: "",
        course: "",
        instructor: "",
        startDate: "",
        endDate: "",
        schedules: [],
      });
      setSelectedDays([]);
    }
  }, [sectionData, sectionId, isOpen, reset]);

  // Handle day toggle and update schedules
  const toggleDay = (day: string) => {
    let updatedDays: string[];
    if (selectedDays.includes(day)) {
      updatedDays = selectedDays.filter((d) => d !== day);
      const updatedSchedules = schedules.filter((s: any) => s.day !== day);
      setValue("schedules", updatedSchedules, { shouldDirty: true });
    } else {
      updatedDays = [...selectedDays, day];
      const updatedSchedules = [
        ...schedules,
        { day, startTime: "", endTime: "" },
      ];
      setValue("schedules", updatedSchedules, { shouldDirty: true });
    }
    setSelectedDays(updatedDays);
  };

  // Update schedule time
  const updateScheduleTime = (
    day: string,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const updatedSchedules = schedules.map((s: any) =>
      s.day === day ? { ...s, [field]: value } : s
    );
    if (!updatedSchedules.some((s: any) => s.day === day)) {
      updatedSchedules.push({
        day,
        startTime: field === "startTime" ? value : "",
        endTime: field === "endTime" ? value : "",
      });
    }
    setValue("schedules", updatedSchedules, { shouldDirty: true });
  };

  const onSubmit = (data: FormValues) => {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      toast.error("End date cannot be earlier than start date");
      return;
    }

    if (selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    // Validate that all selected days have start and end times
    const invalidDays = selectedDays.filter((day) => {
      const schedule = schedules.find((s: any) => s.day === day);
      return !schedule || !schedule.startTime || !schedule.endTime;
    });

    if (invalidDays.length > 0) {
      toast.error(
        `Please select start and end times for: ${invalidDays.join(", ")}`
      );
      return;
    }

    const invalidTimeRangeDays = selectedDays.filter((day) => {
      const schedule = schedules.find((s: any) => s.day === day);
      if (!schedule?.startTime || !schedule?.endTime) return false;
      return calculateDurationMinutes(schedule.startTime, schedule.endTime) <= 0;
    });

    if (invalidTimeRangeDays.length > 0) {
      toast.error(
        `End time must be later than start time for: ${invalidTimeRangeDays.join(
          ", "
        )}`
      );
      return;
    }

    const formattedData = {
      _id: sectionId,
      name: data.name,
      course: data.course,
      instructor: data.instructor,
      schedule: {
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        breakdown: selectedDays.map((day) => {
          const schedule = schedules.find((s) => s.day === day);
          return {
            day: day.toLowerCase(),
            time: {
              start: schedule?.startTime || "",
              end: schedule?.endTime || "",
            },
          };
        }),
      },
    };

    toast.promise(
      updateSection.mutateAsync(formattedData, {
        onSuccess: () => {
          handleCloseModal();
          onSuccess?.();
        },
        onError: (error) => {
          console.error("Error updating section:", error);
        },
      }),
      {
        pending: "Updating section...",
        success: "Section updated successfully",
        error: {
          render({ data }) {
            return (data as { message: string }).message;
          },
        },
      }
    );
  };

  // Handle modal close
  const handleCloseModal = () => {
    onClose();
    reset();
    setSelectedDays([]);
    setInstructorSearchTerm("");
    setCourseSearchTerm("");
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={isEditMode ? "Edit Section" : "Create Section"}
      size="2xl"
      animation="pop"
      backdrop="blur"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Section Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {sectionTerm} Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60B2F0] focus:border-transparent"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name?.message as string}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={
                    courses?.map((course: ICourseBasic) => ({
                      value: course._id,
                      label: course.title,
                      description: course.code,
                    })) || []
                  }
                  value={watch("course")}
                  onChange={(value) =>
                    setValue("course", value, { shouldDirty: true })
                  }
                  onSearch={(term) => setCourseSearchTerm(term)}
                  placeholder="Select a course"
                  loading={isLoadingCourses}
                  emptyMessage="No courses available"
                  emptyAction={{
                    label: "Create a new course",
                    path: `/${orgCode}/admin/courses?modal=create-course`,
                  }}
                  type="course"
                  hasNextPage={hasNextCoursePage}
                  isFetchingNextPage={isFetchingNextCoursePage}
                  onLoadMore={fetchNextCoursePage}
                  paginationInfo={coursesPaginationInfo}
                  className={`w-full border ${
                    errors.course && !watch("course")
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-[#60B2F0] focus:border-transparent`}
                />
                {errors.course && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.course?.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={
                    instructors?.map((instructor: IInstructorBasic) => ({
                      value: instructor._id,
                      label: `${instructor.firstName} ${instructor.lastName}`,
                      description:
                        `${instructor?.firstName} - ${instructor.lastName} ` ||
                        "",
                    })) || []
                  }
                  value={watch("instructor")}
                  onChange={(value) =>
                    setValue("instructor", value, { shouldDirty: true })
                  }
                  onSearch={(term) => setInstructorSearchTerm(term)}
                  placeholder="Select an instructor"
                  loading={isLoadingInstructors}
                  emptyMessage={`No ${instructorTerm.toLowerCase()}s available`}
                  emptyAction={{
                    label: `Add a new ${instructorTerm.toLowerCase()}`,
                    path: `/${orgCode}/admin/instructors?modal=create-instructor`,
                  }}
                  type="instructor"
                  hasNextPage={hasNextInstructorPage}
                  isFetchingNextPage={isFetchingNextInstructorPage}
                  onLoadMore={fetchNextInstructorPage}
                  paginationInfo={instructorsPaginationInfo}
                  className={`w-full border ${
                    errors.instructor && !watch("instructor")
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-[#60B2F0] focus:border-transparent`}
                />
                {errors.instructor && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.instructor?.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Schedule</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("startDate")}
                  type="date"
                  min={minDate}
                  max={getMaxDate()}
                  className={`w-full px-3 py-2 border ${
                    errors.startDate ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-[#60B2F0] focus:border-transparent`}
                  onChange={(e) => {
                    if (new Date(e.target.value) < new Date(minDate)) {
                      e.target.value = minDate;
                    }
                    if (new Date(e.target.value) > new Date(getMaxDate())) {
                      e.target.value = getMaxDate();
                    }
                    setValue("startDate", e.target.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("endDate")}
                  type="date"
                  max={getMaxDate()}
                  min={startDate}
                  className={`w-full px-3 py-2 border ${
                    errors.endDate ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-[#60B2F0] focus:border-transparent`}
                  onChange={(e) => {
                    if (new Date(e.target.value) > new Date(getMaxDate())) {
                      e.target.value = getMaxDate();
                    }
                    setValue("endDate", e.target.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                  (day) => {
                    const schedule =
                      schedules.find((s: any) => s.day === day) || {};
                    const currentStartTime = (schedule as any).startTime;
                    const currentEndTime = (schedule as any).endTime;
                    return (
                      <div
                        key={day}
                        className={`p-2 sm:p-3 rounded-lg border ${
                          selectedDays.includes(day)
                            ? "border-primary"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDays.includes(day)}
                            onChange={() => toggleDay(day)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {day}
                          </span>
                        </label>
                        {selectedDays.includes(day) && (
                          <div className="mt-2 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                              <label className="text-xs text-gray-500">
                                Start
                              </label>
                              <TimePickerDropdown
                                value={currentStartTime || ""}
                                onChange={(value) =>
                                  updateScheduleTime(
                                    day,
                                    "startTime",
                                    value
                                  )
                                }
                                options={timeOptions}
                                isOptionDisabled={(option) =>
                                  Boolean(
                                    currentEndTime &&
                                      calculateDurationMinutes(
                                        option,
                                        currentEndTime
                                      ) <= 0
                                  )
                                }
                                placeholder="Start"
                                className="w-full sm:w-auto text-xs sm:text-sm"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                              <label className="text-xs text-gray-500">
                                End
                              </label>
                              <TimePickerDropdown
                                value={currentEndTime || ""}
                                onChange={(value) =>
                                  updateScheduleTime(
                                    day,
                                    "endTime",
                                    value
                                  )
                                }
                                options={timeOptions}
                                isOptionDisabled={(option) =>
                                  Boolean(
                                    currentStartTime &&
                                      calculateDurationMinutes(
                                        currentStartTime,
                                        option
                                      ) <= 0
                                  )
                                }
                                placeholder="End"
                                className="w-full sm:w-auto text-xs sm:text-sm"
                              />
                            </div>
                            {day === applySourceDay && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    selectedDays.forEach((selectedDay) => {
                                      if (selectedDay !== day) {
                                        updateScheduleTime(
                                          selectedDay,
                                          "startTime",
                                          currentStartTime
                                        );
                                        updateScheduleTime(
                                          selectedDay,
                                          "endTime",
                                          currentEndTime
                                        );
                                      }
                                    });
                                  }}
                                  className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/25"
                                >
                                  Apply to all
                                </button>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleCloseModal}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              updateSection.isPending ||
              !isDirty ||
              selectedDays.some((day) => {
                const schedule = schedules.find((s: any) => s.day === day);
                return !schedule || !schedule.startTime || !schedule.endTime;
              })
            }
            className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm sm:text-base"
          >
            {updateSection.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
