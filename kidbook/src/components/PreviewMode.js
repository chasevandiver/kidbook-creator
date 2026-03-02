// components/PreviewMode.js
import React, { useState } from 'react';

export default function PreviewMode({ book, TRIM_SIZES, onClose }) {
  const [pageIdx, setPageIdx] = useState(0);
  const { w, h } = TRIM_SIZES[book.trimSize];
  const page = book.pages[pageIdx];
  if (!page) return null;
  const tp = page.textPosition || {};

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(5,8,18,0.97)',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{ color: '#aab', fontSize: 18, fontFamily: 'Georgia', letterSpacing: 1 }}>
        📖 {book.title}
      </div>

      <div style={{
        position: 'relative',
        width: 'min(72vw, 65vh)',
        aspectRatio: `${w}/${h}`,
        background: page.bgColor || '#fff',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        {[...page.images].filter(img => img.src).sort((a,b)=>a.zIndex-b.zIndex).map(img => (
          <img key={img.id} src={img.src} alt=""
            style={{ position:'absolute', left:`${img.x}%`, top:`${img.y}%`, width:`${img.w}%`, height:`${img.h}%`, objectFit:'contain', pointerEvents:'none' }}
          />
        ))}
        {page.text && page.layoutId !== 'full-image' && (
          <div style={{
            position: 'absolute',
            left: `${tp.x ?? 6}%`, top: `${tp.y ?? 6}%`,
            width: `${tp.w ?? 88}%`,
            fontSize: `${(page.fontSize||28) * (300 / (h * 96))}px`,
            color: page.textColor || '#1a1a2e',
            fontFamily: page.fontFamily || book.fontFamily || 'Georgia, serif',
            lineHeight: 1.5, whiteSpace: 'pre-wrap',
            textAlign: page.textAlign || 'left',
          }}>
            {page.text}
          </div>
        )}
        <div style={{ position:'absolute', bottom:12, right:16, fontSize:12, color:'rgba(0,0,0,0.25)', fontFamily:'Georgia' }}>
          {pageIdx + 1}
        </div>
      </div>

      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
        <button disabled={pageIdx===0} onClick={() => setPageIdx(i=>i-1)} style={navBtn(pageIdx===0)}>◀ Previous Page</button>
        <span style={{ color:'#556', fontSize:15 }}>{pageIdx+1} of {book.pages.length}</span>
        <button disabled={pageIdx===book.pages.length-1} onClick={() => setPageIdx(i=>i+1)} style={navBtn(pageIdx===book.pages.length-1)}>Next Page ▶</button>
      </div>

      <button onClick={onClose} style={{
        background:'transparent', color:'#778',
        border:'2px solid rgba(255,255,255,0.1)', borderRadius:10,
        padding:'10px 28px', fontSize:15, cursor:'pointer', fontWeight:600,
      }}>
        ✕  Close Preview — Go Back to Editing
      </button>
    </div>
  );
}

const navBtn = disabled => ({
  background: disabled ? '#1a1e2a' : '#4a90d9', color: disabled ? '#445' : 'white',
  border: 'none', borderRadius: 10, padding: '12px 22px',
  fontSize: 16, cursor: disabled ? 'default' : 'pointer', fontWeight: 700,
});
