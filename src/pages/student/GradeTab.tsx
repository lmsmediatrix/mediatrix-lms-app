import { BiExport } from "react-icons/bi";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import GradeTabSkeleton from "../../components/skeleton/GradeTabSkeleton";
import { useStudentGrades } from "../../hooks/useSection";
import { useExportStudentGrades } from "../../hooks/useStudent";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";

export default function GradeTab({ sectionCode }: { sectionCode: string }) {
  const { data, isPending } = useStudentGrades(sectionCode);
  const exportStudentGrades = useExportStudentGrades();

  const exportToCSV = () => {
    exportToCSVUtil({
      mutationFn: async (sectionCode) => {
        return await exportStudentGrades.mutateAsync(sectionCode);
      },
      mutationParams: sectionCode,
      filenamePrefix: `1bislms-${sectionCode}-grades`,
      toastMessages: {
        pending: `Exporting student grades data to CSV...`,
        success: `Successfully exported student grades data to CSV`,
        error: `Failed to export student grades data to CSV`,
      },
      onError: (error) => console.error("Export error:", error),
    });
  };

  const itemColumns = [
    { key: "assessmentType", header: "Assessment Type" },
    { key: "points", header: "Points" },
    {
      key: "endDate",
      header: "Due Date",
      render: (value: string) =>
        new Date(value).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
    },
    {
      key: "status",
      header: "Status",
      render: (value: string) => {
        const formattedStatus = value.charAt(0).toUpperCase() + value.slice(1);
        return (
          <span
            className={
              formattedStatus === "Done"
                ? "bg-[#f9faee] text-[#5e751c] px-3 py-1 rounded-full"
                : formattedStatus === "Not started"
                ? "bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                : "bg-gray-100 text-gray-800 px-3 py-1 rounded-full"
            }
          >
            {formattedStatus}
          </span>
        );
      },
    },
    {
      key: "grade",
      header: "Grade",
      render: (value: string) => {
        const grade = parseFloat(value);
        return (
          <span className={grade >= 2.0 ? "text-red-500" : ""}>
            {grade.toFixed(1)}
          </span>
        );
      },
    },
  ];

  if (isPending) {
    return <GradeTabSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end text-gray-700">
        <div className="py-2">
          <p>
            <strong>Average Grade:</strong>{" "}
            <span className="px-2 py-1 bg-gray-200 rounded-md">
              {data?.average ? data.average : "N/A"}
            </span>
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            onClick={exportToCSV}
            variant="primary"
            className="text-sm md:text-base"
          >
            <BiExport /> <span>Export</span>
          </Button>
        </div>
      </div>
      <div>
        <Table columns={itemColumns}>
          {data?.data?.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                No grades available
              </td>
            </tr>
          ) : (
            data?.data?.map((item: any) => (
              <tr key={item.assessmentId}>
                <td className="py-4 px-4">{item.assessmentType}</td>
                <td className="py-4 px-4">{item.points}</td>
                <td className="py-4 px-4">
                  {formatDateMMMDDYYY(item.endDate)}
                </td>
                <td className="py-4 px-4 text-xs">
                  <span
                    className={
                      item.status === "done"
                        ? "bg-[#f9faee] text-[#5e751c] px-3 py-1 rounded-full"
                        : item.status === "not started"
                        ? "bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                        : "bg-gray-100 text-gray-800 px-3 py-1 rounded-full"
                    }
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={
                      parseFloat(item.grade) >= 2.0 ? "text-red-500" : ""
                    }
                  >
                    {item.grade}
                  </span>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>
    </div>
  );
}
