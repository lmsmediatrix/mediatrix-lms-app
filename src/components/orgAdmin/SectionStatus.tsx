import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend as ChartLegend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, ChartLegend);

interface SectionStatusProps {
  statusData: {
    label: string;
    value: number;
    status: "upcoming" | "active" | "completed";
  }[];
}

export default function SectionStatus({ statusData }: SectionStatusProps) {

  // Get the primary, secondary, and accent colors from CSS variables for dynamic theming
  const primary =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-primary")
      .trim() || "#3B82F6";
  const secondary =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-secondary")
      .trim() || "#60B2F0";
  const accent =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim() || "#F59E42";

  const statusColors: Record<string, string> = {
    upcoming: primary,
    active: secondary,
    completed: accent,
  };

  // Check if statusData is empty, null, undefined, or all values are 0
  const isEmpty =
    !statusData ||
    statusData.length === 0 ||
    statusData.every((item) => item.value === 0);

  // Data for the pie chart when statusData is not empty and has non-zero values
  const data = {
    labels: statusData.map((item) => item.label),
    datasets: [
      {
        data: statusData.map((item) => item.value),
        backgroundColor: statusData.map((item) => statusColors[item.status]),
        borderWidth: 1,
        borderColor: "#ffffff",
      },
    ],
  };

  return (
    <div
      className="bg-white border rounded-lg p-6 h-full flex flex-col justify-center"
      style={{ minHeight: "300px" }}
    >
      <h2 className="font-bold text-xl mb-4">Status</h2>
      <div className="flex flex-col items-center justify-center">
        <div
          className="w-56 h-56 mb-4 flex items-center justify-center"
          style={{ position: "relative" }}
        >
          {isEmpty ? (
            <div
              className="w-56 h-56 rounded-full flex items-center justify-center text-gray-500"
              style={{ backgroundColor: "#D1D5DB" }}
            >
              No Data available
            </div>
          ) : (
            <Pie
              data={data}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: true },
                },
              }}
            />
          )}
        </div>
        <div className="space-y-2 w-full">
          {statusData.map((item) => (
            <div
              key={item.status}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: statusColors[item.status] }}
                ></span>
                <span className="text-base font-medium">{item.label}</span>
              </div>
              <span className="text-lg font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
