// store/useBookStore.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';

export const TRIM_SIZES = {
  '8x8':     { w: 8,   h: 8,   label: '8" × 8"',   desc: 'Square — most popular for kids' },
  '8.5x8.5': { w: 8.5, h: 8.5, label: '8.5" × 8.5"', desc: 'Large square' },
  '8x10':    { w: 8,   h: 10,  label: '8" × 10"',  desc: 'Portrait — great for tall illustrations' },
  '8.5x11':  { w: 8.5, h: 11,  label: '8.5" × 11"', desc: 'Full letter size' },
  '6x9':     { w: 6,   h: 9,   label: '6" × 9"',   desc: 'Chapter book / novel size' },
  '11x8.5':  { w: 11,  h: 8.5, label: '11" × 8.5"', desc: 'Landscape / wide pages' },
};

export const FONTS = [
  { id: 'Georgia, serif',              label: 'Classic',    sample: 'Once upon a time...' },
  { id: '"Comic Sans MS", cursive',    label: 'Playful',    sample: 'Once upon a time...' },
  { id: '"Palatino Linotype", serif',  label: 'Elegant',    sample: 'Once upon a time...' },
  { id: '"Trebuchet MS", sans-serif',  label: 'Friendly',   sample: 'Once upon a time...' },
  { id: '"Courier New", monospace',    label: 'Typewriter', sample: 'Once upon a time...' },
  { id: 'Arial Rounded MT Bold, Arial, sans-serif', label: 'Rounded', sample: 'Once upon a time...' },
];

export const LAYOUTS = [
  { id: 'text-top',    label: 'Text on Top',    desc: 'Story text at top, picture below',    textY: 6,  imgY: 35, imgH: 58 },
  { id: 'text-bottom', label: 'Text at Bottom', desc: 'Picture fills top, text at bottom',   textY: 76, imgY: 5,  imgH: 65 },
  { id: 'text-left',   label: 'Text on Left',   desc: 'Text left side, picture right side',  textY: 20, imgY: 5,  imgH: 90, imgX: 52, imgW: 44, textW: 44 },
  { id: 'full-image',  label: 'Full Picture',   desc: 'Picture fills whole page, no text',   textY: 85, imgY: 0,  imgH: 100, imgX: 0, imgW: 100 },
  { id: 'text-only',   label: 'Text Only',      desc: 'Words only — no picture on this page', textY: 15, imgY: null },
  { id: 'title-page',  label: 'Title Page',     desc: 'Big centered title with author name', textY: 35, imgY: null, isTitlePage: true },
];

export const BG_COLORS = [
  '#ffffff', '#fffdf5', '#f5f0ff', '#f0f8ff', '#fff0f5',
  '#f0fff4', '#fffbf0', '#f5f5f5', '#1a1a2e', '#0d2137',
];

const BLEED = 0.125;
const MARGIN = 0.5;

function makePage(layoutId = 'text-bottom', trimSize = '8x8') {
  const layout = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[1];
  const { w: trimW, h: trimH } = TRIM_SIZES[trimSize];
  const marginPctX = (MARGIN / trimW) * 100;
  const marginPctY = (MARGIN / trimH) * 100;

  const images = [];
  if (layout.imgY !== null && layout.imgY !== undefined) {
    images.push({
      id: uuid(),
      src: null,
      x: layout.imgX ?? marginPctX,
      y: layout.imgY ?? marginPctY,
      w: layout.imgW ?? (100 - marginPctX * 2),
      h: layout.imgH ?? 55,
      locked: false,
      zIndex: 1,
      placeholder: true,
    });
  }

  return {
    id: uuid(),
    layoutId,
    text: '',
    fontSize: layoutId === 'title-page' ? 48 : 28,
    fontFamily: 'Georgia, serif',
    textColor: '#1a1a2e',
    textAlign: layoutId === 'title-page' ? 'center' : 'left',
    textPosition: {
      x: layout.textW ? marginPctX : marginPctX,
      y: layout.textY ?? marginPctY,
      w: layout.textW ?? (100 - marginPctX * 2),
    },
    images,
    bgColor: '#ffffff',
    isTitlePage: layout.isTitlePage || false,
  };
}

