import { useState } from "react";
import {
  useCreateStudentAssessmentGrade,
  useUpdateStudentAssessmentGrade,
} from "../../../hooks/useStudentAssessmentGrade";

interface GradeInputFormProps {
  assessmentId: string;
  studentId: string;
  existingGrade?: {
    _id?: string;
    score?: number;
    totalPoints?: number;
    gradeLabel?: string;
    remarks?: string;
    status?: string;
  };
  onClose?: () => void;
}

const STATUS_OPTIONS = [
  "pending",
  "submitted",
  "graded",
  "returned",
  "late",
] as const;

const GradeInputForm: React.FC<GradeInputFormProps> = ({
  assessmentId,
  studentId,
  existingGrade,
  onClose,
}) => {
  const isEdit = !!existingGrade?._id;

  const [score, setScore] = useState<string>(
    existingGrade?.score !== undefined ? String(existingGrade.score) : "",
  );
  const [totalPoints, setTotalPoints] = useState<string>(
    existingGrade?.totalPoints !== undefined
      ? String(existingGrade.totalPoints)
      : "",
  );
  const [gradeLabel, setGradeLabel] = useState(existingGrade?.gradeLabel ?? "");
  const [remarks, setRemarks] = useState(existingGrade?.remarks ?? "");
  const [status, setStatus] = useState(existingGrade?.status ?? "graded");
  const [formError, setFormError] = useState<string | null>(null);

  const createGrade = useCreateStudentAssessmentGrade();
  const updateGrade = useUpdateStudentAssessmentGrade();

  const isPending = createGrade.isPending || updateGrade.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedScore = parseFloat(score);
    const parsedTotalPoints = parseFloat(totalPoints);

    if (isNaN(parsedScore) || isNaN(parsedTotalPoints)) {
      setFormError("Score and Total Points must be valid numbers.");
      return;
    }

    if (parsedScore < 0 || parsedTotalPoints <= 0) {
      setFormError("Score must be ≥ 0 and Total Points must be > 0.");
      return;
    }

    if (parsedScore > parsedTotalPoints) {
      setFormError("Score cannot exceed Total Points.");
      return;
    }

    try {
      if (isEdit) {
        await updateGrade.mutateAsync({
          _id: existingGrade!._id,
          score: parsedScore,
          totalPoints: parsedTotalPoints,
          gradeLabel: gradeLabel || undefined,
          remarks: remarks || undefined,
          status,
          gradedAt: new Date().toISOString(),
        });
      } else {
        await createGrade.mutateAsync({
          assessmentId,
          studentId,
          score: parsedScore,
          totalPoints: parsedTotalPoints,
          gradeLabel: gradeLabel || undefined,
          remarks: remarks || undefined,
          status,
          submittedAt: new Date().toISOString(),
        });
      }
      onClose?.();
    } catch (err: any) {
      setFormError(err?.message ?? "An error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {formError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Score
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Total Points
          </label>
          <input
            type="number"
            min={1}
            step="any"
            value={totalPoints}
            onChange={(e) => setTotalPoints(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Grade Label (optional)
        </label>
        <input
          type="text"
          value={gradeLabel}
          onChange={(e) => setGradeLabel(e.target.value)}
          placeholder="e.g. A, B+, Passed"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Remarks (optional)
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          placeholder="Instructor feedback..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      <div className="flex justify-end gap-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isPending ? "Saving..." : isEdit ? "Update Grade" : "Submit Grade"}
        </button>
      </div>
    </form>
  );
};

export default GradeInputForm;
