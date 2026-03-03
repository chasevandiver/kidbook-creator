// components/PageStrip.js
import React, { useState } from 'react';
import { LAYOUTS } from '../store/bookUtils';

const ADD_LAYOUTS = LAYOUTS.filter(l => !l.isTitlePage);

export default function PageStrip({ pages, currentIdx, onSelect, onAdd, onDelete, onDuplicate, onMove, trimSize, TRIM_SIZES }) {
  const { w, h } = TRIM_SIZES[trimSize];
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div style={{
      width: 148, flexShrink: 0,
      background: '#111622',
      borderRadius: 14, padding: '12px 8px',
      display: 'flex', flexDirection: 'column', gap: 6,
      maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', overflowX: 'visible',
    }}>
      <div style={{ color: '#445', fontSize: 10, fontWeight: 800, textAlign: 'center', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>
        {pages.length} Pages
      </div>

      {pages.map((page, idx) => (
        <div key={page.id}
          draggable
          onDragStart={e => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; }}
          onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
          onDrop={e => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) onMove(dragIdx, idx); setDragIdx(null); setOverIdx(null); }}
          onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
          style={{ opacity: dragIdx === idx ? 0.3 : 1, borderTop: overIdx === idx && dragIdx !== idx ? '3px solid #4a90d9' : '3px solid transparent' }}
        >
          <div onClick={() => onSelect(idx)} style={{
            aspectRatio: `${w}/${h}`, background: page.bgColor || '#fff',
            borderRadius: 6, cursor: 'pointer', position: 'relative', overflow: 'hidden',
            border: idx === currentIdx ? '3px solid #4a90d9' : '3px solid rgba(255,255,255,0.05)',
            boxShadow: idx === currentIdx ? '0 0 0 2px #4a90d9' : '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            {page.images.filter(img => img.src).map(img => (
              <img key={img.id} src={img.src} alt="" style={{ position:'absolute', left:`${img.x}%`, top:`${img.y}%`, width:`${img.w}%`, height:`${img.h}%`, objectFit:'contain', pointerEvents:'none' }} />
            ))}
            {page.text && (
              <div style={{
                position:'absolute',
                top: page.textZone ? `${page.textZone.y}%` : '6%',
                left: page.textZone ? `${page.textZone.x}%` : '6%',
                width: page.textZone ? `${page.textZone.w}%` : '88%',
                fontSize: 5, color: page.textColor||'#000',
                fontFamily: page.fontFamily || 'Georgia, serif',
                lineHeight: 1.3, overflow: 'hidden',
                display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical',
                textAlign: page.textAlign || 'left',
              }}>{page.text}</div>
            )}
            <div style={{ position:'absolute', bottom:2, right:3, fontSize:7, color:'rgba(0,0,0,0.3)', fontWeight:800 }}>{idx+1}</div>
          </div>

          {idx === currentIdx && (
            <div style={{ display:'flex', flexDirection:'column', gap:3, marginTop:4 }}>
              <button onClick={() => onDuplicate(page.id)} style={pb('#1e4a7a')}>Copy Page</button>
              {pages.length > 1 && (
                <button onClick={() => { if (window.confirm(`Delete page ${idx+1}?`)) onDelete(page.id); }} style={pb('#6b1a1a')}>Delete Page</button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add Page button + popover */}
      <div style={{ position: 'relative', marginTop: 6 }}>
        <button onClick={() => setShowAddMenu(s => !s)} style={{
          background: 'linear-gradient(135deg, #4a90d9, #6a4fc8)',
          color: 'white', border: 'none', borderRadius: 9,
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
            <div style={{ color:'#445', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:1, marginBottom:2 }}>Choose a layout</div>
            {ADD_LAYOUTS.map(l => (
              <button key={l.id} onClick={() => { onAdd(l.id); setShowAddMenu(false); }}
                style={{ background:'rgba(255,255,255,0.05)', color:'#dde', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, padding:'7px 10px', cursor:'pointer', textAlign:'left', fontSize:12 }}>
                <strong style={{color:'#fff'}}>{l.icon} {l.label}</strong>
                <div style={{color:'#556', fontSize:10, marginTop:1}}>{l.desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ color:'#334', fontSize:9, textAlign:'center', lineHeight:1.4, marginTop:2 }}>
        Drag pages up or down to reorder
      </div>
    </div>
  );
}

const pb = bg => ({ background: bg, color: 'white', border: 'none', borderRadius: 6, padding: '5px 4px', fontSize: 10, cursor: 'pointer', width: '100%', fontWeight: 700 });
