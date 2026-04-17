import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

interface SectionChartProps {
  data: {
    labels: string[];
    values: number[];
    totalStudents: number;
  };
  xAxisLabel?: string;
  learnerLabel?: string;
}

const getCssVarColor = (token: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return value || fallback;
};

const truncateLabel = (value: string, max = 34): string => {
  const text = String(value || "").trim();
  if (!text) return "Unnamed batch";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
};

export default function SectionChart({
  data,
  xAxisLabel = "Sections",
  learnerLabel = "Students",
}: SectionChartProps) {
  const sourceLabels = data?.labels?.length ? data.labels : ["No Sections"];
  const sourceValues = data?.values?.length ? data.values : [0];
  const totalStudents = data?.totalStudents || 0;
  const hasData = sourceValues.some((value) => Number(value) > 0);

  const mergedRows = sourceLabels.map((label, index) => ({
    label: String(label || "Unnamed batch"),
    value: Number(sourceValues[index] || 0),
  }));

  const sortedRows = [...mergedRows].sort((a, b) => b.value - a.value);
  const fullLabels = sortedRows.map((row) => row.label);
  const labels = fullLabels.map((label) => truncateLabel(label, 34));
  const values = sortedRows.map((row) => row.value);

  const totalBatches = labels.length;
  const averagePerBatch =
    totalBatches > 0 ? Math.round((totalStudents / totalBatches) * 10) / 10 : 0;
  const singularXAxisLabel = xAxisLabel.endsWith("s") ? xAxisLabel.slice(0, -1) : xAxisLabel;
  const rollingWindow = Math.min(6, Math.max(2, Math.round(values.length / 6)));
  const trendValues = values.map((_, index) => {
    const startIndex = Math.max(0, index - rollingWindow + 1);
    const windowValues = values.slice(startIndex, index + 1);
    const total = windowValues.reduce((sum, value) => sum + value, 0);
    return Math.round((total / Math.max(windowValues.length, 1)) * 10) / 10;
  });

  const maxValue = Math.max(...values, 1);
  const roundedYAxisMax =
    maxValue <= 10 ? Math.ceil(maxValue) : Math.ceil(maxValue / 5) * 5;
  const stepSize = Math.max(1, Math.ceil(roundedYAxisMax / 5));

  const chartHeight = 300;
  const chartMinWidth = Math.max(760, labels.length * 54);

  const primaryColorHex = getCssVarColor("--color-primary", "#2563eb");
  const secondaryColorHex = getCssVarColor("--color-secondary", "#0ea5e9");

  const options: ChartOptions<"bar"> = {
    indexAxis: "x",
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 520,
      easing: "easeOutQuart",
    },
    layout: {
      padding: { top: 10, right: 10, bottom: 2, left: 10 },
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        enabled: hasData,
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderColor: "rgba(99, 102, 241, 0.35)",
        borderWidth: 1,
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 11 },
        padding: 10,
        callbacks: {
          title: (items) => {
            const item = items?.[0];
            if (!item) return "";
            return fullLabels[item.dataIndex] || String(item.label || "");
          },
          label: (context) => {
            if (String(context.dataset.label || "").toLowerCase() === "trend") {
              return `Trend: ${Number(context.raw || 0).toLocaleString()}`;
            }
            return `${learnerLabel}: ${Number(context.raw || 0).toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgba(51, 65, 85, 0.92)",
          font: { size: 10 },
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
          callback: (_value, index) => truncateLabel(fullLabels[index] || "", 14),
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: roundedYAxisMax,
        ticks: {
          stepSize,
          color: "rgba(71, 85, 105, 0.82)",
          font: { size: 10 },
          callback: (value) => Number(value).toLocaleString(),
        },
        grid: {
          color: "rgba(148, 163, 184, 0.20)",
          drawTicks: false,
        },
        border: {
          display: false,
        },
        title: {
          display: true,
          text: `${learnerLabel} per ${xAxisLabel}`,
          color: "#556178",
          font: { size: 11, weight: "bold" },
        },
      },
    },
  };

  const chartData: any = {
    labels: fullLabels,
    datasets: [
      {
        label: "Enrolled",
        data: values,
        borderRadius: 6,
        borderSkipped: false,
        categoryPercentage: 0.8,
        barPercentage: 0.72,
        maxBarThickness: 16,
        minBarLength: 3,
        borderWidth: 0.5,
        borderColor: "rgba(255,255,255,0.28)",
        hoverBorderWidth: 1,
        hoverBorderColor: "rgba(255,255,255,0.5)",
        backgroundColor: (context: ScriptableContext<"bar">) => {
          if (!hasData) return "rgba(148, 163, 184, 0.35)";
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return primaryColorHex;
          const gradient = ctx.createLinearGradient(
            chartArea.left,
            chartArea.top,
            chartArea.right,
            chartArea.bottom
          );
          gradient.addColorStop(0, "rgba(148, 163, 184, 0.9)");
          gradient.addColorStop(1, "rgba(100, 116, 139, 0.72)");
          return gradient;
        },
        hoverBackgroundColor: (context: ScriptableContext<"bar">) => {
          if (!hasData) return "rgba(148, 163, 184, 0.45)";
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return primaryColorHex;
          const gradient = ctx.createLinearGradient(
            chartArea.left,
            chartArea.top,
            chartArea.right,
            chartArea.bottom
          );
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.7)");
          gradient.addColorStop(1, "rgba(14, 165, 233, 0.62)");
          return gradient;
        },
      },
      {
        type: "line",
        label: "Trend",
        data: trendValues,
        yAxisID: "y",
        tension: 0.38,
        borderWidth: 2.3,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: true,
        borderColor: (context: ScriptableContext<"bar">) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return primaryColorHex;
          const gradient = ctx.createLinearGradient(
            chartArea.left,
            chartArea.top,
            chartArea.right,
            chartArea.top
          );
          gradient.addColorStop(0, secondaryColorHex);
          gradient.addColorStop(0.55, primaryColorHex);
          gradient.addColorStop(1, secondaryColorHex);
          return gradient;
        },
        backgroundColor: (context: ScriptableContext<"bar">) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(59,130,246,0.15)";
          const gradient = ctx.createLinearGradient(
            chartArea.left,
            chartArea.top,
            chartArea.left,
            chartArea.bottom
          );
          gradient.addColorStop(0, "rgba(99, 102, 241, 0.22)");
          gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
          return gradient;
        },
      },
    ],
  };

  return (
    <div
      className="rounded-2xl border border-slate-200 p-4 md:p-5 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.45)]"
      style={{
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--color-primary,#2563eb) 6%, #ffffff), #ffffff 52%, color-mix(in srgb, var(--color-secondary,#0ea5e9) 10%, #ffffff))",
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Enrollment Overview
          </p>
          <h2 className="font-bold text-xl text-slate-900">{learnerLabel} Enrollment</h2>
          <p className="text-slate-600 text-sm">
            Number of {learnerLabel.toLowerCase()} enrolled in each {xAxisLabel.toLowerCase()}.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs w-full md:w-auto md:min-w-[300px]">
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_22%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_8%,white)] px-3 py-2">
            <p className="text-slate-500 uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_84%,black)]">
              {totalStudents.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_22%,white)] bg-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_10%,white)] px-3 py-2">
            <p className="text-slate-500 uppercase tracking-wide">{xAxisLabel}</p>
            <p className="text-xl font-bold text-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_82%,black)]">
              {totalBatches.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2">
            <p className="text-slate-500 uppercase tracking-wide">Avg/{singularXAxisLabel || "Item"}</p>
            <p className="text-xl font-bold text-slate-900">{averagePerBatch.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2.5 overflow-x-auto">
        <div style={{ height: chartHeight, minWidth: chartMinWidth }}>
          <Bar options={options} data={chartData} />
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Batch/section names are truncated for readability. Hover a bar to see the full name.
      </p>
    </div>
  );
}
