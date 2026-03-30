import { describe, it, expect } from 'vitest';
import { extractLinks } from '../link-extractor';

describe('extractLinks', () => {
  const baseUrl = 'https://example.com';

  it('should extract same-domain links', () => {
    const html = `
      <a href="https://example.com/about">About</a>
      <a href="https://example.com/contact">Contact</a>
      <a href="/products">Products</a>
    `;
    const links = extractLinks(html, baseUrl, 10);
    expect(links).toHaveLength(3);
    expect(links).toContain('https://example.com/about');
    expect(links).toContain('https://example.com/contact');
    expect(links).toContain('https://example.com/products');
  });

  it('should skip external domain links', () => {
    const html = `
      <a href="https://example.com/internal">Internal</a>
      <a href="https://other-site.com/external">External</a>
    `;
    const links = extractLinks(html, baseUrl, 10);
    expect(links).toHaveLength(1);
    expect(links[0]).toContain('example.com');
  });

  it('should skip non-page extensions', () => {
    const html = `
      <a href="/page">Page</a>
      <a href="/image.jpg">Image</a>
      <a href="/style.css">CSS</a>
      <a href="/script.js">JS</a>
      <a href="/doc.pdf">PDF</a>
    `;
    const links = extractLinks(html, baseUrl, 10);
    expect(links).toHaveLength(1);
    expect(links[0]).toContain('/page');
  });

  it('should respect maxPages limit', () => {
    const html = Array.from({ length: 20 }, (_, i) =>
      `<a href="/page-${i}">Page ${i}</a>`
    ).join('\n');
    const links = extractLinks(html, baseUrl, 5);
    expect(links.length).toBeLessThanOrEqual(4); // maxPages-1 (root counts as 1)
  });

  it('should deduplicate URLs', () => {
    const html = `
      <a href="/about">About 1</a>
      <a href="/about">About 2</a>
      <a href="/about/">About trailing slash</a>
    `;
    const links = extractLinks(html, baseUrl, 10);
    expect(links).toHaveLength(1);
  });

  it('should handle empty HTML', () => {
    const links = extractLinks('', baseUrl, 10);
    expect(links).toHaveLength(0);
  });

  it('should skip hash-only links', () => {
    const html = `<a href="#section">Section</a>`;
    const links = extractLinks(html, baseUrl, 10);
    expect(links).toHaveLength(0);
  });
});
