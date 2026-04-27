import { useEffect, useMemo, useState } from "react";
import Dialog from "../common/Dialog";
import Button from "../common/Button";

type PlannerCourseInput = {
  trainingId?: string;
  title: string;
  programName?: string;
  batchName?: string;
  description?: string;
  code?: string;
};

type PlannerPayload = {
  courses: PlannerCourseInput[];
};

interface TnaAutoCreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: PlannerPayload) => Promise<void>;
  isSubmitting?: boolean;
  defaultCourses: PlannerCourseInput[];
}

const buildDefaultCourses = (courses: PlannerCourseInput[]): PlannerCourseInput[] => {
  if (courses.length > 0) return courses;
  return [{ title: "" }];
};

export default function TnaAutoCreatePlanModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  defaultCourses,
}: TnaAutoCreatePlanModalProps) {
  const [courses, setCourses] = useState<PlannerCourseInput[]>(buildDefaultCourses(defaultCourses));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCourses(buildDefaultCourses(defaultCourses));
    setError("");
  }, [isOpen, defaultCourses]);

  const cleanedCourses = useMemo(
    () =>
      courses
        .map((course) => ({
          trainingId: course.trainingId,
          title: String(course.title || "").trim(),
          programName: String(course.programName || "").trim(),
          batchName: String(course.batchName || "").trim(),
          description: String(course.description || "").trim(),
          code: String(course.code || "")
            .trim()
            .toUpperCase(),
        }))
        .filter((course) => course.title.length > 0),
    [courses]
  );

  const updateCourse = (index: number, patch: Partial<PlannerCourseInput>) => {
    setCourses((prev) => prev.map((course, i) => (i === index ? { ...course, ...patch } : course)));
  };

  const handleAddCourse = () => {
    setCourses((prev) => [...prev, { title: "", programName: "", batchName: "" }]);
  };

  const handleRemoveCourse = (index: number) => {
    setCourses((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleConfirm = async () => {
    if (cleanedCourses.length === 0) {
      setError("At least one course title is required.");
      return;
    }

    const uniqueTitleSet = new Set(cleanedCourses.map((course) => course.title.toLowerCase()));
    if (uniqueTitleSet.size !== cleanedCourses.length) {
      setError("Duplicate course titles are not allowed.");
      return;
    }

    const hasMissingProgramOrBatch = cleanedCourses.some(
      (course) => !course.programName || !course.batchName
    );
    if (hasMissingProgramOrBatch) {
      setError("Each course row must include program name and batch name.");
      return;
    }

    setError("");
    await onConfirm({
      courses: cleanedCourses,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isSubmitting ? () => undefined : onClose}
      title="Plan Auto Create"
      subTitle="Each training gap can create its own Program, Course, and Batch."
      size="3xl"
      backdrop="darkBlur"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Training Plan Rows</p>
            <Button variant="outline" onClick={handleAddCourse} className="px-3 py-1.5 text-xs">
              Add Row
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Fill one row per training gap to create separate Program, Course, and Batch entries.
          </p>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {courses.map((course, index) => (
              <div
                key={`${course.trainingId || "new"}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Training Gap {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveCourse(index)}
                    disabled={courses.length <= 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Remove row"
                  >
                    x
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Program Name
                    </label>
                    <input
                      value={course.programName || ""}
                      onChange={(event) => updateCourse(index, { programName: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                      placeholder="Program name"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Batch Name
                    </label>
                    <input
                      value={course.batchName || ""}
                      onChange={(event) => updateCourse(index, { batchName: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                      placeholder="Batch name"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Course Title
                    </label>
                    <input
                      value={course.title || ""}
                      onChange={(event) => updateCourse(index, { title: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                      placeholder="Course title"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Course Code (Optional)
                    </label>
                    <input
                      value={course.code || ""}
                      onChange={(event) => updateCourse(index, { code: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                      placeholder="e.g. DEV-101"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Course Description (Optional)
                    </label>
                    <input
                      value={course.description || ""}
                      onChange={(event) => updateCourse(index, { description: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                      placeholder="Short description"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[108px]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            isLoadingText="Running..."
            className="min-w-[160px]"
          >
            Confirm Auto Create
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
