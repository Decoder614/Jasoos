/**
 * Jasoos — Inbox Context / Global Store
 * Phase 2: React Context providing all inbox state and actions to the app.
 *
 * State managed here:
 *   rawEmails        — The 20 synthetic sample emails (loaded on demand)
 *   analyses         — EmailAnalysis[] from cached demo or live AI
 *   activeFilter     — Current status filter pill selection
 *   searchQuery      — Live search string
 *   isAnalyzing      — True while analysis is in progress
 *   progress         — { current, total } for the progress bar
 *   analysisSource   — 'live_ai' | 'cached_demo' | null
 *
 * LocalStorage keys:
 *   jasoos_overrides — Map<email_id, { status, is_manual_override }>
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import sampleEmails from '../data/sample_emails.json';
import fallbackAnalysis from '../data/fallback_analysis.json';
import { STATUS, STATUS_VALUES, RISK_LEVEL, ANALYSIS_SOURCE, computeDashboardStats } from '../types/index.js';
import { getFollowUpsDue, computeFollowUp } from '../utils/followUpCalculator.js';
import { runAnalysis, isLiveModeAvailable } from '../services/analysisRunner.js';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const LS_OVERRIDES_KEY = 'jasoos_overrides';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Load manual overrides from LocalStorage. Returns a plain object keyed by email_id. */
function loadOverrides() {
  try {
    const raw = localStorage.getItem(LS_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Persist overrides map to LocalStorage. */
function saveOverrides(overrides) {
  try {
    localStorage.setItem(LS_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // Storage quota exceeded or private browsing — silently ignore
  }
}

/**
 * Apply user manual overrides on top of base analyses.
 * @param {import('../types/index.js').EmailAnalysis[]} baseAnalyses
 * @param {Object} overrides  - Map of email_id → { status }
 * @param {import('../types/index.js').EmailRecord[]} emails
 * @returns {import('../types/index.js').EmailAnalysis[]}
 */
function applyOverrides(baseAnalyses, overrides, emails) {
  if (!Object.keys(overrides).length) return baseAnalyses;

  return baseAnalyses.map(a => {
    const override = overrides[a.email_id];
    if (!override) return a;

    const email = emails.find(e => e.id === a.email_id);
    const merged = {
      ...a,
      status: override.status,
      is_manual_override: true,
      ai_suggested_status: a.ai_suggested_status ?? a.status,
    };

    // Recompute follow-up based on the new (overridden) status
    if (email) {
      merged.follow_up = computeFollowUp(merged, email);
    }

    return merged;
  });
}

// ─────────────────────────────────────────────
// Context definition
// ─────────────────────────────────────────────

const InboxContext = createContext(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function InboxProvider({ children }) {
  // ── Core state ──────────────────────────────
  const [rawEmails, setRawEmails] = useState([]);
  const [baseAnalyses, setBaseAnalyses] = useState([]); // AI / cached — no overrides
  const [overrides, setOverrides] = useState(loadOverrides);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | STATUS_VALUES | 'high_risk' | 'follow_up'
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [analysisSource, setAnalysisSource] = useState(null); // ANALYSIS_SOURCE value | null
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  // 'auto' | 'live_ai' | 'cached_demo' — user-selectable mode toggle
  const [analysisMode, setAnalysisMode] = useState('auto');

  // ── Derived: analyses with overrides applied ─
  const analyses = useMemo(
    () => applyOverrides(baseAnalyses, overrides, rawEmails),
    [baseAnalyses, overrides, rawEmails]
  );

  // ── Derived: dashboard stats ─────────────────
  const stats = useMemo(() => computeDashboardStats(analyses), [analyses]);

  // ── Derived: follow-ups due ──────────────────
  const followUpsDue = useMemo(
    () => getFollowUpsDue(analyses, rawEmails),
    [analyses, rawEmails]
  );

  // ── Derived: filtered + searched list ────────
  const filteredAnalyses = useMemo(() => {
    let list = analyses;

    // Filter by active pill
    if (activeFilter === 'high_risk') {
      list = list.filter(a => a.risk?.level === RISK_LEVEL.HIGH);
    } else if (activeFilter === 'follow_up') {
      list = list.filter(a => a.follow_up?.eligible);
    } else if (STATUS_VALUES.includes(activeFilter)) {
      list = list.filter(a => a.status === activeFilter);
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(a => {
        const email = rawEmails.find(e => e.id === a.email_id);
        return (
          a.company_name?.toLowerCase().includes(q) ||
          a.job_title?.toLowerCase().includes(q) ||
          email?.subject?.toLowerCase().includes(q) ||
          email?.from_name?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [analyses, rawEmails, activeFilter, searchQuery]);

  // ── Derived: selected email & its analysis ───
  const selectedEmail = useMemo(
    () => rawEmails.find(e => e.id === selectedEmailId) ?? null,
    [rawEmails, selectedEmailId]
  );

  const selectedAnalysis = useMemo(
    () => analyses.find(a => a.email_id === selectedEmailId) ?? null,
    [analyses, selectedEmailId]
  );

  // ── Actions ──────────────────────────────────

  /**
   * Load the 20 sample emails into state. Selects the first by default.
   */
  const loadDemoInbox = useCallback(() => {
    setRawEmails(sampleEmails);
    setSelectedEmailId(sampleEmails[0]?.id ?? null);
  }, []);

  /**
   * Run inbox analysis via the Phase 3 analysis runner.
   * Automatically selects live_ai or cached_demo mode based on:
   *   - `analysisMode` state ('auto' | 'live_ai' | 'cached_demo')
   *   - Presence of VITE_GEMINI_API_KEY environment variable
   * Falls back to cached_demo if live mode fails or key is absent.
   *
   * @param {{ forceMode?: 'live_ai' | 'cached_demo' }} [opts]
   */
  const analyzeInbox = useCallback(async (opts = {}) => {
    // Auto-load inbox if not already loaded
    const emails = rawEmails.length ? rawEmails : sampleEmails;
    if (!rawEmails.length) setRawEmails(sampleEmails);

    // Reset previous results
    setBaseAnalyses([]);

    // Resolve the forced mode: explicit arg > state setting > 'auto'
    const forceMode = opts.forceMode
      ?? (analysisMode !== 'auto' ? analysisMode : undefined);

    const callbacks = {
      setIsAnalyzing,
      setProgress,
      setBaseAnalyses,
      setAnalysisSource,
    };

    await runAnalysis(emails, callbacks, { forceMode });

    // Select the first email if none selected
    setSelectedEmailId(prev => prev ?? (emails[0]?.id ?? null));
  }, [rawEmails, analysisMode]);

  /**
   * Convenience alias: force cached demo mode regardless of API key.
   * Kept for backwards compatibility with any existing callers.
   */
  const analyzeWithFallback = useCallback(
    () => analyzeInbox({ forceMode: 'cached_demo' }),
    [analyzeInbox]
  );

  /**
   * Override the status for a specific email.
   * The change is persisted to LocalStorage immediately.
   *
   * @param {string} emailId
   * @param {string} newStatus - A STATUS enum value
   */
  const overrideStatus = useCallback((emailId, newStatus) => {
    setOverrides(prev => {
      const next = { ...prev, [emailId]: { status: newStatus } };
      saveOverrides(next);
      return next;
    });
  }, []);

  /**
   * Reset the manual override for a specific email back to AI suggestion.
   * @param {string} emailId
   */
  const resetOverride = useCallback((emailId) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[emailId];
      saveOverrides(next);
      return next;
    });
  }, []);

  /**
   * Full demo reset: clear emails, analyses, overrides, filters, search.
   */
  const resetDemo = useCallback(() => {
    setRawEmails([]);
    setBaseAnalyses([]);
    setOverrides({});
    setActiveFilter('all');
    setSearchQuery('');
    setAnalysisSource(null);
    setSelectedEmailId(null);
    setProgress({ current: 0, total: 0 });
    saveOverrides({});
  }, []);

  // ── Context value ─────────────────────────────
  const value = {
    // State
    rawEmails,
    analyses,
    baseAnalyses,
    stats,
    followUpsDue,
    filteredAnalyses,
    activeFilter,
    searchQuery,
    isAnalyzing,
    progress,
    analysisSource,
    selectedEmailId,
    selectedEmail,
    selectedAnalysis,

    // Analysis mode
    analysisMode,
    setAnalysisMode,
    isLiveModeAvailable: isLiveModeAvailable(),

    // Actions
    loadDemoInbox,
    analyzeInbox,
    analyzeWithFallback, // alias for cached-only mode
    overrideStatus,
    resetOverride,
    resetDemo,
    setActiveFilter,
    setSearchQuery,
    setSelectedEmailId,

    // Expose setters so external services can inject results
    setBaseAnalyses,
    setAnalysisSource,
    setIsAnalyzing,
    setProgress,
  };

  return (
    <InboxContext.Provider value={value}>
      {children}
    </InboxContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Custom hook
// ─────────────────────────────────────────────

/**
 * Consume the Inbox context in any child component.
 * Must be used inside <InboxProvider>.
 *
 * @returns {ReturnType<typeof InboxProvider>}
 */
export function useInbox() {
  const ctx = useContext(InboxContext);
  if (!ctx) {
    throw new Error('useInbox must be used inside <InboxProvider>');
  }
  return ctx;
}

export default InboxContext;
