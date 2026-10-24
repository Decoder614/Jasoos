/**
 * Tests: followUpCalculator.js
 * Covers: calcDaysElapsed, generateFollowUpSuggestion, computeFollowUp, getFollowUpsDue
 */

import { describe, it, expect } from 'vitest';
import {
  calcDaysElapsed,
  generateFollowUpSuggestion,
  computeFollowUp,
  getFollowUpsDue,
  DEMO_REFERENCE_DATE,
  FOLLOW_UP_THRESHOLD_DAYS,
} from '../../utils/followUpCalculator.js';
import { STATUS } from '../../types/index.js';

// ─────────────────────────────────────────────
// calcDaysElapsed
// ─────────────────────────────────────────────
describe('calcDaysElapsed', () => {
  it('returns 14 for an email received 14 days before the reference date', () => {
    const days = calcDaysElapsed('2026-10-10T09:30:00+05:30');
    expect(days).toBe(14);
  });

  it('returns 4 for an email received 4 days before the reference date', () => {
    const days = calcDaysElapsed('2026-10-20T09:30:00+05:30');
    expect(days).toBe(4);
  });

  it('returns 19 for Oct 5 email (19 days before Oct 24)', () => {
    const days = calcDaysElapsed('2026-10-05T09:30:00+05:30');
    expect(days).toBe(19);
  });

  it('returns 0 for an email received on the reference date itself', () => {
    const days = calcDaysElapsed('2026-10-24T00:00:00');
    expect(days).toBe(0);
  });

  it('returns 0 for a future email (future emails are not yet due)', () => {
    const days = calcDaysElapsed('2026-11-01T00:00:00');
    expect(days).toBe(0);
  });

  it('accepts a custom reference date', () => {
    const days = calcDaysElapsed('2026-10-01T00:00:00', '2026-10-11');
    expect(days).toBe(10);
  });

  it('FOLLOW_UP_THRESHOLD_DAYS constant is 7', () => {
    expect(FOLLOW_UP_THRESHOLD_DAYS).toBe(7);
  });

  it('DEMO_REFERENCE_DATE constant is 2026-10-24', () => {
    expect(DEMO_REFERENCE_DATE).toBe('2026-10-24');
  });
});

// ─────────────────────────────────────────────
// generateFollowUpSuggestion
// ─────────────────────────────────────────────
describe('generateFollowUpSuggestion', () => {
  it('returns an interview-specific message for interview status', () => {
    const msg = generateFollowUpSuggestion('Acme', 'Engineer', 10, STATUS.INTERVIEW);
    expect(msg).toContain('interview step');
    expect(msg).toContain('Acme');
    expect(msg).toContain('Engineer');
    expect(msg).toContain('10 days');
  });

  it('returns an applied-specific message for applied status', () => {
    const msg = generateFollowUpSuggestion('Stripe', 'Backend Dev', 8, STATUS.APPLIED);
    expect(msg).toContain('pending for 8 days');
    expect(msg).toContain('Stripe');
    expect(msg).toContain('Backend Dev');
  });

  it('falls back gracefully when company name is empty', () => {
    const msg = generateFollowUpSuggestion('', '', 7, STATUS.APPLIED);
    expect(msg).toContain('the company');
    expect(msg).toContain('the position');
  });

  it('falls back gracefully when company and role are null', () => {
    const msg = generateFollowUpSuggestion(null, null, 9, STATUS.APPLIED);
    expect(msg).toContain('the company');
    expect(msg).toContain('the position');
  });
});

