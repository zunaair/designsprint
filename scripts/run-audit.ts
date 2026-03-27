/**
 * CLI Audit Runner (HTTP-based static analysis)
 * Usage: pnpm --filter api run audit -- --url "https://example.com/ar"
 *        pnpm --filter api run audit -- --url "https://example.com" --viewport both
 */
import { SCORE_THRESHOLDS } from '../packages/shared/src/index.js';
import type { CategoryScore, CheckCategory, IAuditResult } from '../packages/shared/src/index.js';
import scoringWeightsData from '../packages/audit-rules/scoring-weights.json' assert { type: 'json' };

// --- Argument parsing ---
const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
const viewportIndex = args.indexOf('--viewport');

if (urlIndex === -1 || !args[urlIndex + 1]) {
  console.error('Usage: run-audit.ts --url <URL> [--viewport desktop|mobile|both]');
  process.exit(1);
}

const targetUrl = args[urlIndex + 1] as string;
const viewportArg = (args[viewportIndex + 1] as string | undefined) ?? 'both';

if (!['desktop', 'mobile', 'both'].includes(viewportArg)) {
  console.error('--viewport must be one of: desktop, mobile, both');
  process.exit(1);
}

const viewport = viewportArg as 'desktop' | 'mobile' | 'both';

interface WeightCategory {
  id: string;
  max_score: number;
  label: string;
}

const weightCategories = (scoringWeightsData as { categories: WeightCategory[] }).categories;

function getGrade(score: number): IAuditResult['grade'] {
  if (score <= SCORE_THRESHOLDS.poor.max) return 'poor';
  if (score <= SCORE_THRESHOLDS['needs-work'].max) return 'needs-work';
  if (score <= SCORE_THRESHOLDS.good.max) return 'good';
  return 'excellent';
}

const GRADE_COLORS: Record<IAuditResult['grade'], string> = {
  poor: '\x1b[31m',
  'needs-work': '\x1b[33m',
  good: '\x1b[93m',
  excellent: '\x1b[32m',
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

const SEVERITY_ICONS: Record<string, string> = {
  critical: '🔴',
  major: '🟠',
  minor: '🟡',
  info: '⚪',
};

/**
 * Fetch HTML and run static analysis.
 * This mirrors the logic in CrawlerService without NestJS DI.
 */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function printReport(result: IAuditResult): void {
  const gradeColor = GRADE_COLORS[result.grade];
  const gradeLabel = result.grade.toUpperCase().replace('-', ' ');

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`${BOLD}${result.viewport.toUpperCase()} REPORT${RESET}  —  ${result.url}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`${BOLD}Total Score: ${gradeColor}${result.totalScore}/100 — ${gradeLabel}${RESET}`);
  console.log(`Scanned at: ${result.scannedAt.toISOString()}\n`);

  for (const cat of result.categories) {
    const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 100;
    const barFilled = Math.round(pct / 5);
    const bar = '█'.repeat(barFilled) + '░'.repeat(20 - barFilled);
    const label = weightCategories.find((c) => c.id === cat.category)?.label ?? cat.category;

    console.log(`${BOLD}${label.padEnd(25)}${RESET} ${bar} ${cat.score}/${cat.maxScore} (${pct}%) — ${cat.issueCount} issue(s)`);

    if (cat.issues.length > 0) {
      for (const issue of cat.issues.slice(0, 3)) {
        const icon = SEVERITY_ICONS[issue.severity] ?? '•';
        console.log(`  ${icon} ${DIM}[${issue.severity}]${RESET} ${issue.message}`);
      }
      if (cat.issues.length > 3) {
        console.log(`  ${DIM}  ... and ${cat.issues.length - 3} more issue(s)${RESET}`);
      }
    }

    if (cat.fixes.length > 0) {
      console.log(`  ${DIM}Fix available: ${cat.fixes[0]?.description ?? ''}${RESET}`);
    }

    console.log();
  }

  if (result.categories.some((c) => c.fixes.length > 0)) {
    console.log(`${'─'.repeat(60)}`);
    console.log(`${BOLD}FIX SUGGESTIONS${RESET}`);
    console.log(`${'─'.repeat(60)}`);
    for (const cat of result.categories) {
      for (const fix of cat.fixes) {
        console.log(`\n${BOLD}[${fix.category}]${RESET} ${fix.description}`);
        if (fix.before) console.log(`${DIM}Before:${RESET}\n${fix.before}`);
        console.log(`${DIM}After:${RESET}\n${fix.after}`);
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}\n`);
}

async function main(): Promise<void> {
  console.log(`\n${BOLD}DesignSprint™ Arabic UX Audit (Static Analysis)${RESET}`);
  console.log(`URL: ${targetUrl}`);
  console.log(`Viewport: ${viewport}`);
  console.log(`${DIM}Note: Uses HTTP fetch + regex analysis (not headless browser)${RESET}`);

  process.stdout.write(`\n${DIM}Fetching ${targetUrl}...${RESET}`);
  const html = await fetchHtml(targetUrl);
  process.stdout.write(` done (${html.length} bytes)\n`);

  // Import CrawlerService dynamically to avoid NestJS DI issues
  const { CrawlerService } = await import('../apps/api/src/modules/crawler/crawler.service.js');
  const { ScoringService } = await import('../apps/api/src/modules/audit/scoring/scoring.service.js');

  const scoring = new ScoringService();
  const crawler = new CrawlerService(scoring);

  const result = await crawler.auditUrl({ url: targetUrl, viewport, maxPages: 1, respectRobotsTxt: false });

  if (result.desktop) printReport(result.desktop);
  if (result.mobile) printReport(result.mobile);
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
