import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaFilter,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import { useGetPerformanceDashboard } from "../../hooks/useMetrics";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import { SearchIcon } from "@/components/ui/search-icon";
import { InfoIcon } from "@/components/ui/info-icon";

type PerformanceStudentRow = {
  _id: string;
  name: string;
  email: string;
  section: string;
  gpa: string;
  attendance: number;
  standing: string;
  riskLevel: string;
  avatar?: string;
  progress?: {
    completedLessons: number;
    totalLessons: number;
    completedAssessments: number;
    totalAssessments: number;
    completedModules?: number;
    totalModules?: number;
    percent: number;
  };
};

export default function InstructorPerformancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const isCorporate = orgType === "corporate";
  const sectionTerm = getTerm("group", orgType);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const { data, isLoading } = useGetPerformanceDashboard();

  const students: PerformanceStudentRow[] = data?.students || [];
  const summary = data?.summary || {
    criticalRisk: 0,
    moderateRisk: 0,
    goodStanding: 0,
    classAverageGPA: 0,
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk =
      riskFilter === "all" ||
      student.riskLevel.toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch && matchesRisk;
  });

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getStandingColor = (standing: string) => {
    switch (standing.toLowerCase()) {
      case "probation":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-green-600";
    }
  };

  const getStandingLabel = (standing: string) => {
    if (!isCorporate) return standing;
    switch (standing.toLowerCase()) {
      case "probation":
        return "At Risk";
      case "warning":
        return "Needs Improvement";
      default:
        return "On Track";
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
          Loading performance data...
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Performance Management
          </h1>
          <p className="text-gray-500 mt-1">
            Track student academic performance and risk indicators
          </p>
        </div>
        <div className="flex gap-3">
          {/* Placeholder for future actions like Export */}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Critical Risk",
            value: summary.criticalRisk,
            icon: <FaExclamationTriangle size={20} />,
            colorVar: "--color-danger",
            fallback: "#ef4444",
          },
          {
            label: "Moderate Risk",
            value: summary.moderateRisk,
            icon: <InfoIcon size={20} />,
            colorVar: "--color-warning",
            fallback: "#f59e0b",
          },
          {
            label: "Good Standing",
            value: summary.goodStanding,
            icon: <FaCheckCircle size={20} />,
            colorVar: "--color-success",
            fallback: "#10b981",
          },
          {
            label: "Class Average GPA",
            value: Number(summary.classAverageGPA || 0).toFixed(2),
            icon: <span className="text-base font-bold">AVG</span>,
            colorVar: "--color-primary",
            fallback: "#3b82f6",
          },
        ].map(({ label, value, icon, colorVar, fallback }) => {
          const c = `var(${colorVar}, ${fallback})`;
          return (
            <div
              key={label}
              className="p-4 rounded-xl border shadow-sm"
              style={{
                backgroundColor: `color-mix(in srgb, ${c} 6%, white 94%)`,
                borderColor: `color-mix(in srgb, ${c} 20%, white 80%)`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${c} 12%, white 88%)`,
                    color: `color-mix(in srgb, ${c} 85%, black 15%)`,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{label}</p>
                  <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div
        className="p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 4%, white 96%)",
          borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
        }}
      >
        <div className="relative w-full md:w-96">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white appearance-none cursor-pointer"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border shadow-sm overflow-hidden"
        style={{
          borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="border-b"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 6%, white 94%)",
                  borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
                }}
              >
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {sectionTerm}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  GPA
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {isCorporate ? "Performance Status" : "Academic Standing"}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className="bg-white divide-y"
              style={{ borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)" }}
            >
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student._id}
                    className="transition-colors hover:brightness-[0.97]"
                    style={{
                      backgroundColor: "white",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "color-mix(in srgb, var(--color-primary, #3b82f6) 4%, white 96%)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "white")
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{
                            backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
                            color: "var(--color-primary, #2563eb)",
                          }}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)",
                          color: "color-mix(in srgb, var(--color-primary, #3b82f6) 80%, black 20%)",
                        }}
                      >
                        {student.section}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {student.gpa}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${student.attendance < 75 ? "bg-red-500" : "bg-green-500"}`}
                            style={{ width: `${student.attendance}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {student.attendance}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.progress ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${student.progress.percent}%`,
                                  backgroundColor:
                                    student.progress.percent === 0
                                      ? "#9ca3af"
                                      : student.progress.percent === 100
                                        ? "var(--color-success, #10b981)"
                                        : student.progress.percent < 50
                                          ? "var(--color-warning, #f59e0b)"
                                          : "var(--color-primary, #3b82f6)",
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">
                              {student.progress.percent}%
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {student.progress.completedLessons}/
                            {student.progress.totalLessons} lessons &middot;{" "}
                            {student.progress.completedAssessments}/
                            {student.progress.totalAssessments} assessments
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${getStandingColor(
                          student.standing,
                        )}`}
                      >
                        {getStandingLabel(student.standing)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRiskColor(
                          student.riskLevel,
                        )}`}
                      >
                        {student.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() =>
                          navigate(`${location.pathname}/${student._id}`)
                        }
                        className="font-medium transition-opacity hover:opacity-75"
                        style={{ color: "var(--color-primary, #2563eb)" }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No students found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
