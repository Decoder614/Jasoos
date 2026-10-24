/**
 * Jasoos — Analysis Runner
 * Phase 3: Orchestrates live AI vs. cached fallback analysis with progress tracking.
 *
 * Responsibilities:
 *   1. Detect API key availability and choose mode: live_ai vs cached_demo.
 *   2. Live mode: sequentially call Gemini per email, emit progress, validate each result.
 *   3. Cached mode: load fallback_analysis.json, validate every record, return instantly.
 *   4. Always tag analysis source: 'live_ai' | 'cached_demo'.
 *   5. Integrate with InboxContext setters via a callbacks object.
 */

import { ANALYSIS_SOURCE } from '../types/index.js';
import { getApiKey, analyzeEmailWithGemini } from './geminiService.js';
import { validateAndNormalize, buildErrorAnalysis, validateBatch } from './analysisValidator.js';
import fallbackAnalysis from '../data/fallback_analysis.json';
import { computeFollowUp } from '../utils/followUpCalculator.js';

// ─────────────────────────────────────────────
// Types (JSDoc)
// ─────────────────────────────────────────────

/**
 * Callbacks injected from InboxContext to update UI state during analysis.
 * @typedef {Object} AnalysisCallbacks
 * @property {function(boolean): void} setIsAnalyzing     - Show/hide progress indicator
 * @property {function({current:number,total:number}): void} setProgress - Update progress bar
 * @property {function(import('../types/index.js').EmailAnalysis[]): void} setBaseAnalyses - Store results
 * @property {function(string): void} setAnalysisSource   - Tag the source
 */

// ─────────────────────────────────────────────
// Cached Demo Mode
// ─────────────────────────────────────────────

/**
 * Run analysis in cached demo mode.
 * Validates the fallback_analysis.json fixture records and injects them into state.
 * Simulates a subtle staggered animation (30ms per email) so the progress bar feels real.
 *
 * @param {import('../types/index.js').EmailRecord[]} emails
 * @param {AnalysisCallbacks} callbacks
 * @returns {Promise<void>}
 */
async function runCachedMode(emails, callbacks) {
  const { setIsAnalyzing, setProgress, setBaseAnalyses, setAnalysisSource } = callbacks;
  const total = fallbackAnalysis.length;

  setIsAnalyzing(true);
  setProgress({ current: 0, total });

  // Stagger for UX realism
  for (let i = 0; i < total; i++) {
    await new Promise(resolve => setTimeout(resolve, 30));
    setProgress({ current: i + 1, total });
  }

  // Validate + tag every fixture record
  const tagged = fallbackAnalysis.map(raw => {
    const emailId = raw.email_id;
    const result = validateAndNormalize(raw, emailId, ANALYSIS_SOURCE.CACHED_DEMO);

    const analysis = result.ok
      ? result.analysis
      : buildErrorAnalysis(emailId, result.error, ANALYSIS_SOURCE.CACHED_DEMO);

    // Recompute follow-up relative to the demo reference date for accuracy
    const email = emails.find(e => e.id === emailId);
    if (email) {
      analysis.follow_up = computeFollowUp(analysis, email);
    }

    return analysis;
  });

  setBaseAnalyses(tagged);
  setAnalysisSource(ANALYSIS_SOURCE.CACHED_DEMO);
  setIsAnalyzing(false);
  setProgress({ current: 0, total: 0 });
}

// ─────────────────────────────────────────────
// Live AI Mode
// ─────────────────────────────────────────────

/**
 * Run analysis in live AI mode using Gemini.
 * Processes emails sequentially to respect rate limits and emits progress per email.
 * Per-email failures are isolated — they surface as `needs_review` error cards.
 *
 * @param {import('../types/index.js').EmailRecord[]} emails
 * @param {string} apiKey
 * @param {AnalysisCallbacks} callbacks
 * @returns {Promise<void>}
 */
async function runLiveMode(emails, apiKey, callbacks) {
  const { setIsAnalyzing, setProgress, setBaseAnalyses, setAnalysisSource } = callbacks;
  const total = emails.length;

  setIsAnalyzing(true);
  setProgress({ current: 0, total });

  const results = [];

  for (let i = 0; i < total; i++) {
    const email = emails[i];
    let raw = null;
    let error = null;

    try {
      raw = await analyzeEmailWithGemini(email, apiKey);
    } catch (err) {
      error = err?.message ?? 'Unknown Gemini error';
      console.warn(`[Jasoos] Gemini failed for ${email.id}:`, error);
    }

    results.push({ emailId: email.id, raw, error });
    setProgress({ current: i + 1, total });
  }

  // Validate the full batch (per-email isolation)
  const analyses = validateBatch(results, ANALYSIS_SOURCE.LIVE_AI);

  // Recompute follow-up for all results using the live reference date
  const enriched = analyses.map(analysis => {
    const email = emails.find(e => e.id === analysis.email_id);
    return email
      ? { ...analysis, follow_up: computeFollowUp(analysis, email) }
      : analysis;
  });

  setBaseAnalyses(enriched);
  setAnalysisSource(ANALYSIS_SOURCE.LIVE_AI);
  setIsAnalyzing(false);
  setProgress({ current: 0, total: 0 });
}

// ─────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────

/**
 * Run inbox analysis, automatically choosing live_ai or cached_demo mode.
 *
 * Mode selection:
 *   - If VITE_GEMINI_API_KEY is set → live_ai (with auto-fallback on repeated failures)
 *   - If key is absent or first call throws a network error → cached_demo
 *
 * @param {import('../types/index.js').EmailRecord[]} emails  - The loaded email records
 * @param {AnalysisCallbacks} callbacks                       - State setters from InboxContext
 * @param {{ forceMode?: 'live_ai' | 'cached_demo' }} [options]
 * @returns {Promise<{ mode: string }>} The mode that was used
 */
export async function runAnalysis(emails, callbacks, options = {}) {
  if (!emails || emails.length === 0) {
    throw new Error('runAnalysis: no emails provided');
  }

  const apiKey = getApiKey();

  // Determine mode
  let mode = options.forceMode;
  if (!mode) {
    mode = apiKey ? 'live_ai' : 'cached_demo';
  }

  if (mode === 'live_ai' && !apiKey) {
    console.warn('[Jasoos] forceMode=live_ai but no API key found — falling back to cached_demo');
    mode = 'cached_demo';
  }

  try {
    if (mode === 'live_ai') {
      await runLiveMode(emails, apiKey, callbacks);
    } else {
      await runCachedMode(emails, callbacks);
    }
  } catch (err) {
    // Catastrophic failure: fall back to cached demo
    console.error('[Jasoos] Analysis runner encountered a fatal error:', err);
    console.warn('[Jasoos] Falling back to cached_demo mode');
    await runCachedMode(emails, callbacks);
    mode = 'cached_demo';
  }

  return { mode };
}

/**
 * Returns true if a live Gemini API key is available.
 * Used by the UI to show the correct mode toggle label.
 *
 * @returns {boolean}
 */
export function isLiveModeAvailable() {
  return Boolean(getApiKey());
}
