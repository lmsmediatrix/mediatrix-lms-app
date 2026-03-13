import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AttendanceChartProps {
  data?: {
      sections: { section: string; present: number; absent: number }[];
      numberOfStudents: number;
  };
  variant?: "card" | "embedded";
  heightClass?: string;
  className?: string;
}

export default function AttendanceChart({
  data,
  variant = "card",
  heightClass = "h-[300px] md:h-[400px]",
  className,
}: AttendanceChartProps) {
  const dataChart = data 

  // Fallback values if dataChart is invalid
  const sections = dataChart?.sections?.map(item => item.section) || [];
  const present = dataChart?.sections?.map(item => item.present) || [];
  const absent = dataChart?.sections?.map(item => item.absent) || [];
  const numberOfStudents = dataChart?.numberOfStudents || 0;

  // Check if there is no valid data
  if (
      !sections.length ||
      !present.length ||
      !absent.length ||
      numberOfStudents === 0
  ) {
      const empty = (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-center text-sm md:text-base">
            No attendance data available
          </p>
        </div>
      );
      if (variant === "embedded") {
        return <div className={`${heightClass} ${className || ""}`}>{empty}</div>;
      }
      return (
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className={`${heightClass}`}>{empty}</div>
        </div>
      );
  }

  // Calculate the maximum total students in any section (present + absent)
  const maxSectionTotal = Math.max(
      ...(dataChart?.sections?.map(item => item.present + item.absent) || [])
  );

  // Round up to the nearest "obvious" number
  const roundToObvious = (num: number) => {
      if (num <= 10) return Math.ceil(num);
      const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
      const step = magnitude >= 100 ? magnitude / 2 : magnitude;
      return Math.ceil(num / step) * step;
  };

  const yAxisMax = roundToObvious(maxSectionTotal);
  // Set tick step size to divide y-axis into approximately 5 steps
  const stepSize = Math.ceil(yAxisMax / 5);

  // Calculate barThickness based on number of sections
  const isMobile = window.innerWidth < 768;
  const baseThickness = isMobile ? 16 : 40; // Slimmer bars for a modern look
  const maxSections = 10; // Maximum sections before thickness scales down significantly
  const thicknessFactor = Math.max(0.5, Math.min(1, maxSections / sections.length)); // Scale between 0.5 and 1
  const barThickness = Math.round(baseThickness * thicknessFactor); // Round to nearest integer

  const options = {
      responsive: true,
      maintainAspectRatio: false, // Allow chart to stretch to container size
      layout: {
          padding: { top: 8, right: 8, bottom: 4, left: 4 },
      },
      plugins: {
          legend: {
              display: true,
              position: "top" as const,
              align: "start" as const,
              labels: {
                  usePointStyle: true,
                  pointStyle: "circle",
                  boxWidth: 8,
                  boxHeight: 8,
                  padding: 16,
                  font: {
                      size: isMobile ? 10 : 12, // Smaller legend on mobile
                  },
                  color: "#6B7280",
              },
          },
          tooltip: {
              backgroundColor: "rgba(17, 24, 39, 0.92)",
              titleColor: "#F9FAFB",
              bodyColor: "#F9FAFB",
              padding: 10,
              cornerRadius: 8,
              displayColors: false,
              bodyFont: {
                  size: isMobile ? 12 : 14, // Smaller tooltip text on mobile
              },
          },
      },
      scales: {
          y: {
              stacked: true, // Enable stacking on y-axis
              min: 0,
              max: yAxisMax,
              ticks: {
                  stepSize: stepSize,
                  font: {
                      size: isMobile ? 10 : 12, // Smaller tick labels on mobile
                  },
                  color: "#9CA3AF",
              },
              grid: {
                  display: true,
                  drawTicks: true,
                  color: "rgba(148, 163, 184, 0.25)",
              },
              border: { display: false },
          },
          x: {
              stacked: true, // Enable stacking on x-axis
              ticks: {
                  font: {
                      size: isMobile ? 10 : 12, // Smaller tick labels on mobile
                  },
                  color: "#6B7280",
              },
              grid: {
                  display: false,
              },
              border: { display: false },
          },
      },
  };

  const chartData = {
      labels: sections,
      datasets: [
          {
              label: "Present",
              data: present,
              backgroundColor: (context: any) => {
                  const { chart } = context;
                  const { ctx, chartArea } = chart || {};
                  if (!ctx || !chartArea) return "rgba(59, 130, 246, 0.85)";
                  const gradient = ctx.createLinearGradient(
                      0,
                      chartArea.top,
                      0,
                      chartArea.bottom
                  );
                  gradient.addColorStop(0, "rgba(59, 130, 246, 0.95)");
                  gradient.addColorStop(1, "rgba(37, 99, 235, 0.65)");
                  return gradient;
              },
              borderRadius: 10,
              borderSkipped: false,
              barThickness: barThickness,
              categoryPercentage: 0.7,
              barPercentage: 0.9,
          },
          {
              label: "Absent",
              data: absent,
              backgroundColor: (context: any) => {
                  const { chart } = context;
                  const { ctx, chartArea } = chart || {};
                  if (!ctx || !chartArea) return "rgba(148, 163, 184, 0.7)";
                  const gradient = ctx.createLinearGradient(
                      0,
                      chartArea.top,
                      0,
                      chartArea.bottom
                  );
                  gradient.addColorStop(0, "rgba(148, 163, 184, 0.9)");
                  gradient.addColorStop(1, "rgba(100, 116, 139, 0.55)");
                  return gradient;
              },
              borderRadius: 10,
              borderSkipped: false,
              barThickness: barThickness,
              categoryPercentage: 0.7,
              barPercentage: 0.9,
          },
      ],
  };

  if (variant === "embedded") {
    return (
      <div className={`${heightClass} ${className || ""}`}>
        <Bar options={options} data={chartData} />
      </div>
    );
  }

  return (
    <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className={`${heightClass}`}>
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
}
