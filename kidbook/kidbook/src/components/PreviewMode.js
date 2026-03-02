// components/PreviewMode.js
import React, { useState } from 'react';

export default function PreviewMode({ book, TRIM_SIZES, onClose }) {
  const [pageIdx, setPageIdx] = useState(0);
  const { w, h } = TRIM_SIZES[book.trimSize];
  const page = book.pages[pageIdx];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,12,20,0.97)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    }}>
      <div style={{ color: '#fff', fontSize: 20, fontFamily: 'Georgia', letterSpacing: 1 }}>
        📖 {book.title}
      </div>

      <div style={{
        position: 'relative',
        width: 'min(70vw, 60vh)',
        aspectRatio: `${w}/${h}`,
        background: page.bgColor || '#fff',
        boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {[...page.images].sort((a,b)=>a.zIndex-b.zIndex).map(img => (
          <img key={img.id} src={img.src} alt=""
            style={{
              position: 'absolute',
              left: `${img.x}%`, top: `${img.y}%`,
              width: `${img.w}%`, height: `${img.h}%`,
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        ))}
        {page.text && (
          <div style={{
            position: 'absolute',
            left: `${page.textPosition?.x ?? 50}%`,
            top: `${page.textPosition?.y ?? 78}%`,
            transform: 'translate(-50%,-50%)',
            width: '80%',
            textAlign: page.textAlign || 'center',
            fontSize: page.fontSize || 28,
            color: page.textColor || '#1a1a2e',
            fontFamily: 'Georgia, serif',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            pointerEvents: 'none',
          }}>
            {page.text}
          </div>
        )}
        {/* Page number */}
        <div style={{
          position: 'absolute', bottom: 16, right: 20,
          fontSize: 14, color: 'rgba(0,0,0,0.3)',
          fontFamily: 'Georgia',
        }}>
          {pageIdx + 1}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <button
          disabled={pageIdx === 0}
          onClick={() => setPageIdx(i => i - 1)}
          style={navBtn(pageIdx === 0)}
        >◀ Prev</button>
        <span style={{ color: '#aab', fontSize: 16 }}>
          Page {pageIdx + 1} of {book.pages.length}
        </span>
        <button
          disabled={pageIdx === book.pages.length - 1}
          onClick={() => setPageIdx(i => i + 1)}
          style={navBtn(pageIdx === book.pages.length - 1)}
        >Next ▶</button>
      </div>

      <button onClick={onClose} style={{
        background: 'transparent',
        color: '#aab',
        border: '2px solid #445',
        borderRadius: 10,
        padding: '10px 28px',
        fontSize: 16,
        cursor: 'pointer',
      }}>
        ✕ Close Preview
      </button>
    </div>
  );
}

const navBtn = (disabled) => ({
  background: disabled ? '#2a2d3a' : '#4a90d9',
  color: disabled ? '#555' : 'white',
  border: 'none',
  borderRadius: 10,
  padding: '12px 24px',
  fontSize: 17,
  cursor: disabled ? 'default' : 'pointer',
  fontWeight: 700,
});
