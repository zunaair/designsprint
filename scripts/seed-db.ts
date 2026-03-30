/**
 * Database Seed Script
 * Creates sample users (one per tier) and sample scans with realistic audit results.
 *
 * Usage: cd apps/api && npx tsx ../../scripts/seed-db.ts
 *
 * Requires: DATABASE_URL environment variable
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_AUDIT = {
  url: 'https://example-arabic-store.com',
  scannedAt: new Date().toISOString(),
  viewport: 'desktop',
  totalScore: 72,
  grade: 'good',
  categories: [
    { category: 'direction', score: 20, maxScore: 20, issueCount: 0, issues: [], fixes: [] },
    { category: 'css-logical', score: 12, maxScore: 20, issueCount: 3, issues: [
      { category: 'css-logical', severity: 'major', element: 'stylesheet', message: 'margin-left used 14 times', details: 'Use margin-inline-start instead', selector: 'style' },
      { category: 'css-logical', severity: 'major', element: 'stylesheet', message: 'padding-right used 8 times', details: 'Use padding-inline-end instead', selector: 'style' },
      { category: 'css-logical', severity: 'minor', element: 'stylesheet', message: 'text-align: left used 3 times', details: 'Use text-align: start instead', selector: 'style' },
    ], fixes: [
      { category: 'css-logical', description: 'Replace margin-left with margin-inline-start', before: 'margin-left: 20px', after: 'margin-inline-start: 20px', type: 'css' },
    ] },
    { category: 'typography', score: 15, maxScore: 15, issueCount: 0, issues: [], fixes: [] },
    { category: 'layout-mirror', score: 10, maxScore: 15, issueCount: 1, issues: [
      { category: 'layout-mirror', severity: 'major', element: 'nav', message: 'Navigation items not reversed for RTL', selector: 'nav' },
    ], fixes: [] },
    { category: 'mobile-rtl', score: 10, maxScore: 15, issueCount: 1, issues: [
      { category: 'mobile-rtl', severity: 'minor', element: 'div', message: 'Flex container missing direction override', selector: '.hero-flex' },
    ], fixes: [] },
    { category: 'bidi', score: 5, maxScore: 10, issueCount: 2, issues: [
      { category: 'bidi', severity: 'major', element: 'span', message: 'Mixed AR/EN text without <bdi> isolation', selector: '.product-title' },
      { category: 'bidi', severity: 'minor', element: 'input', message: 'Form input missing dir="auto"', selector: 'input[name=search]' },
    ], fixes: [
      { category: 'bidi', description: 'Add <bdi> around mixed content', before: '<span>Product XYZ</span>', after: '<span><bdi>Product XYZ</bdi></span>', type: 'html' },
    ] },
    { category: 'text-overflow', score: 0, maxScore: 5, issueCount: 1, issues: [
      { category: 'text-overflow', severity: 'major', element: 'button', message: 'Arabic text clipped in CTA button', selector: '.btn-cta' },
    ], fixes: [] },
    { category: 'font-fallback', score: 0, maxScore: 0, issueCount: 0, issues: [], fixes: [] },
  ],
};

async function seed(): Promise<void> {
  console.log('Seeding database...\n');

  // Create users (one per tier)
  const freeUser = await prisma.user.upsert({
    where: { email: 'free@example.com' },
    update: {},
    create: { clerk_id: 'clerk_free_001', email: 'free@example.com', tier: 'FREE' },
  });
  console.log(`  User: ${freeUser.email} (${freeUser.tier})`);

  const starterUser = await prisma.user.upsert({
    where: { email: 'starter@example.com' },
    update: {},
    create: { clerk_id: 'clerk_starter_001', email: 'starter@example.com', tier: 'STARTER' },
  });
  console.log(`  User: ${starterUser.email} (${starterUser.tier})`);

  const proUser = await prisma.user.upsert({
    where: { email: 'pro@example.com' },
    update: {},
    create: { clerk_id: 'clerk_pro_001', email: 'pro@example.com', tier: 'PRO' },
  });
  console.log(`  User: ${proUser.email} (${proUser.tier})`);

  // Create sample scans
  const urls = [
    'https://example-arabic-store.com',
    'https://aljazeera.net',
    'https://arabic-bank.com/ar',
  ];

  for (const url of urls) {
    const scan = await prisma.scan.create({
      data: {
        url,
        email: proUser.email,
        viewport: 'both',
        status: 'COMPLETED',
        tier: 'PRO',
        scan_type: 'SINGLE_PAGE',
        user_id: proUser.id,
        desktop_result: { ...SAMPLE_AUDIT, url, viewport: 'desktop' },
        mobile_result: { ...SAMPLE_AUDIT, url, viewport: 'mobile', totalScore: 68, grade: 'needs-work' },
        completed_at: new Date(),
      },
    });
    console.log(`  Scan: ${scan.url} → ${scan.id}`);
  }

  console.log('\nSeed complete.');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
