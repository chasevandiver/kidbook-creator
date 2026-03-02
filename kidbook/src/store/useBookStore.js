// store/useBookStore.js
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';

const TRIM_SIZES = {
  '6x9':     { w: 6,   h: 9,   label: '6" × 9" Novel' },
  '7x10':    { w: 7,   h: 10,  label: '7" × 10" Portrait' },
  '7.5x7.5': { w: 7.5, h: 7.5, label: '7.5" × 7.5" Square' },
  '8x8':     { w: 8,   h: 8,   label: '8" × 8" Square' },
  '8.5x8.5': { w: 8.5, h: 8.5, label: '8.5" × 8.5" Square' },
  '8x10':    { w: 8,   h: 10,  label: '8" × 10" Portrait' },
  '8.5x11':  { w: 8.5, h: 11,  label: '8.5" × 11" Letter' },
  '11x8.5':  { w: 11,  h: 8.5, label: '11" × 8.5" Landscape' },
};

const BLEED = 0.125; // inches
const MARGIN = 0.5;  // inches

function makeBlankPage() {
  return {
    id: uuid(),
    text: '',
    fontSize: 28,
    textColor: '#1a1a2e',
    textAlign: 'center',
    textPosition: { x: 50, y: 10 }, // percent — starts near top inside margin
    images: [],
    bgColor: '#ffffff',
  };
}

export function useBookStore() {
  const [book, setBook] = useState(() => {
    try {
      const saved = localStorage.getItem('kidbook_autosave');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      title: 'My Children\'s Book',
      trimSize: '8.5x8.5',
      pages: [makeBlankPage()],
      currentPageIdx: 0,
    };
  });

  // Auto-save
  useEffect(() => {
    try {
      // Strip image data for storage (just store refs)
      localStorage.setItem('kidbook_autosave', JSON.stringify(book));
    } catch (e) {}
  }, [book]);

  const setCurrentPage = useCallback((idx) => {
    setBook(b => ({ ...b, currentPageIdx: idx }));
  }, []);

  const updatePage = useCallback((pageId, updates) => {
    setBook(b => ({
      ...b,
      pages: b.pages.map(p => p.id === pageId ? { ...p, ...updates } : p)
    }));
  }, []);

  const addPage = useCallback(() => {
    setBook(b => {
      const newPages = [...b.pages, makeBlankPage()];
      return { ...b, pages: newPages, currentPageIdx: newPages.length - 1 };
    });
  }, []);

  const deletePage = useCallback((pageId) => {
    setBook(b => {
      if (b.pages.length <= 1) return b;
      const idx = b.pages.findIndex(p => p.id === pageId);
      const newPages = b.pages.filter(p => p.id !== pageId);
      return {
        ...b,
        pages: newPages,
        currentPageIdx: Math.min(idx, newPages.length - 1)
      };
    });
  }, []);

  const duplicatePage = useCallback((pageId) => {
    setBook(b => {
      const idx = b.pages.findIndex(p => p.id === pageId);
      const copy = { ...b.pages[idx], id: uuid() };
      const newPages = [...b.pages];
      newPages.splice(idx + 1, 0, copy);
      return { ...b, pages: newPages, currentPageIdx: idx + 1 };
    });
  }, []);

  const movePage = useCallback((fromIdx, toIdx) => {
    setBook(b => {
      const pages = [...b.pages];
      const [removed] = pages.splice(fromIdx, 1);
      pages.splice(toIdx, 0, removed);
      return { ...b, pages, currentPageIdx: toIdx };
    });
  }, []);

  const addImage = useCallback((pageId, imageData) => {
    const img = {
      id: uuid(),
      src: imageData,
      x: 20, y: 20,       // percent
      w: 60, h: 40,       // percent
      locked: false,
      zIndex: Date.now(),
    };
    setBook(b => ({
      ...b,
      pages: b.pages.map(p =>
        p.id === pageId ? { ...p, images: [...p.images, img] } : p
      )
    }));
  }, []);

  const updateImage = useCallback((pageId, imageId, updates) => {
    setBook(b => ({
      ...b,
      pages: b.pages.map(p =>
        p.id === pageId
          ? { ...p, images: p.images.map(img => img.id === imageId ? { ...img, ...updates } : img) }
          : p
      )
    }));
  }, []);

  const deleteImage = useCallback((pageId, imageId) => {
    setBook(b => ({
      ...b,
      pages: b.pages.map(p =>
        p.id === pageId
          ? { ...p, images: p.images.filter(img => img.id !== imageId) }
          : p
      )
    }));
  }, []);

  const setTrimSize = useCallback((size) => {
    setBook(b => ({ ...b, trimSize: size }));
  }, []);

  const setTitle = useCallback((title) => {
    setBook(b => ({ ...b, title }));
  }, []);

  return {
    book,
    TRIM_SIZES,
    BLEED,
    MARGIN,
    setCurrentPage,
    updatePage,
    addPage,
    deletePage,
    duplicatePage,
    movePage,
    addImage,
    updateImage,
    deleteImage,
    setTrimSize,
    setTitle,
    currentPage: book.pages[book.currentPageIdx],
  };
}
