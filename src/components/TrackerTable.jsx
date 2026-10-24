/**
 * Jasoos — TrackerTable Component
 * Phase 4: Application tracker with card-grid layout, status badges, risk indicators.
 */

import React from 'react';
import { useInbox } from '../context/InboxContext.jsx';
import { STATUS_LABELS, STATUS_BADGE_CLASS } from '../types/index.js';
import {
  AlertTriangle,
  Clock,
  Eye,
  InboxIcon,
  Sparkles,
  Mail,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Risk Indicator Dot
// ─────────────────────────────────────────────
function RiskDot({ level }) {
  const colors = {
    high:    { color: 'var(--risk-high-text)',    bg: 'var(--risk-high-bg)',    label: 'High Risk' },
    medium:  { color: 'var(--risk-medium-text)',  bg: 'var(--risk-medium-bg)',  label: 'Medium' },
    low:     { color: 'var(--risk-low-text)',      bg: 'var(--risk-low-bg)',     label: 'Low Risk' },
    unknown: { color: 'var(--risk-unknown-text)', bg: 'var(--risk-unknown-bg)', label: 'Unknown' },
  };
  const cfg = colors[level] ?? colors.unknown;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        background: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.color}33`,
        borderRadius: '99px', padding: '2px 8px',
        fontSize: '0.72rem', fontWeight: 600,
      }}
    >
      {level === 'high' && <AlertTriangle size={11} />}
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────
// Tracker Row
// ─────────────────────────────────────────────
function TrackerRow({ email, analysis, isSelected, onSelect, onView }) {
  const isScam = analysis?.risk?.level === 'high';
  const isFollowUp = analysis?.follow_up?.eligible;

  return (
    <div
      id={`tracker-row-${email.id}`}
      className={`tracker-row ${isSelected ? 'tracker-row-selected' : ''} ${isScam ? 'tracker-row-scam' : ''}`}
      onClick={() => onSelect(email.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onView(email.id)}
    >
      {/* Company & Role */}
      <div className="tracker-cell tracker-cell-company">
        <div className="tracker-company-name">
          {analysis?.company_name || email.from_name}
          {analysis?.is_manual_override && (
            <span className="override-dot" title="Manual Override">✎</span>
          )}
        </div>
        <div className="tracker-from-email">{email.from_email}</div>
      </div>

      {/* Role */}
      <div className="tracker-cell tracker-cell-role">
        <span className="tracker-role-text">
          {analysis?.job_title || '—'}
        </span>
      </div>

      {/* Status */}
      <div className="tracker-cell tracker-cell-status">
        {analysis ? (
          <span className={`badge ${STATUS_BADGE_CLASS[analysis.status] ?? 'badge-needs_review'}`}>
            {STATUS_LABELS[analysis.status] ?? analysis.status}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
        )}
      </div>

      {/* Date */}
      <div className="tracker-cell tracker-cell-date">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {email.received_at?.split('T')[0]}
        </span>
      </div>

      {/* Risk */}
      <div className="tracker-cell tracker-cell-risk">
        {analysis ? (
          <RiskDot level={analysis.risk?.level ?? 'unknown'} />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
        )}
      </div>

      {/* Follow-up badge */}
      <div className="tracker-cell tracker-cell-flags" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {isFollowUp && (
          <span className="badge" style={{
            background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)',
            border: '1px solid var(--accent-blue-border)', fontSize: '0.7rem',
            display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            <Clock size={10} /> {analysis.follow_up.days_elapsed}d
          </span>
        )}
      </div>

      {/* View btn */}
      <div className="tracker-cell tracker-cell-action">
        <button
          id={`view-btn-${email.id}`}
          className="btn btn-ghost tracker-view-btn"
          onClick={e => { e.stopPropagation(); onView(email.id); }}
          aria-label={`View details for ${analysis?.company_name || email.from_name}`}
        >
          <Eye size={15} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TrackerTable
// ─────────────────────────────────────────────
export default function TrackerTable({ onViewEmail }) {
  const {
    rawEmails,
    analyses,
    filteredAnalyses,
    selectedEmail,
    setSelectedEmailId,
    loadDemoInbox,
    analyzeInbox,
  } = useInbox();

  // Fallback in case prop not provided
  const handleView = onViewEmail ?? setSelectedEmailId;

  const inboxLoaded = rawEmails.length > 0;
  const analysisReady = analyses.length > 0;

  // Build display rows: if analyzed, use filteredAnalyses; else show raw emails without analysis
  const rows = analysisReady
    ? filteredAnalyses
    : rawEmails.map(e => ({ email_id: e.id }));

  return (
    <section id="section-tracker-table" className="tracker-section">
      {/* Section header */}
      <div className="tracker-header">
        <div>
          <h2 className="tracker-title">Application Tracker</h2>
          <p className="tracker-subtitle">
            {analysisReady
              ? `${filteredAnalyses.length} of ${analyses.length} applications`
              : inboxLoaded
                ? `${rawEmails.length} emails loaded — run analysis to classify`
                : 'Load inbox to get started'}
          </p>
        </div>
      </div>

      {/* Table */}
      {!inboxLoaded ? (
        <div className="tracker-empty">
          <InboxIcon size={40} strokeWidth={1.4} />
          <p>No emails loaded yet.</p>
          <button className="btn btn-primary" onClick={loadDemoInbox}>
            <Mail size={16} /> Load Demo Inbox
          </button>
        </div>
      ) : (
        <div className="tracker-table-wrap glass-panel">
          {/* Column Headers */}
          <div className="tracker-col-headers">
            <div className="tracker-col-header">Company / Sender</div>
            <div className="tracker-col-header">Role</div>
            <div className="tracker-col-header">Status</div>
            <div className="tracker-col-header">Received</div>
            <div className="tracker-col-header">Risk</div>
            <div className="tracker-col-header">Flags</div>
            <div className="tracker-col-header" />
          </div>

          {/* Rows */}
          <div className="tracker-rows">
            {rows.length === 0 ? (
              <div className="tracker-empty-row">
                No results match your current filter or search.
              </div>
            ) : (
              rows.map(item => {
                const emailId = item.email_id ?? item.id;
                const email = rawEmails.find(e => e.id === emailId);
                const analysis = analysisReady ? analyses.find(a => a.email_id === emailId) : null;
                if (!email) return null;
                return (
                  <TrackerRow
                    key={email.id}
                    email={email}
                    analysis={analysis}
                    isSelected={selectedEmail?.id === email.id}
                    onSelect={setSelectedEmailId}
                    onView={handleView}
                  />
                );
              })
            )}
          </div>

          {/* Unanalyzed prompt */}
          {inboxLoaded && !analysisReady && (
            <div className="tracker-analyze-prompt">
              <Sparkles size={16} />
              <span>Click <strong>Analyze Inbox</strong> to classify all {rawEmails.length} emails with AI.</span>
              <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => analyzeInbox()}>
                <Sparkles size={14} /> Analyze Now
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
