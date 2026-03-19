import type { CheckCategory } from '../types/index';

export const MAX_PAGES_FREE_TIER = 1;
export const MAX_PAGES_STARTER_TIER = 1;
export const MAX_PAGES_PRO_TIER = 100;
export const MAX_CONCURRENT_SCANS_PER_IP = 1;
export const MAX_FREE_SCANS_PER_EMAIL_PER_DAY = 3;

export const DESKTOP_VIEWPORT = { width: 1920, height: 1080 } as const;
export const MOBILE_VIEWPORT = { width: 375, height: 812 } as const;

export const SCORING_WEIGHTS: Record<CheckCategory, number> = {
  direction: 20,
  'css-logical': 20,
  typography: 15,
  'layout-mirror': 15,
  'mobile-rtl': 15,
  bidi: 10,
  'text-overflow': 5,
  'font-fallback': 0, // font-fallback is included in typography weight
} as const;

export const SCORE_THRESHOLDS = {
  poor: { min: 0, max: 39 },
  'needs-work': { min: 40, max: 69 },
  good: { min: 70, max: 89 },
  excellent: { min: 90, max: 100 },
} as const;

export const SEVERITY_DEDUCTIONS: Record<string, number> = {
  critical: 10,
  major: 5,
  minor: 2,
  info: 0,
} as const;
