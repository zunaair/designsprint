/**
 * Regex covering all Arabic Unicode blocks:
 * - Arabic (U+0600–U+06FF)
 * - Arabic Supplement (U+0750–U+077F)
 * - Arabic Extended-A (U+08A0–U+08FF)
 * - Arabic Presentation Forms-A (U+FB50–U+FDFF)
 * - Arabic Presentation Forms-B (U+FE70–U+FEFF)
 */
export const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsArabic(text: string): boolean {
  return ARABIC_REGEX.test(text);
}

export function arabicCharCount(text: string): number {
  return (text.match(new RegExp(ARABIC_REGEX.source, 'g')) ?? []).length;
}

export function arabicRatio(text: string): number {
  if (text.length === 0) return 0;
  return arabicCharCount(text) / text.length;
}

/** Returns true if the text is predominantly Arabic (>50% Arabic characters) */
export function isPredominantlyArabic(text: string): boolean {
  return arabicRatio(text) > 0.5;
}
