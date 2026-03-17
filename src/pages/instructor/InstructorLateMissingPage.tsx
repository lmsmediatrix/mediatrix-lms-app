import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGetLateMissingList } from "../../hooks/useMetrics";
import PageHeader from "../../components/common/PageHeader";
import { FaExclamationTriangle } from "react-icons/fa";

type LateMissingItem = {
  _id: string;
  studentName: string;
  sectionName: string;
  sectionCode: string;
  assessmentTitle: string;
  assessmentType: string;
  classifiedStatus: "late" | "missing";
  dueDate?: string;
  submittedAt?: string;
};

const formatDueDate = (d: string | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

const formatSubmittedAt = (d: string | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const typeLabel: Record<string, string> = {
  quiz: "Quiz",
  exam: "Exam",
  assignment: "Assignment",
  activity: "Activity",
};

const statusConfig = {
  late: {
    label: "Late",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
  },
  missing: {
    label: "Missing",
    badge: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-400",
  },
};

export default function InstructorLateMissingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter") as "late" | "missing" | null;
  const { currentUser } = useAuth();
  const orgCode = currentUser.user.organization.code;

  const { data, isPending } = useGetLateMissingList(
    currentUser.user.id,
    currentUser.user.organization._id,
  );

  const allItems: LateMissingItem[] = data?.[0]?.lateMissingList ?? [];
  const items =
    filterParam === "late"
      ? allItems.filter((i) => i.classifiedStatus === "late")
      : filterParam === "missing"
        ? allItems.filter((i) => i.classifiedStatus === "missing")
        : allItems;

  const title =
    filterParam === "late"
      ? "Late Assignments"
      : filterParam === "missing"
        ? "Missing Assignments"
        : "Late & Missing Assignments";

  const subtitle =
    items.length === 0
      ? "No items found"
      : `${items.length} item${items.length !== 1 ? "s" : ""} across your sections`;

  // Group by sectionCode
  const grouped = items.reduce<Record<string, LateMissingItem[]>>((acc, item) => {
    const key = item.sectionCode;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const iconColor =
    filterParam === "late"
      ? "text-amber-600"
      : filterParam === "missing"
        ? "text-red-600"
        : "text-orange-600";
  const iconBg =
    filterParam === "late"
      ? "bg-amber-100"
      : filterParam === "missing"
        ? "bg-red-100"
        : "bg-orange-100";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader
          onBack={() => navigate(`/${orgCode}/instructor/dashboard`)}
          icon={<FaExclamationTriangle className={iconColor} />}
          iconBg={iconBg}
          title={title}
          subtitle={subtitle}
        />

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { label: "All", value: null },
            { label: "Late", value: "late" },
            { label: "Missing", value: "missing" },
          ].map(({ label, value }) => {
            const isActive = filterParam === value;
            return (
              <button
                key={label}
                onClick={() => {
                  const path = `/${orgCode}/instructor/late-missing`;
                  navigate(value ? `${path}?filter=${value}` : path);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  isActive
                    ? value === "late"
                      ? "bg-amber-500 text-white border-amber-500"
                      : value === "missing"
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isPending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse"
              >
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-14 bg-gray-50 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-16 shadow-sm text-center">
            <FaExclamationTriangle className="mx-auto text-4xl text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No items found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filterParam === "late"
                ? "No late assignments at this time."
                : filterParam === "missing"
                  ? "No missing assignments at this time."
                  : "No late or missing assignments at this time."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([sectionCode, sectionItems]) => (
              <div
                key={sectionCode}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
              >
                {/* Section header */}
                <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/70 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">
                      {sectionItems[0].sectionName}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">{sectionCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {["late", "missing"].map((s) => {
                      const count = sectionItems.filter(
                        (i) => i.classifiedStatus === s,
                      ).length;
                      if (!count) return null;
                      const cfg = statusConfig[s as "late" | "missing"];
                      return (
                        <span
                          key={s}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badge}`}
                        >
                          {count} {cfg.label.toLowerCase()}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-50">
                  {sectionItems.map((item, idx) => {
                    const cfg = statusConfig[item.classifiedStatus];
                    const typeLabelText = item.assessmentType
                      ? typeLabel[item.assessmentType] ?? item.assessmentType
                      : "";
                    const showTypeBadge =
                      typeLabelText &&
                      typeLabelText.toLowerCase() !==
                        item.assessmentTitle?.toLowerCase();

                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          navigate(
                            `/${orgCode}/instructor/sections/${item.sectionCode}?tab=grades`,
                          )
                        }
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 transition-colors text-left group"
                      >
                        {/* Status dot */}
                        <div
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dot}`}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">
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
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-[11px] text-gray-500">
                            <span>Due: {formatDueDate(item.dueDate)}</span>
                            {item.classifiedStatus === "late" && item.submittedAt && (
                              <span>Submitted: {formatSubmittedAt(item.submittedAt)}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>
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
