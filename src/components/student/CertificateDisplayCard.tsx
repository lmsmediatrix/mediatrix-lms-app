import { FaDownload, FaRegCalendarAlt } from "react-icons/fa";
import { ICertificate } from "../../types/interfaces";

interface CertificateDisplayCardProps {
  certificate: ICertificate;
  learnerName: string;
  onDownload: (certificate: ICertificate) => void;
}

const toReadableDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function CertificateDisplayCard({
  certificate,
  learnerName,
  onDownload,
}: CertificateDisplayCardProps) {
  const scopeLabel = certificate.scopeType === "lesson" ? "Lesson Certificate" : "Module Certificate";

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative bg-gradient-to-r from-slate-50 via-sky-50 to-blue-50 p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-200/30 blur-2xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {scopeLabel}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Certificate of Completion</h3>
        <p className="mt-1 text-sm text-slate-600">{learnerName}</p>
      </div>

      <div className="space-y-3 p-5">
        <p className="text-sm text-slate-700 line-clamp-2">
          {certificate.subtitle || "Awarded for successful completion."}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700">
            {certificate.certificateNo}
          </span>
          <span className="inline-flex items-center gap-1">
            <FaRegCalendarAlt className="h-3.5 w-3.5" />
            Issued {toReadableDate(certificate.issueDate)}
          </span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => onDownload(certificate)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <FaDownload className="h-3.5 w-3.5" />
            Preview & Download
          </button>
        </div>
      </div>
    </article>
  );
}
