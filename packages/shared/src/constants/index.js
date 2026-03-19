"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEVERITY_DEDUCTIONS = exports.SCORE_THRESHOLDS = exports.SCORING_WEIGHTS = exports.MOBILE_VIEWPORT = exports.DESKTOP_VIEWPORT = exports.MAX_FREE_SCANS_PER_EMAIL_PER_DAY = exports.MAX_CONCURRENT_SCANS_PER_IP = exports.MAX_PAGES_PRO_TIER = exports.MAX_PAGES_STARTER_TIER = exports.MAX_PAGES_FREE_TIER = void 0;
exports.MAX_PAGES_FREE_TIER = 1;
exports.MAX_PAGES_STARTER_TIER = 1;
exports.MAX_PAGES_PRO_TIER = 100;
exports.MAX_CONCURRENT_SCANS_PER_IP = 1;
exports.MAX_FREE_SCANS_PER_EMAIL_PER_DAY = 3;
exports.DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
exports.MOBILE_VIEWPORT = { width: 375, height: 812 };
exports.SCORING_WEIGHTS = {
    direction: 20,
    'css-logical': 20,
    typography: 15,
    'layout-mirror': 15,
    'mobile-rtl': 15,
    bidi: 10,
    'text-overflow': 5,
    'font-fallback': 0, // font-fallback is included in typography weight
};
exports.SCORE_THRESHOLDS = {
    poor: { min: 0, max: 39 },
    'needs-work': { min: 40, max: 69 },
    good: { min: 70, max: 89 },
    excellent: { min: 90, max: 100 },
};
exports.SEVERITY_DEDUCTIONS = {
    critical: 10,
    major: 5,
    minor: 2,
    info: 0,
};
//# sourceMappingURL=index.js.map