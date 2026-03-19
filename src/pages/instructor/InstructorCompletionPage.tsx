import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetPerformanceDashboard } from "../../hooks/useMetrics";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import PageHeader from "../../components/common/PageHeader";
import { ChartBarIcon } from "@/components/ui/chart-bar-icon";

type CompletionType = "lessons" | "modules" | "assessments" | "sections";

const baseLabelMap: Omit<Record<CompletionType, string>, "sections"> = {
  lessons: "Lessons",
  modules: "Modules",
  assessments: "Assessments",
};

interface StudentEntry {
  _id: string;
  name: string;
  email: string;
  section: string;
  sectionName?: string;
  progress?: {
    completedLessons?: number;
    totalLessons?: number;
    completedModules?: number;
    totalModules?: number;
    completedAssessments?: number;
    totalAssessments?: number;
    percent?: number;
  };
}

interface SectionGroup {
  sectionCode: string;
  sectionName: string;
  students: StudentEntry[];
  completedCount: number;
}

export default function InstructorCompletionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const orgCode = currentUser.user.organization.code;
  const orgType = currentUser.user.organization.type;
  const sectionTerm = getTerm("group", orgType);
  const sectionsTerm = getTerm("group", orgType, true);
  const labelMap: Record<CompletionType, string> = {
    ...baseLabelMap,
    sections: sectionsTerm,
  };
  const typeParam = (searchParams.get("type") || "lessons").toLowerCase();
  const completionType = (["lessons", "modules", "assessments", "sections"].includes(typeParam)
    ? typeParam
    : "lessons") as CompletionType;
  const sectionCode = searchParams.get("sectionCode") || undefined;

  const { data, isLoading } = useGetPerformanceDashboard(sectionCode);
  const students: StudentEntry[] = data?.students || [];

  function getCompletionStats(student: StudentEntry) {
    const progress = student.progress;
    if (!progress) return { value: 0, total: 0, percent: 0 };
    switch (completionType) {
      case "lessons": {
        const value = progress.completedLessons || 0;
        const total = progress.totalLessons || 0;
        return { value, total, percent: total > 0 ? Math.round((value / total) * 100) : 0 };
      }
      case "modules": {
        const value = progress.completedModules || 0;
        const total = progress.totalModules || 0;
        return { value, total, percent: total > 0 ? Math.round((value / total) * 100) : 0 };
      }
      case "assessments": {
        const value = progress.completedAssessments || 0;
        const total = progress.totalAssessments || 0;
        return { value, total, percent: total > 0 ? Math.round((value / total) * 100) : 0 };
      }
      case "sections": {
        const percent = progress.percent || 0;
        return { value: percent, total: 100, percent };
      }
      default:
        return { value: 0, total: 0, percent: 0 };
    }
  }

  function isCompleted(student: StudentEntry) {
    const p = student.progress;
    if (!p) return false;
    switch (completionType) {
      case "lessons": return (p.completedLessons || 0) > 0;
      case "modules": return (p.completedModules || 0) > 0;
      case "assessments": return (p.completedAssessments || 0) > 0;
      case "sections": {
        const total = (p.totalLessons || 0) + (p.totalAssessments || 0);
        return total > 0 && p.percent === 100;
      }
      default: return false;
    }
  }

  // Group students by section, sorted within each group by progress desc
  const sectionGroups = useMemo((): SectionGroup[] => {
    const map = new Map<string, SectionGroup>();
    for (const student of students) {
      const key = student.section || "Unknown";
      if (!map.has(key)) {
        map.set(key, {
          sectionCode: key,
          sectionName: student.sectionName || key,
          students: [],
          completedCount: 0,
        });
      }
      map.get(key)!.students.push(student);
    }
    // Sort students within each section by percent desc, then count completed
    const groups = Array.from(map.values());
    for (const group of groups) {
      group.students.sort((a, b) => getCompletionStats(b).percent - getCompletionStats(a).percent);
      group.completedCount = group.students.filter(isCompleted).length;
    }
    // Sort sections by name
    groups.sort((a, b) => a.sectionName.localeCompare(b.sectionName));
    return groups;
  }, [students, completionType]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCompleted = useMemo(() => students.filter(isCompleted).length, [students, completionType]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          onBack={() => navigate(`/${orgCode}/instructor/dashboard`)}
          icon={
            <ChartBarIcon size={16} style={{ color: "var(--color-primary, #2563eb)" }} />
          }
          iconStyle={{
            backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
          }}
          title={`${labelMap[completionType]} Progress`}
          subtitle={`${totalCompleted} of ${students.length} student${students.length !== 1 ? "s" : ""} completed · ${sectionCode ? `${sectionTerm}: ${sectionCode}` : `All ${sectionsTerm.toLowerCase()}`}`}
        />

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
                <div className="px-5 py-3 bg-gray-50 h-10" />
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-4 px-5 py-4 border-t border-gray-50">
                    <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                    <div className="h-3 bg-gray-100 rounded w-32" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-16 shadow-sm text-center">
            <ChartBarIcon size={36} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No students enrolled</p>
            <p className="text-sm text-gray-400 mt-1">No students found in your {sectionsTerm.toLowerCase()}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sectionGroups.map((group) => (
              <div
                key={group.sectionCode}
                className="rounded-2xl border shadow-sm overflow-hidden"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 4%, white 96%)",
                  borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
                }}
              >
                {/* Section header */}
                <div
                  className="flex items-center justify-between px-5 py-3 border-b"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 8%, white 92%)",
                    borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {group.sectionName}
                    </span>
                    {group.sectionName !== group.sectionCode && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)",
                          color: "color-mix(in srgb, var(--color-primary, #3b82f6) 70%, black 30%)",
                        }}
                      >
                        {group.sectionCode}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full border"
                    style={{
                      color: "color-mix(in srgb, var(--color-primary, #3b82f6) 80%, black 20%)",
                      backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)",
                      borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 20%, white 80%)",
                    }}
                  >
                    {group.completedCount} / {group.students.length} completed
                  </span>
                </div>

                {/* Students */}
                <div className="divide-y bg-white" style={{ borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 8%, white 92%)" }}>
                  {group.students.map((student) => {
                    const stats = getCompletionStats(student);
                    const initials = student.name?.charAt(0)?.toUpperCase() || "?";

                    const barStyle: React.CSSProperties =
                      stats.percent >= 100
                        ? { backgroundColor: "var(--color-success, #10b981)" }
                        : stats.percent > 0
                        ? { backgroundColor: "var(--color-primary, #3b82f6)" }
                        : { backgroundColor: "#d1d5db" };

                    const avatarStyle: React.CSSProperties =
                      stats.percent >= 100
                        ? {
                            backgroundColor: "color-mix(in srgb, var(--color-success, #10b981) 12%, white 88%)",
                            color: "color-mix(in srgb, var(--color-success, #10b981) 80%, black 20%)",
                          }
                        : stats.percent > 0
                        ? {
                            backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
                            color: "var(--color-primary, #2563eb)",
                          }
                        : { backgroundColor: "#f3f4f6", color: "#6b7280" };

                    const statusBadge =
                      stats.percent >= 100
                        ? {
                            label: "Completed",
                            style: {
                              backgroundColor: "color-mix(in srgb, var(--color-success, #10b981) 10%, white 90%)",
                              color: "color-mix(in srgb, var(--color-success, #10b981) 80%, black 20%)",
                              borderColor: "color-mix(in srgb, var(--color-success, #10b981) 25%, white 75%)",
                            },
                          }
                        : stats.percent > 0
                        ? {
                            label: "In Progress",
                            style: {
                              backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)",
                              color: "var(--color-primary, #2563eb)",
                              borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 20%, white 80%)",
                            },
                          }
                        : {
                            label: "Not Started",
                            style: {
                              backgroundColor: "#f9fafb",
                              color: "#6b7280",
                              borderColor: "#e5e7eb",
                            },
                          };

                    return (
                      <div
                        key={student._id}
                        className="flex items-center gap-4 px-5 py-4 transition-colors"
                        style={{ backgroundColor: "white" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.backgroundColor =
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 4%, white 96%)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.backgroundColor = "white")
                        }
                      >
                        {/* Avatar + name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={avatarStyle}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{student.name}</p>
                            <p className="text-xs text-gray-400 truncate">{student.email}</p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3 w-48 shrink-0">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${stats.percent}%`, ...barStyle }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 tabular-nums w-10 text-right shrink-0">
                            {completionType === "sections" ? `${stats.percent}%` : `${stats.value}/${stats.total}`}
                          </span>
                        </div>

                        {/* Status badge */}
                        <div className="w-28 shrink-0">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                            style={statusBadge.style}
                          >
                            {statusBadge.label}
                          </span>
                        </div>

                        {/* Action */}
                        <div className="shrink-0">
                          <button
                            onClick={() => navigate(`/${orgCode}/instructor/completion/${student._id}`)}
                            className="text-xs font-medium hover:underline transition-colors"
                            style={{ color: "var(--color-primary, #2563eb)" }}
                          >
                            View Details
                          </button>
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
