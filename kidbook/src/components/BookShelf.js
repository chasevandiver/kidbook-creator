// components/BookShelf.js — shows all of a user's books
import React, { useState } from 'react';

export default function BookShelf({ books, loading, user, onOpenBook, onNewBook, onDeleteBook, onSignOut }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0c1020 0%, #161d35 100%)', fontFamily: "'Segoe UI', Arial, sans-serif", padding: '24px 28px', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36 }}>📚</span>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: 26, fontWeight: 900 }}>My Books</h1>
            <div style={{ color: '#667', fontSize: 13, marginTop: 2 }}>{user.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onNewBook} style={bigBtn('#4a90d9')}>
            ✨ Create New Book
          </button>
          <button onClick={onSignOut} style={{ ...bigBtn('#2a3040'), fontSize: 13 }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Book grid */}
      {loading ? (
        <div style={{ color: '#667', textAlign: 'center', padding: 60, fontSize: 18 }}>Loading your books...</div>
      ) : books.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>📖</div>
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>No books yet!</h2>
          <p style={{ color: '#889', fontSize: 16, marginBottom: 28 }}>Click "Create New Book" to get started.</p>
          <button onClick={onNewBook} style={bigBtn('#4a90d9')}>✨ Create My First Book</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
          {books.map(book => (
            <div key={book.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, overflow: 'hidden', transition: 'transform 0.15s', cursor: 'pointer' }}
              onClick={() => onOpenBook(book.id)}>
              {/* Book cover preview */}
              <div style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg, #1a2540, #0d1525)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
                📖
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {book.title || 'Untitled Book'}
                </div>
                <div style={{ color: '#556', fontSize: 12, marginBottom: 12 }}>
                  {book.trim_size} · Updated {new Date(book.updated_at).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); onOpenBook(book.id); }}
                    style={{ flex: 1, background: '#4a90d9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={e => { e.stopPropagation(); setConfirmDelete(book.id); }}
                    style={{ background: 'rgba(180,40,40,0.3)', color: '#e88', border: 'none', borderRadius: 8, padding: '8px 10px', fontSize: 13, cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '32px 36px', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ color: '#fff', margin: '0 0 10px', fontSize: 20 }}>Delete this book?</h3>
            <p style={{ color: '#889', marginBottom: 24 }}>This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
              <button onClick={() => { onDeleteBook(confirmDelete); setConfirmDelete(null); }} style={{ flex: 1, background: '#8b1a1a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, cursor: 'pointer', fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const bigBtn = bg => ({ background: bg, color: 'white', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 12px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' });
