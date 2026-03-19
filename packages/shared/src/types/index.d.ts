export type SeverityLevel = 'critical' | 'major' | 'minor' | 'info';
export type CheckCategory = 'direction' | 'css-logical' | 'typography' | 'layout-mirror' | 'mobile-rtl' | 'text-overflow' | 'bidi' | 'font-fallback';
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
export interface IScanResult {
    id: string;
    url: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
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
//# sourceMappingURL=index.d.ts.map