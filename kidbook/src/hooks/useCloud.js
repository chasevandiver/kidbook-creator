// hooks/useCloud.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import BARRY_BOOK from '../data/barryBook';

const DEBOUNCE_MS = 2500;

export function useCloud(user) {
  const [books, setBooks] = useState([]);
  const [activeBookId, setActiveBookId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [loadingBooks, setLoadingBooks] = useState(false);
  const debounceRef = useRef(null);

  const seedBarry = useCallback(async () => {
    // Only seed once — check if already seeded
    if (localStorage.getItem('barry_seeded')) return;
    try {
      const shareId = Math.random().toString(36).slice(2, 10);
      await supabase.from('books').insert({
        user_id: user.id,
        title: BARRY_BOOK.title,
        trim_size: BARRY_BOOK.trimSize,
        content: BARRY_BOOK,
        share_id: shareId,
      });
      localStorage.setItem('barry_seeded', '1');
    } catch (e) {
      console.error('Barry seed failed:', e);
    }
  }, [user]);

  const loadBooks = useCallback(async () => {
    if (!user) return;
    setLoadingBooks(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, trim_size, updated_at, share_id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (!error) {
        // If no books yet, seed Barry first then reload
        if (!error && data && data.length === 0 && !localStorage.getItem('barry_seeded')) {
          await seedBarry();
          const { data: data2 } = await supabase
            .from('books')
            .select('id, title, trim_size, updated_at, share_id')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });
          setBooks(data2 || []);
        } else {
          setBooks(data || []);
        }
      }
    } catch (e) {
      console.error('loadBooks error:', e);
    }
    setLoadingBooks(false);
  }, [user, seedBarry]);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const loadBook = useCallback(async (bookId) => {
    const { data, error } = await supabase
      .from('books').select('*').eq('id', bookId).single();
    if (error) throw error;
    setActiveBookId(bookId);
    return data.content;
  }, []);

  const loadBookByShareId = useCallback(async (shareId) => {
    const { data, error } = await supabase
      .from('books').select('content, title').eq('share_id', shareId).single();
    if (error) throw error;
    return data.content;
  }, []);

  // createBook — pure async, no state updates during execution
  // caller sets screen/loads data after this resolves
  const createBook = useCallback(async (bookData) => {
    if (!user) throw new Error('Not logged in');
    const shareId = Math.random().toString(36).slice(2, 10);
    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title: bookData.title || 'Untitled Book',
        trim_size: bookData.trimSize || '8x8',
        content: bookData,
        share_id: shareId,
      })
      .select('id, share_id')
      .single();
    if (error) throw error;
    // Defer state updates to avoid React render-phase conflicts
    setTimeout(() => {
      setActiveBookId(data.id);
      loadBooks();
    }, 0);
    return { id: data.id, shareId: data.share_id };
  }, [user, loadBooks]);

  const saveBook = useCallback((bookId, bookData) => {
    if (!bookId || !user) return;
    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('books')
          .update({
            title: bookData.title || 'Untitled Book',
            trim_size: bookData.trimSize || '8x8',
            content: bookData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookId)
          .eq('user_id', user.id);
        setSaveStatus(error ? 'error' : 'saved');
        if (!error) loadBooks();
      } catch (e) {
        setSaveStatus('error');
      }
    }, DEBOUNCE_MS);
  }, [user, loadBooks]);

  const deleteBook = useCallback(async (bookId) => {
    try {
      await supabase.from('books').delete().eq('id', bookId).eq('user_id', user.id);
      if (activeBookId === bookId) setActiveBookId(null);
      await loadBooks();
    } catch (e) {
      console.error('deleteBook error:', e);
    }
  }, [user, activeBookId, loadBooks]);

  const getShareUrl = useCallback(async (bookId) => {
    const { data } = await supabase
      .from('books').select('share_id').eq('id', bookId).single();
    if (!data) return null;
    return `${window.location.origin}/share/${data.share_id}`;
  }, []);

  return {
    books, activeBookId, setActiveBookId,
    saveStatus, loadingBooks,
    loadBooks, loadBook, loadBookByShareId,
    createBook, saveBook, deleteBook, getShareUrl,
  };
}
