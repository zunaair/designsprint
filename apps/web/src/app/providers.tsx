'use client';

import { ClerkProvider } from '@clerk/nextjs';

/**
 * Always wraps with ClerkProvider.
 * When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set, Clerk runs in
 * "keyless mode" — hooks return safe defaults (not signed in, not loaded).
 * This avoids conditional hook calls throughout the app.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const clerkKey = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? '';

  return (
    <ClerkProvider publishableKey={clerkKey}>
      {children}
    </ClerkProvider>
  );
}
