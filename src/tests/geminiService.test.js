/**
 * Tests: services/geminiService.js
 * Covers: analyzeEmailWithGemini (via fetch mocks), buildPrompt (indirectly), getApiKey
 *
 * Note: The Gemini API is mocked via Vitest's vi.stubGlobal to avoid live network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeEmailWithGemini } from '../../services/geminiService.js';

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const MOCK_EMAIL = {
  id: 'email_001',
  from_name: 'Google Recruiting',
  from_email: 'recruiting@google.com',
  subject: 'Your application to Google',
  received_at: '2026-10-10T09:30:00+05:30',
  body: 'Thank you for applying. We have received your application.',
};

const VALID_GEMINI_JSON = {
  is_job_related: true,
  company_name: 'Google',
  job_title: 'Software Engineer',
  recruiter_name: 'Jane Doe',
  status: 'applied',
  summary: 'Application received.',
  event_date: '2026-10-10',
  confidence: 0.9,
  needs_manual_review: false,
  risk: { level: 'low', reasons: [], evidence: [] },
  follow_up: { eligible: true, days_elapsed: 14, action_suggestion: 'Send follow-up.' },
};

/** Build a mock fetch response with the given Gemini candidates wrapper. */
function makeFetchMock(jsonPayload, status = 200) {
  const geminiWrapper = {
    candidates: [
      { content: { parts: [{ text: JSON.stringify(jsonPayload) }] } },
    ],
  };
  return vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(geminiWrapper),
      text: () => Promise.resolve('Error body'),
    })
  );
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────
describe('analyzeEmailWithGemini', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', makeFetchMock(VALID_GEMINI_JSON));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls fetch with the correct Gemini endpoint URL', async () => {
    await analyzeEmailWithGemini(MOCK_EMAIL, 'test-api-key');
    expect(fetch).toHaveBeenCalledOnce();
    const [url] = fetch.mock.calls[0];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain('test-api-key');
    expect(url).toContain('gemini-2.0-flash');
  });

  it('sends a POST request with JSON content-type', async () => {
    await analyzeEmailWithGemini(MOCK_EMAIL, 'key');
    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('returns the parsed JSON from the Gemini response', async () => {
    const result = await analyzeEmailWithGemini(MOCK_EMAIL, 'key');
    expect(result.company_name).toBe('Google');
    expect(result.status).toBe('applied');
    expect(result.confidence).toBe(0.9);
  });

  it('includes the email id, subject, and from_name in the request body', async () => {
    await analyzeEmailWithGemini(MOCK_EMAIL, 'key');
    const [, options] = fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const userText = body.contents[0].parts[0].text;
    expect(userText).toContain('email_001');
    expect(userText).toContain('Google Recruiting');
    expect(userText).toContain('Your application to Google');
  });

  it('strips markdown fences from the response if present', async () => {
    const wrappedResponse = {
      candidates: [
        { content: { parts: [{ text: '```json\n' + JSON.stringify(VALID_GEMINI_JSON) + '\n```' }] } },
      ],
    };
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(wrappedResponse) })
    ));
    const result = await analyzeEmailWithGemini(MOCK_EMAIL, 'key');
    expect(result.company_name).toBe('Google');
  });

  it('throws when the API returns a non-200 status', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve('Rate limit exceeded') })
    ));
    await expect(analyzeEmailWithGemini(MOCK_EMAIL, 'key')).rejects.toThrow('429');
  });

  it('throws when the Gemini response has no candidates text', async () => {
    const emptyResponse = { candidates: [{ content: { parts: [] } }] };
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(emptyResponse) })
    ));
    await expect(analyzeEmailWithGemini(MOCK_EMAIL, 'key')).rejects.toThrow('empty response');
  });

  it('throws when the response text is not valid JSON', async () => {
    const badJsonResponse = {
      candidates: [{ content: { parts: [{ text: 'this is not JSON' }] } }],
    };
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(badJsonResponse) })
    ));
    await expect(analyzeEmailWithGemini(MOCK_EMAIL, 'key')).rejects.toThrow('not valid JSON');
  });

  it('throws when fetch itself rejects (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));
    await expect(analyzeEmailWithGemini(MOCK_EMAIL, 'key')).rejects.toThrow('Network error');
  });

  it('includes [EMAIL_START] injection boundary in the prompt', async () => {
    await analyzeEmailWithGemini(MOCK_EMAIL, 'key');
    const [, options] = fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const userText = body.contents[0].parts[0].text;
    expect(userText).toContain('[EMAIL_START');
    expect(userText).toContain('[EMAIL_END]');
  });

  it('uses a low temperature (≤ 0.2) in generationConfig for deterministic output', async () => {
    await analyzeEmailWithGemini(MOCK_EMAIL, 'key');
    const [, options] = fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.generationConfig.temperature).toBeLessThanOrEqual(0.2);
  });
});
