import type { CheckCategory } from '../types/index';
export declare const MAX_PAGES_FREE_TIER = 1;
export declare const MAX_PAGES_STARTER_TIER = 1;
export declare const MAX_PAGES_PRO_TIER = 100;
export declare const MAX_CONCURRENT_SCANS_PER_IP = 1;
export declare const MAX_FREE_SCANS_PER_EMAIL_PER_DAY = 3;
export declare const DESKTOP_VIEWPORT: {
    readonly width: 1920;
    readonly height: 1080;
};
export declare const MOBILE_VIEWPORT: {
    readonly width: 375;
    readonly height: 812;
};
export declare const SCORING_WEIGHTS: Record<CheckCategory, number>;
export declare const SCORE_THRESHOLDS: {
    readonly poor: {
        readonly min: 0;
        readonly max: 39;
    };
    readonly 'needs-work': {
        readonly min: 40;
        readonly max: 69;
    };
    readonly good: {
        readonly min: 70;
        readonly max: 89;
    };
    readonly excellent: {
        readonly min: 90;
        readonly max: 100;
    };
};
export declare const SEVERITY_DEDUCTIONS: Record<string, number>;
//# sourceMappingURL=index.d.ts.map