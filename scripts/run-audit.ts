/**
 * CLI Audit Runner
 * Usage: pnpm --filter api run audit -- --url "https://example.com/ar"
 *        pnpm --filter api run audit -- --url "https://example.com" --viewport both
 */
import { chromium } from 'playwright';
import {
  DirectionCheck,
  CssLogicalCheck,
  TypographyCheck,
  LayoutMirrorCheck,
  MobileRtlCheck,
  TextOverflowCheck,
  BidiCheck,
  FontFallbackCheck,
} from '../apps/api/src/modules/audit/checks/index.js';
import type { BaseCheck } from '../apps/api/src/modules/audit/checks/base.check.js';
import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT, SCORE_THRESHOLDS } from '../packages/shared/src/index.js';
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

// --- Check registry ---
const checks: BaseCheck[] = [
  new DirectionCheck(),
  new CssLogicalCheck(),
  new TypographyCheck(),
  new LayoutMirrorCheck(),
  new MobileRtlCheck(),
  new TextOverflowCheck(),
  new BidiCheck(),
  new FontFallbackCheck(),
];

interface WeightCategory {
  id: string;
  max_score: number;
  label: string;
}

const weightCategories = (scoringWeightsData as { categories: WeightCategory[] }).categories;

function getMaxScore(category: CheckCategory): number {
  return weightCategories.find((c) => c.id === category)?.max_score ?? 0;
}

function getGrade(score: number): IAuditResult['grade'] {
  if (score <= SCORE_THRESHOLDS.poor.max) return 'poor';
  if (score <= SCORE_THRESHOLDS['needs-work'].max) return 'needs-work';
  if (score <= SCORE_THRESHOLDS.good.max) return 'good';
  return 'excellent';
}

const GRADE_COLORS: Record<IAuditResult['grade'], string> = {
  poor: '\x1b[31m',        // red
  'needs-work': '\x1b[33m', // orange/yellow
  good: '\x1b[93m',        // bright yellow
  excellent: '\x1b[32m',   // green
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

async function runAuditForViewport(
  url: string,
  vp: 'desktop' | 'mobile'
): Promise<IAuditResult> {
  const viewportSize = vp === 'desktop' ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: viewportSize,
    locale: 'ar-SA',
    userAgent:
      vp === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : undefined,
  });
  const page = await context.newPage();

  try {
    process.stdout.write(`\n${DIM}Loading ${url} [${vp}]...${RESET}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    process.stdout.write(` done\n`);

    const categories: CategoryScore[] = [];
    let totalScore = 0;

    for (const check of checks) {
      process.stdout.write(`${DIM}  Running ${check.category} check...${RESET}\r`);
      try {
        const results = await check.run(page);
        const fixes = check.fixes(results);
        const maxScore = getMaxScore(check.category as CheckCategory);
        const score = check.score(results);
        totalScore += score;
        categories.push({
          category: check.category as CheckCategory,
          score,
          maxScore,
          issueCount: results.length,
          issues: results,
          fixes,
        });
      } catch (err) {
        console.error(`\n  ⚠️  Check "${check.category}" threw an error: ${String(err)}`);
        const maxScore = getMaxScore(check.category as CheckCategory);
        categories.push({
          category: check.category as CheckCategory,
          score: 0,
          maxScore,
          issueCount: 0,
          issues: [],
          fixes: [],
        });
      }
    }

    process.stdout.write('                                          \r'); // Clear progress line

    return {
      url,
      scannedAt: new Date(),
      viewport: vp,
      totalScore,
      grade: getGrade(totalScore),
      categories,
    };
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

function printReport(result: IAuditResult): void {
  const gradeColor = GRADE_COLORS[result.grade];
  const gradeLabel = result.grade.toUpperCase().replace('-', ' ');

  console.log(`\n${'─'.repeat(60)}`);
  console.log(
    `${BOLD}${result.viewport.toUpperCase()} REPORT${RESET}  —  ${result.url}`
  );
  console.log(`${'─'.repeat(60)}`);
  console.log(
    `${BOLD}Total Score: ${gradeColor}${result.totalScore}/100 — ${gradeLabel}${RESET}`
  );
  console.log(`Scanned at: ${result.scannedAt.toISOString()}\n`);

  for (const cat of result.categories) {
    const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 100;
    const barFilled = Math.round(pct / 5);
    const bar = '█'.repeat(barFilled) + '░'.repeat(20 - barFilled);
    const label = weightCategories.find((c) => c.id === cat.category)?.label ?? cat.category;

    console.log(
      `${BOLD}${label.padEnd(25)}${RESET} ${bar} ${cat.score}/${cat.maxScore} (${pct}%) — ${cat.issueCount} issue(s)`
    );

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
        if (fix.before) {
          console.log(`${DIM}Before:${RESET}\n${fix.before}`);
        }
        console.log(`${DIM}After:${RESET}\n${fix.after}`);
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}\n`);
}

// --- Main ---
async function main(): Promise<void> {
  console.log(`\n${BOLD}DesignSprint™ Arabic UX Audit${RESET}`);
  console.log(`URL: ${targetUrl}`);
  console.log(`Viewport: ${viewport}`);

  const viewportsToRun: Array<'desktop' | 'mobile'> =
    viewport === 'both' ? ['desktop', 'mobile'] : [viewport];

  for (const vp of viewportsToRun) {
    const result = await runAuditForViewport(targetUrl, vp);
    printReport(result);
  }
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
