"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARABIC_REGEX = void 0;
exports.containsArabic = containsArabic;
exports.arabicCharCount = arabicCharCount;
exports.arabicRatio = arabicRatio;
exports.isPredominantlyArabic = isPredominantlyArabic;
/**
 * Regex covering all Arabic Unicode blocks:
 * - Arabic (U+0600–U+06FF)
 * - Arabic Supplement (U+0750–U+077F)
 * - Arabic Extended-A (U+08A0–U+08FF)
 * - Arabic Presentation Forms-A (U+FB50–U+FDFF)
 * - Arabic Presentation Forms-B (U+FE70–U+FEFF)
 */
exports.ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
function containsArabic(text) {
    return exports.ARABIC_REGEX.test(text);
}
function arabicCharCount(text) {
    return (text.match(new RegExp(exports.ARABIC_REGEX.source, 'g')) ?? []).length;
}
function arabicRatio(text) {
    if (text.length === 0)
        return 0;
    return arabicCharCount(text) / text.length;
}
/** Returns true if the text is predominantly Arabic (>50% Arabic characters) */
function isPredominantlyArabic(text) {
    return arabicRatio(text) > 0.5;
}
//# sourceMappingURL=arabic-detect.js.map