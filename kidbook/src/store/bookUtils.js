// store/bookUtils.js — pure functions, no hooks, safe to import anywhere
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
  { id: 'text-only',      label: 'Text Only',         icon: '📝', desc: 'Full page of writing, no picture',    textZone: { x: 8, y: 8, w: 84, h: 84 },   imageZone: null },
  { id: 'picture-bottom', label: 'Picture at Bottom', icon: '🔤', desc: 'Text at top, picture below',          textZone: { x: 8, y: 8, w: 84, h: 36 },   imageZone: { x: 8, y: 50, w: 84, h: 44 } },
  { id: 'picture-top',    label: 'Picture at Top',    icon: '🖼', desc: 'Picture at top, text below',          textZone: { x: 8, y: 68, w: 84, h: 26 },  imageZone: { x: 8, y: 6,  w: 84, h: 58 } },
  { id: 'picture-right',  label: 'Picture on Right',  icon: '↔️', desc: 'Text on left, picture on right',      textZone: { x: 6, y: 8,  w: 44, h: 84 },  imageZone: { x: 52, y: 6, w: 44, h: 88 } },
  { id: 'full-picture',   label: 'Full Picture',      icon: '🖼️', desc: 'Picture fills the whole page',        textZone: null,                            imageZone: { x: 0, y: 0, w: 100, h: 100 } },
  { id: 'title-page',     label: 'Title Page',        icon: '📖', desc: 'Centered title and author name',      textZone: { x: 10, y: 30, w: 80, h: 40 }, imageZone: null, isTitlePage: true },
];

export const OVERLAY_STYLES = [
  { id: 'none',        label: 'No Background',  bg: 'transparent',            textColor: '#ffffff', shadow: '2px 2px 4px rgba(0,0,0,0.9)' },
  { id: 'dark-band',   label: 'Dark Band',      bg: 'rgba(0,0,0,0.55)',       textColor: '#ffffff', shadow: 'none' },
  { id: 'light-band',  label: 'Light Band',     bg: 'rgba(255,255,255,0.82)', textColor: '#1a1a2e', shadow: 'none' },
  { id: 'dark-solid',  label: 'Dark Box',       bg: 'rgba(20,20,40,0.88)',    textColor: '#ffffff', shadow: 'none' },
  { id: 'light-solid', label: 'White Box',      bg: 'rgba(255,255,255,0.95)', textColor: '#1a1a2e', shadow: 'none' },
  { id: 'shadow-only', label: 'Shadow Only',    bg: 'transparent',            textColor: '#ffffff', shadow: '2px 2px 0px #000,-2px -2px 0px #000,2px -2px 0px #000,-2px 2px 0px #000' },
];

export const BLEED = 0.125;
export const MARGIN = 0.5;

export function makePage(layoutId = 'text-only', trimSize = '8x8', fontFamily = 'Georgia, serif') {
  const layout = LAYOUTS.find(l => l.id === layoutId) || LAYOUTS[0];
  const tz = layout.textZone;
  const iz = layout.imageZone;
  const images = iz ? [{
    id: uuid(), src: null,
    x: iz.x, y: iz.y, w: iz.w, h: iz.h,
    locked: false, zIndex: 1, placeholder: true,
  }] : [];
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
    overlays: [],
    bgColor: '#ffffff',
    isTitlePage: layout.isTitlePage || false,
  };
}

export function buildBookFromWizard({ title, authorName, trimSize, fontFamily, pageCount }) {
  const pages = [];
  const tp = makePage('title-page', trimSize, fontFamily);
  tp.text = title + (authorName ? '\n\nBy ' + authorName : '');
  pages.push(tp);
  for (let i = 1; i < pageCount; i++) {
    pages.push(makePage('text-only', trimSize, fontFamily));
  }
  return { setupDone: true, title, authorName, trimSize, fontFamily, pages, currentPageIdx: 0 };
}
