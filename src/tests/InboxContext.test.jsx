/**
 * Tests: context/InboxContext.jsx
 * Covers: loadDemoInbox, resetDemo, overrideStatus, resetOverride,
 *         applyOverrides (derived), filteredAnalyses, stats, followUpsDue
 *
 * Strategy: We test the internal helper functions extracted-style, plus
 * snapshot behavior through a minimal React test wrapper using @testing-library/react.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import React from 'react';

// ─────────────────────────────────────────────
// Mock external services and data
// ─────────────────────────────────────────────

vi.mock('../../services/analysisRunner.js', () => ({
  runAnalysis: vi.fn(() => Promise.resolve({ mode: 'cached_demo' })),
  isLiveModeAvailable: vi.fn(() => false),
}));

vi.mock('../../data/sample_emails.json', () => ({
  default: [
    { id: 'e1', from_name: 'Alpha HR', from_email: 'hr@alpha.com', subject: 'App Received', received_at: '2026-10-10T09:30:00+05:30', body: 'Hi', demo_tags: [] },
    { id: 'e2', from_name: 'Beta HR', from_email: 'hr@beta.com', subject: 'Interview', received_at: '2026-10-15T09:30:00+05:30', body: 'Hi', demo_tags: [] },
  ],
}));

vi.mock('../../data/fallback_analysis.json', () => ({
  default: [],
}));

import { InboxProvider, useInbox } from '../../context/InboxContext.jsx';

// ─────────────────────────────────────────────
// Test helper: consumer component
// ─────────────────────────────────────────────

/**
 * A minimal consumer that exposes the context value via a data-testid.
 * We serialize chosen fields to inspect them.
 */
function InboxConsumer({ onMount }) {
  const ctx = useInbox();
  React.useEffect(() => {
    onMount(ctx);
  }, [ctx]);
  return <div data-testid="consumer" />;
}

