import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useGetLateMissingList } from "../../hooks/useMetrics";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";
import { getTerm } from "../../lib/utils";

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

const formatDueDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

const formatSubmittedAt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "-";

const typeLabel: Record<string, string> = {
  quiz: "Quiz",
  exam: "Exam",
  assignment: "Assignment",
  activity: "Activity",
  monthly_test: "Monthly Test",
  periodical_test: "Periodical Test",
  final_exam: "Final Exam",
};

const statusConfig = {
  late: {
    label: "Late",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  missing: {
    label: "Missing",
    badge: "bg-red-50 text-red-700 border border-red-200",
  },
};

export default function InstructorLateMissingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter") as "late" | "missing" | null;
  const { currentUser } = useAuth();
  const orgCode = currentUser.user.organization.code;
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);

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
      ? "Late Submissions"
      : filterParam === "missing"
        ? "Missing Assignments"
        : "Late & Missing Assignments";

  const subtitle =
    items.length === 0
      ? "No items found"
      : `${items.length} item${items.length !== 1 ? "s" : ""} across your sections`;

  const groups = useMemo((): GroupedTableGroup<LateMissingItem>[] => {
    const grouped = items.reduce<Record<string, LateMissingItem[]>>((acc, item) => {
      const key = item.sectionCode || "unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([sectionCode, sectionItems]) => {
        const lateCount = sectionItems.filter(
          (i) => i.classifiedStatus === "late",
        ).length;
        const missingCount = sectionItems.filter(
          (i) => i.classifiedStatus === "missing",
        ).length;

        const badgeText =
          filterParam === "late"
            ? `${lateCount} late`
            : filterParam === "missing"
              ? `${missingCount} missing`
              : `${lateCount} late | ${missingCount} missing`;

        return {
          key: sectionCode,
          title: sectionItems[0]?.sectionName || sectionCode,
          rows: sectionItems,
          badgeText,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [items, filterParam]);

  const columns: GroupedTableColumn<LateMissingItem>[] = [
    {
      key: "studentName",
      label: learnerTerm,
      sortable: true,
      filterable: true,
      filterPlaceholder: `Search ${learnerTerm.toLowerCase()}`,
      sortAccessor: (row) => row.studentName || "",
      filterAccessor: (row) => row.studentName || "",
      className: "min-w-[220px]",
      render: (row) => (
        <span className="text-sm font-semibold text-gray-800">
          {row.studentName || "-"}
        </span>
      ),
    },
    {
      key: "assessment",
      label: "Assessment",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search assessment",
      sortAccessor: (row) => row.assessmentTitle || "",
      filterAccessor: (row) =>
        `${row.assessmentTitle || ""} ${row.assessmentType || ""}`.trim(),
      className: "min-w-[260px]",
      render: (row) => {
        const label = row.assessmentType
          ? typeLabel[row.assessmentType] || row.assessmentType
          : "";
        return (
          <div className="min-w-0">
            <p className="text-sm text-gray-800 truncate">
              {row.assessmentTitle || "-"}
            </p>
            {label && (
              <p className="text-xs text-gray-400 truncate capitalize">{label}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search due date",
      sortAccessor: (row) => (row.dueDate ? new Date(row.dueDate).getTime() : 0),
      filterAccessor: (row) => formatDueDate(row.dueDate),
      render: (row) => (
        <span className="text-sm text-gray-700">{formatDueDate(row.dueDate)}</span>
      ),
    },
    {
      key: "submittedAt",
      label: "Submitted",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search submitted",
      sortAccessor: (row) =>
        row.submittedAt ? new Date(row.submittedAt).getTime() : 0,
      filterAccessor: (row) => formatSubmittedAt(row.submittedAt),
      render: (row) => (
        <span className="text-sm text-gray-700">
          {row.classifiedStatus === "late" ? formatSubmittedAt(row.submittedAt) : "-"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search status",
      sortAccessor: (row) => statusConfig[row.classifiedStatus]?.label || row.classifiedStatus,
      filterAccessor: (row) =>
        (statusConfig[row.classifiedStatus]?.label || row.classifiedStatus).toLowerCase(),
      align: "right",
      render: (row) => {
        const cfg = statusConfig[row.classifiedStatus];
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}
          >
            {cfg.label}
          </span>
        );
      },
    },
  ];

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
                ? "No late submissions at this time."
                : filterParam === "missing"
                  ? "No missing assignments at this time."
                  : "No late or missing assignments at this time."}
            </p>
          </div>
        ) : (
          <GroupedDataTable
            groups={groups}
            columns={columns}
            rowKey={(row, index) => row._id || `${row.sectionCode}-${index}`}
            emptyFilteredText="No matching rows found."
            tableMinWidthClassName="min-w-[1050px]"
            onRowClick={(row) =>
              navigate(`/${orgCode}/instructor/sections/${row.sectionCode}?tab=grades`)
            }
          />
        )}
      </div>
    </div>
  );
}

