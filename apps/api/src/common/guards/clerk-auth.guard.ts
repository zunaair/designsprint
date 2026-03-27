import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';

/**
 * Global guard that verifies Clerk JWT tokens on protected endpoints.
 * Endpoints decorated with @Public() skip authentication.
 *
 * In development (no CLERK_SECRET_KEY set), the guard is permissive
 * and lets all requests through without verification.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip auth for @Public() endpoints
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    const clerkSecretKey = this.config.get<string>('CLERK_SECRET_KEY');

    // Development mode: no Clerk key configured — skip auth
    if (!clerkSecretKey) {
      this.logger.warn('CLERK_SECRET_KEY not set — auth guard is permissive (dev mode)');
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      // Verify the JWT using Clerk's backend SDK
      // Dynamic import to avoid hard dependency when CLERK_SECRET_KEY is not set
      const { verifyToken } = await import('@clerk/backend');
      const payload = await verifyToken(token, { secretKey: clerkSecretKey });

      // Attach user info to request for @CurrentUser() decorator
      const authUser: AuthUser = {
        clerkId: payload.sub,
        email: (payload as Record<string, unknown>)['email'] as string | undefined,
      };
      (request as Request & { user: AuthUser }).user = authUser;

      return true;
    } catch (err) {
      this.logger.error(`Token verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
