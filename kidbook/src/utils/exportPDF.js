// utils/exportPDF.js
import jsPDF from 'jspdf';

const BLEED = 0.125;

export async function exportToPDF(book, trimSizes) {
  const { w, h } = trimSizes[book.trimSize];
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

    // Background
    doc.setFillColor(page.bgColor || '#ffffff');
    doc.rect(0, 0, totalW, totalH, 'F');

    // Images (sorted by zIndex)
    const imgs = [...page.images].filter(img => img.src).sort((a, b) => (a.zIndex||0) - (b.zIndex||0));
    for (const img of imgs) {
      try {
        const xIn = BLEED + (img.x / 100) * w;
        const yIn = BLEED + (img.y / 100) * h;
        const wIn = (img.w / 100) * w;
        const hIn = (img.h / 100) * h;
        const fmt = img.src.includes('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(img.src, fmt, xIn, yIn, wIn, hIn, undefined, 'FAST');
      } catch (e) {
        console.warn('Image failed:', e);
      }
    }

    // Text
    if (page.text && page.layoutId !== 'full-image') {
      const tp = page.textPosition || {};
      const tx = BLEED + ((tp.x ?? 6) / 100) * w;
      const ty = BLEED + ((tp.y ?? 6) / 100) * h;
      const maxW = ((tp.w ?? 88) / 100) * w;
      const fontSize = (page.fontSize || 28) * 0.75;

      doc.setFontSize(fontSize);
      const color = page.textColor || '#1a1a2e';
      doc.setTextColor(
        parseInt(color.slice(1,3),16),
        parseInt(color.slice(3,5),16),
        parseInt(color.slice(5,7),16)
      );

      const align = page.textAlign || 'left';
      const textX = align === 'center' ? tx + maxW / 2 : align === 'right' ? tx + maxW : tx;
      const lines = doc.splitTextToSize(page.text, maxW);
      doc.text(lines, textX, ty + fontSize / 72, { align, maxWidth: maxW });
    }

    // Trim marks (light gray)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.004);
    doc.rect(BLEED, BLEED, w, h);
  }

  doc.save(`${(book.title || 'MyBook').replace(/[^a-z0-9]/gi,'_')}_KDP_Ready.pdf`);
}
