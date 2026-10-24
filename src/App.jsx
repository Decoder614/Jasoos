import React from 'react';
import { useInbox } from './context/InboxContext.jsx';
import { STATUS_LABELS, STATUS_BADGE_CLASS } from './types/index.js';
import {
  ShieldAlert,
  Mail,
  Clock,
  CheckCircle2,
  Sparkles,
  FileCheck2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  InboxIcon,
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
// Email List Item
// ─────────────────────────────────────────────
function EmailListItem({ email, analysis, isSelected, onClick }) {
  const isScam = analysis?.risk?.level === 'high';
  const isFollowUp = analysis?.follow_up?.eligible;

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: isSelected ? 'var(--bg-card-hover)' : 'rgba(255, 255, 255, 0.02)',
        border: isSelected
          ? '1px solid var(--accent-cyan)'
          : isScam
            ? '1px solid var(--border-danger)'
            : '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>{email.from_name}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {email.received_at.split('T')[0]}
        </span>
      </div>
      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {email.subject}
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        {analysis && (
          <span className={`badge ${STATUS_BADGE_CLASS[analysis.status] ?? 'badge-needs_review'}`}>
            {STATUS_LABELS[analysis.status] ?? analysis.status}
          </span>
        )}
        {analysis?.is_manual_override && (
          <span className="badge" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', fontSize: '0.68rem' }}>
            Override
          </span>
        )}
        {isScam && (
          <span className="badge risk-high" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <AlertTriangle size={11} /> High Risk
          </span>
        )}
        {isFollowUp && (
          <span className="badge" style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={11} /> Due ({analysis.follow_up.days_elapsed}d)
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Detail Pane
// ─────────────────────────────────────────────
function DetailPane({ email, analysis }) {
  if (!email) {
    return (
      <div className="glass-panel" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)' }}>
        <InboxIcon size={36} strokeWidth={1.5} />
        <p style={{ fontSize: '0.9rem' }}>Select an email to inspect</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.4 }}>{email.subject}</h2>
          {analysis && (
            <span className={`badge ${STATUS_BADGE_CLASS[analysis.status] ?? 'badge-needs_review'}`} style={{ fontSize: '0.8rem', padding: '4px 12px', flexShrink: 0 }}>
              {STATUS_LABELS[analysis.status] ?? analysis.status}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div><strong>From:</strong> {email.from_name} ({email.from_email})</div>
          <div><strong>Date:</strong> {email.received_at.replace('T', ' ').substring(0, 16)}</div>
        </div>
      </div>

      {/* Raw Email Body */}
      <div>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Raw Email Body
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '0.85rem',
          lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-main)',
          maxHeight: '200px', overflowY: 'auto',
        }}>
          {email.body}
        </div>
      </div>

      {/* Analysis */}
      {analysis ? (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} />
              {analysis.source === 'cached_demo' ? 'Cached Demo Analysis' : analysis.source === 'live_ai' ? 'Live AI Analysis' : 'Analysis'}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Confidence: {(analysis.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.73rem' }}>Company</span>
              <strong style={{ color: '#ffffff' }}>{analysis.company_name || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.73rem' }}>Role / Position</span>
              <strong style={{ color: '#ffffff' }}>{analysis.job_title || 'N/A'}</strong>
            </div>
            {analysis.recruiter_name && (
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.73rem' }}>Recruiter</span>
                <strong style={{ color: '#ffffff' }}>{analysis.recruiter_name}</strong>
              </div>
            )}
          </div>

          {analysis.summary && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <strong>Summary:</strong> {analysis.summary}
            </div>
          )}

          {/* Manual override badge */}
          {analysis.is_manual_override && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#c084fc', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '6px', padding: '4px 10px', marginBottom: '10px' }}>
              ✎ Manual Override — AI suggested: <strong>{STATUS_LABELS[analysis.ai_suggested_status] ?? analysis.ai_suggested_status}</strong>
            </div>
          )}

          {/* High Risk Banner */}
          {analysis.risk?.level === 'high' && (
            <div style={{ background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', borderRadius: 'var(--radius-sm)', padding: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--risk-high-text)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                <ShieldAlert size={16} /> Potential Fraud / Scam Warning
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {analysis.risk.reasons?.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
              {analysis.risk.evidence?.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Evidence: "{analysis.risk.evidence[0]}"
                </div>
              )}
            </div>
          )}

          {/* Follow-up Reminder */}
          {analysis.follow_up?.eligible && (
            <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 'var(--radius-sm)', padding: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                <Clock size={16} /> Follow-Up Recommended ({analysis.follow_up.days_elapsed} Days Elapsed)
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {analysis.follow_up.action_suggestion}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No analysis yet — click <strong>Analyze Inbox</strong> to process emails.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// App Root
// ─────────────────────────────────────────────
export default function App() {
  const {
    rawEmails,
    analyses,
    stats,
    filteredAnalyses,
    activeFilter,
    searchQuery,
    isAnalyzing,
    progress,
    analysisSource,
    selectedEmail,
    selectedAnalysis,
    setSelectedEmailId,
    setActiveFilter,
    setSearchQuery,
    loadDemoInbox,
    analyzeWithFallback,
    resetDemo,
  } = useInbox();

  const inboxLoaded = rawEmails.length > 0;
  const analysisReady = analyses.length > 0;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px', width: '100%' }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '32px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'var(--primary-gradient)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(56,189,248,0.35)', fontSize: '22px',
          }}>
            🕵️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Jasoos</h1>
              <span className="badge" style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(56,189,248,0.3)' }}>
                Phase 2
              </span>
              {analysisSource && (
                <span className="badge" style={{
                  background: analysisSource === 'live_ai' ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.15)',
                  color: analysisSource === 'live_ai' ? '#4ade80' : '#c084fc',
                  border: `1px solid ${analysisSource === 'live_ai' ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.3)'}`,
                }}>
                  {analysisSource === 'live_ai' ? '⚡ Live AI' : '📦 Cached Demo'}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
              Job Hunt Autopilot — Organise applications, catch scams, track follow-ups.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Demo ref: <strong style={{ color: 'var(--accent-cyan)' }}>2026-10-24</strong>
          </span>

          {isAnalyzing && <ProgressBar current={progress.current} total={progress.total} />}

          {!inboxLoaded && !isAnalyzing && (
            <button className="btn btn-primary" onClick={loadDemoInbox}>
              <Mail size={16} /> Load Demo Inbox
            </button>
          )}

          {inboxLoaded && !isAnalyzing && (
            <button className="btn btn-primary" onClick={analyzeWithFallback} disabled={isAnalyzing}>
              {isAnalyzing
                ? <><Loader2 size={16} className="spin" /> Analyzing…</>
                : <><Sparkles size={16} /> {analysisReady ? 'Re-Analyze' : 'Analyze Inbox'}</>
              }
            </button>
          )}

          {(inboxLoaded || analysisReady) && (
            <button className="btn btn-secondary" onClick={resetDemo} style={{ gap: '6px' }}>
              <RotateCcw size={15} /> Reset
            </button>
          )}
        </div>
      </header>

      {/* ── Stat Cards ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Emails Loaded</span>
            <Mail size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff' }}>{rawEmails.length || '—'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {inboxLoaded ? '20 synthetic sample emails' : 'Click "Load Demo Inbox"'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>High-Risk Scams</span>
            <ShieldAlert size={18} color="var(--risk-high-text)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: analysisReady ? 'var(--risk-high-text)' : 'var(--text-muted)' }}>
            {analysisReady ? stats.high_risk : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Training fee · Telegram redirect · OTP phishing
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Follow-Ups Due</span>
            <Clock size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: analysisReady ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
            {analysisReady ? stats.follow_ups_due : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Applications awaiting reply ≥ 7 days
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Fallback Fixtures</span>
            <FileCheck2 size={18} color="var(--status-interview-text)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--status-interview-text)' }}>20 / 20</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            100% precomputed — instant demo fail-safe
          </div>
        </div>
      </section>

      {/* ── Status Breakdown (only when analysis ready) ── */}
      {analysisReady && (
        <section style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {[
            { key: 'all',          label: `All (${stats.total})` },
            { key: 'applied',      label: `Applied (${stats.applied})` },
            { key: 'interview',    label: `Interview (${stats.interview})` },
            { key: 'offer',        label: `Offer (${stats.offer})` },
            { key: 'rejected',     label: `Rejected (${stats.rejected})` },
            { key: 'needs_review', label: `Needs Review (${stats.needs_review})` },
            { key: 'high_risk',    label: `⚠ High Risk (${stats.high_risk})` },
            { key: 'follow_up',    label: `⏰ Follow-Up (${stats.follow_ups_due})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`badge ${activeFilter === key ? 'badge-applied' : ''}`}
              style={{
                cursor: 'pointer',
                border: activeFilter === key ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: activeFilter === key ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                color: activeFilter === key ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                padding: '6px 14px',
                borderRadius: '99px',
                fontSize: '0.8rem',
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}

          <input
            type="text"
            placeholder="Search company, role, subject…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              borderRadius: '99px',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              outline: 'none',
              minWidth: '220px',
            }}
          />
        </section>
      )}

      {/* ── Main Split View ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(380px, 1.3fr)', gap: '24px' }}>
        {/* Email List */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '680px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              {inboxLoaded
                ? `Inbox (${analysisReady ? filteredAnalyses.length + ' shown / ' : ''}${rawEmails.length} total)`
                : 'Inbox'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to inspect</span>
          </div>

          {!inboxLoaded ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', color: 'var(--text-muted)', padding: '40px 0' }}>
              <InboxIcon size={36} strokeWidth={1.5} />
              <p style={{ fontSize: '0.875rem' }}>No emails loaded yet</p>
              <button className="btn btn-primary" onClick={loadDemoInbox} style={{ fontSize: '0.85rem' }}>
                <Mail size={15} /> Load Demo Inbox
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(analysisReady ? filteredAnalyses : analyses.length ? filteredAnalyses : rawEmails.map(e => ({ email_id: e.id }))).map(item => {
                const emailId = item.email_id ?? item.id;
                const email = rawEmails.find(e => e.id === emailId);
                const analysis = analyses.find(a => a.email_id === emailId);
                if (!email) return null;
                return (
                  <EmailListItem
                    key={email.id}
                    email={email}
                    analysis={analysis}
                    isSelected={selectedEmail?.id === email.id}
                    onClick={() => setSelectedEmailId(email.id)}
                  />
                );
              })}
              {analysisReady && filteredAnalyses.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: '0.875rem' }}>
                  No emails match your current filter.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Pane */}
        <DetailPane email={selectedEmail} analysis={selectedAnalysis} />
      </div>
    </div>
  );
}
