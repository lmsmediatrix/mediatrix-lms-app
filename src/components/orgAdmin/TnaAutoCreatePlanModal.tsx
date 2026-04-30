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

type PlannerGapRow = {
  trainingId?: string;
  programName?: string;
  batchName?: string;
  description?: string;
  code?: string;
  titles: string[];
};

interface TnaAutoCreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: PlannerPayload) => Promise<void>;
  isSubmitting?: boolean;
  defaultCourses: PlannerCourseInput[];
}

const buildDefaultGapRows = (courses: PlannerCourseInput[]): PlannerGapRow[] => {
  if (courses.length === 0) {
    return [{ titles: [""] }];
  }

  const grouped = new Map<string, PlannerGapRow>();
  courses.forEach((course, index) => {
    const trainingId = String(course.trainingId || "").trim();
    const key = trainingId || `manual-${index}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.titles.push(String(course.title || ""));
      return;
    }

    grouped.set(key, {
      trainingId: trainingId || undefined,
      programName: course.programName || "",
      batchName: course.batchName || "",
      description: course.description || "",
      code: course.code || "",
      titles: [String(course.title || "")],
    });
  });

  return Array.from(grouped.values()).map((row) => ({
    ...row,
    titles: row.titles.length > 0 ? row.titles : [""],
  }));
};

export default function TnaAutoCreatePlanModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  defaultCourses,
}: TnaAutoCreatePlanModalProps) {
  const [gapRows, setGapRows] = useState<PlannerGapRow[]>(buildDefaultGapRows(defaultCourses));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setGapRows(buildDefaultGapRows(defaultCourses));
    setError("");
  }, [isOpen, defaultCourses]);

  const cleanedCourses = useMemo(
    () =>
      gapRows.flatMap((gap) =>
        gap.titles
          .map((title) => ({
            trainingId: gap.trainingId,
            title: String(title || "").trim(),
            programName: String(gap.programName || "").trim(),
            batchName: String(gap.batchName || "").trim(),
            description: String(gap.description || "").trim(),
            code: String(gap.code || "")
              .trim()
              .toUpperCase(),
          }))
          .filter((course) => course.title.length > 0)
      ),
    [gapRows]
  );

  const updateGapRow = (index: number, patch: Partial<PlannerGapRow>) => {
    setGapRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const updateCourseTitle = (gapIndex: number, titleIndex: number, value: string) => {
    setGapRows((prev) =>
      prev.map((row, index) => {
        if (index !== gapIndex) return row;
        const nextTitles = [...row.titles];
        nextTitles[titleIndex] = value;
        return { ...row, titles: nextTitles };
      })
    );
  };

  const handleAddGap = () => {
    setGapRows((prev) => [
      ...prev,
      {
        titles: [""],
        programName: "",
        batchName: "",
      },
    ]);
  };

  const handleAddCourseTitle = (index: number) => {
    setGapRows((prev) => {
      const source = prev[index];
      if (!source) return prev;
      return [
        ...prev.slice(0, index),
        {
          ...source,
          titles: [...source.titles, ""],
        },
        ...prev.slice(index + 1),
      ];
    });
  };

  const handleRemoveCourseTitle = (gapIndex: number, titleIndex: number) => {
    setGapRows((prev) =>
      prev.map((row, index) => {
        if (index !== gapIndex) return row;
        if (row.titles.length <= 1) return row;
        return {
          ...row,
          titles: row.titles.filter((_, i) => i !== titleIndex),
        };
      })
    );
  };

  const handleRemoveGap = (index: number) => {
    setGapRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
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
      setError("Each training gap must include program name and batch name.");
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
      backdrop="blur"
      size="3xl"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Training Plan Rows</p>
            <Button variant="outline" onClick={handleAddGap} className="px-3 py-1.5 text-xs">
              Add Row
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Use one or more rows per training gap. Click Add Course inside a gap when one training need requires multiple courses.
          </p>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {gapRows.map((gap, index) => (
              <div
                key={`${gap.trainingId || "new"}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Training Gap {index + 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAddCourseTitle(index)}
                      className="h-8 px-2.5 text-xs"
                    >
                      Add Course
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleRemoveGap(index)}
                      disabled={gapRows.length <= 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Remove row"
                    >
                      x
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Program Name
                    </label>
                    <input
                      value={gap.programName || ""}
                      onChange={(event) => updateGapRow(index, { programName: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                      placeholder="Program name"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Batch Name
                    </label>
                    <input
                      value={gap.batchName || ""}
                      onChange={(event) => updateGapRow(index, { batchName: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                      placeholder="Batch name"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Course Titles
                    </label>
                    {gap.titles.map((title, titleIndex) => (
                      <div key={`course-title-${index}-${titleIndex}`} className="flex items-center gap-2">
                        <input
                          value={title}
                          onChange={(event) =>
                            updateCourseTitle(index, titleIndex, event.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                          placeholder={`Course title ${titleIndex + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCourseTitle(index, titleIndex)}
                          disabled={gap.titles.length <= 1}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Remove course title"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Course Code (Optional)
                    </label>
                    <input
                      value={gap.code || ""}
                      onChange={(event) => updateGapRow(index, { code: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                      placeholder="e.g. DEV-101"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Course Description (Optional)
                    </label>
                    <input
                      value={gap.description || ""}
                      onChange={(event) => updateGapRow(index, { description: event.target.value })}
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
