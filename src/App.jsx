/**
 * Jasoos — App Root
 * Phase 4: High-impact dashboard with metric cards, priority boards, and tracker table.
 */

import React from 'react';
import { useInbox } from './context/InboxContext.jsx';
import Header from './components/Header.jsx';
import MetricCards from './components/MetricCards.jsx';
import SuspiciousAlerts from './components/SuspiciousAlerts.jsx';
import FollowUpReminders from './components/FollowUpReminders.jsx';
import FilterBar from './components/FilterBar.jsx';
import TrackerTable from './components/TrackerTable.jsx';
import { STATUS_LABELS, STATUS_BADGE_CLASS } from './types/index.js';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  InboxIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Detail Pane (right panel — email inspector)
// ─────────────────────────────────────────────
function DetailPane({ email, analysis }) {
  if (!email) {
    return (
      <div className="glass-panel detail-pane detail-pane-empty">
        <InboxIcon size={36} strokeWidth={1.5} />
        <p style={{ fontSize: '0.9rem' }}>Select an email from the tracker to inspect</p>
      </div>
    );
  }

  return (
    <div className="glass-panel detail-pane">
      {/* Header */}
      <div className="detail-pane-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.4, flex: 1 }}>
            {email.subject}
          </h2>
          {analysis && (
            <span
              className={`badge ${STATUS_BADGE_CLASS[analysis.status] ?? 'badge-needs_review'}`}
              style={{ fontSize: '0.78rem', padding: '3px 10px', flexShrink: 0, marginLeft: '12px' }}
            >
              {STATUS_LABELS[analysis.status] ?? analysis.status}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div><strong>From:</strong> {email.from_name} ({email.from_email})</div>
          <div><strong>Date:</strong> {email.received_at.replace('T', ' ').substring(0, 16)}</div>
        </div>
      </div>

      {/* Raw Email Body */}
      <div>
        <div className="detail-section-label">Raw Email Body</div>
        <div className="detail-email-body">{email.body}</div>
      </div>

      {/* Analysis Block */}
      {analysis ? (
        <div className="detail-analysis-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} />
              {analysis.source === 'cached_demo' ? 'Cached Analysis' : analysis.source === 'live_ai' ? 'Live AI Analysis' : 'Analysis'}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {(analysis.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.83rem', marginBottom: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Company</span>
              <strong style={{ color: '#ffffff' }}>{analysis.company_name || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Role</span>
              <strong style={{ color: '#ffffff' }}>{analysis.job_title || 'N/A'}</strong>
            </div>
            {analysis.recruiter_name && (
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Recruiter</span>
                <strong style={{ color: '#ffffff' }}>{analysis.recruiter_name}</strong>
              </div>
            )}
          </div>

          {analysis.summary && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
              <strong>Summary:</strong> {analysis.summary}
            </div>
          )}

          {/* Manual override badge */}
          {analysis.is_manual_override && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#c084fc', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '6px', padding: '4px 10px', marginBottom: '10px' }}>
              ✎ Manual Override — AI suggested: <strong>{STATUS_LABELS[analysis.ai_suggested_status] ?? analysis.ai_suggested_status}</strong>
            </div>
          )}

          {/* High Risk Banner */}
          {analysis.risk?.level === 'high' && (
            <div className="detail-risk-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--risk-high-text)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                <ShieldAlert size={15} /> Potential Fraud / Scam Warning
              </div>
              <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {analysis.risk.reasons?.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
              {analysis.risk.evidence?.[0] && (
                <div style={{ marginTop: '8px', fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Evidence: "{analysis.risk.evidence[0]}"
                </div>
              )}
            </div>
          )}

          {/* Follow-up Reminder */}
          {analysis.follow_up?.eligible && (
            <div className="detail-followup-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                <Clock size={15} /> Follow-Up Recommended ({analysis.follow_up.days_elapsed} Days Elapsed)
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
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
    analyses,
    selectedEmail,
    selectedAnalysis,
  } = useInbox();

  const analysisReady = analyses.length > 0;

  return (
    <div className="app-root">
      {/* ── Header ── */}
      <Header />

      {/* ── Metric Cards ── */}
      <MetricCards />

      {/* ── Priority Boards (only when analysis ready) ── */}
      {analysisReady && (
        <div className="priority-boards-row">
          <SuspiciousAlerts />
          <FollowUpReminders />
        </div>
      )}

      {/* ── Filter Bar (only when analysis ready) ── */}
      {analysisReady && <FilterBar />}

      {/* ── Main Content: Tracker + Detail Pane ── */}
      <div className="main-content-grid">
        {/* Tracker Table (left / main column) */}
        <div className="tracker-column">
          <TrackerTable />
        </div>

        {/* Detail Pane (right / inspector panel) */}
        <aside className="detail-column">
          <DetailPane email={selectedEmail} analysis={selectedAnalysis} />
        </aside>
      </div>
    </div>
  );
}
