'use client';

import posthog from 'posthog-js';

let initialized = false;

/** Initialize PostHog analytics (only runs once, only when key is configured) */
export function initPostHog(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  const key = process.env['NEXT_PUBLIC_POSTHOG_KEY'];
  const host = process.env['NEXT_PUBLIC_POSTHOG_HOST'] ?? 'https://us.i.posthog.com';

  if (!key) return;

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    loaded: () => {
      initialized = true;
    },
  });
}

/** Track a custom event */
export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const key = process.env['NEXT_PUBLIC_POSTHOG_KEY'];
  if (!key) return;
  posthog.capture(event, properties);
}

/** Identify a user (call after sign-in) */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const key = process.env['NEXT_PUBLIC_POSTHOG_KEY'];
  if (!key) return;
  posthog.identify(userId, traits);
}

export { posthog };
