/**
 * Jasoos — StatusOverrideDropdown Component
 * Phase 5: Manual status override with reset-to-AI capability.
 *
 * Props:
 *   analysis     {EmailAnalysis}  - The current analysis object
 *   emailId      {string}         - The email ID to override
 */

import React, { useState, useRef, useEffect } from 'react';
import { useInbox } from '../context/InboxContext.jsx';
import { STATUS, STATUS_LABELS, STATUS_BADGE_CLASS } from '../types/index.js';
import { ChevronDown, RotateCcw, CheckCircle2 } from 'lucide-react';

// ─────────────────────────────────────────────
// Status option config
// ─────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: STATUS.APPLIED,      label: STATUS_LABELS[STATUS.APPLIED],      icon: '📨' },
  { value: STATUS.INTERVIEW,    label: STATUS_LABELS[STATUS.INTERVIEW],    icon: '🎯' },
  { value: STATUS.OFFER,        label: STATUS_LABELS[STATUS.OFFER],        icon: '🏆' },
  { value: STATUS.REJECTED,     label: STATUS_LABELS[STATUS.REJECTED],     icon: '❌' },
  { value: STATUS.NEEDS_REVIEW, label: STATUS_LABELS[STATUS.NEEDS_REVIEW], icon: '🔍' },
];

// ─────────────────────────────────────────────
// StatusOverrideDropdown
// ─────────────────────────────────────────────
export default function StatusOverrideDropdown({ analysis, emailId }) {
  const { overrideStatus, resetOverride } = useInbox();
  const [open, setOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const dropdownRef = useRef(null);

  const currentStatus = analysis?.status;
  const isManualOverride = analysis?.is_manual_override;
  const aiStatus = analysis?.ai_suggested_status;

  // Close on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  function handleSelect(newStatus) {
    if (newStatus === currentStatus) {
      setOpen(false);
      return;
    }
    overrideStatus(emailId, newStatus);
    setOpen(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  }

  function handleReset(e) {
    e.stopPropagation();
    resetOverride(emailId);
    setOpen(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  }

  const badgeClass = STATUS_BADGE_CLASS[currentStatus] ?? 'badge-needs_review';
  const currentLabel = STATUS_LABELS[currentStatus] ?? currentStatus;

  return (
    <div className="override-dropdown-wrap" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id={`override-btn-${emailId}`}
        className={`override-trigger btn ${badgeClass}`}
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Click to manually change status"
      >
        <span>{currentLabel}</span>
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease', flexShrink: 0 }} />
      </button>

      {/* Saved Flash */}
      {justSaved && (
        <span className="override-saved-flash">
          <CheckCircle2 size={12} /> Saved
        </span>
      )}

      {/* Dropdown Menu */}
      {open && (
        <div className="override-dropdown-menu glass-panel" role="listbox" aria-label="Select status">
          <div className="override-dropdown-label">Override Status</div>

          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              role="option"
              aria-selected={currentStatus === opt.value}
              className={`override-option ${currentStatus === opt.value ? 'override-option-active' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              <span className="override-option-icon">{opt.icon}</span>
              <span className="override-option-label">{opt.label}</span>
              {currentStatus === opt.value && <CheckCircle2 size={13} style={{ marginLeft: 'auto', color: 'var(--accent-cyan)' }} />}
            </button>
          ))}

          {/* Reset to AI */}
          {isManualOverride && aiStatus && aiStatus !== currentStatus && (
            <>
              <div className="override-dropdown-divider" />
              <button className="override-reset-btn" onClick={handleReset}>
                <RotateCcw size={13} />
                Reset to AI Suggestion ({STATUS_LABELS[aiStatus] ?? aiStatus})
              </button>
            </>
          )}
        </div>
      )}

      {/* Manual Override Tag */}
      {isManualOverride && (
        <span className="override-manual-tag" title={`AI suggested: ${STATUS_LABELS[aiStatus] ?? aiStatus}`}>
          ✎ Manual
        </span>
      )}
    </div>
  );
}
