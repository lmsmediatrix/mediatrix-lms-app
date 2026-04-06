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
  Legend,
);

interface GradeChartProps {
  data: {
    labels: string[];
    values: number[];
    totalStudents: number;
  };
  learnersLabel?: string;
}

export default function GradeChart({
  data,
  learnersLabel = "Students",
}: GradeChartProps) {
  // Fallback values if data is invalid
  const labels = data?.labels || [];
  const values = data?.values || [];
  const totalStudents = data?.totalStudents || 0;

  // Check if there is no valid data
  if (!labels.length || !values.length || totalStudents === 0) {
    return (
      <div className="border rounded-lg px-4 py-6 bg-white">
        <p className="text-gray-400 text-center text-sm md:text-base">
          No data available
        </p>
      </div>
    );
  }

  // Set y-axis max to totalStudents plus a small buffer (e.g., 10% more, rounded up)
  const yAxisMax = Math.ceil(totalStudents * 1.1);
  // Set tick step size to divide y-axis into approximately 5 steps
  const stepSize = Math.ceil(yAxisMax / 5);

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to stretch to container size
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Grade Distribution",
        font: {
          size: window.innerWidth < 768 ? 14 : 16, // Smaller title on mobile
        },
      },
      tooltip: {
        bodyFont: {
          size: window.innerWidth < 768 ? 12 : 14, // Smaller tooltip text on mobile
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: `Number of ${learnersLabel.toLowerCase()} (Total: ${totalStudents})`,
          font: {
            size: window.innerWidth < 768 ? 12 : 14, // Smaller axis title on mobile
          },
        },
        min: 0,
        max: yAxisMax,
        ticks: {
          stepSize: stepSize,
          font: {
            size: window.innerWidth < 768 ? 10 : 12, // Smaller tick labels on mobile
          },
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
          text: "Grade",
          font: {
            size: window.innerWidth < 768 ? 12 : 14, // Smaller axis title on mobile
          },
        },
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12, // Smaller tick labels on mobile
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: "rgb(20, 184, 216)",
        barThickness: window.innerWidth < 768 ? 20 : 50, // Thinner bars on mobile
      },
    ],
  };

  return (
    <div className="bg-white p-3 md:p-4 rounded-lg shadow h-[300px] md:h-[400px] lg:mr-4">
      <Bar options={options} data={chartData} />
    </div>
  );
}
