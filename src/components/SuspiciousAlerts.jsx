/**
 * Jasoos — SuspiciousAlerts Component
 * Phase 4: High-visibility board for high-risk scam offers.
 */

import React, { useState } from 'react';
import { useInbox } from '../context/InboxContext.jsx';
import {
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Quote,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Individual Scam Alert Card
// ─────────────────────────────────────────────
function ScamCard({ email, analysis, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  const reasons = analysis.risk?.reasons ?? [];
  const evidence = analysis.risk?.evidence ?? [];

  return (
    <div
      id={`scam-card-${email.id}`}
      className="scam-card"
      onClick={() => { onSelect(email.id); }}
    >
      {/* Card Header */}
      <div className="scam-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div className="scam-shield-icon">
            <ShieldAlert size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {analysis.company_name || email.from_name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {email.subject}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span className="badge risk-high" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={11} /> High Risk
          </span>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 6px', borderRadius: '6px' }}
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Scam Indicators Row */}
      <div className="scam-indicators">
        {reasons.slice(0, 3).map((reason, i) => (
          <span key={i} className="scam-indicator-pill">
            ⚠ {reason}
          </span>
        ))}
        {reasons.length > 3 && (
          <span className="scam-indicator-pill" style={{ opacity: 0.6 }}>
            +{reasons.length - 3} more
          </span>
        )}
      </div>

      {/* Evidence Quote (first one visible by default) */}
      {evidence[0] && (
        <div className="scam-evidence">
          <Quote size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
          <span style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>"{evidence[0]}"</span>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="scam-expanded">
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--risk-high-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            All Risk Indicators
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {reasons.map((r, i) => (
              <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--risk-high-text)', fontWeight: 600, marginTop: '1px' }}>•</span>
                {r}
              </li>
            ))}
          </ul>
          {evidence.length > 1 && (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px', marginBottom: '6px' }}>
                Evidence Quotes
              </div>
              {evidence.map((q, i) => (
                <div key={i} className="scam-evidence" style={{ marginTop: '4px' }}>
                  <Quote size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                  <span style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>"{q}"</span>
                </div>
              ))}
            </>
          )}
          <div className="scam-disclaimer">
            ⚖️ AI-assisted risk assessment. Not proof of fraud — exercise due diligence.
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SuspiciousAlerts Board
// ─────────────────────────────────────────────
export default function SuspiciousAlerts() {
  const { rawEmails, analyses, setSelectedEmailId, setActiveFilter } = useInbox();

  const scamAnalyses = analyses.filter(a => a.risk?.level === 'high');

  if (scamAnalyses.length === 0) return null;

  return (
    <section id="section-suspicious-alerts" className="priority-board scam-board">
      {/* Board Header */}
      <div className="priority-board-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="priority-board-icon scam-board-icon">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="priority-board-title" style={{ color: 'var(--risk-high-text)' }}>
              Suspicious Offers Warning Board
            </h2>
            <p className="priority-board-subtitle">
              {scamAnalyses.length} potentially fraudulent recruiter message{scamAnalyses.length !== 1 ? 's' : ''} detected
            </p>
          </div>
        </div>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          onClick={() => setActiveFilter('high_risk')}
        >
          View All →
        </button>
      </div>

      {/* Scam Cards Grid */}
      <div className="scam-cards-grid">
        {scamAnalyses.map(analysis => {
          const email = rawEmails.find(e => e.id === analysis.email_id);
          if (!email) return null;
          return (
            <ScamCard
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
