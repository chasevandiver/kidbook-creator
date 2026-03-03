// store/useBookStore.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';

export const TRIM_SIZES = {
  '8x8':     { w: 8,   h: 8,   label: '8" × 8"',     desc: 'Square — most popular for kids' },
  '8.5x8.5': { w: 8.5, h: 8.5, label: '8.5" × 8.5"', desc: 'Large square' },
  '8x10':    { w: 8,   h: 10,  label: '8" × 10"',    desc: 'Portrait — great for tall illustrations' },
  '8.5x11':  { w: 8.5, h: 11,  label: '8.5" × 11"',  desc: 'Full letter size' },
  '6x9':     { w: 6,   h: 9,   label: '6" × 9"',     desc: 'Chapter book / novel size' },
  '11x8.5':  { w: 11,  h: 8.5, label: '11" × 8.5"',  desc: 'Landscape / wide pages' },
};

export const FONTS = [
  { id: 'Georgia, serif',                             label: 'Classic',    sample: 'Once upon a time...' },
  { id: '"Comic Sans MS", cursive',                   label: 'Playful',    sample: 'Once upon a time...' },
  { id: '"Palatino Linotype", serif',                 label: 'Elegant',    sample: 'Once upon a time...' },
  { id: '"Trebuchet MS", sans-serif',                 label: 'Friendly',   sample: 'Once upon a time...' },
  { id: '"Courier New", monospace',                   label: 'Typewriter', sample: 'Once upon a time...' },
  { id: 'Arial Rounded MT Bold, Arial, sans-serif',  label: 'Rounded',    sample: 'Once upon a time...' },
];

export const LAYOUTS = [
  { id: 'text-only',      label: 'Text Only',          icon: '📝', desc: 'Full page of writing, no picture',    textZone: { x: 8, y: 8, w: 84, h: 84 },  imageZone: null },
  { id: 'picture-bottom', label: 'Picture at Bottom',  icon: '🔤', desc: 'Text at top, picture below',          textZone: { x: 8, y: 8, w: 84, h: 36 },  imageZone: { x: 8, y: 50, w: 84, h: 44 } },
  { id: 'picture-top',    label: 'Picture at Top',     icon: '🖼', desc: 'Picture at top, text below',          textZone: { x: 8, y: 68, w: 84, h: 26 }, imageZone: { x: 8, y: 6,  w: 84, h: 58 } },
  { id: 'picture-right',  label: 'Picture on Right',   icon: '↔️', desc: 'Text on left, picture on right',      textZone: { x: 6, y: 8,  w: 44, h: 84 }, imageZone: { x: 52, y: 6, w: 44, h: 88 } },
  { id: 'full-picture',   label: 'Full Picture',        icon: '🖼️', desc: 'Picture fills the whole page',        textZone: null,                           imageZone: { x: 0, y: 0, w: 100, h: 100 } },
  { id: 'title-page',     label: 'Title Page',         icon: '📖', desc: 'Centered title and author name',      textZone: { x: 10, y: 30, w: 80, h: 40 }, imageZone: null, isTitlePage: true },
];

