import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import type { IAuditResult, CategoryScore } from '@designsprint/shared';
import { TIER_FEATURES } from '@designsprint/shared';

const BRAND_RED = '#C7052D';
const BRAND_DARK = '#1A1A2E';

const GRADE_COLORS: Record<string, string> = {
  poor: '#EF4444',
  'needs-work': '#F97316',
  good: '#EAB308',
  excellent: '#22C55E',
};

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Generate a branded PDF report for a completed scan */
  async generatePdf(scanId: string, userTier: string): Promise<Buffer> {
    // Tier check: only paid tiers get PDF
    const tierKey = userTier.toLowerCase() as keyof typeof TIER_FEATURES;
    if (!TIER_FEATURES[tierKey]?.pdfExport) {
      throw new ForbiddenException('PDF export requires a Starter or Pro subscription.');
    }

    const scan = await this.prisma.scan.findUnique({ where: { id: scanId } });
    if (!scan) throw new NotFoundException(`Scan "${scanId}" not found`);
    if (scan.status !== 'COMPLETED') throw new NotFoundException('Scan is not yet completed');

    const desktop = scan.desktop_result as unknown as IAuditResult | null;
    const mobile = scan.mobile_result as unknown as IAuditResult | null;

    this.logger.log(`Generating PDF for scan ${scanId}`);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ──
      doc.rect(0, 0, doc.page.width, 80).fill(BRAND_DARK);
      doc.fontSize(22).fillColor('#FFFFFF').text('DesignSprint™', 50, 25, { continued: true });
      doc.fontSize(12).fillColor('#E6BCC5').text('  Arabic UX Audit Report', { continued: false });
      doc.fontSize(10).fillColor('#94a3b8').text(`Generated ${new Date().toLocaleDateString('en-GB')}`, 50, 52);

      doc.moveDown(2);

      // ── Scan info ──
      doc.fillColor('#1A1A2E');
      doc.fontSize(11).text(`URL: ${scan.url}`, 50);
      doc.text(`Email: ${scan.email}`);
      doc.text(`Scan ID: ${scan.id}`);
      doc.text(`Date: ${scan.created_at.toISOString().split('T')[0]}`);
      doc.moveDown(1);

      // ── Results ──
      if (desktop) this.renderAuditSection(doc, desktop, 'Desktop');
      if (mobile) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, 4).fill(BRAND_RED);
        doc.moveDown(1);
        this.renderAuditSection(doc, mobile, 'Mobile');
      }

      // ── Footer ──
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#64748b');
      doc.text('Powered by DesignSprint™ — Pixelette Technologies', 50, doc.page.height - 50, { align: 'center' });

      doc.end();
    });
  }

  private renderAuditSection(doc: PDFKit.PDFDocument, audit: IAuditResult, label: string): void {
    const gradeColor = GRADE_COLORS[audit.grade] ?? '#64748b';

    // Score header
    doc.fontSize(16).fillColor(BRAND_RED).text(`${label} Report`, 50);
    doc.moveDown(0.3);
    doc.fontSize(28).fillColor(gradeColor).text(`${audit.totalScore}/100`, 50);
    doc.fontSize(12).fillColor('#64748b').text(
      `Grade: ${audit.grade.toUpperCase().replace('-', ' ')}`,
    );
    doc.moveDown(1);

    // Category breakdown
    doc.fontSize(13).fillColor(BRAND_DARK).text('Category Breakdown', 50);
    doc.moveDown(0.5);

    for (const cat of audit.categories) {
      this.renderCategory(doc, cat);
    }
  }

  private renderCategory(doc: PDFKit.PDFDocument, cat: CategoryScore): void {
    const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 100;
    const barWidth = 200;
    const filledWidth = (pct / 100) * barWidth;

    // Category name + score
    doc.fontSize(10).fillColor(BRAND_DARK);
    doc.text(`${cat.category}`, 50, undefined, { continued: true });
    doc.fillColor('#64748b').text(`  ${cat.score}/${cat.maxScore} (${pct}%) — ${cat.issueCount} issue(s)`);

    // Progress bar
    const y = doc.y + 2;
    doc.rect(50, y, barWidth, 6).fill('#e2e8f0');
    if (filledWidth > 0) {
      const barColor = pct >= 80 ? '#22C55E' : pct >= 50 ? '#EAB308' : '#EF4444';
      doc.rect(50, y, filledWidth, 6).fill(barColor);
    }
    doc.y = y + 12;

    // Issues (up to 5 per category)
    if (cat.issues.length > 0) {
      for (const issue of cat.issues.slice(0, 5)) {
        const sevColor = issue.severity === 'critical' ? '#EF4444' : issue.severity === 'major' ? '#F97316' : '#64748b';
        doc.fontSize(8).fillColor(sevColor).text(`  [${issue.severity}] ${issue.message}`, 60);
      }
      if (cat.issues.length > 5) {
        doc.fontSize(8).fillColor('#94a3b8').text(`  ... and ${cat.issues.length - 5} more`, 60);
      }
    }

    // Fixes (first one)
    if (cat.fixes.length > 0) {
      doc.fontSize(8).fillColor('#22C55E').text(`  Fix: ${cat.fixes[0]!.description}`, 60);
    }

    doc.moveDown(0.5);
  }
}
