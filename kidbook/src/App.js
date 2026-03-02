// App.js
import React, { useState } from 'react';
import { useBookStore } from './store/useBookStore';
import SetupWizard from './components/SetupWizard';
import PageCanvas from './components/PageCanvas';
import PageStrip from './components/PageStrip';
import PreviewMode from './components/PreviewMode';
import { exportToPDF } from './utils/exportPDF';

export default function App() {
  const {
    book, TRIM_SIZES, FONTS, LAYOUTS, BLEED, MARGIN,
    undo, canUndo,
    completeSetup, resetBook,
    setCurrentPage, updatePage, addPage, deletePage, duplicatePage, movePage, changePageLayout,
    addImage, updateImage, deleteImage,
    currentPage,
  } = useBookStore();

  const [preview, setPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  // Show wizard if not set up yet
  if (!book.setupDone) {
    return <SetupWizard onComplete={completeSetup} />;
  }

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
      localStorage.setItem('kidbook_v3', JSON.stringify(book));
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2200);
    } catch (e) {
      alert('Could not save — your browser storage may be full. Try removing some large pictures.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0c1020 0%, #161d35 100%)',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      padding: '12px 16px',
      boxSizing: 'border-box',
    }}>
      {preview && <PreviewMode book={book} TRIM_SIZES={TRIM_SIZES} onClose={() => setPreview(false)} />}

      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, flexWrap: 'wrap', gap: 8,
        background: 'rgba(255,255,255,0.03)', borderRadius: 14,
        padding: '10px 16px', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Title */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:26 }}>📚</span>
          {editingTitle ? (
            <input autoFocus value={book.title}
              onChange={e => updatePage && null /* handled below */}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              style={{ fontSize:18, fontWeight:800, background:'rgba(255,255,255,0.1)', color:'#fff', border:'2px solid #4a90d9', borderRadius:8, padding:'4px 12px', outline:'none', minWidth:200, fontFamily:'inherit' }}
            />
          ) : (
            <div onClick={() => setEditingTitle(true)} title="Click to rename" style={{ color:'#fff', fontSize:18, fontWeight:800, cursor:'text', padding:'4px 8px', borderRadius:8, border:'2px solid transparent' }}>
              {book.title}
              <span style={{ fontSize:11, opacity:0.4, marginLeft:6 }}>✏️ rename</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
          <button
            onClick={undo} disabled={!canUndo}
            style={topBtn(canUndo ? '#3a4a6a' : '#252830')}
            title="Undo the last change"
          >
            ↩️ Undo
          </button>
          <button onClick={handleSave} style={topBtn(saveFlash ? '#1a6e3a' : '#2c3650')}>
            {saveFlash ? '✅ Saved!' : '💾 Save My Book'}
          </button>
          <button onClick={() => setPreview(true)} style={topBtn('#7a5200')}>
            👁️ Preview Book
          </button>
          <button onClick={handleExport} disabled={exporting} style={topBtn(exporting ? '#333' : '#8b1a1a', true)}>
            {exporting ? '⏳ Creating PDF...' : '📥 Download PDF for Amazon KDP'}
          </button>
          <button
            onClick={() => { if (window.confirm('Start a brand new book? This will clear everything.')) resetBook(); }}
            style={{ ...topBtn('#222'), fontSize:12, color:'#445' }}
            title="Start over with a new book"
          >
            🆕 New Book
          </button>
        </div>
      </div>

      {/* ── AUTOSAVE NOTICE ── */}
      <div style={{
        background:'rgba(20,80,40,0.2)', border:'1px solid rgba(40,160,80,0.2)',
        borderRadius:8, padding:'6px 14px', marginBottom:12,
        fontSize:12, color:'#4a9', display:'flex', alignItems:'center', gap:8,
      }}>
        ✅ <span><strong>Your book saves automatically.</strong> You won't lose your work if you close this tab. Use "Save My Book" for extra peace of mind.</span>
      </div>

      {/* ── MAIN EDITOR ── */}
      <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>

        {/* Sidebar */}
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
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            background:'rgba(255,255,255,0.03)', borderRadius:14, padding:16,
            border:'1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              marginBottom:12, flexWrap:'wrap', gap:6,
            }}>
              <div style={{ color:'#7a9', fontSize:13, fontWeight:700 }}>
                ✏️ Editing Page {book.currentPageIdx+1} of {book.pages.length}
                <span style={{ color:'#445', marginLeft:10, fontSize:12 }}>
                  {TRIM_SIZES[book.trimSize].label}
                </span>
              </div>
              <div style={{ color:'#344', fontSize:12 }}>
                💡 Double-click the text area to write · Drag pictures · Pull blue corners to resize
              </div>
            </div>

            {currentPage ? (
              <PageCanvas
                page={currentPage}
                onUpdate={updatePage}
                onAddImage={addImage}
                onUpdateImage={updateImage}
                onDeleteImage={deleteImage}
                onChangeLayout={changePageLayout}
                trimSize={book.trimSize}
                TRIM_SIZES={TRIM_SIZES}
                MARGIN={MARGIN}
                bookFontFamily={book.fontFamily}
              />
            ) : (
              <div style={{ color:'#445', textAlign:'center', padding:40, fontSize:16 }}>
                Select a page from the left panel, or click "+ Add New Page"
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign:'center', marginTop:20, color:'#223', fontSize:11 }}>
        📖 KidBook Creator · Book saves automatically in this browser · Export as PDF to upload to Amazon KDP
      </div>
    </div>
  );
}

const topBtn = (bg, large = false) => ({
  background: bg, color: 'white', border: 'none', borderRadius: 10,
  padding: large ? '11px 18px' : '9px 14px',
  fontSize: large ? 14 : 13, fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 2px 10px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
});
