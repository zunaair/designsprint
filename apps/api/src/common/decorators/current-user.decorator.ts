import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
  clerkId: string;
  email: string | undefined;
}

/** Extract the authenticated user from the request (set by ClerkAuthGuard) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as Request & { user?: AuthUser }).user ?? null;
  },
);
