import FinalGradeBreakdown, {
  FinalGradeBreakdownData,
} from "./FinalGradeBreakdown";
import { IoClose } from "react-icons/io5";

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
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-all duration-200 hover:scale-105 hover:rotate-90 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            onClick={onClose}
            aria-label="Close final grade breakdown"
          >
            <IoClose className="h-4 w-4" />
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
