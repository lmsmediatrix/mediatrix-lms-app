import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaClipboardList,
  FaExclamationTriangle,
  FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import {
  useCreatePerformanceActionPlan,
  useGetStudentPerformanceDetails,
} from "../../hooks/useMetrics";

type StudentPerformanceDetails = {
  _id: string;
  name: string;
  email: string;
  idNumber: string;
  program: string;
  section: string;
  gpa: number;
  riskLevel: string;
  attendance: number;
  missingAssignments: number;
  gpaTrend: Array<{ term: string; gpa: number }>;
  riskFactors: string[];
  courseBreakdown: Array<{
    course: string;
    section?: string;
    grade: number;
    status: string;
    progress?: {
      completedLessons: number;
      totalLessons: number;
      completedAssessments: number;
      totalAssessments: number;
      percent: number;
    };
  }>;
};

const FALLBACK_STUDENT: StudentPerformanceDetails = {
  _id: "",
  name: "Learner",
  email: "",
  idNumber: "N/A",
  program: "N/A",
  section: "N/A",
  gpa: 0,
  riskLevel: "Low",
  attendance: 0,
  missingAssignments: 0,
  gpaTrend: [{ term: "Current", gpa: 0 }],
  riskFactors: ["No risk factors detected"],
  courseBreakdown: [],
};

export default function AdminStudentPerformanceDetails() {
  const navigate = useNavigate();
  const { studentId = "" } = useParams<{ studentId: string }>();
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);
  const {
    data: student,
    isLoading,
    isError,
  } = useGetStudentPerformanceDetails(studentId);
  const createActionPlan = useCreatePerformanceActionPlan();

  const details =
    (student as StudentPerformanceDetails | undefined) || FALLBACK_STUDENT;
  const isValidStudentId = /^[a-fA-F0-9]{24}$/.test(studentId);

  const handleCreateActionPlan = () => {
    if (!isValidStudentId) {
      toast.error(
        `Invalid ${learnerTerm.toLowerCase()} ID. Please open this page from the performance list.`,
      );
      return;
    }

    if (!student) {
      toast.error(`${learnerTerm} details are not ready yet.`);
      return;
    }

    const sectionCode = details.section?.split(",")[0]?.trim();

    toast.promise(
      createActionPlan.mutateAsync({
        studentId,
        sectionCode: sectionCode || undefined,
        title: `Action Plan for ${details.name}`,
        summary: "Created from admin performance details page.",
        riskLevel:
          details.riskLevel === "Critical" ||
          details.riskLevel === "Moderate" ||
          details.riskLevel === "Low"
            ? details.riskLevel
            : undefined,
      }),
      {
        pending: "Creating action plan...",
        success: "Action plan created successfully.",
        error: "Failed to create action plan.",
      },
    );
  };

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

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
          Loading performance details...
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load {learnerTerm.toLowerCase()} performance details.
        </div>
      )}
      {!isLoading && !student && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          {learnerTerm} not found.
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
      >
        <FaArrowLeft /> Back to Performance List
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
            {details.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{details.name}</h1>
            <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1">
              <span>ID: {details.idNumber}</span>
              <span>|</span>
              <span>{details.program}</span>
              <span>|</span>
              <span>{details.section}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <FaEnvelope className="mr-2" /> Message {learnerTerm}
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateActionPlan}
            isLoading={createActionPlan.isPending}
            isLoadingText="Creating..."
            disabled={!isValidStudentId}
          >
            <FaClipboardList className="mr-2" /> Create Action Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">
              Academic Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Current GPA</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(details.gpa || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Risk Level</p>
                <span
                  className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${getRiskColor(
                    details.riskLevel,
                  )}`}
                >
                  {details.riskLevel}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Attendance</p>
                <p
                  className={`text-2xl font-bold ${
                    details.attendance < 75 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {details.attendance}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Missing Tasks</p>
                <p className="text-2xl font-bold text-red-600">
                  {details.missingAssignments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
            <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-4">
              <FaExclamationTriangle /> Detected Risk Factors
            </h3>
            <ul className="space-y-3">
              {details.riskFactors.map((factor, idx) => (
                <li
                  key={`${factor}-${idx}`}
                  className="flex items-start gap-3 bg-red-50 p-3 rounded-lg text-sm text-red-700"
                >
                  <span className="mt-0.5">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-6 border-b pb-2">
            GPA Trend
          </h3>
          <div className="h-64 w-full flex items-end justify-between gap-2 px-4">
            {details.gpaTrend.map((item, idx) => {
              const heightPercentage = (item.gpa / 4.0) * 100;
              return (
                <div
                  key={`${item.term}-${idx}`}
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <div
                    className="w-full bg-blue-100 rounded-t-md relative group hover:bg-blue-200 transition-colors"
                    style={{ height: `${heightPercentage}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.gpa}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium text-center">
                    {item.term}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-center text-gray-500">
            * GPA Scale: 0.0 - 4.0
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center justify-between">
            <span>Course Breakdown</span>
            <FaCalendarAlt className="text-gray-400" />
          </h3>
          <div className="space-y-4">
            {details.courseBreakdown.map((course, idx) => (
              <div
                key={`${course.course}-${idx}`}
                className="p-3 bg-gray-50 rounded-lg space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{course.course}</p>
                    <p
                      className={`text-xs ${
                        course.status === "Failing"
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                    >
                      {course.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-800">
                      {Number(course.grade || 0).toFixed(2)}
                    </span>
                    <p className="text-xs text-gray-500">GPA</p>
                  </div>
                </div>
                {course.progress && (
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            course.progress.percent === 0
                              ? "bg-gray-400"
                              : course.progress.percent < 50
                                ? "bg-orange-500"
                                : course.progress.percent < 100
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                          }`}
                          style={{ width: `${course.progress.percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {course.progress.percent}%
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {course.progress.completedLessons}/
                      {course.progress.totalLessons} lessons &middot;{" "}
                      {course.progress.completedAssessments}/
                      {course.progress.totalAssessments} assessments
                    </p>
                  </div>
                )}
              </div>
            ))}
            {details.courseBreakdown.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No courses found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
