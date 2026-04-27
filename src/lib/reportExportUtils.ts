import { toast } from "react-toastify";
import { generateTimestamp } from "./dateUtils";

type ExportCellValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date;

export interface ReportExportColumn<Row> {
  label: string;
  value: (row: Row) => ExportCellValue;
}

interface ReportExportToastMessages {
  pending: string;
  success: string;
  error: string;
}

interface ReportExportOptions<Row> {
  rows: Row[];
  columns: ReportExportColumn<Row>[];
  filenamePrefix: string;
  sheetName: string;
  pdfTitle: string;
  toastMessages: ReportExportToastMessages;
}

const formatExportValue = (value: ExportCellValue): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toLocaleString("en-US");
  }

  return String(value);
};

const buildExportRows = <Row,>(
  rows: Row[],
  columns: ReportExportColumn<Row>[],
): Record<string, string>[] =>
  rows.map((row) =>
    Object.fromEntries(
      columns.map((column) => [column.label, formatExportValue(column.value(row))]),
    ),
  );

const getColumnWidths = <Row,>(
  rows: Row[],
  columns: ReportExportColumn<Row>[],
): Array<{ wch: number }> =>
  columns.map((column) => {
    const maxLength = rows.reduce((length, row) => {
      const valueLength = formatExportValue(column.value(row)).length;
      return Math.max(length, valueLength);
    }, column.label.length);

    return { wch: Math.min(Math.max(maxLength + 2, 12), 40) };
  });

export const exportRowsToExcel = async <Row,>({
  rows,
  columns,
  filenamePrefix,
  sheetName,
  toastMessages,
}: ReportExportOptions<Row>): Promise<void> => {
  const filename = `${filenamePrefix}-${generateTimestamp()}.xlsx`;

  await toast.promise(
    (async () => {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(buildExportRows(rows, columns));

      worksheet["!cols"] = getColumnWidths(rows, columns);

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, filename);
    })(),
    toastMessages,
  );
};

export const exportRowsToPdf = async <Row,>({
  rows,
  columns,
  filenamePrefix,
  pdfTitle,
  toastMessages,
}: ReportExportOptions<Row>): Promise<void> => {
  const filename = `${filenamePrefix}-${generateTimestamp()}.pdf`;

  await toast.promise(
    (async () => {
      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const autoTable = autoTableModule.default;
      const doc = new jsPDF({
        orientation: columns.length > 6 ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });

      doc.setFontSize(16);
      doc.text(pdfTitle, 40, 40);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated ${new Date().toLocaleString("en-US")}`, 40, 58);

      autoTable(doc, {
        startY: 72,
        head: [columns.map((column) => column.label)],
        body: rows.map((row) =>
          columns.map((column) => formatExportValue(column.value(row))),
        ),
        styles: {
          fontSize: 8,
          cellPadding: 6,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        margin: {
          top: 72,
          right: 40,
          bottom: 40,
          left: 40,
        },
        theme: "grid",
      });

      doc.save(filename);
    })(),
    toastMessages,
  );
};
