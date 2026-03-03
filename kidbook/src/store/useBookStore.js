// store/useBookStore.js — only hooks and state, no constants or pure functions
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import {
  TRIM_SIZES, FONTS, LAYOUTS, OVERLAY_STYLES, BLEED, MARGIN, makePage,
} from './bookUtils';

// Re-export so existing imports still work
export { TRIM_SIZES, FONTS, LAYOUTS, OVERLAY_STYLES, BLEED, MARGIN, makePage };

const MAX_UNDO = 30;

export function useBookStore() {
  const [book, setBook] = useState(() => {
    try {
      const saved = localStorage.getItem('kidbook_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.pages?.length && parsed.setupDone) {
          parsed.pages = parsed.pages.map(p => ({ overlays: [], ...p }));
          return parsed;
        }
      }
    } catch (e) {}
    return { setupDone: false, title: '', authorName: '', trimSize: '8x8', fontFamily: 'Georgia, serif', pages: [], currentPageIdx: 0 };
  });

  const historyRef = useRef([]);
  const historyIdxRef = useRef(-1);

  const pushHistory = useCallback((nb) => {
    const stack = historyRef.current.slice(0, historyIdxRef.current + 1);
    stack.push(JSON.parse(JSON.stringify(nb)));
    if (stack.length > MAX_UNDO) stack.shift();
    historyRef.current = stack;
    historyIdxRef.current = stack.length - 1;
  }, []);

  const setBookSave = useCallback((updater) => {
    setBook(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current -= 1;
      setBook(historyRef.current[historyIdxRef.current]);
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('kidbook_v3', JSON.stringify(book)); } catch (e) {}
  }, [book]);

  const loadBookData = useCallback((bookData) => {
    const migrated = { ...bookData, pages: (bookData.pages || []).map(p => ({ overlays: [], ...p })) };
    setBook(migrated);
    historyRef.current = [migrated];
    historyIdxRef.current = 0;
  }, []);

  const setTitle = useCallback((title) => {
    setBookSave(b => ({ ...b, title }));
  }, [setBookSave]);

  const setCurrentPage = useCallback((idx) => setBook(b => ({ ...b, currentPageIdx: idx })), []);

  const updatePage = useCallback((pageId, updates) => {
    setBookSave(b => ({ ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, ...updates } : p) }));
  }, [setBookSave]);

  const addPage = useCallback((layoutId = 'text-only') => {
    setBookSave(b => {
      const pg = makePage(layoutId, b.trimSize, b.fontFamily);
      const newPages = [...b.pages, pg];
      return { ...b, pages: newPages, currentPageIdx: newPages.length - 1 };
    });
  }, [setBookSave]);

  const deletePage = useCallback((pageId) => {
    setBookSave(b => {
      if (b.pages.length <= 1) return b;
      const idx = b.pages.findIndex(p => p.id === pageId);
      const newPages = b.pages.filter(p => p.id !== pageId);
      return { ...b, pages: newPages, currentPageIdx: Math.max(0, Math.min(idx, newPages.length - 1)) };
    });
  }, [setBookSave]);

  const duplicatePage = useCallback((pageId) => {
    setBookSave(b => {
      const idx = b.pages.findIndex(p => p.id === pageId);
      const copy = { ...b.pages[idx], id: uuid(), images: b.pages[idx].images.map(img => ({ ...img, id: uuid() })), overlays: (b.pages[idx].overlays || []).map(o => ({ ...o, id: uuid() })) };
      const newPages = [...b.pages];
      newPages.splice(idx + 1, 0, copy);
      return { ...b, pages: newPages, currentPageIdx: idx + 1 };
    });
  }, [setBookSave]);

  const movePage = useCallback((fromIdx, toIdx) => {
    setBookSave(b => {
      const pages = [...b.pages];
      const [removed] = pages.splice(fromIdx, 1);
      pages.splice(toIdx, 0, removed);
      return { ...b, pages, currentPageIdx: toIdx };
    });
  }, [setBookSave]);

  const changePageLayout = useCallback((pageId, layoutId) => {
    setBookSave(b => {
      const oldPage = b.pages.find(p => p.id === pageId);
      if (!oldPage) return b;
      const layout = LAYOUTS.find(l => l.id === layoutId);
      const iz = layout?.imageZone;
      const tz = layout?.textZone;
      const realImages = oldPage.images.filter(img => !img.placeholder && img.src);
      const placeholders = iz ? [{ id: uuid(), src: null, x: iz.x, y: iz.y, w: iz.w, h: iz.h, locked: false, zIndex: 1, placeholder: true }] : [];
      return { ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, layoutId, textZone: tz ? { ...tz } : null, images: [...placeholders, ...realImages], isTitlePage: layout?.isTitlePage || false } : p) };
    });
  }, [setBookSave]);

  const addImage = useCallback((pageId, imageData) => {
    setBookSave(b => {
      const pg = b.pages.find(p => p.id === pageId);
      if (!pg) return b;
      const placeholder = pg.images.find(img => img.placeholder);
      if (placeholder) {
        return { ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, images: p.images.map(img => img.id === placeholder.id ? { ...img, src: imageData, placeholder: false } : img) } : p) };
      }
      const img = { id: uuid(), src: imageData, x: 10, y: 10, w: 80, h: 60, locked: false, zIndex: Date.now() };
      return { ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, images: [...p.images, img] } : p) };
    });
  }, [setBookSave]);

  const updateImage = useCallback((pageId, imageId, updates) => {
    setBookSave(b => ({ ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, images: p.images.map(img => img.id === imageId ? { ...img, ...updates } : img) } : p) }));
  }, [setBookSave]);

  const deleteImage = useCallback((pageId, imageId) => {
    setBookSave(b => ({ ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, images: p.images.filter(img => img.id !== imageId) } : p) }));
  }, [setBookSave]);

  const addOverlay = useCallback((pageId) => {
    const overlay = { id: uuid(), text: '', x: 10, y: 35, w: 80, h: 30, fontSize: 28, fontFamily: 'Georgia, serif', textColor: '#ffffff', textAlign: 'center', styleId: 'dark-band', zIndex: Date.now() + 100 };
    setBookSave(b => ({ ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, overlays: [...(p.overlays || []), overlay] } : p) }));
  }, [setBookSave]);

  const updateOverlay = useCallback((pageId, overlayId, updates) => {
    setBookSave(b => ({ ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, overlays: (p.overlays || []).map(o => o.id === overlayId ? { ...o, ...updates } : o) } : p) }));
  }, [setBookSave]);

  const deleteOverlay = useCallback((pageId, overlayId) => {
    setBookSave(b => ({ ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, overlays: (p.overlays || []).filter(o => o.id !== overlayId) } : p) }));
  }, [setBookSave]);

  return {
    book, TRIM_SIZES, FONTS, LAYOUTS, OVERLAY_STYLES, BLEED, MARGIN,
    undo, canUndo: historyIdxRef.current > 0,
    loadBookData, setTitle,
    setCurrentPage, updatePage, addPage, deletePage, duplicatePage, movePage, changePageLayout,
    addImage, updateImage, deleteImage,
    addOverlay, updateOverlay, deleteOverlay,
    currentPage: book.pages[book.currentPageIdx] || null,
  };
}
