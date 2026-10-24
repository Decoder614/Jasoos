import React, { useState } from 'react';
import sampleEmails from './data/sample_emails.json';
import fallbackAnalysis from './data/fallback_analysis.json';
import { 
  ShieldAlert, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  FileCheck2,
  AlertTriangle,
  Send,
  Calendar
} from 'lucide-react';

export default function App() {
  const [selectedEmail, setSelectedEmail] = useState(sampleEmails[0]);

  // Phase 1 preview statistics
  const totalEmails = sampleEmails.length;
  const totalAnalyses = fallbackAnalysis.length;
  const highRiskCount = fallbackAnalysis.filter(a => a.risk?.level === 'high').length;
  const followUpCount = fallbackAnalysis.filter(a => a.follow_up?.eligible).length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px', width: '100%' }}>
      {/* Top Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '12px', 
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(56, 189, 248, 0.35)',
            fontSize: '22px'
          }}>
            🕵️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Jasoos</h1>
              <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                Phase 1 Scaffolding
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
              Job Hunt Autopilot — Turn inbox chaos into organized clarity & catch recruiter scams.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Demo Reference Date: <strong style={{ color: 'var(--accent-cyan)' }}>2026-10-24</strong>
          </span>
          <button className="btn btn-primary">
            <Sparkles size={16} /> Load Demo Inbox
          </button>
        </div>
      </header>

      {/* Quick Status / Stat Cards Banner */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Sample Emails Loaded</span>
            <Mail size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff' }}>{totalEmails}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            5 Applied · 4 Interview · 3 Rejected · 2 Offer · 6 Review/Scam
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>High-Risk Scam Alerts</span>
            <ShieldAlert size={18} color="var(--risk-high-text)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--risk-high-text)' }}>{highRiskCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Training fee deposit · Telegram redirect · Bank OTP phishing
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Follow-Ups Due (&gt;= 7 Days)</span>
            <Clock size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{followUpCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Google (14d) · Stripe (11d) · Vercel (8d)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Offline Fallback Fixtures</span>
            <FileCheck2 size={18} color="var(--status-interview-text)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--status-interview-text)' }}>{totalAnalyses} / 20</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            100% Precomputed instant demo fail-safe
          </div>
        </div>
      </section>

      {/* Main Inbox & Detail Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(400px, 1.2fr)', gap: '24px' }}>
        {/* Email Feed Column */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '680px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Synthetic Sample Inbox ({sampleEmails.length})</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to inspect</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sampleEmails.map(email => {
              const isSelected = selectedEmail?.id === email.id;
              const analysis = fallbackAnalysis.find(a => a.email_id === email.id);
              const isScam = analysis?.risk?.level === 'high';
              const isFollowUp = analysis?.follow_up?.eligible;

              return (
                <div 
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
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
                    transition: 'all var(--transition-fast)'
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
                      <span className={`badge badge-${analysis.status}`}>
                        {analysis.status.replace('_', ' ')}
                      </span>
                    )}
                    {isScam && (
                      <span className="badge risk-high">
                        <AlertTriangle size={12} /> High Risk
                      </span>
                    )}
                    {isFollowUp && (
                      <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        <Clock size={12} /> Due ({analysis.follow_up.days_elapsed}d)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Email & Fallback Analysis Inspection Column */}
        {selectedEmail && (() => {
          const analysis = fallbackAnalysis.find(a => a.email_id === selectedEmail.id);
          return (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>{selectedEmail.subject}</h2>
                  {analysis && (
                    <span className={`badge badge-${analysis.status}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                      {analysis.status.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div><strong>From:</strong> {selectedEmail.from_name} ({selectedEmail.from_email})</div>
                  <div><strong>Date:</strong> {selectedEmail.received_at}</div>
                </div>
              </div>

              {/* Raw Email Body */}
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Raw Email Body
                </div>
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.3)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '16px', 
                  fontSize: '0.85rem', 
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-main)',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {selectedEmail.body}
                </div>
              </div>

              {/* Precomputed Fallback Analysis Card */}
              {analysis && (
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '18px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} /> Verified Fallback Analysis Fixture
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence: {(analysis.confidence * 100).toFixed(0)}%</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Company</span>
                      <strong style={{ color: '#ffffff' }}>{analysis.company_name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Role / Position</span>
                      <strong style={{ color: '#ffffff' }}>{analysis.job_title || 'N/A'}</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    <strong>Summary:</strong> {analysis.summary}
                  </div>

                  {/* High Risk Alert Banner inside card if applicable */}
                  {analysis.risk?.level === 'high' && (
                    <div style={{ 
                      background: 'var(--risk-high-bg)', 
                      border: '1px solid var(--risk-high-border)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '12px', 
                      marginTop: '10px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--risk-high-text)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                        <ShieldAlert size={16} /> Potential Fraud / Scam Warning
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {analysis.risk.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                      {analysis.risk.evidence?.length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Evidence snippet: "{analysis.risk.evidence[0]}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Follow-up reminder if applicable */}
                  {analysis.follow_up?.eligible && (
                    <div style={{ 
                      background: 'rgba(56, 189, 248, 0.08)', 
                      border: '1px solid rgba(56, 189, 248, 0.25)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '12px', 
                      marginTop: '10px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                        <Clock size={16} /> Follow-Up Recommended ({analysis.follow_up.days_elapsed} Days Elapsed)
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {analysis.follow_up.action_suggestion}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
