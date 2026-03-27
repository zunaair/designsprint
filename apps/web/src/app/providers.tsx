'use client';

import { ClerkProvider } from '@clerk/nextjs';

export function Providers({ children }: { children: React.ReactNode }) {
  const clerkKey = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];

  // If Clerk key is not configured, render without auth (dev mode)
  if (!clerkKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkKey}>
      {children}
    </ClerkProvider>
  );
}
