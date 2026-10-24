/**
 * Jasoos — Analysis Validator
 * Phase 3: Strict schema normalization and per-email error isolation.
 *
 * Responsibilities:
 *   1. Normalizes unexpected or missing status enums to 'needs_review'.
 *   2. Sanitizes null/empty fields to safe defaults.
 *   3. Validates risk level and coerces to 'unknown' if invalid.
 *   4. Returns a structured result: { ok: true, analysis } | { ok: false, error, emailId }
 *      — one failure does NOT break the remaining 19 emails.
 */

import { STATUS, STATUS_VALUES, RISK_LEVEL, RISK_LEVEL_VALUES, ANALYSIS_SOURCE } from '../types/index.js';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Ensure a value is a string; return fallback if not. */
function ensureString(val, fallback = '') {
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

/** Ensure a value is a non-negative number; return fallback if not. */
function ensureNumber(val, fallback = 0) {
  const n = Number(val);
  return isFinite(n) && n >= 0 ? n : fallback;
}

/** Ensure a value is a boolean. */
function ensureBool(val, fallback = false) {
  return typeof val === 'boolean' ? val : fallback;
}

/** Ensure a value is an array of strings. */
function ensureStringArray(val) {
  if (!Array.isArray(val)) return [];
  return val.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim());
}

// ─────────────────────────────────────────────
// Validator
// ─────────────────────────────────────────────

/**
 * Validate and normalize a raw Gemini JSON output into a clean EmailAnalysis object.
 *
 * @param {Object} raw      - Raw parsed JSON from Gemini (or from fallback fixture)
 * @param {string} emailId  - The email_id this analysis belongs to
 * @param {string} source   - ANALYSIS_SOURCE value ('live_ai' | 'cached_demo')
 * @returns {{ ok: true, analysis: import('../types/index.js').EmailAnalysis }
 *           | { ok: false, error: string, emailId: string }}
 */
export function validateAndNormalize(raw, emailId, source) {
  // Guard: raw must be a non-null object
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      error: 'Gemini response was not a JSON object',
      emailId,
    };
  }

  // ── Status normalization ──────────────────────
  // If Gemini returns an unrecognized status, default to needs_review
  const rawStatus = typeof raw.status === 'string' ? raw.status.toLowerCase().trim() : '';
  const status = STATUS_VALUES.includes(rawStatus) ? rawStatus : STATUS.NEEDS_REVIEW;

  // ── Risk normalization ────────────────────────
  const rawRisk = raw.risk && typeof raw.risk === 'object' ? raw.risk : {};
  const rawRiskLevel = typeof rawRisk.level === 'string' ? rawRisk.level.toLowerCase().trim() : '';
  const riskLevel = RISK_LEVEL_VALUES.includes(rawRiskLevel) ? rawRiskLevel : RISK_LEVEL.UNKNOWN;

  const risk = {
    level: riskLevel,
    reasons: ensureStringArray(rawRisk.reasons),
    evidence: ensureStringArray(rawRisk.evidence).slice(0, 3), // max 3 evidence quotes
  };

  // ── Follow-up normalization ───────────────────
  const rawFollowUp = raw.follow_up && typeof raw.follow_up === 'object' ? raw.follow_up : {};
  const followUpEligible = ensureBool(rawFollowUp.eligible);
  const daysElapsed = ensureNumber(rawFollowUp.days_elapsed, 0);
  const actionSuggestion = followUpEligible
    ? ensureString(rawFollowUp.action_suggestion, 'Consider following up with a brief check-in.')
    : '';

  const follow_up = {
    eligible: followUpEligible,
    days_elapsed: daysElapsed,
    action_suggestion: actionSuggestion,
  };

  // ── Confidence ────────────────────────────────
  const rawConfidence = Number(raw.confidence);
  const confidence = isFinite(rawConfidence)
    ? Math.min(1.0, Math.max(0.0, rawConfidence))
    : 0.5;

  // ── Assemble clean analysis object ───────────
  /** @type {import('../types/index.js').EmailAnalysis} */
  const analysis = {
    email_id: emailId,
    is_job_related: ensureBool(raw.is_job_related, true),
    company_name: ensureString(raw.company_name, 'Unknown Company'),
    job_title: ensureString(raw.job_title, 'Unknown Role'),
    recruiter_name: typeof raw.recruiter_name === 'string' && raw.recruiter_name.trim()
      ? raw.recruiter_name.trim()
      : null,
    status,
    summary: ensureString(raw.summary, 'No summary available.'),
    event_date: typeof raw.event_date === 'string' && raw.event_date.match(/^\d{4}-\d{2}-\d{2}$/)
      ? raw.event_date
      : null,
    confidence,
    needs_manual_review: ensureBool(raw.needs_manual_review, status === STATUS.NEEDS_REVIEW),
    risk,
    follow_up,
    source,
    is_manual_override: false,
    ai_suggested_status: null,
  };

  return { ok: true, analysis };
}

/**
 * Validate a batch of raw Gemini results.
 * Per-email isolation: one failure produces an error-card analysis, not a crash.
 *
 * @param {Array<{ emailId: string, raw: Object | null, error: string | null }>} results
 * @param {string} source - ANALYSIS_SOURCE value
 * @returns {import('../types/index.js').EmailAnalysis[]}
 */
export function validateBatch(results, source) {
  return results.map(({ emailId, raw, error: fetchError }) => {
    // If the fetch/parse itself threw, synthesize a review-error analysis
    if (fetchError || !raw) {
      return buildErrorAnalysis(emailId, fetchError || 'No data returned', source);
    }

    const result = validateAndNormalize(raw, emailId, source);
    if (!result.ok) {
      return buildErrorAnalysis(emailId, result.error, source);
    }

    return result.analysis;
  });
}

/**
 * Build a fallback "review error" analysis for an email that failed to parse.
 * This surfaces as a `needs_review` card in the UI without breaking the batch.
 *
 * @param {string} emailId
 * @param {string} errorMessage
 * @param {string} source
 * @returns {import('../types/index.js').EmailAnalysis}
 */
export function buildErrorAnalysis(emailId, errorMessage, source) {
  return {
    email_id: emailId,
    is_job_related: true,
    company_name: 'Review Required',
    job_title: 'Analysis Error',
    recruiter_name: null,
    status: STATUS.NEEDS_REVIEW,
    summary: `Analysis failed: ${errorMessage.slice(0, 120)}`,
    event_date: null,
    confidence: 0,
    needs_manual_review: true,
    risk: {
      level: RISK_LEVEL.UNKNOWN,
      reasons: ['Analysis could not be completed — manual review required'],
      evidence: [],
    },
    follow_up: {
      eligible: false,
      days_elapsed: 0,
      action_suggestion: '',
    },
    source,
    is_manual_override: false,
    ai_suggested_status: null,
  };
}
