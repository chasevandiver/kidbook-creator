// components/LoginScreen.js
import React, { useState } from 'react';

export default function LoginScreen({ onSignInGoogle, onSignInEmail, onSignUpEmail }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const handle = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await onSignInEmail(email, password);
      } else {
        await onSignUpEmail(email, password);
        setSignupDone(true);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  if (signupDone) return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
        <h2 style={h2}>Check your email!</h2>
        <p style={sub}>We sent you a confirmation link. Click it, then come back here to sign in.</p>
        <button onClick={() => setSignupDone(false)} style={btnPrimary}>Back to Sign In</button>
      </div>
    </div>
  );

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>📚</div>
        <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 900, margin: '0 0 6px' }}>KidBook Creator</h1>
        <p style={{ ...sub, marginBottom: 32 }}>Create beautiful children's books for Amazon KDP</p>

        {/* Google sign-in */}
        <button onClick={onSignInGoogle} style={googleBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <div style={{ color: '#445', fontSize: 13, margin: '16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          or use email
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <input
          type="email" placeholder="Email address" value={email}
          onChange={e => setEmail(e.target.value)}
          style={inp} autoComplete="email"
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
          style={{ ...inp, marginTop: 10 }} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {error && <div style={{ color: '#e88', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{error}</div>}

        <button onClick={handle} disabled={loading || !email || !password} style={{ ...btnPrimary, marginTop: 16, opacity: loading ? 0.6 : 1 }}>
          {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}
          style={{ background: 'none', border: 'none', color: '#6a9', fontSize: 14, cursor: 'pointer', marginTop: 14 }}>
          {mode === 'login' ? "Don't have an account? Sign up free" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}

const wrap = { minHeight: '100vh', background: 'linear-gradient(160deg, #0c1020 0%, #161d35 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Segoe UI', Arial, sans-serif" };
const card = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '44px 40px', maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' };
const h2 = { color: '#fff', fontSize: 26, fontWeight: 900, margin: '0 0 10px', textAlign: 'center' };
const sub = { color: '#889', fontSize: 15, textAlign: 'center', margin: 0 };
const inp = { width: '100%', fontSize: 17, padding: '13px 16px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const btnPrimary = { width: '100%', background: 'linear-gradient(135deg, #4a90d9, #6a4fc8)', color: 'white', border: 'none', borderRadius: 12, padding: '15px', fontSize: 17, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(74,144,217,0.4)' };
const googleBtn = { width: '100%', background: '#fff', color: '#333', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' };
