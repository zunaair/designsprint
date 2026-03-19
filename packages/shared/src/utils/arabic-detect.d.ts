/**
 * Regex covering all Arabic Unicode blocks:
 * - Arabic (U+0600–U+06FF)
 * - Arabic Supplement (U+0750–U+077F)
 * - Arabic Extended-A (U+08A0–U+08FF)
 * - Arabic Presentation Forms-A (U+FB50–U+FDFF)
 * - Arabic Presentation Forms-B (U+FE70–U+FEFF)
 */
export declare const ARABIC_REGEX: RegExp;
export declare function containsArabic(text: string): boolean;
export declare function arabicCharCount(text: string): number;
export declare function arabicRatio(text: string): number;
/** Returns true if the text is predominantly Arabic (>50% Arabic characters) */
export declare function isPredominantlyArabic(text: string): boolean;
//# sourceMappingURL=arabic-detect.d.ts.map