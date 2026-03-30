/**
 * Simple robots.txt parser.
 * Fetches and parses robots.txt from the target domain.
 * Returns whether a given path is allowed for our user-agent.
 */

interface RobotsRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
}

export async function isUrlAllowed(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const robotsUrl = `${parsed.protocol}//${parsed.hostname}/robots.txt`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'DesignSprint/1.0' },
    });
    clearTimeout(timeout);

    if (!res.ok) return true; // No robots.txt = allow everything

    const text = await res.text();
    const rules = parseRobotsTxt(text);
    return checkPath(rules, parsed.pathname);
  } catch {
    // Can't fetch robots.txt — assume allowed
    return true;
  }
}

function parseRobotsTxt(text: string): RobotsRule[] {
  const rules: RobotsRule[] = [];
  let current: RobotsRule | null = null;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;

    const [key, ...valueParts] = trimmed.split(':');
    const value = valueParts.join(':').trim();

    if (!key || !value) continue;

    const lowerKey = key.toLowerCase().trim();

    if (lowerKey === 'user-agent') {
      current = { userAgent: value.toLowerCase(), disallow: [], allow: [] };
      rules.push(current);
    } else if (current && lowerKey === 'disallow') {
      current.disallow.push(value);
    } else if (current && lowerKey === 'allow') {
      current.allow.push(value);
    }
  }

  return rules;
}

function checkPath(rules: RobotsRule[], path: string): boolean {
  // Find rules that apply to us (our user-agent or wildcard *)
  const applicableRules = rules.filter(
    (r) => r.userAgent === '*' || r.userAgent === 'designsprint',
  );

  if (applicableRules.length === 0) return true; // No rules = allow

  for (const rule of applicableRules) {
    // Check allows first (allow takes precedence)
    for (const pattern of rule.allow) {
      if (pathMatches(path, pattern)) return true;
    }

    // Check disallows
    for (const pattern of rule.disallow) {
      if (pattern === '' || pattern === '/') {
        // Disallow all — but only if no allow overrides
        if (rule.allow.length === 0) return false;
      }
      if (pathMatches(path, pattern)) return false;
    }
  }

  return true;
}

function pathMatches(path: string, pattern: string): boolean {
  if (!pattern) return false;
  if (pattern === '/') return true;

  // Simple prefix matching (covers 95% of robots.txt in the wild)
  if (pattern.endsWith('*')) {
    return path.startsWith(pattern.slice(0, -1));
  }

  return path.startsWith(pattern);
}
