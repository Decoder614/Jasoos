/**
 * Jasoos — FollowUpReminders Component
 * Phase 4: 7-day follow-up nudge board for stale applications.
 */

import React from 'react';
import { useInbox } from '../context/InboxContext.jsx';
import { Clock, Calendar, ArrowRight, Send } from 'lucide-react';

// ─────────────────────────────────────────────
// Follow-Up Card
// ─────────────────────────────────────────────
function FollowUpCard({ email, analysis, onSelect }) {
  const fu = analysis.follow_up;
  const daysElapsed = fu?.days_elapsed ?? 0;
  const urgency = daysElapsed >= 14 ? 'overdue' : 'due';

  return (
    <div
      id={`followup-card-${email.id}`}
      className={`followup-card followup-card-${urgency}`}
      onClick={() => onSelect(email.id)}
    >
      {/* Company & Role */}
      <div className="followup-card-top">
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {analysis.company_name || email.from_name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {analysis.job_title || 'Position not specified'}
          </div>
        </div>

        {/* Days badge */}
        <div className={`days-badge days-badge-${urgency}`}>
          <Clock size={13} />
          <span>{daysElapsed}d</span>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="followup-timeline">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={11} />
            Applied: {email.received_at?.split('T')[0]}
          </span>
          <span>{urgency === 'overdue' ? '🔴 Overdue' : '🟡 Due'}</span>
        </div>
        <div className="timeline-bar">
          <div
            className="timeline-fill"
            style={{ width: `${Math.min(100, (daysElapsed / 21) * 100)}%` }}
          />
          <div
            className="timeline-threshold"
            style={{ left: `${(7 / 21) * 100}%` }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Threshold: 7 days
        </div>
      </div>

      {/* Action suggestion */}
      {fu?.action_suggestion && (
        <div className="followup-action">
          <Send size={12} style={{ flexShrink: 0, opacity: 0.7, color: 'var(--accent-blue)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)' }}>
            {fu.action_suggestion}
          </span>
        </div>
      )}

      {/* CTA */}
      <div className="followup-cta">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>View full email</span>
        <ArrowRight size={14} style={{ color: 'var(--accent-blue)' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FollowUpReminders Board
// ─────────────────────────────────────────────
export default function FollowUpReminders() {
  const { rawEmails, analyses, setSelectedEmailId, setActiveFilter } = useInbox();

  const followUpAnalyses = analyses.filter(a => a.follow_up?.eligible);

  if (followUpAnalyses.length === 0) return null;

  const overdueCount = followUpAnalyses.filter(a => (a.follow_up?.days_elapsed ?? 0) >= 14).length;

  return (
    <section id="section-followup-reminders" className="priority-board followup-board">
      {/* Board Header */}
      <div className="priority-board-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="priority-board-icon followup-board-icon">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="priority-board-title">
              7-Day Follow-Up Reminders
            </h2>
            <p className="priority-board-subtitle">
              {followUpAnalyses.length} application{followUpAnalyses.length !== 1 ? 's' : ''} awaiting reply
              {overdueCount > 0 && ` · ${overdueCount} overdue (14+ days)`}
            </p>
          </div>
        </div>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          onClick={() => setActiveFilter('follow_up')}
        >
          View All →
        </button>
      </div>

      {/* Follow-Up Cards Grid */}
      <div className="followup-cards-grid">
        {followUpAnalyses
          .sort((a, b) => (b.follow_up?.days_elapsed ?? 0) - (a.follow_up?.days_elapsed ?? 0))
          .map(analysis => {
            const email = rawEmails.find(e => e.id === analysis.email_id);
            if (!email) return null;
            return (
              <FollowUpCard
                key={analysis.email_id}
                email={email}
                analysis={analysis}
                onSelect={setSelectedEmailId}
              />
            );
          })}
      </div>
    </section>
  );
}
