import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaAngleLeft, FaSpinner, FaTimes } from "react-icons/fa";
import { CheckIcon } from "@/components/ui/check-icon";
import { BiBook } from "react-icons/bi";
import { BsCalendar3 } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { toast } from "react-toastify";
import { ICourse, IInstructor } from "../../types/interfaces";
import { getMaxDate, getMinDate } from "../../lib/maxDateUtils";
import { useCreateSection, useGenerateCode } from "../../hooks/useSection";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import { calculateDurationMinutes } from "../../lib/dateUtils";
import { SearchableSelect } from "../../components/SearchableSelect";
import { useDebounce } from "../../hooks/useDebounce";
import { useInfiniteCoursesForDropdown } from "../../hooks/useCourse";
import { useInfiniteInstructorsForDropdown } from "../../hooks/useInstructor";
import TimePickerDropdown from "../../components/common/TimePickerDropdown";

// Define interfaces for better type safety
interface ScheduleItem {
  day: string;
  startTime?: string;
  endTime?: string;
}

// Update schema to handle an array of schedules for each day
const sectionSchema = z.object({
  code: z
    .string()
    .min(2, "Section code must be at least 2 characters")
    .max(10, "Section code must be at most 10 characters"),
  name: z
    .string()
    .min(3, "Section title must be at least 3 characters")
    .max(50, "Section title must be at most 50 characters"),
  course: z.string().min(1, "Please select a course"),
  instructor: z.string().min(1, "Please select an instructor"),
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

type SectionFormData = z.infer<typeof sectionSchema>;

export default function NewSectionPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const minDate = getMinDate();
  const orgType = currentUser.user.organization.type;
  const sectionTerm = getTerm("group", orgType);
  const sectionsTerm = getTerm("group", orgType, true);
  const learnerTerm = getTerm("learner", orgType);
  const instructorTerm = getTerm("instructor", orgType);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [invalidDays, setInvalidDays] = useState<string[]>([]);
  const [instructorSearchTerm, setInstructorSearchTerm] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const orgCode = currentUser.user.organization.code;

  // Course and instructor hooks with infinite scrolling
  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    fetchNextPage: fetchNextCoursePage,
    hasNextPage: hasNextCoursePage,
    isFetchingNextPage: isFetchingNextCoursePage,
  } = useInfiniteCoursesForDropdown({
    organizationId: currentUser.user.organization._id,
    searchTerm: courseSearchTerm,
    limit: 10,
  });

  const {
    data: instructorsData,
    isLoading: isLoadingInstructors,
    fetchNextPage: fetchNextInstructorPage,
    hasNextPage: hasNextInstructorPage,
    isFetchingNextPage: isFetchingNextInstructorPage,
  } = useInfiniteInstructorsForDropdown({
    organizationId: currentUser.user.organization._id,
    searchTerm: instructorSearchTerm,
    limit: 10,
  });

  // Flatten the paginated data
  const courses =
    coursesData?.pages.flatMap((page) => page.courses || []) || [];
  const instructors =
    instructorsData?.pages.flatMap((page) => page.instructors || []) || [];
  const coursesPaginationInfo =
    coursesData?.pages[coursesData.pages.length - 1]?.pagination;
  const instructorsPaginationInfo =
    instructorsData?.pages[instructorsData.pages.length - 1]?.pagination;

  const createSection = useCreateSection();
  const generateCodeHook = useGenerateCode();
  const validateCodeHook = useGenerateCode();

  const refs = {
    skipValidation: useRef(false),
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
    setError,
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      code: "",
      course: "",
      instructor: "",
      startDate: minDate,
      endDate: "",
      schedules: [],
    },
  });

  const startDate = watch("startDate");
  const sectionName = watch("name");
  const sectionCode = watch("code");
  const debouncedName = useDebounce(sectionName, 500);
  const debouncedCode = useDebounce(sectionCode, 500);
  const schedules = watch("schedules") || ([] as ScheduleItem[]);

  const generateCodeHandler = async (name: string) => {
    if (!name) {
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
    if (!code || refs.skipValidation.current) {
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

  // Generate time options (every 30 minutes from 5:00 AM to 11:00 PM)
  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 5; hour <= 23; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour < 23) {
        times.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();
  const applySourceDay = selectedDays.find((selectedDay) => {
    const schedule = schedules.find((s: ScheduleItem) => s.day === selectedDay);
    if (!schedule?.startTime || !schedule?.endTime) return false;
    return calculateDurationMinutes(schedule.startTime, schedule.endTime) > 0;
  });

  const onSubmit = (data: SectionFormData) => {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      toast.error("End date cannot be earlier than start date");
      return;
    }

    // Validate that all selected days have start and end times
    const missingTimeDays = selectedDays.filter((day) => {
      const schedule = schedules.find((s: ScheduleItem) => s.day === day);
      return !schedule || !schedule.startTime || !schedule.endTime;
    });

    if (missingTimeDays.length > 0) {
      setInvalidDays(missingTimeDays);
      toast.error(
        `Please select start and end times for: ${missingTimeDays.join(", ")}`
      );
      return;
    }

    const invalidTimeRangeDays = selectedDays.filter((day) => {
      const schedule = schedules.find((s: ScheduleItem) => s.day === day);
      if (!schedule?.startTime || !schedule?.endTime) return false;
      return calculateDurationMinutes(schedule.startTime, schedule.endTime) <= 0;
    });

    if (invalidTimeRangeDays.length > 0) {
      setInvalidDays(invalidTimeRangeDays);
      toast.error(
        `End time must be later than start time for: ${invalidTimeRangeDays.join(
          ", "
        )}`
      );
      return;
    }

    // Clear invalid days if validation passes
    setInvalidDays([]);

    const sectionData = {
      code: data.code,
      name: data.name,
      course: data.course,
      instructor: data.instructor,
      schedule: {
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        breakdown: selectedDays.map((day) => {
          const schedule = schedules.find((s: ScheduleItem) => s.day === day);
          return {
            day: day.toLowerCase(),
            time: {
              start: schedule?.startTime,
              end: schedule?.endTime,
            },
          };
        }),
      },
    };

    toast.promise(
      createSection.mutateAsync(sectionData, {
        onSuccess: () => {
          navigate(-1);
        },
      }),
      {
        pending: "Creating section...",
        success: "Section created successfully",
        error: {
          render({ data }: { data: any }) {
            return data?.response?.data?.error || "Failed to create section";
          },
        },
      }
    );
  };

  // Handle day toggle and update schedules
  const toggleDay = (day: string) => {
    let updatedDays: string[];
    if (selectedDays.includes(day)) {
      updatedDays = selectedDays.filter((d) => d !== day);
      const updatedSchedules = schedules.filter(
        (s: ScheduleItem) => s.day !== day
      );
      setValue("schedules", updatedSchedules);
      setInvalidDays((prev) => prev.filter((d) => d !== day));
    } else {
      updatedDays = [...selectedDays, day];
      const updatedSchedules: ScheduleItem[] = [
        ...schedules,
        { day, startTime: "", endTime: "" },
      ];
      setValue("schedules", updatedSchedules);
      setInvalidDays((prev) => [...prev, day]);
    }
    setSelectedDays(updatedDays);
  };

  // Handle time changes for a specific day
  const updateScheduleTime = (
    day: string,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const updatedSchedules = schedules.map((s: ScheduleItem) =>
      s.day === day ? { ...s, [field]: value } : s
    );
    if (!updatedSchedules.some((s: ScheduleItem) => s.day === day)) {
      updatedSchedules.push({
        day,
        startTime: field === "startTime" ? value : "",
        endTime: field === "endTime" ? value : "",
      });
    }
    setValue("schedules", updatedSchedules);

    // Clear invalid day if both times are set
    const schedule = updatedSchedules.find((s) => s.day === day);
    if (schedule?.startTime && schedule?.endTime) {
      const isTimeRangeValid =
        calculateDurationMinutes(schedule.startTime, schedule.endTime) > 0;

      if (isTimeRangeValid) {
        setInvalidDays((prev) => prev.filter((d) => d !== day));
      } else {
        setInvalidDays((prev) =>
          prev.includes(day) ? prev : [...prev, day]
        );
      }
    } else {
      setInvalidDays((prev) => prev.filter((d) => d !== day));
    }
  };

  return (
    <div className="max-w-6xl mx-auto pt-16 pb-6 px-4 sm:px-6 lg:py-8 lg:px-8">
      {/* Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 sm:mb-6"
      >
        <FaAngleLeft /> Back to {sectionsTerm}
      </button>

      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Add New {sectionTerm}
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Create a new {sectionTerm.toLowerCase()} with course, instructor, and{" "}
          {learnerTerm.toLowerCase()} information.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section Information */}
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <BiBook className="text-lg sm:text-xl" /> {sectionTerm} Information
          </h2>
          <p className="text-gray-600 text-sm mb-4 sm:mb-6">
            Enter the basic information for this {sectionTerm.toLowerCase()}.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {sectionTerm} Name *
                </label>
                <input
                  {...register("name")}
                  type="text"
                  minLength={3}
                  maxLength={50}
                  placeholder={`e.g. Morning ${sectionTerm}`}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3E5B93] focus:border-transparent"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {sectionTerm} Code *
                </label>
                <div className="relative">
                  <input
                    {...register("code")}
                    minLength={5}
                    maxLength={10}
                    type="text"
                    placeholder={`e.g. ${
                      sectionTerm === "Section" ? "SEC007" : "DEP007"
                    }`}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3E5B93] focus:border-transparent ${
                      errors.code ? "border-red-500" : "border-gray-300"
                    }`}
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
                      <CheckIcon size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" />
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
                  <p className="text-red-500 text-sm mt-1">
                    {errors.code.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={
                    courses?.map((course: ICourse) => ({
                      value: course._id,
                      label: course.title,
                      description: course.code,
                    })) || []
                  }
                  value={watch("course")}
                  onChange={(value) => setValue("course", value)}
                  onSearch={(term) => setCourseSearchTerm(term)}
                  placeholder="Select a course"
                  loading={isLoadingCourses}
                  emptyMessage="No courses available"
                  emptyAction={{
                    label: "Create a new course",
                    path: `/${orgCode}/admin/course?modal=create-course`,
                  }}
                  hasNextPage={hasNextCoursePage}
                  isFetchingNextPage={isFetchingNextCoursePage}
                  onLoadMore={fetchNextCoursePage}
                  paginationInfo={coursesPaginationInfo}
                  type="course"
                  className={`w-full border ${
                    errors.course && !watch("course")
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-[#60B2F0] focus:border-transparent`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={
                    instructors?.map((instructor: IInstructor) => ({
                      value: instructor._id,
                      label: `${instructor.firstName} ${instructor.lastName}`,
                      description: instructor.email,
                    })) || []
                  }
                  value={watch("instructor")}
                  onChange={(value) => setValue("instructor", value)}
                  onSearch={(term) => setInstructorSearchTerm(term)}
                  placeholder="Select an instructor"
                  loading={isLoadingInstructors}
                  emptyMessage={`No ${instructorTerm.toLowerCase()}s available`}
                  emptyAction={{
                    label: `Add a new ${instructorTerm.toLowerCase()}`,
                    path: `/${orgCode}/admin/instructor?modal=create-instructor`,
                  }}
                  hasNextPage={hasNextInstructorPage}
                  isFetchingNextPage={isFetchingNextInstructorPage}
                  onLoadMore={fetchNextInstructorPage}
                  paginationInfo={instructorsPaginationInfo}
                  type="instructor"
                  className={`w-full border ${
                    errors.instructor && !watch("instructor")
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-[#60B2F0] focus:border-transparent`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <BsCalendar3 className="text-lg sm:text-xl" /> Schedule
          </h2>
          <p className="text-gray-600 text-sm mb-4 sm:mb-6">
            Set the schedule for this {sectionTerm.toLowerCase()}.
          </p>

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
                Days *
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
                            ? invalidDays.includes(day)
                              ? "border-red-500 bg-red-100"
                              : "border-primary"
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
                                hasError={
                                  invalidDays.includes(day) &&
                                  !currentStartTime
                                }
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
                                hasError={
                                  invalidDays.includes(day) &&
                                  !currentEndTime
                                }
                                className="w-full sm:w-auto text-xs sm:text-sm"
                              />
                            </div>
                            {day === applySourceDay && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    selectedDays.forEach((selectedDay) => {
                                      if (selectedDay !== day) {
                                        setValue(
                                          `schedules.${selectedDays.indexOf(
                                            selectedDay
                                          )}.startTime`,
                                          currentStartTime
                                        );
                                        setValue(
                                          `schedules.${selectedDays.indexOf(
                                            selectedDay
                                          )}.endTime`,
                                          currentEndTime
                                        );
                                        setInvalidDays((prev) =>
                                          prev.filter((d) => d !== selectedDay)
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="cancel"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto"
            disabled={
              createSection.isPending ||
              isLoadingCourses ||
              isLoadingInstructors
            }
          >
            {createSection.isPending ? "Creating..." : `Create ${sectionTerm}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
