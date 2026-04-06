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
    percent: number;
  };
};

export default function AdminPerformancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const isCorporate = orgType === "corporate";
  const sectionTerm = getTerm("group", orgType);
  const learnerTerm = getTerm("learner", orgType);
  const learnersTerm = getTerm("learner", orgType, true);
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
            Compliance Management
          </h1>
          <p className="text-gray-500 mt-1">
            Oversee {learnerTerm.toLowerCase()} compliance indicators and risk levels across the
            organization.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-lg text-red-600">
              <FaExclamationTriangle size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Critical Risk</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {summary.criticalRisk}
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
              <InfoIcon size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Moderate Risk</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {summary.moderateRisk}
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <FaCheckCircle size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Good Standing</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {summary.goodStanding}
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <span className="text-xl font-bold">AVG</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Org Average GPA
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {Number(summary.classAverageGPA || 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${learnersTerm.toLowerCase()}...`}
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
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {learnerTerm}
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
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
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
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
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
                                className={`h-full rounded-full ${
                                  student.progress.percent === 0
                                    ? "bg-gray-400"
                                    : student.progress.percent < 50
                                      ? "bg-orange-500"
                                      : student.progress.percent < 100
                                        ? "bg-blue-500"
                                        : "bg-green-500"
                                }`}
                                style={{
                                  width: `${student.progress.percent}%`,
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
                        className="text-primary hover:text-primary/80 font-medium"
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
                    No {learnersTerm.toLowerCase()} found matching your filters.
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