function renderWithProvider(onMount = () => {}) {
  return render(
    <InboxProvider>
      <InboxConsumer onMount={onMount} />
    </InboxProvider>
  );
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('InboxContext — initial state', () => {
  it('starts with empty rawEmails', async () => {
    let ctx;
    renderWithProvider((c) => { ctx = c; });
    expect(ctx.rawEmails).toHaveLength(0);
  });

  it('starts with empty analyses', () => {
    let ctx;
    renderWithProvider((c) => { ctx = c; });
    expect(ctx.analyses).toHaveLength(0);
  });

  it('starts with activeFilter = "all"', () => {
    let ctx;
    renderWithProvider((c) => { ctx = c; });
    expect(ctx.activeFilter).toBe('all');
  });

  it('starts with isAnalyzing = false', () => {
    let ctx;
    renderWithProvider((c) => { ctx = c; });
    expect(ctx.isAnalyzing).toBe(false);
  });

  it('stats.total is 0 before loading inbox', () => {
    let ctx;
    renderWithProvider((c) => { ctx = c; });
    expect(ctx.stats.total).toBe(0);
  });
});

describe('InboxContext — loadDemoInbox', () => {
  it('populates rawEmails with sample emails', async () => {
    let ctx;
    renderWithProvider((c) => { ctx = c; });

    await act(async () => {
      ctx.loadDemoInbox();
    });

    expect(ctx.rawEmails).toHaveLength(2);
    expect(ctx.rawEmails[0].id).toBe('e1');
  });

  it('sets selectedEmailId to the first email id', async () => {
    let ctx;
    renderWithProvider((c) => { ctx = c; });

    await act(async () => {
      ctx.loadDemoInbox();
    });

    expect(ctx.selectedEmailId).toBe('e1');
  });
});

describe('InboxContext — resetDemo', () => {
  it('clears rawEmails and analyses after reset', async () => {
    let ctx;
    renderWithProvider((c) => { ctx = c; });

    await act(async () => {
      ctx.loadDemoInbox();
    });

    await act(async () => {
      ctx.resetDemo();
    });

    expect(ctx.rawEmails).toHaveLength(0);
    expect(ctx.analyses).toHaveLength(0);
    expect(ctx.activeFilter).toBe('all');
    expect(ctx.searchQuery).toBe('');
    expect(ctx.analysisSource).toBeNull();
    expect(ctx.selectedEmailId).toBeNull();
  });
});

describe('InboxContext — overrideStatus & resetOverride', () => {
  const BASE_ANALYSES = [
    {
      email_id: 'e1',
      status: 'needs_review',
      company_name: 'Alpha',
      job_title: 'Dev',
      risk: { level: 'low' },
      follow_up: { eligible: false, days_elapsed: 0, action_suggestion: '' },
      source: 'cached_demo',
      confidence: 0.7,
      needs_manual_review: true,
      is_manual_override: false,
      ai_suggested_status: null,
    },
  ];

  it('overrides the status for a specific email', async () => {
    let ctx;
    renderWithProvider((c) => { ctx = c; });

    // Inject base analyses directly
    await act(async () => {
      ctx.setBaseAnalyses(BASE_ANALYSES);
      ctx.loadDemoInbox();
    });

    await act(async () => {
      ctx.overrideStatus('e1', 'applied');
    });

    const overridden = ctx.analyses.find(a => a.email_id === 'e1');
    expect(overridden.status).toBe('applied');
    expect(overridden.is_manual_override).toBe(true);
  });

  it('resetOverride reverts to the original AI status', async () => {
    let ctx;
    renderWithProvider((c) => { ctx = c; });

    await act(async () => {
      ctx.setBaseAnalyses(BASE_ANALYSES);
      ctx.loadDemoInbox();
    });

    await act(async () => {
      ctx.overrideStatus('e1', 'applied');
    });

    await act(async () => {
      ctx.resetOverride('e1');
    });

    const reverted = ctx.analyses.find(a => a.email_id === 'e1');
    expect(reverted.status).toBe('needs_review');
    expect(reverted.is_manual_override).toBe(false);
  });
});

describe('InboxContext — filtering (filteredAnalyses)', () => {
  const MIXED_ANALYSES = [
    { email_id: 'e1', status: 'applied', company_name: 'Alpha', job_title: 'Dev', risk: { level: 'low' }, follow_up: { eligible: true, days_elapsed: 14, action_suggestion: 'Follow up' }, source: 'cached_demo', confidence: 0.9, needs_manual_review: false, is_manual_override: false, ai_suggested_status: null },
    { email_id: 'e2', status: 'interview', company_name: 'Beta', job_title: 'PM', risk: { level: 'high' }, follow_up: { eligible: false, days_elapsed: 3, action_suggestion: '' }, source: 'cached_demo', confidence: 0.8, needs_manual_review: false, is_manual_override: false, ai_suggested_status: null },
    { email_id: 'e3', status: 'rejected', company_name: 'Gamma', job_title: 'QA', risk: { level: 'low' }, follow_up: { eligible: false, days_elapsed: 0, action_suggestion: '' }, source: 'cached_demo', confidence: 0.95, needs_manual_review: false, is_manual_override: false, ai_suggested_status: null },
  ];

  async function setupWithAnalyses() {
    let ctx;
    renderWithProvider((c) => { ctx = c; });
    await act(async () => {
      ctx.setBaseAnalyses(MIXED_ANALYSES);
      ctx.loadDemoInbox();
    });
    return ctx;
  }

  it('returns all items when activeFilter is "all"', async () => {
    const ctx = await setupWithAnalyses();
    expect(ctx.filteredAnalyses).toHaveLength(3);
  });

  it('filters to only "applied" items when activeFilter is "applied"', async () => {
    const ctx = await setupWithAnalyses();
    await act(async () => { ctx.setActiveFilter('applied'); });
    expect(ctx.filteredAnalyses).toHaveLength(1);
    expect(ctx.filteredAnalyses[0].email_id).toBe('e1');
  });

  it('filters to only high-risk items when activeFilter is "high_risk"', async () => {
    const ctx = await setupWithAnalyses();
    await act(async () => { ctx.setActiveFilter('high_risk'); });
    expect(ctx.filteredAnalyses).toHaveLength(1);
    expect(ctx.filteredAnalyses[0].email_id).toBe('e2');
  });

  it('filters to follow_up eligible items when activeFilter is "follow_up"', async () => {
    const ctx = await setupWithAnalyses();
    await act(async () => { ctx.setActiveFilter('follow_up'); });
    expect(ctx.filteredAnalyses).toHaveLength(1);
    expect(ctx.filteredAnalyses[0].email_id).toBe('e1');
  });

  it('filters by search query on company_name (case-insensitive)', async () => {
    const ctx = await setupWithAnalyses();
    await act(async () => { ctx.setSearchQuery('alpha'); });
    expect(ctx.filteredAnalyses).toHaveLength(1);
    expect(ctx.filteredAnalyses[0].company_name).toBe('Alpha');
  });

  it('filters by search query on job_title', async () => {
    const ctx = await setupWithAnalyses();
    await act(async () => { ctx.setSearchQuery('PM'); });
    expect(ctx.filteredAnalyses).toHaveLength(1);
    expect(ctx.filteredAnalyses[0].email_id).toBe('e2');
  });

  it('returns empty array when search matches nothing', async () => {
    const ctx = await setupWithAnalyses();
    await act(async () => { ctx.setSearchQuery('xyzzy_nonexistent'); });
    expect(ctx.filteredAnalyses).toHaveLength(0);
  });
});

describe('InboxContext — useInbox outside provider throws', () => {
  it('throws a helpful error when used outside <InboxProvider>', () => {
    // Suppress console.error from React's error boundary
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function BareConsumer() {
      useInbox();
      return null;
    }
    expect(() => render(<BareConsumer />)).toThrow('useInbox must be used inside');
    consoleSpy.mockRestore();
  });
});