// ─────────────────────────────────────────────
// computeFollowUp
// ─────────────────────────────────────────────
describe('computeFollowUp', () => {
  const makeAnalysis = (status, company = 'TestCo', job = 'Dev') => ({
    email_id: 'email_001',
    company_name: company,
    job_title: job,
    status,
  });

  const makeEmail = (receivedAt) => ({
    id: 'email_001',
    received_at: receivedAt,
    from_name: 'HR Team',
  });

  it('marks an applied email older than 7 days as eligible', () => {
    const result = computeFollowUp(makeAnalysis(STATUS.APPLIED), makeEmail('2026-10-10T09:30:00+05:30'));
    expect(result.eligible).toBe(true);
    expect(result.days_elapsed).toBe(14);
    expect(result.action_suggestion).toBeTruthy();
  });

  it('marks an interview email older than 7 days as eligible', () => {
    const result = computeFollowUp(makeAnalysis(STATUS.INTERVIEW), makeEmail('2026-10-10T09:30:00+05:30'));
    expect(result.eligible).toBe(true);
    expect(result.action_suggestion).toContain('interview');
  });

  it('marks an applied email younger than 7 days as NOT eligible', () => {
    const result = computeFollowUp(makeAnalysis(STATUS.APPLIED), makeEmail('2026-10-21T09:30:00+05:30'));
    expect(result.eligible).toBe(false);
    expect(result.action_suggestion).toBeNull();
  });

  it('always excludes rejected status regardless of days elapsed', () => {
    const result = computeFollowUp(makeAnalysis(STATUS.REJECTED), makeEmail('2026-10-05T09:30:00+05:30'));
    expect(result.eligible).toBe(false);
    expect(result.action_suggestion).toBeNull();
  });

  it('always excludes offer status regardless of days elapsed', () => {
    const result = computeFollowUp(makeAnalysis(STATUS.OFFER), makeEmail('2026-10-01T09:30:00+05:30'));
    expect(result.eligible).toBe(false);
  });

  it('always excludes needs_review status', () => {
    const result = computeFollowUp(makeAnalysis(STATUS.NEEDS_REVIEW), makeEmail('2026-10-01T09:30:00+05:30'));
    expect(result.eligible).toBe(false);
  });

  it('includes correct metadata on the returned object', () => {
    const result = computeFollowUp(makeAnalysis(STATUS.APPLIED, 'Google', 'SWE'), makeEmail('2026-10-10T09:30:00+05:30'));
    expect(result.email_id).toBe('email_001');
    expect(result.company_name).toBe('Google');
    expect(result.job_title).toBe('SWE');
    expect(result.applied_date).toBe('2026-10-10');
    expect(result.days_elapsed).toBe(14);
  });

  it('falls back to email.from_name when analysis.company_name is missing', () => {
    const analysis = { email_id: 'email_001', company_name: '', job_title: '', status: STATUS.APPLIED };
    const email = { id: 'email_001', received_at: '2026-10-10T09:30:00+05:30', from_name: 'Recruiter Inc.' };
    const result = computeFollowUp(analysis, email);
    expect(result.company_name).toBe('Recruiter Inc.');
  });
});

// ─────────────────────────────────────────────
// getFollowUpsDue
// ─────────────────────────────────────────────
describe('getFollowUpsDue', () => {
  const emails = [
    { id: 'e1', received_at: '2026-10-10T09:30:00+05:30', from_name: 'A' }, // 14 days → due
    { id: 'e2', received_at: '2026-10-21T09:30:00+05:30', from_name: 'B' }, // 3 days → not due
    { id: 'e3', received_at: '2026-10-05T09:30:00+05:30', from_name: 'C' }, // 19 days → rejected, excluded
    { id: 'e4', received_at: '2026-10-15T09:30:00+05:30', from_name: 'D' }, // 9 days → due
  ];

  const analyses = [
    { email_id: 'e1', company_name: 'Alpha', job_title: 'Dev', status: STATUS.APPLIED },
    { email_id: 'e2', company_name: 'Beta',  job_title: 'PM',  status: STATUS.APPLIED },
    { email_id: 'e3', company_name: 'Gamma', job_title: 'QA',  status: STATUS.REJECTED },
    { email_id: 'e4', company_name: 'Delta', job_title: 'DS',  status: STATUS.INTERVIEW },
  ];

  it('returns only eligible follow-ups', () => {
    const result = getFollowUpsDue(analyses, emails);
    expect(result.length).toBe(2); // e1 and e4 only
    const ids = result.map(r => r.email_id);
    expect(ids).toContain('e1');
    expect(ids).toContain('e4');
  });

  it('sorts results by days_elapsed descending (most overdue first)', () => {
    const result = getFollowUpsDue(analyses, emails);
    expect(result[0].days_elapsed).toBeGreaterThanOrEqual(result[1].days_elapsed);
  });

  it('returns an empty array when no emails are due', () => {
    const recentAnalyses = [
      { email_id: 'e2', company_name: 'Beta', job_title: 'PM', status: STATUS.APPLIED },
    ];
    const result = getFollowUpsDue(recentAnalyses, emails);
    expect(result).toHaveLength(0);
  });

  it('returns an empty array for empty inputs', () => {
    expect(getFollowUpsDue([], [])).toHaveLength(0);
  });

  it('skips analyses whose email is missing from the email map', () => {
    const orphanAnalyses = [
      { email_id: 'orphan_99', company_name: 'X', job_title: 'Y', status: STATUS.APPLIED },
    ];
    const result = getFollowUpsDue(orphanAnalyses, emails);
    expect(result).toHaveLength(0);
  });
});
