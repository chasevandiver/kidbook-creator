// hooks/useCloud.js — saves/loads books to Supabase
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';

const DEBOUNCE_MS = 2500; // save 2.5s after last change

export function useCloud(user) {
  const [books, setBooks] = useState([]);         // list of user's books
  const [activeBookId, setActiveBookId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [loadingBooks, setLoadingBooks] = useState(false);
  const debounceRef = useRef(null);

  // ── Load book list ──────────────────────────────────────────────────────────
  const loadBooks = useCallback(async () => {
    if (!user) return;
    setLoadingBooks(true);
    const { data, error } = await supabase
      .from('books')
      .select('id, title, trim_size, updated_at, share_id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (!error) setBooks(data || []);
    setLoadingBooks(false);
  }, [user]);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  // ── Load a single full book ─────────────────────────────────────────────────
  const loadBook = useCallback(async (bookId) => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();
    if (error) throw error;
    setActiveBookId(bookId);
    return data.content; // the full book JSON
  }, []);

  // ── Load book by share_id (public, no auth needed) ──────────────────────────
  const loadBookByShareId = useCallback(async (shareId) => {
    const { data, error } = await supabase
      .from('books')
      .select('content, title')
      .eq('share_id', shareId)
      .single();
    if (error) throw error;
    return data.content;
  }, []);

  // ── Create new book ─────────────────────────────────────────────────────────
  const createBook = useCallback(async (bookData) => {
    if (!user) return null;
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
    setActiveBookId(data.id);
    await loadBooks();
    return { id: data.id, shareId: data.share_id };
  }, [user, loadBooks]);

  // ── Save (debounced auto-save) ──────────────────────────────────────────────
  const saveBook = useCallback((bookId, bookData) => {
    if (!bookId || !user) return;
    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
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
      if (!error) loadBooks(); // refresh list title
    }, DEBOUNCE_MS);
  }, [user, loadBooks]);

  // ── Delete book ─────────────────────────────────────────────────────────────
  const deleteBook = useCallback(async (bookId) => {
    await supabase.from('books').delete().eq('id', bookId).eq('user_id', user.id);
    if (activeBookId === bookId) setActiveBookId(null);
    await loadBooks();
  }, [user, activeBookId, loadBooks]);

  // ── Get share URL ───────────────────────────────────────────────────────────
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
