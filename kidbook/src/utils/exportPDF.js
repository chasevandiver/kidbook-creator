// utils/exportPDF.js
import jsPDF from 'jspdf';

const BLEED = 0.125;

export async function exportToPDF(book, trimSizes) {
  const { w, h } = trimSizes[book.trimSize];
  const totalW = w + BLEED * 2;
  const totalH = h + BLEED * 2;

  const doc = new jsPDF({
    unit: 'in', format: [totalW, totalH],
    orientation: totalW >= totalH ? 'landscape' : 'portrait',
    compress: true,
  });

  for (let i = 0; i < book.pages.length; i++) {
    const page = book.pages[i];
    if (i > 0) doc.addPage([totalW, totalH]);

    // Background
    doc.setFillColor(page.bgColor || '#ffffff');
    doc.rect(0, 0, totalW, totalH, 'F');

    // Images
    const imgs = [...page.images].filter(img => img.src && !img.placeholder).sort((a,b) => (a.zIndex||0)-(b.zIndex||0));
    for (const img of imgs) {
      try {
        const fmt = img.src.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(img.src, fmt, BLEED+(img.x/100)*w, BLEED+(img.y/100)*h, (img.w/100)*w, (img.h/100)*h, undefined, 'FAST');
      } catch (e) { console.warn('Image failed:', e); }
    }

    // Layout text zone
    const tz = page.textZone;
    if (page.text && tz) {
      const txIn = BLEED + (tz.x/100)*w;
      const tyIn = BLEED + (tz.y/100)*h;
      const twIn = (tz.w/100)*w;
      const fontSize = (page.fontSize||24) * 0.75;
      doc.setFontSize(fontSize);
      const c = page.textColor||'#1a1a2e';
      doc.setTextColor(parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16));
      const align = page.textAlign||'left';
      const textX = align==='center' ? txIn+twIn/2 : align==='right' ? txIn+twIn : txIn;
      doc.text(doc.splitTextToSize(page.text, twIn), textX, tyIn+(fontSize/72), { align, maxWidth: twIn });
    }

    // Overlays (text on image)
    for (const overlay of (page.overlays||[])) {
      if (!overlay.text) continue;
      const ox = BLEED + (overlay.x/100)*w;
      const oy = BLEED + (overlay.y/100)*h;
      const ow = (overlay.w/100)*w;
      const oh = (overlay.h/100)*h;
      const fontSize = (overlay.fontSize||28) * 0.75;

      // Background band
      const { OVERLAY_STYLES } = await import('../store/useBookStore');
      const stylePreset = OVERLAY_STYLES.find(s => s.id === overlay.styleId);
      if (stylePreset && overlay.styleId !== 'none' && overlay.styleId !== 'shadow-only') {
        const bgHex = stylePreset.bg.match(/rgba?\(([^)]+)\)/);
        if (bgHex) {
          const parts = bgHex[1].split(',').map(Number);
          doc.setFillColor(parts[0]||0, parts[1]||0, parts[2]||0);
          doc.setGState && doc.setGState(new doc.GState({ opacity: parts[3]||0.6 }));
          doc.rect(ox, oy, ow, oh, 'F');
        }
      }

      doc.setFontSize(fontSize);
      const tc = overlay.textColor || '#ffffff';
      doc.setTextColor(parseInt(tc.slice(1,3),16), parseInt(tc.slice(3,5),16), parseInt(tc.slice(5,7),16));
      const align = overlay.textAlign||'center';
      const textX = align==='center' ? ox+ow/2 : align==='right' ? ox+ow : ox;
      doc.text(doc.splitTextToSize(overlay.text, ow), textX, oy+(fontSize/72)+(oh/2*0.3), { align, maxWidth: ow });
    }

    // Trim mark
    doc.setDrawColor(210,210,210); doc.setLineWidth(0.004);
    doc.rect(BLEED, BLEED, w, h);
  }

  doc.save(`${(book.title||'MyBook').replace(/[^a-z0-9]/gi,'_')}_KDP_Ready.pdf`);
}
