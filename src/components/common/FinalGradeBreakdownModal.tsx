import FinalGradeBreakdown, {
  FinalGradeBreakdownData,
} from "./FinalGradeBreakdown";

type FinalGradeBreakdownModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subTitle?: string;
  data?: FinalGradeBreakdownData | null;
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
};

export default function FinalGradeBreakdownModal({
  isOpen,
  onClose,
  title = "Final Grade Breakdown",
  subTitle,
  data,
  isLoading = false,
  error = "",
  emptyMessage = "No breakdown data available.",
}: FinalGradeBreakdownModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {subTitle ? <p className="text-xs text-slate-500">{subTitle}</p> : null}
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {isLoading ? (
          <div className="mt-4 animate-pulse space-y-2.5">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-52 rounded bg-slate-200" />
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="h-4 w-36 rounded bg-slate-200" />
              <div className="mt-2 h-12 rounded bg-slate-200" />
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-72 rounded bg-slate-200" />
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-80 rounded bg-slate-200" />
            </div>
          </div>
        ) : error ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </div>
        ) : data ? (
          <FinalGradeBreakdown data={data} />
        ) : (
          <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
