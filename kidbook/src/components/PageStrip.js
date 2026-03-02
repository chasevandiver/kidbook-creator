// components/PageStrip.js
import React, { useState, useRef } from 'react';

export default function PageStrip({ pages, currentIdx, onSelect, onAdd, onDelete, onDuplicate, onMove, trimSize, TRIM_SIZES }) {
  const { w, h } = TRIM_SIZES[trimSize];
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    setOverIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      onMove(dragIdx, idx);
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div style={{
      width: 148,
      flexShrink: 0,
      background: '#1a1e2e',
      borderRadius: 14,
      padding: '14px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxHeight: '82vh',
      overflowY: 'auto',
      overflowX: 'visible',
    }}>
      {/* Header */}
      <div style={{
        color: '#8899bb',
        fontSize: 11,
        fontWeight: 800,
        textAlign: 'center',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        All Pages
      </div>

      {pages.map((page, idx) => (
        <div
          key={page.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          style={{
            opacity: dragIdx === idx ? 0.4 : 1,
            borderTop: overIdx === idx && dragIdx !== idx ? '3px solid #4a90d9' : '3px solid transparent',
            transition: 'opacity 0.15s',
          }}
        >
          {/* Page thumbnail */}
          <div
            onClick={() => onSelect(idx)}
            style={{
              aspectRatio: `${w}/${h}`,
              background: page.bgColor || '#fff',
              borderRadius: 7,
              cursor: 'pointer',
              border: idx === currentIdx ? '3px solid #4a90d9' : '3px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: idx === currentIdx
                ? '0 0 0 2px #4a90d9, 0 4px 14px rgba(74,144,217,0.3)'
                : '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {/* Thumbnail images */}
            {page.images.map(img => (
              <img key={img.id} src={img.src} alt=""
                style={{
                  position:'absolute', left:`${img.x}%`, top:`${img.y}%`,
                  width:`${img.w}%`, height:`${img.h}%`,
                  objectFit:'contain', pointerEvents:'none',
                }}
              />
            ))}
            {/* Thumbnail text */}
            {page.text && (
              <div style={{
                position:'absolute', top:'8%', left:'5%', right:'5%',
                fontSize:5, color: page.textColor||'#000',
                textAlign: page.textAlign||'center',
                overflow:'hidden', lineHeight:1.2,
                fontFamily:'Georgia, serif',
                display:'-webkit-box', WebkitLineClamp:3,
                WebkitBoxOrient:'vertical',
              }}>
                {page.text}
              </div>
            )}
            {/* Page number badge */}
            <div style={{
              position:'absolute', bottom:2, right:4,
              fontSize:7, color:'rgba(0,0,0,0.4)', fontWeight:800,
            }}>
              {idx + 1}
            </div>
            {/* Drag handle indicator */}
            <div style={{
              position:'absolute', top:2, left:'50%', transform:'translateX(-50%)',
              fontSize:8, color:'rgba(0,0,0,0.2)', cursor:'grab', letterSpacing:1,
            }} title="Drag to reorder">
              ⠿
            </div>
          </div>

          {/* Action buttons — only show for selected page */}
          {idx === currentIdx && (
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:5 }}>
              <button
                onClick={() => onDuplicate(page.id)}
                style={pageActionBtn('#3a6fa8')}
                title="Make a copy of this page"
              >
                Copy This Page
              </button>
              {pages.length > 1 && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete page ${idx + 1}? This cannot be undone.`)) {
                      onDelete(page.id);
                    }
                  }}
                  style={pageActionBtn('#8b2020')}
                  title="Delete this page"
                >
                  Delete Page
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add page button */}
      <button
        onClick={onAdd}
        style={{
          background: 'linear-gradient(135deg, #4a90d9, #6a4fc8)',
          color: 'white', border: 'none', borderRadius: 10,
          padding: '12px 6px', fontSize: 14, cursor: 'pointer',
          width: '100%', fontWeight: 800,
          boxShadow: '0 3px 12px rgba(74,144,217,0.35)',
          marginTop: 6, letterSpacing: 0.3,
        }}
      >
        + Add New Page
      </button>

      <div style={{ color:'#445', fontSize:10, textAlign:'center', lineHeight:1.4, marginTop:2 }}>
        Drag pages up or down to reorder them
      </div>
    </div>
  );
}

const pageActionBtn = (bg) => ({
  background: bg, color: 'white', border: 'none', borderRadius: 7,
  padding: '6px 4px', fontSize: 11, cursor: 'pointer',
  width: '100%', fontWeight: 700, textAlign: 'center',
});
