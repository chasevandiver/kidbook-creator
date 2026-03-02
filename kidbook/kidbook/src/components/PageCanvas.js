// components/PageCanvas.js
import React, { useRef, useState, useCallback, useEffect } from 'react';

const HANDLE_SIZE = 22;

function ImageItem({ img, pageId, onUpdate, onDelete, canvasW, canvasH, selected, onSelect }) {
  const startDrag = useCallback((e) => {
    if (img.locked) return;
    e.stopPropagation();
    onSelect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const startX = clientX, startY = clientY;
    const startImgX = img.x, startImgY = img.y;

    const onMove = (me) => {
      const cx = me.touches ? me.touches[0].clientX : me.clientX;
      const cy = me.touches ? me.touches[0].clientY : me.clientY;
      const dx = ((cx - startX) / canvasW) * 100;
      const dy = ((cy - startY) / canvasH) * 100;
      onUpdate(pageId, img.id, {
        x: Math.max(0, Math.min(100 - img.w, startImgX + dx)),
        y: Math.max(0, Math.min(100 - img.h, startImgY + dy)),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }, [img, pageId, onUpdate, canvasW, canvasH, onSelect]);

  const startResize = useCallback((corner, e) => {
    if (img.locked) return;
    e.stopPropagation();
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const startX = clientX, startY = clientY;
    const startState = { x: img.x, y: img.y, w: img.w, h: img.h };

    const onMove = (me) => {
      const cx = me.touches ? me.touches[0].clientX : me.clientX;
      const cy = me.touches ? me.touches[0].clientY : me.clientY;
      const dx = ((cx - startX) / canvasW) * 100;
      const dy = ((cy - startY) / canvasH) * 100;
      let { x, y, w, h } = startState;
      if (corner === 'se') { w = Math.max(5, w + dx); h = Math.max(5, h + dy); }
      else if (corner === 'sw') { w = Math.max(5, w - dx); x = Math.min(startState.x + startState.w - 5, x + dx); h = Math.max(5, h + dy); }
      else if (corner === 'ne') { w = Math.max(5, w + dx); h = Math.max(5, h - dy); y = Math.min(startState.y + startState.h - 5, y + dy); }
      else if (corner === 'nw') { w = Math.max(5, w - dx); x = Math.min(startState.x + startState.w - 5, x + dx); h = Math.max(5, h - dy); y = Math.min(startState.y + startState.h - 5, y + dy); }
      onUpdate(pageId, img.id, { x, y, w, h });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }, [img, pageId, onUpdate, canvasW, canvasH]);

  const handles = [
    { corner: 'nw', s: { top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'nw-resize' } },
    { corner: 'ne', s: { top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'ne-resize' } },
    { corner: 'sw', s: { bottom: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'sw-resize' } },
    { corner: 'se', s: { bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'se-resize' } },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: `${img.x}%`, top: `${img.y}%`,
        width: `${img.w}%`, height: `${img.h}%`,
        cursor: img.locked ? 'default' : 'move',
        outline: selected ? '3px solid #4a90d9' : 'none',
        boxSizing: 'border-box', userSelect: 'none', zIndex: img.zIndex || 1,
      }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <img src={img.src} alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
        draggable={false}
      />
      {selected && !img.locked && handles.map(({ corner, s }) => (
        <div key={corner}
          onMouseDown={(e) => startResize(corner, e)}
          onTouchStart={(e) => startResize(corner, e)}
          style={{
            position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE,
            background: '#4a90d9', borderRadius: '50%', border: '3px solid white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)', ...s,
          }}
        />
      ))}
      {selected && (
        <div style={{ position: 'absolute', top: -50, left: 0, display: 'flex', gap: 6, zIndex: 300 }}>
          <button onClick={(e) => { e.stopPropagation(); onUpdate(pageId, img.id, { locked: !img.locked }); }}
            style={overlayBtn(img.locked ? '#f5a623' : '#27ae60')}>
            {img.locked ? '🔒 Image is Locked' : '🔓 Lock this Image'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(pageId, img.id); }}
            style={overlayBtn('#e74c3c')}>
            🗑️ Delete Image
          </button>
        </div>
      )}
    </div>
  );
}

const overlayBtn = (bg) => ({
  background: bg, color: 'white', border: 'none', borderRadius: 8,
  padding: '7px 13px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
  boxShadow: '0 2px 8px rgba(0,0,0,0.5)', whiteSpace: 'nowrap',
});

export default function PageCanvas({ page, onUpdate, onAddImage, onUpdateImage, onDeleteImage, trimSize, TRIM_SIZES, MARGIN }) {
  const containerRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 600 });
  const fileInputRef = useRef(null);

  const { w: trimW, h: trimH } = TRIM_SIZES[trimSize];

  useEffect(() => {
    const observe = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCanvasSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    if (containerRef.current) observe.observe(containerRef.current);
    return () => observe.disconnect();
  }, []);

  const marginPctX = (MARGIN / trimW) * 100;
  const marginPctY = (MARGIN / trimH) * 100;

  // Text default: top-left corner of safe margin zone
  const tx = page.textPosition?.x ?? marginPctX;
  const ty = page.textPosition?.y ?? marginPctY;
  const textBoxWidth = 100 - marginPctX * 2;

  // Scale font size proportionally to canvas height vs actual print height (at 96dpi screen)
  const fontScale = canvasSize.h / (trimH * 96);
  const displayFontSize = Math.max(8, (page.fontSize || 28) * fontScale);

  const handleCanvasClick = (e) => {
    if (e.target === containerRef.current || e.target.dataset.pagebg) {
      setSelectedImageId(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onAddImage(page.id, ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTextDrag = useCallback((e) => {
    if (editing) return;
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const startX = clientX, startY = clientY;
    const startTX = page.textPosition?.x ?? marginPctX;
    const startTY = page.textPosition?.y ?? marginPctY;

    const onMove = (me) => {
      const cx = me.touches ? me.touches[0].clientX : me.clientX;
      const cy = me.touches ? me.touches[0].clientY : me.clientY;
      const dx = ((cx - startX) / canvasSize.w) * 100;
      const dy = ((cy - startY) / canvasSize.h) * 100;
      onUpdate(page.id, {
        textPosition: {
          x: Math.max(marginPctX, Math.min(85, startTX + dx)),
          y: Math.max(marginPctY, Math.min(90, startTY + dy)),
        }
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }, [editing, page, onUpdate, canvasSize, marginPctX, marginPctY]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* ── TOOLBAR ── */}
      <div style={{
        marginBottom: 14, background: 'rgba(255,255,255,0.05)',
        borderRadius: 12, padding: '12px 16px',
        display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <button onClick={() => fileInputRef.current.click()} style={tbBtn('#4a90d9')}>
          🖼️ Add Picture to This Page
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />

        <div style={toolGroup}>
          <label style={toolLabel}>Text Size</label>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={() => onUpdate(page.id, { fontSize: Math.max(12, (page.fontSize||28) - 2) })} style={nudgeBtn}>Smaller</button>
            <span style={{ color: '#fff', fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{page.fontSize||28}</span>
            <button onClick={() => onUpdate(page.id, { fontSize: Math.min(96, (page.fontSize||28) + 2) })} style={nudgeBtn}>Larger</button>
          </div>
        </div>

        <div style={toolGroup}>
          <label style={toolLabel}>Text Color</label>
          <input type="color" value={page.textColor||'#1a1a2e'}
            onChange={e => onUpdate(page.id, { textColor: e.target.value })}
            style={colorPick} title="Pick text color" />
        </div>

        <div style={toolGroup}>
          <label style={toolLabel}>Page Background Color</label>
          <input type="color" value={page.bgColor||'#ffffff'}
            onChange={e => onUpdate(page.id, { bgColor: e.target.value })}
            style={colorPick} title="Pick page background color" />
        </div>

        <div style={toolGroup}>
          <label style={toolLabel}>Text Alignment</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[{v:'left',l:'Left'},{v:'center',l:'Center'},{v:'right',l:'Right'}].map(({v,l}) => (
              <button key={v}
                onClick={() => onUpdate(page.id, { textAlign: v })}
                style={{
                  background: (page.textAlign||'center')===v ? '#4a90d9' : 'rgba(255,255,255,0.1)',
                  color: 'white', border: 'none', borderRadius: 7,
                  padding: '7px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PAGE CANVAS ── */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        data-pagebg="1"
        style={{
          position: 'relative', width: '100%',
          aspectRatio: `${trimW} / ${trimH}`,
          backgroundColor: page.bgColor || '#ffffff',
          boxShadow: '0 10px 50px rgba(0,0,0,0.35)',
          overflow: 'hidden', borderRadius: 4, userSelect: 'none',
        }}
      >
        {/* Bleed outline */}
        <div style={{ position:'absolute', inset:0, outline:'2px dashed rgba(220,70,70,0.5)', pointerEvents:'none', zIndex:200 }} />
        {/* Safe margin */}
        <div style={{
          position:'absolute',
          top:`${marginPctY}%`, left:`${marginPctX}%`,
          right:`${marginPctX}%`, bottom:`${marginPctY}%`,
          outline:'1.5px dashed rgba(50,180,80,0.6)',
          pointerEvents:'none', zIndex:200,
        }} />

        {/* Images */}
        {[...page.images].sort((a,b)=>a.zIndex-b.zIndex).map(img => (
          <ImageItem key={img.id} img={img} pageId={page.id}
            onUpdate={onUpdateImage} onDelete={onDeleteImage}
            canvasW={canvasSize.w} canvasH={canvasSize.h}
            selected={selectedImageId===img.id}
            onSelect={() => setSelectedImageId(img.id)}
          />
        ))}

        {/* Text block — top-left anchored, draggable */}
        <div
          onMouseDown={handleTextDrag}
          onTouchStart={handleTextDrag}
          onDoubleClick={() => setEditing(true)}
          style={{
            position: 'absolute',
            left: `${tx}%`, top: `${ty}%`,
            width: `${textBoxWidth}%`,
            textAlign: page.textAlign || 'center',
            cursor: editing ? 'text' : 'move',
            zIndex: 50,
            padding: '4px 6px',
            border: editing ? '2px dashed #4a90d9' : '2px dashed rgba(74,144,217,0.35)',
            borderRadius: 6,
            background: editing ? 'rgba(255,255,255,0.92)' : 'transparent',
            boxSizing: 'border-box',
          }}
        >
          {editing ? (
            <textarea
              autoFocus
              value={page.text}
              onChange={e => onUpdate(page.id, { text: e.target.value })}
              onBlur={() => setEditing(false)}
              style={{
                width: '100%', minHeight: 50,
                fontSize: displayFontSize,
                color: page.textColor || '#1a1a2e',
                textAlign: page.textAlign || 'center',
                fontFamily: "'Georgia', serif",
                border: 'none', background: 'transparent',
                resize: 'none', outline: 'none', lineHeight: 1.5,
              }}
            />
          ) : (
            <div style={{
              fontSize: displayFontSize,
              color: page.textColor || '#1a1a2e',
              fontFamily: "'Georgia', serif",
              lineHeight: 1.5, whiteSpace: 'pre-wrap', minHeight: 24,
            }}>
              {page.text || (
                <span style={{ color:'rgba(0,0,0,0.25)', fontStyle:'italic', fontSize: Math.max(10, displayFontSize * 0.6) }}>
                  Double-click here to type your story...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Empty page hint */}
        {!page.text && page.images.length === 0 && (
          <div style={{
            position:'absolute', top:'52%', left:'50%',
            transform:'translate(-50%,-50%)',
            textAlign:'center', color:'rgba(0,0,0,0.13)',
            pointerEvents:'none', zIndex:5,
          }}>
            <div style={{ fontSize:40 }}>📖</div>
            <div style={{ fontSize:13, marginTop:6, fontStyle:'italic' }}>
              Click "Add Picture" above, or double-click the text area to write
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ marginTop:8, fontSize:12, color:'#667', display:'flex', gap:18, flexWrap:'wrap' }}>
        <span><span style={{color:'#e05050'}}>- - -</span> Red = bleed (prints to edge)</span>
        <span><span style={{color:'#3cb857'}}>- - -</span> Green = safe zone (keep text inside here)</span>
        <span style={{color:'#556'}}>Drag the text box to reposition it on the page</span>
      </div>
    </div>
  );
}

const tbBtn = (bg) => ({
  background: bg, color: 'white', border: 'none', borderRadius: 10,
  padding: '11px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 3px 10px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
});
const toolGroup = { display:'flex', flexDirection:'column', gap:5 };
const toolLabel = { fontSize:11, color:'#99a', fontWeight:700, letterSpacing:0.5, textTransform:'uppercase' };
const nudgeBtn = {
  background:'rgba(255,255,255,0.12)', color:'white',
  border:'1px solid rgba(255,255,255,0.2)', borderRadius:6,
  padding:'5px 10px', fontSize:13, fontWeight:700, cursor:'pointer',
};
const colorPick = { width:44, height:36, border:'none', borderRadius:8, cursor:'pointer', padding:2, background:'transparent' };
