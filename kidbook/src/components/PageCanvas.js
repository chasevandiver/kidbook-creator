// components/PageCanvas.js
import React, { useRef, useState, useCallback, useEffect } from 'react';

const HANDLE_SIZE = 20;

function ImageItem({ img, pageId, onUpdate, onDelete, canvasW, canvasH, selected, onSelect }) {
  const dragRef = useRef(null);
  const [resizing, setResizing] = useState(null);

  const startDrag = useCallback((e) => {
    if (img.locked) return;
    e.stopPropagation();
    onSelect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startImgX = img.x;
    const startImgY = img.y;

    const onMove = (me) => {
      const dx = ((me.clientX - startX) / canvasW) * 100;
      const dy = ((me.clientY - startY) / canvasH) * 100;
      onUpdate(pageId, img.id, {
        x: Math.max(0, Math.min(100 - img.w, startImgX + dx)),
        y: Math.max(0, Math.min(100 - img.h, startImgY + dy)),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [img, pageId, onUpdate, canvasW, canvasH, onSelect]);

  const startResize = useCallback((corner, e) => {
    if (img.locked) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startState = { x: img.x, y: img.y, w: img.w, h: img.h };

    const onMove = (me) => {
      const dx = ((me.clientX - startX) / canvasW) * 100;
      const dy = ((me.clientY - startY) / canvasH) * 100;
      let { x, y, w, h } = startState;
      if (corner === 'se') {
        w = Math.max(5, w + dx);
        h = Math.max(5, h + dy);
      } else if (corner === 'sw') {
        w = Math.max(5, w - dx);
        x = Math.min(startState.x + startState.w - 5, x + dx);
        h = Math.max(5, h + dy);
      } else if (corner === 'ne') {
        w = Math.max(5, w + dx);
        h = Math.max(5, h - dy);
        y = Math.min(startState.y + startState.h - 5, y + dy);
      } else if (corner === 'nw') {
        w = Math.max(5, w - dx);
        x = Math.min(startState.x + startState.w - 5, x + dx);
        h = Math.max(5, h - dy);
        y = Math.min(startState.y + startState.h - 5, y + dy);
      }
      onUpdate(pageId, img.id, { x, y, w, h });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [img, pageId, onUpdate, canvasW, canvasH]);

  const style = {
    position: 'absolute',
    left: `${img.x}%`,
    top: `${img.y}%`,
    width: `${img.w}%`,
    height: `${img.h}%`,
    cursor: img.locked ? 'default' : 'move',
    outline: selected ? '3px solid #4a90d9' : 'none',
    boxSizing: 'border-box',
    userSelect: 'none',
    zIndex: img.zIndex || 1,
  };

  const handles = [
    { corner: 'nw', style: { top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'nw-resize' } },
    { corner: 'ne', style: { top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'ne-resize' } },
    { corner: 'sw', style: { bottom: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'sw-resize' } },
    { corner: 'se', style: { bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'se-resize' } },
  ];

  return (
    <div style={style} onMouseDown={startDrag}>
      <img
        src={img.src}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
        draggable={false}
      />
      {selected && !img.locked && handles.map(({ corner, style: hs }) => (
        <div
          key={corner}
          onMouseDown={(e) => startResize(corner, e)}
          style={{
            position: 'absolute',
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            background: '#4a90d9',
            borderRadius: '50%',
            border: '2px solid white',
            ...hs,
          }}
        />
      ))}
      {selected && (
        <div style={{ position: 'absolute', top: -36, left: 0, display: 'flex', gap: 4 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(pageId, img.id, { locked: !img.locked }); }}
            style={toolBtn(img.locked ? '#f5a623' : '#7ed321')}
            title={img.locked ? 'Unlock image' : 'Lock image'}
          >
            {img.locked ? '🔒' : '🔓'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(pageId, img.id); }}
            style={toolBtn('#e74c3c')}
            title="Delete image"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

function toolBtn(bg) {
  return {
    background: bg,
    border: 'none',
    borderRadius: 6,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  };
}

export default function PageCanvas({ page, onUpdate, onAddImage, onUpdateImage, onDeleteImage, trimSize, TRIM_SIZES, MARGIN }) {
  const containerRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const fileInputRef = useRef(null);

  const { w: trimW, h: trimH } = TRIM_SIZES[trimSize];
  const aspectRatio = trimW / trimH;

  useEffect(() => {
    const observe = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cw = entry.contentRect.width;
        const ch = entry.contentRect.height;
        setCanvasSize({ w: cw, h: ch });
      }
    });
    if (containerRef.current) observe.observe(containerRef.current);
    return () => observe.disconnect();
  }, []);

  const marginPctX = (MARGIN / trimW) * 100;
  const marginPctY = (MARGIN / trimH) * 100;

  const handleCanvasClick = (e) => {
    if (e.target === containerRef.current || e.target.classList.contains('page-bg')) {
      setSelectedImageId(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onAddImage(page.id, ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTextDrag = useCallback((e) => {
    if (editing) return;
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startTX = page.textPosition?.x ?? 50;
    const startTY = page.textPosition?.y ?? 78;

    const onMove = (me) => {
      const dx = ((me.clientX - startX) / canvasSize.w) * 100;
      const dy = ((me.clientY - startY) / canvasSize.h) * 100;
      onUpdate(page.id, {
        textPosition: {
          x: Math.max(10, Math.min(90, startTX + dx)),
          y: Math.max(10, Math.min(95, startTY + dy)),
        }
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [editing, page, onUpdate, canvasSize]);

  const tx = page.textPosition?.x ?? 50;
  const ty = page.textPosition?.y ?? 78;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Upload button */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => fileInputRef.current.click()}
          style={bigBtn('#4a90d9')}
        >
          🖼️ Add Picture
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={labelStyle}>Text size:</label>
          <input
            type="range" min={16} max={72} value={page.fontSize || 28}
            onChange={e => onUpdate(page.id, { fontSize: Number(e.target.value) })}
            style={{ width: 100 }}
          />
          <span style={{ fontSize: 14 }}>{page.fontSize || 28}pt</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={labelStyle}>Text color:</label>
          <input type="color" value={page.textColor || '#1a1a2e'}
            onChange={e => onUpdate(page.id, { textColor: e.target.value })}
            style={{ width: 40, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={labelStyle}>Page color:</label>
          <input type="color" value={page.bgColor || '#ffffff'}
            onChange={e => onUpdate(page.id, { bgColor: e.target.value })}
            style={{ width: 40, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['left', 'center', 'right'].map(align => (
            <button key={align}
              onClick={() => onUpdate(page.id, { textAlign: align })}
              style={{ ...smallBtn, background: page.textAlign === align ? '#4a90d9' : '#e0e0e0' }}
              title={`${align} align`}
            >
              {align === 'left' ? '◀' : align === 'center' ? '☰' : '▶'}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className="page-bg"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${trimW} / ${trimH}`,
          backgroundColor: page.bgColor || '#ffffff',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          borderRadius: 4,
          userSelect: 'none',
        }}
      >
        {/* Bleed zone indicator */}
        <div style={{
          position: 'absolute', inset: 0,
          outline: '2px dashed rgba(255,100,100,0.35)',
          pointerEvents: 'none', zIndex: 100,
        }} />
        {/* Margin safe zone */}
        <div style={{
          position: 'absolute',
          top: `${marginPctY}%`, left: `${marginPctX}%`,
          right: `${marginPctX}%`, bottom: `${marginPctY}%`,
          outline: '1.5px dashed rgba(80,160,80,0.5)',
          pointerEvents: 'none', zIndex: 100,
        }} />

        {/* Images */}
        {page.images.map(img => (
          <ImageItem
            key={img.id}
            img={img}
            pageId={page.id}
            onUpdate={onUpdateImage}
            onDelete={onDeleteImage}
            canvasW={canvasSize.w}
            canvasH={canvasSize.h}
            selected={selectedImageId === img.id}
            onSelect={() => setSelectedImageId(img.id)}
          />
        ))}

        {/* Text */}
        <div
          onMouseDown={handleTextDrag}
          onDoubleClick={() => setEditing(true)}
          style={{
            position: 'absolute',
            left: `${tx}%`,
            top: `${ty}%`,
            transform: 'translate(-50%, -50%)',
            width: '80%',
            textAlign: page.textAlign || 'center',
            cursor: editing ? 'text' : 'move',
            zIndex: 50,
            padding: 4,
            border: editing ? '2px dashed #4a90d9' : '2px dashed transparent',
            borderRadius: 6,
            background: editing ? 'rgba(255,255,255,0.85)' : 'transparent',
          }}
        >
          {editing ? (
            <textarea
              autoFocus
              value={page.text}
              onChange={e => onUpdate(page.id, { text: e.target.value })}
              onBlur={() => setEditing(false)}
              style={{
                width: '100%',
                minHeight: 60,
                fontSize: page.fontSize || 28,
                color: page.textColor || '#1a1a2e',
                textAlign: page.textAlign || 'center',
                fontFamily: "'Georgia', serif",
                border: 'none',
                background: 'transparent',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.4,
              }}
            />
          ) : (
            <div
              style={{
                fontSize: page.fontSize || 28,
                color: page.textColor || '#1a1a2e',
                fontFamily: "'Georgia', serif",
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                minHeight: 40,
                cursor: 'move',
              }}
            >
              {page.text || (
                <span style={{ color: 'rgba(0,0,0,0.25)', fontStyle: 'italic', fontSize: 20 }}>
                  Double-tap here to add text...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hint */}
        {!editing && !page.text && page.images.length === 0 && (
          <div style={{
            position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%)',
            textAlign: 'center', color: 'rgba(0,0,0,0.18)', pointerEvents: 'none', zIndex: 10,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📖</div>
            <div style={{ fontSize: 18, fontStyle: 'italic' }}>Add a picture or text to this page</div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
        <span style={{ color: '#e74c3c' }}>— — —</span> Red border = bleed area &nbsp;|&nbsp;
        <span style={{ color: '#27ae60' }}>— — —</span> Green box = safe margin zone
      </div>
    </div>
  );
}

const bigBtn = (bg) => ({
  background: bg,
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '10px 18px',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
});

const smallBtn = {
  border: 'none',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 14,
  cursor: 'pointer',
};

const labelStyle = { fontSize: 14, color: '#444', fontWeight: 600 };
