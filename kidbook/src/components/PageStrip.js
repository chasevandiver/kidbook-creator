// components/PageStrip.js
import React from 'react';

export default function PageStrip({ pages, currentIdx, onSelect, onAdd, onDelete, onDuplicate, trimSize, TRIM_SIZES }) {
  const { w, h } = TRIM_SIZES[trimSize];
  const aspect = w / h;

  return (
    <div style={{
      width: 130,
      flexShrink: 0,
      background: '#1e2435',
      borderRadius: 14,
      padding: '14px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxHeight: '80vh',
      overflowY: 'auto',
    }}>
      <div style={{ color: '#aab', fontSize: 12, fontWeight: 700, textAlign: 'center', letterSpacing: 1 }}>
        PAGES
      </div>

      {pages.map((page, idx) => (
        <div key={page.id} style={{ position: 'relative' }}>
          <div
            onClick={() => onSelect(idx)}
            style={{
              aspectRatio: `${w}/${h}`,
              background: page.bgColor || '#fff',
              borderRadius: 6,
              cursor: 'pointer',
              border: idx === currentIdx ? '3px solid #4a90d9' : '3px solid transparent',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: idx === currentIdx ? '0 0 0 2px #4a90d9' : '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {/* Mini preview of images */}
            {page.images.map(img => (
              <img key={img.id} src={img.src} alt=""
                style={{
                  position: 'absolute',
                  left: `${img.x}%`,
                  top: `${img.y}%`,
                  width: `${img.w}%`,
                  height: `${img.h}%`,
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
              />
            ))}
            {page.text && (
              <div style={{
                position: 'absolute',
                bottom: '5%', left: '5%', right: '5%',
                fontSize: 6,
                color: page.textColor || '#000',
                textAlign: page.textAlign || 'center',
                overflow: 'hidden',
                lineHeight: 1.2,
                fontFamily: 'Georgia, serif',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                {page.text}
              </div>
            )}
            {/* Page number */}
            <div style={{
              position: 'absolute', bottom: 2, right: 4,
              fontSize: 8, color: 'rgba(0,0,0,0.35)', fontWeight: 700,
            }}>
              {idx + 1}
            </div>
          </div>

          {/* Page actions */}
          {idx === currentIdx && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'center' }}>
              <button
                onClick={() => onDuplicate(page.id)}
                title="Duplicate page"
                style={miniBtn('#4a90d9')}
              >⧉</button>
              {pages.length > 1 && (
                <button
                  onClick={() => onDelete(page.id)}
                  title="Delete page"
                  style={miniBtn('#e74c3c')}
                >🗑</button>
              )}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={onAdd}
        style={{
          background: 'linear-gradient(135deg, #4a90d9, #7b52e8)',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          padding: '10px 6px',
          fontSize: 22,
          cursor: 'pointer',
          width: '100%',
          fontWeight: 900,
          boxShadow: '0 3px 12px rgba(74,144,217,0.4)',
          marginTop: 4,
        }}
        title="Add new page"
      >
        + Page
      </button>
    </div>
  );
}

const miniBtn = (bg) => ({
  background: bg,
  color: 'white',
  border: 'none',
  borderRadius: 6,
  padding: '3px 8px',
  fontSize: 13,
  cursor: 'pointer',
});