export { BLEED, MARGIN, makePage };

const MAX_UNDO = 30;

export function useBookStore() {
  const [book, setBook] = useState(() => {
    try {
      const saved = localStorage.getItem('kidbook_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.pages) return { ...parsed, setupDone: true };
      }
    } catch (e) {}
    return {
      setupDone: false,
      title: '',
      authorName: '',
      trimSize: '8x8',
      fontFamily: 'Georgia, serif',
      pages: [],
      currentPageIdx: 0,
    };
  });

  const historyRef = useRef([]);
  const historyIdxRef = useRef(-1);

  // Push to undo stack
  const pushHistory = useCallback((newBook) => {
    const stack = historyRef.current.slice(0, historyIdxRef.current + 1);
    stack.push(newBook);
    if (stack.length > MAX_UNDO) stack.shift();
    historyRef.current = stack;
    historyIdxRef.current = stack.length - 1;
  }, []);

  const setBookWithHistory = useCallback((updater) => {
    setBook(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current -= 1;
      const prev = historyRef.current[historyIdxRef.current];
      setBook(prev);
    }
  }, []);

  const canUndo = historyIdxRef.current > 0;

  // Auto-save
  useEffect(() => {
    try {
      localStorage.setItem('kidbook_v3', JSON.stringify(book));
    } catch (e) {
      // storage full — silently fail
    }
  }, [book]);

  // ── SETUP WIZARD ──
  const completeSetup = useCallback(({ title, authorName, trimSize, fontFamily, pageCount }) => {
    const pages = [];
    // Title page first
    const titlePg = makePage('title-page', trimSize);
    titlePg.text = title + (authorName ? '\n\nBy ' + authorName : '');
    titlePg.fontFamily = fontFamily;
    pages.push(titlePg);
    // Blank story pages
    const layouts = ['text-bottom', 'text-top', 'text-bottom', 'text-left', 'text-bottom'];
    for (let i = 1; i < pageCount; i++) {
      const pg = makePage(layouts[i % layouts.length] || 'text-bottom', trimSize);
      pg.fontFamily = fontFamily;
      pages.push(pg);
    }
    const newBook = { setupDone: true, title, authorName, trimSize, fontFamily, pages, currentPageIdx: 0 };
    setBook(newBook);
    pushHistory(newBook);
  }, [pushHistory]);

  const resetBook = useCallback(() => {
    const blank = { setupDone: false, title: '', authorName: '', trimSize: '8x8', fontFamily: 'Georgia, serif', pages: [], currentPageIdx: 0 };
    setBook(blank);
    historyRef.current = [];
    historyIdxRef.current = -1;
    localStorage.removeItem('kidbook_v3');
  }, []);

  // ── PAGE OPS ──
  const setCurrentPage = useCallback((idx) => {
    setBook(b => ({ ...b, currentPageIdx: idx }));
  }, []);

  const updatePage = useCallback((pageId, updates) => {
    setBookWithHistory(b => ({
      ...b,
      pages: b.pages.map(p => p.id === pageId ? { ...p, ...updates } : p)
    }));
  }, [setBookWithHistory]);

  const addPage = useCallback((layoutId = 'text-bottom') => {
    setBookWithHistory(b => {
      const pg = makePage(layoutId, b.trimSize);
      pg.fontFamily = b.fontFamily;
      const newPages = [...b.pages, pg];
      return { ...b, pages: newPages, currentPageIdx: newPages.length - 1 };
    });
  }, [setBookWithHistory]);

  const deletePage = useCallback((pageId) => {
    setBookWithHistory(b => {
      if (b.pages.length <= 1) return b;
      const idx = b.pages.findIndex(p => p.id === pageId);
      const newPages = b.pages.filter(p => p.id !== pageId);
      return { ...b, pages: newPages, currentPageIdx: Math.max(0, Math.min(idx, newPages.length - 1)) };
    });
  }, [setBookWithHistory]);

  const duplicatePage = useCallback((pageId) => {
    setBookWithHistory(b => {
      const idx = b.pages.findIndex(p => p.id === pageId);
      const copy = { ...b.pages[idx], id: uuid(), images: b.pages[idx].images.map(img => ({ ...img, id: uuid() })) };
      const newPages = [...b.pages];
      newPages.splice(idx + 1, 0, copy);
      return { ...b, pages: newPages, currentPageIdx: idx + 1 };
    });
  }, [setBookWithHistory]);

  const movePage = useCallback((fromIdx, toIdx) => {
    setBookWithHistory(b => {
      const pages = [...b.pages];
      const [removed] = pages.splice(fromIdx, 1);
      pages.splice(toIdx, 0, removed);
      return { ...b, pages, currentPageIdx: toIdx };
    });
  }, [setBookWithHistory]);

  const changePageLayout = useCallback((pageId, layoutId) => {
    setBookWithHistory(b => {
      const pg = b.pages.find(p => p.id === pageId);
      if (!pg) return b;
      const newPg = makePage(layoutId, b.trimSize);
      const merged = {
        ...newPg,
        id: pg.id,
        text: pg.text,
        fontSize: pg.fontSize,
        fontFamily: pg.fontFamily || b.fontFamily,
        textColor: pg.textColor,
        textAlign: pg.textAlign,
        bgColor: pg.bgColor,
        // keep real images, drop placeholder
        images: [
          ...newPg.images,
          ...pg.images.filter(img => !img.placeholder),
        ],
      };
      return { ...b, pages: b.pages.map(p => p.id === pageId ? merged : p) };
    });
  }, [setBookWithHistory]);

  // ── IMAGE OPS ──
  const addImage = useCallback((pageId, imageData) => {
    setBookWithHistory(b => {
      const pg = b.pages.find(p => p.id === pageId);
      if (!pg) return b;
      // Replace first placeholder if exists
      const placeholder = pg.images.find(img => img.placeholder);
      if (placeholder) {
        return {
          ...b,
          pages: b.pages.map(p => p.id === pageId ? {
            ...p,
            images: p.images.map(img => img.id === placeholder.id ? { ...img, src: imageData, placeholder: false } : img)
          } : p)
        };
      }
      // Otherwise add new
      const img = { id: uuid(), src: imageData, x: 10, y: 10, w: 80, h: 60, locked: false, zIndex: Date.now() };
      return { ...b, pages: b.pages.map(p => p.id === pageId ? { ...p, images: [...p.images, img] } : p) };
    });
  }, [setBookWithHistory]);

  const updateImage = useCallback((pageId, imageId, updates) => {
    setBookWithHistory(b => ({
      ...b,
      pages: b.pages.map(p =>
        p.id === pageId
          ? { ...p, images: p.images.map(img => img.id === imageId ? { ...img, ...updates } : img) }
          : p
      )
    }));
  }, [setBookWithHistory]);

  const deleteImage = useCallback((pageId, imageId) => {
    setBookWithHistory(b => ({
      ...b,
      pages: b.pages.map(p =>
        p.id === pageId ? { ...p, images: p.images.filter(img => img.id !== imageId) } : p
      )
    }));
  }, [setBookWithHistory]);

  return {
    book,
    TRIM_SIZES,
    FONTS,
    LAYOUTS,
    BG_COLORS,
    BLEED,
    MARGIN,
    undo,
    canUndo,
    completeSetup,
    resetBook,
    setCurrentPage,
    updatePage,
    addPage,
    deletePage,
    duplicatePage,
    movePage,
    changePageLayout,
    addImage,
    updateImage,
    deleteImage,
    currentPage: book.pages[book.currentPageIdx] || null,
  };
}
