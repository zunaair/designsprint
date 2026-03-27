'use client';

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';

export function AuthButtons() {
  const { isSignedIn, isLoaded } = useUser();

  // Not loaded yet or Clerk not configured — show nothing
  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <a
          href="/dashboard"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#E6BCC5',
            textDecoration: 'none',
            padding: '6px 14px',
            borderRadius: 8,
            background: 'rgba(199,5,45,0.1)',
            border: '1px solid rgba(199,5,45,0.25)',
          }}
        >
          Dashboard
        </a>
        <UserButton
          appearance={{
            elements: {
              avatarBox: { width: 32, height: 32 },
            },
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <SignInButton mode="modal">
        <button
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#f8fafc',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '6px 14px',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            background: 'linear-gradient(135deg, #C7052D, #9B0423)',
            border: 'none',
            padding: '6px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(199,5,45,0.3)',
          }}
        >
          Sign Up
        </button>
      </SignUpButton>
    </div>
  );
}
