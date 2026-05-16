"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Loader2, Menu, X } from 'lucide-react';
import Link from 'next/link';
import CreativeSelectionModal from './CreativeSelectionModal';

// ─── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(phrases, { typeSpeed = 60, deleteSpeed = 35, pauseAfterType = 1800, pauseAfterDelete = 400 } = {}) {
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState('typing'); // 'typing' | 'pausing' | 'deleting' | 'waiting'
  const [phraseIndex, setPhraseIndex] = useState(0);
  const timeout = useRef(null);

  useEffect(() => {
    const current = phrases[phraseIndex];

    if (phase === 'typing') {
      if (displayed.length < current.length) {
        timeout.current = setTimeout(() => {
          setDisplayed(current.slice(0, displayed.length + 1));
        }, typeSpeed + Math.random() * 30); // slight jitter for realism
      } else {
        timeout.current = setTimeout(() => setPhase('pausing'), pauseAfterType);
      }
    } else if (phase === 'pausing') {
      setPhase('deleting');
    } else if (phase === 'deleting') {
      if (displayed.length > 0) {
        timeout.current = setTimeout(() => {
          setDisplayed(d => d.slice(0, -1));
        }, deleteSpeed + Math.random() * 15);
      } else {
        timeout.current = setTimeout(() => {
          setPhraseIndex(i => (i + 1) % phrases.length);
          setPhase('typing');
        }, pauseAfterDelete);
      }
    }

    return () => clearTimeout(timeout.current);
  }, [displayed, phase, phraseIndex, phrases, typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete]);

  return displayed;
}
// ──────────────────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

  .ck-hero * { box-sizing: border-box; margin: 0; padding: 0; }

  .ck-hero {
    font-family: 'Geist', sans-serif;
    min-height: 100vh;
    color: #111;
  }

  /* ── Background gradient ── */
  .ck-bg {
    background:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.10) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 60%, rgba(20,184,166,0.07) 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 15% 70%, rgba(245,158,11,0.06) 0%, transparent 55%),
      #f7f7f5;
  }

  /* ── Nav ── */
  .ck-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    height: 64px;
    border-bottom: 1px solid rgba(0,0,0,0.07);
    background: rgba(247,247,245,0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 50;
    transition: box-shadow 0.2s;
  }
  .ck-nav.scrolled {
    box-shadow: 0 1px 16px rgba(0,0,0,0.07);
    background: rgba(247,247,245,0.95);
  }
  .ck-logo {
    font-family: 'Geist', sans-serif;
    font-weight: 600;
    font-size: 15px;
    color: #111;
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: -0.2px;
    text-decoration: none;
  }
  .ck-logo-mark {
    width: 26px; height: 26px;
    background: #111;
    border-radius: 7px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .ck-nav-center {
    display: flex;
    align-items: center;
    gap: 32px;
    list-style: none;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  .ck-nav-center button {
    font-family: 'Geist', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #555;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
    white-space: nowrap;
  }
  .ck-nav-center button:hover { color: #111; }
  .ck-nav-actions { display: flex; align-items: center; gap: 10px; }
  .ck-btn-ghost {
    font-family: 'Geist', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    color: #555;
    background: #f0f0ec;
    border: 1px solid #e0e0da;
    border-radius: 8px;
    padding: 7px 16px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    display: flex; align-items: center; gap: 6px;
  }
  .ck-btn-ghost:hover { border-color: #bbb; color: #111; background: #e8e8e4; }
  .ck-btn-ghost:disabled { opacity: 0.65; cursor: not-allowed; }
  .ck-btn-cta {
    font-family: 'Geist', sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    color: #fff;
    background: #1447e6;
    border: none;
    border-radius: 8px;
    padding: 7px 18px;
    cursor: pointer;
    transition: background 0.15s, transform 0.15s;
    display: flex; align-items: center; gap: 6px;
  }
  .ck-btn-cta:hover { background: #0f3bbf; transform: translateY(-1px); }
  .ck-btn-cta:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

  .ck-mobile-toggle {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    color: #333;
    transition: background 0.15s;
  }
  .ck-mobile-toggle:hover { background: rgba(0,0,0,0.05); }

  .ck-mobile-menu {
    display: none;
    flex-direction: column;
    gap: 4px;
    padding: 16px 24px 20px;
    border-top: 1px solid rgba(0,0,0,0.07);
    background: rgba(247,247,245,0.98);
  }
  .ck-mobile-menu.open { display: flex; }
  .ck-mobile-link {
    font-family: 'Geist', sans-serif;
    font-size: 15px;
    font-weight: 400;
    color: #444;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 10px 0;
    display: flex; align-items: center; gap: 8px;
    transition: color 0.15s;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
  .ck-mobile-link:last-of-type { border-bottom: none; }
  .ck-mobile-link:hover { color: #111; }
  .ck-mobile-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid rgba(0,0,0,0.07);
    margin-top: 8px;
  }
  .ck-mobile-actions .ck-btn-ghost,
  .ck-mobile-actions .ck-btn-cta { width: 100%; justify-content: center; padding: 10px 18px; }

  @media (max-width: 1023px) {
    .ck-nav-center { display: none; }
    .ck-nav-actions { display: none; }
    .ck-mobile-toggle { display: flex; }
    .ck-nav { padding: 0 20px; }
  }

  /* ── Hero body ── */
  .ck-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 100px 24px 80px;
    max-width: 800px;
    margin: 0 auto;
  }

  /* Eyebrow */
  .ck-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 500;
    color: #888;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 28px;
    padding: 5px 14px;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 100px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(6px);
  }
  .ck-eyebrow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
    animation: ck-pulse 2s ease-in-out infinite;
  }
  @keyframes ck-pulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
    50% { box-shadow: 0 0 0 5px rgba(34,197,94,0.1); }
  }

  /* ── Headline with typewriter ── */
  .ck-h1 {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(46px, 7vw, 74px);
    font-weight: 400;
    line-height: 1.06;
    letter-spacing: -0.02em;
    color: #0f0f0f;
    margin-bottom: 22px;
    min-height: 3em; /* reserve space so layout doesn't jump */
  }
  .ck-h1-static { display: block; color: #555; font-style: italic; }

  /* The dynamic typed line */
  .ck-typed-line {
    display: block;
    position: relative;
    min-height: 1.06em;
  }
  .ck-typed-text {
    color: #0f0f0f;
  }

  /* Blinking cursor */
  .ck-cursor {
    display: inline-block;
    width: 3px;
    height: 0.82em;
    background: #1447e6;
    border-radius: 2px;
    margin-left: 3px;
    vertical-align: middle;
    animation: ck-blink 1.05s step-end infinite;
  }
  @keyframes ck-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* Sub */
  .ck-sub {
    font-size: 17px;
    font-weight: 300;
    color: #777;
    line-height: 1.65;
    max-width: 460px;
    margin-bottom: 44px;
  }

  /* Form */
  .ck-form { width: 100%; max-width: 480px; }
  .ck-input-row {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.9);
    border: 1.5px solid rgba(0,0,0,0.12);
    border-radius: 12px;
    padding: 5px 5px 5px 16px;
    gap: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    backdrop-filter: blur(8px);
  }
  .ck-input-row:focus-within {
    border-color: #1447e6;
    box-shadow: 0 0 0 3px rgba(20,71,230,0.1), 0 2px 8px rgba(0,0,0,0.06);
  }
  .ck-globe { color: #bbb; flex-shrink: 0; }
  .ck-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Geist', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #111;
    min-width: 0;
  }
  .ck-input::placeholder { color: #c0c0b8; }
  .ck-submit {
    font-family: 'Geist', sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    padding: 9px 18px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .ck-submit.on  { background: #1447e6; color: #fff; }
  .ck-submit.on:hover { background: #0f3bbf; transform: translateY(-1px); }
  .ck-submit.off { background: #efefeb; color: #bbb; cursor: not-allowed; }
  .ck-form-hint {
    margin-top: 14px;
    font-size: 12px;
    color: #b0b0a8;
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  .ck-form-hint span { display: flex; align-items: center; gap: 5px; }

  /* ── Social proof ── */
  .ck-proof {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 48px;
    font-size: 13px;
    color: #888;
  }
  .ck-avatars { display: flex; margin-right: 4px; }
  .ck-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 2px solid #f7f7f5;
    margin-left: -8px;
    font-size: 11px;
    font-weight: 600;
    display: grid;
    place-items: center;
    color: #fff;
  }
  .ck-avatar:first-child { margin-left: 0; }
  .ck-stars { color: #f59e0b; letter-spacing: -2px; font-size: 14px; }

  /* ── Feature pills ── */
  .ck-pills {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 80px;
    padding: 0 24px;
  }
  .ck-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: rgba(255,255,255,0.8);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 100px;
    font-size: 13.5px;
    font-weight: 500;
    color: #444;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
    cursor: default;
    backdrop-filter: blur(6px);
  }
  .ck-pill:hover {
    border-color: rgba(0,0,0,0.15);
    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }
  .ck-pill-icon {
    width: 20px; height: 20px;
    border-radius: 6px;
    display: grid;
    place-items: center;
    font-size: 11px;
    flex-shrink: 0;
  }

  /* ── Stats band ── */
  .ck-band {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 48px;
    padding: 40px 48px;
    margin-top: 40px;
    border-top: 1px solid rgba(0,0,0,0.07);
    border-bottom: 1px solid rgba(0,0,0,0.07);
    background: rgba(255,255,255,0.6);
    backdrop-filter: blur(8px);
  }
  .ck-band-item { text-align: center; }
  .ck-band-num {
    font-family: 'Instrument Serif', serif;
    font-size: 32px;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: #111;
    line-height: 1;
    margin-bottom: 4px;
  }
  .ck-band-label { font-size: 12.5px; color: #999; font-weight: 400; }
  .ck-band-divider { width: 1px; height: 36px; background: rgba(0,0,0,0.08); }

  /* Spinner keyframe */
  @keyframes ck-spin { to { transform: rotate(360deg); } }
  .ck-spin { animation: ck-spin 0.8s linear infinite; }

  @media (max-width: 640px) {
    .ck-band { gap: 24px; padding: 32px 24px; flex-wrap: wrap; }
    .ck-band-divider { display: none; }
  }
`;

const PHRASES = [
  'ads that stop the scroll.',
  'social posts in seconds.',
  'brand visuals that convert.',
  'campaigns at machine speed.',
];

const PILLS = [
  { icon: '✦', bg: '#111',    color: '#fff', label: 'AI Ad Generation' },
  { icon: '◈', bg: '#6366f1', color: '#fff', label: 'Social Content' },
  { icon: '▲', bg: '#f59e0b', color: '#fff', label: 'Brand Design' },
  { icon: '⬡', bg: '#10b981', color: '#fff', label: 'Email Campaigns' },
  { icon: '◉', bg: '#ef4444', color: '#fff', label: 'Video Scripts' },
  { icon: '⬧', bg: '#8b5cf6', color: '#fff', label: 'Analytics' },
];

const AVATARS = [
  { bg: '#6366f1', letter: 'A' },
  { bg: '#10b981', letter: 'B' },
  { bg: '#f59e0b', letter: 'C' },
  { bg: '#ef4444', letter: 'D' },
];

const NAV_SECTIONS = ['creators', 'managers', 'brands', 'pricing'];

export default function Hero() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(null);

  const typedText = useTypewriter(PHRASES, {
    typeSpeed: 55,
    deleteSpeed: 32,
    pauseAfterType: 2000,
    pauseAfterDelete: 380,
  });

  useEffect(() => {
    if (document.getElementById('ck-styles')) return;
    const el = document.createElement('style');
    el.id = 'ck-styles';
    el.textContent = styles;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    setLoadingBtn(sectionId);
    setMobileOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
    setTimeout(() => setLoadingBtn(null), 800);
  };

  const handleLogin = () => {
    setLoadingBtn('login');
    window.location.href = 'https://app.creativeklux.com/';
  };

  const handleStartFree = () => {
    setLoadingBtn('start-free');
    setTimeout(() => { window.location.href = '../pages/pricing'; }, 300);
  };

  const isEmpty = url.trim() === '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEmpty) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    setIsModalOpen(true);
  };

  const Spinner = () => (
    <svg className="ck-spin" width="14" height="14" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25"/>
      <path fill="currentColor" opacity="0.8" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );

  return (
    <>
      <div className="ck-hero ck-bg">
        {/* ── Nav ── */}
        <header>
          <nav className={`ck-nav${isScrolled ? ' scrolled' : ''}`}>
            <Link href="/" className="ck-logo">
              <div className="ck-logo-mark">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="3.5" cy="3.5" r="2.5" fill="white" opacity="0.9"/>
                  <circle cx="10.5" cy="3.5" r="2.5" fill="white" opacity="0.5"/>
                  <circle cx="3.5" cy="10.5" r="2.5" fill="white" opacity="0.5"/>
                  <circle cx="10.5" cy="10.5" r="2.5" fill="white" opacity="0.9"/>
                </svg>
              </div>
              Creative Klux
            </Link>

            <ul className="ck-nav-center">
              {NAV_SECTIONS.map(s => (
                <li key={s}>
                  <button onClick={() => scrollToSection(s)} disabled={loadingBtn === s}>
                    {loadingBtn === s && <Spinner />}
                    For {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                </li>
              ))}
            </ul>

            <div className="ck-nav-actions">
              <button className="ck-btn-ghost" onClick={handleLogin} disabled={loadingBtn === 'login'}>
                {loadingBtn === 'login' ? <Spinner /> : null}
                Login
              </button>
              <button className="ck-btn-cta" onClick={handleStartFree} disabled={loadingBtn === 'start-free'}>
                {loadingBtn === 'start-free' ? <Spinner /> : null}
                Start for free
              </button>
            </div>

            <button className="ck-mobile-toggle" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </nav>

          <div className={`ck-mobile-menu${mobileOpen ? ' open' : ''}`}>
            {NAV_SECTIONS.map(s => (
              <button key={s} className="ck-mobile-link" onClick={() => scrollToSection(s)} disabled={loadingBtn === s}>
                {loadingBtn === s && <Spinner />}
                For {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <div className="ck-mobile-actions">
              <button className="ck-btn-ghost" onClick={handleLogin} disabled={loadingBtn === 'login'}>
                {loadingBtn === 'login' && <Spinner />} Login
              </button>
              <button className="ck-btn-cta" onClick={handleStartFree} disabled={loadingBtn === 'start-free'}>
                {loadingBtn === 'start-free' && <Spinner />} Start for free
              </button>
            </div>
          </div>
        </header>

        {/* ── Hero body ── */}
        <div className="ck-body">
          <div className="ck-eyebrow">
            <div className="ck-eyebrow-dot" />
            AI-powered · URL to creative in seconds
          </div>

          {/* Typewriter headline */}
          <h1 className="ck-h1">
            <span className="ck-h1-static">Now you can make </span>
            <span className="ck-typed-line">
              <span className="ck-typed-text">{typedText}</span>
              <span className="ck-cursor" aria-hidden="true" />
            </span>
          </h1>

          <p className="ck-sub">
            Paste your product URL. Get ads, social posts, and brand designs — tailored to your brand, ready to publish.
          </p>

          <form className="ck-form" onSubmit={handleSubmit}>
            <div className="ck-input-row">
              <svg className="ck-globe" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <input
                type="text"
                className="ck-input"
                placeholder="yourproduct.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                spellCheck={false}
              />
              <button
                type="submit"
                className={`ck-submit ${isEmpty || isLoading ? 'off' : 'on'}`}
                disabled={isEmpty || isLoading}
              >
                {isLoading
                  ? <><Spinner /> Analyzing…</>
                  : <>Get Started <ArrowRight size={13} /></>
                }
              </button>
            </div>
            <div className="ck-form-hint">
              {['No credit card', 'Free to start', 'Export anywhere'].map(t => (
                <span key={t}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {t}
                </span>
              ))}
            </div>
          </form>

          {/* Social proof */}
          <div className="ck-proof">
            <div className="ck-avatars">
              {AVATARS.map((a, i) => (
                <div key={i} className="ck-avatar" style={{ background: a.bg }}>{a.letter}</div>
              ))}
            </div>
            <span className="ck-stars">★★★★★</span>
            <span>Loved by <strong style={{ color: '#111' }}>50,000+</strong> creators</span>
          </div>
        </div>

        {/* Feature pills */}
        <div className="ck-pills">
          {PILLS.map(p => (
            <div key={p.label} className="ck-pill">
              <div className="ck-pill-icon" style={{ background: p.bg, color: p.color }}>{p.icon}</div>
              {p.label}
            </div>
          ))}
        </div>

        {/* Stats band */}
        <div className="ck-band">
          {[
            { num: '50K+',  label: 'Active creators' },
            { num: '10M',   label: 'Assets generated' },
            { num: '4.2s',  label: 'Avg. generation time' },
            { num: '$2.8M', label: 'Creator revenue driven' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <div className="ck-band-item">
                <div className="ck-band-num">{s.num}</div>
                <div className="ck-band-label">{s.label}</div>
              </div>
              {i < arr.length - 1 && <div className="ck-band-divider" />}
            </React.Fragment>
          ))}
        </div> 
      </div>

      <CreativeSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCreative={selectedCreative}
        setSelectedCreative={setSelectedCreative}
      />
    </>
  );
}