// App.js
import React, { useState } from 'react';
import { useBookStore } from './store/useBookStore';
import PageCanvas from './components/PageCanvas';
import PageStrip from './components/PageStrip';
import PreviewMode from './components/PreviewMode';
import { exportToPDF } from './utils/exportPDF';

export default function App() {
  const {
    book, TRIM_SIZES, BLEED, MARGIN,
    setCurrentPage, updatePage, addPage, deletePage, duplicatePage, movePage,
    addImage, updateImage, deleteImage,
    setTrimSize, setTitle,
    currentPage,
  } = useBookStore();

  const [preview, setPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPDF(book, TRIM_SIZES);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    setExporting(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('kidbook_autosave', JSON.stringify(book));
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
    } catch (e) {
      alert('Could not save — your browser storage may be full.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0c1020 0%, #161d35 100%)',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      padding: '14px 18px',
      boxSizing: 'border-box',
    }}>
      {preview && (
        <PreviewMode book={book} TRIM_SIZES={TRIM_SIZES} onClose={() => setPreview(false)} />
      )}

      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 10,
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 30 }}>📚</span>
          {editingTitle ? (
            <input
              autoFocus
              value={book.title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              style={{
                fontSize: 22, fontWeight: 800,
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '2px solid #4a90d9', borderRadius: 8,
                padding: '4px 12px', outline: 'none', minWidth: 220,
              }}
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              title="Click to rename your book"
              style={{
                margin: 0, color: '#fff', fontSize: 22, fontWeight: 800,
                cursor: 'text', padding: '4px 10px', borderRadius: 8,
                border: '2px solid transparent',
              }}
            >
              {book.title}
              <span style={{ fontSize: 13, marginLeft: 8, opacity: 0.45 }}>✏️ rename</span>
            </h1>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleSave} style={topBtn(saveFlash ? '#1e7e44' : '#2c3e50')}>
            {saveFlash ? '✅ Saved!' : '💾 Save My Book'}
          </button>
          <button onClick={() => setShowSettings(s => !s)} style={topBtn('#5b3fa8')}>
            ⚙️ Book Settings
          </button>
          <button onClick={() => setPreview(true)} style={topBtn('#c47a00')}>
            👁️ Preview Book
          </button>
          <button onClick={handleExport} disabled={exporting} style={topBtn(exporting ? '#444' : '#b52020', true)}>
            {exporting ? '⏳ Creating PDF...' : '📥 Download PDF for Amazon'}
          </button>
        </div>
      </div>

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '18px 22px', marginBottom: 18,
        }}>
          <div style={{ color: '#8899bb', fontSize: 12, fontWeight: 800, letterSpacing: 1.2, marginBottom: 12, textTransform: 'uppercase' }}>
            📐 Book Size — Choose the trim size for your Amazon KDP book
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(TRIM_SIZES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setTrimSize(key)}
                style={{
                  background: book.trimSize === key ? '#4a90d9' : 'rgba(255,255,255,0.07)',
                  color: '#fff',
                  border: book.trimSize === key ? '2px solid #4a90d9' : '2px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 16px', fontSize: 14,
                  cursor: 'pointer', fontWeight: book.trimSize === key ? 800 : 400,
                }}
              >
                {val.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14, color: '#556', fontSize: 12, lineHeight: 1.8 }}>
            <strong style={{ color: '#778' }}>Tips for Amazon KDP:</strong>{' '}
            Use 300 DPI images for best print quality. Keep all text inside the green safe zone.
            The most popular children's book sizes are 8×8, 8.5×8.5, and 8×10.
          </div>
        </div>
      )}

      {/* ── AUTO-SAVE NOTICE ── */}
      <div style={{
        background: 'rgba(30,120,70,0.15)',
        border: '1px solid rgba(30,180,80,0.2)',
        borderRadius: 8, padding: '7px 14px', marginBottom: 14,
        fontSize: 12, color: '#4a9', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        ✅ <strong>Your book saves automatically</strong> as you work — you will not lose your progress if you close this tab.
        Click "Save My Book" anytime to make sure.
      </div>

      {/* ── MAIN EDITOR ── */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {/* Page strip sidebar */}
        <PageStrip
          pages={book.pages}
          currentIdx={book.currentPageIdx}
          onSelect={setCurrentPage}
          onAdd={addPage}
          onDelete={deletePage}
          onDuplicate={duplicatePage}
          onMove={movePage}
          trimSize={book.trimSize}
          TRIM_SIZES={TRIM_SIZES}
        />

        {/* Editor */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 14, padding: 18,
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ color: '#8899bb', fontSize: 13, fontWeight: 700 }}>
                Editing Page {book.currentPageIdx + 1} of {book.pages.length}
                <span style={{ color: '#4a6', marginLeft: 8, fontSize: 12 }}>
                  ({TRIM_SIZES[book.trimSize].label})
                </span>
              </div>
              <div style={{ color: '#445', fontSize: 12 }}>
                💡 Double-click the text area to type · Drag images to move · Pull blue corners to resize
              </div>
            </div>

            {currentPage && (
              <PageCanvas
                page={currentPage}
                onUpdate={updatePage}
                onAddImage={addImage}
                onUpdateImage={updateImage}
                onDeleteImage={deleteImage}
                trimSize={book.trimSize}
                TRIM_SIZES={TRIM_SIZES}
                MARGIN={MARGIN}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', marginTop:24, color:'#2a3', fontSize:11 }}>
        📖 KidBook Creator · Your book is saved in this browser · Export as PDF to upload to Amazon KDP
      </div>
    </div>
  );
}

const topBtn = (bg, large = false) => ({
  background: bg, color: 'white', border: 'none',
  borderRadius: 11, padding: large ? '12px 20px' : '10px 16px',
  fontSize: large ? 15 : 14, fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 3px 12px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
});
