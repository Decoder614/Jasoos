/**
 * Jasoos — EmailDetailModal Component
 * Phase 5: Full email inspector modal with raw body, AI metadata, risk panel,
 * follow-up details, and manual status override.
 *
 * Props:
 *   emailId  {string|null}  - The email to show (null = modal closed)
 *   onClose  {Function}     - Callback to close the modal
 */

import React, { useEffect, useCallback } from 'react';
import { useInbox } from '../context/InboxContext.jsx';
import { STATUS_LABELS, STATUS_BADGE_CLASS } from '../types/index.js';
import StatusOverrideDropdown from './StatusOverrideDropdown.jsx';
import {
  X,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  User,
  Briefcase,
  Building2,
  Info,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Risk Level Badge
// ─────────────────────────────────────────────
function RiskBadge({ level }) {
  const cfg = {
    high:    { label: 'High Risk',    cls: 'risk-badge-high' },
    medium:  { label: 'Medium Risk',  cls: 'risk-badge-medium' },
    low:     { label: 'Low Risk',     cls: 'risk-badge-low' },
    unknown: { label: 'Unknown',      cls: 'risk-badge-unknown' },
  }[level] ?? { label: level, cls: 'risk-badge-unknown' };

  return <span className={`risk-badge ${cfg.cls}`}>{cfg.label}</span>;
}

// ─────────────────────────────────────────────
// Meta Field
// ─────────────────────────────────────────────
function MetaField({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="modal-meta-field">
      <div className="modal-meta-label">
        <Icon size={12} />
        {label}
      </div>
      <div className="modal-meta-value">{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EmailDetailModal
// ─────────────────────────────────────────────
export default function EmailDetailModal({ emailId, onClose }) {
  const { rawEmails, analyses } = useInbox();

  const email = rawEmails.find(e => e.id === emailId) ?? null;
  const analysis = analyses.find(a => a.email_id === emailId) ?? null;

  // Close on Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!emailId) return;
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [emailId, handleKeyDown]);

  if (!emailId || !email) return null;

  const isHighRisk = analysis?.risk?.level === 'high';
  const hasFollowUp = analysis?.follow_up?.eligible;
  const sourceLabel = analysis?.source === 'live_ai' ? 'Live AI' : analysis?.source === 'cached_demo' ? 'Cached Demo' : null;

  return (
    /* Backdrop */
    <div
      id="email-detail-modal-backdrop"
      className="modal-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Email detail: ${email.subject}`}
    >
      <div className="modal-container glass-panel">

        {/* ── Modal Header ── */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-subject">{email.subject}</div>
            <div className="modal-meta-row-top">
              <span className="modal-from">
                <Mail size={12} />
                {email.from_name} &lt;{email.from_email}&gt;
              </span>
              <span className="modal-date">
                {email.received_at?.replace('T', ' ').substring(0, 16)}
              </span>
              {sourceLabel && (
                <span className="modal-source-badge">
                  {sourceLabel}
                </span>
              )}
            </div>
          </div>
          <button
            id="modal-close-btn"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body: two-column layout ── */}
        <div className="modal-body">

          {/* ── LEFT PANE: Raw Email ── */}
          <div className="modal-left-pane">
            <div className="modal-pane-label">
              <Mail size={13} />
              Raw Email
            </div>
            <div className="modal-email-body">{email.body}</div>
          </div>

          {/* ── RIGHT PANE: AI Analysis ── */}
          <div className="modal-right-pane">

            {/* Status Override Block */}
            <div className="modal-section">
              <div className="modal-pane-label">
                <CheckCircle2 size={13} />
                Status
              </div>
              {analysis ? (
                <div className="modal-status-block">
                  <StatusOverrideDropdown
                    analysis={analysis}
                    emailId={emailId}
                  />
                  {analysis.is_manual_override && (
                    <div className="modal-override-note">
                      AI originally suggested:{' '}
                      <strong>
                        {STATUS_LABELS[analysis.ai_suggested_status] ?? analysis.ai_suggested_status}
                      </strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="modal-no-analysis-note">
                  Run <strong>Analyze Inbox</strong> to classify this email.
                </div>
              )}
            </div>

            {/* AI Metadata */}
            {analysis && (
              <>
                <div className="modal-section">
                  <div className="modal-pane-label">
                    <Briefcase size={13} />
                    Extracted Metadata
                  </div>
                  <div className="modal-meta-grid">
                    <MetaField icon={Building2} label="Company" value={analysis.company_name} />
                    <MetaField icon={Briefcase} label="Role" value={analysis.job_title} />
                    <MetaField icon={User} label="Recruiter" value={analysis.recruiter_name} />
                    <div className="modal-meta-field modal-confidence-field">
                      <div className="modal-meta-label">
                        <Info size={12} />
                        Confidence
                      </div>
                      <div className="modal-confidence-bar-wrap">
                        <div
                          className="modal-confidence-bar"
                          style={{ width: `${(analysis.confidence * 100).toFixed(0)}%` }}
                        />
                        <span className="modal-confidence-label">
                          {(analysis.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {analysis.summary && (
                    <div className="modal-summary">
                      <div className="modal-summary-label">Summary</div>
                      <p className="modal-summary-text">{analysis.summary}</p>
                    </div>
                  )}
                </div>

                {/* Risk Panel */}
                <div className="modal-section">
                  <div className="modal-pane-label">
                    <ShieldAlert size={13} />
                    Risk Assessment
                  </div>

                  <div className={`modal-risk-panel ${isHighRisk ? 'modal-risk-panel-high' : ''}`}>
                    <div className="modal-risk-header">
                      <RiskBadge level={analysis.risk?.level ?? 'unknown'} />
                      {isHighRisk && (
                        <span className="modal-risk-scam-label">
                          <AlertTriangle size={13} />
                          Potential Fraud / Scam Warning
                        </span>
                      )}
                    </div>

                    {analysis.risk?.reasons?.length > 0 && (
                      <div className="modal-risk-reasons">
                        <div className="modal-risk-sublabel">Risk Indicators</div>
                        <ul className="modal-risk-list">
                          {analysis.risk.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.risk?.evidence?.length > 0 && (
                      <div className="modal-risk-evidence">
                        <div className="modal-risk-sublabel">Evidence Quotes</div>
                        {analysis.risk.evidence.map((q, i) => (
                          <blockquote key={i} className="modal-evidence-quote">
                            "{q}"
                          </blockquote>
                        ))}
                      </div>
                    )}

                    {isHighRisk && (
                      <div className="modal-risk-disclaimer">
                        <Info size={11} />
                        AI-assisted risk assessment — not proof of fraud. Always verify independently.
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow-up Panel */}
                <div className="modal-section">
                  <div className="modal-pane-label">
                    <Clock size={13} />
                    Follow-Up Evaluation
                  </div>

                  {hasFollowUp ? (
                    <div className="modal-followup-panel">
                      <div className="modal-followup-header">
                        <Clock size={14} />
                        <span>{analysis.follow_up.days_elapsed} days elapsed — follow-up recommended</span>
                      </div>
                      <p className="modal-followup-suggestion">
                        {analysis.follow_up.action_suggestion}
                      </p>
                      {analysis.follow_up.applied_date && (
                        <div className="modal-followup-date">
                          Applied: {analysis.follow_up.applied_date}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="modal-followup-ok">
                      {analysis.status === 'rejected' || analysis.status === 'offer'
                        ? <><CheckCircle2 size={14} /> No follow-up needed for this status.</>
                        : <><CheckCircle2 size={14} /> Within follow-up window — no action needed yet.</>
                      }
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
