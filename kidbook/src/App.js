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
    setCurrentPage, updatePage, addPage, deletePage, duplicatePage,
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
    // autosave already happens, just flash confirmation
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f1320 0%, #1a2040 100%)',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      padding: '16px 20px',
      boxSizing: 'border-box',
    }}>
      {preview && (
        <PreviewMode book={book} TRIM_SIZES={TRIM_SIZES} onClose={() => setPreview(false)} />
      )}

      {/* TOP BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 32 }}>📚</span>
          {editingTitle ? (
            <input
              autoFocus
              value={book.title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              style={{
                fontSize: 26,
                fontWeight: 800,
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '2px solid #4a90d9',
                borderRadius: 8,
                padding: '4px 12px',
                outline: 'none',
                minWidth: 200,
              }}
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              style={{
                margin: 0,
                color: '#fff',
                fontSize: 26,
                fontWeight: 800,
                cursor: 'text',
                padding: '4px 10px',
                borderRadius: 8,
                border: '2px solid transparent',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.target.style.borderColor = 'rgba(74,144,217,0.4)'}
              onMouseLeave={e => e.target.style.borderColor = 'transparent'}
              title="Click to edit book title"
            >
              {book.title}
              <span style={{ fontSize: 14, marginLeft: 8, opacity: 0.5 }}>✏️</span>
            </h1>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Save */}
          <button onClick={handleSave} style={actionBtn(saveFlash ? '#27ae60' : '#34495e')}>
            {saveFlash ? '✅ Saved!' : '💾 Save'}
          </button>

          {/* Settings */}
          <button onClick={() => setShowSettings(s => !s)} style={actionBtn('#7b52e8')}>
            ⚙️ Settings
          </button>

          {/* Preview */}
          <button onClick={() => setPreview(true)} style={actionBtn('#f39c12')}>
            👁 Preview Book
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            style={actionBtn(exporting ? '#555' : '#e74c3c', true)}
          >
            {exporting ? '⏳ Creating PDF...' : '📥 Export to PDF'}
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: 20,
          marginBottom: 20,
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ color: '#aab', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
              📐 BOOK SIZE (KDP Trim)
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {Object.entries(TRIM_SIZES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setTrimSize(key)}
                  style={{
                    background: book.trimSize === key ? '#4a90d9' : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: book.trimSize === key ? '2px solid #4a90d9' : '2px solid transparent',
                    borderRadius: 10,
                    padding: '10px 16px',
                    fontSize: 15,
                    cursor: 'pointer',
                    fontWeight: book.trimSize === key ? 800 : 400,
                  }}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ color: '#667', fontSize: 13, lineHeight: 1.6 }}>
            <strong style={{ color: '#aab' }}>For Amazon KDP:</strong><br />
            • Use 300 DPI images for best print quality<br />
            • Images will print to the bleed edge<br />
            • Keep text inside the green safe zone
          </div>
        </div>
      )}

      {/* MAIN EDITOR */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Page Strip */}
        <PageStrip
          pages={book.pages}
          currentIdx={book.currentPageIdx}
          onSelect={setCurrentPage}
          onAdd={addPage}
          onDelete={deletePage}
          onDuplicate={duplicatePage}
          trimSize={book.trimSize}
          TRIM_SIZES={TRIM_SIZES}
        />

        {/* Editor area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 14,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 8,
            }}>
              <div style={{ color: '#aab', fontSize: 14, fontWeight: 700 }}>
                PAGE {book.currentPageIdx + 1} of {book.pages.length}
              </div>
              <div style={{ color: '#556', fontSize: 13 }}>
                💡 Double-tap text to edit • Drag images to move • Pull corners to resize
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
      <div style={{
        textAlign: 'center', marginTop: 28,
        color: '#334', fontSize: 12, letterSpacing: 0.5,
      }}>
        📖 KidBook Creator — Your book saves automatically • Export as PDF for Amazon KDP
      </div>
    </div>
  );
}

const actionBtn = (bg, primary = false) => ({
  background: bg,
  color: 'white',
  border: 'none',
  borderRadius: 12,
  padding: primary ? '12px 22px' : '10px 18px',
  fontSize: primary ? 16 : 15,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: `0 4px 14px ${bg}44`,
  transition: 'opacity 0.15s',
  whiteSpace: 'nowrap',
});
