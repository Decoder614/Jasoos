/**
 * Tests: services/analysisRunner.js
 * Covers: runAnalysis (cached + live mode), isLiveModeAvailable
 *
 * Strategy:
 *  - All external imports (geminiService, analysisValidator, followUpCalculator) are mocked
 *    so this suite tests only the orchestration logic of the runner itself.
 *  - The fallback_analysis.json import is also mocked to avoid filesystem coupling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────
// Mocks — must be declared before importing the module under test
// ─────────────────────────────────────────────

vi.mock('../../services/geminiService.js', () => ({
  getApiKey: vi.fn(() => null),
  analyzeEmailWithGemini: vi.fn(),
}));

vi.mock('../../services/analysisValidator.js', () => ({
  validateAndNormalize: vi.fn((raw, emailId, source) => ({
    ok: true,
    analysis: {
      email_id: emailId,
      status: raw?.status ?? 'applied',
      company_name: raw?.company_name ?? 'TestCo',
      job_title: raw?.job_title ?? 'Dev',
      risk: { level: 'low', reasons: [], evidence: [] },
      follow_up: { eligible: false, days_elapsed: 0, action_suggestion: '' },
      source,
      confidence: 0.9,
      needs_manual_review: false,
      is_manual_override: false,
      ai_suggested_status: null,
    },
  })),
  validateBatch: vi.fn((results, source) =>
    results.map(({ emailId }) => ({
      email_id: emailId,
      status: 'applied',
      company_name: 'Live Co',
      job_title: 'Eng',
      risk: { level: 'low', reasons: [], evidence: [] },
      follow_up: { eligible: false, days_elapsed: 0, action_suggestion: '' },
      source,
      confidence: 0.8,
      needs_manual_review: false,
      is_manual_override: false,
      ai_suggested_status: null,
    }))
  ),
  buildErrorAnalysis: vi.fn((emailId, errorMsg, source) => ({
    email_id: emailId,
    status: 'needs_review',
    source,
    error: errorMsg,
  })),
}));

vi.mock('../../utils/followUpCalculator.js', () => ({
  computeFollowUp: vi.fn(() => ({ eligible: false, days_elapsed: 0, action_suggestion: '' })),
  DEMO_REFERENCE_DATE: '2026-10-24',
}));

// Mock fallback_analysis.json with 3 items
vi.mock('../../data/fallback_analysis.json', () => ({
  default: [
    { email_id: 'e1', status: 'applied', company_name: 'Alpha', job_title: 'Dev' },
    { email_id: 'e2', status: 'interview', company_name: 'Beta', job_title: 'PM' },
    { email_id: 'e3', status: 'rejected', company_name: 'Gamma', job_title: 'QA' },
  ],
}));

import { runAnalysis, isLiveModeAvailable } from '../../services/analysisRunner.js';
import { getApiKey, analyzeEmailWithGemini } from '../../services/geminiService.js';

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const SAMPLE_EMAILS = [
  { id: 'e1', received_at: '2026-10-10T09:30:00+05:30', from_name: 'Alpha HR', from_email: 'hr@alpha.com', subject: 'App Received', body: 'Hi' },
  { id: 'e2', received_at: '2026-10-15T09:30:00+05:30', from_name: 'Beta HR', from_email: 'hr@beta.com', subject: 'Interview Invite', body: 'Hi' },
  { id: 'e3', received_at: '2026-10-05T09:30:00+05:30', from_name: 'Gamma HR', from_email: 'hr@gamma.com', subject: 'Rejection', body: 'Hi' },
];

function makeCallbacks() {
  return {
    setIsAnalyzing: vi.fn(),
    setProgress: vi.fn(),
    setBaseAnalyses: vi.fn(),
    setAnalysisSource: vi.fn(),
  };
}

// ─────────────────────────────────────────────
// isLiveModeAvailable
// ─────────────────────────────────────────────
describe('isLiveModeAvailable', () => {
  it('returns false when no API key is set', () => {
    getApiKey.mockReturnValue(null);
    expect(isLiveModeAvailable()).toBe(false);
  });

  it('returns true when an API key is available', () => {
    getApiKey.mockReturnValue('some-api-key');
    expect(isLiveModeAvailable()).toBe(true);
    getApiKey.mockReturnValue(null); // restore
  });
});

// ─────────────────────────────────────────────
// runAnalysis — input validation
// ─────────────────────────────────────────────
describe('runAnalysis — input validation', () => {
  it('throws when called with no emails', async () => {
    const cbs = makeCallbacks();
    await expect(runAnalysis([], cbs)).rejects.toThrow('no emails provided');
  });

  it('throws when called with null emails', async () => {
    const cbs = makeCallbacks();
    await expect(runAnalysis(null, cbs)).rejects.toThrow('no emails provided');
  });
});

// ─────────────────────────────────────────────
// runAnalysis — cached demo mode
// ─────────────────────────────────────────────
describe('runAnalysis — cached_demo mode', () => {
  beforeEach(() => {
    getApiKey.mockReturnValue(null); // no API key → cached mode
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses cached_demo mode when no API key is present', async () => {
    const cbs = makeCallbacks();
    const promise = runAnalysis(SAMPLE_EMAILS, cbs);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.mode).toBe('cached_demo');
  });

  it('calls setIsAnalyzing(true) at start and setIsAnalyzing(false) at end', async () => {
    const cbs = makeCallbacks();
    const promise = runAnalysis(SAMPLE_EMAILS, cbs);
    await vi.runAllTimersAsync();
    await promise;
    expect(cbs.setIsAnalyzing).toHaveBeenCalledWith(true);
    expect(cbs.setIsAnalyzing).toHaveBeenCalledWith(false);
  });

  it('calls setAnalysisSource with cached_demo', async () => {
    const cbs = makeCallbacks();
    const promise = runAnalysis(SAMPLE_EMAILS, cbs);
    await vi.runAllTimersAsync();
    await promise;
    expect(cbs.setAnalysisSource).toHaveBeenCalledWith('cached_demo');
  });

  it('calls setBaseAnalyses once with the validated results', async () => {
    const cbs = makeCallbacks();
    const promise = runAnalysis(SAMPLE_EMAILS, cbs);
    await vi.runAllTimersAsync();
    await promise;
    expect(cbs.setBaseAnalyses).toHaveBeenCalledOnce();
    const [analyses] = cbs.setBaseAnalyses.mock.calls[0];
    expect(analyses).toHaveLength(3); // matching fallback mock length
  });

  it('calls setProgress multiple times and resets to 0 at end', async () => {
    const cbs = makeCallbacks();
    const promise = runAnalysis(SAMPLE_EMAILS, cbs);
    await vi.runAllTimersAsync();
    await promise;
    const calls = cbs.setProgress.mock.calls;
    // Last call should be reset to {current:0, total:0}
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall).toEqual({ current: 0, total: 0 });
  });

  it('honours forceMode=cached_demo even when API key exists', async () => {
    getApiKey.mockReturnValue('some-key');
    const cbs = makeCallbacks();
    const promise = runAnalysis(SAMPLE_EMAILS, cbs, { forceMode: 'cached_demo' });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.mode).toBe('cached_demo');
    getApiKey.mockReturnValue(null);
  });
});

// ─────────────────────────────────────────────
// runAnalysis — live AI mode
// ─────────────────────────────────────────────
describe('runAnalysis — live_ai mode', () => {
  beforeEach(() => {
    getApiKey.mockReturnValue('test-api-key');
    analyzeEmailWithGemini.mockResolvedValue({ status: 'applied', company_name: 'Live Co' });
  });

  afterEach(() => {
    getApiKey.mockReturnValue(null);
    vi.restoreAllMocks();
  });

  it('uses live_ai mode when API key is present', async () => {
    const cbs = makeCallbacks();
    const result = await runAnalysis(SAMPLE_EMAILS, cbs);
    expect(result.mode).toBe('live_ai');
  });

  it('calls analyzeEmailWithGemini once per email', async () => {
    const cbs = makeCallbacks();
    await runAnalysis(SAMPLE_EMAILS, cbs);
    expect(analyzeEmailWithGemini).toHaveBeenCalledTimes(SAMPLE_EMAILS.length);
  });

  it('calls setAnalysisSource with live_ai', async () => {
    const cbs = makeCallbacks();
    await runAnalysis(SAMPLE_EMAILS, cbs);
    expect(cbs.setAnalysisSource).toHaveBeenCalledWith('live_ai');
  });

  it('falls back to cached_demo if forceMode=live_ai but no API key', async () => {
    getApiKey.mockReturnValue(null);
    vi.useFakeTimers();
    const cbs = makeCallbacks();
    const promise = runAnalysis(SAMPLE_EMAILS, cbs, { forceMode: 'live_ai' });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.mode).toBe('cached_demo');
    vi.useRealTimers();
  });

  it('falls back to cached_demo on catastrophic runner failure', async () => {
    // Make analyzeEmailWithGemini throw to simulate fatal error during live run
    analyzeEmailWithGemini.mockRejectedValue(new Error('Fatal network failure'));
    vi.useFakeTimers();
    const cbs = makeCallbacks();
    const promise = runAnalysis(SAMPLE_EMAILS, cbs);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.mode).toBe('cached_demo');
    vi.useRealTimers();
  });
});
