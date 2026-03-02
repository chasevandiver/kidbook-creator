// components/PageCanvas.js
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { LAYOUTS, FONTS } from '../store/useBookStore';

const HANDLE_SIZE = 24;

function ImagePlaceholder({ img, canvasW, canvasH, onUpload, pageId }) {
  const fileRef = useRef(null);
  return (
    <div style={{
      position: 'absolute',
      left: `${img.x}%`, top: `${img.y}%`,
      width: `${img.w}%`, height: `${img.h}%`,
      border: '3px dashed rgba(74,144,217,0.5)',
      borderRadius: 8, background: 'rgba(74,144,217,0.05)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', zIndex: 10,
    }}
    onClick={() => fileRef.current.click()}
    >
      <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
      <div style={{ color: 'rgba(74,144,217,0.8)', fontWeight: 700, fontSize: 14, textAlign: 'center', padding: '0 12px' }}>
        Tap here to add your picture
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => onUpload(pageId, ev.target.result);
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function ImageItem({ img, pageId, onUpdate, onDelete, canvasW, canvasH, selected, onSelect }) {
  const startDrag = useCallback((e) => {
    if (img.locked) return;
    e.stopPropagation();
    onSelect();
    const cx0 = e.touches ? e.touches[0].clientX : e.clientX;
    const cy0 = e.touches ? e.touches[0].clientY : e.clientY;
    const ix0 = img.x, iy0 = img.y;
    const move = (me) => {
      const cx = me.touches ? me.touches[0].clientX : me.clientX;
      const cy = me.touches ? me.touches[0].clientY : me.clientY;
      onUpdate(pageId, img.id, {
        x: Math.max(0, Math.min(100 - img.w, ix0 + ((cx - cx0) / canvasW) * 100)),
        y: Math.max(0, Math.min(100 - img.h, iy0 + ((cy - cy0) / canvasH) * 100)),
      });
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  }, [img, pageId, onUpdate, canvasW, canvasH, onSelect]);

  const startResize = useCallback((corner, e) => {
    if (img.locked) return;
    e.stopPropagation(); e.preventDefault();
    const cx0 = e.touches ? e.touches[0].clientX : e.clientX;
    const cy0 = e.touches ? e.touches[0].clientY : e.clientY;
    const s0 = { ...img };
    const move = (me) => {
      const cx = me.touches ? me.touches[0].clientX : me.clientX;
      const cy = me.touches ? me.touches[0].clientY : me.clientY;
      const dx = ((cx - cx0) / canvasW) * 100;
      const dy = ((cy - cy0) / canvasH) * 100;
      let { x, y, w, h } = s0;
      if (corner === 'se') { w = Math.max(5, w + dx); h = Math.max(5, h + dy); }
      else if (corner === 'sw') { w = Math.max(5, w - dx); x = Math.min(s0.x + s0.w - 5, x + dx); h = Math.max(5, h + dy); }
      else if (corner === 'ne') { w = Math.max(5, w + dx); h = Math.max(5, h - dy); y = Math.min(s0.y + s0.h - 5, y + dy); }
      else if (corner === 'nw') { w = Math.max(5, w - dx); x = Math.min(s0.x + s0.w - 5, x + dx); h = Math.max(5, h - dy); y = Math.min(s0.y + s0.h - 5, y + dy); }
      onUpdate(pageId, img.id, { x, y, w, h });
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  }, [img, pageId, onUpdate, canvasW, canvasH]);

  const corners = [
    { c: 'nw', s: { top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'nw-resize' } },
    { c: 'ne', s: { top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'ne-resize' } },
    { c: 'sw', s: { bottom: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'sw-resize' } },
    { c: 'se', s: { bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'se-resize' } },
  ];

  return (
    <div
      style={{
        position: 'absolute', left: `${img.x}%`, top: `${img.y}%`,
        width: `${img.w}%`, height: `${img.h}%`,
        cursor: img.locked ? 'default' : 'move',
        outline: selected ? '3px solid #4a90d9' : 'none',
        boxSizing: 'border-box', userSelect: 'none', zIndex: img.zIndex || 2,
      }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} draggable={false} />

      {selected && !img.locked && corners.map(({ c, s }) => (
        <div key={c} onMouseDown={e => startResize(c, e)} onTouchStart={e => startResize(c, e)}
          style={{ position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE, background: '#4a90d9', borderRadius: '50%', border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', ...s }} />
      ))}

      {selected && (
        <div style={{ position: 'absolute', top: -52, left: 0, display: 'flex', gap: 6, zIndex: 300 }}>
          <button onClick={e => { e.stopPropagation(); onUpdate(pageId, img.id, { locked: !img.locked }); }}
            style={floatBtn(img.locked ? '#c47a00' : '#27ae60')}>
            {img.locked ? '🔒 Locked — tap to unlock' : '🔓 Unlocked — tap to lock'}
          </button>
          <button onClick={e => { e.stopPropagation(); if (window.confirm('Delete this picture?')) onDelete(pageId, img.id); }}
            style={floatBtn('#c0392b')}>
            🗑️ Remove Picture
          </button>
        </div>
      )}
    </div>
  );
}

const floatBtn = bg => ({
  background: bg, color: 'white', border: 'none', borderRadius: 8,
  padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
  boxShadow: '0 2px 10px rgba(0,0,0,0.5)', whiteSpace: 'nowrap',
});

export default function PageCanvas({
  page, onUpdate, onAddImage, onUpdateImage, onDeleteImage,
  onChangeLayout, trimSize, TRIM_SIZES, MARGIN, bookFontFamily,
}) {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 600 });
  const [showLayouts, setShowLayouts] = useState(false);

  const { w: trimW, h: trimH } = TRIM_SIZES[trimSize];

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setCanvasSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const marginPctX = (MARGIN / trimW) * 100;
  const marginPctY = (MARGIN / trimH) * 100;
  const tp = page.textPosition || {};
  const tx = tp.x ?? marginPctX;
  const ty = tp.y ?? marginPctY;
  const tw = tp.w ?? (100 - marginPctX * 2);
  const fontScale = canvasSize.h / (trimH * 96);
  const displayFontSize = Math.max(8, (page.fontSize || 28) * fontScale);
  const pageFontFamily = page.fontFamily || bookFontFamily || 'Georgia, serif';

  const handleTextDrag = useCallback((e) => {
    if (editing) return;
    e.stopPropagation();
    const cx0 = e.touches ? e.touches[0].clientX : e.clientX;
    const cy0 = e.touches ? e.touches[0].clientY : e.clientY;
    const tx0 = tp.x ?? marginPctX;
    const ty0 = tp.y ?? marginPctY;
    const move = (me) => {
      const cx = me.touches ? me.touches[0].clientX : me.clientX;
      const cy = me.touches ? me.touches[0].clientY : me.clientY;
      onUpdate(page.id, { textPosition: {
        ...tp,
        x: Math.max(marginPctX, Math.min(85, tx0 + ((cx - cx0) / canvasSize.w) * 100)),
        y: Math.max(marginPctY, Math.min(90, ty0 + ((cy - cy0) / canvasSize.h) * 100)),
      }});
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  }, [editing, page, onUpdate, canvasSize, tp, marginPctX, marginPctY]);

  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onAddImage(page.id, ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const hasRealImages = page.images.some(img => !img.placeholder && img.src);
  const layout = LAYOUTS.find(l => l.id === page.layoutId) || LAYOUTS[1];

  return (
    <div style={{ position: 'relative', width: '100%' }}>

      {/* ── TOOLBAR ── */}
      <div style={{
        marginBottom: 14, background: 'rgba(255,255,255,0.05)',
        borderRadius: 14, padding: '12px 16px',
        display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
        border: '1px solid rgba(255,255,255,0.09)',
      }}>
        {/* Add picture */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={toolLabel}>Picture</span>
          <button onClick={() => fileInputRef.current.click()} style={tbBtn('#4a90d9')}>
            🖼️ Add Picture
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>

        <div style={vDivider} />

        {/* Text size */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={toolLabel}>Text Size</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={() => onUpdate(page.id, { fontSize: Math.max(12, (page.fontSize||28) - 2) })} style={nudge}>Smaller</button>
            <span style={{ color: '#fff', fontWeight: 800, minWidth: 28, textAlign: 'center', fontSize: 14 }}>{page.fontSize||28}</span>
            <button onClick={() => onUpdate(page.id, { fontSize: Math.min(96, (page.fontSize||28) + 2) })} style={nudge}>Larger</button>
          </div>
        </div>

        {/* Font */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={toolLabel}>Text Style</span>
          <select
            value={pageFontFamily}
            onChange={e => onUpdate(page.id, { fontFamily: e.target.value })}
            style={{ ...nudge, padding: '6px 10px', fontSize: 13, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 7, cursor: 'pointer' }}
          >
            {FONTS.map(f => <option key={f.id} value={f.id} style={{ background: '#1a2035', color: '#fff' }}>{f.label}</option>)}
          </select>
        </div>

        {/* Text color */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={toolLabel}>Text Color</span>
          <input type="color" value={page.textColor||'#1a1a2e'}
            onChange={e => onUpdate(page.id, { textColor: e.target.value })}
            style={colorPick} title="Text color" />
        </div>

        {/* Page color */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={toolLabel}>Page Color</span>
          <input type="color" value={page.bgColor||'#ffffff'}
            onChange={e => onUpdate(page.id, { bgColor: e.target.value })}
            style={colorPick} title="Page background color" />
        </div>

        {/* Alignment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={toolLabel}>Alignment</span>
          <div style={{ display: 'flex', gap: 3 }}>
            {[{v:'left',l:'Left'},{v:'center',l:'Center'},{v:'right',l:'Right'}].map(({v,l}) => (
              <button key={v} onClick={() => onUpdate(page.id, { textAlign: v })}
                style={{ ...nudge, background: (page.textAlign||'left')===v ? '#4a90d9' : 'rgba(255,255,255,0.1)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={vDivider} />

        {/* Layout picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
          <span style={toolLabel}>Page Layout</span>
          <button onClick={() => setShowLayouts(s => !s)} style={tbBtn('#5b3fa8')}>
            ⚙️ Change Layout
          </button>
          {showLayouts && (
            <div style={{
              position: 'absolute', top: '110%', left: 0,
              background: '#1a2035', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 14, padding: 12, zIndex: 500,
              display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220,
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}>
              <div style={{ color: '#778', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Choose a layout</div>
              {LAYOUTS.map(l => (
                <button key={l.id}
                  onClick={() => { onChangeLayout(page.id, l.id); setShowLayouts(false); }}
                  style={{
                    background: page.layoutId === l.id ? 'rgba(74,144,217,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${page.layoutId === l.id ? '#4a90d9' : 'rgba(255,255,255,0.08)'}`,
                    color: '#fff', borderRadius: 8, padding: '8px 12px',
                    cursor: 'pointer', textAlign: 'left', fontSize: 13,
                  }}
                >
                  <strong>{l.label}</strong>
                  <span style={{ color: '#778', marginLeft: 6 }}>{l.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div
        ref={containerRef}
        onClick={e => { if (e.target === containerRef.current || e.target.dataset.bg) { setSelectedImageId(null); setShowLayouts(false); } }}
        data-bg="1"
        style={{
          position: 'relative', width: '100%',
          aspectRatio: `${trimW} / ${trimH}`,
          backgroundColor: page.bgColor || '#ffffff',
          boxShadow: '0 12px 50px rgba(0,0,0,0.4)',
          overflow: 'hidden', borderRadius: 4, userSelect: 'none',
        }}
      >
        {/* Guides */}
        <div style={{ position:'absolute', inset:0, outline:'2px dashed rgba(220,70,70,0.45)', pointerEvents:'none', zIndex:200 }} />
        <div style={{
          position:'absolute', top:`${marginPctY}%`, left:`${marginPctX}%`,
          right:`${marginPctX}%`, bottom:`${marginPctY}%`,
          outline:'1.5px dashed rgba(50,190,80,0.55)', pointerEvents:'none', zIndex:200,
        }} />

        {/* Images */}
        {page.images.map(img =>
          img.placeholder && !img.src ? (
            <ImagePlaceholder key={img.id} img={img} canvasW={canvasSize.w} canvasH={canvasSize.h} onUpload={onAddImage} pageId={page.id} />
          ) : img.src ? (
            <ImageItem key={img.id} img={img} pageId={page.id}
              onUpdate={onUpdateImage} onDelete={onDeleteImage}
              canvasW={canvasSize.w} canvasH={canvasSize.h}
              selected={selectedImageId === img.id}
              onSelect={() => setSelectedImageId(img.id)}
            />
          ) : null
        )}

        {/* Text block */}
        {page.layoutId !== 'full-image' && (
          <div
            onMouseDown={handleTextDrag}
            onTouchStart={handleTextDrag}
            onDoubleClick={() => setEditing(true)}
            style={{
              position: 'absolute', left: `${tx}%`, top: `${ty}%`,
              width: `${tw}%`, textAlign: page.textAlign || 'left',
              cursor: editing ? 'text' : 'move', zIndex: 50,
              padding: '3px 6px', boxSizing: 'border-box',
              border: editing ? '2px dashed #4a90d9' : '2px dashed rgba(74,144,217,0.3)',
              borderRadius: 6,
              background: editing ? 'rgba(255,255,255,0.93)' : 'transparent',
            }}
          >
            {editing ? (
              <textarea
                autoFocus
                value={page.text}
                onChange={e => onUpdate(page.id, { text: e.target.value })}
                onBlur={() => setEditing(false)}
                style={{
                  width: '100%', minHeight: 48,
                  fontSize: displayFontSize, color: page.textColor || '#1a1a2e',
                  textAlign: page.textAlign || 'left', fontFamily: pageFontFamily,
                  border: 'none', background: 'transparent', resize: 'none', outline: 'none', lineHeight: 1.5,
                }}
              />
            ) : (
              <div style={{ fontSize: displayFontSize, color: page.textColor || '#1a1a2e', fontFamily: pageFontFamily, lineHeight: 1.5, whiteSpace: 'pre-wrap', minHeight: 20 }}>
                {page.text || (
                  <span style={{ color: 'rgba(0,0,0,0.22)', fontStyle: 'italic', fontSize: Math.max(9, displayFontSize * 0.55) }}>
                    Double-click here to type your story...
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Blank hint */}
        {!page.text && !hasRealImages && page.images.length === 0 && (
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', color:'rgba(0,0,0,0.13)', pointerEvents:'none' }}>
            <div style={{ fontSize: 40 }}>📖</div>
            <div style={{ fontSize: 13, marginTop: 6, fontStyle: 'italic' }}>Use the toolbar above to add a picture or type your story</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 8, fontSize: 11, color: '#556', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span><span style={{color:'#d44'}}>- - -</span> Red = bleed (prints to the very edge)</span>
        <span><span style={{color:'#3a8'}}>- - -</span> Green = safe zone (keep all text inside here)</span>
        <span>Drag pictures and text boxes to reposition them</span>
      </div>
    </div>
  );
}

const tbBtn = bg => ({ background: bg, color: 'white', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' });
const toolLabel = { fontSize: 10, color: '#778', fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' };
const nudge = { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '5px 9px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const colorPick = { width: 42, height: 34, border: 'none', borderRadius: 7, cursor: 'pointer', padding: 2, background: 'transparent' };
const vDivider = { width: 1, height: 40, background: 'rgba(255,255,255,0.1)', alignSelf: 'flex-end', marginBottom: 2 };
