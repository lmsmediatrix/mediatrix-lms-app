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

interface SectionChartProps {
  data: {
    labels: string[];
    values: number[];
    totalStudents: number;
  };
  xAxisLabel?: string;
  learnerLabel?: string;
}

export default function SectionChart({
  data,
  xAxisLabel = "Sections",
  learnerLabel = "Students",
}: SectionChartProps) {
  const labels = data?.labels?.length ? data.labels : ["No Sections"];
  const values = data?.values?.length ? data.values : [0];
  const totalStudents = data?.totalStudents || 0;

  // Round up to the nearest 'obvious' number for y-axis max
  const maxValue = Math.max(...values, 1); // Ensure at least 1 to avoid zero max
  const roundToObvious = (num: number) => {
    if (num <= 10) return Math.ceil(num);
    const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
    const step = magnitude >= 100 ? magnitude / 2 : magnitude;
    return Math.ceil(num / step) * step;
  };
  const yAxisMax = roundToObvious(maxValue);
  const stepSize = Math.ceil(yAxisMax / 5);

  // Dynamic bar thickness based on number of sections
  const isMobile = window.innerWidth < 768;
  const baseThickness = isMobile ? 20 : 60;
  const maxSections = 10;
  const thicknessFactor = Math.max(
    0.5,
    Math.min(1, maxSections / labels.length)
  );
  const barThickness = Math.round(baseThickness * thicknessFactor);

  // Get the primary color from the CSS variable for dynamic theming
  const primaryColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-primary")
      .trim() || "#3E5B93";

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 40,
        left: 0,
        right: 0,
        top: 0,
      },
    },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        bodyFont: { size: isMobile ? 12 : 14 },
        enabled: values[0] !== 0, // Disable tooltips if no data
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: `Number of ${learnerLabel} (Total: ${totalStudents})`,
          font: { size: isMobile ? 12 : 14 },
        },
        min: 0,
        max: yAxisMax,
        ticks: {
          stepSize: stepSize,
          font: { size: isMobile ? 10 : 12 },
        },
        grid: {
          display: true,
          drawTicks: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        title: {
          display: true,
          text: xAxisLabel,
          font: { size: isMobile ? 12 : 14 },
        },
        ticks: {
          font: { size: isMobile ? 10 : 12 },
        },
        grid: { display: false },
      },
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: "Enrolled",
        data: values,
        backgroundColor: values[0] === 0 ? "rgba(0, 0, 0, 0.1)" : primaryColor, // Grayed out for no data
        barThickness: barThickness,
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg h-[300px] md:h-[440px] p-4 border">
      <div className="mb-1">
        <h2 className="font-bold text-xl">{learnerLabel} Enrolment</h2>
        <p className="text-gray-500 text-sm -mt-1">
          Number of {learnerLabel.toLowerCase()} enrolled in each section
        </p>
      </div>
      <Bar options={options} data={chartData} />
    </div>
  );
}
