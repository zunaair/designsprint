export type SeverityLevel = 'critical' | 'major' | 'minor' | 'info';

export type CheckCategory =
  | 'direction'
  | 'css-logical'
  | 'typography'
  | 'layout-mirror'
  | 'mobile-rtl'
  | 'text-overflow'
  | 'bidi'
  | 'font-fallback';

export interface CheckResult {
  category: CheckCategory;
  severity: SeverityLevel;
  element?: string;
  message: string;
  details?: string;
  selector?: string;
}

export interface FixSuggestion {
  category: CheckCategory;
  description: string;
  before?: string;
  after: string;
  type: 'css' | 'html' | 'attribute';
}

export interface CategoryScore {
  category: CheckCategory;
  score: number;
  maxScore: number;
  issueCount: number;
  issues: CheckResult[];
  fixes: FixSuggestion[];
}

export interface IAuditResult {
  url: string;
  scannedAt: Date;
  viewport: 'desktop' | 'mobile';
  totalScore: number;
  grade: 'poor' | 'needs-work' | 'good' | 'excellent';
  categories: CategoryScore[];
}

export type TierLevel = 'free' | 'starter' | 'pro';

export interface IScanResult {
  id: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  tier: TierLevel;
  email: string;
  userId?: string;
  desktop?: IAuditResult;
  mobile?: IAuditResult;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface IAuditConfig {
  url: string;
  viewport: 'desktop' | 'mobile' | 'both';
  maxPages: number;
  respectRobotsTxt: boolean;
}

/** Stripped category for free-tier (no issues/fixes) */
export interface IFreeCategoryScore {
  category: CheckCategory;
  score: number;
  maxScore: number;
  issueCount: number;
}

/** Stripped audit for free-tier (no issue details) */
export interface IFreeAuditResult {
  url: string;
  scannedAt: Date;
  viewport: 'desktop' | 'mobile';
  totalScore: number;
  grade: IAuditResult['grade'];
  categories: IFreeCategoryScore[];
}

/** Free-tier scan result — score + counts only, no issue details or fixes */
export interface IScanResultFree {
  id: string;
  url: string;
  status: IScanResult['status'];
  tier: 'free';
  email: string;
  desktop?: IFreeAuditResult | undefined;
  mobile?: IFreeAuditResult | undefined;
  error?: string | undefined;
  createdAt: Date;
  completedAt?: Date | undefined;
}

/** Tier feature configuration */
export interface ITierFeatures {
  maxScansPerDay: number;
  maxPages: number;
  showIssueDetails: boolean;
  showFixSuggestions: boolean;
  pdfExport: boolean;
  competitorComparison: boolean;
  apiAccess: boolean;
}