// Text overlay background style presets
export const OVERLAY_STYLES = [
  { id: 'none',        label: 'No Background',    bg: 'transparent',              textColor: '#ffffff', shadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 3px rgba(0,0,0,0.7)' },
  { id: 'dark-band',   label: 'Dark Band',        bg: 'rgba(0,0,0,0.55)',         textColor: '#ffffff', shadow: 'none' },
  { id: 'light-band',  label: 'Light Band',       bg: 'rgba(255,255,255,0.82)',   textColor: '#1a1a2e', shadow: 'none' },
  { id: 'dark-solid',  label: 'Dark Box',         bg: 'rgba(20,20,40,0.88)',      textColor: '#ffffff', shadow: 'none' },
  { id: 'light-solid', label: 'White Box',        bg: 'rgba(255,255,255,0.95)',   textColor: '#1a1a2e', shadow: 'none' },
  { id: 'shadow-only', label: 'Shadow Only',      bg: 'transparent',              textColor: '#ffffff', shadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000' },
];

const BLEED = 0.125;
const MARGIN = 0.5;
const MAX_UNDO = 30;

export function makePage(layoutId = 'text-only', trimSize = '8x8', fontFamily = 'Georgia, serif') {
  const layout = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[0];
  const tz = layout.textZone;
  const iz = layout.imageZone;
  const images = iz ? [{ id: uuid(), src: null, x: iz.x, y: iz.y, w: iz.w, h: iz.h, locked: false, zIndex: 1, placeholder: true }] : [];

  // Load a full book object from cloud (replaces current state)
  const loadBookData = useCallback((bookData) => {
    const migrated = { ...bookData, pages: (bookData.pages||[]).map(p => ({ overlays:[], ...p })) };
    setBook(migrated);
    historyRef.current = [migrated];
    historyIdxRef.current = 0;
  }, []);

  // Get current book snapshot (for creating in cloud)
  const getBook = useCallback(() => book, [book]);

  // Set title directly
  const setTitle = useCallback((title) => {
    setBookSave(b => ({ ...b, title }));
  }, [setBookSave]);

  return {
    id: uuid(),
    layoutId,
    text: '',
    fontSize: layoutId === 'title-page' ? 44 : 24,
    fontFamily,
    textColor: '#1a1a2e',
    textAlign: layoutId === 'title-page' ? 'center' : 'left',
    textZone: tz ? { ...tz } : null,
    images,
    overlays: [], // free-floating text boxes on top of images
    bgColor: '#ffffff',
    isTitlePage: layout.isTitlePage || false,
  };
}

export { BLEED, MARGIN };

export function useBookStore() {
  const [book, setBook] = useState(() => {
    try {
      const saved = localStorage.getItem('kidbook_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.pages?.length && parsed.setupDone) {
          // Migrate old pages that don't have overlays field
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

  const completeSetup = useCallback(({ title, authorName, trimSize, fontFamily, pageCount }) => {
    const pages = [];
    const tp = makePage('title-page', trimSize, fontFamily);
    tp.text = title + (authorName ? '\n\nBy ' + authorName : '');
    pages.push(tp);
    for (let i = 1; i < pageCount; i++) pages.push(makePage('text-only', trimSize, fontFamily));
    const nb = { setupDone: true, title, authorName, trimSize, fontFamily, pages, currentPageIdx: 0 };
    setBook(nb); pushHistory(nb);
  }, [pushHistory]);

  const resetBook = useCallback(() => {
    const blank = { setupDone: false, title: '', authorName: '', trimSize: '8x8', fontFamily: 'Georgia, serif', pages: [], currentPageIdx: 0 };
    setBook(blank); historyRef.current = []; historyIdxRef.current = -1;
    localStorage.removeItem('kidbook_v3');
  }, []);

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
      const copy = { ...b.pages[idx], id: uuid(), images: b.pages[idx].images.map(img => ({ ...img, id: uuid() })), overlays: (b.pages[idx].overlays||[]).map(o => ({ ...o, id: uuid() })) };
      const newPages = [...b.pages]; newPages.splice(idx + 1, 0, copy);
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
      const iz = layout?.imageZone; const tz = layout?.textZone;
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

  // ── Overlay (text-on-image) operations ────────────────────────────────────
  const addOverlay = useCallback((pageId) => {
    const overlay = {
      id: uuid(),
      text: '',
      x: 10, y: 35, w: 80, h: 30,   // % of page
      fontSize: 28,
      fontFamily: 'Georgia, serif',
      textColor: '#ffffff',
      textAlign: 'center',
      styleId: 'dark-band',           // default readable style
      zIndex: Date.now() + 100,
    };
    setBookSave(b => ({ ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, overlays: [...(p.overlays||[]), overlay] } : p) }));
  }, [setBookSave]);

  const updateOverlay = useCallback((pageId, overlayId, updates) => {
    setBookSave(b => ({ ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, overlays: (p.overlays||[]).map(o => o.id === overlayId ? { ...o, ...updates } : o) } : p) }));
  }, [setBookSave]);

  const deleteOverlay = useCallback((pageId, overlayId) => {
    setBookSave(b => ({ ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, overlays: (p.overlays||[]).filter(o => o.id !== overlayId) } : p) }));
  }, [setBookSave]);

  return {
    book, TRIM_SIZES, FONTS, LAYOUTS, OVERLAY_STYLES, BLEED, MARGIN,
    undo, canUndo: historyIdxRef.current > 0,
    completeSetup, resetBook,
    setCurrentPage, updatePage, addPage, deletePage, duplicatePage, movePage, changePageLayout,
    addImage, updateImage, deleteImage,
    addOverlay, updateOverlay, deleteOverlay,
    currentPage: book.pages[book.currentPageIdx] || null,
    loadBookData, getBook, setTitle,
  };
}
