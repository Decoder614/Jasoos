/**
 * Jasoos — MetricCards Component
 * Phase 4: Dashboard summary metrics with animated counters and status pills.
 */

import React from 'react';
import { useInbox } from '../context/InboxContext.jsx';
import {
  Mail,
  ShieldAlert,
  Clock,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  XCircle,
  Star,
  HelpCircle,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Single Metric Card
// ─────────────────────────────────────────────
function MetricCard({ icon, label, value, subtext, color, glowColor, id }) {
  return (
    <div
      id={id}
      className="glass-panel metric-card"
      style={{ '--glow-color': glowColor }}
    >
      <div className="metric-card-header">
        <span className="metric-card-label">{label}</span>
        <div className="metric-card-icon" style={{ color }}>
          {icon}
        </div>
      </div>
      <div className="metric-card-value" style={{ color }}>
        {value}
      </div>
      {subtext && (
        <div className="metric-card-subtext">{subtext}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Status Breakdown Mini Cards
// ─────────────────────────────────────────────
function StatusBreakdown({ stats }) {
  const items = [
    { label: 'Applied', count: stats.applied, icon: <Briefcase size={14} />, color: 'var(--status-applied-text)', bg: 'var(--status-applied-bg)', border: 'var(--status-applied-border)' },
    { label: 'Interview', count: stats.interview, icon: <CheckCircle2 size={14} />, color: 'var(--status-interview-text)', bg: 'var(--status-interview-bg)', border: 'var(--status-interview-border)' },
    { label: 'Offer', count: stats.offer, icon: <Star size={14} />, color: 'var(--status-offer-text)', bg: 'var(--status-offer-bg)', border: 'var(--status-offer-border)' },
    { label: 'Rejected', count: stats.rejected, icon: <XCircle size={14} />, color: 'var(--status-rejected-text)', bg: 'var(--status-rejected-bg)', border: 'var(--status-rejected-border)' },
    { label: 'Review', count: stats.needs_review, icon: <HelpCircle size={14} />, color: 'var(--status-review-text)', bg: 'var(--status-review-bg)', border: 'var(--status-review-border)' },
  ];

  return (
    <div className="status-breakdown-row">
      {items.map(({ label, count, icon, color, bg, border }) => (
        <div
          key={label}
          className="status-mini-card"
          style={{ '--status-color': color, '--status-bg': bg, '--status-border': border }}
        >
          <div className="status-mini-icon" style={{ color }}>{icon}</div>
          <div className="status-mini-count" style={{ color }}>{count}</div>
          <div className="status-mini-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MetricCards Section
// ─────────────────────────────────────────────
export default function MetricCards() {
  const { rawEmails, analyses, stats, analysisSource } = useInbox();

  const inboxLoaded = rawEmails.length > 0;
  const analysisReady = analyses.length > 0;

  return (
    <section className="metrics-section">
      {/* Primary Metric Cards */}
      <div className="metrics-grid">
        <MetricCard
          id="metric-total"
          icon={<Mail size={20} />}
          label="Emails Analyzed"
          value={analysisReady ? stats.total : (inboxLoaded ? rawEmails.length : '—')}
          subtext={inboxLoaded ? (analysisReady ? 'AI-analyzed · source: ' + (analysisSource === 'live_ai' ? 'Live Gemini' : 'Cached Demo') : 'Ready to analyze') : 'Click "Load Demo Inbox"'}
          color="var(--accent-cyan)"
          glowColor="rgba(56,189,248,0.2)"
        />

        <MetricCard
          id="metric-scams"
          icon={<ShieldAlert size={20} />}
          label="High-Risk Scams"
          value={analysisReady ? stats.high_risk : '—'}
          subtext={analysisReady ? 'Training fees · Telegram · OTP phishing' : 'Run analysis to detect'}
          color={analysisReady && stats.high_risk > 0 ? 'var(--risk-high-text)' : 'var(--text-muted)'}
          glowColor="rgba(239,68,68,0.15)"
        />

        <MetricCard
          id="metric-followups"
          icon={<Clock size={20} />}
          label="Follow-Ups Due"
          value={analysisReady ? stats.follow_ups_due : '—'}
          subtext={analysisReady ? `Applications awaiting reply ≥ 7 days` : 'Run analysis to check'}
          color={analysisReady && stats.follow_ups_due > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)'}
          glowColor="rgba(56,189,248,0.15)"
        />

        <MetricCard
          id="metric-pipeline"
          icon={<TrendingUp size={20} />}
          label="Active Pipeline"
          value={analysisReady ? (stats.applied + stats.interview) : '—'}
          subtext={analysisReady ? `${stats.applied} applied · ${stats.interview} interviews` : 'Run analysis to view'}
          color="var(--status-interview-text)"
          glowColor="rgba(16,185,129,0.15)"
        />
      </div>

      {/* Status Breakdown Pills */}
      {analysisReady && <StatusBreakdown stats={stats} />}
    </section>
  );
}
