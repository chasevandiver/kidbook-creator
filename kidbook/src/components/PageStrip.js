// components/PageStrip.js
import React, { useState } from 'react';
import { LAYOUTS } from '../store/useBookStore';

export default function PageStrip({ pages, currentIdx, onSelect, onAdd, onDelete, onDuplicate, onMove, trimSize, TRIM_SIZES }) {
  const { w, h } = TRIM_SIZES[trimSize];
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div style={{
      width: 152, flexShrink: 0,
      background: '#131826',
      borderRadius: 16, padding: '12px 10px',
      display: 'flex', flexDirection: 'column', gap: 6,
      maxHeight: '84vh', overflowY: 'auto', overflowX: 'visible',
    }}>
      <div style={{ color: '#556', fontSize: 10, fontWeight: 800, textAlign: 'center', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
        {pages.length} Pages
      </div>

      {pages.map((page, idx) => (
        <div key={page.id}
          draggable
          onDragStart={e => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; }}
          onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
          onDrop={e => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) onMove(dragIdx, idx); setDragIdx(null); setOverIdx(null); }}
          onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
          style={{ opacity: dragIdx === idx ? 0.35 : 1, borderTop: overIdx === idx && dragIdx !== idx ? '3px solid #4a90d9' : '3px solid transparent' }}
        >
          {/* Thumbnail */}
          <div onClick={() => onSelect(idx)} style={{
            aspectRatio: `${w}/${h}`, background: page.bgColor || '#fff',
            borderRadius: 7, cursor: 'pointer', position: 'relative', overflow: 'hidden',
            border: idx === currentIdx ? '3px solid #4a90d9' : '3px solid rgba(255,255,255,0.06)',
            boxShadow: idx === currentIdx ? '0 0 0 2px #4a90d9, 0 4px 14px rgba(74,144,217,0.25)' : '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            {page.images.filter(img => img.src).map(img => (
              <img key={img.id} src={img.src} alt="" style={{ position:'absolute', left:`${img.x}%`, top:`${img.y}%`, width:`${img.w}%`, height:`${img.h}%`, objectFit:'contain', pointerEvents:'none' }} />
            ))}
            {page.text && (
              <div style={{
                position:'absolute', top:'6%', left:'5%', right:'5%',
                fontSize: 5, color: page.textColor||'#000',
                fontFamily: page.fontFamily || 'Georgia, serif',
                overflow:'hidden', lineHeight:1.3,
                display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical',
              }}>{page.text}</div>
            )}
            <div style={{ position:'absolute', bottom:2, right:4, fontSize:7, color:'rgba(0,0,0,0.35)', fontWeight:800 }}>{idx+1}</div>
            <div style={{ position:'absolute', top:2, left:'50%', transform:'translateX(-50%)', fontSize:9, color:'rgba(0,0,0,0.18)', cursor:'grab' }} title="Drag to reorder">⠿</div>
          </div>

          {/* Actions for selected page */}
          {idx === currentIdx && (
            <div style={{ display:'flex', flexDirection:'column', gap:3, marginTop:4 }}>
              <button onClick={() => onDuplicate(page.id)} style={pageBtn('#2a4a7a')}>Copy This Page</button>
              {pages.length > 1 && (
                <button
                  onClick={() => { if (window.confirm(`Delete page ${idx+1}?`)) onDelete(page.id); }}
                  style={pageBtn('#6b1a1a')}
                >Delete This Page</button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add page */}
      <div style={{ position: 'relative', marginTop: 6 }}>
        <button onClick={() => setShowAddMenu(s => !s)} style={{
          background: 'linear-gradient(135deg, #4a90d9, #6a4fc8)',
          color: 'white', border: 'none', borderRadius: 10,
          padding: '11px 6px', fontSize: 13, cursor: 'pointer',
          width: '100%', fontWeight: 800,
          boxShadow: '0 3px 12px rgba(74,144,217,0.3)',
        }}>
          + Add New Page
        </button>

        {showAddMenu && (
          <div style={{
            position: 'absolute', bottom: '110%', left: 0, right: 0,
            background: '#1a2035', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: 10, zIndex: 500,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ color: '#556', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Choose layout</div>
            {LAYOUTS.filter(l => !l.isTitlePage).map(l => (
              <button key={l.id}
                onClick={() => { onAdd(l.id); setShowAddMenu(false); }}
                style={{
                  background: 'rgba(255,255,255,0.05)', color: '#dde',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7,
                  padding: '7px 10px', cursor: 'pointer', textAlign: 'left', fontSize: 12,
                }}>
                <strong style={{ color: '#fff' }}>{l.label}</strong>
                <div style={{ color: '#667', fontSize: 10, marginTop: 1 }}>{l.desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ color:'#334', fontSize:9, textAlign:'center', lineHeight:1.4, marginTop:2 }}>
        Drag pages to reorder
      </div>
    </div>
  );
}

const pageBtn = bg => ({
  background: bg, color: 'white', border: 'none', borderRadius: 6,
  padding: '5px 4px', fontSize: 10, cursor: 'pointer', width: '100%', fontWeight: 700,
});
