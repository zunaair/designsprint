'use client';

import { useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { initPostHog } from '../lib/posthog';

export function Providers({ children }: { children: React.ReactNode }) {
  const clerkKey = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? '';

  // Initialize PostHog on mount (client-side only, only when key is set)
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <ClerkProvider publishableKey={clerkKey}>
      {children}
    </ClerkProvider>
  );
}
