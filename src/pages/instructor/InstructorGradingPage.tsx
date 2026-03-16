import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGetGradingQueueList } from "../../hooks/useMetrics";
import { FaClipboardCheck } from "react-icons/fa";
import PageHeader from "../../components/common/PageHeader";

type Submission = {
  _id: string;
  status: string;
  submittedAt?: string;
  sectionName: string;
  sectionCode: string;
  assessmentTitle: string;
  assessmentType: string;
  studentName: string;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  submitted: {
    label: "Submitted",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  late: {
    label: "Late",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
};

const typeLabel: Record<string, string> = {
  quiz: "Quiz",
  exam: "Exam",
  assignment: "Assignment",
  activity: "Activity",
};

export default function InstructorGradingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgCode = currentUser.user.organization.code;

  const { data, isPending } = useGetGradingQueueList(
    currentUser.user.id,
    currentUser.user.organization._id,
  );

  const submissions: Submission[] = data?.[0]?.gradingQueueList ?? [];

  const grouped = submissions.reduce<Record<string, Submission[]>>((acc, item) => {
    const key = item.sectionCode;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader
          onBack={() => navigate(`/${orgCode}/instructor/dashboard`)}
          icon={<FaClipboardCheck className="text-blue-600" />}
          iconBg="bg-blue-100"
          title="Pending Grading"
          subtitle={`${submissions.length} submission${submissions.length !== 1 ? "s" : ""} awaiting review`}
        />

        {/* Content */}
        {isPending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-14 bg-gray-50 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-16 shadow-sm text-center">
            <FaClipboardCheck className="mx-auto text-4xl text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No pending submissions</p>
            <p className="text-sm text-gray-400 mt-1">All assessments have been graded.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([sectionCode, items]) => (
              <div
                key={sectionCode}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/70 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">
                      {items[0].sectionName}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">{sectionCode}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">
                    {items.length} pending
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((item, idx) => {
                    const cfg = statusConfig[item.status] ?? statusConfig.submitted;
                    const submittedDate = item.submittedAt
                      ? new Date(item.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "—";
                    // Only show type badge if it differs from the title (avoid "Assignment · Assignment")
                    const typeLabelText = item.assessmentType
                      ? typeLabel[item.assessmentType] ?? item.assessmentType
                      : "";
                    const showTypeBadge =
                      typeLabelText &&
                      typeLabelText.toLowerCase() !== item.assessmentTitle?.toLowerCase();
                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          navigate(
                            `/${orgCode}/instructor/sections/${item.sectionCode}?tab=grades`,
                          )
                        }
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-blue-50/40 transition-colors text-left group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                            {item.studentName || "—"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-500 truncate">
                              {item.assessmentTitle || "—"}
                            </span>
                            {showTypeBadge && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 capitalize">
                                {typeLabelText}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}
                          >
                            {cfg.label}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{submittedDate}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
