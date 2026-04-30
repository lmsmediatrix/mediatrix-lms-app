import { ICertificate } from "../types/interfaces";

type CertificatePdfPayload = {
  certificate: ICertificate;
  learnerName: string;
  organizationName?: string;
};

const formatIssueDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const downloadCertificatePdf = async ({
  certificate,
  learnerName,
  organizationName,
}: CertificatePdfPayload) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 34;

  doc.setFillColor(247, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(2);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, "S");

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(1);
  doc.rect(margin + 10, margin + 10, pageWidth - (margin + 10) * 2, pageHeight - (margin + 10) * 2, "S");

  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(51, 65, 85);
  doc.text("CERTIFICATE", pageWidth / 2, 88, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(44);
  doc.setTextColor(15, 23, 42);
  doc.text("Certificate of Completion", pageWidth / 2, 148, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(15);
  doc.setTextColor(71, 85, 105);
  doc.text("This certifies that", pageWidth / 2, 184, { align: "center" });

  doc.setFont("times", "bolditalic");
  doc.setFontSize(34);
  doc.setTextColor(30, 64, 175);
  doc.text(learnerName || "Learner", pageWidth / 2, 228, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(51, 65, 85);
  const description =
    certificate.subtitle ||
    `has successfully completed the ${certificate.scopeType || "module"} requirement.`;
  doc.text(description, pageWidth / 2, 266, { align: "center", maxWidth: pageWidth - 160 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`Certificate No: ${certificate.certificateNo}`, margin + 26, pageHeight - 88);
  doc.text(`Issued: ${formatIssueDate(certificate.issueDate)}`, margin + 26, pageHeight - 68);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Issuer: ${certificate.issuerName || organizationName || "LMS"}`, pageWidth - margin - 220, pageHeight - 88);
  doc.text(`Signatory: ${certificate.signatoryName || "Authorized Signatory"}`, pageWidth - margin - 220, pageHeight - 68);

  const filename = `${certificate.certificateNo || "certificate"}.pdf`;
  doc.save(filename);
};

