/**
 * Tests: analysisValidator.js
 * Covers: validateAndNormalize, validateBatch, buildErrorAnalysis
 */

import { describe, it, expect } from 'vitest';
import {
  validateAndNormalize,
  validateBatch,
  buildErrorAnalysis,
} from '../../services/analysisValidator.js';
import { STATUS, RISK_LEVEL, ANALYSIS_SOURCE } from '../../types/index.js';

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const VALID_RAW = {
  is_job_related: true,
  company_name: 'Google',
  job_title: 'Software Engineer',
  recruiter_name: 'Jane Doe',
  status: 'applied',
  summary: 'Application received for SWE role.',
  event_date: '2026-10-10',
  confidence: 0.9,
  needs_manual_review: false,
  risk: {
    level: 'low',
    reasons: [],
    evidence: [],
  },
  follow_up: {
    eligible: true,
    days_elapsed: 14,
    action_suggestion: 'Send a follow-up email.',
  },
};

// ─────────────────────────────────────────────
// validateAndNormalize — happy path
// ─────────────────────────────────────────────
describe('validateAndNormalize — valid input', () => {
  it('returns ok: true with a clean analysis object for valid input', () => {
    const result = validateAndNormalize(VALID_RAW, 'email_001', ANALYSIS_SOURCE.CACHED_DEMO);
    expect(result.ok).toBe(true);
    expect(result.analysis.email_id).toBe('email_001');
    expect(result.analysis.company_name).toBe('Google');
    expect(result.analysis.status).toBe(STATUS.APPLIED);
    expect(result.analysis.source).toBe(ANALYSIS_SOURCE.CACHED_DEMO);
  });

  it('preserves a valid risk level', () => {
    const result = validateAndNormalize(VALID_RAW, 'email_001', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.risk.level).toBe(RISK_LEVEL.LOW);
  });

  it('clamps confidence to [0, 1]', () => {
    const result = validateAndNormalize({ ...VALID_RAW, confidence: 1.5 }, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.confidence).toBe(1.0);
  });

  it('sets confidence to 0.5 when confidence is non-numeric', () => {
    const result = validateAndNormalize({ ...VALID_RAW, confidence: 'high' }, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.confidence).toBe(0.5);
  });

  it('always sets is_manual_override to false on fresh analysis', () => {
    const result = validateAndNormalize(VALID_RAW, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.is_manual_override).toBe(false);
    expect(result.analysis.ai_suggested_status).toBeNull();
  });

  it('slices evidence to a maximum of 3 quotes', () => {
    const raw = {
      ...VALID_RAW,
      risk: { level: 'high', reasons: ['fee'], evidence: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    };
    const result = validateAndNormalize(raw, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.risk.evidence).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────
// validateAndNormalize — status normalization
// ─────────────────────────────────────────────
describe('validateAndNormalize — status normalization', () => {
  it('normalizes unknown status to needs_review', () => {
    const result = validateAndNormalize({ ...VALID_RAW, status: 'foobar' }, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.status).toBe(STATUS.NEEDS_REVIEW);
  });

  it('normalizes missing status to needs_review', () => {
    const raw = { ...VALID_RAW };
    delete raw.status;
    const result = validateAndNormalize(raw, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.status).toBe(STATUS.NEEDS_REVIEW);
  });

  it('normalizes status case-insensitively (APPLIED → applied)', () => {
    const result = validateAndNormalize({ ...VALID_RAW, status: 'APPLIED' }, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.status).toBe(STATUS.APPLIED);
  });

  it('accepts all valid status values', () => {
    const validStatuses = ['applied', 'interview', 'rejected', 'offer', 'needs_review'];
    for (const s of validStatuses) {
      const result = validateAndNormalize({ ...VALID_RAW, status: s }, 'e1', ANALYSIS_SOURCE.LIVE_AI);
      expect(result.analysis.status).toBe(s);
    }
  });
});

// ─────────────────────────────────────────────
// validateAndNormalize — risk normalization
// ─────────────────────────────────────────────
describe('validateAndNormalize — risk normalization', () => {
  it('normalizes unknown risk level to unknown', () => {
    const raw = { ...VALID_RAW, risk: { level: 'critical', reasons: [], evidence: [] } };
    const result = validateAndNormalize(raw, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.risk.level).toBe(RISK_LEVEL.UNKNOWN);
  });

  it('defaults to unknown when risk object is missing', () => {
    const raw = { ...VALID_RAW };
    delete raw.risk;
    const result = validateAndNormalize(raw, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.risk.level).toBe(RISK_LEVEL.UNKNOWN);
  });

  it('filters non-string items out of risk.reasons', () => {
    const raw = { ...VALID_RAW, risk: { level: 'high', reasons: ['fee', 42, null, 'otp'], evidence: [] } };
    const result = validateAndNormalize(raw, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.risk.reasons).toEqual(['fee', 'otp']);
  });
});

// ─────────────────────────────────────────────
// validateAndNormalize — field sanitization
// ─────────────────────────────────────────────
describe('validateAndNormalize — field sanitization', () => {
  it('defaults company_name to "Unknown Company" when null', () => {
    const result = validateAndNormalize({ ...VALID_RAW, company_name: null }, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.company_name).toBe('Unknown Company');
  });

  it('defaults job_title to "Unknown Role" when empty', () => {
    const result = validateAndNormalize({ ...VALID_RAW, job_title: '' }, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.job_title).toBe('Unknown Role');
  });

  it('sets recruiter_name to null when whitespace-only', () => {
    const result = validateAndNormalize({ ...VALID_RAW, recruiter_name: '   ' }, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.recruiter_name).toBeNull();
  });

  it('rejects malformed event_date and sets it to null', () => {
    const result = validateAndNormalize({ ...VALID_RAW, event_date: 'October 10' }, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.event_date).toBeNull();
  });

  it('accepts a valid YYYY-MM-DD event_date', () => {
    const result = validateAndNormalize({ ...VALID_RAW, event_date: '2026-10-10' }, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.event_date).toBe('2026-10-10');
  });

  it('defaults summary when missing', () => {
    const raw = { ...VALID_RAW };
    delete raw.summary;
    const result = validateAndNormalize(raw, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.analysis.summary).toBe('No summary available.');
  });
});

// ─────────────────────────────────────────────
// validateAndNormalize — failure cases
// ─────────────────────────────────────────────
describe('validateAndNormalize — failure cases', () => {
  it('returns ok: false for null input', () => {
    const result = validateAndNormalize(null, 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.ok).toBe(false);
    expect(result.emailId).toBe('e1');
    expect(result.error).toBeTruthy();
  });

  it('returns ok: false for a non-object (string)', () => {
    const result = validateAndNormalize('not an object', 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.ok).toBe(false);
  });

  it('returns ok: false for an array input', () => {
    const result = validateAndNormalize([{ status: 'applied' }], 'e1', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────
// buildErrorAnalysis
// ─────────────────────────────────────────────
describe('buildErrorAnalysis', () => {
  it('produces a valid error-analysis object with needs_review status', () => {
    const result = buildErrorAnalysis('email_005', 'Network timeout', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.email_id).toBe('email_005');
    expect(result.status).toBe(STATUS.NEEDS_REVIEW);
    expect(result.needs_manual_review).toBe(true);
    expect(result.confidence).toBe(0);
    expect(result.risk.level).toBe(RISK_LEVEL.UNKNOWN);
    expect(result.follow_up.eligible).toBe(false);
    expect(result.source).toBe(ANALYSIS_SOURCE.LIVE_AI);
  });

  it('includes a truncated version of the error message in summary', () => {
    const longError = 'X'.repeat(200);
    const result = buildErrorAnalysis('e1', longError, ANALYSIS_SOURCE.CACHED_DEMO);
    expect(result.summary.length).toBeLessThanOrEqual(150); // "Analysis failed: " + 120 chars
  });

  it('sets is_manual_override to false', () => {
    const result = buildErrorAnalysis('e1', 'err', ANALYSIS_SOURCE.LIVE_AI);
    expect(result.is_manual_override).toBe(false);
  });
});

// ─────────────────────────────────────────────
// validateBatch
// ─────────────────────────────────────────────
describe('validateBatch', () => {
  it('processes a healthy batch and returns an analysis for each item', () => {
    const batch = [
      { emailId: 'e1', raw: VALID_RAW, error: null },
      { emailId: 'e2', raw: { ...VALID_RAW, company_name: 'Meta' }, error: null },
    ];
    const results = validateBatch(batch, ANALYSIS_SOURCE.CACHED_DEMO);
    expect(results).toHaveLength(2);
    expect(results[0].email_id).toBe('e1');
    expect(results[1].company_name).toBe('Meta');
  });

  it('isolates a single failed email — rest still succeed', () => {
    const batch = [
      { emailId: 'e1', raw: VALID_RAW, error: null },
      { emailId: 'e2', raw: null, error: 'Network timeout' },
      { emailId: 'e3', raw: VALID_RAW, error: null },
    ];
    const results = validateBatch(batch, ANALYSIS_SOURCE.LIVE_AI);
    expect(results).toHaveLength(3);
    expect(results[0].status).toBe(STATUS.APPLIED);    // OK
    expect(results[1].status).toBe(STATUS.NEEDS_REVIEW); // error-fallback
    expect(results[2].status).toBe(STATUS.APPLIED);    // OK
  });

  it('produces error analyses for items with fetchError set', () => {
    const batch = [{ emailId: 'e1', raw: null, error: 'Gemini 500' }];
    const results = validateBatch(batch, ANALYSIS_SOURCE.LIVE_AI);
    expect(results[0].needs_manual_review).toBe(true);
    expect(results[0].confidence).toBe(0);
  });

  it('returns an empty array for an empty batch', () => {
    const results = validateBatch([], ANALYSIS_SOURCE.LIVE_AI);
    expect(results).toHaveLength(0);
  });
});
