// components/ShareView.js — public read-only book viewer
import React, { useState, useEffect } from 'react';

export default function ShareView({ shareId, loadBookByShareId, TRIM_SIZES }) {
  const [book, setBook] = useState(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookByShareId(shareId)
      .then(content => { setBook(content); setLoading(false); })
      .catch(() => { setError('Book not found.'); setLoading(false); });
  }, [shareId, loadBookByShareId]);

  if (loading) return <div style={center}>Loading book...</div>;
  if (error)   return <div style={center}>{error}</div>;
  if (!book)   return null;

  const page = book.pages[pageIdx];
  const { w, h } = TRIM_SIZES[book.trimSize] || TRIM_SIZES['8x8'];
  const tp = page.textZone;

  return (
    <div style={{ minHeight: '100vh', background: '#0c1020', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Segoe UI', Arial, sans-serif", gap: 20 }}>
      <div style={{ color: '#aab', fontSize: 18, fontFamily: 'Georgia' }}>📖 {book.title}</div>

      {/* Page */}
      <div style={{ position: 'relative', width: 'min(80vw, 70vh)', aspectRatio: `${w}/${h}`, background: page.bgColor || '#fff', boxShadow: '0 20px 80px rgba(0,0,0,0.7)', borderRadius: 4, overflow: 'hidden' }}>
        {[...page.images].filter(img => img.src).sort((a,b) => (a.zIndex||0)-(b.zIndex||0)).map(img => (
          <img key={img.id} src={img.src} alt="" style={{ position:'absolute', left:`${img.x}%`, top:`${img.y}%`, width:`${img.w}%`, height:`${img.h}%`, objectFit:'contain', pointerEvents:'none' }} />
        ))}
        {(page.overlays||[]).map(ov => {
          const styles = { 'none':'transparent','dark-band':'rgba(0,0,0,0.55)','light-band':'rgba(255,255,255,0.82)','dark-solid':'rgba(20,20,40,0.88)','light-solid':'rgba(255,255,255,0.95)','shadow-only':'transparent' };
          const colors = { 'none':'#fff','dark-band':'#fff','light-band':'#1a1a2e','dark-solid':'#fff','light-solid':'#1a1a2e','shadow-only':'#fff' };
          return (
            <div key={ov.id} style={{ position:'absolute', left:`${ov.x}%`, top:`${ov.y}%`, width:`${ov.w}%`, height:`${ov.h}%`, background: styles[ov.styleId]||'transparent', display:'flex', alignItems:'flex-start', padding:'2% 3%', boxSizing:'border-box', zIndex: ov.zIndex||100, overflow:'hidden' }}>
              <div style={{ fontSize:`${(ov.fontSize||28)*0.75}cqw`, color: ov.textColor||(colors[ov.styleId]||'#fff'), fontFamily: ov.fontFamily||'Georgia,serif', textAlign: ov.textAlign||'center', lineHeight:1.45, whiteSpace:'pre-wrap', width:'100%' }}>
                {ov.text}
              </div>
            </div>
          );
        })}
        {tp && page.text && (
          <div style={{ position:'absolute', left:`${tp.x}%`, top:`${tp.y}%`, width:`${tp.w}%`, fontSize:`${(page.fontSize||24)*0.9}cqw`, color: page.textColor||'#1a1a2e', fontFamily: page.fontFamily||'Georgia,serif', lineHeight:1.5, whiteSpace:'pre-wrap', textAlign: page.textAlign||'left', padding:'1%', boxSizing:'border-box', overflow:'hidden', height:`${tp.h}%`, zIndex:50 }}>
            {page.text}
          </div>
        )}
        <div style={{ position:'absolute', bottom:10, right:14, fontSize:12, color:'rgba(0,0,0,0.25)', fontFamily:'Georgia' }}>{pageIdx+1}</div>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:16, alignItems:'center' }}>
        <button disabled={pageIdx===0} onClick={() => setPageIdx(i=>i-1)} style={navBtn(pageIdx===0)}>◀ Previous</button>
        <span style={{ color:'#556', fontSize:15 }}>{pageIdx+1} of {book.pages.length}</span>
        <button disabled={pageIdx===book.pages.length-1} onClick={() => setPageIdx(i=>i+1)} style={navBtn(pageIdx===book.pages.length-1)}>Next ▶</button>
      </div>

      <a href={window.location.origin} style={{ color:'#4a90d9', fontSize:13, textDecoration:'none', marginTop:4 }}>
        Make your own book at KidBook Creator →
      </a>
    </div>
  );
}

const center = { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#aab', fontSize:20, background:'#0c1020', fontFamily:'sans-serif' };
const navBtn = disabled => ({ background: disabled?'#1a1e2a':'#4a90d9', color: disabled?'#445':'#fff', border:'none', borderRadius:10, padding:'12px 22px', fontSize:16, cursor: disabled?'default':'pointer', fontWeight:700 });
