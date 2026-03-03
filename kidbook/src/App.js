// App.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useCloud } from './hooks/useCloud';
import { useBookStore } from './store/useBookStore';
import { makePage, buildBookFromWizard } from './store/bookUtils';
import LoginScreen from './components/LoginScreen';
import BookShelf from './components/BookShelf';
import ShareView from './components/ShareView';
import SetupWizard from './components/SetupWizard';
import PageCanvas from './components/PageCanvas';
import PageStrip from './components/PageStrip';
import PreviewMode from './components/PreviewMode';
import { exportToPDF } from './utils/exportPDF';

function getShareId() {
  const m = window.location.pathname.match(/^\/share\/([a-z0-9]+)$/i);
  return m ? m[1] : null;
}

export default function App() {
  const shareId = getShareId();

  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const cloud = useCloud(user);
  const store = useBookStore();

  const {
    book, TRIM_SIZES, MARGIN,
    undo, canUndo,
    setCurrentPage, updatePage, addPage, deletePage, duplicatePage, movePage, changePageLayout,
    addImage, updateImage, deleteImage,
    addOverlay, updateOverlay, deleteOverlay,
    currentPage, loadBookData, setTitle,
  } = store;

  const [screen, setScreen] = useState('shelf');
  const [preview, setPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Pending book data waiting to be loaded into the store
  // We use a ref + effect to avoid calling setState inside click handlers
  const pendingBookRef = useRef(null);
  const [pendingBook, setPendingBook] = useState(null);

  // When pendingBook is set, load it into the store and switch screens
  useEffect(() => {
    if (!pendingBook) return;
    loadBookData(pendingBook);
    setPendingBook(null);
    setScreen('editor');
    // Save to cloud in background
    cloud.createBook(pendingBook).catch(e => console.error('Cloud save failed:', e));
  }, [pendingBook]); // eslint-disable-line

  // Auto-save to cloud when book changes in editor
  const prevBookStr = useRef('');
  useEffect(() => {
    if (!cloud.activeBookId || !book.setupDone || screen !== 'editor') return;
    const str = JSON.stringify(book);
    if (str === prevBookStr.current) return;
    prevBookStr.current = str;
    cloud.saveBook(cloud.activeBookId, book);
  }, [book, cloud, screen]);

  // Wizard complete — just set pendingBook, the effect above does the rest
  const handleSetupComplete = useCallback((wizardData) => {
    const bookData = buildBookFromWizard(wizardData);
    setPendingBook(bookData);
  }, []);

  const handleOpenBook = useCallback(async (bookId) => {
    try {
      const content = await cloud.loadBook(bookId);
      loadBookData(content);
      setScreen('editor');
    } catch (e) {
      alert('Could not open book: ' + e.message);
    }
  }, [cloud, loadBookData]);

  const handleShare = useCallback(async () => {
    const url = await cloud.getShareUrl(cloud.activeBookId);
    if (url) { setShareUrl(url); setShowShare(true); }
  }, [cloud]);

  const handleExport = async () => {
    setExporting(true);
    try { await exportToPDF(book, TRIM_SIZES); }
    catch (e) { alert('Export failed: ' + e.message); }
    setExporting(false);
  };

  const commitTitle = () => {
    if (titleDraft.trim()) setTitle(titleDraft.trim());
    setEditingTitle(false);
  };

  // Public share view
  if (shareId) {
    return <ShareView shareId={shareId} loadBookByShareId={cloud.loadBookByShareId} TRIM_SIZES={TRIM_SIZES} />;
  }

  // Auth loading
  if (authLoading) {
    return <div style={fullCenter}>📚 Loading...</div>;
  }

  // Not logged in
  if (!user) {
    return <LoginScreen onSignInGoogle={signInWithGoogle} onSignInEmail={signInWithEmail} onSignUpEmail={signUpWithEmail} />;
  }

  // Pending — wizard just finished, waiting for effect to fire
  if (pendingBook) {
    return <div style={fullCenter}>✨ Creating your book...</div>;
  }

  // Book shelf
  if (screen === 'shelf') {
    return (
      <BookShelf
        books={cloud.books}
        loading={cloud.loadingBooks}
        user={user}
        onOpenBook={handleOpenBook}
        onNewBook={() => setScreen('wizard')}
        onDeleteBook={cloud.deleteBook}
        onSignOut={signOut}
      />
    );
  }

  // Setup wizard
  if (screen === 'wizard') {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  // Editor
  const saveIndicator = {
    saved:  { color: '#3a8', text: '✅ Saved to cloud' },
    saving: { color: '#a80', text: '💾 Saving...' },
    error:  { color: '#e44', text: '⚠️ Save failed — check connection' },
  }[cloud.saveStatus] || { color: '#3a8', text: '✅ Saved' };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0c1020 0%,#161d35 100%)', fontFamily:"'Segoe UI',Arial,sans-serif", padding:'12px 16px', boxSizing:'border-box' }}>
      {preview && <PreviewMode book={book} TRIM_SIZES={TRIM_SIZES} onClose={() => setPreview(false)} />}

      {/* Share modal */}
      {showShare && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#1a2035', border:'1px solid rgba(255,255,255,0.12)', borderRadius:18, padding:'32px 36px', maxWidth:460, width:'90%' }}>
            <h3 style={{ color:'#fff', margin:'0 0 10px', fontSize:20 }}>📤 Share Your Book</h3>
            <p style={{ color:'#889', fontSize:14, marginBottom:16 }}>Anyone with this link can read your book:</p>
            <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', color:'#7ae', fontSize:13, wordBreak:'break-all', marginBottom:16 }}>{shareUrl}</div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => navigator.clipboard.writeText(shareUrl)} style={{ flex:1, background:'#4a90d9', color:'#fff', border:'none', borderRadius:10, padding:'11px', fontSize:14, fontWeight:700, cursor:'pointer' }}>📋 Copy Link</button>
              <button onClick={() => setShowShare(false)} style={{ flex:1, background:'rgba(255,255,255,0.08)', color:'#fff', border:'none', borderRadius:10, padding:'11px', fontSize:14, cursor:'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, flexWrap:'wrap', gap:8, background:'rgba(255,255,255,0.03)', borderRadius:14, padding:'10px 16px', border:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setScreen('shelf')} style={{ background:'none', border:'none', color:'#4a90d9', fontSize:22, cursor:'pointer' }} title="Back to all books">📚</button>
          {editingTitle ? (
            <input autoFocus value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => e.key === 'Enter' && commitTitle()}
              style={{ fontSize:18, fontWeight:800, background:'rgba(255,255,255,0.1)', color:'#fff', border:'2px solid #4a90d9', borderRadius:8, padding:'4px 12px', outline:'none', minWidth:200, fontFamily:'inherit' }}
            />
          ) : (
            <div onClick={() => { setTitleDraft(book.title || ''); setEditingTitle(true); }} title="Click to rename" style={{ color:'#fff', fontSize:18, fontWeight:800, cursor:'text', padding:'4px 8px', borderRadius:8 }}>
              {book.title || 'Untitled Book'}
              <span style={{ fontSize:11, opacity:0.4, marginLeft:6 }}>✏️</span>
            </div>
          )}
          <span style={{ fontSize:12, color: saveIndicator.color }}>{saveIndicator.text}</span>
        </div>

        <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
          <button onClick={undo} disabled={!canUndo} style={topBtn(canUndo ? '#3a4a6a' : '#252830')}>↩️ Undo</button>
          <button onClick={() => setPreview(true)} style={topBtn('#7a5200')}>👁️ Preview</button>
          <button onClick={handleShare} style={topBtn('#1a5a3a')}>🔗 Share Link</button>
          <button onClick={handleExport} disabled={exporting} style={topBtn(exporting ? '#333' : '#8b1a1a', true)}>
            {exporting ? '⏳ Creating PDF...' : '📥 Download PDF for Amazon'}
          </button>
        </div>
      </div>

      {/* MAIN EDITOR */}
      <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
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
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:14, padding:16, border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:6 }}>
              <div style={{ color:'#7a9', fontSize:13, fontWeight:700 }}>
                ✏️ Page {book.currentPageIdx + 1} of {book.pages.length}
                <span style={{ color:'#445', marginLeft:10, fontSize:12 }}>{TRIM_SIZES[book.trimSize]?.label}</span>
              </div>
              <div style={{ color:'#344', fontSize:12 }}>💡 Double-click text to edit · Drag pictures · Pull corners to resize</div>
            </div>
            {currentPage ? (
              <PageCanvas
                page={currentPage}
                onUpdate={updatePage}
                onAddImage={addImage}
                onUpdateImage={updateImage}
                onDeleteImage={deleteImage}
                onAddOverlay={addOverlay}
                onUpdateOverlay={updateOverlay}
                onDeleteOverlay={deleteOverlay}
                onChangeLayout={changePageLayout}
                trimSize={book.trimSize}
                TRIM_SIZES={TRIM_SIZES}
                MARGIN={MARGIN}
                bookFontFamily={book.fontFamily}
              />
            ) : (
              <div style={{ color:'#445', textAlign:'center', padding:40, fontSize:16 }}>
                Select a page from the left, or click "+ Add New Page"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const topBtn = (bg, large = false) => ({ background:bg, color:'white', border:'none', borderRadius:10, padding: large ? '11px 18px' : '9px 14px', fontSize: large ? 14 : 13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.25)', whiteSpace:'nowrap' });
const fullCenter = { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#aab', fontSize:22, background:'#0c1020', fontFamily:'sans-serif' };
