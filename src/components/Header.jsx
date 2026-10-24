/**
 * Jasoos — Header Component
 * Phase 4: App branding bar with actions, progress, and mode badges.
 */

import React from 'react';
import { useInbox } from '../context/InboxContext.jsx';
import {
  Mail,
  Sparkles,
  RotateCcw,
  Loader2,
  Zap,
  Package,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────
function ProgressBar({ current, total }) {
  if (!total) return null;
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
      <div style={{
        flex: 1, height: '6px', borderRadius: '99px',
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--primary-gradient)',
          borderRadius: '99px',
          transition: 'width 0.15s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {current} / {total}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────
export default function Header() {
  const {
    rawEmails,
    analyses,
    isAnalyzing,
    progress,
    analysisSource,
    isLiveModeAvailable,
    analysisMode,
    setAnalysisMode,
    loadDemoInbox,
    analyzeInbox,
    analyzeWithFallback,
    resetDemo,
  } = useInbox();

  const inboxLoaded = rawEmails.length > 0;
  const analysisReady = analyses.length > 0;

  return (
    <header className="jasoos-header">
      {/* ── Branding ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="header-logo">🕵️</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Jasoos
            </h1>
            <span className="badge phase-badge">Phase 4</span>
            {analysisSource && (
              <span
                className="badge"
                style={{
                  background: analysisSource === 'live_ai' ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.15)',
                  color: analysisSource === 'live_ai' ? '#4ade80' : '#c084fc',
                  border: `1px solid ${analysisSource === 'live_ai' ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.3)'}`,
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                {analysisSource === 'live_ai'
                  ? <><Zap size={11} /> Live AI</>
                  : <><Package size={11} /> Cached Demo</>}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Job Hunt Autopilot — Organise applications, catch scams, track follow-ups.
          </p>
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Demo ref date */}
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Demo ref: <strong style={{ color: 'var(--accent-cyan)' }}>2026-10-24</strong>
        </span>

        {/* Mode toggle */}
        {inboxLoaded && (
          <div className="mode-toggle">
            <button
              id="mode-btn-cached"
              className={`mode-btn ${analysisMode !== 'live_ai' ? 'mode-btn-active' : ''}`}
              onClick={() => setAnalysisMode('cached_demo')}
            >
              <Package size={12} /> Cached
            </button>
            <button
              id="mode-btn-live"
              className={`mode-btn ${analysisMode === 'live_ai' ? 'mode-btn-active' : ''}`}
              onClick={() => setAnalysisMode('live_ai')}
              disabled={!isLiveModeAvailable}
              title={!isLiveModeAvailable ? 'VITE_GEMINI_API_KEY not set' : 'Use live Gemini AI'}
            >
              <Zap size={12} /> Live AI
            </button>
          </div>
        )}

        {/* Progress bar */}
        {isAnalyzing && <ProgressBar current={progress.current} total={progress.total} />}

        {/* Load inbox */}
        {!inboxLoaded && !isAnalyzing && (
          <button id="btn-load-inbox" className="btn btn-primary" onClick={loadDemoInbox}>
            <Mail size={16} /> Load Demo Inbox
          </button>
        )}

        {/* Analyze */}
        {inboxLoaded && !isAnalyzing && (
          <button
            id="btn-analyze"
            className="btn btn-primary"
            onClick={() => analyzeInbox()}
            disabled={isAnalyzing}
          >
            {isAnalyzing
              ? <><Loader2 size={16} className="spin" /> Analyzing…</>
              : <><Sparkles size={16} /> {analysisReady ? 'Re-Analyze' : 'Analyze Inbox'}</>}
          </button>
        )}

        {/* Reset */}
        {(inboxLoaded || analysisReady) && (
          <button id="btn-reset" className="btn btn-secondary" onClick={resetDemo}>
            <RotateCcw size={15} /> Reset
          </button>
        )}
      </div>
    </header>
  );
}
