import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useGetAttendanceByDate } from "../../hooks/useMetrics";

interface AttendanceChartProps {
  variant?: "card" | "embedded";
  heightClass?: string;
  className?: string;
  date?: string;
}

const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-900 px-4 py-3 shadow-xl min-w-[160px]">
      <p className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-sm py-0.5">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-gray-400">{entry.name}</span>
          </div>
          <span className="font-bold text-white">{entry.value}</span>
        </div>
      ))}
      {payload[0]?.payload?.total != null && (
        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700">
          Total students: {payload[0].payload.total}
        </p>
      )}
    </div>
  );
};

const CustomLegend = ({ payload }: any) => (
  <div className="flex items-center gap-4 px-1 pb-2">
    {payload?.map((entry: any) => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-xs text-gray-500 font-medium">{entry.value}</span>
      </div>
    ))}
  </div>
);

type BarRadius = [number, number, number, number];

const getSegmentRadius = (
  present: number,
  absent: number,
  segment: "Present" | "Absent",
): BarRadius => {
  if (segment === "Present") {
    return absent === 0 && present > 0 ? [5, 5, 0, 0] : [0, 0, 0, 0];
  }

  return absent > 0 ? [5, 5, 0, 0] : [0, 0, 0, 0];
};

export default function AttendanceChart({
  variant = "card",
  heightClass = "h-[300px] md:h-[400px]",
  className,
  date,
}: AttendanceChartProps) {
  const { currentUser } = useAuth();
  const today = toLocalDateString(new Date());
  const selectedDate = date ?? today;

  const { data: metricsData, isPending } = useGetAttendanceByDate(
    currentUser.user.id,
    currentUser.user.organization._id,
    selectedDate,
  );

  const raw = metricsData?.[0]?.sectionsAttendance?.[0];
  const chartData =
    raw?.sections?.map((item: any) => ({
      section: item.section,
      sectionCode: item.sectionCode,
      Present: item.present,
      Absent: item.absent,
      total: item.total,
    })) ?? [];

  const hasData = chartData.length > 0 && raw?.numberOfStudents > 0;

  const formattedDate = new Date(selectedDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );

  const emptyState = (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400 text-center text-sm">
        {isPending
          ? "Loading attendance..."
          : `No attendance data for ${formattedDate}`}
      </p>
    </div>
  );

  const chart = !hasData ? (
    emptyState
  ) : (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        barCategoryGap="30%"
        barGap={0}
      >
        <CartesianGrid
          vertical={false}
          stroke="rgba(148,163,184,0.2)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="section"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#9CA3AF" }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(148,163,184,0.08)", radius: 6 }}
        />
        <Legend content={<CustomLegend />} />
        <Bar
          dataKey="Present"
          stackId="attendance"
          fill="#3b82f6"
          maxBarSize={40}
          shape={(props: any) => (
            <Rectangle
              {...props}
              radius={getSegmentRadius(
                props.payload?.Present ?? 0,
                props.payload?.Absent ?? 0,
                "Present",
              )}
            />
          )}
        />
        <Bar
          dataKey="Absent"
          stackId="attendance"
          fill="#f87171"
          maxBarSize={40}
          shape={(props: any) => (
            <Rectangle
              {...props}
              radius={getSegmentRadius(
                props.payload?.Present ?? 0,
                props.payload?.Absent ?? 0,
                "Absent",
              )}
            />
          )}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  if (variant === "embedded") {
    return (
      <div className={`${className || ""} flex-1 min-h-0`}>
        <div className={heightClass}>{chart}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className={heightClass}>{chart}</div>
    </div>
  );
}
