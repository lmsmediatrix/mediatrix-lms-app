import Dialog from "../common/Dialog";
import { ICertificate } from "../../types/interfaces";

interface CertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  certificate: ICertificate | null;
  learnerName: string;
  organizationName?: string;
}

const formatIssueDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function CertificatePreviewModal({
  isOpen,
  onClose,
  onDownload,
  certificate,
  learnerName,
  organizationName,
}: CertificatePreviewModalProps) {
  if (!certificate) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Certificate Preview"
      size="4xl"
      backdrop="darkBlur"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <article className="mx-auto max-w-3xl rounded-lg border-2 border-slate-800 bg-white p-8 shadow-sm">
            <div className="rounded-lg border border-slate-300 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Certificate
              </p>
              <h2 className="mt-3 text-4xl font-semibold text-slate-900">Certificate of Completion</h2>
              <p className="mt-6 text-sm text-slate-600">This certifies that</p>
              <p className="mt-2 text-3xl font-semibold italic text-blue-700">{learnerName}</p>
              <p className="mx-auto mt-4 max-w-xl text-sm text-slate-700">
                {certificate.subtitle || "has successfully completed the program requirements."}
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 text-left text-xs text-slate-700 md:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-800">Certificate No</p>
                  <p>{certificate.certificateNo}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Issue Date</p>
                  <p>{formatIssueDate(certificate.issueDate)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Issuer</p>
                  <p>{certificate.issuerName || organizationName || "LMS"}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Signatory</p>
                  <p>{certificate.signatoryName || "Authorized Signatory"}</p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={onDownload}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Download PDF
          </button>
        </div>
      </div>
    </Dialog>
  );
}

