// components/ImportBook.js
// Visited at /import — lets you paste a book JSON and save it to the cloud
import React, { useState, useEffect } from 'react';
import { buildBookFromWizard } from '../store/bookUtils';

export default function ImportBook({ user, createBook, onDone }) {
  const [status, setStatus] = useState('idle'); // idle | saving | done | error
  const [error, setError] = useState('');

  // Auto-run if window.__BARRY_IMPORT__ is set by the console script
  useEffect(() => {
    if (window.__BARRY_IMPORT__) {
      handleImport(window.__BARRY_IMPORT__);
      delete window.__BARRY_IMPORT__;
    }
  }, []); // eslint-disable-line

  const handleImport = async (bookData) => {
    if (!user) { setError('Please sign in first.'); return; }
    setStatus('saving');
    try {
      await createBook(bookData);
      setStatus('done');
      setTimeout(onDone, 1500);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  };

  const handlePaste = (e) => {
    try {
      const data = JSON.parse(e.target.value);
      handleImport(data);
    } catch {
      setError('Invalid book data — make sure you pasted the full JSON.');
    }
  };

  if (status === 'done') return (
    <div style={center}>
      <div style={{ fontSize: 64 }}>✅</div>
      <h2 style={{ color: '#fff', margin: '16px 0 8px' }}>Book imported!</h2>
      <p style={{ color: '#889' }}>Taking you to your shelf...</p>
    </div>
  );

  return (
    <div style={center}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
      <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: 24 }}>Import a Book</h2>
      <p style={{ color: '#889', marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
        Paste your book JSON below to import it into your account.
      </p>
      {status === 'saving' && <p style={{ color: '#4a9' }}>💾 Saving to cloud...</p>}
      {error && <p style={{ color: '#e88' }}>{error}</p>}
      <textarea
        placeholder="Paste book JSON here..."
        onChange={handlePaste}
        style={{ width: 380, height: 120, background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: 12, fontSize: 13, fontFamily: 'monospace', resize: 'none' }}
      />
    </div>
  );
}

const center = { minHeight: '100vh', background: '#0c1020', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: 24 };
