// utils/exportPDF.js
import jsPDF from 'jspdf';

const DPI = 300;
const BLEED = 0.125;

function inchesToPt(inches) {
  return inches * 72;
}

export async function exportToPDF(book, trimSizes) {
  const { w, h } = trimSizes[book.trimSize];

  // Total size including bleed on all sides
  const totalW = w + BLEED * 2;
  const totalH = h + BLEED * 2;

  const doc = new jsPDF({
    unit: 'in',
    format: [totalW, totalH],
    orientation: totalW >= totalH ? 'landscape' : 'portrait',
    compress: true,
  });

  for (let i = 0; i < book.pages.length; i++) {
    const page = book.pages[i];
    if (i > 0) doc.addPage([totalW, totalH]);

    // Background color
    const bg = page.bgColor || '#ffffff';
    doc.setFillColor(bg);
    doc.rect(0, 0, totalW, totalH, 'F');

    // Draw images
    const sortedImages = [...page.images].sort((a, b) => a.zIndex - b.zIndex);
    for (const img of sortedImages) {
      try {
        // img.x, img.y, img.w, img.h are in % of the content area (trim only, not bleed)
        const xIn = BLEED + (img.x / 100) * w;
        const yIn = BLEED + (img.y / 100) * h;
        const wIn = (img.w / 100) * w;
        const hIn = (img.h / 100) * h;

        // Determine format from data URL
        const fmt = img.src.includes('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(img.src, fmt, xIn, yIn, wIn, hIn, undefined, 'FAST');
      } catch (e) {
        console.warn('Failed to add image to PDF:', e);
      }
    }

    // Draw text
    if (page.text) {
      const fontSize = (page.fontSize || 28) * 0.75; // pt to rough in scaling
      doc.setFontSize(fontSize);

      const color = page.textColor || '#1a1a2e';
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      doc.setTextColor(r, g, b);

      const textX = BLEED + (page.textPosition?.x / 100 || 0.5) * w;
      const textY = BLEED + (page.textPosition?.y / 100 || 0.8) * h;

      const align = page.textAlign || 'center';
      const maxWidth = w * 0.8;

      const lines = doc.splitTextToSize(page.text, maxWidth);
      doc.text(lines, textX, textY, { align, maxWidth });
    }

    // Draw margin guides (crop marks) - only thin lines at bleed boundary
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.005);
    // Trim box outline
    doc.rect(BLEED, BLEED, w, h);
  }

  doc.save(`${book.title || 'MyBook'}_KDP_Ready.pdf`);
}
