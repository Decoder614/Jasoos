/**
 * Jasoos — Core Data Types & Schema Definitions
 * Phase 2: Data types, enums, and model schemas
 */

// ─────────────────────────────────────────────
// Status Canonical Enums
// ─────────────────────────────────────────────

/** @enum {string} */
export const STATUS = {
  APPLIED: 'applied',
  INTERVIEW: 'interview',
  REJECTED: 'rejected',
  OFFER: 'offer',
  NEEDS_REVIEW: 'needs_review',
};

/** All valid status values */
export const STATUS_VALUES = Object.values(STATUS);

/** Human-readable labels for each status */
export const STATUS_LABELS = {
  [STATUS.APPLIED]: 'Applied',
  [STATUS.INTERVIEW]: 'Interview',
  [STATUS.REJECTED]: 'Rejected',
  [STATUS.OFFER]: 'Offer',
  [STATUS.NEEDS_REVIEW]: 'Needs Review',
};

/** CSS class suffix for status badge styling */
export const STATUS_BADGE_CLASS = {
  [STATUS.APPLIED]: 'badge-applied',
  [STATUS.INTERVIEW]: 'badge-interview',
  [STATUS.REJECTED]: 'badge-rejected',
  [STATUS.OFFER]: 'badge-offer',
  [STATUS.NEEDS_REVIEW]: 'badge-needs_review',
};

// ─────────────────────────────────────────────
// Risk Level Enums
// ─────────────────────────────────────────────

/** @enum {string} */
export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  UNKNOWN: 'unknown',
};

/** All valid risk level values */
export const RISK_LEVEL_VALUES = Object.values(RISK_LEVEL);

/** Human-readable labels for risk levels */
export const RISK_LABELS = {
  [RISK_LEVEL.LOW]: 'Low Risk',
  [RISK_LEVEL.MEDIUM]: 'Medium Risk',
  [RISK_LEVEL.HIGH]: 'High Risk',
  [RISK_LEVEL.UNKNOWN]: 'Unknown',
};

// ─────────────────────────────────────────────
// Analysis Source Enums
// ─────────────────────────────────────────────

/** @enum {string} */
export const ANALYSIS_SOURCE = {
  LIVE_AI: 'live_ai',
  CACHED_DEMO: 'cached_demo',
  MANUAL_OVERRIDE: 'manual_override',
};

// ─────────────────────────────────────────────
// Model Schemas (JSDoc for IDE autocomplete)
// ─────────────────────────────────────────────

/**
 * Raw email record from the inbox.
 * @typedef {Object} EmailRecord
 * @property {string} id            - Unique email identifier (e.g. "email_001")
 * @property {string} from_name     - Sender display name
 * @property {string} from_email    - Sender email address
 * @property {string} subject       - Email subject line
 * @property {string} received_at   - ISO 8601 timestamp string
 * @property {string} body          - Raw email body text
 * @property {string[]} demo_tags   - Tags used for demo labeling (not analysis source)
 */

/**
 * Follow-up reminder for a specific email.
 * @typedef {Object} FollowUpReminder
 * @property {string}  email_id          - References the EmailRecord id
 * @property {string}  company_name      - Company name for display
 * @property {string}  job_title         - Job role applied to
 * @property {string}  applied_date      - ISO date string of the email
 * @property {number}  days_elapsed      - Days since email relative to DEMO_REFERENCE_DATE
 * @property {boolean} eligible          - True if >= 7 days and status is actionable
 * @property {string}  action_suggestion - Pre-formatted follow-up nudge text
 */

/**
 * Risk assessment for an email analysis.
 * @typedef {Object} RiskAssessment
 * @property {string}   level    - One of RISK_LEVEL values
 * @property {string[]} reasons  - List of risk reason strings
 * @property {string[]} evidence - Quoted snippets from the email body
 */

/**
 * AI or cached analysis result for an email.
 * @typedef {Object} EmailAnalysis
 * @property {string}         email_id       - References the EmailRecord id
 * @property {string}         company_name   - Extracted company name
 * @property {string}         job_title      - Extracted job title / role
 * @property {string}         recruiter_name - Extracted recruiter/sender name
 * @property {string}         status         - One of STATUS values
 * @property {string}         summary        - Short summary of the email
 * @property {RiskAssessment} risk           - Risk assessment object
 * @property {FollowUpReminder} follow_up    - Follow-up eligibility data
 * @property {number}         confidence     - 0.0 – 1.0 confidence score
 * @property {string}         source         - One of ANALYSIS_SOURCE values
 * @property {boolean}        is_manual_override - True if user manually changed status
 * @property {string|null}    ai_suggested_status - Original AI status before override
 */

/**
 * Aggregated dashboard statistics.
 * @typedef {Object} DashboardStats
 * @property {number} total           - Total emails analyzed
 * @property {number} applied         - Count with status = applied
 * @property {number} interview       - Count with status = interview
 * @property {number} rejected        - Count with status = rejected
 * @property {number} offer           - Count with status = offer
 * @property {number} needs_review    - Count with status = needs_review
 * @property {number} high_risk       - Count with risk.level = high
 * @property {number} follow_ups_due  - Count of eligible follow-up reminders
 */

/**
 * Compute DashboardStats from a list of EmailAnalysis objects.
 * @param {EmailAnalysis[]} analyses
 * @returns {DashboardStats}
 */
export function computeDashboardStats(analyses) {
  const stats = {
    total: analyses.length,
    applied: 0,
    interview: 0,
    rejected: 0,
    offer: 0,
    needs_review: 0,
    high_risk: 0,
    follow_ups_due: 0,
  };

  for (const a of analyses) {
    const status = a.status ?? STATUS.NEEDS_REVIEW;
    if (status === STATUS.APPLIED) stats.applied++;
    else if (status === STATUS.INTERVIEW) stats.interview++;
    else if (status === STATUS.REJECTED) stats.rejected++;
    else if (status === STATUS.OFFER) stats.offer++;
    else stats.needs_review++;

    if (a.risk?.level === RISK_LEVEL.HIGH) stats.high_risk++;
    if (a.follow_up?.eligible) stats.follow_ups_due++;
  }

  return stats;
}
