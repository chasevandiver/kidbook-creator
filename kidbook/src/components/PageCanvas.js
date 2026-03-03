// components/PageCanvas.js
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { LAYOUTS, FONTS, OVERLAY_STYLES } from '../store/bookUtils';

const HANDLE_SIZE = 22;

// ── Layout picker ─────────────────────────────────────────────────────────────
function LayoutPicker({ currentLayoutId, onSelect }) {
  return (
    <div style={{
      display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
      padding: '8px 14px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '0 0 0 0',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ fontSize: 10, color: '#667', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>
        Page Layout:
      </span>
      {LAYOUTS.map(l => {
        const active = currentLayoutId === l.id;
        return (
          <button key={l.id} onClick={() => onSelect(l.id)} title={l.desc}
            style={{
              background: active ? '#4a90d9' : 'rgba(255,255,255,0.07)',
              color: active ? '#fff' : '#99a',
              border: `2px solid ${active ? '#4a90d9' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8, padding: '5px 12px',
              fontSize: 12, fontWeight: active ? 800 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Image placeholder ─────────────────────────────────────────────────────────
function ImagePlaceholder({ img, pageId, onUpload }) {
  const fileRef = useRef(null);
  return (
    <div style={{
      position: 'absolute', left: `${img.x}%`, top: `${img.y}%`,
      width: `${img.w}%`, height: `${img.h}%`,
      border: '3px dashed rgba(74,144,217,0.5)', borderRadius: 8,
      background: 'rgba(74,144,217,0.04)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', zIndex: 10, boxSizing: 'border-box',
    }} onClick={() => fileRef.current.click()}>
      <div style={{ fontSize: 30, marginBottom: 5 }}>🖼️</div>
      <div style={{ color: 'rgba(74,144,217,0.85)', fontWeight: 700, fontSize: 12, textAlign: 'center', padding: '0 8px', lineHeight: 1.4 }}>
        Tap to add your picture
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files[0]; if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => onUpload(pageId, ev.target.result);
          reader.readAsDataURL(file); e.target.value = '';
        }} />
    </div>
  );
}

// ── Drag/resize helper ────────────────────────────────────────────────────────
function useDragResize({ x, y, w, h, canvasW, canvasH, locked, onMove, onResize }) {
  const startDrag = useCallback((e) => {
    if (locked) return;
    e.stopPropagation();
    const cx0 = e.touches ? e.touches[0].clientX : e.clientX;
    const cy0 = e.touches ? e.touches[0].clientY : e.clientY;
    const x0 = x, y0 = y;
    const move = me => {
      const cx = me.touches ? me.touches[0].clientX : me.clientX;
      const cy = me.touches ? me.touches[0].clientY : me.clientY;
      onMove(
        Math.max(0, Math.min(100 - w, x0 + ((cx - cx0) / canvasW) * 100)),
        Math.max(0, Math.min(100 - h, y0 + ((cy - cy0) / canvasH) * 100))
      );
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up);
  }, [x, y, w, h, locked, onMove, canvasW, canvasH]);

  const startResize = useCallback((corner, e) => {
    if (locked) return;
    e.stopPropagation(); e.preventDefault();
    const cx0 = e.touches ? e.touches[0].clientX : e.clientX;
    const cy0 = e.touches ? e.touches[0].clientY : e.clientY;
    const s0 = { x, y, w, h };
    const move = me => {
      const cx = me.touches ? me.touches[0].clientX : me.clientX;
      const cy = me.touches ? me.touches[0].clientY : me.clientY;
      const dx = ((cx - cx0) / canvasW) * 100, dy = ((cy - cy0) / canvasH) * 100;
      let { x: nx, y: ny, w: nw, h: nh } = s0;
      if (corner === 'se') { nw = Math.max(10, nw + dx); nh = Math.max(5, nh + dy); }
      else if (corner === 'sw') { nw = Math.max(10, nw - dx); nx = Math.min(s0.x + s0.w - 10, nx + dx); nh = Math.max(5, nh + dy); }
      else if (corner === 'ne') { nw = Math.max(10, nw + dx); nh = Math.max(5, nh - dy); ny = Math.min(s0.y + s0.h - 5, ny + dy); }
      else if (corner === 'nw') { nw = Math.max(10, nw - dx); nx = Math.min(s0.x + s0.w - 10, nx + dx); nh = Math.max(5, nh - dy); ny = Math.min(s0.y + s0.h - 5, ny + dy); }
      onResize(nx, ny, nw, nh);
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up);
  }, [x, y, w, h, locked, onResize, canvasW, canvasH]);

  return { startDrag, startResize };
}

const CORNERS = [
  { c: 'nw', s: { top: -HANDLE_SIZE/2, left:  -HANDLE_SIZE/2, cursor: 'nw-resize' } },
  { c: 'ne', s: { top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'ne-resize' } },
  { c: 'sw', s: { bottom: -HANDLE_SIZE/2, left:  -HANDLE_SIZE/2, cursor: 'sw-resize' } },
  { c: 'se', s: { bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'se-resize' } },
];

// ── Image item ────────────────────────────────────────────────────────────────
function ImageItem({ img, pageId, onUpdate, onDelete, canvasW, canvasH, selected, onSelect }) {
  const { startDrag, startResize } = useDragResize({
    x: img.x, y: img.y, w: img.w, h: img.h,
    canvasW, canvasH, locked: img.locked,
    onMove: (nx, ny) => onUpdate(pageId, img.id, { x: nx, y: ny }),
    onResize: (nx, ny, nw, nh) => onUpdate(pageId, img.id, { x: nx, y: ny, w: nw, h: nh }),
  });
  return (
    <div style={{ position:'absolute', left:`${img.x}%`, top:`${img.y}%`, width:`${img.w}%`, height:`${img.h}%`, cursor: img.locked ? 'default' : 'move', outline: selected ? '3px solid #4a90d9' : 'none', boxSizing:'border-box', userSelect:'none', zIndex: img.zIndex || 2 }}
      onMouseDown={e => { onSelect(); startDrag(e); }} onTouchStart={e => { onSelect(); startDrag(e); }}>
      <img src={img.src} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', pointerEvents:'none' }} draggable={false} />
      {selected && !img.locked && CORNERS.map(({ c, s }) => (
        <div key={c} onMouseDown={e => startResize(c, e)} onTouchStart={e => startResize(c, e)}
          style={{ position:'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE, background:'#4a90d9', borderRadius:'50%', border:'3px solid white', boxShadow:'0 2px 8px rgba(0,0,0,0.5)', ...s }} />
      ))}
      {selected && (
        <div style={{ position:'absolute', top:-50, left:0, display:'flex', gap:6, zIndex:300 }}>
          <button onClick={e => { e.stopPropagation(); onUpdate(pageId, img.id, { locked: !img.locked }); }} style={fb(img.locked ? '#b07000' : '#1e7e44')}>
            {img.locked ? '🔒 Locked' : '🔓 Lock in place'}
          </button>
          <button onClick={e => { e.stopPropagation(); if (window.confirm('Remove this picture?')) onDelete(pageId, img.id); }} style={fb('#b52020')}>
            🗑️ Remove Picture
          </button>
        </div>
      )}
    </div>
  );
}

// ── Overlay text box (floats over images) ─────────────────────────────────────
function OverlayItem({ overlay, pageId, onUpdate, onDelete, canvasW, canvasH, selected, onSelect, fontScale, bookFontFamily }) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef(null);
  const style = OVERLAY_STYLES.find(s => s.id === overlay.styleId) || OVERLAY_STYLES[1];
  const displayFontSize = Math.max(7, (overlay.fontSize || 28) * fontScale);
  const fontFamily = overlay.fontFamily || bookFontFamily || 'Georgia, serif';

  const { startDrag, startResize } = useDragResize({
    x: overlay.x, y: overlay.y, w: overlay.w, h: overlay.h,
    canvasW, canvasH, locked: false,
    onMove: (nx, ny) => onUpdate(pageId, overlay.id, { x: nx, y: ny }),
    onResize: (nx, ny, nw, nh) => onUpdate(pageId, overlay.id, { x: nx, y: ny, w: nw, h: nh }),
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${overlay.x}%`, top: `${overlay.y}%`,
        width: `${overlay.w}%`, height: `${overlay.h}%`,
        background: style.bg,
        outline: selected ? '3px solid #f5a623' : '2px dashed rgba(245,166,35,0.4)',
        borderRadius: 4, boxSizing: 'border-box',
        zIndex: overlay.zIndex || 100,
        cursor: editing ? 'text' : 'move',
        overflow: 'hidden',
        display: 'flex', alignItems: 'flex-start',
        padding: `${Math.max(4, displayFontSize * 0.15)}px ${Math.max(6, displayFontSize * 0.2)}px`,
      }}
      onMouseDown={e => { if (!editing) { onSelect(); startDrag(e); } }}
      onTouchStart={e => { if (!editing) { onSelect(); startDrag(e); } }}
      onDoubleClick={() => { setEditing(true); setTimeout(() => textareaRef.current?.focus(), 30); }}
    >
      {editing ? (
        <textarea ref={textareaRef} autoFocus value={overlay.text}
          onChange={e => onUpdate(pageId, overlay.id, { text: e.target.value })}
          onBlur={() => setEditing(false)}
          style={{
            width: '100%', height: '100%', fontSize: displayFontSize,
            color: overlay.textColor || style.textColor,
            textAlign: overlay.textAlign || 'center',
            fontFamily,
            border: 'none', background: 'transparent',
            resize: 'none', outline: 'none', lineHeight: 1.45,
            textShadow: style.shadow,
          }}
        />
      ) : (
        <div style={{
          width: '100%', fontSize: displayFontSize,
          color: overlay.textColor || style.textColor,
          fontFamily,
          textAlign: overlay.textAlign || 'center',
          lineHeight: 1.45, whiteSpace: 'pre-wrap', overflow: 'hidden',
          textShadow: style.shadow,
          minHeight: displayFontSize * 1.5,
        }}>
          {overlay.text || (
            <span style={{ opacity: 0.5, fontStyle: 'italic', fontSize: Math.max(7, displayFontSize * 0.6) }}>
              Double-click to type...
            </span>
          )}
        </div>
      )}

      {/* Resize handles */}
      {selected && CORNERS.map(({ c, s }) => (
        <div key={c} onMouseDown={e => startResize(c, e)} onTouchStart={e => startResize(c, e)}
          style={{ position:'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE, background:'#f5a623', borderRadius:'50%', border:'3px solid white', boxShadow:'0 2px 8px rgba(0,0,0,0.5)', ...s }} />
      ))}

      {/* Overlay controls panel */}
      {selected && (
        <div style={{ position:'absolute', top:-110, left:0, zIndex:500, background:'#1a2035', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'8px 10px', display:'flex', flexDirection:'column', gap:6, minWidth:300, boxShadow:'0 6px 24px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize:10, color:'#778', fontWeight:800, textTransform:'uppercase', letterSpacing:1 }}>Text Over Image</div>
          {/* Style presets */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {OVERLAY_STYLES.map(s => (
              <button key={s.id} onClick={e => { e.stopPropagation(); onUpdate(pageId, overlay.id, { styleId: s.id }); }}
                style={{ background: overlay.styleId===s.id ? '#f5a623' : 'rgba(255,255,255,0.1)', color: overlay.styleId===s.id ? '#000' : '#fff', border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                {s.label}
              </button>
            ))}
          </div>
          {/* Font size and delete row */}
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <button onClick={e => { e.stopPropagation(); onUpdate(pageId, overlay.id, { fontSize: Math.max(10, (overlay.fontSize||28) - 2) }); }} style={sm}>A− Smaller</button>
            <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>{overlay.fontSize||28}pt</span>
            <button onClick={e => { e.stopPropagation(); onUpdate(pageId, overlay.id, { fontSize: Math.min(96, (overlay.fontSize||28) + 2) }); }} style={sm}>A+ Larger</button>
            <div style={{ flex:1 }} />
            {['left','center','right'].map(a => (
              <button key={a} onClick={e => { e.stopPropagation(); onUpdate(pageId, overlay.id, { textAlign: a }); }}
                style={{ ...sm, background: (overlay.textAlign||'center')===a ? '#f5a623' : 'rgba(255,255,255,0.1)', color: (overlay.textAlign||'center')===a ? '#000' : '#fff' }}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
            <button onClick={e => { e.stopPropagation(); if (window.confirm('Remove this text?')) onDelete(pageId, overlay.id); }} style={fb('#b52020')}>
              🗑️ Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const fb = bg => ({ background: bg, color: 'white', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' });
const sm = { background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '3px 7px', fontSize: 11, fontWeight: 700, cursor: 'pointer' };

// ── Main PageCanvas ───────────────────────────────────────────────────────────
export default function PageCanvas({ page, onUpdate, onAddImage, onUpdateImage, onDeleteImage, onChangeLayout, onAddOverlay, onUpdateOverlay, onDeleteOverlay, trimSize, TRIM_SIZES, MARGIN, bookFontFamily }) {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [editingZone, setEditingZone] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 600 });

  const { w: trimW, h: trimH } = TRIM_SIZES[trimSize];
  useEffect(() => {
    const obs = new ResizeObserver(entries => { for (const e of entries) setCanvasSize({ w: e.contentRect.width, h: e.contentRect.height }); });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const tz = page.textZone;
  const pageFontFamily = page.fontFamily || bookFontFamily || 'Georgia, serif';
  const fontScale = canvasSize.h / (trimH * 96);
  const displayFontSize = Math.max(7, (page.fontSize || 24) * fontScale);

  const handleFileUpload = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onAddImage(page.id, ev.target.result);
    reader.readAsDataURL(file); e.target.value = '';
  };

  const clearSelection = e => {
    if (e.target === containerRef.current || e.target.dataset.bg) {
      setSelectedImageId(null); setSelectedOverlayId(null);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>

      {/* ── TOOLBAR ── */}
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: '12px 12px 0 0',
        padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
        border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
      }}>
        {/* Add picture */}
        <div style={tg}>
          <span style={tl}>Picture</span>
          <button onClick={() => fileInputRef.current.click()} style={tbBtn('#3a78c9')}>🖼️ Add Picture</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>

        {/* Add text overlay */}
        <div style={tg}>
          <span style={tl}>Text Over Image</span>
          <button onClick={() => { onAddOverlay(page.id); setSelectedOverlayId(null); }} style={tbBtn('#c47a00')}>
            ✍️ Add Text on Image
          </button>
        </div>

        <div style={vDiv} />

        {/* Text size */}
        <div style={tg}>
          <span style={tl}>Story Text Size</span>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            <button onClick={() => onUpdate(page.id, { fontSize: Math.max(10, (page.fontSize||24) - 2) })} style={nudge}>A− Smaller</button>
            <span style={{ color:'#fff', fontWeight:800, minWidth:24, textAlign:'center' }}>{page.fontSize||24}</span>
            <button onClick={() => onUpdate(page.id, { fontSize: Math.min(96, (page.fontSize||24) + 2) })} style={nudge}>A+ Larger</button>
          </div>
        </div>

        {/* Font */}
        <div style={tg}>
          <span style={tl}>Text Style</span>
          <select value={pageFontFamily} onChange={e => onUpdate(page.id, { fontFamily: e.target.value })}
            style={{ ...nudge, padding:'6px 10px', background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:7, cursor:'pointer', fontSize:13 }}>
            {FONTS.map(f => <option key={f.id} value={f.id} style={{ background:'#1a2035', color:'#fff' }}>{f.label}</option>)}
          </select>
        </div>

        {/* Text color */}
        <div style={tg}>
          <span style={tl}>Text Color</span>
          <input type="color" value={page.textColor||'#1a1a2e'} onChange={e => onUpdate(page.id, { textColor: e.target.value })} style={cp} />
        </div>

        {/* Page color */}
        <div style={tg}>
          <span style={tl}>Page Color</span>
          <input type="color" value={page.bgColor||'#ffffff'} onChange={e => onUpdate(page.id, { bgColor: e.target.value })} style={cp} />
        </div>

        {/* Alignment */}
        <div style={tg}>
          <span style={tl}>Alignment</span>
          <div style={{ display:'flex', gap:3 }}>
            {[{v:'left',l:'Left'},{v:'center',l:'Center'},{v:'right',l:'Right'}].map(({v,l}) => (
              <button key={v} onClick={() => onUpdate(page.id, { textAlign: v })}
                style={{ ...nudge, background:(page.textAlign||'left')===v?'#4a90d9':'rgba(255,255,255,0.1)' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LAYOUT ROW ── */}
      <LayoutPicker currentLayoutId={page.layoutId} onSelect={id => onChangeLayout(page.id, id)} />

      {/* ── CANVAS ── */}
      <div style={{ width:'100%', maxHeight:'calc(100vh - 300px)', aspectRatio:`${trimW}/${trimH}`, position:'relative', marginTop:10 }}>
        <div ref={containerRef} onClick={clearSelection} data-bg="1"
          style={{ position:'absolute', inset:0, backgroundColor: page.bgColor||'#ffffff', boxShadow:'0 8px 40px rgba(0,0,0,0.45)', overflow:'hidden', borderRadius:3, userSelect:'none' }}>

          {/* Safe margin guide */}
          <div style={{ position:'absolute', top:`${(MARGIN/trimH)*100}%`, left:`${(MARGIN/trimW)*100}%`, right:`${(MARGIN/trimW)*100}%`, bottom:`${(MARGIN/trimH)*100}%`, outline:'1.5px dashed rgba(50,190,80,0.45)', pointerEvents:'none', zIndex:200 }} />

          {/* Images */}
          {page.images.map(img =>
            img.placeholder && !img.src
              ? <ImagePlaceholder key={img.id} img={img} pageId={page.id} onUpload={onAddImage} />
              : img.src
                ? <ImageItem key={img.id} img={img} pageId={page.id}
                    onUpdate={onUpdateImage} onDelete={onDeleteImage}
                    canvasW={canvasSize.w} canvasH={canvasSize.h}
                    selected={selectedImageId === img.id}
                    onSelect={() => { setSelectedImageId(img.id); setSelectedOverlayId(null); }}
                  />
                : null
          )}

          {/* Text overlays (on top of images) */}
          {(page.overlays||[]).map(overlay => (
            <OverlayItem key={overlay.id} overlay={overlay} pageId={page.id}
              onUpdate={onUpdateOverlay} onDelete={onDeleteOverlay}
              canvasW={canvasSize.w} canvasH={canvasSize.h}
              selected={selectedOverlayId === overlay.id}
              onSelect={() => { setSelectedOverlayId(overlay.id); setSelectedImageId(null); }}
              fontScale={fontScale}
              bookFontFamily={pageFontFamily}
            />
          ))}

          {/* Layout text zone */}
          {tz && (
            <div
              onDoubleClick={() => { setEditingZone(true); setTimeout(() => textareaRef.current?.focus(), 30); }}
              style={{
                position:'absolute', left:`${tz.x}%`, top:`${tz.y}%`,
                width:`${tz.w}%`, height:`${tz.h}%`,
                boxSizing:'border-box',
                padding:`${displayFontSize*0.15}px ${displayFontSize*0.25}px`,
                border: editingZone ? '2px dashed #4a90d9' : '2px dashed rgba(74,144,217,0.3)',
                borderRadius:5,
                background: editingZone ? 'rgba(255,255,255,0.95)' : 'transparent',
                overflow:'hidden', cursor:'text', zIndex:50,
              }}>
              {editingZone ? (
                <textarea ref={textareaRef} autoFocus value={page.text}
                  onChange={e => onUpdate(page.id, { text: e.target.value })}
                  onBlur={() => setEditingZone(false)}
                  style={{ width:'100%', height:'100%', fontSize:displayFontSize, color:page.textColor||'#1a1a2e', textAlign:page.textAlign||'left', fontFamily:pageFontFamily, border:'none', background:'transparent', resize:'none', outline:'none', lineHeight:1.55, padding:0 }}
                />
              ) : (
                <div style={{ fontSize:displayFontSize, color:page.textColor||'#1a1a2e', fontFamily:pageFontFamily, lineHeight:1.55, whiteSpace:'pre-wrap', height:'100%', overflow:'hidden', textAlign:page.textAlign||'left' }}>
                  {page.text || <span style={{ color:'rgba(0,0,0,0.2)', fontStyle:'italic', fontSize:Math.max(8,displayFontSize*0.6) }}>Double-click here to type your story...</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hint */}
      <div style={{ marginTop:8, fontSize:11, color:'#556', display:'flex', gap:16, flexWrap:'wrap' }}>
        <span><span style={{color:'#3a8'}}>- - -</span> Green = safe zone</span>
        <span style={{color:'#888'}}>💡 Use "Add Text on Image" to put words directly on top of a picture</span>
      </div>
    </div>
  );
}

const tg = { display:'flex', flexDirection:'column', gap:4 };
const tl = { fontSize:10, color:'#667', fontWeight:800, letterSpacing:0.8, textTransform:'uppercase' };
const tbBtn = bg => ({ background:bg, color:'white', border:'none', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' });
const nudge = { background:'rgba(255,255,255,0.1)', color:'white', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'5px 9px', fontSize:12, fontWeight:700, cursor:'pointer' };
const cp = { width:42, height:34, border:'none', borderRadius:7, cursor:'pointer', padding:2, background:'transparent' };
const vDiv = { width:1, height:38, background:'rgba(255,255,255,0.1)', alignSelf:'flex-end', marginBottom:2 };
