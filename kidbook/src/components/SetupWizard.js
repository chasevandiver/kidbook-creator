// components/SetupWizard.js
import React, { useState } from 'react';
import { TRIM_SIZES, FONTS } from '../store/useBookStore';

const STEPS = ['welcome', 'title', 'size', 'font', 'pages'];

const SIZE_ICONS = {
  '8x8': '⬛', '8.5x8.5': '⬛', '8x10': '📄',
  '8.5x11': '📄', '6x9': '📖', '11x8.5': '🖼️',
};

export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    title: '',
    authorName: '',
    trimSize: '8x8',
    fontFamily: 'Georgia, serif',
    pageCount: 12,
  });

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));
  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const canProceed = () => {
    if (currentStep === 'title') return data.title.trim().length > 0;
    return true;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1628 0%, #1a2540 50%, #0f1628 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Segoe UI', Arial, sans-serif",
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 24, padding: '40px 44px',
        maxWidth: 640, width: '100%',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 36 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              width: i <= step ? 28 : 10, height: 10,
              borderRadius: 5,
              background: i < step ? '#4a90d9' : i === step ? '#7ec8e3' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* ── WELCOME ── */}
        {currentStep === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>📚</div>
            <h1 style={{ color: '#fff', fontSize: 34, fontWeight: 900, margin: '0 0 16px' }}>
              Welcome to KidBook Creator!
            </h1>
            <p style={{ color: '#aab', fontSize: 18, lineHeight: 1.7, margin: '0 0 32px' }}>
              This app will help you create a beautiful children's book that you can
              print and sell on Amazon — step by step, no experience needed.
            </p>
            <p style={{ color: '#778', fontSize: 15, marginBottom: 36 }}>
              It only takes about 2 minutes to get set up. Let's go! 🎉
            </p>
          </div>
        )}

        {/* ── TITLE ── */}
        {currentStep === 'title' && (
          <div>
            <h2 style={heading}>What is your book called?</h2>
            <p style={subtext}>Give your book a title. You can change this later.</p>
            <input
              autoFocus
              type="text"
              placeholder="e.g. The Brave Little Dragon"
              value={data.title}
              onChange={e => set('title', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && data.title.trim() && next()}
              style={bigInput}
            />
            <h3 style={{ ...heading, fontSize: 20, marginTop: 28 }}>Your name (optional)</h3>
            <p style={subtext}>This will appear on the title page as the author.</p>
            <input
              type="text"
              placeholder="e.g. Grandma Rose"
              value={data.authorName}
              onChange={e => set('authorName', e.target.value)}
              style={bigInput}
            />
          </div>
        )}

        {/* ── SIZE ── */}
        {currentStep === 'size' && (
          <div>
            <h2 style={heading}>What size should your book be?</h2>
            <p style={subtext}>Square books are the most popular for children's picture books.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              {Object.entries(TRIM_SIZES).map(([key, val]) => (
                <div
                  key={key}
                  onClick={() => set('trimSize', key)}
                  style={{
                    background: data.trimSize === key ? 'rgba(74,144,217,0.25)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${data.trimSize === key ? '#4a90d9' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12, padding: '14px 18px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 26 }}>{SIZE_ICONS[key] || '📄'}</span>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>{val.label}</div>
                    <div style={{ color: '#889', fontSize: 13, marginTop: 2 }}>{val.desc}</div>
                  </div>
                  {data.trimSize === key && (
                    <span style={{ marginLeft: 'auto', color: '#4a90d9', fontSize: 22 }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FONT ── */}
        {currentStep === 'font' && (
          <div>
            <h2 style={heading}>Pick a text style for your book</h2>
            <p style={subtext}>This is how all the words in your story will look.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              {FONTS.map(font => (
                <div
                  key={font.id}
                  onClick={() => set('fontFamily', font.id)}
                  style={{
                    background: data.fontFamily === font.id ? 'rgba(74,144,217,0.25)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${data.fontFamily === font.id ? '#4a90d9' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12, padding: '14px 20px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ color: '#aab', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                      {font.label}
                    </div>
                    <div style={{ fontFamily: font.id, color: '#fff', fontSize: 20 }}>
                      {font.sample}
                    </div>
                  </div>
                  {data.fontFamily === font.id && (
                    <span style={{ color: '#4a90d9', fontSize: 22, marginLeft: 16 }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PAGES ── */}
        {currentStep === 'pages' && (
          <div>
            <h2 style={heading}>How many pages do you want to start with?</h2>
            <p style={subtext}>
              You can always add or remove pages later. Most children's picture books are 24–32 pages.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
              {[
                { count: 8,  label: '8 pages',  desc: 'Short and simple — great for a first book' },
                { count: 16, label: '16 pages', desc: 'Medium length — popular for picture books' },
                { count: 24, label: '24 pages', desc: 'Standard picture book length' },
                { count: 32, label: '32 pages', desc: 'Full-length picture book' },
              ].map(({ count, label, desc }) => (
                <div
                  key={count}
                  onClick={() => set('pageCount', count)}
                  style={{
                    background: data.pageCount === count ? 'rgba(74,144,217,0.25)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${data.pageCount === count ? '#4a90d9' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12, padding: '14px 20px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ textAlign: 'center', minWidth: 52 }}>
                    <div style={{ color: '#4a90d9', fontSize: 26, fontWeight: 900 }}>{count}</div>
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{label}</div>
                    <div style={{ color: '#889', fontSize: 13, marginTop: 2 }}>{desc}</div>
                  </div>
                  {data.pageCount === count && (
                    <span style={{ marginLeft: 'auto', color: '#4a90d9', fontSize: 22 }}>✓</span>
                  )}
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 20, background: 'rgba(74,144,217,0.1)',
              borderRadius: 10, padding: '12px 16px',
              color: '#7ab', fontSize: 13, lineHeight: 1.6,
            }}>
              💡 <strong style={{ color: '#acd' }}>Tip:</strong> Amazon KDP requires books to have
              at least 24 pages. If you start with fewer, just add more pages before exporting.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36 }}>
          {step > 0 ? (
            <button onClick={back} style={backBtn}>← Back</button>
          ) : <div />}

          <button
            onClick={isLast ? () => setTimeout(() => onComplete(data), 0) : next}
            disabled={!canProceed()}
            style={{
              background: canProceed()
                ? (isLast ? 'linear-gradient(135deg, #27ae60, #1e8449)' : 'linear-gradient(135deg, #4a90d9, #6a4fc8)')
                : '#333',
              color: canProceed() ? 'white' : '#666',
              border: 'none', borderRadius: 14,
              padding: '16px 36px', fontSize: 18, fontWeight: 800,
              cursor: canProceed() ? 'pointer' : 'default',
              boxShadow: canProceed() ? '0 6px 20px rgba(74,144,217,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {isLast ? '🎉 Create My Book!' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

const heading = { color: '#fff', fontSize: 26, fontWeight: 900, margin: '0 0 8px' };
const subtext = { color: '#889', fontSize: 15, margin: '0 0 8px', lineHeight: 1.6 };
const bigInput = {
  width: '100%', fontSize: 22, padding: '14px 18px',
  borderRadius: 12, border: '2px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)', color: '#fff',
  outline: 'none', boxSizing: 'border-box', marginTop: 8,
  fontFamily: 'inherit',
};
const backBtn = {
  background: 'transparent', color: '#778',
  border: '2px solid rgba(255,255,255,0.1)', borderRadius: 12,
  padding: '14px 24px', fontSize: 16, cursor: 'pointer', fontWeight: 600,
};
