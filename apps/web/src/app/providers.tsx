'use client';

import { useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { initPostHog } from '../lib/posthog';
import { LocaleProvider } from '../i18n/use-locale';

export function Providers({ children }: { children: React.ReactNode }) {
  const clerkKey = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? '';

  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <ClerkProvider publishableKey={clerkKey}>
      <LocaleProvider>
        {children}
      </LocaleProvider>
    </ClerkProvider>
  );
}
