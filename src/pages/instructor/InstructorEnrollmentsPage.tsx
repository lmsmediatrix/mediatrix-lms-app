import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGetNewEnrollmentsList } from "../../hooks/useMetrics";
import { FaUserPlus } from "react-icons/fa";
import PageHeader from "../../components/common/PageHeader";

const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function InstructorEnrollmentsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgCode = currentUser.user.organization.code;
  const today = toLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const { data, isPending } = useGetNewEnrollmentsList(
    currentUser.user.id,
    currentUser.user.organization._id,
    selectedDate,
  );

  const students: any[] = data?.[0]?.newEnrollmentsList ?? [];

  const selectedMonthLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const grouped = students.reduce(
    (acc: Record<string, any[]>, item: any) => {
      const key = item.sectionCode;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader
          onBack={() => navigate(`/${orgCode}/instructor/dashboard`)}
          icon={
            <FaUserPlus style={{ color: "var(--color-primary, #2563eb)" }} />
          }
          iconStyle={{
            backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
          }}
          title="New Enrollments"
          subtitle={`${students.length} student${students.length !== 1 ? "s" : ""} enrolled in ${selectedMonthLabel}`}
        />

        {/* Month filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative inline-flex">
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer select-none">
              <FaUserPlus className="text-gray-400 h-3 w-3 shrink-0" />
              <span>{selectedMonthLabel}</span>
            </div>
            <input
              type="month"
              value={selectedDate.slice(0, 7)}
              max={today.slice(0, 7)}
              onChange={(e) => setSelectedDate(e.target.value + "-01")}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
          </div>
          {selectedDate.slice(0, 7) !== today.slice(0, 7) && (
            <button
              onClick={() => setSelectedDate(today)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2.5 py-2 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
            >
              ↺ This Month
            </button>
          )}
        </div>

        {/* Content */}
        {isPending ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-14 bg-gray-50 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-16 shadow-sm text-center">
            <FaUserPlus className="mx-auto text-4xl text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No new enrollments</p>
            <p className="text-sm text-gray-400 mt-1">
              No students enrolled in {selectedMonthLabel}.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([sectionCode, items]) => (
              <div
                key={sectionCode}
                className="rounded-2xl border shadow-sm overflow-hidden"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 4%, white 96%)",
                  borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
                }}
              >
                <div
                  className="px-5 py-3 border-b flex items-center justify-between"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 8%, white 92%)",
                    borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
                  }}
                >
                  <div>
                    <span className="text-sm font-semibold text-gray-800">
                      {items[0].sectionName}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">{sectionCode}</span>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full border"
                    style={{
                      color: "color-mix(in srgb, var(--color-primary, #3b82f6) 80%, black 20%)",
                      backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)",
                      borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 20%, white 80%)",
                    }}
                  >
                    {items.length} new
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 8%, white 92%)" }}>
                  {items.map((item: any, idx: number) => {
                    const enrolledDate = item.enrolledAt
                      ? new Date(item.enrolledAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—";
                    const initials = [item.firstName?.[0], item.lastName?.[0]]
                      .filter(Boolean)
                      .join("")
                      .toUpperCase();
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-4 px-5 py-4 transition-colors bg-white"
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.backgroundColor =
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 5%, white 95%)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.backgroundColor = "white")
                        }
                      >
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.firstName}
                            className="h-9 w-9 rounded-full object-cover shrink-0 border border-gray-100"
                          />
                        ) : (
                          <div
                            className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                            style={{
                              backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
                              color: "var(--color-primary, #2563eb)",
                            }}
                          >
                            {initials || "?"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {[item.firstName, item.lastName].filter(Boolean).join(" ") || "—"}
                          </p>
                          {item.email && (
                            <p className="text-xs text-gray-400 truncate">{item.email}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                            style={{
                              backgroundColor: "color-mix(in srgb, var(--color-success, #10b981) 10%, white 90%)",
                              color: "color-mix(in srgb, var(--color-success, #10b981) 80%, black 20%)",
                              borderColor: "color-mix(in srgb, var(--color-success, #10b981) 25%, white 75%)",
                            }}
                          >
                            New
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{enrolledDate}</p>
                        </div>
                      </div>
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
