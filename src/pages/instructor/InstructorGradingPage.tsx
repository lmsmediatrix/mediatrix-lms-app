import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaClipboardCheck } from "react-icons/fa";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useGetGradingQueueList } from "../../hooks/useMetrics";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";
import { getTerm } from "../../lib/utils";

type Submission = {
  _id: string;
  status: string;
  submittedAt?: string;
  dueDate?: string;
  assessmentId: string;
  studentId: string;
  gradeMethod?: string;
  assessmentNo?: number | null;
  sectionName: string;
  sectionCode: string;
  assessmentTitle: string;
  assessmentType: string;
  studentName: string;
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
  monthly_test: "Monthly Test",
  periodical_test: "Periodical Test",
  final_exam: "Final Exam",
};

export default function InstructorGradingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");
  const { currentUser } = useAuth();
  const orgCode = currentUser.user.organization.code;
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);

  const { data, isPending } = useGetGradingQueueList(
    currentUser.user.id,
    currentUser.user.organization._id,
  );

  const allSubmissions: Submission[] = data?.[0]?.gradingQueueList ?? [];
  const submissions =
    filterParam === "late"
      ? allSubmissions.filter((s) => s.status === "late")
      : allSubmissions;

  const groups = useMemo((): GroupedTableGroup<Submission>[] => {
    const grouped = submissions.reduce<Record<string, Submission[]>>((acc, item) => {
      const key = item.sectionCode || "unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([sectionCode, items]) => ({
        key: sectionCode,
        title: items[0]?.sectionName || sectionCode,
        rows: items,
        badgeText:
          filterParam === "late" ? `${items.length} late` : `${items.length} pending`,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [submissions, filterParam]);

  const columns: GroupedTableColumn<Submission>[] = [
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
        <span className="text-sm font-semibold text-gray-800">{row.studentName || "-"}</span>
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
            <p className="text-sm text-gray-800 truncate">{row.assessmentTitle || "-"}</p>
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
        <span className="text-sm text-gray-700">{formatSubmittedAt(row.submittedAt)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search status",
      sortAccessor: (row) => statusConfig[row.status]?.label || row.status || "",
      filterAccessor: (row) =>
        (statusConfig[row.status]?.label || row.status || "").toLowerCase(),
      align: "right",
      render: (row) => {
        const cfg = statusConfig[row.status] || statusConfig.submitted;
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}
          >
            {cfg.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader
          onBack={() => navigate(`/${orgCode}/instructor/dashboard`)}
          icon={
            <FaClipboardCheck
              className={filterParam === "late" ? "text-amber-600" : "text-blue-600"}
            />
          }
          iconBg={filterParam === "late" ? "bg-amber-100" : "bg-blue-100"}
          title={filterParam === "late" ? "Late Submissions" : "Pending Grading"}
          subtitle={`${submissions.length} submission${submissions.length !== 1 ? "s" : ""} awaiting review`}
        />

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
        ) : submissions.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-16 shadow-sm text-center">
            <FaClipboardCheck className="mx-auto text-4xl text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">
              {filterParam === "late" ? "No late submissions" : "No pending submissions"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {filterParam === "late"
                ? "No submissions were submitted late."
                : "All assessments have been graded."}
            </p>
          </div>
        ) : (
          <GroupedDataTable
            groups={groups}
            columns={columns}
            rowKey={(row, index) => row._id || `${row.assessmentId}-${row.studentId}-${index}`}
            emptyFilteredText="No matching submissions found."
            tableMinWidthClassName="min-w-[1050px]"
            onRowClick={(row) =>
              navigate(
                `/${orgCode}/instructor/sections/${row.sectionCode}/assessment/${row.assessmentId}/student/${row.studentId}`,
                {
                  state: {
                    assessmentNo: row.assessmentNo,
                    assessmentType: row.assessmentType,
                  },
                },
              )
            }
          />
        )}
      </div>
    </div>
  );
}

