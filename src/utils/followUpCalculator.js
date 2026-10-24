/**
 * Jasoos — Deterministic Follow-Up Calculator
 * Phase 2: Calculates follow-up eligibility relative to the demo reference date.
 *
 * Rules:
 *   - Reference date is fixed to 2026-10-24 for deterministic demo behaviour.
 *   - Only emails with status = applied | interview are follow-up eligible.
 *   - An email is "due" if days elapsed since received_at >= FOLLOW_UP_THRESHOLD_DAYS (7).
 *   - rejected and final offer items are always excluded.
 */

import { STATUS, ANALYSIS_SOURCE } from '../types/index.js';

/** Fixed demo reference date — all elapsed-day math is relative to this. */
export const DEMO_REFERENCE_DATE = '2026-10-24';

/** Number of days after which a follow-up is considered overdue. */
export const FOLLOW_UP_THRESHOLD_DAYS = 7;

/**
 * Statuses that are eligible for a follow-up reminder.
 * Rejected & offer are terminal — no chasing needed.
 */
const FOLLOW_UP_ELIGIBLE_STATUSES = new Set([STATUS.APPLIED, STATUS.INTERVIEW]);

/**
 * Calculate the number of days elapsed between the email's received_at date
 * and the reference date (floored to whole days).
 *
 * @param {string} receivedAt  - ISO 8601 date-time string (e.g. "2026-10-10T09:30:00+05:30")
 * @param {string} [referenceDate] - ISO date string; defaults to DEMO_REFERENCE_DATE
 * @returns {number} Days elapsed (always >= 0)
 */
export function calcDaysElapsed(receivedAt, referenceDate = DEMO_REFERENCE_DATE) {
  const refMs = new Date(referenceDate + 'T00:00:00').getTime();
  const emailMs = new Date(receivedAt).getTime();
  const diffMs = refMs - emailMs;
  if (diffMs < 0) return 0; // Email is in the future relative to reference — not yet due
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generate a polite follow-up action suggestion template string.
 *
 * @param {string} companyName
 * @param {string} jobTitle
 * @param {number} daysElapsed
 * @param {string} status - STATUS enum value
 * @returns {string}
 */
export function generateFollowUpSuggestion(companyName, jobTitle, daysElapsed, status) {
  const company = companyName || 'the company';
  const role = jobTitle || 'the position';

  if (status === STATUS.INTERVIEW) {
    return (
      `It's been ${daysElapsed} days since your last interview step with ${company} for ${role}. ` +
      `Consider sending a brief, polite check-in to your recruiter expressing continued interest ` +
      `and asking for a timeline update.`
    );
  }

  // Default: applied
  return (
    `Your application to ${company} for ${role} has been pending for ${daysElapsed} days. ` +
    `Send a polite follow-up email to the recruiter reiterating your enthusiasm and requesting ` +
    `an update on the hiring timeline.`
  );
}

/**
 * Compute the follow-up eligibility block for a single email analysis.
 *
 * @param {import('../types/index.js').EmailAnalysis} analysis - Must have status, company_name, job_title
 * @param {import('../types/index.js').EmailRecord}   email    - Must have received_at
 * @param {string} [referenceDate]
 * @returns {import('../types/index.js').FollowUpReminder}
 */
export function computeFollowUp(analysis, email, referenceDate = DEMO_REFERENCE_DATE) {
  const daysElapsed = calcDaysElapsed(email.received_at, referenceDate);
  const statusIsEligible = FOLLOW_UP_ELIGIBLE_STATUSES.has(analysis.status);
  const eligible = statusIsEligible && daysElapsed >= FOLLOW_UP_THRESHOLD_DAYS;

  return {
    email_id: email.id,
    company_name: analysis.company_name || email.from_name,
    job_title: analysis.job_title || 'Unknown Role',
    applied_date: email.received_at.split('T')[0],
    days_elapsed: daysElapsed,
    eligible,
    action_suggestion: eligible
      ? generateFollowUpSuggestion(
          analysis.company_name,
          analysis.job_title,
          daysElapsed,
          analysis.status
        )
      : null,
  };
}

/**
 * Process a full list of analyses + raw emails, returning only those
 * that are follow-up eligible (due >= 7 days, actionable status).
 *
 * @param {import('../types/index.js').EmailAnalysis[]} analyses
 * @param {import('../types/index.js').EmailRecord[]}   emails
 * @param {string} [referenceDate]
 * @returns {import('../types/index.js').FollowUpReminder[]}  Sorted by days_elapsed desc
 */
export function getFollowUpsDue(analyses, emails, referenceDate = DEMO_REFERENCE_DATE) {
  const emailMap = new Map(emails.map(e => [e.id, e]));

  const reminders = analyses
    .map(analysis => {
      const email = emailMap.get(analysis.email_id);
      if (!email) return null;
      return computeFollowUp(analysis, email, referenceDate);
    })
    .filter(r => r !== null && r.eligible);

  // Sort by most overdue first
  reminders.sort((a, b) => b.days_elapsed - a.days_elapsed);
  return reminders;
}

/**
 * Smoke-check / self-test utility. Verifies 3 key scenarios.
 * Call from browser console: import('/src/utils/followUpCalculator.js').then(m => m.smokeTest())
 *
 * @returns {{ passed: boolean, results: Object[] }}
 */
export function smokeTest() {
  const results = [];

  // Test 1: email from 2026-10-10 → 14 days → SHOULD be due
  const days1 = calcDaysElapsed('2026-10-10T09:30:00+05:30');
  const t1 = { label: 'Oct 10 email (14 days) → eligible', expected: true, got: days1 >= 7, days: days1 };
  results.push(t1);

  // Test 2: email from 2026-10-20 → 4 days → should NOT be due
  const days2 = calcDaysElapsed('2026-10-20T09:30:00+05:30');
  const t2 = { label: 'Oct 20 email (4 days) → not eligible', expected: false, got: days2 < 7, days: days2 };
  results.push(t2);

  // Test 3: rejection from 2026-10-05 → status excluded regardless of days
  const mockAnalysis = { email_id: 'x', company_name: 'TestCo', job_title: 'Engineer', status: STATUS.REJECTED };
  const mockEmail = { id: 'x', received_at: '2026-10-05T09:30:00+05:30', from_name: 'TestCo' };
  const followUp = computeFollowUp(mockAnalysis, mockEmail);
  const t3 = { label: 'Rejection (Oct 5) → excluded', expected: false, got: !followUp.eligible, days: followUp.days_elapsed };
  results.push(t3);

  const passed = results.every(r => r.got === r.expected);
  console.table(results.map(r => ({ ...r, status: r.got === r.expected ? '✅ PASS' : '❌ FAIL' })));
  return { passed, results };
}
