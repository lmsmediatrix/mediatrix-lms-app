type FinalGradeAssessmentItem = {
  assessmentId: string;
  title: string;
  type: string;
  score: number | null;
  totalPoints: number | null;
  percentage: number | null;
  attempted: boolean;
};

export type FinalGradeBreakdownData = {
  attendance?: string | null;
  attendanceDetails?: {
    presentDays: number;
    totalDays: number;
  } | null;
  assessmentBreakdown?: FinalGradeAssessmentItem[];
  gradeComputation?: string | null;
  percentageComputation?: string | null;
};

type FinalGradeBreakdownProps = {
  data: FinalGradeBreakdownData;
};

export default function FinalGradeBreakdown({ data }: FinalGradeBreakdownProps) {
  const attendanceText = data.attendanceDetails
    ? `${data.attendanceDetails.presentDays}/${data.attendanceDetails.totalDays} days (${data.attendance || "--"}%)`
    : data.attendance
      ? `${data.attendance}%`
      : "No attendance records yet";

  const assessmentItems = Array.isArray(data.assessmentBreakdown)
    ? data.assessmentBreakdown
    : [];

  return (
    <div className="mt-2 space-y-2.5">
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <p className="text-xs font-semibold text-slate-700">Attendance breakdown</p>
        <p className="mt-1 text-sm text-slate-800">{attendanceText}</p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <p className="text-xs font-semibold text-slate-700">Assessment grades</p>
        {assessmentItems.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">No assessments found for this employee.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {assessmentItems.map((item) => (
              <div
                key={item.assessmentId}
                className="rounded border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700"
              >
                <p className="font-medium text-slate-800">
                  {item.title} ({item.type})
                </p>
                <p className="mt-0.5">
                  {item.attempted
                    ? `Score: ${item.score ?? "--"} / ${item.totalPoints ?? "--"} (${item.percentage ?? "--"}%)`
                    : "Not attempted"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <p className="text-xs font-semibold text-slate-700">Grade mapping</p>
        <p className="mt-1 text-sm text-slate-800">{data.gradeComputation || "N/A"}</p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <p className="text-xs font-semibold text-slate-700">Percentage formula</p>
        <p className="mt-1 text-sm text-slate-800">{data.percentageComputation || "N/A"}</p>
      </div>
    </div>
  );
}
