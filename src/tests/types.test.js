/**
 * Tests: types/index.js
 * Covers: STATUS, RISK_LEVEL, ANALYSIS_SOURCE enums, computeDashboardStats
 */

import { describe, it, expect } from 'vitest';
import {
  STATUS,
  STATUS_VALUES,
  STATUS_LABELS,
  STATUS_BADGE_CLASS,
  RISK_LEVEL,
  RISK_LEVEL_VALUES,
  RISK_LABELS,
  ANALYSIS_SOURCE,
  computeDashboardStats,
} from '../../types/index.js';

// ─────────────────────────────────────────────
// Enum shape tests
// ─────────────────────────────────────────────
describe('STATUS enum', () => {
  it('contains all required keys', () => {
    expect(STATUS).toHaveProperty('APPLIED', 'applied');
    expect(STATUS).toHaveProperty('INTERVIEW', 'interview');
    expect(STATUS).toHaveProperty('REJECTED', 'rejected');
    expect(STATUS).toHaveProperty('OFFER', 'offer');
    expect(STATUS).toHaveProperty('NEEDS_REVIEW', 'needs_review');
  });

  it('STATUS_VALUES contains exactly 5 values', () => {
    expect(STATUS_VALUES).toHaveLength(5);
    expect(STATUS_VALUES).toContain('applied');
    expect(STATUS_VALUES).toContain('needs_review');
  });

  it('STATUS_LABELS has a label for every status value', () => {
    for (const v of STATUS_VALUES) {
      expect(STATUS_LABELS[v]).toBeTruthy();
    }
  });

  it('STATUS_BADGE_CLASS has a class for every status value', () => {
    for (const v of STATUS_VALUES) {
      expect(STATUS_BADGE_CLASS[v]).toBeTruthy();
    }
  });
});

describe('RISK_LEVEL enum', () => {
  it('contains low, medium, high, unknown', () => {
    expect(RISK_LEVEL).toHaveProperty('LOW', 'low');
    expect(RISK_LEVEL).toHaveProperty('MEDIUM', 'medium');
    expect(RISK_LEVEL).toHaveProperty('HIGH', 'high');
    expect(RISK_LEVEL).toHaveProperty('UNKNOWN', 'unknown');
  });

  it('RISK_LEVEL_VALUES contains exactly 4 values', () => {
    expect(RISK_LEVEL_VALUES).toHaveLength(4);
  });

  it('RISK_LABELS has a label for every risk level', () => {
    for (const v of RISK_LEVEL_VALUES) {
      expect(RISK_LABELS[v]).toBeTruthy();
    }
  });
});

describe('ANALYSIS_SOURCE enum', () => {
  it('has live_ai and cached_demo values', () => {
    expect(ANALYSIS_SOURCE.LIVE_AI).toBe('live_ai');
    expect(ANALYSIS_SOURCE.CACHED_DEMO).toBe('cached_demo');
    expect(ANALYSIS_SOURCE.MANUAL_OVERRIDE).toBe('manual_override');
  });
});

// ─────────────────────────────────────────────
// computeDashboardStats
// ─────────────────────────────────────────────
describe('computeDashboardStats', () => {
  const makeAnalysis = (status, riskLevel = 'low', followUpEligible = false) => ({
    status,
    risk: { level: riskLevel },
    follow_up: { eligible: followUpEligible },
  });

  it('counts total correctly', () => {
    const analyses = [
      makeAnalysis('applied'),
      makeAnalysis('interview'),
      makeAnalysis('rejected'),
    ];
    const stats = computeDashboardStats(analyses);
    expect(stats.total).toBe(3);
  });

  it('counts each status correctly', () => {
    const analyses = [
      makeAnalysis('applied'),
      makeAnalysis('applied'),
      makeAnalysis('interview'),
      makeAnalysis('rejected'),
      makeAnalysis('offer'),
      makeAnalysis('needs_review'),
    ];
    const stats = computeDashboardStats(analyses);
    expect(stats.applied).toBe(2);
    expect(stats.interview).toBe(1);
    expect(stats.rejected).toBe(1);
    expect(stats.offer).toBe(1);
    expect(stats.needs_review).toBe(1);
  });

  it('counts high_risk correctly', () => {
    const analyses = [
      makeAnalysis('applied', 'high'),
      makeAnalysis('interview', 'low'),
      makeAnalysis('rejected', 'high'),
    ];
    const stats = computeDashboardStats(analyses);
    expect(stats.high_risk).toBe(2);
  });

  it('counts follow_ups_due correctly', () => {
    const analyses = [
      makeAnalysis('applied', 'low', true),
      makeAnalysis('interview', 'low', true),
      makeAnalysis('offer', 'low', false),
    ];
    const stats = computeDashboardStats(analyses);
    expect(stats.follow_ups_due).toBe(2);
  });

  it('returns all-zero stats for empty array', () => {
    const stats = computeDashboardStats([]);
    expect(stats.total).toBe(0);
    expect(stats.applied).toBe(0);
    expect(stats.high_risk).toBe(0);
    expect(stats.follow_ups_due).toBe(0);
  });

  it('treats unknown status as needs_review', () => {
    const analyses = [{ status: undefined, risk: { level: 'low' }, follow_up: { eligible: false } }];
    const stats = computeDashboardStats(analyses);
    expect(stats.needs_review).toBe(1);
  });

  it('handles missing risk or follow_up gracefully', () => {
    const analyses = [{ status: 'applied', risk: null, follow_up: null }];
    // Should not throw
    expect(() => computeDashboardStats(analyses)).not.toThrow();
    const stats = computeDashboardStats(analyses);
    expect(stats.high_risk).toBe(0);
    expect(stats.follow_ups_due).toBe(0);
  });
});
