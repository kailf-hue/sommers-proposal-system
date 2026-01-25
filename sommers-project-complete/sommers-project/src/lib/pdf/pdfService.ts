/**
 * PDF Service
 * Proposal PDF generation
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFOptions {
  format?: 'letter' | 'a4';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  includeHeader?: boolean;
  includeFooter?: boolean;
}

// Generate PDF from HTML element
export async function generatePDFFromElement(
  element: HTMLElement,
  filename: string,
  options: PDFOptions = {}
): Promise<Blob> {
  const { format = 'letter', orientation = 'portrait', margin = 20 } = options;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf.output('blob');
}

// Generate simple text PDF
export function generateTextPDF(
  content: { title: string; sections: Array<{ heading: string; body: string }> },
  options: PDFOptions = {}
): Blob {
  const { format = 'letter', margin = 40 } = options;
  const pdf = new jsPDF({ unit: 'pt', format });

  let y = margin;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;

  // Title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(content.title, margin, y);
  y += 40;

  // Sections
  content.sections.forEach((section) => {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.heading, margin, y);
    y += 20;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(section.body, maxWidth);
    pdf.text(lines, margin, y);
    y += lines.length * 14 + 20;

    if (y > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
  });

  return pdf.output('blob');
}

// Download PDF blob
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  generatePDFFromElement,
  generateTextPDF,
  downloadPDF,
};
