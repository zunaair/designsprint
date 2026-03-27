import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { IAuditResult, CategoryScore, FixSuggestion } from '@designsprint/shared';
import { TIER_FEATURES } from '@designsprint/shared';

export interface FixPackResult {
  scanId: string;
  url: string;
  generatedAt: string;
  totalFixes: number;
  cssPatches: string;
  htmlPatches: string;
  attributePatches: string;
  fixes: FixSuggestion[];
}

@Injectable()
export class FixpackService {
  private readonly logger = new Logger(FixpackService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Generate a Fix Pack for a completed scan */
  async generateFixPack(scanId: string, userTier: string): Promise<FixPackResult> {
    const tierKey = userTier.toLowerCase() as keyof typeof TIER_FEATURES;
    if (!TIER_FEATURES[tierKey]?.showFixSuggestions) {
      throw new ForbiddenException('Fix Packs require a Starter or Pro subscription.');
    }

    const scan = await this.prisma.scan.findUnique({ where: { id: scanId } });
    if (!scan) throw new NotFoundException(`Scan "${scanId}" not found`);
    if (scan.status !== 'COMPLETED') throw new NotFoundException('Scan is not yet completed');

    const desktop = scan.desktop_result as unknown as IAuditResult | null;
    const mobile = scan.mobile_result as unknown as IAuditResult | null;

    // Collect all fixes from both viewports, deduplicate by description
    const allFixes = new Map<string, FixSuggestion>();
    const collectFixes = (audit: IAuditResult | null) => {
      if (!audit) return;
      for (const cat of audit.categories) {
        for (const fix of cat.fixes) {
          allFixes.set(fix.description, fix);
        }
      }
    };
    collectFixes(desktop);
    collectFixes(mobile);

    const fixes = Array.from(allFixes.values());

    // Generate patch files grouped by type
    const cssFixes = fixes.filter(f => f.type === 'css');
    const htmlFixes = fixes.filter(f => f.type === 'html');
    const attrFixes = fixes.filter(f => f.type === 'attribute');

    const cssPatches = this.generateCssPatches(cssFixes, scan.url);
    const htmlPatches = this.generateHtmlPatches(htmlFixes);
    const attributePatches = this.generateAttributePatches(attrFixes);

    this.logger.log(`Fix Pack for scan ${scanId}: ${fixes.length} fixes (${cssFixes.length} CSS, ${htmlFixes.length} HTML, ${attrFixes.length} attr)`);

    return {
      scanId,
      url: scan.url,
      generatedAt: new Date().toISOString(),
      totalFixes: fixes.length,
      cssPatches,
      htmlPatches,
      attributePatches,
      fixes,
    };
  }

  private generateCssPatches(fixes: FixSuggestion[], url: string): string {
    if (fixes.length === 0) return '';

    const lines = [
      `/* DesignSprint™ Fix Pack — CSS Patches */`,
      `/* URL: ${url} */`,
      `/* Generated: ${new Date().toISOString()} */`,
      `/* NOTE: Uses CSS logical properties for RTL compatibility */`,
      ``,
    ];

    for (const fix of fixes) {
      lines.push(`/* [${fix.category}] ${fix.description} */`);
      if (fix.before) lines.push(`/* Before: ${fix.before} */`);
      lines.push(`/* After:  ${fix.after} */`);
      lines.push(``);
    }

    // Generate a combined RTL fix block
    lines.push(`/* ── Combined RTL Fixes ─────────────────────────────── */`);
    lines.push(`[dir="rtl"] {`);
    for (const fix of fixes) {
      if (fix.after.includes(':')) {
        lines.push(`  ${fix.after};`);
      }
    }
    lines.push(`}`);

    return lines.join('\n');
  }

  private generateHtmlPatches(fixes: FixSuggestion[]): string {
    if (fixes.length === 0) return '';

    const lines = [
      `<!-- DesignSprint™ Fix Pack — HTML Patches -->`,
      `<!-- Apply these changes to your HTML source -->`,
      ``,
    ];

    for (const fix of fixes) {
      lines.push(`<!-- [${fix.category}] ${fix.description} -->`);
      if (fix.before) lines.push(`<!-- Before: ${fix.before} -->`);
      lines.push(`<!-- After:  ${fix.after} -->`);
      lines.push(``);
    }

    return lines.join('\n');
  }

  private generateAttributePatches(fixes: FixSuggestion[]): string {
    if (fixes.length === 0) return '';

    const lines = [
      `<!-- DesignSprint™ Fix Pack — Attribute Patches -->`,
      ``,
    ];

    for (const fix of fixes) {
      lines.push(`<!-- [${fix.category}] ${fix.description} -->`);
      if (fix.before) lines.push(`<!-- Before: ${fix.before} -->`);
      lines.push(`<!-- After:  ${fix.after} -->`);
      lines.push(``);
    }

    return lines.join('\n');
  }
}
