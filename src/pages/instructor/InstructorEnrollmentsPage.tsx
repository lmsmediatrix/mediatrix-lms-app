import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserPlus } from "react-icons/fa";
import PageHeader from "../../components/common/PageHeader";
import ModernDatePicker from "../../components/common/ModernDatePicker";
import { useAuth } from "../../context/AuthContext";
import { useGetNewEnrollmentsList } from "../../hooks/useMetrics";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";
import { getTerm } from "../../lib/utils";

type EnrollmentItem = {
  _id?: string;
  studentId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  enrolledAt?: string;
  sectionCode: string;
  sectionName: string;
};

const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatEnrolledDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

const formatRangeDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function InstructorEnrollmentsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgCode = currentUser.user.organization.code;
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);
  const learnersTerm = getTerm("learner", orgType, true);
  const today = toLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const dateFrom = `${selectedDate.slice(0, 7)}-01`;
  const dateTo = selectedDate;

  const { data, isPending } = useGetNewEnrollmentsList(
    currentUser.user.id,
    currentUser.user.organization._id,
    dateFrom,
    dateTo,
  );

  const enrollments: EnrollmentItem[] = data?.[0]?.newEnrollmentsList ?? [];
  const selectedRangeLabel = `${formatRangeDate(dateFrom)} to ${formatRangeDate(
    dateTo,
  )}`;
  const isDefaultRange = selectedDate === today;

  const groups = useMemo((): GroupedTableGroup<EnrollmentItem>[] => {
    const grouped = enrollments.reduce<Record<string, EnrollmentItem[]>>(
      (acc, item) => {
        const key = item.sectionCode || "unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {},
    );

    return Object.entries(grouped)
      .map(([sectionCode, items]) => ({
        key: sectionCode,
        title: items[0]?.sectionName || sectionCode,
        rows: items,
        badgeText: `${items.length} new`,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [enrollments]);

  const columns: GroupedTableColumn<EnrollmentItem>[] = [
    {
      key: "employee",
      label: learnerTerm,
      sortable: true,
      filterable: true,
      filterPlaceholder: `Search ${learnerTerm.toLowerCase()}`,
      sortAccessor: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
      filterAccessor: (row) =>
        `${row.firstName || ""} ${row.lastName || ""} ${row.email || ""}`.trim(),
      className: "min-w-[300px]",
      render: (row) => {
        const initials = [row.firstName?.[0], row.lastName?.[0]]
          .filter(Boolean)
          .join("")
          .toUpperCase();
        const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ") || "-";

        return (
          <div className="flex items-center gap-3 min-w-0">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={fullName}
                className="h-9 w-9 rounded-full object-cover shrink-0 border border-gray-100"
              />
            ) : (
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
                  color: "var(--color-primary, #2563eb)",
                }}
              >
                {initials || "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {fullName}
              </p>
              {row.email && (
                <p className="text-xs text-gray-400 truncate">{row.email}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "enrolledAt",
      label: "Enrolled Date",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search enrolled date",
      sortAccessor: (row) =>
        row.enrolledAt ? new Date(row.enrolledAt).getTime() : 0,
      filterAccessor: (row) => formatEnrolledDate(row.enrolledAt),
      render: (row) => (
        <span className="text-sm text-gray-700">
          {formatEnrolledDate(row.enrolledAt)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search status",
      sortAccessor: () => "new",
      filterAccessor: () => "new",
      align: "right",
      render: () => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-success, #10b981) 10%, white 90%)",
            color: "color-mix(in srgb, var(--color-success, #10b981) 80%, black 20%)",
            borderColor:
              "color-mix(in srgb, var(--color-success, #10b981) 25%, white 75%)",
          }}
        >
          New
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader
          onBack={() => navigate(`/${orgCode}/instructor/dashboard`)}
          icon={<FaUserPlus style={{ color: "var(--color-primary, #2563eb)" }} />}
          iconStyle={{
            backgroundColor:
              "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
          }}
          title="New Enrollments"
          subtitle={`${enrollments.length} ${
            enrollments.length === 1
              ? learnerTerm.toLowerCase()
              : learnersTerm.toLowerCase()
          } enrolled`}
          actions={
            <div className="rounded-2xl border border-white/20 bg-[linear-gradient(120deg,var(--color-primary,#2563eb)_0%,color-mix(in_srgb,var(--color-primary,#3b82f6)_72%,black_28%)_100%)] p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <ModernDatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  max={today}
                />
                {!isDefaultRange && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(today)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/30 px-2.5 py-2 text-xs font-medium text-white/70 hover:border-white/50 hover:text-white transition-all"
                  >
                    Today
                  </button>
                )}
              </div>
            </div>
          }
        />

        {isPending ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse"
              >
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-14 bg-gray-50 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-16 shadow-sm text-center">
            <FaUserPlus className="mx-auto text-4xl text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No new enrollments</p>
            <p className="text-sm text-gray-400 mt-1">
              No {learnersTerm.toLowerCase()} enrolled from {selectedRangeLabel}.
            </p>
          </div>
        ) : (
          <GroupedDataTable
            groups={groups}
            columns={columns}
            rowKey={(row, index) =>
              row._id || row.studentId || `${row.sectionCode}-${index}`
            }
            emptyFilteredText={`No matching ${learnersTerm.toLowerCase()} found.`}
            tableMinWidthClassName="min-w-[760px]"
          />
        )}
      </div>
    </div>
  );
}
